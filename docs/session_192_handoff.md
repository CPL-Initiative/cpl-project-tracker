---
title: Session 192 handoff — the deploy landed and Sam verified it; the queue question is yours
created: 2026-08-25
updated: 2026-08-25
tags: [handoff, session-192, sierra, memory, my-college, skyview]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/cobi_memory_tab_lessons]]"
  - "[[docs/kb-notes/methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting]]"
superseded: true
superseded_by: session_197_handoff.md
---

# Session 192 handoff

You are **Session 192**. Session 190 ran as **SkyAlign** (Sam's name for it), picking up the memory
thread while he drove SkyView in a browser. It ended with a **production deploy**, since
verified by him.

⚠️ Sam runs several sessions at once. `git log origin/main` before assuming your
branch is the only work in flight.

---

## Read this first

**`cpl-chat` is at v58 and it is LIVE** — deployed 2026-08-25 on Sam's *"Checkpoint
and deploy"*, byte-verified against the repo (`02c130977e69e8f9`, 221,310 chars,
`verify_jwt:false`). It carries three things that had been waiting on one dispatch:
the memory per-surface caps (#1320), the Briefing surface (#1321), and the Sierra
district-figures fix (#1325).

✅ **SAM HAS VERIFIED THE SIERRA HALF.** 2026-08-25, the morning after: *"Sierra looks great
this morning."* That closes the district false-zero — Moreno Valley rendering 0 students against
a live 2,887 — and it is the one check no session can make, because the sandbox is egress-blocked
from `*.supabase.co`. **Do not re-ask him about Sierra.**

⚠️ **HE DID NOT SAY ANYTHING ABOUT THE BRIEFING**, and it is a different surface — the Memory
tab's Report view, not Sierra. It shipped in the same dispatch and has still never been seen by a
human. Treat it as **open**: ask about it specifically, not as part of "did the deploy work".
Reading *"Sierra looks great"* as covering it is the same over-read this run kept catching
elsewhere.

⭐ **KEEP THE DISTINCTION THAT CLOSED IT.** Byte-identity proves the right code is running; it
cannot prove the answer reads correctly to the person who asked. Both were needed, and only the
second one ends a Sierra change. Say so in your own handoff rather than implying the deploy was
the finish line.

## What shipped

| PR | |
|---|---|
| #1325 | Sierra district figures come from the live table · memory-isolation guard · the A/B rig |
| #1326 | four "assert the argument arrives" test repairs |

Also live in Supabase, outside any diff: the `sierra_guidance` CHECK now allows
`memory-briefing` (migration `sierra_guidance_surface_allow_memory_briefing`), and
19 memory rows written 2026-08-24 got the `plain` field #1308 made mandatory.

## ⭐ The finding worth carrying forward

Sierra reported **a June snapshot** on district questions. Every figure matched
`chatbox_college_profiles.credit_distribution`, `updated_at` **2026-06-25 21:59:58**
— a column with **no writer at all**: four jobs write that table and none touches it,
while `map_college_credit_summary` rebuilds nightly. Measured drift across the 103
colleges that join: transcribed understated **61%**, students **40%**, false zero for
transcribed at **17** colleges.

⚠️ **It bites ONLY a district question.** `singleProfile` is null when the profile
lookup returns an ARRAY, so no live per-college figures were built and the stale line
was the only source left. Single-college questions had been correct all along — which
is why "it was working yesterday" was true and there was no regression to find.

⭐ **Fixed by DELETING the second copy, not refreshing it.** Two copies of one fact
drift again the moment one loses its writer, and the failure is silent because a stale
number looks exactly like a fresh one. Durable note:
[`a-second-copy-of-a-fact-is-a-stale-copy-waiting`](kb-notes/methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting.md).

## ⚠️ Three method failures to inherit, not repeat

- **The repo is not the deployment.** I established what v57 did by reading
  `git show <commit>:index.ts` and Sam had to point me at the lessons doc that says
  read the **live source through the Supabase MCP**. It matched — that was luck.
- **I shipped the bug I had just read about, four times.** Assertions anchored on a
  call's closing paren go red naming a consumer that is fine;
  `sierra_credit_disposition.test.js` actually went red, and **the fix was already six
  lines below the failing line**, applied to two siblings and never back-ported.
  **34 assertions of that shape survive repo-wide** — the ones on our own functions
  are `_prios`, `srcIdx`, `earnedSubHtml` ×2, deliberately left for their workstreams.
- **`exit=0` was a trailing `grep`, not `npm test`.** A red suite nearly passed for
  green. And a CI event named a **superseded** head, which would have sent me
  diagnosing an already-fixed failure. Read the log, not the summary.

## 🔭 Your priority — and it is a question, not a build

(The verification above is CLOSED. This is where you actually start.)

**SkyView step 2 (the re-mint queue) is scoped and approved, and I recommend holding
it.** Measured this run:

- **0 `CN:` rows** in `kb_curation` (34,439 rows) — no drag has ever landed
- **0 of 23,526 rows** carry `subject_collision_signal` — rule verified still active
  (`_rules_active` includes it; line 588 appends it), so that is a real zero

The queue would be **empty from both sources on day one**, and it needs a new gated
Supabase table to exist. That is the shape of roadmap phase 1b, which Sam parked with
*"low immediate value — 1 cluster; build when ≥5 clusters exist."* The loop also
already closes: a drag writes `CN:` → `excel_to_dashboard.py` honors it → the artifact
rebuilds → the auditor flags the collision. What step 2 adds is **durability,
attribution and dismissal-with-a-reason** — real, but with nothing yet to hold.

**Ask Sam to do a drag or two first.** Then the queue gets built against a walked
path, which is the lesson SkyCal paid for in #1317.

Better SkyView targets meanwhile: the **description shards to Supabase** (Sam leaned
that way and left table-vs-bucket, public-read and stand-alones open) and the **1,122
duplicate-claim control numbers**, which is a worklist that exists today.

## Carryover

| Item | Status |
|---|---|
| Sam verifies the RCCD answer in a browser | ✅ **DONE 2026-08-25** — *"Sierra looks great this morning."* Do not re-ask |
| Sam looks at the **Briefing** (Memory tab → Report) | **open** — same dispatch, never seen by a human; not covered by the Sierra confirmation |
| `cpl-chat-preview-ab.yml` | built, never run — use it on the NEXT cpl-chat change |
| SkyView step 2 | recommend hold; needs Sam's call |
| 34 closing-paren assertions | 4 fixed; `_prios`/`srcIdx`/`earnedSubHtml`×2 left |
| `CLAUDE.md` 2.45× its lint budget | standing; this checkpoint left it net smaller |
| Orphan Routine from S187 (*"Merge #1313"*) | one-shot, past fire time, bound to a dead session |

## Patterns that worked

- **Measure before you build.** Two SQL queries turned "build the queue" into "don't
  build it yet", and three lines of join turned one reported college into a 61%
  understatement across 103.
- **Perturb every assertion before believing a pass** — and for a *loosened* check,
  run both probes: remove the value (must fail) **and** append an argument (must stay
  green). The second is the one people skip.
- **Read the live thing.** The deployment, the log, the table — not the repo, the exit
  code, or the summary.

## Safety patterns to honor

- Rule 10: fresh read at write time; the sandbox reaches Supabase only via MCP.
- Never force-push `main`. Restart your branch after every squash-merge — the remote
  one auto-deletes, so a plain `push -u` recreates it (force-with-lease reports
  "stale info").
- ⚠️ **Never `git checkout --` a file holding uncommitted work.** I destroyed this
  run's Sierra fix that way and had to rebuild it. Commit first, then perturb.

**Moniker:** SkyAlign signing off — Sam named it on the strength of the district figures
lining up again. Take **Sky192** or coin your own.
