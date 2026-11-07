"""A held COCI C-ID claim stays out of a statewide recommendation set (SkyBramble, 2026-11-07).

MAP's exhibit rows carry the articulating course's COCI C-ID. Moreno Valley's HES 1 Health
Science claims HIST 150 (World History to 1500) in COCI, so Basic Military Training's
statewide "Principles of Health Education" took HIST 150 and Sierra offered Sierra College's
HIST 50 World History for it, a day after kb/reference/cid_claim_holds.json had set the claim
aside for the member export (Sam, Open Asks Sheet 164 card 2: "some mistake we should track
down on our end"). `_build_statewide_adoption` now reads the same holds.

Run from the repo root: python3 tests/statewide_cid_hold_test.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

COLS = ["College", "ExhibitID", "Exhibit Title", "spare3", "Articulation College",
        "Course", "Credit Recommendation", "Collaborative Type", "TOP Code",
        "CID Number", "s10", "s11", "s12", "CPL Type Description"]
CM = {c: i for i, c in enumerate(COLS)}


def row(eid, artic, course, credit, cid, collab="CCC"):
    r = [""] * len(COLS)
    r[CM["College"]] = "Host College"
    r[CM["ExhibitID"]] = eid
    r[CM["Exhibit Title"]] = "Basic Military Training"
    r[CM["Articulation College"]] = artic
    r[CM["Course"]] = course
    r[CM["Credit Recommendation"]] = credit
    r[CM["Collaborative Type"]] = collab
    r[CM["TOP Code"]] = "0835.00"
    r[CM["CID Number"]] = cid
    r[CM["CPL Type Description"]] = "Military"
    return r


CHECKS = []


def check(name, cond):
    CHECKS.append((name, bool(cond)))


holds = gen._cid_claim_holds()
check("the HES 1 hold is on file", any(h.get("course") == "HES 1" and h.get("claimed_cid") == "HIST 150"
                                       for h in holds.values()))

rows = [
    row("MAPMM-BMT1-1-001", "Moreno Valley College", "HES 1 - Health Science", "3 hours in Principles of Health Education", "HIST 150"),
    row("MAPMM-BMT1-1-001", "Moreno Valley College", "KIN 4", "1 hours in Weight Training I", "KIN 100"),
    # The same C-ID on another college's course is that college's own claim: kept.
    row("MAPMM-BMT1-1-002", "Riverside City College", "HIS 1", "3 hours in World History", "HIST 150"),
]
out = gen._build_statewide_adoption([], rows, CM) or []
e = next((x for x in out if "Basic Military Training" in (x.get("unified_title"), x.get("title"))), None)
check("the exhibit builds", e is not None)
recs = {r["credit"]: r.get("cid") for r in (e or {}).get("authoritative_recs", [])}
check("the held claim leaves Principles of Health Education with no C-ID",
      recs.get("3 hours in Principles of Health Education") == "")
check("an unheld C-ID on the same exhibit stays", recs.get("1 hours in Weight Training I") == "KIN 100")
check("another college's own HIST 150 stays", recs.get("3 hours in World History") == "HIST 150")

failed = [n for n, ok in CHECKS if not ok]
for n, ok in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n)
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
