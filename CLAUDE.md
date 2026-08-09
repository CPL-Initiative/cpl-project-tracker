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

8. **Document at context checkpoints.** **Run `python3 kb/_docs_audit.py` FIRST
   at every checkpoint** — the docs **lint** pass (Rule 8 is *ingest*, sessions
   are *query*; this is the third operation, and its absence is why the corpus
   accretes). READ-ONLY, ~2s, writes `kb/docs_audit/<date>.md`. Act on what it
   flags **in scope for this run**: an `oversized_doc` on the lessons doc you
   were about to append to means compact it now instead of growing it; an
   `always_loaded` flag on this file means move prose to `docs/reference/`.
   After writing the new handoff, `--apply` stamps the now-superseded ones
   (its only mutation — never the authoritative one, idempotent). Rationale +
   the vault-weight finding:
   [`docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md`](docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md).
   Roughly every ~100K tokens of context
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

## Working with the MAP team (added Session 120, 2026-08-05)

The team is growing beyond Sam — **Ashley, Jessica, Malone** and others now use
Claude Code directly, most of them new to it and expert in MAP. The human-facing
guide is [`docs/working_with_claude_code.md`](docs/working_with_claude_code.md)
(send new people there). These are the session-side obligations, and they exist
because **a habit that depends on a new user remembering it will fail on their
first day.** Do the remembering for them.

- **Know who is driving.** If a session's author isn't obvious, ask once, early,
  in one line. When someone supplies a fact, a contact, or a judgment, record
  **who and when** alongside it (the provenance tiers in `map_users.js` are the
  worked pattern). A curator's knowledge is a first-class input — attribute it,
  don't launder it into an anonymous value.
- **Their domain knowledge outranks your inference.** They live in MAP daily.
  When a team member contradicts something derived, believe them and record the
  correction; when they supply a value that violates a rule you set for
  yourself, check whether the rule should have applied to *them* (a web lookup
  may not name an individual; a curator may — they know who answers).
- **Offer the tab.** When a deliverable will be wanted again, or its numbers will
  drift, say so and offer to build it as a tab instead of a chat table or an
  export. Sam's framing to Ashley: *a tool you come back to, not a one-time Excel
  sheet.* Anything handed over in chat is a snapshot — if you hand one over, say
  that it is one.
- **Show, don't describe.** Offer a visual/mock-up early for anything with a
  shape to it. Reacting is easier than specifying.
