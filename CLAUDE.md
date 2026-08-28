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

8. **READ the memory table BEFORE you work — Rule 8 had no query step until
   2026-08-10.** The very first thing a session does on a workstream, before
   reading the handoff and before touching code:

   ```sql
   select slug, title, summary, status, event_date from cpl_memory
   where status <> 'superseded'
     and (tags && array['<workstream-tag>'] or summary ilike '%<keyword>%')
   order by event_date desc nulls last limit 40;
   ```

   ⚠️ **This exists because a session re-derived THREE settled facts in one run
   (2026-08-10) while the answers sat in `cpl_memory` unread** — the `Student`
   grouping counter, the MAP-student-id privacy constraint, and that 537k rows had
   already been assessed. It wrote 8 rows that day and queried the table **zero**
   times. The playbook is literally named *auto-write-at-checkpoint*; nothing ever
   said read. Sam's own framing applies: Rule 8 is **ingest**, sessions are
   **query** — and the memory table only ever got the ingest half.

   **Also: a row whose `source` or `verified_by` names a HUMAN may not be silently
   superseded by a session's inference.** On 2026-08-08 Sam said *"Sierra only
   lives in COBY for now"*; a later session read the code (three callers, one
   shared function) and marked that row `superseded`. Both were true — his claim
   was about **where the widget is deployed**, the code finding about **what it
   calls** — but the fact left the default view, and he had to say it again on
   2026-08-10. Supersede a human-sourced row only by saying so explicitly, or file
   a NEW row and flag the conflict.

9. **Document at context checkpoints.** **Run `python3 kb/_docs_audit.py` FIRST
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
   - **`docs/INDEX.md` + `docs/catalog/` — GENERATED since 2026-08-28. Run
     `python3 kb/_build_docs_index.py`; do NOT hand-add rows.** The per-lane
     listings live in `docs/catalog/*.md`, built from each doc's own
     frontmatter, and INDEX keeps only the landing page. Hand-edit INDEX for
     PROSE only — the lane explanations, the orientation pointers and the
     `## Update history` bullet for this run; anything between
     `<!-- generated:corpus -->` markers is replaced on every build.
     `--check` runs in CI, so a forgotten rebuild is a red check.
     ⚠️ It was hand-maintained until it hit **273,616 B, 6.84× its budget**,
     half of it re-typing what the notes already said. Obsidian renders INDEX
     as the vault-side entry point for `cpl-project-tracker/`.
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
   - **`CPLBrain` vault — `07-session-notes/YYYY-MM-DD-<slug>.md`** (wired in
     2026-08-28). REQUIRED for any non-trivial session; **`CPLBrain/CLAUDE.md`
     has always marked this MANDATORY**, but it was absent from this list, so it
     had not fired since 2026-08-09 — a rule in one repo whose procedure lives in
     another does not fire. Template: `07-session-notes/README.md`. Also
     `04-projects/<project>/SESSION-NOTES.md` when the run worked inside a
     project folder, and `07-session-notes/README.md` only if the convention
     itself changed. ⚠️ **Never edit `CPLBrain/README.md`, `.claude/skills/`,
     `.claude/roles/`, `.kiro/` or `.gemini/`** — upstream COG framework files
     owned by `cog-update.sh`, not our content. Still never the public KB.

   Capture in each: (a) what's been learned this checkpoint, (b) current
   state of the work, (c) strategic roadmap, (d) next concrete step.
   Better to checkpoint slightly early than slightly late — sessions can
   end abruptly and what's not in a markdown file is effectively lost. The
   user can trigger a checkpoint at any time with the **`/checkpoint`**
   slash command (`.claude/commands/checkpoint.md`).

