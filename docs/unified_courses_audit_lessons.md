---
title: Unified Courses Trust-Card Auditor — Decisions & Lessons
date: 2026-05-23
session: 4 (Bruh Prime)
phases: [1a, 1b/1, 1b/2, 1c (5 of 9), 1c-UX]
tags: [auditor, unified-courses, m-id, mc, cidx, trust-score, calibration, decisions, knowledge-base]
artifacts:
  - kb/_row_audit.py
  - kb/row_audit/latest.json
  - kb/row_audit/2026-05-23.md
  - unified_courses.js
  - excel_to_dashboard.py
  - .github/workflows/daily-dashboard.yml
related:
  - CLAUDE.md §11 (M-ID Lifecycle, MC, CID/CIDx Pathway)
  - docs/coursecontrolnumber_remint.md (the playbook this auditor follows)
  - kb/README.md (KB schemas + identifier precedence)
---

# Unified Courses Trust-Card Auditor — Decisions & Lessons

Reference write-up of how the auditor was designed across session 4 (Phase 1a
through 1c + UX), why each major decision came out the way it did, the
calibration methodology, and what to reuse next time. Pairs with
[`CLAUDE.md §11`](../CLAUDE.md) (the operational rules + pipeline + roadmap)
and [`kb/_row_audit.py`](../kb/_row_audit.py) (the implementation).

## TL;DR

- The auditor produces a per-row **Trust Card** with two scores
  (`faculty_trust_score`, `mc_ready_score`) and a tag list. It walks every
  M-ID + Cluster (~16,309 cards), classifies each field by state, applies
  per-tag penalties to discipline-related fields, computes weighted scores,
  and writes `kb/row_audit/latest.json` + `<date>.md`.
- **Audit findings + scores are wired into the UCL tab.** Per-row ⚠ chip
  shows `⚠ N · 0.XX`, color-graded by severity. Hover tooltip gives a
  tag-derived score breakdown. A `Triage:` dropdown carves the cleanup
  queue 8 ways.
- **MC, not TMC** is the M-ID destination terminology (Model Curriculum,
  not Transfer MC) — transferability is intentionally out of scope to
  avoid the UC-defaults trap. The score-field roster mirrors this
  (`transferability` and `degree_applicability` are explicitly excluded
  from `MC_NOT_YET_CAPTURED`).
- **Daily auditor cron**: `.github/workflows/daily-dashboard.yml` now runs
  `python3 kb/_row_audit.py` after `excel_to_dashboard.py`, committing
  `kb/row_audit/latest.json` + the dated MD into `main` so the UCL chip
  stays current with each cron.

## What we built (commit-by-commit)

| Commit | What |
|---|---|
| `bbf7a14` | Phase 1a: read-only Trust-Card auditor (`kb/_row_audit.py`) |
| `4cd1198` | Rename TMC → MC; drop `transferability` + `degree_applicability` slots |
| `b88e86d` | Add Rule 8 (context checkpoints) + CLAUDE.md §11; real project README |
| `a878352` | Phase 1b (1/2): cluster row aggregates from members in renderer |
| `95f3123` | Phase 1b (2/2): UCL ⚠ chip + audit-status toolbar + daily cron |
| `8ad1a34` | Phase 1c: `discipline_title_mismatch` (positive-evidence, trust-anchor bagged) |
| `8f56bbb` | Phase 1c: `generic_title_concrete_discipline` |
| `62d5241` | Phase 1c: `top_discipline_disagreement` |
| `a79e565` | Rule 8 checkpoint #1 |
| `51b91dd` | Phase 1c: `description_discipline_disagreement` |
| `53622a1` | Phase 1c: SISTER_PAIRS suppression for top_discipline_disagreement |
| `f95fe0b` | UCL Triage filter (8 modes) |
| `2444365` | Score now incorporates per-tag penalties; chip shows `⚠ N · 0.XX` with severity color + breakdown hover |
| `8dca8f3` | Normalize Flags-column label font-sizes (.uc-auth-link → .68rem) |
| `8f3544f` | Rename "Potential Adoption" → "Adoptable"; flags-cell nowrap |

