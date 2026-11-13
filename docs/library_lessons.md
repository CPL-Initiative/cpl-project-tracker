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

## S531 SkyOlallieberry (2026-10-30): the Chancellor's Summit address, a public page with its film

- **Live** at https://cpl-initiative.github.io/cpl-project-tracker/library/chancellor-summit-address/ (#2592; CPLBrain#565).
  Sam: *"Can I host it from git or the library itself?"*, after his Library record linked SharePoint, which only RCCD
  opens. The page is `library_page.py`'s copy of a source in the vault, with the public header, the film (13.7 MB,
  H.264 CRF 23, AAC 128k, faststart), captions as a default WebVTT track, and the transcript under its own heading.
  `tests/library_pages.test.js` (8) holds a film page to that; `a11y.config.js` sweeps it light and dark.
- **The vault encodes and the session carries.** Handoff 531 planned a tracker workflow, which would need the Drive
  file's id in this public repo. The vault's runner (`tools/video_accessible.py`, a job with `web`) commits the web
  MP4 to its branch; the session copies it to `library/<slug>/` and deletes it from the vault branch before review.
- **The high end.** Sam: *"Her voice audio still has distortion on the high end, not sure you can fix that."* The
  recording clipped at capture. An `ab_of` job rendered the loudest 40 s five ways, each at -16 LUFS so the louder
  one never wins. Round 1's dynamic treatments moved 3-8 kHz only 1-2 dB, because the source runs compressed (LRA 4);
  round 2 set their thresholds under the average. Sam picked *gentle* (a light de-esser and a 3 dB shelf above 6 kHz):
  *"Ok, still has the distortion but nothing you can do about that. gentle sounds the best to me."* In the full film
  it lowers 3-8 kHz 6.5 dB and above 8 kHz 12.2 dB (`cpl_memory` `sam-chancellor-address-gentle-high-end-2026-10-30`).
- **Settled:** Sam repointed the address's Library record to the Pages address himself on 2026-10-31 (read by S540;
  Sierra reads a `library/` page only through a record that links it). Still open: filing the gentle MP4s from run
  41139746530 to CPLLibrary.

## Archived

The sections from S338 (2026-10-06) to S458 (2026-10-23) moved verbatim to [`library_lessons_archive`](library_lessons_archive.md) at S557.

*S459 to S467 (2026-10-23 and 24) moved verbatim to [`library_lessons_archive.md`](library_lessons_archive.md) at S577.*

The sections from S468 (2026-10-24) to S509 (2026-10-29) moved verbatim to
[`library_lessons_archive_2.md`](library_lessons_archive_2.md) (SkyBeacon, 2026-11-06).

## The build to Version 20, and remediation (S509 SkyElderberry, 2026-10-29)

What shipped, in four merges: #2538 one card per project (`cpl_library.project`, receipt
`kb/receipts/cpl_library_projects_2026-10-29_s509.sql`, 13 projects of 2 read back); #2540 the one *Create or
Remediate a Document* panel; #2541 remediation of a .pptx or .docx in the browser, chart drafts from the chart's own
numbers, and *Draft from the picture* through the new `alt-text-draft` Edge Function (v1, deployed through the MCP).

What we learned:

- **Real files find what fixtures miss.** Run on four team files from the vault, the first build left generator titles
  (*PowerPoint Presentation*, *PptxGenJS Presentation*) in place, joined a title's lines across `a:br` with no space,
  listed nineteen *no title* and nineteen *reading order* items for a deck built without placeholders, and counted
  nested shapes as crowding. Each became a rule and a test. Try a remediation change on `CPLBrain/04-projects/` decks
  before shipping it.
- **A picture on two of three slides is not a logo.** The repeated-picture rule needs at least three slides and 80% of
  them; at 60% a chart reused on two slides was marked decorative.
- **A stacked chart's labels are its totals.** The IT and AI deck's slide 9 shows 374 where its two series hold 25 and
  349; a draft from the first series alone read 25. The chart draft sums every series and names them.
- **Write answers into a fresh read.** Remediate and download re-reads the original before writing, so a second press
  never writes a slide title twice.
