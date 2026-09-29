---
title: A test must report a missing thing, not dereference it
created: 2026-08-25
updated: 2026-08-25
tags: [methodology, testing, verification, guards]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - tests/cpl_memory_curate_actions.test.js
  - tests/ccr_skyview_first.test.js
  - tests/gr_revision_edit.test.js
---

# A test must report a missing thing, not dereference it

> **One-sentence summary** — a suite that throws when a feature is absent stops
> running, so every check below it goes unreported while the exit code says only
> "something failed" — which is indistinguishable from a suite that ran clean.

## Context

The house practice is to perturb each guard on its own and confirm it goes red.
That practice is only as good as the suite's ability to *report*. On 2026-08-25 a
perturbation reported **0 FAIL** five separate times in one session, and each
time the suite had crashed on an absent DOM node or an absent stored value:

```js
q(w, "#uc-map-pane iframe").getAttribute("title")   // TypeError when the flip is reverted
JSON.parse(a.localStorage.getItem(KEY)).at          // TypeError when the shared write is removed
[...menu].find((b) => /^Stale/.test(b.textContent)).click()   // TypeError when the menu is gone
```

Counting `FAIL` lines gave zero. The exit code was 1, so the suite had *not*
passed — but a summary that reads "0 FAIL" beside "exit=1" invites the wrong
conclusion, and worse, **the checks after the crash never ran at all**. One
perturbation looked like it proved a guard while leaving eighteen assertions
silently unexecuted.

This is the S190 `exit=0 was my trailing grep` failure one layer in: there a red
suite passed for green because of a shell pipeline; here because of a throw.

## The rule

**Never dereference a possibly-absent element or value inline in an assertion.**
Read it through an accessor that reports absence as a value:

```js
const disp = (w, sel) => { const e = q(w, sel); return e ? e.style.display : "∅ no element"; };
const attr = (w, sel, a) => { const e = q(w, sel); return e ? (e.getAttribute(a) || "") : ""; };
function clickOrFail(el, label) {
  if (!el) { check("(!) the control exists to click: " + label, false, "not rendered"); return false; }
  el.click(); return true;
}
```

A missing control then produces a **named failure** — and the sections below it
still run, so one perturbation shows the whole blast radius instead of the first
symptom.

## Why it matters beyond tidiness

- **A perturbation that crashes proves less than one that fails.** It tells you
  something broke; it does not tell you *what the guard was protecting*.
- **The truncation is invisible in the summary.** Nothing prints "18 checks did
  not run".
- **It compounds with the mock.** In the same session a fetch mock that answered
  the module's async read with `[]` wiped a seeded fixture on the first `await`,
  which renders identically to the feature failing to draw. Mocks should answer a
  read with the fixture, not with empty.

## Companion rule

**A perturbation that fails to perturb proves nothing.** Twice in the same
session a `str.replace()` anchor matched twice or produced a syntax error, the
edit silently did nothing or broke the parse, and the suite passed unchanged —
which looks exactly like a guard holding. Assert on the substitution (`count == 1`)
and confirm the file still parses before drawing any conclusion from the run.

## Checklist

- [ ] No assertion dereferences a query result inline.
- [ ] A missing control is a reported failure with a name.
- [ ] Read mocks answer with the fixture, not `[]`.
- [ ] Perturbation scripts assert their anchor is unique, and the target still parses.
- [ ] Conclusions come from the **exit code**, never from a `grep -c FAIL`.
