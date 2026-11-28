---
title: S748 readers — notes for the next session (holds by key, Sierra and Skyline)
date: 2026-11-28
tags: [handoff, program-requirements, harvest]
kb-status: internal
---

# S748 readers: notes for the next session

The worker `readers` of the CPL Queue run of 2026-11-28 (S748) left these. Each line is one program or one lever.
Plans s748r1 (El Camino 19857) and s748r2 (Sierra, four rows) are on `claude/s748-readers`.

## Holds by key, one line each

- **Reedley 30465** (Early Childhood Education: Assistant Teacher): its own page is `iq/3101/3519/3269`, headed
  "Assistant Teacher (formerly Associate Teacher)", ECE 1, 2, 3, 4 and 19, "Total: 15.5" (college page read
  46119948370); a `site_pages` pin there fails rule A today, since the catalog's menu titles the page "Associate
  Teacher", so it waits on a reader change (the pin's heading read from the page's own section title and the
  department heading). Reedley 20762 (Early Childhood Education: Teacher) is filed passing from that same page, 4 of
  its 8 courses placed, 15.5 under an award of 16 units or more: a person compares.
- **Los Angeles Pierce 19181** (General Studies: Arts and Humanities): a named gap since S739
  (`list_printed_as_number_run`); its section on PDF pp.118 to 119 prints its list as runs of course numbers, so it
  waits on the code net reading a number run. Not started in S748.
- **Grossmont 21402** (English certificate): a named gap since S739 (`certificate_names_the_major`); the page prints
  one sentence for the certificate ("only those courses required for the above major (i.e., 24 units)") and the text
  sent ends where it begins, so it waits on the text the capture sends for a certificate that shares its degree's
  page. Not started in S748.

## Sierra College (99 programs with no passing record, census of 2026-11-28 00:44Z)

- 65 have no closed list in the Program Course File, and the capture's catalog lookup did not search (its self-test
  found 0 of 19 closed-list programs on their own page: Sierra prints a department's programs on one page).
- 20 have no page: 11 `page_claimed`, 9 `not_found`. Every one sits on a department page other programs were read
  from, so a `site_pages` pin (which asks the page's own heading for the program's title) binds none of them.
- 14 have a filed record: 7 unequal, 3 incomplete, 2 coverage, 2 place none (named gaps since S739). Plan s748r2
  files four; `kb/_program_piles_s748_sierra.py` HAND holds eight with a reason each.
- The free lever left: a reconcile step that gives an alternative its row's printed units ("CHEM 0001A ... 5-6 · or
  CHEM 0003A & CHEM 0003B", "FASH 0028 ... 1 · or FASH 0095") passes 40181 and moves 31922 and 31923; it needs a free
  page read of the row as the capture prints it, to see whether `or_units` matches as written.
- 21525 is live on run 38675248607 while main files 39726642315: keep-better and a reread, then
  `noted_section_cut_off`.

## Skyline College (93)

- 86 have no closed list. The capture's catalog lookup (run 45798037585) found the own page of 55 of them and
  nothing extracts a program with no list: S652's slice B was never built. That is the largest pile at either college.
- 5 have no page (3 `not_found`, 2 `page_claimed`), 1 places none, 1 is incomplete.
