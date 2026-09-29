---
title: "Shared grid columns must share one unit"
created: 2026-09-01
updated: 2026-09-01
tags: [kb, methodology, ui, css]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
---

# Shared grid columns must share one unit

**The claim.** When several sibling elements (a header row, a totals row, the
data rows) are laid out as separate CSS grids that must visually align into
one table, their shared `grid-template-columns` must be denominated in a unit
that resolves identically for all of them — `rem` or `px`, never `em`. An
`em`-denominated template is not one template: it re-resolves against each
element's own `font-size`, so three elements can carry the same template
STRING and render three different grids.

**The worked case (S216, 2026-08-31).** The one-pool funding mock rendered its
institution table as three grids sharing
`grid-template-columns: 2.2em minmax(0,1fr) 5em 5em 6.2em 6.2em`:
the header at `.74rem`, the SYSTEM row at `.95rem`, the college rows at
`1rem`. The header's numeric columns therefore resolved ~25% narrower than the
rows' (6.2em = 73px vs 99px), the `1fr` column absorbed the difference, and
every header label sat visibly right of its values. It read as a broken
`text-align` — Sam's screenshot asked for the headers to be "centered" — but
no alignment rule could fix it, because the header's columns were not over the
rows' columns at all. Switching all three templates to one `rem` set
(`2.2rem minmax(0,1fr) 6rem 6rem 7.5rem 7.5rem`) fixed alignment and
centering in one edit.

**Why it deceives.** The stylesheet LOOKS consistent — identical template
strings — and each grid is internally coherent, so nothing errors and nothing
overflows. The defect only appears in the relationship between elements, at
whatever font-size ratio they happen to carry, and it moves whenever a
font-size does. A reviewer diagnosing from the rendered page reasonably names
the wrong property (alignment), and a fix aimed there cannot land.

**The rule of thumb.** `em` in a grid template is right only when the grid
should scale with its own text (a chip sized to its label). The moment two
elements must agree on column geometry, the template is shared LAYOUT, not
per-element typography — put it in `rem`, or better, put both elements in one
grid (`display: contents` on the wrapper, or one grid with `subgrid` where
support allows). The live tab avoids the whole class by using a real
`<table>`; the mock's lesson applies to any grid-as-table composition.
