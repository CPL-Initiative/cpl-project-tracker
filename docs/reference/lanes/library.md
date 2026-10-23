---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-10-23
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

✅ **The public library is built** (2026-10-20, DSP side session; mock-up
https://claude.ai/artifact/Ebz253XFREqAni5D3sgVP9, Sam: *"Mock up looks great!"*). One
record and a switch, never a copy (*"Copy or move...to save space"*): **List publicly** on a
record in the Library tab sets `public_listed` through `cpl_library_set_public()`, which
needs a reviewer sign-in; a trigger refuses the public columns any other way, and retiring a
piece or narrowing its audience unlists it. `cpl_library_public()` (anon) returns the listed
pieces' public fields only, to the page at `library/` and the Admin tab's **Public library**
panel (Remove beside each). A Claude page also needs its claude.ai link set public, which the
switch asks the lister to confirm. Schema `kb/supabase_cpl_library_public.sql`; test
`tests/public_library.test.js`; in the a11y sweep light and dark. **Every public piece carries the public
header** (Sam, 2026-10-21): the CPL Initiative logo to the Chancellor's Office CPL page, links to
the CPL Fact Sheet, MAP, Find your college (the landing pages), the MAP dashboard, Credit for
Being You and the CPL Library, and Light and Dark controls on COBI's `cpl_theme`. The source is
`CPLBrain/04-projects/cpl-initiative/public-header/` (`header.html`, and `apply.py`, which
embeds the logos for a claude.ai page); `library/index.html` carries a copy. **Next:** Sierra links
listed pieces (a separate PR, A/B first); YouTube training videos become film records.

✅ **The team phrase lists publicly too (Sam, 2026-10-23 18:50Z, his own call, reversing
2026-10-20; built S458):** *"can you set the Library page to be editable with Team phrase and not
just magic link? I want the team to be able to make their artifacts public on the public library."*
`cpl_library_set_public()` takes `team_pass_ok()` or `is_allowed_reviewer()`, anon holds EXECUTE on
it, the tab's switch sends the phrase when there is no reviewer token, and `listed_by` reads the
name given, else the sign-in's email, else *team phrase*. The guard trigger and the governance
dismissal say the same. Applied by `supabase-migrate.yml` run 40011678930 (19:32Z; the schema file
is re-runnable; receipt `kb/receipts/migration_cpl_library_public_team_phrase_2026_10_23_s458_40011678930.json`),
and read back live: anon, authenticated and service_role hold EXECUTE, the function reads
`team_pass_ok()`, the trigger's message names the phrase, the ledger holds the row. The tab's
`library.js` reaches COBI with the merge of #2390 (Pages serves `main`); until then the page still
asks for a sign-in. `cpl_memory` `sam-library-public-listing-with-team-phrase-2026-10-23`. The
workflow it serves (Sam, 2026-10-23): Ashley makes a college's CPL Pathways visual, files it here,
lists it publicly and gives the college the link as the CSM team meets with them.

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
  [`library_filer`](../library_filer.md)) is parked; its Google sign-in was never completed. Its privacy page
  (`privacy.html`, the link on Google's consent screen) stays while that screen links it; S351's UI pass put it on
  First Light's type and dark palette (`npm run a11y -- privacy privacy-dark`, clean).
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

**A shareable Claude artifact gets a Library record, routinely (Sam, 2026-10-20):**
*"I want to add artifacts like this routinely to the library."* A page made for others
stays on claude.ai; the session adds a record with `home` `web`, the artifact link, and
`rebuild_from` naming the HTML source it commits to the vault beside the work. Writes go
through a committed receipt and `supabase-migrate.yml`. First:
`dsp-credit-starting-points` (`kb/receipts/cpl_library_dsp_starting_points_2026-10-20.sql`,
applied 2026-10-20 by `supabase-migrate.yml` run 39500044669; the record, the memory row and
its log row read back 1, 1, 1).
`cpl_memory` `sam-claude-artifacts-go-in-library-2026-10-20`.

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

## Sam's rulings ([Open Asks Sheet 120](https://claude.ai/artifact/NWy1GvYEEQgS8oKrYWHpTk) cards 2 to 7, 2026-10-23 ~20:02Z, all his own call)

**Rulings, in the cards' order:** 1 the Library tab makes it and the Letters tab attaches it (*library*); 2 five types, and his note *"Add an \"Other\" choice with the ability to type in the new entity category"* (*five*); 3 show who a piece is for on the public page and filter by it (*show*); 4 a college's record pair in one step from the tab (*onestep*); 5 the agency template, ELL IET first (*template*); 6 backfill the 26 (*backfill*). `cpl_memory` `sam-sheet-120-rulings-2026-10-23`. **Kind gains `visual` (Sam, 2026-10-23 ~20:08Z, on the mock-up, delegated: *"Whatever you recommend, go for it"*):** a page opened in a browser (the CPL Opportunity pages, the DSP page, a Claude artifact) is a *visual*; `document` stays for Word and PDF; the backfill moves today's pages from document to visual; the public page offers Visuals and Documents as separate chips. **Built in that order (S459, below).**

✅ **Built (S459 SkyBuckeye, 2026-10-23), cards 2 to 7 and the Kind call:** `kind` admits `visual`; `for_kind` (college, district, agency, vendor, co, other), `for_category` (the typed category, only with other) and `for_name` under one check (`cpl_library_for_ck`), a name needing a type and Other its category; `cpl_library_public()` returns the three. The tab filters on Made for and For (the names present), shows *Made for College · For Bakersfield College* under each title, and every form (Add, Start a piece, Edit) takes the three, a college's name offered from MAP's list (`map_colleges`, read with the phrase) so it matches the CPL Pathways pick. **Make a visual** beside Start a piece: for a college it writes the record pair in one step (the live `cpl-opportunity/?college=` page as `visual`, the workbook as `spreadsheet` not filed, slugs as the first twelve were filed, a second Make refused); for a district, agency, vendor, the Chancellor's Office or Other it opens Start a piece with kind Visual and the entity set, and the brief's paste names the agency template (the DSP page's shape) until the vault builder exists. The public page shows *For <name>* on each card, a Made for chip per type with a listed piece, and a For list. Tests: `tests/library.test.js` (11), `tests/public_library.test.js` (5). Applied through `supabase-migrate.yml`: the columns (`cpl_library_made_for_2026_10_23_s459`), then the public read (`cpl_library_public_made_for_2026_10_23_s459`); **the backfill receipt** (`kb/receipts/cpl_library_made_for_backfill_2026-10-23_s459.sql`: the twelve pages to visual with their college, the twelve workbooks with theirs, the DSP page to visual for DDS, Aging and LWDA, the ELL IET notice for EDD ELL IET Fund grantees; the open-asks series stays a document, Sam's call 9) **applies after the build is on Pages**, so the live page never shows a kind it cannot name. **Still open (card 5):** the agency template as a vault builder (a JSON brief to a page) with the ELL IET grantees page as its first instance, which needs the award notice's text from Sam (the sandbox reaches neither edd.ca.gov nor Canvas Commons). The six asks as put to him:

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

## Sam's rulings ([Open Asks Sheet 121](https://claude.ai/artifact/NsRnyxTJ3pZmHBWk2qSoLN), 2026-10-23 ~21:27Z, all three his own call: 1 fold-rule, 2 attached, 3 text)

**Carried out next (S460, in this order): the Knowledge Base tab folded into the Library as a second view and the rule with its check (card 1); the four Coordinator Guide files attached by Sam in that session and the audit run (card 2); the ELL IET grantees page built from the notice Sam sent at 21:28Z, filed in the vault at `CPLBrain/04-projects/cpl-initiative/ell-iet/20260703_EDD_WSSFP22-06_ELL_IET_Award_Notice.pdf` with its text beside it (card 3, then Sheet 120 card 5's template). `cpl_memory` `sam-sheet-121-rulings-2026-10-23`.** The asks as put to him:

1. **The Knowledge Base tab and the Library.** Sam, 2026-10-23 ~20:18Z (vault braindump `03-professional/braindumps/braindump-2026-10-23-2020-consolidate-the-kb-tab-and-the-library.md`): *"our KB tab might be a consolidation into the Library or vice versa ... ensure that whatever is in the library is also in the KB, since the knowledge helps us build our unified knowledge informing all the COBI work."* Measured: the Knowledge Base tab is an iframe over `kb-portal/`, a reader of the public `cpl-knowledge-base` repo behind its own magic-link sign-in (Sam and Malone); the Library is `cpl_library` behind the team phrase, 40 live records, none linked to a KB note. Recommended: fold the tab into the Library as a second view (the side menu loses one entry; the portal keeps its sign-in) and one rule with a check: a piece whose substance is knowledge gets a KB note through the curation pipeline, the record links it, and Needs attention names a piece without one. It might be wrong if the KB reader should stay its own door for Malone, or if no rule is wanted.
2. **The CPL Coordinator Guide's four files.** The audit (S458, `CPLBrain/04-projects/cpl-initiative/coordinator-guide/audit_workflow.js`) needs `CPL_Coordinator_Guide.docx`, `.pdf`, `CPL_Coordinator_Quick_Reference.docx` and `.pdf` attached again: the uploads died with S458's container and no report was committed. Recommended: attach them in the next session; the audit runs as he asked ("ultracode").
3. **The ELL IET award notice's text.** Card 5's build (the agency template, the ELL IET grantees page first) needs the notice's text and its eight grantees; the sandbox cannot read edd.ca.gov, and search found five grantees and the $17.97 million total. Recommended: paste the text or attach the PDF.

## Next

- **The team phrase lists publicly too (Sam, 2026-10-23 18:50Z, his own call, reversing 2026-10-20):** *"can you set the
  Library page to be editable with Team phrase and not just magic link? I want the team to be able to make their
  artifacts public on the public library."* Not built yet; the exact change (the function's gate, its anon grant, the
  trigger's message, `library.js` `setPublic`, the public-library test, the governance dismissal) is in
  `docs/session_457b_handoff.md`.

- **The open-asks series record reads version 57 (Sam pasted it, ~15:31Z 2026-10-09, "success").** It sits at [Sheet 57](https://claude.ai/artifact/XGgsHHu54rJmNGeEuT1teL) with sheet 56 Earlier, 30 versions (read back by S352; receipt `kb/receipts/cpl_library_open_asks_sheet57_2026-10-09_s352.sql`). `made_by` is capped at 300 characters (`cpl_library_text_ck`): the per-session list reached 281 and failed the first paste, so it is now a range (*sheets 46 to 57 by S341 SkyTerrace through S352 SkyMeridian*) that a later sheet extends by changing its two ends. This table's writes go to Sam as a paste: `apply_migration` times out on `cpl_library`, and the repo's Supabase guard blocks an `update` through `execute_sql`.
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
