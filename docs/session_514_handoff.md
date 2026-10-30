---
title: "Session 514 handoff: a PDF fixed at its source; the ESL monthly pass"
date: 2026-10-29
session: 513 (SkyLingonberry, the CPL Queue routine)
tags: [handoff, library, remediation, accessibility, esl]
status: current
superseded: true
superseded_by: session_522_handoff.md
---

# You are Session 514

Your moniker is **SkyMarionberry**. Session 513 (**SkyLingonberry**, the 08:12Z firing of Sam's CPL Queue routine,
2026-10-29) found no open PR and no other session. It took Library NEXT (a PDF fixed at its source) and the ESL monthly
pass. This was a **light** checkpoint: two lanes moved (library, esl-packaging), with no data receipt and no Roadmap row.
It skipped `kb/README.md`, `README.md`, the Pipeline tab, the decision sheet (no lane carries a NEEDS SAM) and the
Commons run logs, none of which moved. No KB note crossed the bar. The UI pass ran today in S510; Sierra is next on the
ledger, for the first firing of 2026-10-30 UTC.

**The 7th Annual CPL Summit is Friday 2026-10-30.**

## What shipped

- **#2546: Remediate on a dropped PDF** (`library_remediate.js`, `library.js`, Library lane ⑦). The page reads the
  PDF's Info dictionary, catalog and XMP, inflating Office's object streams, and changes nothing in the file. It
  reports whether the PDF is tagged, its language, its title and whether it holds text. It names the program that
  made it, any Library record that matches, and the export steps, and offers *Choose the source .pptx* or *.docx*.
  On the team's 55 PDFs its reads agree with `pdfinfo`. One ASCCC TMC, Law, Public Policy and Society, has its
  language set to French. Tests: `library_remediate` 81/81, `library` 207/207.
- **#2547: the ESL monthly pass.** 0 to apply, 0 to list for Sam, 3 held apart under his rulings. The plan dir
  `kb/esl_sheet_out/2026-10-29-monthly/` resets the lint. No apply workflow ran, because the plan contains no write.

## Open work, in order

0. **Merge #2546 and #2547** on a green `test` if either is still open.
1. **Sam tries remediation** (his *"I'll try in the morning"*). `alt-text-draft` still had no live call in the edge
   logs at 08:25Z. If it errors, read its logs (Supabase MCP `query_logs`), then check `SUPABASE_ANON_KEY` and the
   model name. Tell him in one line that decks, Word documents and now PDFs are new since he last saw the panel.
2. **Library NEXT:** a workbook (.xlsx) in remediation: sheet names, a header row on each table, alt text on each chart.
3. **Glendale's course units** (harvest NEXT, the status file's next step).
4. **Handoff 509's carryover:** the FAQ's KB note and Library record; Sam's small asks (FTES spelled out, *Current*
   after the Summit, a public-page redirect); map.rccd.edu with Malone and ITPI; handoff 506 items 3 to 6.
5. **The MAP-link sweep** (EACR NEXT), when Sam calls it.

The Library queue has nothing new: the IACA regenerate (`iaca-mvpmcjyl`, no change, no sources named) and the two
noncredit Summit notes, as before.

## Lessons to honor

- **Office keeps a PDF's catalog in a compressed object stream.** Inflate `/Type/ObjStm` before reading the
  language or the tags.
- **The first `/Title` or `/Lang` in a PDF is often a bookmark's or a span's.** Read the Info dictionary the trailer
  names and the dictionary around `/Type/Catalog`.
- **Confirm every finding on a render** (`soffice --headless --convert-to pdf`, `pdftoppm`), and check a PDF read
  against `pdfinfo`.
- `scripts/check_generated.sh` reports the statewide catalog and discipline blanks STALE in a sandbox without
  `openpyxl`; both pass on main's CI.

## Let go

At sign-off S513 holds no PR subscription, no check-in and no artifact watch. The sign-off gives the state of #2546
and #2547.
