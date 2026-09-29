---
title: "Noncredit CIP categories — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Noncredit CIP categories

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Which of the CO's ten noncredit CIP categories a program belongs to — and what that means for CDCP eligibility and funding.

## Status

🔨 **SCOPED + PARTLY BUILT; a blanket rule shipped and was reverted** (SkyCode, #1191 · #1192→**#1194** · #1198 · #1199). Read [`docs/noncredit_cip_category_scope.md`](docs/noncredit_cip_category_scope.md) before touching this — it is the authority and the numbers live there. ⚠️ **#1192 shipped "all noncredit programs → `32.0111`" and was live ~20 minutes.** Jenni clarified: **Short-Term Vocational ONLY** — ESL, Job Prep and some Basic Skills are CDCP-eligible on *other* codes, the rest of noncredit is leisure. The blanket rule was wrong for the **majority** of 3,187 programs. ⭐ **THE TOP IS NOT LOAD-BEARING.** Short-Term Vocational is `32.0111` **plus a secondary credit CIP** aligning with the subject, so the **1,796** programs on a "wrong" credit CIP are not errors — that code IS the secondary — and **1,789 of 1,796 (99.6%)** already sit inside their own TOP's crosswalk. A TOP-correction project was unnecessary. ⚠️ **TOP cannot decide the category even when correct**: only **28.8%** of programs are claimed by one category (Short-Term Vocational and Workforce Preparation are both "any vocational code" → **1,928 undecidable**); it blocks compliance for **17 programs / 13 colleges**; peer consensus repairs **38 of 3,187**. **Ladder:** 997 read to one category from their noncredit CIP · 76 off-list · 1,796 hold the secondary · 247 no CIP · 71 retired. Secondary CIP categories: CTE 1,327 · Both 177 · Non-CTE 292. ⚠️ **CTE IS FUNDING-BEARING** (CTE noncredit qualifies, non-CTE does not) → **category confirmed BEFORE CTE concluded**; the *"noncredit TOP must start with 49"* flag is **deliberately unshipped** (1,970 would flag, **1,601 of them `GOAL = CTE`**, and moving them off an asterisked TOP can strip the marker). ⚠️ **A relayed code table had its Basic Skills labels shifted by one, silently** — caught only by checking **all seven pairs** against the CO's certified catalog; the validator now runs on every rebuild. **Guards that survived the revert:** computed **never stored**; a proposal says `proposed · COCI has X`, never *"changed from"* (which claims a human decision); a proposed code must appear in the row's own option list. **BLOCKED ON JENNI:** the Basic Skills pairing (alone unblocks build phases 1–3) · `32.0199` (60) and `35.0101` (16) in use but off her list · is the 2026-07-15 crosswalk cut the locked one · is the secondary CIP becoming a COCI field · **can non-CDCP categories be CTE at all** (~1,300). **BLOCKED ON SAM:** where a confirmed category persists — `localStorage` is wrong for a funding-relevant determination; recommend a gated Supabase table with who/when, as with `cr_reference_decisions`. Story: [`docs/cip_crosswalk_lessons.md`](docs/cip_crosswalk_lessons.md); durable [`methodology-the-record-may-already-hold-a-better-signal…`](docs/kb-notes/methodology-the-record-may-already-hold-a-better-signal-than-the-field-you-are-repairing.md).
