---
title: "CER redesign handoff: the AP rule, the Catalog's faculty review list, the catalog join (SkyElderberry)"
date: 2026-10-31
session: CER redesign build, side session after S535 and S536 (SkyElderberry)
tags: [handoff, cer, exhibits, catalog-commons, ap, credential-engine]
status: current
---

# You are SkyCloudberry, the Exhibits tab's next build

SkyElderberry ran the CER redesign queue on 2026-10-31 from 12:37Z, the only session live on this lane. This is a
**full checkpoint** (the AP fold wrote a Rule 10 receipt): the lane file, the lessons doc, the docs index, the Exhibit status file, the memory rows and the
vault note moved; no Roadmap row moved and no re-mint or Rule 10 data write ran. `README.md`, `kb/README.md`, the pipeline
view and the KB notes were not touched. The numbered session handoffs stay with the main queue (S536 and on); this lane
keeps this file.

## What shipped

- **#2612: the Commons' CER row opens Exhibits.** `#exhibits/held`, `/conflict` and `/credentials` open one place, read
  once per visit. Its left-MAP and procedures counts still open `#credential-reference` (Exhibits has no such view). No
  Sierra Training link into the retired tabs was found.
- **#2613: the Credential Catalog's *Worth a faculty review*.** 28 of Credential Engine's top-50 credentials MAP has no
  exhibit for, 5 beside a related MAP credential from the same issuer. It reads a hand check,
  `kb/reference/credential_engine_top50_map_check.json`; a row with no check waits.
- **#2614: Sam's AP rule, built into `brand-family`.** Sam added it from the Exhibits tab: an AP title (course, exam or
  prep) takes College Board's official exam name, and *"close enough and infinitely better than it is now--even if its a
  little wrong"*. `kb/_ap_official_titles.py` holds the current and retired exams and reads what colleges add and how
  they write the letters; the `ap` lane runs first. The quality gate lets an official name stand (it had held seven
  *AP Computer Science A* answers on the trailing *A*). Dry run: `brand-family` 30 to 37, Needs you 369 to 362; of 23 AP
  titles waiting, 18 settle.
- **Sheet 149 answered** (1 *fold*, 2 *routine*). **#2617, the AP fold:** 14 merges and 7 AB-subscore moves in the
  reference, and 42 saved assignments moved under `cer-ap-fold-s536@bot` (Sam ran the guarded UPDATE; receipt beside it).
- **#2618, the Supabase guard** lets data writes run (INSERT, UPDATE, DELETE, MERGE); schema and permission writes stay
  denied. Sam: *"I've run the recommended sql queries from you 100% of the time ... let's unblock it"*. It takes effect
  from the next session.
- **#2615: the IT/AI catalog's MAP join** needs the issuer to agree and reads the hand check: in MAP 89 to 102, 24 joined
  (the 11 hand-checked, the PMI family, BLS, CNA and five more), 11 false joins dropped.
- **Read:** the 14:01Z procedures run saved 111 titles (`high-school-rop` 55 as expected, the classifier 55,
  course-identity 1). Sam's first save from the card landed at 13:46Z (*Introduction to Digital Art*).

## Read first

`docs/reference/lanes/cer-procedures.md` (*The Exhibits tab*, NEXT), then `docs/cer_v2_redesign_lessons.md` (its
2026-10-31 SkyElderberry section).

## Open work, in order

1. **The routine** (Open Asks Sheet 149 card 2, Sam's *routine*): a rule Sam adds in the Exhibits tab becomes a request
   row; a scheduled session builds it with tests, runs the dry run, opens the PR and writes the dry run back so the tab
   shows *Turn on* and *Discard*. Map the new surface in `kb/governance_surface_map.json` (DR-07) and check the privacy
   ADRs before it ships. Sessions now run their own data writes (Sam's ruling, #2618), so the routine can write its rows.
2. **Read tonight's run** (07:47Z cron): `brand-family`'s first AP saves; the AP fold (#2617) should leave no conflicts.
3. **IB on the AP pattern**, then CLEP's official names.
4. Carried: the Catalog's *Courses that may align*; training sites for a held title new to the reference and the *Held
   titles by group* table, only if Sam asks; the college short-name editor; the CPL-AI snapshot by hand.

## Lessons to honor

- A mark like *not in MAP* is a lead. Check it against the reference's titles and issuers before a page reads it.
- Group held titles by their reason before writing a rule: the miss is often an existing rule's stripper or target.
- A quality gate's word list can collide with official names (a trailing letter or number).
- Two PRs that both touch `js-tests.yml` or the dependency map: merge one, then merge `main` into the other and
  regenerate the map. Never pick a side on a generated file.

## Let go

At sign-off this session drops its PR watches (#2614, #2615) and names no check-in.
