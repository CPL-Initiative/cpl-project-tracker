---
title: "Noncredit & Learning-Partner CPL — a thinking document"
date: 2026-08-05
status: internal-cogitation
audience: "Sam Lee — pre-white-paper. NOT publishable as-is."
tags: [noncredit, not-for-credit, adult-education, rop, high-school-articulation, apprenticeship, cpl, funding, learning-partners, thinking-doc]
artifacts:
  - "Vision 2030 Noncredit Summit Fall 2025 deck (33 slides, Lee/Decelle)"
  - "Apprenticeship & Noncredit Education one-pager (2026)"
  - "kb/credentials.json — issuing_agency / training_agency"
  - "cpl_funding_data.js — 2025-26 MIS DataMart credit + noncredit FTES"
related:
  - "[[docs/cpl_funding_handoff]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[cpl-knowledge-base/research/scaling-cpl-california-2024]]"
---

# Noncredit & Learning-Partner CPL — a thinking document

> **What this is.** The long-form cogitation Sam asked for on 2026-08-05, ahead of a
> white paper. It carries the full use-case taxonomy, the funding analysis with real
> numbers, and the open forks. It is **internal**: §11 contains allocation math that
> should not travel without a decision about what's shareable. The white paper gets
> **carved out of this**, not appended to it.
>
> **Confidence marking.** Claims are tagged ⟨sourced⟩ (traceable to a document or
> dataset in the appendix), ⟨inferred⟩ (my analysis from sourced material), or
> ⟨**NEEDS SAM**⟩ (a factual dependency I cannot resolve from the record).

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

**The corollary that organizes everything below.** CPL's cost is not the credit — the
credit is free to issue. The cost is **the assessment**: faculty time spent
establishing that this learner knows this material. Every scaling move in CPL is a
move that reduces, amortizes, or subsidizes assessment cost. That single lens sorts
the eleven use cases into a ladder (§4) and produces the funding recommendation (§11).

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

**Market context ⟨sourced: deck slide 11⟩:** Dental Assisting — **24 CCC programs, 44
non-CCC**, with an estimated **4,200–7,000 annual CPL candidates**. Nearly **two-thirds
of the training capacity in this field sits outside the community colleges.** That
ratio is the paper's most quotable structural fact: in at least one high-demand
allied-health field, the majority of the pipeline is Learning Partners.

⟨**NEEDS SAM**⟩ Is Rocio cleared by name for external use? Is the 4,200–7,000 estimate
methodologically defensible enough to print?

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

### UC-10 · Justice-involved learning ⟨sourced: deck slide 25⟩

Rising Scholars landing page in development, CDCR-branded, welding credentials (AWS,
NCCER) mapped across LA Trade Tech, San Diego City, Fresno City, Long Beach City,
Bakersfield, Mt. SAC, Riverside City, Cerritos, Pasadena City, Santa Monica, Orange
Coast, Fullerton. Same landing-page architecture, different sponsor.

### UC-11 · CPL toward a *noncredit* award — Sam's "oxymoron" — see §6

---

## 4. The scalability ladder — the central analytic move

Sort the eleven use cases by **marginal assessment cost per award**:

| Tier | Assessment happens | Priced per | Marginal cost of the Nth award | Use cases |
|---|---|---|---|---|
| **1** | **During instruction**, by the teaching faculty, pre-approved | course, once | ~$0 | UC-1 mirrored, UC-5 statewide exhibits |
| **2** | **Once per credential**, by a faculty crosswalk | credential | ~$0 after setup | UC-2 NC certificates, UC-5 local exhibits, UC-8 JATC crosswalks |
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

⟨**NEEDS SAM**⟩ Is this real demand from named colleges? Which ones, and in which
certificate sequences? A concrete example with a named program makes route D arguable
and keeps it from reading as a hypothetical.

---

## 7. Recognizing Learning Partners in the CPL lifecycle ⟨Sam's Q4⟩

