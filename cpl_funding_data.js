// CPL Implementation Funding model data — COMMITTED STATIC SNAPSHOT.
// The Excel workbook + one-shot builder were RETIRED 2026-07-03 (Sam: "we don't
// need that excel book anymore"). This file is now hand-maintained: it carries
// the MIS college-headcount roster (2025-26 update applied 2026-07-03 for the
// 74 colleges Sam reported; the rest carry 2022-23 — per-row `hc_vintage`) +
// census context + the baked model DEFAULTS. The 4 noncredit feeder
// institutions (NOCE / SD Cont. Ed / Mt. SAC NC / Calbright) live in the
// `feeders` roster, NOT the college table (they cannot earn the CPL priority
// metrics; the feeder carve-out supports them instead). The Chancellor-editable POLICY layer (years / priority metrics +
// factors / feeder carve-out) lives in Supabase `cpl_funding_config`; the
// renderer overlays that + a per-browser what-if scenario and computes every
// dollar live. NOT part of the daily cron.
//
// 2026-07-06 policy defaults (all Chancellor-editable in-tab): `disbursement`
// (even|frontload — front-load pulls the full window into Year 1 with
// roll-forward), pool.floor_window (minimum viable per-college window
// allocation, waterfall-funded within the pool), pool.rural_carveout + the
// per-college `rural` flags (DRAFT roster = the 13 federally-rural CCCs) — a
// GUARANTEED earmark that funds rural colleges' floor first (PR4, 2026-07-28) —
// and participation_deadline (baseline-eligibility opt-in date).
//
// To refresh the headcount vintage: edit the `colleges` headcounts + SYSTEM
// total here directly (a rare modeling decision), keep headcount_pct in sync,
// and bump model_version. The prior builder lives in git history if a full
// workbook re-derive is ever needed again.
window.CPL_FUNDING = {
 "model_version": "2026-07-06.2",
 "source": "committed data snapshot · MIS annual headcount (2025-26 update, 2026-07-03)",
 "headcount_label": "2025-2026 MIS ANNUAL HEADCOUNT (updated 2026-07-03; colleges not in the update carry 2022-2023)",
 "headcount_source": {
  "name": "CCCCO MIS DataMart — Annual/Term Student Count",
  "url": "https://datamart.cccco.edu/Students/Student_Headcount_Term_Annual.aspx",
  "selection": "Collegewide Search"
 },
 "pool": {
  "remaining_2025_26": 9040307.0,
  "one_time_2026_27": 35000000.0,
  "admin_cost": 1200000.0,
  "admin_cost_label": "CO ADMINISTRATION",
  "scaling_projects_tech": 6559693.0,
  "college_funding_before_feeder": 27240307.0,
  "college_funding_before_feeder_label": "AVAILABLE COLLEGE FUNDING (before feeder carve-out)",
  "feeder_carveout": 1000000.0,
  "feeder_carveout_label": "NONCREDIT FEEDER SUPPORT (carve-out)",
  "rural_carveout": 1000000.0,
  "rural_carveout_label": "RURAL COLLEGE ALLOWANCE (guaranteed — floor-fill + bonus)",
  "floor_window": 150000.0,
  "floor_window_label": "MINIMUM VIABLE ALLOCATION (per college, window floor)",
  "ccc_headcount": 2258784
 },
 "year_options": [
  "2026-27",
  "2027-28",
  "2028-29",
  "2029-30"
 ],
 "default_years": [
  "2026-27",
  "2027-28"
 ],
 "disbursement": "even",
 "year_priorities": {
  "1": [
   {
    "key": "p1",
    "label": "Priority 1",
    "description": "Increase CCC certificate or degree completion through CPL awards.",
    "share": 0.3,
    "target_rate": 0.05,
    "metric": "Headcount with any transcribed CPL"
   },
   {
    "key": "p2",
    "label": "Priority 2",
    "description": "Increase college access through CPL.",
    "share": 0.42,
    "target_rate": 0.06,
    "metric": "Headcount with Eligible CPL Based on Statewide Credit Recommendations"
   },
   {
    "key": "p3",
    "label": "Priority 3",
    "description": "Increase CCC CPL capacity, visibility, documentability, interoperability, mobility.",
    "share": 0.28,
    "target_rate": 0.046666666,
    "metric": "Headcount with Transcribed Credit from either CPL Portal or CPL Landing Page"
   }
  ],
  "2": [
   {
    "key": "p1",
    "label": "Priority 1",
    "description": "Increase CCC certificate or degree completion through CPL awards.",
    "share": 0.3,
    "target_rate": 0.05,
    "metric": "Units of Transcribed CPL"
   },
   {
    "key": "p2",
    "label": "Priority 2",
    "description": "Increase college access through CPL.",
    "share": 0.42,
    "target_rate": 0.06,
    "metric": "Headcount with Completion and 3+ Transcribed CPL Units"
   },
   {
    "key": "p3",
    "label": "Priority 3",
    "description": "Increase CCC CPL capacity, visibility, documentability, interoperability, mobility.",
    "share": 0.28,
    "target_rate": 0.046666666,
    "metric": "Headcount with CPL Matched in MAP and MIS"
   }
  ]
 },
 "feeders": [
  {
   "name": "North Orange Continuing Education",
   "short": "NOCE",
   "headcount": 15560,
   "vintage": "2025-26"
  },
  {
   "name": "San Diego College of Continuing Education",
   "short": "SD Cont. Ed",
   "headcount": 21561,
   "vintage": "2025-26"
  },
  {
   "name": "Mt. San Antonio College — Noncredit",
   "short": "Mt. SAC NC",
   "headcount": 35363,
   "vintage": "2022-23"
  },
  {
   "name": "Calbright College",
   "short": "Calbright",
   "headcount": 2484,
   "vintage": "2022-23"
  }
 ],
 "feeder_metric": "CPL-ready noncredit completions handed off to a partner credit college",
 "rural_source": "The 13 California Community Colleges federally categorized as rural (superseding the 10-college CCCCO Rural College Transfer Collaborative demo cohort, which was invitation-based); edit the per-college rural flags here (or via the in-tab override when unlocked) to true up",
 "participation_deadline": "2026-09-01",
 "extra_reqs": [],
 "coord_req_label": "CPL Coordinator listed in MAP",
 "participation_req_label": "Participation request by",
 "coord_req_hidden": false,
 "participation_req_hidden": false,
 "system": {
  "order": 0,
  "college": "SYSTEM",
  "headcount": 2258784,
  "headcount_pct": 1,
  "district": "CCCCO",
  "county": "CALIFORNIA",
  "working_adults": 5106199,
  "county_pop_pct": 1
 },
 "colleges": [
  {
   "order": 1,
   "college": "Alameda",
   "headcount": 9582,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.004242105,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2022-23"
  },
  {
   "order": 7,
   "college": "Berkeley City",
   "headcount": 10515,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.00465516,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2022-23"
  },
  {
   "order": 14,
   "college": "Chabot",
   "headcount": 6946,
   "district": "Chabot-Las Positas Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.003075106,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26"
  },
  {
   "order": 54,
   "college": "Laney",
   "headcount": 15939,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.007056452,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2022-23"
  },
  {
   "order": 55,
   "college": "Las Positas",
   "headcount": 4542,
   "district": "Chabot-Las Positas Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.002010816,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26"
  },
  {
   "order": 63,
   "college": "Merritt",
   "headcount": 11136,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.004930086,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2022-23"
  },
  {
   "order": 75,
   "college": "Ohlone",
   "headcount": 16422,
   "district": "Ohlone Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.007270283,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26"
  },
  {
   "order": 8,
   "college": "Butte",
   "headcount": 13448,
   "district": "Butte-Glenn Community College District",
   "county": "Butte",
   "working_adults": 33835,
   "headcount_pct": 0.005953646,
   "county_pop_pct": 0.00662626,
   "hc_vintage": "2022-23"
  },
  {
   "order": 21,
   "college": "Contra Costa",
   "headcount": 9993,
   "district": "Contra Costa Community College District",
   "county": "Contra Costa",
   "working_adults": 146127,
   "headcount_pct": 0.004424062,
   "county_pop_pct": 0.028617569,
   "hc_vintage": "2022-23"
  },
  {
   "order": 30,
   "college": "Diablo Valley",
   "headcount": 23983,
   "district": "Contra Costa Community College District",
   "county": "Contra Costa",
   "working_adults": 146127,
   "headcount_pct": 0.01061766,
   "county_pop_pct": 0.028617569,
   "hc_vintage": "2022-23"
  },
  {
   "order": 58,
   "college": "Los Medanos",
   "headcount": 11452,
   "district": "Contra Costa Community College District",
   "county": "Contra Costa",
   "working_adults": 146127,
   "headcount_pct": 0.005069985,
   "county_pop_pct": 0.028617569,
   "hc_vintage": "2022-23"
  },
  {
   "order": 53,
   "college": "Lake Tahoe",
   "headcount": 9259,
   "district": "Lake Tahoe Community College District",
   "county": "El Dorado",
   "working_adults": 37623,
   "headcount_pct": 0.004099108,
   "county_pop_pct": 0.007368103,
   "hc_vintage": "2022-23"
  },
  {
   "order": 17,
   "college": "Clovis",
   "headcount": 19365,
   "district": "State Center Community College District",
   "county": "Fresno",
   "working_adults": 138085,
   "headcount_pct": 0.008573197,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26"
  },
  {
   "order": 37,
   "college": "Fresno City",
   "headcount": 44846,
   "district": "State Center Community College District",
   "county": "Fresno",
   "working_adults": 138085,
   "headcount_pct": 0.019854045,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26"
  },
  {
   "order": 83,
   "college": "Reedley College",
   "headcount": 18527,
   "district": "State Center Community College District",
   "county": "Fresno",
   "working_adults": 138085,
   "headcount_pct": 0.008202201,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26"
  },
  {
   "order": 112,
   "college": "West Hills Coalinga",
   "display": "Coalinga College",
   "rural": true,
   "headcount": 6593,
   "district": "West Hills Community College District",
   "county": "Fresno",
   "working_adults": 138085,
   "headcount_pct": 0.002918827,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26"
  },
  {
   "order": 82,
   "college": "Redwoods",
   "rural": true,
   "headcount": 8451,
   "district": "Redwoods Community College District",
   "county": "Humboldt",
   "working_adults": 24550,
   "headcount_pct": 0.003741394,
   "county_pop_pct": 0.004807882,
   "hc_vintage": "2025-26"
  },
  {
   "order": 44,
   "college": "Imperial",
   "display": "Imperial Valley College",
   "rural": true,
   "headcount": 11715,
   "district": "Imperial Community College District",
   "county": "Imperial",
   "working_adults": 23220,
   "headcount_pct": 0.005186419,
   "county_pop_pct": 0.004547414,
   "hc_vintage": "2022-23"
  },
  {
   "order": 5,
   "college": "Bakersfield",
   "headcount": 46102,
   "district": "Kern Community College District",
   "county": "Kern",
   "working_adults": 127203,
   "headcount_pct": 0.020410097,
   "county_pop_pct": 0.024911485,
   "hc_vintage": "2025-26"
  },
  {
   "order": 13,
   "college": "Cerro Coso",
   "rural": true,
   "headcount": 11492,
   "district": "Kern Community College District",
   "county": "Kern",
   "working_adults": 127203,
   "headcount_pct": 0.005087693,
   "county_pop_pct": 0.024911485,
   "hc_vintage": "2025-26"
  },
  {
   "order": 109,
   "college": "Taft",
   "rural": true,
   "headcount": 6861,
   "district": "West Kern Community College District",
   "county": "Kern",
   "working_adults": 127203,
   "headcount_pct": 0.003037475,
   "county_pop_pct": 0.024911485,
   "hc_vintage": "2022-23"
  },
  {
   "order": 113,
   "college": "West Hills Lemoore",
   "headcount": 8681,
   "district": "West Hills Community College District",
   "county": "Kings",
   "working_adults": 20828,
   "headcount_pct": 0.003843218,
   "county_pop_pct": 0.004078964,
   "hc_vintage": "2025-26"
  },
  {
   "order": 56,
   "college": "Lassen",
   "rural": true,
   "headcount": 3790,
   "district": "Lassen Community College District",
   "county": "Lassen",
   "working_adults": null,
   "headcount_pct": 0.001677894,
   "county_pop_pct": null,
   "hc_vintage": "2025-26"
  },
  {
   "order": 4,
   "college": "Antelope Valley",
   "headcount": 15723,
   "district": "Antelope Valley Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.006960825,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 11,
   "college": "Canyons",
   "headcount": 33596,
   "district": "Santa Clarita Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.014873489,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 12,
   "college": "Cerritos",
   "headcount": 36126,
   "district": "Cerritos Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.015993561,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 16,
   "college": "Citrus",
   "headcount": 16383,
   "district": "Citrus Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.007253018,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 20,
   "college": "Compton",
   "headcount": 6097,
   "district": "Compton Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.00269924,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 31,
   "college": "East LA",
   "headcount": 65933,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.029189599,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 32,
   "college": "El Camino",
   "headcount": 30575,
   "district": "El Camino Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.013536044,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 40,
   "college": "Glendale",
   "headcount": 21852,
   "district": "Glendale Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.009674232,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 46,
   "college": "LA City",
   "headcount": 31212,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.013818054,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 47,
   "college": "LA Harbor",
   "headcount": 21079,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.009332012,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 48,
   "college": "LA Mission",
   "headcount": 24310,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.010762428,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 49,
   "college": "LA Pierce",
   "headcount": 31635,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.014005323,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 50,
   "college": "LA Swest",
   "headcount": 12511,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.005538821,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 51,
   "college": "LA Trade",
   "headcount": 23631,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.010461824,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 52,
   "college": "LA Valley",
   "headcount": 32761,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.014503822,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 57,
   "college": "Long Beach",
   "headcount": 34680,
   "district": "Long Beach Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.015353394,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 70,
   "college": "Mt San Antonio",
   "headcount": 41950,
   "district": "Mt. San Antonio Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.01857194,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 80,
   "college": "Pasadena",
   "headcount": 14936,
   "district": "Pasadena Area Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.006612407,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 84,
   "college": "Rio Hondo",
   "headcount": 28241,
   "district": "Rio Hondo Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.012502745,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 99,
   "college": "Santa Monica",
   "headcount": 37289,
   "district": "Santa Monica Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.01650844,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23"
  },
  {
   "order": 114,
   "college": "West LA",
   "headcount": 21712,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.009612252,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26"
  },
  {
   "order": 59,
   "college": "Madera",
   "headcount": 13744,
   "district": "State Center Community College District",
   "county": "Madera",
   "working_adults": 21685,
   "headcount_pct": 0.00608469,
   "county_pop_pct": 0.004246799,
   "hc_vintage": "2025-26"
  },
  {
   "order": 60,
   "college": "Marin",
   "headcount": 9820,
   "district": "Marin Community College District",
   "county": "Marin",
   "working_adults": 25654,
   "headcount_pct": 0.004347472,
   "county_pop_pct": 0.005024089,
   "hc_vintage": "2025-26"
  },
  {
   "order": 61,
   "college": "Mendocino",
   "headcount": 9311,
   "district": "Mendocino-Lake Community College District",
   "county": "Mendocino",
   "working_adults": 18778,
   "headcount_pct": 0.004122129,
   "county_pop_pct": 0.003677491,
   "hc_vintage": "2025-26"
  },
  {
   "order": 62,
   "college": "Merced",
   "headcount": 21722,
   "district": "Merced Community College District",
   "county": "Merced",
   "working_adults": 35277,
   "headcount_pct": 0.009616679,
   "county_pop_pct": 0.006908661,
   "hc_vintage": "2025-26"
  },
  {
   "order": 43,
   "college": "Hartnell",
   "headcount": 14832,
   "district": "Hartnell Community College District",
   "county": "Monterey",
   "working_adults": 44526,
   "headcount_pct": 0.006566365,
   "county_pop_pct": 0.008719989,
   "hc_vintage": "2025-26"
  },
  {
   "order": 67,
   "college": "Monterey",
   "headcount": 10535,
   "district": "Monterey Peninsula Community College District",
   "county": "Monterey",
   "working_adults": 44526,
   "headcount_pct": 0.004664014,
   "county_pop_pct": 0.008719989,
   "hc_vintage": "2025-26"
  },
  {
   "order": 72,
   "college": "Napa",
   "headcount": 6418,
   "district": "Napa Valley Community College District",
   "county": "Napa",
   "working_adults": 16949,
   "headcount_pct": 0.002841352,
   "county_pop_pct": 0.003319299,
   "hc_vintage": "2022-23"
  },
  {
   "order": 18,
   "college": "Coastline",
   "headcount": 20799,
   "district": "Coast Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.009208052,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26"
  },
  {
   "order": 27,
   "college": "Cypress",
   "headcount": 24026,
   "district": "North Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.010636697,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26"
  },
  {
   "order": 38,
   "college": "Fullerton",
   "headcount": 30846,
   "district": "North Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.01365602,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26"
  },
  {
   "order": 41,
   "college": "Golden West",
   "headcount": 22013,
   "district": "Coast Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.009745509,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26"
  },
  {
   "order": 45,
   "college": "Irvine",
   "headcount": 20375,
   "district": "South Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.00902034,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2022-23"
  },
  {
   "order": 76,
   "college": "Orange Coast",
   "headcount": 24919,
   "district": "Coast Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.011032042,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26"
  },
  {
   "order": 87,
   "college": "Saddleback",
   "headcount": 36459,
   "district": "South Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.016140986,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2022-23"
  },
  {
   "order": 97,
   "college": "Santa Ana",
   "headcount": 19310,
   "district": "Rancho Santiago Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.008548848,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26"
  },
  {
   "order": 101,
   "college": "Santiago Canyon",
   "headcount": 9733,
   "district": "Rancho Santiago Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.004308956,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26"
  },
  {
   "order": 104,
   "college": "Sierra",
   "headcount": 30579,
   "district": "Sierra Joint Community College District",
   "county": "Placer",
   "working_adults": 71637,
   "headcount_pct": 0.013537815,
   "county_pop_pct": 0.014029418,
   "hc_vintage": "2025-26"
  },
  {
   "order": 34,
   "college": "Feather River",
   "rural": true,
   "headcount": 2739,
   "district": "Feather River Community College District",
   "county": "Plumas",
   "working_adults": null,
   "headcount_pct": 0.001212599,
   "county_pop_pct": null,
   "hc_vintage": "2022-23"
  },
  {
   "order": 29,
   "college": "Desert",
   "headcount": 21113,
   "district": "Desert Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.009347065,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2025-26"
  },
  {
   "order": 69,
   "college": "Moreno Valley",
   "headcount": 15460,
   "district": "Riverside Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.006844391,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2022-23"
  },
  {
   "order": 71,
   "college": "Mt. San Jacinto",
   "headcount": 25950,
   "district": "Mt. San Jacinto Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.011488482,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2025-26"
  },
  {
   "order": 73,
   "college": "Norco College",
   "headcount": 15897,
   "district": "Riverside Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.007037858,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2022-23"
  },
  {
   "order": 78,
   "college": "Palo Verde",
   "rural": true,
   "headcount": 6472,
   "district": "Palo Verde Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.002865258,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2022-23"
  },
  {
   "order": 85,
   "college": "Riverside",
   "headcount": 29205,
   "district": "Riverside Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.012929523,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2022-23"
  },
  {
   "order": 3,
   "college": "American River",
   "headcount": 49176,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.021771006,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26"
  },
  {
   "order": 23,
   "college": "Cosumnes River",
   "headcount": 27543,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.012193729,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26"
  },
  {
   "order": 35,
   "college": "Folsom Lake",
   "headcount": 19692,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.008717965,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26"
  },
  {
   "order": 86,
   "college": "Sacramento City",
   "headcount": 34885,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.01544415,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26"
  },
  {
   "order": 6,
   "college": "Barstow",
   "rural": true,
   "headcount": 5274,
   "district": "Barstow Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.002334885,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2022-23"
  },
  {
   "order": 15,
   "college": "Chaffey",
   "headcount": 30505,
   "district": "Chaffey Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.013505054,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2022-23"
  },
  {
   "order": 22,
   "college": "Copper Mountain",
   "rural": true,
   "headcount": 2278,
   "district": "Copper Mountain Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.001008507,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2022-23"
  },
  {
   "order": 24,
   "college": "Crafton Hills",
   "headcount": 10970,
   "district": "San Bernardino Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.004856595,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26"
  },
  {
   "order": 88,
   "college": "San Bernardino",
   "headcount": 23732,
   "district": "San Bernardino Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.010506538,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26"
  },
  {
   "order": 111,
   "college": "Victor Valley",
   "headcount": 18646,
   "district": "Victor Valley Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.008254884,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2022-23"
  },
  {
   "order": 26,
   "college": "Cuyamaca",
   "headcount": 14754,
   "district": "Grossmont-Cuyamaca Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.006531833,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26"
  },
  {
   "order": 42,
   "college": "Grossmont",
   "headcount": 22185,
   "district": "Grossmont-Cuyamaca Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.009821656,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26"
  },
  {
   "order": 64,
   "college": "MiraCosta",
   "headcount": 22485,
   "district": "MiraCosta Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.009954471,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26"
  },
  {
   "order": 79,
   "college": "Palomar",
   "headcount": 27744,
   "district": "Palomar Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.012282715,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2022-23"
  },
  {
   "order": 90,
   "college": "San Diego City",
   "headcount": 22038,
   "district": "San Diego Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.009756577,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26"
  },
  {
   "order": 91,
   "college": "San Diego Mesa",
   "headcount": 31776,
   "district": "San Diego Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.014067746,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26"
  },
  {
   "order": 92,
   "college": "San Diego Miramar",
   "headcount": 24092,
   "district": "San Diego Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.010665916,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26"
  },
  {
   "order": 108,
   "college": "Southwestern",
   "headcount": 29292,
   "district": "Southwestern Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.012968039,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26"
  },
  {
   "order": 93,
   "college": "San Francisco",
   "headcount": 42763,
   "district": "San Francisco Community College District",
   "county": "San Francisco",
   "working_adults": 72403,
   "headcount_pct": 0.018931868,
   "county_pop_pct": 0.014179432,
   "hc_vintage": "2025-26"
  },
  {
   "order": 94,
   "college": "San Joaquin Delta",
   "headcount": 32056,
   "district": "San Joaquin Delta Community College District",
   "county": "San Joaquin",
   "working_adults": 106683,
   "headcount_pct": 0.014191707,
   "county_pop_pct": 0.02089284,
   "hc_vintage": "2025-26"
  },
  {
   "order": 25,
   "college": "Cuesta",
   "headcount": 16728,
   "district": "San Luis Obispo County Community College District",
   "county": "San Luis Obispo",
   "working_adults": 45711,
   "headcount_pct": 0.007405755,
   "county_pop_pct": 0.00895206,
   "hc_vintage": "2022-23"
  },
  {
   "order": 10,
   "college": "Canada",
   "headcount": 11888,
   "district": "San Mateo County Community College District",
   "county": "San Mateo",
   "working_adults": 78896,
   "headcount_pct": 0.005263009,
   "county_pop_pct": 0.015451023,
   "hc_vintage": "2025-26"
  },
  {
   "order": 96,
   "college": "San Mateo",
   "headcount": 15579,
   "district": "San Mateo County Community College District",
   "county": "San Mateo",
   "working_adults": 78896,
   "headcount_pct": 0.006897074,
   "county_pop_pct": 0.015451023,
   "hc_vintage": "2025-26"
  },
  {
   "order": 106,
   "college": "Skyline",
   "headcount": 18033,
   "district": "San Mateo County Community College District",
   "county": "San Mateo",
   "working_adults": 78896,
   "headcount_pct": 0.007983499,
   "county_pop_pct": 0.015451023,
   "hc_vintage": "2025-26"
  },
  {
   "order": 2,
   "college": "Allan Hancock",
   "headcount": 21231,
   "district": "Allan Hancock Joint Community College District",
   "county": "Santa Barbara",
   "working_adults": 54159,
   "headcount_pct": 0.009399305,
   "county_pop_pct": 0.01060652,
   "hc_vintage": "2025-26"
  },
  {
   "order": 98,
   "college": "Santa Barbara",
   "headcount": 25673,
   "district": "Santa Barbara Community College District",
   "county": "Santa Barbara",
   "working_adults": 54159,
   "headcount_pct": 0.01136585,
   "county_pop_pct": 0.01060652,
   "hc_vintage": "2025-26"
  },
  {
   "order": 28,
   "college": "De Anza",
   "headcount": 27215,
   "district": "Foothill-De Anza Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.012048518,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2022-23"
  },
  {
   "order": 33,
   "college": "Evergreen Valley",
   "headcount": 13401,
   "district": "San Jose-Evergreen Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.005932838,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2022-23"
  },
  {
   "order": 36,
   "college": "Foothill",
   "headcount": 24888,
   "district": "Foothill-De Anza Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.011018318,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2022-23"
  },
  {
   "order": 39,
   "college": "Gavilan",
   "headcount": 10789,
   "district": "Gavilan Joint Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.004776464,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26"
  },
  {
   "order": 65,
   "college": "Mission",
   "headcount": 12670,
   "district": "West Valley-Mission Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.005609213,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26"
  },
  {
   "order": 95,
   "college": "San Jose City",
   "headcount": 13032,
   "district": "San Jose-Evergreen Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.005769476,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2022-23"
  },
  {
   "order": 115,
   "college": "West Valley",
   "headcount": 16145,
   "district": "West Valley-Mission Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.007147651,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26"
  },
  {
   "order": 9,
   "college": "Cabrillo",
   "headcount": 15831,
   "district": "Cabrillo Community College District",
   "county": "Santa Cruz",
   "working_adults": 36341,
   "headcount_pct": 0.007008638,
   "county_pop_pct": 0.007117036,
   "hc_vintage": "2025-26"
  },
  {
   "order": 103,
   "college": "Shasta",
   "rural": true,
   "headcount": 15232,
   "district": "Shasta-Tehama-Trinity Joint Community College District",
   "county": "Shasta",
   "working_adults": 40002,
   "headcount_pct": 0.006743451,
   "county_pop_pct": 0.007834007,
   "hc_vintage": "2025-26"
  },
  {
   "order": 105,
   "college": "Siskiyous",
   "rural": true,
   "headcount": 4270,
   "district": "Siskiyou Joint Community College District",
   "county": "Siskiyou",
   "working_adults": null,
   "headcount_pct": 0.001890398,
   "county_pop_pct": null,
   "hc_vintage": "2025-26"
  },
  {
   "order": 107,
   "college": "Solano",
   "headcount": 13302,
   "district": "Solano County Community College District",
   "county": "Solano",
   "working_adults": 77534,
   "headcount_pct": 0.005889009,
   "county_pop_pct": 0.015184289,
   "hc_vintage": "2025-26"
  },
  {
   "order": 100,
   "college": "Santa Rosa",
   "headcount": 11889,
   "district": "Sonoma County Junior College District",
   "county": "Sonoma",
   "working_adults": 82997,
   "headcount_pct": 0.005263451,
   "county_pop_pct": 0.016254165,
   "hc_vintage": "2025-26"
  },
  {
   "order": 66,
   "college": "Modesto",
   "headcount": 27270,
   "district": "Yosemite Community College District",
   "county": "Stanislaus",
   "working_adults": 81075,
   "headcount_pct": 0.012072868,
   "county_pop_pct": 0.01587776,
   "hc_vintage": "2025-26"
  },
  {
   "order": 81,
   "college": "Porterville",
   "headcount": 8126,
   "district": "Kern Community College District",
   "county": "Tulare",
   "working_adults": 63560,
   "headcount_pct": 0.003597511,
   "county_pop_pct": 0.012447615,
   "hc_vintage": "2025-26"
  },
  {
   "order": 102,
   "college": "Sequoias",
   "headcount": 19886,
   "district": "Sequoias Community College District",
   "county": "Tulare",
   "working_adults": 63560,
   "headcount_pct": 0.008803852,
   "county_pop_pct": 0.012447615,
   "hc_vintage": "2025-26"
  },
  {
   "order": 19,
   "college": "Columbia",
   "rural": true,
   "headcount": 4795,
   "district": "Yosemite Community College District",
   "county": "Tuolumne",
   "working_adults": null,
   "headcount_pct": 0.002122824,
   "county_pop_pct": null,
   "hc_vintage": "2025-26"
  },
  {
   "order": 68,
   "college": "Moorpark",
   "headcount": 19597,
   "district": "Ventura County Community College District",
   "county": "Ventura",
   "working_adults": 111435,
   "headcount_pct": 0.008675907,
   "county_pop_pct": 0.021823474,
   "hc_vintage": "2022-23"
  },
  {
   "order": 77,
   "college": "Oxnard",
   "headcount": 10620,
   "district": "Ventura County Community College District",
   "county": "Ventura",
   "working_adults": 111435,
   "headcount_pct": 0.004701645,
   "county_pop_pct": 0.021823474,
   "hc_vintage": "2022-23"
  },
  {
   "order": 110,
   "college": "Ventura",
   "headcount": 16543,
   "district": "Ventura County Community College District",
   "county": "Ventura",
   "working_adults": 111435,
   "headcount_pct": 0.007323852,
   "county_pop_pct": 0.021823474,
   "hc_vintage": "2022-23"
  },
  {
   "order": 116,
   "college": "Woodland",
   "headcount": 7319,
   "district": "Yuba Community College District",
   "county": "Yolo",
   "working_adults": 25523,
   "headcount_pct": 0.003240239,
   "county_pop_pct": 0.004998434,
   "hc_vintage": "2025-26"
  },
  {
   "order": 117,
   "college": "Yuba",
   "headcount": 10797,
   "district": "Yuba Community College District",
   "county": "Yuba",
   "working_adults": 14117,
   "headcount_pct": 0.004780006,
   "county_pop_pct": 0.002764679,
   "hc_vintage": "2025-26"
  }
 ],
 "footnotes": [
  "*Survey did not estimate counties <65K in population",
  "Source: U.S. Census 2022 American Community Survey: https://data.census.gov/table/ACSDT1Y2022.B16010?q=Educational%20Attainment%20by%20employment%20status%20and%20state&g=040XX00US06,06$0500000&y=2022&moe=false"
 ]
};
