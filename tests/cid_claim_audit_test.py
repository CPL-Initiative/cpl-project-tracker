"""The C-ID claim audit decides on a course's content (Sam, 2026-11-07).

"The control number characters carry no meaning... The weight of the comparison between
'HIS' and 'HES' has been vastly overweighted. More important factors are the indicator in
the course title, description, slos, soc, CIP." So a lone subject or TOP mismatch never
makes a finding, and a description that matches the group clears a member whose title
differs. Run from the repo root: python3 tests/cid_claim_audit_test.py
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("audit", os.path.join(ROOT, "kb", "_audit_cid_claims.py"))
A = importlib.util.module_from_spec(spec)
spec.loader.exec_module(A)

HIST = ("Survey of world civilizations from prehistory to fifteen hundred, covering ancient Mesopotamia, "
        "Egypt, Greece, Rome, China, India, the Islamic world and medieval Europe, their politics, religion, "
        "economies and cultures")
HEALTH = ("A general education course that offers a basic study of human health and health care as revealed "
          "in the anatomy and physiology of the body, nutrition, exercise, stress management and disease")


def m(cn, n, t, p):
    return {"cn": cn, "n": n, "t": t, "p": p, "c": 0}


group = [
    m("C1", "HIST 1", "World History to 1500", "2205.00"),
    m("C2", "HIS 10", "World Civilizations I", "2205.00"),
    m("C3", "HIST 4A", "History of World Civilizations", "2205.00"),
    m("C4", "HES 1", "Health Science", "0837.00"),             # content disagrees: a finding
    m("C5", "HUM 7", "Ancient Cultures to 1500", "1501.00"),   # subject and TOP differ, title differs, content agrees
    m("C6", "XYZ 2", "Pre-Modern Societies", "4930.00"),       # no description, subject and TOP both differ
    m("C7", "HIST 8", "Premodern Peoples", "0837.00"),         # no description, only TOP differs
]
desc = {"C1": HIST, "C2": HIST + " and Africa", "C3": HIST + " and the Americas", "C4": HEALTH, "C5": HIST + " in art"}
out = {x["n"]: sig for x, sig in A.group_findings("HIST 150", group, set(), desc)}

CHECKS = [
    ("a course whose description shares nothing with the group is found", "HES 1" in out),
    ("its signals name the description, not the subject letters", "HES 1" in out and any("description" in s for s in out["HES 1"])
     and not any("subject" in s for s in out["HES 1"])),
    ("a different subject and TOP never outweigh a matching description", "HUM 7" not in out),
    ("with no description, subject and TOP together stand in", "XYZ 2" in out),
    ("with no description, one corroborator alone finds nothing", "HIST 8" not in out),
    ("an ASCCC approval clears the claim", "HES 1" not in {x["n"] for x, _ in A.group_findings("HIST 150", group, {("C4", "HIST 150")}, desc)}),
]
for name, ok in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + name)
failed = [n for n, ok in CHECKS if not ok]
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
