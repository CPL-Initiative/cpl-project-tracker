---
title: "Session 234 handoff — the outline is still unbuilt, and the queue is clear again"
created: 2026-09-06
updated: 2026-09-06
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 234

Your moniker is **SkyGrain**. Predecessors: SkyReply S231 → SkyOutline S232 →
**SkyBuild S233**.

## What S233 did — two rounds of reports on SkyView (PR #1493)

**Round 1: an observation log of sixteen findings.** Four were real and are
fixed; two were not defects; one was right about the arithmetic and wrong about
the mechanism.

1. ⭐ **"No click path back to the discipline" and "Escape backs out only if you
   arrived by keyboard" were ONE defect.** `kbIsl`/`kbNode`/`kbInside` were set
   only by the Tab/Enter path, so the back path existed and was unreachable by
   the route almost everyone takes. `kbSync()` points the cursor from every
   selection path now; the panel also carries a **Back to `<discipline>`** word.
2. The panel kept its scroll when opening an identity. ⚠️ Reset at the **entry
   points only** — `renderNode()` fires on every keystroke, and resetting there
   restates Sam's ruling 3a friction as a feature. A test forbids that direction.
3. `DESC_BASES` tried an uncommitted local base first, costing a guaranteed 404
   per discipline on the deployed page. Ordered by `location.hostname` now.
4. The identity-system chip — 13 of 16 chips on a panel — carried no title.

⚠️ **Two findings were wrong on inspection** (Pan/Move DO carry `aria-pressed`;
`row count` DOES carry an explaining title), and **the finding ranked first was
the most wrong**: the brief's payload figure was correct for the file it named,
and the session had measured a different payload on the same page.

**Round 2: Sam drove it and reported five more, all fixed.** The hover returned
the **identity** card on 14 of 30 college courses (an opened ring spreads over
its neighbors and `pick()` gave the circle priority); the purple canvas is the
**membership glow** reaching 983px on a 960×600 canvas, **not** the focus disc;
`weldi` lost *Introduction to Welding* because tiers tested the string start
only; Hide died on the next pick; the list is paged (ranked once to 300,
revealed 60 at a time). Plus **Similar courses**, ordered Beg → Int → Adv.

