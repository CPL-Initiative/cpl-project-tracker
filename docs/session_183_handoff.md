---
title: Session 183 handoff — the explainer reads right; nobody has opened it in a browser
created: 2026-08-22
updated: 2026-08-22
tags: [handoff, session-183, funding, explainer, ui, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_182_handoff]]"
  - "[[docs/cpl_funding_lessons]]"
superseded: true
superseded_by: session_186_handoff.md
---

# Session 183 handoff

You are **Session 183**. Session 182 was **SkyPlain**. The whole run was one page —
`prototype/funding_model_explainer.html`, the audience-facing explainer linked from the
Implementation Funding tab — plus a COBI-wide layout rule that came out of it.

⚠️ Sam frequently runs several sessions at once. Check `git log origin/main` before
assuming your branch is the only work in flight.

---

## What shipped

**#1285 · #1286 · #1287 · #1288 · #1289** — all merged, all republished to the SAME
artifact URL (`SANITY_URL` in `cpl_funding.js`,
`e3a3ccf1-581c-42cf-b622-56fd7caf7221`).

| | |
|---|---|
| #1285 | Chips to the masthead top-right; lede and "The short version" heading dropped |
| #1286 | Boxes for the appropriation and what it funds |
| #1287 | Tone reframed around outcomes, not what the CO holds back |
| #1288 | **Step one retired** — its content became boxes in the intro; crimson left the page with it |
| #1289 | One institutions figure ($25,240,308); **prose runs full width** |

Plus, after the last one, the full-width rule applied **across COBI**: 39 sites in 17
files now read `max-width:var(--cpl-measure,none)`, with the token declared on `:root`
in both mirrored HTMLs, guarded by `tests/cobi_prose_measure.test.js` (15 checks).

---

## Sam's rulings this run — these are the durable part

1. **Never *"a ceiling, not a check."*** Say **what a college receives is driven by its
   own CPL results, as they happen.** Positive statement of the same fact.
2. **Do not frame the CO's share as withholding.** Name what each amount *buys*. He
   read the page as a college CEO would and said it invited *"why is so much funding
   being withheld by the CO?"*
3. **Crimson does not belong on money that is meant to be spent.** *"All this funding
   is meant to be expended (which is a negative), but is to produce positive
   outcomes."* This retired the whole waterfall, not just its palette.
4. **Group the noncredit $1M INTO the institutions figure** — "this will show that we
   are allocating funding for outcomes for the whole effort."
5. **Full-width prose throughout COBI** — *"I would like the full width format rule on
   throughout COBI."* Two columns is the sanctioned alternative where blocks run long.

---

## Read in this order

1. `CLAUDE.md` §11 — the **Implementation Funding** row (rewritten this run) and the
   new **prose-measure** bullet under Engineering & UI practices.
2. [`docs/cpl_funding_lessons.md`](cpl_funding_lessons.md) — the 2026-08-22 section is
   the full story, including the artifact-comment loop mechanics.
3. The two new KB notes:
   [`the-same-arithmetic-can-read-as-withholding-or-as-investment`](kb-notes/methodology-the-same-arithmetic-can-read-as-withholding-or-as-investment.md)
   and [`a-text-measure-must-agree-with-what-sits-beside-it`](kb-notes/methodology-a-text-measure-must-agree-with-what-sits-beside-it.md).

---

## Carryover — what is actually open

- 🔴 **Nobody has opened any of it in a browser.** The sandbox is egress-blocked from
  the Pages host, so the full-width sweep across 17 tabs and the rewritten explainer
  are both verified only by test and by reading. **This is the single highest-value
  next action and only Sam can do it.** Expect small per-tab spacing follow-ups.
- 🟡 **Sam's artifact review copy** (`b1588987-…`) is now **five versions behind** the
  canonical one. He was leaving comments on it. Offer to refresh it, or move the
  review to the canonical URL. To read comments: `Artifact action:"comments"` with the
  URL — ⚠️ **there is no live subscription from a remote session**, so they arrive only
  when someone asks.
- 🟡 **Two columns** remains on the table if full width does not sit right. It is one
  token (`--cpl-measure`) plus a column rule; declined this run because most COBI
  blocks are 1–3 lines and would stack as one-liners.
- 🟡 **The Year-2 mirror for Scenario 2** — still Sam's call, unchanged from S181.
- 🟢 Docs lint long tail: 171 files carry British spellings, 5 KB notes were unindexed
  (indexed this run). Not urgent; fix in the files you touch.

---

## Patterns that worked

- **Read the whole page's prose before patching two strings.** Sam named two headings;
  the frame was in eight places. A sweep was right, a patch would have left the page
  half-reframed.
- **Check what a retired surface was the SOLE display of.** Deleting Step one nearly
  deleted `$800,000` — it existed nowhere else after an earlier round combined boxes.
- **Make the arithmetic close by construction.** The residual figure is *defined* as
  the total minus the others, so no two boxes can drift on a rebuild.
- **Ship a cross-cutting style rule as a token, and pin the exceptions in a test.**
  39 hardcoded values would have been unreviewable and un-reversible.
- **Verify fail-first.** All 15 new checks passed on the first run; breaking three
  things deliberately proved four of them actually fire. This repo has been burned
  repeatedly by checks that cannot fail.

## Safety patterns to honor

- **Rule 4**: `CPL_Dashboard.html` and `index.html` byte-identical. This run edited
  both; the mirror is re-copied from the canonical one and asserted in the test.
- **Rule 5**: never force-push `main`.
- **Merge on `unstable`**, not just `clean`. Five PRs merged that way this run.
- The explainer is a **snapshot**: re-run `prototype/build_funding_model_explainer.js`
  and re-publish to the same artifact URL whenever shares, factors or order change.

---

## Moniker

**SkyPane** is going if you want it — this run was all about what fills a pane and what
it argues. Take it, take the handoff's suggestion, or coin your own; Sam sometimes
names it in his greeting, in which case use his.
