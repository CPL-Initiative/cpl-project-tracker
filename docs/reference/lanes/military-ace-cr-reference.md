---
title: "Military (ACE) CR Reference — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Military (ACE) CR Reference

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** The same canonical-vocabulary question for the 98% of MAP's CR rows that come from ACE-reviewed military training.

## Status

✅ **SCOPED, NOT BUILT** (Sky153). Sam: *"the military ones may be the stickiest"* — right about the lane, wrong about the mechanism. ⭐ **ACE IS ALREADY A CONTROLLED VOCABULARY**: **93.4%** of (`exhibit_id`, units, topic) groups hold exactly ONE text; the 6.6% residue is **case and punctuation**, never wording. So automation reaches **3× further than the freehand lane — 33.5%** of the vocabulary resolves with zero judgment (ladder: 10,117 raw → 7,106 after typography+units → 6,749 after the rank strip → **6,725** real topics). ⭐ **THE STICKINESS IS VOLUME + NAMING.** 6,725 topics vs 2,183, and a much flatter head: **250 decisions for half the lane vs 50** (top 25 = 21.5%, top 250 = 52.5%). The CCN>C-ID>M-ID cascade fires on **2.6%** of ACE rows vs **94%** of MAP-local — the mechanical proof behind "subject areas, not courses" — but the cascade **already ends in *published line*, and ACE's own text IS that line**, so no new naming ruling is needed. The two lanes share only **134 of 7,106 topics (5.9% of ACE rows)**: the built CCRR does not cover this one. ⭐ **A RUNG UNIQUE TO THIS LANE** — USMC skill-level tokens leaked into the topic text (`ssgt gysgt supervision`): **482 topics / 12,157 rows / 181 exhibits / 94 colleges**, and stripping the rank lands **306 topics / 10,550 rows** on an existing base topic. This is `cpl_memory` row **`f8`** (Marine JSTs repeat CRs at every skill level) surfacing at the text grain. ⚠️ Strip list **needs widening before it ships** — 176 don't land (`leadership ssgt and above` → dangling qualifier; spelled-out `gunnery sergeant … only`). The rank is an attribute (who qualifies), never part of what the credit is FOR. ⚠️ **THE FREEHAND RANKING RULE DOES NOT TRANSFER** — every head topic already sits at ~80–100 of 108 colleges (top 200 average **78**), so collapse value multiplies by a near-constant and ranks nothing. **Rank by ROWS** (the backlog each topic represents). ⚠️ **Token containment is SUGGESTION-ONLY**: `management` contains 21 narrower topics — `project management`, `records management`, `supply chain management` — **none of which are `management`**; merges stay pairwise and gated, never transitive. ⭐ **POSTURE CHANGE, not just a build change: a third of this lane is an INGEST defect.** 58 colleges hold BOTH casings of the same string and **0** hold only one, so no human ever chose — the variance travels with the record, not the institution. A workbench here would ask curators to do a parser's job **767 times**. **FREE WIN READY:** the not-a-topic class is **47 strings / 6,663 rows** (`Credit Is Not Recommended` 32/3,892 + individualized-assessment 15/2,771) — bigger than the 3,242 §11 previously cited, which was one string not the class. **NEEDS SAM (4 questions, §10 of the scope):** ① are ACE **unit variants** one recommendation? (`AR-2201-0552` issues *Orienteering* at 1, 2 AND 3 hours — **22.2% of the vocabulary turns on this**, and the earlier units ruling came from a different situation); ② is the 767-string typographic class fixed **upstream** or absorbed downstream (`cpl_memory` `o3` already proposes it); ③ how far to merge subject-area granularity (`supervision` / `principles of supervision`); ④ is the not-a-topic class auto-N/A? Scope: [`docs/military_cr_reference_scope.md`](docs/military_cr_reference_scope.md); durable: [`methodology-tell-a-parser-defect-from-a-people-defect`](docs/kb-notes/methodology-tell-a-parser-defect-from-a-people-defect.md).
