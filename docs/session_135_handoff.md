---
title: Session 135 handoff (SkyLine → next) — the naming layer was already built; wire CRED·STD into cpl-chat
created: 2026-08-10
updated: 2026-08-10
tags: [handoff, sierra, retrieval, credentials, naming, routing, privacy]
related:
  - "[[docs/sierra_credential_naming_lessons]]"
  - "[[docs/kb-notes/methodology-a-concatenated-haystack-penalises-your-best-record]]"
  - "[[docs/kb-notes/methodology-emit-the-threshold-with-the-label-it-prints]]"
  - "[[docs/college_action_page_lessons]]"
superseded: true
superseded_by: session_137_handoff.md
---

# You are Session 135

Session 134 ran as **SkyLine** (Sam named it at greeting). Four PRs merged,
#1091–#1094. Sam was live in the session throughout and made three explicit
calls — they are recorded below and are **decisions, not suggestions**.

⚠️ A second session was started for an **apprenticeship PPT** around 15:00 UTC.
Check `main` before assuming anything here is the latest.

## Read first, in order

1. This file.
2. `docs/sierra_credential_naming_lessons.md` § 2026-08-10 — the story, including
   both premises that turned out wrong.
3. `docs/kb-notes/methodology-a-concatenated-haystack-penalises-your-best-record.md`
   — **before you touch any ranking code.**
4. `kb/supabase_chatbox_credentials.sql` — the route contract, with the reasoning
   for each decision in comments.

## 🎯 PRIORITY 1 — wire CRED·STD into `cpl-chat`

Everything below it is built, probed and committed. **Nothing is user-visible
yet.** The remaining work is: call `search_statewide_recommendations()` from the
edge function, add the answer skeleton, and commit the route assertion.

The two functions are live in Supabase and version-controlled:

```sql
search_statewide_recommendations(asked, limit)  -- statewide only; 0 rows = none exist
search_credentials_any(asked, limit)            -- the honest fallback
```

Verified live: `post` → POST Basic Academy · `peace officer` → POST (not
Correctional Officer) · `police academy certificate` → POST **with no "POST" in
the ask** · `real estate salesperson` → CA Real Estate Salesperson License ·
`cpr` → **none**, fallback names *First Aid, CPR & AED [local only]* ·
`basket weaving` → none → not in catalog.

⚠️ **Deploying `cpl-chat` reaches production with no staging tier.** Deploy from
the runner (`cpl-chat-deploy.yml`), never by hand — `--no-verify-jwt` is pinned
there and forgetting it breaks the v25 invariant.

## ✅ What shipped

| PR | What |
|---|---|
| #1091 | Suppression floor **k=5 → 10**; mask now derived from an emitted value |
| #1092 | `chatbox_credentials` — **1,987 rows live**, 0 suppressed counts leaked |
| #1093 | Fixed the one test the floor change broke |
| #1094 | CRED·STD retrieval functions, version-controlled |

## ⭐ The finding that reframes the workstream

**The naming layer was already built.** `kb/unified_titles.json` (3,813 variants →
1,987 canonical) → `credential_reference_data.js`, curated by `map@rccd.edu`. POST
folds **16** freehand titles and knows **32 adopters vs 71 potential, zero
overlap**. It had simply never reached the database Sierra queries. **A publish
step, not a build** — the third session running where the best catch came from
reading a committed artefact rather than generating a new one. Check the repo
first.

## ⚠️ Two things that will mislead you if you skip them

**1. Sam's student measures are NOT computable today.** He defined them precisely:
*students served* = distinct student records (**42,346**, fine); *applied* =
distinct records where **Applied Credits > 0**; *transcribed* = **Transcribed
Credits > 0**. But `map_student_credit` has **five columns** and **the four credit
columns are NOT in that export and never were** (⚠️ my "dropped at load" was a WRONG inference, corrected
2026-08-10: the source is `TblSOURCE`, the raw MAP extract, 537,908 rows, which carries all of them plus
`CPLStatusPlan` at student grain); `map_college_cr_unit` has the amounts and **no
`student_key`**. The join does not exist. Fix = **re-load with those columns**
(his 29-col export carries them). Do not substitute `course_type <> ''`
(**39,712**) — that is *"something was awarded"*, a different question.

