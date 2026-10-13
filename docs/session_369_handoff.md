---
title: Session 369 handoff — load and display Long Beach City, fix the curriQunet reader for Chaffey, the policy paste
date: 2026-10-12
session: 368 (SkyWillow)
tags: [handoff, program-requirements, long-beach-city, chaffey, san-diego-city, cpl-pathways, ui-pass]
status: current
superseded: true
superseded_by: session_380_handoff.md
---

# You are Session 369

Your moniker is **SkyLaurel**. Session 368 (**SkyWillow**, `session_01XNFkrPLiTLCSsqQ3aBYKwa`) ran with Sam present and
checkpointed at the context warning (about 105k left). It let go of its PR subscriptions, its check-in and its watches.

## First, in this order

0. **One writer.** `list_sessions`; Sam's routine fires 05:05Z daily (`trig_01L8K64ZKYb5eALdT4HW6NAV`). S368 holds nothing.
   Merge S368's checkpoint PRs on `test` (tracker `claude/s368-checkpoint`, then vault `claude/s368-checkpoint`).
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `long-beach-city`, `chaffey`, `san-diego-city`, `cpl-pathways`.
2. **The policy paste.** Read `select qual from pg_policies where tablename='program_requirement_records' and
   policyname='program_requirement_records_read'`. `true` means Sam pasted it: count what anon sees (1,515 expected) and say
   so. `checked` means he has not: hand him the paste again (it is in chat at ~03:20Z and below). `apply_migration` timed out
   twice and wrote nothing; do not retry it.

       begin;
       drop policy if exists program_requirement_records_read on public.program_requirement_records;
       create policy program_requirement_records_read on public.program_requirement_records
         for select to anon, authenticated using (true);
       commit;

3. **Vault #313** (Sheet 67's card leaves the builder): its coverage re-run reads tracker main, which carries #2021 now.
   Merge it when green.

## Sam's decisions this run

- **Sheet 67 card 1: Every record, from the table** (Complete 02:10Z, the proposed chip), and **"Apply it"** in session for
  the policy change. Built in #2021: the public reads every record; CPL Pathways, Program Requirements and My College mark an
  unchecked one **Not yet confirmed** (his words). `cpl_memory sam-sheet-67-card-1-every-record-from-table-2026-10-12` (its
  summary still says Not yet checked: the repo's guard blocks UPDATE on the table; the code and lane are right).
- **Next colleges: San Diego City and Chaffey, both captured now**, then **"Chaffee next"**: Chaffey goes first, San Diego
  City's extraction waits. `cpl_memory sam-next-colleges-sdcity-chaffey-2026-10-12`.

## Next in the queue

1. **Long Beach City's display.** The load (run 38200167207, on `claude/s367-lbcc-reread`) inserted 40 records, unchecked
   (305 to 345 rows). Read its committed receipt, dispatch `step=display` on the branch (Sam's standing go), then open a PR
   for the branch's filed records and receipts. Four programs have no page (GED/HiSET 39497, 39500; Barbering 43258, 43837).
2. **Chaffey's reader.** The capture (run 38197183697) found 0: catalog 718, Degrees and Certificates, 40 nodes read, no
   program entries, node cap hit. Probe Chaffey's catalog with `kb/_college_page_read.py` (`"network": true`, a plan in
   `kb/college_reads/`) to see the calls its program index makes, fix the curriQunet walk, re-capture, then extract (~$11).
3. **San Diego City's reader** after Chaffey: the alias start page named no catalog id (run 38197175054).
4. **The smoke's 7s guard** reads an articulation absence as a catalog absence (S368's comment on #2021); 7c's guard sets
   those aside, 7s's does not. A small fix in `chatbox/smoke_test.sh`.
5. **UI pass:** `python3 scripts/ui_pass.py --next` names My College (`college_briefing.js`, 280 KB); give it a whole run.

## What shipped (S368)

#2018 S367's checkpoint (one British spelling fixed) · #2019 Admin UI pass (seeded reviewer sweep; 112 small targets, the
squeezed names, the caret, the doubled link chip) · #2020 MAP Team Queue UI pass (the shell placeholder, quiet badges, an
escaped emoji the glyph sweep cannot see) · #2021 every record public, marked Not yet confirmed · vault #312 (Sheet 67,
S367's note, written by S368).

## Patterns that worked

- **Seed a gated view for the sweep.** Signed out, a gated tab measures only its gate; Admin and the queue each hid
  dozens of faults behind it.
- **Capture before extracting, per college.** Two captures found 0 at no model cost.
- **Hand a long log to a subagent** and keep only its verdict; the smoke's 1,229 lines would have cost 50k of context.

## Safety patterns

- **Read the approved card's wording before building.** Sheet 67's card said *Not yet confirmed*; S368 first built CPL
  Pathways' *Not yet checked* and had to change three pages.
- **A grant goes through the human.** Auto mode refused the policy edit until Sam's in-session go; ask with the blast radius.
- **`apply_migration` can time out with nothing written.** Read back `pg_policies` and `schema_migrations` before retrying.

## Not refreshed this checkpoint

Pipeline tab (did not move); `kb/README.md`, `README.md` (no structure or surface change); no new KB note.

## Sign-off line for Sam

Greetings, you are SkyLaurel (Session 369), see SkyWillow's handoff — `docs/session_369_handoff.md` — let's keep rolling with our queue.
