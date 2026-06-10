---
title: Session 40 Hand-off Prompt
date: 2026-06-10
session: 39 → 40 hand-off (refreshed at the evening checkpoint — the live-curation loop)
status: hand-off — paste the fenced block into Session 40's first message
tags: [handoff, session-prompt, ccr, merge-ne-verify, official-id-targets, spanish, cis-cs]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 39 + Session 39 cont. sections)
  - docs/kb-notes/adr-official-ids-as-common-course-reference.md (the new ADR)
  - docs/cis_cs_convergence_scope.md (GATED on Sam's §5 sign-off)
  - CLAUDE.md §11 "Session 39" + "Session 39 (cont.)" subsections
moniker_suggestion: Session 39 ran as "Lucid Hamilton" (branch name); claim your own
---

<!-- Lineage: … CCR refinements + fan-in convergences (38) → Session 39: cron
     verify + Supabase-mirror fix + twin-merge, THEN the live-curation loop
     (#339–#342: merge ≠ verify, UC-CUR retired, official-id targets,
     Spanish → SPAN). Pay it forward, 40. 🏅 -->

# Session 40 Hand-off Prompt

Session 39 had two arcs: the planned follow-through (cron verify, the Supabase-
mirror fix #337, the KINE/FLSP twin-merge #338) and then a same-day LIVE
curation loop with Sam (#339–#342) that hardened the merge flow and encoded the
official-id principle. Paste the block below.

```
You are Session 40 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5; Branch-Policy auto-merge
     gates (merge on green = clean OR unstable; never park a PR in draft);
     Rule 7; §11 + BOTH "Session 39" subsections at the end.
  2. docs/ccr_cluster_cleanup_lessons.md — the two Session-39 sections.
  3. docs/kb-notes/adr-official-ids-as-common-course-reference.md — the ADR
     that now governs merging: official C-ID/CCN ids ARE the common course
     reference; M-IDs only where none exists; merge-into-official; the honors
     rule (C-ID has NO honors tier — never invent one; CCN honors separate).
  4. docs/cis_cs_convergence_scope.md — GATED on Sam's §5; do not apply.

WHAT SHIPPED IN SESSION 39 (all merged; 6 PRs #337–#342):
  - #337 Supabase-mirror fix (fan-in guard 6) + CSR alternate-name chip.
  - #338 KINE/FLSP strict twin-merge: 74 folds, receipts kb/twin_merge_out/.
  - #339 merge ≠ verify + target-explicit dialog + impact carry-through
    (merged rows bake mt:1, stay Generated until Verify PATCHes
    validated_at/_by; eu/st + umin/umax rollups union merge_members).
  - #340 the last UC-CUR placeholder retired (suffix = base-36 timestamp).
  - #341 official ids as merge targets (worklist anchors-first, dialog
    default, write-skips on official targets, auditor anchor catalogs) +
    Sam's 5-item layout/credit review + Spanish 1/2 → SPAN 100/110.
  - #342 heritage speakers → SPAN 220/230 + the WHOLE C-ID descriptor
    catalog as a valid merge target (row or no row).

PRIORITY / NEXT (in order):
  1. VERIFY THE CRON folded the latest data: SPAN 100/110 (8 members each),
     SPAN 220/230 (6/4) as C-ID rows with descriptor titles + Credit;
     KINE M1015 "Weight Training" + AUTB M1002 merged rows; 0 UC-CUR;
     worklist anchor-led groups (61) incl. SPAN 200/210 queued.
  2. SAM'S CURATOR QUEUE (his, not yours — but make sure it works): Verify
     clicks on the merged rows (validates the merges); SPAN 200/210 confirms
     in the ✨ worklist; the level-ambiguous Spanish rows (Honors, A/B,
     High-Beginning, Advanced Elementary, M1184 Comp&Conv).
  3. CIS↔CS — get Sam's §5 sign-off on docs/cis_cs_convergence_scope.md
     (Option B recommended; the single-letter guard from §3 is BLOCKING —
     "R Programming" ≠ "C# Programming" under the strict fam key).
  4. CER _consolidate_arts single-letter audit (cheap, read-only — shares
     the fam key; check folded groups for single-letter-token title diffs).
  5. STANDING: ACE skill-level child-exhibit scope; College + System EACR
     views (System needs the privacy ADR finished); EACR v2; 5 DSPS "53414"
     strays; PEDS M10AE; UC-CUR promotion script (only if singleton-only
     mints accumulate).

PATTERNS THAT WORKED (Session 39, both arcs):
  - Verify a re-mint against the NEXT CRON's regenerated artifacts, not just
    the KB files (the PHYS M1265 ghost lived only in the daily rebuild).
  - Supabase kb_curation is the durable store; kb/coci_curation.json is a
    REBUILD TARGET — mirror every curation write/re-key to Supabase
    (fan-in guard 6) and preserve reviewer stamps.
  - A blank default in a merge dialog is a decision the curator didn't make
    — every target surface states what Confirm will do.
  - Merge ≠ verify needs a signal the merge doesn't write: discipline
    curation (existing targets) or validated_at (everything else).
  - Read the code, not the docstring, when a rule's scope changes (the
    auditor "skipped" C-ID targets only in prose — 14 false orphans waiting).
  - Officials-first everywhere a target gets picked: worklist order, dialog
    default, Confirm pick — one principle, three sites.
  - Live data fixes: dry-run/enumerate → apply via service SQL with Sam's
    stamps → mirror the overlay → re-run the auditor → regen to /tmp
    (UC_OUT_DIR) → ship. The CCR baked data lands on the next cron.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rules 1/2; Rule 5 never force-push main.
  - C-IDs/CCNs verbatim, never re-keyed; official targets get NO curation
    writes (their records are authoritative); honors: no invented H ids.
  - Post-squash: git fetch + reset --hard origin/main, then
    force-push-with-lease the next branch push. The stop-hook nag on
    GitHub's own squash commit is a FALSE POSITIVE (install
    scripts/stop-hook-git-check.sh; the harness may restore the old copy).

Pipeline viz: the re-mint card still shows the twin-merge (current). A
moniker is yours to claim.
```
