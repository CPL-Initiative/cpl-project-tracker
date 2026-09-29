---
title: Session 124 handoff (SkyHero) — fix mode 7's proximity ranking, then the corpus
created: 2026-08-06
updated: 2026-08-07
tags: [handoff, sierra, cpl-assistant, retrieval, geography, student-data]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/kb-notes/playbook-deploy-an-edge-function-from-the-runner]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 124 — **SkyHero**

Sam named you. Previous session was **SkyHunter (123)**. The assistant is
**Sierra**; the workstream is the "CPL AI Sherpa."

## Read these first, in order

1. `docs/cpl_assistant_lessons.md` — the last two §SkyHunter sections.
2. `docs/kb-notes/methodology-assert-what-retrieval-returns.md` — why the CPR
   question broke twice, and the testing rule that came out of it.
3. `docs/kb-notes/playbook-deploy-an-edge-function-from-the-runner.md` — how
   deploys work now, and the five failure modes.
4. `chatbox/supabase_search_exhibits_by_topic_v2.sql` — schema of record.

## What SkyHunter shipped (all merged, all live)

- **#1016** — Sierra topic retrieval, five defects. **2 colleges → 5 at 100%
  precision.** `tests/sierra_topic_keywords.test.js` (60 checks).
- **#1017** — small-cell suppression that actually suppresses.
- **#1019/#1020/#1021** — runner-based deploy. **cpl-chat is v29 and the CPR
  fix is LIVE**, confirmed by smoke **mode 13** naming Modesto / Las Positas /
  Cypress / San Francisco / Cabrillo on the live function.

## 🎯 Priority 1 — mode 7: volume is outranking distance

**Sam queued this for you explicitly.** It is the one red assertion in the
smoke battery, and it is now a *different* bug from the one #1016 fixed.

Smoke mode 7 asks: *"Does Los Angeles Harbor College give credit for NCCER
carpentry or construction certifications?"* and asserts the answer names a
genuinely nearby college:

```
/El Camino|Long Beach|Trade.?Tech|Rio Hondo|Compton|Cerritos/
```

**Before the deploy** it answered with a **Dental Board certificate** at West
LA — the generic-term flooding defect. **That is gone.** The answer is now
honest ("I can't confirm from the data at hand") but names **Norco College**
as the nearby peer.

Norco is in Riverside County, ~50 miles from San Pedro. Here is why it wins:

| College | Exhibits in corpus | Actually near LA Harbor? |
|---|---|---|
| **Norco** | **107** | ✗ ~50 mi |
| LA Trade Tech | 45 | ✓ |
| Long Beach City | 7 | ✓ |
| Cerritos | 3 | ✓ |
| Rio Hondo | 2 | ✓ |

**Every genuinely adjacent college is in the corpus and loses to Norco on
volume.** Look at `searchCollegeOfferings()` and `fetchCollegeGeo()` in
`chatbox/supabase/functions/cpl-chat/index.ts`, plus the `college_geo` table
(region/county) and the `formatOfferingsContext` ordering — the "nearest
first when a home college is known" claim in that prompt block is not being
honoured when a distant college has more rows.

**Not a bug, do not chase it:** LA Harbor IS in `chatbox_college_profiles`
with `total_exhibits = 0`, so Sierra is correct that it has no exhibit list.

⚠️ Mode 7 asserts against **model-generated prose**, so it carries inherent
flake. Fix the ranking, but consider also asserting the *retrieved college
set* rather than the sentence — that is the lesson from
`methodology-assert-what-retrieval-returns`, and mode 7 is the last place in
the battery still doing it the old way.

## 🎯 Priority 2 — refresh the exhibit corpus

`chatbox_exhibits` holds **2,397 exhibits across 59 colleges**. MAP has
**123**. That gap is why Sierra finds 5 CPR colleges where the CER knows 7
(American River, LA Mission, West LA are simply absent).
`chatbox_college_profiles` was last refreshed **2026-06-25**.

Roadmap 3.2 scopes it: a committed regeneration from the daily MAP data, and
longer-term re-point the grain to the CER unified-title layer. ⚠️ Writes to a
**shared table feeding production Sierra** — walk Sam through blast radius
first.

## 🎯 Priority 3 — the student-detail aggregator

