#!/usr/bin/env python3
"""Every table this repo's SQL creates carries its own Data API grants.

    python3 tests/supabase_table_grants_test.py

WHY (Supabase notice, forwarded by Sam 2026-09-23): from 2026-10-30, existing
projects stop granting the Data API roles (anon, authenticated, service_role)
on NEW tables in the public schema. Existing tables keep their grants. A table
created after that date is unreachable through PostgREST unless its own SQL
grants it.

THE EXPOSURE WAS FIVE FUNCTIONS, NOT A MIGRATION. Measured 2026-09-23: every
live table held the default grants, so nothing broke that day. But
rebuild_map_college_goal2, rebuild_map_college_credit_summary,
rebuild_map_cleanup_worklist, rebuild_map_transcribed_gap and
rebuild_map_cx_exhibit_guidance each DROP and CREATE ... AS their table inside
the nightly promotion. Every night is a "new table" event, so the first
promotion after 2026-10-30 would have left all five unreadable to COBI and to
the service-key publishers, with RLS and the policy intact and no error until a
reader asked.

THE RULE, for every `create table` in a *.sql file:
  1. Inside a function body, or at top level in a file that also DROPs the same
     table (a re-runnable recreate), the same body or file must GRANT on that
     table to service_role, and grant each command a policy on it allows to
     each role the policy names (no TO clause means PUBLIC: anon and
     authenticated), unless that file REVOKEs from the role on purpose.
  2. Any other top-level `create table` is held to the same rule unless it is
     in BASELINE: the tables that existed live on 2026-09-23 and keep their
     grants. A baseline entry whose file now grants correctly is reported, so
     the list only shrinks.
"""

from __future__ import annotations

import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Top-level tables that exist live and keep their grants after 2026-10-30:
# this lint's own findings on 2026-09-23, each checked against the live table
# list that day. Two findings stayed off it because their tables are not live
# yet (noncredit_category_decisions, tmc_submission_docs); their files now carry
# grants. A new table never joins this list; it carries its grants instead.
BASELINE = frozenset("""
chatbox/supabase_cobi_nav.sql::cobi_nav
chatbox/supabase_cobi_nav.sql::cobi_nav_log
chatbox/supabase_college_briefing_public.sql::map_college_contacts_pub
chatbox/supabase_college_briefing_public.sql::map_college_cr_waiting_pub
chatbox/supabase_college_briefing_public.sql::map_college_credit_summary_pub
chatbox/supabase_college_briefing_public.sql::map_college_goal2_pub
chatbox/supabase_sierra_feedback.sql::sierra_feedback
chatbox/supabase_sierra_guidance.sql::sierra_guidance
chatbox/supabase_sierra_rules.sql::sierra_rules
chatbox/supabase_sierra_rules.sql::sierra_rules_log
fact-sheet/supabase_factsheet_overrides.sql::factsheet_overrides
funding/supabase_cpl_funding_config.sql::cpl_funding_config
funding/supabase_cpl_funding_notes.sql::cpl_funding_notes
funding/supabase_cpl_funding_participation.sql::cpl_funding_participation
kb/supabase_adoption_interest.sql::cpl_adoption_interest
kb/supabase_cip_crosswalk_suggestion.sql::cip_crosswalk_suggestion
kb/supabase_cpl_contracts.sql::cpl_contract_deliverables
kb/supabase_cpl_contracts.sql::cpl_contract_documents
kb/supabase_cpl_contracts.sql::cpl_contract_reports
kb/supabase_cpl_contracts.sql::cpl_contracts
kb/supabase_cpl_memory.sql::cpl_memory
kb/supabase_cpl_memory.sql::cpl_memory_log
kb/supabase_curation_setup.sql::allowed_reviewers
kb/supabase_curation_setup.sql::kb_curation
kb/supabase_gr_advocacy.sql::gr_content
kb/supabase_gr_register.sql::gr_areas
kb/supabase_gr_register.sql::gr_artifacts
kb/supabase_gr_register.sql::gr_revisions
kb/supabase_map_cx_exhibit_guidance.sql::map_ace_exhibit_titles
kb/supabase_map_data_quality.sql::map_data_quality
kb/supabase_merge_doctrine.sql::merge_doctrine_notes
kb/supabase_nc_artifacts.sql::nc_artifacts
kb/supabase_nc_artifacts.sql::nc_integration_runs
kb/supabase_nc_partner_notes.sql::nc_partner_notes
kb/supabase_project_lifecycle.sql::project_lifecycle
map/supabase_map_contact_gaps.sql::governance_owners
map/supabase_map_contacts.sql::map_college_contacts
map/supabase_map_contacts.sql::map_college_nudges
map/supabase_map_users.sql::map_college_users
mission/supabase_liftoff_state.sql::liftoff_state
news/supabase_cpl_news.sql::cpl_news
news/supabase_cpl_news.sql::cpl_news_requests
raci/supabase_raci.sql::item_raci
raci/supabase_raci.sql::item_updates
raci/supabase_raci.sql::team_access
raci/supabase_raci.sql::team_members
tmc/supabase_tmc_curator.sql::tmc_curator_notes
tmc/supabase_tmc_curator.sql::tmc_requests
tmc/supabase_tmc_submissions.sql::tmc_submissions
""".split())

