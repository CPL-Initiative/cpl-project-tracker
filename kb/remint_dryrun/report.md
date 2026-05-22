# CourseControlNumber re-mint — DRY-RUN report

**Measurement only. Nothing was written to the machine layers or Supabase.**
Artifacts: `kb/remint_dryrun/alias_map.json` (this run) + this report.
Generator: `kb/_remint_dryrun.py`.

## What this measures
Each old minted M-ID is mapped to its fate under a CourseControlNumber-grained
re-mint, read off its **normalized title** (the grouping key the mint actually
uses) in the richer raw list `kb/reference/coci_course_list.xlsx` (141,738 rows).
A title's rows that still lack an official C-ID/CCN stay **minted** (renamed /
renumbered); rows that now carry an official C-ID/CCN **promote** out; a cluster
that yields more than one distinct new identity is a **1:many split**.

## Distribution (all 72,481 old M-IDs)
| class | count | meaning |
|---|---|---|
| rename | 70,398 | 1:1 — stays minted, gets a new `SUBJ4 M####` key |
| vanish_to_official | 0 | all members promote to ONE official C-ID/CCN; M-ID dissolves |
| split | 2,083 | **1:many — needs review**; minted remnant + promoted official(s), or >1 official |
| orphan | 0 | title absent from the new list |

Old M-IDs: 14,754 corroborated + 57,727 singletons.
New minted identities: 72,481
(noncredit→9xxx: 10,183; credit→1xxx: 62,298).

## The 6 curation entries (decision-critical)
| key | kind | fate | new id(s) | merge_into |
|---|---|---|---|---|
| `M-ID AB 100` | M-ID | rename | `AB M10001` | merge_into `UC-CUR-MPG029OM` (M-ID? False) |
| `M-ID ABDY 100` | M-ID | rename | `ABDY M10001` | merge_into `UC-CUR-MPG029OM` (M-ID? False) |
| `M-ID ABDY 106` | M-ID | rename | `ABDY M10002` | merge_into `UC-CUR-MPG029OM` (M-ID? False) |
| `M-ID BSICSKL 100` | M-ID | rename | `BSIC M90001` | — |
| `M-ID EGDTEK 100` | M-ID | rename | `EGDT M10001` | — |
| `UC-CUR-MPG029OM` | cluster | not an M-ID — key is stable, not re-keyed | — | — |

All five curated **M-ID** keys map **1:1 (rename)** — none split — and every
`merge_into` points at the curator-minted `UC-CUR-MPG029OM` cluster, which is
**not** an M-ID, so no `merge_into` value needs rewriting. The re-key of the
human layer is therefore: rewrite the 5 curation **keys** (git + Supabase),
leave all `merge_into` values untouched.

## ⚠ Open decision — the credit numbering bucket
Banding `credit_status` is clean for **noncredit** (→ `9xxx`). But **credit**
minted identities (62,298 of them) do NOT fit a
CCN-style 4-digit-per-subject code: a `SUBJ C####` allows only **999** per
(subject, band), and our minted space blows past that.

- max identities in one (subject, band) bucket — **ALL**: 1,928
- max — **corroborated-only** (drop singletons): 496
- (subject,band) buckets over 999 — ALL: 6 · corroborated-only: 0
- top buckets: ART 1=1928, DANC 1=1291, MUS 1=1196, ENGL 1=1191, KIN 1=1179, MATH 1=1087, CIS 1=985, AUTO 1=847, ESL 1=819, HIST 1=750

This run used an overflow-safe **4-digit** sequence
(`SUBJ4 M1000…`), which is wider than CCN's 4 digits
— so the codes are valid + unique but no longer 4-digit-CCN-shaped. **Options to
confirm before apply:** (a) accept the wider non-4-digit minted number (still
unmistakably ours via the `M`); (b) give only the 14,754
**corroborated** M-IDs a formal `M####` and keep singletons on a lighter key;
(c) drop the per-subject band entirely for credit (only noncredit carries the
`9` band) and sequence credit globally per subject.

