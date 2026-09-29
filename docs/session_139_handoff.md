---
title: Session 139 handoff (SkyRoute → next) — Sierra answers per-credential student questions; the College tab design awaits Sam
created: 2026-08-11
updated: 2026-08-11
tags: [handoff, sierra, credentials, student-detail, privacy, college-tab, ferpa]
related:
  - "[[docs/sierra_credential_naming_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/methodology-publish-the-denominator-with-the-number]]"
  - "[[docs/session_138_handoff]]"
superseded: true
superseded_by: session_144_handoff.md
---

# You are Session 139

Session 138 ran as **SkyRoute**. Sam was live throughout and made **six explicit
calls** — recorded below as decisions, not suggestions.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','student-detail','privacy'] or summary ilike '%credential%')
order by event_date desc nulls last limit 40;
```

## 🎯 PRIORITY 1 — finish the My College tab

Four sections built and merged; **four remain**, and Sam explicitly deferred them
to you (2026-08-11: *"We'll pick up those remaining threads in the next
session"*).

| Thread | State |
|---|---|
| **Ask Sierra about \<college\>** | not built — decide embed vs deep-link to the CPL Assistant tab |
| **Funding box** ($50k ESS 25-82 · $35M share) | not built — `cpl_funding_data.js` is **not loaded** on the page; lazy-load it. Bakersfield models ≈ **$426K** from 46,171 headcount (1.83% of the $23.24M pool) — but resolve the **$150K floor waterfall**, don't ship my flat proportional number |
| **District picker** | not built — needs a district→colleges map; `cpl_funding_data.js` carries `district` per college |
| **Student CPL request uploads** | designed, **blocked** — no portal feed exists in Supabase |

⭐ **Design is locked and Sam reacted to it twice.** Mock:
`https://claude.ai/code/artifact/8788b96a-b67b-4844-b7b9-4b7e5bce6b22` —
expandable boxes, per-population funding detail, averages in the header.

⚠️ **Two averages, 2.2× apart, must both appear** (Bakersfield: 4.78 units across
all 582 CPL students, **10.62 among the 262 who actually received credit**).
Quoting one alone misleads in opposite directions.

## 🎯 PRIORITY 2 — Malone's dataset spec is waiting on him

`docs/map_dataset_spec_for_malone.md` (branch `claude/malone-dataset-spec`, PR
open). Nothing blocks him. **Three things to expect back:**

1. **Q2's four-row result** — how much CPL activity arrives via landing pages /
   Student Portal. This decides whether two live filters stay.
2. **Q3 reconciliation** against the live figures (204,714 / 1,285,289.35 /
   112,950.75). A mismatch means the extract changed.
3. One sentence on **`TblSTU_EXH_BUNDLE`** — it appears in no runbook we hold.

⚠️ **`source_row_id` is an Access autonumber, not a stable MAP id** — `1…537,908`
with **zero gaps**. If `TblSOURCE` is re-imported it renumbers, and an append
would misalign silently while succeeding on all 537,908 rows. Gate **A4b** (the
`chk_` columns) is the compensating control. **Worth asking MAP for a durable row
id** — same exposure applies to `tblStudentKey.StudentKey`.

## 🎯 PRIORITY 3 — EACR's prescriptive layer → Supabase

Sam's catch, still unbuilt. `statewide_prescriptive.js` knows *the likely local
course each college already teaches*, turning "adopt CompTIA A+" into "adopt it
against CIS-25, which you already run." Sync it the way
`kb/_sync_credential_catalog.py` syncs the catalog. **CER is already in**;
EACR is not.

## ✅ What shipped — #1113, Sierra **v38** live

Routes **CRED·VOLUME** ("how many students, which certs") and **COLLEGE·ADOPT**
("what could my college pick up"). Three materialized views + two RPCs, live.

| | |
|---|---|
| CompTIA A+ | 115 students / 7 of 21 colleges |
| CompTIA Security+ | 57 / 6 of 17 |
| POST Basic Academy | 27 / 10 of 32 |
| Adoption opportunities | 120 colleges, avg 126 each |

## Sam's six calls (rulings)

1. **Floor + coverage, always** — never a bare per-credential count.
2. **CPL-type boxes map to MAP's real six**; Apprenticeship comes from
   `apprenticeship_credits`, NOT a type (none exists — a filter returns 0 and
   reads as "we do none"). Noncredit has no source yet.
3. **"Fewer than 10", not silence** — a bounded range confirms activity exists
   and stays FERPA-safe; explain the protection if asked.
