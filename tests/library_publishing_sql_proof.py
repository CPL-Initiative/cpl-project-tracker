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
  * kb/migrations/2026-11-19_library_relist_on_new_version.sql (COBIx on #3572): a listed piece whose version or url
    changes stays listed only when the latest check for its NEW page key passes; otherwise it leaves the Public
    Library with publish_target kept 'public', for every writer, the service role included; its rollback restores
    the first migration's state;
  * kb/migrations/2026-11-19_library_unlist_on_url_change.sql (COBIx on #3572, 7023361983 and 7023581179): any url
    change of a listed row unlists it whatever checks exist, and its guarded UPDATE corrects the S687 memory row; its
    rollback restores the second migration's body and the row's summary exactly, and leaves a person's edit alone;
  * kb/migrations/2026-11-19_library_check_binds_url.sql (COBIx on #3572, 7023899407): a pass lists a piece only at the
    url it checked, so a pass with a null url, or one at another url, is refused, a url move while unlisted cannot
    relist on the old url's pass, and a listed version change unlists unless the new key passed at the current url;
    its rollback refuses while a check carries a url, then restores the third migration's bodies and drops the column;
  * kb/migrations/2026-11-20_library_check_after_page_change.sql (#3560 part 2): a pass counts only when it ran no
    earlier than cpl_library.page_changed_at, which a trigger stamps on any url or version change and holds against a
    hand-set value, so a version relabeled to a key that passed is refused; a listed version change always unlists;
    a check written after the change lists; its rollback restores the url-binding bodies and drops the column; the
    part 2 memory rows load once and roll back;
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
# The second migration (COBIx on #3572): a listed piece whose page changes leaves the Public Library until it passes.
RELIST = os.path.join(ROOT, "kb/migrations/2026-11-19_library_relist_on_new_version.sql")
RELIST_RB = os.path.join(ROOT, "kb/migrations/2026-11-19_library_relist_on_new_version_rollback.sql")
# The third (COBIx on #3572, 7023361983 and 7023581179): any url change of a listed row unlists it, since no check is
# keyed on a url; and the memory row that described the rule says so.
URLMOVE = os.path.join(ROOT, "kb/migrations/2026-11-19_library_unlist_on_url_change.sql")
URLMOVE_RB = os.path.join(ROOT, "kb/migrations/2026-11-19_library_unlist_on_url_change_rollback.sql")
MEMORY = os.path.join(ROOT, "kb/migrations/2026-11-19_s687_library_memory_rows.sql")
# The fourth (COBIx on #3572, 7023899407): a check names the url it checked, and a pass counts only at the record's
# current url, so a url move while unlisted cannot relist on the old url's pass.
BINDS = os.path.join(ROOT, "kb/migrations/2026-11-19_library_check_binds_url.sql")
BINDS_RB = os.path.join(ROOT, "kb/migrations/2026-11-19_library_check_binds_url_rollback.sql")
# The fifth (#3560 part 2, S688): a check counts only when it ran after the record's page last changed, so a version
# relabeled to a key that passed at the same url cannot list on that earlier page's pass.
AFTER = os.path.join(ROOT, "kb/migrations/2026-11-20_library_check_after_page_change.sql")
AFTER_RB = os.path.join(ROOT, "kb/migrations/2026-11-20_library_check_after_page_change_rollback.sql")
MEMORY_S688 = os.path.join(ROOT, "kb/migrations/2026-11-19_s688_library_memory_rows.sql")
MEMORY_S688_RB = os.path.join(ROOT, "kb/migrations/2026-11-19_s688_library_memory_rows_rollback.sql")

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
create table public.cpl_memory (
  -- kind and summary carry the live table's checks (S688: a 'ruling' kind passed this stub and would fail live).
  slug text primary key, kind text check (kind in ('fact','pitfall','opportunity','risk','wishlist','question',
  'decision','milestone','procedure')), title text, summary text check (char_length(summary) <= 400), tags text[],
  status text, source text,
  verified_by text, verified_at timestamptz, author text, event_date date);
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

        # ── A listed piece whose page changes (2026-11-19_library_relist_on_new_version.sql) ──
        ok, _, err = c.psql(open(RELIST).read())
        check("the relist migration loads", ok, err)
        ok, _, err = c.psql(open(RELIST).read())
        check("the relist migration is re-runnable", ok, err)

        def piece(slug, version):
            c.psql("insert into public.cpl_library (slug, title, url, version) values ('%s', '%s', 'https://example.org/%s/', %s);"
                   % (slug, slug, slug, "'%s'" % version if version else "null"))
            return c.psql("select id from public.cpl_library where slug = '%s';" % slug)[1]

        def add_for(lid, key, result, at):
            c.psql("insert into public.cpl_library_checks (library_id, version_key, standard, checked_at, tool_or_reviewer, result, created_by) "
                   "values ('%s', '%s', 'WCAG 2.1 AA and Section 508', '%s', 'axe-core automated check', '%s', 'library-proof@bot');"
                   % (lid, key, at, result))

        def row(slug):
            return c.psql("select public_listed || '|' || coalesce(publish_target, '-') from public.cpl_library where slug = '%s';" % slug)[1]

        deck = piece("deck", "4")
        add_for(deck, "version:4", "pass", "2026-11-19T14:00:00Z")
        check("a Version 4 with its own pass lists", listing(c, "deck")[0] and row("deck").startswith("true"))
        add_for(deck, "version:5", "pass", "2026-11-19T14:10:00Z")
        c.psql("update public.cpl_library set version = '5' where slug = 'deck';")
        check("a listed v4 that becomes v5 with a v5 pass stays listed", row("deck").startswith("true"), row("deck"))
        c.psql("update public.cpl_library set version = '6' where slug = 'deck';", "set test.role = 'service_role';")
        check("a listed v5 that becomes v6 with no v6 check leaves the Public Library and keeps publish_target public, "
              "the service role included", row("deck") == "false|public", row("deck"))
        add_for(deck, "version:6", "pass", "2026-11-19T14:20:00Z")
        check("once v6 passes, it lists again", listing(c, "deck")[0] and row("deck").startswith("true"))
        c.psql("update public.cpl_library set version = '5' where slug = 'deck';")
        check("setting version back to a key that passed keeps it listed (that page passed)", row("deck").startswith("true"), row("deck"))
        add_for(deck, "version:5", "fail", "2026-11-19T14:30:00Z")
        c.psql("update public.cpl_library set version = '6' where slug = 'deck'; update public.cpl_library set version = '5' where slug = 'deck';")
        check("a version whose latest check failed unlists it", row("deck") == "false|public", row("deck"))
        # ── Any url change unlists (2026-11-19_library_unlist_on_url_change.sql) ──
        ok, _, err = c.psql(open(MEMORY).read())
        check("the S687 memory rows load", ok, err)
        mem = lambda: c.psql("select summary from public.cpl_memory where slug = 'd-library-new-page-unlists-s687';")[1]
        before = mem()
        ok, _, err = c.psql(open(URLMOVE).read())
        check("the url-change migration loads", ok, err)
        after = mem()
        ok, _, err = c.psql(open(URLMOVE).read())
        check("the url-change migration is re-runnable", ok, err)
        check("its guarded UPDATE rewrites the memory row's summary to the url rule, in 400 characters or fewer",
              after != before and "when its url changes" in after and len(after) <= 400 and mem() == after, after)
        sheet = piece("sheet", None)
        c.psql("select public.cpl_library_set_public('sheet', true, 'A public summary');", PHRASE + " set test.role = 'service_role';")
        c.psql("update public.cpl_library set url = 'https://example.org/sheet-moved/' where slug = 'sheet';")
        check("a url change with no check for its key unlists it and keeps publish_target public", row("sheet") == "false|public", row("sheet"))
        add_for(sheet, "page", "pass", "2026-11-19T15:00:00Z")
        listing(c, "sheet")
        c.psql("update public.cpl_library set url = 'https://example.org/sheet-again/' where slug = 'sheet';")
        check("a url change whose key passed still unlists it: no earlier pass speaks for a new address", row("sheet") == "false|public", row("sheet"))
        add_for(sheet, "version:1", "pass", "2026-11-19T15:10:00Z")
        add_for(sheet, "page", "pass", "2026-11-19T15:20:00Z")
        listing(c, "sheet")
        c.psql("update public.cpl_library set url = 'https://example.org/sheet-third/', version = '1' where slug = 'sheet';",
               "set test.role = 'service_role';")
        check("a url change unlists whatever checks exist, with the version moving to a passed key and the service role writing",
              row("sheet") == "false|public", row("sheet"))
        c.psql("update public.cpl_library set version = null where slug = 'sheet';")
        listing(c, "sheet")
        c.psql("update public.cpl_library set title = 'Sheet, retitled' where slug = 'sheet';")
        check("a change that leaves the page alone keeps it listed", row("sheet").startswith("true"))

        # ── A check binds to the url it checked (2026-11-19_library_check_binds_url.sql) ──
        ok, _, err = c.psql(open(BINDS).read())
        check("the url-binding migration loads", ok, err)
        ok, _, err = c.psql(open(BINDS).read())
        check("the url-binding migration is re-runnable", ok, err)
        check("existing check rows keep a null url",
              c.psql("select count(*) filter (where url is not null) || '|' || count(*) from public.cpl_library_checks;")[1].startswith("0|"))

        def add_at(lid, key, result, at, url):
            return c.psql("insert into public.cpl_library_checks (library_id, version_key, standard, checked_at, tool_or_reviewer, result, created_by, url) "
                          "values ('%s', '%s', 'WCAG 2.1 AA and Section 508', '%s', 'axe-core automated check', '%s', 'library-proof@bot', %s);"
                          % (lid, key, at, result, "'%s'" % url if url else "null"))

        poster = piece("poster", None)
        P1, P2 = "https://example.org/poster/", "https://example.org/poster-moved/"
        check("a check url must be https", not add_at(poster, "page", "pass", "2026-11-19T16:00:00Z", "http://example.org/poster/")[0])
        add_at(poster, "page", "pass", "2026-11-19T16:01:00Z", None)
        check("a pass with a null url does not list the page", not listing(c, "poster")[0] and row("poster").startswith("false"))
        add_at(poster, "page", "pass", "2026-11-19T16:02:00Z", "https://example.org/elsewhere/")
        check("a pass at another url does not list the page", not listing(c, "poster")[0])
        add_at(poster, "page", "pass", "2026-11-19T16:03:00Z", P1)
        ok, out, err = listing(c, "poster")
        check("a pass at the page's own url lists it", ok and out == "t", err)
        listing(c, "poster", "false")
        c.psql("update public.cpl_library set url = '%s' where slug = 'poster';" % P2)
        ok, _, err = listing(c, "poster")
        check("a url move while unlisted, then the team phrase presses Public: refused, the old url's pass does not count",
              not ok and "passing accessibility check record" in err and row("poster").startswith("false"), err)
        ok, out, err = c.psql("select public_listed from public.cpl_library_set_public('poster', true, 'A public summary');",
                              "set test.role = 'authenticated'; set test.team_pass = 'on';")
        check("and the same for any caller but the service role", not ok, err)
        add_at(poster, "page", "pass", "2026-11-19T16:04:00Z", P2)
        ok, out, err = listing(c, "poster")
        check("a pass at the new url lists it", ok and out == "t", err)
        add_at(poster, "version:2", "pass", "2026-11-19T16:05:00Z", P1)
        c.psql("update public.cpl_library set version = '2' where slug = 'poster';")
        check("a listed version change with a pass for the new key at another url unlists it and keeps publish_target public",
              row("poster") == "false|public", row("poster"))
        add_at(poster, "version:2", "pass", "2026-11-19T16:06:00Z", P2)
        listing(c, "poster")
        add_at(poster, "version:3", "pass", "2026-11-19T16:07:00Z", P2)
        c.psql("update public.cpl_library set version = '3' where slug = 'poster';")
        check("a listed version change with a pass for the new key at the current url stays listed", row("poster").startswith("true"), row("poster"))
        c.psql("update public.cpl_library set url = '%s' where slug = 'poster';" % P1, "set test.role = 'service_role';")
        check("a url change still always unlists, though the new url and key hold a pass", row("poster") == "false|public", row("poster"))
        ok, out, _ = c.psql("select string_agg(case when a.grantee = 0 then 'PUBLIC' else r.rolname end, ',' order by 1) "
                            "from pg_proc p, aclexplode(p.proacl) a left join pg_roles r on r.oid = a.grantee "
                            "where p.proname = 'cpl_library_set_public' and a.privilege_type = 'EXECUTE';")
        granted = set(out.split(","))
        check("set_public keeps EXECUTE for anon, authenticated and service_role, never PUBLIC",
              {"anon", "authenticated", "service_role"} <= granted and "PUBLIC" not in granted, out)
        ok, out, _ = c.psql("select coalesce(string_agg(case when a.grantee = 0 then 'PUBLIC' else r.rolname end, ','), '') "
                            "from pg_proc p, aclexplode(p.proacl) a left join pg_roles r on r.oid = a.grantee "
                            "where p.proname = 'cpl_library_unlist_on_new_page' and a.privilege_type = 'EXECUTE';")
        check("the trigger function stays closed to PUBLIC, anon and authenticated",
              not ({"PUBLIC", "anon", "authenticated"} & set(filter(None, out.split(",")))), out)

        # ── A check counts only after the page last changed (2026-11-20_library_check_after_page_change.sql) ──
        ok, _, err = c.psql(open(AFTER).read())
        check("the page-change migration loads", ok, err)
        ok, _, err = c.psql(open(AFTER).read())
        check("the page-change migration is re-runnable", ok, err)
        card = piece("card", "4")
        CU = "https://example.org/card/"
        stamp_of = lambda: c.psql("select coalesce(page_changed_at::text, '-') from public.cpl_library where slug = 'card';")[1]  # noqa: E731
        check("a record whose page never changed has no page_changed_at", stamp_of() == "-")
        add_at(card, "version:4", "pass", "2026-11-19T17:00:00Z", CU)
        ok, out, err = listing(c, "card")
        check("with no page change recorded, a pass at its key and url lists it, as before", ok and out == "t", err)
        add_at(card, "version:5", "pass", "2026-11-19T17:05:00Z", CU)
        c.psql("update public.cpl_library set version = '5' where slug = 'card';", "set test.role = 'service_role';")
        check("⭐ a listed version change always unlists now, though a pass for the new key at the url exists, and keeps "
              "publish_target public, the service role writing", row("card") == "false|public", row("card"))
        check("the version change stamps page_changed_at", stamp_of() != "-")
        c.psql("update public.cpl_library set version = '4' where slug = 'card';")
        ok, _, err = listing(c, "card")
        check("⭐ a version relabeled to a key that passed is refused: that pass ran before the page last changed",
              not ok and "passing accessibility check record" in err and row("card").startswith("false"), err)
        stamped = stamp_of()
        c.psql("update public.cpl_library set page_changed_at = '1970-01-01', title = 'Card, retitled' where slug = 'card';")
        check("⭐ no writer sets page_changed_at by hand: an update that leaves the page alone holds it",
              stamp_of() == stamped, stamp_of())
        ok, _, err = listing(c, "card")
        check("so the relabel stays refused after that try", not ok, err)
        ok, _, err = c.psql("insert into public.cpl_library_checks (library_id, version_key, standard, tool_or_reviewer, result, created_by, url) "
                            "values ('%s', 'version:4', 'WCAG 2.1 AA and Section 508', 'axe-core automated check', 'pass', 'library-proof@bot', '%s');"
                            % (card, CU))
        ok, out, err = listing(c, "card")
        check("a check written after the change (checked_at the database's now(), as the check run writes it) lists it",
              ok and out == "t", err)
        c.psql("update public.cpl_library set url = 'https://example.org/card-moved/' where slug = 'card';")
        check("a url change still unlists", row("card") == "false|public", row("card"))
        ok, out, _ = c.psql("select coalesce(string_agg(case when a.grantee = 0 then 'PUBLIC' else r.rolname end, ','), '') "
                            "from pg_proc p, aclexplode(p.proacl) a left join pg_roles r on r.oid = a.grantee "
                            "where p.proname = 'cpl_library_stamp_page_change' and a.privilege_type = 'EXECUTE';")
        check("the stamp trigger's function is closed to PUBLIC, anon and authenticated",
              not ({"PUBLIC", "anon", "authenticated"} & set(filter(None, out.split(",")))), out)
        ok, _, err = c.psql(open(AFTER_RB).read())
        check("the page-change rollback runs", ok, err)
        defs = c.psql("select pg_get_functiondef('public.cpl_library_set_public(text, boolean, text, text[], text)'::regprocedure) "
                      "|| pg_get_functiondef('public.cpl_library_unlist_on_new_page()'::regprocedure);")[1]
        check("it drops the column and the stamp trigger, and restores the url-binding bodies",
              c.psql("select count(*) from information_schema.columns where table_name = 'cpl_library' and column_name = 'page_changed_at';")[1] == "0"
              and c.psql("select count(*) from pg_trigger where tgname = 'cpl_library_page_changed_trg';")[1] == "0"
              and "page_changed_at" not in defs and "c.url = l.url" in defs and "c.url = new.url" in defs, defs[:200])
        ok, _, err = c.psql(open(AFTER).read() + open(AFTER_RB).read())
        check("the page-change migration applies and rolls back again", ok, err)
        P2_ROWS = os.path.join(ROOT, "kb/migrations/2026-11-20_s688_library_part2_memory_rows.sql")
        P2_RB = os.path.join(ROOT, "kb/migrations/2026-11-20_s688_library_part2_memory_rows_rollback.sql")
        ok, _, err = c.psql(open(P2_ROWS).read() + open(P2_ROWS).read())
        got = c.psql("select count(*) || '|' || max(char_length(summary)) || '|' || count(*) filter (where status = 'proposed') "
                     "from public.cpl_memory where slug like 'd-library-%-s688' and slug <> 'd-library-check-binds-url-s688';")[1].split("|")
        check("the seven part 2 decision rows load once each, proposed, in 400 characters or fewer, and are re-runnable",
              ok and got[0] == "7" and int(got[1]) <= 400 and got[2] == "7", err or got)
        sam = c.psql("select count(*) || '|' || max(status) || '|' || max(verified_by) || '|' || count(verified_at) || '|' || "
                     "max(char_length(summary)) from public.cpl_memory where slug = 'r-library-legacy-listings-stay-sam-2026-11-19';")[1].split("|")
        check("Sam's ruling row loads once, verified, verified by Sam as relayed by COBIx, with a time, in under 380 characters",
              sam[0] == "1" and sam[1] == "verified" and sam[2] == "Sam (relayed by COBIx on #3581)" and sam[3] == "1" and int(sam[4]) < 380, sam)
        c.psql(open(P2_RB).read())
        check("their rollback removes all eight", c.psql("select count(*) from public.cpl_memory where (slug like 'd-library-%-s688' "
                                                        "and slug <> 'd-library-check-binds-url-s688') or slug = 'r-library-legacy-listings-stay-sam-2026-11-19';")[1] == "0")

        n_url = c.psql("select count(*) from public.cpl_library_checks where url is not null;")[1]
        ok, _, err = c.psql(open(BINDS_RB).read())
        check("the url-binding rollback refuses while a check carries a url, and names the count",
              not ok and ("holds %s check record(s) with a url" % n_url) in err, err)
        check("a refused url-binding rollback drops nothing",
              c.psql("select count(*) from information_schema.columns where table_name = 'cpl_library_checks' and column_name = 'url';")[1] == "1")
        c.psql("delete from public.cpl_library_checks where url is not null;")
        ok, _, err = c.psql(open(BINDS_RB).read())
        check("with no url on any check the url-binding rollback runs", ok, err)
        defs = c.psql("select pg_get_functiondef('public.cpl_library_set_public(text, boolean, text, text[], text)'::regprocedure) "
                      "|| pg_get_functiondef('public.cpl_library_unlist_on_new_page()'::regprocedure);")[1]
        check("it drops the column and restores both bodies without the url match",
              c.psql("select count(*) from information_schema.columns where table_name = 'cpl_library_checks' and column_name = 'url';")[1] == "0"
              and "c.url" not in defs and "c.version_key" in defs, defs[:200])
        add_for(poster, "version:3", "pass", "2026-11-19T16:08:00Z")
        ok, out, err = listing(c, "poster")
        check("after it, a pass for the key alone lists again, as before the migration", ok and out == "t", err)
        c.psql("update public.cpl_library set url = '%s' where slug = 'poster';" % P2)
        check("and a url change still always unlists (the url-change migration's body)", row("poster") == "false|public", row("poster"))
        ok, _, err = c.psql(open(MEMORY_S688).read() + open(MEMORY_S688).read())
        s688 = c.psql("select count(*) || '|' || max(char_length(summary)) || '|' || max(status) from public.cpl_memory "
                      "where slug = 'd-library-check-binds-url-s688';")[1].split("|")
        check("the S688 memory row loads once, proposed, in 400 characters or fewer, and is re-runnable",
              ok and s688[0] == "1" and int(s688[1]) <= 400 and s688[2] == "proposed", err or s688)
        c.psql(open(MEMORY_S688_RB).read())
        check("its rollback removes it", c.psql("select count(*) from public.cpl_memory where slug = 'd-library-check-binds-url-s688';")[1] == "0")
        ok, _, err = c.psql(open(BINDS).read())
        check("the url-binding migration applies again after its rollback", ok, err)
        ok, _, err = c.psql(open(BINDS_RB).read())
        check("and rolls back again, every old row keeping a null url", ok, err)

        ok, _, err = c.psql(open(URLMOVE_RB).read())
        check("the url-change rollback runs", ok, err)
        check("it restores the memory row's summary exactly", mem() == before, mem())
        c.psql("update public.cpl_library set url = 'https://example.org/sheet-fourth/' where slug = 'sheet';")
        check("it restores the second migration's body: a url change whose key passed stays listed", row("sheet").startswith("true"), row("sheet"))
        c.psql(open(URLMOVE).read())
        c.psql("update public.cpl_memory set summary = 'A person rewrote this.' where slug = 'd-library-new-page-unlists-s687';")
        c.psql(open(URLMOVE_RB).read())
        check("the rollback leaves a person's edit to the memory row alone", mem() == "A person rewrote this.", mem())

        ok, _, err = c.psql(open(RELIST_RB).read())
        check("the relist rollback runs", ok, err)
        c.psql("update public.cpl_library set version = '9' where slug = 'sheet';")
        check("after it, a page change leaves a listed piece listed, as before the migration", row("sheet").startswith("true"), row("sheet"))
        check("and the functions are as the first migration left them: the gate stays in set_public and the reset trigger stays",
              not listing(c, "deck")[0] and c.psql("select count(*) from pg_trigger where tgname = 'cpl_library_publish_target_trg';")[1] == "1"
              and c.psql("select count(*) from pg_proc where proname = 'cpl_library_unlist_on_new_page';")[1] == "0")

        n = c.psql("select count(*) from public.cpl_library_checks;")[1]
        ok, _, err = c.psql(open(ROLLBACK).read())
        check("the rollback refuses while check records exist, and names the count", not ok and ("holds %s check record(s)" % n) in err, err)
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