`StudentDetailCredits_080626_JSON.zip` (11.8 MB, Drive) was **never read** —
the Drive connector caps at 10 MB and cannot range-request. Either Sam splits
it (4 zips under ~4 MB; base64 inflates a third in transit) or — better —
**Malone's view name** goes into `fetch_custom_report.py` →
`funding/_build_cr_backlog.py`, which already parses this format.

Schema confirmed from a pasted sample (32 columns). Names and `StudentID` (an
**SSN** field) arrive **masked with X's, not blank**; `StudentMAPID` is not
masked. Agreed allowlist — 8 columns:

```
Location · CPL Mode · Credit Recommendation · College Course
ExhibitID · Source Code · CPLStatusPlan · salted-hash(StudentMAPID)
```

**Drop `Notes`** (free text, staff type anything, no analytical value). Drop
`Program`, `ProgramGoal`, `Catalog Year`, `Transfer Destination` as
quasi-identifiers. Sam wants the suppression threshold at **<10**; the builder
uses 5 — one line, his call.

⭐ **Sam's military insight holds.** Allan Hancock, ACE exhibit
`AR-0701-0013`, *"1 hour in Basic Life Support…"*, `College Course` blank,
`Needs Action` — and Allan Hancock is nowhere in the CER's CPR list. The file
separates two lists: `College Course` **filled** + Source `MAP` + Applied =
already articulated (the adoption list); **blank** + `ACE` + Needs Action =
recommended, never articulated (unmet demand).

## Carryover

- **`cpl_funding_cr_backlog.js`** untracked in the tree — funding lane's build
  output from #1014, unconsumed, regenerable. Left alone deliberately.
- A privacy/disclosure review workflow was lost to a container restart; the
  allowlist above stands on its own.
- **Sierra Phase 1 guardrails still unbuilt** — durable rate limit, daily cost
  breaker, CORS hygiene, usage digest. Still Malone's stated priority. See
  `docs/sierra_vendor_lane_handoff.md`.
- Sam's three parked decisions remain parked: fail-closed contacts flip, RAG
  corpus re-point, staging slug.

## Patterns that worked

- **Measure before theorising.** Every claim came from a live query —
  `to_tsquery` parses, document frequencies, `word_similarity` scores. The
  `aed` → `'a':*` root cause took one SELECT.
- **Take the user's phrasings as test cases.** Sam's asides ("nursing", "fire
  fighter", "cardiopulminary") each found a real bug. He is the domain expert
  *and* a representative user.
- **Write the test before you believe the fix.** It went red on a bug nobody
  had asked about.
- **Diagnose a failure before treating it as yours** — and equally, **own it
  fast when it is yours.** Of five deploy failures, one was Sam's, one was
  GitHub's, one was an absent secret, and one was my working directory.
- **Say what a 403 means.** 401 = bad token; 403 = accepted credential,
  refused identity. Converting that ambiguity into a workflow check saved
  another round of guessing.

## Safety patterns to honour

- **Deploys go through `.github/workflows/cpl-chat-deploy.yml`** — dispatch
  with `confirm: DEPLOY`. Never hand-transcribe the function again.
- **`--no-verify-jwt` is pinned in that workflow.** Do not remove it; v25
  shipped `verify_jwt: true` for ~40 minutes and 401'd the widget.
- **Every deploy and every `sierra_guidance` row hits production.** No staging
  tier (roadmap 6.4 proposes one).
- The sandbox **cannot reach `*.supabase.co`** — Supabase via MCP only; smoke
  runs on the runner.
- **Poll CI via the MCP github tools, not curl.** `actions_list` overflows —
  parse the saved file with python.
- **Adding a parameter to a Postgres function creates an OVERLOAD.** Drop the
  superseded signature or PostgREST calls fail `42725`.
- Never widen `sierra_guidance` / feedback / contacts gates toward anon.

## Rollback

`git show a7c093c:chatbox/supabase/functions/cpl-chat/index.ts` → commit →
dispatch the deploy workflow. Because the runner ships from git, rollback is
an ordinary revert now, not a second hand-transcription.

## Moniker

You are **SkyHero** — Sam's pick. (Taken already: SkySherpa S90→91,
SkyRecall was retired in favor of SkyHunter for 123.)
