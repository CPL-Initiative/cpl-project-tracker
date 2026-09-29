---
title: "Session 229 handoff — SkyView is the map alone, the CCR menu opens it, the workspace has two grains; Sam's reactions are next"
created: 2026-09-05
updated: 2026-09-05
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_234_handoff.md
---

# You are Session 229

Your moniker is **SkyGrain** (assigned by SkyQuiet at sign-off, per Sam's
2026-09-03 template): the thing you are most likely to be asked about is the
subject grain, the first SUBJ4 view a curator has ever had, and what its
"not X's code" rows turn out to be. Predecessors: SkyLand S226 → SkyMint S227 →
**SkyQuiet S228**.

## What S228 shipped

One PR, **#1479** (the Rule 9 checkpoint rides in it). Sam's three asks of 2026-09-05, all landed:

1. **The CCR menu button opens SkyView alone.** Sam: *"Make sure the CCR menu
   button opens the full screen SkyView, not the version it currently opens to.
   I've made several requests for this so far and none of them have worked."*
   Three sessions had each shipped a different mechanism (the iframe as the
   tab's landing view, `allow="fullscreen"`, a separate side-menu link) and
   none changed what the tab SHOWED. Now `body.u-solo` paints `#u-full` and
   nothing else on `prototype/skyview.html`, and COBI's Common Course Reference
   tab hides its chrome in map mode (`uc-map-on`) and sizes the frame to the
   viewport. SkyView's close and its "CCR table view" item post a message that
   swaps the frame for the list; `#unified-courses/list` opens the list directly.
2. **Items 6-9 are ONE tab, *Disciplines and subjects*** (`__ccrWorkspace`):
   By discipline · **By subject (the SUBJ4 grain)** · ESL packaging, a line
   explaining the grains, *Back to SkyView*, one Views menu on every view
   (`viewsMenuInto`, one builder), and the hash naming each view.
3. **The comprehensive view** (the map with its panes, "the original SkyView")
   is one menu click away and never the default. It is the SAME render with the
   class off, so switching keeps the zoom, the selection and the moves.

⭐ **Sam's naming ruling is doctrine now** (`CLAUDE.md`, Naming & terminology):
"SkyView" is the map alone, filling the window; the map with panes is "the
comprehensive view"; the tables are "the workspace".

⭐ **A latent bug the harness found one click in:** the forest embedded under
the comprehensive map replaced the view without sending the borrowed search box
home, so one click on a discipline cell destroyed the page's only search field.
`setCrumbs()` is now the one choke point every view passes through.

## Read these, in this order

1. `docs/reference/lanes/skyview-ccr-interface.md` — the lane's current truth
   and its NEXT list.
2. `docs/ccr_atlas_lessons.md`, the last section — the three attempts, solo as
   a class, the one menu builder, the subject grain, the choke point.
3. `docs/kb-notes/methodology-verify-an-ask-against-what-the-reader-sees.md`.
4. `prototype/ccr_universe.js` from `/* ══ the views, one menu for all of them`
   to the end — the routes, the workspace and the subject index live there.

## Your priority: Sam's reactions

He has not yet driven any of the three. Expect his notes to arrive as a
numbered list, as they did on 2026-09-04, and expect them to be about the
workspace's tables first. Things already known to be rough:

- The **standing column** on By subject is derived, not curated: *the Common
  SUBJ of X* / *an umbrella code under X* / *not X's code (its Common SUBJ is
  Y)*. A "not X's code" row is either a stray the prefix fold missed or an
  umbrella the seed does not know about. If he wants it as a worklist, the
  lane's fold-verify (`re_key`) is the planner of record, not a new one.
- **Decisions** on By discipline appears on 5 of 159 rows (the decision packs
  exist for five disciplines). Building packs per discipline, fetched on
  demand, is the lane's NEXT ①.
- In COBI the frame ends exactly at the window's bottom at scroll 0; the page
  can still scroll by the header's height because the rail's `min-height` is
  `100vh`. If he wants the header gone too, that is a `position:fixed` overlay
  and a keyboard-order question, not a sizing tweak.

## Carryover, with status

- **BLOCKED on Sam: the absence color** (`--text-quiet` at `#6B6B66` versus
  plain `--text-muted`); ~4,000 renders wait on it. In the To-Do feed.
- **The a11y backlog**, unchanged from S227: 5 COBI tabs scroll sideways at
  390px (Dashboard by 887px), 18 tabs carry 86 sub-AA pairs, 4,042 sub-24px
  targets are 54 selectors. **New this run:** First Light's greeting opt-out
  checkbox (`first_light.js`, `.cplfl-optout input` at 15px) is the CCR tab's
  only finding, and it is chrome on every tab. Start with the sideways scroll.
- **Queued, unstarted:** config-to-tables (`ORGS` in `cobi_orgs.js`, the
  alpha-banner copy); the live-session banner; the identities-map sheet for Sam
  (`kb/identities_rekey_out/2026-09-04/`); the three HOSP anchors' discipline.

## Patterns that worked

- **Diff what the reader sees.** Screenshots of the three surfaces (the map
  alone, the workspace, the COBI tab) were what proved the asks landed. Three
  earlier sessions verified mechanisms instead and each shipped a miss.
- **Run the instrument on the new default.** The solo view had no heading at
  all until `npm run a11y -- skyview` said so; the harness found the search
  box dying the first time it walked the comprehensive view.
- **One choke point beats N wrappers.** Every view calls `setCrumbs()` before
  it renders; that is where the search box goes home and the current view is
  named.

## Safety patterns to honor

- ⚠️ **The harness needs the shards.** `prototype/ccr_desc/` is gitignored; on
  a fresh clone run `python3 kb/_build_ccr_universe.py --shards-only` (24 s,
  50 MB) before `node prototype/check_ccr_atlas.js`, or the shard check fails
  for a reason that is not the page's.
- ⚠️ **"Subject" means SUBJ4 everywhere rendered now.** An island is a
  discipline; the hints say "Discipline". `kind:"subject"` stays the internal
  key. The universe test pins the words.
- ⚠️ **Rebuild `prototype/skyview.html` after editing any prototype source**
  (`python3 prototype/build_ccr_atlas.py`); it is the committed, served page.
- ⚠️ **Regenerate the dependency map AFTER `git add`** (it enumerates with
  `git ls-files`); it went stale this run on line numbers alone.
- ⚠️ **`docs/INDEX.md` and `docs/catalog/` are GENERATED**: run
  `python3 kb/_build_docs_index.py`.
- ⚠️ **Never background `npm run test:floor`.** `npm test` itself is fine in
  the background (about 20 minutes here; 300 files).
- ⚠️ **`package-lock.json` is gitignored**; both deps stay pinned exactly.
- ⚠️ **Three sources report your context; only `python3 kb/_context_budget.py`
  is the instrument** (S227's finding stands).

## Next concrete step

Open the Common Course Reference from the side menu, confirm SkyView fills the
window with nothing else painted, open the Views menu, and walk the workspace
on both grains before Sam does. Then wait for his numbered list.
