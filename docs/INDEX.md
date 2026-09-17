---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-17
tags: [meta, index, obsidian-target]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/README]]"
---

# cpl-project-tracker — Docs Index

Landing page for the project's documentation surface, intended as the
**Obsidian vault entry-point** when browsing this repo from the vault-side clone
at `CPLBrain/COG-second-brain/cpl-project-tracker/`.

The per-lane catalogs below are **generated** by `kb/_build_docs_index.py` from
each doc's own frontmatter — rebuild rather than hand-append. The prose on this
page is hand-written and is preserved across rebuilds; only the block between
the `generated:corpus` markers is replaced.

> Previously this page listed every document inline and reached **273,616 B,
> 6.8× the 40,000 B index budget** — a landing page you must scroll is not a
> landing page. The catalogs are where the full listings live now.

## The three lanes

| Lane | What | Where |
|---|---|---|
| **KB notes** | Durable, distilled, reusable knowledge | [`docs/kb-notes/`](kb-notes/) |
| **Lessons (WIP)** | Workstream scratchpads, append-only | `docs/<workstream>_lessons.md` |
| **Session handoffs** | "Fattyfat" capsules for the next session | `docs/session_<N>_handoff.md` |

See [`docs/kb-notes/README.md`](kb-notes/README.md) for the lane contract.

## CLAUDE.md reference offloads (`docs/reference/`) — added 2026-07-10 (Session 111, the pare-down)

Always-current project memory moved out of `CLAUDE.md` (2,514 → ~590 lines);
**Rule 9 checkpoints update these files now**, and `CLAUDE.md` keeps read-before
stubs pointing here.

| Doc | Was | Read before |
|---|---|---|
| [Pipeline Reference](reference/pipeline_reference.md) | `CLAUDE.md` §Pipeline Reference (1,087 lines) | generator/workflow/tabs/Supabase/EACR/C-ID work |
| [KB Build Status](reference/kb_build_status.md) | `CLAUDE.md` §KB & Unified Courses (421 lines) | KB/CCR curation work, build-phase history |
| [M-ID Lifecycle & CID/CIDx](reference/mid_lifecycle.md) | `CLAUDE.md` §11 prose + strategic roadmap (449 lines) | re-mints, MC/TMC calls, auditor, pathway decisions |
| [Branch policy](reference/branch_policy.md) | `CLAUDE.md` §Branch policy evidence (2026-08-28) | why a merge rule says what it says |
| [Engineering & UI practices](reference/engineering_ui_practices.md) | `CLAUDE.md` §Engineering & UI evidence (2026-08-28) | a UI rework, a First Light artifact, a table layout |
| [Obsidian vault wiring](reference/obsidian_vault_wiring.md) | `CLAUDE.md` §Obsidian vault wiring (2026-08-28) | vault-sync, exclusion, the sparse-checkout fix |
| [**`reference/lanes/` — one file per §11 roadmap lane**](catalog/reference.md) | `CLAUDE.md` §11 roadmap cells, 88 KB (2026-08-28) | **working any lane — and REFRESHING it at checkpoint** |

⚠️ **The lane files are the usual checkpoint edit now.** §11's table is a
pointer index: it carries each lane's state, and the lane file carries what you
learned. A checkpoint that updates only the row leaves 30 files to go stale.

---

## The catalogs

Every document in `docs/`, by lane. Rebuild with `python3 kb/_build_docs_index.py`
(`--check` fails when a rebuild would change anything, so CI catches a stale index).

<!-- generated:corpus -->
| Lane | Docs | Catalog |
|---|---:|---|
| Doctrine (behavior-shaping) | 5 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 457 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 79 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 47 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 241 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **910** | |
<!-- /generated:corpus -->

Not covered by a lane catalog:

- [`visuals/README.md`](visuals/README.md) — **Visuals**: decision briefs and
  mock-ups worth returning to, committed as HTML with a dated filename.
- [`catalog/`](catalog/) — the generated catalogs themselves.

## Top-level orientation docs

