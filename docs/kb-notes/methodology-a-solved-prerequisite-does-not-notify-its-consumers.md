---
title: A solved prerequisite does not notify its consumers
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, partner-crosswalks, data-quality, docstrings]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - kb/_build_regional_cpl_opportunity.py
  - kb/reference/swp_region_roster.json
  - college_briefing.js
---

# A solved prerequisite does not notify its consumers

> **One-sentence summary** — when a session solves a blocker late in its run,
> every workaround, docstring and disabled control written earlier that day
> still says the blocker exists, and none of them will announce that they are
> now wrong.

## Context

On 2026-09-16 a session needed the Strong Workforce consortium roster, could not
find it, wrote a proximity-based workaround, documented the absence in three
places, and then — later the same day — derived the roster from county and
applied it to Supabase. The next session found three statements about the same
fact, all dated 2026-09-16, disagreeing with each other. Lane:
[`partner-crosswalks`](../reference/lanes/partner-crosswalks.md).

## The claim

**Solving a prerequisite is only half the change. The other half is finding
everything that was written while it was unsolved.** Those artifacts fall into
three kinds, and the dangerous one is the third:

1. **A documented absence** — "the SWP roster exists nowhere in this repo."
   Merely stale. A reader who checks is corrected immediately.
2. **A disabled control** — `college_briefing.js` shipped the Strong Workforce
   scope with `ready: false` and a reason. Visibly off, so nobody is misled.
3. **A silent workaround that still runs.** `--region` resolved against a
   ~9-way proximity grouping and returned **23** colleges where the consortium
   has **28**, dropping five member colleges with nothing on the page to say
   so. It did not error, it did not warn, and its output looked complete.

The third kind is the reason this is worth a note. A disabled control announces
itself. A workaround that returns a plausible answer does not, and it keeps
returning one every time it runs.

### The tell: a docstring forbidding what the code beside it does

`identity_rows()` carried an explicit warning — *"Do not substitute the ~10-way
`college_geo.region` proximity scheme… mis-grouping a college's peers on a page
people act on is worse than the filter being absent"* — while
`select_colleges()`, the very next function in the same file, performed that
exact substitution. Both were written the same day by the same session.

**A prohibition sitting next to its own violation is a reliable signal that a
prerequisite moved underneath the file.** The author was right twice and never
reconciled the two.

## How we got here

Found on 2026-09-17 while porting the regional crosswalk into the My College
tab for a Bay Area consortium meeting. The roster question had to be answered to
build the tab, which is what surfaced all three statements at once. Measured:
`--region "Bay Area"` returned 23 against the roster's 28, missing Berkeley
City, Cabrillo, Cañada, Hartnell and Monterey Peninsula — the last three
because Strong Workforce puts Monterey, Santa Cruz and San Benito counties in
the Bay while the proximity scheme puts them in Central Coast.

Fixed in [#1591](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1591):
`--swp-region` reads `kb/reference/swp_region_roster.json`, and both docstrings
now describe what the code actually does.

## When this applies (and when it doesn't)

Applies whenever a blocker is resolved **inside the same session that worked
around it** — the workaround, its comment, and any control disabled because of
it are all still in the diff. It applies with extra force when the resolution
lands in a different store than the workaround reads: here the roster went to
Supabase while the generator reads committed files, so nothing connected them.

It does not apply to a workaround that fails loudly. A stub that raises is
self-correcting; the risk is entirely in the workaround that returns a
reasonable-looking answer.

**The practical check**: when you resolve a blocker, grep for the blocker's own
name and for the workaround's identifier before closing the session. Both. The
workaround rarely mentions the blocker.

## See also

- `[[docs/regional_cpl_opportunity_lessons]]` — the workstream
- PR `#1591` — the fix, and the register the question surfaced from
- `[[docs/kb-notes/methodology-a-score-measured-in-one-population-is-not-a-score-in-another]]`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
