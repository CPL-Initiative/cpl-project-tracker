---
title: "Hand it over in place: the hand-over box, where it writes, and the reader's pickup"
created: 2026-11-20
updated: 2026-11-20
tags: [reference, commons, hand-over, college-data-collection, supabase, privacy]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[commons]]"
  - "[[pipeline_reference]]"
  - "[[blocked_sources]]"
---

# Hand it over in place

> **One-sentence summary** — A signed-in reviewer hands over a file, a link, pasted data, an API procedure or a note
> for any Commons dataset in a side panel; the file is private, the database stamps the person's name, and the
> reader's pickup answers on the row with counts only.

Sam, 2026-11-20, in session, on the locked Commons order mock
(https://claude.ai/artifact/68ERWyrwiApcF3QM1KuYM2; source in the vault,
`CPLBrain/04-projects/cpl-initiative/commons-order-mock/`): *"yes, build it!"* His words on the ask, the same day:
*"item or link and a try the link button"*, *"need to be able to do this for all our commons datasets"*, and *"add an
api procedure box to each of these drag and drop side bars. that way when we establish one, we can plug it in
there."* Memory: `r-hand-over-in-place-sam-2026-11-20`. Governance: decision right DR-35.

Read this before changing the hand-over's page, its table, its bucket or the pickup. The lane's state and its next
steps are in [`lanes/commons.md`](../reference/lanes/commons.md).

## What a person sees

[`commons_handover.js`](../../commons_handover.js) draws one box for every Commons dataset (`DATASETS` holds each
one's words): a drop box (or choose a file), a link with **Try the link**, the data itself for a course (description,
units or hours, SLOs and objectives one per line, where it was found), and an **API procedure** box for a college or
a statewide dataset (address, the procedure in words, Test the API, Save the procedure). A key is never typed into
the page.

**A note** (Sam, 2026-11-20, in session: *"the hand-over panel needs a place to leave a note. I got to Ohlone's BRDC
127A, 127B, 127C and 127D and they are not in the catalog, but there is no place for me to note that."*; memory
`r-handover-note-sam-2026-11-20`). Every box ends with *Or leave a note*: the person's words, where they looked, and
on a course one box, *This course is not in the current catalog*. The box is its own field so the no-longer-offered
check reads it as its catalog factor with no sentence to parse; nothing is set aside on a note alone
(`r-no-longer-offered-sam-2026-11-20`). In the course's panel a saved note steps to the next course, as a saved
paste does.

| Where | Address | What opens |
|---|---|---|
| A still-taught course in the Commons' Needs you | `#commons/course/<control number>` | The course's panel beside the front page, with Previous and Next. Close and Escape put the address and the focus back. |
| A college named there, or on College Data Collection's to-do | `#collect/.../college/<slug>/handover` | College Data Collection's own panel for the college, on the hand-over pane (`d-college-opens-cdc-panel-2026-11-20`: one panel, no duplicate). |
| *Term Reports Needed* in Needs you | on the front page | The same box under the `term_reports` dataset. |

Signed out, the box shows the sign-in and nothing else. The public counts (*1 file to be opened by our reader; 2
links read by our reader*) show beside each college for everyone.

**Signed in, the box lists what was handed over there**, newest first: each file by name and size, each link by its
address, each note by its words, with the time and what stands (*CourseDetails.csv, 15.9 MB. Nov 20, 12:04 PM: read
by our reader, 41,250 rows*). Sam, 2026-11-20, after dropping seven term reports one at a time: *"it doesn't show
them all listed so confirm that each one i loaded did not overwrite the previous."* The count alone could not show
that seven drops were seven files. The list is a reviewer's read of the table (its own policy), never the public's,
and it does not ask who handed a thing over. No drop can replace another: each object's name starts with a new id and
the upload refuses an existing name (`x-upsert: false`).

## The sign-in rule

A reviewer's own sign-in (`is_allowed_reviewer()`), never the team phrase. Two reasons: Supabase Storage cannot check
the phrase, and a hand-over is filed under a person's name. `commons_handover_add()` stamps `handed_by` from the
sign-in; the page never sends it (`d-handover-reviewer-sign-in-only-2026-11-20`).

## Where it writes

Schema of record: [`kb/migrations/2026-11-20_commons_handover.sql`](../../kb/migrations/2026-11-20_commons_handover.sql);
its rollback beside it keeps a table that holds rows, closed to every API role, since a hand-over is person-entered
data.

- **The private bucket `commons-handover`.** One policy: a reviewer's INSERT. No API role reads, changes or removes
  a file. 50 MB an object; PDF, a saved web page, text, CSV, a spreadsheet, a Word file or a zip. The object's name
  is `<date>/<uuid>/<safe name>`.
