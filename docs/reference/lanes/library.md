---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-11-12
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

✅ **A piece's link beside a file** (2026-11-09, #3000): moved verbatim to the lessons, *Moved from the lane (tender-fermi, 2026-11-10)*.

✅ **Any file, and a new piece drafted on its card** (Sam, 2026-11-10, #3077: one reader `readWords`, drop targets, Google links, Draft it now, Publish it; tests `library_any_file`, `library`, `library_publish_test.py`): moved verbatim to the lessons, *Moved from the lane (SkyWhirlpool, 2026-11-11)*.

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

✅ **The team phrase lists publicly too** (Sam, 2026-10-23; `cpl_library_set_public()` takes `team_pass_ok()` or `is_allowed_reviewer()`): moved verbatim to the lessons, *Moved from the lane (SkyWhirlpool, 2026-11-11)*.

✅ **Who a piece is made for (Sam's Open Asks Sheet 120, 2026-10-23; built S459):** `for_kind` (college, district,
agency, vendor, co, other), `for_category` (Other's typed category) and `for_name` under one check; the tab filters on
them and every form takes them, a college's name from MAP's `map_colleges`. **Make a visual** writes a college's CPL
Opportunity record pair in one step, and opens Start a piece for any other entity, naming the agency template
(`CPLBrain/04-projects/cpl-initiative/agency-visual/build.py`). The rulings, the build and the six asks as put to him
are in `docs/library_lessons.md`, *Moved from the lane (S467)*, verbatim; Sam's 2026-10-05 rulings, his calls 7 to 9
and the Drive filing history moved there with them.

✅ **Version 22 and the List** (2026-11-05): moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (tender-fermi, 2026-11-10)*.

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

- **Sam's test of pictures passed (2026-11-11):** request `71931018` drafted with its five MAP screens under their
  steps, he ruled *"the addresses are OK"* on slide 4's two screens, and it published as Version 1 with
  `img/1.webp` to `img/5.webp` (library-publish run 42940831782; read back live). **NEXT 0:** his List publicly, and
  the link from the public funding dashboard that his brief asks for.
- **Pictures in a piece (Sam, 2026-11-11, #3095):** a PDF's pictures are cropped in the browser (`readPictures`),
  saved in `cpl_library_pictures`, placed by the drafter through a marker (`pictures.mjs`), checked on the card (Cover
  or crop, Leave it out; `regen.pictures_checked_by`), and written to `library/<slug>/img/` by `library_publish.py`. A
  picture once published stays in the repo's history. A PowerPoint is saved as PDF first. Tests: `library_pictures`
  (44). The full record: lessons, *Moved from the lane (SkyWhirlpool, 2026-11-11)*.
- **Changes after the first draft (Sam, 2026-11-11, S635):** *"there doesn't appear to be any way to add new instructions
  when I click edit in the library side bar"*. A new piece's ready draft offered Open, Publish it and Draft it again, and
  no box. Now **Ask for changes** opens the card's box; `library-revise-draft` edits that draft (`regen.based_on_draft`,
  `new_piece` kept for the publisher), the piece's documents stay on the record, the card counts Draft 2, 3, and
  *Start over from the brief* sits in the box (it replaces Draft it again). Test: `library_any_file` E2.
- **Owed to COBIx on the next Library change:** the `style=` entity pattern in either quote or unquoted
  (`apply_edits.mjs` RISKS, `library_publish.py` _RISKS); `tests/pages_size_guard.test.js` walking `kb/` minus
  `kb/receipts`; Leave it out on a published picture opens a request that replaces the public copy (the file stays
  served until the piece's next publish); a replace-at-once draft with pictures shows the box and a publish step (the
  run skips it every pass); the box's line counts the pictures kept (`fresh.length`), not found.
- **A draft read off Pages drops its version stamps (2026-11-11, #3097):** Pages serves local scripts as
  `x.js?v=<hash>`; the starter and a public page are read from Pages, so the first card-published piece carried the
  stamp into the repo and `library_pages.test.js` failed on `main`. `unstamp` in `apply_edits.mjs` and
  `library_publish.py`. That test also lets MAP's two office addresses stand as help links (`OFFICE_ADDRESSES`).
- **The box says what it did beside its field (Sam, 2026-11-11, #3097):** *"the text showing they uploaded is below
  the window of view and I thought nothing happened when I first clicked"*. The line shows inside the card's box under
  the document field; a file added twice says so and saves its words and pictures once.
- **Create is one form** (Sam, 2026-11-06: *"it opens up a secondary view and process after clicking start. need to
  simplify and clean this up"*): a new piece's working title and your name sit in the panel, the rest of the old brief
  folds under *More about it (optional)*, and Start saves the Requested record and opens its card with the brief. No
  second form. The kind the instructions name first wins (his noncredit visual had read as a Document). A new piece
  drafts on its card with Draft it now (2026-11-10, above).
- **DSP Credit Starting Points is Version 3 in public, remediated (S641, #3151, `fb2d35b3`; Sam's Revise and remediate
  of 2026-11-11 15:30Z, approved 15:31Z).** ELL IET Version 5's form, from the vault source. The record moved by guarded
  UPDATE (version `3`, a fourth `versions` entry, `refresh_note` and `regen` emptied, `library-s641@bot`); receipt and
  rollback `kb/receipts/cpl_library_dsp_v3_public_s641_2026-11-12.sql`.
- **Public targets have a 25px floor (S641, #3151).** Eight targets at exactly `min-height:24px` measured 23.9 at 90% and
  133% browser zoom: the shared header's Links, Light and Dark, and five Request Adopt links. The floor sits in the vault
  sources (public header, the agency visual, tabs; CPLBrain `0e4b1091`), and seven other public pages, `library/index.html`
  and `library/adopt/` took the header's lengths. Guard `tests/public_target_floor.test.js`. A new public page takes the
  header's lengths, never `24px`.
- Five shipped records (Revise from the card, S577; the Catalog in the Share menu, #2826; ELL IET Version 5 public; Version 5 in the library look and the dated public cards; the card's quick
  revise, #2824) moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (SkyLoop)*.
- **The CPL Initiative overview** (`library/cpl-initiative-overview/`, record `cpl-initiative-overview`; Sam: *"publish the
  overview"*): in the public library's look, figures live from `live_metrics.json`; its own source, so revise it on its card.
  Every public page's header leads its Links with it (`header.html`; guarded in `tests/public_library.test.js`).
- **Still open from the ELL IET and Coordinator Guide asks:** IACA's `regen` (`iaca-mvpmcjyl`, Crystal Nasio, 2026-10-26) has no
  note or sources: it waits on what she wants changed. The Coordinator Guide's request (Sam, 2026-11-05 12:36Z, Request Adopt
  links) is done (S605): Draft 2 at the same artifact, Request Quick Adopt for Basic Military Training and the seven
  statewide recommendations the most colleges adopted, the Credential Catalog in Resources; the record moves by
  `kb/migrations/2026-11-08_library_coordinator_guide_draft2.sql` (lessons, S605). ELL IET reads 33,971 of Sierra's 34,000 characters: room for anything
  more comes out of repeated wording (the build already trims two phrases) or a `cpl-chat` cap raise.
- **Once RCCD's admin approves it, Sam connects the Microsoft 365 connector** (held, Sam, 2026-10-26); the next session after that reads the CPLLibrary folder, confirms the 16
  copies he made on 2026-10-08, and moves the three Drive-linked records and the six repo pieces to their SharePoint links
  (a guarded update per record). The Summit film's v3 cuts (S482) go into the SharePoint Drafts folder, Sam's by hand.
- **PR 2, the move (call 5), after that:** remove the deliverable binaries from `main` (the five Title 5 files can go now;
  `.gitignore` `exports/*.docx`, and `kb/_build_55050_redline_docx.py` still writes there), take the Summit film's two
  player pages off the site, and add a guard test so a deliverable binary cannot be committed again. Then the vault's
  binaries (29 on 2026-10-05).
- The noncredit visual's bullet (published 2026-11-06) moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S605)*.
- Three standing notes (the open-asks series record, a film re-render's record, Sam's sheet 47 to 49 calls) moved verbatim to
  [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (SkyLoop)*.

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
