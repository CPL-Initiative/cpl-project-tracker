---
title: Session 186 handoff — the cache is live and measured; Sierra's billing is the open risk
created: 2026-08-23
updated: 2026-08-23
tags: [handoff, session-186, sierra, cpl-chat, prompt-caching, monitoring, college-identity]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_185_handoff]]"
  - "[[docs/cpl_assistant_lessons]]"
---

# Session 186 handoff

You are **Session 186**. Session 185 ran as **SkyScope** (Sam's greeting named it;
note Session 183 also used that moniker — disambiguate by number). It worked the
To-Do queue and one thing that was not in it.

⚠️ Sam frequently runs several sessions at once. `git log origin/main` before
assuming your branch is the only work in flight — four PRs (#1294–#1297) landed
between handoff 185 being written and 185 starting.

⚠️ **This brief was written without knowing about a second session.** Session 184
(**SkyBound**) ran concurrently on the CPL funding model and landed **#1298** and
**#1301** — the second of which rebuilt the noncredit lane. That work is summarized
below; the full account is `docs/session_185_handoff.md` (written by 184, so it is
NOT this file's predecessor — read it as a sibling) and `docs/cpl_funding_lessons.md`.

---

## Also shipped, from the other session: the funding model (#1301–#1306)

Session 184 (SkyBound) ran concurrently and kept going after this brief was
written. Six PRs, and the last four all came out of one thing Sam did: he moved
two dials to see what would happen.

### The noncredit lane (#1301)

The noncredit carve-out was a flat FTES split of $1,000,000 among four feeder
campuses. It is now **the same bounded allocation the credit pool uses**, over
**33 institutions — 30 credit colleges running their own noncredit programs plus 3
standalone** — with three dials editable in their own box: `nc_threshold_ftes` (500),
`nc_floor_window` ($25,000), `nc_cap_window` ($100,000).

⭐ **Noncredit is 111 institutions system-wide, not 4** — 108 of the 115 college rows
carry noncredit FTES, which is why this lane needs an entry threshold the credit pool
has no equivalent for.

⭐ **`solveBounded()` now serves BOTH lanes.** The credit lane is a five-line caller;
`cpl_funding_cap.test.js` still asserts the ceiling-off output matches a transcription
of the original pin loop, which is what proves the generalization moved no dollar.
**If you touch the allocation solver, that test is the guard.**

⚠️ **A dedup has a scope.** Deleting Mt. SAC Noncredit's roster row to remove its
duplicated FTES **erased its real $50,000 ESS 25-82 seed grant** — the feeder roster
is also the grant recipient list. It now carries `nc_ftes_on_credit_row`, is zeroed in
the size basis only, and renders the reason.

⚠️ **The funding CSV's totals rows had been one cell too wide for months** (three
empties against two headers on SYSTEM and every district subtotal). Fixed and guarded
by a field-count check in both shapes.

### What the dial change exposed (#1302–#1306)

Sam set the credit floor to $150K and the NC floor to $50K and said the changes
"didn't propagate". The tab had recalculated correctly — but he was right anyway,
because three surfaces were lying:

- ⚠️ **$50K × 33 = $1,650,000 against a $1,000,000 pool.** The degenerate branch
  paid each institution **$30,303** while the box said *"33 at the minimum"*.
  `floorInfeasible` now REPLACES the note in both lanes. Latent in the credit
  lane too (115 × any floor above ~$210,785).
- ⚠️ **The explainer was a hand-rebuilt snapshot** on a host that blocks the call
  it needed. It is now a live page at **`/funding-model/`** off the same engine,
  with ONE shared payload builder so a snapshot can differ from it only by
  *when*, never by *how*. ⚠️ Its painter accumulated copies on repaint until
  #1306 — Sam saw the cards render three times.
- ⚠️ **"held $X" showed on all 115 rows** months before the deadline, reading as
  system-wide withholding. Phase-dependent now: *"opt in to start earning"*
  before, the figure after.
- ⭐ **The parity figure exposed a third defect** — the "CCC total" counted only
  the standalone roster, missing **56,993 FTES** of college noncredit.

### ⚠️ Read this before you merge anything

**I put `main` red for ~30 minutes and it was entirely avoidable.** Three greens,
none of them evidence: (1) merged twice on the required check — a secret scanner
— while the suite covering my changed files was still running; (2) verified
locally with a subset I chose, and both broken files were outside it, one of them
a *duplicate* of an assertion I had already fixed elsewhere; (3) reported a "full
suite pass" that was actually **SIGTERM 143** — the "exit 0" belonged to the
wrapper, not the runner.

**On this tab: run the full suite, and name what a green check actually covered
before you rely on it.** Durable:
[`a-green-check-you-did-not-scope-is-not-evidence`](kb-notes/methodology-a-green-check-you-did-not-scope-is-not-evidence.md).

⚠️ **Open for Sam:** the noncredit floor. 27 of 33 sit at $25,000 (68% of the pool) and
growth does not start paying until 3,022 NC FTES — the incentive he wanted is at ENTRY
and flat in the middle. $20,000 halves the break-even. Also still his: the credit pair
($175K + $400K as shipped).

---

## Read this first: Sierra went down twice in two days

The Anthropic balance behind `cpl-chat` ran out on 2026-08-21 and **again**
overnight on 2026-08-22. Both outages took down **every** Sierra surface at once
and both were found by a session happening to look, because nothing watched her.
Sam topped up mid-run from **personal funds** — the corporate account does not
exist yet, which is why cost decisions in this lane are real.

`.github/workflows/cpl-chat-health.yml` now probes her every 3 hours and opens /
reuses / closes a GitHub issue. **Raise it to hourly once billing moves** — the
cost arithmetic is in the workflow header so that is a decision, not a shrug.

---

## What shipped

| | |
|---|---|
| Uptime | `chatbox/health_check.sh` + a scheduled workflow; 21 checks, exercised against a mock in five response shapes |
| Cost | **Prompt caching** on `cpl-chat` — a 2,992-token stable block, byte-identical every request |
| Smoke | Mode 7's part-3 prose grep → **mode 7r**, a deterministic retrieval assertion |
| Data | MAP's three sandbox colleges deleted from `chatbox_college_profiles` |
| Lint | The College Identity finding list restored **13 → 10** and made impossible to empty silently |

---

## ✅ ALREADY DONE — the deploy landed in Session 185

`cpl-chat` is at **v57 ACTIVE**, `verify_jwt: false`, deployed from
`cpl-chat-deploy.yml` (never the inline MCP call). **Caching is live and
verified in production**, not merely merged:

| | |
|---|---|
| Cache writes | **1** (the first request after deploy) |
| Cache hits | **33** |
| `⚠ NEITHER` (breakpoint inert) | **0** |

⭐ **`read=3027` was IDENTICAL on every request** while `uncached_input` ranged
**10,843 → 22,762**. That constancy is the proof the always/conditional split was
load-bearing rather than fussy: the swings are different question modes, and had
the whole rule block been cached (the one-line version) that figure would jitter
and most rows would read `write=`, costing ~25% MORE on that slice, invisibly.

Read it yourself with:

```sql
select timestamp, event_message from logs
where source = 'function_logs' and event_message like 'cpl-chat cache:%'
order by timestamp desc limit 20
```

⚠️ **`source` is `function_logs`, NOT `function_edge_logs`** — the latter returns
zero rows for `console.log` output and looks exactly like a dead feature.

⚠️ **A MERGE PUSH FIRES ITS OWN SMOKE RUN, AND IT CAN RACE THE DEPLOY.** Merging
a PR touching `cpl-chat/index.ts` or `smoke_test.sh` triggers `cpl-chat-smoke.yml`
on the push to `main`. On this run that automatic run started at **01:17:40** and
the deploy finished at **01:18:17** — so it tested the OLD function with the NEW
script, and a green result there would have meant nothing while looking exactly
like validation. **Always dispatch your own smoke AFTER confirming the version
bumped**, and read that run, not the automatic one.

---

## Then: the Haiku question Sam asked

He asked whether Sierra could run on Haiku "to be cheaper with comparable
results". Answer so far: **there is no Haiku 4.6** — it is **Haiku 4.5**
(`claude-haiku-4-5`), **$1/$5 vs Sonnet 4.6's $3/$15**, and **200K context, not
1M**. Caching was the first lever because it is model-neutral; Haiku is the
second and it is **not** free:

- Her context builders are capped but the offerings query already **fills** its
  150-row limit — measure the peak prompt against 200K, do not assume.
- **The caveats are the product.** A smaller model drops a hedge before it drops a
  fact, and several smoke assertions test exactly those hedges (15a's
  Not-Applicable ceiling, 16a's no-cannot-enumerate, 14b's suppression).
- Run the suite on both and **diff the failures**. Report; do not switch quietly.

---

## Carryover

- 🔴 **Deploy + verify the cache** (above).
- 🟡 **The durable half of the sandbox-college fix is not built.** Nothing in
  `cpl-chat` stops an equivalent row arriving tomorrow; the structural guard is
  the function refusing to surface a college absent from (or `test` in) the
  authoritative roster. Needs a deploy and a smoke, which is why 185 left it.
- 🟡 **12 adoption-file statewide titles** still absent from `chatbox_credentials`.
- 🟡 Sam still owes a **phone check** on the three public pages; no session can.
- 🟢 Docs lint long tail: `american_spelling` 172, `oversized_doc` 4
  (`roadmap_archive` 3.1×, `INDEX.md` 6.4×). Fix in files you touch.

---

## Patterns that worked

- **Rule 8's read step paid for itself in the first five minutes.** The most
  important thing in the run — a live outage — was a `verified` `cpl_memory` row,
  not a queue item.
- **Verify a live data set by checksum, not by sampling.** `md5(string_agg(name,
  E'\n' ORDER BY name COLLATE "C"))` proved 130 observed names and 120 roster rows
  were unchanged against the committed inputs, in one query, without moving the
  rows through the session's context.
- **Break your own checks.** Twelve deliberate breakages across four new test
  files; every one fired the intended check and only that check.
- **Read the lint's complaint about your own edit.** `stacked_roadmap_cell` and
  `unindexed_kb_note` both fired on this run's work. The roadmap cell ended up
  **smaller than it started** (3,094 → 2,718 chars) while carrying more findings.

## Safety patterns to honor

- **Rule 5**: never force-push `main`.
- **Merge on `unstable`**, not just `clean`.
- ⚠️ **A cache breakpoint on "mostly stable" material is a surcharge, not a
  saving.** Prove invariance by RUNNING the builder over every input combination.
- ⚠️ **Comments are not code.** A grep asserting "the old assertion is gone" will
  match the comment that quotes it — strip comment lines first.
- ⚠️ **An optional input can silently empty a finding list**, and an empty finding
  list reads as good news. The builder refuses now; keep it that way.

## Moniker

**SkyGuard** is going if you want it — this run was about things that were
supposed to be watching and weren't. Take it, take your own, or use whatever Sam
names in his greeting.
