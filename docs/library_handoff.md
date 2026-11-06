---
title: Library — side-lane handoff (SkyBeacon, beside the CPL Queue routine)
date: 2026-11-06
tags: [handoff, library, credential-catalog, cpl-ai, commons, side-lane]
related:
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/commons]]"
  - "[[docs/reference/lanes/reviewer-session-lifetime]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff; it does not replace the numbered `session_<N>_handoff.md`. **Full checkpoint** (SkyBeacon,
> 2026-11-06, ~22:10Z): lint (the lessons doc compacted: S468 to S509 moved verbatim to `library_lessons_archive_2.md`),
> the `cer-procedures`, `commons` and `reviewer-session-lifetime` lanes, the lessons doc, the KB note
> `methodology-refresh-token-before-write` (the draw-time half), the INDEX rebuild, this handoff, `cpl_memory`, the vault
> note, and `kb/status/exhibit.json` and `subjects.json`. Skipped: `kb/README.md` and `README.md` (neither names the
> Catalog builder or the tabs), the pipeline tab (no M-ID phase, auditor count or re-mint moved; the credential renames
> are CER merges), `kb/status/program-requirements.json` (the main queue's file).

Your moniker is **SkyHarbor**. You pick up after SkyBeacon on the **Credential Catalog** and **CPL-AI**
([`cer-procedures`](reference/lanes/cer-procedures.md)), the **CPL Commons** ([`commons`](reference/lanes/commons.md)),
and the Library ([`library`](reference/lanes/library.md)).

## What shipped (SkyBeacon, 2026-11-06)
- **#2853** (SkyLantern's, merged): the Exhibits List names each row's CPL-AI pairs.
- **#2854**: *Ask us to prioritize* only where no college has articulated the credential; Worth a faculty review cards ask.
- **#2855**: the CER applier's guarded retire path; Sam's "1 yes, 2 yes" written (receipt
  `kb/cer_decisions_out/2026-11-06-2/applied_2026-11-06T21-24-44Z.json`: 1 written, 4 retired), then
  `cred-rename-apply.yml` folded ServSafe Food Protection Manager and the two Wheel Alignment titles (2 confirmed merges).
- **#2856**: the Catalog's badges (Statewide recommendation, CPL-AI course match), the Recommendations filter, the List's
  Recommended column, a college's first view (*Recommended credentials <college> could adopt*, Request Quick Adopt), and
  CPL-AI's full recommendation in the panel. Live once `daily-dashboard.yml` writes `library/adopt/adopt_ai.json`.
- **#2857 (open at this checkpoint)**: the CPL Commons first view from Sam's recording: Details lines cut with their
  ellipsis; a note settles a weak mnemonic; the anchor findings are their own re-key item; Mark done and the done marks
  follow a renewable sign-in; the Commons, COCI Lookup and Funding redraw on the keeper's renewal.
- **#2858 (open)**: COCI Lookup is named **Courses and Programs** (key and addresses unchanged).

## Decisions Sam made this run
All in session, 2026-11-06: *"Coci lookup should really be renamed Courses and Programs"*; the Commons first view
*"need[s] attention"* (the recording); *"we tried to fix the lapsed token thing yesterday must not have worked for all
surfaces"*; he marked Monterey Peninsula done on CPL Pathways at 19:29Z: *"keep going to get everything you can and we'll
handle the outliers afterward"* (the CPL Queue routine reads it first).

## Open work, in order
1. **Merge #2858, #2859 (this checkpoint) and CPLBrain#694** when `test` is green on each head. #2857 merged
   (22:09Z) and `daily-dashboard.yml` was dispatched right after, to write `adopt_ai.json` (the Catalog's badges and
   college view), `kb/csr_out/latest.json` and `kb/status/commons.json`. Check its run, then the pages: the Catalog's
   badges on Pages; the Commons' Subjects card shows nothing waiting on a curator; Monterey leaves the band for a
   signed-in reviewer.
2. **Add your credential** (Sam: "yes, build the add your credential route"), as the `cer-procedures` lane's Next states:
   the form when search finds nothing, one INSERT-only function beside `credential_priority_request`, the rows in the
   Exhibits Requests view with Verify, Merge, Decline; Governance maps the write beside DR-31 and the privacy ADR's check
   first; migration through `supabase-migrate.yml`; record the state's license lists in `data_sources`. Nothing is built.
3. **The Commons' NEXT** ([`commons`](reference/lanes/commons.md)): Teach a rule on every reference; a stalled routine
   becomes a queue item; the confidence count for the CR rungs and the Course auditor; the other references' paths.
4. **CPL Pathways' own sign-in gate** (`program_requirements.js` `session()`, strict `isFresh`): it redraws on the
   keeper's announcement already; widen its draw gate only with its writes renewing first (the main queue's file; agree
   one writer with the CPL Queue routine).
5. **The Commons Exhibits List** takes the catalog's shape: routing a request from its line, credit status as one band,
   the analysis in the side panel. **Jev for the analysis** (a Score question per skill area, calibrated on the 25
   Security+ articulations).
6. Offered, unanswered: let the team phrase mark a Commons decision done (today reviewer-only, a decision right: his call).
7. The Library lane's standing *Next*.

## Watching
Nothing. SkyBeacon let go of #2858, #2859 and CPLBrain#694 at sign-off (context at the WARN line); the check-in
`trig_01A4h4zRFQ2pCeLnY1DdZafB` fired and is spent.

> *Greetings, you are SkyHarbor, a Library side session beside the CPL Queue routine, see SkyBeacon's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*
