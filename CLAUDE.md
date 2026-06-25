# CPL Project Tracker — Claude Code Project Memory

This file is auto-loaded at the start of every Claude Code session in this
repo. Keep the **Critical Rules** section tight — move deep reference material
into the Pipeline Reference below or into dedicated docs.

---

## Critical Rules (do not violate)

1. **The daily GitHub Actions workflow regenerates the dashboard.**
   `.github/workflows/daily-dashboard.yml` runs daily on a 3-cron ladder
   (`17 6`/`17 9`/`17 12 * * *` = 06:17/09:17/12:17 UTC). It executes
   `python excel_to_dashboard.py`, which reads the existing `CPL_Dashboard.html`
   and **replaces entire sections** (Filter Bar, Activity KPIs, Projects Grid,
   KPI section, exhibit CSS, title/h1). Any hand-edit inside one of those
   regenerated sections is overwritten on the next run. **If something needs to
   change, change the generator — not the HTML.**

2. **CSS-injection idempotency guard (`excel_to_dashboard.py` around line 5093)
   must not be removed.** The generator injects `EXHIBIT_ANALYSIS_CSS` before
   the first `</style>` tag. A guard strips any pre-existing copy before
   re-inserting so repeat runs don't accumulate duplicates. Before this guard
   existed, 34 copies (~6,500 lines) had piled up. See PR #4.

3. **`kpi_history.json` must have no date gaps.** The trend card's "1d" delta
   looks up "yesterday" with a `date <= target` filter, so a missing day causes
   the 1d delta to silently fall back to an earlier date. If a daily run is
   missed, backfill an interpolated entry with `"_interpolated": true`.

4. **`CPL_Dashboard.html` and `index.html` must stay identical.** The workflow
   copies one to the other at the end (`cp CPL_Dashboard.html index.html`).
   Never edit only one.

5. **Never force-push `main`** (GitHub Pages serves from it; the daily cron
   and concurrent sessions race against it). Feature branches (`claude/*`)
   may `--force-with-lease` freely — that's the normal post-squash flow.
   The ONLY main-history rewrite ever permitted: a coordinated secret/PII
   scrub — cron paused, Sam's explicit go, all open sessions told to
   re-clone. Anything else uses `git revert`.

6. **Don't run a separate Cowork scheduled task for the daily dashboard while
   the GitHub Actions workflow is active.** Two schedulers racing to push to
   `main` caused the messy commit chain on 2026-04-19.

