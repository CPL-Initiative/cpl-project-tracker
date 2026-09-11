---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-11
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
| KB notes | 438 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 78 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 80 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 47 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 232 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **880** | |
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
- **2026-09-11 (SkyBeat, S257 part 2 — both of Sam's asks, and a measurement that reframed one of them)** — *"do both a and b"*. ⭐ **The MAP Users wiring replaced LUCK, not a break**: measured before building, **128/128** roster names and **74/78** hardcoded keys were already canonical and only **3/123** names in `map_college_contacts` were not, so every lookup already worked — because MAP happens to spell things canonically and nothing enforced that it keeps doing so. Saying that plainly mattered more than the code. What `normCollege()` could **never** do is bridge a VARIANT to its canonical name (`…Continuing Education Credit` and `…Continuing Education` normalize differently; only `variants` joins them), and that is the capability added: both reads ask for every spelling, `loadContacts` merges canonical-first — recovering SDCCE's `landing_page_url`, which the old `eq.<canonical>` read dropped silently — and `CPL_PAGES`/`CPL_LIAISONS`, which had **no normalization at all**, route through the resolver. ⭐ **The merge is safe only because the taxonomy encodes Sam's 2026-08-21 ruling**: `Calbright College Credit` stays separate because it resolves to no identity, **not** because the code checks for Calbright — there is no mention of it in the logic. **(a)** `kb/_identity_daily_check.py` runs from `map-users-sync.yml` (already daily, already holding the service key, already the job that pulls from MAP), **read-only and never committing**, refusing on a short read because a failed read would report the whole roster as findings. ⚠️ **Two regressions of mine, both caught by guards**: `pickByIdentity` mutated `FALLBACK_CONTACTS` by caching its index on it (caught immediately by a test I did not write), and the dependency map went stale **twice**, same cause — it records line offsets, and the rebuild belongs *last*, not before one more edit.
- **2026-09-11 (SkyBeat, S257 — a tab whose main table had never rendered, and a deploy boundary that is not one)** — Two findings, both from reading an instrument rather than the wall clock. ⭐ **COBI's College Identity tab had never shown its roster to anyone, on any sign-in, since it shipped**: `authHeaders()` feature-tested `window.CPL_TEAM_PHRASE.headers`, which does not exist (`decorateHeaders` does), so the guard was always false, every fetch went out with no `apikey`, `map_colleges` answered **401**, and the table draws under `if (live)`. Sam saw only the lint findings and asked where the table was — it was his own 2026-08-21 ask, quoted in the file's header, which had itself drifted to describe the broken screen (*"a LINT SURFACE, not a lookup"*). ⚠️ **The polite else-branch is why it survived**: a missing method and an unmounted module are indistinguishable to a truthiness guard, so the page calmly reported a permissions gate that was not the problem. His ruling on order — *"show the full table and just give a link to the discrepancies"* — is built, a **link not a disclosure** so Ctrl-F and the heading list still reach the findings; headings h3→h2 closed the view's only a11y failure (re-verified 38→36). ⭐ **The cap-hit read came back 0 real hits on the fixed code**, and the two rows that LOOK like cap hits on v64 are zero-character blanks served by **warm v63 isolates ~25 seconds past the deploy** — proven twice over, by 0 `EMPTY ANSWER` lines in 17 hours and by the cache line's own format gaining `model=` in that same deploy (last without 02:04:02.384Z, first with 02:04:06.434Z). ⚠️ **And there is almost nothing to measure**: 30 hours of `chat_interactions` holds `smoke-ci` 432 turns, `health-probe` 9, and **6 human turns** — so "watch for a cap hit" observes the smoke suite, not people, and the sixteen-row register sweep is the only instrument that would test the 8,192 ceiling. Smoke 16a split into a retrieval assertion (**16r**) plus prose floors, the way mode 7 became 7r; 15a/15c are still red on two correct answers and #1555 did not close them. ⚠️ **MAP Users is NOT wired to the taxonomy** (Sam assumed it was): zero references to `map_colleges`/`college_id`/`variants`, keyed on name strings across three hardcoded objects. New note: [`methodology-a-feature-test-on-a-missing-method-fails-silent`](kb-notes/methodology-a-feature-test-on-a-missing-method-fails-silent.md). `cpl_assistant_lessons.md` archived at 1.02× over budget (14 sections moved verbatim).
- **2026-09-11 (SkyPulse, S256 — a scanner's notice about a host we only link to)** — KYND flagged `map.rccd.edu` for wp2shell (WordPress core); Sam asked whether our Fact Sheet / Sierra links were involved. They are not: the host is a SiteGround WordPress site outside our stack, and the one ingest path (the Monday stories scrape) checked clean. Memo for the site's administrator delivered to the vault; KB note [`playbook-answering-a-vulnerability-notice-about-a-host-we-link-to`](kb-notes/playbook-answering-a-vulnerability-notice-about-a-host-we-link-to.md); `staging2.map.rccd.edu` is a second public install the notice missed. No code changed. Session limited to the sidebar by Sam's ruling; `session_257_handoff.md` carries SkySignal's Sierra queue forward untouched.
- **2026-09-11 (SkySignal, S255 — Sierra is answering again, and the cause was a default)** — Sam: *"see if you can get Sierra ai back up? Last session quit responding."* ⭐ **The blank answers were adaptive thinking spending the output cap, not an error and not the cap**: on Sonnet 5 a request that omits `thinking` runs adaptive thinking (Haiku 4.5 and Sonnet 4.6 ran none), thinking tokens count against `max_tokens`, and the loop collects only text — so on a broad question the model spent the whole 2,048-token budget before the first word. The cause named in the bullet below is superseded. Measured from `chat_interactions`: 0 blanks on 09-08/09, then 5 of 62 on 09-10 and 39 of 137 on 09-11, three of them real users; the Haiku revert the previous session mentioned never happened (the one request after it wrote a 4,476-token cache prefix, which Haiku never did). **Fix: one field**, `thinking: { type: "disabled" }` (#1551), with the guard keyed to the model id like the cache floor and failing closed (20/20 after, 18/20 before). #1550 merged first so its `stop_reason` and `EMPTY ANSWER` instrumentation shipped in the same deploy. Deployed as **v64** at 02:03:41Z (run 41, byte-identical to `main`); 54 turns in the first six minutes: 0 blanks, 0 cap hits; the NCCER question answered twice; output per 4 chars of answer 1.91 → 1.46 (the tokenizer accounts for the rest). ⚠ **A model switch carries its defaults with it**: every guard pinned a property that was written down and each held; a default is an absence and nothing checked one. Anthropic's Sonnet 5 migration guide names the case in one sentence, and the tokenizer change (~30% more tokens for the same text) explains the 4,476-vs-3,234 prefix gap. Left with Sam: whether Sierra should think at all. New note: [`methodology-a-model-switch-carries-its-defaults-not-just-its-price`](kb-notes/methodology-a-model-switch-carries-its-defaults-not-just-its-price.md); the previous session's note gained a correction section.
- **2026-09-11 (SkySignal, S255 — Sierra went quiet and every instrument said she was fine)** — Sam moved Sierra to Sonnet 5 on his new corporate account and asked whether to stay. Answering it properly found a production defect and cost me three wrong claims. ⭐ **Sierra was returning BLANK ANSWERS to 27% of requests and nothing recorded it** — `chat_interactions` measures **0 empty responses every day for two weeks, then 5 of 62 on 09-10 (all after the 22:35:17Z deploy) and 20 of 76 on 09-11**, 25 of 93 turns since. Only ONE non-smoke turn has run since the deploy, so nobody real has been failed yet. ⚠ **The cause is that an upstream failure in a stream arrives as DATA, not a status**: the response is already 200 and `message_start` has already fired the cache log, and the loop handled exactly three event types, so `{"type":"error",…}` matched none, fell through into nothing, and the stream closed through its ordinary `event: done` path — a well-formed, empty, successful answer. Fixed in code and **NOT YET DEPLOYED** (#1550): the error event is handled and logged, `stop_reason` is captured, zero text frames logs `EMPTY ANSWER` with all of it, and the cache line now names the SERVED model (Sam's ruling 3). ⚠ **The only thing that noticed was a content assertion, and its report was unreadable** — "empty answer" then five regexes that never had text to match; it prints the error frame now. ⭐ **The cost claims were all one shape — a share of an input whose total was never measured**: the prefix is **4,476** tokens not the 3,234 `chars/4` predicted (28% low); Sonnet 5 is **1.72× Haiku per input token, not cheaper**, because the cached prefix is **19%** of a 24,093-token request and a lever on a fifth cannot offset a doubling of all of it; and the uncached 81% is **retrieval, not conversation history** (history is capped at 6 turns × 2,000 chars and the production widget omits it, so it is ~0). ⚠ **Plus a withdrawn reconciliation** — I matched a Supabase *secret* named `ANTHROPIC_API_KEY` to a Console *key* displayed as `ANTHROPIC_API_KEY`; different namespaces, and **nothing on our side can see which Anthropic account pays**. ⭐ **All 19 decision-sheet items came back with verdicts** (12 yes, 2 edit): the check boxes stay (*"users won't know what's out there"*), every panel tint becomes the one pale gray, and Pierce keeps its Los Angeles. To-Do feed triaged **26 → 12**. New notes: [`methodology-an-error-inside-a-success-is-invisible-to-every-status-check`](kb-notes/methodology-an-error-inside-a-success-is-invisible-to-every-status-check.md), [`methodology-a-share-is-not-a-fact-until-you-have-measured-the-whole`](kb-notes/methodology-a-share-is-not-a-fact-until-you-have-measured-the-whole.md).
- **2026-09-10 (SkyLabel S252 — the sweep, a union that should have been an intersection, and CPL as a universe)** — Sam asked for a sweep of SkyView through every reader and curator action, and advice. The sweep is an instrument now — `npm run sweep` drives the served page in Chromium through **222 checks** (the opening, the row, More, Show, ticking and Enter, the Ask mocked and refused, hover and click, the carry and the drop, park and Put back, the outline sheet, the grip, the window steps, every hash, reduced motion, Close, a phone's pinch, 768px) — and its first two catches shipped in **#1546**: ⭐ **the Ask's union where a question meant an intersection** (*"introductory welding courses"* resolved to {Welding} + {introductory}, chips are a union, so every introductory title everywhere was ringed and the map flew to Biological Sciences; a term named beside a discipline now carries that scope, and a scoped word with under three hits retries its stem — 2 titles say *introductory*, 44 say *Introduction to*), and ⚠️ **a mouse click is two events and the second was dead** (Drag… picked up on `pointerdown` and the `click` branch acted only when nothing was carried, so Esc reached nothing). Then Sam's *"pick up the CPL view and get that built and into prod to refine"*: **#1547** makes **CPL a UNIVERSE, not a lens** — the word swaps the payload under the same map (1,987 credentials, 3,813 local exhibits folded in, the courses articulated to each as doors back to the Courses map, a second ring on the 84 statewide), with a members payload of its own. ⚠️ **Six first-cut defects, each caught by a check, none on screen**: the same-payload guard read the swap as nothing to do; an ASI `return` made the legend read `undefined`; a missing payload drew a blank route; `ar` counts articulation LINES not identities (201 points disagreed); the swap restarted a turn the reader had stopped; and the staged-moves pane came back empty on every re-render (pre-existing). ⚠️ The harness had two lessons of its own — a coordinate added twice read the island under a point the click then selected (a pick hook settled it in one run), and the dependency map went red on the final push because the rebuild came before the last edit. New note: [`methodology-a-pane-painted-only-by-its-event-is-blank-after-a-re-render`](kb-notes/methodology-a-pane-painted-only-by-its-event-is-blank-after-a-re-render.md).
- **2026-09-10 (SkyTouch S249 — the rest of the phantoms, then fixing what the sweep NAMES)** — Two passes on the dark-mode lane, and the contrast is the lesson. Pass one defined the remaining **21 phantom color tokens** (62 uses, 14 files) as dark-only aliases and moved the sweep by **one finding**, because none of those 62 sites is painted when the sweep runs — **a finding count is not an acceptance test for a token-layer fix**; read the tokens off `getComputedStyle` in both themes instead. Pass two fixed what the sweep NAMED and moved dark **67 → 38** and light **63 → 58**, zero regressions. ⭐ **A fifth cannot-flip shape:** `rgba(255,255,255,.5)` as a fill is light-only — it composites to a mid grey over the night ground and was **7 findings from three declarations**; the First Light v1.6 glass-quiet recipe is deliberate, so it got a **dark branch, not a removal**. ⚠️ **A rule's own `background` is not its ground** — three regressions came from ancestors (`--gold-accent`, `--seal-blue`), both fills that never flip, so `--on-seal-blue-muted` joins `--on-mustard`. ⭐ **And a sanitizer had blinded every ink guard**: `stripComments` treated `#` as a comment marker, deleting **942 lines** of `index.html` — 179 of them carrying a `color:` declaration — before any scanner saw them. Also: `tests/discipline_edge_fill_test.py` was red on `main` with no CI run saying so (a `GITHUB_TOKEN` push triggers no workflow, so the cron never tests itself), another session fixed it from the other side and **both were kept** (with a dead fill function only the round trip fails), and #1541's `kpi_history_no_gaps_test.py` shipped with **no runner**. New note: [`methodology-two-fixes-to-one-guard-may-both-be-right`](kb-notes/methodology-two-fixes-to-one-guard-may-both-be-right.md).
- **2026-09-10 (SkyLedger — four green checks that could not see what they checked, and CPL mode's universe)** — Repairing the cron produced its first run in three days and turned three checks red; a fourth went red the same afternoon. ⭐ **All four are one shape: the check was green because the tool could not see the thing it was checking.** S245 swept `background:#fff` from both HTMLs and left it in `college_activity_template.html`, the generator's INPUT (measured at that commit: HTML 0, template 4) — the guard read only the artifact. `discipline_edge_fill_test.py` measured a transformation's YIELD after S242 moved that transformation into the generator, so the correct answer became `0 of 86` and it **failed on success**. And `_build_dependency_map.py` inventories via `git ls-files`, so a rebuild while three new files were untracked wrote a map missing them and `--check` passed against that same blind view. ⚠️ **Stage before you rebuild anything whose inputs come from git**, and read a red check right after a generator repair as a backlog coming due. ⭐ **CPL mode's universe is BUILT** (#1544) — the entities are exhibits, from the CER alone: **1,987 identities folding 3,813 local exhibits in 97 islands, 1,603 with a ring, 84 statewide (all articulated), 543 in the pile.** The layout is IMPORTED from the course universe via a `point_fn` hook and proven neutral byte-for-byte. Sam ruled both shape questions: a singleton draws as any identity, and the no-discipline pile ships visible. ⚠️ Pedro's Student Aggregate fix verified live — all six lifecycle booleans back at 100% fill. Merged: **#1541**, **#1543**. New note: [`methodology-a-guard-on-generated-output-cannot-see-its-source`](kb-notes/methodology-a-guard-on-generated-output-cannot-see-its-source.md).
- **2026-09-10 (SkyReach — three silences, and a description that belongs to nobody)** — Six SkyView reports from Sam, all closed; two PRs merged, **#1537** (`c488a017`) and **#1538** (`431ea9b5`). ⭐ **Sam overruled the Session-235 medoid ruling**: a card must not quote one college and name them, because *"doing so could lead to division as some faculty may question the choice."* Resolved by making the unit the **sentence**, not the document — every sentence is still a college's own, the selector is agreement rather than typicality, and no college is named. ⚠️ **The clustering LINK mattered more than the threshold**: single-link at Dice 0.4 reaches a majority-supported sentence on 64% but leaves **10.1%** of clusters holding a pair under 0.25; complete-link at 0.3 reaches the same 64% with **0.0%** — the number fell because the rule got stricter. ⚠️ **Administration is the most-agreed text in the corpus** — four colleges under one course agree only on an hours block — and a numeric heading must be STRIPPED, not dropped, or four colleges' only description goes with it. ⚠️ **Boilerplate is not repetition**: the six most-reused strings are the C-ID descriptors, 1,149 rows of our best text; the real placeholders are **247 of 127,266 rows across 107 distinct strings**, all read by hand. ⭐ **Failing closed and failing silently are separable** — Sam's live-session banner had expired and said nothing, and every check asked whether it was ABSENT, which was right each time. ⚠️ **C-ID/CCN is the one ask not built**: MAP holds the designation, not the descriptor text (541 identities), and the cards now say so. New notes: [`methodology-consolidate-sentences-not-documents`](kb-notes/methodology-consolidate-sentences-not-documents.md), [`methodology-the-obvious-detector-measures-the-wrong-thing`](kb-notes/methodology-the-obvious-detector-measures-the-wrong-thing.md).
