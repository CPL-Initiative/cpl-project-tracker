// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-07-13",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test/Potential students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified (context, not a priority metric) (per MAP)",
 "suppress_below": 5,
 "statewide": {
  "pe": 41453,
  "p2": 4775,
  "p3": 16310
 },
 "colleges": {
  "Alameda": {
   "pe": 13,
   "p2": 0,
   "p3": 0
  },
  "Allan Hancock": {
   "pe": 138,
   "p2": 0,
   "p3": 0
  },
  "American River": {
   "pe": 44,
   "p2": 0,
   "p3": 0
  },
  "Antelope Valley": {
   "pe": 265,
   "p2": 0,
   "p3": 0
  },
  "Bakersfield": {
   "pe": 574,
   "p2": 48,
   "p3": 49
  },
  "Berkeley City": {
   "pe": 16,
   "p2": 0,
   "p3": 0
  },
  "Butte": {
   "pe": 9,
   "p2": 0,
   "p3": 0
  },
  "Cabrillo": {
   "pe": 209,
   "p2": 17,
   "p3": 44
  },
  "Canada": {
   "pe": 29,
   "p2": 0,
   "p3": 0
  },
  "Canyons": {
   "pe": 487,
   "p2": 0,
   "p3": 0
  },
  "Cerritos": {
   "pe": 166,
   "p2": 0,
   "p3": 0
  },
  "Cerro Coso": {
   "pe": 155,
   "p2": 0,
   "p3": 0
  },
  "Chabot": {
   "pe": 15,
   "p2": 0,
   "p3": 0
  },
  "Chaffey": {
   "pe": 1473,
   "p2": 14,
   "p3": 28
  },
  "Citrus": {
   "pe": 200,
   "p2": 0,
   "p3": 0
  },
  "Clovis": {
   "pe": 183,
   "p2": 0,
   "p3": 0
  },
  "Coastline": {
   "pe": 896,
   "p2": 0,
   "p3": 0
  },
  "Columbia": {
   "pe": 21,
   "p2": 0,
   "p3": 0
  },
  "Compton": {
   "pe": 21,
   "p2": 0,
   "p3": 0
  },
  "Contra Costa": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "Copper Mountain": {
   "pe": 78,
   "p2": 0,
   "p3": 0
  },
  "Crafton Hills": {
   "pe": 21,
   "p2": 0,
   "p3": 0
  },
  "Cuesta": {
   "pe": 96,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Cuyamaca": {
   "pe": 93,
   "p2": 0,
   "p3": 0
  },
  "Cypress": {
   "pe": 640,
   "p2": 10,
   "p3": 19
  },
  "De Anza": {
   "pe": 976,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Desert": {
   "pe": 391,
   "p2": 37,
   "p3": 37
  },
  "Diablo Valley": {
   "pe": 172,
   "p2": 0,
   "p3": 0
  },
  "East LA": {
   "pe": 227,
   "p2": 0,
   "p3": 25
  },
  "El Camino": {
   "pe": 460,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Evergreen Valley": {
   "pe": 111,
   "p2": 0,
   "p3": 0
  },
  "Feather River": {
   "pe": 9,
   "p2": 0,
   "p3": 0
  },
  "Foothill": {
   "pe": 73,
   "p2": 0,
   "p3": 0
  },
  "Fresno City": {
   "pe": 549,
   "p2": 0,
   "p3": 0
  },
  "Fullerton": {
   "pe": 555,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Gavilan": {
   "pe": 46,
   "p2": 0,
   "p3": 0
  },
  "Glendale": {
   "pe": 214,
   "p2": 0,
   "p3": 0
  },
  "Golden West": {
   "pe": 98,
   "p2": 0,
   "p3": 0
  },
  "Hartnell": {
   "pe": 39,
   "p2": 0,
   "p3": 0
  },
  "Irvine": {
   "pe": 124,
   "p2": 0,
   "p3": 0
  },
  "LA City": {
   "pe": 150,
   "p2": 0,
   "p3": 0
  },
  "LA Harbor": {
   "pe": 135,
   "p2": 0,
   "p3": 0
  },
  "LA Mission": {
   "pe": 153,
   "p2": 0,
   "p3": 0
  },
  "LA Pierce": {
   "pe": 1858,
   "p2": 1309,
   "p3": 1736
  },
  "LA Trade": {
   "pe": 60,
   "p2": 0,
   "p3": 0
  },
  "LA Valley": {
   "pe": 358,
   "p2": 0,
   "p3": 188
  },
  "Laney": {
   "pe": 48,
   "p2": 0,
   "p3": 0
  },
  "Las Positas": {
   "pe": 18,
   "p2": 0,
   "p3": 0
  },
  "Long Beach": {
   "pe": 803,
   "p2": 0,
   "p3": 0
  },
  "Los Medanos": {
   "pe": 221,
   "p2": 0,
   "p3": 0
  },
  "Mendocino": {
   "pe": 7,
   "p2": 0,
   "p3": 0
  },
  "Merced": {
   "pe": 3337,
   "p2": 1780,
   "p3": 3302
  },
  "Merritt": {
   "pe": 13,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true
  },
  "MiraCosta": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "Mission": {
   "pe": 146,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true
  },
  "Modesto": {
   "pe": 345,
   "p2": 73,
   "p3": 191
  },
  "Monterey": {
   "pe": 126,
   "p2": 0,
   "p3": 0
  },
  "Moorpark": {
   "pe": 128,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true
  },
  "Moreno Valley": {
   "pe": 1570,
   "p2": 419,
   "p3": 1466
  },
  "Mt San Antonio": {
   "pe": 732,
   "p2": 0,
   "p3": 0
  },
  "Mt. San Jacinto": {
   "pe": 530,
   "p2": 0,
   "p3": 0
  },
  "Napa": {
   "pe": 48,
   "p2": 0,
   "p3": 0
  },
  "Norco College": {
   "pe": 707,
   "p2": 150,
   "p3": 438
  },
  "Ohlone": {
   "pe": 130,
   "p2": 0,
   "p3": 0
  },
  "Oxnard": {
   "pe": 150,
   "p2": 0,
   "p3": 0
  },
  "Palo Verde": {
   "pe": 17,
   "p2": 8,
   "p3": 8
  },
  "Pasadena": {
   "pe": 130,
   "p2": 0,
   "p3": 0
  },
  "Porterville": {
   "pe": 24,
   "p2": 0,
   "p3": 0
  },
  "Redwoods": {
   "pe": 33,
   "p2": 0,
   "p3": 0
  },
  "Reedley College": {
   "pe": 120,
   "p2": 0,
   "p3": 0
  },
  "Riverside": {
   "pe": 750,
   "p2": 33,
   "p3": 689
  },
  "Sacramento City": {
   "pe": 35,
   "p2": 0,
   "p3": 0
  },
  "Saddleback": {
   "pe": 57,
   "p2": 0,
   "p3": 0
  },
  "San Bernardino": {
   "pe": 305,
   "p2": 54,
   "p3": 78
  },
  "San Diego City": {
   "pe": 4203,
   "p2": 121,
   "p3": 2837
  },
  "San Diego Mesa": {
   "pe": 4564,
   "p2": 117,
   "p3": 3095
  },
  "San Diego Miramar": {
   "pe": 3041,
   "p2": 85,
   "p3": 1502
  },
  "San Francisco": {
   "pe": 1088,
   "p2": 8,
   "p3": 15
  },
  "San Joaquin Delta": {
   "pe": 493,
   "p2": 0,
   "p3": 0
  },
  "San Jose City": {
   "pe": 120,
   "p2": 0,
   "p3": 0
  },
  "San Mateo": {
   "pe": 180,
   "p2": 0,
   "p3": 0
  },
  "Santa Ana": {
   "pe": 409,
   "p2": 0,
   "p3": 0
  },
  "Santa Barbara": {
   "pe": 86,
   "p2": 0,
   "p3": 0
  },
  "Santa Monica": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "Santa Rosa": {
   "pe": 432,
   "p2": 0,
   "p3": 0
  },
  "Santiago Canyon": {
   "pe": 418,
   "p2": 0,
   "p3": 0
  },
  "Sequoias": {
   "pe": 174,
   "p2": 0,
   "p3": 0
  },
  "Shasta": {
   "pe": 175,
   "p2": 0,
   "p3": 0
  },
  "Sierra": {
   "pe": 338,
   "p2": 0,
   "p3": 0
  },
  "Skyline": {
   "pe": 105,
   "p2": 0,
   "p3": 0
  },
  "Solano": {
   "pe": 76,
   "p2": 0,
   "p3": 0
  },
  "Taft": {
   "pe": 10,
   "p2": 0,
   "p3": 0
  },
  "Ventura": {
   "pe": 164,
   "p2": 0,
   "p3": 0
  },
  "Victor Valley": {
   "pe": 329,
   "p2": 0,
   "p3": 0
  },
  "West Hills Coalinga": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "West Hills Lemoore": {
   "pe": 116,
   "p2": 0,
   "p3": 0
  },
  "West LA": {
   "pe": 724,
   "p2": 485,
   "p3": 549
  },
  "West Valley": {
   "pe": 55,
   "p2": 0,
   "p3": 0
  },
  "Woodland": {
   "pe": 8,
   "p2": 0,
   "p3": 0
  }
 },
 "unmatched": {
  "Barstow Community College": {
   "pe": 127,
   "p2": 0,
   "p3": 0
  },
  "Calbright College Credit": {
   "pe": 117,
   "p2": 0,
   "p3": 0
  },
  "Lassen College": {
   "pe": 140,
   "p2": 0,
   "p3": 0
  },
  "Launch Apprenticeship": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "Madera College": {
   "pe": 43,
   "p2": 0,
   "p3": 0
  },
  "North Orange Continuing Education": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "North Orange Continuing Education Credit": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "San Diego College of Continuing Education": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0
  },
  "Southwestern College": {
   "pe": 571,
   "p2": 0,
   "p3": 0
  }
 }
};
