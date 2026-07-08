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

## Naming & terminology (Sam's conventions — honor in ALL output)

- **New identity phase (Sam, 2026-07-03):** the program is the **CPL
  Initiative**; never "MAP Initiative" in new writing. The platform is the
  **MAP platform** — long form **"Mapping Articulated Pathways (MAP)
  platform"**. **"Military Articulation Platform" is the platform's original
  2017 launch name — history-only, never the current expansion.** Enforced in
  every report prompt (`NAMING_RULE` in `report_generator.js`;
  `college_report_generator.js`; `annual_report.js` polish), the docx footers,
  a live `sierra_guidance` row (id `cb226a48`, deactivatable in the 🧭 pane),
  and the public KB's `claude/CLAUDE.md`. Historical titles/quotes stay verbatim.
- **"Activities" = activities AND their projects.** When Sam says
  "Activities" he generally means both the workplan activities and the
  projects under them. The sidebar label is **Activities** (renamed from
  "Activities & Projects", Session 97); the tab hash stays
  `activities-projects`.

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
  - **Poll CI via the MCP `github` tools, NOT `curl` (Session 76).** The remote
    sandbox's `GH_TOKEN`/`curl` against `api.github.com` returns *"GitHub access
    is not enabled for this session"* — only the **MCP `github` server** can reach
    GitHub. So a `Monitor`/Bash loop that curls the check-runs API to watch CI
    **silently times out** (it never gets data). Check status with
    `pull_request_read {method:"get"}` (small — read `mergeable_state`) or
    `actions_list {method:"list_workflow_runs"}` (large — parse the saved
    tool-result file with python, don't read it inline). Webhooks don't deliver
    CI *success*, so you must poll.
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
| `kpi_history.json` | Daily KPI snapshots — drives trend sparklines + deltas. **Session 88 added `ccc_exhibits`** (= the statewide CCC-collaborative EXHIBIT count) and repointed the KPI Trends "CCC Collaborative" row to it, so Trends matches the MAP Exhibits card (132) instead of the legacy `ccc_collaborative` = adopting-colleges (61, still recorded for provenance / the Statewide Exhibits card's "Adopting Colleges"). |
| `fetch_veteran_jst.py` + `veteran_jst.json` | **MIL vs JST** (Session 88). `fetch_veteran_jst.py` GETs the public `potential-savings` API on the daily runner (the Azure host is egress-blocked from the sandbox; the worker scrape doesn't carry these) and writes `veteran_jst.json` = statewide `{mil=EnrolledMilitaryStudents, jst=VeteransWithJSTs, star_colleges=StarCollegeCount}` + per-college `{mil, jst, star}` (Veteran Star = JST ≥ 75% of MIL). **No PII** (same counts the public MAP dashboard shows) → committed (guarded `git add`). Soft-fails (keeps the prior file). Consumed by the generator: `read_veteran_jst()` → `apply_veteran_jst()` (Veteran Sprint card: real JST + MIL + the 75% rule, replacing the military-students proxy) + `render_college_activity_card(veteran_jst=…)` (the College Activity "MIL / JST" column + the Veteran Star, gated `window.COLLEGE_HAS_JST`). ⚠ the computed per-college star count (~46) runs slightly under MAP's `StarCollegeCount` (50) — the savings API has no per-college star flag, so the 75% rule is the best signal (logged as `computed_star_colleges`). Workflow step: daily-dashboard.yml "Fetch MIL/JST veteran data". |
| `statewide_data.js` | Statewide exhibit adoption data. **Session 79 added an additive per-exhibit `authoritative_recs`** (`_build_statewide_adoption`) = credit recs collected from raw `Collaborative Type == "CCC"` rows ONLY (the one MAP-published statewide exhibit, not adopt/adapt copies). Consumed by the Fact Sheet's `fact-sheet/_build_statewide_recs.py` → `fact-sheet/statewide_recs.js`. The existing `credit_recs` (EACR's source) is untouched. See `docs/kb-notes/reference-authoritative-statewide-exhibit-signal.md`. |
| `statewide_prescriptive.js` | EACR prescriptive layer (`window.CPL_STATEWIDE_PRESCRIPTIVE`, keyed by `unified_title`): per credential, the colleges that could adopt it + the likely local course each already teaches. M-ID `adoption_leverage` ⨝ minted memberships, over-merged withheld (§6a). Generated by `_build_statewide_prescriptive()`; consumed by the EACR v2 Credential view. |
| `college_short_names.js` | College full-name → short-name resolver (`window.cplCollegeShort(name[, style])`, `window.CPL_COLLEGE_SHORT`). Generated from `kb/college_short_names.json` by `kb/_seed_college_short_names.py`; `<script>`-loaded after `college_lookup.js`. Powers compact college chips on CCR/EACR/CER (short text + full name in `title`). Static — NOT a daily-cron artifact. See `docs/kb-notes/reference-college-short-names.md`. |
| `cpl_funding.js` | Implementation Funding tab renderer (`window.CPL_FUNDING_TAB`). Lazy-loaded by the tab shell's inline boot on first `#implementation-funding` open; injects its own `var(--token)` CSS (no Rule-4 mirror needed). Static — NOT a daily-cron artifact. **Session 2 (2026-07-03) Chancellor-facing rework:** a **2-year selectable window** (two year dropdowns; the pool splits by the number of selected years), **year-specific priorities** (Year 1 / Year 2 filter switches each priority's metric text + share + target and the college P1/P2/P3 columns), **editable priority metric/description/share/target + editable feeder headcount/metric + pool inputs**, a **noncredit-feeder carve-out section** (pool = carve-out ÷ years, split among NOCE / SD Cont. Ed / Mt. SAC NC / Calbright by headcount), and a **team-phrase auth bar** (reuses `window.CPL_TEAM_PHRASE`): edits resolve `SCENARIO (per-browser what-if) ?? SHARED (Supabase cpl_funding_config, team-phrase editable) ?? BASE (baked defaults)` — unlocked edits PATCH the shared config for everyone, locked edits are a local scenario the Chancellor explores freely. Kept the college table / drill-ins / district rollup / period toggle / P2/P3 actuals. Requires `team_phrase.js` (loaded eagerly before it). **Session 3 (2026-07-06) equity refinements (team asks, Sam: "Build all 4"):** a **front-load toggle** (disbursement even ⇄ Front-load Year 1 — full window in Yr 1, `↻ carryover` cells, close-out = window end + 1; timing only), the **minimum-viable floor** (`pool.floor_window` $150K default; `allocModel()` iterative waterfall — floored colleges get exactly the floor, remainder renormalizes over the rest, Σ = net pool; ⬆ chips + top-up card), the **rural performance allowance** (`pool.rural_carveout` $1M; 10 RCTC colleges rural-flagged (DRAFT) + in-tab override; each earns carve-out ÷ #rural at ≥ `rural_threshold` (50%) of measurable Yr-1 targets; 🌲 chips + section table), and **baseline-eligibility badges** (informational: ① CPL Coordinator in MAP via the PII-free anon `map_coordinator_summary()` RPC; ② opt-in by 2026-09-01 via `cpl_funding_participation`; Elig column ✓/◐/○ + drill-in team toggles). **Session 3 evening batch:** County column hidden (data stays in drill-in/CSV), **Eligible†** column (perf builder's new PE = distinct students with any eligible units) next to **Transcribed†**, floor-≠-higher-targets note, **⬇ Excel (CSV) + ⬇ PDF (print-window)** exports, **CO Monitor's notes** (gated `cpl_funding_notes` — read AND write reviewer/team-phrase), **seal-blue backgrounds** (`--seal-blue` replaces the charcoal `--navy-primary` on hero/th/seg/buttons), and **named per-browser scenarios** (`cpl_funding_scenarios_v2` slots + authbar selector; v1 auto-migrates). Docs: `docs/cpl_funding_lessons.md`. |
| `cpl_funding_data.js` | Funding-model **defaults** (`window.CPL_FUNDING`, model `2026-07-03.1`): pool inputs, `year_options`/`default_years` (2-year window), `year_priorities` (slot 1 & 2, 3 priorities each with Year-1/Year-2 metric text + shares/targets), `feeders` (4, editable headcount estimates) + `feeder_metric` + `pool.feeder_carveout`, **115 colleges** + SYSTEM (headcount + geo only — **per-college dollars are computed LIVE by the renderer**, not baked; the 4 feeder institutions live in `feeders`, NOT the college table). **The Excel workbook + one-shot builder were RETIRED 2026-07-03** (Sam: "we don't need that excel book anymore") — this is now a **committed, hand-maintained static snapshot** (PII-clean institutional/census aggregates). **Headcounts = the 2025-26 MIS update Sam supplied 2026-07-03** (74 rows; the other 41 carry 2022-23, per-row `hc_vintage` — the tab renders a data-driven mixed-vintage note until the refresh completes). Refresh by editing the `colleges`/SYSTEM headcounts + `headcount_pct` here directly + bumping `model_version`; the prior builder is in git history. NOT a daily-cron artifact. **Session 3 (2026-07-06) policy defaults added** (all in-tab editable): `disbursement` (even), `pool.floor_window` ($150K), `pool.rural_carveout` ($1M) + per-college `rural` flags (DRAFT = the 10-college CCCCO Rural College Transfer Collaborative cohort, `rural_source` provenance) + `rural_threshold` (0.5), `participation_deadline` (2026-09-01). |
| `cpl_funding_performance.js` | Funding priority-metric actuals (`window.CPL_FUNDING_PERF`: per-college P2/P3 distinct-student counts + statewide, small-cell suppressed <5 per the RATIFIED `docs/kb-notes/adr-funding-priority-metrics-privacy.md`). **Daily-cron artifact**: built by `funding/_build_funding_performance.py` from the transient `CustomReport_latest.json` (workflow step 4a2; in the `git add` list); skips gracefully on fetch fallback. P1 is a deliberate gap (`docs/kb-notes/reference-p1-completion-data-gap.md`). |
| `tmc_builder.js` | TMC Builder tab renderer (`window.CPL_TMC_BUILDER`). Lazy-loaded on first `#tmc-builder` open; injects own `var(--token)` CSS. College+TMC selectors → fixed C-ID left / COCI-dropdown right, C-ID auto-match, units check, Total Units, Supabase Save/Resume, export (.docx/print/JSON). Static — NOT a daily-cron artifact. Docs: `docs/tmc_builder_lessons.md`. |
| `tmc_templates.js` | The **45-TMC catalog** (`window.CPL_TMC_TEMPLATES`) — **AUTO-GENERATED by `tmc/_parse_tmc_pdfs.py`** from the official ASCCC TMC PDFs (`tmc/source_pdfs/*.pdf`, committed for provenance). All 45 are `draft` (parsed from the official template, faculty-verify) with real C-IDs + authoritative titles (verified C-IDs pull their title from `cid_descriptors.json`), per-section structure (Required Core / List A/B/C), and an official-template URL in `_meta.sources`. Slots with `cid_unverified:true` carry a C-ID not in our descriptor extract — a deliberate **discrepancy signal** that C-ID (or our reference) may need updating. **Session 66 added the CO-review acceptance metadata** (`refine_slot()`): per-slot **`flexible:true`** marks a FLEXIBLE proviso ("any articulated major-prep / CSU-transferable course") = accept any qualifying course + ASSIST evidence (engine tier 2); per-TMC **`flexibility:'fixed'|'flexible'`** (5 fixed); embedded C-IDs (inline "…C-ID AFS 100" / stray verified tokens) are recovered → real slots, fixing the only 0-C-ID template (African American Studies). 584 C-ID + 119 flexible slots. **Session 90 added the OR-alternative fold**: the parser folds `tmc_or_groups.json`'s intra-line "X OR Y" groups into a single slot with `alts[]` (77/80 folded; `_meta.or_groups` reports applied/skipped). See `docs/kb-notes/reference-adt-acceptance-rules.md` + `reference-tmc-adt-data-model.md`. Re-run after refreshing a PDF or the overlay. Static. |
| `tmc_or_groups.json` | **Curated OR-alternatives overlay** (`tmc/tmc_or_groups.json`, added Session 90). Per `(tmc, section)`, the C-IDs that satisfy ONE requirement line the official template joins with "OR" (pick one) — the intra-line OR that `parse_tmc_pdfs.py` can't recover from `fitz`'s column-scrambled text. Extracted by a per-template **visual PDF read + adversarial verification** (80 groups, each with an evidence quote). Consumed by the parser's OR-fold (first existing-slot member → `cid`, rest → `alts[]`; skips a group with no existing-slot anchor or a within-section member overlap). Authored/editable — correct a group here, then re-run `tmc/_parse_tmc_pdfs.py`. Static — NOT a daily-cron artifact. |
| `tmc_college_courses.js` | Per-college course index (`window.CPL_TMC_COLLEGE_COURSES`: 120 colleges, 141,699 courses + 1,986 synth rows, 8.0 MB) powering the right-side pickers. Built one-shot by `tmc/_build_college_courses.py`. **Session 90 unioned the c-id.net authority** (`kb/reference/cid_articulations.json`) with COCI's `CIDNumber`; **Session 92 (#642) made the union a JOIN LADDER so EVERY non-sequence approval lands** (receipts in `_meta.cidnet_join_lanes`): exact → zero-norm → squashed full code (`PHYS 223`+`F` ↔ `223 F`) → **strict unique-title** (→ the verify-tier `tcid[]` 8th element) → **synthesized flagged row** (7th element `1` — approval real per c-id.net, course absent from our stale-mid-CCN COCI extract; units null). Comma-joined `CIDNumber` values are split (46 were unmatchable primaries). Rows: `[subj,num,title,units,cid]` / `[…,cid,xcid[]]` / `[…,xcid[],1]` synth / `[…,xcid[],0,tcid[]]` title-inferred; consumer matches `{cid}∪xcid∪tcid`, renders tcid `≈ verify` + synth `per c-id.net` chips (never COCI-grade ✓), `autoMatch` prefers hard>title>synth carriers + used-tracks, save/resume round-trips `course_cids/tcids/src`. `sequence:true` rows excluded; soft-fails without the c-id.net file. Static — rebuild only on a fresh COCI/c-id.net extract; NOT in the daily `git add` list. Tests: `tests/tmc_cidnet_synth.test.js` (31). |
| `tmc_college_adts.js` | Per-college **approved-ADT overlay** (`window.CPL_TMC_COLLEGE_ADTS`: `by_college[college][tmc_id] → {b:bucket, s:status, c:control#, a:approvedDate, u:units, t:rawTitle}` + `tmc_totals` + `extra_tmcs`) — the **authoritative source** for which colleges hold an approved ADT in each discipline. Built one-shot by `tmc/_build_college_adts.py` from the COCI **program** export (`tmc/source_data/coci_program_export_<date>.csv`, committed for provenance). The TMC tab stamps a per-college status onto each TMC, mirroring COCI's two affirmative states separately (Session 66 — ✓ Active = live in catalog · ✓ Approved = CO-approved, pending activation · ⏳ In progress · ◐ Teachout; Inactive hidden). 3,238 (college,TMC) pairs (2,867 active · 218 approved-pending) · 115 colleges · 42 ASCCC TMCs + UCTP. UC Transfer Pathway (UCTP Chemistry/Physics) are their **own instances** (`extra_tmcs`, `kind:"uc-transfer-pathway"`), never folded into the Chemistry/Physics ADT. Lazy-loaded by `tmc_builder.js`. Static — NOT a daily-cron artifact; rebuild on a fresh COCI program extract. |
| `tmc_ge_patterns.js` | The **GE Breadth patterns** (`window.CPL_TMC_GE_PATTERNS`) for the full-ADT companion panel (Session 60): **Cal-GETC** (the single statewide ADT GE pattern as of Fall 2025, AB 928; primary) + legacy **IGETC** and **CSU GE Breadth**. Each modeled as `sections[].slots[]` like a TMC but `ge:true`+`noncid:true` (college-certified GE areas, no C-ID auto-match; `units` = per-course minimum). **DRAFT** — encoded from public ASCCC/CCC standards (CCCCO Breadth Form PDFs bot-block the agent env), verify against the official forms. Lazy-loaded by `tmc_builder.js`. Static — NOT a daily-cron artifact. |
| `team_phrase.js` | **Shared team-phrase unlock helper** (`window.CPL_TEAM_PHRASE`, added Session 97 follow-up — Phase 1 of `docs/team_phrase_expansion_plan.md`): validate-BEFORE-store against `rpc/team_pass_ok` (the #598 lesson), the shared `cpl_team_pass` localStorage key, `decorateHeaders` (anon bearer + `x-team-pass` — never "Bearer undefined"), stale-phrase drop on 401/403, and a reusable `unlockRow` UI. Consumed by `workplan_goals.js`, `budget_editor.js`, `assoc_editor.js`, `tmc_builder.js` (curator notes ONLY — the review RPC path stays magic-link). raci.js keeps its own original implementation (same key). STATIC; `<script>` in BOTH HTMLs (Rule 4). Tests: `tests/team_phrase_p1.test.js` (41). |
| `dashboard_filters.js` | Client-side filter/search logic. **Session 97:** reads the slim actions bar (Lead + Search only) defensively — the Activity/Vision/Goal/Status selects, Apply/Reset, and the bar-level Master Report/Attach Doc buttons are retired (attach = card-level 📎 only; the explainer stays). |
| `nav_groups.js` | **Sidebar nav groups** (added Session 97): runtime-wraps the flat rail into 5 labeled collapsible groups + Share (Workplan / Funding / Strategy & Impact / Reference & Curation / Sierra & Team Tools) — the `kpi_cards.js` regen-proof pattern; Dashboard stays pinned; unlisted future tabs stay top-level; active tab force-opens its group; per-browser state `cplNavGroups.v1`; `<script>` in BOTH HTMLs (Rule 4). Tests: `tests/nav_groups.test.js`. |
| `kpi_reorder.js` | Login-free drag-to-reorder for the headline KPI grid (`.kpi-section`): per-browser order in localStorage (`cplKpiOrder.v1`), cards re-matched by label text across daily regens, new cards re-enter at default position, ↺ reset affordance. Static — NOT a daily-cron artifact. |
| `kpi_cards.js` | **KPI card shelf** (added Session 86): per-browser **HIDE** + **centered title row** + per-card **COLLAPSE** for the headline KPI grid — the `kpi_reorder.js` pattern. At runtime it wraps each `.kpi-card`'s `.kpi-number`+`.kpi-label` into a centered `.kc-head` and the rest into a collapsible `.kc-body`; cards open **collapsed (top half only)**, click a card's head to expand, per-card × hides (→ a "Hidden (N)" restore tray), and an **Expand-all/Collapse-all** toolbar flips them all. Scopes to `.kpi-section > .kpi-card` ONLY (the full-width KPI-Trends + College-Activity panels are left alone). State in localStorage (`cplKpiCards.v1`), re-matched by `.kpi-label` across daily regens, injects own CSS, coexists with `kpi_reorder.js` (controls ride a drag; clicks stopPropagation). `<script>` in BOTH HTMLs (Rule 4). Static — NOT a daily-cron artifact. Tests: `tests/kpi_cards.test.js`. Docs: `docs/cobi_lessons.md` (S86). |
| `first_light.js` | **First Light** — the once-a-day plein air greeting (added Session 48): date-seeded painting-of-the-day modal with **local-day rotation** (no day-to-day repeats, Session 62; **89-painting gallery, Session 65**; grayscale→color reveal **(mono:true B&W prints skip the no-op fade via `.cplfl-mono` — load-bearing since 2026-06-23; a build guard fails any un-flagged B&W)**, read-aloud via browser `speechSynthesis`, hand-written alt text), opt-out + once-per-day localStorage guards, a **hidden reviewer almanac** (type `almanac` anywhere → ‹ Prev/Next › the full catalog with a counter; a review pass never consumes the daily greeting — the private QA tool, NOT a public browse-all), runtime-injected "Today's painting" header chip (regen-proof), an anonymous reflection box POSTing `{painting, reflection}` to Supabase `cpl_reflections` (anon WRITE-ONLY RLS; the weekly **musings digest** reads them server-side via `reflections/build_reflections_digest.py` → output bound for the private `cpl-knowledge-base` vault, NOT this repo), and — since the Session-49 retheme — the **ghosted painting layer** behind the whole page (`.cplfl-bg`: today's pick grayscaled at 14% opacity, painterly fallback, honors the opt-out + `prefers-reduced-transparency`/`contrast`). Manifest = **89** verified-PD paintings, built by the **runner-as-Commons-proxy** pipeline — `tools/source_first_light_art.mjs` (sources exact PD filenames from the Commons API on a CI runner, since the agent sandbox can't reach Wikimedia) → `tools/build_first_light_manifest.mjs` (assembles from the curated `tools/first_light_selection.json`; no hand-typed filenames) → `.github/workflows/first-light-art.yml` (push-triggered source + image-liveness verify). Categories in `tools/art_categories.json`; iconic works via the append-only `tools/art_extra_files.json`. Sourcing rules: `docs/kb-notes/reference-public-domain-art-sourcing.md`; pipeline: `docs/kb-notes/playbook-runner-as-external-api-proxy.md` + `docs/first_light_lessons.md`. Static — NOT a daily-cron artifact. Theme spec/prototype: `prototype/first_light_theme_v1.html` (**v1.6 — GLASS-QUIET chips graduated**, Sam-blessed 2026-06-12; solid family archived in the Chip Studio) + `prototype/check_contrast.py` (whose `--live` mode lints the live `:root` in CI — the retheme SHIPPED Session 49, PRs #407/#408/#410). Tests: `tests/first_light*.test.js`. |
| `cobi_brand.js` | **COBI brand layer** (added Session 65): the masthead personality for *COBI — Chancellor's Office Business Intelligence* (a light Kobe homage). STATIC, regen-proof (the `first_light.js` pattern — injects own CSS + runtime DOM): a **rotating Mamba subtitle** (random per load), an **8→24** jersey wink on the wordmark, **Mamba Day** (Aug 24 → purple & gold). The `<h1>`/`<title>` emit `COBI` from the generator (decoupled from `proj_title` so Word reports keep their name); tagline + `#cobi-mamba` slot + nav label are static in BOTH HTMLs (Rule 4). Tests: `tests/cobi_brand.test.js`. Docs: `docs/cobi_lessons.md`. |
| `cpl_todos.js` | The 📋 To-Do button on every tab (added Session 47): renders `kb/cpl_todos.json` as a For-Sam / For-Fable daily checklist with a "where we are" status line; per-browser check-offs (`cplTodos.v1`, keyed by the feed's `_as_of` so each refresh starts fresh); per-tab badge + nav chips for other tabs' items. Feed refreshed at every Rule-8 checkpoint. Static — NOT a daily-cron artifact. |
| `report_generator.js` | Custom Report Generator (Claude API via proxy). **Session 96 wired it LIVE:** before prompting it fetches the newest `item_updates` per activity/project + `item_raci` (lead = Responsible → Accountable) — the same anon overlays the card faces use — and adds a "Latest Activity-Level Updates" prompt block; falls back to the build-time `CPL_DATA.live_updates`, then the baked fields. Test hooks on `window.CPL_CUSTOM_REPORT`. **Session 97:** Report-Type toggle (absorbs the Master Report), Elevation slider, per-audience titles, progress bar, `NAMING_RULE` (see §7). Tests: `tests/report_live_wiring.test.js` + `tests/report_session97.test.js`. |
| `master_report.js` | **Master Report builder** (`window.CPL_MASTER_REPORT`, added Session 96). **Session 97: the filter-bar button was RETIRED** — the Custom Report modal's 📋 Master Report-Type option now drives this module's `fetchLiveOverlay`/`buildReportModel`/`renderDocx` with its own checkbox selection (lazy-loaded via `CPL_TABS.loadScript`; this file's own modal remains as a dormant fallback). Opens the same Activities & Projects checkbox tree as the Custom Report and builds the Workplan-style master .docx CLIENT-SIDE from `CPL_DATA` + the live `item_updates`/`item_raci` overlays — always-current at click time; partial selections stamp a "Scope: N of M" line. Layout ported 1:1 from `generate_reports.js`; uses the local `docx.min.js` (never CDN). The daily pre-built `reports/CPL_Master_Report.docx` stays as the modal's fallback link (and is FRESH again — the workflow now installs node `docx` + commits `reports/*.docx`; it had been failing silently since forever). STATIC, lazy — NOT a daily-cron artifact. Tests: `tests/master_report.test.js` (28). Docs: `docs/cobi_lessons.md` (S96). |
| `docx.min.js` | Local copy of docx@8.0.4 UMD build (do **not** switch to CDN) |
| `fetch_custom_report.py` | Fetches CustomReport JSON from the MAP API |
| `cpl_news.js` | **CPL News** tab renderer (`window.CPL_NEWS_TAB`). Lazy-loaded on first `#cpl-news` open; injects own `var(--token)` CSS; reads `public.cpl_news` LIVE (anon) — CA-first, scope/source/search filters, suggest-a-story, reviewer feature/hide. Static — NOT a daily-cron artifact (the feed is the live table, not a committed file). Fed by the **`cpl-news-harvest`** Supabase Edge Function (`chatbox/supabase/functions/cpl-news-harvest/index.ts`) invoked by **`.github/workflows/cpl-news.yml`** (cron 13:17 UTC). Schema: `news/supabase_cpl_news.sql`. Docs: `docs/cpl_news_lessons.md` + `docs/kb-notes/playbook-cpl-news-aggregation.md`. Added Session 67 (Skywatch, PR #481). |
| `fact-sheet/` | **Public CPL Fact Sheet** — a self-contained, **standalone** page (`index.html` + `factsheet.css` + `factsheet.js` + `img/`) recreating the Feb-2026 journalist Fact Sheet PDF, served publicly by Pages at `…/cpl-project-tracker/fact-sheet/`. "Sits alone" (NO COBI nav) so it's shareable without exposing the internal tabs — the `kb-portal/` pattern, minus the auth gate. `factsheet.js` binds the 6 headline KPIs (+ Military/Workforce/Apprentice breakdowns + Veteran-Sprint figures) from `../live_metrics.json` on load (baked values = graceful fallback); the 5 exhibit/recommendation KPI cards + the Statewide Exhibits per-sector counts are a **labeled MAP Custom Reporting Module snapshot** (not live). Cambria prose / Calibri data; print CSS at 0.4in → browser "Save as PDF" is the export (opens `<details>` for print). Launched from COBI by a **non-tab** `📄 CPL Fact Sheet ↗` anchor in the nav rail (`<a class="cpl-tab cpl-tab-external">`, no `data-tab` so `tabs.js` ignores it; mirrored in BOTH HTMLs, Rule 4). Statewide exhibit lists come from `kb/statewide_exhibit_categories.json`. Static — NOT a daily-cron artifact. Added Session 74 (SkyBlaster), PRs #537/#540. **Session 80 (StarMan) made it Curate-editable** (PR #570): standalone **`factsheet_edit.js`** overlays reviewer edits (text + hide/show) onto any box, keyed by DOM-walked stable `data-fsk` keys (no per-box HTML markup), from `public.factsheet_overrides` (anon read, `is_allowed_reviewer()` write); ✎ Curate button + magic-link `cpl_sb` session + **allowlist**-sanitized HTML; the JST upload card was removed. Editing **excludes** `#statewide-exhibits`/`#progress`/`[data-bind]`. **Session 81 (StarFarout) extended Curate** (PRs #576/#578): **add / ✕ delete / drag-reorder boxes** + **add / replace / resize / ✕ delete images** — all on the *unchanged* `factsheet_overrides` table via **reserved key namespaces** (`\|add\|`, `\|__order`, `\|img\|`, `\|fig\|`) the overlay materializes (image *bytes* live in a public-read / reviewer-write **`factsheet-images`** Storage bucket, `supabase_factsheet_images.sql`); plus a rotating **"My CPL Stories"** section (4 random, headless-sourced from `map.rccd.edu/cplstories/` via `tools/source_cpl_stories.mjs`, PR #577). **Session 82 (SkyFlyer) made the rest of it Curate-able + a11y + Word** (PR #584): the live **Veteran-Sprint** stats are now editable+moveable+Add (live-aware `applyBlock`); the **`#progress` KPI cards** are **move/delete-only** (`MOVE_ONLY_SECTIONS`); the **budget table** is **hide-only**; **＋Add box is per-GRID** (added boxes carry a `gN` grid signature); stable keys now **exclude `[data-bind]` text**. Plus ~15 embedded links, a **WCAG 2.1 AA** pass, print fixes (navy table header no longer white-on-white), and a new **⬇ Word** export. Docs: `docs/fact_sheet_lessons.md` + `docs/kb-notes/playbook-standalone-public-page.md` + `docs/kb-notes/playbook-curate-editable-standalone-page.md` + `docs/kb-notes/methodology-reserved-key-namespaces-on-overrides-table.md` + `docs/kb-notes/methodology-stable-dom-keys-exclude-live-text.md` + `docs/kb-notes/playbook-standalone-dom-to-word-export.md`. |
| `fact-sheet/factsheet_word.js` | **Fact Sheet ⬇ Word export** (`window.CPL_FACTSHEET_WORD`, added Session 82). Dependency-free **DOM-to-`.doc`**: clones the LIVE `<main>` (so it reflects live KPIs + Supabase Curate overrides), strips chrome (TOC / curate controls / live chip / `.no-print` / `.fs-ov-hidden`), expands collapsibles, rebuilds the statewide CSS-grid pseudo-table as a real `<table>`, rewrites images to absolute URLs, and wraps in mso-namespaced Word HTML (`@page WordSection1`, BOM) → `California_CPL_Fact_Sheet_<date>.doc`. Clone-not-mutate (the on-screen page is untouched). Wired to the `#btn-word` action-bar button. Static — NOT a daily-cron artifact. Tests: `tests/factsheet_word.test.js` (19). KB note: `docs/kb-notes/playbook-standalone-dom-to-word-export.md`. |
| `raci.js` | **Team & RACI** tab renderer (`window.CPL_RACI_TAB`, `#raci`). Lazy-loaded on first `#raci` open; injects own `var(--token)` CSS. A **RACI Matrix** (4 Activities + their projects × R/A/C/I, click a cell → member-picker) + an editable **Team Directory** + per-member **Nudge for Updates** toggle. Public reads of Supabase `team_members` + `item_raci` (anon); writes gated by the shared `cpl_sb` magic-link reviewer session + `is_allowed_reviewer()`. **Session 76 (SkyTrek) made the matrix a 3-tier tree** — `buildItems()` nests **Activity → sub-activity → project/work item** from `window.CPL_DATA` (`activity_kpis` = the official sub-activity ids; `projects`' **dotted ids** encode the nesting via id-prefix parenting, `4.1`→`4.1.1`, `3.1.2`→`3.1.2a`; `5.x` with no numbered parent nest under their Activity). 38 rows, depth-indented + tier-styled (`sub-activity` tag). Each row independently RACI-able; **non-Activity rows keep `item_type:"project"`** so no key migration / no lost assignments. Nav: a **hierarchical scope filter** (`<optgroup>` per Activity → "▸ All of Activity N" + its sub-activities; scope `all`/`act:N`/`sub:ID`, ancestor-preserving search) + per-card **`👥 RACI` deep-links** (cards set `sessionStorage['cpl_raci_focus']` then navigate `#raci`; consumer flashes the row — every `<tr>` carries `data-raci-key`). Static — NOT a daily-cron artifact; only the nav button + pane + boot are mirrored in BOTH HTMLs (Rule 4). Schema: `raci/supabase_raci.sql`. Tests: `tests/raci.test.js` (64 checks). Docs: `docs/cobi_raci_nudge_lessons.md`. Added Session 75 (SkyMaster), PRs #546–#548; nav + 3-tier PRs #550/#553 (Session 76). **Session 77 (StarPort) added** (PRs #556–#562): **Copy-RACI** (`⧉ copy` a row's R/A/C/I to others), the **token-refresh-on-write fix** (`ensureFresh()` renews the magic-link access token before every `sbWrite` — a format-valid-but-expired JWT was 401-ing saves silently; `saveRaci` rolls back optimistic state on failure — `docs/kb-notes/methodology-refresh-token-before-write.md`), the **nudge accountability layer** (`team_members += last_nudged_at/last_response_at`; directory Last-nudged + ✓responded/⏳awaiting columns; manual team 📣 + check-all/clear-all), the **per-item 📣 nudge** (emails a row's R/A people, quotes the card + a deep-link to its composer), and the **📝 update composer** (braindump → ✨"Let CC write it up" via the report proxy → appends `item_updates`; deep-link consumer `?update=<key>#raci` / `sessionStorage.cpl_update_focus`; the 📝 link is emitted on every Activity/Project card by the generator). **Session 79 (StarBender) made RACI the card's source of truth** (PRs #567–#571): the card **Lead** now derives from the RACI **Responsible** (not the old `projects.lead`) via the new `card_raci.js` overlay + a hover roster on the 👥 button; the 27 remaining `projects.lead` values were **seeded** into `item_raci` as Responsible (Beth Kay dropped — left the org; titles' embedded orgs kept over seed placeholders); `cplItem()` lead now resolves `raciFor → R→A→pr.lead` + `saveRaci` fires `cpl-raci-updated`; **nudge is now opt-OUT-gated** (`itemNudgeRecipients()` drops `nudge===false` members — fixed wrongful nudges firing for unchecked members); **sortable matrix + directory columns** (click-to-sort; the tree flattens on sort with a `⤺ tree view` restore). **Session 81 (StarFarout) added** (PR #574): the per-item 📣 nudge now shows on EVERY matrix row when signed in (nudge just one item; opt-out still enforced in `itemNudgeRecipients`), the filter-bar bulk button was renamed **"📣 Nudge for updates" → "📣 Nudge All"**, and a 📣 Nudge button now sits on every Activity / sub-activity / project CARD (the generator emits a `cpl_nudge_focus` deep-link beside the existing 📝/👥; a new `consumePendingFocus` `NUDGE_KEY` branch → `openItemNudge` — affordance-visibility-vs-eligibility, `docs/kb-notes/methodology-affordance-visibility-vs-action-eligibility.md`). Tests: `tests/card_raci.test.js` (23), `tests/raci_sortable.test.js` (13), `tests/raci_nudge_optout.test.js` (rewritten), `tests/raci_card_nudge.test.js` (new). |
| `card_raci.js` | **Live card-Lead + RACI-roster overlay** (added Session 79, StarBender). Static, read-only, anon-Supabase (the `card_updates.js` pattern): the generator stamps a `<span class="cpl-raci-lead" data-raci-key="activity:N\|project:<id>">` (seeded with the old `projects.lead` as fallback) + a `data-raci-key` on each 👥 RACI affordance; the overlay fetches `item_raci` and (1) rewrites each card's **Lead** to the resolved **Responsible → Accountable → old-lead**, (2) builds a **hover roster** tooltip (R/A/C/I names) on the 👥 button. Listens to `cpl-tab-activated` + `cpl-raci-updated`. Exports `leadNames`/`byKey`/`rosterHtml`/`roleNames`/`escapeHtml`. STATIC, NOT a daily-cron artifact; `<script>`-loaded in BOTH HTMLs (Rule 4). Tests: `tests/card_raci.test.js` (23). Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `card_updates.js` | **Live card-update overlay** (`window.CPL_CARD_UPDATES`, added Session 78). Read-only: fetches the newest `item_updates` row per `item_type:item_id` (anon Supabase read) and overlays it — body + timestamp + author — onto each Activity / sub-activity / project card via a generator-stamped `<div class="cpl-live-update" data-update-key="activity:N|project:<id>">` hook, hiding that card's creation-era `.cpl-static-update` line when a live update exists. Closes the gap where a 📝 update posted on the RACI tab showed there but not on the card face. Runs on load + on `cpl-tab-activated` (activities-projects/dashboard). STATIC, no auth, NOT a daily-cron artifact; `<script>`-loaded in BOTH HTMLs (Rule 4). The hooks + the sub-activity cards' 📝/👥 deep-links are emitted by `excel_to_dashboard.py` (regenerated sections). Tests: `tests/card_updates.test.js`. Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `card_actions.js` | **Card action opener** (`window.CPL_CARD_ACTIONS`, added Session 83). Static, globally-loaded, no auth of its own. Makes the Activity/Project cards' **📝 Update / 📣 Nudge** affordances open the popup **IN PLACE** instead of bouncing to `#raci` (Sam: "none of this should direct the user to RACI, rather to the Activity and Project tab"): a delegated click interceptor on `.update-link`/`.nudge-link` (+ `.act-*`) reads the item key from the link's inline `onclick`, cancels the `#raci` navigation, lazy-loads `raci.js` via the idempotent `CPL_TABS.loadScript`, and calls `raci.js`'s `openCardUpdate`/`openCardNudge` (which ensure data+CSS loaded then open the existing composer/nudge). Also consumes the nudge-email `?update=`/`?nudge=` deep-link on ANY tab at boot + strips the param (the email now lands on `#activities-projects`). No generator change → works on already-deployed cards. `<script>`-loaded in BOTH HTMLs (Rule 4). Tests: `tests/card_actions.test.js` (15). Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `annual_report.js` | **Annual Report tab** renderer (`window.CPL_ANNUAL_REPORT`, `#annual-report`). Lazy-loaded on first open; injects own `var(--token)` CSS. Assembles a 6-section report draft from live `window.CPL_DATA` each open — Exec Summary · Vision 2030 & Goals · Activity Progress (the 4) · Statewide Impact · Spotlights (Veteran Sprint / Military Base) · Looking Ahead — EDITABLE in place (textarea) with a live markdown preview; toolbar = ↻ Rebuild from data · ✨ AI polish (reuses `CPL_REPORT_PROXY_URL`; disabled if unset) · ⬇ Word (`docx.min.js`) · 🖨 Print. Content is creation-era until `item_updates` is surfaced into it (next). Static — NOT a daily-cron artifact. Tests: `tests/annual_report.test.js` (29). Added Session 77 (StarPort), PR #557. Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `mission_control.js` | **Mission Control** — the "Lift Off" program tracker (`window.CPL_MISSION_CONTROL`, added Session 83). A self-contained **read-only-by-default overlay** (the `card_updates.js` pattern) that renders `kb/liftoff_plan.json` ⊕ a Supabase `liftoff_state` overlay as a **collapsible `<details>` block mounted BELOW the RACI functions** in the Team & RACI tab (mounts on `cpl-tab-activated` when `tab==='raci'`; inserts `#mission-control-root` after `#raci-root`; injects own `var(--token)` CSS; never touches `raci.js`). The plan is **phases (Now/Next/Later) of `task` + `decision` nodes** — a `decision` FORKS the work (an option `activates` its branch tasks + `archives` the others; the choice doubles as the human decision log). Anonymous = read-only; a signed-in/team-phrase user sets task status (`setStatus`) + picks decision branches (`setChoice`) — optimistic write + rollback, upsert to `liftoff_state`. **Forward-only** (PII-incident items dropped — handled long ago). Static — NOT a daily-cron artifact; nav/boot mirrored in BOTH HTMLs (Rule 4). Schema: `mission/supabase_liftoff_state.sql`. Tests: `tests/mission_control.test.js` (32). Docs: `docs/mission_control_lessons.md` + `docs/co_platform_strategy.md`. |
| `project_lifecycle.js` | **Project soft-delete overlay** (`window.CPL_PROJECT_LIFECYCLE`, added Session 84). Lets a reviewer / team-phrase user **Table** (pause) or **Archive** (close) a project on the Activities & Projects cards — it leaves the active grid + every `CPL_DATA` consumer (RACI matrix, Annual Report, custom reports, Workplan Goals ladder) and moves to a collapsed **"Tabled & Archived"** `<details>` section with the reason + date; **♻ Restore** reverses it. Never a hard delete. STATIC, anon-read overlay (the `card_updates.js` pattern) over Supabase **`public.project_lifecycle`** (write gated `is_allowed_reviewer() OR team_pass_ok()`); injects own CSS; reconciles drift since the last regen + provides the 🗄 Table/Archive + ♻ Restore controls. The generator bakes the last-known overlay (tabled cards render HIDDEN with `data-lifecycle`; the collapsed section; tabled ids excluded from `CPL_DATA.projects` + the Workplan Goals tables) and `kb/_load_projects.py:load_project_lifecycle()` folds it into the committed `kb/project_lifecycle.json` ledger (the "noted in the KB" record). `dashboard_filters.js` skips `[data-lifecycle]` cards. Script-loaded in BOTH HTMLs (Rule 4). **SCOPE — real work-item projects ONLY (Session 95):** the **activity layer** (the official 1.x–4.x sub-activities = `derive_core_activity_ids` minus the legacy `5.x` family) is **IMMUNE** — the generator scrubs overlay rows on those ids, the grid no longer renders duplicate cards for them (Activity-metrics card only — "no redundant activity or project cards", Sam 2026-07-02), and `project_lifecycle.js` `activityLayerIds()` + `raci.js` mirror the rule client-side. The modal closes only on a true backdrop click (the capture-walk bug that made Archive unpickable is fixed). Schema: `kb/supabase_project_lifecycle.sql`. Tests: `tests/project_lifecycle.test.js` (42). Docs: `docs/project_lifecycle_lessons.md` + `docs/kb-notes/playbook-soft-delete-generated-entity-via-overlay.md`. |
| `project_add.js` | **Add Project** (`window.CPL_PROJECT_ADD`, added Session 95). "＋ Add project" button beside the Projects (N) header (Activities & Projects) and in the AWG Projects section header (`#awgProjectsAddSlot`); modal form INSERTs `public.projects` — ID auto-suggested as the next free `5.N` from the LIVE id list (tabled rows can't collide), Name/Description/Activity/CPL Goal/Lead/Status/Timeline. Auth = reviewer magic-link OR team phrase (`x-team-pass`; `projects` INSERT/UPDATE widened to `is_allowed_reviewer() OR team_pass_ok()` — migration `projects_write_team_phrase_widen`, schema `kb/supabase_projects_rls_tighten.sql`; DELETE stays reviewer-only). Refresh-before-write, duplicate-id guard, escaped optimistic card, backdrop-only modal close. New rows render fully on the next daily rebuild. STATIC, `<script>` in BOTH HTMLs (Rule 4). Tests: `tests/project_add.test.js` (24). Docs: `docs/project_lifecycle_lessons.md` (S95 continued). |
| `map_users.js` | **MAP Users tab** renderer (`window.CPL_MAP_USERS_TAB`, `#map-users`, added Session 87). Lazy-loaded; injects own CSS. Manages the MAP platform's per-college user roster (MAP "College Users & Roles" — STAFF PII). **DEFAULT public view** = per-college user **counts + the 7-way RoleName mix** + "data as of", from the anon `map_users_summary()` RPC (no PII). **Roster drawer** (👥) reveals names/emails — read with the shared `cpl_sb` reviewer token / `cpl_team_pass` header, **gated server-side** by `map_college_users` RLS (logged-out → no rows → a sign-in gate). **📣 nudge** (signed-in only) opens a **recipient PICKER** (all pre-checked, uncheck anyone) then a pre-filled `mailto:` — nothing auto-sent (the RACI-nudge pattern). Recipients = Primary Contact + VPAA (VP Instruction) + VPSS (VP Student Services) + **CEO** (Session-87 follow-up) from the gated `map_college_contacts`; the draft also (a) links the college to **their own MAP CPL dashboard** (`landing_page_url`, joined in the sync from `chatbox_college_profiles`) and (b) embeds the **college's own user roster** as a Check-All **checklist** (drop a departed staffer before sending → `rosterEmailBlock`) so leadership sees their CPL people. A **last-nudged log** (`map_college_nudges`) stamps "last nudged &lt;date&gt; by &lt;who&gt;" per row. All output HTML-escaped. STATIC, lazy, NOT a daily-cron artifact; nav/pane/boot in BOTH HTMLs (Rule 4). Data synced by `map/sync_map_users.py` + `.github/workflows/map-users-sync.yml` (dispatch + monthly cron; runner-as-proxy to the egress-blocked MAP API; service-key writes; PII never committed). Schema: `map/supabase_map_users.sql` + `map/supabase_map_contacts.sql`. **Session 88** wired the 3 new Custom Report fields (value-signature confirmed): `UserStatus` ∈ {Active, Inactive} → a public **`(N active)`** count per college (`map_users_summary().active_count`); `UserDisciplines` + `LastUpdatedOn` → **reviewer-gated roster columns** (Status badge · Disciplines · Last-updated), never the public aggregate (`statusBadge`/`discCell`). Tests: `tests/map_users.test.js` (70). Scope/story: `docs/map_users_tab_scope.md` + `docs/cobi_lessons.md` (S87–88). |

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

- **UI**: Modal with a **Report Type toggle** (⚡ audience narrative / 📋 Master
  data report — the Master Report was consolidated INTO this modal in Session 97;
  its filter-bar button is retired), audience picker (each audience carries a
  document `title` stamped by the docx template — the model is told NOT to write
  its own), the **Elevation slider** (0→30,000 ft; bands in `ELEVATION_BANDS` map
  to detail/length guidance + a structure swap at >20k ft; persisted per-browser
  in `cplReportElevation.v1`), checkbox tree, and a staged **progress bar**
  (replaces the old "Generating..." label; time-based creep during the API call).
- **Backend**: POSTs to Cloudflare Worker → Anthropic API
- **Model**: `claude-sonnet-4-5` (unversioned alias — never re-pin a dated
  snapshot; `college_report_generator.js` + `annual_report.js` de-pinned too)
- **Naming**: every prompt carries `NAMING_RULE` (CPL Initiative / Mapping
  Articulated Pathways (MAP) platform; "Military Articulation Platform" is
  history-only — see Naming & terminology)
- **Output**: in-browser preview or downloadable .docx (via local `docx.min.js`)
- **Config**: `window.CPL_REPORT_PROXY_URL` set in HTML before
  `report_generator.js` loads
- **Live data (Session 96):** at Generate time the prompt is built from the
  LIVE overlays, not the build-time bake — newest `item_updates` per
  activity/project (RACI 📝 composer) folded into each selected project's
  Latest Update, RACI Responsible→Accountable as the Lead, and an
  activity-level updates block. The **Master Report** button opens the same
  checkbox tree via `master_report.js` (§2) and builds its docx client-side
  from the same live overlay.

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
| `activities-projects` | Activities (renamed Session 97; = activities + projects) | Workplan Activity Metrics, Filter Bar, Projects Grid (the `#workplanProjectsWrapper` collapsible — see §6b). **Added 2026-05-31, PR #206.** **Session 95: the grid holds only real work-item projects** (4.1.x + 5.x) — sub-activities render as Activity cards only, and are IMMUNE to Table/Archive; the Path-to-2030 charts moved to CPL Analytics (Dashboard tab). |
| `workplan-goals` | Annual Workplan Goals | The 5-year goals + stretch + current table, **plus the Projects section (Session 95)** — the real work-item projects (4.1.x sprint children + 5.x) in a compact table (live RACI lead via `card_raci.js`), with a ＋ Add-project button (`project_add.js`) |
| `budget` | Budget | CPL Budget & Expenditure Plan |
| `implementation-funding` | Implementation Funding | CPL Implementation Funding model (DRAFT-chipped), **Chancellor-facing scenario tool (Session 2, 2026-07-03)** — a **2-year selectable window** (year dropdowns), **year-specific priorities** (Year 1 / Year 2 filter, editable metric/description/share/target), a **noncredit-feeder carve-out** (NOCE / SD Cont. Ed / Mt. SAC NC / Calbright, headcount-split), 115 colleges' potential allocations, and **P2/P3 actuals vs target** from the daily `cpl_funding_performance.js` (P1 = deliberate incentive gap). Edits layer **per-browser what-if ⊕ shared Supabase config (team-phrase editable, `cpl_funding_config`) ⊕ baked defaults**. **Session 3 (2026-07-06) equity refinements:** front-load-Year-1 disbursement toggle (+ carryover/close-out), $150K minimum-viable floor (waterfall within the pool), the rural performance allowance ($1M carve-out, RCTC DRAFT roster, ≥50% of Yr-1 targets), and baseline-eligibility badges (CPL Coordinator live from MAP + Sept-1 opt-in registry — informational, dollars unchanged). Shell static; renders from `cpl_funding.js` + `cpl_funding_data.js` (lazy; data static, actuals cron). **Built 2026-06-11, PRs #352–#368; reworked 2026-07-03** — `docs/cpl_funding_lessons.md`. |
| `vision-2030` | Vision 2030 | Vision 2030 Alignment cards with live progress |
| `annual-report` | Annual Report | Capstone — assembles a 6-section CPL Annual Report draft from live `CPL_DATA` (Exec Summary · Vision 2030 & Goals · Activity Progress · Statewide Impact · Spotlights · Looking Ahead), editable + live preview + ✨AI polish / ⬇Word / 🖨Print. Renderer `annual_report.js` (static, lazy). **Added Session 77 (StarPort), PR #557.** |
| `knowledge-base` | Knowledge Base | Sign-in-gated **KB Portal** — an `<iframe src="kb-portal/">` (like Letters) over the public CPL Knowledge Base: a magic-link-gated reader + a **New-doc composer** (draft/upload → Claude polish → tokenless GitHub commit). The bundle's own Supabase auth is the gate. **Added Session 63, PRs #464/#465/#467/#468.** **Session 86 added shared-team-phrase access** (PR #610) — an alternative to the magic link: the SAME `cpl_team_pass` as the Team & RACI tab, validated server-side against the MAIN project's `team_pass_ok()` RPC (carries over via same-origin localStorage; unlocks the reader + the composer). `kb-portal/config.js` (`TEAM_SUPABASE_*` consts) + `app.js`. Docs: `docs/kb_portal_lessons.md` + `docs/cobi_lessons.md` (S86). |
| `cpl-news` | CPL News | **Auto-curated** CPL news feed (CA-first, then national; + adjacent systems Career Passport / CA Master Plan / workforce-upskilling + CA budget items). Live-reads `public.cpl_news` (filled daily by the `cpl-news-harvest` Edge Function); filters, suggest-a-story (the path closed socials enter), reviewer feature/hide. Renderer `cpl_news.js` (static, lazy). **Added Session 67 (Skywatch), PR #481.** Docs: `docs/cpl_news_lessons.md`. |
| `raci` | Team & RACI | Ownership spine for the workplan — a **3-tier RACI Matrix** (Activity → sub-activity → project/work item, each RACI-able × R/A/C/I) + an editable **Team Directory** + per-member update-**nudge** toggle, over Supabase `team_members` + `item_raci` (public read, reviewer write). Matrix has a **hierarchical scope filter** (Activity / sub-activity optgroups) + per-card **`👥 RACI` deep-links** (Session 76). Renderer `raci.js` (static, lazy). **Added Session 75 (SkyMaster), PRs #546–#548; nav PR #550 + 3-tier PR #553 (Session 76).** Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `map-users` | MAP Users | Manage the MAP platform's per-college **user roster** (MAP "College Users & Roles", staff PII) + a per-college refresh **nudge**. Public view = counts + role mix (anon `map_users_summary()`); roster (names/emails) reviewer/team-phrase-gated; 📣 nudge = mailto to Primary Contact + VPAA + VPSS. Renderer `map_users.js` (static, lazy). Gated Supabase `map_college_users` + `map_college_contacts`, synced by `map/sync_map_users.py` (`map-users-sync.yml`). **Added Session 87 (StarMax), PRs #618–#621.** Scope: `docs/map_users_tab_scope.md`. |
| `sierra-training` | Sierra Training | **Team-only** improvement loop for Sierra (Phases 1+2 of `docs/sierra_training_tab_scope.md`): the 👍/👎 **feedback queue** (`sierra_feedback`, triage `new→triaged→addressed` via the `sierra_feedback_set_status` RPC; **Session 94 P1**: 🧪 Test-in-Sierra prefill handoff → `#chatbot`, ⧉ copy, 24h/7d/30d date filters, bulk triage, and a per-row **chat-turn telemetry link** — similarity/topic-match/gap chips) + a **gap miner** over `chat_interactions` (low-similarity turns, punt-signature answers, recurring themes, audience slice) + the **🧭 GUIDANCE pane** (Session 94 Phase 2 — author short directives in `sierra_guidance`; cpl-chat v26 appends the newest 10 active to every prompt INCLUDING the production widget; deactivate, never delete; honest "sent / beyond top-10" chips). Renderer `sierra_training.js` (static, lazy, the `map_users.js` pattern); reviewer/team-phrase gated server-side by RLS — logged out sees only the sign-in gate. NEVER writes to the public KB (curation pipeline only). **Added Session 93 (SkyReach); P1+P2 Session 94 (SkySierra, #650/#651).** Tests: `tests/sierra_training.test.js` (38) + `tests/sierra_training_p1.test.js` (26) + `tests/sierra_guidance.test.js` (23). |

**Not a tab, but launched from the rail:** the **public CPL Fact Sheet**
(`fact-sheet/`, §2 File Inventory) is reached by a `📄 CPL Fact Sheet ↗` anchor at
the bottom of the nav rail — an `<a class="cpl-tab cpl-tab-external">` with **no
`data-tab`**, so `tabs.js` (which derives tabs from `.cpl-tab[data-tab]`) ignores
it and it opens the standalone page in a new tab. Mirrored in both HTMLs (Rule 4).
Added Session 74. **Session 89 added a second such rail launcher — `Ask Sierra ↗`
→ the standalone `sierra/` chat page** (chat-first, multi-turn Sierra, shareable
externally without the internal tabs; served by the lean Pages deploy; PR #633).
**Session 94 (SkySierra, #649) replaced its 🏔️ emoji with the Sierra mark** — the
Whitney ridge in a navy roundel as an inline SVG (both HTMLs, Rule 4); the same
`SIERRA_MARK` roundel is now the chat avatar in `sierra/sierra.js`, `cpl_chat.js`
(was 🎓), and `fact-sheet/factsheet_sierra.js`.
**Session 90 (SkySherpa) rebranded that page's header** (PRs #635/#636/#637): the
🏔️ emoji → the official **CPL Initiative logo** (`sierra/cpl-initiative-logo.png`,
white/transparent), a hand-traced **Mt Whitney ridge ghosted behind the "Sierra"
wordmark** (`sierra/whitney-mark.svg` — single white stroke + snowcap, 34% opacity,
flat base on the text baseline), and the tagline **"Your CPL Sherpa"**. Static
files under `sierra/` — no Rule-4 mirror, not a daily-cron artifact. Story:
`docs/cpl_assistant_lessons.md` (Session 90).

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
- Live now: **v27 ACTIVE** (2026-07-02, the Sierra vendor lane — the **fail-open
  external contacts gate**: an opt-in body field **`ctx:"external"`** makes
  `buildCollegeContext` omit the college staff `CPL Contact: name (email)` line,
  so external/vendor embeds never broadcast staff contacts (contacts are
  reviewer-gated elsewhere — `map_college_contacts`; Sierra quoting them
  publicly was the outlier). Absent/unknown `ctx` = byte-identical prior
  behavior — COBI tab / standalone page / Fact Sheet / production widget all
  unchanged (the third opt-in field on the v17-`history` / v22-`audience`
  convention). `sierra/?ctx=external` passes it through for iframe embeds
  (`tests/sierra_ctx.test.js`); **smoke mode 14a/b** asserts both directions on
  the San Diego Mesa anchor. Fail-closed flip (default-suppress, internal
  surfaces opt in) parked on the guardrails backlog. Vendor docs:
  `docs/sierra_integration_guide.md`.). Prior: **v26** (Session 94, SkySierra — the **team-guidance layer**:
  `fetchTeamGuidance()` joins the parallel fan-out and appends the newest **10
  ACTIVE `sierra_guidance` rules** (~2,500-char cap, fails soft) as a TEAM
  GUIDANCE block that wins on conflict — the Training tab's 🧭 pane is the
  same-minute tuning knob, no redeploy; schema of record
  `chatbox/supabase_sierra_guidance.sql`. ⚠ the MCP `deploy_edge_function` tool
  **silently defaults `verify_jwt` to TRUE** — v25 briefly carried it; v26 =
  identical code (same sha) with `false` restored. **Always pass
  `verify_jwt:false` explicitly.**). Prior: **v24** (Session 93, SkyReach — the CPR retrieval miss: the
  `search_exhibits_by_topic` RPC ranked by `rec_count DESC` with NO relevance
  ranking, so the 76% of exhibits with `rec_count=1` were unfindable whenever a
  query matched >200 rows; migration `search_exhibits_by_topic_relevance_rank`
  re-ranks by `ts_rank_cd` over a title-A/discipline-B weighted vector
  (cpl_type/collaborative_type REMOVED from the searched text — "certs" was
  matching every Industry-Certification row), schema of record now committed at
  `chatbox/supabase_search_exhibits_by_topic.sql`; v24 also adds the CPR/First-Aid
  synonym family + meta words (check/again/already/exist/map/colleges) to
  `TOPIC_STOP_WORDS` so continuation turns fold the prior topic per v18; smoke
  mode 13 guards it. Story: `docs/cpl_assistant_lessons.md` Session 93). Prior:
  **v23** (Session 92, StarLab) adds `LANDING_PAGE_RULE`:
  a college with no CPL Landing Page URL in context → never invent a link; say the
  page isn't configured yet + suggest asking the college to set it up + offer
  MAP@rccd.edu. **v22** (same session) — the **audience-aware voice**: an
  optional `audience` body field (validated against `AUDIENCE_RULES` keys
  student/faculty/administrator/employer/civic) appends a per-population tone/content
  rule to the system prompt — the student rule bans system inside-baseball; absent or
  unknown → default voice, production widget untouched; `audience` also logs to
  `chat_interactions`. Prior: **v21** (Session 89 added the **COCI offerings catalog** lookup —
  Sierra now sees what each college *teaches*, not only earned exhibits; see the
  offerings bullet at the end of this section + §8. **v21** fixed a preflight-found
  false-negative — a query naming several colleges detected only the first, so the
  80-row offerings cap dropped another named college and the model wrongly said it
  "doesn't teach" the subject; v21 raises the cap to 150 + forbids asserting absence
  from the top-N list). There's also a **standalone shareable Sierra page** at
  `sierra/` (chat-first, multi-turn, no internal nav — the fact-sheet/kb-portal
  pattern; `sierra/sierra.js`, launched from the COBI rail, PR #633). Prior: model `claude-sonnet-4-6`; v15→v19 = the Session-73
  response-logic tuning below — v16/v17 the three tweaks, **v18 the multi-turn
  retrieval-fold** (a place-only refinement like "How about West LA?" folds the
  whole recent conversation's topic into the search via `REFINE_NOISE` +
  `ownTopic.length < 2`), **v19 the ambiguous-college-detection fix** (the ACTUAL
  West-LA bug: `ilike '%west%'` matched 5 colleges → an array → the router fell to
  college-only mode and DISCARDED the topic results, so West LA's real-estate
  exhibit was never surfaced; v19 narrows an ambiguous array to the matched
  college that has topic hits + adds a `west la` alias). v15 = v14 + the model swap from the retired
  `claude-sonnet-4-20250514` snapshot, Session 64 PR #471; v14 added
  `https://cpl-initiative.github.io` to `ALLOWED_ORIGINS`). **Use unversioned model
  aliases here, not dated snapshots** — a pinned `claude-*-YYYYMMDD` is a latent
  outage on its retirement date (`docs/kb-notes/playbook-edge-function-502-retired-model.md`).
- **Response-logic conventions (tuned ongoing — `docs/cpl_assistant_lessons.md`).**
  Answer *wording/behavior* is tuned by editing the system prompt + context builders
  in `index.ts`, redeploying, and re-smoke-testing — a recurring activity (Sam:
  "we'll be honing the logic for some time to come"). Standing rules baked into v17:
  ① **Statewide ≠ one college** — Statewide Collaborative (CCC) standards are
  system-wide; present them as available statewide and route the visitor to *their
  own* college's landing page, never one college's page (`STATEWIDE_RULE` +
  dedupe-by-title in `buildTopicContext`; the durable fact is
  [`docs/kb-notes/reference-statewide-credit-recommendations.md`](docs/kb-notes/reference-statewide-credit-recommendations.md)).
  ② **List course titles + units, never a bare "N credit recs"** (`CREDIT_LIST_RULE`
  + `Eligible courses (title — units/credit)` lines). ③ **Ask a focusing follow-up
  before dumping a big list** (`FOLLOWUP_RULE`), gated on the **client opting into
  multi-turn** by sending a `history` field — `multiTurn = Array.isArray(history)`,
  NOT `history.length` (the ask must be able to fire on the *first* broad question).
  Cross-cutting rules go in a **module-level const appended to every mode's prompt**,
  not inlined per-mode. `cpl_chat.js` sends `history`; the production widget omits it
  and stays single-turn (backward-compatible — never regress that).
- **Smoke-test on a RUNNER, not the sandbox.** `*.supabase.co` is egress-blocked
  (org policy → 403 at the agent proxy), so you can't curl the function locally.
  `chatbox/smoke_test.sh` + `.github/workflows/cpl-chat-smoke.yml` run all 4 modes +
  a multi-turn follow-up on a GitHub Actions runner (push the script → read the
  Actions log). Re-run after every redeploy.
- **Heading toward "Sierra" + the CPL Student Portal.** Sam: the assistant will be
  named **Sierra** and embedded in the upcoming **CPL Student Portal** (students
  assemble a prior-learning portfolio + document storage + statewide
  get/request-CPL recommendations). Not wired now; the multi-turn plumbing (v17) is
  the foundation. The **Sierra rename** (base-prompt persona — currently still "You
  are the CPL Chatbox" — + the tab avatar/intro/name chip) lands WITH the Portal,
  not piecemeal. Keep `cpl_chat.js` self-contained behind its CONFIG block (it's the
  embed unit).
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

- **Audience selector + 👍/👎 feedback (added Session 92, 2026-07-01).** Both
  first-party surfaces (`cpl_chat.js` tab + `sierra/` page) now REQUIRE a
  single-select **primary-population pick** before the first send (5 chips:
  student / faculty / administrator / employer / civic; persisted per-browser in
  the SHARED same-origin key **`cplSierraAudience.v1`**; sent as the optional
  `audience` body field that v22 turns into per-audience response rules — the
  driving case: students never get system inside-baseball). Every completed
  answer gets a **👍/👎 + optional note** bar that UPSERTs (client-uuid
  `turn_id`) via the SECURITY DEFINER RPC **`sierra_feedback_upsert`** into
  **`sierra_feedback`** with the audience + page + Q/A snapshot — the RPC is
  the only public write path (a direct PostgREST upsert would trip RLS: ON
  CONFLICT needs SELECT visibility, which anon lacks); reviewer/team-phrase
  SELECT (the future Sierra-Training review queue; `chat_interactions` gained
  the same reviewer SELECT for log-informed gap mining). The production map.rccd.edu widget sends neither field —
  unaffected. Schema: `chatbox/supabase_sierra_feedback.sql`; scope +
  Training-tab recommendation: `docs/sierra_training_tab_scope.md`; tests:
  `tests/sierra_page.test.js` + `tests/cpl_chat_audience.test.js`; smoke modes
  10–12.

- **College landing-page links (added Session 73, 2026-06-25).** The assistant
  surfaces each college's CPL landing page from
  **`chatbox_college_profiles.landing_page_url`** (the `cpl-chat` function joins
  it on the college name, LIVE). Kept fresh by
  **`chatbox/scrape_landing_pages.py`** + **`.github/workflows/cpl-landing-pages.yml`**
  (push = dry-run, weekly cron + dispatch = `--apply`). **Source = the MAP
  College Landing Page API** (`POST .../api/mapcollegelanding/GetData {}` → full
  `{College, CollegeLandingURL}` list — the same one the public page's script
  calls; no auth). We rewrite the old base `map.rccd.edu/cpl-student-portal/<code>`
  → **`cpldashboardcccco.azurewebsites.net/<code>`** (path-encoded) and store
  that — the exact link the official page's buttons use, which Sam verified work.
  Runs on a runner because the Azure API host is egress-blocked from the agent
  sandbox (a plain JSON POST — no browser/WAF). **Pitfall:** the page ALSO embeds
  a STALE inline `mapfyCollegeUrls` blob (2025-08-18, wrong codes like Allan
  Hancock=`test`); the first build scraped that by mistake — use the API, not the
  page HTML. 2 source-side data errors (Cerritos=`www.cerritos.edu`, East
  LA=`elac.edu`) are mirrored + flagged. **Editing the `cpl-chat` function does
  NOT touch these links** (they're table data, not code). **⚠ INTERIM:** Sam is
  adding these URLs to the MAP Custom Report → when that lands, retire the scraper
  + workflow and source from the Custom Report. Story:
  `docs/cpl_landing_pages_lessons.md`.

- **COCI offerings catalog — what each college TEACHES (added Session 89, v20).**
  The function gained a **5th parallel lookup** `searchCollegeOfferings()` →
  `search_college_offerings` RPC over the new **`coci_college_offerings`** table
  (16k `college × TOP-program` rollups; relevance-ranked with TOP-title weighted A
  over the course-title blob D). `buildOfferingsContext()` distinguishes a
  **core-discipline** match (query keyword in the TOP-program title) from a
  tangential one, and ranks **nearby** colleges (same county > region, via
  `fetchCollegeGeo()`/`college_geo`). The `OFFERINGS_RULE` prompt turns this into
  adoption reasoning: *teaches-but-no-exhibit → adoption opportunity; doesn't-teach
  → nearest teaching college; peers who already articulated = proof; never claim an
  articulation from a taught course alone.* This is what lets Sierra answer the
  Boys-&-Girls-Club / NCCER case (LA Harbor teaches 0 construction-crafts → route to
  El Camino/Trade-Tech/Rio Hondo, cite Norco/Barstow's existing NCCER). It's the
  **offerings slice of the CCR/CER ETL** (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`);
  the CER credential + adoption-leverage layers are the next wire. Builder
  `chatbox/build_coci_offerings.py` + geo `chatbox/_seed_college_geo.py` + runner
  sync `chatbox/sync_coci_offerings.py` (`coci-offerings-sync.yml`). Smoke modes 7–8.
  Story: `docs/cpl_assistant_lessons.md` (Session 89).

- **Vendor-integration doc set (added 2026-07-02).** Sam is integrating Sierra
  into a vendor-built platform; three vendor-facing docs cover it:
  [`docs/sierra_technical_reference.md`](docs/sierra_technical_reference.md)
  (how Sierra is built — full API contract, pipeline, data layer, ops),
  [`docs/sierra_integration_analysis.md`](docs/sierra_integration_analysis.md)
  (benefits/risks/challenges + the pre-launch preconditions checklist — cost
  breaker + durable rate limit before a native embed scales), and
  [`docs/sierra_integration_guide.md`](docs/sierra_integration_guide.md) (the
  implementation plan: link / iframe / native-API / server-proxy paths; iframe
  of `sierra/` needs NO backend change; a native embed = one-line
  `ALLOWED_ORIGINS` add + playbook redeploy). Keep these in sync with future
  `cpl-chat` contract changes.

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
- Auto-match is **C-ID-exact only** (course C-ID == slot C-ID/alt); never
  title-guessed. C-ID coverage is the UNION of COCI's `CIDNumber` **and** the
  official c-id.net authority (`cid_articulations.json`, Session 90), and since
  **Session 92 (#642) every c-id.net approval lands via a join ladder** with
  graded provenance — hard `✓ aligned` / title-inferred `tcid[]` `≈ verify` /
  synthesized `per c-id.net` rows (course absent from our COCI extract) — so a
  blank slot now means the college genuinely holds no approval. A course can
  carry multiple C-IDs (`{cid}∪xcid∪tcid`); `autoMatch` prefers hard > title >
  synth carriers and used-tracks to avoid filling two slots with one course. No
  contact-hours in COCI → legitimacy = units + C-ID for now (the confidence-score
  data map: `docs/kb-notes/reference-tmc-confidence-data-requirements.md`).
- **"OR" alternatives (Session 90).** A slot can be one requirement satisfiable by
  one of several C-IDs (the template's "X **OR** Y" — distinct from a "Select N"
  *section*). Modeled as `slot.alts[]`; the left side renders "X or Y" and
  auto-match accepts any of `{cid}∪alts`. Source = the curated `tmc_or_groups.json`
  overlay (visual-PDF-read + verified), folded by the parser. See §7d file
  inventory + `docs/kb-notes/reference-tmc-adt-data-model.md`.
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
- **`projects` writes (Session 95):** INSERT/UPDATE gated `is_allowed_reviewer() OR team_pass_ok()` (widened for the `project_add.js` Add-project flow, migration `projects_write_team_phrase_widen`); DELETE reviewer-only; public SELECT. Schema of record: `kb/supabase_projects_rls_tighten.sql`.
- **Team-phrase widening Phase 1 (2026-07-03, migrations `team_phrase_widen_p1`
  + `team_phrase_widen_p1_associations`;
  plan: [`docs/team_phrase_expansion_plan.md`](docs/team_phrase_expansion_plan.md)):**
  `workplan_goals`, `budget_funding`, `budget_expenditures`, `personnel`
  INSERT/UPDATE + `tmc_curator_notes` write/update (recreated for
  anon+authenticated) are now gated `is_allowed_reviewer() OR team_pass_ok()`;
  DELETEs stay reviewer-only **except the documented
  `workplan_activity_associations` exception** — waa INSERT/UPDATE/**DELETE**
  all widened, because it's a reversible join table where DELETE is the
  popover's un-check action (rationale + SQL:
  `kb/supabase_activity_associations_add_primary.sql` appendix; pinned in
  `tests/team_phrase_p1.test.js`). Phase 2 (kb_curation + `team:<name>` stamp,
  which also moves `tmc_curator_notes.reviewer_email` attribution server-side)
  is authored-not-executed; reviewer-only forever: `tmc_review_submission`,
  `team_access` manage, `projects` DELETE; Fact Sheet Curate held.
- **`workplan_goals.current`** (numeric, added Session 85): the manual "Current"
  value for the Annual Workplan tab — used ONLY for sub-activities NOT mapped to a
  live headline KPI (`PID_TO_KPI_KEY`); read on the **GOAL** row (canonical).
  Mapped sub-activities source Current from the live scrape and ignore it. Edited
  in the tab via `workplan_goals.js` (PATCH on the GOAL row); reviewer-gated
  (`is_allowed_reviewer()`). Titles in the same tab PATCH **`projects.name`** (the
  single authoritative title store). See `docs/annual_workplan_authoritative_lessons.md`.
- **`tmc_submissions`** (added Session 59; **CO-review states Session 92**): TMC
  Builder's per-college course→TMC alignment store. Anon INSERT/UPDATE/SELECT RLS
  (institutional curriculum data, **no student PII**), `(college, tmc_id)` unique →
  upsert/resume; the anon write policies now carry **WITH CHECK (status in
  draft|submitted)** — the college flow stays no-login, but **approved/returned +
  the review receipts (`review_note`/`reviewed_by`/`reviewed_at`) are SERVER-GATED**:
  set only by the `tmc_review_submission(college, tmc_id, status, note)` SECURITY
  DEFINER RPC (`is_allowed_reviewer()`, `reviewed_by` stamped from the JWT; the
  receipt columns are revoked from direct anon/authenticated writes — an approval
  is a CO authority claim, never forgeable with the public key). The alignments
  jsonb also carries per-slot `verdict`/`course_hours`/`course_units_entered`/
  `evidence`/`matched_cid` + `_readiness` (the CO queue's triage ranking).
  Schema: `tmc/supabase_tmc_submissions.sql`.
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
- **`sierra_feedback`** (added Session 92): the Sierra 👍/👎 + note store behind
  both chat surfaces. One row per assistant turn keyed by a client-uuid
  `turn_id`; the client UPSERTs (rating on thumb click, note/rating-switch
  updates the same row) via the **SECURITY DEFINER RPC `sierra_feedback_upsert`**
  — the ONLY public write path (a direct PostgREST upsert 401s: ON CONFLICT
  needs SELECT visibility, which anon deliberately lacks; the RPC also
  centralizes validation). Carries `page`, `audience`, and the Q/A snapshot.
  RLS: no anon table policies; SELECT gated `is_allowed_reviewer() OR
  team_pass_ok()` (the Sierra-Training review queue — **live since Session 93**,
  the `#sierra-training` tab). Same wave: `chat_interactions` gained
  an `audience` column + the same reviewer/team-phrase SELECT policy (was
  write-only) for log-informed gap mining. **Session 93 added the triage
  `status` column** (`new/triaged/addressed`, default `new`) + the SECURITY
  DEFINER RPC **`sierra_feedback_set_status`** (gated `is_allowed_reviewer()
  OR team_pass_ok()`; the only public write besides the upsert RPC — the rest
  of the row stays immutable to the public), migration
  `sierra_feedback_triage_status`. Schema:
  `chatbox/supabase_sierra_feedback.sql`.
- **`sierra_guidance`** (added Session 94, migration `sierra_guidance_layer`):
  the **team guidance layer** — short response directives (rule 3–500 chars +
  `active` flag + note + author) that cpl-chat **v26** appends to EVERY system
  prompt (newest 10 active, ~2,500-char cap, fails soft; the block header tells
  the model team guidance wins on conflict). Authored in the Training tab's 🧭
  pane. RLS: SELECT/INSERT/UPDATE gated `is_allowed_reviewer() OR
  team_pass_ok()`; **NO delete policy** — deactivate (`active=false`) instead,
  the table is its own audit trail; touch trigger keeps `created_at`/
  `created_by` immutable. ⚠ Guidance steers the **production map.rccd.edu
  widget too** — the write gate is the security boundary; never widen to anon.
  Schema of record: `chatbox/supabase_sierra_guidance.sql`.
- **`item_updates`** (added Session 77): the Update Log behind the RACI tab's 📝 braindump→CC
  composer. One row per status update on an Activity/sub-activity/project, keyed `(item_type, item_id)`
  like `item_raci`. Anon SELECT + **reviewer-gated** INSERT/UPDATE/DELETE (`is_allowed_reviewer()`).
  Was append-only/immutable; **reviewers gained EDIT + DELETE 2026-06-27 (SkyMap)** so a test/mistaken
  entry can be removed and a posted update corrected (an edit stamps `edited_at`; the composer history shows
  ✏️/🗑 per row, and deleting the last update reverts the card to its creation-era line). The single live
  source for both activity AND project card updates. Schema:
  `raci/supabase_raci.sql`. (A pre-existing project-only `update_log` table — id/project_id/update_text —
  is unrelated/vestigial; left untouched.) `team_members` also gained `last_nudged_at` + `last_response_at`
  (nudge accountability).
- **`factsheet_overrides`** (added Session 80): the Curate-editable overlay behind the standalone public
  **Fact Sheet** (`fact-sheet/factsheet_edit.js`). One row per editable box, keyed by the page's stable
  `block_key` → `{html, hidden, edited_by/at}` (+ `page` for forward-compat). Anon SELECT (the overlay is
  applied for every visitor); **reviewer-gated** write via `is_allowed_reviewer()` (same gate as
  `item_raci`/`item_updates`). The baked HTML in `index.html` is always the fallback — empty table = the
  page as authored. Reviewer HTML is allowlist-sanitized on the public render path. Schema:
  `fact-sheet/supabase_factsheet_overrides.sql`. **Session 81 added reserved
  `block_key` namespaces** (no schema change) so the same table also carries
  reviewer-**added** boxes (`<sid>|add|<kind>|<token>`), per-section drag
  **order** (`<sid>|__order`), and **images** (added `<sid>|img|<token>` / baked
  `<sid>|fig|<basename>`) — the overlay *materializes* the synthetic keys instead
  of matching a baked element (`docs/kb-notes/methodology-reserved-key-namespaces-on-overrides-table.md`).
- **`factsheet-images`** (Storage bucket, added Session 81): the image *bytes*
  behind the Fact Sheet Curate image layer (`factsheet_overrides` stores only the
  public URL). **Public read**, writes gated by `is_allowed_reviewer()` (same
  reviewer boundary as `factsheet_overrides`), 5 MB cap, raster MIME only. Schema:
  `fact-sheet/supabase_factsheet_images.sql` (applied live via the Supabase MCP).
- **`liftoff_state`** (added Session 83): the **Mission Control** overlay store
  (`mission_control.js`). One row per plan node id → `{status, chosen, note,
  updated_by, updated_at}`, overlaying the committed `kb/liftoff_plan.json` (the
  plan is the static fallback; an empty table = the plan as authored). Anon SELECT
  (the board renders for every viewer); writes gated by `is_allowed_reviewer() OR
  team_pass_ok()` (the shared team-phrase gate below). Schema:
  `mission/supabase_liftoff_state.sql` (applied live via the Supabase MCP).
- **`team_access`** + the **shared team-phrase gate** (added Session 83): a
  **lower-stakes alternative to per-person magic-link login** for editing the
  Team & RACI surface. `team_access(id, secret)` holds one shared phrase — RLS on,
  **NO anon policies** so the client can't read it; only the SECURITY DEFINER funcs
  see it. **`team_pass_ok()`** reads the **`x-team-pass` request header** (sent by
  `raci.js`/`mission_control.js` on writes when the phrase is unlocked) and compares
  via the revoked-from-public `team_pass_check(p)`. The `item_raci` / `team_members`
  / `item_updates` / `liftoff_state` write policies are widened to
  `is_allowed_reviewer() OR team_pass_ok()` — so the public anon key **alone** still
  can't write, and magic-link reviewers keep working. Server-enforced (the phrase is
  validated inside Postgres, not client-side). **Phrase is VALIDATED on entry
  (#598):** `raci.js` POSTs the anon-granted **`rpc/team_pass_ok`** (with the typed
  phrase as the `x-team-pass` header) before storing it, so a wrong phrase is
  rejected ("doesn't match") instead of being saved + silently 401ing on first save;
  a save that 401/403s on a stale (rotated) phrase drops it + reopens the entry box.
  **Reviewer-manage (#598):** a magic-link reviewer (NOT a team-phrase user) gets a
  **⚙ Manage team phrase** admin in the RACI auth bar to view/change the secret —
  backed by reviewer-only **`ta_select`/`ta_update`** RLS policies (the anon role
  still has NO policy, so the public can't read it). Rotate via that admin or
  `update public.team_access set secret='…' where id='raci';` (temp `cpl-team-2026`).
  Schema documented in `raci/supabase_raci.sql`; pattern:
  `docs/kb-notes/methodology-server-enforced-shared-password-gate.md`.
- **`project_lifecycle`** (added Session 84): the **project soft-delete** overlay
  (`project_lifecycle.js`). One row per project a reviewer has **Tabled** (paused)
  or **Archived** (closed) — `(project_id pk, state ∈ tabled|archived, reason,
  updated_by, updated_at)`; **absence of a row = active**. Anon SELECT (the overlay
  applies for everyone); writes gated `is_allowed_reviewer() OR team_pass_ok()` (the
  RACI / Mission Control gate — the `projects` table itself is untouched, so its
  RACI/update relations survive a "delete"). The generator drops tabled projects
  from the live priority surfaces (grid cards render HIDDEN with `data-lifecycle`;
  `CPL_DATA.projects` + the Workplan Goals tables exclude them → they leave the RACI
  matrix / Annual Report / custom reports) and renders them in a collapsed
  **"Tabled & Archived"** section; `kb/_load_projects.py:load_project_lifecycle()`
  folds it into the committed `kb/project_lifecycle.json` ledger (offline fallback +
  the vault-synced "noted in the KB" record). Reversible (♻ Restore = DELETE the
  row). **Scope (Session 95): real work-item projects only** — rows keyed to the
  official 1.x–4.x sub-activities (the activity layer, `derive_core_activity_ids`
  minus `5.x`) are **ignored by every consumer** (generator scrub +
  `project_lifecycle.js`/`raci.js` mirrors); tabling a project can never remove an
  Activity card, its RACI rows, or its Workplan Goals ladder. Schema:
  `kb/supabase_project_lifecycle.sql` (applied live via the Supabase
  MCP). Docs: `docs/project_lifecycle_lessons.md`.
- **`map_college_users`** + **`map_college_contacts`** (added Session 87): the gated
  MAP-Users tab store (STAFF PII — names/emails/roles synced from MAP "College Users &
  Roles" + "College Contacts", **never committed to the repo**). `map_college_users`
  (2,741 rows): RLS = reviewer/team-phrase SELECT ONLY (no anon read, no anon write);
  a **public aggregate** `map_users_summary()` (SECURITY DEFINER, anon) returns
  per-college counts + the 7-way RoleName mix + last_synced (no PII). **Session 88
  added 3 columns** from the new Custom Report fields: `user_status`
  (∈ {Active, Inactive}) → a public **`active_count`** in `map_users_summary()`;
  `disciplines` (comma-delimited) + `last_updated_on` (text date) stay **reviewer-gated**
  (per-named-staff → roster only, never the public aggregate). `map_users_replace`
  carries all three. `map_college_contacts`
  (121 rows): reviewer/team-phrase SELECT only — the Primary Contact / VPAA (VP
  Instruction) / VPSS (VP Student Services) / **CEO** + emails behind the 📣 nudge, plus
  **`landing_page_url`** (the college's MAP CPL dashboard, joined in the sync from
  `chatbox_college_profiles`). Both refreshed
  atomically by service-role-only `map_users_replace`/`map_contacts_replace(jsonb)` RPCs
  (note the **`where true`** on the full-table delete — Supabase's pg-safeupdate blocks an
  unqualified DELETE through the PostgREST API roles). A third table **`map_college_nudges`**
  (Session-87 follow-up: college pk, `last_nudged_at`/`last_nudged_by`; reviewer/team-phrase
  R+W) is the "last nudged" log — kept SEPARATE from the contacts table so the monthly
  full-refresh never wipes it. Synced by `map/sync_map_users.py`
  (runner-as-proxy; `map-users-sync.yml`, dispatch + monthly cron). Schema of record:
  `map/supabase_map_users.sql` + `map/supabase_map_contacts.sql` (applied live via the
  Supabase MCP). Docs: `docs/map_users_tab_scope.md`.
- **`coci_college_offerings` + `coci_college_programs` + `college_geo`** (added
  Session 89): the **COCI offerings catalog** the shared `cpl-chat` function
  (Sierra) queries to know what each college **teaches** (vs the earned-exhibit set
  `chatbox_exhibits`). `coci_college_offerings` (16,097 `college × TOP-program`
  rollups: course/credit/noncredit counts, C-ID coverage, sample courses, a
  full-text `titles_text` blob), `coci_college_programs` (22,335 active/approved
  awards), `college_geo` (120 colleges → region/county). **Public read (no PII —
  course/program catalogs); writes only via SECURITY DEFINER `*_replace(jsonb, p_truncate)`
  RPCs** (service-role, chunkable). Search via **`search_college_offerings(search_query, college_filter, result_limit)`**
  (anon; `ts_rank`, TOP-title weighted A over the blob D). Built by
  `chatbox/build_coci_offerings.py` from `kb/reference/coci_course_list.xlsx` + the
  COCI program export; loaded by the runner sync `chatbox/sync_coci_offerings.py`
  (`coci-offerings-sync.yml`, push + dispatch). STATIC — rebuild on a fresh COCI
  extract, NOT a daily-cron artifact. Schema applied live via the Supabase MCP.
- **`cpl_funding_participation`** (added 2026-07-06, Session 3): the funding
  tab's **baseline-eligibility opt-in registry** — one row per college that has
  requested to participate by the deadline (absence = not opted in; no PII).
  Anon SELECT; INSERT/UPDATE **and DELETE** gated `is_allowed_reviewer() OR
  team_pass_ok()` (DELETE widened per the waa precedent — un-checking an opt-in
  is the drill-in toggle's reversible undo; the tab re-fetches after every
  write, #598). Same wave: `map_college_contacts` gained `cpl_coordinator` +
  `cpl_coordinator_email` (synced from the MAP Contacts view) and the PII-free
  anon **`map_coordinator_summary()`** RPC (college + boolean + synced_at) —
  the eligibility badge's live source; names/emails stay reviewer-gated.
  Schemas: `funding/supabase_cpl_funding_participation.sql` +
  `map/supabase_map_contacts.sql`.
- **`cpl_funding_notes`** (added 2026-07-06, Session 3 evening): **CO Monitor's
  per-college notes** on the funding tab's drill-in. Internal commentary on a
  public page → RLS gates **read AND write** to `is_allowed_reviewer() OR
  team_pass_ok()` (anonymous = zero rows; phrase-holders read; team-editing-on
  edits). One row per college, 1–4000 chars, touch-triggered `updated_at`;
  empty note deletes the row; tab re-fetches after every write (#598). Schema:
  `funding/supabase_cpl_funding_notes.sql`.
- **`cpl_funding_config`** (added 2026-07-03): the **Implementation Funding tab's
  shared model config** (`cpl_funding.js`). One JSONB `config` blob on a single
  `default` row holding the Chancellor-facing POLICY layer — selected years,
  per-year priority metric text + shares/targets, and the noncredit-feeder
  carve-out + roster. Anon SELECT (the shared model everyone opens to); writes
  gated `is_allowed_reviewer() OR team_pass_ok()` (team-phrase editable via
  `team_phrase.js`'s `decorateHeaders`; the anon key alone can't write). The tab
  resolves per field: **local what-if scenario ⊕ this shared config ⊕ the baked
  `cpl_funding_data.js` defaults** — so anonymous viewers layer per-browser
  scenarios on top of the team-configured base without the phrase. Touch trigger
  keeps `updated_at` fresh. Schema of record: `funding/supabase_cpl_funding_config.sql`
  (applied live via the Supabase MCP, migration `cpl_funding_config`). Docs:
  `docs/cpl_funding_lessons.md` (Session 2).
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
   Write `docs/kb-notes/playbook-project-activity-consolidation.md` first. ✅ **Substantially
   DONE Session 95 (#652 + follow-up):** the grid no longer duplicates activity-layer rows (the
   Activity card is the single surface and already carried the rich fields); project lifecycle is
   scoped to real work items; no project rows needed archiving. The playbook was superseded by the
   immunity invariant (`docs/project_lifecycle_lessons.md`, 2026-07-02).
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

> **Session 71 narrative (the CCR merge-workspace epic — one shared
> `buildMergeEditor`, two feeders; the right-hand docked worklist #511–#518)
> archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 72 narrative (StarLander — the post-consolidation merge-workspace polish pass, 13 PRs
> #520–#534) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/ccr_merge_workspace_lessons.md`](docs/ccr_merge_workspace_lessons.md).

> **Session 74 narrative (SkyBlaster — the public CPL Fact Sheet, PRs #537/#540) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md).

> **Session 77 narrative (StarPort — the RACI update loop end-to-end, 8 PRs #556–#562)
> archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md).

> **Session 78 narrative (SkyMap — posted `item_updates` surface on the card face via the read-only
> `card_updates.js` overlay, PR #564) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md) (Session 78).

> **Session 79 narrative (StarBender — RACI becomes the card's source of truth + statewide Fact Sheet
> recs, PRs #567–#571) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md) + [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md).

> **Session 80 narrative (StarMan — the public Fact Sheet becomes Curate-editable, PR #570) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md) (Session 80).

> **Session 81 narrative (StarFarout — per-row + per-card nudges + "Nudge All" #574; then the Fact Sheet
> Curate arc: add/delete/reorder boxes #576, "My CPL Stories" headless-sourced #577, image add/resize/replace/delete
> via the `factsheet-images` bucket #578 — all on the unchanged `factsheet_overrides` table via reserved key
> namespaces) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md) + [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md).

> **Session 82 narrative (SkyFlyer — Fact Sheet editable-everywhere + a11y + ⬇ Word export, PR #584) archived**
> → full story in [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md) (2026-06-28 sections); KB notes
> `methodology-stable-dom-keys-exclude-live-text.md` + `playbook-standalone-dom-to-word-export.md`.

> **Session 83 narrative (StarNova — CO-platform strategy `docs/co_platform_strategy.md` #586/#588;
> the "Lift Off" plan `kb/liftoff_plan.json` #588/#592; Mission Control `mission_control.js` #590/#592;
> the server-enforced RACI **team-phrase gate** #593 + hardening #595–#598) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/mission_control_lessons.md`](docs/mission_control_lessons.md) +
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md).

> **Session 84 narrative (SkyScribe — project soft-delete `project_lifecycle` #600/#605; lean Pages deploy
> `.nojekyll`/`pages.yml` #601/#602; computed Goal+Stretch progress bars #604) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 85 narrative (SkyLight — Annual Workplan tab = authoritative source: the
> "Current" live/manual hybrid + `projects.name` titles, PR-level code-only) archived** →
> full story `docs/annual_workplan_authoritative_lessons.md` + the reusable
> `docs/kb-notes/methodology-live-vs-manual-hybrid-column.md`.

> **Session 86 narrative (SkyGuy — `kpi_cards.js` shelf #610; live activity-card big numbers; RACI
> update popup; KB team-phrase; the light/glass theme #611; the MAP-Users PII-safe probe #612) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S86).

> **Session 87 narrative (StarMax — card↔KPI breakdown sync #617 + the MAP Users tab
> end-to-end #618–#621 + the nudge follow-up #623–#626) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S87) + [`docs/map_users_tab_scope.md`](docs/map_users_tab_scope.md).

> **Session 88 narrative (SkyThru — CCC-metric match · MIL/JST + Veteran Star · About-box
> z-index · MAP-Users 3 fields, PRs #628/#629) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S88).

> **Session 89 narrative (SkyMiles — Sierra sees what colleges TEACH: the COCI
> offerings catalog `coci_college_offerings`/`coci_college_programs`/`college_geo` +
> `cpl-chat` v20, PR #631) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (Session 89).

> **Session 90 narrative (SkySherpa — the standalone Sierra page brand: CPL logo
> lockup + the Whitney mark + "Your CPL Sherpa", PRs #635–#637) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (Session 90).

> **Session 91 narrative (SkyGOAT — both C-ID authorities unioned into the TMC right side #639 +
> the visual-PDF-read "OR" alternatives #640) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md).

> **Session 92 narratives (StarFab — the c-id.net join ladder #642 + the CONFIDENCE ENGINE +
> `docs/kb-notes/reference-tmc-confidence-data-requirements.md`; StarLab — audience selector +
> 👍/👎 feedback, cpl-chat v22/v23 #644 + `docs/sierra_training_tab_scope.md`) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) + [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md).

> **Session 93 narrative (SkyReach — the CPR retrieval miss fixed, cpl-chat v24 #646 +
> the Sierra Training tab #647) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (S93).

> **Session 94 narrative (SkySierra — Sierra mark + chat markdown + Training P1
> #649/#650 + the GUIDANCE layer, cpl-chat v26 #651) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (S94).

> **Session 95 narrative (the Activity ⇄ Project separation + the Archive-radio fix) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: `docs/project_lifecycle_lessons.md`.

> **Session 96 narrative (SkyPress — report generators go live-data + the attach handoff) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S96).

> **CCR Convergence kickoff narrative (MindMeld — doctrine + voice mind-meld + 78-group calibration,
> 2026-07-03) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). **STILL THE ACTIVE
> CCR LANE:** Sam's voice pass → distill Doctrine v1 → batch pass 2 + ESL packaging per
> [`docs/ccr_convergence_handoff.md`](docs/ccr_convergence_handoff.md); full story
> `docs/ccr_convergence_lessons.md`.

> **Session 97 narrative (BigSky — Activities tab optimization + reports consolidation,
> the Elevation slider + Master-Report absorb + nav groups) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: `docs/cobi_lessons.md` (S97).

> **Session 98 narrative (the Implementation Funding rework — Chancellor-facing
> scenario tool, PR #663) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/cpl_funding_lessons.md` (Session 2).

> **Session 100 narrative (SkyVault — the CER triage loop unstuck: token-refresh trio, SUPERSEDE/STALE
> fold lanes, queue → 0, cron fold+audit) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07).

> **Session 101 narrative (SkyAnchor — COS authority LIVE + triage QA + the AP fold) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 3").

> **Session 102 narrative (SkySeed — the brand-family pre-seed, 158 of 451 applied) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 5").


> **Session 103 narrative (Bruh SkyWay — the STAGED pre-seed + triage toggle + issuer
> authority sources) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 6").

> **Session 104 narrative (Bruh SkyTime — the statewide-catalog pass: 97 of the last 100
> staged + college chips + multi-issuer) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 7").

### Session 105 — SkyClose: the truncated-read fix + the missing-issuer lane + the seal-blue pass (2026-07-08)

Sam's "fire certs didn't save" + "113 still showing" were ONE bug: 1,200 overlay rows vs
PostgREST's 1,000-row unordered cap — saves were fine, the READ truncated a different tail
per load. `fetchAllRows()` Range-pagination now backs both CER overlay fetchers
(`docs/kb-notes/methodology-paginate-postgrest-reads.md`). Save-All broadened to every
FILLED shown row (hand-typed included) + loud per-row failures + `wlDraft` survival + live
issuer datalists. `_CREDENTIAL_REVIEW::` held ZERO rows — Sam's 10-Key pick had never
landed; "＋ set" now opens the issuer input DIRECTLY and the pick was seeded
(`session105-skyclose@bot`, Mode A2 folds it). New **missing-issuer triage lane** (1,130
null-issuer credentials; `kb/_preseed_null_issuers.py` staged 978 → `kb/issuer_preseed.json`,
verifier 19 checks; empty-Save = explicit no-formal-issuer). COBI-wide: black ink headers →
`--seal-blue`; Curate-panel black-box bleed fixed; CER title/chip row-height pass. Suite 142
green (+2 files). Full story: lessons "continued 8"; next: `docs/session_106_handoff.md`.


### Session 106 — SkySeal: Rule 5f (the school IS the agency) + the issuer lane grows title editing (2026-07-08)

Sam's 4 asks: edit pre-seeded titles IN Triage; show raw title + originating college there; a
standing rule for HS/ROP/adult-school Cx exhibits; re-run the pre-seed. **Rule 5f** (SKILL.md):
strip the school from the title, school = issuer = trainer by default, never overwrite a real
issuer (PLTW), multi-school identities take no default (the EMT-405 unanimity guard).
`kb/_preseed_null_issuers.py` → plan schema v2 (`title`/`trainer`/`issuer:null`/`resurface`):
**989 staged** (local-trainer 74 · cx 717 · course-as-exhibit 167 · family 31), verifier 25 checks.
The CER issuer lane: editable title input + raw-variant lines + college chips (auditor now stamps
`colleges` on classified cards), one Save writes up to 3 overrides, resurface rows never rewrite a
real issuer; **Mode A3** (trainer promotion) added to `_apply_credential_review.py`. Suite 142
green. Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-08 "continued 9").

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
