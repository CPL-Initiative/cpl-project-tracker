---
title: CourseControlNumber Re-mint — Decisions & Lessons
date: 2026-05-22
prs: [83, 84, 85]
tags: [remint, decisions, knowledge-base, m-id, c-id, ccn, curation, supabase, over-merge, atomic-land]
artifacts:
  - kb/remint_out/alias_map.json
  - kb/remint_out/VALIDATION_1c.md
  - kb/remint_out/promotions.json
  - kb/promotions.json
  - kb/_remint_apply.py
  - kb/_remint_apply_articulations.py
  - kb/_remint_apply_clusters.py
  - kb/_remint_dryrun.py
  - kb/remint_dryrun/report.md
---

# CourseControlNumber Re-mint — Decisions & Lessons

A reference write-up of what we did on 2026-05-22 to re-key the entire minted
identity layer, why each decision came out the way it did, the validation
methodology, and what to reuse next time. Pairs with [`CLAUDE.md`](../CLAUDE.md)
(the operational rules — see Rule 7 and §10) and [`kb/README.md`](../kb/README.md)
(the schema).

## TL;DR

- We re-keyed all **72,481** old `M-ID SUBJ NNN` ids into CCN-shaped 4-character
  surrogates (corroborated `SUBJ M####` all-digit, e.g. `ELET M1001`; stand-alone
  `SUBJ M####` with band+digit+2 letters, e.g. `ABDY M10AA`).
- We rebuilt memberships at **College + CourseControlNumber** granularity so each
  member carries its own official `C-ID/CCN`. The lossy `(subject, number)` +
  title-Jaccard join is gone.
- We captured the 2,083 over-merge splits in a new `kb/promotions.json` so Phase
  A/B in `export_unified_courses()` consolidates **exactly**, not by scanning
  member CIDs (the new memberships are remnant-only and carry none).
- We landed producer (kb) and consumer (`export_unified_courses`) in **one
  commit**. Coupling is real: new consumer + old kb collapses Phase B to 0 and
  member rows to 76 (verified).
- The "Articulations by Unified Course" card now leads with C-ID identities;
  total adoption leverage dropped 64,732 → 47,994 — that's **over-merge
  double-count removal**, not signal loss (`POLS 110` lev 72 unchanged; the
  duplicate over-merged M-ID for the same exhibit collapsed away).
- M-IDs are now **stable identifiers**. No more bulk renumbers (CLAUDE.md
  Rule 7). Old → new alias preserved in `kb/remint_out/alias_map.json` for
  rollback and provenance.

## The problem we were fixing

Before the re-mint, an M-ID's membership was a list of `(subject, course_number)`
pairs. That key is **globally ambiguous**: "MATH 31" is Plane Trig at one
college, Pre-calc at another, "Undergraduate Research Experience" at a third.
Two bugs flowed from that:

1. **Lossy member-join.** When `export_unified_courses()` showed an identity's
   member college courses, it fetched every raw row with that `(subject,
   number)` and re-applied a title-Jaccard ≥ 0.5 filter to discard obvious
   mismatches. The filter caught the worst cases but lost precision at the
   borderline.
2. **Over-merge inflation in adoption leverage.** A given M-ID's
   `colleges_offering` was the union of colleges teaching ANY same-(subject,
   number) course passing the loose title filter. For common titles like
   "American Government and Politics" — which most colleges teach with C-ID
   `POLS 110` — the M-ID then double-counted the C-ID colleges, **inflating
   adoption leverage on the M-ID** even though those colleges already
   officially taught the C-ID version.

The visible symptom was that the headline "Articulations by Unified Course"
card's top-50 was led by **over-merged M-IDs** (`POLS 188` lev 110, `ECON 146`
lev 98, etc.) — duplicates of the real, authoritative C-ID identity rows
sitting further down the same list.

## The fix in three layers

1. **Identity keys** — rename old `M-ID SUBJ NNN` to CCN-shaped surrogates so
   the key family is honest and won't collide with official C-IDs/CCNs.
