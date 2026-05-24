---
title: Exhibit Canonicalization — Decisions & Lessons (credential-identity layer)
date: 2026-05-24
session: 6 (Bruh Hex)
status: ACTIVE — Phase 4/5/6 of the vision doc not yet shipped; PR-A (audit) landing this session
tags: [exhibit-canonicalization, credential-identity, audit, kb, eacr]
artifacts:
  - kb/unified_titles.json
  - kb/credentials.json
  - kb/_audit_exhibits.py
  - kb/classify_exhibits.py
  - kb/_flag_hinky_exhibits.py
  - kb/_curation_credentials_01.py
  - .claude/skills/exhibit-canonicalization/SKILL.md
  - docs/exhibit_unification_vision.md
  - kb/exhibit_audit/{latest.json, <date>.md}
related:
  - CLAUDE.md §9 (EACR Exhibit Identity — current state, future direction)
  - kb/README.md (KB schemas + identifier precedence)
  - docs/subj4_canonicalization_remint_lessons.md (the course-identity sibling layer)
  - docs/unified_courses_audit_lessons.md (the kb/_row_audit.py pattern this auditor mirrors)
prs: [TBD — PR-A in flight, PR-B queued, PR-C deferred]
---

# Exhibit Canonicalization — Credential-Identity Layer

This is the lessons doc for the **credential-identity** workstream — the
synthetic layer above MAP's freehand exhibit titles that collapses title
drift into unified credential names. Sister workstream:
[`docs/subj4_canonicalization_remint_lessons.md`](subj4_canonicalization_remint_lessons.md)
covers the **course-identity** layer (M-IDs, C-IDs, CCN-IDs); this one
covers credentials (Industry Cert / AP / POST / IBEW apprenticeship /
JST / Cx generic buckets / …).

Design doc (the why): [`docs/exhibit_unification_vision.md`](exhibit_unification_vision.md).
Operational rules: [`.claude/skills/exhibit-canonicalization/SKILL.md`](../.claude/skills/exhibit-canonicalization/SKILL.md).

## What this is

Each raw MAP exhibit title (`View_ArticulatedMAPExhibits_APIDataset`) gets
classified into three synthetic fields with per-field confidence:

| Field | Storage | Curated key |
|---|---|---|
| `unified_title` | `kb/unified_titles.json` | `raw_title` |
| `issuing_agency` + `training_agency` | `kb/credentials.json` | `unified_title` → list of issuer records |

The classifier is `kb/classify_exhibits.py` (Phase 3 batch) — sends each
distinct raw title to Claude with the skill's decision rules as the system
prompt, caches the result, never re-classifies a row whose `reviewed_at`
is set. Quality flagger `kb/_flag_hinky_exhibits.py` adds
`quality_flag: "suspect_course_as_exhibit"` to the ~200 Modesto-JC-pattern
data-entry artifacts where colleges typed "Industry Certification" for
something that's actually a course with no associated credential.

## 2026-05-24 baseline audit (the work shipped this checkpoint)

`kb/_audit_exhibits.py` — re-runnable read-only auditor, modeled on
`kb/_row_audit.py`. Walks the credential layer, surfaces what's stale,
low-confidence, or suspect. Outputs to `kb/exhibit_audit/{latest.json,
<date>.md, <date>.full.json}` (the full breakdown is gitignored, same
pattern as row_audit).

**Headline numbers (2026-05-24):**

| Metric | Value |
|---|---|
| Raw titles classified | 3,217 |
| Distinct unified titles | 1,969 (61.2% compression) |
| Singleton unified titles (1 raw → 1 unified) | 1,575 (low compression value) |
| Credential records | 1,991 across 126 distinct issuers |
| Titles `reviewed_at` set | **0** ⚠ |
| Credentials `reviewed_at` set | 16 |
| Unclassified raw titles in current MAP | **194** (re-classification backlog) |
| Stale KB entries (no longer in MAP) | 155 |
| `suspect_course_as_exhibit` flags | 200 |
| `agency_name_collision_signal` (canonicalization opportunity) | 211 |

**Title confidence distribution:**

