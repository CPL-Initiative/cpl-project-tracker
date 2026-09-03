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
   data-file headers), **not yet faculty-published**, so principled re-mints
   are part of the cleanup loop rather than something to fear. **Never re-mint
   casually** — the playbook is **mandatory**:
   [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md).
   Once we explicitly declare the M-ID layer **faculty-published**, this rule
   re-locks to "stable identifiers, no renumbering."

   The **M-ID structural invariants** (SUBJ4 shape, the umbrella and fan-in
   exceptions, C-ID/CCN format), the re-mint **mechanics** (dry-run, alias map,
   `kb/promotions.json` re-key, alias-map resolution semantics, atomic land in
   one cron window) and every past re-mint are **PULL** — you read them when you
   are re-minting, which you already know you are doing:
   [`docs/reference/mid_lifecycle.md`](docs/reference/mid_lifecycle.md).

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
   flags **in scope for this run**. Rationale + the vault-weight finding:
   [`docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md`](docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md).
   **Trigger: `checkpoint_overdue` in the lint** — more than 6 commits since the
   newest `session_<N>_handoff.md` was written. ⚠️ **That exists because Rule 9's
   original trigger was "roughly every ~100K tokens… Claude Code doesn't expose
   an exact counter; use proxies" — a condition no session could act on, and
   whose premise was FALSE besides (Rule 9a: the counter is on disk).** The
   heuristic still applies between runs of the lint — long conversations, many
   tool calls, multi-phase work.

   ⚠️ **Run `/checkpoint`; do not improvise one from memory.** Asked to describe
   a checkpoint under pressure on 2026-08-29 I named 2 of its 13 artifacts and
   hand-waved the rest, and the answer looked competent. **The artifact list is
   the checkpoint command, not this file** — all 13, none optional, all syncing
   to Sam's Obsidian:
   [`.claude/commands/checkpoint.md`](.claude/commands/checkpoint.md) is the
   authority. ⚠️ This file carried a near-complete SECOND copy of it until
   2026-08-29 (34 of the same artifact names), and the two had already drifted:
   the copy here still said KB notes land `kb-status: candidate`, a state
   retired in Session 11.

   ⚠️ **THE USUAL CHECKPOINT EDIT is the LANE FILE, not the §11 row.** §11's
   table is a POINTER INDEX; each lane's state lives in
   [`docs/reference/lanes/<lane>.md`](docs/reference/lanes/). A checkpoint that
   updates only the row leaves all 30 lane files to go stale — that is the
   failure mode. Deep memory lives in `docs/reference/`: update THOSE, and do
   **not** re-inflate this file. **Session-narrative budget:** a session's §11
   subsection is ≤ ~10 lines, **at most 2** kept inline; move older ones verbatim
   to `docs/roadmap_archive.md`.

   **The authoritative handoff is the HIGHEST-numbered
   `docs/session_<N>_handoff.md`.** A greeting citing a lower number is stale
   (2026-07-10: "105" vs actual 111) — `ls docs/session_*_handoff.md`, read the
   highest, and confirm the number with Sam if they diverge. Sam's greeting
   sometimes names the session's moniker (SkyTime S104, SkyPhilo S108
   precedent) — claim it and carry it in the §11 narrative + handoff.

   Capture in each artifact: (a) what's been learned this checkpoint, (b) the
   current state of the work, (c) strategic roadmap, (d) next concrete step.
   Better to checkpoint slightly early than slightly late — sessions end
   abruptly and what is not in a markdown file is effectively lost.

