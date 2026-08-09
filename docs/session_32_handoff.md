---
title: Session 32 Hand-off Prompt
date: 2026-06-03
session: 31 → 32 hand-off
status: hand-off — paste the fenced block into Session 32's first message
tags: [handoff, session-prompt, cer, unclassified-triage, audience-views, eacr]
related:
  - docs/exhibit_canonicalization_lessons.md (Session 31 section — CER triage 67→5)
  - docs/kb-notes/methodology-cer-fold-articulation-ripple-sync.md (NEW this session)
  - CLAUDE.md §11 "Session 31" subsection
moniker_suggestion: Bruh 32 / "Thirty-Two" / "Treinta-y-Dos" — or claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 32 Hand-off Prompt

Session 31 cleared the CER unclassified-triage backlog **67 → 5** (5 folds) and
economized the CER tab UI. 7 PRs merged. Paste the fenced block into Session 32.

## The prompt

```
You are Session 32 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy
     auto-merge gates [merge on green = clean OR unstable; do NOT wait for "Go!"],
     §6a CPL Analytics / Exhibit Adoption, §9 EACR identity, §11 + the new
     "Session 31" subsection at the very end of §11).
  2. docs/exhibit_canonicalization_lessons.md — the Session 31 section (the three
     V4-ripple resolution strategies).
  3. docs/kb-notes/methodology-cer-fold-articulation-ripple-sync.md (NEW) — how to
     resolve a CER fold that trips the V4 articulation-ripple gate.
  4. docs/kb-notes/methodology-kb-curation-synthesized-namespace.md — the
     zero-migration curation-surface pattern (used 4× now).

WHAT SHIPPED IN SESSION 31 (all merged to main):
  - #276 / #278 CER TAB ECONOMY (consumer-only credential_reference.js): dropped the
    duplicate scope/CPL chips from the row body + moved ✎ Curate into the Action cell
    (#276); merged the two Confidence columns + folded the Initiated stamp into Action
    → 11→9 columns (#278). Cosmetic only.
  - CER UNCLASSIFIED-TRIAGE, BACKLOG 67 → 5 across five folds:
      #277 fold 30 (67→38), #279 fold 18 (38→20) — safe "duplicate raw spelling →
        existing credential" class (exact-normalized + fuzzy ≥0.72, hand-vetted).
      #280 Option A (20→16) — 4 raws that tripped V4 because the articulation layer
        carried a DIFFERENT valid spelling of the target → adopted the article's spelling.
      #281 group A (16→8) — 8 bare-course-code local exhibits (AUTO 050, WELD 100, …)
        → best-judgment titles + local-college issuers (new-credential adds).
      #282 group C (8→5) — Sam's 3 module-vs-cert calls: POST → POST Basic Academy
        (clean fold), AUTO A1 → ASE A1 — Engine Repair (clean fold), and Firefighter
        1A Certification KEPT DISTINCT as a new Firefighter 1A module (issuer SFT) —
        re-pointed its 13 articulation rows Firefighter 1 → Firefighter 1A.
  - 16 ARTICULATION-LAYER DESYNCS REPAIRED along the way (ASE/Water Supply/Firefighter/
    Math/Culinary/Cinema) so those exhibits attribute to the right credential in
    EACR/CER/CCR-aligned views.

CURRENT STATE:
  - unclassified_in_map = 5. The 5 are un-classifiable by design: 3 bare
    "AUTO 600/601/602 Completion" (no content) + "Automotive" + "Inspection Portfolio
    Spring 2026 #1". LEFT FLAGGED — do not force a target.
  - Folded titles surface as raw variants under their credential rows on the NEXT daily
    cron (which bakes credential_reference_data.js). The CER baked payload regenerates
    from committed inputs → producer changes ship live-on-merge if you regen + commit.

PRIORITY OPTIONS FOR SESSION 32 (Sam picks):
  - THE 3 AUDIENCE VIEWS (Student/College/System) — the headline carryover. v3+ gallery
    renderers over the EACR consolidated + prescriptive data. Student first (reuse
    buildCredentialView + buildPrescriptiveHtml + a near-me/region filter). System needs
    a PRIVACY ADR first (aggregate eligible-student counts only, NEVER PII — see SEC-10
    history-purge context in §11 Session 26).
  - EACR v2 scope/generated-rec treatment (producer-side statewide_data.js → NEXT CRON,
    not live-on-merge — see methodology-ship-generator-changes-live-on-merge). Bring the
    CER's scope-chips/generated-rec design onto the EACR credential view.
  - CER LONG-TAIL via the exhibit-canonicalization SKILL — ~50 of the (already-folded)
    raws needed NEW credentials minted; future raw titles will too. That's per-item
    judgment (new unified_title + issuer in credentials.json), NOT batch work. Invoke the
    `exhibit-canonicalization` skill.
  - MID curation passes (CompTIA A+ fragmentation → Suggested-merges worklist).

HOW TO DO ANOTHER CER FOLD (if Sam asks):
  1. Enter assignments into Supabase kb_curation as `_UNCLASSIFIED::<raw>` rows
     (field unified_title_assignment, + issuing_agency_assignment for a new credential),
     reviewer_email map@rccd.edu. (Or use the in-tab ⚠ Triage worklist.)
  2. Mirror into kb/unclassified_assignments.json (the git overlay) OR let the daily
     sync do it; then `python3 kb/_fold_unclassified.py` (dry-run) → check CLEAN/CONFLICT
     + "articulation ripples: 0".
  3. If V4 ripples > 0: diagnose per methodology-cer-fold-articulation-ripple-sync —
     clean-fold / adopt-the-article-spelling / re-point-the-article-rows (distinct cred).
  4. `--apply`, commit the fold receipt + the 4 KB files, PR, merge on green.

PATTERNS THAT WORKED (Session 31):
  - THREE V4-RIPPLE STRATEGIES (the session's durable learning — see the KB note).
  - Scan coci_articulations.json for the raw FIRST to pick the strategy.
  - DAILY-CRON MERGE HAZARD: a PR touching kb/unclassified_assignments.json can go
    `dirty` if the cron lands mid-flight. Rebase, `git checkout --ours` the overlay
    (main's cron version is authoritative Supabase state), re-add only post-cron entries,
    --continue, --force-with-lease. The fold's other files don't conflict.
  - REUSING THE ONE SESSION BRANCH after each squash-merge: `git reset --hard
    origin/main` then `git push --force-with-lease` (remote still at pre-squash head).

SAFETY PATTERNS TO HONOR:
  - Rule 4: CPL_Dashboard.html == index.html byte-identical (mirror every static edit).
  - Rules 1/2: don't hand-edit regenerated sections; preserve the idempotency guards.
  - NEVER commit student PII (SEC-10). Aggregate counts only in any public artifact.
  - Feature branch + PR; auto-merge on green (clean OR unstable); never force-push main.
  - Supabase kb_curation/allowed_reviewers only; no destructive migrations w/o sign-off.

A moniker is yours to claim — suggestion: "Bruh 32" / "Thirty-Two". Checkpoint per
Rule 8 (~every 100K tokens); the pipeline viz is skippable when the M-ID pipeline
doesn't move (it didn't in Session 31).
```
