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

---

## 2026-08-13 (later still) — SkyBridge: Sam's ladder, and the column I never read

Sam read a live Sierra answer and asked for C-ID first, then titles, then most
aligned as a last resort. He was right, and the defect was mine.

### (a) What was learned

**THE SCORER NEVER READ THE `cid` COLUMN.** `grep -c "c.cid"` on the function
returned 0. `chatbox_college_courses` had carried it since the table was built.

The symptom Sam saw: asked to match POST to Cerritos, Sierra said *"I don't have
Cerritos's full Administration of Justice catalog… look for an AJ 101 or
equivalent."* **`AJ 101` was in the table, carrying C-ID `AJ 110`** — the exact
C-ID of that recommendation. She sent faculty hunting for something we held.

Six of POST's eight distinct C-IDs match a Cerritos course exactly:
`AJ 110→AJ 101`, `AJ 120→AJ 102`, `AJ 122→AJ 103`, `AJ 124→AJ 104`,
`AJ 200→AJ 107`, `AJ 220→AJ 222`. **16,067 of 141,696 courses carry a C-ID across
112 colleges**, so the rung fires well beyond Administration of Justice.

**A ladder, not a blended score.** The obvious fix — a C-ID bonus in the formula —
would be wrong for the same reason peer precedent stays out of the similarity
ranking: these are different KINDS of claim. Rung 1 says *the equivalence is
established by a statewide standard*; rung 3 says *this is the closest thing you
have*. Blending lets a guess outrank a fact and presents them as commensurable.
Only the best available rung renders.
Durable: `methodology-use-the-identity-key-before-you-score-strings`.

**The side benefit was bigger than the feature.** Returning only the best rung is
the most effective noise filter built so far: "Concepts of Criminal Law" had been
returning the correct `AJ 102` (1.000) *beside* `ADN 210 Foundational Concepts of
Nursing`, and "Community and the Justice System" returned `MUS 202E Community
Symphonic Band`. With a rung-1 or rung-2 hit present those never render — no
threshold tuning required. Tuning a scorer chases false positives forever;
establishing identity first stops needing to.

### (b) Three corrections found by RUNNING it, none anticipated

1. **Statewide overrides local here too.** The RPC unioned peer wordings, giving
   POST **~27 near-duplicate recommendations** where the statewide set is TEN.
   Sam's standing rule was implemented on the credential route and not this one.
2. **A C-ID match whose names diverge is FLAGGED, never suppressed.** POST carries
   `AJ 110` on two lines, so rung 1 pairs an Administration-of-Justice course with
   the **Physical Training and Health Education** recommendation. Suppressing it
   would auto-resolve the repeat Sam ruled must never be auto-resolved; dropping
   the rung would discard the strongest signal. `cid_title_divergent` ships and
   the consumer must say so.
