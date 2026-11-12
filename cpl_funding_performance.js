// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-11-12",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied -> transcribed; unlike eligible it does not carry the ACE/JST skill-level duplication, and unlike eligible it is an action the college took), PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch), PPA = APPLIED units among those same portal-origin students — the measure the Access metric asks for, and NOT a subset of PA: pe/pa/p2/p3 all EXCLUDE Potential Student = Yes, so PA and PPA describe disjoint cohorts (per MAP). PAC/PTC = APPLIED/TRANSCRIBED units for students whose Counselor step is checked (Counselor_Verified), both cohorts; present only when the pull carries that column. NC_PE/NC_PA/NC_PT = the same three rungs among students whose LocID2 resolves to a known noncredit origin (present only when the pull carries LocID2; see the `origination` block for the per-origin scoped cuts). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 10,
 "statewide": {
  "pe": 51867,
  "pa": 47037,
  "ppa": 121,
  "p2": 3631,
  "p3": 16898,
  "pp": 8,
  "ppe": 133,
  "pac": 5325,
  "ptc": 4649,
  "pe_u": 1632235.95,
  "pa_u": 287997.9,
  "ppa_u": 751.5,
  "ppe_u": 7145.5,
  "pac_u": 38183.7,
  "ptc_u": 31818.45,
  "p3_u": 84990.15,
  "pp_u": 79.5,
  "nc_exh": 90,
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
   "pe": 632,
   "pe_u": 27162.0,
   "pa": 624,
   "pa_u": 9027.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 77.0,
   "p2": 64,
   "p3": 65,
   "p3_u": 1191.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 213.0,
   "pac": 211,
   "pac_u": 2921.5,
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
   "pe": 2188,
   "pe_u": 18217.0,
   "pa": 2183,
   "pa_u": 10445.25,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 351,
   "p3": 1811,
   "p3_u": 7732.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 2026,
   "pac_u": 9425.75,
   "ptc": 1811,
   "ptc_u": 7732.5,
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
   "pe": 532,
   "pe_u": 22301.0,
   "pa": 532,
   "pa_u": 1596.0,
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
   "pe": 1596,
   "pe_u": 36181.0,
   "pa": 1591,
   "pa_u": 20104.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 12.0,
   "p2": 23,
   "p3": 51,
   "p3_u": 370.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 91.0,
   "pac": 38,
   "pac_u": 286.5,
   "ptc": 33,
   "ptc_u": 236.5,
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
   "pe": 196,
   "pe_u": 8587.0,
   "pa": 196,
   "pa_u": 1183.0,
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
   "pe": 26,
   "pe_u": 1482.0,
   "pa": 26,
   "pa_u": 224.0,
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
   "pe": 116,
   "pe_u": 4750.5,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 87.0,
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
   "nc_exh": 3,
   "nc_course": 0,
   "nc_cdcp": 86
  },
  "Desert": {
   "pe": 478,
   "pe_u": 19531.5,
   "pa": 478,
   "pa_u": 2802.5,
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
   "ptc_u": 104.5,
   "nc_exh": 0,
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
   "pe": 106,
   "pe_u": 5669.0,
   "pa": 106,
   "pa_u": 629.0,
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
   "pe": 606,
   "pe_u": 36124.0,
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
   "pe": 109,
   "pe_u": 4402.0,
   "pa": 108,
   "pa_u": 324.0,
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
   "pe": 222,
   "pe_u": 9639.5,
   "pa": 221,
   "pa_u": 661.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 1.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 26.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 1.5,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 1.5,
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
   "pe": 2671,
   "pe_u": 43778.0,
   "pa": 2638,
   "pa_u": 37650.0,
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
   "pe": 124,
   "pe_u": 6316.0,
   "pa": 124,
   "pa_u": 759.0,
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
   "pa_u": 1275.0,
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
   "pe": 367,
   "pe_u": 8692.0,
   "pa": 355,
   "pa_u": 2301.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 32.0,
   "p2": 75,
   "p3": 200,
   "p3_u": 1453.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 16.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 32.0,
   "pac": 206,
   "pac_u": 1511.0,
   "ptc": 203,
   "ptc_u": 1469.5,
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
   "pe": 2573,
   "pe_u": 56309.0,
   "pa": 2243,
   "pa_u": 13727.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 53.5,
   "p2": 510,
   "p3": 2159,
   "p3_u": 12942.5,
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
   "pe": 883,
   "pe_u": 28968.0,
   "pa": 882,
   "pa_u": 8065.5,
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
   "pe": 162,
   "pe_u": 8737.0,
   "pa": 161,
   "pa_u": 644.0,
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
   "pe": 137,
   "pe_u": 5132.5,
   "pa": 117,
   "pa_u": 563.5,
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
   "pe": 915,
   "pe_u": 39815.0,
   "pa": 896,
   "pa_u": 4441.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 21,
   "p3": 896,
   "p3_u": 4441.0,
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
   "pe": 80,
   "pe_u": 3060.0,
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
   "pe": 4395,
   "pe_u": 101487.5,
   "pa": 4394,
   "pa_u": 15502.0,
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
   "pe": 4754,
   "pe_u": 109364.5,
   "pa": 4754,
   "pa_u": 16177.5,
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
   "pe": 3218,
   "pe_u": 99905.2,
   "pa": 3218,
   "pa_u": 13184.7,
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
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 0
  },
  "San Francisco": {
   "pe": 1845,
   "pe_u": 83035.0,
   "pa": 1844,
   "pa_u": 13710.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 11.0,
   "p2": 16,
   "p3": 33,
   "p3_u": 226.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 27.0,
   "pac": 59,
   "pac_u": 503.5,
   "ptc": 33,
   "ptc_u": 226.0,
   "nc_exh": 0,
   "nc_course": 0,
   "nc_cdcp": 141
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
   "pe": 487,
   "pe_u": 17280.5,
   "pa": 482,
   "pa_u": 2216.2,
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
   "pe": 445,
   "pe_u": 19330.0,
   "pa": 445,
   "pa_u": 1780.0,
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
   "pe": 200,
   "pe_u": 11574.0,
   "pa": 200,
   "pa_u": 1021.0,
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
   "pe": 345,
   "pe_u": 13701.0,
   "pa": 345,
   "pa_u": 1035.0,
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
   "pe": 59,
   "pe_u": 621.0,
   "pa": 59,
   "pa_u": 378.0,
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
   "pe": 298,
   "pe_u": 2013.0,
   "pa": 296,
   "pa_u": 1020.0,
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
   "pe": 759,
   "pe_u": 15178.5,
   "pa": 759,
   "pa_u": 8980.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 27.0,
   "p2": 508,
   "p3": 579,
   "p3_u": 7697.0,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 13.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 152.0,
   "pac": 585,
   "pac_u": 7811.0,
   "ptc": 579,
   "ptc_u": 7697.5,
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
   "pe": 16,
   "pe_u": 574.5,
   "pa": 16,
   "pa_u": 43.0,
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
    "pe": 580,
    "pa": 576,
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
    "pe": 182,
    "pa": 177,
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
    "pe": 532,
    "pa": 532,
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
   "Credit By Exam | Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification": {
    "pe": 28,
    "pa": 26,
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
    "pe": 196,
    "pa": 196,
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
    "pe": 26,
    "pa": 26,
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
    "pe": 426,
    "pa": 426,
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
    "pe": 106,
    "pa": 106,
    "p3": 0
   }
  },
  "Grossmont": {
   "Military": {
    "pe": 606,
    "pa": 0,
    "p3": 0
   }
  },
  "Hartnell": {
   "Military": {
    "pe": 108,
    "pa": 108,
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
    "pe": 220,
    "pa": null,
    "p3": 0,
    "pa_suppressed": true
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
    "pe": 168,
    "pa": 135,
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
    "pe": 124,
    "pa": 124,
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
    "pe": 77,
    "pa": 72,
    "p3": 70
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
    "pe": 14,
    "pa": 13,
    "p3": 12
   },
   "Industry Certification": {
    "pe": 48,
    "pa": 46,
    "p3": 43
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
    "pe": 149,
    "pa": 149,
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
    "pe": 151,
    "pa": 150,
    "p3": 135
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
    "pe": 1055,
    "pa": 1055,
    "p3": 989
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
    "pe": 558,
    "pa": 558,
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
    "pe": 161,
    "pa": 161,
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
    "pe": 132,
    "pa": 113,
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
    "pe": 894,
    "pa": 875,
    "p3": 875
   }
  },
  "Sacramento City": {
   "Military": {
    "pe": 80,
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
    "pe": 1548,
    "pa": 1548,
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
    "pe": 1701,
    "pa": 1701,
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
    "pe": 16,
    "pa": 16,
    "p3": 11
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
    "pe": 1819,
    "pa": 1818,
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
    "pe": 392,
    "pa": 392,
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
    "pe": 445,
    "pa": 445,
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
    "pe": 200,
    "pa": 200,
    "p3": 0
   }
  },
  "Victor Valley": {
   "Military": {
    "pe": 345,
    "pa": 345,
    "p3": 0
   }
  },
  "West Hills Coalinga": {
   "Military": {
    "pe": 10,
    "pa": 10,
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
    "pe": 573,
    "pa": 573,
    "p3": 551
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
    "pe": 16,
    "pa": 16,
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
   "pe": 11472,
   "pa": 11115,
   "p3": 10670
  },
  "Credit By Exam | Industry Certification": {
   "pe": 47,
   "pa": 45,
   "p3": 25
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
  "Credit By Exam | Industry Certification | Standardized Assessment": {
   "pe": null,
   "pe_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Credit By Exam | Military": {
   "pe": 24,
   "pa": 24,
   "p3": 17
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
   "pe": 1471,
   "pa": 1449,
   "p3": 1217
  },
  "Industry Certification | Military": {
   "pe": 60,
   "pa": 59,
   "p3": 34
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
   "pe": 29,
   "pa": 27,
   "p3": 20
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
   "pe": 31095,
   "pa": 28045,
   "p3": 2671
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
   "pe": 584,
   "pa": 578,
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
   "pe": 6945,
   "pa": 5590,
   "p3": 2048
  }
 },
 "cpl_types_note": "Distinct-student counts per college per `CPL Type Description`, for the funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row carries the student's TOTAL credits rather than that type's portion, so a per-type unit sum would attribute the whole total to every type a student carries. A student holding two types counts once under each, so the types do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads arrive already-transcribed by construction (students already in the college SIS, surfaced in MAP), so read p3 by type before treating a transcribed figure as lifecycle work.",
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1632235.95,
   "pa_u": 287997.9,
   "p3_u": 84990.15
  },
  "map": {
   "pe_u": 1639381.45,
   "pa_u": 288749.4,
   "p3_u": 85069.65
  },
  "ratio": {
   "pe_u": 1.0044,
   "pa_u": 1.0026,
   "p3_u": 1.0009
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
  "Mt. San Jacinto": true,
  "Barstow": true,
  "Modesto": false,
  "Cypress": true,
  "LA Valley": true,
  "Santa Rosa": true,
  "Sierra": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
  "LA Trade": true,
  "Mission": true,
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
  "Rio Hondo": false,
  "West Hills Lemoore": false,
  "Las Positas": false,
  "East LA": false,
  "Irvine": true,
  "San Jose City": true,
  "Oxnard": true,
  "Golden West": false,
  "LA Harbor": true,
  "Merritt": true,
  "Allan Hancock": false,
  "Cerritos": true,
  "Diablo Valley": true,
  "San Mateo": true,
  "Reedley College": true,
  "Laney": true,
  "Porterville": true,
  "Lassen": true,
  "Palo Verde": false,
  "West Valley": true,
  "Hartnell": true,
  "Skyline": true,
  "Berkeley City": true,
  "Copper Mountain": true,
  "Foothill": false,
  "Pasadena": false,
  "West Hills Coalinga": false,
  "Columbia": false,
  "Redwoods": false,
  "Madera": true,
  "Crafton Hills": false,
  "Alameda": true,
  "American River": false,
  "Los Medanos": true,
  "Compton": false,
  "Canada": false,
  "Cuesta": true,
  "Woodland": false,
  "Santa Monica": false,
  "Mendocino": false,
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
 "vet_star_as_of": "2026-11-12",
 "vet_star_threshold": 0.75,
 "vet_star_n": 68,
 "vet_jst": {
  "LA Pierce": {
   "vets": 286,
   "jst": 170,
   "pct": 0.5944
  },
  "Santiago Canyon": {
   "vets": 232,
   "jst": 374,
   "pct": 1.6121
  },
  "Chaffey": {
   "vets": 207,
   "jst": 419,
   "pct": 2.0242
  },
  "San Francisco": {
   "vets": 1326,
   "jst": 1823,
   "pct": 1.3748
  },
  "San Diego Mesa": {
   "vets": 1151,
   "jst": 1665,
   "pct": 1.4466
  },
  "San Diego City": {
   "vets": 810,
   "jst": 1566,
   "pct": 1.9333
  },
  "Moreno Valley": {
   "vets": 938,
   "jst": 1077,
   "pct": 1.1482
  },
  "San Diego Miramar": {
   "vets": 1172,
   "jst": 1712,
   "pct": 1.4608
  },
  "Bakersfield": {
   "vets": 431,
   "jst": 599,
   "pct": 1.3898
  },
  "Norco College": {
   "vets": 686,
   "jst": 580,
   "pct": 0.8455
  },
  "Cabrillo": {
   "vets": 93,
   "jst": 187,
   "pct": 2.0108
  },
  "Merced": {
   "vets": 231,
   "jst": 277,
   "pct": 1.1991
  },
  "West LA": {
   "vets": 147,
   "jst": 156,
   "pct": 1.0612
  },
  "Long Beach": {
   "vets": 880,
   "jst": 884,
   "pct": 1.0045
  },
  "De Anza": {
   "vets": 273,
   "jst": 1004,
   "pct": 3.6777
  },
  "Riverside": {
   "vets": 1508,
   "jst": 897,
   "pct": 0.5948
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
   "jst": 803,
   "pct": 1.1326
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
   "jst": 432,
   "pct": 1.6364
  },
  "Saddleback": {
   "vets": 807,
   "jst": 431,
   "pct": 0.5341
  },
  "Santa Ana": {
   "vets": 392,
   "jst": 394,
   "pct": 1.0051
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
  "Modesto": {
   "vets": 223,
   "jst": 154,
   "pct": 0.6906
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
   "jst": 446,
   "pct": 0.7547
  },
  "Sierra": {
   "vets": 344,
   "jst": 330,
   "pct": 0.9593
  },
  "Canyons": {
   "vets": 413,
   "jst": 532,
   "pct": 1.2881
  },
  "San Joaquin Delta": {
   "vets": 258,
   "jst": 494,
   "pct": 1.9147
  },
  "Glendale": {
   "vets": 192,
   "jst": 227,
   "pct": 1.1823
  },
  "LA Trade": {
   "vets": 310,
   "jst": 477,
   "pct": 1.5387
  },
  "Mission": {
   "vets": 167,
   "jst": 174,
   "pct": 1.0419
  },
  "Clovis": {
   "vets": 135,
   "jst": 200,
   "pct": 1.4815
  },
  "Antelope Valley": {
   "vets": 286,
   "jst": 283,
   "pct": 0.9895
  },
  "Shasta": {
   "vets": 250,
   "jst": 187,
   "pct": 0.748
  },
  "Fullerton": {
   "vets": 306,
   "jst": 563,
   "pct": 1.8399
  },
  "Cerro Coso": {
   "vets": 158,
   "jst": 190,
   "pct": 1.2025
  },
  "Victor Valley": {
   "vets": 74,
   "jst": 349,
   "pct": 4.7162
  },
  "Ventura": {
   "vets": 238,
   "jst": 200,
   "pct": 0.8403
  },
  "Evergreen Valley": {
   "vets": 92,
   "jst": 141,
   "pct": 1.5326
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
  "Rio Hondo": {
   "vets": 203,
   "jst": 130,
   "pct": 0.6404
  },
  "West Hills Lemoore": {
   "vets": 76,
   "jst": 21,
   "pct": 0.2763
  },
  "Las Positas": {
   "vets": 234,
   "jst": 129,
   "pct": 0.5513
  },
  "East LA": {
   "vets": 642,
   "jst": 236,
   "pct": 0.3676
  },
  "Irvine": {
   "vets": 247,
   "jst": 221,
   "pct": 0.8947
  },
  "San Jose City": {
   "vets": 153,
   "jst": 124,
   "pct": 0.8105
  },
  "Oxnard": {
   "vets": 149,
   "jst": 163,
   "pct": 1.094
  },
  "Golden West": {
   "vets": 227,
   "jst": 107,
   "pct": 0.4714
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
   "jst": 134,
   "pct": 1.34
  },
  "Laney": {
   "vets": 68,
   "jst": 83,
   "pct": 1.2206
  },
  "Porterville": {
   "vets": 51,
   "jst": 86,
   "pct": 1.6863
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
  "West Valley": {
   "vets": 58,
   "jst": 56,
   "pct": 0.9655
  },
  "Hartnell": {
   "vets": 122,
   "jst": 110,
   "pct": 0.9016
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
   "jst": 10,
   "pct": 0.3846
  },
  "Columbia": {
   "vets": 43,
   "jst": 26,
   "pct": 0.6047
  },
  "Redwoods": {
   "vets": 108,
   "jst": 75,
   "pct": 0.6944
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
  "American River": {
   "vets": 311,
   "jst": 44,
   "pct": 0.1415
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
  "Cuesta": {
   "vets": 208,
   "jst": 184,
   "pct": 0.8846
  },
  "Woodland": {
   "vets": 24,
   "jst": 16,
   "pct": 0.6667
  },
  "Santa Monica": {
   "vets": 631,
   "jst": null,
   "jst_suppressed": true
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
   "jst": 677,
   "pct": 1.5818
  },
  "LA City": {
   "vets": 330,
   "jst": 193,
   "pct": 0.5848
  },
  "Ohlone": {
   "vets": 56,
   "jst": 132,
   "pct": 2.3571
  },
  "Butte": {
   "vets": 315,
   "jst": 123,
   "pct": 0.3905
  },
  "Sacramento City": {
   "vets": 233,
   "jst": 120,
   "pct": 0.515
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
  "Taft": {
   "vets": 29,
   "jst": 12,
   "pct": 0.4138
  },
  "Feather River": {
   "vets": 12,
   "jst": 11,
   "pct": 0.9167
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
  "Marin": {
   "vets": 75,
   "jst": null,
   "jst_suppressed": true
  },
  "Orange Coast": {
   "vets": 404,
   "jst": null,
   "jst_suppressed": true
  },
  "Palomar": {
   "vets": 1091,
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
  },
  "Lake Tahoe": {
   "vets": 57,
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
