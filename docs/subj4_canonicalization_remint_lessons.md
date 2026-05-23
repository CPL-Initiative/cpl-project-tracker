---
title: SUBJ4 Canonicalization Re-Mint — Decisions & Lessons (Phase 1e)
date: 2026-05-23
session: 5 (Bruh Quad)
phases: [5a (seed + curator tab + audit rule), 5b (dry-run), 5c (atomic apply)]
status: COMPLETE — apply landed 2026-05-23 in commit `5406055`; cleanup-receipt invariants satisfied
tags: [remint, phase-1e, subj4-canonicalization, m-id, curator-tab, dry-run, apply, rule-7-staging]
artifacts:
  - kb/_row_audit.py
  - kb/_seed_canonical_subj4.py
  - kb/_apply_canonical_subj4.py
  - kb/_subj4_dryrun.py
  - kb/discipline_canonical_subj4.json
  - kb/subj4_dryrun/{report.md, alias_map.json, blocked.json, collisions.json}
  - canonical_subj4.js
related:
  - CLAUDE.md §11 (M-ID Lifecycle, MC, CID/CIDx Pathway)
  - docs/coursecontrolnumber_remint.md (the playbook this re-mint follows)
  - docs/unified_courses_audit_lessons.md (the auditor work this re-mint operates on top of)
  - kb/README.md (KB schemas + identifier precedence)
prs: [89, "5b — pending"]
---

# SUBJ4 Canonicalization Re-Mint — Phase 1e

Reference write-up of the SUBJ4-canonicalization re-mint — the first re-mint
under the revised Rule 7 staging-phase framing. Built across Session 5 (Bruh
Quad) on the shoulders of Session 3 (Bruh — the 2026-05-22 CourseControlNumber
re-mint) and Session 4 (Bruh Prime — the row Trust-Card auditor).

## TL;DR

- **Problem.** The 2026-05-22 re-mint synthesized each M-ID's SUBJ4 from its
  modal local college subject code. The same discipline therefore ended up
  spread across many SUBJ4 codes — canonical example: 92 `"Sign Language,
  American"` M-IDs across **10** SUBJ4 variants (ASL / AMSL / DEAF / SIGN /
  INT / INTR / ACCS / MULT / SL / SNLA). Plus 27 single-letter SUBJ outliers
  (`A M1001`, `F M1001`, …) violating the "exactly 4 letters" invariant.
- **Scope.** ~10,562 M-IDs (~65%) need a re-key under the new invariants. The
  collision rule fires 7,203 times pre-re-mint — roughly **50× higher** than
  Bruh Prime's hand-off estimate of "~100-200." Real scope is comparable to
  the 2026-05-22 re-mint (70,398 renames). The playbook handles it cleanly.
- **Decision: force the 4-letter invariant.** Even for established 3-letter
  CCC abbreviations (PE, KIN, BUS, MUS, ESL, ART, CIS, ASL, …) the curator
  picks a 4-letter expansion. The `M` prefix already disclaims CCN equivalence,
  so 4-letter SUBJ4 stays unmistakably-ours-synthetic.
- **Decision: curator tab over xlsx/markdown** as the canonical-map review
  surface. Auth-gated CRUD via the existing Supabase `kb_curation` table with
  a synthesized `course_id` namespace `_CANON_SUBJ4::<discipline>` — no schema
  migration needed.
