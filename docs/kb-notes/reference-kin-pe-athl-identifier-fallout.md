# Untangling KIN, PE and Athletics costs two identifiers

Sam asked for this on 2026-09-22, in his note on item 13 of the CCR title-rung
sheet:

> This makes me think we should cross list all KIN, PE, ATHL courses (SC: is
> ATHL a canonicalized Subject or MQ Discipline?) Let's do a follow up analysis
> of CID and CCN to see the fallout of cross listing or untangling KIN, PE,
> Athletic from Non-Athletic courses.

It is the largest single population in the cross-list work — Kinesiology with
Physical Education is the most common discipline pair in the whole dataset — so
it ran before the alias in item 4 of the cross-list sheet lands.

**The answer: two rows.** Approved identifiers barely reach this space, so the
identifier side constrains nothing.

## What the space holds

1,178 rows whose recorded discipline is Kinesiology or Physical Education, or
whose M-ID prefix is one of KIN, PE, ATHL, KINA, KINS, KINE, EXSC, PEAC, ATH.

| | count |
|---|---|
| M-ID | 1,175 |
| C-ID | 3 |
| prefix KINE | 838 |
| prefix ATHL | 328 |
| reads as intercollegiate or athletic by title | 315 |
| everything else (activity, theory, fitness) | 863 |

**ATHL is a canonical Subject code, and its MQ discipline is Kinesiology.** It
is not itself a discipline.

## The Physical Education split is in the subject map, never in the rows

⚠️ **Zero rows carry `disc == "Physical Education"`.** All 1,177 disciplined
rows read Kinesiology. The pairing that makes Kinesiology-with-Physical-Education
the dataset's commonest is entirely in `kb/reference/subject_discipline_map.json`,
where the local code `PE` maps to Physical Education and appears on 234 rows.

So the fold item 4 proposes has already happened where it counts. What remains is
the map entry, and a map entry is cheap to change: nothing downstream reads the
discipline off a local code once a row carries `disc`.

## Identifier exposure

**C-ID: two rows.**

| id | title | members |
|---|---|---|
| `KIN 100` | Introduction to Kinesiology | 107 |
| `PH 107` | Stress Management and Health | 37 |

Neither is an athletic course, so an athletic-from-non-athletic untangle touches
neither.

The ASCCC has approved four descriptors reaching this space at all — Human
Anatomy with Lab, Human Physiology with Lab, Introduction to Kinesiology, and
First Aid, CPR and AED. Three of the four are science or health courses that sit
in Kinesiology only by staffing.

**CCN: zero.** The Common Course Numbering set is 58 courses across fourteen
general-education subjects — ANTH, ARTH, ASTR, BIOL, CDEV, COMM, ECON, ENGL,
HIST, MATH, POLS, PSYC, SOCI, STAT. Kinesiology and Physical Education appear
nowhere in it.

⚠️ **A substring search reports six CCN hits, and all six are false.** `KIN`
matches inside *Introduction to Public SpeaKINg*. Match on the `subject` field
rather than on a serialized record — the same class of error as reading a
discipline off a two-letter code.

## What this settles, and what it does not

Settled: **the identifier side is not a constraint here.** Whether the MAP team
cross-lists KIN, PE and ATHL, or untangles athletic from non-athletic, at most
two approved identifiers are in scope and neither is athletic. A re-mint across
this space would be an M-ID operation start to finish, under the Rule 7 playbook.

Not settled, and outside what this measured:

- **Minimum qualifications.** The MQ list decides who may teach, and separating
  athletics from activity instruction could change which faculty are qualified
  for which section. That is a district and academic-senate question.
- **Repeatability and apportionment.** Activity and intercollegiate courses sit
  under their own Title 5 rules. Nothing here touched them.
- **Whether the untangle is worth doing.** This says only what it costs in
  identifiers.

## Method

`unified_courses_data.js` for the rows, `kb/reference/cid_descriptors.json` for
the descriptors, `kb/reference/ccn_courses.json` for the CCN set. Measured
2026-09-22. Every count here is a direct read; re-run them before acting, because
the M-ID layer is staging and the numbers move.
