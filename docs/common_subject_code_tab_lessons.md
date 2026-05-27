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
