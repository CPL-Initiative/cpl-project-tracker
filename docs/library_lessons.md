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

## Moved from the lane (S467 SkyHollyleaf, 2026-10-24)

The library lane stood at 1.32 times its 20,000-byte budget. These four sections were settled history; they are kept
here verbatim (headings demoted one level), and the lane states current truth. The Sheet 120 section's line about the
public page's *Made for chip per type* is superseded: Sam's markup of 2026-10-24 removed the chips, and For groups
its names by kind instead.

### Sam's rulings (2026-10-05, all in `cpl_memory`)

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

### Filed in Drive so far

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

### Sam's calls 7-9 (2026-10-05, "7, 8,9 Y")

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

### Sam's rulings ([Open Asks Sheet 120](https://claude.ai/artifact/NWy1GvYEEQgS8oKrYWHpTk) cards 2 to 7, 2026-10-23 ~20:02Z, all his own call)

**Rulings, in the cards' order:** 1 the Library tab makes it and the Letters tab attaches it (*library*); 2 five types, and his note *"Add an \"Other\" choice with the ability to type in the new entity category"* (*five*); 3 show who a piece is for on the public page and filter by it (*show*); 4 a college's record pair in one step from the tab (*onestep*); 5 the agency template, ELL IET first (*template*); 6 backfill the 26 (*backfill*). `cpl_memory` `sam-sheet-120-rulings-2026-10-23`. **Kind gains `visual` (Sam, 2026-10-23 ~20:08Z, on the mock-up, delegated: *"Whatever you recommend, go for it"*):** a page opened in a browser (the CPL Opportunity pages, the DSP page, a Claude artifact) is a *visual*; `document` stays for Word and PDF; the backfill moves today's pages from document to visual; the public page offers Visuals and Documents as separate chips. **Built in that order (S459, below).**

✅ **Built (S459 SkyBuckeye, 2026-10-23), cards 2 to 7 and the Kind call:** `kind` admits `visual`; `for_kind` (college, district, agency, vendor, co, other), `for_category` (the typed category, only with other) and `for_name` under one check (`cpl_library_for_ck`), a name needing a type and Other its category; `cpl_library_public()` returns the three. The tab filters on Made for and For (the names present), shows *Made for College · For Bakersfield College* under each title, and every form (Add, Start a piece, Edit) takes the three, a college's name offered from MAP's list (`map_colleges`, read with the phrase) so it matches the CPL Pathways pick. **Make a visual** beside Start a piece: for a college it writes the record pair in one step (the live `cpl-opportunity/?college=` page as `visual`, the workbook as `spreadsheet` not filed, slugs as the first twelve were filed, a second Make refused); for a district, agency, vendor, the Chancellor's Office or Other it opens Start a piece with kind Visual and the entity set, and the brief's paste names the agency template (the DSP page's shape) until the vault builder exists. The public page shows *For <name>* on each card, a Made for chip per type with a listed piece, and a For list. Tests: `tests/library.test.js` (11), `tests/public_library.test.js` (5). Applied through `supabase-migrate.yml`: the columns (`cpl_library_made_for_2026_10_23_s459`), then the public read (`cpl_library_public_made_for_2026_10_23_s459`); **the backfill receipt** (`kb/receipts/cpl_library_made_for_backfill_2026-10-23_s459.sql`: the twelve pages to visual with their college, the twelve workbooks with theirs, the DSP page to visual for DDS, Aging and LWDA, the ELL IET notice for EDD ELL IET Fund grantees; the open-asks series stays a document, Sam's call 9) **applies after the build is on Pages**, so the live page never shows a kind it cannot name. **Card 5 built (S459, 2026-10-23, after Sam sent the notice):** the agency template is `CPLBrain/04-projects/cpl-initiative/agency-visual/build.py`, a JSON brief to a page in the DSP page's shape (the schema in its README; First Light, both themes, the public header applied at build). Its first instance, **ELL IET CPL Starting Points** (https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe; record `ell-iet-cpl-starting-points`, kind visual, Made for Agency, For EDD ELL IET Fund grantees, seen by the team until Sam lists it), is computed by `ell-iet/make_brief.py` from the notice's eight projects, MAP's adoption view, COCI's active programs (MIS short names mapped to MAP's) and each college's county: a card per project ordered by fit. *Make a visual*'s paste names the builder. The six asks as put to him:

Sam, 2026-10-23 ~19:28Z: *"Ashley and I have been working on the CPL Pathways tab to add the visuals
you create there so the colleges can see their CPL opportunities as the MAP Customer Success Managers
(CSM team) meet with them. She puts them in the Library and then sets them as publicly available and
gives them the link... This is the type of visual I'd like to be able to generate from the Library tab
or the Report tab (whichever you recommend). I think we would want to be able to sort on the libraries
for the type (college, agency, vendor, CO) and add the name of the entity we are making this for and
have it filterable by whatever entities we've created something for. Give it a good think and
recommend."* Measured 2026-10-23: 40 live records; 24 are the twelve colleges' CPL Opportunity pairs
(11 pages listed publicly), 2 are agency pieces (DSP Credit Starting Points for DDS, Aging and LWDA;
the ELL IET doc for EDD's grantees), none is a vendor's; no column holds who a piece is for, so the
name lives in the title alone. Mock-up: https://claude.ai/artifact/LRFiSDUY4bGTokJdaKgHUJ.

1. **Where the visual is made.** Recommended: the Library tab, a *Make a visual* control beside
   *Start a piece*; the Letters tab attaches a Library piece to a send; the Report tabs stay docx. It
   might be wrong if he wants the email and its visual drafted in one place (the Letters tab). Or both.
2. **The entity types on a record.** Recommended: `for_kind` in college, district, agency, vendor,
   co (his four and district, since My College already scopes by district and the CSM team meets
   districts) and `for_name`, a college's name from MAP's list so the filter matches the Pathways
   pick. It might be wrong if district is noise. Or his four alone.
3. **The public page shows who a piece is for.** Recommended: `cpl_library_public()` returns the two
   columns and the page filters by them; each title already carries the name, so nothing new is
   disclosed. It might be wrong if the public page should list colleges only by name and keep agencies
   and vendors to the private tab. Or a private filter only.
4. **A college visual in one step.** Recommended: *Make a visual* for a college writes the record
   pair now (the live `cpl-opportunity/?college=` page and the CPL extract), no session; Ashley lists
   it with the phrase. It might be wrong if each college still wants the five-tab workbook a session
   builds. Or keep the session build.
5. **The agency template, ELL IET first.** Recommended: generalize the DSP page into a vault builder
   (a JSON brief to a page: the meeting, the training facts, colleges tiered by fit, what to confirm,
   next steps, sources) and build the ELL IET grantees page as its first instance from his uploaded
   doc, filed Made for Agency, For EDD ELL IET Fund grantees; *Make a visual* for an agency, vendor or
   the CO captures the brief and hands over the paste. It might be wrong if the ELL IET meeting wants a
   grantee-by-grantee shape rather than colleges tiered. Or hand-build ELL IET alone.
6. **Backfill today's records.** Recommended: the 24 college pieces, the DSP page and the ELL IET doc
   take their type and name by a guarded UPDATE with a before-values receipt (reversible). Or leave
   them blank and set the columns only on new pieces.
