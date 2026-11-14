---
title: "Session 647 handoff (from SkyOriole, S646)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_650_handoff.md
---

# You are SkyPipit (Session 647)

Written for SkyOriole (S646, the conductor) by a documents worker at a full checkpoint, about 08:25Z 2026-11-13, with
the conductor's final states. S646 was the CPL Queue routine's first firing of the night (06:12Z, started 06:14Z) on
handoff 646. Sam was not in session; Sheets 188, 187 and 186 held no replies at 06:20Z; no `queue_todo_done` rows since
2026-11-12; no CER rule request or exhibit re-analysis request open. The firing had no `list_sessions`, `get_trigger`,
`set_session_tags` or `send_later`: the one-writer check was the open PRs and `main` since the handoff, and background
`sleep` timers brought the session back. Facts come from the conductor's record, `origin/main` (`e1f52690`) and the
PRs; a fact marked *as reported* was not re-read.

## First things

In flight at S646's sign-off, in this order; read each from its branch or PR.

1. **COBIx's spot-checks gate three drafts that each carry a display build:** #3205 Diablo Valley (build
   `90ef35707409`, 213 live; records 01476, 01493, 16919, 30737, 39367), #3206 San Jose City (`12f8b3d6d7a4`), #3207
   the six-college rescore (`1efcc13ee048`). Asked on #3111 at 06:20Z and 07:55Z (comments 6845769436, 6847271817);
   no reply at sign-off. Merging publishes the build. #3206 and #3207 rebuild on the new `main` first. After #3205
   merges, `step=display display_college="Diablo Valley College"` under Sam's standing go.
2. **Glendale (#3202, head `727d15e4`):** the paid `route=slow extract=1` read went out about 07:15Z (about 1 h 45 m
   of loading, estimate $7 to $14, ceiling about $24). Still running at 08:16Z, branch head unchanged: unread. Next:
   read it (stopped at a challenge means nothing paid; else its cost against $40), run
   `kb/_program_requirements_compare.py --college "Glendale Community College"` (on the branch), one reader on
   `727d15e4`'s delta (the fixes after the first reader have had no reader), and load only after both.