| band | count | % |
|---|---:|---:|
| 0.95–1.00 | 836 | 26.0% |
| 0.80–0.94 | 1246 | 38.7% |
| 0.60–0.79 | 882 | 27.4% (review queue) |
| 0.40–0.59 | 220 | 6.8% (high-priority triage) |
| <0.40 | 33 | 1.0% (lowest — usually course-code-as-title artifacts) |

**Active audit rules:**

- `low_confidence_title` / `very_low_confidence_title` — confidence_title
  in the 0.60–0.79 / 0.40–0.59 bands respectively.
- `low_confidence_issuer` / `very_low_confidence_issuer` — same for
  `confidence_issuer`.
- `low_confidence_trainer` / `very_low_confidence_trainer` — same for
  `confidence_trainer` (fired only when `training_agency` is non-null).
- `agency_name_collision_signal` — issuer-name pairs where one's token set
  is a proper subset/superset of another. Often catches the same agency
  under two spellings (e.g. `Google` vs `Google LLC`) AND genuinely
  different orgs with overlapping name patterns (e.g. American Council on
  **Exercise** (ACE) vs American Council on **Education** (ACE) —
  different orgs, same abbreviation; surfacing both is desired so a
  curator can verify before any consolidation).
- `suspect_course_as_exhibit` — pass-through from `_flag_hinky_exhibits.py`.
- `blank_unified_title` — sanity-check; should always be 0.
- `unclassified_in_map` — raw title exists in current MAP but not in KB.
- `stale_kb_entry` — KB entry no longer in current MAP data (low priority).

A `null_issuer_with_high_confidence` rule was scoped and then **dropped**
because it fired on 626 records — 99% of which are legitimate
local-college Cx / portfolio buckets where null issuer is semantically
correct, not a data quirk. The classifier confidently marks them null;
that's by design. Lesson: audit rules need to be calibrated against the
actual data shape, not the abstract idea of "what could go wrong" — a
600+ noise-tag count drowns the actionable signals.

## Current state — what's done, what's not

| Vision-doc phase | Status |
|---|---|
| 1. Skill + prompt | DONE (2026-05-18) |
| 2. KB seed (50 hand-curated) | DONE (2026-05-19) |
| 3. Full first-pass classification (3,217 titles) | DONE (2026-05-20) |
| **3.1 Audit baseline** | **DONE (2026-05-24, this checkpoint — PR-A)** |
| 4. Pipeline integration — EACR groups by unified title | **NOT DONE** (architecturally significant; deferred — see roadmap below) |
| 5. UI — curator-facing surface (Credential Reference tab) | **NOT DONE** (PR-B, queued for this session) |
| 6. Quality loop — review workflow / periodic re-classification | **PARTIAL** — the classifier supports `--reclassify` and never overwrites `reviewed_at` rows; no UI yet for marking rows reviewed |

**Pipeline coupling today.** `excel_to_dashboard.py` does NOT read
`unified_titles.json` directly when building the EACR table — that table
still groups by `(raw title, CPL Type, Collaborative Type)` per
`_build_statewide_adoption()` (~line 3944). The unified-title field is
consumed indirectly via `kb/coci_articulations.json` (Phase 3 of the
course-identity workstream inlines the unified_title there), which feeds
the "Articulations by Unified Course" CPL Analytics card. So we get the
benefit of unified-title grouping in *one* card today, but the headline
EACR cards still suffer from title drift.

**Daily-cron coupling: none.** `kb/unified_titles.json` and
`kb/credentials.json` are committed static artifacts. The classifier is
not on the daily schedule; new raw titles flowing in from MAP land in the
audit's `unclassified_in_map` queue until the classifier is run.

## Strategic roadmap (Session 6 → next)

