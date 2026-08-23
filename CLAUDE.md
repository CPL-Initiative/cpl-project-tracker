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
>
> **Finished-but-recent rows** — work that shipped and is stable, so its row
> states history rather than current truth — move to
> [`docs/reference/finished_workstreams.md`](docs/reference/finished_workstreams.md),
> verbatim. Moved 2026-08-15 (Sky160): **Team access / site phrases**, **Where
> you enter a credential**, **EACR filter rework**. This file auto-loads on every
> session, so a row nobody is acting on is a tax every future run pays. **When a
> row's NEXT step is done and nothing is pending, move it** — do not leave it
> inline as a trophy.

> ⚠️ **A roadmap cell states CURRENT TRUTH, not a log (added 2026-08-10).** When a
> session's finding contradicts what a cell says, **delete the superseded text** —
> do not prefix it with `*Prior:*` and leave it below. The history belongs in the
> workstream's lessons doc, which Rule 9 already says to write **once**.
>
> This was measured, not theorised: the "Disposition grain" cell had reached
> **14,338 characters** with **3 `*Prior:*` markers, 3 corrections and 14
> warnings** — four generations of claims stacked, some contradicting each other.
> §11 was 45,037 chars of a 102,587-char file that **auto-loads every session**.
> The cost is not bloat, it is that `CLAUDE.md` simultaneously asserted Sierra
> "sits on colleges' own pages" AND that "there is no internal COBI Sierra", so
> the same correction had to be made on two consecutive days. **No reading order
> fixes a contradiction inside one file.**
>
> `stacked_roadmap_cell` in `kb/_docs_audit.py` flags this at every checkpoint —
> mechanically, because Sam does not review checkpoint output by design.

