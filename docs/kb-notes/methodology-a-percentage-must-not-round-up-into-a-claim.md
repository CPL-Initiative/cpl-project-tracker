---
title: A percentage must never round up into a claim it cannot support
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, ui, numbers, disclosure, my-college]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-publish-the-denominator-with-the-number]]"
artifacts:
  - college_briefing.js
  - tests/college_briefing.test.js
---

# A percentage must never round up into a claim it cannot support

> **One-sentence summary** — `Math.round()` on a share turns 99.76% into
> "100%", and "100%" is not a rounded number, it is a **claim of totality** that
> the page may be visibly contradicting three lines above.

## Context

The My College tab breaks its lead figure — credit already articulated and
waiting on a decision — into what that credit consists of, then summarises:
*"N% of it is credit for basic military service."* On a college with 4,488 +
500 military units out of 5,000, the summary printed **"100% of it is credit
for basic military service"** while a row reading *"Elective credit · 12 units
· 0.2%"* sat directly above it. The true share is 99.76%.

Every assertion in the test file passed. It was caught by rendering the page
and **reading the output**.

## The claim

**Round a percentage down, never up, whenever the top of the range is a
qualitative claim rather than a quantity.**

`100%`, `0%` and `all`/`none` are not points on a scale — they are statements
about the *absence of exceptions*. A reader who sees "100%" and then finds one
exception concludes the page is broken, and is right to. The same applies at
the bottom: a rounded "0%" over a real, nonzero cell says "there is none of
this here", which is the blind-spot-rendered-as-a-zero failure in another suit.

The fix is a helper, not vigilance at each call site:

```js
function safePct(x, dp) {
  var f = Math.pow(10, dp || 0), p = (Number(x) || 0) * 100;
  if (p >= 100) return 100;                      // genuinely all of it
  return Math.min(100 - 1 / f, Math.round(p * f) / f);
}
```

At `dp = 0` that yields 99 for 99.76%; at `dp = 1`, 99.8. An exact 1.0 still
returns 100. The ceiling is expressed as `100 - 1/f` so it tracks the requested
precision instead of being hard-coded.

**Give the totality case its own branch of prose.** Once `100%` is reserved for
genuine totality it becomes worth saying differently — *"All of it is…"* reads
better than *"100% of it is…"*, and hedges written for the approximate case
("it is **close to** one decision applied repeatedly") are wrong when it is
actually all of it. One boolean, two sentences.

## How we got here

Session 141 (SkyLink), PR #1121. The same PR already carried a guard against
the *inbound* form of this bug: `live_metrics.json` publishes a college's
transcription rate rounded to one decimal, while the Cloudflare worker's own
tier criterion tests the **unrounded** ratio — so a true 24.96% is published as
`25.0`, and any consumer that scores the "≥ 25%" criterion off the published
field disagrees with the worker that assigned the tier. That consumer reads the
raw ratio instead.

Having written that guard, the session then shipped the outbound form of the
identical bug in the same file. The two are one lesson seen from both ends: a
rounded number is a **lossy summary**, and it stops being safe the moment
anything downstream treats it as exact — including a human reading a sentence.

## When this applies (and when it doesn't)

Applies wherever a rounded share is rendered as prose, and wherever a rounded
value is read back as an input to a threshold test. It matters most when the
same page shows the parts *and* the summary, because the contradiction is then
visible in one glance.

It does not apply to ordinary interior values — 87.7% may round to 88% freely.
Only the endpoints carry a qualitative claim.

**The transferable habit is smaller than the rule: render the thing and read
it.** Assertions test what you thought to ask. The contradiction here was
obvious in one line of output and invisible to a suite that had grown to 163
checks.

## See also

- `[[docs/college_action_page_lessons]]` — the workstream
- `[[docs/kb-notes/methodology-publish-the-denominator-with-the-number]]` — the neighbouring failure: a number without its denominator
- PR `#1121` — `safePct()` + the tier-criterion guard, `tests/college_briefing.test.js`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
