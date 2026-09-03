---
title: "Session 223 handoff — the counselor step is on the API, under 10 is the mask, and CollegeID2 is the key still to land"
created: 2026-09-03
updated: 2026-09-03
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 223

Suggested moniker: **SkyKey** if `CollegeID2` has landed and you make the `ppa`
cutover, **SkyDial** if Sam has set the dials (open since S218). Predecessors:
SkyCalm S220 → SkyLead S221 → **SkyCheck S222**.

## What S222 did

Three PRs on `cpl-project-tracker`, two on the `CPLBrain` vault.

**#1437 — the probe.** Sam asked for Pedro's new CPL lifecycle boolean checks on
the student MAP Custom Reports, *"the Counselor stage that signifies the
student met with a counselor and accepted their CPL."* A session cannot reach
the MAP API, so `kb/_probe_lifecycle_checks.py` runs first in
`discover-map-datasets.yml`: control, enumerate by `["*"]`, diff against the
daily fetch's request plus a WATCH list, bisect if a view will not enumerate,
then a PII-denylisted profile. It found six `'0'`/`'1'` columns on
`View_StudentAggregatedValues_APIDataset` (53,267 rows): CPL_Docs_Verified
27,949 · Transcribed 17,342 · Ed_Plan_Created 4,423 · Analysis_Completed 4,267 ·
Counselor_Verified 3,429 · Student_Verified 3,293. The six are in the daily
fetch. `CollegeID2` is on none of the four views.

**#1438 — the attestation.** Sam ruled the funding measure reads
`Counselor_Verified` alone. One tuple entry in the builder's sweep; `pac`
publishes from the 2026-09-03 run: 2,820 students · 24,699 units · 18 colleges.

**#1439 — the under-10 package.** His "applied but no eligible" worklist for
Malone and Pedro had zero rows at either grain; the shape was our artifact
baking `ppa` raw beside a masked `ppe`, and `earnFraction()` scoring the mask as
f=0 left 54 small-portal colleges at $0 on Access. Sam ruled, and it shipped:
every count masks under 10, no carve-outs; unit sums never mask; a lone masked
college gets a complementary mask; public earned dollars read "<$1,000" or the
nearest $1,000, curator exact; the rate and the explainer stay public. Verified
on the re-baked artifact: no count of 1–9, no unit key masked, 57 colleges earn
on Access. The funding lane file was compacted from 36.7 KB to budget.

## Sam's decisions this run (record, don't re-derive)

1. **The Counselor stage** *"signifies the student met with a counselor and
   accepted their CPL"*; the funding reads **`Counselor_Verified` alone**.
2. **`CollegeID2`** identifies where the student originated before the CR
   college and **is what the NC FTES calculation will use**. Until it lands,
   origin is one Yes/No field: **`Potential Student` is the public-upload flag.**
3. **Why the steps are funded:** *"the lifecycle checks are still in early use
   at the colleges, which is why we are funding the use of counseling and
   transcribe steps."*
4. **Public counts under 10 read "<10"** (FERPA practice); **the FTES total and
   the funding still compute on the true numbers** (*"sufficiently buried"*).
5. **Public dollars:** *"Would it also work to list the total as <1000"* — yes;
   "<$1,000" or the nearest $1,000 on the public page, exact for curators. The
   rate and the explanations stay public.
6. **Decisions arrive as plain-language questions** — *"ask it in the form of a
   question in plain language so I can make the right decision."*

## ⭐ THE THING WORTH CARRYING FORWARD

**A masked key beside a raw one reads as a data anomaly.** The hunt for bad
records was a hunt for our own inconsistent suppression, and it had money
attached: a mask that scored as zero was a funding error dressed as a privacy
measure. Second: **a floor lives in fixtures as well as code** — four jsdom
suites pinned the old number (KB note
`methodology-a-floor-lives-in-fixtures-as-well-as-code`). Third: **wiring a
column silences a diff that is taken against the request** — the probe's WATCH
list exists because the day the booleans were wired, "NEW: none" was true and
useless.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` — compacted lane truth:
   the measures, NEEDS SAM ⓪–⑤, NEXT ⓪–⑦.
2. `docs/reference/lanes/map-custom-reports.md` — the booleans, the API's
   instrument change, CollegeID2 (NEXT ①).
3. `docs/kb-notes/adr-funding-counts-mask-under-10-units-carry-the-money.md`.
4. `docs/map_custom_reports_lessons.md` §(a)–(h) and
   `docs/cpl_funding_lessons.md` §2026-09-02 → 03.
5. `cpl_memory` — `author = 'session-222-skycheck'` (18 rows); Rule 8: query
   before you work.
6. `kb/docs_audit/latest.json` — run `python3 kb/_docs_audit.py` fresh.

## Priority work, in order

1. **`CollegeID2`.** The day Pedro says it has landed: Actions → *Discover MAP
   datasets* (the probe is the first step), confirm the spelling and which
   views carry it, make the `ppa` cutover (lane NEXT ①), re-run the earn
   diagnostic. Ask Sam whether both views the daily pull reads will carry it.
2. **Sam's open reactions** — NEEDS SAM ③ (calm pass) and ④ (explainer as the
   one public view; retire `cpl_funding_public.html` to a redirect).
3. **If he has set the dials** (Accepted 25% / factor 1.0; Eligible 40% ·
   Accepted 25% · Transcribed 35% — HIS to set through the tab) — re-run the
   earn diagnostic and report the spread.
4. **NEEDS SAM ⑤** — whether COBI keeps showing "<10" until the public/private
   split lands a gated copy of the artifact.
5. NEXT ②–⑦ as time allows (briefing display names; dead CSS; editable prose
   on request; the redirect follow-ons; the layout harness; the dead prototype
   check and the stale explainer snapshot).
6. **Corpus debt, out of this run's scope but flagged:** `cpl_funding_lessons_archive.md`
   is 246 KB against 150 KB; `docs/cpl_funding_lessons.md` is at 109 KB of 120.
   The next append rotates first.

## Patterns that worked

- **Measure before you write a word.** The worklist Sam asked for had zero
  rows; the answer was the measurement, and it pointed at us.
- **Put a recurring puzzle to Sam as one plain question** with a proposed
  disposition; he ruled in one message and improved the proposal himself.
- **Run the FULL `npm test`, in the background, before the push** — the
  builder suites you edited are not the suites a floor change touches. Then
  re-run only the fixed files, and let CI's `test` be the merge gate.
- **A runner is the session's window onto a host it cannot reach.** Read the
  run log through the GitHub MCP; keep identifiers out of it.
- **The vault push after a merge needs the stale tracking ref pruned**
  (`git remote prune origin`, then a plain push creates the branch again).

## Safety patterns to honor

- **`cpl_memory` rows from this session are INSERT-only under author
  `session-222-skycheck`** — rollback is
  `delete from cpl_memory where author = 'session-222-skycheck'`.
- **Shares / factors / titles / pins / text are curator edits through the
  tab**, never SQL. Never re-derive an allocation — call `_alloc()` /
  `_prios()` / `_effective()`.
- **No student identifiers in a workflow log** (the repo is public):
  `MAP Internal StudentID` and `StudentMAPID` are used in memory only.
- **The sunshine rule still holds** for outward materials.
- **Never force-push `main`; the stop-hook's "unpushed commit" nag after a
  squash-merge is a documented false positive** — confirm with
  `git log origin/main..HEAD` and do nothing.
- **Artifact policy:** code-only PRs; dispatch `daily-dashboard.yml` after the
  merge and verify the published shape (the scratch script this run used
  measured floor, masked cells, unit keys and the Access earners).