## Splits to review (first 25 of 2,083)
| old M-ID | title | new identities |
|---|---|---|
| `M-ID AAD 112` | Introduction to Digital Painting | `DART M10056`, `C-ID:ARTS 250` |
| `M-ID ABE 112` | American Literature | `ABE M90014`, `C-ID:ENGL 130`, `C-ID:ENGL 135` |
| `M-ID ABE 146` | Microsoft Word I | `BT M10010`, `C-ID:BSOT 111 X` |
| `M-ID ABT 112` | Introduction to Agriculture Business | `ABT M10014`, `C-ID:AG-AB 104`, `C-ID:AG-AS 104`, `C-ID:AG-PS 104 104` |
| `M-ID ABT 124` | Plant Science | `AGPS M10011`, `C-ID:AG-EH 108 108 L`, `C-ID:AG-PS 104 104`, `C-ID:AG-PS 106 106 L` |
| `M-ID ABT 126` | Soil Science | `AG M10103`, `C-ID:AG-PS 128 128 L` |
| `M-ID ACC 116` | Principles of Accounting I | `ACC M10010`, `C-ID:ACCT 110` |
| `M-ID ACC 118` | Principles of Accounting II | `ACC M10011`, `C-ID:ACCT 120` |
| `M-ID ACCT 190` | Financial Accounting | `ACCT M10121`, `C-ID:ACCT 110` |
| `M-ID ACCT 192` | Financial Accounting - Honors | `ACCT M10125`, `C-ID:ACCT 110` |
| `M-ID ACCT 194` | Financial Accounting I | `ACCT M10126`, `C-ID:ACCT 110` |
| `M-ID ACCT 218` | Honors Financial Accounting | `ACCT M10146`, `C-ID:ACCT 110` |
| `M-ID ACCT 258` | Managerial Accounting | `ACCT M10206`, `C-ID:ACCT 120` |
| `M-ID ACCT 260` | Managerial Accounting - Honors | `ACCT M10207`, `C-ID:ACCT 120` |
| `M-ID ACCT 274` | Principles of Accounting-Financial | `VOC M90109`, `C-ID:ACCT 110` |
| `M-ID ACCT 276` | Principles of Accounting-Managerial | `ACCT M10228`, `C-ID:ACCT 120` |
| `M-ID ACCTG 122` | Introductory Accounting I | `ACCT M10203`, `C-ID:ACCT 110` |
| `M-ID ACCTG 124` | Introductory Accounting II | `ACCT M10204`, `C-ID:ACCT 110`, `C-ID:ACCT 120` |
| `M-ID ACTG 106` | Financial Accounting II | `ACTG M10019`, `C-ID:ACCT 110` |
| `M-ID AD 100` | Case Management and Documentation | `ADDI M10008`, `C-ID:ADS 170 X` |
| `M-ID ADDICST 118` | Understanding Addiction and Counseling | `ADDI M10021`, `C-ID:PH 103` |
| `M-ID ADED 100` | First Aid, CPR, and AED | `EMT M10040`, `C-ID:KIN 101` |
| `M-ID ADJ 104` | Basic Criminal Investigation | `ADJ M10003`, `C-ID:AJ 140` |
| `M-ID ADJ 114` | Concepts of Criminal Law | `AJ M10058`, `C-ID:AJ 120` |
| `M-ID ADJ 118` | Crime Scene Investigation | `LE M10017`, `C-ID:AJ 150` |

## How the apply step will treat each layer (per your instruction)
- **Machine layers** (memberships, `coci_articulations`, minted catalog /
  clusters / singletons, lazy artifacts) → **regenerated** under the new keys.
- **Human curation layer** (`coci_curation.json` + live Supabase `kb_curation`)
  → **aliased**: rewrite `course_id` keys (and any `merge_into` that is an M-ID
  — here, none) via this map. Live Supabase row count must be verified to match
  git's 6 before applying.
