// CPL Implementation Funding tab — adversarial-review fixes, the Distributions sub-view, and the pool authority (Parts O–R).
//
// PR4's three adversarial-review defects, the current-college display rename, the
// $15M ESS Distributions sub-view, and the Sept-2026 BOG budget amendment as the
// pool AUTHORITY (conservation across the carve-outs).
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_pool.test.js`).
const fs = require("fs");
const {
  check,
  freshDom,
  boot,
  D,
  dataSrc,
  consumerSrc,
  finish,
} = require("./lib/cpl_funding_harness.js");

// Part O — PR4 adversarial-review fixes (SkyHighness, 2026-07-28): three defects
// the diverse-lens skeptics caught before merge. O1 = the per-priority DRILL-IN
// earned line was the third earned site and still flexed the guaranteed rural
// (contradicting the cell/row/pool). O2 = the cell hover claimed "funds the floor
// first" for the 3 rural colleges already above the floor. O3 = an empty rural
// roster stranded the $1M carve-out.
// ─────────────────────────────────────────────────────────────────────────────
{
  // O1 — drill-in per-priority earned includes the guaranteed rural in FULL.
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-28", suppress_below: 5,
    statewide: { p3: 999999 }, colleges: {}, unmatched: {} };   // rural colleges post nothing
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": { "2": { metric: "Headcount with CPL Matched in MAP and MIS" } } } });
  T.render();
  const sh = window.CPL_FUNDING.colleges.find(function (c) { return c.college === "Shasta"; });
  window.eval('CPL_FUNDING_TAB._state.open["c:' + sh.order + '"] = true;');
  T.render();
  const detail = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-detail")).find(function (tr) { return /Shasta/.test(tr.textContent) || tr.textContent.indexOf("Rural allowance") !== -1; });
  check("O1: a rural college's drill-in earned lines disclose the guaranteed rural",
    !!detail && detail.textContent.indexOf("guaranteed rural") !== -1);
  // Sum the drill-in per-priority earned dollars for the viewed year; it must equal
  // the row's Year-1 earned (ey1) — the rural is added in full, not dropped to $0.
  const earnedNums = (detail.textContent.match(/earned:\s*\$([\d,]+)/g) || [])
    .map(function (s) { return Number(s.replace(/[^\d]/g, "")); });
  const a = T._alloc("Shasta");
  const sumDrill = earnedNums.reduce(function (s, n) { return s + n; }, 0);
  check("O1: Σ drill-in earned (viewed year) = the row's Year-1 earned (guaranteed rural not dropped)",
    earnedNums.length === 3 && Math.abs(sumDrill - a.ey1) < 3);
  // P1 (any-transcribed) is measurable + Shasta posted nothing → status none → the
  // MAIN part earns $0, so the drill-in earned must equal exactly its guaranteed
  // rural slice (a.p1 × rural_w / w). Before the fix this line showed $0.
  check("O1: a none-status priority's drill-in earned = its guaranteed rural slice, not $0 (the bug)",
    earnedNums[0] > 1000 && Math.abs(earnedNums[0] - (a.p1 * a.rural_w / a.w)) < 50);
  delete window.CPL_FUNDING_PERF;
}
{
  // O2 — the cell hover only claims floor-funding when floorFill actually happens.
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const rows = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const copperTitle = (rows.find(function (tr) { return /Copper Mountain/.test(tr.textContent); })
    .querySelector("td.cf-prio").getAttribute("title") || "");           // floored → combined reason
  // Whether an above-floor rural college EXISTS depends on the pool size (none do
  // at the Sept-2026 amendment pool), so assert the defect O2 actually fixed: the
  // hover's floor-funding claim matches each rural college's REAL floor-fill state.
  const mdlO2 = T._model();
  const mismatched = D.colleges.filter(function (c) { return c.rural; }).filter(function (c) {
    const tr = rows.find(function (r) { return r.textContent.indexOf(c.display || c.college) !== -1; });
    const title = tr ? (tr.querySelector("td.cf-prio").getAttribute("title") || "") : "";
    const fills = Math.max(0, mdlO2.floor - (mdlO2.W[c.college] || 0)) > 0.5;
    const claimsFloor = /funds this college.{0,3}s floor first/.test(title) || /funded partly by/.test(title);
    const claimsOnTop = /already meets the floor/.test(title);
    return fills ? (!claimsFloor || claimsOnTop) : (!claimsOnTop || claimsFloor);
  }).map(function (c) { return c.college; });
  check("O2: every rural college's hover matches its ACTUAL floor-fill state (no false 'funds the floor first')",
    D.colleges.filter(function (c) { return c.rural; }).length === 13 && mismatched.length === 0);
  check("O2: a floored rural college's hover states the floor is funded partly by its rural allowance",
    /funded partly by/.test(copperTitle) && /rural allowance/.test(copperTitle));
  // O2b — the SYSTEM row hover must not crash / must not carry per-college reasons.
  const sysCell = doc.querySelector("#cplFundTable tr.cplfund-systemrow td.cf-prio");
  check("O2b: the SYSTEM row per-priority cell renders (no null-c crash) at the base rate",
    !!sysCell && /statewide base rate|statewide base/.test(sysCell.getAttribute("title") || ""));
}
{
  // O3 — clearing the whole rural roster returns the $1M to the main pool (no stranding).
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const D = window.CPL_FUNDING;
  const wholePool = (D.pool.one_time_2026_27 -
    D.pool.admin_cost - D.pool.scaling_projects_tech) - D.pool.feeder_carveout;   // 26.24M
  const clear = {}; D.colleges.filter(function (c) { return c.rural; }).forEach(function (c) { clear[c.college] = false; });
  T._setScenario({ ruralOverrides: clear });
  T.render();
  check("O3: with an empty rural roster, netCollege reclaims the carve-out (= the whole college pool)",
    Math.abs(T._netCollege() - wholePool) < 1);
  const sumTotals = D.colleges.reduce(function (s, c) { return s + T._alloc(c.college).total; }, 0);
  check("O3: Σ college totals = the whole pool — the $1M carve-out is not stranded",
    Math.abs(sumTotals - wholePool) < 5);
  // And the normal roster still distributes exactly the carve-out (no change).
  T._setScenario({});
  T.render();
  check("O3: default roster unchanged — netCollege still = main pool (carve-out distributed)",
    Math.abs(T._netCollege() - (wholePool - D.pool.rural_carveout)) < 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part P — display rename (SkyHighness, 2026-07-29): show the current college
// names ("Coalinga College", "Imperial Valley College") while keeping the MIS
// short name as the JOIN KEY (perf actuals / short-name / rural / note lookups).
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const D = window.CPL_FUNDING;
  check("P: data carries display overrides for the 2 renamed colleges",
    D.colleges.find(function (c) { return c.college === "West Hills Coalinga"; }).display === "Coalinga College" &&
    D.colleges.find(function (c) { return c.college === "Imperial"; }).display === "Imperial Valley College");
  // The join KEY is unchanged — alloc/perf still resolve by the MIS short name.
  check("P: the join key still resolves (alloc by the MIS short name)",
    T._alloc("West Hills Coalinga").total > 0 && T._alloc("Imperial").total > 0);
  // The rendered table shows the DISPLAY name, not the old short key.
  const rows = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const coRow = rows.find(function (r) { return /Coalinga College/.test(r.textContent); });
  check("P: the table row shows 'Coalinga College' (display), not 'West Hills Coalinga'",
    !!coRow && coRow.textContent.indexOf("West Hills Coalinga") === -1);
  check("P: the table row shows 'Imperial Valley College'",
    rows.some(function (r) { return /Imperial Valley College/.test(r.textContent); }));
  // Search matches the display name (haystack includes dispName).
  T._state.q = "Imperial Valley"; T.render();
  const shown = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  check("P: searching the display name ('Imperial Valley') matches exactly that row",
    shown.length >= 1 && shown.every(function (r) { return /Imperial Valley College/.test(r.textContent); }));
  T._state.q = ""; T.render();
  // Both renamed colleges are rural → the rural section shows the display names too.
  const ruralSec = doc.querySelector('details.cplfund-sec[data-sec="rural"]');
  check("P: the rural section shows the display names",
    ruralSec.textContent.indexOf("Coalinga College") !== -1 &&
    ruralSec.textContent.indexOf("Imperial Valley College") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part Q — the $15M Distributions sub-view (SkyHighness, 2026-07-29): the ESS
// 25-82 $50,000 grant receipt (118 recipients = 114 colleges + 4 noncredit
// campuses; Sequoias declined) plus progress on the three ESS priority outcomes,
// each measured from live MAP/CER data and fail-open when a feed is absent.
// ─────────────────────────────────────────────────────────────────────────────
{
  // The ESS outcome-2 rollup producer is wired into the daily workflow and the
  // consumer lazy-loads its sidecar.
  const wf = fs.existsSync(".github/workflows/daily-dashboard.yml")
    ? fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8") : "";
  check("Q0: the ESS outcome-2 producer runs in the daily workflow",
    /_build_funding_ess\.py/.test(wf));
  check("Q0: the consumer lazy-loads the ESS sidecar (fail-open)",
    /loadScript\("cpl_funding_ess\.js",\s*"CPL_FUNDING_ESS"/.test(consumerSrc));
  check("Q0: the producer exists and documents the statewide-articulation basis",
    fs.existsSync("funding/_build_funding_ess.py") &&
    /statewide/i.test(fs.readFileSync("funding/_build_funding_ess.py", "utf8")));
}
{
  const { window } = freshDom();
  // Feed both the MAP perf artifact (vet_star + pe/p3) and the ESS sidecar.
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-29", suppress_below: 5,
    statewide: { pe: 43000, p2: 5000, p3: 16000 },
    vet_star: { "Alameda": true, "Laney": false },
    vet_star_threshold: 0.75, vet_star_as_of: "2026-07-29",
    colleges: {
      "Alameda": { pe: 120, p3: 40 },              // outcome 3 met
      "Laney": { pe: null, p3: null, pe_suppressed: true },   // suppressed → partial
      "Butte": { pe: 0, p3: 0 }                    // in feed, nothing → not met
    },
    unmatched: {}
  };
  window.CPL_FUNDING_ESS = {
    as_of: "2026-07-29", n_statewide_credentials: 84, n_adopters: 2,
    statewide_adopters: { "Alameda": true, "Butte": true }, unmatched: {}
  };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const D = window.CPL_FUNDING;

  check("Q1: the sub-view toggle offers the $15M Distributions view",
    !!doc.querySelector('[data-subview="grants"]'));
  T._setSubview("grants");
  const table = doc.querySelector("table.cplfund-grants");
  check("Q1: the grants table renders", !!table);

  // Recipients: every college except the decliner, plus the 4 noncredit feeders.
  const nRecip = D.colleges.length - 1 + D.feeders.length;   // 115 - 1 + 4 = 118
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
  const declined = bodyRows.filter(function (r) { return r.classList.contains("cplfund-declined"); });
  check("Q2: 118 recipients + 1 declined row",
    bodyRows.length - declined.length === nRecip && declined.length === 1 && nRecip === 118);
  check("Q2: the decliner (Sequoias) is shown as declined, not as a recipient",
    /Sequoias/.test(declined[0].textContent) && /declined/i.test(declined[0].textContent));
  check("Q2: the 4 noncredit campuses are flagged NC",
    table.querySelectorAll("tbody .cplfund-chip").length === D.feeders.length);
  const grandTotal = nRecip * 50000;                          // $5,900,000
  check("Q2: total distributed = 118 × $50,000 = $5,900,000",
    grandTotal === 5900000 &&
    table.querySelector("tfoot").textContent.indexOf("$" + grandTotal.toLocaleString("en-US")) !== -1);
  const secTxt = doc.querySelector(".cplfund").textContent;
  check("Q2: the remaining 2025-26 balance is shown alongside (separate from the $35M model)",
    secTxt.indexOf("$" + Math.round(D.pool.remaining_2025_26).toLocaleString("en-US")) !== -1 &&
    /Remaining 2025-26/.test(secTxt));
  check("Q2: the $15M reconciliation states the residual honestly",
    /Reconciliation:/.test(secTxt) && /15,000,000/.test(secTxt));

  // Outcome marks per row, driven by the fixtures above.
  function rowFor(name) {
    return bodyRows.find(function (r) { return r.querySelector("td.t") && new RegExp(name).test(r.querySelector("td.t").textContent); });
  }
  const al = rowFor("Alameda"), la = rowFor("Laney"), bu = rowFor("Butte");
  check("Q3: outcome 1 ✓ when the Veteran Star flag is met",
    !!al.querySelectorAll("td.c")[0].querySelector(".cf-ess.ok"));
  check("Q3: outcome 1 not-met when below the Veteran Star bar",
    !!la.querySelectorAll("td.c")[0].querySelector(".cf-ess.no"));
  check("Q3: outcome 1 hover names the Veteran Star basis (75%, not the memo's 100%)",
    /Veteran Star/.test(al.querySelectorAll("td.c")[0].querySelector(".cf-ess").getAttribute("title")));
  check("Q3: outcome 1 reads n/a for a college absent from the veteran feed",
    !!bu.querySelectorAll("td.c")[0].textContent.match(/n\/a/));
  check("Q4: outcome 2 ✓ for a statewide-recommendation adopter",
    !!al.querySelectorAll("td.c")[1].querySelector(".cf-ess.ok") &&
    /statewide credit recommendation/.test(al.querySelectorAll("td.c")[1].querySelector(".cf-ess").getAttribute("title")));
  check("Q4: outcome 2 not-met for a non-adopter",
    !!la.querySelectorAll("td.c")[1].querySelector(".cf-ess.no"));
  check("Q5: outcome 3 ✓ when eligible/transcribed students exist in MAP",
    !!al.querySelectorAll("td.c")[2].querySelector(".cf-ess.ok"));
  check("Q5: outcome 3 ◐ (partial) when the count is privacy-suppressed",
    !!la.querySelectorAll("td.c")[2].querySelector(".cf-ess.part"));
  check("Q5: outcome 3 not-met when the feed is loaded but the college posted nothing",
    !!bu.querySelectorAll("td.c")[2].querySelector(".cf-ess.no"));
  check("Q6: the view tallies each outcome + an all-three count",
    /Progress on current data:/.test(secTxt) && /meeting all three/.test(secTxt));
  check("Q6: the legend explains every mark, incl. that a dash is not a compliance finding",
    /not a finding that a college failed/.test(secTxt));
  check("Q6: the ESS memo's certification date + expenditure deadline are stated",
    /Jan 15, 2026/.test(secTxt) && /June 30, 2028/.test(secTxt));
  delete window.CPL_FUNDING_PERF;
  delete window.CPL_FUNDING_ESS;
}
{
  // Q7 — fail-open: with NO feeds loaded, every outcome reads pending (⏳), never a
  // false "not met", and the view still renders the grant receipt.
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setSubview("grants");
  const table = doc.querySelector("table.cplfund-grants");
  check("Q7: the grant receipt renders with no feeds loaded", !!table &&
    table.querySelector("tfoot").textContent.indexOf("$5,900,000") !== -1);
  check("Q7: outcomes read pending (⏳) rather than a false not-met",
    table.querySelectorAll("tbody .cf-ess.pend").length > 300 &&
    table.querySelectorAll("tbody .cf-ess.ok").length === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part R — the Sept-2026 BOG budget amendment is the pool AUTHORITY (Sam,
// 2026-07-30; `20260729_CPL_Amendment_Sep_BOG.xlsx`). The amendment splits the
// $35M into just two lines — College CPL Outcomes Awards $26,040,308
// (= $25,240,308 to institutions + $800,000 CO staff, 2.0 FTE × 2 yrs) and CPL
// Projects $8,959,692 — and names NO noncredit or rural line. Sam's ruling: the
// $25,240,308 institution total governs, and the two $1M policy earmarks are
// carved FROM INSIDE it rather than riding on top.
//
// The failure mode these guard: a pool edit that silently stops reconciling with
// the figures the Board approved. Every number below is traceable to a line in
// that workbook, so a drift here is a drift from the board document.
// ─────────────────────────────────────────────────────────────────────────────
{
  const p = D.pool;
  const AMEND_INSTITUTIONS = 25240308;   // "$35M Part: 115 Colleges & 4 Noncredit"
  const AMEND_CO_STAFF = 800000;         // "$35M Part: CO Staff: 2.0 FTE"
  const AMEND_PROJECTS = 8959692;        // "CPL Projects (CO & RCCD)"

  check("R1: $35M − CO staff − CPL Projects ties to the amendment's $25,240,308 to institutions",
    p.one_time_2026_27 - p.admin_cost - p.scaling_projects_tech === AMEND_INSTITUTIONS);
  check("R1: the amendment's College-Awards line ($26,040,308) reconstructs from the pool",
    AMEND_INSTITUTIONS + p.admin_cost === 26040308);
  check("R1: the amendment's two lines still sum to the $35M appropriation",
    26040308 + p.scaling_projects_tech === 35000000);
  check("R2: CO staff carries the amendment's $800,000 (2.0 FTE × 2 yrs)",
    p.admin_cost === AMEND_CO_STAFF);
  check("R2: CPL Projects carries the amendment's $8,959,692",
    p.scaling_projects_tech === AMEND_PROJECTS);
  check("R3: college_funding_before_feeder mirrors the institution total",
    p.college_funding_before_feeder === AMEND_INSTITUTIONS);
  check("R4: both $1M earmarks are carved from INSIDE the institution total",
    p.feeder_carveout === 1000000 && p.rural_carveout === 1000000);
  check("R4: the data file records the amendment as the authority",
    /20260729_CPL_Amendment_Sep_BOG/.test(dataSrc) && /BOG budget amendment/i.test(dataSrc));

  // The $15M block: the amendment reconciles it to the penny as
  // 15,000,000 − 5,900,000 seed − 59,692 N2N = 9,040,308 remaining.
  check("R5: remaining_2025_26 carries the amendment's $9,040,308",
    p.remaining_2025_26 === 9040308);
  check("R5: the $15M residual computes to the amendment's exact $59,692 N2N carve-off",
    15000000 - 118 * 50000 - p.remaining_2025_26 === 59692);
}
{
  // The distribution engine must consume exactly the carved pool — Σ college
  // window totals == institution total − the noncredit carve-out (the rural $1M
  // is distributed back INTO the college rows, so it stays inside the sum).
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const p = window.CPL_FUNDING.pool;
  const institutions = p.one_time_2026_27 - p.admin_cost - p.scaling_projects_tech;
  const heroPool = institutions - p.feeder_carveout;          // colleges, incl. rural
  const mainPool = heroPool - p.rural_carveout;               // proportional split

  check("R6: netCollege() is the institution total less BOTH earmarks",
    Math.abs(T._netCollege() - mainPool) < 0.5);

  let sum = 0;
  window.CPL_FUNDING.colleges.forEach(function (c) { sum += T._alloc(c.college).total; });
  check("R7: Σ college window totals == the hero pool (conservation across the carve-outs)",
    Math.abs(sum - heroPool) < 1);

  // Under this pool the amendment-era award range is avg 210,785 / min 150,000 /
  // max 623,871 — asserted by DERIVATION (never hardcoded), so a future pool
  // change re-proves the relationships instead of failing on a stale literal.
  const totals = window.CPL_FUNDING.colleges.map(function (c) { return T._alloc(c.college).total; });
  const min = Math.min.apply(null, totals), max = Math.max.apply(null, totals);
  check("R8: the average award is the hero pool over the 115 colleges",
    Math.abs(sum / totals.length - heroPool / window.CPL_FUNDING.colleges.length) < 0.01);
  check("R8: the minimum award is the floor (the floor binds at this pool size)",
    Math.abs(min - p.floor_window) < 0.5);
  // The maximum award is now the CEILING, not the largest college's share
  // (Sam's $400K maximum, 2026-08-22). Note the largest college is picked on the
  // ALLOCATION BASIS (credit FTES) — the largest by HEADCOUNT is East LA, which
  // sits below the ceiling, so a headcount-picked college would fail this for a
  // reason that has nothing to do with the ceiling.
  const biggest = window.CPL_FUNDING.colleges.reduce(function (a, b) {
    return (a.credit_ftes || 0) >= (b.credit_ftes || 0) ? a : b;
  }).college;
  check("R8: the maximum award is the ceiling (the ceiling binds at this pool size)",
    p.cap_window > 0 && Math.abs(max - p.cap_window) < 0.5 && max > p.floor_window);
  check("R8: the largest college on the allocation basis is the one held to the ceiling",
    T._alloc(biggest).capped === true && Math.abs(T._alloc(biggest).total - p.cap_window) < 0.5);
}

finish();
