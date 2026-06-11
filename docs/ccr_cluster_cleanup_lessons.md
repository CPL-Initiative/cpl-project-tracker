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
