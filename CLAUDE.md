# CPL Project Tracker — Claude Code Project Memory

This file is auto-loaded at the start of every Claude Code session in this
repo — in three repos, in fact, so every line here is a tax every future run
pays whether or not it turns out to be relevant.

## What belongs in this file (Sam's assignment rule, 2026-08-28)

> **PUSH what a session cannot know to ask for. PULL everything else.**

That single test decides where anything goes, and it is the reason this file
went from 151 KB to under budget on 2026-08-28 without losing a byte:

- **PUSH — belongs here.** A rule that must fire *unprompted*, before you know
  you need it. *"Never force-push `main`"* cannot live in a queryable store:
  you would only look it up if you already suspected it, and by then you have
  either done it or not. Same for the naming conventions, the branch policy,
  and the obligations to the MAP team.
- **PULL — belongs in `docs/reference/`, `docs/kb-notes/` or `cpl_memory`.**
  Anything you know you have a question about. *"What is the state of the
  funding lane"* is a question you arrive with — so §11 carries a one-line
  pointer per lane and the state lives in
  [`docs/reference/lanes/`](docs/reference/lanes/). That was **62% of this
  file**.

⚠️ **Doctrine must never be relocated into `cpl_memory`.** Its briefing budget
is 17,951 chars against ~85,500 of verified rows — **about 21% fits** — so a
rule placed there can be present and silently unread, which is strictly worse
than a large `CLAUDE.md` that at least loads completely.

⚠️ **The pointer is the safety mechanism, not a courtesy.** A pulled store you
were never told exists is the same as no store: it is exactly the failure Rule 8
was written for, where a session re-derived three settled facts that were
already written down. When you move something out of this file, leave the line
that says it is out there.

Deep reference already offloaded: `docs/reference/` — pipeline_reference ·
kb_build_status · mid_lifecycle · troubleshooting · obsidian_vault_wiring ·
finished_workstreams · `lanes/` (see the stubs below).

**Skills** (`.claude/skills/`) are pull-side too, triggered by their own
`description` rather than by a pointer: **exhibit-canonicalization** (collapsing
freehand MAP exhibit titles into unified credential names) and
**obsidian-markdown**. They are named here because a store nobody names is a
store nobody finds — `unreferenced_offload` flags any that stop being.

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
   **Trigger: `checkpoint_overdue` in the lint** — more than 6 commits since the
   newest `session_<N>_handoff.md` was written. ⚠️ **That exists because Rule 9's
   original trigger was "roughly every ~100K tokens… Claude Code doesn't expose
   an exact counter; use proxies", which is a condition NOTHING CAN OBSERVE** —
   the same defect that left `04-projects/` 41 days stale behind *"when the run
   worked inside a project folder"*. Handoffs land every 1–3 commits normally
   (median 2, p90 5), so 6 fires on the tail. The heuristic still applies between
   runs of the lint — long conversations, many tool calls, multi-phase work.
   ⚠️ **Run `/checkpoint`; do not improvise one from memory.** Asked to describe
   a checkpoint under pressure on 2026-08-29 I named 2 of these 13 artifacts and
   hand-waved the rest, and the answer looked competent. Update **every**
   artifact below — none are optional, all sync to the user's Obsidian:
   - **`docs/reference/lanes/<lane>.md` — THE USUAL CHECKPOINT EDIT (2026-08-28).**
     Each §11 roadmap lane's state lives in its own file; **§11's table is a
     POINTER INDEX**. Refresh the LANE FILE with what this run learned — same
     content and same standard as the old §11 cell, new address.
     ⚠️ **A checkpoint that updates only the §11 row leaves all 30 lane files to
     go stale** — that is the failure mode, and it is why this bullet leads.
   - **`CLAUDE.md`** — rules + the §11 pointer table + ≤2 session narratives.
     **Touch a §11 ROW only when the lane's STATE changes** (live ⇄ in progress
     ⇄ parked, open work appearing or clearing) — ⚠️ **do not grow a row back
     into a paragraph.** **Deep memory lives in `docs/reference/`
     (`lanes/` · pipeline_reference.md · kb_build_status.md · mid_lifecycle.md ·
     troubleshooting.md · branch_policy.md · engineering_ui_practices.md ·
     obsidian_vault_wiring.md): update THOSE at checkpoints** for tag counts,
     lifecycle/pathway changes, build-phase state, and new tabs/pipeline
     surface — do NOT re-inflate this file.
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
  American, of course."* Use **color · behavior · normalize · organization ·
  analyze · center · judgment · program · catalog · license (n and v) · gray ·
  enroll** and the `-ize`/`-ization` family. **Rendered UI text first**, then
  docs, then comments. Enforced by `american_spelling` in `kb/_docs_audit.py`.
  ⚠️ It scans PROSE only: `grey` is a valid CSS keyword and a token name is not
  a spelling, so never blind-replace inside code.
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

