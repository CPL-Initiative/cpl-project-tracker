---
title: Session 133 handoff (SkyHigh → next) — the action library was already written; build the briefing
created: 2026-08-09
updated: 2026-08-09
tags: [handoff, college-action-page, contacts, funding, provenance, briefing]
related:
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/map_users_lessons]]"
  - "[[docs/kb-notes/methodology-verify-the-last-hop-of-a-resolution-chain]]"
  - "[[docs/kb-notes/methodology-a-tier-must-encode-what-you-could-not-check]]"
superseded: true
superseded_by: session_134_handoff.md
---

# You are Session 133

Previous session was **SkyHigh (132)** — one PR merged (#1078), a checkpoint, and
two findings that change what you build. Sam named it at greeting. He also
greeted with *"see SkyTime's handoff 130 (I think)"* — it was **132**; the
highest-numbered `docs/session_<N>_handoff.md` is always the authoritative one,
and greetings routinely cite a stale number. Take a name or coin one.

## Read first, in order

1. This file.
2. `docs/college_action_page_lessons.md` § **2026-08-09 SkyHigh** — the story.
3. `docs/kb-notes/methodology-verify-the-last-hop-of-a-resolution-chain.md` —
   **before you read a single number out of `cpl_funding_data.js`.**
4. `docs/kb-notes/methodology-a-tier-must-encode-what-you-could-not-check.md` —
   before recording anything you could not verify.

## ⚠️ TWO QUESTIONS ARE OPEN WITH SAM — ask again before building

He was away when I asked and never answered. **Both change what colleges see.**

1. **Scenario 1 or Scenario 2?** `cpl_funding_config` holds two, with different
   shares *and* different strategies. `activeScenario` in `cpl_funding.js`
   defaults to `"Scenario 1"`, which is the defensible assumption if he is still
   unavailable — but say plainly in the UI which one is being shown.
2. **Year 1 or Year 2?** **Scenario 1's Year 2 has no strategies at all.** A
   briefing aimed at the year ahead therefore has an empty action library. Year 1
   is the only year that works today.

If he is unreachable, build against **Scenario 1 / Year 1**, state the assumption
on the page itself, and make the scenario/year a parameter rather than a constant
so his answer is a one-line change.

## ✅ What is live

**#1078** — the seven colleges that had never been looked up. Queue went
never-looked-up **7 → 0**, search-only **0 → 7**, with proposals (14) and
looked-up-empty (4) **unchanged** as the control that the new bucket didn't
absorb the old ones. Full suite green (193 files).

Five candidates: Yuba `yubacounseling@yccd.edu` · Citrus
`counseling@citruscollege.edu` · Palomar `counseling@palomar.edu` · Saddleback
`sc-ecounselor@saddleback.edu` · Futuro Health `help@futurohealth.org`. Two
blank-with-a-finding: **Canyons** (only `ConnectsHelp@`, which is *technical*
support) and **Launch** (interest form only).

## ⭐ Finding 1 — the action library already existed

The roadmap called it *"the hard part — we know each college's STATE, not the
playbook that moves it"* and told us to seed it by hand. **The team had already
written it.** Supabase `cpl_funding_config` → Scenario 1 → Year 1 carries **23
concrete strategies** (10 P1 · 7 P2 · 6 P3):

> *"Act on all JST credit recommendations in MAP"* · *"Configure College CPL
> Landing site, including adding a CPL Request Email"* · *"Batch upload to MAP
> all transcribed CPL from 2023-24 to date"* · *"Ensure a CPL Coordinator and/or
> Counselor is listed and responsive"*

**They map onto state we already measure**, which is what makes the briefing
buildable — and every to-do can be a **fraction, not a checkmark** (SkyPlan's
rule; the Veteran Star taught colleges that uploading is the finish line):

| Strategy | Measured today |
|---|---|
| Configure CPL Landing site | which colleges have a live landing page |
| Coordinator listed *and responsive* | `primary_contact_email` blanks, incl. the 7 |
| Act on all JST credit recommendations | 1,051,870 units at Needs Action |
| Complete the Transcribe step | applied 111,779 → transcribed 60,246 (**54%**) |

## ⭐ Finding 2 — the documented source is the wrong one

CLAUDE.md said the overlay was *"currently EMPTY so defaults stand."* It is not,
and the active scenario disagrees with the baked file on everything a briefing
prints:

| | Baked `cpl_funding_data.js` | Live Scenario 1 |
|---|---|---|
| Shares | P1 30% · P2 42% · P3 28% | P1 **50%** · P2 **30%** · P3 **20%** |
| P1 description | completion through CPL awards | statewide **access** |
| P1 metric | Headcount eligible | **Applied CPL Units as FTES** |
| Strategies | none | **23** |

Both places are corrected now, but the lesson generalises: **an overlay exists to
be edited by people who never touch your docs, so "it's empty" is the least
durable sentence you can write about one.** Read every hop.

## ⚠️ A capability was lost, and no test will ever catch it

**Sessions are egress-blocked from college domains.** `curl` → `000`, `WebFetch`
→ `EGRESS_BLOCKED`, for every `.edu` host tried. Search results still work.

This invalidates a standing plan: the roadmap's offer that the **52 colleges with
a CPL Assistant** could get *"the same grind if wanted"* **is no longer true from
a session.** It needs a human with a browser, a runner with different egress, or
a curator. Nothing is broken — the environment moved under a documented plan.

That is also why the five addresses are `via: "search"` and not `via: "web"`.
A tier is a claim about **method**: `web` means somebody opened the page and
applied Jessica's rules, and those rules are rules about *what a page shows*.
`proposedFillFor()` refuses a search row **in code**, so none can reach the
"Proposed for MAP" column unconfirmed.

## 🎯 PRIORITY 1 — the college-facing briefing

Design calls already made; do not re-derive them:

- Open with a **rendered briefing, not a blank chat box.**
- Role is a dropdown that **tailors but never gates.**
- **Reuse `buildQueue(sources, now)`** from `map_team_queue.js` — it is pure
  (sources + `now` in, ranked items out). Do not fork the ranking rules.
- Leads with **opportunity**, never a ranking. Never rank colleges publicly.
- Resolve priorities through the **full chain including the overlay**.

⚠️ **Its top slot — inbound CPL requests — needs FRESHNESS, not the data.** Sam
probed this on 2026-08-09 and was right: **`cpl_status_plan` is 100% populated**
in `map_college_cr_unit` (204,714 rows, zero nulls — Needs Action 182,941 /
Not Applicable 15,272 / Applied to CPL Plan 4,572 / In Process 1,929). It came
in through **his Access import**, not the API. The old line — *"`CPLStatusPlan`
is in NONE of the nine views"* — is true only of the **API views**, and **two
sessions in a row read it as "we don't have the disposition data."** Keep the
questions apart: *do we have it* (yes) vs *is it fresh* (no). **Everything
except the inbound-request slot is buildable from what we already hold.**

Two forwardable asks now exist: `docs/map_custom_report_request_for_malone.md`
(the one-view ask) and **`docs/map_dataset_sql_for_malone.md` (#1085)**, which
gives server-side SQL for both datasets plus reconciliation counts so no view
needs publishing at all.

⚠️ I dispatched `discover-map-datasets.yml` to re-check whether the view got
published and **never read the result** — one workflow log, still unread.

## 🥇 Cheapest real work

**Confirm the five candidate addresses** — seconds each, links on the MAP Users
tab. Start with **Palomar** (it runs a *separate* Behavioral Health Counseling
Services, so confirm which department this is) and **Canyons** (whether anything
usable exists at all). Flip each to `via: "curator"` with a name and date.

## ⚠️ Things this session hit — don't re-inherit

1. **`mcp__github__actions_list` ignores the `workflow_id` filter** and returns
   the newest runs regardless; `minimal_output: true` does not shrink it either.
   Both return enormous payloads. Use `pull_request_read {method:"get"}` for PR
   state. I burned real context here — find the run id another way.
2. **The Bash tool's working directory reset to `/home/user` mid-session** after
   a background command. Use absolute paths, or `cd` in the same command.
3. **The stop-hook "N unpushed commits" nag fired** after the squash-merge. It is
   the documented false positive — HEAD's committer is `noreply@github.com`, 0
   commits vs `origin/main`, ancestor of main, remote branch auto-deleted. The
   count is measured against the **stale local tracking ref**.
   `git branch --unset-upstream` clears it. **Do not push.**

## Patterns that worked

- **Check the repo before generating.** The action library, which the roadmap
  called the hard part, was already written and one SQL query away. This is now
  three sessions running where the best catch came from reading a committed
  artefact rather than producing a new one.
- **Re-measure the handoff.** SkyTime's numbers held this time — but the *docs'*
  numbers did not, and only measuring told them apart.
- **Positive control beside every negative assertion.** "Search rows never
  propose" is paired with one proving the candidate *does* carry an address (so
  deleting the entry cannot pass it) and one proving a web row *still* proposes.
- **Let the existing test object.** `fallbacks: every entry declares a
  provenance` failed first and correctly, forcing the new tier to be declared
  rather than slipped in.

## Safety patterns to honour

- Never route per-student rows through a session's context. Aggregates only.
- Sandbox cannot reach `*.supabase.co` — all Supabase access via MCP.
- **Never commit any MAP export** — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- Rule 4: `CPL_Dashboard.html` and `index.html` stay byte-identical. (Static JS
  like `map_users.js` needs no mirror — one file serves both.)
- **Sam runs concurrent sessions** — he flagged one on the memory repos on
  2026-08-09. Re-pull before writing docs and say what you are about to overwrite.
- Deploying `cpl-chat` reaches production with no staging tier.

## Moniker

**SkyBrief** is still the obvious one — the briefing is finally unblocked.
