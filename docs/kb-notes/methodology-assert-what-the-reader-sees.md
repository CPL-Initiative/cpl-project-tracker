---
title: Assert what the reader sees, not what the source says
created: 2026-08-11
updated: 2026-08-12
tags: [methodology, testing, ui, my-college]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-percentage-must-not-round-up-into-a-claim]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/kb-notes/methodology-assert-the-contract-not-the-argument-order]]"
artifacts:
  - tests/college_briefing.test.js
  - college_briefing.js
---

# Assert what the reader sees, not what the source says

> **One-sentence summary** — a test that greps the source file for a phrase
> fails in **both** directions: it goes green while the page is wrong, and red
> while the page is perfectly right.

## Context

Front-end copy in this project is assembled from concatenated string literals,
and a lot of it carries real weight — suppression notices, "this is a limit of
the scheme, not a judgment on you", "never read this as a ranking". Tests grew
up around that copy by grepping the *source file*:

```js
check("never presented as a ranking against other colleges",
  /Never read this as a ranking against other colleges/.test(briefingSrc));
```

That is convenient, it needs no DOM, and it is wrong in a way that only shows up
later.

## The claim

**A source-text assertion tests the wrong artifact, and it is unsound in both
directions.**

**False red.** Rewording that changes nothing a reader would notice breaks the
grep. Worse, so does *reflowing* — the copy is built as
`"…colleges that batch-upload " + "already-posted credit…"`, so
`/batch-upload already-posted credit/` never matches the source even though the
rendered sentence contains exactly that string. Four assertions failed this way
in one commit while the page was correct. **A test failing for a reason the
reader cannot see teaches the next person to edit the assertion rather than
investigate it** — and once that habit exists, the real failures get edited away
too.

**False green.** The inverse is worse and quieter. Every one of 163 assertions
passed on a page that printed *"100% of it is credit for basic military
service"* directly above a row reading *"Elective credit · 12 units · 0.2%"*.
Nothing was grepping for a contradiction, because a contradiction has no fixed
string to grep for. It was caught by **rendering the page and reading it.**

So the rule has two halves:

1. **Assert against the rendered output** — `root.textContent` after a real
   `render()`, with whitespace normalised (`.replace(/\s+/g, " ")`) so the
   assertion does not depend on how the source happened to wrap.
2. **Read the render yourself, at least once, for every state the code can
   produce.** Not the happy path — *every* branch: the empty one, the all-of-it
   one, the singular one, the withheld one. Four tier states took one throwaway
   script and 30 seconds, and two of the four had copy defects that no assertion
   was ever going to name.

## How we got here

Session 141 (SkyLink), PRs #1121 and #1123, on the My College tab. The
false-green case cost a shipped bug; the false-red case cost four confusing
failures on a correct page in the very next commit. Both were the same root
cause seen from opposite sides, in the same file, within an hour.

The remaining source-greps in that suite are now confined to things that
genuinely *are* properties of the source rather than of the page — for example
"this function body must never reference `state.viewSlot`", which is a
structural claim about code, not about copy.

## When this applies (and when it doesn't)

Applies to every assertion about **copy, wording, or anything a human reads**.
If the thing you are checking would be described to a colleague as "the page
says…", assert the page.

Does not apply to genuine source-level invariants: a forbidden import, a
function that must not reach for shared state, a config key that must exist.
Those are properties of the code, and the source *is* the artifact under test —
see `[[docs/kb-notes/methodology-assert-the-contract-not-the-argument-order]]`
for the neighbouring rule about asserting the contract rather than the
incidental shape.

The cheap version of all of this, worth doing before any of the above: **print
the output and read it.** It is the single highest-yield check available and it
requires no framework.

## Corollary: never pin an assertion to a value that changes on its own (2026-08-12)

A third way to be wrong about what the reader sees — this one fires on a
schedule. An assertion read:

```js
/at least 500 CPL students \(you: 2,250\)/.test(tierTxt)
```

and went red on 2026-08-12 with nothing broken. The figure comes from
`live_metrics.json`, which the daily cron refreshes from the CCCCO dashboard
scrape, and City College of San Francisco had moved to **2,251**.

That is not a flaky test, it is a **scheduled false alarm**: it was always going
to fire, on a day nobody could predict, at whoever happened to be working. And
its cost is worse than the wasted hour — a suite that cries wolf trains the next
session to skim failures, which is exactly when the real one lands.

Assert the **shape**, and source the number from the same file the page reads:

```js
const ccsfLive = /* … look the college up in LIVE.tiers … */;
check("the tier fixture college is present in live_metrics.json", !!ccsfLive);
check("every criterion appears with the college's own value",
  new RegExp("at least 500 CPL students \\(you: "
    + ccsfLive.students.toLocaleString("en-US") + "\\)").test(tierTxt));
```

Note the added presence check. Deriving the expectation from the same source as
the render can pass vacuously if the lookup returns `undefined` and both sides
become "nothing" — so assert the fixture exists before asserting what it renders.

**Rule of thumb: if a committed value would change without anyone editing the
repo, it is data, not an expectation.** Pin the invariant; look the value up.

## See also

- `[[docs/kb-notes/methodology-a-percentage-must-not-round-up-into-a-claim]]` — the bug the render caught
- `[[docs/kb-notes/methodology-commit-the-test-harness]]` — the practice this refines
- PR `#1121`, `#1123` — the false green and the false red
- PR `#1128` — the scheduled false alarm (a daily-refreshed figure pinned in an assertion)

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
