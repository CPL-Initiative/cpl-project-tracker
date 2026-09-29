---
title: "A presentation rule is the purest push case there is"
created: 2026-08-29
updated: 2026-08-29
tags: [methodology, ui, doctrine, context, claude-md]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - CLAUDE.md
  - kb/_docs_audit.py
related:
  - "[[methodology-push-what-cannot-be-asked-for-pull-everything-else]]"
  - "[[reference-ui-design-system]]"
---

# A presentation rule is the purest push case there is

**Nobody stops to query "may I use an emoji here" before typing one.** That is
the whole argument, and it decides where the rules governing what a human LOOKS
AT have to live.

## The rule that proves it

*"PLAIN WORDS, NO GLYPHS"* has now been lost **twice**, both times by living
somewhere that does not fire:

1. **2026-08-14** — recorded in `cpl_memory`. The Admin tab shipped covered in
   emoji **that same week**. The repo's own row says it:
   `a-recorded-rule-is-not-an-applied-rule`.
2. **2026-08-28** — it was inside a §11 roadmap row in `CLAUDE.md`, and a
   consolidation relocated that row to a lane file. **Zero occurrences remained
   in the always-loaded file.** It went from firing on every session to firing
   only for whoever happened to open one lane doc.

Neither loss was visible. No file was deleted, no link broke, nothing went red.

## Why memory is the wrong home, despite the name

Four formatting rulings were already in `cpl_memory` and `verified` — First
Light/accessible/mobile, American spelling, full-width prose, the a11y standing
expectation — **and the glyph rule still shipped broken.** Its briefing budget
fits roughly **21%** of verified rows, so a rule placed there can be *present and
silently unread*, which is strictly worse than a large always-loaded file that at
least loads completely.

**Memory is the record. It is not the enforcement.** Push stores must be
complete; pull stores may be sampled.

The escalation that actually works, weakest to strongest:

| | fires | |
|---|---|---|
| `cpl_memory` | if queried | the record |
| always-loaded file | every session, unprompted | the floor |
| lint | at the moment of the edit | catches drift |
| CI | before it can ship | blocks it |

## Two things that make the guard real

**They must be a CLASS, not scattered.** The rules had accumulated across a §11
row, the engineering practices, the naming conventions and `cpl_memory` — so any
relocation could carry one off unnoticed. One section, one lint over it.

**And they must be split, one rule per bullet.** First Light, accessibility and
mobile were a single bullet. Sam names them as three concerns, and a rule buried
inside another rule is weaker — it also cannot be guarded independently, which is
how a lint ends up satisfied by its neighbour's wording.

## ⚠️ Four ways the guard passed for the wrong reason

Each is worth knowing because each looks correct while checking nothing:

- **Searching the whole file** was satisfied by the section's own *post-mortem
  naming the rule it had lost*. A doctrine-presence check keyed on a rule's NAME
  is satisfied by the write-up about losing it. Read the rule bullets only.
- **Patterns keyed on remembered wording** (`NO GLYPHS`) missed the bullet's
  actual wording (`NOT GLYPHS`).
- **Bare topic words** (`accessib`, `mobile-friendly`) were satisfied by a
  QUOTATION inside a neighbouring rule — Sam's *"make it always accessible and
  mobile friendly"* sits in the First Light bullet, so either of the other two
  rules could have been deleted in full while the lint stayed silent. Anchor on
  phrasing only the directive uses.
- **A synthetic fixture passed while the live file failed**, because the fixture
  had no quotation in it. Run the check against the REAL file: delete each live
  bullet in turn and assert exactly one topic is reported.

## ⚠️ What not to build

**Do not lint for emoji in the UI source.** This codebase deliberately uses them
in places the owner approved and `CLAUDE.md` names — a to-do button, a guidance
pane, a tab icon. A blanket check would need an allowlist and would emit findings
nobody can action, which is its own documented failure. The rule is about an
emoji used *instead of* a word as a label; a state-bearing mark beside a word
(✓ ⚠ ▲▼) is required, because color must never be the only signal. That
distinction needs a reader, not a regex.
