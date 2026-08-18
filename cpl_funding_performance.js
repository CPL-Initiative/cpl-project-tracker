// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-08-18",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied -> transcribed; unlike eligible it does not carry the ACE/JST skill-level duplication, and unlike eligible it is an action the college took), PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch) (per MAP). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 5,
 "statewide": {
  "pe": 42361,
  "pa": 39693,
  "p2": 3676,
  "p3": 15699,
  "pp": 5,
  "pe_u": 1357334.45,
  "pa_u": 220408.15,
  "p3_u": 79392.45,
  "pp_u": 25.0
 },
 "colleges": {
  "Alameda": {
   "pe": 13,
   "pe_u": 529.0,
   "pa": 13,
   "pa_u": 78.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Allan Hancock": {
   "pe": 142,
   "pe_u": 6323.0,
   "pa": 142,
   "pa_u": 568.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Bakersfield": {
   "pe": 588,
   "pe_u": 25799.5,
   "pa": 581,
   "pa_u": 8572.5,
   "p2": 49,
   "p3": 50,
   "p3_u": 962.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "Barstow": {
   "pe": 137,
   "pe_u": 4865.0,
   "pa": 137,
   "pa_u": 1894.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cabrillo": {
   "pe": 213,
   "pe_u": 8805.5,
   "pa": 208,
   "pa_u": 1256.5,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Canyons": {
   "pe": 507,
   "pe_u": 21393.0,
   "pa": 507,
   "pa_u": 1521.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cerro Coso": {
   "pe": 170,
   "pe_u": 8678.5,
   "pa": 166,
   "pa_u": 830.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Chaffey": {
   "pe": 1496,
   "pe_u": 32052.0,
   "pa": 1492,
   "pa_u": 18477.5,
   "p2": 15,
   "p3": 32,
   "p3_u": 240.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Citrus": {
   "pe": 214,
   "pe_u": 8282.0,
   "pa": 214,
   "pa_u": 856.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Columbia": {
   "pe": 23,
   "pe_u": 1377.0,
   "pa": 0,
   "pa_u": 0.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Copper Mountain": {
   "pe": 78,
   "pe_u": 3697.0,
   "pa": 77,
   "pa_u": 282.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cuesta": {
   "pe": 109,
   "pe_u": 4532.5,
   "pa": 7,
   "pa_u": 66.0,
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
   "pe": 414,
   "pe_u": 17275.5,
   "pa": 414,
   "pa_u": 2339.5,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "East LA": {
   "pe": 233,
   "pe_u": 9067.0,
   "pa": 232,
   "pa_u": 696.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Fresno City": {
   "pe": 577,
   "pe_u": 21792.0,
   "pa": 577,
   "pa_u": 1666.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Glendale": {
   "pe": 222,
   "pe_u": 9929.5,
   "pa": 222,
   "pa_u": 1209.5,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Hartnell": {
   "pe": 60,
   "pe_u": 2467.5,
   "pa": 59,
   "pa_u": 177.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Irvine": {
   "pe": 128,
   "pe_u": 5666.0,
   "pa": 127,
   "pa_u": 381.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA City": {
   "pe": 150,
   "pe_u": 5925.0,
   "pa": 0,
   "pa_u": 0.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Mission": {
   "pe": 153,
   "pe_u": 6818.0,
   "pa": 152,
   "pa_u": 940.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Pierce": {
   "pe": 334,
   "pe_u": 5969.0,
   "pa": 300,
   "pa_u": 1230.0,
   "p2": 20,
   "p3": 224,
   "p3_u": 894.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Trade": {
   "pe": 60,
   "pe_u": 1615.0,
   "pa": 59,
   "pa_u": 177.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Long Beach": {
   "pe": 808,
   "pe_u": 36365.5,
   "pa": 808,
   "pa_u": 5637.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Los Medanos": {
   "pe": 221,
   "pe_u": 8966.0,
   "pa": 15,
   "pa_u": 45.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Merced": {
   "pe": 3342,
   "pe_u": 29408.5,
   "pa": 3318,
   "pa_u": 19535.0,
   "p2": 1780,
   "p3": 3281,
   "p3_u": 19350.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Merritt": {
   "pe": 13,
   "pe_u": 671.0,
   "pa": 13,
   "pa_u": 66.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mission": {
   "pe": 146,
   "pe_u": 6661.0,
   "pa": 146,
   "pa_u": 876.0,
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
   "pe": 346,
   "pe_u": 8182.0,
   "pa": 334,
   "pa_u": 2207.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Moorpark": {
   "pe": 226,
   "pe_u": 9582.0,
   "pa": null,
   "pa_suppressed": true,
   "pa_u": null,
   "pa_u_suppressed": true,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
  },
  "Moreno Valley": {
   "pe": 2422,
   "pe_u": 51668.0,
   "pa": 2093,
   "pa_u": 12264.5,
   "p2": 429,
   "p3": 1971,
   "p3_u": 11350.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mt San Antonio": {
   "pe": 732,
   "pe_u": 31389.5,
   "pa": 731,
   "pa_u": 2924.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mt. San Jacinto": {
   "pe": 533,
   "pe_u": 30779.0,
   "pa": 532,
   "pa_u": 1596.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Norco College": {
   "pe": 751,
   "pe_u": 25688.5,
   "pa": 750,
   "pa_u": 6354.5,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Porterville": {
   "pe": 25,
   "pe_u": 593.0,
   "pa": 25,
   "pa_u": 125.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Reedley College": {
   "pe": 129,
   "pe_u": 4817.5,
   "pa": 110,
   "pa_u": 532.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Riverside": {
   "pe": 832,
   "pe_u": 36332.0,
   "pa": 818,
   "pa_u": 3991.0,
   "p2": 12,
   "p3": 818,
   "p3_u": 3991.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Sacramento City": {
   "pe": 63,
   "pe_u": 2442.0,
   "pa": 0,
   "pa_u": 0.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Bernardino": {
   "pe": 306,
   "pe_u": 9499.0,
   "pa": 301,
   "pa_u": 2614.0,
   "p2": 59,
   "p3": 87,
   "p3_u": 748.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego City": {
   "pe": 4280,
   "pe_u": 94580.5,
   "pa": 4279,
   "pa_u": 14641.0,
   "p2": 121,
   "p3": 2837,
   "p3_u": 8844.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego Mesa": {
   "pe": 4659,
   "pe_u": 103355.5,
   "pa": 4659,
   "pa_u": 15503.5,
   "p2": 117,
   "p3": 3095,
   "p3_u": 9249.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego Miramar": {
   "pe": 3113,
   "pe_u": 93718.2,
   "pa": 3113,
   "pa_u": 11860.7,
   "p2": 85,
   "p3": 1502,
   "p3_u": 5390.7,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Francisco": {
   "pe": 1312,
   "pe_u": 60996.0,
   "pa": 1310,
   "pa_u": 8934.0,
   "p2": 8,
   "p3": 15,
   "p3_u": 118.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Joaquin Delta": {
   "pe": 493,
   "pe_u": 20764.0,
   "pa": 492,
   "pa_u": 1476.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santa Ana": {
   "pe": 450,
   "pe_u": 16408.0,
   "pa": 445,
   "pa_u": 1990.2,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santa Rosa": {
   "pe": 440,
   "pe_u": 19050.0,
   "pa": 440,
   "pa_u": 1760.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santiago Canyon": {
   "pe": 635,
   "pe_u": 27026.0,
   "pa": 633,
   "pa_u": 15342.5,
   "p2": 163,
   "p3": 211,
   "p3_u": 2660.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Sequoias": {
   "pe": 174,
   "pe_u": 8132.0,
   "pa": 174,
   "pa_u": 870.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Sierra": {
   "pe": 338,
   "pe_u": 11639.0,
   "pa": 338,
   "pa_u": 1690.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Ventura": {
   "pe": 182,
   "pe_u": 10523.0,
   "pa": 182,
   "pa_u": 925.0,
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
   "p2": 16,
   "p3": 47,
   "p3_u": 189.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "West LA": {
   "pe": 739,
   "pe_u": 14622.0,
   "pa": 739,
   "pa_u": 8545.0,
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
    "pe": 142,
    "pa": 142,
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
    "pe": 9,
    "pa": 9,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 546,
    "pa": 543,
    "p3": 26
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
    "pe": 507,
    "pa": 507,
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
    "pe": 170,
    "pa": 166,
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
    "pe": 20,
    "pa": 18,
    "p3": 17
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
    "pe": 324,
    "pa": 322,
    "p3": 6
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
    "pe": 23,
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
    "pa": 77,
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
    "pe": 101,
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
    "pe": 377,
    "pa": 377,
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
    "pe": 233,
    "pa": 232,
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
    "pe": 577,
    "pa": 577,
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
    "pe": 222,
    "pa": 222,
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
    "pe": 59,
    "pa": 59,
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
    "pa": 127,
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
   "Military": {
    "pe": 152,
    "pa": 152,
    "p3": 0
   }
  },
  "LA Pierce": {
   "Credit By Exam": {
    "pe": 203,
    "pa": 203,
    "p3": 203
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
    "pe": 59,
    "pa": 59,
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
    "pe": 808,
    "pa": 808,
    "p3": 0
   }
  },
  "Los Medanos": {
   "Industry Certification": {
    "pe": null,
    "pe_suppressed": true,
    "pa": 0,
    "p3": 0
   },
   "Military": {
    "pe": null,
    "pa": 15,
    "p3": 0,
    "pe_suppressed": true
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
    "pa": null,
    "pa_suppressed": true,
    "p3": null,
    "p3_suppressed": true
   },
   "Military": {
    "pe": 270,
    "pa": 270,
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
    "pa": 2985,
    "p3": 2985
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
    "pe": 146,
    "pa": 146,
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
    "pe": 138,
    "pa": 138,
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
    "pe": 223,
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
    "pe": 979,
    "pa": 979,
    "p3": 876
   },
   "Standardized Assessment": {
    "pe": 209,
    "pa": 209,
    "p3": 208
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
   "Military": {
    "pe": null,
    "pa": 532,
    "p3": 0,
    "pe_suppressed": true
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
    "pe": 518,
    "pa": 518,
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
    "pe": 25,
    "pa": 25,
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
    "pe": 124,
    "pa": 106,
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
    "pe": 812,
    "pa": 798,
    "p3": 798
   }
  },
  "Sacramento City": {
   "Military": {
    "pe": 63,
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
    "pe": 22,
    "pa": 20,
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
    "pe": 1433,
    "pa": 1433,
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
    "pe": 1558,
    "pa": 1558,
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
    "pe": 1596,
    "pa": 1596,
    "p3": 0
   }
  },
  "San Francisco": {
   "Industry Certification": {
    "pe": 7,
    "pa": 7,
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
    "pe": 1300,
    "pa": 1299,
    "p3": 9
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
    "pe": 368,
    "pa": 368,
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
    "pe": 440,
    "pa": 440,
    "p3": 0
   }
  },
  "Santiago Canyon": {
   "Industry Certification": {
    "pe": 217,
    "pa": 216,
    "p3": 211
   },
   "Industry Certification | Portfolio Review": {
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
   },
   "Portfolio Review": {
    "pe": 308,
    "pa": 307,
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
    "pe": 338,
    "pa": 338,
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
    "pe": 182,
    "pa": 182,
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
    "pe": 554,
    "pa": 554,
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
   "pe": 9477,
   "pa": 9115,
   "p3": 8682
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
   "pe": 1202,
   "pa": 1178,
   "p3": 1094
  },
  "Industry Certification | Military": {
   "pe": 46,
   "pa": 45,
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
   "pe": 24,
   "pa": 22,
   "p3": 15
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
   "pe": 26388,
   "pa": 24275,
   "p3": 2462
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
   "pe": 4373,
   "pa": 4371,
   "p3": 3227
  }
 },
 "cpl_types_note": "Distinct-student counts per college per `CPL Type Description`, for the funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row carries the student's TOTAL credits rather than that type's portion, so a per-type unit sum would attribute the whole total to every type a student carries. A student holding two types counts once under each, so the types do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads arrive already-transcribed by construction (students already in the college SIS, surfaced in MAP), so read p3 by type before treating a transcribed figure as lifecycle work.",
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1356857.95,
   "pa_u": 220408.15,
   "p3_u": 79392.45
  },
  "map": {
   "pe_u": 1364218.45,
   "pa_u": 221083.65,
   "p3_u": 79417.45
  },
  "ratio": {
   "pe_u": 1.0054,
   "pa_u": 1.0031,
   "p3_u": 1.0003
  }
 },
 "vet_star": {
  "Santiago Canyon": false,
  "Merced": true,
  "Chaffey": true,
  "San Diego Mesa": true,
  "San Diego City": true,
  "Moreno Valley": true,
  "San Diego Miramar": true,
  "Bakersfield": true,
  "San Francisco": true,
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
  "Cabrillo": true,
  "Sierra": true,
  "Fresno City": true,
  "Mt. San Jacinto": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
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
  "Citrus": true,
  "Cerro Coso": true,
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
  "LA Trade": false,
  "Hartnell": false,
  "Crafton Hills": false,
  "Palo Verde": false,
  "American River": false,
  "Porterville": false,
  "Las Positas": false,
  "Compton": false,
  "Redwoods": false,
  "Berkeley City": false,
  "Madera": true,
  "Canada": false,
  "Alameda": false,
  "Merritt": false,
  "Cuesta": true,
  "Los Medanos": true,
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
  "Lake Tahoe": false,
  "LA Swest": false,
  "Cosumnes River": false,
  "Folsom Lake": false,
  "Palomar": false,
  "Marin": false,
  "Siskiyous": false
 },
 "vet_star_as_of": "2026-08-18",
 "vet_star_threshold": 0.75,
 "vet_star_n": 56
};
