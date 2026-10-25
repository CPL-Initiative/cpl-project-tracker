---
title: "Session 469 handoff: the toolkit photos live in the library's hero; the NC cards edit like the credit cards; Cabrillo counted; Open Asks Sheet 125; Sam's Ask Sierra side bar next"
date: 2026-10-24
session: 468 (SkyMatilija)
tags: [handoff, library, public-library, implementation-funding, noncredit, map-users, sierra]
status: current
superseded: true
superseded_by: session_470_handoff.md
---

# You are Session 469

Your moniker is **SkyLemonadeBerry**. Session 468 (**SkyMatilija**) was opened by hand by Sam at about 16:58Z on
2026-10-24 with the right greeting. It ran a **full checkpoint** (three lanes moved and a `cpl_memory` receipt landed).
It skipped `kb/README.md` and `README.md` (no KB structure or listed surface changed), a KB note (`cpl_memory` holds the
six learnings) and the Pipeline tab (the pipeline did not move). Read, in order: this file, then the lane for the item
you take: `docs/reference/lanes/library.md`, `implementation-funding.md` or `map-users-student-contact.md`.

## Who else is working

At 16:59Z `list_sessions` showed this session alone working; S467 had finished. The CPL Queue routine last fired at
13:12Z and next fires at 05:12Z on 10-25.

## What shipped

- **cpl-project-tracker#2421, merged:** the public library's hero cycles through Sam's ten Career Education toolkit
  photos after Malone's student (Sheet 124 card 1). Every slide is a 4:3 JPEG at most 1,200 px wide with its people near
  the middle, so `.hero-slide` takes one `object-position: 50% 50%`; only the first loads up front. Baking and Nursing
  exist only as zips over the Drive connector's 10 MB limit, so the page has neither. `tests/public_library.test.js`
  108/108 (six new checks, each mutation-tested); `npm run a11y -- public-library public-library-dark` clean.
- **cpl-project-tracker#2422 (this checkpoint rides it):** Sam's four funding asks of 13:38Z.
  (1) The NC outcome cards edit as the credit cards do. They had been read-only without a reviewer sign-in while the
  credit cards edit for anyone, which is why his screenshot showed no fields. They now also carry the measure, the
  target rule, the Serves boxes and the strategies (`tests/cpl_funding_nc_outcomes.test.js` E0 to E8, 60/60, four
  mutations caught). (2) Cabrillo counted (`funding/nc_outcome_feasibility/2026-10-24_cabrillo/`): NC-1's mirror
  channel counts 33 exhibits against a target of 9; 4 of 102 colleges meet on it; NC-2 is confirmable by control
  number and never findable by title. (3) and (4) The coordinator sources are named in the funding and map-users lanes.
  It also moves three settled funding-lane sections to `docs/cpl_funding_lessons.md` (the lane passed 20 KB).
- **Open Asks Sheet 125** (https://claude.ai/artifact/5zqA3S25eECWH9NALZRamE, two cards, empty store at publish):
  card 1 how NC-2 is counted (recommended: the Chancellor's Office names the course in guidance, attestation until
  then); card 2 the drafted MAP roles request to Pedro and the CSM team (recommended: send as drafted). The vault PR
  carries the builder, the sheet and the session note.
- `cpl_memory` (receipt `kb/receipts/cpl_memory_2026-10-24_s468.sql`, six rows, logged).

## Decisions and asks Sam made this run

- **The Ask Sierra side bar, his words (~17:10Z):** *"Can you add an Ask Sierra chat chip that opens a Sierra side bar
  if clicked?"* and a minute later *"We can do that next session:)"* (`cpl_memory`
  `sam-ask-sierra-chip-sidebar-2026-10-24`, verified). He named no page.

## Open work, in order

1. **The Ask Sierra chip and side bar.** Confirm the page or pages in one line first: S468 was working on the public
   library (`library/index.html`, Malone's look) when he asked, and COBI's header already carries an *Ask Sierra* link
   that opens `sierra/` in a new tab (`index.html` near the header; also `funding-model/index.html`,
   `cpl_pathways.js`). A side bar means Sierra opens beside the page: check whether `sierra/index.html` loads in a
   frame from the same origin, give the panel a close word and focus handling, and keep the page's own look (First
   Light in COBI, Malone's look on the library). Mock it up as an artifact first if the shape is open (Show, don't
   describe). Then the page's test and `npm run a11y` for the views it touches.
2. **Sheet 125 is answered** (18:12Z, both his own call): card 1 *name-then-attest* (the builder counts NC-2 from COCI by the guidance title, else the attested control number); card 2 *later*, *"I'll handle the request"* (Sam takes the MAP roles request himself; no session sends it). The lanes record both; no card is open.
3. **The UI pass:** if `date -u` reads 10-25 and the ledger has no pass dated today, take the view
   `python3 scripts/ui_pass.py --next` names (the Veteran map).
4. **The noncredit attestation surface, then the builder** (Governance DR-09 and the privacy ADRs first; publishing
   stays held). The builder now has its measure: emit `nc_exh` from the mirror channel
   (`funding/nc_outcome_feasibility/2026-10-24_cabrillo/nc1_mirror_channel.sql`), keying exhibits by id or title.
5. **Waiting:** the NC CPL Lead on the landing pages; Sheet 121 card 2 on Sam's four Coordinator Guide files; Baking and
   Nursing until their JPEGs sync into the Drive folder *Photos* (`1Ip4KaipYU6xNCbogeEG81-ZPQkbzMJpd`).
6. **`oversized_doc`, 4 left:** `roadmap_archive.md` 4.97x, `cpl_funding_lessons_archive.md` 2.8x,
   `ccr_atlas_lessons_archive.md` 1.11x, the harvest lane 1.34x.
7. **The other public pages still follow the device setting.** Offer Sam the library's Light default there; do not
   change them unasked.

## Lessons to honor

- A page whose photo cycle starts a `setInterval` keeps a jsdom test alive past its last check; load the one-photo page
  (`ONE`) in every window that is not testing the cycle.
- An NC outcome edit replaces the year's whole list in the active layer: clone any fixture you hand `_setShared()`.
- `parseNum()` reads free text as 0; a numeric field that must refuse junk checks for a digit first.
- 61 exhibits carry no `exhibit_id`; count them by id or title.
- A full `git fetch --prune` of the tracker runs for minutes; fetch the one branch you need.
- `cpl_memory.summary` holds at most 400 characters; the rest goes in `detail`.
- CLAUDE.md sits at 59,992 bytes against its 60,000 budget: measure before adding a word.
- The NC outcomes test runs about 2.5 minutes; the full local `npm test` past 20.

## Let go

S468 dropped its watches on #2422 and CPLBrain#464 (both merged) and its artifact watch on Sheet 125; it came back once for Sam's Sheet 125 replies (cpl-project-tracker#2423 and the vault PR beside it), whose watches it drops at their merge.
No check-in is armed.
