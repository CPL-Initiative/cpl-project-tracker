// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students
// context column) — generated daily by
// funding/_build_funding_performance.py from the transient CustomReport
// pull. Aggregate, small-cell-suppressed counts ONLY (see
// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.
window.CPL_FUNDING_PERF = {
 "as_of": "2026-07-28",
 "basis": "MAP View_StudentAggregatedValues_APIDataset — distinct students per college; Test students and test colleges excluded; P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, PE = any eligible CPL units identified, PP = portal-origin (Potential Student = Yes) with any transcribed CPL (the CPL Student Portal / Landing Page metric; small & mostly test until launch) (per MAP)",
 "suppress_below": 5,
 "statewide": {
  "pe": 43302,
  "p2": 4791,
  "p3": 17136,
  "pp": 5
 },
 "colleges": {
  "Alameda": {
   "pe": 13,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Allan Hancock": {
   "pe": 138,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "American River": {
   "pe": 44,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Antelope Valley": {
   "pe": 278,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Bakersfield": {
   "pe": 577,
   "p2": 49,
   "p3": 50,
   "pp": 0
  },
  "Berkeley City": {
   "pe": 16,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Butte": {
   "pe": 9,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Cabrillo": {
   "pe": 211,
   "p2": 17,
   "p3": 44,
   "pp": 0
  },
  "Canada": {
   "pe": 29,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Canyons": {
   "pe": 498,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Cerritos": {
   "pe": 166,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Cerro Coso": {
   "pe": 164,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Chabot": {
   "pe": 15,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Chaffey": {
   "pe": 1479,
   "p2": 15,
   "p3": 32,
   "pp": 0
  },
  "Citrus": {
   "pe": 206,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Clovis": {
   "pe": 186,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Coastline": {
   "pe": 896,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Columbia": {
   "pe": 21,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Compton": {
   "pe": 21,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Contra Costa": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Copper Mountain": {
   "pe": 78,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Crafton Hills": {
   "pe": 21,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Cuesta": {
   "pe": 98,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "pp": 0
  },
  "Cuyamaca": {
   "pe": 93,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Cypress": {
   "pe": 640,
   "p2": 10,
   "p3": 19,
   "pp": 0
  },
  "De Anza": {
   "pe": 976,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "pp": 0
  },
  "Desert": {
   "pe": 396,
   "p2": 37,
   "p3": 37,
   "pp": 0
  },
  "Diablo Valley": {
   "pe": 172,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "East LA": {
   "pe": 229,
   "p2": 0,
   "p3": 25,
   "pp": 0
  },
  "El Camino": {
   "pe": 460,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "pp": 0
  },
  "Evergreen Valley": {
   "pe": 111,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Feather River": {
   "pe": 9,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Foothill": {
   "pe": 73,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Fresno City": {
   "pe": 559,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Fullerton": {
   "pe": 555,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "pp": 0
  },
  "Gavilan": {
   "pe": 46,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Glendale": {
   "pe": 215,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Golden West": {
   "pe": 98,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Grossmont": {
   "pe": 0,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Hartnell": {
   "pe": 39,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Irvine": {
   "pe": 125,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "LA City": {
   "pe": 150,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "LA Harbor": {
   "pe": 135,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "LA Mission": {
   "pe": 153,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "LA Pierce": {
   "pe": 1859,
   "p2": 1309,
   "p3": 1736,
   "pp": 0
  },
  "LA Trade": {
   "pe": 60,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "LA Valley": {
   "pe": 359,
   "p2": 0,
   "p3": 189,
   "pp": 0
  },
  "Laney": {
   "pe": 49,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Las Positas": {
   "pe": 18,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Long Beach": {
   "pe": 806,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Los Medanos": {
   "pe": 221,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Mendocino": {
   "pe": 7,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Merced": {
   "pe": 3342,
   "p2": 1781,
   "p3": 3303,
   "pp": 0
  },
  "Merritt": {
   "pe": 13,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "pp": 0
  },
  "MiraCosta": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Mission": {
   "pe": 146,
   "p2": null,
   "p2_suppressed": true,
   "p3": null,
   "p3_suppressed": true,
   "pp": 0
  },
  "Modesto": {
   "pe": 346,
   "p2": 73,
   "p3": 191,
   "pp": 2
  },
  "Monterey": {
   "pe": 126,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Moorpark": {
   "pe": 200,
   "p2": 0,
   "p3": null,
   "p3_suppressed": true,
   "pp": 0
  },
  "Moreno Valley": {
   "pe": 2378,
   "p2": 417,
   "p3": 1945,
   "pp": 0
  },
  "Mt San Antonio": {
   "pe": 732,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Mt. San Jacinto": {
   "pe": 530,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Napa": {
   "pe": 49,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Norco College": {
   "pe": 710,
   "p2": 150,
   "p3": 438,
   "pp": 0
  },
  "Ohlone": {
   "pe": 130,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Orange Coast": {
   "pe": 0,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Oxnard": {
   "pe": 151,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Palo Verde": {
   "pe": 17,
   "p2": 8,
   "p3": 8,
   "pp": 0
  },
  "Palomar": {
   "pe": 0,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Pasadena": {
   "pe": 130,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Porterville": {
   "pe": 25,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Redwoods": {
   "pe": 33,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Reedley College": {
   "pe": 123,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Riverside": {
   "pe": 818,
   "p2": 31,
   "p3": 691,
   "pp": 0
  },
  "Sacramento City": {
   "pe": 52,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Saddleback": {
   "pe": 57,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "San Bernardino": {
   "pe": 305,
   "p2": 59,
   "p3": 87,
   "pp": 0
  },
  "San Diego City": {
   "pe": 4238,
   "p2": 121,
   "p3": 2837,
   "pp": 0
  },
  "San Diego Mesa": {
   "pe": 4616,
   "p2": 117,
   "p3": 3095,
   "pp": 0
  },
  "San Diego Miramar": {
   "pe": 3079,
   "p2": 85,
   "p3": 1502,
   "pp": 0
  },
  "San Francisco": {
   "pe": 1177,
   "p2": 8,
   "p3": 15,
   "pp": 0
  },
  "San Joaquin Delta": {
   "pe": 493,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "San Jose City": {
   "pe": 120,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "San Mateo": {
   "pe": 180,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Santa Ana": {
   "pe": 443,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Santa Barbara": {
   "pe": 86,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Santa Monica": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Santa Rosa": {
   "pe": 437,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Santiago Canyon": {
   "pe": 423,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Sequoias": {
   "pe": 174,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Shasta": {
   "pe": 179,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Sierra": {
   "pe": 338,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Skyline": {
   "pe": 105,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Solano": {
   "pe": 76,
   "p2": 0,
   "p3": 0,
   "pp": 2
  },
  "Taft": {
   "pe": 11,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Ventura": {
   "pe": 164,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Victor Valley": {
   "pe": 333,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "West Hills Coalinga": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "West Hills Lemoore": {
   "pe": 313,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "West LA": {
   "pe": 732,
   "p2": 497,
   "p3": 562,
   "pp": 1
  },
  "West Valley": {
   "pe": 55,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Woodland": {
   "pe": 8,
   "p2": 0,
   "p3": 0,
   "pp": 0
  }
 },
 "unmatched": {
  "Barstow Community College": {
   "pe": 449,
   "p2": 0,
   "p3": 316,
   "pp": 0
  },
  "Calbright College Credit": {
   "pe": 117,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Lassen College": {
   "pe": 140,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Launch Apprenticeship": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Madera College": {
   "pe": 43,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "North Orange Continuing Education Credit": {
   "pe": null,
   "pe_suppressed": true,
   "p2": 0,
   "p3": 0,
   "pp": 0
  },
  "Southwestern College": {
   "pe": 571,
   "p2": 0,
   "p3": 0,
   "pp": 0
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
  "San Bernardino": false,
  "Desert": true,
  "Cypress": true,
  "Modesto": true,
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
  "Solano": false,
  "Diablo Valley": true,
  "Reedley College": true,
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
  "Santa Barbara": true,
  "Sacramento City": false,
  "Gavilan": false,
  "Columbia": false,
  "Chabot": false,
  "Taft": false,
  "Butte": false,
  "Feather River": false,
  "Imperial": false,
  "Contra Costa": false,
  "Rio Hondo": false,
  "Orange Coast": false,
  "Yuba": false,
  "Grossmont": false,
  "Lake Tahoe": false,
  "Cosumnes River": false,
  "Folsom Lake": false,
  "Marin": false,
  "Siskiyous": false
 },
 "vet_star_as_of": "2026-07-28",
 "vet_star_threshold": 0.75,
 "vet_star_n": 51
};
