"""
Verify _rollup_exhibit_cr_catalog on a synthetic column-oriented payload.

The real Exhibit CRs Catalog can't be fetched from a Claude session (egress
allowlist), so this guards the aggregation LOGIC end-to-end: de-dupe the catalog's
finer-grain row repetition by MAX per (ExhibitID, SkillLevel, CreditRecommendation),
then SUM credit UNITS up to the credential via exhibit_id → unified_title. Run so
the daily cron bakes correct CER eligible/funnel numbers:

  python3 kb/_verify_exhibit_cr_eligible.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as e

COLS = ["ExhibitID", "SkillLevel", "CreditRecommendation", "TotalEligibleCreditsForCR",
        "TotalTranscribedCreditsForCR", "TotalAppliedCreditsForCR",
        "TotalCreditsInReviewForCR", "TotalStudentsForCR"]


def row(eid, sl, cr, elig, trans=0, app=0, inrev=0, stu=0):
    d = {"ExhibitID": eid, "SkillLevel": sl, "CreditRecommendation": cr,
         "TotalEligibleCreditsForCR": elig, "TotalTranscribedCreditsForCR": trans,
         "TotalAppliedCreditsForCR": app, "TotalCreditsInReviewForCR": inrev,
         "TotalStudentsForCR": stu}
    return [d[c] for c in COLS]


# Synthetic catalog (column-oriented, like the real CustomReport response):
rows = [
    # E1 (Cred A) skill 10: CR "3u Hist" REPEATED across 2 finer rows (constant 12
    # → max 12) + CR "2u PE" (8). → skill-10 eligible 20.
    row("E1", "10", "3u Hist", 12, 3), row("E1", "10", "3u Hist", 12, 3), row("E1", "10", "2u PE", 8),
    # E1 skill 20: "3u Hist" (40) + "Leadership" with VARYING finer rows (7 vs 30
    # → max 30). → skill-20 eligible 70.
    row("E1", "20", "3u Hist", 40, 10), row("E1", "20", "Leadership", 7), row("E1", "20", "Leadership", 30),
    # E2 (Cred A): one CR (5). E3 (Cred B): one CR (10).
    row("E2", "", "welding", 5, 5),
    row("E3", "", "anatomy", 10),
    # E9 NOT in the crosswalk → must be skipped (real catalog has ~33k exhibits,
    # most without articulations).
    row("E9", "", "ignored", 999),
]
report = [{"viewName": "View_ExhibitCRsCatalog_Dataset", "columnName": COLS, "columnValue": rows}]
exid_to_ut = {"E1": "Cred A", "E2": "Cred A", "E3": "Cred B"}

out, diag = e._rollup_exhibit_cr_catalog(report, exid_to_ut)

# Expected — Cred A: E1 [skill10 20 + skill20 (40 + max(7,30)=30) = 70] = 90, + E2 5 = 95.
#            Cred A transcribed: E1 [skill10 max(3,3)=3 + skill20 10 = 13] + E2 5 = 18.
results = []
def check(name, cond):
    results.append((name, bool(cond)))

check("Cred A eligible = 95 (skill+CR sum, finer-grain de-duped by MAX)", round(out.get("Cred A", {}).get("eligible", -1), 1) == 95.0)
check("Cred B eligible = 10", round(out.get("Cred B", {}).get("eligible", -1), 1) == 10.0)
check("Cred A transcribed funnel = 18 (de-duped MAX then summed)", round(out.get("Cred A", {}).get("transcribed", -1), 1) == 18.0)
check("unmatched ExhibitID (E9) excluded", "Cred A" in out and "ignored" not in str(out))
check("diag.matched counts only crosswalk hits (8 of 9 rows)", diag["matched"] == 8 and diag["rows_seen"] == 9)
check("only credentials with matches appear", set(out) == {"Cred A", "Cred B"})
check("_credits_to_num robust ('1,234.5'/None/'' )", e._credits_to_num("1,234.5") == 1234.5 and e._credits_to_num(None) == 0.0 and e._credits_to_num("") == 0.0)

pass_n = sum(1 for _, ok in results if ok)
for n, ok in results:
    print(("PASS" if ok else "FAIL") + "  " + n)
print(f"\n{pass_n}/{len(results)} checks passed")
sys.exit(0 if pass_n == len(results) else 1)
