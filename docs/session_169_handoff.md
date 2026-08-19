---
title: Session 169 handoff — from Sky168
date: 2026-08-19
tags: [handoff, session-169, gr, government-relations, alpha, register]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 169

Sky168 signing over. Two things shipped: the **Alpha notice** across COBI, and the
**GR tab rebuilt as a register** for a General Counsel demo. The second is the live
workstream and it has a blocker only Sam can clear.

## Read in this order

1. `CLAUDE.md` §11 row **"GR register / CO policy & regulation review"** — current truth.
2. [`docs/gr_register_lessons.md`](gr_register_lessons.md) — the full story.
3. [`docs/kb-notes/methodology-a-filter-needs-a-field.md`](kb-notes/methodology-a-filter-needs-a-field.md) — the durable lesson.
4. `kb/supabase_gr_register.sql` — schema, RLS, and the reasoning in comments.
5. §11 row **"Org & phrase scope"** — the blocker, pre-dating this session.

**Query `cpl_memory` FIRST** (Rule 8) — tags `gr`, `government-relations`, `title5`.
It had nothing on GR when Sky168 looked; write what you learn.

## What shipped

**Alpha notice (#1235, #1236).** Every COBI page: an `Alpha` chip on the wordmark and
a centered italic line — *"COBI is an experimental data suite in Alpha development
phase. Features and figures may be incomplete or wrong — please don't cite or share
them outside the team."* Plus `(Alpha)` in `<title>`/`og:title`, so a link pasted into
Teams says so before anyone clicks. Injected at runtime by `cobi_brand.js` because the
generator rewrites `<h1>` daily and would strand anything typed into the masthead.

**GR register (#1237).** `gr_areas → gr_revisions → gr_artifacts`. Was one hardcoded
jsonb doc, one topic, `writes: []`. Now: area picker, keyword search, pathway chips,
status filter, per-code section dropdowns, and create-flows for all three. 2 areas
(CPL's 16 migrated; `dual-enrollment` a marked SAMPLE), 14 sections, 71 checks.
`gr_content` **left in place** as the rollback copy.

**Also live in Supabase, no UI yet:** `gr_history` (snapshot-on-change triggers on all
three tables; the trigger is the only writer, no write policy) and a `sensitivity`
column defaulting to `restricted` plus a `gr_open_sections` view
(`security_invoker = on`). Both additive; **nothing was widened**.

## Do this next

1. **Editing.** You can add but not change or delete. A review workflow is mostly
   revising, so this is the biggest functional gap. The history triggers are already
   live and waiting for it.
2. **Whatever the adversarial audit surfaced** — Sky168 ran a 6-lens workflow over
   the register (authz, injection, citation correctness, migration fidelity, failure
   modes, test quality). Check the §11 row and the lessons doc for confirmed findings.
3. **Load the real CO priority-area list** when Sam sends it; typed titles until then.

## Blocked on Sam — do not act unilaterally

- **Phrase scope.** The GR phrase opens *every* shared team tab (`team_pass_check()`
  matches ANY secret). GC cannot be invited until this is scoped. It is a live RLS
  change across ~30 tables; getting it wrong locks working people out mid-task.
- **Retiring the GR phrase entirely** (Sky168's recommendation). A shared phrase has
  no identity, no per-person revocation, and is guessable via an anon-callable RPC.
  Reviewer-only reads already work. But flipping it locks out any current phrase
  holder who is not a reviewer — **get the list of who needs access first.**
- **Flipping any row to `sensitivity = 'open'`.** That is the CO-wide disclosure
  decision, not a code change.

## Patterns that worked

- **Ask before building when an answer changes the shape.** Four questions up front
  (access, demo content, what "analyzed" means, scope) turned a vague ask into a
  buildable one — and surfaced that the tab was built to lock the CO *out* while Sam
  was about to invite them in.
- **Check the value before reporting the bug.** `ids` looked like a citation field
  and the Word list looked 3 items short of the screen. Reading the actual values
  showed `ids` is an internal cross-reference and the 13 entries deliberately
  consolidate all 16 rows. A confident wrong finding costs more than a slow one.
- **Let the repo's own tooling correct you.** Hand-editing `cobi_admin_surface.js`
  failed `admin_tab.test.js` by design; Supabase's linter caught two functions Sky168
  had just introduced. Run `python3 kb/_build_cobi_admin_surface.py` and
  `get_advisors` after any schema work.

## Safety patterns to honour

- **An RLS-filtered write returns 200 + empty body.** Empty rows = FAILURE, never
  success. **A null read ≠ an empty read** — transport failure and "you may see
  nothing" must not render the same.
- **Never let a machine inference wear the costume of a curated fact.** Derived
  citations carry `citations_derived` and render dashed. §11342.2 is *Government*
  Code — an `else` bucket would have fabricated a citation in front of lawyers.
- **A view over an RLS table needs `security_invoker = on`** or it runs with definer
  rights and bypasses the protection entirely.
- **Writes are reviewer-only here.** A shared phrase is a read credential.
- Rule 4 (both HTMLs identical), Rule 1 (change the generator, not the HTML),
  Rule 5 (never force-push `main`).

## Your moniker

Sky168 was named for the handoff it inherited. **SkyCounsel** fits the workstream if
you want it — but claim your own; Sam often names the session in his first message.

Next after you: `docs/session_170_handoff.md`.
