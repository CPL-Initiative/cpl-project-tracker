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

---

## 2026-05-25 (Bruh Hept) — PR-B follow-up hotfixes: tab couplings

Two hidden coupling points in PR-B (#114) surfaced on the deployed
dashboard the day after merge. Both fall under the same theme: **adding
a new top-level tab actually requires touching FOUR places, not three**.
The "three places" mental model (nav button, pane element, script tag)
misses two more.

### Coupling 1 — `VALID_TABS` whitelist (PR #117)

`CPL_Dashboard.html` line 13013 carries an inline tab-router whitelist:

    var VALID_TABS = ['dashboard', 'workplan-goals', 'budget',
                      'vision-2030', 'unified-courses',
                      'canonical-subj4', 'pipeline'];

PR-B added the **Credential Reference** nav button + pane + script, but
missed the whitelist. Clicking the tab button ran
`activate('credential-reference')`, which checked
`VALID_TABS.indexOf(...) === -1`, fell back to `'dashboard'`, and
activated the Dashboard pane. From the curator's view, "the new
Credential Reference seems to be a copy of the dashboard main."

**Fix (PR #117):** append `'credential-reference'` to the array.
One-line change, static template (not regenerated by
`excel_to_dashboard.py`), mirrored to `index.html` per Rule 4.

### Coupling 2 — magic-link redirect tab (this PR)

`unified_courses.js` is the master auth-fragment handler — it parses
`#access_token=…` after a magic-link round-trip, persists the session
to `sessionStorage.cpl_sb`, and then sets the URL hash to bring the
user back to a tab. The bring-them-back line was hardcoded:

    location.hash = "unified-courses";

So a curator who clicked "sign in to edit" from **Credential
Reference** got the magic link, clicked it, landed back on the dashboard
URL, and was bounced to the Common Course Reference tab. The sign-in
**did** complete (the session is in sessionStorage and the
Credential Reference tab is ready to write), but from their view "the
login doesn't complete the process" — they're on a different tab and
the sign-in widget on the original tab still says "sign in to edit."

**Fix (this PR):** each tab's `signIn()` stashes its identifier in
`sessionStorage.cpl_sb_return_tab` before sending the OTP request;
`consumeAuthHash()` in `unified_courses.js` reads that key and uses
it for the redirect hash, falling back to `"unified-courses"` if no
key was stashed.

### Updated mental model for "adding a new top-level tab"

For Bruh Hept and beyond, a new curator tab needs FIVE touch points:

  1. **Nav button** — `<button class="cpl-tab" data-tab="…">` in the
     `<nav class="cpl-tabs">` block of `CPL_Dashboard.html`.
  2. **Pane element** — `<div class="cpl-tab-pane" id="tab-…">` in
     CPL_Dashboard.html.
  3. **Script tag** — `<script src="…js"></script>` near the bottom
     of CPL_Dashboard.html (and mirror to `index.html` per Rule 4).
  4. **`VALID_TABS` whitelist** — line 13013 of CPL_Dashboard.html.
  5. **Magic-link return tab** — the tab's `signIn()` writes
     `sessionStorage.cpl_sb_return_tab = "<tab-name>"` so the master
     auth handler in `unified_courses.js` can bring the curator back.

Items 4 and 5 are easy to miss because nothing on the page surface
points at them. The CSS pane-display rule (`.cpl-tab-pane.active`)
silently hides any pane that the activate() function fails to mark.
The auth redirect quietly happens regardless of where the curator
started. Both fail loudly only when a curator actually exercises the
flow on the deployed site — there's no PR-time test that catches
either.

A defensible follow-up (Bruh Hept or later) would refactor the
inline tab JS into a `tabs.js` module that derives `VALID_TABS` from
the `data-tab` attributes on the rendered nav buttons (single source
of truth — no whitelist to maintain). Same shape for `consumeAuthHash`
to use the same derived list. Out of scope for these hotfixes.

---

## 2026-05-25 (Bruh Hept, late session) — Cred-Ref PR-1/2/3 + sign-in UX overhaul

Bruh Hept's run on the Credential Reference workstream. Started with two
deployed-site bugs the curator reported the morning of 2026-05-25, then
shipped three substantive PRs against the four-PR plan handed forward
from Bruh Hex.

### Hotfixes shipped (4 PRs)

**PR #117 — `VALID_TABS` whitelist coupling.** The curator reported "the
new Credential Reference seems to be a copy of the dashboard main."
Root cause: PR-B added the tab nav button + pane + script tag, but the
inline tab-router whitelist (`CPL_Dashboard.html` line 13013, `var
VALID_TABS = [...]`) wasn't updated. Clicking the tab ran
`activate('credential-reference')` → `indexOf === -1` → `tabName =
'dashboard'` (fallback) → dashboard pane activated. From the curator's
view, the tab "didn't work" — it WAS the dashboard. One-line fix.

**PR #118 — Magic-link return-tab restore.** Sign-in flow completed
successfully in Supabase but the curator saw "doesn't complete the
process" — they signed in from Credential Reference, clicked the magic
link in their email, and landed on the Common Course Reference tab
instead. Root cause: `unified_courses.js`'s `consumeAuthHash()` (the
master magic-link callback handler) hardcoded `location.hash =
"unified-courses"` after persisting the session. Fix: each tab's
`signIn()` stashes its identifier in `sessionStorage.cpl_sb_return_tab`
before the OTP request; `consumeAuthHash()` reads it back and uses it
for the redirect hash, defaulting to `"unified-courses"` when absent.
Same fix applied to canonical_subj4.js (CSC tab had the same bug
unreported).

**PR #119 — Inline sign-in feedback panel.** Curator reported "magic
link arrives but I don't see a splash that the email was sent."
Root cause: the corner-toast feedback was easy to miss right after the
prompt() dialog closed (3-second auto-fade, bottom-right). Replaced
across all three curator tabs (credential_reference, canonical_subj4,
unified_courses — the last had been using JS `alert()`, loud but
clunky). New shape: prominent green inline panel **right where the
"sign in to edit" link used to be**, with "✉ Magic link sent to
{email}" + a "use a different email" link. Red error variant for
failures with a "try again" link. Per-tab `pendingSignInEmail` /
`pendingSignInError` state.

**PR #120 — 429-aware error mapping.** Curator hit a Supabase rate
limit during testing iterations and got the misleading message "Server
returned 429. Confirm the email is in the allowed-reviewers list" —
the email IS in the list; 429 means rate-limited, period. Added
explicit 429 + 400/422 branches in credential_reference.js and
canonical_subj4.js (`unified_courses.js` already had the 429 branch
from an earlier session — Bruh Quad? — and it had never been mirrored).
Now message-maps to the actual fault.

### The 5-touch-points lesson

These four hotfixes share a theme: **adding a new top-level tab requires
touching FIVE places, not the three that look obvious.** The doc now
captures the full list:

  1. Nav button (`<button class="cpl-tab" data-tab="…">`)
  2. Pane element (`<div class="cpl-tab-pane" id="tab-…">`)
  3. Script tag (`<script src="…js">`)
  4. **`VALID_TABS` whitelist** (line 13013 of `CPL_Dashboard.html`) ← easy miss
  5. **Magic-link return-tab stash** in the tab's `signIn()` ← easy miss

Items 4 and 5 fail loudly only when a curator exercises the deployed
flow. There's no PR-time test that catches either. A `tabs.js` module
that derives `VALID_TABS` from rendered nav buttons + exposes a helper
for sign-in's return-tab registration would close this trap; out of
scope here, queued for whichever session takes on the sidebar refactor.

### The bigger refactor question

Hept also debugged a curator email typo (`map@rccd.edu` → `mar@rccd.edu`)
that created a phantom Supabase user account; Microsoft Outlook ATP /
Safe Links pre-fetching the magic link before the curator could click
it was a secondary issue flagged for future attention (workarounds:
6-digit OTP code mode, or RCCD IT whitelist on `mail.app.supabase.io`).

### Credential Reference PRs (3 of 4 shipped)

**PR #121 — Cred-Ref PR-1: common-course join + Scope badge + Discipline
column.** The big one. New `export_credential_reference()` in
`excel_to_dashboard.py` joins `kb/unified_titles.json` + `credentials.json`
with `kb/coci_articulations.json` + the minted/unified/singleton
catalogs. Emits `credential_reference_data.js` (~1.5 MB lean, pre-joined +
audit-tag rollup + `top_categories` map). Tab loads the baked global
synchronously; runtime fetch of `kb/*.json` kept as fallback for local
dev. Adds per-row Scope badge (🏛 Statewide if any articulation is CCC /
CCC Collaborative; 🏠 Local otherwise; — if no articulations resolved)
and Discipline column (modal MQ discipline across articulations).
Expanded body leads with a per-identity table — color-coded by
id_system (green CCN-ID / blue C-ID / yellow M-ID / purple Cluster),
identity cell rowspan'd when one identity has multiple local-course
rows. Stats: **1,969 unified titles · 1,726 articulated · 4,324 local-
course lines · 90 statewide · 1,106 audit-flagged**.

**PR #122 — Cred-Ref PR-2: select-all + bulk Mark initiated.** New
first-column per-row checkbox (disabled when already initiated or
during a save); header "select all visible eligible" (filtered-view-
scoped, never the full 1,969); indeterminate state on partial
selection. Toolbar widget shows green "✓ Mark N initiated" button +
clear link when N > 0; swaps to yellow "Saving X of N…" during the
sequential Supabase save. Per-row UI flips ✓ as each save completes
(not at end). Confirm dialog before kickoff; final toast reports
ok/failed counts.

**PR #123 — Cred-Ref PR-3: TOP / Discipline grouping.** Toolbar "Group
by:" dropdown (none / TOP category / Discipline). TOP mode buckets by
2-digit TOP code with `TOP 12 — Health` headers (using the 22-entry
`top_categories` map sourced from `kb/discipline_canonical_subj4.json`,
the same source the CSC tab uses). Discipline mode buckets by MQ
discipline. Group headers are colspan'd table rows with ▶/▼ twisty;
click to toggle. Empty buckets ("(No TOP category)" / "(No discipline)")
sink to the bottom. `state.collapsedGroups` keyed by `mode:key` to
avoid clashes across mode switches; resets on mode change for
predictability.

### Architectural decisions taken this session (still queued)

- **Excel → Supabase migration** (CLAUDE.md §11 new rows): finishing PR-4
  first, then Phase 1 starts in a separate session with **Workplan Goals
  tab as the proof-of-concept end-to-end** (Excel file's smallest tab; the
  `workplan_goals` table already exists in Supabase per §8). Phase 2-4 do
  Dashboard / Budget / Vision 2030 / Personnel in subsequent PRs.
- **Sidebar navigation** (CLAUDE.md §11 PR-Sidebar-A + B): replaces top
  tab nav entirely; left rail with all tabs; sign-in widget moves into
  sidebar footer. Per-tab section TOC (PR-B) limited to Dashboard +
  Pipeline (tabs with real sub-sections). Queued after Cred-Ref PR-4.
- **Bigger refactor (parked)**: the `tabs.js` module that would close the
  5-touch-points trap. Worth doing alongside or right after the sidebar
  work, since the sidebar already restructures tab navigation.

### Next concrete step (2026-05-25, post-Session-7 checkpoint)

Land **Cred-Ref PR-4** — the edit-override curation. `unified_title`
rename, `issuing_agency` override, `training_agency` override,
`quality_flag` toggle. **Risk hot-spot:** any `unified_title` rename
ripples into `kb/coci_articulations.json` (which inlines the field) —
re-mint playbook discipline applies (alias map at write-time,
`kb/_apply_credential_review.py` sync script for the daily cron,
atomic land within one 10:17 UTC cron window).

---

## Session 8 — 2026-05-26, Octaman

### What shipped this session (8 PRs, ~1 working session)

| PR | What |
|---|---|
| #125 | EACR Phase 4 dry-run + alias map (PR-C0). `kb/_eacr_dryrun.py` projects every raw MAP row onto the post-pivot `(unified_title, issuing_agency, CPL Type, Collaborative Type)` key. Output: 3,217 raw IDs → 2,351 cards (27% collapse); 173 cards fold ≥2 raw IDs; 13 fold ≥5. Alias map written for downstream re-key. |
| #126 | Disable CodeQL PR trigger (push + weekly cron only). Killed CodeQL fatigue on PRs that touch innocent DOM-builders the analyzer keeps flagging as `js/xss`. |
| #127 | Re-classify 58 raw titles flagged `unclassified_in_map_only` in PR-A's audit. Cleared the auditor's `unclassified_in_map_only` queue to zero (was 58, now 0). |
| #128 | EACR Phase 4 producer re-pivot (PR-C1). `_build_statewide_adoption()` grouping key changed from `(raw_title, cpl_type, collab_type)` → `(unified_title, issuing_agency, cpl_type, collab_type)`. 3,274 cards → 2,351 cards; new fields on every card: `unified_title`, `issuing_agency`, `training_agency`, `confidence_title`, `confidence_issuer`, `quality_flag`, `raw_titles[]`. Generator-side strip pattern added so repeat runs don't accumulate. |
| #129 | Quick-start chat (Tier A) — natural-language tab routing on the dashboard's first screen. Cloudflare Worker proxy + JSON-mode router prompt; 1-of-8 classification. `quickstart.js` new file. |
| #130 | Quick-start chat polish — swap model `claude-sonnet-4-5` → `claude-haiku-4-5-20251001` (4-6s → 1-2s round-trip), and a `navigateTo()` that pulses + scroll-to-tops when the destination is the active tab (the silent-no-op trap of `location.hash = current`). |
| #131 | EACR Phase 4 consumer redesign (PR-C2). Card title now shows unified_title in bold + issuer subtitle in muted italic. New "Also entered as N variants" disclosure (310 cards have ≥2 raw variants; top fold = `AP World History: Modern / College Board` with 26 variants). Confidence badge ("needs review · 0.NN" at threshold 0.75). Quality-flag badge ("⚠ course-as-exhibit" on 193 cards). New Issuing Agency filter button. Migration script `kb/_eacr_flag_migrate.py` added for `_EACR_FLAG::*` curator-flag re-key. |
| #132 | Hotfix to migration script — column name was `reviewed_by` (the in-memory JS object property), not `reviewer_email` (the actual Supabase column). PR-D's `fetchFlagOverlay()` aliases the column to the property; I read the rendering code and assumed the property name was the column name. Caught by Sam's first dry-run. |

**Migration outcome:** Sam ran the dry-run after PR #132 merged — **zero existing flags**. The migration is a no-op for current state (PR-D shipped only 2 days ago; no one had flagged anything during the brief window). The script stays in the repo as future-proofing for any similar re-pivot.

### EACR Phase 4 — actually finished now

The "Approach B" re-pivot that's been parked in CLAUDE.md §9 since
Session 6 is end-to-end shipped:

  - PR-C0 (#125): dry-run + alias map (de-risk the producer change)
  - PR-C0b (#127): close the unclassified gap before pivoting
  - PR-C1 (#128): producer (`_build_statewide_adoption()` re-pivot)
  - PR-C2 (#131): consumer (table renders unified cards)
  - PR-C2 migration (#132 + dry-run): re-key existing flags (no-op)

**Headline numbers:** 3,274 EACR cards → 2,351 cards (28% collapse).
The 310 cards that fold ≥2 raw variants are exactly the title-drift
duplicates the vision doc has been calling out for months. AP credits
collapse hardest — every College-Board AP exam is now one card per
exam with all variant spellings folded.

### Lessons learned

**1. The column-name vs object-property trap.** PR-D's
`fetchFlagOverlay()` queries `reviewer_email` from Supabase but
aliases it to a `reviewed_by` *key* on the in-memory JS object the
rest of the code consumes. When writing the migration script in PR-C2
I read the rendering code (`state.flags[eid].reviewed_by`) and
assumed `reviewed_by` was the column name. PostgreSQL caught it
cleanly ("Perhaps you meant `reviewed_at`?") and the fix was 5
character-substitutions. **Future move:** when writing any Supabase
client code, consult `kb_curation` schema via Supabase MCP
`list_tables` BEFORE writing — don't infer columns from consumer code.

**2. The generator-side strip pattern keeps paying off.** PR-C1 added
a new strip block (`# strip prior PR-C1 emit so repeat runs don't
accumulate`) following the EXHIBIT_CSS_MARKER precedent. Idempotency
is a first-class concern for this pipeline (Rule 2) and every
generator-injected block needs its own strip clause. Eight months in
and the pattern is fully internalized; new contributors should learn
it from the existing examples (line ~5093 of `excel_to_dashboard.py`).

**3. Migration script as future-proofing, not always action.**
PR-C2's `kb/_eacr_flag_migrate.py` was written assuming flags
existed; the dry-run revealed zero. The right move was NOT to skip
the script — the script is the *plan*, and the zero-row outcome is
the *confirmation* that the plan didn't need to fire. Architectural
correctness > immediate utility. The script stays in the repo for
any future re-pivot.

**4. Multi-PR architectural arc cadence.** Today's EACR arc landed in
five PRs across one session: dry-run → cleanup → producer → consumer
→ migration. The dry-run-first discipline (PR-C0 before PR-C1) is
worth the extra PR — Sam reviewed the projected collapse numbers
BEFORE the producer changed, which is the same discipline the
CourseControlNumber re-mint used (PR #83 dry-run before PR #84
land). **Pattern to keep:** any architectural pivot that re-keys
identities ships in two PRs minimum: dry-run + alias map first,
then atomic land using the alias map.

**5. Side workstreams don't have to be one-shot.** The quick-start
chat shipped in two iterations (PR #129 Tier A producer + PR #130
polish for latency + already-on-tab visual feedback). Shipping the
minimal viable version first and iterating on real user feedback
beats trying to nail everything in one PR. The "already-on-tab
no-op" was an issue Sam wouldn't have caught in the spec doc — only
hands-on use surfaced it ("apprenticeship initiative" routed to
Dashboard, where he already was, and nothing visibly changed).

### Side workstream: Quick-start chat (PRs #129/#130)

A new UI affordance on the dashboard's first screen — a single text
input that the user types natural language into, the Claude API
classifies which tab the user wants, and the dashboard navigates
there. Tier A (this session) does pure routing (one of 8 tabs).
**Tier B (deferred):** filter-hint hand-off — prompt like "review
unclassified credentials" → `{tab: "credential-reference",
filter_hint: "audit_tag=unclassified"}` → the Credential Reference
tab consumes the hint and pre-populates the filter. **Architecture
already in place** to support Tier B: the router response already
returns JSON, just needs a `filter_hint` field + sessionStorage
hand-off + each tab consumes the hint on init.

Lessons from this side workstream:
- **Haiku 4.5 is right for routing tasks.** Sonnet was overkill for
  a 1-of-8 classification with a tight system prompt; Haiku cut
  latency 3-4× with no quality regression.
- **Hash-router silent no-op.** Setting `location.hash` to the
  current hash fires no `hashchange` event, so the user gets no
  feedback. Always provide an alternate visual signal (scroll,
  pulse) when the destination matches current state.

### Strategic roadmap (post-Session-8)

| Workstream | Status |
|---|---|
| EACR Phase 4 re-pivot (Approach B) | ✅ end-to-end shipped this session |
| Quick-start Tier A (routing) | ✅ shipped #129 + #130 |
| Quick-start Tier B (filter-hint hand-off) | queued — 3-4 hr, low risk |
| Cred-Ref PR-4 (edit-override curation) | **queued — Session 9, was Session 7's plan, bumped behind EACR** |
| Sidebar PR-A/B (left rail + section TOC) | queued behind PR-4 |
| Excel→Supabase Phase 1 (Workplan POC) | queued — separate multi-session arc |
| EACR Phase 5 (audit-driven re-classify loop) | not yet scoped — Hept's exhibit audit can now drive PR-D flag → curator re-classify → daily cron consumer refresh |

### Next concrete step (2026-05-26, post-Session-8 checkpoint)

**Cred-Ref PR-4** — the edit-override curation queued in Session 7's
handoff and bumped this session. Single PR: click any of
`unified_title`, `issuing_agency`, `training_agency`, `quality_flag`
on a Credential Reference row to edit inline; save to Supabase via
`_CREDENTIAL_REVIEW::<unified_title>` namespace with per-field
column. **Risk hot-spot:** `unified_title` rename ripples into
`kb/coci_articulations.json` (which inlines the field) — re-mint
playbook discipline applies (alias map at write-time, daily-cron
sync via `kb/_apply_credential_review.py`, atomic land within one
10:17 UTC cron window). Time: 3-4 hr.

After PR-4 lands: **Quick-start Tier B** (filter-hint hand-off) is
the natural quick win — it ties the chat to the curator workflow PR-4
just shipped ("review unclassified credentials" → pre-populated audit
filter on Credential Reference).


---

## 2026-05-27 — Session 11 (Bruh El): Cred-Ref-5a sync + bake-aware overlay

### What shipped

**PR #150** — `kb/_apply_credential_review.py` sync script. Mode A scope:
non-identity overrides (`issuing_agency_override`, `training_agency_override`,
`quality_flag_override`, `reviewed_marker`) fold into a git-canonical
`kb/credential_review_overlay.json`, mirroring the `_apply_curation.py`
pattern. Wired into daily workflow step 3 + step 6 commit. `unified_title_override`
is recorded but NOT applied (Mode B / future PR-5b is the full re-mint
playbook with alias-map + articulation re-key).

**PR #152 (follow-up)** — bake-aware overlay. The deferred half of #150.
`excel_to_dashboard.py:export_credential_reference()` now loads the overlay
file and bakes overrides into `credential_reference_data.js`, preserving
the AI baseline on parallel `_original_<field>` siblings. `applyOverlay()`
rewritten to handle three cases per field:
  - (a) Live overlay has override → wins; baseline (preferring baked
    `_original_` over visible value) becomes `original_*` for the
    "originally: X" hint.
  - (b) No live override but baked `_original_` exists → curator cleared
    the override between sync and now; revert to baseline.
  - (c) Neither → no-op.

### Lessons learned

**1. Mode A / Mode B split — the discipline that lets a sync script ship safely.**
Cred-Ref PR-4 deferred ALL of `_apply_credential_review.py` to "PR-5", with
both parts entangled. Splitting into Mode A (safe non-identity edits, daily-
cron-safe, no playbook needed) and Mode B (identity rename, re-mint playbook
mandatory, atomic-window required) let Mode A ship today while Mode B stays
parked for a separately-scoped session. **Generalizable pattern**: any
curator-overlay → JSON sync should classify each field as "identity-touching"
or "decoration-only" and ship the decoration sync first.

**2. Bake-aware overlay needs to handle clear-after-bake, not just apply-on-top.**
First-draft `applyOverlay()` just captured `r.original_primary_issuer = r.primary_issuer`
before overwriting — which was correct when the baseline was always the AI
value. After baking overrides, `r.primary_issuer` IS the override at
applyOverlay-time, so the captured "original" became the override itself
(wrong tooltip). Two fixes needed:
  - Case (a): read baseline from `r._original_*` if present, else current value.
  - Case (b): when no live override exists but `r._original_*` is set, the
    curator cleared between sync and now — revert visible value to baseline.

Without case (b), a curator clearing an override would see it stuck until
the next 10:17 UTC sync. Subtle bug. The clear-then-reload test surfaces it.

**3. The early-return-on-empty-overlay trap.**
Previous `applyOverlay()` started with `if (!ov) return` — fine when overlay
was the only source of truth. After baking, that early-return prevents case
(b) from firing (which is exactly the case where `ov` is empty). New version
visits every row regardless and checks per-field. Generalizable: **when
adding a new data source to a function, audit early-returns; they may have
been valid before the new source existed.**

**4. Backwards-compat with the runtime-fetch path is free if you check for
`_original_*` presence.**
The dashboard has two row-build paths: baked (with bake-aware metadata) and
runtime fetch (no metadata). The "look for `_original_*`, else fall through"
pattern means runtime-fetched rows behave identically to pre-bake-aware
applyOverlay. No conditional code paths for "are we coming from baked?";
the presence of the metadata IS the signal.

**5. Smoke test with mock rows beats deploying-and-praying.**
For the sync script, mocked Supabase rows (5 lines of Python) confirmed:
- Prefix filter correctly drops non-`_CREDENTIAL_REVIEW::*` rows
- Unknown-field filter drops `bogus_field`
- Rename overrides counted separately for the print summary
- Latest reviewer/timestamp wins on a unified_title with multiple rows

For the bake-aware overlay, mocked overlay JSON + handwritten payload row +
running the per-field logic in Python (not even JS) verified the
`_original_` capture. Crucial caveat: the JS implementation still needs
real browser verification post-merge.

### Strategic roadmap

| What's next | Status |
|---|---|
| Cred-Ref PR-5b (rename promotion) — `unified_title_override` → actual rename + alias map + articulation re-key + atomic Supabase clear | parked (its own session; re-mint playbook mandatory) |
| EACR card regrouping by issuer override (PR-C0/C1/C2 cards group by `(unified_title, issuing_agency, …)`, so an issuer override should regroup) | parked (deeper side effects; needs scoping) |
| Description-similarity tie-breaker for borderline title matches (the open thread from §9) | parked |

### Next concrete step

When Sam decides Cred-Ref PR-5b is worth doing (curator usage signals
demand for real renames vs display-only), scope it as its own session with
a dry-run-first plan, alias-map output, atomic land within one cron window.
Per `docs/coursecontrolnumber_remint.md`.