- **Ask whether a picture may leave the browser before building it.** The first build promised that nothing leaves the
  browser. Sam asked for screenshot reading (*"We do a lot of MAP screenshots and hoping you can decipher them and at
  least take a shot at alt text"*), so one picture goes to Claude only when a person presses the button, and the panel
  says so.
- **A session's own live test can be impossible.** This sandbox cannot reach `*.supabase.co`, the database has no
  `pg_net`, and no secret holds the team phrase, so the function's first real call is Sam's. Say so rather than claim
  it works.
- **A long-running test needs its window closed.** A 60-second revoke timer kept the jsdom test alive past its checks;
  `m.w.close()` at the block's end ends it.

## Moved from the lane (S510)

Sam: *"PPT accessibility remediation is top of mind as we spend a bunch of money paying a service to remediate our decks before we can publish them to the field after a webinar or training. Can you look at the Library and see if you can make it easy for a user to drag and drop their decks (or other docs) into the library and run a remediation process? We have to do this for written reports as well."* And: one button in place of Make a visual, Start a piece and Add to the Library; one card for a whole project (the ELL IET visual and its document). Mockup, Version 10: https://claude.ai/artifact/DNzaPRUD1qsrBTAhbn29kR. His comments on it: *"can you add a Remediate option?"* (added: *Remediate a deck or document* beside *Make something new* and *File something already made*; the card's action reads Remediate), *"This looks good!"* on the project card, and *"Add a Chip if it is published to the public library"* (added under the card's title), and *"Do we need the Add to the Library link? Would it be simpler to put the link on the card title that matches?"* (each piece's title is its link; List publicly sits on the unlisted piece's row; asked whether he meant the top control).

## A deck's contrast (S510 SkyWineberry, 2026-10-29)

- **Measure against what the words sit on, never the slide's background alone.** The first build read each run against
  its slide's background and reported 72 failures on five team decks, almost all white text "on white". Our generators
  lay a text box over a separate filled rectangle, and the Taco Tuesday deck's section layout draws a full-slide navy
  rectangle beneath its placeholders. Reading the topmost shape drawn before the text that covers its middle, the
  layout's and master's own shapes included, brought it to 6, and each of those held on a LibreOffice render.
- **Confirm every remaining finding on a render.** `soffice --headless --convert-to pdf` and `pdftoppm` in the sandbox
  show the slide; a finding that does not hold on the picture is a bug in the reader, not in the deck.
- **A fix keeps the hue.** The offered color steps the lightness away from the ground until it clears the bar by 0.1,
  so a gold kicker stays gold (`E8A32C` to `9D6A11`), and it is ticked by default but shown both ways first.

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

## Moved from the lane (S512)

✅ **④ A deck's contrast is checked (S510).** Each text run's color (its own, else inherited through list style, layout, master and theme) is measured against the fill the words sit on: the shape's own, else the topmost shape drawn before it covering its middle (the layout's and master's own shapes included), else the slide's background through layout and master. Below 4.5:1, or 3:1 for 18pt or 14pt bold, each slide's color pair is one *Needs you* item showing the words both ways, with the nearest passing color of the same hue ticked as the fix; *Remediate and download* writes it onto those runs. Text over a picture, chart, table, gradient or pattern is named for a person (one item). On the five team decks, 6 findings, each confirmed on a render; the first build, against the background alone, reported 72 (`docs/library_lessons.md`, S510). Tests: `library_remediate` (8), `library` (16).

✅ **⑤ A Word document's contrast is checked (S511).** Each run's color (its own `w:color`, its character and paragraph styles through `basedOn`, the defaults; a theme color with its tint or shade) is measured against its highlight or shading, the paragraph's, the table cell's, else the page color. `auto` never fails. Text in a text box, on patterned shading or in a table its style shades is named for a person (one item). One *Needs you* item per color pair, the fix written as the run's `w:color`. On the team's 82 Word files the findings held on renders (white headers on `#8EAADB` in the quarterly reports, small gold on white in the guidance memo, a stray white-on-white run in the spring update). Tests: `library_remediate` (9).

## Moved from the lane (S513)

✅ **⑥ Headers, footers and text boxes join a Word document's contrast (S512).** Every `word/header*.xml` and `word/footer*.xml` is read beside the body, its item saying *in a header* or *in a footer* and its fix written in that part. A text box's words are measured on its own fill, or on the page when it has none; Word's VML copy in `mc:Fallback` is skipped, so nothing counts twice. A box its theme fills, or a VML-only box, is named for a person. On the team's 84 Word files: one new finding, the fact sheet's gray header line (`#888888`, 3.5:1), held on a render. Test: `library_remediate` (70).

### The ELL IET and DSP pages, Version 2 (Sam's S482 asks; built S482 and S483)

Both agency visuals are on the template at Version 2, each card ending in example articulations and the people in the
conversation, and both are the public copies (Sam, Sheet 129 cards 2 and 3, *replace*, 03:53Z 2026-10-26). Sierra reads
the ELL IET page whole: production reads 31,000 characters a page (cpl-chat-deploy run 40329644423, 13:21Z; smoke run
40331201968, run alone, passed). The full record moved verbatim to
[`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S490)*.

## Moved from the lane (S514)

✅ **⑦ A PDF is fixed at its source (S513).** Remediate on a dropped PDF reads its Info, catalog and XMP and changes nothing: what it carries (tags, language, title, text), the program that made it, any Library record that matches, the export steps, and *Choose the source .pptx* or *.docx*. Detail and the 55-file run: *A PDF is fixed at its source (S513)*. Tests: `library_remediate` (81), `library` block (16).

## Moved from the lane (S515)

✅ **⑧ A workbook is remediated (S514).** Remediate on a dropped .xlsx sets the title and lists a sheet at its default name (renamed everywhere it is referenced), alt text per picture and chart, a table with no header row (listed, never switched on), data with no table, and merged cells. Detail and the six-workbook run: [`docs/library_lessons.md`](../../library_lessons.md), *A workbook in remediation (S514)*. Tests: `library_remediate` (95), `library` block (16).

## Moved from the lane (S516)

✅ **⑧ A workbook is remediated (S514) and ⑨ its contrast is checked (S515):** each cell's font color against its own fill, the fix written as a new font and format so cells sharing the old one keep it; a styled table, a patterned fill, words colored inside a cell and conditional formatting are listed for a person. Detail: [`docs/library_lessons.md`](library_lessons.md), *A workbook's contrast (S515)*. Tests: `library_remediate` (109).

## Moved from the lane (S517)

✅ **⑩ A workbook's conditional formatting is measured (S516):** each rule's colors against every cell in its range, one item per format, fixed by a copy that only the failing rules point at. Detail: [`docs/library_lessons.md`](library_lessons.md), *A workbook's conditional formatting (S516)*. Tests: `library_remediate` (121).

✅ **③ Remediation in the browser is built (S509).** Remediate on a dropped .pptx or .docx reads it here (`library_remediate.js` over the vendored `jszip.min.js` 3.10.1, MIT, loaded on demand like `docx.min.js`) and reports, as the mockup draws it, *Fixed for you*: the title (from the first slide's title or first heading, a generator's stock title counting as none), the language, table header rows, a picture on most slides (a logo) marked decorative as Office writes it; and *Needs you*: alt text per picture and chart, with its thumbnail and a draft from the slide's or section's words, or Decorative; an empty slide title; slides with no title box (one item); crowded slides' reading order (one item); a document with no headings. *Remediate and download* writes the answers into a fresh read and hands back `<name>_Remediated.<ext>`, the date code kept; *File it in the Library* opens the filing form. A chart's draft comes from its own numbers. *Draft from the picture* (Sam, 2026-10-29: *"We do a lot of MAP screenshots and hoping you can decipher them and at least take a shot at alt text"*) sends that one picture, shrunk to 1568 pixels, to the `alt-text-draft` function (S509, v1; checks the team phrase itself; writes nothing), which asks Claude; *Draft every picture* runs all. Tried on four team files; all reopen. Tests: `library_remediate`, `library` block (16).

## Moved from the lane (S518)

## The Coordinator Guide is In development (Sam, 2026-10-25; Draft 1 by S480)

Draft 1 (https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1, private) is record `cpl-coordinator-getting-started-guide`, In development at step 2; each revision comes from **Changes to make**, and listing it publicly is Sam's. The full record moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S509)*.

## The ELL IET and DSP pages, Version 2 (built S482 and S483)

Both are the public copies (Sheet 129). The record moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S513)*.

## A form's limit must be the column's, and its answer must land where the reader is (S520's side session, 2026-10-29)

Sam: *"I want to revise the ELL visual in the library and added instructions but the regenerate doesn't seem top work."*
The record showed no write after S509's project receipt. Regenerate's textarea took 4,000 characters (`maxlength`), while
`cpl_library_text_ck` caps `refresh_note` at 600, so a long note was refused with a 400. The refusal went to `say()`, which
paints under the panel at the top of the tab, while the form sat on a card far below it. The request failed, and the person
saw nothing. Two rules came out of it. A field's limit is the column's, or the overflow goes somewhere that holds it:
instructions past 600 characters now go whole into `sources`, with a pointer in the note. And a form's answer lands beside
the form: the request is now made in the one box, where the message prints beside Start. Built as Revise and remediate
from the one box; the lane's ⑪ has the record.

## Moved from the lane (S520's side session)

✅ **⑪ Revise and remediate from the one box (Sam, 2026-10-29; mockup Version 21; built by S520's side session).** Sam's ELL
revision never reached its record: Regenerate's box took 4,000 characters, `refresh_note` takes 600
(`cpl_library_text_ck`), and the refusal printed above the panel, far from the card. Sam: *"Seems like we need to
integrate/consolidate the edit and regenerate function for existing items into the new function"*, *"I really like how
simple the new function is, so if we can keep the simplicity, all the better"*, *"could be as simple as choosing an existing
item in the drop box"*, and on Version 21 *"Maybe make Revise 'Revise and Remediate'"*. The panel is now *Create, Revise or
Remediate a Document*. It finds a piece already here four ways: picked by a label that names its kind (*ELL IET CPL Starting
Points (Visual, Version 2)*, his ask on seeing two ELL titles), its own link pasted, a page or picture named for it dropped,
or **Revise and remediate** or **Edit** pressed on its card. It then asks what to do with it: Revise and remediate this
piece, Change its details (the edit form, now only here), File a new version of it, or Use it as background for something
new. A dropped Word file's words are read in the browser. Instructions past 600 characters are kept whole as a document to
work from, with a pointer in the note. The request's paste asks the session to remediate the draft before handing it over
(a page through `npm run a11y`, a deck, document, workbook or PDF through `library_remediate.js`). The Regenerate form, its
publish question and its separate document fields are gone. Mockup: https://claude.ai/artifact/DNzaPRUD1qsrBTAhbn29kR
(Version 21 beside Version 20). Test: `library` block (19), and (13), (14) moved to the box.

## SharePoint is closed to a session, and the card says so (S540 SkyBunchberry, 2026-11-01)

- **The ask.** Crystal Nasio's IACA request (`iaca-mvpmcjyl`, 2026-10-26) named no change, no document and no source to
  rebuild from, and its one file is a SharePoint deck, so five handoffs read it and left it. Sam, about 14:15Z through a
  side session: *"I will have Crystal reload it. Can you build in a note to the user that sharepoint is not currently
  accessible and offer instructions on what to do instead?"*
- **Built.** `sharePointOnly(r)` in `library.js`: no `rebuild_from`, no pasted text, no non-SharePoint link, and a
  SharePoint file on the record or its documents. Such a waiting card reads *Its file is on SharePoint, which a session
  cannot open yet ... Download a copy of the file from SharePoint, then drop that copy into Create, Revise or Remediate a
  Document with this piece picked*, in place of *The next scheduled run rebuilds it*. The request's confirmation and a
  brief started from a SharePoint link say the same. Two older messages told people to *put it in SharePoint and paste
  its link*, which no session can read; they now say to save a Word or plain-text copy and drop it. Guard: `library` (20).
- **Lesson.** Advice that routes a file through a store the reader cannot open is worse than no advice: the request
  looks complete and sits. When a connector is held, every hint that names the held store needs its way around.
- **The two summit refresh notes** (`noncredit-summit-in-motion`, `noncredit-summit-cpl-slides`) were cleared on Sam's
  *"yes, clear them"* by migration `2026-11-01_library_summit_refresh_notes.sql` (the side session's #2644, before-values
  in its rollback). The summit met on October 8.

## Every draft applied, and a PDF written (S553 SkyPinwheel, 2026-11-02)

- **The ask.** Sam, opening the session: *"Can you have a look at the COBI Library and make sure we can remediate any
  type of file uploaded. A team member tried a pdf on Friday and it didn't seem to work. I think it should do a full
  remediation without waiting for confirmation on each element but then present the elements remediated as it does
  now for any edits needed."* The Friday PDF got S513's read-only report: what it carries, the program that made it,
  the export steps and *Choose the source .pptx*, with no download. Correct, and it read as nothing happening.
- **A report that applies nothing is a report of work to do.** Keep and Keep all asked the person to confirm each draft
  before the file took it, so a deck with twenty pictures was twenty clicks from done. Now every answer with words is in
  the file from the start: the alt texts, the slide titles, the sheet names, the contrast fixes, a PDF's title. The
  report shows them under *Remediated for you, to edit as needed*, each with its field, and *Needs you* keeps only what
  has no words yet or needs a person in the program. The bar counts a draft as fixed by the page until an edit makes it
  the person's (`edited`, not `kept`); `remBy` is the one place that says which. Sam's purpose for the bar stands: what
  is left is what to automate next.
- **What a browser can write into a PDF.** Its title, its language and whether a reader shows the title are entries in
  the Info dictionary and the catalog. They are written the way Acrobat saves, as an incremental update: the original
  bytes untouched, the changed objects appended, then a cross-reference section pointing back at the last `startxref`.
  The section must take the file's own form, a table or a stream: 51 of the team's 55 PDFs use streams (Office, linearized,
  with /Prev chains up to 27 deep), 4 tables (Quartz, Chromium, two from Acrobat). A table update starts at object 0
  with the free entry, or pypdf suspects the off-by-one of a broken writer. The XMP's `dc:title` is rewritten too,
  uncompressed, since Acrobat reads it first when both are there.
- **Read the newest definition of each object, never the first.** An incremental update keeps every earlier version
  in the file, so the first `/Type/Catalog` or `/Type/Page` is often stale: the object index maps each number to the
  definition furthest into the file, top-level or inside an object stream (parsed by its `/N` and `/First` header),
  and the page count reads the Pages root's `/Count`. Counting `/Type/Page` over the file read 50 pages on a 13-page
  handbook.
- **`endstream` reads as a stream's start in a file that ends lines with LF.** `/stream\r?\n/` matched inside
  `endstream\n` and took the next bytes as a second XML stream, so the metadata's body read *endobj*; `\bstream` fixes
  it. Office's `\r\nendstream\r` never showed it.
- **PDFDocEncoding's upper half.** A literal `/Title` with an en dash holds 0x85, which is not Latin-1; without the
  map the report printed a control character. Hex strings carry their own BOM.
- **What stays at the source, said in words.** Tags (the structure a screen reader follows), a tagged PDF's pictures
  with no `/Alt`, and a scan's text cannot be made here; each is a *Needs you* item with the steps, the Library record
  that may hold the source, *Choose the source*, and a box to tick when done. An untagged PDF is not shown passing the
  alt-text and headings checks it cannot take (`checksFor(ext, report)` drops them); a scan drops tags too. An encrypted
  PDF is read and never written, and says so. A language other than English is written as English unless the person
  clears the box, since the one such file in the corpus (the Law TMC, `/Lang(fr)`) is English.
- **Every kind of file says what happens to it.** A file not offered Remediate used to show two other choices and no
  word why. The panel now says what it is and the step: save a `.ppt` as `.pptx` in PowerPoint, export Keynote to
  PowerPoint, a picture is remediated where it is used, a video needs captions. Macro-enabled and slideshow packages
  (`.pptm`, `.docm`, `.xlsm`, `.ppsx`) read as their plain kin and come back under their own extension and MIME type.
- **Verified on the real corpus.** Every PDF on disk through `inspect` and `finish` as the page would run them, then
  pypdf in strict mode and poppler on the result: 7 changed (a Quartz letter and a Chromium sheet took a title, English
  and the title display; the ELL IET notice and the color palette their title display; the Law TMC English), 48 came
  back byte-identical, 0 problems, text and tags unchanged on all 55. Node runs the writer with the same
  `DecompressionStream` the browser uses, so the sweep is the browser's path.

## Finish remediation from the card (S554, 2026-11-02)

Sam, opening the session: *"last week, team members tried to use the library to remediate some docs and I guess the
Library wasn't configured well enough to handle pdfs, etc. They are sitting in the Library and when I go to try to
complete the remediation, there doesn't seem to be an intuitive way to do that."*

- **Measured (live read, `cpl_library`, 2026-11-02):** three records with `remediation = 'in_remediation'`, all
  `home = 'not_filed'`, no link: *CPL Focus Group Activities* (`.pptx`, 10-30), *Sample Resume* (`.pdf`, 10-30) and
  *0900 0945 Welcome and Introduction* (`.pptx`, 10-29). None reached a download. The PDF failure itself was fixed by
  S553 (#2699); the stuck records were not.
- **The cause:** remediation runs in the browser on the person's own copy, and a record holds a link, never bytes (the
  tab's standing rule). A record left mid-way therefore has nothing to resume from, and the card's only path was
  *Revise and remediate*, which opens the one box to request a session rebuild.
- **The fix:** on a record In remediation with no link, *Revise and remediate* gives way to **Finish remediation**, a
  `<label>` for a file input that accepts what remediation reads. The chosen file opens the report with the record's id
  already bound (`pk.recordId`), so `remRecord` writes nothing new, and the download's PATCH lands on that record. The
  card's flag says *the Library keeps the record, not the file* and names the file to choose. A remediated record with
  no link makes *File it* primary and says to put the file in the CPLLibrary folder first.
- **Lesson:** a record that names a state must name the next step from that state. *In remediation* with no action
  that resumes it reads as broken, the same lesson S553 learned from a report that applied nothing.

## Moved from the lane (S553 SkyPinwheel, 2026-11-02)

### Regenerate, and the documents a piece is built from (Sam, 2026-10-26; built S490)

Sam: *"I want to make sure I can Regenerate a visual when I either add a document or note to it ... Also, when I want
to generate a new visual based on a document I upload. Seems like perhaps we should consolidate the Library and CPL
Opportunity Analysis procedures and sites."* One procedure now serves both: **Revise and remediate** on every record opens the one box with that piece picked (⑪
below), saving `refresh_note`, `sources` and `regen`; a public piece's draft waits for **Replace the public copy**. **Start a piece** (and Make a visual for anyone but a college) takes
documents too, so a new visual can start from a document. A session does the rebuild: the scheduled runs read the
requests (step 6 of [`scheduled_sessions`](../scheduled_sessions.md), which says how each kind of piece is rebuilt), and
*Copy the request* hands the same paste to a session. A college's CPL Opportunity page gained a notes layer: what a note or
document asks for goes to `library/cpl-opportunity/notes/<slug>.json`, shown under At a glance, with a draft at
`<slug>.draft.json` read at `?college=<name>&draft=1`. Schema: `kb/supabase_cpl_library.sql` (sources, regen, two checks).
Tests: `library` (13, 14, 9, 19), `college_cpl_workbook` (the notes).

- **The Microsoft 365 connector waits on RCCD's approval** (Sam, 2026-10-26). A card whose only file is on SharePoint
  says to drop in a downloaded copy (S540; lessons, *SharePoint is closed to a session*).
- **Sam's Sheet 131 rulings:** a Library-only run every two hours on weekdays, 7 a.m. to 5 p.m. Pacific. Not created: Sam, Sheet 153 card 1, *overnight*, left it to the overnight queue (paste in [`scheduled_sessions`](../scheduled_sessions.md)); the college page lives at `library/cpl-opportunity/`. The full text moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S509)*.

The Coordinator Guide (In development, Draft 1) and the ELL IET and DSP pages (Version 2, the public copies): [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S518)*.

## S557 SkySculptor (2026-11-03): the ELL IET Version 3 draft from a forwarded email

- **A Revise request can carry a third party's email inside Sam's note.** Sam's words name the asks (remove one
  grantee, fold in the agenda, add Request Adopt, scan the Commons); the forwarded email from Amber Shevin (IRC) is
  the content those asks point at. Each of her questions got an answer on the page: the *Wider ring* band now reads
  *A course-to-course path* and says the path exists, and a band *After the grant* lists what grantees can do.
- **Request Adopt on an agency visual** uses the same address the CPL Opportunity visual builds
  (`?Exhibit=<id>&View=Non-Military`), and only for an ID `kb/reference/map_cpl_opportunities_verified.json` lists:
  25 of the page's example rows. A row resting on a course alone says *No credit recommendation for this course yet*.
- **The harvested programs reach a piece through its Basis column**: `make_brief.py` reads
  `kb/program_requirements_college/*/records/*.json` (blocks with rule `all`, alternatives included) and names the
  programs a course is required in (20 rows).
- **A link inside a table cell is a target.** `npm run a11y` failed 25 *Request Adopt* links at 16px; the agency
  template (`agency-visual/build.py`) now sets `td a` to 24px, which every agency visual inherits on its next build.
- **Stamp `ready_at` from the clock at apply time.** The migration carried a guessed time 45 minutes ahead; S557
  corrected it in place and wrote the correction into the migration file, whose rollback restores `regen` whole.

## Moved from the lane (S557 SkySculptor, 2026-11-03)

**A shareable Claude artifact gets a Library record, routinely (Sam, 2026-10-20):**
*"I want to add artifacts like this routinely to the library."* A page made for others
stays on claude.ai; the session adds a record with `home` `web`, the artifact link, and
`rebuild_from` naming the HTML source it commits to the vault beside the work. Writes go
through a committed receipt and `supabase-migrate.yml`. First:
`dsp-credit-starting-points` (`kb/receipts/cpl_library_dsp_starting_points_2026-10-20.sql`,
applied 2026-10-20 by `supabase-migrate.yml` run 39500044669; the record, the memory row and
its log row read back 1, 1, 1).
`cpl_memory` `sam-claude-artifacts-go-in-library-2026-10-20`.

### Sierra beside the library and reading it (Sam, 2026-10-24; built S469)

Sam's asks of 2026-10-24 are built: an Ask Sierra side bar any public page loads with one script (`sierra/sidebar.js`,
resizable, light by default; the library, COBI's Library tab, the Fact Sheet and the funding model page carry it; test
`tests/sierra_sidebar.test.js`), and `cpl-chat`'s LIBRARY BLOCK, which reads `cpl_library_public()` and answers from a
listed piece's own text (test `tests/sierra_library.test.js`). The full record, his words and the mechanics moved verbatim
to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane (S480)*.

## Moved from the lane (S577): remediation items ⑥ to ⑰

✅ **⑥ Headers, footers and text boxes in a Word document's contrast (S512), ⑦ a PDF read at its source (S513; written since S553, ⑮ below), ⑧ a workbook remediated (S514), ⑨ its contrast (S515) and ⑩ its conditional formatting (S516).** Each full record moved verbatim to [`docs/library_lessons.md`](../../library_lessons.md), *Moved from the lane* (S513 to S517).

✅ **⑪ A chart's contrast is measured (S517)** in a deck, a document or a workbook: series against the plot area, Office's own colors as drawn, its words against what they sit on. Detail: [`docs/library_lessons.md`](../../library_lessons.md), *A chart's contrast (S517)*. Tests: `library_remediate` (135).

✅ **⑫ Remediation drafts first and files as it opens (S517, Sam's session, #2552 to #2554).** Each picture is drawn with its slide and drafted before the report opens (Claude from the picture and its slide's words, a QR code from the address the page reads, a video from its name); the person keeps, edits or redrafts, or uses *Keep all*. One bar, a part per WCAG 2.2 check, counts down to the Chancellor's Office review, the standards beside the header (the CO's 2025 certificate, which Sam shared). A file is a Draft in the Library the moment it opens (`cpl_library.remediation`), and two boxes count and filter it; the download opens its form for the SharePoint link. Sam: *"the library is functioning as much as a work space for all docs as a repository."* Detail: [`docs/library_lessons.md`](../../library_lessons.md), *Each picture with its slide (S517, Sam's session)*.

✅ **⑬ Each slide beside its item, empty boxes removed (S518, #2556).** Detail: [`docs/library_lessons.md`](../../library_lessons.md), *Each slide beside its item (S518)*.

✅ **⑭ A title box for every slide, a script in the notes, the deck's own slide order (S518, #2557; `slide-script-draft` v1).** Detail: [`docs/library_lessons.md`](../../library_lessons.md), *A title box for every slide (S518, later)*.

✅ **⑮ Every draft applied as the report opens, and a PDF written (S553, 2026-11-02; Sam: *"a full remediation without waiting for confirmation on each element but then present the elements remediated as it does now for any edits needed"*).** Every alt text, slide title, sheet name and contrast fix is in the file from the start under *Remediated for you, to edit as needed*; *Needs you* holds only what has no words or needs a person in the program; Keep and Keep all are gone. A PDF gets *Download the remediated file*: its title, language and title display written as an incremental update that keeps every byte (55 team PDFs verified); tags, pictures' alt text and a scan's text stay at the source, each an item with the steps and *Choose the source*. `.pptm`, `.ppsx`, `.docm`, `.xlsm` read as their kin; other kinds say what to do. Detail: [`docs/library_lessons.md`](../../library_lessons.md), *Every draft applied, and a PDF written (S553)*. Tests: `library_remediate` (178), `library` (270).

✅ **⑰ Last modified first, a quieter project count, and the draft's version named (Sam, 2026-11-05).** The register
sorts by each piece's `updated_at` (falling back to `made_on`), so a group sits where its most recently changed piece
does, and a project card's *Updated* date reads the same field. The project card's 176px "2 pieces" tile became a small
muted label to the title's right (*"shrink the chip and put it to the right, so it doesn't get focus and the title is the
focus"*). A ready draft now reads *Version 3 is ready to review* and *Version 2 stays public until you replace it*: the
card said "Version 2" over "A draft is ready," and Sam read Version 3 as missing. Tests: `library` (279).

✅ **⑯ Finish remediation from the card (S554, 2026-11-02; Sam: the team's remediations sat in the Library with no intuitive way to complete them).** The Library keeps a remediation's record, never its file, so three records (two decks, one PDF, 2026-10-29 and 10-30) sat at *Not filed* and *In remediation* with only *Revise and remediate*, which asks a session to rebuild. A record left In remediation with no link now offers **Finish remediation**: a chooser for the kinds remediation reads, opening the report bound to that record; its download marks the same record Remediated and opens its form for the link. A remediated record with no link makes *File it* its first action. Detail: [`docs/library_lessons.md`](../../library_lessons.md), *Finish remediation from the card (S554)*. Tests: `library` (275).

**NEXT:** the other inputs the bar shows people doing most, in that order (Sam's framing); a chart's per-label colors (`c:dLbl`) when he asks; a tagged PDF's pictures drafted and written (`/Alt` on each Figure, which needs the picture's bytes out of the page's content) when a dropped PDF shows the need. The Chancellor's Office review still certifies.

## 2026-11-05 SkyBarnard (S577): revise a visual from its card

Sam said "Build it" to SkyMice's plan. The card's Draft it now calls `library-revise-draft`, which asks Claude for edits
to the Pages copy, each an exact passage occurring once, so every byte the request did not ask about stays; the
draft lands in `cpl_library_drafts` and the card offers Open the draft and Replace the public copy; `library-publish.yml`
publishes approved drafts every three hours with a receipt (#2791). The function holds no service key: it reads and
writes with the caller's own credential, so the table's policies and history trigger stand as they do for the page.
The MCP migration timed out on its confirmation prompt; `supabase-migrate.yml` applied the same file from the branch.
The function deploys through `cpl-chat-deploy.yml` once #2792 adds it to the choices (Sam: "Deploy it").

## 2026-11-05 SkyCartwheel (Library side session): revise on the card, and the List

Sam pressed *Ask for more changes* on ELL IET's ready Version 3 and "nothing seemed to happen". Three lessons came out of it.

- **A control that acts somewhere else reads as one that did nothing.** The click worked: it scrolled up to the box at the
  top of the tab and focused its Instructions, with the box's heading and the piece's name off the screen, far from the
  card he pressed. Version 22 puts the box, its answer and its errors on the card itself (`sayOn`), and a piece found
  anywhere opens its own card or row.
- **More changes to a draft must start from the draft.** Start on a ready draft wrote a fresh `regen` (dropping
  `ready_at`, `draft_id`, `draft_url`), and `library-revise-draft` always read the public copy, so more changes to
  Version 3 would have come back built on Version 2 with Version 3's changes gone. A request now names its base
  (`based_on_draft`) and keeps every earlier draft (`regen.earlier`); the box starts with no documents, because the ones
  the draft was made from are already in it. `tests/library_revise_draft.test.js` D fails on the old behavior.
- **A draft held only at a claude.ai link is out of reach of the machine.** Neither `library-publish.yml` nor the edge
  function can read claude.ai, so Replace waited on a queue session. SkyCartwheel stored S557's Version 3 Pages copy as a
  `cpl_library_drafts` row (migration `2026-11-05_library_ell_iet_v3_stored_draft.sql`, sha256 in its header).

Two smaller ones from the build:

- **An iframe's `srcdoc` set after it is in the page fires its first load for about:blank.** The draft check read an empty
  page and reported no title and no language; set `srcdoc` before appending the frame.
- **A seeded a11y target measures what the unseeded one never opens.** `cobi:library` reaches only the locked view. The
  seeded `library-list` target, with a panel open, found the Details links at 20px and a skipped heading level; the
  Cards view had hidden both behind a closed Details. A lead word in `--seal-blue` vanished in dark mode, found by the
  dark screenshot; a lead takes `--cobalt` (the link role every theme defines) and weight, never a second color.

Fable advised on the flow (one public copy, at most one draft, four states, the next step on the card; "promise a check,
not a repair"). Sam: "Version 22 looks better"; "Do we need the One chip? Why not put focus on the title"; then the List.

## Moved from the lane (SkyCartwheel, 2026-11-05)

- **Revise from the card, no session (built S577, SkyBarnard; Sam, 2026-11-05: "Build it").** On a piece with a Pages
  copy, Revise and remediate's request now offers **Draft it now**: the edge function `library-revise-draft` reads
  `library/<slug>/` from Pages, asks Claude for edits (each an exact passage occurring once, all or none, the page's frame
  kept; `apply_edits.mjs`), stores the draft in `cpl_library_drafts` and sets `regen.ready_at` and `regen.draft_id`, all
  with the caller's own credential. The card offers **Open the draft** and **Replace the public copy**; every three hours
  `library-publish.yml` (`scripts/library_publish.py`) writes an approved draft to `library/<slug>/index.html` with a
  receipt (`kb/receipts/library_publish/`), commits to main, then moves the record (Version N+1 Current, the one before
  Replaced, Changes to make and regen cleared), guarded on the `updated_at` it read. A piece with no Pages copy, a
  SharePoint file, or only a linked document still goes to a session (Copy the request). Governance: dismissed with
  reasons (`table:cpl_library_drafts`, `function:library-revise-draft`, `workflow:library-publish.yml`). Migration
  `kb/migrations/2026-11-05_library_drafts.sql` (rollback beside it); the function deploys with `cpl-chat-deploy.yml`
  (`function: library-revise-draft`). Tests: `tests/library_revise_draft.test.js`, `tests/library_publish_test.py`.

## 2026-11-05 SkyRoundoff (ELL IET Version 4; the List's band order)

Sam's Revise request (15:42Z): *"move the grantee sections each to a tab on the visual so there is a main section and a
tab for each project"*. On seeing the draft: *"new visual looks wonderful!"*

- **The card answers before a session starts.** `library-revise-draft` had a machine draft ready two minutes after the
  request (b1925d33, 15:44Z). The session's build from the vault source took `regen.draft_id`; the machine draft moved to
  `regen.earlier`, kept rather than dropped, and the migration's guard named it.
- **`scripts/library_page.py` writes the public path.** Building a draft with it changes `library/<slug>/index.html`;
  copy the result aside and restore the file before committing, or the public copy changes without Replace.
- **axe sees only the shown tab.** `npm run a11y` passed on the Overview while every project tab failed target size
  (contact emails at 22.8px). A tabbed page needs each tab selected and checked; the 390px and 1440px pass did that.
- **Tabs add text Sierra counts.** Tab names, a heading per panel and the Overview's project lists took Version 3's
  33,273 characters to 35,104; trimming the repeats brought it to 33,979 of `LIBRARY_TEXT_MAX` 34,000.
- **A sort key for "none" must be a letter.** The List engine orders bands A to Z by `localeCompare`, and ICU puts
  `~` before digits; a band with no modified time takes `z` so it goes last.
- **Merging `main` into a branch carries `main`'s `kb/migrations/.apply`** and fires `supabase-migrate.yml` on that
  branch (run 42061383625 on #2808). The V3 migration it named is guarded, so it could not write twice.

## 2026-11-05 SkyFlipFlop: Version 5, the Initiative at a glance

Sam's Revise request (18:30Z): *"add a brief high level overview of the Chancellor's Office CPL Initiative as a visual with a
link on this page"*. Then, in session: *"is there a way to do this from the Library on the fly without opening a session or
waiting for an overnight cron?"*, *"I just integrated grokbot, so if we could pass it to a bot to do from the Library,
advise"* and *"I could add a bot specifically trained for this by you"*.

- **The card already does it on the fly.** `library-revise-draft` drafted the change 27 seconds after the request
  (22d6f5de, 18:30:45Z). What a session adds: the change lands in the vault source, so the next rebuild keeps it; a browser
  a11y pass of every tab; and Sierra's character budget, which the machine draft overran (about 900 characters over
  `LIBRARY_TEXT_MAX`).
- **Sierra's budget sets the size of any addition.** Version 4 sat 21 characters under 34,000. Version 5 made room by
  shortening two phrases repeated 14 and 7 times; the build checks both counts, so a moved phrase stops the build.
- **The top cards open what they count** (Sam, in session: *"can you make the top cards clickable so they go to the items
  they are counting?"*, then *"this should be a rule for all visuals if advisable"*; now a Presentation rule in `CLAUDE.md`).
  The figure is the link and the whole card takes the click; the participants card stays plain, its figure summed from a
  line on six tabs. `npm run a11y` failed the first try: a focus ring moved to the card is no ring on the link.
- **A stored draft is kept as made.** `cpl_library_drafts_guard` refuses any change but the publish stamp, so the first
  try at adding the card links to the stored draft failed (receipt `..._v5_card_links_42088269186.json`). The next build of the
  same version is a new draft row, and the one it replaces joins `regen.earlier`.

## Moved from the lane (SkyLoop, 2026-11-06)

Three standing notes from the lane's *Next*, verbatim, so the lane stays under its budget:

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

And three shipped records from the same *Next*, verbatim:

- **ELL IET Version 5 is public** (SkyFlipFlop, 2026-11-05; Sam's Replace at 22:34Z, `library-publish` dispatched, run
  42122991947): the Initiative at a glance and top cards that link; built by `make_tabs.py` from Version 3.
- **Version 5 in the library look; public cards date the newest version** (2026-11-06, Sam in session): `make_tabs.py`'s
  `library_look`; agenda item 2 opens the overview. `cpl_library_public()` returns `revised_on` and `version_label`
  (`kb/migrations/2026-11-06_library_public_revised_on.sql`, applied through the MCP). Still Version 5.
- **The card's quick revise closes its gaps** (Sam: *"build fixes 1-3"*, #2824; `library-revise-draft` v3 deployed):
  the drafter is told Sierra's budget and records `request.sierra`; the card's check adds target size and Sierra's count;
  a published model draft of a scripted piece raises *Source behind the page* until the source catches up.

And two more, verbatim:

- **Revise from the card, no session** (S577, SkyBarnard): its build record moved verbatim to `docs/library_lessons.md` (*Moved from the lane, SkyCartwheel*).
- **The Credential Catalog sits in COBI's Share menu** (Sam's ask, #2826): a launcher to `library/adopt/` after CPL Funding.


## 2026-11-06 — CPL-AI hosted, joined and shown; the Catalog's one-line List and badges (SkyLantern)

**Sam's decisions this run** (in session): the Catalog's List one line a credential with the status and the ask as
columns, its tiles following the filters, lazy loading, faculty review above (#2850); *"connect CPL-AI in the Exhibits tab
and make sure we can host all the data, which for now will not have any further updates"* (#2851); *"join the 115 to
common exhibits"*; *"make the seven title fixes in the CER"* and *"fold the duplicate ServSafe Manager exhibit"* (#2852);
*"have the Exhibits List row name its CPL-AI pairs"* (#2853); badges *"like badges on the credential"*; *"I do want the
CPL-AI recs on public view"*; the mock *"looks good"*, with a resizable panel and the recommendation shown in place.

**What the run learned.**
- **A button swallows a cell's ellipsis.** `text-overflow` on the `td` clipped titles silently; the button inside needs
  `display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis`.
- **Tile listeners were bound on every data load** (init and again after `adopt_more.json`); wire once, redraw often.
- **A partner's whole dataset fits when repetition folds.** 33,232 reports read once (six at a time, 17 minutes, no
  failures) are 154 MB; each certification's text and each course outline once per file, source lines in a table, and
  gzip make 23 MB, the largest file 282 KB. Artifacts serve no gzip: the mock ships the same bytes as base64 text.
- **A hand fixture hid a type bug.** The index counted every tier as 0 (a string key read as a number) while every test
  passed; the build's check now requires the tiers to sum to the pairs.
- **The join is a judgment, so it records one.** Ranked candidates (title tokens, a code that must agree) then a person's
  call per certification, each with its reason. The reference's "Information Technology Specialist" is a city job title,
  and three personal-trainer certifications and two State Water Board grades sat under course-proposed titles: the
  aligned course misnames brands, again.
- **A title a person placed moves only in the revise shape**: a guarded replace of the assignment beside
  `unified_title_supersedes`. Preview the fold by editing a copy of the synced overlay and running its dry run.
- **`cred-rename-apply.yml` applies the whole queue**, so one stale override holds every merge: read the nightly
  `alias_map.json` summary (`apply_safe`) before dispatching. Three of Sam's own rows held the ServSafe fold.
- **A generated file's merge is not its build**: the auto-merged `exhibit_join.json` differed from the builder's in 68
  lines.
- **A timed-out create can leave nothing**: list the branch's PRs before creating again.

### Moved from the lane file at this checkpoint (verbatim)

**CPL-AI in the Exhibits tab (SkyLantern, 2026-11-06; Sam: "connect CPL-AI in the Exhibits tab and make sure we can
host all the data, which for now will not have any further updates").** The view **CPL-AI recommendations**
(`#exhibits/cpl-ai`, `#exhibits/cpl-ai/<code>`; `exhibits_cpl_ai.js`, loaded on first open) lists the 115 certifications
with pairs by evidence tier (a college pick narrows the counts), opens one to its pairs one line each (tier words,
college, search, CSV, lazy batches), and opens a pair to its full report: scores, the domain-by-domain alignment with
both sides' quoted evidence, the course outline's outcomes and skills, the sources, and a link to the same report on
the CPL-AI page. Data: `kb/cpl_ai/hosted/` from `kb/_harvest_cpl_ai_reports.py` + `kb/_build_cpl_ai_hosted.py`
(`--check` in CI via `tests/exhibits_cpl_ai.test.js`). Frozen, so nothing schedules a re-read. **The 115 joined to
common exhibits (Sam, same day: "go ahead and join the 115 to common exhibits"):** `kb/_build_cpl_ai_join.py` holds each
judgment with its reason and writes `kb/cpl_ai/exhibit_join.json`: **39 exact**, **7 named under another exhibit** (ACE,
ACSM and NASM personal trainer titles under two mistitled exhibits; the State Water Board's wastewater grades II to V
under exhibits titled like courses: title fixes for the CER, never made here), **8 related**, **61 with no exhibit**;
`--check` fails when a named exhibit is re-titled. The view names each certification's exhibit and, for one MAP awards,
who awards it and which colleges hold a Strong evidence course and do not award it yet (Security+: 25 award, 74 leads).
Session judgments; a curator's correction wins. **The seven title fixes (Sam, same day: "go ahead and make the seven
title fixes in the CER"):** five local titles, each placed by Sam in Review on 2026-10-31 under a title the aligned course
proposed, move to the credentials they name through `kb/cer_decisions_out/2026-11-06/plan.json` (cohort
`exhibits-s594@bot`): ACE, ACSM and NASM personal trainer certifications to their own exhibits (Personal Trainer
Instructor retires; Personal Training Certification keeps its one generic local title), and the State Water Board's
wastewater grades to *Wastewater Treatment Plant Operator Certificate, Grade II or Higher* and *Grade IV or Higher*.
The rows are the Exhibits tab's Change to Proposed Title shape (a guarded replace of the assignment beside
`unified_title_supersedes`), which `kb/_cer_decision_apply.py` now accepts and nothing looser; the nightly fold's revise
lane re-points them. After the fold the join reads 46 exact. The same plan folds the duplicate *ServSafe Food Protection
Manager* (one machine-placed prep-course title) into *ServSafe Food Protection Manager Certification* (Sam: "go ahead and
fold the duplicate ServSafe Manager exhibit"), an override with its merge confirm that `cred-rename-apply.yml` carries.
**CPL-AI goes public (Sam, in session 2026-11-06: "I do want the CPL-AI recs on public view"),** which answers Sheet 147
card 5's hold for the public pages. **The Catalog features them as badges** (Sam, same day: "maybe by using the attributes
we will be attaching for next gen credential registry? like badges on the credential"): one attribute layer, each badge a
fact with its source and date that opens what it names; first *Statewide recommendation* (the Fact Sheet's 153, a pale
fill) and *CPL-AI course match* (42 joined, a dashed outline: evidence for faculty review, never a CPL determination).
Mock: https://claude.ai/artifact/2FhevexZqhwdyMyuVT9vFu (Version 1, real data for 22 credentials). **Next:** the badges
on the live Catalog once Sam reacts to the mock; Sierra's CPL-AI answers. **The ServSafe fold waits:** its rows are
written (receipt `kb/cer_decisions_out/2026-11-06/applied_2026-11-06T19-49-56Z.json`), and `cred-rename-apply.yml`
refuses while three of Sam's 2026-10-27 overrides are unsafe (Spanish 1 and 2, whose titles left the reference; Wheel
Alignment, Chassis Dynamics, and ADAS, a rename into an existing title with no merge confirm). NEEDS SAM.

**The Exhibits List names each row's CPL-AI pairs (SkyLantern, 2026-11-06; Sam: "have the Exhibits List row name its
CPL-AI pairs"):** under the title, *CPL-AI, 343 pairs* (several certifications counted, a related join marked), its full
sentence in the word's title; one certification opens on itself, several open the CPL-AI list searched to the exhibit; the
side panel spells each out; the filter *CPL-AI recommendations* (`#exhibits/list/cplai`) and the search find them. Read
from `kb/cpl_ai/exhibit_join.json`'s `by_exhibit`.

**The Credential Catalog, the public adoption page — built (SkyTwinberry, 2026-10-31; Sheet 147 cards 1, 3 and 4; named
on Sheet 148).** `library/adopt/`, Pages-served, linked from the Library and the public header.
`kb/_build_adopt_page.py` writes `library/adopt/adopt_data.json` daily from `kb/exhibits_adoption.json`: **settled means a
local title under the credential carries a review stamp** in `kb/unified_titles.json`, a person's or a cohort's, the
classifier's sure saves included (the mock-up's Reviewed tile, which Sam answered on). That gives 957 credentials of 2,232
in the reference, against 677 without the classifier's stamps and 495 on a person's alone. Columns are the 119 colleges
`college_lookup.js` holds; CSU Los Angeles takes none. The page has Malone's CPL/AI look and the Library's header with the
Library linked. Its filters are College, Show (*Not adopted yet*, *Adopted here*, *Every credential*), Field (CIP sector),
CPL type, SW Region, ASCCC Area, District and Search. The **Credentials** view puts the college's own course first, then
the most colleges, with Request Quick Adopt chips per building college (a scope never sees its own) and each college's
units and credit lines. The **College matrix** is windowed like EACR's, shows units or *C* for a college that already
teaches a matching course, has arrow keys and a tooltip, and a content filter never drops a column. The page also offers
both CSVs and **Create Handout** (the college's `library/cpl-opportunity/` visual). It writes nothing and remembers no
filter, and `?college=` follows the pick. Guards: `tests/public_adopt.test.js` (44), `tests/adopt_page_build_test.py` (19),
`npm run a11y -- public-adopt public-adopt-dark public-adopt-matrix` passing at every width.

## SkyBeacon (2026-11-06): the Catalog's badges and college view, the CER retire path, the Commons from a recording

- **Read the open PR's branch, not main, for a handoff.** SkyLantern's emergency handoff rode its open PR (#2853), so
  `main` still carried SkyLoop's; the greeting's moniker (SkyBeacon) was the tell. `list_sessions` plus the open PRs found it.
- **A test can pin a fixture that moved with the rule.** The ask rule moved the ask off articulated cards; the one failing
  check (92/93) looked for a review row's count in the List, where review rows never appear. Fix the check's fixture, keep
  the rule.
- **Ship data the page loads after first paint as its own file.** CPL-AI's per-college ratings for 47 exhibits are 1.2 MB
  (241 KB compressed); inlined they would have doubled `adopt_data.json`. `adopt_ai.json` loads after the first paint and
  the college block redraws when it lands. The full recommendation stays in the hosted shard, read on request.
- **A regenerated map can name a file you did not commit.** The dependency map built while the uncommitted
  `adopt_ai.json` sat in the worktree named it, and CI's `--check` failed. Regenerate after cleaning the tree.
- **A retire is a delete, so it carries the row whole.** The CER applier's retire path keeps the full row (value,
  reviewer, dates) in the receipt before a guarded DELETE, and `--rollback` inserts it back, letting a row a curator wrote
  since win. Without that a data write cannot be undone from its receipt (Rule 10 a2).
- **A silent screen recording still answers.** Sam's 13-second clip had no audio; eight stills named three faults
  (overflowing Details lines, stale Subjects counts, a hidden Mark done). Measure the page in a real browser before
  fixing: the overflow read 3,414px in a 1,920px window, 15 of 15 lines; after the fix, none.
- **A CSS grid's auto column defeats an ellipsis.** A list styled `display:grid` with no template gives each item an
  automatic minimum width equal to its unwrapped text, so `text-overflow: ellipsis` never fires and the cell grows.
  `grid-template-columns: minmax(0, 1fr)` and `min-width: 0` on the items restore it.
- **A note should settle every finding it answers.** The Subjects scan let a note settle a divergence (CS4, CS5) and not a
  weak mnemonic (CS6), while the card told Sam to *confirm or note*. Nine notes he wrote never counted.
- **A sign-in gate drawn once must follow the keeper's renewal.** See the KB note
  `methodology-refresh-token-before-write` (the draw-time half) and the lane `reviewer-session-lifetime`.

## SkyHarbor, 2026-11-06 (Library side session)

- **A college's C-ID claim is its own word, not ASCCC's.** Sam saw Basic Military Training offered on Sierra College's
  HIST 50. Moreno Valley's COCI row put HES 1 Health Science under C-ID HIST 150, with no ASCCC approval behind it, and
  the identity layer trusted it; one bad member reached 106 colleges' visuals and Sierra's alignment tool, which took the
  first peer C-ID a recommendation met. Four signals agreeing (no approval; subject, TOP family and title all apart from
  the group) found exactly 2 statewide. Fix at the source, keep the consumer's rule: see the KB note
  `methodology-a-c-id-claim-is-a-colleges-word-not-asccc`. (#2862)
- **Measure the blast radius before naming it.** The first cut (subject and TOP disagree) flagged 214 members, mostly real
  cross-listings (Medical Terminology under business, networking under electronics). Adding the title signal brought it
  to 2. A finder that lists cross-listings teaches the team to ignore it.
- **A stored file the daily run never rebuilds needs its own apply.** `kb/coci_articulations.json` is re-keyed by
  scripts, not reseeded, so the hold re-keys the record itself with a receipt; `--rollback` restored the file byte for
  byte before the real apply.
- **A data change ripples into prototype payloads.** Moving one record left `prototype/ccr_universe.json` counting six on
  HIST 150, and `lints` caught it. Main's universe was already behind its own inputs (157 vs 159 islands), so the sky
  placement had to follow the fresh build. Run every lints step locally after a data move, not one.
- **A workflow's receipt commit starts no CI.** The migrate workflow's push left #2860's head with no checks; merging main
  in (a real change) started them. Never an empty commit.
- **The statewide view was already loaded.** CPL Pathways read all 17,547 records' index at open; widening that read by
  `counts:display->counts` (about 60 bytes a row) gave the statewide cards and List with no new read. Look for the read
  you already pay for before adding one. (#2863)
- **The List engine draws the title in the first column.** Putting College first printed program names under it; the
  statewide List names the college second and sorts by it.
- **Add your credential: nothing a visitor types shows until verified.** One INSERT-only add, a reviewer-only decide that
  keeps each prior state in the row's history, a verified-only public read. The repo's Supabase guard blocks DDL in a
  rolled-back dry run, so the first real run is the migrate workflow; verify the grants live after it. (#2860)
- **Judge a local test sweep by exit code, never by the last line.** Four CPL Pathways checks pinned the old rulings and
  printed `N/M passed` as their last line while exiting 1; a sweep that grepped the last line for "fail" let #2863 reach
  CI red (suite 3). `node $t >/dev/null || echo FAIL $t` over every test that loads the file caught them all.

## SkyMeadow, 2026-11-07 (Library side session)

- **A mis-fold has a cause upstream of the table that shows it.** The handoff named *Plant Propagation* as a credential
  carrying Spanish and nutrition lines in `chatbox_peer_articulations`. Measured, it carried 101 rows across 28 subjects,
  and the cause sat in `kb/unified_titles.json`: the 2026-11-01 unclassified triage (rows reviewed by slee@cccco.edu) gave
  *Credit By Exam at Saddleback College* one course's title. The same pass did it to three more whole-college Credit by
  Exam exhibits and put CompTIA A+, Network+ and Server+ under Security+. A curator's rows are held for him (Rule 8):
  Open Asks Sheet 163 card 4. A credential whose rows span many subjects is the tell: rank titles by distinct subjects.
- **A live interval in a tab hangs a jsdom suite.** The Pathways hero's first cut ran `setInterval` on draw, and
  `tests/cpl_pathways_ui_pass.test.js` never exited. Gating the cycle on IntersectionObserver (absent in jsdom) fixed the
  suite and gave a better rule: photos move only while the reader can see them. (#2866)
- **insurance.ca.gov is outside this environment's network.** The proxy refuses it and the fetch agent cannot resolve it;
  the Department of Insurance's license list waits on that host being allowed or on a run that can reach it.

## Moved from the lane, SkyFern (2026-11-07)

From `docs/reference/lanes/cer-procedures.md`, verbatim, to keep the lane under its budget:

**The List view** (S540, S541): every credential A to Z, edited in place, *Re-analyze* (step 9); find by college, district or region; find and replace; **AI sort** with suggested folds and Re-point; Edit every row; **Basis**, based on statewide or local (`fact-sheet/statewide_recs.js`: 152; the reference flag reads 84); the **exhibit-to-cert link** (`kb/exhibit_cert_links.json`: 280 titles to 235 certs); **kept groups** (S542, #2655): a band over every run (titles alone under *Not in a group*), tick rows to Move, Out of every group or Back to the AI sort, Keep this group, Rename (a shared name joins two), Release; `exhibit_group` on `_CREDENTIAL_REVIEW::<title>` laid over the nightly sort (the builder does not read it yet). Since S542 the List is drawn by the shared engine `commons_list.js` (#2656) and spans the window (#2661). A title opens a side panel (2026-11-03): the folded members, issuer and sites edited there, the rest folded; a Students column. **SLO hints (#2684):** a title whose articulated courses match another's at SLO similarity 0.5 or more, through distinct courses, shows *Outcomes match:* with that title and its group; Sam acts with Move. `kb/_build_exhibit_slo_neighbors.py` writes `kb/exhibit_slo_neighbors.json` daily (guard `tests/exhibit_slo_neighbors_build_test.py`).

## 2026-11-07 SkyTriangulum (S599, the CPL Queue routine): DSP Version 3

Sam's fourth Revise request on DSP Credit Starting Points (11:29Z): *"update this using the new format (like ELL IET visual
uses) and add any new data as well as Request Adopt Links wherever possible and any needed links to CPL Pathways or
Credential Catalog,"* noting *"my previous 3 attempts to make those changes have not been effective."*

- **A change of format is a session's job.** `library-revise-draft` edits exact passages of the Pages copy, so three
  requests on 11-06 came back as small edits or as "no changes asked". The session rebuilt from the vault source:
  `dsp-training/make_brief.py` (Version 3) and a new `dsp-training/make_tabs.py`, which imports ELL IET's tab script,
  tab CSS and `library_look` rather than copying them.
- **Request Adopt needs an exhibit.** MAP holds no DSPT exhibit and no example course is articulated, so no example row
  can carry the link. The page gains a band of five MAP exhibits a DSP may already hold (first aid and CPR, nurse
  assistant, community health worker), each with Request Adopt.
- **The link forms:** a college's CPL opportunities, the visual CPL Pathways opens, is `library/cpl-opportunity/?college=<MAP
  name>`; its Credential Catalog view is `library/adopt/?college=<MAP name>`.
- **Checks:** `npm run a11y` (light, dark) and axe on each of the six tabs at 390px and 1440px, light and dark: no
  findings. Sierra reads 16,657 of 34,000 characters.

## Moved from the lane (SkyTriangulum, 2026-11-07)

- **The List's project bands lead with the newest piece** (#2812, SkyRoundoff; Sam's report: *"the sort descending by
  modified date only partially works--ELL is not at the top of the list but was last modified"*): `bandNewestFirst`
  orders them, as the Cards' project cards already were.

## S605 SkySextans (2026-11-08, the CPL Queue routine): the Coordinator Guide's Request Quick Adopt links

Sam's Revise request of 2026-11-05 on the CPL Coordinator Getting Started Guide: *"can you add the Request Adopt buttons
to any courses or exhibits possible?"*

- **A guide for every college names no college's exhibits, so the links go where it tells a coordinator to adopt.**
  Under *Setting up MAP*: a table of Basic Military Training and the seven statewide credit recommendations the most
  colleges have adopted (`statewide_data.js` `adopters`, among the 169 IDs `fact-sheet/statewide_recs.js` names), each
  with *Request Quick Adopt* opening its MAP exhibit card. The Credential Catalog joins Resources for the rest.
- **Basic Military Training takes `View=Military`.** `map_links.js` hard-codes `View=Non-Military` because every ID in
  its index was non-military; MAP's API (`/api/collaborative-exhibits?searchTerm=MAPMM-BMT1-1-001`) gives BMT
  `CPLTypeDescription` *Military*, so a military exhibit's link names the Military tab (Pedro, 2026-10-28: both exist).
- **Draft 2 republished at the same artifact**; the record moves by `kb/migrations/2026-11-08_library_coordinator_guide_draft2.sql`
  through `supabase-migrate.yml`, because an unattended firing's `execute_sql` write waits on an approval prompt.
- **Checks:** axe (WCAG 2.2 AA) at 390 and 1440px, light and dark: none beyond the fragment's `lang`, which the artifact
  wrapper sets; every link at least 24px tall; no sideways scroll.

## Moved from the lane (S605)

- **Sam's noncredit visual, Draft 1 on its record (SkyLoop, 2026-11-06):** *Noncredit to Credit: How Noncredit Learning Can
  Result in Credit* (`cpl_library` 5e29e1d3…, his brief, 14:50Z) is drafted in the
  public library's look from the brief and `docs/noncredit_cpl_thinking.md` (who does what; six ways, each with its
  credit for prior learning type; four steps to an exhibit; the first question; where to go next). Mock https://claude.ai/artifact/Wi6htw18rtQ9WCM6ajtmnM (Version 3); draft row
  `cpl_library_drafts` 5b5f9e8a… and the record at Draft (receipt
  `kb/receipts/cpl_library_noncredit_draft1_2026-11-06_skyloop.sql`); source
  `CPLBrain/04-projects/cpl-initiative/noncredit-to-credit/`. His reactions of the hour are applied (the companion README lists them). Sam, ~16:10Z: *"visual looks great! go with it"* (and one correction: the Chancellor's film is her address to the 7th
  Annual CPL Summit): **published** at https://cpl-initiative.github.io/cpl-project-tracker/library/noncredit-to-credit-how-noncredit-learning-can-result-in-cre-mw53clp5/
  (`scripts/library_page.py`; the record Approved, Version 1, listed in the public library; `library-noncredit` in the a11y sweep).

## tender-fermi (2026-11-10, Sam's Library side session): any file, a new piece drafted on its card, and Pages

Sam: *"when I dropped the Adding CPL Coordinator and Noncredit Lead in MAP pdf of a ppt, apparently it didn't upload,
but I wasn't aware until cobix hunted that down"*; *"I can drop files when starting at the beginning, but not when
revising"*; *"need to be able to handle office docs, pdfs, google slides, videos"*.

- **Causes.** A PDF or deck picked as background was never read: `startPanel` saved the record with `sources: []` and
  a note at the end of a long line (record `71931018`). A card's Revise box had no drop target, so the browser took the
  file. A new piece had no drafter.
- **#3077 shipped:** `readWords` (Word, PowerPoint with notes, Excel, PDF through vendored pdf.js 4.10.38, captions,
  text); a file with no words saves nothing; drop targets on the Revise box and a Requested card; Google links read by
  their export in `library-revise-draft`; Draft it now on a Requested piece from the starter frame (`new_page.mjs`);
  Publish it; `library_publish.py` makes `library/<slug>/` as Version 1.
- **COBIx found four security gaps on #3077, each real:** a denylist passing `<svg/onload>`; a `blob:` draft running as
  the tracker (reads the team phrase); revision edits stored unchecked; edits rewriting code inside existing scripts or
  repointing `sidebar.js`. The fixes: an allowlist for new pages, a sandboxed `srcdoc` frame, frozen executable parts
  (scripts, handlers, sources string for string), CSS `url(`/escape/`image-set(` counts, a second gate in the publish
  script. Lesson: a count-based check on a page that already carries scripts misses edits inside them; freeze them.
- **A new test file can tip `check_ledger` (4):** the suite must stay over 60% floored; one unfloored file made it
  exactly 60%. Floor new files in `tests/check_floor.json` (append, never re-sort).
- **Pages.** From 16:53 UTC `deploy-pages` timed out in `syncing_files`. COBIx measured a 1.6 GB artifact, over the
  1 GB published-site limit; `kb/receipts/` was 2.0 GB of 2.9 GB, never served (#3088 prunes it, size check fails over
  1000 MB). `deploy-pages` caps its wait at 10 minutes whatever `timeout` says. **After the prune (374 MB) the deploy
  still timed out**, so size was not the whole cause; unresolved at this checkpoint.

## Moved from the lane (tender-fermi, 2026-11-10)

✅ **A piece's link beside a file: both reach the request (Sam, 2026-11-09, the ELL Healthcare Pathways side
session).** *"I tried adding the link to the previous ELL IEP visual to the new project link box, but it just shot me
down to the existing ELL IEP project thinking I was wanting to work on it."* The jump to that card also cleared the
Word file he had attached, so record `ell-healthcare-pathways-cpl-starting-points-mw9tepdk` was saved with no
document. `knownLink()` in `library.js`: a person who has picked a file or typed what to make is making something new,
so the piece's link becomes a document to work from and the file stays; a second link beside a file picked as
background is a second document, never a replacement. With the box empty the link still opens the piece's card, which
says how to use it as background. `tests/library.test.js` (22). The piece itself was built in session and filed
(`kb/receipts/library_ell_hp_filed_draft_2026-11-09.sql`). Its Pages copy is `library/ell-healthcare-pathways-cpl-starting-points/` (Sam the same day: a git address, never claude.ai), in `a11y.config.js` as `library-ell-hp`; every tab passed axe at 390px and 1440px, light and dark. It is not listed publicly; List publicly is Sam's switch.

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

## Moved from the lane (SkyWhirlpool, 2026-11-11)

Verbatim from `docs/reference/lanes/library.md`, to keep the lane under its budget.

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

✅ **Any file, and a new piece drafted on its card (Sam, 2026-11-10, #3077).** *"when I dropped the Adding CPL
Coordinator and Noncredit Lead in MAP pdf of a ppt, apparently it didn't upload, but I wasn't aware until cobix hunted
that down"*; *"I can drop files when starting at the beginning, but not when revising"*; *"need to be able to handle
office docs, pdfs, google slides, videos"*; and (2026-11-09) *"I haven't been able to successfully create a doc from
there yet--always need some sort of out side intervention"*. Causes: a PDF or deck picked as background was never read
and the record saved with `sources: []` (record `71931018`); a card's Revise box had no drop target; a new piece had no
drafter. Now:
- **One reader, `readWords`**, for every box: Word, PowerPoint (slides and notes), Excel, PDF (pdf.js 4.10.38 under
  `vendor/pdfjs/`, loaded only for a PDF), captions (.vtt, .srt), text. A file with no words (a scan, a video, an old
  .ppt) saves nothing and says why. A video's words come only from its captions or a transcript.
- **Drop targets:** the top box, a card's Revise box, and a Requested card (*Add a document* saves the words at once).
- **Google Docs, Slides, Sheets:** a link with instructions is a document to work from; `library-revise-draft` reads
  its plain-text export when the file is shared by link (docs.google.com only).
- **Draft it now on a Requested piece:** `library-revise-draft` writes Draft 1 from the starter page (the noncredit
  visual's frame, `new_page.mjs`, which keeps the frame and refuses scripts); **Publish it** approves it;
  `library_publish.py` makes `library/<slug>/` as Version 1 (`regen.new_piece`). Then List publicly, as for any piece.
- Tests: `library_any_file` (33), `library` (288), `library_publish_test.py`.

- **Pictures in a piece (Sam, 2026-11-11, S635):** *"the visual didn't include any of the map screenshots from the pdf
  that the user will need to know how to navigate map. i'd like to edit it in the library (not here)"*, then *"it would
  be even better if you ... just assemble the pics together with the text from the get go"*. A PDF's pictures are found
  in the browser (`readPictures`: pdf.js names where each image sits, the rendered page is cropped there at 200 dpi, so
  a deck's red boxes stay; a logo and a background are skipped) and saved as rows of `cpl_library_pictures`
  (`kb/migrations/2026-11-11_library_pictures.sql`). `library-revise-draft` shows them to the model, which writes only
  a marker, `<p>[[picture N: alt text]]</p>`; `pictures.mjs` turns each into the one fixed figure, so the allowlist and
  the frozen sources stand. The card shows the pictures (*Check the pictures*: Cover or crop, which rewrites the bytes,
  and Leave it out); Publish it and Replace the public copy wait for the box that says they were checked;
  `library_publish.py` writes `library/<slug>/img/<n>.webp`, deletes a picture file the page no longer shows, and
  skips a draft with pictures whose approval does not carry `regen.pictures_checked_by` (COBIx on #3095). A picture
  once published stays in the repo's history: a name in one needs a history purge (Rule 5), so the check before
  publishing is the gate. A PowerPoint is saved as PDF first. COBIx's session
  recipe (`pdftoppm -r 200`, crop, captions, full size on a click, alt text, the review step) is the same result by
  hand. Tests: `library_pictures` (38), `library_publish_test.py`.

## S641 (SkyOtter, the conductor, 2026-11-12): a target at exactly the minimum fails at fractional zoom

- **Sam's Revise and remediate on `dsp-credit-starting-points`** (2026-11-11 15:30Z, approved 15:31Z) was the run's one
  Library request. The public copy became Version 3, remediated (#3151, `fb2d35b3`), and the record moved by a guarded
  UPDATE with its receipt (`kb/receipts/cpl_library_dsp_v3_public_s641_2026-11-12.sql`).
- **Cause:** eight targets set to exactly `min-height:24px` measured 23.9px at 90% and 133% browser zoom, so WCAG 2.2's
  24px target minimum failed on them though the CSS named 24. Three were in the shared public header (Links, Light,
  Dark), so every public page carried the fault. A length at exactly a threshold leaves no room for the rounding a
  fractional zoom applies; the floor is now 25px.
- **The fix belongs in the source, not the copy.** The vault sources (public header, the agency visual, tabs) changed
  first (CPLBrain `0e4b1091`), then the public copies took the header's lengths. `tests/public_target_floor.test.js`
  fails a public page whose target floor drops below 25px.
- Carried untouched: `iaca-mvpmcjyl` (requested 2026-10-26, no note).

## Moved from the lane (S643)

**What stays in a repo:** build scripts, specs, narration text and voice clips (a
library voice can be withdrawn), the vault's companion notes, and a film a public
page plays (the funding explainer's cuts stay where Pages serves them). Pipeline
outputs (`reports/*.docx`) and source documents under `docs/reference/` are
inputs, not deliverables. Claude artifacts (decision sheets, mockups) stay on
claude.ai.

- **Reading the folder:** a session reaches it only through the Microsoft 365 connector (claude.ai connectors,
  connected by Sam with his RCCD account; read and search, no upload). This environment's network refuses
  `studentrcc.sharepoint.com` too.
- **The tab:** a SharePoint link files under the stored home `drive` (the `cpl_library_home_ck` value for the
  team's file home, so no schema change) and reads *Team SharePoint*; a record still linking Google Drive reads
  *Google Drive* (`homeOf`). Guarded by `tests/library.test.js` (7).

## Moved from the lane (S646)

Verbatim from the lane's Next list, moved at the S646 checkpoint when Ally Barker's requests became the carried item:

- **Still open from the ELL IET and Coordinator Guide asks:** IACA's `regen` (`iaca-mvpmcjyl`, Crystal Nasio, 2026-10-26) has no
  note or sources: it waits on what she wants changed. The Coordinator Guide's request (Sam, 2026-11-05 12:36Z, Request Adopt
  links) is done (S605): Draft 2 at the same artifact, Request Quick Adopt for Basic Military Training and the seven
  statewide recommendations the most colleges adopted, the Credential Catalog in Resources; the record moves by
  `kb/migrations/2026-11-08_library_coordinator_guide_draft2.sql` (lessons, S605). ELL IET reads 33,971 of Sierra's 34,000 characters: room for anything
  more comes out of repeated wording (the build already trims two phrases) or a `cpl-chat` cap raise.

- **DSP Credit Starting Points is Version 3 in public, remediated (S641, #3151, `fb2d35b3`; Sam's Revise and remediate
  of 2026-11-11 15:30Z, approved 15:31Z).** ELL IET Version 5's form, from the vault source. The record moved by guarded
  UPDATE (version `3`, a fourth `versions` entry, `refresh_note` and `regen` emptied, `library-s641@bot`); receipt and
  rollback `kb/receipts/cpl_library_dsp_v3_public_s641_2026-11-12.sql`.
