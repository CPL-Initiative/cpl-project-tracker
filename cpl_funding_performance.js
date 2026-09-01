// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-09-01",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied -> transcribed; unlike eligible it does not carry the ACE/JST skill-level duplication, and unlike eligible it is an action the college took), PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch), PPA = APPLIED units among those same portal-origin students — the measure the Access metric asks for, and NOT a subset of PA: pe/pa/p2/p3 all EXCLUDE Potential Student = Yes, so PA and PPA describe disjoint cohorts (per MAP). NC_PE/NC_PA/NC_PT = the same three rungs among students whose LocID2 resolves to a known noncredit origin (present only when the pull carries LocID2; see the `origination` block for the per-origin scoped cuts). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 5,
 "statewide": {
  "pe": 43044,
  "pa": 39013,
  "ppa": 104,
  "p2": 3063,
  "p3": 14444,
  "pp": 5,
  "pe_u": 1387623.95,
  "pa_u": 216119.15,
  "ppa_u": 649.5,
  "p3_u": 72556.95,
  "pp_u": 25.0
 },
 "colleges": {
  "Alameda": {
   "pe": 13,
   "pe_u": 529.0,
   "pa": 13,
   "pa_u": 78.0,
   "ppa": 1,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Antelope Valley": {
   "pe": 278,
   "pe_u": 9474.0,
   "pa": 278,
   "pa_u": 1127.0,
   "ppa": 1,
   "ppa_u": 4.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Bakersfield": {
   "pe": 593,
   "pe_u": 26014.5,
   "pa": 586,
   "pa_u": 8631.5,
   "ppa": 4,
   "ppa_u": 66.0,
   "p2": 50,
   "p3": 51,
   "p3_u": 974.5,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Berkeley City": {
   "pe": 16,
   "pe_u": 887.0,
   "pa": 16,
   "pa_u": 96.0,
   "ppa": 1,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Butte": {
   "pe": 9,
   "pe_u": 435.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cabrillo": {
   "pe": 213,
   "pe_u": 8788.0,
   "pa": 208,
   "pa_u": 1253.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 17,
   "p3": 44,
   "p3_u": 258.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "Canada": {
   "pe": 29,
   "pe_u": 1066.0,
   "pa": 29,
   "pa_u": 87.0,
   "ppa": 1,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Canyons": {
   "pe": 513,
   "pe_u": 21587.0,
   "pa": 513,
   "pa_u": 1539.0,
   "ppa": 2,
   "ppa_u": 23.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Cerro Coso": {
   "pe": 177,
   "pe_u": 9009.5,
   "pa": 173,
   "pa_u": 865.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Chabot": {
   "pe": 15,
   "pe_u": 983.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Chaffey": {
   "pe": 1519,
   "pe_u": 32856.0,
   "pa": 1514,
   "pa_u": 18598.0,
   "ppa": 2,
   "ppa_u": 6.0,
   "p2": 19,
   "p3": 41,
   "p3_u": 305.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Clovis": {
   "pe": 187,
   "pe_u": 8090.0,
   "pa": 187,
   "pa_u": 1129.0,
   "ppa": 2,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Coastline": {
   "pe": 896,
   "pe_u": 63462.0,
   "pa": 527,
   "pa_u": 3280.0,
   "ppa": 1,
   "ppa_u": 10.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Columbia": {
   "pe": 24,
   "pe_u": 1398.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Contra Costa": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": null,
   "pe_u_suppressed": true,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Copper Mountain": {
   "pe": 80,
   "pe_u": 3770.0,
   "pa": 79,
   "pa_u": 288.0,
   "ppa": 1,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Cuesta": {
   "pe": 111,
   "pe_u": 4641.5,
   "pa": 7,
   "pa_u": 66.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "De Anza": {
   "pe": 976,
   "pe_u": 24241.5,
   "pa": 976,
   "pa_u": 4955.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
  },
  "Desert": {
   "pe": 417,
   "pe_u": 17445.5,
   "pa": 417,
   "pa_u": 2351.5,
   "ppa": 1,
   "ppa_u": 4.0,
   "p2": 37,
   "p3": 37,
   "p3_u": 831.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "Diablo Valley": {
   "pe": 172,
   "pe_u": 7441.0,
   "pa": 172,
   "pa_u": 516.0,
   "ppa": 1,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "East LA": {
   "pe": 235,
   "pe_u": 9200.0,
   "pa": 234,
   "pa_u": 702.0,
   "ppa": 1,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 26,
   "p3_u": 78.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "El Camino": {
   "pe": 460,
   "pe_u": 21892.0,
   "pa": 460,
   "pa_u": 4140.0,
   "ppa": 1,
   "ppa_u": 9.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
  },
  "Evergreen Valley": {
   "pe": 111,
   "pe_u": 5100.5,
   "pa": 110,
   "pa_u": 663.5,
   "ppa": 1,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Foothill": {
   "pe": 73,
   "pe_u": 3300.0,
   "pa": 73,
   "pa_u": 292.0,
   "ppa": 3,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Fresno City": {
   "pe": 588,
   "pe_u": 22445.0,
   "pa": 588,
   "pa_u": 1732.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Fullerton": {
   "pe": 555,
   "pe_u": 21595.0,
   "pa": 236,
   "pa_u": 1083.0,
   "ppa": 2,
   "ppa_u": 7.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Glendale": {
   "pe": 225,
   "pe_u": 10044.5,
   "pa": 225,
   "pa_u": 1226.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Golden West": {
   "pe": 98,
   "pe_u": 5306.0,
   "pa": 98,
   "pa_u": 588.0,
   "ppa": 1,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Hartnell": {
   "pe": 62,
   "pe_u": 2537.0,
   "pa": 61,
   "pa_u": 183.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Irvine": {
   "pe": 130,
   "pe_u": 5715.0,
   "pa": 129,
   "pa_u": 387.0,
   "ppa": 1,
   "ppa_u": 3.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "LA Harbor": {
   "pe": 135,
   "pe_u": 5172.0,
   "pa": 135,
   "pa_u": 405.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Mission": {
   "pe": 157,
   "pe_u": 6820.0,
   "pa": 156,
   "pa_u": 942.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Pierce": {
   "pe": 344,
   "pe_u": 6058.0,
   "pa": 308,
   "pa_u": 1263.0,
   "ppa": 1,
   "ppa_u": 9.0,
   "p2": 20,
   "p3": 229,
   "p3_u": 907.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "LA Valley": {
   "pe": 364,
   "pe_u": 15980.0,
   "pa": 363,
   "pa_u": 1815.0,
   "ppa": 1,
   "ppa_u": 5.0,
   "p2": 0,
   "p3": 189,
   "p3_u": 945.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Las Positas": {
   "pe": 18,
   "pe_u": 1266.0,
   "pa": 18,
   "pa_u": 118.0,
   "ppa": 3,
   "ppa_u": 18.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Long Beach": {
   "pe": 809,
   "pe_u": 36440.5,
   "pa": 809,
   "pa_u": 5647.5,
   "ppa": 6,
   "ppa_u": 39.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Los Medanos": {
   "pe": 221,
   "pe_u": 8966.0,
   "pa": 22,
   "pa_u": 80.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Madera": {
   "pe": 43,
   "pe_u": 1751.0,
   "pa": 43,
   "pa_u": 95.0,
   "ppa": 1,
   "ppa_u": 5.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mendocino": {
   "pe": 7,
   "pe_u": 62.0,
   "pa": 7,
   "pa_u": 35.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Merced": {
   "pe": 3344,
   "pe_u": 29623.5,
   "pa": 1965,
   "pa_u": 10051.0,
   "ppa": 1,
   "ppa_u": 5.0,
   "p2": 911,
   "p3": 1926,
   "p3_u": 9856.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Merritt": {
   "pe": 13,
   "pe_u": 671.0,
   "pa": 13,
   "pa_u": 66.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
  },
  "MiraCosta": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": null,
   "pe_u_suppressed": true,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 3,
   "ppa_u": 18.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mission": {
   "pe": 150,
   "pe_u": 6847.0,
   "pa": 150,
   "pa_u": 900.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
  },
  "Modesto": {
   "pe": 348,
   "pe_u": 8240.0,
   "pa": 336,
   "pa_u": 2217.0,
   "ppa": 5,
   "ppa_u": 25.0,
   "p2": 73,
   "p3": 191,
   "p3_u": 1417.5,
   "pp": 2,
   "pp_u": 10.0
  },
  "Monterey": {
   "pe": 126,
   "pe_u": 5582.5,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": null,
   "pa_u_suppressed": true,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Moorpark": {
   "pe": 229,
   "pe_u": 9669.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": null,
   "pa_u_suppressed": true,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
  },
  "Moreno Valley": {
   "pe": 2449,
   "pe_u": 52435.0,
   "pa": 2120,
   "pa_u": 12488.5,
   "ppa": 4,
   "ppa_u": 53.5,
   "p2": 440,
   "p3": 2001,
   "p3_u": 11587.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mt San Antonio": {
   "pe": 732,
   "pe_u": 31389.5,
   "pa": 731,
   "pa_u": 2924.0,
   "ppa": 2,
   "ppa_u": 8.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mt. San Jacinto": {
   "pe": 537,
   "pe_u": 31303.0,
   "pa": 536,
   "pa_u": 1608.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Napa": {
   "pe": 52,
   "pe_u": 2253.0,
   "pa": 14,
   "pa_u": 42.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Norco College": {
   "pe": 760,
   "pe_u": 25916.0,
   "pa": 759,
   "pa_u": 6405.5,
   "ppa": 12,
   "ppa_u": 69.0,
   "p2": 153,
   "p3": 438,
   "p3_u": 3997.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Oxnard": {
   "pe": 157,
   "pe_u": 8495.0,
   "pa": 156,
   "pa_u": 624.0,
   "ppa": 1,
   "ppa_u": 4.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Palo Verde": {
   "pe": 17,
   "pe_u": 601.75,
   "pa": 17,
   "pa_u": 178.75,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 8,
   "p3": 8,
   "p3_u": 151.75,
   "pp": 0,
   "pp_u": 0.0
  },
  "Pasadena": {
   "pe": 130,
   "pe_u": 5926.0,
   "pa": 130,
   "pa_u": 266.0,
   "ppa": 2,
   "ppa_u": 4.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Porterville": {
   "pe": 27,
   "pe_u": 675.0,
   "pa": 27,
   "pa_u": 135.0,
   "ppa": 1,
   "ppa_u": 5.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Reedley College": {
   "pe": 130,
   "pe_u": 4819.5,
   "pa": 111,
   "pa_u": 534.5,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Riverside": {
   "pe": 835,
   "pe_u": 36442.0,
   "pa": 821,
   "pa_u": 4006.0,
   "ppa": 1,
   "ppa_u": 5.0,
   "p2": 12,
   "p3": 818,
   "p3_u": 3991.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Sacramento City": {
   "pe": 66,
   "pe_u": 2566.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Saddleback": {
   "pe": 57,
   "pe_u": 2683.0,
   "pa": 57,
   "pa_u": 342.0,
   "ppa": 2,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Bernardino": {
   "pe": 307,
   "pe_u": 9500.0,
   "pa": 302,
   "pa_u": 2617.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 59,
   "p3": 87,
   "p3_u": 748.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego City": {
   "pe": 4319,
   "pe_u": 97140.5,
   "pa": 4318,
   "pa_u": 15198.0,
   "ppa": 2,
   "ppa_u": 8.0,
   "p2": 190,
   "p3": 2837,
   "p3_u": 9245.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego Mesa": {
   "pe": 4693,
   "pe_u": 105505.5,
   "pa": 4693,
   "pa_u": 15933.5,
   "ppa": 1,
   "ppa_u": 4.0,
   "p2": 150,
   "p3": 3095,
   "p3_u": 9543.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego Miramar": {
   "pe": 3141,
   "pe_u": 95938.2,
   "pa": 3141,
   "pa_u": 12872.7,
   "ppa": 2,
   "ppa_u": 8.0,
   "p2": 177,
   "p3": 1502,
   "p3_u": 6290.7,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Francisco": {
   "pe": 1344,
   "pe_u": 62624.5,
   "pa": 1343,
   "pa_u": 9562.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 9,
   "p3": 19,
   "p3_u": 136.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "San Jose City": {
   "pe": 120,
   "pe_u": 6198.0,
   "pa": 102,
   "pa_u": 630.0,
   "ppa": 1,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Mateo": {
   "pe": 180,
   "pe_u": 9420.0,
   "pa": 180,
   "pa_u": 540.0,
   "ppa": 2,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santa Ana": {
   "pe": 456,
   "pe_u": 16552.0,
   "pa": 451,
   "pa_u": 2014.2,
   "ppa": 3,
   "ppa_u": 11.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Santa Monica": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": null,
   "pe_u_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": null,
   "pa_u_suppressed": true,
   "ppa": 2,
   "ppa_u": 16.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santa Rosa": {
   "pe": 442,
   "pe_u": 19207.0,
   "pa": 442,
   "pa_u": 1768.0,
   "ppa": 1,
   "ppa_u": 4.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santiago Canyon": {
   "pe": 682,
   "pe_u": 29064.5,
   "pa": 680,
   "pa_u": 15958.0,
   "ppa": 1,
   "ppa_u": 7.0,
   "p2": 208,
   "p3": 262,
   "p3_u": 3378.5,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Shasta": {
   "pe": 179,
   "pe_u": 7715.0,
   "pa": 179,
   "pa_u": 1089.0,
   "ppa": 1,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Solano": {
   "pe": 158,
   "pe_u": 7634.0,
   "pa": 158,
   "pa_u": 1089.0,
   "ppa": 2,
   "ppa_u": 12.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 2,
   "pp_u": 12.0
  },
  "Southwestern": {
   "pe": 571,
   "pe_u": 37156.0,
   "pa": 552,
   "pa_u": 2764.0,
   "ppa": 2,
   "ppa_u": 10.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
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
   "pp_u": 0.0
  },
  "Ventura": {
   "pe": 184,
   "pe_u": 10671.0,
   "pa": 184,
   "pa_u": 935.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Victor Valley": {
   "pe": 336,
   "pe_u": 13366.0,
   "pa": 336,
   "pa_u": 1008.0,
   "ppa": 2,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "West Hills Coalinga": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": null,
   "pe_u_suppressed": true,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": null,
   "pa_u_suppressed": true,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "West Hills Lemoore": {
   "pe": 313,
   "pe_u": 2714.0,
   "pa": 306,
   "pa_u": 1053.0,
   "ppa": 1,
   "ppa_u": 21.0,
   "p2": 16,
   "p3": 47,
   "p3_u": 189.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "West LA": {
   "pe": 741,
   "pe_u": 14726.0,
   "pa": 741,
   "pa_u": 8663.0,
   "ppa": 6,
   "ppa_u": 42.0,
   "p2": 497,
   "p3": 563,
   "p3_u": 7446.5,
   "pp": 1,
   "pp_u": 3.0
  },
  "West Valley": {
   "pe": 55,
   "pe_u": 2020.0,
   "pa": 55,
   "pa_u": 330.0,
   "ppa": 1,
   "ppa_u": 6.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Woodland": {
   "pe": 8,
   "pe_u": 222.0,
   "pa": 8,
   "pa_u": 17.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  }
 },
 "unmatched": {
  "Calbright College Credit": {
   "pe": 117,
   "pe_u": 417.0,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Launch Apprenticeship": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": null,
   "pe_u_suppressed": true,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "North Orange Continuing Education Credit": {
   "pe": null,
   "pe_suppressed": true,
   "pe_u": null,
   "pe_u_suppressed": true,
   "pa": 0,
   "pa_u": 0.0,
   "ppa": 0,
   "ppa_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  }
 },
 "feeders": {
  "NOCE": {
   "pe": null,
   "pe_suppressed": true
  },
  "SD Cont. Ed": {
   "pe": 5
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
    "pe": 278,
    "pa": 278,
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
    "pe": 10,
    "pa": 10,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 550,
    "pa": 547,
    "p3": 27
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
    "pe": 9,
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
    "pe": 8,
    "pa": 8,
    "p3": 5
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
    "pe": 179,
    "pa": 174,
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
    "pe": 513,
    "pa": 513,
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
    "pe": 177,
    "pa": 173,
    "p3": 0
   }
  },
  "Chabot": {
   "Military": {
    "pe": 15,
    "pa": 0,
    "p3": 0
   }
  },
  "Chaffey": {
   "Industry Certification": {
    "pe": 23,
    "pa": 21,
    "p3": 20
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
    "pa": 341,
    "p3": 12
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
    "p3": 6
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
    "pe": 187,
    "pa": 187,
    "p3": 0
   }
  },
  "Coastline": {
   "Military": {
    "pe": 896,
    "pa": 527,
    "p3": 0
   }
  },
  "Columbia": {
   "Military": {
    "pe": 24,
    "pa": 0,
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
    "pe": 380,
    "pa": 380,
    "p3": 0
   }
  },
  "Diablo Valley": {
   "Military": {
    "pe": 172,
    "pa": 172,
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
    "pe": 588,
    "pa": 588,
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
    "pe": 225,
    "pa": 225,
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
    "pe": 61,
    "pa": 61,
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
    "pa": 129,
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
    "pe": 135,
    "pa": 135,
    "p3": 0
   }
  },
  "LA Mission": {
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
  "LA Pierce": {
   "Credit By Exam": {
    "pe": 209,
    "pa": 209,
    "p3": 208
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
    "pe": 43,
    "pa": 43,
    "p3": 0
   }
  },
  "Mendocino": {
   "Military": {
    "pe": 7,
    "pa": 7,
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
    "pe": 8,
    "pa": 7,
    "p3": 7
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
    "pe": 150,
    "pa": 150,
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
    "pe": 8,
    "pa": 7,
    "p3": 7
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
    "pe": 8,
    "pa": 8,
    "p3": 8
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
    "pe": 140,
    "pa": 140,
    "p3": 5
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
    "pe": 140,
    "pa": 140,
    "p3": 125
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
    "p3": 0
   },
   "Industry Certification | Portfolio Review": {
    "pe": null,
    "pe_suppressed": true,
    "pa": null,
    "pa_suppressed": true,
    "p3": 0
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
    "pe": 993,
    "pa": 993,
    "p3": 893
   },
   "Standardized Assessment": {
    "pe": 222,
    "pa": 222,
    "p3": 221
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
   "Military": {
    "pe": 49,
    "pa": 14,
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
    "pe": 527,
    "pa": 527,
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
    "pe": 156,
    "pa": 156,
    "p3": 0
   }
  },
  "Palo Verde": {
   "Industry Certification": {
    "pe": 8,
    "pa": 8,
    "p3": 8
   },
   "Military": {
    "pe": 9,
    "pa": 9,
    "p3": 0
   }
  },
  "Pasadena": {
   "Military": {
    "pe": 130,
    "pa": 130,
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
    "pe": 125,
    "pa": 107,
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
    "pe": 815,
    "pa": 801,
    "p3": 798
   }
  },
  "Sacramento City": {
   "Military": {
    "pe": 66,
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
    "pe": 23,
    "pa": 21,
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
    "pe": 5,
    "pa": 5,
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
    "pe": 6,
    "pa": 5,
    "p3": 5
   }
  },
  "San Diego City": {
   "Credit By Exam": {
    "pe": 2830,
    "pa": 2830,
    "p3": 2823
   },
   "Credit By Exam | Military": {
    "pe": 8,
    "pa": 8,
    "p3": null,
    "p3_suppressed": true
   },
   "Industry Certification": {
    "pe": 6,
    "pa": null,
    "p3": 6,
    "pa_suppressed": true
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
    "pe": 1472,
    "pa": 1472,
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
    "pe": 6,
    "pa": 6,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 1592,
    "pa": 1592,
    "p3": null,
    "p3_suppressed": true
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
    "pe": 1624,
    "pa": 1624,
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
    "pe": 9,
    "pa": 9,
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
    "pe": 1328,
    "pa": 1327,
    "p3": 10
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
    "pe": 63,
    "pa": 63,
    "p3": 0
   },
   "Industry Certification": {
    "pe": 11,
    "pa": 10,
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
    "pe": 374,
    "pa": 374,
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
    "pe": 179,
    "pa": 179,
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
    "pe": 158,
    "pa": 158,
    "p3": 0
   }
  },
  "Southwestern": {
   "Military": {
    "pe": 552,
    "pa": 552,
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
    "pe": 184,
    "pa": 184,
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
    "pe": 556,
    "pa": 556,
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
    "pe": 8,
    "pa": 8,
    "p3": 0
   }
  }
 },
 "cpl_types_statewide": {
  "Credit By Exam": {
   "pe": 9484,
   "pa": 9122,
   "p3": 8688
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
   "pe": 5,
   "pa": 5,
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
   "pe": 1261,
   "pa": 1239,
   "p3": 1148
  },
  "Industry Certification | Military": {
   "pe": 49,
   "pa": 48,
   "p3": 28
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
   "p3": 0
  },
  "Industry Certification | Portfolio Review": {
   "pe": 25,
   "pa": 23,
   "p3": 17
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
   "pe": 26988,
   "pa": 24864,
   "p3": 2487
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
   "pe": 6,
   "pa": 5,
   "p3": null,
   "p3_suppressed": true
  },
  "Portfolio Review": {
   "pe": 581,
   "pa": 575,
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
   "pe": 4386,
   "pa": 3031,
   "p3": 1886
  }
 },
 "cpl_types_note": "Distinct-student counts per college per `CPL Type Description`, for the funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row carries the student's TOTAL credits rather than that type's portion, so a per-type unit sum would attribute the whole total to every type a student carries. A student holding two types counts once under each, so the types do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads arrive already-transcribed by construction (students already in the college SIS, surfaced in MAP), so read p3 by type before treating a transcribed figure as lifecycle work.",
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1387147.45,
   "pa_u": 216119.15,
   "p3_u": 72556.95
  },
  "map": {
   "pe_u": 1393749.95,
   "pa_u": 216768.65,
   "p3_u": 72581.95
  },
  "ratio": {
   "pe_u": 1.0048,
   "pa_u": 1.003,
   "p3_u": 1.0003
  }
 },
 "vet_star": {
  "Santiago Canyon": false,
  "Chaffey": true,
  "San Diego Mesa": true,
  "San Diego City": true,
  "San Diego Miramar": true,
  "Moreno Valley": true,
  "San Francisco": true,
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
  "San Bernardino": false,
  "Desert": true,
  "Cypress": true,
  "Modesto": true,
  "Santa Ana": true,
  "Barstow": true,
  "LA Valley": true,
  "Santa Rosa": true,
  "Fresno City": true,
  "Sierra": true,
  "Cabrillo": true,
  "Mt. San Jacinto": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
  "LA Trade": true,
  "Clovis": true,
  "Antelope Valley": true,
  "Solano": false,
  "Shasta": false,
  "Fullerton": true,
  "Victor Valley": true,
  "LA Pierce": false,
  "Ventura": false,
  "LA Mission": true,
  "Mission": true,
  "Sequoias": false,
  "Cerro Coso": true,
  "Citrus": true,
  "West Hills Lemoore": false,
  "East LA": false,
  "Evergreen Valley": true,
  "San Jose City": true,
  "Oxnard": true,
  "Golden West": false,
  "Cerritos": true,
  "Allan Hancock": false,
  "San Mateo": true,
  "Diablo Valley": true,
  "Reedley College": true,
  "Lassen": true,
  "LA Harbor": true,
  "Irvine": false,
  "Saddleback": false,
  "West Valley": true,
  "Skyline": false,
  "Laney": false,
  "Foothill": false,
  "Copper Mountain": true,
  "Pasadena": false,
  "Hartnell": false,
  "Crafton Hills": false,
  "Palo Verde": false,
  "Porterville": false,
  "American River": false,
  "Las Positas": false,
  "Compton": false,
  "Redwoods": false,
  "Berkeley City": false,
  "Madera": true,
  "Canada": false,
  "Los Medanos": true,
  "Alameda": false,
  "Merritt": false,
  "Cuesta": true,
  "Napa": true,
  "Santa Monica": false,
  "Mendocino": false,
  "Woodland": false,
  "Moorpark": true,
  "West Hills Coalinga": false,
  "Monterey": false,
  "MiraCosta": false,
  "LA City": false,
  "Ohlone": true,
  "Sacramento City": false,
  "Cuyamaca": false,
  "Santa Barbara": true,
  "Gavilan": false,
  "Columbia": false,
  "Chabot": false,
  "Taft": false,
  "Feather River": true,
  "Butte": false,
  "Imperial": false,
  "Contra Costa": false,
  "Rio Hondo": false,
  "Orange Coast": false,
  "Yuba": false,
  "Grossmont": false,
  "Marin": false,
  "Siskiyous": false,
  "Palomar": false,
  "Lake Tahoe": false,
  "LA Swest": false,
  "Cosumnes River": false,
  "Folsom Lake": false
 },
 "vet_star_as_of": "2026-09-01",
 "vet_star_threshold": 0.75,
 "vet_star_n": 57
};
