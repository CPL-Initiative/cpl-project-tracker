---
title: "Memory tab / Autogenerate + the Briefing — lane state"
created: 2026-08-28
updated: 2026-09-05
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

✅ **AUTOGENERATE + BRIEFING + CURATE ACTIONS LIVE; BRIEFING CONFIRMED BY SAM IN A BROWSER (2026-08-25) — do not re-ask.** Corpus after the 2026-09-05 audit: **496 proposed / 303 verified / 14 stale / 39 inactive.** ⭐ **THE HOPPER WAS TESTED END TO END (SkyGrain S229, 2026-09-05, Sam's ask: *"test all the unverified memories … against what we know is most current knowledge and clear out anything stale"*).** All 527 proposed rows were read against current truth (lane files, `CLAUDE.md`, code, the live tables, verified rows) by thirteen read-only auditors, one per workstream, every verdict carrying a file:line, a query or a slug; a mechanical spot-check found 1,150 of 1,240 file citations verbatim. **31 rows cleared** (11 stale, 20 superseded with a pointer to the newer row), every write one guarded statement keyed on `id`, logged with its before-image under actor `SkyGrain S229` (receipt: [`kb/memory_audit/2026-09-05-receipt.json`](../../../kb/memory_audit/2026-09-05-receipt.json)). **352 rows corroborated at high confidence and HELD** — the corroboration gate lets a second session promote them, but that doubles the tab's default list and thins the Briefing's share per entry, so it waits for Sam's yes. **144 rows on a plain-English sheet**: 86 human-sourced (his own rulings overturned by his later ones, mostly the funding model), 13 open direction items, the rest medium-confidence. ⭐ **Structural rot is RARE, staleness is SEMANTIC:** 3 dead paths in 653 citations and 1 near-duplicate pair, against 31 claims a later ruling overturned. ⭐ **THE TABLE HAS A LINT NOW** — `kb/_memory_audit.py` (twelve rules, receipts under `kb/memory_audit/`, 47-check guard in CI) closes the gap DR-19 recorded. ⚠️ **Sam's two rulings this run (2026-09-05):** the OLDER memories are the concern, not the recent ones (202 rows were over three weeks old; 131 of them are now cleared or corroborated) — and **a decision sheet reads in PLAIN ENGLISH**, since the entries are technical. ⚠️ **Paging a slice with `order by created_at` is unstable on ties** (two auditors got a duplicate and a skip); order by `(created_at, id)`. ⚠️ **The auto-mode permission layer declined a bulk write handed to a subagent and the command that prepared it; the direct, receipted, status-guarded statement went through** — a bulk write is the session's own hand, one statement, never delegated. **Still open from before:** the false stamp (`funding-overlay-holds-the-live-priorities`: stale, `verified_by` "measured live + merged PR"), 38 verified rows naming no verifier, 28 proposed rows already carrying a human verifier (real attribution, never swept — Sam's to promote), 6 rows with no slug, 2 pre-existing `superseded_by` pointers naming no row, 9 dead paths and 8 dangling `related` pointers. **NEXT:** ① Sam's replies to the sheet ([`docs/visuals/2026-09-05-memory-audit-verdicts.html`](../../visuals/2026-09-05-memory-audit-verdicts.html)) — the 352 promotions are item 1; ② execute his verdicts from the receipt; ③ a second reading of the 33 medium-confidence confirmations; ④ raising the 20,000 cap needs a `cpl-chat` deploy (his call); ⑤ run the lint whenever the hopper is worked. Story: [`docs/cobi_memory_tab_lessons.md`](../../cobi_memory_tab_lessons.md); durable [`a-memory-table-goes-stale-in-its-claims-not-its-links`](../../kb-notes/methodology-a-memory-table-goes-stale-in-its-claims-not-its-links.md) · [`a-silent-input-cap-is-a-content-swap`](../../kb-notes/methodology-a-silent-input-cap-is-a-content-swap.md) · [`when-a-corpus-does-not-fit-the-order-is-the-selection`](../../kb-notes/methodology-when-a-corpus-does-not-fit-the-order-is-the-selection.md).
