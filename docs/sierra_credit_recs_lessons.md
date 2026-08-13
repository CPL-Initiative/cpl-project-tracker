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

---

## 2026-08-13 — SkyBridge (Session 148): the gate nobody knew was a gate

SkyPeak published 2,205 rows and left one instruction: wire `cpl-chat` to them.
Doing that took an afternoon. **Finding out why some credentials were unreachable
at all took the rest of the day, and it was the bigger result.**

### (a) What was learned

**`ccc_rec` was not merely a lossy summary — it was a RETRIEVAL GATE.**

`search_statewide_recommendations` carried `and c.ccc_rec is not null`. That looks
like a null-guard. It is a **membership test**, because of where `ccc_rec` comes
from: `excel_to_dashboard.py` builds it as `ccc_recs.most_common(1)` over a
credential's **articulation rows**. No adoptions → no articulations → no rec
strings → `ccc_rec` is NULL. So the gate silently reads *"has any college already
adopted this?"* and excludes everything that has not.

Measured live:

| | |
|---|---|
| Statewide credentials with zero adopters | 38 |
| …with `ccc_rec` NULL | **38 of 38** |
| …with published recs in `chatbox_credential_recs` | 36, carrying **75** rec lines |
| `search_statewide_recommendations('carpenters apprenticeship')` | **0 rows** |
| `college_adoption_opportunities('Bakersfield College', 50)` → zero-adopter rows | **0** |

The adoption route missed them for a **second, independent** reason:
`potential_colleges` derives from `adoption_leverage`, which derives from
articulations, which do not exist yet. Two different code paths, same blind spot,
neither aware of the other.

So the exhibits MAP deliberately creates **ahead of demand** — the Carpenters
ladder (10 trades), NCCER (13 levels), the CSLB contractor licences, ICC
inspector/plans-examiner, OSHA 10 and 30, Commercial + Residential Electrical
Apprenticeship — were unreachable on **every** credential route. Not ranked last.
Excluded. The exact inverse of Sam's ruling that they be *prominent choices for
adoption*.

**The generalisable form:** a derived summary field is dangerous as a lossy value
and *far* more dangerous as a **filter**, because a filter's failure is invisible —
the row does not appear wrong, it does not appear. And the derivation chain here
(adoptions → recs → `ccc_rec` → retrieval gate) meant the credentials hardest to
find any other way were exactly the ones excluded.

