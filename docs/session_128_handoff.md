---
title: Session 128 handoff (SkyGauge → SkyNaut) — load Sam's tables, then build the three-axis measure
created: 2026-08-07
updated: 2026-08-08
tags: [handoff, sierra, student-detail, disposition, veteran-sprint, supabase, access]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
  - "[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 128 — SkyNaut

Sam named you. Previous session was **SkyGauge (127)**, which ran long into overtime; most of what matters here
was decided in the last hour, so read this before touching anything.

**Sam's opening need, in his words:** *"I'll need a little help getting the table curated and up into Supabase
since I've been relying on you through my Git connection to do the procedure."* He has built the aggregates in
**Microsoft Access** and needs a walked path to get them live. **That is your Priority 1.** Do not start by
building anything clever.

## Read first, in order

1. This file, all of it.
2. `docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one.md` — before writing any matcher.
3. `funding/_student_detail_local.py` — the tool; its docstring carries the privacy reasoning.
4. `cpl_memory` rows: `dormant-earned-credit-is-the-headline`, `applied-is-not-the-finish-line-course-credit-is`,
   `cplstatusplan-absent-from-fetched-map-views`.

## What SkyGauge shipped (11 PRs, all merged; main `9fa2e89` + follow-ups)

| PR | What |
|---|---|
| #1038 | Mode 7 measured and CLOSED — retrieval was never the problem; live 150-row fixture + 13 checks |
| #1039 | The disposition gap diagnosed; MAP API probe (runner-side) |
| #1040 | Aggregator takes the JSON export; per-exhibit rollup |
| #1041 | The status column it matched was the workflow stage, not the disposition |
| #1042 | KB note + handoff |
| #1043 | Sum the credit funnel; `CPLStatusPlan` confirmed present |
| #1044 | Handoff refresh |
| #1045 | Rule 8 checkpoint |
| #1046 | Eight credential families + `--family`; the POST regex was wrong in both directions |
| #1047 | Sam's CR-grain design recorded |

## ✅ DO NOT RE-OPEN: mode 7

Session 127's handoff filed it as Priority 1. It was already fixed. The RPC returns 613 rows/117 colleges for
mode 7's exact tsquery, LA Trade Tech ranks 2, and the context held ten LA-county colleges the whole time. Smoke
47 (red) ran against deploy 11; v35 shipped after and **48/49/50 are green**. Fixture + 13 checks committed.
⭐ The lesson: **after your last deploy, re-read the smoke run that push triggered before writing your handoff.**

---

# 🎯 PRIORITY 1 — get Sam's Access tables into Supabase

He has two exports built in Access. **He cannot send you the data** (51 MB source; the Drive connector returns
files as base64 into context, so tranching does not help — this is settled, do not relitigate it). The division
of labour that works:

**You do the DDL. He does the data.** You have the Supabase MCP; he has the dashboard's CSV import.

### The procedure, in order

1. **Ask for headers + ~200 rows + row counts** of each export if you do not have them. Design against real
   column names — Access renames on export and the `Status` / `CPLStatusPlan` disaster (below) came from
   exactly that.
2. **Create the tables via `mcp__Supabase__apply_migration`** using the schema below.
3. **Walk him through the dashboard import**: Table Editor → the table → Import data from CSV. Tell him what
   to expect and what "success" looks like.
4. **Verify after load via MCP** — row counts, a spot-check of a few known rows, nulls where you expect them.
   Do not assume the import worked; a partial import looks like a successful one.
5. **Then** build the aggregates as views on top.

### The schema, as agreed with Sam

```sql
-- one row per (student × college × exhibit × catalog year)
create table map_student_credit (
  student_key  integer not null,
  college_id   integer not null,
  exhibit_id   text    not null,   -- 'DEFAULT-BASIC-MIL' where the source is NULL
  course_type  text    not null,   -- the real discriminator, from source
  catalog_year text    not null,
  primary key (student_key, college_id, exhibit_id, catalog_year)
);
create index on map_student_credit (exhibit_id);
create index on map_student_credit (college_id);
```

Four decisions in there, each with a reason — **do not simplify them away**:

- **`college_id` is on the row, not in a lookup.** Sam confirmed students *swirl* between colleges in
  multi-college districts (RCCD shares a catalog), so student→college is genuinely many-to-many.