4. **Revisit k=10 later** — measured for him: hides **320 of 436 credentials but
   only 5.1% of students / 5.4% of units.** The price is breadth, not volume.
5. **The 100% on the Course Credit tab is unhelpful** — *"makes me think I can
   check the box and be done."*
6. **Show the design before publishing.**

## ⚠️ Four things that will mislead you if you skip them

**1. I shipped a disclosure leak and only the checkpoint caught it.** Row-level
suppression passed its assertion the whole time while units summed:
`statewide − Σ(published siblings)` recovered a lone hidden cell **exactly** (AP
Chemistry 755.00 − 695.00 = **60.00**; 12+ credentials). ADR decision 5 had
required complementary suppression two days earlier. **A suppression test must
model the ATTACK, not the field.** Fixed with 16 complement cells; **both
assertions are in the committed SQL — run them after any refresh.**

**2. Retrieval was never broken.** The transcript looked like a search failure.
`search_statewide_recommendations('comptia')` returned the right rows all along.
Probe the function before you tune it.

**3. Nameability is 4.2%, not 6.1%.** 22,606 of 537,908 rows, 436 credentials at
36 colleges. Bakersfield: **57 nameable students of 582**, so a bare "2" for
Credit by Exam is a visibility artefact. `students_suppressed=true` and
`colleges_with_student_data=0` mean opposite things.

**4. The smoke test validates the version it replaces.** It auto-triggers on
push; the deploy is a manual dispatch. The green run at 23:35 tested v37 while
v38 landed at 23:47. **After any deploy, dispatch the smoke test and check its
timestamp against the function's `updated_at`.**

## Patterns that worked

- **Probe the accused component first.** One query saved a rewrite of a correct
  function.
- **Re-read the ADR at checkpoint.** That is the only reason the subtraction leak
  was found — it was live, and green.
- **Confirm an inherited failure is inherited.** Two CI checks were already red
  on `main`; running them against the merge base settled it in one command.
- **Show real data in a mock-up.** Every number in the design is live, which is
  what surfaced the 2.2× gap between the two "average applied" figures.

## Safety patterns to honour

- Aggregates only; never route per-student rows through a session's context.
- **`StudentMAPID` must never reach Supabase.**
- A **view** over a reviewer-only table needs `security_invoker = true`; a
  **materialized view cannot carry RLS at all**, so the grant IS the access
  control and the MV must contain no unsuppressed small cell.
- Sandbox cannot reach `*.supabase.co` (MCP only) or college domains.
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- **Deploy `cpl-chat` only via `cpl-chat-deploy.yml`** (`workflow_dispatch`,
  input `confirm: DEPLOY`). Merging does **not** deploy.
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.
- ⚠️ `actions_list` / `get_job_logs` return enormous payloads; parse the saved
  tool-result file with python, never inline.

## Carryover

| # | Item | State |
|---|---|---|
| 1 | **My College tab** — Sierra ask · funding box · district picker · student-requests | 4 of 8 sections built; Sam deferred the rest |
| 2 | **EACR `statewide_prescriptive.js` → Supabase** | Sam's catch, unbuilt |
| 3 | Malone's Q2 / Q3 / `TblSTU_EXH_BUNDLE` answers | waiting on him |
| 4 | Ask MAP for a **durable row id** (`TblSOURCE.ID` is an Access autonumber) | raised, not asked |
| 5 | COLLEGE·CRED (Mt. SAC Request-Review language) | queued |
| 6 | k=10 revisit — breadth vs volume | Sam flagged, measured |
| 7 | 6 real Sierra feedback rows untriaged | from S135 |
| 8 | `docs/INDEX.md` 4.5× budget, `roadmap_archive.md` 2.4× | lint, untouched |

## ⚠️ One thing about the My College tab you must not undo

`courseShare()` carries the suppression logic **absorbed from the deleted
`college_goal2.js`**: a rate is published ONLY when every goal-2 cell is visible,
because publishing a share beside a hidden cell hands back exactly what
suppression removed (any two of {total, part, rate} give the third). Its
assertions moved into `college_briefing.test.js` — **49 checks, do not let that
count fall.**

Also: the "pot share is not rendered" guard **strips comments before matching**,
because the file explains *why* the pot share was removed and that explanation
necessarily contains the phrase. Match the code, not the prose — otherwise the
guard is unfixable without deleting the explanation.

## Moniker

**SkyBridge** — the bridge from student rows to credential names exists; the next
runs from EACR to something a college can act on.