| Phase | What | When |
|---|---|---|
| **PR-A** | Audit baseline + this lessons doc + .gitignore + classifier re-run on the 194 unclassified-in-MAP titles | **In flight (this checkpoint)** |
| **PR-B** | **Credential Reference tab** (working title) — top-level dashboard tab modeled on the CSC tab. Read-only MVP first: list every unified_title with raw-variant count, issuer, confidence band, quality_flag, "also entered as…" disclosure. Filters: confidence band, issuer, flagged-only, blank-only. Allowed-reviewers auth + synthesized `kb_curation` namespace (`_UNIFIED_TITLE::<raw_title>` / `_CREDENTIAL::<unified_title>::<issuing_agency>`) so no new Supabase tables are needed. Two-stage curation workflow (initiated → validated) added if the MVP lands clean. | Queued — Session 6 |
| **PR-C — DEFERRED** | **EACR Phase 4 re-pivot** — change `_build_statewide_adoption()` grouping key from raw title to unified title (and probably to `(unified_title, issuing_agency, …)` per vision doc §6.1). **Architecturally significant** (changes headline EACR adoption numbers; 3,274 cards → ~2,000 est.). Treated like the course-identity "Approach B" (CLAUDE.md §9) — scope before any build. Probably its own session. | Deferred |
| Phase 6 | Quality loop — make classifier runs cron-scheduled OR add a "reclassify-on-demand" button to the curator tab (reviewer-gated). Add `validated_at` two-stage curation per the CSC tab pattern. | Parked |

## Patterns to reuse from sibling workstreams

The credential layer arrives at this milestone roughly where the
course-identity layer was pre Session 5 — data laid down, no curator
surface, pipeline only partially consuming. Patterns that worked there:

1. **Curator tab UX shell.** `canonical_subj4.js` + the new `cs-*` CSS
   namespace + the toolbar/body separation (toolbar built once, body
   re-renders) gives a clean template. The Credential Reference tab
   should reuse the same pattern — filter dropdown, native-datalist
   typeahead, sortable columns, Variants modal.
2. **Synthesized key namespaces in `kb_curation`** (no DDL needed). The
   CSC tab uses `_CANON_SUBJ4::<discipline>`; mirror it with
   `_UNIFIED_TITLE::<raw_title>` for unified-title overrides and
   `_CREDENTIAL::<unified_title>::<issuing_agency>` for issuer/trainer
   edits. Both go into the existing `kb_curation` Supabase table.
3. **Two-stage curation (initiated → validated).** Same column shape as
   the CSC tab (`reviewed_at` / `reviewed_by` for stage 1,
   `validated_at` / `validated_by` for stage 2, both gated on the
   allowed-reviewers list). Now that the CSC tab's UI label is
   **"Initiated"** (not "Reviewed") — PR #112, this checkpoint — the
   Credential Reference tab should ship with the same vocabulary from
   day one.
4. **`⚙` provenance badges + `⚠ N` audit chips.** CCR rows carry both;
   Credential Reference rows should too — `⚠ N` showing the audit tag
   count, `⚙` showing the confidence-band signal.
5. **Pending-sync indicator.** The CCR tab's "⟳ N edits awaiting daily
   sync" indicator (diffed against `committed_curation`) is a curator
   trust pattern. Apply it here once the curator-write path exists.

## Risk hot-spots when picking up

- **PR-C (EACR re-pivot) changes adoption numbers.** Treat like Approach
  B in CLAUDE.md §9. Scope-first session before any build.
- **`kb/coci_articulations.json` already inlines `unified_title`.** Any
  unified-title rename (e.g. consolidating "EMT Certification" variants)
  ripples there. If we ever do a credential-layer re-mint, the same
  re-mint playbook (`docs/coursecontrolnumber_remint.md`) discipline
  applies: dry-run first, alias map committed, fresh-read at write-time,
  atomic land within one cron window.
- **Modesto JC `suspect_course_as_exhibit` (200 rows)** needs college
  outreach to resolve, not data work. Surface them in the curator tab so
  a reviewer can mark "yes this is a course, not a credential" and the
  EACR can downstream-filter or visually flag those cards.
- **194 unclassified-in-MAP titles** — re-running the classifier requires
  an `ANTHROPIC_API_KEY`. Estimated ~$1–3 with cache (system prompt
  cached after first chunk). Either set the env var in the Claude Code
  on the web env-vars panel and re-run via web session, or run
  `python3 kb/classify_exhibits.py` locally.

