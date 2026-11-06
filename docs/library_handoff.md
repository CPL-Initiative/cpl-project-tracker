---
title: Library — side-lane handoff (SkyLoop, beside the CPL Queue routine)
date: 2026-11-06
tags: [handoff, library, credential-catalog, noncredit, side-lane]
related:
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff. It does **not** replace the numbered `session_<N>_handoff.md`: the main queue's handoff names its own
> moniker, and this file stays out of its way. Light checkpoint (SkyLoop, 2026-11-06, ~16:30Z): the two lane files, this
> handoff, `cpl_memory` (two rows), the docs lint and the INDEX rebuild. Skipped: `kb/README.md`, `README.md`, the lessons
> doc, KB notes, the pipeline tab (nothing moved there). SkyAerial's deferred set (To-Do feed, pipeline tab, kb/README, root
> README, lessons doc, KB notes) stays deferred: none of it changed this run.

Your moniker is **SkyLantern**. You pick up after SkyLoop (2026-11-06) on the **Credential Catalog** (the Exhibits lane's
public face, [`cer-procedures`](reference/lanes/cer-procedures.md)) and the Library ([`library`](reference/lanes/library.md)).

## What shipped (SkyLoop, 2026-11-06)
- **Sam's noncredit visual, Draft 1** (*Noncredit to Credit: How Noncredit Learning Can Result in Credit*, `cpl_library`
  5e29e1d3…): mock https://claude.ai/artifact/Wi6htw18rtQ9WCM6ajtmnM (Version 3), draft row 5b5f9e8a… on the record,
  source `CPLBrain/04-projects/cpl-initiative/noncredit-to-credit/` (CPLBrain PR on `claude/jolly-newton-aey20k`). His three
  reactions of the hour are in it, and his correction (the Chancellor's film is her address to the 7th Annual CPL Summit).
  **Published at his word** (*"visual looks great! go with it"*, ~16:10Z): the Pages copy
  `library/noncredit-to-credit-how-noncredit-learning-can-result-in-cre-mw53clp5/` (live once the tracker PR merges and Pages
  deploys), the record Approved, Version 1, listed in the public library (receipt
  `kb/receipts/cpl_library_noncredit_draft1_2026-11-06_skyloop.sql`).
- **The catalog's statewide route, as Sheet 162 ruled it:** *Ask us to prioritize this credential*; one INSERT-only function,
  one aggregate count, the count beside the credential; DR-31; migration routed through `supabase-migrate.yml`
  (`kb/migrations/.apply`; the MCP apply waited on a confirmation and timed out). Tracker PR on `claude/jolly-newton-aey20k`.
- Merged: #2846 (SkyBackflip's item 0, the noncredit visual, into this handoff).

## Open work, in order
1. **Merge the tracker PR on green `test`**, then confirm `supabase-migrate.yml` applied `credential_priority_requests`
   (the apply job runs in the `database` environment; if it waits on a tap, tell Sam). Until it applies, the page's form
   says the request could not be sent and the counts read fails quietly.
2. **The noncredit visual is public once the PR merges:** run `npm run a11y -- library-noncredit` on the Pages copy and note
   the result on the record's Version 1 (a receipted update); any later change Sam asks for goes through the card's Revise
   (the page is its own source; the vault keeps the file).
3. **The Commons Exhibits List** takes the catalog's shape (the lane's *To add* list), now including the public requests as
   a queue item with its count (`credential_priority_requests`, team read).
4. **Jev for the analysis:** a Score question per skill area, calibrated against the 25 Security+ articulations; replaces the
   lexical score in `kb/_build_adopt_align.py` in place.
5. The Library lane's standing *Next*.

## Decisions Sam made this run
- On the noncredit visual (in session, 15:49Z and 15:58Z): the student card names the college landing page as an
  alternative; the intro stays general (*"I forgot about Calbright!"*); *merits* for *carries* wherever possible; naming
  colleges and programs in the six ways is fine; embed links wherever they fit (Cabrillo's mirrored-course examples).

## Let go
The tracker PR and the CPLBrain PR are subscribed until they merge; the artifact watch on the mock ends with the session.
No scheduled wake.

> *Greetings, you are SkyLantern, a Library side session beside the CPL Queue routine, see SkyLoop's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*