**Sam's decision (2026-08-05): data layer + partner surface.**

### The finding that makes this buildable now

**The schema already exists and is pointed at the wrong sector.**
`kb/credentials.json` carries, for every credential, a distinction between:

- **`issuing_agency`** — who awards the credential
- **`training_agency`** — who *taught* it

**2,188 credential entries. 374 (17.1%) carry a training agency.** Today those are
trade JATCs (Carpenters Training Committee for Northern California: 97), CAL FIRE
(31), the U.S. Armed Forces (30), UA Local 342 JATC (23), Iron Workers Training
Center (17), Sacramento Electrical Training Center (11) — **and exactly one high
school, Fontana High School (9).**

**Zero noncredit colleges. Zero adult schools. Zero ROPs.**

⟨inferred⟩ The apprenticeship world already populated this field because the sponsor
*is* the trainer and the distinction was unavoidable. The noncredit world never did,
because nobody asked the question. **The infrastructure for recognizing Learning
Partners was built as a side effect of the trades work and has never been pointed at
noncredit.** That is a genuinely fortunate position: this is a data-population
project, not a schema project.

### The three-role model the paper should establish

Every CPL award has three roles, and today the system records one:

| Role | Who | Recorded today? |
|---|---|---|
| **Originator** — taught the learning | NOCE, an adult school, an ROP, a JATC, an employer | `training_agency`, 17% populated, no NC |
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

## 8. The CATEMA void and how HS Cx actually works ⟨Sam's Q1⟩

### How Cx works ⟨sourced: public college catalogs, verified 2026-08-05⟩

1. College and high-school/ROP faculty align a HS CTE course to a college course —
   course outline, syllabus, textbook, and final exam must be comparable.
2. The student earns an **A or B** in the articulated high-school course.
3. The high-school teacher **certifies the student** against a class roster.
4. The college awards **credit by examination** and transcripts it as
   **"credit by exam — high school articulation,"** as required by Title 5.
5. The student generally must apply and matriculate within a defined window.

**CATEMA — the Career And Technology Education Management Application — is step 3.**
It is the web application where college and secondary staff enter, update, and report
articulation outcomes, and where teachers hold class rosters and refer students for
credit. ⟨sourced: Palomar, Los Medanos, Cosumnes River, Las Positas⟩

### Why the sunset matters more than it sounds

⟨inferred⟩ **The articulation agreements survive a CATEMA sunset. The plumbing does
not.** What disappears is the roster, the teacher certification event, the referral,
and the audit trail — the entire mechanism by which a student who earned an A in a
high-school course becomes a student the college can transcript. An articulation
agreement with no roster system is a document, not a pathway.

⟨inferred⟩ **MAP is unusually well-suited to absorb this**, because Cx is structurally
a **Tier 3 use case that MAP already handles in another costume.** A high-school
articulation is an exhibit whose Originator is the high school, whose Validator is the
teaching HS instructor, and whose Awarder is the college — the exact three-role model
from §7, with the same `training_agency` field already waiting (and Fontana High
School already sitting in it). The high-school landing page is already on the build
list (§9).

⚠ **But this is a step-function increase in scope**, and the paper should say so
plainly. Cx brings **individual student rosters and per-student teacher certification**
into MAP. That is a different operational posture from publishing standing
articulations, and it carries FERPA and K-12 data-sharing obligations that the
credit-college relationship does not. It should be scoped as its own workstream, not
folded into "noncredit."

### ⟨**NEEDS SAM** — I cannot write this section without⟩

**Nothing in any of the three repositories mentions CATEMA.** Public sources still
show it operating. Everything below is a dependency:

1. **Who** is sunsetting it, and on what **date**?
2. **How many** colleges/districts and high-school partners are on it?
3. Which functions must MAP replace — rosters? teacher certification? student
   referral? transcript triggering? reporting? all of it?
4. Is MAP's role **decided, proposed, or aspirational**? This determines whether the
   paper says "MAP will" or "MAP could."