10. **Supabase live-curation safety.** Sam curates LIVE beside sessions — his
   rows always win. (a) Before ANY bulk `kb_curation` write: fresh live read
   at write-time, re-measure any queue/worklist staged earlier in the session,
   and cross-check pending `unified_title_merge_confirm` TARGETS (a rename
   whose key is a pending merge target fights the curator — hold it). Then
   INSERT-only `ON CONFLICT DO NOTHING` under a cohort `reviewer_email`
   (`<lane>-s<N>@bot`) with a committed receipt; guarded UPDATEs only where a
   reviewed plan explicitly says so. (b) `kb_curation` reads via PostgREST
   MUST be Range-paginated (#718). (b2) **`revoke ... on function f() from anon,
   authenticated` DOES NOT WORK** — Postgres grants EXECUTE to **PUBLIC** at
   creation and anon inherits through it, so the statement protects nothing.
   **Name `public`**, and check `has_function_privilege('service_role', …)`
   holds an EXPLICIT grant before you revoke PUBLIC, or the same statement
   breaks the cron. Six definer functions that truncate live tables were
   internet-reachable this way (2026-08-19); `tests/supabase_function_grants_test.py`
   lints it now. (c) The sandbox cannot reach
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
- **AMERICAN SPELLING, ALWAYS (Sam, 2026-08-21).** *"As a Yank, I prefer
  American, of course."* Claude drifts to British forms in chat, in artifacts and
  in code comments, and Claude's own spell-check flags them as errors — so this
  is a real friction, not a style quibble. Use **color · behavior · normalize ·
  organization · analyze · center · judgment · program · catalog · license (n
  and v) · gray · enroll · while (not while) · among (not among)** and the
  `-ize`/`-ization` family throughout. Applies to **rendered UI text first**
  (`college_briefing.js` was telling readers a "program" was inactive and
  citing "the curated catalog"), then docs, then comments. Enforced by
  `american_spelling` in `kb/_docs_audit.py` — it is a lint finding, not a
  memory. ⚠️ It scans PROSE only: `grey` is a valid CSS keyword and a token name
  is not a spelling, so never blind-replace inside code.
- **SkyView, not "Atlas" (Sam, 2026-08-24).** The CCR curation prototype is **SkyView**.
  ⚠️ **When Sam says "SkyView" he means the GRAPH VIEW specifically** — the canvas of
  identities you pan, search and drag on — **not** the surrounding informational elements
  (discipline cells, the ESL packaging card, the decision list). Those are panes *on* the
  SkyView page; only the graph is SkyView. Files still carry `ccr_atlas_*` paths; the
  user-facing name is what changed.
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
  lands — and luck only pays when you can recognize the hit. A bug reproduces; a
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
- **Sign off with your MONIKER and the NEXT HANDOFF NUMBER (Sam, 2026-08-13).**
  At the end of a session — or anything that looks like the end (a checkpoint, a
  "thanks, that's it", a long quiet) — close with both, e.g. *"SkyRef signing
  off. Next is Session 151 — `docs/session_151_handoff.md`."* Sam pastes that
  number into the next session's first message, so leaving him to scroll for it
  taxes every single handover. Cheap for you, and it also catches the stale-number
  failure Rule 9 warns about, since you have to look at the file to say it.

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
    CI *success*, so you must poll. ⚠️ **A `check_suite.completed` wake is NOT a green light** —
    it names a `head_sha`, and on this repo it is routinely a SUPERSEDED one (Session 187 hit
    this twice; Sky188 got four in a row, the last of which reported a suite the session had
    just CANCELED as "completed"). Always re-read `get_check_runs` on the CURRENT head before
    acting.
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
- **ARTIFACTS AND PROTOTYPES USE FIRST LIGHT TOO — accessible and mobile-friendly
  (Sam, 2026-08-19).** *"Make sure it is based on our First Light design and make it
  always accessible and mobile friendly."* This is not only a dashboard-CSS rule: a
  session built a decision artifact on an invented palette while the house spec sat in
  the repo. **Do not invent a palette.** Spec:
  [`docs/kb-notes/reference-ui-design-system.md`](docs/kb-notes/reference-ui-design-system.md)
  + `prototype/first_light_theme_v1.html` v1.6 — warm monochrome base, five accents one
  job each, Playfair Display + Source Sans 3, `var(--token)` never a raw hex (**derived
  tints get their own tokens**), and **tables never on glass**.
  **Accessible means verified, not claimed:** compute every fg-on-bg pair actually used
  (including zebra rows and glass composites) against AA 4.5:1 / 3:1 —
  `prototype/check_contrast.py` holds the maths; **color is never the only signal**, so
  pair every accent with a word or an approved mark (▲▼ ✓ ⚠) — that is what "always
  glyph-paired" is for, and it does **not** conflict with the no-cheesy-glyphs rule
  (decorative out, state-bearing stay, muted and simple); `th scope` on every header
  cell; a focusable `aria-label`led region around any scrolling table; skip link;
  `:focus-visible`; `prefers-reduced-motion`. **Mobile:** single column below ~560px,
  `clamp()` type, no fixed widths, wide tables scroll inside their own container so the
  body never scrolls sideways. ⚠️ `--border-strong` on white is 1.92:1 — a KNOWN spec
  exemption (decorative; header identity comes from `th scope` + typography), do not
  "fix" it by deviating. ⚠️ First Light is a **light** identity with no dark PAGE palette
  (only on-dark ACCENT grades) — commit single-theme and paint every color explicitly.
- **PROSE RUNS THE FULL WIDTH OF WHATEVER SITS BESIDE IT (Sam, 2026-08-22).** *"I
  would like the full width format rule on throughout COBI."* A ~74ch measure beside a
  full-width table reads as a block that failed to fill its container, not as a reading
  aid. The lever is the token **`--cpl-measure: none`** on `:root` in BOTH HTMLs
  (Rule 4); every prose cap is `max-width:var(--cpl-measure,none)` — **the `,none`
  fallback is load-bearing** because most of these rules ship from a tab's own JS onto
  surfaces that never declare the token. ⚠️ **A cap below ~55ch is LAYOUT, not a
  measure** (cell truncation, a raw-value column, a badge, a short hero lede) and must
  NOT be swept; `tests/cobi_prose_measure.test.js` pins a sample of them so a future
  blanket sweep fails. ⚠️ Grep **px too** — four tab intros were capped at 880/760px.
  Two columns is the sanctioned alternative, but only where blocks run long; most COBI
  blocks are 1–3 lines and would stack as one-liners.
  [`methodology-a-text-measure-must-agree-with-what-sits-beside-it`](docs/kb-notes/methodology-a-text-measure-must-agree-with-what-sits-beside-it.md)
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

**Moved to [`docs/reference/obsidian_vault_wiring.md`](docs/reference/obsidian_vault_wiring.md)** (2026-08-28 consolidation).

Read it BEFORE: vault-sync or vault-path work, Obsidian exclusion, or the
sparse-checkout fix. It holds the vault root, `scripts/sync-vault-clones.ps1`,
and why exclusion is a relevance filter rather than a performance one.

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

> **This table is a POINTER INDEX, not the state itself (2026-08-28, Session 206).**
> Each lane's detail lives in [`docs/reference/lanes/<lane>.md`](docs/reference/lanes/);
> the row here carries only what a session **cannot know to ask for** — that the
> lane exists, what it is, whether it is live, and whether anything is waiting.
> The detail is PULL: you open the lane file when you work that lane.
>
> **At checkpoint, update the LANE FILE, not the row.** Touch the row only when
> the lane's *state* changes (live ⇄ in progress, open work appearing or
> clearing). ⚠️ **Do not re-inflate a cell** — a row that grows back into a
> paragraph puts this file back over budget, which is the whole reason the
> §11 table was 90 KB of a 151 KB always-loaded file.
>
> **A lane file states CURRENT TRUTH, not a log.** When a finding contradicts
> what it says, **delete the superseded text** — do not prefix it with
> `*Prior:*` and leave it below. History belongs in the workstream's lessons
> doc, which Rule 9 already says to write **once**. This was measured: before
> the rule existed, the "Disposition grain" cell reached **14,338 characters**
> with 3 `*Prior:*` markers and four generations of stacked claims, some
> contradicting each other — and the cost was not bloat but CONTRADICTION, with
> the same correction made on two consecutive days. **No reading order fixes a
> contradiction inside one document.** `stacked_roadmap_cell` in
> `kb/_docs_audit.py` guards **both** surfaces — this table and every lane file
> — mechanically, because Sam does not review checkpoint output by design.
>
> **Retiring a lane.** Completed rows through Session 32 are in
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). A lane that has shipped
> and is stable — **no NEXT, no NEEDS SAM, no BLOCKED in its own text** — moves
> verbatim to
> [`docs/reference/finished_workstreams.md`](docs/reference/finished_workstreams.md)
> and its row leaves this table. ⚠️ **Read the lane file before retiring it; do
> not grep for a ✅.** Most lanes read *"✅ LIVE … NEXT: …"* — live with open
> work, which is not finished. Session 206 checked the five rows a prior
> measurement called retirable-with-no-judgment-calls and **four of them carried
> an explicit open-work list in their own text.**

| Phase | What | Status |
|---|---|---|
| 1b (3/3) | Curate-write Repair-from-members action (Supabase schema migration + fresh-read + cron-window) | parked (low immediate value — 1 cluster; build when ≥5 clusters exist) |
| 1c | More audit rules in `kb/_row_audit.py` — **9 of 10 landed**; `cluster_title_drift` still queued. | in progress — [lane state](docs/reference/lanes/audit-rules.md) |
| **Activity↔Project PR-D** | (Optional) split Workplan Goals into its own top-level tab if the page gets dense (Sam's prior preference: one page with two sections). | parked unless curator usage signals demand |
| **Excel→Supabase Phase 2-4** | Retire the master `.xlsx`; Supabase is the system of record. | 🔨 in progress · open work — [lane state](docs/reference/lanes/excel-to-supabase.md) |
| **NC / Learning Partners** | Noncredit + not-for-credit + adult-school + ROP + HS-Cx + apprenticeship CPL — the thinking doc, the six modes, and the COBI register tab. | ✅ live · open work — [lane state](docs/reference/lanes/nc-learning-partners.md) |
| **MAP Users / student contact** | Every college landing page routes a student's CPL request to a real person. MAP routes on `primary_contact_email`. | ✅ live · open work — [lane state](docs/reference/lanes/map-users-student-contact.md) |
| **Partner crosswalks** | "Which of the occupations we train for can our students already get college credit for, and where?" — plus the college-facing half: "and what can THIS college carry?" | ✅ live · open work — [lane state](docs/reference/lanes/partner-crosswalks.md) |
| **Governance & team enablement** | Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam. | ✅ live · open work — [lane state](docs/reference/lanes/governance-team-enablement.md) |
| **Sierra retrieval + corpus** | Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP. | ✅ live · open work — [lane state](docs/reference/lanes/sierra-retrieval-corpus.md) |
| **Sierra: false absences + the statewide flag** | Why Sierra says "none" when there is plenty, why she disagreed with the Fact Sheet, and why she reported three colleges out of nine. | ✅ live · open work — [lane state](docs/reference/lanes/sierra-false-absences.md) |
| **Local course ↔ CR alignment** | "Which of MY courses should I articulate against this credit recommendation, and how did other colleges do it?" — so faculty don't guess. | ✅ live · open work — [lane state](docs/reference/lanes/local-course-cr-alignment.md) |
| **Common CR Reference** | A canonical vocabulary of credit recommendations — what the CER did for freehand credential titles, for the freehand recommendation text. | ✅ live · open work — [lane state](docs/reference/lanes/common-cr-reference.md) |
| **Military (ACE) CR Reference** | The same canonical-vocabulary question for the 98% of MAP's CR rows that come from ACE-reviewed military training. | ✅ live · open work — [lane state](docs/reference/lanes/military-ace-cr-reference.md) |
| **College CR evidence ("we approved it, but we have no CR")** | A college names courses it will award for a CPL type but holds no credit recommendation — and MAP needs one before an articulation can exist. | ✅ live · open work — [lane state](docs/reference/lanes/college-cr-evidence.md) |
| **Disposition grain / student detail** | What a college has ACTED on, not just what credit exists. | ✅ live — [lane state](docs/reference/lanes/disposition-grain-student-detail.md) |
| **CPL clean-up worklist** | What to fix in the CPL data, in what order, and who fixes it. | ✅ live · open work — [lane state](docs/reference/lanes/cpl-cleanup-worklist.md) |
| **$50k / ESS 25-82 tab** | Turn the three bare outcome checkmarks into where-you-are / where-you-should-be / how-to-get-there, so colleges get unstuck and award real CPL in MAP. | 🔨 in progress · open work — [lane state](docs/reference/lanes/ess-25-82-tab.md) |
| **Implementation Funding tab / the $35M model** | The three priorities, their shares and factors, what each earns against, and the college-by-college allocation. | ✅ live · open work — [lane state](docs/reference/lanes/implementation-funding.md) |
| **My College (college action page) / MAP-team queue** | One page (not 123) where a college picks itself and gets its stats, its opportunities against the goals, and concrete to-dos — plus the same engine pointed INWARD at the MAP team's own backlog. | ✅ live · open work — [lane state](docs/reference/lanes/my-college-action-page.md) |
| **College & district identity** | One taxonomy: every college/district name variant resolving to MAP's authoritative `college_id`, the CCCCO MIS district code, and every spelling any system uses. | ✅ live · open work — [lane state](docs/reference/lanes/college-district-identity.md) |
| **Admin tab / the side menu as data** | One place to manage the COBI side menu — order, grouping, naming, which sites show what, who sees it — beside what actually protects each tab. | ✅ live · open work — [lane state](docs/reference/lanes/admin-tab-side-menu.md) |
| **Noncredit CIP categories** | Which of the CO's ten noncredit CIP categories a program belongs to — and what that means for CDCP eligibility and funding. | 🔨 in progress · open work — [lane state](docs/reference/lanes/noncredit-cip-categories.md) |
| **Reviewer session lifetime & scope** | What "signed in" means, how long it lasts, and which browser tab has it. | ✅ live · open work — [lane state](docs/reference/lanes/reviewer-session-lifetime.md) |
| **Org & phrase scope / auth model** | Which sites exist, which phrase opens which, and whether shared phrases survive at all. | 🔨 in progress · open work — [lane state](docs/reference/lanes/org-phrase-scope-auth.md) |
| **EACR — Exhibit & CR Adoption** | One place to see every exhibit, its credit recommendations, and the colleges that could adopt it. | ✅ live · open work — [lane state](docs/reference/lanes/eacr-exhibit-cr-adoption.md) |
| **GR register / CO policy & regulation review** | Every CO priority area's regulatory / Ed. Code revisions under consideration, with the artifacts informing them — pointed at the whole CO, not just CPL. | ✅ live · open work — [lane state](docs/reference/lanes/gr-register.md) |
| **Public/private repo split** | Partition the truly public views (Sierra, Fact Sheet, veteran map, landing pages) from COBI + the methodology, so the approach is not trivially cloneable. | 🔨 in progress · open work — [lane state](docs/reference/lanes/public-private-repo-split.md) |
| **MAP Custom Reports (3 new) / ITPI automation** | Wire the three new MAP Custom Reports, load them, keep them fresh. | ✅ live · open work — [lane state](docs/reference/lanes/map-custom-reports.md) |
| **SkyView / the CCR curation interface** | An interactive view of the Common Course Reference — common courses by discipline, their constituent local courses, and moving a course to where it belongs. | ✅ live · open work — [lane state](docs/reference/lanes/skyview-ccr-interface.md) |
| **ESL packaging (the first fold)** | Collapse the ESL discipline to comprehensives + carve-outs — the proof that packaging reaches the target. | ✅ live · open work — [lane state](docs/reference/lanes/esl-packaging.md) |
| **Title 5 §55050 → Ed. Code Article 9** | A regulation that does not implement the statute it operates under — and the amendment package that fixes it. | ✅ live · open work — [lane state](docs/reference/lanes/t5-55050-article-9.md) |
| **Memory tab / Autogenerate + the Briefing** | Drafting a memory row from a typed topic, reading the entries back, and curating them. | ✅ live · open work — [lane state](docs/reference/lanes/memory-tab.md) |
| 2 | Articulations by Unified Course — interactive view + curation | parked |
| 4 | SLO ingestion + the rest of the MC slot fields | parked (unlocks MC-readiness scoring) |
| 5 | CTE classifier (TOP code → COCI CTE field) | parked (unlocks CIDx lane) |
| 6 | CIDx submission automation (the eventual goal) | parked (the destination) |
| 7 | M-ID → CID substitution workflow on approval | parked (governed by Rule 7 once re-locked at faculty publication) |

The auditor is the foundational instrument for the whole pipeline: every phase
upstream of CIDx submission produces a higher trust score and graduates rows
from one readiness tier to the next.

### SkyLens S203 — the round trip, the spine, and a column that printed money twice (2026-08-28)

**Sam's three relabels reached Supabase — he clicked Publish and the md5 moved** (`9cf58b99…` → `c95e78aa…`),
closing the item three handoffs called unproven. Then **#1372** narrowed curation to a magic-link reviewer
(⚠️ `cfp_insert_self` stays open — it is the college self-attestation door), **#1375** landed the
**§78093.2(d)(1) spine**, **#1378** retired the `NC $` column and paired every institution as CR + NC rows.
⭐ **FUNDED and MEASURED are two axes** — goal (C) is funded and unmeasured, and one status forces that into a
green that lies or a red that denies the money. ⭐ **A goal derives from a MEASURE, not a title** — and a
title-matching mutation **passed every first-draft assertion**, because on the live config the two agree; the
discriminating guard had to be built deliberately.
⚠️ **CI was never broken.** A **conflicted PR cannot produce a `pull_request` run** — GitHub tests the merge
commit and a dirty PR has none. Five pushes, zero runs; resolving the conflict made CI appear at once, and all
three remedies the handoff proposed would have come back clean.
⚠️ **One merge hunk had no correct side** — either choice bound Publish twice.
⚠️ **Two claims re-measured, not inherited**: the story corpus is **32 educational / 3 job** (not 5), and the
$8.96M project pool has **no breakdown anywhere**, so that split is Sam's input, not free work.
⚠️ **I told Sam the CSV had to follow the retired column. Wrong** — the export has no NC rows, so its column is
the only carrier and deleting it removes the figure. Story `docs/cpl_funding_lessons.md` · handoff
`docs/session_206_handoff.md`.

### SkySolidare S204 — the lint had reported this for weeks and nothing consumed it (2026-08-28)

**Ran in PARALLEL with SkyLens (203, the Funding tab); the two lanes never touched.**
The vault-facing debt: `kb_note_dialect` **60 → 0**, `american_spelling` **174 → 1** (the one
left is 203's file), `docs/INDEX.md` **273,616 B → 20,757 B** (was 6.84× its budget). PR #1373.
⭐ **A FIELD THE RESOLVER NEVER REACHES CAN DISAGREE FOR EVER** — `kb_type_of` returns the type
tag and stops, so 41 notes carried a `type:` key nothing ever read; **6 disagreed**, silently,
for months. Audit agreement across every source, never the resolved value.
⭐ **The index rotted structurally, not sloppily** — 75 workstream docs matched no table so
sessions appended `## Added <date>` sections, and six KB notes had been appended into the
**three-lanes table**, two breaking its column count. Generated now, `--check` in CI.
⚠️ **Moving content out from under a guard disables the guard, and the diff looks like
progress** — relocating the listings orphaned all 340 notes from `unindexed_kb_note`.
⚠️ **A checker and a fixer reporting different counts are reading different text** — one
`prose_only()` now serves both; 25 unactionable findings → 1.
✅ **Sam, 2026-08-28: "No need to fix any spellings we import…like COCI catalog or MAP Custom
Reports data"** — generalized to every QUOTED span; 3 of 402 replacements, and it caught Sam
quoted verbatim. All **3,145** link/wikilink targets byte-identical; 5 British-form FILENAMES
deliberately not renamed (a filename is an identifier).
⚠️ **`tests/docs_audit_test.py` — 67 assertions guarding the whole prose surface — had never
run in CI.** Now wired in.
**NEXT: `CLAUDE.md` at 2.49× its always-loaded budget** — held only to avoid colliding with 203.
Story `docs/obsidian_vault_hygiene_lessons.md` · handoff `docs/session_205_handoff.md`.

## Troubleshooting

**Moved to [`docs/reference/troubleshooting.md`](docs/reference/troubleshooting.md)** (2026-08-19 pare-down — 5,302 bytes of symptom-triggered reference that every session paid for and only a broken run reads).

Go there when: the **dashboard is not updating** · a **Pages deploy failed** or
the site is stale after a merge (dispatch a FRESH `pages.yml` run — never
`rerun_failed_jobs`) · the **scrape returns errors** · KPI values are stale but
the date moved · **duplicate sections / HTML growing** on every run ·
`kpi_history.json` shows a stale 1d delta · **docx library errors**.

⚠️ **Stop-hook nags in REMOTE sessions are FALSE POSITIVES — do not amend and do
not push.** Both variants ("Unverified `noreply@github.com`" after a squash-merge,
and "N unpushed commits on `claude/...`" after the branch auto-deletes) are
covered there with the four confirming commands. Amending would rewrite `main`
(Rule 5).