3. **`elective` is structural** — "Introduction to Policing (Elective Course)"
   matched `NRSG 48T Elective Nursing - Tutorial`. Stopped; that rec now returns
   NOTHING, which is the right answer. Plus a **relative floor** on rung 3 (≥60%
   of that rec's best score), because no absolute threshold separates
   `AJ 105 Community Relations` from `MUS 203E Community Band` — what separates
   them is that one is far closer *to the same recommendation*.

### (c) Current state — LIVE, cpl-chat v42

POST × Cerritos: **9 of 10 recommendations resolve to exactly one course**
(6 `c_id`, 1 `title`, 1 `aligned`, 1 flagged); the 10th honestly returns none.
`tests/sierra_alignment.test.js` 21 → **24**.

Two older assertions **correctly failed** when the ladder superseded the phrasing
they pinned (`"SUGGESTIONS for faculty to weigh"`, `"ranked by how closely the
course TITLE matches, nothing more"`). Both were rewritten to guard the enduring
intent rather than the old words — a test that pins wording blocks the
improvement it was written to protect.

### (d) Next concrete step

Sierra's prose at v42 is still unread from a session (egress). Ask the Cerritos
POST question; the flagged `AJ 110` line is the one most likely to need rewording.

---

## 2026-08-13 (next day, same corpus) — SkyTop: the answer looked right

Sam ran the acceptance case himself on live v42 and sent the prose back. It read
well. That is why the defect had survived three deploys.

### (a) What was learned

**THE RPC WAS RIGHT AND THE ANSWER WAS WRONG.** Asked whether Cerritos should
adopt POST Basic Academy, Sierra reported *"⬜ No close title match found —
check catalog"* for five recommendations whose courses Cerritos **already
teaches**, and which `credential_alignment_for_college` was returning correctly:
`AJ 102`, `AJ 103`, `AJ 101`, `AJ 107`, `AJ 222`. Only `AJ 124 → AJ 104` made it
through. #1158 had built rung 1 correctly; something downstream was eating it.

The loss was **between the RPC and the answer**, which is a place nobody had
looked, because both ends verified clean.

**⭐ `per_rec` BOUNDED ONE SIDE OF A UNION.** The call returned **3,807 peer
rows beside 9 candidates**. `where p.rn <= per_rec` sits only on `picked`; the
`peers` CTE had no bound at all. `buildAlignmentContext` renders every row it
receives, so nine candidate lines were interleaved into ~3,800 peer lines and
the model summarised what dominated. Those "peer colleges use ADJUS 120, ADMJ
52…" bullets in his answer *are* the peer rows, standing in for the answer.
Durable: `methodology-bound-both-sides-of-a-union`.

**⭐ THE PEERS WERE NEVER RESOLVED TO THE RECOMMENDATION SET.** `recs_raw`
correctly drops peer wordings when a statewide set exists — and the `peers` CTE
keyed on the peer's *own* `credit_rec` text with no equivalent gate. So peers
arrived under **43 wordings where POST's statewide set is TEN**, and grouping by
`credit_rec` manufactured **~34 phantom recommendation groups**, each rendering
the honest sentence *"No course has a similar title"* against a recommendation
that does not exist.

That is the sharp part: **a phantom empty group is indistinguishable from a real
one.** A reader counting "6 of 10 unmatched" concludes the college is
unprepared; in fact 6 of 6 real recommendations matched. Durable:
`methodology-a-grouping-key-must-come-from-the-authoritative-set`.

| | before | after |
|---|---|---|
| recommendation groups | 43 | **10** |
| total rows | 3,816 | **94** |
| C-ID matches rendered | 1 of 6 | **6 of 6** |

Gating cost **one peer college of 31**. The `AJ 110` repeat stays flagged. The
welding acceptance case is unchanged (`WELD 214L` 0.761 / 0.668).

### (b) Sam's fallback request — built, measured, withdrawn

> *"When there is no match … show the closest match you could find … unless if
> obviously wrong. Maybe even list it but with a note that it appears to be a
> mismatch."*

Built as a `fallback` tier. It proposed **`AUTO 160 — Introduction to Automotive
Electrical`** for *Introduction to Policing*, on the word "introduction" — the
`ART 100` failure verbatim. Zero other firings across 40 credentials.

**It cannot be tuned, for a structural reason.** `picked` already returns the
best row whenever *any* course shares a content token, so a recommendation with
no candidate is one where **nothing shares a subject word** — every candidate
there is a spelling coincidence, i.e. "obviously wrong" by his own qualifier.

His *request* was right; only the *mechanism* was wrong. The six empty rows he
saw were phantom groups, so fixing the grouping key answered him at source. Real
empties now point at the peer courses — the closest true thing we hold — and the
renderer forbids reaching for the nearest-sounding course.

### (c) Current state

Live: **cpl-chat v43** (renderer) on top of two migrations
(`alignment_gate_peers_to_recs_and_cap`,
`alignment_drop_fallback_keep_peer_gate`). `peer_total` ships as a column so the
renderer can say *"showing 9 of 261"* — a capped list must never read as a
census. `tests/sierra_alignment.test.js` **24 → 26**.

An assertion pinning `"No Cerritos College course has a similar title"` had to
be rewritten to guard the enduring guarantees instead of the sentence — the same
trap #1158 hit. **That is now twice in two sessions**; when writing an assertion
about prompt text, pin the guarantee, not the wording.

### (d) Next concrete step

Sierra's prose at v43/v44 is still unread from a session (egress). Sam re-runs
the acceptance case; the flagged `AJ 110` line remains the most likely to need
rewording.

### The successor — a Common CR Reference (Sam, 2026-08-13)

Sam, reading the 43-wordings finding: *"Makes me think we should have a Common
CR Reference just as we have pretty well developed CER, CSR, and the beginnings
of a CCR."* Then, correcting the session's proposed design:

> *"CID is only one factor in determining common CR references. Similar to the
> CCR, we take into account matching factors like title, course name and number,
> course description, subject, etc."*

He is right, and the measurement argues it harder than the session's own
caution did. The session had flagged that C-ID over-merges (POST carries
`AJ 110` on two different lines). The larger half: **only 402 of 2,344 distinct
`credit_rec` strings carry a C-ID at all (~17%)** — so a C-ID-keyed reference
strands ~1,942 strings as their own canonical and leaves the 43-wordings problem
entirely unsolved. C-ID-as-key fails in **both** directions.

Scale of the vocabulary:

| | |
|---|---|
| distinct `credit_rec` strings | **2,344** |
| after mechanical normalisation | 2,187 — **only ~7% collapse** |
| strings carrying a C-ID | 402 → **175 distinct C-IDs** |
| C-IDs with 2+ wordings | 81 — worst `AJ 110` → **10 wordings** |
| curated spine already in place | 351 statewide lines / 134 credentials |

The 7% is the tell: this is a **curation** problem, not string-cleaning —
exactly the CER's situation with freehand credential titles. Recorded as
`cpl_memory` `common-cr-reference-is-multi-factor-not-cid-keyed`, verified,
attributed to Sam, with his factor list held as *illustrative, not exhaustive*.
