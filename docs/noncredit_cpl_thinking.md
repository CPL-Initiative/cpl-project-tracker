---
title: "Noncredit & Learning-Partner CPL — a thinking document"
date: 2026-08-05
status: internal-cogitation
audience: "Sam Lee — pre-white-paper. NOT publishable as-is."
tags: [noncredit, not-for-credit, adult-education, rop, high-school-articulation, apprenticeship, cpl, funding, learning-partners, thinking-doc]
artifacts:
  - "Vision 2030 Noncredit Summit Fall 2025 deck (33 slides, Lee/Decelle)"
  - "Chancellor Sonya Christian — Vision 2030 Noncredit Summit keynote, Oct 2025 (22 slides; CPL section from slide 14)"
  - "Apprenticeship & Noncredit Education one-pager (2026)"
  - "kb/credentials.json — issuing_agency / training_agency"
  - "cpl_funding_data.js — 2025-26 MIS DataMart credit + noncredit FTES"
  - "credential_reference_data.js — 1,987 unified credential titles (the §7a evidence audit)"
  - "Scaling Credit for Prior Learning in California — full 32-page monograph"
related:
  - "[[docs/cpl_funding_handoff]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[cpl-knowledge-base/research/scaling-cpl-california-2024]]"
---

# Noncredit & Learning-Partner CPL — a thinking document

> **What this is.** The long-form cogitation Sam asked for on 2026-08-05, ahead of a
> white paper. It carries the full use-case taxonomy, the mechanisms, the open forks,
> and — parked at the back — the funding arithmetic. The white paper gets **carved out
> of this**, not appended to it.
>
> **Scope, per Sam (2026-08-05):** *"Keep the focus primarily on understanding and
> scaling NC Universe CPL, and then we will take what we've distilled and see how it
> best applies to the funding formula."* So **§3–§10 are the work**; §11 is a holding
> pen that exists only so the numbers aren't re-derived later.
>
> It is **internal**: §11 contains allocation math that should not travel without a
> decision about what's shareable.
>
> **Confidence marking.** Claims are tagged ⟨sourced⟩ (traceable to a document or
> dataset in the appendix), ⟨inferred⟩ (my analysis from sourced material), or
> ⟨**NEEDS SAM**⟩ (a factual dependency I cannot resolve from the record).
>
> **Reading order if you have ten minutes:** **§0** (why this exists — the two-year gap
> between when the noncredit thinking was done and where it lives) → **§7a** (the MAP evidence audit — five
> findings that change conclusions elsewhere, and the densest "things we didn't know"
> section) → §2 (the thesis and the Chancellor's authorizing statement) → §4 (the
> scalability ladder) → §12's ranked next moves.

---

## 0. Why this document exists

⟨Sam, 2026-08-05, on finding no noncredit sections in the monograph: *"I had thought we
covered it at the time but I believe we didn't have it figured out back then… BUT the
lack of clarity and examples and opportunities IS the reason for this session."*⟩

That is worth stating precisely, because it is sharper than "the monograph is thin,"
and it explains the shape of everything below.

**There is a two-year gap between when the noncredit CPL thinking was done and where it
lives.**

| | State of the noncredit thinking |
|---|---|
| **Oct 2024** — *Scaling CPL in California* (32 pp.) | **Not yet figured out.** Noncredit appears **6 times**: one bullet in the CPL-modes list, and one genuinely good passage on the noncredit→credit summative exam (§3 UC-1). No framework, no examples, no opportunity map. |
| **Fall 2025** — Vision 2030 Noncredit Summit decks | **Figured out.** Mirroring with its documentation and processing steps; the not-for-credit evidence hierarchy; four worked student cases (Pablo · Martha · Josias · Julio); the two-tab landing-page architecture; the EMS Corps play; the non-college landing-page roadmap. |
| **Aug 2026** — the written record | **Still not written down.** The public KB has **8 files** mentioning noncredit, one or two lines each. No playbook. No taxonomy. No opportunity inventory. |

⟨inferred⟩ **So the knowledge is real, current, and undocumented.** It exists in slides,
in the MAP data (§7a), and in the heads of the people who built it. Slides do not
survive contact with a field of 116 colleges — they get presented once, to the people
already in the room, and then they stop working. A college that wants to mirror a
noncredit course today has nowhere to look.

**That is the gap this document is trying to close, and it sets three requirements:**

1. **Write the mechanisms down, not just the examples.** The decks are strong on
   *what happened* and thin on *how to do it*. §3's taxonomy is organized by
   **mechanism** for exactly this reason — a college needs to know which of twelve
   patterns it is in, and what that costs (§4).
2. **Inventory the opportunities, with names.** "There are opportunities in noncredit"
   is not actionable. "27 colleges teach dental assisting, one awards RDA CPL, here are
   the other 26" is (§7a). Every opportunity claim in this document is either backed by
   a query or explicitly marked as unverified.
3. **Say what is *not* known.** The monograph's noncredit gap was invisible for two
   years because nothing flagged it. §12 keeps the open items in the document rather
   than in someone's memory.

⚠ **And a pattern worth naming, since it will recur:** the CPL Initiative's thinking
consistently runs **ahead of its written record**, because the work is presented before
it is documented. The Chancellor's three 2026 commitments (§10b) are already public;
the mechanisms that satisfy them are not yet written anywhere a college can find them.
**Closing that lag is a durable capability, not a one-time task.**

---

## 1. Terminology — decided

Sam's ask: *"I need a term for the basket of non-college-credit programs."* The
basket is noncredit (CDCP and non-CDCP), not-for-credit (contract ed, community ed,
extension), adult schools, ROP/JPAs, high-school CTE, apprenticeship programs, and
industry trainers (CompTIA, Microsoft, ASE, NCCER, LAUSD apprenticeships).

**Decision (Sam, 2026-08-05): "Learning Partners."**

Three-level vocabulary, used consistently from here forward:

| Level | Term | Covers | Use when |
|---|---|---|---|
| **Actors** | **Learning Partners** | Institutions and organizations that originate learning a CCC can convert to credit — noncredit colleges, adult schools, ROPs, high schools, apprenticeship sponsors, agencies, industry trainers | Naming who does the work. Works equally for NOCE and CompTIA. |
| **Programs** | **credit-eligible learning** | The instruction itself, wherever delivered | Naming the thing that becomes credit |
| **CCC categories** | **noncredit** / **not-for-credit** | The precise internal distinctions (Title 5 noncredit vs. contract/community ed) | Technical, funding, and regulatory passages |

**Why not the alternatives.** "Non-degree-credit" and every other *non-* construction
defines an entire sector by an absence, which is precisely the frame the paper is
arguing against. "On-ramps" is vivid but subordinating — it implies these programs
exist to feed the colleges rather than having standalone worth, and NOCE, Mt. SAC NC,
and SDCCE will hear that. "Learning Partner" is the only option that a union JATC, a
county ROP, and a Fortune-500 certification body can all accept as a description of
themselves.

⚠ **Do not let "feeder" leak into external writing.** It is the funding model's
internal field name (`feeders`, `feeder_carveout`) and it is fine in code, but it is
exactly the subordinating frame we just rejected. In the white paper these are the
four **standalone noncredit institutions**.

---

## 2. The thesis — one asymmetry generates every problem in this space

**Only a California Community College can award CPL. Most CPL-eligible learning is
not originated by one.**

That is the whole thing. Every strategic problem in this document is a consequence:

