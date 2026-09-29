---
title: A written backlog decays silently — measure it instead
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, backlog, governance, handoff, measurement, staleness]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted]]"
  - "[[docs/kb-notes/methodology-the-feedback-queue-already-knew]]"
  - "[[docs/kb-notes/methodology-verify-consumer-before-migrating]]"
artifacts:
  - map_team_queue.js (buildQueue)
  - kb/map_team_tracked.json
---

# A written backlog decays silently — measure it instead

## The claim

A list of outstanding work, written into a document, is **wrong from the moment
it is written and gets worse every day** — and, crucially, it never announces
this. Nothing re-checks a sentence. If the work can be counted from a live
source, the list must be replaced by that count; if it cannot, the item must be
displayed with **how long since a human last confirmed it**, so its
unreliability is visible rather than implied.

The failure is not that lists go stale. Everyone knows lists go stale. The
failure is that a stale list and a current list are **typographically
identical**, so the reader has no signal and extends full trust to both.

## How it presented (2026-08-09)

A session handoff carried a team's backlog as prose — six items, written two
days earlier by a careful author who had just done the work:

> 56 proposed contact fills · 15 unroutable colleges · 6 open Sierra feedback
> rows · every governance owner unset · colleges 122/131 · Malone's view name.

Measuring all six before building on them took about fifteen minutes of SQL.
**Two were already wrong, and a third was wrong in a way that mattered more:**

| Written | Measured, two days later |
|---|---|
| "every governance owner unset" | **17 of 17 assigned.** The team had filled every owner-bearing row over the previous two days |
| "6 open feedback rows" | **23** |
| "56 proposed contact fills" | **14.** The 56 counted every record looked up; 42 of them were already covered upstream, so nothing there was waiting on anyone |

The governance row is the sharpest. That register's own open question **OQ-01**
read *"Who owns each row above?"* — and it had been **answered by people**,
in the system, while the document still described it as the outstanding work.
The backlog was reporting a task as open to the very people who had closed it.

## Why it recurs

Three reasons, and none is carelessness:

1. **A written count is a measurement with the timestamp stripped off.** "56
   fills" was true. It was true *on Thursday*, against a definition that was
   also correct on Thursday. Prose has nowhere to put the "as of", so it gets
   dropped, and a reader cannot distinguish a number taken this morning from one
   taken last month.
2. **Handoffs are written by the person who just did the work**, at the moment
   of maximum accuracy — which is precisely the moment the numbers begin to
   decay, and the moment the author is least likely to imagine them decaying.
3. **The decay is invisible to everyone downstream.** The next reader inherits a
   confident list with no way to check it short of re-deriving all of it, which
   is exactly the work the list was supposed to save.

## The rule

**If it can be counted, do not write the count down — write the query.**

Concretely, for any surface that reports outstanding work:

1. **Compute every item at load** from the live source. A tab that re-measures
   on open cannot lie about its own age.
2. **Separate the unmeasurable into an explicit lane**, and render each item
   with *"last confirmed N days ago"*. An item nobody has re-checked in six
   weeks should **look** unreliable.
3. **Show the derivation next to the number.** A reader who can see *"blank in
   MAP ∩ present in the lookup with an email"* can spot a definition mismatch;
   a reader given "14" cannot.
4. **A failed read is not zero.** Render it as *unknown* and rank it **above**
   the known items — it might be the largest thing on the page. Collapsing
   "nothing waiting" into "could not measure" is how a queue quietly reports
   itself clear.
5. **Never delete a cleared item — mark it clear.** Otherwise "done" and "never
   measured" are the same blank space.
6. **When a hand-tracked item becomes measurable, delete it from the list.** The
   list should shrink over time; if it grows, the discipline has inverted.

## The corollary for handoffs

A handoff cannot avoid prose, and shouldn't try. But it should **distinguish
between the two kinds of statement it makes**: durable findings (*"the CI smoke
test writes to the queue it monitors"* — still true next month) and measured
counts (*"43 CI rows"* — true for hours). Mark the counts as of a date, and say
where to re-measure them.

Better still: once a surface measures the thing, **the handoff should link to it
rather than restate it.** The best outcome here was not a corrected list — it
was that the list stopped being written by hand at all.

## The tell

If a document tells you how many things are outstanding, ask: *what would have
to happen for this sentence to update itself?* If the answer is "a human would
have to notice and edit it," you are reading a number whose accuracy is a
coincidence.

---

*Authoring check: durable (a property of written work-lists, not of one team),
reusable (any backlog, register, status doc, or handoff), distilled (one claim),
self-contained.*
