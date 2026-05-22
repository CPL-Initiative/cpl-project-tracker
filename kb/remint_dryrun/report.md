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
(16,308 corroborated → all-digit
`M####`; 56,173 stand-alone → `M<band><d><LL>`.
noncredit→9xxx: 10,183; credit→1xxx:
62,298).

## The 6 curation entries (decision-critical)
| key | kind | fate | new id(s) | merge_into |
|---|---|---|---|---|
| `M-ID AB 100` | M-ID | rename | `AB M1001` | merge_into `UC-CUR-MPG029OM` (M-ID? False) |
| `M-ID ABDY 100` | M-ID | rename | `ABDY M1001` | merge_into `UC-CUR-MPG029OM` (M-ID? False) |
| `M-ID ABDY 106` | M-ID | rename | `ABDY M10AA` | merge_into `UC-CUR-MPG029OM` (M-ID? False) |
| `M-ID BSICSKL 100` | M-ID | rename | `BSIC M9001` | — |
| `M-ID EGDTEK 100` | M-ID | rename | `EGDT M1001` | — |
| `UC-CUR-MPG029OM` | cluster | not an M-ID — key is stable, not re-keyed | — | — |

All five curated **M-ID** keys map **1:1 (rename)** — none split — and every
`merge_into` points at the curator-minted `UC-CUR-MPG029OM` cluster, which is
**not** an M-ID, so no `merge_into` value needs rewriting. The re-key of the
human layer is therefore: rewrite the 5 curation **keys** (git + Supabase),
leave all `merge_into` values untouched.

## Numbering scheme (option 1, confirmed)
CCN's `SUBJ C####` is **4 digits**: the leading digit is the band (level/credit
meaning), the next 3 are the within-(subject,band) sequence. Our minted tier
mirrors that:

- **Corroborated** M-IDs (≥2 colleges) → clean 4-digit `SUBJ M<band><seq:03d>`
  — leading `9` = noncredit, `1` = credit; 3-digit sequence. Max per
  (subject,band) = **496** (< 1,000),
  so it fits with room to spare. Buckets over 999: none.
  Top buckets: ART 1=496, ENGL 1=350, KIN 1=335, DANC 1=329, MATH 1=306, MUS 1=304, CIS 1=270, ESL 1=268, FIRE 1=222, MUSI 1=209.
- **Stand-alones** (1 college) → `SUBJ M<band><d><LL>` — band + 1 sequence digit
  + **2 letters**. Same 4-char width, but the trailing letters expand capacity to
  **6,760** per (subject,band) vs a
  max stand-alone bucket of **1,432**
  (~4.7× headroom; buckets over capacity: none).
  The 2 trailing letters are the tell — corroborated codes are all-digit. If a
  second college later joins the title it promotes to a corroborated `M####`.

`9` (noncredit) is the only asserted band; `1` (credit) is a non-semantic bucket
(no transferability claim — the `M` already disclaims CCN equivalence).

## Splits to review (first 25 of 2,083)
| old M-ID | title | new identities |
|---|---|---|
| `M-ID AAD 112` | Introduction to Digital Painting | `DART M1005`, `C-ID:ARTS 250` |
| `M-ID ABE 112` | American Literature | `ABE M9005`, `C-ID:ENGL 130`, `C-ID:ENGL 135` |
| `M-ID ABE 146` | Microsoft Word I | `BT M1005`, `C-ID:BSOT 111 X` |
| `M-ID ABT 112` | Introduction to Agriculture Business | `ABT M1002`, `C-ID:AG-AB 104`, `C-ID:AG-AS 104`, `C-ID:AG-PS 104 104` |
| `M-ID ABT 124` | Plant Science | `AGPS M1002`, `C-ID:AG-EH 108 108 L`, `C-ID:AG-PS 104 104`, `C-ID:AG-PS 106 106 L` |
| `M-ID ABT 126` | Soil Science | `AG M1022`, `C-ID:AG-PS 128 128 L` |
| `M-ID ACC 116` | Principles of Accounting I | `ACC M1004`, `C-ID:ACCT 110` |
| `M-ID ACC 118` | Principles of Accounting II | `ACC M1005`, `C-ID:ACCT 120` |
| `M-ID ACCT 190` | Financial Accounting | `ACCT M1047`, `C-ID:ACCT 110` |
| `M-ID ACCT 192` | Financial Accounting - Honors | `ACCT M1048`, `C-ID:ACCT 110` |
| `M-ID ACCT 194` | Financial Accounting I | `ACCT M1049`, `C-ID:ACCT 110` |
| `M-ID ACCT 218` | Honors Financial Accounting | `ACCT M1060`, `C-ID:ACCT 110` |
| `M-ID ACCT 258` | Managerial Accounting | `ACCT M1082`, `C-ID:ACCT 120` |
| `M-ID ACCT 260` | Managerial Accounting - Honors | `ACCT M1083`, `C-ID:ACCT 120` |
| `M-ID ACCT 274` | Principles of Accounting-Financial | `VOC M9008`, `C-ID:ACCT 110` |
| `M-ID ACCT 276` | Principles of Accounting-Managerial | `ACCT M1092`, `C-ID:ACCT 120` |
| `M-ID ACCTG 122` | Introductory Accounting I | `ACCT M1080`, `C-ID:ACCT 110` |
| `M-ID ACCTG 124` | Introductory Accounting II | `ACCT M1081`, `C-ID:ACCT 110`, `C-ID:ACCT 120` |
| `M-ID ACTG 106` | Financial Accounting II | `ACTG M1003`, `C-ID:ACCT 110` |
| `M-ID AD 100` | Case Management and Documentation | `ADDI M1003`, `C-ID:ADS 170 X` |
| `M-ID ADDICST 118` | Understanding Addiction and Counseling | `ADDI M1011`, `C-ID:PH 103` |
| `M-ID ADED 100` | First Aid, CPR, and AED | `EMT M1015`, `C-ID:KIN 101` |
| `M-ID ADJ 104` | Basic Criminal Investigation | `ADJ M1001`, `C-ID:AJ 140` |
| `M-ID ADJ 114` | Concepts of Criminal Law | `AJ M1010`, `C-ID:AJ 120` |
| `M-ID ADJ 118` | Crime Scene Investigation | `LE M1008`, `C-ID:AJ 150` |

## How the apply step will treat each layer (per your instruction)
- **Machine layers** (memberships, `coci_articulations`, minted catalog /
  clusters / singletons, lazy artifacts) → **regenerated** under the new keys.
- **Human curation layer** (`coci_curation.json` + live Supabase `kb_curation`)
  → **aliased**: rewrite `course_id` keys (and any `merge_into` that is an M-ID
  — here, none) via this map. Live Supabase row count must be verified to match
  git's 6 before applying.
