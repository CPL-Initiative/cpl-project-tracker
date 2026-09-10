---
title: "Session 250 handoff — a control that emptied the map, and an answer nobody could see"
created: 2026-09-09
updated: 2026-09-09
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_251_handoff.md
---

# You are Session 250

Your moniker is **SkyReach**. The name is the job: this run's two defects were
both about whether a thing reaches the person using it — an answer that printed
850px from the hand, and a control that reached every node and rejected all of
them.

⚠️ **THREE sessions ran in parallel on 2026-09-09, and the handoff numbers show
it.** SkyLedger (S247) wrote 248; SkyTouch took the dark-mode remainder and wrote
249 (SkyGround); this run — **SkySight** — took Sam's SkyView bug report and
writes 250. Read 249 too if you touch COBI theming: it is a different lane and
does not collide with this one.

## What this run did

One PR, **[#1532](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1532)**,
merged as `e3a83fc`. Sam's report was two sentences: *"I tried it typing, 'Show
me chemistry' and clicked enter, but the only response was to stop the
rotation--no other view change."* And: *"when I tried the Isolate function, it
cleared the field with no groupings displayed."*

**Three causes, one symptom, and only one of them lived in the code being
tested.**

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **ISOLATE ASKED "IS ANYTHING SELECTED?" TWICE AND GOT TWO ANSWERS.** A
   discipline is selected as an **island**, so it contributes no node hits:
   `searchHits` is empty, `selNode` is null, `selIsl` is set. The button's `can`
   test and `isoActive()` both counted `selIsl`; `isoNodeOK()` did not, so it
   failed **every node in the payload**. Measured: **49,896 courses / 159 islands
   → 0 and 0.** Nothing threw. Note:
   **[`methodology-two-expressions-of-one-predicate-will-drift-apart`](kb-notes/methodology-two-expressions-of-one-predicate-will-drift-apart.md)**.
2. ⭐ **THE ASK WAS NEVER BROKEN — IT ANSWERED WHERE NOBODY LOOKS.** It ran,
   stopped the sky (the one thing Sam saw), and printed the full explanation into
   `#u-hint`: measured in Chromium at 1440×900, a **36px strip 850px below the
   search box, under three lines of legend.** ⚠️ **Sixteen checks passed on the
   STRING and not one asked where it lands.** The lane's own invariant already
   said *a refusal that prints out of sight is a dead control* — it lived in prose
   and nothing mechanical held it. Note:
   **[`methodology-a-check-on-the-message-says-nothing-about-where-it-lands`](kb-notes/methodology-a-check-on-the-message-says-nothing-about-where-it-lands.md)**.
3. ⚠️ **THE ONE-ISLAND FIXTURE COULD NOT HAVE CAUGHT IT.** "Isolate a discipline
   and the OTHER disciplines go" is unstateable against a single island. The
   fixture carries two now; check (12) reports `shown=0 islands=0/2` on revert.
4. ⚠️ **`--red-alert` IS NOT THEMED IN SkyView's NIGHT PALETTE** — 2.55:1 on
   `--surface-opaque`. Use `--crimson` (9.45:1 light / 6.34:1 dark), which is
   defined in both `:root` blocks. Worth grepping wherever else `--red-alert`
   renders on dark.
5. ⭐ **VERIFY AGAINST THE SCREEN.** Both defects were found by serving the page
   and driving Chromium, not by reading code — the code reads correct in both
   cases. `python3 -m http.server` in `prototype/`, then Playwright with
   `executablePath: /opt/pw-browsers/chromium-1194/chrome-linux/chrome` (the
   pinned version differs from the preinstalled one; do NOT run
   `playwright install`).

## Sam's decisions this run

- **He approved dispatching `cpl-chat-deploy.yml`** after being shown the
  blast radius (Sierra, the Fact Sheet, My College, the GR register, the Memory
  tab). It ran — 34402962685, byte-verify clean. **Lane item ① NEEDS SAM is
  closed**; `skyview-ask` is live on the deployed function.
- **He flagged a parallel session** at the top of the run (dark mode, all COBI
  surfaces) and asked for collision awareness. That collision was real: `main`
  moved twice mid-PR.

## Carryover

- **OPEN — the smoke test's mode 16a.** `cpl-chat-smoke.yml` fails on a prose
  grep for two of LACCD's nine college names. **Not the deploy** (established
  three ways — see the lessons doc), and the answers are substantively correct.
  The remedy is named in the script's own header: move it to a **retrieval**
  assertion the way mode 7's worst offender was moved to 7r. **Sam has the
  proposal and has not ruled.** Do not sweep it into an unrelated PR.
- **OPEN — `smoke_test.sh` ~line 518.** Pierce carries `["LA PIERCE", "LA
  Pierce"]` with no `"Pierce College"`. Nothing broken today; a table arriving
  with the college's own name joins to nothing, silently. Rule 7's shape.
- **OPEN — lane NEEDS SAM ② and ③** (unchanged): the live `sierra_guidance`
  CHECK constraint does not allow `skyview-ask` (not blocking — nothing writes a
  guidance row), and the sky's opening width on a phone is a ruling, not a sweep.
- **The lane's NEXT list is untouched** by this run — DR-24's write surface, the
  skills layer's fetch, the 86 blanks, the two disagreements. Read
  [`lanes/skyview-ccr-interface`](reference/lanes/skyview-ccr-interface.md).

## Read these, in order

1. This file.
2. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
   — lane state, NEEDS SAM, NEXT.
3. ⚠️ [`docs/reference/skyview_invariants.md`](reference/skyview_invariants.md)
   — **before touching the code.** ~40 rules, each written because a session got
   it wrong once.
4. [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) — the dated story,
   this run at the bottom.

## Patterns that worked

- **Reproduce before theorizing.** The first hypothesis (a stale build) was
  wrong; a jsdom harness driving the real page settled it in one run.
- **Falsify every new check by reverting its own line.** Isolate (12) goes to
  `shown=0 islands=0/2` — the blank canvas itself.
- **Diff what actually deployed.** "Two weeks went live" sounded alarming;
  `index.ts` was byte-identical except five lines gated on one string.

## Safety patterns to honor

- **The served page inlines `ccr_universe.js`** — a JS change needs
  `python3 prototype/build_ccr_atlas.py`. Never hand-patch `skyview.html`.
- **`npm test` is not CI.** It runs neither `kb/_build_dependency_map.py --check`
  nor `kb/_build_docs_index.py --check`, and both went stale on the merge from
  `main` this run. Run all three before pushing.
- **Regenerate generated files on a conflict**, never hand-merge them — the
  `kb/docs_audit/*` conflicts resolved by re-running `kb/_docs_audit.py`.
- **The sandbox cannot reach `*.supabase.co` or `api.github.com`** — Supabase via
  MCP, CI via the MCP `github` tools.

---

*Greetings, you are SkyReach (Session 250), see SkySight's handoff —
`docs/session_250_handoff.md` — let's keep rolling with our queue.*
