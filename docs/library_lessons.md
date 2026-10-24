---
title: The Library and its filer — lessons
date: 2026-10-06
tags: [lessons, library, drive, filer, oauth]
artifacts:
  - scripts/library_file.py
  - docs/reference/library_filer.md
  - privacy.html
  - kb/receipts/library_filed/
related:
  - "[[docs/reference/lanes/library]]"
  - "[[docs/reference/library_filer]]"
---

# The Library and its filer — lessons

## 2026-10-06 — S338: the first real Google sign-in, and the first filing by hand

Sam set up the filer's sign-in with this session walking him through it. The guide was wrong or silent at
five points; #1888 fixed it. What each cost:

- **Publish stays grey until Branding is complete.** Saving app name, support email and developer contact
  is not enough: Google wants the home page, a privacy policy link and the authorized domain. The tracker
  had no privacy page, so #1887 added `privacy.html`. Publish before minting the token: a token from
  *Testing* dies in 7 days.
- **Environment variables, not *Add credential*.** The cloud environment's *Add credential* form attaches a
  header to web requests; the filer reads three variables and exchanges the refresh token itself.
- **The first save held the template's placeholders.** `invalid_client` from `--check`. The session found it
  without printing a value: lengths 11, 15 and 15 are the lengths of `<Client ID>`, `<Client secret>` and
  `<refresh token>`. Check shape (lengths, `.apps.googleusercontent.com`, `GOCSPX-`, `1//`), never value.
- **The Playground hides its own success.** A good exchange jumps to Step 3; the token waits in Step 2. A
  second press on the same code, or a code issued before *Use your own OAuth credentials* was ticked,
  returns `invalid_grant`. The unverified-app warning comes as a full page (Advanced) or as a yellow box on
  the consent screen (Continue).
- **A session's environment is read once.** This session restarted at 18:31Z with the placeholders and
  never saw the corrected values. Say so early, and run the first `--check` in a new session.

**The Summit deck was filed by hand.** Sam dropped it in; the Drive connector found it by title and
confirmed the size (2,039,321) matched the build. Two traps: Sam's "moved it to Drafts" first meant the
*film*, not the deck (`parentId` told the truth; ask before calling it lag), and **`apply_migration` timed
out four times without writing** while the `execute_sql` guard refused the `UPDATE`. The guard is right to;
the fallback was Sam running the receipt in the Supabase SQL editor, then a read-back. Keep the receipt out
of the repo until it is applied, so a committed receipt always means a write that happened.

## S339 SkyReel, 2026-10-06

- **The filer's sign-in values were saved truncated.** `--check` answers `invalid_client`; the three values measure
  43 / 19 / 14 characters where real ones run about 72 / 35 / 100+, though each passes its shape check (suffix,
  `GOCSPX-`, `1//`). A shape check is not a length check: measure both, print neither.
- **Both Summit v2 cuts went to Sam in chat for Drafts** (10,048,927 and 17,230,551 bytes), the documented fallback
  while the filer cannot sign in. Their Library record waits on Sam confirming the files are in Drafts.

## S459 SkyBuckeye (2026-10-23): who a piece is made for, built; the KB tab and the Library

- **Three applies, one build, in order.** The columns rode the whole schema file (re-runnable), then the public read's
  file, each a push of `kb/migrations/.apply` on the build's own branch (#2393); the backfill waits for Pages, because the
  live page names a kind only after the deploy. A migrate run's receipt commit starts no `test`: a merge of `main` after
  it does. The bot's push also needs no re-apply, so the trigger returns to `main`'s content in the checkpoint commit.
- **A college's name is MAP's.** `map_colleges` (116 colleges and 2 continuing-education campuses; 8 test rows and 2
  partners left out) is the datalist behind For; `mapCollege()` folds case and spacing to MAP's spelling, and a name MAP
  does not list is refused, so the Library filter and the CPL Pathways pick agree.
- **The pair's slug is the college's.** `cpl-opportunity-<college>-visual` and `-workbook`, as the first twelve were
  filed, so a second Make is refused by the table's unique slug before any write.
- **Sam's words on the tabs (20:18Z): consolidate wherever possible; the team is overwhelmed by the tab count.** The KB
  tab is a reader of the public repo, the Library the register of pieces; the recommendation is one menu entry and a
  rule that joins a knowledge-bearing piece to a KB note (Sheet 121 card 1).
- **The harness can ignore `cd`.** An edit meant for the tracker landed in the #2389 worktree once; every command
  since names the repo by absolute path (`git -C`, absolute file paths in scripts).

## S458 SkyLarkspur (2026-10-23): the team phrase lists publicly; a piece records who it is made for

- **The gate moved in one re-runnable file.** `cpl_library_set_public()` reads `team_pass_ok()` or
  `is_allowed_reviewer()`; anon holds EXECUTE because the gate is inside the function; `listed_by` falls back to
  *team phrase*. `supabase-migrate.yml` applied `kb/supabase_cpl_library_public.sql` from the branch push (run
  40011678930) and the read-back checked the grants, the function body, the trigger's message and the ledger row.
  The tab's side (`library.js` sends the phrase when there is no token) reaches COBI only with the merge, so the
  database accepted the phrase forty minutes before the page stopped asking for a sign-in: say which half is live.
