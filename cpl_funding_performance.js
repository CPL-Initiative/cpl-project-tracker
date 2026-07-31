// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-07-31",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch) (per MAP). *_u keys are UNIT sums over exactly the same students as their count (first row per college+student, matching the count dedupe); statewide unit sums are the plain sum of the per-college sums, NOT sid-deduped, because units are awarded per college",
 "suppress_below": 5,
 "statewide": {
  "pe": 43203,
  "p2": 4793,
  "p3": 16829,
  "pp": 5,
  "pe_u": 1354526.95,
  "p3_u": 103138.95,
  "pp_u": 25.0
 },
 "colleges": {
  "Alameda": {
   "pe": 13,
   "pe_u": 529.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Allan Hancock": {
   "pe": 138,
   "pe_u": 6231.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "American River": {
   "pe": 44,
   "pe_u": 2377.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Antelope Valley": {
   "pe": 278,
   "pe_u": 9474.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Bakersfield": {
   "pe": 578,
   "pe_u": 25280.5,
   "p2": 49,
   "p3": 50,
   "p3_u": 962.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "Barstow": {
   "pe": 133,
   "pe_u": 4759.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Berkeley City": {
   "pe": 16,
   "pe_u": 887.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Butte": {
   "pe": 9,
   "pe_u": 435.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cabrillo": {
   "pe": 211,
   "pe_u": 8776.5,
   "p2": 17,
   "p3": 44,
   "p3_u": 258.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "Canada": {
   "pe": 29,
   "pe_u": 1066.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Canyons": {
   "pe": 502,
   "pe_u": 21191.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cerritos": {
   "pe": 166,
   "pe_u": 6634.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cerro Coso": {
   "pe": 165,
   "pe_u": 8465.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Chabot": {
   "pe": 15,
   "pe_u": 983.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Chaffey": {
   "pe": 1490,
   "pe_u": 32036.0,
   "p2": 15,
   "p3": 32,
   "p3_u": 240.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Citrus": {
   "pe": 206,
   "pe_u": 8065.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Clovis": {
   "pe": 186,
   "pe_u": 8065.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Coastline": {
   "pe": 896,
   "pe_u": 63462.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Columbia": {
   "pe": 21,
   "pe_u": 1144.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Compton": {
   "pe": 21,
   "pe_u": 600.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Copper Mountain": {
   "pe": 78,
   "pe_u": 3697.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Crafton Hills": {
   "pe": 21,
   "pe_u": 1045.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cuesta": {
   "pe": 99,
   "pe_u": 4113.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Cypress": {
   "pe": 640,
   "pe_u": 17353.5,
   "p2": 10,
   "p3": 19,
   "p3_u": 131.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "De Anza": {
   "pe": 976,
   "pe_u": 24231.5,
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
   "pe": 401,
   "pe_u": 16648.5,
   "p2": 37,
   "p3": 37,
   "p3_u": 831.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "Diablo Valley": {
   "pe": 172,
   "pe_u": 7441.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "East LA": {
   "pe": 230,
   "pe_u": 8994.0,
   "p2": 0,
   "p3": 25,
   "p3_u": 75.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "El Camino": {
   "pe": 460,
   "pe_u": 21892.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Feather River": {
   "pe": 10,
   "pe_u": 433.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Foothill": {
   "pe": 73,
   "pe_u": 3300.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Fresno City": {
   "pe": 559,
   "pe_u": 21190.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Fullerton": {
   "pe": 555,
   "pe_u": 21595.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Glendale": {
   "pe": 220,
   "pe_u": 9854.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Golden West": {
   "pe": 98,
   "pe_u": 5306.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Grossmont": {
   "pe": 0,
   "pe_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Hartnell": {
   "pe": 39,
   "pe_u": 1790.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Irvine": {
   "pe": 125,
   "pe_u": 5511.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA City": {
   "pe": 150,
   "pe_u": 5925.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Harbor": {
   "pe": 135,
   "pe_u": 5172.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Mission": {
   "pe": 153,
   "pe_u": 6818.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Pierce": {
   "pe": 1860,
   "pe_u": 33198.0,
   "p2": 1309,
   "p3": 1736,
   "p3_u": 28060.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Trade": {
   "pe": 60,
   "pe_u": 1615.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "LA Valley": {
   "pe": 360,
   "pe_u": 15851.0,
   "p2": 0,
   "p3": 189,
   "p3_u": 945.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Laney": {
   "pe": 49,
   "pe_u": 2181.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Las Positas": {
   "pe": 18,
   "pe_u": 1266.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Lassen": {
   "pe": 140,
   "pe_u": 5743.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Long Beach": {
   "pe": 806,
   "pe_u": 36329.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Los Medanos": {
   "pe": 221,
   "pe_u": 8966.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Madera": {
   "pe": 43,
   "pe_u": 1751.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mendocino": {
   "pe": 7,
   "pe_u": 62.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Merced": {
   "pe": 3342,
   "pe_u": 29408.5,
   "p2": 1781,
   "p3": 3303,
   "p3_u": 19465.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Merritt": {
   "pe": 13,
   "pe_u": 671.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mission": {
   "pe": 146,
   "pe_u": 6661.0,
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
   "p2": 73,
   "p3": 191,
   "p3_u": 1417.5,
   "pp": 2,
   "pp_u": 10.0
  },
  "Monterey": {
   "pe": 126,
   "pe_u": 5582.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Moorpark": {
   "pe": 200,
   "pe_u": 8664.0,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "p3_u": null,
   "p3_u_suppressed": true,
   "pp": 0,
   "pp_u": 0.0
  },
  "Moreno Valley": {
   "pe": 2389,
   "pe_u": 50553.0,
   "p2": 419,
   "p3": 1953,
   "p3_u": 11210.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mt San Antonio": {
   "pe": 732,
   "pe_u": 31389.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Mt. San Jacinto": {
   "pe": 533,
   "pe_u": 30779.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Napa": {
   "pe": 51,
   "pe_u": 2138.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Norco College": {
   "pe": 710,
   "pe_u": 24236.5,
   "p2": 150,
   "p3": 438,
   "p3_u": 3957.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Ohlone": {
   "pe": 130,
   "pe_u": 5231.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Orange Coast": {
   "pe": 0,
   "pe_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Oxnard": {
   "pe": 153,
   "pe_u": 8364.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Palo Verde": {
   "pe": 17,
   "pe_u": 596.25,
   "p2": 8,
   "p3": 8,
   "p3_u": 146.25,
   "pp": 0,
   "pp_u": 0.0
  },
  "Palomar": {
   "pe": 0,
   "pe_u": 0.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Pasadena": {
   "pe": 130,
   "pe_u": 5926.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Porterville": {
   "pe": 25,
   "pe_u": 593.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Redwoods": {
   "pe": 33,
   "pe_u": 1432.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Reedley College": {
   "pe": 123,
   "pe_u": 4571.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Riverside": {
   "pe": 829,
   "pe_u": 36157.0,
   "p2": 31,
   "p3": 691,
   "p3_u": 3494.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Sacramento City": {
   "pe": 59,
   "pe_u": 2298.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Saddleback": {
   "pe": 57,
   "pe_u": 2683.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Bernardino": {
   "pe": 305,
   "pe_u": 9496.0,
   "p2": 59,
   "p3": 87,
   "p3_u": 748.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego City": {
   "pe": 4251,
   "pe_u": 92938.5,
   "p2": 121,
   "p3": 2837,
   "p3_u": 8844.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego Mesa": {
   "pe": 4625,
   "pe_u": 101367.5,
   "p2": 117,
   "p3": 3095,
   "p3_u": 9249.5,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Diego Miramar": {
   "pe": 3087,
   "pe_u": 92206.2,
   "p2": 85,
   "p3": 1502,
   "p3_u": 5390.7,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Francisco": {
   "pe": 1209,
   "pe_u": 56341.0,
   "p2": 8,
   "p3": 15,
   "p3_u": 118.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Joaquin Delta": {
   "pe": 493,
   "pe_u": 20764.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Jose City": {
   "pe": 120,
   "pe_u": 6198.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "San Mateo": {
   "pe": 180,
   "pe_u": 9420.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santa Ana": {
   "pe": 448,
   "pe_u": 16225.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santa Barbara": {
   "pe": 86,
   "pe_u": 4016.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santa Rosa": {
   "pe": 438,
   "pe_u": 18840.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Santiago Canyon": {
   "pe": 423,
   "pe_u": 17605.5,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Sequoias": {
   "pe": 174,
   "pe_u": 8132.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Shasta": {
   "pe": 179,
   "pe_u": 7715.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Sierra": {
   "pe": 338,
   "pe_u": 11639.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Skyline": {
   "pe": 105,
   "pe_u": 3966.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Solano": {
   "pe": 157,
   "pe_u": 7591.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 2,
   "pp_u": 12.0
  },
  "Southwestern": {
   "pe": 571,
   "pe_u": 37156.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Taft": {
   "pe": 11,
   "pe_u": 353.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Ventura": {
   "pe": 164,
   "pe_u": 9750.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Victor Valley": {
   "pe": 333,
   "pe_u": 13239.0,
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
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "West Hills Lemoore": {
   "pe": 313,
   "pe_u": 2714.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "West LA": {
   "pe": 732,
   "pe_u": 14153.0,
   "p2": 497,
   "p3": 563,
   "p3_u": 7446.5,
   "pp": 1,
   "pp_u": 3.0
  },
  "West Valley": {
   "pe": 55,
   "pe_u": 2020.0,
   "p2": 0,
   "p3": 0,
   "p3_u": 0.0,
   "pp": 0,
   "pp_u": 0.0
  },
  "Woodland": {
   "pe": 8,
   "pe_u": 222.0,
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
 "unit_crosscheck": {
  "source": "View_CreditDistributionByCollege_APIDataset",
  "note": "MAP's own per-college totals, which include Test/Potential rows we exclude — so a small positive gap is expected. A ratio near 2.0 would mean our per-student rows are partitions, not repeats, and the first-seen reducer is dropping units.",
  "ours": {
   "pe_u": 1354050.45,
   "p3_u": 103138.95
  },
  "map": {
   "pe_u": 1361429.95,
   "p3_u": 103163.95
  },
  "ratio": {
   "pe_u": 1.0054,
   "p3_u": 1.0002
  }
 },
 "vet_star": {
  "LA Pierce": false,
  "Merced": true,
  "Chaffey": true,
  "San Diego Mesa": true,
  "Santiago Canyon": false,
  "San Diego City": true,
  "Moreno Valley": true,
  "San Diego Miramar": true,
  "Bakersfield": true,
  "San Francisco": true,
  "Norco College": false,
  "West LA": true,
  "Long Beach": true,
  "Riverside": false,
  "De Anza": true,
  "El Camino": true,
  "Coastline": true,
  "Mt San Antonio": true,
  "Southwestern": true,
  "San Bernardino": false,
  "Desert": true,
  "Cypress": true,
  "Modesto": true,
  "Barstow": true,
  "Santa Ana": true,
  "LA Valley": true,
  "Santa Rosa": true,
  "Cabrillo": true,
  "Sierra": true,
  "Mt. San Jacinto": true,
  "Fresno City": true,
  "Canyons": true,
  "San Joaquin Delta": true,
  "Glendale": true,
  "Antelope Valley": true,
  "Clovis": true,
  "Shasta": false,
  "Fullerton": true,
  "Solano": false,
  "Victor Valley": true,
  "LA Mission": true,
  "Mission": true,
  "Sequoias": false,
  "Ventura": false,
  "Citrus": true,
  "Cerro Coso": true,
  "West Hills Lemoore": false,
  "East LA": false,
  "Evergreen Valley": true,
  "San Jose City": true,
  "Oxnard": true,
  "Golden West": false,
  "Allan Hancock": false,
  "San Mateo": true,
  "Cerritos": true,
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
  "Crafton Hills": false,
  "Palo Verde": false,
  "American River": false,
  "Porterville": false,
  "Las Positas": false,
  "Hartnell": false,
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
  "Palomar": false,
  "LA City": false,
  "Ohlone": true,
  "Cuyamaca": false,
  "Sacramento City": false,
  "Santa Barbara": true,
  "Gavilan": false,
  "Columbia": false,
  "Chabot": false,
  "Taft": false,
  "Butte": false,
  "Feather River": true,
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
  "Marin": false,
  "Siskiyous": false
 },
 "vet_star_as_of": "2026-07-31",
 "vet_star_threshold": 0.75,
 "vet_star_n": 56
};
