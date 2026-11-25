---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-25
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
| [Design principles (v3)](reference/design-principles.md) | `CLAUDE.md` §Presentation rules, issue #3107 (2026-11-14) | building or mocking any view: the job first, tool or view, ship checks |
| [Sam's rulings](reference/sam_rulings.md) | issue #3055 item 2 (2026-11-14) | before asking Sam something he may already have ruled: his words, dated, with a link to each rule; a row with a Replaced-by entry no longer stands |
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
| Doctrine (behavior-shaping) | 6 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 605 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 110 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 77 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 687 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1580** | |
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
- 2026-11-25 (S730 SkyDunlin, Sam's plain session, light checkpoint): #3824 (Needs you folds to its card; a doubt ruling moves the in-doubt count at once), #3826 (`npm run a11y` on the Commons fold: an h2 above the folded card, 24px card titles).  #3831 (Sam's stray-code ruling and the title hunt list for COBIx, 8,786 untitled college and code pairs). Handoff 731.
- 2026-11-25 (S729 SkyCurlew, Sam's plain session, full checkpoint): #3817 (the Commons fold in place: a card's title folds the page to a trail and that card at `#commons/card/<key>`, with Open the full list); the adapt gather landed (PEDS M1029 holds 293 local courses); the commons lane compacted under 20 KB. Handoff 730.
- 2026-11-25 (S727 SkyTropicbird, the CPL Queue routine's collection run, conductor, full checkpoint): #3808 (display build `f4b48370bc11`, 18,711 rows live; the subject-codes test accepts a code a person's statewide filing settles), #3812 (the land PR: the pooled reading's 11 to passing, Shasta 4, American River 12 and College of the Canyons 7 with named gaps, three new gap kinds); applied and loaded on open branches: #3811 (San Bernardino Valley, Orange Coast 3 and Southwestern, all passing), Santa Barbara City 12, Antelope Valley 43028; #3810 (the eLumen fix, scoped to its road) in flight. KB note `methodology-a-reader-fix-moves-rows-it-was-not-aimed-at` gained an S727 section. Handoff 728.
- 2026-11-25 (S726 SkyAvocet, Sam's plain session, full checkpoint): #3802 (Gather's saved filters, gather_filters, DR-36), #3805 (Rows on the Courses List: Common courses or Local courses), #3806 (the adapt gather into PEDS M1029, 167 receipted rows), #3813 (a Commons card's title opens its own list). Handoff 727.
- 2026-11-25 (S725 SkyPlover, Sam's plain session, light checkpoint): #3799 (Gather, the first slice: the Gather view of Courses and Programs; words, subjects and target in its address; insert-only merge_into saves with Take it back). Handoff 726.
- 2026-11-24 (S724 SkySandpiper, Sam's plain session, full checkpoint): #3790 (a why line on each band in doubt; Cabrillo KIN 38A to KINE M1344, one receipted row), #3792 (Blocked on COBI), #3793 (tick courses or the M-ID, move them with MQ notes, descriptions and units), #3794 and #3796 (sidebar for narrow work, bottom bar for wide work; tabs act as well as inform), #3797 (the Courses List's tabbed bottom bar; panel tables sort, filter and resize). Six mocks; the anchor-page build approved. Handoff 725.
- 2026-11-24 (S723 SkyBooby, Sam's plain session, light checkpoint): #3778 (the Commons top section: two ETA columns, Needs you as links only, links land highlighted on card links), #3781 (Rulings to find, the doubt list in Needs you, COBIx never rendered), #3784 (no cost bars; the way back survives a tab's redraw), #3785 (Common subject in doubt: full lists with codes, Accept on the band, Local subject column). Two CLAUDE.md naming rules. Handoff 724.
- 2026-11-24 (S722 SkyCormorant, Sam's plain session, full checkpoint): #3768 (a Courses count reads its code's own course file, never the 17 MB state list), #3771 (Titles to check: a derived title stands at 80+, Accept on the row and per title, the 0-100 confidence bar as one component, sidebars never cover the view, quick links land on a link, the Commons names COBI, never Sky); #3770 withdrawn in #3771. KB note: `methodology-a-source-that-only-checks-the-winner-never-wins`.
- 2026-11-24 (S721 SkySkua, the CPL Queue routine's collection run, conductor, full checkpoint): #3761 (display build `6de40ebdf2fd`, 18,699 rows live), #3765 (Orange Coast's 3 collected with named gaps), #3769 (Palo Verde 15, Porterville 15, Gavilan 7 and Butte 5; three new gap kinds), #3763 (the reader-page lever: 12 loaded, 11 passing; 14 named gaps) and #3764 (the pooled reading, applied: 8 at Modesto, 7 named gaps to passing); 65 records collected; the test kb-note's section on a test that reads its own plan's receipt; 23 memory rows drafted; handoff 722.
- 2026-11-24 (S720 SkyEider, the CPL Queue routine's collection run, conductor, full checkpoint): #3754 (display build `abf1f6396156`, 18,665 rows live), #3753 (Fullerton's 6 collected with named gaps), #3756 (no electives fill over a cut-off window; a reconcile keeps named gaps); applied and live in open PRs: #3758 (ten colleges' piles, 95 named-gap records), #3759 (American River 04544 corrected; nine `section_cut_off` gaps at Los Rios), #3752 (the reader-page lever, 16 passing at Mendocino, Los Angeles Southwest and American River). Handoff 721; the harvest lane rebuilt under 20,000 bytes; lessons S691 and S697 moved to archive 8.