**Two bands, not one re-sorted list.** The obvious fix to "unadopted sorts last"
is to flip the sort. That would have been wrong. `peer_leverage` ("peers teach the
course and articulated it, you have not") and `ready_to_adopt` ("a statewide
standard nobody has taken up") are **different claims**, and merging them lets
Sierra say *"N peers already articulate it"* about a zero-adopter credential — a
fabricated route to a counter where nobody expects the student. Slot reservation
(a third of the budget, min 3) makes the shelf prominent without letting the same
38 construction credentials head every college's answer.

**The shelf collapses to almost nothing.** 36 credentials · 75 rec lines · but only
**32 distinct courses**; 18 of those serve 2+ credentials and **31 of the 36 are
reachable through a course shared with another**. *Introduction to Construction
Safety* alone appears in **12**. It is a small course cluster, not 38 independent
adoption decisions — which is a completely different pitch to a college.

### (b) Current state

`cpl-chat` **v40 live**. `credential_recs_for_titles(titles)` batches the full set
for whatever titles a route matched — one round-trip, and deliberately *not* a
second search function, because a second matcher over the same vocabulary would
drift from the first and attach recommendations to a credential Sierra never
named. The credential and volume route groups now run **concurrently**, buying
back more than the batched lookup costs.

`renderRecLines()` leads with the LIST. POST renders **10 lines · 9 carrying a
C-ID · 8 distinct · 1 with none**, and the `AJ 110` repeat ships both counts,
flagged and never auto-resolved.

### (c) Roadmap

The local-course↔CR alignment layer (`docs/local_course_alignment_lessons.md`) is
the next build and Sam has asked for it. Then the Cerritos false absence, which is
**still open** — and note Cerritos is now a false absence in *two independent
ways*: the raw corpus abbreviates its titles, and the M-ID leverage layer omits it
from welding adoption entirely.

### (d) Next concrete step

Build the alignment layer: a per-course table from the 141k-row COCI list, a
peer-articulation table keyed by credential + rec, one RPC returning both signals.

### Verification note

`tests/sierra_credential_recs.test.js` is **behavioural, not source-regex**: it
lifts the three renderers out of the `.ts` and runs them against fixtures copied
verbatim from live RPC output. The failure being guarded — "does the context
actually list the ten courses" — is invisible to a grep. Doing that forced
`tests/lib/lift_ts.js` to learn nested generics (`Promise<Map<string, any>>`) and
optional parameters; **both broke a sibling test at lift time with a `SyntaxError`
pointing at the parameter rather than at the signature that changed.** One
stripper in the repo, not two.

---

## 2026-08-13 — SkyTop: the false zero, and the three defects behind it

The Cerritos ironworker false absence has been carried as a diagnosed-not-fixed
item across three sessions. It is fixed. It was never one defect.

### (a) What was learned

Sam asked, as a student would, and reported it twice — the second time at
**12:04 UTC on 2026-08-13, four hours after v42 shipped**:

> *"I have a journey worker license as Iron and Steel worker. What CPL can I get
> here?"* → nothing.
> *"You should have data on iron and steel articulations at Cerritos."*

Cerritos has **thirteen** ironworker credentials. Three independent defects hid
them, and none of the week's alignment work touched any of them.

**① The raw corpus abbreviates, and there was no curated route beside it.**
`search_exhibits_by_topic_v2('iron')` returns **0 STATEWIDE** — there is no
"iron" substring anywhere in `chatbox_exhibits`. The prior diagnosis framed this
as a Cerritos problem; it is corpus-wide. And there was **no college-scoped
curated credential search in existence**, so for a named college the raw corpus
was the only thing ever asked.

**② `search_credentials_any` never searched `issuer` or `trainer`.** It is a
whole-string `LIKE` matcher over title and variants only. So the plural failed
outright (`ironworkers` → **0**, `ironworker` → 25), and the awarding bodies —
*Field Ironworkers Local 416*, *International Association of … Reinforcing Iron
Workers* — were invisible.

**③ The route reaching LOCAL credentials had the narrowest probe budget.**
`fetchAnyCredentials` used 3 pairs / 3 singles against 4/4 elsewhere. Simulated
against Sam's actual sentence, keywords are `[journey, worker, license, iron,
steel, worker]` and the probes were `[journey worker, worker license, license
iron, journey, worker, license]` — **"iron" was never asked**, while
`search_credentials_any('iron')` returns 25 rows. The subject of the sentence
was dropped by a `slice`.

**⭐ It generalises far past Cerritos.** Measured across the 1,987-credential
catalogue:

| | |
|---|---|
| issuer carries a word absent from title **and** all variants | **1,795 (90%)** |
| curated title carries a word absent from every raw variant | **597 (30%)**, 465 adopted somewhere |

So the name-only search was structurally unable to find a large fraction of the
catalogue by the term a person would actually use.

### (b) What shipped

Migration `credential_search_issuer_plural_and_college_scope`:

- **`search_college_credentials(asked, college, limit)`** — the curated names a
  *named college* has articulated. Runs **unconditionally** when a college is
  known, deliberately not gated on the topic route being empty: the raw corpus
  returning rows does not mean it returned the *right* rows.
- **`cx_credential_match_tier()`** — one shared ladder so the two entry points
  cannot drift. Tiers 1–4 unchanged; **new tier 5 issuer/trainer**, **tier 6
  `search_text`**, both below the title tiers because an issuer match is weaker
  evidence. Ranking still scores the **best single name**, never the
  concatenation.
- **`cx_needles()`** — singular/plural folding, mirroring `synonymKeys()`.
- `fetchAnyCredentials` widened to 4/4/8.

Result: `search_college_credentials('iron','Cerritos College')` → **all 13**.
Ten at tier 3 by title; **three at tier 5** (`FIW Orientation`, `Foreman
Training`, `Post Tensioning 3`) that **no query could reach before**, because
only their issuer says "iron". Plural works. No regression on welding/CompTIA.
Live as **cpl-chat v44**. `tests/sierra_college_credentials.test.js` — 18 checks.

### (c) The two guards that matter in the renderer

**A false zero is the worst answer Sierra can give.** A wrong answer invites
correction; *"there is nothing"* closes the conversation and nobody files
feedback about a door they were told did not exist. Sam only caught it because
he already knew the answer. So:

- the section carries an explicit instruction — *never say a college has none of
  something when this section lists it* — plus the concrete abbreviation example
  rather than an abstract warning;
- it is appended **outside** the recommendation `try/catch`, because both
  branches rebuild `credentialContext` from scratch and a false zero must
  survive the enrichment breaking;
- a tier-5 hit **discloses** that the title did not match, so the model never
  reports `FIW Orientation` as though the college named it for ironwork.

Durable: `methodology-search-the-awarding-body-not-just-the-name`.

### (d) Current state and next step

Open from the 5-row feedback queue (Sam had triaged the backlog from 25 down to
5 himself): **"Wrong contact information for RCC"** and an up-rated **export /
download** request. Still open corpus-wide: `chatbox_college_profiles` stale
since 2026-06-25; 12 adoption-file statewide titles absent from
`chatbox_credentials`; corpus covers 59 of 123 colleges.

Next: Sam re-asks the ironworker question against v44 to confirm the prose —
sessions remain egress-blocked from `*.supabase.co`, so no session has read her
actual words on this path.
