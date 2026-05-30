---
title: Cross-discipline Over-merge Re-mint — Lessons & State
date: 2026-05-29
last_updated: 2026-05-29
session: 18 (over-merge cleanup)
tags: [over-merge, re-mint, member-top-divergence, dry-run, apply, discipline-cascade, m-id, unified-courses]
artifacts:
  - kb/_row_audit.py (member_top_divergence rule)
  - kb/_overmerge_dryrun.py (split planner)
  - kb/_overmerge_apply.py + kb/_overmerge_apply_supabase.py + .github/workflows/overmerge-apply.yml
  - kb/overmerge_title_discipline.json (curator title→discipline keep-whole map)
  - kb/overmerge_out/<date>/{report.md, alias_map.json, review_hold.json, collisions.json}
related:
  - docs/kb-notes/over-merge-remint-scope.md (the scope + locked forks)
  - docs/kb-notes/methodology-remint-split-invariants.md (the durable invariants)
  - docs/unified_courses_audit_lessons.md (the auditor that produced the flag)
  - CLAUDE.md §10 (M-ID surrogate format) + §11 (M-ID lifecycle, auditor, roadmap)
  - docs/coursecontrolnumber_remint.md (the Rule 7 playbook this follows)
---

# Cross-discipline Over-merge Re-mint — Lessons & State

The running record for the over-merge cleanup workstream (Session 18). Pairs with
the **scope doc** ([`over-merge-remint-scope.md`](kb-notes/over-merge-remint-scope.md),
the locked forks) and the **invariants KB note**
([`methodology-remint-split-invariants.md`](kb-notes/methodology-remint-split-invariants.md)).

## TL;DR / current state (2026-05-29)

- **Trigger:** Sam screenshotted the CCR `UC-00987` "Ethics and Leadership" cluster;
  tracing it found an M-ID-level over-merge (`CRIM M1231` minted nursing
  "Leadership and Ethics" — TOP 1230.10 — into an Administration-of-Justice M-ID).
