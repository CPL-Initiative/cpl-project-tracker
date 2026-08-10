---
title: Session 136 handoff (SkyDeck → next) — the CAC deck is built and scripted; two unit totals are still unreconciled
created: 2026-08-10
updated: 2026-08-10
tags: [handoff, presentations, apprenticeship, cac, pre-apprenticeship, pptx]
related:
  - "[[docs/cpl_presentations_lessons]]"
  - "[[docs/kb-notes/methodology-rebuild-a-flattened-diagram-as-a-built-slide]]"
  - "[[docs/kb-notes/reference-cpl-at-the-pre-apprenticeship-stage]]"
  - "[[docs/noncredit_cpl_thinking]]"
superseded: true
superseded_by: session_137_handoff.md
---

# Session 136 handoff

You are **Session 136**. Session 134 ran as **SkyDeck** — claim your own moniker or take one from
the Sky\* family (SkyDeck, SkyLine, Sky, SkyHigh, SkyMind, SkyDesk, SkyGauge, SkyNaut are taken).

⚠️ **Two sessions ran concurrently on 2026-08-10 and both wrote a "session 135" handoff.**
**[`session_135_handoff.md`](session_135_handoff.md) is SkyLine's** (Sierra credential naming —
its Priority 1, wiring CRED·STD into `cpl-chat`, is still open and outranks anything here).
**This file is SkyDeck's**, resequenced to 136 because SkyLine landed first. **Read both** —
they cover different lanes and neither supersedes the other.

## What shipped (2026-08-10, no PR — deliverables went to Sam directly)

A rebuild of the three pathway slides in the **CAC deck** for the **13 August California
Apprenticeship Council** meeting (audience: trade reps, employers, CCC/state staff, **DAS**),
plus a full speaker script. Presented by **Crystal Nasio**, who owns slides 5→end.

- **3 slides → 6.** A shared spine slide ("One road. Every trade.") with a 120-unit credit ladder,
  three trade slides (Carpentry · Ironworkers · Fire/Cal JAC) each built in **3 clicks**
  (*the road → who does what → what it's worth*), and two appendix crosswalk slides.
- Native `python-pptx` shapes on the deck's own master; the three originals kept as **hidden**
  slides at the end. Click-build animation injected as `<p:timing>` XML.
- **Speaker notes on all 15 visible slides** + a two-page printable run sheet.
  **13:00 of script inside the 15:00 slot.**
- Build assets committed to `presentations/cac_2026-08/`. **The decks themselves are not
  committed** — 27 MB each (the source embeds a 23 MB MP4) and this repo lives inside the vault.

## Read these, in order

1. [`docs/cpl_presentations_lessons.md`](cpl_presentations_lessons.md) — the 2026-08-10 section.
2. [`docs/kb-notes/methodology-rebuild-a-flattened-diagram-as-a-built-slide.md`](kb-notes/methodology-rebuild-a-flattened-diagram-as-a-built-slide.md)
3. [`docs/kb-notes/reference-cpl-at-the-pre-apprenticeship-stage.md`](kb-notes/reference-cpl-at-the-pre-apprenticeship-stage.md)
4. `presentations/cac_2026-08/README.md` — what's there and what deliberately isn't.

## ⚠ Carryover — the three things that need a human

1. **Two unit totals do not reconcile, and they are printed on the appendix slides.**
   Carpentry's visible course list totals **20.0 units** against **26** cited; Cerritos totals
   **31.5** against **38**. American River reconciles exactly at **29.5**. The cause is that the
   original graphics **clipped their own tables** at the slide edge. The missing rows must come
   from Santiago Canyon College and Cerritos College. Until then the caveat stays printed.
2. **The 44% apprentice-withdrawal figure is not ours.** "44% of California apprentices withdraw
   before completion (DAS, 2000–2026)" reaches us through a CTE policy source citing DAS — and
   **DAS is in the room on the 13th**. It is flagged three times in the pack as *attribute, don't
   assert*. If someone confirms it with DAS, record the confirmation.
3. **Apprentice headcount drift.** Live dashboard says **589**; the 2026 Initiative Report says
   692; the noncredit thinking doc says 755. The pack uses 589 (live). Worth understanding why
   the number moved down while total CPL students moved up — possible reclassification.

## Open questions Sam may come back on

- Does the **spine slide** stay? It is an addition, not a rebuild — he has not ruled on it.
- Does **pre-apprenticeship deserve its own slide** now that the three mechanisms are named?
- Crystal may edit slides. **The notes reference slide positions and click counts** — if she
  reorders, the timing ladder needs re-checking.

## Priority workstreams (unchanged by this run)

This was a self-contained deliverable. The standing queue is in `CLAUDE.md` §11 — the college
briefing page, the MAP-team inbox, the nightly feed ask to Malone
(`docs/map_dataset_sql_for_malone.md`), and the NC/Learning-Partner next steps (populate the four
standalone NC institutions, still at zero).

**The NC row moved slightly**: pre-apprenticeship CPL now has a named mechanism set, and
mechanism 1 is *noncredit coursework* — which sharpens "the four standalone NC institutions are at
zero" from a tidiness problem into a pathway gap.

## Patterns that worked

- **Open the file before believing the request.** Sam asked for a styling fix; the slides were
  screenshots that were also truncating data. Ten minutes of `python-pptx` + PIL changed the job.
- **Re-key a flattened graphic, then check its arithmetic against its own stated totals.** That is
  what surfaced both defects. Nothing else would have.
- **The curator's domain knowledge outranked the inference.** The draft pre-apprenticeship section
  led with credit-by-exam; Sam's three mechanisms replaced it. Recorded with attribution and date.
- **Verify the environment before blaming the file.** `soffice --convert-to pdf` failed on a
  trivial probe deck too — Impress simply wasn't installed.

## Safety patterns to honour

- **Live-data rule is mandatory.** Every number in the pack was pulled from `live_metrics.json` /
  `fact_sheet_metrics.json` at 2026-08-10 13:50 UTC, and each carries its source and as-of date in
  the notes. Do not cite skill-file snapshots.
- **Naming:** "CPL Initiative", "MAP platform". Never "MAP Initiative". "Military Articulation
  Platform" is 2017 history only.
- **Mark what you could not verify** rather than smoothing it. Three flags in this pack exist for
  exactly that reason.
- **Sam runs concurrent sessions.** One was on the Sierra college-briefing tab during this run.
  Ask before touching shared surfaces.

## ⚠ A tooling finding from this merge — read before you trust `superseded:`

Two sessions ran concurrently on 2026-08-10 and both wrote `session_135_handoff.md`.
SkyLine's landed on `main` first, so this file was resequenced to **136**.

`kb/_docs_audit.py`'s R1 rule then stamped SkyLine's 135 as
`superseded: true, superseded_by: session_136_handoff.md`. **That stamp was false and was
reverted.** R1 assumes handoffs are strictly sequential — "highest number wins" — which
breaks under concurrency: two sessions in different lanes produce two live handoffs, and
neither supersedes the other. Acting on that stamp would have meant skipping SkyLine's still-open
Priority 1 (wiring CRED·STD into `cpl-chat`).

So `python3 kb/_docs_audit.py` will report **`superseded_handoff: 1`** and that finding is
**known and deliberately left standing** — do not "fix" it by stamping 135. If concurrent
sessions become normal, R1 needs a real fix: compare `created:` dates and lanes rather than
assuming the numbers are a total order.
