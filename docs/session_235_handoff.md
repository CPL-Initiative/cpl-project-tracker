---
title: "Session 235 handoff — the outline is STILL unbuilt, and now it has a ruling"
created: 2026-09-06
updated: 2026-09-06
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_237_handoff.md
---

# You are Session 235

Your moniker is **SkyOutline II**. Predecessors: SkyOutline S232 → SkyBuild S233
→ **S234** (this run, which never claimed the SkyGrain name it was given).

⚠️ **READ THIS FIRST: S234's handoff was written and never consumed.** Sam did
not run a session against it — he ran this one instead, on a video. So
`session_234_handoff.md`'s priority is **still open, still first**, and its
warnings have not been paid. Everything load-bearing from it is carried below;
read that file too if you want the full round-by-round detail.

## Your priority: BUILD THE COURSE OUTLINE

**Planned three times now, cleared three times, built zero times.** Nothing
blocks the bulk of it. Sam's design is settled and binding:

- A synthetic description may show **"as long as it is clearly labeled
  MAP-Generated for faculty consideration and revision before use"** — his words,
  used verbatim on the page.
- **Layered from the start**; MAP exhibits and military CRs are the next layers.
- Reviewers **edit titles and re-subject**; re-mint only when verified **and**
  admin-released.
- Thin skills are **included with a confidence chip**, not dropped.
- **A proficiency level on the course AND on each skill** — two axes, carry both,
  derive neither. ⚠️ `courseLevel()` and the Beg/Int/Adv ladder exist in
  `prototype/ccr_universe.js`; reuse them rather than re-deriving.
- ⚠️ **Double-click is taken** (it opens the discipline work surface). Split it:
  a course opens the outline, empty island ground keeps today's behavior.

⭐ **NEW — Sam ruled double-click on 2026-09-06**: *"Double click should open the
course outline of record work surface we prototyped last session — not sure if we
ever put it into production."* It was never put into production. His ruling
**confirms** the split above rather than changing it.

⚠️ **We hold 57 published welding credit recommendations and ZERO skill
statements.** Everything else is buildable from data we already have.

## Sam's three rulings this run (2026-09-06) — execute these

1. **Enter closes the search panel.** ⚠️ This **reverses ruling 6 of the same
   morning** ("Enter runs the search AND leaves the list up"), and he flagged the
   reversal himself: *"I really think it should close this, even though we made a
   prior decision on that."* With it: **move the sort chip to the list's top
   right**, and **put an Enter button where the sort button is now**. Keyboard
   Enter and the button must both work.
2. **Double-click opens the course outline** (above).
3. **Reserve the chip row's space** — *"stability wins."* He also asked whether
   chip padding can shrink: ⚠️ **contrast is not the constraint, target size is.**
   `.u-tok-x` is 24×24 and `.u-tok-go` is `min-height:24px` — both exactly on the
   WCAG 2.2 SC 2.5.8 AA floor. Only horizontal padding, the 5px gap and
   `max-width:150px` are free. Tightening postpones the wrap; only the reserved
   row removes it.

## What this run measured — and it corrects a shipped fix's scope

