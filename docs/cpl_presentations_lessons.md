---
title: CPL executive presentations — lessons (BOG update + CBO budget workshop)
date: 2026-07-20
tags: [lessons, presentations, pptx, funding, communications, bog, cbo]
artifacts:
  - presentations/build_bog_deck.py
  - presentations/build_cbo_slides.py
  - presentations/fill_template.py
  - presentations/20260716_CPL_Initiative_BOG_Update.pptx
  - presentations/20260720_CPL_CBO_Implementation_Funding.pptx
related:
  - "[[docs/kb-notes/playbook-building-cpl-executive-presentations]]"
  - "[[CLAUDE]]"
---

# CPL executive presentations — lessons

Workstream scratchpad for CPL board / executive slide decks. Append a dated section per checkpoint.
Distilled, reusable version:
[`docs/kb-notes/playbook-building-cpl-executive-presentations.md`](kb-notes/playbook-building-cpl-executive-presentations.md).

## 2026-07-20 — StarBOG: BOG update deck + CBO budget-workshop slides

### (a) What we learned

- **The tracker already holds everything an exec deck needs** — headline KPIs (`live_metrics.json`
  `metrics[]`), sector/exhibit/Fire numbers (`fact_sheet_metrics.json`), and the funding model incl.
  the COBI 3 priorities (`cpl_funding_data.js` → `year_priorities`: P1 Completion 30 / P2 Access 42 /
  P3 Capacity-mobility 28). No new data work needed; the risk is *staleness*, so fetch live.
- **Two build modes, very different effort.** (1) From-scratch with `python-pptx` (BOG deck) is
  fast once you have helper functions. (2) Filling *someone else's brand template* (CBO slides) is
  the higher-skill task: inspect the theme for the exact palette/fonts, reuse the template's own
  content layout, set the native Title placeholder, delete the empty Body placeholder, draw custom
  shapes in the body band, and reorder `sldId`s. Result looks genuinely native.
- **Sandbox tooling was missing** — LibreOffice **Impress** and **poppler-utils** are not
  preinstalled, so `.pptx` wouldn't render at first. Installed both (`apt-get`, sandbox disabled).
  Before that, a **faithful pptx→HTML renderer + Chromium** (read each shape, position it, screenshot)
  was the QA fallback and is worth keeping for environments where Impress can't be installed.
- **Legislative reconciliation matters.** SB 111 = $42M CPL / $7M ongoing → **$35M one-time**; an
  earlier DOF summary said $37M / $2M ongoing. SB 135/AB 135 makes CPL a **systemwide initiative**
  under the **Master Plan for Career Education** (evaluate incoming prior learning, adopt statewide
  recs, **accept transcribed CPL from other colleges**). Sam's rule: keep in-discussion **amounts**
  (weights, floor, carve-outs) off the slides; present the *framework* only.
- **Design discipline from the `pptx` skill paid off** — no under-title accent lines, no card
  edge-stripes; a circle motif (check-dots + numbered priority circles) carried across slides.

### (b) Current state

- **BOG deck** — `presentations/20260716_CPL_Initiative_BOG_Update.pptx`: 12 slides (cover ·
  positioning · statewide KPIs · the $7M+$35M funding win · COBI 3 priorities · portal soft-launch ·
  My CPL Story · EMT video placeholder · Moreno Valley EM B.S. pathway (illustrative) · partnerships ·
  Fire/CSTI hand-off to Miramar · close), speaker script in every slide's notes. Also published as a
  **private draft artifact**. PR #808 was opened then **closed by Sam** (he took the file directly).
- **CBO slides** — filled into the CO "2026 Annual Budget Workshop" template's CPL section (slides
  17–19 after the divider): *Standing Up CPL at Every College* · *Three Funding Priorities* ·
  *Guiding Principles*. Native CCC brand (Source Sans Pro, navy/blue/gold, watermark, footer).
  Standalone brand-navy version also generated (`20260720_CPL_CBO_Implementation_Funding.pptx`).
  Delivered as the full 33-slide workshop deck.

### (c) Roadmap / parked

- **Parked / optional** (offered, not yet requested): a one-page Miramar Fire talking-points brief;
  real student photos/names on the My CPL Story slide; PDF handout exports.
- **Flagged to Sam**: the CBO template's CPL divider reads "Samual Lee" (typo for *Samuel*) — left
  untouched as his content; offered to fix.
- **Reusable going forward**: the `presentations/` generators + the template-fill technique are the
  starting point for the next exec deck.

### (d) Next concrete step

Nothing pending unless Sam requests a follow-up (brief / photos / PDF, or the typo fix). This is a
self-contained side-lane; the CCR mainline handoff + `cpl_todos.json` were intentionally left
untouched.

---

## 2026-08-10 — SkyDeck: CAC apprenticeship-pathway slides + a 15-minute script

