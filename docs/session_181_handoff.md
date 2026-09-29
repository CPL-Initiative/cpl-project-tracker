---
title: Session 181 handoff — the caps are honest now; the guidance rows are not yet display rules
created: 2026-08-22
updated: 2026-08-22
tags: [handoff, session-181, sierra, guidance, college-identity]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_180_handoff]]"
superseded: true
superseded_by: session_186_handoff.md
---

# Session 181 handoff

You are **Session 181**. Session 180 was **SkyShort**. Sam's brief was one line,
naming four carryover items from the Session 180 handoff:

> *"the sierra_guidance kind column, raising the row cap off its fossil 10,
> consolidating the notes 9 → 7, and adding the colleges' own short names to
> variants (the Pierce gap)."*

All four shipped in **#1283**, merged, deployed, and verified against production.

⚠️ Sam frequently runs several sessions at once. Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## ✅ Sierra is UP — the 08-21 outage is over

Sam cleared the Anthropic credit balance himself before Session 180 began
("*Sierra's up. I got it taken care of before this session*", 2026-08-22).
`cpl_memory` row `sierra-down-anthropic-credit-balance` is marked **stale**.

⚠️ **The durable half is NOT fixed: nothing alerts when Sierra stops answering.**
`cpl-chat-smoke.yml` has no `schedule:` trigger, so yesterday's outage was found
by a session doing a post-deploy check, not a monitor. A student who hit the
widget in that window reached nobody and filed nothing.
`cpl_memory`: `sierra-has-no-uptime-monitor`.

⚠️ **Do NOT add an hourly smoke cron without asking Sam.** Each run makes ~19
paid model calls; hourly is ~24 paid runs/day forever, and the incident being
recovered from was a drained balance. The cheaper closure is an alert on a
sustained 400 rate from the edge function. **Sam has not chosen either.**
And note: a **duration** heuristic does NOT work — Session 180 proposed one and
then measured it wrong. Healthy run 113 was **6m33s**; the fully-broken run 106
was **4m49s**. The gap is far too narrow to alert on.

---

## What shipped (PR #1283)

| | |
|---|---|
| **Row cap 10 → 20** | `GUIDANCE_MAX_RULES` + `GUIDANCE_SENT_CAP`. The un-raised half of the 2026-08-12 pair. |
| **`kind` column** | `directive` \| `display` on `sierra_guidance`, migration live, all 13 rows defaulted to `directive`. |
| **Guidance 9 → 7** | Three rows were one instruction; the military caveat was carried twice. |
| **Campus short names** | 6 accepted (Pierce · Harbor · Southwest · Trade Technical · Mesa · Miramar), 46 refused with reasons. |
| **Consumer guard** | `college_briefing.js` + `college_identity.js` now refuse a variant two colleges both claim. |

### ⭐ The design idea worth carrying: make the VISIBLE cap the binding one

Two caps bound the guidance block. The **character budget** is a meter the
Training tab renders; the **row cap** is invisible and evicts the *oldest* active
rule silently — which in a guidance layer is the standing naming rule, not the
reactive one written that afternoon.

20 was chosen to be **unreachable on purpose**: above what 9,000 chars can carry
(~17 at the observed ~525-char average). So a curator who runs out of room is
*told* by the meter rather than quietly losing work. Generalizes past this table.

Both cap pairs are now compared **file-to-file** in `tests/sierra_guidance.test.js`
rather than pinned to a literal, and the sent-cap fixture is sized from the
exported cap so it stops pinning the limit in a third place.

### ⚠️ The load-bearing line in the edge function

`fetchTeamGuidance` **fails soft**. A function deployed against a database
without the `kind` column would take **every** team instruction offline with
nothing reporting it. The kind-less retry makes (migration, deploy)
order-independent. Do not remove it.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8). Tags `sierra` / `guidance` / `college-identity`.
   Six rows were written this run.
