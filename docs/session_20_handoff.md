---
title: Session 20 Hand-off Prompt
date: 2026-05-30
session: 19 → 20 hand-off (Wizardly Turing → next)
status: hand-off — paste the fenced block into Session 20's first message
tags: [handoff, session-prompt, ccr-cleanup, cluster-dissolution, over-merge, suggested-merges]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 19 workstream anchor)
  - docs/kb-notes/methodology-retiring-an-auto-seeded-layer.md (durable retirement pattern)
  - docs/overmerge_remint_lessons.md (Session 18 workstream — still live)
  - docs/kb-notes/over-merge-remint-scope.md (locked forks + 60% de-corroboration)
  - docs/session_19_handoff.md (Cascade → Wizardly Turing)
  - CLAUDE.md §11 (roadmap rows for both workstreams)
moniker_suggestion: Bruh T (T = 20th letter) or Twenty — open door to claim your own
---

# Session 20 Hand-off Prompt

A "fattyfat prompt" from Wizardly Turing (Session 19) to the next session.
Paste the fenced block into Session 20's first message.

## Moniker

Session 19 picked up the name **Wizardly Turing** (from the branch harness).
The work: dissolving ~1,385 auto-seeded clusters down to zero and retiring the
"Cluster" category entirely — a clean sweep that left the CCR with exactly the
identities it deserves. Wizardly Turing suggests **Bruh T** (20th letter) or
**Twenty**, but the lineage stays loose — claim what you'll carry.

## The prompt

