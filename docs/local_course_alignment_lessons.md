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

## 2026-08-13 — SkyBridge (Session 148): proven offline, not built

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
