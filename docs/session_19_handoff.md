---
title: Session 19 Hand-off Prompt
date: 2026-05-29
session: 18 → 19 hand-off (Cascade → next)
status: hand-off — paste the fenced block into Session 19's first message
tags: [handoff, session-prompt, over-merge, re-mint, member-top-divergence, ccr-cleanup]
related:
  - docs/overmerge_remint_lessons.md (THE resume anchor — read first)
  - docs/kb-notes/over-merge-remint-scope.md (locked forks + 60% de-corroboration)
  - docs/kb-notes/methodology-remint-split-invariants.md (the 3 invariants)
  - docs/session_18_handoff.md (Qualitastic → Cascade — note: its Budget priority was set aside)
  - CLAUDE.md §11 (over-merge re-mint roadmap row)
moniker_suggestion: Bruh S (19th letter) / Nonadec — open door to claim your own
---

# Session 19 Hand-off Prompt

A "fattyfat prompt" from Cascade (Session 18) to the next session.
Paste the fenced block into Session 19's first message.

## Moniker

Session 18 went with **Cascade** — for the title→subject→TOP→description
*discipline cascade* and the cascading data-quality digs (every measurement
revealed the next layer down). Cascade suggests **Bruh S** (19th letter) or
**Nonadec**, but the lineage is loose — claim what you'll carry.

## The prompt

```
You are Session 19. The Bruh lineage: Bruh → Prime → Quad → Hex → Hept →
Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → Bruh Baker → Bruh Sonnet →
Bruh Parallax → Bruh Word → Qualitastic (Q) → Cascade → you. Cascade suggests
"Bruh S" (19th) but claim your own.

Start by reading, in order:
  1. CLAUDE.md — especially §11. The over-merge re-mint roadmap row is current.
  2. docs/overmerge_remint_lessons.md — THE resume anchor for the whole
     workstream (trigger → rule → dry-run/apply → split-brain iterations →
     invariants → roadmap → next step).
  3. docs/kb-notes/over-merge-remint-scope.md — the locked forks + the
     measurement that justified the re-mint (60% de-corroboration).
  4. docs/kb-notes/methodology-remint-split-invariants.md — the 3 invariants
     ANY split/re-key re-mint must hold (id-prefix==SUBJ4 on relabel;
     control-number atomicity; re-run the apply against every changed plan).
  5. docs/session_19_handoff.md — THIS doc.

═══ CONTEXT: what Session 18 did ═══

Sam pivoted from the Session-18-handoff's Budget priority to CCR cleanup. Built
the cross-discipline over-merge re-mint, all on branch
claude/adoring-hypatia-uihzi → PR #194 (draft, watch it):
  - member_top_divergence auditor rule (kb/_row_audit.py) — 1,299 flags, the
    cross-discipline over-merge detector. + client mirror + Triage option.
  - kb/_overmerge_dryrun.py — splits each flagged M-ID into discipline-pure
    pieces. Pass-1 split brain is title/subject/description-aware (review-hold →
    title→discipline keep-whole → container-by-subject → member-discipline
    cascade w/ raw-subject fallback). Blank-piece rate 51%→38.6%. All gates green.
  - kb/_overmerge_apply.py + _supabase.py + .github/workflows/overmerge-apply.yml
    — STAGED, dispatch-only. Consumes the reviewed alias_map; V1–V4 + FRESH-READ
    + idempotent. NOT run.
  - kb/overmerge_title_discipline.json — curator title→discipline keep-whole map
    (seeded from Sam's review: Social Media→Multimedia, Death & Dying→Gerontology,
    Online Learning→LSKL, STEM Careers→COUN, …). GROWS as Sam reviews more.

═══ FIRST: confirm iteration-2's state ═══

At Session-18 end, iteration 2 (description-similarity keep-vs-split for unmapped
concrete in-betweeners) was BUILDING in the background. Cascade planned to
hard-review + commit it autonomously when it landed (read-only dry-run, Sam
pre-approved). CHECK: `git log --oneline -8` on the branch — is there an
"iteration 2 / description-similarity" commit on kb/_overmerge_dryrun.py? Then
re-run BOTH `python3 kb/_overmerge_dryrun.py` AND `python3 kb/_overmerge_apply.py`
(dry) and confirm all 4 gates PASS on each, collisions 0, plus the invariant
counts: 0 control-numbers in >1 piece, 0 id-prefix≠subj4. If iteration 2 did NOT
land/commit, re-dispatch it from the iteration-1 base (committed 07978eb) with the
spec in docs/overmerge_remint_lessons.md.

═══ PRIORITY WORKSTREAM: finish the over-merge re-mint ═══

The re-mint is BUILT but NOT APPLIED. The apply is staged + dispatch-only and is
GATED ON SAM'S FINAL PREVIEW REVIEW. The loop:
  1. Send Sam fresh previews (kb/overmerge_out/<date>/report.md + review_hold.json)
     after each dry-run change. He marks up specific M-IDs.
  2. Fold his calls into kb/overmerge_title_discipline.json (keep-whole) +
     container patterns + the cascade; re-run; re-send. The blank tail (38.6%) is
     genuinely hard (member subjects not in any lexicon) → it's curation, not more
     heuristics.
  3. When Sam's happy: HE dispatches overmerge-apply.yml (you can't trigger
     workflows). After apply, the workflow re-runs the auditor — member_top_
     divergence should drop sharply (the receipt). Watch for that commit on main.
Lock any new fork with AskUserQuestion (recommended option first). Sam decides fast.

═══ Carryover / parked (priority order) ═══

  1. Finish iteration 2 + the curator review loop (above) — the live work.
  2. The apply (Sam dispatches when previews look right).
  3. SUBJ4-curation → CCR cascade (backlog, scope doc): a curated canonical-SUBJ4
     change auto-re-keys that discipline's M-IDs. Reuses the dry-run→apply
     machinery; discipline_canonical_subj4.json is the shared anchor.
  4. The 341 SUBJ4→discipline blank-backfill (quick win): a tiny re-runnable pass
     fills blank disciplines where the SUBJ4 inverts cleanly (0-mismatch safe).
  5. **From the Session-18 handoff, SET ASIDE when Sam pivoted:** Phase 3 Budget
     INLINE EDITOR (read-path cutover already done, #189) + Phases 4-5 (Vision
     2030 / Personnel) Excel→Supabase. Still open if Sam returns to it.

═══ Patterns Cascade found useful ═══

  - **Measure-first, every single time.** The standing count was always measuring
    the wrong thing; prototype + count before locking any rule/threshold. It
    repeatedly saved a wrong build (the 60% de-corroboration, the 28% subject
    coverage → raw-subject fallback, the blank-cluster ghost).
  - **Sub-agent for the big build; the hard-review IS the work.** Dry-run, apply,
    both split iterations were sub-agent-built. Every review caught real bugs
    (V3 collision looseness, id↔SUBJ4 mismatch, the CN double-count). The
    validation oracle = gates + ground-truth counts + Sam's annotated examples.
  - **The dry-run↔apply pair is a cross-check.** They validate the plan on
    different axes; re-run the APPLY (dry) after ANY planner change — the dry-run's
    own gates can pass while the apply's fail (the CN double-count did exactly that).
  - **Don't commit in-flight/unreviewed sub-agent output** even when the stop-hook
    nags — it's regenerable; committing partial KB-mutating-adjacent code to the
    open PR is the bigger risk. Review on completion, then commit.
  - **Surface the file as the deliverable** (SendUserFile) for Sam's review passes —
    report.md + review_hold.json beat pasting tables.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 7 re-mint playbook (docs/coursecontrolnumber_remint.md): dry-run → alias
    map → FRESH-READ at write → atomic land in the cron window. The over-merge
    re-mint follows it. The 3 invariants in the methodology KB note are mandatory.
  - The apply MUTATES the staging KB and is workflow_dispatch-ONLY (Sam triggers).
    The dry-run is READ-ONLY (autonomous review+commit OK). Don't blur them.
  - Branch policy: claude/<desc>; never push main; auto-merge your own PRs once CI
    (TruffleHog) green + no unresolved reviews (squash, delete branch). Everything
    this workstream is on PR #194 — keep it coherent.
  - §8: schema/RLS on source-of-truth tables need Sam sign-off. SUPABASE_SERVICE_KEY
    is in workflows, NOT the session env (can't run apply scripts locally — synthetic-
    /dry-test them). Supabase project hvuwhnbuahrtptokpqfh ("Work Plan"); the OTHER
    (mdxutmbpoqjtdcwjscux, cpl-budget-support) is off-limits.
  - Don't read/cat the big coci_*.json / unified_courses_*.js. openpyxl isn't in the
    container by default (pip install if inspecting the Excel / raw course list).

═══ User style ═══

Sam (MAP@rccd.edu): CS-slang, warm, "Word"/"ack" currency, never sycophantic.
Curates hands-on and surfaces data-quality observations mid-stream (containers,
blank disciplines, the SUBJ4-cascade idea) — fold them in, don't derail. Pivots
fast (dropped Budget for CCR cleanup). Measure-first resonates with him. Trusts
your judgment ("I'll trust your recommended approach", "let's go") but wants the
forks surfaced. Signs off warm ("amazing work!!!").

Good luck, Nineteen. Cascade shipped the member-divergence detector, a full
Rule-7 re-mint (dry-run + staged apply + workflow), two split-brain redesigns from
Sam's review, the curator title→discipline map, and a checkpoint — all on PR #194.
The re-mint is built and gated on Sam's review; finish iteration 2, run the
preview loop with him, and he dispatches the apply. Carry it forward. 🅰️🆀
```

