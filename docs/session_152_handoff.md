---
title: Session 152 handoff (SkyRunner → next) — build the CR Reference worklist
created: 2026-08-13
updated: 2026-08-13
tags: [handoff, cr-reference, ccr, curation, eacr]
related:
  - "[[docs/common_cr_reference_scope]]"
  - "[[docs/common_cr_reference_lessons]]"
  - "[[docs/ccr_merge_workspace_epic_scope]]"
superseded: true
superseded_by: session_154_handoff.md
---

# You are Session 152

Session 151 was **SkyRunner** — one PR (**#1174**), merged and live. Both of
Sam's queued items are closed or advanced: the **EACR filters are fixed**, and
the **Common CR Reference is scoped** with Sam's design ruling recorded.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['cr-reference','ccr','curation','identity','sierra']
       or summary ilike '%credit_rec%')
order by event_date desc nulls last limit 40;
```

Five rows written this run. The one that will save you a day:
`attribution-per-course-does-not-prove-a-real-pairing` — it names **two gates
that look right and do not work.**

## 🎯 PRIORITY 1 — Build the Common CR Reference tab, as a WORKLIST

**Read [`docs/common_cr_reference_scope.md`](common_cr_reference_scope.md)
first.** It is measured, and §3 was rewritten mid-run after the gate it
originally proposed failed its own test case. Then the lessons doc for *why*.

⭐ **The governing finding: automation reaches ~10%.**

| Rung | Mechanism | Strings |
|---|---|---|
| 1 | Published statewide set | 351 lines / 134 credentials |
| 2 | C-ID declared on the line | 36 of those 351 |
| 3 | CCR course identity (single-course credentials) | **40** |
| 4 | Twin merge (mechanical) | ~160 |
| 5 | Title / description / issuer similarity | **0 — suggestions only** |

**~90% of the 2,344 is curator judgment and no achievable matcher changes
that.** So **do not build the matcher first.** Build the worklist: ~2,180
topics ranked by collapse value (wordings × colleges affected), each row
offering group / split / confirm with curator attribution, the four rungs
pre-applied and labeled. **Model the affordances on
[`docs/ccr_merge_workspace_epic_scope.md`](ccr_merge_workspace_epic_scope.md)**
— the CCR already solved curator-confirm for course identity.

**ASK SAM (scope doc §7, still open):** global or per-credential? 83% of strings
sit under exactly one credential so per-credential is nearly free — but the top
strings span up to **61** credentials, and that is where the value is.

⭐ **His ruling, do not re-litigate:** *"CID is only one factor… similar to the
CCR, we take into account matching factors like title, course name and number,
course description, subject, etc."* Illustrative, not exhaustive. And this run:
CCR course identity **is** a factor, **gated as rung 3**.

## ⚠️ Things that will mislead you

1. **`attribution='per_course'` is not a gate.** 8,809 rows carry it, including
   every poisoned `AJ 110` row. A consumer trusting it passes the exact case it
   appears to catch.
2. **Neither is a cartesian / line-fraction test.** I built one, measured it
   (43 pairs), documented it, and it **does not fire on the case it was invented
   for** — `AJ 110` hits 8 of POST's 43 lines. The gate that works is the
   credential's **course count**.
3. **The course↔rec-line pairing carries no per-line information.** Of the
   (credential, course) pairs touching >1 line, **zero** have differing college
   sets; 223 share one. But this is true *within* a credential — the good merges
   live *across* credentials, and a gate at the wrong grain kills a sound rung.
4. **`POST Basic Academy` still carries 43 wordings in
   `chatbox_peer_articulations`.** SkyTop's fix resolved the phantom groups at
   *query* time, not in the table. Don't read 43 as a regression.
5. **The EACR dropdowns were never missing** — they were clipped. If Sam reports
   a filter problem again, check whether the control is *invisible* before
   assuming it is unwired.
6. **`tests/cpl_funding.test.js` hangs** (pre-existing), so `node tests/run.js`
   cannot finish; run suites individually. `npm install` first.

## 🧹 Carryover

- **The §11 pare-down is STILL owed** and `CLAUDE.md` is now **~107 KB** against
  a 60,000 budget. I added a roadmap cell and a narrative and archived SkyTop,
  which is net-neutral at best. The audit also flags `docs/INDEX.md` at **5.24×**
  and `docs/roadmap_archive.md` at **2.57×**. A session's work; it keeps not
  happening.
- 12 adoption-file statewide titles absent from `chatbox_credentials` · corpus
  covers 59 of 123 colleges · the 7 `via:"search"` fallback contacts need
  confirming · the site-phrase superset decision · the identity crosswalk write
  to Supabase · the partner-crosswalk engine's 2nd run.

## Patterns that worked

- **Test a gate against the case that motivated it, before designing around
  it.** Measuring a gate's population is not testing the gate. One query
  separated "43 pairs, solved" from "does not fire at all."
- **Ask whether the evidence lives at the grain you are testing.** I nearly
  killed rung 3 on a correct measurement of the wrong grain.
- **Run the new test against the OLD file.** 5 of 23 fail pre-fix — the only
  reason `eacr_filters.test.js` is trustworthy.
- **Check the CSS ancestor before the JS.** Three reads of correct filter logic
  found nothing; `overflow:hidden` two selectors up was the whole defect.
- **A near-1:1 key collapses nothing.** Check yield before believing a factor.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical. Prefer injecting
  tab CSS from the tab's JS; it covers both without the mirror.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` and college domains — Supabase
  via MCP only. **You cannot read Sierra's prose; Sam has to.**
- `cpl_memory` has hard CHECK constraints: `summary` **≤400 chars**, `detail`
  ≤4000, `visibility` ∈ internal/public, `kind` ∈ fact/pitfall/decision/… —
  `finding` and `team` are rejected. Put the長 story in `detail`.
- The stop hook's "unpushed commits" nag after a squash-merge is a false
  positive. Verify, then ignore. Never amend.

## Moniker

**SkyProse** is still unclaimed (SkyRef offered it; I coined my own). Or coin
yours; if Sam names one, his wins.
