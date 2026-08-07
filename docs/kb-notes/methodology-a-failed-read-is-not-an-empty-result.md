---
title: A failed read is not an empty result — and an optimistic write must precede its repaint
created: 2026-08-07
updated: 2026-08-07
tags: [methodology, front-end, error-handling, optimistic-ui, trust, governance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/kb-notes/methodology-a-test-that-writes-to-the-queue-it-monitors]]"
artifacts:
  - governance.js
  - tests/governance.test.js
---

# A failed read is not an empty result

> **One-sentence summary** — three defects in one small editor all had the same shape: the interface stated
> something confidently that it had no basis for, and in every case the *data was fine* and only the screen lied,
> which is the failure mode users cannot detect and therefore cannot report accurately.

## The three, in the order they hurt

### 1. `r.ok ? r.json() : []` — a network error rendered as a fact

```js
.then(function (r) { return r.ok ? r.json() : []; })
...
state.owners = by;      // by = {} on ANY non-ok response
```

A 401, a 500 or a changed RLS policy produced an **empty owner map**. On a page whose entire purpose is showing
who is accountable, every colleague's assignment vanished and the red "rows with no owner" count jumped to its
maximum — with nothing on screen saying a read had failed.

It is indistinguishable from someone having deleted the assignments. A user seeing it would reasonably conclude
the data was lost and go looking for who did it.

**The rule:** an empty result and a failed request are different facts and must never collapse into the same
render. Throw on non-ok, keep the last known-good value, and say the read failed:

```js
.then(function (r) { if (!r.ok) throw new Error("owners " + r.status); return r.json(); })
.then(function (rows) { state.owners = index(rows); state.ownersStale = false; })
.catch(function () { state.ownersStale = true; });   // owners NOT wiped
```

`[]` as an error fallback is the tempting version because it keeps the happy path simple. It buys that
simplicity by lying.

### 2. An "optimistic repaint" that repainted the old state

```js
close();
render(root);                        // ← paints the PRE-change state
saveOwner(id, name, note).catch(…)   // ← this is what writes state.owners[id]
```

The optimistic local write lived *inside* `saveOwner`, so the repaint ran before it. Nothing repainted on
success either — only the `.catch` re-rendered.

The reported symptom was *"the save button doesn't work the first time; reopen and click again and it takes."*
The real behaviour was worse and more general: **the UI was always exactly one write behind.** A third save
typing a new name still displayed the previous one. It only *reads* as "second time works" because the dialog
pre-fills from the same state, so the user re-submits the identical string and the stale paint coincidentally
matches what they intended.

**The rule:** if a save function performs the optimistic write, the repaint must come after it — and say so in a
comment, because the correctness depends on that function's internal *mutate-then-fetch* ordering. A later edit
moving the write into a `.then` silently restores the bug.

### 3. A cached view that never re-read after the user's permissions changed

```js
if (state.reg) { render(root); return; }   // never re-fetches
```

The gated reads were skipped while logged out. So a tab first opened logged-out kept those empty results
forever: sign in, come back, and the page looks fully populated while every owner is missing and a cadence is
accused **in red** of having never run — all of it an artifact of requests that were never made.

**The rule:** cache on *what the load was allowed to see*, not merely on whether a load happened.

```js
if (state.reg && state.loadedSignedIn === signedIn()) { render(root); return; }
```

## Why all three shipped

Every pre-existing test passed straight through them. They set state directly and called `render()` — none drove
the `button → dialog → Save` path a user actually takes. A test that constructs the end state cannot catch a bug
in *how the end state is reached*.

The regression tests that now guard these drive the real path and assert the **in-flight moment**: the stubbed
`fetch` never settles, so the optimistic write is the only thing that can make the value appear. Reverting each
fix turns them red — which is the only evidence that a regression test is real.

```js
openBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
dlg.querySelector("#gov-own-name").value = "Jessica";
dlg.querySelector("[data-own-save]").dispatchEvent(new w.Event("click", { bubbles: true }));
check("⚠ the name is VISIBLE after a single Save", /Jessica/.test(r.innerHTML));
```

## The generalisable pattern

These are three instances of one class: **the interface asserting something it has no basis for.**

| The lie | What the user concludes | What was actually true |
|---|---|---|
| "Nobody has an owner" | Someone deleted the assignments | A request returned 401 |
| "Your save didn't take" | The button is broken | It saved on the first click |
| "This cadence has never run" | The process is broken | Nobody ever asked the server |

In all three the underlying data was correct. **A UI that is wrong while the data is right is the hardest defect
class to report**, because the person reporting it describes the symptom they can see — *"the button needs two
clicks"* — which points away from the cause. Take those reports as a description of the *symptom only*, and go
find what the screen is asserting without evidence.

> When a surface cannot know something, it must say it cannot know it. Silence and zero are both answers, and
> neither one is honest.
