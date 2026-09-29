---
title: The CCCCO house voice — how our outward writing should read
created: 2026-09-01
updated: 2026-09-01
tags: [reference, house-voice, writing, communications, cccco]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - kb/_docs_audit.py
---

# The CCCCO house voice

> **One-sentence summary** — Our outward writing should read like the
> Chancellor's Office at its best: concede before you argue, preserve the other
> party's authority, say what a thing is *not*, keep the student as the subject,
> anchor every claim to a named instrument, and let a short declarative land
> after a long qualified one.

## Context

Sam, 2026-09-01, sharing an internally circulated letter from the CCCCO Vice
Chancellor of Academic Affairs to his CSU counterpart: *"wonderfully crafted …
the word choice and tone provide an extensive example of the tone and vocabulary
and sentence variety I would like to see in our artifacts."*

He asked for this to become a standing influence rather than a new tool to
manage. So the durable analysis lives here (**pull** — read it when drafting),
the few rules that must fire unprompted live in `CLAUDE.md` under **Naming &
terminology** (**push**), the mechanical floor is linted by `house_voice` in
`kb/_docs_audit.py`, and the exemplars sit in the vault at
`CPLBrain/04-projects/cpl-initiative/resources/`.

## Where this applies

**Adopt it for:** letters and outward correspondence, guidance and policy memos,
board and legislative materials, college-facing communications, public
explainer prose, report narrative, deck narration.

**Do NOT adopt it for:** lane files, session handoffs, commit messages, code
comments, test headers, decision sheets. Those are deliberately dense and
heavily marked up because a session reads them under pressure — flattening them
to correspondence register would make them worse. Register is chosen by
audience, not by preference.

## The claim — nine moves, from the exemplar

### 1. Concede before you argue, in the other party's strongest form

> "I recognize and respect the concerns that have led the ASCSU and CSU to their
> current position. AS-3736-25/AA concludes that partial Cal-GETC certification
> would create a second lower-division general education pathway, reintroduce
> complexity for students, and conflict with the ASCSU's interpretation of AB
> 928's singular-pathway requirement."

The opposing position is stated accurately and at full strength *before* the
counterweight. Never a strawman, never a dismissal.

### 2. Reframe disagreement as shared inquiry

> "Rather than allowing that difference to end the conversation, I believe it
> gives our systems an opportunity to examine together…"
>
> "These differences call for shared inquiry, not a predetermined answer."

### 3. Preserve the other party's authority explicitly

> "Faculty and campuses must retain responsibility for academic judgments…"
>
> "…each segment will continue to exercise its distinct admissions and academic
> responsibilities."
>
> "…although it does not determine CSU policy."

Say plainly what is *not* yours to decide. It costs nothing and it is the reason
the ask at the end is credible.

### 4. Say what a thing is NOT, to forestall misreading

> "This would be a question of when the remaining requirements are completed,
> not a waiver, a separate general education curriculum, or a reduction in what
> students must ultimately complete."

The most characteristic move in the letter. Where a proposal could be
misconstrued, name the misconstruction and close it.

### 5. Keep the student as the subject of the problem

> "It is important to be precise about the student problem we are trying to
> solve."

Consequences are then stated in student terms — accumulate excess units,
postpone sequential courses, narrow options — not in institutional ones.

### 6. Make hedges load-bearing

*may prevent · appear useful initial candidates · warrant close review ·
wherever that is reasonably possible*

Each hedge marks genuine uncertainty. A hedge that softens a claim you are
actually confident about is noise; a hedge that marks a real limit is precision.

### 7. Anchor every claim to a named instrument

AB 928 · AB 2057 · AS-3736-25/AA · Recommendation 13 of the 2023 Final Report ·
UC Senate Regulation 479 · the State Auditor. Nothing about what is permitted,
required or concluded is asserted when it could be cited.

### 8. Vary sentence length, and let the short one land

A long compound sentence carrying the qualified argument, then a short
declarative that closes it:

> "Although AB 2057 contemplates separate CSU- and UC-oriented TMCs when a common
> curriculum truly cannot be constructed, **that should be a last resort.**"

This is the rhythm Sam identified as "sentence variety". It is not decoration —
the short sentence is where the position actually gets stated.

### 9. The ask comes last, and it is small

After all the reasoning: a small planning group with a concise charge. Not a
demand, not a list — one modest, specific, next step.

## Vocabulary

**Reach for:** invite · partnership · collaborative leadership · shared aim ·
academically coherent · complement · distinct value · warrant · examine
together · practical first step · concise charge · grounded in.

**Avoid:** `leverage` · `utilize` · `deep dive` · `synergy` · `circle back` ·
`best-in-class` · `operationalize` · `impactful` · `at the end of the day` ·
`low-hanging fruit`. ⚠️ The banned terms are written in **code spans** so this
note survives its own lint — `prose_only()` masks them, exactly as CLAUDE.md
requires for the British forms in the spelling rule. A word list that trips the
rule it documents is the failure that list exists to prevent.

Institutional register is not business register, and the CCC funding vocabulary
rules in `CLAUDE.md` already say the same thing for funding surfaces.

## Typography

The letter uses **no bold, no bullets, and no glyphs** in its body. The argument
carries itself in prose. Outward correspondence should do the same; reserve
lists for genuinely enumerable things, and remember the standing glyph rule —
the default is no mark at all.

## Before and after

**Default drafting voice:**

> CSU doesn't accept partial Cal-GETC certification, which blocks the high-unit
> STEM fix. We should push them to reconsider — the ADT is supposed to be the
> primary pathway under AB 928, and UC already allows this.

**House voice:**

> Although CSU historically accepted partial certification under IGETC and CSU GE
> Breadth, the CSU does not currently accept partial Cal-GETC certification, and
> ASCSU Resolution AS-3736-25/AA opposes its use. Rather than allowing that
> difference to end the conversation, I believe it gives our systems an
> opportunity to examine together how transfer policy can better support
> equitable access, strong academic preparation, and timely completion.

The second is longer and concedes more, and it is the one that can be answered.

## When this applies (and when it doesn't)

**Applies** wherever a reader outside the team will judge the Initiative by the
writing. **Does not** apply to internal working memory, where density beats
grace — and does not license padding: the exemplar is long because the argument
is genuinely qualified, not because length reads as seriousness. A short blunt
answer to a short blunt question is still correct.

**And it is a voice, not a template.** Copying its sentence shapes onto a memo
that has no concession to make produces parody. The moves are available; which
ones a given piece needs is a judgment.

## See also

- `CPLBrain/04-projects/cpl-initiative/resources/adt-high-unit-stem-transfer-letter-2026-08-20.md`
  — the exemplar (internal; never promote to the public KB)
- `CPLBrain/04-projects/cpl-initiative/resources/ess-25-82-funding-memo-2025-12-09.md`
  — a second exemplar in the funding-memo register
- `CLAUDE.md` → **Naming & terminology** — the rules that fire unprompted
- `house_voice` in `kb/_docs_audit.py` — the mechanical floor

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
