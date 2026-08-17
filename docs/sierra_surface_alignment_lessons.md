---
title: Sierra across three surfaces — alignment lessons
created: 2026-08-17
updated: 2026-08-17
tags: [lessons, sierra, design-system, glyphs, accessibility, drift]
artifacts:
  - cpl_chat.js
  - sierra/sierra.js
  - sierra/index.html
  - sierra/sierra.css
  - fact-sheet/factsheet_sierra.js
  - tests/sierra_surfaces_aligned.test.js
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-one-assistant-three-files-is-a-drift-machine]]"
  - "[[docs/cpl_assistant_lessons]]"
---

# Sierra across three surfaces — alignment lessons

Sierra is mounted by **three separate files**, none of which knows about the
others:

| Surface | File | Where |
|---|---|---|
| COBI tabs (CPL Assistant, My College) | `cpl_chat.js` | the dashboard monolith |
| The standalone public page | `sierra/sierra.js` + `sierra/index.html` | `/sierra/` |
| The Fact Sheet drawer | `fact-sheet/factsheet_sierra.js` | `/fact-sheet/` |

## 2026-08-17 (Session 167, Sky167) — the alignment, and what made it stick

### What happened

#1231 applied Sam's no-glyphs rule (`cpl_memory
cobi-no-cheesy-glyphs-design-rule`) to the My College tab. It could only reach
`cpl_chat.js`. The other two surfaces kept every emoji, so the same assistant
introduced itself with 🎓📚🏛️💼🤝 on one page and plain words on another.

Sam: *"I think it's a good idea to keep all instances of Sierra aligned."*

Aligned string for string — audience chips, the Copy pill, the ✓/⚠ status
prefixes, 👍/👎, the 🧪 Beta notices and the 💬 launcher.

### Three things that were not a straight strip

**1. The ↗ became a cue, not nothing.** The standalone page's `map.rccd.edu`
link opens a new tab, and that arrow was the only warning a keyboard or
screen-reader user got before focus moved somewhere they did not ask for. It is
now a visually-hidden "(opens in a new tab)" — **clipped, not `display:none`**,
because both `display:none` and `visibility:hidden` remove an element from the
accessibility tree, which would delete the warning rather than relocate it.

**2. A word needs a font a glyph did not.** A `<button>` inherits neither
`font-family` nor `color`. With thumbs that was invisible — a glyph renders the
same in any font. With words, the two rating pills would have rendered in the
UA's default button font and colour immediately beside a Copy pill that
explicitly opts in. `.s-fb-copy` already spelled both out; the rating pill never
had to. Fixed on **both** surfaces, since `cpl_chat.js` carried the same latent
issue from #1231 and the two pills sit in the same row there too.

**3. One glyph was kept on purpose.** The drawer's `✕` close control. Sam's rule
is against *cheesy* glyphs — *"if we use them they should be muted, simple"* —
and a close mark is the same class of standard affordance as the disclosure
caret his rule explicitly permits. It carries `aria-label="Close Sierra"`, so it
is not the only cue. The test names it as a deliberate carve-out, because the
next person sweeping for glyphs would otherwise read it as an oversight.

### ⭐ The durable part is the cross-file assertion, not the glyph scan

Three files hand-maintain one assistant and **nothing had ever compared them**.
The audience labels are the sharpest case: the pick is persisted under **one**
same-origin key (`cplSierraAudience.v1`) and travels to the **same** Edge
Function, so a drifted label means one assistant introducing itself two ways to
the same person — and the drift is only ever found by a human looking at two
screens.

`tests/sierra_surfaces_aligned.test.js` compares the arrays directly — key and
label, in order. That makes "aligned" **mechanical instead of remembered**.

### Traps hit while writing the test

- **A glyph scan alone is not enough.** A strip that left the labels *blank*
  would pass it. Every glyph check is paired with one asserting the word
  survived and that sibling states stay distinct — collapsing *Helpful* and *Not
  helpful* into one string would read as glyph-free and be wrong.
- **The rendered checks passed over an EMPTY list.** jsdom defers
  `DOMContentLoaded`, so the page never booted and `.some()`/`.every()` are
  vacuously true on nothing. Each now requires the five chips in its own
  condition. *This is the "a check that can only pass on an unreachable path is
  vacuous" lesson from #1231, hit again immediately.*
- **A source scanner desynced on regex literals.** These files contain regexes
  holding backticks (the markdown-lite `` `code` `` rule); treating one as a
  template-literal opener desyncs the walker for the rest of the file, silently
  turning code into "strings" and potentially swallowing a real glyph. The
  scanner now skips regex literals and reads **string literals rather than
  lines**, which also lets a comment safely name the glyph it explains.

### Current state

All three surfaces read identically. 42 checks, 18/42 against the pre-change
files.

### Next concrete step

**Not done, and it is Sam's call:** the Fact Sheet's *own* action bar still
carries `⬇ Word`, `🖨 Print / Save as PDF` and a `⭐` in a KPI. Those are the
Fact Sheet's buttons, not Sierra's, on a public artifact used for external
comms — so the bar now has one plain button (`Ask Sierra`) between two glyphed
ones. Sweeping it is a one-line change per button; leaving it is defensible.
Same question for the global chrome that appears on every COBI tab:
`cpl_todos.js` (`📋 To-Do`) and `tabs.js` (`✓ signed in`).
