---
title: "SkyView / CCR Atlas lessons — archive 2"
created: 2026-10-24
updated: 2026-10-24
tags: [lessons, archive, ccr, skyview]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - "[[CLAUDE]]"
  - docs/ccr_atlas_lessons.md
  - docs/ccr_atlas_lessons_archive.md
---

# SkyView / CCR Atlas lessons — archive 2

> Sections moved verbatim out of [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) when it passed its
> 120 KB budget again (S467, 2026-10-24). The first archive,
> [`docs/ccr_atlas_lessons_archive.md`](ccr_atlas_lessons_archive.md), is past its own budget, so this file
> takes the next sections. Nothing here was edited on the way across.

## 2026-09-06 — S235 (SkyOutline II): the outline built, three rulings shipped

**What shipped.** The course outline of record (`#outline/<id>`), Sam's three
rulings of the morning, and the fix for the double-click stranding. PR #1502.

**The design decision worth re-reading.** The outline's description is **chosen,
never written**. It quotes the *medoid* of the member catalog descriptions — the
one with the highest mean similarity to the others, i.e. the description that
says what the rest say — and attributes it to the college that wrote it.
Composing new prose out of several catalogs would read as authoritative while
belonging to nobody, which is a worse answer than quoting the college that
already said it. Sam authorized a synthetic description "as long as it is
clearly labeled MAP-Generated for faculty consideration and revision before
use"; the label covers the ASSEMBLY (the choosing, and the shared-topic list),
not invented sentences.

**Two extraction defects, both invisible without a browser.** A Python
prototype on the same data showed the first and it was read past; Chromium made
both obvious:

1. *Fragments outscoring their parents.* Counting every n-gram length at each
   position means a fragment is credited at least as often as the name
   containing it, so a count-ordered list puts the fragment FIRST. WELD M1109
   listed "shielded metal arc", "arc welding" and "shielded metal arc welding"
   as three separate skills.
2. *N-grams crossing commas.* Catalog prose is full of enumerations, and a
   word-only tokenizer walks straight across them: "infection, thermoregulation,
   pain, tissue integrity, gas exchange" produced the skill "pain tissue
   integrity gas".

Fixed by taking the longest valid n-gram per position, segmenting on punctuation
BEFORE any n-gram is formed, and a containment guard with a ratio exception
(1.6) so a genuinely more-widespread short skill inside a longer name survives.
A function-word gate rejects grammatical fragments — without it Blueprint
Reading returned "applied to the welding" and "is placed on reading", which is
the kind of output that costs a faculty reader their trust on the first screen.
Verified clean across Welding, Nursing, Art and Accounting.

**Corpus shape for the skills layer.** 94.6% of member courses carry a catalog
description (127,274 of 134,483), but only **30.0%** of identities have two or
more (14,902 of 49,650) — the stand-alones carry exactly one each. So the
two-college corroboration tier is unreachable for most of the corpus, and each
outline has to state its own evidence rather than imply a uniform standard.
⚠️ This does not contradict the earlier 90.4% figure, which named CLUSTERED
identities only; a figure is only wrong relative to the payload it names.

**Two inherited diagnoses were wrong about WHERE.** Both are in the KB note
`methodology-a-correct-measurement-can-name-the-wrong-place`: the 36px dropdown
drop is `.sugwrap`, not `#u-bar` (which never moves), and the picks were
destroyed leaving the map rather than returning to it. In both cases the
measured number was right and the element or moment named beside it was
inference, unlabeled as such.

**Five existing assertions asserted the reversed behavior** and were rewritten
to the new rulings with the reason, rather than deleted — including the one that
asserted leaving the map *clears* the selection, which is exactly what made
double-click destructive.

### The three rulings of 2026-09-06, as shipped (moved from the lane, S235)

1. **Enter closes the search panel** — ⚠️ REVERSES ruling 6 of the same morning,
   a reversal he flagged himself. The sort control moved to the list's **top
   right** (a sticky `.sug-head`); an **Enter** button took its place in the
   bottom row; key and button are one call (`runSearch`). ⚠️ The header is a
   child of the listbox, so `markSug` addresses rows by `id`, never by child
   position. ⚠️ It did **not** touch `takeHighlighted()` — Enter on a
   highlighted row is the multi-select pick, and ruling 3 of 09-05 keeps the
   list up through it.
2. **Double-click opens the course outline** — split by what is under the
   pointer: a course opens `#outline/<id>`, empty island ground keeps the
   discipline accelerator. A panel button carries the same route, because a
   double-click is undiscoverable and unreachable from a keyboard.
3. **Reserve the chip row's space** — see the warnings above.

### The outline as built, in full (moved from the lane, S235)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js` (23 checks,
both key guards mutation-tested). **The description is CHOSEN, never written:**
the medoid of the member catalog descriptions, quoted and attributed — composing
prose out of several catalogs would read as authoritative while belonging to
nobody. Sam's MAP-Generated sentence prints verbatim. **Skills are imputed** from
the colleges' own words (we hold **zero** agency skill statements); confidence is
agreement BETWEEN colleges; thin skills stay, chipped. **Two level axes, neither
derived** — the course's off its title, a skill's off its own words.

⚠️ **Two extraction defects were invisible until driven in Chromium**: every
n-gram length counted per position, so fragments outscored the names containing
them; and n-grams crossed commas in enumerations ("pain tissue integrity gas").
Fixed by longest-n-gram-per-position, a containment guard with a ratio
exception, and segmenting on punctuation first. **94.6% of member courses carry
a description, but only 30.0% of identities have 2+** — stand-alones carry
exactly one, so each outline states its own evidence.
