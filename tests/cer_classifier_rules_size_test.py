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

check("every house family is in the text", all(("- %s\n" % t) in text or ("- %s |" % t) in text for t in fam))
check("today's corpus fits without dropping any family", "further house families" not in text)

# the replay COBIx asked for on #2925, offline: every saved answer that joined a house family still finds
# that family, under its issuer, in the rules the run now sends
recs = json.load(open(C.CLASSIFIED, encoding="utf-8")).get("records", {})
joined = [r.get("unified_title") for r in recs.values() if r.get("unified_title") in fam]
def under_issuer(t):
    iss = fam[t]
    if len(iss) != 1:
        return ("- %s |" % t) in text or ("- %s\n" % t) in text
    h = text.find("## Issuer: %s\n" % next(iter(iss)))
    seg = text[h:text.find("\n## ", h + 3)] + "\n"
    return h >= 0 and ("\n- %s\n" % t) in seg
lost = [t for t in joined if not under_issuer(t)]
check("every saved answer's house family is still listed with its issuer (%d answers)" % len(joined), joined and not lost, lost[:5])

# the trim order on a small fixture: flat when it fits, grouped (lossless) when not, near families last
small = {"CompTIA Security+": {"CompTIA"}, "Forklift Operator": {"OSHA Training Institute"}, "Welding Level 1": {"AWS"},
         "Forklift Safety": {"OSHA Training Institute"}}
small.update({"OSHA Course %d" % i: {"OSHA Training Institute"} for i in range(1, 9)})
full = C.rules_text([], "skill", small)
check("with no budget the text is the flat list, unchanged", "- Forklift Operator | OSHA Training Institute" in full and "## Issuer" not in full)
g = C.rules_text([], "skill", small, budget=len(full) - 1, prefer=["anything"])
check("over the budget, families are grouped under their issuer and nothing is lost",
      "## Issuer: OSHA Training Institute\n- Forklift Operator\n- Forklift Safety" in g and "- CompTIA Security+" in g and "- Welding Level 1" in g, g)
tight = C.rules_text([], "skill", small, budget=len("skill") + 10, prefer=["CompTIA Security+ SY0-701"])
check("only when even the grouped list is over do far families go, and the text says how many",
      "## Issuer: CompTIA\n- CompTIA Security+" in tight and "Forklift" not in tight and "11 further house families" in tight, tight)

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
