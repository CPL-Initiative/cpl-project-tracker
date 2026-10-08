---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-10-08
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

## How a file reaches Drive

- **A session on Sam's machine (Cowork):** save into the Drive-synced folder.
- **A cloud session, through the Drive connector:** a file up to roughly 50 KB (it travels as
  base64 inside the tool call). Anything larger: Sam drops it in, and the session finds it with the
  connector (`search_files` by title and `parentId`) and files the link with **File it**.
- **The filer, `scripts/library_file.py` (call 7, built 2026-10-06):** any session, any file size,
  films included. It does a resumable upload to CPLLibrary or Drafts, checks size and md5, and writes
  a receipt guarded on the Drive file id, applied as a named migration. It never deletes or
  overwrites. Each edit is its own `<date code>_<name>_vN` file (call 8). Usage, setup and failure
  modes: [`library_filer`](../library_filer.md). **Sam's Google sign-in is set (2026-10-06):** the
  OAuth app *CPL Library filer* is **In production** (publishing needed a home page, the privacy page
  `privacy.html` (#1887) and the authorized domain `cpl-initiative.github.io`), and the three
  environment variables hold real values. Only a session started after ~18:45Z reads them; the
  first `--check` has not run yet. The proxy lets the shell reach
  `oauth2.googleapis.com`, `www.googleapis.com/drive/v3` and `/upload` (measured 2026-10-05 and
  2026-10-06), and rejects `*.supabase.co`, which is why the receipt goes through the MCP.
- **Scope (checked 2026-10-06):** Google's narrow `drive.file` scope may write only into folders
  the app itself created, and Sam made CPLLibrary by hand, so the sign-in uses the full Drive scope.
  The filer fences itself to the two folders.

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

7. **Build the automatic filer** (✅ built 2026-10-06; waits on the sign-in). A session files each piece to Drive the moment it makes it,
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

- ⚠️ **The sign-in is NOT set yet (S339, 2026-10-06):** `--check` answers `invalid_client`, and the three saved
  values measure 43 / 19 / 14 characters (shape checks pass: `.apps.googleusercontent.com`, `GOCSPX-`, `1//`), where
  real ones run about 72 / 35 / 100+. They look truncated; Sam re-saves the full values, and a new session runs
  `--check` again. Never print a value or ask for one in chat.
- **First, in a new session, the end-to-end test** (once the sign-in is set): `python3 scripts/library_file.py --check`;
  file a small test document with `--new --title "Filer test" --kind document` to Drafts; apply the
  receipt under the migration name it prints; see it in the Library; retire the test record (Retire,
  never delete).
- **Then the six files, each with `--move` (their names and records stay as they are):**

  ```
  python3 scripts/library_file.py presentations/20260716_CPL_Initiative_BOG_Update.pptx --slug update-to-the-board-of-governors-2026-07 --move --to library
  python3 scripts/library_file.py presentations/20260720_CPL_CBO_Implementation_Funding.pptx --slug standing-up-cpl-at-every-college --move --to library
  python3 scripts/library_file.py presentations/cac_2026-08/20260810_CAC_Crystal_Run_Sheet.pdf --slug cac-run-sheet-for-crystal --move --to library
  python3 scripts/library_file.py prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4 --slug ironworker-pathway-in-motion --move --to library
  python3 scripts/library_file.py prototype/noncredit_video/20261005_Noncredit_Summit_in_Motion_v1.mp4 --slug noncredit-summit-in-motion --move --to drafts
  python3 scripts/library_file.py prototype/noncredit_video/20261005_Noncredit_Summit_in_Motion_Narrated_v1.mp4 --slug noncredit-summit-in-motion --move --to library
  ```

  The narrated cut is already in **CPLLibrary**, not Drafts (Sam, 2026-10-06): `--move` reuses a same-named,
  same-bytes file only in the folder it is pointed at, so pointing it at Drafts would upload a second copy.
  The film is about to be re-cut (new voice, Sam's edit, deck draft 2's figures), so the new cuts may simply
  file as v2 with the plain command and these two `--move` lines become history.

  Rehearsed 2026-10-06 against a copy of the live rows: each receipt `UPDATE 1`, then `UPDATE 0`.
  A copy Sam already dropped in by hand with the same bytes is reused rather than uploaded twice.
- **PR 2, the move (call 5):** once the six are filed, their records point at Drive through the
  receipts above. Then remove the deliverable binaries from main (the five Title 5 files can go now; `.gitignore`
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
  account needs (the likely cause, unconfirmed). Drive stays where sessions file pieces, the Library's links open for the
  owner alone, and Sam hands a teammate a file himself.
- **NEEDS SAM — the SharePoint switch, three calls on [Open Asks Sheet 49](https://claude.ai/artifact/6uMT8LrZgMZBit3Gs8wHBL)** (Sam, 2026-10-07: *"Lay out what a
  SharePoint switch would take"*, then *"Put the SharePoint calls on a decision sheet"*): 1, who creates the site
  (proposed: he creates a Teams team, CPL Library, with folders Library and Drafts); 2, whether people outside RCCD
  can be guests (five of the 22 he named: three at cccco.edu, two at Infotech Partners; proposed: a session drafts
  the ask to RCCD IT); 3, how files reach it (proposed: by hand plus his OneDrive sync, per his call 6). Measured
  2026-10-08: this environment's network refuses `graph.microsoft.com` (CONNECT 403) and passes
  `login.microsoftonline.com`; the Microsoft 365 connector (registry, not connected) searches and reads SharePoint
  and cannot upload; Drive holds 16 files, 56,401,700 bytes (13 in CPLLibrary, 3 in Drafts); three `cpl_library`
  records link to Drive; `library.js` (`DRIVE_FOLDER`, `homeForUrl`) and the `cpl_library_home_ck` check know Drive
  as the only file home, so a SharePoint link files today as `web`.
