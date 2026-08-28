---
title: A one-shot hand-off must not consume what it cannot deliver
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, ui, state, silent-failure, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what]]"
artifacts:
  - cpl_chat.js
  - sierra_training.js
  - tests/sierra_test_handoff.test.js
---

# A one-shot hand-off must not consume what it cannot deliver

> **One-sentence summary** — when one surface parks a value for another to pick
> up, clear the parking slot only *after* the value lands somewhere real, and
> resolve the destination from the DOM rather than from a module-level reference
> that a second mount may have re-pointed.

## Context

Sierra Training's "🧪 Try it on Sierra" parks a logged question in
`sessionStorage` and navigates to `#chatbot`, where the assistant picks it up and
prefills its input. Sam reported it plainly, mid-triage:

> *"tried to use Try it With Sierra button but it didn't copy the question into
> Sierra and when I tried to copy and paste the question, it doesn't the training
> tab doesn't allow it."*

Three defects, and the reason it took a report rather than a code read to find
them is that **all three fail silently**. A button that does nothing is
indistinguishable from a button that is not wired up.

## The two mechanisms

### 1. The slot was emptied before the value was placed

```js
q = sessionStorage.getItem(KEY);
if (q) sessionStorage.removeItem(KEY);   // ← consumed here
if (!q || !inputEl) return;              // ← abandoned here
```

If the consumer runs before the destination exists — a tab-activation event that
fires ahead of the mount, a pane not yet built — the value is read, deleted, and
dropped. The damage is not the failed delivery; it is that **the retry is also
destroyed**. The user clicks again and nothing happens, because there is nothing
left to deliver.

The rule: `removeItem` goes *after* the successful assignment, never before the
guard. A hand-off that cannot land should stay pending and complete on the next
activation.

### 2. The destination was a module-level reference, and the widget mounts twice

`cpl_chat.js` keeps `inputEl` at module scope. The same widget is mounted in two
places — the `#chatbot` tab and, since Session 143, embedded in My College — and
`build()` re-points `inputEl` at whichever host it just rendered into. `mount()`
is idempotent via a `data-cplchat-mounted` flag, so **returning to `#chatbot`
never re-points it back**.

Net effect: after one visit to My College, every hand-off for the rest of the
session typed the question into a hidden pane. The widget was working; the
reference was pointing at the wrong instance of it.

The rule: a hand-off addressed to a *specific surface* must resolve that
surface's element from the DOM at delivery time —

```js
function chatbotInputEl() {
  var pane = document.getElementById('tab-chatbot');
  return (pane && pane.querySelector('#cplchat-input, .cplchat-input')) || null;
}
```

— and fall back to the module reference only as a last resort. "Which input?" is
a question about *where the user is*, not about *what the module last built*.

## The generalization

**A shared module-level element reference is a cache of a DOM lookup, and it goes
stale exactly when a second mount appears.** The second mount is usually added
later, deliberately, as a feature ("embed the same assistant in My College") — so
the reference was correct when written and silently became wrong. Nothing warns
you: the assignment still succeeds, into an element that is no longer on screen.

Two smells worth grepping for when a UI hand-off "does nothing":

- a module-level `var someEl` assigned inside a `build()`/`render()` that more
  than one host calls;
- a `removeItem` / `delete` / queue-pop that precedes the guard which can abort
  the operation.

## Testing it

The test must reproduce the *two-mount* condition, not just the happy path — the
happy path passed throughout. `tests/sierra_test_handoff.test.js` builds a jsdom
page carrying **both** panes, calls `mountInto()` on the second, and only then
fires the activation:

```js
w.CPL_CHAT.mountInto(w.document.querySelector("#tab-my-college .cplchat-mount"));
w.sessionStorage.setItem(KEY, Q);
activateChatbot(w);
check("the question lands in the CHATBOT input, not the hidden one", cb.value === Q);
check("the hidden My College input is NOT filled", mc.value !== Q);
```

Run against the pre-fix file, 5 of its 18 checks fail. **That verification is the
point** — a test written after a fix that passes on both versions guards nothing,
and this one was only trustworthy once the old file had been shown to fail it.

## Related silent no-ops fixed in the same pass

Both are the same class — a control that fails and says nothing:

- The action handler did `if (!q) return;` when a row carried no question. It now
  says so on the button.
- `copyText()` called `navigator.clipboard.writeText(q).then(flash, function(){})`
  — an **empty rejection handler**. The async clipboard rejects in entirely
  ordinary situations (unfocused document, permissions policy, non-secure
  context), so "⧉ Copy question" could do nothing at all. It now falls back to
  `execCommand` and, if both fail, tells the user to select the text manually.

## See also

- `methodology-a-collapsed-section-must-still-inform` — the sibling rule that
  open/closed state lives in `state`, not the DOM, because `render()` rewrites
  `innerHTML`.
- CLAUDE.md §11 *Sierra Training (the trainer)*.
