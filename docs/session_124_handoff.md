---
title: Session 124 handoff — deploy Sierra's retrieval fix, then refresh the corpus
created: 2026-08-06
updated: 2026-08-06
tags: [handoff, sierra, cpl-assistant, retrieval, student-data, privacy]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/sierra_maturity_roadmap]]"
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
---

# You are Session 124

Previous session was **SkyRecall (123)**. Sam calls the assistant **Sierra**;
the workstream is the "CPL AI Sherpa."

## Read these first, in order

1. `docs/cpl_assistant_lessons.md` — §SkyRecall (bottom). The whole story.
2. `docs/kb-notes/methodology-assert-what-retrieval-returns.md` — why this
   question broke twice.
3. `docs/kb-notes/reference-postgres-fts-pitfalls-for-credential-titles.md` —
   the four tokenizer traps, with the shipped fixes.
4. `chatbox/supabase_search_exhibits_by_topic_v2.sql` — schema of record.
5. `docs/sierra_maturity_roadmap.md` — the lane plan (Phase 1 guardrails are
   still unbuilt and still the stated priority for Malone).

## What shipped

**#1016 — Sierra topic retrieval.** Five defects. The one worth carrying:
the 2026-07-01 fix for this same question *caused* the 2026-08-06 failure —
it added `aed` to the CPR synonym family, and `to_tsquery('english','aed:*')`
parses to `'a':*`. **2 colleges → 5, 100% precision.**
`tests/sierra_topic_keywords.test.js` (60 checks) is the assertion that was
missing both times.

**#1017 — small-cell suppression that actually suppresses.** The builder hid
cells below 5 while publishing `total` and every sibling, so subtraction
recovered them exactly. Complementary suppression + a row-level floor, and the
residual documented rather than papered over.

## 🎯 Priority 1 — deploy `cpl-chat` (BLOCKED ON SAM'S GO)

**Production still answers "2 colleges."** The RPC is live and the code is
merged, but the Edge Function was never deployed. SkyRecall held it
deliberately and asked; Sam had not answered by session end.

Why it was held: one deploy hits the **map.rccd.edu widget, the standalone
Sierra page, the COBI tab, the Fact Sheet drawer and the vendor iframe** at
once. There is no staging tier (roadmap 6.4 proposes one). And the MCP
`deploy_edge_function` tool needs the entire **66 KB** file passed inline — a
prior session hit a mid-flight drop at 55 KB.

**Procedure when he says go:**

1. `git show <pre-change-sha>:chatbox/supabase/functions/cpl-chat/index.ts`
   into scratchpad as the rollback (the pre-#1016 blob was byte-identical to
   live v28 — verified).
2. `node --experimental-strip-types --check` the file first.
3. Deploy with **`verify_jwt: false` passed EXPLICITLY** — the tool defaults it
   to `true` and v25 shipped `true` for ~40 minutes once; the widget 401s.
4. **Byte-verify**: `get_edge_function` → hash-compare against the repo copy in
   python (the result overflows context; parse the saved file).
5. Dispatch `cpl-chat-smoke.yml` and read **mode 7**.

**On mode 7:** it was already red before this work, and it is red *because of*
the bug #1016 fixes — asked about LA Harbor + NCCER carpentry, production
returned a **Dental Board certificate** as the only local match. If it goes
green on the deployed v2, that closes the loop with evidence. If it stays red
it is a genuinely separate offerings/geography issue and gets its own fix.
Note mode 7 asserts against model-generated prose, so it carries inherent
flake — that is a weakness in the assertion, not a reason to ignore it.

## 🎯 Priority 2 — refresh the exhibit corpus

**This is the remaining gap, and it is not search.** `chatbox_exhibits` holds
**2,397 exhibits across 59 colleges**. MAP has **123**. Sierra is structurally
blind to roughly half the system, which is why it finds 5 CPR colleges where
the CER knows 7 (American River, LA Mission and West LA are simply absent).
`chatbox_college_profiles` was last refreshed **2026-06-25**.

Roadmap item 3.2 already scopes this: build a committed regeneration from the
tracker's daily MAP data, and longer-term re-point the grain to the CER
unified-title layer so title drift collapses. ⚠️ It writes to a **shared table
feeding production Sierra** — walk Sam through the blast radius first.