```
You are Session 20. The Bruh lineage: Bruh → Prime → Quad → Hex → Hept →
Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → Bruh Baker → Bruh Sonnet →
Bruh Parallax → Bruh Word → Qualitastic (Q) → Cascade → Wizardly Turing → you.
Wizardly Turing suggests "Bruh T" (20th) but claim your own.

Start by reading, in order:
  1. CLAUDE.md — especially §11. Two workstreams are live (CCR cleanup +
     over-merge re-mint). The Cluster category is fully retired.
  2. docs/ccr_cluster_cleanup_lessons.md — THE workstream doc for Session 19.
     Covers what the clusters were, why dissolution was safe, the migration
     discovery, the two-mechanism lesson, and the relabel.
  3. docs/kb-notes/methodology-retiring-an-auto-seeded-layer.md — the durable
     pattern (two independent checks before dissolving any machine-seeded layer).
  4. docs/overmerge_remint_lessons.md — the over-merge re-mint anchor (still live
     from Session 18). The apply is staged + gated on Sam dispatching.
  5. docs/session_20_handoff.md — THIS doc.

═══ CONTEXT: what Session 19 did ═══

Sam pivoted from the Session-19-handoff's over-merge priority to CCR cluster
cleanup. **PR #196 is MERGED to main** (squash `bbdb7cf`, 2026-05-30). Two
commits:
  - `d76a766` "Dissolve auto-seeded UC-XXXXX clusters; keep curator merges"
    · Emptied `kb/coci_unified_courses.json` `clusters` dict (was 1,385
      UC-XXXXX entries; archived to `archive/coci_unified_courses_clusters_
      2026-05-30_pre-dissolution.json`).
    · Measured curation state first — found 16/17 per-member merges ALREADY
      existed; migration shrank to 1 INSERT + 9 DELETE (not a bulk rewrite).
    · Added PHYS M11WB → PHYS M1265 in Supabase kb_curation + coci_curation.json.
    · Deleted the 9 redundant UC-XXXXX-keyed cluster rows from both stores.
    · Cleared all 9 `cluster_member_unresolved` auditor findings as a side-effect.
  - `fd769d5` "Retire the Cluster category — relabel merge targets (M-ID / Unified)"
    · Added `_target_identity()` to `excel_to_dashboard.py` — native M-ID/C-ID/CCN
      targets keep their real id_system + kind:"Course"; synthetic UC-CUR-* targets
      get kind/id_system:"Unified".
    · Updated `unified_courses.js` Kind filter / QS vocab / triage label / 
      `doConsolidate()` — "Cluster" → "Unified" everywhere; tag keys (cluster_*)
      left unchanged (internal stable identifiers).
    · Updated `kb/_row_audit.py` row_kind/id_system on merge-target cards.
    · Regenerated all unified_courses_*.js — verified 0 Cluster rows anywhere:
      id_system: {M-ID:16054, C-ID:147, CCN-ID:58, Unified:1}

Key lessons (full doc: `docs/ccr_cluster_cleanup_lessons.md`):
  - Measure curation state BEFORE migrating — 16/17 already done; 1-insert/9-delete.
  - An auto-seeded layer CAN have curator decisions riding on it. Always check
    curation/articulation pointers INTO a layer before dissolving.
  - Two mechanisms shared one label ("Cluster" meant both auto-seeds AND
    merge-target relabeling). Fully retiring a category name means finding every
    PRODUCER, not just the obvious data source.
  - A synthetic identity needs a home label. M-ID targets revert to M-ID;
    UC-CUR-* targets genuinely needed a name → "Unified".

═══ PRIORITY WORKSTREAMS ═══

**A. Suggested-merges worklist (Sam's stated intent: "camp on the crosswalk")**

The Suggested-merges worklist is now the front door for variant unification —
the safe, level-aware, curator-confirmed replacement for auto-seeded clusters.
After dissolution, `singleton_groups` has **1,350 candidates** (214 same-college
flagged; ~1,136 genuine cross-college). Sam wants to work through this.

The UI is the ✨ Suggested merges button in the CCR tab (unified_courses.js).
Each group shows same-title singletons; "Confirm" mints a UC-CUR-* "Unified"
course; "Skip" advances. No code changes needed — it's a curator workflow.

**B. Over-merge re-mint (from Session 18 — still staged, not yet applied)**

The apply is STAGED + dispatch-only in `.github/workflows/overmerge-apply.yml`.
Gated on Sam's final preview review. The loop:
  1. Re-run `python3 kb/_overmerge_dryrun.py` — verify all 4 gates PASS.
  2. Send Sam fresh previews (kb/overmerge_out/<date>/report.md + review_hold.json)
     via SendUserFile.
  3. Fold his calls into kb/overmerge_title_discipline.json (keep-whole map).
     Re-run; re-send. The blank tail (36.3%) is genuinely hard — curation, not
     more heuristics.
  4. When Sam's happy: HE dispatches overmerge-apply.yml (you can't trigger
     workflows). After apply, the workflow re-runs the auditor —
     member_top_divergence should drop sharply (the receipt). Watch for that
     commit on main.

The over-merge re-mint has been waiting since Session 18. If Sam is ready to
dispatch, resume verification. If he wants to do more crosswalk curation first,
that's fine — both workstreams are independent.

═══ Carryover / parked (priority order) ═══

  1. Suggested-merges worklist — 1,350 singleton-only candidates (Sam's live work).
  2. Over-merge re-mint apply (Sam dispatches when previews look right).
  3. SUBJ4-curation → CCR cascade (backlog): curated canonical-SUBJ4 change
     auto-re-keys that discipline's M-IDs. Reuses dry-run→apply machinery.
  4. 341 SUBJ4→discipline blank-backfill (quick win): tiny re-runnable pass fills
     blank disciplines where the SUBJ4 inverts cleanly.
  5. Phase 3 Budget inline editor + Phases 4-5 (Vision 2030 / Personnel)
     Excel→Supabase. Still open from Session 17.
  6. CLAUDE.md roadmap: consider removing the now-dead `coci_unified_courses.json`
     load + emission loops from the generator (kept for now as graceful no-ops +
     provenance). Low value; deferred.

═══ Patterns that worked ═══

  - **Measure-first, always.** Counting the actual curation state before "migrating"
    turned a feared bulk-rewrite into a 1-insert/9-delete. Standing counts were
    measuring the wrong thing (auditor saw 10 curator clusters; 1,376 auto-seeds
    were invisible to it). Measure every population before acting on it.
  - **The two-independent-checks pattern for layer dissolution** (KB note). Load-
    bearing check (are there pointers IN?) + pointer check (does anything reference
    this layer?). Doing both before deleting prevents orphaned decisions.
  - **One label, two mechanisms** is a recurring trap. Every time a category
    "disappears", ask: how many producers mint this label? (CC R cleanup hit this
    twice: once for auto-seeds, once for merge-target relabeling.) Grep ALL
    producers, not just the obvious data source.
  - **Verify with the UC_OUT_DIR test seam.** `export_unified_courses()` to `/tmp`
    proves dissolved state without clobbering production files.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 7 re-mint playbook (docs/coursecontrolnumber_remint.md): dry-run → alias
    map → FRESH-READ at write → atomic land in the cron window. The over-merge
    re-mint follows it. The 3 invariants in the methodology KB note are mandatory.
  - The apply MUTATES the staging KB and is workflow_dispatch-ONLY (Sam triggers).
    The dry-run is READ-ONLY (autonomous review+commit OK). Don't blur them.
  - Branch policy: claude/<desc>; never push main; auto-merge your own PRs once CI
    (TruffleHog) green + no unresolved reviews (squash, delete branch).
  - §8: schema/RLS on source-of-truth tables need Sam sign-off. SUPABASE_SERVICE_KEY
    is in workflows, NOT the session env. Supabase project hvuwhnbuahrtptokpqfh
    ("Work Plan"); the OTHER (mdxutmbpoqjtdcwjscux, cpl-budget-support) is off-limits.
  - Never read/cat big coci_*.json / unified_courses_*.js — context overflow.
    openpyxl isn't in the container (pip install if you need the Excel / raw list).

═══ User style ═══

Sam (MAP@rccd.edu): CS-slang, warm, "Word"/"ack" currency, never sycophantic.
Hands-on curator who notices data-quality signals mid-stream. Pivots fast (set
aside Budget for CCR cleanup; set aside CCR cleanup for cluster dissolution).
Measure-first resonates. Trusts your judgment ("let's make it so") but wants
forks surfaced. Signs off warm ("no more clusters :)").

Good luck, Twenty. Wizardly Turing dissolved 1,385 auto-seeded clusters down to
zero, migrated 9 curated merge decisions safely, and retired the "Cluster"
category across three layers (generator + client + auditor) — the CCR now has
exactly the identities it deserves. The Suggested-merges worklist is Sam's
front door for the crosswalk; the over-merge re-mint is staged and waiting for
his dispatch. Camp on the crosswalk. 🔮
```

