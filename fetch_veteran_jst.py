"""
fetch_veteran_jst.py — MIL vs JST data from the CPL potential-savings API
=========================================================================
The CCCCO MAP CPL Dashboard's `potential-savings` API carries two
veteran-program counts the daily worker scrape doesn't surface:

  EnrolledMilitaryStudents  → "MIL" — service members a college REPORTS enrolled
  VeteransWithJSTs          → "JST" — Joint Services Transcripts UPLOADED to MAP

A college earns the **Veteran Star** when it has uploaded JSTs for at least 75%
of its reported military students (JST ≥ 0.75 × MIL). The statewide
`StarCollegeCount` is MAP's authoritative star tally.

This script fetches the same public API the worker uses (no auth) and writes
`veteran_jst.json` — statewide totals + per-college {mil, jst, star}. The
generator (excel_to_dashboard.py) reads it to (a) put the real JST/MIL on the
Veteran Sprint KPI card and (b) add a MIL/JST column + the Veteran Star to the
College Activity table.

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
STAR_THRESHOLD = 0.75  # JST ≥ 75% of MIL → Veteran Star


def _int(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def is_star(mil, jst):
    """Veteran Star: uploaded JSTs ≥ 75% of reported military students.

    A college reporting 0 military but with JSTs on file (more uploaded than
    enrolled) earns the star; 0/0 does not.
    """
    if mil <= 0:
        return jst > 0
    return jst >= STAR_THRESHOLD * mil


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
        "mil": _int(allc.get("EnrolledMilitaryStudents")),
        "jst": _int(allc.get("VeteransWithJSTs")),
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
        mil = _int(r.get("EnrolledMilitaryStudents"))
        jst = _int(r.get("VeteransWithJSTs"))
        star = is_star(mil, jst)
        if star:
            computed_stars += 1
        colleges[name] = {"mil": mil, "jst": jst, "star": star}

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
    print(f"  statewide MIL={sw['mil']:,} JST={sw['jst']:,} "
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
