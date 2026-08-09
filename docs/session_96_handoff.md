---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 96 handoff — you are Session 96

**Session 95 (2026-07-02)** was the **Activity ⇄ Project separation day**,
driven live by Sam poking the dashboard all afternoon. Two PRs merged (#652 +
the follow-up), one live Supabase restore, one RLS widening. Suite **125**
test files green. Pick your own moniker (Sky/Star streak).

## The story (read this before touching Activities/Projects surfaces)

Sam tabled **23 project cards** one morning because they were "redundant with
Activity cards" — and the Activity cards vanished too. Root cause: the
Activity-metrics KPI cards and the Projects-Grid cards were the SAME
`public.projects` rows rendered twice, and Session 84 deliberately wired the
lifecycle overlay to hide both. A second bug (the modal's capture-phase
overlay walk) made the **Archive** radio unpickable — every save landed as
default `tabled`/no-reason. That default/empty-fields signature is the
diagnostic tell (KB note:
`methodology-overlay-close-on-backdrop-target-only.md`).

**The invariant now (PR #652):** the **activity layer** =
`derive_core_activity_ids` **minus the `5.x` family** is IMMUNE to
`project_lifecycle` at every consumer — generator scrub in `main()`,
`project_lifecycle.js` `activityLayerIds()`, `raci.js` `load()`. The Projects
Grid renders ONLY real work items (4.1.x sprint children + 5.x). The 23
mistaken rows were DELETED from Supabase (receipt in the lessons doc);
`5.1`'s deliberate June-29 tabling was kept. ⚠ The `5.x` carve-out is
load-bearing: `5.1` carries a KPI ladder, and a purely structural classifier
resurrected it in the first draft (KB note:
`methodology-layer-scoped-soft-delete-dual-rendered-rows.md`).

## The afternoon wave (2nd PR — Sam's live asks)

1. **Path-to-2030 charts** (goal/stretch canvases) moved to the **top of CPL
   Analytics** on the Dashboard tab (`render_exhibit_analysis_html
   extra_top_html`). They ride the analytics injection — skipped in sandbox
   runs (no `CustomReport_*.json`); fine on the runner.
2. **4.1 Sprints phantom row** fixed — the synthetic composite in
   `build_activity_kpis` now inherits the real 4.1 row's `goal` (it fell into
   the goal-less "Other" bucket, which renders as its own grid).
3. **`project_add.js` (NEW)** — ＋ Add-project button (Projects header + AWG
   Projects header). INSERTs `public.projects`; ID auto-suggested = next free
   `5.N` from the LIVE id list. `projects` INSERT/UPDATE **widened to
   `is_allowed_reviewer() OR team_pass_ok()`** (migration
   `projects_write_team_phrase_widen`; schema
   `kb/supabase_projects_rls_tighten.sql`; DELETE stays reviewer-only).
   Tests: `tests/project_add.test.js` (24).
4. **AWG Projects section** — `render_awg_projects_section_html`, injected
   with its OWN paired markers **after** `<!-- End Annual Workplan Goals -->`.
   ⚠ Everything BETWEEN the AWG markers is overwritten every run by the
   annual-goals injection (the second of two same-marker injections — it
   wins). Lead cells carry the `card_raci.js` live hook.
5. **Regen is now byte-idempotent modulo the 2 timestamp lines** — the grid
   replace was accreting +1 blank line per run (198 had piled up). If you add
   a replacement block, swallow the trailing blank-line run.

## Read these first (in order)
- `docs/project_lifecycle_lessons.md` — both 2026-07-02 sections (the whole story).
- The two new KB notes (overlay-close-on-backdrop; layer-scoped soft-delete).
- `docs/session_95_handoff.md` — the standing Sierra/TMC lanes (still open).

## Priority workstreams
1. **Watch Sam's first Add-project uses** — first real INSERTs through
   `project_add.js`; fold friction fast. Open question for Sam: re-table
   `5.8` (the one real project in his mistaken sweep — restored)?
2. **Known edge:** a ladder-bearing `5.x` (only `5.1`, currently tabled)
   would dual-render when active. If Sam restores it and objects: move its
   ladder out of `workplan_goals` or re-home the id under 1–4.
3. **Standing lanes from Session 95's handoff:** Sierra guidance-rule field
   reports · Training Phase 3 (artifact ingestion) · the Malone guardrails
   lane · TMC confidence engine round 2 · `chatbox_exhibits` dedupe/refresh ·
   unverified-M-ID renumber.

## Carryover (waiting on Sam)
- Re-table 5.8? · Malone intro · COCI export with hours + fresh extract ·
  pending-ADT list · MAP login URL · public KB PR #15 · the 3 skipped
  OR-groups.

## Patterns that worked (reuse them)
- **A/B the classifier against live data** before trusting an id-set boundary
  (caught the 5.1 resurrection in minutes).
- **Diagnose from data signatures**: 23/23 rows `tabled`/`reason=null` ⇒ the
  form was uninteractable, not a user habit.
- **Scout with a subagent while building** (the AWG double-injection finding
  came from a parallel Explore run and prevented a section that would have
  been silently eaten on the next regen).
- Restart the branch from origin/main after every squash-merge (same name).

## Safety patterns to honor
- Activity-layer ids are IMMUNE to `project_lifecycle` — keep the generator
  scrub + the two JS mirrors in sync if the boundary ever changes.
- Rule 4 (both HTMLs) · Rule 5 (never force-push main) · Rule 8 (checkpoint).
  Merge on `unstable` once TruffleHog is green; post-merge dispatch publishes
  artifacts (code-only PRs).
- `projects` writes: anon key alone must NEVER pass — the team-phrase widen
  kept the server-side gate; never widen to anon.

## Moniker
Session 95 ran unnamed (the separation day). Claim your own.
