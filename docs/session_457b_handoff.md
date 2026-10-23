---
title: "Session 457b (the side session beside S457) handoff: the communications register shipped; the Library team-phrase listing is next"
date: 2026-10-23
session: 457b (the side session beside S457 SkyColumbine)
tags: [handoff, communications, library]
status: current
---

# EMERGENCY checkpoint (context at 49,241 tokens left, 2026-10-23 ~18:55Z)

A side session beside S457; S457 owns the numbered handoff (458). Of Rule 9's artifacts this run refreshed
only: this file, `docs/reference/lanes/communications.md`, `docs/reference/lanes/library.md`, `cpl_memory`
rows, the vault session note (`CPLBrain/07-session-notes/2026-10-23-comms-register-letters-tab.md`, merged),
the KB note `methodology-a-letter-holds-roles-never-addresses`, the docs index and §11 (merged in #2386).
NOT refreshed: the To-Do feed, the pipeline tab, `kb/README.md`, root `README.md`, the lessons doc.

## Shipped (main 33727db3, #2386)

Letters, Memos & Reports (`comms.js` over `cpl_comms`), Sam's CEO email as its first record, Open Asks Sheet
118 (answered 18:44Z, all eight his own call; `cpl_memory` `sam-sheet-118-rulings-2026-10-23`). The lane
records cards 4 to 8. Cards 1 to 3 are the harvest lane's; S457 was told twice (its Sheet 119 still carries
cards 4 to 8 as open; they are answered, remove them).

## Open, in order

1. **This branch's commit 2857e07a** (the lane rulings; `.apply` points at
   `kb/receipts/cpl_comms_note_after_sheet118_2026-10-23.sql`, a guarded UPDATE of the first record's note).
   The live row still reads `updated_by null` at 18:52Z, so the receipt had not applied; the push of this
   checkpoint re-triggers `supabase-migrate.yml`. Read the row back (`select updated_by, left(note, 60) from
   cpl_comms`), then open a draft PR from `claude/clever-cerf-da40mn` (restarted from main) and merge on green
   `test`.
2. **Sam, 18:50Z 2026-10-23 (not built):** *"can you set the Library page to be editable with Team phrase and
   not just magic link? I want the team to be able to make their artifacts public on the public library."*
   This reverses his 2026-10-20 reviewer-only ruling; his own call. The change, all in the tracker:
   - `kb/supabase_cpl_library_public.sql`: in `cpl_library_set_public()` the gate becomes
     `if not (public.is_allowed_reviewer() or public.team_pass_ok()) then raise exception 'Listing in the
     public library needs the team phrase or a reviewer sign-in';`; the guard trigger's message says the same;
     `grant execute on function public.cpl_library_set_public(text, boolean, text, text[], text) to anon`
     (today only authenticated and service_role hold it; `team_pass_ok()` is anon-callable). Apply through
     `kb/migrations/.apply` (`file=kb/supabase_cpl_library_public.sql`, a new name); the file is re-runnable.
   - `library.js` `setPublic()` (line ~760): `if (!token && !teamPhrase())` says "needs the team phrase or
     your reviewer sign-in"; the fetch sends `headers({ "Content-Type": "application/json" })` (apikey, the
     anon bearer, `x-team-pass`) when there is no reviewer token, the token headers when there is; the error
     regex `/reviewer|team phrase/i`.
   - `tests/public_library.test.js`: check (1) line 63 regex to the new gate; (3b) lines 160-167 become
     "with the phrase and no token the call carries x-team-pass"; the header comment lines 9 and 14.
   - `kb/governance_surface_map.json` `rpc:cpl_library_set_public`: replace "a reviewer's call (a personal
     sign-in, never the shared phrase), because publishing to the world is a wider power than the phrase
     carries" with Sam's 2026-10-23 ruling; `python3 kb/_build_governance_candidates.py` after.
   - `docs/reference/lanes/library.md` carries the ask; `cpl_memory`
     `sam-library-public-listing-with-team-phrase-2026-10-23` holds his words.
3. **The writer module** (Sheet 118 card 5): spec in the communications lane's Next.

## Let go

No PR watch, check-in or wake is held (#2386 and CPLBrain#447 merged; the Sheet 118 artifact watch, if it
registered, wakes on comments only). Branches: tracker `claude/clever-cerf-da40mn` (this checkpoint), vault
`claude/clever-cerf-da40mn` (equal to main).