9a. **Context pressure is MEASURABLE — warn Sam BEFORE the compact instead of
   discovering it after.** Claude Code writes the exact live context size to the
   session transcript every turn, and `compactMetadata.preTokens` at every
   compaction. `kb/_context_budget.py` reads it in ~50 ms; run it any time.
   ⚠️ **It only fires if the PostToolUse hook is INSTALLED, and it is not by
   default** — install + mechanics:
   [`docs/reference/context_pressure_hook.md`](docs/reference/context_pressure_hook.md)
   (Windows: `scripts\install-context-hook.ps1`).
   - **WARN — ≤110,000 tokens left.** Finish the thought you are on, then run a
     FULL `/checkpoint`. **Say the number to Sam** rather than checkpointing
     silently; he may want to spend the runway differently.
   - **EMERGENCY — ≤50,000 tokens left.** Room for ONE checkpoint and nothing
     else. **Do not ask permission** — a compaction mid-question loses the
     answer. Write ONLY: **`docs/session_<N+1>_handoff.md`** (stating it was an
     emergency checkpoint and naming which of Rule 9's 13 artifacts were NOT
     refreshed) · the **lane files this run actually moved** · the **`cpl_memory`
     rows** · **commit + push**. Everything else defers to the next session —
     which is exactly why the handoff has to name it.

   ⚠️ **Both thresholds are measured, not chosen.** A checkpoint cost 49,723
   tokens; the worst single turn 50,425. WARN is their SUM plus slack — a round
   "2× checkpoint" (100,000) misses by 336 and fires with the runway already
   gone. ⚠️ Rule 9's older note that Claude Code *"doesn't expose an exact
   counter"* was **factually wrong**; it does, on disk. Derivation + the replay
   proving this warns 10 turns early:
   [`methodology-context-pressure-is-measurable`](docs/kb-notes/methodology-context-pressure-is-measurable.md).

10. **Supabase live-curation safety.** Sam curates LIVE beside sessions — his
   rows always win. (a) The unit of caution is ANY bulk write to a shared
   human-write table — `kb_curation` is the worked example, NOT the boundary;
   the [dependency map](docs/reference/dependency_map.md)'s write edges name
   the rest. Before one: fresh live read at write-time, re-measure any
   queue/worklist staged earlier in the session, and (for `kb_curation`)
   cross-check pending `unified_title_merge_confirm` TARGETS (a rename
   whose key is a pending merge target fights the curator — hold it). Then
   INSERT-only `ON CONFLICT DO NOTHING` under a cohort `reviewer_email`
   (`<lane>-s<N>@bot`) with a committed receipt; guarded UPDATEs only where a
   reviewed plan explicitly says so. (a2) A data write must be REVERSIBLE
   FROM ITS RECEIPT — `git revert` covers code, and nothing covers data
   unless the receipt does: an INSERT-only cohort rolls back by its
   `reviewer_email`; a guarded UPDATE's receipt captures before-values or the
   plan is not approvable. Procedure:
   [`data_write_rollback`](docs/reference/data_write_rollback.md). (a3) A NEW
   write surface routes through Governance and the privacy ADRs BEFORE it
   ships — the first writer to any shared table, or a read-only surface
   gaining writes, is a decision-rights change, not a code detail: map or
   dismiss it in `kb/governance_surface_map.json` (the reason is the point)
   and check the student-detail disclosure boundary
   ([`adr-student-detail-aggregate-disclosure-control`](docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md);
   the CER-counts and funding-metrics privacy ADRs sit beside it).
   (b) `kb_curation` reads via PostgREST
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
  enroll · while (not `whilst`) · among (not `amongst`)** and the
  `-ize`/`-ization` family. ⚠️ **The British form in a word pair MUST be written
  in a code span.** Bare, the sweeper rewrites it: this list read
  `while (not while)` · `among (not among)` for weeks, because `american_spelling`
  corrected the very words the rule was documenting — and a bare quotation of the
  corruption trips `self_corrected_word_pair` in turn, so even the POST-MORTEM
  needs the backticks. `prose_only()` masks code spans, so
  backticks are what make a word-list entry survive its own lint. **Rendered UI text first**, then
  docs, then comments. Enforced by `american_spelling` in `kb/_docs_audit.py`.
  ⚠️ It scans PROSE only: `grey` is a valid CSS keyword and a token name is not
  a spelling, so never blind-replace inside code.
