---
title: Methodology — Commit the test harness; don't let verification evaporate
created: 2026-06-04
updated: 2026-06-04
tags: [methodology, testing, jsdom, ci, dev-infra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - package.json
  - tests/run.js
  - tests/cer.test.js
  - .github/workflows/js-tests.yml
---

# Methodology — Commit the test harness; don't let verification evaporate

> **One-sentence summary** — a jsdom/consumer test you write, run once in
> `/tmp`, and throw away verifies nothing tomorrow; commit it (`tests/` +
> `package.json` + a CI job) so the same check guards the behavior on every
> future PR for the cost of one `npm test`.

## Context

For many sessions, consumer changes (CER/CCR/EACR front-end JS) were verified
with ad-hoc jsdom scripts in `/tmp`, run to "N/N passed," and discarded — and
`jsdom` was `npm install`-ed fresh each session. The handoffs proudly cite
"jsdom 20/20," but none of those tests existed the next day. So a regression
(e.g. the Session-32 `raw_variants.some()` crash on baked rows) had nothing
standing guard.

## The claim

**Throwaway verification is a smell. Commit it.** Concretely, for this repo:

1. **`package.json`** with the test dep (`jsdom`) + `"test": "node tests/run.js"`.
   (`node_modules` + `package-lock.json` stay gitignored; CI runs `npm install`.)
2. **`tests/run.js`** — a tiny runner that executes each `tests/*.test.js` in a
   child process and exits non-zero if any fail. Adding a test = drop a file.
3. **`tests/<area>.test.js`** — render the **real committed payload** in jsdom,
   stub the one network call (`fetch` → empty overlay), and assert behavior.
4. **CI** (`.github/workflows/js-tests.yml`) running `npm install && npm test`
   on PR/push, as a **non-required** check (informational; doesn't gate the
   merge-on-green flow — a failing non-required check leaves a PR `unstable`,
   still mergeable per policy).

**Make the test guard the actual failure mode, not a happy path.** The CER test
injects a **synthetic `raw_variants: null` row** so it exercises the
`(row.raw_variants || [])` guard directly — the test goes red if the guard is
ever removed, even though the *baked* payload now always populates the field. A
test that only feeds well-formed rows wouldn't catch the regression that
motivated it.

## How we got here

Session 32's search/expand crash was exactly the class a committed test would
have caught pre-merge. The retrospective surfaced the pattern (throwaway tests +
per-session `npm install`); the fix was to land a minimal committed harness.
First run: **18/18**, and the harness is now the regression net for the whole
CER consumer. Tradeoff accepted: a light Node footprint in a Python-centric repo
+ a (non-required) CI step.

## When this applies (and when it doesn't)

- **Applies** whenever you write a test to prove a fix — if it's worth running
  once, it's worth committing. Especially for consumer JS that renders from a
  baked payload (the shape-divergence crash class is easy to reintroduce).
- **Doesn't mean heavyweight tooling** — a single runner + standalone test files
  beat a framework here. No transpile, no test DSL.
- **Keep CI non-required** unless Sam opts into branch protection, so it never
  blocks the autonomous merge-on-green rhythm.

## See also

- `[[docs/kb-notes/methodology-consumer-tolerate-omitted-baked-fields]]` — the bug the harness guards
- PR `#288` — the committed harness + CI + stop-hook fix
- `[[docs/engineering_practices_lessons]]` — the workstream

---

*Authoring check: durable (the harness persists + grows), reusable (every future
consumer change), distilled (one concept: commit your verification),
self-contained.*