- [`../CLAUDE.md`](../CLAUDE.md) — project memory, Critical Rules, M-ID lifecycle (§11)
- [`co_platform_strategy.md`](co_platform_strategy.md) — **the long-term "plan of attack"** (Session 83): scaling COBI + the CPL KB into a governed, team-based, CO-wide platform — operating model, account migration off personal logins, knowledge lanes, real APIs vs scraping, governance/security/accessibility/HUMANS, decisions only humans make, pushback, and a scorecard against all ~14 asks
- [`roadmap_archive.md`](roadmap_archive.md) — museum annex to CLAUDE.md: completed roadmap rows + Session 26-31 narratives (moved out Session 33 to keep CLAUDE.md to live, steering content)
- [`../README.md`](../README.md) — first-time visitor entry
- [`../kb/README.md`](../kb/README.md) — knowledge-base schemas + generators

## Sierra integration docs (vendor-facing, added 2026-07-02)

Commissioned by Sam for integrating Sierra into a vendor-built platform:

- [`sierra_technical_reference.md`](sierra_technical_reference.md) — how
  Sierra is built: architecture, the full `cpl-chat` API contract (request /
  SSE protocol / errors), the six-lookup answer pipeline, behavior rules,
  data layer, client surfaces, security model, ops, v13→v26 timeline.
- [`sierra_integration_analysis.md`](sierra_integration_analysis.md) —
  benefits / risks / challenges of embedding Sierra on another site, the
  pre-launch preconditions checklist, and the decision points for Sam.
- [`sierra_integration_guide.md`](sierra_integration_guide.md) — the vendor
  implementation plan: link / iframe / native-API / server-proxy paths, a
  minimal reference client, non-negotiable client requirements, launch
  checklist, ongoing-operations expectations.
- [`sierra_iframe_implementation_guide.md`](sierra_iframe_implementation_guide.md)
  — the **day-one iframe recipe** (2026-07-03): the exact `?ctx=external`
  URL, annotated markup/CSP/sandbox, sizing, QA checklist (incl. the
  contacts-gate check), launch coordination, rollback.
- [`sierra_maturity_roadmap.md`](sierra_maturity_roadmap.md) — **Malone's
  scope-and-sequence to end-state** (2026-07-03): Phases 1–6 (guardrails →
  contract hardening → content maturity → integration graduation →
  recommender depth → platform ops), efforts, dependencies, the three
  human-only decisions, the critical path. The iframe is explicitly interim.
