---
title: Library — side-lane handoff (SkyHandspring, beside the CPL Queue routine)
date: 2026-11-06
tags: [handoff, library, ell-iet, cpl-opportunity, cpl-pathways, side-lane]
related:
  - "[[docs/reference/lanes/library]]"
  - "[[docs/reference/lanes/my-college-action-page]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff. It does **not** replace the numbered `session_<N>_handoff.md`: handoff 587 names SkyWhirlpool for
> the main queue, and this file stays out of its way. Light Rule 9 checkpoint (2026-11-06, ~02:40Z): no §11 row moved,
> no re-mint, no Rule 10 data receipt. Skipped: `kb/README.md`, `README.md`, the lessons doc, KB notes, the pipeline
> view, the four other status files and the decision sheet rebuild (no card changed).

Your moniker is **SkyBackflip**. You pick up after SkyHandspring (2026-11-06), on two lanes: the **Library**
([`library`](reference/lanes/library.md), *Next*) and the college visual inside
[`my-college-action-page`](reference/lanes/my-college-action-page.md) (its first ✅ entry and *NEXT*).

## What shipped
- **ELL IET Version 5** (#2828; vault #680): agenda item 2 and a new *Read the full overview* open
  `library/cpl-initiative-overview/`; the page takes the public library's look through `make_tabs.py`'s `library_look`
  (no foot band: Sierra reads 33,996 of her 34,000).
- **Public Library cards date the newest version** (#2828): `cpl_library_public()` returns `revised_on` and
  `version_label`, applied live through the MCP (`kb/migrations/2026-11-06_library_public_revised_on.sql`, rollback
  beside it); ELL IET reads *November 5, 2026 · Version 5* in small gray print.
- **CPL Pathways takes the new look** (Sam's call, #2829): `CLAUDE.md`'s presentation rule now names it.
- **The CPL Opportunity visual in the Commons format** (#2830, merging on green `test`): five figure cards over one
  course list, a side panel per course, Request Adopt on each Could adopt row, a Programs view, an address that carries
  the view. Mockup https://claude.ai/artifact/ESN3ZD6pk64ARJtj4kfty7 (Fable advised; Sam: *"Looks good on my phone"*).

## Decisions Sam made this run
- *"date for ver 5 not updating"* and *"probs should have ver5 in small gray print next to the date"*: built.
- *"ver 5 visual should be in the new format as well"*: built.
- *"1,2 Yes"*: the Cerritos mockup, and CPL Pathways in the new look.
- *"port it to the generator"*, after asking for Request Adopt links: built.
- *"i think we set up auth in supabase so you don't have to ping me for approvals"*: the MCP applied without a prompt.

## Open work, in order
1. **CPL Pathways in the new format** (his call 2): the picker becomes figure cards (My College's figures) over a List
   of the college's programs (`commons_list.js`, read-only spec); a row opens its pathway full width at its address with
   a way back; the ladder keeps its sourced lines and its *To confirm* labels. Mock it on the canvas first, then port.
2. **A rendered a11y target for the visual:** `cpl-opportunity` in `a11y.config.js` measures only the empty picker. A
   seeded target with `?college=` would load ~45 MB; axe on the rendered Cerritos page passed by hand this run.
3. **Tidy the ELL IET record:** `versions` still marks Versions 3 and 4 *Current*. A guarded update with a receipt.
4. The Library lane's standing *Next* (Coordinator Guide Pages copy, IACA, the Microsoft 365 connector; *Replace now*
   is Sam's call).

## Patterns that worked
- Read the model before drawing the view: the build was already per course, which settled the list's grain.
- Fable as an unanchored second read (code and measurements, never the conclusion) caught the look ruling we needed.
- A screen-reader span needs `position: relative` on its link, or it widens the page from inside a scrolling table.

## Let go
PR #2830 is watched until it merges (then the subscription ends by itself); #2828, #2829 and vault #680 merged. No
check-ins remain. The artifact watch on the mockup canvas ends with the session.

> *Greetings, you are SkyBackflip, a Library side session beside the CPL Queue routine, see SkyHandspring's handoff —
> `docs/library_handoff.md` — let's keep rolling with CPL Pathways in the new format.*
