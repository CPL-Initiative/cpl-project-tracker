---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-06
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
| KB notes | 396 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 76 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 79 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 42 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 211 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **808** | |
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
- **2026-09-06 (SkyOutline II, S235 — the course outline of record, and three rulings)** — ⭐ **THE OUTLINE IS BUILT** — planned three times, cleared three times, built zero (#1502). `#outline/<id>`, reachable by double-click or a panel button, six layers, and the layers we cannot fill yet (MAP exhibits, military CRs) are **present and empty** because an outline that omits them reads as finished. **The description is chosen, never written**: the *medoid* member catalog description — the one that says what the rest say — quoted and attributed to the college that wrote it, since composing prose out of several catalogs would read as authoritative while belonging to nobody. Sam's sentence prints verbatim. **Skills are imputed** from the colleges' own words, because we hold **zero** agency skill statements; confidence is agreement BETWEEN colleges and thin skills stay, chipped. **Two level axes, neither derived** — measured both ways: `WELD M1012` is course-level *Advanced* with its skills mostly "not stated", `WELD M1073` has no course level and carries a skill reading *Beginning*. ⚠️ **Two extraction defects invisible to jsdom and to reading the code**: every n-gram length counted per position, so fragments outscored the names containing them ("shielded metal arc" beside "shielded metal arc welding"), and n-grams crossed the commas catalog prose is full of ("pain tissue integrity gas"). Sam's three rulings all shipped: Enter closes the panel (sort control to the list's top right, an Enter button at the bottom; `markSug` now addresses rows by id, since a header child would desync every arrow key), double-click opens the outline, and the chip row reserves its space. The stranding is fixed — `#work/<discipline>`, a named crumb back to SkyView, and the selection parked and re-rung on return. ⚠️ **Both inherited diagnoses named the wrong place**: the 36px drop is `.sugwrap`, not `#u-bar` (which never moves, so a fix there would have shipped and changed nothing), and the picks were destroyed leaving the map rather than returning to it — 1 KB note ([`methodology-a-correct-measurement-can-name-the-wrong-place`](kb-notes/methodology-a-correct-measurement-can-name-the-wrong-place.md)). 23 new checks, both key guards mutation-tested; five existing assertions rewritten to the reversed rulings rather than deleted. Sam's four new asks captured verbatim.
- **2026-09-06 (S234 — a screen recording, measured in a browser)** — Sam recorded 6m50s driving SkyView and narrating; the new **`video-context` skill** (`kb/_video_context.py`, PRs #1498-#1500) cut 23 scene-aware frames and a 138-segment transcript **entirely on his machine** — the cloud cannot do it, because the egress proxy denies both his file's hosts and Whisper's weights, though ffmpeg itself works there from the `imageio-ffmpeg` wheel. ⭐ **Two defects measured in Chromium, neither visible to jsdom**: the search dropdown drops **36px — one row height** when the chip row wraps at pick 4 (ruling 3's `scrollTop` fix holds exactly as designed; the complaint had a second axis, the list's *position on screen*), and **double-click strands** because `discipline()` never calls `syncHash()`, so Back, `hashchange`, the Views menu and refresh break together and the return rebuilds the canvas. ⚠️ **Sam retracted a finding on camera** — 30 seconds reporting the hover, then *"my bad, forget everything I said there"* — and that passage is S233's fix working, so the retraction is recorded as loudly as the defects. His three rulings: Enter closes the panel (reversing ruling 6 of the same morning, a reversal he flagged himself), double-click opens the course outline (still unbuilt), and reserve the chip row's space. 2 KB notes (a fix right about the complaint and wrong about the axis; a view swap that does not move the hash). The SkyView lane compacted 40,693 B → 11,351 B against its 12,000 budget.
- **2026-09-06 (SkyBuild, S233 — the observation log worked, then Sam drove it)** — A computer-use session logged sixteen findings against S232's brief (#1493). **Four were real**: the panel kept its scroll when opening an identity (reset at the ENTRY points only — `renderNode()` fires on every keystroke, and resetting there restates Sam's ruling 3a friction as a feature); ⭐ *"no click path back to the discipline"* and *"Escape backs out only if you arrived by keyboard"* were **one defect**, the keyboard cursor being set only by the Tab/Enter path, so the back path existed and was unreachable by mouse; `DESC_BASES` tried an uncommitted local base first, costing a guaranteed 404 per discipline on the deployed page; and the identity-system chip, 13 of 16 chips on a panel, carried no title. **Two were not defects** (Pan/Move do carry `aria-pressed`; `row count` does carry an explaining title), and ⚠️ **the finding ranked first was the most wrong** — the brief's payload figure was correct for the file it named and the session had measured a different payload on the same page ([`kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names`](kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names.md)). Found while reproducing it: the **atlas payload was twelve days older than the universe payload** and nothing rebuilt it on a schedule, which is the whole of the 117-discipline disagreement — **ruled and fixed the same day** (the daily run rebuilds the decision payload; the universe layout stays hand-built). Then Sam drove it and reported five more, all fixed: the hover returned the **identity** card on 14 of 30 college courses (an opened ring spreads over its neighbors and `pick()` gave the circle priority); the purple background is the **membership glow** reaching 983px on a 960×600 canvas, not the focus disc; `weldi` lost *Introduction to Welding* because the tiers tested the string start only, so a term beginning a WORD now ranks with one beginning the string; Hide survives the next pick; and the suggestion list is paged, ranked once to 300 and revealed 60 at a time. Plus **Similar courses** ordered Beginning → Intermediate → Advanced. ⚠️ **Two guards had to be rebuilt** — the existing fixture can never produce an overlapping ring or a disc large enough to clamp, so both tests passed with the fix deleted; [`tests/ccr_skyview_hover_disc.test.js`](../tests/ccr_skyview_hover_disc.test.js) replaces them ([`kb-notes/methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration`](kb-notes/methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration.md)). Sam then answered a **seven-item decision sheet** in one sitting, all `yes` (#1494) — navigable search chips, whole-row course opening, an in-panel drop destination, a *Recenter on `<label>`* button, Enter leaving the results list up, a skip link to the map, and the daily rebuild above. ⚠️ **Measuring for the sheet corrected three claims** — the payloads do *not* disagree by 43 on screen (`disciplineRows()` reads the universe payload; the staleness cost 89 of 593 decision-pack ids resolving to nothing), the canvas is 39 tab stops in not 217, and `ALIAS_MAPS` is a list of **paths** so an unloaded `resolve_id()` silently resolves nothing. Finally (#1495) three workflows using 89% of the repo's Actions minutes were trimmed with `concurrency` and a CodeQL `paths-ignore`, after the job log disproved the first recommendation.
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
