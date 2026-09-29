---
title: A collapsed section must still inform, or it is hidden rather than minimal
created: 2026-08-12
updated: 2026-08-12
tags: [methodology, ui, information-design, my-college, cobi]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
  - "[[docs/kb-notes/methodology-assert-what-the-reader-sees]]"
artifacts:
  - college_briefing.js
  - tests/college_briefing.test.js
---

# A collapsed section must still inform, or it is hidden rather than minimal

> **One-sentence summary** — "make it collapsible" is a request for a shorter
> page, not for a page with less on it; a closed drawer that shows only its
> title forces the reader to open every drawer to find anything, which is more
> work than the scroll it replaced.

## Context

Sam, 2026-08-12, after the MAP team used the My College tab:

> reinforce her as the main focus of the page and make all the content below in
> collapsible sections (default collapsed)… basically, I want a minimal initial
> view on this tab with nested expandable details for the inquisitive

The tab was ~1,900 words of continuous scroll across eleven sections. The
obvious implementation — wrap each section in `<details>` and stop — satisfies
the literal request and produces a worse page: nine identical rows reading
*Start here · Where you stand · Your funding …*, none of which tells a
coordinator whether it is worth opening.

## The claim

**Collapsing content only counts as "minimal" if what remains still carries
information.** Otherwise you have not reduced the page, you have moved its cost
from scrolling to clicking, and clicking is worse because it is serial and the
reader cannot see what they are choosing between.

So every section header carries that college's own figure:

```
▸ Start here                              11,793 units waiting
▸ Statewide CPL Benchmarks                Leading — 3 of 5 criteria
▸ Where you stand                         4,306 units waiting · 582 CPL students
▸ What that waiting credit actually is    4,306 units · all basic military service
▸ My CPL Funding                          $50,000 seed · $414,856 cap
▸ Of the credit you have already awarded  69.2% to a real course
▸ Current MAP Users and Contacts          2 of 8 roles filled
▸ Resources                               15 links
```

Shut, that is an eight-line standing report. It answers *how are we doing* without
a single click, and it tells the reader precisely which drawer holds the thing
they came for. The detail is still one click away for "the inquisitive".

## Consequences to build for

**Every branch needs a summary, including the unhappy ones.** A blank
right-hand side reads as broken, and "not loaded" and "nothing" are different
claims:

```js
if (state.funding === "error")            fundSum = "not loaded";
else if (state.funding !== "ready")       fundSum = "loading…";
else if (f && !f.onRoster)                fundSum = "noncredit carve-out";
else { ...money... }
```

**Open state belongs in application state, not the DOM.** If `render()` rewrites
`innerHTML` — as most string-building renderers do — a `<details open>` that
lives only in the markup snaps shut every time anything re-renders, slamming the
drawer on someone mid-read because they changed a filter:

```js
state.open = {};                                   // section id → bool
'<details class="cb-sec" data-sec="' + id + '"' + (state.open[id] ? " open" : "") + ">"
d.addEventListener("toggle", function () { state.open[id] = d.open; });
```

**A section with an empty body should not render at all.** A drawer that opens
onto blankness is worse than an absent drawer.

## Testable

The rule is mechanical, so guard it rather than relying on review:

```js
check("every closed section still states something in its header",
  Array.prototype.every.call(secs, function (d) {
    const v = d.querySelector(".cb-sum-v");
    return v && v.textContent.trim().length > 0;
  }),
  "a blank summary on a closed section reads as broken");
```

Plus: all closed on arrival, and an opened section survives a re-render while its
neighbours stay shut.

## Where this generalizes

Any COBI tab dense enough to invite a "can we collapse this" request — the CCR
worklists, the Governance register, the Credential Reference tab. The summary
line is the cheap part; deciding *which single figure* belongs in it is the
design work, and it is the same question as "what is this section for".
