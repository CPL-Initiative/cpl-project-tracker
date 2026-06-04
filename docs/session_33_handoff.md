---
title: Session 33 Hand-off Prompt
date: 2026-06-04
session: 32 → 33 hand-off
status: hand-off — paste the fenced block into Session 33's first message
tags: [handoff, session-prompt, cer, credential-merge, exhibit-canonicalization]
related:
  - docs/exhibit_canonicalization_lessons.md (Session 32 section)
  - docs/kb-notes/playbook-cer-credential-merge.md (NEW)
  - docs/kb-notes/methodology-consumer-tolerate-omitted-baked-fields.md (NEW)
  - CLAUDE.md §11 "Session 32" subsection
moniker_suggestion: "Busy Feynman" was Session 32 (branch claude/busy-feynman-jfdiR) — claim your own
---

# Session 33 Hand-off Prompt

Session 32 ("Busy Feynman") ran a 7-item CER refinement pass from Sam's live
screenshot review of the Common Exhibit Reference tab. 3 PRs merged. Paste the
fenced block below into Session 33.

## The prompt

```
You are Session 33 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy
     auto-merge gates [merge on green = clean OR unstable; do NOT wait for "Go!"],
     §6a CPL Analytics / Exhibit Adoption, §9 EACR identity, §11 + the new
     "Session 32" subsection at the very end of §11).
  2. docs/exhibit_canonicalization_lessons.md — the Session 32 section (3 learnings).
  3. docs/kb-notes/playbook-cer-credential-merge.md (NEW) — the existing→existing
     credential merge tool + the CPL-type-duplicate class it serves.
  4. docs/kb-notes/methodology-consumer-tolerate-omitted-baked-fields.md (NEW) —
     the baked-vs-fallback shape-divergence crash class.

WHAT SHIPPED IN SESSION 32 (all merged to main):
  - #284 CER refinements (consumer credential_reference.js + producer
    export_credential_reference()):
      * Items 2 & 7 (SAME bug): the search box + every expand wedge froze because
        passesFilter did row.raw_variants.some() but baked rows carry
        raw_variants:null → TypeError aborted the whole render. Guarded `|| []`.
      * Item 3: relabeled the credit-rec chip "⚙ Generated MID Credit Rec"; added a
        new "⚙ Generated Title" chip on every AI-draft (not-curator-confirmed) title.
      * Item 4: CCR identity on ONE line; local courses "CODE Title (N units)" (units
        baked from singleton typical_units + membership modal). Centered then…
      * Item 5: Audit signals moved up under the Articulated/Potential section.
      * Item 6: baked raw_variants → the expanded row lists the college-entered
        exhibit titles (so "Variants: 1" is explainable).
  - #285 item 1 — the 10-Key consolidation: "10-Key Numeric Data Entry" folded into
    "10-Key Data Entry". DIAGNOSIS: not a CPL-Type grouping rule (CER keys on
    unified_title, never CPL type) — two AI titles for the SAME exhibit. New
    reusable tool kb/_merge_credentials.py (dry-run + --apply, V1-V4 gates, receipt)
    driven by kb/credential_merges.json. Existing→existing sibling of
    _fold_unclassified.py.
  - #286 — flipped the CCR articulations table to LEFT-align (Sam's call after #284
    centered it).
  - #288 + token PR — RETROSPECTIVE PROCESS IMPROVEMENTS (Sam asked for a process
    review): (a) COMMITTED jsdom test harness — package.json + tests/ (run.js +
    cer.test.js) + `npm test` + .github/workflows/js-tests.yml (non-required CI).
    No more /tmp throwaway tests. (b) STOP-HOOK fix — scripts/stop-hook-git-check.sh
    skips GitHub's own squash-merge commits (the "Unverified noreply@github.com"
    nag is gone; applied live + committed). (c) DESIGN-SYSTEM tokens — added
    surface/border/text/link vars to :root (both HTMLs) + the rule "new CSS uses
    var(--token), never raw hex" + the component cheatsheet.

CURRENT STATE:
  - CER producer ships LIVE-ON-MERGE: regen credential_reference_data.js locally
    (`python3 -c "import excel_to_dashboard as m; m.export_credential_reference()"`)
    + commit; idempotent → daily cron sees a no-op. (Needs openpyxl+pandas:
    `pip install openpyxl pandas`.) The baked file now carries raw_variants + per-
    local-course `u` units.
  - TESTS ARE NOW COMMITTED: `npm install && npm test` (jsdom). Add a consumer test
    = drop tests/<area>.test.js (run.js auto-discovers). Guard the failure mode, not
    a happy path (cer.test.js injects a raw_variants:null row). node_modules +
    package-lock stay gitignored; CI uses `npm install`.
  - Design tokens: use var(--surface/--border/--text-strong/--text-muted/--accent-link
    /…) in new CSS. Reference: docs/kb-notes/reference-ui-design-system.md.

STAGED — TWO READY-TO-RUN ITEMS (Sam asked these be teed up; do EITHER as its
own focused, verified PR — they were deliberately NOT bundled into a checkpoint):

  [A] CLAUDE.md history→archive TRIM (biggest per-session win; ~1,890 lines today,
      loaded in full every session). GOAL: keep CLAUDE.md to the live, steering
      content; move the museum next door.
      KEEP inline: Critical Rules 1-8, Branch policy, Engineering & UI practices,
        Deployed site, Obsidian wiring, the ENTIRE Pipeline Reference (§1-§10), §11's
        framing (lifecycle / auditor / CID-CIDx / MC), the roadmap-TABLE rows that
        are NOT DONE (in progress / parked / queued), and ONLY the most recent 1-2
        session subsections.
      MOVE to a new docs/roadmap_archive.md (verbatim, with a one-line pointer left
        in CLAUDE.md): the DONE roadmap-table rows + the per-session narrative
        subsections for Sessions <= 31 (the "### Session N —" blocks) + the older
        "strategic queue" blocks that are fully superseded.
      SAFETY: this is PROJECT MEMORY — do it surgically. After the move, grep-verify
        every Critical Rule + every Pipeline Reference heading + every still-open
        roadmap row is still present in CLAUDE.md, and that the archive contains the
        moved blocks. One PR, eyeball the diff, merge on green.

  [B] BULK CSS literal→var(--token) MIGRATION (aesthetic continuity). The :root token
      block now has brand + surface/text/link tokens; the rule is "new CSS uses
      var()." This migrates the EXISTING ~568 #0A2240 + 431 #163A5F + 755 #C9A84C
      literals (+ the worst slate-scale grays: #6b7280→--text-muted, #374151→
      --text-body, #1f2937→--text-strong, #e5e7eb→--border, #cbd5e1→--border-strong,
      #f8fafc→--surface-subtle, #f1f5f9→--surface-muted, #94a3b8→--text-faint,
      #2563eb→--accent-link).
      SAFE BY CONSTRUCTION: var(--x) resolves to the SAME hex, so a correct migration
      is visually byte-identical. BUT scope it carefully:
        * DO the static <style> blocks in CPL_Dashboard.html (mirror to index.html,
          Rule 4) + the JS-injected CSS strings (ensureCerScopeCss etc.).
        * Do NOT blindly sed the whole file — EXCLUDE generator-emitted hex in
          excel_to_dashboard.py inline styles (Rule 1) unless you also update the
          generator, and exclude any hex inside JS data/strings that aren't CSS.
        * VERIFY: after migration, the set of computed colors is unchanged — e.g.
          regenerate the dashboard + diff, and spot-check a few tabs. Consider a
          tiny scripts/check_css_tokens.py lint that flags NEW raw brand-hex.
      Prototype-first if reworking any component visually (Claude artifact → port).
      Reference for both: docs/kb-notes/reference-ui-design-system.md.

PRIORITY OPTIONS FOR SESSION 33 (Sam picks):
  - CPL-TYPE-DUPLICATE DETECTOR (the natural next step). Surface the rest of the
    class — articulations sharing a course_id + local course but carrying different
    unified_titles (the 10-Key shape). Each confirmed pair → a one-line add to
    kb/credential_merges.json, then `python3 kb/_merge_credentials.py --apply`. Build
    the detector as a small read-only script that prints candidate (loser,winner)
    pairs for Sam's review; do NOT auto-merge.
  - THE 3 AUDIENCE VIEWS (Student/College/System) — the headline carryover from the
    EACR consolidation queue. v3+ gallery renderers over the EACR consolidated +
    prescriptive data. Student first. System needs a PRIVACY ADR (aggregate
    eligible-student counts only, NEVER PII — see SEC-10 in §11 Session 26).
  - EACR v2 scope/generated-rec treatment (producer-side statewide_data.js → NEXT
    CRON, not live-on-merge — see methodology-ship-generator-changes-live-on-merge).
  - MID curation passes (CompTIA A+ fragmentation → Suggested-merges worklist).
  - CER long-tail: the 5 remaining un-classifiable unclassifieds are left flagged
    (un-fixable by design); ~50 NEW credentials to mint = exhibit-canonicalization
    skill domain (per-item judgment, not batch).

HOW TO DO ANOTHER CREDENTIAL MERGE (if Sam asks):
  1. Confirm the pair is the SAME exhibit: scan coci_articulations.json for both
     unified_titles; same course_id + local course + college, differ only in
     cpl_type_description → it's a merge.
  2. Add {loser, winner, reviewed_by, reviewed_at, reason} to kb/credential_merges.json.
  3. `python3 kb/_merge_credentials.py` (dry-run) → all V-gates OK.
  4. `--apply`, regen credential_reference_data.js, commit the 3 KB files + receipt
     + baked file, PR, merge on green.

PATTERNS THAT WORKED (Session 32):
  - DIAGNOSE BEFORE BUILDING: the "CPL Type split" hypothesis was wrong about the
    mechanism (CER doesn't group by CPL type) but right about the trigger; the fix
    was a data merge, not a rule change. Inspect the actual data first.
  - ONE BUG, TWO SYMPTOMS: search + expand froze from the same null.some throw.
  - jsdom test the real consumer with a minimal fixture + stubbed fetch; dedupe the
    fixture rows (a coincidental overlap inflated a count, 19/20 → 20/20).
  - Small coherent PRs, merge on green (unstable counts), reuse the one session
    branch: after each squash-merge `git fetch origin main && git reset --hard
    origin/main`, then for the next PR `git push --force-with-lease`.

SAFETY PATTERNS TO HONOR:
  - Rule 4: CPL_Dashboard.html == index.html (mirror every static HTML edit). CER
    CSS is injected from credential_reference.js → no HTML edit, no mirror needed.
  - Rules 1/2: don't hand-edit regenerated sections; preserve idempotency guards.
  - NEVER commit student PII (SEC-10). Aggregate counts only in any public artifact.
  - Feature branch + PR; auto-merge on green (clean OR unstable); never force-push
    main. (The stop-hook's "Unverified noreply@github.com" false-positive on
    GitHub's own squash-merge commit was FIXED in #288 — scripts/stop-hook-git-check.sh;
    if it ever nags again, `cp scripts/stop-hook-git-check.sh ~/.claude/`. Still NEVER
    amend/force-push a commit that's on main — Rule 5.)
  - Supabase kb_curation/allowed_reviewers only; no destructive migrations w/o sign-off.

A moniker is yours to claim. Checkpoint per Rule 8 (~every 100K tokens); the
pipeline viz is skippable when the M-ID pipeline doesn't move (it didn't in
Session 32 — credential-layer + UI only).

ONE FUN THING (Sam's request, 2026-06-04): Session 32 ("Busy Feynman") was a
legend run — 8 PRs, the whole CER refinement + the process-improvement overhaul.
Sam asked that you embed a tasteful "Legend 32" easter egg in your next
checkpoint. Keep it classy + harmless (e.g. an HTML comment, a code-comment
tip-of-the-hat, or a console.debug line) — nothing user-facing/disruptive, never
in a regenerated section that the daily cron would strip. Pay the lineage forward.
```
