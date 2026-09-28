---
title: UI changes through a live mockup — lessons
date: 2026-09-28
tags: [lessons, ui, mockup, implementation-funding, sierra-training, first-light]
artifacts:
  - https://claude.ai/artifact/2V1aWwtjwob5gSM6TEkfyQ
  - https://claude.ai/artifact/Agmbu7UNGRcdEf48Sx5PTi
  - cpl_funding.js
  - sierra_training.js
related:
  - "[[methodology-mock-up-from-the-running-code]]"
  - "[[cpl_funding_lessons]]"
  - "[[session_299_handoff]]"
---

# UI changes through a live mockup — lessons

Sam asked on 2026-09-28 (S298 SkyLatch) to handle UI fixes "in a new way": talk
the changes through while a mockup updates in front of him, then code. The
College Dashboard went through seven rounds in about two hours and was locked
("It all looks beautiful!!! Let's roll with it"); the Sierra Training tab
started the same way. The method is in
[`methodology-mock-up-from-the-running-code`](kb-notes/methodology-mock-up-from-the-running-code.md);
this doc keeps what the first run taught.

## 2026-09-28 — S298 SkyLatch

**What worked.**
- **Draw the mockup with the product's own code.** Serve the repo locally, open
  the tab in Playwright, seed a reviewer session (`sessionStorage.cpl_sb`), and
  answer every `*.supabase.co` request from fixtures pulled once through the MCP
  (the funding config is 23 KB). The replica matched Sam's screenshot figure for
  figure, so every change he named was a change to real markup with real class
  names, and the port reads the mockup directly.
- **Two copies on one page, Mockup and Today**, plus a numbered change list with
  a "New this round" tag and a "Round N · updated <time>" stamp. The stamp
  settled a false alarm in minutes: Sam's window still held round 0, where the
  two copies were identical by design.
- **Each round is a script, run in order over one captured base**
  (`rebuild.sh`: round1.js … round6.py). When Sam's third answer changed the
  data (a sample attestation had to move from Alameda to Antelope Valley), a
  fresh capture flowed through all six rounds in one command.
- **A consumer map before the port.** A background Explore agent listed every
  surface that reuses the section (the public explainer embeds it; the memo,
  My College and the report generators read the model, not the table) and every
  test that pins it. That list answered Sam's "make sure everything stays wired"
  with specifics, and it became the port agent's brief.

**What bit.**
- **Page-wide `nth-child` rules leak between copies.** The Columns menu writes
  `.cplfund-table > … > td:nth-child(3){display:none}` into a `<style>` inside
  the section; on a page holding two tables it hid a column in both. Scope the
  frozen copy's rules to its own container.
- **An HTML tag inside an SVG `<title>` breaks the SVG.** A `<span>` wrapped
  around a date inside a pie slice's `<title>` makes the HTML parser break out
  of foreign content. Update SVG titles through `textContent`.
- **`display: inline-flex` with `gap` splits a text run.** "(due 11-01-2026 )"
  gained stray gaps because the date span became its own flex item. Wrap the
  words in one span.
- **The local server dies between shell calls in this container.** Start it in
  the same command as the capture and kill it after.
- **A saved per-browser setting outlives a column's meaning.** Sam's browser
  hid the old Max award column under the key `total`; a new Total Funds on the
  same key would have opened hidden for him. Bump the storage key.

**A ruling that lived only in a code comment.** Sam said on the mockup that
colleges "need to meet all 3 baselines to receive any funding". The gate's
comment block quoted his 2026-07-30 call that ONLY two conditions gate, and no
`cpl_memory` row held it, so the Rule 8 read could not have surfaced it. Putting
the comment in front of him with the consequence measured (59 of 116 colleges
held the Veteran Star) let him rule in one line: "3 conditions but the Star is a
feel-good restatement of one of them" (PR #1726).

**Tests.** The auto-mode classifier refused a local full-suite run
("Modify Shared Resources") while a port agent ran beside it; the suite runs
four ~2 GB processes. Sam chose CI on a draft PR. A narrower local run is the
same outcome by another route; ask instead.

**Next.** Land the funding port (branch `claude/funding-dashboard-ui-s298`) and
#1726 on green `test`; take the Sierra Training mockup through Sam's rounds,
then port it the same way.
