---
title: Session 69 handoff — you are Session 69
created: 2026-06-22
tags: [handoff, session-69, cobi-masthead, ops, tmc, cpl-news]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_68_handoff]]"
  - "[[docs/cobi_lessons]]"
  - "[[docs/kb-notes/methodology-regen-safe-section-rework]]"
  - "[[docs/kb-notes/tmc-co-review-scope]]"
---

# You are Session 69

Session 68 was **SkyAlizarin** (alizarin — a deep madder red; the Sky lineage:
SkyGate → Startripper → Skyloft → Skylander → Skywatch → **SkyAlizarin** → you).
It was a fast, conversational UI+ops session with Sam live the whole time. 🎨🛫

## Your #1 carryover — finish the COBI masthead (PR #487, ready, HOLDING)

The big deliverable this session: the **COBI masthead consolidation** — a single-row
"app bar". **It's fully built, ported regen-safe, tested (61 files green), and marked
ready on PR #487** — but I'm **holding the merge on ONE thing: the seal image.**

- Layout: **seal + COBI`CPL` / tagline** · centered **"Where To?"** search · subtle
  utility cluster (**ℹ About** popover holding Project Description/Attachments/Cheat
  Sheet + Today's painting · **Manually Refresh COBI** · Updated stamp).
- Sam's 5 asks all done: subtle links → ℹ About popover; tagline under COBI (no "for
  CPL"); search into the header, label inline, relabeled "Where To?"; **8→24 wink → gold
  `CPL` superscript** (Mamba retired, no outline); **seal left of COBI + COBI seal-navy**.
- **What's left (do this first):** Sam is uploading the official seal to
  `assets/cccco_seal.png` on branch `claude/awesome-brown-dyd33o` (via GitHub web
  upload). When it lands: `git pull`, point the `<img src>` at wherever it landed,
  **sample its exact navy** into the `--seal-blue` token in BOTH HTMLs (currently a
  close `#00356B`), commit, **squash-merge #487, then `mcp__github__actions_run_trigger`
  the daily workflow** so the live header debuts populated (Project Description /
  Attachments / Refresh are generator-injected; the PR is code-only with empty
  `PROJ-INFO` markers). The seal `<img>` `onerror`-hides, so if Sam says "merge now"
  it's safe to merge seal-less and let it pop in later.
- **How it's regen-safe** (read before you touch the header): the generator is barely
  changed — the hidden `#cobi-mamba` anchor now lives *inside* the About panel so the
  existing PROJ-INFO inject lands there; layout CSS is injected from `cobi_brand.js`
  (no Rule-4 `<style>` mirror); only the Refresh button changed in the generator
  (label + strip-by-id). Full method: `docs/kb-notes/methodology-regen-safe-section-rework.md`
  + `docs/cobi_lessons.md` (Session 68). Prototypes `prototype/cobi_header_v1..v5.html`.

## Also shipped + LIVE this session (both merged)
- **Cron ladder (#485)** — the daily refresh was "spotty"; root cause = GitHub's
  scheduler *delays* this cron 1.5–4h (not drops). Pulled it **earlier + a 3rd cron**:
  `17 6` / `17 9` / `17 12 * * *` UTC (≈11 PM / 2 AM / 5 AM PT). CLAUDE.md Rule 1 + §6 updated.
- **Curation-sync resilience (#486)** — found the *real* "spotty" culprit: a transient
  Supabase TLS blip in `kb/_apply_curation.py` (the one unguarded Supabase call in step 3)
  aborted the whole daily publish. Fixed: a retry in `fetch_rows()` + a non-fatal `::warning::`
  guard like its siblings. **Today's dashboard was re-dispatched and is current.**

## Read these first (in order)
1. `docs/cobi_lessons.md` (Session 68) — the masthead arc + decisions.
2. `docs/kb-notes/methodology-regen-safe-section-rework.md` — the technique, so you don't break the regen.
3. `docs/session_68_handoff.md` — the standing lanes below (still all valid).

## Standing lanes (unchanged from S68 — pick up after #487 lands)
- **TMC acceptance engine** (Sam: "Go for A!") — the Phase-2 per-slot verdict engine in
  `tmc_builder.js` (`docs/kb-notes/tmc-co-review-scope.md` + `reference-adt-acceptance-rules.md`;
  consume `slot.flexible` + `t.flexibility` from #479). Plus the bulk-PCF Playwright extractor.
- **CPL News follow-ups** — tune `GOOGLE_NEWS_QUERIES`/`RELEVANCE_MIN` in the
  `cpl-news-harvest` function. News stays PRIVATE to CPLBrain for now (Sam, 2026-06-22).
- **CPL-Assistant CCR/CER recommender ETL** — green-lit, queued (`cpl-assistant-ccr-cer-recommendation-scope.md`).
- **CCR data lane** — morphological-variant pass (Med Assisting/Assistant) + title-lane pass-2 dry-run (measure-first, own PRs, Sam's go before any apply + Supabase re-key).

## Patterns that worked (steal these)
- **Diagnose ops from real data**: pulled 25 workflow runs + parsed actual start-times to
  prove "delay not drops" before recommending the cron change. Numbers > guesses.
- **Make every external call in the daily pipeline non-fatal + retried** — the generator
  already falls back on Supabase outage; step 3 had one call that didn't. Audit for the gap.
- **Prototype-then-port** for UI: v1→v5 mocks (sent via `SendUserFile`, real tokens/fonts) let
  Sam iterate fast; only ported to the monolith once the look was locked.
- **Park the generator's anchor, inject CSS from JS** to rework a regen-owned + Rule-4 region cheaply.
- **Prove idempotency by running the generator twice + diffing** before committing a header change.

## Safety patterns to honor
- **Rule 1/4** — the header is generator-touched + mirrored; don't hand-edit a regenerated
  region's data, change the generator. `CPL_Dashboard.html` === `index.html`.
- **Code-only PRs** — never commit the regenerated `unified_courses_*.js` / data artifacts;
  let the post-merge dispatch publish them.
- **Merge-on-green** (clean OR unstable) for your own engineering PRs; auto-merge is enabled.
- **The seal can't be fetched from chat** — only Sam uploading it to the repo works.

## Your moniker
SkyAlizarin kept the "Sky" lineage going. Claim your own — or keep flying Sky. 🛫