- **SkyView, not "Atlas" (Sam, 2026-08-24).** The CCR curation prototype is **SkyView**.
  ⚠️ **When Sam says "SkyView" he means the GRAPH VIEW specifically** — the canvas of
  identities you pan, search and drag on — **not** the surrounding informational elements
  (discipline cells, the ESL packaging card, the decision list). Those are panes *on* the
  SkyView page; only the graph is SkyView. Files still carry `ccr_atlas_*` paths; the
  user-facing name is what changed.
- **FUNDING VOCABULARY — CCC NORMS, NOT BUSINESS NORMS (Sam, 2026-08-31).** Say
  **funding**, never "money," on any funding surface. Prefer sector terms:
  *allocated / fully allocated* (not "spent"/"apportioned" for this program's
  split — apportionment is the SCFF term), *restricted / designated* (not
  "fenced"), *redirect* (not "absorb"), *brought up to the minimum* (not
  "topped up"); avoid "double count" (an MIS audit-error term — say *the same
  CPL credits both institutions by design*). The per-institution figure is the
  **max award** — *"communicates that awards are based on outcomes, not
  automatically awarded"* — defined on the tab in his verbatim (2026-09-01):
  *"maximum funding to be awarded based on measurable outcomes and allocated
  as credit and noncredit subtotals."* **Tightened 2026-08-31/09-01:** say
  **funding**, not "pool," for the model's total (vary the wording — "the
  total", "the allocation" — rather than drumming "funding"; the model's NAME
  "one-pool" and code identifiers stay); **never the phrase "on its face"** —
  end the statement instead. **NEVER the concept of ADVANCES and NEVER a
  reference to a not-yet-live data feed, anywhere rendered (Sam, 2026-09-01):**
  *"I don't want to suggest that advances are possible in the model,
  regardless of current missing data feeds or any other factor"* — an
  unmeasured metric reads a plain "no data yet" (the why lives in the
  curator-only diagnostic); "advancing the priority outcomes" (to further)
  and the statute's "Advancing career attainment" are the allowed senses.
  The anchor suite's D13 ban guard enforces it. Sweep prose only, never
  identifiers.
- **HOUSE VOICE — write outward artifacts the way the CO writes (Sam,
  2026-09-01).** He shared his VC of Academic Affairs' letter to CSU as the
  standard: *"the word choice and tone provide an extensive example of the tone
  and vocabulary and sentence variety I would like to see in our artifacts."*
  **Scope: letters, memos, board/legislative materials, college-facing
  communications, public explainer prose, report narrative, deck narration.**
  NOT lane files, handoffs, commits or code comments — those are deliberately
  dense, and register follows audience.
  - **Concede before you argue**, stating the other position at full strength;
    **preserve their authority explicitly** (what is not ours to decide);
    **say what a thing is NOT** where it could be misread; keep the **student as
    the subject** of the problem; **anchor claims to a named instrument** rather
    than asserting them; **vary sentence length and let a short declarative
    land** after a long qualified one; put the **ask last, and make it small**.
  - **No business register** — never *leverage · utilize · robust · deep dive ·
    synergy · operationalize · impactful*. Reach for *invite · partnership ·
    shared aim · complement · warrant · examine together · practical first step*.
  - **No bold, bullets or glyphs in outward prose.** The argument carries itself.
  - ⚠️ **A voice, not a template** — copying its shapes onto a piece with no
    concession to make produces parody, and length is not seriousness. Moves +
    exemplars + before/after:
    [`reference-cccco-house-voice`](docs/kb-notes/reference-cccco-house-voice.md);
    exemplars in `CPLBrain/04-projects/cpl-initiative/resources/`. Mechanical
    floor linted by `house_voice` in `kb/_docs_audit.py`.
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
- **VERIFY THE THREE-REPO SET AT SESSION START (Sam, ruled enforced
  2026-08-30).** Sessions run with all THREE repos attached —
  `cpl-knowledge-base` · `cpl-project-tracker` · `CPLBrain` — *"so they can
  stay informed and syncd."* Check all three are present before working; if
  any is missing, say which in ONE line and ask whether to continue without
  it. The driver may be a teammate on day one — do the remembering for them.
  (A session with NO repo attached loads no CLAUDE.md at all; the backstop
  there is per-machine: `scripts/install-three-repo-check.ps1` installs a
  one-time user-level check line. Human-facing:
  `docs/working_with_claude_code.md` §12.)
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
- **DECISIONS ARRIVE AS DECISION SHEETS (Sam, 2026-08-30).** *"I'd like to
  handle all my current and future decisions this way."* When judgments only
  Sam can make accumulate — in one lane or across many — build ONE numbered
  sheet (a First Light artifact, committed to `docs/visuals/` with a dated
  slug): per item, what it is in plain words, the measured context (from the
  maps and feeds, never guessed), a PROPOSED disposition with its draft
  reason, and reply-by-number verdicts (`yes · edit: … · fold: … ·
  dismiss: …`). The session executes the verdicts and commits the reasons.
  This replaces asks scattered through chat and feed items parked for weeks;
  the To-Do feed POINTS at the live sheet, never substitutes for it. Worked
  example: `docs/visuals/2026-08-30-governance-fifteen-tables.html` —
  fifteen rulings in one sitting. Human-facing version:
  `docs/working_with_claude_code.md` §11.
