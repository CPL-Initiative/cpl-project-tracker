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

- re-levels proposed: **129**
- of which REVERT one of the 32 already applied: **19**
- unchanged: 1117 · undecided: 563 · purpose carve-outs skipped: 181
- against the colleges' own catalogs: agrees 25, disagrees 40, silent 64

### Moves

| From → to | n |
|---|---:|
| Beginning -> Intermediate | 50 |
| Intermediate -> Advanced | 40 |
| Intermediate -> Beginning | 33 |
| Beginning -> Advanced | 3 |
| Advanced -> Intermediate | 3 |

### Why an identity went undecided

| Reason | n |
|---|---:|
| no-ladder-signal | 511 |
| tie | 52 |

### What this does to the 32 already applied

| id | title | now | would become | reverts | catalog |
|---|---|---|---|:--:|---|
| `ESOL M1217` | College ESL 5: Listening and Speaking | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M1220` | College ESL 5: Reading and Vocabulary | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M1211` | College ESL 5: Writing and Grammar | Intermediate | Advanced | ↩️ | Intermediate |
| `ESOL M1047` | Integrated ESL Skills, Level 5 | Intermediate | Advanced | ↩️ | Intermediate |
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

## ⚠️ How strong is this evidence?

A ladder vote can rest on a SINGLE member course, and the weakest tier of the level reader is a bare trailing integer ('Academic Writing 3'), which may be a sequence number rather than a rung. Both are reported per group because they decide whether a proposal is actionable, not merely correct.

| Group | n | decided by ONE member | catalog agrees | disagrees | silent |
|---|---:|---:|---:|---:|---:|
| Reverts one of the applied 32 | 19 | 15 | 0 | 14 | 5 |
| Other proposals | 110 | 85 | 25 | 26 | 59 |

⚠️ **The reverts move AWAY from the colleges' own catalogs, one-directionally.** Every one of the 14 reverts whose catalog speaks disagrees with the revert — the catalogs say the band these rows sit at TODAY. By Sam's own principle a canonical standard scored against local records is blast radius, not a verdict; but that principle argues for holding a ruling against noisy local variance, and here the local records are unanimous and point the other way.

**Recommendation: do NOT roll back the applied 32 on this evidence.** The other 110 proposals run 25 agree to 26 disagree and are the better candidates — but work the multi-member ones first.

⚠️ **Nothing here is applied.** The apply needs Sam's go.
