---
title: Local course ↔ credit-recommendation alignment — workstream lessons
created: 2026-08-13
updated: 2026-08-13
tags: [lessons, sierra, alignment, articulation, coci, adoption, welding, faculty]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/kb-notes/methodology-two-signals-for-a-judgment-proposal]]"
  - "[[docs/kb-notes/methodology-a-summary-field-can-be-a-retrieval-gate]]"
artifacts:
  - kb/reference/coci_course_list.xlsx (141k courses — the only per-course title source)
  - kb/coci_articulations.json (peer articulations with exact course numbers + titles)
  - statewide_prescriptive.js (M-ID leverage layer — answers a NARROWER question)
  - chatbox/build_coci_offerings.py (TITLES_TEXT_CAP = 900, SAMPLE_PER_TOP = 8)
---

# Local course ↔ credit-recommendation alignment

## The ask (Sam, 2026-08-13)

> "I want to make sure you are able to align local courses to CRs from other
> colleges or statewides being considered for adoption. If Sierra is answering for
> Cerritos College, I would want her to recommend the most aligned Cerritos welding
> courses to be articulated so the faculty don't have to guess, and have a link or
> access to the other college articulations for this same welding certificate."

Two deliverables in one sentence, and they need **different data**:

1. *"the most aligned Cerritos courses"* — a **proposal**, computed.
2. *"the other college articulations for this same certificate"* — a **fact**, looked up.

## 2026-08-13 — SkyBridge (Session 148), design pass: proving it offline

> **Superseded by the section below** — this records the investigation and the
> design decisions, which still hold. The three gaps it lists were all closed the
> same day; the build is live as cpl-chat v41.

### (a) What was learned

**It works, and the acceptance case is unambiguous.** Test credential:
`ASME BPVC Section IX — FCAW Welder Qualification`, whose two statewide recs are
*Introduction to Flux Cored Arc Welding (FCAW)* and *Advanced Flux Cored Arc
Welding (FCAW)*. Ranking Cerritos's 121 courses under TOP `0956*` by title
alignment:

| Credit rec | Best Cerritos course | Score | Runner-up |
|---|---|---|---|
| Introduction to FCAW | **WELD 214L** — Flux Cored Arc Welding (FCAW) Certification Laboratory (2u) | 0.671 | 0.288 |
| Advanced FCAW | **WELD 214L** — same | 0.715 | 0.401 |

One course, top of both, **2–3× clear** of the runner-up. And peer precedent
corroborates it independently: Barstow articulated `WELD 54B — Flux Cored Arc
Welding (FCAW)`, a near-identical title. The proposal is *defensible*, not asserted.

**⭐ TWO SIGNALS, AND NEITHER IS SUFFICIENT ALONE.** This is the finding that
would have been got wrong by reasoning instead of running. Santa Ana's actual
articulations for this same certificate:

- `WELD 240 — Structural Welding SMAW` → *Introduction to FCAW*
- `WELD 244 — Welding Certification D1.1 Code Clinic` → *Advanced FCAW*

**Neither title contains "FCAW".** Title similarity would never propose them.
Colleges routinely map a **broader** course to a specific rec — that is a faculty
judgment, not a lexical fact. So:

- **Title alignment** answers *"which of my courses obviously matches?"*
- **Peer precedent** answers *"what did other colleges actually accept?"* — and it
  is the only signal that surfaces the broad-course pattern.

Ship both, attached to each other, as a **proposal to faculty with its evidence** —
never an automatic determination. A single-signal version would look confident and
be systematically blind to a whole legitimate articulation style.

**⚠️ Candidates must NOT be scoped by TOP code.** Scoping the candidate set by TOP
is using TOP as a **gate**, which Rule 7 forbids. TOP may corroborate or boost;
the search runs over the college's catalogue. (The offline demo scoped by TOP for
speed — the build must not.)

### (b) Current state — three independent gaps

