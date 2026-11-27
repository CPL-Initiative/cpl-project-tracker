---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-11-27
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

**The check run checks a piece only at its own Pages address (S735 SkyAlvord, 2026-11-25).** `scripts/library_check.py`
plans a record only when its url is its own Pages copy (`on_pages`); a piece whose record still names claude.ai waits
with no check row and no progress line. Adult Education CPL Starting Points (`adult-ed-cpl-starting-points`) waited
that way until its url moved to `library/adult-ed-cpl-starting-points/` (guarded update, rollback beside the receipt;
memory `p-library-check-needs-pages-url-2026-11-25`). **Publish now** shows only on a card holding an approved
card-drafted revision, so a piece built in a session and copied with `library_page.py` never sees it
(`f-library-publish-now-scope-2026-11-25`); its listing is the run's after a passing check and a public summary.
**RULED (Sam, 2026-11-25):** *"can you have library auto add a summary I can edit so if I forget and click publish,
we'll still have a summary?"* (`r-library-publish-prefills-public-summary-sam-2026-11-25`) and *"the libraries sidebar
should be same height as the listview and use same font type and size. height should be optimized to window hight"*
(`r-library-sidebar-matches-list-sam-2026-11-25`). **LIVE (#3865, S736):** the top *Publish to Public Library* opens
the form, prefilled from the internal summary; the sidebar matches the list's height and type; a waiting piece shows its
progress (steps, a bar, and the next `library-publish.yml` run, cron `41 */3 * * *` UTC, a check waits up to three
hours: `f-library-check-runs-every-3h-s736`) and offers *Add its public summary* while it waits. *File a new version* is
gone (Sam: *"the file feature is not needed"*). A page under `library/` carries the vault's canonical header (`public-header/apply.py --tracker-logos ../../sierra/`), never the Catalog's adapted copy
(`tests/library_pages.test.js`).

**PITFALL (S735): a session cannot write `public_summary` or any other public field.** `cpl_library_guard_public`
refuses every write of a piece's public fields except through `cpl_library_set_public()` with the team phrase or a
reviewer sign-in, the service role's migration included (migrate run 45719960204: *"Listing in the public library
needs the team phrase or a reviewer sign-in"*). The S735 summary migration was withdrawn from #3864, so
`adult-ed-cpl-starting-points` holds `public_summary` NULL; a person signed in adds it from the card's *Publish to
Public Library* form, which #3865 prefills from the internal summary.

**Adult Ed CPL Starting Points failed its first check** (19 findings: target size, the eyebrow's contrast, the column
grip's aria); #3868 fixed them and the re-check passed at 01:13Z 2026-11-26 with 0 findings. A card must say a failed
first check plainly, since the piece looks finished. **NEXT:** Sam adds its public summary with *Publish to Public
Library* on the card (`public_summary` is still NULL), then the next library-publish run lists it; CPLBrain#870 (the
page's vault source) needs #3868's edits.

**LIVE: Publish now shows one status line (#3562, `0159aacb`; Sam's test of Nov 19, COBIx on #3560).** Publishing,
Deploying, Live (only once the page's own address answers), or Failed with the function's reason (`not_configured`,
`token_refused` named). Guard `tests/library_publish_now.test.js`.

**LIVE: the publishing model and the check run (#3560 parts 1 and 2; #3572, #3577, #3581):** a listing needs a passing check at the page's current version key and url; the paragraph as it stood, with its DECIDED lines and guards: [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S744 checkpoint)*.

**#3600 (S690, `9fc88a07`): the check line stays out of the reading text and out of new pieces** (the paragraph as it stood: [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S736 checkpoint)*). **Not deployed:** `cpl-chat-deploy.yml` for `cpl-chat` and `library-revise-draft` waits for a plain session.

**NEXT (#3560):** deploy #3600 (a plain session); read the failing piece's findings on its card; then part 4 (Publish all, Add existing, redraft and republish), then part 3 (the progress bar). A plain session's work; conductor runs stay on collection.

✅ **The tab is built** (`library.js`, under *Sierra & Team Tools*, 2026-10-05): it reads `cpl_library` live behind the team phrase; Add, File it, Edit and Retire write to the table, nothing deletes, and a trigger files every prior row in `cpl_library_history`. Schema `kb/supabase_cpl_library.sql`; test `tests/library.test.js`. The paragraph as it stood: [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S690 checkpoint)*.

✅ **A piece's link beside a file** (2026-11-09, #3000): moved verbatim to the lessons, *Moved from the lane (tender-fermi, 2026-11-10)*.

✅ **Any file, and a new piece drafted on its card** (#3077): `docs/library_lessons.md`, *Moved from the lane (S667 checkpoint)*.

✅ **Start a piece is built** (2026-10-06): moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S686 light checkpoint)*.

✅ **The public library is built** (2026-10-20): one record and a switch, never a copy; `cpl_library_set_public()` lists, `cpl_library_public()` (anon) serves `library/` and the Admin tab's panel. Schema `kb/supabase_cpl_library_public.sql`; test `tests/public_library.test.js`; `npm run a11y -- public-library public-library-dark` (a bare `library` is not a target). The paragraph as it stood: [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S690 checkpoint)*.

✅ **The page in Malone's look, the box's line beside its field, the public 25px target floor, the CPL Initiative overview, the JST guide, version stamps off Pages, Create as one form and DSP Version 3:** moved verbatim to [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S735 checkpoint)*.

✅ **The team phrase lists publicly too** (Sam, 2026-10-23; `cpl_library_set_public()` takes `team_pass_ok()` or `is_allowed_reviewer()`): moved verbatim to the lessons, *Moved from the lane (SkyWhirlpool, 2026-11-11)*.

✅ **Who a piece is made for** (Sheet 120, built S459: `for_kind`, `for_category`, `for_name`; **Make a visual**): the paragraph as it stood, [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S690 checkpoint)*.

✅ **New pieces and the drafter's data (Sam with Ashley Mooney, 2026-11-18; #3527, #3532; DECIDED
`d-library-duplicate-is-a-warning`, `d-library-start-drafts-and-reads-cobi-data`).** A duplicate is a warning with three
choices, and only on a matching working title and occasion. Start drafts at once on the piece's card. A no-change draft
offers Change what you asked. The drafter reads any COBI table or published file (`cobi_data.mjs`); a student count
under 10 reads `<10`; buttons open the college's MAP landing page (`reference_data.mjs`). Deployed (cpl-chat-deploy runs
107, 108). The full record: [`library_lessons.md`](../../library_lessons.md), *Moved from the lane (S683 Library side
job)*.

**LIVE (#3909, S744): a Library button opens the landing page on its exhibit.** MAP's landing page takes
`?Exhibit=<MAP ID>` (Pedro, relayed by COBIx, 2026-11-27; `f-map-landing-exhibit-param-pattern-s744`): the code fills the page's search box and lists that exhibit's
courses; Possible Qualifications stays unpicked. `reference_data.mjs` `landingButton`/`exhibitParam` pass only codes
MAP accepts (the pattern and its limits: [`reference-map-landing-page-exhibit-parameter`](../../kb-notes/reference-map-landing-page-exhibit-parameter.md));
the pick instruction is gone and the drafter is told in `cobi_data.mjs`. Four codes MAP itself refuses (Chaffey
MAPICI-BP&C-1-001, Laney MAPICI-E&ET-1-001, Modesto Junior MAPICI-E3S--1-001, Cerritos MAPCXA-E&R-1-001) open the page
alone; renamed, they would work, which is worth passing to Pedro. Cerritos's landing slug on file is `/www.cerritos.edu`.

**The Cable Splicer flyer waits on Sam's press** (`cable-splicer-cpl-opportunities-mwmo31a1`, Apprenticeship Sprint, for
San Joaquin Adult School; draft, not publicly listed, has a Pages copy). Its five college buttons go to bare landing
pages. The re-point is *Revise* on its card with the ask *"Point each college's Request CPL button at its exhibit on
the landing page."*; a session cannot call the revise function. Expected buttons: Cabrillo `CABC?Exhibit=MAPICP-GEC-1-001`
(all 4 courses, live-checked); Chaffey `CHC?Exhibit=MAPCXS-ITE1-1-001,MAPCXS-OST-1-001` (not live-checked); Laney the
landing page alone (only a `&` code); Modesto Junior `MJC?Exhibit=MAPCXS-E2OE-1-001,MAPPRA-E2RF-1-001` (2 of 3; ELTEC 320
has only `--` codes); Norco its IBEW codes (6 of 10). **Open question:** no record exists for "Foothill Sheet Metal"
(Sam named it); is it filed under another title? **NEXT:** the re-point (Sam's press); Ashley's remaining flyers through
Start (her press or Sam's); read the logged usage of a tool-reading draft (`library-revise-draft usage`) to see what one
costs.

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
- **Reading the folder** and **the tab's home label** moved verbatim to the lessons, *Moved from the lane (S643)*.

**What stays in a repo** moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S643)*.

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

- **Library records for the S745 sketches (CPLBrain CLAUDE.md: an artifact made to share gets a record).** PPM
  https://claude.ai/artifact/4rRKYwJaeTwXmfiYQ6DW7v and ASSIST https://claude.ai/artifact/Vi6yN9NUH2cckKJYqt7KxQ, home
  `web`, sources in `CPLBrain/04-projects/cpl-initiative/connections/`, through a committed receipt; private until Sam
  shares them. **NEXT:** write the records, with Trained by (https://claude.ai/artifact/VbgjS2qtA86E8CUDHJvQxe); CVC joins when built.
- **DECIDED (S669, 2026-11-16): the Credential Catalog (`library/adopt/`), #3405 built.** #3406: the Statewide and
  CPL-AI figures are header boxes that still filter; the introduction starts closed, review cards are short until
  opened, field groups fold (`cpl_catalog_folds`, layout only); Clear all filters sits by the chips. #3407: 16
  not-yet-evaluated credentials carry a CPL-AI course match chip by folded title and issuer (Certiport's Swift row held
  out; never from CIP alone). **NEXT:** COBIx's next step, scoring the 185 unreviewed credentials with issuer skill
  areas against harvested outcomes in `kb/_build_adopt_align.py` (a chip only for a clear standout at 0.20).
- **Publish now and one queue check (S642, S643, S648):** shipped and deployed; detail moved verbatim to
  [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S669)*.
- **Pictures in a piece (Sam, 2026-11-11, #3095):** `cpl_library_pictures`, placed by `pictures.mjs`, checked on the card, written to `library/<slug>/img/`; tests `library_pictures`. The record: [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S690 checkpoint)*.
- **Owed to COBIx on the next Library change:** the `style=` entity pattern in either quote or unquoted
  (`apply_edits.mjs` RISKS, `library_publish.py` _RISKS); `tests/pages_size_guard.test.js` walking `kb/` minus
  `kb/receipts`; Leave it out on a published picture opens a request that replaces the public copy (the file stays
  served until the piece's next publish); a replace-at-once draft with pictures shows the box and a publish step (the
  run skips it every pass); the box's line counts the pictures kept (`fresh.length`), not found.
- **The Veteran map and the Fact Sheet's public header** (minor NEXT: the vault's `header.html` lacks `aria-current`): verbatim in [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S745 checkpoint)*.
- Five shipped records (Revise from the card, S577; the Catalog in the Share menu, #2826; ELL IET Version 5 public; Version 5 in the library look and the dated public cards; the card's quick
  revise, #2824) moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (SkyLoop)*.
- **Four open rows, each waiting on a person (S650; DECIDED `d-library-four-wait-on-people-s650`).** Ally Barker's
  "How to confirm and qualify for CPL funding": Draft 2 (`b18c5759`, S647, #3216) is stored on `...mwdvs6l1`, her card,
  and waits on her *Publish it*; `...mwdv9pl5` is its superseded duplicate, and retiring it is her press. Receipt
  `kb/receipts/cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.sql` (its `_rollback.sql` restores
  from `cpl_library_history`). "Adding CPL Coordinator & Noncredit Lead to MAP" (`...mwauxci5`) has ready draft
  `7a26c199` (2026-11-12 18:04Z), which answers her note (the MAP login link, the two role names bold, *Open Ambassador
  Module*, pictures 25% smaller); pictures 4, 5 and 14 show names or emails and need covering before it publishes. IACA's
  `regen` (`iaca-mvpmcjyl`, Crystal Nasio) waits on her file, a SharePoint deck a session cannot read. ELL IET reads
  33,971 of Sierra's 34,000 characters. The paragraph as it stood: lessons, *Moved from the lane (S650 checkpoint)*.
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

✅ **① One card per project and ② the one panel are built (S509, #2538).** Their records moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S650 checkpoint)*.

✅ **③ Remediation in the browser (S509) and ④ ⑤ the contrast checks (S510, S511) are built.** Their summaries moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S653b, T9)*.

✅ **⑥ to ⑰ are built** (S512 to S576): `docs/library_lessons.md`, *Moved from the lane (S667 checkpoint)*.

✅ **⑪ Revise and remediate from the one box** (Sam, 2026-10-29; S520's side session): the paragraph as it stood, [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S690 checkpoint)*.

**The Chancellor's address** is on Pages with its film: lessons S531.

**FILED (S661): the College Collections Plan** at `library/college-collections-plan/`, record `college-collections-plan` (draft, seen by the team, not publicly listed): the paragraph as it stood, [`library_lessons_archive_3`](../../library_lessons_archive_3.md), *Moved from the lane (S690 checkpoint)*.
