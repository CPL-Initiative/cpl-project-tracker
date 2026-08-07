---
title: Session 125 handoff (SkySteward) — two decisions waiting on Sam, then the corpus
created: 2026-08-07
updated: 2026-08-07
tags: [handoff, sierra, cpl-assistant, retrieval, geography, student-portal, feedback]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-a-guardrail-that-only-forbids-disables-the-feature]]"
  - "[[docs/kb-notes/methodology-the-feedback-queue-already-knew]]"
  - "[[docs/kb-notes/methodology-an-unordered-limit-is-a-correctness-bug]]"
---

# You are Session 125

Previous session was **SkyHero (124)**. The assistant is **Sierra**; the workstream is the "CPL AI Sherpa."
Sam names monikers — if he doesn't, **SkySteward** is the suggestion (this session is mostly stewardship: two
decisions to land, a queue to drain, an audit to finish). Coin your own if you prefer.

## Read these first, in order

1. `docs/cpl_assistant_lessons.md` — the §SkyHero section (the whole story).
2. `docs/kb-notes/methodology-a-guardrail-that-only-forbids-disables-the-feature.md` — **the unresolved tension.**
3. `docs/kb-notes/methodology-the-feedback-queue-already-knew.md` — why the inbox matters more than the detector.
4. `chatbox/supabase/functions/cpl-chat/index.ts` — `detectAndFetchCollegeProfile`, `PORTAL_RULE`.

## What SkyHero shipped (all merged, all deployed — cpl-chat deploys 7–10 green)

- **#1023** — mode 7's real cause: **the home college was never detected.** The word loop returned on the first
  ambiguous match (`"angeles"` = 9 colleges) and never reached `"harbor"` (= 1); `.limit(3)` with no `ORDER BY`
  is non-deterministic, so two identical live calls returned different triples. With no home college, `askedGeo`
  was null and nothing could rank by proximity. Detection now pools+scores every candidate word; `college_geo`
  is loaded once and ranks **both** lists county→region→volume. `tests/sierra_geo_ranking.test.js` (36 checks).
- **#1024** — 📋 Copy on both surfaces (rich HTML + markdown; three tiers, because the vendor iframe blocks the
  async Clipboard API). `tests/sierra_copy_answer.test.js` (39).
- **#1025/#1026/#1027** — student routing, four passes: both/and → **Yes/And** → the portal's fuller portfolio
  process → **anti-poaching**. `tests/sierra_student_portal.test.js` (44).
- Shared test lifter extracted to `tests/lib/lift_ts.js`.

## 🎯 Priority 1 — two decisions that are Sam's, not yours

**Do not resolve either of these by editing code or tests.** Ask, then implement.

**(a) The seeker-vs-college line.** Sam: *"we do want to err on the side of CPL seekers…while supporting our
colleges…speaking out of both sides of my mouth so it's another method+magic request."* #1027 as written can make
Sierra **withhold** — a seeker asks about a credential their college hasn't articulated and gets a polite dead
end. The drafted line, **not yet shipped**: *the restraint binds salesmanship, not facts* — never withhold what
materially changes a seeker's outcome; never volunteer editorial comparison. Get his yes, then encode it in
`PORTAL_RULE` + the student audience rule, extend `sierra_student_portal.test.js`, deploy.

**(b) Mode 7's intent.** Live smoke 44: `7 home college detected` **passes** (detection works end-to-end);
`7 nearby construction college` **fails** because Sierra names **Norco + Barstow** — who have actually
*articulated* NCCER — over El Camino / Trade Tech, who merely *teach* construction. **No LA-county college has a
construction exhibit at all.** The assertion encodes the pre-#1027 intent. Both behaviours are defensible; ask
which he wants, then fix the assertion to match the **decision**. Greening it to match the code is precisely the
failure `methodology-assert-what-retrieval-returns` exists to prevent.

## 🎯 Priority 2 — the feedback queue

**43 rows since 2026-07-01, zero ever triaged**; 19 are `page='smoke'` (our own test polluting the queue it
fills); 10 are real thumbs-down with notes. One of them reported the geography bug on **2026-07-03**. Two jobs:
filter `page='smoke'` out of the review surface, and drain the 10. Sam wants to invite the MAP and CO teams to
test Sierra — **that should not happen before the queue has an owner**, or a few hundred unread rows will teach
people their feedback goes nowhere.

## 🎯 Priority 3 — the corpus (unchanged, still the biggest limit)

`chatbox_exhibits` holds **2,397 exhibits across 59 colleges**; MAP has **123**.
`chatbox_college_profiles` last refreshed **2026-06-25**. This is the rest of the CPR gap. ⚠️ Writes to a shared
table feeding production Sierra — walk Sam through blast radius first.

## Carryover

- **A five-surface poaching audit was still running at checkpoint** (prompt constants · audience rules · context
  builders · live `sierra_guidance` rows · sibling report generators). Re-run it if nothing was reported.
- **`creditforbeingyou.org/main/student`** is used as Sam supplied it — the sandbox is egress-blocked from that
  domain, so the path was never confirmed. One-line change if wrong (`PORTAL_STUDENT_URL`).
- Student-detail aggregator still waits on **Malone's view name** → `fetch_custom_report.py` →
  `funding/_build_cr_backlog.py`. Suppression threshold: Sam wants **<10**; builder uses 5.
- Sierra Phase 1 guardrails still unbuilt (rate limit, cost breaker, CORS, usage digest) —
  `docs/sierra_vendor_lane_handoff.md`.

## Patterns that worked

- **When the code you were pointed at cannot produce the symptom, go up a layer.** Re-deriving the rank function
  by hand (`min(courses,39) < 40`, so volume *cannot* outrank region) is what proved the reported bug impossible
  and found the real one.
- **Measure before theorising.** Every claim came from a live query. The non-deterministic `LIMIT` took two
  identical SELECTs.
- **Sam's asides are test cases.** "Moreno Valley is closer than Bako", "cardiopulminary" — each found a real
  defect. Bare ratings found none.
- **Correct yourself out loud, fast.** #1027's over-restraint and the `.s-fb-btn` class reuse (which broke two
  suites) were both mine; naming them immediately was cheaper than defending them.

## Safety patterns to honour

- **Deploys** go through `.github/workflows/cpl-chat-deploy.yml` with `confirm: DEPLOY`. `--no-verify-jwt` is
  pinned there — do not remove it. Never hand-transcribe the function.
- **Prompt text only takes effect on deploy.** Merging is not shipping.
- The sandbox **cannot reach `*.supabase.co`** (Supabase via MCP only) — nor `creditforbeingyou.org`, nor Actions
  **blob log storage**. Smoke runs on the runner.
- **`actions_list`'s `workflow_id` filter is ignored** — it returns every workflow's runs. Use the **numeric**
  workflow id (`cpl-chat-smoke.yml` = `302412796`). Large tool results persist to a file you can grep.
- Poll CI via the MCP github tools, **not curl**.
- Adding a parameter to a Postgres function creates an **OVERLOAD** — drop the superseded signature or PostgREST
  fails `42725`.
- These prompt rules are **template literals evaluated at module load**: a const referenced before its
  declaration is a TDZ `ReferenceError` that kills the function at boot.
- Never widen `sierra_guidance` / feedback / contacts gates toward anon.

## Rollback

`git show 6154493:chatbox/supabase/functions/cpl-chat/index.ts` → commit → dispatch the deploy workflow.
Rollback is an ordinary revert now, not a hand-transcription.
