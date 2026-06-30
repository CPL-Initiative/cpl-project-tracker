---
title: MAP Users management tab + college-nudge — scope
date: 2026-06-30
session: 87 (SkyGuy)
status: scoping — schema probe ready to dispatch; build not started
tags: [cobi, map-users, nudge, supabase, pii, scope]
artifacts:
  - map/probe_users_schema.py
  - .github/workflows/map-users-schema-probe.yml
related:
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline]]"
  - "[[docs/kb-notes/adr-cer-student-impact-counts-privacy]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
  - "[[CLAUDE]]"
---

# MAP Users management tab + college-nudge — scope

Sam (2026-06-30): *"add a COBI tab to manage those [MAP] users so we can later
automate a nudge process to the colleges to periodically update their users."*

## 1. The data — what MAP has, what we have

| | |
|---|---|
| **Source** | MAP Custom Reporting Module category #9: **"College Users & Roles"** = `View_CollegeUsersRoles` |
| **Shape** | **11 fields · ~2,710 rows** = system users' **names + emails + per-college role assignments** (the exact field list is captured by the probe below) |
| **In our datasets today?** | **No.** Two reasons (both deliberate): |
| | (a) It was **dropped from the daily fetch** for staff-PII minimization (Session 34) — `fetch_custom_report.py`'s `REQUEST_PAYLOAD` no longer requests it; the code comment says *"staff PII never lands on the Action runner."* |
| | (b) The raw `CustomReport_latest.json` is **gitignored + never committed** (transient; fetched → aggregated → discarded, PR #227). So even when it *was* fetched it never entered a committed dataset. |
| **Re-enabling** | One small edit (re-add the `View_CollegeUsersRoles` block to `REQUEST_PAYLOAD`) — the MAP endpoint already returns it. |

## 2. The hard constraint — this is staff PII

Names + emails. The whole reason it was dropped is to **keep staff PII out of the
public repo + off the Action runner's committed outputs**. So the #1 design rule:

> **MAP user data must NEVER be committed to this public repo** — not as a JS
> file, not in a snapshot, not in an Actions log. It lives only in a gated
> Supabase table, synced server-side.

This mirrors the existing privacy posture
([`adr-cer-student-impact-counts-privacy`](kb-notes/adr-cer-student-impact-counts-privacy.md),
the student-identity column minimization in `fetch_custom_report.py`).

## 3. Architecture (reuses what COBI already has)

```
MAP Custom Report API  (View_CollegeUsersRoles)
   │  runner-only (Azure egress-blocked from the sandbox)
   ▼
GitHub Actions sync workflow  ──service key──►  Supabase  public.map_college_users
   (fetch the one view, upsert by a stable key;                 (gated: anon READ
    NEVER commit / NEVER print raw PII)                          maybe withheld;
                                                                 reviewer/team-phrase
                                                                 write; RLS like
                                                                 team_members)
                                                                      │
   COBI "MAP Users" tab  ◄──anon read (or signed-in)───────────────────┘
   (per-college roster · role · last-updated · "needs refresh" flag)
                                                                      │
   Nudge engine (REUSE the RACI tab's nudge)  ──────────────────────────┘
   (email each college's contact "please refresh your MAP users";
    track last_nudged_at / last_response_at — the columns already exist
    on team_members; replicate the pattern)
```

Building blocks already in the repo to reuse:
- **Gated Supabase table pattern** — `team_members` / `allowed_reviewers` + the
  magic-link (`cpl_sb`) **and** shared team-phrase (`team_pass_ok()`) gates.
- **Server-side sync from a runner** — the daily curation sync
  (`kb/_apply_curation.py` + `SUPABASE_SERVICE_KEY`) and `cpl-landing-pages.yml`
  (runner-as-proxy to the same Azure host) are the templates.
- **Nudge engine** — `raci.js` already emails R/A people, drafts via the report
  proxy ("let CC write it up"), and tracks `last_nudged_at`/`last_response_at`.
  Story: [`docs/cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md).

## 4. Phased plan

| Phase | What | Status |
|---|---|---|
| **P0 — Schema probe** | Capture the exact 11 fields + the role vocabulary, PII-safe, on a runner. `map/probe_users_schema.py` + `map-users-schema-probe.yml` (dispatch-only; masks names/emails; commits nothing). | **READY — dispatch it** |
| **P1 — Gated sync** | New Supabase `public.map_college_users` (schema informed by P0) + a sync workflow that fetches `View_CollegeUsersRoles` on a runner and upserts via the service key. Decide what (if anything) the anon role may read — likely counts/roles per college, **emails withheld** unless a signed-in/team-phrase reviewer. | not started |
| **P2 — COBI "MAP Users" tab** | Static lazy renderer (the `raci.js`/`cpl_news.js` pattern): per-college roster, role, last-updated, a "stale / needs refresh" signal. Reviewer/team-phrase-gated for any PII. | not started |
| **P3 — College nudge** | Reuse the RACI nudge: periodic "refresh your MAP users" email per college (to the AO / CPL Coordinator already in `View_CollegeContacts`), with `last_nudged_at`/`last_response_at` accountability. | not started |

## 5. Open questions (for Sam / next session — after P0 lands the schema)

1. **What's the stable per-user key?** (email? a MAP user id field? — P0 reveals it.)
2. **What may the anon (logged-out) role see?** Recommend: per-college *counts*
   + role mix only; **names/emails reviewer-gated**. (Confirm.)
3. **"Stale" definition** — does the view carry a last-login / last-updated field
   we can flag on, or do we track our own "last confirmed" timestamp?
4. **Who gets the nudge** per college — the AO, the CPL Coordinator, both? (Both
   are in `View_CollegeContacts`, which would also need a gated sync.)
5. **Cadence** of the refresh nudge (quarterly?).

## 6. Next concrete step

**Dispatch `map-users-schema-probe.yml`** (Actions tab → run) and read its log:
it prints the field names, row count, per-field types, and the role/status
vocabulary — with zero raw PII. Fold the captured schema into §1 + §5 here, then
build P1 (the gated Supabase sync). Nothing in P0 commits or exposes PII.
