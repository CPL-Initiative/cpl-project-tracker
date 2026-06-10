---
title: CCR Cluster Cleanup — Lessons & State
date: 2026-05-30
last_updated: 2026-06-10  # Session 39
session: 19 (CCR cluster dissolution)
tags: [ccr, unified-courses, cluster, dissolution, curation-migration, supabase, m-id]
artifacts:
  - kb/coci_unified_courses.json (clusters dict emptied)
  - kb/coci_curation.json (9 cluster-key merges → per-member)
  - excel_to_dashboard.py (cluster-load note + _target_identity relabel)
  - unified_courses.js (Kind/Source/QS/triage labels + doConsolidate relabel)
  - kb/_row_audit.py (merge-target cards → "Unified")
  - archive/coci_unified_courses_clusters_2026-05-30_pre-dissolution.json
related:
  - docs/kb-notes/methodology-retiring-an-auto-seeded-layer.md (the durable pattern)
  - CLAUDE.md "Cluster lifecycle" rule (Knowledge Base & Unified Courses section)
  - kb/README.md (_seed_coci_unified_courses.py row)
---

# CCR Cluster Cleanup — Lessons & State

Running record for the Common Course Reference (CCR) cluster-dissolution
workstream. Sam's ask: "camp on the common course crosswalk and clean up all
the courses tagged as Cluster … change our CCR rules to clarify why or if they
are needed — hopefully, just eliminate the whole cluster category."

## TL;DR / current state (2026-05-30)

- **Dissolved** the 1,385 auto-seeded `UC-XXXXX` variant-unification clusters
  (`coci_unified_courses.json` `clusters` dict → `{}`; archived first).
- **Migrated** the 9 clusters that carried curator `merge_into` decisions to
  **per-member `merge_into`** rows in Supabase `kb_curation` + `coci_curation.json`
  BEFORE dissolving, so no curator decision was lost.
- **Then RETIRED the category entirely** (same session, Sam: "no more clusters"):
  the `merge_members` path no longer relabels targets "Cluster". Native-identity
  targets (M-ID/C-ID/CCN) keep their `id_system` + `kind:"Course"` (9 rows); a
  synthetic `UC-CUR-*` target (no pre-existing identity) gets the new
  `id_system/kind: "Unified"` (1 row, grows with singleton-only merges).
- **Result:** CCR `id_system: Cluster` rows: ~1,376 → **0**. The 9 former
  cluster-target M-IDs now read as plain M-IDs (with members folded); the 1
  synthetic course reads as "Unified".

## What the auto-seeded clusters were

A one-shot 2026-05-21 pass (`_seed_coci_unified_courses.py`) tried to merge
M-IDs that are spelling/word-order/abbreviation *variants* of the same course
("Intro to Psychology" == "Introduction to Psychology"). Its grouping key:
lowercase → strip punctuation → drop filler words → **sort the remaining
tokens** → join.

**The defect:** sorting tokens collapses distinct course *levels*. "Algebra 1:
Part 2" and "Algebra 2: Part 1" both sort to `1 2 algebra part` → wrongly merged
into one cluster. Confirmed empirically. The seed's own header claims "LEVEL
words/numbers are PRESERVED so course levels never collapse" — true for
"I"/"II" in trailing position, but token-sort defeats it for mid-title numbers
like "Part 1"/"Part 2".

## Why dissolution was safe (traced every consumer)

1. **Members already double-emitted.** Cluster members are singleton M-IDs that
   the standalone-row loop emits regardless of cluster membership (it only skips
   `merge_into`/`merge_members`, which are curation-sourced — never the
   `UC-XXXXX` member lists). So dissolving removed a *duplicate* grouping, not
   the underlying rows. Verified post-regen: MATH M10AC/M10AD, FIRE M10AR/M10AS,
   etc. all present as Stand-Alone.
2. **Zero articulations** reference any cluster (`course_id`/`identity_system`
   are all M-ID or C-ID). No payoff-layer linkage lost.
3. **Members file / xlsx / details** all derive cluster content from members →
   singletons cover them.
4. **Suggested-merges worklist is the safety net.** The dissolved cross-college
   members resurface as `singleton_groups` (1,350 after regen) for proper,
   level-safe, curator-confirmed review.
5. **Client + generator handle empty gracefully** — every `for … in clusters`
   loop no-ops; Kind/Source filters return empty.