7. **M-IDs are in staging-cleanup phase — re-mints permitted under the
   playbook.** The M-ID identity layer is "AI-assisted STAGING" (per the
   data-file headers), **not yet faculty-published**. Re-mints in service
   of cleanup are welcome, but they must follow
   [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md):
   dry-run first, alias map committed, Supabase `kb_curation` fresh-read at
   write-time, articulations re-keyed, **`kb/promotions.json` re-keyed**
   (`kb/_rekey_promotions.py` — added 2026-06-11 after four re-mints skipped
   it, silently severing 53% of the Phase A/B official-ID fold evidence;
   `docs/official_id_fold_scope.md`. Resolution semantics corrected SAME DAY,
   Session 42: alias maps are simultaneous PERMUTATIONS with slot reuse —
   apply each map ONCE, chronologically, era-stamped (`_rekeyed_through`),
   apply-confirmed maps only, V5-validated against per-row `*_remint_from`
   stamps; an apply that consumes a dry-run plan must RESTAMP the receipt's
   `_status` —
   [`docs/kb-notes/methodology-alias-map-resolution-semantics.md`](docs/kb-notes/methodology-alias-map-resolution-semantics.md)),
   atomic land within one cron window (06:17 UTC primary). The "never bulk renumber" framing that previously lived
   here was **defensive** (against accidental re-keys); it's been relaxed
   for the staging phase. **Never re-mint casually** — the playbook is
   mandatory. Once we explicitly declare the M-ID layer
   **faculty-published**, this rule re-locks to "stable identifiers, no
   renumbering." Until then, principled re-mints are part of the cleanup
   loop.

   **M-ID structural invariants** (enforced at every re-mint; deviations
   become audit findings):
   - SUBJ portion is exactly **4 letters**. The single-letter SUBJ
     artifacts (`A M1001`, `F M1001`, …) were folded by the 2026-06-12
     canonical fold; residue = **1** (`F M1002`, blank-discipline —
     unfoldable until disciplined; `mid_id_off_scheme` tracks it).
   - Within `id_system == "M-ID"`, **all rows sharing a `discipline`
     share a SUBJ4** — **ENFORCED 2026-06-12 (Session 50): the canonical
     fold re-keyed every disciplined M-ID to its curator-confirmed
     canonical** (e.g. the 10 "Sign Language, American" variants → `SLNA`).
     `subject_collision_signal` is the steady-state watchdog (3 documented
     residuals = cross-discipline curated re-keys whose BASELINE file
     discipline disagrees with the curated one — honest flags, not defects).
   - **Umbrella-discipline exception (2026-06-09, Session 37).** One MQ
     discipline that is genuinely a *parent over many distinct subjects*
     splits its SUBJ4 per subject — the invariant becomes *one **SUBJECT**
     → one SUBJ4*. Two umbrellas today: **"Foreign Languages"** —
     its 1,452 identities re-keyed `FLNG` → per-language `FL**` (FLSP
     Spanish · FLFR French · FLCH Chinese · …) while the **MQ discipline
     stays "Foreign Languages"** (authoritative MQ has no per-language
     discipline) — and **"Kinesiology"** (2026-06-10, the KIN/PE
     convergence): spans `KINE` (instruction) + `ATHL` (intercollegiate
     athletics). Umbrella disciplines are listed in `UMBRELLA_DISCIPLINES`
     (`kb/_row_audit.py`) and are **exempt from `subject_collision_signal`**
     (they're *supposed* to span many SUBJ4s). Scopes:
     [`docs/fl_subj4_remint_scope.md`](docs/fl_subj4_remint_scope.md) ·
     [`docs/kin_pe_convergence_scope.md`](docs/kin_pe_convergence_scope.md);
     map: `kb/foreign_language_subj4.json`; applies: `kb/_apply_fl_subj4_remint.py`,
     `kb/_apply_kin_pe_convergence.py`.
   - **Fan-in convergence (2026-06-10).** The inverse of the umbrella: two MQ
     discipline *names* for one converging field fold to a canonical name, the
     other recorded as an **alternate name** in `kb/discipline_aliases.json`
     (never deleted from the MQ vocab). Applied: **Kinesiology ⟵ Physical
     Education** (+ carve-outs `ATHL`/`PEDS` — "Physical Education Disabled
     Students" is its own MQ + SUBJ4) and **Drama/Theater Arts ⟵ Theater
     Arts** (SUBJ4 `THEA`). Both parent + singleton layers converged; alias
     receipts under `kb/kin_pe_out/`, `kb/drama_theater_out/`,
     `kb/convergence_singletons_out/`.
   - **C-IDs and CCN-IDs preserve their official format** — they're
     external authorities with variable lengths (`ANTH 100`, `AG-PS 104`,
     `ANTH C1000`). Never re-key.
   - New M-IDs minted by `_seed_coci_minted_mids.py` (or curator
     consolidation via the Suggested-merges worklist) consult
     `kb/discipline_canonical_subj4.json` (live — 148 disciplines, all
     curator-reviewed; synced from Supabase `_CANON_SUBJ4::` picks) for
     the canonical SUBJ4 per discipline.

   Authoritative old→new aliases for every re-mint live at
   `kb/remint_out/<date>/alias_map.json`. Rollback notes per the playbook.

   The 2026-05-22 `CourseControlNumber` re-mint (PR #84) was the first
   instance of this playbook in production. Old `M-ID SUBJ NNN` keys are
   dead — those aliases preserved in `kb/remint_out/alias_map.json`. Full
   decisions + validation methodology:
   [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md).
   Latest instance: the **UC-CUR → Z-scheme re-mint** (Session 56, 2026-06-15 —
   the 4,053 synthetic `UC-CUR-AUTO*` unified-course ids → `SUBJ Z<band><seq:03d>`,
   e.g. `BIOL Z9001`; dry-run `kb/_uc_cur_zscheme_dryrun.py` + apply
   `kb/_uc_cur_zscheme_apply.py` share `compute_plan()`, receipts
   `kb/uc_cur_zscheme_out/2026-06-15/`, scope
   [`docs/uc_cur_zscheme_remint_scope.md`](docs/uc_cur_zscheme_remint_scope.md)).
   Surface was **entirely inside `kb_curation`** (0 articulations/promotions), so
   it added a **reusable** Supabase re-key path: `kb/_rekey_kb_curation_supabase.py`
   + `.github/workflows/supabase-rekey.yml` (service-key, reads the committed
   alias map — the only sane way to re-key thousands of rows when the alias map
   is too large to hand-pass as SQL;
   [`docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md`](docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md)).
   Prior: **KIN/PE pass 2** (Session 51, `kb/_kin_pe_pass2.py`, 1,057 re-keys,
   `kb/kin_pe_pass2_out/2026-06-12/`; alias-guard `kb/_alias_canon.py`) and the
   **2026-06-12 canonical-SUBJ4 fold** (Session 50) — 71,037-alias permutation,
   `kb/subj4_fold_out/2026-06-12/`, downstream chain `kb/_post_apply_chain.py`.

8. **Document at context checkpoints.** Roughly every ~100K tokens of context
   consumed in a session (heuristic — Claude Code doesn't expose an exact
   counter; use proxies: long conversations with many tool calls, large file
   reads, multi-phase strategic work), pause and update **every** artifact below
   — none are optional, all sync to the user's Obsidian via the repo:
   - **`CLAUDE.md`** — project memory + rules + roadmap + §11 (lifecycle,
     tag inventory, etc.). Refresh tag counts + roadmap-table status.
     **Session-narrative budget (added Session 41):** a new session's §11
     subsection is ≤ ~10 lines — headline, numbers, PR #s, pointers to the
     lessons doc (which holds the full story; write it ONCE there, don't
     restate). Keep **at most 2** session narratives inline; at checkpoint,
     move older ones verbatim to `docs/roadmap_archive.md`. Every line in
     this file is context-tax on every future session.
   - **`kb/README.md`** — when KB structure, generators, or audit artifacts
     change.
   - **`README.md`** — root project README. Kept current for first-time visitors.
   - **`docs/<topic>_lessons.md`** — **lessons doc REQUIRED on every checkpoint.**
     Create one on the first checkpoint for a workstream (e.g.
     `docs/unified_courses_audit_lessons.md`), then APPEND a dated section on
     every subsequent checkpoint capturing: what's been learned since the last
     checkpoint, current state, strategic roadmap, and next concrete step.
     Use the Obsidian frontmatter format that
     [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md)
     established (title / date / tags / artifacts / related front-matter).
   - **`docs/kb-notes/<topic>.md`** — **KB-candidate lane (added Session 11,
     2026-05-27).** At every checkpoint, ask: did this run produce a learning
     that's durable, reusable, distilled, and self-contained? If yes → author
     a standalone note in `docs/kb-notes/` using
     [`docs/kb-notes/_template.md`](docs/kb-notes/_template.md) with
     `kb-status: candidate`. Five types: `methodology` (reusable patterns),
     `reference` (external-source distillations), `adr` (architecture
     decisions), `glossary` (lookup cards), `playbook` (procedures). Lessons
     docs are the workstream scratchpad; KB notes are the **distilled, durable
     output** intended for Obsidian-vault first-class indexing. Promotion
     workflow + tag taxonomy in [`docs/kb-notes/README.md`](docs/kb-notes/README.md).
     The checkpoint commit body lists any new candidates added this run so Sam
     sees the review queue.
   - **`docs/INDEX.md`** — auto-maintained landing page for the project's docs
     surface. Refresh at every checkpoint: new KB notes, lessons docs, session
     handoffs all get table rows. Obsidian renders this as the vault-side
     entry point for `cpl-project-tracker/`.
   - **Pipeline visualization on the dashboard (`#tab-pipeline`)** — **refresh
     whenever the workstream moved the pipeline (added 2026-05-30).** The Pipeline
     tab is hand-maintained static content living in **both `CPL_Dashboard.html`
     and `index.html`** (Rule 4 — keep the two identical; this tab is NOT
     regenerated by `excel_to_dashboard.py`). Keep it in sync with reality:
     **Phase roadmap** (`.pl-phase` cards in `#pl-section-roadmap` — flip
     done/active/parked to match the §11 roadmap table), **Auditor receipt**
     (`.pl-stat` cards in `#pl-section-audit` — latest `kb/_row_audit.py` tag
     counts/scores), **Recent re-mint** (`#pl-section-remint` — newest
     re-mint/apply), and the **M-ID lifecycle** mermaid (`#pl-section-lifecycle`,
     only if the stages themselves changed). Skip only if this checkpoint didn't
     touch the pipeline at all.
   - **`docs/session_<N+1>_handoff.md`** — **next-session prompt, written/refreshed
     on EVERY checkpoint (safeguard, changed 2026-05-30).** Previously session-end
     only; now refreshed every checkpoint so a fresh paste-able prompt ALWAYS exists
     if a session gets bricked or context is consolidated mid-stream. Overwrite the
     same N+1 file each checkpoint so it always reflects the latest state. Second
     person ("You are Session N+1"), paste-able into the next session's first
     message, covering: what shipped, docs to read in order, the priority
     workstream(s), carryover items + status, patterns that worked, safety patterns
     to honor, and a moniker suggestion with an open door for the next session to
     claim its own. Reference example: [`docs/session_6_handoff.md`](docs/session_6_handoff.md)
     (Bruh Quad → Session 6, the first instance of this practice). Keep it long
     enough to be useful (~4500 chars / 170 lines is the sweet spot) — the next
     session is starting cold.

   - **`kb/cpl_todos.json`** — **the dashboard To-Do feed (added Session 47),
     refreshed on EVERY checkpoint alongside the handoff** (it is the handoff
     distilled for the dashboard: ≤ ~12 layman-readable items split For Sam /
     For Fable + a "where we are" `_status`, rendered by `cpl_todos.js` as the
     📋 button on every tab). Bump `_as_of` (resets viewers' check-offs),
     DELETE done items (never leave them checked), keep counts current.

   Capture in each: (a) what's been learned this checkpoint, (b) current
   state of the work, (c) strategic roadmap, (d) next concrete step.
   Better to checkpoint slightly early than slightly late — sessions can
   end abruptly and what's not in a markdown file is effectively lost. The
   user can trigger a checkpoint at any time with the **`/checkpoint`**
   slash command (`.claude/commands/checkpoint.md`).

## Branch policy

- Work on feature branches; open a PR to `main`.
- Claude sessions: use `claude/<short-description>` branches (the session
  harness handles this automatically). **Sibling branches authorized (Sam,
  2026-06-11):** a session may create additional `claude/<desc>` branches
  off `main` for INDEPENDENT PRs, instead of serializing unrelated changes
  through one branch (the Session-41 friction: 3 stacked PRs, each needing
  a post-squash rebuild). One concern per branch; the assigned branch stays
  the default for the session's main workstream.
- **Artifact policy (added Session 41, 2026-06-11):** prefer CODE-ONLY PRs —
  ship generator/consumer changes without committing the regenerated
  `unified_courses_*.js` / `credential_reference_data.js` artifacts, and let
  the daily cron (or a `workflow_dispatch`) publish them. Committing ~100MB
  of artifacts from a session is what made #348 conflict with the mid-PR
  backstop cron (generated-file conflicts are never resolvable by picking
  sides — you rebuild + regen). Manual live-on-merge artifact commits remain
  the FALLBACK when same-hour liveness matters and no dispatch path exists.
  ✅ **Dispatch GRANTED + CONFIRMED 2026-06-11** (Sam accepted the Claude
  GitHub App's Actions permission; a session dispatched `daily-dashboard.yml`
  via `mcp__github__actions_run_trigger` the same minute — 204). The
  post-merge dispatch is now the DEFAULT: merge the code-only PR, dispatch
  the workflow, let the runner publish artifacts. Manual artifact commits
  only when the workflow itself is broken.
- **Sam's one-time repo toggles — ALL SET 2026-06-11:** ① **Allow
  auto-merge** ✅ (a session can `enable_pr_auto_merge` after marking ready);
  ② **Automatically delete head branches** ✅ (the post-merge 403 branch
  leftovers end); ③ Claude GitHub App **Actions: Read and write** ✅
  (self-dispatch works — cron self-heal + the artifact policy above are
  live).
- **Always watch PRs.** When a Claude session opens a PR, subscribe to its
  activity (CI + review comments) and follow through — fixing small/clear
  issues, asking when ambiguous — until the PR is merged or closed.
- **Auto-merge authorization (added Session 11, 2026-05-27; broadened
  Session 12, 2026-05-27 — Bruh Dec; trust-expanded 2026-05-30 — Sam:
  "change rules to not require my review before you squash-merge. I trust
  you at this point, Bruh!").** Claude sessions merge **every** PR they
  open in this project as soon as the universal gates below are met.
  **Sam's review/approval is NOT a gate — do not wait for him to review,
  and do not wait for an explicit "merge" go-ahead.** Open the PR (as a
  draft per the harness default), let CI run, then mark it ready and
  squash-merge the moment CI is green. The "confirm-before-merging for
  architecturally significant PRs" carve-out was removed: the real safety
  mechanisms for re-mints / schema migrations / Excel→Supabase phases are
  inside the workstream itself (pre-merge dry-run review, in-script V1–V4
  apply gates, `workflow_dispatch` manual triggers on the apply workflow),
  not at the PR-merge button. Merging an apply-script PR doesn't auto-run
  the apply.
  - **CI gate = required checks pass; merge on `clean` OR `unstable`.** "Green"
    means the *required* check(s) (TruffleHog, plus any push-only checks like
    CodeQL when they apply) passed. In GitHub's `mergeable_state`, that is **both
    `clean`** (everything green) **and `unstable`** (mergeable; only a
    *non-required* check is still pending/failing — a pending/failing *required*
    check reads **`blocked`**, never `unstable`). **So merge on `unstable` too —
    do NOT wait for it to flip to `clean`.** Only **`blocked`** (required check
    failing/pending), **`dirty`** (merge conflict), or **`behind`** actually gate.
    (Over-waiting for `clean` on `unstable` PRs — then ending the turn so the
    CI-success event never woke the session — is what made #221/#223 sit until
    Sam nudged "Go!", 2026-06-01. Don't.)
  - **Autonomous engineering PRs → merge on green; don't wait for a comment,
    review, or "Go!".** For the session's *own* work (refactors, migrations, bug
    fixes, dead-code deletes, generator/doc changes it initiated), Sam's
    review/comment is **not a gate** — he trusts the session to merge. If a
    reviewer comment **already exists** and is an unresolved change-request,
    address it (fix, or ask when ambiguous) first; absent that, a
    mergeable-on-green PR is squash-merged, full stop. (#221/#223 should have
    merged on `unstable` instead of ending the turn to wait for Sam's "Go!" —
    2026-06-01.)
  - **Carve-out — hold for input ONLY when you have a concrete reason to.** The
    default is always merge-on-green (above), **including for docs Sam
    commissioned** — being a thing he asked for is **not** itself a reason to hold.
    Hold (ready, not draft) only when there's a specific, articulable reason the
    merge genuinely benefits from his input first: the deliverable has a known
    **gap** pending something only he supplies (a screenshot to finish a section),
    or an embedded **decision** only he can make. That concrete reason is what made
    the #222 hold right — §5 had an explicit placeholder for his screenshot. (Sam,
    2026-06-01: *"Good call on holding 222"* + *"hold for comment only if you have
    a reason to hold."*) **No reason → merge**, even if he asked for it; fold later
    polish into a follow-up. When you DO hold: mark **ready**, state the reason,
    merge on his nod. Never leave it in *draft*.
  - **Merge promptly — never PARK a PR in DRAFT.** Mark it **ready immediately** (a
    PR can be ready while CI runs). For autonomous work, squash-merge the instant
    it's mergeable on green (`clean` OR `unstable`) — in the SAME turn, rather than
    ending the turn to "wait." Draft-parking is the sin (#202 left in draft during
    recon, 2026-05-30); a *ready* PR held briefly for Sam's input on a deliverable
    he commissioned is fine (#222).
  - **Backstop once the repo allows it (RECOMMENDED — Sam to enable):** turn on
    repo **Settings → General → Pull Requests → Allow auto-merge**, then a session
    can call `mcp__github__enable_pr_auto_merge` (squash) right after marking ready,
    and GitHub merges the instant required checks pass — no turn-ending wait, no
    nudge needed. (Tried on #220, 2026-06-01 — failed: "Auto-merge is not enabled
    for this repository." Until it's on, merge manually per the rules above.)
  - **Method: squash and merge** — collapses to one commit on `main` with
    the PR title + body. Matches the existing `Merge pull request #N`
    history pattern.
  - **Delete the feature branch on merge.** ⚠ **Known limitation (2026-05-30):**
    deleting the remote branch from a session via `git push origin --delete`
    returns **HTTP 403** — the session's git token can't delete branches (the
    squash-merge itself still succeeds). Durable fix: enable repo Settings →
    **"Automatically delete head branches"** so GitHub deletes it on merge. Until
    that's on, a merged feature branch is a harmless cosmetic leftover (delete via
    the PR's "Delete branch" button); don't burn retries on the 403.
  - **Never force-push `main`** (Rule 5 — Pages serves from it).
  - Use `mcp__github__merge_pull_request` with `merge_method: "squash"`.
  - The session-end handoff still notes any architecturally-significant
    PR that landed so the next session has context, even though no
    pre-merge pause happened.

## Engineering & UI practices (added Session 32, 2026-06-04)

From a retrospective Sam asked for. These are lightweight standing practices —
honor them in normal work:

- **Commit your verification.** Front-end (consumer JS) changes get a jsdom test
  under `tests/` (run with `npm test`; `tests/run.js` auto-discovers
  `tests/*.test.js`). Don't write a throwaway `/tmp` test and discard it — a test
  worth running once is worth committing. Make it guard the *failure mode* (e.g.
  the CER test injects a `raw_variants:null` row to guard the search/expand
  crash). `node_modules`/`package-lock.json` stay gitignored; CI
  (`.github/workflows/js-tests.yml`) runs `npm install && npm test` as a
  **non-required** check (never gates merge-on-green). See
  [`docs/kb-notes/methodology-commit-the-test-harness.md`](docs/kb-notes/methodology-commit-the-test-harness.md).
- **New CSS uses `var(--token)`, never a raw hex.** The `:root` block (top of both
  HTMLs) holds the brand + surface/text/link tokens. If a role is missing, add a
  token (in BOTH HTMLs — Rule 4) rather than inlining hex. Palette + canonical
  components (chip, badge, table, curate affordance):
  [`docs/kb-notes/reference-ui-design-system.md`](docs/kb-notes/reference-ui-design-system.md).
- **Prefer injecting tab CSS from the tab's JS** (the CER `ensureCerScopeCss()`
  pattern) over editing the HTML `<style>` blocks — JS is one static file, so it
  covers both HTMLs without a Rule-4 mirror. Only the global `:root` tokens need
  the mirror.
- **No horizontal scroll whenever feasible (Sam, 2026-06-11).** Tables/grids
  fit the viewport at desktop widths: tighten cell padding/fonts, truncate
  long text cells with ellipsis + the full value in `title`, fold redundant
  suffixes ("X Community College District" → "X CCD"), shorten headers
  (`P1`/`P2`/`P3` + a `title`), and prefer drill-in rows over extra columns.
  Keep `overflow-x: auto` on the wrapper only as the narrow-screen safety
  net — never as the default desktop experience. (First applied: the
  Implementation Funding college table. Hardened on the CCR, Session 43:
  `table-layout:fixed` + explicit colgroup — auto layout had silently parked
  columns past the wrap's right edge, per filtered row set; see
  [`docs/kb-notes/methodology-fixed-table-layout-off-pane-columns.md`](docs/kb-notes/methodology-fixed-table-layout-off-pane-columns.md).)
- **Prototype UI in a fast-feedback canvas, then port.** For a new tab or visual
  rework, iterate the look in a Claude artifact / claude.ai (live preview), lock
  it with Sam, then implement into the monolith. In-repo analog: the EACR
  versioned prototype gallery.
- **Stop-hook:** the repo carries the canonical
  [`scripts/stop-hook-git-check.sh`](scripts/stop-hook-git-check.sh) (install:
  `cp scripts/stop-hook-git-check.sh ~/.claude/`). It ignores GitHub's own
  squash-merge commits, so the "Unverified `noreply@github.com`" nag after a
  squash-merge + `reset --hard origin/main` is gone — that commit is on `main`
  and must NOT be amended (Rule 5).

## Deployed site

https://cpl-initiative.github.io/cpl-project-tracker/

## Obsidian vault wiring (added Session 11, 2026-05-27)

Sam's Obsidian vault is rooted at
`C:\Users\samuel.lee\Documents\GitHub\COG-second-brain\` (**repointed
2026-05-28, PR #178** — it previously pointed at
`Documents\Claude\Projects\CPLBrain\COG-second-brain\`, but the sync script
pulled there while Obsidian read the `GitHub\` path, so checkpoint commits +
KB notes never appeared in the vault; root cause + Windows cutover steps in
[`docs/kb-notes/playbook-vault-sync-setup.md`](docs/kb-notes/playbook-vault-sync-setup.md)).
This repo is cloned **into the vault** at
`COG-second-brain\cpl-project-tracker\` so Obsidian indexes every `.md` file
the session writes.

Three doc lanes in this repo, by lifecycle (see
[`docs/INDEX.md`](docs/INDEX.md) for the landing page):

| Lane | Path | Purpose |
|---|---|---|
| **KB notes** | `docs/kb-notes/<topic>.md` | Distilled, durable, reusable knowledge with `kb-status: published|archived|internal` (the `candidate` middle state was retired Session 11). **THE Obsidian-target lane.** |
| **Lessons (WIP)** | `docs/<workstream>_lessons.md` | Workstream scratchpads, append a dated section every checkpoint. |
| **Session handoffs** | `docs/session_<N>_handoff.md` | "Fattyfat" capsules for the next session. |

The KB-notes lane is **proactive + auto-flowing**: when a session learns
something durable, a new note lands in `docs/kb-notes/` with `kb-status:
published` (no review-queue middle state — sessions author at final
quality). The checkpoint commit body lists new notes for the audit trail.

**Vault auto-sync (added Session 11, 2026-05-27):** `scripts/sync-vault-clones.ps1`
runs on Sam's Windows Task Scheduler every 5–15 minutes, fast-forward-pulling
`cpl-project-tracker` + `cpl-knowledge-base` from origin into the canonical
`Documents\GitHub\COG-second-brain` vault root (`$vaultRoot` repointed
2026-05-28, PR #178). KB notes (and every other repo doc) appear in Obsidian
automatically. The script is strictly
safe: never auto-merges, skips repos with uncommitted work, logs to
`.vault-sync.log`. Setup walkthrough:
[`docs/kb-notes/playbook-vault-sync-setup.md`](docs/kb-notes/playbook-vault-sync-setup.md).

Vault-side hygiene: heavy non-markdown paths (`kb/coci_*.json`,
`unified_courses_*.js`, `kb/row_audit/`, etc.) are excluded in Obsidian's
**Files & Links → Excluded files** so the graph stays clean.

**Checkpoint scope — vault, never the public KB.** Rule 8 / `/checkpoint`
refreshes *this* repo's docs (`docs/kb-notes/`, lessons, §11, the To-Do feed),
which auto-sync into Sam's Obsidian vault + the `CPLBrain` repo with no review
gate — correct for internal working memory. Checkpoint must **never** write to
the public `cpl-knowledge-base`. That repo is a separate, audience-facing store
reached **only** through its curation pipeline (`CPLBrain/audit/curation-manifest.tsv`
→ `cpl-knowledge-base/tools/curation_assistant.py` → a human-reviewed **draft
PR** per its `CURATION.md` — its "Promoting a checkpoint or vault note" section
is the explicit path). Promoting a checkpoint learning into the public KB is a
deliberate, human-gated step — never a checkpoint side effect.

---

## Pipeline Reference

### 1. Architecture Overview

```
CCCCO MAP CPL Dashboard (Azure)
        │
        ▼  /api/potential-savings (JSON)
Cloudflare Worker (cpl-proxy.slee-548.workers.dev)
        │
        ▼  GET /scrape?secret=...
live_metrics.json
        │
        ├── CPL_Initiative_Project_List_v3.xlsx (project data, budget, workplan)
        ▼
excel_to_dashboard.py (Python pipeline)
        │
        ├── CPL_Dashboard.html (rendered with KPI cards, project cards, charts)
        ├── CPL_Data.js (JSON data for filters/search)
        ├── statewide_data.js
        ├── kpi_history.json (appended daily)
        └── reports/ (Word doc reports)
              │
              ▼  copied to index.html, committed, pushed
GitHub Pages (cpl-initiative.github.io/cpl-project-tracker/)
```

The Cloudflare Worker calls the CCCCO Dashboard's REST API directly — no
browser automation. This was a deliberate design decision after Chrome-based
scraping proved unreliable.

### 2. File Inventory

| File | Purpose |
|------|---------|
| `cloudflare-worker-proxy.js` | Dual-purpose Cloudflare Worker: POST `/` for Claude API proxy (Custom Reports), GET `/scrape` for KPI scraping |
| `excel_to_dashboard.py` | Main pipeline: reads Excel + live_metrics.json → generates HTML, JS, Word reports |
| `CPL_Initiative_Project_List_v3.xlsx` | Master project data: projects, budget, personnel, workplan goals |
| `live_metrics.json` | Latest scraped KPI data |
| `CPL_Dashboard.html` | Generated dashboard HTML |
| `index.html` | Mirror of `CPL_Dashboard.html` served by GitHub Pages |
| `CPL_Data.js` | Exported project data for client-side filtering |
| `kpi_history.json` | Daily KPI snapshots — drives trend sparklines + deltas |
| `statewide_data.js` | Statewide exhibit adoption data |
| `statewide_prescriptive.js` | EACR prescriptive layer (`window.CPL_STATEWIDE_PRESCRIPTIVE`, keyed by `unified_title`): per credential, the colleges that could adopt it + the likely local course each already teaches. M-ID `adoption_leverage` ⨝ minted memberships, over-merged withheld (§6a). Generated by `_build_statewide_prescriptive()`; consumed by the EACR v2 Credential view. |
| `college_short_names.js` | College full-name → short-name resolver (`window.cplCollegeShort(name[, style])`, `window.CPL_COLLEGE_SHORT`). Generated from `kb/college_short_names.json` by `kb/_seed_college_short_names.py`; `<script>`-loaded after `college_lookup.js`. Powers compact college chips on CCR/EACR/CER (short text + full name in `title`). Static — NOT a daily-cron artifact. See `docs/kb-notes/reference-college-short-names.md`. |
| `cpl_funding.js` | Implementation Funding tab renderer (`window.CPL_FUNDING_TAB`). Lazy-loaded by the tab shell's inline boot on first `#implementation-funding` open; injects its own `var(--token)` CSS (no Rule-4 mirror needed). Static — NOT a daily-cron artifact. Docs: `docs/cpl_funding_lessons.md`. |
| `cpl_funding_data.js` | Funding-model data (`window.CPL_FUNDING`: pools, 3 priorities, 118 colleges + SYSTEM). Built one-shot by `funding/_build_funding_data.py` from the committed `funding/CPL_Funding_Model_2026.xlsx` (PII-clean institutional/census aggregates; builder re-derives every allocation and asserts <1¢ drift). Static — NOT a daily-cron artifact; new workbook edition → re-run builder → commit both. |
| `cpl_funding_performance.js` | Funding priority-metric actuals (`window.CPL_FUNDING_PERF`: per-college P2/P3 distinct-student counts + statewide, small-cell suppressed <5 per the RATIFIED `docs/kb-notes/adr-funding-priority-metrics-privacy.md`). **Daily-cron artifact**: built by `funding/_build_funding_performance.py` from the transient `CustomReport_latest.json` (workflow step 4a2; in the `git add` list); skips gracefully on fetch fallback. P1 is a deliberate gap (`docs/kb-notes/reference-p1-completion-data-gap.md`). |
| `tmc_builder.js` | TMC Builder tab renderer (`window.CPL_TMC_BUILDER`). Lazy-loaded on first `#tmc-builder` open; injects own `var(--token)` CSS. College+TMC selectors → fixed C-ID left / COCI-dropdown right, C-ID auto-match, units check, Total Units, Supabase Save/Resume, export (.docx/print/JSON). Static — NOT a daily-cron artifact. Docs: `docs/tmc_builder_lessons.md`. |
| `tmc_templates.js` | The **45-TMC catalog** (`window.CPL_TMC_TEMPLATES`) — **AUTO-GENERATED by `tmc/_parse_tmc_pdfs.py`** from the official ASCCC TMC PDFs (`tmc/source_pdfs/*.pdf`, committed for provenance). All 45 are `draft` (parsed from the official template, faculty-verify) with real C-IDs + authoritative titles (verified C-IDs pull their title from `cid_descriptors.json`), per-section structure (Required Core / List A/B/C), and an official-template URL in `_meta.sources`. Slots with `cid_unverified:true` carry a C-ID not in our descriptor extract — a deliberate **discrepancy signal** that C-ID (or our reference) may need updating. **Session 66 added the CO-review acceptance metadata** (`refine_slot()`): per-slot **`flexible:true`** marks a FLEXIBLE proviso ("any articulated major-prep / CSU-transferable course") = accept any qualifying course + ASSIST evidence (engine tier 2); per-TMC **`flexibility:'fixed'|'flexible'`** (5 fixed); embedded C-IDs (inline "…C-ID AFS 100" / stray verified tokens) are recovered → real slots, fixing the only 0-C-ID template (African American Studies). 584 C-ID + 119 flexible slots. See `docs/kb-notes/reference-adt-acceptance-rules.md`. Re-run after refreshing a PDF. Static. |
| `tmc_college_courses.js` | Per-college COCI course index (`window.CPL_TMC_COLLEGE_COURSES`: 120 colleges, 141,699 courses, 7.5 MB) powering the right-side pickers. Built one-shot by `tmc/_build_college_courses.py` from `kb/reference/coci_course_list.xlsx`; `cid` normalized to the descriptor key for auto-match. Static — rebuild only on a fresh COCI extract; NOT in the daily `git add` list. |
| `tmc_college_adts.js` | Per-college **approved-ADT overlay** (`window.CPL_TMC_COLLEGE_ADTS`: `by_college[college][tmc_id] → {b:bucket, s:status, c:control#, a:approvedDate, u:units, t:rawTitle}` + `tmc_totals` + `extra_tmcs`) — the **authoritative source** for which colleges hold an approved ADT in each discipline. Built one-shot by `tmc/_build_college_adts.py` from the COCI **program** export (`tmc/source_data/coci_program_export_<date>.csv`, committed for provenance). The TMC tab stamps a per-college status onto each TMC, mirroring COCI's two affirmative states separately (Session 66 — ✓ Active = live in catalog · ✓ Approved = CO-approved, pending activation · ⏳ In progress · ◐ Teachout; Inactive hidden). 3,238 (college,TMC) pairs (2,867 active · 218 approved-pending) · 115 colleges · 42 ASCCC TMCs + UCTP. UC Transfer Pathway (UCTP Chemistry/Physics) are their **own instances** (`extra_tmcs`, `kind:"uc-transfer-pathway"`), never folded into the Chemistry/Physics ADT. Lazy-loaded by `tmc_builder.js`. Static — NOT a daily-cron artifact; rebuild on a fresh COCI program extract. |
| `tmc_ge_patterns.js` | The **GE Breadth patterns** (`window.CPL_TMC_GE_PATTERNS`) for the full-ADT companion panel (Session 60): **Cal-GETC** (the single statewide ADT GE pattern as of Fall 2025, AB 928; primary) + legacy **IGETC** and **CSU GE Breadth**. Each modeled as `sections[].slots[]` like a TMC but `ge:true`+`noncid:true` (college-certified GE areas, no C-ID auto-match; `units` = per-course minimum). **DRAFT** — encoded from public ASCCC/CCC standards (CCCCO Breadth Form PDFs bot-block the agent env), verify against the official forms. Lazy-loaded by `tmc_builder.js`. Static — NOT a daily-cron artifact. |
| `dashboard_filters.js` | Client-side filter/search/sort logic |
| `kpi_reorder.js` | Login-free drag-to-reorder for the headline KPI grid (`.kpi-section`): per-browser order in localStorage (`cplKpiOrder.v1`), cards re-matched by label text across daily regens, new cards re-enter at default position, ↺ reset affordance. Static — NOT a daily-cron artifact. |
| `first_light.js` | **First Light** — the once-a-day plein air greeting (added Session 48): date-seeded painting-of-the-day modal with **local-day rotation** (no day-to-day repeats, Session 62; **89-painting gallery, Session 65**; grayscale→color reveal **(mono:true B&W prints skip the no-op fade via `.cplfl-mono` — load-bearing since 2026-06-23; a build guard fails any un-flagged B&W)**, read-aloud via browser `speechSynthesis`, hand-written alt text), opt-out + once-per-day localStorage guards, a **hidden reviewer almanac** (type `almanac` anywhere → ‹ Prev/Next › the full catalog with a counter; a review pass never consumes the daily greeting — the private QA tool, NOT a public browse-all), runtime-injected "Today's painting" header chip (regen-proof), an anonymous reflection box POSTing `{painting, reflection}` to Supabase `cpl_reflections` (anon WRITE-ONLY RLS; the weekly **musings digest** reads them server-side via `reflections/build_reflections_digest.py` → output bound for the private `cpl-knowledge-base` vault, NOT this repo), and — since the Session-49 retheme — the **ghosted painting layer** behind the whole page (`.cplfl-bg`: today's pick grayscaled at 14% opacity, painterly fallback, honors the opt-out + `prefers-reduced-transparency`/`contrast`). Manifest = **89** verified-PD paintings, built by the **runner-as-Commons-proxy** pipeline — `tools/source_first_light_art.mjs` (sources exact PD filenames from the Commons API on a CI runner, since the agent sandbox can't reach Wikimedia) → `tools/build_first_light_manifest.mjs` (assembles from the curated `tools/first_light_selection.json`; no hand-typed filenames) → `.github/workflows/first-light-art.yml` (push-triggered source + image-liveness verify). Categories in `tools/art_categories.json`; iconic works via the append-only `tools/art_extra_files.json`. Sourcing rules: `docs/kb-notes/reference-public-domain-art-sourcing.md`; pipeline: `docs/kb-notes/playbook-runner-as-external-api-proxy.md` + `docs/first_light_lessons.md`. Static — NOT a daily-cron artifact. Theme spec/prototype: `prototype/first_light_theme_v1.html` (**v1.6 — GLASS-QUIET chips graduated**, Sam-blessed 2026-06-12; solid family archived in the Chip Studio) + `prototype/check_contrast.py` (whose `--live` mode lints the live `:root` in CI — the retheme SHIPPED Session 49, PRs #407/#408/#410). Tests: `tests/first_light*.test.js`. |
| `cobi_brand.js` | **COBI brand layer** (added Session 65): the masthead personality for *COBI — Chancellor's Office Business Intelligence* (a light Kobe homage). STATIC, regen-proof (the `first_light.js` pattern — injects own CSS + runtime DOM): a **rotating Mamba subtitle** (random per load), an **8→24** jersey wink on the wordmark, **Mamba Day** (Aug 24 → purple & gold). The `<h1>`/`<title>` emit `COBI` from the generator (decoupled from `proj_title` so Word reports keep their name); tagline + `#cobi-mamba` slot + nav label are static in BOTH HTMLs (Rule 4). Tests: `tests/cobi_brand.test.js`. Docs: `docs/cobi_lessons.md`. |
| `cpl_todos.js` | The 📋 To-Do button on every tab (added Session 47): renders `kb/cpl_todos.json` as a For-Sam / For-Fable daily checklist with a "where we are" status line; per-browser check-offs (`cplTodos.v1`, keyed by the feed's `_as_of` so each refresh starts fresh); per-tab badge + nav chips for other tabs' items. Feed refreshed at every Rule-8 checkpoint. Static — NOT a daily-cron artifact. |
| `report_generator.js` | Custom Report Generator (Claude API via proxy) |
| `docx.min.js` | Local copy of docx@8.0.4 UMD build (do **not** switch to CDN) |
| `fetch_custom_report.py` | Fetches CustomReport JSON from the MAP API |
| `cpl_news.js` | **CPL News** tab renderer (`window.CPL_NEWS_TAB`). Lazy-loaded on first `#cpl-news` open; injects own `var(--token)` CSS; reads `public.cpl_news` LIVE (anon) — CA-first, scope/source/search filters, suggest-a-story, reviewer feature/hide. Static — NOT a daily-cron artifact (the feed is the live table, not a committed file). Fed by the **`cpl-news-harvest`** Supabase Edge Function (`chatbox/supabase/functions/cpl-news-harvest/index.ts`) invoked by **`.github/workflows/cpl-news.yml`** (cron 13:17 UTC). Schema: `news/supabase_cpl_news.sql`. Docs: `docs/cpl_news_lessons.md` + `docs/kb-notes/playbook-cpl-news-aggregation.md`. Added Session 67 (Skywatch, PR #481). |

### 3. Cloudflare Worker (cpl-proxy)

**URL**: `https://cpl-proxy.slee-548.workers.dev`

**Env vars (encrypted in Cloudflare dashboard)**
- `ANTHROPIC_API_KEY` — for Claude API proxy (Custom Reports)
- `SCRAPE_SECRET` — shared secret for scrape endpoint (currently `CPL_SCRAPE_2026`)

**Endpoints**
- `POST /` — proxies to `https://api.anthropic.com/v1/messages`. CORS restricted
  to `cpl-initiative.github.io`, `localhost`, `127.0.0.1`.
- `GET /scrape?secret=SCRAPE_SECRET` — calls the CCCCO Dashboard API, returns
  JSON with 6 KPI metrics + college tier classification.

**Data source**: `GET /api/potential-savings?cpltype=0&indExcludeSA=0` on
`cpldashboardcccco.azurewebsites.net`. Returns ~117 rows: Count (`Sorder=-1`),
ALL COLLEGES aggregate (`Sorder=1`), ~115 individual colleges (`Sorder=2`).

**6 KPI metrics output**: STUDENTS SERVED, ELIGIBLE UNITS, TRANSCRIBED UNITS,
SAVINGS, 20-YEAR IMPACT, ACTIVE COLLEGES (with Leading/Advancing/Inactive tier
breakdowns).

### 4. 3-Tier College Classification — "3 of 5" criteria model

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Student Volume | Students ≥ 500 |
| 2 | Articulation Depth | Eligible Units ≥ 3,000 |
| 3 | Avg Eligible Units/Student | AverageUnits ≥ 5 |
| 4 | Transcription Rate | TranscribedUnits/Units ≥ 25% |
| 5 | Avg Transcribed Units/Student | TranscribedAverage ≥ 3 |

- **Leading**: meets ≥ 3 of 5
- **Advancing**: not Leading and not Inactive
- **Inactive**: Students < 10 AND Units = 0

Rationale: the 3-of-5 model lets small colleges like Palo Verde (14 students)
reach Leading through effectiveness metrics, while large colleges with only
volume stay Advancing.

### 5. Python Pipeline (excel_to_dashboard.py)

1. Reads `CPL_Initiative_Project_List_v3.xlsx` (projects, budget, workplan,
   update log)
2. Reads `live_metrics.json`
3. Merges live metrics into headline KPIs (replaces static values, adds LIVE
   badges)
4. Generates the dashboard HTML by **replacing sections in the existing HTML**:
   KPI Summary Cards, Activity KPI Cards, Project Cards, Workplan Progress,
   Budget, Vision 2030, exhibit analysis section
5. Exports `CPL_Data.js`, `statewide_data.js`
6. Appends snapshot to `kpi_history.json`
7. Generates Word reports (master + per-project)

**Live Metrics Merge** — `merge_live_metrics()` maps scraped metric titles to
KPI keys:

```python
title_map = {
    "STUDENTS SERVED":    "cumulative_students",
    "ELIGIBLE UNITS":     "eligible_units",
    "TRANSCRIBED UNITS":  "transcripted_units",
    "SAVINGS":            "estimated_savings",
    "20-YEAR IMPACT":     "twenty_year_impact",
    "ACTIVE COLLEGES":    "active_colleges",
}
```

Preserves `note` fields on breakdowns (rendered as parenthetical descriptions)
and `footnote` arrays (rendered as small text at bottom of KPI card).

**Running locally**
```bash
python3 excel_to_dashboard.py
```

### 6. Daily GitHub Actions Workflow

`.github/workflows/daily-dashboard.yml` — runs daily on a **3-cron ladder**
(`17 6` / `17 9` / `17 12 * * *` = 06:17 / 09:17 / 12:17 UTC, ~3h apart; pulled
earlier + a 3rd cron added 2026-06-22, superseding the 2026-06-01 PR #216 two-cron
setup) and on manual dispatch. The ladder exists because GitHub's `schedule`
trigger is best-effort: it chronically delays this cron 1.5–4h and occasionally
**drops** a run with no failed run + nothing queued (e.g. 2026-06-01; prior
2026-04-18 needed a Rule-3 interpolated `kpi_history` backfill). We can't shrink
the delay, so we schedule EARLY (primary ≈11 PM PT the night before) for buffer
and let later crons catch a dropped/over-delayed earlier one before the workday.
The job is idempotent (concurrency group `daily-dashboard` + same-day
snapshot/`kpi_history` overwrite + "no staged diff → no commit"), so a later cron
firing after a good earlier run is a safe no-op. Diagnosis + fix playbook:
[`docs/kb-notes/playbook-github-scheduled-workflow-reliability.md`](docs/kb-notes/playbook-github-scheduled-workflow-reliability.md).
Uses `actions/checkout@v6` + `actions/setup-python@v6`.

Steps:
1. Checkout `main`
2. Fetch CustomReport JSON (`fetch_custom_report.py`)
3. Scrape live metrics via Cloudflare Worker
4. **Sync curation overlay from Supabase** — runs `kb/_apply_curation.py`
   (folds `public.kb_curation` edits into `kb/coci_curation.json`). Guarded on
   the `SUPABASE_SERVICE_KEY` secret; skips gracefully if it's unset.
5. Run `excel_to_dashboard.py`
6. `cp CPL_Dashboard.html index.html`
7. Commit + push to `main` (rebase-retry loop for concurrent pushes — see
   commit `679c5ef`). The commit list includes `kb/coci_curation.json`,
   `unified_courses_data.js`, `unified_courses_index.js`,
   `unified_courses_details.js`, `unified_courses_standalone.js`,
   `unified_courses_members.js`, and `exports/unified_courses.xlsx` so curation +
   the regenerated Unified Courses dataset, lazy files, and export are captured
   each day. (If you add a new generated `unified_courses_*.js`, add it to this
   `git add` list or the daily run won't publish it.)

Commits as `github-actions[bot]` with message `Daily dashboard update — YYYY-MM-DD`.

**Secret required for the curation sync**: `SUPABASE_SERVICE_KEY` (the Supabase
service-role key) in repo Actions secrets. Without it, step 4 no-ops and
curation only lives in Supabase (still shown live via the tab's overlay).

### 6a. CPL Analytics Section — collapsible card grid

The section previously called "MAP Articulation Analysis" / "Detailed
Articulation Data" was renamed to **CPL Analytics** on 2026-05-18. Key
properties to preserve:

- Collapsible chrome reuses the **KPI Metrics** wrapper classes
  (`.kpi-section-wrapper`, `.kpi-section-header`, `.kpi-section-title`,
  `.kpi-toggle-arrow`) so the two sections feel identical. Body class
  is `.cpl-analytics-body`; the collapse rule is
  `.kpi-section-wrapper.collapsed .cpl-analytics-body { display: none; }`.
- Each card has a header **title-row** with a per-table **Excel export
  button** on the right that links to `exports/<card_id>.xlsx`. The
  xlsx files are pre-generated by `_write_analytics_xlsx_export()`
  during the daily run; no client-side xlsx library is shipped.
- Each of the 5 main tables has a **Total row** styled with class
  `.exhibit-total-row`. The two ranking tables — **Top-50 Most-Articulated
  Exhibits** and **Articulations by Unified Course** — are intentionally
  excluded since rank rows don't sum.
- **Articulations by Unified Course** (added 2026-05-22) is the one card
  driven by the **course-identity layer**, not raw MAP rows: it reads
  `kb/coci_articulations.json` via `_build_articulations_by_course()` and
  groups earned MAP articulations by unified course identity (C-ID/CCN/M-ID),
  so the same course taught at many colleges collapses to one row. Columns:
  unified course, discipline, colleges earned, modal credit recommendation,
  linked credential, **adoption leverage** (peer colleges teaching the same
  identity that haven't earned it). HTML shows the top 50 by leverage; the
  xlsx export carries all ~2,355 identities. **Over-merge guardrail:** leverage
  on identities flagged `over_merged` is **withheld** (rendered as "⚠ flagged",
  exported as "over-merged (withheld)") so a conflated cluster never yields a
  bogus adoption target. Skips gracefully if `kb/coci_articulations.json` is
  absent. (This is item (1) of the EACR-identity open thread — the additive
  card; re-pivoting the interactive EACR table itself is the deferred follow-on.)
- The static CSS in the input template carries TWO historical marker
  blocks that the generator now strips on every run:
  `/* ═══ MAP Articulation Analysis Cards ═══ */` (current) and
  `/* ═══ MAP Exhibit Analysis Cards ═══ */` (legacy). Keep both
  strippers in `main()` near the EXHIBIT_CSS_MARKER block — they're
  what guarantees idempotency across rename events.

### 6b. Workplan Activities & Projects wrapper (own tab — moved 2026-05-31)

**Moved out of the Dashboard tab into its own top-level "Activities &
Projects" tab (`#tab-activities-projects`, hash `activities-projects`) on
2026-05-31 (Session 22, PR #206).** Inside that tab, the Activity Metrics,
Filter Bar, and Projects Grid still collapse together as **one** unit, under
the section title **Workplan Activities & Projects**. The Filter Bar applies to
both, so they share one collapse toggle. (Distinct from the **Annual Workplan
Goals** tab, which holds the 5-year targets table — different content.)

- Outer wrapper id: `#workplanProjectsWrapper` (class
  `kpi-section-wrapper`); body class is `.workplan-projects-body`.
  Collapse rule:
  `.kpi-section-wrapper.collapsed .workplan-projects-body { display: none; }`
  (lives inside `EXHIBIT_ANALYSIS_CSS` so the daily regen restores it).
- Wrapper open/close lives in the **static template** (now inside the
  `#tab-activities-projects` pane) between
  `<!-- ═══ Workplan Activities & Projects Section ═══ -->` and
  `<!-- ═══ End Workplan Activities & Projects Section ═══ -->`.
- The injected **Workplan Activity Metrics** subsection has NO inner
  `kpi-section-wrapper` of its own — the outer wrapper provides the
  only collapse. If you re-add inner collapse chrome, you'll get
  nested collapsibles with confusing UX.
- **Generator anchors (post-move — IMPORTANT):** KPI Summary Cards
  replacement, MAP Articulation Analysis strip, and CPL Analytics strip/inject
  end-anchor on the **permanent sentinel `<!-- ═══ Dashboard Sections End
  ═══ -->`**, which **stays in the Dashboard tab** where this section used to
  begin (after CPL Analytics, before the teaser cards). The section's own
  marker travelled with it to the new pane, so it can no longer serve as the
  end-anchor (it'd let the bounded regexes gobble everything between the
  Dashboard tab and the new pane on the next regen — catastrophic). The
  **Workplan Activity Metrics strip/inject** and the **Projects Grid replace**
  still use `<!-- Filter Bar -->` / `<!-- Projects Grid -->` / `<!-- End
  Projects Grid -->` because those anchors travelled *with* the content into
  the new pane and resolve there via `html.find()`. Hard-case procedure:
  [`docs/kb-notes/playbook-move-generated-section-to-tab.md`](docs/kb-notes/playbook-move-generated-section-to-tab.md).

### 7. Custom Report Generator

- **UI**: Modal with audience picker, metric checkboxes, format selection
- **Backend**: POSTs to Cloudflare Worker → Anthropic API
- **Model**: `claude-sonnet-4-5-20250929`
- **Output**: in-browser preview or downloadable .docx (via local `docx.min.js`)
- **Config**: `window.CPL_REPORT_PROXY_URL` set in HTML before
  `report_generator.js` loads

### 7a. College Activity Custom Report — Output Style Guidance

`college_report_generator.js` produces the "[College Name] CPL Update" Word
document. The prompt inside `buildPrompt()` enforces a specific tone and
shape — keep these guarantees if you ever rewrite the prompt:

- **Title**: Single-college reports are titled `<College Name> CPL Update`;
  multi-college reports default to `Selected Colleges CPL Update`. The docx
  builder writes the title itself, so the model is instructed NOT to repeat
  it as a `#` heading.
- **Audience assumption**: a busy college CEO, trustee, or board member —
  someone looking for bragging rights to share with constituents.
- **Tone**: CPL is a new endeavor for most CCCs. Be grateful for any
  activity. Never imply that a college is negligent, behind, or failing.
- **Reframe weaknesses as opportunities.** Low transcription rate → "credit
  waiting to be unlocked." Thin discipline coverage → "room to expand."
  Funding is predicated on outcomes, so gently equip the reader with
  awareness of what unlocks more apportionment, but always invitingly.
- **Structure** (in this order, `##` headings):
  1. Executive Summary — 1-2 short paragraphs, high-level, achievements +
     biggest opportunity. No metric dump.
  2. Notable Accomplishments — bullet list of 3-6 wins, each with a real
     number.
  3. Opportunities to Maximize Funding & Student Impact — bullets/short
     paras reframing gaps as opportunities.
  4. Next Steps — 2-4 concrete actions.
- **Length**: target 600-1,000 words. Eliminate redundancies — never
  restate the same metric in multiple sections.
- **Filename**: `<College_Slug>_CPL_Update_<YYYY-MM-DD>.docx`.

If you change the prompt, mirror the change here so the guidance and the
code stay in sync.

### 7b. Top-level Tab Layout (Phase D, 2026-05-18)

The dashboard renders a left-rail nav of top-level tabs, navigated via URL
hash so they are linkable and survive a refresh. `tabs.js` **auto-derives
`VALID_TABS` from the rendered nav buttons** — adding a tab is "drop a nav
button + a pane," no whitelist edit. The core data tabs (the rest —
`unified-courses`/CCR, `canonical-subj4`/CSR, `credential-reference`/CER,
`exhibit-adoption`, `tmc-builder`/TMC Builder (§7d), `pipeline`, `letters`,
`chatbot`/CPL Assistant — are documented elsewhere; the CPL Assistant RAG tab is
detailed in §7c):

| Tab key (hash) | Display label | Content |
|----------------|---------------|---------|
| `dashboard` (default, no hash) | Dashboard | KPI Metrics, CPL Analytics, **plus teaser cards** linking to the other tabs. (Workplan Activity Metrics + Filter Bar + Projects Grid MOVED OUT 2026-05-31 → `activities-projects`.) |
| `activities-projects` | Activities & Projects | Workplan Activity Metrics, Filter Bar, Projects Grid (the `#workplanProjectsWrapper` collapsible — see §6b). **Added 2026-05-31, PR #206.** |
| `workplan-goals` | Annual Workplan Goals | The 5-year goals + stretch + current table |
| `budget` | Budget | CPL Budget & Expenditure Plan |
| `implementation-funding` | Implementation Funding | CPL Implementation Funding model (DRAFT-chipped) — 2026-30 one-time pools, 3 priorities (shares-first, rev2 workbook), 119 colleges' potential allocations, a **what-if sandbox** (pools/shares/targets editable, per-browser, Reset-to-workbook), and **P2/P3 actuals vs target** from the daily `cpl_funding_performance.js` (P1 = deliberate incentive gap). Shell static; renders from `cpl_funding.js` + `cpl_funding_data.js` (lazy; data static, actuals cron). **Built 2026-06-11, PRs #352–#368** — `docs/cpl_funding_lessons.md` + `docs/cpl_funding_handoff.md`. |
| `vision-2030` | Vision 2030 | Vision 2030 Alignment cards with live progress |
| `knowledge-base` | Knowledge Base | Sign-in-gated **KB Portal** — an `<iframe src="kb-portal/">` (like Letters) over the public CPL Knowledge Base: a magic-link-gated reader + a **New-doc composer** (draft/upload → Claude polish → tokenless GitHub commit). The bundle's own Supabase auth is the gate. **Added Session 63, PRs #464/#465/#467/#468.** Docs: `docs/kb_portal_lessons.md`. |
| `cpl-news` | CPL News | **Auto-curated** CPL news feed (CA-first, then national; + adjacent systems Career Passport / CA Master Plan / workforce-upskilling + CA budget items). Live-reads `public.cpl_news` (filled daily by the `cpl-news-harvest` Edge Function); filters, suggest-a-story (the path closed socials enter), reviewer feature/hide. Renderer `cpl_news.js` (static, lazy). **Added Session 67 (Skywatch), PR #481.** Docs: `docs/cpl_news_lessons.md`. |

Implementation notes (important — keep in sync with the generator):

- Tab nav, tab panes, and the tab-switch JS live in the **static
  template** (`CPL_Dashboard.html`), not in the generator. Each tab pane
  is wrapped with its own `<div class="main-container">` and ends with a
  `<!-- /tab-<name> -->` close comment.
- Section boundary markers were added on Phase D so generator
  replacements stay inside the right pane on repeat runs:
  `<!-- End Projects Grid -->` and `<!-- End Vision 2030 Section -->`
  delimit those two sections; Budget and Annual Workplan Goals
  already had paired `<!-- End ... -->` markers.
- **Annual Workplan Goals is injected TWICE in main()**
  (`render_workplan_goals_html` + `render_annual_goals_table_html`).
  Both code paths now replace **in place** between the AWG markers
  rather than re-anchoring against `<!-- Vision 2030 Section -->` — if
  you re-anchor against Vision again, the content ends up in the wrong
  tab. (See the bug fixed 2026-05-18.)
- The Dashboard tab carries auto-generated **teaser cards** built in
  the generator and injected at `<!-- TEASER_CARDS_PLACEHOLDER -->`.
  The placeholder lives between main-container close and Dashboard
  pane close, so the cards span full width but stay inside the pane.
- Tab switching JS sits at the bottom of the template (just before
  `</body>`) and uses `history.replaceState` for the default tab so the
  URL stays clean.

### 7c. CPL Assistant — in-dashboard RAG chatbot tab (Phase 1, 2026-06-01)

The **CPL Assistant** tab (`#tab-chatbot`, hash `chatbot`) is a conversational
RAG surface. `cpl_chat.js` (a self-contained **static** asset — NOT regenerated
by `excel_to_dashboard.py`) POSTs `{query, session_id}` to the shared Supabase
Edge Function **`cpl-chat`** and streams the answer over SSE (`event: sources`
→ `event: text` deltas → `event: done`). The function runs 4 parallel lookups
(pgvector RAG over `cpl_documents`/`cpl_document_sections`, college detection,
live `live_metrics.json` fetch, topic exhibit search) → a streamed
`claude-sonnet-4-6` answer. Model output is HTML-escaped **before** the
markdown-lite pass (XSS-safe). The browser uses only the public anon key (the
same one already in `unified_courses.js`); 20 req/min/IP rate limit; every turn
is logged to `chat_interactions` (anon-INSERT, no-SELECT) — **don't put PII in
queries.** It's the literal artifact a future Student CPL Portal embed will
reuse, so keep it self-contained behind its CONFIG block.

**Operational invariants (do not violate):**
- The Edge Function is **SHARED + LIVE** — the production map.rccd.edu widget
  calls the same `cpl-chat` + same tables. **Redeploying it affects that widget
  too.** Capture the running version first (`get_edge_function`) so you can roll
  back; Deno validates at deploy time and fails *closed* (a bad deploy leaves the
  prior version up). Smoke-test all 4 modes (general / college / topic /
  college+topic) after a deploy.
- **`verify_jwt` MUST stay `false`** — the function does its own anon-key +
  rate-limit gating; flipping it to `true` would break the live widget.
- Deploy is a **one-shot** via the Supabase MCP `deploy_edge_function` (project
  `hvuwhnbuahrtptokpqfh`, slug `cpl-chat`, `entrypoint_path: index.ts`) — **NOT**
  part of the daily GitHub Actions cron. Source-of-record is the **live
  function**, captured at `chatbox/supabase/functions/cpl-chat/index.ts`
  (re-capture with `get_edge_function` before editing if in doubt).
- Live now: **v15 ACTIVE** (= v14 + the model swapped `claude-sonnet-4-20250514` →
  **`claude-sonnet-4-6`** after Anthropic retired the dated Sonnet-4.0 snapshot
  2026-06-15, which 404'd → 502 on every turn; Session 64, PR #471. v14 had added
  `https://cpl-initiative.github.io` to `ALLOWED_ORIGINS`). **Use unversioned model
  aliases here, not dated snapshots** — a pinned `claude-*-YYYYMMDD` is a latent
  outage on its retirement date (`docs/kb-notes/playbook-edge-function-502-retired-model.md`).
  **NEXT for this surface:** the CCR/CER-grounded recommender + real-time benchmark +
  landing-site demand signal — scope + locked decisions in
  [`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`](docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md).
  Scope + phased plan
  (Phase 2 content re-point CPLBrain → `cpl-knowledge-base`; Phase 3 Student
  Portal):
  [`docs/kb-notes/cpl-chatbox-integration-scope.md`](docs/kb-notes/cpl-chatbox-integration-scope.md);
  deploy mechanics: [`chatbox/README.md`](chatbox/README.md); the durable
  redeploy procedure:
  [`docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md`](docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md).

- **College landing-page links (added Session 73, 2026-06-25).** The assistant
  surfaces each college's CPL landing page from
  **`chatbox_college_profiles.landing_page_url`** (the `cpl-chat` function joins
  it on the college name, LIVE). Those URLs are kept fresh by
  **`chatbox/scrape_landing_pages.py`** + **`.github/workflows/cpl-landing-pages.yml`**
  (push = dry-run, weekly cron + dispatch = `--apply`). The authoritative source
  is the `mapfyCollegeUrls` JSON blob embedded in **map.rccd.edu/cpllandingpages/**
  ({College, CollegeLandingURL}); we store the official path-encoded
  `map.rccd.edu/cpl-student-portal/<CODE>` link (it 302-redirects to the current
  landing host — a Vercel app as of 2026-06 — so it survives backend moves;
  `cpldashboardcccco` was the old, now-stale host). Runs on a runner because
  map.rccd.edu is egress-blocked from the agent sandbox AND behind an intermittent
  Sucuri WAF (the scraper retries with a cookie jar + a headless-Chromium
  fallback). The committed `chatbox/college_landing_pages.json` is the audit
  receipt. **Editing the function does NOT touch these links** (they're table
  data, not code). Story: `docs/cpl_landing_pages_lessons.md`.

### 7d. TMC Builder — interactive ADT submission tab (Session 59, 2026-06-16)

The **TMC Builder** tab (`#tmc-builder`, hash `tmc-builder`) lets a college align
its local courses to an ASCCC **Transfer Model Curriculum** (the basis for an
Associate Degree for Transfer). Pick a *College* + a *TMC* at the top → the LEFT
column is the **fixed** ASCCC-defined C-ID course list (Required Core / List A/B/C);
the RIGHT column is a searchable picker of **that college's own COCI offerings**,
**auto-populating** the local course that already carries each slot's C-ID. Shows
**Total Units** of the selected courses; exports (.docx via `docx.min.js` / print /
JSON) and Saves/Resumes to Supabase `tmc_submissions`.

- **List-first redesign (Session 60).** The tab lands on a filterable **TMC
  directory** (all 45, any status) — click a row to open one TMC's builder, **←
  All TMCs** to return (the old Program/Discipline dropdown was dropped). One
  consolidated filter block: **College · Show · Find a TMC · Curator sign-in**.
  The college filter leads with **All colleges** = a review view (fixed C-ID list
  + curator notes, no picker, Save/Submit hidden); pick a real college → build
  mode + a per-TMC **auto-matches coverage** column in the directory. The
  **"Coming soon"/`planned` status was retired** (all 45 are `draft`) — status is
  now **Official | Draft** only. The "What are you working on" bar moved to the
  overall header level (`quickstart.js`). Full story:
  [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) (Session 60). Some
  bullets below still describe the prior dropdown model — reconcile at the next
  checkpoint.
- **Per-TMC status indicator** (Session 59 follow-up): the directory/list is the
  full **45-TMC catalog**, with a status chip (`✓ Official` / `⚠ Draft`) + an
  **official-template link** (`_meta.sources[id]`). **All 45 are now `draft`** — parsed from the official
  ASCCC PDFs by `tmc/_parse_tmc_pdfs.py` (Sam supplied the PDFs; the C-ID site
  Cloudflare-blocks automated fetch — even direct PDF URLs 403). `tmcStatus()`
  returns `official` iff `status==="official"`, else `draft`; flip to `official`
  when faculty-verified. `cid_unverified` slots are C-ID-discrepancy signals.
- **GE Breadth companion — the full ADT (Session 60).** An ADT = a TMC **major**
  + a **GE Breadth pattern** + electives to 60 CSU-transferable units. Below the
  major, a build-mode **GE companion panel** (`renderGeInto`, data in
  `tmc_ge_patterns.js`) lets a college map local courses to GE areas, with a
  **pattern selector** — **Cal-GETC** (Fall 2025+ default) + legacy **IGETC** /
  **CSU GE Breadth** — and a combined **Full-ADT total** (major + GE). GE areas
  are college-certified (no C-ID), so picks are **manual** (no auto-match) and
  `units` is a per-course minimum. GE selections + the chosen pattern save into the
  same `tmc_submissions.alignments` jsonb (`ge:`-keys + `_ge_pattern`) — no schema
  change. Areas are **DRAFT** (encoded from public standards; CCCCO Breadth Form
  PDFs bot-block the agent — verify/true-up on upload).
- **Per-college approved-ADT overlay (Session 61).** The **COCI program export**
  is the authoritative source for which colleges already hold an approved ADT in
  each discipline. `tmc/_build_college_adts.py` distills it into
  `tmc_college_adts.js` (`window.CPL_TMC_COLLEGE_ADTS`, lazy), and the tab stamps
  a per-college status onto every TMC: a directory **ADT column** (the college's
  ✓ Active / ✓ Approved-pending / ⏳ In progress / ◐ Teachout when one is picked;
  the **statewide established-college count** in review mode) + a prominent
  **status banner** on the TMC detail (`adtBannerEl`), plus a **"this college's
  approved ADTs / not yet established"** Show-filter. **Session 66 split COCI's
  two affirmative states** (Sam, 2026-06-20): `active` (STATUS "Active" — live in
  the catalog) vs `approved` (STATUS "Approved" — CO-approved, pending
  activation) are now distinct buckets/badges; Active outranks Approved in dedup.
  Inactive is kept in the data but hidden (Sam, 2026-06-18). The **UC Transfer
  Pathway** (UCTP Chemistry/Physics — sub-award "A.S. UCTP Degree", a UC
  instrument distinct from an ASCCC ADT-T) gets its **own directory instances**
  (`extra_tmcs`, `kind:"uc-transfer-pathway"`, `renderPathwayDetail`), never
  folded into the Chemistry/Physics ADT. College-name reconciliation (the loose
  COCI-program labels — "L.A. CITY", "SAN FRANCISCO CITY" — → the tab's full
  course-export names) is in the builder + consults `kb/college_short_names.json`;
  any unresolved college fails the build loud. Full story:
  [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) (Session 61).
- **Real ASCCC transfer process — NOT the §11 M-ID/MC lane** (which deliberately
  avoids the transferability claim). Keep the two framings separate.
- All-**STATIC**, all-**lazy**, NOT regenerated by `excel_to_dashboard.py` and NOT
  daily-cron artifacts: the boot wiring lazy-loads `tmc_builder.js` → which loads
  `tmc_templates.js` (45-TMC catalog, all `draft`, auto-generated by
  `tmc/_parse_tmc_pdfs.py` from `tmc/source_pdfs/*.pdf` + `_meta.sources`) → then
  `tmc_college_courses.js` (per-college COCI index, 7.5 MB,
  rebuild only on a fresh extract: `python3 tmc/_build_college_courses.py`).
- Auto-match is **C-ID-exact only** (COCI `CIDNumber` == descriptor key); never
  title-guessed. ~1/4 of colleges report sparse C-IDs in the COCI extract → they
  pick manually. No contact-hours in COCI → legitimacy = units + C-ID for now.
- **Curator + submission layer (Session 59 follow-up).** A **Status filter** ("Show")
  (All / Official / Draft / **New requests**) sits in the filter block;
  **New requests** = the **CO-review queue** (colleges' completed alignments
  submitted to the Chancellor's Office — a `tmc_submissions` row with
  `status='submitted'`, written by the form's **📤 Submit for CO review** action).
  **Magic-link login** reuses the CCR's shared `cpl_sb` session + `allowed_reviewers`
  (`map@rccd.edu` now; a CCCCO account later) — public reads, reviewer writes.
  Signed-in reviewers add a **global curator note** per course row
  (`tmc_curator_notes`, reviewer-gated by `is_allowed_reviewer()`). Each TMC also
  links its **committed PDF artifact** (`tmc/source_pdfs/<file>`, Pages-served) +
  the external template. `cid_unverified` slots show a **⚠ not in C-ID ref** flag.
- Tab nav button + pane + boot wiring are mirrored in BOTH HTMLs (Rule 4). Schema
  of record: `tmc/supabase_tmc_submissions.sql`. Full story:
  [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md);
  data model: [`docs/kb-notes/reference-tmc-adt-data-model.md`](docs/kb-notes/reference-tmc-adt-data-model.md).

### 8. Supabase Database (Separate System)

- **Project**: `hvuwhnbuahrtptokpqfh.supabase.co`
- **Tables**: projects, budget_expenditures, personnel, workplan_goals
- **`tmc_submissions`** (added Session 59): TMC Builder's per-college course→TMC
  alignment store. Anon INSERT/UPDATE/SELECT RLS (institutional curriculum data,
  **no student PII**), `(college, tmc_id)` unique → upsert/resume. The always-true
  anon write policies are deliberate (mirror `chat_interactions`); the authoritative
  submission is the exported form. Schema: `tmc/supabase_tmc_submissions.sql`.
- **`tmc_curator_notes`** + **`tmc_requests`** (added Session 59): TMC Builder's
  curator layer. `tmc_curator_notes` = one global note per (tmc_id, slot_key),
  anon SELECT + **reviewer-gated** INSERT/UPDATE (`is_allowed_reviewer()`).
  `tmc_requests` = free-form "request a TMC" log (anon insert/read). The primary
  "new request" path is a `tmc_submissions` row with `status='submitted'` (CO-review
  queue). Schema: `tmc/supabase_tmc_curator.sql`.
- **`cpl_reflections`** (added Session 48): First Light's anonymous daily
  reflections — anon INSERT-only RLS with a 1–2000-char CHECK, **no SELECT
  policy** (write-only from the public; service role reads for the future
  uplifting-themes analysis). Never add a public read path; the payload shape
  (`painting`, `reflection` — nothing identifying) is pinned by
  `tests/first_light.test.js`.
- Separate from live metrics scraping; handles project-level data storage.

### 9. EACR Exhibit Identity — current state and future direction

**Current grouping (shipped 2026-05-18):** the Exhibit Adoption & Credit
Recommendations table groups MAP rows by
`(Exhibit Title, CPL Type, Collaborative Type)` rather than raw
`ExhibitID`. This collapses MAP's ID fragmentation (3,451 IDs → 3,274
cards) but does not yet handle **title drift** — the same credential
entered under multiple freehand titles by different colleges still
produces multiple cards.

**Career Cluster filter** uses the `CCC SW Sector` column in
`TOP_Code_Lookup.xlsx` (CCC Strong Workforce 10-sector framework with
an "Academic Transfer & General Education" catch-all).

**TOP code caveat — they vary for the same course.** Colleges assign TOP
codes in COCI with discretion and no definitive guidance for ambiguous
cases, so the *same* course often carries different TOP codes across
colleges (in practice ~52% of consolidated M-IDs have a mixed TOP code).
Anything that picks one TOP code for a consolidated course (e.g. the
`top_code` on a minted M-ID) is choosing a representative, not ground
truth — prefer the modal (plurality) pick and surface the spread
(`top_code_mixed` / `top_code_distribution`) rather than trusting a single
value. For broad grouping, the coarser TOP digits are more stable than the
full 6-digit code.

**Credit status derivation (CreditType rule).** MAP's course list carries a
`CreditType` column (the funding type) and a separate `Non_Credit_Category`
(the CDCP *program* type — Short-term Vocational, ESL, Older Adults, …).
Credit status is derived from **`CreditType`**, not the program category:

| `CreditType` | credit_status |
|---|---|
| `Credit Course` | **Credit** |
| `Other Noncredit Enhanced Funding` | **Noncredit Enhanced** |
| `Workforce Preparation Enhanced Funding` | **Noncredit Enhanced** |
| `Non-Enhanced Funding` | **Noncredit** |
| blank / unrecognized | by `UnitValue`: **>0 → Credit, else Noncredit** |

`Non_Credit_Category` is kept as descriptive metadata in **`noncredit_category`**
(the CDCP program type — Short-term Vocational, ESL, Older Adults, …), not the
funding signal. It is populated only where a member is offered noncredit (null
otherwise), and — like TOP codes — it can differ across colleges, so it carries
`noncredit_category_mixed` + (on the catalog) `noncredit_category_distribution`.
A Credit-status M-ID may still carry a `noncredit_category` if some member
colleges offer the course noncredit. When members of one M-ID disagree on credit
status, store the modal status and set `credit_status_mixed`. The three system
credit statuses are **Credit / Noncredit / Noncredit Enhanced**. Implemented in
`kb/_join_credit_status.py`.

**Future direction — synthetic unified-title layer:** an AI-assisted
canonicalization layer that assigns each MAP exhibit a unified title,
issuing agency, and training agency, so all spelling/format variants
collapse into one card. Design doc:
[`docs/exhibit_unification_vision.md`](docs/exhibit_unification_vision.md).
When that lands, the EACR grouping key will become
`(Unified Title, CPL Type, Collaborative Type)` and a per-exhibit
`also entered as…` disclosure will surface the raw titles underneath.

### 10. C-ID / CCN numbering conventions (authoritative) + M-ID alignment direction

Source docs (ASCCC, uploaded 2026-05-22; checked in under `docs/reference/`):
`cid_ccn_2025_overview.pdf` (the C-ID/CCN one-pager + CCN structure
infographic) defines the **numbering scheme**; `cid_tmc_adt_handbook_f2022.pdf`
and `tmc_development_guidelines_2013.pdf` cover the descriptor/degree-development
process (read on demand if the renumber project needs them — note: PDF page
rendering needs `poppler-utils`, absent in some session containers).

**The two official systems (leave both VERBATIM as listed in COCI — never relabel):**

- **C-ID** (Course Identification Numbering System) — *faculty-driven,
  descriptor-based, many-to-one*: many local courses map to one C-ID descriptor
  (the descriptor is the **minimum** content; colleges may add more). Format is
  `SUBJ ###` (e.g. `COMP 122`, `POLS 110`) — **no `C` prefix on the number.**
  491 active descriptors; basis for 43 TMCs; ~30k CCC courses aligned.
- **CCN** (Common Course Numbering, AB 1111) — *student-facing, template-based,
  one-to-one*: identical template content statewide (extra content goes in an
  optional "Part 2"). Format `SUBJ C####&&`:
  - `SUBJ` — standardized **4-letter** subject abbreviation (a system-level
    standard list; we do NOT yet hold that authoritative list).
  - `C` — Course Type Identifier = "this is a CCN". **A local course has no `C`.**
  - `####` — 4-digit number with **banded meaning**: `0XXX` non-transferable ·
    `1XXX` 100-level · `2XXX` 200-level · `3XXX` 300-level · `4XXX` 400-level ·
    `9XXX` noncredit. (For CCC only lower-division applies → realistically
    `0/1/2/9` XXX.)
  - `&&` — up to **2** Course Speciality Identifiers, no filler when absent:
    `H` Honors · `L` Lab-only · `S` Support · `E` Embedded Support.
  - Example: `GEOL C1005H` = Geology · CCN · 100-level · Honors.
  Rollout: Phase I (6 templates) student-facing Fall 2025; Phase II (24) Fall
  2026/27; Phase III (55) Fall 2027.

**M-ID alignment direction (LANDED 2026-05-22 in the CourseControlNumber re-mint,
PR #84; PR #83 was the dry-run that recorded the decisions):**

Our minted identities (`coci_minted_courses.json`, currently rendered
`M-ID <SUBJ> <num>`) will adopt a CCN-*structured* surrogate format that is
unmistakably **ours, not official**:

- **Lead with `M` in the Course-Type-Identifier position** (`SUBJ M####&&`),
  exactly paralleling CCN's `C`. The `M` (Minted) signals a synthetic MAP
  identity and **prevents any collision with a real CCN `C####`**. This is the
  whole point of the prefix: an M-code must never read as an official CCN.
- **C-IDs and CCNs stay verbatim** (different formats, both authoritative). Only
  the *minted* tier gets the M-scheme.
- **Decisions locked:**
  - **Sequencing — bundle with the re-mint.** The M-prefix AND the banded
    renumber ship together inside the **CourseControlNumber re-mint** (NOT a
    separate relabel pass). Re-keying the minted identity space ripples into
    memberships, `coci_articulations.json` `course_id`, curation `merge_into`
    pointers, dashboard rows, and the Articulations-by-Course card — so it's
    one re-key, not two churns, and must carry an **old-M-ID → new-M-ID alias
    map** so curation/articulation pointers survive.
  - **Banding basis — `credit_status` only, initially.** Noncredit /
    Noncredit-Enhanced → `9XXX`; everything credit → `1XXX`. Honest with data we
    hold. `0XXX` (non-transferable) and the `1XXX` vs `2XXX` split are deferred
    until transferability/degree-applicability data is sourced/confirmed.
  - **Subjects — synthesize a 4-letter map for the M-IDs.** An authoritative
    CCN 4-letter subject-abbreviation list does **not** appear to exist publicly
    yet, so the re-mint will **synthetically derive** a 4-letter abbreviation per
    minted subject from the local COCI subject codes (deterministic, collision-
    managed, clearly **our** synthetic map — NOT the official CCN list). **C-IDs
    stay verbatim** (not re-subjected). Revisit if an authoritative list is later
    sourced. Like the M-numbers, document loudly that these 4-letter subjects are
    a MAP surrogate, not a CCN claim.
  - **Numbering format (confirmed 2026-05-22 via the dry-run, PR #83):**
    CCN's `SUBJ C####` is 4 digits = leading **band** digit + 3-digit sequence.
    Mirror it: **corroborated** M-IDs (≥2 colleges) → clean 4-digit
    `SUBJ M<band><seq:03d>` (`9`=noncredit, `1`=credit; corroborated max per
    (subject,band) is 496 → fits with room). **Stand-alones** (1 college) →
    `SUBJ M<band><d><LL>` — band + 1 sequence digit + **2 letters** (same 4-char
    width; the trailing letters expand capacity to 10·26·26 = **6,760** per
    (subject,band) vs a max stand-alone bucket of 1,432, and signal "stand-alone"
    since corroborated codes are all-digit). It promotes to a corroborated
    `M####` if a second college later joins the title. The within-(subject,band)
    sequence must be **stable, deterministic, persisted** (sorted by normalized
    title) or codes churn each daily regen.
- Always document loudly: **M-numbers are CCN-aligned surrogate keys, NOT a
  claim of CCN equivalence.**


---

## Knowledge Base & Unified Courses Curation — Build Status

The `kb/` directory holds the synthetic-identity knowledge base above MAP's
exhibit/course data, plus the data behind the dashboard's **Unified Courses**
curation tab. Full schema/design: `kb/README.md` and
`docs/exhibit_unification_vision.md`. This section is the orientation map for a
session resuming the build — read it before touching `kb/` or the curation tab.

**Two identity layers:**

1. **Credential layer** (which credential an exhibit represents) — built &
   curated across the full dataset.
   - `unified_titles.json` — every distinct raw exhibit title → a unified
     credential name (+ confidence, `quality_flag`). `quality_flag:
     "suspect_course_as_exhibit"` marks ~200 exhibits typed "Industry
     Certification" that are really a course with no credential (data-entry
     pattern, ~half Modesto JC) — a triage backlog, not a verdict.
   - `credentials.json` — per `(unified_title, issuing_agency)` issuer/trainer
     metadata.

2. **Course-identity layer** (which common course a local course is) — staging
   built; the **articulation crosswalk is the current frontier**. Identifier
   precedence is **CCN-ID > C-ID > M-ID** (see the README section).

   **Cluster category RETIRED (rule, 2026-05-30, Session 19).** There is no
   longer any `id_system: "Cluster"` row in the CCR. Two things ever carried
   that label; both are gone:
   1. **Auto-seeded variant-unification clusters** (`UC-XXXXX`, from
      `_seed_coci_unified_courses.py`) — **DISSOLVED.** They grouped M-IDs by a
      **token-sorted** title key, which collapsed distinct course *levels* (e.g.
      "Algebra 1: Part 2" and "Algebra 2: Part 1" both sort to `1 2 algebra part`
      → wrongly merged). Never curator-reviewed, **double-emitted** their members
      as Stand-Alone rows, and carried **zero** articulations. The
      **Suggested-merges worklist** does this job now — curator-confirmed (the
      safety these auto-applied clusters lacked; it became level-COLLAPSING in
      Session 57, but every merge is still human-confirmed).
      The `clusters` dict in `coci_unified_courses.json` is empty (archived at
      `archive/coci_unified_courses_clusters_2026-05-30_pre-dissolution.json`);
      every `for … in clusters` loop in `export_unified_courses()` no-ops.
   2. **Curator merge targets** — **RELABELLED.** When a curator folds members
      into a target via `merge_into`, the result no longer overrides the
      target's identity with "Cluster". Instead:
      - a target with a **native identity** (M-ID / C-ID / CCN-ID) keeps that
        `id_system` + `kind: "Course"` — an M-ID gaining members is still that
        M-ID (e.g. `ARTS M1159`, `PHYS M1265`). 9 such rows.
      - a **synthetic** target with no pre-existing identity (a `UC-CUR-*` minted
        by a singleton-only worklist merge) becomes the new `id_system: "Unified"`
        / `kind: "Unified"`. 1 such row today; grows as singleton-only merges are
        confirmed. The CCR Kind filter + Source filter list **Unified** (not
        Cluster); the generator `_target_identity()` derives it; `unified_courses.js`
        `doConsolidate()` mirrors it for live edits; the auditor labels these cards
        `row_kind/id_system: "Unified"`. (Auditor tag *keys* stay `cluster_*` —
        internal stable identifiers; their human labels read "Unified".)

   The 9 clusters that had ALREADY been curated (merged into an M-ID) were
   migrated to **per-member `merge_into`** entries in Supabase `kb_curation` +
   `kb/coci_curation.json` BEFORE dissolution, so no curator decision was lost
   (16 of 17 per-member equivalents already existed from the worklist; only
   `PHYS M11WB → PHYS M1265` had to be added). Side-benefit: this cleared all 9
   `cluster_member_unresolved` auditor findings (they fired on the redundant
   cluster-key merges).
   - **CURATED ANCHOR — firewalled, do NOT bulk-edit:** `common_courses.json` +
     `course_crosswalk.json` are a small hand-reviewed quality anchor. NEVER
     bulk-merge staging into them; promote individual entries only after review.
     **Anchor curation affordances (PR #198 + follow-up, 2026-05-30):** anchors now
     surface their `discipline_provisional` sub-area in the CCR (e.g. Business →
     Accounting; generator emits `disc_prov` on anchor rows). They stay read-only,
     but a signed-in reviewer can **propose** a correction — written to a
     `kb_curation` row with field **`anchor_discipline_proposal`** (deliberately
     EXCLUDED from `_apply_curation.py` FIELDS, so it never folds into the overlay
     or overwrites `common_courses.json`); shown as a public "✎ proposed" badge until
     a maintainer promotes it. **Cross-listing** (a course under two disciplines, same
     number) uses the new `kb_curation` field **`cross_listed_disciplines`**
     (comma-separated MQ disciplines, IN `_apply_curation.py` FIELDS) — generator
     `xdisc_of()` emits `xdisc` on M-ID/singleton rows, CCR shows a "+ Discipline"
     chip and the discipline filter matches primary OR cross-listed. Additive, same
     number, no re-mint. (Used for the cross-disciplinary accounting cleanup —
     `docs/accounting_crossdisc_plan.md`.)
   - **Reference authorities (read-only):** `reference/cid_descriptors.json`,
     `ccn_courses.json`, `mq_disciplines.json` (official MQ discipline
     vocabulary), `reference/coci_courses.json` (authoritative C-ID/CCN courses
     + descriptions from the MAP COCI list), `reference/subject_discipline_map.json`.
   - **Staging (operational, machine-built from the COCI course universe):**
     `coci_minted_courses.json` (minted **M-ID** consolidated courses — identity,
     discipline, credit_status, typical_units, top_code, noncredit_category, each
     with `*_mixed` variance flags), `coci_minted_memberships.json` (lean
     M-ID → member `(subject, number)` join index), `coci_minted_singletons.json`
     (deferred single-college courses), `coci_unified_courses.json` (its
     auto-seeded variant-unification clusters were **DISSOLVED 2026-05-30** — the
     `clusters` dict is now empty; see the "Cluster lifecycle" note below),
     `coci_articulations.json` (earned articulations resolved
     to identity + credential, with cross-college **adoption-leverage** lists —
     the payoff layer), `coci_curation.json` (human curation overlay synced from
     Supabase — each entry carries `discipline` + `reviewed_by` + `reviewed_at`).
   - **Discipline inference (re-runnable, AI-assisted draft):**
     `kb/discipline_inference.json` is an **authored, editable lexicon** — a
     `subject_map` (subject code → discipline, for codes whose member titles are
     unambiguously one discipline) + a tight `title_keyword` fallback (terms that
     are unambiguous alone). `kb/_infer_disciplines.py` applies it to the minted
     courses, clusters, and singletons: validates every target against
     `mq_disciplines.json`, **skips reviewed/curated entries**, and stamps each
     fill with `discipline_source` (`subject_map`|`title_keyword`),
     `discipline_confidence`, `discipline_inferred_at`. Re-run after editing the
     lexicon; it only fills entries that are still blank. Passes 1–3 filled the
     lexicon-tractable courses; the long tail (ambiguous catch-all subject codes)
     remains.
   - **Description-aware inference (re-runnable, complementary):**
     `kb/_infer_disciplines_from_desc.py` mines the course *description* for
     courses whose title/subject gave no signal (e.g. "Climate Control" →
     description names HVAC). It uses a **safe, high-precision phrase set** (only
     terms decisive inside long prose — welding, automotive, dental, CNC,
     paramedic, …) with **plurality scoring + unique-winner** (ties skipped),
     since descriptions mention disciplines tangentially. Descriptions come from
     the in-file `description`/`synthesized_description` for parents and from the
     generated `unified_courses_details.js` for singletons (skipped if that file
     is absent → parents-only). Fills are stamped `discipline_source="description"`
     at confidence **0.5** (the lowest tier — surfaced as `⚙ descr` for reviewer
     triage). Pass 4 filled ~941 (850 singletons + 91 parents).
   - **TOP-aware inference (re-runnable, highest-yield):**
     `kb/_infer_disciplines_from_top.py` maps each blank course's `top_code` to an
     MQ discipline via the authored `kb/top_discipline_map.json` (the 6-digit MAP
     TOP program title is a curated category that often names the discipline:
     "0948.00" → Automotive Technology, "1230.10" → Registered Nursing → Nursing).
     **Guardrail:** colleges vary in TOP assignment, so it's an intent signal, not
     ground truth — fills at **confidence 0.5**, `discipline_source="top_code"`
     (surfaced as `⚙ TOP`), reviewer-verifiable. The coarse catch-all codes
     (`4930.xx` Interdisciplinary/Basic-Skills/Guidance, the `*99.00 Other` and
     `* General` buckets) are **deliberately omitted** from the map so they stay
     blank rather than get a misleading lump-discipline (only ESL `4930.86/.87`
     are mapped). Pass 5 filled **~10,344** (the biggest pass — every staging
     course carries a top_code; blanks 17,537 → ~7,193). Edit the map + re-run.
   - **COARSE TOP-division fallback (re-runnable, lowest-precision — added Session
     37, 2026-06-09):** `kb/_infer_disciplines_from_top_division.py` fills the
     orphan tail the precise passes leave blank (their 6-digit TOP code is a
     catch-all `*99.00 Other` / `* General` / `4930.xx` Interdisciplinary that
     `top_discipline_map.json` deliberately omits) with the **broad umbrella
     discipline of their 2-digit TOP division** via `kb/top_division_discipline_map.json`
     (`49`→Interdisciplinary Studies, `12`→Health, `09`→Industrial Technology, …;
     19 divisions mapped to an **MQ-verified** umbrella, 5 with no honest umbrella —
     Media/Fine-Arts/Commercial — left blank). Fills at **confidence 0.4**,
     `discipline_source="top_division"` (surfaced as `⚙ TOP-div`, warn-colored, with
     a **"by TOP division"** Generated-by filter). A deliberate, **reversible
     relaxation** of the "leave catch-alls blank" guardrail (Sam, 2026-06-09: "whole
     tail please") so the ~5.9k orphan singletons stop being invisible to the CSR.
     A division fill is honest (a 09xx course IS an industrial technology) but
     COARSE (welding vs drafting both → Industrial Technology) — refine via
     curation. **Filled 6,590** (singletons 5,904→500 blank, minted parents
     1,268→80). Side-effect: reintroduces `subject_collision_signal` (0→1,076) since
     the coarse fills assign a discipline without re-keying SUBJ4 to that
     discipline's canonical — expected, pending a future canonical-SUBJ4 fold.
     Verified by `kb/_verify_top_division_inference.py`. After running, **re-seed the
     CSR** (`python3 kb/_seed_canonical_subj4.py`) so the new disciplines/variants
     surface (the cron doesn't re-seed; it only applies Supabase overlays).

**Generators** (`kb/_seed_*.py`, `_join_*.py`, `_curation_*.py`, `_flag_*.py`)
are one-shot, kept for provenance — curate by editing JSON / via Supabase, not
by re-running them. **Exception:** `kb/_infer_disciplines.py` is intentionally
re-runnable (re-derives + RETRACTS its own prior fills when the lexicon changes — Session 45; never touches reviewed/curated/manual or other passes' fills). subject_map entries may be COLLEGE-SCOPED ({discipline, colleges}) for homonym subjects — validate with `kb/_audit_subject_map.py` after edits (docs/kb-notes/methodology-college-homonym-subject-codes.md).

**Unified Courses dashboard tab + Supabase:**
- The **Unified Courses** tab lets allowed reviewers curate disciplines.
  `unified_courses.js` is a **static asset** — edit it directly; it is NOT
  regenerated by `excel_to_dashboard.py`. (Its DATA, `unified_courses_data.js`,
  IS generated by `export_unified_courses()`.)
- Auth is **Supabase GoTrue magic-link** sign-in gated by an `allowed_reviewers`
  list. The magic link's redirect must be passed as a **`?redirect_to=` query
  param** (not a body `options` object) and must match the Supabase **Site URL /
  allowed Redirect URLs** (both currently set to
  `https://cpl-initiative.github.io/cpl-project-tracker/`). Don't re-break that.
  Sessions are kept alive via the **refresh token** (no repeated magic-link
  emails); the stored token is validated as a well-formed JWT before use so a
  garbled token can't silently break saves. Schema setup:
  `kb/supabase_curation_setup.sql`.
- **Curation UX** (all in `unified_courses.js`): click a Discipline cell to set
  it (MQ vocabulary); after a save, an **opt-in subject-code bulk apply** offers
  to fill other *blank* same-subject courses (never overwrites; warns that
  subject codes vary by college). Edits write to `kb_curation` and show live via
  an overlay. **Batch-verify** — a toolbar **"✓ Verify N filtered"** button
  accepts the machine-inferred discipline AS-IS for every currently-filtered
  Generated row that has a discipline (chunked bulk upsert; excludes blanks /
  locked anchors / already-Verified; the confirm surfaces the lower-confidence
  title-keyword/description share so the curator can narrow to "by subject-code"
  first). It clears the Generated backlog in bulk rather than one Verify per row.
  The **⚇ Unify** candidate ranking factors **subject + units** agreement, not
  title alone (title-token Jaccard ≥ 0.5 gates inclusion; same-subject +0.15 and
  same-units +0.10 reorder to the top — `unified_courses_index.js` now carries
  units as a 5th field). **Suggested-merges worklist** — a **"✨ Suggested
  merges"** toolbar button opens a review queue over precomputed same-course
  groups (`unified_courses_suggestions.js`, lazy). The generator groups identities
  by a **level-COLLAPSING + segment-folding + synonym-normalizing title
  signature** (parentheticals + articles removed, the LEVEL axis folded out —
  level words begin/interm/advanced…, roman/word/digit ordinals, bare a–h section
  letters — **plus structural DIVIDER words `_SUG_SEGMENT = {part, semester,
  module, half, level, levels}`** since Session 58 **plus a curated
  abbreviation↔expansion `kb/synonym_map.json`** (ESL≡English as a Second
  Language, ASL/PE/Math/AJ — a similarity threshold can't bridge a zero-overlap
  synonym) — tokens sorted, so "Japanese 1" / "Japanese II" / "Elementary
  Japanese" AND "Algebra 1-2, Semester 1" / "Elementary Algebra, Part 1" /
  "Algebra 3-4" all GROUP into one family; **loosened from level-SAFE in Session 57**
  per Sam's "over-merge > under-merge", Title 5 §55050 — the worklist is
  curator-confirmed so this only changes what surfaces, never an auto-merge.
  **In the popup (Session 58):** a ➕ **keyword-gather** (search + multi-select
  extra members into the merge) and a 🏷 **"match strength" looseness slider**
  (filters the title-evidence lane by weakest-pair cosine; default 0.62, slide to
  0.50 to reveal more — the title receipt's `COSINE_MIN` is now 0.50);
  measured by `kb/_sug_segment_dryrun.py`), ranked by cohesion (subject + units
  agreement + size).
  The payload has **two sections, anchored first**: `groups` are
  **identity-anchored** (every group has ≥1 main M-ID/Cluster identity, excludes
  `cid_conflict` over-merges, attaches matching orphan singletons) — **Confirm
  MERGES into that existing identity**. `singleton_groups` (V2, done 2026-05-22)
  are **singleton-only** — ≥2 single-college Stand-Alone courses sharing a
  signature but matching NO existing identity (~1,030 groups) — **Confirm MINTS a
  brand-new unified course** (target left blank → `doConsolidate` generates a
  `UC-CUR-*` id, all members get `merge_into` it + the unified title). Each
  singleton group carries a **`same_college`** flag (set by the generator via the
  title-filtered raw-list join: True when every member resolves to one college →
  likely intra-college variant ladders / credit-noncredit / language pairs, NOT
  cross-college duplicates); these are **flagged in the UI** (amber warning) and
  **ranked last** within the section so genuine cross-college candidates surface
  first (~869 cross-college vs ~161 same-college at last build). The curator
  reviews one group at a time, members pre-checked; **Confirm** reuses
  `doConsolidate`, **Skip** advances. **Never auto-applied.** A **pending-sync indicator** ("⟳ N edits awaiting daily sync") +
  **Sync now** link surface edits not yet in git (diffed against the dataset's
  `committed_curation` snapshot). The **curated common-course anchor**
  (`common_courses.json`, C-ID/CCN/M-ID) is shown **read-only** (an "anchor"
  badge; curation disabled — it's firewalled). Filters include **Source**
  (`id_system`), discipline, credit, confidence, adoption, flagged-only,
  blank-only; default sort is **Subject(s) then course number**. (The
  **Generated-by** provenance filter was **removed Session 69, #492** — the
  per-row ⚙ `discipline_source` badge remains.) Subject(s) cells hover to show the course title(s) /
  cluster title variants.
- **Discipline provenance surfacing** (added 2026-05-22). Generated (not-yet-
  verified) rows whose discipline was machine-inferred carry a small
  `⚙ subj-code` / `⚙ title-kw` / `⚙ descr` badge (title-keyword AND description
  use the warn color, since they're the riskier 0.55/0.5-confidence fills) plus
  the **Generated-by** filter, so a reviewer can blast through the safe
  `subject_map` fills with **Verify** and scrutinize the keyword/description
  ones. The data comes from per-row `dsrc`/`dconf` keys emitted by
  `export_unified_courses()` via the `_add_prov()` helper — emitted **only** on
  non-curated rows that carry a `discipline_source` (blank/manual/anchor rows
  stay lean, no extra keys). Curated rows render as Verified, so no badge. The
  four `discipline_source` values are `subject_map` + `title_keyword` (from
  `kb/_infer_disciplines.py`), `description` (from
  `kb/_infer_disciplines_from_desc.py`), and `top_code` (from
  `kb/_infer_disciplines_from_top.py`) — the Generated-by filter has a matching
  option for each (`by subject-code` / `by title-keyword` / `by description` /
  `by TOP code`); only `subject_map` renders ok-colored, the rest warn.
- Supabase is **live and shared**: only the unified-courses curation tables
  (`kb_curation`, `allowed_reviewers`) are in scope. The
  projects/budget/personnel/workplan tables (§8) and the auth/Redirect-URL config
  are off-limits without explicit confirmation, and no destructive migrations
  without sign-off.

**Generated artifacts + lazy files (all from `export_unified_courses()`).** The
tab keeps `unified_courses_data.js` lean by splitting heavy data into files the
client fetches **only on demand**. All are regenerated daily and MUST be in the
workflow `git add` list (§6):

| File | Global | Loaded when | Contents |
|------|--------|-------------|----------|
| `unified_courses_data.js` | `CPL_UNIFIED_COURSES` | **lazy — first CCR-tab open** (Session 36 perf split; was an eager `<script>`) | in-browser rows (~16.4k: Course/Cluster + curated C-ID/CCN/M-ID anchors), `colleges[]`, `mq_disciplines`, `committed_curation`, `committed_descriptions`, `topmap` (TOP code→title, ~400, for the list's TOP hover) |
| `unified_courses_index.js` | `CPL_UC_INDEX` | ⚇ Unify dialog | compact `[id,title,subject,kind,units]` search index (units feeds the subject/units-aware ranking) |
| `unified_courses_details.js` | `CPL_UC_DETAILS` | ⓘ details modal | `id → {d:description, s:source}` (~70k incl. stand-alones; ~34MB, lazy/gzipped) |
| `unified_courses_standalone.js` | `CPL_UC_STANDALONE` | "Stand-Alone" kind filter | ~57.7k single-college rows (kept out of the main payload) |
| `unified_courses_members.js` | `CPL_UC_MEMBERS` | row expand caret ▸ | `id → [{c:collegeIdx,n:code,t:title,u:units,p:topcode}]` member college courses + `topmap` (TOP code→title, deduped) |
| `unified_courses_member_desc.js` | `CPL_UC_MEMBER_DESC` | member "Show descriptions" link | `id → [desc,…]` PARALLEL to `members[id]` (each ≤500 chars) — on-demand, ~51MB so loaded only when a curator opens member descriptions |
| `unified_courses_suggestions.js` | `CPL_UC_SUGGESTIONS` | ✨ Suggested-merges worklist | **Six sections, all HUMAN-CONFIRMED / never auto-applied:** `groups` = identity-anchored same-title merges (**level-COLLAPSING + segment-folding `_sug_sig`** — folds the level axis since Session 57 (word-numbers since Session 46) AND structural divider words `_SUG_SEGMENT` {part/semester/module/half/level} since Session 58, so "X 1"/"X II"/"Elementary X" and "X 1-2, Semester 1"/"X, Part 1" group into one family); `singleton_groups` (V2) = singleton-only matches that mint a NEW unified course (`same_college` flags likely intra-college variants); `family_groups` (#310) = co-articulation family merges (`(M-ID subject prefix, _fam_key)` gated on a shared credential); `desc_groups` (#382) = 📝 description-evidence merges over DARK M-IDs (TF-IDF catalog-description cosine; receipt `kb/desc_consolidation_out/`); `title_groups` (#385, Session 46) = 🏷 title-evidence merges over dark M-IDs + Stand-Alone singletons (IDF-weighted title cosine, guard suite `kb/_consolidation_guards.py`, NO units gate — receipt `kb/title_consolidation_out/`; mixed groups merge into the M-ID, all-singleton groups mint new); `evidence_groups` = 🧾 COCI-evidence folds into official C-IDs (witness counts; `x:1` members pre-unchecked). Ranked by cohesion, cross-college first |
| `unified_courses_aligned.js` | `CPL_UC_ALIGNED` | row expand caret ▸ (CCR **inverse view**) | `aligned[course_id] → [{c:credential, i:issuer, p:CPL type, r:[credit recs], g:[earning colleges], n:#colleges, x:'CCC' if a statewide CCC-collaborative standard}]` — the **mirror of the EACR** (one row per course → the aligned exhibits/credentials that articulate to it). Built by `_build_aligned_exhibits_by_course()` from `kb/coci_articulations.json`; deterministic (no timestamp → no-op daily diff). 2,355 courses. Consumer unions Phase-B `consolidated_from` ids. |

**Raw course source — `kb/reference/coci_course_list.xlsx`** (committed, ~24MB,
141,738 rows). Cols: College, CourseControlNumber, Subject, Course_Number,
CourseTitle, UnitValue, CreditType, Non_Credit_Category, TopCode, **CIDNumber**,
**CatalogDescription**, **CommonCourseNumber**. Read **once** (openpyxl
read-only, streaming — never cat it) in `export_unified_courses()` and shared by
the description + member-row builds. If absent, those two artifacts skip
gracefully.

**Member-college rows + the title-filter (important).** Member rows are a
**forward join**: each identity → its member `(subject, course_number)` pairs →
raw college courses. The membership key `(subject, number)` is **globally
ambiguous** (e.g. "MATH 31" is a different course at every college), so the join
**re-applies the minting's title check**: a candidate is kept only if its title
matches the identity's (token-set Jaccard ≥ 0.5; generic/empty titles kept).
**C-ID / CCN joins are authoritative and trusted** (no title filter — join on
`CIDNumber`/`CommonCourseNumber`). Clusters/merge targets filter each constituent
leaf against its own title. The same title-aware candidate set also feeds the raw
description fallback. (Bug history: without the filter, M-ID A 100 "Undergraduate
Research Experience" listed every college's MATH 31 — Plane Trig, Precalc, etc.)

**Descriptions.** ⓘ modal shows the full record + an **editable description**.
Precedence per id: curated (`kb_curation` field **`description`** — added to
`_apply_curation.py` FIELDS) > existing layer (minted "representative/modal",
synthesized cluster, C-ID/CCN reference) > **raw `CatalogDescription` fallback**.
Stand-alones are included so ~54k get a description. The pending-sync badge
counts description edits too (diffed against `committed_descriptions`).

**Source filter now includes `CCN-ID`** — the 58 AB-1111 Common Course Numbers
(`kb/reference/ccn_courses.json`) are emitted as locked read-only anchor rows,
mirroring the C-ID anchor, and are usable as ⚇ Unify merge targets.

**Frontier / open work:**

- **Suggested-merge worklist V2 — DONE (2026-05-22).** The ~1,030
  **singleton-only** merge clusters (single-college courses that match each other
  but no existing identity) now surface as a second `singleton_groups` section in
  `unified_courses_suggestions.js`, reusing the same generator grouping + UI;
  Confirm mints a brand-new `UC-CUR-*` unified course. Same-college groups
  (~161, likely intra-college variants) are flagged + ranked last. See the
  "Suggested-merges worklist" bullet above for the full description.
- **Dashboard analytics by Unified-Course identity — additive card DONE
  (2026-05-22, Approach A).** The **Articulations by Unified Course** card in CPL
  Analytics (`_build_articulations_by_course()` ← `kb/coci_articulations.json`)
  groups earned articulations by unified identity, surfacing cross-college
  adoption leverage with the over-merge guardrail (see §6a). Collapse: 10,853 raw
  MAP articulation rows → 2,355 distinct course identities (4,592 identity×credential
  records). **Approach B — DONE 2026-05-26 (Session 8, Octaman, PRs #125/#127/#128/#131/#132).** The
  *interactive* EACR (`statewide_adoption` / `statewide_interactive.js`) table was re-pivoted from
  raw-title grouping to unified-credential identity grouping `(unified_title, issuing_agency,
  cpl_type, collab_type)`. Headline collapse: 3,274 cards → 2,351 (28%). Shipped in five PRs:
  dry-run + alias map (#125), unclassified-backfill (#127), producer (#128), consumer +
  migration script (#131), schema-column hotfix (#132). Migration applied as no-op (0 existing
  flags); script retained for future re-pivots. Full lessons in
  `docs/exhibit_canonicalization_lessons.md` "Session 8 — Octaman" section.
- **Open threads (next sessions), in priority order:** (1) **`CourseControlNumber`
  re-mint — LANDED (PR #84, 2026-05-22).** Memberships are re-keyed at the raw
  college-course level (each member carries its own `(College, CourseControlNumber,
  C-ID/CCN)`); minted ids re-keyed to CCN-shaped surrogates (`SUBJ M####`
  corroborated / `SUBJ M<band><d><LL>` stand-alone, synthetic 4-letter SUBJ);
  splits captured in `kb/promotions.json`; `export_unified_courses()` consumes
  the exact joins + promotions-driven Phase A/B. Authoritative alias for
  rollback: `kb/remint_out/alias_map.json`. **Unblocked**: crosswalk Phase C.
  (2) **EACR interactive re-pivot (Approach B above) — DONE Session 8.** (3) **Singleton-only
  worklist follow-up** — consider a `same_college`/blank-disc filter on the
  worklist and extending V2's grouping with a description tie-breaker for the
  borderline cross-college pairs.
- **Crosswalk re-key initiative.** Use the raw list's
  `CIDNumber`/`CommonCourseNumber` to promote minted M-IDs to their real C-ID/CCN
  identity (precedence CCN > C-ID > M-ID). **Phase A — DONE (PR #66):** each row
  carries a `match` field ({`cid`} single agreed C-ID, {`ccn`}, or
  {`cid_conflict`:[…]} when members disagree), surfaced as row badges + an
  "Official ID" filter, computed over the *title-consistent* member set. No
  identity change. In-browser counts: 960 single C-ID, 26 CCN, 235 C-ID
  conflicts (`NULL`/`N/A` sentinels filtered). **Phase B — DONE (2026-05-22,
  decisions: consolidate-by-ID + inline-generator).** Implemented as a
  **post-pass in `export_unified_courses()`** right after the Phase A `match`
  loop: every minted/cluster row whose title-consistent members agree on ONE
  clean official C-ID/CCN is grouped into a single official-identity row —
  **folded under the existing anchor** when one exists, else a **synthesized
  official row** (`id` = the C-ID/CCN, `id_system` accordingly). Last run:
  **896 M-IDs → 173 new official-ID rows + 36 anchor folds** (main payload
  16,442 → 15,719). Each consolidated row carries `consolidated_from` (the
  underlying M-ID keys) and those keys are registered in `merge_into`/
  `merge_members`, so the lazy member/detail joins fold correctly and
  curation/articulation pointers survive. The Unify-dialog index
  (`unified_courses_index.js`) is now built **after** Phase B so consumed M-IDs
  aren't offered as ghost targets and the official rows are searchable. UI:
  rows show a `⛓ N merged` badge (`unified_courses.js`). Regen-safe / no KB
  mutation / reversible. Guardrail honored: only **clean unanimous** matches —
  the 235 `cid_conflict` rows are never touched; a lone M-ID with no anchor
  keeps just its Phase A badge (no synthetic relabel). **Phase C — PARKED
  (2026-05-22, informed decision).** Splitting the `cid_conflict` / no-official-ID
  rows is deferred; conflicts stay safely surfaced via the existing "C-ID
  conflict — do not promote" badge + filter, and Phase B (clean official-ID
  consolidation) remains the automatic stopping point. **Root cause:** the
  membership key is `(subject, number)`, which is **lossy** — the same key is a
  different course across colleges (`ACCT 110` at one, `ACCT 120` at another), so
  conflicts **cannot be split at the generator level**. It's a key-granularity
  problem, not a similarity one, so a description tie-breaker can't fix it.
  **Numbers:** 231 conflicts across 2,274 member pairs; ~60% carry any C-ID,
  ~32% (718) map to >1 C-ID themselves, only ~29% cleanly extractable. **Real
  fix (its own project — scope before any build):** a `CourseControlNumber`-
  grained re-mint that rebuilds memberships at the raw college-course level so
  each member carries its own C-ID (the per-college COCI course list, which
  carries the control number, is the likely input). NOT a generator post-pass.
- Refine + curate the articulation crosswalk — precise title-based
  disambiguation when a `(subject, number)` maps to multiple M-IDs, carry
  confidence/`*_mixed`/over-merge flags onto each record, never emit an adoption
  suggestion off a flagged over-merged cluster. Backlog: fuzzy variant merging +
  subject canonicalization, singleton minting, and the
  `suspect_course_as_exhibit` triage (raise the Modesto pattern with the college).
- **Description-similarity tie-breaker (Phase C candidate).** The member-row
  forward join currently keeps a candidate when its title matches the identity
  (token-set Jaccard ≥ 0.5). Titles are the right *primary* signal, but the
  borderline band (titles differ enough to fail the threshold yet are the same
  course, e.g. "Intro to Programming" vs "Programming Fundamentals", or the
  reverse — same generic title, different course) would benefit from a
  *secondary* check on `CatalogDescription` similarity (TF-IDF/cosine with
  boilerplate like "students will…"/prereqs/repeatability stripped). Scope it to
  the ambiguous middle (~0.3–0.5 title Jaccard), NOT every pair — descriptions
  share boilerplate that inflates naive similarity, and it's heavier (~450 chars
  × 141k rows). Prototype + **measure how many member rows flip** before
  committing. (Motivating case: College of the Desert's MATH 31 genuinely *is*
  "Undergraduate Research Experience" in STEM — title match already keeps it; the
  tie-breaker is for the harder cases the title gate can't settle.)
**Discipline completion — 6 inference passes done (5 precise 2026-05-22; the
coarse division fallback 2026-06-09).** Blank disciplines went from **21,656 →
~580** across: lexicon passes 1–3 (`discipline_inference.json` +
`_infer_disciplines.py` — subject_map + title_keyword), the description pass
(`_infer_disciplines_from_desc.py`), the highest-yield TOP-aware pass
(`_infer_disciplines_from_top.py` + `top_discipline_map.json`, ~10.3k fills), and
the **Session-37 COARSE TOP-division fallback** (`_infer_disciplines_from_top_division.py`
+ `top_division_discipline_map.json`, **6,590 fills** — closed the orphan tail from
~7,193 to ~580 so it stops being invisible to the CSR). Each fill is a
confidence-tiered, reviewer-verifiable draft (`discipline_source` ∈
`subject_map`/`title_keyword`/`description`/`top_code`/`top_division`; surfaced via
the Generated-by filter + `⚙` badges + **batch-verify**). **The remaining ~580 are
the divisions with no honest single MQ umbrella** (Media, Fine/Applied Arts,
Commercial Services, 2 untitled) — intentionally left blank; best closed by
**reviewer curation in the tab**. Re-run any pass after editing its lexicon/map;
all skip reviewed/curated; pass 1 re-derives + retracts its own fills (Session 45 — lexicon removals propagate), the rest only fill blanks. Homonym subject codes are college-scoped in the lexicon, enforced by `kb/_audit_subject_map.py`.

**Guardrails when resuming:**
- The `coci_*.json` files are large (tens of MB). **Never read/cat them into the
  conversation** — it trips `400: text content blocks must be non-empty` /
  context overflow. Inspect via scripts that print counts/samples only.
- Staging only; don't touch the curated anchor or Supabase auth/other tables
  without confirmation. Feature branch + PR; don't push to `main`.

---

## 11. M-ID Lifecycle, Model Curriculum (MC), and the CID/CIDx Pathway

M-IDs are not just identity surrogates — they're staging points in a strategic
pipeline toward ASCCC C-ID approval. The dual-score auditor at
`kb/_row_audit.py` and any future curation work depend on this framing.

### The pipeline

```
seed-untouched M-ID (Phase B draft from _seed_coci_minted_mids.py)
  → curator-Verified M-ID (faculty trust signal — UCL Verify in Supabase)
  → MC-ready M-ID (MC slots populated: SLOs, content outline, methods, …)
  → submitted to ASCCC for C-ID / CIDx approval
  → APPROVED → M-ID substituted out for new CID in the Unified Course catalog
              (alias-tracked via the same Rule 7 / re-mint playbook)
```

The auditor identifies M-IDs at each stage and what gates them from the next;
it never drives the substitution itself. Approval is a re-key — the M-ID
disappears from the catalog, the new CID anchor takes its place, and the
old→new alias is preserved in the same manner as the 2026-05-22 re-mint.

### CID vs CIDx — pick your pathway

| Pathway | Approval body | Speed | Notes |
|---|---|---|---|
| **CID** (general C-ID)  | CIAC (CCC + CSU + UC intersegmental) | Slow, hard | UC defaults often dominate and kill candidates |
| **CIDx** (CTE C-ID)     | ASCCC C-ID team only | Fast, easy | Intersegmental agreement not required |

Eventual automation target = **CIDx submission flow** (CTE only). Every M-ID is
*theoretically* eligible to submit (faculty discretion is the gate, not a CTE
flag); the CID-vs-CIDx lane is decided at submission time. The COCI extract
carries a CTE field that will be wired in when the CIDx workflow lands —
deferred for now.

### MC, NOT TMC — the terminology landmine

For M-IDs we say **MC** (Model Curriculum). NOT **TMC** (Transfer Model
Curriculum). The distinction is strategic:

- **TMC** implies **transferability** — which requires intersegmental
  agreement (CIAC), which is the hard/slow lane M-IDs were designed to avoid.
- **MC** is the curriculum package without the transferability claim — the
  bar is lower; faculty + AOs review CPL articulation adoption without the
  angst of UC defaults killing the course.

M-IDs are CPL articulation-adoption signals, full stop. They are NOT a
transferability claim. **Do not reintroduce TMC framing for M-IDs.**

`transferability` and `degree_applicability` are deliberately EXCLUDED from
the `MC_NOT_YET_CAPTURED` slot list in `kb/_row_audit.py`. Adding them back
would reintroduce the UC-defaults trap and undo the angst-removal benefit.

### The Trust-Card auditor — `kb/_row_audit.py`

Read-only auditor over every M-ID + Cluster. Per row, produces a Trust Card:

- **`faculty_trust_score`** ∈ [0,1] — is the row trustworthy enough that a
  discipline faculty member should rely on it to ratify a cross-college
  articulation? Weighted across faculty_fields: discipline (0.30),
  credit_status (0.20), typical_units (0.20), description (0.15),
  top_code (0.10), confidence (0.05).
- **`mc_ready_score`** ∈ [0,1] — is the row a viable MC submission? Sums
  faculty_fields (70% share) + MC slots (30% share, currently all
  `not_yet_captured`). Every row sits well below mc_ready until SLOs land —
  that's the strategic message: MC-readiness is the destination, not the
  current state.
- **Field states:** real / aggregated-unanimous / aggregated-modal /
  aggregated-varied / inferred / curated / seed-untouched / off-scheme /
  missing / conflicting / not_yet_captured.
- **Readiness tiers:** ready (≥0.85) / needs_review (≥0.65) /
  needs_repair (≥0.40) / not_ready.
- **Rule tags + counts (refreshed 2026-06-12 night, Session 51 — after KIN/PE pass 2 + the merge curation; 15,515 parents):**
  - `seed_untouched_discipline` (**10,599**) — Phase B subject_map draft never reviewed (Phase 1a)
  - `subject_collision_signal` (**3**, was 1,206 — **the fold's receipt**: every disciplined M-ID re-keyed to its curator-confirmed canonical SUBJ4 on 2026-06-12, Session 50. The 3 residuals are the cross-discipline curated re-keys — `ARTH M1022` ex-`ARTS M1159`, `BUSI M9038/M9039` ex-`CISC M9029/M9030` — whose BASELINE file discipline (Art / Computer Science) disagrees with the curated one the fold honored; the rule reads baseline, so these are honest, bounded flags. History: 0 → 1,076 (2026-06-09 coarse TOP-division fill) → 1,210 (Session-45 homonym repair) → 1,206 (twins) → **3** (the fold)) — Phase 1e CLOSED
  - `unit_anomaly` (**4,179**, was 4,189) — typical_units represents <50% of member colleges (member-unit variance is high, possible over-merge across different unit-load variants); ~71% of flags are 2-member splits like `[3.0, 0.0]` (credit vs noncredit drift in the same M-ID) (Phase 1c)
  - `member_top_divergence` (**1,253**, was 1,255) — an M-ID's member colleges carry TOP codes spanning ≥2 broad (2-digit) divisions with ≥30% minority share: the **cross-discipline over-merge** detector (a generic title — "Ethics and Leadership", "Undergraduate Research Experience" — minted courses from different program areas under one identity). It closes a real gap: `top_discipline_disagreement` only checks the M-ID's single *representative* TOP, so it missed the case where the *members* diverge but the representative matches (the motivating case lives in the CRIM family). 2-digit division grouping inherently suppresses sister-discipline noise — no SISTER_PAIRS needed. Surfaces for review, not a verdict (TOP codes vary by college). (Phase 1c)
  - `top_discipline_disagreement` (**901** — pass 2; Session 45's homonym repair brought it 960 → 926; was 2,201 before SISTER_PAIRS) — TOP code → different discipline than assigned (Phase 1c)
  - `blank_description` (**1,701**, was 1,704) — Phase 1a
  - `blank_discipline` (**82** — a few Session-45 retractions had no honest re-fill; 1,266 pre-2026-06-09) — Phase 1a; the coarse TOP-division fill cleared the minted-parent blank tail; residual = the no-honest-umbrella divisions
  - `discipline_title_mismatch` (**757** — grew with pass 2: sports-roster titles vs Kinesiology are honest umbrella noise; Session 45 repair brought it 773 → 712) — title shares 0 tokens with assigned discipline AND ≥2 with some other (Phase 1c)
  - `description_discipline_disagreement` (**73**, was 75) — description's safe-phrase set points elsewhere with ≥2 mentions (Phase 1c)
  - `generic_title_concrete_discipline` (44) — title is course-format generic; can't justify a specific discipline (Phase 1c)
  - `mid_id_off_scheme` (**1** — `F M1002`, blank-discipline; unfoldable until disciplined. `N M9001` gained an honest Social Science discipline and folded to `SOCS M9003` in the 2026-06-12 fold) — was 27 pre-2026-05-23
  - `merge_into_orphan` (**0** — preventive infrastructure; fires when a curation `merge_into` points to a target not in courses ∪ singletons ∪ `UC-CUR-*`) (Phase 1c, 2026-05-27)
  - `cluster_blanks_when_aggregatable` (**14** — grew with the smog/worklist merges; each carries an `aggregate_from_members` suggested fix for the parked Phase 1b — at 14 the "build when ≥5 clusters exist" bar is met if curator demand appears), `cluster_id_off_scheme` (0), `uc_cur_ripe_for_promotion` (0) — Phase 1a

- **Score now incorporates per-tag penalties (`TAG_PENALTY_ON_DISCIPLINE` + `TAG_PENALTY_ON_UNITS`).** Each cross-validation tag deducts from its target field's per-field score before the weighted mean (floored at 0). Tags compound: a row firing 3 discipline rules drops materially below a row firing 1, even with the same field states. Penalties: `discipline_title_mismatch` −0.20, `top_discipline_disagreement` −0.15, `description_discipline_disagreement` −0.15, `generic_title_concrete_discipline` −0.20, `member_top_divergence` −0.15 (all dock the `discipline` field); `unit_anomaly` −0.20 (docks the `typical_units` field). Mirrored client-side in `unified_courses.js` for the breakdown tooltip — keep the two in sync.

- **UCL chip + filter wiring (Phase 1b + 1c UX):**
  - Per-row chip: `⚠ N · 0.XX` (tag count + faculty_trust_score), color-graded by score severity — `warn`/red <0.40, `mix`/amber 0.40-0.65, `muted`/gray ≥0.65 (matches `READINESS_TIERS`).
  - Hover tooltip: tag-derived score breakdown (e.g. *"discipline penalized −0.35 (2 signals)"* + per-tag labels). Computed client-side from the summary — no per-field state inlined into `latest.json`.
  - Toolbar `Triage:` dropdown with 8 modes: *Any audit flag*, *3+ findings* (high-confidence misassignment subset — ~246 rows), *Title mismatch*, *TOP mismatch*, *Description mismatch*, *Generic title*, *Seed untouched*, *Cluster issues*.
  - Toolbar `⚠ N rows flagged (audit YYYY-MM-DD)` indicator — live confirmation that the audit overlay is loaded.

**Outputs:**
- `kb/row_audit/latest.json` — slim per-row summaries + full Cluster cards (~2 MB, committed)
- `kb/row_audit/<date>.md` — human report with top-50 cleanup queue (~7 KB, committed)
- `kb/row_audit/<date>.full.json` — full per-row breakdown (~12 MB, gitignored)

Re-runnable, never mutates. Suggested-fix payloads on aggregable Cluster
fields are shaped for `_apply_curation.py` to consume in Phase 1b. Run from
repo root: `python3 kb/_row_audit.py`.

### Roadmap

> **Completed rows archived.** The DONE / superseded roadmap rows (all the
> shipped phases through Session 32) live in
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Only the still-open
> rows (in progress / parked / queued) are kept inline below.

| Phase | What | Status |
|---|---|---|
| 1b (3/3) | Curate-write Repair-from-members action (Supabase schema migration + fresh-read + cron-window) | parked (low immediate value — 1 cluster; build when ≥5 clusters exist) |
| 1c | More audit rules — **8 of 9 landed:** `discipline_title_mismatch`, `generic_title_concrete_discipline`, `top_discipline_disagreement` (+ SISTER_PAIRS suppression), `description_discipline_disagreement`, `subject_collision_signal` (Phase 1e diagnostic — **7,203 flags pre-re-mint**, target 0 post-re-mint), `unit_anomaly` (2026-05-26, 4,385 flags — first member-level cross-validation, also first non-discipline penalty via `TAG_PENALTY_ON_UNITS`; surfaces possible over-merges across credit-vs-noncredit unit-load variants), and **`merge_into_orphan`** (2026-05-27, **0 flags on current data** — preventive data-integrity detector for dangling `merge_into` pointers; valid targets = courses ∪ singletons ∪ `UC-CUR-*`; fires symmetrically on M-IDs + clusters with bad curation pointers). **`member_top_divergence`** (2026-05-29, **1,299 flags** — the cross-discipline over-merge detector; member colleges' TOP codes span ≥2 broad divisions, ≥30% minority; 736 carry no other strong signal; second member-level rule after `unit_anomaly`). **Still queued:** `cluster_title_drift` (low yield until more clusters mint) | in progress |
| **Cred-Ref PR-5b/2** | Collision-resolution UX in the Credential Reference tab — "Confirm merge" affordance when a rename target collides with an existing credential key. Deferred until a curator actually hits a collision (zero today). | deferred (zero demand) |
| **Activity↔Project PR-D** | (Optional) split Workplan Goals into its own top-level tab if the page gets dense (Sam's prior preference: one page with two sections). | parked unless curator usage signals demand |
| **Excel→Supabase Phase 2-4** | Migrate remaining Excel-driven tabs (Dashboard project cards, Budget, Vision 2030, Personnel). Per-tab inline editors. Excel file retires once Phase 4 cuts over; periodic Supabase→xlsx export retained as backup. **Phase 2 (projects) is COMPLETE: seeded + cut over + editor all landed (Session 15 build → Session 16 seed/cutover/editor).** Phases 3-5 (Budget/Vision/Personnel) follow the same five-step shape + the RLS-tighten step; Personnel already has 26 rows so its PR-3 has UPDATEs. | **Phase 2 DONE** (Session 16); **Phase 3 Budget read-path DONE** (PR #189); **Excel-retirement scope DONE** (PR #210, Session 23 — `docs/kb-notes/excel-retirement-final-scope.md`; corrected the surface: Personnel already Supabase, Vision 2030 is static/computed — neither needs migration); **Excel PR-1 (KPI-ladder keystone) DONE** (PR #211, Session 23 — ladder now sourced from `workplan_goals` not Excel, parity-exact across 49 projects; live 11-cell blank-vs-0 fix on `workplan_goals`, 1.4's real 0s kept); **Excel PR-2 (D.* rows RETIRED, not migrated) DONE** (PR #213, Session 24 — the 15 `D.*` sub-population helper rows were **100% vestigial**: sole value-reader `populate_current_metrics()` dead since 2026-05-28, every other ref excludes them, all 3 JS report gens skip them. Deleted the rows + the dead `populate_current_metrics()`/`_override_int`/`_pmetric_int`/`_ppct`/`_pcount` cluster; generator-only, proven parity-minus-D.* on snapshot + Excel-fallback paths. Method: `docs/kb-notes/methodology-verify-consumer-before-migrating.md`); **KPI-ladder editor = ALREADY DONE** (Session 24 measure-first — PR-1 sourced the ladder from `workplan_goals`, which `workplan_goals.js` already edits; 27 ladder-bearing projects all editable, 0 gaps — no build needed); **Budget inline editor DONE** (PR #215, Session 24 — click-to-edit dollar cells on the 5-Year Funding Plan, `budget_editor.js`; 7 cells/row PATCH `budget_funding`; no `total=Σyears`/`avg` formula yet per Sam; **budget_funding/budget_expenditures/personnel RLS tightened** to `is_allowed_reviewer()` live, `kb/supabase_budget_rls_tighten.sql`). **Excel-dependency audit + fix queue DONE** (PR #217, Session 24 — `docs/kb-notes/excel-dependency-audit.md`, the authoritative remaining-work catalog; triggered by a curator hitting the card "Update" button → it opened Excel-for-the-Web). **Excel retirement — Session 25 (Bruh 25) shipped P1+P2+P4, all merged:** **P1 ✅ (#219)** the "Update→Excel" card button now triggers the inline Latest Update editor (akpi copy dropped; `excel_row` no longer emitted; `dashboard_filters.js` rewire + toolbar button removed); **P2 ✅ (#221)** config tables moved to committed `kb/dashboard_config.json` via new `load_dashboard_config()` (`read_project_config`/`read_config_overrides`/`read_kpi_parameters` rewritten, all drop their `wb` param) + the `ensure_kpi_config_sheet` **WRITER deleted** — the master `.xlsx` is **no longer written on any run** (writer-blockers 2→1); measure-first found Col AG empty + KPI_Config == code defaults, so the JSON carries only the 4 real `project_config` fields; parity-proven (byte-identical readers + full A/B regen); **P4 ✅ (#220)** dead readers `read_annual_goals`/`read_workplan_goals` deleted (148 lines). **Remaining:** **P3** Update Log history (product fork — Sam **dismissed/parked** the decision 2026-06-01; measured: 38 projects / 120 stale entries (latest 2026-04-08); options = read-only **snapshot** / **retire** (keep `latest_update`) / **Supabase `project_update_log`** table); **P5** drop the `.xlsx` — now blocked only by `read_projects` (KPI-ladder + outage fallback), `read_budget_plan` (+ the carved-out budget `factors`/`year_labels`), and `read_update_log`/`archive_updates_to_log` (the **1 remaining writer**, gated on P3) + the `.bak`; keep a Supabase→xlsx backup. Independent: Budget `total`/`avg` formula layer (+ total read-only) + personnel editor (fix the 26→13 dedupe row-identity first). **Also Session 25:** new **daily data-pipeline reference doc** (`docs/kb-notes/reference-daily-dashboard-data-pipeline.md`, #222/#223) — accounts for all **7 data sources** + every headline KPI's lineage + the committed daily dataset; confirmed (via Sam's screenshot) the **MAP Custom Reporting Module's 9 categories are pulled in full** (151 fields), with **College Contacts + College Users & Roles fetched-but-unused** (drop-or-wire decision pending). |
| 2 | Articulations by Unified Course — interactive view + curation | parked |
| 4 | SLO ingestion + the rest of the MC slot fields | parked (unlocks MC-readiness scoring) |
| 5 | CTE classifier (TOP code → COCI CTE field) | parked (unlocks CIDx lane) |
| 6 | CIDx submission automation (the eventual goal) | parked (the destination) |
| 7 | M-ID → CID substitution workflow on approval | parked (governed by Rule 7 once re-locked at faculty publication) |

The auditor is the foundational instrument for the whole pipeline: every phase
upstream of CIDx submission produces a higher trust score and graduates rows
from one readiness tier to the next.

### Session 25 strategic roadmap (approved by Sam, 2026-06-01)

A strategy session locked a forward roadmap beyond Excel retirement. Full specs +
the locked decisions live in [`docs/session_26_handoff.md`](docs/session_26_handoff.md)
("SESSION 26 STRATEGIC QUEUE"); the compact version:

1. **Codebase audit via the built-in `/workflow`** (Sam OK'd using it) — fan
   subagents across the monolith + kb/ + JS + pipeline; one read-only findings
   report (dead code, the **~7-blank-lines/run idempotency bug** in the
   refresh-button injection, perf hotspots, simplification, security). Sam
   green-lights fixes; **no blind refactor**, and **don't** move the daily cron to
   a `/schedule` routine. This is the **Session 26 kickoff**.
2. **KPI card reorder** — ✅ **DONE Session 44 (#377)** on the **headline KPI
   grid** (Sam re-targeted it there for presentation screenshots):
   `kpi_reorder.js`, login-free drag, `localStorage` per-viewer, label-identity
   re-match across regens, ↺ reset. Curated default order (auth-gated, via
   `kpi_order`) stays the later add; Activity-grid extension needs a product
   call (grouped under Goal sub-headers).
3. **Student eligibility counts on the EACR** — data's already in the daily pull;
   **both per-college + deduped-statewide** (Sam's call). **Privacy ADR FIRST** —
   aggregate counts only, **never a StudentID/PII** in any committed/public artifact.
4. **Contacts panel** — Sam chose **WIRE** `View_CollegeContacts` into a per-college
   surface (not drop). Users & Roles stays fetched.
5. **EACR↔CER convergence** — EACR already groups by CE/unified title (Session 8);
   close the gap: apply the CER curator overrides in `_build_statewide_adoption()` +
   add per-local-title college counts to the "Also entered as N variants" disclosure.
6. **Project→Activity consolidation** — Sam chose **fold the project's rich fields
   into the activity card + ARCHIVE the project row** (reversible, never hard-delete).
   Write `docs/kb-notes/playbook-project-activity-consolidation.md` first.
7. **EACR card + credit-rec consolidation** (added 2026-06-01, Session 27) — Sam's
   3 asks from the EACR screenshot review: (a) **merge a credential's Local + CCC
   cards into one** (CCC top billing) by dropping `Collaborative Type` from the
   EACR group key; (b) **consolidate the per-college credit-rec list** by
   `(course title, units)` with local course codes inline; (c) a **"Typical award:
   N units (range a–b)" headline** so the list reads as alternatives, not a
   stackable "bucket of CPL". **Generator change, NOT a re-mint** — cards recompute
   from raw MAP rows each run, 0 `_EACR_FLAG` rows to migrate (verified), and
   `_parse_exhibits()` (the "MAP Exhibits" KPI) must move in lockstep on the same
   key. The vision then grew in-session into a **seeker + adoption-engine view**:
   a **CCC-anchored master-detail** card (CCC Collaborative version as the header
   when one exists — *validated "set"*; else a **synthesized "suggested standard"**
   from the modal local award, which doubles as an MC/CIDx candidate per §11 —
   **94% of articulated credentials are local-only**), per-pattern local cards
   (grouped by `(title,units)`, NOT raw college — 21 colleges → ~5 patterns), and
   a **prescriptive layer** giving each college a status (✅ articulated /
   🎯 potential-aligned-course / ○ potential-aligned-program) with a recommended
   local course — `adoption_leverage` already supplies ~**48k** "should-articulate"
   opportunities (413 `over_merged` correctly withheld). Caveat: the M-ID layer is
   fragmented for single-college articulations (CompTIA A+ → 24 M-IDs), so group by
   `(title,units)` now + let EACR fragmentation feed the Suggested-merges worklist.
   **Rebuilds the per-college grid in the project dash as a playground** (Sam: MAP
   Dash changes are heavyweight + must be prioritized far ahead → prototype here,
   promote proven views — and ultimately the CCR/CSR/CER reference data + curation
   procedures — to MAP later) — adds the consolidation MAP's grid lacks via
   **CER** (exhibit-title unification = card grain) + **CCR** (course-title = credit
   recs), both preserving local titles; the CCR crosswalk is the Quick-Adopt
   enabler; wiring CER overrides into the producer = strategic item 5.
   Decisions locked + **4-phase ladder** (PR-1 consolidation → PR-2 Local+CCC merge
   → PR-3 master-detail seeker view → PR-4 prescriptive recommendations) in
   [`docs/kb-notes/eacr-consolidation-scope.md`](docs/kb-notes/eacr-consolidation-scope.md).
   Delivery = a **versioned prototype gallery** (v1 = current table made
   collapsible; stack v2/v3 below — same data, many renderers; graduate the winner)
   hosting **3 audience views: Student** (find/request credit + likely local
   matches), **College** (my articulations + adoption options), **System**
   (inequitable-access map from `adoption_leverage` × eligible-students,
   privacy-ADR-gated). **Session 27 SHIPPED PR-1 → PR-3 + the sort + the gallery
   v2** (see the Session 27 subsection below); **Session 28 SHIPPED PR-4 (the
   prescriptive layer) + the v2-toggle fix** (see the Session 28 subsection).
   **Next = the 3 audience views** (Student/College/System), plus the captured
   backlog (CPL-Type full-merge, CCR/CSR inverse views, curate-the-unclassified).
- **Sidebar levels** (interleave) — add `data-sections` to CCR/CER/CSR/Exhibit-Adoption;
  optional 2nd nesting level where deep. **Excel retirement** (P5 budget factors →
  JSON, then drop the `.xlsx`) continues underneath.

> **Session narratives 26–40 archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md) (sections
> "Archived session narratives"). Only the Session-25 strategic queue (above)
> and the most-recent session (below) stay inline — **Rule 8 keeps it that
> way** (≤2 narratives inline; older ones move to the archive at checkpoint).
> **Consult the archive when** a carryover item, artifact, decision, PR
> number, or "why is it built this way" question traces to an earlier
> session — each archived narrative carries its PR numbers, doc links, and
> locked decisions verbatim. Searching the archive for an id (e.g. "FLSP
> M1379", "#310") is usually faster than re-deriving from code.

> **Session 41 + 42 + 43 + 44 + 45 + 46 + 48 + 49 narratives archived** → `docs/roadmap_archive.md`
> (witness-kinship gate + R4 singletons; the slot-fix + C-ID authority +
> Phase-1 router; Starlord's cron-verify + off-pane-columns fix; Statewide
> Exhibits KPI + program-area categories + KPI reorder; CCR rules day —
> statewide C-ID router #379 + the CADM homonym repair #381 + the
> description-evidence lane #382; the AUTO/smog case — the 🏷 title lane
> #385 + the STATEWIDE twin merge #386; Supernova's SUBJ ⇄ CCR checking +
> To-Do feed + the fold dry-run #388/#389/#402/#405; Glasstronaut's First
> Light design sprint #391–#404 — the daily plein air greeting LIVE + the
> v1.6 glass-quiet theme spec BLESSED).

> **Session 50 + 51 narratives archived** → `docs/roadmap_archive.md` (the SUBJ4
> canonical fold APPLIED — 71,037-alias permutation, receipts
> `kb/subj4_fold_out/2026-06-12/`; KIN/PE pass 2 — PEDU dissolved + TOP-aware
> ATHL carve-out, 1,057 re-keys, `kb/kin_pe_pass2_out/2026-06-12/`).


> **Session 53 narrative archived** → `docs/roadmap_archive.md` (Bruh Infinitus —
> auto-merge pass 1 APPLIED: 2,272 groups / 5,838 rows, cohort
> `reviewer_email='automerge-v1@bot'`, receipts `kb/automerge_out/2026-06-12/`).


> **Session 54 narrative archived** → `docs/roadmap_archive.md` (Bruh Spaceranger —
> the auto-merge cohort made reviewable: `auto_n` stamp + the ⚙ auto-merged chip +
> the "Auto-merged" Triage lane, PR #428; `tests/uc_auto_merged_chip.test.js`).


> **Session 55 narrative archived** → `docs/roadmap_archive.md` (Bruh Nebula —
> Suggested-merges clarity: ★ merge-target badge #434, self-merge ghost fix +
> discipline-picker disable #435, "⌕ merge into a different course" picker #436;
> + the UC-CUR→Z SCOPE decision #437).


> **Session 56 narrative archived** → `docs/roadmap_archive.md` (Star Treader —
> the UC-CUR → Z-scheme re-mint APPLIED: 4,053 synthetic `UC-CUR-AUTO*` →
> `SUBJ Z<band><seq>`, surface entirely inside `kb_curation`, re-keyed via the
> reusable `kb/_rekey_kb_curation_supabase.py` + `supabase-rekey.yml`; suite 48).


> **Session 57 narrative archived** → `docs/roadmap_archive.md` (Bruh Skydriver —
> worklist popup + CCR polish #441; the consolidation loosening #442:
> `_sug_sig` level-SAFE → level-COLLAPSING; "(NC)" cleanup; Jaccard 0.5→0.4
> deferred).


> **Session 58 narrative archived** → `docs/roadmap_archive.md` (Bruh Skyleader —
> Suggested-merges deep refinement: override-rename + segment-fold + `merge_note`
> #445; synonym map + keyword-gather #446; the looseness slider — title-lane
> `COSINE_MIN` 0.62→0.50).

> Sessions 59 (Bruh Star Navicus) + 60 (Bruh Momentus) built the **TMC Builder**
> tab end-to-end (§7d) — no inline §11 narrative; see `docs/tmc_builder_lessons.md`
> + `docs/session_60_handoff.md`.

> **Session 61 narrative archived** → `docs/roadmap_archive.md` (Bruh Skymarker —
> the per-college approved-ADT overlay from the COCI program export #458:
> `tmc_college_adts.js`, 3,238 pairs/115 colleges/99.9% by TOP code, UCTP as its
> own instance, the reference-data-home ADR).

> **Session 62 narrative archived** → `docs/roadmap_archive.md` (SkyLion — First Light
> local-day painting rotation + the weekly reflections digest #460; CCR synonym-map
> growth ECE/EMT/CNA/HVAC/LVN + the ambiguity validator #461). Full story:
> `docs/first_light_lessons.md` + `docs/ccr_cluster_cleanup_lessons.md`.

> **Sessions 63 (SkyGate — the KB Portal end-to-end #464–#468) + 64 (Startripper —
> the retired-model `cpl-chat` 502 fix #471 + the CCR/CER recommender kickoff #472)
> narratives archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 65 narrative (Skyloft) — a design side-quest, both LIVE on `main`:**
> **First Light gallery 3 → 89** verified-PD paintings (PR #474) via a new
> **runner-as-Commons-proxy** sourcing pipeline (the sandbox can't reach
> Wikimedia — a CI runner sources exact PD filenames + verifies image liveness;
> six parallel curation subagents wrote the prose) + the iconic woodblock prints
> (Hokusai's Great Wave, Hiroshige, Friedrich, Constable, Cole); ghost bg
> .10→.14. **COBI rename** (PR #475) — masthead → *COBI: Chancellor's Office
> Business Intelligence* + `cobi_brand.js` (rotating Mamba subtitle, 8→24 wink,
> Mamba Day purple-and-gold). Almanac (browse-all) **parked — "keep them
> hungry."** Full story: `docs/first_light_lessons.md` (S65) +
> `docs/cobi_lessons.md`; pipeline KB note
> `docs/kb-notes/playbook-runner-as-external-api-proxy.md`. **NEXT:
> `docs/session_66_handoff.md`** — the standing data/CCR + TMC + KB-portal lanes resume.

> **Session 66 narrative (Skylander) — TMC → a CO-staff ADT review tool** → archived in
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md) (the Active/Approved COCI status
> split #477; the CO-review scope + ASCCC acceptance ruleset #478; the template
> acceptance metadata #479 — 119 flexible slots + per-TMC flexibility + 15 recovered
> C-IDs, AfAm 0→3). Full story: [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md).

> **Session 67 narrative (Skywatch) — the CPL News lane** → archived in
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md) (the unattended
> `cpl-news-harvest` Edge Function + `#cpl-news` tab #481; CA-first; full story
> [`docs/cpl_news_lessons.md`](docs/cpl_news_lessons.md)).

> **Session 68 narrative (SkyAlizarin) archived** → `docs/roadmap_archive.md`
> (spotty-cron fixes — the 06:17/09:17/12:17 UTC cron ladder #485 + the
> curation-sync transient-TLS resilience guard #486; the COBI masthead → a
> single-row app bar #487, ported regen-safe).

> **Session 69 narrative (Stargaze — TMC title-fill #489/#490 + the CCR polish
> sweep #492/#493/#495/#496 + the unverified-M-ID renumber scope #494) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 70 narrative (PaintSky — the CCR merge-workspace level-up, 9 PRs incl. the
> pending-merges panel #500, re-discipline-on-merge + forward-looking Common SUBJ #503, band
> filters #505, the global Cons↔Aggr slider #506, opt-in checkboxes #507, the morphological fold
> #508/#509) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

### Session 71 — the CCR merge-workspace epic, completed (2026-06-24)

Executed the Session-70 epic end-to-end — **6 PRs, all merged**. The CCR had **two** merge
popups (the per-row ⚇ `openUnifyDialog` + the ✨ worklist `renderGroup`) that had **drifted**,
causing several Session-70 bugs. Now they are **one shared `buildMergeEditor(container, opts)`,
two feeders**: **#511** scope ([`docs/ccr_merge_workspace_epic_scope.md`](docs/ccr_merge_workspace_epic_scope.md));
**#512 PR-1** extract the editor, worklist embeds it (byte-identical DOM, parity); **#513 PR-2a**
hoist it to `init` scope with a `deps` contract; **#514 PR-2b** the per-row dialog adopts it
(in-row ★ model — Sam's pick; gains completion-note/band-chips/ⓘ/gather/override, keeps
re-discipline #503 via `allowRediscipline`); **#516 PR-3** the worklist is now a **right-hand
docked panel** (resize grip · » collapse-to-rail · ✕; page reflows via `body padding-right`;
`localStorage` `cplWorklistDock.v1`); **#518 PR-4** the dock **re-filters LIVE** with the CCR table
(`render()` calls an assigned `worklistRefilter`, gated on a `ccrSig()` of the carried filter fields
so a post-merge render / CCR-search keystroke never resets the queue; carry-over checkbox = off
switch). The four parameterized opts (`preCheckedIds`, `allowRediscipline`, `dismissLabel`, `deps`)
each default to the worklist's behavior, so adopting the editor regressed neither surface. A latent
bug the move surfaced: the seed member's `k` must be its id_system (§10 axis), not the display
`kind`. Full story:
[`docs/ccr_merge_workspace_lessons.md`](docs/ccr_merge_workspace_lessons.md). **NEXT:
[`docs/session_72_handoff.md`](docs/session_72_handoff.md)** — the epic is DONE; the standing lanes:
unverified-M-ID renumber re-mint, TMC acceptance engine, CPL-Assistant recommender ETL.

### Session 72 — StarLander: the post-consolidation polish pass (2026-06-24/25)

Sam's hands-on review of the now-shared merge workspace — **13 PRs #520–#532, all merged**; because
the editor is shared, each editor-internal change landed once and BOTH surfaces (✨ worklist +
per-row ⚇ dialog) inherited it. **Wave 1/2 (#520–#525):** Cons↔Aggr slider floor 0.40→0.00 + the
opt-in **Confirm no-op fix** (disabled-until-≥2-checked); ⌕ override moved up under the title +
verbose copy → ⓘ tooltips; "Add more" → search-into-candidate-list; the **per-row ⚇ Merge opens the
docked sidebar** (single-course mode, `setBandFilter`); and the **Tight↔Loose candidate-looseness
slider** (the control Sam expected the strength bar to be). **Wave 3 (#527–#531) — 9 refinements:**
sidebar Prev/Next pager · worklist **Discipline filter** · **CCR table syncs to the sidebar's
current course** (`state.focusId` floats it + subject neighbors to top) · candidate slider defaults
**Loose** + persists (`cplCandLoosen.v1`) + auto-surfaces · editor keyword box **eliminated** (one
top Search box) · multi-term **comma=OR** search w/ ghost text · "Merge into existing" chip → section
note · the **Title-5 §55050 level convention** in `courseBands()` (ranges/words/ordinals classify;
bare numbers a curator-overridable hint). **Wave 4 (#532):** kept the human labels **Beg/Int/Adv**
(tried L1/L2/L3, reverted — internal keys stay `beg/int/adv`, no data churn). 81→**87 green**. Full
story: [`docs/ccr_merge_workspace_lessons.md`](docs/ccr_merge_workspace_lessons.md); NEW KB note
[`docs/kb-notes/reference-course-level-convention.md`](docs/kb-notes/reference-course-level-convention.md).
**NEXT: [`docs/session_73_handoff.md`](docs/session_73_handoff.md)** — standing lanes: unverified-M-ID
renumber re-mint, TMC Phase-2 acceptance engine, CPL-Assistant CCR/CER recommender ETL.

---

## Troubleshooting

### Dashboard not updating
1. Check the GitHub Actions run — Actions tab in GitHub
2. Check `live_metrics.json` → `scraped_at` timestamp
3. Check if commit was pushed (`git log origin/main -5`)
4. If browser shows stale content, hard-refresh (Ctrl/Cmd+Shift+R)

### Scrape returning errors
1. Test: `https://cpl-proxy.slee-548.workers.dev/scrape?secret=CPL_SCRAPE_2026`
2. `Invalid or missing secret` → check `SCRAPE_SECRET` in Cloudflare dashboard
3. `CPL API returned 502` → CCCCO Dashboard may be down
4. `ALL COLLEGES row not found` → API response structure may have changed

### KPI values stale but date updated
- Pipeline updates the "Updated" date but only refreshes KPIs if
  `live_metrics.json` has newer data
- Check `live_metrics.json` → `scraped_at`
- If old, the scrape step failed — test the worker endpoint directly

### "Duplicate sections" / HTML growing on every run
- You've likely removed or broken the idempotency guard in
  `excel_to_dashboard.py`. Verify the block around the
  `EXHIBIT_CSS_MARKER` check still strips existing copies before re-injecting.

### `kpi_history.json` 1d delta shows stale comparison
- Check for date gaps in the JSON. If yesterday is missing, backfill with
  `"_interpolated": true`.

### docx library errors
- Local `docx.min.js` is v8.0.4 UMD, 334KB. CDN versions were unreliable — do
  **not** switch back to CDN. To refresh the local copy:
  `npm pack docx@8.0.4`, extract, copy `umd/docx.min.js`.