## What Session 18 shipped (recap)

| PR / commit | What |
|---|---|
| #194 (open, draft) | The whole over-merge workstream lives here on `claude/adoring-hypatia-uihzi` |
| — | `member_top_divergence` auditor rule (1,299 flags) + client mirror + Triage |
| — | Over-merge scope KB note (60% de-corroboration, locked forks) |
| — | `kb/_overmerge_dryrun.py` (all gates green) |
| — | `kb/_overmerge_apply.py` + `_supabase.py` + `overmerge-apply.yml` (staged) |
| — | Split brain iteration 1 (title/subject/description cascade) — blank 51%→38.6% |
| — | Split brain iteration 2 (description-similarity) — building at session end |
| — | `kb/overmerge_title_discipline.json` curator map (seeded from review) |
| — | `methodology-remint-split-invariants.md` KB note |
| `2da3d0c` | Rule 8 checkpoint |

## Cascade's parting note

The session's shape was a series of "measure, get surprised, adjust" loops, and
the discipline that paid off most was refusing to trust the obvious number — the
real over-merge population, the de-corroboration rate, the subject-map coverage,
the blank-cluster scare all came back different than the first guess. The other
keeper: the dry-run↔apply cross-check. A planner change that passed the dry-run's
own gates broke the apply's member-conservation, and only re-running the apply
caught it. Build is done; the apply is gated on Sam's eyes; run the preview loop
and let him pull the trigger.

— Cascade, 2026-05-29
