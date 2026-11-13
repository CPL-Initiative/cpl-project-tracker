---
title: "Session 649 handoff (from SkyTanager, S648)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyOriole (Session 649)

From SkyTanager, S648, a full Rule 9 checkpoint written at about 18:40Z 2026-11-13 by a documents worker **while the
session continued**: the conductor still held five open branches when this was written, so read the ledger against
`main` and the PRs before you act. Facts come from the conductor's record, `origin/main` at `7cd72253` and the merged
squash commits; a fact marked *as reported* was not re-read.

**How S648 ran.** Conductor mode (Fable 5.2 conductor, Opus 5.5 workers, ultracode on), from 17:05Z on handoff 648, Sam
in session (he wrote once, about 17:30Z: *"see cobix 3229 comments"*). The Supabase connector was up all session. No
other session was live at 17:06Z. Eight PRs merged; Sam's two rows of the day are written; the conductor's twelve
decision rows wait in a NOT YET RUN receipt.

## First things, in order

1. **Run `kb/receipts/cpl_memory_s648_rows_2026-11-13.sql`** if its first line still says NOT YET RUN (twelve
   proposed rows, every summary at most 400 characters, longest 388; one call of three statements). Then read the
   replies on [Open Asks Sheet 193](https://claude.ai/artifact/XNwKc2jLizwx4baMK6mZWU) and on [Sheet 192](https://claude.ai/artifact/1Kt8Yg88NWUpFduHLofWHQ)
   before acting on anything either names.
2. **Cal-GETC 34 (#3244, merged), Grossmont first.** `claude/harvest-calgetc-grossmont-s648`: `step=reconcile` was
   dispatched 18:24Z (*as reported*; not read at writing). Read the run, compare against `main`, `step=reread`, the
   display build, PR, merge on a green `test` after COBIx's spot-check. Then Cosumnes River (the statewide step, 30566,
   33072, 39656) and Cerro Coso (`set` 35 from p.65, six programs), one college each. Held by name: Antelope Valley
   43028, Los Angeles Southwest 33658, Sacramento City 30700, Cuyamaca 46530.
3. **Glendale (#3202, draft, head `e6d66dbd`, not loaded).** The free whole-college slow read on `5dc35578` was
   dispatched about 17:35Z (*as reported*). After it files: refile with `--main`, one reader on the last delta, a small
   paid extraction (estimate under $1, limit $40), the compare tool, `step=load` (skips 12571 and 37070), the display.
4. **Re-clustering (#3245, draft, nothing applied).** Reduce it to its two ready cases (FIRE M1274 into FIRE 130 X;
   the BUSI M1228 split, insert-only, new BUSI M11TU), a review of at most 9 agents, then apply both in one window clear
   of 06:17, 09:17 and 12:17 UTC under `docs/coursecontrolnumber_remint.md`. The four held cases and the Honors reach
   are Sheet 193 card 3.
5. **#3248** (`claude/exhibits-shared-titles-s648`, draft, head `3aa3ad85`, test running at 18:20Z): merge on green
   after COBIx's comments.
6. **The 17 colleges' free GE page reads** for Cal-GETC (names in the harvest lane, NEXT 5): each adds a reconcile step
   only with quoted evidence.
7. **The post-deploy `{}` calls** to `program-requirements-extract` (the service key expects 400, anon 401): the
   session held neither key; COBIx was asked on #3227. Run them when a key is in hand, or record COBIx's run.
8. **The census re-run** dispatched on `main` about 17:56Z (`harvest-gap-census.yml`): read its result, so the College
   Data Collection lever reads "the pipeline's reconcile steps".

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it,
`df -h /`, `git worktree list`, and **the issues COBIx opened or commented on today, checked against this list**
(S648's lesson: #3229 was missing from handoff 648). Before any merge, read COBIx from the last comment (`perPage` 1
from the last page) on #3202, #3245 and #3248; never `get` #3111 or #3110.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 (INSERT-only, rollback in
its header), 2 (the display go of 2026-10-10 stands for every college; merging publishes, so COBIx's spot-check
first), 3 up to its load (paid extraction within $40, after the reader), 5, 6, 8. **Never run by a session without his
word:** anything on Sheet 193 cards 3 to 5; the four held re-clustering cases; the CVMA rows (a person's rows); removing
the repository copy of `SUPABASE_SERVICE_KEY` (his setting); anything on the `CLAUDE.md` hold list. #2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S648, and what worked* included: unsubscribe from a
worker's PR without reading the notice body; never `get` a PR for its comments.

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

## Ledger (PR, branch, state) at writing, 18:40Z

| PR or branch | State | Next |
|---|---|---|
| this checkpoint, tracker `claude/checkpoint-s648` | draft | merge on a green `test` |
| this checkpoint, vault `claude/checkpoint-s648` (Sheet 193's source, the session note, the braindump, the wiki touch) | draft | merge after the tracker PR |
| #3239 session branch `claude/focused-turing-kyh0lm` | draft; the two S647 receipts edited to say RUN | merge on green |
| #3202 `claude/harvest-glendale-s645` (`e6d66dbd`) | draft, free read running | *First things* 3 |
| #3245 `claude/reclustering-six-cases-s648` | draft, plan only | *First things* 4 |
| #3248 `claude/exhibits-shared-titles-s648` (`3aa3ad85`) | draft, test running | *First things* 5 |
| `claude/harvest-calgetc-grossmont-s648` | no PR; reconcile dispatched 18:24Z | *First things* 2 |
| #3227 `dcba4c45`, #3242 `e8985e00`, #3240 `ae9dda52`, #3243 `ac7c6595`, #3241 `bbfbb6bb`, #3246 `57d99e14`, #3244 `74ad28b9`, #3247 `7cd72253` | merged on green | none |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

A worker that survives the session is named in the conductor's own sign-off; otherwise brief a fresh worker per branch
from its diff and this ledger.

## What shipped (S648)

- **Receipts and deploys:** both S647 `cpl_memory` receipts run at 17:07Z (16 rows; three summaries cut to the 400
  check, Sam's words kept; `d-no-closed-list-separate-grade-s644` superseded by a guarded update); the carry basis read
  back (`electives_fill_words` and `hours_total_printed` out). Deployed from `main`: `docket-process` (43469609500),
  `library-publish-now` (43469887510), `program-requirements-extract` (43473787249 from `dcba4c45`); all *as reported*.
- **#3227** the 503 answer, after a review of 8 agents (7 confirmed findings) and COBIx's read.
- **#3240** College of the Desert: paid read $1.44, 12 reread, 7 loaded, 330 displayed; 10195 restored to `main`'s
  record by a guarded UPDATE (receipt `kb/receipts/program_requirement_records_restore_desert_10195_s648_2026-11-13.sql`,
  RUN, md5-checked).
- **#3242** the course key: one live read reconciled the Commons' two figures (raw 89,192 and 12,815; the key 88,736
  and 13,293).
- **#3243, #3247** College Data Collection on Sam's #3229 words: Collected for Harvested, one confidence card,
  confidence and completeness first, the list lowest completeness first.
- **#3241** Exhibits: the issuer tag list `kb/reference/issuer_tags.json`, an "or" between tests coded as written,
  CompTIA's series as alias, `name_source`.
- **#3246** COBIx's district profile files. **#3244** the Cal-GETC 34 rule, gated per college, with its plan.

## Live data written, each with its undo

- `cpl_memory`: 16 S647 rows and Sam's two S648 rows (`sam-upfocus-confidence-completeness-2026-11-13`,
  `sam-college-collection-not-in-cobi-2026-11-13`); undo by slug.
- College of the Desert: reread 43470869324 (12 replaced, 7 absent), load 43471673398 (7 inserted, its receipt the
  rollback), display 43472890592 (330 written, each prior build filed), the 10195 restore (before-values in its receipt).
- Model spend: College of the Desert 43421133593, $1.44. Nothing else paid.

## Decisions to honor

**Sam's:** his #3229 words (relayed by COBIx, 7:13 AM PT, verbatim in the vault braindump): confidence and completeness
up, review down; no expectation of double work; college staff directions later, through a signed-in Sierra. His 9:18 AM
PT note, *"college collection changes don't seem to have hit cobi yet"*, came before #3243 merged.

**The conductor's twelve** (each a row in the receipt, a DECIDED line in its lane, and a Decided card on Sheet 193 cards
1 and 2): `d-desert-10195-hold-main-s648`, `d-glendale-tab-control-number-s648`, `d-calgetc-34-per-college-evidence-s648`,
`d-calgetc-short-fills-by-sheet-81-s648` (harvest); `d-course-key-normalized-s648`, `d-data-collection-two-bases-s648`,
`d-reclustering-three-held-s648` (commons); `d-named-credential-issuer-tag-or-half-s648`,
`d-or-between-tests-coded-as-written-s648`, `d-comptia-series-is-alias-s648`, `d-official-name-source-confidence-s648`,
`d-comptia-after-ase-s648` (cer-procedures). Sheet 192's cards 5 and 6 are carried by these as Decided.

## Waits for Sam

[Open Asks Sheet 193](https://claude.ai/artifact/XNwKc2jLizwx4baMK6mZWU) is current (`SHEET_ID` `2026-11-13-open-asks-193`, published about 18:42Z, a fresh store, `replies` empty at publish by a list read). Cards 1 and 2 are
decisions to revise. Cards 3 to 5 wait, each *Yours to rule*: **3** re-clustering, a picker per question (Honors reach:
M-IDs only, recommended, 3 new M-IDs, or official ids too, 136; AJ 160, MUS 130 and REAL M1038 with M1040, each keep
recommended; MATH M1044 into M1036, merge after the refrigeration lab articulation is settled, and who settles it);
**4** the three CVMA rows (fix the two typos; name the agency for Water Treatment Facilities or remove that row);
**5** Sheet 192 card 4 carried: the Las Positas cards (22, 17 still department plus code). COBIx is also raising the
CompTIA exam-series question with Sam. #3217 (the CVC chip) stays parked.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** (1) Glendale; (2) a stored hold for Desert 10195 (never repost run 43421133593's
   artifact for it) and the one-college workflow that files nothing after a mid-read halt; (3) the reading-procedure
   check; (4) the PDF reader's wrapped-heading follow-ups; (5) Cal-GETC applies and the 17 page reads; (6) Monterey
   Peninsula's three build-only programs; (7) the district phase 0 builder and the CMS probe; (8) the wave's sample,
   census follow-ups, Copper Mountain, the catalog-year rule, De Anza, Redwoods; (9) the headline's own-list rule, chip
   and note (a migration and a rescore). Step 11: Allan Hancock's SLO read.
2. **`commons`:** the census re-run's result; Coming next as sources arrive; #3245's two cases; the model pass's price
   to Sam; #3219 (Sam approves); the ASE slice's public copy, then CompTIA, AWS, NCCER, military; the path mock.
3. **`cer-procedures`:** #3248; the rename *ASE Certificate Bundles: A6 or T6 + L3* rides the next batch for Sam;
   wiring `series_aliases` into `kb/credential_aliases.py`; its NEXT list (the Fact Sheet's categories, the 362
   credentials without a subject, the issuer registry, the trainer move).
4. **`governance-team-enablement`:** keyed workflows into environments, one PR per group; then Sam removes the repository
   copy; `tests/standards_2_ruled_renames_test.py`; #3227's two follow-ups (`kb/_second_reader.py` exits 0 when the
   database is down; the deploy workflow's comment names only `group_queue.mjs`).
5. **`library`:** IACA's `regen` waits on Crystal Nasio; NEXT 0, Sam's List publicly.
6. Carried untouched, each with its own NEXT: `sierra-page-redesign`, `sierra-retrieval-corpus`, `csm-workspace`,
   `implementation-funding`, `college-district-identity`, `common-subjects-reference`, `org-phrase-scope-auth`,
   `reviewer-session-lifetime`.

## Not refreshed / what the conductor runs

A full checkpoint, written while the session continued. The documents worker made no Supabase call, dispatched nothing
and merged nothing. **Step 10:** prepared as the receipt above, not run. **Step 12:** the run logs carry this session,
the next step, the calls Sam answered on Sheets 187, 188, 190 and 191, and the new call on Sheet 193; **the live
headline, the harvest row and the routine's next run are the conductor's** (SQL and `get_trigger`) and are not
refreshed here. **Refreshed:** this handoff; the lanes `program-requirements-harvest`, `commons`, `cer-procedures`,
`library`, `governance-team-enablement` (older paragraphs moved verbatim to their lessons docs under *Moved from the lane
(S648 checkpoint)*); `conductor_mode.md`; INDEX and catalog; the docs audit; the `CLAUDE.md` sheet pointer (no rule
touched); the vault note, braindump, Sheet 193's source and the wiki touch. **Not touched, with reason:** the pipeline
view (no roadmap row, auditor count or re-mint moved); `kb/README.md` and `README.md` (no new tab or generator);
`eacr-exhibit-cr-adoption` (the Exhibits work lives in `cer-procedures`); no new KB note.

## Patterns and lessons

- Length-check a prepared receipt against the table's constraints when it is written.
- A reader runs the code before a dispatch that touches shared reader code.
- Per-college evidence in config, never a pattern over catalog prose, for a figure a ruling fills.
- A compare before each load; never repost an artifact that a restore undid.

## Let go

The documents worker subscribed to no PR, scheduled nothing and watched no artifact. The conductor's own subscriptions
and wakes are named in its sign-off.

Greetings, you are SkyOriole (Session 649), see SkyTanager's handoff — `docs/session_649_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_649_handoff.md) — let's keep rolling with our queue.