**2. Exhibit-grain student counts are mostly unnameable.** Only **6.1%** of
220,588 rows. Student grain is **ACE** military ids plus 32,360 `Default *`
sentinels; Sierra's catalog is `MAPICI-*`; overlap **624 of 6,280**. Control:
CPR/AED is **17,904** students locally and **17** through the obvious join.

## Sam's three calls (decisions)

1. **k=10 everywhere a public surface can reach a headcount.** Suppress the
   **cell**; compute **totals from actuals**; publish the total when it clears the
   floor. `funding/_build_cr_backlog.py` already did exactly this, including
   complementary suppression — keep that.
2. **"Students served" = distinct student records in MAP**, regardless of other
   factors. The other two measures are the Applied>0 / Transcribed>0 splits above.
3. **Adopter-vs-potential wording**, verbatim: *"I recommend you go to the Mt. SAC
   CPL Landing Page and use the Request Review button to submit a request for the
   college to consider approving POST credit. You may also visit
   CreditforBeingYou.org and create a CPL portfolio to see all options
   statewide."* ⭐ This dissolves the poaching tension — route the seeker to
   **their own college's** Request Review, not to a rival. Use it in COLLEGE·CRED.

## The route map (Sam: "work through the router list systematically")

Nine routes, four families. **Six are served by the naming layer alone**, so the
router and the layer are the same work. Order: **CRED·STD** (done, unwired) →
**CRED·ADOPT** → **COLLEGE·CRED** (carries call 3) → the rest. `CRED·VOLUME` waits
on the re-load.

Per route: write the contract → answer POST **and a second credential** by hand
from live data (Real Estate is the honest control — a fix validated only on its
motivating example tends to be shaped like it) → **commit the assertion before
touching prompt text.**

⭐ **A route's purpose changes its ranking.** Not one function with per-route
filters — the ordering itself is route-specific. And a router's own failure mode
is **misrouting**: a route must never be the only path, so low confidence falls
back to general retrieval.

## Patterns that worked

- **Probe with real phrasings, then verify the probe.** Three of my design
  decisions were wrong and only testing found them. One *apparent* fourth defect
  was an artefact of my own `string_agg` — the function was right. Verify the
  probe before fixing what it accuses.
- **Measure the constant, don't pick it.** The tier-4 floor is 0.25 because 0.098
  (wrong) and 0.727/0.711 (right) leave open space there.
- **Positive controls.** POST must carry a variant with **no "POST" substring";
  the suppression guard was verified by re-inlining a literal and watching it go
  red.

## Safety patterns to honour

- Aggregates only — never route per-student rows through a session's context.
- Sandbox cannot reach `*.supabase.co`; all Supabase access via MCP. Sessions are
  also **egress-blocked from college domains**.
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- Rule 4: `CPL_Dashboard.html` ≡ `index.html`. Static JS needs no mirror.
- ⚠️ **The Bash cwd resets to `/home/user`** mid-session — `cd` in the same
  command. And `git reset --hard` after a squash-merge discards uncommitted work;
  the branch auto-deletes at merge, so rebuild from `origin/main`.

## Carryover

| # | Item | State |
|---|---|---|
| 1 | Wire CRED·STD into `cpl-chat` + assertion | **next** |
| 2 | Re-load `map_student_credit` with 4 credit columns | blocks CRED·VOLUME |
| 3 | **L3 credential families don't exist** — grow from `kb/occupation_credential_map.json` | blocks CRED·VOLUME/SEEKER·ROUTE |
| 4 | `docs/INDEX.md` **4.36× budget**, `roadmap_archive.md` 2.33× | lint, untouched |
| 5 | `linkDistance: 250` in `CPLBrain/.obsidian/graph.json` | from S134, still live |
| 6 | MAP has **no "Apprenticeship" CPL type** — filters return 0, reads as "we do none" | tell anyone doing apprenticeship work |

## Moniker

**SkyRoute** fits what you're inheriting — but take whatever Sam offers at greeting.
