---
title: Methodology — rebuild a flattened diagram as a built slide (and reconcile it against its own arithmetic)
created: 2026-08-10
updated: 2026-08-10
tags: [methodology, presentations, pptx, communications, data-integrity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/playbook-building-cpl-executive-presentations]]"
  - "[[docs/cpl_presentations_lessons]]"
  - "[[CLAUDE]]"
artifacts:
  - presentations/cac_2026-08/build.py
  - presentations/cac_2026-08/spec.py
---

# Methodology — rebuild a flattened diagram as a built slide

> **One-sentence summary** — when a slide is "too busy," the fix is usually not styling: it is that
> the slide is a flattened image carrying reference data it should never have held, and rebuilding
> it natively lets you pace the reveal *and* catch the arithmetic errors the image was hiding.

## Context

The 2026-08-03 CAC deck had three pathway slides (pre-apprenticeship → baccalaureate, one per
trade). Sam's ask was "less intimidating, maybe some animation." Opening the file changed the
diagnosis: each slide was a **single full-bleed PNG**. Not a diagram made of shapes — a screenshot.

## The claim

### 1. Diagnose before styling. A flat image has three defects at once.

- **Nothing is editable, searchable, or accessible.** Every word is pixels. Screen readers get
  nothing; a typo needs the original design file; the deck's own fonts and theme are not in use.
- **It invites over-stuffing.** Because the author was working in another tool at another zoom
  level, the slide accumulated ~40 text objects, including a 12–17-row course table inside one
  column of a five-column diagram.
- **It silently truncates.** See §3 — this is the one that actually bites.

The busyness is a *symptom*. The cause is that reference data (a course catalog) was pasted into a
narrative slide (a pathway).

### 2. Split reference data from narrative, then build the narrative in three layers.

Move the tables to appendix slides — real tables, legible, un-clipped, referenced from the main
slide as "12 courses crosswalked — see appendix." That alone removes most of the ink.

Then pace what's left. The build that worked, and generalizes:

| Click | What appears | Why |
|---|---|---|
| 1 | The stage headers + arrows — the *shape* of the journey | The audience gets the model before any detail |
| 2 | The bodies — who does what at each stage | Names land against a structure that already exists |
| 3 | The hero number + the "so what" chips | The payoff arrives last, on its own |

**The final built state must read as a good static slide.** If the fully-revealed slide is still a
wall, the animation only delayed the problem. The reveal paces a calm slide; it does not rescue a
busy one. This also makes the deck safe in Google Slides, PDF export, or when someone else drives
the clicker.

### 3. ⭐ Reconcile the transcription against the source's own arithmetic.

Transcribing the images surfaced something no amount of proofreading would have:

- Carpentry: the visible course list totals **20.0 units**; the slide cites **26**.
- Cerritos ironworkers: visible list totals **31.5**; the slide cites **38**.
- American River ironworkers: totals **29.5** against **29.5** — exact.

The two gaps are not typos. The tables **ran off the bottom edge of the slide** and the rows below
the fold were never visible to anyone, including the author. A flattened graphic will happily
publish a clipped table, because clipping is a rendering event, not a content error — nothing
warns you.

So: **whenever you re-key a flattened graphic, add up its numbers and check them against its own
stated totals.** Where they disagree, say so on the artifact rather than silently "fixing" it. The
appendix slides here carry the discrepancy as a printed caveat, so a number cannot be quoted
without its flag.

### 4. Keep continuity: rebuild inside the original deck, not beside it.

Add slides with `python-pptx` on the source deck's own master/layout (here,
`Title and Content (No Symbol)`), so theme colors, fonts, the CCC logo and the footer rule come for
free. Sample the *original diagram's* colors so the new slides still look like the thing people
have already seen. Rebuilding in a fresh deck and pasting back loses all of that.

Retain the originals as **hidden slides** (`<p:sld show="0">`) at the end. Nothing is discarded,
nothing is in the way.

### 5. The click-build XML, minimally

`python-pptx` cannot author animation, but the timing tree is small enough to inject. Per layer,
one `<p:par>` gated on `<p:cond delay="indefinite"/>` (that is the click); inside it one effect per
shape, `presetID="10" presetClass="entr"` (fade), the first `nodeType="clickEffect"` and the rest
`nodeType="withEffect"` with a stagger on `<p:cond delay="…"/>`. `<p:timing>` goes last inside
`<p:sld>`, before `extLst` if present. Working generator: `presentations/cac_2026-08/build.py`
(`inject_timing`).

Verify with `scripts/office/validate.py <out> --original <src>` — pass `--original` so the
template's own pre-existing schema noise doesn't read as your regression.

## How we got here

Session 134 (SkyDeck), 2026-08-10, for the 13 August California Apprenticeship Council meeting.
Three slides in, six out (a shared "spine" slide, three trade slides, two appendix crosswalks),
plus speaker notes. LibreOffice Impress was not installed in the sandbox — `soffice --convert-to
pdf` failed on *every* pptx, including a trivial probe, which is the tell that it is the
environment and not the file (`apt-get install libreoffice-impress` fixed it; Chromium
`--print-to-pdf` covers HTML→PDF).

## When this applies (and when it doesn't)

**Applies** to any slide that arrived as an exported image, and to any "this is too busy" request —
check what the slide is made of before reaching for styling.

**Does not apply** when the graphic is genuinely a picture (a photo, a logo, a screenshot of a real
UI being discussed). Rebuilding those loses fidelity for nothing. The test is whether the image
contains *structured content the audience is expected to read*.

## See also

- [`playbook-building-cpl-executive-presentations`](playbook-building-cpl-executive-presentations.md) — data sources and template-fill mechanics
- [`docs/cpl_presentations_lessons`](../cpl_presentations_lessons.md) — workstream narrative
