---
title: A decision sheet takes its replies on the page, and the session reads them from the store
created: 2026-09-05
updated: 2026-09-05
tags: [playbook, decision-sheet, governance, artifacts, memory]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_memory_tab_lessons]]"
  - "[[docs/kb-notes/methodology-a-generator-that-lags-its-output-is-a-trap]]"
  - "[[docs/kb-notes/methodology-a-stores-echo-is-not-your-state]]"
artifacts:
  - kb/_decision_sheet_replies.py
  - tests/decision_sheet_replies.test.js
  - docs/visuals/2026-09-05-memory-audit-verdicts.html
---

# A decision sheet takes its replies on the page, and the session reads them from the store

> **One-sentence summary** — Every decision sheet carries reply chips, a follow-up toggle and a note under each item; on the artifact they save to the sheet's own store, which the next session reads with `read_db`, and anywhere else *Copy replies* builds the numbered line.

## Context

Decision sheets (Sam, 2026-08-30: *"I'd like to handle all my current and
future decisions this way"*) asked for replies by number in chat. On
2026-09-05 he asked for the replies on the sheet itself: *"add decision chips
on each memory decision sheet item so I can record my responses for you and
add any clarifying notes needed. Some of the unfinished memories are important
to follow up on and I don't want to leave them hanging while I'm in the
decision flow."* This note is the mechanism, so the next sheet has it without
re-deriving it.

## The claim

1. **Every item gets the same three things — and so does every memory a
   batch item lists.** A verdict chip (Yes always means *take the
   recommendation*; the other words are the ones the sheet's how-to box
   accepts — Keep · Retire · Edit · Later — plus any item-specific option the
   ask names, such as *Older only* or *Undo*), a **Follow up** toggle that is
   independent of the verdict, and a free-text note. A pressed chip clears on
   a second press. Every control is a word. A memory inside a batch gets a
   compact block of its own, id `<item>.<reference>`, with chips read off the
   batch's ask, and there the first chip NAMES the batch's action — **Verify**
   under a verify batch, **Retire** under a retire batch — never Yes: a
   memory's title is often itself a claim (*Keep the $1 million noncredit
   funding…*), and a Yes beneath it reads both ways (Sam, 2026-09-05: *"unclear
   if I am saying Yes to Keep $1M NC funding… Or… Yes that it is no longer
   true"*). Hold out and Rewrite keep one memory back from a verify batch,
   Keep holds one back from a retire batch; an entry reply overrides the batch
   for that one memory. A reply saved before the relabel carries `v: "yes"`
   on an entry: read it as the batch's recommendation for that memory.
2. **The store is the artifact's own.** Publish with `capabilities: {db: {}}`.
   The page writes `replies/<item>` documents — `{item, ref, v, note, fu, t,
   kind, parent}` — where `ref` is what the session needs to act (a slug, an
   id, a class key), `kind` is item / entry / done, `parent` the batch an entry
   belongs to, and `t` the write time (last write wins). The session reads them with
   the Artifact tool: `read_db`, `db_op: list`, collection `replies`. Sessions
   read; they never write a reply. ⚠️ **The page never keeps the store's
   object.** A snapshot body is frozen, so the script copies it before it
   becomes state and copies its own state before a write
   ([[docs/kb-notes/methodology-a-stores-echo-is-not-your-state]]); the line
   under each reply names what was saved, in words — *Saved to the sheet:
   Retire, follow up.* — so a click that did not land is visible as words,
   not only as a color.
3. **No store, no loss.** Opened from the repo or the vault (`docs/visuals/` is
   pruned from the public site), the replies stay in that browser and the bar
   at the foot builds the numbered line — `3 yes · 4 keep, follow up — "…"` —
   for a paste. The words are identical either way, so the session's executor
   reads one vocabulary.
4. **Add it as a pass, at source or after.** `python3
   kb/_decision_sheet_replies.py --inject <sheet.html>` puts the controls on a
   finished sheet (idempotent: markers strip the previous injection); a
   builder that wants them at source imports `replies_block()`. Chip sets
   follow the section: the one large call, class rulings, groups replaced by a
   newer ruling, single items, retired rows.

## How we got here

The first sheet with replies is the 2026-09-05 memory audit sheet (43 items,
31 retired rows). Its builder turned out to predate the sheet, so the controls
went on as a pass over the HTML rather than a builder change; a Chromium drive
confirmed a chip presses and clears, a note survives a reload, the bar counts,
and nothing scrolls sideways on a phone. `read_db` on the freshly published
artifact answered empty, which is the store existing. The artifact service
refused the session's wake subscription (a session credential is required), so
a reply wakes nobody: the next session reads the store on arrival, first.

An hour after the sheet went out, Sam's clicks found two things the drive had
not. A Follow up pressed after a verdict did not turn blue yet the page said
it was saved: the store had echoed the first write back as a frozen body, the
script had adopted that body as state, and every later assignment into it was
silently ignored — the store showed memories with two to six writes all
carrying the first write's timestamp. And under *Keep the $1 million
noncredit funding…* a Yes could mean either the sentence or the verdict on it.
Both were fixed the same day; the guard, `tests/decision_sheet_replies.test.js`,
runs the committed sheet against a store stub that freezes what it delivers.

## When this applies (and when it doesn't)

Any sheet handed to Sam or a teammate as an artifact link. Not for a chat
table or a one-off export — those are snapshots, and the reply line is enough.
The store is organization-internal by the capability's own contract, which is
right for a sheet and wrong for anything public.

## See also

- `[[docs/cobi_memory_tab_lessons]]` — the 2026-09-05 section
- `[[docs/working_with_claude_code]]` §11 — the human-facing version
- `kb/governance_surface_map.json` — the reply store is dismissed there, with the reason

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
