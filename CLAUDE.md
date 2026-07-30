# CPL Project Tracker — Claude Code Project Memory

This file is auto-loaded at the start of every Claude Code session in this
repo. Keep the **Critical Rules** section tight — move deep reference material
into `docs/reference/` (pipeline_reference · kb_build_status · mid_lifecycle — see the stubs below) or into dedicated docs.

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

2. **CSS-injection idempotency guard in `excel_to_dashboard.py` must not be
   removed.** The generator injects `EXHIBIT_ANALYSIS_CSS` before the first
   `</style>` tag; the guard (search for the
   `/* ═══ MAP Articulation Analysis Cards ═══ */` start/end markers — line
   numbers rot, markers don't) strips any pre-existing copy before
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

   **TOP caveat — standing rule (2026-07-16).** TOP codes are faculty-entered
   in COCI during local curriculum approval with **no data-entry gatekeeper**,
   so they are notoriously unreliable (~52% of consolidated M-IDs are
   TOP-mixed). **Never use TOP for gatekeeping or a primary determination**
   (discipline / SUBJ4 / identity / membership / merge / split). TOP is a
   **last-in-line corroborator** — usable only when a *second* independent
   signal agrees (the two-signals-agree gate) — or a **fuzzy search/filter**
   aid. A discipline inferred from TOP (`discipline_source` `top_code`/
   `top_division`) **displays** (⚙ badge) but is **held out of the
   canonical-SUBJ4 fold + its modal vote until corroborated** by `subject_map`
   or a curator (Sam's "gate identity, keep display" ruling). The only places
   TOP is authoritative by definition: the **CTE flag** (`_join_cte_from_top`)
   and the **CIP↔TOP crosswalk** (TOP is the subject there). Full doctrine +
   the 24%-of-rows blast radius:
   [`docs/kb-notes/methodology-top-is-a-last-in-line-signal.md`](docs/kb-notes/methodology-top-is-a-last-in-line-signal.md).
   The CO's **TOP→CIP** cutover (fall 2026) is the systemic exit from TOP —
   apply the same "corroborate, don't gate" posture to CIP until it earns trust.

   **M-ID structural invariants** (enforced at every re-mint; deviations
   become audit findings):
   - SUBJ portion is exactly **4 letters**. The single-letter SUBJ
     artifacts (`A M1001`, `F M1001`, …) were folded by the 2026-06-12
     canonical fold; residue = **1** (`F M1002`, blank-discipline —
     unfoldable until disciplined; `mid_id_off_scheme` tracks it).
   - Within `id_system == "M-ID"`, **all rows sharing a *corroborated*
     `discipline` share a SUBJ4** (TOP-only-disciplined rows wait for
     corroboration before folding/voting — see the TOP caveat above) —
     **ENFORCED 2026-06-12 (Session 50): the canonical
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
     `kb/discipline_canonical_subj4.json` (live — 146 disciplines, all
     curator-reviewed; synced from Supabase `_CANON_SUBJ4::` picks) for
     the canonical SUBJ4 per discipline. (The MQ vocabulary
     `kb/reference/mq_disciplines.json` is the broader 248-title superset —
     re-discipline proposals must be exact-MQ-name; Session 112, #746.)

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
   - **`CLAUDE.md`** — rules + the §11 Roadmap table + ≤2 session
     narratives. Refresh roadmap-table status here. **Deep memory now lives in
     `docs/reference/` (pipeline_reference.md · kb_build_status.md ·
     mid_lifecycle.md — the 2026-07-10 pare-down): update THOSE at checkpoints**
     for tag counts, lifecycle/pathway changes, build-phase state, and new
     tabs/pipeline surface — do NOT re-inflate this file.
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
     **The authoritative handoff is the HIGHEST-numbered
     `docs/session_<N>_handoff.md`.** A greeting citing a lower number is stale
     (2026-07-10: "105" vs actual 111) — `ls docs/session_*_handoff.md`, read
     the highest, and confirm the number with Sam if they diverge. Sam's
     greeting sometimes names the session's moniker (SkyTime S104, SkyPhilo
     S108 precedent) — claim it and carry it in the §11 narrative + handoff;
     otherwise take the handoff's suggestion or coin your own.

   - **`kb/cpl_todos.json`** — **the dashboard To-Do feed (added Session 47),
     refreshed on EVERY checkpoint alongside the handoff** (it is the handoff
     distilled for the dashboard: ≤ ~12 layman-readable items split For Sam /
     For Fable + a "where we are" `_status`, rendered by `cpl_todos.js` as the
     📋 button on every tab). Bump `_as_of` (resets viewers' check-offs),
     DELETE done items (never leave them checked), keep counts current.
   - **`cpl_memory` (live Supabase memory table) — auto-write every checkpoint
     (Phase 3, 2026-07-24).** Sessions write this run's *durable, uncaptured*
     learnings via the Supabase MCP, **no approval gate**: own writes land
     **`proposed`**; corroboration (a 2nd session / a committed KB-note-or-PR
     `source` / Sam's ✓) promotes to `verified` (the only status shown by
     default). Keep the truth table lean (the append-only `cpl_memory_log`
     carries volume) — supersede don't delete, log every write, don't dump a
     session log. Full procedure (SQL patterns + the corroboration rule):
     [`docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint.md`](docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint.md).

   Capture in each: (a) what's been learned this checkpoint, (b) current
   state of the work, (c) strategic roadmap, (d) next concrete step.
   Better to checkpoint slightly early than slightly late — sessions can
   end abruptly and what's not in a markdown file is effectively lost. The
   user can trigger a checkpoint at any time with the **`/checkpoint`**
   slash command (`.claude/commands/checkpoint.md`).

9. **Supabase live-curation safety.** Sam curates LIVE beside sessions — his
   rows always win. (a) Before ANY bulk `kb_curation` write: fresh live read
   at write-time, re-measure any queue/worklist staged earlier in the session,
   and cross-check pending `unified_title_merge_confirm` TARGETS (a rename
   whose key is a pending merge target fights the curator — hold it). Then
   INSERT-only `ON CONFLICT DO NOTHING` under a cohort `reviewer_email`
   (`<lane>-s<N>@bot`) with a committed receipt; guarded UPDATEs only where a
   reviewed plan explicitly says so. (b) `kb_curation` reads via PostgREST
   MUST be Range-paginated (#718). (c) The sandbox cannot reach
   `*.supabase.co` — all Supabase access goes through the MCP tools.
   (Promoted 2026-07-10 from the rotating handoff "Safety patterns" blocks —
   these are standing production-safety orders, not session lore. Worked
   examples: `docs/kb-notes/playbook-trail-crew-method-magic-audit.md`.)

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
  - **Backstop — auto-merge is ENABLED (Sam's toggle ①, 2026-06-11):** after
    marking ready, call `mcp__github__enable_pr_auto_merge` (squash) and GitHub
    merges the instant required checks pass — no turn-ending wait, no nudge
    needed. Note it refuses while a required check is still in-progress; poll
    checks via the MCP github tools and retry, or squash-merge manually per the
    rules above.
  - **Method: squash and merge** — collapses to one commit on `main` with
    the PR title + body. Matches the existing `Merge pull request #N`
    history pattern.
  - **Feature branches auto-delete on merge** (Sam's toggle ②, 2026-06-11).
    Don't run `git push origin --delete` from a session — the session token
    403s on branch deletes; GitHub's auto-delete handles it.
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
`unified_courses_*.js`, `kb/row_audit/`, `cip_fitcheck/`, etc.) are excluded in
Obsidian's **Files & Links → Excluded files** so the graph stays clean.

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

**Moved to [`docs/reference/pipeline_reference.md`](docs/reference/pipeline_reference.md)** (2026-07-10 pare-down — was 1,087 lines of context-tax).

Read it BEFORE: touching `excel_to_dashboard.py` or the daily workflow (§5–6);
adding/moving tabs or nav (§7b); working on CPL Assistant (§7c) or TMC Builder
(§7d); **any Supabase schema/RLS/write work (§8 — table inventory + gating)**;
EACR identity (§9); C-ID/CCN conventions (§10). Contents: 1 Architecture ·
2 File Inventory · 3 Cloudflare Worker · 4 3-Tier Colleges · 5 Python Pipeline ·
6 Daily Workflow · 6a Analytics · 6b Activities · 7 Custom Report · 7a–7d Tabs ·
8 Supabase · 9 EACR · 10 C-ID/CCN.

## Knowledge Base & Unified Courses Curation — Build Status

**Moved to [`docs/reference/kb_build_status.md`](docs/reference/kb_build_status.md)** (2026-07-10 pare-down — was 421 lines).

Read it BEFORE: KB/unified-courses curation work, the CCR worklists, or citing
build-phase history. It holds the phase-by-phase build narrative, counts, and
artifact locations. Current-phase quick state: see the §11 Roadmap table below
+ the latest `docs/session_<N>_handoff.md`.

## 11. M-ID Lifecycle, Model Curriculum (MC), and the CID/CIDx Pathway

M-IDs are not just identity surrogates — they're staging points in a strategic
pipeline toward ASCCC C-ID approval. The dual-score auditor at
`kb/_row_audit.py` and any future curation work depend on this framing.

**Lifecycle/MC/CIDx prose + the Session-25 strategic roadmap and archived
session narratives moved to
[`docs/reference/mid_lifecycle.md`](docs/reference/mid_lifecycle.md)**
(2026-07-10 pare-down). Read it BEFORE: re-mints, MC/TMC terminology calls,
Trust-Card auditor work, or CID/CIDx pathway decisions. The live Roadmap table
+ the two most recent session narratives stay here (Rule 8 budget).

### Roadmap

> **Completed rows archived.** The DONE / superseded roadmap rows (all the
> shipped phases through Session 32) live in
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Only the still-open
> rows (in progress / parked / queued) are kept inline below.

| Phase | What | Status |
|---|---|---|
| 1b (3/3) | Curate-write Repair-from-members action (Supabase schema migration + fresh-read + cron-window) | parked (low immediate value — 1 cluster; build when ≥5 clusters exist) |
| 1c | More audit rules — **9 of 10 landed:** `discipline_title_mismatch`, `generic_title_concrete_discipline`, `top_discipline_disagreement` (+ SISTER_PAIRS suppression), `description_discipline_disagreement`, `subject_collision_signal` (Phase 1e diagnostic — **7,203 flags pre-re-mint**, target 0 post-re-mint), `unit_anomaly` (2026-05-26, 4,385 flags — first member-level cross-validation, also first non-discipline penalty via `TAG_PENALTY_ON_UNITS`; surfaces possible over-merges across credit-vs-noncredit unit-load variants), and **`merge_into_orphan`** (2026-05-27, **0 flags on current data** — preventive data-integrity detector for dangling `merge_into` pointers; valid targets = courses ∪ singletons ∪ `UC-CUR-*`; fires symmetrically on M-IDs + clusters with bad curation pointers). **`member_top_divergence`** (2026-05-29, **1,299 flags** — the cross-discipline over-merge detector; member colleges' TOP codes span ≥2 broad divisions, ≥30% minority; 736 carry no other strong signal; second member-level rule after `unit_anomaly`). **`subject_discipline_outlier`** (2026-07-13, Session 113, #761 — **~302 flags**, penalty 0.20; the mis-mint detector Sam's HVAC M10FR catch motivated: a row's assigned discipline is a small minority (≤15%, ≤3 rows) of its LOCAL SUBJECT CODE cohort AND the TOP code OR curated lexicon corroborates the SAME correction — two-signals-agree; **covers singletons** the corroboration-gated `top_discipline_disagreement` skips; 41 corrections fired `mismint-s113@bot`, `kb/mismint_out/2026-07-13/`; carries a `suggested_fix`). **Still queued:** `cluster_title_drift` (low yield until more clusters mint) | in progress |
| **Cred-Ref PR-5b/2** | Collision-resolution UX in the Credential Reference tab — "Confirm merge" affordance when a rename target collides with an existing credential key. | ✅ **DONE Session 107 (#698)** — Sam hit 6 collisions on 2026-07-08; shipped same-day: Save-time detect + confirm dialog → `unified_title_merge_confirm` row, pending-merges strip, dry-run `merges` lane, apply fold. His 6 await ✓ Confirm merge in the lane. |
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

### SkyReconcile — Implementation Funding: the Sept-2026 BOG amendment becomes the pool authority (2026-07-30)

Closed SkyHighness's queued reconciliation. Sam supplied `20260729_CPL_Amendment_Sep_BOG.xlsx` and ruled:
**amendment governs · both $1M earmarks survive · 2-year window.** The amendment splits the $35M in just two
lines (`College CPL Outcomes Awards $26,040,308` = **$25,240,308 to institutions** + `$800,000` CO staff;
`CPL Projects $8,959,692`) and names no noncredit or rural line — so the earmarks are carved **from inside**
the institution total: `35,000,000 − 800,000 − 8,959,692 = 25,240,308 − 1M feeder − 1M rural = $23,240,308`
main pool; hero **$24,240,308**, avg $210,785 / min $150,000 / max $623,871. `remaining_2025_26` → $9,040,308,
making the $15M N2N residual compute to the amendment's exact **$59,692**. **Data-only** (`cpl_funding_data.js`;
0 consumer changes — nothing downstream hardcoded a pool figure) + **Part R** pinning each line to the workbook;
Supabase Scenario 1 re-pointed ($8M → $8,959,692), Scenario 2 untouched. Tests 515 → **531**. ⚠️ **Two errors
found IN the amendment**, both reported: its `$74,000,000` grand total **double-counts the $8,959,692 project
slice** (true total **$71,000,000**), and its `Max Award $665,971` is a transposition of $665,791 — the max
over **115** colleges — while its average is that pool ÷ **119**. Method (incl. a reconciliation I got wrong
first, from a $1 coincidence that assumed its own conclusion): `docs/cpl_funding_lessons.md` ·
`docs/kb-notes/methodology-recompute-a-sources-own-summary-statistics.md` · handoff `docs/cpl_funding_handoff.md`.

**Cont. 2026-07-30 — the Budget tab becomes the CPL ledger (#938/#940/#941/#942 MERGED, LIVE).**
Sam's full funding history back to 2017 unlocked the organizing insight: **both major asks were funded
in TWO installments** — implementation one-time `$15M (2025) + $35M (2026) = the $50M requested`,
ongoing ops `$5M + $2M = $7M/yr` — and 2026-27 is the year the Legislature made good on each. His three
rulings (AskUserQuestion): one consolidated **$7M ongoing** row; the **amendment's 2-year shape governs
the $35M**; **cutoff at 2025-26, ARCHIVE don't delete**. `budget_funding` stopped being a flat source
list and became the whole ledger — **45 rows** (4 sources · 7 uses · 16 pool · 18 history) via
`description`/`archived`/`parent_id`/`section`/`sort_order`/`window_label` (receipt
`kb/supabase_budget_structure.sql`). **Nothing was deleted:** the two existing $6M rows turned out to be
the *natural parents* of the seven $6M allocations (CO 2,254,764 · RCCD 3,745,236 — they sum exactly).
New **`budget_ledger.js`** renders Sources · Uses · the $18M pool · History, each with collapsible
detail, a Summary⇄Detail preset, and **inline editing on every non-total field incl. descriptions**;
live-fetched so a curator's edit re-renders instantly. **`total` is computed = Σ years and read-only
where a row has years, editable only where the source gives no split** — that rule immediately caught
the $15M source row still carrying its old *spend* schedule (would have shown $24,040,307). Tests:
`budget_ledger` 34 + `budget_ledger_structure` 21. ⚠️ **The load-bearing rule, hit THREE times in one
day (the amendment's $74M, my first mockup, my own seed data): TOTALS SUM PARENT ROWS ONLY** —
`docs/kb-notes/methodology-parent-child-ledger-totals.md`. Sam ruled the amendment's Lightleap $1.4M is
**not** a double count (year-2 extension + more colleges) — do not re-raise. Open with Sam: the two $5M
rows. Story: `docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`. Side-lane — left
`cpl_todos.json`'s CCR items + the numbered handoff to the CCR mainline.

### SkyHighness cont. — Implementation Funding: the $35M reframe + the $15M Distributions view (2026-07-29, #931/#934 MERGED)

A CBO question at the CO budget workshop ("what are the factors in the allocation formula?") cascaded
into two reframes, both live. **#931 — the tab models the 2026-27 $35M apportionment only** (the
2025-26 remaining ~$9M is a separate topic): `$35M = $26,240,307 three-priority college pool (incl.
$1M rural) + $1M NC feeder + $1.2M CO Administration + $6,559,693 CPL Projects & Innovation` — ties
out to the penny. Hero **$26,240,307**, award range **avg $228,177 / min $150,000 / max $694,273**.
⚠ Sam's precise anchor is **$26,240,307**; his "~$8M for Projects & Innovation" = **admin + P&I**
($7.76M), so P&I alone is the $6.56M residual. **#934 — a third sub-view** (`[$35M Funding model |
$15M Distributions | Report]`): the **ESS 25-82** receipt ($50,000 × **118** = **$5,900,000**; 114
colleges + the **4 noncredit campuses**; **Sequoias declined**), the **$9,040,307** remaining balance
alongside (where the dropped $9M honestly lives), an honest reconciliation naming the **$59,693**
residual, and **per-recipient progress on the three ESS priority outcomes** — JSTs (`vet_star` ≥75%,
memo bar is 100% → caveat inline) · statewide recs (**new** `funding/_build_funding_ess.py` →
`cpl_funding_ess.js`, a 2.3KB sidecar off the 2.9MB CER; 84 credentials → **71 adopters**, 0
unmatched; workflow step 4a3) · proactive CPL (`pe`/`p3`). **Fail-open** marks (no feed → ⏳, never a
false "not met"); the legend says a dash is NOT a compliance finding. Live: **51 · 70 · 94**, **38
meeting all three**. Tests 490→**515**; PII guard extended; Chromium desktop+mobile clean. Method:
*read the policy PDF, don't infer it* — the memo alone gave up the CIO-certification mechanism and the
exact 100% JST bar. Story: `docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`.

### SkyHighness side-lane — Implementation Funding PR4: combine the floor with the rural bump + display rename (2026-07-28/29, #925 MERGED + rename PR)

Shipped SkyHigh's queued PR4 (`cpl_funding.js` + `cpl_funding_data.js` + test; **0 HTML**). Sam's
call (AskUserQuestion, grounded in the live split): **Option B — guarantee the whole $1M rural
allowance** (floor-fill + bonus, no performance gate) → let me retire the entire ≥50% rural-earning
machinery. **Mechanism = one waterfall, per-college floor:** `allocModel()` gives rural colleges a
REDUCED main-pool floor `max(0, floor − ruralPer)` ≈ $73,077, so the guaranteed rural allowance funds
the top of their $150k floor and the main pool the rest — `mainW + ruralPer ≥ floor` **always** (no
leftover top-up; the "gap > slice" edge case can't arise); `Σ mainW` still = `netCollege()`
(conservation intact), freed main-pool dollars re-split to unfloored colleges. **Guaranteed in Earned
mode:** rural added in full, only the MAIN allocation flexes (resolves the #916 advance-credit note).
Live split: floor-fill **$654,148** + bonus **$345,852** = $1M; Σ totals **$33.8M**; the 5 smallest
rural colleges land at exactly $150k (surfaced that pull-down to Sam). Rural section → **Guaranteed
allowance → Floor-fill → On-top bonus → Window total**. Tests 460→475→**490** (new Parts N/O/P); suite
173 green; Chromium clean. **The adversarial review (4-lens Workflow) earned its keep** — caught a real
Earned-mode bug (a THIRD earned site, the per-priority drill-in, still flexed the guaranteed rural to
$0) + 2 minor fixes, all pre-merge (Part O). **Follow-up: the display rename** ("West Hills Coalinga"→
Coalinga College, "Imperial"→Imperial Valley College) via a `display` field + `dispName()`, display-only,
join key kept (Part P). Story: `docs/cpl_funding_lessons.md` (SkyHighness) · handoff. Side-lane — left
`cpl_todos.json` + the numbered CCR handoff alone.

### SkyHigh side-lane — Implementation Funding: readability + equitable cells + rural fold + 13-college roster (2026-07-28, #914/#916/#921 MERGED)

Three merged PRs (JS + the data roster; **0 HTML**). **#914:** "How an allocation is computed" →
left-justified bullets; **full-width** (scoped `#tab-implementation-funding .main-container{max-width:none}`)
+ left-justify; **mobile + a11y** (keyboard sortable headers `aria-sort`, a real `<button>` caret keeping
`<tr>` semantics, `aria-pressed` toggles, table region + sr-only caption, focus restored after the
innerHTML re-render — WCAG 2.4.3, ≤640px media query); **equitable per-priority cells** — `Tgt N stu ·
$cap`/`Now N stu · $earned · %`, the per-student **rate moved OUT of the cell into the hover** (it varies
with floor/rural → reads as inequitable inline; % of target is the shared yardstick); sections default
collapsed except the college table. **#916 — rural allowance FOLDED into the rows** (`W = mainW +
ruralWindow`, assume the ≥50% unlock, disclosed in the hover): `netCollegeWithRural()` so **Σ rows == the
SYSTEM total**; `earnAgg.perPrio` stays main-pool (policy cards). Pool reconciled to **ONE number $33.8M**
with a "$32.8M main + $1M rural" note; the **rural pool card is now an earmark, not a deduction**. **#921 —
rural roster → the 13 federally-rural CCCs** (the 10 were the RCTC *demo* cohort); the per-college bump is
**derived** so it auto-became $1M/13 ≈ $76,923 (data-only flip) + a muted, larger 🌲. Tests 422→**460**;
two adversarial reviews per structural change caught the focus-restore a11y bug + the $1M pool-framing
cascade. **QUEUED (PR4, Sam's ask): combine the floor with the rural bump** — backfill rural colleges to
$150k from the carve-out first (frees ~$752k main-pool for non-floored colleges); lock the guaranteed-vs-
earned split first. Story: `docs/cpl_funding_lessons.md` (SkyHigh) · handoff `docs/cpl_funding_handoff.md`.
Side-lane — left `cpl_todos.json` + the numbered CCR handoff alone.

### SkyMore side-lane — Implementation Funding: front-load-aware formula · cell re-weight · feeder 2-batch + F1/F2 · rural per-priority earn (2026-07-27, #908/#910 MERGED)

Four curator asks, two JS-focused PRs. **#908:** (1) the **"How an allocation is computed" box now
branches on the Even ⇄ Front-load toggle** (it read as an even-tranche explainer even when front-load
was ON — one `cadenceSentence` tells each mode's whole story); (2) college-row P-cells **re-weighted**
so the earned **dollar** (`.cf-u`) is bold navy and the count + % recede (CSS only); (3) noncredit
**feeder rows show the 2-batch/yr cadence** (`feederBatchNote` "2 batches · $X ea", tied to the Timing
section). **#910 (Sam's two AskUserQuestion picks):** (4) the **rural allowance earns PER PRIORITY with
a ≥50% FLOOR** — `ruralEarned` splits each $100k by the 3 priority shares, each slice unlocks at ≥floor
then pays in proportion (reuses `earnFraction`, same engine as the main pool; kills the old binary
≥50%-of-average cliff; dead `ruralAttainment` deleted); (3b) **feeder measurables F1 + F2** — **F1
(eligible headcount) is live-wired** (builder `_feeder_resolver` + per-feeder `pe` bucketing →
`feeders:{short:{pe}}`, empty until NC campuses attach exhibits in MAP; consumer measurables ladder),
**F2 (NC-cert CPL waivers)** an honest "awaiting a data source" placeholder; ladder states what's NOT
tracked (transcription; JST/Veteran Star). Tests 390→411→**422** + builder 16→**19**; suite 173 green.
Method: *wire computation+display end-to-end but resolve to a pending state — never seed a fake count.*
Story: `docs/cpl_funding_lessons.md` (SkyMore + round 2) · `docs/cpl_funding_handoff.md`. Side-lane —
left `cpl_todos.json` + the numbered CCR handoff alone.

### SkyElemental side-lane — COBI Element Map refresh + the single-source workplan title/description editor (2026-07-27, #900/#902 MERGED)

Two merged PRs. **#900** refreshed the stale **COBI Element Map** (`Dashboard_Element_Map.html`,
the 🔧 button on Activities): Excel→**Supabase** everywhere (new `tag-supabase`/`supa-ref`
chips), Section 2 rewritten to the current 4-Activity/32-sub structure + the real
`apply_live_activity_current()` priority, a read-only callout (edits happen via the signed-in
editors), the one honest Excel carve-out (budget Key Factors) flagged. Hand-maintained static
file, Pages-served. **#902** made the **Annual Workplan Goals tab the ONE place** to edit workplan
**titles + brief descriptions**: `workplan_goals.js` gained `startDescEdit`(→`projects.description`),
`startActivityTitleEdit`(→`workplan_goals.name`, keeps the "Activity N:" prefix),
`startActivityDescEdit`(→ new `workplan_goals.description` col) on a shared `inlineTextEditor`;
generator emits `activity_desc` store→`CPL_Data.js`; **de-hardcoded** the drifted Activity copies
in `raci.js`/`master_report.js`/`generate_reports.js` so a rename flows everywhere. **Adversarial
review earned its keep** — caught that the report generators keyed `ACTIVITY_DESC` by the short
`Activity N` id but looked it up with the *full* `projects.activity` label, so the de-hardcode was
dead (fixed + rename-flow test). **Workplan data cleanup** (curator-confirmed, live, receipt
`kb/supabase_workplan_goals_description.sql`): backfilled real primary links for the 10
association-less projects; purged the dissolved Activity 5 (+ 5.1/5.5 ghosts); deleted tabled
`5.1` AI-Ready California; retitled Activity 4 → "Coordinate CPL Sprints, Targeted Projects,
Professional Learning, and Strategic Partnerships". Two linking mechanisms clarified:
`projects.workplan_activity` (home + grouping-by-number) vs `workplan_activity_associations`
(N-to-N cross-links). Tests: new `workplan_goals_desc_editors` (22) + a `master_report` rename-flow
guard + `raci` mock fixed (4 activities). Story: `docs/workplan_single_source_editor_lessons.md` ·
`docs/workplan_single_source_editor_handoff.md`; KB notes
`methodology-single-source-of-truth-flows-via-snapshot`,
`reference-workplan-activity-project-linking-model`. Side-lane — **left `cpl_todos.json` + the
numbered handoff to the CCR mainline.** Deferred: retire dead `projects_editor.js`/projects-grid;
optionally show the sub-activity description on the Activities-tab cards.

**Cont. 2026-07-27 — reflect EVERY project + finish the #872 re-key (#905, #909 + a live 4.7→4.5.1
re-home).** **#905:** the Annual Goals table grouped rows by `activity_ids[0]` (smallest cross-link)
not the HOME Activity → repeated/interleaved headers (9 not 4); fixed to group by
`workplan_activity` + sort by (home, id). **#909 — the big finding:** the **#872 reorg re-keyed
`projects`/`item_raci`/`item_updates` but LEFT `workplan_goals` + `workplan_activity_associations`
on the OLD numbering** → 10 projects missing from Annual Goals + every Activity-4 row showing the
NEXT item's targets (off-by-one under the dissolved "4.1 Sprints" wrapper). Fix: applied the same
#872 crosswalk to `workplan_goals` (two-phase perm, receipt `kb/supabase_workplan_goals_rekey.sql`)
+ cleaned 10 orphan association rows + filled `3.1.4`; generator **Path A** — `annual_goals` now
iterates the `projects` set (ladder overlaid by id) so every project reflects and the two tabs
can't drift; blank-ladder rows read-only (gated on `has_ladder`), title/desc still editable; X.Y.Z
ids nest under their X.Y parent (Sam: 29 Palms subsidiary-but-a-card). A consumer trace confirmed
RACI/Fact Sheet/reports need no change (the re-key **auto-corrects** the reports' targets — they
read `projects[*].kpi_goal_*`). **4.7→4.5.1**: Legislative Advocacy re-homed under 4.5 (renumber =
re-parent). Descriptions: only `3.1.4` was empty (filled); the rest are curator-authored, kept.
Tests: `annual_goals_activity_grouping` (12) + `annual_goals_reflect_all_projects` (20). Durable:
**re-key EVERY project-keyed table** (`methodology-rekey-every-id-keyed-artifact`); **projects=tree,
workplan_goals=overlay** (`methodology-single-source-of-truth-flows-via-snapshot`). Story in the
lessons/handoff docs above.

### SkyMoney side-lane — Implementation Funding: collapsible sections · per-student rate · P1/P3 metric wiring (2026-07-27, #901 MERGED)

Three curator asks, one PR (`cpl_funding.js` + the actuals builder + tests; **0 HTML**).
**(1) Collapsible sections** — every top-level section is a native `<details>` whose
`<summary>` is its h3 (8); `section()`/`collapseH3()` helpers, open/closed persisted
(`cplfund_sections_v1`, default open, saved on `toggle`) so it survives the re-render every
edit triggers. **(2) Per-student rate replaces "% of headcount"** — curator types `$/student`,
reach (# students / %) is DERIVED = `share × perYear ÷ per_student`; **`per_student` is the
stored source of truth and `target_rate` is derived from it at the ONE seam (`priorities()`)**,
so every downstream `target_rate` reader keeps reading it unchanged — no consumer re-wired for
the inversion (display sites were edited to *show* the rate, not to change the target math; KB
note `methodology-invert-an-input-derive-at-the-single-seam`); legacy rows fall back +
self-migrate; rate shows inside each P-cell. Sam's $61.46 confirmed. **(3) Data-gap wiring** —
P1's reworded "eligible" metric → the eligible count (`pe` ≈ **43,000**, 43,284 on the
2026-07-27 feed) **already in the feed** (matcher only, no pipeline change); P3's portal metric
→ new builder `pp` count (Potential Student = Yes + transcribed) with **`advance:true`** → a new
`earnFraction` status **`advancing`** shows the count but pays full cap so the handful of
mostly-test records (**pp = 5** post-dispatch) don't zero out P3 in Earned mode (flip off when
the Portal is live). Tests 376 → **390**; real-Chromium clean. Two judgment calls
flagged for Sam (uniform vs per-college `$/stu`; P3 advancing vs zeroing) — both 1-liners.
`pp` published via the post-merge `daily-dashboard.yml` dispatch (pp = 5). Story:
`docs/cpl_funding_lessons.md` · `docs/cpl_funding_handoff.md`. Side-lane — left
`cpl_todos.json` + the numbered handoff to the CCR mainline.

### Sky10Men side-lane — 🧠 Memory tab polish + 🩺 MAP Data Quality register + license fix (2026-07-26, #894–#898 MERGED)

Picked up SkyKnow's live memory loop. **#894/#895:** the 📄 Report → non-techie **prose** +
short item **titles** + reader **`plain`** column + **✨ Autogenerate** on Add & Edit (cpl-chat
RAG draft, prefill-only; form fields via `querySelector`, never `form.title`). **#896:** the Memory
**curate lockout fix** — `cpl_memory` UPDATE RLS was reviewer-only, so team edits hit the PostgREST
zero-row trap → `checkWrite` read a 403 → phrase cleared → lockout; widened to reviewer-OR-team
(now the standing **`p8`** / KB-note rule for every team-curated table). **#897:** the new **🩺 MAP
Data Quality register** (Supabase `map_data_quality` + team-gated tab, Reference & Curation group,
seeded with Sam's 4 defects incl. the **USMC JST skill-level CR duplication**, `f8`/`o3`). **#898:**
**license** corrected (vestigial MIT © 2019 Zachary Rice → **CCCCO all-rights-reserved**). Queued
(`w3`/`w4`): auto-generate DQ findings from `View_StudentAggregatedValues` + a follow-up nudge.
Advice given (not built): Priority 1 → **Applied** credits (`TotalAppliedCreditsForCR` already in
the feed); repo-privacy levers (private ≠ private-data if Pages public; license/privatize/split).
Story: `docs/cobi_memory_tab_lessons.md` · `docs/cobi_memory_tab_handoff.md`. Side-lane — left
`cpl_todos.json` + the numbered handoff to the CCR mainline.

### SkyFriend side-lane — COBI Implementation Funding: uniform fonts · metric-keyed actuals · allocation-balance box (2026-07-23)

Three curator asks on the Implementation Funding tab, one JS-only PR in `cpl_funding.js`
(continuing SkyFunder). **(1) Uniform fonts** — the whole priority box (desc/nums/metric/
strategies) + Timing rows → `.8rem` (the smaller size already in use); only the priority
**title** stays 1rem (strat/timing rows had been inheriting the page base). **(2) Actuals
follow the METRIC, not the slot** — Sam reordered priorities (Access ⇄ Success) and the
position-indexed `MEASURABILITY[slot][idx]` map left the "any transcribed" ACTUAL (16,807)
pinned under the statewide-eligibility priority. Replaced with `MEASURES` = ordered
`test(metric)` predicates (portal → eligible/statewide → matched-MIS → completion → units →
any-transcribed), first match wins; the measure now travels with the metric wherever the
curator drops it (default order resolves identically — all prior assertions green). Call
sites `actualLineHtml`/`collegeDetailHtml`/`ruralAttainment` pass `p.metric`. **(3)
Allocation-balance box** in the Funding Pool area (`perYear − perYear×Σshare`, viewed-year
shares): `$0` at 100%, red **Over-allocated** > 100% (the modern N3-BALANCE cell), surplus
< 100%; Projection-% line reworded. **Confirmation Sam asked for:** the **Allocation share**
moves money; the **Projection %** is a performance target only — it does NOT cap funding
(that coupling was the pre-2026-06-11 model, removed on purpose). Tests 325 → **337**; suite
168 files green. Story: `docs/cpl_funding_lessons.md` (SkyFriend) · `docs/cpl_funding_handoff.md`.
Side-lane — left `cpl_todos.json` + the numbered handoff to the CCR mainline.

**Cont. 2026-07-24 — achievement-based funding (cap-and-earn):** the projection-% thread
surfaced that the tab funds on **headcount, not achievement** — and never did (confirmed
against Sam's actual workbook formulas). Told him plainly, then built what he confirmed
(AskUserQuestion): allocation = a **CAP**; `earned = cap × min(1, actual ÷ target)`, capped
at 100%, unearned rolls forward — so a college draws *proportional* funding (never needs the
full target) and a non-participant earns **$0** (the incentive). A **Potential ⇄ Earned**
basis toggle (default Potential) overlays pool Earned/Unearned cards, per-priority earned %,
table earned-of-cap, drill-in per-priority earned. The projection % is now the achievement
target. **Load-bearing rule** (new KB note
`methodology-achievement-based-funding-cap-and-earn.md`): the default for an *unmeasured*
cell depends on WHY — metric-gap/feed-pending → advance full cap; feed-loaded-but-college-
posted-nothing → $0; suppressed(<5) → $0 flagged. Phase-in: only Year-1 "any transcribed"
is measurable today; the rest advance and flip automatically as feeds land. Tests +20 →
**357**. Story in the lessons doc.

**Cont. 2 — column show/hide + eligibility audit:** a **⚙ Columns** menu (county hidden by
default; per-view + persisted; hide via `nth-child` CSS off `activeCols()`, sparing detail
rows; identity column never hideable) + reframed the Elig tooltip/drill-in as the
**participation gate**, separate from earned funding. Tests → **367**. **Queued** (same batch):
per-priority P1/P2/P3 columns with **stacked target/actual cells** (recommended over 2 physical
rows), column resize, and per-column multi-select filters — see the lessons doc.

**Cont. 3 — per-priority P1/P2/P3 columns + numbered Elig pie:** shipped #5+#6 — Eligible†/
Transcribed† → **three P1/P2/P3 columns**, each cell **stacks target over actual** (`target·cap`
top, `actual·earned·%` bottom, `earnFraction`-driven), header hover = goal+metric; compact
`fmtCountK`/`fmtMoneyK` keep it narrow. The Elig ✓/◐/○ glyph → a **numbered SVG pie** (one green
slice per met requirement; N-slice not forced-4 — 2 today, grows as more per-college-checkable
reqs are wired). Tests → **376**. Deferred (Sam OK'd): column resize + per-column filters.

### SkyVid side-lane — CPL Student Portal "Credit for Being You" intro video: audio restoration + accessibility (2026-07-23)

Sam's "work some magic" on the new CPL Student Portal (creditforbeingyou.org) 1:51
intro video — accessibility, warmth, music, "cool & inviting, not salesy," + advise
CC-vs-Claude-Design. All done in-session with `ffmpeg`/`numpy`; **no repo code
touched**, deliverables handed to Sam directly (video binaries not committed).
**(1) Captions** — the auto-`.vtt` had real errors (CLAP→CLEP, CDL→CPL,
credit4Beingu→creditforbeingyou.org) + 11 run-on cues → rebuilt to **22 WCAG-clean
cues** (+`.srt` +transcript). **(2) Voice de-tinny** — *measured band energy +
spectrogram first* (Zoom HPF + 84 kbps AAC, hard 12 kHz brick-wall); restored
80–320 Hz body, tamed the presence edge, two-pass loudnorm to −16 LUFS; Sam picked
"Broadcast," then "warmer still." **(3) Music** — the exported cut had **NO music**
(silence-scan proved it: ~12 true-silent gaps); Sam's YouTube link **and** Demucs
model hosts were both proxy-blocked (403), so the bed was recovered from his
separate mixed export by **subtracting the clean VO stem** (`music = mix − 1.30·voice`,
lag-0, g from least-squares → 15–20 dB voice cancel), warm voice re-laid on top,
rebalanced **+7 dB with ducking**, + a 2 s end-card freeze & music **fade-out**.
Tool advice: CC = audio/caption/encode engine, Claude app = visual/motion
concepting, DaVinci Resolve = timeline. Story: `docs/cpl_portal_video_lessons.md`;
handoff `docs/cpl_portal_video_handoff.md`; KB notes
`methodology-recover-music-bed-by-voice-stem-subtraction`,
`methodology-warm-a-tinny-voiceover-measured-eq`; polish-plan artifact
(https://claude.ai/code/artifact/2222f015-6251-4e3a-87f5-9ebd950f1889). Side-lane —
left `cpl_todos.json` + the numbered handoff to the CCR mainline; did not write the
public KB.

### SkyVeil side-lane — Fact Sheet: per-section "Hide section" toggle (2026-07-23, #874–#876 MERGED, LIVE)

Sam is modeling Implementation Funding scenarios (they change the Fact Sheet's
current-allocations figures + budget table), so he wanted the **Funding** section
hidden "for now," then a **general** control: *"add a hide button to each section
in the curation view; if hidden, suppress it in the reporting functions."* Shipped:
**#874** hid Funding via a new `.fs-withheld` class (page + TOC link + Word-export
strip) — **key gotcha: `factsheet_word.js` un-hides `[hidden]` to flatten
collapsibles, so a `hidden` attribute would REAPPEAR in the export → use a stripped
class**; **#875** the general **🙈 Hide section** toggle (Curate mode, per
reorderable section) — reuses the box-hide plumbing: reserved `<sid>|__hidden`
override + marks the section **+ its TOC link** `.fs-ov-hidden` (the box-hide class
the Word export already strips + `@media print` already hides), so **report
suppression came for free**; **#876** un-hid Funding (byte-identical restore) so
Sam can test the toggle himself (he did — *"Hide function works great"*). New
`tests/factsheet_edit_section_hide.test.js` (24); suite **168 green**. Story:
`docs/fact_sheet_lessons.md` (SkyVeil); KB note
`methodology-hide-must-suppress-the-export.md`. Side-lane — left `cpl_todos.json`
+ the numbered handoff to the CCR mainline.

### SkyFunder side-lane — COBI Implementation Funding tab reorg (2026-07-23, #878–#884 MERGED)

Curator-facing asks on the Implementation Funding tab across three rounds, five JS-only
PRs (all in `cpl_funding.js` — **0 HTML touched**, no Rule-4 mirror, clean of a parallel
Fact Sheet session). **#878:** Total Available Funds card ($44,040,307 = remaining + one-time, live)
· Award-range Avg/Min/Max cards · SYSTEM total row `<tfoot>`→pinned first `<tbody>` row.
**#879 — the architecture:** the 3-layer config (`SCENARIO ?? SHARED ?? BASE`) generalized
to a **shared multi-project / multi-scenario** model in the SAME `cpl_funding_config` row
(no schema change — `SHARED` became a pointer into `projects[pid].scenarios[sid]`; every
accessor unchanged). Top strip `[Project ▾ +Add · area badge][Scenario ▾ +New(clone) ✕]`;
curator-gated create/delete; `+New` clones current; `+Project` clones the CPL template +
tags a COBI area (CPL/C&I/CIP/GR via `CPL_ORGS`); backward-safe `normalizeConfig` migration.
**#880:** the 📄 **Report** sub-tab — an editable **ESS-25-82 memo** generated from the live
model (masthead·TO/FROM/RE·Funding Overview·Priority Outcomes·Allowable Use·Allocation
table·Reporting·Conclusion·cc), doc-type toggle Memo/Letter/Report/Brief, exports Copy/PDF/
**Word** (DOM→docx walker over the repo's `docx.min.js`). Pushback taken: the Letters tab is
a cross-repo iframe (KB Supabase), so the memo lives native + reuses the docx stack.
**#883 (round 2):** editable priority **titles** (Access/Success/Capacity, **year-specific** —
ride the per-slot `prioField`/`setPrio` path) · **Recommended Strategies** editable list per
priority · a **Timing** milestone list (label + optional date, add/delete, 9 seeded) · editable
Baseline-eligibility intro. **#884 (round 3):** **editable/add/delete Funding Pool boxes** —
editable labels (hover-title), ＋Add revenue/deduction + per-box kind toggle, delete-custom /
hide-core behind a `confirm()` warning + restore strip; net generalized to
Σrevenue−Σdeduction−carve-outs (**conserved** — identical to the old formula when no custom/
hidden, test-guarded); carve-outs + computed cards non-deletable; also dropped the duplicate
"% of each tranche" priority header. Tests 266→**325**; all three rounds real-Chromium verified
(0 console errors, no horizontal scroll). Full story: `docs/cpl_funding_lessons.md`. Side-lane —
left `cpl_todos.json` + the numbered handoff to the CCR mainline.

### SkyPlan + StarTeam side-lane — COBI Activities tab reorg (2026-07-22, ✅ MERGED #872, LIVE)

Realigned the Activities tab to the CPL Workplan: **4 Activities** (phantom "Activity 5"
dissolved), every project nested under its parent Activity, the separate Projects grid +
Workplan-Goals Projects table gone, Goal banners dropped (Path A), a cross-cutting
**◆ sprint** tag/filter; Veteran `4.1`(+`4.1.1` 29 Palms) & Apprenticeship `4.2` as slim
Activity-4 nodes, Statewide Adoption → `3.3`; clean renumber (A1:7 A2:4 A3:12 A4:9 + held-out
5.1). **SkyPlan** locked the taxonomy + shipped the spec; **StarTeam (SkyPlan-II)** built the
generator Option-B render (verified offline via a snapshot + local-rekey → render → Chromium
harness, locked by Sam), the consumers + ◆ sprint filter, aligned the report `ACTIVITY_DESC`
titles, and rewired **tabling** onto the nested cards (the `activityLayerIds()` immune gate
was dropped — it marked everything immune post-reorg; all sub-activities are now tableable).
The **live Supabase re-key** ran in Sam's hold — two-phase permutation + inline verification
gate, receipt/SQL `kb/activity_reorg_out/2026-07-21/` — then merged + regen-dispatched. Full
story: `docs/activity_reorg_lessons.md` · `docs/activity_reorg_handoff.md`; KB note
`methodology-adversarial-verify-crosswalk-before-live-rekey.md`. **⚠ One documented
follow-up:** the re-key missed the N-to-N `workplan_activity_associations` table (still holds
old ids + Activity-5 rows → stale "Activity 5" on the Workplan-Goals tab; main Activities tab
unaffected) — ready-to-run fix (both approaches) in the handoff. Side-lane — left
`cpl_todos.json` + the numbered handoff to the CCR mainline.

### StarBOG side-lane — CPL exec decks: BOG update + CBO budget-workshop slides (2026-07-20)

Sam needed two presentation deliverables. **(1) Board of Governors update deck** — 12 slides for his
15-min segment (theme: the 2026–27 CPL funding win, **$7M ongoing + $35M one-time**, supporting Vision
2030): cover · positioning · statewide KPIs (50,154 students · $326M saved · 102 active colleges) · the
funding win · **COBI 3 priorities** · CPL Portal soft-launch · My CPL Story · EMT video · Moreno Valley
EM B.S. pathway (illustrative) · partnerships · Fire/CSTI hand-off to Miramar · close, **speaker script
in every slide's notes** (`presentations/build_bog_deck.py`; also a private draft artifact; PR #808
opened → **Sam closed it**, took the file). **(2) CBO budget-workshop slides** — 3 slides on the $35M
one-time → COBI 3 priorities + guiding principles (amounts held per Sam), **filled natively into the CO
"2026 Annual Budget Workshop" template's CPL section** (slides 17–19): read `theme1.xml` for the CCC
brand (Source Sans Pro; navy `002F6D`/blue `0066BA`/gold `FFB600`), reused the content layout, set the
native title, drew shapes in the body band, reordered `sldId`s; validated + QA-rendered
(`build_cbo_slides.py`, `fill_template.py`). **Tooling:** installed `libreoffice-impress` + `poppler`
(not preinstalled); fallback = pptx→HTML + Chromium. New KB note
`playbook-building-cpl-executive-presentations.md`; lessons `docs/cpl_presentations_lessons.md`.
Side-lane — **left `cpl_todos.json` + the numbered handoff untouched**; **did not** write to the public KB.

### StarEmber side-lane — Fire & EMS CPL eligibility: statewide vs local (2026-07-20, read-only)

Sam's data ask: how many MAP students have eligible credit + how many credits for
**statewide** credit recommendations in **Fire / EMT / EMS / Wildlands / Paramedic**,
then the **local** ones too, then "drop into a filtered view." All answerable from the
committed CER rollup (`credential_reference_data.js`: `students_served` +
`eligible_credits` per credential; `statewide` flag = tier) joined to the statewide
category map — **no pipeline/code change, no live MAP fetch.** Answer (2026-07-20 pull):
statewide **27 creds · ~238 students · ~1,946 credits**; local **142 · ~251 · ~2,567**.
Two findings: (1) the locals visibly **mirror the statewide series** (colleges built on
them — local Fire out-counts statewide Fire); (2) **"statewide" has two divergent
definitions** — the CER flag = `has_ccc` (has a CCC-Collaborative *articulation*,
`export_credential_reference()` ~L6890/6909), which is **not** "on the statewide CPL
page," so **Paramedic License** (18 stu / 721.5 cr) reads *local* and swings the paramedic
split. Deliverable: a private **filtered-view artifact**
([link](https://claude.ai/code/artifact/36e7fb36-10a7-44a3-a631-d0ec591ccc4c)). Docs:
`docs/fire_ems_eligibility_lessons.md` · `docs/fire_ems_eligibility_handoff.md` · KB note
`methodology-area-eligibility-rollup-from-cer`. Side-lane — left `cpl_todos.json` + the
numbered handoff to the CCR mainline.

### SkyCIP side-lane — CIP Coder (Beta): the Review-tab UI redesign (2026-07-20, #850/#851 MERGED)

Sam co-designed the Review-tab look in a fast-feedback artifact
([final](https://claude.ai/code/artifact/4369b106-abe8-4149-abf6-571d325bf508)),
locked it ("obsessed with this new version"), then "get this into prod." Two merges:
**#850** the confidence-scoring rework (a title-match signal makes the same-title CIP
win its TOP; de-inflated ABSOLUTE confidence — obvious pick 80%, capped 95; crosswalk
stays primary, outside match a "worth a look" hint) and **#851 — the UI redesign PORT**:
the tool is now titled **"CIP Coder (Beta)"** (eyebrow +Academic Affairs, trimmed intro).
**Sticky College + Subject + count-tiles** — the college bar pins `top:0`; the tiles ride
their OWN list-sibling host (NOT the short summary host, or a sticky element unsticks the
moment its parent scrolls past) pinned at the college bar's **measured** height
(`syncStickyOffsets`, rAF+resize) → switch subjects/colleges without scrolling up. **White
row gutters over a faint list field** (`--cipx-row-sep`/`--cipx-rev-field`) so each inline
"why" note brackets with the course above; **expanded course = a "package"** (accent spine +
framed top + tint); a non-functional **"COCI Sync'd" destination tile** (dashed, count 0,
"In Development") so the tiles read as the pipeline **All → Review → Ready → COCI Sync'd**;
glyph-free mode tabs; Department → **Subject**; tiles centered; Manual tile hidden at 0.
226 CIP jsdom assertions / 166 files; real-Chromium Chaffey BIOL (light/dark/phone, 0
overflow/0 errors). **Held for a follow-up:** the prototype's %-in-box (the real `cipBox`
has more states). A post-merge GitHub Pages **503 outage** (not the code) left the site
stale — fixed by a fresh `workflow_dispatch` of `pages.yml` (NOT `rerun_failed_jobs`, which
duplicates the `github-pages` artifact → "Multiple artifacts" error; new playbook +
Troubleshooting entry). Full story: `docs/cip_crosswalk_lessons.md` ·
`docs/cip_crosswalk_handoff.md`. Side-lane — left `cpl_todos.json` + the numbered handoff untouched.

### StarBoard side-lane — dethroning TOP: from gatekeeper to last-in-line signal (2026-07-16, #799/#800 MERGED)

Sam: *"unburden our schema from the tyranny of TOP … it should not be used for
gatekeeping or primary determinations … a last-in-line signal that nudges edge
cases … fuzzy for search/filter."* A 4-agent audit (all 3 repos) found the doctrine
**~80% already built** (confidence/source ladder, TOP weighted 0.10, blanks-only
fills) — the gap was **wording + two real leaks**. **Blast radius: 24%** (17,059 of
71,076 disciplined rows reach `discipline` via a 0.4–0.5 TOP guess). **The leak:**
`_seed_canonical_subj4.py` let a TOP guess vote on + fold into the M-ID SUBJ4
identity, and `_row_audit.py` scored TOP-sourced `inferred-high` (= subject_map).
**PR A #799** — doctrine anchor (`methodology-top-is-a-last-in-line-signal`), §7
TOP caveat, ~8 prose passages softened, `_row_audit.py` TOP demoted →`inferred-low`,
`merge_flag`/`_overmerge_apply` fixes. **PR B #800** (Sam's *"gate identity, keep
display"* ruling) — shared predicate `kb/_top_gate.py`, seed excludes TOP rows from
the canonical-SUBJ4 vote (+`top_only`/`corroborated_voters`), read-only dry-run
`kb/top_gate_out/2026-07-16/`. **Headline: the gate changed 0 of 146 canonical
values** — corroborated rows already carry every anchor, so it's provably
non-disruptive. Deferred (Rule 7 dispatched): fold-apply enforcement; the tiny
`excel_to_dashboard.py` fallback-label; a curation-gated public-KB caveat. CIP
(fall-2026 cutover) is the systemic exit — same "corroborate, don't gate" posture.
Full story: `docs/top_dethroning_lessons.md` · `docs/top_dethroning_handoff.md`.
Side-lane — left `cpl_todos.json` + the numbered handoff to the CCR mainline.

### SkyNew side-lane — the CIP site: TOP↔CIP Crosswalk tab + suggest-to-curate (2026-07-14)

The CO is transitioning course/program coding **TOP→CIP fall 2026** (ESS 26-06).
ESS built a searchable Excel workbook to email to the field; Sam asked for a COBI
tab that **replaces** it. Shipped a **third COBI area — CIP** (beside CPL/C&I in
SkyFlyer's org layer: `cobi_orgs.js` `ORGS[]` +1, `?org=cip` → COBI ᶜᴵᴾ, tabs =
CIP Crosswalk + COCI Lookup) + the top-level **CIP Crosswalk tab** (`#cip-crosswalk`,
Reference & Curation group). `cip_crosswalk.js` (`window.CPL_CIP_CROSSWALK`, lazy,
scoped `.cipx`) searches/filters the crosswalk (**420 TOP · 2,325 CIP · 5,353
mappings**, normalized in `cip_crosswalk_data.js` from
`kb/reference/cip_searchable_260708.xlsx` via `kb/_build_cip_crosswalk.py`),
row-expands to CIP definition + 2020-CIP transition badges (New/Deleted/Moved) +
SOC occupations + provenance + the colleges-with-pairing list + a **"COCI courses
with TOP N"** deep-link (added TOP to the COCI search haystack). Faculty file
**suggested changes/notes** open/anon (Quick-Adopt pattern) → Supabase
`cip_crosswalk_suggestion` (anon INSERT-only, no public SELECT; queue read gated
by `is_allowed_reviewer() OR team_pass_ok()`; `kb/supabase_cip_crosswalk_suggestion.sql`,
MCP migration `cip_crosswalk_suggestion_intake` on Work Plan). **#771** added a
**transfer (C-ID) marker + filter** (CO prioritizes transfer first; COCI has no
CSU/UC-transferable flag, so C-ID presence is a labeled floor — `top[code].cid/crs`
rolled up from `coci_course_list.xlsx`). **#772 = the reference-manual pivot:** Jenni
Abbott (CO AA) confirmed TOP→CIP is **one-to-many** (data: only 9% of TOP are 1:1),
the **Tech Center owns the COCI CIP-dropdown** data entry, and ours is the **reference
manual** (successor to the TOP Code Manual) — so a **"Browse all CIP codes" view**
now surfaces all **2,325** federal CIP codes (incl. 181 that had no TOP mapping) with
narrative definitions. The planned canonical-CIP-designation curator surface was
**dropped** (1:1 premise false). Tests: `tests/cip_crosswalk.test.js` (44) +
`cobi_orgs.test.js` (33); real-Chromium verified, 0 console errors; RLS verified live.
Full story + continuation: `docs/cip_crosswalk_lessons.md`. Side-lane like
SkyFlyer/SkyIron — left `cpl_todos.json` + the numbered handoff untouched.

### SkyLiftoff side-lane — the TOP→CIP "easy button" (course-first recommend mode) (2026-07-17)

Shipped SkyLoft's queued priority. The `#cip-crosswalk` tab gains a **second mode**
(segmented toggle, Browse default, remembered): **🎯 Find my course's code** — pick your
college + a course → the tool reads its COCI description, looks up its **current TOP**, and
ranks the CIP codes the **official crosswalk** maps from that TOP by description-fit. The
**two-signals-agree gate** (§7 TOP caveat) made visible: crosswalk PROPOSES, description-fit
RANKS, faculty CONFIRMS — TOP never decides. Top strong+clear candidate → ✓ **Recommended**;
weaker ones sit below with honest tiers; a strong match the crosswalk misses → a separate
**⚠ "outside the crosswalk"** drawer (auto-opens when no clear winner); the 2 universal
noncredit boilerplate CIPs collapse away; matched-term chips + muted provenance labels
(official/field-submitted). Data: `kb/_build_cip_crosswalk.py` re-emits a compact
`topcip` map (420 TOPs · 4,865 pairs · `boiler`) into `cip_crosswalk_data.js` (embedded,
parity-exact on the 2,325 reference rows). Tests 60→**84**; real-Chromium desktop+phone,
light+dark, 0 overflow/0 errors; Fable consulted on the design fork. **Next: Phase 2 —
the whole-catalog review sheet** (the `_recommend` seam returns everything a batch pass
needs) + the standing **WCAG** gate. Full story: `docs/cip_crosswalk_lessons.md` ·
`docs/cip_crosswalk_handoff.md`. Side-lane — left `cpl_todos.json` + the numbered handoff untouched.

### SkyLoft side-lane — CIP Code Taxonomy + the "Check a course" fit tool (2026-07-16/17, #798–#816 MERGED)

Sam: "get the mockup into production on COBI," then a live-testing sprint. The
`#cip-crosswalk` tab is the CIP-2020 **reference manual** (search + plain-English
finder + category pills + 🎓 C-ID/CCN chip + family filter over all **2,325** codes;
certified CTE `cat`) **plus** an inline **"Check a course against this CIP"** tool.
Arc, all merged: **#798** port of StarCIP's locked mockup (nav "CIP Crosswalk"→"CIP
Codes", backend-free, lean `{fams,rows}` off the 260715 cut, certified CTE 244/244);
**#802** UX polish (self-contained dark toggle, wider intro, rounded chips, one
consolidated search, muted badges); **#813** the Fit-Check Phase-0 engine
(IDF-weighted lexical match of a course description vs each CIP's definition —
Strong/Plausible/Weak + margin discrimination; grounded, no backend); **#814** the
**inline redesign** — pick your **college** once (remembered), pick a **course** →
its **COCI description** auto-scores against the code (per-college `cip_fitcheck/`
lazy-fetched, ~50MB split so the browser pulls ≤1MB); **#815** the **coverage
factor** (a course's *fundamental purpose* wins — an incidental "cost accounting"
mention no longer reads Strong for Accounting; light touch, `rel%` picks the tier);
**#816** scroll-preserve on expand + a **searchable custom combobox** (opens below,
type to filter ~1,500 courses). Engine seams `_score`/`_courseScore`/`_courseToks`;
tests 60; real-Chromium desktop+phone, 0 overflow/0 errors. **Method note:**
`docs/kb-notes/methodology-grounded-lexical-cip-confidence.md`.

**🎯 QUEUED for SkyLiftoff — the TOP→CIP "easy button" (Sam's priority):** every
course has a current **TOP**; the CO's official **TOP→CIP crosswalk** (median 5
CIPs/TOP, 32% ≤3; `cip_searchable_260715.xlsx` TOP-CIP Data) gives the candidate
CIPs → **rank them by description-fit** = the two-signals-agree gate (§7 TOP caveat).
Phase 1: show current TOP + ranked crosswalk CIPs (✓ Recommended when both agree, ⚠
on disagreement) + course-first entry; small data lift (re-emit `TOP→[CIP+prov]`).
Phase 2: whole-catalog review sheet per college (1,500 courses → recommended CIP →
confidence). **🔒 WCAG audit is the standing pre-field gate.** Full story + the
paste-able capsule: `docs/cip_crosswalk_lessons.md` · `docs/cip_crosswalk_handoff.md`.
**Side-lane — left `cpl_todos.json` + the numbered handoff untouched** (CCR mainline owns those).

### StarCIP side-lane — CIP Code Taxonomy: the "easy button" reference + finder (2026-07-15, PROTOTYPE → ported #798)

Jenni Abbott's email feedback pivoted the CIP tab: **don't recreate the crosswalk**
(COE hosts it), the product is the **full CIP list as the authoritative reference**
(successor to the TOP Code Manual) — **simple, an "easy button"** for faculty,
replacing the 6-tab Excel workbook the CO would email out. Built as a **fast-feedback
artifact** (prototype→lock→port; **not yet ported to `cip_crosswalk.js`**),
refined live with Jenni: one search box + the full CIP list, the **category label
(CTE/Non-CTE/Both/Noncredit) visible per row**, a **🎓 C-ID/CCN** toggle chip (course-
level floor, not "Transfer"), a **plain-English finder** (Phase-0 no-backend
keyword+stem ranker — zero hallucination; Phase-1 = wire Sierra `/functions/v1/cpl-chat`
once CO OKs finder-not-decider), light/dark toggle. **Data crux (carries to the port):
CTE label = the CO consultant's CERTIFIED designations, not either workbook tab** —
the *Descriptions* and *crosswalk* tabs disagree on **244 codes in both directions**,
neither reliable (Jenni's 45.0702 catch). Certified authority preserved
`kb/reference/cip_cte_certified_260715.json`; refreshed to the **260715 cut**. Prototype
+ scripts: `docs/cip_prototype/`; KB note `methodology-conflicting-source-tabs-use-certified-value.md`.
Full story: `docs/cip_crosswalk_lessons.md`. **Side-lane — left `cpl_todos.json` + the
numbered handoff untouched** (CCR mainline owns those).

### SkyFlyer side-lane — COBI org layer: the C&I subsite pilot + "Our Process" tab (2026-07-14, #765–#768 MERGED)

Sam's Chancellor's Office talk → the CO **Curriculum & Instruction** team (Dean
Arambula, D. Garcia) wanted their **own COBI (C&I) site**. Shipped the pilot org
layer per `docs/co_platform_strategy.md` (**one platform, org as a view dimension —
NOT a repo/site per org**): a masthead **site-switcher** (`cobi_orgs.js` — CPL / C&I,
per-site ᶜᴾᴸ/ᶜ&ᴵ wordmark tag, nav-filtered, `?org=ci` shareable, **no gating**, #766)
+ the **"Our Process" viz tab** (`our_process.js`, #765) + masthead polish (#767 —
search→right, Go button dropped/Enter submits, seal 46→60px) + the **C&I curation
phrase `ci-team-2026`** (#768, live via Supabase; `team_pass_check` now matches any
cohort). Per-area DATA isolation is deferred (Rule 9 — today both phrases unlock the
same tables). Full story + the 4 open tuning calls: `docs/co_platform_orglayer_lessons.md`;
decision: `docs/kb-notes/adr-cobi-org-layer.md`. Parallel track — the curation
`cpl_todos.json` + numbered handoff were left untouched.

### SkyIron side-lane — 🎓 CPL Pathways: three course maps + Quick Adopt (2026-07-10, #732–#736 + #740 MERGED)

New top-level **🎓 CPL Pathways tab** for the **California Apprenticeship Council (Aug 13)**
deck — CPL check-offs **derived live from the CER dataset**, one data-file object per program.
Three views on the picker: **Cerritos Field Ironworker Supervisor BS** (#732/#733 — 15 IWAP
courses ✓ **31.5u**, the billboard number; ◆15u CLEP → **39%** of 120u; status stages 📝
Discussion Draft default + ⬇ PDF); **Foothill Dental Hygiene BS** (#735 — ✓0/◆17qu/9%, the
ADOPTION map: violet **⊕ chips** live-derive where OTHER colleges articulate — West LA's
RDA (11 courses) + RDH precedent); **Foothill Respiratory Care BS** (#735 — the VISIBILITY
map: Foothill's catalog already awards **24qu CPL** for NBRC+RCP licensure, invisible to MAP).
**#736 ⚡ Quick Adopt v1:** every ⊕ panel takes an adoption request → new Supabase
`cpl_adoption_interest` (anon INSERT-only, no public SELECT; team lane pending). **#740:**
page title/og → "COBI ᶜᴾᴸ" (generator-owned) for Teams unfurls. Suite +`cpl_pathways` 97;
Sam's link out to colleagues. Full story + continuation: `docs/cpl_pathways_lessons.md` ·
`docs/cpl_pathways_handoff.md`. Parked: the CCC catalog→Supabase harvest (todos).

### StarRunner side-lane — CPL Pathways: the DIRECTORY tier, every CCC bacc (2026-07-14)

Sam: expand CPL Pathways to **all CCC baccalaureates**; dropdown not chips; push
back. Pushback taken — hand-curating 40+ full course maps is unsourceable
(catalog bot-blocks, no course→program join), so the tab is now **two-tier**:
the 3 deep **Featured** maps stay, plus an auto **Directory** card per
baccalaureate (**45**, `cpl_baccalaureates_data.js` from the COCI program
export via `kb/_build_baccalaureate_pathways.py`). Keystone: **CER carries a TOP
code on every articulation** → each card **live-derives** the college's own
in-field CPL (✓), the peer **adoption pool** (⊕ + ⚡ Quick Adopt, e.g. Automotive
= 82 adoptable from 27 colleges), the same-field **cohort**, and GE-CLEP — with
a mustard **"CPL frontier"** banner where nobody's articulated yet
(Biomanufacturing, Respiratory). Chip picker → grouped `<select>` (★ Featured +
per-field optgroups); pool caps at 20 with Show-all. **Metric = COURSE COUNTS**
(#777): dropdown shows `current/potential courses`, ✓ tile `courses ·
credentials` — Sam flagged CPL *units* as "sus" (they double-count competencies:
4 courses → 1 ASE area), course counts read as coverage not degree-credit.
#774/#775/#777 MERGED; tests 97→**137**; real-Chromium verified.
**Spin-off — CER credential-merge doctrine (Rule 8c), APPLIED #778/#779:** the
"sus count" dig opened the CER exhibit-credential merge lane (NOT the CCR's M-ID
course convergence — wave 4 skips it). Rule 8c (in `exhibit-canonicalization`
SKILL.md): (1) `(with Practical Assessment)`-style qualifiers collapse into the
base cert; (2) industry-cert vs local-Cx is a SPLIT not a merge (why the
automotive count is legitimately large); (3) narrower competency doesn't fold;
(4) read the curator's own issuer before assuming a mis-issue (Rule 9). Applied
via `cred-rename-apply.yml`: 10 ASE `(with Practical)` folds + the Long Beach
`Automative` cluster (6 folds + 2 spelling fixes; `issuer=ASE` was Sam's
deliberate curation, so 8c-4 self-corrected). Receipts:
`docs/ase_practical_merge_scope.md`, Supabase `merge_doctrine_notes`. Left
`cpl_todos.json` + the numbered handoff untouched (CER mainline owns those).
Story: `docs/cpl_pathways_lessons.md` · `docs/cpl_pathways_handoff.md`.

### StarMarathon side-lane — CPL Pathways: the retired-course filter (2026-07-14, #782 MERGED)

Cleared StarRunner's 🔑 priority finding: MAP keeps **retired/renumbered course
numbers** alive as articulations (Santa Ana's retired `AT`-series + old
`AUTO 53/A1/B33` beside current `AUTO 111–119`), inflating the directory ✓ count
(31 → **12 courses · 18 credentials**). New sidecar `cpl_coci_course_keys.js`
(emitted by `kb/_build_coci_lookup.py` from the same rows as `coci_lookup_data.js`)
lets `cpl_pathways.js` filter the ✓ list to courses in the **current MAP course
catalog** — **fail-open** (college absent / no catalog → keep), so it can *never*
drop an active course (that property also resolved Sam's active-vs-inactive
export question). Only ✓ is filtered; the ⊕ pool stays inclusive. Tests 137→143;
real-Chromium verified. **Cross-lane flag → the numbered mainline:** the ROOT fix
is a **systemwide stale-articulation signal** in the CER/CCR generator (flag any
articulation whose `(college, subj, num)` is absent from the current catalog) —
tightens EVERY count, reuses the all-college `CPL_COCI_COURSE_KEYS` set. Left
`cpl_todos.json` + the numbered handoff core untouched. Story:
`docs/cpl_pathways_lessons.md` · KB note
`methodology-filter-live-counts-against-current-catalog.md`.

### StarX side-lane — CPL Pathways: the Common Course Reference engine + two-view redesign + feeder fields (2026-07-15/16, #794/#796/#797 MERGED)

Sam's "foundational" dig at the Auto CPL Pathway → a full redesign of the directory
cards. **Doctrine landed (Rule 8c already had the credential-merge calls); this is a
NEW course-identity join.** Three merged PRs: **#794 — the CCR engine**
(`kb/_build_cpl_pathway_ccr.py` → `cpl_pathways_ccr_data.js`, keyed
`<NORMCOLLEGE>|<top4>`): per course the **local (searchable) cert(s)**, its **Common
Course Reference** (C-ID/CCN/minted M-ID via `coci_minted_memberships`), **units**,
**peer field-agreement**, **course-grain adoption opportunities**, and a
**cross-field over-merge flag**. Field is **grouped by** the CATALOG 4-digit TOP (a
membership *proxy* — COCI has no course→program join — not an authoritative field key;
see the TOP caveat), which is at least less-noisy than `coci_articulations`' 2-digit
division stamp. Daily-fresh (workflow step). **#796 —
feeder fields** (`kb/pathway_feeder_fields.json`): a multidisciplinary program
aggregates CPL across lower-division feeder disciplines under OTHER TOP codes — fixed
Miramar Public Safety Management (empty → **34 courses / 104u** of Fire/EMS/AJ CPL for
the board deck with the Fire faculty workgroup); flag now compares each course's OWN
field. **#797 — the two-view render** in `cpl_pathways.js` (`renderCcrViews`, fails
open): **🎓 Explore CPL (student)** = course + local cert ("Qualify with X OR Y"), clean;
**🏛️ Curate & validate (college)** = + CCR chip, field-agreement, opportunities, ⚠ flags.
Mockup ([artifact](https://claude.ai/code/artifact/647293d9-57b4-498c-9e41-418e0545be01))
locked live with Sam. Tests: `cpl_pathway_ccr` (21) + `cpl_pathways_ccr_render` (17);
suite 164 files green. **Design seams for later:** the feeder JSON is the interim form
of a Supabase **program-supplement** store (`in_coci:false` reserved for
not-yet-in-COCI courses). **Deferred:** the per-college coordinator/landing contact
block (`map_college_contacts` — Miramar coord = Suzanne Freeman); the **AUTO 116 →
Construction (`CNST M1062`) split re-mint** for the CCR mainline queue; competency-spine
adoption view (Sam parked, wants to explore later). Story + continuation:
`docs/cpl_pathways_lessons.md` · `docs/cpl_pathways_handoff.md`. Side-lane — left the
numbered handoff + `cpl_todos.json` untouched (CCR mainline owns those).

### Session 117 — StarMarcus: closed the doctrine's last open forks → v0.13 + the ESL dry-run payoff (2026-07-15)

Sam wanted "back in the interrogation room." Two grounded 3-fork scenario batches
(profile-before-edges) closed **every remaining named open fork** — Sam swept all
6 with the recommended calls: **Q-HONORS→P-13** (honors folds to base; standalone
honors-program courses keep identity), **Q-UNITS→P-5** (a big spread on a
non-standardized course = whole-vs-part split signal, not a cap), **Q-XDISC→D-8**
(same-subject-code → canonical SUBJ4; diff-code collisions → P-12 homonym gate),
**Q-VARIANT→P-13** (Lab folds; Refresher & Bridge stay separate — the D-4 marks
don't share one rule; each reduces to P-1). Doctrine **v0.12→v0.13** (#791). Then
the payoff: the **ESL packaging dry-run** (#792) — the real 2,364 ESL identities →
Beginning 1,305 / Intermediate 548 / Advanced 296 + carve-outs (Citizenship 38 ·
VESL 155 · Transfer-review 22), measurement-only (`kb/esl_package_out/2026-07-15/`)
+ a visual artifact. Full story: `docs/ccr_convergence_lessons.md` (batches 6–7 +
ESL dry-run). Handoff: `docs/session_118_handoff.md`.

### Session 115 — StarMagna: the doctrine graduation gate → a scenario-refinement cascade (v0.6 → v0.11) (2026-07-14)

Picked up the CCR mainline (wave 4 staged, not run). Sam chose the **doctrine gate
first**: ran the **v0.6 calibration re-seed** as two blind instruments (regression
vs his ratified calls + a fresh held-out sample) → **92% fundamental / 94.7% fine
after his rulings → the doctrine GRADUATED** (#784/#785). Then a **scenario cascade**
via small AskUserQuestion batches took it to **v0.11** (#786–#789): P-6 same-college
merge form, P-1b + Q-FLOOR bound, P-7 generic umbrellas, the 3-rung ladder cap, the
**ESL 3-comprehensive collapse** (2,364→3 + transfer/Citizenship/VESL carve-outs),
FL numeric rungs, the Music/Dance activity doctrine (**Q-TARGETCOUNT fully settled**)
+ the permutation-pressure lever. **7 of 11 open Qs closed; ~6,600 identities**
(ESL/Music/Dance/KINE) now have a packaging policy; whole-worklist batch-apply
authorized. Product insight: small curated scenario batches beat the thousands-strong
🧠 panel (Sam had bounced off it). Full story: `docs/ccr_convergence_lessons.md`
(batches 1–5); method: `docs/kb-notes/methodology-curated-scenario-batches-doctrine-elicitation.md`.
Handoff: `docs/session_116_handoff.md`.

## Troubleshooting

### Dashboard not updating
1. Check the GitHub Actions run — Actions tab in GitHub
2. Check `live_metrics.json` → `scraped_at` timestamp
3. Check if commit was pushed (`git log origin/main -5`)
4. If browser shows stale content, hard-refresh (Ctrl/Cmd+Shift+R)

### Pages deploy failed / site still stale after a merge
1. The merge landed on `main` but Pages didn't publish → check the **"Deploy
   Pages (lean)"** (`pages.yml`) run for that commit (Actions tab).
2. A transient Pages **503** (`No server is currently available` / `is
   githubstatus.com reporting a Pages outage`) fails ONLY the final deploy step —
   the lean-site assembly + served-path assertion passed, so the build is fine.
3. Fix = re-deploy by **dispatching a FRESH run**:
   `mcp__github__actions_run_trigger run_workflow pages.yml ref main`. Do **NOT**
   `rerun_failed_jobs` — re-running the job re-runs the upload step, leaving TWO
   `github-pages` artifacts → `deploy-pages` fails with *"Multiple artifacts named
   github-pages"*. Playbook: [`docs/kb-notes/playbook-github-pages-manual-redeploy.md`](docs/kb-notes/playbook-github-pages-manual-redeploy.md).

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
  `excel_to_dashboard.py`. Verify the strip block anchored on the
  `/* ═══ MAP Articulation Analysis Cards ═══ */` start/end markers (plus the
  legacy "MAP Exhibit Analysis Cards" pattern) still runs before re-injection.
  (There is no `EXHIBIT_CSS_MARKER` symbol in the code — don't grep for it.)

### `kpi_history.json` 1d delta shows stale comparison
- Check for date gaps in the JSON. If yesterday is missing, backfill with
  `"_interpolated": true`.

### Stop hook demands an amend on a `noreply@github.com` commit (REMOTE sessions)

**Do NOT amend. That commit is GitHub's own squash-merge, it is on `main`, and
amending it rewrites `main` — Rule 5.** The nag is a false positive.

**Why it recurs in Claude-Code-on-the-web sessions (diagnosed 2026-07-30, three
times in one session before the cause was found):** the repo ships an improved
hook at [`scripts/stop-hook-git-check.sh`](scripts/stop-hook-git-check.sh) that
excludes `noreply@github.com` (squash-merges) and
`github-actions[bot]@users.noreply.github.com` (the daily cron, #939). CLAUDE.md's
install step is `cp scripts/stop-hook-git-check.sh ~/.claude/` — **and that works
on Sam's local machine, but NOT in the remote sandbox.** The harness *re-provisions
its own copy* of `~/.claude/stop-hook-git-check.sh` (together with
`session-start-git-identity.sh`, `stop-hook-reply-gate.py`,
`user-prompt-submit-reply-reminder.py` and `launcher-settings.json` — all get the
same fresh mtime), silently reverting the repo version mid-session.

So in a remote session:
- Copying the repo hook clears the nag **until the next re-provision**, then it
  returns. Don't keep re-copying and don't treat it as newly broken.
- Check with `grep -c 'noreply@github.com' ~/.claude/stop-hook-git-check.sh` —
  `0` means the harness copy is active (the repo copy has 5).
- The correct response is always: **verify the flagged commit's committer is
  `noreply@github.com` (or the cron bot) and that it is an ancestor of
  `origin/main`, then ignore it.** `git log -1 --format='%h %ce %s' <sha>`.

### docx library errors
- Local `docx.min.js` is v8.0.4 UMD, 334KB. CDN versions were unreliable — do
  **not** switch back to CDN. To refresh the local copy:
  `npm pack docx@8.0.4`, extract, copy `umd/docx.min.js`.
