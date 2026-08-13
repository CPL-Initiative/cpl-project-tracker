---
title: Session 148 handoff (SkyPeak → next) — the data is published, Sierra still can't read it
created: 2026-08-13
updated: 2026-08-13
tags: [handoff, sierra, credit-recommendations, retrieval, statewide, false-absence]
related:
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/sierra_training_tab_scope]]"
  - "[[docs/kb-notes/methodology-a-summary-field-is-not-the-record]]"
  - "[[docs/session_147_handoff]]"
---

# You are Session 148

Session 147 was **SkyPeak** — Sam named it. Three PRs (**#1146**, **#1147**,
**#1148**), two migrations, 2,205 rows published, 42 live corrections.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','statewide','credit-recommendations','retrieval']
       or summary ilike '%credit rec%')
order by event_date desc nulls last limit 40;
```

Then read, in order: `docs/sierra_credit_recs_lessons.md` → CLAUDE.md §11 (the two
Sierra rows, both rewritten this run) → `docs/sierra_training_tab_scope.md`.

## 🎯 PRIORITY 1 — Sierra's answers have NOT changed. One PR fixes that.

Everything this run produced is **published but unread**. `cpl-chat` does not touch
the new table, so ask Sierra about POST today and she still names **one** course.
Do not start anything else first.

One PR + one `cpl-chat` deploy:

1. **Wire `cpl-chat` to `chatbox_credential_recs`** (2,205 rows, live). Branch on
   `rec_kind` — **Sam's rule**: statewide exhibit exists → quote the **statewide set
   ONLY**, largely ignore local variants; no statewide → the **most common** local
   recs with the college count behind each. Never both. **Lead with the LIST, never
   a count** (see AJ 110 below).
2. **Fix the Cerritos false absence.** `search_exhibits_by_topic_v2(['iron',
   'worker','ironworker'], 'Cerritos College')` returns **0** because the corpus
   stores `FIW Orientation` / `IW- Mixed Base`, while `chatbox_credentials` holds
   **16** Cerritos credentials, **11** named `Ironworker Apprenticeship — …`. The
   college-scoped route must consult the curated layer. Also:
   `search_credentials_any` searches `unified_title` + `raw_variants` **only** —
   never `issuer`, never `search_text` — and the **plural returns 0**
   (`ironworker`→25, `ironworkers`→0).
3. **Flip `college_adoption_opportunities`.** It orders by
   `cardinality(adopter_colleges) DESC`, so a zero-adopter exhibit sorts **last** —
   backwards from Sam's ruling below.

## 📌 Decisions Sam made this run — honour these

- **Statewide beats local, and local variation is noise.** *"When there is a
  statewide exhibit as there is for POST, it should only reference the credit
  recommendations from the statewide and largely ignore the local versions. When
  there is no statewide, it should give the most common credit recommendations from
  a selection of the colleges. They don't need to see all the variations."*
- **Unadopted exhibits are DELIBERATE and must stay prominent.** *"Sometimes there
  are exhibits created (statewide and local) that have not yet been adopted… we
  create them before the student arrives to make them available to the colleges for
  adoption. I wouldn't want them excluded because of that. In fact, we want them to
  be prominent choices for adoption."* Zero adopters is **never** a filter, a
  quality signal, or a reason to rank last.
- **AJ 110 is not necessarily an error.** *"AJ 110 may be C-ID and it is
  Elective… maybe where the confusion lies."* POST = 10 recs, 9 C-ID lines, 8
  distinct. Both counts ship; the repeat is flagged, never auto-resolved.
- **No new dataset was needed** — he offered one; `statewide_data.js` already
  splits statewide vs local exactly as he described.

## What shipped

- **#1146** — Sierra Training: ✏️ **Edit** a saved instruction in place, with a
  test-question box and **💾 Save & ask Sierra →**. RLS already allowed it. Guards:
  an RLS-filtered PATCH returns `200` + **empty body** and is treated as a
  **failure** with the text kept; it refuses to hop on an **unsaved** edit; the
  editor persists in `sessionStorage` across the trip to `#chatbot`.
  `tests/sierra_guidance_edit.test.js` — 26 checks.
- **#1147/#1148** — `chatbox_credential_recs` **LIVE: 2,205 rows** (134 statewide /
  351 lines, 2,071 local / 3,357), on the nightly `credential-catalog-sync`.
  `kb/_build_credential_recs.py` **reuses** `fact-sheet/_build_statewide_recs.py`
  so Sierra cannot drift from the public Fact Sheet.
- **Statewide flag fixed** — synced from the CER (84) instead of the adoption file
  (137); **42 credentials read as local**, Paramedic License among them. Sync now
  unions both: **126, up from 84**.

## ⚠️ Four things that will mislead you

1. **A half-loaded table looks populated.** The first dispatch died at batch 9 of
   12 (`PGRST102 "All object keys must match"`) leaving 1,600 of 2,205 rows.
   Cause: `cid_repeats` emitted only when present, and **one row of 2,205** has it.
   Fixed both in the builder and via `normalize_keys()`. **Always assert
   `count(*)` against the dry run after a bulk load.**
2. **`tests/cpl_funding.test.js` hangs** — 4+ min, no output, so `node tests/run.js`
   cannot finish in this sandbox. **Pre-existing**: byte-identical to the
   pre-session commit. Verify your own surface file-by-file instead.
3. **The full suite is not the gate.** `js-tests.yml` is non-required and did not
   run on any of the three merge commits.
4. **EACR is not in Supabase.** `statewide_prescriptive.js` (739 credentials,
   per-college courses) is browser-only. CER is in Supabase only as a *subset*
   (`chatbox_credentials`). See `cpl_memory` →
   `which-datasets-sierra-can-actually-read`.

## Carryover

- 25-row Sierra feedback backlog, **still** never triaged (oldest 1 July).
- Exhibit corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale
  since 2026-06-25.
- 12 titles statewide in the adoption file but **absent from
  `chatbox_credentials`** entirely.
- From 146: the site-phrase **superset decision** still needs Sam; the identity
  crosswalk write to Supabase is still queued.

## Patterns that worked

- **Ask whether the data already exists before building.** Sam offered a new
  dataset; the answer was that `statewide_data.js` already had it, correctly split.
  That turned a build into a publish.
- **Reuse the existing builder.** Importing `fact-sheet/_build_statewide_recs.py`
  rather than reimplementing it is what guarantees Sierra and the Fact Sheet agree.
- **Believe the human's repeated report.** Sam had flagged EMT/Paramedic several
  times; the repetition was the finding.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` and `index.html` byte-identical.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co`, college domains and
  `cpl-initiative.github.io` — Supabase via MCP; big loads go through the runner.
- Sam curates live; fresh-read before any bulk write.

## Moniker

**SkyBridge** is offered — the next run carries the published data across into what
Sierra actually says. Take it or coin your own; if Sam names one, his wins.
