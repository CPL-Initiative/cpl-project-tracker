---
title: Sidebar / Tab Router — Workstream Lessons
date: 2026-05-27
session: 11 (Bruh El)
prs: [147, 148]
tags: [sidebar, navigation, tabs-js, scroll-spy, ui, obsidian-target]
artifacts:
  - tabs.js
  - CPL_Dashboard.html
  - quickstart.js
related:
  - "[[CLAUDE]]"
  - "[[docs/quickstart_chat_lessons]]"
  - "[[docs/kb-notes/methodology-derive-from-dom]]"
---

# Sidebar / Tab Router — Workstream Lessons

A workstream-scratchpad doc for the dashboard's navigation refactor. Began
Session 11 with the brief: replace the horizontal tab strip with a fixed left
rail AND close the "5-touch-points trap" that kept biting earlier sessions
(PRs #117, #118, the Letters/Quickstart regression in #136).

## 2026-05-27 — Session 11 (Bruh El)

### What shipped

**PR-Sidebar-A (#147)** — left rail + tabs.js router extraction
- CSS Grid: `grid-template-columns: 220px 1fr`. Below 900px, the rail
  becomes a fixed slide-over (`transform: translateX(-100%)` → `translateX(0)`)
  with a hamburger button and backdrop overlay. Outside-click + Escape both
  close it.
- `<nav class="cpl-tabs">` keeps the same `class="cpl-tab" data-tab=…` markup
  it had as a horizontal strip, just restyled vertical inside `.cpl-sidebar`.
  Zero churn on `quickstart.js` (the `qs-pulse` target selector kept working
  verbatim) or on the inline router.
- New `tabs.js` extracted from the inline `<script>` that used to live at the
  bottom of `CPL_Dashboard.html`. **`VALID_TABS` is now derived from the
  rendered nav buttons**, not hardcoded. Exposes `window.CPL_TABS.activate()`
  so other modules can route without touching `location.hash` directly.
- Sidebar footer: read-only auth status badge (`#cpl-rail-auth`) reads
  `sessionStorage.cpl_sb`, re-renders on `storage` + `focus` +
  `cpl-auth-change` + every tab activation. Per-tab inline sign-in widgets
  stay intact — the rail badge is informational, not interactive.

**PR-Sidebar-B (#148)** — per-tab section TOC + scroll-spy
- Each tab pane declares its sections via JSON attribute:
  `data-sections='[{"slug":"kpis","id":"kpiSectionWrapper","label":"KPI Metrics"},…]'`.
  tabs.js reads on activation, renders nested `<ul class="cpl-sidebar-toc">`
  directly after the active rail item, tears down on tab switch.
- Click a TOC item → smooth-scroll to the section + update hash to
  `#<tab>/<section>`. `fromHash()` strips the sub-path to find the tab;
  `activate()` accepts an optional section slug.
- IntersectionObserver-based scroll-spy with `rootMargin: '-80px 0px -55% 0px'`
  so the "active" band tracks what the user is reading near the top of the
  viewport. Picks the topmost visible section as the highlighted one when
  multiple are simultaneously in view.
- Dashboard tab gets 3 sections, Pipeline gets 4 (added IDs to the 4
  `.pl-section` divs). Other tabs declare no `data-sections` and get no TOC.

### Lessons learned

**1. Closing the 5-touch-points trap by deriving from DOM.**
The previous router hardcoded `VALID_TABS = ['dashboard', 'workplan-goals', …]`
in five different consumers. Adding a tab meant:
1. drop nav button
2. drop pane div
3. ship script
4. update VALID_TABS (often forgotten — caused #117/#118)
5. update return-tab default (often forgotten — caused the Letters/QS regression)

By having `tabs.js` derive `VALID_TABS` from
`document.querySelectorAll('nav.cpl-tabs .cpl-tab[data-tab]')` at activation
time, items 4 and 5 became automatic. Drop a button → it just works.
The pattern generalizes: **whenever multiple consumers reference the same
list of routes/options, derive the list from the rendered DOM once.**

**2. Keep existing markup conventions when restyling.**
The temptation was to rename `cpl-tab` → `rail-item` since it's now in a
sidebar. Resisting that saved touching `quickstart.js` (which selects
`button[data-tab="…"]`), the qs-pulse animation, applyHint event plumbing,
and the inline router's selectors. Layout changes shouldn't ripple class
churn through every dependent module if you can help it.

**3. Read-only auth status in the rail vs full per-tab auth widgets.**
Considered moving per-tab sign-in widgets entirely into the rail. Rejected
because each tab's widget does real work (in-place feedback panel, error
state, "use a different email" link) that doesn't fit a 220px column. The
rail gets a read-only status pill ("✓ signed in" with email, or "— not
signed in"). Per-tab widgets stay where they live their best life.

**4. `data-sections` JSON attribute beats nested `<ul>` in markup.**
For PR-B, considered emitting a nested `<ul>` inline in each pane (alongside
the `.cpl-tab-pane`) and lifting it to the rail. Rejected because:
  - Per-tab pane already has 7 different teams of content; section list is
    a different layer of concern.
  - JSON attribute = single source of truth, easy to validate, easy to extend
    (could grow `icon`, `badge`, etc).
  - Markup-side, only `cpl-tab-pane` carries it; tabs.js owns rendering.

**5. scroll-spy rootMargin: bias toward the top.**
Initial naive observer (no rootMargin) fired the "active" change as soon as
ANY pixel of a section entered the viewport — felt jumpy because the next
section "took over" too early. `rootMargin: '-80px 0px -55% 0px'` means:
  - Top margin -80px → don't fire as soon as section's top peeks under
    the page header; wait until it's reasonably scrolled in.
  - Bottom margin -55% → the observer's "viewport" cuts off at 45% of
    screen height; sections below that don't count as "in view."
  - Net effect: the active section is whatever the user is most likely
    actually reading, near the top quarter.

**6. Deep-link hash routing: `#tab/section` not `?tab=&section=`.**
Hash-based routing means GitHub Pages doesn't need URL-rewriting (and
nothing on the server side cares). Used `/` as the separator (more semantic
than `&` or `:`); `fromHash()` `split('/')[0]` gracefully handles `#tab`
and `#tab/section` alike. Backwards-compat: existing `#unified-courses`
deep links still work.

### Strategic roadmap

| What's next | Status |
|---|---|
| Sidebar polish on narrow screens (icon-only rail at 700-900px?) | parked |
| `cpl-auth-change` custom event dispatch from curator tabs after sign-in/out (so rail badge updates faster than the focus event) | parked |
| TOC for other tabs (CCR, Credential Reference) if they grow sub-sections | gated on those tabs growing real sub-sections |
| Sidebar drag-to-resize | YAGNI for now |

### Next concrete step

Workstream is in a clean parked state. Sidebar serves its purpose;
extension only when there's a real felt pain.
