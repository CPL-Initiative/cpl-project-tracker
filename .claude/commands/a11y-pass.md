---
description: Check and remediate one COBI surface (or all of them) against AA contrast, WCAG 2.2 target size, mobile layout, and the plain-words glyph rule — in blast-radius order, verified by re-measuring.
---

# `/a11y-pass` — check and remediate a surface

Sam, 2026-09-09: *"I want a procedure that checks and remediates each COBI
surface for AA and mobile friendly standards."*

`npm run a11y` is the **check** half and it is good at it. This is the whole
loop: check → **triage** → remediate → **re-measure** → record. The triage step
is the one that was missing, and it is not a convenience.

> ⚠️ **THE NUMBER OF FINDINGS IS NOT THE NUMBER OF PROBLEMS.** Measured on COBI's
> first dark sweep (2026-09-08): **38 of 38 routes failed, 511 findings — and six
> selectors in shared chrome were ~227 of them.** `first_light.js` and the rail
> paint on every tab, so one CSS line is 38 findings. Reading the report top to
> bottom means fixing the 38th-most-important thing first.

---

## The loop

### 1. Check — measure, do not read the code

```bash
npm run a11y cobi        > /tmp/light.txt     # ~100 s, 38 routes x 2 widths
npm run a11y cobi-dark   > /tmp/dark.txt      # the same routes, theme switched
```

Targets live in `a11y.config.js`; COBI's 38 tabs are **discovered from its own
nav**, so a new tab is measured the day it ships. Add a view there, never a new
script.

⚠️ **`npm test` proves nothing here.** jsdom returns zeroes for every rectangle:
299 green suites once sat beside a masthead painting 240px of one cluster over
another.

### 2. Triage — collapse findings into causes

```bash
node scripts/a11y_triage.js /tmp/dark.txt
```

Groups by selector, ranks by **blast radius**, and names the shape of the cause:
a selector on *every* route is shared chrome (one rule fixes all tabs); a ratio
repeated *exactly* is one color, not many; a fault on one route is that tab's own
CSS. It ends with a numbered **order of work**.

It reads a saved report and never re-measures, so triage is free and re-readable.

### 3. Remediate — top of the list down, one cause at a time

⚠️ **FIXING THE RULE YOU FOUND IS NOT FIXING THE RULE THAT APPLIES.** On
2026-09-08 `.cpl-tab {color:#666}` was corrected and the sweep still reported
1.74:1 on all 38 tabs — `.cpl-sidebar .cpl-tab {color:#444}` is more specific and
is what paints the rail. **Grep for every rule that sets the property**, and
prefer the most specific one.

Per class:

- **Contrast** — never a hand-picked hex. Add or reuse a `var(--token)`; a
  missing role gets a token in **both** HTMLs (Rule 4). ⚠️ **Count a token's uses
  by ROLE before theming it** — `color` vs `background` vs `border`. A token used
  as both text and fill has no dark value that works:
  [`methodology-a-token-with-two-jobs-cannot-be-themed`](../../docs/kb-notes/methodology-a-token-with-two-jobs-cannot-be-themed.md).
- **Target size (2.5.8)** — the 24px floor belongs on **whatever the engine
  measures**. A wrapping `<label>` replaces its control's box, so growing the
  15px checkbox inside it moves a number nothing reads.
- **Mobile** — single column below ~560px, `clamp()` type, no fixed widths, and
  wide content scrolls **inside its own container** so the body never scrolls
  sideways.
- **Keyboard scrollers** — an overflowing region needs `tabindex="0"` *and* an
  accessible name. ⚠️ Chromium 127+ focuses an overflowing div with no tabindex
  at all, so **the measuring browser hides this defect**; the explicit fix is
  still correct.
- **Generated sections** — if the selector lives in a section
  `excel_to_dashboard.py` rewrites, **change the generator** (Rule 1). An HTML
  edit there is undone by the next cron.

### 4. Glyphs — the plain-words rule, swept

Sam, 2026-09-09: *"remove all emoji glyphs and if any are crucial replace with a
muted glyph using white and CO blue as default. If color is needed to clarify,
keep it muted and aligned with the CO palette."*

```bash
python3 kb/_glyph_sweep.py            # report  -> kb/glyph_sweep/<date>.md
python3 kb/_glyph_sweep.py --apply    # rewrite the SAFE control class only
python3 kb/_glyph_sweep.py --check    # exit 1 if any control-class glyph remains
```

⚠️ **A comment line is never a finding.** This repo writes ⚠️ and ⭐ heavily in
code comments as house style; they render to nobody, and reporting them buries
the ones that do render.

Three classes, and only one is mechanical:

| Class | What it is | Action |
|---|---|---|
| **control** | inside a button / link / summary label, or an `aria-label`, `title`, `placeholder` | `--apply` deletes a **leading** glyph and its space. Every control is a word. |
| **status** | a hint, alert or dialog string | **Reported only** — removing it needs the sentence reworded (`"❌ "` → `"Error: "`). |
| **decoration** | everything else | **Reported only** — may be load-bearing in a table or legend. |

`--apply` refuses to empty a label that *is* a lone glyph, and never touches a
mark mid-sentence. Verify with the edge cases in the module docstring.

⚠️ **`--check` IS NOT A CI GATE YET, AND SAYING SO IS THE POINT.** The baseline
on 2026-09-09 is **1,549 findings across 139 files — 516 control · 225 status ·
808 decoration**. Wiring it red on day one would train everyone to ignore it.
It becomes a gate in `js-tests.yml` when the control class reaches zero; until
then it is run per surface, and each pass drives the number down and records it.

**When a mark is genuinely crucial**, it is ghosted, not decorated: muted CO blue
— `--cobalt-on-dark` (#7DA1D4) on a dark ground, `--seal-blue` (#002F6D) where it
must carry weight — and a **word** beside it wherever the word fits. If color is
needed to clarify, keep it muted and inside the CO palette; green and red are for
a state the reader must **act** on, nothing else.

### 5. Re-measure — the count is the proof

Re-run the sweep **after each root cause**, not at the end. Record the before and
after in the lane file; "improved" without a number is not a result.

```bash
npm run a11y cobi-dark > /tmp/dark2.txt && node scripts/a11y_triage.js /tmp/dark2.txt
```

⚠️ **Never edit a file while a sweep is reading it.** A background measurement and
a foreground edit of the same file cannot both be trusted — this cost a session
an hour of theorizing about an override that did not exist.

### 6. Record

Update [`docs/reference/lanes/cobi-dark-mode.md`](../../docs/reference/lanes/cobi-dark-mode.md)
with the new numbers and what remains. A remainder that is measured and named is
finished work; one that is implied is a hole.

---

## Definition of done, per surface

- `npm run a11y <target>` reports the surface clean, **or** every remaining
  finding is named in the lane file with why it is deferred.
- The same is true in **both** themes — `cobi` and `cobi-dark`.
- `python3 kb/_glyph_sweep.py --check` passes for that surface's files.
- No horizontal body scroll at 320px.
- Every new guard verified **by reverting its fix**.
