#!/usr/bin/env python3
"""Guard the Program records view's one write (Sam, Open Asks Sheet 51 card 1, 2026-10-08).

    python3 tests/program_record_verdicts_sql_test.py

chatbox/supabase_program_record_verdicts.sql lets a signed-in reviewer confirm a program
record or say it needs a fix. Confirm can turn a record checked, and Sierra quotes a
checked record to the public, so each property below is one the surface stands on:

  - who wrote it comes from the session's token, never from an argument the page sends;
  - only an allowed reviewer writes, and the check comes before any write;
  - the write holds the fingerprint of the requirements the page showed and refuses a
    record that changed since, so nobody confirms requirements they never read;
  - the fingerprint covers the program and its blocks and leaves out the outcomes, the
    same span kb/_program_requirements_score.py requirements_md5() covers;
  - the log is append-only: the page's roles read it and nothing else, and the file
    never updates or removes a verdict;
  - checked follows the latest verdict only while its fingerprint matches the row, so a
    reload of the same requirements keeps a person's reading and a changed block drops it;
  - Needs a fix files its note through program_source_procedure_set, the one write path
    for a reading procedure (md5-guarded, with history);
  - the three machine checks read the same way in SQL and in the tab (recordChecks and
    machineFails in program_requirements.js).

The live behavior was proven once by a self-test that rolled itself back (S347, ten cases;
docs/program_requirements_harvest_lessons.md). This file keeps the source from drifting.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL = open(os.path.join(ROOT, "chatbox", "supabase_program_record_verdicts.sql"), encoding="utf-8").read()
JS = open(os.path.join(ROOT, "program_requirements.js"), encoding="utf-8").read()
MAP = open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8").read()

results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


def body(fn):
    m = re.search(r"create or replace function public\." + fn + r"\(.*?\n\$\$;?\n|create or replace function public\."
                  + fn + r"\(.*?\nend\n\$\$;", SQL, re.S)
    return m.group(0) if m else ""


add = body("program_record_verdict_add")
check("the write function exists", add)
head = add.split("as $$", 1)[0]
check("it is security definer with a fixed search_path", "security definer" in head and "set search_path = public" in head)
check("it takes no identity argument", not re.search(r"p_(by|email|who|user)\b", head), head)
check("who comes from the session's token", "auth.jwt() ->> 'email'" in add)
gate = add.find("is_allowed_reviewer()")
first_write = min(i for i in (add.find("insert into"), add.find("update public.")) if i >= 0)
check("only an allowed reviewer writes, checked before any write", 0 <= gate < first_write)
fp_check = add.find("p_requirements_fp is distinct from fp")
check("a changed record is refused before the verdict is logged", 0 <= fp_check < add.find("insert into"))
check("the refusal asks for a reload", "errcode = '40001'" in add)
check("Needs a fix takes a note", re.search(r"p_verdict = 'needs_fix' and v_note is null", add))
check("Needs a fix files through program_source_procedure_set", "perform public.program_source_procedure_set(" in add)
check("checked follows the machine checks on confirm", "after := p_verdict = 'confirm' and public.program_record_machine_pass(r.checks)" in add)

fp = body("program_record_fp")
check("the fingerprint leaves out the outcomes and covers the blocks",
      "- 'outcomes'" in fp and "'blocks'" in fp and "md5(" in fp)
mp = body("program_record_machine_pass")
check("the machine checks: coverage, nothing invented, units equal or no printed total",
      "'coverage'" in mp and "'invented'" in mp and "in ('equal', 'unstated')" in mp)
check("the tab reads the machine checks the same way",
      re.search(r'c\.arithmetic !== "equal" && c\.arithmetic !== "unstated"', JS)
      and 'c.coverage !== true' in JS and 'c.invented !== true' in JS)

trg = body("program_requirement_records_follow_verdict")
check("the trigger acts only while the latest verdict's fingerprint matches the row",
      "order by id desc limit 1" in trg and "v.requirements_fp = public.program_record_fp(new.record)" in trg)
check("the trigger runs before every insert and update of a record",
      re.search(r"before insert or update on public\.program_requirement_records\s+for each row", SQL))

check("the log has row-level security and a reviewer-only read",
      "alter table public.program_record_verdicts enable row level security" in SQL
      and re.search(r"program_record_verdicts_reviewer_read on public\.program_record_verdicts\s+for select to authenticated using \(public\.is_allowed_reviewer\(\)\)", SQL))
check("the log is closed to the page's roles, then opened for reads only",
      "revoke all on table public.program_record_verdicts from public, anon, authenticated" in SQL
      and not re.search(r"grant [^;]*(insert|update|delete|truncate)[^;]*on table public\.program_record_verdicts", SQL, re.I))
check("nothing in the file changes or removes a verdict",
      not re.search(r"update public\.program_record_verdicts|delete from public\.program_record_verdicts", SQL, re.I))
check("the write is closed to anon and opened to signed-in users",
      "revoke all on function public.program_record_verdict_add(text, text, text, text, text) from public, anon, authenticated" in SQL
      and "grant execute on function public.program_record_verdict_add(text, text, text, text, text) to authenticated, service_role" in SQL)
check("the trigger function is closed to every API role",
      "revoke all on function public.program_requirement_records_follow_verdict() from public, anon, authenticated" in SQL)
check("the tab calls the one RPC with the fingerprint it read",
      '"/rpc/program_record_verdict_add"' in JS and "p_requirements_fp: p.requirements_fp" in JS)
check("Rule 10 a3: the governance map dismisses both surfaces with a reason",
      '"table:program_record_verdicts"' in MAP and '"rpc:program_record_verdict_add"' in MAP)

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok  " if ok else "FAIL  ") + name + ("" if ok or not why else "\n        > " + str(why)[:300]))
print("\nprogram_record_verdicts_sql_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
