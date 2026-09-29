---
title: A generator does not know what a comment is
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, generated-artifacts, testing, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-generated-file-accepts-your-edit]]"
artifacts:
  - prototype/build_ccr_atlas.py
  - prototype/ccr_atlas_v1.html
  - tests/ccr_skyview_read_only.test.js
---

# A generator does not know what a comment is

Adding two script tags to `prototype/ccr_atlas_v1.html`, I wrote a comment above
them explaining what had to load first. The comment named the build placeholder
by its literal spelling, because that is what the sentence was about.

`build_ccr_atlas.py` assembles the page with `str.replace`. It substituted the
placeholder in the comment. The served page came out with all 485 KB of
`ccr_universe.js` inlined twice, every function defined twice, 1161 KB grown to
1634 KB.

## Why this is its own note

The sibling lesson from the day before —
[a generated file accepts your edit](methodology-a-generated-file-accepts-your-edit.md)
— is about editing the **artifact**, where the edit survives every check and the
next rebuild discards it. This one is about editing the **source correctly** and
having the generator read it differently than you did.

Both fail the same way: nothing goes red where you are looking, and the damage
turns up later, from somewhere else, wearing someone else's name.

The general form: **a text-substitution build has no syntax.** It cannot tell
code from prose, a placeholder from a mention of a placeholder, a live token
from a documented one. Anything that looks like its marker IS its marker. This
is true of `str.replace`, `sed`, envsubst, most template pre-processors, and
every hand-rolled `{{TOKEN}}` scheme.

## What caught it

A count. `tests/ccr_skyview_read_only.test.js` asserts how many non-GET requests
the built page makes; it read 4 where 2 were expected, and the duplication fell
out of investigating the extra two.

Nothing watching size or structure would have flagged it — the page was valid
HTML, it parsed, it ran, and a browser executing every definition twice mostly
behaves. **A count of something you understand is a cheap trap for something you
do not.** The assertion existed to pin the write surface. It caught a build bug
instead, which is the argument for counting exact numbers rather than asserting
"at least one".

## What to do

- **Never write a build placeholder in prose** — not in a comment, not in a
  docstring, not in a README beside the template. Say "the universe script" and
  let the real tag be the only occurrence.
- **Assert exact counts of things the build emits**, not lower bounds.
- When a generator's marker must be discussed, keep the discussion in a file the
  generator never reads.

The comment in `ccr_atlas_v1.html` now carries the warning, at the place where
the next person will be typing.
