---
title: Playbook — where a college's local subject title comes from
created: 2026-11-22
updated: 2026-11-22
tags: [playbook, commons, subjects, catalogs, local-subject-titles]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/reference/lanes/commons]]"
artifacts:
  - kb/_build_local_subject_titles.py
  - kb/reference/college_department_lists/
  - kb/status/local_subject_titles.json
---

# Where a college's local subject title comes from

The Subjects page (`#commons/subjects`) gives each college's local subject code one local title. The builder
`kb/_build_local_subject_titles.py` takes the first source that answers, in this order.

1. **A person's save** on the page (`kb_curation`, `field` `subject_decision`). It wins over every source below.
2. **The catalog's subject heading**: the name the catalog prints on the code's course pages, else the heading above
   its first course or the catalog index's entry.
3. **The college's department list**, where the college publishes its codes and their titles outside the catalog.
   The list titles a code the catalog gives no title. It also wins where the catalog's name belongs to another code on
   the list, which happens when one heading names several codes.
4. **A recommendation**, shown with its level and never saved until a person accepts it.

A COCI course title, a TOP code, a C-ID or CCN descriptor and a program title never stand as a local subject title.

## Cerritos College names its subjects departments

Cerritos's class schedule (https://secure.cerritos.edu/schedule/index.cgi) lists every subject code with its title
under *All Departments*. Cerritos calls its subjects departments, as some colleges do, and the department name is the
code's local subject title. Sam found the page on 2026-11-22 by a web search for "cerritos college aed" and the
schedule link, and gave the instruction: *"use this list and mark them done. add this to our procedures with a note
about cerritos departments defining their local subject titles."*

The list is filed at `kb/reference/college_department_lists/cerritos.json` with its address, the date and Sam's words.
On the first build it titled AED as Adult Education (not in the catalog read) and STAT as Statistics, where the catalog
heading "Mathematics (MATH & STAT)" had given STAT the name Mathematics. Eight codes keep their catalog heading, which
the list words a little differently: AB, AUTO, EDT, ELAP, NAIS, VCS, WELD and WMT. A person changes one on the page.

## Filing another college's list

1. Find the college's own page that lists its codes with titles: a class schedule, a department index or a
   subject-code key. Search for the college's name and the code; a schedule's subject list is a common place.
2. File it as `kb/reference/college_department_lists/<slug>.json` in the Cerritos file's shape: `college`, `slug`,
   `source_url`, `source_kind`, `captured`, `_provenance` (who found it, when, and their words) and `codes`.
3. Run `python3 kb/_build_local_subject_titles.py` and read what changed. A code the list titles for the first time,
   and a code whose title the list replaces, should each be right by the college's own page.
4. Name the file in the commons lane and in the handoff.