| Phase | What | Status |
|---|---|---|
| 1b (3/3) | Curate-write Repair-from-members action (Supabase schema migration + fresh-read + cron-window) | parked (low immediate value — 1 cluster; build when ≥5 clusters exist) |
| 1c | More audit rules — **9 of 10 landed:** `discipline_title_mismatch`, `generic_title_concrete_discipline`, `top_discipline_disagreement` (+ SISTER_PAIRS suppression), `description_discipline_disagreement`, `subject_collision_signal` (Phase 1e diagnostic — **7,203 flags pre-re-mint**, target 0 post-re-mint), `unit_anomaly` (2026-05-26, 4,385 flags — first member-level cross-validation, also first non-discipline penalty via `TAG_PENALTY_ON_UNITS`; surfaces possible over-merges across credit-vs-noncredit unit-load variants), and **`merge_into_orphan`** (2026-05-27, **0 flags on current data** — preventive data-integrity detector for dangling `merge_into` pointers; valid targets = courses ∪ singletons ∪ `UC-CUR-*`; fires symmetrically on M-IDs + clusters with bad curation pointers). **`member_top_divergence`** (2026-05-29, **1,299 flags** — the cross-discipline over-merge detector; member colleges' TOP codes span ≥2 broad divisions, ≥30% minority; 736 carry no other strong signal; second member-level rule after `unit_anomaly`). **`subject_discipline_outlier`** (2026-07-13, Session 113, #761 — **~302 flags**, penalty 0.20; the mis-mint detector Sam's HVAC M10FR catch motivated: a row's assigned discipline is a small minority (≤15%, ≤3 rows) of its LOCAL SUBJECT CODE cohort AND the TOP code OR curated lexicon corroborates the SAME correction — two-signals-agree; **covers singletons** the corroboration-gated `top_discipline_disagreement` skips; 41 corrections fired `mismint-s113@bot`, `kb/mismint_out/2026-07-13/`; carries a `suggested_fix`). **Still queued:** `cluster_title_drift` (low yield until more clusters mint) | in progress |
| **Activity↔Project PR-D** | (Optional) split Workplan Goals into its own top-level tab if the page gets dense (Sam's prior preference: one page with two sections). | parked unless curator usage signals demand |
| **Excel→Supabase Phase 2-4** | Retire the master `.xlsx`; Supabase is the system of record. | 🔨 **Nearly done — the writer is gone.** Phases 1–2 + the config/KPI-ladder/budget/D-row work all shipped (Sessions 15–25, PRs #189–#223); the master `.xlsx` is **no longer written on any run**. **Remaining: P3** Update Log history — a product fork Sam **parked** 2026-06-01 (38 projects / 120 stale entries, latest 2026-04-08; options = read-only snapshot / retire keeping `latest_update` / a Supabase `project_update_log`) — and **P5**, dropping the `.xlsx`, blocked only by `read_projects` (KPI-ladder + outage fallback), `read_budget_plan` (+ budget `factors`/`year_labels`) and `read_update_log`/`archive_updates_to_log` (the one remaining writer, gated on P3). Independent: budget `total`/`avg` formulas + a personnel editor (fix the 26→13 dedupe row-identity first). Keep a Supabase→xlsx backup. Full shipped-phase history: [`docs/roadmap_archive.md`](docs/roadmap_archive.md); method: `docs/kb-notes/methodology-verify-consumer-before-migrating.md`. |
| **NC / Learning Partners** | Noncredit + not-for-credit + adult-school + ROP + HS-Cx + apprenticeship CPL — the thinking doc, the six modes, and the COBI register tab. | ✅ **Thinking doc + tab + write layer DONE** (SkyPartner, #981–#989). **Next by value÷effort:** ① populate the 4 standalone NC institutions in MAP (at ZERO); ② EMS Corps landing page + 500-alumni outreach (28 colleges already articulated); ③ work the 49 dormant statewide exhibits; ④ the mirroring playbook; ⑤ the 26-college dental list. **6 "Needs Input" items open in-tab** — biggest is HS-articulation scale. ⭐ **Pre-apprenticeship CPL now has a named mechanism set (Sam, 2026-08-10)**: noncredit coursework · industry certifications · **clearing admission requirements for the apprenticeship itself** (the one nobody names — it speeds *entry*, not just completion). Sharpens this row: noncredit coursework is a *named source* of pre-apprenticeship CPL and the four standalone NC institutions are still at ZERO. `reference-cpl-at-the-pre-apprenticeship-stage`. Funding metric PARKED by Sam until the mechanisms are mapped. |
| **MAP Users / student contact** | Every college landing page routes a student's CPL request to a real person. MAP routes on `primary_contact_email`. | ✅ **WORKLIST LIVE, WIRING AUDITED SOUND, CURATOR PROPOSALS ARE DATA** (SkyMail #991–#993/#1001; SkyHigh #1078; SkyBridge #1151; SkyRef #1167/#1171). **25 of 123 colleges have no `primary_contact_email`**: 17 resolve from the college's own MAP designations (coordinator→assistant→counselor→AO→initiator→faculty), 5 leadership-only, 3 no-MAP-presence (the standalone continuing-ed institutions). ⚠️ **MAP IS READ-ONLY FOR US — the nulls cannot be filled by us.** `map_users.js` `FALLBACK_CONTACTS` is a **DISPLAY-LAYER** fallback over **78** colleges (61 with an address, 17 blank-with-a-finding, 3 curator-supplied by Jessica); gated `map_contact_proposals` overlays the worklist with all 25 rows editable, chipped **`curator-set`** with who/when and **never claiming MAP holds them**. **Sierra does NOT read it** (Sam's call: MAP to-do only; a test asserts `cpl-chat` never references the table). Clearing writes **nulls, not a delete**; an RLS-filtered write returns **200 + empty body**, so a no-row write reports as FAILURE with the typed text kept. ⭐ **A provenance chip must say WHY, not WHAT** — a bare email beside a named row is not a lookup failure (`cpl_assistant_email` has no matching name column). ⚠️ **5 of the 8 "must be asked" are NOT empty colleges** — Gavilan has 13 active MAP users, Hartnell 15, nobody in any CPL role. ⚠️ **7 entries are `via:"search"` and `proposedFillFor()` REFUSES them in code** — sessions are egress-blocked from college domains, so Jessica's sourcing rules could not be applied; they render "Candidate — confirm". ⚠️ **2 colleges publish only a mental-health inbox — DELIBERATELY DECLINED** for CPL routing. ⚠️ **Mission College's proposal is a free-mail address** — MAP's own `cpl_coordinator_email`, first in the cascade; **FLAGGED, never filtered**. ⚡ **Roster sync is DAILY** (Sam, 2026-08-13) and Sierra reads `map_college_contacts` LIVE since v45 — a stale roster costs a student the wrong person to email. ⚠️ **MAP's sandbox orgs leaked into Custom Reports**; the suppress field already existed (`map_colleges.entity_kind`), `college_briefing.js` just never read it (#1171, `entity_kind=neq.test`). ⚠️ **`map_colleges` is a lookup table nothing rewrites** — the user/contact tables self-clean on the cron, it does not. **NEXT:** confirm the 7 search-tier candidates (start Palomar, Canyons) then flip to `via:"curator"`; work the 17 blanks; the 52 colleges WITH a CPL Assistant need a differently-egressed sweep. **NEEDS SAM:** 8 colleges keep a 2026-06-25 snapshot contact where MAP is now blank. Story: `docs/map_users_lessons.md`; durable [`methodology-a-provenance-label-must-say-why-not-what`](docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what.md). |
| **Partner crosswalks** | "Which of the occupations we train for can our students already get college credit for, and where?" — plus the college-facing half: "and what can THIS college carry?" | ✅ **TWO INSTRUMENTS LIVE.** ① **Statewide engine** (SkyWalker, #995) — `kb/_build_partner_crosswalk.py` + the shared `kb/occupation_credential_map.json` (139 occupations / 406 rulings / 35 curated no-CPL findings) + region presets + 32-check test. SJCOE run 1: 51 statewide / 53 local-only / 35 no-CPL. ② **College-scoped crosswalk** (Sky169, #1243) — `kb/_build_college_offering_crosswalk.py` + `kb/delta_offering_map.json`, for the SJCOE ↔ San Joaquin Delta meeting. ⭐ **A COLLEGE-SCOPED ASK IS A DIFFERENT INSTRUMENT, NOT A FLAG.** The statewide engine deliberately does not privilege the in-county college — right for a referral, wrong for a meeting where the whole question is what ONE college can do; and the two disagree about what a good answer IS (engine: *"some college offers this"*, a fact; college tool: *"this college teaches it AND the exhibit exists AND nobody joined them up"*, a task). Third time this call has come up — see also Futuro/HTH (#1134), where **one course × one program type** had no vocabulary to reconcile and a simpler generator was right. **Match the instrument to the question's shape, not to the word "crosswalk".** ⭐ **KEEP "does the college teach it" and "does an exhibit exist" in SEPARATE COLUMNS** — crossed, they ARE the deliverable: Delta **42 adopt-now** (teaches it, exhibit exists, MAP already flags it potential — no curriculum and no exhibit to build) · 6 build-first-in-state · **0 of 139 articulated today** (its lone career CPL is POST Basic Academy; the other 68 are AP/CLEP). Collapsing them into one score destroys the only distinction the meeting needs. ⭐ **Delta holds curriculum for the statewide gap run 1 found** — a utility/hydroelectric apprenticeship (`A IND 77A–77N`, `A ELE 75A–75F`) covering 6 occupations with **no CPL anywhere in California**. ⚠️ **Lineworker is NOT among them** (substation/plant electrical ≠ line work). ⚠️ **A capability can be INVISIBLE to a program search** — Delta's 10-course plumbing apprenticeship (`A CON 87A–90D`) sits under no plumbing-named COCI program and the prefix reads as *construction*; MAP lists Delta on neither side of the statewide C-36 exhibit. **Search the COURSE catalog, not just the program inventory.** ⚠️ **Narrative copy is a FINDING, so it lives with the rulings** (`_narrative` in the offering map), never in the generator — hardcoding it would make the reusable-engine docstring a lie; `check_absence_claims()` now hard-fails any row claiming CPL exists nowhere while its own exhibit list is non-empty (**caught 6 rows**: 2 utility, 4 masonry). **Next:** ① Ashley meets Delta — record which of the 42 they accept/reject/correct (corrections are the highest-value input to the offering map); ② the statewide engine's **2nd occupation list is STILL outstanding**, so "coverage compounds" remains a design intention, undemonstrated. **Parked:** the COBI tab (Sam authorized the *regional-capacity* view, not the judgment-based matching) and an **O\*NET SOC → certification spine**, which is what would let a match be defended rather than asserted. **Gap backlog:** the 35 no-CPL occupations. Story: [`docs/delta_college_crosswalk_lessons.md`](docs/delta_college_crosswalk_lessons.md) · [`docs/partner_crosswalk_lessons.md`](docs/partner_crosswalk_lessons.md). |
| **Governance & team enablement** | Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam. | ✅ **LIVE — team-gated ⚖️ Governance tab: 18 decision rights · 8 acceptance standards · 5 cadences · 8 open questions** (SkyMail #997/#998; Sierra added SkyMiner #1031/#1034/#1036; expanded 12→18 SkyGate). **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** The register **measures itself**: the contact-refresh cadence was decided in June and has never run (0 rows in `map_college_nudges`), and CA-06 shows Sierra feedback *21 of 25 untriaged*. Owners live in a separate gated `governance_owners` table overlaying by row id, so regenerating the JSON can never wipe an assignment; no delete policy (so `Clear owner` is a no-op on the 3 cadences carrying a register-file owner — the likeliest thing to be mistaken for a regression; 7 more reported defects unfixed). **DR-11** records what Sierra tells the public — honestly noting the decider has been Sam personally. **DR-13…DR-18** (SkyGate) cover the six surfaces nobody had recorded: **the workplan itself** (the most public artifact the project has, four tables editable in-page, no named owner), phrase rotation, contracts, CPL News, the Common CR Reference, TMC submissions. **Drift detector live + wired to the cron** (step 4a0): pure static analysis over 4 surfaces, **proposes, never auto-adds**; queue now **7**, all scheduled workflows nobody has listed as cadences — each needs a row or a reasoned dismissal. **Do not bulk-dismiss; the reason is the point.** ⚠️ A false stale flag was a **detector bug** (`\b` cannot match before a dot, so `.github/…` read as missing) — fixed with a negative lookbehind. `governance.test.js` **91/91**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human). **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. **Next:** ① fill the owner column, DR-13 first; ② run that cadence once end-to-end with a named owner; ③ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ④ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md`. |
| **Sierra retrieval + corpus** | Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP. | ✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ⚠️ **GUIDANCE AUDIT (SkyScope, on Sam's go): 1 of 7 active rules referenced a fact the request does not carry** — `15ec666b` named neither the tab nor the institution, so it was an instruction to GUESS. Budget is **not** binding (4,095/9,000 chars, 7/20 rows, 0 `display`). ⚠️ **All 7 ship to all 6 surfaces**, so that rule's opening condition is UNEVALUABLE everywhere, the public page included. **RECOMMENDED, NOT BUILT: a `surface` field** on the request + a nullable `surface` column on `sierra_guidance` — NOT a forked Sierra and NOT a `mode` enum (the differences are already separate fields: `audience`, `ctx`, `history`, `scope`). ⚠️ It will NOT deliver behavior contradicting a BUILT-IN rule (built-ins win in practice); that needs the rule registry to become surface-aware. **Blocked on Sam's go.** **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live — see the MAP Users row); 12 adoption-file statewide titles absent from `chatbox_credentials`; Sam triaged feedback **25 → 5**, 3 of 5 fixed in code. **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. Story: `docs/sierra_credit_recs_lessons.md` · `docs/sierra_credential_naming_lessons.md` · `docs/cpl_assistant_lessons.md`. |
| **Sierra: false absences + the statewide flag** | Why Sierra says "none" when there is plenty, why she disagreed with the Fact Sheet, and why she reported three colleges out of nine. | ✅ **THREE FALSE-ABSENCE CLASSES FIXED.** ① **Cerritos ironworker** (#1162, v44) — the raw corpus abbreviates, there was **no college-scoped curated route at all**, `search_credentials_any` never searched **`issuer`/`trainer`** and failed on plurals, and the local route had the narrowest probe budget. Now `search_college_credentials()` + a shared tier ladder (**new tier 5 issuer/trainer**, below the title tiers) + plural folding + 4/4/8 probes → all **13** return, **three reachable ONLY via issuer**. ⭐ **90% of credentials have an issuer word absent from the title**; 30% carry a curated word absent from every raw variant. ② **Statewide flag** — synced from the wrong file, so **42 credentials read as LOCAL** and Sierra contradicted the public Fact Sheet. Now UNIONs both (**126, up from 84**). ⚠️ `cpl_memory` already said *"use the adoption file"*: a settled ruling does not enforce itself, the consumer has to change. ③ **The census defect** (#1277, **v52**) — asked what LACCD should do, Sierra said **"Three LACCD colleges appear in the MAP platform data"** then closed with *"across all nine"*. **Nothing was missing**: all 9 are in `map_colleges` AND `chatbox_college_profiles`. Three came from a `.slice(0, 3)` on the tie list (the query reduces to `["angeles","district"]`, so all nine tie). ⚠️ **The identical bug was fixed 34 lines above and its twin left standing.** ⭐ **Raising the cap is NOT the fix** — it yields *"Nine colleges…"*, still false and **harder to spot**; the load-bearing half is the **disclosure** (rows stamped `_match`; context ships shown-of-total and forbids the sentence). ④ **The district roster** (SkyApply, #1280) — the *"cannot enumerate a district"* caveat was obsolete the day it was written: #1278 landed `district`/`mis_district_code` on `map_colleges` hours later. `resolveDistrict()` now answers a district question from the roster (LACCD = 9, MIS 740), **alphabetically**, and the caveat survives ONLY on the name-match path. ⭐ **The caveat was the small half** — **four districts have ZERO colleges named after them** (Los Rios · Peralta · State Center · Kern), so a name match returned nothing at all for them. ⚠️ **Complete only because the join was MEASURED** (116/116 have a profile row); a partial roster names who is absent. ⚠️ **Intent is required** — a bare stem would answer a Los Angeles *City College* question with nine colleges. ⚠️ **A false zero is the worst answer she gives** — it closes the conversation and nobody files feedback about a door they were told wasn't there. ✅ **MODE 7 FIXED (Sky185, 2026-08-23).** Its part-3 prose grep — six LA-basin college names — had been red since **Session 125** while Sierra answered correctly: she leads with the colleges that have ARTICULATED NCCER (Norco, Barstow) rather than the ones that merely TEACH the trades, a choice of EMPHASIS between two true things. **Measured at the retrieval layer instead:** the function's own tsquery for that question returns **150 rows / 78 colleges, FIVE of the six LA-basin colleges present** — the data reaches her, so the assertion was testing wording, not capability. New mode **7r** calls `search_college_offerings` with a NEGATIVE control first, a positive control, and a **threshold (3 of 6, never a named college** — mode 14's lesson: an assertion pinned to a value that can leave the data stops being a guard the moment it does). ⚠️ **The query is a TRANSCRIPTION and transcriptions drift** — `tests/sierra_offerings_retrieval.test.js` re-derives the term set from `index.ts` and fails the moment `TOPIC_SYNONYMS` changes. ⚠️ **The offerings query FILLS its 150-row limit exactly**, so truncation is live; ordering is guarded by `sierra_geo_ranking`, not by 7r. **Open:** 12 adoption-file statewide titles absent from `chatbox_credentials`; the M-ID leverage layer still omits Cerritos from welding adoption (a *different* question). Story: `docs/sierra_credential_naming_lessons.md`. |
| **Local course ↔ CR alignment** | "Which of MY courses should I articulate against this credit recommendation, and how did other colleges do it?" — so faculty don't guess. | ✅ **LIVE — cpl-chat v43** (#1153/#1154/#1155/#1158/#1161). **Three surfaces:** `chatbox_peer_articulations` (9,413 rows · 1,516 credentials · 82 colleges — the FACT), `chatbox_college_courses` (141,696 · 120 colleges), and `credential_alignment_for_college()` returning both in one round trip, discriminated by `row_kind`. ⭐ **THE LADDER — C-ID, then title, then best-aligned (Sam's ruling).** Only the **best available rung renders** — a fallback, never a blend, because rung 1 says the equivalence is ESTABLISHED by a statewide standard and rung 3 says "closest thing you have"; blending lets a guess outrank a fact. 16,067 of 141,696 courses carry a C-ID across 112 colleges. ⭐ **TWO SIGNALS, NEITHER SUFFICIENT, NEVER MERGED** — Santa Ana mapped `WELD 240 Structural Welding SMAW` / `WELD 244 D1.1 Code Clinic` to **FCAW** recs and **neither title contains "FCAW"**, so title similarity can never propose them; peer precedent is the only signal that finds the broader-course pattern. Candidates print above the peer heading, labeled; **no score reaches the model**. ⚠️ **A C-ID match whose NAMES diverge is FLAGGED, never suppressed** (`cid_title_divergent`) — POST carries `AJ 110` on two lines, and suppressing it would auto-resolve the repeat Sam ruled must never be auto-resolved. ⚠️ **A plausible false positive costs more than a miss here** — the first cut ranked `ART 100 Introduction To World Art` third for an FCAW rec, so `cx_align_tokens()` drops structural words and the scorer requires **≥1 CONTENT token** (`advanced`/`beginning`/`basic` deliberately NOT stopped). ⚠️ **Bound BOTH sides of the union and resolve the grouping key** — `per_rec` once capped candidates only (3,807 peers vs 9 candidates) and peers were keyed on their own wording (43 groups where POST's set is TEN, ~34 of them phantom), which together buried five C-ID matches and rendered them as *"check catalog"*. **A phantom empty group is indistinguishable from a real one.** Now 10 groups / 94 rows / 6 of 6. **`peer_total` ships as a COLUMN** ("showing 9 of 261") — a capped list must never read as a census. ⚠️ **Do NOT re-add a "closest match anyway" fallback** — built and withdrawn; it proposed `AUTO 160 Introduction to Automotive Electrical` for a *policing* rec, and it is structural, not tunable: a rec with no candidate is one where nothing shares a subject word. Real empties point at the **peer courses**. ⚠️ Candidates come from the **whole catalog** — scoping by TOP would gate on TOP (Rule 7). ⚠️ **`attribution`**: 8,809 `per_course`, 604 `group_wide` — name group-wide peers as a GROUP, never pair a college to a course. Recs come from the peer table UNION the published sets, so the **ready-to-adopt shelf aligns too**. **NEXT: Sam + team testing via Sierra Training; triage the feedback into instructions.** Story: `docs/local_course_alignment_lessons.md`; SQL of record: `kb/supabase_alignment_routes.sql`. |
| **Common CR Reference** | A canonical vocabulary of credit recommendations — what the CER did for freehand credential titles, for the freehand recommendation text. | ✅ **WORKLIST LIVE** (scoped SkyRunner #1174; built SkyCall #1176). ⭐ **SAM'S DESIGN RULING:** *"CID is only one factor… similar to the CCR, we take into account matching factors like title, course name and number, course description, subject, etc."* — illustrative, not exhaustive. C-ID-as-key fails BOTH ways: it over-merges (`AJ 110` on two genuinely different POST lines) and under-merges badly (only ~17% of the 2,344 strings carry a C-ID at all). ⭐ **AUTOMATION REACHES ~10%, SO THIS IS A CURATION WORKBENCH, NOT A MERGE ENGINE** — rung 1 published statewide 351 lines/134 credentials · rung 2 C-ID 36 of those · rung 3 CCR course identity 40 strings · rung 4 mechanical twin ~160 · rung 5 similarity **suggests, never merges**. **~90% is curator judgment no matcher reaches** (*Racial Issues and the Police* ≡ *Community Relations* — one POST topic, unrelated words), which is what the **+ Add a wording** picker is for. ⭐ **SCOPE IS GLOBAL + a split affordance (Sam, 2026-08-13):** 407 strings (17%) span >1 credential but carry **45% of all articulation rows**, and `Introduction to FCAW` is one recommendation under all ten AWS/ASME credentials carrying it. ⚠️ **RANK BY COLLAPSE VALUE (wordings × colleges), NEVER BY CREDENTIALS SPANNED** — the widest-spreading string is `3 hours in Elective Course Credits`: 61 credentials, **1 college**, a placeholder. Credentials-spanned would have ranked the corpus's least useful string #1; collapse value sinks it to #174 with no special case. Real head: `Intro to Administration of Justice` (5 wordings/26 colleges), then Principles & Procedures, then Criminal Investigation. **156 of 2,159 groups carry a decision; top 50 strings = 49.4% of all articulations — an afternoon, not an ocean.** ⚠️ **Units are NOT identity** (`SPAN 100` at 4/4.5/5) — a screen on rung 4 ONLY; rung 1/2/3 override it, so `Engine Performance` correctly merges 2/3-4/4/5 units and the spread is **always displayed**. ⚠️ **Grouping is by KEY, NEVER transitive** — 164 strings bridge ≥2 course identities, so components would chain `AJ 110`↔*Community Relations*↔`AJ 160`. ⚠️ **Two gates DON'T work: `attribution='per_course'`** (every poisoned `AJ 110` row carries it) **and a line-fraction/cartesian test** (`AJ 110` hits 8 of POST's 43 → reads non-cartesian → sails through). The gate that works is the credential's **COURSE count**. ⚠️ **A normalization and the screens that judge it MUST see the same text** — `screen_profile()` ran on the raw topic while the key ran on the folded one, so `Intro`/`Introduction` read as different levels and the level screen **blocked the top of the queue**; then the test re-implemented the folds, missed `adv`, and failed two correct groups. Fixed by EMITTING the profile, not re-deriving it. Decisions live in gated Supabase `cr_reference_decisions` keyed on `group_key`, so a rebuild can never overwrite a judgment. **NEXT: Sam works the head — the top ~50 groups — and we watch which rungs he overrides.** Story: [`docs/common_cr_reference_lessons.md`](docs/common_cr_reference_lessons.md) · scope [`docs/common_cr_reference_scope.md`](docs/common_cr_reference_scope.md). |
| **Military (ACE) CR Reference** | The same canonical-vocabulary question for the 98% of MAP's CR rows that come from ACE-reviewed military training. | ✅ **SCOPED, NOT BUILT** (Sky153). Sam: *"the military ones may be the stickiest"* — right about the lane, wrong about the mechanism. ⭐ **ACE IS ALREADY A CONTROLLED VOCABULARY**: **93.4%** of (`exhibit_id`, units, topic) groups hold exactly ONE text; the 6.6% residue is **case and punctuation**, never wording. So automation reaches **3× further than the freehand lane — 33.5%** of the vocabulary resolves with zero judgment (ladder: 10,117 raw → 7,106 after typography+units → 6,749 after the rank strip → **6,725** real topics). ⭐ **THE STICKINESS IS VOLUME + NAMING.** 6,725 topics vs 2,183, and a much flatter head: **250 decisions for half the lane vs 50** (top 25 = 21.5%, top 250 = 52.5%). The CCN>C-ID>M-ID cascade fires on **2.6%** of ACE rows vs **94%** of MAP-local — the mechanical proof behind "subject areas, not courses" — but the cascade **already ends in *published line*, and ACE's own text IS that line**, so no new naming ruling is needed. The two lanes share only **134 of 7,106 topics (5.9% of ACE rows)**: the built CCRR does not cover this one. ⭐ **A RUNG UNIQUE TO THIS LANE** — USMC skill-level tokens leaked into the topic text (`ssgt gysgt supervision`): **482 topics / 12,157 rows / 181 exhibits / 94 colleges**, and stripping the rank lands **306 topics / 10,550 rows** on an existing base topic. This is `cpl_memory` row **`f8`** (Marine JSTs repeat CRs at every skill level) surfacing at the text grain. ⚠️ Strip list **needs widening before it ships** — 176 don't land (`leadership ssgt and above` → dangling qualifier; spelled-out `gunnery sergeant … only`). The rank is an attribute (who qualifies), never part of what the credit is FOR. ⚠️ **THE FREEHAND RANKING RULE DOES NOT TRANSFER** — every head topic already sits at ~80–100 of 108 colleges (top 200 average **78**), so collapse value multiplies by a near-constant and ranks nothing. **Rank by ROWS** (the backlog each topic represents). ⚠️ **Token containment is SUGGESTION-ONLY**: `management` contains 21 narrower topics — `project management`, `records management`, `supply chain management` — **none of which are `management`**; merges stay pairwise and gated, never transitive. ⭐ **POSTURE CHANGE, not just a build change: a third of this lane is an INGEST defect.** 58 colleges hold BOTH casings of the same string and **0** hold only one, so no human ever chose — the variance travels with the record, not the institution. A workbench here would ask curators to do a parser's job **767 times**. **FREE WIN READY:** the not-a-topic class is **47 strings / 6,663 rows** (`Credit Is Not Recommended` 32/3,892 + individualized-assessment 15/2,771) — bigger than the 3,242 §11 previously cited, which was one string not the class. **NEEDS SAM (4 questions, §10 of the scope):** ① are ACE **unit variants** one recommendation? (`AR-2201-0552` issues *Orienteering* at 1, 2 AND 3 hours — **22.2% of the vocabulary turns on this**, and the earlier units ruling came from a different situation); ② is the 767-string typographic class fixed **upstream** or absorbed downstream (`cpl_memory` `o3` already proposes it); ③ how far to merge subject-area granularity (`supervision` / `principles of supervision`); ④ is the not-a-topic class auto-N/A? Scope: [`docs/military_cr_reference_scope.md`](docs/military_cr_reference_scope.md); durable: [`methodology-tell-a-parser-defect-from-a-people-defect`](docs/kb-notes/methodology-tell-a-parser-defect-from-a-people-defect.md). |
| **Disposition grain / student detail** | What a college has ACTED on, not just what credit exists. | ✅ **TABLES LIVE + SIERRA WIRED.** `map_student_credit` **537,908 rows** (student grain, reviewer-only RLS, **no write policies**) · `map_college_cr_unit` 204,714 · published aggregates `map_college_goal2` + `map_college_credit_summary` (suppression at write time) · lookup `map_colleges` (128). 🎓 **Course Credit tab LIVE.** ⭐ **THE HEADLINE: 1,051,870 units at Needs Action across 106 colleges, 63,991 ALREADY ARTICULATED** — everything built, nobody acted. Lead with the second figure; the million is a ceiling (~30% of reviewed credit is correctly Not Applicable). ⭐ **BUCKET MILITARY vs NON-MILITARY BEFORE TOTALLING (Sam, 2026-08-13).** A JST lands a few to **scores** of ACE-reviewed CRs per service member; a non-military exhibit lands **1–2**. Same lifecycle, so an undifferentiated total is **98.8% military** — military **432,693 CRs / 1,040,447 units** (17.4/student) vs non-military **3,305 / 10,698** (3.8/student, 868 students, 28 colleges). "A million units awaiting action" describes a college's veteran population, not its workload, and **hides the tractable non-military backlog**. ⚠️ **Bucketing is NOT discounting** and **raw inert volume never means "behind"**. ⚠️ **No military flag exists** — `military_credits` is an applied AMOUNT, zero on 84% of rows. [`methodology-bucket-military-and-non-military-credit-recommendations`](docs/kb-notes/methodology-bucket-military-and-non-military-credit-recommendations.md). **Number policy (Sam):** show published AND unsuppressed with a chip — published 1,051,870/63,991, unsuppressed 1,052,531/64,074, **both scoped `entity_kind='college'` (106 entities)**; **never change one half alone**. ⚠️ **Show both ONLY while ≥3 cells are suppressed** — at one, the difference IS that college's figure (`adr-student-detail-aggregate-disclosure-control`). ⚠️ **The person key is `tblStudentKey`, NOT `TblSOURCE.Student`** (a grouping counter; Sam, twice); the MAP id must never reach Supabase. ⚠️ **`applied_credits > 0` IS NOT "credit was awarded"** — it is **identical to `articulated_credits` on ALL 462,355 Needs Action rows**, so it measures whether credit EXISTS. Scoped to rows actually marked Applied the two measures agree to **0.1%** (30,055 students by units vs 30,091 by status). **Sam's ruling stands — publish BOTH and name the gap** — but the old **55%** figure is RETIRED (Sam, 2026-08-19): it came from an UNSCOPED comparison. Worklist view `map_applied_zero_units`. Students served **42,346** · transcribed **13,412**. ⚠️ **Never rank on TRANSCRIBED** — colleges batch-upload already-transcribed credit, so it exists at only 24 of 111 colleges (`reference-batch-uploaded-transcribed-credit`). ⭐ **Apprenticeship CPL IS measurable** — `apprenticeship_credits`, 309 students / 12 colleges / 6,617.80 units. ⚠️ **Only 4.2% of student rows are nameable** (22,606 of 537,908) — per-credential counts are a FLOOR and the denominator ships as a COLUMN. ⚠️ **537k is fine to STORE, too slow to aggregate LIVE** (~6s vs Sierra's 1.7–5.0s budget) — read pre-computed rollups, never the grain. Runbook [`docs/map_student_credit_reload.md`](docs/map_student_credit_reload.md); story `docs/student_detail_load_lessons.md`. |
| **CPL clean-up worklist** | What to fix in the CPL data, in what order, and who fixes it. | ✅ **LIVE — `map_cleanup_worklist`**, a TABLE rebuilt inside the nightly promotion. Authority: [`docs/map_cleanup_worklist.md`](docs/map_cleanup_worklist.md) — **read it before acting; the numbers live there.** ⭐ **BUILT FOR THE CUSTOMER SUCCESS TEAM** (Natalie Powell lead, Chelsea Mirada, Ally Barker); carries the **college contact for that class of work**. ⚠️ **THEY NEED THE TEAM PHRASE, NOT REVIEWER ACCESS** — reviewer is all-or-nothing and also reaches `map_student_credit` (student grain), `kb_curation`, `gr_*` and **`team_access` itself**. ⭐ **The gate dropped by MATERIALISING, not by weakening**; **`G9` refuses to finish the promotion if the rebuilt table loses it.** ⚠️ **No k-anonymity — internal tool, NEVER public.** ⚠️ **12 colleges have work and NO contact to call.** ⭐ **RANKED BY DECISIONS, NOT ROWS** (`effort_shape` per class). ⚠️ **A class marked `one rule` must be checked against its own TEXT before one instruction is written for it** — that is how **5,311 ACE deferrals nearly got a refusal's instruction** ([`a-one-rule-class…`](docs/kb-notes/methodology-a-one-rule-class-must-be-checked-against-its-own-text.md)). **P1 cannot yield credit 12,283** · **P2 Transcribed-no-units 14,348** (94% LA Pierce + Merced, an **ingest gap**) · **P3 Applied-zero 413** · **P4 approval cascade 2,225** (Initiator 1,026 across only NINE) · **P5 Credit by Exam 5,311**. ✅ **P5 RULED (Sam, 2026-08-20): present to STUDENTS as Cx options, never bulk-close** — the only close reason is a college not permitting Cx for that course. **SPLIT the same day on his own challenge**: `cx-course-named` **1,310 / 89 colleges, sendable** vs `cx-no-course-named` **4,001 / 95, NOT SENDABLE**. ⚠️ **A Cx offer must NAME A COURSE TO CHALLENGE** — without one it collapses into *"you may request Cx"*, which every student can already do. ⭐ **`map_ace_exhibit_titles` (25,794) + `map_cx_exhibit_guidance` (225 exhibits) now say what each blank exhibit IS and where peers put it** — 219 of 225 resolve; tier **3 / 47 / 175**. ⚠️ **COUNTING AGREEING COLLEGES CANNOT TELL CORROBORATION FROM A BLANKET MAPPING** — the second axis is **SPECIFICITY** (`MAG-51` spans **33** exhibits, `ADJ-1` spans **1**) ([`agreement-is-not-corroboration`](docs/kb-notes/methodology-agreement-is-not-corroboration-when-the-behavior-is-systematic.md)). **The titles are the deliverable; peer precedent is mostly noise.** **NEXT:** ① **Sam picks the surface — the guidance list is LIVE and INVISIBLE** (recommend a lookup panel behind the P5 row on MAP Data Quality, not another queue) and rules whether **tier 2 earns its place**; ② P1 as one instruction to ~100 colleges; ③ the 1,310 `cx-course-named` as the Cx offer; ④ P2 to Pierce + Merced; ⑤ the nine Initiator colleges. |
| **$50k / ESS 25-82 tab** | Turn the three bare outcome checkmarks into where-you-are / where-you-should-be / how-to-get-there, so colleges get unstuck and award real CPL in MAP. | 🔨 **GROUNDWORK DONE, REWORK NOT BUILT** (SkyPlan, #1007/#1012/#1014). ⭐ **The measure is the DISPOSITION RATE** — share of a college's credit recommendations carrying any disposition (Applied / **Not Applicable** / In Process). Median **4.7%**; MVC 3rd · Bakersfield 6th · Cabrillo 13th of 106 — the ONLY metric matching Sam's own read (three volume metrics ranked Cabrillo 24th–29th). Counting N/A as work done is load-bearing: Cabrillo is 844 N/A vs 320 Applied, so an applied-only metric scores it 9% not 34%. **Applied, not transcribed, is this phase's target** (Sam's correction — transcribing actualises when outcomes funding is live). Data: 436,720 rows at Needs Action (81%); **top 20 exhibits = ~40%** of the backlog; **11,495 rows are "Credit Is Not Recommended"** = a free auto-N/A win. **Build rules:** every step a FRACTION not a check (the Veteran Star taught colleges that uploading is the finish line — applied ≈ JSTs at ratio 1.00); reframe the Star as a starting line; **never rank colleges publicly**. **Next:** the rework itself, then wire Malone's view (expected 8/7) into `fetch_custom_report.py` + `_build_cr_backlog.py`. |
| **Implementation Funding tab / the $35M model** | The three priorities, their shares and factors, what each earns against, and the college-by-college allocation. | ✅ **LIVE, TWO-SIDED, DOWN TO TWO DIALS.** ⚠️ **Baked defaults in `cpl_funding_data.js` are STALE by design** — the live model is the Supabase overlay (`config.projects."cpl-implementation".scenarios."Scenario 1"`, camelCase; the reorder is a PERMUTATION stored BESIDE it). ✅ **SAM'S SAVED CONFIG: `priorityOrder [2,0,1]` — Access 34/Outreach 33/Success 33; factors 1.0; front-load ON; Year-2 mirror ON; deadline 2026-11-01; all metrics in CPL FTES.** 🆕 **BOUNDS — minimum `pool.floor_window` $175,000 · maximum `pool.cap_window` $400,000**, `0` disables the ceiling (SkyBound, #1293/#1297). 🆕 **THE RURAL CARVE-OUT IS RETIRED** (#1297) — its $1M folded into the main pool (**$24,240,308 / 115 colleges**); the `rural` flag survives as federal context only. ⭐ **THE FLOOR DOES NEARLY ALL THE WORK**: **69 of 115** sit at the minimum, **the median college IS the minimum**, and the ceiling binds **2 / $82,815 / 0.34%**. ⭐ **A CEILING CANNOT LIFT A FLOORED COLLEGE**, so the floor is the lever, up to ~$210,785 (the average award). ⚠️ **A FLOOR IS NOT FREE — a transfer priced in the earn rate of the middle**: unbound colleges earn **78.2% of base ($4,419/CPL FTES vs $5,649.63)**. ⚠️ **A FLOOR THE POOL CANNOT HONOR SAYS SO** (#1302) — the degenerate branch marked every row floored, so the box read *"33 at the minimum"* while each got **$30,303 of $50,000**; `floorInfeasible` REPLACES the note in both lanes. ⭐ **BOTH BOUNDS SOLVE TOGETHER** — bisect `lambda` in `clamp(lambda*size, floor, cap)`; `solveBounded()` serves BOTH lanes and ceiling-off reproduces the old loop bit-for-bit (why: the durable note below). ⚠️ **A BOUND ON THE MONEY IS A BOUND ON THE BAR** — a capped college's targets scale to **ceiling ÷ `plainRatio`**, so cap ÷ target is ONE rate above the minimum. ⭐ **THE EXPLAINER IS LIVE, NOT A SNAPSHOT** (#1304) — `funding-model/index.html` at **`/funding-model/`** paints from the engine + live config; `funding_model_payload.js` is SHARED with the Node builder (kept only for a FROZEN emailable copy); served paths asserted in `pages.yml`. 🆕 **THE NONCREDIT LANE IS BOUNDED TOO** — same solver, **33 institutions (30 colleges + 3 standalone)**, dials `nc_threshold_ftes` 500 · `nc_floor_window` $25K · `nc_cap_window` $100K, from the $1M carve-out. ⭐ **Noncredit is 111 institutions, not 4** (108 college rows carry NC FTES), so the THRESHOLD makes it affordable (111 floors = $2,775,000). ⚠️ **27 of 33 sit at the floor (68% of the pool) and growth only starts paying at 3,022 FTES** — the incentive is at ENTRY, not in the middle; the box prints `breakEven`. ⚠️ **NC money never sums into the credit total** — own column, own CSV columns, own My College line (Sam: *"the neglected step child"*). ⚠️ **A DEDUP HAS A SCOPE**: Mt. SAC NC carries `nc_ftes_on_credit_row` — the FTES is the duplicate, the institution is not (deleting the row erased a real $50,000 ESS grant). ⭐ **NONCREDIT PARITY IS ON THE TAB** (#1303) — noncredit is **7.1% of the teaching (81,988 FTES) and 4.0% of the money**; parity would be **$1,797,660**. Sam holds $1M and may raise it later. ⚠️ Building it exposed the **CCC total counting only the standalone roster** (missing **56,993 FTES**); both surfaces now use `allNoncreditFtes()`. ⚠️ **`held $X` IS PHASE-DEPENDENT** (Sam: *"worried about the message we're sending"*) — before the deadline every college is gated, so 115 "held" rows read as system-wide withholding; the row says **"opt in to start earning"**, the figure returning only after the deadline. **NEXT: ① the NC floor ($25K leaves 27 of 33 on it; $20K halves the break-even); ② whether $1M moves toward the $1,797,660 parity figure.** Both Sam's. Story: [`docs/cpl_funding_lessons.md`](docs/cpl_funding_lessons.md) ([archive](docs/cpl_funding_lessons_archive.md)); durable notes indexed in [`docs/INDEX.md`](docs/INDEX.md). |
| **My College (college action page) / MAP-team queue** | One page (not 123) where a college picks itself and gets its stats, its opportunities against the goals, and concrete to-dos — plus the same engine pointed INWARD at the MAP team's own backlog. | ✅ **LIVE. The tab opens on a CHOICE, and always asks** (Sky167 #1232–#1234; SkyAsk #1274; SkyVouch #1276). ⭐ **A remembered choice is a NAMED SHORTCUT, never a destination** — true of the COLLEGE (restoring it opened the tab for whoever was here last) and, one level down, of the **ROLE**: `audience` persists under a localStorage key SHARED with the public page and the Fact Sheet drawer, so a pick made once anywhere steered every answer for ever. It is REMEMBERED but only CONFIRMED per browser-tab session. ⚠️ The held question is RESUMED not dropped, pinned to its PANE, and `loadAudience()` ASSIGNS the flag rather than only raising it. ⭐ **THE HOST OWNS THE QUESTIONS, THE ANCHOR *AND* THE THREAD** (SkyScope #1291) — owning only the questions was the half that shipped, and the other two are what made Sierra answer an **LACCD** page **about RCCD**. `convo` is module-level so a thread follows the reader between panes (deliberate), and `finish()`'s `root.innerHTML = h` wipes the visible log on every scope change (also deliberate) — so the reader saw a clean conversation while the next question still shipped eight turns about the previous district. ⚠️ **A STALE THREAD SOURCES THE ANSWER, IT DOES NOT TINT IT**: `cpl-chat` folds prior user turns into the RETRIEVAL text when the new question carries <2 topic words of its own, and `riverside` is in `COLLEGE_ALIASES`. ⭐ **The invariant is a COMPARISON, not a clearing rule — *what is SENT is never more than what is SHOWN*** — which is why a pane with no subject clears the ANCHOR and keeps the THREAD, and why the code tracks the last NAMED subject rather than the previous anchor (that reads a tab round-trip as two changes of subject and deletes a live conversation). ⚠️ **A group scope must still not pass `null`** — that returns the widget to its PUBLIC starters, one of which names Riverside City College. ⚠️ **Clearing a transcript is NOT `logEl.innerHTML=''`** — the suggested-questions row lives INSIDE the log, so that detaches `chipsEl` and the assistant loses every starter. ⭐ **Sierra CAN now enumerate a district** (SkyApply, 2026-08-21): `map_colleges.district` + `mis_district_code` landed with #1278 and `resolveDistrict()` reads them, so a district question is answered from the authoritative roster rather than a name match. `districtIndex()` here stays client-side from the funding roster; **no member college is singled out** in an advisory question. ⚠️ **THE PANE'S INLINE `text-align:center` OUTRANKS THE CSS THIS MODULE INJECTS** — every lazy COBI tab ships that placeholder; `shedPlaceholder()` clears it. **Standing invariants:** `buildQueue()` is **pure**; **measure at load, never carry a list** (a failed read is `unknown`, never 0); ⚠️ **NEVER re-derive an allocation — call `_alloc()`** (Mt. SAC = **$522,239**) and **`_prios(name, slot)`**; ⭐ **join BOTH sides through `cplCollegeShort()`**; ⭐ **a ROLL-UP sums UNSUPPRESSED rows only**; ⭐ the briefing is a **docx that READS THE RENDERED DOM**; ⚠️ `askSierra()` must OPEN the section first; ⚠️ `prefill()` stays send-free; ⚠️ an ABSENT measurement must never render as an ACHIEVEMENT; ⚠️ `map_credential_student_rollup` is a **MATVIEW**. The lead figure is **ONE decision, not 300** — 98.8% of the 64,074 waiting units is Credit for Basic Military Service. ⚠️ **TWO OF FIVE SCOPES SHIP DISABLED WITH THEIR REASON** — SWP and ASCCC regions exist nowhere here, and `college_geo.region` is a **THIRD** scheme. **HELD BY SAM:** MAP deep links, the `?college=` RLS decision, the MIS side-by-side. **NEXT:** ① **deploy `cpl-chat`** — the scope fix is INERT until then, the client sends a field nothing reads; ② Sam re-asks the LACCD question in a browser (no session can — egress-blocked from `*.supabase.co`); ③ the redesign in a browser; the region lists when he finds them. Story: `docs/college_action_page_lessons.md`. |
| **College & district identity** | One taxonomy: every college/district name variant resolving to MAP's authoritative `college_id`, the CCCCO MIS district code, and every spelling any system uses. | ✅ **LIVE IN SUPABASE AND SURFACED AS A TAB** (#1131–#1133, #1278). `map_colleges` carries `district` · `mis_district_code` · `mis_college_code` · `district_type` · `mis_absent_why`; **`variants` populated on 118 of 128 rows**, 73 districts. ⭐ **SCOPE IS EVERY ENTITY WE HOST A LANDING PAGE FOR** (Sam, 2026-08-21), not just credit colleges. ⭐ **THE LINT IS THE POINT, NOT THE MAPPING** — `--observed-json` feeds every college-name STRING in a live table and reports the ones claimed by no identity: **10 findings over 130 observed names** today. ⚠️ **IT IS ONLY A LINT WHEN ITS INPUT IS SUPPLIED, AND THAT IS NOW ENFORCED** (Sky185): the input is optional, a rebuild without it publishes ZERO findings, and zero reads as a clean bill of health. The builder **exits 1** rather than overwrite a linted artifact with an unlinted one (`--no-lint` is the deliberate escape hatch), stamps `linted` + `observed_names`, and the tab renders **"not checked"**, never "Nothing outstanding". Inputs md5-verified against live before each rebuild. ⭐ **MAP's three sandbox colleges are OUT of Sierra's corpus** (`CabTest` · `Las PosTest` · `SantTest Ana`); ⚠️ **`entity_kind` could never have reached `Las PosTest College` — it has no `map_colleges` row to join to**, and its STATS were empty while its CONTACTS were real. Receipt: `kb/college_identity/2026-08-23_test_org_removal.md`. **Standing invariants:** ⚠️ fix the **JOIN**, never the table (`map_college_contacts` rebuilds from MAP nightly, so trimming its two trailing-space names puts them back tomorrow); ⚠️ **a variant must never shadow a canonical name** ("Mission College" is both); ⚠️ **a missing MIS code is a finding only for a COLLEGE**, or four permanent partner blanks push `unresolved` off zero for ever; ⭐ NOCE is `NORTH ORANGE ADULT` 863/860 and SDCCE is `SAN DIEGO ADULT` 076/070 — both pass the district-prefix invariant. ✅ **Sam's ruling (2026-08-21)** — Calbright and LAUNCH are two entities each, San Diego and North Orange one — is attributed DATA in `kb/reference/college_identity_rulings.json`, never hard-coded. ⚠️ **NEEDS MAP: `college_id` for `Calbright College Credit` + `Launch Apprenticeship Non-Credit`** — minting one would fabricate an identity the whole system trusts; reported `awaiting_map_id`. **Still open:** nothing in `cpl-chat` stops an equivalent sandbox row arriving tomorrow. **NEXT:** Sam looks at the tab; MAP supplies the two ids; district columns (done) vs its own `districts` table. Story: `docs/college_identity_lessons.md`. |
| **Admin tab / the side menu as data** | One place to manage the COBI side menu — order, grouping, naming, which sites show what, who sees it — beside what actually protects each tab. | ✅ **LIVE AND IN USE** (SkyGate #1193/#1195/#1196; SkyKey #1203; Sky159 #1209/#1210; Sky160 #1212/#1213/#1214). ⭐ **SAM HAS DRAGGED AND SAVED — `cobi_nav` holds 43 rows** stamped `slee@cccco.edu`, 2026-08-15 13:59 UTC (his renames *Metrics and Plans* / *MAP Team Tools*, a `settings` category, CPL Assistant hidden, audience rungs set). The three-handoff "unproven in a real browser" item was **closed by reading the table**, not by asking — the answer had been sitting there for hours. ⭐ **THE OVERLAY NEVER GATES THE MENU**: the page builds from code and paints, then applies the overlay if it arrives. Offline · HTTP error · malformed rows · a throwing `plan()` · a corrupt cache each land on the shipped menu, each tested. ⚠️ **LOCKOUT IS PREVENTED IN CODE, NOT THE TABLE.** **THREE lists, each on its own axis** — `PROTECTED` (never hidden) = admin+dashboard · `AUDIENCE_LOCKED` (never narrowed) = dashboard · `GROUP_LOCKED` (never grouped) = **dashboard alone**. Admin MAY now live in a category (Sam's Settings): `plan()` already LIFTS a protected tab out of a hidden group, so the drag ban was a second belt over a sealed door. The axis is always *what could the viewer not undo*. ⚠️ **DISPLAY IS NOT SECURITY** — menu columns and the live RLS gate (`cobi_rls_gates()`) share ONE table. **73 tables + 6 views: 29 public-read · 24 team-phrase · 10 server-only · 5 reviewer-only · 4 Finance · 1 GR · 0 with RLS off**; five tabs render **unknown with the reason**, never a clean bill. ⭐ **SHARE IS A REAL GROUP (#1213)** — it was synthesised from anchors with no `data-tab`, so **two menu items were invisible to the manager while the page looked complete**. Launchers carry `data-nav-link`, stored `kind='tab'` (no migration). ⚠️ Widening the set made three rules lie: the site filter (a link key isn't in any site's TAB list → would hide both), `sitesFor()` (would describe the menu differently from how it behaves), and `rowGate()` (**"Not checked" would have RISEN by two the day Share became visible** — a count going up because you started SHOWING something is a false finding). New `link` gate. [`methodology-a-manager-must-show-everything-it-manages`](docs/kb-notes/methodology-a-manager-must-show-everything-it-manages.md). ⭐ **PLAIN WORDS, NO GLYPHS (#1212)** — every control is a word (Rename · Hide · Remove · Seen by: … · All sites). ⚠️ **The no-cheesy-glyphs rule was recorded in `cpl_memory` 2026-08-14 and the tab shipped covered in emoji that same week** — recording a rule and applying it are two events. ⚠️ **A FULL-REWRITE SAVE MUST ROUND-TRIP WHAT IT DID NOT TOUCH**, and **a bulk POST is ONE INSERT over the UNION of the array's keys** (why `cobi_nav` held zero rows for two days). **NEXT:** ① Sam drags Admin into Settings and saves — enabled, his call; ② **the Finance phrase scope** (below); ③ **org roster as data** — `cobi_orgs.js` ORGS becomes a table, which is what makes "what is in Finance" ONE list and what a per-site Admin filter would read. Story: `docs/admin_tab_lessons.md`; ADR [`adr-the-side-menu-as-an-overlay-over-code-defaults`](docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults.md). |
| **Noncredit CIP categories** | Which of the CO's ten noncredit CIP categories a program belongs to — and what that means for CDCP eligibility and funding. | 🔨 **SCOPED + PARTLY BUILT; a blanket rule shipped and was reverted** (SkyCode, #1191 · #1192→**#1194** · #1198 · #1199). Read [`docs/noncredit_cip_category_scope.md`](docs/noncredit_cip_category_scope.md) before touching this — it is the authority and the numbers live there. ⚠️ **#1192 shipped "all noncredit programs → `32.0111`" and was live ~20 minutes.** Jenni clarified: **Short-Term Vocational ONLY** — ESL, Job Prep and some Basic Skills are CDCP-eligible on *other* codes, the rest of noncredit is leisure. The blanket rule was wrong for the **majority** of 3,187 programs. ⭐ **THE TOP IS NOT LOAD-BEARING.** Short-Term Vocational is `32.0111` **plus a secondary credit CIP** aligning with the subject, so the **1,796** programs on a "wrong" credit CIP are not errors — that code IS the secondary — and **1,789 of 1,796 (99.6%)** already sit inside their own TOP's crosswalk. A TOP-correction project was unnecessary. ⚠️ **TOP cannot decide the category even when correct**: only **28.8%** of programs are claimed by one category (Short-Term Vocational and Workforce Preparation are both "any vocational code" → **1,928 undecidable**); it blocks compliance for **17 programs / 13 colleges**; peer consensus repairs **38 of 3,187**. **Ladder:** 997 read to one category from their noncredit CIP · 76 off-list · 1,796 hold the secondary · 247 no CIP · 71 retired. Secondary CIP categories: CTE 1,327 · Both 177 · Non-CTE 292. ⚠️ **CTE IS FUNDING-BEARING** (CTE noncredit qualifies, non-CTE does not) → **category confirmed BEFORE CTE concluded**; the *"noncredit TOP must start with 49"* flag is **deliberately unshipped** (1,970 would flag, **1,601 of them `GOAL = CTE`**, and moving them off an asterisked TOP can strip the marker). ⚠️ **A relayed code table had its Basic Skills labels shifted by one, silently** — caught only by checking **all seven pairs** against the CO's certified catalog; the validator now runs on every rebuild. **Guards that survived the revert:** computed **never stored**; a proposal says `proposed · COCI has X`, never *"changed from"* (which claims a human decision); a proposed code must appear in the row's own option list. **BLOCKED ON JENNI:** the Basic Skills pairing (alone unblocks build phases 1–3) · `32.0199` (60) and `35.0101` (16) in use but off her list · is the 2026-07-15 crosswalk cut the locked one · is the secondary CIP becoming a COCI field · **can non-CDCP categories be CTE at all** (~1,300). **BLOCKED ON SAM:** where a confirmed category persists — `localStorage` is wrong for a funding-relevant determination; recommend a gated Supabase table with who/when, as with `cr_reference_decisions`. Story: [`docs/cip_crosswalk_lessons.md`](docs/cip_crosswalk_lessons.md); durable [`methodology-the-record-may-already-hold-a-better-signal…`](docs/kb-notes/methodology-the-record-may-already-hold-a-better-signal-than-the-field-you-are-repairing.md). |
| **Reviewer session lifetime & scope** | What "signed in" means, how long it lasts, and which browser tab has it. | ✅ **KEEPER LIVE (SkyKey, #1205); CROSS-TAB OPEN (#1207).** ⭐ **ONE DEAD TOKEN EXPLAINED THREE REPORTS IN ONE EVENING** — Admin *"save 400"*, Sierra *"says I'm not signed in"*, CR Reference *"could not read"*, all "fixed" by re-signing in, which is what hid the cause. A Supabase access token lives **~1h** and **13 of 26 modules check only the token's SHAPE**; all three of those tabs are in that half. `raci.js` has said so in a comment since June — **a lesson in one file is not a lesson in the repo**. Fixed with a **KEEPER, not a 14th copy** (`cpl_session.js` renews `cpl_sb` underneath every reader, so the 13 benefit **untouched**). ⚠️ **SHIPPING IT ALONE WOULD HAVE BEEN WORSE THAN THE BUG** — refresh tokens ROTATE, six modules renew from a **cached** session, and three of those **drop the session on any failure** = silent sign-out mid-edit; all six now re-read, with a static guard. ⚠️ **Only a definitive 400/401 may end a session** (raci dropped on ANY rejection, so offline cost you your work), and **reading must not delete**. ⭐ **`sessionStorage` IS PER BROWSER TAB** — Sam diagnosed it: the magic link opens a NEW tab, the one you were working in stays signed out, and `cpl_sb_return_tab` is powerless. #1207 makes `localStorage` canonical + mirrors it per tab; **a per-tab MARK distinguishes "fresh tab" from "signed out"**, else the sign-out button does nothing. Cap **12h** (`MAX_SHARED_AGE_MS`). **NEXT: one real-browser round trip proves the lot** — sign in → the OTHER open tab signs in → drag+Save on Admin → sign out → both stay out. Story + Sam's rulings: [`docs/session_credentials_lessons.md`](docs/session_credentials_lessons.md); durable [`methodology-a-rotating-credential-cannot-be-cached`](docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached.md). |
| **Org & phrase scope / auth model** | Which sites exist, which phrase opens which, and whether shared phrases survive at all. | 🔨 **MEASURED + RECOMMENDED, NOT BUILT** (Sky160, Sky168, Sky169). ⭐ **RECOMMENDATION: magic link + ONE `role` column on `allowed_reviewers` — explicitly NOT groups.** Sam re-opened his own 2026-08-14 ruling (*"I want to keep things stupid simple"*, `cpl_memory` `sam-roles-not-groups-keep-the-phrase`, verified). Measured: magic-link ALREADY covers more of COBI than phrases — **132 policies** call `is_allowed_reviewer()` vs **83** calling `team_pass_ok()`, and **31 modules** read a reviewer session vs **22** sending `x-team-pass`. So the question is only whether the phrase half survives. One role per person (admin/team/gr/fin); **the 132 reviewer policies do not change**; transition accepts EITHER a session OR a phrase so nothing goes dark; retire `ci` first (it protects nothing), then `gr`, `fin`, `team`. ⭐ **The scaling proof is our own KB note** `exclusive-surface-scopes-a-shared-credential`: a shared credential can only scope to a surface exclusive to ONE group, and exactly **2 of 34** COBI tabs qualify — so every phrase is structurally a **superset**. ⚠️ **Phrase STRENGTH is not the weakness** (measured by shape: all four are 12–13 chars, mixed case, digits + symbols); the weaknesses are **no identity on writes, no per-person revocation, silent spread**. ✅ **Reviewer roster 5 → 10 (2026-08-19)** — Ashley, Jessica, Malone, Kristen (rccd.edu) + **Pedro Campos (ITPI CEO), the first EXTERNAL-domain reviewer**, added on Sam's explicit confirmation. This closed the gap where team members named in this file were working through shared phrases because nobody had added them. ⚠️ **Reviewer is ALL-OR-NOTHING and that now has teeth** — beyond any phrase it reaches `map_student_credit` (**537,908 rows, STUDENT GRAIN**), `map_student_credit_prev` (220,588), `kb_curation` (32,441), the `gr_*` register, and **`team_access` itself — so a reviewer can read and rotate every team phrase**. A partner who needs `kb_curation` also gets student-grain data; that is the concrete case for the role column. Revocation is one DELETE per row. ✅ **GR phrase scoped** (`team_pass_check()` excludes `gr`, #1239) — residual: a GR-only holder needs the `team` phrase. **Finance stays parked** (genuinely shares 6 of 42 tables). **NEXT: Sam's go on the role column.** Measurement: [`docs/phrase_scope_analysis.md`](docs/phrase_scope_analysis.md); story [`docs/auth_and_repo_posture_lessons.md`](docs/auth_and_repo_posture_lessons.md). |
| **EACR — Exhibit & CR Adoption** | One place to see every exhibit, its credit recommendations, and the colleges that could adopt it. | ✅ **FILTER REWORK + MATRIX SUB-TAB + CSV EXPORT ALL LIVE** (Sky162 #1221–#1223 · Sky163 #1226 · Sky165 #1229 · #1230). Three college scopes — `adopted` (default) · `likely` (the prescriptive M-ID layer, which **names the local course**) · `any` (*a lead, not a match* — TOP-derived, so Rule 7 forbids it as a primary determination); **Sam has used it and confirmed the arrangement** (2026-08-17). Matrix = CER titles × colleges, **green adopted / brown still-available** (in parentheses so it survives greyscale), default **434 rows × 118 cols, 17.0% inked**, 1.6s on tab select. **Sam's four rulings, locked:** brown is the **peer benchmark** · open on **colleges** · default rows **≥2 adopters** · brown on **credible cells only**. ⚠️ **FILTER, COLUMN AND EXPORTS MUST SHARE ONE SCOPE** — made structural, not remembered: `matrixCell()` is ONE function called by both grid and CSV, so the spreadsheet cannot drift from the screen. ⭐ **ONE COLLEGE WAS TWO COLUMNS — a fold at the LABEL layer is not a fold.** `CaÃ±ada` is `Cañada` read as latin-1 and `excel_to_dashboard.py` emits BOTH (26 pairs); invisible because every consumer counted *through* `cplCollegeShort()`, whose `normalize()` folds `Ã±`→`n` — the label count was right for the wrong reason. Would have rendered an empty twin column, **indistinguishable by eye from a college with no data**. Folded in the roster rules as a **SUM**, never a pick. [`methodology-a-fold-at-the-label-layer-is-not-a-fold`](docs/kb-notes/methodology-a-fold-at-the-label-layer-is-not-a-fold.md). ⚠️ **Roster rules (`kb/reference/map_college_roster_rules.json`) are the ONE place identity folds belong.** Axis = **118 = 115 credit + 3 noncredit**; the 4th, **Mt. SAC Noncredit, has no identity in `map_colleges`** (Learning Partners item 1). ⚠️ **BROWN CANNOT BE THE LINE TOTAL** — 83% of adoptions are PARTIAL (median **3.07 of 9.26**) and no college has ever reached the total. ⚠️ **`chatbox_peer_articulations` IS THE WRONG UNITS SOURCE** (32.5% coverage); the raw `View_ArticulatedMAPExhibits` row carries college+course+rec together, so `adopter_units` reads at 100%. NOT `map_college_cr_unit` (reviewer-gated, no k-anonymity). ⚠️ **A content filter must never drop a column** — that reads as "this college has nothing"; narrow only under college-shaped filters. **NEXT: Sam looks at the grid in a browser** — density is his call; then the tilde (`Canada College` today), then fix the mojibake at source in `_build_statewide_prescriptive()`. **Curation carryover:** 4 unclassified-only titles the CER knows · 2 statewide cards matching no college · sweep `{0,N}` test bounds · the 50-group credential-view cap. Story: [`docs/eacr_scope_lessons.md`](docs/eacr_scope_lessons.md). |
| **GR register / CO policy & regulation review** | Every CO priority area's regulatory / Ed. Code revisions under consideration, with the artifacts informing them — pointed at the whole CO, not just CPL. | ✅ **BUILT, AUDITED, PHRASE-SCOPED** (Sky168, #1237/#1240). `gr_areas → gr_revisions → gr_artifacts`; was ONE jsonb blob, one topic, `writes: []`. 2 areas · 20 revisions · `dual-enrollment` is a marked **SAMPLE** (neutral prompts, never positions). `gr_content` retained as rollback. Tests **125**. ⭐ **CITATIONS ARE DATA** — a section dropdown cannot exist while §55050 lives in a sentence; *filter/facet/group-by* all mean **make the attribute addressable**, a schema change. ⚠️ **The JS bands MUST mirror `gr_citation_code()` in the SQL character-for-character** — they diverged, and **Gov. Code §53xxx is real**, so a bare `53410` is ambiguous against T5 §53410; assign by explicit range, REFUSE the rest, and store an inferred code as `citations_derived`. ⚠️ **THE CAVEAT MUST RENDER AND MUST TRAVEL IN THE EXPORT** — CPL's quoted statutory text is unverified; `draftWord()` writes a file that escapes the gate, the RLS and the room. Verification pass reports **N of M** (CPL is 0 of 16). ⚠️ **null ≠ empty** — a failed read must never render as a zero, and must not let `nextN` number a new row `1`. 🔒 Writes reviewer-only; `sensitivity` defaults **restricted** (nothing open); `gr_open_sections` needs **`security_invoker = on`** or a view bypasses the RLS it exists to enforce; `gr_history` has **no write policy**. ✅ Phrase scope: `team_pass_check()` excludes `gr` — one bit changed, `team`/`ci`/`fin` untouched, rollback one statement. ⚠️ **Residual: a GR-ONLY phrase holder lost the shared tabs** and needs the `team` phrase. Finance's own over-reach (36 of 42) stays parked. **NEXT:** ① Sam demos (open on the sample, close on the cross-area section index); ② flip rows to `sensitivity='open'` — his call, nothing open today; ③ editing (add-only); ④ the CO priority-area list. Story: [`docs/gr_register_lessons.md`](docs/gr_register_lessons.md) · [`docs/phrase_scope_analysis.md`](docs/phrase_scope_analysis.md); durable [`migrate-the-display-not-just-the-data`](docs/kb-notes/methodology-migrate-the-display-not-just-the-data.md) · [`a-filter-needs-a-field`](docs/kb-notes/methodology-a-filter-needs-a-field.md). |
| **Public/private repo split** | Partition the truly public views (Sierra, Fact Sheet, veteran map, landing pages) from COBI + the methodology, so the approach is not trivially cloneable. | 🔨 **SCOPED, NOT BUILT** (SkyRegister). Read [`docs/public_private_repo_split_scope.md`](docs/public_private_repo_split_scope.md) — it is the authority. ⭐ **The concern is IP PROLIFERATION, not privacy** (Sam, 2026-08-19); he explicitly ruled the 67 published college-staff emails fine as public data, comms presentation aside. **The legal half is already done** — `LICENSE` is All Rights Reserved with an explicit no-copy clause, so public never meant permitted. ⭐ **MOVE COBI, NOT THE PUBLIC STUFF** — the URL path IS the repo name, so whatever moves gets a new address; moving COBI keeps Sierra + Fact Sheet on the links already sent to colleges and breaks only ~10 team bookmarks. ⭐ **Cloudflare needs ZERO changes** — `ALLOWED_ORIGINS` exact-matches the ORIGIN (`https://cpl-initiative.github.io`), never a path, so a second repo in the same org passes untouched. ⚠️ **`fact-sheet/` is NOT self-contained** — an earlier read called it portable off its nine `./` tags; `factsheet.js` fetches `../fact_sheet_metrics.json` + `../live_metrics.json` at RUNTIME. **A tag scan cannot see a `fetch()`.** ⚠️ **The cron commits INTO the public surfaces** (`fact-sheet/statewide_recs.js`, `college_activity_template.html`; `cpl-stories.yml` writes `cpl_stories.js`), so a split needs cross-repo publishing: **B (deploy-key push) now, C (public pages read Supabase live, as Sierra already does) as the destination.** ⚠️ **Phase 3 needs the Team plan** — GitHub Free publishes Pages only from public repos, so flipping on Free takes the site dark. **Phase 1 is zero-risk and unbundled:** `sierra/` + `veteran-sprint-map/` are fully static with no root deps. ⚠️ **Secrecy is the WEAKEST moat** — a vendor with a full copy still cannot write to MAP, lacks the 116 college relationships and has no ESS 25-82; this trade is cheap only because what private hides (engineering docs) is not what drives adoption. **BLOCKED ON SAM:** ① should `cpl-knowledge-base` stay **CC BY 4.0** (it permits commercial remix of the methodology — the highest-leverage question); ② Free or Team; ③ option B or C; ④ private-repo name; ⑤ does the Alpha notice stay on the public surfaces. |
| **MAP Custom Reports (3 new) / ITPI automation** | Wire the three new MAP Custom Reports, load them, keep them fresh. | ✅ **LIVE ON THE CRON, NO HUMAN IN THE LOOP** (#1246–#1258). Daily **13:40 UTC**: fetch → staging → `map_promote_custom_reports()` → live, **ONE transaction**, gates that **FAIL CLOSED** (G1–G6 truncated pull/broken surrogate · **G7/G8 refuse to PUBLISH a recoverable suppression** · **G9 refuses if a rebuilt team table lost its gate**). ⭐ **THE RLS TRAP DOES NOT EXIST AS A STEP** — contents are replaced, never the table, so the reviewer-only policy on `map_student_credit` is never dropped. Both published aggregates + the clean-up worklist + the transcribed-gap detail rebuild in the SAME transaction. ⭐ **THE VALUE WAS TWO NEW DIMENSIONS, NOT FRESHNESS** — `Status` (articulation approval STAGE) and `CPLPlanStatus` (lifecycle CHECKS) were carried by no table we held. ⚠️ **`Status` is 91.2% BLANK**, top value `Implementation` — **it cannot facet the backlog**. ⚠️ **`CPLPlanStatus` holds SIX checks / 41 combinations**, delimiting inconsistent — split-and-strip, stored verbatim. ✅ **TRANSCRIBED = UNITS, NEVER THE TICK** (Sam, 2026-08-19; no code change needed — every published figure already sums units). ⚠️ **The grain is planned to change** — CR-row check marks are coming; re-measure the constant-within-student test first. ✅ **The 55% applied fork is RETIRED** (Sam, 2026-08-19) — the ruling *publish both and name the gap* stands, the figure does not: `applied_credits` is **identical to `articulated_credits` on all 462,355 Needs Action rows**, and scoped properly the measures agree to **0.1%**. ⚠️ **CATALOG YEAR ROLLS FORWARD, so the axis is MUTABLE.** ⚠️ **A LOAD MUST REPRODUCE ITS SOURCE, NOT IMPROVE IT** — the gate caught `""`→NULL on ~200k rows, then a NOT NULL mismatch; **zero-fill is PER TABLE**. ⭐ **MINIMIZATION HAPPENS TWICE** — 12 fetched columns with no consumer dropped and **listed**; `StudentMAPID` derives a surrogate and is discarded; rotation detector is a **min-hash sketch, not a student map**. ⚠️ **THE CLEAR IS NOT A GATED STEP** — it runs BEFORE the promotion, and its mass `DELETE` timed out the first time it met a FULL staging table (would have failed nightly). Now `map_clear_custom_report_staging()`, a no-argument TRUNCATE, **5.3 s**. **NEXT:** watch the first unattended 13:40 run — now also the first exercise of the new clear. Runbook [`docs/map_custom_report_load.md`](docs/map_custom_report_load.md) · story [`docs/map_custom_reports_lessons.md`](docs/map_custom_reports_lessons.md). |
| **Fact Sheet (public) — curate access + accessibility** | Who can edit the public Fact Sheet, and whether the page actually works for everyone who lands on it. | ✅ **BOTH SHIPPED** (SkyCurate, #1269) and **CONFIRMED LIVE BY SAM, 2026-08-21: Curate is gone in a private window.** ⭐ **THE CURATE BUTTON WAS NEVER THE GATE** — writes are RLS'd to `is_allowed_reviewer()`, the anon key can read and never write, and `factsheet_edit.js` is **served publicly**, so any reveal switch is discoverable. Hiding it is **presentation**: a visitor stops being offered a control they cannot use. A test pins that the reveal flag is never consulted by the auth helpers. ⚠️ **HIDING THE BUTTON ALSO HIDES THE WAY IN** — it *was* the sign-in entry point, so `isReviewer()` alone strands a curator on a new laptop or past the keeper's 12h cap. **Two doors:** ① the page loads **`cpl_session.js`**, so a COBI sign-in reaches it across browser tabs; ② **`?curate=1`**, stripped from the address bar on read and remembered per browser. **The bookmark is `fact-sheet/?curate=1`.** ⚠️ **A STICKY REVEAL READS AS A REGRESSION TO THE PERSON IT WAS BUILT FOR** — the curator's browser is the one holding the flag, so working and broken look identical from outside. Rule-out order before touching code: ① this browser remembers it (`?curate=0` forgets); ② a live reviewer session; ③ a cached `factsheet_edit.js`/`factsheet.css` (no version query on the tags). **Only a private window, plain URL, no session answers the question.** ⚠️ **`hidden` in the markup is decorative when a class sets `display`** — `.btn{display:inline-flex}` outranks the UA `[hidden]` rule, so the CSS half is load-bearing. ⭐ **THE ACCESSIBILITY AUDIT FOUND MORE THAN THE FEATURE DID — four real defects, none reachable by the nine existing jsdom suites** (worst: the statewide grid needed 368px of fixed track, so at 360px the program name printed ON TOP of its figure and "Could adopt" was clipped out of existence — **a page that silently drops a column looks complete**). All 31 painted contrast pairs already passed AA. Details in the lessons doc. **Verification is split by instrument:** `tests/factsheet_a11y.test.js` (69 checks, CI — jsdom has no layout engine) and **`fact-sheet/check_mobile_layout.js`** (Chromium, on demand, deliberately NOT in `npm test`; 9 viewports + keyboard + reduced motion). ⚠️ **No session can verify the live page** — the sandbox is egress-blocked from `cpl-initiative.github.io`, which is why the last step is always Sam's. **NEXT: ① Sam opens it on his phone** — the only item still outstanding. Story: [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md); durable [`hiding-a-control-also-hides-the-way-in`](docs/kb-notes/methodology-hiding-a-control-also-hides-the-way-in.md) · [`verify-with-the-instrument-that-can-see-the-defect`](docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect.md). |
| **Sierra + Veteran map — accessibility & mobile** | The other two public standalone pages, both shared with colleges, neither ever layout-audited. | ✅ **AUDITED AND FIXED** (Sky175, #1271). ⭐ **THE WORST FINDING: `@media (max-width:760px){#side{display:none}}` DELETED THE VETERAN MAP'S ENTIRE SIDE PANEL ON ANY PHONE** — the Details pane, both directories, both searches, every CPL landing-page link. Tapping a college still selected it and rendered its detail **into a panel that was not on the page**; the map remained, so nothing looked broken. Same shape as the Fact Sheet's clipped column: **a page that silently drops a feature looks complete.** Panes now stack 52/48 and selection scrolls the panel into view. ⚠️ **The map's whole content was keyboard-unreachable** — an SVG `<g>` is not focusable and the only handler was `click`, and the directory rows were `li.onclick`; markers + rows are now focusable, named, Enter/Space-driven, and focus shows the hover tooltip. Also `100vh`→`100dvh`, 19px tap targets (**the label is the hit area, not the 13px checkbox**), unnamed `+`/`−` zoom buttons, tab state living only in a CSS class. ⚠️ **The map HTML is GENERATED** — every fix is in `build_selfcontained.py`; a test asserts the artifact is still a build of it. **SIERRA:** beta disclaimer **2.80:1** and footer **3.12:1**, both under AA — ⭐ **the least legible text on the page was the sentence telling a student to confirm with their coordinator**, and at 12–13px no faint third gray can exist (no large-text exemption below 24px/18.66px bold); two animations with **no** `prefers-reduced-motion`; `role="radiogroup"` over `aria-pressed` **buttons**; 19px of sideways scroll at 320px from `min-width:auto` on the flex input. ⚠️ **The log's keyboard reachability was INVERSELY correlated with its content** — it is reachable only because the starter chips inside it are focusable, and `submit()` REMOVES them after the first question. Auditing the pristine page sees none of it. ⭐ **THREE OF THE NEW CHECKS WERE WRONG BEFORE THE CODE WAS, AND ONE COULD NOT FAIL AT ALL** — under `file://` `sheet.cssRules` throws, so the motion check read nothing and printed ok (fixed at root: the harness serves over http://, an unreadable sheet now FAILS); `getBoundingClientRect()` ignores ancestor clipping; a label-wrapped checkbox is not a 13px target. And **Chromium 127+ makes an OVERFLOWING scroller focusable with NO tabindex**, so both behavioral checks for Sierra's log passed against the unfixed page — **the measuring browser can hide the defect**, so the ATTRIBUTE is the check and the behavior is a labeled regression guard. ⚠️ **159 map pins are 7×7 and stay that way** — SC 2.5.8 **Essential** (a pin's size/position encode geography; 24px would make the LA basin one blob and MISSTATE locations). The exemption is **guarded, not silent**: it must name an equivalent route and the harness verifies it (115 + 44 directory rows at 362×28, reached by a declared tab click), so deleting the directories un-exempts the pins. ⚠️ **The pin count "appeared" only because the fix gave them `role="button"`** — a count rising because you started SHOWING something is a false finding (#1213 again). Verification split by instrument: `tests/public_pages_a11y.test.js` (**44 checks, CI, 38 fail pre-fix**) + `scripts/check_public_page_layout.js` (Chromium, on demand, 9 viewports + contrast + headings + focus + motion + functional keyboard, deliberately NOT in `npm test`). **NEXT: Sam opens both on a phone** — no session can, the sandbox is egress-blocked; then the map's 52/48 split is his call. Story: [`docs/public_pages_a11y_lessons.md`](docs/public_pages_a11y_lessons.md); durable [`the-measuring-browser-can-hide-the-defect`](docs/kb-notes/methodology-the-measuring-browser-can-hide-the-defect.md). |
| 2 | Articulations by Unified Course — interactive view + curation | parked |
| 4 | SLO ingestion + the rest of the MC slot fields | parked (unlocks MC-readiness scoring) |
| 5 | CTE classifier (TOP code → COCI CTE field) | parked (unlocks CIDx lane) |
| 6 | CIDx submission automation (the eventual goal) | parked (the destination) |
| 7 | M-ID → CID substitution workflow on approval | parked (governed by Rule 7 once re-locked at faculty publication) |

The auditor is the foundational instrument for the whole pipeline: every phase
upstream of CIDx submission produces a higher trust score and graduates rows
from one readiness tier to the next.

### SkyBound — two bounds, one dial fewer, then a whole new lane (2026-08-22/23, Session 184)

**Sam: add a Max Funding factor beside the minimum, set $400,000, recalculate — then,
once both bounds existed: *"we don't need the rural carve out since all are benefitting
from the floor… fold the funds into the total available."*** Merged **#1293** + **#1297**.
⭐ **MEASURED BEFORE BUILDING, TWICE, AND BOTH TIMES IT CHANGED THE RECOMMENDATION.** The
$400K ceiling holds 6 colleges and moves **1.1% of the pool**, none of it to the 45 at the
minimum — **a ceiling cannot lift a floored college**. And the rural removal was
*two-thirds* right: ten of 13 rural colleges moved **$0**, but three sat above the floor
and the released money re-splits to the **largest** colleges — regressive in direction
while "near zero" in aggregate. Shipped **paired with the floor raise to $175,000**, which
pays that cohort **$236,406 more** than the carve-out ever did.
⭐ **THE FLOOR IS THE LEVER, AND IT IS NOT FREE** — at $175K, **69 of 115** colleges sit at
the minimum, **the median college IS the minimum**, and the unbound earn rate falls to
**78.2% of base**. A floor is a transfer priced in the earn rate of the middle.
⭐ **THE SOLVER HAD TO CHANGE SHAPE**: a floor is monotone, a ceiling is not — pinning at a
ceiling RELEASES money and lifts colleges back **off** the floor, which the old
pin-as-you-go loop strands **with the pool still balancing and every row inside both
bounds** — invisible. `allocModel()` bisects `lambda` in `clamp(lambda*size, floor, cap)`
and reproduces the old loop **bit-for-bit** with the ceiling off (`0.000e+0`), asserted
against a transcription of it.
⚠️ **A BOUND ON THE MONEY IS A BOUND ON THE BAR** — scale to **cap ÷ `plainRatio`**, not the
bare cap, or the largest colleges get the state's only unsubsidized rate; and the clamp
must reach **both** target paths.
⭐ **A REDUNDANT-LOOKING MECHANISM CARRIED A SECOND JOB NO COLUMN SHOWS** — the rural
allowance was the pool's only **unconditional** money, so the 13 went **$76,923 guaranteed
→ $0** while ten of their allocation figures did not move at all.
⚠️ **FOUR VACUOUS CHECKS IN TWO SESSIONS ON THIS ONE TAB** — every one a threshold that
moved out from under an assertion naming a specific number. ⚠️ **The explainer's
worked-example cards were hand-typed and two of four figures were stale**; generated from
the payload now, in a file whose docstring says every figure comes from the engine.
⚠️ **Sierra is DOWN** — every model-backed smoke mode returns *"credit balance is too low"*;
nothing alerts on it (the workflow runs only on dispatch or a cpl-chat push).
Durable: [`a-second-bound-breaks-a-pin-as-you-go-solver`](docs/kb-notes/methodology-a-second-bound-breaks-a-pin-as-you-go-solver.md) · [`a-mechanism-that-looks-redundant-may-be-carrying-a-second-job`](docs/kb-notes/methodology-a-mechanism-that-looks-redundant-may-be-carrying-a-second-job.md) · story `docs/cpl_funding_lessons.md` · handoff `docs/session_185_handoff.md`.
⭐ **THEN THE NONCREDIT LANE** (2026-08-23). Sam: *"Let's go with the NC>=500 with a $25k
floor… we could retire the NC section provided we could integrate the values on the college
rows"*, then *"add a funding box to make the NC>=500 a variable."* It was a flat FTES split of
$1M among four campuses; it is now the **same clamp** over **33 institutions — 30 credit
colleges plus 3 standalone** — with three editable dials. ⭐ **Noncredit is 111 institutions,
not 4** (108 college rows carry NC FTES), so the THRESHOLD is what makes it affordable.
⭐ **A COMMENT PREDICTED THE SEAM** — `solveAlloc`'s bounds functions were documented as *"the
one seam a second pool would swap"*, so the new lane calls `solveBounded()` and the credit lane
became a five-line caller; the transcription test still proves no dollar moved.
⚠️ **A DEDUP HAS A SCOPE.** Removing Mt. SAC NC's duplicated FTES by deleting its roster row
**erased its real $50,000 ESS seed grant** — caught by a test on an unrelated surface that
asserted a count *with its reason attached*. The FTES was the duplicate; the institution was not.
⚠️ **THE CSV'S TOTAL ROW HAD BEEN ONE CELL TOO WIDE FOR MONTHS** — three empties against two
headers on the SYSTEM row and every district subtotal, so every figure from that point right sat
under the wrong heading in the one row a reader checks first. Invisible in the browser.
⚠️ **27 of 33 sit at the NC floor and growth only starts paying at 3,022 FTES** — Sam's stated
reason for the lane was the incentive, so the model now reports `breakEven` and the box prints it.
Durable: [`a-deduplication-has-a-scope`](docs/kb-notes/methodology-a-deduplication-has-a-scope.md) · story `docs/cpl_funding_lessons.md`.
⭐ **THEN SAM MOVED THE DIALS AND EVERY REMAINING DEFECT FELL OUT OF IT** (2026-08-23, #1302–#1306).
He set the credit floor to $150K and the NC floor to $50K "just to see", and reported the changes
had not propagated. They had — the tab's own numbers were his — but the report was still right:
**three surfaces were lying, each in a different way.**
⚠️ **$50K × 33 = $1,650,000 against a $1,000,000 pool**, so the solver's degenerate branch paid
each institution **$30,303** while the box said *"33 at the minimum"*. A model that silently pays
less than the number on its own dial is the worst state this has; `floorInfeasible` now REPLACES
the note in both lanes (the ceiling's mirror case has had a warning since it shipped).
⚠️ **The explainer had not moved at all** — it was a Claude artifact rebuilt by hand, on a host
that blocks the call it would need. Sam: *"move explainer to Pages"*. It is now a live page at
`/funding-model/` off the same engine; the payload builder is SHARED so a snapshot and the live
page can differ only by WHEN, never by HOW.
⚠️ **The "held $X" label** (Sam: *"worried about the message we're sending"*) appeared on all 115
rows months before the deadline, reading as system-wide withholding. Phase-dependent now.
⭐ **THE PARITY NUMBER HE ASKED FOR EXPOSED A THIRD DEFECT** — building "noncredit is 7.1% of the
teaching and 4.0% of the money" surfaced a **CCC total counting only the standalone roster**,
missing **56,993 FTES** on the exact card a reader uses to judge that share.
⚠️ **TWO VERIFICATION FAILURES, AND THEY COST A RED MAIN.** I merged #1303 and #1304 on the green
REQUIRED check while the non-required suite covering my own change was still running — and had
verified locally with a subset I chose myself, which happened to exclude both files that broke.
Then I told Sam the local full run passed on exit 0; it was **SIGTERM 143**, killed by my own
pkill, and the "exit 0" belonged to the wrapper. Same class as the `; echo "EXIT=$?"` trap already
in this file. ⚠️ And my page test asserted on `#tbody` — **the one container that clears itself** —
so it passed while three others accumulated copies until Sam saw the cards render three times.
Durable: [`a-green-check-you-did-not-scope-is-not-evidence`](docs/kb-notes/methodology-a-green-check-you-did-not-scope-is-not-evidence.md) · [`a-snapshot-of-a-live-model-is-a-claim-that-decays`](docs/kb-notes/methodology-a-snapshot-of-a-live-model-is-a-claim-that-decays.md) · handoff `docs/session_186_handoff.md`.


### SkyScope S185 — nobody was watching, and she was paying full price twice over (2026-08-23, Session 185)

**Sam: *"let's pick up the queue"*.** (Moniker collision: Session 183 also ran as
SkyScope; Sam's greeting named this one, so both exist — disambiguate by number.)
⭐ **THE FIRST QUEUE ITEM WAS NOT IN THE QUEUE.** Rule 8's read step surfaced a
`verified` `cpl_memory` row from that evening: **Sierra was down** — Anthropic credit
exhausted, **second outage in two days**, and both found by a session happening to look.
A fresh smoke dispatch confirmed it live at 00:01 UTC. Sam topped up mid-run.
⭐ **NOTHING WATCHED HER**: `cpl-chat-smoke.yml` and `sierra-preflight.yml` fire only on
dispatch or push, so outage duration was set by luck. New `cpl-chat-health.yml` — one
question every 3 hours, raises/reuses/closes a GitHub issue. ⚠️ **A liveness check is
only worth having if it can say no**, so the test RUNS the probe against a mock in five
shapes and asserts exactly one reports up. ⚠️ **The cadence carries its price in the
file** (hourly ≈ $22/mo vs 3-hourly ≈ $7) — Sam funds this personally today.
⭐ **THE COST LEVER WAS NOT THE MODEL.** Asked whether Haiku would be cheaper: there is
**no Haiku 4.6** (it is 4.5, $1/$5 vs $3/$15, and 200K context not 1M) — but
**`cache_control` appeared ZERO times** in a 200 KB function carrying ~7,000 stable
tokens per turn. ⚠️ **I told Sam caching was risk-free and it is not**: caching is a
PREFIX match, the preamble is 242 tokens (below the ~1024 minimum, so a breakpoint there
caches nothing **and says nothing**), so the always-rules had to move ahead of the
sources. ⚠️ **"Mostly stable" is WORSE than no caching** — a write costs 1.25x, so
caching the whole rule block (the one-line version) would have been a surcharge, since
`appliesWhen` varies it by mode. Shipped: the `always` half only, **2,992 tokens
byte-identical every request**, proven by RUNNING the assembler over all 16 context
combinations.
⭐ **SMOKE MODE 7 HAD BEEN RED SINCE SESSION 125 ON CORRECT ANSWERS.** Its part-3 prose
grep wanted LA-basin colleges that TEACH construction; Sierra leads with the ones that
ARTICULATED NCCER — the other true thing. Measured at retrieval instead: the function's
own tsquery returns **150 rows / 78 colleges, 5 of the 6 present**. Mode **7r** asserts
that via the RPC with a **negative control first** and a **threshold, not a named
college**; a committed test re-derives the tsquery from `index.ts` so the transcription
cannot drift.
⚠️ **THE IDENTITY LINT HAD EMPTIED ITSELF AND SHIPPED THAT WAY FOR FOUR MERGES** —
`--observed-json` is optional, #1283 ran without it, `findings` 13 → 0, and the tab said
**"Nothing outstanding"** while two live join defects sat unfixed. `cpl_memory` recorded
the hazard the same day and it still shipped: **recording a rule and enforcing it are two
events.** Builder now exits 1; artifact stamps `linted`; tab says "not checked".
⚠️ **MAP's three sandbox colleges are out of Sierra's corpus** — and `entity_kind` could
never have caught `Las PosTest College`, which has **no `map_colleges` row to join to**;
its stats were empty but its CONTACTS were a real coordinator at a college that does not
exist.
⚠️ **The lint fired on MY OWN edit twice** (`stacked_roadmap_cell`, `unindexed_kb_note`)
and **my own grep tripped on my own comment** quoting the retired assertion. Both fixed
pre-commit; the cell is now SMALLER than before this run.
✅ **DEPLOYED AND MEASURED THE SAME RUN — v57 ACTIVE.** 34 turns post-deploy: **1 write, 33 hits, 0 inert**, and **`read=3027` IDENTICAL on every request** while `uncached_input` ranged **10,843 → 22,762** — production proof the always/conditional split was load-bearing, since caching the whole rule block would have jittered that figure and billed a 1.25x write on most turns. ⚠️ **The log source is `function_logs`, NOT `function_edge_logs`** (the latter returns zero rows and looks like a dead feature). ⚠️ **A merge push fires its own smoke run that can RACE the deploy** — here it started 01:17:40 against a deploy that finished 01:18:17, so it tested the OLD function with the NEW script; dispatch your own after confirming the version bumped. ⭐ **The telemetry closed the Haiku capacity question for free**: peak ~23K against Haiku 4.5's 200K is a 9x margin, so only rule-adherence remains to be scored.
Durable: [`a-cache-breakpoint-must-lead-and-must-not-move`](docs/kb-notes/methodology-a-cache-breakpoint-must-lead-and-must-not-move.md) · story `docs/cpl_assistant_lessons.md` · `docs/college_identity_lessons.md` · handoff `docs/session_186_handoff.md`.

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