- **5a shipped (PR #89, 2026-05-23):** seed + curator tab + audit rule. Apply
  gate from the dry-run is the gating signal for 5c.
- **5b shipped (this PR):** measure-first dry-run. 72,481 M-IDs classified;
  with the current ~30%-filled canonical map, 3,243 would re-key cleanly,
  49,160 are blocked on missing canonical. Apply gate: **🟡 NOT READY** until
  the canonical map is fully reviewed.

## Session 5a — seed, curator tab, audit rule (PR #89)

### Decision 1: force 4-letter SUBJ4 (Rule 7 invariant)

Rule 7 (revised, staging-phase) says "SUBJ portion is exactly 4 letters."
The data has 5,761 M-IDs (35%) with `subject_4letter` < 4 chars: 27 single-
letter, 1,300 two-letter, 4,434 three-letter. Of 143 disciplines, **50 have
a data-modal SUBJ4 that itself isn't 4 letters** — for those, the data-modal
*cannot* be the canonical. The curator picks a 4-letter expansion.

Alternative considered: relax the invariant to "1-4 letters, prefer 4."
Rejected because the `M` prefix's whole purpose is to keep M-IDs unmistakably-
ours-synthetic; a 4-letter SUBJ4 reinforces that. (`PE M1001` reads ambiguously;
`PHYE M1001` reads obviously synthetic.) The corresponding cost — curator
work on 50 disciplines — is bounded.

### Decision 2: per-discipline canonical map as JSON + curator-tab UI

Schema mirrors the existing curation-overlay pattern (`top_discipline_map.json`
+ `discipline_inference.json` as the reference points):

```jsonc
{
  "Sign Language, American": {
    "canonical_subj4":      "ASLN",
    "source":               "curator_override",
    "data_modal":           "ASL",
    "data_modal_is_4letter": false,
    "data_modal_share":     0.685,
    "variants_observed":    {"ASL":63, "AMSL":10, "DEAF":7, ...},
    "total_mids":           92,
    "needs_review":         false,
    "reviewed_at":          "2026-05-24",
    "reviewed_by":          "MAP@rccd.edu",
    "_notes":               "ASL is the established 3-letter abbreviation; expanded to ASLN for the 4-letter invariant."
  }
}
```

No `confidence` field — this is curator-authored, not inferred. `source` ∈
`data_modal` (auto-seeded) / `curator_override` (curator-confirmed).
`variants_observed` is **frozen at seed time** as an audit trail: the choice
is auditable against the data snapshot it was made against, even if member
counts shift later.

### Decision 3: reuse `kb_curation` (no schema migration)

The curator tab writes to the **existing** `public.kb_curation` table with
synthesized `course_id` keys of the form `_CANON_SUBJ4::<discipline>` and new
field names `canonical_subj4` / `canonical_subj4_notes`. The main
`_apply_curation.py` whitelists only `discipline / merge_into / unified_title /
description`, so these rows are auto-skipped from the main curation overlay.
A separate sync script (`kb/_apply_canonical_subj4.py`) pulls only the
`_CANON_SUBJ4::*` rows into `kb/discipline_canonical_subj4.json`.

**Net:** zero Supabase schema migration, zero risk of polluting
`coci_curation.json`, full auth-and-RLS reuse from the existing tab.

### Decision 4: new top-level tab, not a sub-tab of CCR

The Common Course Reference (CCR) tab is the per-course curation surface. The
Canonical SUBJ4 review is per-discipline (143 rows, not 16k). Different cardin-
ality + different decision shape → its own tab is cleaner. Tab nav routing
already supports new tabs (CLAUDE.md §7b); adding the new tab to `VALID_TABS`
+ a tab pane in CPL_Dashboard.html is mechanical.

The tab can be retired once Phase 1e lands (or kept dormant for future
canonical-SUBJ4 questions; the underlying Supabase rows persist either way).

### Decision 5: `subject_collision_signal` is the diagnostic + cleanup receipt

Added to `kb/_row_audit.py` as the 11th active rule:

```python
def _classify_subject_collision(rec, disc_to_modal_subj4):
    if rec.get("id_system") != "M-ID": return False
    disc = rec.get("discipline"); s4 = rec.get("subject_4letter") or ""
    if not disc or not s4: return False
    modal = disc_to_modal_subj4.get(disc)
    return modal is not None and s4 != modal
```

**Calibration: 7,203 flags pre-re-mint** — ~50× higher than Bruh Prime's
hand-off estimate. The number isn't noise; it's the actual scope. Target post-
re-mint: **0** — the cleanup receipt that confirms the canonicalization
landed. Surfaced in the UCL Triage filter as "Subject collision (Phase 1e
re-mint target)."

### Lesson: hand-off estimates need sanity-check against live data before committing scope

The original Phase 1e brief budgeted "~100-200 flags." A 10-line inline
diagnostic was enough to land at 7,203 and re-scope the work. **Run the
measure-first diagnostic BEFORE the user commits to scope** — saves both
sides a misaligned expectation.

## Session 5b — measure-first dry-run

### Output (canonical map ~30% filled)

