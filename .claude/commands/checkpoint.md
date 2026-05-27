---
description: Rule 8 checkpoint — refresh every documentation artifact so the next session can pick up from markdown alone.
---

Execute a **Rule 8 checkpoint** (see `CLAUDE.md` Critical Rule 8). Pause whatever else you're doing and update **every** artifact below — none are optional, all sync to the user's Obsidian via the repo:

1. **`CLAUDE.md`** — refresh §11 (or whichever section covers the active workstream): tag counts / scores / roadmap-table status. Make sure the "DONE" / "in progress" / "parked" status on the roadmap reflects what's actually shipped on the branch.

2. **`kb/README.md`** — only if KB structure, generators, or audit artifacts have changed since the last checkpoint. Skip if nothing relevant changed.

3. **`README.md`** — only if a user-facing surface (dashboard, tab, filter, output file) has changed. Skip if internal-only changes.

4. **`docs/<topic>_lessons.md`** — **REQUIRED on every checkpoint.** If a lessons doc for the current workstream doesn't exist yet, create one with the Obsidian frontmatter format from `docs/coursecontrolnumber_remint.md` (title / date / tags / artifacts / related). If it exists, APPEND a new dated section capturing what's been learned since the last checkpoint.

5. **`docs/kb-notes/<topic>.md`** — **REVIEW + ADD candidates.** Ask: did this run produce a learning that is (a) durable beyond this workstream, (b) reusable by future sessions / peer colleges / auditors, (c) distilled (one concept), and (d) self-contained? If YES → author a new KB note in `docs/kb-notes/` using `docs/kb-notes/_template.md` with `kb-status: candidate`. Suggested types: `methodology`, `reference`, `adr`, `glossary`, `playbook`. If an existing candidate is now updated by this run, bump its `updated:` field and add a section. See `docs/kb-notes/README.md` for the lane contract.

6. **`docs/INDEX.md`** — refresh the auto-maintained landing page. Add any new KB-notes / lessons docs / handoff docs to the tables. Update the "last touched" column for lessons docs that grew this run.

For each artifact, capture:
- (a) what's been learned this checkpoint
- (b) current state of the work
- (c) strategic roadmap (what's next, what's parked)
- (d) the next concrete step

Then commit all (however many actually changed) in **one commit** with a `Rule 8 checkpoint: <one-line summary>` subject. The commit body MUST include a "KB candidates added this run" section listing any new `docs/kb-notes/` entries (or "(none)" if nothing crossed the durability bar). Push to the current branch.

Before starting, briefly state what you're going to update and why — don't bombard with detailed plan, just one or two sentences. After committing + pushing, give a tight summary (which files changed, the new commit SHA, what the next session will pick up, and any KB candidates the user should review in Obsidian).

If the user says "skip kb/README" or "skip README" etc., honor that; otherwise default is update-everything-that-needs-it. "Skip kb-notes" / "no candidates this run" is also fine — not every checkpoint produces durable learnings.
