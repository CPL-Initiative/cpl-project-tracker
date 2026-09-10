---
title: A check that cannot fail reads exactly like a clean result
created: 2026-09-09
updated: 2026-09-10
tags: [methodology, tooling, lint, testing, quality]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/public_pages_a11y_lessons]]"
  - "[[methodology-a-knowledge-base-needs-a-lint-pass]]"
artifacts:
  - kb/_docs_audit.py
  - kb/_glyph_sweep.py
  - scripts/a11y_triage.js
---

# A check that cannot fail reads exactly like a clean result

> **One-sentence summary** — A rule reporting zero and a rule that is structurally
> incapable of reporting anything produce identical output, so the only way to
> trust a green check is to have watched it go red.

## Context

Session 245 (2026-09-09) found **three** of these in one run, in three different
tools, none of which had ever reported a problem. Each had been quietly green for
weeks. The corpus looked clean because nothing could tell it otherwise.

This is the general form of a failure this repo keeps re-encountering — the
`entry["text"]` key that never existed (2026-08-21), Rule 9's token-count trigger
that no session could evaluate, `islandPass` keyed on a signature that never
changed (S244). The instances differ; the shape does not.

## The three, and what each was blind to

| Tool | The defect | What it could not see |
|---|---|---|
| `kb/_docs_audit.py` | `prose_only()` looped every mask pattern with a hardcoded `re.S`, so the line-anchored indented-code rule's `.*` ran past the newline | **every doc below its first indented block** — on one lane file, bytes 1,996 → 11,749 |
| `kb/_glyph_sweep.py` | the report counted findings `--apply` correctly refuses (generator-owned, Rule 1) | nothing — but it **overstated the work fourfold**: 401 reported, 26 actionable |
| `kb/_glyph_sweep.py` | matched literal emoji and HTML entities only | **13 emoji written `"\u{1F512}"`** — a padlock on screen, seven ASCII characters to a scanner |

## Why they survive

**A passing check and an absent check are the same observation.** Every dashboard,
summary line and CI badge reports "no findings" identically for both. Nothing in
the normal operation of the tool distinguishes them, so they can only be found by
accident or by deliberate attack.

**They are found by producing the error on purpose.** The DOTALL bug surfaced
because a session wrote `colour` twelve times and the spelling rule — whose word
table literally begins `("colour", "color")` — said nothing. The glyph-escape gap
surfaced while chasing an unrelated *contrast* finding and happening to read the
rest of the sentence.

## The practice

1. **Verify a guard by reverting its fix**, one at a time, and confirm it fails
   *its own* check and nothing else. Eight guards were verified this way in S245;
   one revealed a whole class the author had missed (four `color:#fff` on
   `--cobalt` still in the generator).
2. **Treat a rule sitting at zero as unverified, not as passing.** The 2026-08-21
   note on this file records catching the first instance "only by noticing the
   rule was ABSENT from the summary rather than at zero" — absence and zero must
   be visually distinct in any report.
3. **A count that mixes owners is not a count.** Separate what the reader can act
   on from what belongs to another process; gate only on the former.
4. **Ask what the scanner cannot represent.** A text scanner cannot see escapes,
   entities, or generated output. Enumerate the encodings of the thing you match
   before trusting the match.

## ⭐ The worst one is a shared helper, not a check (2026-09-10)

The three above were each one assertion. S249 found a fourth that was worse in
kind, because it disabled **every** check downstream of it at once:

```js
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "")
                              .replace(/^\s*(\/\/|#).*$/gm, "");
```

`#` starts a comment in Python and an **ID selector** in CSS. The helper was
written for one Python file and then reused on `index.html`, where it deleted
**942 lines** before any scanner saw them — 329 CSS rules beginning with an ID
selector, **179 of them carrying a `color:` declaration**. Every raw-hex ink
guard in `tests/cpl_theme.test.js` was scanning a stylesheet with most of its
color declarations already removed.

It surfaced by accident: a NEW guard reported a rule as missing that was
plainly present in the file. The guard was right and the input was wrong.

**Two things generalize.**

1. **A sanitizer is a check's blind spot, and it is invisible in the check's
   own source.** Reviewing the assertion tells you nothing; the defect is one
   function call upstream, in code that looks like plumbing. When a guard
   reports something you can see is false in the file, suspect the input before
   the predicate.
2. **Falsify through the whole pipeline, from the file on disk.** Injecting the
   defect into a string literal inside the test would have passed the
   falsification and proved nothing. Injecting it into `index.html` — on a line
   starting with `#`, which is where most of that stylesheet's rules live — is
   what exposed it. Put the defect where the real ones live, not where the test
   is convenient.

⚠️ **The count is the tell.** A one-line probe — how many lines does my
sanitizer blank? — would have caught this at any point in the months it was
live. Print it once when you write a sanitizer.

## The counter-lesson

⚠️ **Do not "fix" a check by widening it until something fails.** The same run
over-removed two glyphs a test was deliberately guarding — a design call recorded
in the test's own comment, with a name and a date on it. A rule reporting zero
may be correct. The remedy is to *test* the check, not to make it noisier.