| metric | count |
|---|---:|
| M-IDs total (minted + singletons) | 72,481 |
| Would re-key cleanly | 3,243 (747 minted, 2,496 singletons) |
| Already on canonical SUBJ4 | 12,908 |
| Blocked on missing canonical | 49,160 (100 disciplines) |
| Skipped (no discipline) | 7,170 |
| Validation passes | **4/4** ✓ |
| Apply gate | 🟡 NOT READY |

### Decision 6: walk minted + singletons together

First cut of the dry-run walked only `coci_minted_courses.json` (16,308 rows).
Caught a curated `ABDY M10AA` showing as `not_found_in_minted` — it lives in
`coci_minted_singletons.json` (single-college M-IDs, 56,173 rows). Both files
share the M-ID id family and need the same canonicalization treatment;
walking only minted underrepresents the apply scope by 4×.

Updated `_seed_canonical_subj4.py` to walk both files when computing the
variant distribution. This caught one singleton-only discipline (`Upholstering`,
1 row) missing from the canonical map; including singletons grows the seed
from 143 → 144 entries.

**Cost:** adding singletons widened the spread for many disciplines, so the
"pre-seeded" count dropped 51 → 44 (data-modal still has ≥60% majority for
44 disciplines once singletons are folded in). 100 disciplines now need
explicit curator confirmation, up from 92.

### Decision 7: regen-safe seed generator

If `_seed_canonical_subj4.py` is re-run after a curator has filled out
entries, it would wipe them on the next regen. Fixed: the generator now reads
the existing `discipline_canonical_subj4.json` (if present) and **preserves**
any entry with a non-null `reviewed_at`. The data-driven fields
(`variants_observed`, `data_modal`, `total_mids`, …) refresh on every run;
the curator-owned fields (`canonical_subj4`, `source`, `_notes`,
`reviewed_at`, `reviewed_by`) are preserved.

Pairs with `_apply_canonical_subj4.py`: even if the JSON gets wiped, the
Supabase rows are the live source of truth, and the sync restores them.

### Decision 8: dry-run is re-runnable, not one-shot

Unlike the 2026-05-22 `_remint_dryrun.py` (which read the full raw COCI list
and was run once to lock decisions), this dry-run is designed to be re-run
as the curator fills out the canonical map:

```
curate a few disciplines via the tab
  → re-run python3 kb/_subj4_dryrun.py
  → apply-gate signal: still 🟡 (M disciplines left)
  → curate more
  → re-run → still 🟡
  → ...
  → eventually → ✅ READY FOR APPLY
```

The apply-gate signal is the green light for Session 5c. No human "is the
map done?" check needed — the dry-run computes it.

### Decision 9: deterministic sequence reallocation

Within each new `(canonical_SUBJ4, band, kind)` bucket, M-IDs are sorted by
`(normalized_title, old_id)` before sequence numbers are assigned. Normalized
title = lowercase, alnum-only, stopwords dropped, tokens sorted. **Verified
deterministic** across runs: ran the dry-run twice, alias maps `diff`-identical.

Mirrors the 2026-05-22 re-mint's sort key so rows that survived both re-mints
maintain their relative order within a bucket.

Example: `DANC M1*` corroborated bucket has 422 M-IDs from various old SUBJ4s
(DANC, DNCE, DANS, …) collapsing into canonical `DANC`. New sequence is
`DANC M1001` (FALL DANCE CONCERT 1) through `DANC M1422` (Repertory),
unique IDs preserved.

### Decision 10: validation as 4 gates

The dry-run runs four validation gates on the actionable subset (re_key +
no_change rows):

1. **`all_new_subj4_are_4letter`** — every new SUBJ4 matches `^[A-Z]{4}$`.
2. **`one_subj4_per_discipline`** — within each touched discipline, exactly
   one new SUBJ4 in the alias map.
3. **`new_course_ids_unique`** — no two M-IDs land on the same new
   `course_id`.
4. **`no_seq_overflow`** — corroborated buckets stay under 1,000; standalone
   buckets stay under 6,760.

Currently all 4 pass. They'll be checked again at apply time as the abort
condition.

### Decision 11: curated-collision surfacing instead of auto-deciding

