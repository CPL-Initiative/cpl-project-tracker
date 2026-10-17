---
title: "Session 410 handoff: the display apply, Hartnell through its Coursedog PDF, SmartCatalog's subject pages, Cañada's sheet"
date: 2026-10-17
session: 409 (SkyOcotillo)
tags: [handoff, program-requirements, catalog-sweep, display-build, coursedog, smartcatalog]
status: current
---

# You are Session 410

Your moniker is **SkyYucca**. Session 409 (**SkyOcotillo**, `session_01WQLQ9vozQwdJDsLQPhF6C2`, 22:22Z on) checkpointed
at about 230,000 tokens left, while the display apply ran. If the routine started you, follow
`docs/reference/scheduled_sessions.md` first.

## Sam's rulings in force (no new ones this run)

- **No approval per item (2026-10-17):** harvest calls proceed on their procedures; a write the Supabase guard holds
  goes through `supabase-migrate.yml` (`kb/migrations/.apply`). `cpl_memory` `sam-trust-procedures-no-per-item-approval-2026-10-17`.
- **Extraction runs with no card up to $40 a college** (2026-10-14).

## What shipped (S409)

- **`f949e7c0ea35` applied** (15,336 written; run 39066977901).
- **#2210, Cuesta:** 181 loaded unchecked, the dated reads matched by md5 (every other registry row equal live), display
  build **`ffd6929a4f90`, 15,517 programs at 109 colleges**.
- **#2211, Exhibit Adoption's UI pass:** six measured routes (Credentials, the table and the matrix, light and dark)
  clean at 390 and 1440; every control an underlined word; the matrix's count reconciles (3,120 + 69 = 3,189). Ledger
  recorded; new a11y targets `exhibit-adoption-table` and `-matrix`.
- **Open Asks Sheet 92** (https://claude.ai/artifact/AZrSg3EREDme7kYsE7Nzwd, one card, empty store at publish): Cañada's
  2026-2027 catalog and addendum to the `catalog-files` release. Sheet 91 is answered and carried out. Source in
  CPLBrain#376 with the S409 session note.

## In flight at sign-off (check each first)

1. **The display apply** (run 39078224767 on `main`, dispatched 23:14Z, about an hour). Read its applied record
   (`kb/receipts/program_requirement_records_display_2026-10-17_ffd6929a4f90.applied_<run>.json`, committed by the job):
   15,517 written is the good result.
2. **Sheet 92's replies** (`ArtifactData` `list`, collection `replies`). Sam, in chat at 23:30Z: he will post Cañada's
   copies later, from a computer (he was on his phone). Look for them on the `catalog-files` release before asking
   again. Once posted: file Cañada by its release copies
   (`kb/hand_filed_catalogs/README.md`, "Filing a release copy"), then `step=read` with `college=Cañada College`.

## Priority after that

1. **Hartnell through its Coursedog PDF** (lessons S409). The catalog's scripts fetch a 427-page whole-catalog PDF
   from the vendor's public bucket; the address is in page read 39077713662's log (`pdf-reports/catalogs/...`). It
   prints each program's lists ("Complete at least 3 of the following courses: • ABT90 - Soil Science") and its total.
   Steps: (a) a free read that prints the PDF's cover for its year (run 39077970234's log holds it, but only the tail
   is reachable); (b) teach the code finder the unspaced form (`ABT90`, `STATC1000`, `ART12A`) with a test, and check it
   costs no other college a found program (a `step=reconcile extract=0` run is free); (c) a procedure catalog step
   naming the PDF and its year; (d) a capture-only read before any spend.
2. **Merced** is the same vendor on a custom domain (`catalog.mccd.edu`, 191 programs). The page read keeps only the
   page's own domain's calls, so it showed none; its PDF needs a read that prints the vendor's calls too.
3. **SmartCatalog (Crafton Hills, Taft):** Credit Programs lists one page per subject; no sitemap. Re-read two subject
   pages and Taft's front page with a plan of their own (the S409 read's head is out of the log tool's reach).
4. **The UI pass's next view** (`python3 scripts/ui_pass.py --next`).

## Patterns that worked

- **Find a vendor's data before writing a reader:** a `"network": true` page read showed Coursedog's program search and
  its PDF in one free load.
- **Merge `-X theirs`, then restore shared generated files:** the Cuesta branch carried older dependency-map line
  numbers; main's map went back into the merge before the push.
- **Never switch branches in a tree a background run reads** (S409 spoiled a local test run that way). Use a worktree.

## Not refreshed this checkpoint

- `kb/README.md`, `README.md`, the Pipeline tab: nothing they cover moved.
- The KB notes: none crossed the bar; the ring lesson went into `/a11y-pass`.
- The `cobi-dark-mode` lane: already over its budget; the UI ledger holds the pass.

## Subscriptions and check-ins

#2210 and #2211 merged and were dropped. CPLBrain#376 is watched until it merges with this checkpoint. Both S409
check-ins have fired; none is pending.
