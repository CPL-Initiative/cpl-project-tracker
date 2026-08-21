---
title: College & district identity — lessons
created: 2026-08-12
updated: 2026-08-12
tags: [lessons, identity, taxonomy, districts, mis, reference-data]
artifacts:
  - kb/_build_college_identity_crosswalk.py
  - kb/college_identity/2026-08-12/crosswalk.json
  - kb/reference/mis_district_college_codes.json
  - kb/reference/ccc_coll_dist_2025.json
  - kb/reference/ccc_colleges_ceo_2026.json
related:
  - "[[docs/kb-notes/methodology-validate-a-code-column-by-its-structural-invariant]]"
  - "[[docs/kb-notes/methodology-a-safe-fallback-is-caller-specific]]"
---

# College & district identity — lessons

Sam, 2026-08-12: *"I continue to see a disconnect in routines when comparing
college text string names (e.g., Mt San Antonio vs Mt. San Antonio)… I'm not
sure if we ever assembled a supabase college and district taxonomy of the
various text names all running off the authoritative CollegeID and District ID."*

We had not. This is the workstream that assembled it.

## 2026-08-12 — SkyLink (Session 141): four sources, one key

### What we found

**1. Three systems named these colleges and none knew about the others.**

| | Key | Names | District |
|---|---|---|---|
| Supabase `map_colleges` | **`college_id`** — authoritative | Title Case | — |
| `kb/college_short_names.json` | canonical **name** | Title Case + short | — |
| `kb/reference/mis_district_college_codes.json` | `district_code` + `college_code` | ALL CAPS | ✅ only one |

**24 of 116 colleges were spelled differently** between the first two —
`Mt. San Antonio College` vs `Mt San Antonio College`, `College Of The Desert`
vs `College of the Desert`, `Miracosta` vs `MiraCosta` — plus two genuine
renames (West Hills College Coalinga → **Coalinga College**) that no alias list
catches on its own.

**2. `map_colleges.variants` already existed and was EMPTY on all 128 rows.**
The right shape, never populated. An earlier measurement that "only 17 names
fail to resolve" was flattering: everything resolved by exact `college_name`
match because Supabase sources happen to agree *with each other*.

**3. No district existed in the database at all** — zero columns matching
`%district%`. The 72-district picker on My College was powered by a JS file
with no database backing and no district ID.

**4. Sixteen Supabase tables key on a name string**, including
`coci_college_programs` (22,335 rows) and `coci_college_offerings` (16,097).

**5. The answer was already in the repo.** `kb/reference/mis_district_college_codes.json`
is Appendix A of the CCCCO MIS Data Element Dictionary, a PDF Sam supplied on
2026-08-08 and Session 128 parsed. It had never been joined to anything, and its
own `_warning` already prescribed the fix: *"the join is by NAME and should be
done ONCE, curated, with non-matches reported rather than fuzzy-matched."*

### ⭐ The finding worth carrying: a supplied code column can be scrambled

Sam then supplied a 2025 roster whose `LocationID` column looked like the
missing identifier. Every value was a plausible three-digit code, and the first
row — Allan Hancock, 611 — matched Appendix A exactly.

**Of 106 comparable codes, 3 agreed.** The column had lost its row alignment:
real MIS codes attached to the wrong colleges. Spot-checking cannot catch that,
because every individual value is still genuine. What caught it was a property
the codes must satisfy *as a set* — MIS college codes are **district-prefixed**:

| | multi-college districts whose codes share a prefix |
|---|---|
| Appendix A | **25 of 26** (LA CCD = 741–749) |
| the roster | **3 of 23** (LA CCD scattered 121/234/312/422/471/571/721/748/862) |

Had we trusted it, 113 of 116 colleges would have been keyed to another
college's identifier with numbers that look right in every cell. Durable note:
`docs/kb-notes/methodology-validate-a-code-column-by-its-structural-invariant.md`.

**The same file's `DistrictType` (M/S) contradicts itself** — 37 rows disagree
with the district's own college count *in that file*, and 14 districts carry
both values (San Diego CCD appears 4 times, marked `S`). Multi-vs-single is now
**derived** from the count: M 66 / S 50.

