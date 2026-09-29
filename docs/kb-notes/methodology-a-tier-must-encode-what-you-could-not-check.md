---
title: A provenance tier must encode what you could NOT check
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, provenance, data-quality, contacts, verification, sandbox]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow]]"
  - "[[docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted]]"
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
artifacts:
  - map_users.js (FALLBACK_CONTACTS, via "search"; proposedFillFor)
  - map_team_queue.js (contacts-search-only)
---

# A provenance tier must encode what you could NOT check

## The situation

Seven colleges had no student-contact address in MAP and had never been looked
up. Looking them up is trivial — search, read the counselling page, record the
inbox. Except the sandbox is **egress-blocked from college domains**: `curl`
returns `000` and `WebFetch` returns `EGRESS_BLOCKED` for every `.edu` host
involved. Search results were available; the pages were not.

So five candidate addresses existed, each with a plausible source URL, and the
existing table had a tier — `via: "web"` — that looked like exactly the right
home for them. Its own definition even says it is *"a starting point to VERIFY,
not an authority."* Filing them there would have passed every test in the repo.

## The point

**It would still have been a lie, because a tier is a claim about method, not
about confidence.**

`via: "web"` means *someone opened the college's page and applied the sourcing
rules to it*. And those rules — set by a curator who works these contacts daily
— are **rules about what a page shows**:

> a general counselling inbox → use it · one named person who IS the designated
> contact → use them · just a list of counsellors → leave blank · the page
> directs you elsewhere → use that · **never mental-health**.

Every one of those tests requires the page. A search snippet cannot distinguish
a department inbox from a name off a list, and — the case that matters —
**2 of the previous 71 lookups published only a mental-health inbox**. That is
invisible from search results and is the one outcome that actively harms a
student: a credit question routed to a crisis line, at a counter where nobody
expects them.

The address might well be right. The *method* was not the one the tier names.

## The rule

When the channel you verify through disappears, do not fold the weaker evidence
into the existing tier. **Add a tier whose meaning is "this specific check did
not happen", and make the downstream code refuse it by construction.**

Concretely, `via: "search"`:

- carries the page a human still has to open — that link *is* the deliverable,
  so the test asserts every search row has one;
- carries a note saying why it is unconfirmed;
- is refused by `proposedFillFor()` **in code, not by convention**, so it can
  never reach the column that means "we suggest MAP adopt this";
- renders as **"Candidate — confirm"**, never beside a settled value;
- graduates to `web` or `curator` when a human opens the page.

A boolean `verified: false` would not have been enough. The tier has to name
*which* check is missing, because that is what tells the next reader what work
remains.

## Why this generalizes

The failure it prevents is **laundering**: an unchecked value acquires
authority purely by sitting in a field that implies it was checked. This
project keeps meeting the same shape —

- *"not in this dataset"* rendered as **zero**;
- a temporary contact fill sitting in a column that means *what MAP holds*;
- a queue reporting itself **clear** from a source that failed to load.

Each is a gap wearing the costume of a value. The defense is always the same:
**give the gap its own representation, and make the code that consumes values
unable to consume it.** Prose in a comment does not survive; a branch does.

## The second-order finding

The method itself is now gone, and that is the more expensive news. The 2026-08-05
sweep that produced 71 lookups **cannot be repeated from a session** — the
roadmap's standing offer that the 52 colleges with a CPL Assistant could get
"the same grind if wanted" is no longer true as written. That work now needs a
human with a browser, a runner with different egress, or a curator. Notice this
is a *capability* regression that no test would ever catch, because nothing was
broken: the code is fine, the environment moved. **Record capability losses
where the work is planned, not only where it failed** — otherwise the next
session budgets a morning for something that is no longer possible.
