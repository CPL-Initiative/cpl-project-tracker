---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-08-29
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
**Rule 8 checkpoints update these files now**, and `CLAUDE.md` keeps read-before
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
| KB notes | 352 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 75 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 75 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 41 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 183 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **730** | |
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
- **2026-08-29 (SkyCrush, S206 — day 2)** — the session **auto-compacted at 786,077 tokens** with the checkpoint 150K stale, ~778,000 dropped. ⭐ **Rule 9's premise was FALSE, not merely unobservable**: `message.usage` carries the live context every turn and `compactMetadata.preTokens` records every compaction, so the trigger needed a file read, not a proxy. `kb/_context_budget.py` + a PostToolUse hook + `scripts/install-context-hook.ps1` (Windows PowerShell **5.1** — three 5.1-only traps, and ⚠️ PowerShell cannot be executed from a session). ⚠️ **Thresholds must be a SUM of measured costs**: "2× checkpoint" missed by **336 tokens**, caught by its own test. New `docs/scenarios/` probe protocol — subjects get only the auto-loaded doctrine, the **rubric is committed before any probe runs**, and they report **holes, not a score**. Two more guard repairs: `self_corrected_word_pair` was ignoring its own advice (matched raw text while telling you to use a code span), and Rule 9a pointed at a settings block that did not exist. Ledger 7 of 9. #1387. ⚠️ `CLAUDE.md` left at **1.04× budget by Sam's decision**, to sort next session. 2 KB notes, 5 memory rows.
- **2026-08-29 (SkyCrush, S206 — final)** — the **`CLAUDE.md` consolidation**, all five PRs merged (#1381–#1384, CPLBrain#35): **151,484 B → 58,373 B**, nothing deleted. §11's 29 lane cells → [`reference/lanes/`](reference/lanes/); Sam's **assignment rule** (*push what a session cannot know to ask for; pull everything else*) into `CLAUDE.md` **and** `checkpoint.md`. ⚠️ **Six rules/guards stopped firing because content moved** — `stacked_roadmap_cell` keyed to a filename; **`docs/reference/**` never indexed at all** (0 → 37, every lane globs a flat `docs/*.md`); Rule 9 still naming the 2026-07-10 pare-downs, so a checkpoint would have left 30 lane files to rot; and **"PLAIN WORDS, NO GLYPHS" carried out of the file entirely** — a rule that had already failed the same way once via `cpl_memory`. New `## Presentation rules` section + `presentation_doctrine` and `unreferenced_offload` lints. ⚠️ **`npm test` 20.7 → 6.9 min in CI** with three symptoms that named the wrong thing (pipe truncation reported as 176 disabled rules). 2 KB notes, 8 memory rows. SkySolidare S204's narrative archived.
- **2026-08-28 (SkyLens, S203, Funding lane)** — the curator round trip is **proven**: Sam clicked Publish and his three relabels reached Supabase (md5 `9cf58b99…` → `c95e78aa…`). Curation narrowed to a magic-link reviewer (#1372, ⚠️ `cfp_insert_self` deliberately left open); the **Ed. Code §78093.2(d)(1) spine** landed with Timing as its own section (#1375); the `NC $` column retired and every institution paired as CR + NC rows (#1378). Three KB notes. Corrected three inherited claims — CI was never broken (a **conflicted PR cannot produce a `pull_request` run**), the story corpus is 32/3 not 5, and the $8.96M project pool has no breakdown anywhere. SkyLens S202's narrative archived.
- **2026-08-28 (SkySolidare, S204)** — this page is **generated** now (`kb/_build_docs_index.py`, `--check` in CI): 273,616 B → 20,757 B, per-lane listings moved to [`catalog/`](catalog/). Also 340 KB-note frontmatters canonicalized (`kb_note_dialect` 60 → 0, incl. 6 notes silently disagreeing about their own type) and the British-spelling sweep applied (`american_spelling` 174 → 1). #1373.
- **2026-08-28 (SkyLens, S202, refresh)** — the gate fix was half a fix: a local overlay survives sign-in and masks shared, so Sam's relabels never landed; plus the sign-in dropdown closing on any click. 3 more KB notes / memory rows.
- **2026-08-28 (SkyLens, S202)** — funding CR/NC lane switch merged (#1369); found a client gate stricter than its own RLS policy silently losing Sam's relabels; 2 KB notes; session-203 handoff.
- **2026-08-27 (SkyMatch, parallel to SkyPin)** — College CR evidence workstream: reusable matcher + LATTC worklist (PR #1365); two KB notes (a frequency is not a rule; one ranked list cannot answer two questions); §11 row added, SkyRule S196 narrative archived.
- **2026-08-27 (SkyPin, Session 199)** — the funding measure pin (`metric_src`) + the MILESTONE-agreement check (#1363); `ppa`/`ppa_u` after Sam's `Potential Student` correction, and the live Access metric fixed from $0-for-all-115 to 12 colleges earning (#1364). New KB note: *a defect that produces the value you expected is invisible*. Compacted the §11 funding cell (stacked_roadmap_cell) and archived `cpl_funding_lessons.md` 2026-08-01 → 08-06.