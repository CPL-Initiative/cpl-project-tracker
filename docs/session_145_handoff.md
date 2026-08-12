---
title: Session 145 handoff (SkyTouch → next) — Ashley's HTH crosswalk shipped; the MAP-side step is the blocker
created: 2026-08-12
updated: 2026-08-12
tags: [handoff, futuro-health, crosswalk, cna, partners, data-quality]
related:
  - "[[docs/futuro_hth_crosswalk_lessons]]"
  - "[[docs/kb-notes/methodology-a-source-file-that-abbreviates-titles-fakes-an-absence]]"
  - "[[docs/kb-notes/reference-course-level-mis-beats-program-level-coci]]"
---

# You are Session 145

Session 144 ran as **SkyTouch** and shipped **#1134** — the Futuro Health
**Human Touch Healthcare → CCC CNA** statewide crosswalk, for **Ashley**.

**Note who drove this one.** Ashley opened the session, not Sam. She referenced
the San Joaquin (SJCOE) crosswalk as the model and supplied two documents: the
**HTH General Syllabus 3.0 v2.2** and a **Top-10 CCC decision guide** she had
already built from HTH scholar-proximity analysis. Mid-request she added *"please
show me an html visual of this work"* — so the deliverable is a **pair**, workbook
and published page, and any follow-up should keep both in sync.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['futuro-health','crosswalk','partners','cna']
       or summary ilike '%Futuro%' or summary ilike '%crosswalk%')
order by event_date desc nulls last limit 40;
```

This paid for itself in one query last session. The actionable headline of the
whole deliverable — *Futuro Health is already MAP entity 133 with a live landing
page and ZERO exhibits* — came out of `non-college-entities-are-at-zero-awarded`,
not out of the data I was building.

## What shipped — #1134 (merged `085abbe`)

A 5-sheet workbook (gitignored as regenerable) + a published HTML view, backed by
`kb/_build_futuro_hth_crosswalk.py` and `kb/_write_futuro_hth_workbook.py`.

- **61 of 118** colleges teach a CNA course (153 courses).
- **59** have a plausible receiving course · **25** health-discipline · **22**
  score 4–5 · **24** already run CPL in MAP.
- **2** genuinely have none (Lassen, Santa Monica) — verified by hand.

## The one judgment the whole thing rests on

**HTH cannot articulate into the CNA course.** A California CNA program is a
**CDPH-approved 160-hour course** (60 theory / 100 clinical) fixed in regulation.
It maps to the course *beside* it — interpersonal/intercultural communication,
healthcare ethics. If someone asks you to "just list the CNA colleges", that list
is not actionable; this is why.

## The blocker, and it is not an engineering one

**Nothing reaches those 61 colleges until HTH exists in MAP as an exhibit under
Futuro Health (ID 133).** That is a MAP-side curation step, not a session task —
MAP is our read-only system of record. Say so plainly rather than building around
it. Everything else on this workstream is downstream.

## Five things that will save you time

1. **`recalc.py` cannot run in this sandbox.** LibreOffice timed out at 119s and
   again at 539s. If you touch the workbook, verify formulas by asserting each
   one's **target column and expected value** against `crosswalk.json` instead —
   and say which check you ran, so its absence never reads as a pass.
2. **The MIS course file abbreviates its own titles** (`INTERCULTURAL COMM`,
   `Interpersonal Commun`, `BIO-ETHICS`). Route every regex through
   `tidy_title()` and match the `comm` stem. Fixing only the module patterns
   leaves the **fit** regexes carrying the same assumption — that reproduced the
   identical symptom once already.
3. **The join asserts both sides and exits on any miss.** Keep it. It caught
   `MIRA COSTA COLLEGE` vs `MiraCosta College` on the very first run.
4. **`fit_of()` is load-bearing, not decoration.** Without it the health TOP
   family ranks *Funeral Service Law and Ethics* above *Interpersonal
   Communication*.
5. **Render the HTML and read it.** That is how the sort-tiebreak bug was found —
   the negation was flipping the secondary key, so every top row showed 0 credit
   recs and the page recommended the worst possible starting point.

## Carryover

- **Confirm the 2 "none found" colleges** (Lassen, Santa Monica) against live
  catalogs. Sessions are **egress-blocked from college domains**, so this needs a
  human or a differently-egressed runner.
- **Offer the COBI tab.** Ashley has not asked; I offered twice and she has not
  taken it up. The MAP columns drift, and what was handed over is a snapshot.
  Do not build it unprompted.
- **The partner engine's 2nd run is STILL outstanding.** #1134 is a second partner
  *engagement*, not a second *engine* run — different question shape entirely
  (see the §11 row, which now says this explicitly so nobody mis-ticks it).
- Everything Sam held on **My College** (MAP deep links, the RLS decision, the MIS
  side-by-side) is still held. Don't route around it.

## Safety patterns to honour

- **MAP is read-only.** No writes, ever. Contacts/staff in MAP are **not** PII
  (Sam's ruling), but student data is — `map_student_credit` is reviewer-only.
- **An absence gets a phrase, never a blank cell.** A partner-facing sheet travels
  without its schema, so "we looked and found nothing" must be distinguishable
  from "this column was not filled in". Both deliverables do this; keep it.
- **A tier must encode what you could not check.** The readiness scale here is
  **A–D from MAP itself** and is deliberately *not* Ashley's 1–3 web-review scale.
  Never let the two be read as the same number.
- **TOP is a filter aid, never a gatekeeper** — two signals must agree.
- Artifacts published to claude.ai are **private until the user shares them**.

## Moniker

I was **SkyTouch** — the course is about the human touch in healthcare, and the
run turned on noticing that a data file's own abbreviations were manufacturing
absences. Take it or coin your own; if Sam or Ashley names you in their greeting,
that wins.
