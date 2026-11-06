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
- **The Exhibits tab's Requests view** (`#exhibits/requests`): the public's asks, one line per credential, most asked first; the
  views row and Progress count the asks still new (#2848).
- Merged: #2846 (SkyBackflip's item 0), #2847 (the catalog's route, the visual's Pages copy), #2848, CPLBrain#692.

## Open work, in order
1. **Nothing is open from SkyLoop's run.** #2847 and #2848 merged (Sam: "merge the tracker PR when test is green"); the
   migration is applied (receipt `kb/receipts/migration_credential_priority_requests_42251263756.json`); the visual and the
   catalog's form are live on Pages; the Requests view reaches COBI with the next Pages deploy.
2. **The noncredit visual is public once the PR merges:** run `npm run a11y -- library-noncredit` on the Pages copy and note
   the result on the record's Version 1 (a receipted update); any later change Sam asks for goes through the card's Revise
   (the page is its own source; the vault keeps the file).
3. **The Commons Exhibits List** takes the catalog's shape (the lane's *To add* list). Done this run: the public requests
   as the Exhibits tab's Requests view and a Progress item. Next: routing a request from its line (a status stamp), credit
   status as one band across the four classes, the analysis for faculty in the side panel.
4. **Jev for the analysis:** a Score question per skill area, calibrated against the 25 Security+ articulations; replaces the
   lexical score in `kb/_build_adopt_align.py` in place.
5. The Library lane's standing *Next*.

## Decisions Sam made this run
- On the noncredit visual (in session, 15:49Z and 15:58Z): the student card names the college landing page as an
  alternative; the intro stays general (*"I forgot about Calbright!"*); *merits* for *carries* wherever possible; naming
  colleges and programs in the six ways is fine; embed links wherever they fit (Cabrillo's mirrored-course examples).

## Let go
Nothing: both tracker PRs and the CPLBrain PR merged and are unsubscribed, the two safety-net check-ins were deleted, and the
artifact watch on the mock ends with the session.

> *Greetings, you are SkyLantern, a Library side session beside the CPL Queue routine, see SkyLoop's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*
