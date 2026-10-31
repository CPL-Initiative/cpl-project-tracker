---
title: "CER redesign handoff: the Exhibits mock-up, the Admin Save, college short names"
date: 2026-10-30
session: CER redesign side session beside S531 (SkyThimbleberry)
tags: [handoff, cer, eacr, catalog-commons, admin, college-identity, cpl-ai]
status: current
---

# You are SkyGooseberry, the CER redesign build

The side session SkyThimbleberry ran beside S531 (SkyOlallieberry, the night's queue session) on 2026-10-30 from about
22:20Z. Sam asked for the CER made *"much more manageable and simple"* and reacted to a mock-up for two hours. This is a
**full checkpoint** for this lane; the night's numbered handoff (`session_532_handoff.md`) and
`kb/status/program-requirements.json` belong to S531, so this file and `kb/status/exhibit.json` carry this run.

## What shipped

- **#2593 (merged): Admin's editor button reads Save and saves.** Sam's hides of CER, CSR, CCRR and CCR never saved:
  **Done** only closed the editor. He can now hide them himself from the panel.
- **#2594 (merged): Program Requirements' Could adopt list carries the Request Quick Adopt line** (`map_links.js`).
- **#2595 (open, docs only): the mock-up**, version 25: https://claude.ai/artifact/6fTBpjkrGseEb7h3gaPnSM, source
  `docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html`, plus this checkpoint. Merge it on a green `test`.
- **#2598 (open): college short names** (College of the Desert whole, Cañada with its ñ, City College San Francisco;
  "San Francisco" kept as an alias). Through `kb/_seed_college_short_names.py`. Merge it on a green `test`.
- **Vault braindumps** (samueltlee/CPLBrain#563, #564, merged): the CER and EACR are one record; the CER is the canonical
  catalog for Malone's new MAP exhibit module.
- **cpl_memory:** `sam-cer-aligned-course-names-the-exhibit-2026-10-30`, `sam-cer-issuer-and-training-sites-2026-10-30`,
  `sam-cer-redesign-rulings-2026-10-30`, `cpl-ai-alignment-joins-map-2026-10-30`.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The redesign*), `docs/cer_v2_redesign_lessons.md` (*2026-10-30*), the
mock-up itself, `docs/reference/lanes/college-district-identity.md` (*College short names*).

## Open work, in order

1. **Put the lane's NEEDS SAM on a decision sheet** (the builder refuses until it is asked): merge EACR into the CER;
   Review first; the public page on stamped credentials only; its look; the high school and ROP rule and the AP
   exception; the CPL-AI load order.
2. **Draw what Sam asked last:** a could-adopt college chip opens that college's aligned courses (from
   `unified_courses_members.js`, the identity's members at that college) and the Request Quick Adopt links (the held
   exhibit's ID, `map_links.js`'s address).
3. **The college short-name editor** (lane NEXT): a Short name column on the College Identity tab, a Supabase table seeded
   from the 118 rows, the nightly rewrite of the JSON and JS; map the write surface in `kb/governance_surface_map.json`
   first.
4. **Build the Review queue** once Sam answers 1: the card as drawn, students first, the aligned-course rule (fold leading
   zeros: MAP's "ADJUS 023" missed), the step tiles as filters.
5. **The CPL-AI ingest** (Activity 1.1.1, lead Terence Nelson): `https://map.rccd.edu/CPL-AI/preview-data/catalog.json`
   (33,232 pairs, 115 certifications, 121 colleges) into a dated snapshot with credit to the Academic Senate, the
   Foundation and the Success Center; show it in the Program Requirements dialog first; public surfaces wait on Sam.

## Sam's decisions and words this run

In the lane file and the lessons doc, verbatim. The three questions (*What is it called? What credit does it carry? Who
could adopt it?*) organize everything; the canonical title is always the focus; local titles in small print; one issuer,
many training sites; short names live in the table, with no coded exceptions.

## Lessons to honor

- Check the server logs before reading code when a save "does not take".
- EACR's potential counts colleges; students come from `map_student_credit` through exhibit IDs, aggregate only.
- The aligned course names plain courses only; AP and brand credentials keep their names.

## Let go

This session drops its PR watches when #2595 and #2598 merge and its artifact watch at sign-off. S531 got a message
naming this file so its handoff can point here.
