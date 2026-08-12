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
PII — directory information for a public programme** — and the Session-144
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
