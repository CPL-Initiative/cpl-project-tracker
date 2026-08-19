---
title: College-scoped occupation → CPL crosswalk (SJCOE ↔ San Joaquin Delta) — lessons
date: 2026-08-19
tags: [lessons, partners, crosswalk, occupations, colleges, cpl, sjcoe, delta]
artifacts:
  - kb/_build_college_offering_crosswalk.py
  - kb/delta_offering_map.json
  - kb/college_crosswalk_out/2026-08-19-delta/
related:
  - "[[CLAUDE]]"
  - "[[docs/partner_crosswalk_lessons]]"
  - "[[docs/kb-notes/methodology-partner-occupation-crosswalk]]"
---

# College-scoped occupation → CPL crosswalk — lessons

Workstream scratchpad. Append a dated section every checkpoint.

---

## 2026-08-19 — SJCOE ↔ San Joaquin Delta College, run 1

### What prompted it

**Ashley again, continuing the work she opened in Session 121.** The statewide SJCOE
crosswalk (2026-08-05, `docs/partner_crosswalk_lessons.md`) answered *"where in
California can our students get credit for these occupations?"*. She now needs the
other half, for a meeting with one college: *"what does San Joaquin Delta College
itself have, and where could CPL be built?"*

### What we learned

**1. ⭐ The college-scoped question is a different question, and the partner tool
answers it wrong.** The statewide tool deliberately does not privilege the partner's
in-county college — right for a referral, wrong for a partnership meeting where the
whole question is what ONE college can do. They also disagree about what a good
answer looks like: the partner tool's best outcome is *"some college already offers
this"* (a fact); this one's best outcome is *"this college teaches the content AND
the exhibit exists AND nobody joined them up"* (a task). Same inputs, different
instrument — the Futuro/HTH lesson (match the instrument to the question's shape,
not to the word "crosswalk") holds a second time.

**2. ⭐ THE FINDING: keep "does the college teach it" and "does an exhibit exist"
in SEPARATE columns.** Collapsing them into one match score destroys the only
distinction the meeting needs. Crossed, they produce the deliverable:

| | Exhibit exists, Delta flagged | Exhibit exists, not listed | Nothing anywhere |
|---|---|---|---|
| **Delta teaches it** | **42 — adopt now** | 4 | **6 — build first-in-state** |
| Partial | 18 | 12 | 8 |
| Nothing | 8 | 20 | 21 |

**42 occupations need no new curriculum and no new exhibit — only an articulation.**
That single cell is the meeting.

**3. ⭐ Delta has adopted ZERO of the 139, and that is not the same as Delta doing
no CPL.** It carries 69 exhibits — 68 AP/CLEP, plus POST Basic Academy. The August
run already reported "69 credentials, exactly ONE career/technical"; what this run
adds is that the one is not on SJCOE's list either. A college can look active in MAP
and be entirely absent from the occupations a partner actually cares about.

**4. ⭐ Delta holds curriculum for the statewide gap the first run found.** The
August run's headline gap was the hydro/utility cluster — lineworker, hydro plant
operator/mechanic, substation, metering, gas control — with **zero CPL anywhere in
California**. Delta runs a utility/hydroelectric apprenticeship almost no other CCC
has: `A IND 77A–77N` (turbines, governor systems, plant auxiliary equipment,
*Computers in Hydro-Electric Plants*, *Water Aqueduct Systems*) and `A ELE 75A–75F`
(*Transformers and PCB*, *Protective Relaying*, *High Voltage Switching*). Six
occupations are confirmed-fit with nothing to adopt — a first-in-state build.
⚠️ **Lineworker is NOT among them** — that series is substation and plant
electrical, not line work, and conflating the two in the meeting would be a
credibility error.

