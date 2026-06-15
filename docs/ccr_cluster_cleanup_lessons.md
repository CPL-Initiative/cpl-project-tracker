---
title: CCR Cluster Cleanup — Lessons & State
date: 2026-05-30
last_updated: 2026-06-15  # Session 56
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

---

## 2026-06-10 (evening) — Session 39 cont.: the live-curation loop (#339–#342)

Sam curated live against the freshly-regenerated CCR; four PRs shipped in direct
response to what he hit, each within the hour.

### What happened
- **#339 — the Weight Training merge incident.** Sam merged 15 weight-training
  courses; the dialog's blank-default target minted a synthetic UC-CUR id, the
  merged row carried none of the members' st/eu (vanished from the Students sort),
  and the merge auto-stamped Verified. Fixes: target-explicit dialog (defaults to
  the opened row; button states the action), st/eu carry (max live; true union in
  the generator via merge_members), and **merge ≠ verify** — merged rows stay
  Generated until the Verify affordance records `validated_at/_by` (the CSR
  two-tier pattern; `_apply_curation.py` now syncs those columns). His merge was
  re-pointed into KINE M1015 ("Weight Training", 4,823 students intact).
- **#340 — the last UC-CUR retired.** Sam asked why ids look like
  `UC-CUR-MPG029OM`: UC = Unified Course, CUR = curator-minted, and the suffix is
  a BASE-36 TIMESTAMP (decodes to the click moment) — a deliberately off-scheme
  placeholder because a browser can't safely allocate `(SUBJ4, band)` numbers.
  The one existing row re-pointed into AUTB M1002 (its title was literally the
  anchor's own).
- **#341 — official ids as merge targets (Sam's 5-item review).** The principle
  encoded everywhere: *mint an M-ID only when no aligned C-ID/CCN exists;
  otherwise the official id IS the common course reference.* Worklist groups now
  lead with C-ID/CCN anchors (61 groups); the dialog defaults to the official id
  (CCN > C-ID > M-ID); Confirm writes ONLY merge pointers on an official target.
  Plus: Subject(s) moved beside Discipline; the `nowrap` Flags column (the real
  horizontal-scroll culprit) now wraps in a width-capped block; anchor rows'
  hardcoded `credit: None` fixed (302 anchors → 1 honestly blank). Data: 7
  Spanish-1 variants → SPAN 100, 7 Spanish-2 → SPAN 110.
- **#342 — heritage speakers → SPAN 220/230 + the descriptor catalog as target
  authority.** The honors recon first: C-ID has ZERO H-suffixed descriptors
  (honors bundle into the same descriptor by design — the honors members under
  SPAN 100 are the colleges' own official COCI mappings); CCN honors ARE separate
  (23 listings) and already fully distinct in the pipeline. Then the folds: 5
  variants → SPAN 220, 3 → SPAN 230. SPAN 220/230 had no CCR row → the generator
  now resolves merge targets from `kb/reference/cid_descriptors.json` (all 495),
  with a member-aggregated discipline fallback.

### Learnings
- **A blank default in a destructive-ish dialog is a decision the curator didn't
  make.** The target selector now always states what Confirm will do.
- **Merge ≠ verify needs a signal the merge itself doesn't write.** Discipline
  curation = explicit verify for existing targets (the dialog stopped writing it
  on them); `validated_at` = the explicit verify for everything else.
- **The auditor's docstring claimed C-ID targets were skipped — no code branch
  existed.** When official ids became legal targets, the claim would have become
  14 false orphans. Read the code, not the comment, when a rule's scope changes.
- **Official-id precedence belongs in every surface that picks a target**:
  worklist ordering, dialog default, Confirm pick — one principle, three sites.
- **The descriptor catalog is the natural completion**: an official id is a valid
  fold target whether or not it has a row yet.

### State
CCR: Spanish 1/2/heritage consolidated under SPAN 100/110/220/230 (8/8/6/4
members), SPAN 200/210 queued in the worklist; KINE M1015 + AUTB M1002 merged
rows awaiting Sam's Verify; 0 UC-CUR ids; 0 orphans; anchors carry Credit; the
Flags column wraps; Subject(s) sits beside Discipline. All live except the baked
data, which lands on the next cron.

## Session 40 — the severed evidence index (2026-06-10)

Sam's screenshot question — *"SPAN 200 should include all the Intermediate
Spanish variants; I thought our rules checked title + description alignment"* —
led to a root cause, not a missing feature. Full analysis + recommendations:
[`official_id_fold_scope.md`](official_id_fold_scope.md); reproducible numbers:
`kb/_analyze_official_fold_evidence.py`.

### Learnings
- **The automatic official-ID fold (Phase A/B) keys on `kb/promotions.json`,
  and four re-keys since 2026-05-22 never re-keyed it.** `_row_official()` does
  exact-id lookup; 1,111 of 2,083 evidence records (53%) point at dead ids.
  Only 174 CCR rows carry `match` badges today; 1,386 are entitled. The whole
  FLSP family was severed twice over (canonical-SUBJ4 fold, then FL split).
- **Promotions evidence is the 5th artifact class that must move in every
  re-key** (with memberships, articulations, curation, Supabase). Playbook gap.
- **Evidence beats lexical similarity in both directions**: it folds what
  titles can't ("Spanish 3" → SPAN 200 ×6 witnesses) and it *blocks* what
  titles would wrongly fold (bare "Intermediate Spanish" = SPAN 200 ×8 vs
  SPAN 210 ×6 — two courses wearing one title; the level-safe conservatism was
  right about it).
- **Strict unanimity is too strict once evidence is restored**: FLSP M1352 is
  24× SPAN 210 vs 1× SPAN 200 — "conflict" under today's rule. Plurality ≥80%
  with ≥2 witnesses reproduces 11 of Sam's 15 evidence-bearing hand-merges and
  contradicts none.
- **Restoring keys without touching the worklist's `cid_conflict` exclusion
  would HIDE currently-queued groups** (M1352's SPAN 210 group) — the re-key,
  the plurality rule, and the evidence-lane surfacing must ship together.

### State
Scope doc committed; build (R1 re-key + R2 plurality + R3 evidence lane, then
R4 singletons) gated on Sam's §7 sign-off. His queued SPAN 200/210 worklist
confirms remain valid and compatible meanwhile.

### Session 40 (cont.) — the build (#345 + the anchor retirement)

Sam approved all four §7 gates same-day → built + merged:

- **R1 applied**: `kb/_rekey_promotions.py` — 2,083 → 2,070 keys (1,111
  re-keyed, 13 twin-merge folds, 31 flagged `_unresolved`), 9,826 witnesses
  conserved across 446 targets, V1–V4 + idempotency green. Receipt
  `kb/promotions_rekey_out/2026-06-11/`. (V1 caught a real authoring bug on
  the first run — a shallow copy let the fold mutate the source totals.
  Conservation gates work.)
- **R2 built with one flagged deviation**: unanimous evidence folds at ANY
  witness count (today's behavior — the literal ≥2 spec would have UNFOLDED
  174 established rows / 795 member courses, measured); the ≥80%+≥2 bar
  applies where dissent exists (80% over a dissenter implies ≥5 witnesses).
  `match.evidence` carries the distribution; badges show it on hover.
- **R3**: `evidence_groups` in the suggestions payload + a 🧾 worklist
  section; contested members (`x:1`) start unchecked. 151 groups.
- **The jsdom test caught a real #342 gap**: `doConsolidate` didn't
  recognize a ROW-LESS official target (descriptor-catalog merge) → wrote
  `unified_title` on it. Fixed via the chosen-tuple `id_system`.
- **First regen (live-on-merge)**: Phase B 455 → **1,155 M-IDs folded**
  (235 official rows + 45 anchor folds; CCR 16,080 → 15,489). SPAN 200 =
  anchor + M1342/M1043/M1362/M1246; SPAN 210 = anchor + M1352/M1045/M1237/
  M1337/M1036; FLSP M1379 held contested. Suite 21/21.
- **Anchor retirement (gate 5)**: legacy `M-ID SPAN 104/106/108` ("Spanish
  1/2/3") removed from the firewalled `common_courses.json`, their 9 RCCD
  crosswalk member rows re-pointed to SPAN 100/110/200. Receipt:
  `archive/common_courses_mid_span_anchors_2026-06-11_retired.json`.
- Playbooks institutionalized: fan-in guard 7 + the re-mint artifact table +
  Rule 7's checklist line all carry "re-key promotions.json".

### State (post-build)
Carryover: **R4 singletons** (653 evidence-bearing stand-alones — approved as
a follow-up PR); the 31 `_unresolved` promotions keys; watch the next cron
(should be a no-op on these artifacts since the regen shipped live); Sam's
curator queue now includes the 151-group evidence lane (FLSP M1379 is the
marquee contested row).

## Session 41 (2026-06-11) — the witness-kinship gate: half the restored folds were chimera receipts

Sam's screenshot: `AUTO 120 X` rendered as "Advanced Automotive Eng…" with
**transmission** member courses, `AUTO 150 X` as "Advanced Engine Manage…"
with **brake** members. His read — wrong members under an engine C-ID — was
inverted but pointing at the right rot: the **members were correct** (the
colleges' own COCI claims; AUTO 120 X *is* "Automatic Transmissions and
Transaxles") and the **folded M-IDs + the row title were wrong**.

### Root cause — a departure receipt is not kinship evidence

`kb/promotions.json` receipts record members that LEFT their M-ID family for
an official id at the 2026-05-22 re-mint. `_row_official()` consumed each
receipt as evidence that the REMNANT belongs under that official id. Sound
when the old family was title-coherent (the Spanish set); wrong when the old
family was a lossy `(subject, number)` chimera (old `M-ID AUTO 162` etc.) —
the witness (MiraCosta's transmissions course) was never the same course as
the remnant (Mendocino's engine-performance course). The 2026-05-29 over-merge
splits then carved those chimera families down to coherent 2-member remnants,
but the receipts stayed keyed to the surviving id, still describing the
13–20-member pre-split family. **An id that survives a split keeps a receipt
that no longer describes it** — R1's re-key handled moved keys; it could not
know a surviving key's family had shrunk.

Witness COUNTS cannot catch this class: "APPLIED ANTHROPOLOGY" carried **40
unanimous witnesses** for ANTH 120 — all 40 titled "Cultural Anthropology",
all from the dead chimera family. Thresholds saw a slam dunk.

### The fix — the witness-kinship gate (measured first)

A witness is **kin-valid** iff the remnant's title matches the witness's OWN
claimant-course title OR the official catalog title (token-set Jaccard ≥ 0.5,
level-safe normalization). `_pick` runs on kin-valid counts only; the full raw
distribution stays on `match.evidence` (+ a `kin` map when they differ) so
nothing is silently hidden.

- The **witness branch** preserves evidence-over-lexical: "Spanish 3" → SPAN
  200 still folds (its witnesses are titled "Spanish 3").
- The **official branch** folds remnants that ARE the official course by name
  even when witness resolution hiccups.
- Measured (`kb/_analyze_witness_kinship.py`): blocks **781 of 1,635**
  evidence edges (450 at Jaccard 0.0 — pure chimeras), **unfolds 565 of the
  1,155** Session-40 folds, keeps **all seven** SPAN folds, and *unlocks new
  good folds* — SOCI M1023 "Crime and Society" was stuck at a 75% "conflict"
  because one chimera AJ 110 witness diluted its 3 real SOCI 160 witnesses;
  gate filters the noise → unanimous → folds.
- Borderline band (J 0.3–0.5, 61 edges) eyeballed: overwhelmingly correct
  blocks ("Intro to Counseling"→MATH 110 *Statistics*, "Beginning Piano"→
  MUS 180 *Beginning Band*); the few semantic synonyms ("Multivariate
  Calculus"→"Multivariable Calculus") land in the evidence lane for a
  one-click curator confirm — exactly the auto-vs-curate split Sam asked for.

### What shipped with it (the screenshot's other wounds)

- **Synthesized official rows are titled by the official catalog** (C-ID
  descriptor / CCN list), never by a folded remnant; remnant titles stay as
  `title_variants`.
- **Claims-only official rows** (307): an official id with real COCI
  claimants gets a CCR row even with zero folds — without this, unfolding
  AUTO 120 X would have made its 3 correct claimant courses invisible again.
  Bound: in-catalog OR ≥2 claimant colleges.
- **Official-row stats now describe the DISPLAYED members** (claims ∪ folded
  leaves): members count, modal units + 4–6 range (was "0–6 ⚠" off invisible
  bogus folds), modal TOP, credit (modal of folded leaves, default Credit —
  C-ID/CCN territory is credit by definition). The member table itself now
  unions folded leaves too (SPAN 200 finally *shows* the Intermediate-Spanish
  family it absorbed).
- **Evidence lane goes kin-aware**: kin-failed witnesses ship `tm` (+ `x:1`
  pre-unchecked); groups rank by kin-valid witnesses so the 187 all-stale
  groups sink to the bottom under a "⚠ every witness title-mismatched"
  banner. Rows with gated evidence get a "🧾 stale evidence" badge.
- **UI**: Title column wraps at its 24ch cap (no more "…"); member-table
  headers white on the navy band (the static sheet left them slate-on-navy —
  a `.uc-table th` background leak under equal specificity).

### Numbers (regen, live-on-merge)

Phase B 1,155 → **552 M-IDs folded** (125 synthesized + 21 anchor folds);
+604 unfolded M-IDs return as rows; +307 claims-only officials (C-ID rows 259
→ 456); CCR 15,489 → 16,289; evidence lane 151 → 310 groups (187 score-0,
ranked last); only 2 rows vanish outright (both pure chimera constructs, e.g.
`AG-EH 130 X` titled "Cannabis Careers"); 0 curator-verified rows disturbed.
Tests: `tests/uc_kinship_gate.test.js` + suite 22/22.

### Lessons

- **A receipt is evidence about the family that existed when it was written.**
  Re-keying moves the key; it cannot move the *meaning*. Any rule consuming
  historical receipts needs a present-tense validity check (here: kinship).
- **Unanimity over stale evidence is still stale.** 40 witnesses, 0 signal.
- **Make stats describe what the row displays.** The "0–6 ⚠" chip was
  computed over a different member set than the table below it — every such
  divergence is a curator-trust leak.
- The gate runs in both directions: blocks bad folds AND un-poisons good ones
  (the SOCI M1023 conflict was manufactured by one chimera witness).

### R4 shipped same day (#348)

Of the 653 evidence-bearing stand-alones (the Session-40 approved follow-up):
**301 auto-fold** under their official rows (297 kin-valid unanimous + 4 at
the ≥80%/≥2 bar; `sfold` on the row, counted in the ⛓ chip), **12 contested**
→ evidence-lane stand-alone (`g:1`) entries pre-unchecked, **340
all-witness-blocked** stale receipts deliberately NOT laned — ~340 more noise
groups would have swamped the curator queue; the analyzer keeps them
findable. The SPAN intermediate singles landed exactly per the scope's §4
table (Level I → SPAN 200; Level II/IV/Advanced Intermediate → SPAN 210 — the
colleges' own claims). Mid-PR, the 06-11 backstop cron pushed a daily commit
→ `mergeable_state: dirty`; resolved by rebuilding the branch from the new
main and regenerating from the cron-fresh inputs rather than picking sides in
generated-artifact conflicts (the only sane resolution for generated files).

One number worth keeping: the day's net is **852 identities** (551 chimera
un-folds correcting Session 40 + 301 singleton folds extending it) moved to
their evidence-correct positions by ONE gate, measured twice before each
ship.

---

## Session 42 — the slot-fix: half the evidence index was keyed to slot-mates (2026-06-11)

Started as the handoff's bounded item 3 ("the 31 `_unresolved` promotions
keys") and unraveled the whole R1 re-key. Three compounding discoveries:

1. **The over-merge alias map was never applied.** R1's chain included
   `kb/overmerge_out/2026-05-29/alias_map.json` as an "applied re-mint" — but
   that plan is STAGED, gated on Sam's dispatch, never dispatched (Session 18,
   roadmap archive). 1,259 of its 1,299 "retired" old ids are still live. The
   31 unresolved keys all resolved through its phantom split ids.
2. **`kb/subj4_apply/alias_map.json` carries a stale "DRY-RUN" `_status`** —
   it is the frozen dry-run plan the apply consumed VERBATIM (report.md:
   "APPLIED — kb files mutated in place"; 65,311 moves confirmed by the
   per-row `_subj4_remint_from` stamps). Its `fate: "no_change"` entries mean
   *SUBJ4* unchanged — the **number still re-sequenced** ("ECON M1001" →
   "ECON M1005"), so the catalog-wide apply was a **simultaneous permutation
   with massive slot reuse** (19,353 retired slots re-occupied by different
   rows in the same instant).
3. **The R1 resolver iterated the maps "until stable" and short-circuited
   on live keys** — both wrong under slot reuse. Iteration follows
   *slot-occupancy chains* across unrelated rows ("AGR M1001" telescoped
   ECON M1001→M1005→…→M1035, nine fictional hops); the liveness shortcut
   pinned a record to a slot whose family had moved away ("ANTH M1023"
   stayed live while its family moved to "ANTH M1035").

**Measured damage (R1 as shipped): 1,066 of 2,083 promotions records (51%)
mis-keyed** — 236 wrong/unresolved destinations + 830 false-"unchanged"
slot-pins. The Session-41 case study inverts poetically: "APPLIED
ANTHROPOLOGY's 40 stale ANTH 120 witnesses" were never stale — they were
*correct* evidence pinned to the slot-mate; the kinship gate rightly
protected the wrong row, and the right row (ANTH M1035 "Cultural
Anthropology") was missing its fold. The gate and the slot-fix compose:
re-key puts evidence on the right rows, the gate validates it there.

**The fix (`kb/_rekey_promotions.py` rebuilt + applied from the pre-R1
baseline):** chronological **single-step** resolution (each apply-confirmed
map looked up AT MOST once, never iterated, no liveness shortcut),
era-stamping (`_rekeyed_through`) so re-runs apply only newly-appended maps,
the over-merge plan excluded until dispatched, V5 stamp gate (every
resolution checked against `_subj4_remint_from` ground truth — 1,954 checked,
0 conflicts), abort guard on mixed-era inputs, and a resolver self-test every
run. Result: 1,972 re-keyed + 111 true-unchanged + **0 unresolved** + 14
genuine folds (the Spanish twins gained witnesses: SPAN M1064/M1104 etc. fold
into their FLSP winners). `kb/_analyze_official_fold_evidence.py` fixed in
lockstep; the subj4 map's `_status` corrected in place (original preserved).

**CCR effect (regenerated, tests 23/23):** Phase B 1,155→1,178 folded M-IDs
(239 official rows); claims-only officials 307→193 (114 gained real folds);
R4 stand-alone folds 301→**610**; evidence lane 310→**158 groups, all
kin-backed** (the 187 phantom "stale" groups dissolved — they were mis-keyed,
not stale); stand-alone payload 55,830→55,521. Marquee: ANTH 120 folds grew
2→7 (M1035 home); AUTO 120 X/150 X keep descriptor titles AND gain real kin
folds (M1065/M1067 transmissions; M1075/76/79 brakes — 21 and 51 member rows,
all on-topic); SPAN 200/210 rosters byte-identical; 5 chimera rows now carry
no evidence at all. One curated row (AGRI M1002 "Agricultural Accounting",
cross-listed Business) folded under C-ID AG-AB 128 "Agricultural Accounting"
— kin-exact, precedented (ARTS M1159), curation rides the overlay.

**Also shipped:** `family_groups` sort gains a sig tiebreak (same-score pairs
churned the artifact daily); the CCR **era guard** (`unified_courses.js`) —
lazy files now fetch with `?v=<era>` and a >15-min stamp mismatch surfaces a
one-time reload banner (`tests/uc_era_guard.test.js`). That guard is the
likely answer to Sam's "non-argumentation courses in COMM M1006": every
committed surface of COMM M1006 (members at every revision, descriptions,
xlsx, both 06-10/06-11 deploys) is argumentation-pure — but a tab held open
across a deploy joins old row ids against a new lazy file, and under slot
reuse that renders a different family's members beneath a row. Durable note:
[`docs/kb-notes/methodology-alias-map-resolution-semantics.md`](kb-notes/methodology-alias-map-resolution-semantics.md).

**Patterns:**
- **A receipt's `_status` is itself a receipt — restamp it at apply time.**
  The stale DRY-RUN header on an applied map misled both R1's author and this
  session's first hour. (Now a playbook step.)
- **An alias map is a permutation, not a digraph.** Slot reuse makes
  iteration follow occupancy history, not the row. Resolve single-step,
  chronologically, era-stamped — and validate against per-row provenance
  stamps, which are the only artifact that travels WITH the row.
- **"The key is live" proves nothing about the family** — same lesson as the
  kinship gate, one layer down: liveness shortcuts are slot-pins.
- **Validate against a family the bug can't reach and you'll ship the bug.**
  Session 40/41 validated on Spanish — FLNG/FLSP namespaces postdate the
  subj4 permutation, so they were immune to telescoping by construction.

## Session 43 — Bruh Starlord: the off-pane-columns bug + cron no-op verification (2026-06-11)

A verification-and-troubleshooting session: no identity work, four small PRs
(#370–#373, all merged on green), and one genuinely instructive front-end bug.

**Slotfix cron no-op — VERIFIED.** Three daily runs followed #357 (17:17 /
17:48 / 18:35 UTC). Timestamp-normalized MD5s over every artifact payload:
`unified_courses_{data,suggestions,standalone,members,member_desc}.js`
byte-stable across #357's committed regen and all three runs — the
`family_groups` sig tiebreak ended the daily churn; CER/statewide differ only
in their `generated_at` stamps. A `/tmp` regen (UC_OUT_DIR seam) reproduced
HEAD exactly (15,652 rows; eu 673 / st 452) — the generator is deterministic.
Caveat: stat-level `2 +-` diffs prove nothing on one-line-payload artifacts
(a whole-payload change and a stamp change look identical); normalize the
stamp and hash. Also: two stamp formats exist (`"generated_at": "…"` spaced
and `"generated_at":"…"` compact) — a regex that assumes one reports FALSE
churn. Residual: #365/#366 (the MATH router) landed after the last run; the
next cron is the first to exercise them (expect timestamp-only).

**The AJ "blank columns" bug (#372/#373).** Sam: AoJ rows render nothing
right of Discipline — headers included; later "most disciplines, but not Ag."
The diagnostic ladder, in order, with what each rung ruled out:
1. **Payload scan** — every row carries every field (not data).
2. **jsdom repro, real renderer + real rows + real audit/member payloads,
   driving the real dropdown** — 15/15 columns, 5/5 member columns, no
   errors (not the code, *at the DOM level*).
3. **Incognito repro** (Sam) — still broken (not an extension/cache).
4. **Console** (Sam) — no JS errors (the render never crashed).
5. **Elements inspector** (Sam) — all 15 `<th>`s present WITH text; the
   `#uc-table-wrap` carries Chrome's `scroll` badge. **The DOM was complete
   the whole time — it was a LAYOUT bug, the one category a jsdom repro
   structurally cannot see.**

Mechanism: under `table-layout: auto`, one wide cell inflates its column and
pushes the trailing columns past the right edge of the `overflow:auto` wrap.
The wrap is 70vh tall, so its horizontal scrollbar renders at the *bottom* —
effectively undiscoverable — and the columns simply look gone. Per-discipline
because each filtered row set computes its own column widths. The fix
(per the standing no-horizontal-scroll mandate): `table-layout: fixed` + an
explicit 15-col colgroup (+ a 5-col one on the member table), `min-width:
900px` keeping h-scroll as the narrow-screen safety net, and td
overflow-clipping. The clipping then caused its own lesson: a blanket
`td{overflow:hidden}` = ~7,500 paint-clip contexts (500 rows × 15) and Sam
felt it ("noticeably slower") — #373 scoped it to the 5 text-bearing columns.
**"Still a bit slow" at session end — WATCH; next levers: skip the
post-audit-load second render when nothing visible changed, tune the
colgroup, row virtualization as the heavyweight.** Durable note:
[`kb-notes/methodology-fixed-table-layout-off-pane-columns.md`](kb-notes/methodology-fixed-table-layout-off-pane-columns.md).

**Era-mix hardening (#370).** Triage also surfaced that Sam's tab held a
stale audit overlay (toolbar "14,228 flagged" vs 14,232 deployed): the audit
JSON was the one lazy fetch without the `?v=<era>` buster. Busted now;
deliberately NOT wired into the `_eraGuard` banner (the audit re-runs only on
cron regens, so a code-only artifact commit would false-trip it). Plus the
handoff's seam item: the eu/st impact join read the CER — an *input* — from
the OUT dir (a `/tmp` regen silently lost the columns), and
`_write_cpl_by_discipline_json` crashed on the seam dir's missing `kb/`.
Both fixed; a full seam run now completes clean.

**Also:** `.claude/settings.json` now pins sessions to `claude-fable-5[1m]`
(#371 — web `/model` picks are session-scoped and the picker strips `[1m]`;
upstream anthropics/claude-code#41078). The stop-hook "Unverified
noreply@github.com" nag after squash-merge + reset is the DOCUMENTED false
positive — refresh `~/.claude/stop-hook-git-check.sh` from
`scripts/stop-hook-git-check.sh`, never amend main's squash commits.

**Patterns that worked:**
- **Hash payloads with stamps normalized; never trust `--stat` on one-line
  artifacts.** And know both stamp formats.
- **Climb the diagnostic ladder one rung at a time** (data → DOM → incognito
  → console → inspector) and let each rung kill a hypothesis class. Sam's
  inspector screenshot was the decisive rung — ask for it sooner: a DOM-level
  repro passing while the user sees breakage = suspect LAYOUT immediately.
- **A jsdom suite cannot guard layout.** The new test pins the *defense*
  (fixed layout + colgroup present), not the layout itself — name that
  limitation in the test header.
- **Perf-check your own defense:** the overflow clip that fixed the layout
  cost paint time at 15× scale; scope protections to where the failure can
  actually occur.

## Session 45 — rules-and-procedures day: statewide routing, the CADM homonym, the description lane (2026-06-11)

Sam's brief: stay in the CCR, refine the rules/procedures behind minting and
merging. Three asks, three PRs, all merged on green (#379, #381, #382).
First: verified the day's cron no-op'd on the #365/#366 router artifacts
(stamp-normalized hashes byte-stable; CER/statewide moved with fresh MAP
data — handoff item 2 closed).

**#379 — C-ID router Phase 3: statewide.** Removed `_ROUTE_PREFIXES =
("MATH ",)` after math proved out. 8,377 members (was 329) now display
under 454 descriptor rows; 174 fully-routed M-IDs + 1,682 stand-alones fold
(`rfold`); +28 claims-only rows; payload 15,652 → 15,517. Conservation
verified: **0 member tuples vanish, 125 previously-INVISIBLE claimants
materialize** (their descriptor row didn't exist pre-widening). The
surprise: **4 stats courses un-routed** — they hold MATH 110 ∧ SOCI 125
dual approvals, and Phase 1's gate filtered joins to MATH *before* the
uniqueness test, hiding the SOCI side and auto-picking MATH 110. **Rule
recorded (scope §9): a routing scope-gate must filter AFTER assembling each
course's full approval set, never before** — a scoped view biases
dual-approved courses toward the in-scope descriptor.

**#381 — the CRIM M1003 case → the homonym machinery.** Sam's screenshot
("Introduction to 3D" filed under Administration of Justice as CRIM M1003)
root-caused to `subject_map["CADM"] = AoJ`: right for Bakersfield
(Corrections ADMin ×47) and wrong for Merced (Computer-Aided Drafting ×4),
then **laundered into the identity** by the canonical-SUBJ4 re-key
(MAD M1003 → CRIM M1003). Subject codes are college-local vocabulary; a
global map entry poisons the minority college. Built:
- `kb/_audit_subject_map.py` — per-entry college TOP-division votes
  (internal-consistency gated) + **minority-title evidence** grading
  (overlap with the discipline name separates "different department"
  from "same content, different TOP philosophy"). 17 candidates → 11 true
  homonyms (ADM=police/graphics, AP=anatomy/photography, PLS=paralegal/
  plant-science, OT=occupational-therapy/office-tech, FS=fire/food/film,
  GSS=gunsmithing/gender-studies, IS, CADM, AET, CAM, AQUA), 6 false
  positives. The title heuristic under-credits abstract discipline names
  ('Multimedia') — human eyeball on actual titles decided the borderlines;
  clearances persist in `_subject_map_notes.audit_cleared`.
- **College-scoped subject_map entries** (`{"discipline":…, "colleges":
  […]}`) — scoping beats removal: flat removal degraded the MAJORITY side
  (Lassen's 118 correct Gunsmithing fills → coarse division umbrella). The
  first run measured exactly that (651 retracted), which forced the design.
- **Retraction propagation** — `_infer_disciplines.py` re-derived its own
  fills (refinements propagate) but left stale fills when an entry was
  removed. Now they blank + downstream passes re-fill. **Any pass that
  re-derives its own fills must also retract them.**
Repair chain: 363 majority fills kept at 0.8; ~320 minority rows re-filled
from per-row evidence (CRIM M1003 → Drafting/CADD; police courses → AoJ;
+`2105.10` Corrections added to the TOP map). Audit: title-mismatch
773→712, TOP-disagreement 960→926, collision-signal 1,076→1,210 (re-filled
rows queued for the next SUBJ4 re-mint — by design). Consumers hardened for
the scoped form (`_row_audit`, `_overmerge_dryrun`). KB note:
`methodology-college-homonym-subject-codes.md`.

**#382 — the description-evidence lane (the dark 86%).** Post-router,
13,922 of 16,143 M-IDs carry NO official evidence anywhere — content is the
only consolidation signal. `kb/_desc_consolidation_dryrun.py`: TF-IDF
cosine over 12,025 dark descriptions, top-IDF inverted index, gates =
cos ≥ 0.60 + credit + units(0.5) + NOT-same-title-sig + **level** (FLSP
M1379) + **gender** + **sport** guards — the last two earned by the first
run's output (Men's/Women's Varsity XC grouped; Wrestling joined XC via
the off-season conditioning template description). **474 groups (135
cross-college)**; receipt committed, re-run termly like the c-id refresh.
Marquee finds the title lane structurally cannot make: the 8-M-ID
infant/toddler ECED family (~20 colleges — singular/plural splits the
sig), the state fire curriculum (I-200, Driver/Operator 1A/1B), NRSH/NRSR
CNA. Generator joins the receipt as `desc_groups` (liveness-validated,
sig-tiebreak); consumer renders the 4th worklist section (📝 badge,
same-college amber); Confirm = the existing doConsolidate;
`tests/uc_desc_lane.test.js` (17 assertions). Suite 29/29.

**Patterns:**
- **Dry-run the regen against a byte-exact baseline and diff member
  CONSERVATION, not counts.** The +94 net member rows decomposed into
  125 materialized (a strict improvement: pre-#345-class invisibility
  ending) + 31 dedups — a count-only diff would have hidden both.
- **A scoped gate corrupts set-valued evidence.** Filter-then-test made
  dual approvals look unique (the 4 stats courses). Assemble the full set,
  then test, then scope.
- **Template descriptions are the description-evidence trap**: athletics
  off-season/varsity text is interchangeable across sport and gender —
  guard with closed-vocabulary title marks before trusting cosine 1.0.
- **Let the first run's output design the guards.** Both the scoped-entry
  design (#381) and the gender/sport guards (#382) came from running the
  naive version and reading its damage, not from up-front speculation.

## Session 46 — the AUTO/smog over-mint case → the title-evidence lane (2026-06-12)

Sam's brief: "tear into further rules refinement for minting and merging —
have a look at the auto overmints, particularly in smog I and II", then
generalize statewide. One PR.

**The case study.** The California BAR (Bureau of Automotive Repair) Smog
Check curriculum — a single state-regulated spec with ~5 course types
(Level 1 Engine & Emission Control, Level 2 Inspection Procedures, combined
L1&2, Diagnostic & Repair, license-renewal Update) — existed as **52
identities** (10 M-IDs + 42 stand-alones) with only 3 trivial pairs
surfaced by any lane. Structural causes, each now a rule:
- **The desc lane can't see singletons** (42 of the 52) — its population
  was minted M-IDs only.
- **Units gates block licensure-spec courses**: the same BAR spec is
  packaged at 1.0–7.0 units across colleges (POST modular academies run
  7–21.5u). For externally standardized curricula, unit packaging is a
  COLLEGE choice, not course identity. The exact-sig title lane never
  gated units; near-title matching shouldn't either — show the spread,
  don't gate it.
- **Title decorations hide matches**: "BAR …", "Bureau of Automotive
  Repair (BAR) …", "California State …" break token-set equality. IDF
  weighting solves what filler-stripping can't (agency/geo tokens are
  mid-IDF, content tokens like "smog" dominate).
- **Word-number levels**: "Smog Level One and Level Two" never matched
  "Level 1 & 2" (roman handled, cardinals not).

**Shipped — `kb/_title_consolidation_dryrun.py` + the 🏷 title-evidence
worklist lane** (6th section): IDF-weighted title cosine ≥ 0.62 over dark
M-IDs **+ stand-alone singletons** (67,346 titles), discipline-OR-TOP-division
corroboration (the mis-disciplined `AUTB M1037` "SMOG CHECK II" joins via
TOP 09), ≥2 shared content tokens, NO units gate, **clique-consistent
components** (an unmarked title can't chain Level 1 and Level 2 into one
blob — every cross-pair must pass the guards before two components unite).
**5,662 groups (4,376 cross-college; 2,255 mixed M-ID+stand-alone)**;
receipt `kb/title_consolidation_out/candidates.json`, joined as
`title_groups`, rendered with units-spread note + same-college amber.
Smog: 52 fragments → 9 coherent families; the marquee L1&2 group
(M1001+M1002+M1217+M10AG) and the 10-college Level-2 family assert in
`tests/uc_title_lane.test.js`. Other first-page wins: POST Level III
Reserve ×3 colleges, NWCG Fireline L-380, ASL Linguistics ×4, JavaScript
×6 (3 SUBJ4s), Wills/Trusts paralegal family ×10.

**The guard suite got a shared home — `kb/_consolidation_guards.py`**
(imported by BOTH receipt builders; they were already drifting). Upgrades
earned by reading the naive run's damage (the Session-45 pattern again):
- **Two-axis level marks.** "Elementary Portuguese 2" vs "Intermediate
  Portuguese - Level 1" both read {1,2} as a flat set — the desc lane's
  guard had this collision too. Word-levels and digit-levels now gate
  separately, then the combined set gates ("Basic X" {W:1} still blocks
  "X II" {D:2}).
- **Variant-type marks, STRICT equality** (refresher / update /
  supplemental / instructor / supervisor / module / modular / bridge /
  honors): asymmetric possession blocks — "EMT-I Refresher" never pairs
  with "EMT-I" but pairs with "EMT 1- Refresher Course". CCN itself
  treats Honors as a distinct course (the `H` speciality identifier).
- **Year edition marks** (15xx–20xx): "2019 Smog Check Update" ≠ "2021
  …"; "US History to 1865" ≠ "… 1877 to Present"; year-less pairs with
  yeared (vacuous pass) so cross-college editions still group.
- **Context-marked session letters** ("Honda IST Session C" ≠ "Session A").
- **Cardinal word-numbers** fold to digits in marks AND in `_sug_sig` /
  `_fam_key` / the desc lane's sig (lockstep — a sig-equal pair must be
  the title lane's, never double-queued).

**Desc receipt re-run under the new guards: 474 → 446 groups.** All 37
removed groups were real conflations the old guards passed: Honors-vs-base
(Chicano History, Adolescent Lit, History of Science), period splits
("to 1877" vs "Since 1877"), Fire Module 1A chimeras. Strict improvement;
the ECED marquee family survives intact (8 members).

**Patterns (additions to the canon):**
- **Read the over-mint before designing the merge rule.** The 52-fragment
  smog corpus dictated every gate decision — population (singletons in),
  units (out), corroboration (discipline OR TOP), normalization
  (word-numbers). A rules pass designed from the schema alone would have
  kept the units gate and missed 80% of the corpus.
- **Clique-consistency beats size caps for chained components.** Union-find
  over pairwise-gated edges still chains A–B–C where A–C violates a guard
  (vacuous-pass semantics make unmarked titles bridges). Validating every
  cross-pair at union time kills the leak generically; the desc lane's
  GROUP_CAP was the blunt version.
- **When two scripts share guard vocabulary, extract the module the day
  the second script appears.** The desc lane's flat-set level guard had
  already drifted from what the title lane needed; the shared module made
  the upgrade land in both.

**Carryover / observations for next sessions:**
- `AUTB M1037` ("SMOG CHECK II" under Auto Body Technology) and `AVIA
  M10KE` ("BAR Emissions Update" under an aviation SUBJ4) are
  mis-disciplined rows the lane SURFACES but can't fix — both involve
  apprenticeship-style subject codes (`APPR`, `ATECH`) that aren't in
  `subject_map` (so the #381 homonym audit didn't see them). The eventual
  canonical-SUBJ4 fold (collision-signal queue, handoff item 4) is the fix
  vehicle; until then the Confirm flow parks them under the right family.
- Known acceptable misses: different-year Update editions never group
  cross-college (year guard); base ↔ "Beginning X" pairs rely on vacuous
  pass (by design); contentful-difference damage ("Installation" vs
  "Layout", "California" vs "Latin America") survives the gates at ~0.65
  cosine — obvious-on-sight for the curator, acceptable for a
  never-auto-applied queue.
- Receipt re-run cadence: termly, alongside the desc receipt (both join
  static committed receipts; the daily cron stays byte-stable mod stamp).

### Session 46, part 2 — "consolidations that should happen": the statewide twin merge + the smog confirms (2026-06-12)

Sam reviewed the CCR after #385 landed: *"Still seeing some apparent MID
consolidations that should happen, so more rule sharpening perhaps. See AUTO
M1001 … and M1002 as well as all the level II inspectors."* The insight: a
**suggestion queue is the wrong tier for zero-judgment cases**. M1001/M1002
are token-identical titles (pure word order) — they'd sat in the worklist
since the mint. The repo already had the authorized instrument: the
Session-39 KINE/FLSP strict twin-merge. Taking it statewide is the same
move the router made in #379.

**Shipped — `kb/_apply_twin_merge_statewide.py`** (the Session-39 pass,
unscoped + hardened):
- Same strict twin key: `(subj4, discipline, band, strict_fam,
  credit_status, typical_units)`; blank-discipline parents skipped (89).
- **PLUS the Session-46 guard suite as a clique gate** — the ordinal-rule
  fam key drops "1" as non-distinguishing, so "X Level 1 & 2" fam-equals
  "X Level 2"; the two-axis level marks catch it. Any conflicting pair
  sends the WHOLE group to the worklist: 65 groups skipped (gendered
  athletics "(MEN)/(WOMEN)" the parens-stripping fam key can't see;
  "Advanced Ceramics" vs "Advanced Ceramics I"; Organic Chem A vs B).
- **Dry-run damage findings → fixes**: "Elementary Algebra (Lab)" tried to
  merge into "Elementary Algebra I" → `lab`/`laboratory` joined
  VARIANT_WORDS; curators had already UI-merged some twin groups with their
  own target (BUSI/ENGL) → the winner pick now defers to an existing
  curator merge-target before corroboration; re-keyed `merge_into` pointers
  that become self-referential are dropped.
- **Result: 589 losers absorbed in 496 groups** (16,143 → 15,554 parents);
  107 articulations re-pointed; all 9 curation re-keys turned out to be
  curator merges into exactly the twin winner — fulfilled physically,
  mirrored to Supabase as deletions. V-gates G1–G6 PASS. Alias receipt
  `kb/twin_merge_out/2026-06-12/`, registered in `_rekey_promotions.py`
  ALIAS_MAPS and applied (99 re-keyed, 80 folded, witnesses conserved,
  V1–V5 PASS). CSR re-seeded; audit refreshed (seed-untouched 10,998 →
  10,513; unit anomalies 4,347 → 4,194; title-mismatch 712 → 687).

**The Sam-confirmed smog merges** (his message = the curator confirmation;
written as `kb_curation` rows in Supabase + mirrored to the overlay):
- **L1&2 family → `AUTO M1001`**: M1002 came via the twin pass; M1217
  ("Smog Level One and Level Two", 5.5u) + stand-alone M10AG via curation.
- **Level-2 inspector family → `AUTO M1007`**, unified title "Smog Check
  Inspector Training Level 2": M1005, M1006, AUTB M1037 (the mis-keyed
  Auto-Body row — folding it under M1007 also fixes its display
  discipline) + 8 explicit-Level-2 stand-alones (M10BK, M10BL, M10BT,
  M10PB, M11AA, M11CW, M11DB, M11NQ). **12 members, one row.** The
  unmarked "Inspection Procedures" rows (M11DC/M11DE/M11NW) and the
  noncredit pair (M9052/M90AK) stay in the queue — no explicit L2 mark =
  curator territory.
- Both receipts (desc 446 → 416, title 5,662 → 5,584) re-run against the
  post-twin KB so the queue never shows already-merged ids.

**Test lesson — marquee pins vs physical consolidation.** Two existing
tests pinned pre-merge ids ("ECED M1099" in the desc test; "folds ≥10
variants into EMST M1064" in the CER test). The twin pass absorbed M1099
into its twin M1098, and EMST M1052 into M1064 — which legitimately
SHRINKS the CER's display-level fold count (the same unification moved
upstream into the KB). Pins updated; thresholds now guard the mechanism,
not a high-water mark. **Expect this class of test movement whenever
display-level consolidation becomes physical.**

**Rules-contract honesty**: `docs/ccr_rules_brief.md` previously promised
"title similarity alone is never enough to merge automatically" — amended
to document the one exception (the strict twin tier, its full condition
list, and the alias-map undo guarantee). The plain-language contract must
track what the automation actually does.

## Session 47 — Bruh Supernova: SUBJ ⇄ CCR checking, the To-Do feed, the fold dry-run (2026-06-12)

Sam's brief: a CSR routine to check-and-cure SUBJ-vs-CCR errors, on-the-fly
SUBJ validation while curating, and a per-tab To-Do checklist ("simple is
better"). Four PRs (#388, #389, #402, #405), all merged on green, running
PARALLEL to Session 48's First Light design sprint (zero collisions — the
two sessions co-edited `kb/cpl_todos.json` sequentially and even relayed a
chip-restyle heads-up through it).

**#388 — the `✓ Check SUBJ ⇄ CCR` sweep + live input feedback.** One
ownership index over the CSR seed's `variants_observed` (the per-discipline
SUBJ4 distribution across actual CCR rows — refreshed at every re-seed, so
it is exactly the right grain, already client-side). The sweep reports
🔴 shared Common SUBJ codes / 🟡 off-canonical CCR rows (with `⚠ = X`
cross-claim annotations — the `AUTB M1037` class — and minority-share
notes) / 🔴 invalid saves / ⚪ missing picks, each with a jump-to-row cure.
The input gains live collision/in-use badges + collision-free suggestion
chips (chip mousedown fills before blur so the normal blur-save persists);
colliding saves confirm, never block (convergences are legitimate).
**Outcome: Sam cured all 11 shared codes within hours** — the affordance
became throughput the same morning.

**#402 — alias-family awareness (the THEA lesson).** The sweep flagged
Drama/Theater Arts + its recorded fan-in ALIAS "Theater Arts" (both
deliberately `THEA` since the Session-38 convergence) as a collision, and
Sam — reasonably — "cured" it by re-coding DRAM, which would have re-keyed
1,540 rows and UN-converged the pair at the fold. Fix: `aliasFamilyOf()`
over `kb/discipline_aliases.json`; within-family code-sharing renders as
"ℹ expected", drift cross-claims and live-input warnings skip family
members. The DRAM pick was reverted (Sam's call: "if we can safely keep
them together, it's preferable") with an intent note in `kb_curation`.

**#389 — the 📋 To-Do button** (every tab): `kb/cpl_todos.json` rendered as
a For-Sam / For-Fable daily checklist with a "where we are" status;
per-browser check-offs keyed by `_as_of`; refreshed at every Rule-8
checkpoint (item 9, paired with the handoff). Day-one lesson: during an
active curation burst the static counts age within HOURS (the "11
collisions" item outlived its truth by mid-morning) — acceptable for v1,
live-count enrichment is the known knob.

**#405 — the canonical-SUBJ4 fold DRY-RUN (Rule-7 playbook step 1).**
Preconditions verified live (148/148 picks, zero shared codes). The first
run FAILED honestly: `_subj4_dryrun.py` predates the umbrella-discipline
concept and planned to fold the per-language FL** rows back into FLNG
(undoing the 2026-06-09 split re-mint) and Kinesiology's ATHL rows into
KINE — bursting the 999-seq capacity (`no_seq_overflow`). Patch:
`load_umbrella_allowances()` (mirror of `kb/_row_audit.py`
UMBRELLA_DISCIPLINES) — in-allowance rows keep their OWN SUBJ4,
off-allowance rows surface as `skip_umbrella_offcode` (95 — never
auto-folded; which language an off-code FL course belongs to is the FL
apply's call), V2 exempts umbrellas. **Result: 71,710 M-IDs → 10,974
re-keys (2,254 minted + 8,720 stand-alones), 60,063 no-change, 5/5 gates
PASS.** Apply gate: 19 curated-collision buckets (deterministic
re-sequencing to approve — the smog family lands adjacent as
`AUTO M1004/05/06`). One stray: `ARTS M1201` curated as "Ceramic
Technology" (not an MQ name) — vocab cleanup later.

**Operational findings:**
- The cron DOES sync the canonical seed (`_apply_canonical_subj4.py`, step
  guarded `|| echo non-fatal`) — but it failed/skipped silently on some
  days (CIS=CSIS sat in Supabase since 5-23 while the seed said CISC), and
  a one-minute race (cron read 17:17:34, the THEA revert committed
  17:18:32) briefly split seed-vs-Supabase state during the rebase. Treat
  the committed seed as eventually-consistent; fresh-read at write-time
  stays mandatory (it caught this exact case).
- Network egress from the session container is policy-blocked for both
  api.github.com and Supabase REST — the MCP `execute_sql` lane is the
  workable fresh-read path (export via `json_agg`, fold locally).

**Patterns (canon additions):**
- **Diagnostics must know about deliberate convergences.** A checker that
  can't see alias families / umbrellas doesn't just false-positive — it
  actively PUSHES wrong cures to a diligent curator (THEA→DRAM). Shared
  semantics (umbrella allowances, alias families) now live in three
  consumers: the auditor, the CSR sweep, the fold dry-run. Mirror or drift.
- **Let the first dry-run fail.** Both real findings (the FL fold-back, the
  KINE overflow) came from running the stale machinery and reading its
  damage — the Session-45/46 pattern holding for re-mints too.

## Session 50 — Bruh Dawnleader: the SUBJ4 canonical fold APPLIED (2026-06-12)

The Rule-7 apply of Session 47's dry-run #405 — the largest re-key since the
2026-05-23 canonicalization, landed in one evening window between crons (both
of the day's scheduled runs had completed; next cron ~16h out).

### What ran, in order (all receipted)

1. **Pre-apply re-verification** (the handoff's "re-verify deterministic
   assignments" path): live `kb_curation` rebuilt the committed overlay
   byte-identically (137 rows → 128 entries); live canonical picks matched
   the seed 123/123 (the 1 non-Supabase `curator_override` is the PEDS pin
   the Session-38 convergence apply wrote directly, documented in its
   `_notes`); a fresh dry-run reproduced the frozen plan **byte-identically**
   (alias map + report). The 19 curated buckets Sam had in his To-Do feed are
   exactly what executed — recorded as-executed in the apply receipt.
2. **`kb/_subj4_apply.py` REBUILT** (the 2026-05-23 version consumed the
   dry-run plan verbatim and would have overwritten the ALIAS_MAPS-registered
   historical receipt in `kb/subj4_apply/`): `_subj4_dryrun.py` now exposes
   `compute_plan()` (refactor proven byte-identical) and the apply calls the
   SAME allocator — **apply == spec by construction** — with gates P1 plan
   fidelity vs the frozen reviewed plan, P2 apply-readiness, P3 export
   freshness (the `--curation-export` fresh-read must rebuild the committed
   overlay), and G1–G8 post-mutation conservation (counts, untouched
   byte-identity, exact keyset permutation, articulation multiset, overlay
   liveness, `_subj4_fold_from` stamp coverage). Receipt:
   `kb/subj4_fold_out/2026-06-12/` (the frozen dry-run's `_status` restamped
   SUPERSEDED — the Session-42 receipt-honesty rule).
3. **The fold**: **71,037 aliases, 48,820 id moves** (12,803 minted + 36,017
   stand-alone rows; 10,974 are SUBJ4 re-keys, the rest are within-bucket
   number re-sequencing — the permutation semantics the dry-run's own
   docstring mandates, same as 2026-05-23). Ripple: 12,803 membership keys,
   3,232 articulations, 108 curation keys + 39 `merge_into` values.
4. **Supabase mirror in the same window**: 119 targeted ops (only rows whose
   key or pointer moved — not a 71k fan-out), single transaction, ordered so
   every slot-handoff vacates before it fills (simulated against the
   composite PK first: 0 transient collisions in sorted order). Post-write
   md5 matched the locally-derived expectation exactly; the overlay rebuilt
   from post-write rows == the committed file, so the next cron sync is a
   content no-op.
5. **The bundled post-fold twin pass** (`--tag=postfold` so the receipt
   can't clobber Session 46's same-day dir): **19 newly-key-equal twins
   absorbed** in 18 groups (15,554 → 15,535 parents) — the predicted payoff,
   cross-SUBJ4 twins the fold made key-equal ("Statistics for Business" →
   "Business Statistics", the 3-way CNA family, "Object-Oriented Programming
   in Java" → "… with Java"). 65 guard-skips all correct holds (gendered
   athletics, A/B sequences, level ladders). 0 curation refs.
6. **The chain** (`kb/_post_apply_chain.py`, written first as the handoff
   suggested — fail-fast, `--from` resume): promotions re-key (1,678
   re-keyed + 3 folds + **0 unresolved**, V5 stamp gate 1,675 checked / 0
   conflicts against the new `_subj4_fold_from` stamps), CSR re-seed (148
   disciplines, 0 needs-review, curator picks preserved), audit, both
   consolidation receipts (desc 415, title 5,581 groups — re-run so the
   queues never show dead ids), and a fold-verify dry-run into /tmp
   (`SUBJ4_DRYRUN_OUT` seam): **re_key 0**, 71,691 ids all canonical.

### The receipts

- **`subject_collision_signal` 1,206 → 3.** The 3 residuals are the
  cross-discipline curated re-keys (`ARTH M1022` ex-`ARTS M1159`,
  `BUSI M9038/M9039` ex-`CISC M9029/M9030`): the fold honored the CURATED
  discipline (overlay-wins, correct), but the rule reads the BASELINE file
  discipline, which still says Art/Computer Science — honest, bounded flags
  marking baseline↔overlay disagreement, not fold defects.
- **`mid_id_off_scheme` 2 → 1** (`F M1002`, blank-discipline, unfixable
  until disciplined; `N M9001` had gained an honest Social Science
  discipline and folded to `SOCS M9003`).
- Tests **34/34** after re-pinning `uc_title_lane.test.js` to MECHANISMS
  (titles + pointer convergence) instead of ids — and the new assertions
  were cross-checked green against the fresh receipt era too, so the suite
  survives the post-dispatch artifact flip.

### Lessons

- **Under slot reuse, an id pin in a test asserts the wrong row after any
  re-mint.** `!byId["AUTO M1002"]` was about to become FALSE-meaningful: the
  slot gets re-occupied by an unrelated course at the next regen. Title +
  pointer-convergence assertions are era-proof; concrete ids are kept only
  where the fold proved them stable (`AUTB M1037`).
- **Mirror ops need a PK-collision simulation, not hope.** With the
  composite `(course_id, field)` PK, chained re-sequencing (`M1006→M1005`
  while `M1005→M1004`) collides transiently if the fill precedes the vacate.
  Simulating the op order against the PK set found sorted order safe HERE —
  the check is one loop and belongs in every future apply.
- **`compute_plan()` extraction is the cheap way to make apply == spec.**
  The alternative (consume the frozen plan verbatim) is exactly what left a
  stale `DRY-RUN` status on an applied receipt in May (Session 42's hour of
  confusion). Recompute + byte-fidelity gate gets both: live inputs AND the
  reviewed plan.
- **The auditor's collision rule reads baseline discipline** — a documented
  asymmetry now (the 3 residual flags). If cross-discipline curation grows,
  teach `_build_disc_to_modal_subj4`/`_classify_subject_collision` the
  overlay; at 3 rows it's a truthful diagnostic, not noise.

### State / next

KB: 15,535 parents + 56,156 singletons, every disciplined M-ID on its
canonical SUBJ4. Artifacts regenerate via the post-merge `workflow_dispatch`
(code-only-PR policy); the CCR's "Local-derived (awaiting fold)" population
≈ empties, which is the planned progress meter for the **CCR
subject-dropdown grouping** (handoff priority 2, unbuilt — sequence around
the retheme lane's `unified_courses.js` work). Cleanups remaining: the
`ARTS M1201` "Ceramic Technology" vocab stray (skip_unknown_disc — untouched
by the fold, cure = pick the MQ discipline in the CCR then it folds next
pass), the 95 umbrella-offcode rows (FL/KINE per-umbrella review), and the
3 collision residuals above.

---

## Session 51 — Bruh Photonicus, 2026-06-12 (night): KIN/PE pass 2 — the PEDU parking lot dissolved + the merging night (#412–#415)

Sam drove this one live from the CCR/CSR (screenshots + five follow-ups while
the session ran). Four PRs: #412 (data), #413 (test repins), #414 (CSR UI),
#415 (CCR worklist).

**The root cause found and killed.** The PEDU rows in Sam's screenshot were
the residue of a three-step accident: the 2026-06-10 fan-in convergences
flipped disciplines but (a) left machine `discipline_source` stamps on the
flipped rows and (b) never re-pointed the inference lexicons (9 subject_map
entries, 3 title_keywords, 4 TOP codes still targeted "Physical Education";
1 + 1 + 1 targeted "Theater Arts"). The Session-45 re-derivation then
faithfully resurrected the aliases on 752 rows, and the Session-50 fold —
needing a canonical for a discipline that "shouldn't exist" — got Sam's
PEDU/THEA parking pins. Fix legs (all in #412): lexicons re-pointed (the
bare `intercollegiate` keyword DROPPED — Intercollegiate Forensics is
speech & debate, Intercollegiate Logging Sports is forestry; both got
explicit per-id overrides instead), `kb/_alias_canon.py` guarding all four
passes at load, and pass-2 flips stamped MANUAL (value, no source) — the
only state no pass touches. KB note:
[`kb-notes/methodology-fanin-alias-lexicon-contamination.md`](kb-notes/methodology-fanin-alias-lexicon-contamination.md).

**The refined athletics rule.** Original carve-out was title-keyword-only;
Sam's "Basketball, Men" examples carry no keyword. Pass 2 adds the
colleges' own signal: modal `top_code == 0835.50` (Intercollegiate
Athletics) → ATHL, EXCEPT an instruction-activity exception list
(yoga/pilates/aerobics/kickboxing/karate/martial/tai-chi/zumba/dance — the
measure-first dry-run caught "Yoga - Intermediate" mem=28 parked on
0835.50). 133 KINE parents + 419 singles moved; 505 PEDU rows split
ATHL/KINE/PEDS; 147 Theater-Arts flips; 20 exact fam-twin merges; 1,057
ids re-keyed under G1–G8; chain green (fold-verify re_key 0, collision
signal stays 3); the two Supabase parking pins deleted so any recurrence
surfaces as `blocked_on_curator` instead of silently re-minting PEDU.

**Sam's title asks, all shipped.** (1) `_normalize_common_titles.py`:
19,739 titles → Title Case (acronym keep-lists; all-caps titles re-cased),
sequence romans → digits with guards (clinical "IV Therapy", "Title V",
pronoun-I, Malcolm-X), "(formerly …)" stripped (162), mojibake repaired.
Display-only by construction — the member join is control-number exact and
every identity comparator (fam/_sug_sig/kinship) lowercases + strips parens
+ folds romans already. (2) The HS fold: "High School X"/"HS X" venue
markers cut **when a de-HS'd twin exists** (Sam's condition) at the SAME
band + SAME SUBJ4 — 35 merged (replicating + flattening the Arithmetic-2
chain Sam had hand-built an hour earlier), HS-Equivalency/Diploma subject
phrases protected, 19 cross-SUBJ4 twins (ESL Civics vs diploma Civics)
flagged only. Receipts: `kb/kin_pe_pass2_out/2026-06-12/`.

**The merging analysis** (`athl_family_analysis.md`): 50 roster families
parsed by facets (sport/gender/season/level/type); 26 auto-merged under a
frozen contract (in-season team course per sport+gender; baseball/football
→ men and softball/beach-volleyball → women by CCCAA reality); everything
else — unmarked-gender dual sports, Fall/Spring sections, Defense/Offense
positional units, conditioning/theory/fundamentals lanes, "Competitive X" —
FLAGGED for the curator, never merged. Plus Sam's fitness set: the
general-fitness core → `KINE M1596` "Physical Fitness"; Walking kept its
lane (his call); noncredit `M9017` kept its band (the band contract beats
the title match — explained to Sam rather than silently crossed).

**The lost-saves bug (#415).** Sam: "they didn't save — tried it twice."
They saved; `fetchOverlay()` read only `field=eq.discipline`, so reloads
never replayed live merges and the worklist re-offered confirmed groups.
Fixed with a combined overlay fetch + `applyMergeLocal` replay (factored
from doConsolidate so the two paths can't drift) + the new **Keep as-is**
button (persistent `merge_dismissed` signatures; membership change
re-offers) + the CCR Subject optgroups. #414 delivered the four CSR tweaks.
#413 re-pinned the 6 post-fold-stale test files mechanism-style (and caught
two stale pins passing GREEN on wrong rows — slot reuse's signature move).

**Mechanics lesson.** A long `--apply` piped through `head` died on SIGPIPE
mid-print, BEFORE its writes — looked applied, wasn't. Pipe applies to a
file (`> log 2>&1`), check the exit code, verify idempotency by re-running
the dry-run.

## Session 53 — Bruh Infinitus: auto-merge pass 1 + Sam's parallel UI batch (2026-06-12 night)

**What shipped (PRs #418–#424).** Sam drove live. (1) Worklist popup chrome —
persistent drag-handle title bar + ✕ closer + PROPOSAL framing ("Proposed
unified title — applied only if you Confirm"; "Candidates (N) — each row is
currently its own separate identity") after the Developmental-Movement-Lab
confusion: the prefilled title read like current membership. (2) Regen
verified + 4 artifact-pinned test files re-pinned to the normalized-title era
(romans→digits, Title Case; the smog target now resolves via the curated key —
its noncredit band twin shares the display title post-normalization).
(3) KPI batch: CCC Collaborative Adoption card consolidated into Statewide
Exhibits (+ blank-adopter guard), Veteran Sprint ⭐ + "JSTs Uploaded" + real
colleges-with-a-JST count, quickstart banner full-width. (4) Mojibake: a
cp1252→UTF-8 decode-loop repair (+ pair map for the NBSP artifact in all
THREE case forms — the Session-51 title-caser had downcased mojibake
mid-word) at raw-title ingestion; 395 member titles repaired + queued in
`kb/coci_title_corrections.json`; CCR "⚠ fix in COCI" chip; 63 identity
titles re-fixed by the upgraded normalizer.

**The headline: auto-merge pass 1 APPLIED.** Sam reviewed ~80 of the 9,087
worklist groups, found them dependable, asked for auto-curation with flags.
`kb/_auto_merge_worklist.py` (dry-run default) planned ONLY the dependable
lanes — anchored same-title + cross-college singletons; title/desc/family/
evidence lanes stay human. Gates excluded 563: **325 band mixes (credit M1xxx
vs noncredit M9xxx sharing a title — the single best argument for the
dry-run)**, 214 same-college, 4 Keep-as-is dismissals, degenerate dupes.
Title rule deterministic: official target → no write; curator title → kept;
else normalize(longest) + Honors de-dash/case. Write shape == doConsolidate
(merge_into + unified_title; NO discipline rows — merge ≠ verify). Sam
skimmed the receipt → "apply": fresh-read gate (live == plan input state),
then a **server-side apply**: postgres `http` extension fetched the
SHA-pinned plan.json off main, gated on HTTP 200 + md5 byte-identity, one
INSERT … ON CONFLICT DO NOTHING (human rows always win), extension dropped
after. **5,838/5,838 rows, 0 conflicts; 2,272 targets; 941 UC-CUR-AUTO
mints; cohort `reviewer_email='automerge-v1@bot'`.** Receipts + apply_log:
`kb/automerge_out/2026-06-12/`.

**Lessons.**
- The pre-apply uniqueness gate earns its keep: it caught a payload quirk
  (one id listed under two kinds in one group) AND surfaced 20 degenerate
  self-groups. Cheap assertion, real catches.
- Server-side md5-pinned apply beats shuttling 400KB of SQL through chat:
  commit the receipt → DB fetches the SHA-pinned bytes → gate on md5 →
  one statement. apply == spec, provably.
- Container egress allowlists bite: Drive + Supabase REST both blocked from
  the session container; the Supabase MCP + the GitHub raw fetch FROM the DB
  are the workable channels.
- The live schema is the truth, not the setup SQL: kb_curation's marker
  column is `reviewer_email`, not the setup file's apparent `reviewed_by`.
- Title normalization had created NEW mojibake case-variants ("ã‚â"/"Ã‚â")
  by Title-Casing artifact bytes — fixers must handle the mangled forms of
  their own pipeline's output.

**Next.** ⚙ auto-merged chip + Triage lane (reviewer_email travels via the
overlay sync — wire generator emit + client + test); title-lane pass-2
decision after Sam spot-checks pass-1 in the CCR; post-regen suite re-pin
check (the 2,272 folds shift artifact-pinned tests); MilStudents → Custom
Reports wiring (unlocks the true JST-upload universe + more); the COCI
title-correction campaign (395-row queue, Glendale + Canyons top).

## Session 54 — Bruh Spaceranger: the auto-merge cohort made reviewable (2026-06-13)

Follow-through on Bruh Infinitus's auto-merge night. Three things: **verified**
the overnight regen, **surfaced** the 2,272-group cohort for one-click review,
and **refreshed** the Pipeline tab. PR #428 (merged + dispatched + live).

**1. Verified the post-apply regen** (the foundational gate). Auto-merge folds
materialized — 941 `UC-CUR-AUTO*` mints + 1,331 anchored = 2,272 targets, 3,588
folds (exact match to `kb/automerge_out/2026-06-12/`). Worklist shrank 9,087 →
6,583 (groups 257 · singleton 308 · family 6 · desc 390 · **title 5,457** ·
evidence 165). Suite green; no artifact-pinned test needed a re-pin this time
(the prior `#419`/`#426` re-pins already covered the normalized-title era).

**2. ⚙ auto-merged chip + "Auto-merged" Triage lane** (the deliverable). The
cohort marker `reviewed_by == "automerge-v1@bot"` rides the overlay sync into
`kb/coci_curation.json`. Generator: a `_auto_fold_count(members)` in the single
`merge_members` loop stamps each surviving target with `auto_n` (>0 only) — no
other emit path can carry the marker, so one add covers it. Consumer: an amber
`⚙ auto-merged` chip (inline token style, distinct from the cobalt `⛓ merged`)
+ a **row-level** Triage lane (`r.auto_n>0`) special-cased *before* the
audit-card lookup, so it works without sign-in or the audit overlay.

**Lessons.**
- **Measure the flag against LIVE data before writing generator code.** I
  reconstructed `merge_into`/`merge_members` from `kb/coci_curation.json` in a
  node one-liner and confirmed it yielded exactly 2,272/941/1,331/3,588 BEFORE
  touching `.py`. The generator change was then a transcription of a proven
  computation, not a hypothesis.
- **Verify the generator end-to-end via an isolated `export_unified_courses()`
  run.** `pip install -r requirements.txt`, then `python3 -c "import
  excel_to_dashboard as e; e.export_unified_courses()"` — the function is
  standalone (no `main()`), defines its own `kdir`, and writes only the UC
  artifacts. Confirm `auto_n` in the output, then **restore the artifacts** →
  code-only PR. Exact match again (2,272, 0 leakage onto non-targets).
- **Edit HTML on POST-REGEN main.** The pipeline-tab refresh waited for the
  dispatched cron commit to land (background git-poll), then reset onto it —
  no generated-file conflict (the To-Do's standing warning, honored).
- **Row-level Triage lanes** don't need the audit overlay: branch on the label
  before the `auditIndex[r.id]` lookup; the lane filters on the row field.
- **`send_later` was unavailable** this session. Substitutes: a background
  `sleep` (run_in_background) re-invokes the session as a CI re-check timer,
  and a background git-poll loop fires when `origin/main` advances (the regen
  commit) — both respect "no foreground sleep / no busy-poll."

**Correction logged.** The `fable-ceramic-tech` To-Do said `ARTS M1201`'s
"Ceramic Technology" "isn't an MQ name." It IS (1 of 240 MQ disciplines);
`skip_unknown_disc` actually fires from the **SUBJ4 fold** validating against
`discipline_canonical_subj4.json` (148 curator-reviewed names), which lacks it.
Fix is a curator pick (add a canonical SUBJ4, or fold to "Art") — surfaced to
Sam, not guessed.

**Next.** Title-lane pass 2 (DRY-RUN on Sam's go — 5,457 groups, propose a
high-cosine cross-college band-gated SUBSET, same planner shape); a per-row
revert affordance for an auto-merged row; the ceramic-tech curator pick;
MilStudents wiring; the COCI title-correction campaign.

---

## Session 55 — Bruh Nebula: Suggested-merges clarity + the UC-CUR→Z scope (2026-06-15)

Sam reviewed the worklist live (two screenshots) and surfaced real gaps. Shipped
**#434–#437** (all squash-merged; the three UI ones are static `unified_courses.js`,
so live-on-merge with no regen; #435 also touched the generator → dispatched).

**(a) What we learned.**
- **Self-merge ghosts were a data-integrity bug, not cosmetics.** When an
  auto/curator merge folds a course INTO a single-college singleton, that id is
  promoted to a multi-member payload row — **but its stale record stayed in the
  singleton pool**, so the worklist's singleton-attach loop paired the identity
  with its own ghost (member id == anchor id). 20 of 262 anchored groups. The
  general lesson: **a generator that pools "orphans" must exclude records that
  have been promoted to first-class identities**, or they shadow themselves. Fix:
  skip any singleton whose id is already a payload row id (`_sug_row_ids`).
  Verified 20→0 on the republished payload. → KB note
  `methodology-promoted-record-ghosts-in-worklists.md`.
- **A silently-ignored input is worse than a disabled one.** The Discipline
  picker is only written when Confirm MINTS a new course (`synthetic`); on a
  merge-into-existing it was dropped without a word — exactly Sam's "not clear
  why or if I should choose a discipline." Now it **disables + explains**
  ("Inherited from the ★ merge target") vs ("sets the NEW course's discipline"),
  recomputed live with the checked set.
- **The ★ target had to be visible.** The "Proposed unified title" names a common
  course, but nothing said which checked row keeps its id and takes it. Badging
  the §10-precedence pick (reference-equality, not id — duplicate-id rows exist!)
  closed the loop, and `go.onclick` now reuses the shared `targetMemberOf()`.
- **Reusing the `⚇ Unify` search index** (`CPL_UC_INDEX`) made the close-match
  picker cheap: a curator can redirect a merge to ANY identity (e.g. a real
  `Anatomy and Physiology` C-ID) the title-signature grouping won't surface. The
  override folds the whole group into the chosen course, which keeps its
  identity/title/discipline (title "" so `doConsolidate` won't rename it).

**(b) Current state.** Worklist is materially clearer; ghost groups gone; tests
44→47 (`uc_worklist_target_badge` 24, `uc_worklist_override_target` 15).

**(c) Roadmap.** Sam approved the **UC-CUR→Z re-mint** (FULL re-key). Scope doc
`docs/uc_cur_zscheme_remint_scope.md`: rename 4,053 `UC-CUR-*` → `SUBJ Z<band><seq>`;
blast radius is **entirely inside curation** (4,053 targets + 4,053 title rows +
10,682 `merge_into` pointers; **0** articulations/promotions — a much smaller job
than the M-ID re-mints). `Z` = curator-minted/needs-attention, parallels CCN `C`
/ minted `M`; id_system stays `Unified`.

**(d) Next concrete step.** Build `kb/_uc_cur_zscheme_dryrun.py` per the scope —
derive `(SUBJ4, band)` per target, assign `Z<band><seq:03d>` by normalized-title
sort, emit `kb/uc_cur_zscheme_out/<date>/alias_map.json` + collision check +
`report.md`, present to Sam. **Do NOT apply** without sign-off (Rule 7). Decide
the persisted-counter question (recommend option B). Title-lane pass-2 still open.

## Session 56 — Star Treader: the UC-CUR → Z-scheme re-mint, APPLIED (2026-06-15)

PR #439 (merged + both workflows dispatched + verified LIVE). Built the Z-scheme
dry-run, Sam said "Go now," landed the full Rule-7 re-mint in one window.

**What shipped.** The 4,053 synthetic `UC-CUR-AUTO*` unified-course ids →
`SUBJ Z<band><seq:03d>` (e.g. `BIOL Z9001`). `Z` = curator/auto-minted Unified,
needs faculty attention (parallel to CCN `C` / minted `M`). Dry-run
`kb/_uc_cur_zscheme_dryrun.py` (7/7 gates) + apply `kb/_uc_cur_zscheme_apply.py`
share `compute_plan()` so apply == spec. Receipts `kb/uc_cur_zscheme_out/2026-06-15/`.

**Lessons / patterns to reuse:**

- **You cannot hand-pass a re-mint alias map as SQL.** 4,053 arbitrary pairs is
  ~106 KB of `VALUES` — too large to faithfully reproduce in a tool param, and a
  single garbled pair silently mis-keys a live row. The reliable + REUSABLE
  mechanism: a service-key script that *reads the committed alias map file* and
  PATCHes the shared DB, run in **Actions** (the only place the service key
  lives). `kb/_rekey_kb_curation_supabase.py` + `.github/workflows/supabase-rekey.yml`
  are now general infra for every future re-mint. KB note:
  `docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md`.
- **md5 set-equality is the re-key verifier.** Before the write: `md5(string_agg(
  id order by id))` of the UC-CUR surface, git vs live — byte-identical proved no
  drift (the fresh-read safeguard). After: the same md5 of the resulting Z-key set
  vs the alias map's new_ids — exact match proved the live re-key is correct
  regardless of how it ran. Compact (one number) + definitive.
- **Measure before assuming a code change.** The generator (`_target_identity`)
  needed ZERO change: a Z id is disjoint from every native id set (cat/sg/cc/ccn/
  cid), so it already falls through to `("Unified","Unified")`. The only coupled
  code was the *consumer* `unified_courses.js` (a `\sZ\d{4}` target had been
  mis-classified as C-ID by the id-shape branch → title-firewalled) + the auditor.
  Grepping for *functional* `startswith("UC-CUR")` (vs comments) found the real
  3 sites fast.
- **The umbrella exception, again.** SUBJ4 = canonical of the members' modal
  discipline EXCEPT Foreign Languages / Kinesiology, which keep the members' own
  split code (FLSP/KINE/ATHL) — a naïve canonical-map pass would have re-collapsed
  the FL per-language split (the same trap the Session-50 fold hit). Mirror
  `UMBRELLA_DISCIPLINES` from `kb/_row_audit.py`.
- **Atomic land sequence for a curation-layer re-mint.** merge the code PR (git
  overlay re-keyed + coupled recognition) → dispatch `supabase-rekey.yml` (durable
  source-of-truth) → verify (md5) → dispatch `daily-dashboard.yml` (rebuild overlay
  from re-keyed Supabase + regenerate artifacts) → verify republished payload. The
  cron rebuilds `coci_curation.json` from Supabase, so Supabase is the durable
  target; git-only stamps wouldn't survive (and the clean bijection means no
  per-row stamps are needed — the committed alias map is the rollback handle).

**Current state.** Z is live everywhere: Supabase (md5-verified), overlay
(0 UC-CUR / 4,053 Z), artifacts (4,053 Z rows, all `id_system` Unified, 0 leakage),
consumer + auditor recognition. **Deferred** (graceful, no runs scheduled): the
auto-merge mint → Z + the client-mint promote-step (option B's future-mint half —
new UC-CUR mints still work via dual recognition); the auditor re-run (Z rows show
no audit chip until `kb/_row_audit.py` re-runs + `latest.json` refreshes).

**Next.** Title-lane pass-2 dry-run (5,457 groups, on Sam's go); wire the auto-merge
mint → Z + the promote-step; per-row auto-merge revert; re-run the auditor.
