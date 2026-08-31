// CPL Implementation Funding model data — COMMITTED STATIC SNAPSHOT.
// The Excel workbook + one-shot builder were RETIRED 2026-07-03 (Sam: "we don't
// need that excel book anymore"). This file is now hand-maintained: it carries
// the MIS college-headcount roster (2025-26 update applied 2026-07-03 for the
// 74 colleges Sam reported; the rest carry 2022-23 — per-row `hc_vintage`) +
// census context + the baked model DEFAULTS. The 3 STANDALONE noncredit
// institutions (NOCE / SD Cont. Ed / Calbright) live in the `feeders` roster
// because they have no credit row — but since 2026-08-23 they are NOT the whole
// noncredit lane: every college row carries `noncredit_ftes` too, and the lane
// is now every institution at or above `pool.nc_threshold_ftes` (see below).
// Mt. SAC Noncredit carries `nc_ftes_on_credit_row` since 2026-08-23 (Sam: "we
// can pull out the Mt SAC NC dup"): its 10,829.3 noncredit FTES is ALSO on the
// Mt. San Antonio credit row, so counting both would pay the same program twice
// once the lane became FTES-proportional. It is excluded from the NONCREDIT SIZE
// BASIS only — the row itself STAYS, because ESS 25-82 paid Mt. SAC Noncredit
// its own $50,000 seed grant and it is a real institution in that record.
// Deleting the row erased a distributed award; the tests caught it. The Chancellor-editable POLICY layer (years / priority metrics +
// factors / noncredit carve-out) lives in Supabase `cpl_funding_config`; the
// renderer overlays that + a per-browser what-if scenario and computes every
// dollar live. NOT part of the daily cron.
//
// 2026-07-06 policy defaults (all Chancellor-editable in-tab): `disbursement`
// (even|frontload — front-load pulls the full window into Year 1 with
// roll-forward), pool.floor_window (minimum viable per-college window
// allocation, waterfall-funded within the pool), pool.cap_window (the
// mirror-image per-college window CEILING — Sam, 2026-08-22, default $400K;
// 0 disables it. Floor and ceiling are solved TOGETHER, so releasing a capped
// college's excess can legitimately lift a college back off the floor),
// and participation_deadline (baseline-eligibility opt-in date).
//
// 2026-08-23 — THE NONCREDIT LANE BECAME A BOUNDED ALLOCATION (Sam). It was a
// flat FTES split of the $1,000,000 carve-out among 4 feeder campuses; it is now
// the same clamp the credit pool uses, over every institution with enough
// noncredit FTES to clear an entry threshold. Three dials, all editable in-tab
// exactly like the credit pair: `pool.nc_threshold_ftes` (500 — who is in the
// lane at all), `pool.nc_floor_window` ($25,000) and `pool.nc_cap_window`
// ($100,000; 0 disables). At the defaults that is 33 institutions — 30 credit
// colleges with noncredit programs plus the 3 standalone ones — because
// noncredit is 111 institutions system-wide, not 4: 108 of the 115 college rows
// carry noncredit FTES. The EARNING side still counts only what originates from
// a noncredit landing page; FTES is the SIZE basis, not the metric. The per-college
// `rural` flags (DRAFT roster = the 13 federally-rural CCCs) are CONTEXT ONLY
// since 2026-08-22 — the carve-out they used to fund is retired (see below).
//
// 2026-07-30 — THE SEPT-2026 BOG BUDGET AMENDMENT IS NOW THE AUTHORITY for the
// $35M pool lines (Sam's ruling; source `20260729_CPL_Amendment_Sep_BOG.xlsx`,
// Sept 2026 BOG / Oct 2026 RCCD agenda). Its own split is two lines —
// `College CPL Outcomes Awards (CO) $26,040,308` (= $25,240,308 to institutions
// + $800,000 CO staff, 2.0 FTE × 2 yrs) and `CPL Projects (CO & RCCD)
// $8,959,692` — and it names NO noncredit or rural line. Sam's call: the
// $25,240,308 institution total governs, and the two $1M policy earmarks are
// carved FROM INSIDE it rather than riding on top:
//
//   $35,000,000 one-time
//   − $  800,000  CO staff (2.0 FTE × 2 yrs)          ← amendment
//   − $8,959,692  CPL Projects & Innovation           ← amendment
//   = $25,240,308  TO INSTITUTIONS                    ← amendment, ties to the penny
//   − $1,000,000  noncredit feeder carve-out          ← carved from inside
//   = $24,240,308  main proportional pool, 115 colleges, $175K floor
//
// So the college pool is $24,240,308 and the 4 noncredit campuses keep their own
// $1M rather than joining the proportional split.
//
// 2026-08-22 — THE RURAL CARVE-OUT IS RETIRED (Sam). It was a $1,000,000
// guaranteed earmark split 13 ways ($76,923 each) that funded a rural college's
// own minimum first and rode on top above it. Measured against the floor +
// ceiling now in the model, it was redundant for TEN of the 13 (they sit at the
// minimum, which funds them either way) and a bonus for three. Dropping it at
// the old $150K floor would have moved $88,594 from three rural colleges to the
// LARGEST non-rural ones, so it was retired together with a floor raise to
// $175,000 — under which the 13 rural colleges receive $2,275,000 between them,
// $236,406 MORE than the carve-out ever delivered. The per-college `rural` flags
// and `rural_source` stay as CONTEXT (the table still marks them); they no
// longer move a dollar.
// `remaining_2025_26` is likewise the amendment's $9,040,308 (the $15M view's
// N2N residual then computes to the amendment's exact $59,692).
//
// ⚠ Two ERRORS in that workbook, reported to Sam 2026-07-30 — do NOT copy them
// forward: (1) its "Total All CPL Initiative Funding $74,000,000" double-counts
// the $8,959,692 project slice (it sums $35M + the $18M project subtotal + $21M
// ongoing); the true total is $35M + $15M + $21M = $71,000,000. (2) its header
// "Max Award $665,971" is a digit transposition of $665,791, which is the max
// when only the 115 COLLEGES share $25,240,308 — while its "Avg Award $212,103"
// is $25,240,308 ÷ 119. Under this file's model the correct figures are
// avg $210,785 / min $150,000 / max $623,871.
//
// To refresh the headcount vintage: edit the `colleges` headcounts + SYSTEM
// total here directly (a rare modeling decision), keep headcount_pct in sync,
// and bump model_version. The prior builder lives in git history if a full
// workbook re-derive is ever needed again.
window.CPL_FUNDING = {
 "model_version": "2026-07-30.1",
 "source": "Sept-2026 BOG budget amendment (20260729_CPL_Amendment_Sep_BOG.xlsx) · MIS annual headcount (2025-26 update, 2026-07-03)",
 "headcount_label": "2025-2026 MIS ANNUAL HEADCOUNT (refreshed 2026-07-31; 10 colleges not in that pull carry their prior vintage)",
 "headcount_source": {
  "name": "CCCCO MIS DataMart — Annual/Term Student Count",
  "url": "https://datamart.cccco.edu/Students/Student_Headcount_Term_Annual.aspx",
  "selection": "Collegewide Search"
 },
 "pool": {
  "remaining_2025_26": 9040308.0,
  "one_time_2026_27": 35000000.0,
  "admin_cost": 800000.0,
  "admin_cost_label": "CO STAFF — 2.0 FTE × 2 YRS",
  "scaling_projects_tech": 8959692.0,
  "college_funding_before_feeder": 25240308.0,
  "college_funding_before_feeder_label": "AVAILABLE COLLEGE FUNDING (before noncredit carve-out)",
  "feeder_carveout": 1000000.0,
  "feeder_carveout_label": "NONCREDIT SUPPORT (carve-out)",
  "floor_window": 175000.0,
  "floor_window_label": "MINIMUM VIABLE ALLOCATION (per college, window floor)",
  "cap_window": 400000.0,
  "cap_window_label": "MAXIMUM ALLOCATION (per college, window ceiling)",
  "nc_threshold_ftes": 500.0,
  "nc_threshold_ftes_label": "NONCREDIT ENTRY THRESHOLD (annual noncredit FTES)",
  "nc_floor_window": 25000.0,
  "nc_floor_window_label": "NONCREDIT MINIMUM (per institution, window floor)",
  "nc_cap_window": 100000.0,
  "nc_cap_window_label": "NONCREDIT MAXIMUM (per institution, window ceiling)",
  "ccc_headcount": 2258784,
  "ftes_rate_2026_27": 5649.63,
  "ftes_rate_label": "2026-27 credit FTES reimbursement rate (SCFF base)"
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
    "factor": 1.0,
    "metric": "Headcount of students eligible for at least one course offered through CPL",
    "unit": "headcount",
    "target_rate": 0.05
   },
   {
    "key": "p2",
    "label": "Priority 2",
    "description": "Increase college access through CPL.",
    "share": 0.42,
    "factor": 1.0,
    "metric": "Headcount of students with transcribed CPL credit for at least one course.",
    "unit": "headcount",
    "target_rate": 0.06
   },
   {
    "key": "p3",
    "label": "Priority 3",
    "description": "Increase CCC CPL capacity, visibility, documentability, interoperability, mobility.",
    "share": 0.28,
    "factor": 1.0,
    "metric": "Headcount of students with transcribed Credit from either CPL Student Portal or CPL Landing Page",
    "unit": "headcount",
    "target_rate": 0.046666666
   }
  ],
  "2": [
   {
    "key": "p1",
    "label": "Priority 1",
    "description": "Increase CCC certificate or degree completion through CPL awards.",
    "share": 0.3,
    "factor": 1.0,
    "metric": "Units of Transcribed CPL",
    "unit": "ftes"
   },
   {
    "key": "p2",
    "label": "Priority 2",
    "description": "Increase college access through CPL.",
    "share": 0.42,
    "factor": 1.0,
    "metric": "Headcount with Completion and 3+ Transcribed CPL Units",
    "unit": "headcount",
    "target_rate": 0.06
   },
   {
    "key": "p3",
    "label": "Priority 3",
    "description": "Increase CCC CPL capacity, visibility, documentability, interoperability, mobility.",
    "share": 0.28,
    "factor": 1.0,
    "metric": "Headcount with CPL Matched in MAP and MIS",
    "unit": "headcount",
    "target_rate": 0.046666666
   }
  ]
 },
 "feeders": [
  {
   "name": "North Orange Continuing Education",
   "short": "NOCE",
   "headcount": 15560,
   "vintage": "2025-26",
   "noncredit_ftes": 3828.02,
   "ftes_vintage": "2025-26",
   "origin_scope": "district",
   "district": "North Orange County Community College District"
  },
  {
   "name": "San Diego College of Continuing Education",
   "short": "SD Cont. Ed",
   "headcount": 21561,
   "vintage": "2025-26",
   "noncredit_ftes": 9337.8,
   "ftes_vintage": "2025-26",
   "origin_scope": "district",
   "district": "San Diego Community College District"
  },
  {
   "name": "Mt. San Antonio College — Noncredit",
   "short": "Mt. SAC NC",
   "headcount": 35363,
   "vintage": "2022-23",
   "noncredit_ftes": 10829.3,
   "ftes_vintage": "2025-26",
   "nc_ftes_on_credit_row": "Mt San Antonio",
   "origin_scope": "district",
   "district": "Mt. San Antonio Community College District"
  },
  {
   "name": "Calbright College",
   "short": "Calbright",
   "headcount": 2484,
   "vintage": "2022-23",
   "noncredit_ftes": 21438.17,
   "noncredit_ftes_placeholder": 1000,
   "noncredit_ftes_placeholder_basis": "Sam's stand-in (2026-08-06), inside the peer-plausible band: the other three feeders run 0.25-0.43 noncredit FTES per student, which puts Calbright's 2,484 headcount at 611-1,076 FTES. The reported 21,438.17 implies 8.63 FTES per student, which is not physically possible (a full-time year is ~1.0) and most plausibly counts enrollments, not FTES. Pending Malone's verification.",
   "ftes_vintage": "2025-26",
   "origin_scope": "statewide"
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
  "headcount": 2517685,
  "headcount_pct": 1,
  "district": "CCCCO",
  "county": "CALIFORNIA",
  "working_adults": 5106199,
  "county_pop_pct": 1,
  "credit_ftes": 1069182.25
 },
 "colleges": [
  {
   "order": 1,
   "college": "Alameda",
   "headcount": 10596,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.004208628,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26",
   "credit_ftes": 3111.6,
   "noncredit_ftes": 43.38
  },
  {
   "order": 7,
   "college": "Berkeley City",
   "headcount": 11842,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.004703527,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26",
   "credit_ftes": 3833.0,
   "noncredit_ftes": 62.17
  },
  {
   "order": 14,
   "college": "Chabot",
   "headcount": 6946,
   "district": "Chabot-Las Positas Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.002758884,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26",
   "credit_ftes": 5862.2,
   "noncredit_ftes": 152.79
  },
  {
   "order": 54,
   "college": "Laney",
   "headcount": 15242,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.006053974,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26",
   "credit_ftes": 5604.23,
   "noncredit_ftes": 110.62
  },
  {
   "order": 55,
   "college": "Las Positas",
   "headcount": 4542,
   "district": "Chabot-Las Positas Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.001804038,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26",
   "credit_ftes": 4070.7,
   "noncredit_ftes": 72.14
  },
  {
   "order": 63,
   "college": "Merritt",
   "headcount": 11891,
   "district": "Peralta Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.00472299,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26",
   "credit_ftes": 3887.04,
   "noncredit_ftes": 17.33
  },
  {
   "order": 75,
   "college": "Ohlone",
   "headcount": 16476,
   "district": "Ohlone Community College District",
   "county": "Alameda",
   "working_adults": 167785,
   "headcount_pct": 0.006544107,
   "county_pop_pct": 0.03285908,
   "hc_vintage": "2025-26",
   "credit_ftes": 7585.0,
   "noncredit_ftes": 185.6
  },
  {
   "order": 8,
   "college": "Butte",
   "headcount": 17102,
   "district": "Butte-Glenn Community College District",
   "county": "Butte",
   "working_adults": 33835,
   "headcount_pct": 0.006792748,
   "county_pop_pct": 0.00662626,
   "hc_vintage": "2025-26",
   "credit_ftes": 10844.47,
   "noncredit_ftes": 428.83
  },
  {
   "order": 21,
   "college": "Contra Costa",
   "headcount": 12157,
   "district": "Contra Costa Community College District",
   "county": "Contra Costa",
   "working_adults": 146127,
   "headcount_pct": 0.004828642,
   "county_pop_pct": 0.028617569,
   "hc_vintage": "2025-26",
   "credit_ftes": 5369.82,
   "noncredit_ftes": 173.71
  },
  {
   "order": 30,
   "college": "Diablo Valley",
   "headcount": 27191,
   "district": "Contra Costa Community College District",
   "county": "Contra Costa",
   "working_adults": 146127,
   "headcount_pct": 0.010800001,
   "county_pop_pct": 0.028617569,
   "hc_vintage": "2025-26",
   "credit_ftes": 14707.67,
   "noncredit_ftes": 77.47
  },
  {
   "order": 58,
   "college": "Los Medanos",
   "headcount": 13096,
   "district": "Contra Costa Community College District",
   "county": "Contra Costa",
   "working_adults": 146127,
   "headcount_pct": 0.005201604,
   "county_pop_pct": 0.028617569,
   "hc_vintage": "2025-26",
   "credit_ftes": 7917.15,
   "noncredit_ftes": 60.67
  },
  {
   "order": 53,
   "college": "Lake Tahoe",
   "headcount": 9259,
   "district": "Lake Tahoe Community College District",
   "county": "El Dorado",
   "working_adults": 37623,
   "headcount_pct": 0.003677585,
   "county_pop_pct": 0.007368103,
   "hc_vintage": "2022-23",
   "credit_ftes": 3860.86,
   "noncredit_ftes": 63.71
  },
  {
   "order": 17,
   "college": "Clovis",
   "headcount": 19365,
   "district": "State Center Community College District",
   "county": "Fresno",
   "working_adults": 138085,
   "headcount_pct": 0.00769159,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26",
   "credit_ftes": 7590.0,
   "noncredit_ftes": 34.53
  },
  {
   "order": 37,
   "college": "Fresno City",
   "headcount": 45131,
   "district": "State Center Community College District",
   "county": "Fresno",
   "working_adults": 138085,
   "headcount_pct": 0.017925594,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26",
   "credit_ftes": 21916.87,
   "noncredit_ftes": 370.58
  },
  {
   "order": 83,
   "college": "Reedley College",
   "headcount": 18527,
   "district": "State Center Community College District",
   "county": "Fresno",
   "working_adults": 138085,
   "headcount_pct": 0.007358744,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26",
   "credit_ftes": 7356.47,
   "noncredit_ftes": 284.64
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
   "headcount_pct": 0.002618675,
   "county_pop_pct": 0.02704262,
   "hc_vintage": "2025-26",
   "credit_ftes": 2242.89,
   "noncredit_ftes": 84.72
  },
  {
   "order": 82,
   "college": "Redwoods",
   "rural": true,
   "headcount": 8454,
   "district": "Redwoods Community College District",
   "county": "Humboldt",
   "working_adults": 24550,
   "headcount_pct": 0.003357847,
   "county_pop_pct": 0.004807882,
   "hc_vintage": "2025-26",
   "credit_ftes": 4296.33,
   "noncredit_ftes": 148.34
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
   "headcount_pct": 0.004653084,
   "county_pop_pct": 0.004547414,
   "hc_vintage": "2022-23",
   "credit_ftes": 3966.9,
   "noncredit_ftes": 27.58
  },
  {
   "order": 5,
   "college": "Bakersfield",
   "headcount": 46171,
   "district": "Kern Community College District",
   "county": "Kern",
   "working_adults": 127203,
   "headcount_pct": 0.018338672,
   "county_pop_pct": 0.024911485,
   "hc_vintage": "2025-26",
   "credit_ftes": 21292.84,
   "noncredit_ftes": 315.39
  },
  {
   "order": 13,
   "college": "Cerro Coso",
   "rural": true,
   "headcount": 11498,
   "district": "Kern Community College District",
   "county": "Kern",
   "working_adults": 127203,
   "headcount_pct": 0.004566894,
   "county_pop_pct": 0.024911485,
   "hc_vintage": "2025-26",
   "credit_ftes": 3686.49,
   "noncredit_ftes": 29.54
  },
  {
   "order": 109,
   "college": "Taft",
   "rural": true,
   "headcount": 9297,
   "district": "West Kern Community College District",
   "county": "Kern",
   "working_adults": 127203,
   "headcount_pct": 0.003692678,
   "county_pop_pct": 0.024911485,
   "hc_vintage": "2025-26",
   "credit_ftes": 2434.52,
   "noncredit_ftes": 0
  },
  {
   "order": 113,
   "college": "West Hills Lemoore",
   "headcount": 8681,
   "district": "West Hills Community College District",
   "county": "Kings",
   "working_adults": 20828,
   "headcount_pct": 0.003448009,
   "county_pop_pct": 0.004078964,
   "hc_vintage": "2025-26",
   "credit_ftes": 3361.17,
   "noncredit_ftes": 243.72
  },
  {
   "order": 56,
   "college": "Lassen",
   "rural": true,
   "headcount": 3790,
   "district": "Lassen Community College District",
   "county": "Lassen",
   "working_adults": null,
   "headcount_pct": 0.001505351,
   "county_pop_pct": null,
   "hc_vintage": "2025-26",
   "credit_ftes": 1633.16,
   "noncredit_ftes": 60.76
  },
  {
   "order": 4,
   "college": "Antelope Valley",
   "headcount": 20105,
   "district": "Antelope Valley Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.00798551,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 11698.64,
   "noncredit_ftes": 115.67
  },
  {
   "order": 11,
   "college": "Canyons",
   "headcount": 38052,
   "district": "Santa Clarita Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.015113884,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 13528.6,
   "noncredit_ftes": 2022.5
  },
  {
   "order": 12,
   "college": "Cerritos",
   "headcount": 36129,
   "district": "Cerritos Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.014350087,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 17753.91,
   "noncredit_ftes": 640.59
  },
  {
   "order": 16,
   "college": "Citrus",
   "headcount": 17283,
   "district": "Citrus Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.00686464,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 9532.72,
   "noncredit_ftes": 225.61
  },
  {
   "order": 20,
   "college": "Compton",
   "headcount": 6097,
   "district": "Compton Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.002421669,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23",
   "credit_ftes": 2591.34,
   "noncredit_ftes": 31.21
  },
  {
   "order": 31,
   "college": "East LA",
   "headcount": 64167,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.025486508,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 19065.69,
   "noncredit_ftes": 1138.17
  },
  {
   "order": 32,
   "college": "El Camino",
   "headcount": 30575,
   "district": "El Camino Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.012144093,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2022-23",
   "credit_ftes": 12613.2,
   "noncredit_ftes": 1.54
  },
  {
   "order": 40,
   "college": "Glendale",
   "headcount": 24570,
   "district": "Glendale Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.009758965,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 10663.48,
   "noncredit_ftes": 2911.05
  },
  {
   "order": 46,
   "college": "LA City",
   "headcount": 30956,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.012295422,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 9609.71,
   "noncredit_ftes": 791.18
  },
  {
   "order": 47,
   "college": "LA Harbor",
   "headcount": 21001,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.008341393,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 6405.29,
   "noncredit_ftes": 96.94
  },
  {
   "order": 48,
   "college": "LA Mission",
   "headcount": 24234,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.009625509,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 6777.9,
   "noncredit_ftes": 693.02
  },
  {
   "order": 49,
   "college": "LA Pierce",
   "headcount": 31228,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.012403458,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 12216.86,
   "noncredit_ftes": 607.73
  },
  {
   "order": 50,
   "college": "LA Swest",
   "headcount": 12270,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.004873525,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 3008.91,
   "noncredit_ftes": 249.38
  },
  {
   "order": 51,
   "college": "LA Trade",
   "headcount": 23003,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.009136568,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 10570.39,
   "noncredit_ftes": 233.75
  },
  {
   "order": 52,
   "college": "LA Valley",
   "headcount": 32771,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.013016323,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 10920.37,
   "noncredit_ftes": 991.68
  },
  {
   "order": 57,
   "college": "Long Beach",
   "headcount": 38622,
   "district": "Long Beach Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.015340283,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 22535.85,
   "noncredit_ftes": 518.14
  },
  {
   "order": 70,
   "college": "Mt San Antonio",
   "headcount": 83727,
   "district": "Mt. San Antonio Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.03325555,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 26804.41,
   "noncredit_ftes": 10829.3
  },
  {
   "order": 80,
   "college": "Pasadena",
   "headcount": 41521,
   "district": "Pasadena Area Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.016491737,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 23347.4,
   "noncredit_ftes": 1470.35
  },
  {
   "order": 84,
   "college": "Rio Hondo",
   "headcount": 37194,
   "district": "Rio Hondo Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.014773095,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 11693.54,
   "noncredit_ftes": 1568.27
  },
  {
   "order": 99,
   "college": "Santa Monica",
   "headcount": 36714,
   "district": "Santa Monica Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.014582444,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 19453.51,
   "noncredit_ftes": 877.74
  },
  {
   "order": 114,
   "college": "West LA",
   "headcount": 21012,
   "district": "Los Angeles Community College District",
   "county": "Los Angeles",
   "working_adults": 1200796,
   "headcount_pct": 0.008345762,
   "county_pop_pct": 0.235164356,
   "hc_vintage": "2025-26",
   "credit_ftes": 6016.22,
   "noncredit_ftes": 234.7
  },
  {
   "order": 59,
   "college": "Madera",
   "headcount": 13744,
   "district": "State Center Community College District",
   "county": "Madera",
   "working_adults": 21685,
   "headcount_pct": 0.005458983,
   "county_pop_pct": 0.004246799,
   "hc_vintage": "2025-26",
   "credit_ftes": 4234.67,
   "noncredit_ftes": 46.54
  },
  {
   "order": 60,
   "college": "Marin",
   "headcount": 9827,
   "district": "Marin Community College District",
   "county": "Marin",
   "working_adults": 25654,
   "headcount_pct": 0.003903189,
   "county_pop_pct": 0.005024089,
   "hc_vintage": "2025-26",
   "credit_ftes": 3374.55,
   "noncredit_ftes": 366.48
  },
  {
   "order": 61,
   "college": "Mendocino",
   "headcount": 9259,
   "district": "Mendocino-Lake Community College District",
   "county": "Mendocino",
   "working_adults": 18778,
   "headcount_pct": 0.003677585,
   "county_pop_pct": 0.003677491,
   "hc_vintage": "2025-26",
   "credit_ftes": 3729.36,
   "noncredit_ftes": 145.91
  },
  {
   "order": 62,
   "college": "Merced",
   "headcount": 21722,
   "district": "Merced Community College District",
   "county": "Merced",
   "working_adults": 35277,
   "headcount_pct": 0.008627767,
   "county_pop_pct": 0.006908661,
   "hc_vintage": "2025-26",
   "credit_ftes": 11311.3,
   "noncredit_ftes": 508.8
  },
  {
   "order": 43,
   "college": "Hartnell",
   "headcount": 15185,
   "district": "Hartnell Community College District",
   "county": "Monterey",
   "working_adults": 44526,
   "headcount_pct": 0.006031334,
   "county_pop_pct": 0.008719989,
   "hc_vintage": "2025-26",
   "credit_ftes": 8301.22,
   "noncredit_ftes": 109.44
  },
  {
   "order": 67,
   "college": "Monterey",
   "headcount": 10816,
   "district": "Monterey Peninsula Community College District",
   "county": "Monterey",
   "working_adults": 44526,
   "headcount_pct": 0.00429601,
   "county_pop_pct": 0.008719989,
   "hc_vintage": "2025-26",
   "credit_ftes": 5681.07,
   "noncredit_ftes": 178.69
  },
  {
   "order": 72,
   "college": "Napa",
   "headcount": 7493,
   "district": "Napa Valley Community College District",
   "county": "Napa",
   "working_adults": 16949,
   "headcount_pct": 0.002976147,
   "county_pop_pct": 0.003319299,
   "hc_vintage": "2025-26",
   "credit_ftes": 3722.51,
   "noncredit_ftes": 29.33
  },
  {
   "order": 18,
   "college": "Coastline",
   "headcount": 20804,
   "district": "Coast Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.008263147,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26",
   "credit_ftes": 5342.65,
   "noncredit_ftes": 325.38
  },
  {
   "order": 27,
   "college": "Cypress",
   "headcount": 24055,
   "district": "North Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.009554412,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26",
   "credit_ftes": 12850.71,
   "noncredit_ftes": 41.62
  },
  {
   "order": 38,
   "college": "Fullerton",
   "headcount": 30857,
   "district": "North Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.0122561,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26",
   "credit_ftes": 15875.04,
   "noncredit_ftes": 0
  },
  {
   "order": 41,
   "college": "Golden West",
   "headcount": 22026,
   "district": "Coast Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.008748513,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26",
   "credit_ftes": 8832.52,
   "noncredit_ftes": 242.16
  },
  {
   "order": 45,
   "college": "Irvine",
   "headcount": 20375,
   "district": "South Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.008092752,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2022-23",
   "credit_ftes": 5754.09,
   "noncredit_ftes": 901.97
  },
  {
   "order": 76,
   "college": "Orange Coast",
   "headcount": 24967,
   "district": "Coast Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.00991665,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26",
   "credit_ftes": 13996.65,
   "noncredit_ftes": 256.49
  },
  {
   "order": 87,
   "college": "Saddleback",
   "headcount": 36459,
   "district": "South Orange County Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.01448116,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2022-23",
   "credit_ftes": 8580.18,
   "noncredit_ftes": 2890.53
  },
  {
   "order": 97,
   "college": "Santa Ana",
   "headcount": 77076,
   "district": "Rancho Santiago Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.030613838,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26",
   "credit_ftes": 16043.58,
   "noncredit_ftes": 7817.68
  },
  {
   "order": 101,
   "college": "Santiago Canyon",
   "headcount": 33777,
   "district": "Rancho Santiago Community College District",
   "county": "Orange",
   "working_adults": 399262,
   "headcount_pct": 0.013415896,
   "county_pop_pct": 0.078191626,
   "hc_vintage": "2025-26",
   "credit_ftes": 7047.05,
   "noncredit_ftes": 3577.32
  },
  {
   "order": 104,
   "college": "Sierra",
   "headcount": 30588,
   "district": "Sierra Joint Community College District",
   "county": "Placer",
   "working_adults": 71637,
   "headcount_pct": 0.012149256,
   "county_pop_pct": 0.014029418,
   "hc_vintage": "2025-26",
   "credit_ftes": 14544.06,
   "noncredit_ftes": 294.98
  },
  {
   "order": 34,
   "college": "Feather River",
   "rural": true,
   "headcount": 2739,
   "district": "Feather River Community College District",
   "county": "Plumas",
   "working_adults": null,
   "headcount_pct": 0.001087904,
   "county_pop_pct": null,
   "hc_vintage": "2022-23",
   "credit_ftes": 1098.21,
   "noncredit_ftes": 25.62
  },
  {
   "order": 29,
   "college": "Desert",
   "headcount": 21112,
   "district": "Desert Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.008385481,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2025-26",
   "credit_ftes": 8658.49,
   "noncredit_ftes": 907.26
  },
  {
   "order": 69,
   "college": "Moreno Valley",
   "headcount": 21686,
   "district": "Riverside Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.008613468,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2025-26",
   "credit_ftes": 9743.03,
   "noncredit_ftes": 62.84
  },
  {
   "order": 71,
   "college": "Mt. San Jacinto",
   "headcount": 25950,
   "district": "Mt. San Jacinto Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.010307088,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2025-26",
   "credit_ftes": 13978.27,
   "noncredit_ftes": 319.32
  },
  {
   "order": 73,
   "college": "Norco College",
   "headcount": 20731,
   "district": "Riverside Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.008234152,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2025-26",
   "credit_ftes": 8008.4,
   "noncredit_ftes": 100.91
  },
  {
   "order": 78,
   "college": "Palo Verde",
   "rural": true,
   "headcount": 6472,
   "district": "Palo Verde Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.002570615,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2022-23",
   "credit_ftes": 1414.04,
   "noncredit_ftes": 10.76
  },
  {
   "order": 85,
   "college": "Riverside",
   "headcount": 33234,
   "district": "Riverside Community College District",
   "county": "Riverside",
   "working_adults": 378406,
   "headcount_pct": 0.013200222,
   "county_pop_pct": 0.074107178,
   "hc_vintage": "2025-26",
   "credit_ftes": 18650.89,
   "noncredit_ftes": 208.81
  },
  {
   "order": 3,
   "college": "American River",
   "headcount": 49251,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.019562018,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26",
   "credit_ftes": 20744.56,
   "noncredit_ftes": 0
  },
  {
   "order": 23,
   "college": "Cosumnes River",
   "headcount": 27545,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.010940606,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26",
   "credit_ftes": 11359.02,
   "noncredit_ftes": 0
  },
  {
   "order": 35,
   "college": "Folsom Lake",
   "headcount": 19697,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.007823457,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26",
   "credit_ftes": 7835.21,
   "noncredit_ftes": 3.7
  },
  {
   "order": 86,
   "college": "Sacramento City",
   "headcount": 34915,
   "district": "Los Rios Community College District",
   "county": "Sacramento",
   "working_adults": 257597,
   "headcount_pct": 0.013867898,
   "county_pop_pct": 0.050447897,
   "hc_vintage": "2025-26",
   "credit_ftes": 14386.74,
   "noncredit_ftes": 1.51
  },
  {
   "order": 6,
   "college": "Barstow",
   "rural": true,
   "headcount": 5091,
   "district": "Barstow Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.002022096,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26",
   "credit_ftes": 3019.15,
   "noncredit_ftes": 43.22
  },
  {
   "order": 15,
   "college": "Chaffey",
   "headcount": 36600,
   "district": "Chaffey Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.014537164,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26",
   "credit_ftes": 17951.0,
   "noncredit_ftes": 229.53
  },
  {
   "order": 22,
   "college": "Copper Mountain",
   "rural": true,
   "headcount": 4003,
   "district": "Copper Mountain Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.001589953,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26",
   "credit_ftes": 1687.97,
   "noncredit_ftes": 66.95
  },
  {
   "order": 24,
   "college": "Crafton Hills",
   "headcount": 10972,
   "district": "San Bernardino Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.004357972,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26",
   "credit_ftes": 5038.88,
   "noncredit_ftes": 57.39
  },
  {
   "order": 88,
   "college": "San Bernardino",
   "headcount": 23737,
   "district": "San Bernardino Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.009428106,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26",
   "credit_ftes": 11992.67,
   "noncredit_ftes": 274.36
  },
  {
   "order": 111,
   "college": "Victor Valley",
   "headcount": 25427,
   "district": "Victor Valley Community College District",
   "county": "San Bernardino",
   "working_adults": 311528,
   "headcount_pct": 0.010099357,
   "county_pop_pct": 0.061009765,
   "hc_vintage": "2025-26",
   "credit_ftes": 13946.87,
   "noncredit_ftes": 621.33
  },
  {
   "order": 26,
   "college": "Cuyamaca",
   "headcount": 14754,
   "district": "Grossmont-Cuyamaca Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.005860145,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 4901.4,
   "noncredit_ftes": 2.89
  },
  {
   "order": 42,
   "college": "Grossmont",
   "headcount": 22185,
   "district": "Grossmont-Cuyamaca Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.008811666,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 9099.42,
   "noncredit_ftes": 95.68
  },
  {
   "order": 64,
   "college": "MiraCosta",
   "headcount": 22486,
   "district": "MiraCosta Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.008931221,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 9580.73,
   "noncredit_ftes": 1046.76
  },
  {
   "order": 79,
   "college": "Palomar",
   "headcount": 30861,
   "district": "Palomar Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.012257689,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 15488.86,
   "noncredit_ftes": 476.72
  },
  {
   "order": 90,
   "college": "San Diego City",
   "headcount": 22039,
   "district": "San Diego Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.008753676,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 8921.87,
   "noncredit_ftes": 0
  },
  {
   "order": 91,
   "college": "San Diego Mesa",
   "headcount": 31776,
   "district": "San Diego Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.012621118,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 16732.18,
   "noncredit_ftes": 0
  },
  {
   "order": 92,
   "college": "San Diego Miramar",
   "headcount": 24302,
   "district": "San Diego Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.009652518,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 11276.51,
   "noncredit_ftes": 0
  },
  {
   "order": 108,
   "college": "Southwestern",
   "headcount": 29302,
   "district": "Southwestern Community College District",
   "county": "San Diego",
   "working_adults": 468583,
   "headcount_pct": 0.011638469,
   "county_pop_pct": 0.091767477,
   "hc_vintage": "2025-26",
   "credit_ftes": 16346.82,
   "noncredit_ftes": 230.43
  },
  {
   "order": 93,
   "college": "San Francisco",
   "headcount": 42781,
   "district": "San Francisco Community College District",
   "county": "San Francisco",
   "working_adults": 72403,
   "headcount_pct": 0.016992197,
   "county_pop_pct": 0.014179432,
   "hc_vintage": "2025-26",
   "credit_ftes": 12951.79,
   "noncredit_ftes": 3896.56
  },
  {
   "order": 94,
   "college": "San Joaquin Delta",
   "headcount": 32068,
   "district": "San Joaquin Delta Community College District",
   "county": "San Joaquin",
   "working_adults": 106683,
   "headcount_pct": 0.012737098,
   "county_pop_pct": 0.02089284,
   "hc_vintage": "2025-26",
   "credit_ftes": 17034.4,
   "noncredit_ftes": 183.06
  },
  {
   "order": 25,
   "college": "Cuesta",
   "headcount": 18500,
   "district": "San Luis Obispo County Community College District",
   "county": "San Luis Obispo",
   "working_adults": 45711,
   "headcount_pct": 0.00734802,
   "county_pop_pct": 0.00895206,
   "hc_vintage": "2025-26",
   "credit_ftes": 7616.77,
   "noncredit_ftes": 510.61
  },
  {
   "order": 10,
   "college": "Canada",
   "headcount": 11891,
   "district": "San Mateo County Community College District",
   "county": "San Mateo",
   "working_adults": 78896,
   "headcount_pct": 0.00472299,
   "county_pop_pct": 0.015451023,
   "hc_vintage": "2025-26",
   "credit_ftes": 4631.23,
   "noncredit_ftes": 1.43
  },
  {
   "order": 96,
   "college": "San Mateo",
   "headcount": 15589,
   "district": "San Mateo County Community College District",
   "county": "San Mateo",
   "working_adults": 78896,
   "headcount_pct": 0.006191799,
   "county_pop_pct": 0.015451023,
   "hc_vintage": "2025-26",
   "credit_ftes": 8117.66,
   "noncredit_ftes": 0.26
  },
  {
   "order": 106,
   "college": "Skyline",
   "headcount": 18042,
   "district": "San Mateo County Community College District",
   "county": "San Mateo",
   "working_adults": 78896,
   "headcount_pct": 0.007166107,
   "county_pop_pct": 0.015451023,
   "hc_vintage": "2025-26",
   "credit_ftes": 9029.24,
   "noncredit_ftes": 1.04
  },
  {
   "order": 2,
   "college": "Allan Hancock",
   "headcount": 21256,
   "district": "Allan Hancock Joint Community College District",
   "county": "Santa Barbara",
   "working_adults": 54159,
   "headcount_pct": 0.008442677,
   "county_pop_pct": 0.01060652,
   "hc_vintage": "2025-26",
   "credit_ftes": 8995.56,
   "noncredit_ftes": 764.94
  },
  {
   "order": 98,
   "college": "Santa Barbara",
   "headcount": 25675,
   "district": "Santa Barbara Community College District",
   "county": "Santa Barbara",
   "working_adults": 54159,
   "headcount_pct": 0.01019786,
   "county_pop_pct": 0.01060652,
   "hc_vintage": "2025-26",
   "credit_ftes": 10973.65,
   "noncredit_ftes": 1232.6
  },
  {
   "order": 28,
   "college": "De Anza",
   "display": "DeAnza",
   "headcount": 29664,
   "district": "Foothill-De Anza Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.011782252,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26",
   "credit_ftes": 16628.07,
   "noncredit_ftes": 364.64,
   "quarter": true
  },
  {
   "order": 33,
   "college": "Evergreen Valley",
   "headcount": 13401,
   "district": "San Jose-Evergreen Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.005322747,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2022-23",
   "credit_ftes": 3189.31,
   "noncredit_ftes": 61.25
  },
  {
   "order": 36,
   "college": "Foothill",
   "headcount": 25542,
   "district": "Foothill-De Anza Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.010145034,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26",
   "credit_ftes": 11018.64,
   "noncredit_ftes": 242.66,
   "quarter": true
  },
  {
   "order": 39,
   "college": "Gavilan",
   "headcount": 10797,
   "district": "Gavilan Joint Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.004288463,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26",
   "credit_ftes": 5026.01,
   "noncredit_ftes": 1591.4
  },
  {
   "order": 65,
   "college": "Mission",
   "headcount": 12685,
   "district": "West Valley-Mission Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.005038359,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26",
   "credit_ftes": 5128.5,
   "noncredit_ftes": 254.1
  },
  {
   "order": 95,
   "college": "San Jose City",
   "headcount": 13032,
   "district": "San Jose-Evergreen Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.005176184,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2022-23",
   "credit_ftes": 2722.08,
   "noncredit_ftes": 110.77
  },
  {
   "order": 115,
   "college": "West Valley",
   "headcount": 16147,
   "district": "West Valley-Mission Community College District",
   "county": "Santa Clara",
   "working_adults": 171522,
   "headcount_pct": 0.006413431,
   "county_pop_pct": 0.033590935,
   "hc_vintage": "2025-26",
   "credit_ftes": 6222.71,
   "noncredit_ftes": 924.09
  },
  {
   "order": 9,
   "college": "Cabrillo",
   "headcount": 15882,
   "district": "Cabrillo Community College District",
   "county": "Santa Cruz",
   "working_adults": 36341,
   "headcount_pct": 0.006308176,
   "county_pop_pct": 0.007117036,
   "hc_vintage": "2025-26",
   "credit_ftes": 7616.71,
   "noncredit_ftes": 782.32
  },
  {
   "order": 103,
   "college": "Shasta",
   "rural": true,
   "headcount": 15234,
   "district": "Shasta-Tehama-Trinity Joint Community College District",
   "county": "Shasta",
   "working_adults": 40002,
   "headcount_pct": 0.006050797,
   "county_pop_pct": 0.007834007,
   "hc_vintage": "2025-26",
   "credit_ftes": 7241.94,
   "noncredit_ftes": 132.67
  },
  {
   "order": 105,
   "college": "Siskiyous",
   "rural": true,
   "headcount": 4274,
   "district": "Siskiyou Joint Community College District",
   "county": "Siskiyou",
   "working_adults": null,
   "headcount_pct": 0.001697591,
   "county_pop_pct": null,
   "hc_vintage": "2025-26",
   "credit_ftes": 1725.39,
   "noncredit_ftes": 328.56
  },
  {
   "order": 107,
   "college": "Solano",
   "headcount": 13302,
   "district": "Solano County Community College District",
   "county": "Solano",
   "working_adults": 77534,
   "headcount_pct": 0.005283425,
   "county_pop_pct": 0.015184289,
   "hc_vintage": "2025-26",
   "credit_ftes": 7328.71,
   "noncredit_ftes": 8.43
  },
  {
   "order": 100,
   "college": "Santa Rosa",
   "headcount": 34538,
   "district": "Sonoma County Junior College District",
   "county": "Sonoma",
   "working_adults": 82997,
   "headcount_pct": 0.013718158,
   "county_pop_pct": 0.016254165,
   "hc_vintage": "2025-26",
   "credit_ftes": 13640.19,
   "noncredit_ftes": 3009.62
  },
  {
   "order": 66,
   "college": "Modesto",
   "headcount": 27271,
   "district": "Yosemite Community College District",
   "county": "Stanislaus",
   "working_adults": 81075,
   "headcount_pct": 0.010831776,
   "county_pop_pct": 0.01587776,
   "hc_vintage": "2025-26",
   "credit_ftes": 15549.98,
   "noncredit_ftes": 924.67
  },
  {
   "order": 81,
   "college": "Porterville",
   "headcount": 8143,
   "district": "Kern Community College District",
   "county": "Tulare",
   "working_adults": 63560,
   "headcount_pct": 0.00323432,
   "county_pop_pct": 0.012447615,
   "hc_vintage": "2025-26",
   "credit_ftes": 3558.3,
   "noncredit_ftes": 45.46
  },
  {
   "order": 102,
   "college": "Sequoias",
   "headcount": 19888,
   "district": "Sequoias Community College District",
   "county": "Tulare",
   "working_adults": 63560,
   "headcount_pct": 0.00789932,
   "county_pop_pct": 0.012447615,
   "hc_vintage": "2025-26",
   "credit_ftes": 11473.97,
   "noncredit_ftes": 224.92
  },
  {
   "order": 19,
   "college": "Columbia",
   "rural": true,
   "headcount": 4795,
   "district": "Yosemite Community College District",
   "county": "Tuolumne",
   "working_adults": null,
   "headcount_pct": 0.001904527,
   "county_pop_pct": null,
   "hc_vintage": "2025-26",
   "credit_ftes": 2077.98,
   "noncredit_ftes": 36.6
  },
  {
   "order": 68,
   "college": "Moorpark",
   "headcount": 24350,
   "district": "Ventura County Community College District",
   "county": "Ventura",
   "working_adults": 111435,
   "headcount_pct": 0.009671583,
   "county_pop_pct": 0.021823474,
   "hc_vintage": "2025-26",
   "credit_ftes": 12728.22,
   "noncredit_ftes": 14.6
  },
  {
   "order": 77,
   "college": "Oxnard",
   "headcount": 12835,
   "district": "Ventura County Community College District",
   "county": "Ventura",
   "working_adults": 111435,
   "headcount_pct": 0.005097937,
   "county_pop_pct": 0.021823474,
   "hc_vintage": "2025-26",
   "credit_ftes": 5628.96,
   "noncredit_ftes": 74.42
  },
  {
   "order": 110,
   "college": "Ventura",
   "headcount": 19290,
   "district": "Ventura County Community College District",
   "county": "Ventura",
   "working_adults": 111435,
   "headcount_pct": 0.0076618,
   "county_pop_pct": 0.021823474,
   "hc_vintage": "2025-26",
   "credit_ftes": 9996.28,
   "noncredit_ftes": 150.72
  },
  {
   "order": 116,
   "college": "Woodland",
   "headcount": 7323,
   "district": "Yuba Community College District",
   "county": "Yolo",
   "working_adults": 25523,
   "headcount_pct": 0.002908624,
   "county_pop_pct": 0.004998434,
   "hc_vintage": "2025-26",
   "credit_ftes": 2589.18,
   "noncredit_ftes": 53.07
  },
  {
   "order": 117,
   "college": "Yuba",
   "headcount": 10800,
   "district": "Yuba Community College District",
   "county": "Yuba",
   "working_adults": 14117,
   "headcount_pct": 0.004289655,
   "county_pop_pct": 0.002764679,
   "hc_vintage": "2025-26",
   "credit_ftes": 4419.1,
   "noncredit_ftes": 81.09
  }
 ],
 "footnotes": [
  "*Survey did not estimate counties <65K in population",
  "Source: U.S. Census 2022 American Community Survey: https://data.census.gov/table/ACSDT1Y2022.B16010?q=Educational%20Attainment%20by%20employment%20status%20and%20state&g=040XX00US06,06$0500000&y=2022&moe=false"
 ],
 "ftes_label": "2025-2026 CCCCO DataMart Annual FTES (credit); noncredit FTES carried separately and used only for the noncredit-feeder lane",
 "ftes_source": {
  "name": "CCCCO MIS DataMart — Annual FTES Summary",
  "url": "https://datamart.cccco.edu/Outcomes/FTES_Summary.aspx",
  "selection": "Annual 2025-2026, by college"
 },
 "allocation_basis": "ftes",
 "ftes_vintage": "2025-26",
 "ftes_factors": {
  "contact_hours_per_ftes": 525,
  "contact_hours_per_unit_semester": 17.5,
  "contact_hours_per_unit_quarter": 11.67,
  "note": "units per FTES is DERIVED: 525/17.5 = 30 semester units, 525/11.67 = 45 quarter units. Do not store the quotient."
 }
};
