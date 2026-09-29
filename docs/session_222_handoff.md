---
title: "Session 222 handoff — the table leads, the explainer is the public view, and one page is waiting to be retired"
created: 2026-09-02
updated: 2026-09-02
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_223_handoff.md
---

# You are Session 222

Suggested moniker: **SkyOne** if Sam confirms the explainer as the one public
view and you retire the old page, **SkyDial** if he has set the dials (open
since S218). Predecessors: SkyTrim S219 → SkyCalm S220 → **SkyLead S221**.

## What S221 did

One PR (#1436) on the Implementation Funding tab and its public explainer,
from Sam's seven numbered asks. His words: move the institution table *"up just
after the intro section, so folks don't have to scroll down through the steps
to see it — most won't care about the details, just their funding"*;
*"collapse all sections on open except the intro and college table view"*;
the Summary *"into the same box as the intro text"*; every priority box *"the
narrower width as is used for the 1st 2 priorities"*; the Combined funding
line gone; and *"make sure the timing and strategies are included in the
Explainer (now public view)"*.

**The tab.** Introduction (Summary inside, a ruled-off list) → institution
table (footnote under it) → window → breakdown → formula → eligibility →
outcomes → timing. Every section closed on open except the first two, and
that is **per visit**: the per-browser fold store is retired. Priority cards
are a fixed two-column pair. The card's "Combined funding" line is retired —
it restated the band head's Total Possible, the Target line and the price
line, and the Current Total line still carries the window figure.

**The explainer.** The Every institution section sits directly after the
introduction and hosts **the tab's own college section** in a new embed mode
(`window.CPL_FUNDING_EMBED = "college"`): the same rows, drill-in, search,
grouping, columns, Excel export and editable introduction, rendered by the
same code. Its own four-column table is gone. The steps are folds closed on
open with a Show / Hide word. Step four paints the timing milestones and each
priority card its recommended strategies, from the payload (`_timing()`,
`strategies` on `_prios()`), with a dial-change guard.

**Not done, deliberately.** `cpl_funding_public.html` (the tab in public
mode) is still live. The recommendation to Sam is to make it a redirect to
`funding-model/` so one public link exists — his decision (lane NEEDS SAM ④).

## Sam's decisions this run (record, don't re-derive)

1. **The explainer is the public view**, with the college rows in it. He
   asked for a recommendation on this and treated it as decided in the same
   message ("the Explainer (now public view)"); the recommendation is yes.
2. **The table leads**, on both surfaces, right after the introduction.
3. **Closed on open except the introduction and the table.**
4. **The Summary lives in the introduction's box.**
5. **Equal-width priority boxes**, the width of the first two.
6. **No Combined funding line** on the cards; its numbers already read on
   the band head and the card.
7. **Timing and strategies on the explainer.**

## ⭐ THE THING WORTH CARRYING FORWARD

**A remembered toggle hides the default from its author.** The tab already
opened collapsed except the introduction and the table — a fresh browser
showed it — but Sam's browser had six weeks of persisted folds, so he saw a
page nobody else saw and asked for the state everyone else already had. The
fix was a smaller memory (per visit), and the guard seeds the old store and
boots, because a screenshot cannot show a stored preference. KB note:
`methodology-a-remembered-toggle-hides-the-default-from-its-author`. And the
second thing: **if a page already runs the engine, show the engine's
rendering** — the explainer's hidden mount was an embed waiting to happen,
and the second table it painted was the copy that drifted.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` — lane truth (the
   lead-with-the-table paragraph at the top of Status; NEEDS SAM ⓪–④,
   NEXT ⓪–⑥).
2. `docs/cpl_funding_lessons.md` §2026-09-02 (Session 221). ⚠️ The lessons
   doc is at ~118 KB against a 120 KB budget — the next append should first
   move its oldest sections to `cpl_funding_lessons_archive.md`.
3. `kb/docs_audit/latest.json` — run `python3 kb/_docs_audit.py` fresh.

## Priority work, in order

1. **Sam's reaction to S221's calls** — lane NEEDS SAM ④ (a)–(e), and the
   retirement of `cpl_funding_public.html` into a redirect (NEXT ⑤: the
   og:url, the ledger note's "public college page" link,
   `cpl_funding_public_private.test.js`, and the Internal · Public preview's
   label follow).
2. **His reaction to the calm pass** — NEEDS SAM ③ (a)–(g), still open.
3. **If he has set the dials** (Accepted 25% / factor 1.0; Eligible 40% ·
   Accepted 25% · Transcribed 35% — HIS to set through the tab, never SQL) —
   re-run the earn diagnostic and report the new spread.
4. **Add the explainer to `scripts/check_public_page_layout.js`** (NEXT ⑥) —
   one config block; it measures Sierra alone today.
5. **One request to Pedro carrying all three feed additions** (NEXT ⓪).
6. Still dead: `prototype/check_funding_explainer.js`. Cleanup: dead CSS for
   retired row shapes.

## Patterns that worked

- **Screenshot from a fresh browser BEFORE changing anything.** It showed the
  default Sam could not see, and turned "collapse all on open" from a layout
  change into a storage change.
- **Mutation-test every new guard, and watch HOW it fails.** Twelve caught;
  one caught by a crash rather than by name — the third recurrence of "a
  guard that dies cannot report", fixed with a `return false` before the
  dereference.
- **Reuse the renderer, never the rows.** Embed mode is ~20 lines; a third
  copy of the table would have been the next drift.
- **Run EVERY step of `js-tests.yml` locally before pushing.** Editing
  `cpl_funding.js` stales `kb/dependency_map.json` — rebuild it.
- **Playwright + the pre-installed Chromium** render both pages from a local
  static server (abort every non-localhost request); check `scrollWidth`
  against `clientWidth` at 390px.

## Safety patterns to honor

- **Shares/factors/titles/pins/text are curator edits through the tab**,
  never SQL. **Never re-derive an allocation or a dial** — call `_alloc()` /
  `_prios()` / `_effective()`; the explainer paints from `_timing()` and
  `_prios().strategies` for the same reason.
- **The sunshine rule still holds** — outward materials carry general
  principles only until CO leadership confirms; the explainer is public
  already and this run changed its layout, not what it discloses.
- **Prose is not a dial**: a signed-out visitor gets no Edit control, on the
  tab and inside the embed.
- `cpl_memory` rows from this session are INSERT-only under author
  `session-221-skylead` — rollback is
  `delete from cpl_memory where author = 'session-221-skylead'`.