- The NC program teaches the student; the college gets the outcome metric. *(Sam's Q4)*
- The NC program can waive its own course but cannot award credit for it. *(Sam's Q3)*
- The high school teaches the articulated course; the college transcripts it — and the
  system that tracks the handoff is being switched off. *(Sam's Q1)*
- The funding model measures colleges on CPL and cannot see the institution that made
  the CPL possible. *(Sam's funding question)*

Stated positively: **CPL is the only mechanism in California postsecondary education
that converts learning across institutional boundaries into transcripted credit.** It
is therefore the natural connective tissue between the credit system and everything
adjacent to it. The white paper's job is to make that argument and then make it
operational.

### The authorizing statement already exists ⟨sourced: Christian, Noncredit Summit, slide 14⟩

The white paper does not need to argue that noncredit belongs in the CPL goal. The
Chancellor has already said so, on the record, in the CPL section of her own Noncredit
Summit keynote:

> **220,000 working adults and apprentices, and 30,000 veterans and military-connected
> learners.**
> **Noncredit and Not-for-Credit learners will be key to meeting this goal.**

⟨inferred⟩ That is the paper's opening. The argument is not "should noncredit count" —
it is **"the statewide CPL goal is not reachable without it, and here is the
operating system."** Everything in §3–§11 is the answer to a question the Chancellor
has already asked in public.

**The corollary that organizes everything below.** CPL's cost is not the credit — the
credit is free to issue. The cost is **the assessment**: faculty time spent
establishing that this learner knows this material. Every scaling move in CPL is a
move that reduces, amortizes, or subsidizes assessment cost. That single lens sorts
the twelve use cases into a ladder (§4) and, eventually, the funding metric (§11).

---

## 3. The use-case taxonomy

Organized by **mechanism**, not by sector — because the mechanism determines the unit
economics, and the unit economics determine whether a use case scales. A single
adult school may appear in four of these.

### UC-1 · Mirrored noncredit → credit ⟨sourced: deck slides 3–5⟩

**Mechanism.** The noncredit course is a copy of the credit course's curriculum,
carrying noncredit codes and repeatability. A CPL rubric is written as the assessment
instrument, reviewed by the curriculum committee, and **attached to the COR**. The
articulation is then standing: MAP auto-articulates, the student accepts or declines
with an academic counselor, and it transcripts.

**Why this is the most important idea in the deck.** ⟨inferred⟩ Mirroring **moves the
CPL assessment from post-hoc to concurrent**. The student is assessed once, during
instruction, by the faculty who taught them — and that assessment is *pre-approved* as
sufficient evidence for the credit award. There is no portfolio, no challenge exam,
and no second faculty review. The marginal cost of the hundredth award is
approximately zero.

It also converts a *portfolio* problem into an *articulation* problem. Portfolio CPL
is priced per student. Articulation is priced per course, once. That is a change in
the shape of the cost curve, not a discount on it.

**Exemplars.** Cabrillo (Sara Decelle). Pablo: MUS 59A/59B Game Audio Production,
1.5 + 1.5 units, noncredit trial → Music Technology & Recording Arts A.S. Martha:
HS130/HS131, 4 + 4 units, noncredit Community Health Worker intro → CHW Certificate
of Achievement without retaking courses.

**Scalability: Tier 1.** **What MAP needs:** nothing new — this already
auto-articulates. **What the field needs:** a replicable mirroring playbook and a
model CPL rubric.

**The monograph documents the instrument** ⟨sourced: *Scaling CPL in California*,
"The Academic Process"⟩. This is the most substantive noncredit passage in the
monograph and it names the mechanism precisely:

> *"Students may be enrolled in a noncredit course that has equivalent instruction and
> learning outcomes as a credit course… Faculty assess the learning to determine if it
> is equivalent to a credit course. In this case, the college could use the CPL type
> **credit by exam** or **portfolio review**… **A common approach is for noncredit
> faculty to confer with their credit counterparts to agree on a summative exam that
> demonstrates mastery of the student learning outcomes for a course.** …Provided that
> the credit faculty have confidence in the noncredit exam process and results,
> students who pass the noncredit summative exam would qualify for CPL for the credit
> course based on the CPL type credit by exam."*

⟨inferred⟩ **So there are two established instruments for the same move**, and the paper
should present both rather than picking one: the **jointly-agreed summative exam**
(monograph) and the **CPL rubric attached to the COR** (Cabrillo). Both do the same
essential thing — put the assessment *inside* the noncredit course, agreed in advance
with credit faculty. The exam suits skills with a clean summative test; the rubric suits
performance and portfolio-shaped outcomes. **A college should be told it may choose.**

Note also what the passage settles: the CPL *type* is **credit by exam** (or portfolio
review). Mirroring is not a new CPL category needing new authority — it is an existing
Title 5 §55050 type applied thoughtfully.

**Already endorsed at the Chancellor level** ⟨sourced: Christian, Noncredit Summit,
slide 8⟩. Describing what distinguishes California from other states:

> *"Many districts build noncredit-to-credit bridges (**mirrored courses, competency
> mapping, CPL**) so learners step into credit certificates/Associates/Bachelors."*

⟨inferred⟩ Mirroring is therefore not a proposal — it is **named statewide practice
that has never been systematized.** The paper's job is not to sell it but to supply
the playbook, the model rubric, and the count of where it exists today. That is a
much easier paper to write and a much harder one to argue with.

### UC-2 · Noncredit certificate → credit certificate or degree ⟨sourced⟩

**Mechanism.** A noncredit program's certificate sequence is crosswalked to credit
courses at partner colleges; completion of the noncredit certificate triggers a
defined credit award. Distinct from UC-1 in that the curricula are *aligned*, not
*identical* — so it needs a faculty crosswalk determination rather than a mirror.

**Exemplar.** NOCE — noncredit-to-credit CPL opportunities documented for **Google IT
Support Professional, Early Childhood Education, Electricity, Medical Assisting, and
Pharmacy Technician** ⟨sourced: BOG prep, 2026-07-06⟩. Named in the CTE policy
perspectives as *"replicable at every noncredit CTE program"* and *"uniquely WED
territory."*

**Scalability: Tier 2.** Cost is per credential, not per student, but each crosswalk
needs faculty work. **What MAP needs:** the crosswalk as a first-class object with
the noncredit certificate as the evidence key.

### UC-3 · Not-for-credit → credit ⟨sourced: deck slides 7–8⟩

**Mechanism.** Extension, community education, continuing education, online programs,
worksite training. Evidence is an **industry certificate with evaluative scores**, or
a **portfolio** requiring additional verification (resume + employer verification,
current job evaluation, or combined certificates and evidence).

**Exemplar.** Josias H. — Biodynamic Farmer Foundation Year, Development Year, and
Permaculture Design Course → HORT 2 Soil Science (4), HORT 176 Permaculture Design
(3), HORT 99 Internship (2). Nine units from a provider with no relationship to the
college.

**Scalability: Tier 3–4**, depending on whether the provider's credential recurs
often enough to justify a standing exhibit. **The strategic move is to promote
recurring UC-3 credentials into UC-5** — the first Biodynamic Farmer award is a
portfolio; the fifth should be an exhibit.

### UC-4 · On-the-job training / work experience → credit ⟨sourced: deck slide 9⟩

**Mechanism.** Portfolio of not-for-credit certificates plus employer skills
verification, substituting for discipline electives or work-experience units.

**Exemplar.** Julio A. — working full-time, part-time student, needed 6 units of
discipline electives for a Construction degree. Work Experience would have added a
semester. Faculty suggested a CPL portfolio instead; **he graduated immediately upon
finishing his final GE coursework.**

⟨inferred⟩ This is the clearest **time-to-degree** story in the whole deck, and it is
the one that speaks to the statutory outcomes report due **January 2028**. Worth
building the paper's completion argument around.

**Scalability: Tier 4** — individualized by construction. See §10.

### UC-5 · Industry certification originated at a Learning Partner ⟨sourced⟩

**Mechanism.** A third-party credential with an evaluative score becomes a statewide
or local exhibit; any student holding it receives a defined award. Assessment cost is
borne entirely by the certifying body.

**Exemplars from the landing-page mockups:** ASE G1, CompTIA Security+, CompTIA
Network+, AWS D1.1/D1.3/D17.1, NCCER Welding Level 2, AWS D1.1 SMAW.

**Scalability: Tier 1–2.** Highest-leverage lane per unit of faculty effort. **This
is where CompTIA, Microsoft, and ASE enter the Learning Partner story** — not as
teachers but as **assessors**. The recognition question (§7) has a different answer
for them than for NOCE, and the paper must not blur the two.

### UC-6 · Adult school → credit ⟨sourced: deck slide 10⟩

**Mechanism.** Adult-school occupational programs produce state licenses and
industry credentials; those convert to credit at a CCC.

**Exemplar — the single best story in the deck.** Rocio Garcia: started in adult
school, received **16 units** for her California Registered Dental Assistant
certification, finished a **BSDH a semester early**, saved the full cost of that
term, met minimum qualifications, completed a Master's in Education (spring 2025),
and is now a **full-time tenure-track professor at West Los Angeles College**. Adult
school to tenure track.

✅ **Cleared by name, per her own authorization** ⟨Sam, 2026-08-05⟩.

**Market context — numbers checked** ⟨deck slide 11, verified against COCI and MAP
2026-08-05; full working in §7a Finding 4⟩:

| Claim | Status |
|---|---|
| **24 CCC dental assisting programs** | ✅ **substantially confirmed** — COCI shows **27 colleges** with Dental Assistant (TOP 1240.10) courses, 421 courses statewide |
| **44 non-CCC programs** | ⚠ **unverifiable from anything in the record.** Needs an external inventory of ROP / adult-school / private programs. Cite as an estimate or drop |
| **4,200–7,000 annual CPL candidates** | ⚠ **unverifiable.** No source in the repos supports it. Do not print as a finding |

⭐ **And the checkable number is a better story than the estimate was.** Of the **27
CCCs teaching dental assisting, exactly ONE — West Los Angeles — awards CPL for the RDA
license**, converting **214 of 215 eligible units (99.5%)**. Rocio's 16 units came from
the one college in the state that built the pathway.

⟨inferred⟩ So the frame shifts from *"look what CPL made possible"* to **"one college
figured this out and 26 peers teaching the identical program have not started."** The
first is inspiring. The second is actionable and names 26 targets.

### UC-7 · High-school CTE articulation (Cx) ⟨sourced + NEEDS SAM⟩ — see §8

### UC-8 · Apprenticeship ⟨sourced: Apprenticeship & Noncredit one-pager⟩

Three entry points, already articulated:

1. **Existing apprentices** learning through a union or employer at various skill levels
2. **Apprentice completers** transferring in from other training centers
3. **Qualified work experience** equal to apprenticeship coursework at a CCC

**Structure.** Registered agreement, ≥2,000 hours OJT + ≥144 hours/year RSI, DAS
oversight, Ed Code §§79140–79149.3. Credit may be offered as apprenticeship credit,
noncredit, or not-for-credit *depending on the program* — which is precisely why
apprenticeship belongs in this paper rather than in a separate one.

**The retention argument ⟨sourced: CTE policy perspectives⟩:** 44% of California
apprentices withdraw before completion (DAS, 2000–2026). Making partial progress
count is a direct retention lever. 755 apprentice students, ~100% of eligible units
transcribed. Santiago Canyon leads at 310.

**Scalability: Tier 2** — the JATC crosswalk is per-sponsor and reusable. Cal-JAC
fire-service crosswalk: 12 colleges, 90 courses.

### UC-9 · Agency and cohort programs ⟨sourced: deck slides 26–30⟩

**Exemplar — EMS Corps.** Five-month intensive EMT licensing program for youth 18–24
facing significant barriers; stipends, counseling, mentoring, job placement; **85%
success rate**. *"Until this year, EMS training was offered through ROP, adult
education, and private training agencies and students had no pathway to college."*
Now expanded to 10 CCC credit sites via Instructional Service Agreements, 16 sites
nationally. **CPL opportunity: 6–10 units to 500+ alumni.**

The Moreno Valley EMT noncredit pathway shows the full ladder: CA EMT + NREMT →
**8.5 units CPL** → AS Paramedic or AS Fire Technology → BS Emergency Services, with
CCC baccalaureate landings at Miramar (Public Safety Mgmt), Siskiyous (Paramedicine),
and nine respiratory-care programs.

⟨inferred⟩ **The retroactive cohort award is a distinct and underrated play.** UC-9
is not just a forward pathway — it is **500+ people who already completed and can be
awarded now**. Every mature Learning Partner program has an alumni back-catalog.
That is the fastest available source of volume in the entire NC strategy, and it
front-loads under the funding model's front-load design.

### UC-10 · Justice-involved learning — Rising Scholars ⟨sourced: deck slide 25⟩

**Mechanism.** Vocational training delivered inside CDCR facilities produces
third-party industry credentials; those convert to credit at any CCC on release or
during enrollment.

**Already mocked up:** a CDCR-branded landing page (`www.CDCR.gov`,
`CollegeCredit@CDCR.gov`), carrying **AWS D1.1/D1.3/D17.1 Supplemental**, **NCCER
Welding Level 2**, and **AWS D1.1 SMAW** at 3–4 credits each, mapped across **LA Trade
Tech, San Diego City, Fresno City, Long Beach City, Bakersfield, Mt. SAC, Riverside
City, Cerritos, Pasadena City, Santa Monica, Orange Coast, and Fullerton.**

⟨inferred⟩ **Why this is a big opportunity and not a niche one.** Rising Scholars has
three properties that put it structurally close to EMS Corps (§3a):

- **Third-party validated.** AWS and NCCER are national welding standards with
  objective assessment. Same "look for the licensure" logic — Tier 2, not Tier 4.
- **A single sponsor holding the whole population.** CDCR knows who completed what and
  when. That is the same bounded-and-reachable property that makes the EMS Corps
  alumni play work, at considerably larger scale.
- **The credential travels but the person's record often doesn't.** Justice-involved
  learners are among the most likely to have real, documented training that no
  receiving institution ever sees. CPL is not a convenience here — it is frequently
  **the only mechanism** by which that learning survives the transition.

⟨inferred⟩ The equity argument writes itself and should be stated plainly rather than
gestured at: for this population, CPL converts time that the system treats as a gap
into transcripted progress. **There is a real back-catalog question here too** — how
many people already released hold CDCR-delivered credentials that no college has ever
evaluated? ⟨**NEEDS SAM** — is anyone at CDCR positioned to answer that?⟩

### UC-11 · CPL toward a *noncredit* award — Sam's "oxymoron" — see §6

### UC-12 · Calbright — competency-based noncredit, statewide, online ⟨sourced: deck slide 23⟩

**Mechanism.** Calbright is a fully online, tuition-free, **competency-based** statewide
college classified as noncredit. Its landing page mockup is built and carries the same
credential set as the others: **ASE G1**, **CompTIA Security+**, **CompTIA Network+**,
with the **"At Calbright" | "To California Community Colleges"** tab pair.

⟨inferred⟩ **Calbright is the most structurally interesting case in the entire
taxonomy, and it is underexploited.**

- **Competency-based by design.** Every other case in this document has to *retrofit*
  a competency determination onto instruction that was built around seat time.
  Calbright's programs are *already* expressed as demonstrated competencies. The
  translation problem CPL usually solves has, in Calbright's case, largely been solved
  upstream at the curriculum level.
- **Statewide by charter.** It is the one Learning Partner with **no service area**.
  A Calbright→CCC crosswalk is immediately useful to a learner in all 116 districts,
  where a NOCE crosswalk is worth most in Orange County. Per unit of faculty
  crosswalk effort, Calbright has the largest reachable population of any partner.
- **Its credentials are already the ones with statewide exhibits.** CompTIA and ASE are
  UC-5 credentials with existing determinations at many colleges. The crosswalk is
  substantially **already built** — it just has not been pointed at Calbright's
  completers.

⟨inferred⟩ So Calbright is plausibly the **fastest** partner to light up: the
credentials are pre-articulated, the population is statewide, and the landing page is
already designed. If we want an early, visible statewide win, this is the shortest
path to one.

⚠ **But the data problem must be resolved first, and it is not cosmetic.** Calbright
reports **21,438 noncredit FTES on 2,484 headcount** — 8.6 FTES per student, which is
impossible (see §11). Any story we tell about Calbright's scale will be checked against
that figure, and any funding logic that touches it inherits the defect.
⟨**NEEDS SAM** — this needs Malone before Calbright appears in anything external.⟩

---

## 3a. EMS Corps — the reference implementation

⟨sourced: Christian Noncredit Summit slides 16–20; Noncredit Summit deck slides 26–30; Sam, 2026-08-05⟩

EMS Corps deserves its own section because it is the **only case in the record that
exercises every mechanism in this document at once** — and because Sam has named two
concrete asks against it. If we can do EMS Corps end to end, we have a template for
every agency and cohort program in the state.

### What it is

A five-month intensive EMT licensing program for young people 18–26 facing barriers to
employment. Paid monthly stipend, wraparound support, counseling, mentoring, career
guidance, job placement. **85% success rate.** Operated by Public Works Alliance;
Jeff Metcalfe is the New Site Implementation Lead.

### Why it is the perfect case study

**It is a Learning Partner that became a college program in one year, and the before
state is still visible.**

> *"Until this year, EMS training was offered through ROP, adult education, and private
> training agencies and students had no pathway to college."*

**That single sentence is the entire white paper in miniature.** The same instruction,
the same students, the same outcomes — and the difference between "no pathway to
college" and "college credit from day one" is not curriculum, it is **institutional
plumbing.** Nothing about the teaching changed.

Today: **11 new sites launched in 2025, all working with California Community Colleges
to deliver the EMT training**, 16 sites nationally, via **Instructional Service
Agreements**. Trainees are *"enrolled as college students from day one"* and *"earn
college credit while they train."*

### The two asks

**Ask 1 — retroactive CPL outreach to 500+ alumni.** The Chancellor has already
committed to this publicly:

> *"We are working closely with Public Works Alliance to reach out to EMS Corps alumni
> to ensure they can receive college credit toward associate and baccalaureate degree
> programs in areas like Paramedicine, Fire Technology, Emergency Management, Public
> Safety, and beyond."* — Chancellor Christian

⟨inferred⟩ **This is the highest-value single action available anywhere in the NC
universe right now**, and I want to be emphatic about why. It is:

- **Bounded** — a known, finite, reachable population, held by a willing partner
- **Homogeneous** — every alum holds the *same* credential, so it is **one** faculty
  determination covering 500+ people. Tier 2 economics on a Tier 4-sized outcome.
- **Retroactive** — the learning already happened; there is no pipeline to wait for
- **Pre-endorsed** — the Chancellor has said it in public, so the political work is done
- **Fan-out, not a single path** — the slide-20 analysis shows six destination
  pathways, not one, so an alum who does not want Paramedicine still has five doors

**The arithmetic.** 500 alumni × the 6–12 unit Paramedic band ⟨slide 20⟩ ≈ **3,000–6,000
units.** For scale: the system has ~103k units transcribed to date. **A single agency
partner's back-catalog is a measurable fraction of statewide CPL volume**, from one
crosswalk.

**The unit figure to use — resolved** ⟨Sam, 2026-08-05 + §7a⟩. Sam's instruction was to
check whether East LA has its articulations in MAP and, if not, to use the range for any
EMT/EMS certification at colleges in MAP.

**East Los Angeles College IS in MAP** — it appears under the statewide **"EMT
Certification"** exhibit and the Cal-JAC **"Firefighter EMT Certificate."** And the
statewide exhibit answers the range question directly:

> **EMT Certification** (California EMSA, statewide, 28 colleges) — general
> recommendation **7.5–14 hours**; actual local awards **0.5–12.3 units**.

**Use 7.5–14 units as the headline**, noting that individual colleges award within
0.5–12.3 depending on their local determination. That also explains the keynote's
"8–17" — plausibly EMT stacked with a second credential. The other published figures
(6–10, 8.5, per-pathway 3–12) are measuring different things: a destination-program
band, Moreno Valley's specific determination, and per-pathway ranges respectively. They
are not contradictory once labeled — **but they must be labeled**, because as published
they read as four answers to one question.

**Ask 2 — an EMS Corps CPL landing page.** Slide 20 is already a working prototype of
exactly this. It shows six pathway cards, each with a demand rating, a CCC program
count, a college list, and a unit band:

| Pathway | Rating | CCC programs | Units |
|---|---|---:|---|
| **Paramedic** (EMS/Paramedic) | HIGHEST | 15+ | 6–12 |
| **Fire Technology** / Fire Science | HIGH | 50+ | 6–10 |
| **Respiratory Care** / Respiratory Therapy | MEDIUM | 25+ | 5–8 |
| **Health Information** Technology | — | 10+ | 4–6 |
| **Nursing (ADN)** | — | 60+ | 3–6 |
| **Allied Health** (Biotech / Kinesiology / Public Health) | — | various | 3–6 |

⟨inferred⟩ **The landing page and the alumni outreach are the same artifact.** The
page *is* the outreach vehicle — you send 500 alumni one link, and the link shows each
of them every college that will award them credit and every pathway it opens.
Building the page first and mailing it second is strictly better than a mail-merge,
because the page persists for the next cohort and the one after.

And it slots into the existing template with **no new design work** (§9): EMS Corps
branding, their contacts, the **"At EMS Corps" | "To California Community Colleges"**
tab pair, the credential cards, the per-college course/unit tables. The Rising
Scholars page proves the pattern already works for a non-college sponsor.

### The three-role model, applied ⟨§7⟩

| Role | Who |
|---|---|
| **Originator** | EMS Corps / Public Works Alliance — and, for pre-2025 alumni, the ROPs, adult schools, and private training agencies that delivered it |
| **Validator** | The state EMT license and NREMT certification — third-party, scored, unambiguous |
| **Awarder** | The 11 CCC sites, and any CCC an alum enrolls at |

⟨inferred⟩ Note what the Validator column buys us: because EMT/NREMT is a **state
license with an objective standard**, the faculty determination is about *equivalence*,
not about *evidence*. That is why this case is Tier 2 and not Tier 4, and it is the
single most transferable lesson to other agency programs. **Look for the licensure.**

### The mechanism — **ISA, confirmed** ⟨Sam, 2026-08-05⟩

Sites are funded through **Instructional Service Agreements**, matching both decks. Not
RSI. So this is *not* the apprenticeship funding stream carrying a cohort program, and
UC-8 and UC-9 stay structurally separate.

⟨inferred⟩ That is the cleaner answer for the paper, and it generalizes better: **the
ISA is the standard, well-understood vehicle for a college to contract instruction with
an outside entity**, available to every agency, ROP, adult school, and CBO in this
document without touching apprenticeship law. The reusable pattern is therefore
**"ISA for the going-forward cohorts, CPL for the back-catalog"** — two mechanisms that
together convert a Learning Partner's whole population, past and future.

### What makes this generalizable

⟨inferred⟩ The EMS Corps pattern — **agency program + third-party license + alumni
back-catalog + a landing page + a fan-out to multiple destinations** — should be the
paper's template for the whole agency lane: Futuro, WDB, EDD, and every ROP or adult
school running a licensure-terminal program. The screening question is short:

1. Does it end in a **license or third-party certification**? (→ Tier 2, not Tier 4)
2. Is there an **alumni back-catalog** with a willing partner to reach them?
3. Do **multiple CCC pathways** accept it? (→ fan-out, not a single brittle path)
4. Is there a **named partner** who wants a landing page?

EMS Corps answers yes four times. That is why it goes first.

---

## 4. The scalability ladder — the central analytic move

Sort the twelve use cases by **marginal assessment cost per award**:

| Tier | Assessment happens | Priced per | Marginal cost of the Nth award | Use cases |
|---|---|---|---|---|
| **1** | **During instruction**, by the teaching faculty, pre-approved | course, once | ~$0 | UC-1 mirrored, UC-5 statewide exhibits |
| **2** | **Once per credential**, by a faculty crosswalk | credential | ~$0 after setup | UC-2 NC certificates, UC-5 local exhibits, UC-8 JATC crosswalks, **UC-9 EMS Corps**, **UC-10 Rising Scholars**, **UC-12 Calbright** |
| **3** | **Once per cohort/program**, by agreement | program | low | UC-9 agency cohorts, UC-7 HS articulation |
| **4** | **Per student**, by faculty review | student | full cost, every time | UC-3 novel providers, UC-4 work experience, UC-11 |

**The strategy is a single sentence: move volume down the ladder, and subsidize what
cannot move.**

Three concrete implications:

1. **Mirroring is the highest-yield investment in noncredit CPL** and should be the
   paper's lead recommendation. It is the only mechanism that puts assessment at
   Tier 1 for locally-taught noncredit.
2. **Promotion is a designed process, not an accident.** A UC-3 portfolio award that
   recurs should be *promoted* to a UC-5 exhibit. MAP should surface "credentials
   assessed N times by portfolio" as a worklist. ⟨inferred — this does not exist today⟩
3. **Tier 4 will never scale, so it must be subsidized rather than optimized.** That
   is exactly what the noncredit portfolio-development course does (§10), and it is
   why that idea is more important than it first appears.

---

## 5. Noncredit → credit transition: how CPL actually moves students ⟨Sam's Q2⟩

CPL contributes to noncredit-to-credit transition in **five distinct ways**, and they
are not equally understood. Only the first is widely recognized.

**① Removing repetition.** The obvious one. Martha did not retake the CHW courses.
Direct, measurable, and the easiest to explain.

**② Making the credit pathway *visible* at the moment of noncredit enrollment.**
⟨inferred, and I think this is the big one⟩ The noncredit landing-page mockups have a
two-tab structure — **"At San Diego College of Continuing Education" | "To California
Community Colleges."** That second tab means a student enrolling in noncredit sees,
*on day one*, that their work leads somewhere. The transition intervention happens
**before** the student ever considers transitioning. This is pre-matriculation
outreach disguised as a credit inventory, and it is the piece of the architecture I
would protect above all others.

**③ Converting a trial into a commitment.** Pablo *"tried out noncredit Game Audio
Production courses and realized he wanted to pursue the credit pathway."* Noncredit is
a **low-risk sampling mechanism** — free, non-punitive, no financial-aid consequence.
CPL is what makes sampling non-wasteful. Without it, exploring noncredit costs the
student time; with it, exploration is free *and* it accrues.

**④ Producing a credit balance large enough to change the arithmetic.** Rocio's 16
units and Moreno Valley's 8.5 are not marginal — they change whether a degree looks
achievable. ⟨inferred⟩ There is likely a **threshold effect** worth naming: an award
that clears roughly a semester of progress changes the decision, and smaller awards
mostly do not. If the data can support it, that threshold should inform whether the
funding metric counts *awards* or *units*.

**⑤ Carrying financial-aid and momentum eligibility.** Transcripted units count
toward enrollment intensity and satisfactory-progress calculations in ways that
noncredit completion does not. ⟨**NEEDS SAM / needs verification** — this is
directionally right but I will not print it without checking the aid rules.⟩

**The six operational steps**, for the paper's "how to do this" section:

1. **Inventory** the noncredit certificate and course catalog against credit
   equivalents at partner colleges.
2. **Choose the mechanism per item** — mirror it (Tier 1) where the curriculum can be
   identical, crosswalk it (Tier 2) where it cannot.
3. **Build the CPL rubric** into the noncredit COR so assessment is concurrent.
4. **Publish it on a landing page** with the "To California Community Colleges" tab —
   so the pathway is visible *before* enrollment, not discovered after.
5. **Counsel at the transition point**, with the award already computed. MAP shows the
   student their balance; the counselor confirms acceptance.
6. **Transcript, then measure the handoff** — which is the funding metric (§11).

---

## 6. Can a noncredit program give noncredit CPL? ⟨Sam's Q3⟩

Sam's framing: NC programs routinely **waive** a noncredit course inside a certificate
sequence when a student demonstrates the skills — but the student then cannot receive
the certificate, because the sequence requires the course. So they need to *award*
something for the waived course.

**It is not an oxymoron. It is an apportionment problem wearing a curriculum costume.**

Here is the analysis, and I think it is the most useful thing in this document.

**The regulatory layer is the smaller obstacle.** Title 5 §55050 is written for credit
("credit for prior learning"). Noncredit certificate requirements are locally approved
under PCAH. A college that wants to permit competency substitution inside its own
noncredit certificate is mostly constrained by **its own approved certificate
definition**, not by a state prohibition. ⟨inferred — ⟨**NEEDS VERIFICATION**⟩ before
this goes in a white paper; it is the load-bearing legal claim.⟩

**The economic layer is the real obstacle.** Noncredit is funded on **contact hours**,
not units. A waived noncredit course generates **zero apportionment**. And unlike
credit — where the student at least does not pay a fee they would otherwise pay — in
noncredit *the student already pays nothing*, so **100% of the financial loss falls on
the institution.** CDCP courses carry the enhanced rate, which makes the loss larger
precisely in the workforce sequences where competency substitution is most common.

**The Chancellor's own deck states both halves of this** ⟨sourced: Christian, Noncredit
Summit, slides 6–7⟩, which means the premise is not contested and the paper can move
straight to the ask:

> *"State apportionment pays for noncredit; students don't pay enrollment fees. A
> priority subset (Career Development & College Preparation, 'CDCP') receives enhanced
> funding to build pipelines in ESL, basic skills, short-term vocational, and workforce
> prep."*

CDCP's enhanced rate dates to **SB 361 (2006, Sen. Jack Scott; signed by Gov.
Schwarzenegger 2026-09-29; Chancellor Mark Drummond)** — **$159M in new funding
statewide**, covering **Workforce Preparation** and **Short-Term Vocational Training**.

⟨inferred⟩ There is a useful historical rhyme here that the paper should use. **SB 361
is the precedent for exactly the ask in Route D.** In 2006 the state decided that
certain noncredit instruction was worth more than the base rate and funded it
accordingly, because it built pipelines. The competency-recognition hold-harmless is
the same argument twenty years on: **the state already accepted that noncredit funding
should follow strategic value rather than raw contact hours.** We are asking it to do
that once more, for the case where the strategic value is *not* delivering the hours.

**That is why NC programs "waive but don't record."** The waiver is a favor to the
student that costs the program money and earns it nothing. Recording it formally would
make the loss visible and auditable. The current practice is the rational response to
the incentive.

⟨inferred⟩ **This reframes Sam's question entirely.** The ask is not "may we award
noncredit CPL?" It is **"how do we stop penalizing a Learning Partner for recognizing
competency instead of selling seat time?"** That is a fundable, legible policy
problem, and it is a much stronger argument than a curriculum-technical one.

**Four routes, in order of how fast they can move:**

| Route | What it is | Speed | Cost |
|---|---|---|---|
| **A. Mirror it** | If the NC course mirrors a credit course, the student takes the CPL on the **credit** side; the college recognizes the credit award as satisfying the NC certificate requirement | **Now** — uses existing machinery | none |
| **B. Local competency substitution** | The noncredit certificate's own approved requirements permit demonstrated-competency substitution for a defined subset | Local, this year | apportionment loss, unmitigated |
| **C. Record without apportionment** | Transcript the competency as satisfied; accept the funding loss | Now | honest but unfunded — will not scale |
| **D. State policy** | An explicit noncredit CPL provision plus an **apportionment hold-harmless** for competency-substituted contact hours | Title 5 cycle | requires a fiscal argument |

**Recommendation: lead with A, ask for D.** Route A solves the student's problem
today using machinery that already exists and needs no permission — it is another
reason mirroring is the paper's lead recommendation. Route D is the ask that makes the
paper matter, and the hold-harmless framing is what makes it winnable, because it
costs the state nothing it is not already paying.

### Is this real demand? — **my recommendation, since Sam wasn't sure**

Sam's answer on 2026-08-05 was *"Not sure, recommend…"* — so here is the recommendation.

⟨inferred⟩ **Do not go looking for demand evidence before acting. Ship Route A and
instrument the question at the same time.**

The reasoning: this practice is, by its nature, **invisible in every dataset we have.**
A waiver that is never recorded generates no row anywhere — not in MIS, not in MAP, not
in COCI. Searching for it in data will return zero and that zero will mean nothing. The
only way to find out is to **ask humans a direct question.**

**The concrete move — one question, three existing venues:**

> *"When a student in one of your noncredit certificate sequences demonstrates they
> already have the skills for a required course — what happens? Do they get the
> certificate?"*

Ask it at **CPL Office Hours** (5–20 colleges/week already), at the **annual CPL
Summit**, and directly of the **four standalone noncredit institutions plus the ten
largest in-college noncredit operations** (Mt. SAC, Santa Ana, SF, Santiago Canyon,
Santa Rosa, Glendale, Saddleback, Canyons, Gavilan, Rio Hondo — §11). That is roughly
14 conversations and it can be done inside a month.

**Why this is the right sequencing:**

1. **Route A does not need the evidence.** Mirroring solves the student's problem today
   with existing authority. Ship it regardless of what the survey finds.
2. **Route D absolutely needs it.** A Title 5 or apportionment ask with no named college
   and no named certificate sequence will not survive its first meeting. The survey is
   what makes that ask real.
3. **The question itself is an intervention.** Half the colleges asked will not have
   thought of mirroring as the answer. Asking plants it.
4. **It converts an unknown into a measured thing in weeks, cheaply** — no build, no
   data work, using convenings that already happen.

⚠ **One caution on how to ask.** Phrase it as *"what happens to the student"* — never
*"do you waive courses?"* The second reads as an audit question about a practice that
technically costs the college apportionment, and people will say no. The first is about
a student outcome, and people will tell you the truth.

---

## 7. Recognizing Learning Partners in the CPL lifecycle ⟨Sam's Q4⟩

**Sam's decision (2026-08-05): data layer + partner surface.**

### The finding that makes this buildable now

**The schema already exists and is pointed at the wrong sector.**
`kb/credentials.json` carries, for every credential, a distinction between:

- **`issuing_agency`** — who awards the credential
- **`training_agency`** — who *taught* it

**2,188 credential entries. 374 (17.1%) carry a training agency.** The largest are
trade JATCs (Carpenters Training Committee for Northern California: 97), CAL FIRE
(31), the U.S. Armed Forces (30), UA Local 342 JATC (23), Iron Workers Training
Center (17), and Sacramento Electrical Training Center (11).

> **⚠ Correction (2026-08-05).** An earlier draft of this section said "zero noncredit
> colleges, zero adult schools, zero ROPs," reading only the top of that list. A full
> audit — **§7a** — shows **high schools (~48 entries), ROPs (Baldy View), and adult
> schools (Fontana Adult School) ARE present.** Only the **noncredit colleges** are
> genuinely at zero. The corrected picture is stronger, not weaker: the hardest partner
> lane populated itself organically, and the easiest one is empty.

⟨inferred⟩ The apprenticeship and high-school worlds populated this field because the
sponsor *is* the trainer and the distinction was unavoidable. The noncredit colleges
never did, because nobody asked them the question. **The infrastructure for recognizing
Learning Partners already works — it has simply never been pointed at noncredit.** That
is a fortunate position: this is a data-population project, not a schema project.

### The three-role model the paper should establish

Every CPL award has three roles, and today the system records one:

| Role | Who | Recorded today? |
|---|---|---|
| **Originator** — taught the learning | NOCE, an adult school, an ROP, a JATC, an employer | `training_agency`, 17% populated — high schools/ROPs/adult schools yes, **noncredit colleges zero** (§7a) |
| **Validator** — assessed and certified it | CompTIA, ASE, NREMT, a state licensing board, or the teaching faculty | `issuing_agency`, well populated |
| **Awarder** — converted it to transcripted credit | the CCC, always | fully — this is what we measure |

**This model does the paper's hardest rhetorical work.** It explains why CompTIA and
NOCE are both Learning Partners but are recognized differently: CompTIA is a
**Validator**, NOCE is usually an **Originator**, and an adult school running its own
dental-assisting program with a state license at the end is **both**. It also explains
why the college's exclusive award authority is not a slight — it is one of three
roles, and the other two were simply never counted.

### The build, in order

1. **Populate `training_agency` for the noncredit sector.** Start with the four
   standalone institutions and the NOCE five (Google IT Support, ECE, Electricity,
   Medical Assisting, Pharmacy Technician). Adult schools and ROPs next.
2. **Report it back to the partner.** *"Learners you taught earned N units at M
   colleges this year, worth $X in avoided tuition."* ⟨inferred⟩ This is the single
   highest-value artifact we could hand a Learning Partner, because **it is evidence
   they currently have no way to obtain.** An adult school cannot today find out what
   happened to its completers.
3. **Partner landing pages** — already in development (§9), already carrying the
   two-tab structure. This is the public surface of the same data.
4. **A partner-side view of the CPL dashboard** — the recognition analogue to the
   Veteran Star designation.

⟨inferred⟩ **Recognition without money is not a consolation prize here.** For an adult
school or ROP, documented evidence that its completers earned college credit is
directly usable in CAEP/Perkins reporting, board presentations, and grant
applications. We should say that plainly — it is the reason the data layer is worth
building before any funding question is settled.

⚠ **The distinction that keeps this honest:** the college's CPL count must not be
*reduced* by co-attribution. Recognition is additive. If Learning Partner attribution
ever reads as taking credit away from colleges, adoption dies immediately.

---

## 7a. What the MAP data actually says — an evidence audit

⟨sourced: `credential_reference_data.js` and `coci_lookup_data.js`, queried 2026-08-05⟩

This section did not exist in the first draft. It exists because Sam asked me to find
"things I don't know I don't know," and querying the live credential data against the
taxonomy turned up five things that change conclusions elsewhere in this document.

**Base counts:** 1,987 unified credential titles · 1,603 articulated · 4,240
articulation lines · 84 statewide titles · 348 titles carrying a named training agency.

### ⭐ Finding 1 — The high-school lane is already populated. The noncredit lane is at **zero**.

I said in the first draft that MAP carried "zero noncredit colleges, adult schools, or
ROPs." **That was wrong about adult schools and ROPs, and the correction is more
interesting than the original claim.**

| Learning Partner type | Entries in MAP | Examples |
|---|---:|---|
| **High schools** | **~48** | Fontana, Summit, Birmingham Community Charter, Cajon, Lemoore, Mater Dei, A.B. Miller, Cleveland, Jurupa Hills, Arroyo Valley, + "Local High School" (10) |
| **ROPs** | 2–3 | **Baldy View Regional Occupational Program** |
| **Adult schools** | 2 | **Fontana Adult School**, "Adult School (varies)" |
| **HS districts** | 1 | Chaffey Joint Union High School District |
| **Charter / private trainers** | several | Learn 4 Life, Cisco Networking Academy, CyberForward Academy, Riverside Flight Academy |
| **Noncredit colleges** (NOCE · SD Cont. Ed · Mt. SAC NC · Calbright) | **0** | — |

**Zero. Not "few" — none.** The four standalone noncredit institutions do not appear as
issuer or training agency on a single one of the 1,987 credential titles.

⟨inferred⟩ **This is the sharpest single fact in the document.** The *hardest* Learning
Partner relationship — K-12, a different segment, different data rules, no shared
governance — is the one that organically populated itself, because colleges have been
entering high-school articulations as CPL exhibits for years. The *easiest* one — four
institutions inside the CCC system, on the same platform, at the same summits, holding
$1M in carve-out funding — is empty.

The gap is not capability, permission, or infrastructure. **It is that nobody has done
the data entry.** That makes it the cheapest high-value fix in this entire document,
and it should be near the top of any action list.

### ⭐ Finding 2 — EMT is already a statewide exhibit at 28 colleges, and it *outperforms* the system

⟨answers Sam's Q2⟩ **East Los Angeles College IS in MAP with EMT articulations** — under
both the statewide **"EMT Certification"** exhibit and the Cal-JAC **"Firefighter EMT
Certificate."** No new articulation work is needed there.

**"EMT Certification"** (issuer: California EMSA) — **statewide**, CPL types Credit By
Exam · Industry Certification · Military · Portfolio Review:

- **28 colleges**: Antelope Valley, Bakersfield, Cabrillo, Chabot, Chaffey, City College
  of San Francisco, College of the Desert, Columbia, Contra Costa, Cuesta, **East Los
  Angeles**, Lake Tahoe, Los Medanos, Mendocino, Merced, Modesto, Monterey Peninsula,
  **Moreno Valley**, Mt. San Antonio, Napa Valley, Norco, Palo Verde, Rio Hondo,
  Riverside City, San Diego Miramar, Santa Ana, West Los Angeles, Woodland
- **General recommendation: 7.5–14 hours**; local awards range **0.5 – 12.3 units**
- **Eligible 1,338.6 · transcribed 1,011.6 · applied 1,136.1**

⭐ **That is a 75.6% transcription rate against a system average of roughly 43%.**
EMT is one of the best-converting credentials in the entire CPL system, and nobody in
either deck mentions it.

⟨inferred⟩ **This materially changes the EMS Corps ask (§3a).** It is not "build
articulations for 500 alumni." The articulations exist, at 28 colleges, in a statewide
exhibit that already converts better than almost anything else. **The ask is outreach.**
That is a far cheaper, faster, and more defensible proposal.

**The unit range to use** ⟨per Sam's instruction⟩: the statewide EMT Certification
exhibit's general recommendation is **7.5–14 hours**, with local awards **0.5–12.3
units**. Use **7.5–14** as the headline until East LA's specific determination is
confirmed. It also explains the keynote's "8–17 units" — that is plausibly EMT stacked
with a second credential.

Adjacent EMS credentials already in MAP:

| Credential | Issuer | Colleges | Eligible | Transcribed |
|---|---|---:|---:|---:|
| Paramedic License | CA EMSA | 11 | 721.5 | 397 |
| EMT-2 Certification | CA EMSA | 2 | 230 | 172 |
| Paramedic Certification | NREMT | 1 (Bakersfield) | 118.5 | 79 |
| **Firefighter EMT Certificate** | **Cal-JAC (statewide)** | **10** | **0** | **0** |
| **Fire Fighter Paramedic Journeyperson** | **Cal-JAC (statewide)** | **4** | **0** | **0** |
| **Paramedic Journeyperson** | **Cal-JAC (statewide)** | **2** | **0** | **0** |

### ⭐ Finding 3 — Built-but-dormant statewide exhibits are a hidden inventory

Look at the last three rows above. **Three Cal-JAC statewide exhibits, published across
16 college-slots, with zero students served.** The articulation work is *done*. The
faculty determinations are *made*. Nothing is flowing.

⟨inferred⟩ **This is a category of opportunity nobody is tracking**, and it is the
cheapest volume available anywhere in CPL: a published statewide exhibit with zero
transcriptions is a completed asset awaiting outreach. MAP can enumerate these
system-wide in one query — *statewide exhibits, ranked by (colleges published × zero
uptake)* — and that list is an outreach worklist, not a build backlog.

**Recommendation:** produce that list. It is a day of work and it likely surfaces
dozens of Cal-JAC-style cases across every sector in this document.

### ⭐ Finding 4 — Dental assisting: one college out of 27 ⟨Sam's Q5⟩

**Confirming the numbers Sam asked about:**

- **"24 CCC programs"** — ✅ **substantially confirmed.** COCI shows **27 colleges with
  Dental Assistant (TOP 1240.10) courses**, 421 courses statewide. Also 16 colleges
  with Dental Hygienist (1240.20). The deck's slide-11 college list is a subset of
  these 27, so the figure holds.
- **"44 non-CCC programs"** — ⚠ **cannot be verified from anything I hold.** It would
  require an external inventory of ROP, adult-school, and private dental-assisting
  programs. Cite it as an estimate or drop it.
- **"4,200–7,000 annual CPL candidates"** — ⚠ **likewise unverifiable.** No source in
  the repos supports it. Do not print it as a finding.

**What the data does show, and it is a stronger story than the estimate was:**

| Credential | Colleges awarding CPL | Eligible | Transcribed |
|---|---|---:|---:|
| **Registered Dental Assistant (RDA) License** | **1** — West Los Angeles | 215 | **214** |
| Dental Board of California Certificates | 2 — Cabrillo, West LA | 121.5 | 106.5 |
| Registered Dental Hygienist (RDH) License | 2 — Glendale, West LA | 3,216 | **3,136** |

⭐ **27 California community colleges teach dental assisting. Exactly one awards CPL for
the RDA license.** And that one — West LA — has a **99.5% transcription rate** on it.

⟨inferred⟩ **That reframes the dental story completely.** It was "look what CPL made
possible for Rocio." It should be: **"one college figured this out, converted 214 of 215
eligible units, and 26 peer colleges teaching the same program have not started."** The
first is inspiring; the second is actionable, and it names 26 specific colleges.

Note also the **RDH line: 3,136 units transcribed across two colleges.** That is one of
the largest single-credential CPL volumes in the system, and it is invisible in every
deck. Allied health is quietly carrying enormous CPL weight.

### ⭐ Finding 5 — "Local High School" as an issuer is a data-quality tell

Ten credential entries carry the issuer **"Local High School"** and one carries training
agency **"Adult School (varies)"** — generic placeholders standing in for a named
institution.

⟨inferred⟩ Harmless as data entry; **fatal to partner recognition.** You cannot report
back to "Local High School," and you cannot build a landing page for it. Every §7
recognition mechanism depends on the partner being *named*. Resolving these generics —
and adding the same discipline going forward — is a precondition for the partner-facing
work, not a cleanup task to do later.

### What these five findings change

1. §3a EMS Corps: **outreach, not articulation-building.** 28 colleges are ready.
2. §7 recognition: the noncredit-institution gap is **absolute (zero)**, and the
   high-school lane is the proof the model works.
3. §8 HS Cx: MAP is **already doing this**, at ~48 credentials — the ask is step 3
   (rosters), not entry into a new business.
4. A **new workstream**: enumerate dormant statewide exhibits as an outreach worklist.
5. A **new precondition**: resolve generic partner names before building partner
   surfaces.

---

## 8. High-school CTE articulation and the Cx conversion ⟨Sam's Q1⟩

> **Framing note (Sam, 2026-08-05).** The retirement of the incumbent third-party
> articulation-management application is **not public knowledge**, so it is not named
> here and must not be named in the white paper. The frame is positive and forward:
> **MAP facilitating the high-school CTE articulation process and the opportunities it
> opens.** Everything below works whether or not the reader knows a system is going
> away.

### The mechanism, and the distinction that actually matters

Two things look similar and are not:

| | **HS CTE articulation** (traditional) | **Credit by exam — "Cx"** |
|---|---|---|
| What the college does | Recognizes the HS course as equivalent; may hold credit in escrow | Awards credit by **examination** under Title 5 §55050 |
| How it transcripts | As articulated credit | As **"credit by exam — high school articulation"** |
| **CSU transfer** | **Not recognized for transfer** | **Recognized** |

**⭐ That last row is the whole story, and it is the thing most people in this
conversation do not know** ⟨sourced: Sam, 2026-08-05⟩:

> **CSU does not recognize high-school CTE articulated courses for transfer. CSU does
> recognize Cx.**

⟨inferred⟩ **So the field has already converted — most HS CTE articulation is now
processed as Cx**, and it converted for a *transfer* reason, not a CTE reason. A
college that leaves a student's award as plain articulated credit hands them credit
that dies at the CSU door. Cx is what makes it portable.

This is the single most useful fact in this section, because it reframes the entire
workstream: **HS CTE articulation is not a K-12 pipeline concern that happens to touch
CPL. It is CPL** — specifically, it is credit by exam, one of the five Title 5 §55050
types, applied at scale to teenagers. The monograph says exactly this in its own list
of CPL modes ⟨sourced⟩:

> *"High school coursework via articulation agreements **based on credit by exam**."*

MAP's remit already covers it. Nothing needs to be extended for MAP to be the right
home; it is the same instrument MAP already runs everywhere else.

### How Cx works, step by step ⟨sourced: public college catalogs, verified 2026-08-05⟩

1. College and high-school/ROP faculty align a HS CTE course to a college course —
   course outline, syllabus, textbook, and final exam must be comparable.
2. The student earns an **A or B** in the articulated high-school course.
3. The high-school teacher **certifies the student** against a class roster.
4. The college awards **credit by examination** and transcripts it as
   **"credit by exam — high school articulation."**
5. The student generally must apply and matriculate within a defined window.

**Steps 1, 2, 4 and 5 are ordinary CPL. Step 3 is the part that needs a system** — the
roster, the teacher certification event, the student referral, and the audit trail.
An articulation agreement with no roster system is a document, not a pathway.

### What MAP already has, and what it would need

⟨sourced: `credential_reference_data.js`, 2026-08-05⟩ **The high-school lane is already
the best-populated Learning Partner lane in MAP** — see §7a for the full audit. Roughly
**48 credential entries** already carry a named high school as issuer or training
agency (Fontana, Summit, Birmingham Community Charter, Cajon, Lemoore, Mater Dei,
A.B. Miller, Valley, Century, Cleveland, Jurupa Hills, Colton, Orange, Santiago,
Upland, Corona, University, Irvine, Garden Grove, El Modena, Rancho Cucamonga, Canyon,
CHAMPS, Hanford West, Arroyo Valley, plus a generic **"Local High School"** with 10),
along with **Baldy View Regional Occupational Program**, **Chaffey Joint Union High
School District**, **Fontana Adult School**, and **Learn 4 Life**.

⟨inferred⟩ **This is a genuinely important discovery and it changes the ask.** MAP is
not proposing to enter the high-school articulation business — **colleges have already
been entering high-school articulations into MAP as CPL exhibits.** The three-role
model (§7) fits without modification: the high school is the **Originator**, the
certifying HS instructor is the **Validator**, the college is the **Awarder**.

**What MAP would have to add is step 3 at scale: per-student rosters and teacher
certification.**

⚠ **That is a step-function increase in operational scope, and the paper should say so
plainly.** Everything MAP does today is *standing articulations* — publish once, apply
to anyone. Cx rosters are **per-student, per-term records certified by a non-college
employee**, which brings FERPA obligations and K-12 data-sharing agreements that the
credit-college relationship does not. It should be scoped as **its own workstream**,
not folded into "noncredit," even though both live in this document.

### Why it is worth doing anyway

⟨inferred⟩ Three reasons, in order of force:

1. **It is the only lane in this document that reaches learners *before* they are
   adults.** Every other use case recovers learning after the fact. Cx captures it in
   real time, at 16 and 17, and gives a student a college transcript before they
   graduate high school.
2. **The volume is potentially larger than every other lane combined.** HS CTE
   enrollment dwarfs noncredit CTE. If even a modest share converts, it changes the
   statewide CPL numbers by more than any single agency or partner play.
3. **The Cx/CSU fact makes it a transfer story, not just a CTE story** — which reaches
   a completely different and more powerful set of stakeholders.

### Open ⟨NEEDS SAM⟩

- **Scale**: how many colleges and high-school partners are on the incumbent system
  today? That number sizes the opportunity and nothing in the repos carries it.
- **Is MAP's role decided, proposed, or aspirational?** This determines whether the
  paper says "MAP will," "MAP can," or "MAP could." I have written it as *can*.
- Is there a regional consortium (the San Diego & Imperial model) that should be the
  pilot?

---

## 9. Landing-page architecture — the piece to protect

⟨sourced: deck slides 13–14, 22–25⟩

**Live today:** 116 college CPL landing pages, Program Pathways Mapper Phase 1,
California Virtual Campus integration, Miramar PPM integration, and the AI-assisted
Student CPL Portal.

**In development:** Calbright · Noncredit, Not-for-Credit, Adult Ed, ROP · Rising
Scholars · High School · Agencies (Futuro, EMS Corps, WDB, EDD) · Trades (journey
workers and apprentices) · Industry Partners (CompTIA, NCCER…).

### The two-tab structure is the whole design

Every non-college landing page mockup carries the same control:

> **[ At San Diego College of Continuing Education ] [ To California Community Colleges ]**

⟨inferred⟩ **This is the most consequential design decision in the entire deck**, and
I do not think it has been named as such anywhere. It does three things at once:

1. **It gives the Learning Partner its own front door** — the page is branded to
   SDCCE, Calbright, or CDCR, with their logo, their URL, their contacts, their
   "Upload your JST / CCCApply / Apply for Financial Aid" buttons. The partner is the
   host, not a mention.
2. **It makes the credit destination visible pre-enrollment** — the second tab shows,
   for each credential, exactly which colleges award how many units for which courses.
   This is §5②, the transition intervention that happens before the transition.
3. **It is the recognition mechanism, rendered.** The page *is* the public statement
   that this partner's learning leads to college credit. §7's data layer and §9's
   partner surface are the same object viewed from two sides.

The mockups are consistent across Calbright (yellow/red), SDCCE (purple), and CDCR
Rising Scholars (green) — same grid, same filters, same "Credits: 3–4" chips, same
per-college course/unit tables, same JST footnote. **The template is done. This is a
content and partnership problem now, not a design problem.**

⟨**NEEDS SAM**⟩ Is the two-tab structure locked? Build status and dates for the NC,
HS, agency, and industry-partner pages?

---

## 10. The noncredit portfolio-development course ⟨Sam's new Q3⟩

Sam's idea: a noncredit counseling course, taught by an instructor in person or
online, that guides adult learners through documenting their experience against
**specific CPL opportunities at CCCs**.

⟨inferred⟩ **I think this is the strongest untested idea on the list, and it is bigger
than the framing suggests.** Here is why.

§4 established that Tier 4 portfolio CPL will never scale and must be subsidized
rather than optimized. The cost of portfolio CPL has two halves:

- **Assessment** — faculty time evaluating the portfolio. Irreducible; it is the thing
  being paid for.
- **Development** — student time and staff support producing a portfolio good enough
  to assess. Enormous, invisible, and **the half that actually kills portfolio
  programs**, because nobody funds it and most students abandon the process partway.

**A noncredit course *is* a funding mechanism for the development half.** Noncredit
generates apportionment on contact hours. If the course qualifies under **CDCP**, it
draws the enhanced rate.

**And the CDCP category question now has a strong answer.** The Chancellor's deck lists
the CDCP program areas explicitly ⟨sourced: Christian slides 6–7⟩: **Workforce
Preparation**, **Short-Term Vocational Training**, ESL, and basic skills. A course that
teaches an adult learner to document their work experience against specific college
credit opportunities is **squarely workforce preparation** on any plain reading — it is
preparation for entry into a workforce-credentialing pathway, taught to incumbent and
returning workers.

⟨inferred⟩ That moves this from "an idea that might be fundable" to **"an idea that
fits an existing funding category the state created in 2006 for exactly this kind of
pipeline-building."** It still needs the formal read (§12), but it is no longer
speculative.

**So: the state pays for portfolio development, through the existing noncredit
apportionment mechanism, at no new cost and requiring no new appropriation.** The
student pays nothing. The college gets FTES for instruction it is currently providing
for free as counseling overhead, or not providing at all.

⟨**NEEDS VERIFICATION** before printing: (a) CDCP category eligibility for a
portfolio-development course; (b) the current CDCP rate relative to the credit base
rate — SB 860 equalized them, but I will not print a specific figure without checking
the 2025-26 SCFF rates; (c) whether a course whose output is a CPL petition raises any
conflict-of-interest or self-dealing concern.⟩

**Why it compounds with everything else in this document:**

- It is a **noncredit course that produces credit awards** — the cleanest possible
  demonstration of the §2 thesis.
- Its enrollment is a **leading indicator** the funding model can measure (§11) —
  cheaper and earlier than counting transcribed units.
- It creates a **staffed human being** whose job is CPL conversion at the Learning
  Partner, which is the actual missing role in most of these pathways.
- It pairs directly with the **Portfolio Builder** already in development (deck slides
  20–21: seven sections, completion tracking, document upload with type tagging) and
  the **Student CPL Portal** (slide 19: potential credits across all colleges, portfolio
  completion %, course opportunities). **The software exists and has no
  instructional wrapper. This is the wrapper.**

**Is anyone doing this now?** ⟨inferred, needs research⟩ The national analogues are
well established — CAEL's LearningCounts, and PLA-portfolio courses at Thomas Edison
State and Empire State — where a for-credit course carries portfolio development. **I
have not verified any California noncredit program running this against specific CCC
CPL opportunities, and I am not willing to assert either way without checking.** This
is the highest-value open research item in the document; if nobody is doing it, that
is the paper's flagship proposal, and if someone is, they are the pilot.

---

## 10a. The sector is growing fast, and that changes the framing

⟨sourced: Christian, Noncredit Summit, slides 11–13 — COMIS⟩

| Measure | 2012-13 | trough | **2024-25** |
|---|---:|---:|---:|
| Distinct students in ≥1 **noncredit CTE** course (SAM A/B/C) | 45,209 | 32,453 *(2020-21)* | **69,488** |
| Distinct students **earning noncredit awards** | 6,291 | — | **29,649** |

**Noncredit awards are up 4.7× over the series; CTE noncredit enrollment is up 114%
from the 2020-21 trough and 54% over the full series — with the steepest climb in the
last three years.**

And the outcome holds up ⟨slide 13⟩: median quarterly wage for noncredit students goes
from **$7,833** in the quarter before entry to **$10,479** one year after exit or
award — **+34%**.

⟨inferred⟩ Three consequences for the paper:

1. **This is not a small or declining sector being offered a lifeline.** It is one of
   the fastest-growing completion engines in the system. Lead with growth, not need.
2. **29,649 noncredit awards a year is the addressable population for UC-2.** Every one
   is a documented, college-issued credential — the cleanest possible CPL evidence —
   and today essentially none are systematically crosswalked to credit. **That number
   is the size of the prize.**
3. **The wage gain answers "why bother converting to credit."** Noncredit already
   produces a 34% wage lift on its own. CPL is what lets that learner keep climbing
   without paying twice for the first rung.

---

## 10b. Three 2026 commitments this work already has to deliver

⟨sourced: Christian, Noncredit Summit, slide 21⟩

The Chancellor's deck closes its noncredit section with dated commitments. **All three
are noncredit-CPL infrastructure, and all three are 2026:**

- **"AI-enabled dashboard to match noncredit, ROP, and adult ed training to college
  courses for potential CPL (2026)"**
- **"AI-enabled common course crosswalk to standardize course identifiers (noncredit
  and credit) to facilitate CPL (2026)"**
- **"AI-enabled skills to outcomes alignment (noncredit and credit) to facilitate CPL
  (2026)"**

⟨inferred⟩ **This reframes the whole document from proposal to delivery plan**, and it
may be the most useful thing the Chancellor's deck contributes.

Commitment ② is **already substantially built** — it is the M-ID / unified-course
identity layer in this repository, the canonical-SUBJ4 fold, and the CCR curation work.
It was built for the credit side. **Extending it to noncredit course identifiers is
the stated commitment**, and that is an increment on existing infrastructure, not a new
system.

Commitment ① is the noncredit matching engine — §7's `training_agency` population plus
§9's landing pages, viewed from the Chancellor's side of the table.

Commitment ③ is the SLO / skills-to-outcomes work already parked as Roadmap Phase 4.

**So the white paper is not asking permission to start. It describes how three
already-announced 2026 commitments get met**, with the §3 taxonomy as the specification
for what they have to handle. That is a considerably stronger posture and should set
the paper's tone throughout.

⟨inferred⟩ It also gives the taxonomy an acceptance test: **if a use case in §3 cannot
be served by ①②③, either that use case needs a different mechanism, or the commitments
need scoping we have not done yet.** Worth walking the twelve cases against the three
commitments once the taxonomy settles.

---

## 11. Funding — parked, deliberately

> **Sam, 2026-08-05:** *"Keep the focus of this endeavor primarily on understanding and
> scaling NC Universe CPL and then we will take what we've distilled and see how it
> best applies to the funding formula. I don't want to get caught in the weeds of
> funding model until we first have a clear grasp of all the moving parts and
> opportunities."*

**So this section is a holding pen, not a recommendation.** It records the arithmetic
and the two data defects so nobody re-derives them later, plus one structural finding
that should inform metric design whenever we return. **The metric ladder below is a
sketch to react to, not a proposal to adopt.**

Order of operations: finish §3–§10 (the moving parts), *then* decide what behavior we
want to pay for, *then* design the metric. Designing the metric first is how you end up
paying for the thing you can measure instead of the thing you want.

**Sam's earlier framing (2026-08-05), retained as the working assumption for when we
come back: FTES sets the pot; behavior distributes it.**

### The FTES arithmetic ⟨sourced: `cpl_funding_data.js`, 2025-26 MIS DataMart⟩

| Denominator | NC FTES | NC share | Pure-FTES cut of $25,240,308 |
|---|---:|---:|---:|
| All NC FTES, wherever it sits | 102,427 | **8.74%** | **$2.21M** |
| Same, minus Calbright | 80,989 | **7.04%** | **$1.78M** |
| Standalone NC institutions only (the 4) | 45,433 | **4.08%** | **$1.03M** |
| Standalone, minus Calbright | 23,995 | **2.19%** | **$554K** |
| *Today's carve-out* | — | *3.96%* | *$1.00M* |

Credit FTES across the 115 colleges: **1,069,182**. Pool: **$25,240,308**.

**Three findings that matter more than the table:**

1. **The current $1M carve-out is a pure-FTES split, to within a rounding error** —
   under the "standalone institutions only" denominator, FTES says **$1,028,830**
   (4.08%) and the model holds **$1,000,000** (3.96%). That is a **2.8% difference on
   a number nobody set that way.** Sam's instinct was right, and it can now be *shown*
   to be right rather than asserted — which is a far stronger position to defend a
   carve-out from than "it seemed like the right order of magnitude."

2. **Roughly two-thirds of statewide noncredit FTES sits inside the 115 credit
   colleges** — 67,823 of 102,427 (66%). Mt. SAC is **28.8%** noncredit, Santiago
   Canyon **33.7%**, Santa Ana
   **32.8%**, Saddleback **25.2%**, Gavilan **24.0%**, San Francisco **23.1%**, Glendale
   **21.4%**. Those colleges earn from the credit pool and their noncredit operation is
   invisible to the model. **This, not the $1M, is the real gap.**

3. **Two data defects must be fixed before any of this drives a dollar.**
   **(a)** Mt. SAC's 10,829.3 NC FTES appears in *both* the college row and the
   `Mt. SAC NC` standalone entry — a double count in any naive sum.
   **(b)** Calbright's 21,438 NC FTES on 2,484 headcount (8.6 FTES/student) is
   impossible and is already flagged in the funding handoff. It is **21% of all
   statewide NC FTES** and it moves the answer by 1.7 percentage points on its own.

### Why FTES is the wrong distributor even though it is the right sizer

⟨inferred, and this follows directly from §6⟩ Noncredit FTES measures **contact hours
delivered** — that is, seat time sold. But the entire noncredit CPL proposition is
**recognizing competency instead of delivering contact hours**. A Learning Partner
that succeeds at CPL *reduces its own FTES*.

**Funding noncredit CPL on noncredit FTES pays partners for the behavior CPL is
designed to replace.** That is not a rounding error; it is an inverted incentive, and
it is the same mechanism that produces the "waive but don't record" practice in §6.

Hence Sam's chosen structure, which I think is exactly right: **FTES sizes the pot
(it is the honest measure of sector scale, and it justifies more than $1M), and
behavior distributes it.**

### Recommended NC metric set

The model's current feeder metric is *"CPL-ready noncredit completions handed off to a
partner credit college."* ⟨inferred⟩ That is the right **concept** and probably not yet
a countable **quantity** — it requires knowing that a specific noncredit completer
enrolled and was awarded at a specific college, which is the same identity-resolution
problem that blocks P1 completion data. Proposing a metric we cannot compute repeats a
known failure.

**So: a ladder, matching the P1/P2/P3 pattern already in the model — each rung
countable today, each rung a leading indicator of the next.**

| | Metric | Why | Countable today? |
|---|---|---|---|
| **NC-1** | **Standing articulations published** — mirrored courses and NC-certificate crosswalks live in MAP | Pays for the Tier-1/Tier-2 work that makes everything else cheap. Front-loaded, exactly like P1. | **Yes** — it is MAP data |
| **NC-2** | **Credit awarded to learners whose `training_agency` is this partner** | The real outcome. Uses the §7 build; each award is attributable. | **Once §7 is populated** |
| **NC-3** | **Landing-page-originated CPL requests** | Mirrors P3 (portal/landing-page origin) exactly; measures pre-matriculation reach | **Yes**, once NC pages ship |

⟨inferred⟩ **NC-1 deserves the highest price factor.** The model's factor mechanism
(`price = factor × base rate`) exists precisely to pay a premium for the harder,
more valuable behavior — and standing articulations are the behavior with the largest
downstream multiplier in this entire document. Paying a premium for articulation
*construction* is the noncredit analogue of P1's front-loaded logic.

### On the in-college noncredit gap (finding 2)

⟨inferred⟩ I would **not** fix this by splitting the college pool. Mt. SAC's noncredit
operation should earn on **NC-1 and NC-2 alongside the standalone institutions** — the
metrics are institution-agnostic by construction, so a college with a large noncredit
operation can earn on it without any change to the credit allocation basis. That keeps
`allocation_basis: ftes` intact (the guard in `cpl_funding_basis.test.js` stays true:
colleges carry credit FTES only) and avoids reopening a settled allocation.

**The advisory NC sub-line shipped in #976 is the right display for this today.** The
question this document opens is whether it should become *earnable* through NC-1/NC-2
in a later revision. That is a policy call, not a build call, and it should be Sam's.

⚠ **Do not switch the feeder split from headcount to NC FTES** without first excluding
Calbright — the handoff already establishes this, and finding 3(b) is why.

---

## 12. Open items

**Sam's 2026-08-05 answers cleared six of the original blockers.** What remains:

### ⟨NEEDS SAM⟩ — still open

1. **HS articulation scale** (§8): how many colleges and high-school partners are on the
   incumbent system today? That number sizes the biggest-volume lane in the document.
2. **Is MAP's HS role decided, proposed, or aspirational?** (§8) — determines whether
   the paper says "MAP will," "MAP can," or "MAP could." Written as **can**.
3. **Landing pages** (§9): is the two-tab structure locked; build status and dates for
   the NC, HS, agency, and industry-partner pages.
4. **Rising Scholars back-catalog** (§3 UC-10): can CDCR say how many already-released
   learners hold CDCR-delivered credentials no college has evaluated?
5. **Calbright FTES** (§3 UC-12, §11): needs Malone before Calbright appears anywhere
   external.
6. **The "44 non-CCC dental programs" and "4,200–7,000 candidates" figures** (§3 UC-6,
   §7a): unverifiable from anything in the record. Where did they originate? Otherwise
   cite as estimates or drop.

### ✅ Answered 2026-08-05

| | Answer |
|---|---|
| **CATEMA** | Not public — reframed as **MAP facilitating HS CTE articulation**, with the Cx/CSU transfer distinction as the mechanism (§8) |
| **EMS Corps units** | East LA **is** in MAP; use the statewide EMT exhibit's **7.5–14 hours** (local awards 0.5–12.3) (§3a, §7a) |
| **EMS Corps mechanism** | **ISA**, not RSI (§3a) |
| **NC-CPL demand** | Sam unsure → **recommendation supplied**: ship Route A, instrument the question at Office Hours + Summit (§6) |
| **Rocio** | ✅ cleared by name, her own authorization (§3 UC-6) |
| **Dental "24 CCC"** | ✅ substantially confirmed — COCI shows **27** (§7a) |
| **Audience / deadline** | **Internal**, today. Hence: everything in one place, gaps and opportunities marked |
| **Monograph** | Read in full. Dated but valid; noncredit content is genuinely thin — see the appendix note |

### ⟨NEEDS VERIFICATION⟩ — I can do these

7. **Whether any California noncredit program runs an instructor-guided portfolio course
   against CCC CPL opportunities** (§10) — **the highest-value open research item.** If
   nobody does, it is the flagship proposal; if someone does, they are the pilot.
8. **CDCP rate** for a portfolio-development course (§10). Category largely answered
   (Workforce Preparation is an enumerated CDCP area); the 2025-26 SCFF rate and the
   formal eligibility read are outstanding.
9. **Title 5 / PCAH position on competency substitution inside a noncredit certificate**
   (§6) — the load-bearing legal claim behind Route D.
10. **Financial-aid and momentum-eligibility treatment of CPL units** (§5⑤).

### ⭐ Recommended next moves — ranked by value ÷ effort

1. **Populate the four standalone noncredit institutions in MAP** (§7a Finding 1). They
   are at **absolute zero** across 1,987 credential titles while ~48 high-school entries
   exist. Highest value-to-effort ratio in the document — it is data entry, and it
   unblocks every partner-recognition mechanism in §7.
2. **Reframe EMS Corps as outreach, not articulation-building** (§3a, §7a Finding 2).
   28 colleges already carry the statewide EMT exhibit at a **75.6% transcription rate**.
   Build the landing page; it *is* the outreach vehicle.
3. **Enumerate dormant statewide exhibits** (§7a Finding 3) — statewide exhibits ranked
   by (colleges published × zero uptake). Three Cal-JAC EMS exhibits sit at 16
   college-slots with zero students. **One query, and it yields an outreach worklist
   rather than a build backlog.** Likely dozens more across every sector here.
4. **Write the mirroring playbook** (§3 UC-1) — the lead recommendation, already named
   as statewide practice by the Chancellor, with two documented instruments (summative
   exam · CPL rubric). It needs to exist.
5. **The 26-college dental list** (§7a Finding 4) — 27 CCCs teach dental assisting, one
   awards RDA CPL at 99.5% conversion. That is a named, specific outreach list today.
6. **Run the noncredit-waiver question** at Office Hours + the Summit (§6) — ~14
   conversations, one month, converts an unknown into a measured thing.
7. **Resolve generic partner names** — "Local High School" (10), "Adult School (varies)"
   (§7a Finding 5). A precondition for partner-facing surfaces, not a later cleanup.
8. **Walk the twelve use cases against the three 2026 commitments** (§10b) — the
   acceptance test for whether the taxonomy and the announced roadmap actually meet.
9. **Fix the two funding data defects** (§11) — Mt. SAC double count, Calbright.

---

## Appendix — source inventory

| Source | Location | Used in |
|---|---|---|
| Vision 2030 Noncredit Summit deck, Fall 2025 (33 slides; Lee/Decelle) | uploaded | §3, §3a, §5, §9 |
| **Chancellor Christian — Vision 2030 Noncredit Summit keynote, Oct 2025 (22 slides; CPL section from slide 14)** | uploaded | §2, §3 UC-1, §3a, §6, §10, §10a, §10b |
| Apprenticeship & Noncredit Education one-pager (2026) | uploaded | §3 UC-8 |
| `kb/credentials.json` — 2,188 entries, issuing/training agency | tracker | §7 |
| `cpl_funding_data.js` — 2025-26 DataMart credit + NC FTES, pool config | tracker | §11 |
| **`credential_reference_data.js`** — 1,987 unified titles, 4,240 articulation lines, issuer/trainer | tracker | **§7a** |
| **`coci_lookup_data.js`** — 141,738 COCI course rows (dental program counts) | tracker | **§7a** |
| `docs/cpl_funding_handoff.md` — NC decision, Calbright flag, #976 | tracker | §11 |
| **Scaling CPL in California (Oct 2024) — full 32-page monograph** | uploaded 2026-08-05 | §3 UC-1 (the summative-exam passage), §8; see the note below |
| CPL — Perspectives for Policy & Advocacy, CTE lens (2026-07-19) | CPLBrain | §3 UC-2, UC-8 |
| BOG prep — NOCCCD/NOCE (2026-07-06) | CPLBrain | §3 UC-2 |
| ESS 25-82 funding memo; CPL Initiative Report 2026 | public KB | §11 |
| Public college catalogs on Cx and CATEMA (Palomar, Los Medanos, Cosumnes River, Las Positas, SD & Imperial consortium) | web, 2026-08-05 | §8 |

> **Note on the monograph — resolved 2026-08-05.** Sam supplied the full 32-page
> *Scaling Credit for Prior Learning in California* (the KB and vault copies are 62- and
> 70-line distillations). **He flagged it as "a bit dated but I think still valid," and
> that reads correctly** — the framework, CPL types, modes, and academic process hold;
> the status counts are superseded by the dashboards, and it describes "the two
> continuing and adult education campuses" where there are now four standalone
> noncredit institutions.
>
> **On the original ask — "pay close attention to the sections on NC CPL":** honestly,
> **there aren't sections.** Across 32 pages, "noncredit" appears **six times**, "ROP"
> twice, "adult ed" once. The noncredit content is (a) one bullet in the CPL-modes list
> and (b) **one genuinely valuable passage** in "The Academic Process" describing the
> noncredit→credit summative-exam mechanism — now quoted in full at §3 UC-1, where it
> earns its place as the documented instrument behind mirroring.
>
> So the honest finding stands and is worth stating plainly in the paper: **the
> monograph does not have a noncredit strategy. Neither does the public KB** — eight
> files mention noncredit, one or two lines each. The decks, the MAP data, and this
> document are well ahead of the written record. **That gap is itself the argument for
> the white paper.**
>
> One thing the monograph *does* settle, quietly: its CPL-modes list already reads
> *"High school coursework via articulation agreements **based on credit by exam**"* —
> i.e. the Cx framing in §8 is not new positioning, it is what the initiative has said
> all along.