**Round 3: a decision sheet, seven rulings, all `yes` (PR #1494).** The five calls S233
logged-but-did-not-fix plus the payload decision went to Sam as one numbered sheet with
reply chips; he answered in a sitting with no edits and no follow-ups. All seven are
shipped and guarded (`ccr_skyview_search_show` §15, 13 checks). The one that changed
behavior beyond its own control: **the daily run now rebuilds SkyView's decision payload
and `skyview.html` with it** — the atlas payload is INLINE in the served page, so
regenerating the JSON alone would never reach the deployed page. `ccr_universe.json` is
untouched; the layout stays hand-built, which is the half of the ruling that says no.

**Round 4: Actions minutes (PR #1495).** Measured 4,012 min over 2026-09-01→06, of which
three workflows were 89%. `concurrency` on `js-tests` and `secret-scan` (keyed to the PR,
`cancel-in-progress` gated to `pull_request`, so only superseded commits are canceled and
a push to `main` can never be canceled by a later one), and `paths-ignore` on CodeQL's
**push** trigger so the cron's three-a-day data commits stop being analyzed. ⚠️ **My first
recommendation was wrong and the job log disproved it** — dropping `fetch-depth: 0` would
have saved ~60s, not the ~650 min/month I claimed; TruffleHog was already diff-only. The
reasoning is a comment in the file now so nobody re-proposes it.

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
2. [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) — the two 2026-09-06 sections
3. [`methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names`](kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names.md)
   and [`methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration`](kb-notes/methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration.md)

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data.

## Your priority: STILL BUILD THE COURSE OUTLINE

It has now been planned twice, cleared twice, and built zero times. Nothing
blocks it. Sam's design is settled and binding — the full list is in the lane;
the load-bearing parts:

- A synthetic description may show **"as long as it is clearly labeled
  MAP-Generated for faculty consideration and revision before use."**
- **Layered from the start**; MAP exhibits and military CRs are the next layers.
- Reviewers **edit titles and re-subject**; re-mint only when verified **and**
  admin-released.
- Thin skills are **included with a confidence chip**, not dropped.
- **A proficiency level on the course AND on each skill** — two axes, carry
  both, derive neither. ⚠️ `courseLevel()` and the Beg/Int/Adv ladder now exist
  in `prototype/ccr_universe.js`; reuse them rather than re-deriving.
- ⚠️ **Double-click is taken.** Split it: a course opens the outline, empty
  island ground keeps today's behavior.
- ⚠️ We hold **57 published welding credit recommendations and ZERO skill
  statements.** Everything else is buildable from data we already have.

## What is actually open

⚠️ **Ruling 9's follow-up is still open with Sam** — agency skill statements come from
published agency standards **and** ACE exhibits **and** the MAP team ("All three"), and he
flagged it himself: **how are the three reconciled when they disagree?** The pilot is an
AWS welding certification. You cannot finish the outline's skill layer without this, but
you can build everything else first.

**Ruling 2's queue** (S232) is routed through Governance, not built; the ADR's four-item
checklist is the spec.

⭐ **A TEST THAT ONLY FAILS UNDER LOAD IS RACING A TIMER THE PRODUCT OWNS.** `test`
went red on `ccr_skyview_search_show.test.js` while it passed 116/116 standalone,
in a full local suite, under Node 20, and on CI minutes earlier on identical
bytes. Every cheap hypothesis was wrong. **Running the file 24× CONCURRENTLY
reproduced it in one command** (7 failures; `grep ^FAIL | sort | uniq -c` named
all three) — the missing variable was contention, which a re-run does not vary.
The cause: the page closes the suggestion list 120ms after the search box blurs
(deliberate), §15's clicks schedule that close, and `tick()` is ONE macrotask.
⚠️ **The product was right and the test was wrong** — and the failing checks were
ruling 6, shipped that same morning. Before 7/24, after 24/24. Also: the CI log
is not readable here (`get_job_logs` caps at ~the last minute; the log blob is
egress-blocked), so **reproduce locally under contention rather than trying to
read the log**.
[KB note](kb-notes/methodology-a-test-that-only-fails-under-load-is-racing-a-timer.md)

⚠️ **The `cpl_memory_log` step fails silently.** The 2026-09-06 checkpoint wrote 8 rows,
its commit body said so, and **not one had a log entry** — the log `insert ... select` is a
separate statement, so skipping it is invisible from the `cpl_memory` side, and no test can
see it (the sandbox cannot reach `*.supabase.co`). Backfilled, and the playbook now carries
the one-query verification. **Run it** before you report rows written.

⚠️ **`ALIAS_MAPS` is a list of PATHS.** Call `load_maps()` before `resolve_id(id, maps)`.
Passed straight in, it resolves nothing and does not error — the tell is that direct and
chain agree EXACTLY (440 both ways; 504 live / 89 dead after `load_maps()`). This shape
cost a wrong figure on two consecutive days.

## Corrected this run — do not re-inherit these numbers

Three claims in the S233 record were wrong and are fixed at the source; if you meet them
in an older doc, these are the measured values:

- The stale atlas payload did **not** make the map and the discipline tables disagree by
  43 on Health. `disciplineRows()` takes its counts from the **universe** payload; the
  stale file supplied only the Decisions column, the work-surface offer and a tooltip.
  What the staleness actually cost was **89 of 593 decision-pack ids (15%) resolving to
  nothing**, worst in Fire Technology at 32 of 136 — a curator offered a decision about a
  course that no longer exists under that id.
- The canvas sits **39** tab stops in, not 217, and already carried `tabindex="0"`.
- TruffleHog was already diff-only; `fetch-depth: 0` is not the cost.

## Patterns that worked

- ⭐ **Verify every reported defect against the source before touching it.** Two
  of sixteen dissolved on a grep, and the one ranked first was a correct number
  about a different file. S231 paid this lesson; S233 paid it twice more.
- ⭐ **When a perturbation comes back GREEN, suspect the fixture, not the
  assertion.** Two guards this run asserted exactly the right thing on a fixture
  that could not produce the condition. The assertions were never the problem.
- ⭐ **Measure which, not how many.** "The hover is wrong" became tractable as
  "16 of 30 stars return the wrong card", and the fix moved it to 30 of 30.
- ⭐ **A filter must be tested in BOTH directions.** The `paths-ignore` draft skipped
  what it meant to skip and also skipped `kb/_build_ccr_universe.py` — a real
  coverage regression — while missing `reports/**`, so it would never have fired
  on an actual cron push. Running it against real commits caught both; asserting
  the globs would have caught neither.
- ⚠️ **The failure mode to watch in yourself: reliable at reading ONE thing
  carefully, unreliable at noticing the ADJACENT field that falsifies it.** Three
  times this run — the payload figure, `mergeable_state` (sitting in a payload
  already fetched twice while I diagnosed missing CI as a dropped webhook), and
  the `fetch-depth` theory the job log disproved. When you have a confident
  reading, look at what is next to it before you act.
- **Reproduce an inherited number against ITS OWN source** before correcting it.
- **The build is part of the change** — `skyview.html`, the payloads and the
  dependency map rebuild in the same commit. ⚠️ The docs catalogs too:
  `kb/_build_docs_index.py` is a CI check, and forgetting it turned `test` red
  this run.

## Safety patterns to honor

Rule 10 at any write: fresh live read, guarded statement, a receipt that makes it
reversible. A **new write surface** routes through Governance and the privacy
ADRs *before* it ships. Artifact policy: code-only PRs where the runner
publishes. ⚠️ `npm run a11y` before shipping any view — CI does **not** run it,
and `npm test` proves nothing about layout (jsdom returns zeroes for every
rectangle).

---

*Greetings, you are SkyGrain (Session 234), see SkyBuild's handoff —
`docs/session_234_handoff.md` — let's keep rolling with our queue.*
