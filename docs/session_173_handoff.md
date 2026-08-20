---
title: Session 173 handoff — the cron runs itself; one ruling landed and scoped itself; a list is live and invisible
created: 2026-08-19
updated: 2026-08-20
tags: [handoff, session-173, map-api, custom-report, cron, security, cleanup-worklist, credit-by-exam, ace]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/map_cleanup_worklist]]"
  - "[[docs/map_custom_report_load]]"
  - "[[docs/session_172_handoff]]"
---

# Session 173 handoff

You are **Session 173**. Session 172 was **SkySwap**, and it ran across two days.
Everything below is merged and live.

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8), tags `map-api` / `cleanup` / `credit-by-exam`
   / `security`. Six rows were written across the two days; three are **verified
   with Sam named**.
2. [`docs/map_cleanup_worklist.md`](map_cleanup_worklist.md) — **the authority,
   and the thing that changed most.** All the numbers live there.
3. [`docs/map_custom_reports_lessons.md`](map_custom_reports_lessons.md) §
   2026-08-20 — the full story including two corrections to my own build.
4. `CLAUDE.md` → **CPL clean-up worklist** row + Rule 10 (b2).

---

## ⚠️ SAM'S DECISIONS THIS RUN — do not re-derive these

- **The deferrals are Credit by Exam offers.** *"These should be presented to
  students as Credit by Exam options for them — not ruled out by college staff
  (unless they don't permit Cx for that particular course). Later, as I curate the
  CCRR table I will normalize these ACE CRs as Cx for specific courses on the
  CCR."*
- **And he scoped his own ruling the same day:** *"if there is no course or
  discipline, it's meaningless and a copout on ACE's part. Students can request Cx
  at any time provided the catalog allows for it for the particular course."*
  → 4,001 of 5,311 name no course; only **1,310 are sendable**.
- **He asked for the exhibit-title list** (*"Corpsman, Hospitalman, Rifleman,
  MP"*) with an alignment indicator, and for **visuals to be kept** — hence
  `docs/visuals/`.

---

## What shipped (#1262 · #1263 · #1264, all merged)

- **The nightly load would have failed every night.** The step that EMPTIES
  staging — which **no gate is downstream of** — was a PostgREST mass `DELETE`
  that timed out. Now `map_clear_custom_report_staging()`, **5.3 s**, and it takes
  **no argument** so there is no table name to get wrong.
- 🔒 **Six security-definer functions were callable with the published anon key.**
  `revoke ... from anon, authenticated` does **not** remove the PUBLIC grant.
  Fixed; `tests/supabase_function_grants_test.py` lints it in CI.
- **P1 was about to tell ~100 colleges that ACE refused credit it did not
  refuse** — split into P1 (12,283) and P5 (5,311), then P5 split again.
- **Exhibit titles now load** — 25,794 rows, **219 of 225 blank exhibits resolve**.
- **`map_cx_exhibit_guidance`** — 225 exhibits, tiers **3 / 47 / 175**.

---

## ✅ CLOSED AFTER THE CHECKPOINT — both decisions were made (#1266)

The section that stood here said the guidance list was live and invisible and
that two decisions were Sam's. **Both landed the same day.** Left as a heading
rather than deleted because the next session should not go looking for an open
question that is answered.

**Where it goes:** the **MAP Data Quality tab**, as two read-only sections above
the existing defect register — the CSM clean-up worklist and the 225-exhibit Cx
guidance list.

**Does tier 2 earn its place — Sam, 2026-08-20:** *"Seems like tier 2s earn their
place as long as there is guidance for the CSM team on correcting or noting in
MAP any changes recommended."* All three tiers ship, and every tier carries a
`map_action` saying what to correct or note **in MAP**. The actions differ in
KIND, not confidence: tier 1 a candidate course, tier 2 a **conversation** (the
peer course is context, never a proposal), tier 3 the title only.

⭐ **The concrete correction, and it is the useful part:** all 4,001 rows carry an
**empty `course_type`**, which is exactly why they read as closed. Typing them
**Credit by Exam** *is* the "noting in MAP" — a value MAP already has.

⚠️ **The actions name FIELDS, never SCREENS.** No session has seen MAP's UI and
MAP is read-only to us. If the CSM team needs click-level steps, they come from
someone who uses MAP — **do not invent them.**

### ⚠️ Sam's standing constraint on this whole surface (2026-08-20)

*"My goal is to guide CSM team to make changes in MAP rather than house and
maintain data layers in COBI."*

Both sections are **read-only, derived, rebuilt nightly**, with deliberately
**nowhere in COBI to record progress**. `cobi_admin_surface.js` records both
tables under `reads` with `writes: []`, so the posture is **auditable in the
Admin gate view**, not merely asserted in a test. **Honour this before adding
anything to this tab** — the pull toward a status column here will be constant.

⚠️ **A module whose tables the surface generator cannot see renders as "touches
no data", which on the Admin tab reads as "nothing to protect".** It derives them
from `REST + "<table>"` literals, so write endpoints as named constants in that
shape. CI caught this; a comment would have fooled it.

**Still open, and only these:** send the **1,310 `cx-course-named`** rows as the
Cx offer; give Natalie, Chelsea and Ally the **team phrase**; and look at the two
new sections in a browser (density and wording).

---

## The three lessons, each earned by getting it wrong first

- **A gate cannot protect the step that fills it.** G1–G9 measure staging against
  live, so none can fire on a run that dies before staging is filled. ⚠️ **The
  successful runs were not evidence** — a manual run tests a state the schedule
  never sees again.
- **Verify a grant by asking the database, not by reading the migration.** The
  `revoke` ran without error and changed nothing. ⚠️ Check `service_role` holds an
  **explicit** grant before revoking PUBLIC.
- **A class marked `one rule` must be checked against its own TEXT**, and then
  against whether the rows carry **usable content**. P1 was the first; P5's
  4,001 contentless rows were the same lesson one level down.

## And two corrections to my own build, in the same session

- ⚠️ **`ace_titles()` read `ds.get("data")`; the API returns `columnValue`** — as
  the same file does 200 lines further down. The run passed, the gate declined to
  blank live titles, the log said *"no titles parsed"*, and the answer was still
  empty. **The test could not catch it: its fixture carried the same wrong
  assumption.** `rows_of(ds)` is now the one place the key lives.
- ⚠️ **The guidance tier's ≥2-college floor shipped a tier 1 that was 11 of 14
  `MAG-51 Elements of Supervision`.** Counting agreeing colleges cannot tell
  corroboration from a blanket mapping; the second axis is **specificity**
  (`MAG-51` spans 33 exhibits, `ADJ-1` spans 1).

---

## Carryover

- **Ashley's Delta crosswalk — five handoffs now.** Record which of the 42
  Priority-1 rows Delta accepted / rejected / **corrected** into
  `kb/delta_offering_map.json`. The statewide engine's **second occupation list**
  is the oldest unpaid debt in the project.
- **A CCRR finding worth its own look:** three colleges have mapped `MAG-51
  Elements of Supervision` against **33 distinct military exhibits**.
- **The Customer Success team needs the TEAM PHRASE**, not reviewer access.
- **`CLAUDE.md` is 122,607 / 60,000 (2.04×).** Session 172 held it *down* across
  two days of work. `docs/INDEX.md` (5.85×) and `docs/roadmap_archive.md` (2.84×)
  are untouched.
- Auth `role` column, repo split, GR sensitivity flips, P2 to Pierce and Merced,
  the nine Initiator colleges — all still on Sam.

---

## Patterns that worked

- **"Watch the next run" means look at the last one.** The queue item was
  forward-looking; the evidence was already on disk.
- **Read the database log for the same second as an HTTP error.** PostgREST's 500
  said nothing; `postgres_logs` named the cause in one line.
- **Check a protection instead of trusting it.** Writing the seventh copy of a
  `revoke` line was the moment to ask whether the first six worked.
- **Read what the rows SAY before writing an instruction about them.**
- **A negative result needs a positive control** — the 0-of-225 title join was
  only believable because 785 of 6,330 ids *do* join.
- **Mutation-test the guards.** Seven mutations across two files this run; one
  exposed a check comparing a module against **its own constant**.

## Safety patterns to honour

- ⚠️ **`revoke ... from anon, authenticated` protects nothing. Name `public`** —
  and verify `service_role`'s explicit grant first (Rule 10 b2).
- ⚠️ **A load must reproduce its source, not improve it.**
- ⚠️ **An RLS-filtered read returns 200 + `[]`.** Empty is not proof of empty.
- ⚠️ **Rebuilding a gated table by DROP/CREATE re-declares its policy** — check
  after, which is what `G9` does nightly.
- ⚠️ **The sandbox cannot reach the MAP API or `*.supabase.co`.**
- Rule 4, Rule 1, Rule 5 (never force-push `main`), Rule 7, Rule 10.

---

## Moniker

Session 172 was **SkySwap**. Take **SkyPanel** if you build the guidance surface
once Sam has ruled, **SkyClaim** if you finally take Ashley's Delta outcome, or
coin your own.

Next after you: `docs/session_174_handoff.md`.