**But the file was still valuable**, and that is the point: it was kept for what
it *is* good at. Its `MAPCollege` column is a CCCCO-supplied bridge to MAP's own
names, and it took the hand-curated bridge table from **30 entries to zero**.
Its `District` column carries full district names rather than ALL-CAPS
abbreviations. A structurally untrustworthy column is not a reason to discard a
file — it is a reason to mark that column unusable *inside the file* and take
the field from a source that passes.

### Two defects in Appendix A, found by the same method

- **`970/971`** read `{district: CONTRA COSTA CCD, college: COPPER MOUNTAIN
  COPPER MOUNTAIN}` — the PDF parse carried the previous row's district label
  forward and doubled the name. Detected, not assumed: `CONTRA COSTA CCD` was
  the **only** district name mapping to two district codes. The codes are sound,
  so only labels were repaired. Left alone it files Copper Mountain under Contra
  Costa in every district rollup.
- **`470/471`** read `EVERYGREEN VALLEY`.

`verify_source()` re-derives both properties at runtime, so an upstream re-parse
that fixes them makes the patch a no-op rather than a silent overwrite.

**Two independently produced CCCCO files agreeing is strong evidence** — that is
how `EVERYGREEN` was identified as an *upstream CCCCO typo* rather than our
parse. It appears in both, so Evergreen now carries both spellings and a future
file arriving with the error still resolves.

### What the CEO list added

A third file (the CEO tab, 118 colleges / 76 districts) gave the most current
college names, a third independent confirmation of the Coalinga/Lemoore renames,
and a variant nothing else had (`Los Angeles Trade-Tech College` — `norm()`
cannot know *Tech* abbreviates *Technical*).

⭐ It is also the only source naming **North Orange Continuing Education** and
**San Diego College of Continuing Education** as colleges *with their own CEO*.
Appendix A files them as sites; `map_colleges` has no college row for either.
These are the standalone continuing-education institutions the NC / Learning
Partners workstream found sitting at **ZERO** in MAP — and nothing upstream
treats them as institutions, which is a plausible reason why.

⚠️ Its **district** names are not reliable: `San Bernadino Community College
District` (missing the *r*) on both of that district's rows, and Santa Rosa's
district is legally the **Sonoma County Junior College District**, not
"Community College District". Colleges from this file; districts from the 2025
roster.

### A caution I invented and had to withdraw

I withheld the CEO name/email/website columns on a "public repo, compiled
directory" argument. Sam had already ruled that **contacts and staff are not
PII — directory information for a public program** — and the Session-144
handoff adds *"don't invent caution he hasn't asked for."* The columns are now
included. Withholding data a curator supplied for use, on a concern they have
already settled, is a real cost with no benefit.

### Current state

**116 colleges · 116 with a district code · 73 districts · 0 unresolved · 0
hand-curated bridges · 262 name variants, none empty.** Integrity asserted on
the output: zero college codes outside their own district, `college_id` unique.

Placeholders per Sam: `X01` (Madera) and `X02` (Calbright), deliberately
**non-numeric** so they can never be mistaken for or sorted beside a real MIS
code, each flagged `mis_code_is_placeholder: true` and each keeping its **real**
district from the roster.

### Next concrete step

**Populate `map_colleges.variants` from the 116 rows, and add the district
columns.** That is the write that actually ends the Mt. SAC problem — it makes
every one of the 16 name-keyed tables resolvable through one authority. Held
only because three other sessions were live and the change alters name
resolution for every consumer at once.

Two open questions for Sam when it lands: whether districts get their own
`districts` table (73 rows, keyed on `district_code`) or ride along as columns
on `map_colleges`; and whether the two standalone continuing-education
institutions should become `entity_kind='college'` rows so they stop being
invisible.

⚠️ **Futuro Health is `college_id` 133 with `entity_kind='partner'`** (Launch
Apprenticeship is 132). The crosswalk filters to `entity_kind='college'`, so
partners are deliberately absent. Anything resolving a partner name through
`cplCollegeShort()` gets its input back unchanged — the safe-fallback trap — so
**key partners on `college_id`, never on the name**.

---

## 2026-08-21 — SkyVouch: the write landed, and the lint was the point

