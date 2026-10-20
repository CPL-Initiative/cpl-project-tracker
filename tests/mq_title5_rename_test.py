#!/usr/bin/env python3
"""The nine MQ names stay in the handbook's spelling (Sam, Open Asks Sheet 99 card 6, 2026-10-19).

kb/_mq_title5_rename.py renamed eight Title 5-numbered names and one cut-short name to
mq_sections.json's index spelling. A re-parse of the handbook PDF, a lexicon edit or a stale
export can bring an old spelling back, and a discipline name is a key: an old one splits a
discipline in two without an error. These checks fail on that, and on a rename that touches a
longer name containing a short one ("Disabled Student Programs and Services" contains
"Disabled Student Programs and").

Pure standard library.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _alias_canon  # noqa: E402
import _mq_title5_rename as R  # noqa: E402

results = []


def check(name, ok, detail=""):
    results.append(ok)
    print(f"  {'ok ' if ok else 'FAIL'} {name}" + ("" if ok else f"  -- {detail}"))


print("mq title 5 rename")

left = {rel: R.count(R.read(rel), R.RENAMES) for rel in R.STORES}
check("no store holds an old spelling as a whole string", not any(left.values()), {k: v for k, v in left.items() if v})

disciplines = json.loads(R.read("kb/reference/mq_disciplines.json"))["disciplines"]
sections = json.loads(R.read("kb/reference/mq_sections.json"))["disciplines"]
check("every new name is an MQ discipline in both reference files",
      all(n in disciplines and n in sections for n in R.RENAMES.values()))
check("mq_disciplines.json and mq_sections.json name the same 248 disciplines",
      set(disciplines) == set(sections) and len(disciplines) == 248, (len(disciplines), len(sections)))
check("no MQ name carries a Title 5 section number or ends cut short",
      not [n for n in disciplines if any(t in n for t in ("53412", "53414")) or n.endswith(" and")])

text = ('{"a": "Disabled Student Programs and", "b": "Disabled Student Programs and Services", '
        '"_CANON_SUBJ4::Disabled Student Programs and": 1, '
        '"c": "Learning Disabilities: Disabled Student Programs and Services 53414"}')
out = json.loads(R.rename_text(text))
check("the rename replaces whole strings and _CANON_SUBJ4 keys only",
      out["a"] == "Disabled Student Programs and Services (DSPS)"
      and out["b"] == "Disabled Student Programs and Services"
      and "_CANON_SUBJ4::Disabled Student Programs and Services (DSPS)" in out
      and out["c"] == "Learning Disabilities: Disabled Student Programs and Services", out)

rev = _alias_canon.alternate_to_canonical()
check("an old spelling resolves to its new name for the inference passes",
      all(rev.get(o) == n for o, n in R.RENAMES.items()))
check("the alias file keeps the renames apart from the fan-in aliases the CSR shows as chips",
      not any(o in alts for alts in json.loads(R.read("kb/discipline_aliases.json"))["aliases"].values()
              for o in R.RENAMES))

passed = sum(results)
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
