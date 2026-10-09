---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-10-09
tags: [reference, roadmap-lane, library, drive, deliverables]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Library / where decks, films and documents live

**What this lane is:** one COBI tab that lists every deck, film, spreadsheet and
document the CPL Initiative makes, with a link to where the file lives, who it is
for, and the source that rebuilds it. And the rule behind it: **the files live in a
CPLLibrary folder on the MAP team's SharePoint site; the repos keep only the source.**

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

✅ **Start a piece is built** (2026-10-06, as mockup version 2 shows it). The brief form
(kind, now including spreadsheet; working title; occasion; needed by; for; what it must
say; sources; length or template) saves a record with status `requested` and the brief in
one `brief` jsonb column (migration `cpl_library_start_a_piece`). **In development** sits
above the register and holds every Requested record, and every briefed record still at
Draft, at its step of four (Requested, Draft, Approved, Presented). Approval moves a piece
into the register. A Requested record never counts as Not filed, because it has nothing to
file yet. *Copy the brief* gives the whole paste for a new session: the ask, the
`scripts/library_file.py` command for that record, and what a good result looks like.
Sam's routine reads Requested records as queue items (step 6 of *At the start* in
[`scheduled_sessions`](../scheduled_sessions.md)). The versions table shows the time
each version was filed (`filed_at`, call 8).

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

## How a file reaches the SharePoint folder (Sam, Open Asks Sheet 49, 2026-10-08)

The folder is **CPLLibrary** on the MAP team's SharePoint site (`studentrcc.sharepoint.com`, site
*MilitaryArticulationPlatform*, Shared Documents/CCCCO/AI/CPLLibrary), drafts in a Drafts folder inside it;
`LIBRARY_FOLDER` in `library.js` carries the link. Sam made it, the whole team can open it, and guests from
outside RCCD are allowed (cards 1 and 2).

- **By hand, now (card 3):** a cloud session sends Sam the file, he drops it in, and the link is filed with
  **File it**. The brief's paste says so.
- **Through his OneDrive sync, now:** a Cowork session on Sam's computer saves into the synced folder.
- **Automatic, later:** *"For now by hand and sync but later automatically so we avoid creating different artifact
  storage solutions."* The later upload goes to this same folder: a Microsoft app RCCD IT approves for the one
  site, three saved values, `graph.microsoft.com` added to the environment's allowed domains (refused today,
  CONNECT 403, measured 2026-10-08), and a filer for Microsoft Graph. The Drive filer (`scripts/library_file.py`,
  [`library_filer`](../library_filer.md)) is parked; its Google sign-in was never completed.
- **Reading the folder:** a session reaches it only through the Microsoft 365 connector (claude.ai connectors,
  connected by Sam with his RCCD account; read and search, no upload). This environment's network refuses
  `studentrcc.sharepoint.com` too.