## The migration discovery (the session's measure-first win)

The plan said "migrate the 9 curated clusters to per-member merges." Measuring
the actual curation state revealed **16 of the 17 per-member merges already
existed** — Sam had used the worklist, which writes per-member `merge_into`. The
9 `UC-XXXXX`-keyed merges were **redundant duplicates** riding alongside. So the
migration shrank to:

- **Add 1** missing per-member merge: `PHYS M11WB → PHYS M1265` (UC-00527 had
  PHYS M11WA per-member but not its sibling).
- **Delete the 9** redundant cluster-key rows (explicit IDs, never the
  `value`-side `UC-CUR-*`).

Applied atomically in one Supabase transaction (composite PK `(course_id,
field)`), mirrored into `coci_curation.json` (48 → 40 entries) to match what the
next daily `_apply_curation.py` sync produces.

**Side-benefit:** cleared all 9 `cluster_member_unresolved` auditor findings —
they fired *because* the redundant cluster-key merges added unresolvable
`UC-XXXXX` ids to each target's member set. Honest data → quieter auditor.

## Lessons

- **Measure the curation state before "migrating" it.** The redundancy
  (16/17 already done) meant the risky-sounding migration was a 1-insert /
  9-delete operation. Counting first turned a feared bulk-rewrite into a
  surgical edit.
- **An auto-seeded layer can have curator decisions riding on it.** The 9
  curated clusters were the trap: dissolving naively would have orphaned
  `merge_into` decisions. Always grep curation/articulation/index pointers INTO
  a layer before deleting it. (Generalized in the KB note.)
- **Verify in isolation with the `UC_OUT_DIR` test seam.** `export_unified_courses()`
  to `/tmp` proved the dissolved state (10 Cluster rows, 0 UC-0, members intact)
  without clobbering the daily-run-owned production files.
- **Two mechanisms shared one label.** "Cluster" meant both the auto-seeds AND
  curator merge targets. Naming-overload like that hides the real population —
  the auditor only ever saw the 10 curator clusters; the 1,376 auto-seeds were
  invisible to it. Disambiguate before "eliminating a category."

## The relabel (Cluster category fully retired — same session)

Sam's call after the dissolution: "no more clusters :)". The `merge_members`
emission used to slap `kind/id_system: "Cluster"` on every merge target — which
**overrode a real M-ID's identity** just because members were folded in. That
was the actual mislabel. The fix, across three layers:

- **Generator** (`excel_to_dashboard.py`): new `_target_identity(tgt)` →
  native (`M-ID`/`C-ID`/`CCN-ID`, `kind:"Course"`) when the target resolves to a
  real identity, else `("Unified","Unified")` for a synthetic `UC-CUR-*`. Wired
  into the merge emission; `sys_order` + the two suggested-merge anchor filters
  updated `"Cluster"` → `"Unified"`.
- **Client** (`unified_courses.js`): Kind filter, Source/QS vocab, and the
  triage label all `"Cluster"` → `"Unified"`; `doConsolidate()` mirrors the
  generator (synthetic live-merge → "Unified", merge-into-existing keeps native).
- **Auditor** (`kb/_row_audit.py`): merge-target cards `row_kind/id_system` →
  `"Unified"`; report + scope strings updated. **Tag keys stay `cluster_*`** —
  internal stable identifiers (like a column name); their human labels read
  "Unified". The client matches the audit overlay by id, so the relabel is safe.

**Lesson — one label, two mechanisms (again).** "Cluster" conflated (a) the
auto-seeds and (b) merge-target relabeling. Killing the auto-seeds left the
*second* mechanism still minting "Cluster". Fully retiring a category name means
finding every *producer*, not just the obvious data source. Verified: 0 `Cluster`
in `unified_courses_data.js`, the auditor, and `latest.json`.

**Lesson — a synthetic identity needs a home label.** Merge targets split into
"has a native identity" (revert to it) vs "synthetic, curator-minted" (`UC-CUR-*`).
The first was mislabeled; the second genuinely needed a name → "Unified". Don't
blanket-relabel; distinguish the two.

## Roadmap / next steps

