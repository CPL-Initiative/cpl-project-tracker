---
title: "Session 507 handoff: Glendale on its catalog's own words (45 to 80 passing); MAP links open the Non-Military card; Sierra deployed"
date: 2026-10-28
session: 505 (SkyBoysenberry, Sam's session)
tags: [handoff, program-requirements-harvest, eacr, map-links, sierra]
status: current
superseded: true
superseded_by: session_509_handoff.md
---

# You are Session 507

Your moniker is **SkyDewberry**. Two sessions ran as S505 on 2026-10-28: Sam's own (**SkyBoysenberry**, 03:18Z to
~17:40Z, this handoff) and the CPL queue routine's 13:12Z firing, which claimed the same number and wrote handoff 506
(read it too: its open items still stand). This checkpoint is **full** (Rule 10 data receipts, two lanes moved). It
skipped `kb/README.md`, `README.md` and the Pipeline tab, which this run did not move. No KB note crossed the bar.

**The 7th Annual CPL Summit is Friday 2026-10-30.** The public funding page goes public there; nothing may regress.

## What shipped (all merged)

- **#2529, the harvest at Glendale** (the loaded college with the largest gap). Filed records passing 45 to 80 of 260.
  Its reconcile entry files PSYCH and TART as prefix aliases and ENGL 101, ENGL 104 and POL S 101 as renumbers, each
  cited from the catalog's course descriptions. The capture now looks for a listed course under an aliased prefix
  (three Theatre records had read the THTR descriptions). The outcome scorer's no-space reading joins line-end hyphens
  and reads letter-spaced lines and spaced semicolons (outcome failures 54 to 0). Data: 66 rows replaced by four
  rereads, 6 inserted by a load, receipts with before-values; display build `41c15eee3f75`, applied on `main` by
  `step=display` run 40730345116 (read its result: statements, none missing, no errors). Lessons S505; lane line.
- **#2530, MAP links.** Every MAP link adds `&View=Non-Military` (Pedro's routing, live on production MAP), so it opens
  the exhibit's own Non-Military card; the adopt link reads **Request Adopt**. COBI, the CPL Opportunity visual and
  workbook, the shared MAP-link line, and Sierra. **Sierra deployed** (run 40733151892, byte-verified; read its smoke
  job: item 0 below).
- **`cpl_memory`**: six rows via `kb/receipts/cpl_memory_s505b_2026-10-28.sql` (supabase-migrate).

## Decisions Sam made (in `cpl_memory`, verified)

- `sam-map-links-open-non-military-card-2026-10-28`: *"We want the user to land on the non-military card that matches
  the MAP ID--the card is easier for the user to read."*
- `sam-request-adopt-label-2026-10-28`: *"Let's change the Could Adopt label to 'Request Adopt'."*
- `sam-sweep-public-views-for-map-link-2026-10-28`: a later sweep of public views that suggest an adoption but carry no
  MAP link, the Fact Sheet's statewide exhibits first. He said "deploy Sierra" for #2530.

## Open work, in order

0. **Read two runs that were still going at sign-off (~18:05Z).** (a) Sierra's deploy smoke (run 40733151892) failed
   2 of 115 assertions, neither about the MAP links (mode 17 passed with `View=Non-Military`): **7q** summed units for El
   Camino Welding, a program with no checked record, and **7v** said "COCI". Both are model-wording checks on code
   #2530 did not touch; the re-check of those two modes alone is run 40738868338. If either fails again it is a real
   regression: root-cause it in `cpl-chat` (a prompt rule or the smoke's matcher), never call it a flake twice.
   (b) Glendale's `step=display` run 40730345116 had been applying for over an hour (about 17,500 statements); read
   its result (statements written, none missing, no errors) and its committed applied record on `main`.
1. **Friday morning (10-30):** handoff 506 item 2 (`npm run a11y` on the ten public targets plus
   `funding-film-narrated`; re-read that Pages serves the films).
2. **Glendale's course units (harvest lane NEXT).** 180 records fail arithmetic, most on 63 courses the state's file
   lists with no units (unspaced codes such as BIOL298). The 2025-2026 PDF prints each course's units in its
   description ("ECT 160 ... 3.0 Units"). Build a step that takes a placed course's units from its description,
   verify on a page read first, then reconcile. Biotechnology 41767 sums 25-27 against a printed 28-30: the catalog's
   own disagreement.
3. **The MAP-link sweep** (EACR lane NEXT), when Sam calls it.
4. Handoff 506 items 3-6 (Noncredit film record, the memo's opening, `utilize`, the credential catalog beyond IT).

No decision sheet is open.

## Lessons to honor

- **Read `capture_preview.json`, not `capture.json`,** after a capture-only read.
- **The Edge Function's BOOT_ERROR is transient** and files an empty record: check every record's `error` after an
  extraction and force the empty ones before a reread.
- **A reread posts the newest run only;** each earlier run on the branch needs `force=<run>`.
- **A PR with a merge conflict runs no checks.** Read `mergeable_state` before waiting on `test`.
- **A long session can share its number with the routine.** Checkpoint to the next free handoff number.

## Let go

Subscriptions: none (#2529 and #2530 merged and dropped). Check-ins armed: none. Artifact
watches: none.
