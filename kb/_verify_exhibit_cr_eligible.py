"""
Verify _rollup_exhibit_cr_catalog on a synthetic column-oriented payload.

The real Exhibit CRs Catalog can't be fetched from a Claude session (egress
allowlist), so this guards the aggregation LOGIC end-to-end. The catalog's numeric
ExhibitID is a DIFFERENT namespace from View_ArticulatedMAPExhibits' MAP… string
id (and the catalog includes military/ACE exhibits the articulation view
excludes), so the rollup BRIDGES ON exhibit Title → unified_title. It de-dupes the
finer-grain row repetition by MAX per (ExhibitID, SkillLevel, CreditRecommendation)
then SUMS credit UNITS to the credential. Run:

  python3 kb/_verify_exhibit_cr_eligible.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as e

COLS = ["ExhibitID", "SkillLevel", "CreditRecommendation", "Title",
        "TotalEligibleCreditsForCR", "TotalTranscribedCreditsForCR",
        "TotalAppliedCreditsForCR", "TotalCreditsInReviewForCR", "TotalStudentsForCR"]


def row(eid, sl, cr, title, elig, trans=0, app=0, inrev=0, stu=0):
    d = {"ExhibitID": eid, "SkillLevel": sl, "CreditRecommendation": cr, "Title": title,
         "TotalEligibleCreditsForCR": elig, "TotalTranscribedCreditsForCR": trans,
         "TotalAppliedCreditsForCR": app, "TotalCreditsInReviewForCR": inrev,
         "TotalStudentsForCR": stu}
    return [d[c] for c in COLS]


# title_to_ut maps NORMALIZED exhibit Title → unified_title (built from the
# articulations' canonical exhibit_title in the real producer).
title_to_ut = {
    e._norm_title("Cred A Exhibit"): "Cred A",
    e._norm_title("Cred A Exhibit Two"): "Cred A",
    e._norm_title("Cred B Exhibit"): "Cred B",
}

rows = [
    # E1 (Cred A Exhibit) skill 10: "3u Hist" REPEATED (constant 12 → max 12) +
    # "2u PE" (8) → 20. skill 20: "3u Hist" (40) + "Leadership" varying (7 vs 30 →
    # max 30) → 70. E1 = 90.
    row("E1", "10", "3u Hist", "Cred A Exhibit", 12, 3), row("E1", "10", "3u Hist", "Cred A Exhibit", 12, 3),
    row("E1", "10", "2u PE", "Cred A Exhibit", 8),
    row("E1", "20", "3u Hist", "Cred A Exhibit", 40, 10),
    row("E1", "20", "Leadership", "Cred A Exhibit", 7), row("E1", "20", "Leadership", "Cred A Exhibit", 30),
    # E2 (a DIFFERENT exhibit, also → Cred A via its title): "welding" (5).
    row("E2", "", "welding", "Cred A Exhibit Two", 5, 5),
    # E3 (Cred B): "anatomy" (10).
    row("E3", "", "anatomy", "Cred B Exhibit", 10),
    # E9 — a MILITARY title NOT in title_to_ut (the catalog has ~30k such) → skipped.
    row("E9", "AD1", "ignored", "Aviation Machinist's Mate", 999),
]
report = [{"viewName": "View_ExhibitCRsCatalog_Dataset", "columnName": COLS, "columnValue": rows}]

out, diag = e._rollup_exhibit_cr_catalog(report, title_to_ut)

results = []
def check(name, cond):
    results.append((name, bool(cond)))

check("Cred A eligible = 95 (Title-bridged, skill+CR sum, finer-grain MAX de-dupe)", round(out.get("Cred A", {}).get("eligible", -1), 1) == 95.0)
check("Cred B eligible = 10", round(out.get("Cred B", {}).get("eligible", -1), 1) == 10.0)
check("Cred A transcribed funnel = 18", round(out.get("Cred A", {}).get("transcribed", -1), 1) == 18.0)
check("unmatched MILITARY title (not in title_to_ut) excluded", "Cred A" in out and diag["matched"] == 8 and diag["rows_seen"] == 9)
check("only credentials with a Title match appear", set(out) == {"Cred A", "Cred B"})
check("two exhibits with different Titles both fold into one credential", round(out["Cred A"]["eligible"], 1) == 95.0)
check("_credits_to_num robust", e._credits_to_num("1,234.5") == 1234.5 and e._credits_to_num(None) == 0.0)

pass_n = sum(1 for _, ok in results if ok)
for n, ok in results:
    print(("PASS" if ok else "FAIL") + "  " + n)
print(f"\n{pass_n}/{len(results)} checks passed")
sys.exit(0 if pass_n == len(results) else 1)
