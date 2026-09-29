---
title: A guard whose protection depends on the order you work in is worse than no guard
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, generators, tooling, remediation, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-generator-that-lags-its-output-is-a-trap]]"
  - "[[docs/kb-notes/methodology-ship-generator-changes-live-on-merge]]"
artifacts:
  - kb/_glyph_sweep.py
  - tests/glyph_sweep_test.py
---

# A guard whose protection depends on the order you work in is worse than no guard

> **One-sentence summary** — A tool that edits generated output will silently
> undo itself on the next generator run; a guard against that is only worth
> having if it holds under every order of operations, and the first one written
> here reported a confident number that fell from 13 to 2 purely because the
> generator had been fixed first.

## Context

On 2026-09-09 a sweep tool was pointed at COBI's whole rendered surface to strip
emoji from control labels — 139 files, an authorized mechanical pass. Two of
those files are `CPL_Dashboard.html` and `index.html`, which
`excel_to_dashboard.py` **regenerates section by section every day**.

Measured before anything ran: of the 16 rewritable sites in the dashboard HTML,
**13 lived inside a section the generator replaces wholesale.** A naive sweep
strips them, the test suite goes green, the change is committed and reported as
done — and the next cron run puts all 13 back. Nothing fails. Nobody is told.

That is the ordinary Rule 1 hazard ("change the generator, not the HTML"), and
it is worth restating only because a *remediation tool* meets it at scale: the
tool's whole value is that it edits many files without a human reading each one,
which is exactly the condition under which a silent revert goes unnoticed.

## The part that was not obvious

The first guard asked a reasonable question: **does this exact glyph-and-label
appear as a literal in the generator's source?** If yes, the generator writes it;
hold back and fix the generator instead. It was tested, it worked, and it held
back 13 of 16 — the right answer.

Then the generator was fixed *first*, and the same guard on the same HTML held
back **2**.

Nothing had gone wrong. The fragment test asks whether the generator *currently*
contains the string, and fixing the generator removes the string. The HTML's
stale copies instantly read as nobody's. The guard did not fail loudly; it
returned a smaller number with the same confidence.

> **A guard whose protection depends on the order you happen to do things in is
> worse than no guard at all** — because it reports a plausible number either
> way, and the number is the only thing anyone reads.

## What to do instead

Make the test **positional** — is this site inside a region the generator
replaces? — because a region boundary does not move when the generator's content
changes. But a positional test has its own blind spot: it is only as complete as
the list of boundaries, and here one generated block (`render_algo_details()`)
sits inside none of the marked regions.

So the guard is the **union of both tests**, and the union is the point:

| test | catches | blind spot |
|---|---|---|
| position | anything inside a replaced section | only as complete as the marker list |
| fragment | generated blocks with no marked region | stops seeing a site once the generator is fixed |

Each covers the other's failure. Measured on the original HTML: position alone
13 of 16 counting one differently, fragment alone 13, **union 13 — and only the
union still says 13 after the generator is fixed.**

Then pin it. Two tests matter more than the rest:

- **the order-independence test** — assert the site is still held when the
  generator no longer contains it. This is the one that would have caught the
  original defect, and it is not obvious to write, because the first
  implementation passed every test anyone thought to write about *whether* it
  held things back.
- **a drift test** — assert every boundary marker still exists in the generator
  source. A renamed marker otherwise turns the guard into an expensive no-op
  that keeps printing reassuring output. Verified by renaming one and watching
  the test go red.

## The general shape

Whenever a guard's answer is derived from mutable state that the same session is
also editing, ask: *what does this report if I do the two steps in the other
order?* If the answer changes, the guard is measuring the state rather than the
hazard. Reach for something the edit cannot move — a position, a boundary, an
invariant — and keep the state-based test only as a second opinion.

This is the same failure family as `check_generated.sh` being run first instead
of last, and as a memoized signature that does not carry everything it depends
on: **a cache, a guard and a checklist all lie in the same way, by answering
confidently from a premise that has since moved.**