The operative rules are all here; the wording Sam used, the PRs each was written
against, and the toggle history are in
[`docs/reference/branch_policy.md`](docs/reference/branch_policy.md).

- Work on feature branches (`claude/<short-description>`); open a PR to `main`.
  **Sibling branches are authorized** — a session may open additional
  `claude/*` branches off `main` for INDEPENDENT PRs rather than stacking
  unrelated changes. One concern per branch.
- **Artifact policy: prefer CODE-ONLY PRs.** Ship generator/consumer changes
  without the regenerated `unified_courses_*.js` / `credential_reference_data.js`
  artifacts; merge, then dispatch `daily-dashboard.yml` and let the runner
  publish. Generated-file conflicts are never resolvable by picking sides.
  Manual artifact commits only when the workflow itself is broken.
- **Always watch PRs.** Subscribe to activity and follow through — fixing
  small/clear issues, asking when ambiguous — until merged or closed.
- **Auto-merge authorization (Sam, trust-expanded 2026-05-30).** Claude sessions
  merge **every** PR they open, as soon as the gates below are met. **Sam's
  review is NOT a gate** — do not wait for him to review, and do not wait for an
  explicit "merge" go-ahead. There is no carve-out for architecturally
  significant PRs: the real safety mechanisms live inside the workstream
  (dry-runs, in-script apply gates, `workflow_dispatch`), not at the merge button.
  - **Merge on `clean` OR `unstable`.** `unstable` means only a *non-required*
    check is pending or failing — a pending/failing *required* check reads
    **`blocked`**, never `unstable`. **Do NOT wait for `unstable` to flip to
    `clean`.** Only `blocked`, `dirty` (conflict) or `behind` actually gate.
  - **Poll CI via the MCP `github` tools, NOT `curl`.** The sandbox cannot reach
    `api.github.com`; a curl loop watching CI silently times out. Use
    `pull_request_read {method:"get"}` or `get_check_runs`. Webhooks do not
    deliver CI *success*, so you must poll. ⚠️ **A `check_suite.completed` wake
    is NOT a green light** — it names a routinely SUPERSEDED `head_sha`. Always
    re-read `get_check_runs` on the CURRENT head before acting.
  - **Hold only with a concrete reason** — a known gap pending something only
    Sam supplies, or a decision only he can make. Being a thing he asked for is
    **not** a reason to hold. When you hold: mark **ready**, state the reason.
  - **Never PARK a PR in DRAFT.** Mark ready immediately (a PR can be ready
    while CI runs) and squash-merge the instant it is mergeable, in the SAME
    turn rather than ending the turn to wait.
  - **Backstop:** after marking ready, call `mcp__github__enable_pr_auto_merge`
    (squash). It refuses while a required check is in-progress — poll and retry,
    or squash-merge manually.
  - **Method: squash and merge** (`mcp__github__merge_pull_request`,
    `merge_method: "squash"`).
  - **Branches auto-delete on merge.** Never run `git push origin --delete` from
    a session — the token 403s; GitHub handles it.
  - **Never force-push `main`** (Rule 5 — Pages serves from it).
  - The session-end handoff still notes any architecturally-significant PR that
    landed, even though no pre-merge pause happened.

