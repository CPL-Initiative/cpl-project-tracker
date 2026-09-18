---
title: A generated file accepts your edit, and that is what makes it dangerous
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, generated-artifacts, ci, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - tests/skyview_built_from_source_test.py
  - scripts/check_generated.sh
  - prototype/build_ccr_atlas.py
---

# A generated file accepts your edit, and that is what makes it dangerous

> **One-sentence summary** — A hand-edit to a build output passes every test, every
> review and every deploy, and dies silently when something else re-runs the
> generator, so the only defense that works is a check comparing the artifact to
> its sources.

## Context

On 2026-09-18 a session added a read-only band to SkyView by editing
`prototype/skyview.html`. That page is assembled by
`prototype/build_ccr_atlas.py` from `prototype/ccr_atlas_v1.html` and
`prototype/ccr_universe.js`. The change was verified in a real browser, guarded
by a new jsdom suite, reviewed, merged as #1618 and deployed. About twenty
minutes later a second session's PR (#1617) rebuilt the page from the sources —
which had never carried the band — and main lost the feature. Full story:
[`ccr_atlas_lessons`](../ccr_atlas_lessons.md), 2026-09-18.

## The claim

**A generated file gives no resistance at the moment you are wrong.** Every
signal a session normally trusts fires green:

- the edit applies cleanly, because the file is real and writable;
- the served page behaves correctly, because the artifact IS what is served;
- a browser check passes, because it drives that artifact;
- a jsdom suite can pass or fail depending on which file it loads, and it is the
  only signal with any chance of noticing;
- CI passes, because nothing compares the artifact to its sources;
- review passes, because a reviewer reads a diff, and the diff is legible.

The failure surfaces later, from somewhere else, as a feature that stops
existing. By then the commit that caused it is merged and the commit that
reverted it is innocent.

**So the defense cannot be knowledge.** "Remember that this file is generated"
fails exactly when a session does not already suspect it — which is every time.
The defense has to be a check that reproduces the build and compares, and it has
to name the source file and line, because the session that trips it does not yet
know which file it should have edited.

### The corollary: an inventory of generated files decays silently

This repo already had `scripts/check_generated.sh` — "every generated file CI
verifies, checked in one command" — and its own header records being extended
twice after it missed a file. `prototype/skyview.html` was missing from it, and
the SkyView lane file told people to run that very script before a push. A
generated file absent from the inventory is indistinguishable from a
hand-editable one, and the inventory has no way to notice its own gaps.

## How we got here

The jsdom suite written alongside the change loaded `ccr_atlas_v1.html` and
`ccr_universe.js` — the sources — while the change lived in the artifact. Two of
its seventeen checks failed with results that made no sense (a queued course and
a settled course drawn at an identical radius), and chasing that disagreement is
what surfaced the architecture. A suite that had loaded the served page instead
would have passed and taught nothing.

`tests/skyview_built_from_source_test.py` now walks `ccr_universe.js` and the
template's stylesheet in 2,000-character chunks against the served page and
reports the first divergence by source file and line. Verified both ways: a
hand-edit to the artifact exits 1 with that message, a clean tree exits 0. It
runs in `js-tests.yml` and in `scripts/check_generated.sh`.

## When this applies (and when it doesn't)

Applies to any artifact a generator writes and a repo commits — built pages,
derived JSON, index and catalog files, dependency maps, lockfiles. The tell is a
build script whose output path is tracked by git.

It does not apply to a generated file that is gitignored: there the artifact
cannot be committed, so the failure mode is a local-only confusion rather than a
silently reverted feature. `prototype/ccr_atlas_v1.built.html` is the ignored
sibling of the page this note is about, and it was never at risk.

The comparison check is also the wrong tool where a generator is
non-deterministic — timestamps, ordering, machine-dependent output. Fix the
determinism first, or compare only the regions that are stable.

## See also

- `[[docs/ccr_atlas_lessons]]` — the SkyView workstream, 2026-09-18
- PR `#1618` — the change that shipped into the artifact
- PR `#1617` — the unrelated PR whose rebuild reverted it
- PR `#1619` — the port to the sources, the guard, and the inventory fix
- `CLAUDE.md` Rule 1 — the same rule for `excel_to_dashboard.py` and the dashboard

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