2. **Memberships** — rebuild at College + `CourseControlNumber` granularity,
   each member carrying its own `(college, control_number, subject,
   course_number, units, credit_status, top_code, official_C-ID/CCN)`. The
   member-join becomes exact.
3. **Promotions manifest** — for each title that has both a minted remnant
   (rows without an official id) AND official-bearing members (rows carrying
   `C-ID:ACCT 110`, `CCN:ANTH C1000`, …), emit a `promotions[new_id]` entry
   recording the remnant + the per-target official members. Phase A/B
   consolidation reads this directly, no member-CID scan.

## Decisions, with the reasoning that locked them

### Numbering format

- **Corroborated** (≥2 colleges sharing the title) → all-digit `SUBJ M####`.
  Mirrors CCN's `SUBJ C####`: leading digit is the band (`9` noncredit /
  `1` credit), next 3 are the within-(subject, band) sequence. Max
  corroborated bucket is **496** (well under 1,000), so 3 sequence digits fit
  with comfortable headroom.
- **Stand-alone** (1 college) → `SUBJ M####` where the trailing 2 characters
  are **letters**. The 1,432 max stand-alone-per-bucket overflows 1,000, so we
  needed more than 3 digits OR a different encoding within the same 4-char
  width. Sam's `99AA` idea (band + 1 sequence digit + 2 letters) gives
  10×26×26 = **6,760** combos per (subject, band) — ~4.7× headroom — while
  keeping the code 4 characters. Bonus: the trailing letters are the visual
  tell that distinguishes stand-alones from corroborated codes.
- **The leading `M`** sits where CCN puts its `C` (Course Type Identifier).
  That collision-safety is the entire point: an M-code must **never** be read
  as an official CCN. We considered `Ms` (minted-singleton) for stand-alones
  but rejected it in favor of the cleaner 4-char family where letters carry
  the singleton signal.

### Banding strategy

- We band by **`credit_status` only**: `9` = noncredit / noncredit-enhanced,
  `1` = credit. We do NOT use the full CCN band semantics (`0`
  non-transferable, `1`/`2` lower-division, `3`/`4` upper-division, `9`
  noncredit) because we don't reliably have transferability /
  degree-applicability data for every course. Honesty over false precision.
- The `1` is non-semantic for now (no transferability claim). The `M` prefix
  itself already disclaims CCN equivalence.

### Synthetic 4-letter subject (SUBJ4)