**PR #1278.** SkyLink built the crosswalk on 2026-08-12 and its own NEXT step said
it had never been written. Sam re-opened it after Sierra reported three of nine
LACCD colleges, adding one requirement: *"I want to include noncredit campuses
and any agencies we host a college landing page for."*

### What shipped

`map_colleges` gained `district`, `mis_district_code`, `mis_college_code`,
`district_type`, `mis_absent_why`, and **`variants` is populated for the first
time — 0 → 118 of 128 rows**, 118 with a district, 73 districts, 0 test rows
touched. A College Identity tab renders it as a lint surface.

### What we learned

**⭐ The exclusion was never in the script.** The builder covered 116 of 128 rows
because the `--map-json` *export* was filtered to `entity_kind='college'`. A
filter in an input looks exactly like a limitation of the tool. Worth checking
before concluding a generator "doesn't handle" something.

**⭐ Two continuing-education institutions had real MIS identities nobody had
joined.** North Orange Continuing Education is `NORTH ORANGE ADULT` (college 863
under district 860); SDCCE is `SAN DIEGO ADULT` (076 under 070). Both pass the
district-prefix invariant SkyLink established, so these are not lucky name
matches. They were never identity-less — the filter was hiding them. The prior
assumption, recorded in several places, that they "have no `map_colleges` row"
was true only of the *credit* arms.

**⭐ The lint found a production defect the mapping never would.** Feeding the
builder every college-name string observed in a live table produced 13 unresolved
names, two of which were `"Cypress College "` and `"San Jose City College "` —
with a trailing space, a real `primary_contact_email`, and a named coordinator.
Neither exact-matches `map_colleges`, so both rendered as having no CPL contact,
silently. **A missing key is indistinguishable from a college that has none.**

**⚠️ Fix the join, not the data.** `map_college_contacts` rebuilds from MAP
nightly, so trimming puts the space back tomorrow — and a load must reproduce its
source rather than improve it.

**⚠️ A variant must never shadow a canonical name.** "Mission College" is a real
college (id 82) *and* a plausible variant of "Los Angeles Mission College".
Letting the variant win attaches one college's coordinator to another — worse
than the blank being fixed. Built as a second pass after every canonical name is
known; measured 0 collisions today, so the guard is preventive. The check failed
against the first cut, which is how the hazard was found at all.

**⭐ A missing value is a finding only for the class it applies to.** Partners
carry no MIS code by definition. Filing them as "unresolved" would push that
counter off zero permanently, which is how a real regression gets lost.

### Sam's ruling, recorded as data

> *"Calbright and LAUNCH get 2 entities—one credit, one noncredit. San Diego and
> North Orange are one entity."*

Stored in `kb/reference/college_identity_rulings.json` with `decided_by` and
`decided_on` — **not** hard-coded in the builder, where a refactor reverses it
silently, and not in the regenerated output, where a rebuild loses it.

**⚠️ Do not mint an identity to close a gap.** The two credit arms need a
`college_id` that exists in neither `map_colleges` nor `map_college_users`.
`college_id` is MAP's to assign; minting one locally would put a fabricated
identifier in the table every other system treats as authoritative. Reported as
`awaiting_map_id` — a to-do with an owner, not a blank.

### Next

1. **MAP supplies the two ids** — then the crosswalk folds them with no code change.
2. Sam looks at the tab in a browser (no session can — egress-blocked).
3. Open: district as columns (done) vs its own `districts` table.

---

## 2026-08-21 — SkyApply: what the crosswalk is for, and a chip for the sandbox

### Sam's question: are we using location IDs rather than text strings?

Measured, and he is right that we mostly are not:

| | Tables | Which |
|---|---:|---|
| Carry `college_id` | **13** | Everything MAP hands us — `map_student_credit`, `map_college_cr_unit`, the published aggregates, `map_colleges`, `map_college_users`, the worklist, staging |
| Text-keyed only | **18** | Everything **we** build — all four `chatbox_*`, `coci_*`, `college_geo`, `cpl_funding_*`, `map_college_contacts`, `map_contact_*`, `tmc_*` |

⭐ **The split follows provenance exactly.** MAP gives us an authoritative id and
every table we build downstream drops it and re-keys on the display string. That
is the whole mechanism behind the Cypress defect: `map_college_contacts` has no
`college_id`, so a trailing space was all that stood between a real coordinator
and being invisible.

