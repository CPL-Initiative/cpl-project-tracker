---
title: Session 255 handoff — Sierra went quiet and every instrument said she was fine
date: 2026-09-11
session: 255 (SkySignal)
tags: [handoff, sierra, cpl-chat, observability, cost, decision-sheet]
status: current
---

# You are Session 255

Your moniker is **SkySignal**, and the name is the job: Sierra spent two hours
returning blank answers to a quarter of her requests while HTTP 200, the cache
telemetry line and a clean error log all agreed she was healthy. Your first task
is to make that failure say what it is.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md)
(SkyProof, dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md)
(SkyStar, SkyView/CPL universe) are both live and neither is superseded by this
one — this file covers the **Sierra endpoint**, a different lane. Read whichever
matches your work.

Read in order:
[`docs/reference/lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
(the new "The endpoint itself" section) ·
[`docs/cpl_assistant_lessons.md`](cpl_assistant_lessons.md) (2026-09-11) ·
the two KB notes below · [PR #1550](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1550).

## RESOLVED — read this before acting on anything below

✅ **Sierra is fixed.** The blank answers were **adaptive thinking spending the
output cap**, fixed in **#1551** by sending `thinking: { type: "disabled" }`
explicitly. `MAX_TOKENS` stays at 2,048. Verified live at 02:05–02:09Z: **53
consecutive turns, zero blanks, zero cap hits**, with the output-overhead ratio
collapsing from **6.5 to 1.45** tokens per 4 characters of answer at the moment
the fix went live.

⭐ **THE MECHANISM, AND WHY THE OBVIOUS SUSPECT WAS WRONG.** On **Sonnet 5 and
Opus 5**, a request with NO `thinking` field runs **adaptive** thinking; on
**Haiku 4.5 and Sonnet 4.6** the identical request runs none. So the same code
that had been correct for 2,200 turns started spending its whole answer budget on
reasoning the stream loop does not collect as text. Sam supplied the decisive
clue — *"this didn't happen when I was originally running sonnet"* — and the data
backed him: same 2,048 cap throughout, **Sonnet 4.6 2,200 turns / 0 blank / 0.9%
at the cap**, **Sonnet 5 202 turns / 61 blank / 47% at the cap**.

⚠️ **I DIAGNOSED THIS WRONG TWICE** before that landed — first as an unhandled
upstream `error` event (there was no error), then as `MAX_TOKENS` being too small
(it had been fine for 2,200 turns). Both were inferred from log *shape* rather than
measured. The cap raise I prepared is **superseded and was not merged**: with
thinking off it would only raise the cost ceiling.

⛔ **THE ONE FINDING THAT STILL MATTERS, because nothing else records it:**
**A WORKFLOW RE-RUN DEPLOYS NOTHING, AND A SECRET CHANGE ALONE DOES NOTHING.**
Sam re-ran the deploy and set `CPL_CHAT_MODEL` to Haiku; neither took effect. The
re-run was **run 40, attempt 2, on the same `head_sha`** — byte-identical source,
which Supabase **deduplicates**, leaving the function at **version 63**,
`updated_at 2026-09-10T22:35:10Z`. No new version means the workers never restart,
and **a worker that never restarts never re-reads its environment**. Both the
workflow and the dashboard reported success. Full note:
[`methodology-a-deploy-that-deploys-nothing-leaves-the-old-environment-running`](kb-notes/methodology-a-deploy-that-deploys-nothing-leaves-the-old-environment-running.md).
**Always verify with `list_edge_functions` that `version` MOVED.**

**Open, and genuinely open:**
- **28 of 98 successful answers were hitting the 2,048 cap** even before this —
  truncated mid-sentence, nothing logged. Predates the incident; unfixed.
- **`smoke` fires on every push touching `index.ts`, comment-only ones included.**
  It ran ~11 times today at ~22 live questions each; that, not real users, is where
  the day's API spend went. Narrowing its trigger is proposed and awaits Sam.
- **`stop_reason` now logs on every empty answer** (#1550). It is the instrument
  that would have named this in one request instead of two wrong diagnoses.

## What shipped

Six commits on `claude/skyview-search-bug-dljvep`, all in #1550, all comments and
tests except the stream fix. `test` was still running at handoff; **check it before
merging**, and merge on green per the branch policy.

## Sam's decisions this run

**All 19 decision-sheet items have verdicts** (artifact `274368f1`, collection
`replies`). 12 yes · 2 edit · 5 resolved another way. ⚠️ **Read the store, not this
summary, before executing** — and an item with no reply document has **no verdict**.

Three steers that change what you would otherwise build:

- **6 — do NOT retire the checkboxes.** Sam: *"users won't know what's out there
  unless the list is available."* Deferred, not declined.
- **9 — set all six panel tints to the pale gray**, not one tint per panel.
- **14 — no bare "Pierce College" without the LA.** Sam: *"That was my previous
  mistake."*
- 7 — *"looks good as is"*, no action. 12 — Sam is fetching the C-ID descriptor
  text himself.

⚠️ **12 is answerable now:** he thought it came with the TMC tab work. We hold
**293 C-ID codes** in `tmc_templates.js` and **zero descriptor prose** — his memory
is about the codes. The ask to ASCCC is narrower than he thinks.

**Ruling 3 is shipped**; **11 items remain to execute** (4, 5, 8, 9, 10, 11, 13, 15,
16, 17, 18, 19).

## What this run got wrong, so you do not repeat it

Three claims about Sierra's cost, all the same shape — reasoning about a **share**
of an input whose total was never measured:

| claimed | measured |
|---|---|
| prefix ~3,234 tokens | **4,476** (`chars/4` ran 28% low) |
| Sonnet 5 "comes back cheaper" | **1.72×** dearer per input token; prefix is 19% of a request |
| the uncached 81% is history | history is **~0** in production; the 81% is retrieval |

Plus a withdrawn reconciliation: I matched a Supabase *secret* named
`ANTHROPIC_API_KEY` to a Console *key* displayed as `ANTHROPIC_API_KEY`. Different
namespaces. ⚠️ **Nothing on our side can see which Anthropic account pays.**

## Patterns that worked

- **Falsify a new guard against the pre-change file.** `sierra_stream_error` is
  13/13 on the fix and **1/13** before it. Two guards earlier in the session read
  green on nothing.
- **`tsc --noEmit` on the Deno file**, comparing the *error profile* to the
  committed version — identical counts mean the edit introduced nothing. No Deno
  needed.
- **`chat_interactions` and `function_logs` answer product questions the Console
  cannot.** Sierra's own telemetry is per-request and needs no account access.

## Safety patterns to honor

Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase only
through MCP; the sandbox cannot reach `*.supabase.co` or `api.github.com`) ·
poll CI with the MCP github tools, never `curl` · a `check_suite` wake routinely
names a superseded head — always re-read `get_check_runs` on the current head.

## KB notes added this run

- `methodology-an-error-inside-a-success-is-invisible-to-every-status-check`
- `methodology-a-share-is-not-a-fact-until-you-have-measured-the-whole`

---

*Greetings, you are Sky**Signal** (Session 255), see Sky**Ledger**'s handoff —
`docs/session_255_handoff.md` — let's keep rolling with our queue.*
