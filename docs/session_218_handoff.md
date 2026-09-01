---
title: "Session 218 handoff — the 9/02 deck is delivered; fix the explainer's prose next"
created: 2026-09-01
updated: 2026-09-01
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 218

Suggested moniker: **SkyProse** if you take the explainer-prose fix, or
**SkyFlow** if the origination spellings have landed (that was S217's
suggested name before Sam pivoted the session to a deck).
Predecessors: SkyPool S215 (mock + R-sheet) → SkyPort S216 (the one-pool
port shipped, PR #1427) → **SkyDeck S217 (the 9/02 session deck + this
checkpoint)**.

## What S217 did (2026-09-01)

- **Confirmed PR #1427 merged** (Sam squash-merged 01:45 UTC) — the one-pool
  tab, explainer, memo, and CSV are live on `main`. Nothing was owed there.
- **Rebuilt Sam's Taco Tuesday deck for the 2026-09-02 session** (8 → 14
  slides): agenda for his run of show (**30 min Ed Code · 5 min $50K
  reporting methods, presented by a teammate · 10 min questions**), the
  ESS 25-82 $50K commitments slide + a reporting-methods slide, THREE Ed
  Code §78093.2 slides (establishes / requires / the statute verbatim), and
  the funding slides updated to the current model **at general principles
  only**. Deliverable + searchable companion + build script:
  `CPLBrain/04-projects/cpl-initiative/20260831_Taco_Tuesday_3.pptx` —
  **verify it exists on CPLBrain main**; if only `_2` is there the session
  bricked mid-delivery: rebuild from the committed `_3_build.py` beside it
  (spec also in `cpl_funding_lessons` §2026-09-01).
- **THE SUNSHINE RULE (Sam, verbatim, now lane doctrine):** *"I don't want
  to get into specifics on the new funding, just the general principles…
  New funding is still in draft form that I need to confirm with CO
  leadership before sunshining details."* Outward materials carry the
  model's shape only — no dollar figures, weights, institution counts, or
  the explainer link. Full statement + the shape list: the lane file's
  Durable rulings.
- **Found two stale STATIC prose passages in the public explainer**
  (`funding-model/index.html`): step one still sizes on credit FTES over
  "all 115 … 1,069,182" (one-pool sizes on COMBINED FTES over 118), and
  step three + the choices table say factors are 1.0 (live Year-1 factors
  are 0.5, effective via mirrorYears). The painter only overwrites elements
  with ids — a sentence can't be repainted. KB note:
  `methodology-a-live-painted-page-still-goes-stale-in-its-prose`.
- Deck corrections against live values: opt-in Oct. 31 → **Nov. 1, 2026**
  (config `participationDeadline`), label → "Primary CPL Contact listed in
  MAP", 48-of-115 re-verified exact, noncredit-campuses exhibits gate noted
  (N1 a). "Rural-college allowance" removed from Guiding Principles — not
  in the adopted model.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` — lane truth (sunshine
   rule, the explainer defect, NEEDS SAM ×2, NEXT ①–④).
2. `docs/cpl_funding_lessons.md` §2026-09-01 — the deck run's story.
3. `kb/docs_audit/latest.json` — run `python3 kb/_docs_audit.py` fresh.

## Priority work, in order

1. **Fix the explainer's two static prose passages** — paint the
   load-bearing claims from the payload (the `nc-body` paragraph is the
   worked pattern) or delete the duplicated mechanics prose. Small PR;
   `test` green then squash-merge per branch policy.
2. **Origination feed cutover** — unchanged from S217: when Malone/Pedro
   confirm the Origin + LocID2 spellings (CPLBrain#67), flip `ppa` in
   `funding/_build_funding_performance.py`; the tab needs no consumer edit.
3. **Sam's open display call** — Annual-view earning % can read >100%
   (window earning over per-year figure). Implement whichever way he rules.
4. **Cleanup commit** (small) — dead CSS for retired row shapes
   (`.cplfund-ncrow`/`.cplfund-ncsysrow`/`.cf-lanechip`/`.cplfund-awardrow`/
   `.cf-prio`), `pinFrozenRows`'s `:not(.cplfund-ncsysrow)`; keep `.cf-gap`.
5. **Briefing display-name sweep** — `college_briefing.js` renders raw
   college keys (belongs with college-district-identity).

## Patterns that worked / safety

- **Sunshine rule governs every outward surface** — check it before putting
  any new-funding figure in a deck, memo, or public page.
- Read effective model values live (`scripts/funding_effective.js --config`
  with a fresh config dump); memory rows hold rulings, never values.
- Remote-container toolbox: LibreOffice ships core-only —
  `apt-get install libreoffice-impress` before any pptx render; `pypdf` is
  broken there (bad `cryptography`), PyMuPDF does text + page images;
  `cccco.edu` is egress-blocked — use the public KB's mirror of ESS 25-82.
- Deck edits as an asserted build script (fresh unzip → clone slides →
  exact-match text replacements that fail loud) made three revision rounds
  cheap and left the method committed beside the deliverable.
