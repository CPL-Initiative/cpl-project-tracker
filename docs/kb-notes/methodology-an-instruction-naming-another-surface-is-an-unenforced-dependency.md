---
title: An instruction that names another surface is a dependency nothing enforces
created: 2026-08-14
updated: 2026-08-14
tags: [methodology, ui-copy, architecture, auth, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/team_phrase_lessons]]"
  - "[[docs/kb-notes/methodology-a-copy-detector-must-read-the-rendered-string]]"
artifacts:
  - reviewer_signin.js
  - team_phrase.js
  - tests/team_phrase_affordance.test.js
---

# An instruction that names another surface is a dependency nothing enforces

**Claim.** When surface A tells a user *"do X on surface B"*, that sentence is a
**coupling** — but unlike a function call it has no compiler, no test, and no
error when B changes. B can lose the affordance entirely and A will keep saying
it, confidently, forever. Either give A the affordance, or write a test that
holds the sentence true.

## The instance

`admin.js` rendered, to anyone arriving signed-out:

> **Admin needs a personal sign-in.** Sign in with a magic link on the **Team &
> RACI** tab using an address on the reviewer list, then re-open this tab.

Every clause was once true. By the time Sam read it, none of the actionable part
was: RACI's magic-link box had been removed, leaving a **complete `signIn()`
function with no caller anywhere in the file**. Admin is reviewer-only, so the
team phrase RACI *did* offer could never have opened it either. The single
documented way into the tab was an instruction that could not be carried out —
and nothing anywhere failed. No test, no console error, no broken link.

It was not one lapse. The same sentence was live in **thirteen strings across
five files**, and the module written to *end* that pattern
(`team_phrase_header.js`) quotes the very sentence in its own docstring as the
problem it solved — for a different credential. The phrase half was fixed; the
magic-link half kept the bug and then got worse, because the destination lost the
control.

## Why this class is so durable

- **A pointer degrades silently and asymmetrically.** Deleting a *function* other
  code calls breaks the build. Deleting a *control* other copy describes breaks
  nobody's tests and produces a confident lie.
- **It reads as a working path to everyone.** A person follows the words and
  finds nothing. A session greps `signIn`, finds a complete implementation, and
  concludes the feature exists. **Dead code that an instruction still points at
  is worse than no code at all.**
- **Fixing the destination does not fix the pointers.** Adding the masthead
  control did not update the copy on the seven tabs describing the old route,
  because nothing connected them.
- **It survives review.** Both halves look correct in isolation: the sentence is
  well-written, the destination tab is fine. Only the *relationship* is broken,
  and no diff shows a relationship.

## What to do instead

1. **Prefer the affordance over the pointer.** If a surface needs a credential,
   put the control *there*. A shared component mounted in several places is one
   implementation with several mount points — not several implementations. Cost:
   one `mountInto()`. Benefit: no sentence to go stale.
2. **When a pointer is genuinely right, make it structural.** Name a durable
   location ("ℹ About in the header") rather than a tab whose contents change,
   and prefer a control the user can see from where they are.
3. **If the sentence must exist, test it.** A CI guard that fails when the copy
   reappears — or when a surface that needs a credential offers no way to enter
   one — converts an unenforced dependency into an enforced one. That guard is
   the only thing that makes the sentence safe to keep.
4. **Delete the orphan.** An implementation whose entry point is gone should be
   removed, not left for the next reader to mistake for a feature.

## The generalization

Any cross-surface instruction is an untyped reference: *"configure this in
Settings"*, *"see the Admin tab"*, *"run the sync script first"*, *"ask a
reviewer to add you"*. Each is a claim about a part of the system that has no
idea it is being cited. **Treat user-facing copy that names another surface as
code with no type checker** — either eliminate the reference, or write the test
that type-checks it.

## See also

- `[[docs/team_phrase_lessons]]` — the workstream, and the measured coverage
- `[[docs/kb-notes/methodology-a-copy-detector-must-read-the-rendered-string]]` — how to build the guard so it actually sees the copy
- PRs `#1200` (the affordance) and `#1201` (the guard)

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
