---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-29
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
| KB notes | 498 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 80 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 50 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 273 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **987** | |
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

- **2026-09-29 — S300 (SkyLoom):** two ports of the College Dashboard reconciled: what #1731 carried that #1729 lacked, and S299's five follow-ups, landed as [#1732](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1732) (TBA everywhere, the grants table's layout, the printed explainer, the CSV's Demonstrated); Sierra Training round 1 ported ([#1733](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1733)); seven asks on one sheet; the funding lane compacted under its budget. S299's own handoff carried to main as `session_300_handoff.md`.
- **2026-09-28 — S298 (SkyLatch):** UI fixes through a live mockup drawn by COBI's own code: Sam locked the College Dashboard redesign in seven rounds and ruled that funding waits on all three minimum conditions ([#1726](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1726)); the Sierra Training tab entered the same process. New: [`ui_mockup_lessons`](ui_mockup_lessons.md), [`methodology-mock-up-from-the-running-code`](kb-notes/methodology-mock-up-from-the-running-code.md).
- **2026-09-28 — S297 (SkyLantern):** the SQL approval prompt's source found: the Supabase connector's Tool permissions in Sam's claude.ai account, set read-only, which he changed; seven SQL calls then ran without a prompt, and S298's three-call test in a new session closes it. The opening line's `check_hooks_live.py --fix` sentence removed on Sam's ruling; the open-asks sheet published (https://claude.ai/artifact/C1uyRhneegqQ4XSPRKiC3B). KB note extended: `methodology-verify-the-premise-before-you-build-on-it` (case 3). Handoff 298.
- **2026-09-28 — S296 (SkyBeacon, emergency checkpoint):** funding asks card 1, the Annual view compares a year with a year ([#1721](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1721)); the ETHS re-mint's dry run ([#1722](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1722)) and its land, 26 KINE, 4 ATHL and 1 PEDS with the first continuation-band-2 ids, `kb_curation` re-keyed by `supabase-rekey.yml` ([#1723](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1723)). Handoff 297.
- **2026-09-27 (S295 SkyHarbor, second checkpoint):** Sam's eight CLAUDE.md verdicts carried out ([#1712](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1712): the context meter installs at the session root through `check_hooks_live.py --fix`; [#1713](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1713): the emphasis sweep; vault #185, #186; knowledge base #23 waits for his merge), and the standing open-asks sheet reconciled and published fresh ([#1714](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1714)): seven of its cards were answered rulings, two contradicting his August answers. KB note extended: `methodology-a-settled-ruling-does-not-enforce-itself`. Handoff 296.
- **2026-09-27 (S295 SkyHarbor):** the CLAUDE.md prompt audit (narratives to `docs/reference/doctrine_provenance.md`, eight calls on a sheet), main's lints fixed (#1709), the ESL apply and its monthly pass; handoff 296.
- **2026-09-26 — S294 (SkyCadence):** narration v3 and `narrate.py` ([#1701](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1701)); the ESL merging procedure sheet, nine items, and four stale open-asks cards retired ([#1702](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1702)); the narrated draft of the funding introduction ([#1703](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1703)); Sam's ESL verdicts, all nine as proposed: the reader fixes, the ladder script's tests, and the data paste with its rollback ([#1704](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1704), `kb/esl_sheet_out/2026-09-26/`); KB note `methodology-hear-a-synthetic-voice-through-a-recognizer`; handoff 295.
- 2026-09-25 (S291 SkyReel): the funding guide video, a KB note on rendering HTML animation to MP4, handoff 291.
- **2026-09-25 — S288 (SkyZ):** `TOP_Code_Lookup.xlsx` column D corrected against the TOP manual (81 of 198 codes disagreed with their titles), the EACR's unsectored rows 890 → 379, guard in CI ([#1692](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1692)); Sam's ruling that TOP is unreliable and program CIPs are almost fully reliable; a program-CIP route for courses measured and not shipped (8 better, 15 worse of 30); on Sam's scoping ruling, exams sectored from their titles (`kb/reference/eacr_cip_title_rules.json`, unsectored cards 449 → 3, live and verified, [#1693](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1693)); `check_hooks_live.py --fix` now applies the stop-hook patch that three-repo sessions never ran. KB note `methodology-a-program-cip-labels-the-program-not-its-courses`. Handoff 290.
