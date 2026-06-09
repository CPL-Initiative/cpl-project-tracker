"""
_discover_map_datasets.py — grain analyzer for the NEW "Exhibit CRs Catalog".

Runs ON THE GITHUB ACTIONS RUNNER (which can reach the MAP hosts; a Claude
session's container cannot — egress allowlist). Sam confirmed the dataset
(2026-06-09):

  viewName  : View_ExhibitCRsCatalog_Dataset   (note: _Dataset, NOT _APIDataset)
  dataCount : 268,400 rows  (~78 per exhibit → grain is finer than exhibit×CR)
  columns   : ExhibitID, CreditRecommendation, Title, Issuer, SkillLevel, Level,
              TotalStudentsForCR, TotalEligibleCreditsForCR, TotalTranscribed/
              Applied/Apprenticeship/InReviewCreditsForCR, + evidence/criteria.

CustomReport response shape (confirmed from excel_to_dashboard.py:3684): each
dataset is {viewName, columnName:[...headers...], columnValue:[[...row values...]]}
— rows are COLUMN-ORIENTED arrays indexed by columnName, not dicts.

Two questions this answers from ONE run, printed to the log (which Claude reads
via the GitHub MCP), committing NOTHING (PII-safe: no identity columns requested;
student headcounts masked <5):
  1. GRAIN — with ~78 rows/exhibit, are the Total…ForCR values constant within an
     (ExhibitID, CreditRecommendation) group (→ rollup = dedupe-to-CR then
     aggregate) or do they vary per row (→ don't blind-sum)?
  2. SKILL-LEVEL structure (Sam's ACE child-exhibit question) — how many exhibits
     are multi-SkillLevel, and does the #CRs / credit climb with the level?

Invoked by .github/workflows/discover-map-datasets.yml (manual dispatch).
"""
import json, urllib.request, urllib.error
from collections import defaultdict, Counter

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
VIEW = "View_ExhibitCRsCatalog_Dataset"
# Lean subset for grain analysis (keys + the credit/student totals) — keeps the
# response well under the full 128 MB while revealing the aggregation.
GRAIN_COLS = ["ExhibitID", "CreditRecommendation", "Title", "CPLTypeDescription",
              "Issuer", "SkillLevel", "Level", "ExhibitType",
              "TotalStudentsForCR", "TotalEligibleCreditsForCR",
              "TotalTranscribedCreditsForCR", "TotalAppliedCreditsForCR",
              "TotalCreditsInReviewForCR"]
TOTALS = ["TotalStudentsForCR", "TotalEligibleCreditsForCR",
          "TotalTranscribedCreditsForCR", "TotalAppliedCreditsForCR",
          "TotalCreditsInReviewForCR"]


def to_num(v):
    try:
        return float(v)
    except Exception:
        return 0.0


def mask_students(v):
    n = to_num(v)
    return "<5" if 0 < n < 5 else (int(n) if n == int(n) else n)


def fetch(view, cols):
    body = json.dumps([{"viewName": view, "columnName": cols}]).encode()
    req = urllib.request.Request(GETREPORT, data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=600) as r:
        return r.read()