Sam recorded 6m50s driving SkyView. The new **`video-context` skill**
(`kb/_video_context.py`, PRs #1498-#1500) processed it entirely on his machine.
Triage: [`skyview_video2_findings`](skyview_video2_findings.md).

⭐ **The dropdown drops 36px — one row height — when the chip row wraps at pick
4.** Picks 1-3 are rock solid; ruling 3's `scrollTop` fix holds exactly as
designed. The complaint had a **second axis**: the scroll offset is preserved,
the list's *position on screen* is not. `.u-tokens{display:contents}` makes each
chip a flex child of `#u-bar`. ⚠️ **Guard by VALUE** — assert `#sug`'s
`getBoundingClientRect().top` across enough picks to force the wrap (four at
1440px), never "the bar has one row".

⭐ **Double-click strands because the hash never changes.** `discipline()` paints
over SkyView and never calls `syncHash()`, so Back, `hashchange`, the Views menu
and refresh all break together, and the return rebuilds the canvas. ⚠️ **Not a
second page** — the masthead's stale "prototype v1" (`skyview.html:714`) is what
makes a view swap read as an old prototype. Drop it.

⚠️ **Sam RETRACTED a finding on camera.** Thirty seconds on the hover returning
the identity card, then *"my bad, forget everything I said there, it's not a
problem."* That passage is **S233's hover fix working**. Do not act on the first
half. **When a recording is the input, read to the end before you fix anything.**

**Praised, do not break:** Fit all; the panel moving to the selection.

## Carried from S234, unpaid

⚠️ **The `cpl_memory_log` step fails silently.** The 2026-09-06 checkpoint wrote
8 rows and not one had a log entry — the log `insert ... select` is a separate
statement, so skipping it is invisible from the `cpl_memory` side and no test can
see it. **Run the playbook's one-query verification** before you report rows
written.

⚠️ **`ALIAS_MAPS` is a list of PATHS.** Call `load_maps()` before
`resolve_id(id, maps)`. Passed straight in it resolves nothing and does not
error — the tell is direct and chain agreeing EXACTLY.

⚠️ **A test that only fails under load is racing a timer the product owns.**
`ccr_skyview_search_show.test.js` went red on CI while passing 116/116
standalone; running it 24× **concurrently** reproduced it in one command. The
page closes the suggestion list 120ms after blur and `tick()` is one macrotask —
the product was right and the test was wrong. The CI log is not readable from a
session, so reproduce locally under contention.

**Do not re-inherit these numbers:** the stale atlas payload did NOT make the map
and the tables disagree by 43 (it cost **89 of 593 decision-pack ids resolving to
nothing**); the canvas sits **39** tab stops in, not 217; TruffleHog was already
diff-only.

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
   — compacted this run 40,693 B → 11,351 B; nothing dropped, the narrative moved
   to the lessons doc
2. [`docs/skyview_video2_findings.md`](skyview_video2_findings.md)
3. [`docs/session_234_handoff.md`](session_234_handoff.md) — never consumed
4. The two new KB notes:
   [a fix right about the complaint, wrong about the axis](kb-notes/methodology-a-fix-can-be-right-about-the-complaint-and-wrong-about-the-axis.md)
   · [a view swap that does not move the hash](kb-notes/methodology-a-view-swap-that-does-not-move-the-hash-strands-the-user.md)

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data.

## NEEDS SAM

① **Ruling 9's follow-up is the only thing blocking the outline's skill layer** —
agency skill statements come from published standards **and** ACE exhibits **and**
the MAP team ("All three"), and he asked the question himself: **how are they
reconciled when they disagree?** Pilot: an AWS welding certification.
② Should the daily run rebuild the universe layout too?
③ Grab-bag disciplines besides Vocational and the no-discipline pile.
④ The live-session banner — what link, which tabs?
⑤ Whether 60 is the right search depth; whether an emptied discipline vanishes or
ghosts.
⑥ The right-edge glyph rail from his Obsidian screenshot — glyph-only, his call
under his own glyph rule.

## Patterns that worked

- ⭐ **Measure it in a browser.** Both defects this run are invisible to jsdom,
  which returns zeroes for every rectangle. 299 green suites say nothing about
  layout. Serve the page and drive it.
- ⭐ **Read the user to the end.** The retraction arrived 13 seconds after the
  complaint it cancels.
- ⭐ **A shipped fix is not evidence the complaint is closed** — re-drive the
  workflow, not the diff.
- ⚠️ **The failure mode to watch: a Windows-facing instruction authored on
  Linux gets no check at all.** Two defaults shipped wrong (`python3` in a
  PowerShell block; `device="auto"` selecting a GPU with no CUDA runtime) past a
  mutation-tested, CI-guarded helper — because neither was in the code under test.

## Safety patterns to honor

Rule 10 at any write: fresh live read, guarded statement, a receipt that makes it
reversible. A **new write surface** routes through Governance and the privacy
ADRs *before* it ships. Artifact policy: code-only PRs where the runner
publishes. ⚠️ `npm run a11y` before shipping any view — CI does **not** run it.
⚠️ **`kb/_build_docs_index.py` is a CI check**: adding a doc without rebuilding
turned `test` red on #1501 this run, exactly as S234's handoff warned.

---

*Greetings, you are SkyOutline II (Session 235), see S234's handoff —
`docs/session_235_handoff.md` — let's keep rolling with our queue.*