- [`sierra_vendor_lane_handoff.md`](sierra_vendor_lane_handoff.md) — the
  lane handoff (2026-07-03): what shipped (#654/#657 + v27 LIVE), locked
  decisions, verified access facts, the priority queue, safety rails.

## Reference materials

Authoritative external sources we've cached:
- [`reference/`](reference/) — ASCCC / COCI / CCN-CID source documents

## Update history
- **2026-09-17 (S267, SkyQuarry — Rule 9 checkpoint)** — The occupation opportunity register ships into the **My College** tab ([#1591](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1591)) for Sigrid's Bay Area Strong Workforce consortium meeting: 28 colleges, 6,903 rows, 1,223 adopt-now, precomputed because the matcher runs ~14 s per college and a room cannot wait on it. ⭐ **The picker already existed** — the tab's `college` scope ships `ready: true`, so live flipping between colleges needed content rather than scope work. ⛔ **`--region` was silently dropping 5 of the 28 consortium colleges**: it resolved against the fire/electrical proximity macro-region while `identity_rows()`'s own docstring forbade exactly that substitution, and the docstring's premise — *the SWP roster exists nowhere in this repo* — had stopped being true later the same day it was written. `--swp-region` reads the resolved roster now. ⚠️ **A 14-minute build wrote nothing** because the one `openpyxl`-dependent output went first; the tip-of-branch "import it inside the function" fix had made the module importable and left the run just as fatal. Also: the doc budget is **UTF-8 bytes, not characters** (⚠️ and ⭐ are 6 and 3), and the dependency map records **line numbers**, so it goes stale on any line shift in a file it maps. `lanes/partner-crosswalks.md` compacted back under budget; the 266 and 267 lineages have converged on `main`. Three KB notes.
- **2026-09-17 (S265, SkyPublius — Rule 9 checkpoint)** — Closes the funding-explainer run and the red-`main` repair. Lint-driven compaction this pass: `lanes/implementation-funding.md` **1.55× → 1.34×** (the vocabulary block deduped against `CLAUDE.md`, which states it in full; the closed decision sheet and three incident narratives cut to their durable rules), and `cpl_funding_lessons.md` **1.13× → under budget** by moving its three oldest sections VERBATIM to the archive. ⚠️ `CLAUDE.md` sits at exactly **1.0×** and the lane's state did not change, so §11 is deliberately untouched — adding a narrative there would have to displace something. Handoff written as **267, not 266**: `session_266_handoff.md` exists on the unmerged crosswalk branch, so the highest number visible on `main` under-reports. Four `cpl_memory` rows written and the crosswalk session's incident row superseded now that its claim is no longer true.
- **2026-09-16 (S266, close-out)** — the matcher gets a score against Delta's 139 rulings (0.907 precision / 0.51 recall) and prints it on every view; the agent-suffix stemming guard lands with a CI test; the To-Do feed trims to 12 with 16 parked; PR #1576 waits on two funding tests red on `main`.
- **2026-09-16 (S265, SkyPublius — `main` went red with nobody's hands on it)** — Sam, closing an unrelated session: *"I told it not to handle this matter but leave it to you."* ⛔ **Three assertions hard-coded figures out of `cpl_funding_performance.js`, which the daily dashboard workflow rewrites**, so `test` went red on a DATA REFRESH with no code change behind it: `cpl_funding_measure_picker` 4c (`826.8 CPL FTES` — `pac_u` moved 24,804.45 → 24,847.45), `cpl_funding_metric_pin` 7b ("at most the **3** `pp_u` carriers" — now **4**) and 7b2 (`25 units` — `pp_u` now 63.5). **Bisected before blaming anything**: green at `d906cf2` AND at the explainer merge `4a00bd9`, red only after the cron commits — the code was never wrong. ⚠️ **The cost landed on another lane**: the SJCOE crosswalk PR #1576 hit it, reproduced it against `origin/main` in a worktree, proved its diff touched no funding file, and stood down — red `main` taxes every PR opened until it is fixed, because the first duty on a red check is proving it is not yours. Every expectation is **derived from the artifact** now, keyed to a specific measure, with the rival asserted absent and `chosen !== rival` asserted outright so a check that cannot fail says so. ⚠️ **A mutation that changes nothing proves nothing**: forcing `earnFraction`'s statewide lookup left 4c green because that figure renders from a different path, which read as a weak guard and was not — the decisive mutations (neuter the picker's write path; point the portal prose rule at the applied lane) fail all three by name. New note: [`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md).
- **2026-09-16 (S265, SkyPublius — the explainer stops describing a model it no longer runs)** — Sam's pass on the public funding explainer ([#1588](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1588)): consistent language, fewer redundancies, priorities and timeline integrated, strategies folded, a table that fits, a PDF link. ⭐ **The priority card's plain sentence came from a map keyed on the priority TITLE** — glosses for the retired Access/Outreach/Success — so two cards fell through to the raw metric string and the third, still matching its key, described **eligible** units under a priority measuring **applied** units from the portal, landing page and batch upload. The card that lied was the only one that looked normal. Same shape twice more: the typed baseline requirements (page said *"A CPL Coordinator or Counselor listed in MAP"*, model says *"Primary CPL Contact listed in MAP and the college public CPL Landing Page"*) and a typed "1 Nov 2026" against a stored `2026-11-01` — **a date is neither currency nor a thousands-figure**, which is why both figure guards missed it. ⚠️ **A ban is only as wide as the files it opens**: `cpl_funding_calm` reads the tab's mount and `cpl_funding_earn_retired` reads `cpl_funding.js`, and their headers call the pair "the whole guard" — the explainer is a THIRD file and still said *"what it earns tracks…"* two days after the retirement. ⛔ **A SHARED SECTION ID IS A SHARED CONTROL**: the new section shipped for one commit as `priorities`, a tab id carrying the LIVE override *"Funding Outcomes of Ed. Code §78093.2(d)(1)"*, so the explainer's h2 was silently replaced and hiding the tab's section hid this one; found only because Sam then asked for the section titles to use the model's language, renamed to `outcomes`, and now guarded by reading `SECTION_HOUSE_ORDER` **out of the source**. ⚠️ **The print stylesheet IS the PDF's design** (the page prints itself — a file built once is the snapshot page this one replaced) and its first draft hid `.cplfund-caret`, which **is the institution's name**, printing 119 rows under an empty Institution column — invisible in markup and in jsdom, obvious in one screenshot. Measured: the table needed **1,039px in a 942px box** with District shown, so it takes the window now; and **138 focus rings were never drawn** because `--gold-accent` / `--navy-secondary` are COBI tokens this page never defined, mapped to its own `--focus-ring` (the gold is 1.74:1 on paper against the 3:1 a focus indicator needs). `npm run a11y funding-model` passes clean. New notes: [`methodology-a-display-name-is-not-a-key`](kb-notes/methodology-a-display-name-is-not-a-key.md), [`methodology-a-ban-is-only-as-wide-as-the-files-it-opens`](kb-notes/methodology-a-ban-is-only-as-wide-as-the-files-it-opens.md).
- **2026-09-15 (S264, SkyMantis)** — the counselor step became a measurable rung and `metric_src` got a control: PRs #1582 (counselor measure + measure picker), #1583 (builder's retired causal story + decision sheet), #1584 (Credit FTES locked as the only allocation basis), #1585 (measure options named by route). Two KB notes: a pipe discards a command's verdict; retiring a behavior means inverting its tests.
- **2026-09-15 (S263 SkyOrder)** — a column-hide rule reached through the detail row into the nested
  drill-in table and hid one of its columns, on the SHIPPED DEFAULT (#1578); the statewide row now expands
  from the same renderer as a college row and the printed table got its 118 names back (#1577); the
  per-priority target rate was built and reverted as redundant with `factor` (#1579/#1580). Two KB notes.
- **2026-09-14 (SkySave, S262 — the band wrapper retires, and a double claim surfaces)** — Sam's rulings from a marked-up screenshot, built as a mock-up first after S261 went past its brief; he ruled on it five times mid-build. ⭐ **The statutory BAND WRAPPER is retired** ([#1574](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1574)): the card carries what the band head did — key, name, citation, the statute's own sentence — plus a picker. `setPrioGoal()` writes it, the measure-derived goal stays the DEFAULT, and ⚠️ **clearing stores the sentinel `"derived"` rather than deleting the key**, because a deleted key lets a SHARED value resurface and the reset undoes itself. The picker offers *Derived from the metric* FIRST because an `accepted` milestone resolves to (B) AND (C) and no single-choice list can express a pair. ⚠️ **The orphan band went too and the guarantee got STRONGER** — a flat grid filters nothing, so every card renders always and an unresolvable one says so on its own face; the per-outcome total survives as a **totals row naming every statutory goal, served or not**, which is the guard that stops one going quiet now that cards can be re-pointed. ⭐ **THE FINDING THAT MATTERS MOST**: the statewide project allocation was tagged to **(C) AND (D)** and `goalFunding()` pushed its **full** amount into each — **$8,959,692 reported under two statutory goals at once**, $17.9M of reporting against an $8.96M allocation. Every row was correct in isolation, **nothing ever summed the goals**, and it surfaced only because Sam asked for a split; no audit found it. A tag is many-to-many, an amount is not. ⭐ **The bands suite was REWRITTEN, not deleted** — its header stated the invariant (no priority may go missing, because an invisible one still qualifies against a target nobody can see), and one inherited check had become **vacuous while still passing**. Eight suites repointed; two of the reds were my own rendered prose, caught by `cpl_funding_calm` rather than by re-reading. ⚠️ **a11y was MEASURED against `main` in a worktree, not claimed**: the tab reports FAIL on both, and this change removes three findings and adds none. ⚠️ CI red on `dependency map is STALE` while 331 files passed locally — it records LINE NUMBERS, and the rebuild belongs genuinely last. Lane 1.19× → 1.09×, by deleting settled history rather than rewriting it at the same length. New notes: [`methodology-a-figure-tagged-to-two-owners-is-claimed-twice`](kb-notes/methodology-a-figure-tagged-to-two-owners-is-claimed-twice.md), [`methodology-retiring-a-structure-means-rewriting-its-guard`](kb-notes/methodology-retiring-a-structure-means-rewriting-its-guard.md).