- **Call the effort level (added Session 128, 2026-08-08).** At the top of a
  substantive piece of work, say in one line whether it warrants ultracode /
  multi-agent fan-out and why — don't make the user guess a dial they have no
  way to calibrate. **The governing test is whether a hit is cheap to VERIFY**
  (Sam's refinement, 2026-08-08, from *"sometimes better to be lucky than smart"*):
  fan-out is **manufactured luck** — more independent draws raise the odds one
  lands — and luck only pays when you can recognise the hit. A bug reproduces; a
  suppressed cell either is or isn't recoverable by subtraction; **fan out there**
  (also the usual shape of MISS-risk: many files/surfaces, audits, unknown-size
  discovery). A definition, a naming call, where credit belongs in the Sprint —
  nothing to score candidates against, so **stay single-threaded and think harder**
  (WRONG-risk). A majority among agents is not evidence; it regresses toward the
  most common intuition, which is precisely what fails on a counter-intuitive
  problem — Sam's framing: *too many cooks in the kitchen can lead to chasing our
  tails endlessly.* Before either, **check whether this repo has already answered
  it**: the best catches of the last several sessions came from re-reading a
  committed note, not from generating a new one. Human-facing version:
  `docs/working_with_claude_code.md` §9.
- **Explain approval requests in plain language.** Before a write that touches
  shared ground, say what changes and who else sees it — don't assume a new user
  can infer blast radius from a command.
- **Flag cross-impact before acting, not after.** Shared Supabase tables, the
  public dashboard, the daily cron, the public KB, anything with staff/student
  PII, anything reaching colleges. Also ask whether another session is live —
  Sam frequently runs several, and a later write silently wins.
- **Offer the checkpoint.** Near the end of substantial work, or when a session
  is winding down, proactively offer `/checkpoint` rather than waiting to be
  asked. What isn't written down dies with the session, and a newer user has no
  way to know that.
- **Say what you can't do, early.** No Teams/email sending (drafts only, a human
  presses send), no MAP writes (read-only system of record), no unattached
  repos, no visibility into other sessions except through committed docs.

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
runs on Sam's Windows Task Scheduler every 60 minutes (default lowered from 15
on 2026-08-09 — work lands a few times a day, so 24 pulls/day is plenty; run the
script by hand when you want the vault current immediately), fast-forward-pulling
`cpl-project-tracker` + `cpl-knowledge-base` from origin into the canonical
`Documents\GitHub\COG-second-brain` vault root (`$vaultRoot` repointed
2026-05-28, PR #178). KB notes (and every other repo doc) appear in Obsidian
automatically. The script is strictly
safe: never auto-merges, skips repos with uncommitted work, logs to
`.vault-sync.log`. Setup walkthrough:
[`docs/kb-notes/playbook-vault-sync-setup.md`](docs/kb-notes/playbook-vault-sync-setup.md).

Vault-side hygiene: heavy non-markdown paths are excluded in Obsidian's
**Files & Links → Excluded files** so the graph stays clean. **The authoritative
list is generated, not prose** — `python3 kb/_docs_audit.py` emits a paste-able
`userIgnoreFilters` block in `kb/docs_audit/<date>.md`; the live copy is
`CPLBrain/.obsidian/app.json`. (Corrected 2026-08-09: this paragraph used to
*claim* `unified_courses_*.js` and `cip_fitcheck/` were excluded and the live
`app.json` excluded neither — 164 MB. A documented exclusion is not an applied
one, which is why the list is now generated from what is actually on disk.)

⚠️ **Exclusion is a relevance filter, not a performance one.** It drops paths
from search, graph and link autocomplete; it does **not** stop Obsidian's file
watcher, metadata cache, or Sync. If the vault is slow to OPEN, excluding more
paths will not fix it — the files have to leave the disk.

**The fix is a docs-only sparse checkout of the vault clone
(`scripts/sparse-vault-clone.ps1`): 1,766 files / 1,072 MB → 447 files / 11 MB,
verified, reversible with `-Revert`.** The vault clone is a read-only mirror
(`sync-vault-clones.ps1` only fast-forward pulls it; real work happens in the
working clone at `Documents\GitHub\cpl-project-tracker`), so it has no use for
build outputs. Sparseness survives `git pull`; the sync script logs a NOTE if it
ever regresses. ⚠️ Do **not** re-scope this by file extension —
**`kb/row_audit/` is 418 MB of MARKDOWN**, so a "materialise `**/*.md`" rule
would keep 423 MB and look like it worked. Scope by LANE. Procedure + the
measurements:
[`docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault.md`](docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault.md);
corpus finding:
[`docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md`](docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md).

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
| **NC / Learning Partners** | Noncredit + not-for-credit + adult-school + ROP + HS-Cx + apprenticeship CPL — the thinking doc, the six modes, and the COBI register tab. | ✅ **Thinking doc + tab + write layer DONE** (SkyPartner, #981–#989). **Next by value÷effort:** ① populate the 4 standalone NC institutions in MAP (at ZERO); ② EMS Corps landing page + 500-alumni outreach (28 colleges already articulated); ③ work the 49 dormant statewide exhibits; ④ the mirroring playbook; ⑤ the 26-college dental list. **6 "Needs Input" items open in-tab** — biggest is HS-articulation scale. Funding metric PARKED by Sam until the mechanisms are mapped. |
| **MAP Users / student contact** | Every college landing page routes a student's CPL request to a real person. MAP routes on `primary_contact_email`; 25 of 123 colleges had none (24 with a live landing page). | ✅ **Worklist LIVE** (SkyMail, #991–#993) — reviewer-only "⚠ No student contact" lens + cascade proposal + draft email. **17/25 resolve** from the colleges' own MAP designations; **8 need a human** (5 leadership-only, 3 no-MAP-presence = the standalone continuing-ed institutions the NC tab flagged at zero). Contact sync extended 11→24 fields. **📇 Contact directory lens + CSV/Excel export** (#1001) — Sam's steer to Jessica: *a tab you return to, not a spreadsheet that ages.* **All 71 colleges without a CPL Assistant now looked up** (#1003/#1004): **56 with a counseling address, 15 blank-with-a-finding** (5 counselor-lists, **2 publish only a mental-health inbox — the wrong door for a credit question**, 6 phone/form-only, Orange Coast specialized-only, Pasadena noncredit-only). ⭐ **Jessica's sourcing rules replaced mine** — mine (department inboxes only) would have discarded 5 real contacts where a *named person IS* the college's designated contact; a designated person ≠ a name off a list. ✅ **THE SEVEN IN THE SHADOW ARE LOOKED UP (SkyHigh, #1078)** — Citrus · Canyons · Palomar · Saddleback · Yuba · Futuro Health · Launch; **5 candidates, 2 blank-with-a-finding**. Queue: never-looked-up **7 → 0**. ⚠️ **NONE IS VERIFIED, AND THE SWEEP METHOD IS GONE**: sessions are **egress-blocked from college domains** (`curl` → `000`, `WebFetch` → `EGRESS_BLOCKED`), so the pages could not be opened and **Jessica's rules — which are rules about what a PAGE shows — could not be applied**. Hence a new **`via: "search"`** tier that `proposedFillFor()` **refuses in code** (no search row can reach "Proposed for MAP"; renders "Candidate — confirm"). A snippet cannot tell a department inbox from a counsellor list, and **2 of the previous 71 published only a mental-health inbox** — the one outcome that actively harms a student. Durable: `methodology-a-tier-must-encode-what-you-could-not-check`. **Next:** confirm the 5 candidates (seconds each, links on the tab — start with **Palomar**, which has a separate Behavioral Health dept, and **Canyons**), then flip to `via: "curator"` with a name+date; work the 15 blanks (start with the 2 mental-health ones); **the 52 colleges WITH a CPL Assistant can no longer be swept from a session — that "same grind if wanted" needs a human, a differently-egressed runner, or a curator**; the MAP manage-users URL is still open from S87. ⚠️ **CONFIRMED 2026-08-09 (SkyMind) — the nulls were NEVER filled in MAP, and could not be: MAP is our read-only system of record.** `map_users.js` → `FALLBACK_CONTACTS` holds all **71** looked-up colleges (**56 with a contact, 15 genuinely blank-with-a-finding**, 3 curator-supplied by Jessica) as a DISPLAY-LAYER fallback; `map_college_contacts` (synced from MAP 2026-08-05) still shows Gavilan's `primary_contact` empty, and 27 of 130 profiles have no `primary_contact_email`. The blanks persist because they persist in MAP's own Custom Reports user contacts. ⭐ **Sam's call (2026-08-09): use the settled counseling contacts as TEMPORARY FILLS on the COBI side so the MAP team can adopt them if they agree** — *the counseling contact is our best guess for a blank primary contact.* **Design (SkyMind): a dedicated 'Proposed for MAP' column that populates ONLY where MAP is blank — never inside the 'Primary contact email' column, which means what MAP HOLDS** (a temporary fill sitting there would eventually be exported or quoted as a MAP designation — the same failure as 'not in this dataset' read as zero). Provenance always attached (✔ curator vs website), plus a filter + a handover export. The 15 stay visibly blank — those need a human, and **2 of them publish only a mental-health inbox** — found early and **deliberately DECLINED for CPL routing** (Sam, 2026-08-09: that was an early mistake we corrected; we gathered general counseling contacts instead), which is exactly why those two are blank. Nothing routes there via us; the gap is that they have no usable address at all. |
| **Partner crosswalks** | "Which of the occupations we train for can our students already get college credit for, and where?" — the reusable engine for workforce partners (training centers, workforce boards, AJCCs, COEs, apprenticeship sponsors). | ✅ **Engine LIVE** (SkyWalker, #995) — `kb/_build_partner_crosswalk.py` + the shared `kb/occupation_credential_map.json` (139 occupations / 406 rulings / 35 curated no-CPL findings) + region presets + 32-check test. SJCOE run 1: 51 statewide / 53 local-only / 35 no-CPL. **Next:** run a 2nd partner list and work its `unmapped.json` — the "coverage compounds" claim is a design intention until a second run demonstrates it. **Parked:** the COBI tab (Sam authorized; build the *regional-capacity* view, not the judgment-based occupation matching) and an **O\*NET SOC → certification spine**, which is what would let a match be defended rather than asserted. **Gap backlog:** the 35 no-CPL occupations, ~20 of them the utility/lineworker cluster. |
| **Governance & team enablement** | Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam. | ✅ **Starter LIVE** (SkyMail, #997/#998) — team-gated ⚖️ Governance tab: 10 decision rights · 8 acceptance standards · 5 cadences · 6 open questions. **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** ⚠ It measures itself: the contact-refresh cadence was **decided in June and has never run once** (0 rows in `map_college_nudges`). **Owner column is EDITABLE** (#1000 — Sam: *"how do I add an owner? Doesn't appear to be editable"*; I shipped the review without the pen). Owners live in a separate gated `governance_owners` table overlaying the register by row id, so a session regenerating the JSON can never wipe an assignment; no delete policy. **Next:** ① fill the owner column; ② run that cadence once end-to-end with a named owner; ③ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ④ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md` + the CLAUDE.md §"Working with the MAP team" obligations. **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. Build a cross-impact reviewer agent when concurrency makes collisions real. ✅ **SIERRA IS ON THE REGISTER + THE DRIFT DETECTOR IS LIVE (SkyMiner, #1031/#1034/#1036).** Sam: *"I don't have the MAP/CO test invitation on my list of governance items"* — he was right; Sierra was absent entirely. Added **DR-11** (what Sierra tells the public — `decides` records honestly that it has been Sam personally, four times in two days), **CA-06** (Sierra feedback triage, `never-run`, and it **measures itself** — a `live:"feedback"` lens showing *21 of 25 untriaged*, CI rows excluded), **OQ-07** (what must be true before inviting MAP/CO — suggests staging it) and **OQ-08** (register drift). **Detector built + wired to the cron** (step 4a0): pure static analysis over 4 surfaces, **39 → 15 candidates** (6 mapped, 14 dismissed with reasons in a committed file), **0 stale rows**, top six are recurring jobs nobody listed. **Proposes, never auto-adds.** ⚠️ **Owner flow had 3 defects** (#1032/#1033) — first-click save, a failed read rendering as "nobody has an owner", and sign-in never re-reading; **7 more reported, unfixed** — the likeliest to be mistaken for a regression is `Clear owner` being a no-op on the 3 cadences carrying a register-file owner. `governance.test.js` 44 → **90**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human; today you edit the surface map). |
| **Sierra retrieval + corpus** | Sierra answers topic questions ("which colleges give CPL for X?") off `chatbox_exhibits` via Postgres FTS. | ✅ **FIXED AND LIVE — cpl-chat v29** (SkyHunter, #1016 · #1019–#1021). Five retrieval defects; the sharp one is that **the 2026-07-01 CPR fix CAUSED the 2026-08-06 CPR outage** (`aed` added to the synonym family; `to_tsquery('english','aed:*')` parses to `'a':*` because Snowball strips the "-ed", so one token swallowed the corpus). Also `cert` at 445/2,397 (18.6%); no relevance floor; `Aid/CPR/AED` as ONE file-path token; plurals/two-word/misspellings lost the synonym bridge. **2 colleges → 5 at 100% precision**, confirmed on the LIVE function (smoke **mode 13 green**, 15 of 16 assertions green). **Deploy is now runner-based** — `.github/workflows/cpl-chat-deploy.yml` ships byte-exact from git, `--no-verify-jwt` pinned in the workflow so the v25 invariant can't be forgotten; the 66 KB hand-transcription hazard is retired (`playbook-deploy-an-edge-function-from-the-runner`). 🔨 **DETECTION + RANKING FIXED AND LIVE; mode 7 still RED for a NEW reason** (SkyHero, #1023 · #1027, deploys 7–10 green, smoke run 44). The handoff called it "volume outranking distance"; the root cause was **one layer up — the home college was never DETECTED.** `detectAndFetchCollegeProfile` returned on the FIRST word with several matches, so `"angeles"` (9 colleges) short-circuited before `"harbor"` (exactly 1) — and `.limit(3)` with **no ORDER BY is non-deterministic** (two identical live calls returned different triples). With no home college, `askedGeo` was null and NOTHING downstream could rank by proximity. Detection now pools every candidate word (ordered) and scores by name-token overlap; ties still return an ARRAY so the West-LA disambiguation survives. **The exhibit list had no geography at all** (`search_exhibits_by_topic` returns no region/county) — `college_geo` is now loaded once per question and ranks BOTH lists county→region→volume; offerings bands widened from the old 200/100/40-vs-`min(courses,39)` knife-edge to strictly lexicographic. Measured live: LA Harbor → every LA-county college above Norco *and* above American River's 223-course Sacramento catalog · Fullerton/CPR → **Cypress (7 mi)** over Modesto (~300 mi, 12 exhibits) · Crafton/firefighter → **Chaffey (same county)** over Bakersfield. ⭐ That last case **was reported by a reviewer in `sierra_feedback` on 2026-07-03** and sat unread for five weeks. ⚠️ **Mode 7 is STILL RED, and the next session must NOT just green the test.** Live smoke 44: the new `7 home college detected` assertion **passes** (Sierra names LA Harbor, its coordinator, its landing page — the detection fix works end-to-end), but `7 nearby construction college` fails because Sierra now cites **Norco + Barstow** — the colleges that have actually ARTICULATED NCCER — rather than El Camino / Trade Tech / Rio Hondo, which merely TEACH construction. **No LA-county college has a construction exhibit at all.** The assertion encodes the pre-#1027 intent ("route to a nearby teaching college"); the anti-poaching rule deliberately de-prioritised that in favour of "start with the host, ask it to adopt, cite precedent." Both are defensible and **the choice is Sam's**, not a test edit — see the seeker-vs-college tension below. **Also still open:** the corpus covers **59 of MAP's 123 colleges** — the rest of the CPR gap. ✅ **MODE 7 CLOSED AND MEASURED (SkyGauge, #1038).** Retrieval was NEVER the cause: the RPC returns 613 rows/117 colleges for mode 7's exact tsquery, cap 150, **LA Trade Tech rank 2 · Rio Hondo 6 · Long Beach City 19 · El Camino 26**, and the built context prints **ten colleges, all in LA Harbor's county** under an explicit "point to the nearest colleges that do" line. Smoke 47 (red) ran against **deploy 11**; v35 shipped after it and **48/49/50 are green** — run 50 names Trade-Tech/Long Beach/El Camino with the builder's own roll-up totals. ⭐ The session's own last PR fixed the item its handoff filed as Priority 1. Live 150-row fixture + 13 checks committed (`tests/fixtures/offerings_mode7_2026-08-07.tsv`), incl. a guard tying the fixture to `result_limit`. Finding: **`core` discriminates nothing** on that query and volume saturates at 39 — the whole ordering rests on the proximity band. *Superseded:* 🔨 **the earlier half-there state (SkyMiner, #1029, deploy 11, smoke 47).** He chose **both, in order**: host → articulated precedent → **nearest colleges that TEACH it** (even with no exhibit). `OFFERINGS_RULE` now names stopping early *a failure of the answer, not politeness*, and the assertion requires all three so it encodes the DECISION. **Live smoke 47: 3 of 4 green** — the NEW precedent assertion passes (Norco named), but `7 nearby construction college` **still fails**: Sierra's table is all *exhibit* colleges (Norco · Santiago Canyon · Chaffey · SBVC). ⭐ **The same run refutes the premise the last two handoffs used** — mode 8, next question, same deployed function, lists **Rio Hondo (70 carpentry courses) · LA Trade Tech (32) · Long Beach City · College of the Canyons, all LA County.** The teaching colleges ARE in the catalog data; part 3 is reachable and simply didn't fire. **Unmeasured and NOT to be guessed:** whether `buildOfferingsContext`'s `others` list was populated for this query (mode 7's text carries the college name, mode 8's is cleanly topical) or whether the model just didn't follow the new bullet. **Instrument it via `tests/sierra_geo_ranking.test.js`** before touching prompt text again. ⭐ The transferable lesson: two rules in different files conflicted with nothing saying which governed, so the later (anti-poaching) one silently won — **a tie-break must be repeated where the conflict BITES**, not only where it's defined. **Feedback queue triaged for the first time ever:** 53 rows all `status='new'`, **28 of them our own smoke test** (CI = 53% of the queue it fills, every row a thumbs-down → headline read 38 vs 10 real); now filtered from the queue AND its stats, disclosed with a count + toggle, `FEEDBACK_LIMIT` 200→500. It **can't** self-clean — anon is write-only there by design. 4 rows marked `addressed`, **6 remain** (best value: *how many colleges have a CPL coordinator listed* — a build, not a bug; the data exists from SkyMail). **Still open:** the corpus covers **59 of MAP's 123 colleges**. Durable: `methodology-a-test-that-writes-to-the-queue-it-monitors`, `methodology-an-unordered-limit-is-a-correctness-bug`, `methodology-the-feedback-queue-already-knew`, `methodology-assert-what-retrieval-returns`, `reference-postgres-fts-pitfalls-for-credential-titles`, `playbook-deploy-an-edge-function-from-the-runner`. |
| **Sierra student routing** | How Sierra points a CPL seeker between their college's landing page and the systemwide student portal, on a widget that sits on colleges' own pages. | ✅ **LIVE — v31→v33** (SkyHero, #1025 · #1026 · #1027). Four passes, each one Sam correcting the last. The portal is **Credit for Being You** (`/main/student`, one `PORTAL_STUDENT_URL` const — declared above first use, since these rules are template literals and a TDZ ReferenceError kills the function at boot). It was framed as an **either/or** ("if *instead* the student is already enrolled…") and, in `LANDING_PAGE_RULE`, as a **fallback for a missing landing page**. Now **YES/AND** — and that was a substance fix, not a label: my first rewrite split them by FUNCTION (compare at the portal, act at the landing page), which is wrong, because a seeker can see opportunities AND request review at BOTH. The portal ADDS the any-CCC view **and a much more comprehensive portfolio development process**. Then the counterweight: Sierra is embedded on colleges' pages, so an unprompted "you'd get more credit at X" is **poaching**; it now starts with the named college and affirms it, and compares freely only when the visitor ASKS or has no college. ✅ **TENSION RESOLVED AND LIVE (SkyMiner, #1029, deploy 11).** Sam took the recommended line: **the restraint binds salesmanship, not facts.** Never withhold a fact that materially changes a seeker's outcome; never editorialise. If the host hasn't articulated it — say so, say where it IS available today, say the host can adopt it; *never stop at a polite dead end*. When the two interests can't be reconciled, **the visitor's outcome wins — stated plainly, never sold.** Same refusal-of-the-dead-end added to the student audience rule. `tests/sierra_student_portal.test.js` **44 → 59**, and the 15 new checks are deliberately the **PERMISSION** half: a violated prohibition is loud (a college complains), a violated permission is silent (the person just isn't helped and files nothing) — only one of them rots unnoticed. ✅ **EDGE CASES CLOSED AND LIVE — v35 (SkyMiner, #1035, deploy 12).** **Distance is a fact, not a filter**: name the nearest college that TEACHES it however far away, state the distance plainly from the county/region already in context, and let the visitor judge — suppressing a distant option leaves someone who would travel (or study online) with nothing. **The true dead end** (nobody articulated it, nobody nearby teaches it): say so plainly rather than padding, then Credit for Being You **and** an invitation to email MAP so the gap is on record, framed as genuinely useful because an unmet request is how the system learns a credential is in demand. And the guard that matters most — **never invent a college, a course or an articulation to avoid an empty answer**; a fabricated route sends someone to a counter where nobody expects them. `tests/sierra_student_portal.test.js` **59 → 67**. ⚠️ **Still carryover:** SkyHero's five-surface poaching audit was never reported, and `creditforbeingyou.org/main/student` remains unverified (sandbox is egress-blocked from that domain). |
| **Disposition grain / student detail** | What a college has ACTED on, not just what credit exists — the gap behind a hedged Sierra answer. | ✅ **BOTH TABLES LIVE; THE DORMANT-CREDIT HEADLINE EXISTS (SkyNaut, #1049–#1062).** `map_student_credit` **220,588 rows** (student grain, reviewer-only, no write policies) + `map_college_cr_unit` **204,714 rows** (credit funnel, aggregate) — both reconciled EXACTLY against Sam's Access counts. Published aggregates `map_college_goal2` + `map_college_credit_summary` (suppression at write time, `recoverable_by_subtraction = 0`), lookup `map_colleges` (128, with `entity_kind`), provenance `map_data_loads`. 🎓 **Course Credit tab LIVE** — filterable, team-gated, states its own freshness, leads with exemplars not laggards. ⭐ **THE NUMBERS: 1,051,870 units of credit sit at Needs Action** across 106 colleges — credit already earned, never awarded — and **63,991 of those are ALREADY ARTICULATED** (~1,000 associate degrees' worth where everything is built and nobody acted). That second figure is the one to lead with; the million is a ceiling, since ~30% of reviewed credit is correctly Not Applicable. ⭐ **NUMBER POLICY (Sam, 2026-08-09, revised same day): show BOTH totals with a suppression chip** — a number with its provenance beats a number chosen for tidiness (his call, and it is the same pattern as the ceiling caveat riding every total). **Published = 1,051,870 dormant / 63,991 already-articulated** (what the 🎓 tab and Sierra both compute, because they sum the same table); **unsuppressed = 1,052,531 / 64,074**. The chip states WHY: **13 of 111 colleges are withheld, each having fewer than 10 CPL students** (51 cells in `map_college_goal2`). ⚠️ **SAFETY CONDITION — show both ONLY while ≥3 cells are suppressed.** Publishing both totals implicitly publishes their difference (661 units); across 13 cells that identifies nobody, but at ONE suppressed cell the difference IS that college's exact figure — the recoverable-by-subtraction failure `adr-student-detail-aggregate-disclosure-control` exists to prevent. Below 3, show the published figure and the suppressed COUNT only. Re-check the count after every refresh; it is not a constant. Applied 111,779 → transcribed **60,246 (54%)** is the next gap. Sprint goal 2: **60.0% statewide / 71.7% median college**, 14 colleges at 100%, none at 0. ⭐ **EVERY NON-COLLEGE ENTITY IS AT ZERO AWARDED** — 127 trainees across 5 partner/continuing-ed institutions, which reframes the NC row from 'at zero' to 'at zero on AWARDS, not on recommendations'. ✅ **SIERRA IS WIRED AND LIVE — cpl-chat v36 (SkyMind, #1064–#1066).** ⚠️ **The handoff's premise was wrong and the topology check refuted it in two greps: there is no internal COBI Sierra.** `cpl_chat.js` (COBI tab), `sierra/sierra.js` (the PUBLIC map.rccd.edu widget) and `fact-sheet/factsheet_sierra.js` all POST to the SAME `/functions/v1/cpl-chat`, which reads with the **SERVICE-ROLE key** (RLS does not constrain it) and ships `--no-verify-jwt` (anyone can curl it). No caller-supplied signal is trustworthy — the code's own comment calls its `ctx` gate *FAIL-OPEN by design*. So **per-college disclosure to all callers is Sam's explicit decision (2026-08-09)**, not an RLS side-effect. ⭐ **Blast radius is narrower than it looks: every non-college entity carrying data is ALREADY `suppressed=true`** (North Orange 1 student · SD CCE 4 · Launch 2, all under k=10; Futuro Health has no row) — partner figures cannot be stated at all. **Framing (Sam, 2026-08-09): transparency and truth, framed as OPPORTUNITY not deficiency — colleges want to do this work and have not had the tools or data visibility until now.** `CREDIT_STATUS_RULE` leads with the already-articulated block, carries the ~30% Not-Applicable ceiling caveat on every total, never estimates a suppressed cell, never blurs 'not in this dataset' with zero, and answers comparative questions as opportunities — never a best-to-worst ranking. **Totals are ROLLED UP from the same four objects `college_goal2.js` reads, never hardcoded**, so Sierra and the 🎓 tab cannot drift. Verified: 68 committed checks + live smoke run 55 green (`ALL MODES OK`); deploy byte-verified, `verify_jwt:false` intact. **Next:** ① the college-facing page (see the new roadmap row); ② nightly via MAP's API — `docs/map_custom_report_request_for_malone.md` is the forwardable ask, blocked only on the view name; ③ name colleges 122/131. Story: `docs/student_detail_load_lessons.md` · handoff `docs/session_129_handoff.md`. *Prior:* ✅ **(SkyNaut, #1049–#1054).** `map_student_credit` in Supabase, **220,588 rows verified** against the Access source count, 42,346 distinct students · 111 colleges · 8 catalog years; reviewer-only RLS, **no write policies at all**, never readable by Sierra's anon key. ⭐ **Sprint goal 2 exists as a number for the first time: of awarded credit, 60.0% goes to real COURSE credit, 31.8% to a GE AREA, 8.2% to ELECTIVE** — and **47% of all CPL students (20,098 of 42,346) hold ≥1 GE-area award**. 71% of rows (156,562) have nothing awarded at all. The measure is `course_type`'s own suffix, which works because it is **MAP-generated** — every field that broke during the build (`College Course` = `-`, the destination migrating between columns, `Status` empty) is one colleges fill in themselves. ⚠️ **The session-127 handoff's schema was wrong in four places, all caught by asking for 30 real rows**: the 4-column PK collides on ~8% (`course_type` had to go IN the key); `course_type` is **11 values in two vocabularies**, not 3; "ExhibitID and Source Code both null" holds only for the `-Area` variant (MAP supplies `"Default Credit"` for `-Course`, Antelope Valley uses a literal `"-"`); and **the goal-2 formula divides by zero** — all four credit buckets are 0 on unapproved rows, exactly the backlog population (⭐ Sam called this: *"can't rely on the Default Units to determine anything except that they haven't approved them yet"*). ⚠️ **RLS landmine**: the handoff said "same gate as `kb_curation`" — `kb_curation_read` is `SELECT/{public}/USING(true)`, i.e. **world-readable**; following it literally would have published student grain to anon. Use the `team_access` shape. ⚠️ **Supabase Studio's CSV importer silently duplicated 2,058 rows and reported success** (222,646 staged vs a 220,588-row file, each dup exactly 2×) — caught only by reconciling across the boundary; the permissive-staging → count-check → `INSERT SELECT DISTINCT` path is now mandatory. **Next:** ① the **per-college** split (the actual deliverable — k=10 + complementary suppression per the ADR, never rank publicly); ② load `TblCOLL_STU_EXH_CR_UNIT` so the analysis speaks in **credits not row counts** — the dormant-credit headline still doesn't exist. **Open:** 111 colleges not 123; 249 blank `catalog_year`; and the flagship "largest cheapest block of unawarded credit" claim needs re-measuring — true at American River, false at Allan Hancock, and **the variance between colleges is the better finding**. Story: `docs/student_detail_load_lessons.md` · handoff `docs/session_129_handoff.md`. *Prior:* 🔨 **DIAGNOSED + TOOLED (SkyGauge, #1039/#1040/#1041/#1043).** **`CPLStatusPlan` is in NONE of the nine views** `fetch_custom_report.py` fetches; `View_ExhibitCRsCatalog_Dataset` has the credit funnel but statewide-per-exhibit with no college dimension. So Sierra can say *"X eligible credits statewide"* and never *"at YOUR college twelve are at Needs Action."* **Malone's API view is NOT published** (`400 … is not Valid`; re-check one-click via Actions → *Discover MAP datasets*). ⭐ The 51 MB export cannot reach a session and **tranching cannot fix it** — the Drive connector returns files as **base64 into context**, so splitting changes nothing; and the grain shouldn't come here anyway (#227). Shipped `funding/_student_detail_local.py` — runs on Sam's machine, salted hash at `~/.map_hash_salt` (outside any repo; a small enumerable ID space is not anonymous without it), aggregates only, <5 suppressed, takes .xlsx/.csv/.json. **Measured: 537,908 rows · 42,345 distinct students · CPR/AED = 21,891 recommendations held by 17,904 DISTINCT students across 106 colleges = 42% of all CPL students.** Now also sums the per-row funnel (`PotentialCredits`/`CreditsInReview`/`AppliedCredits`/`TranscribedCredits`) statewide, per family, per exhibit — ⚠️ **credits SUM, students DEDUPE.** **Next:** ① Sam re-runs (his export DOES carry `CPLStatusPlan` — last of 29 cols) → disposition rates + funnel; ② join the per-exhibit rollup to `chatbox_exhibits.exhibit_id` ⚠ shared production table, blast radius first; ③ ask Malone for a stable per-student key — `TotalStudentsForCR` varies within `(ExhibitID, CreditRecommendation)` in 19,461/108,911 groups, so per-exhibit student sums overstate. |
| **$50k / ESS 25-82 tab** | Turn the three bare outcome checkmarks into where-you-are / where-you-should-be / how-to-get-there, so colleges get unstuck and award real CPL in MAP. | 🔨 **GROUNDWORK DONE, REWORK NOT BUILT** (SkyPlan, #1007/#1012/#1014). ⭐ **The measure is the DISPOSITION RATE** — share of a college's credit recommendations carrying any disposition (Applied / **Not Applicable** / In Process). Median **4.7%**; MVC 3rd · Bakersfield 6th · Cabrillo 13th of 106 — the ONLY metric matching Sam's own read (three volume metrics ranked Cabrillo 24th–29th). Counting N/A as work done is load-bearing: Cabrillo is 844 N/A vs 320 Applied, so an applied-only metric scores it 9% not 34%. **Applied, not transcribed, is this phase's target** (Sam's correction — transcribing actualises when outcomes funding is live). Data: 436,720 rows at Needs Action (81%); **top 20 exhibits = ~40%** of the backlog; **11,495 rows are "Credit Is Not Recommended"** = a free auto-N/A win. **Build rules:** every step a FRACTION not a check (the Veteran Star taught colleges that uploading is the finish line — applied ≈ JSTs at ratio 1.00); reframe the Star as a starting line; **never rank colleges publicly**. **Next:** the rework itself, then wire Malone's view (expected 8/7) into `fetch_custom_report.py` + `_build_cr_backlog.py`. |
| **College action page / MAP-team queue** | One page (not 123) where a college picks itself + a role and gets its stats, its opportunities against the goals, and concrete to-dos — plus the same engine pointed INWARD at the MAP team's own backlog. | 🔨 **INBOX HALF LIVE; COLLEGE HALF NOT BUILT.** ⭐ **THE ACTION LIBRARY ALREADY EXISTS — SkyHigh, 2026-08-09.** The "hard part" below (seed the to-dos by hand) was already written by the team: Supabase `cpl_funding_config` → Scenario 1 → Year 1 holds **23 concrete strategies** (10 P1 · 7 P2 · 6 P3) — *"Act on all JST credit recommendations in MAP"*, *"Configure College CPL Landing site, including adding a CPL Request Email"*, *"Batch upload to MAP all transcribed CPL from 2023-24 to date"*. Each maps onto state we already measure, so every to-do can be a **fraction, not a checkmark**. ⚠️ **AND THE "currently EMPTY" CLAIM BELOW IS FALSE** — live **Scenario 1 is 50/30/20**, not the documented 30/42/28, with different descriptions AND metrics (P1 = *statewide access*, measured in **Applied CPL Units as FTES**). A briefing built off the baked file prints wrong priorities while claiming to be sourced; resolve the FULL chain including the overlay (`activeScenario` defaults to Scenario 1). ⚠️ **Open for Sam:** Scenario 1 vs 2 (different shares *and* strategies), and Year 1 vs 2 — **Scenario 1's Year 2 has no strategies at all**. Durable: `methodology-verify-the-last-hop-of-a-resolution-chain`. *Prior (SkyDesk, #1073):* ⭐ **The MAP-team backlog this row listed was MEASURED and two of its six items were already wrong within two days** — governance owners are **17 of 17 ASSIGNED** (the team did it Aug 5+7; OQ-01 is effectively answered), Sierra feedback is **23** real open not 6, the contact fills awaiting a MAP-team decision are **14** not 56 (42 of the 56 are colleges MAP already covers), and unroutable colleges are **11** not 15. ⭐ **7 colleges with no primary contact had NEVER BEEN LOOKED UP** (Citrus · Canyons · Palomar · Saddleback · Yuba + Futuro Health · Launch) — the sweep scoped to *"colleges without a CPL Assistant"*, a proxy that diverges from the need on 28% of rows; **one lookup each, cheapest work on the board**. So the tab's one rule is **measure at load, never carry a list**: unmeasurable items live in `kb/map_team_tracked.json` and render their own staleness; a failed read is **`unknown` at the TOP**, never 0; cleared items stay visible so "nothing waiting" and "nothing measured" never look alike. `buildQueue(sources, now)` is **pure — reuse it for the college half, do not fork the ranking rules**. Ranking: unknown → **a person waiting** → oldest → largest. **Next: the college briefing** (design calls below still stand), whose top slot needs the nightly feed → still blocked on Malone's view name, now aging in public as queue item 6. *Prior scoping (SkyMind, 2026-08-09):* Sam's vision: the college-facing inverse of the student CPL landing page, Sierra as the front door, driven by the 3 ESS 25-82 outcomes + the 3 $35M priorities. ⭐ **The $35M priorities are SOURCED, never pasted** — resolution order is `cpl_funding_data.js` → `year_priorities` (baked, hand-maintained) ⊕ Supabase `cpl_funding_config.config.year_priorities` (Chancellor/team-editable — ⚠️ **this was documented as "currently EMPTY so defaults stand"; SkyHigh measured it 2026-08-09 and it is NOT empty**, see the correction at the head of this cell) ⊕ per-browser what-if. Read them at runtime: P1 (30%) completion via CPL awards · P2 (42%) access via CPL · P3 (28%) capacity/visibility/documentability/interoperability/mobility — **descriptions stable, METRICS year-specific** (Y1 P1 = headcount eligible; Y2 P1 = Units of Transcribed CPL, FTES). ⚠️ **The hard part is the ACTION LIBRARY, not Sierra** — we know each college's STATE, not the playbook that moves it; seed from the IFM P1/P2/P3 strategies (Sam) rather than inventing. **Design calls made:** open with a rendered BRIEFING, not a blank chat box (a coordinator on a prompt doesn't know what to ask); role is a dropdown so it TAILORS but never GATES. ⭐ **Sam's reordering: colleges will start receiving public CPL review requests DAILY, for the first time ever** — an inbound request has a person waiting, so it outranks every stat on the page, and it makes the nightly feed a PREREQUISITE (daily to-dos off month-old data get caught immediately). ⭐ **One engine, two audiences (Sam, 2026-08-09):** colleges need *what should I do next* (a briefing, leads with opportunity); the MAP team needs *what's waiting on me* (an inbox, leads with AGE). The team backlog is currently scattered across ≥6 surfaces with no owner and no queue — 56 proposed contact fills · 15 unroutable colleges · 6 open Sierra feedback rows · every governance owner unset · colleges 122/131 · Malone's view name. The governance tab already PROVED the failure mode by measuring itself (a cadence decided in June that never ran once). **Next:** the proposed-fills build (below), then the briefing shell. |
| 2 | Articulations by Unified Course — interactive view + curation | parked |
| 4 | SLO ingestion + the rest of the MC slot fields | parked (unlocks MC-readiness scoring) |
| 5 | CTE classifier (TOP code → COCI CTE field) | parked (unlocks CIDx lane) |
| 6 | CIDx submission automation (the eventual goal) | parked (the destination) |
| 7 | M-ID → CID substitution workflow on approval | parked (governed by Rule 7 once re-locked at faculty publication) |

The auditor is the foundational instrument for the whole pipeline: every phase
upstream of CIDx submission produces a higher trust score and graduates rows
from one readiness tier to the next.

### SkyHigh — the sweep method is gone, and the action library was already written (2026-08-09, #1078 MERGED)

Sam: *"let's pick up the string."* **#1078** closed the cheapest item on the queue — the **seven colleges**
SkyTime found had never been looked up. Five have a candidate address (Yuba · Citrus · Palomar · Saddleback ·
Futuro Health), two are blank-with-a-finding (Canyons publishes only a *technical*-support inbox; Launch has an
interest form only). Queue: never-looked-up **7 → 0**, search-only **0 → 7**, proposals (14) and empty (4)
**unchanged** as the control. ⚠️ **None is verified, and that is structural: sessions are egress-blocked from
college domains** (`curl` → `000`). So this doc's standing offer that the other **52 colleges** could get "the
same grind if wanted" **is no longer true** — that needs a human, a differently-egressed runner, or a curator.
The addresses did NOT go in as `via: "web"`: a tier is a claim about METHOD, and Jessica's rules are rules about
what a PAGE shows — 2 of the previous 71 published only a mental-health inbox, invisible from a snippet. New
`via: "search"` tier, refused by `proposedFillFor()` **in code**. ⭐ **The action library the roadmap called "the
hard part" already exists** — Supabase `cpl_funding_config` Scenario 1 Year 1 holds **23 team-typed strategies**.
⚠️ **And the overlay this file calls "currently EMPTY" is not**: live Scenario 1 is **50/30/20**, not the
documented 30/42/28, with different descriptions and metrics — a briefing built off the baked file would print
wrong priorities while claiming to be sourced. Durable:
`methodology-a-tier-must-encode-what-you-could-not-check`, `methodology-verify-the-last-hop-of-a-resolution-chain`.
**Open for Sam:** Scenario 1 vs 2, and Year 1 vs 2 (Year 2 has *no* strategies).
Story: `docs/map_users_lessons.md` · `docs/college_action_page_lessons.md` · handoff `docs/session_133_handoff.md`.

### SkyDesk / SkyTime — the handoff's backlog was two-sixths wrong within two days (2026-08-09, #1072/#1073 MERGED)

Sam: *"let's crank!"* **Name: Sam called it SkyTime at greeting and sign-off; it ran as SkyDesk because SkyTime was already Session 104's moniker. Sam's name wins — both are recorded here so either search term lands, the same reconciliation SkyWire/SkyMind got.** ⭐ **The session's value was measuring the handoff's six-item MAP-team backlog before building
on it — fifteen minutes of SQL, and it came back materially different.** "Every governance owner unset" was FALSE
(the team assigned **17 of 17** on Aug 5+7 — the register's own OQ-01 had been answered by people while the document
still listed it as the work); "6 open Sierra feedback rows" was **23**; "56 proposed contact fills" was **14** (42 of
the 56 are colleges MAP already covers); "15 unroutable colleges" was **11**. ⭐ And **7 colleges with no primary
contact had NEVER BEEN LOOKED UP** — Citrus · Canyons · Palomar · Saddleback · Yuba (+2 partner entities) — because
the sweep scoped to *"colleges without a CPL Assistant"*, a **proxy** for the need that diverges on 28% of rows.
Cheapest work on the board: one lookup each. **📥 MAP Team Queue tab LIVE** (#1073) — every item **measured at load**,
never a list; unmeasurable items sit in `kb/map_team_tracked.json` rendering **their own staleness**; a failed read
renders **`unknown` and sorts to the top**, never 0; cleared items stay visible. `buildQueue(sources, now)` is PURE —
**the engine the college-facing briefing must reuse**. Also **#1072**: CI smoke rows out of the Sierra queue, fixed at
the WRITE path (`status='ci'`), 43 backfilled → **23 real open · 4 addressed · 43 CI**. ⚠️ Two test assertions failed
on first run and **both were the assertion, not the code** — one matched a legitimate backfill because it wasn't scoped
to the `ON CONFLICT` clause, the proxy-instead-of-property mistake committed with that KB note open in the same session.
Durable: `methodology-a-written-backlog-decays-silently`, `methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow`.
Story: `docs/college_action_page_lessons.md` · handoff `docs/session_132_handoff.md`.

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

**Variant — "There are N unpushed commit(s) on branch `claude/...`" (added
Session 128, 2026-08-08, after it fired twice in one session).** Same root cause,
different message, and **the answer is still: do not push.** After a squash-merge
GitHub **auto-deletes the head branch** (Sam's toggle ②), so a session that then
runs `git reset --hard origin/main` is left on a local branch whose remote is
*gone* — and the hook reads "local has commits the remote doesn't" as unpushed
work. The commit is the squash-merge itself, already on `main`. Pushing would
recreate a merged branch for nothing.

Confirm in one command, all local except the last:

```bash
git log -1 --format='%h %ce %s' HEAD                  # committer = noreply@github.com
git log origin/main..HEAD --oneline | wc -l           # 0 = nothing unpushed
git merge-base --is-ancestor HEAD origin/main && echo published
git ls-remote --heads origin <branch> | wc -l         # 0 = auto-deleted at merge
```

`git branch --unset-upstream` clears the stale tracking ref and quiets it until
the next merge. ⚠️ Wrap any networked git call in `timeout` — `git fetch --prune`
hung for the full 2-minute limit in this sandbox at least once.

### docx library errors
- Local `docx.min.js` is v8.0.4 UMD, 334KB. CDN versions were unreliable — do
  **not** switch back to CDN. To refresh the local copy:
  `npm pack docx@8.0.4`, extract, copy `umd/docx.min.js`.
