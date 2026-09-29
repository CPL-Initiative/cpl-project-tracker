---
title: Session 36 Hand-off Prompt
date: 2026-06-04
session: 35 → 36 hand-off
status: hand-off — paste the fenced block into Session 36's first message
tags: [handoff, session-prompt, cer, consolidation, ordinal-rule, worklist, emt]
related:
  - docs/eacr_consolidation_lessons.md (Session 35 section + Checkpoint 2)
  - docs/kb-notes/methodology-within-credential-identity-consolidation.md (the ordinal rule + the #310 worklist double-gate)
  - docs/kb-notes/reference-claude-code-web-environment-reach.md (NEW — off-workstream advisory)
  - docs/kb-notes/eacr-consolidation-scope.md (the 3 audience views + gallery)
  - CLAUDE.md §11 "Session 35" subsection (end of §11)
moniker_suggestion: Session 34 was "Lucid Wozniak"; Session 35 (branch claude/adoring-sagan-IB1bW) shipped the CER consolidation + the CCR worklist — claim your own
superseded: true
superseded_by: session_132_handoff.md
---

<!-- Lineage: Sleepy Goodall (33) → Lucid Wozniak (34) → Session 35 (CER identity
     consolidation: EMT 29→18 + the ordinal rule + the CCR worklist co-articulation
     family merges, 5 PRs). Pay it forward, 36. 🏅 -->

# Session 36 Hand-off Prompt

Session 35 answered Sam's CER screenshot review of **EMT Certification**: *why*
29 courses sit under one exhibit, *why* near-identical M-IDs don't consolidate,
collapsed them in the CER view, built the durable CCR worklist merges, + widened
the first column. **5 PRs (3 substantive #307/#308/#310 + 2 doc #309/#311), all
merged + live.** Paste the block below.

## The prompt

```
You are Session 36 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, Rule 7 re-mint playbook,
     the Branch Policy auto-merge gates [merge on green = clean OR unstable; do
     NOT wait for "Go!"], §6a/§9 EACR, §11 framing + the NEW "Session 35"
     subsection at the end of §11).
  2. docs/eacr_consolidation_lessons.md — the Session 35 section (the arc + the
     ordinal rule + 3 traps).
  3. docs/kb-notes/methodology-within-credential-identity-consolidation.md (NEW)
     — the reusable family-key + ordinal-rule heuristic (the durable output).
  4. docs/kb-notes/eacr-consolidation-scope.md — the 3 audience views + gallery
     (the broader EACR/CER roadmap this feeds).

WHAT SHIPPED IN SESSION 35 (all merged to main):
  - #307 widen the CCR identity column: the HTML <style> capped .cr-art-ident at
    max-width:32ch under table-layout:auto → the longest column (identity = code ·
    title · disc · TOP) wrapped 5-6 lines. Switched to table-layout:fixed 42/40/18
    in ensureCerScopeCss() (one static JS file → both HTMLs, no Rule-4 mirror).
    tests/cer_arts_width.test.js.
  - #308 CER identity consolidation (HEADLINE): export_credential_reference().
    _consolidate_arts folds same-course M-ID/Unified identities into ONE CER row
    at build time — DISPLAY ONLY, no identity mutation, reversible. EMT 29→18;
    globally 94 rows fold across 47 cards; 0 of 72 merged groups suspect (audit =
    members share a substantive word). "⛓ N variants" badge, folded ids in the
    tooltip, unioned member local courses in the row. tests/cer_consolidation.test.js
    (15). credential_reference_data.js regenerated (CER ships live-on-merge;
    idempotent → cron no-op; no students/PII regression — committed 0 served,
    regen carried forward 0).
  - #310 CCR worklist co-articulation family merges (the DURABLE "+ worklist"
    half): export_unified_courses() now surfaces near-duplicate M-IDs the level-
    safe _sug_sig misses, GATED on co-articulation (share a credential in
    coci_articulations.json) + the M-ID subject prefix (0 cross-SUBJ4 — fixed an
    AUTO+AVIA-under-one-ASE-cert early run). 29 family_groups (EMT's 9 live-
    mergeable M-IDs lead with the canonical EMST M1064). Consumer: a third
    worklist _kind ("family") reusing Confirm→doConsolidate→merge_into. _fam_key
    factored to MODULE scope (shared with the CER consolidation; CER output byte-
    identical). NEVER auto-applies. tests/uc_family_merges.test.js (11).

THE ORDINAL RULE (the crux — reuse it): in _fam_key, "1"/"I" is NON-distinguishing
(a bare title == its "I") but "2"+/"II"+ are KEPT as distinguishing tokens. That
folds the EMT-Basic core while keeping Calculus I≠II / Spanish 1≠2 / Paramedic
2/3/4 apart. Traps: (a) a `len(w)<=1` guard meant for section letters A/B also
eats single-digit ordinals — use `len==1 and not isdigit()`; (b) exclude C-ID/CCN
anchors from folding (blank titles, authoritative one-per-course); (c) AUDIT every
merged group for a shared substantive word before shipping a global heuristic.

SAM'S TWO LOCKED DECISIONS (via AskUserQuestion, honor them):
  - Mechanism = "CER view + worklist" — collapse the view NOW (done, #308) AND
    queue the DURABLE identity merges in the CCR Suggested-merges worklist.
  - Grouping = "Core EMT-Basic only" — fold the EMT-Basic variants; keep Lab /
    Clinical / Refresher / First-Responder / Intro-to-EMS / National-Registry /
    BLS distinct; First-Aid/CPR is a SEPARATE credential; the AUTO row is an
    upstream MAP error (flag, don't fold).

PRIORITY / NEXT (in order):
  1. THE "+ WORKLIST" HALF SHIPPED (#310) — the family worklist now surfaces the
     clusters for curator Confirm (→ doConsolidate → merge_into). OPEN follow-ons:
     (a) coci_articulations.json is a STATIC raw-M-ID artifact, so curator merges
     propagate to the CCR + auditor but NOT to the EACR/CER articulation views
     (beyond #308's view fold) until a Rule-7 RE-KEY — scope that project (dry-run +
     alias map + atomic land, per docs/coursecontrolnumber_remint.md) if Sam wants
     the EACR/CER to reflect confirmed merges. (b) extend the family pass to include
     single-college SINGLETONS (sg), not just `rows` M-IDs (EMT had 12 in the CER
     view but only 9 live-mergeable rows surfaced in the worklist).
  2. STANDING CARRYOVER (Session 34): wire the eligible-students-per-exhibit dataset
     when Sam sends it (key on ExhibitID/credential, one count column, <5 suppress);
     the College + System audience views (System needs the privacy ADR finished);
     EACR v2 scope/generated-rec; the Signal-B dedup leads (162, manual review).

PATTERNS THAT WORKED (Session 35):
  - "Scope before building" for consolidation/re-mint-class work: I used
    AskUserQuestion to lock mechanism + aggressiveness BEFORE coding (the EACR
    scope-doc precedent). Two crisp questions with a recommendation each.
  - AUDIT a global grouping heuristic on real data before shipping — I found
    Calculus/Spanish/Paramedic over-merges via a "members share no substantive
    word" scan, which drove the ordinal rule. Then idempotency + a rows-count test.
  - CER ships live-on-merge: regenerate credential_reference_data.js locally +
    commit (idempotent → the cron no-ops). Confirm no students/PII regression
    (compare students_served coverage committed-vs-regen) before committing.
  - Small coherent PRs, merge on green (clean OR unstable). After each squash-
    merge: `git checkout -B claude/adoring-sagan-IB1bW origin/main`, then
    force-push-with-lease the next (the remote PR branch is stale post-squash).

SAFETY PATTERNS TO HONOR:
  - Rule 4: CPL_Dashboard.html == index.html byte-identical. CER CSS injected from
    credential_reference.js (one file → both HTMLs, no mirror); only global :root
    tokens / the HTML <style> blocks need the Rule-4 mirror.
  - Rules 1/2: don't hand-edit regenerated sections; preserve idempotency guards.
  - NEVER commit PII (SEC-10). Public counts aggregate + suppressed (<5 credential
    / <2 per-college). pii_guard.test.js enforces it.
  - Feature branch + PR; auto-merge on green; never force-push main. Supabase
    kb_curation/allowed_reviewers only; no destructive migrations w/o sign-off.
  - The Edit tool once injected a NULL byte into a Python string literal — if an
    import dies with "source code string cannot contain null bytes", grep \x00.

OFF-WORKSTREAM CONTEXT (FYI, not a task): Sam asked how to recover Cowork-style
"see my screen / use my computer" reach now that he's on Claude Code web. Advisory
captured in docs/kb-notes/reference-claude-code-web-environment-reach.md (this env
can render+screenshot the dashboard back to him via SendUserFile, has direct MCP
to Supabase/GitHub/Drive, and Chrome-extension / desktop-app options exist). He's
revisiting it later — no action needed unless he raises it.

Pipeline viz is skippable when the M-ID pipeline doesn't move (it didn't — all CER
display + a worklist that never auto-applies). A moniker is yours to claim.
```
