---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# SkyView / the CCR curation interface

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** An interactive view of the Common Course Reference — common courses by discipline, their constituent local courses, and moving a course to where it belongs.

## Status

✅ **PROTOTYPE LIVE; SKYVIEW IS THE LANDING VIEW OF THE CCR TAB** (SkyView #1309–#1312 · SkyCal #1317 · SkyCruise #1329 · SkyFixer #1331). ⭐ **GRINDING THE WHOLE QUEUE PERFECTLY LANDS AT 35,937 — 14.4× SHORT OF 2,500.** Merging only compares what exists; **packaging** is the only mechanism with the right shape (ESL proved it at **85:1** — [`measure-your-mechanism-ceiling`](docs/kb-notes/methodology-measure-your-mechanism-ceiling-before-working-the-queue.md)). Target **≈17 per discipline**. ⭐ **THE CORPUS IS ~5,700 DECISIONS, NOT 17,321 ROWS** — 97.1% are ≤12 identities, modal 2; **3,001 carry NO discipline** (8,065 identities), a different job kept separate. ⚠️ **THE WORK SURFACE BEHIND THE MAP IS 1.2% BUILT — 5 of 159 subjects, 593 of 49,907 identities.** ⚠️ **`CN:<control number>` does not name one course** on 3,634 draggable rows — refused, with the reason; **zero `CN:` rows exist**, which is the only window you get to find a latent key defect. Real worklist: **73** two-real-course numbers, **93 at San Jose City College**. ⭐ **A SUBJECT-NAME MATCH OUTRANKS A COURSE-TITLE MATCH** (#1331) — tiers exact→prefix→contains, variants that EXTEND one another fold to the shortest, and titles pick the destination only when no subject name matches. ⚠️ **Refusing to pick is not automatically honest**: the old rule declined among several subjects and shipped a worse guess — a subject the term never named. **Typeahead is the real fix**; the tie-break is only what happens when the curator does not pick. ⭐ **THE CCR TAB OPENS ON THE MAP AND DEFERS THE TABLE'S ~7 MB** until someone asks for the list — except a curator returning from a magic link, which is intent to curate. ⚠️ **A declared fold reaches only the roster that consults it** (`CaÃ±ada College` in the member list; the raw export carries only the broken spelling, 678×). ⚠️ **The page must be SERVED, not opened.** **NEXT:** ① **decision packs per discipline, fetched on demand** — the bottleneck behind every UI tweak; ② **Sam drives the flipped view** (density + the drop affordance are his calls); ③ the 73 two-real-course numbers; ④ the member-roster fold at source; ⑤ **the QUEUE** — a drag leaving the destination's SUBJ4 inconsistent with its corroborated discipline queues a re-mint candidate, **proposes never auto-adds**; ⑥ the 67 `ESOL Z####` rows, `FIMS M1018` (needs an un-merge verb), a tool for the 3,001. Story: [`docs/ccr_atlas_lessons.md`](docs/ccr_atlas_lessons.md).