- **New auditor rule `member_top_divergence`** (shipped, in `kb/_row_audit.py`):
  flags an M-ID when its member colleges' TOP codes span ≥2 two-digit divisions
  with ≥30% minority share. **1,299 flagged**, 736 invisible to prior rules, 255
  "mis-disciplined". Penalty −0.15 on discipline. Mirrored client-side + a Triage
  option in `unified_courses.js`. (PR #194.)
- **Re-mint built (dry-run → apply → workflow), all gates green:**
  - **PR-1 dry-run** `kb/_overmerge_dryrun.py` — splits each flagged M-ID into
    discipline-pure pieces, allocates ids, routes articulations, holds borderline
    interdisciplinary courses for veto. Outputs `kb/overmerge_out/<date>/`.
  - **PR-2 apply** `kb/_overmerge_apply.py` (+ `_supabase.py` + `overmerge-apply.yml`)
    — STAGED, dispatch-only; consumes the reviewed alias map; V1–V4 gates +
    FRESH-READ + idempotency. **Not run.**
- **Split brain redesigned twice from Sam's review** (the algo was TOP-only):
  - **Iteration 1 (committed):** title/subject/description cascade replaces the
    2-digit-TOP split. Blank-piece rate **51% → 38.6%**.
  - **Iteration 2 (DONE):** description-similarity keep-vs-split for the unmapped
    concrete in-betweeners. Branch 5: per-member catalog descriptions (joined from
    `coci_course_list.xlsx` by control_number), mean pairwise token-set Jaccard,
    threshold **0.55** — collapse a split M-ID back to ONE piece when its members'
    descriptions cohere (one course mis-coded across colleges). **232 collapses**
    of 1,003 measurable in-betweeners; blank-piece rate 38.6% → **36.3%**;
    corroborated-catalog delta −585 → **−544**. `CRIM M1231` (0.349), `CRIM M1130`
    (0.508), `HEIT M1042` (0.029) all correctly **stay split**. Both dry-run + apply
    gates green; CN-atomicity + id↔SUBJ4 invariants hold (0/0). No-ops gracefully
    if the xlsx is absent. New artifact `coherence.json` (per-row scores + the
    threshold table for recalibration).
- **Curator title→discipline keep-whole map** seeded (`kb/overmerge_title_discipline.json`).
- **Backlog:** SUBJ4-curation → CCR cascade (a curated SUBJ4 change auto-re-keys
  that discipline's M-IDs); the 341 SUBJ4→discipline blank-backfill.
- **MERGED to main** 2026-05-30 (PR #194, squash `340d753`). The whole workstream
  is on main; the **apply stays STAGED** (`workflow_dispatch`-only — merging did
  NOT run it). Next: the curator preview loop → Sam dispatches `overmerge-apply.yml`.

## How the split brain works now (iteration 1)

Pass 1 of the dry-run, per flagged M-ID, FIRST-match-wins:
1. **Review-hold** — interdisciplinary-token (Photojournalism, Ethnoecology, …) or
   a 2-group split whose disciplines are a known `SISTER_PAIRS` entry → HELD for
   curator veto, never split. (~52 held.)
2. **Title→discipline keep-whole** — `kb/overmerge_title_discipline.json` (curator
   map): a single course whose TOP/subject merely varies by college stays ONE
   piece at the mapped discipline. (Social Media→Multimedia, Death & Dying→
   Gerontology, Online Learning→Learning Skills, …; 23 entries.)
3. **Container titles** — Independent Study/Projects, Special/Selected Topics,
   Field Studies, Topics in… (excl. "independent living") → split per-subject
   (each department's shell is its own identity). MUSI M1512 "Independent Projects"
   → 26 per-subject pieces.
4. **Member-discipline cascade** (default) — each member resolves a discipline by
   priority **SUBJ4→discipline (inverted `discipline_canonical_subj4.json`) →
   subject_map → TOP → M-ID description (SAFE_PHRASES)**. Members resolving to None
   are **subject-separated** (each raw subject its own blank-discipline piece) —
   never lumped into a mislabeled bucket. Group → piece.

Outcome (iteration 1): 1,299 → 52 held + 23 keep-whole + container/cascade splits;
**3,011 pieces, 38.6% blank**; corroborated catalog 1,299 → 714. `disc_source`:
top_code 1000 / subj4 605 / subject_map 200 / description 24 / title_map 23 /
raw_subject 1161. All four dry-run gates PASS; idempotent; apply dry-run ALL-PASS.

## Lessons (this session)

**Measure-first kept being right.** Every step revealed the previous assumption
was off: the auditor's old TOP-disagreement count (857) was measuring the wrong
thing; the real over-merge population is 1,299; 60% of "corroborated" over-merges
were phantom (title-collision of single-college courses → de-corroborate on split);
member subjects only cover ~28% via lexicons (so the cascade needs a raw-subject
fallback, not subject_map alone); the blank-discipline-on-clusters scare was a
ghost (98% are filled). Prototype + count before locking any threshold or rule.

**The algo must read titles + descriptions, not just TOP.** Sam's single most
load-bearing note. TOP-only labeling left 51% of pieces blank and over-FRAGMENTED
courses whose TOP varies by college (Social Media coded Office-Tech at some
colleges, Multimedia at others — it's ONE Multimedia course). The fix is layered:
the cascade (subject/TOP/description) for labeling, the curator title→discipline
map for the domain calls no heuristic gets, and description-similarity (iter 2)
for the keep-vs-split decision on the unmapped tail.

**Two re-mint engineering invariants** (now a KB note — see
[`methodology-remint-split-invariants.md`](kb-notes/methodology-remint-split-invariants.md)):
- **id-prefix must equal SUBJ4.** A group inherits the old id ONLY if its SUBJ4
  still matches the old prefix; else the old id retires and every group re-keys to
  its own SUBJ4. (A keep-whole "Social Media" OTEC→Multimedia must become
  `MULT M####`, not a mismatched `OTEC` id.) Caught in my review of iteration 1.
- **Control-number atomicity.** Cross-listed members sharing one
  CourseControlNumber (DMA C201 / DMAC 201 = same course, two subject codes) must
  land in ONE piece — else the apply (which gathers each piece's members by CN)
  double-counts them (V2 member-conservation failure). The dry-run collapses
  members by CN into atomic units before grouping. Caught by re-running the APPLY
  dry-run against the changed plan — the dry-run's own V2 passed; only the apply's
  CN-keyed gather exposed it.

**Re-validate the apply against every changed plan.** The apply consumes the
alias map; when the dry-run's split logic changed, the apply's V2 broke even
though the dry-run's V2 still passed. The dry-run↔apply pair is a cross-check —
run both after any planner change.

**Merging a long-lived branch: regenerated-artifact conflicts → re-run the
generator.** By merge time the daily cron had advanced `main` (a new
`Daily dashboard update`), and the only conflict was `kb/row_audit/latest.json`
(both the branch and the cron regenerate it). Don't hand-merge a regenerated
file — `git merge origin/main`, then re-run `python3 kb/_row_audit.py` to
regenerate `latest.json` on the merged state, `git add`, finish the merge. Also:
deleting the merged branch from the session 403s (token limitation) — enable repo
"auto-delete head branches" (noted in CLAUDE.md branch policy).

**Sub-agent for the big builds, the review is where the merge is earned.** The
dry-run, apply, and both split-brain iterations were sub-agent-built against
precise specs; each hard-review (independent number-recompute vs ground truth,
the apply-on-real-files dry-run, the gate re-checks) caught real bugs (the V3
collision looseness, the id↔SUBJ4 mismatch, the CN double-count). The validation
oracle (Sam's annotated examples + the gates + ground-truth counts) is what makes
sub-agent review tractable.

## Strategic roadmap

| Step | What | Status |
|---|---|---|
| Auditor rule | `member_top_divergence` (1,299) | **DONE** PR #194 |
| Scope + dry-run | `kb/_overmerge_dryrun.py`, all gates | **DONE** PR #194 |
| Apply (staged) | `kb/_overmerge_apply.py` + workflow | **DONE** (dispatch-only) |
| Split iter 1 | title/subject/description cascade + keep-whole + container | **DONE** |
| Split iter 2 | description-similarity keep-vs-split (Jaccard 0.55; 232 collapses; blank 36.3%) | **DONE** |
| Curator review loop | grow `overmerge_title_discipline.json` from review notes | ongoing |
| **Dispatch the apply** | Sam triggers `overmerge-apply.yml` after final review | **gated on review** |
| SUBJ4-curation cascade | curated SUBJ4 → auto re-key that discipline's M-IDs | parked (backlog) |
| 341 SUBJ4→disc backfill | fill blank disciplines where SUBJ4 inverts cleanly | parked (quick win) |

## Next concrete step

Hard-review **iteration 2** (description-similarity) when it lands: confirm the
measure-first threshold table, that both dry-run + apply gates stay green, that
CN-atomicity (0 CN in >1 piece) and id↔SUBJ4 (0 mismatch) hold, and that genuine
over-merges (CRIM M1231) do NOT collapse while one-course-mis-coded ones do. Then
present fresh previews for Sam's next review pass + keep growing the title→discipline
map. The apply stays staged until Sam signs off on the previews; he dispatches it.
