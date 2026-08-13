#!/usr/bin/env python3
"""Publish the canonical credential layer to Supabase so Sierra can read it.

WHY THIS EXISTS
---------------
`cpl-chat` reads eight Supabase tables and none of them carries a canonical
credential name. Its only credential source is `chatbox_exhibits`, which stores
the RAW freehand titles colleges typed into MAP. Asked "what colleges articulate
POST?", Sierra full-text-matched the literal string "POST" and answered 20
colleges. The curated canonical record folds 16 variants — including
"Peace Officer Standardized Training Academy", which contains no "POST" — and
knows 32 adopters. The naming layer was built and curated long ago
(`kb/unified_titles.json` → `kb/credentials.json`); it simply never reached the
database Sierra queries.

SOURCE OF TRUTH
---------------
`credential_reference_data.js` — the artifact the daily cron already bakes and
publishes to the public dashboard. Reading the PUBLISHED artifact rather than
the upstream source is deliberate and load-bearing:

  small-cell suppression is applied upstream at generation time, so
  `students_served` here is suppression-inherited BY CONSTRUCTION.

An exact sub-floor headcount cannot reach this table even if someone later
points the loader at a different environment. If you ever "improve" this by
reading the raw catalogue instead, you have moved the privacy control and you
own it. Don't.

USAGE
    python3 kb/_sync_credential_catalog.py --dry-run
    python3 kb/_sync_credential_catalog.py            # needs SUPABASE_SERVICE_KEY

The sandbox cannot reach *.supabase.co — this runs on the GitHub Actions runner
(.github/workflows/credential-catalog-sync.yml), the same shape as the other
service-key sync jobs.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT = os.path.join(REPO, "credential_reference_data.js")
TABLE = "chatbox_credentials"
BATCH = 200


# ── read the published artifact ──────────────────────────────────────────────

def load_artifact(path: str = ARTIFACT) -> dict:
    """Parse the baked `window.CPL_CREDENTIAL_REFERENCE = {...};` payload."""
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    start = src.index("{")
    return json.loads(src[start:].rstrip().rstrip(";"))


def adopters_of(rec: dict) -> list:
    """Colleges that have EARNED at least one articulation.

    The generator keeps this list nested inside articulations[].local[].colleges
    rather than emitting a flat field. It is the green-badge source and it is
    DISJOINT from potential_colleges — a college in the latter has NOT
    articulated the credential. Conflating the two is how a chatbot invents a
    route and sends someone to a counter where nobody expects them.
    """
    out = set()
    for art in rec.get("articulations") or []:
        for loc in art.get("local") or []:
            for col in loc.get("colleges") or []:
                if col:
                    out.add(col)
    return sorted(out)


_WS = re.compile(r"\s+")


def search_text_for(rec: dict, adopters: list) -> str:
    """One lowercase haystack for trigram matching.

    Deliberately NOT a tsvector. `to_tsquery('english', 'aed:*')` parses to
    `'a':*` because Snowball strips the "-ed" — that single behaviour took the
    CPR corpus out on 2026-08-06. Credential titles are short, abbreviation-dense
    and full of proper nouns, which is precisely where stemming does damage and
    trigram similarity does not.

    Variants are included because they are how a person's phrasing reaches the
    canonical name: someone types "CA POST academy", the variant matches, the
    canonical record answers.
    """
    parts = [rec.get("ut") or ""]
    parts += [v.get("r") or "" for v in (rec.get("raw_variants") or [])]
    parts += [rec.get("issuer") or "", rec.get("trainer") or "",
              rec.get("disc_modal") or ""]
    # A couple of adopters help "who does X" style phrasings land, but the full
    # list would swamp the trigram index with college names common to hundreds
    # of credentials and blur the signal.
    parts += adopters[:3]
    return _WS.sub(" ", " ".join(p for p in parts if p)).strip().lower()


_STATEWIDE_TITLES: set | None = None


def statewide_titles() -> set:
    """Unified titles carrying a CCC-Collaborative (statewide) exhibit.

    Read from statewide_data.js — the adoption file — because it is the one MAP
    publishes the statewide exhibit in. Missing file degrades to the empty set,
    which reproduces the old behaviour rather than failing the sync.
    """
    global _STATEWIDE_TITLES
    if _STATEWIDE_TITLES is None:
        path = os.path.join(REPO, "statewide_data.js")
        titles: set = set()
        try:
            with open(path, encoding="utf-8") as fh:
                src = fh.read()
            doc = json.loads(src[src.index("{"):].rstrip().rstrip(";"))
            for e in doc.get("exhibits") or []:
                if e.get("collaborative_type") == "CCC Collaborative" and e.get("unified_title"):
                    titles.add(e["unified_title"])
        except Exception as exc:                        # noqa: BLE001 — degrade, never block
            print(f"NOTE: could not read statewide_data.js ({exc}) — "
                  "statewide flags fall back to the CER artifact alone.")
        _STATEWIDE_TITLES = titles
    return _STATEWIDE_TITLES


def to_row(rec: dict, generated_at: str | None) -> dict:
    adopters = adopters_of(rec)
    served = rec.get("students_served")
    return {
        "unified_title": rec.get("ut"),
        "issuer": rec.get("issuer") or None,
        "trainer": rec.get("trainer") or None,
        "discipline": rec.get("disc_modal") or None,
        "top_code": rec.get("top_modal") or None,
        "cpl_types": rec.get("cpl_types") or [],
        # UNION with the adoption file, do not trust this artifact alone.
        # credential_reference_data.js flags 84 titles statewide; statewide_data.js
        # carries 137 CCC-Collaborative exhibits, and the 54-title gap is not
        # cosmetic — Paramedic License and 53 others read as NOT statewide here
        # while the public Fact Sheet (which reads the adoption file) shows them
        # WITH their statewide credit recs. Sierra syncs from this file, so she
        # has been contradicting the Fact Sheet on 54 credentials. The KB already
        # said which file wins — cpl_memory `statewide-is-138-not-84`: "Use the
        # adoption file" — and this sync predated that note.
        "statewide": bool(rec.get("statewide")) or (rec.get("ut") in statewide_titles()),
        "ccc_rec": rec.get("ccc_rec") or None,
        "gen_rec": rec.get("gen_rec") or None,
        "has_local": bool(rec.get("has_local")),
        "adopter_colleges": adopters,
        "potential_colleges": rec.get("potential_colleges") or [],
        "n_articulation_lines": rec.get("n_articulation_lines") or 0,
        "eligible_credits": rec.get("eligible_credits"),
        "applied_credits": rec.get("applied_credits"),
        "transcribed_credits": rec.get("transcribed_credits"),
        "in_review_credits": rec.get("in_review_credits"),
        # Inherited from the published artifact — never recomputed here.
        "students_served": served if isinstance(served, int) else None,
        "served_suppressed": bool(rec.get("served_suppressed")),
        "raw_variants": [v.get("r") for v in (rec.get("raw_variants") or []) if v.get("r")],
        "search_text": search_text_for(rec, adopters),
        "conf_title": rec.get("conf_title"),
        "curated_by": rec.get("curated_by") or None,
        "curated_at": rec.get("curated_at") or None,
        "source_generated_at": generated_at,
    }


def build_rows(doc: dict) -> list:
    gen = doc.get("_generated_at")
    rows = [to_row(r, gen) for r in doc.get("unified_titles") or [] if r.get("ut")]
    # A duplicate title would silently drop rows on upsert; fail loudly instead.
    seen, dupes = set(), []
    for r in rows:
        if r["unified_title"] in seen:
            dupes.append(r["unified_title"])
        seen.add(r["unified_title"])
    if dupes:
        raise SystemExit(f"FATAL: duplicate unified_title(s): {dupes[:5]}")
    return rows


# ── write ────────────────────────────────────────────────────────────────────

def upsert(rows: list, url: str, key: str) -> int:
    endpoint = f"{url.rstrip('/')}/rest/v1/{TABLE}?on_conflict=unified_title"
    sent = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(chunk).encode("utf-8"),
            method="POST",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                if resp.status not in (200, 201, 204):
                    raise SystemExit(f"FATAL: batch {i}: HTTP {resp.status}")
        except urllib.error.HTTPError as exc:
            raise SystemExit(f"FATAL: batch {i}: HTTP {exc.code} {exc.read()[:400]!r}")
        sent += len(chunk)
        print(f"  upserted {sent}/{len(rows)}")
    return sent


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true",
                    help="parse + report, write nothing")
    args = ap.parse_args()

    if not os.path.exists(ARTIFACT):
        print(f"NOTE: {ARTIFACT} absent — nothing to sync (clean checkout?).")
        return 0

    doc = load_artifact()
    rows = build_rows(doc)

    statewide = sum(1 for r in rows if r["statewide"])
    with_rec = sum(1 for r in rows if r["statewide"] and r["ccc_rec"])
    adopted = sum(1 for r in rows if r["adopter_colleges"])
    suppressed = sum(1 for r in rows if r["served_suppressed"])
    exact = sum(1 for r in rows if r["students_served"] is not None)

    print(f"credentials         : {len(rows)}")
    print(f"  statewide         : {statewide} ({with_rec} carry a recommendation)")
    print(f"  with >=1 adopter  : {adopted}")
    print(f"  served suppressed : {suppressed}   exact: {exact}")
    print(f"  source generated  : {doc.get('_generated_at')}")

    # The route this table was built for is CRED-STD; if no credential carries a
    # statewide recommendation the sync is pointless and something upstream broke.
    if with_rec == 0:
        raise SystemExit("FATAL: no statewide credential carries a ccc_rec — "
                         "refusing to publish a catalogue that cannot answer CRED-STD")

    if args.dry_run:
        sample = next((r for r in rows if r["unified_title"] == "POST Basic Academy"), None)
        if sample:
            print("\nsample — POST Basic Academy:")
            print(f"  statewide  : {sample['statewide']}")
            print(f"  ccc_rec    : {sample['ccc_rec']}")
            print(f"  adopters   : {len(sample['adopter_colleges'])}")
            print(f"  potential  : {len(sample['potential_colleges'])}")
            print(f"  variants   : {len(sample['raw_variants'])}")
        print("\nDRY RUN — nothing written.")
        return 0

    # Same default as kb/_rekey_kb_curation_supabase.py — the workflow only has
    # to carry the service key, which is the one thing that must stay a secret.
    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("FATAL: SUPABASE_SERVICE_KEY required")

    print(f"\nupserting into {TABLE} …")
    sent = upsert(rows, url, key)
    print(f"done — {sent} rows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