1. **Continue camping on the crosswalk** (Sam's stated intent): the
   Suggested-merges worklist (`singleton_groups`, 1,350 candidates; 214
   same-college flagged) is now the front door for variant unification —
   curator-confirmed, level-safe. Confirmed singleton-only merges mint
   `UC-CUR-*` "Unified" courses.
2. If clusters never come back, consider removing the now-dead
   `coci_unified_courses.json` load + emission loops from the generator (kept
   for now as graceful no-ops + provenance).
3. Auditor tag keys are still `cluster_*` (internal). A future rename to
   `unified_*` would ripple to the client predicate, CLAUDE.md, and historical
   audit files — low value, deferred.

---

## Session 37 (2026-06-09) — CCR impact columns + the Foreign-Language SUBJ4 re-mint

Sam: "get the CCR cleaner where there are obvious opportunities." Two moves, the
first surfacing the second. **3 PRs** (#326 impact columns, #327 FL scope, #328 FL apply).

### What's new
- **#326 — Eligible-units + Students impact columns + 🎯 Cleanup-impact preset.**
  The CCR can now be ranked by **real student-credit payoff** (the CPL currency), not
  just the auditor's `members × (1−trust)` structural leverage. `export_unified_courses`
  rolls the CER's per-credential eligible/students up to each course via the
  articulation crosswalk. Pattern distilled →
  `methodology-rank-cleanup-by-downstream-impact.md`.
- **#327/#328 — Foreign-Language SUBJ4 re-mint (Rule 7).** The impact lens pointed
  straight at the Spanish/FL pile-up (`SPAN 100`/`FLNG M1019`/`FLNG M1272` "Elementary
  Spanish I", ~12k eligible each, blank discipline). Root cause: MQ has only "Foreign
  Languages", so the SUBJ4 invariant forced all languages into one `FLNG`. Split per
  language (`FLSP`/`FLFR`/…), discipline unchanged. Pattern →
  `methodology-umbrella-discipline-subj4-split.md`.

### Learnings
- **Rank cleanup by downstream impact, not structural leverage** — and the impact is
  one join away from data you already bake (CER per-credential eligible/students ⨝
  articulations). ~700 of 16k rows light up: exactly the cleanup-worth concentration.
- **The auditor's leverage metric and the impact metric disagree, productively.**
  "Medical Terminology" is the structural #1 (85 colleges) but the Spanish cluster
  carries far more eligible credit. Keep both; the target is the intersection.
- **An MQ umbrella discipline needs a per-subject SUBJ4 split.** "Foreign Languages"
  is coarser than the subject a student enrolls in → SUBJ4 = subject, discipline = MQ
  category. Re-prefix keeps the already-unique number (collision-free, no
  re-sequence); the CCC TOP-11xx taxonomy is self-describing (`1105=Spanish`) → 99.5%
  auto-classified; the auditor needs an `UMBRELLA_DISCIPLINES` exemption so
  `subject_collision_signal` stays honestly 0.
- **A new public student-count surface needs a PII guard** — the CCR `st` column got
  one in `pii_guard.test.js` (sum of `≥5` values → never 1–4 by construction, guarded
  anyway).

### Current state
CCR impact columns live (#326). FL `FLNG` → 17 per-language SUBJ4s in the KB (#328);
the **next daily cron** regenerates `unified_courses_*.js` with the FL** ids, so the
impact columns + Suggested-merges become per-language-coherent. `subject_collision_signal`
0 (umbrella exemption). Alias receipt `kb/fl_subj4_out/2026-06-09/`.

### Next concrete step
After the cron lands the FL** ids: **drive the Spanish/FL consolidation** — all `FLSP`
rows now consolidate cleanly via Suggested-merges, and the blank FL disciplines are a
high-impact discipline-fill (they all roll up to "Foreign Languages"). Then look for
the next umbrella (none else identified yet).

---

## 2026-06-10 — Session 38 ("Trusting Newton"): CCR refinements + the first fan-in convergences (#333/#334/#335)

### What happened
- **#333** shipped Sam's 5-item CCR refinement set: canonical-SUBJ4 Subject
  column/filter/sort, fit-on-open column caps, sortable member tables, the surfaced
  "⚇ Merge" pill, and units-as-a-range (`umin`/`umax` baked; "lo–hi" + >2.0 ⚠).
  3 of 5 arrived as a tested patch from a KB-scoped consult; verified against the
  live tree before applying (every hunk reconciled), and #3 had to be reworked —
  bare-`<td>` `max-width` is ignored under `table-layout:auto` (the CER-#307 trap).
- **#334** applied the **Kinesiology ⟵ Physical Education convergence** — the first
  **fan-in** (two MQ names, one converging field → canonical + alternate-name alias).
- **#335** applied **Drama/Theater Arts ⟵ Theater Arts** (fan-in #2), extended both
  convergences to the **singleton layer** (the gap that kept dead names in the CSR),
  and refreshed the auditor + CSR.

### Learnings
- **Fan-in is the mirror of the umbrella split, and the data tells you which one you
  have.** A discipline over many distinct *enrollment subjects* (Foreign Languages)
  fans OUT (SUBJ4 per subject). Two discipline *names* over one field (KIN/PE,
  Drama/Theater) fan IN (canonical name + `discipline_aliases.json`). Modeling KIN/PE
  as a "PE child under KIN" would have *perpetuated* the split the field is resolving.
- **Never key a re-mint on `subject_4letter` — key on discipline.** `PHYS` was
  overloaded (745 PE + 87 Physics); a subject-keyed re-key would have re-keyed
  physics courses. Bonus: vacating PE from `PHYS` made the code *mean* Physics — the
  collision fixed itself without the PHED rename Sam floated.
- **The M-ID band cap is a real design force.** Merged Kinesiology (~1,140 raw
  credit) exceeded the 1,000/band space; it only fits because the 88 true duplicates
  merge. A capacity check belongs in every convergence dry-run (and KINE now sits at
  987/999 — the next growth event forces a numbering decision).
- **For an irreversible apply, be stricter than the worklist's family key.** The
  canonical `_fam_key` drops single-letter "V" as a section letter → "Swimming V"
  folds into "Swimming I". Fine for a curator-confirmed queue; not for an apply.
  Roman-convert before the letter-drop; verify 0 mismatched-family merges.
- **A convergence isn't done at the parent layer.** ~56k singletons carry the same
  discipline names + SUBJ4-prefixed ids and feed the CSR seed/CCR/worklist — the
  first applies left 2,590 PE + 1,187 Theater Arts stand-alones behind, which is
  exactly why the CSR kept dead rows. Converge both layers in one PR window.
- **Sanctioned multi-SUBJ4 spans go in `UMBRELLA_DISCIPLINES`.** Kinesiology now
  deliberately spans KINE+ATHL; without the exemption `subject_collision_signal`
  gained exactly +299 (the ATHL parents). With it: back to the 1,076 baseline.
- **Diff hygiene for KB mutations:** serialize with the file's native indent and
  rebuild dicts in original key order — the first apply produced a 1.5M-line diff
  (whole-file reshuffle); the fix got it to ~23k (proportional to the real change).

### Current state
Both convergences live on `main` across both layers: 0 "Physical Education" /
0 "Theater Arts" anywhere; Kinesiology 1,308 parents + 3,960 singletons (KINE+ATHL),
Drama/Theater Arts 316 + 1,379 (THEA), PEDS 41 + 139 (new MQ name cleaned of the
stray `53414`). Aliases registered; receipts in `kb/kin_pe_out/`,
`kb/drama_theater_out/`, `kb/convergence_singletons_out/`. Auditor at 16,227 cards,
`subject_collision_signal` 1,076 (baseline). CSR 146 disciplines with THEA/PEDS
pinned. CCR #333 features live; units-ranges populate on the next cron.

### Next concrete step
**Verify the next daily cron**: CCR shows units-ranges + KINE/ATHL/PEDS/THEA rows
(no PHYS-PE, no DRAM, no dead disciplines), then drive the KINE dedup via
Suggested-merges. Next fan-in candidates, measured: CIS↔CS↔Office-Tech (39/29/26
shared families — partly real distinctions, needs judgment), Health↔Health Care
Ancillaries (16), Commercial Music↔Music (12).

---

## 2026-06-10 — Session 39: cron verify, the Supabase-mirror regression, the twin-merge payoff

### What happened
- **Verified the first cron after the convergences (handoff priority 1).** Everything
  #333/#334/#335 promised landed: units-ranges (7,103 rows), KINE/ATHL/PEDS/THEA
  populated, dead names 0 in both layers, PHYS = Physics-only, audit chips 1:1,
  the worklist surfacing KINE 178+107 and FLSP 29+13 dedup groups.
- **#337 — one real defect: the Supabase-mirror regression.** The daily sync rebuilds
  `kb/coci_curation.json` FROM Supabase `kb_curation`; the convergence applies had
  re-pointed only the local overlay. The cron faithfully resurrected `PHYS M1265` as a
  ghost "Unified" row with discipline "Physical Education" (+ `cluster_member_unresolved`
  in the auditor — it caught it too). Fixed at the source: 6 live `kb_curation` UPDATEs
  (re-key 5 course_ids, re-point 4 `merge_into` values, discipline → Kinesiology),
  reviewer stamps preserved; cross-checked the whole table against ALL 77,726 aliases
  from every applied re-mint — exactly those 5 were stale. Plus: both orphaned
  `_CANON_SUBJ4` pins deleted, the `M-ID THEA 100` anchor renamed to the canonical
  discipline, and the CSR "also: Physical Education" alternate-name chip shipped
  (`tests/csr_alias_chip.test.js`, 8 checks).
- **The KINE/FLSP strict twin-merge (Sam-authorized).** 70 groups / 74 losers folded
  (16,217 → 16,143 parents) under the strictest key — discipline + band + strict fam +
  credit_status + typical_units, winner = most corroborated. The motivating Spanish
  pile-up ("Elementary Spanish I"/"Elementary Spanish"/"Elementary Spanish 1") is now
  one 59-college identity. 6 V-gates + independent re-verify green; receipt
  `kb/twin_merge_out/2026-06-10/`.
- **Fan-in candidates measured — mostly NOT fan-ins.** CIS↔CS 10/44, Health↔HCA 3/9,
  CommMusic↔Music 0/2 (vs KIN/PE's 93) and the big pairs already share one SUBJ4. Sam
  chose to scope CIS↔CS anyway → `docs/cis_cs_convergence_scope.md` (recommendation:
  Option B, a guarded CISC twin-merge — not a name fold).

### Learnings
- **A re-mint that re-points curation MUST write Supabase, not just the synced
  mirror.** `kb/coci_curation.json` is a *rebuild target*, not a store — any local-only
  edit silently reverts on the next cron and resurrects dead ids. Now fan-in guard 6
  (`methodology-fan-in-discipline-convergence.md`); the twin-merge apply prints the
  exact tuples needing the mirror.
- **Verify a re-mint against the regenerated artifacts, not just the KB files.** The
  V-gates passed in Session 38 and the KB was correct — the regression only existed
  in the *next day's* cron output. "Cron landed clean" is a separate verification
  with its own checklist (the handoff's priority-1 list was exactly right).
- **The strict twin key is domain-sensitive: single-letter tokens.** `R Programming` ↔
  `C# Programming` collide (R / C#→c dropped as section letters) — fine for KINE/FLSP
  (audited: only possessive-'s artifacts), wrong for computing. Trap 4 in the ordinal-
  rule note; a blocking guard for any CISC extension.
- **"Shared title-family count" requires the right title field.** First measurement
  read `unified_title`/`title` and got 0 everywhere — the KB field is `common_title`.
  Empty-input zero looks exactly like true zero: sanity-check a metric against a known
  case (KIN/PE ≈ 93) before believing it.
- **Measure-first killed two of three "next fan-ins" honestly.** The data
  distinguished KIN/PE (one field, two SUBJ4 spaces, 93 families) from CIS/CS (two
  fields, one shared SUBJ4 space, 10 families) — the fan-in test generalizes.

### Current state
KB at 16,143 minted parents; auditor 16,153 cards, `subject_collision_signal` at the
1,076 baseline, `cluster_member_unresolved` 0. Supabase `kb_curation` fully aligned
with the post-convergence ids. CSR re-seeded (146 disciplines) + alternate-name chips
live. The CCR/EACR/CER artifacts pick up the 74 merges on the next cron.

### Next concrete step
Verify the next cron folds the merges into `unified_courses_*.js` (Elementary
Spanish I @ 59 colleges; ghost `PHYS M1265` gone), then Sam's §5 sign-off on
`docs/cis_cs_convergence_scope.md` decides the CISC pass. The worklist queues
(KINE 178+107, FLSP 29+13 minus the 74 merged) remain the curator lane.
