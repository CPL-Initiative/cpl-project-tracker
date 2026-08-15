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
| **Sierra student routing** | How Sierra points a CPL seeker between their college's landing page and the systemwide student portal. ⚠️ **DEPLOYMENT (Sam, 2026-08-08 and again 2026-08-10): the widget is on COBI ONLY — it is NOT embedded on college landing sites yet.** The anti-poaching rules below are written for the day it is, and still bind because `cpl-chat` ships `--no-verify-jwt` and is publicly callable. Do not restate this as "sits on colleges' own pages"; that phrasing is what made the correction necessary twice. | ✅ **LIVE — v31→v33** (SkyHero, #1025 · #1026 · #1027). Four passes, each one Sam correcting the last. The portal is **Credit for Being You** (`/main/student`, one `PORTAL_STUDENT_URL` const — declared above first use, since these rules are template literals and a TDZ ReferenceError kills the function at boot). It was framed as an **either/or** ("if *instead* the student is already enrolled…") and, in `LANDING_PAGE_RULE`, as a **fallback for a missing landing page**. Now **YES/AND** — and that was a substance fix, not a label: my first rewrite split them by FUNCTION (compare at the portal, act at the landing page), which is wrong, because a seeker can see opportunities AND request review at BOTH. The portal ADDS the any-CCC view **and a much more comprehensive portfolio development process**. Then the counterweight: Sierra is INTENDED for colleges' pages (COBI-only today, 2026-08-10), so an unprompted "you'd get more credit at X" would be **poaching**; it now starts with the named college and affirms it, and compares freely only when the visitor ASKS or has no college. ✅ **TENSION RESOLVED AND LIVE (SkyMiner, #1029, deploy 11).** Sam took the recommended line: **the restraint binds salesmanship, not facts.** Never withhold a fact that materially changes a seeker's outcome; never editorialise. If the host hasn't articulated it — say so, say where it IS available today, say the host can adopt it; *never stop at a polite dead end*. When the two interests can't be reconciled, **the visitor's outcome wins — stated plainly, never sold.** Same refusal-of-the-dead-end added to the student audience rule. `tests/sierra_student_portal.test.js` **44 → 59**, and the 15 new checks are deliberately the **PERMISSION** half: a violated prohibition is loud (a college complains), a violated permission is silent (the person just isn't helped and files nothing) — only one of them rots unnoticed. ✅ **EDGE CASES CLOSED AND LIVE — v35 (SkyMiner, #1035, deploy 12).** **Distance is a fact, not a filter**: name the nearest college that TEACHES it however far away, state the distance plainly from the county/region already in context, and let the visitor judge — suppressing a distant option leaves someone who would travel (or study online) with nothing. **The true dead end** (nobody articulated it, nobody nearby teaches it): say so plainly rather than padding, then Credit for Being You **and** an invitation to email MAP so the gap is on record, framed as genuinely useful because an unmet request is how the system learns a credential is in demand. And the guard that matters most — **never invent a college, a course or an articulation to avoid an empty answer**; a fabricated route sends someone to a counter where nobody expects them. `tests/sierra_student_portal.test.js` **59 → 67**. ⚠️ **Still carryover:** SkyHero's five-surface poaching audit was never reported, and `creditforbeingyou.org/main/student` remains unverified (sandbox is egress-blocked from that domain). |
| **Disposition grain / student detail** | What a college has ACTED on, not just what credit exists. | ✅ **TABLES LIVE + SIERRA WIRED.** `map_student_credit` **537,908 rows** (student grain, reviewer-only RLS, **no write policies**) · `map_college_cr_unit` 204,714 · published aggregates `map_college_goal2` + `map_college_credit_summary` (suppression at write time) · lookup `map_colleges` (128). 🎓 **Course Credit tab LIVE.** ⭐ **THE HEADLINE: 1,051,870 units at Needs Action across 106 colleges, 63,991 ALREADY ARTICULATED** — everything built, nobody acted. Lead with the second figure; the million is a ceiling (~30% of reviewed credit is correctly Not Applicable). ⭐ **BUCKET MILITARY vs NON-MILITARY BEFORE TOTALLING (Sam, 2026-08-13).** A JST lands a few to **scores** of ACE-reviewed CRs per service member; a non-military exhibit lands **1–2**. Same lifecycle, so an undifferentiated total is **98.8% military** — military **432,693 CRs / 1,040,447 units** (17.4/student) vs non-military **3,305 / 10,698** (3.8/student, 868 students, 28 colleges). "A million units awaiting action" describes a college's veteran population, not its workload, and **hides the tractable non-military backlog**. ⚠️ **Bucketing is NOT discounting** and **raw inert volume never means "behind"**. ⚠️ **No military flag exists** — `military_credits` is an applied AMOUNT, zero on 84% of rows. [`methodology-bucket-military-and-non-military-credit-recommendations`](docs/kb-notes/methodology-bucket-military-and-non-military-credit-recommendations.md). **Number policy (Sam):** show published AND unsuppressed with a chip — published 1,051,870/63,991, unsuppressed 1,052,531/64,074, **both scoped `entity_kind='college'` (106 entities)**; **never change one half alone**. ⚠️ **Show both ONLY while ≥3 cells are suppressed** — at one, the difference IS that college's figure (`adr-student-detail-aggregate-disclosure-control`). ⚠️ **The person key is `tblStudentKey`, NOT `TblSOURCE.Student`** (a grouping counter; Sam, twice); the MAP id must never reach Supabase. ⚠️ **The two "applied" measures disagree by 55%** — `applied_credits > 0` = 18,889 students vs `cpl_status_plan='Applied to CPL Plan'` = 29,292; **publish BOTH and name the gap** (Sam), worklist view `map_applied_zero_units`. Students served **42,346** · transcribed **13,412**. ⚠️ **Never rank on TRANSCRIBED** — colleges batch-upload already-transcribed credit, so it exists at only 24 of 111 colleges (`reference-batch-uploaded-transcribed-credit`). ⭐ **Apprenticeship CPL IS measurable** — `apprenticeship_credits`, 309 students / 12 colleges / 6,617.80 units. ⚠️ **Only 4.2% of student rows are nameable** (22,606 of 537,908) — per-credential counts are a FLOOR and the denominator ships as a COLUMN. ⚠️ **537k is fine to STORE, too slow to aggregate LIVE** (~6s vs Sierra's 1.7–5.0s budget) — read pre-computed rollups, never the grain. Runbook [`docs/map_student_credit_reload.md`](docs/map_student_credit_reload.md); story `docs/student_detail_load_lessons.md`. |
| **$50k / ESS 25-82 tab** | Turn the three bare outcome checkmarks into where-you-are / where-you-should-be / how-to-get-there, so colleges get unstuck and award real CPL in MAP. | 🔨 **GROUNDWORK DONE, REWORK NOT BUILT** (SkyPlan, #1007/#1012/#1014). ⭐ **The measure is the DISPOSITION RATE** — share of a college's credit recommendations carrying any disposition (Applied / **Not Applicable** / In Process). Median **4.7%**; MVC 3rd · Bakersfield 6th · Cabrillo 13th of 106 — the ONLY metric matching Sam's own read (three volume metrics ranked Cabrillo 24th–29th). Counting N/A as work done is load-bearing: Cabrillo is 844 N/A vs 320 Applied, so an applied-only metric scores it 9% not 34%. **Applied, not transcribed, is this phase's target** (Sam's correction — transcribing actualises when outcomes funding is live). Data: 436,720 rows at Needs Action (81%); **top 20 exhibits = ~40%** of the backlog; **11,495 rows are "Credit Is Not Recommended"** = a free auto-N/A win. **Build rules:** every step a FRACTION not a check (the Veteran Star taught colleges that uploading is the finish line — applied ≈ JSTs at ratio 1.00); reframe the Star as a starting line; **never rank colleges publicly**. **Next:** the rework itself, then wire Malone's view (expected 8/7) into `fetch_custom_report.py` + `_build_cr_backlog.py`. |
| **College action page / MAP-team queue** | One page (not 123) where a college picks itself + a role and gets its stats, its opportunities against the goals, and concrete to-dos — plus the same engine pointed INWARD at the MAP team's own backlog. | ✅ **BUILT, AND REBUILT AROUND SIERRA (Session 143, #1128).** Sam, after the MAP team used it: Sierra AI was the part they valued, so she now **leads the tab** and everything under her is **collapsible, default collapsed** — a minimal initial view with nested detail. ⭐ **A CLOSED SECTION STILL CARRIES ITS OWN FIGURE** — collapsing is only *minimal* if what remains informs; open state lives in `state.open`, **not the DOM** (`render()` rewrites `innerHTML`). `methodology-a-collapsed-section-must-still-inform`. The **22 strategies moved inside the funding priority they earn against** (10/6/6). Gated on `prioritiesAlign()` = **COUNT equality**, deliberately not metric equality (the funding module loads its overlay async, so a metric gate flaps). Only `cpl-implementation` folds in — every-project guarantee survives. Section names are Sam's: **My CPL Funding** (moved up under *Start here*), **Current MAP Users and Contacts**, **Statewide CPL Benchmarks** (he rejected "tier" and "compares statewide" — both imply a ranking; the five criteria are FIXED thresholds, i.e. benchmarks). `buildQueue(sources, now)` is **pure — reuse it, do not fork the ranking rules**. Tab rule: **measure at load, never carry a list**; a failed read is `unknown` at the TOP, never 0. The strategies live in Supabase `cpl_funding_config` → Scenario 1 → Year 1 (Y1 ≡ Y2; "Year 1 is authoritative"). Live shares **50/30/20** via `…yearPriorities."1"` (camelCase). ⚠️ **NEVER RE-DERIVE AN ALLOCATION — call `_alloc()`.** Iterative **floor waterfall** (50 of 115 at the $150K floor, whose $1,999,687 comes out of the same pool), so a flat share is wrong. Cross-check: Mt. SAC = **$522,239** (Sep-BOG). ⚠️ **`_alloc()`'s per-priority caps key off the OTHER tab's `state.viewSlot`** and front-load zeroes later years — call **`_prios(name, slot)`** with an explicit slot or a Year-2 view renders $0 across all three. ⭐ **JOIN BOTH SIDES THROUGH `cplCollegeShort()`** — the tab normalised only MAP's name and compared it to the roster's RAW string, so **five colleges were shown NO implementation funding** (Mt. SAC, Norco, Reedley, MiraCosta, LA Southwest); fixed by `rosterKey()`. The old "0 orphans" claim tested one side only. `methodology-normalise-both-sides-of-a-join`. ⭐ **The lead figure is ONE decision, not 300** — **98.8%** of the 64,074 articulated-and-waiting units is Credit for Basic Military Service (the same military dominance the bucketing doctrine generalises); whole backlog **592 rows**, **33 of 106 have NONE**. ⚠️ **An ABSENT measurement must never render as an ACHIEVEMENT** — a college with no credit-summary row was told "Nothing is waiting… that is a finished queue"; `waitingBreakdown()` now returns a distinct `unmeasured` state. Congratulatory copy needs a stricter guard than neutral copy. ⚠️ **`map_college_cr_unit` carries NO k-anonymity of its own** (only `map_college_credit_summary` applies k=10). ⚠️ **A percentage must never round UP into a claim** — `safePct()`. ⚠️ **The access shape (`?college=`) is an RLS DECISION, not a UI change** — four reads are DB-gated. ⚠️ **`map_credential_student_rollup` is a MATVIEW — Postgres cannot give it RLS and `anon` holds the grant** (safe today, no backstop below the build script). ⚠️ **Suggested questions FILL AND SEND** via `cpl_chat.js` `ask()` — **`prefill()` must stay send-free** (Sierra Training replays through it). **HELD BY SAM (2026-08-12): MAP deep links, the RLS decision, and the MIS side-by-side.** The two "CPL students" figures disagree (36 of 104 match exactly) — **parked**, cause per Sam: MAP records are being pulled for Exhibit-reference correction and reloaded, so our extract is stale; expected to resolve with the MAP Custom Report fetch. Our aggregation is faithful (`students` == `count(distinct student_key)` exactly). Story: `docs/college_action_page_lessons.md`. |

| **College & district identity** | One taxonomy: every college/district name variant resolving to MAP's authoritative `college_id` and the CCCCO MIS district code. | ✅ **CROSSWALK BUILT — dry run merged, NOT yet written to Supabase** (SkyLink, #1131–#1133). **116 colleges · 116 with a district code · 73 districts · 0 unresolved · 262 name variants, none empty.** Sam: *"I continue to see a disconnect… Mt San Antonio vs Mt. San Antonio."* THREE systems named these colleges and none knew the others: `map_colleges` (authoritative `college_id`; its **`variants` column existed and was EMPTY on all 128 rows**), `kb/college_short_names.json` (no id at all), and CCCCO MIS **Appendix A** (`kb/reference/mis_district_college_codes.json` — the PDF Sam supplied 2026-08-08, in the repo since Session 128 and never joined to anything). **24 of 116 were spelled differently**; **no Supabase column matched `%district%`** at all, so the 72-district picker ran off a JS file with no DB backing; **16 tables key on a name string** (`coci_college_programs` is 22,335 rows). ⭐ **VALIDATE A SUPPLIED CODE COLUMN BY ITS STRUCTURAL INVARIANT** — a 2025 roster's `LocationID` looked perfect (plausible 3-digit codes, first row matched exactly) but **3 of 106 agreed**: real MIS codes on the wrong rows. Caught because MIS codes are **district-prefixed** (Appendix A: 25 of 26 multi-college districts; the roster: 3 of 23, LA CCD scattered across 121/234/312/422/471/571/721/748/862). Spot-checking cannot detect a shifted column. Its `DistrictType` also contradicts itself (37 rows vs its own counts; 14 districts carry BOTH values) so **M/S is DERIVED** from the college count. **The file was still kept** — its `MAPCollege` column is a CCCCO bridge that took the hand-curated table **30 → 0**. ⚠️ **Two Appendix A parse defects repaired** (`970/971` COPPER MOUNTAIN doubled + filed under CONTRA COSTA; `470/471` EVERYGREEN) — `verify_source()` re-derives both so an upstream fix makes the patch a no-op. `EVERYGREEN` is in BOTH CCCCO files, so it is **upstream, not our parse**. ⚠️ **Futuro Health is `college_id` 133, `entity_kind='partner'`** (Launch 132) — the crosswalk excludes partners, and `cplCollegeShort()` returns its input on a miss, so **key partners on `college_id`, never the name**. ⭐ **North Orange Continuing Education + San Diego College of Continuing Education have their own CEO** but no `map_colleges` college row — the standalone NC institutions the Learning-Partners workstream found at ZERO. **NEXT: write `variants` + district columns to Supabase** (the write that actually ends the Mt. SAC problem); open questions = own `districts` table vs columns, and whether those two NC institutions become `entity_kind='college'`. Story: `docs/college_identity_lessons.md`; durable: `methodology-validate-a-code-column-by-its-structural-invariant`. |
| **Team access / site phrases** | Where a curator enters the team phrase, and which phrase a given tab answers to. | ✅ **HEADER UNLOCK + SITE SCOPING LIVE (SkyFund, #1137/#1141).** 7 tabs consumed the phrase and offered NO box, each saying *"sign in on Team & RACI … and re-open this tab"* (Contracts, Governance, MAP Users, NC/Learning Partners, Sierra Training, MAP Queue, College Briefing); two gate a READ, so the bounce cost the whole tab. Now a 🔒/🔓 control in the masthead that follows the Site dropdown and **names the scope it will unlock**. ⭐ **A tab can carry a site phrase ONLY if it is EXCLUSIVE to that site** — every other gated tab is also a CPL tab, so demanding the org phrase there locks out CPL users. `cobi_orgs.js` already held that list; exactly **two** tabs qualify (`gr-priorities`, shipped; `contracts`, this run). **C&I and CIP have ZERO gated tables of their own** — an empty set, not an oversight, and why the `ci` secret never had a server-side gate. Shared tabs keep `team_pass_ok()` (matches ANY secret), so **"allow either" is free and nobody lost access**. Each site phrase gets its OWN slot (`cpl_gr_pass`/`cpl_fin_pass`), so holding Finance never costs the shared phrase. 🔑 **Team Phrases is now a TAB** (`team_phrases.js`) — visible to all, contents on a magic-link reviewer sign-in; the phrase deliberately does NOT open it (a holder who can rotate makes rotation meaningless). ⚠️ **`team_access` RLS FILTERS a non-reviewer to `200 + []`, never 403** — "no phrases configured" would tell a locked-out person the opposite of the truth; not-signed-in / not-a-reviewer / read-failed are three distinct renders. Same on write: a policy-filtered PATCH returns 200 with an empty body. ✅ **CONTRACTS IS LOCKED TO THE FINANCE PHRASE (applied 2026-08-12, migration `site_phrase_fin_contracts_swap`)** — 12 policies to `fin_pass_ok()`, DELETE still reviewer-only, `team_pass_ok()` gone from the register. Sam rotated the Finance phrase himself on the new tab first (the sequencing mattered: applying before distribution would have darkened a working register). **STILL OPEN — needs Sam:** under "allow either" a site phrase is a **superset** (opens its own tabs *plus* every shared one) — safe only while every holder is trusted with all shared CPL data. **Decide before the Finance phrase reaches anyone in Finance**: split the scopes with a `scope` column so `team_pass_check()` matches only `scope='shared'`. `methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface`. |
| **Sierra Training (the trainer)** | The tab where the team teaches Sierra — feedback triage, the questions she struggled with, and the instructions she follows. | ✅ **USABLE BY A HUMAN (SkyFund, #1138)** — SkyLink's Priority 1, closed. ⭐ **THE COMPOSER WAS SILENTLY EATING SAM'S INSTRUCTIONS**: `maxlength="500"` on the textarea AND an independent 500-char slice in `cpl-chat`, so all three rules written 2026-08-12 were cut — two at exactly 500, one at 499 ending mid-table (`| ASE A1 –`). `maxlength` gives NO feedback; it just stops accepting keystrokes. Raised to **1,500 on BOTH sides** (raising one alone relocates the truncation) + a live counter; **cpl-chat deployed v39**. The **total** budget (now 9,000) fails the same silent way — past it the function drops the OLDEST rules, and the oldest is the naming rule. ⚠️ **Truncated text is NOT recoverable** — Sam must retype those three. ⭐ **A queue that tracks ATTENTION but not REMEDY reports itself complete**: `new→triaged→addressed` recorded that a human *looked*, never what was *done*, and marking "addressed" changed nothing about Sierra while the queue read as clear. Both panes needed to fix it sat on the same screen, unconnected. Now "Mark this:" (each button stating it does not change Sierra) + **"✍️ Write an instruction about this"**, which seeds the composer from the question and writes nothing on its own. Plain language throughout (punt → "Sierra said she didn't know"; CI rows → "automated test messages"); hover-overs on every filter/chip/number, each saying what it means **and what to do about it**. ✅ **Guidance DOES reach My College's Sierra AI section** — `fetchTeamGuidance` runs per request, no cache (Phase 2, wired since S94). ✅ **A SAVED INSTRUCTION IS EDITABLE, AND TESTABLE FROM THE SAME BOX (SkyPeak, #1146).** Sam: *"I need to edit the last entry I made … but there is no way to get back into it once saved."* The only controls were Switch off / Switch on, so fixing a typo meant retyping the rule as a NEW row — which also moves it to the top of the **newest-10 window** that decides whether Sierra is sent it, silently pushing another rule out. **RLS already allowed the update** (`sierra_guidance_team_update` covers every column) — a missing affordance, not a missing permission. Now ✏️ Edit opens in place with the rule, the note and a **test question**, plus **💾 Save & ask Sierra →**. ⭐ **Three failure modes, each guarded:** a PATCH that RLS filters returns **`200` + EMPTY body**, so an "ok" that touched no row is a **failure** with the typed text kept (the guarantee lives in the function, not in whether an input handler fired); it **refuses to hop on an unsaved edit**, which would test the OLD wording and read as "the instruction did nothing"; and the open editor + its question **persist in `sessionStorage`**, because testing means leaving the tab and edit→ask→edit is otherwise three chores. `tests/sierra_guidance_edit.test.js` **26 checks**. ✅ **THE HAND-OFF WAS TYPING INTO A HIDDEN BOX (SkyRef, #1166).** Three defects, **all SILENT** — a button that does nothing looks like one never wired. ① `cpl_chat.js` holds `inputEl` at MODULE scope; My College mounts the same widget and `build()` re-points it, and `mount()` is idempotent — so **after one visit to My College every hand-off typed into a hidden pane**. ② `removeItem` ran BEFORE the abort guard, **destroying the retry too**. ③ The question sits inside the row's click target, so mouse-up re-rendered and **destroyed the selection**. Also: `copyText` passed an **empty rejection handler** to `navigator.clipboard`, which rejects on an unfocused document. `tests/sierra_test_handoff.test.js` 18 checks, **verified against the PRE-FIX file (5 fail there)** — it must reproduce the TWO-MOUNT condition; the happy path passed throughout. ✅ **THE GAP PANE WAS 83% ROBOT (SkyRef, #1169/#1171).** Sam: *"How can I click this resolved?"* — he could not: the feedback pane's status lives on `sierra_feedback`, while the gap pane reads `chat_interactions`, an append-only turn log with **no status column**, so that list could never shrink. New gated `sierra_turn_review`; **absence of a row IS "still outstanding"**, so "↩ Still to do" is a **DELETE**, not a third status (otherwise never-looked-at and looked-at-then-reopened stop being distinguishable). ⭐ **Measured before building: 78 gap rows, 65 were `session_id='smoke-ci'` — only 13 real.** The feedback pane has excluded CI since it shipped; the gap pane never had the equivalent. **This also explains the duplicate pairs** Sam spotted — the smoke suite asks each question TWICE and one probe is *meant* to have no college context, so **43% of punts have a SUCCESSFUL twin within 45s**. Nothing was flapping. CI now excluded from the list **and the theme strip** (which was reporting the robot's vocabulary: `san ×35 · diego ×22 · mesa ×24`), with a visible toggle; bulk marking added, refusing CI rows even when shown. **Next:** Phase 3, documents in her knowledge. Sam triaged the backlog **25 → 5** himself; 3 are now fixed in code. `docs/sierra_training_tab_scope.md`; [`methodology-a-one-shot-handoff-must-not-consume-what-it-cannot-deliver`](docs/kb-notes/methodology-a-one-shot-handoff-must-not-consume-what-it-cannot-deliver.md). ✅ **THE HAND-OFF NOW SURVIVES CPL ASSISTANT BEING SUPPRESSED (Sky155, #1187).** It named `#chatbot` specifically, so hiding that tab would have left no way to test an instruction — **silently**. Now falls back to My College, which mounts the same widget, keyed on `data-org-hidden` (jsdom has no layout, so `offsetParent` is untestable). ⚠️ **The base `cplchat-*` CSS lives in the `#chatbot` pane's MARKUP** — hiding the pane is safe, REMOVING it unstyles Sierra everywhere. ✅ **Send note fixed (#1185):** an author `display:flex` beat `[hidden]` so the composer never closed, and the confirmation was **unconditional** — a note that never saved was thanked for. Now confirms on `res.ok` only and **keeps the text on failure**. |
| **Admin tab / the side menu as data** | One place to manage the COBI side menu — order, grouping, naming, which sites show what, who sees it — beside what actually protects each tab. | ✅ **LIVE (SkyGate, #1193/#1195/#1196).** The menu is now `cobi_nav`, a curator overlay edited by drag and drop; **seeded EMPTY**, so today it is exactly what the code ships. ⭐ **THE OVERLAY NEVER GATES THE MENU** — the page builds from code and paints, then applies the overlay if and when it arrives. Offline · HTTP error · malformed rows · a throwing `plan()` · a corrupt cache · **a read that never resolves** each land on the shipped menu, each tested. A rules table that fails closed gives an untuned bot; a nav that fails closed gives a site with no navigation, so the fail-safe carries more test surface than the feature. ⚠️ **LOCKOUT IS PREVENTED IN CODE, NOT THE TABLE** — `admin`/`dashboard` cannot be hidden, cannot lose their pin and refuse to be dragged into a group; `admin` is LIFTED OUT of a group that gets hidden. Enforced at three points (plan, the drag, the render) because the table is the thing being guarded. ⭐ **TWO PROTECTION LISTS, AND THE AXIS IS RECOVERABILITY**: `PROTECTED` (never `hidden`) is `admin`+`dashboard`; `AUDIENCE_LOCKED` is `dashboard` ALONE, because an audience rule is recoverable — sign in and it returns — while `hidden` is not. ⚠️ **DISPLAY IS NOT SECURITY**, and the tab is built around saying so: menu columns and the live RLS gate (`cobi_rls_gates()`) share ONE table, and the audience control warns **on itself** when the data behind it is public-read. **73 tables + 6 views: 29 public-read · 24 team-phrase · 10 server-only · 5 reviewer-only · 4 Finance · 1 GR · 0 with RLS off.** ⚠️ **FIVE WAYS THE SCAN SAID "NOTHING TO PROTECT"** — 13 of 35 tabs load eagerly; the boot regex caught only the FIRST `loadScript`; `cpl_memory.js` defines `REST` with a trailing slash; RPC-only tabs (`chatbot`, `raci`) looked dataless; VIEWS were excluded, which is how `map_credential_student_rollup` would have stayed invisible. Five tabs remain genuinely unmapped and render **unknown with the reason**, never as a clean bill of health. ⚠️ **A FULL-REWRITE SAVE MUST ROUND-TRIP WHAT IT DID NOT TOUCH** — the draft seeded from `plan()` (placement only), so a save after ANY drag would have blanked every label, site list and pin; 7 checks fail against the pre-fix source. ⚠️ **THE SAVE HAD NEVER WORKED ONCE — `cobi_nav` held ZERO rows** (Sam, 2026-08-14, first real-browser use: *"the Save did not work"* → `save 400`). A bulk POST is ONE INSERT over the **union** of the array's keys, so `audience` — carried by tab rows, omitted by group rows — was in the column list and every group row supplied NULL into a NOT NULL column (`23502` → 400). Every save contains a group, so every save failed, and **an overlay seeded empty on purpose gives no signal that writes are failing**. Fixed #1203: both kinds build through ONE `navRow()`, and the test asserts key-set **UNIFORMITY** (the narrower "has audience" passes the day someone adds the next tab-only column). The error now carries the server's reason and **no longer blames the sign-in on a 400** — that loop cannot succeed however valid the session. ⚠️ **The audience picker is a FILTER, not an annotation** (Sam: *"I wasn't trying to hide it… just noting that they need a team phrase to curate"*): the word "hides" lived only inside the ⚠, which fires only for public-read/unmapped tabs, so on most items the consequence was never stated while it applied to all of them. Now stated unconditionally. **NEXT: still nobody has dragged-and-SAVED in a real browser since the fix**, then fill owners on DR-13…DR-18. Story: `docs/admin_tab_lessons.md` · `docs/session_credentials_lessons.md`; ADR [`adr-the-side-menu-as-an-overlay-over-code-defaults`](docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults.md); durable [`methodology-a-bulk-post-is-one-statement-over-the-union-of-its-keys`](docs/kb-notes/methodology-a-bulk-post-is-one-statement-over-the-union-of-its-keys.md). |
| **Noncredit CIP categories** | Which of the CO's ten noncredit CIP categories a program belongs to — and what that means for CDCP eligibility and funding. | 🔨 **SCOPED + PARTLY BUILT; a blanket rule shipped and was reverted** (SkyCode, #1191 · #1192→**#1194** · #1198 · #1199). Read [`docs/noncredit_cip_category_scope.md`](docs/noncredit_cip_category_scope.md) before touching this — it is the authority and the numbers live there. ⚠️ **#1192 shipped "all noncredit programs → `32.0111`" and was live ~20 minutes.** Jenni clarified: **Short-Term Vocational ONLY** — ESL, Job Prep and some Basic Skills are CDCP-eligible on *other* codes, the rest of noncredit is leisure. The blanket rule was wrong for the **majority** of 3,187 programs. ⭐ **THE TOP IS NOT LOAD-BEARING.** Short-Term Vocational is `32.0111` **plus a secondary credit CIP** aligning with the subject, so the **1,796** programs on a "wrong" credit CIP are not errors — that code IS the secondary — and **1,789 of 1,796 (99.6%)** already sit inside their own TOP's crosswalk. A TOP-correction project was unnecessary. ⚠️ **TOP cannot decide the category even when correct**: only **28.8%** of programs are claimed by one category (Short-Term Vocational and Workforce Preparation are both "any vocational code" → **1,928 undecidable**); it blocks compliance for **17 programs / 13 colleges**; peer consensus repairs **38 of 3,187**. **Ladder:** 997 read to one category from their noncredit CIP · 76 off-list · 1,796 hold the secondary · 247 no CIP · 71 retired. Secondary CIP categories: CTE 1,327 · Both 177 · Non-CTE 292. ⚠️ **CTE IS FUNDING-BEARING** (CTE noncredit qualifies, non-CTE does not) → **category confirmed BEFORE CTE concluded**; the *"noncredit TOP must start with 49"* flag is **deliberately unshipped** (1,970 would flag, **1,601 of them `GOAL = CTE`**, and moving them off an asterisked TOP can strip the marker). ⚠️ **A relayed code table had its Basic Skills labels shifted by one, silently** — caught only by checking **all seven pairs** against the CO's certified catalog; the validator now runs on every rebuild. **Guards that survived the revert:** computed **never stored**; a proposal says `proposed · COCI has X`, never *"changed from"* (which claims a human decision); a proposed code must appear in the row's own option list. **BLOCKED ON JENNI:** the Basic Skills pairing (alone unblocks build phases 1–3) · `32.0199` (60) and `35.0101` (16) in use but off her list · is the 2026-07-15 crosswalk cut the locked one · is the secondary CIP becoming a COCI field · **can non-CDCP categories be CTE at all** (~1,300). **BLOCKED ON SAM:** where a confirmed category persists — `localStorage` is wrong for a funding-relevant determination; recommend a gated Supabase table with who/when, as with `cr_reference_decisions`. Story: [`docs/cip_crosswalk_lessons.md`](docs/cip_crosswalk_lessons.md); durable [`methodology-the-record-may-already-hold-a-better-signal…`](docs/kb-notes/methodology-the-record-may-already-hold-a-better-signal-than-the-field-you-are-repairing.md). |
| **Where you enter a credential** | The team phrase and the personal reviewer sign-in — where each is entered, and whether every gated tab offers one. | ✅ **BOTH CLOSED (Sky157, #1200/#1201).** ⭐ **The reviewer sign-in was a POINTER AT A ROUTE THAT NO LONGER EXISTED.** `raci.js` carried a complete `signIn()` **whose button had been removed** — no caller anywhere — while `admin.js` told anyone signed-out to *"sign in with a magic link on the Team & RACI tab."* Admin is **reviewer-only**, so the phrase could never have opened it either: the one documented way in could not be carried out, and nothing failed. Fixed in **ℹ About** (Sam's call: *"Since Admin supersedes RACI"*) — structurally right too, because the 🔒 masthead control is **site-scoped** (Team ⇄ GR ⇄ Finance) while a reviewer sign-in is **personal identity** and not site-scoped at all. `mountInto()` lets Admin mount the SAME control inline, so nobody is bounced. **RACI keeps the phrase box** (Sam: *"RACI can use the team phrase rather than the magic link"*). ⭐ **Then measured, not guessed: 43 tables gate on a phrase, 26 on the READ.** Of 18 tabs touching one, **eight** had neither an input nor a mention of the header, and **thirteen live strings across five files** still sent people to Team & RACI. Where the gate is on the read, the tab does not look locked — it looks **broken**. Shipped **one** `CPL_TEAM_PHRASE.lockedBanner()` carrying a working input (default `onUnlocked` re-dispatches `cpl-tab-activated`, which every gated tab already listens for) + a **`reviewerOnly` variant that offers NO input** and points at About, because an input that can never succeed reads as a wrong phrase. **`tests/team_phrase_affordance.test.js` is the guard** — a rule that depends on the next tab author remembering it fails on their first day. ⚠️ **The detector was wrong twice, both caught by reading its output:** it flagged 5 tabs, **3 falsely** (a differently-named RPC, a magic-link gate, an anon-INSERT intake form) — acting on it would have shipped 3 wrong banners; then it reported **clean while 5 live instances sat in one file**, because the copy is split across concatenated string literals a regex cannot cross. ⚠️ **A fail-safe the tests caught:** without `team_phrase.js` loaded the rewritten tabs rendered an **empty** locked state, worse than the copy replaced. **Coverage now: 12 carry an input · 4 name the header · 3 exempt with a recorded reason · 5 tabs UNMAPPED and unverifiable** (printed, never counted clean). `kb/phrase_gated_tables.json` is a **tripwire, not an authority** — it can only under-report. **NEXT: nobody has exercised the sign-in in a real browser** (sandbox cannot reach the site). Story: [`docs/team_phrase_lessons.md`](docs/team_phrase_lessons.md); durable [`methodology-an-instruction-naming-another-surface-is-an-unenforced-dependency`](docs/kb-notes/methodology-an-instruction-naming-another-surface-is-an-unenforced-dependency.md) · [`methodology-a-copy-detector-must-read-the-rendered-string`](docs/kb-notes/methodology-a-copy-detector-must-read-the-rendered-string.md). |
| **EACR filter rework** | The Exhibit Adoption tab's filters — Sam: *"filters need drop downs and they don't all work."* | ✅ **FIXED (SkyRunner, #1174).** ⭐ **ONE defect explained BOTH halves of the sentence — the dropdowns existed and were INVISIBLE.** `.sw-interactive` sets `overflow:hidden` (it clips the v1 table's corners to the card radius) and the page-level filter bar reuses the class as `<div class="sw-interactive sw-filterbar">`; every `.sw-filter-dropdown` is `position:absolute; top:100%`, so inside a **~70px-tall wrapper all eight opened into a clipped sliver**. Click, nothing appears, and the reasonable conclusion is both "there are no dropdowns" AND "they don't work." Fixed with `overflow:visible` on `.sw-filterbar` only, so the table card keeps its clip. **No conversion to native `<select>` was needed or done** — that would have cost multi-select across 122 colleges for nothing. ⚠️ **The handoff's "the defect is in the control wiring, not the data" was half right**: the wiring was fine too; it was one inherited CSS property. ⭐ **`Calbright College Non-Credit` appears 88 times as a real adopter/potential name** and had NO `college_lookup.js` entry — `collegeMatchesFilters()` **fails closed** on a `LOOKUP` miss (correct: never claim an unknown college sits in the district you asked for) but did so **silently**, dropping all 88 from the District + SW Region filters. Entry added; an unresolved name now **warns**, naming the file to fix. `CA MAP INITIATIVE COLLEGE` (2 rows) excluded as a sandbox org — the full 8-name `TEST_ORGS` list is kept even though only one appears today. `tests/eacr_filters.test.js` **23 checks, verified against the PRE-FIX files (5 fail there)**. |
| **Reviewer session lifetime & scope** | What "signed in" means, how long it lasts, and which browser tab has it. | ✅ **KEEPER LIVE (SkyKey, #1205); CROSS-TAB OPEN (#1207).** ⭐ **ONE DEAD TOKEN EXPLAINED THREE REPORTS IN ONE EVENING** — Admin *"save 400"*, Sierra *"says I'm not signed in"*, CR Reference *"could not read"*, all "fixed" by re-signing in, which is what hid the cause. A Supabase access token lives **~1h** and **13 of 26 modules check only the token's SHAPE**; all three of those tabs are in that half. `raci.js` has said so in a comment since June — **a lesson in one file is not a lesson in the repo**. Fixed with a **KEEPER, not a 14th copy** (`cpl_session.js` renews `cpl_sb` underneath every reader, so the 13 benefit **untouched**). ⚠️ **SHIPPING IT ALONE WOULD HAVE BEEN WORSE THAN THE BUG** — refresh tokens ROTATE, six modules renew from a **cached** session, and three of those **drop the session on any failure** = silent sign-out mid-edit; all six now re-read, with a static guard. ⚠️ **Only a definitive 400/401 may end a session** (raci dropped on ANY rejection, so offline cost you your work), and **reading must not delete**. ⭐ **`sessionStorage` IS PER BROWSER TAB** — Sam diagnosed it: the magic link opens a NEW tab, the one you were working in stays signed out, and `cpl_sb_return_tab` is powerless. #1207 makes `localStorage` canonical + mirrors it per tab; **a per-tab MARK distinguishes "fresh tab" from "signed out"**, else the sign-out button does nothing. Cap **12h** (`MAX_SHARED_AGE_MS`). **NEXT: one real-browser round trip proves the lot** — sign in → the OTHER open tab signs in → drag+Save on Admin → sign out → both stay out. Story + Sam's rulings: [`docs/session_credentials_lessons.md`](docs/session_credentials_lessons.md); durable [`methodology-a-rotating-credential-cannot-be-cached`](docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached.md). |
| 2 | Articulations by Unified Course — interactive view + curation | parked |
| 4 | SLO ingestion + the rest of the MC slot fields | parked (unlocks MC-readiness scoring) |
| 5 | CTE classifier (TOP code → COCI CTE field) | parked (unlocks CIDx lane) |
| 6 | CIDx submission automation (the eventual goal) | parked (the destination) |
| 7 | M-ID → CID substitution workflow on approval | parked (governed by Rule 7 once re-locked at faculty publication) |

The auditor is the foundational instrument for the whole pipeline: every phase
upstream of CIDx submission produces a higher trust score and graduates rows
from one readiness tier to the next.

### SkyKey — one dead token wearing four costumes (2026-08-14/15, Session 158)

Four merges (**#1203**, **#1205**, **#1206**, plus #1204 held by Sam), one open (**#1207**). Sam tested live all
evening; every fix came from a real report and he diagnosed the last one himself.
⭐ **THE ADMIN SAVE HAD NEVER WORKED ONCE** — `cobi_nav` held **zero rows**. A bulk POST is one INSERT over the
**union** of the array's keys, so `audience` (NOT NULL, tab rows only) arrived NULL on every group row → 400. The
defect exists only ACROSS the array, so row-level tests and the mock all passed — and an overlay **seeded empty on
purpose** gives no signal that writes are failing.
⭐ **THREE MORE REPORTS WERE ONE EXPIRED TOKEN**, fixed with a keeper rather than a fourteenth copy.
⚠️ **SHIPPING THAT ALONE WOULD HAVE BEEN WORSE THAN THE BUG** — rotation + six cached refreshers = silent sign-out.
**Audit what a new component makes FREQUENT, not just whether it is correct.**
⚠️ **A PRIVACY GUARD HAD SILENTLY STOPPED GUARDING**, and **every detector written this run was wrong on first
writing** — all three caught by printing what they found instead of trusting the count.
Story: `docs/session_credentials_lessons.md` · handoff `docs/session_159_handoff.md`.

### Sky157 — a door that was never there, and eight tabs with no input (2026-08-14, Session 157)

Two merges (**#1200**, **#1201**). Sam tested live throughout; every fix came from a real report.
⭐ **THE REVIEWER SIGN-IN WAS A POINTER AT A ROUTE THAT NO LONGER EXISTED.** Sam: *"I tried using the
magic link login on RACI tab but it only has the team phrase input now, so I can't edit the new Admin
tab."* `raci.js` still carried a **complete `signIn()` whose button had been removed** — no caller
anywhere — while `admin.js` told anyone signed-out to *"sign in with a magic link on the Team & RACI
tab."* Admin is reviewer-ONLY, so the phrase could never have opened it either: the single documented
way in was an instruction that could not be carried out, and **nothing failed**. Moved to **ℹ About**
on Sam's call (*"Since Admin supersedes RACI"*) — also structurally right, since the 🔒 masthead
control is site-scoped while a reviewer sign-in is personal identity. Admin mounts the same control
inline; RACI keeps the phrase.
⭐ **THEN MEASURED, NOT GUESSED.** 43 tables gate on a phrase, **26 on the READ**; of 18 tabs touching
one, **eight** had neither an input nor a mention of the header and **thirteen live strings across
five files** still sent people to Team & RACI. Where the gate is on the read, the tab does not look
locked — it looks **broken**. One shared `lockedBanner()` with a working input + a CI guard, because
a rule that depends on the next author remembering it fails on their first day.
⚠️ **MY OWN DETECTOR WAS WRONG TWICE, BOTH CAUGHT BY READING ITS OUTPUT** — 3 of 5 flagged tabs were
false (acting on them would have shipped three wrong banners), then it reported **clean while five
live instances sat in one file**, because the copy is split across concatenated string literals a
regex cannot cross.
⚠️ **A FAIL-SAFE THE TESTS CAUGHT:** without `team_phrase.js` loaded, the rewritten tabs rendered an
**empty** locked state — worse than the copy replaced.
**SkyCode, same day:** the noncredit CIP categories — a blanket `32.0111` rule shipped (#1192) and was
reverted (#1194) after ~20 minutes; **the TOP turned out not to be load-bearing** and a whole
TOP-correction project was unnecessary. See the §11 row and `docs/noncredit_cip_category_scope.md`.
Story: `docs/team_phrase_lessons.md` · `docs/cip_crosswalk_lessons.md` · handoff `docs/session_158_handoff.md`.

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
