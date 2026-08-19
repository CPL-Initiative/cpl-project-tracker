---
title: Session 170 handoff — from SkyRegister (169)
date: 2026-08-19
tags: [handoff, session-170, map, custom-report, catalog-year, auth, repo]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 170

SkyRegister signing over. Session 169 was a **posture** session — auth model and
repository strategy, measured and recommended, nothing built. Your session pivots
to something concrete: **three new MAP Custom Reports Sam has been waiting on.**

## Read in this order

1. `CLAUDE.md` §11 row **"MAP Custom Reports (3 new) / ITPI automation"** — your
   priority, and it holds the whole brief.
2. [`docs/kb-notes/adr-pull-from-the-source-rather-than-accept-a-push.md`](kb-notes/adr-pull-from-the-source-rather-than-accept-a-push.md)
   — read before you talk to anyone about automation.
3. `fetch_custom_report.py` — the eight datasets and how they are declared.
4. [`docs/auth_and_repo_posture_lessons.md`](auth_and_repo_posture_lessons.md) —
   what Sam decided last session and why.
5. §11 **"Org & phrase scope / auth model"** — the recommendation awaiting his go.

**Query `cpl_memory` FIRST** (Rule 8) — tags `map`, `custom-report`,
`catalog-year`, `auth`. Ten rows were written 2026-08-19; several are `verified`
with Sam named.

## Your priority — the three reports

Sam, 2026-08-19: *"I want to see if the next session can fetch them from
https://customreportingmodule.azurewebsites.net/ and test against what we have in
Supabase now to see if we get the expected results."*

Generated from the Access DB steps and queries worked through with earlier
sessions. From his screenshot:

| Report | Fields |
|---|---|
| College Exhibit Credit Recommendations | 11 |
| College Exhibit Credit Recommendations **By Catalog Year** | 13 — CollegeID, Source Code, ExhibitID, Credit Recommendation, College Course, +8 |
| Student Details and Credits | 30 |

⚠️ **Establish this before anything else.** Sam pointed at
`customreportingmodule.azurewebsites.net` — the report **builder UI**. Our
`fetch_custom_report.py` consumes `mapwebapinew.azurewebsites.net/api/CustomReport/getReport`.
Whether the three new reports are exposed on the **existing API endpoint** decides
whether this is a twenty-line change or a real integration. If they are, you need
three `viewName` values and their column lists, and that is a question for Pedro.

⭐ **The first job is a RECONCILIATION, not a load.** Two of the three overlap
tables we already hold — `map_student_credit` (537,908 rows) and the exhibit/CR
surfaces. The question is whether the new extract agrees with Supabase and, where
it disagrees, which is right.

⚠️ **A disagreement is probably not a defect.** `cpl_memory`
`two-student-counts-disagree-indicator-suspected` records Sam's own explanation:
our extract is stale because the MAP team was pulling records off MAP to correct
Exhibit references and reload them. So divergence may be **our staleness
resolving** — the expected outcome. Confirm it; don't file it as a bug.

⭐ **CATALOG YEAR is the genuinely new dimension.** Nothing we hold carries it. It
is what pins an articulation to the catalog it was approved under rather than
letting it float, which matters for every "was this valid when the student took
it" question we currently cannot answer.

## The ITPI automation question — do not let this get decided casually

Pedro Campos (CEO of ITPI, the vendor developing and managing MAP) has offered to
**automate a daily push of these tables into Supabase**, which would mean editing
the cron. Sam wants a recommendation **before Pedro does anything**.

**The recommendation is to decline the mechanism and accept the help.**
`fetch_custom_report.py` already pulls **eight** datasets from the MAP API on the
daily cron. Three more is three entries in `REQUEST_PAYLOAD` — a config change,
not an integration. A push would invert the trust direction (MAP is read-only for
us), need a credential we must issue (and the only one that trivially works is
the **service key, which bypasses all RLS**), make failures invisible, and create
a second writer.

If volume forces a push later: dedicated Postgres role, INSERT-only on **named
staging tables**, never the service key, validated promotion we own. Full
reasoning in the ADR.

Pedro is now a Supabase org owner **and** an `allowed_reviewers` entry, so he
technically *can* write. That makes the recommendation a design conversation
rather than an access one — which is the right conversation to have, and the
easier one.

## Carryover

- **Auth: magic link + one `role` column.** Recommended, not built, awaiting
  Sam's go. Explicitly **not groups** — that is the part he ruled out and he was
  right. The 132 reviewer policies do not change.
- **Repo split.** Scoped and merged (#1242);
  [`docs/public_private_repo_split_scope.md`](public_private_repo_split_scope.md)
  is the authority. Phase 1 (`sierra/`, `veteran-sprint-map/`) is zero-risk.
  Blocked on Sam: CC BY 4.0 question, Free-or-Team, option B or C.
- ⚠️ **Second GitHub-org owner is NOT confirmed.** Sam added Pedro as owner on
  Supabase and MAPInitiativeTech; the **GitHub org** — where Pages, 29 workflows
  and 8 secrets live — still needs checking at
  `github.com/orgs/CPL-Initiative/people`.
- **GR:** a GR-only phrase holder lost the shared tabs by design and needs the
  `team` phrase. Confirm nobody is stranded.

## Patterns that worked

- **Check the premise before answering the question.** Two of the three repos
  were already where Sam wanted them, and the privacy concern was not his
  concern. Twenty minutes of measurement changed the entire answer.
- **Read our own KB before generating a new argument.** The decisive point about
  shared credentials was a note from June. The best catch of the session was
  already written down.
- **Measure the blast radius of the thing you are actually solving.** GR and
  Finance were filed as one problem for four days; they are one predicate and a
  30-table refactor respectively.

## Safety patterns to honour

- **An RLS-filtered read returns 200 + `[]`.** Empty is not proof of empty.
- **A tag scan cannot see a `fetch()`** — new this session, and it nearly shipped
  a wrong conclusion. [`methodology-a-tag-scan-cannot-see-a-fetch`](kb-notes/methodology-a-tag-scan-cannot-see-a-fetch.md).
- **Never let a machine inference wear the costume of a curated fact.**
- **Reviewer access is all-or-nothing** and now reaches student-grain data plus
  `team_access` itself. Treat additions as the privilege grant they are.
- Rule 4 (both HTMLs identical), Rule 1 (change the generator), Rule 5 (never
  force-push `main`), Rule 10 (fresh read before any bulk `kb_curation` write).

## Your moniker

**SkyFetch** fits the workstream if you want it — but claim your own; Sam often
names the session in his first message.

Next after you: `docs/session_171_handoff.md`.