**Ask.** Sam: the three pre-apprenticeship→baccalaureate pathway slides in the 2026-08-03 CAC deck
are "busy," but they carry information that "clarifies for the first time how we can embed CPL on
full pathways" — don't lose the impact. Audience: trade reps, employers, CCC/state, **DAS**, at the
13 August California Apprenticeship Council. Later: add a speaker script for the 15-minute slot,
which Crystal Nasio presents from slide 5 on.

**The diagnosis changed the job.** All three slides were **single full-bleed PNGs** — every word
pixels, nothing editable or accessible. And the course tables inside them **ran off the bottom edge
of the slide**: rows below the fold were never visible to anyone, including whoever built them.
Busyness was the symptom; reference data pasted into a narrative slide was the cause.

**Shipped.** 3 slides → 6, native shapes on the deck's own master (Cambria/Calibri, CCC navy+gold,
master logo and footer rule intact), stage colors sampled from the originals so it still reads as
the same system:

- a shared **spine** slide ("One road. Every trade.") carrying a 120-unit **credit ladder** — CPL
  award 26–38 units of the 60 in the associate, which then satisfies the first 60 of the bachelor's;
- three trade slides (Carpentry · Ironworkers · Fire/Cal JAC), each built in **3 clicks**:
  *the road → who does what → what it's worth*;
- two **appendix** crosswalk slides carrying the course tables as real, legible, un-clipped tables;
- the three originals retained as **hidden** slides at the end.

Ironworkers was normalized from the original's 1-2-2-3-4 numbering onto the same five stages and
redrawn as two explicit lanes (American River 29.5 units · Cerritos 38), so each route reads
straight across.

**⭐ The transcription caught two real data defects.** Carpentry's visible courses total **20.0
units** against **26** cited; Cerritos totals **31.5** against **38**. American River reconciles
exactly at 29.5. Both gaps are the clipped rows. The appendix slides print the discrepancy as a
caveat so a number can't be quoted without its flag — still open with Santiago Canyon and Cerritos.

**Speaker notes.** All 15 visible slides, structured identically — THE POINT / SCRIPT (speakable
sentences with `[CLICK]` cues) / NUMBERS (each with source + as-of date) / IF SHORT ON TIME.
Budget **13:00 of script inside the 15:00 slot**. Plus a two-page printable run sheet (timing
ladder, the sayable numbers, page 2 the pre-apprenticeship brief). Every figure pulled live at
2026-08-10 13:50 UTC per the mandatory live-data rule — **49,696 CPL students / 589 apprentices**
(~1.2%, the runway number), $313M saved, and the actionable one: **45 colleges could adopt an
existing Fire Technology statewide exhibit today** (welding 27, automotive 65).

**⭐ Sam corrected the pre-apprenticeship framing, and the correction is the durable output.** My
draft led with credit-by-exam as *the* stage-1 instrument. His three mechanisms: **noncredit
coursework**, **industry certifications** (welding), and — the one nobody names — **clearing
admission requirements** for the apprenticeship itself. That third one speeds *entry*, not just
completion, and the people who set entry requirements were the audience. Distilled to
[`reference-cpl-at-the-pre-apprenticeship-stage`](kb-notes/reference-cpl-at-the-pre-apprenticeship-stage.md).
And the Ironworkers slide's stage 1 already *shows* mechanisms 1 and 2 — pointing at an existing
slide beat adding one.

**Three numbers flagged for verification before the 13th:** the **44% apprentice withdrawal**
figure (via a CTE policy source citing DAS — and DAS is in the room; attribute, don't assert), the
apprentice headcount (589 live vs 692/755 in older docs — use live), and the two appendix unit
totals.

**Sandbox note.** `soffice --convert-to pdf` failed on *every* pptx including a trivial probe —
that's the tell it's the environment, not the file. LibreOffice Impress simply wasn't installed
(`libsdlo.so` absent); `apt-get install libreoffice-impress poppler-utils` fixed rendering.
Chromium `--print-to-pdf` (preinstalled at `/opt/pw-browsers`) covers HTML→PDF; LibreOffice's HTML
import doesn't work here.

**Next.** Crystal owns slides 5→end. Open: the two unit totals; whether the spine slide stays; and
whether pre-apprenticeship deserves its own slide now that the mechanisms are named. Build assets:
`presentations/cac_2026-08/` (decks not committed — 27 MB each, vault weight).

**⚠ Concurrency footnote.** A second session (**SkyLine**, Sierra credential naming) ran in
parallel and both of us wrote `docs/session_135_handoff.md`. Theirs landed first, so this lane's
handoff was resequenced to **136**. The docs auditor's R1 rule then stamped SkyLine's 135
`superseded_by: session_136` — **false, and reverted**: R1 assumes handoffs are a total order, which
concurrency breaks. `superseded_handoff: 1` is now a known standing finding rather than a false
stamp. Sam had flagged the concurrent session at the start; the collision still landed in six files
(`CLAUDE.md`, `roadmap_archive`, `INDEX`, `cpl_todos.json`, the handoff, the audit artifacts) —
worth knowing that "it shouldn't collide" and "it didn't collide" are different claims.
