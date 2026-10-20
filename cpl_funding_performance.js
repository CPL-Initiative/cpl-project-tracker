// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-10-20",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied -> transcribed; unlike eligible it does not carry the ACE/JST skill-level duplication, and unlike eligible it is an action the college took), PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch), PPA = APPLIED units among those same portal-origin students — the measure the Access metric asks for, and NOT a subset of PA: pe/pa/p2/p3 all EXCLUDE Potential Student = Yes, so PA and PPA describe disjoint cohorts (per MAP). PAC/PTC = APPLIED/TRANSCRIBED units for students whose Counselor step is checked (Counselor_Verified), both cohorts; present only when the pull carries that column. NC_PE/NC_PA/NC_PT = the same three rungs among students whose LocID2 resolves to a known noncredit origin (present only when the pull carries LocID2; see the `origination` block for the per-origin scoped cuts). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 10,
 "statewide": {
  "pe": 49268,
  "pa": 45140,
  "ppa": 119,
  "p2": 3584,
  "p3": 16751,
  "pp": 6,
  "ppe": 129,
  "pac": 5276,
  "ptc": 4604,
  "pe_u": 1505872.45,
  "pa_u": 275572.4,
  "ppa_u": 721.5,
  "ppe_u": 6825.5,
  "pac_u": 37724.7,
  "ptc_u": 31338.65,
  "p3_u": 83799.35,
  "pp_u": 63.5
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
   "pe": 281,
   "pe_u": 9619.0,
   "pa": 281,
   "pa_u": 1139.0,
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
   "pe": 623,
   "pe_u": 26954.0,
   "pa": 615,
   "pa_u": 8965.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 72.0,
   "p2": 65,
   "p3": 66,
   "p3_u": 1203.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 208.0,
   "pac": 206,
   "pac_u": 2893.5,
   "ptc": 66,
   "ptc_u": 1203.5
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
   "ptc_u": 0.0
  },
  "Butte": {
   "pe": 107,
   "pe_u": 4218.0,
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
   "pe": 2185,
   "pe_u": 18093.5,
   "pa": 2179,
   "pa_u": 10367.75,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 351,
   "p3": 1810,
   "p3_u": 7729.5,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 2018,
   "pac_u": 9342.75,
   "ptc": 1810,
   "ptc_u": 7729.5
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
   "pe": 527,
   "pe_u": 22048.0,
   "pa": 527,
   "pa_u": 1581.0,
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
   "pe": 184,
   "pe_u": 9180.5,
   "pa": 180,
   "pa_u": 1013.0,
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
   "ptc_u": 0.0
  },
  "Chaffey": {
   "pe": 1561,
   "pe_u": 34606.0,
   "pa": 1557,
   "pa_u": 19887.5,
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
   "pac": 37,
   "pac_u": 270.5,
   "ptc": 33,
   "ptc_u": 236.5
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
   "pe": 193,
   "pe_u": 8367.0,
   "pa": 193,
   "pa_u": 1165.0,
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
   "pe": 24,
   "pe_u": 1410.0,
   "pa": 19,
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
   "pe": 82,
   "pe_u": 3823.0,
   "pa": 81,
   "pa_u": 294.0,
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
   "pe": 115,
   "pe_u": 4716.5,
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
   "ptc_u": 0.0
  },
  "Desert": {
   "pe": 443,
   "pe_u": 18461.5,
   "pa": 443,
   "pa_u": 2455.5,
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
   "pe": 236,
   "pe_u": 9383.0,
   "pa": 235,
   "pa_u": 705.0,
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
   "pe": 113,
   "pe_u": 5223.5,
   "pa": 112,
   "pa_u": 675.5,
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
   "pe": 72,
   "pe_u": 3281.0,
   "pa": 72,
   "pa_u": 288.0,
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
   "pe": 752,
   "pe_u": 28617.0,
   "pa": 752,
   "pa_u": 2728.0,
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
   "pe": 135,
   "pe_u": 5948.0,
   "pa": 134,
   "pa_u": 402.0,
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
   "pe": 194,
   "pe_u": 7813.0,
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
   "pe": 178,
   "pe_u": 6832.0,
   "pa": 177,
   "pa_u": 954.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 35,
   "pac_u": 93.0,
   "ptc": 0,
   "ptc_u": 0.0
  },
  "LA Pierce": {
   "pe": 2650,
   "pe_u": 43180.0,
   "pa": 2624,
   "pa_u": 37622.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 9.0,
   "p2": 25,
   "p3": 276,
   "p3_u": 1155.0,
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
   "ptc_u": 185.0
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
   "pe": 79,
   "pe_u": 3233.0,
   "pa": 79,
   "pa_u": 474.0,
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
   "ppa_u": 48.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 368.0,
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
   "ptc_u": 27.0
  },
  "Merritt": {
   "pe": 65,
   "pe_u": 3150.0,
   "pa": 65,
   "pa_u": 378.0,
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
   "pe": 168,
   "pe_u": 7783.0,
   "pa": 168,
   "pa_u": 1008.0,
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
   "pe": 352,
   "pe_u": 8450.0,
   "pa": 340,
   "pa_u": 2237.0,
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
   "pe": 233,
   "pe_u": 9873.0,
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
   "pe": 2529,
   "pe_u": 54728.0,
   "pa": 2200,
   "pa_u": 13266.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 53.5,
   "p2": 495,
   "p3": 2136,
   "p3_u": 12705.5,
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
   "ptc_u": 0.0
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
   "ptc_u": 1154.5
  },
  "Norco College": {
   "pe": 875,
   "pe_u": 28461.0,
   "pa": 874,
   "pa_u": 7918.5,
   "ppa": 12,
   "ppa_u": 69.0,
   "p2": 153,
   "p3": 437,
   "p3_u": 3992.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 12,
   "ppe_u": 585.0,
   "pac": 410,
   "pac_u": 4800.5,
   "ptc": 302,
   "ptc_u": 3249.0
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
   "pe": 160,
   "pe_u": 8641.0,
   "pa": 159,
   "pa_u": 636.0,
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
   "pe": 25,
   "pe_u": 809.75,
   "pa": 25,
   "pa_u": 386.75,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 15,
   "p3": 16,
   "p3_u": 359.75,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 0,
   "ppe_u": 0.0,
   "pac": 16,
   "pac_u": 359.75,
   "ptc": 16,
   "ptc_u": 359.75
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
   "pe": 30,
   "pe_u": 863.0,
   "pa": 30,
   "pa_u": 150.0,
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
   "pe": 53,
   "pe_u": 2200.0,
   "pa": 53,
   "pa_u": 159.0,
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
   "pe": 135,
   "pe_u": 5045.5,
   "pa": 115,
   "pa_u": 555.5,
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
   "pe": 899,
   "pe_u": 39328.0,
   "pa": 885,
   "pa_u": 4404.0,
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
   "pe": 77,
   "pe_u": 2963.0,
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
   "pe": 316,
   "pe_u": 9530.0,
   "pa": 311,
   "pa_u": 2653.0,
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
   "ptc_u": 748.0
  },
  "San Diego City": {
   "pe": 4366,
   "pe_u": 99559.5,
   "pa": 4365,
   "pa_u": 15386.0,
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
   "pe": 4727,
   "pe_u": 107633.5,
   "pa": 4727,
   "pa_u": 16069.5,
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
   "pe": 3187,
   "pe_u": 98254.2,
   "pa": 3187,
   "pa_u": 13056.7,
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
   "pe": 1840,
   "pe_u": 82943.5,
   "pa": 1839,
   "pa_u": 13698.5,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 11.0,
   "p2": 15,
   "p3": 30,
   "p3_u": 215.0,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 27.0,
   "pac": 56,
   "pac_u": 501.5,
   "ptc": 30,
   "ptc_u": 215.0
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
   "pe_u": 6353.0,
   "pa": 103,
   "pa_u": 639.0,
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
   "pe": 474,
   "pe_u": 16845.5,
   "pa": 469,
   "pa_u": 2115.7,
   "ppa": 12,
   "ppa_u": 38.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": 24,
   "p3_u": 300.9,
   "pp": 0,
   "pp_u": 0.0,
   "ppe": 12,
   "ppe_u": 62.0,
   "pac": 29,
   "pac_u": 374.2,
   "ptc": 24,
   "ptc_u": 300.9
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
   "ptc_u": 0.0
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
   "ptc_u": 0.0
  },
  "Santiago Canyon": {
   "pe": 684,
   "pe_u": 29134.5,
   "pa": 682,
   "pa_u": 15998.5,
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
   "ptc_u": 3395.0
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
  "Siskiyous": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": 14.0,
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
   "pe": 192,
   "pe_u": 11127.0,
   "pa": 192,
   "pa_u": 978.0,
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
   "pe": 342,
   "pe_u": 13605.0,
   "pa": 342,
   "pa_u": 1026.0,
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
   "pe": 53,
   "pe_u": 437.0,
   "pa": 53,
   "pa_u": 360.0,
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
   "ptc_u": 320.0
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
   "ptc_u": 0.0
  },
  "West LA": {
   "pe": 753,
   "pe_u": 14957.5,
   "pa": 753,
   "pa_u": 8832.0,
   "ppa": null,
   "ppa_suppressed": true,
   "ppa_u": 35.0,
   "p2": 497,
   "p3": 563,
   "p3_u": 7446.5,
   "pp": null,
   "pp_suppressed": true,
   "pp_u": 3.0,
   "ppe": null,
   "ppe_suppressed": true,
   "ppe_u": 239.0,
   "pac": 577,
   "pac_u": 7643.0,
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
    "pe": 29,
    "pa": 29,
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
    "pe": 281,
    "pa": 281,
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
    "pe": 12,
    "pa": 12,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 572,
    "pa": 568,
    "p3": 39
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
    "pe": 51,
    "pa": 51,
    "p3": 0
   }
  },
  "Butte": {
   "Military": {
    "pe": 107,
    "pa": 0,
    "p3": 0
   }
  },
  "Cabrillo": {
   "Credit By Exam": {
    "pe": 1807,
    "pa": 1807,
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
    "pa": 13,
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
    "pe": 180,
    "pa": 175,
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
    "pe": 527,
    "pa": 527,
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
    "pe": 184,
    "pa": 180,
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
    "pe": 26,
    "pa": 24,
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
    "pe": 381,
    "pa": 379,
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
    "pe": 193,
    "pa": 193,
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
    "pe": 24,
    "pa": 19,
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
    "pa": 81,
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
    "pe": 406,
    "pa": 406,
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
    "pe": 236,
    "pa": 235,
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
    "pe": 113,
    "pa": 112,
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
    "pe": 72,
    "pa": 72,
    "p3": 0
   }
  },
  "Fresno City": {
   "Military": {
    "pe": 752,
    "pa": 752,
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
    "pe": 99,
    "pa": 99,
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
    "pa": 134,
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
    "pe": 25,
    "pa": 25,
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
    "pe": 245,
    "pa": 245,
    "p3": 244
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
    "pe": 150,
    "pa": 124,
    "p3": 20
   },
   "Standardized Assessment": {
    "pe": 2243,
    "pa": 2243,
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
    "pe": 79,
    "pa": 79,
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
    "pe": 168,
    "pa": 168,
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
    "pe": 144,
    "pa": 144,
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
    "pe": 230,
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
    "pe": 1034,
    "pa": 1034,
    "p3": 981
   },
   "Standardized Assessment": {
    "pe": 258,
    "pa": 258,
    "p3": 258
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
    "pe": 550,
    "pa": 550,
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
    "pe": 159,
    "pa": 159,
    "p3": 0
   }
  },
  "Palo Verde": {
   "Industry Certification": {
    "pe": null,
    "pa": null,
    "p3": 16,
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
    "pe": 30,
    "pa": 30,
    "p3": 0
   }
  },
  "Redwoods": {
   "Military": {
    "pe": 53,
    "pa": 53,
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
    "pe": 130,
    "pa": 111,
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
    "pe": 879,
    "pa": 865,
    "p3": 798
   }
  },
  "Sacramento City": {
   "Military": {
    "pe": 77,
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
    "pe": 1519,
    "pa": 1519,
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
    "pe": 1670,
    "pa": 1670,
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
    "pe": 12,
    "pa": 12,
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
    "pe": 1818,
    "pa": 1817,
    "p3": 14
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
    "pa": 103,
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
    "p3": 11
   },
   "Industry Certification": {
    "pe": 15,
    "pa": 14,
    "p3": 10
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
    "pe": 382,
    "pa": 382,
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
  "Siskiyous": {
   "Military": {
    "pe": null,
    "pe_suppressed": true,
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
    "pe": 192,
    "pa": 192,
    "p3": 0
   }
  },
  "Victor Valley": {
   "Military": {
    "pe": 342,
    "pa": 342,
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
    "p3": 14
   },
   "Industry Certification": {
    "pe": 567,
    "pa": 567,
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
   "pe": 11463,
   "pa": 11106,
   "p3": 10668
  },
  "Credit By Exam | Industry Certification": {
   "pe": 45,
   "pa": 43,
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
   "pe": 56,
   "pa": 55,
   "p3": 42
  },
  "Industry Certification": {
   "pe": 1430,
   "pa": 1407,
   "p3": 1188
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
   "pe": 28575,
   "pa": 26228,
   "p3": 2582
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
   "pe": 6942,
   "pa": 5587,
   "p3": 2041
  }
 },
 "cpl_types_note": "Distinct-student counts per college per `CPL Type Description`, for the funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row carries the student's TOTAL credits rather than that type's portion, so a per-type unit sum would attribute the whole total to every type a student carries. A student holding two types counts once under each, so the types do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads arrive already-transcribed by construction (students already in the college SIS, surfaced in MAP), so read p3 by type before treating a transcribed figure as lifecycle work.",
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1505872.45,
   "pa_u": 275572.4,
   "p3_u": 83799.35
  },
  "map": {
   "pe_u": 1512697.95,
   "pa_u": 276293.9,
   "p3_u": 83862.85
  },
  "ratio": {
   "pe_u": 1.0045,
   "pa_u": 1.0026,
   "p3_u": 1.0008
  }
 },
 "vet_star": {
  "LA Pierce": false,
  "Santiago Canyon": false,
  "Chaffey": true,
  "San Francisco": true,
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
  "Mt San Antonio": true,
  "Southwestern": true,
  "Fresno City": true,
  "San Bernardino": true,
  "Desert": true,
  "Modesto": true,
  "Cypress": true,
  "Santa Ana": true,
  "Barstow": true,
  "LA Valley": true,
  "Santa Rosa": true,
  "Sierra": true,
  "Mt. San Jacinto": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
  "LA Trade": true,
  "Clovis": true,
  "Antelope Valley": true,
  "Shasta": false,
  "Fullerton": true,
  "Victor Valley": true,
  "Cerro Coso": true,
  "Mission": true,
  "Ventura": true,
  "LA Mission": true,
  "Solano": false,
  "Napa": true,
  "Sequoias": false,
  "Citrus": true,
  "West Hills Lemoore": false,
  "East LA": false,
  "Evergreen Valley": true,
  "San Jose City": true,
  "Oxnard": true,
  "Golden West": false,
  "Cerritos": true,
  "Allan Hancock": false,
  "Diablo Valley": true,
  "San Mateo": true,
  "Reedley College": true,
  "Laney": true,
  "LA Harbor": true,
  "Lassen": true,
  "Irvine": false,
  "Merritt": true,
  "Saddleback": false,
  "West Valley": true,
  "Skyline": false,
  "Berkeley City": true,
  "Copper Mountain": true,
  "Palo Verde": false,
  "Foothill": false,
  "Pasadena": false,
  "West Hills Coalinga": false,
  "Hartnell": false,
  "Alameda": true,
  "Redwoods": false,
  "Porterville": false,
  "Crafton Hills": false,
  "American River": false,
  "Madera": true,
  "Las Positas": false,
  "Los Medanos": true,
  "Compton": false,
  "Canada": false,
  "Cuesta": true,
  "Columbia": false,
  "Santa Monica": false,
  "Mendocino": false,
  "Woodland": false,
  "Rio Hondo": false,
  "Moorpark": true,
  "Monterey": false,
  "MiraCosta": false,
  "LA City": false,
  "Ohlone": true,
  "Sacramento City": false,
  "Butte": false,
  "Cuyamaca": false,
  "Santa Barbara": true,
  "Chabot": false,
  "Gavilan": false,
  "Taft": false,
  "Feather River": true,
  "Imperial": false,
  "Contra Costa": false,
  "Grossmont": false,
  "Siskiyous": false,
  "Marin": false,
  "Yuba": false,
  "Orange Coast": false,
  "Palomar": false,
  "Lake Tahoe": false,
  "LA Swest": false,
  "Cosumnes River": false,
  "Folsom Lake": false
 },
 "vet_star_as_of": "2026-10-20",
 "vet_star_threshold": 0.75,
 "vet_star_n": 63,
 "vet_jst": {
  "LA Pierce": {
   "vets": 296,
   "jst": 152,
   "pct": 0.5135
  },
  "Santiago Canyon": {
   "vets": 288,
   "jst": 110,
   "pct": 0.3819
  },
  "Chaffey": {
   "vets": 182,
   "jst": 386,
   "pct": 2.1209
  },
  "San Francisco": {
   "vets": 1197,
   "jst": 1822,
   "pct": 1.5221
  },
  "San Diego Mesa": {
   "vets": 1070,
   "jst": 1638,
   "pct": 1.5308
  },
  "San Diego City": {
   "vets": 776,
   "jst": 1536,
   "pct": 1.9794
  },
  "San Diego Miramar": {
   "vets": 1181,
   "jst": 1680,
   "pct": 1.4225
  },
  "Moreno Valley": {
   "vets": 916,
   "jst": 1054,
   "pct": 1.1507
  },
  "Bakersfield": {
   "vets": 416,
   "jst": 589,
   "pct": 1.4159
  },
  "Norco College": {
   "vets": 831,
   "jst": 572,
   "pct": 0.6883
  },
  "Cabrillo": {
   "vets": 102,
   "jst": 185,
   "pct": 1.8137
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
   "jst": 818,
   "pct": 2.6645
  },
  "De Anza": {
   "vets": 903,
   "jst": 1002,
   "pct": 1.1096
  },
  "Riverside": {
   "vets": 1508,
   "jst": 882,
   "pct": 0.5849
  },
  "El Camino": {
   "vets": 327,
   "jst": 461,
   "pct": 1.4098
  },
  "Coastline": {
   "vets": 231,
   "jst": 984,
   "pct": 4.2597
  },
  "Mt San Antonio": {
   "vets": 699,
   "jst": 733,
   "pct": 1.0486
  },
  "Southwestern": {
   "vets": 584,
   "jst": 723,
   "pct": 1.238
  },
  "Fresno City": {
   "vets": 724,
   "jst": 758,
   "pct": 1.047
  },
  "San Bernardino": {
   "vets": 207,
   "jst": 207,
   "pct": 1.0
  },
  "Desert": {
   "vets": 235,
   "jst": 410,
   "pct": 1.7447
  },
  "Modesto": {
   "vets": 80,
   "jst": 151,
   "pct": 1.8875
  },
  "Cypress": {
   "vets": 259,
   "jst": 387,
   "pct": 1.4942
  },
  "Santa Ana": {
   "vets": 334,
   "jst": 384,
   "pct": 1.1497
  },
  "Barstow": {
   "vets": 106,
   "jst": 139,
   "pct": 1.3113
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
   "jst": 331,
   "pct": 1.0153
  },
  "Mt. San Jacinto": {
   "vets": 168,
   "jst": 537,
   "pct": 3.1964
  },
  "Canyons": {
   "vets": 382,
   "jst": 527,
   "pct": 1.3796
  },
  "San Joaquin Delta": {
   "vets": 248,
   "jst": 494,
   "pct": 1.9919
  },
  "Glendale": {
   "vets": 196,
   "jst": 226,
   "pct": 1.1531
  },
  "LA Trade": {
   "vets": 318,
   "jst": 414,
   "pct": 1.3019
  },
  "Clovis": {
   "vets": 117,
   "jst": 197,
   "pct": 1.6838
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
   "jst": 561,
   "pct": 1.9278
  },
  "Victor Valley": {
   "vets": 97,
   "jst": 345,
   "pct": 3.5567
  },
  "Cerro Coso": {
   "vets": 115,
   "jst": 185,
   "pct": 1.6087
  },
  "Mission": {
   "vets": 158,
   "jst": 168,
   "pct": 1.0633
  },
  "Ventura": {
   "vets": 254,
   "jst": 192,
   "pct": 0.7559
  },
  "LA Mission": {
   "vets": 112,
   "jst": 152,
   "pct": 1.3571
  },
  "Solano": {
   "vets": 278,
   "jst": 133,
   "pct": 0.4784
  },
  "Napa": {
   "vets": 38,
   "jst": 53,
   "pct": 1.3947
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
  "West Hills Lemoore": {
   "vets": 61,
   "jst": 20,
   "pct": 0.3279
  },
  "East LA": {
   "vets": 637,
   "jst": 237,
   "pct": 0.3721
  },
  "Evergreen Valley": {
   "vets": 87,
   "jst": 114,
   "pct": 1.3103
  },
  "San Jose City": {
   "vets": 148,
   "jst": 122,
   "pct": 0.8243
  },
  "Oxnard": {
   "vets": 118,
   "jst": 161,
   "pct": 1.3644
  },
  "Golden West": {
   "vets": 219,
   "jst": 100,
   "pct": 0.4566
  },
  "Cerritos": {
   "vets": 185,
   "jst": 170,
   "pct": 0.9189
  },
  "Allan Hancock": {
   "vets": 392,
   "jst": 143,
   "pct": 0.3648
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
   "jst": 80,
   "pct": 0.8333
  },
  "LA Harbor": {
   "vets": 109,
   "jst": 140,
   "pct": 1.2844
  },
  "Lassen": {
   "vets": 129,
   "jst": 140,
   "pct": 1.0853
  },
  "Irvine": {
   "vets": 217,
   "jst": 135,
   "pct": 0.6221
  },
  "Merritt": {
   "vets": 82,
   "jst": 64,
   "pct": 0.7805
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
   "jst": 82,
   "pct": 1.1389
  },
  "Palo Verde": {
   "vets": 24,
   "jst": null,
   "jst_suppressed": true
  },
  "Foothill": {
   "vets": 915,
   "jst": 75,
   "pct": 0.082
  },
  "Pasadena": {
   "vets": 404,
   "jst": 141,
   "pct": 0.349
  },
  "West Hills Coalinga": {
   "vets": 17,
   "jst": null,
   "jst_suppressed": true
  },
  "Hartnell": {
   "vets": 106,
   "jst": 63,
   "pct": 0.5943
  },
  "Alameda": {
   "vets": 30,
   "jst": 30,
   "pct": 1.0
  },
  "Redwoods": {
   "vets": 98,
   "jst": 54,
   "pct": 0.551
  },
  "Porterville": {
   "vets": 52,
   "jst": 31,
   "pct": 0.5962
  },
  "Crafton Hills": {
   "vets": 577,
   "jst": 20,
   "pct": 0.0347
  },
  "American River": {
   "vets": 312,
   "jst": 44,
   "pct": 0.141
  },
  "Madera": {
   "vets": 43,
   "jst": 50,
   "pct": 1.1628
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
   "jst": 183,
   "pct": 0.8883
  },
  "Columbia": {
   "vets": 33,
   "jst": 24,
   "pct": 0.7273
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
  "Rio Hondo": {
   "vets": 172,
   "jst": null,
   "jst_suppressed": true
  },
  "Moorpark": {
   "vets": 179,
   "jst": 233,
   "pct": 1.3017
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
  "LA City": {
   "vets": 301,
   "jst": 194,
   "pct": 0.6445
  },
  "Ohlone": {
   "vets": 49,
   "jst": 132,
   "pct": 2.6939
  },
  "Sacramento City": {
   "vets": 203,
   "jst": 116,
   "pct": 0.5714
  },
  "Butte": {
   "vets": 290,
   "jst": 114,
   "pct": 0.3931
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
  "Grossmont": {
   "vets": 415,
   "jst": null,
   "jst_suppressed": true
  },
  "Siskiyous": {
   "vets": 77,
   "jst": null,
   "jst_suppressed": true
  },
  "Marin": {
   "vets": 69,
   "jst": null,
   "jst_suppressed": true
  },
  "Yuba": {
   "vets": 64,
   "jst": 0,
   "pct": 0.0
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
  "Lake Tahoe": {
   "vets": 92,
   "jst": 0,
   "pct": 0.0
  },
  "LA Swest": {
   "vets": 67,
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
  }
 }
};
