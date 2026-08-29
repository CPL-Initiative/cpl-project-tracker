---
description: Rule 8 checkpoint — refresh every documentation artifact so the next session can pick up from markdown alone.
---

Execute a **Rule 8 checkpoint** (see `CLAUDE.md` Critical Rule 8). Pause whatever else you're doing and update **every** artifact below — none are optional, all sync to the user's Obsidian via the repo:

0a. **Retire before you append.** Act on `stacked_roadmap_cell` if the lint
   flags it. It guards **two** surfaces since 2026-08-28: §11's pointer table in
   `CLAUDE.md`, and every lane file under `docs/reference/lanes/`. Both state
   **current truth**; when this run's finding contradicts what one says,
   **delete the superseded text** rather than prefixing it with `*Prior:*`.
   History goes to the workstream's lessons doc — once. (Added 2026-08-10: the "Disposition grain" cell had reached 14,338 chars
   with 3 `*Prior:*` markers and 14 warnings, and `CLAUDE.md` was simultaneously
   asserting that Sierra "sits on colleges' own pages" and that "there is no
   internal COBI Sierra". Sam had to make the same correction on two consecutive
   days. A checkpoint that only ever ADDS will eventually contradict itself.)

0b. **Record the DECISIONS the user made this run**, not just what the session
   shipped. Corrections, rulings and constraints they stated are inputs the
   narrative loses — write them to `cpl_memory` with the human named in
   `verified_by`, and to the handoff under an explicit heading.

0. **`python3 kb/_docs_audit.py` — run this FIRST.** The docs **lint** pass (the third Karpathy operation: Rule 8 gives us *ingest*, sessions give us *query*, this is the missing *lint*). It is READ-ONLY and takes ~2 seconds; it writes `kb/docs_audit/<date>.md` + `latest.json`. Run it before writing anything, because its findings change what you write: an `oversized_doc` on the lessons doc you were about to append to means **compact it in this checkpoint instead of growing it**, and an `always_loaded` finding on `CLAUDE.md` means move prose to `docs/reference/` (the 2026-07-10 pare-down, and the 2026-08-28 consolidation that took it from 151 KB to 58 KB) rather than adding more. Read the report; act on what it flags that is in scope for this run; don't chase the whole backlog. Then, when you write the new `session_<N+1>_handoff.md` (step 8), run **`python3 kb/_docs_audit.py --apply`** to stamp every now-superseded handoff — that is the auditor's only mutation, it never touches the authoritative one, and it is idempotent. Commit `kb/docs_audit/<date>.{json,md}` with the checkpoint.

