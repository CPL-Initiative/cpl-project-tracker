---
title: Sierra credit recommendations & false absences — workstream lessons
created: 2026-08-13
updated: 2026-08-13
tags: [lessons, sierra, credit-recommendations, retrieval, statewide, postgrest, false-absence]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_credential_naming_lessons]]"
  - "[[docs/sierra_training_tab_scope]]"
  - "[[docs/kb-notes/methodology-a-summary-field-is-not-the-record]]"
  - "[[docs/kb-notes/methodology-a-conditional-key-breaks-a-bulk-upsert]]"
  - "[[docs/kb-notes/methodology-a-settled-ruling-does-not-enforce-itself]]"
artifacts:
  - kb/_build_credential_recs.py
  - kb/_sync_credential_recs.py
  - kb/_sync_credential_catalog.py
  - tests/sierra_guidance_edit.test.js
  - .github/workflows/credential-catalog-sync.yml
---

# Sierra credit recommendations & false absences

Workstream scratchpad. Distilled, durable pieces live in `docs/kb-notes/`; this is
the narrative, appended one dated section per checkpoint.

## 2026-08-13 — SkyPeak (Session 147)

Sam opened with a tab request and two wrong answers: *"I need to edit the last
entry I made on the training tab but there is no way to get back into it once
saved… Also, I'd like to be able to test it from there in Sierra and keep editing
if needed until I get an improved response."* Then: Cerritos ironworker CPL
reported as none when there is plenty, and a POST adoption recommendation listing
one course where there should be ten.

Shipped **#1146**, **#1147**, **#1148**; two migrations; 2,205 rows published; 42
live corrections.

### (a) What was learned

**Every single finding was a PUBLISH gap, not a build.** This is the run's through
-line and it should change where the next session looks first. Sierra reads *only*
Supabase. The repo holds far richer layers that never reach her:

| Layer | Where it lives | Sierra could read it? |
|---|---|---|
| Canonical credentials (CER subset) | `chatbox_credentials` (1,987) | yes |
| Raw freehand exhibit titles | `chatbox_exhibits` (2,397) | yes |
| College profiles | `chatbox_college_profiles` (128, stale since 2026-06-25) | yes |
| **Statewide + local credit recs** | `statewide_data.js` (2,589 exhibits) | **no → now yes** |
| **EACR prescriptive per-college courses** | `statewide_prescriptive.js` (739) | **no** |
| Full CER | `credential_reference_data.js` | partly |

Sam asked directly whether a purer dataset was needed. It was not — and asking
first is what kept this small. `statewide_data.js` already splits the two cases
exactly the way he then described them.

**1. `ccc_rec` is a single string, and Sierra treated it as the whole record.**
POST Basic Academy's is `"3 hours in Criminal Investigation"`. The actual
statewide recommendation is **ten lines**. They were never missing — they are
`exhibit.authoritative_recs`, covering 134 of 137 statewide exhibits (361 lines),
and they are *already rendered on the public CPL Fact Sheet*. A field that
summarises a set will be read as the set.

**2. Sam's rule, which the builder now implements literally.** *"When there is a
statewide exhibit as there is for POST, it should only reference the credit
recommendations from the statewide and largely ignore the local versions. When
there is no statewide, it should give the most common credit recommendations from
a selection of the colleges. They don't need to see all the variations for local
colleges."* One set per credential, never both: local variation behind a statewide
standard is noise to a reader.

**3. Reuse beat reimplementation, and the reason is credibility, not tidiness.**
Sam pointed at the Fact Sheet — *"we have the statewides and their CRs listed on
our CPL Fact sheet as well"* — and `fact-sheet/_build_statewide_recs.py` already
parsed exactly these rows, with unit-splitting and title-folding. `kb/_build_
credential_recs.py` **imports and calls its `build()`**. Two copies of those rules
would drift, and the failure mode is Sierra quoting different credit from the
published page for the same credential.

**4. The AJ 110 nuance — count, but do not adjudicate.** POST shows ten recs, nine
lines carrying a C-ID, eight *distinct* C-IDs: `AJ 110` sits on both *Intro to
Administration of Justice* and *Physical Training and Health Education (CSU GE
Area E)*. Sam first said "8 C-IDs and 2 elective courses", then, seeing the data,
*"AJ 110 may be C-ID and it is Elective … maybe where the confusion lies"*. Both
readings are defensible, so both counts ship (`n_cid_recs`, `n_cid_lines`), the
repeat is recorded in `cid_repeats`, and consumers are told to **lead with the
list, never a count**. An early draft of this code called the repeat an "upstream
error" — that was the session adjudicating a curator's domain.