- **CAPTURE UNPLANNED SUBSTANCE ON THE FLY (Sam, 2026-08-30).** His important
  statements are never planned — *"just comes out of our interactions and I
  don't think to say specifically braindump."* When Sam or a team member says
  something substantive unasked — a decision rationale, a vision, a lesson, a
  failure or success story — capture their words VERBATIM with who/when,
  unprompted, and say in one line that you did (veto stays with them). Where:
  the `CPLBrain` vault's braindump pipeline when the vault is attached (its
  `CLAUDE.md` + the `braindump` skill carry the mechanics); otherwise a
  `cpl_memory` row plus the lane/lessons doc. The test: would the words be
  worth re-reading in six months? Routine task talk never qualifies.
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
  Sam frequently runs several, and a later write silently wins. **COMPUTE the
  impacts, don't guess:**
  [`docs/reference/dependency_map.md`](docs/reference/dependency_map.md) maps
  every dataset (Supabase table, generated JS, JSON) to its consuming tabs,
  scripts, workflows and public surfaces — derived from the code
  (`python3 kb/_build_dependency_map.py` regenerates; CI `--check`s it).
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
  - **The `test` check must have SUCCEEDED on the current head before you
    merge (Sam's E ruling, amended to doctrine-level 2026-08-30).** GitHub
    cannot make it a required check without rejecting the cron's direct
    pushes (measured live: a rules-active test declined all five of the
    cron's push attempts with GH013), so the requirement is DOCTRINE: poll
    `get_check_runs` on the head until `test` (from `js-tests.yml`) reports
    success — a docs-only diff finishes in ~1.5 min, a code diff ~9 — and
    never merge past a pending or failing `test`. A failing `test` on your
    PR is yours to fix. Waiting for it is the ONE sanctioned merge wait.
  - **Beyond `test`, merge on `clean` OR `unstable`.** `unstable` from any
    OTHER non-required check still merges — do NOT wait for it to flip to
    `clean`. Only `blocked`, `dirty` (conflict) or `behind` gate beyond that.
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
  - **Backstop:** `mcp__github__enable_pr_auto_merge` (squash) — but with no
    required checks configured, GitHub auto-merge fires IMMEDIATELY, so it
    cannot do the `test` wait for you. Call it (or merge manually) only
    AFTER `test` reports success on the current head.
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
- **PLAIN WORDS, NOT GLYPHS — AND THE GLYPH RULE IS STRICT (Sam, 2026-08-29,
  tightening #1212).** *"I think they are mostly noise… I prefer to eliminate
  every visual that doesn't prove its worth."* **The default is no glyph.** The
  burden of proof is on the mark, never on removing it: if you cannot say what a
  reader would misunderstand without it, delete it. Every control is a **word** —
  *Rename · Hide · Remove · Seen by: … · All sites* — never an emoji or an icon
  standing in for a label.
  - **A glyph that earns its place is ghosted, not decorated:** muted **CO blue
    on white** (`--cobalt-on-dark` #7DA1D4, or `--seal-blue` #002F6D where it
    must carry weight). It should read as the quietest thing in the row.
  - **Green and red are for a STATE the user must act on**, nothing else
    (`--green-progress`, `--red-alert`). ⚠️ **Muted by default even then** —
    full saturation is reserved for pulling focus deliberately, and a page where
    everything shouts has no way left to shout.
  - ⚠️ **This does not conflict with "color is never the only signal" above.**
    That rule says a state already worth showing must not be shown by color
    ALONE; this one says most states are not worth showing. Satisfy the first
    with a **word** wherever you can, and a mark only when the word will not fit.
  - ⚠️ **Existing approved exceptions stay** (the 📋 To-Do button, the 🧭
    guidance pane, the ⚖️ Governance tab) — they are named here so nobody
    "fixes" them, and they are the ceiling, not a precedent to extend.
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

**Checkpoint scope — vault, never the public KB.** Rule 9 / `/checkpoint`
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
> and its row leaves this table.
>
> ⚠️ **Do not grep for this; the lint already did.** `lane_retirement_signal`
> in `kb/_docs_audit.py` runs the test over every lane file with a vocabulary
> measured from the live corpus, and names any lane whose own text claims no
> open work. **Today it names none: all 30 lanes have open work** (Session 208,
> confirmed by reading all 30). Then READ the ones it names — the lint is
> fail-safe and deliberately never says "retire this".
>
> ⚠️ **Hand-grepping this has been wrong every single time it was tried.**
> Session 206 called five rows retirable-with-no-judgment-calls; four carried an
> explicit open-work list in their own text. Session 208 then mis-grepped it
> three more times in one run — anchoring to line-start (0 hits), searching
> `NEXT` and missing `Next:`, and requiring a trailing colon and missing bare
> `BLOCKED` — each producing a confident, plausible, wrong list.

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

### SkyOrbit S223 — the whole universe, full screen, every stand-alone in orbit (2026-09-03)

**One PR (#1441).** Sam's five SkyView goals shipped: the map fills the first
screen (a **Full screen** word-button; the panes one scroll below); the header
box jumps to a subject, an identity, a stand-alone OR a college course by code or
control number; hover is a quick look, click an inspector over the map with the
catalog description on a course number, and labels grow with zoom (number →
title → units · system); **every stand-alone course orbits the identity it is
most aligned to** — 30,274 of 33,423, 3,149 on the rim — as a suggestion, never a
decision (**Move here** accepts one as the `CN:` row a drag writes). Descriptions
live in the public storage bucket `ccr-desc` (empty until the workflow's first
dispatch). ⭐ Corroborators must not outvote the primary signal; a side table keyed
by position breaks when the list drops one. Story: `ccr_atlas_lessons`; handoff
`session_224_handoff`.

### SkyCheck S222 — the lifecycle checks are on the API, and under 10 is the mask (2026-09-02 → 03)

**Three PRs (#1437, #1438, #1439).** Pedro's six CPL lifecycle checks were found
as booleans on the student aggregated view by a runner-side probe (the sandbox
cannot reach MAP; `columnName: []` now 500s, `["*"]` enumerates). Sam ruled the
funding attestation is `Counselor_Verified` alone, and `pac` publishes from the
2026-09-03 run (2,820 students · 24,699 units · 18 colleges). His "applied but
no eligible" worklist for Malone and Pedro had zero rows at either grain: the
shape was our artifact's own inconsistent suppression, which left 54 small-portal
colleges earning nothing on Access. Ruled the same day: counts mask under 10
(FERPA practice), units carry the money, public dollars read "<$1,000" or the
nearest $1,000, the curator view exact (ADR ratified); 57 colleges earn on Access
now. `CollegeID2`, the NC FTES origination key, has not landed. ⭐ A floor lives
in fixtures as well as code — four jsdom suites pinned the old number. Story:
`map_custom_reports_lessons` + `cpl_funding_lessons`; handoff `session_223_handoff`.

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
