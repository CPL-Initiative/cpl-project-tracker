---
title: Session 138 handoff (SkyLine → next) — the student re-load is done; CRED·ADOPT is next
created: 2026-08-10
updated: 2026-08-10
tags: [handoff, sierra, student-detail, credentials, routing, privacy, metrics]
related:
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/map_student_credit_reload]]"
  - "[[docs/kb-notes/methodology-a-grain-invariant-measure-can-still-be-the-wrong-one]]"
  - "[[docs/kb-notes/reference-batch-uploaded-transcribed-credit]]"
  - "[[docs/session_137_handoff]]"
superseded: true
superseded_by: session_139_handoff.md
---

# You are Session 138

Session 137 ran as **SkyLine** (continued from 134). Sam was live throughout and
made **four explicit calls** — recorded below as decisions, not suggestions.

⚠️ **A second session ran 2026-08-10 on the CAC apprenticeship deck** — see
`docs/session_136_handoff.md`. Neither supersedes the other.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','student-detail'] or summary ilike '%credential%')
order by event_date desc nulls last limit 40;
```

Session 134 wrote 8 rows and queried it **zero** times, re-deriving three settled
facts. 137 queried it first and immediately found two rows needing supersession.
Do the same.

## 🎯 PRIORITY 1 — CRED·ADOPT (Sam: *"we'll pick up the adopt in new session"*)

*"Which colleges already articulate X? I'm thinking of adopting it."* **Needs no
new data** — `adopter_colleges` and `potential_colleges` are already in
`chatbox_credentials`, disjoint and tested. Then **COLLEGE·CRED**, carrying Sam's
verbatim language:

> *"I recommend you go to the Mt. SAC CPL Landing Page and use the Request Review
> button to submit a request for the college to consider approving POST credit.
> You may also visit CreditforBeingYou.org and create a CPL portfolio to see all
> options statewide."*

⭐ That dissolves the poaching tension — route the seeker to **their own
college's** Request Review, not a rival.

Per route: write the contract → answer POST **and a second credential** by hand
from live data (Real Estate is the honest control) → **commit the assertion
before touching prompt text.**

## ✅ What shipped this run — the `map_student_credit` re-load

`map_student_credit` is now **537,908 rows / 16 columns**, re-loaded from
`TblSOURCE`, live, reviewer-only RLS, 0 write policies. Prior 5-column table
retained as `map_student_credit_prev` (rollback = rename the two back).

**CRED·VOLUME is unblocked.** Students served **42,346** · applied **18,889** ·
transcribed **13,412** · apprenticeship **309 students / 12 colleges / 6,617.80
units**.

Also live: **`map_applied_zero_units`** — the follow-up worklist Sam asked for
(reviewer-only, `security_invoker = true`, anon revoked).

## Sam's four calls (rulings)

1. **Swap the re-load in, and rebuild both aggregates.** Done and verified.
2. **Publish BOTH applied measures and name the gap** — never resolve it silently.
3. **Keep the rows-based Goal 2 share** (he asked to see the 43 colleges first,
   and the data overturned my recommendation — see below).
4. **Colleges batch-upload already-transcribed credit** (AP/IB/CLEP/Credit-by-Exam);
   *"SDCCD was the first to do this for thousands of students."* Curator
   knowledge — it is why transcribed is not comparable across colleges.

## ⚠️ Three things that will mislead you if you skip them

**1. The two "applied" measures disagree by 55%.** `applied_credits > 0` = 18,889
students; `cpl_status_plan = 'Applied to CPL Plan'` = **29,292**. The gap is
**24,885 rows marked applied with ZERO applied units**, and **24,561 of them have
articulated credit behind them** — 12,375 students, 32 colleges. Publish both.

**2. Never rank on transcribed credit.** It exists at only **24 of 111 colleges**,
because only some batch-upload. Signature: ~1 row/student across few exhibits
(SDCCD 1.05–1.18; Merced 1.58) vs individual review at 3–5 rows/student across
*hundreds* of exhibits (Modesto 207, Norco 140).

**3. The Studio CSV importer duplicates — measured three times** (0.9% / 1.5% /
1.05%). **Re-importing does not fix it.** The gate is `distinct source_row_id`
and `payload_conflicts = 0`, never `count(*)`. All 5,671 dupes were byte-identical
so the dedupe was lossless. Runbook updated: `docs/map_student_credit_reload.md`.

## ⭐ The finding worth carrying forward

I recommended re-basing the Goal 2 COURSE share on **distinct students**, because
it is provably grain-invariant (96 of 96 colleges unchanged). Sam asked to see the
affected colleges first. **The data killed it: that measure saturates at exactly
100.0% for 34 of 96 colleges.**

**Grain-invariance is a property, not a virtue.** A measure that cannot move is not
thereby a good measure — check it still *discriminates*.
`methodology-a-grain-invariant-measure-can-still-be-the-wrong-one`.

The rows-based share is kept. Its movement (43 of 96 colleges, **38 of them up**)
is a **correction**: the old export collapsed rows sharing (student, college,
exhibit, course_type, catalog_year), so an exhibit recommending several specific
*courses* became one row while a single *area* award did not. The one to know
about is **San Diego City College, −15.7 points at 4,252 students**.

## ⚠️ And one documented "fact" that was half artefact

**`Default Area` does not exist in the raw extract** — 0 rows. The prior load
synthesised it for 18,127 null-exhibit rows. `Default Credit` is genuine (24,556).
So "32,360 `Default *` sentinels" was part MAP, part invention. Same family as the
`dropped at load` error corrected the same day: **a load-time transformation
becomes, one document later, a stated fact about MAP.**

## Patterns that worked

- **Gate on identity, not on count.** `source_row_id` is what made a duplicated
  import recoverable instead of a re-do.
- **License a swap with a set identity.** `(college_id, student_key, course_type)`
  identical old-vs-new *predicted* that no published figure could move; the rebuild
  then confirmed 0 diffs. Predict, then verify.
- **Check a striking number can vary.** "0.0% transcribed across every college in
  the worklist" was a **tautology** (`transcribed > applied` never occurs). Caught
  after reporting it once.
- **Present evidence with a recommendation.** Sam's "show me the 43 colleges"
  is what caught my wrong call before it shipped.

## Safety patterns to honour

- Aggregates only; never route per-student rows through a session's context.
- **`StudentMAPID` must never reach Supabase.** The proof is density
  (`student_key` 1…42,346, 42,346 distinct), not the range check — MAP ids start
  at 39,026, so a `> 50000` tripwire alone would miss a leak.
- A **view over a reviewer-only table needs `security_invoker = true`**, or it runs
  as owner and silently bypasses RLS.
- Sandbox cannot reach `*.supabase.co` (MCP only) or college domains.
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- Deploy `cpl-chat` from the runner only (`--no-verify-jwt` is pinned there).
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.
- ⚠️ `actions_list` / `actions_get` return enormous payloads; use
  `list_edge_functions` + `get_logs`.

## Carryover

| # | Item | State |
|---|---|---|
| 1 | **CRED·ADOPT**, then COLLEGE·CRED | **next** |
| 2 | `stg_student_credit` + `map_student_credit_prev` still present (both RLS-safe) — drop once the 🎓 tab is eyeballed | deliberate |
| 3 | College Briefing rework — steps vs rationale, 4 small changes, ~1 hr | proposed, not built |
| 4 | **L3 credential families don't exist** — grow from `kb/occupation_credential_map.json` | blocks SEEKER·ROUTE |
| 5 | `docs/INDEX.md` 4.46× budget, `roadmap_archive.md` 2.37× | lint, untouched |
| 6 | 6 real Sierra feedback rows untriaged | from S135 |
| 7 | Nightly refresh of the student grain still manual | runbook is the procedure |

## Moniker

**SkyRoute** — one route live, eight to go, and the data under them is finally
complete.
