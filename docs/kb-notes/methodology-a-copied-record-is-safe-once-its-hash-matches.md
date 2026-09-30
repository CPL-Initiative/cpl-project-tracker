---
title: A copied record is safe once its hash matches the source
created: 2026-09-30
updated: 2026-09-30
tags: [methodology, supabase, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-saved-setting-is-not-the-effective-value]]"
artifacts:
  - scripts/funding_effective.js
  - prototype/funding_video/build.py
---

# A copied record is safe once its hash matches the source

> **When a session must carry a stored record across a boundary by hand, it compares the copy's hash with the source's own hash before anything reads the copy; a match proves the copy byte for byte, and a mismatch stops the work.**

## Context

The sandbox cannot reach `*.supabase.co`, so a figure the model computes from the live
funding config needs the config on disk, and the only route is a read through the Supabase
MCP tool that the session writes out. `scripts/funding_effective.js` warns against exactly
this: *"Never hand-transcribe it; that is the bug this script exists to prevent."* The warning
is right about the risk; the hash removes it.

## The claim

Ask Postgres for the hash of the exact text you will copy, and hash the file you wrote:

```sql
select md5((config->'projects'->'cpl-implementation'->'scenarios'->'Scenario 2')::text),
       (config->'projects'->'cpl-implementation'->'scenarios'->'Scenario 2')::text
from cpl_funding_config where id = 'default';
```

```bash
md5sum s2_block.txt   # must equal the md5 above
```

`jsonb::text` is Postgres's canonical rendering (its own key order, `", "` and `": "`
separators), so the file must hold that text as returned, with no reformatting. Parse the
file only after the hashes agree. A match proves the copy is the stored text; a mismatch means
a character slipped, and the copy is thrown away rather than repaired.

Copy the smallest block that answers the question (one scenario here, 11.6 KB of a 23 KB row)
and rebuild the wrapper around it in code, so there is less to copy and nothing to reshape by
hand.

## How we got here

S305 (2026-09-30) needed Sample College's Scenario 2 figures for the narrated video. The copied
block matched (`fe29122e…`), and `T._alloc('Chaffey')` gave an Access target of 67.17 FTES
behind $170,430.69. The Scenario 2 introduction, typed on 2026-09-25, showed 67.1: a figure
scaled from another scenario's rounded one, which a model read would have caught. Story:
[`cpl_funding_lessons`](../cpl_funding_lessons.md) S305.

## When this applies (and when it doesn't)

It applies to any record a session copies between systems it cannot connect directly:
a config row, a plan's before-values, a JSON dump passed through chat. It proves the copy, not
the meaning: a stored dial can still be inert
([`methodology-a-saved-setting-is-not-the-effective-value`](methodology-a-saved-setting-is-not-the-effective-value.md)),
so read what the model computes from the copy, never the dial itself. Where a direct read
exists (a workflow holding the service key), use it instead.

## See also

- [`methodology-a-saved-setting-is-not-the-effective-value`](methodology-a-saved-setting-is-not-the-effective-value.md)
- `scripts/funding_effective.js` (the effective dials from a config file)
