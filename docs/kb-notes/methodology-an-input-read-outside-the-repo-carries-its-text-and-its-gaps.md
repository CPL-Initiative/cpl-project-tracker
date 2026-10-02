---
title: An input read outside the repo carries its text, and its gaps
created: 2026-10-02
updated: 2026-10-02
tags: [methodology, funding-video, elevenlabs]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - prototype/funding_video/narrate.py
  - prototype/funding_video/narration_s2.json
  - prototype/funding_video/voice_s2/
---

# An input read outside the repo carries its text, and its gaps

> **When a service outside the repo produces an input, such as a voice clip, commit the input with the SHA-1 of the text it was made from, and give a missing one a named, tested `pending` state, so the build refuses stale input and still ships around a gap.**

## Context

Scenario 2's narrated film (S317, 2026-10-02) is voiced by ElevenLabs through a connector. Nothing in the repo can synthesize the clips, so the clips are committed. After ten of eleven reads, ElevenLabs disabled the account's free tier ("unusual activity... a proxy or VPN"). Ten parallel calls from a cloud container had tripped its abuse check. Lessons: [`cpl_funding_lessons`](../cpl_funding_lessons.md), S317.

## The claim

1. **Tie each produced input to its source text.** Each scene records `read.clip`, its generation id and `read.text_sha1`. The layout step refuses a clip whose scene text no longer hashes to that value. An edited sentence fails the build until it is read again; without the hash it would be read stale.
2. **A gap is a state with a reason, never a hole.** A scene the service refused carries `pending: "<the service's own words>"`. The pipeline plays its picture at the film's own pace and pins none of its cues, and the music does not dip under a voice that is absent. A test requires the reason, so the gap cannot be forgotten, and it closes in one edit: replace `pending` with `read`.
3. **Send a service's batch serially from a shared egress.** The refusal came after a burst through a proxy. One call at a time, with the result checked before the next, costs minutes and keeps the account standing.

## How to apply it

Before calling an outside generator, decide where its output is committed and what text it must match. Write the hash beside it, and write the `pending` state before you need it.
