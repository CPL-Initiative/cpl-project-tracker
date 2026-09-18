---
title: An inside term leaks through the context, never through the prose rules
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, sierra, vocabulary, plain-words, prompting, retrieval]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-the-record-cannot-say-which-credential-is-held]]"
  - "[[methodology-a-new-assertion-must-fail-in-the-shape-the-grid-counts]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/smoke_test.sh
  - sierra_rule_defaults.js
---

# An inside term leaks through the context, never through the prose rules

> **One-sentence summary** — When the model keeps saying a word a rule bans, the word is in the context it reads; rename it where retrieval renders it, keep the ban, and guard the answer with a check that fails in the shape the grid counts.

## Context

Sam, 2026-09-18: *"Sierra shouldn't use the inside term COCI. Instead say
something like catalog data."* COCI is the Chancellor's Office Curriculum
Inventory, a system name a student has never heard. cpl-chat's student-
audience rule had banned the word since v22 (*"do NOT mention … COCI"*), and
v71 still wrote *"the COCI catalog doesn't list a full LVN entry program"* in
Sam's own test answer.

## The claim

A model quotes its context. The word reached the answer because the three
catalog builders headed their sections "COCI offerings", "COCI programs" and
"COCI catalog", and two catalog rules said "COCI program export" — the same
lesson v71 taught about the held credential: a prompt rule cannot outrun a
context that contradicts it. The fix has three parts, in this order:

1. **Rename it where it is rendered.** Every string the model reads calls the
   source "the college catalog data" or "the catalog data". After the sweep
   the only "COCI" left in rendered text is the sentence that bans it.
2. **Keep the ban, in the always-on rule.** The catalog rule that fires on
   every request says what to call the source and why the visitor does not
   know the other name.
3. **Guard the answer.** The smoke fails any mode whose answer matches
   `\bCOCI\b`, printing the error in one of the shapes the A/B compare counts,
   so a regression is a red row in the grid and never a silent line in a log.

## How we got here

v71's answer `a0f4a6ec` (13:40Z), read by Sam in a browser; the sweep in
cpl-chat v72; `tests/sierra_prospective_credit.test.js` block 11 asserts the
builders and the catalog rules carry no COCI and the always-on rule carries
the ban once.

## When this applies (and when it doesn't)

It applies to any word the team decides a visitor should not see — a system
name, a table name, a code — and to any rendered string, including section
headers and the "no college in the place" lines. It does not apply to code
identifiers or file names; `coci_college_offerings` is a table and stays.

## See also

- `docs/cpl_assistant_lessons.md` (2026-09-18, S276).
- `cpl_memory` `sam-never-say-coci-say-catalog-data-2026-09-18`.
