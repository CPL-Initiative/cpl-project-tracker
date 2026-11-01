---
title: "CER redesign handoff: IB on the AP pattern, Sheet 150, CLEP held (SkyInkberry)"
date: 2026-11-01
session: CER redesign build, side session after S536 (SkyInkberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, ib, clep]
status: current
---

# You are SkyTeaberry, the Exhibits tab's next build

SkyInkberry ran on 2026-11-01 from 00:41Z, started from Sam's phone. No other session was live on these files;
SkyHuckleberry had signed off. This is a **full checkpoint** in content (the run wrote Rule 10 data and moved the CER
lane) on the side line's shape: this file is the handoff, and the CPL queue's `docs/session_<N>_handoff.md` stays the
routine's. Skipped, each with its reason:
- `README.md` and `kb/README.md`: no change to the KB structure or the surfaces.
- The pipeline view: no roadmap, auditor or re-mint movement.
- A KB note: the learning fits the lessons doc.
- `kb/status/program-requirements.json`: that line was not worked.

`kb/status/exhibit.json` was refreshed by hand, because `scripts/queue_status.py --stamp` accepts only a
`docs/session_<N>_handoff.md` and this line's handoff is this file. The previous run took the same route.

## What shipped

- **#2632, IB on the AP pattern.** `kb/_ib_official_titles.py` holds IB's subjects, current and retired, at the levels
  IB offers, named as the reference and the Cal-GETC list write them (*IB Language A: Literature HL*).
  - A title with no level takes HL. A subject IB offers at SL alone takes SL.
  - The exam's language folds into the subject. Language A in another language keeps *(Non-English)*.
  - A title naming two exams is held.
  - Brand-family's `ib` lane runs beside `ap`, and the gate lets an official IB name stand.

  The reference fold (`kb/_ib_fold_apply.py`, then `kb/_merge_credentials.py --apply`) merged 49 IB credentials into
  24, moved one title by itself, and set the issuer to *International Baccalaureate Organization (IBO)* everywhere.
  Eight `kb_curation` rows moved under `cer-ib-fold-skyinkberry@bot` by a guarded UPDATE, all eight read back. One of
  them is Sam's issuer save. Receipts are in `kb/credential_merges_out/2026-11-01/`.
- **[Open Asks Sheet 150](https://claude.ai/artifact/3MJJ8ftqz7BABwnQAsjfFL)** (current, store empty at publish;
  CPLBrain#585):
  - Card 1: keep the IB fold. Carried out on the recommendation; a reply reverses it.
  - Card 2: which names CLEP exams take. Held.
- **The CER lane is under its 20 KB budget again.** The retired CER tab's bullets and Sheet 94's ruling block moved
  verbatim to the lessons doc.

## Read first

Read `docs/reference/lanes/cer-procedures.md` (NEXT and the NEEDS SAM line), then the SkyInkberry sections of
`docs/cer_v2_redesign_lessons.md`.

## Open work, in order

1. **Read Sheet 150's `replies` before acting** (ArtifactData, collection `replies`, on the link above).
   - Card 1 *reverse*: `git revert` #2632's squash commit, then run the rollback in
     `ib_kb_curation_update_receipt.json`.
   - Card 2 *fold*: build `kb/_clep_official_titles.py` and its fold on the IB pattern. One credential per exam, the
     levels folded as score bands, Arabic numerals, no period subtitle (*CLEP Spanish Language*, *CLEP History of the
     United States 1*).
   - Card 2 *twins*: keep the levels split and fold only the twins (*Spanish with Writing Level II* and *2*,
     *Pre-Calculus*, the prefix-less *(Levels 1 and 2)* titles).
   - Card 2 *official*: College Board's names as written, Roman numerals included. First check how Another look's
     numerals rule would read them.

   Either fold first runs the reader in dry run over the reference: every person-reviewed title should already read
   where it sits.
2. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list, as SkyHuckleberry did. Nothing was saved between the 2026-10-31 fold and 00:45Z
   2026-11-01.
3. **The first rule sent to the routine** (carried): none had been sent at 00:45Z. When one shows up in the Rules view,
   confirm the overnight firing worked it by step 7.
4. **CI timing (handoff item 2, read).** The shard spread comes from the runners, not the table. Two runs with the same
   assignment put one shard at 4:35 and 8:35. The only gain left is splitting the slowest files, and only if Sam asks
   again.
5. **Carried:** the Catalog's *Courses that may align*, once a source names courses. Training sites for a held title
   new to the reference, only if Sam asks.

## Lessons to honor

- Run a brand's reader over the reference in dry run before its fold. Agreement with every person-reviewed placement is
  the evidence the names are right.
- `kb/_merge_credentials.py` moves whole credentials. A credential whose titles split needs its own move and receipt.
- Put IB's `Diploma Programme` in a code span in docs: the spelling sweep reads it as British.
- Postgres regex has no `\b`; use `\y`. `cpl_memory.summary` holds at most 400 characters, and `cpl_memory_log.action`
  takes `create`, not `insert`.

## Let go

At sign-off this session drops its PR watches (#2632, CPLBrain#585) and the Sheet 150 artifact watch, and holds no
check-in.
