---
title: Library — side-lane handoff (SkyBackflip, beside the CPL Queue routine)
date: 2026-11-06
tags: [handoff, library, cpl-pathways, my-college, side-lane]
related:
  - "[[docs/reference/lanes/library]]"
  - "[[docs/reference/lanes/my-college-action-page]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff. It does **not** replace the numbered `session_<N>_handoff.md`: handoff 587 names SkyWhirlpool for
> the main queue, and this file stays out of its way. Light Rule 9 checkpoint (2026-11-06, ~05:30Z): no §11 row moved,
> no re-mint; one Rule 10 receipt (below). Skipped: `kb/README.md`, `README.md`, the lessons doc, KB notes, the pipeline
> view, the four other status files and the decision sheet rebuild (no card changed).

Your moniker is **SkyAerial**. You pick up after SkyBackflip (2026-11-06), on two lanes: the **Library**
([`library`](reference/lanes/library.md), *Next*) and the college pages inside
[`my-college-action-page`](reference/lanes/my-college-action-page.md).

## What shipped
- **CPL Pathways in the new format** (#2831, merged on green `test`): the College select comes first and the tab asks
  for a college until one is chosen; a college shows five figure cards (Pathways, Carry CPL here, Could adopt, For
  consideration, Confirmed; each sets the List's filter), the program-data line, one read-only List of its pathways on
  `commons_list.js`, and the My College fold. A title opens the pathway full width; *Back to <college>'s pathways*
  returns to the List as left. The Pathway select, its search box and Clear are retired. `commons_list.js` gained
  `open(r)`; the tab joined `commons_look.js`. Mockup https://claude.ai/artifact/R3knxBm8aG9D3FMryD377y (Cerritos, real rows).
- **The ELL IET record's versions** (applied through the MCP, receipt
  `kb/receipts/cpl_library_skybackflip_ell_versions_tidy_2026-11-06.sql`, rollback inside): Versions 3 and 4 read
  *Replaced by v4* and *Replaced by v5*; Version 5 stays *Current*.

## Decisions Sam made this run
- *"Require college first"*: no All colleges, no statewide search.
- *"Yes to all"*, on call 1 and the two differences from the mockup: the fourth card counts programs *For consideration*
  (My College's figure left the cards), and the college picker stays at the top while a pathway is open.

## Open work, in order
1. **Sam's eyes on CPL Pathways in a browser** once Pages has deployed #2831 (Cerritos, then a college with no catalog
   records, such as Santiago Canyon).
2. **A rendered a11y target for the CPL Opportunity visual:** `cpl-opportunity` in `a11y.config.js` measures only the
   empty picker. A seeded target with `?college=` would load ~45 MB; axe on the rendered Cerritos page passed by hand.
3. **Sierra Training's *Try it in: My College*** still targets the hidden My College tab (lane, *combined tab* entry).
4. The Library lane's standing *Next* (Coordinator Guide Pages copy, IACA, the Microsoft 365 connector; *Replace now*
   is Sam's call).

## Patterns that worked
- A routed screenshot: Playwright's `page.route` served Supabase rows read through the MCP, so a local page painted
  real figures where the sandbox cannot reach `*.supabase.co`.
- One shared driver for a tab's tests (`tests/cpl_pathways_drive.js`): when the way in changes, the tests change in one
  place and keep guarding what lies behind it.
- The statewide index stays light; per-college figures come from one read the status line already made.

## Let go
PR #2831 merged and its subscription ended; the safety-net check-in fired and is spent. No check-ins remain. The artifact
watches on both mockup canvases end with the session.

> *Greetings, you are SkyAerial, a Library side session beside the CPL Queue routine, see SkyBackflip's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*