- **`exhibit_id` is NOT NULL with a sentinel.** The basic-military rows arrive with **`ExhibitID` and
  `Source Code` both null**, and a NULL cannot participate in a primary key. Sam proposed a dummy id and was
  right; SkyGauge initially said it added nothing, before seeing the nulls.
- **`course_type` is the discriminator, not null-ness.** Every default row carries
  `Course Type = 'Credit for Basic Military Service-Area'` (a few variants). Filtering on
  `exhibit_id is null` would silently sweep them out of everything. Filter on `course_type`.
- **`catalog_year` is IN THE KEY.** The same basic-military award is **3 credits in 2025-2026 and 4 in
  2024-2025**. Collapse the year and you silently mix two different values.

### ⚠️ RLS — this is the part with blast radius

`map_student_credit` is **student grain**: one row per real person. The key is a surrogate (Sam's Access
mapping table, which never leaves his machine), but a student with a rare combination of exhibits is still
potentially re-identifiable.

- **Reviewer-only RLS**, same gate as `kb_curation`. **Never readable by the anon key Sierra's widget uses.**
- **Sierra reads DERIVED aggregates, never this table.**
- Flag it to Sam in plain language before you flip it, per the CLAUDE.md team obligations.

---

# 🎯 PRIORITY 2 — the three-axis measure

⭐ **This is the part SkyGauge nearly got wrong, and Sam caught it — then handed over the framing that makes it
obvious.** Do not invent a metric here. **The three Veteran Sprint goals ARE the three measures**, in Sam's own
words (2026-08-07):

| Sprint goal | What it means | Measure from this data |
|---|---|---|
| **1. Obtain and upload all enrolled vet JSTs** | get the record in at all | already at ratio ~1.00 — SkyPlan found colleges treat uploading as the finish line |
| **2. Award COURSE credit for basic training** | not generic elective / CSU-GE Area E | for `course_type like 'Credit for Basic Military Service%'`: `CourseCredits ÷ (CourseCredits + AreaCredits + ElectiveCredits + DefaultAreaCredits)` |
| **3. Award more (or all possible) credit from the CRs on each JST** | work the rest of the JST, not just basic training | `PotentialCredits` at `Needs Action` across the exhibit rows + the disposition rate |

**Goal 2 is why disposition rate alone is the wrong measure.** *"Area E is no longer very useful for transfer
students"* — so a college that applies 100% of its backlog as Area E scores full marks while doing the exact
thing the Sprint exists to change.

So **disposition rate alone is the wrong measure.** A college that applies 100% of its backlog as Area E scores
full marks while doing the exact thing the Sprint exists to change. This is the same failure mode SkyPlan
documented for the Veteran Star — colleges learned that *uploading JSTs* was the finish line — repeating one
layer up. **Applying must not become the new false finish line.**

### The flagship case, where all three land at once

The basic-military-service rows: `MilitaryCredits 3 · ArticulatedCredits 3 · AppliedCredits 0 ·
TranscribedCredits 0 · Needs Action`, mapped to **CSU-GE Area E**.

**The articulation already exists.** Not blocked on faculty review, not blocked on building an exhibit — the
credit is set up, valued and mapped. Nobody has awarded it. And it points at the wrong destination anyway, so
fixing it means *acting AND remapping*, not pressing apply.

