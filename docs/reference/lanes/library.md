---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-11-05
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
**File it** sits on the In development card: filing a Requested piece moves it to Draft, and a record with no made-on date takes the day it is filed, or the day Edit moves it past Requested (2026-10-27, after the Workplan Update reached Approved through Edit and sorted last, undated). Sam's routine reads Requested records as queue items (step 6 of *At the start* in
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

✅ **The page in Malone's look (Sam, 2026-10-24, S467):** map.rccd.edu/CPL-AI's look, Light by default (dark only from
the reader's own Dark click), eleven hero photos cycling with *Pause photos*; CLAUDE.md's First Light rule names it as its
one departure. The full record, his words and the photo list moved verbatim to
[`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S483, later)*.

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

✅ **Version 22 and the List (SkyCartwheel, 2026-11-05; Sam: "Version 22 looks better", then "Add a list view option to the
Library just like our CPL Commons list views and the current cards you have can be the sidebar details like in the Commons.
Also use the new commons format.").** Mockup Version 22 (advised by Fable) on the Library canvas,
https://claude.ai/artifact/DNzaPRUD1qsrBTAhbn29kR.
- **Three views, each with an address:** List (`#library`, the default), Cards (`#library/cards`), Knowledge Base.
- **The List** is `commons_list.js`: six columns that fit beside the side menu (Title, Kind, Made for, Where it stands,
  Status, Updated), last modified first, banded by project; filters for drafts to review, changes asked, replacing, in
  development and the attention flags. A row's title opens its card in the side panel. The create box folds shut.
- **The card names one of four states** in a line and offers the next step under it as underlined words: Revise; Draft it
  now, Change what you asked, Copy for a session; Open the draft, Replace the public copy, Ask for more changes; Keep
  Version N instead. Revise opens its box on the card (or in the panel): What to change, a document, one press that
  saves the request and drafts it in place for a page with a Pages copy, or sends it to a session.
- **More changes build on the draft** (`regen.based_on_draft`, earlier drafts under `regen.earlier`; a draft known only
  by its claude.ai link, `based_on_url`, goes to a session). Start over from Version N drops it by choice.
- **What changed** on a ready draft: the summary, each edit as Was and Now (`request.pairs`, stored by
  `library-revise-draft` once redeployed), and an accessibility check run on the draft in a script-free frame.
- Edit the record, File a new version and Start something new from it sit in Details. The size box is gone; the size
  and format sit beside the title. The Library takes the Commons look (`commons_look.js` names `#tab-library`).
- Tests `library` (280), `library_revise_draft` (44), `library_list` (23), `public_library` (112), `commons_look` (12);
  `npm run a11y -- library-cards library-cards-dark library-list library-list-dark` (seeded) pass.

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

**A shareable Claude artifact gets a Library record, routinely (Sam, 2026-10-20)**: CLAUDE.md carries the rule; the first record and its receipt moved verbatim to `docs/library_lessons.md` (*Moved from the lane, S557*).

Sheet 121's rulings (the Knowledge Base fold, the Coordinator Guide files, the ELL IET notice) and Sheet 124's (the hero
photos, the IT and AI deck unlisted) are carried out; their text moved verbatim to `docs/library_lessons.md`
(*Moved from the lane, S469*). Still open from them: the Baking and Nursing photos.

## Regenerate, and the documents a piece is built from (Sam, 2026-10-26; built S490)

Built S490 (`refresh_note`, `sources`, `regen`, the one box, the college page's notes layer); the Microsoft 365 connector waits on RCCD; the Coordinator Guide, ELL IET and DSP records. The full record moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S553)*.

## Sierra beside the library and reading it (Sam, 2026-10-24; built S469)

Live; its record moved verbatim to `docs/library_lessons.md` (*Moved from the lane, S557*).

## Public pieces live on GitHub Pages (Sam, 2026-10-25; built S469 and S470)

Every listed piece opens at a cpl-initiative.github.io address; a public piece made as a Claude artifact gets a copy at
`library/<slug>/` from `python3 scripts/library_page.py SLUG SOURCE.html`, and after an edit to the claude.ai original
the copy is rerun and committed. The full record moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md),
*Moved from the lane (S483)*.

## Next

- **The List's project bands lead with the newest piece** (#2812, SkyRoundoff; Sam's report: *"the sort descending by
  modified date only partially works--ELL is not at the top of the list but was last modified"*): `bandNewestFirst`
  orders them, as the Cards' project cards already were.
- **Revise from the card, no session** (S577, SkyBarnard): its build record moved verbatim to `docs/library_lessons.md` (*Moved from the lane, SkyCartwheel*).
- **ELL IET Version 5 is public** (SkyFlipFlop, 2026-11-05; Sam's Replace at 22:34Z, `library-publish` dispatched, run
  42122991947): the Initiative at a glance and top cards that link; built by `make_tabs.py` from Version 3.
- **The card's quick revise closes its gaps** (Sam: *"build fixes 1-3"*, #2824; `library-revise-draft` v3 deployed):
  the drafter is told Sierra's budget and records `request.sierra`; the card's check adds target size and Sierra's count;
  a published model draft of a scripted piece raises *Source behind the page* until the source catches up.
- **The Credential Catalog sits in COBI's Share menu** (Sam's ask, #2826): a launcher to `library/adopt/` after CPL Funding.
- **The CPL Initiative overview** (`library/cpl-initiative-overview/`, record `cpl-initiative-overview`; Sam: *"publish the
  overview"*): in the public library's look, figures live from `live_metrics.json`; its own source, so revise it on its card.
  Every public page's header leads its Links with it (`header.html`; guarded in `tests/public_library.test.js`).
- **Still open from the ELL IET and Coordinator Guide asks:** IACA's `regen` (Crystal Nasio, 2026-10-26) has no note or
  sources: it waits on what she wants changed. The Coordinator Guide's request (Sam, 2026-11-05 12:36Z, Request Adopt
  links) needs a session: it has no Pages copy. ELL IET reads 33,971 of Sierra's 34,000 characters: room for anything
  more comes out of repeated wording (the build already trims two phrases) or a `cpl-chat` cap raise.
- **Once RCCD's admin approves it, Sam connects the Microsoft 365 connector** (held, Sam, 2026-10-26); the next session after that reads the CPLLibrary folder, confirms the 16
  copies he made on 2026-10-08, and moves the three Drive-linked records and the six repo pieces to their SharePoint links
  (a guarded update per record). The Summit film's v3 cuts (S482) go into the SharePoint Drafts folder, Sam's by hand.
- **PR 2, the move (call 5), after that:** remove the deliverable binaries from `main` (the five Title 5 files can go now;
  `.gitignore` `exports/*.docx`, and `kb/_build_55050_redline_docx.py` still writes there), take the Summit film's two
  player pages off the site, and add a guard test so a deliverable binary cannot be committed again. Then the vault's
  binaries (29 on 2026-10-05).
- **Each new open-asks sheet updates the series record** `open-asks-sheets` (version 137 since S503, receipt
  `kb/receipts/cpl_library_s503_2026-10-27.sql`): one guarded UPDATE from the version as read; `made_by` (capped at 300
  characters) is a range each sheet extends.
- **A film re-render moves its record.** `cpl-funding-in-motion` names Scenario 2 v13 and Sierra's narrated Draft 7 (Sam's
  own script), what the public funding page carries, with Scenario 1's approved cuts kept (S504, receipt
  `kb/receipts/cpl_library_s504_film_v13_2026-10-28.sql`, links pinned to #2525's head 57246801c). `noncredit-summit-in-motion` still names v1
  (ladypatty1): its v3 cuts are not in the repo, so it moves when Sam files the SharePoint copy with the tab's File it.
- Sam's sheet 47, 48 and 49 calls of 2026-10-07 and 2026-10-08 (the sheets to the vault, one Library record per series,
  the Ironworker film public, the Drive sharing dropped, the SharePoint folder with guests, hand and sync) are recorded in
  `cpl_memory` (`sam-sheet47-rulings-2026-10-07`, `sam-drop-cpllibrary-sharing-2026-10-07`,
  `sam-sheet49-sharepoint-rulings-2026-10-08`) and in `docs/library_lessons.md`, *Moved from the lane (S460)*.

