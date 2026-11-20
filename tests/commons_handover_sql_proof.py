#!/usr/bin/env python3
"""Run the hand-over migration against a throwaway Postgres: the database itself keeps the sign-in rule and the
privacy rule, whatever the page does.

WHY (Sam, 2026-11-20, "yes, build it!" on the Commons order mock; Rule 10 a3). commons_handover.js lets a signed-in
reviewer hand over a file, a link, pasted data or an API procedure. A course outline can name faculty, and a row names
the person who handed it over, so the page cannot be the only gate: anyone holding the published anon key can call the
Data API directly. This runs the committed files themselves,
  kb/migrations/2026-11-20_commons_handover.sql and
  kb/migrations/2026-11-20_commons_handover_rollback.sql,
against stand-ins for Supabase's API roles, auth.jwt(), storage and is_allowed_reviewer(), and proves:
  (1) the anon key cannot add a row, read the table, or answer one; a signed-in person who is not a reviewer cannot
      add a row and reads none;
  (2) a reviewer's row carries the reviewer's own address, even when the payload names someone else;
  (3) a payload the page would never make is refused: a link that is no web address, a file that is not in the store,
      a path outside the page's shape, a paste with nothing in it or with a field the table does not take, an API box
      with no address;
  (4) no API role can insert, change or delete a row directly: commons_handover_add() is the one way in;
  (5) the store takes a reviewer's upload and gives no API role a read of it; a non-reviewer's upload is refused;
  (6) only the service role answers a row (commons_handover_mark), and an unknown status is refused;
  (7) the public summary carries counts and no column that could hold a person, a file name, an address or text;
  (8) the rollback closes the three functions and the upload, keeps a table that holds rows (closed to every API
      role) and removes an empty one with its bucket; the migration then applies again.

It needs Postgres binaries (see tests/library_publishing_sql_proof.py, whose throwaway cluster this reuses). With none
it prints SKIP and exits 0.

Run: python3 tests/commons_handover_sql_proof.py
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORWARD = os.path.join(ROOT, "kb/migrations/2026-11-20_commons_handover.sql")
ROLLBACK = os.path.join(ROOT, "kb/migrations/2026-11-20_commons_handover_rollback.sql")

_spec = importlib.util.spec_from_file_location("libproof", os.path.join(ROOT, "tests/library_publishing_sql_proof.py"))
_lib = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lib)

# The Supabase pieces the migration calls. The default privileges are the live project's: every new function and
# table is granted to the API roles by name, so a file that forgets to revoke leaves the door open here too.
STUBS = """
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth; create schema if not exists storage;
create or replace function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema storage, auth, public to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;
create table public.allowed_reviewers (email text primary key);
insert into public.allowed_reviewers values ('reviewer@example.org');
create function public.is_allowed_reviewer() returns boolean language sql security definer set search_path = public as
  $$ select exists (select 1 from public.allowed_reviewers where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
"""

ANON = "set role anon; set request.jwt.claims = '{}';"
VISITOR = "set role authenticated; set request.jwt.claims = '{\"email\":\"visitor@example.org\"}';"
REVIEWER = "set role authenticated; set request.jwt.claims = '{\"email\":\"Reviewer@Example.org\"}';"
SERVICE = "set role service_role;"
PATH = "2026-11-20/123e4567-e89b-12d3-a456-426614174000/hlth-167-outline.pdf"

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def add(c, who, payload):
    return c.psql("select public.commons_handover_add('%s'::jsonb);" % payload.replace("'", "''"), who)


LINK = '{"kind":"link","dataset":"course_outlines","subject_kind":"course","college":"Grossmont College","course_code":"OT 110","link_url":"https://example.edu/outlines/ot110"}'


def main():
    c = _lib.Cluster()
    c.db = "commons_handover_proof_%d" % os.getpid()
    if not c.start():
        print("SKIP - no Postgres binaries here (initdb, pg_ctl, psql); the proof runs where they are.")
        return 0
    try:
        ok, _, err = c.psql(STUBS)
        check("the stand-ins load", ok, err)
        ok, out, err = c.psql(open(FORWARD).read())
        check("the migration applies", ok, err)
        ok, _, err = c.psql(open(FORWARD).read())
        check("the migration applies a second time", ok, err)

        # (1) the anon key and a signed-in person who is not a reviewer
        ok, _, err = add(c, ANON, LINK)
        check("(1) the anon key cannot add a row", not ok and "permission denied" in err, err)
        ok, _, err = c.psql("select count(*) from public.commons_handover;", ANON)
        check("(1) the anon key cannot read the table", not ok and "permission denied" in err, err)
        ok, _, err = c.psql("select public.commons_handover_mark(gen_random_uuid(), 'reads', null, null, null);", ANON)
        check("(1) the anon key cannot answer a row", not ok and "permission denied" in err, err)
        ok, _, err = add(c, VISITOR, LINK)
        check("(1) a signed-in person who is not a reviewer cannot add a row", not ok and "sign in as a reviewer" in err, err)

        # (2) the reviewer's own address, whatever the payload says
        ok, out, err = add(c, REVIEWER, LINK.replace('"kind"', '"handed_by":"someone.else@example.org","kind"'))
        check("(2) a reviewer adds a link", ok and '"status": "waiting"' in out, err or out)
        ok, out, _ = c.psql("select handed_by || '|' || status || '|' || link_url from public.commons_handover;", SERVICE)
        check("(2) the row carries the reviewer's own address", out == "reviewer@example.org|waiting|https://example.edu/outlines/ot110", out)
        ok, out, _ = c.psql("select count(*) from public.commons_handover;", REVIEWER)
        check("(2) a reviewer reads the table", ok and out == "1", out)
        ok, out, _ = c.psql("select count(*) from public.commons_handover;", VISITOR)
        check("(1) a signed-in person who is not a reviewer reads no row", ok and out == "0", out)

        # (3) payloads the page would never make
        bad = [
            ("a link that is no web address", LINK.replace("https://example.edu/outlines/ot110", "javascript:alert(1)"), "full web address"),
            ("a file that is not in the store", '{"kind":"file","dataset":"course_outlines","subject_kind":"college","college":"Ohlone College","file_path":"%s"}' % PATH, "no such file"),
            ("a path outside the page's shape", '{"kind":"file","dataset":"course_outlines","subject_kind":"college","college":"Ohlone College","file_path":"../other-bucket/x.pdf"}', "not one the page makes"),
            ("a paste with nothing in it", '{"kind":"paste","dataset":"course_outlines","subject_kind":"course","college":"Ohlone College","course_code":"BRDC 127A","pasted":{"description":"  ","slos":[]}}', "paste a description"),
            ("a paste with a field the table does not take", '{"kind":"paste","dataset":"course_outlines","subject_kind":"course","college":"Ohlone College","course_code":"BRDC 127A","pasted":{"description":"x","instructor":"A Person"}}', "does not take"),
            ("an API box with no address", '{"kind":"api","dataset":"catalog","subject_kind":"college","college":"Ohlone College","api":{"which":"catalog","procedure":"ask for courses"}}', "API address"),
            ("an unknown kind", LINK.replace('"kind":"link"', '"kind":"note"'), "kind must be"),
            ("a course with no course code", LINK.replace('"course_code":"OT 110",', ""), "commons_handover_course_ck"),
            ("a dataset the Commons does not hold", LINK.replace("course_outlines", "payroll"), "commons_handover_dataset_ck"),
        ]
        for name, payload, word in bad:
            ok, _, err = add(c, REVIEWER, payload)
            check("(3) refused: " + name, not ok and word in err, err)
        ok, out, _ = c.psql("select count(*) from public.commons_handover;", SERVICE)
        check("(3) no refused payload left a row", out == "1", out)

        # (5) the store: a reviewer uploads, no API role reads it back, a non-reviewer is refused
        ok, _, err = c.psql("insert into storage.objects (bucket_id, name) values ('commons-handover', '%s');" % PATH, REVIEWER)
        check("(5) a reviewer's upload is taken", ok, err)
        ok, _, err = c.psql("insert into storage.objects (bucket_id, name) values ('commons-handover', 'x/y/z.pdf');", VISITOR)
        check("(5) a non-reviewer's upload is refused", not ok and "row-level security" in err, err)
        ok, _, err = c.psql("insert into storage.objects (bucket_id, name) values ('commons-handover', 'x/y/z.pdf');", ANON)
        check("(5) the anon key's upload is refused", not ok and "row-level security" in err, err)
        ok, out, _ = c.psql("select count(*) from storage.objects where bucket_id = 'commons-handover';", REVIEWER)
        check("(5) no API role reads a file back, the reviewer included", ok and out == "0", out)
        ok, out, _ = c.psql("select public from storage.buckets where id = 'commons-handover';")
        check("(5) the bucket is private", out == "f", out)

        # (3, continued) the same file payload is taken once the file is in the store, with the other kinds
        ok, out, err = add(c, REVIEWER, '{"kind":"file","dataset":"course_outlines","subject_kind":"course","college":"North Orange Continuing Education","course_code":"HLTH 167","mid_card":"HLTH M9065","file_path":"%s","file_name":"hlth-167-outline.pdf","file_type":"application/pdf","file_bytes":"48211","link_url":"https://ignored.example"}' % PATH)
        check("(3) a file that is in the store is taken", ok, err)
        ok, out, _ = c.psql("select kind || '|' || coalesce(link_url, 'no link') || '|' || file_bytes from public.commons_handover where kind = 'file';", SERVICE)
        check("(3) a file row keeps the file alone, never a second payload", out == "file|no link|48211", out)
        ok, _, err = add(c, REVIEWER, '{"kind":"paste","dataset":"course_outlines","subject_kind":"course","college":"Grossmont College","course_code":"OT 110","pasted":{"slos":["Identify the bones of the upper limb."],"source_url":"https://example.edu/ot110"}}')
        check("(3) pasted outcomes are taken", ok, err)
        ok, _, err = add(c, REVIEWER, '{"kind":"api","dataset":"catalog","subject_kind":"college","college":"Ohlone College","api":{"which":"catalog","address":"https://api.example.edu/v1/courses","procedure":"GET, one page per subject"}}')
        check("(3) an API procedure is taken", ok, err)

        # (4) no direct write by an API role
        for verb, sql in (("insert", "insert into public.commons_handover (handed_by, dataset, subject_kind, kind, link_url) values ('x@example.org', 'catalog', 'dataset', 'link', 'https://a.example/b');"),
                          ("update", "update public.commons_handover set handed_by = 'x@example.org';"),
                          ("delete", "delete from public.commons_handover;")):
            ok, _, err = c.psql(sql, REVIEWER)
            check("(4) a reviewer cannot %s a row directly" % verb, not ok and "permission denied" in err, err)

        # (6) only the service role answers a row
        ok, rid, _ = c.psql("select id from public.commons_handover where kind = 'link';", SERVICE)
        ok, _, err = c.psql("select public.commons_handover_mark('%s', 'reads', 'x', 'run', null);" % rid, REVIEWER)
        check("(6) a reviewer cannot answer a row", not ok and "permission denied" in err, err)
        ok, out, err = c.psql("select public.commons_handover_mark('%s', 'reads', 'Read with no challenge.', '4470001', '{\"http_status\":200,\"outcomes\":4}'::jsonb);" % rid, SERVICE)
        check("(6) the service role answers a row", ok and '"rows": 1' in out, err or out)
        ok, out, _ = c.psql("select status || '|' || status_run || '|' || (found ->> 'outcomes') || '|' || handed_by from public.commons_handover where id = '%s';" % rid, SERVICE)
        check("(6) the answer moves the status and leaves the name alone", out == "reads|4470001|4|reviewer@example.org", out)
        ok, _, err = c.psql("select public.commons_handover_mark('%s', 'approved', null, null, null);" % rid, SERVICE)
        check("(6) an unknown status is refused", not ok and "unknown status" in err, err)

        # (7) the public summary
        ok, out, err = c.psql("select string_agg(college || ':' || coalesce(course_code, '-') || ':' || kind || ':' || status || ':' || n, ' ; ' order by college, kind) from public.commons_handover_summary();", ANON)
        check("(7) the anon key reads the summary", ok and "Grossmont College:OT 110:link:reads:1" in out and "Ohlone College:-:api:waiting:1" in out, err or out)
        ok, cols, _ = c.psql("select string_agg(a.attname, ',' order by a.attnum) from pg_proc p join pg_type t on t.oid = p.prorettype "
                             "cross join lateral unnest(p.proargnames) with ordinality as a(attname, attnum) where p.proname = 'commons_handover_summary';")
        check("(7) the summary's columns hold no person, file name, address or text",
              cols == "dataset,subject_kind,college,course_code,kind,status,n,newest", cols)

        # (8) the rollback keeps a table that holds rows, closed; removes an empty one; the migration applies again
        ok, out, err = c.psql(open(ROLLBACK).read())
        check("(8) the rollback applies with rows in place", ok and out.endswith("t|t"), err or out)
        ok, _, err = add(c, REVIEWER, LINK)
        check("(8) after the rollback nothing can be added", not ok and "does not exist" in err, err)
        ok, _, err = c.psql("select count(*) from public.commons_handover;", REVIEWER)
        check("(8) after the rollback no API role reads the kept table", not ok and "permission denied" in err, err)
        ok, _, err = c.psql("insert into storage.objects (bucket_id, name) values ('commons-handover', 'a/b/c.pdf');", REVIEWER)
        check("(8) after the rollback the upload is closed", not ok and "row-level security" in err, err)
        ok, out, _ = c.psql("select count(*) from public.commons_handover;", SERVICE)
        check("(8) the rollback kept every row", out == "4", out)
        c.psql("delete from public.commons_handover; delete from storage.objects where bucket_id = 'commons-handover';")
        ok, out, err = c.psql(open(ROLLBACK).read())
        check("(8) with no rows and no files the rollback removes the table and the bucket", ok and out.endswith("f|f"), err or out)
        ok, out, err = c.psql(open(FORWARD).read())
        check("(8) the migration applies again after the rollback", ok and "commons_handover|0|f|f|t|t|f" in out, err or out)
    finally:
        c.stop()

    bad = [r for r in results if not r[1]]
    for name, passed, why in results:
        print(("ok   " if passed else "FAIL ") + name + ("" if passed else "\n       " + str(why)[:600]))
    print("\n%d checks, %d failed" % (len(results), len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
