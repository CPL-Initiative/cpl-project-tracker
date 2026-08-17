---
title: A report must read the screen, not recompute it
created: 2026-08-17
updated: 2026-08-17
tags: [methodology, reporting, docx, disclosure, drift]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/eacr_scope_lessons]]"
artifacts:
  - college_briefing.js
  - tests/my_college_scope.test.js
---

# A report must read the screen, not recompute it

> **One-sentence summary** — An export that derives its own figures is a second
> implementation of the same arithmetic, and the copy that leaves the building
> is the one that will be wrong; read the rendered view instead, and the
> document inherits every rule the view already enforces — including the ones
> nobody remembered to re-apply.

## Context

The My College briefing button had to produce a document covering three
different scopes, each with its own suppression rules, its own roll-up
arithmetic and its own absent-vs-withheld distinction. Recomputing all of that
in a generator would have duplicated several hundred lines of judgement.

This is the same lesson the EACR matrix reached from the other direction, where
`matrixCell()` became **one function called by both the grid and the CSV** so the
spreadsheet could not drift from the screen. That made a *remembered* rule
(*"filter, column and exports share one scope"*) **structural**. Reading the DOM
is the strongest form of the same move: there is only ever one computation.

## Why it matters more than ordinary DRY

A drifted export is not a cosmetic bug:

- **It travels.** A CSV or a .docx reaches a college by email, gets filed, and is
  quoted back months later. The screen can be refreshed; the attachment cannot.
- **It drifts silently and in one direction.** Nobody diffs an export against
  the page it came from. The first person to notice is the person the number is
  about.
- **It loses the guards, not the happy path.** The arithmetic is easy to copy;
  the suppression rule, the *absent ≠ zero* distinction and the k-anonymity
  exclusion are the parts a second implementation forgets — and they are exactly
  the parts with a disclosure consequence.

By reading the rendered view, the exporter **cannot leak what the view does not
already show**. In the worked case, nothing in the docx builder knows what
k-anonymity is: a withheld college reads "withheld" on screen, so it reads
"withheld" in the file, and the group total is the same unsuppressed-only sum.

## The mechanics that matter

- **A closed disclosure is still in the DOM.** Reading `details` content works
  regardless of open state, so a document of headings with empty bodies is
  structurally impossible. (The print-based predecessor had to expand everything
  first — a step that, forgotten, produces a plausible-looking empty briefing.)
- **Walk in document order over a whitelist**, not over one container type. The
  first cut here walked only the collapsible sections — and two of the three
  scopes have **no sections at all**, so their briefing came out empty while a
  guard reported it as "nothing to put in a briefing yet", i.e. as a fact about
  the college.
- **Keep a figure with its label.** A stat card emitted as two blocks puts
  `1,051,870` alone on a line, which is not a fact.
- **Strip screen-reader-only text.** A visually-hidden "(opens in a new tab)" is
  a cue for assistive tech, not prose for a printed page.
- **Skip interactive chrome.** A transcript of an empty chat box is not content.
- **Carry the caveat INTO the file.** On screen a reader has the surrounding
  page to explain a dash; in an emailed document, the note that "withheld means
  fewer than 10 students, not zero" is the only thing between that and a
  misreading.

## When this does *not* apply

If the document is a genuinely different artifact — a narrative written by a
model, a differently-aggregated cut, a format with its own editorial voice —
then it is not an export of the view and this note does not bind. The test is
whether a reader would expect the two to agree. If they would, one computation.