5. Is there a regional consortium (the San Diego & Imperial model) that should be the
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
generates apportionment on contact hours. If the course qualifies under **CDCP** — and
"workforce preparation" is the plausible category — it draws the enhanced rate.

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

## 11. Funding — the numbers, and what the NC metric should be

**Sam's decision (2026-08-05): FTES sets the pot; behavior distributes it.**

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

### ⟨NEEDS SAM⟩ — blocking

1. **CATEMA** (§8): who, when, scale, which functions, and whether MAP's role is
   decided/proposed/aspirational.
2. **NC-CPL demand** (§6): which colleges, which certificate sequences, real or
   hypothetical.
3. **Landing pages** (§9): is the two-tab structure locked; build status and dates.
4. **Feeder metric** (§11): is the current metric a target or a placeholder, and what
   is actually countable in MAP for a noncredit campus today?
5. **Story clearances** (§3): Rocio by name? EMS Corps? Real estate? The 4,200–7,000
   dental-assisting estimate?
6. **Audience and deadline** for the white paper, and what decision it must survive.

### ⟨NEEDS VERIFICATION⟩ — I can do these, they just need doing

7. CDCP category eligibility and current rate for a portfolio-development course (§10).
8. Whether any California noncredit program runs an instructor-guided portfolio course
   against CCC CPL opportunities (§10) — **highest-value research item in the document.**
9. Title 5 / PCAH position on competency substitution inside a noncredit certificate
   (§6) — the load-bearing legal claim.
10. Financial-aid and momentum-eligibility treatment of CPL units (§5⑤).

### Recommended next moves, independent of the above

11. **Fix the two funding data defects** (§11.3) — Mt. SAC double count, Calbright.
12. **Populate `training_agency` for the four standalone institutions and the NOCE
    five** (§7) — small, concrete, and it unblocks NC-2.
13. **Write the mirroring playbook** (§3 UC-1) — the highest-yield artifact for the
    field, and the paper's lead recommendation needs it to exist.

---

## Appendix — source inventory

| Source | Location | Used in |
|---|---|---|
| Vision 2030 Noncredit Summit deck, Fall 2025 (33 slides; Lee/Decelle) | uploaded | §3, §5, §9 |
| Apprenticeship & Noncredit Education one-pager (2026) | uploaded | §3 UC-8 |
| `kb/credentials.json` — 2,188 entries, issuing/training agency | tracker | §7 |
| `cpl_funding_data.js` — 2025-26 DataMart credit + NC FTES, pool config | tracker | §11 |
| `docs/cpl_funding_handoff.md` — NC decision, Calbright flag, #976 | tracker | §11 |
| Scaling CPL in California (Oct 2024) | public KB | §2 — NC content is one line; see note |
| CPL — Perspectives for Policy & Advocacy, CTE lens (2026-07-19) | CPLBrain | §3 UC-2, UC-8 |
| BOG prep — NOCCCD/NOCE (2026-07-06) | CPLBrain | §3 UC-2 |
| ESS 25-82 funding memo; CPL Initiative Report 2026 | public KB | §11 |
| Public college catalogs on Cx and CATEMA (Palomar, Los Medanos, Cosumnes River, Las Positas, SD & Imperial consortium) | web, 2026-08-05 | §8 |

> **Note on the monograph.** Sam asked me to pay close attention to the NC sections of
> *Scaling CPL in California*. **Both copies available to me — the public KB version
> and the CPLBrain vault copy — are distillations (62 and 70 lines), not the 38-page
> original.** Noncredit appears once, as an item in "CPL modes/settings." If the full
> monograph has substantive NC sections, **I have not read them** — please point me at
> the original and I will fold it in.
>
> Related and worth noting on its own: across the entire public KB, **eight files
> mention noncredit, one or two lines each.** The deck is substantially ahead of the
> written record. That gap is itself an argument for the white paper.
