---
title: Visuals — the decision briefs and mock-ups, kept
created: 2026-08-20
updated: 2026-08-20
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
| 2026-08-20 | [`2026-08-20-ace-deferrals-credit-by-exam.html`](2026-08-20-ace-deferrals-credit-by-exam.html) | The 5,311 ACE recommendations that defer to the college rather than refusing — three things a college could record, and what each one costs. Built to put one ruling in front of Sam. | ✅ **Ruled 2026-08-20** — present as Credit by Exam options; never bulk-close. **Scoped the same day** after Sam challenged it: only 1,310 name a course, so only those are sendable. |

## Not this folder

- **`prototype/`** — UI mock-ups intended to *graduate into the dashboard*
  (the First Light theme, the versioned prototype gallery). Those are proposals
  for the product; these are briefs about the work.
- **Claude artifacts** — still published, still the way to look at one. The URL
  goes in the PR that commits the file; the file is what survives.
