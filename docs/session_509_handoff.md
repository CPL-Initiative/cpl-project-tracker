---
title: "Session 509 handoff: Malone's FAQs, the published scenario first, the map.rccd.edu scans, the Library remediation mockup"
date: 2026-10-29
session: 508 (SkyGooseberry, Sam's session)
tags: [handoff, implementation-funding, library, a11y, map-website, privacy]
status: current
---

# You are Session 509

Your moniker is **SkyElderberry**. Session 508 (**SkyGooseberry**, Sam's session, 2026-10-28 ~22:40Z to 10-29
~01:00Z) started on the MAP website's privacy page, then took handoff 508's queue. This is a **light** checkpoint:
two lane files moved and no data was written; `kb/README.md`, `README.md`, the Pipeline tab and the decision
sheet were skipped as unmoved (no lane carries a NEEDS SAM).

**The 7th Annual CPL Summit is Friday 2026-10-30.** The public funding page goes public there.

## What shipped

- **#2536 and CPLBrain#525 merged** (handoff 508 item 0). #2536's head was the migrate bot's receipt, whose runs wait
  for approval; merged on the prior commit's green `test` with `main` unmoved (the S447 precedent). S507's seven
  `cpl_memory` rows read back 7 of 7.
- **#2537: Malone's twelve funding FAQs, as he wrote them** (FAQ at 37). If it is still open, merge it on a green `test`.
- **The funding-page PR** (Sam's 10-28 asks; see the implementation-funding lane): the footer goes, the tab opens on the
  published scenario, one link to the public page with *The link for the field*, Natalie's plainer hovers. It rides
  this checkpoint's branch; merge it on a green `test`.
- **map.rccd.edu** (the MAP team's WordPress site, run by ITPI, Malone says): two docs for Malone, both private until
  Sam shares them. [Privacy page edits](https://claude.ai/artifact/MpSFSLYm98SLJmZCHZRJ5C): 18 changes keyed to the
  RCCD data-sharing MOU, the replacement text, 13 facts to confirm, MOU fixes for counsel.
  [Security and accessibility scan](https://claude.ai/artifact/2pBJ9rNe1cyBfWQQR4W5cp): eight security findings (the
  CleanTalk plugin's files tag 6.7, inside CVE-2024-10542's range, so ITPI checks the installed version first), seven
  accessibility fixes, and what Malone asks ITPI for so a session can make content fixes with his approval.
- **The Library mockup** (Version 12): https://claude.ai/artifact/DNzaPRUD1qsrBTAhbn29kR. Sam asked for drag-and-drop
  remediation of decks and documents, one Add button, one card per project; his comments added *Remediate* and a
  public-library chip, piece titles as links, the label *Create or Remediate a Document*, and defaults: a deck on the CO template with a speaker script in its notes, a memo or report in the CO styles (the build needs both template files). He approved the project card.

## Decisions Sam made (in `cpl_memory`)

- *"It's OK to lead with negatives as long as it's human authored"*; *"push them as written by Malone"*.
- Remove the public page's footer and its language; open the tab on the published scenario; one link to the public page,
  the one that opens in its own tab.
- No Summit-morning re-run: S507's sweep and #2536 cover the public views.
- Hold the Library build for the next session, built to the mockup.

## Open work, in order

0. **Merge what is open:** #2537, then this checkpoint's PR, each on a green `test`. Then read back the funding page on
   Pages: no footer, one paint on the published scenario.
1. **The Library build** (lane `library`, NEXT ① to ③): the project link (a `cpl_library` column by receipt), one
   *Add to the Library* control, then in-browser remediation of .pptx and .docx. Start with the column and the card.
2. **Sam's small asks, waiting on him** (put them on a sheet if they hold): spell out FTES in his `x_table_intro`
   (proposed *full-time equivalent students (FTES)*); *Current* in place of *Curr* after the Summit, measured at 1280 px
   first; a redirect such as map.rccd.edu/cpl-funding (Malone, ITPI) or a custom domain (Sam's call on identity).
3. **map.rccd.edu with Malone and ITPI next week:** the CleanTalk check now; the Editor account and Application
   Password; then content fixes from the scan doc, each with Malone's approval, after mapping the site in
   `kb/governance_surface_map.json` (Rule 10 a3).
4. **Refresh everything** (Sam asked for a review): wired and current, `cpl_funding_refresh_sources` 54/54. One gap the
   new hold made is fixed (a refresh from another window ends the hold). Left: the comment above `refreshWindow` still
   says the films carry typed-in figures (`checkVideoFigures` checks them since 10-19); Refresh skips the daily static files
   (perf, ESS, data) by design, and could say a reload picks them up.
5. Handoff 508 items 2 to 5: the FAQ's KB note and Library record, Glendale's course units, the MAP-link sweep when Sam
   calls it, handoff 506 items 3 to 6.

## Lessons to honor

- **Run both earn guards** (`cpl_funding_calm`, `cpl_funding_earn_retired`) before pushing funding prose.
- **A person's words cross a guard by name only** (`HUMAN_NEG`, `HUMAN_AUTHORED`); a session's prose still fails it.
- **Read curated text before the code** when a reader quotes the page: Scenario 4's `text` holds much of what shows.
- **This environment blocks** `api.wordpress.org`, `*.azurewebsites.net`, `staging2.map.rccd.edu` and the Jetpack CDN;
  `map.rccd.edu` itself reads fine.

## Let go

At sign-off S508 drops its subscriptions to #2537 and the checkpoint PR and its watches on the mockup and the two
map.rccd.edu docs. No check-ins are armed.
