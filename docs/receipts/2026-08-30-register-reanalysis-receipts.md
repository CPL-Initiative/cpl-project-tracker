---
title: "Register Re-analysis — execution receipts (before-values)"
created: 2026-08-30
tags: [receipt, gr-register, rule-10]
kb-status: internal
obsidian-folder: cpl-project-tracker/receipts
---

# Register Re-analysis — receipted `gr_revisions` edits (2026-08-30)

Rule 10 (a2): a guarded UPDATE's receipt captures before-values. Sam ruled the
22-item sheet reply-by-number; every edit below ran as a guarded UPDATE
(`where id = … and status = 'proposed'`) or an INSERT, `updated_by`/`created_by`
stamped `SkyLedgerS210 (Sam reply-by-number, 2026-08-30)`. Rollback: restore
the before-values below (or delete the inserted rows 17/18/19/21 by n).

## Append-only edits (before = current minus the appended block; citations before-arrays listed)

- **Row 1** `1dfabed3` — summary: the parenthetical " (local, Cal-GETC, CSU GE
  Breadth, or UC GE Breadth)" was REMOVED and a "Now statutory" paragraph
  appended. Citations before: `[EC §66025.71, T5 §55050]`.
- **Row 3** `3a0484d5` — consideration: vehicle sentence appended. Citations unchanged.
- **Row 7** `96c7eaa2` — consideration: post-SB 135 block + Sam's verbatim note
  appended. Citations before: `[GC §11342.2, T5 §58003.2, T5 §58050, T5 §58051]`.
- **Row 11** `cd987325` — citations only. Before: `[T5 §55050]`.
- **Row 13** — citations only (applied in a follow-up guarded UPDATE the same sitting after the batch missed it). Before: `[T5 §55050]`; after: `[T5 §55050, EC §78093.2(a)(3), EC §75013(b)]`.
- **Row 14** `dfb5cf06` — citations only. Before: `[T5 §55050]`.
- **Row 16** `f6e68f8d` — citations only. Before: `[T5 §55050]`.

## Replaced-text edits (full before-values)

- **Row 2** `1a09b102` — summary before: "<p><b>Approach.</b> Require colleges
  to recognize transcribed CPL from other CCCs and apply it without a second
  review. §55050 can mandate CCC-to-CCC; the <b>CPL TBL already codifies
  it</b> and extends it to CSU (<i>shall</i>) and UC (<i>requested</i>).</p>"
  · consideration before: "Title 5 cannot bind CSU/UC — so intersegmental
  reciprocity is only achievable via the TBL. Removing the CPL flag (#9) also
  achieves most CCC-internal reciprocity automatically." · pathway before:
  `[y, r]` · citations before: `[T5 §55050]`.
- **Row 4** `fe5b6e38` — title before: "No local limit on CPL units" · summary
  before: "<p><b>Approach.</b> §55050 sets no statewide cap — caps are purely
  local district policy. A memo can recommend districts drop them now; Title 5
  can prohibit numerical caps.</p>" (second edit same night replaced the
  memo-now sentence with the sequencing text). Citations before:
  `[T5 §55050, T5 §55063]`.
- **Row 5** `99e2d02c` — status before: `proposed` (now `retired`);
  consideration before: "Reciprocity (#2) delivers ~90% of the benefit without
  the heavy statute or accreditation questions — the recommended near-term
  substitute." (retirement reason appended, original preserved in place).
- **Row 6** `491e1504` — summary before: "<p><b>Approach.</b> Mirror the
  existing ACE clause in §55050 — \"shall consider … where possible honor\" —
  for the ASCCC Pathways-to-Credit statewide recommendations. Currently only a
  funding condition; the TBL also codifies it.</p>" · verified before: null
  (now verified 2026-08-30 with note). Citations before: `[T5 §55050]`.
- **Row 8** `91f0c722` — consideration before: "Coordinate the funding half
  with #7 and the Dual Enrollment priorities package, which carries the same
  credit-by-exam apportionment ask." (summary gained an appended paragraph).
  Citations before: `[EC §76002, EC §76004, T5 §55050]`.
- **Row 9** `d8af1742` — title before: "Remove the requirement to requirement
  to note CPL on the transcript" · status before: `proposed` (now `in_procedure`).
- **Row 10** `66d22d63` — consideration before: "The affirmative half of #9:
  record all the credit, just not the discriminatory source-flag." (summary
  gained an appended paragraph). Citations before: `[T5 §55050]`.
- **Row 12** `a40be7dc` — consideration before: "The cleanest win in the
  package: free, immediate, and it removes an unnecessary barrier at every
  college." (replaced by the same sentence + Sam's (f)(2) pre-emption + the
  sequencing note). Citations before: `[T5 §55002, T5 §55050]`.
- **Row 15** `a6273865` — summary sentence before: "A memo can interpret the
  existing appeal right; Title 5 can make it explicit." (replaced with the
  sequenced version).

## Inserts (rollback = delete by area_id='cpl' and n)

- **Rows 17, 18, 19, 21** — new rows per the ruled sheet cards; n=20
  deliberately absent (the ruled fold to the implementation-funding lane).

## Verification

Post-transaction SELECTs confirmed every row's new state same-minute; the
ruled sheet (`docs/visuals/2026-08-30-register-reanalysis.html`) carries each
verdict verbatim.