Every military CPL student has one (14 of 15 in Sam's sample). It is plausibly both the **largest and cheapest**
block of unawarded credit in the system. **Compute it first.**

⚠️ **Never rank colleges publicly** (standing rule, `$50k / ESS` roadmap row). Frame as unclaimed opportunity,
never a failing grade.

---

# 🎯 PRIORITY 3 — the bundle table (why the student grain exists at all)

`(student × exhibit)` answers what counts never can: **which exhibits travel together on the same student.**
That turns *"here are 3,644 exhibits"* into *"articulate these four and you cover 60% of the students already in
your queue"*, and it gives the honest denominator — how many **distinct** students an adoption would help.

- **Exclude `course_type like 'Credit for Basic Military Service%'` from bundle logic.** It is on nearly every
  military student, so it swamps co-occurrence ("everyone with X also has this" — true and useless). Keep it for
  its own analysis; it is *not* junk, it is the most universal award in the system.
- Sam's sample averages **~5.9 exhibits per student** → roughly **250k rows** statewide. Trivial for Postgres.
- ⚠️ **"too big for Sierra to query" is FALSE** and must not be inherited. It applies only to raw rows at chat
  latency. 108,911 distinct `(ExhibitID, CreditRecommendation)` pairs statewide is nothing for an indexed table.

---

## Data-quality findings from Sam's actual exports — all still open

1. **`MaxOfStudent` is `1.00` on every row.** `Max()` of a per-row flag returns 1 forever. If a student count is
   wanted it must be `Count(distinct student)`. As exported the column carries no information.
2. **Case variants split the same CR.** `"EMT Special Populations"` vs `"Emt Special Populations"`,
   `"CPR For The Healthcare Provider"` vs `"Cpr..."`. ⚠️ And the casing **correlates perfectly with disposition**
   in the sample (upper = Needs Action, title = Not Applicable) — too consistent to be random, likely two write
   paths in MAP. Harmless while disposition separates them; **fragments any group-by on CR text alone.**
   Normalize for grouping, keep the original for display. Sam is raising the nulls with the MAP team.
3. **`AppliedCredits` / `TranscribedCredits` are NULL, not 0**, on Not Applicable rows. Nulls propagate through
   SUM differently. Coerce.
4. The known grain of the first export is
   `(college × exhibit × CR × College Course × CPLStatusPlan)` — disposition is part of the key.

## Carryover

- **Malone's API view is still unpublished** — `400 … is not Valid` on three candidate names. One-click re-check:
  Actions → **"Discover MAP datasets (manual)"** → Run workflow; it prints the endpoint's own `responseMessage`.
  When live, wire the name into `fetch_custom_report.py` (`_build_cr_backlog.py` already parses that shape) and
  the Access path retires. **A drafted email to Malone is in the session-127 transcript**, asking for the view
  name *and a stable per-student key, hashed on their side.*
- **Sam's re-run of `_student_detail_local.py` was never pasted back.** It now covers eight credential families
  and the credit funnel. Ask for it if you want a fast statewide read without waiting on the load.
- Sam's local clone was on a dead lineage (408 vs 1,703 commits) and he ran `git reset --hard origin/main`.
  **His vault clone may have diverged the same way** — `sync-vault-clones.ps1` only fast-forwards, so Obsidian
  may be silently stale. `.vault-sync.log` will show a run of skips.
- SkyHero's five-surface poaching audit was never reported. Still open, three sessions running.
- `creditforbeingyou.org/main/student` remains unverified (sandbox is egress-blocked from that domain).
- Sierra's corpus covers **59 of MAP's 123 colleges** — still the biggest single limit on her.

## Patterns that worked

- **Check whether the last session's Priority 1 is still true before working it.** Ten minutes of reading smoke
  logs saved a day of prompt-tuning on an already-fixed bug.
- **Measure the layer below before editing the layer above.**
- **A number that looks like a sharper version of a known finding deserves MORE suspicion, not less.** A 0.0%
  disposition rate passed unquestioned because 4.7% was expected.
- **Build the decoy fixture.** The POST regex was wrong in *both* directions and only the decoys caught it.
- **Sam's corrections were better than my designs, four times.** He lives in MAP; believe him and record it.

## Safety patterns to honour

- **Never route per-student rows through a session's context.** The Drive connector returns files as base64 into
  context — a size problem, not a privacy one, and unfixable by splitting.
- **A salted hash of a small ID space is not anonymous.** Sam's surrogate map lives only in his Access file.
- **Never suggest link-sharing student data — this repo is public.** Do not commit any of these exports.
- The sandbox cannot reach `*.supabase.co`, `mapwebapinew.azurewebsites.net`, `creditforbeingyou.org` or
  `github.io`. MCP tools and the runner are the way through.
- ⚠️ `actions_list` returns enormous payloads and ignores its `workflow_id` filter — parse the saved file.
- **After every squash-merge: `git fetch && git reset --hard origin/main`.**
- Merge on `clean` OR `unstable`; never force-push `main`.

## Rollback

Nothing was deployed. cpl-chat is unchanged at **v35** —
`git show 3272bb4:chatbox/supabase/functions/cpl-chat/index.ts`. Every PR this session was tests, docs, or
local/runner scripts; none touched a shared table or the live function.