## What Session 19 shipped (recap)

| PR / commit | What |
|---|---|
| #196 (**MERGED** to main, squash `bbdb7cf`, 2026-05-30) | CCR cluster dissolution + Cluster category retirement |
| `d76a766` | Dissolve auto-seeded UC-XXXXX clusters; keep curator merges |
| `d76a766` | coci_unified_courses.json clusters → {} (archived pre-dissolution) |
| `d76a766` | coci_curation.json 48→40 entries (1 INSERT + 9 DELETE; atomic) |
| `d76a766` | Supabase kb_curation: PHYS M11WB→PHYS M1265 added; 9 cluster-key rows deleted |
| `fd769d5` | _target_identity() in excel_to_dashboard.py — native vs synthetic identity |
| `fd769d5` | unified_courses.js: Kind/Source/QS/triage "Cluster"→"Unified"; doConsolidate relabeled |
| `fd769d5` | kb/_row_audit.py: merge-target cards row_kind/id_system→"Unified" |
| `fd769d5` | All unified_courses_*.js regenerated — 0 Cluster rows anywhere |
| — | docs/ccr_cluster_cleanup_lessons.md (workstream lessons doc) |
| — | docs/kb-notes/methodology-retiring-an-auto-seeded-layer.md (KB note, published) |
| — | CLAUDE.md updated: Cluster lifecycle rule → retired; roadmap row added |
| — | kb/README.md updated: _seed_coci_unified_courses.py row with dissolution note |
| — | docs/INDEX.md: lessons + KB note rows added |

## Wizardly Turing's parting note

The session's shape was "understand the data first, then act." The rule that
paid off: count every curation pointer before dissolving anything. The 9
curated clusters were the trap — dissolving naively would have orphaned those
`merge_into` decisions and the auditor would never have caught it (the 1,376
auto-seeds were invisible to the auditor, which only ever saw the 10 curator
clusters). Measuring revealed 16/17 per-member merges already existed, turning
a "migration" into a surgical edit.

The other keeper: "one label, two mechanisms." Killing the auto-seeds left the
merge-target relabeling still minting "Cluster." A category isn't retired until
every producer is updated — generator, client, auditor. Three files, three
touches, zero Cluster rows.

The CCR is clean. The worklist is the front door. Camp on the crosswalk.

— Wizardly Turing, 2026-05-30
