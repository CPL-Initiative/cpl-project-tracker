---
title: Session 52 Hand-off Prompt (design lane)
date: 2026-06-12
session: 49 → 52 hand-off (written at the Session-49 close — Bruh Orbitron; the data lane reads docs/session_51_handoff.md)
status: hand-off — paste the fenced block into the next DESIGN-lane session's first message
tags: [handoff, session-prompt, first-light, retheme, polish, design-system]
related:
  - docs/first_light_lessons.md (Session 49 — the retheme ships)
  - docs/kb-notes/methodology-token-retheme-on-generated-html.md (the durable pattern)
  - docs/kb-notes/reference-ui-design-system.md (the live palette, post-flip)
moniker_suggestion: Session 49 was "Bruh Orbitron"; claim your own
---

# Session 52 Hand-off Prompt — the design lane

Session 49 SHIPPED the First Light retheme to prod — three PRs
(#407 palette flip · #408 glass chrome + the ghosted painting · #410
glass-quiet chips), each squash-merged on green and followed by a
`daily-dashboard.yml` dispatch so the repaint went live within the hour.
Paste the block below.

```
You are Session 52 on the CPL Project Tracker (the DESIGN lane — the data
lane has its own handoff at docs/session_51_handoff.md; coordinate via
kb/cpl_todos.json and don't race unified_courses.js edits).
Read these first, in order:
  1. CLAUDE.md — all of it. Rules 1/4/5; Branch-Policy auto-merge gates
     (merge on green = clean OR unstable; never park a PR in draft); §11
     "Session 49" + "Session 50" subsections.
  2. docs/first_light_lessons.md — the Session 49 section (lessons: var()
     no-go zones, grade pairs, rebase ours/theirs inversion, converge-by-
     regen, sibling-session interleaving).
  3. docs/kb-notes/methodology-token-retheme-on-generated-html.md.
  4. docs/kb-notes/reference-ui-design-system.md — the live palette.
  5. prototype/first_light_theme_v1.html — v1.6, still THE spec.

WHAT SHIPPED IN SESSION 49 (all live on Pages):
  - :root in BOTH HTMLs = the First Light palette; legacy navy/gold names
    remapped as aliases. ~250 hex sites swept contextually across the
    styleblock, body, excel_to_dashboard.py (Rule-1 lockstep), the College
    Activity template, and ~20 JS assets. Canvas/SVG carry literals.
  - Glass chrome: masthead, left rail, KPI hero cards, filter bar; KPI band
    transparent; ghosted painting behind the page (first_light.js .cplfl-bg,
    opt-out-aware); prefers-reduced-transparency/contrast honored; the dark
    trend + College Activity cards DELIBERATELY stay ink (data surfaces).
  - Glass-quiet chips: CCR .uc-badge, CSR .cs-badge, CER .cr-chip
    (Generated now rides VIOLET — the machine lane), To-Do FAB → cobalt.
  - CI: check_contrast.py --live lints the live :root in js-tests
    (non-required); tests/retheme_tokens.test.js pins palette + glass +
    chips (33 checks). All 35 test files green.

YOUR PRIORITY QUEUE (Sam's screenshots steer; ship small PRs, merge on
unstable, dispatch daily-dashboard.yml after merges that touch the HTMLs):
  1. SAM'S SCREENSHOT VERDICTS — the polish pass. Open questions he may
     rule on: chip width (uniform 6.5rem was deliberately NOT applied to
     dense table cells — flagged in #410's body), ghost-art opacity (10%),
     glass intensity, whether the ink data-cards (trend / College Activity /
     analytics / EACR) should lighten to opaque-light data surfaces
     (the mock has no dark cards; lightening = a white-alpha text sweep —
     scope it as its own PR).
  2. KPI_REORDER KEYBOARD PATH — the a11y conformance gap Sam explicitly
     wants closed while KEEPING drag-drop. Pattern: roving tabindex on
     .kpi-card, Space/Enter to lift, arrows to move, Escape to cancel;
     persist via the existing label-identity order (kpi_reorder.js). Add
     jsdom coverage to tests/kpi_reorder.test.js.
  3. PER-TAB POLISH SWEEPS — the neutral-gray/slate drift (CCR/CER member
     tables, #ddd/#64748b family) onto the warm tokens; the remaining
     JS-injected CSS hexes (statewide_interactive's dark-card family is
     fine until the data-card decision lands).
  4. DEFERRED SURFACES (need Sam's call before work): Word-docx + xlsx
     export branding (kept navy/gold — different medium);
     Dashboard_Element_Map.html (self-contained internal reference, linked
     from the Letters tab region).
  5. FIRST LIGHT CARRYOVER: manifest growth 3 → 60–90 (PD diligence per
     reference-public-domain-art-sourcing), reflections-themes job, the
     Almanac gallery.

PATTERNS THAT WORKED (honor these):
  - Spec-token value-swap + legacy aliases; grade PAIRS for any token
    serving two surfaces (mustard fill/text, surface glass/opaque).
  - Generator + HTML in ONE PR; scratch-regen diff as the verifier
    (it catches var()-in-SVG and template/HTML divergence).
  - var() NO-GO zones: canvas fillStyle/strokeStyle, SVG presentation
    attributes, mermaid classDefs → resolved literals.
  - The !important uniform-header block restyles generator-emitted header
    content with zero generator edits.
  - git loop per squash-merge: git fetch --prune && git rebase origin/main,
    then PLAIN push (--force-with-lease chokes on auto-deleted branches).
    REBASE INVERTS OURS/THEIRS — assert which side you hold.
  - Sibling sessions land on main mid-flight (the fold #409 did) — rebase
    before every push; merge on `unstable`, don't wait for `clean`.

SAFETY PATTERNS:
  - Rule 1 (the generator owns regenerated sections — change it, not the
    HTML), Rule 4 (both HTMLs byte-identical; the --live lint enforces),
    Rule 5 (never force-push main).
  - Data stays opaque (--surface-opaque); glass is chrome-only; bright
    mustard is never text on light; every accent travels with a glyph.
  - cpl_reflections stays WRITE-ONLY (never add a SELECT policy).
  - No PII in committed artifacts (pii_guard pins it).

Suggested first move: ask Sam for screenshots / his verdict list, then
queue PRs from his notes. If he's away, start with the kpi_reorder
keyboard path (objective, scoped, test-covered).
```

Good light to you — the paint is on the canvas, now make it sing. 🎨