Current exposure — distinct college strings that fail an exact join:

| Table | Names | Exact | **Only via `variants`** | Unresolved |
|---|---:|---:|---:|---:|
| `map_college_contacts` | 123 | 118 | **4** | 1 |
| `chatbox_college_profiles` | 130 | 123 | 2 | 5 |
| `chatbox_college_courses` | 120 | 117 | 2 | 1 |
| `college_geo` | 120 | 117 | 2 | 1 |

**Four colleges' CPL contacts are reachable today only because `variants` was
populated last week.** Sam saw two of them.

⚠️ **But `college_id` cannot be the universal key, and the reason matters.** The
entities with no id are the ones he ruled into scope: `Calbright College Credit`
and `Launch Apprenticeship Non-Credit`, both `awaiting_map_id`. An id-only join
drops them silently and permanently; name+variants at least *reports* them. Two
more (`Pima Medical Institute`, `Sage College`) are not CCC institutions and
never will have one.

**The improvement is not switching keys — it is resolving ONCE at load, where a
miss is visible, instead of at every read, where it is silent.**

### The temp-code question: measured "no"

Sam asked whether the cron should mint a temporary location code for an org
arriving without one. Measured: **116 of 116 colleges have an MIS code and every
row has a MAP `college_id`**; the only blanks are 2 partners (permanent, reason
recorded) and 8 test orgs. Nothing arrives code-less.

⚠️ **The failure he was imagining is real but shaped differently: it shows up as
NO ROW AT ALL.** `Calbright College Credit`, `Launch Apprenticeship Non-Credit`
and `Las PosTest College` are present in Sierra's corpus, the courses table and
`college_geo`, and absent from `map_colleges` — so they do not fail a join
loudly, they fall out of it.

⭐ **Record the entity, never invent the identifier.** A synthetic id that later
gets replaced is a re-key project this repo has paid for twice: `UC-CUR-AUTO*`
needed a whole Z-scheme re-mint with a purpose-built Supabase re-key workflow,
and four earlier re-mints severed **53%** of the official-ID fold evidence by
missing one step. And for a partner a "temporary" code is never replaced,
because none is coming — it just starts looking authoritative.

### The suppressed chip

Sam: *"The college/district tab should probably have a chip on rows that are
suppressed (e.g., CA MAP Initiative) — which is our sandbox and had slipped into
the daily report from MAP."*

⚠️ **The name is not the tell**, which is the whole reason a chip earns its place.
Four of the eight sandbox rows announce themselves (`Testing College`,
`CabTest College`), but **`NORCO College - Syllabus Manager`** and
**`CA MAP INITIATIVE COLLEGE`** read like real entities. A reader scanning the
roster had no way to know which rows every consumer throws away.

- The chip says **why**, not what: *"a MAP sandbox organization… no figure on any
  other tab counts it"*, not `entity_kind = test`.
- It reuses the existing `.cid-tag` component and `--mustard-text`, the palette's
  documented caution-text grade — **5.15:1 on white, 4.73:1 on the zebra row**,
  both AA. ⚠️ The first draft reached for `--amber`, which does not exist;
  inventing a palette entry is what the design spec forbids.
- Both `entity_kind` and `is_test` are consulted. They agree on all 8 rows today,
  so the OR changes nothing now — it exists so a future **disagreement surfaces
  as a flagged row** instead of a row half the pipeline hides.
- The count reaches the heading (`… · 8 suppressed`), because this tab exists to
  make absence a figure.

⚠️ **`Las PosTest College` is in `chatbox_college_profiles` and NOT in
`map_colleges`**, so it escapes the `entity_kind='test'` suppression entirely —
there is no row to mark. It is an empty shell, so the worst case is Sierra naming
a college that does not exist, but it should not be reachable.

### Next concrete step

1. Add `college_id` to the tables we build, resolved at load through
   `map_colleges` + `variants`: `chatbox_college_profiles` → `map_college_contacts`
   → `college_geo`.
2. Give the two `awaiting_map_id` entities rows in `map_colleges` (null id, stated
   reason) so they join instead of vanishing.
3. Record `mis_absent_why` on the 8 test rows — they currently read identically to
   an unexplained blank.