**① The M-ID leverage layer answers a narrower question.**
`statewide_prescriptive.js` lists only **El Camino and Riverside** for FCAW.
**Cerritos is absent** — its 12 welding courses sit in 12 *different* M-ID
clusters, none of which is the one FCAW's articulations key on
(`WELD M1038`, `M10GI`, `M10YH`, `M10AN`). `adoption_leverage` means *"peer
colleges teaching the same course IDENTITY that have not earned the
articulation"*. That is a real and useful signal — it is simply **not this
question**, and using it as if it were reports "no opportunity" for a college with
121 welding courses.

**② Peer articulations exist, and Sierra cannot see them.** All four adopters, with
exact course numbers, titles and which rec each maps to, are in
`kb/coci_articulations.json`:

| College | Course | Maps to |
|---|---|---|
| Barstow | `WELD 54B — Flux Cored Arc Welding (FCAW)` | Introduction |
| Bakersfield | `WELD B74A — Introduction GMAW … and FCAW Flux Core Arc Weld` | both |
| Santa Ana | `WELD 240 — Structural Welding SMAW` | Introduction |
| Santa Ana | `WELD 244 — Welding Certification D1.1 Code Clinic` | Advanced |

Repo-only. Sierra reads Supabase. Same publish-gap shape as SkyPeak's finding.

**③ There is no per-course table with titles in Supabase.**
`coci_college_offerings` is a TOP-aggregated rollup, and it carries **two silent
caps** set in `chatbox/build_coci_offerings.py`:

- `TITLES_TEXT_CAP = 900` — **801 of 16,097 rows sit at exactly 900 chars**, none longer.
- `SAMPLE_PER_TOP = 8` — **5,678 rows capped at 8** while **5,077 rows have more courses than that**.

Cerritos Welding Technology: **76 courses in the rollup (121 across TOP `0956*`),
8 shown**, and all 8 are the alphabetically-first `AED` ironworker rows. `WELD
214L` never appears.

**⚠️ This is bigger than this feature.** `search_college_offerings` searches
`titles_text`, so on those 801 rows — the **largest programs**, precisely where the
aligned course is most likely to live — it is **blind to every course title past
the cap**. Silent, and it looks like a clean miss.

### (c) Strategic roadmap

Build it as its own layer rather than bolting onto either existing route, because
both existing routes are answering different questions correctly and should keep
doing so.

1. **`chatbox_college_courses`** — per college × course from the 141k-row
   `coci_course_list.xlsx`: college, subject, number, title, units, credit type,
   TOP, C-ID. Storage is not a concern (`map_student_credit` is 537k rows); the
   live-aggregation rule applies — precompute, do not scan per question.
2. **`chatbox_credential_peer_articulations`** — credential × rec × (college,
   subject, number, title), straight from `coci_articulations.json`. Exact data, no
   matching, and it alone answers deliverable (2).
3. **One RPC** `credential_alignment_for_college(credential, college)` returning
   both signals per rec, each labelled with what it is.
4. **cpl-chat wiring** + a rule: propose with evidence, never determine; name the
   peer college and its course so faculty can check the precedent themselves.

### (d) Next concrete step

Build ② first. It is exact data, needs no fuzzy matching, is a small table, and on
its own delivers half of what Sam asked for — *"access to the other college
articulations for this same certificate"* — with zero risk of proposing a wrong
course.

### Caveats to carry

- **Scores are not probabilities.** 0.671 vs 0.288 is a *ranking* signal. Present
  the ordered list with the evidence, never a percentage or a confidence claim.
- **A college with no lexically-similar course is a real answer**, not a retrieval
  failure — peer precedent may still show a broad course that works.
- The offline demo's scorer (`0.35·ratio + 0.40·jaccard + 0.25·acronym`) was tuned
  on one credential. It is a starting point, not a validated model; the acronym
  bonus is doing a lot of work and will not generalise to credentials whose recs
  carry no acronym.

---

## 2026-08-13 (later) — SkyBridge: built and live (cpl-chat v41)

