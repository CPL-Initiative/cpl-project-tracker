---
title: "Decision sheets — how to build one, and how to read the replies"
created: 2026-09-09
updated: 2026-09-09
tags: [reference, governance]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
---

# Decision sheets

*Relocated from `CLAUDE.md` at the 2026-09-09 checkpoint. The RULE — that
decisions arrive as one numbered sheet — is PUSH and stays in `CLAUDE.md`.
These are the MECHANICS, which you read once you already know you are
building one.*

When judgments only
  Sam can make accumulate — in one lane or across many — build ONE numbered
  sheet (a First Light artifact, committed to `docs/visuals/` with a dated
  slug, handed over as a Claude artifact LINK — Pages prunes `docs/`, so a
  github.io URL to it 404s): per item, what it is in plain words, the measured context (from the
  maps and feeds, never guessed), a PROPOSED disposition with its draft
  reason, and reply-by-number verdicts (`yes · edit: … · fold: … ·
  dismiss: …`). **Every sheet carries reply chips** (S230:
  `python3 kb/_decision_sheet_replies.py --inject <sheet.html>`) — a verdict,
  a *Follow up* toggle and a note per item, saved to the artifact's own store
  (publish with `capabilities: {db: {}}`) which the session reads FIRST with the
  Artifact tool's `read_db` (collection `replies`); off the artifact, *Copy
  replies* builds the line. The session executes the verdicts and commits the reasons.
  This replaces asks scattered through chat and feed items parked for weeks;
  the To-Do feed POINTS at the live sheet, never substitutes for it. Worked
  example: `docs/visuals/2026-08-30-governance-fifteen-tables.html` —
  fifteen rulings in one sitting. Human-facing version:
  `docs/working_with_claude_code.md` §11.

## Reading the replies (added 2026-09-09)

The session reads the verdicts FIRST, with the Artifact tool's `read_db` on
collection `replies` — one document per item, carrying `v` (the verdict chip),
`note` (free text), `fu` (the Follow up flag) and a timestamp.

⚠️ **An item with no reply document has NO verdict.** It is not a silent yes.
On 2026-09-09 a nine-item sheet came back with seven documents; items 1 and 2 —
the two largest sweeps on the sheet — had simply not been answered, and reading
"decisions done" as covering all nine would have swept 21 sites unauthorized.
Ask about the gaps in one line and execute the rest.

⚠️ **A verdict of `edit` carries the wording in `note` — use it verbatim.**
Two of that sheet's items came back as `edit` with Sam's own replacement
sentences; his words go in as written, not paraphrased into the proposal they
replaced.

⚠️ **Re-measure at execution; do not trust the sheet's own counts.** The same
sheet said 15 sites carried a banned word (14 by the time the item ran, because
an earlier item had absorbed one) and nine sections on a page that has seven.
Both numbers were right when written and stale when executed.
