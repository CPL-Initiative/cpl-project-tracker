---
title: Session 272 handoff — Sierra's outage was a deploy skew, and My College went public
date: 2026-09-17
session: 271 (SkyVeil)
tags: [handoff, sierra, my-college, disclosure, coci, cip]
status: current
---

# You are Session 272

Your moniker is **SkyIndex** — the work in front of you is making program data
findable, which is the one thing Sierra currently cannot do.

⚠️ **NUMBERING: read this before you greet anyone.** A parallel session also ran
as "Session 268 / SkyBridge" on 2026-09-17 and wrote handoffs 269 and 270
(SkyFold). This session took **271** to avoid overwriting SkyFold's slot. If
`docs/session_271_handoff.md` appears later it is SkyFold's, not stale — always
read the HIGHEST-numbered file, which is this one.

Read in order: [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md) ·
[`lanes/my-college-action-page.md`](reference/lanes/my-college-action-page.md) ·
`docs/cpl_assistant_lessons.md` (2026-09-17) · PRs #1595 #1597 #1598 #1599.

## What shipped

- ⭐ **#1595 — SIERRA WAS DOWN FOR THE TEAM FOR FIVE DAYS AND EVERY INSTRUMENT
  SAID UP.** Reported as billing; it was a deploy skew. The page ships on merge,
  the Edge Function only on a `cpl-chat-deploy.yml` dispatch, so a widget sending
  `x-team-pass` (shipped 09-12, #1568) met a v65 preflight that did not allow it,
  and browsers refused the request. The probe is curl and makes no preflight, so
  it passed ~40 times through the outage. It preflights first now. v66 deployed.
- ⭐ **#1597 — smoke 15b was the THIRD instance of the negation class** #1566
  fixed in 15a/15c. The class is guarded now, not the instances.
- ⭐ **#1598 + #1599 — MY COLLEGE IS OPEN TO THE PUBLIC, and nothing was
  un-gated.** Four `_pub` mirrors carry only what may be public; every base keeps
  its RLS. Suppression runs at BUILD time in `kb/_publish_college_briefing.py`.

## ⚠️ Sam's decisions this run — do not re-litigate

1. **My College is open to "colleges / the public internet"** (his pick from a
   three-way question). He was told contacts and per-college figures were in
   scope before choosing.
2. **Deploy `cpl-chat-deploy.yml` when Sierra is down for a deploy skew** — he
   authorized it directly rather than routing it to Malone.
3. **"Many OC colleges offer LVN. Check the COCI program data."** He was right
   and I was wrong; see the KB note below.
4. **"Maybe use CIP instead of TOP — more reliable."** Right about direction;
   measured, it does not fix the LVN case. Load CIP anyway.

## The priority workstream

**Sierra cannot see program data at all.** `search_college_offerings` reads
`coci_college_offerings` (a course rollup) and nothing else.
`coci_college_programs` holds **22,335 rows over 118 colleges**, unread.

Two steps, in order:

1. **Load the unread `CIP CODE` column.** `tmc/source_data/coci_program_export_*.csv`
   has carried it all along; `chatbox/build_coci_offerings.py` reads TITLE, AWARD
   and TOP CODE and drops CIP on the floor. Free signal. ⚠️ CIP is blank on
   **14.1% of ACTIVE** programs against TOP's 0%, so load it, never gate on it.
2. **A program-search retrieval route** matching program TITLE *and* code, with
   neither alone deciding. Title finds 53 LVN colleges; either code finds 44.

## Carryover

| Item | State |
|---|---|
| CIP loader + program search | **next** — the whole brief is above |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed |
| `college-briefing-publish.yml` unmapped in `governance_surface_map.json` | **deliberate** — let the drift detector propose it |
| Sam's eyes on the public My College, signed out | asked, not yet confirmed |
| Matcher vocabulary gap · Engineering homograph · ASCCC areas · Credential Engine | unchanged from S268 |

## Patterns that worked

- **Measure before designing.** Counting `map_college_cr_unit` (145,554 rows
  describing one student) is what turned an RLS switch into the ADR's two-object
  shape.
- **Mutation-test the TEST.** Deleting the complementary-suppression loop left
  every privacy assertion passing — a privacy test cannot see a utility
  regression.
- **Believe the human.** Sam's "check the COCI program data" overturned a
  conclusion I had gated on TOP, which Rule 7 tells you not to do.

## ⚠️ Safety patterns to honor

- **`cobi_admin_surface.js` is DERIVED from `kb/dependency_map.json`.** Order:
  stage → rebuild the map → rebuild the admin surface → run the suite. A local
  run that passes before the final map rebuild hides real regressions.
- **A table name behind a variable is invisible to the map** — `REST_CONCAT_RE`
  needs it to follow `REST + "`. Use a SEED, pinned to an anchor.
- **`npm run a11y` loads static files with no Supabase**, so it never paints a
  lazily-fetched row. A clean report says nothing about a surface it never reaches.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase only
  through MCP) · `test` green on the CURRENT head before every merge.

## KB notes added this run

- `methodology-a-monitor-that-is-not-a-browser-cannot-see-a-browser-failure`
- `methodology-a-code-cannot-say-who-a-program-is-for`

---

*Greetings, you are Sky**Index** (Session 272), see Sky**Veil**'s handoff —
`docs/session_272_handoff.md` — let's keep rolling with our queue.*
