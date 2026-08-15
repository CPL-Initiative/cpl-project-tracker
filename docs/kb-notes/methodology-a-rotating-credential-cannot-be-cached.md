---
title: A rotating credential cannot be cached
created: 2026-08-15
updated: 2026-08-15
tags: [methodology, auth, supabase, frontend]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - cpl_session.js
  - tests/cpl_session.test.js
---

# A rotating credential cannot be cached

> **One-sentence summary** — when refreshing a token *consumes* it, any module
> holding a copy is holding a credential that may already be spent, and spending
> it again is not a harmless retry: it reads as theft and can end the session.

## Context

The dashboard keeps a Supabase reviewer session in `cpl_sb`. Twenty-six modules
read it; a dozen can renew it via `refresh_token`. Supabase **rotates** refresh
tokens: a successful exchange returns a new one and invalidates the old, and
reuse outside a short interval is treated as a stolen-token signal.

Adding `cpl_session.js` — a keeper that renews on a timer — made this live.

## The claim

**A cached copy of a rotating credential is a time bomb whose fuse is lit by
someone else's success.**

Six modules renewed from a session they had captured earlier rather than
re-reading storage:

| Module | How it held the session |
|---|---|
| `raci.js`, `mission_control.js`, `team_phrases.js` | `var s = state.sess` |
| `project_add.js`, `project_lifecycle.js` | `ensureFresh(s)` — the caller's copy |
| `unified_courses.js` | a module-level `session` |

Each was correct *in isolation*. The moment anything else renews, every one of
those copies holds a consumed refresh token — and three of the six **drop the
session on any refresh failure**, so the user is silently signed out mid-edit.

That is strictly worse than the expired-token bug the keeper was built to fix:
an expired token at least prompts you to sign in again.

### The rule

**Resolve a rotating credential from its single source of truth at the moment of
use — never from a variable captured earlier.** One line:

```js
var s = getSession() || state.sess;   // storage first, cache as fallback
```

### The corollary about failure handling

`raci.js` dropped the session on *any* refresh rejection. Combined with rotation
that is doubly wrong, but it is wrong on its own too: a network blip, a 5xx or a
timeout is not evidence the credential is dead. Only a definitive **400/401**
from the auth server ends a session; everything else keeps it and retries.

Failing "safe" in an auth path usually means failing *destructive* — the user
loses their session and whatever they were about to write.

## How we got here

The hazard was already known in this repo and had not spread.
`credential_reference.js` carried the fix and the reason in its comment:

> *a sibling module (CCR/RACI) rotated is picked up instead of re-spending a
> consumed refresh token*

One file learned it; nine did not. A keeper that renews on a timer promotes a
rare collision into a routine one, so the rule had to hold repo-wide before the
keeper could ship. Enforced by a static guard in `tests/cpl_session.test.js`
that fails if any `ensureFresh()` can refresh without first reading storage —
because a rule depending on the next author remembering it fails on their first
day.

## Consequences

- **Before adding a background renewer, audit every existing renewer.** The new
  component is usually safe; the danger is what it makes newly-frequent.
- **A documented fix in one file is not a repo-wide fix.** If the reason is
  general, either enforce it mechanically or expect nine copies of the bug.
- **Distinguish "the server said no" from "the server did not answer"** in every
  credential path, and only let the first one destroy state.