## Remediation, one place to add, one card per project (Sam, 2026-10-28; mockup S508)

Sam's ask (2026-10-28) and his comments on mockup Version 10 are in [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S510)*; his words in short: *"make it easy for a user to drag and drop their decks (or other docs) into the library and run a remediation process."*

The mockup as Sam left it (Version 20) is described verbatim in [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S509)*.

✅ **① One card per project is built (S509, #2538).** `cpl_library.project` names a piece's project; pieces that share it draw as one card, a row per piece with its title as the link, and Edit, Regenerate and Details on each row (each acts on one record; the one departure from the mockup). Edit sets the project; a college's pair files under one. Receipt `kb/receipts/cpl_library_projects_2026-10-29_s509.sql` (13 projects of 2, read back). Test: `library` block (15).

✅ **② The one panel is built (S509).** *Create or Remediate a Document* replaces the three add buttons, under the filters: drop or choose a file, or paste a link; *what is it for?* (Remediate, offered for a .pptx or .docx; Use it as background; File it as is); Instructions; *Start*. Start opens the brief (the instructions as *What it must say*, the kind read from their words, Sam's template defaults), the brief with the link or a text file's words as a source, or the filing form with the link and a title from the name. A dropped file filed as is asks for its SharePoint link: a record holds a link, never bytes. A visual made for a college writes its pair from the brief's Save. Proceeded on the recommendation (S509's reading of Version 20). Test: `library` block (16).

✅ **③ Remediation in the browser is built (S509):** a dropped .pptx or .docx read here by `library_remediate.js` over the vendored `jszip.min.js`, *Fixed for you* and *Needs you*, *Remediate and download*, and *Draft from the picture* through `alt-text-draft`. The full record moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S517)*.

✅ **④ A deck's contrast (S510) and ⑤ a Word document's (S511) are checked:** each text run's color against the fill it sits on, one *Needs you* item per color pair with the nearest passing color of the same hue as the fix. The full record moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S512)*.


✅ **⑥ to ⑰ are built** (S512 to S576: Word headers and text boxes, PDFs, workbooks, charts, drafting first, slide titles and scripts, every draft applied, Finish remediation, last modified first and the draft's version named). Their records moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S577)*.

✅ **⑪ Revise and remediate from the one box (Sam, 2026-10-29; built by S520's side session).** The box finds a piece
already here (by a label naming its kind, its link, a file named for it, or the card's Revise and remediate or Edit) and asks
what to do with it; long instructions go whole into `sources`, and every rebuild is remediated. The record moved verbatim to
[`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S520's side session)*.

**The Chancellor's address** is on Pages with its film: lessons S531.
