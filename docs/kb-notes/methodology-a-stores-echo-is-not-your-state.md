---
title: A store's echo is not your state — clone what a snapshot delivers
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, artifacts, db, pitfall, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/playbook-decision-sheet-replies]]"
  - "[[docs/cobi_memory_tab_lessons]]"
artifacts:
  - kb/_decision_sheet_replies.py
  - tests/decision_sheet_replies.test.js
---

# A store's echo is not your state — clone what a snapshot delivers

> **One-sentence summary** — A shared store hands a page frozen copies of what
> it holds; a page that keeps one of those copies as its working state loses
> every later edit silently, and the only trace is in the data: many versions
> of a document, all carrying one timestamp.

## Context

The decision sheet's reply controls save each reply to the artifact's own
store and subscribe to the collection, so a second browser sees the first
one's replies. The store's contract says, in one clause, *"delivered
snapshots and their `data()` are frozen … clone a body before editing it for
a write."* The first version of the script did not, and the sheet shipped
with a Chromium drive that pressed one chip, reloaded, and read it back —
one write per item, never a second edit after the echo of the first.

## The claim

1. **A snapshot body is the store's object, not yours.** It is frozen, and
   the same object comes back on every delivery until the document changes.
   Adopting it as state (`state[id] = doc.data()`) is the mistake; the harm
   arrives on the *next* edit.
2. **The failure is silent by default.** Outside strict mode, assigning to a
   property of a frozen object is a no-op, not an error. The page paints
   from state, state did not change, so the click paints nothing; the save
   then writes the unchanged body, resolves, and reports success. Sam's
   words for it: *"it doesn't turn blue but does say response was saved."*
3. **The signature lives in the data.** Every write after the echo carries
   the first write's `t`, so the store shows documents at version 2, 3, 6
   with one timestamp. A session that reads the store can see the bug
   before anyone describes it.
4. **The fix is a copy in each direction, and words.** Copy the body on the
   way in (`state[id] = copy(doc.data())`), copy your own state on the way
   out (`doc.set(copy(state[id]))`), and put the script in strict mode so a
   write into a frozen object throws instead of passing. Then make the
   saved state legible as words — *Saved to the sheet: Retire, follow up.* —
   so a click that did not land is visible without a color.
5. **Guard it with a store that freezes.** The jsdom test hands the page a
   stub whose snapshots are `Object.freeze`d, saves once, lets the echo land,
   clicks again, and expects both the pressed state and a second, newer
   write. A stub that hands back plain objects would have passed the broken
   script.

## How we got here

An hour after the memory audit sheet went out with reply controls
(2026-09-05), Sam pressed Yes and then Follow up on the Board-amendment
memory. The flag never painted; the store held the item at version 1 with
the flag false, and five other memories at versions 2 to 6 with a single
`t` each. The contract clause was in the type definitions the whole time; the
drive that verified the feature never edited an item twice.

## When this applies (and when it doesn't)

Any page that both writes to and subscribes to a shared store — the
artifact `db`, a Supabase realtime channel, anything that echoes writes back.
It does not apply to a page that only reads, or to a page that re-renders
the whole document from a snapshot without holding it (the `artifact`
capability's republish model). The general form is older than this store:
**a class toggle is not a re-render, and an echoed object is not your
state** — both are places where the screen and the truth part company
without an error.

## See also

- `[[docs/kb-notes/playbook-decision-sheet-replies]]` — the controls this was found in
- `[[docs/cobi_memory_tab_lessons]]` — the 2026-09-05 section, the hour after
- `tests/decision_sheet_replies.test.js` — the guard

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
