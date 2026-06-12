---
title: Session 50 Hand-off Prompt (data lane)
date: 2026-06-12
session: 47 → 50 hand-off (written at the Session-47 close — Bruh Supernova; 48 was the parallel First Light sprint, 49 is reserved for the retheme lane via docs/session_49_handoff.md)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, csr, ccr, subj4-fold, apply, todo-feed]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 47 — the full story)
  - docs/kb-notes/methodology-subj4-consumer-semantics.md (the durable lesson)
  - kb/subj4_dryrun/report.md (the apply's review material)
moniker_suggestion: Session 47 was "Bruh Supernova" (Sam's coinage); claim your own
---

# Session 50 Hand-off Prompt — the data lane

Session 47 ran the CSR/CCR data lane while Session 48 ran First Light/design
in parallel (clean composition; we co-edited the To-Do feed). Two lanes are
live: the RETHEME lane reads `docs/session_49_handoff.md`; THIS prompt is the
data lane. Paste the block below.

```
You are Session 50 on the CPL Project Tracker (the DATA lane — the retheme
lane has its own handoff at docs/session_49_handoff.md; coordinate via
kb/cpl_todos.json and sequence unified_courses.js edits, don't race them).
Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5/7; Branch-Policy
     auto-merge gates (merge on green = clean OR unstable; never park a PR
     in draft); §11 + the "Session 47" and "Session 48" subsections (46 and
     earlier → docs/roadmap_archive.md).
  2. docs/ccr_cluster_cleanup_lessons.md — Session 47 section.
  3. docs/kb-notes/methodology-subj4-consumer-semantics.md.
  4. kb/subj4_dryrun/report.md — the fold dry-run you'll be applying.

WHAT SHIPPED IN SESSION 47 (4 PRs, all 2026-06-12):
  - #388 the CSR "✓ Check SUBJ ⇄ CCR" sweep + live Common SUBJ feedback
    (collision-free suggestion chips, confirm-on-collision). Sam cured all
    11 shared Common SUBJ codes the same morning.
  - #402 alias-family awareness (the THEA false positive — Drama/Theater
    Arts ↔ its alias both deliberately THEA; the needless DRAM re-code was
    reverted in kb_curation with an intent note, Sam's call).
  - #389 the 📋 To-Do button on every tab (kb/cpl_todos.json = the handoff
    distilled; Rule-8 checkpoint item 9; check-offs reset on _as_of bump).
  - #405 the SUBJ4 fold DRY-RUN: seed synced from live curation,
    _subj4_dryrun.py taught umbrella allowances (it predated them — was
    folding FL** back to FLNG and ATHL into KINE, bursting KINE M1###'s
    999-seq cap). 71,710 M-IDs → 10,974 re-keys (2,254 minted + 8,720
    stand-alones), 60,063 no-change, 95 umbrella off-code surfaced, 5/5
    validation gates PASS.

PRIORITY / NEXT (in order):
  1. THE FOLD APPLY (Rule-7 playbook — the big one). Sam approved the plan:
     - Build kb/_subj4_apply.py off the dry-run's allocator (the dry-run is
       the spec; Phase-1e precedent: the 2026-05-23 "386 vanished rows"
       lesson is already encoded as V4 + suffix pre-reservation).
     - FRESH-READ kb_curation at write-time (MCP execute_sql json_agg
       export — container egress to Supabase REST/api.github.com is
       BLOCKED; the one-minute cron-race on the THEA revert proves why
       fresh-read is mandatory).
     - The 19 curated-collision buckets in report.md are the operator
       approval — surface them, get Sam's nod (or re-verify deterministic
       assignments), then land ATOMICALLY in one cron window (10:17 UTC):
       minted + singletons + memberships + articulations + curation keys +
       Supabase kb_curation mirror (the Session-39 resurrection lesson).
     - BUNDLE the statewide twin-merge re-run (Sam-approved): post-fold,
       same-discipline twins under one SUBJ4 become key-equal — run
       kb/_apply_twin_merge_statewide.py in the same receipted window so
       zero-judgment merges never hit the queue.
     - Post-apply chain, NONE SKIPPABLE: register alias map in
       _rekey_promotions.py ALIAS_MAPS + --apply; re-seed CSR; re-run
       kb/_row_audit.py (collision-signal 1,206 → ~0 is the receipt);
       re-run BOTH consolidation receipts (desc + title); regen artifacts
       (prefer the post-merge workflow_dispatch). Consider writing the
       chain driver script (kb/_post_apply_chain.py) FIRST — Sam liked it.
  2. CCR SUBJECT-DROPDOWN GROUPING (Sam yes'd, unbuilt): one uc-subj
     filter, three optgroups — "Common subjects ✓" (canonical/umbrella,
     from the seed the CSR already fetches) / "Official C-ID & CCN" (id
     anchor rows' subjects not claimed as a canonical) / "Local-derived
     (awaiting fold)" (the rest — post-apply this group ≈ empties, a live
     fold progress meter). Values stay bare codes (passes() unchanged);
     rebuild options in place when the lazy seed arrives, preserve
     selection; fail-soft flat list on 404; jsdom test. Sequence around
     the retheme session if it's restyling chips in unified_courses.js.
  3. CLEANUPS: ARTS M1201 curated discipline "Ceramic Technology" isn't an
     MQ name (vocab stray); the 95 skip_umbrella_offcode rows (FL/KINE
     review); the cron's canonical-sync step is "|| echo non-fatal" —
     it failed/skipped silently for weeks (CIS=CSIS sat in Supabase since
     5-23 while the seed said CISC) — make it loud or alert on drift.
  4. STANDING: CIS↔CS scope (Sam's distinct codes lean NO-convergence —
     confirm + close); C-ID router Phase 2 + 3b; twin-merge termly cadence;
     smog residuals + 🏷 5,584 / 📝 416 queues (curator); CER statewide
     bucket; EACR College/System views (privacy ADR).

PATTERNS THAT WORKED (Session 47):
  - variants_observed in the CSR seed is the perfect grain for SUBJ⇄CCR
    checking — already client-side, refreshed at every re-seed.
  - Verify "is it done?" against LIVE state (seed ⊕ kb_curation via MCP),
    never the committed seed alone — it's eventually-consistent.
  - Diagnostics must know about deliberate convergences (alias families,
    umbrellas) or they push wrong cures to a diligent curator.
  - Let the first dry-run fail and read its damage (FL fold-back + KINE
    overflow both surfaced that way).
  - Two parallel sessions compose fine through small sequential PRs + the
    To-Do feed as the message bus.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rule 5 never force-push main; C-IDs/CCNs
    verbatim; merge ≠ verify; the twin tier's conditions are a CONTRACT.
  - Any curation re-key MUST mirror to Supabase kb_curation in the same
    operation; fresh-read at write-time; atomic within one cron window.
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into context.
  - The To-Do feed: bump _as_of on refresh, DELETE done items, keep ≤12.

Pipeline viz: refreshed (the Session-47 card headlines the dry-run in BOTH
HTMLs). The 📋 To-Do feed is current as of this checkpoint. A moniker is
yours to claim.
```