- **A visual made for an entity is a Library concern.** The Report tabs write Word documents; the Letters register
  holds sends; the Library holds the record, the brief, the listing and the filing. Sam's ask (2026-10-23) became six
  cards on Open Asks Sheet 120 and a mock-up (https://claude.ai/artifact/LRFiSDUY4bGTokJdaKgHUJ): `for_kind` and
  `for_name` on the record, filters on both libraries, *Make a visual* beside *Start a piece*. Measured first: 40 live
  records, 24 college pieces (12 colleges, 11 listed), 2 agency pieces, none for a vendor; the name lived in the title.
- **The agency precedent has no builder.** The DSP page was hand-written; its shape (the meeting, the training facts,
  colleges tiered by fit, what to confirm, next steps, sources) is the template an agency page needs. The sandbox
  reaches neither edd.ca.gov nor Canvas Commons: an agency's source text comes from Sam's upload.
- **A compound command that pushes a branch carrying a data delete is refused whole** by the session's permission
  check; the same push alone, or a push whose `.apply` points at an additive schema file, went through. One step per
  command when a push carries a write.

## S459 (SkyBuckeye), 2026-10-23, later: the agency template built

- **The template is a builder, and the brief is data.** `agency-visual/build.py` paints the DSP page's shape from a
  JSON brief; the page's counts come from `ell-iet/make_brief.py`, never typed. A hand-written page was the right
  first instance (DSP) and the wrong second: the eight ELL IET projects each needed the same three reads (credit
  articulated nearby in MAP, the program taught nearby in COCI, a precedent elsewhere), which is a loop.
- **COCI names colleges in MIS short form, in capitals** (`CANYONS`, `EAST L.A.`, `SAN FRANCISCO CTRS`); the
  first match against MAP's names found 0 of 121. A hand map for the irregular thirty and a normalized compare
  (drop Community and Junior) map all but Calbright and the CCCCO row.
- **A sentence-long line needs its own row.** The DSP shell's three-column line (code, title, units) fit course
  rows; a line that says where credit exists wrapped into a thin column at three cards across. The template puts
  the label and the count on one row and the sentence under it, full width.
- **Name the exit credential, not the training.** The summaries say "Nurse Assistant training" and "Clinical
  Medical Assistant course"; MAP articulates the CDPH certificate and the CCBMA or NHA credential. The page's
  "what we still need to confirm" leads with that question, because the match hangs on it.
- **A folded tab keeps its frame and its links.** The Knowledge Base portal signs in on its own (a magic link,
  Sam and Malone), so its frame must not be repainted by the tab that now holds it: it sits as a static sibling
  of the Library's root and the view control only hides or shows it. `tabs.js` maps the old hash
  (`FOLDED`), so a bookmark or a Sierra answer naming `#knowledge-base` still lands on the portal.
- **The knowledge rule is a flag and a link, and the check is a count.** `knowledge` says whether a piece's
  substance is knowledge; `kb_note` links the note once the curation pipeline has it; Needs attention counts
  the pieces with the first and not the second. Nothing copies a deck into the KB; the join is at the record.

## S460 SkyFremontia (2026-10-24): Open Asks Sheet 122, the ELL IET page's public listing

- **An outward step is a card, even when the page is done.** The ELL IET page was built under Sheet 121
  card 3 and sat as a draft; listing it publicly and sending it to eight grantees is on the one hold list,
  so Sheet 122 asks it as one card (list and send, list only, keep on the team Library, edit first) rather
  than chat. The lane carries the NEEDS SAM marker until he answers; the builder refuses to build without it.
- **A chip label carries no semicolon.** `_chips_attr` refuses `;` in a label or a value (the attribute is a
  `;`-joined list), so a label reads *List it, and I contact the projects myself*, never *List it; I will...*.
- **The series record moves by receipt, on the session's docs branch.** The guarded UPDATE from version 121
  (as read, with `updated_at` as read) rode `kb/migrations/.apply`; `supabase-migrate.yml` applied it in
  four minutes (run 40051278289) and committed the receipt to the branch; the read-back showed version 122,
  41 versions, Sheet 122 Current and 121 Earlier.
- **The harvest's "waits on Sam's word" items are queue order, not cards.** S449 ruled the two S448 offers
  "neither a card", and Sam's 2026-10-17 go lets harvest calls proceed on their procedures; the NEXT line
  names what the queue takes up next, and a sheet asks only what he alone decides.

## Moved from the lane (S460 SkyFremontia, 2026-10-24)

The library lane's Next section carried these settled calls as a log (the lane stood at 1.45 times its budget). They are
recorded in `cpl_memory` and kept here verbatim; the lane states current truth.

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
