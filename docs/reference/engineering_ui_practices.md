---
title: "Engineering & UI practices (CLAUDE.md offload)"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, engineering, ui, first-light, claude-md-offload]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
---

> **Moved verbatim from `CLAUDE.md` on 2026-08-28** (Session 206, the
> consolidation), under the assignment rule: *push what a session cannot know
> to ask for, pull everything else.* The **rule** of each practice stayed in
> `CLAUDE.md` — it has to fire unprompted when you write CSS, a table or a
> test. The **evidence** is here: the measurements, the worked failures, the
> contrast maths, the token names. Read it when you are doing the thing.
>
> This is always-current practice, not an archive. Update it here.

# Engineering & UI practices

From a retrospective Sam asked for (Session 32, 2026-06-04). These are
lightweight standing practices — honor them in normal work.

- **Commit your verification.** Front-end (consumer JS) changes get a jsdom test
  under `tests/` (run with `npm test`; `tests/run.js` auto-discovers
  `tests/*.test.js`). Don't write a throwaway `/tmp` test and discard it — a test
  worth running once is worth committing. Make it guard the *failure mode* (e.g.
  the CER test injects a `raw_variants:null` row to guard the search/expand
  crash). `node_modules`/`package-lock.json` stay gitignored; CI
  (`.github/workflows/js-tests.yml`) runs `npm install && npm test` as a
  **non-required** check (never gates merge-on-green). See
  [`docs/kb-notes/methodology-commit-the-test-harness.md`](docs/kb-notes/methodology-commit-the-test-harness.md).
- **New CSS uses `var(--token)`, never a raw hex.** The `:root` block (top of both
  HTMLs) holds the brand + surface/text/link tokens. If a role is missing, add a
  token (in BOTH HTMLs — Rule 4) rather than inlining hex. Palette + canonical
  components (chip, badge, table, curate affordance):
  [`docs/kb-notes/reference-ui-design-system.md`](docs/kb-notes/reference-ui-design-system.md).
- **Prefer injecting tab CSS from the tab's JS** (the CER `ensureCerScopeCss()`
  pattern) over editing the HTML `<style>` blocks — JS is one static file, so it
  covers both HTMLs without a Rule-4 mirror. Only the global `:root` tokens need
  the mirror.
- **No horizontal scroll whenever feasible (Sam, 2026-06-11).** Tables/grids
  fit the viewport at desktop widths: tighten cell padding/fonts, truncate
  long text cells with ellipsis + the full value in `title`, fold redundant
  suffixes ("X Community College District" → "X CCD"), shorten headers
  (`P1`/`P2`/`P3` + a `title`), and prefer drill-in rows over extra columns.
  Keep `overflow-x: auto` on the wrapper only as the narrow-screen safety
  net — never as the default desktop experience. (First applied: the
  Implementation Funding college table. Hardened on the CCR, Session 43:
  `table-layout:fixed` + explicit colgroup — auto layout had silently parked
  columns past the wrap's right edge, per filtered row set; see
  [`docs/kb-notes/methodology-fixed-table-layout-off-pane-columns.md`](docs/kb-notes/methodology-fixed-table-layout-off-pane-columns.md).)
- **ARTIFACTS AND PROTOTYPES USE FIRST LIGHT TOO — accessible and mobile-friendly
  (Sam, 2026-08-19).** *"Make sure it is based on our First Light design and make it
  always accessible and mobile friendly."* This is not only a dashboard-CSS rule: a
  session built a decision artifact on an invented palette while the house spec sat in
  the repo. **Do not invent a palette.** Spec:
  [`docs/kb-notes/reference-ui-design-system.md`](docs/kb-notes/reference-ui-design-system.md)
  + `prototype/first_light_theme_v1.html` v1.6 — warm monochrome base, five accents one
  job each, Playfair Display + Source Sans 3, `var(--token)` never a raw hex (**derived
  tints get their own tokens**), and **tables never on glass**.
  **Accessible means verified, not claimed:** compute every fg-on-bg pair actually used
  (including zebra rows and glass composites) against AA 4.5:1 / 3:1 —
  `prototype/check_contrast.py` holds the maths; **color is never the only signal**, so
  pair every accent with a word or an approved mark (▲▼ ✓ ⚠) — that is what "always
  glyph-paired" is for, and it does **not** conflict with the no-cheesy-glyphs rule
  (decorative out, state-bearing stay, muted and simple); `th scope` on every header
  cell; a focusable `aria-label`led region around any scrolling table; skip link;
  `:focus-visible`; `prefers-reduced-motion`. **Mobile:** single column below ~560px,
  `clamp()` type, no fixed widths, wide tables scroll inside their own container so the
  body never scrolls sideways. ⚠️ `--border-strong` on white is 1.92:1 — a KNOWN spec
  exemption (decorative; header identity comes from `th scope` + typography), do not
  "fix" it by deviating. ⚠️ First Light is a **light** identity with no dark PAGE palette
  (only on-dark ACCENT grades) — commit single-theme and paint every color explicitly.
- **PROSE RUNS THE FULL WIDTH OF WHATEVER SITS BESIDE IT (Sam, 2026-08-22).** *"I
  would like the full width format rule on throughout COBI."* A ~74ch measure beside a
  full-width table reads as a block that failed to fill its container, not as a reading
  aid. The lever is the token **`--cpl-measure: none`** on `:root` in BOTH HTMLs
  (Rule 4); every prose cap is `max-width:var(--cpl-measure,none)` — **the `,none`
  fallback is load-bearing** because most of these rules ship from a tab's own JS onto
  surfaces that never declare the token. ⚠️ **A cap below ~55ch is LAYOUT, not a
  measure** (cell truncation, a raw-value column, a badge, a short hero lede) and must
  NOT be swept; `tests/cobi_prose_measure.test.js` pins a sample of them so a future
  blanket sweep fails. ⚠️ Grep **px too** — four tab intros were capped at 880/760px.
  Two columns is the sanctioned alternative, but only where blocks run long; most COBI
  blocks are 1–3 lines and would stack as one-liners.
  [`methodology-a-text-measure-must-agree-with-what-sits-beside-it`](docs/kb-notes/methodology-a-text-measure-must-agree-with-what-sits-beside-it.md)
- **Prototype UI in a fast-feedback canvas, then port.** For a new tab or visual
  rework, iterate the look in a Claude artifact / claude.ai (live preview), lock
  it with Sam, then implement into the monolith. In-repo analog: the EACR
  versioned prototype gallery.
- **Stop-hook:** the repo carries the canonical
  [`scripts/stop-hook-git-check.sh`](scripts/stop-hook-git-check.sh) (install:
  `cp scripts/stop-hook-git-check.sh ~/.claude/`). It ignores GitHub's own
  squash-merge commits, so the "Unverified `noreply@github.com`" nag after a
  squash-merge + `reset --hard origin/main` is gone — that commit is on `main`
  and must NOT be amended (Rule 5).
