---
title: Methodology — Turn a one-time PII audit into a standing guard (committed test over the public artifacts)
created: 2026-06-04
updated: 2026-06-04
tags: [methodology, privacy, pii, sec-10, testing, ci, dashboard]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-cer-student-impact-counts-privacy]]"
  - "[[docs/eacr_consolidation_lessons]]"
artifacts:
  - tests/pii_guard.test.js
  - excel_to_dashboard.py (_suppress_small, column-selective consumers)
  - fetch_custom_report.py (REQUEST_PAYLOAD — fetch-time minimization)
---

# Turn a one-time PII audit into a standing guard

> **One-sentence summary** — When a pipeline pulls a PII-laden source into a
> **public** artifact, don't trust a one-time manual audit: encode its
> conclusions as a committed test that fails the build if PII ever reaches a
> committed/published file — and back it with three upstream layers so a leak is
> structurally hard, not just caught.

## Context

A daily pipeline fetches a MAP "CustomReport" (student IDs, DOB, staff
names/emails) and bakes derived data into **public** artifacts (`*.html`,
`*.js`, `*.json` served on GitHub Pages). Before enabling the *authenticated*
pull (which adds more PII columns), we needed confidence the public output stays
clean — not just today, but against every future code change. A manual audit
answers "today"; it doesn't survive the next refactor. (PR #304; the CER
student-impact ADR is the decision this generalizes.)

## The claim

**Four layers, defense-in-depth — and the fourth is the one that lasts:**

1. **Read column-selectively, reduce to aggregates before baking.** Every
   consumer reads *named columns* (`row[cm["ExhibitID"]]`, `…["Students"]`) and
   emits counts/sets — never whole rows. This is the load-bearing property: new
   PII columns the source later adds (names/DOB/IDs) are *never read*, so they
   *cannot* leak, regardless of suppression. An identifier read only as a
   set-key for a distinct count (and never serialized) is fine.
2. **Small-cell-suppress the aggregates.** A per-group count of 1..N-1 is masked
   (`"<5"`, `"<2"`) and the exact number is *never baked* — `null` + a
   `suppressed` flag, or a mask string the consumer renders/sorts/sums around. A
   count of 1 (or a handful) of a protected group at a named place is itself
   re-identifying; an aggregate isn't automatically safe.
3. **Minimize at the fetch.** Drop source views/columns the pipeline doesn't
   actually consume (audit-confirmed) so their PII never even lands on the
   runner. Data you don't fetch can't leak.
4. **A standing guard test** (`tests/pii_guard.test.js`, runs in CI). It parses
   the *committed* artifacts and FAILS the build on: any small-cell count below
   the threshold, any exact masked value present, or any **email outside an
   allow-list of domains** (the classic staff-PII leak signature). This converts
   the audit's findings into a permanent invariant — a future consumer that
   accidentally bakes a contact email or an exact `1` turns the build red.

## How we got here

A read-only subagent audit traced all CustomReport consumers and found zero PII
*values* baked — but it was hunting values, and the gap was small-cell *counts*
(a per-college `veterans: 1`). We closed it with layers 2-4 and re-masked the 34
existing singleton cells live (don't wait for the cron). The guard's email check
is allow-list, not block-list: legitimate provenance stamps (`@rccd.edu`) and UI
placeholders (`@example.*`) pass; a real `@somecollege.edu` contact fails. The
guard also pinned a useful fact: the suppression is producer-side, so the guard
must pass on the *currently committed* data — re-mask in place rather than
waiting for the next regen, or the build is red until the cron.

## When this applies (and when it doesn't)

- **Applies** whenever a build commits/publishes data *derived* from a
  PII-bearing source. The guard scopes to the artifacts most likely to carry a
  leak (the HTML + the KPI/data `*.js`), not the consumer UI JS (which carries
  intentional placeholder emails — hence the allow-list).
- **Doesn't replace** keeping the raw source out of git (gitignore +
  workflow `git add` exclusion) — that's table stakes, upstream of all four
  layers.
- **Threshold is a policy call, not a constant to copy** — the data owner sets
  it per surface (here `<5` for the credential rollup, `<2` for coarser
  per-college counts). Lowering it warrants its own ADR.

## See also

- `[[docs/kb-notes/adr-cer-student-impact-counts-privacy]]` — the decision this generalizes
- `[[docs/eacr_consolidation_lessons]]` — Session 34, the audit + unblock thread
- PR `#304` — implementation (suppression + minimization + the guard)
- `[[docs/kb-notes/playbook-pii-history-purge]]` — the cleanup when PII *did* get committed

---

*Authoring check: durable (the four-layer pattern outlives this pipeline),
reusable (any public build over a PII source; peer colleges), distilled (one
concept — encode the audit as a standing test), self-contained.*
