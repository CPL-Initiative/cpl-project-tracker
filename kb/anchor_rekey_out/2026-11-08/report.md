---
title: Anchor re-key, applied
date: 2026-11-08
status: APPLIED 2026-11-08T21:21:30Z
---

# The curated anchor's flagged keys, re-keyed

Sam, Open Asks Sheet 171 card 4, 'As proposed', 2026-11-08 20:14Z: the three collisions take the next free number on their Common SUBJ, the three hospitality entries stay on the curator worklist, the 20 apply together.

Moved: 20 anchor keys (20 decided by this receipt, 0 by the 2026-11-05 recode's map). Crosswalk pointers re-pointed: 21. Held: the three `M-ID HOSP` keys (no Common SUBJ for Travel Services or Hotel and Motel Services). kb_curation rows on these keys at the fresh read: 0.

| Old key | New key | Kind | Discipline | Title |
|---|---|---|---|---|
| CNSR M10BM | CBIT M10BM | prefix_swap | Building Codes and Regulations | Blueprint Plans and Specification Reading |
| CNSR M10BN | CBIT M10BN | prefix_swap | Building Codes and Regulations | Combination Residential Dwelling Inspection |
| CNSR M10BO | CBIT M10BO | prefix_swap | Building Codes and Regulations | Concrete Inspection |
| CNSR M10BP | CBIT M10BP | prefix_swap | Building Codes and Regulations | Electrical Code Inspection |
| CNSR M10BQ | CBIT M10BQ | prefix_swap | Building Codes and Regulations | International Building Code Inspection |
| CNSR M10BR | CBIT M10BR | prefix_swap | Building Codes and Regulations | Mechanical Code - Heating, AC, Refrigeration, and Ductwork |
| CNSR M10BS | CBIT M10BS | prefix_swap | Building Codes and Regulations | Plumbing Codes - Drains, Waste, Vents, Water, and Gas |
| AUTD M10FX | DIES M10II | collision | Diesel Mechanics | Diesel Engines |
| AUTD M10FY | DIES M10IJ | collision | Diesel Mechanics | Diesel Fuel Management Systems |
| AUTD M10FZ | DIES M10IK | collision | Diesel Mechanics | Introduction to Heavy-Duty Diesel Repair |
| FTVE M10VO | FMED M10VO | prefix_swap | Media Production | Introduction to Nonlinear Editing |
| FTVE M10VP | FMED M10VP | prefix_swap | Media Production | Single Camera Production |
| FTVE M10VQ | FMED M10VQ | prefix_swap | Media Production | The TV News Field Report |
| GRAF M1066 | GFCD M1066 | prefix_swap | Graphic Arts | Digital Media |
| GRAF M10HZ | GFCD M10HZ | prefix_swap | Graphic Arts | Introduction to Screen Printing |
| GRAF M10IA | GFCD M10IA | prefix_swap | Graphic Arts | Motion Graphics |
| GRAF M10IB | GFCD M10IB | prefix_swap | Graphic Arts | Photoshop Skills for Graphic Designers |
| GRAF M10IC | GFCD M10IC | prefix_swap | Graphic Arts | Typography |
| PLGL M10IA | PARA M10KX | collision | Legal Assisting | Introduction to Legal Research and Terminology |
| PLGL M10IB | PARA M10KY | collision | Legal Assisting | Introduction to Paralegal Studies |
| M-ID HOSP 100 | held | ambiguous | Travel Services | Airline Computer Training |
| M-ID HOSP 102 | held | ambiguous | Hotel and Motel Services | Introduction to Hospitality & Tourism |
| M-ID HOSP 104 | held | ambiguous | Travel Services | Introduction to the Exciting World of Travel & Tourism |

## Gates

- PASS P1 the recomputed re-keys and prefix swaps equal the committed dry run
- PASS P1b every key the dry run left for a person is a collision or a held HOSP key
- PASS V1 twenty keys move, the three HOSP keys stay
- PASS V2 every new key is distinct
- PASS V3 no new key is a live record, another anchor key or a crosswalk pointer
- PASS V4 a key the chain did not decide lands on an id the chain never used
- PASS V5 every new key is on its discipline's Common SUBJ
- PASS P3 kb_curation holds no row on an old or new key (fresh read)

Rollback: `git revert` the commit; the map above read right to left is the inverse.
