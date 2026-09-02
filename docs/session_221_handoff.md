---
title: "Session 221 handoff — the tab is calm; the dials are still Sam's to set"
created: 2026-09-02
updated: 2026-09-02
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 221

Suggested moniker: **SkyDial** if you pick up the funding dials (open since
S218), **SkyWords** if Sam wants more of the tab's text editable or reacts to
the calm pass. Predecessors: SkyMeld S218 → SkyTrim S219 → **SkyCalm S220**.

## What S220 did

One PR on the Implementation Funding tab, driven by Sam's brief — *"get rid
of any cheesy glyphs (per our rules) and preserve all needed functionality
while eliminating any visual noise possible. I want folks to feel calm when
they open this model"* — plus two asks he added mid-turn.

**Glyphs → words, on every rendered surface.** The section chevron is a
Show / Hide word at the right of each heading; the row caret is gone and the
institution's NAME is the toggle button; every control is a word (Add
project · New scenario · Remove · Hide · Restore: … · Hide from public ·
Download as Excel · Columns · Regenerate · Copy text · Save as PDF · Download
as Word); the $50K view's outcome marks are words (met / partial / not yet /
n/a / pending). The one glyph kept is the sort mark, ghosted and aria-hidden
beside `aria-sort`.

**Calmer chrome.** No fill or stripe on the project strip or the sign-in
line; Reset an outlined word, Publish the one filled control; the Draft chip
an outlined word; the explainer link a plain link; colored left borders off;
the balanced Summary in ink. The static subtitle under the title (it said
"pools") is gone from BOTH HTMLs.

**Editable prose in curate mode** (his ask, verbatim: *"It would be nice to be
able to edit while in curate, any of the text sections"*). Five blocks — the
introduction, Reading the funding, the eligibility introduction, the earning
rules for noncredit, the institution table introduction — render from one
registry (`TEXT_BLOCKS`): a house default plus an override stored as plain
text under `text.<key>` in the config layers (SCENARIO ?? SHARED ?? default).
A signed-in reviewer sees Edit; then Save · Cancel · Restore the default
text. Escaped on render, draft kept across a re-render, public mode swept.

**The held-in-reserve figure** reads inside the gate sentence as a part of
the max award, held not lost, and again in the priority caption ahead of
Total Possible — never as its own item under the NC column (Sam: *"isn't
clear when compared to 400k available … put it before the $400k CR total and
not on the NC total"*).

## Sam's decisions this run (record, don't re-derive)

1. **Calm is the brief for this tab.** His words above. Every visual has to
   prove its worth; the glyph rule is strict.
2. **The reserve figure sits with the CR figure it belongs to**, not on the
   NC total. Shipped as placement + wording; the letter-list in the lane's
   NEEDS SAM ③ asks him to confirm the rest of the calls.
3. **Text sections are editable in curate.** Shipped for five blocks; he has
   not yet said whether he wants more (lane NEXT ④).
4. He asked, and the code confirms: **Publish reaches the explainer** on its
   next load (same engine, same shared config). Signed-in edits save shared
   immediately; Publish is only for edits made before signing in.

## ⭐ THE THING WORTH CARRYING FORWARD

**The text a reader sees is not the text a test reads.** `textContent` joins
adjacent elements with nothing, so `\bpool\b` missed "poolRemove"; tooltip
`title`s and `&rarr;` entities are rendered but absent from `textContent`. A
sweep must read words off the markup with a space per tag. And a mutation
that passes is first a question about the fixture — check the mutated branch
renders, then ask why the guard let it through. KB note:
`methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads`. Also:
S219's "a guard that dies cannot report" recurred in the new suite's first
draft; `clickSel()` records a missing control as a failure by name.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` — lane truth (the calm
   pass paragraph at the top of Status; NEEDS SAM ⓪–③, NEXT ⓪–④).
2. `docs/cpl_funding_lessons.md` §2026-09-02 (Session 220).
3. `kb/docs_audit/latest.json` — run `python3 kb/_docs_audit.py` fresh.

## Priority work, in order

1. **Sam's reaction to the calm pass** — lane NEEDS SAM ③ (a)–(g), reply by
   letter. Each is reversible on a word.
2. **If Sam has set the dials** (Accepted 25% / factor 1.0; starting set
   Eligible 40% · Accepted 25% · Transcribed 35% — HIS to set through the tab,
   never session SQL) — re-run the earn diagnostic and report the new spread.
3. **One request to Pedro carrying all three feed additions** — the lifecycle
   booleans (sent 2026-09-01), Origin/LocID2, and completions.
4. **More editable prose if he wants it** — one `TEXT_BLOCKS` entry and one
   `proseBlockHtml()` call per block.
5. Sam's open display call — the Annual-view earning percent can read >100%.
6. Still dead: `prototype/check_funding_explainer.js` (waits on `#f-pool`).
   Cleanup commit: dead CSS for retired row shapes.

## Patterns that worked

- **Sweep the markup, not `textContent`**, for anything a reader sees.
- **Mutation-test the guard before shipping it**, and treat a pass as a
  question about the fixture first.
- **Guard the clicks** — a control a regression removed must fail by name.
- **Screenshot the result** — `playwright` + the pre-installed Chromium
  render the tab from a local static server (route every non-localhost
  request to abort); sign in AFTER the page's own session module loads.
- **Run EVERY step of `js-tests.yml` locally before pushing.** Editing
  `cpl_funding.js` stales `kb/dependency_map.json` — rebuild it.

## Safety patterns to honor

- **Shares/factors/titles/pins/text are curator edits through the tab**,
  never SQL.
- **Never re-derive an allocation or a dial** — call `_alloc()` / `_prios()` /
  `_effective()`.
- **The sunshine rule still holds** — outward materials carry general
  principles only until CO leadership confirms.
- **Prose is not a dial**: a signed-out visitor gets no Edit control.
- `cpl_memory` rows from this session are INSERT-only under author
  `session-220-skycalm` — rollback is
  `delete from cpl_memory where author = 'session-220-skycalm'`.