PRIVS = ("select", "insert", "update", "delete")
CMD_PRIVS = {"all": set(PRIVS), "select": {"select"}, "insert": {"insert"},
             "update": {"update"}, "delete": {"delete"}}

NAME = r'(?:public\.)?"?([a-z_][a-z0-9_]*)"?'
CREATE = re.compile(r"^create\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?" + NAME, re.I)
DROP = re.compile(r"^drop\s+table\s+(?:if\s+exists\s+)?" + NAME, re.I)
POLICY = re.compile(r"^create\s+policy\s+\S+\s+on\s+" + NAME +
                    r"(?:\s+as\s+(?:permissive|restrictive))?"
                    r"(?:\s+for\s+(all|select|insert|update|delete))?"
                    r"(?:\s+to\s+(.+?))?(?:\s+using\b|\s+with\s+check\b|$)", re.I)
GRANT = re.compile(r"^(grant|revoke)\s+(.+?)\s+on\s+(?:table\s+)?(.+?)\s+(?:to|from)\s+(.+?)"
                   r"(?:\s+with\s+grant\s+option)?$", re.I)
DOLLAR = re.compile(r"\$([a-z_]*)\$", re.I)


def strip_comments(sql: str) -> str:
    """Drop `--` comments outside string literals, keep line structure."""
    out, i, n, in_str = [], 0, len(sql), False
    while i < n:
        c = sql[i]
        if in_str:
            out.append(c)
            if c == "'":
                if i + 1 < n and sql[i + 1] == "'":
                    out.append("'")
                    i += 1
                else:
                    in_str = False
        elif c == "'":
            in_str = True
            out.append(c)
        elif c == "-" and sql.startswith("--", i):
            while i < n and sql[i] != "\n":
                i += 1
            continue
        else:
            out.append(c)
        i += 1
    return "".join(out)


def split_scopes(sql: str):
    """Yield (scope, text): the file's top level once, then each $tag$ body."""
    top, bodies, pos = [], [], 0
    while True:
        m = DOLLAR.search(sql, pos)
        if not m:
            top.append(sql[pos:])
            break
        tag = m.group(0)
        end = sql.find(tag, m.end())
        if end < 0:
            top.append(sql[pos:])
            break
        top.append(sql[pos:m.start()] + " $body$ ")
        bodies.append(sql[m.end():end])
        pos = end + len(tag)
    yield "top", "".join(top)
    for b in bodies:
        yield "body", b


def statements(text: str):
    for raw in text.split(";"):
        s = " ".join(raw.split())
        if s:
            yield s


