---
title: "Receipt — gr_memos / gr_memo_sections seed (Memo A draft 1 + B/C stubs)"
created: 2026-08-31
tags: [receipt, gr-register, guidance-memos, rule-10]
kb-status: internal
obsidian-folder: cpl-project-tracker/receipts
---

# Receipt — guidance-memo seed, 2026-08-31

**What:** INSERT-only seed of the new `gr_memos` + `gr_memo_sections` tables
(migration `gr_memos_guidance_surface`, same night) so Memo A lives in the GR
tab for Sam to iterate. Sam's ask, 2026-08-31: *"Can we incorporate the memo in
the GR Priorities tab in the CPL project? Perhaps wire it into the current memo
generator there? So I can iterate?"*

**Rows written (all INSERTs, no UPDATEs, no DELETEs):**

| What | Count | `created_by` |
|---|---|---|
| Memo A header (area `cpl`, key `A`, status `draft`) | 1 | `SkyLedgerS210 (Memo A draft 1 seed, 2026-08-31)` |
| Memo A sections (n = 1–7, from register rows #12, #4, #1, #2, #8, #14, #6) | 7 | `SkyLedgerS210 (Memo A draft 1 seed, 2026-08-31)` |
| Memo B stub (key `B`, register row #15) | 1 | `SkyLedgerS210 (three-memo plan stub, 2026-08-31)` |
| Memo C stub (key `C`, rows #11 / #16 / #21) | 1 | `SkyLedgerS210 (three-memo plan stub, 2026-08-31)` |

Content source: the delivered Memo A draft 1
(`CPLBrain/04-projects/cpl-initiative/20260830_CPL_Guidance_Memo_A_What_Is_Already_Law_Draft_1.md`),
which stays as the delivered snapshot; **the tab rows are now the working
copy Sam iterates.** Section 2 carries the ACCJC pre-issuance confirm as
`confirm_note`; the sequencing hold rides `hold_note` on every memo.

**Rollback (reverses the seed exactly, nothing else):**

```sql
delete from public.gr_memo_sections
 where created_by = 'SkyLedgerS210 (Memo A draft 1 seed, 2026-08-31)';
delete from public.gr_memos
 where created_by in ('SkyLedgerS210 (Memo A draft 1 seed, 2026-08-31)',
                      'SkyLedgerS210 (three-memo plan stub, 2026-08-31)');
```

⚠️ Valid only while Sam has not edited the rows — his edits change `updated_by`
but not `created_by`, so after he iterates, a blanket delete would destroy his
work. From the moment a row's `updated_by` differs from its `created_by`, the
`gr_history` audit trail (populated by trigger on every update/delete) is the
rollback source, row by row.

**Governance (Rule 10 a3):** both tables mapped to DR-22 in
`kb/governance_surface_map.json` beside the register's other three; the drift
detector counts them as mapped. No student data — pre-decisional policy prose
only; the student-detail disclosure ADR boundary is untouched.
