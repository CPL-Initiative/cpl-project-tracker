"""
_discover_map_datasets.py — grain analyzer for the NEW "Exhibit CRs Catalog".

Runs ON THE GITHUB ACTIONS RUNNER (which can reach the MAP hosts; a Claude
session's container cannot — egress allowlist). Sam confirmed the dataset
(2026-06-09):

  viewName  : View_ExhibitCRsCatalog_Dataset   (note: _Dataset, NOT _APIDataset)
  dataCount : 268,400 rows  (~78 per exhibit → grain is finer than exhibit×CR)
  columns   : ExhibitID, CreditRecommendation, Title, Issuer, CPLType…, Level,
              TotalStudentsForCR, TotalEligibleCreditsForCR, TotalTranscribed/
              Applied/Apprenticeship/InReviewCreditsForCR, + evidence/criteria.

The CER has been blocked for 3 sessions on a PER-EXHIBIT eligible/student count;
this dataset has it (ExhibitID + TotalStudentsForCR + TotalEligibleCreditsForCR).
Before wiring it into the CER we must know the GRAIN: with ~78 rows/exhibit, are
the `Total…ForCR` values constant within an (ExhibitID, CreditRecommendation)
group (so the right rollup is "dedupe to distinct CR, then sum/aggregate per
exhibit") or do they vary per row (so a sum double-counts)? This probe answers
that from one run and PRINTS it to the log (which Claude reads via the GitHub
MCP). It writes/commits NOTHING; output is PII-safe (no identity columns are
requested; small student headcounts are masked <5).

Invoked by .github/workflows/discover-map-datasets.yml (manual dispatch).
"""
import json, urllib.request, urllib.error
from collections import defaultdict, Counter

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
VIEW = "View_ExhibitCRsCatalog_Dataset"
# Lean subset for grain analysis (the credit/student totals + the keys) — keeps
# the response far under the full 128 MB while revealing the aggregation.
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


