# Re-mint dry run: the aed scope's ready M-IDs (2026-11-22)

DRY RUN. Nothing is re-keyed: no kb file, no table, no generated file. Written by `kb/_scope_remint_dryrun.py` from `kb/status/mid_readiness.json` (the draft gate `d-remint-ready-gate-draft-s707`, Sam's to set).

Scope: every M-ID with a member under Cerritos College's local code AED. Members read from unified_courses_members.js generated 2026-11-22 21:48; outcomes compare current: True.

## Count

| | M-IDs |
|---|---|
| Ready by the gate | 34 |
| Would move | 31 (31 gap-filled) |
| Stay where they are | 3 |
| Held for a person | 0 |

Checks: V0_every_ready_mid_has_a_record pass; V2_new_ids_unique_and_free pass; V3_prefix_is_the_settled_code pass; V4_every_ready_mid_accounted_for pass.

An apply would re-key: coci_curation.json keys 3; coci_articulations.json rows 0; coci_curation.json merge_into pointers 7.

Receipt (dry run): `kb/scope_remint_out/2026-11-22-aed/alias_map.json`.

## Would move

| Old | New | How | Discipline | Members | Title |
|---|---|---|---|---|---|
| ELEC M9055 | VOCE M9100 | gap-filled | Electricity to Vocational | 2 | IW Architectural 3 |
| ELEC M9060 | VOCE M9101 | gap-filled | Electricity to Vocational | 2 | Detailing for Reinforcing Iron |
| ELEC M9063 | VOCE M9102 | gap-filled | Electricity to Vocational | 3 | IW Lead Hazard - Structural |
| ELEC M90AP | VOCE M90RT | gap-filled | Electricity to Vocational | 1 | Ect Adv Theory & Applications |
| ELEC M90AS | VOCE M90RU | gap-filled | Electricity to Vocational | 1 | Iw-First Aid Multimedia |
| ELEC M90AW | VOCE M90RV | gap-filled | Electricity to Vocational | 1 | Elec Theory & Application |
| ELEC M90BF | VOCE M90RW | gap-filled | Electricity to Vocational | 1 | Introduction to Automotive Tools and Equipment |
| ELEC M90BL | VOCE M90RX | gap-filled | Electricity to Vocational | 1 | Introduction to Basic Welding for the Building Trades and Construction |
| ELEC M90BT | VOCE M90RY | gap-filled | Electricity to Vocational | 1 | Math Building Trades Const |
| ELEC M90BU | VOCE M90RZ | gap-filled | Electricity to Vocational | 1 | Metal Building Erection 1 |
| ELEC M90BV | VOCE M90SA | gap-filled | Electricity to Vocational | 1 | Introduction to Small Business Finances |
| ELEC M90BW | VOCE M90SB | gap-filled | Electricity to Vocational | 1 | Introduction to Small Business Finances (Spanish) |
| ELEC M90BX | VOCE M90SC | gap-filled | Electricity to Vocational | 1 | Growing a Small Business |
| ELEC M90BY | VOCE M90SD | gap-filled | Electricity to Vocational | 1 | Growing a Small Business (Spanish) |
| ELEC M90CA | VOCE M90SE | gap-filled | Electricity to Vocational | 1 | Social Media for Small Business Owners |
| ELEC M90CB | VOCE M90SF | gap-filled | Electricity to Vocational | 1 | Social Media for Small Business Owners (Spanish) |
| ELEC M90CE | VOCE M90SG | gap-filled | Electricity to Vocational | 1 | Electrical Calculations and Installation |
| ELEC M90CM | VOCE M90SH | gap-filled | Electricity to Vocational | 1 | Introduction to Paints, Coatings, Sealants, Repairs and Fillers, and Surface Conditions |
| ELEC M90CV | VOCE M90SI | gap-filled | Electricity to Vocational | 1 | IW Precast Concrete - Structural |
| ELEC M90CY | VOCE M90SJ | gap-filled | Electricity to Vocational | 1 | Intro to Construction |
| ELEC M90DF | VOCE M90SK | gap-filled | Electricity to Vocational | 1 | IW - Foreman-Scaffold Erector Dismantler-Forklift |
| ELEC M90DI | VOCE M90SL | gap-filled | Electricity to Vocational | 1 | Ect Ind Light Load & Theory |
| ELEC M90DL | VOCE M90SM | gap-filled | Electricity to Vocational | 1 | Electrical Lighting, Motors and HVAC Systems |
| ELEC M90DM | VOCE M90SN | gap-filled | Electricity to Vocational | 1 | Introduction to Electrical Trade |
| ELEC M90DY | VOCE M90SO | gap-filled | Electricity to Vocational | 1 | General Rigging-Reinforcing |
| ELEC M90ED | VOCE M90SP | gap-filled | Electricity to Vocational | 1 | Post-Tension 1 |
| ELEC M90EG | VOCE M90SQ | gap-filled | Electricity to Vocational | 1 | Post-Tension 2 |
| ELEC M90EJ | VOCE M90SR | gap-filled | Electricity to Vocational | 1 | Post-Tension 3 |
| ELEC M90EK | VOCE M90SS | gap-filled | Electricity to Vocational | 1 | Welding 3 - Reinforcing |
| ELEC M90EL | VOCE M90ST | gap-filled | Electricity to Vocational | 1 | Structural 3 |
| ELEC M90EO | VOCE M90SU | gap-filled | Electricity to Vocational | 1 | Professionalism in the Painting Trades/Job Planning and Surfaces |

## Stay

| M-ID | Members | Title | Why |
|---|---|---|---|
| ELEC M1018 | 2 | Cerritos Student Orientation Motivation Education and Training (COMET) | cross-listed: one college's one course under AED and ELAP; one identity, it stays (d-crosslisted-split-keeps-its-identity-s710) |
| ELEC M9044 | 2 | Solar Energy | cross-listed: one college's one course under AED and ELAP; one identity, it stays (d-crosslisted-split-keeps-its-identity-s710) |
| ELEC M9051 | 2 | Solar Panel Installation | cross-listed: one college's one course under AED and ELAP; one identity, it stays (d-crosslisted-split-keeps-its-identity-s710) |

## Held

None.

## Before an apply

The playbook, `docs/coursecontrolnumber_remint.md`: read the live `kb_curation` rows for the moved ids at write time; register the applied receipt in `kb/alias_chain.py` `ALIAS_MAPS` in the same commit; run `kb/_post_apply_chain.py`; re-key the generated files token for token; after the merge, `supabase-rekey.yml` with the receipt, the read-back, then `daily-dashboard.yml`, before the next cron.
