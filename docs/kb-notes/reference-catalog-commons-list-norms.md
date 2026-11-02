---
title: The Catalog Commons List norms, what every common reference's List shares and what stays different
created: 2026-11-01
updated: 2026-11-02
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

> **Every common reference's List reads the same for the folding and consolidation work, and keeps its own rules where
> a fold means something different.** Sam, 2026-11-01: *"Would be nice to use any design lessons and norms from the
> exhibit list view for courses and all the other commons modules...moving toward consistent views for all the folding
> and consolidation work"*, with Fable as advisor (its review shaped this note).

## Context

`commons_list.js` draws every reference's List from a spec (S542). The Exhibits List grew from Sam's live use (S540 to
S542; `docs/cer_v2_redesign_lessons.md`). The engine makes the table consistent; these norms make the work consistent.

## What every List shares

**The row is the thing that folds:** a credential, a wording, an MQ discipline, an M-ID, a program. In COCI Lookup the
row is a local course and the fold unit is its M-ID band. Columns are found by name, never position (S541).

**Four words, one meaning each.**
- A **fold** joins one row's records to another's and changes the reference.
- A **group** is an arrangement a reviewer keeps; it changes nothing.
- A **suggestion** is a machine's proposed fold with its reason, taken with Accept or Confirm, set aside with Dismiss
  for the visit.
- **Waiting** is accepted and not yet in the reference, and each List says what lands it (Exhibits: the daily dry-run
  and a reviewed apply; CR: at once; Subjects: a code change waits for a re-mint).

**One verb per act, everywhere:** Accept, Confirm, Not a topic, Dismiss, Re-point, Keep this group, Rename, Release,
Move, Edit, Edit every row, Find and replace. Controls are underlined words.

**One filter order, in each List's own nouns, each with its count:** All, Needs you, Suggested, Waiting, Decided, Your
flags, Selected, Changed this visit. (Before this note four Lists used four words for "open".) Filters forget across
visits (Sam, 2026-10-21).

**Every write answers in the status line:** what saved and where it lands, or "did not reach the reference; nothing
changed". A sign-in message names where to sign in. A failed read says it is a failed read, never an empty list (S343).

**The frame:** full width while a List shows, the table scrolling in its own box only when narrower than its columns
(Sam, 2026-11-01); small type, Wrap text, sort with levels, a filter box per header, resizable columns, drawers,
Download; a band over every run, with titles alone under *Not in a group* (S542).

**Above the table, tiles carry the reference's Commons row** (Sam, 2026-11-01): the headline pair, known issues,
settled procedures, the Decision Sheet Library and the last run, drawn by **one renderer** shared with the Commons tab
(in `commons_progress.js` or beside it), never a second reader of the status files.

**Engine or tab.** The engine owns the frame, finder, filters and counts, sort, resize, drawers, Edit, Find and replace,
bands, groups, suggestions, the status words and the visit's changed set. The tab owns its rows, columns, writes,
refusals (four letters, no empty title), its drawers' facts, and which features it declines and why.

## What stays different

- **The write behind Accept differs in kind.** In the row only where its receipt reverses it (Exhibits' two rename
  rows, CR's decision row). A Common SUBJ code change and an M-ID merge or move are re-mints under the playbook: the
  List proposes, SkyView and the playbook act. One code, one MQ discipline (umbrella and fan-in excepted;
  `canonCheck` refuses a code another discipline owns); units never split an identity; TOP never gates (Rule 7).
- **Kept groups only where the group has no write** (Exhibits). In CR the group is the fold unit; in Courses the band is
  the M-ID. Those bands are read-only.
- **No find and replace** in CR, Subjects or Courses (one replace would rewrite a group or hand one code to several
  disciplines); **no flag** without a field; **Program Requirements** read only.
- **Second signals never decide:** SLO matches and TOP are hints a person accepts.

## Where each List stands (2026-11-02)

| List | Row (fold unit) | Today | Next |
|---|---|---|---|
| Exhibits | credential | finder, filters with counts, bands, kept groups, suggested folds, Re-point, waiting, flag, Re-analyze, tiles from the Commons row | its suggestions and changed set onto the engine's slot |
| CR Reference | wording (group) | finder, filters with counts, Edit, flag, rung proposals as suggestions (Confirm the group), Selected, Changed this visit, read-only bands by group ordered by the reference | |
| Subjects | MQ discipline | finder, filters with counts, Edit, open picks as suggestions (Confirm this pick), Selected, Changed this visit | |
| Courses (COCI Lookup) | local course (M-ID band) | finder, filters with counts, read-only M-ID bands from the engine's `bands` hook, Open in SkyView | |
| Program Requirements | program | finder, filters with counts | read only |

## Next, one PR each (Fable's ranking)

1. **Landed (S544): the engine's `suggest` slot and the `changed` tracker.** A spec hands `suggest` { get, verb,
   accept, key, label, always } and `changed: true`; the engine draws *Suggested: what (why)*, the verb and Dismiss under
   the title, keeps what was accepted or dismissed for the visit, answers in the status line, and owns the filter ids
   `suggested` and `changed` (contract at the top of `commons_list.js`). CR's rung proposals (a group a rung 1 to 4 rule
   places, more than one wording, undecided) read *Suggested groups*, one Dismiss setting aside the whole group; the
   Subjects open picks read *Suggested picks*, shown under every filter since they are few. **A suggestion never
   proposes a collision:** an open pick whose code another MQ discipline holds is a call for a person. Exhibits keeps
   its own suggestions and changed set until it moves onto the slot.
2. **Landed (S544): the filter words carry their counts, from the engine.** Each count is the rows that filter keeps
   over every row, the finder and the column boxes aside; the engine counts by the filter's own pass unless the tab
   hands `counts()` from a build that already counted (Program Requirements, Courses). A filter whose data is unread
   shows no count, never a 0 (`uncounted(id)`; the Exhibits List's suggested folds, outcomes matches, flags and
   waiting folds until their files arrive). The words refresh with the table, so a save or a tick moves them.
   *Selected* is the engine's on every List. The status-line words stay each tab's, already in the norm's shape.
3. **Landed (S543 and S545): bands from the spec.** The norms' `groupOf(r)` is the engine's `bands` hook: `key(r)`
   names a row's band, and `order(key, members)` the text bands sort by when the key is an internal one. Bands are read
   only; the writable kind, kept groups a reviewer moves titles between, is the `groups` hook, Exhibits' alone. #2670
   (S543) built the hook for the Courses List's M-ID bands and made `listRows` filter before it sorts (a fixed List
   sorts once per sort and only filters per keystroke). S545 added `order` and banded the CR List's wordings by group,
   ordered by the group's reference; two keys that read alike take two places, so bands never interleave. The Exhibits
   List's suggestions and changed set onto the engine's slot is what remains of aligning the Lists.

## How to apply it

A PR that builds or changes a List names which shared norms it carries and which it declines, with the reason.
A folding control one List gains belongs in the engine once a second reference will use it.
