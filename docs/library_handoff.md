---
title: Library — side-lane handoff (SkyAerial, beside the CPL Queue routine)
date: 2026-11-06
tags: [handoff, library, credential-catalog, side-lane]
related:
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff. It does **not** replace the numbered `session_<N>_handoff.md`: handoff 592 names the main queue's
> moniker, and this file stays out of its way. Checkpoint under context pressure (2026-11-06, ~14:40Z, the meter at
> ~100,000 left): the lane file, this handoff, `cpl_memory` and the sheet's card are refreshed. Skipped: `kb/README.md`,
> `README.md`, the lessons doc, KB notes, the pipeline view, the other status files, and **publishing** Open Asks Sheet
> 162 (built in the vault, unpublished; the next session publishes it with `capabilities: {db: {}, comments: {}}` and
> hands Sam the link).

Your moniker is **SkyLoop**. You pick up after SkyAerial (2026-11-06) on the **Credential Catalog** (the Exhibits
lane's public face, [`cer-procedures`](reference/lanes/cer-procedures.md), *The Credential Catalog, ported from the
mock*) and the Library ([`library`](reference/lanes/library.md)).

## What shipped
- **The Credential Catalog port** (PR on `claude/optimistic-cannon-hlzbco`, merges on green `test`): everything the lane
  entry lists, from the mock https://claude.ai/artifact/2r9apBWRRiaYS6CNqYy3Ds (v8). Two new builders write
  `adopt_more.json` and `adopt_align.json` daily; the first daily run after the merge fills the analysis from the live
  course outcomes (the committed file holds a 20-course sample).
- Merged earlier today: #2839, #2840, #2842 (lane notes, the portal as a data source); CPLBrain#686, #688 (Sam's words).

## Decisions Sam made this run
- The catalog is the registry's beginning; the public sees every credit status; public words on the page, curation words
  in the Commons; Show folds into Credit status; A for a could-adopt cell; tiles stay on the public page, 101 is right;
  "Request an evaluation" over "Request Adopt" for an unevaluated credential; "let's roll with this".

## Open work, in order
1. **Merge the port PR on green `test`**, then **Sam's eyes on the live page** once Pages deploys (the matrix, the List
   with Not yet evaluated, a panel's analysis on CompTIA Security+).
2. **Publish Open Asks Sheet 162** (the statewide intake card; `CPLBrain/decision-sheets/open-asks/2026-11-06-open-asks-162.html`),
   put its link in CLAUDE.md §11, and read the reply before building the write surface.
3. **The Commons Exhibits List** takes the catalog's shape (the lane's *To add* list).
4. **Jev for the analysis:** a Score question per skill area, calibrated against the 25 Security+ articulations;
   replaces the lexical score in `kb/_build_adopt_align.py` in place.
5. The Library lane's standing *Next*.

## Let go
Nothing watched or scheduled once the port PR merges (the session subscribes to it and merges it itself). The artifact
watch on the mock ends with the session.

> *Greetings, you are SkyLoop, a Library side session beside the CPL Queue routine, see SkyAerial's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*
