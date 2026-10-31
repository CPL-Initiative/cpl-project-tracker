---
title: "CER redesign handoff: the Credential Catalog built, named and linked (Sheets 147 and 148)"
date: 2026-10-31
session: CER redesign build, side session after S535 (SkyTwinberry)
tags: [handoff, cer, eacr, catalog-commons, exhibits, adoption-page]
status: current
---

# You are SkyElderberry, the Exhibits tab's next build

SkyTwinberry ran the CER redesign queue on 2026-10-31 from about 11:20Z. No other session was live on this lane; the
program-requirements sessions (S532 to S535) were working Los Angeles Valley and Monterey Peninsula on `main` beside it.
This is a **light checkpoint**: the lane files, `CLAUDE.md`'s sheet pointer and this handoff moved in #2610, no data
receipt was written, and the docs index, lessons and KB notes were not touched.

## What shipped

- **#2610: the public adoption page** (Sheet 147 cards 1, 3 and 4). `library/adopt/` is in Malone's CPL/AI look, carries
  the Library's header with the Library linked, and is `noindex`. Nothing links to it yet. `kb/_build_adopt_page.py`
  writes `library/adopt/adopt_data.json` daily (a `daily-dashboard.yml` step after the Exhibits builder). Settled means
  a local title under the credential carries a review stamp in `kb/unified_titles.json`, a person's or a cohort's,
  the classifier's sure saves included. That gives 957 credentials of 2,232, against 677 without the classifier and 495
  on a person's stamp alone. The page carries EACR's college matrix (windowed, units or *C*), its filters, both CSVs and
  Create Handout (the college's `library/cpl-opportunity/` visual). Request Quick Adopt chips go to each building
  college. Guards: `tests/public_adopt.test.js` (44), `tests/adopt_page_build_test.py` (19), and
  `npm run a11y -- public-adopt public-adopt-dark public-adopt-matrix`.
- **Open Asks Sheet 148** (https://claude.ai/artifact/NnrRFjJVpMLd2NQt84GFX5, answered whole at 12:09Z, both his own
  call): the page is the **Credential Catalog**, and *link-retire*. Built in a second PR: the name, `noindex` dropped,
  a *Credential Catalog* line in the public header (`CPLBrain/.../public-header/header.html`, re-applied to the four
  Library pages) and in the Library's own Links. The CER and EACR tabs were already off the menu (Sam hid both
  `cobi_nav` rows at 23:51Z 2026-10-30); they still open by address, and their files stay.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The Credential Catalog*, NEXT).

## Open work, in order

1. **Confirm the data landed.** The daily run dispatched after #2610 merged writes `library/adopt/adopt_data.json`.
   https://cpl-initiative.github.io/cpl-project-tracker/library/adopt/?college=Norco%20College should read about 860
   credentials not yet adopted at Norco College.
2. **The procedures run and Sam's saves** (carried). Today's 07:47Z cron fires near 14:31Z. Read the first
   `high-school-rop` save (expected 55, cohort `cer-procedure-high-school-rop@bot`, receipt in
   `kb/cer_procedures_out/saved/`); the queue should fall to about 413. Sam had saved nothing from the card or the
   panel by 11:30Z.
3. **Links into the retired tabs move to Exhibits:** the Commons' CER row and Sierra Training's targets.
4. The Catalog's *Worth a faculty review* list (credentials no college has articulated, from Credential Engine).
5. Carried: training sites for a held title new to the reference, only if Sam asks; the college short-name editor; the
   CPL-AI snapshot refreshed by hand (`python3 kb/_build_cpl_ai.py --fetch`).

## Lessons to honor

- An untracked generated file changes the dependency map. Move it aside before `kb/_build_dependency_map.py`, or the
  gate reads STALE on a map that CI will regenerate without the file.
- A public page's hero gradient reads as the worst stop in the contrast check: keep bare word controls off it.
- A grid inside a CSS grid needs `minmax(0, 1fr)` on the parent, or the matrix widens the page at every width.

## Let go

At sign-off this session drops its watches on the Catalog PRs (tracker and vault) and on Sheet 148, and cancels its check-in.
