---
title: "Session 578 handoff: the Subjects List recode landed; the Library revises a visual from its card"
date: 2026-11-05
session: 577 (SkyKumquat and SkyBarnard, Sam's session, 2026-11-05 01:10Z to ~03:40Z)
tags: [handoff, common-subjects-reference, remint, library, edge-function, commons]
status: current
---

# You are Session 578

Your moniker is **SkyComet** (galaxy names; the Comet Galaxy, in Abell 2667). Sam opened this session as SkyKumquat (the
Lists' side queue, `docs/cer_redesign_handoff.md`), then asked it to carry SkyBarnard's main queue too (*"Hoping you can
combine this work in this session"*), so **this handoff carries both queues**, and `docs/cer_redesign_handoff.md` points
here. The checkpoint was **full**: a re-mint landed and two lanes moved. It skipped `kb/README.md` and `README.md` (no KB
structure or user-facing tab changed beyond the Library card) and the decision sheet rebuild (Sam answered all three asks
in chat: nothing is waiting on him).

## What shipped (all merged)

- **#2790, the Subjects List recode.** Sam's eleven codes from 2026-11-04 (CSAI to CSIS, BCST to BRDC, CNSR to CBIT, CNSC
  to WWKC, AUTD to DIES, ESCI to ENVS, CSTF to WWKF, GRAF to GFCD, PLGL to PARA, NRSV to VNRS, Media Production FTVE to
  FMED) landed with their identities: 2,389 ids re-keyed by prefix (`kb/_subjects_list_recode.py`; 2,024 kept their
  number, 360 gap-filled, one returned home), receipt `kb/subjects_list_recode_out/2026-11-05/` in ALIAS_MAPS. P3 by hash
  (live `kb_curation` equaled the overlay over 1,409 keys). `supabase-rekey.yml` ran; the read-back found 935 keys and
  642 pointers on the new codes, none on an old one. `daily-dashboard.yml` dispatched at 03:07Z.
- **#2763** (S573's cert link and handoff 574): main merged in, docs index rebuilt, merged.
- **#2791, Draft it now.** A Library card with a Pages copy drafts a revision with no session: `library-revise-draft`
  (edge function, the caller's own credential) asks Claude for edits to `library/<slug>/`, stores the draft in
  `cpl_library_drafts` (live; applied by `supabase-migrate.yml`), and the card offers Open the draft and Replace the
  public copy; `library-publish.yml` publishes approved drafts every three hours with a receipt. Governance: three
  dismissals with reasons.
- **#2792** adds `library-revise-draft` to `cpl-chat-deploy.yml`'s choices.

## Sam's decisions this run

- *"Apply now"* (the recode, Supabase re-key included), asked twice, the same both times.
- *"Build it"* (revising a Library visual from its card without a session).
- *"Deploy it"* (the edge function, on the project's key, the newest Opus model).
- *"Hoping you can combine this work in this session"*: one session carries both queues.

## Open work, in order

1. **Deploy `library-revise-draft`** if #2792's deploy has not run: merge #2792 on a passing `test`, then dispatch
   `cpl-chat-deploy.yml` on main with `function: library-revise-draft` and `confirm: DEPLOY`. Then try Draft it now on
   a waiting request (ELL IET has a ready session draft, so pick another piece or file a small request).
2. **Confirm the dispatched daily run** (03:07Z) landed green and the Subjects List shows the new codes; the 06:17Z cron
   follows it. If a lint goes red on a re-keyed id, the generated file it names is rebuilt by its own builder.
3. **Check alignment on CR, Programs and Courses** (`edit.extra`; worked examples `codeAudit`, `exhibitAudit`).
4. **ELL IET Version 3** waits on Sam's Replace the public copy (a session draft: Copy the request, then
   `scripts/library_page.py`).
5. **Sam's own steps** (from handoff 577): Malone as a CPLBrain collaborator, then the transfer to `CPL-Initiative`, then
   about 60 live references to `samueltlee/CPLBrain`.
6. **Carried:** the routine's night (step 0 dispatch, Columbia's SLO read, the credential slice, the UI pass on
   funding-model, the contacts harvest on 2026-11-08); the Commons asks (lane `commons`); ECONMT and Electricity's
   adult-education codes; the Subjects card's second count; `CLAUDE.md` near 61 KB against 60 KB.

## Lessons to honor

- **A code change is a prefix re-key, not a re-sequence.** `kb/_subj4_dryrun.py`'s report reads 452 curated collisions
  for these codes; the keep-number planner reads none. The handoff pointed at the wrong tool; check the KB note first.
- **Re-key every generated output the tests read against each other**, except one keyed to records that keep their own
  ids (the ROEP mirror) and one with its own builder (rebuild it). CI's suite found two the local run missed.
- **Commit a planner before rehearsing with it:** `git clean` of `kb/` deleted it once.
- **The MCP `apply_migration` can stall on a confirmation prompt;** `kb/migrations/.apply` on a `claude/**` push applies
  the same file.

## Let go

At sign-off: drop the #2792 watch once merged and the deploy has run. The 03:06Z check-in fired and is spent. No artifact
watch.