**5. The Cerritos zero is a FALSE ABSENCE.** `chatbox_exhibits` has 3 Cerritos rows
titled `FIW Orientation` and `IW- Mixed Base` — no substring of "iron" — so
`search_exhibits_by_topic_v2(['iron','worker','ironworker'], 'Cerritos College')`
returns **0**, reproduced live. The curated layer already knew: 16 Cerritos
credentials, 11 named `Ironworker Apprenticeship — …`, and FIW's issuer is *Field
Ironworkers Local 416*. The college-scoped route reads the RAW corpus and never
consults the curated names. Identical in shape to Session 144's abbreviated MIS
course titles. Two further fragilities, both measured:

- `search_credentials_any` matches `unified_title` + `raw_variants` **only** —
  never `issuer`, never `search_text`, even though `search_text` contains
  "field ironworkers local 416".
- The plural fails outright: `ironworker` → 25 rows, `ironworkers` → **0**.

**6. Sierra had been contradicting the Fact Sheet on 42 credentials.** The
statewide flag synced from `credential_reference_data.js` (84 statewide) while
`statewide_data.js` carries 137. Paramedic License, CompTIA, OSHA 10/30, the NCCER
and Carpenters ladders all read as local. This is the EMT/Paramedic mismatch Sam
has reported across several sessions — *"your analysis says EMT and Paramedic
aren't marked as statewide in MAP, but they show up correctly in the fact sheet"*
— and he was right every time. (EMT Certification itself was already `true`: it
appears four times in `statewide_data.js` under different `collaborative_type`
values and folds to one row. **Paramedic License** was the false one.)

The uncomfortable part: `cpl_memory` row `statewide-is-138-not-84` **already said
"use the adoption file."** The sync predated the note and nobody rechecked.

**7. A conditional key breaks a PostgREST bulk upsert, and it fails positionally.**
The first dispatched run died at batch 9 of 12 with `PGRST102 "All object keys must
match"`, leaving the table at **1,600 of 2,205** — a partly-loaded table that
*looks populated*. Cause: `cid_repeats` was emitted only when a credential had a
repeat, and **exactly one row of 2,205 does** (POST, because of AJ 110). Eight
homogeneous batches succeeded first, so it presented as a size limit.

**8. The Training-tab edit loop had three ways to fail silently.** RLS already
permitted the update (`sierra_guidance_team_update` covers every column) — this
was a missing affordance, not a missing permission. A filtered PATCH returns
`200` with an **empty body**, so "ok" is not proof it wrote; hopping to Sierra on
an unsaved edit tests the OLD wording and reads as "the instruction did nothing";
and the editor must survive the trip to `#chatbot` or "keep editing" is three
chores instead of a loop. All three are guarded by `tests/sierra_guidance_edit.test.js`.

### (b) Current state

- **`chatbox_credential_recs` LIVE — 2,205 rows** (134 statewide / 351 lines,
  2,071 local / 3,357), public-read, no write policy, on the nightly
  `credential-catalog-sync`. POST verified in Supabase returning all ten.
- **Statewide flag corrected** — sync reports **126, up from 84**; 42 live rows
  updated.
- **Training tab edit + test loop shipped**, 26 new checks; the five test files
  covering `sierra_training.js` pass at 160 checks total.
- ⚠️ **`cpl-chat` does NOT read the new table.** Sierra's answers are unchanged.
  Ask her about POST today and she still says one course.

### (c) Strategic roadmap

Everything below is one PR plus a `cpl-chat` deploy, and it is the whole
value-realisation step for this run:

1. Wire `cpl-chat` to `chatbox_credential_recs`, branching on `rec_kind` per Sam's
   rule; lead with the list, never a count.
2. Fix the college-scoped topic route to consult the curated credential layer
   (this is the Cerritos fix); add `issuer`/`search_text` to
   `search_credentials_any`; handle the plural.
3. Flip `college_adoption_opportunities`, which orders by
   `cardinality(adopter_colleges) DESC` and therefore sorts a **zero-adopter,
   ready-to-adopt exhibit last** — backwards from Sam's stated intent.
4. Then EACR's `statewide_prescriptive.js` (the likely local course each college
   already teaches) and COLLEGE·CRED.

Parked / open: the exhibit corpus covers 59 of 123 colleges;
`chatbox_college_profiles` is stale since 2026-06-25; 12 titles are statewide in
the adoption file but absent from `chatbox_credentials`; the 25-row feedback
backlog is still untriaged.

### (d) Next concrete step

Wire `cpl-chat` to read `chatbox_credential_recs` and deploy. Until that lands
nothing a visitor sees has changed.

### Incidental finding — not ours

`tests/cpl_funding.test.js` runs 4+ minutes with zero output and times out, so
`node tests/run.js` cannot complete in this sandbox. It is **byte-identical** to
the pre-session commit (this run changed seven files; that is not one of them),
so it is pre-existing. `js-tests.yml` is non-required and did not run on any of
the three merge commits, so nothing was gated on it. Worth someone's attention.
