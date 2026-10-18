---
title: A shared view borrows the host's primitives and owns the shape
created: 2026-10-18
updated: 2026-10-18
tags: [methodology, commons, front-end, program-requirements, refactoring]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/commons_lessons]]"
  - "[[docs/reference/lanes/commons]]"
artifacts:
  - commons_progress.js
  - program_requirements.js
  - tests/commons_progress.test.js
  - tests/program_requirements.test.js
---

# A shared view borrows the host's primitives and owns the shape

> **One-sentence summary** — A view several tabs must draw alike owns its layout, arithmetic and CSS in one module, takes each tab's definitions as a spec and borrows the tab's own section, control and card helpers, so the shape stays one while the view reads as native to each tab; the first host's unchanged tests, run with the module loaded first, are the lift's guard.

## Context

Sam asked (2026-10-18) that every common reference share the Program Requirements tab's tracking shape and that the
dashes stay aligned as one changes. The Progress view that tab drew since S343 was the shape; lifting it out so four
more tabs can draw it is the Commons' step 1 (#2237). The question is how much a shared module should own and how
much it should borrow, and what proves the lift changed nothing.

## The claim

### Three inputs: a spec, a context, a host

The module owns what makes the shape one: the renderer, the status-file read, the milestone arithmetic (You are here
is the first milestone with anything left), the status words, the time words and the CSS. Each project brings a
**spec** (its words, its milestone, part and whole definitions, a declarative headline, the names of its reads), a
**context** built from its own live reads, and a **host** object lending the tab's own primitives: the section
pattern that opens, closes and remembers, the count control that opens the tab's own list, and the card helpers that
know what a call's records are. The definitions stay the project's; nothing in the module knows what a catalog or an
exhibit is.

### Borrow the host's classes into the module's CSS

The module's CSS names the host's section classes as marks filled from the host object at injection, one style per
class set. With the first host's defaults the injected CSS is byte-identical to the block it replaced; a second host
passes its own names and gets its own style. A view that borrowed the host's section pattern but hard-coded the first
host's class names would look right on one tab and unstyled on the next.

### Keep the names that tests and screens already use

A lift that also renames classes changes nothing a reader sees and loosens the only guard that proves it. The class
names kept their first host's prefix, as SkyView keeps its `ccr_atlas_*` paths.

### Fail soft, or fail the tab

A lazily loaded module's loader calls back on error as on load. The host must boot without the module (a stub that
answers every helper safely and draws one line on the shared view), or a 404 on the module kills the whole tab.

### The guard is the first host's own suite, unchanged in what it asserts

Load the module first in the test harness and run the host's suite as it was: 417 checks here, with three CSS regexes
pointed at the module's source and one path moved. A new, small suite guards only what a shared module can get wrong:
a second host's classes in a style of its own, a spec with a part missing drawing no band, a failed read saying so,
the host surviving a failed module load, the boot order on every page.

## How we got here

#2237 (S419, 2026-10-18): `commons_progress.js` lifted from `program_requirements.js` with the 417 checks of
`tests/program_requirements.test.js` passing before and after; `tests/commons_progress.test.js` (30 checks) added.
Lessons: `docs/commons_lessons.md`.

## When this applies (and when it doesn't)

It applies to any view that two or more tabs must draw alike and keep aligned: the Commons' Progress views, a shared
register or worklist card. It does not apply to a view one tab owns, where a module adds a contract nobody else reads,
or to a view whose hosts cannot lend a section pattern at all (then the module owns one and the hosts style it).

## See also

- `[[docs/commons_lessons]]` — the step's lessons, and step 2's host contract
- `[[docs/reference/lanes/commons]]` — the lane
- PR `#2237` — the implementation
