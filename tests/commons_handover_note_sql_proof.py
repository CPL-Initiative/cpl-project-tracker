#!/usr/bin/env python3
"""Run the hand-over's note migration against a throwaway Postgres: a note is a fifth kind the database itself
guards, and adding it moves nothing the first four kinds rest on.

WHY (Sam, 2026-11-20, in session: "the hand-over panel needs a place to leave a note. I got to Ohlone's BRDC 127A,
127B, 127C and 127D and they are not in the catalog, but there is no place for me to note that."). The note is free
text a reviewer writes, so it can name a person: it must reach the table only through commons_handover_add(), under
the reviewer's own name, and never reach the public summary. This runs the committed files themselves,
  kb/migrations/2026-11-20_commons_handover.sql (the table as it stood),
  kb/migrations/2026-11-20_commons_handover_note.sql and
  kb/migrations/2026-11-20_commons_handover_note_rollback.sql,
against the stand-ins tests/commons_handover_sql_proof.py holds, and proves:
  (1) the note migration applies over a table that already holds rows of the four kinds, twice, and leaves them;
  (2) the anon key and a signed-in person who is not a reviewer cannot add a note;
  (3) a reviewer's note carries the reviewer's own address, its words, the not-in-the-catalog box and where they
      looked, and no other payload;
  (4) a note the page would never make is refused: no words and no box, a field the table does not take, the box
      set to anything but true, the box on a college, a place that is no web address, words that are not text, a
      note too long;
  (5) the four kinds are still taken and still refuse what they refused; a row that is no note carries none;
  (6) the public summary counts the note and still has no column that could hold its words;
  (7) the service role answers a note; a reviewer cannot;
  (8) the rollback closes the way in and keeps a table that holds notes; with none it takes the column and the
      five-kind checks away; the note migration then applies again.

It needs Postgres binaries (see tests/library_publishing_sql_proof.py). With none it prints SKIP and exits 0.

Run: python3 tests/commons_handover_note_sql_proof.py
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "kb/migrations/2026-11-20_commons_handover.sql")
FORWARD = os.path.join(ROOT, "kb/migrations/2026-11-20_commons_handover_note.sql")
ROLLBACK = os.path.join(ROOT, "kb/migrations/2026-11-20_commons_handover_note_rollback.sql")


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_lib = _load("libproof", "tests/library_publishing_sql_proof.py")
_base = _load("handoverproof", "tests/commons_handover_sql_proof.py")
ANON, VISITOR, REVIEWER, SERVICE, LINK = _base.ANON, _base.VISITOR, _base.REVIEWER, _base.SERVICE, _base.LINK

COURSE = '"dataset":"course_outlines","subject_kind":"course","college":"Ohlone College","course_code":"BRDC 127A","control_number":"CCC000337481"'
NOTE = '{"kind":"note",%s,"note":{"text":"Not printed in chapter 7 of the 2026-2027 catalog.","not_in_catalog":true,"source_url":"https://www.example.edu/catalog/chapter_7.pdf"}}' % COURSE
PASTE = '{"kind":"paste","dataset":"course_outlines","subject_kind":"course","college":"Grossmont College","course_code":"OT 110","pasted":{"description":"A study of the muscular-skeletal systems."}}'

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def add(c, who, payload):
    return c.psql("select public.commons_handover_add('%s'::jsonb);" % payload.replace("'", "''"), who)


def main():
    c = _lib.Cluster()
    c.db = "commons_handover_note_proof_%d" % os.getpid()
    if not c.start():
        print("SKIP - no Postgres binaries here (initdb, pg_ctl, psql); the proof runs where they are.")
        return 0
    try:
        ok, _, err = c.psql(_base.STUBS)
        check("the stand-ins load", ok, err)
        ok, _, err = c.psql(open(BASE).read())
        check("the table as it stood applies", ok, err)
        ok, _, err = add(c, REVIEWER, LINK)
        check("a link is on the table before the note exists", ok, err)
        ok, _, err = add(c, REVIEWER, PASTE)
        check("a pasted entry is on the table before the note exists", ok, err)
        ok, _, err = add(c, REVIEWER, NOTE)
        check("before the migration a note is an unknown kind", not ok and "kind must be file, link, paste or api" in err, err)

        # (1) the migration applies over rows, twice
        ok, out, err = c.psql(open(FORWARD).read())
        check("(1) the note migration applies over a table that holds rows", ok and "commons_handover note|2|0|f|t|t" in out, err or out)
        ok, out, err = c.psql(open(FORWARD).read())
        check("(1) the note migration applies a second time", ok and "commons_handover note|2|0|f|t|t" in out, err or out)
        ok, out, _ = c.psql("select string_agg(kind || ':' || (note is null), ',' order by kind) from public.commons_handover;", SERVICE)
        check("(1) the rows that were there are untouched and carry no note", out == "link:true,paste:true", out)

        # (2) who may not
        ok, _, err = add(c, ANON, NOTE)
        check("(2) the anon key cannot add a note", not ok and "permission denied" in err, err)
        ok, _, err = add(c, VISITOR, NOTE)
        check("(2) a signed-in person who is not a reviewer cannot add a note", not ok and "sign in as a reviewer" in err, err)

        # (3) a reviewer's note
        ok, out, err = add(c, REVIEWER, NOTE.replace('"kind"', '"handed_by":"someone.else@example.org","link_url":"https://a.example/b","kind"'))
        check("(3) a reviewer adds a note", ok and '"status": "waiting"' in out, err or out)
        ok, out, _ = c.psql("select handed_by || '|' || status || '|' || (note ->> 'text') || '|' || (note ->> 'not_in_catalog') || '|' || (note ->> 'source_url') "
                            "|| '|' || coalesce(link_url, 'no link') || '|' || (pasted is null) || '|' || (api is null) || '|' || (file_path is null) "
                            "from public.commons_handover where kind = 'note';", SERVICE)
        check("(3) the note carries the reviewer's own address, its words, the box, the place, and no other payload",
              out == "reviewer@example.org|waiting|Not printed in chapter 7 of the 2026-2027 catalog.|true|https://www.example.edu/catalog/chapter_7.pdf|no link|true|true|true", out)
        ok, _, err = add(c, REVIEWER, '{"kind":"note",%s,"note":{"not_in_catalog":true}}' % COURSE.replace("127A", "127B"))
        check("(3) the box alone is a note", ok, err)
        ok, _, err = add(c, REVIEWER, '{"kind":"note","dataset":"catalog","subject_kind":"college","college":"Ohlone College","note":{"text":"The catalog moved to a new address in August."}}')
        check("(3) words alone are a note, on a college", ok, err)
        ok, _, err = add(c, REVIEWER, '{"kind":"note","dataset":"term_reports","subject_kind":"dataset","note":{"text":"Spring 2026 is posted in March."}}')
        check("(3) words alone are a note, on a statewide dataset", ok, err)

        # (4) notes the page would never make
        bad = [
            ("no words and no box", '{"kind":"note",%s,"note":{"text":"   "}}' % COURSE, "write the note first"),
            ("an empty note", '{"kind":"note",%s,"note":{}}' % COURSE, "write the note first"),
            ("no note at all", '{"kind":"note",%s}' % COURSE, "missing or too long"),
            ("a note that is not an object", '{"kind":"note",%s,"note":"not in the catalog"}' % COURSE, "missing or too long"),
            ("a field the table does not take", '{"kind":"note",%s,"note":{"text":"x","handed_by":"A Person"}}' % COURSE, "does not take (handed_by)"),
            ("the box set to false", '{"kind":"note",%s,"note":{"text":"x","not_in_catalog":false}}' % COURSE, "checked or left out"),
            ("the box set to a word", '{"kind":"note",%s,"note":{"not_in_catalog":"yes"}}' % COURSE, "checked or left out"),
            ("the box on a college", '{"kind":"note","dataset":"catalog","subject_kind":"college","college":"Ohlone College","note":{"not_in_catalog":true}}', "checked or left out"),
            ("a place that is no web address", '{"kind":"note",%s,"note":{"text":"x","source_url":"javascript:alert(1)"}}' % COURSE, "full web address"),
            ("words that are not text", '{"kind":"note",%s,"note":{"text":["x"]}}' % COURSE, "not text"),
            ("a note too long", '{"kind":"note",%s,"note":{"text":"%s"}}' % (COURSE, "x" * 4100), "missing or too long"),
            ("a course's note with no course code", NOTE.replace('"course_code":"BRDC 127A",', ""), "commons_handover_course_ck"),
        ]
        for name, payload, word in bad:
            ok, _, err = add(c, REVIEWER, payload)
            check("(4) refused: " + name, not ok and word in err, err)
        ok, out, _ = c.psql("select count(*) from public.commons_handover where kind = 'note';", SERVICE)
        check("(4) no refused note left a row", out == "4", out)

        # (5) the four kinds, as before
        ok, _, err = add(c, REVIEWER, LINK.replace("OT 110", "OT 111"))
        check("(5) a link is still taken", ok, err)
        ok, _, err = add(c, REVIEWER, PASTE.replace('"kind"', '"note":{"text":"smuggled"},"kind"'))
        check("(5) a pasted entry is still taken", ok, err)
        ok, out, _ = c.psql("select count(*) from public.commons_handover where kind <> 'note' and note is not null;", SERVICE)
        check("(5) a row that is no note carries none, even when the payload sends one", out == "0", out)
        ok, _, err = add(c, REVIEWER, LINK.replace("https://example.edu/outlines/ot110", "javascript:alert(1)"))
        check("(5) a link that is no web address is still refused", not ok and "full web address" in err, err)
        ok, _, err = add(c, REVIEWER, LINK.replace('"kind":"link"', '"kind":"memo"'))
        check("(5) an unknown kind is refused, and the refusal names the note", not ok and "file, link, paste, api or note" in err, err)
        ok, _, err = c.psql("insert into public.commons_handover (handed_by, dataset, subject_kind, kind, note) values ('x@example.org', 'catalog', 'dataset', 'note', '{\"text\":\"x\"}');", REVIEWER)
        check("(5) a reviewer cannot insert a note directly", not ok and "permission denied" in err, err)
        ok, _, err = c.psql("insert into public.commons_handover (handed_by, dataset, subject_kind, kind, note, link_url) values ('x@example.org', 'catalog', 'dataset', 'note', '{\"text\":\"x\"}', 'https://a.example/b');")
        check("(5) the table itself refuses a note that carries a second payload", not ok and "commons_handover_payload_ck" in err, err)

        # (6) the public summary
        ok, out, err = c.psql("select string_agg(college || ':' || coalesce(course_code, '-') || ':' || kind || ':' || status || ':' || n, ' ; ' order by college, course_code, kind) "
                              "from public.commons_handover_summary() where kind = 'note' and college is not null;", ANON)
        check("(6) the anon key's summary counts the notes", ok and out == "Ohlone College:BRDC 127A:note:waiting:1 ; Ohlone College:BRDC 127B:note:waiting:1 ; Ohlone College:-:note:waiting:1", err or out)
        ok, cols, _ = c.psql("select string_agg(a.attname, ',' order by a.attnum) from pg_proc p "
                             "cross join lateral unnest(p.proargnames) with ordinality as a(attname, attnum) where p.proname = 'commons_handover_summary';")
        check("(6) the summary's columns still hold no person, address or text", cols == "dataset,subject_kind,college,course_code,kind,status,n,newest", cols)
        ok, out, _ = c.psql("select count(*) from public.commons_handover where kind = 'note';", VISITOR)
        check("(6) a signed-in person who is not a reviewer reads no note", ok and out == "0", out)

        # (7) answering a note
        ok, rid, _ = c.psql("select id from public.commons_handover where kind = 'note' and course_code = 'BRDC 127A';", SERVICE)
        ok, _, err = c.psql("select public.commons_handover_mark('%s', 'filed', 'x', 'run', null);" % rid, REVIEWER)
        check("(7) a reviewer cannot answer a note", not ok and "permission denied" in err, err)
        ok, out, err = c.psql("select public.commons_handover_mark('%s', 'filed', 'Filed as the catalog factor for the no-longer-offered check.', 'session-693', null);" % rid, SERVICE)
        check("(7) the service role answers a note", ok and '"rows": 1' in out, err or out)
        ok, out, _ = c.psql("select status || '|' || (note ->> 'not_in_catalog') || '|' || handed_by from public.commons_handover where id = '%s';" % rid, SERVICE)
        check("(7) the answer moves the status and leaves the note and the name alone", out == "filed|true|reviewer@example.org", out)

        # (8) the rollback
        ok, out, err = c.psql(open(ROLLBACK).read())
        check("(8) the rollback applies with notes in place and keeps them", ok and out.endswith("t|4"), err or out)
        ok, _, err = add(c, REVIEWER, NOTE)
        check("(8) after the rollback no note can be added", not ok and "kind must be file, link, paste or api" in err, err)
        ok, _, err = add(c, REVIEWER, LINK.replace("OT 110", "OT 112"))
        check("(8) after the rollback a link is still taken", ok, err)
        ok, out, _ = c.psql("select count(*) from public.commons_handover where kind = 'note';", REVIEWER)
        check("(8) after the rollback a reviewer still reads the kept notes", ok and out == "4", out)
        c.psql("delete from public.commons_handover where kind = 'note';")
        ok, out, err = c.psql(open(ROLLBACK).read())
        check("(8) with no notes the rollback takes the column away", ok and out.endswith("f|0"), err or out)
        ok, out, _ = c.psql("select pg_get_constraintdef(c.oid) from pg_constraint c where c.conname = 'commons_handover_kind_ck';")
        check("(8) and the kinds are four again", "note" not in out and "'api'" in out, out)
        ok, out, _ = c.psql("select count(*) from public.commons_handover;", SERVICE)
        check("(8) the rollback kept every row of the four kinds", out == "5", out)
        ok, out, err = c.psql(open(FORWARD).read())
        check("(8) the note migration applies again after the rollback", ok and "commons_handover note|5|0|f|t|t" in out, err or out)
        ok, _, err = add(c, REVIEWER, NOTE)
        check("(8) and a note is taken again", ok, err)
    finally:
        c.stop()

    bad = [r for r in results if not r[1]]
    for name, passed, why in results:
        print(("ok   " if passed else "FAIL ") + name + ("" if passed else "\n       " + str(why)[:600]))
    print("\n%d checks, %d failed" % (len(results), len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
