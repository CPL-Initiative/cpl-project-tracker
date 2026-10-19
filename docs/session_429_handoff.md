---
title: "Session 429 handoff: the funding side session's state (the memo as passages, the film reads the model) beside the queue's 428"
date: 2026-10-19
session: side session beside 427 (the funding job)
tags: [handoff, implementation-funding, funding-memo, funding-video, side-session]
status: current
---

# You are Session 429

Your moniker is **SkyFrame**. This handoff was written by the **side session** Sam opened beside Session 427 at
21:48Z on 2026-10-19 (*"Implementation Funding side job while 427 is grinding on PR harvest"*). It took no number of
its own; Session 427 (**SkyMadrona**, `session_01R1xmiMjfmFtqtDQp6BTG72`) holds the queue and claimed 428:
**`docs/session_428_handoff.md` is the queue's handoff**, on cpl-project-tracker#2264 until that merges. If the routine
started you, follow `docs/reference/scheduled_sessions.md` first, then read 428 for the queue; this file carries the
funding job's state, which you also own. If Sam opened you for the funding tab, this file is yours.

## Sam's words this run

- 21:48Z, five numbered asks, verbatim in `docs/cpl_funding_lessons.md` (the 2026-10-19 section): the memo and report
  generator rely on the Explainer text, the KB and other artifacts and lead with SB 135 and Ed Code 78093 rather than
  AB 123, and are editable; Refresh everything can revise the video and other text from live info; the Funding by
  Institution buttons move into the Step 1 box, to the right, with hover text; the restore-order and funding-defaults
  controls go (*"I would just create a new scenario and make any changes needed to do that"*); the Scenario selector
  beside the Project selector.
- 23:0xZ: *"Let's checkpoint this when you're ready:)"*.

## What shipped (cpl-project-tracker#2265, ready for review; CI on the merged head when this was written)

- **The memo, letter, report and brief are saved passages** (`MEMO_BLOCKS`, nineteen `memo_*` keys), edited under the
  document on the Report sub-view (*The memo's text*, signed in) and saved for everyone, the model's figures by name
  (`{to institutions}`, `{deadline}`, `{seed grant}`). **The opening follows the explainer's `x_lede` passage** (SB 135,
  Ed. Code Article 9 §§78093–78093.2, the four goals, §78093.2(d)(2)) until the memo's own is saved; Sam's own edit of
  that passage showed in the memo on the first render. AB 123 stays in the seed-grant history. The priorities, the
  strategies and the allocation table stay generated. The document stays `contenteditable` for export-only tweaks.
- **CPL Funding in Motion reads the model.** `scripts/funding_video_figures.js --config live.json --write` files every
  figure a film shows, per scenario, as `prototype/funding_video/figures.json` under the SQL md5 (`T._videoFigures()`);
  `build.py` lays it over the two introductions; the narrated cuts keep their voiced figures; `build.py --check` names
  what moved; **Refresh everything** reads the file and says whether the introduction matches the model for the
  published scenario, with the command. KB note:
  `docs/kb-notes/methodology-a-rendered-artifact-reads-the-model-through-a-filed-stamp.md`.
- **Step 2 in the Step 1 box** (All institutions · My CPL Funding, hover text per button), **the two reset controls
  retired** (the locked what-if keeps Reset exploration), **the Scenario block beside the Project block**.
- Guards: `tests/cpl_funding_step_two_view.test.js` (18), `tests/funding_video_figures.test.js` (18); five pinned
  checks rewritten. `npm run a11y` clean on the four funding views. Lane, lessons (two oldest sections archived), the
  film README, three `cpl_memory` rows (slugs ending `-2026-10-19`: `sam-funding-interface-five-asks`,
  `funding-film-figures-stale-under-scenario-3`, `funding-film-figures-pipeline`) and two pitfall rows. Vault:
  samueltlee/CPLBrain#399 (merged), the session note.

## Priority

1. **Land #2265** if it is still open: `test` green on the current head, then squash-merge (the branch policy; no
   dispatch of `daily-dashboard.yml` is needed, Pages deploys from `main`). If main moved under it, merge main in and
   regenerate the dependency map (`python3 kb/_build_dependency_map.py`), which is where its only conflicts were.
2. **The committed films still show the 2026-10-01 figures.** Under the live config (Scenario 3 published) the average
   splits $181,816 / $32,085, each target reads 4,268.6 FTES, the average Access target 31.3 FTES behind $90,908, and
   Completion counts transcribed units without the counselor step. When Sam wants them current: the README's order
   (`funding_video_figures.js --write` from a fresh dump, `build.py --check`, `build.py s2 --render`, `render.sh s2`
   with the MP4 re-versioned in `build.py` first); a narrated cut takes a new read first. Ask him before spending the
   render; he may prefer to settle the dials first.
3. **The memo's passages are Sam's to curate** on the tab (Report sub-view, *The memo's text*). The house texts keep
   ESS 25-82's structure in active voice; his expended-vs-allocated rule was applied (institutions expend, the CO
   allocates).
4. Then the queue, as 428 says.

## Patterns that worked

- Reproduce the screen before editing it: Chromium screenshots of the tab, the report view and the explainer at 1280
  and 390 (offline, the live config served through a route mock) showed the strip wrapping and the Step 1 box's shape
  before a line changed, and again after.
- Follow a passage rather than copy it: the memo's opening reads the explainer's, so one statutory statement serves
  both; an edit on either page reaches the memo on its next render.
- File the figures with the stamp a SQL read gives (jsonb's key order reproduced), so the file's hash matches the
  fixture's name and anyone can check it.

## Lessons to honor

- A jsdom guard that reads `document.body.textContent` reads the scripts it appended; read the mount.
- `cpl_funding_earn_retired` pins the student-sense sentence by its source line; a rewrap breaks it silently.
- A side session writes its state into the lane, the lessons doc, `cpl_memory` and the vault note, and takes the next
  free handoff number only when the queue session says which (427 said 429).
- The lane file sits at its 20,000-byte cap: a sentence added there takes a sentence out (the archive takes the detail).

## Let go

This side session dropped its watches at the checkpoint: the #2265 subscription stays only until the merge, the
23:45Z safety-net check-in (`trig_01YK2TgBmcDKBzyAh2VYRwoA`) is the one armed wake, and nothing else. The UI pass's
next view, `cobi:library`, was audited this run (the ledger says what it found).
