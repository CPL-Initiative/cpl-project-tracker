---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-10-24
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

✅ **The public library is built** (2026-10-20, DSP side session). One record and a switch, never a copy
(*"Copy or move...to save space"*): **List publicly** on a record in the Library tab sets `public_listed` through
`cpl_library_set_public()`; a trigger refuses the public columns any other way, and retiring a piece or narrowing its
audience unlists it. `cpl_library_public()` (anon) returns the listed pieces' public fields only, to the page at
`library/` and the Admin tab's **Public library** panel (Remove beside each). A Claude page also needs its claude.ai
link set public, which the switch asks the lister to confirm. Schema `kb/supabase_cpl_library_public.sql`; test
`tests/public_library.test.js`; `npm run a11y -- public-library public-library-dark` (the targets' names; a bare
`library` is not one).

✅ **The page in Malone's look (Sam, 2026-10-24, S467; built the same day, mock-up
https://claude.ai/artifact/1eotDvtmj56cHMEFP363T2).** His words: *"see the page Malone designed with you for the AI
Outcomes to Skills project. I like the look of it and it seems consistent with the CO webpages. Can you depart from our
First Light motif and redesign the CPL Public Library based on Malone's."* The page takes map.rccd.edu/CPL-AI's look: a
navy Georgia title over a gold rule, the search and **For** beside it in the hero, a photo in an arc on the right, white
cards on a pale blue ground, a navy foot; colors only as tokens in the two `:root` blocks (the test fails a raw color
anywhere else). From his markup of the old page: the eyebrow, the description, the kind and audience word filters, the
*The library* label and the header's link to the page itself are gone; **For** sits right of the search and groups its
names by kind when there is more than one; **Sort** opens on *Most recent* (then *Oldest first*, *Title A–Z*; undated
pieces last); a card shows one line of its occasion and two of its summary, ending in an ellipsis, with the whole text
in the page for search and screen readers, and the title opens the piece. **Light by default:** no device-setting
query anywhere; dark only from the reader's own Dark click, here or in COBI (the shared `cpl_theme`). The header is the
public header's copy restyled to the page; its other copies (`CPLBrain/04-projects/cpl-initiative/public-header/`) still
follow the device setting. **The photo cycles** through every `.hero-slide` the page lists, one every seven seconds,
with *Pause photos* beside it; with one photo, or for a reader who asks for reduced motion, nothing moves. It shows
eleven (S468): the student from Malone's page first (`library/photos/hero-student-1.jpg`), then ten Career Education
toolkit photos Sam supplied (LATTC Architecture, Construction, Fashion, InfoCommTech and Transportation; Sequoia Welding
twice; CCD Advanced Manufacturing, BioTech and Health). Every slide is a 4:3 JPEG at most 1,200 pixels wide with its
people near the middle, so one `object-position: 50% 50%` serves them all; only the first loads up front, each next one
a turn ahead. `tests/public_library.test.js` (6e) fails a slide whose file is missing, is not 4:3, or whose tag misstates
its size. CLAUDE.md's First Light rule names this page as its one departure. `cpl_memory`
`sam-public-library-malone-look-2026-10-24`.

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