**5. ⚠️ A capability can be invisible to a program search.** Delta's ten-course
plumbing apprenticeship (`A CON 87A–90D` — water supply, gas installation, drainage,
code, medical gas) sits under **no plumbing-named COCI program**, and the `A CON`
prefix reads as *construction* while the content is *plumbing*. MAP lists Delta as
neither adopter nor potential on **C-36 Plumbing Contractor**, a statewide exhibit —
i.e. *MAP does not know Delta has the capacity*. Searching programs alone would have
returned "no plumbing at Delta". **Search the COURSE catalog, not just the program
inventory**, and expect the prefix to lie.

**6. ⚠️ A shared prose block will over-claim on the rows it was not written for.**
The utility text asserted "these occupations have ZERO CPL anywhere" — true for five
rows, **false for `Plant Operator` and `Hydro Plant Operator`**, which do have local
wastewater exhibits. Caught only by cross-checking each row's own computed
`map_status` against its authored prose. In a document going into a room with a
college, one over-claim discredits the other 138 rows. There is now a check that
fails any row whose prose claims absence while its exhibit list is non-empty.

**7. Narrative copy is a FINDING, so it lives with the rulings, not in the
generator.** The first cut hardcoded "Delta has no fire technology" into the script,
which would have made the reusable-engine docstring a lie. The run-specific copy now
lives in `kb/delta_offering_map.json` under `_narrative` with `{college}`/`{n1}`
placeholders; the generator carries no college-specific claim and refuses to run
against a map with no `_narrative`. Same principle as the partner tool's "persist
the judgment, not the run" — extended from the rulings to the prose.

**8. Priority is DERIVED, never authored.** It is a pure function of
(fit × exhibit status). Hand-ranking would let the order drift from the two columns
it claims to summarise.

### The numbers

139 occupations · **52 confirmed** Delta offering · 38 potential · 49 none ·
**42 Priority-1 (adopt now)** · **6 Priority-2 (build first-in-state)** ·
**0 articulated at Delta today** · 68 occupations where MAP flags Delta as a
potential adopter. Delta inventory: 251 active/approved COCI programs (184 CTE),
1,449 courses, 98 subjects.

Best effort-to-reach ratios: **ServSafe / food-manager** (four exhibits, one course
— `CUL ART 3`, and school nutrition staff hold these near-universally);
**EMT + Paramedic** (Delta teaches the full `H S 87` + `H S 89A–F` sequence, both
exhibits statewide, Delta flagged potential, adopted neither); **AWS welding**
(certificates organised BY PROCESS — SMAW / GMAW-FCAW / GTAW — the same axis the AWS
exhibits are keyed on); **CompTIA** (`ELECT 14C` is literally named *IT Essentials
(A+)*); **ASE A2/A3** (three exhibits, one course cluster).

Largest genuine gap: **fire technology — 17 occupations, no Delta instruction at
all** (the only fire-named course is `ELEC 41 Fire Alarm Systems`, an electrical
course). This is the best-covered cluster statewide, so it is purely a referral or
build decision. Also absent: carpentry/drywall, masonry/concrete/tile,
cosmetology/barbering, lineworker, surgical tech, sterile processing, coding/billing.

### Current state

Shipped: the generator, `kb/delta_offering_map.json` (139 rulings + narrative), and
the run receipt. Workbook (6 tabs) and HTML visual delivered to Ashley; both are
regenerable artifacts and are gitignored per the repo artifact policy.

### Strategic roadmap

- **The offering map is per college and compounds the same way the occupation map
  does** — a second college's run inherits the occupation→credential rulings free
  and pays only for its own offering judgments.
- **This finally gives the partner engine its second run**, in a sense the August
  lessons doc asked for — but it is a *college* run, not a second occupation list.
  The "coverage compounds" claim for the shared occupation map is still
  undemonstrated; a second partner list remains the outstanding test.
- **The 42 Priority-1 rows are a worklist, not a report.** If Delta adopts even a
  handful, the same instrument re-run shows movement — worth re-running after the
  meeting to measure it.

### Next concrete step

Ashley takes the workbook and the visual into the Delta conversation. Afterwards:
record which Priority-1 rows Delta accepted, rejected, or corrected — the
corrections are the highest-value input to the offering map, because they are the
only signal that tells us where our course-title judgment was wrong.
