# ESL re-level under Sam's per-ladder sets — 2026-08-24

**DRY-RUN — read-only. No curation write performed.**

Sam's PER-LADDER level sets, authored 2026-08-24 and stored as data at kb/reference/esl_level_sets.json. Supersedes his own absolute bands 0-2/3-5/6-10 from earlier the same day, which superseded the P-4 pinning.

Resolution: A level WORD on the identity title wins; otherwise each member votes its own college's ladder reading and the identity takes the MODE. A tie is reported, never resolved by picking the safer band.

## Does the ladder derivation reproduce Session 188's measurement?

**NO — buckets disagree; see below.**
Rule: max rung observed over the whole ESL corpus, >= 2 distinct rungs, length 2-9; a 2-rung read abstains because Sam's table has no L=2 row.

Colleges with a readable ladder: **92**. ⚠️ A further **0** read as 2-rung ladders, which Sam's table does not cover — they abstain, and whether to extend the table to L=2 is his call.

| Ladder | This run | Session 188 | Agrees |
|---|---:|---:|:--:|
| 3 | 21 | 20 | ⚠️ |
| 4 | 22 | 22 | ✅ |
| 5 | 7 | 7 | ✅ |
| 6 | 16 | 16 | ✅ |
| 7 | 3 | 3 | ✅ |
| 8 | 1 | 1 | ✅ |
| 9 | 1 | 1 | ✅ |

## Effect

- re-levels proposed: **169**
- of which REVERT one of the 32 already applied: **30**
- unchanged: 1119 · undecided: 521 · purpose carve-outs skipped: 181
- against the colleges' own catalogs: agrees 39, disagrees 44, silent 86

### Moves

| From → to | n |
|---|---:|
| Beginning -> Intermediate | 84 |
| Intermediate -> Advanced | 62 |
| Beginning -> Advanced | 20 |
| Intermediate -> Beginning | 3 |

### Why an identity went undecided

| Reason | n |
|---|---:|
| no-ladder-signal | 511 |
| tie | 10 |

### What this does to the 32 already applied

| id | title | now | would become | reverts | catalog |
|---|---|---|---|:--:|---|
| `ESOL M1046` | Adv Listening/Speaking 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M1217` | College ESL 5: Listening and Speaking | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M1220` | College ESL 5: Reading and Vocabulary | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M1211` | College ESL 5: Writing and Grammar | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M1047` | Integrated ESL Skills, Level 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M9063` | English as a Second Language Level 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M9064` | ESL Grammar 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M9066` | ESL - Level 5 | Intermediate | Advanced | ↩️ | — |
| `ESOL M9067` | Reading Skills for ESL Students 5 | Intermediate | Advanced | ↩️ | — |
| `ESOL M9061` | English as a Second Language Level 5 Condens | Intermediate | Advanced | ↩️ | Intermediate |
| `ESLN M9017` | English as a Second Language 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10EO` | Adv Reading/Vocabulary 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10EN` | Adv Writing and Grammar 5 | Intermediate | Advanced | ↩️ | — |
| `ESOL M10NX` | College English as a Second Language 5: Read | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10NS` | College English as a Second Language 5: Writ | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10EP` | ESL Core Course Level 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10EQ` | ESL Listening/Speaking, Level 5 | Intermediate | Advanced | ↩️ | — |
| `ESOL M10ER` | ESL Reading/Writing, Level 5 | Intermediate | Advanced | ↩️ | — |
| `ESOL M10ES` | Grammar Level 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10VB` | Grammar 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10ET` | Grammar, Writing and Reading Level 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10XJ` | Listening & Speaking 5 | Intermediate | Advanced | ↩️ | — |
| `ESOL M10PQ` | Reading & Composition 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10EU` | Reading Level 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M10EV` | Writing Level 5 | Intermediate | Advanced | ↩️ | — |
| `ESOL M90IT` | English as a Second Language College Readine | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M90IS` | ESL Level 5 Bridge for College and Job Succe | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M90IW` | ESL Reading and Writing 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M90IV` | ESL Vocabulary and Pronunciation 5 | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M91CA` | ESL - Comprehensive 5 | Intermediate | Advanced | ↩️ | — |

## ⚠️ How strong is this evidence?

A ladder vote can rest on a SINGLE member course, and the weakest tier of the level reader is a bare trailing integer ('Academic Writing 3'), which may be a sequence number rather than a rung. Both are reported per group because they decide whether a proposal is actionable, not merely correct.

| Group | n | decided by ONE member | catalog agrees | disagrees | silent |
|---|---:|---:|---:|---:|---:|
| Reverts one of the applied 32 | 30 | 19 | 0 | 22 | 8 |
| Other proposals | 139 | 93 | 39 | 22 | 78 |

⚠️ **The reverts move AWAY from the colleges' own catalogs, one-directionally.** Every one of the 22 reverts whose catalog speaks disagrees with the revert — the catalogs say the band these rows sit at TODAY. By Sam's own principle a canonical standard scored against local records is blast radius, not a verdict; but that principle argues for holding a ruling against noisy local variance, and here the local records are unanimous and point the other way.

**Recommendation: do NOT roll back the applied 32 on this evidence.** The other 139 proposals run 39 agree to 22 disagree and are the better candidates — but work the multi-member ones first.

⚠️ **Nothing here is applied.** The apply needs Sam's go.
