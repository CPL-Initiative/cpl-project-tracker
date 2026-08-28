---
title: "GR register / CO policy & regulation review — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# GR register / CO policy & regulation review

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Every CO priority area's regulatory / Ed. Code revisions under consideration, with the artifacts informing them — pointed at the whole CO, not just CPL.

## Status

✅ **BUILT, AUDITED, PHRASE-SCOPED; EDIT + BOTH ANALYSIS LANES LIVE** (Sky168 #1237/#1240; SkyFixer #1331; Sky195 #1333/#1334). `gr_areas → gr_revisions → gr_artifacts`; 2 areas · 20 revisions · `dual-enrollment` is a marked **SAMPLE**. ⭐ **CITATIONS ARE DATA** — a section dropdown cannot exist while §55050 lives in a sentence. ⚠️ **The JS bands MUST mirror `gr_citation_code()` character-for-character**; assign by explicit range and REFUSE the rest. ⭐ **Lane A is DETERMINISTIC and that is the design** — `blast_rank` is computed by nothing, so "reanalysis" had no referent; what a register needs before the CO is the checks a lawyer makes first. ⭐ **LANE B + THE AREA SWEEP SHIPPED (Sky195).** Sam: *"Your sweep is the routine I want to be able to run on demand after edits"* + *"add the ability to add new priorities as proposed"*. **The sweep is NOT the per-row call widened** — three findings are structurally invisible per-row: the headline needs an AREA-level document, *weakened* is comparative, and a duty no row covers is not a finding about any row. ⭐ **THE DOCTRINE IS MEASURED AND AREA-SCOPED** — regulation-must-change → T5 only **3 of 3**, statute-blocks → EC + `ed_first=Yes` **2 of 2**; keyed to `cpl` in `DOCTRINE_AREAS`, never a string sniff, because the sample area's rows exist to demonstrate the absence of positions. ⚠️ **THE SURFACE VOCABULARY IS FIVE PLACES** (`KNOWN_SURFACES`, `DRAFTING_SURFACES`, `SURFACE_QUERY_CAPS`, the SQL CHECK **and the live DB**, the `sierra_training.js` picker) — the scope doc named three and a memory row named a different three. ⚠️ **TWO BUDGETS AND THE RAISED ONE IS NOT BINDING**: input 40,000, but `MAX_TOKENS=2048` caps the REPLY, which must carry a verdict for every row — a truncated reply is diagnosed as a reply-budget problem, never as an undeployed surface. ⚠️ **A CLIENT CANNOT SEE THE CAP THE SERVER ENFORCES** — Pages ships the client, a dispatch ships the function, and in between an unknown surface takes the 1,000-char chat cap and eats the contract at the END; CI cannot see it either. ⭐ **ARTIFACTS ARE EVIDENCE** and the model is told it holds the RECORD, not the document. ⚠️ **A proposed priority is a DRAFT ROW** — same insert path, stamped `proposed` + `citations_derived`, citations through `parseCites` with rejects SHOWN, capped at 3, and numbering REFUSES on a failed read. ⭐ **SB 135 CHANGED THE GROUND** — Ed. Code Article 9 (§78093–78093.2, eff. 2026-07-13): **row #2 asks for enacted law**; #1/#11/#14/#16 gain statutory hooks; **one finding cuts AGAINST #12**; four duties no row covers. The bands were widened to Part 48 (78/79) because the register could not cite its own governing statute. ⚠️ **0 of 20 verified** — Sam's authenticated PDFs are the first material that can move it. **NEXT: ① Sam on #2 and #12 (legal calls); ② the 4 candidate new rows; ③ the verification pass; ④ the CO priority-area list.** Story: [`docs/gr_register_lessons.md`](docs/gr_register_lessons.md) · [`docs/gr_sb135_row_sweep.md`](docs/gr_sb135_row_sweep.md); durable [`a-client-cannot-see-the-cap-the-server-enforces`](docs/kb-notes/methodology-a-client-cannot-see-the-cap-the-server-enforces.md).