The Auto Body curated triple — `AB M1001`, `ABDY M1001`, `ABDY M10AA` — will
all rename into the same canonical bucket once the curator picks (e.g.)
`AUTB`. Within that bucket, sequence numbers are reallocated by normalized
title. The dry-run surfaces this as a "Curated-M-ID collisions" section in
`report.md` for the operator to approve at apply time, rather than silently
picking one as "first."

The user's earlier "no perfect answer, faculty adjust later" decision applies
here: I sort by `(normalized_title, old_id)` (the standard deterministic key).
If the operator wants a different order, they edit the alias map before apply.

### Lesson: downstream scope counts go in the dry-run too

The apply step (5c) re-keys references in `coci_minted_memberships.json`,
`coci_articulations.json`, and `coci_unified_courses.json`. Counting how
many records get touched (at current map state: 3,912 memberships +
943 articulation records + cluster member refs) gives the operator a scope
number going into the apply window — essential context for sizing the
window and the rollback effort.

## Apply gate criteria for Session 5c

Session 5c (the atomic apply) is gated on **all** of:

1. **Canonical map complete:** `_counts.needs_review == 0` (or the operator
   accepts the remaining as out-of-scope and runs a partial apply).
2. **All 4 validation gates pass** in the dry-run.
3. **Curated-collision decisions confirmed** by the operator (which curated
   key gets the canonical sequence-first position).
4. **Supabase fresh-read before write** (per the playbook): drift between
   the dry-run map and the live Supabase state must be reconciled before
   apply, or the apply aborts.

## Files & artifacts

| What | Path |
|---|---|
| Audit rule | `kb/_row_audit.py` (subject_collision_signal) |
| Seed generator (re-runnable, regen-safe) | `kb/_seed_canonical_subj4.py` |
| Supabase → JSON sync | `kb/_apply_canonical_subj4.py` |
| Dry-run analyzer (re-runnable) | `kb/_subj4_dryrun.py` |
| Canonical map (curator-edited via tab) | `kb/discipline_canonical_subj4.json` |
| Curator tab UI | `canonical_subj4.js` + new tab pane in `CPL_Dashboard.html` |
| Dry-run report (human review) | `kb/subj4_dryrun/report.md` |
| Dry-run alias map | `kb/subj4_dryrun/alias_map.json` |
| Dry-run blocked-on-curator backlog | `kb/subj4_dryrun/blocked.json` |
| Dry-run sequence-collision receipt | `kb/subj4_dryrun/collisions.json` |

PRs:
- **#89 (merged 2026-05-23)** — Session 5a: seed + curator tab + audit rule.
- **5b PR (this one)** — Session 5b: dry-run + regen-safe seed update +
  singleton-inclusive scoping.

## Patterns to reuse

- **Run the measure-first diagnostic before scoping.** Bruh Prime's hand-off
  estimate was 50× off. A 10-line inline diagnostic would have caught that
  before the framing was set. Mirrors the 2026-05-22 re-mint's lesson, but
  worth re-saying because every re-mint will need it.
- **Force the 4-letter invariant; document loudly.** When a synthetic
  identifier could be confused with an official one, prefer the visibly-
  synthetic form (4-letter SUBJ4 + `M` prefix) over the "natural" abbreviation.
  Faculty / AOs / external readers shouldn't have to remember which is which.
- **Reuse the curation table with a key namespace.** Avoiding a schema
  migration is worth a small amount of in-band key gymnastics
  (`_CANON_SUBJ4::<discipline>`), especially when the new field is a different
  cardinality than existing curated fields. Saves a coordination round.
- **Per-discipline curator tab over per-row.** When the decision is per-
  discipline (143 entries), don't bury it in a per-course (16k entries) view.
  Cardinality drives the surface.
- **Make the dry-run re-runnable.** A measure-first that's a one-shot tells
  you the state at one moment. A re-runnable one tells you the *trajectory*
  as the gating work proceeds. The apply-gate signal becomes a green-light,
  not a manual decision.
- **Make the generator regen-safe.** If the seed file is curator-edited, the
  generator must preserve those edits or it's a footgun. Read existing
  reviewed-at, merge with refreshed data-driven fields, never overwrite the
  curator-owned set.
- **Walk both files when the id family is shared.** `coci_minted_courses.json`
  + `coci_minted_singletons.json` look like different layers but share the
  M-ID id family — they need the same canonicalization treatment. The
  forward-join member-row pattern (`export_unified_courses`) walks both;
  any re-mint should too.
