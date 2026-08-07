---
title: Judge a detector by what it prints — filters are only observable in their output
created: 2026-08-07
updated: 2026-08-07
tags: [methodology, detectors, static-analysis, governance, signal-to-noise]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-test-that-writes-to-the-queue-it-monitors]]"
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
artifacts:
  - kb/_build_governance_candidates.py
  - kb/governance_surface_map.json
  - tests/governance.test.js
---

# Judge a detector by what it prints

> **One-sentence summary** — a detector's filters cannot be reviewed by reading the code, because a filter that
> is subtly too loose and one that silently matches nothing both look perfectly reasonable on the page; run it,
> read the list as the person who has to act on it, and tune until that list is worth finishing.

## The setting

A drift detector proposing governance-register rows that ought to exist: scheduled jobs with no cadence row,
tables a human curates with no decision right, dashboard tabs that change shared state, and the inverse sweep
for rows citing files that no longer exist.

Both filter bugs below survived writing, re-reading and commenting the code. **Both were obvious within seconds
of printing the output.**

## Bug 1 — the filter that was too loose

```python
if not any(m in body for m in WRITE_METHODS):   # does this FILE write anything?
    continue
tables = set(re.findall(r'REST\s*\+\s*"/([a-z0-9_]+)', body))
```

Reads fine: *"tables referenced by a file that writes."* But one file `POST`s to a single table and merely
**reads** six others, so all seven were flagged — including a view that is read-only by construction.

The tell was in the output: a candidate whose name (`*_gaps`) announced it was a derived view. The fix is to
bind the write to *that reference*, not to the file:

```python
window = body[m.end():m.end() + WRITE_WINDOW]
if not re.search(r'method:\s*["\'](%s)["\']' % "|".join(WRITE_METHODS), window):
    continue
```

**Bias to precision, deliberately.** A missed surface is a quiet gap a human can still fill by hand. A false
positive is noise — and noise is what makes the whole list ignorable, which loses every true positive with it.

## Bug 2 — the filter that silently matched nothing

```python
blk = re.search(r'data-tab="' + tab + r'"[\s\S]{0,4000}?loadScript\(\'([\w]+\.js)\'', html)
```

Also reads fine. It returned **zero results, forever**: a tab's nav button and its `loadScript` sit ~1.2 million
characters apart in that document. The association had to come from the boot dispatch
(`onActivate('tab', … loadScript('x.js'…)`), not from proximity.

⚠️ **This is the more dangerous of the two, and the reason "it ran without errors" means nothing.** A scan
returning zero is indistinguishable from a scan finding nothing wrong. It reports *good news*. Nobody
investigates good news.

> For every scan, ask once: **what would this look like if it were broken?** If the answer is "the same as a
> clean result", it needs a canary — a known-present case it must find, asserted in a test.

## The output is the design review

The first complete run produced **39 undifferentiated candidates**. Nothing was wrong with any single one; the
list was simply unreadable, and an unreadable list is a detector that does nothing. Three changes made it usable,
and none of them were code-quality changes:

1. **Persistent memory** (`governance_surface_map.json`) — every surface is *mapped* to an existing row or
   *dismissed with a reason*. A candidate is something nobody has ruled on yet. 39 → 15.
2. **Grouping and ranking** — a register row that is actively **wrong** outranks one that is merely missing;
   recurring loops outrank data surfaces. The first five rows have to be the five worth acting on.
3. **Disclosing the denominator** — the strip says how many were mapped and how many dismissed, so the short list
   reads as *filtered*, not as *all we could find*.

Dismissal lives in a **committed file rather than a database**, on purpose: the reason is reviewable in a diff
and cannot silently diverge from the register it annotates.

## Put the noise budget in a test

The failure mode is gradual. Filters decay as the codebase grows, and no single commit makes a list unreadable.
So make the threshold explicit and let CI hold it:

```js
// 39 was the unfiltered first draft. If it climbs back there, the filters have
// stopped working and the strip is on its way to being ignored.
check("⚠ the candidate list stays readable (< 25)", d.candidates.length < 25);
```

This is the same lesson as the feedback queue that went unread for five weeks with 53% of its rows written by
CI — except here it is caught before anyone is asked to read it. **A detector's real output is not the list; it
is whether a busy person finishes the list.** That is a number, so assert it.

## Checklist for the next detector

- Run it before reviewing it. Read the output as the person who must act.
- For each scan: what would a *broken* version print? If it is "nothing", add a canary.
- Bias to precision; a false positive costs more than a miss.
- Give it memory, so a judgment made once is not re-asked daily.
- Group and rank; disclose what was filtered out.
- Commit a numeric noise budget as a test.
- **Propose, never auto-apply**, wherever the missing field is a judgment call.
