#!/usr/bin/env python3
"""Run the S693 "answer as filed" write against a throwaway Postgres: it answers only the rows it names, only while
each still stands as it was read, and its rollback puts back what stood.

WHY (Rule 10 a and a2). kb/migrations/2026-11-20_s693_handover_mark_filed.sql is a guarded UPDATE of 11 rows a person
entered (Sam's first hand-overs: eight pasted entries, three links). This runs the committed file and its rollback
over the table as its two migrations make it, and proves:
  (1) the eight waiting pasted entries and the three read links are answered `filed`, each with its note, and the
      result holds the values each replaced;
  (2) nothing else moves: the person, the payload, the subject, the links' counts, and every other row;
  (3) a row that moved since the read is left alone and is absent from the result (here: a pasted entry a person's
      later answer already set aside);
  (4) a second run answers nothing;
  (5) the rollback puts each answered row back (a pasted entry waiting; a link read by its run, with its counts) and
      leaves alone a row it did not answer.

It needs Postgres binaries (see tests/library_publishing_sql_proof.py). With none it prints SKIP and exits 0.

Run: python3 tests/handover_mark_filed_sql_proof.py
"""
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "kb/migrations/2026-11-20_commons_handover.sql")
NOTE = os.path.join(ROOT, "kb/migrations/2026-11-20_commons_handover_note.sql")
FORWARD = os.path.join(ROOT, "kb/migrations/2026-11-20_s693_handover_mark_filed.sql")
ROLLBACK = os.path.join(ROOT, "kb/migrations/2026-11-20_s693_handover_mark_filed_rollback.sql")


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_lib = _load("libproof", "tests/library_publishing_sql_proof.py")
_base = _load("handoverproof", "tests/commons_handover_sql_proof.py")
SERVICE = _base.SERVICE

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def main():
    sql = open(FORWARD).read()
    want = re.findall(r"\('([0-9a-f-]{36})'::uuid, '(waiting|reads)'", sql)
    pastes = [i for i, s in want if s == "waiting"]
    links = [i for i, s in want if s == "reads"]
    check("the file names eight pasted entries and three links", len(pastes) == 8 and len(links) == 3 and len(set(pastes + links)) == 11, str(len(want)))
    rb_ids = set(re.findall(r"\('([0-9a-f-]{36})'::uuid", open(ROLLBACK).read()))
    check("the rollback names the same 11 rows", rb_ids == set(pastes + links), str(len(rb_ids)))

    c = _lib.Cluster()
    c.db = "handover_mark_filed_proof_%d" % os.getpid()
    if not c.start():
        print("SKIP - no Postgres binaries here (initdb, pg_ctl, psql); the proof runs where they are.")
        return 0
    try:
        for f in (None, BASE, NOTE):
            ok, _, err = c.psql(_base.STUBS if f is None else open(f).read())
            check("setup applies: " + (os.path.basename(f) if f else "the stand-ins"), ok, err)
        # The table as the session read it: eight pasted entries waiting, three links read, and two rows the file
        # does not name (a note waiting, a file read).
        # Each link holds the counts its live row held when the session read it (the rollback file's own values), so
        # the restore is checked against what stood, never against a stand-in (the second read of pull request 3613).
        held = dict(re.findall(r"\('([0-9a-f-]{36})'::uuid, 'reads', '44806543827', '(\{[^']*\})'::jsonb\)", open(ROLLBACK).read()))
        rows = []
        for n, i in enumerate(pastes):
            rows.append("('%s','sam@example.org','course_outlines','course','A College','C %d','paste',null,'{\"description\":\"d%d\"}',null,'waiting',null,null)" % (i, n, n))
        for n, i in enumerate(links):
            rows.append("('%s','sam@example.org','course_outlines','course','A College','L %d','link','https://catalog.example.edu/%d',null,null,'reads','44806543827','%s')" % (i, n, n, held[i]))
        rows.append("('11111111-1111-4111-8111-111111111111','sam@example.org','course_outlines','course','A College','N 1','note',null,null,'{\"not_in_catalog\":true}','waiting',null,null)")
        ok, _, err = c.psql("insert into public.commons_handover (id, handed_by, dataset, subject_kind, college, course_code, kind, link_url, pasted, note, status, status_run, found) values\n" + ",\n".join(
            r.replace("'{", "'{").replace("}'", "}'") for r in rows) + ";")
        check("the table stands as the session read it", ok, err)
        # (3) one pasted entry moved since the read
        moved = pastes[-1]
        c.psql("select public.commons_handover_mark('%s', 'set_aside', 'A later answer.', 'someone-else', null);" % moved, SERVICE)
        ok, snap, _ = c.psql("select md5(string_agg(id::text || handed_by || coalesce(link_url,'') || coalesce(pasted::text,'') || coalesce(note::text,'') || college || course_code || kind || created_at::text, '|' order by id)) from public.commons_handover;")

        ok, out, err = c.psql(sql)
        check("(1) the write applies", ok, err)
        marked = json.loads(out.splitlines()[-1]) if ok and out else []
        check("(1) ten rows are answered: seven pasted entries and three links", len(marked) == 10 and sum(1 for m in marked if m["kind"] == "paste") == 7 and all(m["rows"] == 1 for m in marked), out[:300])
        check("(1) the result holds what each replaced", all(m["before"]["status"] == ("waiting" if m["kind"] == "paste" else "reads") for m in marked)
              and all(m["before"]["status_run"] == "44806543827" and m["before"]["found"] == json.loads(held[m["id"]]) for m in marked if m["kind"] == "link"), out[:300])
        ok, out, _ = c.psql("select string_agg(kind || ':' || status || ':' || coalesce(status_run,'-') || ':' || (status_note is not null), ',' order by kind, status) from (select distinct kind, status, status_run, status_note is not null as status_note from public.commons_handover) t;")
        check("(1) pasted entries and links read filed under session-693, each with a note",
              "link:filed:session-693:true" in out and "paste:filed:session-693:true" in out and "link:reads" not in out and "paste:waiting" not in out, out)
        ok, out, _ = c.psql("select string_agg(found ->> 'chars', ',' order by found ->> 'chars') from public.commons_handover where kind = 'link' and status = 'filed';")
        check("(2) the links keep the reader's counts", out == "5537,5537,7367", out)
        ok, snap2, _ = c.psql("select md5(string_agg(id::text || handed_by || coalesce(link_url,'') || coalesce(pasted::text,'') || coalesce(note::text,'') || college || course_code || kind || created_at::text, '|' order by id)) from public.commons_handover;")
        check("(2) no person, payload or subject moved on any row", snap == snap2 and len(snap) == 32, snap + " " + snap2)
        ok, out, _ = c.psql("select status || '|' || coalesce(status_run, '-') from public.commons_handover where id = '11111111-1111-4111-8111-111111111111';")
        check("(2) a row the file does not name is untouched", out == "waiting|-", out)
        ok, out, _ = c.psql("select status || '|' || status_run || '|' || status_note from public.commons_handover where id = '%s';" % moved)
        check("(3) a row that moved since the read is left alone", out == "set_aside|someone-else|A later answer.", out)
        check("(3) and it is absent from the result", moved not in [m["id"] for m in marked])

        ok, out, err = c.psql(sql)
        check("(4) a second run answers nothing", ok and out.strip() == "", err or out[:200])

        ok, out, err = c.psql(open(ROLLBACK).read())
        check("(5) the rollback applies", ok, err)
        ok, out, _ = c.psql("select string_agg(kind || ':' || status || ':' || coalesce(status_run,'-') || ':' || (status_note is null) || ':' || coalesce(found ->> 'chars', '-'), ',' order by kind, status) from "
                            "(select distinct kind, status, status_run, status_note, found from public.commons_handover where kind in ('paste','link')) t;")
        check("(5) each answered row is back as it stood: a pasted entry waiting, a link read by its run with its own counts",
              out == "link:reads:44806543827:true:5537,link:reads:44806543827:true:7367,paste:set_aside:someone-else:false:-,paste:waiting:-:true:-", out)
        ok, out, _ = c.psql("select status from public.commons_handover where id = '%s';" % moved)
        check("(5) the rollback leaves alone a row the write did not answer", out == "set_aside", out)
    finally:
        c.stop()

    bad = [r for r in results if not r[1]]
    for name, passed, why in results:
        print(("ok   " if passed else "FAIL ") + name + ("" if passed else "\n       " + str(why)[:600]))
    print("\n%d checks, %d failed" % (len(results), len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
