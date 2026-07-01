"""
fetch_veteran_jst.py — Vets vs JST data from the CPL potential-savings API
==========================================================================
The CCCCO MAP CPL Dashboard's `potential-savings` API carries the two
veteran-program counts the MAP Dash shows as "Vets/JST+" (Sam, 2026-07-01 —
this is exactly what the MAP Dash displays, matching field-for-field):

  EnrolledMilitaryStudents  → "Vets" — veterans a college REPORTS to MIS annually
  MilitaryStudents          → "JST"  — military students served via an uploaded
                                       JST (the MAP Dash's "JST" number)

  % = JST / Vets   ·   Star = when JST ≥ 75% of Vets

NOTE (2026-07-01 correction): the "JST" number is `MilitaryStudents`, NOT
`VeteransWithJSTs`. The MAP Dash's second number matches `MilitaryStudents`
field-for-field (statewide 24,885; Antelope 266; Bakersfield 541), and with it
the 75%-rule star count lands on EXACTLY MAP's `StarCollegeCount` (50).
`VeteransWithJSTs` (statewide ~23.5k) is a different, unused field. Do NOT use
the label "MIL" — the first number is "Vets".

This script fetches the same public API the worker uses (no auth) and writes
`veteran_jst.json` — statewide totals + per-college {vets, jst, star}. The
generator (excel_to_dashboard.py) reads it to (a) put the real Vets/JST on the
Veteran Sprint KPI card and (b) add a "Vets / JST" column + the Veteran Star to
the College Activity table.

Runs on a GitHub Actions runner (the Azure API host is egress-blocked from the
agent sandbox). Fails SOFT: on any error it leaves the prior veteran_jst.json
in place and exits 0 — the generator degrades gracefully when the file is
absent/stale.

Usage:
    python fetch_veteran_jst.py                 # writes veteran_jst.json
    python fetch_veteran_jst.py --output x.json

Requirements: Python 3.8+ (stdlib only).
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

API_URL = "https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0"
SOURCE_URL = "https://cpldashboardcccco.azurewebsites.net/insights/dashboard"
STAR_THRESHOLD = 0.75  # JST ≥ 75% of Vets → Veteran Star


def _int(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def is_star(vets, jst):
    """Veteran Star: JST ≥ 75% of Vets (reported veterans).

    A college reporting 0 veterans but with JSTs on file earns the star; 0/0
    does not.
    """
    if vets <= 0:
        return jst > 0
    return jst >= STAR_THRESHOLD * vets


def build_veteran_jst(rows, now_iso):
    """Pure transform: API rows → veteran_jst payload. Testable offline.

    `rows` is the parsed potential-savings array (Count row Sorder=-1, the
    ALL COLLEGES aggregate Sorder=1, then per-college Sorder=2 rows).
    """
    if not isinstance(rows, list):
        raise ValueError(f"expected a list of API rows, got {type(rows).__name__}")

    allc = next((r for r in rows if r.get("Sorder") == 1
                 and r.get("College") == "ALL COLLEGES"), None)
    if allc is None:
        # Fall back to data[1] per the API notes if the label ever drifts.
        allc = rows[1] if len(rows) > 1 else {}

    statewide = {
        # Vets = EnrolledMilitaryStudents (reported to MIS); JST = MilitaryStudents
        # (served via an uploaded JST — the MAP Dash's "JST" number).
        "vets": _int(allc.get("EnrolledMilitaryStudents")),
        "jst": _int(allc.get("MilitaryStudents")),
        # MAP's authoritative star tally (independent of our per-college calc).
        "star_colleges": _int(allc.get("StarCollegeCount")),
    }

    colleges = {}
    computed_stars = 0
    for r in rows:
        if r.get("Sorder") != 2:
            continue
        name = (r.get("College") or "").strip()
        if not name:
            continue
        vets = _int(r.get("EnrolledMilitaryStudents"))
        jst = _int(r.get("MilitaryStudents"))
        star = is_star(vets, jst)
        if star:
            computed_stars += 1
        colleges[name] = {"vets": vets, "jst": jst, "star": star}

    return {
        "scraped_at": now_iso,
        "source_url": SOURCE_URL,
        "api_url": API_URL,
        "star_threshold": STAR_THRESHOLD,
        "statewide": statewide,
        "computed_star_colleges": computed_stars,  # diagnostic vs star_colleges
        "colleges": colleges,
    }


def fetch(output_path="veteran_jst.json", timeout=60):
    req = urllib.request.Request(
        API_URL,
        headers={"Accept": "application/json, text/plain, */*"},
        method="GET",
    )
    print(f"Fetching MIL/JST from {API_URL}")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            rows = json.loads(raw)
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError, OSError) as e:
        print(f"  ERROR: {e} — keeping prior {output_path} (soft-fail)")
        return None

    try:
        payload = build_veteran_jst(rows, datetime.now(timezone.utc).isoformat())
    except ValueError as e:
        print(f"  ERROR parsing API response: {e} — keeping prior {output_path}")
        return None

    sw = payload["statewide"]
    print(f"  statewide Vets={sw['vets']:,} JST={sw['jst']:,} "
          f"star_colleges={sw['star_colleges']} "
          f"(computed {payload['computed_star_colleges']}) "
          f"over {len(payload['colleges'])} colleges")
    if sw["star_colleges"] and payload["computed_star_colleges"] != sw["star_colleges"]:
        print(f"  NOTE: computed star count {payload['computed_star_colleges']} "
              f"≠ MAP StarCollegeCount {sw['star_colleges']} "
              f"(MAP's tally is authoritative for the headline).")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"  Saved to: {output_path}")
    return output_path


if __name__ == "__main__":
    out = "veteran_jst.json"
    if "--output" in sys.argv:
        i = sys.argv.index("--output")
        if i + 1 < len(sys.argv):
            out = sys.argv[i + 1]
    # Soft-fail by design — never break the daily publish over MIL/JST.
    fetch(out)
    print("Done.")
