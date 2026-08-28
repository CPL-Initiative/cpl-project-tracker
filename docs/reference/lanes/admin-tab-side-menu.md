---
title: "Admin tab / the side menu as data — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Admin tab / the side menu as data

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** One place to manage the COBI side menu — order, grouping, naming, which sites show what, who sees it — beside what actually protects each tab.

## Status

✅ **LIVE AND IN USE** (SkyGate #1193/#1195/#1196; SkyKey #1203; Sky159 #1209/#1210; Sky160 #1212/#1213/#1214). ⭐ **SAM HAS DRAGGED AND SAVED — `cobi_nav` holds 43 rows** stamped `slee@cccco.edu`, 2026-08-15 13:59 UTC (his renames *Metrics and Plans* / *MAP Team Tools*, a `settings` category, CPL Assistant hidden, audience rungs set). The three-handoff "unproven in a real browser" item was **closed by reading the table**, not by asking — the answer had been sitting there for hours. ⭐ **THE OVERLAY NEVER GATES THE MENU**: the page builds from code and paints, then applies the overlay if it arrives. Offline · HTTP error · malformed rows · a throwing `plan()` · a corrupt cache each land on the shipped menu, each tested. ⚠️ **LOCKOUT IS PREVENTED IN CODE, NOT THE TABLE.** **THREE lists, each on its own axis** — `PROTECTED` (never hidden) = admin+dashboard · `AUDIENCE_LOCKED` (never narrowed) = dashboard · `GROUP_LOCKED` (never grouped) = **dashboard alone**. Admin MAY now live in a category (Sam's Settings): `plan()` already LIFTS a protected tab out of a hidden group, so the drag ban was a second belt over a sealed door. The axis is always *what could the viewer not undo*. ⚠️ **DISPLAY IS NOT SECURITY** — menu columns and the live RLS gate (`cobi_rls_gates()`) share ONE table. **73 tables + 6 views: 29 public-read · 24 team-phrase · 10 server-only · 5 reviewer-only · 4 Finance · 1 GR · 0 with RLS off**; five tabs render **unknown with the reason**, never a clean bill. ⭐ **SHARE IS A REAL GROUP (#1213)** — it was synthesised from anchors with no `data-tab`, so **two menu items were invisible to the manager while the page looked complete**. Launchers carry `data-nav-link`, stored `kind='tab'` (no migration). ⚠️ Widening the set made three rules lie: the site filter (a link key isn't in any site's TAB list → would hide both), `sitesFor()` (would describe the menu differently from how it behaves), and `rowGate()` (**"Not checked" would have RISEN by two the day Share became visible** — a count going up because you started SHOWING something is a false finding). New `link` gate. [`methodology-a-manager-must-show-everything-it-manages`](docs/kb-notes/methodology-a-manager-must-show-everything-it-manages.md). ⭐ **PLAIN WORDS, NO GLYPHS (#1212)** — every control is a word (Rename · Hide · Remove · Seen by: … · All sites). ⚠️ **The no-cheesy-glyphs rule was recorded in `cpl_memory` 2026-08-14 and the tab shipped covered in emoji that same week** — recording a rule and applying it are two events. ⚠️ **A FULL-REWRITE SAVE MUST ROUND-TRIP WHAT IT DID NOT TOUCH**, and **a bulk POST is ONE INSERT over the UNION of the array's keys** (why `cobi_nav` held zero rows for two days). **NEXT:** ① Sam drags Admin into Settings and saves — enabled, his call; ② **the Finance phrase scope** (below); ③ **org roster as data** — `cobi_orgs.js` ORGS becomes a table, which is what makes "what is in Finance" ONE list and what a per-site Admin filter would read. Story: `docs/admin_tab_lessons.md`; ADR [`adr-the-side-menu-as-an-overlay-over-code-defaults`](docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults.md).
