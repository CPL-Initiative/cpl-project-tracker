---
title: "CER redesign handoff: the public adoption page built; its name and linking on Sheet 148"
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
- **Open Asks Sheet 148** (https://claude.ai/artifact/NnrRFjJVpMLd2NQt84GFX5, current, both cards held): card 1 is the
  page's name, card 2 links it from the Library and the header and retires the CER and EACR tabs. Its source is
  `CPLBrain/decision-sheets/` (`cer_cards_148()`), in the vault PR beside #2610.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The public adoption page*, NEXT); Sheet 148's `replies` store, before you
act on either card.

## Open work, in order

1. **Confirm the data landed.** After #2610 merged, a dispatched `daily-dashboard.yml` run writes
   `library/adopt/adopt_data.json`. Open https://cpl-initiative.github.io/cpl-project-tracker/library/adopt/?college=Norco%20College:
   it should read about 860 credentials not yet adopted at Norco College.
2. **Read Sheet 148's replies.** On a name: change the `<h1>`, `<title>` and the builder's `_about`, and drop
   `noindex`. On linking: add a Library card and a header line, and take `#credential-reference` and `#exhibit-adoption`
   off COBI's menu in the same change, keeping their files so a revert brings them back. Drop the lane's marker in the
   same PR.
3. **The procedures run and Sam's saves** (carried). Today's 07:47Z cron fires near 14:31Z. Read the first
   `high-school-rop` save (expected 55, cohort `cer-procedure-high-school-rop@bot`, receipt in
   `kb/cer_procedures_out/saved/`); the queue should fall to about 413. Sam had saved nothing from the card or the
   panel by 11:30Z.
4. The mock-up's *Worth a faculty review* list (credentials no college has articulated, from Credential Engine), once
   the page has its name.
5. Carried: training sites for a held title new to the reference, only if Sam asks; the college short-name editor; the
   CPL-AI snapshot refreshed by hand (`python3 kb/_build_cpl_ai.py --fetch`).

## Lessons to honor

- An untracked generated file changes the dependency map. Move it aside before `kb/_build_dependency_map.py`, or the
  gate reads STALE on a map that CI will regenerate without the file.
- A public page's hero gradient reads as the worst stop in the contrast check: keep bare word controls off it.
- A grid inside a CSS grid needs `minmax(0, 1fr)` on the parent, or the matrix widens the page at every width.

## Let go

At sign-off this session drops its watch on #2610 and on Sheet 148 (the artifact). No check-ins are scheduled.
