---
title: A feature-test on a method that does not exist is indistinguishable from the feature being absent
created: 2026-09-11
updated: 2026-09-11
tags: [methodology, javascript, defensive-coding, testing, auth]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - college_identity.js
  - tests/college_identity_auth.test.js
  - team_phrase.js
---

# A feature-test on a method that does not exist is indistinguishable from the feature being absent

> **One-sentence summary** — `if (obj && obj.method)` cannot tell a misspelled
> method from an unmounted module, so a typo inside that guard takes the
> graceful-degradation path forever and reports its own symptom as an expected
> state.

## Context

COBI's College Identity tab exists to show every entity MAP knows, with its
college ID, district, MIS codes and name variants. On 2026-09-11 Sam opened it
and asked where the table was — he saw only the lint findings. The table had
been built since the tab shipped and had **never once rendered**, for any
visitor, on any sign-in. Full story: [`docs/college_identity_lessons.md`](../college_identity_lessons.md).

## The claim

Optional-dependency guards are written to survive a module not being present:

```js
if (window.CPL_TEAM_PHRASE && window.CPL_TEAM_PHRASE.headers) {
  h = window.CPL_TEAM_PHRASE.headers() || {};
}
```

`CPL_TEAM_PHRASE` exposes `decorateHeaders`. It has never exposed `headers`. The
guard is therefore **always false** — not sometimes, always — and the code takes
its fallback path unconditionally, in every environment, forever.

Three properties make this worse than an ordinary typo:

1. **It cannot throw.** A misspelled *call* (`obj.headrs()`) is a TypeError on the
   first execution. A misspelled *feature-test* is a boolean, and `false` is a
   legal answer.
2. **The fallback is designed to look reasonable.** These guards exist next to
   careful degradation — here, "read the public half and say which half you
   lost." The better that fallback, the more convincingly it masks the typo. Our
   page calmly explained a permissions gate that was not the problem.
3. **The symptom is reported as a state.** The tab rendered *"Could not read
   map_colleges: 401"* — accurate, prominent, and pointing at auth rather than at
   a method name. A reader has no reason to suspect a typo.

**The guard is only as good as the name inside it, and nothing checks the name.**
So check it: assert that every member your code names on an optional dependency
actually exists on that dependency's own export surface.

```js
const exported = new Set(parseApiSurface(DEP_SRC));
const used = new Set(codeOnly(SRC).match(/DEP\s*\.\s*(\w+)/g).map(stripPrefix));
const phantom = [...used].filter((m) => !exported.has(m));
check("every member the caller names exists", phantom.length === 0);
```

## How we got here

`authHeaders()` returned `{}` on every call, so every PostgREST fetch went out
with no `apikey` and came back 401. `state.live` stayed null, and the roster is
drawn under `if (live)`. The lint half rendered from a committed snapshot, so the
page looked populated — which is why nobody read the banner as fatal.

The file's own header had by then drifted to describe the broken screen: *"a LINT
SURFACE, not a lookup"*, three lines below a verbatim quote of Sam asking for a
lookup. **A comment that describes what you observe, rather than what was asked
for, will ratify a bug as a design decision.**

Fixed in [PR #1559](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1559)
by mirroring `cr_reference.js` (apikey never conditional). The guard against
recurrence is `tests/college_identity_auth.test.js` block 3, which parses
`team_phrase.js`'s `api` object and fails on any member the tab names that is not
in it.

⚠️ That check must scan **code, not prose**: its first draft went red on the fix's
own comment, which quotes the broken line deliberately. Strip comments first.
`kb/_docs_audit.py` hit the identical shape when `american_spelling` corrected the
very words its rule was documenting.

## When this applies (and when it doesn't)

**Applies** to any optional-dependency or capability guard where a *name* decides
the branch: `if (obj && obj.method)`, `if (typeof x.fn === "function")`,
`"key" in obj`, `getattr(o, "name", None)` in Python, and feature detection
against browser or host APIs.

**Does not apply** where the name is checked by tooling — TypeScript against real
types, or a linter with the dependency's declarations in scope. A typed
`CPL_TEAM_PHRASE` would have made this a compile error. It also does not apply to
guards on *values* rather than members (`if (config.timeout)`), where the name is
still verified by ordinary use elsewhere.

**The tell to look for:** a degradation path that no environment ever seems to
escape. If a fallback branch is always taken in production, confirm the condition
*can* be true before believing the explanation it prints.

## See also

- `[[docs/college_identity_lessons]]` — the workstream that produced this
- PR `#1559` — the fix and its guard
- `[[docs/kb-notes/methodology-an-error-inside-a-success-is-invisible-to-every-status-check]]` — the same family: a failure wearing a success's shape

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
