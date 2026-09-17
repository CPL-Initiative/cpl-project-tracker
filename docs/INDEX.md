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
| KB notes | 464 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 79 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 47 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 246 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **922** | |
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
- **2026-09-17 (S273, SkyPilot — Rule 9 checkpoint)** — ⭐ **#1603 merged (`0b40f8a`) after a check that added evidence the handoff said was impossible: Deno installs from npm in the sandbox**, so the Edge Function typechecks (15 pre-existing strict-mode errors on `main`, the identical 15 on the branch, none added) and boot-tests locally. Then the first-ever `cpl-chat-preview-ab.yml` run: **ALL MODES OK on both slugs, no regressions — and `search_college_programs` timed out three times underneath it.** `pg_stat_statements`: 15 calls, mean 4,282 ms, max 7,875 ms; the effective timeout through PostgREST is 8 s. The route fails safe, so the answer read fluent without its Program Catalog section and no grid, probe or reader could see it. ⚠️ **The cost was set by the synonym table, not the student**: two full scans per term at ~320 ms, and a question expands to 3, 6, 12 or 30 terms — **4.3 s for 6, 19.8 s for 30**. The one-pass rewrite (vectors once per call) returns **identical rows on nine term sets** — proven on a session-local `pg_temp` copy beside the live function, no shared schema touched — in **1.1–2.5 s**, and is the schema of record on this branch, **not applied until Sam says so**; the deploy waits on it. Verification Part D pins the cost; smoke 7p asserts latency beside reach and cleanliness. Two KB notes. ⭐ **Then Sam said "apply and deploy"**: the rewrite was applied (migration `search_college_programs_one_pass`, A–D 16/16 live), A/B run 2 came back clean in the grid AND the logs, and **cpl-chat v67 went live at 23:31Z** — the program route reaches production. The smoke on that PR also turned up the fourth and fifth shapes of the negation class ([#1605](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1605)).
- **2026-09-17 (S272, SkyIndex — Rule 9 checkpoint)** — ⭐ **Sierra gained the THIRD view of a college: what it AWARDS.** `coci_college_programs` held 22,335 rows over 118 colleges that no retrieval path read, which is why she declined a real student LVN question ([#1601](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1601)). The design is a MEASUREMENT: the LVN question finds **53 colleges by program title, 44 by either code, 56 in union** — the 12 title-only ones are LVN-to-RN bridges coded Registered Nursing in BOTH taxonomies, because a code says what a program is ABOUT and cannot say who it is FOR. So the route returns the union, reports `matched_via`, and files a code-only match in its own labeled bucket. CIP is **loaded and never gated** (19,349 of 22,335 rows; blank on 13.4% against TOP's 0%), and generic-term frequency is counted **per surface** — *technology* is 7.8% of titles and 16.3% of the code vocabulary. ⛔ **The migration broke the nightly loader inside the hour**: three GIN indexes on a table whose loader rewrites all 22,335 rows in ONE statement pushed it past the statement timeout (57014), and measured they bought **4 ms** — 561.9 vs 565.8 ms ([#1602](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1602)). ⚠️ **The one-line synonym I proposed was wrong, and measuring it before shipping is what showed that**: *practical* is 9 chars so `practical:*` stems to `'practic':*` and prefix-matched Architectural PRACTICE, Teaching PRACTICES and PRACTICUM — 30 of 36 added title rows were not nursing. Phrases via `phraseto_tsquery` give **56 colleges and 0 noise**, up from 28 ([#1603](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1603)). Also caught: a multi-word term is a hard **42601** in `searchCollegeOfferings`, a PRIMARY path that would have returned null and silently dropped the course-catalog section; and `become` was a live search term returning *BECOMING a Social Media Influencer*. ⚠️ **A feature-branch push wrote the live public catalog** — `coci-offerings-sync.yml` had no `branches:` filter, so run 10 rewrote all three tables from unreviewed code before the PR had a single check finish. ⚠️ **`npm test` is not the suite**: it discovers `tests/*.test.js` only, CI runs **46 separate python3 steps**, and both of the failures that reddened #1601 lived there — three derived artifacts needed regenerating across the run. Two KB notes.
- **2026-09-17 (S271, SkyVeil — Rule 9 checkpoint)** — ⛔ **Sierra was dark for the MAP team for five days while every instrument said UP.** Reported as billing; it was a DEPLOY SKEW. The page ships on merge, the Edge Function only on a `cpl-chat-deploy.yml` dispatch, so a widget sending `x-team-pass` (#1568, 09-12) met a v65 preflight that did not allow it — and a browser answers that by refusing to send the request at all, which is why the function logged OPTIONS and no POST. ⚠️ **The probe passed ~40 times through it because curl makes no preflight** ([#1595](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1595)). Smoke 15b turned out to be the THIRD instance of the negation class #1566 fixed in 15a/15c ([#1597](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1597)). ⭐ **My College opened to colleges and the public without un-gating anything** ([#1598](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1598) + [#1599](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1599)): three of its four gated tables could never be un-gated — `map_college_cr_unit` holds **145,554 rows describing exactly ONE student** at a named college, course and credit recommendation — so four `_pub` mirrors carry only what may be public, suppression moved to BUILD time, and every base kept its RLS. ⚠️ Mutation-testing found a hole in the TEST: deleting the complementary-suppression loop left every privacy assertion passing, because a privacy test cannot see a utility regression. ⚠️ **A table name behind a variable is invisible to the dependency map**, which cost college-briefing four tables in the blast-radius projection until a SEED pinned them. Sam overturned a TOP-gated conclusion of mine with *"check the COCI program data"* — and CIP, measured, does not fix it. Two KB notes.
- **2026-09-17 (S267, SkyQuarry — Rule 9 checkpoint)** — The occupation opportunity register ships into the **My College** tab ([#1591](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1591)) for Sigrid's Bay Area Strong Workforce consortium meeting: 28 colleges, 6,903 rows, 1,223 adopt-now, precomputed because the matcher runs ~14 s per college and a room cannot wait on it. ⭐ **The picker already existed** — the tab's `college` scope ships `ready: true`, so live flipping between colleges needed content rather than scope work. ⛔ **`--region` was silently dropping 5 of the 28 consortium colleges**: it resolved against the fire/electrical proximity macro-region while `identity_rows()`'s own docstring forbade exactly that substitution, and the docstring's premise — *the SWP roster exists nowhere in this repo* — had stopped being true later the same day it was written. `--swp-region` reads the resolved roster now. ⚠️ **A 14-minute build wrote nothing** because the one `openpyxl`-dependent output went first; the tip-of-branch "import it inside the function" fix had made the module importable and left the run just as fatal. Also: the doc budget is **UTF-8 bytes, not characters** (⚠️ and ⭐ are 6 and 3), and the dependency map records **line numbers**, so it goes stale on any line shift in a file it maps. `lanes/partner-crosswalks.md` compacted back under budget; the 266 and 267 lineages have converged on `main`. Three KB notes.
- **2026-09-17 (S265, SkyPublius — Rule 9 checkpoint)** — Closes the funding-explainer run and the red-`main` repair. Lint-driven compaction this pass: `lanes/implementation-funding.md` **1.55× → 1.34×** (the vocabulary block deduped against `CLAUDE.md`, which states it in full; the closed decision sheet and three incident narratives cut to their durable rules), and `cpl_funding_lessons.md` **1.13× → under budget** by moving its three oldest sections VERBATIM to the archive. ⚠️ `CLAUDE.md` sits at exactly **1.0×** and the lane's state did not change, so §11 is deliberately untouched — adding a narrative there would have to displace something. Handoff written as **267, not 266**: `session_266_handoff.md` exists on the unmerged crosswalk branch, so the highest number visible on `main` under-reports. Four `cpl_memory` rows written and the crosswalk session's incident row superseded now that its claim is no longer true.
- **2026-09-16 (S266, close-out)** — the matcher gets a score against Delta's 139 rulings (0.907 precision / 0.51 recall) and prints it on every view; the agent-suffix stemming guard lands with a CI test; the To-Do feed trims to 12 with 16 parked; PR #1576 waits on two funding tests red on `main`.
- **2026-09-16 (S265, SkyPublius — `main` went red with nobody's hands on it)** — Sam, closing an unrelated session: *"I told it not to handle this matter but leave it to you."* ⛔ **Three assertions hard-coded figures out of `cpl_funding_performance.js`, which the daily dashboard workflow rewrites**, so `test` went red on a DATA REFRESH with no code change behind it: `cpl_funding_measure_picker` 4c (`826.8 CPL FTES` — `pac_u` moved 24,804.45 → 24,847.45), `cpl_funding_metric_pin` 7b ("at most the **3** `pp_u` carriers" — now **4**) and 7b2 (`25 units` — `pp_u` now 63.5). **Bisected before blaming anything**: green at `d906cf2` AND at the explainer merge `4a00bd9`, red only after the cron commits — the code was never wrong. ⚠️ **The cost landed on another lane**: the SJCOE crosswalk PR #1576 hit it, reproduced it against `origin/main` in a worktree, proved its diff touched no funding file, and stood down — red `main` taxes every PR opened until it is fixed, because the first duty on a red check is proving it is not yours. Every expectation is **derived from the artifact** now, keyed to a specific measure, with the rival asserted absent and `chosen !== rival` asserted outright so a check that cannot fail says so. ⚠️ **A mutation that changes nothing proves nothing**: forcing `earnFraction`'s statewide lookup left 4c green because that figure renders from a different path, which read as a weak guard and was not — the decisive mutations (neuter the picker's write path; point the portal prose rule at the applied lane) fail all three by name. New note: [`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md).
- **2026-09-16 (S265, SkyPublius — the explainer stops describing a model it no longer runs)** — Sam's pass on the public funding explainer ([#1588](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1588)): consistent language, fewer redundancies, priorities and timeline integrated, strategies folded, a table that fits, a PDF link. ⭐ **The priority card's plain sentence came from a map keyed on the priority TITLE** — glosses for the retired Access/Outreach/Success — so two cards fell through to the raw metric string and the third, still matching its key, described **eligible** units under a priority measuring **applied** units from the portal, landing page and batch upload. The card that lied was the only one that looked normal. Same shape twice more: the typed baseline requirements (page said *"A CPL Coordinator or Counselor listed in MAP"*, model says *"Primary CPL Contact listed in MAP and the college public CPL Landing Page"*) and a typed "1 Nov 2026" against a stored `2026-11-01` — **a date is neither currency nor a thousands-figure**, which is why both figure guards missed it. ⚠️ **A ban is only as wide as the files it opens**: `cpl_funding_calm` reads the tab's mount and `cpl_funding_earn_retired` reads `cpl_funding.js`, and their headers call the pair "the whole guard" — the explainer is a THIRD file and still said *"what it earns tracks…"* two days after the retirement. ⛔ **A SHARED SECTION ID IS A SHARED CONTROL**: the new section shipped for one commit as `priorities`, a tab id carrying the LIVE override *"Funding Outcomes of Ed. Code §78093.2(d)(1)"*, so the explainer's h2 was silently replaced and hiding the tab's section hid this one; found only because Sam then asked for the section titles to use the model's language, renamed to `outcomes`, and now guarded by reading `SECTION_HOUSE_ORDER` **out of the source**. ⚠️ **The print stylesheet IS the PDF's design** (the page prints itself — a file built once is the snapshot page this one replaced) and its first draft hid `.cplfund-caret`, which **is the institution's name**, printing 119 rows under an empty Institution column — invisible in markup and in jsdom, obvious in one screenshot. Measured: the table needed **1,039px in a 942px box** with District shown, so it takes the window now; and **138 focus rings were never drawn** because `--gold-accent` / `--navy-secondary` are COBI tokens this page never defined, mapped to its own `--focus-ring` (the gold is 1.74:1 on paper against the 3:1 a focus indicator needs). `npm run a11y funding-model` passes clean. New notes: [`methodology-a-display-name-is-not-a-key`](kb-notes/methodology-a-display-name-is-not-a-key.md), [`methodology-a-ban-is-only-as-wide-as-the-files-it-opens`](kb-notes/methodology-a-ban-is-only-as-wide-as-the-files-it-opens.md).

