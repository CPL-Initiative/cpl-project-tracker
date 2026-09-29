---
title: Session 51 Hand-off Prompt (data lane)
date: 2026-06-12
session: 50 → 51 hand-off (written at the Session-50 close — Bruh Dawnleader; the retheme lane reads docs/session_49_handoff.md)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, ccr, csr, subj4-fold, post-fold, subject-dropdown]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 50 — the full apply story)
  - docs/kb-notes/methodology-apply-equals-spec-via-shared-allocator.md (the durable pattern)
  - kb/subj4_fold_out/2026-06-12/ (the apply receipts + rollback inverse)
moniker_suggestion: Session 50 was "Bruh Dawnleader"; claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 51 Hand-off Prompt — the data lane

Session 50 APPLIED the canonical-SUBJ4 fold (Session 47's dry-run #405) —
the largest re-key since 2026-05-23 — plus the bundled post-fold twin pass,
the full Rule-7 chain, and the Supabase mirror, all in one evening cron
window. Paste the block below.

```
You are Session 51 on the CPL Project Tracker (the DATA lane — the retheme
lane has its own handoff at docs/session_49_handoff.md; coordinate via
kb/cpl_todos.json and sequence unified_courses.js edits, don't race them).
Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5/7; Branch-Policy
     auto-merge gates (merge on green = clean OR unstable; never park a PR
     in draft); §11 + the "Session 50" and "Session 48" subsections (47 and
     earlier → docs/roadmap_archive.md).
  2. docs/ccr_cluster_cleanup_lessons.md — Session 50 section.
  3. docs/kb-notes/methodology-apply-equals-spec-via-shared-allocator.md.
  4. kb/subj4_fold_out/2026-06-12/report.md — what executed.

WHAT SHIPPED IN SESSION 50 (one PR, 2026-06-12 evening):
  - THE FOLD APPLIED: 71,037-alias simultaneous permutation, 48,820 id
    moves (10,974 SUBJ4 re-keys + within-bucket re-sequencing — fate
    no_change can still move the NUMBER; never iterate the map), across
    minted + singletons + memberships + articulations + curation, with
    _subj4_fold_from stamps on every moved row.
  - kb/_subj4_apply.py REBUILT (recompute-at-apply via the dry-run's own
    compute_plan(); P1 byte-fidelity to the frozen reviewed plan; P3
    fresh-read gate; G1–G8 conservation). kb/_post_apply_chain.py NEW.
  - SUPABASE MIRRORED in-window: 119 kb_curation ops, single transaction,
    PK-order simulated first (0 transient collisions), post-write md5 ==
    derived expectation, overlay rebuild == committed file (next cron
    sync = content no-op).
  - POST-FOLD TWIN PASS (--tag=postfold): +19 newly-key-equal twins
    absorbed → 15,535 parents. 65 guard-skips all correct holds.
  - THE CHAIN: promotions 1,678 re-keyed / 0 unresolved / V5 stamp-gate
    clean (now reads _subj4_fold_from when the fold map is pending); CSR
    re-seeded (148/148, picks preserved); audit refreshed; desc 415 +
    title 5,581 receipts re-run; fold-verify re_key 0.
  - RECEIPTS: subject_collision_signal 1,206 → 3 (the residual trio =
    cross-discipline curated re-keys ARTH M1022 + BUSI M9038/M9039 —
    baseline file discipline ≠ curated discipline; the rule reads
    baseline; honest flags, documented); mid_id_off_scheme 2 → 1
    (F M1002; N M9001 folded to SOCS M9003). Suite 34/34 — the
    uc_title_lane pins are now MECHANISM-style (titles + pointer
    convergence; id pins assert the wrong row under slot reuse).
  - Workflow: the canonical-sync step now emits ::warning:: on failure
    (was silent-for-weeks behind a bare || echo).

PRIORITY / NEXT (in order):
  1. VERIFY THE REGEN + THE NEXT CRON. Session 50 merged the code+KB PR
     and dispatched daily-dashboard.yml (artifact policy — the runner
     publishes unified_courses_*.js). Check: CCR rows wear canonical
     SUBJ4s (Subject(s) column ≈ one code per discipline outside
     umbrellas); audit chips line up (toolbar count == latest.json);
     impact columns (eu/st) intact; the era-guard banner offered reloads
     on stale tabs; suite still 34/34 against the NEW artifacts (the
     title-lane test was pre-verified against the fresh receipt era, but
     confirm). Then stamp-normalized-hash the NEXT daily cron (expect
     byte-stable mod stamps — the Session-43 method; remember the two
     generated_at formats).
  2. CCR SUBJECT-DROPDOWN GROUPING (Sam yes'd, unbuilt — carried from the
     S50 handoff): one uc-subj filter, three optgroups — "Common subjects
     ✓" (canonical/umbrella, from the seed the CSR already fetches) /
     "Official C-ID & CCN" (anchor-row subjects not claimed as canonical) /
     "Local-derived (awaiting fold)" — POST-FOLD this third group should
     be ≈ EMPTY, which is now the live progress meter (residuals: the 95
     umbrella-offcode rows + 577 blank-discipline + F M1002). Values stay
     bare codes (passes() unchanged); rebuild options in place when the
     lazy seed arrives, preserve selection; fail-soft flat list on 404;
     jsdom test. Sequence around the retheme session's unified_courses.js
     chip work.
  3. CLEANUPS: ARTS M1201 curated discipline "Ceramic Technology" is not
     an MQ name (fate skip_unknown_disc — the row kept its old key; cure =
     re-curate to an MQ discipline in the CCR, it folds next pass);
     the 95 skip_umbrella_offcode rows (FL/KINE per-umbrella review);
     OPTIONAL: teach _classify_subject_collision/_build_disc_to_modal_subj4
     the curation overlay so the 3 residual flags clear (worth it only if
     cross-discipline curation grows).
  4. STANDING: CIS↔CS scope (Sam's distinct codes — CSIS vs CISC — lean
     NO-convergence; confirm + close); C-ID router Phase 2 + 3b; twin +
     desc + title receipt cadence is TERMLY together (guards upgrade once
     → re-run all three); smog residuals (now AUTO M11CR/M11CT/M11NL +
     noncredit M9052/M90AK) + 🏷 5,581 / 📝 415 queues (curator); CER
     statewide bucket; EACR College/System views (privacy ADR);
     cluster_blanks_when_aggregatable is at 14 — the parked Phase 1b
     repair-from-members action's "build when ≥5" bar is met if curator
     demand appears.

PATTERNS THAT WORKED (Session 50):
  - Recompute-at-apply through the dry-run's OWN compute_plan() + a
    byte-fidelity gate against the frozen reviewed plan — fresh inputs AND
    the operator's approval, simultaneously (the KB note).
  - Simulate mirror-op order against the live PK before executing; verify
    post-write by checksum AND by rebuilding the overlay from a fresh
    export (it must equal the committed file).
  - Plan on throwaway copies, write from pristine reloads — curated
    disciplines must never bake into the KB baseline.
  - Test pins under slot reuse: assert TITLES + pointer convergence, not
    ids (a vacated id is re-occupied by an unrelated course at the next
    regen); cross-check new assertions against BOTH artifact eras before
    shipping.
  - The receipt-dir collision check (--tag=postfold) — a same-day re-run
    must never overwrite a receipt already registered in ALIAS_MAPS.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rule 5 never force-push main; C-IDs/CCNs
    verbatim; merge ≠ verify; the twin tier's conditions are a CONTRACT.
  - Any curation re-key MUST mirror to Supabase kb_curation in the same
    operation; fresh-read at write-time; atomic within one cron window.
  - An alias map is a simultaneous permutation — apply each map ONCE,
    chronologically, era-stamped; validate against per-row stamps
    (_subj4_fold_from is the fold's; _subj4_remint_from is 2026-05-23's —
    never cross eras, slot reuse collides them).
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into context.
  - The To-Do feed: bump _as_of on refresh, DELETE done items, keep ≤12.

Pipeline viz: refreshed (the Session-50 card headlines the applied fold in
BOTH HTMLs). The 📋 To-Do feed is current as of this checkpoint. A moniker
is yours to claim.
```
