---
title: "Session 635 handoff: the Library reads any file and drafts a new piece on its card; Pages deploys are timing out"
date: 2026-11-10
session: 634b (SkyFermi, Sam's Library side session beside SkyBackward, 2026-11-10 ~17:50Z to ~21:05Z)
tags: [handoff, library, pages]
status: current
superseded: true
superseded_by: session_637_handoff.md
---

# You are Session 635

Your moniker is **SkyWhirlpool** (galaxy names; M51). This handoff **carries handoff 634's queue** (SkyBackward, the
CPL Queue lanes) and adds the Library and a site-wide Pages problem, which go first. A **light** checkpoint: no Roadmap
row moved and no Rule 10 data write. Skipped as not moved: the pipeline view, `kb/README.md`, `README.md`, the
`kb/status/*` run logs (this run touched no harvest or reference), a new decision sheet (nothing waits on Sam).
Context ran to the WARN line (108k left), which is why this checkpoint came when it did.

## What shipped (merged)

1. **#3077 Library:** one reader (`readWords`) for Word, PowerPoint (with notes), Excel, PDF (pdf.js 4.10.38 vendored
   in `vendor/pdfjs/`), captions and text. A file with no words saves nothing and says why. Drop targets on a card's
   Revise box and on a Requested card (*Add a document*). Google Docs, Slides and Sheets links read by their export.
   **Draft it now on a Requested piece**: `library-revise-draft` writes Draft 1 from the starter frame
   (`new_page.mjs`); **Publish it**; `library_publish.py` makes `library/<slug>/` as Version 1. Four COBIx security
   findings fixed in the PR (allowlist, sandboxed draft view, frozen scripts and sources, CSS host checks).
   `library-revise-draft` deployed (cpl-chat-deploy run 42885369380).
2. **#3088 Pages:** `kb/receipts/` (2.0 GB, never served) pruned from the site; the build fails over 1000 MB and warns
   over 800 MB. `tests/pages_size_guard.test.js`.

## Sam's words this run

- *"use the attached as a test to see if you can get it to work from within the library all the way to posting in the
  public library"* (his PDF: Adding CPL Coordinator and Noncredit Lead in MAP).
- *"need to be able to handle office docs, pdfs, google slides, videos"*. A video is read only through its captions.
- *"could it have anything to do with the permissions we changed yesterday? maybe ping cobix"*: COBIx checked;
  permissions are not the cause.

## Open work, in order

1. **Pages first (every session's push is affected).** Every `pages.yml` run since 16:53 UTC times out in
   `syncing_files` at `deploy-pages`' fixed 10-minute wait, **including run 42897745399 after the prune (374 MB
   artifact)**. Dispatch one fresh `pages.yml` on main (never `rerun_failed_jobs`). If it times out again, look at
   file count (the site ships many generated files) and githubstatus; ask COBIx on #3088. The served `library.js`
   predates #3077 until a deploy lands.
2. **`library` NEXT 0, Sam's test**, once Pages serves #3077: on his request card `71931018` he drops the PDF, presses
   Draft it now, opens the draft, Publish it, List publicly. Dispatch `library-publish.yml` after Publish. Then tell
   him in a few lines. Owed to COBIx on the next Library change: the `style=` entity pattern in either quote, and the
   size-guard test walking `kb/`. Lane: `docs/reference/lanes/library.md`.
3. **Handoff 634's queue, unchanged:** carry out Sheet 180's rulings (commons card 1, harvest cards 2 and 4, De Anza
   card 5 waits on Sam's GE sheets, cer-procedures card 6); `program-requirements-harvest`: the sweep's next college; cer-procedures' next
   re-analysis; csm-workspace NEXT 0; commons NEXT; implementation-funding's mailbox grant; `college-district-identity` and `reviewer-session-lifetime`: carried, their NEXT lines stand; #2894 is Sam's. Read
   `docs/session_634_handoff.md` for the detail and its doctrine change (decide, carry out, record).

## Read first

`docs/reference/lanes/library.md` (NEXT), `docs/library_lessons.md` (*tender-fermi*), the COBIx comments on #3077 and
#3088, then handoff 634.

## Patterns that worked

- COBIx on the PR thread found what tests did not: four layered security gaps, then the Pages size. Verify each
  claim, fix what is real, reply on the thread.
- A count-based markup check misses edits inside existing scripts; freeze them string for string.
- A new test file can tip `check_ledger` under its 60% floor: append its count to `tests/check_floor.json`.

## Let go

PR subscriptions on #3077 and #3088 are dropped. One scheduled check-in may remain (`trig_01HTuMABfcAzyD4W3wX49Mak`
already fired); none is pending.
