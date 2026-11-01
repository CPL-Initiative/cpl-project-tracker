// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-11-01",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied -> transcribed; unlike eligible it does not carry the ACE/JST skill-level duplication, and unlike eligible it is an action the college took), PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch), PPA = APPLIED units among those same portal-origin students — the measure the Access metric asks for, and NOT a subset of PA: pe/pa/p2/p3 all EXCLUDE Potential Student = Yes, so PA and PPA describe disjoint cohorts (per MAP). PAC/PTC = APPLIED/TRANSCRIBED units for students whose Counselor step is checked (Counselor_Verified), both cohorts; present only when the pull carries that column. NC_PE/NC_PA/NC_PT = the same three rungs among students whose LocID2 resolves to a known noncredit origin (present only when the pull carries LocID2; see the `origination` block for the per-origin scoped cuts). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 10,
 "statewide": {
  "pe": 50863,
  "pa": 46078,
  "ppa": 122,
  "p2": 3612,
  "p3": 16854,
  "pp": 7,
  "ppe": 134,
  "pac": 5301,
  "ptc": 4630,
  "pe_u": 1585701.95,
  "pa_u": 282147.4,
  "ppa_u": 758.5,
  "ppe_u": 7245.5,
  "pac_u": 37978.7,
  "ptc_u": 31692.45,
  "p3_u": 84611.15,
  "pp_u": 73.5,
  "nc_exh": 90,
  "nc_course": 0,
  "nc_cdcp": 6805
 },
 "colleges": {
  "Alameda": {
   "pe": 29,
   "pe_u": 1128.0,
   "pa": 29,
   "pa_u": 174.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 30.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 37
  },
  "Allan Hancock": {
   "pe": 145,
   "pe_u": 6394.0,
   "pa": 145,
   "pa_u": 580.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 62
  },
  "American River": {
   "pe": 44,
   "pe_u": 2377.0,
   "pa": 44,
   "pa_u": 132.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Antelope Valley": {
   "pe": 282,
   "pe_u": 9712.0,
   "pa": 282,
   "pa_u": 1143.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 71
  },
  "Bakersfield": {
   "pe": 629,
   "pe_u": 27151.0,
   "pa": 621,
   "pa_u": 9028.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 72.0,
   "p2": 64,
   "p3": 65,
   "p3_u": 1191.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 208.0,
   "pac": 210,
   "pac_u": 2913.5,
   "ptc": 65,
   "ptc_u": 1191.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 134
  },
  "Barstow": {
   "pe": 153,
   "pe_u": 5354.0,
   "pa": 153,
   "pa_u": 2093.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 15
  },
  "Berkeley City": {
   "pe": 51,
   "pe_u": 2497.0,
   "pa": 51,
   "pa_u": 306.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 30.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 27
  },
  "Butte": {
   "pe": 115,
   "pe_u": 4411.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 12.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 17
  },
  "Cabrillo": {
   "pe": 2187,
   "pe_u": 18153.0,
   "pa": 2182,
   "pa_u": 10417.25,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 351,
   "p3": 1810,
   "p3_u": 7729.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 2022,
   "pac_u": 9390.75,
   "ptc": 1810,
   "ptc_u": 7729.5,
   "nc_exh": 37,
   "nc_course": 0,
   "nc_cdcp": 166
  },
  "Canada": {
   "pe": 29,
   "pe_u": 1066.0,
   "pa": 29,
   "pa_u": 87.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 27.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Canyons": {
   "pe": 529,
   "pe_u": 22162.0,
   "pa": 529,
   "pa_u": 1587.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 23.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 23.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 272
  },
  "Cerritos": {
   "pe": 169,
   "pe_u": 6817.0,
   "pa": 169,
   "pa_u": 572.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 58
  },
  "Cerro Coso": {
   "pe": 189,
   "pe_u": 9373.5,
   "pa": 185,
   "pa_u": 1038.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 15
  },
  "Chabot": {
   "pe": 64,
   "pe_u": 2739.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 1,
   "nc_course": 0,
   "nc_cdcp": 76
  },
  "Chaffey": {
   "pe": 1569,
   "pe_u": 34995.0,
   "pa": 1564,
   "pa_u": 19944.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 12.0,
   "p2": 24,
   "p3": 52,
   "p3_u": 395.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 91.0,
   "pac": 37,
   "pac_u": 270.5,
   "ptc": 34,
   "ptc_u": 261.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 34
  },
  "Citrus": {
   "pe": 214,
   "pe_u": 8282.0,
   "pa": 214,
   "pa_u": 856.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 52
  },
  "Clovis": {
   "pe": 195,
   "pe_u": 8567.0,
   "pa": 195,
   "pa_u": 1177.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 159.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 26
  },
  "Coastline": {
   "pe": 1082,
   "pe_u": 75457.0,
   "pa": 605,
   "pa_u": 3698.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 10.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 24.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 90
  },
  "Columbia": {
   "pe": 25,
   "pe_u": 1433.0,
   "pa": 25,
   "pa_u": 173.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 5
  },
  "Compton": {
   "pe": 21,
   "pe_u": 600.0,
   "pa": 21,
   "pa_u": 131.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 21,
   "pac_u": 131.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 16
  },
  "Contra Costa": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 89.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 35
  },
  "Copper Mountain": {
   "pe": 83,
   "pe_u": 3856.0,
   "pa": 82,
   "pa_u": 297.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 201.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 46
  },
  "Crafton Hills": {
   "pe": 24,
   "pe_u": 1226.0,
   "pa": 24,
   "pa_u": 168.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 36
  },
  "Cuesta": {
   "pe": 115,
   "pe_u": 4732.5,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 69.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 58.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 61.5,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 58.5,
   "nc_exh": 1,
   "nc_course": 0,
   "nc_cdcp": 121
  },
  "Cuyamaca": {
   "pe": 93,
   "pe_u": 6939.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 29.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 4
  },
  "Cypress": {
   "pe": 640,
   "pe_u": 17353.5,
   "pa": 640,
   "pa_u": 2323.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 10,
   "p3": 19,
   "p3_u": 131.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 1.0,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 1.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 9
  },
  "De Anza": {
   "pe": 998,
   "pe_u": 25368.0,
   "pa": 998,
   "pa_u": 5069.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 58.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 3,
   "nc_course": 0,
   "nc_cdcp": 86
  },
  "Diablo Valley": {
   "pe": 185,
   "pe_u": 8062.0,
   "pa": 185,
   "pa_u": 564.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 201.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 42
  },
  "East LA": {
   "pe": 235,
   "pe_u": 9347.0,
   "pa": 234,
   "pa_u": 702.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 26,
   "p3_u": 78.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 32.0,
   "pac": 38,
   "pac_u": 114.0,
   "ptc": 26,
   "ptc_u": 78.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 99
  },
  "El Camino": {
   "pe": 460,
   "pe_u": 21892.0,
   "pa": 460,
   "pa_u": 4140.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 9.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 9.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 26.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 138
  },
  "Evergreen Valley": {
   "pe": 137,
   "pe_u": 6857.5,
   "pa": 136,
   "pa_u": 957.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 30.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Feather River": {
   "pe": 11,
   "pe_u": 454.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Foothill": {
   "pe": 73,
   "pe_u": 3285.0,
   "pa": 73,
   "pa_u": 292.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 213.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Fresno City": {
   "pe": 797,
   "pe_u": 30149.0,
   "pa": 797,
   "pa_u": 2998.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "Fullerton": {
   "pe": 555,
   "pe_u": 21595.0,
   "pa": 236,
   "pa_u": 1083.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 21.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 7.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 415.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Gavilan": {
   "pe": 46,
   "pe_u": 1891.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 42
  },
  "Glendale": {
   "pe": 227,
   "pe_u": 10081.5,
   "pa": 227,
   "pa_u": 1429.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 128
  },
  "Golden West": {
   "pe": 99,
   "pe_u": 5382.0,
   "pa": 99,
   "pa_u": 594.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 30.0,
   "pac": 59,
   "pac_u": 354.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 66
  },
  "Grossmont": {
   "pe": 576,
   "pe_u": 34696.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 17.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 3
  },
  "Hartnell": {
   "pe": 80,
   "pe_u": 3365.0,
   "pa": 79,
   "pa_u": 237.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 45
  },
  "Irvine": {
   "pe": 136,
   "pe_u": 6139.0,
   "pa": 135,
   "pa_u": 405.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 26.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 40
  },
  "LA City": {
   "pe": 193,
   "pe_u": 7706.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 161
  },
  "LA Harbor": {
   "pe": 205,
   "pe_u": 7296.0,
   "pa": 205,
   "pa_u": 615.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 92
  },
  "LA Mission": {
   "pe": 180,
   "pe_u": 6833.0,
   "pa": 179,
   "pa_u": 955.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 37,
   "pac_u": 94.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 12
  },
  "LA Pierce": {
   "pe": 2649,
   "pe_u": 43233.0,
   "pa": 2622,
   "pa_u": 37591.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 9.0,
   "p2": 26,
   "p3": 277,
   "p3_u": 1184.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 36.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 197.0,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 185.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 62
  },
  "LA Trade": {
   "pe": 408,
   "pe_u": 15165.0,
   "pa": 407,
   "pa_u": 1221.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 8,
   "nc_course": 0,
   "nc_cdcp": 75
  },
  "LA Valley": {
   "pe": 364,
   "pe_u": 15980.0,
   "pa": 363,
   "pa_u": 1815.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 5.0,
   "p2": 0,
   "p3": 189,
   "p3_u": 945.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 38.0,
   "pac": 193,
   "pac_u": 965.0,
   "ptc": 189,
   "ptc_u": 945.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 111
  },
  "Laney": {
   "pe": 82,
   "pe_u": 3439.0,
   "pa": 82,
   "pa_u": 492.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 39
  },
  "Las Positas": {
   "pe": 18,
   "pe_u": 1266.0,
   "pa": 18,
   "pa_u": 118.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 18.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 42.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 9,
   "nc_course": 0,
   "nc_cdcp": 58
  },
  "Lassen": {
   "pe": 140,
   "pe_u": 5743.0,
   "pa": 140,
   "pa_u": 420.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 22
  },
  "Long Beach": {
   "pe": 872,
   "pe_u": 39508.5,
   "pa": 872,
   "pa_u": 6105.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 53.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 428.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 2,
   "nc_course": 0,
   "nc_cdcp": 199
  },
  "Los Medanos": {
   "pe": 221,
   "pe_u": 8966.0,
   "pa": 29,
   "pa_u": 105.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 9.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 9.0,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 9.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 32
  },
  "Madera": {
   "pe": 49,
   "pe_u": 1992.0,
   "pa": 49,
   "pa_u": 199.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 4.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 136.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 4.0,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 4.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 25
  },
  "Mendocino": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 62.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 35.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 33
  },
  "Merced": {
   "pe": 3345,
   "pe_u": 29770.5,
   "pa": 1966,
   "pa_u": 10056.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 5.0,
   "p2": 911,
   "p3": 1926,
   "p3_u": 9856.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 26.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 27.0,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 27.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 45
  },
  "Merritt": {
   "pe": 65,
   "pe_u": 3106.0,
   "pa": 65,
   "pa_u": 586.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 6.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 28
  },
  "MiraCosta": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 30.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 18.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 301.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 39
  },
  "Mission": {
   "pe": 173,
   "pe_u": 8031.0,
   "pa": 173,
   "pa_u": 1272.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 6.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 86
  },
  "Modesto": {
   "pe": 354,
   "pe_u": 8503.0,
   "pa": 342,
   "pa_u": 2247.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 36.0,
   "p2": 73,
   "p3": 191,
   "p3_u": 1417.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 10.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 46.0,
   "pac": 196,
   "pac_u": 1469.0,
   "ptc": 193,
   "ptc_u": 1427.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 37
  },
  "Monterey": {
   "pe": 126,
   "pe_u": 5582.5,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 4.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 132.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 3,
   "nc_course": 0,
   "nc_cdcp": 82
  },
  "Moorpark": {
   "pe": 237,
   "pe_u": 10106.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 14.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 4.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 27
  },
  "Moreno Valley": {
   "pe": 2542,
   "pe_u": 55136.0,
   "pa": 2213,
   "pa_u": 13345.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 53.5,
   "p2": 498,
   "p3": 2148,
   "p3_u": 12779.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 38.5,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 265.5,
   "pac": 698,
   "pac_u": 2206.5,
   "ptc": 698,
   "ptc_u": 2206.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 61
  },
  "Mt San Antonio": {
   "pe": 732,
   "pe_u": 31389.5,
   "pa": 731,
   "pa_u": 2924.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 8.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 96.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 1,
   "nc_course": 0,
   "nc_cdcp": 196
  },
  "Mt. San Jacinto": {
   "pe": 538,
   "pe_u": 31375.0,
   "pa": 537,
   "pa_u": 1611.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 16
  },
  "Napa": {
   "pe": 297,
   "pe_u": 3421.5,
   "pa": 261,
   "pa_u": 1210.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 62,
   "p3": 243,
   "p3_u": 1154.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 246,
   "pac_u": 1165.5,
   "ptc": 243,
   "ptc_u": 1154.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 33
  },
  "Norco College": {
   "pe": 879,
   "pe_u": 28617.0,
   "pa": 878,
   "pa_u": 7938.5,
   "ppa": 12,
   "ppa_u": 69.0,
   "p2": 153,
   "p3": 437,
   "p3_u": 3992.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 12,
   "ppe_u": 585.0,
   "pac": 409,
   "pac_u": 4795.5,
   "ptc": 302,
   "ptc_u": 3249.0,
   "nc_exh": 3,
   "nc_course": 0,
   "nc_cdcp": 48
  },
  "Ohlone": {
   "pe": 130,
   "pe_u": 5231.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 114
  },
  "Orange Coast": {
   "pe": 0,
   "pe_u": 0.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 94.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 110
  },
  "Oxnard": {
   "pe": 161,
   "pe_u": 8717.0,
   "pa": 160,
   "pa_u": 640.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 30.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 25
  },
  "Palo Verde": {
   "pe": 28,
   "pe_u": 857.25,
   "pa": 28,
   "pa_u": 434.25,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 18,
   "p3": 19,
   "p3_u": 407.25,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 19,
   "pac_u": 407.25,
   "ptc": 19,
   "ptc_u": 407.25,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 17
  },
  "Pasadena": {
   "pe": 144,
   "pe_u": 6503.0,
   "pa": 144,
   "pa_u": 294.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 222.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 156
  },
  "Porterville": {
   "pe": 85,
   "pe_u": 3374.0,
   "pa": 85,
   "pa_u": 425.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 5.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 28.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 31
  },
  "Redwoods": {
   "pe": 74,
   "pe_u": 2832.0,
   "pa": 74,
   "pa_u": 222.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 24
  },
  "Reedley College": {
   "pe": 136,
   "pe_u": 5089.5,
   "pa": 116,
   "pa_u": 558.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 24.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 1,
   "nc_course": 0,
   "nc_cdcp": 73
  },
  "Rio Hondo": {
   "pe": 127,
   "pe_u": 5132.0,
   "pa": 127,
   "pa_u": 762.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 85
  },
  "Riverside": {
   "pe": 898,
   "pe_u": 39282.0,
   "pa": 882,
   "pa_u": 4352.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 20,
   "p3": 882,
   "p3_u": 4352.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 83.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 66
  },
  "Sacramento City": {
   "pe": 79,
   "pe_u": 3041.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 166.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Saddleback": {
   "pe": 57,
   "pe_u": 2683.0,
   "pa": 57,
   "pa_u": 342.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 175.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 3,
   "nc_course": 0,
   "nc_cdcp": 139
  },
  "San Bernardino": {
   "pe": 324,
   "pe_u": 9760.0,
   "pa": 319,
   "pa_u": 2718.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 59,
   "p3": 87,
   "p3_u": 748.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 109,
   "pac_u": 892.0,
   "ptc": 87,
   "ptc_u": 748.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 46
  },
  "San Diego City": {
   "pe": 4387,
   "pe_u": 100945.5,
   "pa": 4386,
   "pa_u": 15470.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 12.0,
   "p2": 190,
   "p3": 2837,
   "p3_u": 9245.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 415.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "San Diego Mesa": {
   "pe": 4748,
   "pe_u": 108838.5,
   "pa": 4748,
   "pa_u": 16153.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 150,
   "p3": 3095,
   "p3_u": 9543.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 33.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "San Diego Miramar": {
   "pe": 3211,
   "pe_u": 99671.2,
   "pa": 3211,
   "pa_u": 13152.7,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 8.0,
   "p2": 177,
   "p3": 1502,
   "p3_u": 6290.7,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 226.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "San Joaquin Delta": {
   "pe": 493,
   "pe_u": 20764.0,
   "pa": 492,
   "pa_u": 1476.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 30.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 28
  },
  "San Jose City": {
   "pe": 122,
   "pe_u": 6488.0,
   "pa": 105,
   "pa_u": 651.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 187.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 12
  },
  "San Mateo": {
   "pe": 180,
   "pe_u": 9420.0,
   "pa": 180,
   "pa_u": 540.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 175.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Santa Ana": {
   "pe": 482,
   "pe_u": 17069.5,
   "pa": 477,
   "pa_u": 2196.2,
   "ppa": 12,
   "ppa_u": 38.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": 26,
   "p3_u": 353.2,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 12,
   "ppe_u": 62.0,
   "pac": 30,
   "pac_u": 377.2,
   "ptc": 26,
   "ptc_u": 353.2,
   "nc_exh": 17,
   "nc_course": 0,
   "nc_cdcp": 216
  },
  "Santa Barbara": {
   "pe": 86,
   "pe_u": 4016.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 234
  },
  "Santa Monica": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 37.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 37.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 32.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 37.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 250.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 56
  },
  "Santa Rosa": {
   "pe": 443,
   "pe_u": 19216.0,
   "pa": 443,
   "pa_u": 1772.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 147.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 107
  },
  "Santiago Canyon": {
   "pe": 942,
   "pe_u": 40089.5,
   "pa": 940,
   "pa_u": 17811.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 7.0,
   "p2": 209,
   "p3": 263,
   "p3_u": 3395.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 31.0,
   "pac": 267,
   "pac_u": 3457.0,
   "ptc": 263,
   "ptc_u": 3395.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 208
  },
  "Sequoias": {
   "pe": 174,
   "pe_u": 8132.0,
   "pa": 174,
   "pa_u": 870.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 21
  },
  "Shasta": {
   "pe": 186,
   "pe_u": 7957.0,
   "pa": 186,
   "pa_u": 1131.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 24.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 7
  },
  "Sierra": {
   "pe": 329,
   "pe_u": 11379.0,
   "pa": 329,
   "pa_u": 1645.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 5.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 23.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 21
  },
  "Siskiyous": {
   "pe": 18,
   "pe_u": 469.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 30
  },
  "Skyline": {
   "pe": 105,
   "pe_u": 3966.0,
   "pa": 105,
   "pa_u": 315.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Solano": {
   "pe": 134,
   "pe_u": 6553.0,
   "pa": 134,
   "pa_u": 936.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 12.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 24.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 27
  },
  "Southwestern": {
   "pe": 572,
   "pe_u": 37161.0,
   "pa": 553,
   "pa_u": 2769.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 10.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 131.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 174
  },
  "Taft": {
   "pe": 12,
   "pe_u": 403.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 3
  },
  "Ventura": {
   "pe": 196,
   "pe_u": 11287.0,
   "pa": 196,
   "pa_u": 998.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 34
  },
  "Victor Valley": {
   "pe": 343,
   "pe_u": 13618.0,
   "pa": 343,
   "pa_u": 1029.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 22.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 50
  },
  "West Hills Coalinga": {
   "pe": 58,
   "pe_u": 603.0,
   "pa": 58,
   "pa_u": 375.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 23,
   "p3": 46,
   "p3_u": 320.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 46,
   "pac_u": 320.0,
   "ptc": 46,
   "ptc_u": 320.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 21
  },
  "West Hills Lemoore": {
   "pe": 297,
   "pe_u": 1998.0,
   "pa": 295,
   "pa_u": 1017.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 21.0,
   "p2": 16,
   "p3": 47,
   "p3_u": 189.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 30.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 25
  },
  "West LA": {
   "pe": 754,
   "pe_u": 15041.5,
   "pa": 754,
   "pa_u": 8894.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 45.0,
   "p2": 505,
   "p3": 574,
   "p3_u": 7611.0,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 13.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 249.0,
   "pac": 580,
   "pac_u": 7725.0,
   "ptc": 574,
   "ptc_u": 7611.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 138
  },
  "West Valley": {
   "pe": 55,
   "pe_u": 2020.0,
   "pa": 55,
   "pa_u": 330.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 204.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 99
  },
  "Woodland": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 222.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 17.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 4
  },
  "Yuba": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 35.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 6
  },
  "Cosumnes River": {
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Folsom Lake": {
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Imperial": {
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 28
  },
  "LA Swest": {
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 37
  },
  "Lake Tahoe": {
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 30
  },
  "Marin": {
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 12
  },
  "Palomar": {
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 50
  }
 },
 "unmatched": {
  "City College of San Francisco": {
   "pe": 1843,
   "pe_u": 82947.0,
   "pa": 1842,
   "pa_u": 13702.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 11.0,
   "p2": 16,
   "p3": 32,
   "p3_u": 225.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 27.0,
   "pac": null,
   "pac_u": 503.0,
   "ptc": null,
   "ptc_u": 225.5,
   "pac_suppressed": true,
   "pac_complementary": true,
   "ptc_suppressed": true,
   "ptc_complementary": true
  },
  "College of the Desert": {
   "pe": 469,
   "pe_u": 19167.5,
   "pa": 469,
   "pa_u": 2766.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 39,
   "p3": 42,
   "p3_u": 878.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 202.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 104.5,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 104.5
  }
 },
 "feeders": {
  "Calbright": {
   "pe": 117
  },
  "NOCE": {
   "pe": null,
   "pe_suppressed": true
  },
  "SD Cont. Ed": {
   "pe": null,
   "pe_suppressed": true
  }
 },
 "cpl_types": {
  "Alameda": {
   "Military": {
    "pe": 29,
    "pa": 29,
    "p3": 0
   }
  },
  "Allan Hancock": {
   "Military": {
    "pe": 145,
    "pa": 145,
    "p3": 0
   }
  },
  "American River": {
   "Military": {
    "pe": 44,
    "pa": 44,
    "p3": 0
   }
  },
  "Antelope Valley": {
   "Military": {
    "pe": 282,
    "pa": 282,
    "p3": 0
   }
  },
  "Bakersfield": {
   "Industry Certification": {
    "pe": 38,
    "pa": 35,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Military": {
    "pe": 13,
    "pa": 13,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 577,
    "pa": 573,
    "p3": 38
   }
  },
  "Barstow": {
   "Military": {
    "pe": 153,
    "pa": 153,
    "p3": 0
   }
  },
  "Berkeley City": {
   "Military": {
    "pe": 51,
    "pa": 51,
    "p3": 0
   }
  },
  "Butte": {
   "Military": {
    "pe": 115,
    "pa": 0,
    "p3": 0
   }
  },
  "Cabrillo": {
   "Credit By Exam": {
    "pe": 1808,
    "pa": 1808,
    "p3": 1797
   },
   "Credit By Exam | Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Credit By Exam | Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Credit By Exam | Standardized Assessment": {
    "pe": 16,
    "pa": 16,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 14,
    "pa": 14,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 181,
    "pa": 176,
    "p3": 0
   },
   "Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Standardized Assessment": {
    "pe": 156,
    "pa": 156,
    "p3": 0
   }
  },
  "Canada": {
   "Military": {
    "pe": 29,
    "pa": 29,
    "p3": 0
   }
  },
  "Canyons": {
   "Military": {
    "pe": 529,
    "pa": 529,
    "p3": 0
   }
  },
  "Cerritos": {
   "Military": {
    "pe": 169,
    "pa": 169,
    "p3": 0
   }
  },
  "Cerro Coso": {
   "Military": {
    "pe": 189,
    "pa": 185,
    "p3": 0
   }
  },
  "Chabot": {
   "Military": {
    "pe": 64,
    "pa": 0,
    "p3": 0
   }
  },
  "Chaffey": {
   "Credit By Exam": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 27,
    "pa": 25,
    "p3": 23
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 388,
    "pa": 385,
    "p3": 18
   },
   "Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Standardized Assessment": {
    "pe": 1148,
    "pa": 1148,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Citrus": {
   "Military": {
    "pe": 214,
    "pa": 214,
    "p3": 0
   }
  },
  "Clovis": {
   "Military": {
    "pe": 195,
    "pa": 195,
    "p3": 0
   }
  },
  "Coastline": {
   "Military": {
    "pe": 1082,
    "pa": 605,
    "p3": 0
   }
  },
  "Columbia": {
   "Military": {
    "pe": 25,
    "pa": 25,
    "p3": 0
   }
  },
  "Compton": {
   "Military": {
    "pe": 21,
    "pa": 21,
    "p3": 0
   }
  },
  "Contra Costa": {
   "Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   }
  },
  "Copper Mountain": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": null,
    "pa": 82,
    "p3": 0,
    "pe_suppressed": true
   }
  },
  "Crafton Hills": {
   "Military": {
    "pe": 24,
    "pa": 24,
    "p3": 0
   }
  },
  "Cuesta": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 106,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Military | Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Cuyamaca": {
   "Military": {
    "pe": 93,
    "pa": 0,
    "p3": 0
   }
  },
  "Cypress": {
   "Credit By Exam": {
    "pe": 115,
    "pa": 115,
    "p3": 13
   },
   "Credit By Exam | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 387,
    "pa": 387,
    "p3": null,
    "p3_suppressed": true
   },
   "Portfolio Review": {
    "pe": 133,
    "pa": 133,
    "p3": 0
   }
  },
  "De Anza": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": null,
    "pa": null,
    "p3": 0,
    "pe_suppressed": true,
    "pa_suppressed": true
   }
  },
  "Diablo Valley": {
   "Military": {
    "pe": 185,
    "pa": 185,
    "p3": 0
   }
  },
  "East LA": {
   "Military": {
    "pe": 235,
    "pa": 234,
    "p3": 26
   }
  },
  "El Camino": {
   "Military": {
    "pe": 460,
    "pa": 460,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Evergreen Valley": {
   "Military": {
    "pe": 137,
    "pa": 136,
    "p3": 0
   }
  },
  "Feather River": {
   "Military": {
    "pe": 11,
    "pa": 0,
    "p3": 0
   }
  },
  "Foothill": {
   "Military": {
    "pe": 73,
    "pa": 73,
    "p3": 0
   }
  },
  "Fresno City": {
   "Military": {
    "pe": 797,
    "pa": 797,
    "p3": 0
   }
  },
  "Fullerton": {
   "Military": {
    "pe": 555,
    "pa": 236,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Gavilan": {
   "Military": {
    "pe": 46,
    "pa": 0,
    "p3": 0
   }
  },
  "Glendale": {
   "Military": {
    "pe": 227,
    "pa": 227,
    "p3": 0
   }
  },
  "Golden West": {
   "Military": {
    "pe": 99,
    "pa": 99,
    "p3": 0
   }
  },
  "Grossmont": {
   "Military": {
    "pe": 576,
    "pa": 0,
    "p3": 0
   }
  },
  "Hartnell": {
   "Military": {
    "pe": 79,
    "pa": 79,
    "p3": 0
   }
  },
  "Irvine": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": null,
    "pa": 135,
    "p3": 0,
    "pe_suppressed": true
   }
  },
  "LA City": {
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": null,
    "pa": 0,
    "p3": 0,
    "pe_suppressed": true
   }
  },
  "LA Harbor": {
   "Military": {
    "pe": 205,
    "pa": 205,
    "p3": 0
   }
  },
  "LA Mission": {
   "Industry Certification": {
    "pe": 27,
    "pa": 27,
    "p3": 0
   },
   "Military": {
    "pe": 152,
    "pa": 152,
    "p3": 0
   }
  },
  "LA Pierce": {
   "Credit By Exam": {
    "pe": 241,
    "pa": 241,
    "p3": 241
   },
   "Credit By Exam | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 153,
    "pa": 126,
    "p3": 20
   },
   "Standardized Assessment": {
    "pe": 2239,
    "pa": 2239,
    "p3": 0
   }
  },
  "LA Trade": {
   "Military": {
    "pe": 407,
    "pa": 407,
    "p3": 0
   }
  },
  "LA Valley": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": null,
    "pa": 363,
    "p3": 189,
    "pe_suppressed": true
   }
  },
  "Laney": {
   "Military": {
    "pe": 82,
    "pa": 82,
    "p3": 0
   }
  },
  "Las Positas": {
   "Military": {
    "pe": 18,
    "pa": 18,
    "p3": 0
   }
  },
  "Lassen": {
   "Military": {
    "pe": 140,
    "pa": 140,
    "p3": 0
   }
  },
  "Long Beach": {
   "Military": {
    "pe": 872,
    "pa": 872,
    "p3": 0
   }
  },
  "Los Medanos": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": null,
    "pa": null,
    "p3": 0,
    "pe_suppressed": true,
    "pa_suppressed": true
   }
  },
  "Madera": {
   "Military": {
    "pe": 49,
    "pa": 49,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Mendocino": {
   "Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   }
  },
  "Merced": {
   "Credit By Exam": {
    "pe": 54,
    "pa": 32,
    "p3": 32
   },
   "Credit By Exam | Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Credit By Exam | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": 273,
    "pa": 273,
    "p3": 233
   },
   "Military | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Portfolio Review": {
    "pe": 17,
    "pa": 17,
    "p3": 17
   },
   "Portfolio Review | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Standardized Assessment": {
    "pe": 2985,
    "pa": 1631,
    "p3": 1631
   }
  },
  "Merritt": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": null,
    "pa": null,
    "p3": 0,
    "pe_suppressed": true,
    "pa_suppressed": true
   }
  },
  "MiraCosta": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   }
  },
  "Mission": {
   "Military": {
    "pe": 173,
    "pa": 173,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Modesto": {
   "Credit By Exam": {
    "pe": 72,
    "pa": 67,
    "p3": 66
   },
   "Credit By Exam | Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Industry Certification | Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Portfolio Review | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Standardized Assessment": {
    "pe": 14,
    "pa": 13,
    "p3": 12
   },
   "Industry Certification": {
    "pe": 45,
    "pa": 43,
    "p3": 40
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 146,
    "pa": 146,
    "p3": null,
    "p3_suppressed": true
   },
   "Portfolio Review": {
    "pe": 22,
    "pa": 19,
    "p3": 18
   },
   "Standardized Assessment": {
    "pe": 26,
    "pa": 26,
    "p3": 25
   }
  },
  "Monterey": {
   "Military": {
    "pe": 126,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   }
  },
  "Moorpark": {
   "Credit By Exam": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 234,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   }
  },
  "Moreno Valley": {
   "Credit By Exam": {
    "pe": 1070,
    "pa": 741,
    "p3": 741
   },
   "Credit By Exam | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 143,
    "pa": 143,
    "p3": 132
   },
   "Industry Certification | Military": {
    "pe": 16,
    "pa": 16,
    "p3": 16
   },
   "Industry Certification | Military | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 1045,
    "pa": 1045,
    "p3": 991
   },
   "Standardized Assessment": {
    "pe": 260,
    "pa": 260,
    "p3": 260
   }
  },
  "Mt San Antonio": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": null,
    "pa": 731,
    "p3": 0,
    "pe_suppressed": true
   }
  },
  "Mt. San Jacinto": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Military": {
    "pe": 535,
    "pa": null,
    "p3": 0,
    "pa_suppressed": true
   }
  },
  "Napa": {
   "Credit By Exam": {
    "pe": 151,
    "pa": 151,
    "p3": 150
   },
   "Credit By Exam | Standardized Assessment": {
    "pe": 21,
    "pa": 21,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 50,
    "pa": 17,
    "p3": null,
    "p3_suppressed": true
   },
   "Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Standardized Assessment": {
    "pe": 70,
    "pa": 70,
    "p3": 70
   }
  },
  "Norco College": {
   "Credit By Exam": {
    "pe": 133,
    "pa": 133,
    "p3": 113
   },
   "Industry Certification": {
    "pe": 93,
    "pa": 92,
    "p3": 0
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 554,
    "pa": 554,
    "p3": 248
   },
   "Portfolio Review": {
    "pe": 89,
    "pa": 89,
    "p3": 72
   }
  },
  "Ohlone": {
   "Military": {
    "pe": 130,
    "pa": 0,
    "p3": 0
   }
  },
  "Oxnard": {
   "Military": {
    "pe": 160,
    "pa": 160,
    "p3": 0
   }
  },
  "Palo Verde": {
   "Industry Certification": {
    "pe": null,
    "pa": null,
    "p3": 19,
    "pe_suppressed": true,
    "pa_suppressed": true
   },
   "Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   }
  },
  "Pasadena": {
   "Military": {
    "pe": 144,
    "pa": 144,
    "p3": 0
   }
  },
  "Porterville": {
   "Military": {
    "pe": 85,
    "pa": 85,
    "p3": 0
   }
  },
  "Redwoods": {
   "Military": {
    "pe": 74,
    "pa": 74,
    "p3": 0
   }
  },
  "Reedley College": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Military": {
    "pe": 131,
    "pa": 112,
    "p3": 0
   },
   "Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   }
  },
  "Rio Hondo": {
   "Military": {
    "pe": 127,
    "pa": 127,
    "p3": 0
   }
  },
  "Riverside": {
   "Industry Certification": {
    "pe": null,
    "pa": null,
    "p3": null,
    "pe_suppressed": true,
    "pa_suppressed": true,
    "p3_suppressed": true
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 878,
    "pa": 862,
    "p3": 862
   }
  },
  "Sacramento City": {
   "Military": {
    "pe": 79,
    "pa": 0,
    "p3": 0
   }
  },
  "Saddleback": {
   "Military": {
    "pe": 57,
    "pa": 57,
    "p3": 0
   }
  },
  "San Bernardino": {
   "Credit By Exam": {
    "pe": 66,
    "pa": 66,
    "p3": 62
   },
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 30,
    "pa": 28,
    "p3": 12
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 210,
    "pa": 208,
    "p3": null,
    "p3_suppressed": true
   },
   "Military | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "San Diego City": {
   "Credit By Exam": {
    "pe": 2830,
    "pa": 2830,
    "p3": 2823
   },
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 1540,
    "pa": 1540,
    "p3": 0
   },
   "Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   }
  },
  "San Diego Mesa": {
   "Credit By Exam": {
    "pe": 3095,
    "pa": 3095,
    "p3": 3089
   },
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": null,
    "pa": null,
    "p3": null,
    "p3_suppressed": true,
    "pe_suppressed": true,
    "pa_suppressed": true
   }
  },
  "San Diego Miramar": {
   "Credit By Exam": {
    "pe": 1476,
    "pa": 1476,
    "p3": 1468
   },
   "Credit By Exam | Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 35,
    "pa": 35,
    "p3": 29
   },
   "Military": {
    "pe": 1694,
    "pa": 1694,
    "p3": 0
   }
  },
  "San Joaquin Delta": {
   "Military": {
    "pe": 492,
    "pa": 492,
    "p3": 0
   }
  },
  "San Jose City": {
   "Military": {
    "pe": 122,
    "pa": 105,
    "p3": 0
   }
  },
  "San Mateo": {
   "Military": {
    "pe": 180,
    "pa": 180,
    "p3": 0
   }
  },
  "Santa Ana": {
   "Credit By Exam": {
    "pe": 69,
    "pa": 69,
    "p3": 12
   },
   "Industry Certification": {
    "pe": 16,
    "pa": 15,
    "p3": 11
   },
   "Industry Certification | Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": 387,
    "pa": 387,
    "p3": 0
   },
   "Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Santa Barbara": {
   "Military": {
    "pe": 86,
    "pa": 0,
    "p3": 0
   }
  },
  "Santa Monica": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "Santa Rosa": {
   "Military": {
    "pe": 443,
    "pa": 443,
    "p3": 0
   }
  },
  "Santiago Canyon": {
   "Industry Certification": {
    "pe": 266,
    "pa": 265,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 367,
    "pa": 367,
    "p3": 0
   },
   "Military | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Portfolio Review": {
    "pe": 306,
    "pa": 305,
    "p3": 0
   }
  },
  "Sequoias": {
   "Military": {
    "pe": 174,
    "pa": 174,
    "p3": 0
   }
  },
  "Shasta": {
   "Military": {
    "pe": 186,
    "pa": 186,
    "p3": 0
   }
  },
  "Sierra": {
   "Military": {
    "pe": 329,
    "pa": 329,
    "p3": 0
   }
  },
  "Siskiyous": {
   "Military": {
    "pe": 18,
    "pa": 0,
    "p3": 0
   }
  },
  "Skyline": {
   "Military": {
    "pe": 105,
    "pa": 105,
    "p3": 0
   }
  },
  "Solano": {
   "Military": {
    "pe": 134,
    "pa": 134,
    "p3": 0
   }
  },
  "Southwestern": {
   "Military": {
    "pe": 553,
    "pa": 553,
    "p3": 0
   }
  },
  "Taft": {
   "Military": {
    "pe": 12,
    "pa": 0,
    "p3": 0
   }
  },
  "Ventura": {
   "Military": {
    "pe": 196,
    "pa": 196,
    "p3": 0
   }
  },
  "Victor Valley": {
   "Military": {
    "pe": 343,
    "pa": 343,
    "p3": 0
   }
  },
  "West Hills Coalinga": {
   "Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Standardized Assessment": {
    "pe": null,
    "pa": null,
    "p3": 46,
    "pe_suppressed": true,
    "pa_suppressed": true
   }
  },
  "West Hills Lemoore": {
   "Credit By Exam": {
    "pe": 263,
    "pa": 262,
    "p3": 47
   },
   "Credit By Exam | Industry Certification": {
    "pe": null,
    "pa": null,
    "p3": 0,
    "pe_suppressed": true,
    "pa_suppressed": true
   },
   "Credit By Exam | Industry Certification | Military | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Military": {
    "pe": 19,
    "pa": 18,
    "p3": 0
   }
  },
  "West LA": {
   "Credit By Exam": {
    "pe": null,
    "pa": null,
    "p3": 10,
    "pe_suppressed": true,
    "pa_suppressed": true
   },
   "Credit By Exam | Industry Certification": {
    "pe": 18,
    "pa": 18,
    "p3": 15
   },
   "Industry Certification": {
    "pe": 568,
    "pa": 568,
    "p3": 546
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 151,
    "pa": 151,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "West Valley": {
   "Military": {
    "pe": 55,
    "pa": 55,
    "p3": 0
   }
  },
  "Woodland": {
   "Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   }
  },
  "Yuba": {
   "Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   }
  }
 },
 "cpl_types_statewide": {
  "Credit By Exam": {
   "pe": 11459,
   "pa": 11102,
   "p3": 10665
  },
  "Credit By Exam | Industry Certification": {
   "pe": 45,
   "pa": 43,
   "p3": 24
  },
  "Credit By Exam | Industry Certification | Military | Portfolio Review": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": 0
  },
  "Credit By Exam | Industry Certification | Other": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Credit By Exam | Industry Certification | Portfolio Review": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Credit By Exam | Military": {
   "pe": 21,
   "pa": 21,
   "p3": 16
  },
  "Credit By Exam | Other": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Credit By Exam | Portfolio Review": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Credit By Exam | Portfolio Review | Standardized Assessment": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Credit By Exam | Standardized Assessment": {
   "pe": 60,
   "pa": 59,
   "p3": 46
  },
  "Industry Certification": {
   "pe": 1389,
   "pa": 1368,
   "p3": 1157
  },
  "Industry Certification | Military": {
   "pe": 56,
   "pa": 55,
   "p3": 31
  },
  "Industry Certification | Military | Portfolio Review": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Industry Certification | Other": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Industry Certification | Portfolio Review": {
   "pe": 27,
   "pa": 25,
   "p3": 19
  },
  "Industry Certification | Standardized Assessment": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Military": {
   "pe": 27908,
   "pa": 24903,
   "p3": 2644
  },
  "Military | Other": {
   "pe": null,
   "pe_suppressed": true,
   "pa": 0,
   "p3": 0
  },
  "Military | Portfolio Review": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": 0
  },
  "Military | Standardized Assessment": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Other": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Portfolio Review": {
   "pe": 581,
   "pa": 575,
   "p3": 116
  },
  "Portfolio Review | Standardized Assessment": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Standardized Assessment": {
   "pe": 6934,
   "pa": 5579,
   "p3": 2038
  }
 },
 "cpl_types_note": "Distinct-student counts per college per `CPL Type Description`, for the funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row carries the student's TOTAL credits rather than that type's portion, so a per-type unit sum would attribute the whole total to every type a student carries. A student holding two types counts once under each, so the types do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads arrive already-transcribed by construction (students already in the college SIS, surfaced in MAP), so read p3 by type before treating a transcribed figure as lifecycle work.",
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1483587.45,
   "pa_u": 265678.9,
   "p3_u": 83507.15
  },
  "map": {
   "pe_u": 1490603.95,
   "pa_u": 266422.4,
   "p3_u": 83580.65
  },
  "ratio": {
   "pe_u": 1.0047,
   "pa_u": 1.0028,
   "p3_u": 1.0009
  }
 },
 "vet_star": {
  "LA Pierce": false,
  "Santiago Canyon": true,
  "Chaffey": true,
  "San Diego Mesa": true,
  "San Diego City": true,
  "San Diego Miramar": true,
  "Moreno Valley": true,
  "Bakersfield": true,
  "Norco College": false,
  "Cabrillo": true,
  "Merced": true,
  "West LA": true,
  "Long Beach": true,
  "De Anza": true,
  "Riverside": false,
  "El Camino": true,
  "Coastline": true,
  "Fresno City": true,
  "Mt San Antonio": true,
  "Southwestern": true,
  "San Bernardino": true,
  "Barstow": true,
  "Santa Ana": true,
  "Modesto": true,
  "Cypress": true,
  "LA Valley": true,
  "Santa Rosa": true,
  "Sierra": true,
  "Mt. San Jacinto": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
  "Mission": true,
  "LA Trade": true,
  "Clovis": true,
  "Antelope Valley": true,
  "Shasta": false,
  "Fullerton": true,
  "Cerro Coso": true,
  "Victor Valley": true,
  "Ventura": true,
  "Evergreen Valley": true,
  "Solano": false,
  "LA Mission": true,
  "Napa": true,
  "Sequoias": false,
  "Citrus": true,
  "Rio Hondo": true,
  "West Hills Lemoore": false,
  "East LA": false,
  "San Jose City": true,
  "Oxnard": true,
  "LA Harbor": true,
  "Golden West": false,
  "Merritt": true,
  "Allan Hancock": false,
  "Cerritos": true,
  "Diablo Valley": true,
  "San Mateo": true,
  "Reedley College": true,
  "Laney": true,
  "Porterville": true,
  "Lassen": true,
  "Irvine": false,
  "Saddleback": false,
  "West Valley": true,
  "Palo Verde": false,
  "Skyline": false,
  "Berkeley City": true,
  "Copper Mountain": true,
  "Foothill": false,
  "Pasadena": false,
  "West Hills Coalinga": false,
  "Hartnell": true,
  "Redwoods": true,
  "Madera": true,
  "Alameda": true,
  "Columbia": true,
  "Crafton Hills": false,
  "American River": false,
  "Las Positas": false,
  "Los Medanos": true,
  "Compton": false,
  "Canada": false,
  "Cuesta": true,
  "Santa Monica": false,
  "Mendocino": false,
  "Woodland": false,
  "Moorpark": true,
  "Monterey": false,
  "MiraCosta": false,
  "Grossmont": true,
  "LA City": false,
  "Ohlone": true,
  "Butte": false,
  "Sacramento City": false,
  "Cuyamaca": false,
  "Santa Barbara": true,
  "Chabot": false,
  "Gavilan": false,
  "Siskiyous": false,
  "Taft": false,
  "Feather River": true,
  "Yuba": false,
  "Imperial": false,
  "Contra Costa": false,
  "Marin": false,
  "Orange Coast": false,
  "Palomar": false,
  "Cosumnes River": false,
  "Folsom Lake": false,
  "Lake Tahoe": false,
  "LA Swest": false
 },
 "vet_star_as_of": "2026-11-01",
 "vet_star_threshold": 0.75,
 "vet_star_n": 68,
 "vet_jst": {
  "LA Pierce": {
   "vets": 296,
   "jst": 155,
   "pct": 0.5236
  },
  "Santiago Canyon": {
   "vets": 288,
   "jst": 374,
   "pct": 1.2986
  },
  "Chaffey": {
   "vets": 182,
   "jst": 393,
   "pct": 2.1593
  },
  "San Diego Mesa": {
   "vets": 1070,
   "jst": 1659,
   "pct": 1.5505
  },
  "San Diego City": {
   "vets": 776,
   "jst": 1557,
   "pct": 2.0064
  },
  "San Diego Miramar": {
   "vets": 1181,
   "jst": 1704,
   "pct": 1.4428
  },
  "Moreno Valley": {
   "vets": 916,
   "jst": 1065,
   "pct": 1.1627
  },
  "Bakersfield": {
   "vets": 416,
   "jst": 595,
   "pct": 1.4303
  },
  "Norco College": {
   "vets": 831,
   "jst": 576,
   "pct": 0.6931
  },
  "Cabrillo": {
   "vets": 102,
   "jst": 186,
   "pct": 1.8235
  },
  "Merced": {
   "vets": 142,
   "jst": 277,
   "pct": 1.9507
  },
  "West LA": {
   "vets": 122,
   "jst": 158,
   "pct": 1.2951
  },
  "Long Beach": {
   "vets": 307,
   "jst": 883,
   "pct": 2.8762
  },
  "De Anza": {
   "vets": 903,
   "jst": 1002,
   "pct": 1.1096
  },
  "Riverside": {
   "vets": 1508,
   "jst": 881,
   "pct": 0.5842
  },
  "El Camino": {
   "vets": 327,
   "jst": 461,
   "pct": 1.4098
  },
  "Coastline": {
   "vets": 231,
   "jst": 1087,
   "pct": 4.7056
  },
  "Fresno City": {
   "vets": 724,
   "jst": 803,
   "pct": 1.1091
  },
  "Mt San Antonio": {
   "vets": 699,
   "jst": 733,
   "pct": 1.0486
  },
  "Southwestern": {
   "vets": 584,
   "jst": 555,
   "pct": 0.9503
  },
  "San Bernardino": {
   "vets": 207,
   "jst": 215,
   "pct": 1.0386
  },
  "Barstow": {
   "vets": 106,
   "jst": 155,
   "pct": 1.4623
  },
  "Santa Ana": {
   "vets": 334,
   "jst": 389,
   "pct": 1.1647
  },
  "Modesto": {
   "vets": 80,
   "jst": 153,
   "pct": 1.9125
  },
  "Cypress": {
   "vets": 259,
   "jst": 387,
   "pct": 1.4942
  },
  "LA Valley": {
   "vets": 247,
   "jst": 364,
   "pct": 1.4737
  },
  "Santa Rosa": {
   "vets": 523,
   "jst": 444,
   "pct": 0.8489
  },
  "Sierra": {
   "vets": 326,
   "jst": 330,
   "pct": 1.0123
  },
  "Mt. San Jacinto": {
   "vets": 168,
   "jst": 537,
   "pct": 3.1964
  },
  "Canyons": {
   "vets": 382,
   "jst": 529,
   "pct": 1.3848
  },
  "San Joaquin Delta": {
   "vets": 248,
   "jst": 493,
   "pct": 1.9879
  },
  "Glendale": {
   "vets": 196,
   "jst": 227,
   "pct": 1.1582
  },
  "Mission": {
   "vets": 158,
   "jst": 173,
   "pct": 1.0949
  },
  "LA Trade": {
   "vets": 318,
   "jst": 414,
   "pct": 1.3019
  },
  "Clovis": {
   "vets": 117,
   "jst": 199,
   "pct": 1.7009
  },
  "Antelope Valley": {
   "vets": 281,
   "jst": 283,
   "pct": 1.0071
  },
  "Shasta": {
   "vets": 343,
   "jst": 187,
   "pct": 0.5452
  },
  "Fullerton": {
   "vets": 291,
   "jst": 563,
   "pct": 1.9347
  },
  "Cerro Coso": {
   "vets": 115,
   "jst": 190,
   "pct": 1.6522
  },
  "Victor Valley": {
   "vets": 97,
   "jst": 346,
   "pct": 3.567
  },
  "Ventura": {
   "vets": 254,
   "jst": 196,
   "pct": 0.7717
  },
  "Evergreen Valley": {
   "vets": 87,
   "jst": 141,
   "pct": 1.6207
  },
  "Solano": {
   "vets": 278,
   "jst": 136,
   "pct": 0.4892
  },
  "LA Mission": {
   "vets": 112,
   "jst": 152,
   "pct": 1.3571
  },
  "Napa": {
   "vets": 38,
   "jst": 50,
   "pct": 1.3158
  },
  "Sequoias": {
   "vets": 260,
   "jst": 174,
   "pct": 0.6692
  },
  "Citrus": {
   "vets": 181,
   "jst": 220,
   "pct": 1.2155
  },
  "Rio Hondo": {
   "vets": 172,
   "jst": 130,
   "pct": 0.7558
  },
  "West Hills Lemoore": {
   "vets": 61,
   "jst": 20,
   "pct": 0.3279
  },
  "East LA": {
   "vets": 637,
   "jst": 236,
   "pct": 0.3705
  },
  "San Jose City": {
   "vets": 148,
   "jst": 124,
   "pct": 0.8378
  },
  "Oxnard": {
   "vets": 118,
   "jst": 161,
   "pct": 1.3644
  },
  "LA Harbor": {
   "vets": 109,
   "jst": 206,
   "pct": 1.8899
  },
  "Golden West": {
   "vets": 219,
   "jst": 100,
   "pct": 0.4566
  },
  "Merritt": {
   "vets": 82,
   "jst": 64,
   "pct": 0.7805
  },
  "Allan Hancock": {
   "vets": 392,
   "jst": 145,
   "pct": 0.3699
  },
  "Cerritos": {
   "vets": 185,
   "jst": 170,
   "pct": 0.9189
  },
  "Diablo Valley": {
   "vets": 211,
   "jst": 186,
   "pct": 0.8815
  },
  "San Mateo": {
   "vets": 199,
   "jst": 182,
   "pct": 0.9146
  },
  "Reedley College": {
   "vets": 82,
   "jst": 132,
   "pct": 1.6098
  },
  "Laney": {
   "vets": 96,
   "jst": 83,
   "pct": 0.8646
  },
  "Porterville": {
   "vets": 52,
   "jst": 86,
   "pct": 1.6538
  },
  "Lassen": {
   "vets": 129,
   "jst": 140,
   "pct": 1.0853
  },
  "Irvine": {
   "vets": 217,
   "jst": 136,
   "pct": 0.6267
  },
  "Saddleback": {
   "vets": 873,
   "jst": 59,
   "pct": 0.0676
  },
  "West Valley": {
   "vets": 48,
   "jst": 56,
   "pct": 1.1667
  },
  "Palo Verde": {
   "vets": 24,
   "jst": null,
   "jst_suppressed": true
  },
  "Skyline": {
   "vets": 167,
   "jst": 105,
   "pct": 0.6287
  },
  "Berkeley City": {
   "vets": 42,
   "jst": 52,
   "pct": 1.2381
  },
  "Copper Mountain": {
   "vets": 72,
   "jst": 83,
   "pct": 1.1528
  },
  "Foothill": {
   "vets": 915,
   "jst": 76,
   "pct": 0.0831
  },
  "Pasadena": {
   "vets": 404,
   "jst": 146,
   "pct": 0.3614
  },
  "West Hills Coalinga": {
   "vets": 17,
   "jst": null,
   "jst_suppressed": true
  },
  "Hartnell": {
   "vets": 106,
   "jst": 80,
   "pct": 0.7547
  },
  "Redwoods": {
   "vets": 98,
   "jst": 75,
   "pct": 0.7653
  },
  "Madera": {
   "vets": 43,
   "jst": 50,
   "pct": 1.1628
  },
  "Alameda": {
   "vets": 30,
   "jst": 30,
   "pct": 1.0
  },
  "Columbia": {
   "vets": 33,
   "jst": 25,
   "pct": 0.7576
  },
  "Crafton Hills": {
   "vets": 577,
   "jst": 24,
   "pct": 0.0416
  },
  "American River": {
   "vets": 312,
   "jst": 44,
   "pct": 0.141
  },
  "Las Positas": {
   "vets": 233,
   "jst": 21,
   "pct": 0.0901
  },
  "Los Medanos": {
   "vets": 146,
   "jst": 230,
   "pct": 1.5753
  },
  "Compton": {
   "vets": 42,
   "jst": 21,
   "pct": 0.5
  },
  "Canada": {
   "vets": 47,
   "jst": 30,
   "pct": 0.6383
  },
  "Cuesta": {
   "vets": 206,
   "jst": 184,
   "pct": 0.8932
  },
  "Santa Monica": {
   "vets": 676,
   "jst": null,
   "jst_suppressed": true
  },
  "Mendocino": {
   "vets": 70,
   "jst": null,
   "jst_suppressed": true
  },
  "Woodland": {
   "vets": 15,
   "jst": null,
   "jst_suppressed": true
  },
  "Moorpark": {
   "vets": 179,
   "jst": 236,
   "pct": 1.3184
  },
  "Monterey": {
   "vets": 696,
   "jst": 136,
   "pct": 0.1954
  },
  "MiraCosta": {
   "vets": 619,
   "jst": null,
   "jst_suppressed": true
  },
  "Grossmont": {
   "vets": 415,
   "jst": 645,
   "pct": 1.5542
  },
  "LA City": {
   "vets": 301,
   "jst": 193,
   "pct": 0.6412
  },
  "Ohlone": {
   "vets": 49,
   "jst": 132,
   "pct": 2.6939
  },
  "Butte": {
   "vets": 290,
   "jst": 123,
   "pct": 0.4241
  },
  "Sacramento City": {
   "vets": 203,
   "jst": 119,
   "pct": 0.5862
  },
  "Cuyamaca": {
   "vets": 130,
   "jst": 95,
   "pct": 0.7308
  },
  "Santa Barbara": {
   "vets": 0,
   "jst": 86
  },
  "Chabot": {
   "vets": 304,
   "jst": 64,
   "pct": 0.2105
  },
  "Gavilan": {
   "vets": 352,
   "jst": 46,
   "pct": 0.1307
  },
  "Siskiyous": {
   "vets": 77,
   "jst": 19,
   "pct": 0.2468
  },
  "Taft": {
   "vets": 23,
   "jst": 12,
   "pct": 0.5217
  },
  "Feather River": {
   "vets": 13,
   "jst": 11,
   "pct": 0.8462
  },
  "Yuba": {
   "vets": 64,
   "jst": null,
   "jst_suppressed": true
  },
  "Imperial": {
   "vets": 489,
   "jst": null,
   "jst_suppressed": true
  },
  "Contra Costa": {
   "vets": 60,
   "jst": null,
   "jst_suppressed": true
  },
  "Marin": {
   "vets": 69,
   "jst": null,
   "jst_suppressed": true
  },
  "Orange Coast": {
   "vets": 396,
   "jst": null,
   "jst_suppressed": true
  },
  "Palomar": {
   "vets": 1019,
   "jst": 0,
   "pct": 0.0
  },
  "Cosumnes River": {
   "vets": 115,
   "jst": 0,
   "pct": 0.0
  },
  "Folsom Lake": {
   "vets": 65,
   "jst": 0,
   "pct": 0.0
  },
  "Lake Tahoe": {
   "vets": 92,
   "jst": 0,
   "pct": 0.0
  },
  "LA Swest": {
   "vets": 67,
   "jst": 0,
   "pct": 0.0
  }
 },
 "origination": {
  "in_scope": {
   "NOCE": {
    "nc_exh": 0,
    "nc_course": 0,
    "nc_cdcp": 199
   },
   "SD Cont. Ed": {
    "nc_exh": 1,
    "nc_course": 0,
    "nc_cdcp": 310
   }
  }
 }
};
