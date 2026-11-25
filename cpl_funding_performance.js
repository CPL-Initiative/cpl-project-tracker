// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-11-25",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied -> transcribed; unlike eligible it does not carry the ACE/JST skill-level duplication, and unlike eligible it is an action the college took), PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch), PPA = APPLIED units among those same portal-origin students — the measure the Access metric asks for, and NOT a subset of PA: pe/pa/p2/p3 all EXCLUDE Potential Student = Yes, so PA and PPA describe disjoint cohorts (per MAP). PAC/PTC = APPLIED/TRANSCRIBED units for students whose Counselor step is checked (Counselor_Verified), both cohorts; present only when the pull carries that column. NC_PE/NC_PA/NC_PT = the same three rungs among students whose LocID2 resolves to a known noncredit origin (present only when the pull carries LocID2; see the `origination` block for the per-origin scoped cuts). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 10,
 "statewide": {
  "pe": 52846,
  "pa": 47731,
  "ppa": 125,
  "p2": 3741,
  "p3": 17062,
  "pp": 7,
  "ppe": 137,
  "pac": 5469,
  "ptc": 4779,
  "pe_u": 1670629.75,
  "pa_u": 293008.7,
  "ppa_u": 772.0,
  "ppe_u": 7261.0,
  "pac_u": 40131.2,
  "ptc_u": 33624.95,
  "p3_u": 87040.65,
  "pp_u": 73.5,
  "nc_exh": 466,
  "nc_course": 0,
  "nc_cdcp": 7134
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
   "pe": 88,
   "pe_u": 4963.0,
   "pa": 88,
   "pa_u": 264.0,
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
   "ppe_u": 21.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "Antelope Valley": {
   "pe": 284,
   "pe_u": 9809.0,
   "pa": 284,
   "pa_u": 1151.0,
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
   "pe": 644,
   "pe_u": 27861.0,
   "pa": 635,
   "pa_u": 9080.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 72.0,
   "p2": 77,
   "p3": 79,
   "p3_u": 1358.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 208.0,
   "pac": 231,
   "pac_u": 3136.5,
   "ptc": 79,
   "ptc_u": 1358.5,
   "nc_exh": 13,
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
   "pe": 2190,
   "pe_u": 18284.0,
   "pa": 2185,
   "pa_u": 10459.25,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 351,
   "p3": 1811,
   "p3_u": 7732.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 2028,
   "pac_u": 9437.75,
   "ptc": 1811,
   "ptc_u": 7732.5,
   "nc_exh": 95,
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
   "pe": 535,
   "pe_u": 22362.0,
   "pa": 535,
   "pa_u": 1605.0,
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
   "nc_exh": 11,
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
   "nc_exh": 4,
   "nc_course": 0,
   "nc_cdcp": 58
  },
  "Cerro Coso": {
   "pe": 193,
   "pe_u": 9578.0,
   "pa": 189,
   "pa_u": 1085.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 31.0,
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
   "pe": 1599,
   "pe_u": 36257.0,
   "pa": 1594,
   "pa_u": 20804.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 18.0,
   "p2": 25,
   "p3": 54,
   "p3_u": 414.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 94.0,
   "pac": 39,
   "pac_u": 289.5,
   "ptc": 36,
   "ptc_u": 280.5,
   "nc_exh": 5,
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
   "pe": 197,
   "pe_u": 8662.0,
   "pa": 197,
   "pa_u": 1189.0,
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
   "pe": 27,
   "pe_u": 1504.5,
   "pa": 27,
   "pa_u": 233.5,
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
   "pe": 26,
   "pe_u": 1350.0,
   "pa": 26,
   "pa_u": 182.0,
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
   "pe": 120,
   "pe_u": 4880.0,
   "pa": 11,
   "pa_u": 127.5,
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
   "pac_u": 102.0,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 58.5,
   "nc_exh": 6,
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
   "pe": 1000,
   "pe_u": 25659.0,
   "pa": 1000,
   "pa_u": 5079.5,
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
   "nc_exh": 30,
   "nc_course": 0,
   "nc_cdcp": 86
  },
  "Desert": {
   "pe": 487,
   "pe_u": 19894.5,
   "pa": 487,
   "pa_u": 2862.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 40,
   "p3": 43,
   "p3_u": 906.5,
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
   "ptc_u": 104.5,
   "nc_exh": 5,
   "nc_course": 0,
   "nc_cdcp": 188
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
   "pe": 403,
   "pe_u": 16217.0,
   "pa": 402,
   "pa_u": 1206.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 27,
   "p3_u": 81.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 32.0,
   "pac": 39,
   "pac_u": 117.0,
   "ptc": 27,
   "ptc_u": 81.0,
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
   "pe": 12,
   "pe_u": 586.0,
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
   "pe": 801,
   "pe_u": 30325.0,
   "pa": 801,
   "pa_u": 3022.0,
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
   "nc_exh": 1,
   "nc_course": 0,
   "nc_cdcp": 128
  },
  "Golden West": {
   "pe": 168,
   "pe_u": 8365.0,
   "pa": 168,
   "pa_u": 939.0,
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
   "pe": 812,
   "pe_u": 46033.0,
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
   "pe": 110,
   "pe_u": 4443.0,
   "pa": 109,
   "pa_u": 327.0,
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
   "nc_cdcp": 45
  },
  "Irvine": {
   "pe": 296,
   "pe_u": 10680.5,
   "pa": 295,
   "pa_u": 2025.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 68,
   "p3": 83,
   "p3_u": 1389.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 83,
   "pac_u": 1389.5,
   "ptc": 83,
   "ptc_u": 1389.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 40
  },
  "LA City": {
   "pe": 248,
   "pe_u": 9639.0,
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
   "pe": 2677,
   "pe_u": 43988.0,
   "pa": 2643,
   "pa_u": 37670.0,
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
   "pe": 468,
   "pe_u": 17657.0,
   "pa": 467,
   "pa_u": 1401.0,
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
   "ppe_u": 65.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 7,
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
   "pe": 129,
   "pe_u": 6524.0,
   "pa": 129,
   "pa_u": 789.0,
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
   "nc_exh": 60,
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
   "pe": 875,
   "pe_u": 39696.5,
   "pa": 875,
   "pa_u": 6127.5,
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
   "nc_exh": 14,
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
   "nc_exh": 6,
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
   "pe_u": 8035.0,
   "pa": 173,
   "pa_u": 1291.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 6.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 6.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 86
  },
  "Modesto": {
   "pe": 385,
   "pe_u": 8937.0,
   "pa": 373,
   "pa_u": 2461.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 32.0,
   "p2": 83,
   "p3": 211,
   "p3_u": 1560.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 10.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 32.0,
   "pac": 219,
   "pac_u": 1634.0,
   "ptc": 213,
   "ptc_u": 1570.5,
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
   "nc_exh": 4,
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
   "pe": 2581,
   "pe_u": 56665.0,
   "pa": 2251,
   "pa_u": 13786.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 53.5,
   "p2": 517,
   "p3": 2169,
   "p3_u": 13030.5,
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
   "nc_exh": 4,
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
   "nc_exh": 30,
   "nc_course": 0,
   "nc_cdcp": 196
  },
  "Mt. San Jacinto": {
   "pe": 538,
   "pe_u": 31375.0,
   "pa": 537,
   "pa_u": 2103.0,
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
   "p3": 244,
   "p3_u": 1157.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 246,
   "pac_u": 1165.5,
   "ptc": 244,
   "ptc_u": 1157.5,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 33
  },
  "Norco College": {
   "pe": 890,
   "pe_u": 29290.0,
   "pa": 889,
   "pa_u": 8114.5,
   "ppa": 12,
   "ppa_u": 73.0,
   "p2": 153,
   "p3": 437,
   "p3_u": 3992.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 12,
   "ppe_u": 585.0,
   "pac": 409,
   "pac_u": 4796.5,
   "ptc": 302,
   "ptc_u": 3249.0,
   "nc_exh": 6,
   "nc_course": 0,
   "nc_cdcp": 48
  },
  "Ohlone": {
   "pe": 132,
   "pe_u": 5351.0,
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
   "pe": 13,
   "pe_u": 998.0,
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
   "pe": 165,
   "pe_u": 8887.0,
   "pa": 164,
   "pa_u": 656.0,
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
   "pe": 29,
   "pe_u": 872.25,
   "pa": 29,
   "pa_u": 449.25,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 19,
   "p3": 20,
   "p3_u": 422.25,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 20,
   "pac_u": 422.25,
   "ptc": 20,
   "ptc_u": 422.25,
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
   "pe": 86,
   "pe_u": 3409.0,
   "pa": 86,
   "pa_u": 430.0,
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
   "pe": 89,
   "pe_u": 3267.0,
   "pa": 89,
   "pa_u": 267.0,
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
   "pe": 139,
   "pe_u": 5288.5,
   "pa": 119,
   "pa_u": 568.5,
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
   "nc_exh": 3,
   "nc_course": 0,
   "nc_cdcp": 73
  },
  "Rio Hondo": {
   "pe": 131,
   "pe_u": 5383.0,
   "pa": 131,
   "pa_u": 786.0,
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
   "pe": 934,
   "pe_u": 40386.0,
   "pa": 915,
   "pa_u": 4533.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 22,
   "p3": 914,
   "p3_u": 4528.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 83.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 3,
   "nc_course": 0,
   "nc_cdcp": 66
  },
  "Sacramento City": {
   "pe": 82,
   "pe_u": 3147.0,
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
   "pe": 420,
   "pe_u": 20121.0,
   "pa": 420,
   "pa_u": 2520.0,
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
   "nc_exh": 4,
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
   "pe": 4416,
   "pe_u": 102766.5,
   "pa": 4415,
   "pa_u": 15586.0,
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
   "nc_exh": 21,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "San Diego Mesa": {
   "pe": 4772,
   "pe_u": 110509.5,
   "pa": 4772,
   "pa_u": 16253.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 151,
   "p3": 3095,
   "p3_u": 9547.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 33.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 26,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "San Diego Miramar": {
   "pe": 3240,
   "pe_u": 101035.2,
   "pa": 3240,
   "pa_u": 13272.7,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 8.0,
   "p2": 178,
   "p3": 1502,
   "p3_u": 6294.7,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 226.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0,
   "nc_exh": 18,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "San Francisco": {
   "pe": 1875,
   "pe_u": 84069.5,
   "pa": 1873,
   "pa_u": 14116.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 11.0,
   "p2": 18,
   "p3": 35,
   "p3_u": 249.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 27.0,
   "pac": 62,
   "pac_u": 541.0,
   "ptc": 35,
   "ptc_u": 249.0,
   "nc_exh": 4,
   "nc_course": 0,
   "nc_cdcp": 141
  },
  "San Joaquin Delta": {
   "pe": 494,
   "pe_u": 20811.0,
   "pa": 493,
   "pa_u": 1479.0,
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
   "pe": 123,
   "pe_u": 6730.0,
   "pa": 106,
   "pa_u": 654.0,
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
   "pe": 569,
   "pe_u": 17671.8,
   "pa": 563,
   "pa_u": 2475.5,
   "ppa": 12,
   "ppa_u": 40.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": 26,
   "p3_u": 353.2,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 12,
   "ppe_u": 64.0,
   "pac": 32,
   "pac_u": 422.2,
   "ptc": 26,
   "ptc_u": 353.2,
   "nc_exh": 29,
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
   "pe": 448,
   "pe_u": 19442.0,
   "pa": 448,
   "pa_u": 1792.0,
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
   "pe": 188,
   "pe_u": 8032.0,
   "pa": 188,
   "pa_u": 1143.0,
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
   "pe": 699,
   "pe_u": 44505.0,
   "pa": 680,
   "pa_u": 3410.0,
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
   "pe": 204,
   "pe_u": 11910.0,
   "pa": 204,
   "pa_u": 1041.0,
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
   "pe": 346,
   "pe_u": 13762.0,
   "pa": 346,
   "pa_u": 1038.0,
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
   "pe": 60,
   "pe_u": 638.0,
   "pa": 60,
   "pa_u": 381.0,
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
   "pe_u": 2010.0,
   "pa": 295,
   "pa_u": 1017.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 21.0,
   "p2": 16,
   "p3": 48,
   "p3_u": 192.0,
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
   "pe": 777,
   "pe_u": 15378.5,
   "pa": 777,
   "pa_u": 9114.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 41.5,
   "p2": 513,
   "p3": 597,
   "p3_u": 7777.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 13.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 207.5,
   "pac": 603,
   "pac_u": 7891.5,
   "ptc": 597,
   "ptc_u": 7778.0,
   "nc_exh": 2,
   "nc_course": 0,
   "nc_cdcp": 138
  },
  "West Valley": {
   "pe": 73,
   "pe_u": 3083.0,
   "pa": 73,
   "pa_u": 438.0,
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
   "pe": 10,
   "pe_u": 324.0,
   "pa": 10,
   "pa_u": 22.0,
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
   "pe_u": 231.0,
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
 "unmatched": {},
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
    "pe": 88,
    "pa": 88,
    "p3": 0
   }
  },
  "Antelope Valley": {
   "Military": {
    "pe": 284,
    "pa": 284,
    "p3": 0
   }
  },
  "Bakersfield": {
   "Industry Certification": {
    "pe": 39,
    "pa": 36,
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
    "pe": 591,
    "pa": 586,
    "p3": 52
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
    "pe": 184,
    "pa": 179,
    "p3": null,
    "p3_suppressed": true
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
    "pe": 535,
    "pa": 535,
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
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
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
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification": {
    "pe": 30,
    "pa": 28,
    "p3": 25
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
    "pe": 411,
    "pa": 408,
    "p3": 17
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
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
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
    "pe": 197,
    "pa": 197,
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
    "pe": 27,
    "pa": 27,
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
    "pe": 26,
    "pa": 26,
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
    "pe": 108,
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
  "Desert": {
   "Industry Certification": {
    "pe": 46,
    "pa": 46,
    "p3": 36
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
    "pe": 434,
    "pa": 434,
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
  "Diablo Valley": {
   "Military": {
    "pe": 185,
    "pa": 185,
    "p3": 0
   }
  },
  "East LA": {
   "Military": {
    "pe": 403,
    "pa": 402,
    "p3": 27
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
    "pe": 12,
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
    "pe": 801,
    "pa": 801,
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
    "pe": 168,
    "pa": 168,
    "p3": 0
   }
  },
  "Grossmont": {
   "Military": {
    "pe": 812,
    "pa": 0,
    "p3": 0
   }
  },
  "Hartnell": {
   "Military": {
    "pe": 109,
    "pa": 109,
    "p3": 0
   }
  },
  "Irvine": {
   "Credit By Exam": {
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
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": 212,
    "pa": 212,
    "p3": 0
   },
   "Standardized Assessment": {
    "pe": 82,
    "pa": null,
    "p3": null,
    "pa_suppressed": true,
    "p3_suppressed": true
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
    "pe": 248,
    "pa": 248,
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
    "pe": 174,
    "pa": 140,
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
    "pe": 467,
    "pa": 467,
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
    "pe": 129,
    "pa": 129,
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
    "pe": 875,
    "pa": 875,
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
    "pe": 84,
    "pa": 79,
    "p3": 74
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
   "Credit By Exam | Industry Certification | Standardized Assessment": {
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
    "pe": 18,
    "pa": 17,
    "p3": 16
   },
   "Industry Certification": {
    "pe": 48,
    "pa": 46,
    "p3": 42
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
    "pe": 10,
    "pa": 10,
    "p3": 10
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
    "pe": 150,
    "pa": 150,
    "p3": null,
    "p3_suppressed": true
   },
   "Portfolio Review": {
    "pe": 22,
    "pa": 19,
    "p3": 18
   },
   "Standardized Assessment": {
    "pe": 28,
    "pa": 28,
    "p3": 27
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
   "Credit By Exam | Industry Certification": {
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
   "Credit By Exam | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 152,
    "pa": 151,
    "p3": 136
   },
   "Industry Certification | Military": {
    "pe": 17,
    "pa": 17,
    "p3": 17
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
   "Industry Certification | Other | Portfolio Review": {
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
    "pe": 1062,
    "pa": 1062,
    "p3": 999
   },
   "Standardized Assessment": {
    "pe": 265,
    "pa": 265,
    "p3": 265
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
    "p3": 21
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
    "p3": null,
    "p3_suppressed": true
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
    "pe": 565,
    "pa": 565,
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
    "pe": 132,
    "pa": 0,
    "p3": 0
   }
  },
  "Orange Coast": {
   "Military": {
    "pe": 13,
    "pa": 0,
    "p3": 0
   }
  },
  "Oxnard": {
   "Military": {
    "pe": 164,
    "pa": 164,
    "p3": 0
   }
  },
  "Palo Verde": {
   "Industry Certification": {
    "pe": null,
    "pa": null,
    "p3": 20,
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
    "pe": 86,
    "pa": 86,
    "p3": 0
   }
  },
  "Redwoods": {
   "Military": {
    "pe": 89,
    "pa": 89,
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
    "pe": 134,
    "pa": 115,
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
    "pe": 131,
    "pa": 131,
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
    "pe": 911,
    "pa": 892,
    "p3": 891
   }
  },
  "Sacramento City": {
   "Military": {
    "pe": 82,
    "pa": 0,
    "p3": 0
   }
  },
  "Saddleback": {
   "Military": {
    "pe": 420,
    "pa": 420,
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
    "pe": 1569,
    "pa": 1569,
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
    "pe": 3094,
    "pa": 3094,
    "p3": 3088
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
    "pe": 1475,
    "pa": 1475,
    "p3": 1467
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
    "pe": 1723,
    "pa": 1723,
    "p3": 0
   }
  },
  "San Francisco": {
   "Credit By Exam": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 19,
    "pa": 18,
    "p3": 12
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Military | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 1845,
    "pa": 1844,
    "p3": 15
   },
   "Military | Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Standardized Assessment": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "San Joaquin Delta": {
   "Military": {
    "pe": 493,
    "pa": 493,
    "p3": 0
   }
  },
  "San Jose City": {
   "Military": {
    "pe": 123,
    "pa": 106,
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
    "pe": 144,
    "pa": 144,
    "p3": 12
   },
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification": {
    "pe": 18,
    "pa": 16,
    "p3": 11
   },
   "Industry Certification | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
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
    "pe": 395,
    "pa": 395,
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
    "pe": 448,
    "pa": 448,
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
    "pe": 188,
    "pa": 188,
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
    "pe": 680,
    "pa": 680,
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
    "pe": 204,
    "pa": 204,
    "p3": 0
   }
  },
  "Victor Valley": {
   "Military": {
    "pe": 346,
    "pa": 346,
    "p3": 0
   }
  },
  "West Hills Coalinga": {
   "Military": {
    "pe": 11,
    "pa": 11,
    "p3": 0
   },
   "Standardized Assessment": {
    "pe": 49,
    "pa": 49,
    "p3": 46
   }
  },
  "West Hills Lemoore": {
   "Credit By Exam": {
    "pe": 263,
    "pa": 262,
    "p3": null,
    "p3_suppressed": true
   },
   "Credit By Exam | Industry Certification": {
    "pe": 14,
    "pa": 14,
    "p3": 0
   },
   "Military": {
    "pe": 20,
    "pa": 19,
    "p3": null,
    "p3_suppressed": true
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
    "pe": 590,
    "pa": 590,
    "p3": 569
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
    "pe": 152,
    "pa": 152,
    "p3": null,
    "p3_suppressed": true
   }
  },
  "West Valley": {
   "Military": {
    "pe": 73,
    "pa": 73,
    "p3": 0
   }
  },
  "Woodland": {
   "Military": {
    "pe": 10,
    "pa": 10,
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
   "pe": 11553,
   "pa": 11196,
   "p3": 10673
  },
  "Credit By Exam | Industry Certification": {
   "pe": 47,
   "pa": 45,
   "p3": 25
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
  "Credit By Exam | Industry Certification | Standardized Assessment": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Credit By Exam | Military": {
   "pe": 27,
   "pa": 27,
   "p3": 18
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
   "pe": 64,
   "pa": 63,
   "p3": 50
  },
  "Industry Certification": {
   "pe": 1502,
   "pa": 1478,
   "p3": 1240
  },
  "Industry Certification | Military": {
   "pe": 63,
   "pa": 62,
   "p3": 37
  },
  "Industry Certification | Military | Portfolio Review": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Industry Certification | Military | Standardized Assessment": {
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
  "Industry Certification | Other | Portfolio Review": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Industry Certification | Portfolio Review": {
   "pe": 31,
   "pa": 29,
   "p3": 21
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
   "pe": 31865,
   "pa": 28532,
   "p3": 2716
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
   "pe": 585,
   "pa": 579,
   "p3": 120
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
   "pe": 7029,
   "pa": 5674,
   "p3": 2132
  }
 },
 "cpl_types_note": "Distinct-student counts per college per `CPL Type Description`, for the funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row carries the student's TOTAL credits rather than that type's portion, so a per-type unit sum would attribute the whole total to every type a student carries. A student holding two types counts once under each, so the types do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads arrive already-transcribed by construction (students already in the college SIS, surfaced in MAP), so read p3 by type before treating a transcribed figure as lifecycle work.",
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1670629.75,
   "pa_u": 293008.7,
   "p3_u": 87040.65
  },
  "map": {
   "pe_u": 1677890.75,
   "pa_u": 293780.7,
   "p3_u": 87114.15
  },
  "ratio": {
   "pe_u": 1.0043,
   "pa_u": 1.0026,
   "p3_u": 1.0008
  }
 },
 "vet_star": {
  "LA Pierce": false,
  "Santiago Canyon": true,
  "Chaffey": true,
  "San Francisco": true,
  "San Diego Mesa": true,
  "San Diego City": true,
  "Moreno Valley": true,
  "San Diego Miramar": true,
  "Bakersfield": true,
  "Norco College": true,
  "Cabrillo": true,
  "Merced": true,
  "West LA": true,
  "Long Beach": true,
  "De Anza": true,
  "Riverside": false,
  "El Camino": true,
  "Coastline": true,
  "Southwestern": true,
  "Fresno City": true,
  "Mt San Antonio": true,
  "San Bernardino": false,
  "Desert": true,
  "Saddleback": false,
  "Santa Ana": true,
  "Modesto": false,
  "Mt. San Jacinto": true,
  "Barstow": true,
  "Cypress": true,
  "LA Valley": true,
  "Santa Rosa": true,
  "Irvine": true,
  "Sierra": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
  "LA Trade": true,
  "Mission": true,
  "East LA": false,
  "Clovis": true,
  "Antelope Valley": true,
  "Shasta": true,
  "Fullerton": true,
  "Cerro Coso": true,
  "Ventura": true,
  "Victor Valley": true,
  "Evergreen Valley": true,
  "Golden West": false,
  "Solano": false,
  "LA Mission": true,
  "Napa": true,
  "Sequoias": false,
  "Citrus": true,
  "Las Positas": false,
  "Rio Hondo": false,
  "West Hills Lemoore": false,
  "Oxnard": true,
  "San Jose City": true,
  "LA Harbor": true,
  "Merritt": true,
  "Allan Hancock": false,
  "Cerritos": true,
  "Diablo Valley": true,
  "San Mateo": true,
  "Reedley College": true,
  "Laney": true,
  "West Valley": true,
  "Porterville": true,
  "Lassen": true,
  "Palo Verde": false,
  "Hartnell": true,
  "Skyline": true,
  "Berkeley City": true,
  "Copper Mountain": true,
  "Foothill": false,
  "Pasadena": false,
  "West Hills Coalinga": false,
  "Redwoods": true,
  "American River": false,
  "Columbia": false,
  "Madera": true,
  "Crafton Hills": false,
  "Alameda": true,
  "Cuesta": true,
  "Los Medanos": true,
  "Compton": false,
  "Canada": false,
  "Santa Monica": false,
  "Woodland": false,
  "Mendocino": false,
  "Moorpark": true,
  "Monterey": false,
  "MiraCosta": false,
  "Grossmont": true,
  "LA City": true,
  "Ohlone": true,
  "Sacramento City": false,
  "Butte": false,
  "Cuyamaca": false,
  "Santa Barbara": true,
  "Chabot": false,
  "Gavilan": false,
  "Siskiyous": false,
  "Orange Coast": false,
  "Taft": false,
  "Feather River": true,
  "Yuba": false,
  "Imperial": false,
  "Contra Costa": false,
  "LA Swest": false,
  "Marin": false,
  "Palomar": false,
  "Lake Tahoe": false,
  "Cosumnes River": false,
  "Folsom Lake": false
 },
 "vet_star_as_of": "2026-11-25",
 "vet_star_threshold": 0.75,
 "vet_star_n": 71,
 "vet_jst": {
  "LA Pierce": {
   "vets": 286,
   "jst": 176,
   "pct": 0.6154
  },
  "Santiago Canyon": {
   "vets": 232,
   "jst": 374,
   "pct": 1.6121
  },
  "Chaffey": {
   "vets": 207,
   "jst": 420,
   "pct": 2.029
  },
  "San Francisco": {
   "vets": 1326,
   "jst": 1850,
   "pct": 1.3952
  },
  "San Diego Mesa": {
   "vets": 1151,
   "jst": 1684,
   "pct": 1.4631
  },
  "San Diego City": {
   "vets": 810,
   "jst": 1587,
   "pct": 1.9593
  },
  "Moreno Valley": {
   "vets": 938,
   "jst": 1084,
   "pct": 1.1557
  },
  "San Diego Miramar": {
   "vets": 1172,
   "jst": 1734,
   "pct": 1.4795
  },
  "Bakersfield": {
   "vets": 431,
   "jst": 609,
   "pct": 1.413
  },
  "Norco College": {
   "vets": 686,
   "jst": 587,
   "pct": 0.8557
  },
  "Cabrillo": {
   "vets": 93,
   "jst": 189,
   "pct": 2.0323
  },
  "Merced": {
   "vets": 231,
   "jst": 277,
   "pct": 1.1991
  },
  "West LA": {
   "vets": 147,
   "jst": 159,
   "pct": 1.0816
  },
  "Long Beach": {
   "vets": 880,
   "jst": 887,
   "pct": 1.008
  },
  "De Anza": {
   "vets": 273,
   "jst": 1004,
   "pct": 3.6777
  },
  "Riverside": {
   "vets": 1508,
   "jst": 914,
   "pct": 0.6061
  },
  "El Camino": {
   "vets": 327,
   "jst": 461,
   "pct": 1.4098
  },
  "Coastline": {
   "vets": 188,
   "jst": 1087,
   "pct": 5.7819
  },
  "Southwestern": {
   "vets": 675,
   "jst": 973,
   "pct": 1.4415
  },
  "Fresno City": {
   "vets": 709,
   "jst": 807,
   "pct": 1.1382
  },
  "Mt San Antonio": {
   "vets": 729,
   "jst": 733,
   "pct": 1.0055
  },
  "San Bernardino": {
   "vets": 1078,
   "jst": 215,
   "pct": 0.1994
  },
  "Desert": {
   "vets": 264,
   "jst": 441,
   "pct": 1.6705
  },
  "Saddleback": {
   "vets": 807,
   "jst": 432,
   "pct": 0.5353
  },
  "Santa Ana": {
   "vets": 392,
   "jst": 398,
   "pct": 1.0153
  },
  "Modesto": {
   "vets": 223,
   "jst": 156,
   "pct": 0.6996
  },
  "Mt. San Jacinto": {
   "vets": 639,
   "jst": 537,
   "pct": 0.8404
  },
  "Barstow": {
   "vets": 103,
   "jst": 155,
   "pct": 1.5049
  },
  "Cypress": {
   "vets": 249,
   "jst": 387,
   "pct": 1.5542
  },
  "LA Valley": {
   "vets": 213,
   "jst": 364,
   "pct": 1.7089
  },
  "Santa Rosa": {
   "vets": 591,
   "jst": 449,
   "pct": 0.7597
  },
  "Irvine": {
   "vets": 247,
   "jst": 212,
   "pct": 0.8583
  },
  "Sierra": {
   "vets": 344,
   "jst": 330,
   "pct": 0.9593
  },
  "Canyons": {
   "vets": 413,
   "jst": 535,
   "pct": 1.2954
  },
  "San Joaquin Delta": {
   "vets": 258,
   "jst": 495,
   "pct": 1.9186
  },
  "Glendale": {
   "vets": 192,
   "jst": 227,
   "pct": 1.1823
  },
  "LA Trade": {
   "vets": 310,
   "jst": 478,
   "pct": 1.5419
  },
  "Mission": {
   "vets": 167,
   "jst": 174,
   "pct": 1.0419
  },
  "East LA": {
   "vets": 642,
   "jst": 409,
   "pct": 0.6371
  },
  "Clovis": {
   "vets": 135,
   "jst": 201,
   "pct": 1.4889
  },
  "Antelope Valley": {
   "vets": 286,
   "jst": 285,
   "pct": 0.9965
  },
  "Shasta": {
   "vets": 250,
   "jst": 189,
   "pct": 0.756
  },
  "Fullerton": {
   "vets": 306,
   "jst": 563,
   "pct": 1.8399
  },
  "Cerro Coso": {
   "vets": 158,
   "jst": 193,
   "pct": 1.2215
  },
  "Ventura": {
   "vets": 238,
   "jst": 204,
   "pct": 0.8571
  },
  "Victor Valley": {
   "vets": 74,
   "jst": 350,
   "pct": 4.7297
  },
  "Evergreen Valley": {
   "vets": 92,
   "jst": 141,
   "pct": 1.5326
  },
  "Golden West": {
   "vets": 227,
   "jst": 170,
   "pct": 0.7489
  },
  "Solano": {
   "vets": 293,
   "jst": 136,
   "pct": 0.4642
  },
  "LA Mission": {
   "vets": 103,
   "jst": 152,
   "pct": 1.4757
  },
  "Napa": {
   "vets": 60,
   "jst": 53,
   "pct": 0.8833
  },
  "Sequoias": {
   "vets": 266,
   "jst": 174,
   "pct": 0.6541
  },
  "Citrus": {
   "vets": 166,
   "jst": 220,
   "pct": 1.3253
  },
  "Las Positas": {
   "vets": 234,
   "jst": 134,
   "pct": 0.5726
  },
  "Rio Hondo": {
   "vets": 203,
   "jst": 134,
   "pct": 0.6601
  },
  "West Hills Lemoore": {
   "vets": 76,
   "jst": 20,
   "pct": 0.2632
  },
  "Oxnard": {
   "vets": 149,
   "jst": 166,
   "pct": 1.1141
  },
  "San Jose City": {
   "vets": 153,
   "jst": 125,
   "pct": 0.817
  },
  "LA Harbor": {
   "vets": 114,
   "jst": 206,
   "pct": 1.807
  },
  "Merritt": {
   "vets": 39,
   "jst": 64,
   "pct": 1.641
  },
  "Allan Hancock": {
   "vets": 403,
   "jst": 145,
   "pct": 0.3598
  },
  "Cerritos": {
   "vets": 204,
   "jst": 170,
   "pct": 0.8333
  },
  "Diablo Valley": {
   "vets": 192,
   "jst": 186,
   "pct": 0.9688
  },
  "San Mateo": {
   "vets": 181,
   "jst": 182,
   "pct": 1.0055
  },
  "Reedley College": {
   "vets": 100,
   "jst": 136,
   "pct": 1.36
  },
  "Laney": {
   "vets": 68,
   "jst": 83,
   "pct": 1.2206
  },
  "West Valley": {
   "vets": 58,
   "jst": 75,
   "pct": 1.2931
  },
  "Porterville": {
   "vets": 51,
   "jst": 87,
   "pct": 1.7059
  },
  "Lassen": {
   "vets": 100,
   "jst": 140,
   "pct": 1.4
  },
  "Palo Verde": {
   "vets": 15,
   "jst": null,
   "jst_suppressed": true
  },
  "Hartnell": {
   "vets": 122,
   "jst": 111,
   "pct": 0.9098
  },
  "Skyline": {
   "vets": 138,
   "jst": 105,
   "pct": 0.7609
  },
  "Berkeley City": {
   "vets": 29,
   "jst": 52,
   "pct": 1.7931
  },
  "Copper Mountain": {
   "vets": 83,
   "jst": 83,
   "pct": 1.0
  },
  "Foothill": {
   "vets": 301,
   "jst": 76,
   "pct": 0.2525
  },
  "Pasadena": {
   "vets": 428,
   "jst": 146,
   "pct": 0.3411
  },
  "West Hills Coalinga": {
   "vets": 26,
   "jst": 11,
   "pct": 0.4231
  },
  "Redwoods": {
   "vets": 108,
   "jst": 90,
   "pct": 0.8333
  },
  "American River": {
   "vets": 311,
   "jst": 89,
   "pct": 0.2862
  },
  "Columbia": {
   "vets": 43,
   "jst": 27,
   "pct": 0.6279
  },
  "Madera": {
   "vets": 59,
   "jst": 50,
   "pct": 0.8475
  },
  "Crafton Hills": {
   "vets": 637,
   "jst": 26,
   "pct": 0.0408
  },
  "Alameda": {
   "vets": 21,
   "jst": 30,
   "pct": 1.4286
  },
  "Cuesta": {
   "vets": 208,
   "jst": 185,
   "pct": 0.8894
  },
  "Los Medanos": {
   "vets": 154,
   "jst": 231,
   "pct": 1.5
  },
  "Compton": {
   "vets": 45,
   "jst": 21,
   "pct": 0.4667
  },
  "Canada": {
   "vets": 52,
   "jst": 30,
   "pct": 0.5769
  },
  "Santa Monica": {
   "vets": 631,
   "jst": null,
   "jst_suppressed": true
  },
  "Woodland": {
   "vets": 24,
   "jst": 10,
   "pct": 0.4167
  },
  "Mendocino": {
   "vets": 61,
   "jst": null,
   "jst_suppressed": true
  },
  "Moorpark": {
   "vets": 204,
   "jst": 237,
   "pct": 1.1618
  },
  "Monterey": {
   "vets": 269,
   "jst": 136,
   "pct": 0.5056
  },
  "MiraCosta": {
   "vets": 725,
   "jst": null,
   "jst_suppressed": true
  },
  "Grossmont": {
   "vets": 428,
   "jst": 895,
   "pct": 2.0911
  },
  "LA City": {
   "vets": 330,
   "jst": 259,
   "pct": 0.7848
  },
  "Ohlone": {
   "vets": 56,
   "jst": 134,
   "pct": 2.3929
  },
  "Sacramento City": {
   "vets": 233,
   "jst": 124,
   "pct": 0.5322
  },
  "Butte": {
   "vets": 315,
   "jst": 123,
   "pct": 0.3905
  },
  "Cuyamaca": {
   "vets": 144,
   "jst": 95,
   "pct": 0.6597
  },
  "Santa Barbara": {
   "vets": 0,
   "jst": 86
  },
  "Chabot": {
   "vets": 293,
   "jst": 64,
   "pct": 0.2184
  },
  "Gavilan": {
   "vets": 269,
   "jst": 46,
   "pct": 0.171
  },
  "Siskiyous": {
   "vets": 65,
   "jst": 19,
   "pct": 0.2923
  },
  "Orange Coast": {
   "vets": 404,
   "jst": 14,
   "pct": 0.0347
  },
  "Taft": {
   "vets": 29,
   "jst": 12,
   "pct": 0.4138
  },
  "Feather River": {
   "vets": 12,
   "jst": 12,
   "pct": 1.0
  },
  "Yuba": {
   "vets": 78,
   "jst": null,
   "jst_suppressed": true
  },
  "Imperial": {
   "vets": 561,
   "jst": null,
   "jst_suppressed": true
  },
  "Contra Costa": {
   "vets": 36,
   "jst": null,
   "jst_suppressed": true
  },
  "LA Swest": {
   "vets": 67,
   "jst": 0,
   "pct": 0.0
  },
  "Marin": {
   "vets": 75,
   "jst": null,
   "jst_suppressed": true
  },
  "Palomar": {
   "vets": 1091,
   "jst": 0,
   "pct": 0.0
  },
  "Lake Tahoe": {
   "vets": 57,
   "jst": 0,
   "pct": 0.0
  },
  "Cosumnes River": {
   "vets": 138,
   "jst": 0,
   "pct": 0.0
  },
  "Folsom Lake": {
   "vets": 80,
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
    "nc_exh": 45,
    "nc_course": 0,
    "nc_cdcp": 310
   }
  }
 }
};
