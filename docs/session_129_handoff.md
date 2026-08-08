---
title: Session 129 handoff (SkyNaut → next) — the table is live; build the per-college measure
created: 2026-08-08
updated: 2026-08-08
tags: [handoff, student-detail, disposition, veteran-sprint, supabase, access]
related:
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/methodology-a-successful-import-is-not-a-correct-one]]"
---

# You are Session 129

Previous session was **SkyNaut (128)**. Sam named it. Take the handoff's
suggestion below or coin your own.

## Read first, in order

1. This file.
2. `docs/student_detail_load_lessons.md` §2026-08-08 — the full story, written once.
3. `docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md` — **before
   you publish any per-college number.** It is ratified, not a draft.
4. `docs/kb-notes/methodology-a-successful-import-is-not-a-correct-one.md` —
   before the next monthly load.

## ✅ What shipped

**`map_student_credit` is LIVE in Supabase** (`hvuwhnbuahrtptokpqfh`), **220,588
rows verified** against the Access source count, 42,346 distinct students, 111
colleges, 8 catalog years. Reviewer-only RLS, **no write policies at all**.

**Sprint goal 2 measured statewide for the first time:**

| Destination | Rows | Students |
|---|---|---|
| Nothing awarded yet | 156,562 (71.0%) | 26,442 |
| **COURSE** ✅ | 38,393 | 26,960 |
| **AREA** ❌ | 20,359 | 20,098 |
| **ELECTIVE** ❌ | 5,274 | 3,918 |

**60.0% of awarded credit goes to real course credit, 31.8% to a GE area, 8.2%
to elective.** 47% of all CPL students hold at least one GE-area award.

PRs #1049 (ADR) · #1050 (RLS correction) · #1051 + #1053 (effort-dial docs) ·
#1052 (stop-hook variant) — all merged.

## 🎯 PRIORITY 1 — the per-college split

Statewide is the headline; **per-college is the deliverable.** Same three-way
breakdown, per `college_id`, so a coordinator can see their own position.

**This is where the ADR binds.** Before publishing anything:
- **k = 10**, driven by **distinct students**, not rows
- Thin cells show existence with `<10` and no breakdown (Sam's option b)
- **Complementary suppression at every level that publishes a total** — hiding
  one cell of a set that sums to a published total hides nothing
- Suppression at **write time**, in a build step with a test. Not a SQL view:
  complementary suppression is iterative, and the test asserts *subtraction
  cannot pin the value*, not that a flag is set
- ⚠️ **Never rank colleges publicly.** Frame as unclaimed opportunity

⭐ **This is the one place a workflow earns its keep.** Fan out adversarial
agents whose job is to *recover a suppressed cell by subtraction* — a hit is
cheap to verify (the arithmetic either works or it doesn't), which is exactly
the condition where fan-out pays. See `working_with_claude_code.md` §9.

## 🎯 PRIORITY 2 — load the second table

Everything measured so far is **recommendation counts, not credits**.
`TblCOLL_STU_EXH_CR_UNIT` (college × student × exhibit × CR × unit) carries the
funnel — `PotentialCredits` / `CreditsInReview` / `AppliedCredits` /
`TranscribedCredits`. Until it lands, *"how many credits sit dormant"* — the
figure `cpl_memory` calls the headline the CPL Initiative doesn't have — is
unanswerable.

**Same procedure, and follow it exactly:** permissive all-text staging table →
reconcile counts against the Access count → `INSERT ... SELECT DISTINCT` with
explicit casts → drop staging. The importer *will* duplicate rows again.

## ⚠️ Things the session-128 handoff got wrong — do not re-inherit

1. **"Same gate as `kb_curation`"** — `kb_curation` is **world-readable**
   (`SELECT / {public} / USING (true)`). Following it literally would publish
   student grain to the anon key. Use the `team_access` shape.
2. **The goal-2 formula divides by zero.** All four credit buckets are 0 on
   unapproved rows. Use `course_type`'s suffix instead.
3. **The 4-column primary key collides** on ~8% of rows. `course_type` is in
   the key.
4. **"ExhibitID and Source Code both null"** — only for the `-Area` variant.
   MAP supplies `"Default Credit"` for `-Course`, and Antelope Valley uses a
   literal `"-"`.

## Carryover

- **111 colleges, not 123** — twelve have no rows. Export filter or genuinely no
  activity? Unresolved.
- **249 rows have a blank `catalog_year`.** Legal, unexplained.
- **The flagship claim needs re-measuring.** Basic-military as "the largest and
  cheapest block of unawarded credit" is true at American River (32 students,
  all Area E, all Needs Action) and false at Allan Hancock (all applied, real
  courses). **The variance between colleges is the better finding.**
- **Malone's API view still unpublished** — Actions → *Discover MAP datasets*.
  When live, the Access path retires.
- SkyHero's five-surface poaching audit — never reported, four sessions running.
- Sierra's corpus covers **59 of 123 colleges**.
- `creditforbeingyou.org/main/student` still unverified (egress-blocked).

## Patterns that worked

- **Ask for 30 real rows before designing anything.** Four schema errors, all
  invisible in the spec, all obvious in the data. Every one would have produced
  a table that looked correct.
- **Route the unknown to a visible bucket.** `'Unspecified'` and `'UNKNOWN'`
  both came back 0 — but only because they *could* have come back non-zero. A
  silent fold would have made the question permanently unanswerable.
- **Reconcile across the boundary.** Both endpoints were right and the transfer
  wasn't.
- **Sam's domain knowledge beat my inference repeatedly** — the default-units
  point, `Course Type` being reliable, the `-Elective` variant. Believe him and
  record it.
- **Enumerate before classifying.** The 11-value explicit map produced zero
  UNKNOWNs; a `LIKE '%Course%'` would have been a guess.

## Safety patterns to honour

- **Never route per-student rows through a session's context.** Aggregates only.
- The sandbox cannot reach `*.supabase.co` — all Supabase access via MCP.
- **Never commit any of these exports** — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- After a squash-merge, `git fetch && git reset --hard origin/main`. The
  stop-hook "unpushed commits" nag that follows is a **false positive** — see
  CLAUDE.md Troubleshooting; verify and ignore, do not push.
- Wrap networked git calls in `timeout`; `git fetch --prune` hung for 2 minutes.

## Moniker

**SkySum** is suggested — the next lane is aggregation, suppression, and making
counts safe to publish. Claim your own if Sam offers one.
