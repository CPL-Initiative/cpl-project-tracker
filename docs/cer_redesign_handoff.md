---
title: "CER redesign handoff: Exhibit Adoption's per-credential view in the panel; could-adopt off the TOP overlap"
date: 2026-10-31
session: CER redesign build, side session after S531 (SkyBayberry)
tags: [handoff, cer, eacr, catalog-commons, exhibits]
status: current
---

# You are SkyTwinberry, the Exhibits tab's next build

SkyBayberry ran the CER redesign queue on 2026-10-31 from about 03:07Z, alone: no other session was live and no PR was
open at the start. This is a **light checkpoint**. The lane file, the lessons doc, a KB note, the docs index and this
handoff moved in #2604; no data receipt was written. `docs/session_532_handoff.md` item 5 points here.

## What shipped

- **#2604 (Sheet 147 step 3, first part).** `kb/_build_exhibits_review.py` also writes `kb/exhibits_adoption.json`: per
  credential, what each college articulated (its distinct lines, units by EACR's leading-figure rule), the courses each
  could-adopt college already teaches (`statewide_prescriptive.js`, over-merged colleges counted, never named), the
  exhibits, the CIP sector and the peer median. The Credentials view adds the *What credit does it carry?* and *Who could
  adopt it?* tiles. In the panel every college chip opens the college's lines and its own exhibit, or the course it
  already teaches, and the `map_links.js` Request Quick Adopt line sits under them. *Articulated at* joins the reference's
  colleges with MAP's adopters (17 and 24 for CompTIA Security+).
- **Could adopt never reads the TOP and C-ID overlap.** The Review card's fallback had shown EACR's `potential_names`, a
  list Sam ruled off every screen on 2026-09-24 (Rule 7), on 269 of 468 cards. The panel read the reference's unheld
  `adoption_leverage`. Both now read the prescriptive layer: 162 held titles keep same-identity colleges, 51 name the
  colleges teaching a course mapped to the proposed credential, and 255 name none.
- **Code only.** After the merge a dispatched `daily-dashboard.yml` run publishes `kb/exhibits_adoption.json`. Until it
  lands the panel's tiles read *Could not be read*.
- **KB note:** `methodology-a-fold-carries-the-folded-tabs-rulings`.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The redesign*: the credential panel and the Exhibit Adoption fold, NEXT);
`docs/reference/lanes/eacr-exhibit-cr-adoption.md` (what it still holds); `docs/cer_v2_redesign_lessons.md` (2026-10-31,
SkyBayberry); the mock-up `docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html` (version 26, its public screen).

## Open work, in order

1. **Confirm the adoption file landed.** It comes from the daily run dispatched after #2604 merged, else the 06:17Z run.
   Open Credentials: the Field and Could adopt tiles carry figures (2,183 and 616 of 2,456 on the 03:18Z build).
2. **Read the 07:47Z procedures run and the first `high-school-rop` save** (expected 55, cohort
   `cer-procedure-high-school-rop@bot`, its receipt in `kb/cer_procedures_out/saved/`). The queue should fall to about
   413. Then read Sam's first saves: `kb_curation` rows under `_UNCLASSIFIED::` and `_CREDENTIAL_REVIEW::` with his email
   after 2026-10-31 02:00Z, a `training_sites_override` row above all. Check that the next daily overlay
   (`kb/credential_review_overlay.json`) carries `training_sites` for it.
3. **The public adoption page** (Sheet 147 cards 3 and 4): settled credentials only, Malone's CPL/AI look,
   *Credentials Your College Can Adopt* holding the place of the name Sam gives. It takes EACR's college matrix and its
   statewide and college filters (CIP sector, ASCCC Area, SW Region, District, College), the exports and Create Handout.
   Then the CER and EACR tabs retire. The page is public, so its first publish goes to Sam before it is linked anywhere.
4. Only if Sam asks: training sites for a held title new to the reference (a field the fold reads on `_UNCLASSIFIED::`,
   mapped first under Rule 10 a3); the *Held titles by group* table.
5. Carried: the college short-name editor (college-district-identity lane NEXT); the CPL-AI snapshot refreshed by hand
   (`python3 kb/_build_cpl_ai.py --fetch`) until Sam picks a schedule.

Nothing waits on Sam in this lane; Sheet 147 is answered whole.

## Lessons to honor

- A fold carries the folded tab's rulings: read its lane file before its payload, and test for what it refused to show.
- Two sources name the articulating colleges, and neither is whole; join them.
- A screenshot for review sets `cplFirstLight.optOut.v1` and `cplFirstLight.seen.v1` first, or First Light covers the page.
- `git add`, then `bash scripts/check_generated.sh`, before every push (this run: the docs index after a new KB note).

## Let go

At sign-off this session drops its watch on #2604. No check-ins are scheduled and no artifact is watched.
