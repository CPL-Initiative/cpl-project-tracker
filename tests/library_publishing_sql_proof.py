#!/usr/bin/env python3
"""Run the Library publishing-model migration against a throwaway Postgres: the database refuses a listing with no
passing check, and the rollback refuses while checks exist and then restores the old function.

WHY (second read of #3572, 2026-11-19). The Library tab gates Publish to Public Library on a passing accessibility check
record, but a phrase holder can call cpl_library_set_public() with the anon key directly. Sam's rule (Nov 19, via
COBIx: "The only gate on the Public Library is the passing accessibility check record") holds only if the function
refuses too. This runs the committed files themselves:
  kb/supabase_cpl_library_public.sql as it stands on main's schema, then
  kb/migrations/2026-11-19_library_publishing_model.sql, then
  kb/migrations/2026-11-19_library_publishing_model_rollback.sql,
against stubs of Supabase's auth.role(), auth.jwt(), team_pass_ok() and is_allowed_reviewer(), and proves:
  * with the team phrase and no check row, listing is refused and nothing changes;
  * a failing latest check, a pass for another version, or a pass for a draft is refused;
  * the latest passing check for the page the record names now lists it ('page', then 'version:<n>');
  * unlisting needs no check, and resets publish_target from public to internal;
  * the service role is exempt; the function keeps EXECUTE for anon, authenticated and service_role, and not PUBLIC;
  * the rollback refuses while a check exists (naming the count), and once they are gone restores the ungated
    function and drops the tables and columns.

It needs Postgres binaries: a server reachable at PGHOST/PGPORT with createdb rights, or initdb and pg_ctl on the
PATH or under /usr/lib/postgresql/*/bin, from which it starts a cluster of its own in a temporary folder (as the
postgres user when run as root). With neither it prints SKIP and exits 0.

Run: python3 tests/library_publishing_sql_proof.py
"""
import glob
import os
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_SQL = os.path.join(ROOT, "kb/supabase_cpl_library_public.sql")
FORWARD = os.path.join(ROOT, "kb/migrations/2026-11-19_library_publishing_model.sql")
ROLLBACK = os.path.join(ROOT, "kb/migrations/2026-11-19_library_publishing_model_rollback.sql")

# The Supabase pieces the files call, and cpl_library with the columns they read (kb/supabase_cpl_library.sql).
STUBS = """
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
create schema if not exists auth;
create or replace function auth.role() returns text language sql stable as
  $f$ select nullif(current_setting('test.role', true), '') $f$;
create or replace function auth.jwt() returns jsonb language sql stable as $f$ select '{}'::jsonb $f$;
create or replace function public.team_pass_ok() returns boolean language sql stable as
  $f$ select coalesce(current_setting('test.team_pass', true), '') = 'on' $f$;
create or replace function public.is_allowed_reviewer() returns boolean language sql stable as $f$ select false $f$;
create table public.cpl_library (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null,
  url text, retired_at timestamptz, seen_by text, version text, remediation text, updated_by text,
  kind text, occasion text, made_on date, versions jsonb not null default '[]'::jsonb,
  for_kind text, for_category text, for_name text);
"""


def find_bin(name):
    hit = shutil.which(name)
    if hit:
        return hit
    for d in sorted(glob.glob("/usr/lib/postgresql/*/bin"), reverse=True):
        if os.path.exists(os.path.join(d, name)):
            return os.path.join(d, name)
    return None


class Cluster:
    """A throwaway server: the one at PGHOST/PGPORT, or a cluster started here."""

    def __init__(self):
        self.tmp = None
        self.env = dict(os.environ)
        self.as_user = []
        self.db = "lib_publishing_proof_%d" % os.getpid()

    def start(self):
        if os.environ.get("PGHOST"):
            return self.createdb()
        initdb, pg_ctl = find_bin("initdb"), find_bin("pg_ctl")
        if not (initdb and pg_ctl and find_bin("psql")):
            return False
        self.tmp = tempfile.mkdtemp(prefix="libproof-")
        if os.geteuid() == 0:
            self.as_user = ["runuser", "-u", "postgres", "--"]
            shutil.chown(self.tmp, "postgres")
        data, sock = os.path.join(self.tmp, "data"), self.tmp
        if subprocess.run(self.as_user + [initdb, "-D", data, "-A", "trust", "-U", "postgres"], capture_output=True).returncode:
            return False
        port = str(54000 + os.getpid() % 900)
        if subprocess.run(self.as_user + [pg_ctl, "-D", data, "-l", os.path.join(self.tmp, "log"), "-w",
                                          "-o", "-k %s -p %s -c listen_addresses=''" % (sock, port), "start"],
                          capture_output=True).returncode:
            return False
        self.pg_ctl, self.data = pg_ctl, data
        self.env.update({"PGHOST": sock, "PGPORT": port, "PGUSER": "postgres"})
        return self.createdb()

    def createdb(self):
        r = subprocess.run(self.as_user + ["createdb", self.db] if find_bin("createdb") else ["false"],
                           capture_output=True, env=self.env)
        if r.returncode:
            r = subprocess.run(self.as_user + [find_bin("createdb") or "createdb", self.db], capture_output=True, env=self.env)
        return r.returncode == 0

    def psql(self, sql, setup=""):
        """Run sql in one session after setup; returns (ok, stdout, stderr)."""
        r = subprocess.run(self.as_user + [find_bin("psql"), "-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-d", self.db],
                           input=setup + "\n" + sql, capture_output=True, text=True, env=self.env)
        return r.returncode == 0, r.stdout.strip(), r.stderr.strip()

    def stop(self):
        if self.tmp:
            subprocess.run(self.as_user + [self.pg_ctl, "-D", self.data, "-m", "immediate", "stop"], capture_output=True)
            shutil.rmtree(self.tmp, ignore_errors=True)
        else:
            subprocess.run(self.as_user + [find_bin("dropdb") or "dropdb", "--if-exists", self.db], capture_output=True, env=self.env)


