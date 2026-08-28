---
title: A tag scan cannot see a fetch
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, repo, packaging, portability, pages]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/public_private_repo_split_scope]]"
  - "[[docs/auth_and_repo_posture_lessons]]"
artifacts:
  - fact-sheet/factsheet.js
  - sierra/sierra.js
---

# A tag scan cannot see a fetch

> **One-sentence summary** — Before calling a folder self-contained, grep for
> runtime `fetch()` and `../` traversal, because the markup can be perfectly
> folder-relative while the JavaScript reaches two directories up.

## Context

Scoping the public/private repo split, we needed to know which public surfaces
could move to their own repo. `fact-sheet/` was checked by scanning its
`src=`/`href=` attributes: all nine were `./`-relative, so it was reported as
self-contained and slated for phase one.

It is not. `factsheet.js` fetches `../fact_sheet_metrics.json` and
`../live_metrics.json` at runtime — both root-level, both written by the daily
cron. The markup scan was accurate. The conclusion drawn from it was wrong.

## The rule

**A dependency check must cover every mechanism by which the code can name a
file, not just the one that is easy to grep.** For a browser surface that is at
minimum:

- `src=` / `href=` attributes — the ones a markup scan finds
- `fetch()` / `XMLHttpRequest` / dynamic `import()` — invisible to markup
- any string containing `../` — the traversal itself is the signal
- CSS `url()` and `@import`
- what a **generator** writes into the folder, which no scan of the folder's
  *current* contents will reveal

```bash
# what the first check should have been
grep -ohE "fetch\(\s*[\"'\`][^\"'\`]+|[\"'\`]\.\./[A-Za-z0-9_./-]+" <dir>/*.js
```

## Why this failure mode is worth naming

It is **silent and it misattributes itself**. Had the split shipped on the tag
scan, `fact-sheet/index.html` would still have loaded, still rendered its shell,
still shown its headings — and only the live figures would have been missing.
That reads as a *data* problem. Someone would have gone looking at the cron, at
Supabase, at the metrics builder, at anything except the packaging decision that
actually caused it.

Contrast `sierra/`, which was checked the same way and *is* genuinely portable:
its only outbound reference is `https://hvuwhnbuahrtptokpqfh.supabase.co`, and
nothing in the repo writes into it. That difference is what phased the work —
`sierra/` and `veteran-sprint-map/` move with no decisions attached, while
`fact-sheet/` needs its data path resolved first.

## The generalization

"Self-contained" is a claim about **runtime behavior**, and static structure is
only evidence for it. The same trap recurs wherever a cheap proxy stands in for
the real property:

- import graphs that miss dynamic `require()`
- "no external calls" checks that miss a CDN in a CSS `@import`
- "nothing writes here" that misses a workflow's `git add`

When the cheap check and the expensive check disagree, the expensive one is
measuring the thing you actually care about.

## See also

- [`docs/public_private_repo_split_scope.md`](../public_private_repo_split_scope.md) — where this was found, §2
- `cpl_memory` `a-tag-scan-cannot-see-a-fetch`
