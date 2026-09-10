---
title: "A token that cannot flip is a surface that cannot theme — the four shapes, and why every one of them reads as correct code"
created: 2026-09-09
updated: 2026-09-10
tags: [methodology, ui, design-system, dark-mode, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-token-with-two-jobs-cannot-be-themed]]"
  - "[[reference-ui-design-system]]"
  - "[[docs/reference/lanes/cobi-dark-mode]]"
---

# A token that cannot flip is a surface that cannot theme

Sam, 2026-09-09, with three screenshots of COBI in dark mode: *"the remaining
COBI surfaces that are still not responsive to dark mode … and there are many
more."* He was right, and the interesting part is **why** there were many after
three sessions of sweeping.

The remainder was never "a long tail of raw hexes." It was **four kinds of token
that cannot change value between themes**, each of which reads as correct,
tokenized code. A raw `#ffffff` is caught by grep and by review. These are not.

## The four shapes

**1. The phantom token.** `background: var(--surface-2, #eef3f9)` where
`--surface-2` is defined nowhere. The fallback paints in **both** themes. 26
sites across seven files, worth 19 of 128 dark contrast findings — the single
largest cause in COBI, and invisible because the declaration reads as themed.
Detection is mechanical and needs no browser: collect every `--x:` definition
across the codebase, collect every `var(--x, …)` reference, and subtract.

**2. A token named for a color, not a role.** `var(--white)` is `#FFFFFF` in
every theme *by definition* — the name forecloses the flip. A ground built on it
is frozen while every ink on it moves: `.project-card` painted its title
`#ECE9E2 on #FFFFFF` at **1.21:1**. The fix is the role token
(`--surface-opaque`), whose light value is the same `#FFFFFF`, so the swap is
provably light-neutral. ⚠️ The one legitimate `var(--white)` ground is
`@media print` — paper is white.

**3. A fill and its ink that disagree about whether they flip.** Three cases,
and only the middle one is obvious:

| fill | ink it needs | why |
|---|---|---|
| flips (`--cobalt`, `--navy-primary`) | one that flips (`--on-accent`) | white ink dies when the bar turns light |
| does not flip (`--mustard-fill`, `--seal-blue`) | one that does not (`--on-mustard`, `--white`) | a flipping ink dies when the bar stays put |
| flips | inherits | usually right — the inherited body ink flips too |

⚠️ **Count the token's uses by role before you decide which case you are in.**
`--navy-primary` measured **551 INK vs 26 FILL**, so flipping it was correct and
the fills are collateral. `--seal-blue` measured **65 FILL vs 20 INK**, which is
why this repo deliberately never flips it. Same question, opposite answers, and
only the measurement tells you which.

**4. A component that keeps theme state of its own.** `cip_crosswalk.js` had its
own button, its own `localStorage` key, and a 108-ground palette gated on its own
**class**. ⚠️ **It survived four rounds of this work because it used neither
`data-theme` nor `prefers-color-scheme`** — the two spellings every previous scan
grepped for. The lesson is not "grep harder." It is that **a search for known
spellings cannot find an unknown one**, so the durable check is a behavioral
invariant: *no component may persist a theme of its own, whatever it calls it.*

## Why the contrast sweep is necessary and not sufficient

`npm run a11y cobi-dark` reports what it **paints**. Annual Report showed **2**
findings while both of its panes were white in Sam's screenshot, because that
tab builds its content on demand and the sweep sampled it empty. The structural
scan has the opposite failure mode — it flags what may never render — so the two
are complements, and neither is the whole picture:

- **the sweep** finds what is wrong on screen, and misses what is not drawn yet
- **the scan** finds what cannot be right in principle, and over-reports

Run both. Fix what the sweep names; use the scan to know how much is left.

### ⭐ And the sweep's finding count is not an acceptance test (measured 2026-09-10)

The sharper form of the same point, with a number. S249 defined the remaining
**21 phantom tokens** — 62 uses across fourteen files — and the dark sweep moved
**66 → 67**. Measured both ways on one tree with `git stash`, and the diff of the
two finding lists is **empty in one direction**: not a single one of the 62 uses
was ever being sampled, so not one could be reported fixed. `.cplccr` chips,
`.cplmem` cards, `.mtq` items, `.tphx` cards and `.grx` boxes are all built on
demand. (The one extra line was a surface the earlier run simply had not
sampled — a real, pre-existing defect that the run happened to surface.)

So a token-layer fix cannot be accepted or rejected on the finding count. **Ask
the token layer directly instead:**

```js
// load the page once per theme, then, on each:
const cs = getComputedStyle(document.documentElement);
for (const t of TOKENS) console.log(t, cs.getPropertyValue(t).trim());
```

A dark-only definition is correct when the token reads its intended value under
`data-theme="dark"` and reads **empty** under `data-theme="light"` — empty is
the point, because that is what leaves each site's own fallback in place. 21/21
held, which is also a stronger proof that no light pixel moved than the light
sweep gives (that merely agreed: 63 → 63, byte-identical).

⚠️ **Falsify the probe.** Its first version could not fail — it compared the
light value against `""` after an `|| "(unset)"` coalesce, so every token read
BAD while the data underneath was perfect. Defining one of them in the light
`:root` must flip that token, and only that token, to BAD.

## Verify a screenshot against `main` before you chase it

Sam's third screenshot showed the Annual Report panes white. They had been fixed
five commits earlier — `git merge-base --is-ancestor` proved the fix was on
`origin/main`, so the screenshot was a **cached asset**, not a defect. Two
minutes of git saved a day of chasing a fix that already existed. (The sandbox
cannot reach the Pages site — the proxy returns 403 — so check git, not the URL.)

## The guard that could not fail

Both pairing checks in `tests/cpl_theme.test.js` were single regexes requiring
`color:` to sit **immediately** after `background:`, in that order. Every defect
that actually shipped broke one of those two assumptions —
`background:var(--cobalt);border-color:…;color:#fff` puts a declaration between
them, and `.adm-warn{color:…;background:…}` writes the ink first. Both checks
were green against four real defects. They now parse the declaration block.

⚠️ **And the fix for that had the same disease.** Narrowing the match to the
outermost `var()` returned the bare token name while every regex matched on the
`var(--` prefix, so both checks silently stopped firing again. It was caught only
by **reverting each fix and watching the suite stay green** — which is the entire
reason that pass exists, and the third session running to find a check of this
shape.
