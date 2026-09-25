// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-09-25",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied -> transcribed; unlike eligible it does not carry the ACE/JST skill-level duplication, and unlike eligible it is an action the college took), PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch), PPA = APPLIED units among those same portal-origin students — the measure the Access metric asks for, and NOT a subset of PA: pe/pa/p2/p3 all EXCLUDE Potential Student = Yes, so PA and PPA describe disjoint cohorts (per MAP). PAC/PTC = APPLIED/TRANSCRIBED units for students whose Counselor step is checked (Counselor_Verified), both cohorts; present only when the pull carries that column. NC_PE/NC_PA/NC_PT = the same three rungs among students whose LocID2 resolves to a known noncredit origin (present only when the pull carries LocID2; see the `origination` block for the per-origin scoped cuts). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 10,
 "statewide": {
  "pe": 43969,
  "pa": 39989,
  "ppa": 106,
  "p2": 3127,
  "p3": 14636,
  "pp": 6,
  "ppe": 116,
  "pac": 2908,
  "ptc": 2524,
  "pe_u": 1428094.7,
  "pa_u": 223045.9,
  "ppa_u": 660.5,
  "ppe_u": 6771.5,
  "pac_u": 25395.2,
  "ptc_u": 21764.5,
  "p3_u": 73882.2,
  "pp_u": 63.5
 },
 "colleges": {
  "Alameda": {
   "pe": 13,
   "pe_u": 529.0,
   "pa": 13,
   "pa_u": 78.0,
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
   "ptc_u": 0.0
  },
  "Allan Hancock": {
   "pe": 143,
   "pe_u": 6355.0,
   "pa": 143,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Antelope Valley": {
   "pe": 280,
   "pe_u": 9555.0,
   "pa": 280,
   "pa_u": 1135.0,
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
   "ppe_u": 42.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "Bakersfield": {
   "pe": 603,
   "pe_u": 26386.5,
   "pa": 595,
   "pa_u": 8707.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 66.0,
   "p2": 52,
   "p3": 53,
   "p3_u": 988.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 180.0,
   "pac": 191,
   "pac_u": 2688.0,
   "ptc": 53,
   "ptc_u": 988.0
  },
  "Barstow": {
   "pe": 137,
   "pe_u": 4865.0,
   "pa": 137,
   "pa_u": 1894.0,
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
  "Berkeley City": {
   "pe": 16,
   "pe_u": 887.0,
   "pa": 16,
   "pa_u": 96.0,
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
   "ptc_u": 0.0
  },
  "Butte": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 435.0,
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
   "ptc_u": 0.0
  },
  "Cabrillo": {
   "pe": 216,
   "pe_u": 8878.0,
   "pa": 211,
   "pa_u": 1274.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 17,
   "p3": 44,
   "p3_u": 255.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 55,
   "pac_u": 314.0,
   "ptc": 44,
   "ptc_u": 255.5
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
   "ptc_u": 0.0
  },
  "Canyons": {
   "pe": 519,
   "pe_u": 21822.0,
   "pa": 519,
   "pa_u": 1557.0,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Cerro Coso": {
   "pe": 182,
   "pe_u": 9257.5,
   "pa": 178,
   "pa_u": 986.0,
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
  "Chabot": {
   "pe": 46,
   "pe_u": 2043.0,
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
   "ptc_u": 0.0
  },
  "Chaffey": {
   "pe": 1522,
   "pe_u": 32966.5,
   "pa": 1518,
   "pa_u": 19072.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 6.0,
   "p2": 20,
   "p3": 47,
   "p3_u": 330.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 91.0,
   "pac": 32,
   "pac_u": 212.5,
   "ptc": 29,
   "ptc_u": 196.5
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
   "ptc_u": 0.0
  },
  "Clovis": {
   "pe": 189,
   "pe_u": 8181.0,
   "pa": 189,
   "pa_u": 1141.0,
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
   "ptc_u": 0.0
  },
  "Coastline": {
   "pe": 980,
   "pe_u": 68730.0,
   "pa": 556,
   "pa_u": 3443.0,
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
   "ptc_u": 0.0
  },
  "Columbia": {
   "pe": 25,
   "pe_u": 1419.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 12.0,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Copper Mountain": {
   "pe": 80,
   "pe_u": 3770.0,
   "pa": 79,
   "pa_u": 288.0,
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
   "ptc_u": 0.0
  },
  "Crafton Hills": {
   "pe": 21,
   "pe_u": 1045.0,
   "pa": 20,
   "pa_u": 140.0,
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
  "Cuesta": {
   "pe": 111,
   "pe_u": 4641.5,
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
   "ptc_u": 58.5
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
   "ptc_u": 0.0
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
   "ptc_u": 1.0
  },
  "De Anza": {
   "pe": 988,
   "pe_u": 24913.5,
   "pa": 988,
   "pa_u": 5019.5,
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
   "ptc_u": 0.0
  },
  "Desert": {
   "pe": 439,
   "pe_u": 18222.5,
   "pa": 439,
   "pa_u": 2439.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 4.0,
   "p2": 37,
   "p3": 37,
   "p3_u": 831.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 202.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 61.5,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 61.5
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
   "ptc_u": 0.0
  },
  "East LA": {
   "pe": 234,
   "pe_u": 9197.0,
   "pa": 233,
   "pa_u": 699.0,
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
   "ptc_u": 78.0
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
   "ptc_u": 0.0
  },
  "Evergreen Valley": {
   "pe": 111,
   "pe_u": 5205.5,
   "pa": 110,
   "pa_u": 663.5,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Foothill": {
   "pe": 73,
   "pe_u": 3300.0,
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
   "ptc_u": 0.0
  },
  "Fresno City": {
   "pe": 681,
   "pe_u": 25999.0,
   "pa": 681,
   "pa_u": 2302.0,
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
   "ppa_u": 7.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": 7.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 75.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Glendale": {
   "pe": 226,
   "pe_u": 10070.5,
   "pa": 226,
   "pa_u": 1348.5,
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
  "Golden West": {
   "pe": 98,
   "pe_u": 5306.0,
   "pa": 98,
   "pa_u": 588.0,
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
   "ptc_u": 0.0
  },
  "Grossmont": {
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
   "ppe_u": 17.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "Hartnell": {
   "pe": 63,
   "pe_u": 2545.0,
   "pa": 62,
   "pa_u": 186.0,
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
  "Irvine": {
   "pe": 132,
   "pe_u": 5798.0,
   "pa": 131,
   "pa_u": 393.0,
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
   "ptc_u": 0.0
  },
  "LA City": {
   "pe": 154,
   "pe_u": 6192.0,
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
   "ptc_u": 0.0
  },
  "LA Harbor": {
   "pe": 140,
   "pe_u": 5412.0,
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
   "ptc_u": 0.0
  },
  "LA Mission": {
   "pe": 163,
   "pe_u": 6823.0,
   "pa": 162,
   "pa_u": 945.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 20,
   "pac_u": 84.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "LA Pierce": {
   "pe": 392,
   "pe_u": 6709.0,
   "pa": 370,
   "pa_u": 1446.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 9.0,
   "p2": 20,
   "p3": 269,
   "p3_u": 1026.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 36.0,
   "pac": null,
   "pac_suppressed": true,
   "pac_u": 76.0,
   "ptc": null,
   "ptc_suppressed": true,
   "ptc_u": 64.0
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
   "ptc_u": 0.0
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
   "ptc_u": 945.0
  },
  "Laney": {
   "pe": 49,
   "pe_u": 2181.0,
   "pa": 49,
   "pa_u": 294.0,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Long Beach": {
   "pe": 809,
   "pe_u": 36440.5,
   "pa": 809,
   "pa_u": 5647.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 42.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 332.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "Los Medanos": {
   "pe": 221,
   "pe_u": 8966.0,
   "pa": 29,
   "pa_u": 105.0,
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
  "Madera": {
   "pe": 49,
   "pe_u": 1995.0,
   "pa": 49,
   "pa_u": 125.0,
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
   "ppe_u": 136.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Merced": {
   "pe": 3344,
   "pe_u": 29623.5,
   "pa": 1965,
   "pa_u": 10051.0,
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
   "ptc_u": 27.0
  },
  "Merritt": {
   "pe": 16,
   "pe_u": 796.0,
   "pa": 16,
   "pa_u": 84.0,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Mission": {
   "pe": 167,
   "pe_u": 7748.0,
   "pa": 167,
   "pa_u": 1002.0,
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
   "ptc_u": 0.0
  },
  "Modesto": {
   "pe": 349,
   "pe_u": 8365.0,
   "pa": 337,
   "pa_u": 2222.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 25.0,
   "p2": 73,
   "p3": 191,
   "p3_u": 1417.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 10.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 35.0,
   "pac": 196,
   "pac_u": 1469.0,
   "ptc": 193,
   "ptc_u": 1427.5
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
   "ptc_u": 0.0
  },
  "Moorpark": {
   "pe": 229,
   "pe_u": 9669.0,
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
   "ptc_u": 0.0
  },
  "Moreno Valley": {
   "pe": 2497,
   "pe_u": 53516.5,
   "pa": 2168,
   "pa_u": 12963.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 53.5,
   "p2": 478,
   "p3": 2105,
   "p3_u": 12407.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 38.5,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 265.5,
   "pac": 698,
   "pac_u": 2206.5,
   "ptc": 698,
   "ptc_u": 2206.5
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
   "ptc_u": 0.0
  },
  "Mt. San Jacinto": {
   "pe": 537,
   "pe_u": 31303.0,
   "pa": 536,
   "pa_u": 1608.0,
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
   "ppe_u": 72.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "Napa": {
   "pe": 55,
   "pe_u": 2264.0,
   "pa": 17,
   "pa_u": 53.0,
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
   "pac_u": 11.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "Norco College": {
   "pe": 777,
   "pe_u": 26648.0,
   "pa": 776,
   "pa_u": 6532.5,
   "ppa": 12,
   "ppa_u": 69.0,
   "p2": 153,
   "p3": 438,
   "p3_u": 3997.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 12,
   "ppe_u": 585.0,
   "pac": 318,
   "pac_u": 3426.5,
   "ptc": 303,
   "ptc_u": 3254.0
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Oxnard": {
   "pe": 159,
   "pe_u": 8625.0,
   "pa": 158,
   "pa_u": 632.0,
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
   "ptc_u": 0.0
  },
  "Palo Verde": {
   "pe": 20,
   "pe_u": 707.0,
   "pa": 20,
   "pa_u": 284.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 11,
   "p3": 11,
   "p3_u": 257.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 11,
   "pac_u": 257.0,
   "ptc": 11,
   "ptc_u": 257.0
  },
  "Pasadena": {
   "pe": 139,
   "pe_u": 6306.0,
   "pa": 139,
   "pa_u": 284.0,
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
   "ptc_u": 0.0
  },
  "Porterville": {
   "pe": 27,
   "pe_u": 675.0,
   "pa": 27,
   "pa_u": 135.0,
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
   "ptc_u": 0.0
  },
  "Redwoods": {
   "pe": 33,
   "pe_u": 1432.0,
   "pa": 33,
   "pa_u": 99.0,
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
  "Reedley College": {
   "pe": 133,
   "pe_u": 4997.5,
   "pa": 113,
   "pa_u": 541.5,
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
   "ptc_u": 0.0
  },
  "Rio Hondo": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 68.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": 12.0,
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
  "Riverside": {
   "pe": 887,
   "pe_u": 38799.0,
   "pa": 873,
   "pa_u": 4329.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 5.0,
   "p2": 12,
   "p3": 818,
   "p3_u": 3991.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 83.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "Sacramento City": {
   "pe": 75,
   "pe_u": 2906.0,
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
   "ppe_u": 148.0,
   "pac": 0,
   "pac_u": 0.0,
   "ptc": 0,
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "San Bernardino": {
   "pe": 313,
   "pe_u": 9521.0,
   "pa": 308,
   "pa_u": 2638.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 59,
   "p3": 87,
   "p3_u": 748.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 103,
   "pac_u": 859.0,
   "ptc": 87,
   "ptc_u": 748.0
  },
  "San Diego City": {
   "pe": 4346,
   "pe_u": 98468.5,
   "pa": 4345,
   "pa_u": 15306.0,
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
   "ptc_u": 0.0
  },
  "San Diego Mesa": {
   "pe": 4708,
   "pe_u": 106174.5,
   "pa": 4708,
   "pa_u": 15993.5,
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
   "ptc_u": 0.0
  },
  "San Diego Miramar": {
   "pe": 3161,
   "pe_u": 97041.2,
   "pa": 3161,
   "pa_u": 12952.7,
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
   "ptc_u": 0.0
  },
  "San Francisco": {
   "pe": 1759,
   "pe_u": 79735.5,
   "pa": 1758,
   "pa_u": 12594.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": 11,
   "p3_u": 64.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 49,
   "pac_u": 394.5,
   "ptc": 11,
   "ptc_u": 64.0
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
   "ptc_u": 0.0
  },
  "San Jose City": {
   "pe": 120,
   "pe_u": 6198.0,
   "pa": 102,
   "pa_u": 630.0,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Santa Ana": {
   "pe": 462,
   "pe_u": 16664.0,
   "pa": 457,
   "pa_u": 2060.2,
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
   "ppe_u": 28.0,
   "pac": 29,
   "pac_u": 374.2,
   "ptc": 0,
   "ptc_u": 0.0
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
   "ptc_u": 0.0
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
   "ppa_u": 24.0,
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
   "ptc_u": 0.0
  },
  "Santa Rosa": {
   "pe": 442,
   "pe_u": 19207.0,
   "pa": 442,
   "pa_u": 1768.0,
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
   "ptc_u": 0.0
  },
  "Santiago Canyon": {
   "pe": 682,
   "pe_u": 29064.5,
   "pa": 680,
   "pa_u": 15958.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 7.0,
   "p2": 208,
   "p3": 262,
   "p3_u": 3378.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 31.0,
   "pac": 265,
   "pac_u": 3416.5,
   "ptc": 262,
   "ptc_u": 3378.5
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Sierra": {
   "pe": 331,
   "pe_u": 11461.0,
   "pa": 331,
   "pa_u": 1655.0,
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
   "ptc_u": 0.0
  },
  "Solano": {
   "pe": 131,
   "pe_u": 6374.0,
   "pa": 131,
   "pa_u": 914.0,
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Ventura": {
   "pe": 186,
   "pe_u": 10735.0,
   "pa": 186,
   "pa_u": 945.0,
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
  "Victor Valley": {
   "pe": 336,
   "pe_u": 13366.0,
   "pa": 336,
   "pa_u": 1008.0,
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
   "ptc_u": 0.0
  },
  "West Hills Coalinga": {
   "pe": 51,
   "pe_u": 407.0,
   "pa": 51,
   "pa_u": 354.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 23,
   "p3": 45,
   "p3_u": 317.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 45,
   "pac_u": 317.0,
   "ptc": 45,
   "ptc_u": 317.0
  },
  "West Hills Lemoore": {
   "pe": 313,
   "pe_u": 2714.0,
   "pa": 306,
   "pa_u": 1053.0,
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
   "ptc_u": 0.0
  },
  "West LA": {
   "pe": 743,
   "pe_u": 14826.0,
   "pa": 743,
   "pa_u": 8739.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 42.0,
   "p2": 497,
   "p3": 563,
   "p3_u": 7446.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 3.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 275.0,
   "pac": 568,
   "pac_u": 7550.5,
   "ptc": 562,
   "ptc_u": 7437.0
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
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
    "pe": 13,
    "pa": 13,
    "p3": 0
   }
  },
  "Allan Hancock": {
   "Military": {
    "pe": 143,
    "pa": 143,
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
    "pe": 280,
    "pa": 280,
    "p3": 0
   }
  },
  "Bakersfield": {
   "Industry Certification": {
    "pe": 32,
    "pa": 29,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification | Military": {
    "pe": 11,
    "pa": 11,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 559,
    "pa": 555,
    "p3": 29
   }
  },
  "Barstow": {
   "Military": {
    "pe": 137,
    "pa": 137,
    "p3": 0
   }
  },
  "Berkeley City": {
   "Military": {
    "pe": 16,
    "pa": 16,
    "p3": 0
   }
  },
  "Butte": {
   "Military": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   }
  },
  "Cabrillo": {
   "Credit By Exam": {
    "pe": 17,
    "pa": 17,
    "p3": 15
   },
   "Credit By Exam | Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification": {
    "pe": 10,
    "pa": 10,
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
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 180,
    "pa": 175,
    "p3": 18
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
  "Canada": {
   "Military": {
    "pe": 29,
    "pa": 29,
    "p3": 0
   }
  },
  "Canyons": {
   "Military": {
    "pe": 519,
    "pa": 519,
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
    "pe": 182,
    "pa": 178,
    "p3": 0
   }
  },
  "Chabot": {
   "Military": {
    "pe": 46,
    "pa": 0,
    "p3": 0
   }
  },
  "Chaffey": {
   "Industry Certification": {
    "pe": 25,
    "pa": 23,
    "p3": 21
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
    "pe": 344,
    "pa": 342,
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
    "pe": 189,
    "pa": 189,
    "p3": 0
   }
  },
  "Coastline": {
   "Military": {
    "pe": 980,
    "pa": 556,
    "p3": 0
   }
  },
  "Columbia": {
   "Military": {
    "pe": 25,
    "pa": null,
    "pa_suppressed": true,
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
    "pa": 79,
    "p3": 0,
    "pe_suppressed": true
   }
  },
  "Crafton Hills": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": null,
    "pa": 20,
    "p3": 0,
    "pe_suppressed": true
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
    "pe": 103,
    "pa": null,
    "pa_suppressed": true,
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
    "pe": 402,
    "pa": 402,
    "p3": 0
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
    "pe": 234,
    "pa": 233,
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
    "pe": 111,
    "pa": 110,
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
    "pe": 681,
    "pa": 681,
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
    "pe": 226,
    "pa": 226,
    "p3": 0
   }
  },
  "Golden West": {
   "Military": {
    "pe": 98,
    "pa": 98,
    "p3": 0
   }
  },
  "Hartnell": {
   "Military": {
    "pe": 62,
    "pa": 62,
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
    "pa": 131,
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
    "pe": 140,
    "pa": 140,
    "p3": 0
   }
  },
  "LA Mission": {
   "Industry Certification": {
    "pe": 10,
    "pa": 10,
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
    "pe": 247,
    "pa": 247,
    "p3": 246
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
    "pe": null,
    "pa": null,
    "p3": null,
    "pe_suppressed": true,
    "pa_suppressed": true,
    "p3_suppressed": true
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
    "pe": 49,
    "pa": 49,
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
    "pe": 809,
    "pa": 809,
    "p3": 0
   }
  },
  "Los Medanos": {
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
    "p3": 0,
    "pe_suppressed": true,
    "pa_suppressed": true
   }
  },
  "Madera": {
   "Military": {
    "pe": 49,
    "pa": 49,
    "p3": 0
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
    "pe": 272,
    "pa": 272,
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
    "pe": 167,
    "pa": 167,
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
    "pe": 141,
    "pa": 141,
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
    "pe": 226,
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
    "pe": 141,
    "pa": 141,
    "p3": 130
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
    "pe": 1013,
    "pa": 1013,
    "p3": 961
   },
   "Standardized Assessment": {
    "pe": 249,
    "pa": 249,
    "p3": 249
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
    "pe": 534,
    "pa": null,
    "p3": 0,
    "pa_suppressed": true
   }
  },
  "Napa": {
   "Credit By Exam": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Military": {
    "pe": 49,
    "pa": 14,
    "p3": 0
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
   }
  },
  "Norco College": {
   "Credit By Exam": {
    "pe": 133,
    "pa": 133,
    "p3": 113
   },
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
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
    "pe": 544,
    "pa": 544,
    "p3": 249
   },
   "Portfolio Review": {
    "pe": 90,
    "pa": 90,
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
    "pe": 158,
    "pa": 158,
    "p3": 0
   }
  },
  "Palo Verde": {
   "Industry Certification": {
    "pe": null,
    "pa": null,
    "p3": 11,
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
    "pe": 139,
    "pa": 139,
    "p3": 0
   }
  },
  "Porterville": {
   "Military": {
    "pe": 27,
    "pa": 27,
    "p3": 0
   }
  },
  "Redwoods": {
   "Military": {
    "pe": 33,
    "pa": 33,
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
    "pe": 128,
    "pa": 109,
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
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
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
    "pe": 867,
    "pa": 853,
    "p3": 798
   }
  },
  "Sacramento City": {
   "Military": {
    "pe": 75,
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
    "pe": 28,
    "pa": 26,
    "p3": 13
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
    "pe": 202,
    "pa": 200,
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
    "pe": 1499,
    "pa": 1499,
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
    "pe": 1644,
    "pa": 1644,
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
    "p3": 0
   },
   "Military": {
    "pe": 1742,
    "pa": 1741,
    "p3": null,
    "p3_suppressed": true
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
    "pe": 120,
    "pa": 102,
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
    "pe": 62,
    "pa": 62,
    "p3": 0
   },
   "Industry Certification": {
    "pe": 15,
    "pa": 14,
    "p3": 0
   },
   "Industry Certification | Other": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": 377,
    "pa": 377,
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
    "p3": 0
   }
  },
  "Santa Rosa": {
   "Military": {
    "pe": 442,
    "pa": 442,
    "p3": 0
   }
  },
  "Santiago Canyon": {
   "Industry Certification": {
    "pe": 264,
    "pa": 263,
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
    "pe": null,
    "pa": null,
    "p3": 0,
    "pe_suppressed": true,
    "pa_suppressed": true
   },
   "Portfolio Review": {
    "pe": 307,
    "pa": 306,
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
    "pe": 331,
    "pa": 331,
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
    "pe": 131,
    "pa": 131,
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
    "pe": 186,
    "pa": 186,
    "p3": 0
   }
  },
  "Victor Valley": {
   "Military": {
    "pe": 336,
    "pa": 336,
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
    "p3": 45,
    "pe_suppressed": true,
    "pa_suppressed": true
   }
  },
  "West Hills Lemoore": {
   "Credit By Exam": {
    "pe": 268,
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
    "pe": 30,
    "pa": 29,
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
    "p3": 14
   },
   "Industry Certification": {
    "pe": 558,
    "pa": 558,
    "p3": 537
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
  }
 },
 "cpl_types_statewide": {
  "Credit By Exam": {
   "pe": 9522,
   "pa": 9160,
   "p3": 8726
  },
  "Credit By Exam | Industry Certification": {
   "pe": 44,
   "pa": 42,
   "p3": 23
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
   "pe": 20,
   "pa": 20,
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
   "pe": 16,
   "pa": 15,
   "p3": 14
  },
  "Industry Certification": {
   "pe": 1286,
   "pa": 1264,
   "p3": 1158
  },
  "Industry Certification | Military": {
   "pe": 51,
   "pa": 50,
   "p3": 29
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
   "pe": 26,
   "pa": 24,
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
   "pe": 27891,
   "pa": 25695,
   "p3": 2555
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
   "pe": 582,
   "pa": 576,
   "p3": 115
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
   "pe": 4461,
   "pa": 3106,
   "p3": 1959
  }
 },
 "cpl_types_note": "Distinct-student counts per college per `CPL Type Description`, for the funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row carries the student's TOTAL credits rather than that type's portion, so a per-type unit sum would attribute the whole total to every type a student carries. A student holding two types counts once under each, so the types do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads arrive already-transcribed by construction (students already in the college SIS, surfaced in MAP), so read p3 by type before treating a transcribed figure as lifecycle work.",
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1428094.7,
   "pa_u": 223045.9,
   "p3_u": 73882.2
  },
  "map": {
   "pe_u": 1434866.2,
   "pa_u": 223706.4,
   "p3_u": 73945.7
  },
  "ratio": {
   "pe_u": 1.0047,
   "pa_u": 1.003,
   "p3_u": 1.0009
  }
 },
 "vet_star": {
  "Santiago Canyon": false,
  "Chaffey": true,
  "San Diego Mesa": true,
  "San Diego City": true,
  "San Francisco": true,
  "San Diego Miramar": true,
  "Moreno Valley": true,
  "Bakersfield": true,
  "Merced": true,
  "West LA": true,
  "Norco College": false,
  "Long Beach": true,
  "De Anza": true,
  "Riverside": false,
  "El Camino": true,
  "Coastline": true,
  "Mt San Antonio": true,
  "Southwestern": true,
  "San Bernardino": true,
  "Fresno City": true,
  "Desert": true,
  "Modesto": true,
  "Cypress": true,
  "Santa Ana": true,
  "Barstow": true,
  "LA Valley": true,
  "Santa Rosa": true,
  "Cabrillo": true,
  "Sierra": true,
  "Mt. San Jacinto": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
  "LA Trade": true,
  "Clovis": true,
  "Antelope Valley": true,
  "Shasta": false,
  "LA Pierce": false,
  "Fullerton": true,
  "Victor Valley": true,
  "Mission": true,
  "Cerro Coso": true,
  "Ventura": false,
  "LA Mission": true,
  "Solano": false,
  "Sequoias": false,
  "Citrus": true,
  "West Hills Lemoore": false,
  "East LA": false,
  "Evergreen Valley": true,
  "Oxnard": true,
  "San Jose City": true,
  "Golden West": false,
  "Cerritos": true,
  "Allan Hancock": false,
  "Diablo Valley": true,
  "San Mateo": true,
  "Reedley College": true,
  "LA Harbor": true,
  "Lassen": true,
  "Irvine": false,
  "Saddleback": false,
  "West Valley": true,
  "Skyline": false,
  "Laney": false,
  "Foothill": false,
  "Copper Mountain": true,
  "Pasadena": false,
  "West Hills Coalinga": false,
  "Palo Verde": false,
  "Hartnell": false,
  "Crafton Hills": false,
  "Porterville": false,
  "American River": false,
  "Madera": true,
  "Las Positas": false,
  "Los Medanos": true,
  "Compton": false,
  "Redwoods": false,
  "Berkeley City": false,
  "Canada": false,
  "Merritt": false,
  "Alameda": false,
  "Cuesta": true,
  "Napa": true,
  "Santa Monica": false,
  "Mendocino": false,
  "Woodland": false,
  "Columbia": true,
  "Rio Hondo": false,
  "Moorpark": true,
  "Monterey": false,
  "MiraCosta": false,
  "LA City": false,
  "Ohlone": true,
  "Sacramento City": false,
  "Cuyamaca": false,
  "Santa Barbara": true,
  "Gavilan": false,
  "Chabot": false,
  "Taft": false,
  "Feather River": true,
  "Butte": false,
  "Imperial": false,
  "Contra Costa": false,
  "Grossmont": false,
  "Marin": false,
  "Yuba": false,
  "Orange Coast": false,
  "Siskiyous": false,
  "Palomar": false,
  "Lake Tahoe": false,
  "LA Swest": false,
  "Cosumnes River": false,
  "Folsom Lake": false
 },
 "vet_star_as_of": "2026-09-25",
 "vet_star_threshold": 0.75,
 "vet_star_n": 59
};