Shipped the same day it was designed. **#1153** peer articulations · **#1154**
per-college catalogue + RPC · **#1155** the cpl-chat wiring.

### (a) What was learned

**Neither source carried both halves, and the join key was already there.**
`coci_articulations.json` has `credit_recommendations` but no college attribution
on its `local_courses`; `credential_reference_data.js` has per-course
`local[].colleges` but no recommendation. CER's `cid` holds the same value as
COCI's `course_id`, so the join is `(unified_title, identity)`.

**⚠️ Attribution is not always per-course, and that had to be MEASURED.** Of 366
articulations carrying >1 local course, **208 (57%) list differing college sets
per course** — real attribution (`ASL 1 → Copper Mountain`, `ASL V01 → Ventura`).
The other **158 (43%) repeat one identical set onto every course**, which is the
signature of a group-level list denormalised down. The example that exposed it:
Correctional Officer Core Course listed the same five colleges against five
different courses (`ADJ 20`, `ADJUS 200`, `AOJ 3`, `CJ 30`, `CJ 51`) — read
literally, that claims five colleges each teach five equivalents under five
subject prefixes. Hence the `attribution` column: `per_course` (8,809 rows) vs
`group_wide` (604), and the renderer names group-wide peers as a **group**,
never pairing a college to a course.

**⭐ The scorer's first output was the most useful thing that happened.**
Plain token overlap ranked `ART 100 — Introduction To World Art` **third** for
*"Introduction to Flux Cored Arc Welding (FCAW)"*, on `introduction` + `to`.
That is not a minor precision issue on this surface: a welding instructor who
sees an art course concludes the tool does not understand the domain, and the
*correct* top suggestion loses its authority too. Fixed with `cx_align_tokens()`
+ a hard **≥1 content token** gate. `advanced`/`beginning`/`basic` deliberately
kept — they separate the Introduction rec from the Advanced one. Tightening
*raised* the right answer (`WELD 214L` 0.604 → **0.761**), because the
denominator stopped counting structural words.
Durable: `methodology-a-false-positive-costs-more-than-a-miss`.

**`cx_rec_course_name()` matters more than it looks.** A credit rec reads
"3-4 hours in Introduction to FCAW"; leaving the award prefix in makes every rec
look alike to a trigram and swamps the course name.

### (b) Current state — LIVE

| Surface | Shape |
|---|---|
| `chatbox_peer_articulations` | 9,413 rows · 1,516 credentials · 82 colleges |
| `chatbox_college_courses` | 141,696 rows · 120 colleges |
| `credential_alignment_for_college()` | both signals, one round trip, `row_kind` |
| `cpl-chat` | **v41**, `fetchAlignment` + `buildAlignmentContext` + `ALIGNMENT_RULE` |

Verified live for the acceptance case (Cerritos × ASME BPVC Section IX — FCAW):
`WELD 214L` tops both recs; peers Barstow `WELD 54B`, Bakersfield `WELD B74A`,
Santa Ana `WELD 240`/`244`.
`tests/sierra_alignment.test.js` — 21 behavioural checks.

### (c) Strategic roadmap

Sam and the team will **test this and feed back through Sierra Training**. That
tab is the intended loop: a bad suggestion becomes a logged question, which
becomes an instruction. Two things follow from that:

- The **25-row feedback backlog is now load-bearing**, not just hygiene — it is
  the channel this feature will be corrected through.
- The scorer is a **starting point tuned on one credential**. Expect the
  stoplist and the 0.45/0.55 weighting to need adjustment across disciplines;
  the acronym-in-parentheses case (FCAW) is doing real work in welding and will
  not generalise to credentials whose recs carry no acronym.

### (d) Next concrete step

Watch what the team reports. The first tuning signal will come from a discipline
whose course titles are less literal than welding's.

### Not verified from a session

Sierra's actual prose. The sandbox is egress-blocked from `*.supabase.co`, so the
RPC was verified directly and the renderer against live fixtures, but nobody has
read an answer she wrote. That is the first thing to check.
