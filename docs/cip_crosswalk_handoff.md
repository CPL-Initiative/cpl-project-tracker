---
title: "CIP workstream handoff → SkyLiftoff"
date: 2026-07-17
tags: [handoff, cip, cobi, fit-check, top-cip, side-lane]
artifacts:
  - cip_crosswalk.js
  - cip_crosswalk_data.js
  - kb/_build_cip_crosswalk.py
  - kb/_build_cip_fitcheck.py
  - cip_fitcheck_colleges.json
  - cip_fitcheck/
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[CLAUDE]]"
---

# CIP workstream handoff → SkyLiftoff

You are **SkyLiftoff**, Session N+1 on the **CIP side-lane** of COBI. SkyLoft
carried this from a static mockup to a live, faculty-tested tool; your job is to
carry it further — and to carry the **banner of kindness** Sam named: this tool
*suggests and supports*, it never decides. Faculty should lean into it, not brace
against it.

**Side-lane discipline (honor it):** this workstream does **NOT** touch
`kb/cpl_todos.json` or the numbered `docs/session_<N>_handoff.md` — those are the
CCR curation mainline's memory. Your memory lives in `docs/cip_crosswalk_lessons.md`
(the full story) and this file.

## Read first, in order
1. `docs/cip_crosswalk_lessons.md` — the whole saga, newest sections at the bottom.
2. `docs/kb-notes/methodology-grounded-lexical-cip-confidence.md` — how the fit engine works.
3. `CLAUDE.md` §11 "SkyLoft side-lane" + the TOP caveat (the doctrine you'll live by).
4. This file's **Priority** below.

## What's live (all merged to main)
The **CIP Codes** tab (`#cip-crosswalk`, `cip_crosswalk.js`) — the faculty-facing
reference manual + an inline course-fit tool.
- **Browse** the full 2,325-code CIP-2020 list (search + plain-English finder +
  category pills + 🎓 C-ID/CCN chip + family filter). Certified CTE category per code.
- **Check a course against this CIP** (inline in each expanded code): pick your
  **college** once (remembered), then a **course** from a searchable **custom
  combobox** (opens below, type to filter all ~1,500 courses, best-fit-first). We
  pull the **COCI catalog description** automatically and score it against the code's
  official definition → a **Strong / Plausible / Weak** verdict + the course's
  closest CIPs. Paste fallback for courses not yet in COCI.
- Data: per-college `cip_fitcheck/<slug>.json` (label, desc≤400, TOP), lazy-fetched
  (built by `kb/_build_cip_fitcheck.py`); reference data `cip_crosswalk_data.js`
  (`{fams, rows}`, built by `kb/_build_cip_crosswalk.py`). Both **committed** (no cron).
- Self-contained light/dark theme, mobile-tuned (Sam uses it on his phone).

## The engine (Phase 0, no backend, can't invent a code)
IDF-weighted vocabulary match of the description against each CIP's title/def/examples:
- **IDF** so distinctive terms (collision, gis) drive it, not generic ones (cost, design).
- **Margin** (top vs pack) = the discrimination signal ("clear front-runner" vs "several close").
- **Coverage** factor: a code matching *none* of the course's distinctive/identity terms
  is dampened (×0.25 floor) — Sam's "fundamental purpose wins." **Light touch only:** it
  shapes the score, `rel%` picks the tier; no hard gate (Sam: "don't over-control — we'll
  lose plausible alternatives for other courses"). Test seams: `_score`, `_courseScore`,
  `_courseToks`, `_setColleges`, `_setCourses`.

## 🎯 Priority — the TOP→CIP "easy button" (Sam's last ask, Phase-1 approved in spirit)
Sam's insight: faculty must pick CIPs for **800–1,500 courses each** — but every course
already has a **current TOP code**, and the CO's official **TOP→CIP crosswalk** is the
"candidate CIPs for this discipline" table. Combine them = the **two-signals-agree** gate
from our TOP doctrine (crosswalk proposes, description-fit ranks, faculty confirms).

**Grounded data (SkyLoft checked `kb/reference/cip_searchable_260715.xlsx`, TOP-CIP Data sheet):**
420 TOPs → 4,865 pairs, **median 5 CIPs/TOP** (mean 11.6, max 1331); **32% map to ≤3**.
Every TOP carries noncredit boilerplate (`32.0107`, `32.0111`) — de-emphasize (the
description-fit already ranks it near-zero). Each pair has **provenance** (`CCCCO TOP-CIP`
= official, `Submitted by Field` = softer) — surface it as a trust cue. Examples that
show the magic: `0949.00`→3 CIPs (Autobody wins cleanly); `1007.00` Dramatic Arts →
Acting/Theatre-General/Technical-Theatre (description places each — the elegant Improv
answer); `0502.00`→Accounting/Accounting-Tech/Auditing (an audit course routes to Auditing).

**Build Phase 1:** when a course is picked, show its **current TOP** + the crosswalk's
CIPs for it, **ranked by description-fit**, top both-signals-agree flagged **✓ Recommended**;
keep a **"beyond the crosswalk"** lens (today's all-CIP matches) with a ⚠ when the two
signals disagree; add a **course-first entry** (start from "my course," not a guessed CIP).
**Data lift is small:** re-emit a compact `TOP → [CIP + provenance]` map from
`kb/_build_cip_crosswalk.py` (the pairs were slimmed out of the lean reference — the
generator still reads them; ~a few hundred KB, no definitions).

**Phase 2 (the CO "wow"):** a whole-catalog **review sheet** per college — every course →
current TOP → recommended CIP → confidence — pre-filled for the clear ones, faculty only
adjudicates the ambiguous minority. CSV out or in-tab table. Turns a 1,500-course slog
into review-and-approve.

**Caveats to keep visible:** recommendation, never auto-assign; one-to-many is *why* we
rank; TOP can be wrong (hence "beyond crosswalk" + the disagreement flag); faculty enters
the final code in COCI. This is corroborate-don't-gate, straight from the §7 TOP caveat.

## 🔒 The standing gate: accessibility (WCAG) before field release
Sam's explicit pre-field gate. Basics are in (label-wrapped inputs, `role=combobox/tab`,
`aria-live` results, `aria-label` meters, keyboard combobox, focus-visible). Still owed:
contrast audit on the muted badges/stripes, listbox/option semantics polish, meter value
semantics, reduced-motion, SR announcement copy. **Do this before it leaves Raul + Jenni.**
Audience today = **Raul (CO, will own the process) + Jenni** only.

## Patterns that worked (carry them)
- **Prototype → lock → port** in a fast-feedback canvas (StarCIP's artifact).
- **Calibrate on REAL data** before shipping a scorer (12 real courses surfaced the IDF need).
- **Trace the actual tokens** when a result looks wrong (PUB 151 → "cost accounting" was real).
- **Method + magic, light touch** — Sam's repeated calibration ("Plausible is OK,"
  "leave it to faculty," "don't over-control"). When unsure, give faculty the control
  (search) rather than hard-coding a rule.
- **Verify in real Chromium over HTTP** (fetch needs a server); check 0 overflow + 0 console errors, desktop + phone.
- **Commit the test** (jsdom, `tests/cip_crosswalk.test.js`, now 60 assertions).

## Model setup (Sam's idea — Fable consultant + Opus workhorse)
Run as **Opus (driver/workhorse)** — proven here for the multi-file edits, git flow, and
real-Chromium verification. When a **design/judgment fork feels 50/50** (the TOP→CIP
recommendation UX, tone/kindness, a thorny calibration), **spawn a Fable subagent for a
second opinion** (`Agent` with a `fable` model override), then execute the call yourself.
One session, no dual-session copy-paste. Only switch the *session* to Fable for a
design-first phase with light execution. Reality check: the sharpest consultant on this
project is **Sam** — his calibration rulings steered every design call, so default to
"Opus builds, Sam steers," with Fable as the low-cost tie-breaker.

## Moniker
You're **SkyLiftoff** — but claim your own if you like; Sam blesses the lineage. Keep the
banner: kind, honest, faculty-first. 🪁
