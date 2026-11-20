---
title: "Library / where decks, films and documents live — lane state"
created: 2026-10-05
updated: 2026-11-20
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

**LIVE: Publish now shows one status line (#3562, `0159aacb`; Sam's test of Nov 19, COBIx on #3560).** Publishing,
Deploying, Live (only once the page's own address answers), or Failed with the function's reason (`not_configured`,
`token_refused` named). Guard `tests/library_publish_now.test.js`.

**BUILT in #3572, its three migrations applied (runs 44621258767, 44624282220, 44628207752): the publishing model, #3560 part 1 of 4
(S687; Sam's decisions of Nov 19 via COBIx).** A new piece's ready draft has two buttons, exactly *Publish to Internal Library* and *Publish to Public
Library*; no approval from Sam. Internal approves the draft; one press starts the publish run at once only for a
signed-in reviewer (Publish now's holds and one status line), and a team-phrase press waits for the scheduled run
(every three hours). Public shows *"This lists it in the Public Library, where anyone can find
it."*, does the same, and keeps `cpl_library.publish_target = 'public'`; a piece already on its page lists at once
through `cpl_library_set_public()` only with a passing check record for its page, and otherwise waits; a waiting
piece whose page check passes offers the listing form again. The function itself refuses a listing without that pass
(the service role exempt, unlisting unchanged), so the tab is not the only gate.
The card then carries *In the Public Library*. List publicly is retired. Removing a piece from the Public Library
leaves it in the Internal Library (a trigger resets `publish_target` on any unlisting). Template: a checkbox in Edit
the record, a chip, a Templates filter (cleared at the next visit), templates first in the finder and at the head of
a new draft. Details shows the check record under Sam's labels. Schema
`kb/migrations/2026-11-19_library_publishing_model.sql` (`cpl_library_checks`, `cpl_library_division_settings`
seeded with `cobi` and *WCAG 2.1 AA and Section 508*; columns `publish_target`, `template`, `division`); without it
the tab publishes to the Internal Library and Public says the check record is not available yet. Guard
`tests/library_publishing_model.test.js`, `tests/public_library.test.js`, and `tests/library_publishing_sql_proof.py`
(the migration and its rollback against a throwaway Postgres, in `js-tests.yml`).
- DECIDED (S687, `d-library-check-per-version-key-s687`): a check covers one version key: `draft:<draft id>` for a card draft ready or approved and not yet
  published, `version:<version>` for the page, `page` for a page with no number. Listing reads the page's key alone
  (second read of #3572), in the tab and in `cpl_library_set_public()`; the draft's key speaks only to a new piece's
  Public confirmation. A draft's check never carries to the page, which is checked again once it is up.
- DECIDED (S687): the rollback refuses while `cpl_library_checks` holds rows, since nothing else keeps them.
- DECIDED (S687 conductor, on COBIx's #3572 comments 7022946691, 7023361983 and 7023581179;
  `d-library-new-page-unlists-s687`): a listed piece leaves the Public Library when its `url` or its `version`
  changes, always (S688 part 2 dropped the version exception, `d-library-check-after-page-change-s688`). It keeps `publish_target = 'public'` so part 2's run checks the new page and lists it again. Every writer, the service
  role included, since unlisting is the safe direction. Until part 2 relists, this overrides Sam's "a Public Library
  piece stays listed while redrafted, showing the last published version" (Nov 19, item 9; his to reverse): a draft
  stays a draft and unlists nothing, and only a published new version or a new url does. Trigger
  `cpl_library_unlist_new_page_trg`: `kb/migrations/2026-11-19_library_relist_on_new_version.sql` (applied, run
  44624282220), its url rule `kb/migrations/2026-11-19_library_unlist_on_url_change.sql` (applied, run 44628207752; it also
  corrects the memory row's summary with a guarded UPDATE).
- DECIDED (S687, `d-library-internal-one-press-s687`): Publish to Internal Library approves a new piece and starts the
  publish run in one press for a signed-in reviewer, through Publish now's holds; a team-phrase press waits for the
  scheduled run.
- DECIDED (S687, `d-library-3560-in-four-prs-s687`): #3560 lands in four PRs, one after another, since its asks share
  `library.js`: 1 the two publish buttons, Template and the check gate (#3572); 2 the check run and the footer; 3 the
  progress bar; 4 Publish all, Add existing, redraft and republish. Memory rows: run 44624406317.
- Known limit (S688 part 2): a check names a version key, a url and a time, not the page's bytes, so content that
  changes at the same url and version keeps the last check's listing and line: a session's `scripts/library_page.py`
  rebuild, a hand commit, or a page `--finish` left for the next run once that run is over (the run that wrote it
  stamps Not yet certified; a later run's line follows the record again). A content hash on the check row, matched
  against the served page, closes it later. A session that rebuilds a listed page bumps its version so the record
  moves and the run checks it.
- DECIDED (S688 conductor, COBIx on #3572, 7023899407; `d-library-check-binds-url-s688`): a check binds to the url it
  checked (`cpl_library_checks.url`). `cpl_library_set_public()` counts a pass only at the record's current url and
  key, so the old url's pass never relists a moved piece. Old rows keep a null url, which
  matches nothing. Part 2's check run must write `url` on every check row.
  `kb/migrations/2026-11-19_library_check_binds_url.sql`, not yet applied.
- DECIDED (S687): a new piece pressed to Public is never listed at the press (it has no page yet); part 2's check run
  lists it once its page passes. Only the service role writes a check, so the tab never certifies a piece.
- DECIDED (S687): Replace the public copy on a revision is unchanged until part 4 (redraft and republish).

**BUILT, not yet run (#3560 part 2, S688; Sam's order of Nov 19 via COBIx, comment 7025524965): the check run, list
on a pass, the footer line, and the tab's url-aware pre-check.** After `--finish` moves the records,
`library-publish.yml` plans (`scripts/library_check.py --plan`), installs Node and Chromium only when a page needs
checking, then `--check`: each page writes the line it will show on a pass, `scripts/a11y.js` checks it through
`scripts/library_check.config.js` (Light at nine widths, Dark at two; geometry, paint and axe-core's WCAG 2.0 to 2.2 A
and AA rules; `--json` gives one result per target), a plain-words report lands at
`library/<slug>/accessibility/<time>.txt`, and one `cpl_library_checks` row per page goes in with the service key
(record's current url and key, the division's standard and tool, pass or fail, findings, the report's Pages address,
`created_by` = `library-publish.yml run <id> attempt <n>`, `checked_at` the database's). The receipt
(`kb/receipts/library_checks/`) is written as soon as the rows are in; every Library page's line is rewritten from the
rows written before any listing; each listing's before-values join the receipt before its update, and one failed
listing never stops the next (the step goes red at the end). A page whose version label the table's key check refuses
is skipped with its reason in `check.json` and on the card, and the rest of the batch goes in. A second commit carries
lines, reports and the receipt: whatever is on disk is what the receipt proves. Both push loops fail their step after
three failed pushes, and Pages deploys though a check step failed. Schema
`kb/migrations/2026-11-20_library_check_after_page_change.sql` (apply after `..._check_binds_url.sql`). Tests
`tests/library_check_test.py`, `tests/library_check_footer.test.js`, `tests/library_publishing_model.test.js` (I),
`tests/library_publishing_sql_proof.py`.
- DECIDED (S688, `d-library-check-run-on-publish-s688`): the run checks every page it published and every piece waiting
  on the Public Library with no check since its page changed; a page whose check failed waits for a new version, and the
  run never checks the same page twice. Only a page at its own Pages address (`library/<slug>/`) is checked; a piece
  elsewhere (claude.ai, SharePoint) reads Not yet certified until it has a Pages copy.
- DECIDED (S688, `d-library-run-lists-by-guarded-update-s688`): the run lists a passing piece whose `publish_target` is
  `public` by writing the columns `cpl_library_set_public()` writes, as the service role (the guard trigger admits it),
  guarded on the record as read and on the url and version checked. `set_public()` refuses the service key at its first
  gate (no phrase, no reviewer email), and widening it would add a writer path. The pass must be no older than the
  record's `page_changed_at`, as in `latest_check` and the tab.
- DECIDED (S688 conductor, second read of #3581; `d-library-list-needs-typed-summary-s688`): the run lists only a piece
  that already holds a `public_summary` a person typed; it never copies the internal summary or the title. Otherwise
  the piece waits, and the card says *"Its accessibility check passed. The Public Library lists it once it has a public
  summary: press Publish to Public Library and add one."*
- DECIDED (S688, `d-library-footer-from-check-s688`): one marked line before the Ask Sierra script, from the latest
  check at the page's key and url since its last change; none or a fail reads the division's Not yet certified. The run
  stamps the pass line before it checks, so the page checked is the page served; a fail puts Not yet certified back.
  `{report}` links "report"; the CPL Initiative's template has none, so its words "report linked" carry the link.
  `library_publish.py --write` stamps Not yet certified (a copied line never speaks for a new page), and
  `scripts/library_page.py` keeps the line a rebuilt page carried. Colors are the public header's tokens.
- DECIDED (S688 conductor, second read of #3581; `d-library-footer-pass-only-on-own-check-s688`): the line prints a pass
  only for a page whose check row this run or an earlier one wrote at its current key, url and `page_changed_at`. A
  page this run wrote but did not check (`--write`'s pages that `--finish` left for the next run) reads Not yet
  certified, though its record still holds the earlier version's pass.
- DECIDED (S688, `d-library-check-after-page-change-s688`): every version of a Pages piece shares one url, so the url
  binding alone left a relabel open (v5 set back to "4", which passed). `cpl_library.page_changed_at`, stamped by a
  trigger on any url or version change and held against a hand-set value, closes it: `set_public()` counts a pass only
  at or after it, and a listed version change always unlists.
- DECIDED (S688, `d-library-tab-precheck-url-s688`): `library.js` `latestCheck` reads the newest check per piece,
  version key and url, no older than `page_changed_at`; a draft key reads the draft's newest. A waiting piece whose check
  failed says so, with the findings count and The check report.

**NEXT (#3560):** apply `2026-11-19_library_check_binds_url.sql`, then `2026-11-20_library_check_after_page_change.sql`
and the part 2 memory rows; part 3, the progress bar; part 4, Publish all, Add existing, redraft and republish.

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

✅ **Any file, and a new piece drafted on its card** (#3077): `docs/library_lessons.md`, *Moved from the lane (S667 checkpoint)*.

✅ **Start a piece is built** (2026-10-06): moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S686 light checkpoint)*.

✅ **The public library is built** (2026-10-20, DSP side session). One record and a switch, never a copy
(*"Copy or move...to save space"*): **Publish to Public Library** (List publicly until #3560) on a record in the Library tab sets `public_listed` through
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

✅ **New pieces and the drafter's data (Sam with Ashley Mooney, 2026-11-18; #3527, #3532; DECIDED
`d-library-duplicate-is-a-warning`, `d-library-start-drafts-and-reads-cobi-data`).** A duplicate is a warning with three
choices, and only on a matching working title and occasion. Start drafts at once on the piece's card. A no-change draft
offers Change what you asked. The drafter reads any COBI table or published file (`cobi_data.mjs`); a student count
under 10 reads `<10`; buttons open the college's MAP landing page (`reference_data.mjs`). Deployed (cpl-chat-deploy runs
107, 108). The full record: [`library_lessons.md`](../../library_lessons.md), *Moved from the lane (S683 Library side
job)*. **Waiting on MAP:** `?Exhibit=<MAP ID>` on the landing-page template (Sam asked Malone and Pedro); when it ships,
`landingButton` is the one line that changes. **NEXT:** Ashley's first new pieces through Start; read the logged usage
of a tool-reading draft (`library-revise-draft usage`) to see what one costs.

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

- **DECIDED (S669, 2026-11-16): the Credential Catalog (`library/adopt/`), #3405 built.** #3406: the Statewide and
  CPL-AI figures are header boxes that still filter; the introduction starts closed, review cards are short until
  opened, field groups fold (`cpl_catalog_folds`, layout only); Clear all filters sits by the chips. #3407: 16
  not-yet-evaluated credentials carry a CPL-AI course match chip by folded title and issuer (Certiport's Swift row held
  out; never from CIP alone). **NEXT:** COBIx's next step, scoring the 185 unreviewed credentials with issuer skill
  areas against harvested outcomes in `kb/_build_adopt_align.py` (a chip only for a clear standout at 0.20).
- **The JST guide (S642):** record `7ca43e3c`, Version 1 (commit `41eeb44a`); `public_listed` false: Publish to Public Library
  is the team's press once its check passes, linked from the funding dashboard's 75% JST condition.
- **Publish now and one queue check (S642, S643, S648):** shipped and deployed; detail moved verbatim to
  [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S669)*.
- **Pictures in a piece (Sam, 2026-11-11, #3095):** a PDF's pictures are cropped in the browser (`readPictures`),
  saved in `cpl_library_pictures`, placed by the drafter through a marker (`pictures.mjs`), checked on the card (Cover
  or crop, Leave it out; `regen.pictures_checked_by`), and written to `library/<slug>/img/` by `library_publish.py`. A
  picture once published stays in the repo's history. A PowerPoint is saved as PDF first. Tests: `library_pictures`
  (44). The full record: lessons, *Moved from the lane (SkyWhirlpool, 2026-11-11)*.
- **Owed to COBIx on the next Library change:** the `style=` entity pattern in either quote or unquoted
  (`apply_edits.mjs` RISKS, `library_publish.py` _RISKS); `tests/pages_size_guard.test.js` walking `kb/` minus
  `kb/receipts`; Leave it out on a published picture opens a request that replaces the public copy (the file stays
  served until the piece's next publish); a replace-at-once draft with pictures shows the box and a publish step (the
  run skips it every pass); the box's line counts the pictures kept (`fresh.length`), not found.
- **A draft read off Pages drops its version stamps** (#3097; `unstamp`): lessons, *Moved from the lane (S653b)*.
- **The box says what it did beside its field (Sam, 2026-11-11, #3097):** *"the text showing they uploaded is below
  the window of view and I thought nothing happened when I first clicked"*. The line shows inside the card's box under
  the document field; a file added twice says so and saves its words and pictures once.
- **Create is one form** (Sam, 2026-11-06): lessons, *Moved from the lane (S653b)*.
- DSP Credit Starting Points, Version 3 in public (S641, #3151): lessons, *Moved from the lane (S646)*.
- **Public targets have a 25px floor (S641, #3151).** Eight targets at exactly `min-height:24px` measured 23.9 at 90% and
  133% browser zoom: the shared header's Links, Light and Dark, and five Request Adopt links. The floor sits in the vault
  sources (public header, the agency visual, tabs; CPLBrain `0e4b1091`), and seven other public pages, `library/index.html`
  and `library/adopt/` took the header's lengths. Guard `tests/public_target_floor.test.js`. A new public page takes the
  header's lengths, never `24px`.
- **The Veteran map and the Fact Sheet carry the public header (S653b).** The Veteran map (S651, #3294 `f0339e38`): built
  in `build_selfcontained.py`, hidden under `?embed=1` so COBI's Military Partnerships iframe stays one column; since #3333
  it embeds the 480px logos. Guard `tests/veteran_map_public_header.test.js`. The Fact Sheet (#3333 `908d9b8d`, read live
  19:51Z 2026-11-14): in `fact-sheet/index.html`, between the skip link and the masthead; the masthead is a `div`, so the
  page has one banner; nothing frames the page, so it has no embed case. Guard `tests/factsheet_public_header.test.js`.
  **DECIDED:** the Fact Sheet shows one logo, the CPL Initiative's, in the header; the masthead's California Community
  Colleges-only logo is out (Sam, in session S653b, 2026-11-14: "Don't need the ccc logo added to the top of fact
  sheet. Leave masthead in." then "Confusion by me on masthead vs header. I just want the ccc Cpl back in and the ccc
  only logo out"; then "Picture 2: CPL logo only"; `sam-fact-sheet-no-header-logo-2026-11-14`; #3342).
  **DECIDED:** the header carries the page's controls, moved whole (same ids): map.rccd.edu, the snapshot chip, Collapse
  all, Print or save; the masthead is the title. On paper the header prints its logo, the map link and the chip (Sam,
  S653b, 2026-11-14: "2 is right. Can you move all the buttons and map website link and update chip all into the header
  to clean up the title?"; `sam-fact-sheet-controls-into-header-2026-11-14`; #3342).
  **NEXT (minor):** the vault's `header.html` has no `aria-current`, so the Fact Sheet's own "CPL Fact Sheet" link opens a
  second copy; that test checks the links against the Veteran map's copy, not the vault's header; a theme choice
  on a public page sets `cpl_theme` for the whole github.io origin, COBI included (the existing design). Records: lessons,
  *Moved from the lane (S651 checkpoint)* and *(S653b)*.
- Five shipped records (Revise from the card, S577; the Catalog in the Share menu, #2826; ELL IET Version 5 public; Version 5 in the library look and the dated public cards; the card's quick
  revise, #2824) moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (SkyLoop)*.
- **The CPL Initiative overview** (`library/cpl-initiative-overview/`, record `cpl-initiative-overview`; Sam: *"publish the
  overview"*): in the public library's look, figures live from `live_metrics.json`; its own source, so revise it on its card.
  Every public page's header leads its Links with it (`header.html`; guarded in `tests/public_library.test.js`).
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

✅ **⑪ Revise and remediate from the one box (Sam, 2026-10-29; built by S520's side session).** The box finds a piece
already here (by a label naming its kind, its link, a file named for it, or the card's Revise and remediate or Edit) and asks
what to do with it; long instructions go whole into `sources`, and every rebuild is remediated. The record moved verbatim to
[`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S520's side session)*.

**The Chancellor's address** is on Pages with its film: lessons S531.

**FILED (S661): the College Collections Plan** (Sam, in session: *"Make a Visual for the Moonshot plan and add it to the Library and call it 'College Collections Plan'"*): the #3111 v2 agreed final on one page at `library/college-collections-plan/` (source in the vault, `04-projects/cpl-initiative/college-collections-plan/`), record `college-collections-plan` (draft, seen by the team, not publicly listed; receipt `kb/receipts/library_college_collections_plan_s661_2026-11-15.sql`). The full College Collections ETA opens it in a new tab.