## 🎯 Priority 3 — the student-detail aggregator

Sam uploaded `StudentDetailCredits_080626_JSON.zip` (11.8 MB, Drive). **It was
never read** — the Drive connector caps downloads at 10 MB and cannot
range-request, so splitting must happen on his side (4 parts, each zip under
~4 MB; base64 inflates by a third in transit). **The durable path is Malone's
view name** wired through `fetch_custom_report.py` → `funding/_build_cr_backlog.py`,
which already parses this exact format and is waiting on it.

**Schema confirmed** from a sample Sam pasted (32 columns). Names and
`StudentID` (an **SSN** field) arrive **masked with X's, not blank**;
`StudentMAPID` is **not** masked. Agreed allowlist — 8 columns:

```
Location · CPL Mode · Credit Recommendation · College Course
ExhibitID · Source Code · CPLStatusPlan · salted-hash(StudentMAPID)
```

**Drop `Notes`** — free text, staff can type anything into it, no analytical
value. Drop `Program`, `ProgramGoal`, `Catalog Year`, `Transfer Destination`
as quasi-identifiers. Sam's threshold preference is **<10** (the builder
currently uses 5); raising it is one line and his call.

⭐ **Sam's military insight, and it holds.** Row 1 of his sample: Allan Hancock,
ACE exhibit `AR-0701-0013`, *"1 hour in Basic Life Support…"*, `College Course`
blank, `Needs Action` — and Allan Hancock is nowhere in the CER's CPR list. The
file cleanly separates two lists:

| Pattern | Meaning |
|---|---|
| `College Course` filled + Source `MAP` + Applied | already articulated — the adoption list |
| `College Course` blank + Source `ACE` + Needs Action | recommended, never articulated — unmet demand |

## Carryover

- **`cpl_funding_cr_backlog.js`** is untracked in the tree. Funding lane's build
  output from #1014, nothing consumes it, regenerable. Left alone deliberately.
- **A privacy/disclosure review workflow was lost** to a container restart. The
  allowlist above stands on its own; re-run if the aggregator gets built.
- **Sierra lane Phase 1 guardrails remain unbuilt** — durable rate limit, daily
  cost breaker, CORS hygiene, usage digest. Still the stated priority for
  Malone. See `docs/sierra_vendor_lane_handoff.md`.
- Sam's three parked decisions are still parked: fail-closed contacts flip,
  RAG corpus re-point, staging slug.

## Patterns that worked

- **Measure before theorising.** Every claim this run came from a live query:
  `to_tsquery` parses, document frequencies, `word_similarity` scores. The
  `aed` → `'a':*` root cause took one SELECT.
- **Take the user's phrasings as test cases.** Sam's asides — "nursing", "fire
  fighter", "cardiopulminary" — each found a real bug. He is the domain expert
  *and* a representative user.
- **Write the test before you believe the fix.** It went red on a bug nobody
  had asked about.
- **Additive + fallback** for shared surfaces: v1 untouched, code tries v2 and
  falls back, so rollback is deleting a call site.
- **Diagnose a CI failure before treating it as yours.** The red smoke check
  tested the *live* function, which the PR hadn't changed.

## Safety patterns to honour

- **`verify_jwt: false` explicitly** on every `cpl-chat` deploy; byte-verify after.
- **Every `cpl-chat` deploy and every `sierra_guidance` row hits production.**
  No staging tier.
- The sandbox **cannot reach `*.supabase.co`** — all Supabase access via MCP;
  smoke tests run on the runner.
- **Poll CI via the MCP github tools, not curl.** `actions_list` overflows —
  parse the saved file with python.
- **Adding a parameter to a Postgres function creates an OVERLOAD.** Drop the
  superseded signature or PostgREST calls fail `42725`.
- Never widen `sierra_guidance` / feedback / contacts gates toward anon.

## Moniker

**SkyRecall** was 123 — named for the information-retrieval sense of *recall*,
which is exactly what was broken. (Note **SkySherpa** is already taken, Session
90→91.) **SkyCarry** or **SkyCorpus** would suit a session that finishes the
deploy and the corpus refresh — but coin your own. Sam sometimes names it in his
greeting; if he does, take his.
