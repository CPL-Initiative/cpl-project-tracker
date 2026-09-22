---
title: Session 283 handoff — the CCR is wired, the rungs are built, and one sitting stands between here and a calibrated gate
date: 2026-09-21
session: 282 (SkyLedger)
tags: [handoff, jev, ccr, cr-reference, calibration, decision-sheets]
status: current
---

# You are Session 283

Your moniker is **SkyRung** — S282 (SkyLedger) built the ladder sheet Sam had
never seen, took his ruling on item 1, wired the CCR onto the Jev module, and
built his title→CIP→description rungs. What is left is spending one sitting.

## ✅ WHAT SHIPPED — all merged to `main`

| PR | What |
|---|---|
| [#1648](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1648) | The ladder sheet + the CCR Trust Card adapter + the chips argument that was never real (`053847e`) |
| [#1649](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1649) | The progressive rungs, and CIP from what colleges actually assigned (`aff3646`) |
| [#1650](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1650) | A gate belongs to the reference that measured it (`0466295`) |
| [CPLBrain#166](https://github.com/samueltlee/CPLBrain/pull/166) | Sam's framing, captured verbatim |

**Ladder sheet:** https://claude.ai/artifact/BkxGoSkJUE22BWCGcw9pwB
**Status visual:** https://claude.ai/artifact/AHFBSetu87Hi6RqkA33dfU

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

## THE GATE RULE — READ BEFORE ANY SCORING

⚠️ **0.85 BELONGS TO THE CCRR AND ITS ONE QUESTION.** `GATES` maps reference →
measured gate and only the ccrr has one. A reference without one runs as a
**calibration sitting**: every row `uncalibrated`, nothing proposed, and **no
second look spent** (a skeptic refutes a proposal; a calibration run makes
none). Full reasoning:
[`methodology-a-threshold-belongs-to-the-question-that-measured-it`](kb-notes/methodology-a-threshold-belongs-to-the-question-that-measured-it.md).

⚠️ **Score only `by: "sam"` rows.** The ladder sheet came back 10/10
`by: "default"` and is worth nothing as calibration.

## Carryover

| Item | State |
|---|---|
| **ESL merging procedure** | **NEEDS A DECISION SHEET, and he asked for it by name (2026-09-21):** *"we have an ESL merging procedure I'd like to adjust but I will want you to give me in the next session a decision sheet to manage the adjustments to what we currently use or have queued to use."* Start from [`lanes/esl-packaging`](reference/lanes/esl-packaging.md) — cover what is in use AND what is queued |
| First sitting size | **ANSWERED: 40–60.** Dispatch at 50 |
| Rungs for the other centers | Sam wants the same ladder shape for CER, CSR and CCRR |
| CCR decisions table | Ladder item 4 (adopted): every center needs one before its first sheet, routed through Governance under Rule 10(a3). **None exists for the CCR** |
| Rung 7 (the parent's title + number) | Designed, not coded. Waits on settled membership |
| Rungs 2-6 | Each needs its own gate; rung 1 goes first |
| `level` re-test | Ladder item 7: ONE pre-registered re-test on a batch it did not pick. Never a re-analysis of the 26 |
| CER/CSR scanners | Ladder item 8: last ran **2026-07-10**, 73 days stale. Re-run before spending a call |
| `cpl_memory` rows from S281 | **STILL STAGED** — `kb/receipts/cpl_memory_2026-09-21_s281.sql`; the guard blocks `execute_sql` writes |
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
