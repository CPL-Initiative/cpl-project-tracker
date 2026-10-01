---
title: Session 313 handoff — the video round, the progress lines on the explainer, and Sierra's CCSF answer
date: 2026-10-01
session: 312 (SkyLantern)
tags: [handoff, implementation-funding, funding-video, sierra, partner-crosswalks, decision-sheet]
status: current
---

# You are Session 313

Your moniker is **SkyReel**. S312 ran one full checkpoint (this file) at the context warning line
(104K left). Every Rule 9 artifact is current except the Pipeline tab (the pipeline did not move) and
`README.md` / `kb/README.md` (no generator changed).

## First, in this order

1. **#1807 (the "model" sweep, ported) and this checkpoint ride one PR.** If it is not merged, merge it on
   a green `test` (squash). Sam starts this session when it lands.
2. **Read sheet 15's `replies`** (https://claude.ai/artifact/XMchMpSnVLQoisWjmc6t2k): the Microsoft title
   and the AWS fold (his to type), cards 23-24 of the sweep ("apply" means you write them through
   `funding-config-edit-apply.yml`, dry run first, both scenarios), and **which confirmation deadline is
   right**: the Timeline says Dec 30, 2026; `participationDeadline` says 2026-11-01.
3. **The video round** (Sam, 2026-10-01 evening, verbatim in the S312 chat). In
   `prototype/funding_video/` (`build.py` CONFIG + `funding_in_motion.src.html`), then re-render both
   introductions (`render.sh`, about 5 minutes each; re-version the MP4 names; update the explainer's two
   links and `tests/funding_video_page.test.js`):
   - **Timing scene:** the dates come from the config (Scenario 2): Oct 2026 for the procedure and the
     guidance memo where it reads "Sep 2026 Model released"; the confirmation date per his sheet 15 answer.
   - **Priorities scene:** the statewide funding under each box: Access $12,620,154, Completion
     $12,620,154; the reported box shows $9,759,692 statewide (S312's proposal; he may prefer $8,959,692).
   - **Targets scene:** the kick leads with the priority: "Priority 1 · Access · average allocation ·
     target 34.5 FTES · $99,271".
   - **Closing scene:** a plain label ("How CPL Funding Works") linked to the real address in the web
     player; no github.io address and no "Scenario 2" in the film, the page chrome or the explainer's video
     link (Scenario 2 is the published one). An MP4 cannot carry a link.
   - **A new slide on how the targets are set:** statewide, Access $12,620,154 ÷ $2,824.82 per FTES (the
     $5,649.63 rate × factor 0.5) = 4,467.6 FTES; Completion the same. Read every figure from the engine
     over an md5-checked config (`T._alloc()`, `T._prios()`), never typed from a screenshot.
   - **Access counts every applied unit now** (Sam: "P1 no longer requires CPL requests to originate from
     landing page, portal, or batch upload"): fix `ACCESS` and both `prioText`s in `build.py`, and the
     tab's FAQ default (`FAQ_DEFAULT_PLAIN`, "the Access priority counts public CPL requests ... that arrive
     through ..."). The tab's own Access measure text is Sam's saved text (card 11, still "originating
     from ..."): his to type.
   - **Card 25 of the sweep:** "A 90-second introduction to CPL funding for colleges"; link label "How CPL
     funding works"; closing heading "Find your college on the CPL funding page". Keep the narrated drafts
     frame-identical through config (`SAMPLE`, `SPLIT_THREE`, a `close` entry) until they are re-voiced.
     S312 built and then reverted that change for lack of room; redo it.
   - **ElevenLabs (American English, female):** the next step is Sam's rewritten Scenario 2 script (sheet 6
     card 1). With it: `creative_list_voices`, pick one and say which, voice each scene, and feed the audio
     to `narrate.py`'s layout and `cues.py --listen` in place of Kokoro. Draft a script if he asks for one.
4. **Card 6, "port":** bring the Public view's statewide progress lines to the explainer: each priority's
   target, rate and progress, and the count under each minimum condition. Lane NEXT ⓪g.
5. **Sierra, sheet 14 card 1 "wrong":** on v76 she said she has no City College of San Francisco split and
   gave the statewide one (`cpl_memory` `sierra-ccsf-split-wrong-v76-2026-10-01`). The rows exist
   (college_id 30). Find why, fix, deploy, one smoke, ask again. Also **smoke 7c failed on v76**: her first
   LVN course came at character 556 (the check allows 400) (`smoke-7c-course-past-400-on-v76-2026-10-01`).
6. **CER:** Sam typed both renames (21:17Z). Dispatch `cred-rename-apply.yml` once the daily dry run lists
   them clean, then tell him the AWS Confirm merge is ready.

## What shipped

- **#1806:** the explainer in the Fact Sheet's layout (sticky bar, Contents that opens each section, every
  section a fold, Ask Sierra through `fact-sheet/factsheet_sierra.js`, the tab's FAQ via
  `T.publicFaqHtml()`), one statewide box, the Average with its split (`avgCr`/`avgNc`), the introductions
  with the average allocation (MP4 v3 / Scenario 2 v4); sheet 14.
- **#1807:** the "model" sweep for the explainer and the tab (cards 1-22, 26; 27 kept), with this checkpoint.

## Sam's rulings this run

- The explainer is the colleges' main view; the Public view's progress comes to it (sheet 14 card 6).
- Sheet 14, all six his own call (`cpl_memory` `sam-sheet14-rulings-2026-10-01`).

## Safety patterns

- ⚠️ **Never define `--seal-blue`, `--on-accent` or `--surface` on the explainer's `:root`**: the embedded
  tab reads them (`explainer-root-token-reaches-embedded-table-2026-10-01`).
- ⚠️ **Check a video heading on `build.py <v> --render`** before rendering: the preview font is narrower.
- ⚠️ **`pkill -f` with a pattern your own command contains kills your shell** (exit 144): bracket a letter.
- ⚠️ Budgets at the edge: `CLAUDE.md` 59,975 / 60,000; lanes `implementation-funding` 19,984,
  `sierra-retrieval-corpus` 19,976, `partner-crosswalks` 19,876 of 20,000.
