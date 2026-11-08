#!/usr/bin/env python3
"""The classifier's standing rules fit the Edge Function's limit (COBIx #2921, S604).

    python3 tests/cer_classifier_rules_size_test.py

From 2026-11-07 the house families pushed the rules to 251,866 characters, the Edge Function
(chatbox/supabase/functions/cer-classify/index.ts MAX_RULES) answered every call with HTTP 413,
and the titles waiting on the classifier showed only as a count. rules_text() now trims the
families to a budget under the limit, never dropping a family the batch could join.
"""
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
spec = importlib.util.spec_from_file_location("cer", os.path.join(ROOT, "kb", "_cer_procedures.py"))
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("  ok  " if cond else "  FAIL ") + name + ("" if cond else "  " + str(detail)[:300]))

ts = open("chatbox/supabase/functions/cer-classify/index.ts", encoding="utf-8").read()
m = re.search(r"const MAX_RULES = (\d+);", ts)
limit = int(m.group(1)) if m else None
check("the run's limit is the Edge Function's MAX_RULES", limit == C.RULES_LIMIT, (limit, C.RULES_LIMIT))
check("the budget leaves room under the limit", C.RULES_BUDGET < C.RULES_LIMIT)

procs = C.load_procedures()
skill = open(C.SKILL, encoding="utf-8").read()
fam = {}
for t, recs in json.load(open(C.CREDENTIALS, encoding="utf-8")).items():
    fam[t] = {(r.get("issuing_agency") or "").strip() for r in recs if isinstance(r, dict)} - {""}
ask = ["CompTIA Security+ SY0-701", "ASE A5 Brakes", "Wastewater Treatment Plant Operator Grade II"]
text = C.rules_text(procs, skill, fam, budget=C.RULES_BUDGET, prefer=ask)
check("the committed rules fit the budget", len(text) <= C.RULES_BUDGET, len(text))
check("every procedure in force is still in the text", all(("`%s`" % p["id"]) in text for p in procs))

# a family the batch could join keeps its issuers; small fixture so the trim path is exercised whatever the corpus size
small = {"CompTIA Security+": {"CompTIA"}, "Forklift Operator": {"OSHA Training Institute"}, "Welding Level 1": {"AWS"}}
full = C.rules_text([], "skill", small)
tight = C.rules_text([], "skill", small, budget=len(full) - 5, prefer=["CompTIA Security+ SY0-701"])
check("a near family keeps its issuer", "- CompTIA Security+ | CompTIA" in tight, tight)
check("a far family loses its issuer first, keeping its title", "- Forklift Operator\n" in tight and "OSHA" not in tight, tight)
tighter = C.rules_text([], "skill", small, budget=len("skill") + 10, prefer=["CompTIA Security+ SY0-701"])
check("at the last step only near families stay, and the text says how many went",
      "CompTIA Security+" in tighter and "Forklift" not in tighter and "2 further house families" in tighter, tighter)
check("with no budget the text is unchanged", C.rules_text([], "skill", small) == full)

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
