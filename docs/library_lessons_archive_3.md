---
title: The Library — lessons, archive 3 (the lane's text moved at the S690 checkpoint, 2026-11-20)
date: 2026-11-20
tags: [lessons, library, archive]
related:
  - "[[docs/library_lessons]]"
  - "[[docs/library_lessons_archive_2]]"
  - "[[docs/reference/lanes/library]]"
---

# The Library — lessons, archive 3

Moved verbatim from `docs/reference/lanes/library.md` at the S690 checkpoint (2026-11-20), when the lane passed its
20,000-byte budget; `docs/library_lessons.md` sits near its own 120 KB budget, so the text lands here. Relative links
are re-pointed to this folder. The lane keeps the current text.

## Moved from the lane (S690 checkpoint)

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
- Known limit (S688 part 2): what is left is the tab's and `cpl_library_set_public()`'s view between runs. A check
  row names a version key, a url and a time, not the page's bytes, so from a content change at the same url and version
  (a session's `scripts/library_page.py` rebuild, a hand commit, a page `--finish` left for the next run) until the next
  run, a team press of Public can list the page on the earlier page's pass while its line reads Not yet certified. The
  next run closes it: `--plan` sees the drift, `--check` takes a listed piece off before its new check, and only a pass
  of the new content relists it. A content hash on the check row, matched against the served page, would close the gap
  between runs.
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
(`kb/receipts/library_checks/`) is written as soon as the rows are in, and every Library page's line is rewritten from
the rows written. `--plan` also plans any page whose content on disk differs from its latest check's committed sha (or
has no proof), and `--check` first takes a listed one off the Public Library when it has a passing check its page no
longer matches (guarded, before-values in the receipt, `publish_target` put back to `public`). `--check` lists nothing: `--list` is its own step, after the checks commit is
pushed and only when that push succeeded, reading the waiting passes from `check.json`; each listing's before-values
join a listing receipt before its update, which a last commit carries, and one failed listing never stops the next (the
step goes red at the end). A page whose version label the table's key check refuses
is skipped with its reason in `check.json` and on the card, and the rest of the batch goes in. A second commit carries
lines, reports and the receipt: whatever is on disk is what the receipt proves. Both push loops fail their step after
three failed pushes, and Pages deploys though a check step failed. Schema
`kb/migrations/2026-11-20_library_check_after_page_change.sql` (apply after `..._check_binds_url.sql`). Tests
`tests/library_check_test.py`, `tests/library_check_footer.test.js`, `tests/library_publishing_model.test.js` (I),
`tests/library_publishing_sql_proof.py`.
- DECIDED (S688, `d-library-check-run-on-publish-s688`): the run checks every page it published and every piece waiting
  on the Public Library, and every Library page whose content differs from its latest check's committed sha or has no
  proof; a page whose check failed waits for new content, and the run never checks the same content twice. Only a page at its own Pages address (`library/<slug>/`) is checked; a piece
  elsewhere (claude.ai, SharePoint) reads Not yet certified until it has a Pages copy.
- RULED (Sam, Nov 19, 2026, 7:32 PM PT, relayed by COBIx on #3581,
  [7029505105](https://github.com/CPL-Initiative/cpl-project-tracker/pull/3581#issuecomment-7029505105);
  `r-library-legacy-listings-stay-sam-2026-11-19`, keeping `d-library-legacy-listings-stay-s688` as written): *"The 21
  pieces listed today stay on the Public Library as "Not yet certified" while their findings are fixed. They are not
  taken off when the first check fails."* A legacy listing, listed with no passing check at its current key and url,
  stays listed whatever its checks find; a failed check shows its findings on the card for the team to fix. The
  exception covers only those legacy listings: anything new, and any version or url change, still lists only on a pass.
  From a piece's first pass on, the drift rule applies. The rule is `drift_unlists` in `scripts/library_check.py`.
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
  `scripts/library_page.py` writes Not yet certified on every page it builds. Colors are the public header's tokens.
- DECIDED (S688 conductor, third round on #3581; `d-library-footer-binds-page-hash-s688`, replacing the per-run hold
  list): each check records `content_hash`, the sha256 of the page it checked with the accessibility line taken out, in
  a committed JSON beside its report (`library/<slug>/accessibility/<time>.json`, with the check row's id, key and url).
  The restamp prints a pass only when the record's latest check (current key and url, no earlier than
  `page_changed_at`) has that proof and its sha equals the page on disk now; every other page, a rebuilt page or one
  `--finish` left included, reads Not yet certified, in any later run too. An insert that errs reads back the rows that
  landed by `created_by`, so they get their receipt, proof and line.
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

✅ **The public library is built** (2026-10-20, DSP side session). One record and a switch, never a copy
(*"Copy or move...to save space"*): **Publish to Public Library** (List publicly until #3560) on a record in the Library tab sets `public_listed` through
`cpl_library_set_public()`; a trigger refuses the public columns any other way, and retiring a piece or narrowing its
audience unlists it. `cpl_library_public()` (anon) returns the listed pieces' public fields only, to the page at
`library/` and the Admin tab's **Public library** panel (Remove beside each). A Claude page also needs its claude.ai
link set public, which the switch asks the lister to confirm. Schema `kb/supabase_cpl_library_public.sql`; test
`tests/public_library.test.js`; `npm run a11y -- public-library public-library-dark` (the targets' names; a bare
`library` is not one).

✅ **Who a piece is made for (Sam's Open Asks Sheet 120, 2026-10-23; built S459):** `for_kind` (college, district,
agency, vendor, co, other), `for_category` (Other's typed category) and `for_name` under one check; the tab filters on
them and every form takes them, a college's name from MAP's `map_colleges`. **Make a visual** writes a college's CPL
Opportunity record pair in one step, and opens Start a piece for any other entity, naming the agency template
(`CPLBrain/04-projects/cpl-initiative/agency-visual/build.py`). The rulings, the build and the six asks as put to him
are in `docs/library_lessons.md`, *Moved from the lane (S467)*, verbatim; Sam's 2026-10-05 rulings, his calls 7 to 9
and the Drive filing history moved there with them.

- **Pictures in a piece (Sam, 2026-11-11, #3095):** a PDF's pictures are cropped in the browser (`readPictures`),
  saved in `cpl_library_pictures`, placed by the drafter through a marker (`pictures.mjs`), checked on the card (Cover
  or crop, Leave it out; `regen.pictures_checked_by`), and written to `library/<slug>/img/` by `library_publish.py`. A
  picture once published stays in the repo's history. A PowerPoint is saved as PDF first. Tests: `library_pictures`
  (44). The full record: lessons, *Moved from the lane (SkyWhirlpool, 2026-11-11)*.

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

✅ **⑪ Revise and remediate from the one box (Sam, 2026-10-29; built by S520's side session).** The box finds a piece
already here (by a label naming its kind, its link, a file named for it, or the card's Revise and remediate or Edit) and asks
what to do with it; long instructions go whole into `sources`, and every rebuild is remediated. The record moved verbatim to
[`docs/library_lessons.md`](library_lessons.md), *Moved from the lane (S520's side session)*.

**FILED (S661): the College Collections Plan** (Sam, in session: *"Make a Visual for the Moonshot plan and add it to the Library and call it 'College Collections Plan'"*): the #3111 v2 agreed final on one page at `library/college-collections-plan/` (source in the vault, `04-projects/cpl-initiative/college-collections-plan/`), record `college-collections-plan` (draft, seen by the team, not publicly listed; receipt `kb/receipts/library_college_collections_plan_s661_2026-11-15.sql`). The full College Collections ETA opens it in a new tab.

## Moved from the lessons (S735 checkpoint, 2026-11-25): S511 to S518

## A Word document's contrast (S511 SkyBilberry, 2026-10-29)

- **Word writes the resolved hex in `w:color`'s `val` beside a `themeColor`**, so `val` wins when it is a hex; the theme
  and its tint or shade are the fallback for files a generator wrote.
- **A table style can shade a header row the cell itself never names.** Measuring such a cell's text against the page
  would report white on white; the reader names it for a person instead.
- **A finding can be text nobody sees.** The spring update ends a paragraph with a white run on white ("— Spring 2026"),
  invisible on the page and read aloud by a screen reader. The finding is right; the fix is to delete the run.

## Headers, footers and text boxes in a Word document's contrast (S512 SkyCloudberry, 2026-10-29)

- **A text box is written twice.** Word keeps a VML copy of each DrawingML text box in `mc:Fallback`, with the same
  words; reading every `w:r` counted each run twice. The reader skips `mc:Fallback`, and the fix lands on the
  `mc:Choice` copy, which Word 2010 and later draw.
- **The run that holds a text box holds the box's runs.** `w:r > w:drawing > … > w:txbxContent > w:p > w:r`, so a
  run's words are only the `w:t` whose nearest run is that run; otherwise the anchor run is read with the box's words
  and its own color.
- **What the page shows through:** a box with `a:noFill`, or no fill and no theme `fillRef`, is measured on the page; a
  `fillRef` with an index (the theme's fill style), a gradient, a picture or a VML-only box is named for a person.
- **On the team's 84 Word files** the one new finding is the fact sheet's header line, `#888888` on white at 3.5:1
  (`cpl-fact-sheet-2026-02.docx`), confirmed on a render. None of the 84 holds a text box, so the boxes are proved by
  the test's fixture alone.

## A PDF is fixed at its source (S513 SkyLingonberry, 2026-10-29)

- **Office keeps a PDF's catalog in a compressed object stream.** The language, the tags and the title display live in
  the catalog; read without inflating `/Type/ObjStm`, a Word PDF looks untagged with no language. The reader inflates
  object streams and the XMP metadata only, never page content.
- **The first `/Title` or `/Lang` in a file is often the wrong one.** A bookmark carries a `/Title` and a span a `/Lang`;
  read that way the TMC titles came back as their first heading and the TMCs' language as French. Read the Info
  dictionary the trailer names and the dictionary around `/Type/Catalog`.
- **Even so, one ASCCC TMC really is French**: `2023_Nov_Law_Public_Policy_and_Society_TMC_r.pdf`'s catalog reads
  `/Lang(fr)`, so a screen reader voices its English in French. The report names a language other than English as a gap.
- **On the team's 55 PDFs** the reads agree with `pdfinfo` (creator, producer, title, tagged): 50 from Word (tagged), two
  from InDesign, a Chromium print, and an untagged macOS Quartz print (the ADT high-unit STEM letter). A Quartz print
  names no source program, so the report asks for the file it came from.
- **The report changes nothing in the PDF.** It names what the PDF carries, the program that made it, any Library
  record whose title or file name matches, and the export steps (PowerPoint's Create PDF/XPS, Word's Save As PDF, each
  with *Document structure tags for accessibility*), then offers to choose the source .pptx or .docx.

## A workbook in remediation (S514 SkyMarionberry, 2026-10-29)

The lane's NEXT after the PDF: an Excel workbook, checked the way Excel's Accessibility Checker checks one.

- **What it does.** The title from the file's name (a workbook has no heading to take it from). A sheet left at
  its default name (*Sheet1*, and the French, Spanish, German, Dutch, Italian and Portuguese defaults) is a
  *Needs you* item with a draft from the sheet's first words, cut to Excel's 31 characters and its banned
  characters. Alt text for each picture and chart in the sheet's drawing; a chart's draft comes from its cached
  numbers through the same `chartDraft` the decks use. A table with no header row, data on a sheet with no
  table (three or more rows of two or more cells), and merged cells are each one item, listed for a person.
- **A header row is listed, never switched on.** Setting `headerRowCount` makes the table's first row of data
  its headers: a judgment about the data, so it stays a person's.
- **A rename reaches everything that points at the sheet.** Formulas, data validation and conditional
  formatting on every sheet, the workbook's defined names, each chart's `c:f`, a pivot cache's
  `worksheetSource`, and `docProps/app.xml`. Each new reference is quoted (a quoted name is always valid); a
  formula's string literals and a reference into another workbook (`[1]Sheet1!`) stay. A name Excel would
  refuse (empty, *History*, a duplicate) is not written.
- **openpyxl writes relationship targets from the package root** (`/xl/worksheets/sheet1.xml`). The shared
  `Doc.rels` joined them to the part's folder and found no sheets, so the first run on our own exports
  reported nothing. It now reads a leading slash from the root, for decks and documents too.
- **A chart's large values read whole** (`12,702,751`, not `12,702,751.227`): the budget pie in
  `CPL_Initiative_Project_List_v3.xlsx` showed the old rounding.
- **The run on team files.** Six workbooks (the project list, the IT and AI credential catalog, the
  OpenClassrooms crosswalk, the top-50 export, the TOP lookup, the ARC fill-out): two charts drafted from the
  budget's numbers, data with no table on every one, merged cells on two sheets, no default sheet name. A copy
  of the crosswalk with its sheet renamed *Sheet1* came back renamed, and both remediated files open in
  LibreOffice.

## A workbook's contrast (S515 SkyRaspberry, 2026-10-29)

The lane's NEXT after S514: each cell's words against what they sit on, as the deck and Word checks do.

- **Where the colors live.** A cell's `s` indexes `cellXfs`; its `fontId` gives the font's `color` and size, its
  `fillId` the fill. A solid `patternFill` paints its `fgColor`; no pattern shows white. A gradient or any other
  pattern (*gray125*, *darkGrid*) is counted for a person.
- **Excel counts theme colors lt1 first.** `theme="0"` is Background 1 (lt1) and `theme="1"` Text 1 (dk1), the
  reverse of the theme file's own `dk1, lt1` order. A `tint` moves the HSL lightness: toward black by
  `L*(1+tint)` when negative, toward white by `L+(1-L)*tint` when positive. `indexed` reads the old 64-color
  palette (a workbook's own `indexedColors` replaces it); 64 and up, and `auto`, mean the system color, which
  never fails.
- **A styled table paints its own header and bands**, so a cell inside one with no fill of its own is counted,
  never measured. A cell's own fill still wins there and is measured.
- **The fix never edits a shared format.** For each cell format a failing item covers, the fix copies the
  format's font with the new color and copies the format to use it, then points those cells at the copy. Other
  cells on the old format keep theirs.
- **Words colored inside a cell** (a shared string's runs) are named with their cells for a person: a shared
  string can sit in cells with different fills, so one new color would not serve them all.
- **The run on team files.** Six workbooks. The project list's budget sheet carries six cells in Background 1
  on white (Cambria 10, likely hidden on purpose) and fourteen in gray 808080 at 3.9:1; one link in 4A90D9 on
  the project list reads 3.3:1. All 22 were fixed and a second inspect found none; the file opens in
  LibreOffice. The CEO lookup's conditional formatting is listed. Hidden text gets its own sentence: a screen
  reader still reads it, so the fix stays offered and the item says how to keep it hidden instead.

## A workbook's conditional formatting (S516 SkyBoysenberry, 2026-10-29)

The lane's NEXT after S515: each conditional-formatting rule measured the way cells are.

- **Where the colors live.** A `cfRule`'s `dxfId` indexes `dxfs` in `xl/styles.xml`. A dxf carries only what it
  changes: a font color, a bold, a fill. What it leaves out comes from the cell, so a fill-only rule is measured
  against the cell's own words and a font-only rule against the cell's own fill.
- **A dxf's solid fill is its `bgColor`**, the reverse of a cell fill (which paints `fgColor`); read `fgColor`
  only when no `bgColor` is written. A dxf `patternFill` often names no `patternType`, which means solid.
- **One item per dxf, and the fix has to pass everywhere the failing rules reach.** One dxf can serve rules on
  white cells and on navy ones. The fix is a copy of the dxf with the new font color; only the failing rules point
  at it, and when no single color passes on every fill those rules meet (red on white and on navy) the item goes to
  a person.
- **A range with no written cell** still holds the rule; it is measured against the sheet's default (format 0, on
  white).
- **Name the rule's range, not a sample cell.** The first cell in the range need not be one the rule fires on (the
  CEO lookup's *Interim* rule spans a column of titles), so a sample there would mislead.
- **Excel's three highlight presets pass:** dark red on light red 5.9:1, dark yellow on yellow 4.7:1, dark green
  on green 6.1:1, so the common case raises nothing.
- **The run on team files.** Of the repos' workbooks one carries conditional formatting, the CEO lookup: three
  border-only rules, correctly clean. Given a yellow font in one dxf, the check found it, the fix repointed one
  rule, a second inspect found none, and the file opens in LibreOffice.

## Each picture with its slide (S517, Sam's session, 2026-10-29)

Sam's session, the day before the 7th Annual CPL Summit, on his first live run of remediation (the Summit's
*0900-0945 Welcome and Introduction* deck: 35 slides, 27 items).

- **A browser cannot paint a slide, but it can draw its plan.** Each shape's box (its own `xfrm`, else its
  layout's or master's placeholder), its words at their size and alignment, its fill and its picture, the layout's
  and master's own shapes beneath, and a background picture, drawn at percentages inside a box with the slide's
  aspect ratio, the text in `cqw` so it scales with the box. A group's children sit in the group's own coordinates
  (`chOff`, `chExt`) and scale into its box. It is not PowerPoint's rendering (no theme fonts, effects or crops),
  and it is enough to see what sits under a QR code.
- **The label nearest a picture is the best context it has.** Below it first (the usual place under a QR code),
  then above, beside, or laid over it, within reach of the picture's own size; never the title, which goes to
  Claude on its own line, and never body text over 120 characters.
- **Read the QR code; do not describe it.** Office's automatic alt text for one is *"A qr code on a white
  background"*. jsQR reads the address in the browser, and the draft names the label and the address without its
  scheme: *QR code to MAP Website, map.rccd.edu*. A code drawn on a see-through ground reads only after the canvas
  is painted white first, as a phone sees it. Claude is not asked about a code the page read: its draft is exact.
- **Alt text a program wrote is no alt text.** python-pptx writes the picture's file name into `descr`, and Office's
  own description says it is one (*"Description automatically generated"*, *"AI-generated content may be
  incorrect."*); both used to pass as described. Now each is listed, Office's words kept as the draft without the
  notice.
- **A video's poster frame** is a `p:pic` whose `nvPr` holds `a:videoFile` (or `p14:media`). It is labeled a video
  and drafted from the name a person gave it in the file.
- **Claude drafts every picture before the report opens** (Sam: *"Can you have it draft from the picture as a
  default"*), four at a time, under a line that counts them back and a *Show the report now*. Every picture leaving
  the browser is now the default, so the box beside Remediate says so and turns it off for a file that shows a
  student's record. A draft never replaces words a person typed meanwhile.
- **A draft is not done.** The bar counts an item when a person keeps it (*Keep*, an edit, or Decorative); a
  contrast fix the page applies counts as fixed while its box stays on. One bar, an equal part per check, each
  part solid for what the page fixed or found passing, striped for what the person did, gray for what is left, the
  words under it saying the same, each check named with its WCAG 2.2 criterion: alt text 1.1.1, document title
  2.4.2, slide titles, headings and sheet names 2.4.6, language 3.1.1, table headers 1.3.1, reading order 1.3.2,
  color contrast 1.4.3. Its line counts down to *Ready for the Chancellor's Office review*. Sam's purpose for the
  split: *"we'll use that to work on ways to automate those user inputs that are needed later on."*
- **The standard is the Chancellor's Office's own.** Its 2025 Certificate of Website Accessibility names WCAG 2.2
  at level AA and Government Code 7405, 11135 and 11546.7; its accessibility page names WCAG 2.1 AA. 2.2 AA
  includes 2.1 AA, so the header names both.
- **Say what the draft reads.** The button is *Draft from the slide*, then *Redraft from the slide* (the section in a
  Word document, the sheet in a workbook), Sam's naming: *"If we say from the slide, it implies that it's with the
  context of the slide."* The note under the list says each draft sends one picture and its slide's words, since
  the words now go too.
- **One line, said once.** The report's count and the bar's line became one sentence above the bar (Sam: *"make
  sure none of the information there is redundant"*). Each check's words under the bar are a link to its first
  item left, or to its line in *Fixed for you*; the bar's part takes a click too, though the words carry the
  keyboard, since a 10-pixel bar is under WCAG 2.2's 24-pixel target.
- **Keep all and the next file.** *Keep all* keeps every alt text with words or marked decorative, and says how
  many still have none. *Remediate another file*, beside *Close*, opens the next report in place, and asks first when
  kept or edited answers are not yet in a downloaded file.
- **A tab keeps the module it loaded.** Sam's first look after the merge (07:03 his time) still drew the old report:
  the Library loads `library.js` once per page and Pages serves it with a ten-minute cache, so an open COBI tab
  needs a reload to show a deploy. His second confusion was the button: *Remediate and download* read as the
  start of the routine, which had already run, so it is now *Download the remediated file*. The panel's line
  that nothing leaves the browser until filing now names what drafting sends.
- **A file is in the Library from the moment it opens.** Sam: *"there's really no reason to start a file without
  having it in the library regardless of it's state of remediation or revision"*, and *"the library is functioning
  as much as a work space for all docs as a repository."* Remediate writes a Draft record as the file opens (no
  link, `home` not filed, `file_name` the file's), the same file opened again finds it by that name, and the
  download notes what it fixed there and opens the record's form for the SharePoint link, the one step a browser
  cannot take.
- **The Library counts its remediation.** A record's `remediation` (new, nullable: `in_remediation` as the file
  opens, `remediated` at its download; applied by MCP, `cpl_library_remediation_2026_10_29_s517`) feeds two boxes
  beside *Needs attention*, each a filter (Sam: *"a box to count and filter for the files in remediation or
  remediated"*). The count boxes shrank to one line each (*"you can shrink these metric boxes to save real
  estate"*).
- **A grid item's minimum width is its content's.** A long URL in a hint widened the whole list item past its
  column until the item took `min-width:0` and the hints `overflow-wrap:anywhere`.

## A chart's contrast (S517 SkyPartridgeberry, 2026-10-29)

The lane's NEXT after S516: a chart in a deck, a document or a workbook, the one part each check still left to a person.

- **What is measured.** Each series' bars, slices or line against the plot area (WCAG 1.4.11, 3:1): the plot
  area's fill, else the chart's, else the slide's background (a deck) or white. Words with a color of their own
  or the chart's (the title's runs, the legend, each axis, the data labels) against what they sit on, at 4.5:1 or
  3:1 when large. A label inside a bar or slice (`ctr`, `inEnd`, `inBase`, a pie's `bestFit`, a stacked bar's
  default) sits on that bar or slice. A gradient or picture under a chart is named for a person.
- **Office's own colors are measured as drawn** (Fable's advice, taken): a series with no fill of its own takes
  the theme's accent by its `c:idx`, a pie's slice by its point index, the first six only. Office's 2013 gray
  (accent3) reads 2.4:1 on white, its orange 2.7:1, its gold 1.6:1, so most default charts raise an item. The fix
  writes the color into the series' `c:spPr`, or into a `c:dPt` of the slice's own, so it survives a theme change.
- **A series whose values show as labels is advisory**, not exempt (Fable): the labels carry the numbers, but a
  low-vision reader still reads the bars. Its item says *yours to weigh* and its box starts unticked.
- **A bar's new color must keep its own labels readable.** The first build lightened the IT and AI deck's pale blue
  bar to pass on white, and the navy labels inside it fell to 4.1:1. Now the fix walks the hue until it passes on
  the plot area and keeps every label on it at its own ratio; that deck's bar has no such blue, so it goes to a
  person with *give the bars a dark outline*.
- **Slices side by side** below 3:1 against each other are one item for a person (a white border is the usual
  fix, not a new color). Fable: adjacency has no WCAG threshold, and a recolor cannot keep the theme.
- **A chart item finds its element by position** (element-child indices from the part's root), resolved for the
  whole part before any fix inserts an `spPr` or `dPt` that would shift the rest. Alt-text items already carry a
  `chart` flag, so these carry `inChart`.
- **The run on team files.** Three files hold charts. The IT and AI credentials deck: one series at 1.8:1, held for
  a person as above. The project list workbook's two budget pies (Office 2007 colors, white labels): three slices
  advisory, white labels on green named for a person; after the fixes, a second inspect finds the white labels on
  blue at 4:1 fixable, and the file opens in LibreOffice. Tests: `library_remediate` (135, block 15).

## Each slide beside its item, and empty boxes removed (S518 SkyServiceberry, 2026-10-29)

Sam, reading the report's last items on the Summit deck: *"Is it possible to show the slides next to the problem item
with these notes so the ppt doesn't need to be opened separately?"* and *"another example is the blank title box on
slide 12 where it would be good to see the slide next to it."* Then: *"often when using ppt master slides a title box or
text box is auto added and the user adds their own text boxes ... Could you delete blank boxes with no background color
or outline color as part of the remediation? Sometime users add decorative boxes for formatting purposes but they would
always have some sort of color added."*

- **Every item that names a slide draws it**, from S517's slide plan (`report.slides[n].plan`): one slide to an item's
  left with *Larger slide* (a blank title, text below AA, a chart's items, which now carry `slide` and `shapeId`
  through `onSlide`); several as a strip under its words, a slide's number showing it larger (no title box, a crowded
  slide, text on a gradient). The blank title box, the runs below AA or the chart are outlined.
- **A crowded slide is numbered in reading order**: the slide's own shapes in the file's order (groups flattened), a
  picture marked decorative and a wordless shape skipped. Its box reads *Checked here or in PowerPoint*.
- **Empty boxes go before any check reads the slide** (`emptyBoxes`): a slide's own top-level `p:sp` with no words, no
  fill and no outline, its layout's and master's placeholder looked at too, and a placeholder kept when the layout
  cannot be read. Kept: the title box, a box with a link, alt text or an animation (`p:timing`'s `spTgt`), and any box
  with color, a theme `fillRef` or `lnRef` counting as color. *Fixed for you* names the count and the slides, under
  Reading order. On the five team decks in the repos it removes nothing: code made them, and none holds an empty box.
- **The title box stays (Sam asked "why not just also delete empty title boxes?").** A screen reader finds a slide's
  title only in its title box, and the Accessibility Checker flags a slide without one, so deleting it would turn a
  typed title into a PowerPoint fix. Instead `titleDraft` drafts the title from the largest words in the slide's top
  half, the item offers *Keep* (a draft is left until kept, as alt text is), and *Keep the title box just off the
  slide* (on when the slide's own words show its title) moves the box just above the slide at download, so nothing
  shows twice. Sam: *"good! draft title will help."*
- **Phone width:** the strip is a grid item, so it carries `min-width:0;width:100%` or its fixed-width slides widen
  the column past the screen (measured 430 at 390 before the fix).
- `cpl_memory`: `sam-remediation-slides-beside-items-2026-10-29`, `sam-remediation-removes-empty-boxes-2026-10-29`.
  Tests: `library` (17), `library_remediate` (7, 17).

## A title box for every slide, a script in the notes, and the deck's own order (S518, later)

Sam, 2026-10-29, after #2556: *"yes, add the title boxes to slides with none. Also, can you add a prompt once someone
uploads a ppt for revision or remediation (maybe in the instructions window) to ask if they have notes that they want
to preserve and the option for you to add a script below or replacing their notes?"*

- **A slide with no title box asks for its title** (`missing: true`), one item a slide in place of the old *no title a
  screen reader can find* line that sent people to PowerPoint. It is drafted from the slide's largest words in its top
  half, kept with *Keep*, and at download `addTitleBox` writes a title placeholder first in the slide's shapes, kept
  just above the slide (the box defaults to off the slide: the design has no title area). A box kept off the slide also
  moves first, so a screen reader meets the title first. Rendered in LibreOffice, Taco Tuesday's slides are
  pixel-identical before and after: the six new boxes show nowhere.
- **Speaker notes.** A dropped .pptx asks *does the deck have notes you want to keep?*: keep them (the default), keep
  them and add Claude's script below, or replace them with Claude's script. As background, the choice rides in the
  brief's template line to the session that makes the new deck. To remediate, the page drafts each slide's script
  through `slide-script-draft` (new, deployed S518, reads no table and writes nothing; the slide's title, its words top
  to bottom, its pictures' alt text and its notes), four at a time after the pictures' drafts, and shows a *Speaker
  notes* section, each slide beside its script with *Redraft the script*. At download `writeScripts` puts each script
  into its notes page's body box, below the notes after one blank line or in their place; a slide with no notes page
  gets one on the deck's notes master, with its relationships and content type. An empty box leaves a slide's notes as
  they were.
- **The deck's own order.** A slide moved in PowerPoint keeps its file's name, and the report numbered slides by file
  name: in Taco Tuesday the second slide shown is `slide14.xml`, so the report called it Slide 14. `slideOrder` now
  reads `presentation.xml`'s slide list, and a file the list leaves out is not read. Every report before S518 that came
  from a reordered deck numbered its slides this way.
- **Checked on Taco Tuesday:** 6 title boxes added and drafted (5 from the slide's words), 14 scripts written (8 on new
  notes pages), each script on the slide PowerPoint shows at that number; python-pptx and LibreOffice open the file.
- Tests: `library_remediate` (1, 2, 5, 18, 19), `library` (17, 18). `cpl_memory`:
  `sam-remediation-title-boxes-and-notes-2026-10-29`, `pitfall-pptx-slide-order-is-presentation-xml-2026-10-29`.

## Moved from the lane (S735 checkpoint, 2026-11-25)

✅ **The page in Malone's look (Sam, 2026-10-24, S467):** map.rccd.edu/CPL-AI's look, Light by default (dark only from
the reader's own Dark click), eleven hero photos cycling with *Pause photos*; CLAUDE.md's First Light rule names it as its
one departure. The full record, his words and the photo list moved verbatim to
[`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S483, later)*.

- **The box says what it did beside its field (Sam, 2026-11-11, #3097):** *"the text showing they uploaded is below
  the window of view and I thought nothing happened when I first clicked"*. The line shows inside the card's box under
  the document field; a file added twice says so and saves its words and pictures once.
- **Public targets have a 25px floor (S641, #3151).** Eight targets at exactly `min-height:24px` measured 23.9 at 90% and
  133% browser zoom: the shared header's Links, Light and Dark, and five Request Adopt links. The floor sits in the vault
  sources (public header, the agency visual, tabs; CPLBrain `0e4b1091`), and seven other public pages, `library/index.html`
  and `library/adopt/` took the header's lengths. Guard `tests/public_target_floor.test.js`. A new public page takes the
  header's lengths, never `24px`.
- **The CPL Initiative overview** (`library/cpl-initiative-overview/`, record `cpl-initiative-overview`; Sam: *"publish the
  overview"*): in the public library's look, figures live from `live_metrics.json`; its own source, so revise it on its card.
  Every public page's header leads its Links with it (`header.html`; guarded in `tests/public_library.test.js`).
- **The JST guide (S642):** record `7ca43e3c`, Version 1 (commit `41eeb44a`); `public_listed` false: Publish to Public Library
  is the team's press once its check passes, linked from the funding dashboard's 75% JST condition.
- **A draft read off Pages drops its version stamps** (#3097; `unstamp`): lessons, *Moved from the lane (S653b)*.
- **Create is one form** (Sam, 2026-11-06): lessons, *Moved from the lane (S653b)*.
- DSP Credit Starting Points, Version 3 in public (S641, #3151): lessons, *Moved from the lane (S646)*.

## Moved from the lane (S736 checkpoint)

**#3600 (S690, `9fc88a07`; DECIDED `d-main-red-check-line-stays-out-s690`): the check line stays out of the reading text and out of new pieces.** The first run stamped every page's line, the starter page's included (653864b7), so ELL IET's reading text passed Sierra's `LIBRARY_TEXT_MAX` (33,996 to 34,078 of 34,000 characters) and `buildNewPage` copied the starter's line into new pieces; `main` stayed red until the merge. `cpl-chat`'s `libraryPageText`, the drafter's `readingText` and the card's `sierraText` now skip the `cpl-library-check` block, and `buildNewPage` drops it (`sierra_library` 31, `library_revise_draft` 120, `library_qualify_draft` 40 and the footer's 11 pass, with `library_check_test`). **Not deployed:** `cpl-chat-deploy.yml` for `cpl-chat` and `library-revise-draft` waits for a plain session.