✅ **Who a piece is made for (Sam's Open Asks Sheet 120, 2026-10-23; built S459):** `for_kind` (college, district,
agency, vendor, co, other), `for_category` (Other's typed category) and `for_name` under one check; the tab filters on
them and every form takes them, a college's name from MAP's `map_colleges`. **Make a visual** writes a college's CPL
Opportunity record pair in one step, and opens Start a piece for any other entity, naming the agency template
(`CPLBrain/04-projects/cpl-initiative/agency-visual/build.py`). The rulings, the build and the six asks as put to him
are in `docs/library_lessons.md`, *Moved from the lane (S467)*, verbatim; Sam's 2026-10-05 rulings, his calls 7 to 9
and the Drive filing history moved there with them.

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

## Sam's rulings ([Open Asks Sheet 121](https://claude.ai/artifact/NsRnyxTJ3pZmHBWk2qSoLN), 2026-10-23 ~21:27Z, all three his own call: 1 fold-rule, 2 attached, 3 text)

**Carried out by S459 the same day: card 3 (the ELL IET grantees page from the notice Sam sent at 21:28Z, filed at `CPLBrain/04-projects/cpl-initiative/ell-iet/`, and Sheet 120 card 5's template with it) and card 1, the fold: the Knowledge Base tab is gone from the side menu and lives inside the Library as its second view (two underlined words at the top, *Pieces* and *Knowledge Base*; the portal frame `#library-kb` sits beside `#library-root` and never re-renders, so its own magic-link sign-in holds; `#knowledge-base` links open `#library/knowledge-base` through `tabs.js` `FOLDED`; the view opens without the team phrase, since the portal gates itself). The rule: `cpl_library.knowledge` (true, false or not set) and `kb_note` (the note's path in `cpl-knowledge-base` or its link; a typed note says knowledge on its own, `cpl_library_kb_note_ck`); Add and Edit take both, the record shows them, and **Needs attention** counts *knowledge pieces with no KB note* (`flagsOf` `kb_note`). The note itself still reaches the public KB only through its curation pipeline (`CURATION.md`); the Library links it. Tests: `tests/library.test.js` (12), `tests/kb_portal_tab.test.js` rewritten. Card 2 waits on Sam attaching the four Coordinator Guide files in a session. `cpl_memory` `sam-sheet-121-rulings-2026-10-23`.** The asks as put to him:

1. **The Knowledge Base tab and the Library.** Sam, 2026-10-23 ~20:18Z (vault braindump `03-professional/braindumps/braindump-2026-10-23-2020-consolidate-the-kb-tab-and-the-library.md`): *"our KB tab might be a consolidation into the Library or vice versa ... ensure that whatever is in the library is also in the KB, since the knowledge helps us build our unified knowledge informing all the COBI work."* Measured: the Knowledge Base tab is an iframe over `kb-portal/`, a reader of the public `cpl-knowledge-base` repo behind its own magic-link sign-in (Sam and Malone); the Library is `cpl_library` behind the team phrase, 40 live records, none linked to a KB note. Recommended: fold the tab into the Library as a second view (the side menu loses one entry; the portal keeps its sign-in) and one rule with a check: a piece whose substance is knowledge gets a KB note through the curation pipeline, the record links it, and Needs attention names a piece without one. It might be wrong if the KB reader should stay its own door for Malone, or if no rule is wanted.
2. **The CPL Coordinator Guide's four files.** The audit (S458, `CPLBrain/04-projects/cpl-initiative/coordinator-guide/audit_workflow.js`) needs `CPL_Coordinator_Guide.docx`, `.pdf`, `CPL_Coordinator_Quick_Reference.docx` and `.pdf` attached again: the uploads died with S458's container and no report was committed. Recommended: attach them in the next session; the audit runs as he asked ("ultracode").
3. **The ELL IET award notice's text.** Card 5's build (the agency template, the ELL IET grantees page first) needs the notice's text and its eight grantees; the sandbox cannot read edd.ca.gov, and search found five grantees and the $17.97 million total. Recommended: paste the text or attach the PDF.

## The ELL IET page is listed publicly (Sam, Open Asks Sheet 123 card 1, *list*, 13:17Z 2026-10-24)

*ELL IET CPL Starting Points* (https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe; Library record `ell-iet-cpl-starting-points`)
is on the public library: Sam listed it himself from the Library tab at 13:44Z (`listed_by` Sam, `seen_by` public), and he
contacts the eight projects himself. The session's staged receipt,
`kb/receipts/cpl_library_ell_iet_public_2026-10-24_s466.sql`, was never applied. Its public topics are empty; Sierra links
it by title and summary until someone adds them.

## The hero photos and the deck (Sam, Open Asks Sheet 124, 16:20Z 2026-10-24, both his own call)

**Card 1, *attach*:** Sam attaches the toolkit photos, since no session can reach
`careereducationtoolkit.cccco.edu`: it is his local directory (Sam, ~16:30Z), which is why the name resolves nowhere else. He put
them on Google Drive as zips (`CCC-LATTC-<Program>-<number>_V1.zip`, the folder 1WNtaaKMGSYsKsdJLxi4fbR24fXD4fGUZ); the Drive
connector refuses a download over 10 MB, and the first zip is 43.8 MB, so the photos come unzipped, attached to a message or
as JPEGs under 10 MB on Drive.
**Done (S468, 2026-10-24):** the ten JPEGs in the Drive folder *Photos* (`1Ip4KaipYU6xNCbogeEG81-ZPQkbzMJpd`) are on the
page (Status, above). Baking and Nursing exist only as zips over 10 MB, so the page has neither; either one joins by
syncing its JPEG into *Photos*, cropping it to 4:3 around its people, and adding a slide.

**Card 2, *unlist*:** *Turning IT and AI credentials into credit* comes off the public library until it has a public
home: its link points into the vault's private GitHub repository, so a public visitor got GitHub's 404 page. Receipt
`kb/receipts/cpl_library_it_ai_deck_unlist_2026-10-24_s467.sql` (one guarded UPDATE; seen_by, summary and topics kept, so
relisting is one switch once the deck has a link that opens without a sign-in), applied by `supabase-migrate.yml` run
40111416395 and read back at 16:33Z: `public_listed` false, `listed_by` *Sam, Open Asks Sheet 124 card 2 (S467
receipt)*, and `cpl_library_public()` lists 15 pieces. The file is in the vault
(`04-projects/cpl-initiative/20260929_CPL_IT_AI_Credentials_3.pptx`).

## Ask Sierra beside the page (Sam, 2026-10-24; built S469)

Sam asked at ~17:10Z for *"an Ask Sierra chat chip that opens a Sierra side bar if clicked"*; at the start of S469 he picked
**the library first, as one script any page can load,** and **the chip in the bottom-right corner**. `sierra/sidebar.js`
adds the chip and a side bar that frames the public `sierra/` page, so she is the same assistant with the same surface and
logging. The frame loads on the first open and stays loaded while shut, so a reopen keeps the conversation. From 1200px the
page narrows beside her (the library keeps two columns of cards to 1600px) and stays in use; below that she takes the screen
as a modal and the page behind is inert. Close and Escape (in her frame too, unless her About panel is open) hand focus back
to the chip. The frame takes the library's theme in `?theme=`, which her page lets beat a stored choice, and follows a
switch. The library maps the `--sierra-bar-*` tokens onto its own. Test: `tests/sierra_sidebar.test.js`; sweep:
`public-library-sierra` and `-dark`.
**NEEDS SAM (Open Asks Sheet 126 card 1): which pages move onto the bar next.** He chose to see the library's first. The
Fact Sheet and the funding model page open their own drawer (`fact-sheet/factsheet_sierra.js`, a second copy of her chat
with each page's starter questions); COBI's header link opens `sierra/` in a new tab, and COBI also opens Sierra AI over any
tab (`cpl_chat.js`). A page joins with one script tag and a token map.

## Next

- **Sam connects the Microsoft 365 connector;** the next session after that reads the CPLLibrary folder, confirms the 16
  copies he made on 2026-10-08, and moves the three Drive-linked records and the six repo pieces to their SharePoint links
  (a guarded update per record). The Summit film's v2 cuts go into the SharePoint Drafts folder.
- **PR 2, the move (call 5), after that:** remove the deliverable binaries from `main` (the five Title 5 files can go now;
  `.gitignore` `exports/*.docx`, and `kb/_build_55050_redline_docx.py` still writes there), take the Summit film's two
  player pages off the site, and add a guard test so a deliverable binary cannot be committed again. Then the vault's
  binaries (29 on 2026-10-05).
- **The open-asks series record reads version 123** (receipt `kb/receipts/cpl_library_open_asks_sheet123_2026-10-24_s466.sql`,
  applied by `supabase-migrate.yml` run 40096111383): each new sheet is one guarded UPDATE from the version as read.
  `made_by` is capped at 300 characters (`cpl_library_text_ck`), so it is a range (*sheets 46 to 122 by S341 SkyTerrace
  through S460 SkyFremontia*) that each sheet extends by its two ends.
- Sam's sheet 47, 48 and 49 calls of 2026-10-07 and 2026-10-08 (the sheets to the vault, one Library record per series,
  the Ironworker film public, the Drive sharing dropped, the SharePoint folder with guests, hand and sync) are recorded in
  `cpl_memory` (`sam-sheet47-rulings-2026-10-07`, `sam-drop-cpllibrary-sharing-2026-10-07`,
  `sam-sheet49-sharepoint-rulings-2026-10-08`) and in `docs/library_lessons.md`, *Moved from the lane (S460)*.
