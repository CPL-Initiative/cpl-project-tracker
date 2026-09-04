---
title: "Session 228 handoff — the masthead shipped; the accessibility sweep is a lint waiting on one palette ruling"
created: 2026-09-04
updated: 2026-09-04
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 228

Your moniker is **SkyQuiet** (assigned by SkyMint at sign-off, per Sam's
2026-09-03 template): the ruling you are most likely to land is `--text-quiet`,
the token that lets four thousand "no value here" markers be legible without
making absence the loudest thing on the screen. Predecessors: SkyFold S225 →
SkyLand S226 → **SkyMint S227**.

## What S227 did

One PR (#1469, merged) and this checkpoint.

1. **The COBI masthead, six asks from Sam.** Tagline gone (from the `<title>`
   and `og:title` too, via `COBI_TITLE` in the generator — Rule 1); the CPL
   superscript and per-site org tag gone, with `cobi_brand.js` now **sweeping**
   any `.cobi-num` so a cached `cobi_orgs.js` cannot restore it; Refresh moved
   into About **at runtime** (the generator re-injects it after `.last-updated`
   every cron run, so markup edits get undone); the team phrase folded into the
   identity chip via `mountInto()`; site options read `<code> — <full title>`;
   the alpha banner rewritten and made low-key.

2. **The zoom mess was three CSS defaults, not styling.** A bare `1fr` is
   `minmax(auto,1fr)`; a flex item defaults to `min-width:auto`; a non-stretch
   `justify-self` sizes to content. Each alone reproduces the overlap.
   Measured: `.cobi-brand` drew 580px in a 322px track at 768px. `main` fails
   19/136 Chromium checks; head passes 196/196.

3. **Seven real AA failures in the masthead, three written that same session** —
   one minutes after a comment saying not to use `--text-faint` for essential
   text. `scripts/check_cobi_header_layout.js` now audits contrast (glass
   composited), accessible names, 24px targets and focus, **with the panes open
   and a credential held** — a closed popover is a check that passes by not
   looking.

4. **A 38-view sweep sized the problem, and its totals were retracted the same
   day.** The ranking is sound; the absolute counts are not (shared chrome
   re-measured on every tab; SC 2.5.8's inline-target exception unencoded).

## Read these, in order

1. `docs/public_pages_a11y_lessons.md` — the sweep, the four roles of
   `#94a3b8`, the two harness defects, and the enforcement shape Sam agreed.
2. `docs/cobi_lessons.md` — the masthead rework and Sam's banner correction.
3. `docs/kb-notes/methodology-audit-by-rendered-value-not-by-file.md` — why
   7,000 renders are ~270 source lines.
4. `docs/kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied.md` —
   updated this run with the sharpest instance yet.

## THE ONE THING WAITING ON SAM

**`#94a3b8` is four roles and he has ruled none of them.** Roles 2–4 need no
input (leave disabled controls — WCAG 1.4.3 exempts them; leave decorative
borders; `--text-muted` for supplementary text). Role 1 is the judgment:
~4,000+ "no value here" markers (`.cr-null` *"— no articulations"*,
`.uc-member-empty`, `.cr-chip-none`, "No matches", "Loading…").

- Proposed: a new **`--text-quiet` at `#6B6B66`** (4.89:1 worst-case).
- ⚠️ Measure against the **worst ground in use**, never one sample: across white
  rows, `#F1F5F9` chips/zebra and the page ground, `#75756D` only reaches
  4.24:1. An earlier `#75756D` figure in chat was wrong for this reason.
- The tension he must resolve: at full `--text-muted` (6.15:1) absence becomes
  the loudest thing on a dense grid, which is backwards.

Once ruled, roles 2–4 apply without further input.

## The queue, in Sam's order

1. **The a11y sweep** (he said: *"Put the sweep behind the current PR"* — the PR
   is merged, so this is now live). Fix the harness first (scope to the active
   pane; encode the SC 2.5.8 inline exception), then reconcile the raw-hex
   palette. **338 controls with no accessible name** is the one control number
   that survived triage.
2. **SkyView — Sam gave a SECOND list on 2026-09-04 (ten items). Six shipped
   this session; four remain.**

   ⚠️ **Items 3, 4 and 9 of that list were RE-REPORTS** — he believed the NC
   rings, the zoom cap and the CR/NC toggle had shipped from his earlier list.
   They had not (he had asked for the masthead first). If he reports something
   "not showing up", check whether it was ever built before debugging it.

   **Shipped:** ④ zoom to 6000% *with the radius taper that makes it useful*
   (raising the cap alone would have made isolation worse — see the commit);
   ⑥ the legend folds away; ⑦ the detail panel starts hidden; ⑧ the top is one
   row that no longer wraps; ③ noncredit draws as a **broken ring**; ⑨ the
   **CR / NC toggle**, three positions because 73 identities have no recorded
   credit status and either bucket would be a lie.

   **STILL OPEN — his items ①, ②, ⑤, and the search grouping:**
   - ① the CCR **side-menu** link should open the **full-window** SkyView
     directly, not the embedded view. The standalone page is
     `prototype/skyview.html`; today `unified_courses.js:203` offers it as
     "Open it in its own tab ↗" from inside the tab.
   - ② add a **CCR table view** link to the three in `#u-top`'s nav
     (`All disciplines` · `Subjects as a list` · `ESL packaging`) and **clarify
     those labels** — he finds them unclear. The views available are
     `__ccrForest`, `__ccrSubjectList`, `__ccrEsl`, `__ccrDiscipline`.
   - ⑤ **labels should show which circle they belong to** — "Now I need to click
     on the course circle to see which is which." Leader lines exist (#1460);
     this is about making the tie visible at a glance.
   - **keyword search: keep CR courses together, separated from NC** (from his
     first list). The payload now carries `c`, so this is no longer blocked.
   - Also still open from the first list: a **mute non-essential labels**
     toggle, and a **resizable / pop-out** detail panel (⑦ only hid it).
3. **Config to tables** — Sam approved *"your best recommendations on moving
   config values to table-based in Admin or where they belong"*: the `ORGS` list
   in `cobi_orgs.js` and the alpha-banner copy. `public.cobi_nav` is the
   precedent; the `sierra_guidance` row `cb226a48` is the precedent for copy.
4. **Strip line numbers from `kb/dependency_map.json`'s compared artifact.** It
   went stale this run on nothing but line numbers shifting by three. Rule 2
   already says line numbers rot. Sibling branch.
5. Optionally: teach `stop-hook-git-check.sh` to skip when `@{u}` names a remote
   branch that no longer exists — it false-positived twice this session on a
   correct state, which trains people to ignore the hook.

## Patterns that earned their place

- **Measure the painted page.** jsdom returns zeroes for every rectangle; 299
  green test files coexisted with a visibly broken header.
- **Composite the glass** before quoting a contrast figure (6.74 → 6.58).
- **Open the panes** before auditing — most COBI text lives in popovers.
- **Cluster failures by value, not by file.** 4,827 renders → 32 source lines.
- **Check the corpus before authoring a KB note.** A note drafted this run was a
  near-duplicate of one written the same morning; it became an update instead.
- **Verify the stop-hook nag** rather than pushing: `git log @{u}..HEAD`.

## Safety to honor

Rule 4 (both HTMLs byte-identical) · Rule 1 (change the generator, not the
HTML) · Rule 5 (never force-push `main`) · never auto-remediate accessibility to
`main` — picking a replacement color is a design decision, and Rule 6 warns
about a second scheduler racing the cron.
