---
title: Session 150 handoff (SkyTop → next) — the answer looked right; test the prose
created: 2026-08-13
updated: 2026-08-13
tags: [handoff, sierra, alignment, retrieval, false-absence, cr-reference]
related:
  - "[[docs/local_course_alignment_lessons]]"
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/session_149_handoff]]"
---

# You are Session 150

Session 149 was **SkyTop** — Sam's greeting named it. Two PRs (**#1161**,
**#1162**), three migrations, **cpl-chat v43 → v44 live**.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','alignment','retrieval','cr-reference','curation']
       or summary ilike '%credit_rec%')
order by event_date desc nulls last limit 40;
```

Then read, in order: `docs/local_course_alignment_lessons.md` (the 2026-08-13
SkyTop section) → CLAUDE.md §11 rows *Local course ↔ CR alignment*, *Sierra:
false absences*, and the new *Common CR Reference* → `docs/sierra_credit_recs_lessons.md`.

## 🎯 PRIORITY 1 — Sam is testing. Read what he sends; don't rebuild.

**Every defect this run came from Sam pasting a live answer**, not from reading
code. Both were invisible from either end: the RPC verified clean and the
renderer verified clean, and the loss was between them.

1. **The ironworker question is the open acceptance case.** Ask (or have Sam
   ask): *"I have a journey worker license as Iron and Steel worker. What CPL
   can I get here?"* against Cerritos on v44. The RPC returns all 13; **nobody
   has read her prose** — the sandbox is egress-blocked from `*.supabase.co`.
2. **Then POST × Cerritos.** All six C-ID matches should render. The flagged
   `AJ 110` line (one C-ID on two different recommendations) is the one most
   likely to need rewording.
3. **Two feedback rows are still unworked**: *"Wrong contact information for
   RCC"* and an up-rated **export/download** request. Sam had already triaged
   the backlog 25 → 5 himself — do not re-report it as 25.

## 📌 Decisions Sam made this run

- **A Common CR Reference is the next structural piece** — *"just as we have
  pretty well developed CER, CSR, and the beginnings of a CCR."*
- ⭐ **C-ID is ONE factor, not the key**: *"CID is only one factor in determining
  common CR references. Similar to the CCR, we take into account matching
  factors like title, course name and number, course description, subject,
  etc."* His list is **illustrative, not exhaustive** — ask before freezing it.
  Recorded verified + attributed as
  `cpl_memory` `common-cr-reference-is-multi-factor-not-cid-keyed`; Rule 8 says
  do not silently supersede a human-sourced row.
- **Show the closest match when there is none, unless obviously wrong** — asked
  for, built, and withdrawn on evidence (below). His *request* was right; the
  mechanism wasn't.

## ⚠️ Things that will mislead you

1. **Do NOT re-add the "closest match" fallback.** It proposed `AUTO 160
   Introduction to Automotive Electrical` for POST's *Introduction to Policing*.
   It is not a tuning failure: `picked` already returns the best row whenever
   **any** content token is shared, so a recommendation with no candidate is one
   where **nothing** shares a subject word — every candidate there is a spelling
   coincidence. Real empties now point at the peer courses instead.
2. **`peer_total` is load-bearing.** The RPC caps peers; the renderer must keep
   saying *"showing 9 of 261"*. A cap the consumer cannot see becomes a census.
3. **Don't pin prompt wording in a test.** Two assertions have now had to be
   rewritten in two sessions because they pinned a sentence rather than the
   guarantee. Guard the behaviour.
4. **`adoption_leverage` ≠ this question.** It means "teaches the same course
   IDENTITY". Cerritos is still absent from welding adoption there, correctly.
5. **`tests/cpl_funding.test.js` hangs** (pre-existing) so `node tests/run.js`
   can't finish; run suites individually. `npm install` first — jsdom isn't
   vendored. `college_briefing` is 227/228 on a clean tree.

## Carryover

- **The CR Reference itself** — scope it against the CCR's *actual* matching
  factors before building. Numbers to start from: 2,344 distinct `credit_rec`
  strings, only ~7% collapse under mechanical normalisation (so: curation, not
  string-cleaning); 402 carry a C-ID → 175 distinct C-IDs; `AJ 110` alone has
  **10 wordings**; the curated spine is 351 statewide lines / 134 credentials.
- 12 adoption-file statewide titles absent from `chatbox_credentials`.
- `chatbox_college_profiles` stale since 2026-06-25; corpus covers 59 of 123.
- From 146: the site-phrase **superset decision** still needs Sam; the identity
  crosswalk write to Supabase is still queued.
- The partner-crosswalk engine's **2nd run** is still outstanding.

## Patterns that worked

- **Ask for the live artefact.** Sam's pasted answer contained the bug; no
  amount of reading the RPC or the renderer would have found it, because both
  were individually correct.
- **Count by kind before trusting a union.** `select row_kind, count(*)` exposed
  3,807 vs 9 in one query.
- **Compare the group count to the authority's own count.** 43 vs 10 is a
  one-line assertion that would have caught the phantom groups on day one.
- **Build the thing they asked for, run it once, show them the output.** The
  `AUTO 160` row settled a design argument that no reasoning about thresholds
  would have settled.
- **Report a fix as narrower than it is only if it IS narrower.** The ironworker
  fix looked Cerritos-shaped; measuring showed 90% / 30% of the catalogue.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co`, college domains and
  `cpl-initiative.github.io` — Supabase via MCP only.
- Sam curates live; fresh-read before any bulk write.
- Migrations apply **immediately** — a SQL fix is live before its PR merges.
  Say so when reporting, and deploy cpl-chat separately for the TS half.
- `cpl-chat` deploy is `workflow_dispatch` + typed `DEPLOY`; verify the version
  bumped (`list_edge_functions`) and that `verify_jwt` stayed **false**.

## Moniker

**SkyProse** is offered — the run that finally reads what Sierra actually says.
Take it or coin your own; if Sam names one, his wins.
