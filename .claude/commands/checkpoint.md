---
description: Rule 9 checkpoint — refresh every documentation artifact so the next session can pick up from markdown alone.
---

Execute a **Rule 9 checkpoint** (see `CLAUDE.md` Critical Rule 9; the memory-row ingest half of it rides Critical Rule 8). Pause whatever else you're doing and update **every** artifact below — none are optional, all sync to the user's Obsidian via the repo:

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

9. **The UI pass: one view per checkpoint (Sam, 2026-10-08; it replaces the To-Do feed, retired the same day).** *"pick one COBI surface to prioritize an UI audit and fix to ensure it's wired to all dependent surfaces, maintains AA, is mobile friendly, and is First Light formatted."* Run **`python3 scripts/ui_pass.py --next`**: it names the view from `kb/ui_pass_ledger.json` (never audited before audited, a public page before a COBI tab, then the oldest pass; a view on hold is skipped). Audit it with [`/a11y-pass`](a11y-pass.md) on that view, including its two pass checks: **wiring** (`python3 scripts/ui_pass.py --wiring <id>` lists each dataset the view reads and the other views reading it; open them and confirm the shared figures agree on screen) and **First Light** (tokens only, no raw hex, the theme's type, light and dark). A small fix ships in its own PR this session; a larger one becomes a lane item or a sheet card. Then **`python3 scripts/ui_pass.py --record <id> "<what it found and fixed, in a sentence>"`** and commit the ledger with the checkpoint. **Skip it** on an emergency checkpoint (Rule 9a) or when the run has no room for a fix PR; say so in the handoff, and the ledger keeps the view due. CI's `--check` fails when a tab joins the nav and the ledger lacks it (`--sync` adds it).

10. **`cpl_memory` (the live Supabase memory table) — auto-write this run's durable learnings (Phase 3, 2026-07-24).** Via the Supabase MCP, write the handful of durable + genuinely uncaptured learnings this run produced (a `fact`/`pitfall`/`decision`/`procedure`/`risk`/`question`/`opportunity`/`milestone`) — **no approval gate**. Own writes land **`status='proposed'`**; promote to `verified` only when corroborated (a committed KB-note/PR `source`, a 2nd session, or Sam's ✓). Supersede (don't delete) anything this run made false; log every write to `cpl_memory_log`; keep the table lean (don't dump a session log — that's what the handoff + the audit log are for). NOT a corpus sweep. Skippable on a light checkpoint that produced nothing durable. Full procedure + SQL: [`docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint.md`](docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint.md).

11. **`CPLBrain` (the Obsidian vault repo) — `07-session-notes/YYYY-MM-DD-<slug>.md`.** REQUIRED for any non-trivial session; skip only for one-line answers, simple lookups or chitchat. This is **required by `CPLBrain/CLAUDE.md`'s own "Session Memory" section** and was unwired from this list until 2026-08-28 — the most recent note was **2026-08-09**, so the rule had not fired in 19 days. A rule that lives in one repo while the procedure people follow lives in another does not fire; that is the same failure as the stale INDEX instructions above. Use the frontmatter template in [`07-session-notes/README.md`](../../07-session-notes/README.md) (`type: session`, `date`, `topic`, `projects`, `tags`, `files_touched`, `status`) and write it from the VAULT's point of view — what a future session needs to know, not a commit log. **Also:** update `04-projects/<project>/SESSION-NOTES.md` when the run worked inside a `04-projects/` folder, and `07-session-notes/README.md` **only if the note convention itself changed** (same conditional shape as `kb/README.md` in step 2). ⚠️ **Do NOT touch `CPLBrain/README.md`, `.claude/roles/`, `.kiro/`, `.gemini/`, or a skill under `.claude/skills/` that `cog-update.sh` names in `FRAMEWORK_FILES` — those are upstream COG FRAMEWORK files maintained by `cog-update.sh` / `/update-cog`.** Record a gap found in one of those skills in the session note instead. The vault's own skills, the ones that list does not name, are ours: fix a gap in place under the vault's Skill Self-Improvement rule (Sam, 2026-09-27, CLAUDE.md Cleanup sheet card 8). ⚠️ Commit on the session's designated `claude/*` branch in `CPLBrain` like any other repo. ⚠️ This is the VAULT, never the public KB — `cpl-knowledge-base` is still human-gated through its curation pipeline and checkpoint never writes there.

12. **`kb/queue_status.json` — the Progress view's status file, refreshed on EVERY checkpoint (added S343).** The Program Requirements tab's Progress view reads the harvest's tables live; this file carries what no anon read can know. Write: `session`, `moniker`, `run` (*Sam's session* or *the CPL Queue routine*), `handoff` (the `session_<N+1>_handoff.md` this checkpoint writes), `unchecked` (one row per record a person has not checked, from `select college, program_title, control_number, loaded_at from program_requirement_records where not checked`), `next_step` (the handoff's first priority, in a title and a sentence), `calls` (each item waiting on Sam, with what happens on no reply), `notes` (a foot line for any part the tables cannot describe, keyed by the part ids in `PARTS`), and `changes` (what this run changed, each with its UTC time). Read the headline's pair (Sam, 2026-10-08, for the Chancellor) with `select (select count(*) from coci_college_programs where status = 'Active'), (select count(*) from program_requirement_records where checked), (select count(distinct college) from program_requirement_records where checked)`. Then read the CPL Queue routine's `next_run_at` with `get_trigger` (`trig_01L8K64ZKYb5eALdT4HW6NAV`) and run **`python3 scripts/queue_status.py --stamp --next-run <next_run_at> --headline <active> <checked> <colleges>`**: it sets `written_at` from the clock, records today's pair in `headline` (one entry per day, so the pair has a trend), and validates the file. Plain words, no glyphs or markdown; the script refuses both.

For each artifact, capture:
- (a) what's been learned this checkpoint
- (b) current state of the work
- (c) strategic roadmap (what's next, what's parked)
- (d) the next concrete step

Then commit all (however many actually changed) in **one commit** with a `Rule 9 checkpoint: <one-line summary>` subject (history before S210 says `Rule 8 checkpoint:` — the same ritual under the pre-split numbering; do not "fix" old commits). Include the docs-audit artifacts from step 0 and, if `--apply` ran, the stamped handoffs. The commit body MUST include a "KB notes added this run" section listing any new `docs/kb-notes/` entries (or "(none)" if nothing crossed the durability bar). Push to the current branch.

Before starting, briefly state what you're going to update and why — don't bombard with detailed plan, just one or two sentences. After committing + pushing, give a tight summary (which files changed, the new commit SHA, what the next session will pick up, and any new KB notes worth flagging (they'll already be in the vault via auto-sync, so no manual review queue).

If the user says "skip kb/README" or "skip README" etc., honor that; otherwise default is update-everything-that-needs-it. "Skip kb-notes" / "no candidates this run" is also fine — not every checkpoint produces durable learnings. The **pipeline viz (7)** is skippable only when the pipeline genuinely didn't move this run. The **next-session handoff (8) is NOT skippable**: it is the bricked-session / consolidation safeguard, so always write it, even on a light checkpoint. The **UI pass (9)** is skippable on an emergency checkpoint or a run with no room for a fix PR; the ledger then keeps the view due.
