---
title: Accounting discipline cleanup — cross-disciplinary plan
date: 2026-05-30
tags: [curation, discipline, ccr, cross-listing, accounting, rule-7]
artifacts:
  - Supabase kb_curation (22 rows, field=discipline — APPLIED, source of truth)
  - kb/coci_curation.json (mirrors via daily _apply_curation.py cron, 40 → 62)
  - excel_to_dashboard.py + unified_courses.js (workstreams A + B)
related:
  - CLAUDE.md Rule 7 (re-mint playbook)
  - docs/coursecontrolnumber_remint.md
status: safe-set APPLIED; cross-disciplinary set BLOCKED on 2 decisions
---

# Accounting discipline cleanup

Context: "Accounting" is **not** on the 240-item MQ discipline vocabulary
(`kb/reference/mq_disciplines.json`); the correct broad bucket is **`Business`**.
The finer "Accounting" label survives as `discipline_provisional` on the curated
anchors and is now surfaced in the CCR (workstream **A**, this PR).

## Audit (re-derived 2026-05-30, fresh from the live KB)

Accounting-title courses (title regex, energy/quality/security "auditing"
false-positives excluded):

| Set | Count | Already `Business` | Off-Business |
|---|---|---|---|
| Corroborated M-IDs | 147 | 131 | 16 |
| Singletons | 238 | 200 | 38 |

The off-Business rows split into **22 safe** + **25 genuine cross/mis-disciplined**
+ **7 false positives** (IT/security/building "…Auditing" — not accounting,
correctly disciplined, left untouched).

## 1. Safe set → Business — **APPLIED** (22)

Blank-discipline + "Vocational" catch-all accounting, all genuinely accounting.
Written to Supabase `kb_curation` (field=discipline, value=Business,
reviewer=MAP@rccd.edu) — the source of truth. The daily `_apply_curation.py` cron
mirrors it into `kb/coci_curation.json` (40 → 62 entries) and regenerates the
dashboard, so the CCR shows Business within one cron window. Reversible (overlay;
never touches the firewalled anchor).

M-IDs: `BBK M1001`, `BBK M9001`, `BUSA M1003`, `BUSA M9003`, `FINC M9006`.
Singletons (blank): `BBK M10AC`, `BUAC M10AE`, `BUSA M10AF`, `BUSA M10AJ`,
`NC M90LW`, `NC M90LX`, `NCBU M90AO`, `NCBU M90AP`, `OFFT M90AJ`, `OFFT M90BB`,
`VBUS M90BG`. Singletons (Vocational): `VOCE M90CX/CY/CZ/DA/DB/QC`.

(The summarized "11 safe" undercounted — it predated the singleton + Vocational
sweep across both files. All 22 verified genuinely accounting.)

## 2. Cross-disciplinary set (25) — your similar-vs-not-aligned rule

> *similar (like DRAF & ARCH) → each a listing with the same course number +
> respective discipline; not aligned → own listing, numbered to fit the
> surrounding courses.*

### Bucket 1 — home discipline is simply WRONG (not a cross-list; clean reassignment)
| ID | Title | Current (wrong) | Fix |
|---|---|---|---|
| `CISC M9029` | QuickBooks Fundamentals … Intermediate | Computer Science | Business |
| `CISC M9030` | QuickBooks Fundamentals … | Computer Science | Business |
| `CISC M12GG` | QuickBooks Desktop | Computer Information Systems | Business |
| `CISC M90AQ` | Excel for Accounting Principle | Computer Science | Business |
| `AUTB M10BJ` | Management Accounting for Agriculture | **Auto Body Tech** (mis-map) | Agriculture (+Business?) |

CS/CIS is not a co-discipline of accounting — "not aligned" → single correct
discipline. `AUTB M10BJ` is a flat subject mis-map (`AB`→Auto Body) and is really
ag accounting.

### Bucket 2 — domain-fused accounting → cross-list candidates ("similar")
| ID | Title | Home | Cross-list |
|---|---|---|---|
| `AGRI M1002` | Agricultural Accounting | Agriculture | Agriculture + Business |
| `AUTO M10CX` | Standard Accounting Systems of the Automotive Industry | Automotive Tech | Automotive + Business |
| `CULN M1003` | Hospitality Accounting | Culinary/Food Tech | Culinary + Business |
| `CULN M90AE` | Food Cost Accounting | Culinary/Food Tech | Culinary + Business |
| `ENTR M1001` | Money, Finance and Accounting for Entrepreneurs | Small Biz Dev | Small Biz Dev + Business |
| `ENTR M10BZ` | QuickBooks Online for Entrepreneurs | Small Biz Dev | Small Biz Dev + Business |
| `MGMT M10AI` | Basic Accounting Concepts for Small Business | Management | Management + Business |

### Bucket 3 — Office-Tech accounting-software cluster (**THE judgment call**, ~13)
`OTEC M1025, M1132, M9008, M9013, M9014, M9015, M10CK, M10IN, M10IT, M10PM,
M90DB, M90DC, M90DG` — QuickBooks / Sage / Account-Clerk / Payroll courses filed
under **Office Technologies**. Office Tech *is* a legitimate home for computerized
accounting, so this is genuinely "defensible either way": **similar** (cross-list
Office Tech + Business) vs **not aligned** (→ Business single) vs **leave** (Office Tech).

## Two decisions needed before I apply the cross-disciplinary set

1. **Cross-list mechanic.** "Same number, both disciplines" is **not natively
   representable** in the staging M-ID layer (one `discipline` per row; SUBJ4 is
   tied to discipline). The *curated anchor* layer already has a
   `cross_listing_group` field, but staging rows don't.
   - **(rec) Add a lightweight `cross_listed_disciplines` array** to staging rows
     → CCR shows "Business + Agriculture", **no renumber, no Rule-7**. Small,
     reversible, additive (renderer + auditor + filter touch-ups).
   - Promote cross-listed courses into the curated anchor layer (heavier, firewalled).
   - Defer cross-listing → pick a single best discipline per course for now.

2. **Bucket 3 classification** (Office-Tech QuickBooks/accounting): similar
   (cross-list) / not-aligned (→ Business) / leave as Office Technologies.

## Rule-7 note on renumbering
"Numbers in the order that best fits surrounding courses" = re-keying minted
identities = a **re-mint** (CLAUDE.md Rule 7) → mandatory dry-run + alias map +
atomic land before apply. Cross-listing that **keeps** the same number needs no
renumber. Any "own listing, renumbered" outcome will ship as a gated dry-run, not
a casual edit. Buckets 1 (reassign-only) and 2/3 (cross-list, same number) need
**no** renumber; only a true "split into separately-numbered courses" would.
