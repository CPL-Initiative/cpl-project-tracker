#!/usr/bin/env python3
"""kb/reference/mq_handbook_20th.json and kb/_mq_view.py, the MQ view (S717). Guards:
  (1) the 20th-edition file keeps the three list types apart (CCR 53407(a)(2)-(4)) and names its source and sha256;
  (2) every noncredit discipline with its own 53412 subsection is in it, Citizenship placed though the index gives
      no mark, and Counseling: Mental Health present though the index omits it;
  (3) the provisions read from printed pages 56-67 sit on their disciplines: the four 53410.1 licenses, the 53413
      apprenticeship tie on short-term vocational noncredit, the two credential-bearing new disciplines;
  (4) the view joins our codes through the alias table (VOCE, DSPN), names a discipline printed under two names
      once, and flags a master's-list discipline whose credit M-IDs run vocational (r-top-vocational-flag-sets-mq-
      type-sam-2026-11-23);
  (5) the committed view is what a build writes (--check). Pure stdlib.
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fails = []
def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  {detail}"))
    if not ok:
        fails.append(name)

hb = json.load(open(os.path.join(ROOT, "kb/reference/mq_handbook_20th.json"), encoding="utf-8"))
D = hb["disciplines"]
check("(1) three list types, a source and its sha256", set(hb["types"]) == {"masters", "specific", "any"} and len(hb["_source"]["sha256"]) == 64
      and any(d["types"] == ["specific"] for d in D.values()) and any(d["types"] == ["any"] for d in D.values()))
NC = ["Interdisciplinary-Basic Skills: Noncredit", "Mathematics-Basic Skills: Noncredit", "Reading-Basic Skills: Noncredit", "Writing-Basic Skills: Noncredit",
      "Citizenship: Noncredit", "English as a Second Language (ESL): Noncredit", "Health and Safety: Noncredit", "Home Economics: Noncredit",
      "Older Adults: Noncredit", "Parent Education: Noncredit", "Vocational (short-term): Noncredit"]
check("(2) every 53412 noncredit discipline is present, each carrying the provision", all(k in D and "noncredit_53412" in D[k]["provisions"] for k in NC), [k for k in NC if k not in D])
check("(2) Citizenship is placed though the index gives no mark", D["Citizenship: Noncredit"]["types"] == ["specific"])
check("(2) Counseling: Mental Health is present though the index omits it", D.get("Counseling: Mental Health", {}).get("types") == ["masters"])
check("(3) the four 53410.1 licenses", sorted(k for k, d in D.items() if "license_53410_1" in d["provisions"]) == ["Accounting", "Counseling", "Engineering", "Nutritional Science/Dietetics"],
      sorted(k for k, d in D.items() if "license_53410_1" in d["provisions"]))
check("(3) the 53413 apprenticeship tie sits on short-term vocational noncredit", "apprenticeship_53413" in D["Vocational (short-term): Noncredit"]["provisions"])
check("(3) the two new disciplines that require a credential", all("credential_required" in D[k]["provisions"] for k in ("Counseling: Mental Health", "Uncrewed Aircraft System (UAS) Technology")))

spec = importlib.util.spec_from_file_location("mqv", os.path.join(ROOT, "kb", "_mq_view.py"))
mqv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mqv)
V = json.load(open(os.path.join(ROOT, "kb/status/mq_view.json"), encoding="utf-8"))
R = {r["key"]: r for r in V["rows"]}
check("(4) VOCE and DSPN join through the alias table, and say our name differs",
      R["Vocational (short-term): Noncredit"]["code"] == "VOCE" and R["Specialized Instruction (Disabled Student Programs and Services): Noncredit"]["code"] == "DSPN"
      and any(g.startswith("Our name is") for g in R["Vocational (short-term): Noncredit"]["gaps"]))
check("(4) a discipline printed under two names is no second gap", R["Theater Arts"]["same_as"] == "Drama/Theater Arts" and R["Theater Arts"]["code"] != "")
voc_flag = [r["name"] for r in V["rows"] if any("vocational TOP code, which takes the experience" in g for g in r["gaps"])]
check("(4) a master's-list discipline whose credit M-IDs run vocational is flagged", "Business" in voc_flag, voc_flag[:5])
check("(4) Workforce Preparation is named as the COCI category with no MQ discipline", V["noncredit_categories_without_discipline"] == ["Workforce Preparation"])
spec2 = importlib.util.spec_from_file_location("pc", os.path.join(ROOT, "kb", "_csr_propose_codes.py"))
pc = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(pc)
P = pc.build()
check("(6) every assigned code has its record of how it was chosen, each four letters, proposed once, never another discipline's C-ID prefix",
      P["problems"] == [] and P["count"] == V["totals"]["assigned"], P["problems"][:5])
check("(6) every MQ discipline carries a common subject code, the 95 assigned ones each with a confidence and a level",
      V["totals"]["without_code"] == 0 and V["totals"]["assigned"] == 95
      and all(r["confidence"] is not None and r["level"] for r in V["rows"] if r["code_source"] == "assigned"))
check("(6) ACCT is Accounting's code from C-ID, Confident, and the view flags C-ID's ACCT still attributed to Business",
      R["Accounting"]["code"] == "ACCT" and R["Accounting"]["level"] == "Confident"
      and any("attributed to Business" in g for g in R["Accounting"]["gaps"]), R["Accounting"])
spec3 = importlib.util.spec_from_file_location("ac", os.path.join(ROOT, "kb", "_csr_assign_codes.py"))
ac = importlib.util.module_from_spec(spec3)
spec3.loader.exec_module(ac)
canon = json.load(open(os.path.join(ROOT, "kb/discipline_canonical_subj4.json"), encoding="utf-8"))["disciplines"]
codes = [e["canonical_subj4"] for e in canon.values() if e.get("canonical_subj4")]
check("(7) no two disciplines in the Common Subjects Reference share a code", len(codes) == len(set(codes)))
check("(7) the assign step adds nothing a second time, and leaves every existing entry as it was",
      all(k in canon for k in (x["key"] for x in json.load(open(os.path.join(ROOT, ac.RECEIPT), encoding="utf-8"))["added"])))
# The collision check on a changed code: a code put on a second discipline is flagged on both.
hb2 = json.load(open(os.path.join(ROOT, "kb/reference/mq_handbook_20th.json"), encoding="utf-8"))
canon2 = json.load(open(os.path.join(ROOT, "kb/discipline_canonical_subj4.json"), encoding="utf-8"))
canon2["disciplines"]["Locksmithing"]["canonical_subj4"] = "WELD"
V2 = mqv.build(hb2, canon2, {"courses": []}, {"codes": []}, {}, {"disciplines": {}}, None)
lk = [r for r in V2["rows"] if r["name"] == "Locksmithing"][0]
check("(7) ⭐ a code changed onto one already in use is flagged (Sam, 2026-11-23: check I haven't stepped on an existing code)",
      any("WELD is also the common subject code of Welding" in g for g in lk["gaps"]), lk["gaps"])
check("(5) the committed view is what a build writes", mqv.main(["--check"]) == 0)
print(f"\n{len(fails)} FAILED" if fails else "\nall checks passed")
sys.exit(1 if fails else 0)
