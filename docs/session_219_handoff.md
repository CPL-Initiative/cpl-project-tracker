---
title: "Session 219 handoff — the bands shipped; Sam sets the dials, then re-run the earn diagnostic"
created: 2026-09-01
updated: 2026-09-01
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_221_handoff.md
---

# You are Session 219

Suggested moniker: **SkyDial** if you pick up the funding dials, **SkyProse**
if you take the explainer-prose fix (still open from S217).
Predecessors: SkyPort S216 (one-pool shipped) → SkyDeck S217 (the 9/02 deck +
the sunshine rule) → **SkyMeld S218 (the band consolidation, PR #1429)**.

## What S218 did (2026-09-01)

**Sam's consolidation shipped — PR #1429, squash-merged `724feac`.** The
Implementation Funding tab carried **two sections describing one allocation**
(the priorities and the §78093.2(d)(1) goals, stitched by a superscript). They
are now one, folded into **three bands**:

- **(A) Access** — Eligible
- **(B)+(C) Success** — Accepted · Transcribed
- **(D) Opportunities** — reported by the MAP and CO teams, no campus measure

Sam's calls, not the session's first proposal: Success pairs completion with
career attainment *"the same way we combine two aspects of Access"*; (D) is
named for the statute's own object rather than the pilot projects that are its
means; and the counselor gate went **on** the Applied measure rather than beside
it as a fourth.

**Band membership is DERIVED** from each metric's milestone (the same resolver
the earning math uses), with an **orphan band** so an unresolvable priority
surfaces loudly instead of vanishing. The goal spine survives as a fold — it is
the §78093.2(d)(2) artifact and the only place (C) reads honestly
funded-and-unmeasured. New milestone `accepted` → (B)+(C).

