---
title: A display name is not a key — and the entry that still matches is the one that lies
created: 2026-09-15
updated: 2026-09-15
tags: [methodology, identity, curation, funding, presentation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/implementation-funding]]"
  - "[[docs/kb-notes/methodology-a-count-based-guard-passes-when-its-subject-disappears]]"
artifacts:
  - funding-model/index.html (CPL_PAINT_EXPLAINER)
  - funding_model_payload.js
  - tests/funding_model_page.test.js
---

# A display name is not a key — and the entry that still matches is the one that lies

> **One-sentence summary** — A lookup keyed on a name a curator can edit goes
> wrong silently the day the name is edited, and its worst output is not the
> missing entry but the stale entry that still matches.

## Context

The public funding explainer paints one card per priority. Each card carried a
plain-language sentence, held in a map in the painter:

```js
var plain = {
  "Access":   "Prior learning that students actually had applied to their record…",
  "Outreach": "Prior learning a student is eligible for…",
  "Success":  "Prior learning written onto the transcript…"
};
m.textContent = plain[p.title] || p.metric;
```

Those three titles were the model's priorities when the map was written. They
are not any more: Sam renamed them to **Outreach · Completion · Awards** and
re-pinned the measures underneath them.

## The failure

Two of the three cards missed the map and fell through the `||` to `p.metric`
— the raw measure string ("Applied CPL units (FTES) for students with Counselor
step checked"), which is a field definition rather than a sentence. That is bad
but visible: a reader can tell they are looking at something technical.

The third is the one that matters. **"Outreach" still matched its key**, so the
card printed a description of *eligible* units — credit a college has agreed it
would grant — under a priority that now measures *applied* units originating
from the portal, the landing page and batch upload. Different rung of the
funnel, different population, roughly two orders of magnitude apart in volume.

The card that was wrong was the only one that looked right.

## Why nothing caught it

Every guard the page had was pointed somewhere else, and each was reasonable:

- The figure guards require a currency figure or a thousands-separated number
  in the prose to carry an `id`, so the painter can fill it. A **sentence** is
  neither.
- The paint guards assert that each container fills from the payload and that
  repainting does not accumulate. Both were true — the map is *in* the painter,
  so it repaints happily and deterministically.
- The dial guards change a share or a factor and require the page to move. The
  description is not a dial.

And the failure mode itself is quiet. A missing key yields a fallback rather
than an exception; a matching key yields confident prose. Neither raises
anything for a human to notice, and the surface is a public page nobody
re-reads end to end.

## The rule

**Key on identity, never on display.** This repo already states the identity
half for stored rows — M-IDs resolve through `kb/alias_chain.py`, and the
funding tab's own comment says a priority's `src` index is "its IDENTITY,
unchanged by a drag reorder", because pairing by position is "silently wrong
the moment the cards are reordered". This is the same rule for *text*: a title
is a label a curator edits, so it may not stand in for the thing it labels.

The fix is usually not a better key but **no second copy at all**. The model
already carried a `description` per priority, curated on the same tab as the
share and the measure. Once the page reads that, there is nothing left to go
stale — and the same pass found two more copies of the same shape on the same
page: a hand-typed list of baseline requirements whose first entry no longer
matched the model's, and a hand-typed participation deadline ("1 Nov 2026"
against a stored `2026-11-01`).

## How to guard it

A guard that supplies the value it then reads proves only the second half. The
one that catches this **renames the thing and requires the content to survive**:

```js
T._setShared({ yearPriorities: { "1": { "0": {
  title: "A title nobody has used before",
  description: "A sentence only the model could supply."
} } } });
repaint();
check("RENAMING the priority keeps its sentence — the title is not the lookup key",
  /A sentence only the model could supply\./.test(
    doc.querySelector("#prios .prio .metric").textContent));
```

Under the old map that paint loses the sentence. Under the model-sourced
version it cannot, because the rename never touches the lookup.

## Where else this shape lives

Anywhere a consumer holds its own gloss, label or ordering for something a
curator names. Worth checking when a name is about to change: the report and
memo builders' priority language, any `switch` on a status word, and any test
fixture that hard-codes a title to find the row it means.