def roles_of(s: str) -> set[str]:
    out = set()
    for r in s.split(","):
        r = r.strip().strip('"').lower()
        if r == "public":
            out |= {"anon", "authenticated"}
        elif r:
            out.add(r)
    return out


def privs_of(s: str) -> set[str]:
    s = s.lower()
    if re.match(r"^all(\s+privileges)?$", s.strip()):
        return set(PRIVS)
    return {p.strip() for p in s.split(",") if p.strip() in PRIVS}


def scan(text: str):
    creates, drops, policies = [], set(), []
    grants: dict[tuple[str, str], set[str]] = {}
    revoked: dict[str, set[str]] = {}
    for st in statements(text):
        m = CREATE.match(st)
        if m:
            creates.append(m.group(1).lower())
            continue
        m = DROP.match(st)
        if m:
            drops.add(m.group(1).lower())
            continue
        m = POLICY.match(st)
        if m:
            policies.append((m.group(1).lower(), (m.group(2) or "all").lower(),
                             roles_of(m.group(3) or "public")))
            continue
        m = GRANT.match(st)
        if m and not re.search(r"\bfunction\b|\bschema\b|\bsequence\b", m.group(3), re.I):
            verb, privs, tables, roles = m.groups()
            for t in tables.split(","):
                t = t.strip().lower().replace("public.", "").strip('"')
                for r in roles_of(roles):
                    if verb.lower() == "grant":
                        grants.setdefault((t, r), set()).update(privs_of(privs))
                    else:
                        revoked.setdefault(t, set()).add(r)
    return creates, drops, policies, grants, revoked


def missing_grants(table, policies, grants, revoked):
    problems = []
    if not ({"select"} <= grants.get((table, "service_role"), set())):
        problems.append("no `grant select ... to service_role`")
    for t, cmd, roles in policies:
        if t != table:
            continue
        need = CMD_PRIVS[cmd]
        for r in sorted(roles):
            if r in revoked.get(table, set()):
                continue
            have = grants.get((table, r), set())
            if not need <= have:
                problems.append(f"policy allows {cmd} to {r}, but {r} is granted "
                                f"{', '.join(sorted(have)) or 'nothing'}")
    return problems


def main() -> int:
    failures, stale, seen = [], [], set()
    files = sorted(f for f in glob.glob(os.path.join(ROOT, "**", "*.sql"), recursive=True)
                   if "node_modules" not in f)
    for path in files:
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        sql = strip_comments(open(path, encoding="utf-8").read())
        scopes = list(split_scopes(sql))
        f_creates, f_drops, f_pol, f_gr, f_rev = scan(scopes[0][1])
        for kind, text in scopes:
            creates, drops, pol, gr, rev = scan(text) if kind == "body" else (
                f_creates, f_drops, f_pol, f_gr, f_rev)
            for t in creates:
                key = f"{rel}::{t}"
                if kind == "body":
                    probs = missing_grants(t, pol, gr, rev)
                    where = "inside a function body (recreated on every call)"
                elif t in drops:
                    probs = missing_grants(t, pol, gr, rev)
                    where = "dropped and recreated by this file"
                else:
                    probs = missing_grants(t, pol, gr, rev)
                    where = "created at top level"
                    if key in BASELINE:
                        seen.add(key)
                        if not probs:
                            stale.append(key)
                        continue
                for p in probs:
                    failures.append(f"{key} ({where}): {p}")
    unknown = sorted(BASELINE - seen)
    for key in unknown:
        failures.append(f"BASELINE names {key}, which no longer creates that table "
                        "at top level: remove the entry")
    for key in stale:
        failures.append(f"BASELINE names {key}, whose file now grants it correctly: "
                        "remove the entry so the list only shrinks")
    if failures:
        print(f"FAIL — {len(failures)} problem(s):")
        for f in failures:
            print(f"  ✗ {f}")
        return 1
    print("OK — every table the SQL creates at run time or recreates carries its own grants, "
          f"and no new table relies on the default grant ({len(BASELINE)} baseline tables).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
