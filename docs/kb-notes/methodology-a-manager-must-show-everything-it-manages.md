---
title: A manager must show everything it manages, or say what it cannot see
created: 2026-08-15
updated: 2026-08-15
tags: [methodology, ui, admin, navigation, information-design]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[adr-the-side-menu-as-an-overlay-over-code-defaults]]"
  - "[[methodology-a-check-that-never-registers-can-never-fail]]"
  - "[[methodology-a-provenance-label-must-say-why-not-what]]"
artifacts:
  - admin.js
  - nav_groups.js
  - cobi_orgs.js
---

# A manager must show everything it manages, or say what it cannot see

## The claim

A UI that administers a set of things must either cover the whole set or state
which parts it does not cover. **Silently omitting members is worse than
refusing to run**, because a partial view is indistinguishable from a complete
one — the operator has no way to know a question was never asked.

## What happened

The COBI Admin tab manages the side menu. Sam asked why the **Share** category
was missing from it.

Share holds two external launchers — the CPL Fact Sheet and Ask Sierra. Those
are `<a>` anchors, not tab buttons, because they open their own page rather than
a pane in the app. Every query on the Admin tab asked for `.cpl-tab[data-tab]`,
so both were invisible to it, and Share itself was *synthesised* at render time
from "whatever carries the external class" — meaning it had no id for the
curator overlay to write a row against either.

Nothing failed. No error, no empty state, no "2 items could not be read". The
tab rendered a complete-looking inventory of the menu that was missing two of
its items, and it had done so since it shipped.

**It was found by a human comparing the manager against the thing it manages** —
Sam looked at his own sidebar, saw a heading, and asked why it was not on the
page that lists headings. That is the only way this class of defect surfaces.

## Why the omission was invisible

The cause is a category error that is easy to make and hard to see: **a rule
written for one kind of thing, silently applied to a set that contains another
kind.** `data-tab` was a reasonable proxy for "menu item" right up until menu
items existed that were not tabs. The selector kept working, and quietly meant
something narrower than its name.

## The trap on the way out

Making the omitted items visible is not the end of the job. Every rule that
assumed the narrower set now runs against the wider one, and each will produce a
confident wrong answer rather than an error:

- **The site filter** matched a key against a list of *tab* ids. Applying it to
  a link key finds nothing and hides the item — so "fixing" the omission would
  have removed both launchers from every non-default site.
- **The reporting layer** had the same hazard, one level worse: it would have
  described the launchers as visible on one site while the menu showed them on
  all of them. *A manager that describes the thing differently from how the
  thing behaves is worse than one that omits it* — the omission is at least
  visible once someone looks.
- **The safety classifier** would have labelled both "not checked", so the
  page's "not checked" count would have **risen by two the day the omission was
  fixed**. A number going up because you started *showing* something is a false
  finding, and it points investigation at the wrong place.

Each needed an explicit branch for the new kind, not a wider selector.

## How to apply it

1. **Ask what the manager's selector actually means**, not what it is called. If
   it names a mechanism (`data-tab`, `kind='table'`, `*.py`), the set it returns
   will drift from the set the page claims to cover.
2. **Reconcile against the real thing, periodically.** Count what the managed
   system contains and compare it to what the manager lists. A mismatch of two
   is invisible by inspection and obvious by subtraction.
3. **When coverage is genuinely partial, print the gap.** "5 tabs unmapped, and
   here they are" is a usable state. A blank is not.
4. **When you widen the set, audit every rule that consumed the old one** — each
   is a candidate to answer confidently and wrongly.
5. **Prefer a distinct state over the nearest existing one.** The launchers got
   their own classification ("opens another page") rather than being squeezed
   into "not checked", because the honest answer was neither a pass nor a
   finding.

## The generalisation

This is the same failure as
[[methodology-a-check-that-never-registers-can-never-fail]] wearing different
clothes. There, a check that never ran subtracted from both sides of a ratio and
every run read "all passed". Here, an item that was never enumerated subtracted
from both the inventory and the problem count, and every render read "complete".

**An absence has no symptom. It has to be measured against an independent count
of what should be there, by someone who knows the real set** — which is usually
a human looking at the actual system, not the tool describing it.