- There is no public authoritative CCN 4-letter subject-abbreviation list (as
  of 2026-05). So we **synthesize** SUBJ4 deterministically from the modal
  local subject code among a title cluster's members (`re.sub("[^A-Z]","",
  upper)[:4]`, with a `MISC` fallback). Document loudly that this is **our**
  surrogate map, not a CCN claim.
- The synthesis canonicalizes local variants: `MTH`/`MAT`/`Mathematics
  (MATH)` all collapse to `MATH`; `MEDS`/`ALH`/`MA` collapse to `NURS`. That's
  the intended cross-college consolidation. A few looser folds (e.g. `PSYC`
  into `CHDEV` for some clusters) are the **pre-existing** title-grouping
  over-merge — already flagged via `subject_spread` / `over_merged` on the
  identity. The re-mint neither introduces nor worsens it.

### Atomic land (producer + consumer in ONE commit)

- The kb re-key (producer) and the `export_unified_courses()` rewrite
  (consumer) are coupled by the data model. **Either alone is broken:**
  - **New export + OLD kb** → memberships have no `control_number`, no
    `promotions.json`, so Phase B collapses to 0 and member rows collapse to
    76 (verified in the validation harness).
  - **Old export + NEW kb** → Phase A's member-CID scan finds nothing (new
    memberships are remnant-only), so consolidation silently stops.
- Therefore the land is **one git commit** on the branch (`6555918`),
  followed within the same window by the gated Supabase re-key. The window
  must close before the next daily cron (10:17 UTC), since the workflow runs
  `_apply_curation.py` BEFORE export — a cron firing mid-window would pull
  old-keyed Supabase rows back over the re-keyed git overlay.

### Curation: alias, do NOT regenerate

- The 6 curated `M-ID` keys (plus the curated `UC-CUR-…` cluster) are the
  human-reviewed quality anchor. They are aliased through the same
  `kb/remint_out/alias_map.json` (old key → new key). We did NOT regenerate
  curation — that would lose human work.
- `merge_into` values were inspected — all pointed at the `UC-CUR-MPG029OM`
  cluster (not an M-ID), so no value rewrites were needed. The transform was
  purely a **key rewrite** in both the git overlay (`kb/coci_curation.json`)
  and the live Supabase `kb_curation` table.
- We required the abort condition: if any curated M-ID's new key were in
  `promotions.json` (i.e. the title was a split), we'd stop and ask. All 6
  were clean renames.

### Phase A/B sourced from `promotions.json` (not member-CID scan)

- The OLD model: an M-ID's members carried both CID-bearing and non-CID rows;
  Phase A scanned them, found one C-ID, Phase B folded the M-ID into that
  C-ID anchor (or synthesized an official row when ≥2 M-IDs agreed).
- The NEW model: memberships are **remnant-only** (CID-bearing rows are
  split out into the promotions manifest), so the member-CID scan finds
  nothing. Instead, `_row_official(r)` aggregates `promotions[i].official_targets`
  across the row's constituent leaf ids. Same downstream semantics (single
  agreed → `{cid: …}`; >1 → `{cid_conflict: […]}`; never consolidates
  conflicts), exact source.

### `UC_KB_DIR` / `UC_OUT_DIR` test seam

- We added two env-var overrides to `export_unified_courses()` so the
  validation harness could run it against the **preview** kb files and capture
  outputs in a temp dir, without disturbing live tracked files. Defaults
  preserve production behavior; they're unset in the daily cron.

## Validation methodology

The pattern we used and intend to reuse for large data re-shapes:

### 1. Measure-first dry-run

`kb/_remint_dryrun.py` measured the *distribution* of fates (rename / vanish /
split / orphan) before any apply work. It produced
`kb/remint_dryrun/{report.md, alias_map.json}` — a 9MB committed artifact that
let us answer "what changes?" without changing anything. Output:
**70,398 rename / 0 vanish / 2,083 split / 0 orphan**, with the 6 curation
entries all classified as clean renames.

### 2. Go/no-go output diff before land

`kb/remint_out/VALIDATION_1c.md` documents a side-by-side comparison of
`export_unified_courses()` outputs run against the **preview kb** vs the
**committed production baseline**. The criteria the user set:

- Phase B consolidation **must be ≥ old** (else the wiring is broken).
- Row counts and kind distribution explained.
- Members.js identities + member-row counts diffed.
- Spot-checks: a known anchor fold (`ACCT 110` ← N M-IDs); a remnant
  (`ACC M1004`); a synthesized official row; an exact member-join
  faithfulness sample.
- Headline re-rank confirmed as expected, not a surprise.

Result: Phase B 209 → **288** (up), 896 → **1,323** M-IDs consumed (up). 297/300
sample identities had member-row counts matching their `coci_minted_memberships`
entries to the row; 3 off-by-one from raw `CourseControlNumber` duplicates +
the intentional `(college, code, title)` dedup. Verdict: GO.

### 3. Fresh-read safeguard for shared systems

Before the Supabase re-key we did a **fresh** `SELECT` and counted rows. That
caught a 6 → 7 drift: `map@rccd.edu` had added an `M-ID AELE 100`/discipline
curation entry **after** the morning `_apply_curation.py` sync but before our
write. We synced git from Supabase, re-ran the dry-run to confirm the new
entry was a clean rename (`AELE 100 → ELET M1001`), then proceeded.

Generalize: **never write to a shared system from a stale snapshot.** Always
read fresh at write-time, alias every old key in the read, abort if anything
maps to a class we said we'd halt on.

### 4. The C-ID extractor `MUST-FIX`

While preparing the dry-run, the user spotted doubled-number C-ID targets
(`AG-PS 104 104`, `AG-EH 108 108 L`) from the raw `CIDNumber` column. Pulling
on that thread surfaced three distinct defects in the column:

| defect | example | repair |
|---|---|---|
| doubled course-number token | `AG-PS 104 104` → `AG-PS 104` | collapse consecutive dup tokens |
| multiple C-IDs in one comma cell | `ENGL 110, ENGL 120` → 2 atomic targets | split on `,` |
| `000` placeholder number | `MUS 171 000` → `MUS 171` | drop `000` tokens |

`parse_cids()` in the dry-run + apply generator now validates every emitted
target against `CID_RE = r"^[A-Z]+(?:-[A-Z]+)? \d{2,4}[A-Z]?(?: [A-Z]{1,2})*$"`.
Legit variant suffixes (`L`, `X`, `S`, attached letters like `120A`) are
preserved. **Malformed targets remaining: 0.**

## The headline effect (case study)

Before the re-mint, the "Articulations by Unified Course" card's top entry for
AP US Gov was an **over-merged M-ID** (`POLS 188`, leverage 110) — a duplicate
of the authoritative C-ID `POLS 110` (leverage 72) sitting 5 rows below. The
M-ID's 110 came from counting the C-ID colleges via the lossy (subject,
number) union. The user might have read the card as "AP US Gov has 110 + 72 =
182 adoption opportunities" when the real number is closer to 72.

After the re-mint:
- `POLS 110` (C-ID) keeps leverage **72**. The authoritative signal is untouched.
- The minted remnant for "American Government and Politics" — only the
  1 college teaching it without C-ID alignment — becomes `POLS M10AA` with
  leverage **1**.
- The duplicate row vanishes from the top-50.

Total adoption leverage 64,732 → **47,994** (deflation **16,738**). Every bit
of that deflation is double-count removal traced to real over-merged identities;
C-ID leverage on every credential we sampled is unchanged.

**Watch out** when communicating this externally: people who saw the OLD
top-50 may notice the headline number "drop." It's a correction, not a
regression. Lead with the C-ID rows that now correctly anchor the table.

## Files & artifacts (where everything lives)

| What | Path |
|---|---|
| Authoritative old → new alias | `kb/remint_out/alias_map.json` |
| Split manifest (Phase A/B input) | `kb/promotions.json` (and copy at `kb/remint_out/promotions.json`) |
| Validation diff report | `kb/remint_out/VALIDATION_1c.md` |
| Patch artifact (1c-ii export change) | `kb/remint_out/export_1cii.patch` |
| Re-mint generator (minted + memberships + singletons + alias + promotions) | `kb/_remint_apply.py` |
| Re-mint generator (articulations re-key + leverage recompute) | `kb/_remint_apply_articulations.py` |
| Re-mint generator (cluster member re-key) | `kb/_remint_apply_clusters.py` |
| Dry-run script | `kb/_remint_dryrun.py` |
| Dry-run report + alias | `kb/remint_dryrun/{report.md, alias_map.json}` |
| Curation sync (Supabase → git, used daily) | `kb/_apply_curation.py` |

PRs:
- **#83** — dry-run + decisions, no machine-layer or Supabase writes.
- **#84** — atomic land: producer (kb files re-keyed) + consumer (export
  rewrite) + curation overlay re-keyed. Supabase `kb_curation` re-keyed live
  in the same session.
- **#85** — dashboard HTML regen so the Articulations card was current on
  Pages before the next cron, plus M-ID format updates in `kb/README.md` and
  `docs/exhibit_unification_vision.md`.

## What's deferred (open follow-ups)

1. **EACR interactive re-pivot (Approach B).** The "Exhibit Adoption & Credit
   Recommendations" interactive table is still grouped by
   `(Unified Title, CPL Type, Collaborative Type)` — credential-driven. The
   re-mint enables a Unified-Course-identity grouping (mirror what
   `_build_articulations_by_course()` does, but interactive + filterable).
   Architecturally significant; over-merge would directly affect headline
   adoption numbers there too. CLAUDE.md §9 has the design notes.
2. **Singleton-only worklist refinements.** Consider a `same_college` / blank-
   discipline filter on the worklist; extend the V2 grouping with a
   description tie-breaker for borderline cross-college pairs.
3. **Description-similarity tie-breaker (member-join Phase C candidate).** The
   exact `control_number` member-join handles the precise cases; for the
   ambiguous middle band (titles that differ but might still be the same
   course), TF-IDF/cosine on `CatalogDescription` could help. Prototype +
   *measure* before committing — descriptions share boilerplate that can
   inflate naive similarity.
4. **Description-aware discipline inference passes 6+.** ~7,193 disciplines
   are still blank, mostly in the `4930.xx` academic-catch-all TOP buckets
   deliberately omitted from the TOP-map. Best closed by curator review now
   that the tab is well-tooled (verify-N-filtered, suggested-merges worklist).

## Lessons / patterns to reuse

- **Measure first, change second.** A dry-run that maps the *distribution* of
  outcomes before you build the apply step is cheap, reviewable, and
  decouples the data question ("what changes?") from the implementation
  question ("how do we change it?"). The 9MB alias map committed as an
  artifact is the receipt.
- **Atomic land for coupled producer/consumer.** When the data model changes,
  schemas need to land in lock-step with the code that consumes them.
  Verifying the broken-half states (new code + old data, old code + new
  data) is the cleanest justification.
- **Fresh reads before writes to shared systems.** The 6 → 7 Supabase drift
  caught by the count-check is the lesson. Generalize: the snapshot you
  computed against is stale by the time you write; re-read at write-time and
  alias everything you find.
- **Bidirectional aliases for rollback.** Keep the old → new alias committed
  and treat the rollback (new → old) as derivable from it. Don't make
  rollback depend on memory.
- **Honest banding / honest claims.** When the data doesn't support a
  semantic, say so. We band by `credit_status` only (not transferability)
  because that's all we know. The `M` prefix is loud enough to disclaim CCN
  equivalence.
- **Cron-window discipline.** The daily cron is itself a write to shared
  state. If your land touches files the cron also touches, do it within one
  cron-cycle window (here: 10:17 UTC fire-to-fire) and verify the intervening
  sync direction is friendly.
- **Validate UI-impacting changes by output diff** when a browser test isn't
  available. Pipe both branches through the production generator with an env
  override, diff the generated artifacts, and treat the diff as a
  reviewable go/no-go artifact.
- **Defer scope-creep gracefully.** EACR Approach B was tempting to bundle —
  it would have made this PR architecturally significant in a different
  dimension and shipped during a brittle window. Saying "next session" was
  cheap and preserves momentum without locking in semantics on the back of a
  re-key.

## How to roll back (if it ever comes to that)

The land is reversible, but **only inside the cron window**:

1. **Git revert** the land commit on `main`:
   `git revert 6555918` (or whatever the merge SHA was). This restores the
   old kb files and the old export. `kb/coci_curation.json` reverts to the
   old keys too.
2. **Supabase rollback.** Read fresh, alias every new key back to old:
   `UPDATE public.kb_curation SET course_id = '<old>' WHERE course_id = '<new>';`
   for each row. The inverse mapping is `kb/remint_out/alias_map.json` read
   right-to-left (it's authoritative); restrict to the rows that actually
   have new keys.
3. **Cron-window** — same constraint as the land. The 10:17 UTC cron runs
   `_apply_curation.py` before export, so any half-rolled-back state mid-
   cron will get re-synced. Close the window before the cron fires.

If you need to revert AFTER the cron has run new-key state into more daily
commits, the kb files on `main` will be the regenerated new-key versions and
a `git revert` would conflict. At that point a fresh "un-mint" generator is
cleaner than a revert — but you almost certainly don't want to be there.
