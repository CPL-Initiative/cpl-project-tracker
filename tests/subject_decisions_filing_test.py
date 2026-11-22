#!/usr/bin/env python3
"""kb/_file_subject_decisions.py (S701, #3655): Sam's 30 held Cerritos decisions as kb_curation rows, prepared.

WHAT THIS GUARDS (each a way the filing would misfile his decisions):
  (1) 30 rows, one per decision, each keyed SUBJ:cerritos|<code>|<band>, field subject_decision, one cohort;
  (2) the band is the page's rule: 29 credit, and AP (no COCI course) whole; no decision lands on a noncredit band;
  (3) ATH is KINE (r-athletics-under-kine-sam-2026-11-22), with its revision recorded in the value;
  (4) every common code is a canonical SUBJ in kb/discipline_canonical_subj4.json;
  (5) the forward file is INSERT only with ON CONFLICT DO NOTHING, and the rollback deletes that cohort's
      subject_decision rows and nothing else;
  (6) neither file is pointed at by kb/migrations/.apply (the conductor applies after a second read);
  (7) a second run writes identical files, and --check passes on the committed files.
Run from repo root: python3 tests/subject_decisions_filing_test.py
"""
import importlib.util
import io
import json
import os
import re
import sys
import contextlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location("fsd", os.path.join(ROOT, "kb", "_file_subject_decisions.py"))
fsd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fsd)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


dec, rows = fsd.plan()
forward, rollback = fsd.render(dec, rows)
ids = [r["course_id"] for r in rows]
check("(1) 30 rows, one per decision, each key unique", len(rows) == 30 and len(set(ids)) == 30 and len(dec["decisions"]) == 30)
check("(1) every key is SUBJ:cerritos|<code>|<band>", all(re.match(r"^SUBJ:cerritos\|[^|]+\|(credit|whole)$", i) for i in ids))
bands = [r["band"] for r in rows]
check("(2) 29 credit and 1 whole", bands.count("credit") == 29 and bands.count("whole") == 1)
check("(2) AP is the whole one; A&P, with its seven credit courses, is credit",
      "SUBJ:cerritos|AP|whole" in ids and "SUBJ:cerritos|A&P|credit" in ids)
ath = [r for r in rows if r["course_id"] == "SUBJ:cerritos|ATH|credit"]
v = json.loads(ath[0]["value"]) if ath else {}
check("(3) ATH is KINE, its revision from ATHL recorded", v.get("common_code") == "KINE" and (v.get("revised") or {}).get("from") == "ATHL")
canon = {x.get("canonical_subj4") for x in json.load(open(os.path.join(ROOT, fsd.CANONICAL), encoding="utf-8"))["disciplines"].values()}
check("(4) every common code is a canonical SUBJ", all(r["common_code"] in canon for r in rows))
vals = [json.loads(r["value"]) for r in rows]
check("(1) each value carries the code and who decided it, and no local title", all(
    x.get("decided_by") == "Sam" and x.get("decided_at") and x.get("source") and "local_title" not in x for x in vals))
insert_body = forward.split("insert into", 1)[1].split("-- Read back", 1)[0]
check("(5) the forward file inserts only, does nothing on conflict, under the one cohort",
      forward.count("insert into public.kb_curation") == 1 and "on conflict (course_id, field) do nothing;" in insert_body
      and not re.search(r"\b(update|delete)\b", insert_body)
      and insert_body.count("'subjects-s701@bot')") == 30 and insert_body.count("'subject_decision'") == 30)
check("(5) the rollback names the same cohort, the SUBJ: prefix and the field",
      rollback.count("delete from public.kb_curation") == 1
      and "reviewer_email = 'subjects-s701@bot' and course_id like 'SUBJ:%' and field = 'subject_decision'" in rollback)
apply_ptr = open(os.path.join(ROOT, "kb", "migrations", ".apply"), encoding="utf-8").read()
check("(6) .apply points at neither file", "s701_subject_decisions" not in apply_ptr)
f2, r2 = fsd.render(*fsd.plan())
check("(7) a second run renders identical text", f2 == forward and r2 == rollback)
on_disk = [open(os.path.join(ROOT, p), encoding="utf-8").read() for p in (fsd.FORWARD, fsd.ROLLBACK)]
check("(7) the committed files are what the inputs give", on_disk == [forward, rollback])
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    rc = fsd.main(["--check"])
check("(7) --check passes", rc == 0)
# A noncredit-only code is refused: the band rule says so before any SQL is written.
check("(2) a code whose COCI courses are all noncredit has no band to file",
      fsd.band_of({"state_courses": 3, "credit_courses": 0, "noncredit_courses": 3}) == "noncredit"
      and fsd.band_of({"state_courses": 0, "credit_courses": 0, "noncredit_courses": 0}) == "whole")

failed = [r for r in results if not r[1]]
for name, ok in results:
    print(("PASS " if ok else "FAIL ") + name)
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
