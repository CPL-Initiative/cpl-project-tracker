---
title: An inline placeholder style outranks the CSS your module injects
created: 2026-08-21
updated: 2026-08-21
tags: [methodology, ui, css, pitfall, cobi, tabs]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-an-author-display-rule-defeats-the-hidden-attribute]]"
artifacts:
  - college_briefing.js
  - tests/my_college_sierra_box.test.js
---

# An inline placeholder style outranks the CSS your module injects

> **One-sentence summary** — Every COBI tab pane ships a "Loading…" placeholder
> styled with an **inline** `style=` attribute, and inline beats any selector, so
> the pane's centring, padding and color keep applying to everything your module
> renders on top of it — for as long as nobody clears them.

## Context

Sam reported that the My College tab looked "awkward — narrow paragraphs together
with full width content". Two sessions had already tuned the measure caps on that
tab (`max-width:70ch` on the header line, `82ch` on Sierra's prose). The caps were
never the problem.

## The claim

**A tab's loading placeholder is a style the tab never stops applying.** Both
mirrored HTMLs ship every lazy tab's root like this:

```html
<div id="college-briefing-root" style="border:1px dashed …; background:…;
     color:…; padding:28px; text-align:center;">
  Loading College Briefing…
</div>
```

That is correct for the placeholder and correct nowhere else. The module then
injects `#college-briefing-root{text-align:left;}` — an ID selector, which loses
to an inline `style` attribute in every browser. So the tab rendered left-aligned
*boxes* whose *text* was centered.

⭐ **The visible symptom is a capped paragraph, which is why it reads as a layout
bug rather than an inheritance bug.** A full-width element with centered text looks
centered-and-fine. A paragraph capped at 70ch inside a 1,400px container, with its
text centered inside that cap, reads as "a ragged narrow column floating in the
middle of a wide page" — and the obvious suspect is the cap. Removing the cap
would have produced full-width centered prose, which is worse, and the next session
would have put the cap back.

⚠️ **The direction of the failure is what hides it.** Nothing is missing and
nothing throws. A centered paragraph is a plausible design choice, so no one files
a bug against it; they file a vague aesthetic complaint, months later, and the
person who reads it goes looking at the CSS the module owns.

## What to do

Shed the placeholder on the module's first render, and only the properties the
placeholder sets:

```js
function shedPlaceholder(root) {
  if (!root || !root.style || root.getAttribute("data-cb-shed") === "1") return;
  ["border", "background", "color", "padding", "textAlign"].forEach(function (k) {
    try { root.style[k] = ""; } catch (e) { /* jsdom-safe */ }
  });
  root.setAttribute("data-cb-shed", "1");
}
```

- **In JS, not in the HTML.** The placeholder still has a job before the module
  loads, and clearing it in the module is one edit rather than two mirrored ones
  (Rule 4).
- **Named properties, not `removeAttribute("style")`.** A caller that sets its own
  inline style later should survive.
- **Idempotent**, because `render()` runs many times per visit.

## How to test it

⚠️ **The fixture has to carry the real inline style or the check cannot fail.**
A test that renders into a bare `<div id="…-root">` will pass against the broken
code and against the fixed code equally — the classic unfailable check. Build the
fixture from the pane as the HTML actually ships it, and add a **precondition
assertion** that the fixture itself is centered, so a future edit to the fixture
cannot silently disarm the guard:

```js
const fresh = new JSDOM("<!doctype html><html><body>" + PANE + "</body></html>");
check("precondition: the shipped pane really does centre its contents",
  fresh.window.document.getElementById("college-briefing-root").style.textAlign === "center");
```

## Scope

Every lazily-mounted COBI tab uses this placeholder pattern —
`map-queue-root`, `cip-crosswalk-root` and the rest all ship the same inline
`text-align:center`. Any of them that renders left-aligned prose has the same
latent defect; the ones that render only cards and tables do not show it, because
a full-width block hides centered text.

## Related

- [`methodology-an-author-display-rule-defeats-the-hidden-attribute`](methodology-an-author-display-rule-defeats-the-hidden-attribute.md)
  — the same shape one level down: a rule you did not write beats the one you did.
  There it was an author `display` rule beating the UA's `[hidden]`; here it is an
  inline attribute beating an ID selector. **When an element ignores your CSS,
  ask what outranks you before you ask what is missing.**
- [`methodology-verify-with-the-instrument-that-can-see-the-defect`](methodology-verify-with-the-instrument-that-can-see-the-defect.md)
  — why the fixture, not the assertion, is where this kind of check goes wrong.