## Presentation rules — EVERY view we ship (non-negotiable)

These govern **anything a human looks at** — a COBI tab, a public page, a
prototype, a Claude artifact, a docx — and they are PUSH because nobody stops to
ask "may I use an emoji here" before typing one. Spec detail:
[`engineering_ui_practices`](docs/reference/engineering_ui_practices.md) ·
[`reference-ui-design-system`](docs/kb-notes/reference-ui-design-system.md).

⚠️ **Recording a rule and having it fire are two events** — these kept scattering,
and one was carried out of this file entirely by a relocation.
`presentation_doctrine` in `kb/_docs_audit.py` fails if any of them leaves.

- **FIRST LIGHT, ALWAYS — INCLUDING ARTIFACTS AND PROTOTYPES (Sam, 2026-08-19).**
  *"Make sure it is based on our First Light design and make it always accessible
  and mobile friendly."* **Do not invent a palette.** Spec:
  [`reference-ui-design-system`](docs/kb-notes/reference-ui-design-system.md) +
  `prototype/first_light_theme_v1.html` v1.6; `var(--token)`, never a raw hex.
  It is a **light** identity with no dark PAGE palette.
- **ACCESSIBLE TO TODAY'S STANDARDS — AND VERIFIED, NOT CLAIMED.** Compute every
  fg-on-bg pair actually used (zebra rows and glass composites included) against
  **AA 4.5:1 / 3:1** — `prototype/check_contrast.py` holds the maths. **Color is
  never the only signal.** `th scope` on every header cell, an `aria-label`led
  region around any scrolling table, a skip link, `:focus-visible`, and
  `prefers-reduced-motion`.
- **MOBILE-FRIENDLY, ALWAYS.** Single column below ~560px, `clamp()` type, no
  fixed widths, and wide tables scroll **inside their own container** so the body
  never scrolls sideways.
- **PROSE RUNS THE FULL WIDTH OF WHATEVER SITS BESIDE IT (Sam, 2026-08-22).**
  The lever is `--cpl-measure: none` on `:root` in BOTH HTMLs (Rule 4); every
  prose cap is `max-width:var(--cpl-measure,none)` — **the `,none` fallback is
  load-bearing.** ⚠️ A cap below ~55ch is LAYOUT, not a measure, and must NOT be
  swept (`tests/cobi_prose_measure.test.js` pins a sample so a blanket sweep
  fails). Grep **px too**.
  [`methodology-a-text-measure-must-agree-with-what-sits-beside-it`](docs/kb-notes/methodology-a-text-measure-must-agree-with-what-sits-beside-it.md)
- **No horizontal scroll whenever feasible (Sam, 2026-06-11).** Tables/grids fit
  the viewport at desktop widths. `overflow-x: auto` is the narrow-screen safety
  net, never the default desktop experience. Use `table-layout:fixed` + an
  explicit colgroup — auto layout silently parks columns past the wrap's edge.
- **PLAIN WORDS, NOT GLYPHS (Sam, via #1212).** Every control is a **word** —
  *Rename · Hide · Remove · Seen by: … · All sites* — never an emoji or an icon
  standing in for a label. ⚠️ **This is not the same rule as "always
  glyph-paired" above and they do not conflict:** a *state-bearing* mark beside
  a word (▲▼ ✓ ⚠) is required, because color must never be the only signal; a
  *decorative* emoji used AS the label is banned. Decorative out, state-bearing
  stay, muted and simple.
- **AMERICAN SPELLING, ALWAYS** — rendered UI text first. Word list and the
  code-safety caveat are in **Naming & terminology** below.

## Engineering & UI practices (added Session 32, 2026-06-04)

Standing practices — honor them in normal work. Each rule below is the whole
rule; the **evidence** behind it (measurements, the worked failures, the
contrast maths, token names) is in
[`docs/reference/engineering_ui_practices.md`](docs/reference/engineering_ui_practices.md).
Read that before a UI rework, a First Light artifact, or a table layout.

- **Commit your verification.** Front-end (consumer JS) changes get a jsdom test
  under `tests/` (`npm test`; `tests/run.js` auto-discovers `tests/*.test.js`).
  Never a throwaway `/tmp` test — make it guard the *failure mode*. CI's
  `js-tests.yml` is **non-required** and never gates merge-on-green.
- **New CSS uses `var(--token)`, never a raw hex.** Missing role → add a token,
  in **BOTH** HTMLs (Rule 4). Derived tints get their own tokens.
- **Prefer injecting tab CSS from the tab's JS** (the `ensureCerScopeCss()`
  pattern) over editing the HTML `<style>` blocks — JS is one static file, so it
  covers both HTMLs without a Rule-4 mirror. Only `:root` tokens need the mirror.