- **Surface curated collisions; don't auto-decide.** When ≥2 curated entries
  land in the same bucket, the operator approves the sort order at apply
  time — not the algorithm. Same pattern as the playbook's HALT condition.

## How to roll back

The dry-run mutates nothing, so 5b is risk-free. The 5c apply rollback path:

1. **Git revert** the apply commit on `main`.
2. **Supabase rollback:** read fresh, alias every new `course_id` back to
   old via `kb/subj4_dryrun/alias_map.json` read right-to-left (or, post-
   apply, `kb/subj4_out/alias_map.json` once 5c writes it).
3. **Cron-window:** same constraint as the land — the 10:17 UTC cron runs
   `_apply_curation.py` before export, so any half-rolled-back state mid-
   cron will get re-synced. Close the window before the cron fires.

If rollback is needed AFTER the cron has consumed new-key state into a daily
commit, a fresh "un-canonicalize" generator is cleaner than a revert (same
pattern as the 2026-05-22 re-mint's playbook).

## Session 5c — the atomic apply (LANDED 2026-05-23, commit `5406055`)

### Final numbers

| layer | result |
|---|---|
| `kb/coci_minted_courses.json` | 14,971 re-keyed, 71 no-change, 1,266 untouched |
| `kb/coci_minted_singletons.json` | 50,182 re-keyed, 87 no-change, 5,904 untouched |
| `kb/coci_minted_memberships.json` | 14,971 keys re-keyed |
| `kb/coci_articulations.json` | 3,750 records re-keyed |
| `kb/coci_unified_courses.json` | 2,868 member refs across 1,366 clusters |
| `kb/coci_curation.json` | 5 keys re-keyed, 1 no-change (BSIC), 1 cluster untouched |
| Supabase `kb_curation` | 5 rows renamed (3 from a cancelled-run partial + 2 from the successful run; idempotent — same end state) |
| **`subject_collision_signal`** auditor tag | **7,203 → 0** ✓ (cleanup receipt) |
| `mid_id_off_scheme` auditor tag | 27 → 2 (residue: `F M1002` + `N M9001`; both blank-discipline, unfixable) |

### The three bugs caught + fixed mid-stream

5c shipped on its fourth attempt. Three real bugs surfaced — each is a
reusable lesson for the next re-mint.

**Bug 1: 386-row silent overwrite (caught locally during apply-test).**

The dry-run's allocator wasn't reserving sequence numbers occupied by
**untouched** rows (rows with no discipline → no canonical → not in the alias
map but their existing keys persist post-apply). When the allocator assigned
`AGRI M1001` to a re-keyed row, the apply silently overwrote an existing
no-discipline `AGRI M1001` row. Net: 98 minted + 288 singleton = **386 rows
vanished** during local apply-test.

Fix:
- Pre-reserve untouched-row suffixes per `(SUBJ4, band, kind)` bucket alongside
  the CCN/C-ID reservations.
- Added **V4 validation gate**: `new_id_disjoint_from_untouched` — fails if any
  allocator-assigned new_id collides with an untouched row's existing key.
  Surfaced in the report and gated by the workflow.
- Apply script hard-aborts on any in-flight key collision (belt-and-suspenders).

**Lesson:** when partitioning a namespace, every existing occupant of the
namespace must be in the reservation set, not just the partition being
re-allocated. The "untouched" rows are still occupants.

**Bug 2: YAML scanner error from unindented continuation lines (caught after merge, when GitHub couldn't dispatch the workflow).**

The apply workflow had a `git commit -m "Phase 1e: ..."` with a multi-line
message. Continuation lines were at column 0 (no indentation), which
**terminates a YAML `run: |` block scalar**. GitHub couldn't parse the
workflow file and fell back to showing it by file path in the Actions UI;
the workflow's `name:` field never resolved. User couldn't dispatch it.

Fix: switch to multiple `-m` flags (one per paragraph). Avoids:
- The block-scalar termination trap (every line stays inside the YAML scalar).
- The heredoc-in-YAML leading-whitespace trap (heredoc preserves YAML indent in
  the commit message body).

**Lesson:** for multi-paragraph commit messages inside a YAML `run: |` block,
always use multiple `-m` flags rather than a multi-line string or heredoc.

**Bug 3: Supabase fan-out (caught when the apply workflow ran 5+ minutes on the Supabase step).**

The Supabase row-rename step was issuing **one PATCH per alias** (~13k network
round-trips) even though only ~7 aliases actually had live curation rows.
At 100-300ms per request the step took 20-60+ minutes.

Fix: pre-fetch the set of `course_id` values that exist in `kb_curation` via
a single SELECT, then pre-filter the alias loop to only PATCH aliases whose
old_id is in that set. Falls back to fan-out if the pre-fetch fails (so the
script stays correct under degraded network).

**Lesson:** before fanning out N "filter by primary-key" mutations across a
network boundary, pre-fetch the set of primary-key values that actually
match. Even a tiny SELECT beats N × no-op PATCH.

### Happy-idempotency wrinkle

Run #3 of the apply workflow was cancelled mid-Supabase-step. It had partially
PATCHed the AUTB triple (`AB M1001`, `ABDY M1001`, `ABDY M10AA`) before the
cancel. When run #4 started after the perf fix landed:

- The pre-fetch of curated `course_id`s no longer included the AB/ABDY old
  ids (they'd been renamed to AUTB by run #3's partial work).
- The pre-filter correctly skipped those aliases (no live curation row to
  PATCH).
- Run #4's Supabase step renamed only the 2 remaining curated entries
  (`EGDT M1001` → `DRAF M1002`, `ELET M1001` → `ELEC M1028`).

**Net: Supabase reached the correct end state with 5 total renames across
two runs.** No drift, no double-write, no operator intervention. The
idempotency invariant baked into the script (always-match-old-id + skip-if-
already-renamed) handled the partial-cancellation gracefully.

**Lesson:** designing scripts to be primary-key-idempotent (where re-running
on already-applied state is a no-op rather than an error) lets partial runs
+ retries reach the correct end state without manual reconciliation. The
"verbose per-record log" design is what made it auditable after the fact.

### What's deferred (post-5c)

- **Session 5d — M-ID → MID / C-ID → CID rename.** Cosmetic; touches
  `id_system` field values in 3 JSON files (~16,850 rows) + 25+ code/doc
  references + UI labels. Doesn't change identifier formats. Standalone PR,
  the next concrete step for Bruh Quad / a follow-on session.
- **MC slot fields (Phase 4 of the §11 roadmap).** Unlocks
  `mc_ready_score` getting traction once SLO ingestion lands.

## Patterns to reuse (additions from 5c)

- **The "five-gate" dry-run pattern.** Each gate is a single boolean assertion
  the operator can read at-a-glance; failures surface specific examples. The
  V4 gate (`new_id_disjoint_from_untouched`) was a direct response to the
  386-row bug — it ensures the same class of bug never recurs silently.
- **Manual-dispatch + concurrency-group serialization for write-side
  workflows.** Both `phase-1e-sync.yml` and `phase-1e-apply.yml` use
  `concurrency.group: daily-dashboard` so they can't race the daily cron.
- **Pre-flight Supabase reads (and pre-filter against the result).** Always
  beats a fan-out of N filtered PATCHes. The pre-fetch is also a cheap
  diagnostic: "if curated_ids is empty, something's wrong with the database
  connection, abort early."
- **Per-alias verbose log as the receipt.** When something goes sideways
  mid-apply, the log + the alias_map are the operator's two retry inputs.
  Every fate (ok / fail / skipped-no-change / skipped-no-curated-row) gets
  recorded so post-hoc reconciliation is mechanical, not detective work.
- **Always test the apply end-to-end locally before opening the PR.** The
  386-row collision bug wasn't theoretical — it manifested on the first
  local apply-test. The git-restore-after-test pattern (run the apply, verify
  outputs, `git restore` to revert) makes this cheap and routine.

---

**See also:** [`CLAUDE.md §11`](../CLAUDE.md) for the M-ID lifecycle + MC vs
TMC framing + roadmap table;
[`docs/coursecontrolnumber_remint.md`](coursecontrolnumber_remint.md) for the
re-mint playbook this work follows;
[`docs/unified_courses_audit_lessons.md`](unified_courses_audit_lessons.md) for
the audit framing this re-mint operates on top of.
