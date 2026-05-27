---
title: Methodology — Derive whitelists from rendered DOM, not hardcoded lists
created: 2026-05-27
updated: 2026-05-27
tags: [methodology, ui, javascript, navigation, refactoring, obsidian-target]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/sidebar_lessons]]"
  - "[[docs/quickstart_chat_lessons]]"
artifacts:
  - tabs.js
---

# Methodology — Derive whitelists from rendered DOM, not hardcoded lists

> **One-sentence summary** — When N consumers reference "the list of valid X"
> in the UI, derive it once from the rendered DOM at consumption time rather
> than maintaining N hardcoded copies; adding a new X then becomes drop-the-
> markup with zero JS changes.

## Context

The dashboard's tab nav had four+ consumers of "the list of valid tabs":
- The inline router's `VALID_TABS` whitelist (in `CPL_Dashboard.html`)
- `quickstart.js`'s router target validation
- `unified_courses.js`'s `consumeAuthHash()` return-tab default
- Per-curator-tab sign-in `signIn()` functions (each stashing their tab name)

Adding a new top-level tab required updating all of them. This caused real
production incidents:
- **PR #117 hotfix**: Credential Reference tab added but missing from
  `VALID_TABS`; clicking the tab fell through to the dashboard fallback.
- **PR #118 hotfix**: Magic-link return-tab hardcoded to "unified-courses";
  curators got bounced after sign-in.
- **PR #141 hotfix**: Letters tab + Quickstart router both forgot to add
  each other; "draft a support letter" couldn't reach the tab.

The fix in each case was a one-liner update to the missed consumer. The
underlying problem is that **the list of valid tabs is a property of the
rendered nav, but it was being maintained as a separate global.**

## The claim

**For UI elements that have a rendered "list-of-items" representation, the
list of valid items should be derived from `querySelectorAll` at consumption
time, not maintained as a parallel hardcoded array.**

The DOM is already the source of truth — if it's rendered, it exists. A
hardcoded whitelist is just a stale shadow of the DOM that goes wrong every
time anyone adds, removes, or renames an item.

### Implementation pattern

```js
// Before — hardcoded, brittle:
var VALID_TABS = ['dashboard', 'workplan-goals', 'budget', /* ... */];

function activate(tabName) {
  if (VALID_TABS.indexOf(tabName) === -1) tabName = 'dashboard';
  // ...
}

// After — derived, robust:
function validTabs() {
  return Array.prototype.slice.call(
    document.querySelectorAll('nav.cpl-tabs .cpl-tab[data-tab]')
  ).map(function (b) { return b.getAttribute('data-tab'); });
}

function activate(tabName) {
  var valid = validTabs();
  if (valid.indexOf(tabName) === -1) tabName = valid[0] || 'dashboard';
  // ...
}
```

The cost is one query per route resolution (cheap; <0.5ms for ~10 items).
The benefit is the array goes stale automatically — adding a `<button
data-tab="new-tab">` makes "new-tab" valid; removing the button invalidates
it. **The list cannot drift from reality.**

### When to expose via a module API

Once derived, expose via a single API rather than letting other consumers
re-query (which would re-introduce drift if the selector changes):

```js
window.CPL_TABS = {
  activate: activate,
  navigate: navigate,
  valid: validTabs,
  // ...
};
```

Consumers (quickstart.js, etc.) call `window.CPL_TABS.activate(tabName)`
instead of touching `location.hash` directly. The DOM-derivation lives in
exactly one place.

## How we got here

**PR #147 (Bruh El, 2026-05-27)** — replacing the horizontal tab nav with
a left rail forced a refactor of the inline router anyway. Bundled with the
sidebar layout, the inline router moved into `tabs.js` and the hardcoded
`VALID_TABS = [...]` became `validTabs()` deriving from
`document.querySelectorAll('nav.cpl-tabs .cpl-tab[data-tab]')`.

The 5-touch-points trap closed in the same PR. Future tab additions need:
1. Drop a `<button class="cpl-tab" data-tab="...">` in the nav.
2. Drop a `<div class="cpl-tab-pane" data-tab="...">` in the main column.
3. Ship the tab's script if it has one.

Items 4 (whitelist) and 5 (return-tab default) became automatic.

## When this applies (and when it doesn't)

**Applies:**
- Any UI element with a "list-of-items" markup pattern (tabs, nav items,
  options in a dropdown rendered server-side, breadcrumbs).
- Anything where the list of valid values is implicit in what's rendered.

**Does NOT apply:**
- Lists that exist purely in JS state (not rendered as DOM elements).
- Cases where the list of valid values is genuinely separate from what's
  visible (e.g. roles a user MIGHT have but isn't currently rendered).
- Performance-critical hot paths where the query cost matters (extremely
  rare for nav-list cases).

## See also

- `[[docs/sidebar_lessons]]` — the workstream that codified this pattern.
- `[[docs/quickstart_chat_lessons]]` — where the original trap kept biting.
- PR #147 — the tabs.js extraction.

---

*Authoring check: durable (applies any time markup duplicates state),
reusable (every dashboard project hits this), distilled (one pattern,
one rule), self-contained (implementation pattern inline).*
