---
title: A Postgres md5 proves a transcribed jsonb copy
created: 2026-10-01
updated: 2026-10-07
tags: [methodology, supabase, verification, implementation-funding, program-requirements]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
  - "[[program_requirements_harvest_lessons]]"
artifacts:
  - tests/fixtures/cpl_funding_config_e21658f9.json
---

# A Postgres md5 proves a transcribed jsonb copy

> **When a session can read a jsonb value only through the SQL tool, it can still prove a local copy exact: re-encode the copy the way Postgres prints jsonb and compare `md5(value::text)`.**

## Context

The sandbox cannot reach `*.supabase.co`, so a session that needs a stored jsonb value as a file (the funding config, to boot the engine over it) receives it as text in a tool result and has to write it out. A transcription can drop one character and still parse. S313 needed the config to read the video's figures from the engine ([`cpl_funding_lessons`](../cpl_funding_lessons.md), S313).

## The claim

`jsonb::text` is canonical: object keys sorted by byte length, then bytewise; `", "` between items and `": "` after keys; non-ASCII characters as themselves; numbers as stored. Encode the local copy the same way and its md5 equals Postgres's exactly when every character matches:

```python
import json, hashlib
def enc(v):
    if isinstance(v, dict):
        ks = sorted(v, key=lambda k: (len(k.encode()), k.encode()))
        return '{' + ', '.join(json.dumps(k, ensure_ascii=False) + ': ' + enc(v[k]) for k in ks) + '}'
    if isinstance(v, list):
        return '[' + ', '.join(enc(x) for x in v) + ']'
    return json.dumps(v, ensure_ascii=False)
md5 = hashlib.md5(enc(json.load(open('copy.json', encoding='utf8'))).encode()).hexdigest()
```

Compare it with `select md5(config::text) from cpl_funding_config where id = 'default'`. Equal hashes prove the copy; a mismatch says to re-read before computing anything from it.

## How we got here

S313 transcribed the 23,594-character config and matched `e21658f9` on the first try; the copy is `tests/fixtures/cpl_funding_config_e21658f9.json`, and `funding_model_page.test.js` boots the explainer over it. S310 and S312 had md5-checked fixtures the same way from the other direction.

## When this applies (and when it doesn't)

It applies to any jsonb column read as text. It does not cover a `json` (not `jsonb`) column, which keeps the input's spacing and key order, or a float whose stored form Python prints differently (`1e-05` against `0.00001`): check the length first, which is cheap and catches both.

## Refreshing a dated read: a fingerprint per row, then re-read only what differs (S340)

A dated copy of a query's rows (the ROEP builder's `map_cr_by_course.json`, 178 course rows) has to be refreshed
when the harvest adds a college. Re-reading it whole means transcribing every row again. Hash instead:

1. Build one string per row from the fields the copy keeps, in a fixed order (`code:recs:exhibits:untitled:` and
   each title as `title/source/recs`, in the read's own order), and take its md5 both in SQL (`string_agg ... order by
   code collate "C"`) and in Python over the stored file (`sorted()` is bytewise for ASCII codes, the same as `"C"`).
2. Compare one hash per college first. Equal hashes prove that college unchanged with no rows transcribed.
3. Where a college differs, ask for a short hash per row, then per title within a differing row. The difference
   narrows to the exact values to read.

S340: the five pilot colleges came back with three matching and two differing. Of 116 rows in those two, four
differed, each by one exhibit title. Only those four titles and the two new colleges were read in full, and every
college's hash then matched the live read. A row order has to match too: the per-title hashes gave the live order,
and the first rebuild, which kept the stored order, missed until it followed them.

## See also

- [`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md): a fixture is a dated copy, so a test reads its date, never today's.
