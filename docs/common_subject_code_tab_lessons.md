---
title: Common Subject Code Tab — Evolution & Lessons
date: 2026-05-23
session: 5 (Bruh Quad)
phases: [PR A (UI polish + rename), PR B (variants/badges/typeahead/sort), PR C (validate workflow + TOP/CTE/CIP + label rename), PR D (search focus + labels + collapse-all + scope note)]
status: in progress — PRs A-D shipped; E (local variants data refresh) + F (global column centering) queued
tags: [common-subject-code, csc-tab, curator-tab, faculty-ux, ccr-rename, top-categories, cte, validate-workflow, supabase-schema]
artifacts:
  - canonical_subj4.js
  - CPL_Dashboard.html (tab pane: tab-canonical-subj4)
  - kb/discipline_canonical_subj4.json
  - kb/reference/top_categories.json
  - kb/_seed_canonical_subj4.py
  - kb/_apply_canonical_subj4.py
  - kb/_join_cte_from_top.py
related:
  - CLAUDE.md §11 (M-ID Lifecycle, MC, CID/CIDx Pathway)
  - docs/subj4_canonicalization_remint_lessons.md (Phase 1e foundation — the tab the curator works on)
  - docs/coursecontrolnumber_remint.md (re-mint playbook + curator workflow patterns)
prs: [89 (5a/Phase 1e seed), 98 (PR A), 99 (PR B), 100 (PR C), 107 (PR D)]
---

# Common Subject Code Tab — Evolution & Lessons

Reference write-up of the four-PR series that took the Phase-1e curator
tab (formerly "Canonical SUBJ4") from a developer-utility into a
faculty-facing surface called **Common Subject Code**. Pairs with
[`docs/subj4_canonicalization_remint_lessons.md`](subj4_canonicalization_remint_lessons.md)
(the data-pipeline foundation) and [`CLAUDE.md §11`](../CLAUDE.md).

## TL;DR

- Started from a 16-item curator revision list. Triaged into PRs A→F so
  review burden stays small per PR.
- **PRs A, B, C, D shipped (this session).** Pure-UI / labels / affordances /
  validate workflow / TOP+CTE+CIP columns / search-focus fix.
