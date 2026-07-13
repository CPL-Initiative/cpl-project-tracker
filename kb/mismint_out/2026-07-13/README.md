# Subject-cohort discipline mis-mint batch — 2026-07-13 (S113)

**Trigger:** Sam caught `HVAC M10FR` (LA Trade `DIESLTK 122C`, "Heavy Duty HVAC") minted SUBJ4=HVAC / disciplined *Air Conditioning, Refrigeration, Heating* — but the local subject `DIESLTK` **and** TOP `0947.00` both say Diesel. A title keyword ("HVAC") had overridden the real field.

**Detector:** subject-cohort outlier — a minted M-ID whose assigned discipline is a clear minority of its local-subject-code cohort, corroborated by TOP and/or the curated subject→discipline map (SISTER_PAIRS suppressed). This complements the existing `top_discipline_disagreement` audit rule, which **skips singletons** (the exact gap that hid M10FR).

**Applied:** 41 discipline corrections written to `kb_curation` (field=`discipline`) under `mismint-s113@bot`, INSERT-only `ON CONFLICT DO NOTHING`. 1 skipped (`ETHS M1132` already Kinesiology via wave 3).

**Scope:** the 25 HVAC-assigned + 18 three-signal Tier-A rows (deduped to 42). The remaining ~500 Tier-A candidates surface via the new `subject_discipline_outlier` audit signal in the Unified Courses tab for curator review + bulk re-discipline.

## Corrections by transition

- 6 · Air Conditioning, Refrigeration, Heating → **Diesel Mechanics**
- 5 · Air Conditioning, Refrigeration, Heating → **Electricity**
- 5 · Air Conditioning, Refrigeration, Heating → **Automotive Technology**
- 2 · Air Conditioning, Refrigeration, Heating → **Manufacturing Technology**
- 2 · Air Conditioning, Refrigeration, Heating → **Interior Design**
- 2 · English → **Reading**
- 2 · Ethnic Studies → **Kinesiology**
- 1 · Air Conditioning, Refrigeration, Heating → **Mathematics**
- 1 · Air Conditioning, Refrigeration, Heating → **Construction Management**
- 1 · Air Conditioning, Refrigeration, Heating → **Environmental Technologies**
- 1 · Air Conditioning, Refrigeration, Heating → **Computer Information Systems**
- 1 · Air Conditioning, Refrigeration, Heating → **Plumbing**
- 1 · Architecture → **Art**
- 1 · Art → **Interior Design**
- 1 · Business → **Mathematics**
- 1 · Communication Studies → **Journalism**
- 1 · Computer Science → **Multimedia**
- 1 · Computer Science → **Mathematics**
- 1 · Culinary Arts/Food Technology → **Mathematics**
- 1 · Dance → **Music**
- 1 · Disabled Student Programs and → **English**
- 1 · Ethnic Studies → **Political Science**
- 1 · Health → **Business**
- 1 · Physical Education Disabled Students → **Kinesiology**
- 1 · Physical Therapy Assisting → **Radiological Technology**
