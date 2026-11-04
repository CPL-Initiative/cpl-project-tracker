---
title: The Catalog Commons List norms, what every common reference's List shares and what stays different
created: 2026-11-01
updated: 2026-11-03
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

## The List is the workspace (Sam, 2026-11-03)

Sam, in session: *"I believe we could consolidate the main views for each by incorporating the list view below the
action/metric cards and make that top level collapsible while keeping the one-line action/metric links like we do
elsewhere."* Then: *"The idea would be to retire the original common work spaces once we can do everything we need to
do from list view, which will have the action cards on it--all consolidated and consistent with other commons
datasets"*, and *"Let's plan to have a side bar open for list items to show all the details (like an exhibits or the
nice side bar that opens for courses on SkyView."* (cpl_memory `sam-the-list-is-the-commons-workspace-2026-11-03`.)

Each reference's List becomes its one workspace, in this shape, top to bottom:

1. **One line of the reference's counts,** each a word that opens where its card's count opens, outside the fold: the
   CSM Workspace's *Today* line (#2727). The line carries the Commons row (the headline, confirmed by a person, each
   known issue); the List's own filter row keeps the per-filter counts, so a count shows once.
2. **The action and metric cards,** folded behind one word for the visit (*Hide the summary*, *Show the summary*).
3. **The List,** full width. A row's title opens **a side panel** beside the table: the engine's `panel` hook
   (`commons_list.js`; the title's drawer moves into it, so nothing is lost), SkyView's course outline the model.
   Exhibits' panel shows the credential, its folded **members** (the MAP exhibits under it, sortable, each linked to
   MAP), and the rest folded below (Sam's mock, https://claude.ai/artifact/PJKHZ8QwfyfbRW7U6qwBV4, 2026-11-03).

Every Commons card action opens the List (#2735). A reference's original views retire once its List does everything
they do, one PR each. Built: Exhibits' line and fold (2026-11-03, over the tiles the Credentials view and the List
share), the side panel in `commons_list.js` (#2738), and the panel's issuer and training-site editor (#2740); with the
credit lines, each college's own exhibit and MAP's Request Quick Adopt line in the panel, the Credentials view retired
into the List (2026-11-03; `#exhibits/credentials` opens the List). Next: the cards, the line and the panel over the
CR, Subjects, Courses and Programs Lists, drawn by one renderer.

**The panel's shared parts are the engine's** (`h.title`, `h.meta`, `h.heading`, `h.table`, `h.fold`, `h.open` in
`commons_list.js`), so every List's panel reads alike: one line of what the row is, its members in a sortable table, and
folds that keep their place for the visit. CR's wording panel is the first drawn by them (2026-11-03);
every List's panel is since 2026-11-04 (Exhibits' last, each exhibit's number linking to MAP). Exhibits' tiles and CR's
Progress view read the Commons file through `CPL_COMMONS_LIST.readCommons` where the engine is loaded
(`tests/commons_one_reader.test.js`). **The line is the engine's too** (`api.line`, with `CPL_COMMONS_LIST.readCommons` reading
`kb/status/commons.json` once a visit and `lineItems` shortening a row): Exhibits' line and CR's are drawn by it, each
count opening the List's own filter where it has one. Subjects' is the third (2026-11-04): the line, the Progress
view's own page folded under it, and an MQ discipline's panel with its local subjects and the codes it shares. A
line's count resets the List to its first page (`api.LIMIT`); a null limit drew an empty table. Next: the line, the
cards and the panel over Courses. Programs' is the fourth (2026-11-04): a program's panel lists its courses block
by block with the CPL on record at its college, reading a light record once from the panel. Courses' is the fifth
(2026-11-04): every count opens SkyView (Courses keeps SkyView first), the line shares the tab's one read of the
Commons file with its Progress page, and a course's panel lists the local courses its M-ID holds. Every List now has
the line, the fold and the panel. CR's worklist retired into its List on 2026-11-04, its Part B guards ported
first (`tests/cr_list_worklist_port.test.js`); Subjects' Reference view followed (#2751 carried it onto the List,
#2752 deletes it). Next: Programs' and Courses' older views.

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
| Exhibits | credential | finder, filters with counts, bands, kept groups, suggested folds on the engine's slot (Accept), Changed this visit, Re-point, waiting, flag, Re-analyze, tiles from the Commons row | |
| CR Reference | wording (group) | finder, filters with counts, Edit, flag, rung proposals as suggestions (Confirm the group), Selected, Changed this visit, read-only bands by group ordered by the reference | |
| Subjects | MQ discipline | finder, filters with counts, Edit, open picks as suggestions (Confirm this pick), Selected, Changed this visit | |
| Subjects: Local subjects | local subject code | finder, filters with counts, filings as suggestions (Confirm), a note per code (Edit), Selected, Changed this visit (2026-11-03) | the card's confirmed count |
| Courses (COCI Lookup) | local course (M-ID band) | finder, filters with counts, read-only M-ID bands from the engine's `bands` hook, Open in SkyView | |
| Program Requirements | program | finder, filters with counts | read only |

## Next, one PR each (Fable's ranking)

1. **Landed (S544): the engine's `suggest` slot and the `changed` tracker.** A spec hands `suggest` { get, verb,
   accept, key, label, always } and `changed: true`; the engine draws *Suggested: what (why)*, the verb and Dismiss under
   the title, keeps what was accepted or dismissed for the visit, answers in the status line, and owns the filter ids
   `suggested` and `changed` (contract at the top of `commons_list.js`). CR's rung proposals (a group a rung 1 to 4 rule
   places, more than one wording, undecided) read *Suggested groups*, one Dismiss setting aside the whole group; the
   Subjects open picks read *Suggested picks*, shown under every filter since they are few. **A suggestion never
   proposes a collision:** an open pick whose code another MQ discipline holds is a call for a person. Exhibits moved
   onto the slot in S545: its spelling-twin folds are the slot's suggestions (*Suggested: fold into X (why)*, Accept,
   Dismiss), and its changed set is the engine's, the same list Re-analyze sends.
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
   ordered by the group's reference; two keys that read alike take two places, so bands never interleave.

**All three steps have landed (S545).** Every List that folds takes its suggestions, changed set, filter counts and bands
from the engine; what stays each tab's is what the norms list under *What stays different*.

## How to apply it

A PR that builds or changes a List names which shared norms it carries and which it declines, with the reason.
A folding control one List gains belongs in the engine once a second reference will use it.
