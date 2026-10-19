---
title: "A control that stays after it worked gets pressed again"
created: 2026-10-19
updated: 2026-10-19
tags: [methodology, ui, supabase, idempotent, annual-goals]
kb-status: published
type: methodology
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[workplan_annual_goals_lessons]]"
  - "[[reference-ui-design-system]]"
---

# A control that stays after it worked gets pressed again

## The failure

On 2026-10-14 the Annual Workplan Goals tab's Set targets saved a sub-activity's Goal and Stretch rows and then left the
row exactly as it was: the Set targets control still there, the ladder cells still blank and read-only, because the
page draws the ladder from the nightly build. Sam pressed it again, and again. Five days later `workplan_goals` held
four identical GOAL rows and four identical STRETCH rows for 1.1.1, and two pairs each for 1.1.3, 4.2.1 and 4.4.1,
all seconds apart. No reader saw anything wrong: the generator kept the last row of each pair and the editor patched
every one alike.

## The rule

A save that works must change what the person sees, at once, in the place they acted. If the page cannot draw the
result in full until a build, draw the part that proves the save landed and remove the control that caused it. And
make the save itself safe to repeat: read what exists first, patch what is there, insert only what is missing, and put
a unique index behind the pair so a repeat cannot land twice even when the page is wrong.

## What it looks like here

- `workplan_goals.js`: Set targets reads the live rows for the id, PATCHes a row type that exists and POSTs only the
  missing ones; `activateLadder` gives the row its ladder attributes (Goal, Current, Stretch) and removes the control,
  then the editor lights the cells. `tests/workplan_goals_set_targets.test.js` proves both halves.
- The twelve extra rows go to Sam as a paste with the unique index on (activity_id, row_type, kind) behind it:
  `kb/receipts/workplan_goals_dedupe_ladder_rows_2026-10-19_s426.sql`.

## The companion finding

The same tab offered "Add description" on every row while 32 of 34 sub-activities held one: the generator asked the
project record for `description` and the loader's contract had named it `desc`. An empty-state prompt that invites an
edit must be sure the store is empty, or it invites the person to retype what is already there. When a whole column
reads empty, read the store before drafting anything.
