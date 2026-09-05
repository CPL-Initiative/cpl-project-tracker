---
title: Visuals — the decision briefs and mock-ups, kept
created: 2026-08-20
updated: 2026-09-05
tags: [index, visuals, artifacts, decisions, design]
kb-status: internal
obsidian-folder: cpl-project-tracker/visuals
related:
  - "[[docs/INDEX]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
---

# Visuals

**Why this folder exists.** Sessions publish visuals as Claude artifacts — a URL,
private to Sam. That is the right way to *look* at one, and the wrong way to
*keep* one: the URL lives outside the repo, outside the vault, and outside every
search either of us runs. Sam, 2026-08-20: *"Many are so useful I find myself
wanting to go back to them for reference."*

So the HTML lands here as well as at its URL. This folder is under `docs/`, which
is the lane `scripts/sparse-vault-clone.ps1` materialises, so **every visual
appears in the Obsidian vault automatically** with no extra step.

## The rule

When a session publishes a visual worth returning to — a decision brief, a
scoped option set, a mock-up that settled an argument — **commit the HTML here
in the same PR** and add a row below. Skip the throwaways: a chart made to check
a number in passing is not a deliverable.

- **Filename:** `YYYY-MM-DD-<slug>.html`, the date it was produced. Chronological
  by default, which is how you look for one you half-remember.
- **Self-contained.** No build step, no local dependency — open it from disk and
  it renders. Google Fonts is the one external host (it degrades to the fallback
  stack offline).
- **First Light, verified.** Artifacts follow the house design system exactly as
  the dashboard does — `docs/kb-notes/reference-ui-design-system.md` +
  `prototype/first_light_theme_v1.html`. Contrast is **computed, not claimed**
  (`prototype/check_contrast.py` holds the maths).
- ⚠️ **A visual that asked a question keeps its answer.** When a decision lands,
  update the file rather than leaving a page that still asks — the whole point is
  that someone reads it six months later. Say what was decided and by whom.
- ⚠️ **Never commit a visual containing student-grain data.** This repo is
  public. Per-college aggregates are fine; anything at student grain is not.

## The visuals

| Date | Visual | What it was for | Status |
|---|---|---|---|
| 2026-08-20 | [`2026-08-20-ace-deferrals-credit-by-exam.html`](2026-08-20-ace-deferrals-credit-by-exam.html) | The 5,311 ACE recommendations that defer to the college rather than refusing — three things a college could record, and what each one costs. Built to put one ruling in front of Sam. | ✅ **Ruled 2026-08-20** — present as Credit by Exam options; never bulk-close. **Scoped the same day** after Sam challenged it: only 1,310 name a course. Extended 2026-08-20 with the exhibit titles (219/225 resolve) and the peer-course tiering — including why a two-college floor was not enough. |
| 2026-08-30 | [`2026-08-30-budget-balance.html`](2026-08-30-budget-balance.html) | The Budget ledger against the funding model — where the two disagree and by how much. | ✅ Worked through |
| 2026-08-30 | [`2026-08-30-governance-fifteen-tables.html`](2026-08-30-governance-fifteen-tables.html) | Fifteen shared tables needing a decision-rights ruling each. The decision-sheet pattern's first outing. | ✅ **Fifteen rulings in one sitting, 2026-08-30** |
| 2026-08-30 | [`2026-08-30-open-verdicts.html`](2026-08-30-open-verdicts.html) | Every judgment waiting on Sam across lanes, numbered for reply. | ✅ Verdicts taken |
| 2026-08-30 | [`2026-08-30-register-reanalysis.html`](2026-08-30-register-reanalysis.html) | The Activities register re-read against the statutory goals — which projects evidence which outcome. | ✅ Worked through |
| 2026-08-31 | [`2026-08-31-if-tab-simplified.html`](2026-08-31-if-tab-simplified.html) | The whole Implementation Funding tab rebuilt simply, one-pool, for reaction. Three reaction rounds ran against it. | 🔨 Mostly ported — the **flat Funding Breakdown ledger** had not reached the tab as of 2026-09-01; it is decision 2 of the sheet below |
| 2026-09-01 | [`2026-09-01-if-tab-two-consolidations.html`](2026-09-01-if-tab-two-consolidations.html) | Two consolidations on the funding tab: folding the Ed. Code goal cards into the priority bands, and porting the flat funding ledger. Numbered for reply. | ✅ **All three ruled and shipped 2026-09-01** — consolidate (1), port the ledger with editability and folds intact (2), keep the three money columns (3) |
| 2026-09-03 | [`2026-09-03-csr-authority-codes.html`](2026-09-03-csr-authority-codes.html) | Authority codes for the CSR: should the canonical Common SUBJ follow the C-ID and CCN subject codes? Twenty-two items — the rule, eleven code changes, the Z band, the mechanics. | ✅ **All 22 ruled 2026-09-03** — CCN first, four letters kept with a C-ID chip, no hyphens (`kb/csr_authority_codes_rulings_2026-09-03.json`) |
| 2026-09-03 | [`2026-09-03-remint-series-readings.html`](2026-09-03-remint-series-readings.html) | Fourteen readings the two re-mint dry runs raised (the recode of the ruled codes, the Z-band retirement): the three carried from the morning's sheet, the residual and viticulture calls, AG-EH's home, the flagged languages, PH under Health, Kinesiology's three free numbers, materialize or recognize-by-shape, the legacy anchors, the apply window. Numbered for reply. | 🔨 Awaiting Sam's replies — nothing applied |
| 2026-09-05 | [`2026-09-05-memory-audit-verdicts.html`](2026-09-05-memory-audit-verdicts.html) | The shared memory table tested end to end: what only Sam can settle, in plain English, oldest first — the 352 entries that passed with evidence (item 1), his own earlier rulings that later rulings replaced, the open questions and wishes, five class rulings, and the 31 entries already retired, listed for veto. | 🔨 Awaiting Sam's replies — 31 retired under a receipt, nothing else written |

## Not this folder

- **`prototype/`** — UI mock-ups intended to *graduate into the dashboard*
  (the First Light theme, the versioned prototype gallery). Those are proposals
  for the product; these are briefs about the work.
- **Claude artifacts** — still published, still the way to look at one. The URL
  goes in the PR that commits the file; the file is what survives.