- **The table `commons_handover`.** One row per thing handed over: the dataset, the subject (a course, a college or
  a statewide dataset), the kind (`file`, `link`, `paste`, `api`, `note`) with exactly one payload, and the reader's
  answer (`status`, `status_note`, `status_at`, `status_run`, `found`). Reviewer read only. A note is
  `{text, not_in_catalog, source_url}`: its words can name a person, so they stay in the table and never reach the
  summary (`kb/migrations/2026-11-20_commons_handover_note.sql`; its rollback keeps every note written).
- **`commons_handover_add(jsonb)`** is the one way a row is added. It refuses a payload the page would never make: a
  link that is no web address, a file that is not in the store, a paste with nothing in it or with a field the table
  does not take, an API box with no address, a note with no words and no box, or the catalog box on anything but a
  course.
- **`commons_handover_mark(...)`** is the one way a row is answered, and takes the service role alone.
- **`commons_handover_summary()`** is everyone's read: counts by dataset, college, course code, kind and status. It
  holds no person, file name, address or text.

**Why private.** A course outline can name faculty (the curriculum staff on City College of San Francisco's report
28 are the worked case: `d-ccsf-outline-trial-no-staff-names-s689`). The file stays in the bucket; only parsed
outcomes are ever filed in the repository or the outcomes table; a person's name from an outline page is never
filed.

## The reader's pickup

[`kb/_handover_pickup.py`](../../kb/_handover_pickup.py), run by `commons-handover-pickup.yml` nightly at 05:41 UTC
and on the page's Try the link. It commits nothing.

- **Try the link** saves the row, then posts its id to the `handover-try-link` Edge Function, which checks the
  reviewer and dispatches the workflow. The function fetches no address itself: the one reader that visits a
  college's site is the runner's (`d-handover-try-link-on-the-runner-2026-11-20`). Where the function does not start
  the reader, the page says the link waits for the nightly run and gives the function's own reason
  (`not_configured`: no GitHub token is set; `token_refused`: GitHub refused it), and the function writes the same
  reason to its log. The edge log alone keeps only the status: Sam's first three presses (2026-11-20, 19:37 to
  19:41Z) each answered 503 and nothing recorded which reason it was. A session can always start the pickup itself:
  dispatch `commons-handover-pickup.yml` on `main`.
- **A link** gets one visit by the polite Reader (`kb/_program_source_census.py`): it names itself
  (`CPLInitiativeCatalogCensus`), reads robots.txt first, and files a bot check as one. After a host answers one bot
  check in a run the reader loads nothing more from it (Sam, 2026-11-18, #3536). A page that reads is counted by the
  outline reader's own parser (`kb/_course_outcomes_read.py` `parse_page`).
- **A file** is read from the bucket with the service key and counted the same way: a PDF by `pypdf`, a saved page
  by the parser, a CSV by its header and row count, any other kind by its size.
- **An API address to test** gets one GET under the reader's name, robots.txt first.
- **Pasted data, a note and a saved API procedure** wait for a session. The pickup never selects a note's words.
- **The answer** is a status (`reads`, `bot_check`, `could_not_read`), a short note, and `found`: counts and the
  parser's own section-heading words. The pickup does not select `handed_by` or `file_name`, and its log names a row
  by its id's first eight characters, its kind, its college and its course code.

## Reading what waits (a session)

```sql
select id, created_at, dataset, subject_kind, college, course_code, kind, status, status_note, found
from commons_handover
where status in ('waiting', 'reads')
order by created_at;
```

Add `pasted` or `note` to the read when the work is to file them. Leave `handed_by` and `file_name` out of a
session's read unless the work needs them. A file is fetched on a runner
with the service key, never into a session.

## What slice 1 does not do yet

Slice 1 is the front door (`d-handover-slice-1-is-the-front-door-2026-11-20`): a person can hand something over, the
reader says what it found, and the row is on record. Carrying a hand-over into its dataset is the work that follows,
each step with its own guard:

1. Pasted data becomes a hand-entered read file under `kb/course_outcomes/` that the loader keeps at every load, so a
   person's entry wins over a later machine read.
2. A dropped outline's parsed outcomes load with the title check, parsed outcomes only.
3. A link that reads is saved as the registry's `cor_url`, with a receipt that holds the value it replaced. The
   registry has one writer at a time: agree it with the collection run first.
4. An API procedure is wired into the nightly read for its college.
5. A dropped term report is read for its term and filed for the no-longer-offered check.

On the page, three more: the same box on the Programs, Exhibits, Credit Recommendations and Credential views; a
college's panel opening over the front page with no change of view (today the name goes to College Data Collection,
and Back to Needs you returns); and the Courses card's own controls (Rename, Set the discipline, Confirm) inside the
course's panel.

## Guards

`tests/commons_handover.test.js` (the page: 88 checks), `tests/commons_handover_sql_proof.py` and
`tests/commons_handover_note_sql_proof.py` (the database, against a throwaway Postgres: 46 and 50 checks),
`tests/handover_pickup_test.py` (the pickup: 52 checks), and
`npm run a11y -- commons-handover` with its four sibling targets (signed in and out, light and dark, the college's
pane).
