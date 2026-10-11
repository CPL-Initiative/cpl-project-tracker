---
title: A page can hide text that names every course
created: 2026-10-11
updated: 2026-10-11
tags: [methodology, harvest, capture, courseleaf, cost]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_program_requirements_pilot.py
  - kb/_program_requirements_score.py
  - tests/program_requirements_pilot_test.py
---

# A page can hide text that names every course

**The rule.** Choose the text a reader sees before the text a page hides. Take the visible text whenever it names
enough of the program's courses to be the program's page; reach for hidden text only when the visible text falls short,
and then only the hidden panels a tab points at, read cell by cell. A count of courses named is no test of which text
is the program's: a hidden index names them all.

**The measurement (Long Beach City, run 38105864413, 2026-10-11).** The capture kept whichever of `innerText` and
`textContent` named more of the program's listed courses. Every Long Beach City page hides an A-Z course index that
names every course in the catalog, and keeps Program Requirements in a tab hidden until clicked. So `textContent` won on
378 of 379 programs (it had won on none at the five colleges read before), the window opened at the first listed code
in the index, and the model read the index: 367 of 379 records came back with no blocks, for $22.66. The 12 that
worked were programs whose subjects sit at the end of the alphabet, where the index ended and the requirements began
inside the window.

**Why the count misleads twice.** A table read through `textContent` runs each code into its title
(`JOURN 80Mass Communication`), so the code pattern misses the requirements and finds only the index, where entries
are separated. The hidden text then names more courses than the visible text for the wrong reason.

**The scorer's gap.** A record that explains every listed course away ("appears only in the site's course index")
passed coverage, so 89 empty records passed the machine checks. `places_none` now fails a record that places none of its
listed courses, and the load and the display build leave such a record out.

**How to apply it.** `best_text(got, found_body, found_content, courses)` in `kb/_program_requirements_pilot.py`: the
visible text at `ACCEPT_SHARE`, else `innerText+tabs` (PAGE_JS's `tabPanels`, outside the site's menus, a panel naming
courses in more than 40 subjects left out as an index), else `textContent`. A new platform or a college whose
`sources.json` shows `textContent` on most programs gets a look at the page before its extraction is paid for: run a
small `limit` first.

**A page's own tab bar can sit inside a nav (S363).** Long Beach City keeps its tabs in `<nav id="tabs">`, each a
`role=tab` link, and the first version of `tabPanels` dropped every link inside a `nav` as a site menu: the trial
(run 38139252216) read `textContent` for all 12 programs. A tab of the page's tab bar (`role=tab`, or a link inside
`[role=tablist]`, `#tabs`, `ul.tabs`) now counts wherever it sits, while the panel it opens must still sit outside the
menus; a hidden panel naming no course (the page's search dialog) is left out. Trial 2 (run 38147472758): 11 of 12 on
`innerText+tabs`. The fix was found by probing the real page, which the built fixture could not show:
[methodology-test-a-reader-fix-on-the-page-it-failed-on](methodology-test-a-reader-fix-on-the-page-it-failed-on.md).