2. `python3 kb/doctrine.py --changed` **before you write any code** (Session 179's tool).
3. §11 rows: **Sierra retrieval + corpus**, **College & district identity**.

---

## Carryover

| # | Item | Status |
|---|---|---|
| 1 | **Nothing is marked `display` yet** | The mechanism is built and tested; moving `TABLE_COLUMN_RULE` out of `index.ts` into a row is **Sam's authoring call**, not a session's. |
| 2 | **The Training tab is unverified in a real browser** | The kind picker, the per-kind meter and the "Display rule" chip have never been clicked. No session can — sandbox is egress-blocked. |
| 3 | **Smoke mode 7 red** | Run 113 failed ONLY mode 7's prose grep. **Mode 8 proves the capability is intact** (it named Long Beach City College, one of the colleges mode 7 wanted). Cause not separated: documented prose flake, OR the merged rule now telling Sierra to lead with articulators. One ~7-min paid run settles it. `cpl_memory`: `smoke-mode-7-red-is-emphasis-not-capability`. |
| 4 | **Sierra uptime monitoring** | Unfixed, and Sam has not picked an approach. See above. |
| 5 | **`/checkpoint` was NOT run** | §11, the lessons docs, `docs/INDEX.md` and `kb/cpl_todos.json` are **unrefreshed for Session 180**. The six `cpl_memory` rows are the only durable record besides this file and the PR body. **Consider running `/checkpoint` early.** |
| 6 | Everything in handoffs 173–180 | Untouched. |

---

## Patterns that worked

- **Measure before building.** The naive "strip a leading city name" rule was
  *probed first* and produced `Ana College`, `Monica College`,
  `Los Angeles College`. That probe is why the shipped rule uses the
  authoritative `district` field instead.
- **Ship the refusals.** The campus-short rule refuses 46 and accepts 6; the
  receipt carries both. A screen that silently drops candidates cannot be reviewed.
- **Fix the instance, then grep for its twin.** The variant-collision guard went
  into *both* consumers, not just the one that surfaced it.

## Mistakes worth not repeating

- ⚠️ **A generated artifact with an OPTIONAL input can be silently emptied.**
  Running the identity builder without `--observed-json` took the lint from
  **13 findings to 0** — a −135-line diff that looked like cleanup, on the one
  tab whose job is making absence visible. Caught by reading commit file stats,
  not by a test. **The rebuild command belongs beside the artifact.**
- ⚠️ **Never hand-type a UUID from an 8-char prefix.** A fabricated id made an
  `UPDATE` match zero rows; the consolidation silently stopped at 8 active
  instead of 7. Caught only by re-reading the table after the write.
  **Verify a write by reading it back, every time.**
- ⚠️ **GitHub renders `::error::` as `##[error]`** in job logs. Three tool calls
  were spent grepping for the wrong marker and concluding "0 errors" on a run
  that had failed.
- ⚠️ **Poll responses can be stale.** Session 180 read a run as "15 minutes in"
  when it finished in 6m33s, and built a (wrong) monitoring inference on it.

## Safety patterns to honor

- **Never force-push `main`** (Rule 5). **Rule 4** — `cmp` the two HTMLs.
- ⚠️ **Never deploy `cpl-chat` through the Supabase MCP.** Use
  `.github/workflows/cpl-chat-deploy.yml` (`workflow_dispatch`, `confirm: DEPLOY`).
- ⚠️ **Stop-hook nags in remote sessions are FALSE POSITIVES.** After a
  squash-merge the feature branch auto-deletes; the stale local tracking ref
  makes `main`'s own merge commit look unpushed. `git remote prune origin`.
  Do not amend, do not push.
- **Fresh live read at write time** before any `sierra_guidance` / `map_colleges`
  write (Rule 10) — Sam curates beside you.

## Your moniker

SkyShort suggests **SkyMeter** — this run's through-line was making the limit
that binds the one you can see. Coin your own if you prefer; Sam sometimes names
the session in his greeting, and that always wins.

**Sign off with your moniker AND the next handoff number** — e.g. *"SkyMeter
signing off. Next is Session 182 — `docs/session_182_handoff.md`."*
