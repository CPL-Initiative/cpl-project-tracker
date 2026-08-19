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
| **Partner crosswalks** | "Which of the occupations we train for can our students already get college credit for, and where?" — the reusable engine for workforce partners (training centers, workforce boards, AJCCs, COEs, apprenticeship sponsors). | ✅ **Engine LIVE** (SkyWalker, #995) — `kb/_build_partner_crosswalk.py` + the shared `kb/occupation_credential_map.json` (139 occupations / 406 rulings / 35 curated no-CPL findings) + region presets + 32-check test. SJCOE run 1: 51 statewide / 53 local-only / 35 no-CPL. ⚠️ **The engine's 2nd run is STILL outstanding** — the "coverage compounds" claim remains a design intention, undemonstrated. **Futuro Health / HTH (Session 144, #1134) is a second partner engagement but NOT a second engine run**, and the distinction is the reusable lesson: the engine reconciles a *partner's occupation vocabulary* against MAP's *credential* vocabulary (many-to-many, judgment-heavy). Ashley's HTH ask was **one known course × one known program type** across every college — no vocabulary to reconcile — so a separate, simpler generator (`kb/_build_futuro_hth_crosswalk.py`) was correct and forcing the engine would have been wrong. **Match the instrument to the question's shape, not to the word "crosswalk".** **Next:** still run a 2nd occupation list through the engine and work its `unmapped.json`. **Parked:** the COBI tab (Sam authorized; build the *regional-capacity* view, not the judgment-based occupation matching) and an **O\*NET SOC → certification spine**, which is what would let a match be defended rather than asserted. **Gap backlog:** the 35 no-CPL occupations, ~20 of them the utility/lineworker cluster. |
| **Governance & team enablement** | Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam. | ✅ **LIVE — team-gated ⚖️ Governance tab: 18 decision rights · 8 acceptance standards · 5 cadences · 8 open questions** (SkyMail #997/#998; Sierra added SkyMiner #1031/#1034/#1036; expanded 12→18 SkyGate). **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** The register **measures itself**: the contact-refresh cadence was decided in June and has never run (0 rows in `map_college_nudges`), and CA-06 shows Sierra feedback *21 of 25 untriaged*. Owners live in a separate gated `governance_owners` table overlaying by row id, so regenerating the JSON can never wipe an assignment; no delete policy (so `Clear owner` is a no-op on the 3 cadences carrying a register-file owner — the likeliest thing to be mistaken for a regression; 7 more reported defects unfixed). **DR-11** records what Sierra tells the public — honestly noting the decider has been Sam personally. **DR-13…DR-18** (SkyGate) cover the six surfaces nobody had recorded: **the workplan itself** (the most public artifact the project has, four tables editable in-page, no named owner), phrase rotation, contracts, CPL News, the Common CR Reference, TMC submissions. **Drift detector live + wired to the cron** (step 4a0): pure static analysis over 4 surfaces, **proposes, never auto-adds**; queue now **7**, all scheduled workflows nobody has listed as cadences — each needs a row or a reasoned dismissal. **Do not bulk-dismiss; the reason is the point.** ⚠️ A false stale flag was a **detector bug** (`\b` cannot match before a dot, so `.github/…` read as missing) — fixed with a negative lookbehind. `governance.test.js` **91/91**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human). **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. **Next:** ① fill the owner column, DR-13 first; ② run that cadence once end-to-end with a named owner; ③ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ④ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md`. |
| **Sierra retrieval + corpus** | Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP. | ✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live (**v42**). ✅ **CREDIT RECOMMENDATIONS PUBLISHED (SkyPeak, #1146–#1148):** `ccc_rec` is a **single string** and Sierra read it as the whole record — POST's real statewide set is **TEN**. Never missing, only unpublished: `statewide_data.js` `authoritative_recs`, already on the public **Fact Sheet**. `chatbox_credential_recs` — **2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357), on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none** — no single count is safe, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalised similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a licence to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ✅ **WIRED AND LIVE — cpl-chat v40 (SkyBridge, #1150).** `credential_recs_for_titles(titles)` batches the full set for whatever titles a route matched (one round-trip, and deliberately NOT a second matcher that could drift); `renderRecLines()` lists courses/C-IDs/units. The credential + volume route groups now run **concurrently**, which buys back more than the batched lookup costs. ⭐ **`ccc_rec` was a RETRIEVAL GATE, not just a lossy summary** — `search_statewide_recommendations` required `ccc_rec is not null`, and `ccc_rec` is derived from ADOPTIONS, so a statewide exhibit **nobody has adopted yet** had none and was excluded. **38 statewide credentials have zero adopters, `ccc_rec` null on all 38, 36 carrying 75 published rec lines** — the Carpenters ladder, NCCER, CSLB licences, ICC inspector, OSHA 10/30 — unreachable on *every* credential route. Gate now widened to `ccc_rec` OR a published statewide set. ✅ **COLLEGE·CRED NOW CARRIES THE COURSES (SkyRef, #1165, v46).** It listed credential NAMES and stopped — the only credential route never calling `fetchCredentialRecs`. Titles now join the **same** batch (one round trip; a second lookup is a second matcher that can drift) and render through the **shared** `renderRecLines`, so `local_modal` awards are never dressed as statewide. Lines are **enrichment**: the map is declared OUTSIDE the try, and a credential with no line is **still named** — dropping it re-creates the false zero. **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` is stale since 2026-06-25 **for everything except contacts** (those now read live — see the MAP Users row); 12 adoption-file statewide titles absent from `chatbox_credentials`. Sam triaged feedback **25 → 5** himself; 3 of the 5 are now fixed in code. **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. Story: `docs/sierra_credit_recs_lessons.md` · `docs/sierra_credential_naming_lessons.md` · `docs/cpl_assistant_lessons.md`. |
| **Sierra: false absences + the statewide flag** | Why Sierra says "none" when there is plenty, and why she disagreed with the Fact Sheet. | ✅ **CERRITOS IRONWORKER FALSE ZERO FIXED (SkyTop, #1162, cpl-chat v44)** — carried as diagnosed-not-fixed across three sessions; it was never one defect. Sam asked twice, the second time **four hours after v42**: *"I have a journey worker license as Iron and Steel worker. What CPL can I get here?"* → nothing, against **13** Cerritos ironworker credentials. ① the raw corpus abbreviates (`FIW Orientation`, `IW- Mixed Base`) and `search_exhibits_by_topic_v2('iron')` returns **0 STATEWIDE**, not just at Cerritos — and there was **no college-scoped curated route at all**, so for a named college the raw corpus was the only thing ever asked; ② `search_credentials_any` never searched **`issuer`/`trainer`** and, being whole-string `LIKE`, failed on the plural (`ironworkers`→0, `ironworker`→25); ③ the route reaching **local** credentials had the **narrowest probe budget** (3/3 vs 4/4) and dropped every content token past the third — on Sam's sentence **"iron" was never probed**. Shipped: **`search_college_credentials()`** (runs unconditionally when a college is known — the raw corpus returning rows ≠ the right rows), a shared `cx_credential_match_tier()` ladder with **new tier 5 issuer/trainer** + tier 6 `search_text` (both BELOW the title tiers; ranking still scores the **best single name**, never the concatenation), `cx_needles()` plural folding, and 4/4/8 probes. Now returns **all 13** — ten by title, **three reachable ONLY via issuer** (`FIW Orientation`, `Foreman Training`, `Post Tensioning 3`). ⭐ **Not a Cerritos problem: 1,795 of 1,987 credentials (90%) have an issuer carrying a word absent from title AND variants; 597 (30%) carry a curated word absent from every raw variant.** ⚠️ **A false zero is the worst answer Sierra gives** — it closes the conversation and nobody files feedback about a door they were told wasn't there; the section forbids reporting a zero it can see is wrong, discloses issuer-tier matches, and is appended OUTSIDE the enrichment try/catch so a downstream failure can't restore it. `methodology-search-the-awarding-body-not-just-the-name`. ✅ **STATEWIDE FLAG FIXED.** It synced from `credential_reference_data.js` (84 statewide) while the adoption file carries **137** — so **42 credentials read as LOCAL** (Paramedic License, CompTIA, OSHA 10/30, the NCCER + Carpenters ladders) and Sierra **contradicted the public Fact Sheet**. This is the recurring EMT/Paramedic report Sam has made across several sessions; he was right every time. The sync now UNIONs both files (**126, up from 84**) and the 42 live rows are corrected. ⚠️ `cpl_memory` **already said** *"use the adoption file"* (`statewide-is-138-not-84`) — the sync predated it and nobody rechecked: **a settled ruling does not enforce itself, the consumer has to change.** **Open:** 12 titles are statewide in the adoption file but **absent from `chatbox_credentials` entirely**. ⚠️ **THE IRONWORKER REPORTS WERE THREE COMPLAINTS, NOT ONE (SkyRef).** Handoff 150 read them as one issue; the newest (08-13 12:04, ~4h BEFORE v44) says something else: *"You should have provided a list of courses I could get credit for and the industry certificates or licenses needed"* — **found it, still didn't say what I'd get**. Fixed separately in v46 (row above). Reading them as one would have closed the ticket with the defect live. ⚠️ **Still open:** 12 titles are statewide in the adoption file but **absent from `chatbox_credentials` entirely**; and the M-ID leverage layer still omits Cerritos from welding adoption (a *different* question — `adoption_leverage` means "teaches the same course IDENTITY", not "has this CPL"). |
| **Local course ↔ CR alignment** | "Which of MY courses should I articulate against this credit recommendation, and how did other colleges do it?" — so faculty don't guess. | ✅ **LIVE — cpl-chat v43** (#1153/#1154/#1155/#1158/#1161). **Three surfaces:** `chatbox_peer_articulations` (9,413 rows · 1,516 credentials · 82 colleges — the FACT), `chatbox_college_courses` (141,696 · 120 colleges), and `credential_alignment_for_college()` returning both in one round trip, discriminated by `row_kind`. ⭐ **THE LADDER — C-ID, then title, then best-aligned (Sam's ruling).** Only the **best available rung renders** — a fallback, never a blend, because rung 1 says the equivalence is ESTABLISHED by a statewide standard and rung 3 says "closest thing you have"; blending lets a guess outrank a fact. 16,067 of 141,696 courses carry a C-ID across 112 colleges. ⭐ **TWO SIGNALS, NEITHER SUFFICIENT, NEVER MERGED** — Santa Ana mapped `WELD 240 Structural Welding SMAW` / `WELD 244 D1.1 Code Clinic` to **FCAW** recs and **neither title contains "FCAW"**, so title similarity can never propose them; peer precedent is the only signal that finds the broader-course pattern. Candidates print above the peer heading, labelled; **no score reaches the model**. ⚠️ **A C-ID match whose NAMES diverge is FLAGGED, never suppressed** (`cid_title_divergent`) — POST carries `AJ 110` on two lines, and suppressing it would auto-resolve the repeat Sam ruled must never be auto-resolved. ⚠️ **A plausible false positive costs more than a miss here** — the first cut ranked `ART 100 Introduction To World Art` third for an FCAW rec, so `cx_align_tokens()` drops structural words and the scorer requires **≥1 CONTENT token** (`advanced`/`beginning`/`basic` deliberately NOT stopped). ⚠️ **Bound BOTH sides of the union and resolve the grouping key** — `per_rec` once capped candidates only (3,807 peers vs 9 candidates) and peers were keyed on their own wording (43 groups where POST's set is TEN, ~34 of them phantom), which together buried five C-ID matches and rendered them as *"check catalog"*. **A phantom empty group is indistinguishable from a real one.** Now 10 groups / 94 rows / 6 of 6. **`peer_total` ships as a COLUMN** ("showing 9 of 261") — a capped list must never read as a census. ⚠️ **Do NOT re-add a "closest match anyway" fallback** — built and withdrawn; it proposed `AUTO 160 Introduction to Automotive Electrical` for a *policing* rec, and it is structural, not tunable: a rec with no candidate is one where nothing shares a subject word. Real empties point at the **peer courses**. ⚠️ Candidates come from the **whole catalogue** — scoping by TOP would gate on TOP (Rule 7). ⚠️ **`attribution`**: 8,809 `per_course`, 604 `group_wide` — name group-wide peers as a GROUP, never pair a college to a course. Recs come from the peer table UNION the published sets, so the **ready-to-adopt shelf aligns too**. **NEXT: Sam + team testing via Sierra Training; triage the feedback into instructions.** Story: `docs/local_course_alignment_lessons.md`; SQL of record: `kb/supabase_alignment_routes.sql`. |
| **Common CR Reference** | A canonical vocabulary of credit recommendations — what the CER did for freehand credential titles, for the freehand recommendation text. | ✅ **WORKLIST LIVE** (scoped SkyRunner #1174; built SkyCall #1176). ⭐ **SAM'S DESIGN RULING:** *"CID is only one factor… similar to the CCR, we take into account matching factors like title, course name and number, course description, subject, etc."* — illustrative, not exhaustive. C-ID-as-key fails BOTH ways: it over-merges (`AJ 110` on two genuinely different POST lines) and under-merges badly (only ~17% of the 2,344 strings carry a C-ID at all). ⭐ **AUTOMATION REACHES ~10%, SO THIS IS A CURATION WORKBENCH, NOT A MERGE ENGINE** — rung 1 published statewide 351 lines/134 credentials · rung 2 C-ID 36 of those · rung 3 CCR course identity 40 strings · rung 4 mechanical twin ~160 · rung 5 similarity **suggests, never merges**. **~90% is curator judgement no matcher reaches** (*Racial Issues and the Police* ≡ *Community Relations* — one POST topic, unrelated words), which is what the **+ Add a wording** picker is for. ⭐ **SCOPE IS GLOBAL + a split affordance (Sam, 2026-08-13):** 407 strings (17%) span >1 credential but carry **45% of all articulation rows**, and `Introduction to FCAW` is one recommendation under all ten AWS/ASME credentials carrying it. ⚠️ **RANK BY COLLAPSE VALUE (wordings × colleges), NEVER BY CREDENTIALS SPANNED** — the widest-spreading string is `3 hours in Elective Course Credits`: 61 credentials, **1 college**, a placeholder. Credentials-spanned would have ranked the corpus's least useful string #1; collapse value sinks it to #174 with no special case. Real head: `Intro to Administration of Justice` (5 wordings/26 colleges), then Principles & Procedures, then Criminal Investigation. **156 of 2,159 groups carry a decision; top 50 strings = 49.4% of all articulations — an afternoon, not an ocean.** ⚠️ **Units are NOT identity** (`SPAN 100` at 4/4.5/5) — a screen on rung 4 ONLY; rung 1/2/3 override it, so `Engine Performance` correctly merges 2/3-4/4/5 units and the spread is **always displayed**. ⚠️ **Grouping is by KEY, NEVER transitive** — 164 strings bridge ≥2 course identities, so components would chain `AJ 110`↔*Community Relations*↔`AJ 160`. ⚠️ **Two gates DON'T work: `attribution='per_course'`** (every poisoned `AJ 110` row carries it) **and a line-fraction/cartesian test** (`AJ 110` hits 8 of POST's 43 → reads non-cartesian → sails through). The gate that works is the credential's **COURSE count**. ⚠️ **A normalisation and the screens that judge it MUST see the same text** — `screen_profile()` ran on the raw topic while the key ran on the folded one, so `Intro`/`Introduction` read as different levels and the level screen **blocked the top of the queue**; then the test re-implemented the folds, missed `adv`, and failed two correct groups. Fixed by EMITTING the profile, not re-deriving it. Decisions live in gated Supabase `cr_reference_decisions` keyed on `group_key`, so a rebuild can never overwrite a judgement. **NEXT: Sam works the head — the top ~50 groups — and we watch which rungs he overrides.** Story: [`docs/common_cr_reference_lessons.md`](docs/common_cr_reference_lessons.md) · scope [`docs/common_cr_reference_scope.md`](docs/common_cr_reference_scope.md). |
| **Military (ACE) CR Reference** | The same canonical-vocabulary question for the 98% of MAP's CR rows that come from ACE-reviewed military training. | ✅ **SCOPED, NOT BUILT** (Sky153). Sam: *"the military ones may be the stickiest"* — right about the lane, wrong about the mechanism. ⭐ **ACE IS ALREADY A CONTROLLED VOCABULARY**: **93.4%** of (`exhibit_id`, units, topic) groups hold exactly ONE text; the 6.6% residue is **case and punctuation**, never wording. So automation reaches **3× further than the freehand lane — 33.5%** of the vocabulary resolves with zero judgment (ladder: 10,117 raw → 7,106 after typography+units → 6,749 after the rank strip → **6,725** real topics). ⭐ **THE STICKINESS IS VOLUME + NAMING.** 6,725 topics vs 2,183, and a much flatter head: **250 decisions for half the lane vs 50** (top 25 = 21.5%, top 250 = 52.5%). The CCN>C-ID>M-ID cascade fires on **2.6%** of ACE rows vs **94%** of MAP-local — the mechanical proof behind "subject areas, not courses" — but the cascade **already ends in *published line*, and ACE's own text IS that line**, so no new naming ruling is needed. The two lanes share only **134 of 7,106 topics (5.9% of ACE rows)**: the built CCRR does not cover this one. ⭐ **A RUNG UNIQUE TO THIS LANE** — USMC skill-level tokens leaked into the topic text (`ssgt gysgt supervision`): **482 topics / 12,157 rows / 181 exhibits / 94 colleges**, and stripping the rank lands **306 topics / 10,550 rows** on an existing base topic. This is `cpl_memory` row **`f8`** (Marine JSTs repeat CRs at every skill level) surfacing at the text grain. ⚠️ Strip list **needs widening before it ships** — 176 don't land (`leadership ssgt and above` → dangling qualifier; spelled-out `gunnery sergeant … only`). The rank is an attribute (who qualifies), never part of what the credit is FOR. ⚠️ **THE FREEHAND RANKING RULE DOES NOT TRANSFER** — every head topic already sits at ~80–100 of 108 colleges (top 200 average **78**), so collapse value multiplies by a near-constant and ranks nothing. **Rank by ROWS** (the backlog each topic represents). ⚠️ **Token containment is SUGGESTION-ONLY**: `management` contains 21 narrower topics — `project management`, `records management`, `supply chain management` — **none of which are `management`**; merges stay pairwise and gated, never transitive. ⭐ **POSTURE CHANGE, not just a build change: a third of this lane is an INGEST defect.** 58 colleges hold BOTH casings of the same string and **0** hold only one, so no human ever chose — the variance travels with the record, not the institution. A workbench here would ask curators to do a parser's job **767 times**. **FREE WIN READY:** the not-a-topic class is **47 strings / 6,663 rows** (`Credit Is Not Recommended` 32/3,892 + individualized-assessment 15/2,771) — bigger than the 3,242 §11 previously cited, which was one string not the class. **NEEDS SAM (4 questions, §10 of the scope):** ① are ACE **unit variants** one recommendation? (`AR-2201-0552` issues *Orienteering* at 1, 2 AND 3 hours — **22.2% of the vocabulary turns on this**, and the earlier units ruling came from a different situation); ② is the 767-string typographic class fixed **upstream** or absorbed downstream (`cpl_memory` `o3` already proposes it); ③ how far to merge subject-area granularity (`supervision` / `principles of supervision`); ④ is the not-a-topic class auto-N/A? Scope: [`docs/military_cr_reference_scope.md`](docs/military_cr_reference_scope.md); durable: [`methodology-tell-a-parser-defect-from-a-people-defect`](docs/kb-notes/methodology-tell-a-parser-defect-from-a-people-defect.md). |
| **Disposition grain / student detail** | What a college has ACTED on, not just what credit exists. | ✅ **TABLES LIVE + SIERRA WIRED.** `map_student_credit` **537,908 rows** (student grain, reviewer-only RLS, **no write policies**) · `map_college_cr_unit` 204,714 · published aggregates `map_college_goal2` + `map_college_credit_summary` (suppression at write time) · lookup `map_colleges` (128). 🎓 **Course Credit tab LIVE.** ⭐ **THE HEADLINE: 1,051,870 units at Needs Action across 106 colleges, 63,991 ALREADY ARTICULATED** — everything built, nobody acted. Lead with the second figure; the million is a ceiling (~30% of reviewed credit is correctly Not Applicable). ⭐ **BUCKET MILITARY vs NON-MILITARY BEFORE TOTALLING (Sam, 2026-08-13).** A JST lands a few to **scores** of ACE-reviewed CRs per service member; a non-military exhibit lands **1–2**. Same lifecycle, so an undifferentiated total is **98.8% military** — military **432,693 CRs / 1,040,447 units** (17.4/student) vs non-military **3,305 / 10,698** (3.8/student, 868 students, 28 colleges). "A million units awaiting action" describes a college's veteran population, not its workload, and **hides the tractable non-military backlog**. ⚠️ **Bucketing is NOT discounting** and **raw inert volume never means "behind"**. ⚠️ **No military flag exists** — `military_credits` is an applied AMOUNT, zero on 84% of rows. [`methodology-bucket-military-and-non-military-credit-recommendations`](docs/kb-notes/methodology-bucket-military-and-non-military-credit-recommendations.md). **Number policy (Sam):** show published AND unsuppressed with a chip — published 1,051,870/63,991, unsuppressed 1,052,531/64,074, **both scoped `entity_kind='college'` (106 entities)**; **never change one half alone**. ⚠️ **Show both ONLY while ≥3 cells are suppressed** — at one, the difference IS that college's figure (`adr-student-detail-aggregate-disclosure-control`). ⚠️ **The person key is `tblStudentKey`, NOT `TblSOURCE.Student`** (a grouping counter; Sam, twice); the MAP id must never reach Supabase. ⚠️ **The two "applied" measures disagree by 55%** — `applied_credits > 0` = 18,889 students vs `cpl_status_plan='Applied to CPL Plan'` = 29,292; **publish BOTH and name the gap** (Sam), worklist view `map_applied_zero_units`. Students served **42,346** · transcribed **13,412**. ⚠️ **Never rank on TRANSCRIBED** — colleges batch-upload already-transcribed credit, so it exists at only 24 of 111 colleges (`reference-batch-uploaded-transcribed-credit`). ⭐ **Apprenticeship CPL IS measurable** — `apprenticeship_credits`, 309 students / 12 colleges / 6,617.80 units. ⚠️ **Only 4.2% of student rows are nameable** (22,606 of 537,908) — per-credential counts are a FLOOR and the denominator ships as a COLUMN. ⚠️ **537k is fine to STORE, too slow to aggregate LIVE** (~6s vs Sierra's 1.7–5.0s budget) — read pre-computed rollups, never the grain. Runbook [`docs/map_student_credit_reload.md`](docs/map_student_credit_reload.md); story `docs/student_detail_load_lessons.md`. |
| **$50k / ESS 25-82 tab** | Turn the three bare outcome checkmarks into where-you-are / where-you-should-be / how-to-get-there, so colleges get unstuck and award real CPL in MAP. | 🔨 **GROUNDWORK DONE, REWORK NOT BUILT** (SkyPlan, #1007/#1012/#1014). ⭐ **The measure is the DISPOSITION RATE** — share of a college's credit recommendations carrying any disposition (Applied / **Not Applicable** / In Process). Median **4.7%**; MVC 3rd · Bakersfield 6th · Cabrillo 13th of 106 — the ONLY metric matching Sam's own read (three volume metrics ranked Cabrillo 24th–29th). Counting N/A as work done is load-bearing: Cabrillo is 844 N/A vs 320 Applied, so an applied-only metric scores it 9% not 34%. **Applied, not transcribed, is this phase's target** (Sam's correction — transcribing actualises when outcomes funding is live). Data: 436,720 rows at Needs Action (81%); **top 20 exhibits = ~40%** of the backlog; **11,495 rows are "Credit Is Not Recommended"** = a free auto-N/A win. **Build rules:** every step a FRACTION not a check (the Veteran Star taught colleges that uploading is the finish line — applied ≈ JSTs at ratio 1.00); reframe the Star as a starting line; **never rank colleges publicly**. **Next:** the rework itself, then wire Malone's view (expected 8/7) into `fetch_custom_report.py` + `_build_cr_backlog.py`. |
| **My College (college action page) / MAP-team queue** | One page (not 123) where a college picks itself and gets its stats, its opportunities against the goals, and concrete to-dos — plus the same engine pointed INWARD at the MAP team's own backlog. | ✅ **SCOPE-FIRST, AND THE FIGURES ARE BACK** (Sky167, #1232/#1233/#1234). ⭐ **EVERY COLLEGE READ BLANK FOR EVERYONE AND THE DATA WAS ALWAYS THERE** — `getSession()` read `localStorage.cpl_team_session`, a key occurring EXACTLY ONCE in the repo (as that read), so neither the reviewer session nor the phrase reached the server and **an RLS-filtered SELECT answers 200 + `[]`**. 109 of 120 non-test colleges had a summary row throughout. ⚠️ **The 232-check suite signed in via the BROKEN path and stubbed fetch.** Full story + the two KB notes: `docs/college_action_page_lessons.md`. ⭐ **The tab opens on a CHOICE, not a title**: scope question → curated list → "Welcome, X" → sections. Sierra is a **collapsible section, expanded by default**, closed by Collapse all like every other (Sam's ruling); her `<summary>` carries the SINGLE heading. ⚠️ **`askSierra()` must OPEN the section first** — a prefill into a closed `<details>` is the #1166 invisible-input bug, re-armed. ⚠️ **TWO OF FIVE SCOPES SHIP DISABLED WITH THEIR REASON** — SWP region and ASCCC region exist nowhere here, and **`college_geo.region` is a THIRD scheme** (a ~10-way proximity map for Sierra; SWP has **8** consortia, ASCCC **4** areas). A test pins that it stays unwired. Sam: the real groupings are on the MAP Dashboard, not yet in an export. ⭐ **A ROLL-UP MUST NOT LEAK A WITHHELD COLLEGE** — district/statewide sum **unsuppressed rows only**, or `total − visible` hands back the k=10 figure; withheld are COUNTED, and ABSENT stays distinct from withheld. ⭐ **The briefing is a docx built by READING THE RENDERED DOM** (Sam: *"Briefing should be docx"*), so it cannot drift from the screen and inherits the suppression by construction; the caveat travels IN the file. ⚠️ Its first cut walked `details.cb-sec` only and was **empty for district + statewide**. ⚠️ **`finish()` hoisted the FIRST `.cb-bar` in document order** — after the pickers moved it would have torn a progress bar out of the waiting table; now `.cb-bar-pick`. **Still current:** `buildQueue(sources, now)` is **pure — do not fork the ranking rules**; **measure at load, never carry a list** (a failed read is `unknown`, never 0); ⚠️ **NEVER re-derive an allocation — call `_alloc()`** (floor waterfall; Mt. SAC = **$522,239**) and **`_prios(name, slot)`** with an explicit slot or a Year-2 view renders $0; ⭐ **join BOTH sides through `cplCollegeShort()`**; the lead figure is **ONE decision, not 300** — 98.8% of the 64,074 waiting units is Credit for Basic Military Service (backlog **592 rows**, **33 of 106 have NONE**); ⚠️ an **ABSENT measurement must never render as an ACHIEVEMENT**; ⚠️ `map_college_cr_unit` has **no k-anonymity of its own**; ⚠️ `safePct()` — never round UP into a claim; ⚠️ `map_credential_student_rollup` is a **MATVIEW** (no RLS, `anon` holds the grant); ⚠️ **`prefill()` must stay send-free**. **HELD BY SAM:** MAP deep links, the `?college=` RLS decision, the MIS side-by-side (parked — our extract is stale pending the MAP reload; our aggregation is faithful). **NEXT:** Sam looks at the redesign in a browser; the region lists when he finds them; the briefing filename convention vs `college_report_generator.js`. Durable: [`methodology-an-rls-filtered-read-is-not-an-error`](docs/kb-notes/methodology-an-rls-filtered-read-is-not-an-error.md) · [`methodology-a-report-must-read-the-screen-not-recompute-it`](docs/kb-notes/methodology-a-report-must-read-the-screen-not-recompute-it.md). |
| **College & district identity** | One taxonomy: every college/district name variant resolving to MAP's authoritative `college_id` and the CCCCO MIS district code. | ✅ **CROSSWALK BUILT — dry run merged, NOT yet written to Supabase** (SkyLink, #1131–#1133). **116 colleges · 116 with a district code · 73 districts · 0 unresolved · 262 name variants, none empty.** Sam: *"I continue to see a disconnect… Mt San Antonio vs Mt. San Antonio."* THREE systems named these colleges and none knew the others: `map_colleges` (authoritative `college_id`; its **`variants` column existed and was EMPTY on all 128 rows**), `kb/college_short_names.json` (no id at all), and CCCCO MIS **Appendix A** (`kb/reference/mis_district_college_codes.json` — the PDF Sam supplied 2026-08-08, in the repo since Session 128 and never joined to anything). **24 of 116 were spelled differently**; **no Supabase column matched `%district%`** at all, so the 72-district picker ran off a JS file with no DB backing; **16 tables key on a name string** (`coci_college_programs` is 22,335 rows). ⭐ **VALIDATE A SUPPLIED CODE COLUMN BY ITS STRUCTURAL INVARIANT** — a 2025 roster's `LocationID` looked perfect (plausible 3-digit codes, first row matched exactly) but **3 of 106 agreed**: real MIS codes on the wrong rows. Caught because MIS codes are **district-prefixed** (Appendix A: 25 of 26 multi-college districts; the roster: 3 of 23, LA CCD scattered across 121/234/312/422/471/571/721/748/862). Spot-checking cannot detect a shifted column. Its `DistrictType` also contradicts itself (37 rows vs its own counts; 14 districts carry BOTH values) so **M/S is DERIVED** from the college count. **The file was still kept** — its `MAPCollege` column is a CCCCO bridge that took the hand-curated table **30 → 0**. ⚠️ **Two Appendix A parse defects repaired** (`970/971` COPPER MOUNTAIN doubled + filed under CONTRA COSTA; `470/471` EVERYGREEN) — `verify_source()` re-derives both so an upstream fix makes the patch a no-op. `EVERYGREEN` is in BOTH CCCCO files, so it is **upstream, not our parse**. ⚠️ **Futuro Health is `college_id` 133, `entity_kind='partner'`** (Launch 132) — the crosswalk excludes partners, and `cplCollegeShort()` returns its input on a miss, so **key partners on `college_id`, never the name**. ⭐ **North Orange Continuing Education + San Diego College of Continuing Education have their own CEO** but no `map_colleges` college row — the standalone NC institutions the Learning-Partners workstream found at ZERO. **NEXT: write `variants` + district columns to Supabase** (the write that actually ends the Mt. SAC problem); open questions = own `districts` table vs columns, and whether those two NC institutions become `entity_kind='college'`. Story: `docs/college_identity_lessons.md`; durable: `methodology-validate-a-code-column-by-its-structural-invariant`. |
| **Admin tab / the side menu as data** | One place to manage the COBI side menu — order, grouping, naming, which sites show what, who sees it — beside what actually protects each tab. | ✅ **LIVE AND IN USE** (SkyGate #1193/#1195/#1196; SkyKey #1203; Sky159 #1209/#1210; Sky160 #1212/#1213/#1214). ⭐ **SAM HAS DRAGGED AND SAVED — `cobi_nav` holds 43 rows** stamped `slee@cccco.edu`, 2026-08-15 13:59 UTC (his renames *Metrics and Plans* / *MAP Team Tools*, a `settings` category, CPL Assistant hidden, audience rungs set). The three-handoff "unproven in a real browser" item was **closed by reading the table**, not by asking — the answer had been sitting there for hours. ⭐ **THE OVERLAY NEVER GATES THE MENU**: the page builds from code and paints, then applies the overlay if it arrives. Offline · HTTP error · malformed rows · a throwing `plan()` · a corrupt cache each land on the shipped menu, each tested. ⚠️ **LOCKOUT IS PREVENTED IN CODE, NOT THE TABLE.** **THREE lists, each on its own axis** — `PROTECTED` (never hidden) = admin+dashboard · `AUDIENCE_LOCKED` (never narrowed) = dashboard · `GROUP_LOCKED` (never grouped) = **dashboard alone**. Admin MAY now live in a category (Sam's Settings): `plan()` already LIFTS a protected tab out of a hidden group, so the drag ban was a second belt over a sealed door. The axis is always *what could the viewer not undo*. ⚠️ **DISPLAY IS NOT SECURITY** — menu columns and the live RLS gate (`cobi_rls_gates()`) share ONE table. **73 tables + 6 views: 29 public-read · 24 team-phrase · 10 server-only · 5 reviewer-only · 4 Finance · 1 GR · 0 with RLS off**; five tabs render **unknown with the reason**, never a clean bill. ⭐ **SHARE IS A REAL GROUP (#1213)** — it was synthesised from anchors with no `data-tab`, so **two menu items were invisible to the manager while the page looked complete**. Launchers carry `data-nav-link`, stored `kind='tab'` (no migration). ⚠️ Widening the set made three rules lie: the site filter (a link key isn't in any site's TAB list → would hide both), `sitesFor()` (would describe the menu differently from how it behaves), and `rowGate()` (**"Not checked" would have RISEN by two the day Share became visible** — a count going up because you started SHOWING something is a false finding). New `link` gate. [`methodology-a-manager-must-show-everything-it-manages`](docs/kb-notes/methodology-a-manager-must-show-everything-it-manages.md). ⭐ **PLAIN WORDS, NO GLYPHS (#1212)** — every control is a word (Rename · Hide · Remove · Seen by: … · All sites). ⚠️ **The no-cheesy-glyphs rule was recorded in `cpl_memory` 2026-08-14 and the tab shipped covered in emoji that same week** — recording a rule and applying it are two events. ⚠️ **A FULL-REWRITE SAVE MUST ROUND-TRIP WHAT IT DID NOT TOUCH**, and **a bulk POST is ONE INSERT over the UNION of the array's keys** (why `cobi_nav` held zero rows for two days). **NEXT:** ① Sam drags Admin into Settings and saves — enabled, his call; ② **the Finance phrase scope** (below); ③ **org roster as data** — `cobi_orgs.js` ORGS becomes a table, which is what makes "what is in Finance" ONE list and what a per-site Admin filter would read. Story: `docs/admin_tab_lessons.md`; ADR [`adr-the-side-menu-as-an-overlay-over-code-defaults`](docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults.md). |
| **Noncredit CIP categories** | Which of the CO's ten noncredit CIP categories a program belongs to — and what that means for CDCP eligibility and funding. | 🔨 **SCOPED + PARTLY BUILT; a blanket rule shipped and was reverted** (SkyCode, #1191 · #1192→**#1194** · #1198 · #1199). Read [`docs/noncredit_cip_category_scope.md`](docs/noncredit_cip_category_scope.md) before touching this — it is the authority and the numbers live there. ⚠️ **#1192 shipped "all noncredit programs → `32.0111`" and was live ~20 minutes.** Jenni clarified: **Short-Term Vocational ONLY** — ESL, Job Prep and some Basic Skills are CDCP-eligible on *other* codes, the rest of noncredit is leisure. The blanket rule was wrong for the **majority** of 3,187 programs. ⭐ **THE TOP IS NOT LOAD-BEARING.** Short-Term Vocational is `32.0111` **plus a secondary credit CIP** aligning with the subject, so the **1,796** programs on a "wrong" credit CIP are not errors — that code IS the secondary — and **1,789 of 1,796 (99.6%)** already sit inside their own TOP's crosswalk. A TOP-correction project was unnecessary. ⚠️ **TOP cannot decide the category even when correct**: only **28.8%** of programs are claimed by one category (Short-Term Vocational and Workforce Preparation are both "any vocational code" → **1,928 undecidable**); it blocks compliance for **17 programs / 13 colleges**; peer consensus repairs **38 of 3,187**. **Ladder:** 997 read to one category from their noncredit CIP · 76 off-list · 1,796 hold the secondary · 247 no CIP · 71 retired. Secondary CIP categories: CTE 1,327 · Both 177 · Non-CTE 292. ⚠️ **CTE IS FUNDING-BEARING** (CTE noncredit qualifies, non-CTE does not) → **category confirmed BEFORE CTE concluded**; the *"noncredit TOP must start with 49"* flag is **deliberately unshipped** (1,970 would flag, **1,601 of them `GOAL = CTE`**, and moving them off an asterisked TOP can strip the marker). ⚠️ **A relayed code table had its Basic Skills labels shifted by one, silently** — caught only by checking **all seven pairs** against the CO's certified catalog; the validator now runs on every rebuild. **Guards that survived the revert:** computed **never stored**; a proposal says `proposed · COCI has X`, never *"changed from"* (which claims a human decision); a proposed code must appear in the row's own option list. **BLOCKED ON JENNI:** the Basic Skills pairing (alone unblocks build phases 1–3) · `32.0199` (60) and `35.0101` (16) in use but off her list · is the 2026-07-15 crosswalk cut the locked one · is the secondary CIP becoming a COCI field · **can non-CDCP categories be CTE at all** (~1,300). **BLOCKED ON SAM:** where a confirmed category persists — `localStorage` is wrong for a funding-relevant determination; recommend a gated Supabase table with who/when, as with `cr_reference_decisions`. Story: [`docs/cip_crosswalk_lessons.md`](docs/cip_crosswalk_lessons.md); durable [`methodology-the-record-may-already-hold-a-better-signal…`](docs/kb-notes/methodology-the-record-may-already-hold-a-better-signal-than-the-field-you-are-repairing.md). |
| **Reviewer session lifetime & scope** | What "signed in" means, how long it lasts, and which browser tab has it. | ✅ **KEEPER LIVE (SkyKey, #1205); CROSS-TAB OPEN (#1207).** ⭐ **ONE DEAD TOKEN EXPLAINED THREE REPORTS IN ONE EVENING** — Admin *"save 400"*, Sierra *"says I'm not signed in"*, CR Reference *"could not read"*, all "fixed" by re-signing in, which is what hid the cause. A Supabase access token lives **~1h** and **13 of 26 modules check only the token's SHAPE**; all three of those tabs are in that half. `raci.js` has said so in a comment since June — **a lesson in one file is not a lesson in the repo**. Fixed with a **KEEPER, not a 14th copy** (`cpl_session.js` renews `cpl_sb` underneath every reader, so the 13 benefit **untouched**). ⚠️ **SHIPPING IT ALONE WOULD HAVE BEEN WORSE THAN THE BUG** — refresh tokens ROTATE, six modules renew from a **cached** session, and three of those **drop the session on any failure** = silent sign-out mid-edit; all six now re-read, with a static guard. ⚠️ **Only a definitive 400/401 may end a session** (raci dropped on ANY rejection, so offline cost you your work), and **reading must not delete**. ⭐ **`sessionStorage` IS PER BROWSER TAB** — Sam diagnosed it: the magic link opens a NEW tab, the one you were working in stays signed out, and `cpl_sb_return_tab` is powerless. #1207 makes `localStorage` canonical + mirrors it per tab; **a per-tab MARK distinguishes "fresh tab" from "signed out"**, else the sign-out button does nothing. Cap **12h** (`MAX_SHARED_AGE_MS`). **NEXT: one real-browser round trip proves the lot** — sign in → the OTHER open tab signs in → drag+Save on Admin → sign out → both stay out. Story + Sam's rulings: [`docs/session_credentials_lessons.md`](docs/session_credentials_lessons.md); durable [`methodology-a-rotating-credential-cannot-be-cached`](docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached.md). |
| **Org & phrase scope** | Which sites exist, which phrase opens which of them, and where a curator manages that. | 🔨 **MEASURED, NOT BUILT — needs Sam's go before touching live RLS** (Sky160). Sam, 2026-08-15: *"Finance should not open the entire workplan… Seems like we should have an Admin view for each org."* ⚠️ **He is right: the Finance phrase opens Contracts (8 policies / 4 tables) PLUS ~30 more tables and 83 policies**, because `team_pass_check()` is one line matching ANY secret in `team_access`. ⭐ **THREE lists describe "orgs" and none is authoritative** — `cobi_orgs.js` ORGS (5 sites), `team_access` (4 rows), `team_phrases.js` PHRASES (4 descriptions) — and they already disagree: **CIP is a site with no phrase; CPL's phrase had no site of its own.** ⚠️ **A NAIVE "scope each phrase to its own site" LOCKS FINANCE OUT of Budget + Implementation Funding**, which it genuinely needs — those are shared tables and Sam's June ruling stands (*shared tabs accept either phrase*). **The defect is only the third case**: the Finance key opening tabs Finance has nothing to do with. Correct shape = exclusive tab → its own phrase · shared tab → either · CPL-only tab → shared phrase, NOT a site phrase. ⭐ **PER-ORG ADMIN: a site FILTER yes, per-org AUTHORITY no** — Admin is reviewer-only precisely because a phrase holder who can re-scope what other phrase holders see is the superset problem one level up; most tabs are shared, so two org Admins would fight over one menu. Delegation is a **roles** decision → the Governance register, not the menu editor. ✅ **`raci` → `team` DONE (#1214)** — the shared phrase was named after a tab Sam renamed; secret untouched (md5 identical), nobody locked out, and made **order-proof** first via a `legacy` alias because a live rename and a deploy cannot be simultaneous: a blank card invites a save that creates a SECOND valid phrase. [`methodology-a-live-rename-must-be-order-proof`](docs/kb-notes/methodology-a-live-rename-must-be-order-proof.md). ⭐ **MEASURED, AND IT SPLITS IN TWO (Sky168).** The gate is one line — `team_pass_check()` = `select exists (select 1 from team_access where secret = p)`, no cohort filter — reaching **83 policies across 42 tables**. Crossing those 42 against what each site's own tabs actually touch (`cobi_admin_surface.js` × `cobi_orgs.js`): **GR needs 0 of the 42**, Finance needs **6**. So GR is not the ~30-table job at all — every table the GR tab reads is a `gr_*` table already on the cohort-specific `gr_pass_ok()`, and its reach into the other 42 buys it nothing while costing it the entire workplan. **The GR fix is ONE PREDICATE** (`where id <> 'gr' and secret = p`), leaving `team`/`ci`/`fin` untouched — no Finance lockout, which is the failure a naive per-site fix causes. Finance stays hard (it genuinely shares 6) and stays parked; it is NOT on the General Counsel critical path. ⚠️ **A blast radius is a property of the problem you are solving, not of the problem** — these two were filed as one for four days. **BLOCKED ON SAM — one question:** who holds the GR phrase, and do they each also hold the shared `team` phrase? If yes, the change costs nobody anything. Full measurement + the sequence: [`docs/phrase_scope_analysis.md`](docs/phrase_scope_analysis.md). |
| **EACR — Exhibit & CR Adoption** | One place to see every exhibit, its credit recommendations, and the colleges that could adopt it. | ✅ **FILTER REWORK LIVE** (Sky162, #1221–#1223) — **three college scopes**, `adopted` (default) · `likely` (the prescriptive M-ID layer, which **names the local course**) · `any` (*a lead, not a match* — TOP-derived, so Rule 7 forbids it as a primary determination). **Sam has used it and confirmed the arrangement** (2026-08-17), closing that carried question. ⚠️ **FILTER, COLUMN AND EXPORTS MUST SHARE ONE SCOPE** — the exports are the layer that reaches a college by email. ✅ **MATRIX SUB-TAB LIVE — generator #1226 (Sky163), view #1229 (Sky165).** CER titles down the side, colleges across the top, CR units in the cells: **green = adopted, brown = still available (in parentheses, so the distinction survives greyscale)**. Renders the approved design exactly against the live payload: **434 × 118, 17.0% inked**, 1.6s and only on tab selection. ⚠️ **Row grain is the unified TITLE, NOT `credentialKey()`** (which gives 431 — it splits titles carrying two *named* issuers); **the peer benchmark is recomputed per ROW**, since `peer_units_median` is per CARD and a row may fold several. ⭐ **ONE COLLEGE WAS TWO COLUMNS — a fold at the LABEL layer is not a fold.** `CaÃ±ada College` is `Cañada College` read as latin-1, and `excel_to_dashboard.py` emits BOTH (correct → `potential_names`, mangled → `statewide_prescriptive.js`, 26 pairs). The axis was **119** — invisible because every consumer counted these names *through* `cplCollegeShort()`, whose `normalize()` folds `Ã±`→`n`, so the label count was right for the wrong reason. It would have rendered two Cañada columns, one holding all 26 opportunities and the other **empty — indistinguishable by eye from a college with no data**. Folded in the roster rules as a SUM; **the upstream encoding defect is still unfixed at source**. ⚠️ **The fold also moves a count Sam sees** — four adopter spellings, one sandbox and two one institution, is **two** adopters. [`methodology-a-fold-at-the-label-layer-is-not-a-fold`](docs/kb-notes/methodology-a-fold-at-the-label-layer-is-not-a-fold.md). ⭐ **SAM'S FOUR RULINGS, LOCKED:** brown is the **peer benchmark** · open on **colleges** (not regions) · default rows **≥2 adopters** · brown on **credible cells only** (the *likely* tier, not every non-adopter). Default view = **434 rows × 118 cols, 17.0% inked** (12.3% green / 4.7% brown; 59% of rows carry an opportunity). ⚠️ **BROWN CANNOT BE THE LINE TOTAL** — 83% of adoptions are PARTIAL (median **3.07 of 9.26** lines) and **no college has ever reached the total**; it would promise ~3× the strongest peer, in a column that leaves as a CSV. ⚠️ **118 numeric columns cannot fit** (~3,500px, ~2× a desktop) — the frozen title column + rotated short-caps headers + h-scroll are load-bearing, not a preference. ⚠️ **`chatbox_peer_articulations` IS THE WRONG UNITS SOURCE** (32.5% coverage — a join of two half-sources); the raw `View_ArticulatedMAPExhibits` row carries college+course+rec TOGETHER, so `adopter_units` is a straight read at 100%. NOT `map_college_cr_unit` (reviewer-gated, no k-anonymity, measures student disposition). ⚠️ **Roster rules (`kb/reference/map_college_roster_rules.json`) are the ONE place identity folds belong** — sandbox `entity_kind='test'` dropped, duplicate spellings folded as a **SUM** (never a pick: today's zero-adoption twin stops being zero without announcing it). Axis = **118 = 115 credit** (Sam's number exactly) **+ 3 noncredit**; the 4th, **Mt. SAC Noncredit, has no identity in `map_colleges` or the export** (Learning Partners item 1). ✅ **CSV EXPORT + PARTIAL-ADOPTER GAP LIVE (#1230)** — harvested from **Session 164's lost patch, which Sam supplied after #1229 merged and which was BETTER than what had shipped**. ⭐ **`matrixCell()` is ONE function called by both the grid and the CSV**, so the spreadsheet cannot drift from the screen — Sky162's "filter, column and exports share one scope" made **structural** rather than remembered. ⭐ **A partial adopter now shows BOTH** what it has and the gap to its peers (**337 cells**; Sam approved 2026-08-17): a non-adopter needs the M-ID gate, an adopter needs none because it is **already in the peer cohort**. Also: row thresholds 1/2/5/10, a Both/Adopted-only/Opportunity-only filter, an exhibit drill-down, published density, and **column narrowing under college-shaped filters only** (a content filter must never drop a column — that reads as "this college has nothing"). ⚠️ **A CORRECTION AGAINST SKY165:** it measured 349 partial adopters and said Sky164's 337 needed restating; against the shipped rule (gaps under 0.5 units ignored) it is **337 exactly** — **Sky164 was right**. *Re-measuring a predecessor's number is right, but a disagreement is not automatically theirs — first ask whether the two are the same measure.* ⚠️ Session 164's identity approach (key through `cplCollegeShort` alone) was NOT taken; the roster fold runs FIRST inside `mxName()`, both layers plus the collision check. ⚠️ The Cañada column now displays as **`Canada College`** (no tilde) — that is the `canonical` field in the curator-provided `college_short_names.js`. **NEXT: Sam looks at the grid in a browser** — density is his call. Then the tilde, then fix the mojibake at source in `_build_statewide_prescriptive()`. **Curation carryover:** 4 unclassified-only titles the CER knows · 2 statewide cards matching no college · sweep `{0,N}` test bounds · the 50-group credential-view cap. Story: [`docs/eacr_scope_lessons.md`](docs/eacr_scope_lessons.md). |
| **GR register / CO policy & regulation review** | Every CO priority area's regulatory / Ed. Code revisions under consideration, with the artifacts informing them — pointed at the whole CO, not just CPL. | ✅ **BUILT, AUDITED, PHRASE-SCOPED** (Sky168, #1237/#1240). `gr_areas → gr_revisions → gr_artifacts`; was ONE jsonb blob, one topic, `writes: []`. 2 areas · 20 revisions · `dual-enrollment` is a marked **SAMPLE** (neutral prompts, never positions). `gr_content` retained as rollback. Tests **125**. ⭐ **CITATIONS ARE DATA** — a section dropdown cannot exist while §55050 lives in a sentence; *filter/facet/group-by* all mean **make the attribute addressable**, a schema change. ⚠️ **The JS bands MUST mirror `gr_citation_code()` in the SQL character-for-character** — they diverged, and **Gov. Code §53xxx is real**, so a bare `53410` is ambiguous against T5 §53410; assign by explicit range, REFUSE the rest, and store an inferred code as `citations_derived`. ⚠️ **THE CAVEAT MUST RENDER AND MUST TRAVEL IN THE EXPORT** — CPL's quoted statutory text is unverified; `draftWord()` writes a file that escapes the gate, the RLS and the room. Verification pass reports **N of M** (CPL is 0 of 16). ⚠️ **null ≠ empty** — a failed read must never render as a zero, and must not let `nextN` number a new row `1`. 🔒 Writes reviewer-only; `sensitivity` defaults **restricted** (nothing open); `gr_open_sections` needs **`security_invoker = on`** or a view bypasses the RLS it exists to enforce; `gr_history` has **no write policy**. ✅ Phrase scope: `team_pass_check()` excludes `gr` — one bit changed, `team`/`ci`/`fin` untouched, rollback one statement. ⚠️ **Residual: a GR-ONLY phrase holder lost the shared tabs** and needs the `team` phrase. Finance's own over-reach (36 of 42) stays parked. **NEXT:** ① Sam demos (open on the sample, close on the cross-area section index); ② flip rows to `sensitivity='open'` — his call, nothing open today; ③ editing (add-only); ④ the CO priority-area list. Story: [`docs/gr_register_lessons.md`](docs/gr_register_lessons.md) · [`docs/phrase_scope_analysis.md`](docs/phrase_scope_analysis.md); durable [`migrate-the-display-not-just-the-data`](docs/kb-notes/methodology-migrate-the-display-not-just-the-data.md) · [`a-filter-needs-a-field`](docs/kb-notes/methodology-a-filter-needs-a-field.md). |
| 2 | Articulations by Unified Course — interactive view + curation | parked |
| 4 | SLO ingestion + the rest of the MC slot fields | parked (unlocks MC-readiness scoring) |
| 5 | CTE classifier (TOP code → COCI CTE field) | parked (unlocks CIDx lane) |
| 6 | CIDx submission automation (the eventual goal) | parked (the destination) |
| 7 | M-ID → CID substitution workflow on approval | parked (governed by Rule 7 once re-locked at faculty publication) |

The auditor is the foundational instrument for the whole pipeline: every phase
upstream of CIDx submission produces a higher trust score and graduates rows
from one readiness tier to the next.

### Sky167 — the tab was fine, the key was a ghost (2026-08-17, Session 167)

**Three merges — #1232, #1233, #1234.** Sam: *"all the colleges are coming up blank on this."*
⭐ **`getSession()` read a storage key nothing has ever written** (`cpl_team_session`, one occurrence in the
repo — the read itself), so neither the reviewer session nor the team phrase reached the server, and **an
RLS-filtered SELECT answers 200 + `[]`** — every gated figure read as "this college has nothing", on every
college, while the public reads beside them kept the tab looking healthy. The data was never missing.
⚠️ **The 232-check suite signed in via the broken path and stubbed fetch** — it exercised the defect every run.
Assert HEADERS when no rendered state can tell the bug from the truth.
Then Sam's seven asks: the tab now opens on a **scope question**, Sierra is a **collapsible section expanded by
default**, and the briefing is a **docx that READS THE RENDERED DOM** so it cannot drift from the screen.
⚠️ **Two of five scopes ship disabled with their reason** — and the region data we hold is a *third* scheme
(`college_geo` is a proximity map; SWP has 8 consortia, ASCCC has 4 areas), so a test pins that it stays unwired.
Story: `docs/college_action_page_lessons.md` · `docs/sierra_surface_alignment_lessons.md` · handoff
`docs/session_168_handoff.md`.

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
