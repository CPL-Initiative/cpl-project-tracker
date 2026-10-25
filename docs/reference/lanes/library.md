---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-10-25
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

Sheet 121's rulings (the Knowledge Base fold, the Coordinator Guide files, the ELL IET notice) and Sheet 124's (the hero
photos, the IT and AI deck unlisted) are carried out; their text moved verbatim to `docs/library_lessons.md`
(*Moved from the lane, S469*). Still open from them: the four Coordinator Guide files, and Baking and Nursing photos.

## The ELL IET page is listed publicly (Sam, Open Asks Sheet 123 card 1, *list*, 13:17Z 2026-10-24)

*ELL IET CPL Starting Points* (https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe; Library record `ell-iet-cpl-starting-points`)
is on the public library: Sam listed it himself from the Library tab at 13:44Z (`listed_by` Sam, `seen_by` public), and he
contacts the eight projects himself. The session's staged receipt,
`kb/receipts/cpl_library_ell_iet_public_2026-10-24_s466.sql`, was never applied. Its public topics are empty; Sierra links
it by title and summary until someone adds them.

## Ask Sierra beside the page (Sam, 2026-10-24; built S469)

Sam asked at ~17:10Z for *"an Ask Sierra chat chip that opens a Sierra side bar if clicked"*; at the start of S469 he picked
**the library first, as one script any page can load,** and **the chip in the bottom-right corner**. `sierra/sidebar.js`
adds the chip and a side bar that frames the public `sierra/` page, so she is the same assistant with the same surface and
logging. The frame loads on the first open and stays loaded while shut, so a reopen keeps the conversation. From 1200px the
page narrows beside her and stays in use; below that she takes the screen as a modal and the page behind is inert. **Beside
the page the reader sets her width** (Sam, ~23:20Z: *"Make the sidebar resizable horizontally"*; built S469): her left edge
is a separator that drags and takes ArrowLeft and ArrowRight (40px), Home and End; the words *Narrower* and *Wider* in her
header do the same for anyone who cannot drag (WCAG 2.5.7). She keeps 340px, the page keeps 600px, and the width is
remembered per reader (`cpl_sierra_bar_w`). The library's cards fit the room she leaves through a container query on
`.results`: three columns while a card keeps about 260px, then two, then one. Close and Escape (in her frame too, unless her About panel is open) hand focus back
to the chip. The frame takes the library's theme in `?theme=`, which her page lets beat a stored choice, and follows a
switch. The library maps the `--sierra-bar-*` tokens onto its own. **COBI's Library tab carries it too** (Sam, ~21:05Z:
*"Library and more importantly on the public library site:)"*): `library.js` loads the bar on the tab's first visit, shows
the chip on that tab alone (`setChip`; any other tab hides it and shuts an open bar) and maps the tokens onto First Light.
Test: `tests/sierra_sidebar.test.js` (51); sweep: `public-library-sierra` and `-dark` (its keyboard checks drag the edge
across her frame at 1440px), `cobi:library`.
**The Fact Sheet and the funding model page open her in the bar too** (Sam, Open Asks Sheet 126 card 1, *public*, 23:08Z
2026-10-24; built S469); COBI stays as it is. Each opens her from its own *Ask Sierra* word in its action row, just ahead of
its PDF control (Sam, 2026-10-01: *"Include an Ask Sierra link as in the Fact Sheet"*): a page with a `[data-sierra-open]`
word shows no chip, and Close hands focus back to the word. Each names her starter questions (`CPL_SIERRA_SUGGESTED`, three
shown) and her surface (`CPL_SIERRA_SURFACE`, `fact-sheet`, the one a host may claim); `sierra.js` reads both from the
same-origin parent, never from the address. Their drawer (`fact-sheet/factsheet_sierra.js`, a second copy of her chat) and
its test are gone. A page joins with one script tag and a token map. Sweep: `fact-sheet-sierra`, `-dark`,
`funding-model-sierra`.

## Sierra reads the library (Sam, ~23:20Z 2026-10-24; built S469)

Sam asked Ask Sierra *"What is one step I can take to create CPL for the ELL IET grantees?"* and she gave general steps,
never naming *ELL IET CPL Starting Points*: nothing in `cpl-chat` read the library. *"Can you make sure she's wired to grab
that info?"* (`cpl_memory` `sam-sierra-sidebar-asks-resize-library-prompt-2026-10-24`). `cpl-chat`'s LIBRARY BLOCK reads
`cpl_library_public()` beside the other routes (cached ten minutes per instance; drafting surfaces skip it) and keeps up to
three pieces the question names: a college's piece through the college the detection resolved, any other piece by a word
of its title, who it is for or its topics, or two words of its summary (words every piece shares never count). A piece on
the tracker's `library/` is read too, and its text (to 20,000 characters, a longer page losing its middle) rides beside
the link, so she answers from what it says; a question about the library lists every piece. The rule: link the piece in
the first paragraph, answer from its text, add nothing to it. Tests: `tests/sierra_library.test.js` (30); smoke mode 7x
(his question). Live: `cpl-chat` deployed 03:13Z 2026-10-25 (run 40157254434); the production smoke (run
40158212946) passed 7x, her answer linking the piece first and naming Fresno, Lemoore and Chaffey from its text.

## Public pieces live on GitHub Pages (Sam, 2026-10-25)

Sam, ~23:25Z 2026-10-24: *"the url that shows for the public library visuals has a claude url. Any way we can use an alias
for all public surfaces--with cplinitiative?"* No team-owned domain exists; at ~02:00Z he picked **GitHub Pages now**
(`cpl_memory` `sam-public-pieces-on-github-pages-2026-10-25`). A public piece made as a Claude artifact gets a copy at
`library/<slug>/`, written by `python3 scripts/library_page.py SLUG SOURCE.html` from its vault source (or `Artifact read`
with `path` index.html), and its record links there; the claude.ai page stays the editable original, so an edit there is
followed by a rerun and a commit. Pages, 2026-10-25: `ell-iet-cpl-starting-points`, `dsp-credit-starting-points`
(their vault copies match the published artifacts byte for byte). The URL switch is one guarded UPDATE per record
(`kb/receipts/cpl_library_pages_urls_2026-10-25_s469.sql`, before-values in the receipt). Test:
`tests/library_pages.test.js`; sweep: `library-ell-iet`, `library-dsp` and their `-dark`. Both records point there
(applied 03:12Z, supabase-migrate run 40156994192, #2429). **Every listed piece opens at a cpl-initiative.github.io
address:** the last, `ironworker-pathway-in-motion`, moved from the film's github.com file page to the same file on Pages
(`.../prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4`; receipt
`kb/receipts/cpl_library_ironworker_pages_url_2026-10-25_s470.sql`, supabase-migrate run 40162123856, read back 04:32Z).
Sam's edits of that record only listed it; the github.com link came from the seed. Its versions keep the github.com link
(the team view; `cpl_library_public()` returns `url` alone).

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