3. **Santiago Canyon (#3194, "HELD:", head `f9a0b128`):** paid read 43387912036, 67 extracted, 47 pass, $4.82; load
   43390109243, 24 inserted, 192 kept, 6 skipped, live 216 at 08:10Z; reread 43391061390, 43 replaced (before-values,
   one rollback). Display build `023a16e0e083` (216 programs) not applied: COBIx's spot-check of 11856, 11943, 11947,
   19588, 40639 (catalog pages 89, 110, 138-139, 324, 89-90), merge on green, then
   `step=display display_college="Santiago Canyon College"`.
4. **The College of Marin SLO trial** (#3211, `claude/slo-college-of-marin`, read run 43378795532): step 11 reads it.
5. **The Library's carried item:** Ally Barker's two `requested` rows (2026-11-12, "How to confirm and qualify for CPL
   funding"): `...mwdv9pl5`'s last ask (18:19Z, "Add the links in each box to the appropriate visual") has no ready
   draft; `...mwdvs6l1` and `...mwauxci5` have theirs. Read mwdv9pl5's open ask and IACA's (`library` lane, *Next*).
6. **The migration push** waits for Sam on [Open Asks Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ)
   card 6.
7. Before any merge, read COBIx from the last comment (`perPage` 1 from the last page) on #3111, #3110 and #3198; never
   `get` #3111 or #3110. Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff,
   `list_sessions` if you have it, `df -h /`, `git worktree list`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 once COBIx's spot-check of
a PR is on its thread (merge on green, never before the check), 3 included; 2 up to its load, within $40; 4 and 5.
A display after a load that passed its checks is covered by Sam's 2026-10-10 go
(`sam-first-display-run-explicit-go-2026-11-12`); post each run's record, receipt and minutes on #3111. **Waits for
Sam, never run by a session:** the migration push; cards 4 and 5 of [Open Asks Sheet
187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA); cards 4 to 6 of [Open Asks Sheet
186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt); anything on the `CLAUDE.md` hold list. #2894 is his. **[Open
Asks Sheet 189](https://claude.ai/artifact/K8pAMkQywm4VmGBAKbSf6x)** (Version 1, published about 08:24Z by the documents worker; `SHEET_ID`
`2026-11-13-open-asks-189`, 50,213 bytes, a fresh store, `replies` empty at publish) is current: S646's decisions on cards 1 to 3, none waiting. Sheets 188, 187 and 186 stay current for
their own waiting cards; 189 points to them.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S646, and what worked* included.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx (Sam, 2026-11-11, relayed by COBIx on #3110;
  `cpl_memory` `sam-conductor-model-fable-5-2-2026-11-11`). The routine's form sets the model and ultracode; medium
  effort lives in its prompt.
- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at **high** effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses **at most 9 agents in all**, readers and second readers together. Drop the second reader on
  minor findings first.
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Every brief that adds a test file says: its floor goes in `tests/check_floor.json`, run the tests touching your files
plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest. A brief that adds
a migration says: it applies on the push of the `.apply` change, before any merge.

## Ledger (PR, branch, state) at writing

| PR or branch | State | Next |
|---|---|---|
| this checkpoint, `claude/practical-meitner-pit525` (tracker) | draft | merge on a green `test` |
| CPLBrain#772, `claude/determined-mayer-pit525` (Sheet 189's source, the session note, the wiki touch) | draft | merge after the tracker's |
| #3205 `claude/harvest-diablo-valley-read-s644` (head `5aeea395`, build `90ef35707409`) | draft, 213 live | COBIx's spot-check, merge on green, then `step=display display_college` |
| #3206 `claude/harvest-sjcc-s645` (build `12f8b3d6d7a4`) | draft | COBIx's spot-check; rebuild on new `main` first |
| #3207 `claude/harvest-rescore-3193-s645` (build `1efcc13ee048`) | draft | COBIx's spot-check; rebuild on new `main` first |
| #3202 `claude/harvest-glendale-s645` (head `727d15e4`) | draft; paid slow read running at 08:16Z, unread | read it; compare tool; one reader on `727d15e4`'s delta; load only after |
| #3194 `claude/harvest-santiago-canyon-s644` (head `f9a0b128`, build `023a16e0e083`) | draft "HELD:", 216 live, reread done | COBIx's spot-check, merge on green, then `step=display display_college` |
| #3211 `claude/slo-college-of-marin` | draft, trial run 43378795532 | step 11 reads it |
| #3208 `4c79f88d`, #3210 `8faf0960`, #3212 `46a2f43d`, #3201 `e1f52690` | merged on green | none |
| `claude/harvest-santiago-canyon-proof-s645`, `claude/harvest-wave-s645a`, `claude/harvest-pdf-cn-proof-s645`, `claude/harvest-pdf-cn-proof2-s645`, `claude/harvest-pdf-baseline-s645` | throwaway, no PR | Sam or GitHub deletes them (sessions cannot) |
| `claude/harvest-rescore-{sbv,coalinga,grossmont,pierce,solano,elac}-s645` | carried by #3207 | throwaway once #3207 merges |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

No S646 worker survives a new session. Brief a fresh one per branch from its diff and this ledger.

## What shipped (S646)

- **#3208** `4c79f88d` Diablo Valley's slash-form award links (214 of 244 found). **#3210** `8faf0960` the credential
  watch. **#3212** `46a2f43d` the UI pass on `cobi:first-light` (clean in light and dark at 320, 390 and 1440; a11y
  targets `first-light-photos-dark`, `first-light-sierra-dark`; a held mark names the open PR). **#3201** `e1f52690`
  the PDF reader, merged 07:28Z, its number-line binding gated to Santiago Canyon. Each squash-merged on a green `test`.
- **Step 0:** `daily-dashboard.yml` run 43377336314, dispatched 06:14Z, green 06:23Z: the first real daily run after
  #3180 (governance lane NEXT updated).
- **Step 10, the credential watch:** 7 issuers read; GIAC GRC Leader (GGRCL) added, presale, general purchase
  2027-02-16; Google Professional Agentic Architect beta to new (GA exam $200, 2 hours); skills for 8 credentials (rows
  with skills 197 to 205). Unreachable: openai.com, anthropic.skilljar.com, cert.eccouncil.org. **The night's count:
  1 added, 1 changed.** The stopping rule stands at 2 nights of 14 under 25 (`credential_watch_agent.md`).
- **Step 8** (contacts harvest): Friday, not due. **Step 11:** the College of Marin trial (above).

## Live data written, each with its undo

- **Diablo Valley:** paid read 43379378196, 214 extracted, 197 pass, 22 fail, 11 not found, $13.85; load 43384856022,
  125 inserted, 88 kept, 1 skipped (08013), live 213 at 07:28Z (insert-only; the receipt's rollback is a delete limited
  to `checked = false`); `step=reread` 43386030975 replaced none.
- **Glendale:** free reread 43379067418 (`route=challenged`), 34 read, nothing written to a table; the first slow
  dispatch crashed at $0; the second was still running at 08:16Z, unread (ceiling about $24).
- **Santiago Canyon:** paid read 43387912036 ($4.82; compare 0 of 148 passing worse); load 43390109243, 24 inserted
  (the rollback names them), live 216 at 08:10Z; reread 43391061390, 43 replaced, before-values and one rollback.
- **Model spend:** Diablo Valley $13.85, Santiago Canyon $4.82, Glendale unread (ceiling about $24). Each under $40.
- **`cpl_memory`:** seven rows, run by the conductor at about 08:14Z, all returned; receipt
  `kb/receipts/cpl_memory_s646_rows_2026-11-13.sql` (rollback in its header).

## Decisions to honor

**The conductor's** (each a `cpl_memory` row, a DECIDED line in the harvest lane, and a card on Open Asks Sheet 189 for
Sam to revise on [Open Asks Sheet 189](https://claude.ai/artifact/K8pAMkQywm4VmGBAKbSf6x)):
1. A refused PDF block is filed under its own method `refused`, no text, no coverage, listed in `refused_passing`
   (`d-pdf-refused-method-s646`; card 1).
2. An own heading is the full title with the same award by normalized equality, a wrapped heading allowed; never a
   token subset (`d-pdf-own-heading-exact-s646`; card 1).
3. **Reversed:** decision 16(b), `file_run` keeping every filed record a bound read did not replace, at every college.
   `file_run` describes one read; `extract`'s carry-forward protects the PDF route (`p-filing-step-keep-all-refuted-s646`;
   card 1).
4. Glendale: a bot-check page is a refusal never passed; the two slow routes; a stopped read is never extracted; two
   Active programs never share a page on a title tie; the compare tool before any load
   (`d-glendale-challenge-is-a-refusal-s646`; card 2).
5. Diablo Valley loaded to 213, its display after COBIx's spot-check (`d-dv-sjcc-loaded-s645`,
   `d-merge-is-publication-spot-check-first-s645`; card 3).

