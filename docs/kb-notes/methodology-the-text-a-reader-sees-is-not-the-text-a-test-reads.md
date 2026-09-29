---
title: The text a reader sees is not the text a test reads
created: 2026-09-02
updated: 2026-09-02
tags: [methodology, testing, jsdom, presentation-doctrine, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-defaulted-field-looks-computed-and-never-moves]]"
  - "[[methodology-a-test-coupled-to-position-or-wording-breaks-on-correct-work]]"
artifacts:
  - tests/cpl_funding_calm.test.js
  - tests/cpl_funding_gate_ledger_public.test.js
  - docs/cpl_funding_lessons.md
---

# The text a reader sees is not the text a test reads

> **One-sentence summary** — a guard that sweeps rendered text for a banned
> word or glyph must read the *markup* with a space where every tag was, not
> `textContent`, because `textContent` has no seams and no tooltips.

## Context

The 2026-09-02 calm pass on the Implementation Funding tab replaced every
rendered glyph with a word and banned retired vocabulary ("pool", "money",
"apportion", the advance concept) from everything a reader sees. The guard for
it, `tests/cpl_funding_calm.test.js`, sweeps the whole mount on four sub-views
and was mutation-tested before it shipped. Two of the mutations exposed the
same defect in the guard from two directions.

## The claim

### `textContent` joins adjacent elements with nothing

`<span>…net down to the one institution pool</span><button>Remove</button>`
has a `textContent` of `…net down to the one institution poolRemove`. A search
for `\bpool\b` finds no word boundary after `pool` and reports the page clean.
The same shape hid `$150,000held $147,606` from a gate test on 2026-07-30 and
was recorded there; it did not travel to the next guard, because nothing in
the API warns you. The fix is mechanical: read the words off `innerHTML` with
a space substituted for every tag, then decode the entities a word could
touch:

```js
function mountWords(doc) {
  return doc.getElementById("cplFundingMount").innerHTML.replace(/<[^>]*>/g, " ")
    .replace(/&(mdash|ndash|middot|nbsp|rsquo|hellip|sect|times|divide|minus|plus);/g, " ")
    .replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}
```

A `\b`-anchored search over that string finds the word at an element's edge.

### Tooltips and entities are rendered text that `textContent` never carries

A glyph sweep over `textContent` passed a page that showed two arrows. One
was in `title="… use your browser's Print → Save as PDF"` — hover text a
reader sees and an attribute `textContent` does not include. The other was
`" per student &rarr; "` in a source string — an entity in the code, an arrow
on the page. Sweeping `innerHTML` for the character classes catches both,
because the DOM has already decoded the entity and the attribute is markup.

### A mutation that passes is first a question about the fixture

The "pool" mutation passed on its first run. Before blaming the guard, check
that the mutated branch renders in the test fixture at all: the ledger label
has a single-source branch and a multi-source branch, and the fixture shows
only one. Here the mutated branch did render, which is what turned a
"probably an untested branch" into the seam finding above. The order matters:
fixture first, then guard.

### A guard that dies cannot report

With the Edit control mutated out, the suite's `click(doc.querySelector(…))`
threw on `null` and the run ended before the summary printed — no failure by
name, no pass count, nothing. This is S219's lesson recurring in the very
suite written after it. Every click on a control a regression could remove
now goes through a helper that records absence as a failure and continues:

```js
function clickSel(window, doc, sel, what) {
  const el = doc.querySelector(sel);
  check("control present: " + (what || sel), !!el);
  if (el) click(window, el);
  return !!el;
}
```

## How we got here

`cpl_funding_calm.test.js` was mutation-tested seven ways before it shipped: a
glyph back on a button, the section chevron back, the Reset button red again,
the Edit control removed, an override rendered as raw markup, "pool" back in a
rendered label, and the held-in-reserve figure floating as its own item. Four
failed by name on the first run; the Edit mutation crashed the run, and the
"pool" mutation passed. Both were the guard's fault, and both are fixed as
described above. The full account is in `docs/cpl_funding_lessons.md`
(2026-09-02, Session 220).

## Where this applies

Any jsdom guard that asserts on what a page *says* — vocabulary bans, glyph
bans, a required phrase near a required figure. Presentation doctrine is
enforced by exactly these guards, and a sweep that reads `textContent` will
pass a page that a reader would flag.
