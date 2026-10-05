---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-10-05
tags: [reference, roadmap-lane, library, drive, deliverables]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Library / where decks, films and documents live

**What this lane is:** one COBI tab that lists every deck, film, spreadsheet and
document the CPL Initiative makes, with a link to where the file lives, who it is
for, and the source that rebuilds it. And the rule behind it: **the files live in
the team Drive; the repos keep only the source.**

## Status

✅ **The tab is built** (`library.js`, under *Sierra & Team Tools*; the side
session beside S336, 2026-10-05). It reads `cpl_library` live behind the team
phrase and seeds twelve real pieces across nine occasions
(`kb/receipts/cpl_library_seed_2026-10-05.sql`, cohort
`library-seed-skyshelf@bot`). Needs attention is computed from each record:
**not filed** (no link anywhere a session can reach), **a public file with no
audience set** (in the public tracker repo and Sam has not said who it is for),
and **figures to refresh**. Add, File it, Edit and Retire write to the table;
nothing deletes, and a trigger files every prior row in `cpl_library_history`.
Approved mockup: https://claude.ai/artifact/VPpbDp7DD4acvHErVFkCqH.
Schema: `kb/supabase_cpl_library.sql`. Test: `tests/library.test.js`.

## Sam's rulings (2026-10-05, all in `cpl_memory`)

His ask: *"I think I may need a COBI tab to store and retrieve artifacts like this
ppt and video. Advise"*. Then, by number:

1. **Build the tab.**
2. **Drive is the home for approved files.** He named
   [the folder](https://drive.google.com/drive/folders/1WNtaaKMGSYsKsdJLxi4fbR24fXD4fGUZ)
   and made **CPLLibrary** inside it
   ([13WnIL1j…](https://drive.google.com/drive/folders/13WnIL1j-Qo3CJ5znVFZhs5wmAjJqOxxN));
   the tab links there.
3. **Drafts stop going into the public tracker repo**, and the ones there come off main.
4. *"I think all artifacts like this created on this account should go to the
   Drive instead of the repos"* — **drafts go to Drive too**, in
   [CPLLibrary/Drafts](https://drive.google.com/drive/folders/15eXeJb9OIl1nOFE4Tykr1y7rBGKBUvih)
   (created 2026-10-05), in place of private Claude players.
5. **Move the files already in the repos to Drive**: the public tracker first,
   then the vault.
6. **The manual hand-off now**; an automatic upload only if it grates.

## How a file reaches Drive

- **A session on Sam's machine (Cowork):** save into the Drive-synced folder.
- **A cloud session:** it cannot. The proxy rejects Google's upload host and
  `*.supabase.co` (measured 2026-10-05), and the Drive connector takes content
  inline, which is impractical past a few KB of base64. The session sends Sam the
  file (SendUserFile), he drops it in CPLLibrary or Drafts, and the session finds
  it with the Drive connector (`search_files` by title and `parentId`) and files
  the link with **File it** or a guarded update.
- **Automatic upload (call 6, deferred):** a workflow that builds from source and
  uploads with a stored Google sign-in for the camapinitiative account. A Google
  service account likely cannot own files in a personal Gmail Drive, so it would
  need the account's own OAuth refresh token as a secret. Not built.

**What stays in a repo:** build scripts, specs, narration text and voice clips (a
library voice can be withdrawn), the vault's companion notes, and a film a public
page plays (the funding explainer's cuts stay where Pages serves them). Pipeline
outputs (`reports/*.docx`) and source documents under `docs/reference/` are
inputs, not deliverables. Claude artifacts (decision sheets, mockups) stay on
claude.ai.

## Next

- **Sharing (Sam's call, not a session's):** CPLLibrary is shared with its owner
  alone, so a teammate who opens a Library link to it is refused until Sam shares
  the folder.
- **PR 2, the move (call 5):** the tracker's deliverable binaries go to Sam for
  Drive, then their rows point at Drive and the files leave main, with a guard test
  so a deliverable binary cannot be committed again. Tracker first: the BOG and CBO
  decks, the CAC run sheet, the five Title 5 tracked-changes documents, the two
  Noncredit Summit cuts. Then the vault's binaries (29 on 2026-10-05).
- **Start a piece (Sam's wish, 2026-10-05):** *"would be nice to use the tab to
  start the dev process for new artifacts too--ppts, spreadsheets, explainer
  vids..."* — a brief form that saves a Requested record (kind incl. spreadsheet,
  needed-by, audience, what it must say, sources), a Copy the brief button that
  gives the whole paste for a new session, and the daily routine picking up
  Requested briefs. Mock it first; it needs `spreadsheet` as a kind, `requested`
  as a status, and `brief` / `needed_by` columns.
- The two Noncredit Summit pieces carry *Refresh figures* until the week of the
  summit; the deck itself is not filed anywhere a session can reach.