## Decisions, with the reasoning that locked them

### Two scores, not one — and why MC (not TMC)

The auditor surfaces:
- **`faculty_trust_score`** ∈ [0,1] — would a discipline faculty member rely
  on this row enough to ratify a cross-college articulation adoption?
- **`mc_ready_score`** ∈ [0,1] — is this row a viable Model Curriculum
  submission to ASCCC (becoming a CIDx if CTE, or CID if intersegmental
  approval is sought)?

**MC, NOT TMC.** TMC implies *transferability* (CCC/CSU/UC agreement via
CIAC) — the hard/slow lane M-IDs were designed to avoid. M-IDs are CPL
articulation-adoption signals, full stop; calling them "TMCs in waiting"
would reintroduce the UC-defaults trap and undo the angst-removal benefit
for faculty + AOs. Decision locked in commit `4cd1198`. CLAUDE.md §11 has
the long-form framing.

Practical implication: `transferability` and `degree_applicability` are
deliberately **excluded** from `MC_NOT_YET_CAPTURED` (the forward-compat
slot list for fields the data model doesn't yet hold). Including them
would muddy the score and the strategic message.

### Field-state taxonomy as the score backbone

Each faculty-field gets a state:

  `real / curated / aggregated-unanimous / aggregated-modal / inferred-high
  / inferred-low / aggregated-varied / seed-untouched / off-scheme /
  missing / conflicting / not_yet_captured`

`STATE_SCORE` maps each state to a [0,1] per-field score; the row's
`faculty_trust_score` is the weighted mean across `FACULTY_WEIGHTS`
(discipline 0.30, credit_status 0.20, typical_units 0.20, description
0.15, top_code 0.10, confidence 0.05).

**Why states, not just tags:** states are a closed vocabulary that
describes *how* the data got into the field (curator vs aggregation vs
inference vs original Phase B seed). Tags describe *what's wrong* with
the data. The two are orthogonal — a row's discipline can be in state
`curated` (trustworthy) AND simultaneously have an audit tag (e.g. the
curator picked a discipline that the title disagrees with). The score
combines both signals.

### Per-tag penalties (added late — calibration matters)

Initially `faculty_trust_score` was state-only — tags fired alongside but
didn't depress the score. We caught this when reviewing: a row with
`seed_untouched_discipline` + 3 audit signals scored the same as a row
with just `seed_untouched_discipline`. Wrong; each tag is independent
evidence.

Added `TAG_PENALTY_ON_DISCIPLINE`:
- `discipline_title_mismatch` −0.20
- `top_discipline_disagreement` −0.15
- `description_discipline_disagreement` −0.15
- `generic_title_concrete_discipline` −0.20

Floor at 0; cap at state-score. Compounds (4 signals can push the
discipline field's per-field score from 0.30 to 0). Calibration shift:
- AB M1011 (3 tags): 0.73 → 0.70
- COMM M9007 (4 tags + credit-mixed): ~0.65 → 0.51
- Clean rows: unchanged at 0.94

**Lesson for future**: design the score model with combiners (tags →
field-score penalties) from the start, not bolted on. Once you ship a
score, every UI surface anchors on it; changes propagate everywhere.

### Bag-construction circularity (3 iterations)

For `discipline_title_mismatch`, we needed a "discipline keyword bag" to
compare titles against. Iteration mattered:

- **V1: lexicon-only bag** (`discipline_inference.json` title_keywords +
  discipline name). Result: 6,382 flags, top-20 entirely false positives
  ("Intermediate Algebra" → Mathematics flagged because the Mathematics
  bag didn't contain "algebra"). REJECTED — bags too thin.
- **V2: bootstrap from corpus** (rows with corroboration_members ≥ 10).
  Result: 3,695 flags; test cases like `AB M1011 "Shop Math and
  Measurement"` NOT flagged because Auto Body bag had been **polluted with
  "shop, math, measurement" from M1011 itself** — circular self-validation.
  REJECTED.
- **V3: positive-evidence + same bootstrap** (require ≥2 overlap with some
  OTHER discipline's bag, not just absence of overlap with assigned).
  Result: 573 flags, but same circular issue. REJECTED.
- **V4: bootstrap ONLY from `discipline_source == "subject_map"` rows**
  (the trust anchor — discipline was assigned because the lexicon's
  subject_map unambiguously mapped subject code to discipline; Phase B
  seeds excluded). Result: 742 flags, AB M1011 correctly flagged
  (suggests Steamfitting; curator decides). **LANDED.**

**Lesson**: when bootstrapping a classifier from corpus statistics,
**exclude the population you're evaluating** from the bootstrap set.
Otherwise the classifier validates the very mistakes you're hunting.

### Calibration cycle: dry-run before wiring

For every new rule we ran an inline Python dry-run against live data
**before** editing the auditor — measured flag count, sampled the top-20
by leverage, sanity-checked test cases, and only then wired it in. This
caught V1/V2/V3 bag-construction bugs without polluting `_row_audit.py`
or `latest.json`. The dry-run pattern mirrors `kb/_remint_dryrun.py`
from the re-mint playbook.

Calibration targets emerged from the data:
- 30-80 flags = sweet spot for hand-review
- 200-1,000 = leverage-ranked cleanup queue (top-50 actionable in one sitting)
- > 2,000 = needs a suppression set or a tighter guard

### SISTER_PAIRS as data-driven suppression, not guessed

`top_discipline_disagreement` first calibrated at 2,201 flags — too noisy.
We ran a *separate* dry-run to count distinct disagreement pairs and
their leverage:

```
554 rows  Kinesiology ↔ Physical Education       ← biggest noise source alone
 95       Computer Information Systems ↔ Computer Science
 75       Carpentry ↔ Construction Technology
 70       Commercial Music ↔ Music
 ...
```

Top-25 pairs accounted for the bulk. Encoded ~21 sister pairs (where one
is a specialization of the other, or synonymous): 2,201 → 857 (~61%
reduction). The SISTER_PAIRS set is data-driven (each entry traceable to
a row count) and edited as curators identify more synonyms.

**Lesson**: noise-suppression sets should be data-derived, not invented.
Run the disagreement-pair audit first, then encode the high-leverage
sister pairs.

### "Show me the breakdown" without bloating the JSON

User asked: should the hover tooltip on a row's chip show the score
breakdown? Two options:
- **Inline per-field state** in `latest.json` for every M-ID (~1-1.5MB
  added; cluster cards already have it).
- **Compute the breakdown client-side** from tags + score (zero new data).

Chose option 2. JS string assembly at hover time produces *"discipline
penalized −0.35 (2 signals)"* or *"discipline contribution unchanged by
tags"*. Faithful explanation, no bloat. The hover is light enough to
generate inline; doesn't impact page load.

**Lesson**: prefer **derive client-side from existing data** over
**inline pre-computed metadata** when both produce the same observable
output. The data file stays small and the explanation stays in sync
with the algorithm (one source of truth in
`TAG_PENALTY_ON_DISCIPLINE`).

The mirror is maintained manually: `TAG_PENALTY_ON_DISCIPLINE` lives in
both `kb/_row_audit.py` (server-side score) and `unified_courses.js`
(client-side tooltip math). Code comments in each file flag the mirror
dependency.

### Chip severity colors anchor on readiness tiers

The chip's background color grades by `faculty_trust_score`:
- `warn` (red) for < 0.40 — `needs_repair` / `not_ready`
- `mix` (amber) for 0.40-0.65 — `needs_review`
- `muted` (gray) for ≥ 0.65 — `ready` (still informational since tags exist)

This deliberately mirrors `READINESS_TIERS` in `_row_audit.py` so the
chip's color is *the same signal* as the row's faculty_readiness tier.
Curators can scroll the table and see at a glance which rows are red
(act now), amber (review), or gray (probably fine but flagged for
context).

### UCL "Triage:" dropdown — surfacing the cleanup queue

The audit produces 12,858 flagged rows out of 16,309 total — far too many
for sequential review. The Triage filter carves the queue 8 ways:

| Mode | Count | Use case |
|---|---:|---|
| Any audit flag | 12,195 | overview of all flagged rows |
| **3+ findings** | **246** | **high-confidence misassignment subset (start here)** |
| Title mismatch | 692 | targeted cleanup pass on title-vs-discipline |
| TOP mismatch | 838 | TOP cross-validation pass |
| Description mismatch | 77 | small + high-confidence (descriptions are reliable signal) |
| Generic title | 43 | quick pass; usually blank-discipline outcome |
| Seed untouched | 10,169 | broadest bucket — typically batch-Verify via existing UI |
| Cluster issues | 1 | the lone UC-CUR cluster |

The "3+ findings" mode is the strategic tier — rows where the auditor's
rules fire on multiple independent axes are very-likely-wrong. Start
curator review there.

### Adoption column rename: clarity + space-saving

Renamed "Potential Adoption" → "Adoptable". The semantic is "able to be
adopted" (parallel to "Adopted") — short, clear, and shrinks the column
from ~140px to ~84px, giving the Flags column the breathing room to
keep all chips on one line (with `td.uc-flags-cell { white-space:nowrap }`).

UI lesson: when a column header is long, the *column itself* widens to
fit. Shrinking the header (semantically equivalent shorter label) often
frees more space than fighting the layout with CSS.

## Tab rename: "Unified Courses" → "Common Course Reference"

Late in session 4 the user flagged that **"Unified Courses" is being
confused with University of California** (UC) — a real risk given the
audience is CCC faculty + administrators who use "UC" daily for the
4-year segment.

Deeper concern: in CCC, **faculty hold primacy on all curricular matters**,
and there's well-documented sensitivity to AI being seen as making
curriculum decisions for them. "Unified Courses" reads in passive voice
— *the system has unified your courses* — which subtly positions the
machine as actor.

Rename to **"Common Course Reference"** (CCR) addresses both:

- **"Common"** echoes "Common Course Numbering" (AB 1111) — CCC's own
  statewide vocabulary. Faculty trust this term.
- **"Reference"** is the load-bearing word. A reference doesn't make
  decisions — it surfaces information faculty consult to make their
  own decisions. Same posture as a dictionary, glossary, directory.
- No "AI / smart / intelligent / unified / inferred" language in the
  visible name.
- No UC confusion. CCR is unclaimed in CCC's common acronym space.

### Scope of the rename (deliberate boundaries)

**Renamed (user-facing UI only):**
- Dashboard tab button label
- H2 heading + subtitle ("a cross-college course identity reference for
  faculty review")
- README user-facing descriptions

**NOT renamed (internal — preserves bookmarks + the file ecosystem):**
- URL hash: stayed `#unified-courses` (changing breaks saved links)
- File names: `unified_courses_*.js`, `unified_courses.js`,
  `unified_courses_audit_lessons.md`, `kb/coci_minted_courses.json`
- JS globals: `window.CPL_UNIFIED_COURSES`, `window.CPL_UC_*`
- Python identifier `export_unified_courses()`, function comments
- Console-log strings during the cron

**Rationale**: Internal identifiers are stable contracts that
consumers depend on. The cost of renaming them (touching the daily cron's
git-add list, all lazy-load logic, every cross-reference) is high; the
benefit is zero (nobody outside the dev loop sees these). The UI rename
delivers the user value with surgical scope.

### Microcopy follow-on (deferred)

Worth a future pass: soften any UI copy that says "consolidated by the
system" / "machine-inferred" toward "drawn together for faculty review"
/ "suggested for faculty review." Faculty want to see themselves as the
authority, the system as the instrument. Not done yet — flag for next
session.

## What's deferred (open follow-ups)

1. **Phase 1b (3/3) — Repair-from-members curate action.** Touches
   Supabase schema (new columns on `kb_curation` for credit_status / top_code
   / typical_units / confidence_override), `_apply_curation.py` extension,
   UCL modal, fresh-read + cron-window. Parked at low immediate value (1
   cluster); build when ≥5 clusters mint.
2. **Phase 1c remaining rules:** `subject_collision_signal`, `unit_anomaly`,
   `merge_into_orphan`, `cluster_title_drift`. Diminishing returns —
   pick up if specific signals matter.
3. **Optional: more sister pairs.** SISTER_PAIRS can be expanded as
   curators flag new noise patterns. Data-driven additions only.
4. **MC-readiness scoring becomes meaningful when SLO ingestion lands
   (Phase 4 of roadmap).** Until then every row sits well below
   `mc_ready` — the strategic message: MC-readiness is the destination,
   not the current state.
5. **CIDx classifier (Phase 5).** When the COCI CTE field is wired in,
   the auditor can surface CTE-eligible rows separately so curators
   prioritize MC packages destined for the CIDx (ASCCC-only) lane.

## Patterns to reuse

- **Calibrate every rule against live data before wiring.** Inline Python
  dry-run, sample top-20 by leverage, verify your test cases land where
  you expect. Caught V1/V2/V3 bag-construction bugs cheaply.
- **Bootstrap classifiers from a trust anchor**, not the population you're
  evaluating. `discipline_source == "subject_map"` rows were the right
  bootstrap set; the Phase B seeds were the target.
- **Data-driven noise suppression.** Run the disagreement-pair audit
  first; encode the high-leverage pairs. Don't guess what's noisy.
- **Derive client-side over inlining metadata.** When the explanation can
  be computed from data the client already has, do that — keeps the file
  small + the explanation in sync with the algorithm.
- **Score tags as compounding signals, not just flags.** A score that
  doesn't depress under multi-tag evidence isn't measuring whole-package
  trust. Wire per-tag penalties from the start.
- **Color-grade the chip by tier so signal pops without numbers.** Anchor
  the color buckets on the same readiness tiers used elsewhere
  (`READINESS_TIERS`) so the UI tells the same story as the data.
- **Mirror server-side constants client-side** when both surfaces need
  them. Document the mirror dependency in code comments in each file.
- **Rule 8 checkpoints**: at every ~100K context, refresh CLAUDE.md /
  kb/README.md / docs/ / README.md. Sessions end abruptly; what's not in
  markdown is effectively lost.

## How to roll back the score change (if it ever comes to that)

The per-tag penalty addition (`2444365`) is reversible — single commit, no
data migration. To roll back: `git revert 2444365` and re-run
`python3 kb/_row_audit.py`. The score model reverts to state-only;
existing tags continue to fire but stop depressing the score.

The audit's tag SET hasn't changed; only the score's *interpretation* of
tags. Downstream consumers (the chip, the Triage filter) keep working —
they read `fts` and `tags` separately. A rollback would just make some
rows score slightly higher than they should.

---

**See also:** [`CLAUDE.md §11`](../CLAUDE.md) for the M-ID lifecycle +
MC vs TMC framing + roadmap table; [`kb/_row_audit.py`](../kb/_row_audit.py)
for the implementation; [`unified_courses.js`](../unified_courses.js) for
the UCL surface;
[`docs/coursecontrolnumber_remint.md`](coursecontrolnumber_remint.md)
for the re-mint playbook this auditor's calibration discipline mirrors.
