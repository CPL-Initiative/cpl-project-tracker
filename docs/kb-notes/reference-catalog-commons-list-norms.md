---
title: The Catalog Commons List norms, what every common reference's List carries
created: 2026-11-01
updated: 2026-11-01
tags: [reference, commons, commons-list, ui]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[commons]]"
  - "[[cer-procedures]]"
artifacts:
  - commons_list.js
  - exhibits.js
---

# The Catalog Commons List norms

> **Every common reference gets the same List, built from the Exhibits List's lessons, so the folding and
> consolidation work reads the same everywhere.** Sam, 2026-11-01: *"Would be nice to use any design lessons and norms
> from the exhibit list view for courses and all the other commons modules...moving toward consistent views for all
> the folding and consolidation work."*

## Context

The Exhibits List grew in three sessions (S540 to S542) from Sam's live use, and `commons_list.js` now draws every
reference's List from a spec. The engine makes the table consistent; these norms make the work consistent: what sits
above the table, how a fold is proposed and accepted, and how a group is kept. Lessons:
`docs/cer_v2_redesign_lessons.md` (S540, S541, S542).

## The claim: what every List carries

**Above the table**
1. **Tiles carry the reference's Commons row** (Sam, 2026-11-01: tiles above the list, everything from the Commons in
   them): the headline pair, known issues, settled procedures, the Decision Sheet Library and the last run, read from
   the same status files the Commons tab reads, so the two pages agree. A count opens the List filtered to it.
2. **A finder and filter words, each with its count**; the current filter underlined.

**The table** (the engine draws these; a spec only names its columns)
3. Full width while the List is on screen; the table scrolls in its own box only when the window is narrower than its
   columns. Small type, one line per row (Wrap text toggles), every column sortable (Shift adds a level), a filter box
   under each header, columns resized by drag or arrow keys, found **by name, never position** (S541).
4. A select box per row; **a flag** where the reference can store one (`list_flag`, reviewer sign-in); a drawer under a
   row for any cell; Download.
5. **Edit and Edit every row** write through the tab's **own** save path, never a new write surface. **Find and
   replace** only where one replace cannot create a collision or a side effect (the CR List has none: a replace would
   rewrite a group once per wording; Subjects has none: one code would land on several disciplines).

**The folding work** (the part to bring to every reference)
6. **Like with like**: an order that bands the rows (the AI sort for Exhibits; the M-ID for Courses; the group for CR
   wordings; the discipline for Subjects), **a band over every run**, and titles alone under *Not in a group*
   (S542: the 832 Arrest screenshot read loners as members).
7. **Kept groups and moves**: tick rows and a bar pinned to the bottom of the screen moves them, takes them out, or hands
   them back to the sort; Keep this group fixes a group and its name; a shared name joins two; Release undoes. A kept
   choice holds through every nightly rebuild.
8. **Suggested folds**: a fold the machine sees (spelling twins today; outcomes matches next) shows under the title with
   Accept and Dismiss; Accept writes the reference's own fold rows; an accepted fold stays improvable (Re-point along a
   chain) and lists under *Folds waiting for the apply*.
9. **A second signal never decides**: SLO matches and TOP are hints a person accepts (CLAUDE.md Rule 7). A fold that
   changes an identity with a playbook (an M-ID re-mint) is proposed here and done where the playbook runs (SkyView).
10. **Re-analyze my changes** queues the routine's look at what changed, with the reviewer's comments.

**Every List also gets** a preview artifact built from the real code (`scripts/build_*_list_preview.py`), a jsdom test
guarding each behavior, and an a11y target at 390 and 1440 in light and dark.

## What each reference folds

| Reference | Row | Band (6) | A fold writes | Where today |
|---|---|---|---|---|
| Exhibits | canonical credential | AI sort group | `unified_title_override` + `unified_title_merge_confirm` | all ten norms |
| CR Reference | wording | its reference group | the group's `cr_reference_decisions` row | 3-5; no bands, folds or tiles yet |
| Subjects | MQ discipline | (Local SUBJs in its drawer) | the `_CANON_SUBJ4::` row | 3-5; Confirm this pick |
| Courses (COCI Lookup) | local course | M-ID | none here: SkyView and the re-mint playbook | building (S542) |
| Program Requirements | active program | college | read only | 3-4 |

## How to apply it

When building or changing a List, check it against the ten norms and say in the PR which it carries and which it
leaves out, with the reason (a missing field, a side effect). A change to one List's folding UI belongs in the engine
when a second reference will use it.