1. **`CLAUDE.md` and the lane file** — ⚠️ **since 2026-08-28 these are two
   different edits, and the one you usually want is the lane file.** §11's table
   is a **pointer index**: the detail for each roadmap lane lives in
   [`docs/reference/lanes/<lane>.md`](../../docs/reference/lanes/).

   - **Refresh the LANE FILE** with what this run learned — that is where the
     old §11 cell's content went, and it is what a future session on that lane
     reads. Same content, same standard, new address.
   - **Touch the §11 ROW only when the lane's STATE changes** — live ⇄ in
     progress ⇄ parked, or open work appearing or clearing. ⚠️ **Do not grow the
     row back into a paragraph.** That is what put this file at 151 KB against a
     60 KB budget; it is now 58 KB and `oversized_doc` will flag the regression.
   - **Adding anything to `CLAUDE.md` itself?** Apply the assignment rule at the
     top of the file: **push what a session cannot know to ask for, pull
     everything else.** If a session would only look it up once it already
     suspected it, that is PUSH and it belongs here. If it answers a question a
     session arrives with, that is PULL — put it in `docs/reference/`,
     `docs/kb-notes/` or `cpl_memory`, **and leave the one-line pointer**, which
     is the part that makes a pulled store findable at all.
   - **Session narrative budget.** A session's §11 subsection is ≤ ~10 lines —
     headline, numbers, PR #s, and pointers to the lessons doc, which holds the
     full story (write it ONCE there, don't restate). Keep **at most 2**
     narratives inline; move older ones **verbatim** to
     `docs/roadmap_archive.md`. Every line in `CLAUDE.md` is context-tax on
     every future session, in three repos.
   - **Retiring a lane?** ⚠️ **Do not grep for it** — `lane_retirement_signal`
     (step 0's lint) already ran the test over every lane file and names any
     lane whose own text claims no open work. READ the ones it names; a lane
     with no NEXT, no NEEDS SAM, no BLOCKED and no load-bearing invariants moves
     verbatim to `docs/reference/finished_workstreams.md` and its §11 row leaves
     the table. Most lanes read *"✅ LIVE … NEXT: …"*, which is live with open
     work. Every hand-grep of this to date has produced a wrong list.

2. **`kb/README.md`** — only if KB structure, generators, or audit artifacts have changed since the last checkpoint. Skip if nothing relevant changed.

3. **`README.md`** — only if a user-facing surface (dashboard, tab, filter, output file) has changed. Skip if internal-only changes.

4. **`docs/<topic>_lessons.md`** — **REQUIRED on every checkpoint.** If a lessons doc for the current workstream doesn't exist yet, create one with the Obsidian frontmatter format from `docs/coursecontrolnumber_remint.md` (title / date / tags / artifacts / related). If it exists, APPEND a new dated section capturing what's been learned since the last checkpoint.

5. **`docs/kb-notes/<topic>.md`** — **ADD any durable learnings.** Ask: did this run produce a learning that is (a) durable beyond this workstream, (b) reusable by future sessions / peer colleges / auditors, (c) distilled (one concept), and (d) self-contained? If YES → author a new KB note in `docs/kb-notes/` using `docs/kb-notes/_template.md` with `kb-status: published` (no review step — the vault auto-sync brings it into Obsidian on the next pull). Suggested types: `methodology`, `reference`, `adr`, `glossary`, `playbook`. If an existing note is now updated by this run, bump its `updated:` field and add a section. See `docs/kb-notes/README.md` for the lane contract.

6. **`docs/INDEX.md` + `docs/catalog/` — GENERATED (2026-08-28). Run `python3 kb/_build_docs_index.py` and commit what it writes. Do NOT hand-add rows for new KB notes / lessons docs / handoffs — they are derived from each doc's own frontmatter, so the way to list a new doc is to give it a `title:` and rebuild.** The per-lane tables now live in `docs/catalog/*.md`; INDEX is the landing page only. Hand-edit INDEX for PROSE only — anything between the `<!-- generated:corpus -->` markers is replaced on every build, so a row added there is lost. **Still yours by hand: record this run in the `## Update history` section at the BOTTOM of INDEX — one bullet, newest first — and set the frontmatter to a bare `updated: YYYY-MM-DD`.** Do NOT append `· prior: …` onto the `updated:` field: that is how it reached 1,853 characters on a single line before being collapsed on 2026-08-09, and `frontmatter_log_chain` in `kb/_docs_audit.py` (step 0) now fails on it. Same rule for any other doc's frontmatter — a frontmatter field is a field, not a changelog. Trim the history list when it passes ~8 bullets; older entries belong in `docs/roadmap_archive.md`. ⚠️ `kb/_build_docs_index.py --check` runs in CI, so a forgotten rebuild is a red check, not a silent drift.

7. **Pipeline visualization (`#tab-pipeline`)** — **REQUIRED if this run moved the pipeline** (roadmap status, auditor counts, a re-mint/apply). Refresh the hand-maintained Pipeline tab in **`CPL_Dashboard.html` AND `index.html`** (Rule 4 — the two MUST stay byte-identical; this tab is static template, NOT regenerated by `excel_to_dashboard.py`, so edit both): **Phase roadmap** (`.pl-phase` cards in `#pl-section-roadmap`) → flip done/active/parked to match the CLAUDE.md §11 roadmap table; **Auditor receipt** (`.pl-stat` cards in `#pl-section-audit`) → the latest `kb/_row_audit.py` tag counts/scores; **Recent re-mint** (`#pl-section-remint`) → the newest re-mint/apply; **M-ID lifecycle** mermaid (`#pl-section-lifecycle`) → only if the stages themselves changed. Skip only if the pipeline genuinely didn't move this checkpoint.

8. **`docs/session_<N+1>_handoff.md` — next-session prompt, REQUIRED on EVERY checkpoint (safeguard).** Changed 2026-05-30: previously session-end-only, now refreshed every checkpoint so a fresh paste-able prompt always exists if the session gets bricked or context is consolidated mid-stream. Overwrite the same N+1 file each time (it always reflects the latest state). Second person ("You are Session N+1"), paste-able into the next session's first message, covering: what shipped, docs to read in order, the priority workstream(s), carryover + status, patterns that worked, safety patterns to honor, and a moniker suggestion. Reference: `docs/session_6_handoff.md`; ~4500 chars / 170 lines is the sweet spot.

9. **`kb/cpl_todos.json` — the dashboard To-Do feed, refreshed on EVERY checkpoint alongside the handoff (added Session 47).** It is the handoff distilled for the dashboard: ≤ ~12 layman-readable items split For Sam (curation) / For Fable (engineering, next session) + a one-paragraph "where we are" `_status`. Rendered by `cpl_todos.js` as the 📋 button on every tab. Bump `_as_of` (this resets viewers' per-browser check-offs — intended), DELETE items that got done (never leave them checked), refresh counts (queue sizes, collision counts) so the numbers match the tabs.

10. **`cpl_memory` (the live Supabase memory table) — auto-write this run's durable learnings (Phase 3, 2026-07-24).** Via the Supabase MCP, write the handful of durable + genuinely uncaptured learnings this run produced (a `fact`/`pitfall`/`decision`/`procedure`/`risk`/`question`/`opportunity`/`milestone`) — **no approval gate**. Own writes land **`status='proposed'`**; promote to `verified` only when corroborated (a committed KB-note/PR `source`, a 2nd session, or Sam's ✓). Supersede (don't delete) anything this run made false; log every write to `cpl_memory_log`; keep the table lean (don't dump a session log — that's what the handoff + the audit log are for). NOT a corpus sweep. Skippable on a light checkpoint that produced nothing durable. Full procedure + SQL: [`docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint.md`](docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint.md).

11. **`CPLBrain` (the Obsidian vault repo) — `07-session-notes/YYYY-MM-DD-<slug>.md`.** REQUIRED for any non-trivial session; skip only for one-line answers, simple lookups or chitchat. This is **MANDATORY in `CPLBrain/CLAUDE.md`'s own "Session Memory" section** and was unwired from this list until 2026-08-28 — the most recent note was **2026-08-09**, so the rule had not fired in 19 days. A rule that lives in one repo while the procedure people follow lives in another does not fire; that is the same failure as the stale INDEX instructions above. Use the frontmatter template in [`07-session-notes/README.md`](../../07-session-notes/README.md) (`type: session`, `date`, `topic`, `projects`, `tags`, `files_touched`, `status`) and write it from the VAULT's point of view — what a future session needs to know, not a commit log. **Also:** update `04-projects/<project>/SESSION-NOTES.md` when the run worked inside a `04-projects/` folder, and `07-session-notes/README.md` **only if the note convention itself changed** (same conditional shape as `kb/README.md` in step 2). ⚠️ **Do NOT touch `CPLBrain/README.md` or anything under `.claude/skills/`, `.claude/roles/`, `.kiro/`, `.gemini/` — those are upstream COG FRAMEWORK files maintained by `cog-update.sh` / `/update-cog`, not our content.** ⚠️ Commit on the session's designated `claude/*` branch in `CPLBrain` like any other repo. ⚠️ This is the VAULT, never the public KB — `cpl-knowledge-base` is still human-gated through its curation pipeline and checkpoint never writes there.

For each artifact, capture:
- (a) what's been learned this checkpoint
- (b) current state of the work
- (c) strategic roadmap (what's next, what's parked)
- (d) the next concrete step

Then commit all (however many actually changed) in **one commit** with a `Rule 8 checkpoint: <one-line summary>` subject. Include the docs-audit artifacts from step 0 and, if `--apply` ran, the stamped handoffs. The commit body MUST include a "KB notes added this run" section listing any new `docs/kb-notes/` entries (or "(none)" if nothing crossed the durability bar). Push to the current branch.

Before starting, briefly state what you're going to update and why — don't bombard with detailed plan, just one or two sentences. After committing + pushing, give a tight summary (which files changed, the new commit SHA, what the next session will pick up, and any new KB notes worth flagging (they'll already be in the vault via auto-sync, so no manual review queue).

If the user says "skip kb/README" or "skip README" etc., honor that; otherwise default is update-everything-that-needs-it. "Skip kb-notes" / "no candidates this run" is also fine — not every checkpoint produces durable learnings. The **pipeline viz (7)** is skippable only when the pipeline genuinely didn't move this run. The **next-session handoff (8) and the To-Do feed (9) are NOT skippable** — the handoff is the bricked-session / consolidation safeguard and the feed is its dashboard-facing distillation, so always write/refresh both even on a light checkpoint.