- **PRs E and F queued** — local-variants data refresh (Variants column
  shouldn't be dominated by the MID-aggregated canonical) and a global
  column-centering CSS sweep.
- Supabase schema migrated (PR C): `validated_at` / `validated_by`
  added to `public.kb_curation`. Non-destructive, RLS-policy-clean.
- Three real bugs caught + fixed mid-stream during PR C apply + PR D:
  the gitleaks-action license issue, the TruffleHog flag swap, and the
  render() focus-stealing refactor.

## Decisions, with the reasoning that locked them

### Decision 1: rename "Canonical SUBJ4" → "Common Subject Code" (PR A)

The old name was internal jargon. "Canonical SUBJ4" reads as
developer-speak; "Common Subject Code" mirrors the **Common Course
Reference** rename Bruh Prime did for the same reasons (faculty
audience, less UC/jargon confusion).

**Internal identifiers preserved.** Filenames (`canonical_subj4.js`,
`kb/discipline_canonical_subj4.json`), Supabase namespace
(`_CANON_SUBJ4::`), URL hash (`#canonical-subj4`), and field names
(`canonical_subj4`, `canonical_subj4_notes`) all stay. UI-only rename —
same backward-compat pattern Bruh Prime used for CCR.

**Lesson:** when renaming a user-facing surface for accessibility,
**don't drag internal identifiers along** unless there's a
machine-readable reason. The two layers have different audiences;
mixing the rename costs are reviewable churn that doesn't move the UX
needle.

### Decision 2: triage 16 items into 3 PRs (PR A/B/C plan)

| PR | Items | Theme |
|---|---|---|
| A | 1, 4, 6, 8, 9, 10, 11 | UI polish: rename, intro rewrite, guidelines modal, "Development Draft" badge, beta-box removal |
| B | 3, 5, 7, 15 | Affordances: variants popup, CID/CCN match badges, typeahead search, sortable columns |
| C | 2, 12, 13, 14 + follow-ups (SUBJ box, MID/CID rename) | Data model: validate workflow (Supabase schema), TOP column + grouping + filter, CIP placeholder, CTE designation |

**Lesson:** when a user drops a 10+ item list, triage by SCOPE not
RANK. PRs A and B were pure UI/affordances — landed quickly. PR C
needed a Supabase schema migration + a TOP handbook parse + ~16,850
data updates — so it shipped as one PR but the curator could review
the data model in isolation.

### Decision 3: force the 4-letter invariant (PR A guidelines modal)

The Rule 7 staging-phase framing requires SUBJ4 = exactly 4 letters.
For disciplines with shorter established abbreviations (PE, KIN, BUS,
ESL, ASL, …), the curator picks a 4-letter expansion (PHYE, KINE,
BUSI, ESLA, ASLN, …). The guidelines modal explains this with
concrete examples so faculty understand why their familiar 3-letter
codes get expanded.

### Decision 4: Variants modal as the "details" surface (PR B)

The Variants column shows top-5 inline + a "Show all (N)" chip that
opens a centered modal. Modal includes:
1. Every local college subject code with M-ID counts (color-coded:
   yellow = most-used, green = canonical)
2. CID descriptors that share any of those subjects
3. CCNs that share any of those subjects

So the curator sees the full official-identifier landscape next to
the local-code landscape in one place. The CID/CCN match badges on
each row become clickable shortcuts into that same modal — single
source of truth.

**Lesson:** when a row has too many details to inline, the "Show all"
chip + centered modal is the right pattern. Don't try to fit
everything into a tooltip.

### Decision 5: Reuse kb_curation with synthesized namespace (PR A foundation, validated in PRs B–D)

The original Phase 1e curator tab writes per-discipline edits to
`public.kb_curation` with `course_id` = `_CANON_SUBJ4::<discipline>`
and fields `canonical_subj4` / `canonical_subj4_notes`. Zero schema
migration; the main `_apply_curation.py` ignores these rows because
they aren't in its FIELDS whitelist.

**Lesson:** synthesized key namespaces (with a sentinel prefix like
`_CANON_SUBJ4::`) let you reuse an existing table for a new logical
schema without migrating. The cost is a small bit of in-band key
gymnastics; the benefit is no DDL coordination, no rollback worry,
no production-cluster apply.

### Decision 6: schema migration for validate workflow (PR C)

PR C's two-stage curation (review → validate) DID need a schema
migration. `validated_at` / `validated_by` columns added to
`public.kb_curation`. Non-destructive (just `ALTER TABLE ADD COLUMN
IF NOT EXISTS`), backward-compat (NULL on existing rows), no RLS
policy change (`is_allowed_reviewer()` already gates writes).

Applied directly via the Supabase MCP tool with verification SELECTs
before + after. No PR cycle for SQL — direct apply with operator
in-the-loop.

**Lesson:** for non-destructive Supabase schema changes with the
operator confirming the exact SQL, direct apply via MCP is the
fastest path. PR cycle is overkill when the code consumer is in the
same PR.

### Decision 7: CCN/C-ID-aware sequence allocation (Phase 1e foundation, surfaced in PR B badges)

The M-ID corroborated format `SUBJ M<band><seq>` shares structure with
CCN's `SUBJ C<band><seq>` — only the prefix letter differs. PR B's
CID/CCN match badges let the curator see at a glance "the canonical
SUBJ4 I picked has N CIDs using the same subject." This is the
faculty-facing version of the back-end reservation logic in
`kb/_subj4_dryrun.py`.

### Decision 8: TOP grouping with collapsible category headers (PR C)

Rows render under 2-digit TOP category headers (e.g. "09 —
Engineering and Industrial Technologies"). Click a header to collapse
its rows. Sort applies WITHIN each group. PR D added a global
"Collapse all" / "Expand all" twisty above the table.

**Why 2-digit grouping + 4-digit column:** the 24 categories give
the right cardinality for navigation (collapsible, visible at a
glance); the 4-digit subcategory gives the cell its specificity.
Hovering the cell shows the 6-digit code + program title.

### Decision 9: CTE designation strategy (PR C)

Parsed from the CCC 2023 Taxonomy of Programs Manual, 7th Ed.
**236 of 380 codes (62%)** are CTE-designated. Three-tier storage:

1. **`kb/reference/top_categories.json`** — authoritative source from
   the manual (one-shot parse, rarely changes).
2. **M-ID-level `cte: bool`** on every `coci_minted_courses.json` +
   `coci_minted_singletons.json` row (idempotent join via
   `kb/_join_cte_from_top.py`). Unlocks §11 Phase 5 CTE classifier
   for free.
3. **Discipline-level aggregate** in
   `kb/discipline_canonical_subj4.json` (`cte_share`, `cte_flag`).
   Drives the UI badge.

**`cte_flag` enum, not bool.** Because colleges assign TOP codes
with discretion, a discipline's M-IDs can straddle the CTE/non-CTE
line. The enum (`all` / `most` / `mixed` / `none`) is honest about
that spread.

### Decision 10: render() refactor for search focus (PR D bug fix)

The curator reported "search box stops after one character." Cause:
`render()` called `renderToolbar()` on every state change, which
recreated the `<input>` element + stole focus.

Fix: clean separation of concerns.
- `renderToolbar()` — called ONCE from `init()` after data loads
- `renderAuth()` — called from sign-in/out paths (the only async
  state change)
- `render()` — only touches table body + summary

The toolbar's `<select>`/`<input>` elements stay in sync with state
because their values are user-driven (onchange/oninput updates
state.* directly).

**Lesson:** stateful UI elements (especially text inputs) get one
init build + per-event in-place updates. Don't rebuild a parent
container that contains a focused input.

### Decision 11: scope note at top of tab (PR D, item 9)

The curator asked for a clarifying note: Common Subject Codes are
used for CPL crosswalk purposes only (not a claim of equivalence
with CCN/CID/etc.) AND discipline names come from the CCC 2025-26
Minimum Qualifications Handbook.

Implemented as a soft-blue callout card with a link to the MQ
Handbook. Sits between the intro paragraph and the guidelines button.

## Bugs caught + fixed (the "what went sideways" log)

### Bug 1: gitleaks-action requires org license (security baseline PR)

The first try at adding a secret scanner failed CI with "missing
gitleaks license." gitleaks-action v8.20+ requires a paid license
for org repos. Swapped to TruffleHog (free for orgs).

### Bug 2: TruffleHog flag swap (security baseline PR)

`--only-verified` was deprecated in TruffleHog 3.82+ in favor of
`--results=verified`. The CLI errored on the unrecognized flag.
Switched to the README's exact recommended config.

### Bug 3: render() focus-stealing (PR D)

See Decision 10 above. Caught when the curator typed in the search
box and the input lost focus after one keystroke.

**All three** had the same recovery pattern: webhook fires →
investigate via WebFetch or direct check → propose minimal fix on
the same branch → push → CI re-runs → green → merge.

## Security tooling baseline (PR #101, separate from CSC work)

Wired in parallel during this session:
- **Dependabot** — pip (`requirements.txt`) + github-actions
  ecosystems. Weekly bumps to a max-5 open-PR limit.
- **CodeQL** — Python + JavaScript static analysis. Runs on push to
  main, every PR, weekly Monday 06:00 UTC.
- **TruffleHog** — secret-detection scan with live-verification
  (`--results=verified`). Runs on push + every PR.

The 5 initial Dependabot PRs (one wave) all passed CI cleanly:
#102/#103/#104 (action bumps) + #105/#106 (pip bumps). Stage 1 (pip)
merged this session; stages 2 (actions/checkout + actions/setup-python)
and 3 (github/codeql-action) staged for follow-on observation.

## What's deferred (queued PRs)

### PR E — Local variants data refresh

The Variants column currently shows the M-ID-aggregated SUBJ4
distribution. After the Phase 1e canonicalization apply, every M-ID
in a discipline carries the canonical SUBJ4, so the list is dominated
by it — uninformative. Need to walk raw local college subject codes
from `kb/coci_minted_memberships.json` (or the COCI raw course list)
and aggregate by discipline. Add a `local_subject_variants` field to
the seed.

### PR F — Global column centering

Curator requested center-aligned cells (H+V) for every column except
the first across the dashboard. CSC tab is the prototype; need to
sweep CCR, KPI cards, project grid, exhibit analysis tables. Some
have asymmetric column intent (numbers right-aligned for math, names
left-aligned for readability) that "center all but first" could
damage — eyeball-review before global apply.

## Patterns to reuse

- **Triage long ask-lists into PRs by SCOPE, not item rank.** Three
  small PRs ship faster than one big one and stay reviewable.
- **Synthesized key namespaces** (sentinel prefixes like
  `_CANON_SUBJ4::`) reuse existing tables for new logical schemas
  without DDL coordination. Cheap to roll back.
- **For UI tabs with stateful inputs, separate toolbar build from
  body re-render.** The toolbar is built once; body re-renders on
  every state change. Inputs keep their focus.
- **Live-verification flags on secret scanners** (`--results=verified`)
  dramatically reduce false-positives on public-by-design tokens
  (Supabase anon keys).
- **Apply non-destructive Supabase schema changes via MCP directly**
  when the consumer code is in the same PR — saves a coordination
  round.
- **Add Y/mixed/none enums for derived flags** (`cte_flag`) instead
  of bools when the underlying data has known variance. More honest;
  curators trust the surface more.
- **Click-the-badge → modal** instead of inflating tooltips. Tooltips
  are for ≤6-line summaries; modals are for full lists.

## How to roll back

The four PRs are independent and revert cleanly via `git revert`:
- PR A (rename, intro, guidelines): UI only
- PR B (variants/badges/typeahead/sort): UI only
- PR C (validate + TOP/CTE/CIP): UI + Supabase schema columns
  (rollback = `ALTER TABLE DROP COLUMN validated_at, validated_by`)
- PR D (search focus + labels): UI only

PR C's Supabase rollback is the most consequential. The columns are
nullable and ignored by all consumer code that doesn't know about
them, so a partial rollback (revert code but leave columns in place)
also works.

## 2026-05-23 (later) — PRs E + F shipped + security baseline staged

PRs E (local-variants data refresh) and F (column centering prototype)
landed in the same session as A–D. Plus all three stages of the
Dependabot baseline merged.

### PR E (#109) — local-variants pipeline

The Variants column was showing the MID-aggregated SUBJ4 distribution,
which post-Phase-1e-apply is uniform (every MID in a discipline carries
the canonical SUBJ4). Replaced with raw college subject codes sourced
from `kb/coci_minted_memberships.json` (corroborated MIDs' member.subject)
and `kb/coci_minted_singletons.json` (each singleton's own subject).

Pipeline change in `kb/_seed_canonical_subj4.py`:
- New `local_subject_variants` field per discipline — top-40 raw codes
  + counts (truncation flag for transparency)
- `local_subject_total` for the full-aggregate denominator
- `data_modal` / `data_modal_is_4letter` / `data_modal_share` now
  computed from LOCAL variants (the "Most-used locally" column reflects
  real local usage instead of the post-canonicalization uniform aggregate)
- `variants_observed` kept as audit-trail (future re-mint replay
  sanity-check), just no longer rendered in the UI

UI change in `canonical_subj4.js`:
- New `variantsFor(entry)` helper — prefers `local_subject_variants`,
  falls back to `variants_observed` for older seed files
- Variants cell + modal + sort getter + rekey-impact calc all switched

**Before / after examples:**
- Sign Language American: `{SLNA: 92}` → ASL(423), SIGN(97), DEAF(74),
  AMSL(38), SL(23), "A S L"(17), DFST(17), SLAN(13), …
- Auto Body Technology: `{AUTB: 196}` → AB(77), APPR(69), ACRP(48),
  ABDY(13), ABOD(8), AUTOBODY(8), AUB(7), …
- Physical Education: `{PHYS: …}` → PE(1047), ATHL(501), KINA(226),
  ATH(214), ES/A(165), KIN(165), PEAC(159), EXSC(153), … (+151 more)

**Side benefit:** CID/CCN match badges in the variants modal now check
against ALL local codes (BI, BIO, BIOL all separately), not just the
MID-aggregated SUBJ4 — richer matches.

### PR F (#110) — column centering prototype

6 lines of CSS scoped to `#tab-canonical-subj4`:
```css
.cs-table th, .cs-table td { text-align:center; vertical-align:middle; }
.cs-table th:first-child, .cs-table td:first-child { text-align:left; }
.cs-table td:has(textarea) { text-align:left; }
```

The `:has(textarea)` selector keeps the Notes cell left-aligned so the
textarea sits flush rather than oddly centered. Supported in all modern
browsers (Chrome 105+, Firefox 121+, Safari 15.4+ — all 2022+).

**Per the agreed plan**, this is the PROTOTYPE. Global sweep (CSC-G on
the roadmap) gated on curator eyeball of the CSC-F prototype before
applying to CCR, KPI cards, projects grid, exhibit analysis tables with
per-table opt-outs for tables with asymmetric column intent.

### Security baseline — all 3 stages merged

Stages flowed cleanly:
- **Stage 1** (#105 python-docx, #106 requests): merged after rebase
- **Stage 2** (#102 actions/checkout v4→v6, #104 actions/setup-python
  v5→v6): merged together as workflow-runtime infra
- **Stage 3** (#103 github/codeql-action v3→v4): merged last; CodeQL v4
  successfully analyzed our code on its own PR — strongest signal

The TruffleHog flag issue from the first CI runs (we fixed across two
attempts: gitleaks-action license → TruffleHog, then `--only-verified`
→ `--results=verified,unknown`) hasn't recurred. PR E + PR F both
passed the new scan cleanly.

### Lesson: idempotent rebase + Dependabot

When two Dependabot PRs touch the same manifest (`requirements.txt`),
the second one needs a rebase after the first merges. Solution:
comment `@dependabot rebase` on the second PR — Dependabot regenerates
the diff on top of the new manifest state, CI re-runs, then it merges
cleanly. The whole flow is hands-off after the comment.

### Lesson: stateful-input render refactor pays multiple ways

The PR D refactor (toolbar built once, body re-renders on state change)
was framed as a search-focus bug fix, but it also makes the tab
faster (no element churn per keystroke) and sets a pattern for future
tabs. Any tab with editable inputs + filter state should follow the
same separation.

### Next session — exhibit-canonicalization revisit

User flagged a pivot to the credential-identity layer (`kb/unified_titles.json`
+ `kb/credentials.json` per `kb/README.md`). The CSC tab work shipped
infrastructure (validate workflow + Supabase schema for two-stage
curation + local-variants aggregation pattern + reusable curator-tab
shell) that may inform the exhibit layer's evolution.

Likely first task: audit `.claude/skills/exhibit-canonicalization/SKILL.md`
+ `docs/exhibit_unification_vision.md` against what's now live, find
the gaps + propose a scoped plan.

---

## 2026-05-26 — CSC-G landed (Sexy Dexy)

The global column-centering sweep promised in CSC-F's prototype shipped
in PR #139.

**What got centered:** Common Course Reference table (`.uc-table`) —
mirrors the CSC-F rule (`th`/`td` `text-align: center; vertical-align:
middle`) with explicit `text-align: left` opt-outs for columns 1 (Kind),
3 (Title), 4 (Discipline). The 9 remaining columns (ID, Credit, Units,
TOP, Subject(s), Members, Adopted, Adoptable, Conf., Flags) are short
categorical/numeric values that read better centered.

**What didn't get centered:** KPI cards and the Projects Grid aren't
tables — natural opt-outs, no change needed. The Exhibit Analysis
tables (`.exhibit-table`) have **mixed column intent** — some columns
class-tagged `.exhibit-cell-num` / `.exhibit-cell-pct` are right-aligned
for math comparison; others are plain `<td>` text (CPL Type, Discipline,
the rank "#" column). A blanket `th { text-align: right }` would align
the numeric headers with their data but misalign the plain-text columns;
a blanket centering would the inverse. Tried the right-align approach
mid-PR, caught the mismatch on the Top-50 ranking table, reverted. The
right fix is per-column `th` classes in the generator — a future sweep
if we want it.

**Lesson:** when applying a "uniform" rule across multiple tables, audit
whether each table's body cells actually share alignment intent. Mixed
intent (numbers right + text left + name left in one row) means CSS
selectors that target the whole `th` band will pick a wrong side for
some columns. Either get per-column markup or leave the mixed-intent
tables alone — don't blanket-rule them.

---

**See also:** [`CLAUDE.md §11`](../CLAUDE.md) for the M-ID lifecycle
+ MC vs TMC framing + roadmap;
[`docs/subj4_canonicalization_remint_lessons.md`](subj4_canonicalization_remint_lessons.md)
for the data-pipeline foundation the CSC tab edits.

---

## 2026-05-27 — Session 11 (Bruh El): CSC-G phase 2 (exhibit-table headers)

### What shipped

**PR #153** — exhibit-table per-column header alignment. CSC-G phase 1
(Session 5/Sexy Dexy) applied H+V column centering to `.uc-table`
(CCR). Phase 1 deliberately punted exhibit-table because its columns
have mixed intent: some right-aligned (`exhibit-cell-num`,
`exhibit-cell-pct`), some left-aligned (`exhibit-cell-name`), and a
blanket center would misalign the ranking tables (Top-50, by-Course).
Phase 2 introduces per-column `<th>` classes so headers align with
their data cells.

Implementation:
- `table_card()` headers parameter accepts `(text, kind)` tuples
  alongside plain strings. kind ∈ "num"/"pct"/"name" attaches
  `exhibit-th-{kind}` class.
- All 7 exhibit-analysis emissions updated to tag numeric/percent/name
  columns (By College / Discipline / CPL Type / MoL / Collaborative /
  Top-50 / Articulations-by-Course).
- CSS rules added to `EXHIBIT_ANALYSIS_CSS`:
  - `th.exhibit-th-num { text-align: right; }`
  - `th.exhibit-th-pct { text-align: right; }`
  - `th.exhibit-th-name { text-align: left; }`
- xlsx exporter strips tuples back to plain strings at the export
  boundary (openpyxl can't serialize tuples).

### Lessons learned

**1. Per-column intent beats global alignment rules.**
The CSC-G phase 1 row-centering rule worked on `.uc-table` because
every column there has roughly the same intent (uniform short-text
cells). Exhibit-tables mix numeric/percent (right-anchored) with
identifier/category (left-anchored). A blanket center misaligns one
or the other. The data-side classes (`exhibit-cell-num`) already
encoded per-column intent; the fix was to extend the same convention
to `<th>` with mirror classes.

**2. Backwards-compat via "tuples-or-strings" parameter.**
The headers parameter went from `list[str]` to `list[str | tuple[str, str]]`.
Existing strings keep working unchanged; new tuples carry the alignment
hint. Minimal blast radius — only 7 call sites needed updating, no
other consumer of `headers` had to change.

**3. xlsx export boundary as a normalization point.**
The xlsx exporter passes headers directly to openpyxl, which can't
serialize tuples. Two ways to fix: (a) change all 7 callers to pass
tuples to HTML but strings to xlsx_rows; (b) normalize at the export
boundary. (b) is one line, callers stay clean.

**4. Restore daily-regen noise before committing.**
Running `python excel_to_dashboard.py` to test mutates ~15 generated
files (CPL_Data.js, unified_courses_*.js, exports/*.xlsx, etc).
Committing those would just churn — the daily cron regenerates them.
`git restore <list-of-regen-files>` keeps the PR diff to the actual
source change (one file in this case).

### Strategic roadmap

| What's next | Status |
|---|---|
| Other tables with mixed-intent columns that could use the same pattern (none today; CSC + exhibit-analysis cover the field) | parked unless surfaced |
| Variant headers (sortable indicators on `<th>` → could compose with kind classes) | parked |

### Next concrete step

CSC-G family is feature-complete. Future per-column header conventions
would extend the same tuple+CSS pattern.

## 2026-06-09 — Session 37 (stoic-bardeen): orphan tail on the CSR + FL-split surfacing

Two CSR changes from Sam's live review ("FLSP, etc. subjects don't show on the CSR").
**2 PRs merged (#330, #331).**

### What's been learned
- **The CSR is discipline-grain — a subject with no discipline is invisible.** FLSP
  isn't a discipline; it's a synthetic subject code on a course whose `discipline`
  was blank, so it attached to no CSR row. The fix wasn't a CSR-rendering change — it
  was **disciplining the orphan courses** (#330) so they roll up onto a discipline row,
  plus **surfacing the per-language split** (#331) so the FL codes are findable.
- **Coarse-but-honest beats blank, when flagged.** #330's TOP-division fallback fills
  the ~5.9k orphan tail with a 2-digit-division umbrella discipline (`49`→Interdisciplinary
  Studies, `12`→Health, …) at confidence 0.4 / `⚙ TOP-div`. It deliberately relaxes the
  "leave catch-alls blank" guardrail (Sam: "whole tail please") — reversible, reviewer-
  flagged. Side-effect: re-introduces `subject_collision_signal` (0→1,076), expected
  (the coarse fills haven't been SUBJ4-canonicalized — a future fold queue).
- **A single-grain reference view CAN surface a finer derived layer.** #331: "Foreign
  Languages" stays one row (MQ has no per-language discipline) but now shows a
  `⚯ N splits` chip + a `FLSP · FLFR · …` codes line, and **both** search boxes match
  the split language-names + codes. The trick is loading the split file
  (`kb/foreign_language_subj4.json`) + stamping `entry.discipline` on every seed entry
  so `splitFor()` resolves from raw entries too (the entries are keyed by name but
  don't carry it).
- **Live-state ≠ committed-file.** I'd planned an "invalid→split" status relabel off
  the committed `canonical_subj4: null`, but the live row showed "initiated/FLNG" — the
  daily cron's `_apply_canonical_subj4.py` had folded a Supabase canonical override on
  top. Sam's screenshot caught it. **Check the live overlay, not just the committed
  JSON, before "fixing" a status.**
- **Verify a browser view you can't load** by computing each row from the JSON
  (mirroring the consumer's `status()`/`variantsFor()`), then jsdom-test the real
  consumer (`tests/csr_fl_split.test.js`, 9 checks — mocked fetch + DOM scaffold).

### Current state
The orphan tail is disciplined (blank disciplines ~7,193→~580; CSR gained umbrella
rows). FL splits are searchable + visible. Both live on merge. `canonical_subj4.js`
is a static asset (one file, both HTMLs `<script>`-load it — no Rule-4 mirror).

### Strategic roadmap
- **Curate the coarse fills:** the `⚙ TOP-div` rows are a reviewer queue (the
  "by TOP division" Generated-by filter isolates them); the ~580 no-umbrella residual
  (Media / Fine Arts / Commercial) needs in-tab curation.
- **Canonical-SUBJ4 fold** for the 1,076 new collision rows is a future re-mint
  (confirm the coarse discipline first, then canonicalize SUBJ4).
- The FL-split-surfacing pattern generalizes to any future umbrella split file.

### Next concrete step
Watch the cron land the CCR discipline column for the 6,590 newly-disciplined courses,
then (if Sam wants) tighten the coarsest divisions to finer 4-digit TOP→discipline
mappings where a clean MQ target exists.

## 2026-10-19 (S425 SkyMadrone): the Progress view, MQ discipline, and the daily scan

The tab became the Commons' second host: it opens on a Progress view drawn by `commons_progress.js` (a card for
each of Sam's eight steps, the procedures from `kb/csr_procedures.json`, the findings from the daily scan's
`kb/csr_out/latest.json`), with the table as the Reference view and `#canonical-subj4/<filter>` routes behind every
count. "Discipline" reads "MQ Discipline" (Sam: to keep the two grains apart). Three misreadings fixed on the way: the
SUBJ check's six ruled sharings reported as collisions, the pick's reviewer taken from a later note, and the C-ID index
skipping descriptors ending in " X". Lessons and the measured state: `docs/commons_lessons.md` (S425) and
`docs/reference/lanes/common-subjects-reference.md`.

## 2026-11-04/05 — SkyJujube: the List as Sam's workspace (moved from the lane verbatim, then the evening's lessons)

**Sam's working pass on the codes (SkyJujube, 2026-11-04):** (1) *saves read the session when they write*
(`freshSess`, through `cpl_session.js`): the tab had kept its load-time token, so after a laptop slept every code save
came back 401 under a signed-in tag; a lapsed sign-in now says so, with *Sign in again*. (2) The List sets the engine's
`editByRow`: Edit beside the select box, a row press opens its edit row and moves the panel to it (no cell drawers), a
landed save closes the row, and the edit row holds to the table's visible box. (3) A local code's count names its
courses (tooltip; a press lists them) from `kb/discipline_local_courses/`, built by
`kb/_build_discipline_local_courses.py` over the seed's walk (rebuild with the seed), with *Refile <code> in Local
subjects*. (4) *Check the N changes made this visit* runs the SUBJ check on the changed rows; the scan's rules stay in
`kb/_csr_trail.py`. (5) The panel's local codes carry Colleges beside Courses, sorted by colleges; a code edit fills an
empty Note with *changed code to better align with local discipline use*; keeping a code asks its reason (*kept X:*);
*Check alignment* (engine `edit.extra`) audits the typed code and recommends. **Found:** ECONMT (Los Angeles Trade Technical, 55, TOP 0952.20) is electrician coursework filed under
Electromechanical, and Electricity's top local codes are adult-education ones (AED, APED, HSED):
DR-25 calls through Local subjects; a move is a re-mint. Guards `tests/csr_list.test.js` (6b, 6c, 8, 9, 9b),
`tests/csr_list_panel.test.js` (5b).

**Lessons, 2026-11-05.** (1) A tab that copies the session at load keeps a dead token after a laptop sleeps; read it at
write time through the keeper, and say *lapsed* where the tag sat. Every code save that evening came back 401 while the
tag read signed in. (2) A count of courses measures one college's catalog; count colleges beside it (Diesel: DCDT 24
courses at one college, DIES 14 at four). (3) "Answered this visit" forgets on reload; a save's own time against the
scan's run is the durable test. (4) The scan reads the reference file, which only the manual sync updates: saves are
invisible to it until a session dispatches `phase-1e-sync.yml`. (5) The Common SUBJ, in Sam's framing: four-letter codes
assigned to every MQ discipline (248 listed, 147 with courses), adopted from C-ID and CCN where they exist; the KB note
`reference-common-vs-local-subj-and-discipline-cardinality` section 5 holds it.

## Moved from the lane (S577): Sheet 99's six rulings, all applied

## Sheet 99's six rulings (Sam, 2026-10-19), all applied

Settled, on (the nightly authority confirm), agab, sitting (the 44 and Sheet 104's forestry and wine windows), hide
and rename: each landed between S427 and S432. The full record, with receipts and run ids, moved verbatim to
[`commons_lessons`](../../commons_lessons.md) (S433 section) when this file passed its 20 KB budget.

## Moved from the lane (S577): Sheet 107

**RULED and applied (Sam, Open Asks Sheet 107 cards 1-3, 13:08-13:09Z 2026-10-20, each his own call; S436, one
re-key window, three receipts in apply order in ALIAS_MAPS):**
- *move-both*: AGRI M10SY and M1104 to ENVR (`kb/forestry_wine_remint_out/2026-10-20-stragglers/`).
- *rekey-twelve*: the twelve Foreign Languages identities to their language's code (`kb/fl_stray_remint_out/2026-10-20/`);
  five new umbrella codes FLAM, FLHU, FLEG, FLKH, FLTU, also in `kb/foreign_language_subj4.json`.
- *file-eight*: the 79 identities on ARCE, ARTF, NCAR (to ARTS), CSMT (COSM), BRDC (BCST), FLGH (AVIA), ARTP (PHOT)
  and WELL (HLTH), each taking that discipline (`kb/_blank_stray_remint.py`, `kb/blank_stray_remint_out/2026-10-20/`;
  all 79 gap-filled).
- The allocator now treats every id an earlier re-mint used, and every id SkyView's hand-built layout still draws,
  as taken: the first apply gap-filled six ids onto vacated slots the layout still drew, and CI's orbits lint read
  six duplicate points (`er.skyview_ids()`, S436). Honors Linguistics went to FLNG M11LR instead of M10AF.

Every gate passed on all three (P3 fresh reads of 2, 9 and 39 live rows). After the merge: `supabase-rekey.yml` once
per receipt, in that order, then the read-back.

## 2026-11-05 SkyKumquat (S577): the Subjects List recode

Sam saved eleven codes on the List on 2026-11-04; the 00:15Z sync landed them alone and was reverted (#2787). This run
built the keep-number recode, rehearsed the whole apply locally, and applied it on Sam's "Apply now" (#2790): 2,389 ids,
the seed with his notes, the chain, SkyView's layout, the generated outputs, then `supabase-rekey.yml` and a read-back
(935 keys and 642 pointers on the new codes, none on an old one). Lessons: the handoff named `kb/_subj4_dryrun.py`'s
report as the starting list, but that tool re-sequences (452 curated collisions read as an apply blocker); the prefix
re-key had no blocker at all. CI found what local tests did not: the suggestions file and the ROEP mirror. The first had
to be re-keyed, the second left alone because its records keep their ids. A `git clean` of `kb/` deleted the untracked
planner once; commit a planner before rehearsing with it.

## 2026-11-05 — the Subjects List recode applied (moved from the lane, S611)

Moved verbatim from `docs/reference/lanes/common-subjects-reference.md` at the S611 checkpoint (the lane was over its 20 KB budget; it states current truth).

**APPLIED: the Subjects List recode (SkyKumquat, 2026-11-05; Sam's "Apply now" in session ~01:58Z).** The eleven
codes Sam saved on the List on 2026-11-04 landed with their identities in one window (`kb/_subjects_list_recode.py`,
receipt `kb/subjects_list_recode_out/2026-11-05/`, in ALIAS_MAPS): CSAI to CSIS, BCST to BRDC, CNSR to CBIT, CNSC to
WWKC, AUTD to DIES, ESCI to ENVS, CSTF to WWKF, GRAF to GFCD, PLGL to PARA, NRSV to VNRS, and Media Production FTVE to
FMED, which ends its 2026-09-03 fan-in with Film (C-ID's code for those courses stays FTVE; his note names it). 2,389
ids: 2,024 kept their number, 360 gap-filled past slots earlier re-mints used, one returned to its own id. P3 by hash:
live `kb_curation` equaled the committed overlay over 1,409 keys. Fold-verify 7 (the by-design residue);
`subject_collision_signal` 113 to 115 (FMED M1166 and M1167, audio courses a curator filed under Media Production whose
file discipline says Film). Two blank-discipline rows (BRDC M1061 *Media Literacy*, GFCD M1051 *Introduction to
Virtual Production*) lost the discipline the old code implied and joined the blanks worklist. After the merge:
`supabase-rekey.yml` with the receipt, the read-back, then `daily-dashboard.yml`. **Watch:** CSIS and ENVS are local
codes `kb/reference/subject_discipline_map.json` maps to Computer Information Systems and Biological Sciences, so any
blank-discipline row minted on them later would be edge-filled wrong; none exists today.

## 2026-11-08 — S611 SkyTadpole: a document with no era stamp is read from its keys

- **The curated anchor (`kb/common_courses.json`) carries no `_rekeyed_through`.** Running the whole alias chain over
  it sent GRAF M10IB, an id the 2026-09-03 Z-band retirement re-used, to CRIM M11SD through the 2026-06-12 fold, which
  had moved an earlier-era GRAF M10IB. Nothing errored.
- **The era is evidence, not a guess.** `kb/_anchor_rekey_dryrun.py` takes each key's producer (the latest map with it
  as an output), the baseline is the latest producer (the 2026-09-04 prefix fold), and the run refuses if any key is an
  input to a map between its own producer and the baseline. Then only the pending maps apply.
- **The recode moved minted identities, not anchor-only ids.** Eighteen anchor keys had no pending map; the recode's
  own rule (keep the number on the new code unless it collides) gives 15 unused ids, and three collide with different
  courses (*Power Systems 1*, *Civil Procedures 1*, *Elder Law*) and need fresh numbers.

## 2026-11-23 — S717 SkyGannet: a code for every MQ discipline, the 20th edition, the MQ view

- **A reference seeded from its consumers cannot see what they never reached.** The CSR was seeded per M-ID
  discipline, so 95 of the handbook's 251 disciplines never had a code, and every model that chose among the CSR's
  codes sent their courses somewhere else, at full confidence: ACCT, ACCTG, ACC and ACTG (1,012
  courses) to BUSI at 1.0, LING (24 colleges) to ANTH, HOSP to CULN, the religion codes to REAL, HUMA or HIST, MCOM to
  JOUR, AERO to AVIA. The distilled form:
  [`methodology-a-reference-seeded-from-its-consumers-cannot-see-what-they-never-reached`](kb-notes/methodology-a-reference-seeded-from-its-consumers-cannot-see-what-they-never-reached.md).
- **Read the edition whole, every list.** The 19th-edition file folded the specific-degree list into the any-degree
  list, so a discipline's MQ type had two values where the regulation has three (CCR 53407(a)(2)-(4)). The 20th
  edition's Disciplines Index omits Counseling: Mental Health, which the master's list prints. Cite a page by its
  printed number: printed page = PDF page - 6.
- **A minted code is read aloud before it is written.** CERT reads as certificate, DSCO as disco, MDIV as Master of
  Divinity, SANT as saint: Ceramic Technology is CRMT, the DSPS counselor DSCS, Marine Diving Technology MDVT,
  Sanitation SANI. Sam turned down FATR (*"flight attendants don't want to be called fatter"*); FLTA was Filipino's,
  so Flight Attendant Training is FLTR. ESTI already prefixes Esthetics M-IDs, so Estimating is ESTG.
- **Settled is a place on the list, and confidence is the guide (Sam, 2026-11-23):** *"we don't need to make it
  'proposed', instead it should have a confidence bar indicating how sure we are of it--no human confirmation needed
  unless confidence is low"*. The 95 went in as `assigned` under `csr-s717@bot`; the CSR tab reads a code as a
  person's pick unless its reviewer ends `@bot`, so the cohort name carries that difference.
- **Codes rarely change; the handbook changes every year.** Sam: *"I don't anticipate that we would change the
  4-character codes year to year...but it could happen so we might need a formerly XXXX and Title"*. `record_former`
  keeps the old code on the entry, so a code read from an older file still resolves.
- **A file that reads the code list goes stale when the list grows.** `statewide_subject_codes.json`,
  `local_subject_recommendations.json`, `mq_view.json` and `csr_proposed_codes.json` each read
  `kb/discipline_canonical_subj4.json`; #3726 rebuilt the first three after the assign.
- **Check the output, then write the message.** Commit `8afaa532` says "LING now calls LING". The statewide model
  votes from where the M-IDs sit, and no M-ID sits under LING, so the call still reads ANTH. A new code moves the calls
  only at the re-mint that re-points its courses.
- **The vocational TOP share checks the MQ type (Sam's ruling).** 26 disciplines disagree with it: Business is on the
  master's list while 98% of its credit M-IDs carry a vocational TOP code; Carpentry is on the experience list at 4%.
  Each names courses to look at; the share never moves a course's discipline.
- **A test that reads a line the page draws only on data fails when the data empties it.** `tests/commons_front.test.js`
  read the held-titles line, which the page leaves out when no title is held; it now reads the line only where it
  draws.

## 2026-11-24 — S718 SkyPetrel: Needs attention by confidence, the code-address read, ESTG

- **A rule change reaches the words as well as the figures.** Once a code was settled by its confidence (Sam,
  2026-11-23), the Subjects view still said a curator or a person settles one. Sam asked for "all the revisions needed
  on the subjects view"; #3732 rewrote the wording, added the Needs attention column after College, and put *Act on
  it* at the top of the course panel. A ruling that changes what a word means sends a session through every place the
  page says the word.
- **Two matchers of one name drift.** The college table matches a college's name ignoring punctuation, so Los Angeles
  Trade-Technical lines up; `levels()` in `commons_subjects.js` still matches exactly, and the card's 83% leaves that
  college out. One normalizer for both is the fix
  ([`methodology-two-expressions-of-one-predicate-will-drift-apart`](kb-notes/methodology-two-expressions-of-one-predicate-will-drift-apart.md)).
- **A procedure that reads only the index never sees what the index omits.** Sam on Cerritos INST: *"Seems we should
  have found this through our procedures...advise."* Cerritos's catalog index lists nothing under I (run
  45269415030), so S698's rule (never read a page at an address made from its code) left INST untitled. The amendment
  reads the code's address once, for a code COCI carries and the index omits, and files a heading only when the page
  names the code in parentheses: Cerritos INST is Interdisciplinary Studies, Long Beach City CART Creative Arts. Of
  22 other tries, 20 answered 404 (all 15 at Southwestern); Cerritos `/pol/` printed POLS and LBCC `/hs/` the site
  menu, and both were recorded as tried, not filed. The parenthesis test is what keeps an address guess from filing
  the wrong heading.
- **A search that found a page has not finished until the page is read.** Eleven filed web searches had a page and no
  title (run 45283003411); none of the eleven pages names its code, so nothing filed. Southwestern's PE/I page reads
  *Exercise Science/Intercollegiate (ES/I)* and PE/D's *Dance (DANC)*: a likely rename that waits for a printed source
  before `kb/reference/subject_code_history/` takes it.
- **Read a minted code against the local codes too.** ESTI was free among the common codes and is the local Esthetics
  code at 4 cosmetology and barbering colleges; Estimating keeps ESTG (#3730).

## 2026-11-24 — S719 SkyShearwater: the web-search pass, the program-label rule, the 20th-edition baseline

Sam, 2026-11-24 ~01:20Z: *"In this session, let's finish the subjects work and apply the design from the subject card to
the other commons cards."* The search pass (#3741) closed handoff 719's first item; the views are in
`docs/commons_lessons.md`, same date.

- **A search summary is not the page.** The helpers filed titles from the search engine's summary of a page, and a
  summary can name a code the page never prints. The rows say so in their notes, and the 69 pages read afterward (run
  45304208269) named none of their codes in parentheses. The renames the summaries suggest (LATTC's IT 077-079 as formerly
  MICROTK; Mt. San Antonio's DSPS as *Access (ACCS)*) wait for the printed line.
- **A program that requires a code's courses is not a label for the code.** Two labels were dropped (Southwest FAM &
  CS, West Los Angeles ALD HTH): each page was a program listing one or two of the code's courses among its own
  requirements. The rule (`d-program-label-lists-the-codes-courses-s719`): a label files only when the program's page
  lists the code's courses as its own.
- **A grouped search does not stand for a row.** One helper ran a search across several codes at once and recorded
  per-row queries that were never run for those codes. A row records only a query run for that code
  (`d-search-row-records-its-own-query-s719`), so a reader can tell a code that was searched from one that was not.
- **The web-search allowance is one budget per turn, shared by every helper.** Four helpers ran 196 searches, and 9
  Los Angeles Trade-Technical rows got none when the allowance ran out; the session ran them in the next turn. A
  fan-out of searches sizes its slices to the turn's allowance, not to the helper count.
- **robots.txt closes a source, and the reader respects it.** Southwestern's 2017-2018 catalog archive prints
  *Formerly PE/...* beside its ES courses and answers `robots_disallow` (run 45304973641); the current catalog prints
  only *Formerly: ES/L ...* on ES/S courses (run 45305645978). COCI's PE/D matches DANC course for course (3 of 3),
  and 19 of PE/A's 22 numbers sit under ES/A. The evidence is strong and still not printed in a page the reader may
  take, so nothing files until Sam's word (a person's word is a source for the code history) or a printed source.
- **A test that pins a committed value breaks on the day the value is correctly updated.**
  `tests/csr_quarterly_probe_test.py` asserted edition 19; the re-baseline on the 20th edition (#3744, dispatch run
  45311236371: COMPARE `same`, 2,983,718 bytes) failed it. The test now checks the baseline against the edition and
  sha256 in `kb/reference/mq_handbook_20th.json`, the file the repo was read from, so a re-baseline that leaves the two
  apart fails and a correct one passes
  ([`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md),
  its fourth instance). `kb/reference/mq_sections.json` still reads the 19th edition, so the probe's
  `committed_edition` reads 19 (`f-mq-sections-still-19th-s719`).

## Moved from the lane (S717)

The lane's definition of complete and its measured state, as they stood before Sam's ruling of 2026-11-23
(`r-csr-codes-settled-on-list-confidence-not-confirmation-sam-2026-11-23`), verbatim:

**The definition of complete (ruled, Sheet 99 card 1, 2026-10-19):** an MQ discipline with courses whose Common
SUBJ is confirmed (by a person, or by the nightly procedure where the code is the authority's own), that follows
the authority rule, and that is in no collision with another MQ discipline. Measured 2026-11-04: **147 of 147**,
every MQ discipline with courses complete (133 confirmed by a person, 14 by the nightly procedure or a session cohort;
no collision). The Commons card's unconfirmed issue leaves its list at zero, by the builder's rule that an empty issue
is not an issue.

**The measured state, 2026-10-19 (the rows the 2026-11-04 scan re-measured say so):**

| what | measure |
|---|---|
| MQ disciplines in the handbook's index | 248 (19th edition, read 2026-05-20, re-validated 2026-07-10); 147 carry courses on the map, 101 carry none |
| picks confirmed | 147 of 147 (2026-11-04): 133 by a person, 14 by the nightly procedure or a session cohort; 0 on the data's modal code unconfirmed |
| on an authority code | 13 CCN, 20 C-ID, 114 minted here, 23 with a chip; 0 missed alignments |
| C-ID and CCN subject codes | 65 C-ID (495 descriptors), 14 CCN (58 courses), both read 2026-05-20; 11 shared; CCN adds ASTR, PSYC, STAT; CCN wins on Psychology (PSYC over PSY) |
| identity codes | 282 codes on 75,581 minted identities: 146 canonical, 26 umbrella, 110 strays on 396 identities (101 of the stray codes sit on identities with no discipline); measured 2026-10-19 after the AGAB re-key |
| collisions | 0 since the AGAB re-key of 2026-10-19 (S427); the AUTB pair was the one: Agricultural Business and Related Services now AGAB, AUTB M1006 re-keyed to AGAB M1006; AUTB M1071 Import Body Customizing returned to Auto Body Technology on Sam's Sheet 101 ruling (22:38Z), so no row sits off its code |
| by design | 4 umbrellas carrying 26 codes beside their own; 3 fan-in alias families (4 alternate names); the FTVE pair; the five agriculture family codes both agriculture umbrellas carry, one of them (AGAB) now also Agricultural Business's own |
| the daily scan | 38 findings (2026-11-04): 19 aligned, 13 weak mnemonics, 3 modal choices without a note, 1 anchor key in the dead format, 2 divergences a note records; none unconfirmed, no collision. The Commons card counts 17 to confirm or note and 93 stray identity codes on 305 identities |
| procedures | 8 written, 6 in force; 2 quarterly routines to build; the cohort confirm on since 2026-10-19 (S427), first run after the merge |

The lane's check of Sam's eight steps (S425), verbatim:

## Sam's eight steps against the record (S425's check, 2026-10-19)

- **CSR before CCR.** Right for the keys: every M-ID is minted under the discipline's Common SUBJ, so a
  settled code first makes every later re-mint cheap. The Program Requirements crosswalk runs through the
  identity layer's memberships (a program's course joins an identity by its COCI control number; the Common
  SUBJ is the identity's label): 67,991 of 84,475 distinct active courses on active programs (80.5%) sit under
  an identity, and 21,761 of the 141,738 COCI courses in the July extract (15.4%) have none, because the
  identities were minted from the 2026-05-22 extract and not re-minted since. The CCR's freshness is the
  larger crosswalk dependency; the CSR's stability is what makes that re-mint safe.
- **One process for every common reference.** Ruled on Open Asks Sheet 95 card 1 (2026-10-18): the shared
  module and the run logs landed; the per-reference Progress views are the open step, in the order Exhibit,
  Course, CR, Subjects. Sam's ask today moved Subjects first; his call, recorded.
- **Steps 1 and 2, the quarterly routines.** The three sources were last read in May (the handbook re-validated
  in July). A check that diffs and opens a card is the right routine; an automatic rewrite would rename
  disciplines that carry picks. The scope note's handbook link answered 404 and is replaced by the Chancellor's Office's live
  Minimum Qualifications page, which lists the 19th edition (S431); the C-ID site moved from c-id.net to
  c-idsystem.org, its data on data-c-idsystem.org (S437), which a runner reads and the sandbox proxy refuses. Eight MQ names carry a Title 5 section number from the PDF read and one is cut short
  (*Disabled Student Programs and*); Sam's rename ruling of 2026-09-08 has not been applied.
- **Step 3, the AG example.** The authority recode of 2026-09-03 already adopted every four-letter CCN and C-ID
  code (0 missed alignments); the five hyphenated agriculture codes became the umbrella codes AGAB, AGAS, AGEH,
  AGMA, AGPS, and Sam ruled AGRI and AGPR the residuals (cards 4 to 6). The chips on the Agriculture row say the
  authority splits the discipline finer than the MQ list does; they are sub-subjects, not a competing code. What
  step 3 can still do is empty the residual: 404 identities sit under AGRI (measured 2026-10-19 by key prefix in
  `kb/coci_minted_courses.json` and `kb/coci_minted_singletons.json`: 86 clustered, 318 stand-alone; 403 under
  Agriculture), and a Jev sitting can propose a family for each from the descriptors, Sam confirming, the rest
  staying residual (a card). The
  strays are the unnecessary codes: 110 on 396 identities, most on identities with no discipline yet.
- **Steps 4 and 5.** Every MQ discipline with courses carries a code; the 101 without courses take one when
  their first course appears. One code sits on two MQ disciplines (AUTB); the identity layer's disagreements
  (a few rows under a code naming a second discipline; 96 identities with no discipline) are the cross-list
  and discipline-blank lanes' work. The tab's own check had listed six ruled sharings as collisions.
- **Step 6, cross-listed.** Three senses, and the procedure names all three: a code on two disciplines (a
  collision, forbidden except a ruled fan-in), a discipline with several codes (an umbrella, allowed), and a
  course with two homes (`xdisc`, 9 rows today; 535 candidates wait on the cross-list sheet).
- **Steps 7 and 8.** Both exist as rulings (2026-09-03, items 1 to 3 and 15) and run at every mint and re-seed;
  the one live difference is Psychology (PSYC over PSY). What was missing was the measure on a dash.
- **Forgotten along the way.** The validate stage has never been used (0 of 147 in five months); the scan was
  never scheduled and asked two settled questions at every run; the tab's C-ID index skipped 17 of the 65
  subjects; the Jev next step for the CSR (fix AUTB, the 2026-09-29 sheet's card 11) is still open.

## S730 (SkyDunlin, 2026-11-25): the stray codes and the title hunt

**Ruled:** `r-no-mid-on-a-stray-code-sam-2026-11-25`: no M-ID on a local code; the 88 stray codes' 247 courses go back
to Needs an M-ID once their local subjects carry a common subject. **Procedure:**
`p-subject-title-carries-its-source-sam-2026-11-25`. **Worklist:** `kb/subject_title_hunt/` for COBIx.

**Lessons:**
- A stray code is a blank discipline that the mint filled with the college's own letters. The fix comes before the
  mint, never after it.
- A statewide filing keyed on letters breaks where two colleges use one code for two subjects (AT, ATC, HOSM, DESN
  among the strays). The local subject title tells them apart; the code cannot.
- 1,496 of 10,282 college and code pairs carry a title, all at 19 colleges. The recommender's measured sources run
  for every college once the unread colleges' courses are added to its course joins; course joins are its weakest
  source (Diablo Valley's FTVE read Law).
- Count Needs an M-ID through the List's own sources (`unified_courses_members.js`, `kb/coci_not_applicable.json`);
  the state list's July M-ID column gives 19,267, and leaving out the kept courses gives 8,101 against the List's 1,819.

**The runners' title hunt (S730, #3832):** nine workers read 99 colleges' catalog subject indexes in about 75 minutes
(eLumen and CurriQunet through their navigation JSON, CourseLeaf and Acalog indexes, PDF legends and headings). Lessons:
the machine filled 6,492 titles that a hand search would have taken days to find; a department label is not a subject
heading and stays a hint; a worker that joins wrapped headings or infers a code's title must mark it, and the filer
leaves an inferred title out; read plans go in their own commit before the data, since a push re-reads the plans its
last commit changes; and a list keyed on college names needs a folded name (Trade Technical against Trade-Technical,
the Credit siblings).

**The stray-code rescore (S730):** with titles at 92 of the 116 stray local subjects, the title named a discipline for
24 and agreed with no filing in 2 cases where a filing existed (FJMP, CSC): a statewide filing keyed on letters still
needs the title's check. 56 have neither a title that names a discipline nor a filing, which is the list for Sam.

## S733 (SkyGodwit, 2026-11-25): COBIx's titles filed, the rescore scored 0 to 100, the dry run

**Ruled:** `r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25` (*"i want to use confidence bars 0-100 rather
than low, med, high throughout all commons procedures"*): worklists, rescores and dry-run scopes carry a 0-100 score
and a threshold. **Shipped:** #3841 (`--csv` import, 911 titles, rescore rerun), #3843 (dry run), #3846 (0-100 score,
scope at 90). **Decided:** `d-stray-remint-retire-not-rekey-s733`.

**Lessons:**
- A CSV-filed find has no workflow run, and the subject headings record's own check requires one: name the filled file
  as its run (`subject_headings_filer_test.py` caught it in CI, not locally; run it before a push that files titles).
- A confidence score is assembled from measured rates, each named in the scorer's docstring: the statewide model's
  calibrated probability, a floor where the college's own heading names the discipline (9 of 9 on Sam's 30), a cap
  where no title of the college's own checks a letters-only call. The threshold comes from the model's self-recall
  (97% at 0.9 or more), never from a picked number.
- Moving from levels to a threshold moved six rows across the line (five continuing-education codes whose noncredit
  categories all read Older Adults came in; Contra Costa's Library Studies went out), so a dry run's pins must be
  refrozen whenever its scope rule changes.
- Retire, not re-key: the List already counts a course with no M-ID as Needs an M-ID, and a retired id reads dead in
  the alias chain, which is true; a merged shell is the exception and takes an alias to its target.

**S733, second half (apply, sidebar, 0-100):** #3851 (Local subjects sidebar: list a code's courses and move one or
several, `course_subject_decision`), #3853 (the apply), #3857 (seeder keeps assigned codes), #3858 (honors test case 5
tolerates a moved payload), #3859 (recommender 0-100, panel bars). Lessons: a post-apply chain can regenerate a seed
from what has rows and silently drop what has none (99 assigned codes): diff every regenerated reference file against
main before merging an apply. An apply's audit step can write a file over the 5 MB size limit; leave the cron's files
to the cron. A new alias map changes the honors payload, so a test pinned to "rows unchanged" must tolerate a moved
payload. The repo's Supabase guard refuses `DO` blocks: write a guarded delete as a CTE that deletes only when the
match count is exact.
