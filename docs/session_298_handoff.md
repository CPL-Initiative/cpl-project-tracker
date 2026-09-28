---
title: Session 297 handoff — the SQL prompt's source found, and the opening line's check removed
date: 2026-09-28
session: 297 (SkyLantern)
tags: [handoff, permissions, prompt-storm, decision-sheets, jev]
status: current
---

# You are Session 298

Your moniker is **SkyLatch**. SkyLantern (S297) took the queue from
[`session_297_handoff.md`](session_297_handoff.md), and Sam reordered the day: the SQL approval
prompts first, then Jev.

## First thing: Sam's three-call test

Sam, 2026-09-28: *"Any changes we make will need to be tested with 3 operations that are requiring
Allow in a new session before we consider this problem solved."* You are that new session. Before
anything else, make these four calls to the Supabase `execute_sql` tool, one statement per call, in
this order, then ask Sam in one line whether any of the first three asked him to Allow:

1. `select count(*) as live_rows from cpl_memory where status <> 'superseded';`
2. `select slug, event_date from cpl_memory order by event_date desc nulls last limit 3;`
3. `update cpl_memory set status = status where false;`
4. `update kb_curation set value = value where false;` (the safety check: the repo's guard must
   refuse it with *Blocked by the repo's Supabase guard: this statement contains update*)

**A pass:** no prompt on 1–3, and 4 refused by the guard. Then promote
`sql-prompt-storm-cause-account-connector-tool-permissions-2026-09-28` to `verified` (Sam's ✓) and
supersede `execute-sql-prompts-by-the-connectors-own-mark-no-local-setting-reaches-it-2026-09-20`.
**A fail:** get the prompt's exact wording from Sam. *Your organization requires approval for this
tool* means the Owner's setting; see the top section of
[`approval_prompt_hooks`](reference/approval_prompt_hooks.md).

## Then: the cleanup Sam asked for (on a pass)

*"Once we have a solution, I want to clean up anything in claude.md related."* S297 did the
CLAUDE.md half: the sign-off template lost its check sentence (Sam's ruling, same day), and the
pointer line, Rule 9a and the stop-hook bullet no longer lean on it. Yours:

- `docs/reference/approval_prompt_hooks.md`: condense the sections that call the prompt unreachable
  (the 2026-09-20 sections and the options (1) to (3)) into `docs/auth_and_repo_posture_lessons.md`;
  keep the guard mechanics and the installer procedure.
- `docs/working_with_claude_code.md` §15: tell a teammate where the setting lives, and drop *no
  setting on our side changes that*. Ask Sam first, in one line, whether he changed the Owner's
  setting (it covers everyone in the organization) or his own (Ashley, Jessica and Malone each
  change theirs).
- The note printed under `scripts/check_hooks_live.py`'s LIVE line still says *execute_sql still
  asks once per call, by an upstream mark*. Correct it.
- Supersede `sam-team-guide-says-allow-all-sql-requests-2026-09-20` with the §15 rewrite.

## Then: Jev, Sam's item 1

*"I want to get back to work on using Jev in our process to improve CSR, CCR, CER, CCRR."* Read the
Jev sections of [`common-cr-reference`](reference/lanes/common-cr-reference.md) (the gate, the
battery, the ladder, the CCR adapter), then
[`reference-system-one-model-fit-by-lane`](kb-notes/reference-system-one-model-fit-by-lane.md).
State: `kb/_jev_adjudicate.py` serves the CSR, CER and CCRR, and the CCR through the Trust Card
adapter; Sam ruled the CCR's first sitting on 2026-09-21 (40 to 60 findings on the six-rung
ladder). The CER and CSR scanner findings date from 2026-07-10 and need a re-run before any Jev
call on them (deferred To-Do `s282-fable-rerun-cer-csr-scanners`); the CCR has no decisions table
yet, a Governance item (`s282-sam-ccr-decisions-table`). Bring Sam a next step per reference, on a
sheet where it needs his rulings. Effort: single-threaded; each step is a design call.

## Sam's decisions, recorded (2026-09-28)

1. SQL without approvals is the first goal, proven by three calls in a new session, then the
   CLAUDE.md cleanup (`sam-enable-sql-without-approvals-test-in-a-new-session-2026-09-28`; it ends
   his 2026-09-24 stop-work ruling, superseded explicitly).
2. The source: his account's Supabase connector Tool permissions, *"all set to read only"*, which
   he changed (`sql-prompt-storm-cause-account-connector-tool-permissions-2026-09-28`, proposed
   until your test).
3. The opening line drops *"First, run python3 scripts/check_hooks_live.py --fix and paste its LIVE
   line"* (`sam-drop-the-guard-check-from-the-opening-line-2026-09-28`; ends his 2026-09-20 ruling).

## What shipped

- The S297 checkpoint PR: the reference doc's 2026-09-28 section, the lessons entry, KB note
  `methodology-verify-the-premise-before-you-build-on-it` case 3, the CLAUDE.md edits above, and
  the standing sheet's pointer.
- The open-asks sheet, published: https://claude.ai/artifact/C1uyRhneegqQ4XSPRKiC3B.
- Seven `execute_sql` calls after Sam's change (three reads, four writes) each executed within the
  seconds it took to write the statement.

## Waiting on Sam

- The open-asks sheet, cards 1 to 3. Cards 1 and 2 are cards 3 and 4 of
  https://claude.ai/artifact/74AfMNmXPQYP5X7XKpjHfH: read both stores; the later answer stands.
- The timeline label (To-Do `s296-sam-timeline-label`).
- Owner setting or his own (for §15), and, optional, one minute: change the date on the
  environment setup script's comment line so the snapshot rebuilds with the context meter. This
  session's root had the guards and no meter; `--fix` added it here, and the opening line no longer
  runs it. Until then, run `python3 kb/_context_budget.py` by hand (Rule 9a).

## The queue after Jev

1. SkyView's phone opening (`s295-fable-skyview-phone-narrow`): measure at 390px through
   `npm run a11y` first.
2. The narrated video: cue each reveal to its word (`s295-fable-cue-narrated-draft`).
3. On Sam's ETHS answer (card 3): `python3 kb/_eths_remint.py --scope standalone,missed` (plus
   `children,merged_elsewhere` for "all"), widen `--apply`'s admitted scope in the same PR, then the
   same land as #1723.
4. ESL monthly pass after 2026-10-28 · governance for the two write surfaces · the unit-range
   display check.

## Read in order

1. This file. 2. The top section of [`approval_prompt_hooks`](reference/approval_prompt_hooks.md).
3. The Jev reading above.

## Patterns that worked

- **A permission belongs to its owner.** The classifier refused the session's reads of the Claude
  Code install and the root settings as `[Auto-Mode Bypass]`; the platform's documentation for the
  symptom named the setting, and Sam changed it in about a minute.
- **Time a call against the database's clock.** A `date` stamp before a call, set against the
  statement's `now()` or `created_at`, shows whether it waited on a person.
- **A table constraint rolls back the whole batch.** `summary` is capped at 400 characters; the
  two-row insert failed whole, and nothing half-landed.

## Safety patterns

- With no prompt in front of `execute_sql`, the guard hook is the write barrier. A write outside
  `cpl_memory` still goes through a reviewed plan (Rule 10).
- The guard strips literals before it reads verbs, so text inside `$json$…$json$` is safe; a bare
  `replace(` outside a literal is still denied.

## Carryover

- S296's vault session note, left out of that emergency checkpoint, was written by S297.
- `oversized_doc` still flags `roadmap_archive`, the funding lessons archive, two lessons docs and
  the funding lane; none grew this run beyond the history rotation.
- Not refreshed: the Pipeline tab (the pipeline did not move), `kb/README.md` and `README.md`
  (nothing changed).
