---
title: Library — side-lane handoff (SkyLantern, beside the CPL Queue routine)
date: 2026-11-06
tags: [handoff, library, credential-catalog, cpl-ai, exhibits, side-lane]
related:
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff; it does not replace the numbered `session_<N>_handoff.md`. **Full checkpoint** (SkyLantern,
> 2026-11-06, ~20:30Z, at the context WARN): lint, the `cer-procedures` lane (compacted back under budget), `kb/README.md`,
> `docs/library_lessons.md`, a KB note, the INDEX rebuild, this handoff, `cpl_memory`, the vault note and
> `kb/status/exhibit.json`. Skipped: the pipeline tab (no M-ID phase, auditor count or re-mint moved), `README.md`, and
> `kb/status/program-requirements.json` (the main queue's file; this lane did not touch the harvest).

Your moniker is **SkyBeacon**. You pick up after SkyLantern on the **Credential Catalog** and **CPL-AI**
([`cer-procedures`](reference/lanes/cer-procedures.md)), with the Library ([`library`](reference/lanes/library.md)).

## What shipped (SkyLantern, 2026-11-06)
- **#2850** the Catalog's List one line a credential (status and the ask as columns), tiles that follow every filter but
  Credit status, lazy loading, Worth a faculty review above.
- **#2851** CPL-AI hosted whole (`kb/cpl_ai/hosted/`, 33,232 pairs with full reports) and joined to the common exhibits
  (`kb/cpl_ai/exhibit_join.json`); the Exhibits view `#exhibits/cpl-ai`.
- **#2852** the seven CPL-AI title moves and the ServSafe fold as a reviewed plan, applied (receipt
  `kb/cer_decisions_out/2026-11-06/applied_2026-11-06T19-49-56Z.json`, 7 inserted, 5 replaced, 0 held); the applier takes
  the revise shape only.
- **#2853 (open, CI)** the Exhibits List names each row's CPL-AI pairs; this checkpoint rides it.
- **CPLBrain#693** the braindump of Sam's CPL-AI and badges words.
- **The badges mock**, approved: https://claude.ai/artifact/2FhevexZqhwdyMyuVT9vFu (Version 2, current).

## Decisions Sam made this run
All in session, 2026-11-06: host CPL-AI whole and frozen; join the 115; fix the seven titles; fold the ServSafe
duplicate; name the pairs on the List; feature recommendations as badges (*"like badges on the credential"*); *"I do want
the CPL-AI recs on public view"* (answers Sheet 147 card 5); the mock *"looks good"*, with a resizable panel and the
recommendation shown in place (*"trying to keep them on the main page and not have to hop around"*).

> **EMERGENCY checkpoint, ~20:25Z** (the context meter at its last line, after the full checkpoint `f41df3bf`): only
> this handoff, the lane line and one `cpl_memory` row were refreshed after it. Not refreshed since the full one:
> the INDEX rebuild, the lessons doc, `kb/README.md`, KB notes, the vault session note (step 11, never written this run:
> write it, with Sam's words on Cabrillo below), the status files, the pipeline tab.

**Sam, ~20:20Z, on the live Catalog:** *"I sorted for Cabrillo and see all their 207 exhibits and the ones they haven't
evaluated yet waiting for some attention--it looks easier to navigate that we had it thus far AND we're giving the user far
more data in the process."* And his rule: *Ask us to prioritize* only where no college has articulated the credential; an
articulated one offers Request Quick Adopt to its card on the MAP dashboard; the Worth a faculty review cards need the ask.

## Open work, in order
00. **Sam answered "1 yes, 2 yes" (~20:30Z)**: (1) retire the spent overrides on `_CREDENTIAL_REVIEW::Spanish 1` and
   `Spanish 2` (four rows by slee@cccco.edu, 2026-10-27); (2) confirm the merge of `Wheel Alignment, Chassis Dynamics, and
   ADAS` into `Wheel Alignment, Chassis Dynamics, ADAS`. Plan `kb/cer_decisions_out/<date>/` with his words as the ruling:
   (2) is an override row (already live, reads "written") plus a `unified_title_merge_confirm` insert, which
   `kb/_cer_decision_apply.py` takes today; (1) needs a retire path the applier lacks (a guarded DELETE of named live rows
   whose receipt keeps them, so `--rollback` restores them; Rule 10 a2), with a test. Dry run, commit, then
   `cred-rename-apply.yml` (read `kb/cred_rename_dryrun/alias_map.json`'s `apply_safe` first): it carries the ServSafe fold.
0. **Finish branch `claude/catalog-ask-vs-adopt`** (commit `55c0f660`, pushed, no PR yet): Sam's ask rule in
   `library/adopt/adopt.js` (articulated cards and panels carry no ask, Being reviewed included; each Worth a faculty
   review card asks and opens the request via `openReview`). `tests/public_adopt.test.js` reads 92/93: find the one
   failing check (`node tests/public_adopt.test.js | grep -v ^PASS`), fix it, run `npm run a11y -- public-adopt`, open the
   PR, merge on green.
1. **Merge #2853** when `test` is green (a wake is set for 20:36Z).
2. **The badges on the live Catalog** (`library/adopt/`), as the mock shows: *Statewide recommendation* (from
   `fact-sheet/statewide_recs.js`), *CPL-AI course match* (from `kb/cpl_ai/`), the Recommendations filter, the
   Recommended column, the panel's statewide and CPL-AI sections, the recommendation in place with its confidence, the
   panel's existing resize. Request Quick Adopt beside a strong course where a college awards it. Tests and `npm run
   a11y -- public-adopt public-adopt-list`.
3. **Answered (see item 00):** (1) retire the spent Spanish 1 and 2 overrides, (2) confirm the Wheel Alignment
   merge, so `cred-rename-apply.yml` can carry the ServSafe fold. Put it on the next sheet if he has not answered.
4. **Add your credential** (Sam asked for advice; offered): a second public write beside *Ask us to prioritize*, verified
   by the team before it shows; Governance first (DR-31, the privacy ADR). The state's license lists as a data source
   (the Pierce email: three insurance licenses no one holds).
5. Offered, unanswered: a draft reply to the Pierce Articulation Officer (Sam sends).
6. The Library lane's standing *Next*.

## Watching
#2853 (subscribed; check-in `trig_01TRiLT8q4XVfA9WayRjrpGB`); the mock's artifact watch. Let both go at sign-off.

> *Greetings, you are SkyBeacon, a Library side session beside the CPL Queue routine, see SkyLantern's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*
