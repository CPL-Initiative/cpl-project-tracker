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

## Filed in Drive so far

- **The five Title 5 tracked-changes documents** (CPLLibrary, 2026-10-05): uploaded by the session
  through the Drive connector, each at its exact byte size; the record links v5 and lists all five
  (receipt `kb/receipts/cpl_library_drive_t5_2026-10-05.sql`, guarded; the history trigger holds the
  before-row). Files keep their own date codes (the vault convention). Sam asked for titles that
  start with *"our date code 20261005"*; if he means the filing date for every file, a Drive rename
  keeps each link.
- **What a session can upload:** a file up to roughly 50 KB. The file travels as base64 inside the
  tool call, and Drive reports no checksum, so size is the check. The decks (43 and 200 KB), the CAC
  run sheet (155 KB) and the films (8 to 16 MB) go by hand: Sam drops them in, the session files the
  link.

## Next

- **Start a piece (Sam, 2026-10-05: *"Mockup looks great. Let's go with it."*).** Build it as
  mockup version 2 shows: a brief form (kind including spreadsheet, working title, occasion, needed
  by, for, what it must say, sources, length or template) that saves a Requested record; *Copy the
  brief* (the whole paste for a new session, ending in what a good result looks like); an *In
  development* section above the register with the four steps Requested, Draft, Approved, Presented.
  Schema: add `spreadsheet` to the kind check, `requested` to the status check, and brief columns
  (or one `brief` jsonb), with explicit grants. The daily routine picks up Requested briefs through a
  step in `docs/reference/scheduled_sessions.md`; never edit the trigger itself. Drafts go to
  CPLLibrary/Drafts.
- **PR 2, the move (call 5):** when Sam has dropped in the BOG and CBO decks, the CAC run sheet, the
  Ironworker film and the two Noncredit Summit cuts, point their records at Drive (guarded update,
  receipt), remove the deliverable binaries from main (the five Title 5 files can go now; `.gitignore`
  `exports/*.docx`, and `kb/_build_55050_redline_docx.py` still writes there), take the Summit film's
  two player pages off the site, and add a guard test so a deliverable binary cannot be committed
  again. Then the vault's binaries (29 on 2026-10-05).
- **Open with Sam:** whether the Ironworker player page stays public; sharing CPLLibrary with the
  team (owner-only today).
