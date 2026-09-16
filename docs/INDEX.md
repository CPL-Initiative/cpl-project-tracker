---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-15
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
| KB notes | 453 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 79 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 47 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 239 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **904** | |
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
- **2026-09-16 (S266, close-out)** — the matcher gets a score against Delta's 139 rulings (0.907 precision / 0.51 recall) and prints it on every view; the agent-suffix stemming guard lands with a CI test; the To-Do feed trims to 12 with 16 parked; PR #1576 waits on two funding tests red on `main`.
- **2026-09-16 (S265, SkyPublius — the explainer stops describing a model it no longer runs)** — Sam's pass on the public funding explainer ([#1588](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1588)): consistent language, fewer redundancies, priorities and timeline integrated, strategies folded, a table that fits, a PDF link. ⭐ **The priority card's plain sentence came from a map keyed on the priority TITLE** — glosses for the retired Access/Outreach/Success — so two cards fell through to the raw metric string and the third, still matching its key, described **eligible** units under a priority measuring **applied** units from the portal, landing page and batch upload. The card that lied was the only one that looked normal. Same shape twice more: the typed baseline requirements (page said *"A CPL Coordinator or Counselor listed in MAP"*, model says *"Primary CPL Contact listed in MAP and the college public CPL Landing Page"*) and a typed "1 Nov 2026" against a stored `2026-11-01` — **a date is neither currency nor a thousands-figure**, which is why both figure guards missed it. ⚠️ **A ban is only as wide as the files it opens**: `cpl_funding_calm` reads the tab's mount and `cpl_funding_earn_retired` reads `cpl_funding.js`, and their headers call the pair "the whole guard" — the explainer is a THIRD file and still said *"what it earns tracks…"* two days after the retirement. ⛔ **A SHARED SECTION ID IS A SHARED CONTROL**: the new section shipped for one commit as `priorities`, a tab id carrying the LIVE override *"Funding Outcomes of Ed. Code §78093.2(d)(1)"*, so the explainer's h2 was silently replaced and hiding the tab's section hid this one; found only because Sam then asked for the section titles to use the model's language, renamed to `outcomes`, and now guarded by reading `SECTION_HOUSE_ORDER` **out of the source**. ⚠️ **The print stylesheet IS the PDF's design** (the page prints itself — a file built once is the snapshot page this one replaced) and its first draft hid `.cplfund-caret`, which **is the institution's name**, printing 119 rows under an empty Institution column — invisible in markup and in jsdom, obvious in one screenshot. Measured: the table needed **1,039px in a 942px box** with District shown, so it takes the window now; and **138 focus rings were never drawn** because `--gold-accent` / `--navy-secondary` are COBI tokens this page never defined, mapped to its own `--focus-ring` (the gold is 1.74:1 on paper against the 3:1 a focus indicator needs). `npm run a11y funding-model` passes clean. New notes: [`methodology-a-display-name-is-not-a-key`](kb-notes/methodology-a-display-name-is-not-a-key.md), [`methodology-a-ban-is-only-as-wide-as-the-files-it-opens`](kb-notes/methodology-a-ban-is-only-as-wide-as-the-files-it-opens.md).
- **2026-09-15 (S264, SkyMantis)** — the counselor step became a measurable rung and `metric_src` got a control: PRs #1582 (counselor measure + measure picker), #1583 (builder's retired causal story + decision sheet), #1584 (Credit FTES locked as the only allocation basis), #1585 (measure options named by route). Two KB notes: a pipe discards a command's verdict; retiring a behavior means inverting its tests.
- **2026-09-15 (S263 SkyOrder)** — a column-hide rule reached through the detail row into the nested
  drill-in table and hid one of its columns, on the SHIPPED DEFAULT (#1578); the statewide row now expands
  from the same renderer as a college row and the printed table got its 118 names back (#1577); the
  per-priority target rate was built and reverted as redundant with `factor` (#1579/#1580). Two KB notes.
- **2026-09-14 (SkySave, S262 — the band wrapper retires, and a double claim surfaces)** — Sam's rulings from a marked-up screenshot, built as a mock-up first after S261 went past its brief; he ruled on it five times mid-build. ⭐ **The statutory BAND WRAPPER is retired** ([#1574](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1574)): the card carries what the band head did — key, name, citation, the statute's own sentence — plus a picker. `setPrioGoal()` writes it, the measure-derived goal stays the DEFAULT, and ⚠️ **clearing stores the sentinel `"derived"` rather than deleting the key**, because a deleted key lets a SHARED value resurface and the reset undoes itself. The picker offers *Derived from the metric* FIRST because an `accepted` milestone resolves to (B) AND (C) and no single-choice list can express a pair. ⚠️ **The orphan band went too and the guarantee got STRONGER** — a flat grid filters nothing, so every card renders always and an unresolvable one says so on its own face; the per-outcome total survives as a **totals row naming every statutory goal, served or not**, which is the guard that stops one going quiet now that cards can be re-pointed. ⭐ **THE FINDING THAT MATTERS MOST**: the statewide project allocation was tagged to **(C) AND (D)** and `goalFunding()` pushed its **full** amount into each — **$8,959,692 reported under two statutory goals at once**, $17.9M of reporting against an $8.96M allocation. Every row was correct in isolation, **nothing ever summed the goals**, and it surfaced only because Sam asked for a split; no audit found it. A tag is many-to-many, an amount is not. ⭐ **The bands suite was REWRITTEN, not deleted** — its header stated the invariant (no priority may go missing, because an invisible one still qualifies against a target nobody can see), and one inherited check had become **vacuous while still passing**. Eight suites repointed; two of the reds were my own rendered prose, caught by `cpl_funding_calm` rather than by re-reading. ⚠️ **a11y was MEASURED against `main` in a worktree, not claimed**: the tab reports FAIL on both, and this change removes three findings and adds none. ⚠️ CI red on `dependency map is STALE` while 331 files passed locally — it records LINE NUMBERS, and the rebuild belongs genuinely last. Lane 1.19× → 1.09×, by deleting settled history rather than rewriting it at the same length. New notes: [`methodology-a-figure-tagged-to-two-owners-is-claimed-twice`](kb-notes/methodology-a-figure-tagged-to-two-owners-is-claimed-twice.md), [`methodology-retiring-a-structure-means-rewriting-its-guard`](kb-notes/methodology-retiring-a-structure-means-rewriting-its-guard.md).
- **2026-09-13 (SkyKey, S260 — three surfaces swept, 245 a11y faults cleared, and a number that had never been near the engine)** — ⭐ **"Earn" retired** across the funding tab, the CSV export and the public explainer ([#1570](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1570)): 69 sites on Sam's confirmed map (*counts toward · qualifies for · demonstrated · remaining*). The award cells keep the PRESENT PARTICIPLE because his 2026-08-27 tense ruling survives the sweep, and *"students earn credit"* stays — student subject, exempt by name. ⚠️ **One guard was provably not enough**: extending `cpl_funding_calm` looked complete until a mutation left it **57/57 green** on the orphan-band note the fixture never paints, so a source-side twin reads every quoted string — and that is what caught `"Earned <window>"` still in the **CSV column header**, reader-facing text no DOM test can see. ⭐ **A11y target size 245 → 0** on the explainer and **0** `cplfund-*` on the tab, from **six** causes (one selector was 118 of them); every number measured, with **Taft** — the state's shortest college name — setting the horizontal padding by itself on both surfaces. ⚠️ The floor goes on whichever box the engine MEASURES (a wrapping `<label>` replaces its checkbox's), a first `min-height` read *exactly* the same 21.7px because an identical selector was declared later in the same array, and a `:focus-visible` rule naming a token the page does not define **removed** the ring it meant to add (137→139). ⭐ **Ask 2** ([#1571](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1571)): the designate picker rides every card, always visible, and a measureless outcome shows a card even when empty — Sam choosing that after being shown it reverses the reasoning `designateRowHtml()` was built on. ⚠️ **THE CORRECTION THAT MATTERS MOST**: a design prototype quoted funding shares taken from this repo's own lane notes rather than the engine, and Sam caught it in one question — *"Did you read the values and metrics from config or the live funding tab?"* The notes said 40/25/35; live is **33/33/34**, titles **Outreach · Completion · Awards**. The quoted line was a **proposal he never applied**, and prose does not distinguish one from a live dial. Reading the config then corrected two more lane lines: `pac_u` has been back in the bake since 2026-09-10 (24,777.95 across 110 colleges) after being recorded as removed, and goal (C) carries four designated projects, not three. ⭐ **And it located where (C)'s only campus measure lives**: `prioGoals()` resolves the `accepted` milestone to **(B) AND (C)**, but Awards is pinned to `ppa_u` → (A) alone, so the Counselor step is strategy prose there and not the metric — a dial, and Sam's to set. Lane + `CLAUDE.md` brought back from 1.35× and 1.02× to 1.0×; a `CLAUDE.md` line still instructing *"no data yet"* was found contradicting the positive-first ruling that banned it. New note: [`methodology-a-lane-file-is-a-summary-of-a-measurement`](kb-notes/methodology-a-lane-file-is-a-summary-of-a-measurement.md).
- **2026-09-12 (SkyGuard, S259 — the field that was already built, and the flag that was not)** — The queue's top item, *build the Sierra `surface` field, Sam ruled Yes*, named something that had shipped on 2026-08-22 (v56) with two live guidance rows already scoped; the lane had read "not built, blocked on Sam's go" for three weeks and S258 carried that line into open question 3. The To-Do Sam actually read asked whether to build the **scope flag**, so that is what shipped: cpl-chat v66 ([#1568](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1568)) derives `reviewer · team · public` by asking `is_allowed_reviewer()` / `team_pass_ok()` with the anon key and the caller's own credential, fails closed, files `viewer` + `surface` on `chat_interactions` (migration applied live), and echoes `event: meta`, which the COBI widget renders as one line of words; the public page and the Fact Sheet drawer are untouched, and it widens nothing — what a verified reviewer may see is the second build and routes through Governance. Also: smoke 15a/15c closed by a stripper that spans a bounded same-clause gap and cannot cross a dash ([#1566](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1566), tested through real sed against the recorded answers); the public funding explainer became an a11y target and measured 245 undersized controls at every width ([#1567](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1567)); the Sierra and funding lanes compacted under budget. ⚠️ The hourly health probe's condition was met on 2026-09-10 — three handoffs said so and the memory table did not — and the one-line edit was stopped by the environment's permission rules, so it is a NEEDS SAM with the diff written out. ⚠️ A checkpoint commit briefly landed on a sibling worktree's branch because the harness pins the working directory to the worktree; reverted with force-with-lease and redone here. On the 13th Sam returned with three funding-tab asks: the positive-first prose sweep shipped with its guard, and he ruled four bands with the outcome chosen on the card, reported cards for outcomes without a measure, and the retirement of *earn* — the builds go to S260. New note: [`methodology-verify-a-queue-item-against-the-code-before-it-reaches-the-decider`](kb-notes/methodology-verify-a-queue-item-against-the-code-before-it-reaches-the-decider.md).
- **2026-09-12 (SkyList, S258 — four asks on the funding tab, and a resolver nobody could reach)** — Sam asked for movable sections, the outcomes section carrying measurable *and* non-measurable priorities, a box for goal (C) with designated projects, and the changes reaching the public view; all shipped in [#1563](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1563). ⭐ **Six of the public explainer's seven sections could never be curated, and the test proved the wrong half**: Hide and Rename ride `sectionShell()`, the explainer hand-writes its markup and asks `T.sectionCuration()` by `data-fsec` id, and only `timing` is in both id sets — by coincidence of naming — so a section the CO held back stayed VISIBLE on the page colleges read. The existing block wrote `{titles:{qualify}}` into the shared map and read it back, which proves the resolver resolves and can never notice that **no control anywhere emits `qualify`**. Fixed by DECLARING the page's sections (`PUBLIC_SECTIONS`) and asserting the declaration equals the markup in membership and order; deliberately **not** aliased onto the tab's, because `lede` and `choices` have no tab twin and `allocation` spans two. **Section order is id-keyed, never positional** — the set grows whenever we ship a section, so a stored `[0,3,1,2]` re-points the first time one is added. **The (C) box is derived, never an entry in `priorities(slot)`** (share 0 there earns nothing and still enters every share-sum, export and memo), so (D) gets one on the same path; `projectGoals()` had storage since 2026-08-28 and **no control anywhere**, so the multi-select over the whole register — grouped by Activity, additive because a selection-is-the-set widget releases everything on one click in 32 rows — is what made it reachable. ⚠️ **My own bug, and its guard missed it**: the box carried `class="p"` for the card look, and `.cplfund-prio .p` is counted or indexed by eleven assertions across five suites, so it became a priority card to every selector in the codebase — the exact thing the comment above it forbids. Seven files red from one class; the guard had asserted the *attribute* and not the *selector*. ⚠️ Also mis-read those failures as memory pressure first, because a suite that passed standalone had passed **before** the breaking edit. New notes: [`methodology-a-guard-that-supplies-its-own-input-tests-only-half`](kb-notes/methodology-a-guard-that-supplies-its-own-input-tests-only-half.md), [`methodology-a-styling-class-is-an-api`](kb-notes/methodology-a-styling-class-is-an-api.md).