- **The tab:** a SharePoint link files under the stored home `drive` (the `cpl_library_home_ck` value for the
  team's file home, so no schema change) and reads *Team SharePoint*; a record still linking Google Drive reads
  *Google Drive* (`homeOf`). Guarded by `tests/library.test.js` (7).

**What stays in a repo:** build scripts, specs, narration text and voice clips (a
library voice can be withdrawn), the vault's companion notes, and a film a public
page plays (the funding explainer's cuts stay where Pages serves them). Pipeline
outputs (`reports/*.docx`) and source documents under `docs/reference/` are
inputs, not deliverables. Claude artifacts (decision sheets, mockups) stay on
claude.ai.

## Filed in Drive so far

- **The Noncredit Summit CPL slides, draft 2** (CPLLibrary/Drafts, 2026-10-06): Sam dropped the file in
  by hand (2,039,321 bytes, matching the build), and the record links it as v2 with the CPLBrain build
  script as its source (receipt `kb/receipts/library_filed/2026-10-06_noncredit-summit-cpl-slides__…sql`,
  #1889). ⚠️ **`apply_migration` timed out four times from that session without writing** (no row, no
  migration recorded), and the `execute_sql` guard refuses `UPDATE`, so **Sam ran the receipt in the
  Supabase SQL editor**. That is the fallback when the migration path stalls; read the row back after.
- **Both Summit film cuts, v1** (2026-10-06, by Sam by hand): the narrated cut in **CPLLibrary**, the music
  cut in **CPLLibrary/Drafts**. Their record still links the GitHub copies.
- **Both Summit film cuts, v2** (S339, 2026-10-06): sent to Sam in chat for **Drafts**
  (`20261005_Noncredit_Summit_in_Motion_v2.mp4`, 10,048,927 bytes; `..._Narrated_v2.mp4`, 17,230,551 bytes). They are
  never committed: `.gitignore` keeps v2+ film MP4s out and the page test asks git (#1891). The record
  `noncredit-summit-in-motion` still needs its v2 rows once Sam confirms the files are in Drafts.
- **The five Title 5 tracked-changes documents** (CPLLibrary, 2026-10-05): uploaded by the session
  through the Drive connector, each at its exact byte size; the record links v5 and lists all five
  (receipt `kb/receipts/cpl_library_drive_t5_2026-10-05.sql`, guarded; the history trigger holds the
  before-row). Files keep their own date codes (the vault convention). Sam asked for titles that
  start with *"our date code 20261005"*; if he means the filing date for every file, a Drive rename
  keeps each link.
- **What a session can upload:** through the Drive connector, a file up to roughly 50 KB (it travels as
  base64 inside the tool call, and Drive reports no checksum there). The filer has no size limit and
  checks md5, once Sam's sign-in is set.

## Sam's calls 7-9 (2026-10-05, "7, 8,9 Y")

7. **Build the automatic filer** (built 2026-10-06 for Drive; **parked 2026-10-08**, when the Library moved to
   SharePoint and Sam set the automatic upload for later, into the same folder). A session files each piece to Drive the moment it makes it,
   films included, and writes the Library record in the same step. Setup is Sam's once: a Google
   Cloud project with the Drive API on, an OAuth client, one consent as camapinitiative, and three
   environment secrets (`GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`,
   `GOOGLE_DRIVE_REFRESH_TOKEN`; read `read_documentation` topic `environment.secrets` and walk him
   through it). Check first whether the `drive.file` scope may write into CPLLibrary, a folder the
   app did not create; if not, use the full Drive scope. Then `scripts/library_file.py <path>`:
   resumable upload to CPLLibrary or Drafts, the Drive link back, the Library row written.
8. **Versions are separate files.** Each edit uploads `<date code>_<name>_vN`, keeping the original
   date code; the record's version list gains a row with the time filed. Never rely on Drive's own
   revision history, which drops versions after 30 days unless pinned.
9. **Decision sheets** stay Claude pages (the reply buttons need the artifact store). Each gets a
   Library record (kind document, occasion "Open asks") linking its artifact, with no Drive copy.
   Their sources leave the public tracker repo for the private vault repo. **Done for the
   open-asks sheets (2026-10-06):** the 47 sheets, their builder, its guard and the mechanics doc
   live in `CPLBrain/decision-sheets/` (samueltlee/CPLBrain#255). The builder reads the lanes and
   the reply-chip module from the tracker clone beside the vault, and rebuilt sheet 44
   byte-identical from there. Its coverage check runs in `scripts/check_generated.sh`, which finds
   the vault beside the tracker, and in the vault's own CI; the tracker's CI cannot read the
   vault. The vault's chatbox indexer skips `decision-sheets/`. Git history keeps the old copies
   (no rewrite, Rule 5). **Still open:** the other decision sheets in `docs/visuals/` (36 carry
   reply chips, and some of the 11 others are early sheets), with their builders in `kb/`
   and the template tests that read them; and a Library record per sheet linking its artifact.

## Next

- **The open-asks series record reads version 56 (Sam pasted it, 03:18Z 2026-10-09, "success").** It sits at sheet
  56's link with sheets 55 to 50 before it, 29 versions, Sheet 56 first and Current (read back by S350; receipt
  `kb/receipts/cpl_library_open_asks_sheet56_2026-10-09_s350.sql`). `apply_migration` times out on `cpl_library` and on
  no other table (five times through S349), so this table's writes go to Sam as a paste, one receipt that reaches the
  new version from any earlier state the record could be in.
- **PR 2, the move (call 5):** once a session with the Microsoft 365 connector has read the SharePoint copies,
  each record points at its SharePoint link (a guarded update per record). Then remove the deliverable binaries from main (the five Title 5 files can go now; `.gitignore`
  `exports/*.docx`, and `kb/_build_55050_redline_docx.py` still writes there), take the Summit film's
  two player pages off the site, and add a guard test so a deliverable binary cannot be committed
  again. Then the vault's binaries (29 on 2026-10-05).
- **Sam's sheet 47 calls (2026-10-07 14:17-14:20Z):** card 3 *Shared*, which he withdrew the same day (below); card 4 *Move them* (every decision-sheet builder writes to the vault, and the public repo holds no sheet); card 5 *One per series*, as proposed (the open-asks series is one Library record, each other sheet one record under its own occasion); card 6 *Date made* (nothing changes: a file keeps the date code of its first version). Card 4 is open work: 13 builders in `kb/`, their sheets and 18 hand-made ones in `docs/visuals/` (31 carry reply chips), and the template tests that read two real sheets, which need fixtures first.
- **Sam's sheet 48 card 1 (2026-10-07 14:52Z): *Keep it public*.** The Library records the Ironworker film's audience as Public (receipt `kb/receipts/cpl_library_ironworker_public_2026-10-07_s341.sql`); the page and the film stay.
- **Sam, 2026-10-07 (in chat): CPLLibrary is not shared.** *"Let's give up on sharing the Drive because so many on
  team do not have google accounts. May need to switch to sharepoint, where they all have access."* This closes sheet 48
  card 2 and withdraws sheet 47 card 3. The Drive connector's `share_file` refused every try (S341, 10 of his 19
  addresses; a side session the same evening, one more with his explicit go): *invalid argument*, or *the caller does
  not have permission* for three. The connector has no way to send the invitation, which an address without a Google
  account needs (the likely cause, unconfirmed).
- **Sam's Open Asks Sheet 49 (2026-10-08 15:23-15:25Z, all three his own call):** 1 *I create it*: the
  CPLLibrary folder on the MAP team's SharePoint site (link in `cpl_memory`
  `sam-cpllibrary-sharepoint-folder-2026-10-08`); 2 *Guests allowed*; 3 *Hand and sync*, with his note *"For now by
  hand and sync but later automatically so we avoid creating different artifact storage solutions."* He copied the
  16 Drive files into the folder himself (2026-10-08); no session has read them yet.
- **Next for this lane:** Sam connects the Microsoft 365 connector; the next session after that reads the folder,
  confirms the 16 copies, and moves the three Drive-linked records (and the six repo pieces) to their SharePoint
  links. The Summit film's v2 cuts go into the SharePoint Drafts folder.
