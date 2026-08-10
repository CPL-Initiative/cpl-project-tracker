---
title: Session 137 handoff (SkyLine → next) — Sierra names credentials; the corpus now retires
created: 2026-08-10
updated: 2026-08-10
tags: [handoff, sierra, credentials, routing, privacy, corpus, checkpoint]
related:
  - "[[docs/sierra_credential_naming_lessons]]"
  - "[[docs/map_student_credit_reload]]"
  - "[[docs/session_136_handoff]]"
  - "[[docs/kb-notes/methodology-lead-with-the-steps-not-the-rationale]]"
---

# You are Session 137

⚠️ **TWO SESSIONS RAN 2026-08-10 IN PARALLEL. READ BOTH HANDOFFS.**
**136 = SkyDeck**, the CAC apprenticeship deck (13 Aug, two unreconciled unit
totals still open with colleges). **This one = SkyLine**, Sierra + the corpus.
Neither supersedes the other; the numbering forked because we checkpointed
independently.

## ⚠️ FIRST — read the memory table. This is now Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','student-detail'] or summary ilike '%credential%')
order by event_date desc nulls last limit 40;
```

**This session re-derived three settled facts while the answers sat in that table
unread** — it wrote 8 rows and queried it zero times. 182 rows, 174 predating
today, 85 verified. Do not repeat that.

## Read in this order

1. This file, then `docs/session_136_handoff.md`.
2. `docs/sierra_credential_naming_lessons.md` § 2026-08-10 — includes a
   correction I had to make to my own work the same day.
3. `kb/supabase_chatbox_credentials.sql` — the route contract, reasoning in
   comments.
4. `docs/map_student_credit_reload.md` — if Sam's export has landed.

## ✅ What shipped — 13 PRs, #1091–#1102

| | |
|---|---|
| **k=10 suppression** | one floor on every public surface; the mask is derived from an emitted value, not hard-coded |
| **1,987 credentials live** | `chatbox_credentials`, 0 suppressed counts leaked |
| **Route CRED·STD** | built, probed, wired, **deployed as cpl-chat v37** |
| **Reload runbook** | `docs/map_student_credit_reload.md` — 9 steps, 2 gates, privacy tripwire |
| **The corpus retires** | new lint rule + Rule 8 read step + retirement rule |

**v37 verified healthy**: every request 200 across two smoke runs, 1.7–5.0s, no
boot failure. The smoke *assertions* live in the Actions log — `sierra_feedback`'s
CI rows are `q`/`a` placeholders and cannot tell you whether a run passed. Close
that when you add the CRED·STD assertion.

## 🎯 PRIORITY 1 — CRED·ADOPT

*"Which colleges already articulate X? I'm thinking of adopting it."* Needs **no
new data**: `adopter_colleges` and `potential_colleges` are in the table, disjoint,
and tested. Then **COLLEGE·CRED**, which carries Sam's verbatim language:

> *"I recommend you go to the Mt. SAC CPL Landing Page and use the Request Review
> button to submit a request for the college to consider approving POST credit.
> You may also visit CreditforBeingYou.org and create a CPL portfolio to see all
> options statewide."*

⭐ That dissolves the poaching tension — route the seeker to **their own college's**
Request Review, not to a rival.

Per route: write the contract → answer POST **and a second credential** by hand
from live data (Real Estate is the honest control) → **commit the assertion before
touching prompt text.**

## Sam's decisions this run (these are rulings, not suggestions)

1. **k=10** wherever a public surface can reach a headcount. Suppress the **cell**,
   compute **totals from actuals**, publish the total when it clears the floor.
2. **"Students served" = distinct student records in MAP**, regardless of anything
   else. Applied/transcribed are the `>0` splits.
3. **The widget is on COBI only** — not embedded on college landing sites. He has
   now said this twice; `CLAUDE.md` asserted the opposite until this session.
4. **`TblSOURCE.Student` is a grouping counter**, not a person. The key is the
   `tblStudentKey` surrogate for `StudentMAPID`, which must never reach Supabase.

## ⚠️ Open, and both are Sam's

1. **The three-line Access query** (in `docs/map_student_credit_reload.md`) that
   settles whether 42,346 counts people or MAP records.
2. **The export itself** — from the query that already emits `student_key`,
   extended with the credit columns + `CPLStatusPlan` + `ApprenticeshipCredits`.

⭐ **`ApprenticeshipCredits` is the only way to measure apprenticeship CPL** — MAP
has no `Apprenticeship` cpl_type, so a type filter returns 0 and reads as *"we do
none."* Tell SkyDeck's successor if the CAC deck touches that number.

## Also proposed, not built

**The College Briefing rework.** It opens with "Start here", then prints all 22
strategies at equal weight when only 3 are measurable, shows "50% of the pot"
(state allocation logic a coordinator cannot act on), and closes by explaining
where its config lives. Four small changes in
`methodology-lead-with-the-steps-not-the-rationale`. ~1 hour.

## Patterns that worked

- **Probe with real phrasings, then verify the probe.** Three ranking decisions
  were wrong and only testing found them. A *fourth* apparent defect was an
  artefact of my own `string_agg` — the function was right. Verify the probe
  before fixing what it accuses.
- **Measure the constant.** The tier-4 floor is 0.25 because 0.098 and
  0.727/0.711 leave open space there.
- **Positive controls.** Every guard this session was verified by reintroducing
  the defect and watching it go red.
- **Check the repo first.** Four times the answer was already there.

## Safety patterns to honour

- Aggregates only; never route per-student rows through a session's context.
- Sandbox cannot reach `*.supabase.co` (MCP only) or college domains.
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- Deploy `cpl-chat` from the runner only (`--no-verify-jwt` is pinned there).
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.
- ⚠️ `actions_list` / `actions_get` return enormous payloads. Poll
  `list_edge_functions` for deploy state and `get_logs` for health instead.

## Moniker

**SkyRoute** — you are picking up a route map with one route live and eight to go.