results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


PHRASE = "set test.team_pass = 'on';"


def listing(c, slug, listed="true"):
    return c.psql("select public_listed from public.cpl_library_set_public('%s', %s, 'A public summary');" % (slug, listed), PHRASE)


def main():
    c = Cluster()
    if not c.start():
        print("SKIP library_publishing_sql_proof: no Postgres server or binaries reachable")
        c.stop()
        return 0
    try:
        ok, _, err = c.psql(STUBS)
        check("the stubs load", ok, err)
        ok, _, err = c.psql(open(PUBLIC_SQL).read())
        check("kb/supabase_cpl_library_public.sql loads", ok, err)
        ok, _, err = c.psql(open(FORWARD).read())
        check("the migration loads", ok, err)
        ok, _, err = c.psql(open(FORWARD).read())
        check("the migration is re-runnable", ok, err)
        c.psql("insert into public.cpl_library (slug, title, url) values ('flyer', 'Flyer', 'https://example.org/flyer/');")
        pid = c.psql("select id from public.cpl_library where slug = 'flyer';")[1]

        ok, out, err = listing(c, "flyer")
        check("with the team phrase and no check row, listing is refused", not ok and "passing accessibility check record" in err, err)
        check("and nothing changes", c.psql("select public_listed from public.cpl_library where slug = 'flyer';")[1] == "f")

        def add(key, result, at):
            c.psql("insert into public.cpl_library_checks (library_id, version_key, standard, checked_at, tool_or_reviewer, result, created_by) "
                   "values ('%s', '%s', 'WCAG 2.1 AA and Section 508', '%s', 'axe-core automated check', '%s', 'library-proof@bot');"
                   % (pid, key, at, result))

        add("draft:11111111-1111-1111-1111-111111111111", "pass", "2026-11-19T10:00:00Z")
        check("a pass for a draft does not list the page", not listing(c, "flyer")[0])
        add("version:2", "pass", "2026-11-19T10:05:00Z")
        check("a pass for another version does not list the page", not listing(c, "flyer")[0])
        add("page", "pass", "2026-11-19T11:00:00Z")
        add("page", "fail", "2026-11-19T12:00:00Z")
        check("a failing latest check is refused, though an earlier one passed", not listing(c, "flyer")[0])
        add("page", "pass", "2026-11-19T13:00:00Z")
        ok, out, err = listing(c, "flyer")
        check("the latest passing check for the page lists it", ok and out == "t", err)
        c.psql("update public.cpl_library set publish_target = 'public' where slug = 'flyer';")
        ok, out, err = listing(c, "flyer", "false")
        check("unlisting needs no check", ok and out == "f", err)
        check("unlisting resets publish_target to internal",
              c.psql("select publish_target from public.cpl_library where slug = 'flyer';")[1] == "internal")
        c.psql("update public.cpl_library set version = '2' where slug = 'flyer';")
        ok, out, err = listing(c, "flyer")
        check("a numbered page reads its own key (version:2)", ok and out == "t", err)
        listing(c, "flyer", "false")
        c.psql("update public.cpl_library set version = '3' where slug = 'flyer';")
        check("a new version needs its own check", not listing(c, "flyer")[0])
        ok, out, err = c.psql("select public_listed from public.cpl_library_set_public('flyer', true, 'A public summary');",
                              PHRASE + " set test.role = 'service_role';")
        check("the service role is exempt", ok and out == "t", err)
        ok, out, _ = c.psql("select string_agg(case when a.grantee = 0 then 'PUBLIC' else r.rolname end, ',' order by 1) "
                            "from pg_proc p, aclexplode(p.proacl) a left join pg_roles r on r.oid = a.grantee "
                            "where p.proname = 'cpl_library_set_public' and a.privilege_type = 'EXECUTE';")
        granted = set(out.split(","))
        check("EXECUTE stays with anon, authenticated and service_role, never PUBLIC",
              {"anon", "authenticated", "service_role"} <= granted and "PUBLIC" not in granted, out)

        ok, _, err = c.psql(open(ROLLBACK).read())
        check("the rollback refuses while check records exist, and names the count", not ok and "holds 5 check record(s)" in err, err)
        check("a refused rollback drops nothing", c.psql("select to_regclass('public.cpl_library_checks') is not null;")[1] == "t")
        c.psql("delete from public.cpl_library_checks;")
        ok, _, err = c.psql(open(ROLLBACK).read())
        check("with no checks the rollback runs", ok, err)
        check("it drops both tables and the three columns",
              c.psql("select to_regclass('public.cpl_library_checks') is null and to_regclass('public.cpl_library_division_settings') is null "
                     "and not exists (select 1 from information_schema.columns where table_name = 'cpl_library' "
                     "and column_name in ('publish_target', 'template', 'division'));")[1] == "t")
        listing(c, "flyer", "false")
        c.psql("update public.cpl_library set version = null where slug = 'flyer';")
        ok, out, err = listing(c, "flyer")
        check("it restores the function without the gate (lists with the phrase alone)", ok and out == "t", err)
    finally:
        c.stop()
    failed = 0
    for name, good, why in results:
        failed += not good
        print(("ok   " if good else "FAIL ") + name + ("" if good or not why else "\n       " + why[:400]))
    print("\nlibrary_publishing_sql_proof.py: %d/%d checks passed" % (len(results) - failed, len(results)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
