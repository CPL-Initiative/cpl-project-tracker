---
title: Session 283 handoff — the first sitting ran, and it found a different question
date: 2026-09-22
session: 282 (SkyLedger)
tags: [handoff, jev, ccr, cr-reference, calibration, decision-sheets]
status: current
superseded: true
superseded_by: session_284_handoff.md
---

# You are Session 283

Your moniker is **SkyRung** — S282 (SkyLedger) built the ladder sheet Sam had
never seen, took his ruling on item 1, wired the CCR onto the Jev module, built
his six rungs, and spent the first sitting. Jev ranks well and the rung measures
the wrong question; Sam's answer to that is the open decision below.

## ✅ WHAT SHIPPED — all merged to `main`

| PR | What |
|---|---|
| [#1648](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1648) | The ladder sheet + the CCR Trust Card adapter + the chips argument that was never real (`053847e`) |
| [#1649](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1649) | The progressive rungs, and CIP from what colleges actually assigned (`aff3646`) |
| [#1650](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1650) | A gate belongs to the reference that measured it (`0466295`) |
| [CPLBrain#166](https://github.com/samueltlee/CPLBrain/pull/166) | Sam's framing, captured verbatim |

**Ladder sheet:** https://claude.ai/artifact/BkxGoSkJUE22BWCGcw9pwB
**Status visual:** https://claude.ai/artifact/AHFBSetu87Hi6RqkA33dfU

## ⭐ THE CROSS-LIST WORKSTREAM — 6 of 12 ITEMS LANDED (S282, after the sitting)

Sam asked for a decision sheet on cross-listing and got twelve items:
**https://claude.ai/artifact/BizNPAbrucq6hWARVzTQBp** · generator
`kb/_build_crosslist_decision_sheet.py` · **lane state (READ THIS FIRST):**
[`lanes/discipline-crosslist`](reference/lanes/discipline-crosslist.md).

⚠️ **HE PRESSED COMPLETE WITH NOTHING INDIVIDUALLY RULED** — `ruled: 0,
as_proposed: 12, through: null`. Under opt-out the twelve proposals ARE handed
over, and none of them is a ruling. That is why two are held.

| PR | items |
|---|---|
| [#1653](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1653) | the high-water mark, the pickers, the title-rung calibration receipt, the completion-message fix |
| [#1654](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1654) | **11** — KIN/PE/ATHL identifier fallout |
| [#1655](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1655) | **9** — the orphan-parent worklist |
| [#1656](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1656) | **1, 7, 8** — the frame, one primary, the re-mint boundary |
| earlier in #1653 | **2** — a 1-2 char subject code never decides a discipline |

⛔ **NEEDS SAM, AND ONLY THESE TWO.** Item **3** (re-mint the 31 mis-prefixed
ETHS identities — changes stored data under the playbook) and item **10** (open
`xdisc` to curators — a new write surface, Rule 10(a3) routes it through
Governance). The reply is already in the sheet's comment thread; **do not
re-ask**.

**LEFT TO BUILD:** item **4** (the Kinesiology/PE alias — ONE
`subject_discipline_map.json` entry, because zero rows carry
`disc == "Physical Education"`), item **5** (nest the specializations on the
vocabulary), item **6** (cross-list kind C through `xdisc`, waits on 5), then
the item-**12** sitting at 50 rows from kind C.

⚠️ **THE 17:01 CRON PREDATED daily-dashboard STEP 4d6**, so it regenerated
`unified_courses_data.js` without rebuilding `kb/orphan_parent_worklist.json`.
Run `python3 kb/_build_orphan_parent_worklist.py --check` on fresh main; if
STALE, rebuild and carry it on the next PR. **Do NOT dispatch a second
daily-dashboard run** while one may be in flight (Rule 6). Tomorrow's 06:17 run
fixes it unaided.

⚠️ **THIS WAS A CONTEXT-PRESSURE CHECKPOINT at 63,383 tokens left.** Refreshed:
this handoff, and `lanes/discipline-crosslist.md` (merged in #1656). **NOT
refreshed:** the To-Do feed, the lessons docs, `cpl_memory` rows, the §11
session narrative, and the other 30 lane files. S284 should run a full
`/checkpoint` early.

⚠️ **TWO TOOL BEHAVIORS THAT COST TIME THIS RUN.** `get_check_runs` on a PR
repeatedly returned a SUPERSEDED head's runs as though current, and
`actions_list` with a `branch` filter returned a main-branch cron run. Verify CI
by matching `head_sha` against `git rev-parse HEAD`, using `actions_list` with
`workflow_id` and NO branch filter.

## SAM'S DECISIONS THIS RUN

- **"CCR gets the next sitting"** — ladder item 1, and the sheet's ONLY
  `by: "sam"` verdict. The other nine came back `as_proposed`.
- **"title then CIP then course description"**, revised the same day: **"make CIP
  the 3rd level and add units into the ladder. I'm thinking the range should be
  2 units variation as a non-critical difference. Add in a rung for subject code
  outliers and untouched seeds, and blanks (where there is something useful to
  work with in the aggregate)."** All six rungs are built.
- **"I will want similar rungs for the other datasets"** — this ladder is the
  TEMPLATE for the CER, CSR and CCRR, not a CCR-only shape.
- **"40 to 60 is good"** — the first sitting's size. **Answered; go.**
- **"course records do carry CIP"** — correcting the session, which had looked
  on the minted M-ID records. It is at PROGRAM level.
- **"the MIDs were minted a while back and new procedures might find a better
  suited parent number and title"** — which reshaped the ladder into a loop.
- **"the MIDs are still experimental, so the stakes are low for mistakes. We
  want to use these process explorations to better configure decisions for
  faculty to respond to and curate where needed."** — the framing that makes
  the M-ID layer a rehearsal room rather than the product.

## THE NEXT CONCRETE STEP — nothing blocks it

1. Dispatch `.github/workflows/typesafe-smoke.yml` with `adjudicate=ccr`,
   `rung=title`, **`adjudicate_limit=50`** (he ruled 40–60). typesafe.ai is
   egress-blocked from the sandbox; the runner is the proxy.
2. Download the `jev-ccr` artifact.
3. Build a decision sheet with `kb/_decision_sheet_replies.py`. ⚠️ **`CHIPS_PLAN`
   is for PLAN items; a fold/keep sheet uses `CHIPS_FOLD`.** Pass `chips=` per
   item or per sheet — it works now.
4. Hand Sam the link, arm a `send_later` that reads `replies`.
5. His verdicts calibrate the title rung and earn the CCR an entry in `GATES`.

## WHAT THE CCR ADAPTER DOES, AND WHAT IT REFUSES

**27,580 Trust Cards → 1,237 questions.** Askable: `discipline_title_mismatch`
1,118 · `description_discipline_disagreement` 73 ·
`generic_title_concrete_discipline` 46.

⚠️ **`CCR_NEVER_ASK` — 6,621 rows, and re-adding one is the expensive mistake.**
`unit_anomaly` (4,179) is the question the battery measured Jev on at **AUC
0.281, below chance**; `top_discipline_disagreement` (1,189) and
`member_top_divergence` (1,253) ask Jev to gate on TOP, which Rule 7 forbids.
`CCR_RANK_ONLY` holds the two SUBJ4 tags (a re-mint is a curator's call).
`tests/jev_ccr_adapter.test.js` fails any re-addition.

⚠️ **The description rides EVERY rung's evidence.** `discipline_title_mismatch`
fires on token overlap, so *Three-Dimensional Design* under Art is flagged and
right; the real misses are only visible in the description (an *Ethics* row
under Philosophy carrying DEH-24's dental-hygiene prerequisites).

## SAM'S SIX RUNGS — AND TWO KINDS OF RUNG

| # | Rung | Population | Kind |
|---|---|---|---|
| 1 | Title | 1,237 | evidence |
| 2 | Course description | 1,237 + evidence | evidence |
| 3 | CIP | 1,237 + evidence | evidence |
| 4 | Units | **1,538** | population |
| 5 | Subject-code outliers | **435** | population |
| 6 | Blanks the aggregate can fill | **4,065** | population |
| 7 | The parent's title, then its number | waits on settled membership | — |

⚠️ **RUNGS 1-3 ARE ONE QUESTION WITH CUMULATIVE EVIDENCE; 4-6 ARE SEPARATE
QUESTIONS OVER SEPARATE POPULATIONS.** They neither accumulate nor escalate into
one another, and **each earns its own gate**. `CCR_RUNG_KIND` says which is
which — read rung 4 as "rung 3 plus units" and you ask the units question of
rows with no unit spread.

⚠️ **SAM'S 2-UNIT RULE IS WHY `unit_anomaly` LEFT `CCR_NEVER_ASK`.** Jev scored
**AUC 0.281** there, below chance, applying the general prior that different
hours mean different content. His rule overrules that prior, so the question is
askable — **with the threshold STATED IN IT**. Measured: **2,641 of 4,179 (63%)
clear mechanically**, 1,538 remain (up to 33 units apart). Re-adding it as a
bare "do these units differ?" reproduces 0.281 exactly.

⚠️ **THE AGGREGATE RUNG FILLS DESCRIPTIONS, FROM A DIFFERENT FILE.** Membership
records carry no description; 4,231 aggregatable rows are missing exactly that,
and **4,065 have member descriptions** in `unified_courses_member_desc.js`
(same key, loaded lazily — 47 MB). 271 agree word-for-word, 3,794 differ.

## THE FIRST SITTING RAN — AND IT FOUND A DIFFERENT QUESTION

Sam reviewed **26 of 50** title-rung items on 2026-09-22: 7 moves, 19 keeps —
8 ruled in the store, 18 agreed with the proposal below his mark. ⚠️ **The
store's last input is item 23 and he said 26**; his own count is the mark, and
the computed one is a floor. Run receipt:
`kb/receipts/jev_ccr_title_rung_2026-09-22_s282.json`.

- **Jev's ranking works. AUC 0.865** over the 26.
- **No usable gate came out of it.** Any threshold above **0.51** is error-free
  and recalls **2 of 7** moves — the highest keep sits at 0.51, the lowest move
  at **0.16** (*Race and Ethnic Relations*, which he moved to Ethnic Studies).
  The CCR stays out of `GATES` until a rung measures the question Sam is
  answering. Receipt:
  `kb/receipts/jev_ccr_title_rung_calibration_2026-09-22_s282.json`.
- **Every one of his 7 moves is a TAXONOMY call**, never a title-match error:
  Photography out of Art, Theater out of Music, Ethnic Studies out of Sociology,
  Office Technology out of IT, Diesel out of Automotive. Jev was asked whether a
  title matches its parent. Sam answered where the course belongs.

**Sam's reading of that pattern, verbatim (2026-09-22) — the open decision:**

> The pattern show real variability and uncertainty in the field--we somehow
> need to use this process to get everything properly nested OR just cross list
> the heck out of the misfits and live to tell another day:)

Measured the same hour across all 16,480 unified course rows, resolving member
subject codes through `kb/reference/subject_discipline_map.json`:

| | rows | share |
|---|---|---|
| resolve to one MQ discipline | 10,136 | 62% |
| resolve to **more than one** | **1,210** | **7.3%** |
| resolve to none (map leaves ambiguous codes unmapped) | 5,134 | 31% |

1,086 sit at two disciplines, 98 at three, 26 at four or five. The contested
population is a tail — small enough to look at every row. The fields already
exist and sit idle: `xdisc` on the unified rows (9 in use) and
`cross_listing_group` on the CCR seed.

The 1,210 holds **both** kinds. Introduction to Photojournalism resolves to
Journalism and Photography, Digital Forensics Fundamentals to CIS and
Administration of Justice, Medical Terminology to HIT and Nursing — dual homes.
Hydraulics (Fluid Power) sits under Agriculture with members reading Automotive
Technology and Fire Technology — a mis-nest. **The misfit rung's job is to sort
one from the other**, which is a question a faculty member answers in a glance.

⚠️ **The session's recommendation is on the table and NOT ruled**: cross-list,
keep one discipline primary for counting (the same shape as Rule 7's TOP ruling
— gate identity, keep display), because a cross-list is reversible and a re-nest
is a re-mint. Sam has not answered. Captured verbatim in
`CPLBrain/03-professional/braindumps/braindump-2026-09-22-1730-nest-it-or-cross-list-the-misfits.md`.

## THE GATE RULE — READ BEFORE ANY SCORING

⚠️ **0.85 BELONGS TO THE CCRR AND ITS ONE QUESTION.** `GATES` maps reference →
measured gate and only the ccrr has one. A reference without one runs as a
**calibration sitting**: every row `uncalibrated`, nothing proposed, and **no
second look spent** (a skeptic refutes a proposal; a calibration run makes
none). Full reasoning:
[`methodology-a-threshold-belongs-to-the-question-that-measured-it`](kb-notes/methodology-a-threshold-belongs-to-the-question-that-measured-it.md).

⚠️ **Score everything AT OR BELOW THE HIGH-WATER MARK (Sam, 2026-09-22):**
*"the last item showing some sort of input is an indicator that everything prior
to it is good to go as is."* The title-rung sheet stored 8 reply documents and
he had ruled on **26** — he touched only what he disagreed with. Scoring the 8
would have thrown away 18 real judgments. An untouched item BELOW the mark is an
agreement with the proposal and counts; an item above it was never reached and
does not. The mark rides the paste line and the `replies/done` record's
`through` field; `tests/decision_sheet_high_water.test.js` guards it, including
the edge that **Complete destroys the mark unless it is read first**. Doctrine:
[`decision_sheets`](reference/decision_sheets.md) § *Reading the replies*.
(The ladder sheet's own 10/10 `by: "default"` still scores nothing — no input
anywhere on it means no mark.)

## Carryover

| Item | State |
|---|---|
| **ESL merging procedure** | **NEEDS A DECISION SHEET, and he asked for it by name (2026-09-21):** *"we have an ESL merging procedure I'd like to adjust but I will want you to give me in the next session a decision sheet to manage the adjustments to what we currently use or have queued to use."* Start from [`lanes/esl-packaging`](reference/lanes/esl-packaging.md) — cover what is in use AND what is queued |
| First sitting size | **DONE.** Ran at 50; Sam reviewed 26 |
| **Nest or cross-list the misfits** | **AWAITING SAM'S RULING** — his question, the 7.3% measurement and the session's recommendation are in the section above. Everything downstream of the misfit rung waits on it |
| Subject/Discipline pickers | **SHIPPED** on the title-rung sheet — one shared `<datalist>` per list (320 subject codes, 248 MQ disciplines), pre-filled with where the course sits now. `tests/decision_sheet_pickers.test.js` |
| Rungs for the other centers | Sam wants the same ladder shape for CER, CSR and CCRR |
| CCR decisions table | Ladder item 4 (adopted): every center needs one before its first sheet, routed through Governance under Rule 10(a3). **None exists for the CCR** |
| Rung 7 (the parent's title + number) | Designed, not coded. Waits on settled membership |
| Rungs 2-6 | Each needs its own gate; rung 1 goes first |
| `level` re-test | Ladder item 7: ONE pre-registered re-test on a batch it did not pick. Never a re-analysis of the 26 |
| CER/CSR scanners | Ladder item 8: last ran **2026-07-10**, 73 days stale. Re-run before spending a call |
| `cpl_memory` rows from S281 | **STILL STAGED** — `kb/receipts/cpl_memory_2026-09-21_s281.sql`; the guard blocks `execute_sql` writes |
| **Cross-list KIN / PE / ATHL** | **ANALYSIS DONE** — [`reference-kin-pe-athl-identifier-fallout`](kb-notes/reference-kin-pe-athl-identifier-fallout.md). The identifier cost of untangling or cross-listing is **two rows** (`KIN 100`, `PH 107`), neither athletic; CCN exposure is **zero**. ⚠️ And **no row carries `disc == "Physical Education"`** — all 1,177 read Kinesiology, so item 4's fold already happened in the rows and only the subject-map entry remains. MQ and repeatability are the real constraints, and both sit outside what this measured |
| **Art / Photography / Digital Media guidance** | His note on item 8: *"I believe folks at the colleges intermingle these without clear guidance"* |
| **Business vs Noncredit / Vocational Small Business** | His note on item 12, flagged follow-up |
| Sierra: four defects, Chaffey false negative | untouched |
| SkyView pinch failure | inherited, `s278-fable-skyview-pinch-registry` |

## Read in order

This file · [`lanes/common-cr-reference`](reference/lanes/common-cr-reference.md) ·
`docs/common_cr_reference_lessons.md` (2026-09-21) · the two new KB notes ·
[`decision_sheets`](reference/decision_sheets.md).

## Things that worked

- **Running the thing beat reasoning about it, three times.** The ranking rule
  failed when measured; the gate bug appeared when the runner was wired (the
  adapter was passing 15/15 while carrying it); the stale dependency map
  surfaced when the pre-push gate ran.
- **`bash scripts/check_generated.sh` after `git add`, every push.** It existed
  since S242 and nothing named it — that cost three red runs across S281–S282.
  `CLAUDE.md` names it now.
- **Believing Sam over the measurement.** He said course records carry CIP; the
  session had looked in the wrong place and reported it missing. He was right,
  and the right place was better than the published crosswalk by 3x.

## Safety patterns to honor

- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 7 (TOP never
  gates; re-mints under the playbook) · Rule 10 (fresh read, INSERT-only,
  receipt).
- Jev SUGGESTS, never merges, and writes nothing.
- typesafe.ai is egress-blocked — dispatch the runner.
- A `check_suite.completed` wake names a SUPERSEDED head; re-read
  `get_check_runs` on the current one.
- An item with no reply has NO verdict; under opt-out an untouched item is
  `by: "default"` and is never his.

---

*Greetings, you are Sky**Rung** (Session 283), see Sky**Ledger**'s handoff —
`docs/session_283_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE
line, no investigation.*
