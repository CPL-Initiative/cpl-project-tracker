---
title: "Memory tab / Autogenerate + the Briefing — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Memory tab / Autogenerate + the Briefing

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Drafting a memory row from a typed topic, reading the entries back, and curating them.

## Status

✅ **AUTOGENERATE + BRIEFING + CURATE ACTIONS LIVE; BRIEFING CONFIRMED BY SAM IN A BROWSER (2026-08-25) — do not re-ask.** ⭐ **ORDER IS SELECTION, NOT SEQUENCE.** The corpus budget is **17,951 chars** (20,000 server cap minus a MEASURED 2,049-char envelope) against **83,058** of verified entries, so ~18% fits and whatever sorts last is never read — recency read 34 of 188, every one dated 2026-08-05 or later. ⚠️ **A STRICT LADDER SORT IS WORSE, AND ONLY LIVE DATA SHOWS IT**: 82 of 188 rows are procedure+decision, so it spends the whole budget in band 0 — 38 decisions, ZERO facts, pitfalls, risks or milestones. ⭐ **THE LADDER ORDERS, A PROPORTIONAL SHARE SELECTS** — each row carries `(j+0.5)/bandSize` and the sort runs fraction-first, band-second, so any prefix holds the same FRACTION of every band. Live: **49 entries, all seven kinds**. A band of *n* first appears at `1/(2n)`, so at a 20% cut every band of **3+** rows is guaranteed — assert that, not "every band always". ⭐ **`plain` AND `title` ARE READER-FACING** (Sam, 2026-08-26) and `briefRow()` was sending `summary`, so screen and model read DIFFERENT words — **every plain-language pass this table ever had never reached the model**. 202 rows rewritten: **0 without plain text, 0 with developer jargon, 0 British spellings**. `summary`/`detail` stay the curator record. ⚠️ **GUARDS ON THE ORDERING FUNCTION ALL PASSED WITH THE WIRING DELETED** — the guard that works drives the real panel and reads the body SENT. ⚠️ A case-INSENSITIVE detector with a case-SENSITIVE fix leaves the capitals behind. ⚠️ **THE WRITE KEY NAMED NOTHING** — `slug` is UNIQUE but NULLABLE, so 6 of 572 rows PATCHed zero rows while the page blamed the team phrase; writes key on `id`. ⚠️ **HALF A TWO-HALF FEATURE DEPLOYS ITSELF** (Pages client vs a dispatched Edge Function). ⚠️ **ONE ROW STILL CARRIES A FALSE STAMP** (`stale` + `verified_by='curator'`), awaiting Sam — the **11 `proposed` rows verified_by Sam/Jenni are real attribution, never sweep those**. **Corpus: 390 proposed / 190 verified**, 26 verified rows name no verifier. **NEXT:** ① Sam's go on the false stamp; ② the 26 unattributed; ③ **Sam works the hopper** — readable end to end now; ④ raising the 20,000 cap needs a `cpl-chat` deploy (his call). Story: [`docs/cobi_memory_tab_lessons.md`](docs/cobi_memory_tab_lessons.md); durable [`a-silent-input-cap-is-a-content-swap`](docs/kb-notes/methodology-a-silent-input-cap-is-a-content-swap.md) · [`when-a-corpus-does-not-fit-the-order-is-the-selection`](docs/kb-notes/methodology-when-a-corpus-does-not-fit-the-order-is-the-selection.md).
