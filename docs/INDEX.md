---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-05
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
| KB notes | 391 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 76 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 76 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 42 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 208 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **797** | |
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
- **2026-09-06 (SkyBuild, S233 — the observation log worked, then Sam drove it)** — A computer-use session logged sixteen findings against S232's brief (#1493). **Four were real**: the panel kept its scroll when opening an identity (reset at the ENTRY points only — `renderNode()` fires on every keystroke, and resetting there restates Sam's ruling 3a friction as a feature); ⭐ *"no click path back to the discipline"* and *"Escape backs out only if you arrived by keyboard"* were **one defect**, the keyboard cursor being set only by the Tab/Enter path, so the back path existed and was unreachable by mouse; `DESC_BASES` tried an uncommitted local base first, costing a guaranteed 404 per discipline on the deployed page; and the identity-system chip, 13 of 16 chips on a panel, carried no title. **Two were not defects** (Pan/Move do carry `aria-pressed`; `row count` does carry an explaining title), and ⚠️ **the finding ranked first was the most wrong** — the brief's payload figure was correct for the file it named and the session had measured a different payload on the same page ([`kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names`](kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names.md)). Found while reproducing it: the **atlas payload is twelve days older than the universe payload** and nothing rebuilds it on a schedule, which is the whole of the 117-discipline disagreement and a live inconsistency between the map and the discipline tables — NEEDS SAM. Then Sam drove it and reported five more, all fixed: the hover returned the **identity** card on 14 of 30 college courses (an opened ring spreads over its neighbors and `pick()` gave the circle priority); the purple background is the **membership glow** reaching 983px on a 960×600 canvas, not the focus disc; `weldi` lost *Introduction to Welding* because the tiers tested the string start only, so a term beginning a WORD now ranks with one beginning the string; Hide survives the next pick; and the suggestion list is paged, ranked once to 300 and revealed 60 at a time. Plus **Similar courses** ordered Beginning → Intermediate → Advanced. ⚠️ **Two guards had to be rebuilt** — the existing fixture can never produce an overlapping ring or a disc large enough to clamp, so both tests passed with the fix deleted; [`tests/ccr_skyview_hover_disc.test.js`](../tests/ccr_skyview_hover_disc.test.js) replaces them ([`kb-notes/methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration`](kb-notes/methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration.md)).
- **2026-09-05 (SkyReply, S231 — two controls that were never broken, then the course outline)** — Sam's two reports (#1486) both turned out to be working controls acting on empty surfaces: the search dropdown had carried `overflow-y:auto` since it was written and was asked for **8** suggestions out of 200+ matches, and the Show switches moved a label and a count while the map drew nothing, because courses only draw past `NODE_ZOOM` 0.20 and SkyView opens at **k = 0.100**. Fixed by making the filter reach what IS drawn (an emptied discipline stops being drawn) rather than lowering the threshold; `pick()` honors the same filter. ⭐ **The Chromium sweep found what the green suite could not** — a stale built `skyview.html`, and a second-order gap the fix itself created (a discipline pick landing on ground the filter had just cleared). Then Sam asked for a **course outline on double-click** and drove it through six messages into the lane's purpose: prototyped on live WELD M1109 data, **no code shipped** — his rulings are MAP-Generated labelling in his own words, a layered panel, re-mint only when verified and admin-released, and thin skills kept with a confidence chip. ⚠️ Measured and central: **97%** of clustered identities carry no authority text, all **13 MC slots are unsourced**, and for welding we hold **57 credit recommendations and zero agency skill statements**. 3 KB notes (a control live on a surface that draws nothing; provenance as a document's spine; the CPL guiding question).

- **2026-09-05 (S232)** — All eight queued rulings executed. The alias chain declared once in
  `kb/alias_chain.py` with a CI guard; the articulation identities map re-keyed and a plan that would have
  deleted 172 live C-ID identities caught first. New: `adr-remint-approval-queue-decision-rights`,
  `methodology-a-liveness-set-must-be-able-to-contain-what-it-judges`. `CLAUDE.md` back under budget
  (S228 + S230 narratives archived); the SkyView lane compacted of superseded blocks.
- **2026-09-05 (SkyKeep, S230 — the sheet takes replies; SkyView's second list; the CCR click opens the full window)** — Sam's two asks in #1481: every item of the memory audit sheet carries reply chips, a Follow up toggle and a note that save to the artifact's own store (`kb/_decision_sheet_replies.py`, read back with `read_db`), and SkyView took the whole second list — a header in the style of Claude's own (icon actions, a title field, one More menu), the Show menu, the legend's corner fold, *How SkyView works*, the OS window controls and a ☰ for COBI's rail, the search as a selection of chips, a dark canvas on `--sky-*` tokens — while the CCR click opens the full window. Two KB notes: the replies playbook, and a generator that lags its output is a trap.
- **2026-09-05 (SkyGrain, S229 — the memory hopper tested end to end; the table's first lint)** — Sam's ask: test every unverified memory against current truth and clear out anything stale. `kb/_memory_audit.py` (twelve structural rules, receipts under `kb/memory_audit/`, 47-check guard in CI) found almost nothing structural — 3 dead paths in 653 citations, 1 duplicate pair — so the staleness is semantic: thirteen read-only auditors read all 527 proposed rows against the lane files, `CLAUDE.md`, the code and the live tables with a citation per verdict (1,150 of 1,240 file quotes found verbatim by a spot-check). 31 cleared under a receipt (11 stale, 20 superseded with a pointer), 352 corroborated and held for Sam's go, 144 on a plain-English sheet oldest first ([`visuals/2026-09-05-memory-audit-verdicts.html`](visuals/2026-09-05-memory-audit-verdicts.html)). ⭐ Sam's two rulings, on the fly: the older memories are the concern; a sheet reads in plain English. ⚠️ The auto-mode permission layer declined the bulk write when delegated or prepared as a dump and passed the direct guarded statement. 1 KB note ([`kb-notes/methodology-a-memory-table-goes-stale-in-its-claims-not-its-links`](kb-notes/methodology-a-memory-table-goes-stale-in-its-claims-not-its-links.md)), 7 memory rows, PR #1480.
- **2026-09-05 (SkyQuiet, S228 — SkyView is the map alone; the workspace tab)** — Sam's three asks shipped in #1479: the CCR menu opens SkyView alone (`body.u-solo`; COBI's tab hides its chrome in map mode), the comprehensive view is one menu click away and never the default, and items 6-9 are one *Disciplines and subjects* tab with a By subject (SUBJ4) grain. The harness found a click that destroyed the page's only search box; `setCrumbs` is the one choke point now. New KB note: `methodology-verify-an-ask-against-what-the-reader-sees`.
- **2026-09-05 (SkyMint, S227 — SkyView's top row, and a search that was never broken)** — Sam's items 1-5, 10 and 11 (#1476): title leftmost, the four view links folded into one `Views` menu, the search moved into the row and widened with a visible "Search" label, a close control, and exact search-result zooms (1000% for a course, 150% for a discipline — the old fitted zoom made its own readout meaningless). ⭐ **Item 11 was structural**: the page's one search field lived in the masthead, and browser full screen paints only `#u-full`, so in full SkyView the box did not exist rather than failing to take a click. The form is now BORROWED into the row and returned before any other view replaces `#view` — `innerHTML =` detaches rather than destroys, so a node nobody references is gone, listeners and all. ⚠️ A closed `<details>` still LAYS OUT its contents in Chromium; the sweep found all four menu items escaping the viewport at 390px and focusable with no ring. ⚠️ The title that returns here was REMOVED on 2026-09-03 for pushing the links under the masthead's dropdown — the guard against that symptom would have blocked this fix, so it now pins the invariant instead. 1 KB note ([`kb-notes/methodology-ask-which-container-before-you-debug-the-control`](kb-notes/methodology-ask-which-container-before-you-debug-the-control.md)); `check_ccr_atlas.js` +13 Chromium checks, `ccr_skyview_universe` 126 → 131.
- **2026-09-04 (SkyMint, S227 — SkyView item 2: the CCR list view, and "subject" was the wrong word)** — Sam's item ② (*"for 2 I meant CCR List View"*) turned out to be one confusion with two halves. ⭐ **"CCR list view" names no view inside the prototype** — it is COBI's Common Course Reference tab, the page SkyView is *embedded in* (`unified_courses.js` mounts `prototype/skyview.html` as an iframe beside the list). So `#u-ccr-list` links OUT to `index.html#unified-courses` in a new tab and **removes itself when framed**: inside that tab it would open the page the reader is already on, which is worse than absent because it looks like it worked (the ESL link's `ne.remove()` rule, one step further). ⭐ **"Subjects as a list" listed disciplines** — `__ccrSubjectList` maps `U.islands` and reads `I.d` — so it showed exactly what "All disciplines" shows as cards, while COBI already spends "subject" on SUBJ4 codes in its Common Subjects Reference tab. Every rendered use is now "discipline"; `kind:"subject"` stays the internal branch key and `kindWord` is what a reader sees, with the test asserting both so they cannot drift. Closes the SkyView half of the lane's queued NEXT ⑧. ⭐ **`npm run a11y` caught the link written minutes earlier**: all four `.linkish` nav controls measured 21.3px against WCAG 2.2 SC 2.5.8's 24px floor (the inline-target exception covers a link in a *sentence*, not a row of view switchers), plus an `h1 → h3` skip below the map — both fixed, and SkyView now passes the sweep clean at every width. `tests/ccr_skyview_universe.test.js` 123 → 126; the prototype's Chromium harness green.
- **2026-09-04 (SkyMint, S227 — one command for accessibility, and the first sweep tunes itself)** — Sam ruled the three-mechanism enforcement plan down to its first third: *"For accessibility, use the simplest approach that sets us up for continued long term use on all projects."* What shipped is **`npm run a11y`** — `scripts/a11y.js` (the project-agnostic engine, renamed from `check_public_page_layout.js` because "public page layout" would tell every future session COBI was not covered) plus [`a11y.config.js`](../a11y.config.js), the only file another project rewrites. 42 views in ~100s: COBI's 38 hash routes **discovered from its own nav**, so the next tab is measured the day it ships and a hand-maintained list of 37 cannot silently stop being 37; a zero-route discovery FAILS rather than printing a clean bill. ⭐ **Six of the first run's loudest findings were the harness**, one of which reported a control as broken *after* it was fixed (a `label[for]` substitution swapping a 32px box for the 21.7px label beside it) — the natural next move would have been to damage a passing control. ⭐ **The chrome-wide fixes are single edits that clear ~200 findings**: the sidebar group headings were `#8a8a86` at 3.38:1 and 23.9px tall, the signed-out line `#888` at 3.33:1, the brand link and search box both 21.7px, the First Light fallback white-on-gradient at 3.08:1 (pure white would not have fixed it — the gradient had to come down), and COBI honored `prefers-reduced-motion` in none of its five animations, now stood down app-wide by [`cobi_a11y.js`](../cobi_a11y.js). Remaining and named, not hidden: 5 routes scroll sideways on a 390px phone (dashboard by 887px), 18 carry 86 sub-AA pairs, and 4,042 sub-24px targets collapse to **54 selectors** — 2,200 of them one button in one dense grid. 1 KB note ([`kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument`](kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument.md)), 1 bumped (`audit-by-rendered-value-not-by-file`), new suite `tests/cobi_a11y_baseline.test.js` (17 checks).
- **2026-09-04 (SkyMint, S227 — the masthead decluttered; accessibility turns out to be a lint)** — One PR (#1469) on Sam's six masthead asks: the "Chancellor's Office Business Intelligence" tagline gone from the header AND from the `<title>`/`og:title` it also rode in (via `COBI_TITLE` in the generator, Rule 1); the gold CPL superscript and per-site org tag gone, with `cobi_brand.js` now SWEEPING any `.cobi-num` so a cached `cobi_orgs.js` cannot restore it; Manually Refresh moved into the About menu at RUNTIME (the generator re-injects it after `.last-updated` every cron run, so markup edits get undone); the team phrase folded into the identity chip via `mountInto()`, answering — rather than deleting — the docstring that argued against nesting a site-scoped credential inside a personal one; site options reading `<code> — <full title>`; and the alpha banner rewritten after Sam struck its "don't cite or share outside the team" as FALSE (COBI's figures ship outward through Sierra and the Fact Sheet), then made low-key at his direction. ⭐ **The zoom mess was three CSS defaults, not styling** — a bare `1fr` is `minmax(auto,1fr)`, a flex item defaults to `min-width:auto`, a non-stretch `justify-self` sizes to content; each alone reproduces it, and `.cobi-brand` drew 580px inside a 322px track at 768px. `main` fails 19/136 Chromium checks; head passes 196/196. ⭐ **Seven real AA failures in the masthead alone, three written the same session**, one minutes after a comment saying not to — so the finding is that doctrine states a standard while only a measurement detects a violation, and accessibility wants a lint whose detection, firing and remediation are three separate mechanisms. A 38-view sweep then showed the failures cluster on an **unreconciled raw-hex palette** (`#94a3b8`: 4,827 renders from 32 lines in 2 files), not on token misuse; its totals were retracted as harness-inflated the same day, and one palette ruling from Sam unblocks the fix. 2 KB notes ([`kb-notes/methodology-a-grid-item-sized-to-its-content-overflows-its-track`](kb-notes/methodology-a-grid-item-sized-to-its-content-overflows-its-track.md), [`kb-notes/methodology-audit-by-rendered-value-not-by-file`](kb-notes/methodology-audit-by-rendered-value-not-by-file.md)), 1 bumped (`a-rule-you-wrote-is-not-a-rule-you-applied`, with the sharpest instance yet), new checker `scripts/check_cobi_header_layout.js` (196 checks across 17 widths), masthead suites +47 checks.