S645's and S644's decisions stand as recorded in handoffs 646 and 645.

## Waits for Sam

- **The migration push** ([Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ) card 6, current):
  `kb/migrations/2026-11-13_s644_carry_basis_electives_fill_words.sql`, refused by the permission check; nothing
  depends on it tonight.
- [Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) card 4, does the course-list grade count in the
  headline; card 5, a statewide Cal-GETC of 34 units.
- [Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) cards 4 to 6: "deploy" for `docket-process` and
  `library-publish-now`; whether GitHub Actions may create pull requests; the six re-clustering cases and Honors.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest` NEXT (1) to (3):** *First things* 1 to 3.
2. **Harvest NEXT (4):** the PDF reader's wrapped-heading follow-ups ("Commercial." + "Music, AA" reads as Commercial
   Music's heading; "Pre-" + "Engineering, AS" misses; "Spanish, AAT" and "Fire Technology, Certificate" fail to match).
3. **Harvest NEXT (5) to (8):** the migration on Sam's go; COBIx's district files and the phase 0 builder, the CMS
   probe (#3198); the wave's fixed-rule sample, census follow-ups, Copper Mountain; College of the Desert by
   `blocked_sources`, the catalog-year rule, De Anza, Redwoods.
4. **`library` Next:** Ally Barker's and IACA's requests (*First things* 5); NEXT 0, Sam's List publicly.
5. **`governance-team-enablement` NEXT:** (1) the first daily log that carries `Daily push conflicted` or `Daily push
   rebased over a changed input`; (2) which of the 21 workflows that push from their own groups should share one;
   (3) the run-health file's scheduled writer; the worktree skip in the resolver test.
6. **Step 10:** the next slice of 7 issuers; the count moves to 3 of 14 on a night under 25.
7. Carried untouched: `sierra-page-redesign` NEXT (1), the first hourly `first-light-apply.yml` run; `commons` (the ASE
   slice's public copy, re-clustering); `cer-procedures` NEXT (1); `csm-workspace`; `implementation-funding`;
   `sierra-retrieval-corpus` (timings over real traffic).

## Not refreshed / what the conductor ran

The documents worker made no Supabase call, dispatched nothing, merged nothing and published nothing. **The conductor
ran:** step 10's statement (08:14Z, seven rows returned) and step 12's headline at 08:15Z (20,282 active, 14,525
complete by the tab's rule, 118 colleges; 14,370 at S645's sign-off) and the harvest row; the worker stamped both.
The routine's `get_trigger` was not read (the tool is not in this firing; the schedule is hourly to 06:12 PT), so the
run log's next run is not refreshed. The worker published Sheet 189. **Refreshed:** the harvest lane (its superseded text moved to the lessons doc,
*Moved from the lane (S646)*, and an *S646* section), the governance lane (back under its size budget; the #3180 detail
moved to `governance_lessons.md`), the library lane (the carried item; two bullets moved to `library_lessons.md`),
`credential_watch_agent.md` (the stopping rule's count), `conductor_mode.md`, the receipt, the run log's session fields,
INDEX and catalog, the docs audit, the `CLAUDE.md` sheet pointer (ready for 189's link, under 60,000 bytes, no rule
touched), the vault note, Sheet 189's source and the wiki touch. **Not touched, with reason:** `scheduled_sessions.md`
(no step's facts changed); the pipeline view (no roadmap row, auditor count or re-mint moved); `kb/README.md` and
`README.md` (no structure or surface change); the other four run logs (no reference moved); no new KB note. Wiki
candidates, written in the vault's wiki touch: a bot-check page is a refusal the reader records and never passes; the
filing step describes one read.

## Patterns and lessons

- A guard at a step every college shares changes every college: gate it, or read why the pinned test exists.
- A decision that changes a pinned test gets a reader before anything is built on it.
- A new route's tests run it through `capture()`; brief the reader before the paid dispatch.
- No capture keeps page text, so a free reread cannot feed a paid read.
- A compare tool before each load; a free capture on the final head before each paid read.
- Never `get` #3111: page its comments from the last page.

## Let go

This session subscribed to no PR, scheduled no check-in and watched no artifact (Sheet 189's publish confirmed no
watch). The workers' worktrees are gone with the session. No worker survives the session. Throwaway branches a later
session or Sam may delete are listed in the ledger.

Greetings, you are SkyPipit (Session 647), see SkyOriole's handoff — `docs/session_647_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_647_handoff.md) — let's keep rolling with our queue.
