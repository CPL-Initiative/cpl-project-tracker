---
title: Rebuild a jsonb value from its receipts and check its md5
created: 2026-10-02
updated: 2026-10-10
tags: [methodology, supabase, implementation-funding, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - scripts/pg_jsonb_md5.py
  - scripts/funding_effective.js
  - tests/fixtures/cpl_funding_config_e21658f9.json
  - kb/funding_config_edits_out/
---

# Rebuild a jsonb value from its receipts and check its md5

> **A large jsonb value the sandbox cannot fetch can be rebuilt from a committed snapshot plus the committed edit receipts, and proven identical to the live value by one hash: Postgres's `md5(col::text)` against the same serialization computed locally.**

## Context

The sandbox cannot reach `*.supabase.co`, so the funding model's live config (23,606 characters) arrives only as MCP output. `scripts/funding_effective.js` forbids hand-transcribing it into a file, because a transcription error looks exactly like a real config. Every write to that config already goes through a committed plan with before- and after-values (`kb/funding_config_edits_out/<date>/`), and a committed fixture records the value at a known md5.

## The claim

Apply the committed plans, in order, to the committed fixture, checking each edit's `before` against the value it replaces. Serialize the result the way `jsonb` prints itself and hash it. If the hash equals `select md5(config::text) from cpl_funding_config where id='default'`, the local file is the live value, byte for byte, and any model run over it measures what is live.

`jsonb::text` prints:

- object keys **shortest first, then bytewise**, because that is jsonb's storage order, not the order written
- `", "` between items and `": "` after each key
- non-ASCII characters as themselves, not `\u` escapes
- numbers as stored (`0.5`, `12620154`)

`scripts/pg_jsonb_md5.py <file>` prints that hash.

## Many rows: one combined hash (2026-10-10)

The same serialization proves a many-row write without a many-row query. Hash each row's `md5(col::text)`, join the key and hash per row in byte order, and hash the whole: `md5(string_agg(k||'|'||md5(col::text), ',' order by k collate "C"))`. Build the same string locally from the committed values. S356 checked 605 program displays this way in one row of output; see [[methodology-a-receipt-too-large-for-the-connector-applies-from-the-runner]].

## How we got here

S316 needed the statewide target under the live config (md5 `764fd264`) to build Sam's sheet 19 "sum" ruling. The newest fixture was `e21658f9`. The helper first reproduced `e21658f9` from the fixture itself, which confirmed the serialization. Plan `2026-10-02` (the confirmation deadline) produced `7e59830b` and plan `2026-10-02-2` (the Introduction's wording) produced `764fd264`, each the md5 its receipt recorded and the second the live one. The model then ran over the rebuilt file and returned S315's figures unchanged (4,366.66 summed, 4,467.60 divided), which showed that only text had moved since the fixture.

## When this applies (and when it doesn't)

- It applies to any jsonb column whose every write left a receipt with before- and after-values, starting from a snapshot at a known md5.
- A write outside the receipts, such as a curator saving on the tab, breaks the chain, and the hash then fails to match. A mismatch therefore says "something unrecorded moved"; it never says which part. Dump the value at that point.
- A `json` column (not `jsonb`) keeps the text as written, so this serialization does not apply to it.
- Numbers Python prints differently from Postgres (exponents, trailing zeros such as `1.50`) would break the match. The funding config holds none.

## See also

- `[[cpl_funding_lessons]]`: S316 section
- `scripts/funding_effective.js`: what the model is actually using, run over the rebuilt file
- PR #1821: the build the measurement fed
