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

## 🎯 PRIORITY 1 — wire EACR's prescriptive layer (Sam's catch)

Sam: *"You might notice that Sierra would need to be wired to EACR, CER, etc. on
COBI…"* **CER is already in** — `chatbox_credentials` was synced from
`credential_reference_data.js`, which is why the CompTIA records exist. **EACR is
not.**

`statewide_prescriptive.js` (`window.CPL_STATEWIDE_PRESCRIPTIVE`, keyed by
`unified_title`) holds, per credential, **the colleges that could adopt it + the
likely local course each already teaches**. That is strictly richer than the
`potential_colleges` answer COLLEGE·ADOPT gives today: it turns *"adopt CompTIA
A+"* into *"adopt it against CIS-25, which you already run."* Sync it the way
`kb/_sync_credential_catalog.py` syncs the catalogue.

## 🎯 PRIORITY 2 — build the College tab, after Sam reacts

Design published as an artifact and **updated twice on his direction**; he has
NOT signed off. Real Bakersfield data throughout. Shape: college/district picker →
Sierra ask box → "Where you stand" (every figure a fraction, never a bare %) →
"Start here" (3 steps, each with a done state) → CPL-type boxes (expandable, each
with *how funding is achieved with that population*) → student-request box →
coverage/FERPA footer.

⚠️ **Do not build it before he reacts** — he asked to see designs first, twice.

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
| 1 | **EACR `statewide_prescriptive.js` → Supabase** | **next** |
| 2 | College tab build | awaiting Sam's reaction to the design |
| 3 | Course Credit tab still leads with the saturating 100% | diagnosed, not rebuilt |
| 4 | Student CPL request uploads box | designed, needs a portal feed |
| 5 | COLLEGE·CRED (Mt. SAC Request-Review language) | queued |
| 6 | k=10 revisit — breadth vs volume | Sam flagged, measured |
| 7 | 6 real Sierra feedback rows untriaged | from S135 |
| 8 | `docs/INDEX.md` 4.5× budget, `roadmap_archive.md` 2.4× | lint, untouched |

## Moniker

**SkyBridge** — the bridge from student rows to credential names exists now;
the next one runs from EACR to the answer a college can act on.
