# CPL Initiative — Board of Governors Update (July 2026)

`20260716_CPL_Initiative_BOG_Update.pptx` — Sam's **first 15 minutes** of the 45-minute
BOG segment. Navy/white template matching Sam's sample slides. Every slide carries a
**speaker script in its notes field** (Presenter View) totaling ~13 min of talk + the 2-min video.

## Slide order (12)
1. Cover — Update to the Board of Governors
2. Positioning — Student-First / College-Supported / Employer-Engaged (Passive→Proactive, Siloed→Shared, College→Career)
3. Statewide impact KPIs — 50,154 students · $326M saved · 12,679 credit recs · 102 active colleges
4. The funding win — **$7M ongoing + $35M one-time** (Vision 2030)
5. **COBI Implementation Funding model — the 3 Priorities** (Completion 30% · Access 42% · Capacity & Mobility 28%)
6. Student CPL Portal soft launch — *creditforbeingyou.org*
7. My CPL Story — 5 student cards
8. Video — EMT at Moreno Valley (2 min)
9. Sample pathway — Moreno Valley B.S. Emergency Management (illustrative CPL stacking)
10. Partnerships — faculty/ASCCC, employers, Cal OES/CSTI, military, apprenticeship, CAEL/ACE
11. Hand-off — Fire Technology statewide model → San Diego Miramar faculty & dean (their 15 min, no slides)
12. Close — Thank you / Q&A

## Two things to add before presenting
- **Slide 6** — paste the real CPL Student Portal screenshot over the on-brand mock (optional; the mock is presentation-ready as-is).
- **Slide 8** — Insert → Video → the 2-minute EMT student-story video (placeholder frame is in place).

## Data provenance
Figures are from the live tracker as of 2026-07-16 (`live_metrics.json`, `fact_sheet_metrics.json`)
and the COBI funding model (`cpl_funding_data.js` priority weights). The Moreno Valley pathway
is **illustrative** (course-level CPL isn't mapped for that program yet); unit values (EMT 7u,
Basic Fire Academy up to 24u) reflect published statewide Fire/EMS credit recommendations.

## Regenerate
```bash
pip install python-pptx
python3 presentations/build_bog_deck.py
```
Edit `build_bog_deck.py` and re-run to change content/branding. The `NOTES` list holds the speaker scripts.

---

# CBO budget-workshop CPL slides (2026-07-20, StarBOG)

Three high-level slides on how the **$35M one-time** funds support local CPL implementation — the
**COBI 3 priorities** (Completion / Access / Capacity & Mobility) + guiding principles — with the
in-discussion **amounts held off** per Sam. Two forms:

- `build_cbo_slides.py` → `20260720_CPL_CBO_Implementation_Funding.pptx` — standalone, brand-navy
  template (same style as the BOG deck), speaker script per slide.
- `fill_cbo_into_template.py` — drops the same 3 slides **natively into an existing CCC brand
  template** (the CO "2026 Annual Budget Workshop" deck): reads `ppt/theme/theme1.xml` for the exact
  palette (`002F6D` / `0066BA` / `FFB600`) + font (Source Sans Pro), reuses the template's content
  layout, sets the native title, deletes the empty body placeholder, draws shapes in the body band,
  and reorders `sldId`s. Run it from a dir containing `template.pptx`; outputs the full filled deck.
  (The filled workshop deck itself is delivered to Sam directly, not committed — it's his broader deck.)

Reusable how-to (data map, tooling, template-fill mechanics):
[`../docs/kb-notes/playbook-building-cpl-executive-presentations.md`](../docs/kb-notes/playbook-building-cpl-executive-presentations.md)
· lessons: [`../docs/cpl_presentations_lessons.md`](../docs/cpl_presentations_lessons.md).

**Tooling note:** QA-rendering `.pptx` needs LibreOffice Impress + poppler, which are **not**
preinstalled in the sandbox — `apt-get install -y --no-install-recommends libreoffice-impress
poppler-utils` first (or fall back to the pptx→HTML + Chromium renderer).
