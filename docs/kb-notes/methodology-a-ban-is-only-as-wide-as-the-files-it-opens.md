---
title: A ban is only as wide as the files it opens
created: 2026-09-15
updated: 2026-09-24
tags: [methodology, testing, vocabulary, funding, presentation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-guard-on-generated-output-cannot-see-its-source]]"
  - "[[docs/reference/lanes/implementation-funding]]"
artifacts:
  - tests/cpl_funding_calm.test.js
  - tests/cpl_funding_earn_retired.test.js
  - tests/funding_model_page.test.js
  - tests/college_briefing_earn_retired.test.js
---

# A ban is only as wide as the files it opens

> **One-sentence summary** — Two guards that cover a rule from two angles still
> cover only the files they read, and "the two together are the whole guard" is
> a claim about a file set that nobody wrote down.

## Context

When Sam retired the word *earn* from reader-facing funding text
(2026-09-13 — *"Earned still smacks of banking… better to use something like
'measured… or… qualified for'"*), the rule got two guards, deliberately, with
the reasoning recorded in the second one's header:

- **`cpl_funding_calm` §5** reads `mountWords(doc)` — the text the funding tab
  actually paints. It proves the words are gone from what a curator sees.
- **`cpl_funding_earn_retired`** reads `cpl_funding.js`'s **source**, because a
  rendered-text ban covers only the branches a fixture paints. It is what
  caught `"Earned <window>"` sitting in a CSV column header that no DOM test
  reaches.

That pairing is genuinely good reasoning: rendered output and source are the
two axes a single guard misses. Its header says so — *"The two together are the
whole guard."*

## The failure

They are not the whole guard, because both of them read the same **one file's**
world: the tab's mount, and the tab's own source. The public explainer at
`funding-model/index.html` is a third file — hand-written markup, its own
inline painter — and two days after the retirement it still said:

> What it **earns** tracks the prior-learning credit it puts on students' records…

and

> the priority's share is **earned** with fewer units of prior learning

on the one surface colleges actually read. The same scan turned up *effective
rate*, which Sam had also retired.

Neither guard was wrong. Neither was weakened. The rule simply had a third
place to live, and the sentence claiming complete coverage was written by
someone thinking about **axes** (rendered vs. source) rather than about
**files**.

## The rule

**Coverage is a claim about a set of files. Enumerate the set, in the guard, by
name.** Two orthogonal techniques over one file are not coverage of a rule that
spans three files — and the more carefully the two techniques are justified,
the more convincing the gap looks like completeness.

When you write "these two together are the whole guard", the next sentence
should name every artifact the rule applies to, so that adding a surface is
visibly adding a gap rather than silently inheriting one.

## What to ask

For any rule stated as a ban on wording — vocabulary, spelling, glyphs,
positive-first phrasing — ask **which files can render this text?** For funding
prose that is currently: `cpl_funding.js` (the tab, the exports, the memo and
report builders), `funding-model/index.html` (the public explainer's own
markup and painter), the curated Supabase config text blocks, and anything the
docx builders emit. A guard family that opens three of those five is a guard
family with two holes in it, and the holes are invisible from inside.

## The fix here

`funding_model_page.test.js` now scans the explainer's own prose — body markup
with scripts and comments stripped — for the earn stems and for
pool / money / draw / unspent / the advance concept, and reports the offending
word with the sentence around it rather than a bare fail. It also asserts that
the scan can fail, against a planted string: a scan that reports nothing
because it is looking at nothing is the failure this note is about, one level
down.

## 2026-09-24 — the third file

The rule found its third instance on the college briefing. `college_briefing.js`
renders a funding box of its own for every college, and on 2026-09-24 it still
said *earns against*, *drawable*, *the dollars*, *money* and *pool*, nine days
after the words left the funding tab. Both guards were green the whole time:
`cpl_funding_calm` reads the tab's mount and `cpl_funding_earn_retired` reads
`cpl_funding.js`, and neither opens the briefing. The fix is the same shape as
the explainer's: a third source-reading guard,
`tests/college_briefing_earn_retired.test.js`, with the identifier-sparing
lookarounds and one named exemption (a student earning credit is the academic
sense). The file set the ban covers is now written down in three places, one per
file, which is the only way "the guards together are the whole guard" stays true.
