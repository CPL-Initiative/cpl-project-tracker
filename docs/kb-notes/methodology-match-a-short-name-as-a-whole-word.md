---
title: Match a short name as a whole word
created: 2026-10-07
updated: 2026-10-07
tags: [methodology, sierra, retrieval, college-identity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[sierra_credential_naming_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_alias_word_match.test.js
---

# Match a short name as a whole word

> **A short alias tested as a substring names whatever word happens to contain it, so test it against whole words and measure what the old test caught before you change it.**

## Context

Sierra resolves a college from a question through an alias map (`ccsf`, `coc`, `arc`, `occ`) and then a name match.
Until 2026-10-07 the alias test was `q.includes(alias)`. Lessons: `docs/sierra_credential_naming_lessons.md`, S342.

## The claim

A three- or four-letter alias is shorter than most English words that contain it. As a substring it matches inside
"coding" (cod), "search" (arc), "occupational" (occ) and "COCI" (coc), and the first alias in map order wins, so a full
name can lose to a fragment of itself: "Allan Hancock" holds "coc". Pad the text and the alias with spaces after
replacing every non-alphanumeric run with one space, and test the padded alias inside the padded text. Possessives and
punctuation still match ("ARC's" reads as `arc s`); a word that merely contains the alias does not.

An initialism is the other half: a name match that searches for the question's words inside college names never finds
"NOCE" or "SDCCE", because no word of the name is the initialism. Initialisms belong in the alias map.

## How we got here

Sam asked whether NOCE teaches IT certification courses; Sierra found no college, and on his follow-up ("...in COCI...")
read College of the Canyons. Measured over 7,504 logged questions: 13 hit an alias only inside a longer word, all 13
resolved wrong, and no question that named an alias as a word changed. The test that guards it fails 18 of 23 checks on
the old code (#1897).

## When this applies (and when it doesn't)

Any lookup that keys on a short token: aliases, subject codes, acronyms in titles. It does not replace a fuzzy match where
partial words are the point (a misspelling, a stem); those need their own scoring. An alias that is itself a common word
("arc" welding, "mission") still matches as a word; that needs context, which a word boundary cannot supply.

## See also

- `methodology-an-absence-in-the-data-is-a-statement-about-the-data` (the false absence this produced)
- `tests/sierra_alias_word_match.test.js`
