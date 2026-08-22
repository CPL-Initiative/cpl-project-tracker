---
title: Session 184 handoff — the scope fix is merged and NOT deployed
created: 2026-08-22
updated: 2026-08-22
tags: [handoff, session-184, sierra, my-college, cpl-chat, guidance]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_183_handoff]]"
  - "[[docs/college_action_page_lessons]]"
---

# Session 184 handoff

You are **Session 184**. Session 183 was **SkyScope**. One run, one bug, one PR —
plus a guidance audit Sam asked for on the spot.

⚠️ Sam runs several sessions at once. He flagged one on the **CPL Funding Model**
during this run. Check `git log origin/main` before assuming your branch is alone.

---

## 🔴 READ THIS FIRST — the fix is merged and INERT

**#1291 is on `main` (`39e44e2`). The `cpl-chat` edge function has NOT been
deployed.** The client now sends a `scope` field that the live function does not
read. That is safe — an unknown field is ignored — but **nothing Sam reported is
actually fixed on the live site until the deploy happens.**

Playbook: [`playbook-deploy-shared-supabase-edge-function`](kb-notes/playbook-deploy-shared-supabase-edge-function.md).
Capture the running version as rollback → `deploy_edge_function` with
**`verify_jwt: false` explicitly** → smoke every mode. Sam had not given the go
when the session ended; ask, don't assume.

---

## What shipped

**#1291** — Sam had **LACCD** selected on My College and Sierra answered about
**RCCD**: three Riverside colleges, Norco's exhibits, Moreno Valley's figures,
under a heading reading *Welcome, Los Angeles Community College District*.

**The district machinery was entirely sound.** `resolveDistrict()` is deployed
(read the LIVE function through the Supabase MCP — the repo is not the
deployment), 9 of 9 LACCD colleges have profiles, and the district chip's own
question resolves correctly. Two other things were wrong:

1. **The thread outlived its subject.** `convo` is module-level *on purpose* so a
   conversation follows the reader between panes; `finish()` does
   `root.innerHTML = h` on every scope change, so the widget rebuilds and the log
   starts EMPTY. Together: a clean-looking conversation still shipping eight turns
   about the previous district. ⚠️ **And a stale thread SOURCES the answer, it
   does not tint it** — `cpl-chat` folds prior user turns into the RETRIEVAL text
   when the new question carries <2 topic words of its own, and `riverside` is in
   `COLLEGE_ALIASES`.
2. **Nothing ever told Sierra which institution was selected**, while
   `sierra_guidance` `15ec666b` told her to *"confine your answers to the selected
   institution"*.

Fix: `setScope(kind, label)` handed over **unconditionally** from `finish()`; a
`scope` field on the request; `normalizeHostScope()`/`hostScopeBlock()` in the
function; and the district roster excluded from the West-LA ambiguity narrowing
(discriminated by the `_district` stamp).

---

## Sam's decisions this run

1. **"Yes, audit if needed"** — authorized the `sierra_guidance` audit.
2. **He asked whether My College should get its own Sierra configuration**, noting
   Sierra serves public / My College / Fact Sheet. The recommendation given (his
   call, not yet answered): **a `surface` field, not a forked Sierra and not a
   `mode` enum.** See §11's Sierra retrieval row.
3. He flagged a **concurrent session on the CPL Funding Model** — collision
   management is on us.

---

## Read in this order

1. `CLAUDE.md` §11 — the **My College** row (rewritten) and the **Sierra retrieval**
   row (guidance-audit findings + the `surface` recommendation).
2. [`docs/college_action_page_lessons.md`](college_action_page_lessons.md) — the
   2026-08-22 section + its addendum is the full story.
3. Three new KB notes:
   [`a-conversation-is-scoped-state`](kb-notes/methodology-a-conversation-is-scoped-state.md),
   [`a-guidance-rule-must-name-the-fact-it-depends-on`](kb-notes/methodology-a-guidance-rule-must-name-the-fact-it-depends-on.md),
   [`assert-that-an-argument-arrives-not-that-it-is-last`](kb-notes/methodology-assert-that-an-argument-arrives-not-that-it-is-last.md).

---

## Carryover — what is actually open

- 🔴 **Deploy `cpl-chat`.** See above. Highest value, blocked on Sam's go.
- 🔴 **Sam re-asks the LACCD question in a browser** after the deploy. No session
  can — the sandbox is egress-blocked from `*.supabase.co`.
- 🟡 **The `surface` field** — recommended, not built, blocked on Sam. One nullable
  column on `sierra_guidance` + one request field + a picker in Sierra Training.
  ⚠️ It will **not** deliver behavior that contradicts a BUILT-IN rule; `cpl_memory`
  records that built-ins win in practice whatever the preamble says.
- 🟡 **Smoke mode 7 greps model PROSE** and reds intermittently on correct answers,
  on a non-required check. Do **not** green it by deleting the assertion — the
  smoke script's own comment says part 3 is the part that matters most to a
  seeker. Assert on the retrieved CONTEXT instead. Separate concern, sibling branch.
- 🟡 **`CLAUDE.md` is 2.28× its lint budget** (136,977 B vs 60,000, `always_loaded`).
  This checkpoint archived the SkyApply narrative but still grew the file. A real
  pare-down is owed — move finished roadmap rows to
  `docs/reference/finished_workstreams.md`. Don't do it while a second session is
  live in §11.
- 🟢 `cpl_memory` row `sierra-has-no-district-dimension` is superseded this run.

---

## Patterns that worked

- **Rule out the obvious suspects with measurements, and read the LIVE artifact.**
  Three of the four candidate causes died on one query each; the fourth died on
  reading the deployed function rather than the repo.
- **Fail-first probe every check, in both directions.** Three of this run's checks
  could not fail on the first draft — a fake stream reader with no
  `releaseLock()`, a question that said "this district" instead of naming
  Riverside, and a chips assertion run after `submit()` deletes the chips.
- **Run the FULL suite, not the targeted one.** 20 targeted suites were green and
  one of 251 broke.
- **When CI hands you a brittle check, grep your own diff for the same shape.**
  The new test had the identical defect as the one that failed.

## Safety patterns to honor

- **Rule 5**: never force-push `main`.
- **Merge on `unstable`** — but `test` and `smoke` are both non-required here, so
  `unstable` can hide a real JS break. Wait for `test` specifically.
- The edge function is **shared by six surfaces**. A redeploy is a production
  change to all of them.
- **Rule 10(c)**: no Supabase egress from the sandbox — MCP tools only.

---

## Moniker

**SkyScope** named the axis this run turned on — scope, and what state is bound to
it. Session 184 might take **SkySurface** if it builds the `surface` field, or
**SkyLive** if it does the deploy. Claim your own; Sam sometimes names it in his
greeting, and if he does, that one wins.
