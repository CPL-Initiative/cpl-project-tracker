---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-01
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
| Doctrine (behavior-shaping) | 4 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 364 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 75 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 75 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 42 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 193 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **753** | |
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
- **2026-09-01 (SkyMeld, S218 — four outcomes fold into three bands)** — **Sam's consolidation shipped** (PR #1429, `724feac`): the Implementation Funding tab carried **two sections describing one allocation** (the priorities and the §78093.2(d)(1) goals, stitched by a superscript) and is now ONE — **(A) Access · (B)+(C) Success · (D) Opportunities**, his fold, with membership **DERIVED** from each metric's milestone (the resolver the earning math uses, so band and dollars cannot disagree), an **orphan band** so nothing vanishes, the goal spine kept as the (d)(2) fold, a new `accepted` milestone → (B)+(C), and two measure sources declared (`ppe`/`ppe_u` live; `pac`/`pac_u` omitted-not-zeroed until the attestation column). ⭐ **The finding that carried it: the model pays 34.0% of the credit slice and 84% of that comes from the one measure 97 of 115 colleges already max out** — an over-target measure is an automatic payment, the mirror of the unmeasurable-metric failure. Sam ruled the dials (Accepted 25% / factor 1.0) — **his to set via the tab**. ⚠️ He also **corrected the session**: the counselor step CAN be batch-loaded, so it is a **policy attestation, not a technical guarantee**. Caught and mutation-pinned a bug the banding introduced (one grid per band silently killed reorder outside the first). 2 KB notes ([`kb-notes/methodology-a-measure-everyone-clears-incentivizes-nothing`](kb-notes/methodology-a-measure-everyone-clears-incentivizes-nothing.md), [`kb-notes/methodology-grouping-a-flat-list-breaks-single-container-wiring`](kb-notes/methodology-grouping-a-flat-list-breaks-single-container-wiring.md)), 4 memory rows.
- **2026-09-01 (SkyDeck, S217 — the 9/02 session deck + the sunshine rule)** — Sam's Taco Tuesday deck rebuilt (8 → 14 slides, in CPLBrain `04-projects/cpl-initiative/`): agenda 30/5/10, the ESS 25-82 $50K review + a reporting-methods slide, THREE Ed Code §78093.2 slides (incl. the statute verbatim), funding at **general principles only — the sunshine rule (Sam, verbatim in the lane file): no new-model specifics outward until CO leadership confirms**. Priorities read from the live config; the deck's stale Oct. 31 opt-in corrected to Nov. 1. Found: two STATIC prose passages in the public explainer still assert the old model (painter fixes numbers, not prose) — lane NEXT ①. PR #1427 confirmed merged. 1 KB note ([`kb-notes/methodology-a-live-painted-page-still-goes-stale-in-its-prose`](kb-notes/methodology-a-live-painted-page-still-goes-stale-in-its-prose.md)), 2 memory rows.
- **2026-09-01 (SkyPort, S216 — the one-pool model shipped)** — **the port is DONE and every test is green** (PR #1427): `cpl_funding.js` runs the adopted model (118 institutions · $150K/$400K combined · FTES-share CR/NC decomposition · F1 · origination for the trio, N2 b), the whole 33-suite family re-aimed by a **5-agent fan-out** (~2,000 checks; retired mechanisms became absence guards naming their R-ruling), and the ports **found three product bugs** — `prioTarget`'s missing lane slice (cap ÷ target scattered 1.5076×), three consumers still keying rows by the retired `"c:"+order` (the `?college=` deep link and the "✎ Confirm" chip were dead clicks), and the bold name vs the low-key-rows ruling — all fixed. Sam ran **three live reaction rounds** (collapsible sections · one rem column template — em grids misalign across font sizes · verbatim statute folds · his Summary bullet · "Version as of" · Draft memo / Save as PDF · Internal·Public preview · metric on the card face · the max-award definition · LA Southwest / Riverside City via `display` aliases) and tightened vocabulary to doctrine (**funding never "pool" · "on its face" banned**). 2 KB notes ([`kb-notes/methodology-a-locked-mock-s-figures-of-record-are-the-port-s-anchor-test`](kb-notes/methodology-a-locked-mock-s-figures-of-record-are-the-port-s-anchor-test.md), [`kb-notes/methodology-shared-grid-columns-must-share-one-unit`](kb-notes/methodology-shared-grid-columns-must-share-one-unit.md)).
- **2026-08-31 (SkyPool, S215 — labels ruled, the mock became the whole tab)** — Sam ruled the detail labels twice in one sitting, landing on **Current Total / Total Possible** (the ceiling — his refinement after "Potential Total" read two ways), built into every expand, statewide card, and the trio (#1424); then, on his ask to see the fully revised tab before the port, the reaction visual became the **COMPLETE revised tab** (#1425) from a measured inventory of `cpl_funding.js`'s ~30 rendered surfaces — Baseline-eligibility card (N1 a), §78093.2(d)(1) goal cards + measure-derived superscripts, sticky header + ONE SYSTEM row, live search, the MAP-team note, and the **R1–R11 "what leaves the tab" sheet (8 ruled · 3 proposed, reply by number)**, which is now the port's approval surface. 1 KB note ([`kb-notes/methodology-a-phrase-sweep-misses-what-a-line-break-splits`](kb-notes/methodology-a-phrase-sweep-misses-what-a-line-break-splits.md)), 2 memory writes (1 new + 1 receipted in-place correction).
- **2026-08-31 (SkyLedger, S210→S214 — the one-pool day)** — **Sam ADOPTED the one-pool funding model** ($25.24M · $150K floor / $400K cap per institution, CR+NC combined; the NC-only trio earns by ORIGINATION, no advances — rulings N1 a / N2 b / N3 a): the Budget Balance mock he set the dials on (#1419/#1420), the who-moves card on the live tab (#1421), the One-Pool Funding Tab visual with phases 1–3 (#1422), and the CCC-norms vocabulary sweep + doctrine (#1423 — *funding* never "money", **max award**, alphabetical lists). NC protection = **the earning rule, not a second pool** ([`kb-notes/methodology-funding-is-restricted-by-its-earning-rule-not-by-a-label`](kb-notes/methodology-funding-is-restricted-by-its-earning-rule-not-by-a-label.md)); **F1 pending** (hold vs label on the $1.3M of college NC shares). Memo A became an editable GR-tab surface (`gr_memos`, #1418); origination-feed instructions delivered for Malone/Pedro (CPLBrain#67). 1 KB note, 4 memory rows.
- **2026-08-30 (SkyMirror, S213)** — booted from a **stale greeting** (named 205/208 against highest 212 — Rule 9's failure mode, verified and flagged) with no pointer paste, and the doctrine chain still fired end-to-end; found S212 queue item 1 already merged without a checkpoint, and caught the docs up: the **register re-analysis sheet is BUILT** (#1413) and **awaits Sam's by-number verdicts**; lane file + To-Do feed now say so, with the sequencing rule (Sierra small-model sweep BEFORE verdicts rewrite rows). **Doctrine-probe lane groundwork banked vault-side** (criteria re-read vs the settled corpus, dated addenda, perimeter verified, ablation-redo recipe — CPLBrain#59); a fourth defeat-by-diligence instance is recorded with the instruments, and [`kb-notes/methodology-the-instrument-may-not-live-inside-the-system-under-test`](kb-notes/methodology-the-instrument-may-not-live-inside-the-system-under-test.md) gained the abstract form. Merged both 2026-08-30 checkpoint halves (#1414/#1415), tightening this session's tracker text to handoff 213's vault-only boundary. 0 new KB notes (1 updated), 2 memory rows (1 later superseded to honor the boundary).
- **2026-08-30 (SkyLedger, S210 — PM)** — **the three-repo attach practice became session-checked doctrine** (#1411/#1412, Sam's two yeses): `CLAUDE.md` verifies the set at session start and names what's missing; `scripts/install-three-repo-check.ps1` is the one-time per-machine backstop for the zero-repo case (no CLAUDE.md loads there — a repo-less session is generic Claude, said honestly); guide §12 carries the human half with his reason verbatim ("so they can stay informed and syncd"). A **parallel session line** booted off the one-line handoff pointer and shipped the ordered **Register Re-analysis decision sheet** (#1413 — 22 items awaiting Sam's reply-by-number verdicts). ⚠️ To a primed session, a go-ahead is a work order — "keep going" launched the queue, legitimately. 1 KB note ([`kb-notes/methodology-a-human-gated-practice-becomes-a-machine-checked-one`](kb-notes/methodology-a-human-gated-practice-becomes-a-machine-checked-one.md)), 2 memory rows.
- **2026-08-30 (SkyLedger, S210 — the Open Verdicts sitting)** — **decision sheets became Sam's standing method** (#1406; CLAUDE.md bullet + team-guide §11) and he ruled the 19-item Open Verdicts sheet LIVE, all executed and merged same day: the **Combined award column** (his spec: a pair-spanning column, not a third Award-range row), **frozen header + statewide pair** (measured pins), the **project-pool card wired to the Budget table** (one $18M program, drift line, never a per-share split), **goal-card policy** ((C) demonstrated not measured; equity in the 3-year reports), the **scope migration** (68→2 values, per-row receipts), the tab folds, **§55050 recorded SENT 2026-08-28**, the **post-SB 135 register re-analysis ordered** (instrument per row), and **Blast Radius live on Admin** (#1407–#1409). On-the-fly braindumps became vault doctrine with two real captures (CPLBrain#48/#49). ⚠️ A piped test run reports the pipe's exit — CI caught what local masked ([`kb-notes/methodology-a-piped-test-run-reports-the-pipes-exit`](kb-notes/methodology-a-piped-test-run-reports-the-pipes-exit.md)). 1 KB note, 3 memory rows (plus the sitting's 15 verified ruling rows).

