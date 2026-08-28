---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-08-28
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

---

## The catalogs

Every document in `docs/`, by lane. Rebuild with `python3 kb/_build_docs_index.py`
(`--check` fails when a rebuild would change anything, so CI catches a stale index).

<!-- generated:corpus -->
| Lane | Docs | Catalog |
|---|---:|---|
| KB notes | 340 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 72 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 75 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Session handoffs | 179 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **666** | |
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
- **2026-08-28 (SkyLens, S202, refresh)** — the gate fix was half a fix: a local overlay survives sign-in and masks shared, so Sam's relabels never landed; plus the sign-in dropdown closing on any click. 3 more KB notes / memory rows.
- **2026-08-28 (SkyLens, S202)** — funding CR/NC lane switch merged (#1369); found a client gate stricter than its own RLS policy silently losing Sam's relabels; 2 KB notes; session-203 handoff.

- **2026-08-27 (SkyMatch, parallel to SkyPin)** — College CR evidence workstream: reusable matcher + LATTC worklist (PR #1365); two KB notes (a frequency is not a rule; one ranked list cannot answer two questions); §11 row added, SkyRule S196 narrative archived.
- **2026-08-27 (SkyPin, Session 199)** — the funding measure pin (`metric_src`) + the MILESTONE-agreement check (#1363); `ppa`/`ppa_u` after Sam's `Potential Student` correction, and the live Access metric fixed from $0-for-all-115 to 12 colleges earning (#1364). New KB note: *a defect that produces the value you expected is invisible*. Compacted the §11 funding cell (stacked_roadmap_cell) and archived `cpl_funding_lessons.md` 2026-08-01 → 08-06.
- **2026-08-27 (SkyVerdict S197)** — MAP's per-dataset verdict now read by the loader (#1358); `_effective()` + `scripts/funding_effective.js` so dials are asked of the model, not the config (#1359). Two KB notes. Two finished rows retired from `CLAUDE.md` §11 to `finished_workstreams.md`.

- **2026-08-25 (SkyFixer S193)** — a live session with Sam in a browser (#1330/#1331). ⭐ **The Memory ✎ chip could not write because its key named NOTHING** — `slug` is UNIQUE but NULLABLE and the display handle falls back to the uuid, so 6 of 572 rows took a PATCH that matched zero rows and the page blamed the team phrase. ⭐ Then the fixed chip turned out to be a **cycle that wrote every state it passed through** — his two clicks sit in `cpl_memory_log` 15s apart and left a `stale` row carrying a verification stamp; replaced with a menu, and the stamp is cleared whenever the status leaves `verified`. ⭐ **The magic link came back to the wrong screen for everyone** — nine modules stashed the return tab in `sessionStorage`, which is per browser tab, and the link opens a new one. ⭐ **SkyView search landed where the term never pointed** (`english as a second` → Interdisciplinary Studies); subject names now outrank course titles, plus typeahead, a real subject list, and the CCR tab opening on the map. ⭐ **GR "reanalysis" had no referent** — `blast_rank` is computed by nothing in the repo — so the analysis built is deterministic and defensible to the CO. ⚠️ **Five perturbations read as 0 FAIL because the suite CRASHED**. 3 KB notes; the flagged SkyView roadmap cell compacted to current truth; S190's narrative archived.

- **2026-08-25 (Sky190)** — Sierra's district figures came off a June snapshot with no writer; deleted the second copy rather than refreshing it. `cpl-chat` v58 deployed + byte-verified. Four closing-paren test assertions repaired. New KB note on stale second copies.
- **2026-08-24 (SkyRead S190)** — **the note never reached the model, and the doctrine filled the vacuum** (#1320/#1321). Autogenerate drafted a confident entry about the two-band answer structure for a note about which kind of credit to award. ⭐ **THE TOPIC ARRIVED AS SIXTEEN CHARACTERS** — the instruction envelope measured **984 of `cpl-chat`'s 1,000-char `query` cap** and led the prompt, so `When responding ` is all the model saw; with no subject and ~9 KB of answer doctrine it wrote about the doctrine, verbatim from `STATEWIDE_RULE`. ⚠️ **A cap generous for one caller is a silent content swap for another** — the surviving prefix is still grammatical, so there is no ragged edge. Retrieval keyed on the envelope too: **99 keywords, one of them the curator's**, at a healthy-looking 0.86. Fixed with a **per-surface cap**, an optional **`retrieval_query`** (search text ≠ sent text), and a **`DRAFTING_BLOCK`** on `volatile` that REPLACES the conversational doctrine; the topic now LEADS so anything truncated fails loudly. ✅ **The Briefing shipped** — an agent read-back of the entries on screen (⚠️ **`cpl-chat` references `cpl_memory` NOWHERE**, so a Sierra-framed briefing would prove nothing), with superscript citations, a hover/focus card, and click-to-edit. ⚠️ **Three defects were the same lesson one level down**: the envelope sat outside the corpus budget (1,392 chars over); the surface vocabulary lives in **THREE** places and CI found the third (*naming the lists is not checking them*); and the tap-target exemption was **unearned**, its justifying source list measuring 15px. ⚠️ **Three budget assertions passed VACUOUSLY** against a client declaring no budget. **Audit: Autogenerate's blast radius is nil** (3 calls ever) and the corpus is clean (0 near-duplicate pairs / 536 rows), but **26 of 177 `verified` rows name no verifier**. 🔴 **Both features are INERT until `cpl-chat` is deployed.** 1 new KB note; `verify-with-the-instrument…` extended; Sky188's narrative archived out of `CLAUDE.md`.
- **2026-08-24 (Sky188)** — ESL fold spot-check (#1315): the 543 "evidence-free" folds were not — catalog descriptions cover 96% of members; signal calibration reordered the queue (`numeric` 49.2% wrong, ranked below the lane to work first); 85 under-claim vs 9 over-claim; the number-ladder signal built and rejected; survivor-member audit closed clean; the orphan Routine deleted by Sam. 1 KB note.
- **2026-08-24 (SkyView S187)** — CCR Atlas + universe view; the ESL fold APPLIED (7 comprehensives, 1,997 rows); 4 KB notes; §11 CCR rows rewritten to current truth.
- **2026-08-23 (SkyBound, S184)** — funding model finished: the unhonorable-floor warning (#1302), the noncredit parity card + `held` reframing + a CCC total that was missing 56,993 FTES (#1303), the explainer moved from a hand-rebuilt snapshot to a live Pages page at `/funding-model/` (#1304), a red-main fix (#1305) and the repaint/noncredit-section fix. Two KB notes: `a-green-check-you-did-not-scope-is-not-evidence`, `a-snapshot-of-a-live-model-is-a-claim-that-decays`.
- **2026-08-22 (Session 183, SkyScope)** — **the district was right and the answer was about somewhere else** (#1291). Sam had LACCD selected on My College and Sierra answered about RCCD. ⭐ **THE DISTRICT MACHINERY WAS ENTIRELY SOUND** — `resolveDistrict()` deployed (read the LIVE function through the MCP, not the repo), 9 of 9 LACCD colleges have profiles, and the district chip's question resolves correctly; ruling those out by measurement is what left the real two. ⭐ **TWO INDIVIDUALLY CORRECT DECISIONS COMPOSED INTO THE BUG** — `convo` is module-level *on purpose* so a thread follows the reader between panes, and `finish()`'s `root.innerHTML = h` wipes the visible log on every scope change; together, a clean-looking conversation still shipping eight turns about the previous district. **Neither author could have seen it in their own file.** ⚠️ **A stale thread SOURCES the answer, it does not tint it** — `cpl-chat` folds prior user turns into the RETRIEVAL text when the new question carries <2 topic words of its own, and `riverside` is in `COLLEGE_ALIASES`. ⭐ **And nothing ever told Sierra which institution was selected** while `sierra_guidance` `15ec666b` told her to *"confine your answers to the selected institution"* — **a rule whose subject the request does not carry degrades to "pick one", not to "no rule"**. Fix: `setScope()` handed over unconditionally, `scope` on the request, a prompt block that is **a strong default and never a filter** (the rule's own worked example is a Cabrillo question asked from another college's page), and the district roster excluded from the West-LA ambiguity narrowing. ⚠️ **CI earned its keep twice** — the smoke red was the pre-existing mode-7 **prose grep** against the unchanged live deployment; the `test` red was a check pinned on a closing paren, **and the new test in the same PR had the identical defect**. ⚠️ **Three of my checks could not fail** and **my first transcript clear deleted the widget**, caught by a suite from three sessions ago. ✅ **Guidance audit on Sam's go**: 1 of 7 rules references a fact the request does not carry; budget NOT binding (4,095/9,000 chars, 7/20 rows); all 7 ship to all 6 surfaces. **`surface` field recommended, not built.** 🔴 **The fix is INERT until `cpl-chat` is deployed.** 3 new KB notes; SkyApply's narrative archived out of `CLAUDE.md`.
- **2026-08-22 (Session 182, SkyPlain)** — **the page was arguing the opposite of its own case** (#1285/#1286/#1287/#1288/#1289). Five rounds on the funding explainer with Sam reading it as its audience (CO, maybe CA Finance) would. ⭐ **EVERY FIGURE WAS TRUE AND IT STILL READ AS THE CO WITHHOLDING MONEY** — *"What is set aside before anything reaches a college"*, *"Left for institutions"*, crimson ▼ on every non-college line. The fix was never softer words: **name the beneficiary of each amount**, then **retire the waterfall** — that shape of chart exists to reconcile an account, so it argues spending is a loss, and it was the page's **only consumer of crimson**. ⭐ **Grouping argues too**: the noncredit $1M as its own box read as money taken out; folded into **$25,240,308 to the 115 colleges AND the four noncredit campuses** it reads as the whole effort funded — same two numbers. ⭐ **Sam's earning-language ruling**: never *"a ceiling, not a check"*; say **what a college receives is driven by its own CPL results, as they happen**. ⚠️ **Retiring a section nearly deleted a figure** — `$800,000` CO staff lived ONLY in the waterfall after an earlier round combined boxes; diff what a retired surface was the sole display of. ⚠️ **The boxes must SUM or a Finance reader stops reading** — the residual is now *defined* as the appropriation minus the rest. ⚠️ **"Also say the noncredit campuses" is an ALLOCATION rule, not a blanket one** — they are correctly not in the credit-FTES split, so four `115` references stay. ✅ **FULL-WIDTH PROSE IS NOW COBI-WIDE** on Sam's instruction: `--cpl-measure: none` on `:root` in both HTMLs, **39 sites / 17 files**, one lever or columns later. ⚠️ **The threshold is the point** — of 60 `ch` caps, 34 (60–82ch) are measures and 26 (9–46ch) are LAYOUT (cell truncation, a badge, a short hero lede), so the test **pins a sample of the layout caps** against a future blanket sweep. ⚠️ **A px cap is the same defect in other units** — four tab intros at 880/760px were invisible to a `ch` grep. **Columns declined with a reason**: most COBI blocks run 1–3 lines and would stack as one-liners. Fail-first verified: 3 deliberate breakages fired 4 of the 15 new checks. 2 new KB notes; SkyVouch's narrative archived out of `CLAUDE.md`; 11 British spellings fixed in the two docs this run touched; the 5 unindexed KB notes the lint found are now in the table above.
- **2026-08-21 (Session 178, SkyVouch)** — **the rule was already written down, one line above** (#1276/#1277/#1278). Sam: confirm the role before a pre-seeded question, adjust the questions to the org, then *"it only listed 3 of the 9 LACCD colleges."* ⭐ **EVERY DEFECT THIS RUN WAS A RULE THIS REPO HAD ALREADY WRITTEN, UNAPPLIED** — the 3-cap sat **34 lines below** a comment reading *`"angeles" alone matches 9; a limit of 3 truncated the answer`*, the identical bug on the identical nine colleges; the gated tab with no way in is `hiding-a-control-also-hides-the-way-in`; the missing Admin inventory is `a-manager-must-show-everything-it-manages`. **The two rules that existed as TESTS were caught by CI before merge; the two that existed only as prose reached production.** ⭐ **Raising the cap would have been worse than leaving it** — *"Nine colleges appear in the MAP platform data"* is still a name match dressed as MAP's contents and harder to catch, so the fix is the **disclosure**, not the number. ⭐ **Sierra has NO district dimension at all** (0 columns named district anywhere; the grouping is client-side from the funding roster), so a district is named only in an advisory question. ⭐ **A crosswalk's value is the lint** — feeding it every name in a live table found `"Cypress College "` and `"San Jose City College "` with a **trailing space**, each carrying a real coordinator and matching nothing, so both rendered as having **no CPL contact**, silently. Fixed in the JOIN; the table rebuilds nightly. ✅ **The SkyLink crosswalk finally WRITTEN**: `variants` 0 → **118 of 128**, district on 118, **73 districts**, noncredit + partners included on Sam's instruction, and two NC institutions turned out to have real MIS identities (`NORTH ORANGE ADULT` 863/860, `SAN DIEGO ADULT` 076/070). ✅ Sam's entity ruling stored as **attributed data**, not code. ✅ **American spelling** set as a convention *and* given a lint rule — 219 docs still carry British forms. ⚠️ **Five of my own checks could not fail**, including the new lint rule itself reading a key that did not exist. 4 new KB notes; SkyGlass's narrative archived out of `CLAUDE.md`; two §11 cells compacted after the lint caught me pushing them over budget.