- **Prototype UI in a fast-feedback canvas, then port.** Iterate the look in a
  Claude artifact, lock it with Sam, then implement into the monolith.
- **Stop-hook:** install `scripts/stop-hook-git-check.sh` to `~/.claude/`. It
  ignores GitHub's own squash-merge commits, which must NOT be amended (Rule 5).

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
artifact locations. Current-phase quick state: the §11 pointer table below
names each lane's state; its detail is in `docs/reference/lanes/`
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
> doc, which Rule 9 already says to write **once**. The cost of stacking is not
> bloat but CONTRADICTION, and **no reading order fixes a contradiction inside
> one document.** `stacked_roadmap_cell` guards **both** surfaces — this table
> and every lane file — mechanically, because Sam does not review checkpoint
> output by design.
>
> **Retiring a lane.** Completed rows through S32 are in
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

### SkyCrush S206 — six rules that stopped firing when they moved (2026-08-28)

**`CLAUDE.md` 151,484 B → 59,954 B, nothing deleted** (#1381 mechanical · #1382 the rule ·
#1383 the repairs · #1384 test speed). §11's 29 lane cells → `docs/reference/lanes/`; the
Obsidian wiring and the branch/UI **evidence** → `docs/reference/`.
⭐ **Sam's assignment rule is the whole lever** — *push what a session cannot know to ask
for, pull everything else* — and **split a section, don't relocate it whole**: branch policy
is PUSH at the level of the rule, PULL at the level of the evidence, so 8,227 → 3,304 B kept
every operative rule and reads better.
⚠️ **SIX guards/rules stopped firing because content moved, and every diff looked like
progress.** `stacked_roadmap_cell` hard-coded `rel == "CLAUDE.md"` and skipped rows with
<4 pipes, so the **two largest cells exempted themselves**; **`docs/reference/**` had NEVER
been indexed** (every lane globs a flat `docs/*.md` — 0 → 37); **Rule 9 still named only the
three 2026-07-10 pare-downs**, so a checkpoint would have left all 30 lane files to rot; and
**"PLAIN WORDS, NO GLYPHS" left the file entirely** with the row that carried it — a rule
that had *already* failed the same way once via `cpl_memory`. Now: a `## Presentation rules`
section (First Light · accessible · mobile · plain words) + `presentation_doctrine` and
`unreferenced_offload` lints, each broken on purpose and watched to fail.
⚠️ **THREE symptoms named the wrong thing** (npm, #1384): pipe truncation reported as *"176
checks stopped running"* (a child ending in `process.exit()` loses its buffer — 3,179 of
20,000 lines), a deleted `require` hid behind a green `node --check`, and a fixture's stale
dependency list read as failing assertions. **`npm test` 20.7 → 6.9 min in CI**, nothing
skipped; *"serialize the heavy family"* was killed by measurement (28 files = 78%).
⚠️ **`cpl_memory.scope`: 68 of 652 rows, uncontrolled vocabulary**, 25 duplicating the row's
own tags — recommended, **not written**. Stories `docs/obsidian_vault_hygiene_lessons.md` ·
`docs/test_suite_speed_lessons.md` · handoff `docs/session_207_handoff.md`.

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