**Two measure sources declared** on the noncredit lane's declared-before-delivered
pattern: `ppe`/`ppe_u` (portal-origin eligible — emits from today's feed) and
`pac`/`pac_u` (applied on an accepted CPL Plan — omitted, not zeroed, until the
attestation column lands).

## Two things that landed AFTER the checkpoint

**1. The public explainer printed `$NaN`** (Sam caught it; fixed same day, PR
#1430). `funding-model/index.html` computed `hero = one_time - admin - scaling -
P.feeder; inst = hero + P.feeder` — the carve-out the one-pool model retired on
2026-08-31. `pool` no longer emits `feeder`, so `P.feeder` was `undefined` and
the "allocated to the 118 institutions" box rendered `$NaN` while the prose
beside it printed $25,240,308. ⚠️ **Every assertion in
`tests/funding_model_page.test.js` passed through it** — that suite reads the
page as TEXT, and a static check cannot see a NaN. It now also boots the engine
and asserts every `P.<key>` the painter references still exists in the payload.
⚠️ **This is the THIRD thing the one-pool port left stale on that page** (two
prose passages, still open as NEXT ①, plus this). The page is painted from the
payload in some places and not others, and only the unpainted ones lie — **an
audit pass over the whole explainer is worth more than fixing them as they
surface.**

**2. The CCCCO house voice is now doctrine** (PR #1431). Sam shared his VC of
Academic Affairs' letter to CSU as the standard for outward writing. Rules that
fire unprompted are in `CLAUDE.md` → Naming & terminology; the nine moves and a
before/after are in
[`reference-cccco-house-voice`](docs/kb-notes/reference-cccco-house-voice.md);
exemplars in `CPLBrain/04-projects/cpl-initiative/resources/`; the mechanical
floor is linted by `house_voice` in `kb/_docs_audit.py` (informational, 21 open
findings, nearly all `leverage`). ⚠️ **Scope is deliberate** — outward artifacts
only. Lane files, handoffs, commits and code comments stay dense; register
follows audience. ⚠️ **Anything worth being an exemplar belongs in
`resources/`, not a session upload** — a committed document can be consulted, an
uploaded one exists for a single session.

## ⭐ THE FINDING THAT MATTERS MOST

Booting the live model against the live feed measured what the priorities
actually earn. **The credit slice pays 34.0% of its cap, and 84% of that comes
from Access: Outreach — which 97 of 115 colleges already max out.** Completion
earns 16.1%; Access: Statewide 0.8% (0 colleges at full). `earnFraction()` caps
at `min(1, actual/target)`, so an over-target measure is an automatic payment.
Read as an incentive, the model mostly was not one. **Re-run this after the dials
move** — it is the lane's best single health check. KB note:
`methodology-a-measure-everyone-clears-incentivizes-nothing`.

## Sam's decisions this run (record, don't re-derive)

1. **Ship the consolidation now** — yes.
2. **Accepted at 25% share / factor 1.0**, starting set **Eligible 40% ·
   Accepted 25% · Transcribed 35%**. ⚠️ **HIS to set through the tab** — *"I
   don't want you to fix it; I want the tab to save it."* Never session SQL.
3. **Filter Access now**, without waiting for origination data — *"let's wire
   this as if we have the needed data."*
4. **Either the student or the counselor/coordinator/initiator** may check the
   counseling step; the **attester is recorded in the audit trail**.
5. ⚠️ **CORRECTION Sam made:** the counselor step **CAN** be batch-loaded,
   legitimately — colleges batch upload previously transcribed CPL from their
   SIS on the assumption counseling happened first. It is a **policy
   attestation, not a technical guarantee**; its integrity rests on the CO
   instruction (stop auto-awarding, confirm acceptance, then check) plus the
   audit trail. **No surface may claim it is batch-proof.**

## Read in order

1. `docs/reference/lanes/implementation-funding.md` — lane truth (the earn
   diagnostic, the dials with their derivation, NEEDS SAM ⓪–②, NEXT ⓪–④).
2. `docs/cpl_funding_lessons.md` §2026-09-01 — the full story, written once.
3. `kb/docs_audit/latest.json` — run `python3 kb/_docs_audit.py` fresh.

## Priority work, in order

1. **If Sam has set the dials** — re-run the earn diagnostic (boot the model,
   sum `cap × earnFraction` per priority across the roster) and report the new
   spread. That is the whole point of the restructure.
2. **One request to Pedro carrying all three feed additions** — lifecycle
   booleans (sent 2026-09-01), Origin/LocID2, and **completions** (a NEW MAP
   view; `View_StudentAggregatedValues_APIDataset` has no award column and
   `View_ProgramsofStudy_APIDataset` is a program catalog).
3. **AUDIT THE WHOLE EXPLAINER, don't fix it defect by defect.** Three things
   the one-pool port left stale have now surfaced one at a time. Two remain
   (open since S217): step one sizes on credit FTES over "all 115 … 1,069,182"
   (one-pool sizes on COMBINED over 118) and step three says factors are 1.0
   (live Year-1 is 0.5). The painter only overwrites elements with ids, so no
   repaint corrects a sentence. **Walk every figure and every load-bearing
   claim on the page against the payload once**, and give each an id or delete
   it — that is cheaper than a fourth surprise.
4. **Sam's open display call** — Annual-view earning % can read >100%.
5. **Cleanup commit** — dead CSS for retired row shapes.

## Patterns that worked

- **Measure the candidate before adopting it.** Three measures were proposed and
  each looked good until measured: story counts (14 of 118 colleges, 3 of 36
  career destinations), origination-filtered Access (104 portal students
  statewide, 0.27%), the counselor step (adopted). Boot the model, don't reason.
- **`scripts/funding_effective.js` + `_prios()`/`_alloc()`** answer dial and
  allocation questions live. Dump the config with the Supabase MCP and **verify
  its md5** before trusting a local copy — never hand-transcribe.
- **Mutation-test a new guard.** Reintroduce the bug and confirm exactly that
  assertion goes red. A guard that cannot be shown to fail is decoration.
- **Read every CI log.** Three failures this run had **three different causes**;
  assuming the previous fix covered it would have been wrong twice.

## Safety patterns to honor

- **Shares/factors/titles/pins are curator edits through the tab**, never SQL.
- **Never re-derive an allocation or a dial** — call `_alloc()`/`_prios()`/
  `_effective()`. Baked defaults in `cpl_funding_data.js` are stale by design.
- **The sunshine rule still holds** — outward materials carry the model's
  general principles only (no figures, weights or counts) until CO leadership
  confirms.
- **`--update-floor` rewrites EVERY file's floor** — review the ledger diff
  before committing; a LOWER floor is a check that stopped running.
- Expect **two of three measures at ~$0** until the feeds land, so the Summary
  shows a large uncommitted balance. Intended, not a defect.
- **`--update-floor` and `--apply` are the only mutating switches** in the docs
  tooling; both rewrite broadly, so review their diff before committing.
- **Write outward artifacts in the house voice** (above). Internal working
  memory stays dense — do not flatten a lane file to correspondence register.
