---
title: Sierra credential naming & the route map — lessons
created: 2026-08-10
updated: 2026-08-10
tags: [lessons, sierra, retrieval, credentials, naming, routing, privacy]
artifacts:
  - kb/supabase_chatbox_credentials.sql
  - kb/_sync_credential_catalog.py
  - .github/workflows/credential-catalog-sync.yml
  - tests/credential_catalog_sync_test.py
  - tests/suppression_floor.test.js
related:
  - "[[docs/kb-notes/methodology-a-concatenated-haystack-penalises-your-best-record]]"
  - "[[docs/kb-notes/methodology-emit-the-threshold-with-the-label-it-prints]]"
  - "[[docs/kb-notes/reference-postgres-fts-pitfalls-for-credential-titles]]"
  - "[[docs/college_action_page_lessons]]"
---

# Sierra credential naming & the route map — lessons

The workstream Sam opened with *"Sierra's access to student-level data"* and a
real transcript where Sierra said exhibit-level student counts *"aren't available
in the data I have access to right now."* Working it through ten concrete POST
questions turned out to reframe the problem twice. Append a dated section every
checkpoint.

---

## 2026-08-10 — SkyLine (Session 134): the layer already existed

### ⭐ The premise was wrong, twice

**First reframe: not an access problem.** The obvious fix — point Sierra at
`map_student_credit` — produces confidently wrong numbers. Only **6.1% of student
rows can be given a credential name** (13,488 of 220,588): the student grain is
keyed by **ACE military codes** (`AR-`/`MC-`/`NV-`/`NER-`/`MOS-`, `source_code =
'ACE'`) plus 32,360 rows carrying a `Default Area`/`Default Credit` sentinel,
while Sierra's catalogue is locally-created `MAPICI-*` exhibits. Overlap: **624 of
6,280 ids**.

The control that proved it: CPR/AED, measured at **17,904 students** in the local
run, reproduces as **17** through the obvious join. Three orders of magnitude,
silently, from real tables. Today's honest *"I don't have that"* is **safer** than
the naive fix.

**Second reframe: the naming layer was already built.** `kb/unified_titles.json`
(3,813 variants → 1,987 canonical) → `kb/credentials.json` →
`credential_reference_data.js`, curated by `map@rccd.edu`. POST folds **16**
freehand titles into `POST Basic Academy`, carries the ASCCC statewide
recommendation, and knows **32 adopters vs 71 potential, zero overlap**. It simply
never reached the database Sierra queries. **This was a publish step, not a build.**

Third session running where the best catch came from reading a committed artefact
rather than generating a new one.

### The measures need naming too

POST has **three student counts, all defensible, all different**: 30 (the
reference's `students_served`, from `TotalStudentsForCR`, documented as
overstating), 28 (truly distinct, nameable exhibits only), 236 (summing
`distinct_students`, double-counting across recommendations). Wire any one without
deciding which it *is* and Sierra states an integer another surface contradicts.

⚠️ **Sam's definitions 2 and 3 are not computable today.** "Distinct students
where Applied Credits > 0" needs credit columns at student grain;
`map_student_credit` has five columns and **the four credit columns were dropped
at load**. His 29-column export carries them. That is a re-load, not a Malone
dependency, and it is the only hard blocker on route CRED·VOLUME.

### What shipped

| PR | What |
|---|---|
| #1091 | Suppression floor k=5 → **10**, mask derived from an emitted value |
| #1092 | `chatbox_credentials` published — **1,987 rows live**, 0 suppressed counts leaked |
| #1093 | Fixed the one test the floor change broke |
| #1094 | CRED·STD retrieval functions, version-controlled |

### Route CRED·STD took three passes, each failure informative

1. **Trigram over the whole haystack** → `peace officer` returned *Correctional
   Officer*, not POST. Cause: length normalisation means **the best-curated
   records rank worst**. Distilled to
   `methodology-a-concatenated-haystack-penalises-your-best-record`.
2. **Best single variant** → fixed `emt`; `peace officer` still wrong, because
   *Report Writing for Peace Officers* matched on **title** (tier 3) while POST
   matched on a **variant** (tier 4), and tier outranked standing.
3. **`statewide` is a FILTER, not a tie-break** → correct. Someone asking for the
   statewide recommendation only wants statewide credentials.

⭐ **A route's purpose changes its ranking.** Not one retrieval function with
per-route filters — the ordering itself is route-specific.

Final defect: `cpr` matched *EMT Certification* via the variant *"Emergency
Medical Technician NRE and CPR"* — a real substring, an incidental mention, the
wrong credential. Fixed with a **measured** tier-4 similarity floor (0.098 wrong
vs 0.727/0.711 right → floor 0.25, in open space), plus `matched_via` so an
incidental hit is visible rather than silent.

**Zero rows is a result, not a failure.** `search_credentials_any()` is the honest
second half: *"No statewide recommendation for CPR; 'First Aid, CPR & AED' is in
the catalogue with local articulations only."*

### A near-miss worth keeping

The `emt` ordering *also* looked wrong. Before fixing it I checked, and the cause
was `string_agg(... order by tier)` in **my own test query** — the function had
ordered correctly all along. Probe the thing, then verify the probe before fixing
what it accuses.

### The route map

Ten questions collapse to **nine routes / four subject families**. Six are served
by publishing the naming layer alone, so **the router and the naming layer are the
same work**. The cost of a router is **misrouting** — answering the wrong question
confidently — so a route must never be the only path: low confidence falls back to
general retrieval, and routing predicts the *question*, never the data.

### Next

1. Wire CRED·STD into `cpl-chat` + commit the route assertion.
2. `CRED·ADOPT`, then `COLLEGE·CRED` (carries Sam's Mt. SAC Request-Review
   language — route the seeker to **their own college's** Request Review button,
   which dissolves the poaching tension).
3. Re-load `map_student_credit` with its credit columns → unblocks CRED·VOLUME.
4. **L3 does not exist**: no grouping of credentials into occupational families.
   Grow it from `kb/occupation_credential_map.json`, and prove it on Real Estate
   rather than POST.

### Open for Sam

- Adopter-vs-potential wording when the asker's own college isn't an adopter.
- MAP has **no "Apprenticeship" CPL type** — six values only (Credit By Exam 798 ·
  Industry Certification 671 · Portfolio Review 238 · Standardized Assessment 125
  · Military 43 · Other 22). Any apprenticeship filter returns 0, which reads as
  "we do none" when the truth is "MAP doesn't classify it separately."