def main():
    print("=" * 74)
    print(f"Exhibit CRs Catalog grain analysis — {VIEW}")
    print("=" * 74)
    body = json.dumps([{"viewName": VIEW, "columnName": GRAIN_COLS}]).encode()
    req = urllib.request.Request(GETREPORT, data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            raw = r.read()
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read()[:400]!r}")
        return
    except Exception as e:
        print(f"ERROR: {e}")
        return
    print(f"fetched {len(raw):,} bytes")
    data = json.loads(raw)
    ds = data[0] if isinstance(data, list) else data
    rows = ds.get("data") or ds.get("Data") or []
    print(f"viewName={ds.get('viewName')} dataCount={ds.get('dataCount')} parsed_rows={len(rows)}")
    if not rows:
        print("no rows — check the viewName/columns.")
        return
    print(f"columns returned: {sorted(rows[0].keys())}\n")

    # ── grain ──
    by_exhibit = defaultdict(list)
    by_excr = defaultdict(list)
    for r in rows:
        eid = r.get("ExhibitID")
        cr = r.get("CreditRecommendation")
        by_exhibit[eid].append(r)
        by_excr[(eid, cr)].append(r)
    print(f"distinct ExhibitID: {len(by_exhibit):,}")
    print(f"distinct (ExhibitID, CreditRecommendation): {len(by_excr):,}")
    rpe = [len(v) for v in by_exhibit.values()]
    print(f"rows per exhibit: avg {sum(rpe)/len(rpe):.1f}, max {max(rpe)}")
    rpc = [len(v) for v in by_excr.values()]
    print(f"rows per (exhibit,CR): avg {sum(rpc)/len(rpc):.1f}, max {max(rpc)}")

    # ── are the Total…ForCR values CONSTANT within an (exhibit, CR) group? ──
    # (decides: dedupe-to-CR-then-sum vs the totals already vary per row)
    print("\nAre Total…ForCR constant within an (ExhibitID, CreditRecommendation)?")
    for col in TOTALS:
        varies = sum(1 for g in by_excr.values() if len({to_num(r.get(col)) for r in g}) > 1)
        print(f"  {col}: varies within group in {varies:,} / {len(by_excr):,} groups "
              + ("(CONSTANT → dedupe-to-CR then aggregate)" if varies == 0 else "(VARIES → row-level, don't blind-sum)"))

    # ── skill-level structure (ACE military child-exhibit question, Sam 2026-06-09) ──
    # Many ACE military exhibits carry multiple SkillLevels; Sam reports higher
    # levels list MORE credit recs and proposes splitting them into child exhibits.
    # Measure: how many exhibits are multi-skill-level, and does #CRs / credit climb
    # with the level? (Decides whether SkillLevel should be a child-identity key.)
    def is_set(s):
        return s and str(s).strip().lower() not in ("", "none", "null", "n/a")
    ex_levels = defaultdict(set)
    for r in rows:
        if is_set(r.get("SkillLevel")):
            ex_levels[r.get("ExhibitID")].add(str(r.get("SkillLevel")).strip())
    multi = {e: sls for e, sls in ex_levels.items() if len(sls) >= 2}
    print("\n## Skill-level structure (ACE military child-exhibit question)")
    print(f"exhibits with a SkillLevel set: {len(ex_levels):,} / {len(by_exhibit):,}")
    print(f"exhibits with >=2 distinct SkillLevels: {len(multi):,}")
    print(f"skill-levels-per-exhibit distribution: {dict(sorted(Counter(len(s) for s in ex_levels.values()).items()))}")
    # Sample a few multi-skill-level exhibits — prefer ACE/military issuers — and
    # show the SkillLevel -> (#distinct CRs, students, eligible) ladder.
    def ace_ish(eid):
        iss = next((str(r.get("Issuer") or "") for r in rows if r.get("ExhibitID") == eid), "")
        return "ace" in iss.lower() or "american council" in iss.lower() or "military" in iss.lower()
    sample = sorted(multi, key=lambda e: (not ace_ish(e), -len(multi[e])))[:3]
    for eid in sample:
        per = defaultdict(lambda: {"crs": set(), "stu": 0.0, "elig": 0.0})
        title = issuer = ""
        for r in rows:
            if r.get("ExhibitID") != eid:
                continue
            title = title or str(r.get("Title") or "")
            issuer = issuer or str(r.get("Issuer") or "")
            sl = str(r.get("SkillLevel") or "").strip()
            per[sl]["crs"].add(r.get("CreditRecommendation"))
            per[sl]["stu"] = max(per[sl]["stu"], to_num(r.get("TotalStudentsForCR")))
            per[sl]["elig"] = max(per[sl]["elig"], to_num(r.get("TotalEligibleCreditsForCR")))
        print(f"\n  ExhibitID={eid} Issuer={issuer[:34]!r} Title={title[:42]!r}")
        for sl in sorted(per):
            d = per[sl]
            print(f"    SkillLevel={sl!r}: {len(d['crs'])} distinct CRs, students~{mask_students(d['stu'])}, elig_credits~{d['elig']}")

    # ── sample 3 exhibits: distinct CRs + their totals + a per-exhibit rollup ──
    print("\nSample exhibits (distinct CRs, totals, and a dedupe-to-CR rollup):")
    for eid in list(by_exhibit)[:3]:
        crs = defaultdict(lambda: defaultdict(float))
        for (e, cr), g in by_excr.items():
            if e != eid:
                continue
            r0 = g[0]
            for col in TOTALS:
                crs[cr][col] = to_num(r0.get(col))  # constant-per-CR assumption; verified above
        title = by_exhibit[eid][0].get("Title")
        print(f"\n  ExhibitID={eid}  Title={str(title)[:50]!r}  ({len(crs)} distinct CRs)")
        roll = {col: sum(c[col] for c in crs.values()) for col in TOTALS}
        for cr, c in list(crs.items())[:4]:
            print(f"    CR={str(cr)[:46]!r}  students={mask_students(c['TotalStudentsForCR'])} "
                  f"elig={c['TotalEligibleCreditsForCR']} trans={c['TotalTranscribedCreditsForCR']}")
        print(f"    → exhibit rollup (sum over distinct CRs): students={mask_students(roll['TotalStudentsForCR'])} "
              f"elig_credits={roll['TotalEligibleCreditsForCR']} transcribed={roll['TotalTranscribedCreditsForCR']} "
              f"applied={roll['TotalAppliedCreditsForCR']} in_review={roll['TotalCreditsInReviewForCR']}")

    print("\n" + "=" * 74)
    print("Claude reads this to lock the exhibit rollup, then wires fetch_custom_report.py")
    print("(add View_ExhibitCRsCatalog_Dataset) + the CER eligible/students columns.")
    print("Nothing was committed.")
    print("=" * 74)


if __name__ == "__main__":
    main()
