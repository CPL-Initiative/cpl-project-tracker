---
title: A rendered artifact reads the model through a filed stamp
created: 2026-10-19
updated: 2026-10-19
tags: [methodology, implementation-funding, funding-video, refresh-everything]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh]]"
artifacts:
  - scripts/funding_video_figures.js
  - prototype/funding_video/figures.json
  - prototype/funding_video/build.py
  - cpl_funding.js
  - tests/funding_video_figures.test.js
---

# A rendered artifact reads the model through a filed stamp

> **One-sentence summary** — A film, a frozen snapshot or any artifact a button cannot regenerate keeps its figures current only when it files the figures it shows, stamped with the model state they came from, so the live surface can compare, name what moved and hand over the rebuild.

## Context

CPL Funding in Motion, the 100-second introduction to the funding model, typed its figures from the engine under one config on 2026-10-01. The published scenario moved on 2026-10-15 (Scenario 3, noncredit at 15%; Completion re-pointed to transcribed units) and nothing said so: the Refresh everything splash listed the film under "Not live: figures typed in" and left the reader to go and look. Sam asked on 2026-10-19 for the refresh procedure to revise the video and other text from live information rather than hard-coded data. Story: [`docs/cpl_funding_lessons.md`](../cpl_funding_lessons.md), the 2026-10-19 section.

## The claim

A rendered artifact cannot read the model at play time, so its figures are typed; the mistake is to type them *only* into the artifact. File them beside it, from the model, under a stamp of the model state (here the config's md5, the one a SQL read gives), and three things follow:

1. **The build reads the file, never a typed number.** `build.py` lays the filed figures over the typed ones for the introductions, so a rebuild cannot carry a figure the model has moved. The typed values stay as the record of what a voiced cut speaks.
2. **A check names what moved, per artifact.** `build.py --check` compares each variant's figures with the filed ones and says, for an introduction, *rebuild and re-render*, and for a narrated cut, *the narration needs a new read*: two different acts, because a voice cannot be re-rendered.
3. **The live surface compares and hands over the command.** Refresh everything reads `figures.json`, computes the same figures from the model it just re-read, and says whether the introduction matches the model for the published scenario or which figures differ. It does not claim a render it cannot do; the command is the deliverable.

The figures come from the model's own functions (`T._videoFigures()` is the tab's `instSplit`, `sysTarget`, `earnAgg`, `participationDeadline`), never from a script that re-derives them: the lane's standing rule, *never read the config, call the model*, applied to a file.

## How we got here

The first `--check` over the 2026-10-19 live config reported the drift the splash had never seen: the average award's split moved from $198,542 / $15,359 to $181,816 / $32,085, each statewide target from 4,366.7 to 4,268.6 FTES, the average Access target from 34.5 FTES behind $99,271 to 31.3 behind $90,908, and Completion's box from "with the MAP counselor step checked" to transcribed units alone. The stamp matches the fixture's name (`cpl_funding_config_de95c290.json`) because the script reproduces how jsonb prints an object: keys sorted by length, then bytes, with `", "` and `": "`; without that the file would carry a hash nobody else could reproduce.

The memo took the same shape the same day in a different medium: its opening *follows* the explainer's Overview passage until a curator saves the memo's own, so one statutory statement serves the page and the memo instead of two copies that drift.

## When this applies (and when it doesn't)

It applies to anything handed out or rendered once: a film and its MP4, a frozen explainer snapshot, a decision sheet's figures, a docx a session built. It does not apply to a page that reads the model live (the explainer, the tab, My College), which needs no stamp. The stamp names the state the figures came from; it is no substitute for the check, because a stamp that is only displayed still asks the reader to compare by hand. Guard: `tests/funding_video_figures.test.js`.

## See also

- [`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md): the same family, for tests.
- [`prototype/funding_video/README.md`](../../prototype/funding_video/README.md), "The figures follow the model": the procedure, in order.
