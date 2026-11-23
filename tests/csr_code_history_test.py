#!/usr/bin/env python3
"""A Common SUBJ code's history (S717; Sam, 2026-11-23: "it could happen so we might need a formerly XXXX and Title").
Guards: (1) a save that changes the code keeps the old one with its title, date, who and note; (2) a rerun of the same
save records nothing; (3) a save that keeps the code records nothing; (4) a person is "a person", never an email; a
cohort keeps its @bot name; (5) a second change keeps both, oldest first. Pure stdlib, no network."""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("apply_canon", os.path.join(ROOT, "kb", "_apply_canonical_subj4.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
fails = []
def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  {detail}"))
    if not ok:
        fails.append(name)

e = {"canonical_subj4": "UASY"}
check("(1) a changed code keeps the old one with its title, date, who and note",
      m.record_former(e, "Uncrewed Aircraft System (UAS) Technology", "DRON", "2026-11-24T10:00:00Z", "slee@cccco.edu", "colleges say drone")
      and e["formerly"] == [{"code": "UASY", "title": "Uncrewed Aircraft System (UAS) Technology", "until": "2026-11-24T10:00:00Z", "by": "a person", "note": "colleges say drone"}], e)
e["canonical_subj4"] = "DRON"
check("(2) a rerun of the same save records nothing", not m.record_former(e, "Uncrewed Aircraft System (UAS) Technology", "DRON", "2026-11-24T10:00:00Z", "slee@cccco.edu", None) and len(e["formerly"]) == 1)
check("(3) a save that keeps the code records nothing", not m.record_former({"canonical_subj4": "ACCT"}, "Accounting", "ACCT", "2026-11-24T10:00:00Z", "x@y.edu", None))
f = {"canonical_subj4": "AAAA"}
m.record_former(f, "X", "BBBB", "2026-11-24T10:00:00Z", "csr-s800@bot", None)
check("(4) an email never lands in the history; a cohort keeps its @bot name", "@cccco" not in str(e) and f["formerly"][0]["by"] == "csr-s800@bot")
m.record_former(e, "Uncrewed Aircraft System (UAS) Technology", "UAST", "2027-11-01T10:00:00Z", None, None)
check("(5) a second change keeps both, oldest first", [h["code"] for h in e["formerly"]] == ["UASY", "DRON"])
print(f"\n{len(fails)} FAILED" if fails else "\nall checks passed")
sys.exit(1 if fails else 0)