## Next concrete step

Land PR-A (this checkpoint), then start PR-B — the **Credential
Reference** tab, read-only MVP first. The auditor surfaces the queue;
the tab gives a curator a place to work it.

---

## 2026-05-24 (later, Bruh Hex) — PR-B shipped: Credential Reference tab

The curator surface for the credential-identity layer landed
(`credential_reference.js`, ~750 lines). Modeled tightly on
`canonical_subj4.js` — same Supabase auth pattern, same synthesized-key
namespace pattern, same toolbar/body separation. New URL hash
`#credential-reference`.

**What shipped:**

- New top-level tab "Credential Reference" between "Common Subject Code"
  and "Pipeline" in the nav. CSS scoped to `#tab-credential-reference`
  with a `cr-*` class prefix (parallel to CSC's `cs-*`).
- Row grain: one per `unified_title` (1,969 rows). Shows the AI-classified
  identity + raw-variant count + primary issuer + modal title confidence
  + issuer confidence + audit-tag chip + quality_flag + curator-reviewed
  state.
- Click a row to expand → raw_title list (with per-variant confidence +
  classification notes), credential record(s) (issuer + trainer with
  confidences), audit-rule rollup.
- Filters: confidence band (5 options), issuing-agency typeahead via
  `<datalist>` over 126 issuers (with a `(none)` option for the 1,111
  null-issuer local exhibits), audit-tag triage dropdown (auto-populated
  from `state.audit._rules_active` if the audit overlay loaded, else
  scans the data), quality-flag-only checkbox, free-text search across
  unified_title / raw_title / issuer.
- Curation action: **Mark initiated** — auth-gated button per row,
  writes to Supabase `kb_curation` with `course_id` =
  `_CREDENTIAL_REVIEW::<unified_title>`, field = `reviewed_marker`,
  value = `1`. The row's `reviewed_at` + `reviewer_email` carry the
  audit trail. Tab shows the live overlay state with a green "✓ user · date"
  stamp.
- Sortable columns: unified_title, raw_count, primary_issuer,
  conf_modal, conf_issuer, audit_tag_total, flag_label, reviewed state.
- Audit-tag chips color-graded by underlying confidence band
  (warn/mix/muted) — visual mirror of the CSC tab's hinky chips.

**Decisions made during the build:**

- **Runtime fetch, not generated payload.** Fetches `kb/unified_titles.json`
  (1.4 MB), `kb/credentials.json` (817 KB), and `kb/exhibit_audit/latest.json`
  (1.2 MB) on tab init. Heavy but acceptable for MVP — matches the CSC tab's
  fetch pattern. If perf bites, generate a baked-down `credential_reference_data.js`
  via `excel_to_dashboard.py`.
- **No JSON sync script.** MVP edits live in Supabase + the live overlay
  only; `kb/_apply_credential_review.py` is deferred. Means the audit's
  "0 titles reviewed" count never updates from Supabase until that script
  ships — auditor will eventually get a `--include-supabase-overlay` flag
  or a sync script will materialize curator edits into `unified_titles.json` /
  `credentials.json`. Either is a follow-up PR; not blocking.
- **Curation key namespace.** Used `_CREDENTIAL_REVIEW::<unified_title>` +
  field `reviewed_marker`. The existing `_apply_curation.py` whitelist
  (discipline / merge_into / unified_title / description) ignores this
  namespace, so no risk of cross-contamination with the course-identity
  layer's curation. Mirrors the CSC tab's `_CANON_SUBJ4::` pattern.
- **"Mark initiated" semantics.** The button records curator
  acknowledgment without changing the underlying classification. Full
  override curation (edit unified_title / issuer / trainer / flag toggle)
  is PR-B2 follow-up — keeps MVP scope tight.

**Surface area inspection:**

- `credential_reference.js` 753 lines, ~29 KB
- `CPL_Dashboard.html` + `index.html` gain ~100 lines each (tab nav button,
  pane chrome, CSS block, intro copy, script tag). Mirrored via `cp`
  per Rule 4.
- No daily-cron yaml changes. No `excel_to_dashboard.py` changes.

**Open thread:** the EACR table is still the credential layer's primary
end consumer (PR-C re-pivot, deferred). The Credential Reference tab
shipped today curates the dataset upstream of that re-pivot; once PR-C
lands, every "Mark initiated" sign-off on the credential layer raises
quality of an EACR card downstream. PR-D (EACR-card stale/dup flag —
NEW, scoped this session: tiny in-place button on existing EACR cards,
no new tab, no CR overrides per user preference) is the next concrete
step.

## Next concrete step (2026-05-24, post PR-B)

Start **PR-D** — the EACR-card stale/dup flag. User-scoped to the
narrowest possible action set: a single button on each existing EACR
card that writes a stale/dup flag to Supabase. No credit-rec overrides,
no approval status, no notes. Lives ON the EACR cards (no new tab).
Auth piggybacks on the unified_courses session.

---

## 2026-05-24 (later, Bruh Hex) — PR-D shipped: EACR-card stale/dup flag

Small in-place addition to the existing EACR table
(`statewide_interactive.js`, now 663 lines, +132). Per-row `<select>`
with three options: — (no flag) / 🚩 stale / 🚩 dup. Anonymous viewers
see flagged rows with a read-only 🚩 badge so the curator's annotation
is publicly visible; the select itself only appears for signed-in
reviewers.

**Curation key namespace:** `_EACR_FLAG::<exhibit_card_key>` where the
card key is `e.exhibit_id || e.title` (the same key the existing row
selection / pagination state uses). Field = `flag`, value = `"stale" |
"duplicate" | ""`. Standard kb_curation upsert via
`Prefer: resolution=merge-duplicates`.

**Auth:** piggybacks on the unified_courses.js session
(sessionStorage `cpl_sb`). No new sign-in UI on the EACR table — by
design, since the same allowed-reviewers list gates Common Course
Reference + Credential Reference; once the curator is signed in there,
the flag column lights up automatically.

**UX details preserved from the user's narrow-scope direction:**

- Stale/dup ONLY. No credit-rec overrides, no approval status enum, no
  notes. (User explicitly said: "I don't want to override CRs; do want
  to flag stale or dup cards.")
- New column added as the 10th column at the table's right edge
  (width: 78px) so it doesn't disturb the existing layout.
- Tooltip on each select carries the audit trail ("Flagged stale by
  user · on YYYY-MM-DD").
- On change, the cell is disabled while the Supabase POST is in flight
  + the value reverts on failure. No full re-render — just the title
  attribute updates in place.

**Init flow:** the table builds + first-renders synchronously without
waiting for Supabase, so anonymous viewers see results immediately. The
flag overlay loads asynchronously and triggers a re-render when it
lands. This keeps perceived load time identical to before.

**Open thread (parked):** an `_apply_eacr_flag.py` sync script that bakes
the kb_curation flags into a generated artifact (analog of
`_apply_canonical_subj4.py`) — so curator flags can drive downstream
filtering / hiding in the dashboard's exhibit-analysis cards. Deferred
because the MVP shows the badge inline on the EACR table and that's the
80% case. Build it when flag-driven downstream behaviour is needed.

## Next concrete step (2026-05-24, post PR-D)

Open threads in priority order:

1. **PR-C (EACR Phase 4 re-pivot)** — still architecturally significant;
   scope-first session before any build. Affects headline EACR adoption
   numbers.
2. **Re-classify the 194 unclassified-in-MAP titles** — requires
   `ANTHROPIC_API_KEY` in the session env or local run of
   `kb/classify_exhibits.py`.
3. **PR-B2 — edit-override curation** on the Credential Reference tab
   (unified_title rename, issuing_agency / training_agency override,
   quality_flag toggle). Currently the tab is initiated-only; full
   override is the natural follow-up.
4. **`kb/_apply_credential_review.py`** — sync script for credential-
   layer curation (bakes Supabase reviews into `unified_titles.json` /
   `credentials.json`). Pairs with PR-B2.
5. **`kb/_apply_eacr_flag.py`** — same shape, for the EACR-card flag
   namespace. Pair with downstream consumption.