def analyze(ds):
    cols = ds.get("columnName", [])
    ci = {c: i for i, c in enumerate(cols)}          # column name -> index
    rows = ds.get("columnValue") or ds.get("data") or []
    print(f"viewName={ds.get('viewName')} dataCount={ds.get('dataCount')} parsed_rows={len(rows)}")
    print(f"columns returned ({len(cols)}): {cols}")
    if not rows:
        print("no rows — response keys were:", list(ds.keys()))
        return

    def cell(r, name):
        i = ci.get(name)
        if i is None:
            return None
        return r[i] if isinstance(r, list) and i < len(r) else (r.get(name) if isinstance(r, dict) else None)

    # ── grain: (ExhibitID) and (ExhibitID, CreditRecommendation) ──
    by_exhibit, by_excr = defaultdict(list), defaultdict(list)
    for r in rows:
        eid = cell(r, "ExhibitID")
        by_exhibit[eid].append(r)
        by_excr[(eid, cell(r, "CreditRecommendation"))].append(r)
    print(f"\ndistinct ExhibitID: {len(by_exhibit):,}")
    print(f"distinct (ExhibitID, CreditRecommendation): {len(by_excr):,}")
    rpe = [len(v) for v in by_exhibit.values()]
    rpc = [len(v) for v in by_excr.values()]
    print(f"rows per exhibit: avg {sum(rpe)/len(rpe):.1f}, max {max(rpe)}")
    print(f"rows per (exhibit,CR): avg {sum(rpc)/len(rpc):.1f}, max {max(rpc)}")

    print("\nAre Total…ForCR constant within an (ExhibitID, CreditRecommendation)?")
    for col in TOTALS:
        varies = sum(1 for g in by_excr.values() if len({to_num(cell(r, col)) for r in g}) > 1)
        print(f"  {col}: varies within group in {varies:,}/{len(by_excr):,} "
              + ("(CONSTANT → dedupe-to-CR then aggregate)" if varies == 0 else "(VARIES → a finer key, e.g. SkillLevel, drives the rows)"))

    # Does adding SkillLevel to the key make the totals constant? If YES, SkillLevel
    # IS part of the grain → the totals are per (exhibit, skill, CR) and the rollup
    # must key on it — which is direct DATA SUPPORT for Sam's child-exhibit split.
    by_eslcr = defaultdict(list)
    for r in rows:
        by_eslcr[(cell(r, "ExhibitID"), str(cell(r, "SkillLevel") or ""), cell(r, "CreditRecommendation"))].append(r)
    print(f"\nWith SkillLevel in the key — distinct (ExhibitID, SkillLevel, CreditRecommendation): {len(by_eslcr):,}")
    for col in ("TotalStudentsForCR", "TotalEligibleCreditsForCR"):
        varies = sum(1 for g in by_eslcr.values() if len({to_num(cell(r, col)) for r in g}) > 1)
        print(f"  {col}: varies within group in {varies:,}/{len(by_eslcr):,} "
              + ("(CONSTANT → SkillLevel IS part of the grain → child-exhibits justified)" if varies == 0 else "(still varies → an even finer key remains)"))

    # ── skill-level structure (ACE military child-exhibit question) ──
    def is_set(s):
        return s is not None and str(s).strip().lower() not in ("", "none", "null", "n/a")
    ex_levels = defaultdict(set)
    for r in rows:
        if is_set(cell(r, "SkillLevel")):
            ex_levels[cell(r, "ExhibitID")].add(str(cell(r, "SkillLevel")).strip())
    multi = {e: s for e, s in ex_levels.items() if len(s) >= 2}
    print("\n## Skill-level structure (ACE military child-exhibit question)")
    print(f"exhibits with a SkillLevel set: {len(ex_levels):,}/{len(by_exhibit):,}")
    print(f"exhibits with >=2 distinct SkillLevels: {len(multi):,}")
    print(f"skill-levels-per-exhibit distribution: {dict(sorted(Counter(len(s) for s in ex_levels.values()).items()))}")

    def issuer_of(eid):
        return next((str(cell(r, "Issuer") or "") for r in by_exhibit[eid]), "")
    def ace_ish(eid):
        s = issuer_of(eid).lower()
        return "ace" in s or "american council" in s or "military" in s
    for eid in sorted(multi, key=lambda e: (not ace_ish(e), -len(multi[e])))[:3]:
        per = defaultdict(lambda: {"crs": set(), "stu": 0.0, "elig": 0.0})
        for r in by_exhibit[eid]:
            sl = str(cell(r, "SkillLevel") or "").strip()
            per[sl]["crs"].add(cell(r, "CreditRecommendation"))
            per[sl]["stu"] = max(per[sl]["stu"], to_num(cell(r, "TotalStudentsForCR")))
            per[sl]["elig"] = max(per[sl]["elig"], to_num(cell(r, "TotalEligibleCreditsForCR")))
        title = str(cell(by_exhibit[eid][0], "Title") or "")
        print(f"\n  ExhibitID={eid} Issuer={issuer_of(eid)[:34]!r} Title={title[:42]!r}")
        for sl in sorted(per):
            d = per[sl]
            print(f"    SkillLevel={sl!r}: {len(d['crs'])} distinct CRs, students~{mask_students(d['stu'])}, elig_credits~{d['elig']}")

    # ── sample 3 exhibits: dedupe-to-CR rollup (the candidate CER aggregation) ──
    print("\nSample exhibits — dedupe-to-CR rollup (candidate CER aggregation):")
    for eid in list(by_exhibit)[:3]:
        crs = {}
        for (e, cr), g in by_excr.items():
            if e == eid:
                crs[cr] = {col: to_num(cell(g[0], col)) for col in TOTALS}
        roll = {col: sum(c[col] for c in crs.values()) for col in TOTALS}
        title = str(cell(by_exhibit[eid][0], "Title") or "")
        print(f"  ExhibitID={eid} Title={title[:46]!r} ({len(crs)} distinct CRs) → "
              f"students={mask_students(roll['TotalStudentsForCR'])} "
              f"elig={roll['TotalEligibleCreditsForCR']} transcribed={roll['TotalTranscribedCreditsForCR']} "
              f"applied={roll['TotalAppliedCreditsForCR']} in_review={roll['TotalCreditsInReviewForCR']}")


def main():
    print("=" * 74)
    print(f"Exhibit CRs Catalog grain analysis — {VIEW}")
    print("=" * 74)
    try:
        raw = fetch(VIEW, GRAIN_COLS)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read()[:400]!r}")
        return
    except Exception as e:
        print(f"ERROR: {e}")
        return
    print(f"fetched {len(raw):,} bytes")
    data = json.loads(raw)
    ds = data[0] if isinstance(data, list) and data else data
    analyze(ds)
    print("\n" + "=" * 74)
    print("Claude reads this to lock the exhibit rollup + the skill-level/child-exhibit")
    print("decision, then wires fetch_custom_report.py + the CER eligible/students columns.")
    print("=" * 74)


if __name__ == "__main__":
    main()
