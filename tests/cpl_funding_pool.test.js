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
// O1/O2/O3 — RETIRED with the rural carve-out (Sam, 2026-08-22). These covered
// the guaranteed allowance in the drill-in, the floor-fill hover, and returning
// the $1M to the main pool when the roster was cleared. The mechanism is gone
// and its absence is guarded in tests/cpl_funding_rural.test.js. The one check
// worth keeping is O2b, which was never about rural at all: the statewide
// (null-c) per-priority path must render without a per-college `c`. The
// in-table P-cells are retired (one-pool port, 2026-08-31 — per-priority detail
// lives in the row expand), so the surfaces that still exercise null-c are the
// ONE SYSTEM row's CR/NC award pair (R6) and the CSV's SYSTEM line, whose
// per-priority targets come from prioTarget(null, p) at the statewide base.
{
  const { window } = freshDom();
  const doc = boot(window);
  const sysAward = doc.querySelectorAll("#cplFundTable tr.cplfund-systemrow td.cf-award");
  const csvO = window.CPL_FUNDING_TAB._csv().split("\r\n");
  const headO = (csvO[1] || "").split(",");
  const sysO = (csvO.find(function (l) { return l.indexOf("SYSTEM (statewide)") !== -1; }) || "").split(",");
  const p1t = Number(sysO[headO.indexOf("P1 target")]);
  check("O2b: the statewide (null-c) per-priority path renders — SYSTEM award pair + CSV targets, no crash",
    sysAward.length === 2 && /Credit share of the max award/.test(sysAward[0].getAttribute("title") || "") &&
    headO.indexOf("P1 target") !== -1 && p1t > 0);
}

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
  // The rural section that used to re-show these display names is retired
  // (2026-08-22). The display-name rename still has to hold everywhere it
  // renders, so assert it against a surface that survived: the CSV export.
  const csvP = T._csv();
  check("P: the display names carry into the CSV export",
    csvP.indexOf("Coalinga College") !== -1 && csvP.indexOf("Imperial Valley College") !== -1);
  check("P: …and the retired rural section is genuinely gone",
    !doc.querySelector('details.cplfund-sec[data-sec="rural"]'));
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
  // ONE POOL (Sam, 2026-08-31): the noncredit carve-out is RETIRED (R3) — the
  // stored field survives for config-shape stability (deleting a curator's
  // saved value is a data write the code change does not need) but the model
  // reads NOTHING from it; R6 below proves the pool it once carved is whole.
  check("R4: the $1M earmark FIELD survives (config-shape stability) but rural stays gone",
    p.feeder_carveout === 1000000 && p.rural_carveout === undefined);
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
  // ONE POOL (Sam, adopted 2026-08-31): the distribution engine must consume
  // exactly the institution total — the noncredit carve-out is FOLDED IN (R3),
  // so nothing is netted off it, and the roster it distributes over is every
  // institution ONCE: the 115 college rows plus the noncredit-only three as
  // ordinary rows keyed by their shorts (Mt. SAC Noncredit rides the
  // Mt San Antonio row — the same program must not be paid twice).
  // (History: the rural $1M was folded back on 2026-08-22, funding a $175K
  // floor; one-pool adoption re-set the baked window to $150K/$400K.)
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const p = window.CPL_FUNDING.pool;
  const institutions = p.one_time_2026_27 - p.admin_cost - p.scaling_projects_tech;
  const heroPool = institutions;   // $25,240,308 — the amendment's line IS the pool
  const roster = window.CPL_FUNDING.colleges.map(function (c) { return c.college; })
    .concat(window.CPL_FUNDING.feeders
      .filter(function (f) { return !f.nc_ftes_on_credit_row; })
      .map(function (f) { return f.short; }));

  check("R6: netCollege() IS the institution total — the carve-out is folded in (R3)",
    Math.abs(T._netCollege() - heroPool) < 0.5);

  let sum = 0;
  roster.forEach(function (n) { sum += T._alloc(n).total; });
  check("R7: Σ institution window totals over all 118 == the hero pool (conservation)",
    roster.length === 118 && Math.abs(sum - heroPool) < 1);

  // Asserted by DERIVATION (never hardcoded), so a floor/ceiling change re-proves
  // the relationships instead of failing on a stale literal.
  const totals = roster.map(function (n) { return T._alloc(n).total; });
  const min = Math.min.apply(null, totals), max = Math.max.apply(null, totals);
  check("R8: the average max award is the hero pool over the 118 institutions",
    Math.abs(sum / totals.length - heroPool / roster.length) < 0.01);
  check("R8: the minimum award is the floor (the floor binds at this pool size)",
    Math.abs(min - p.floor_window) < 0.5);
  // The maximum award is the CEILING, not the largest institution's share
  // (Sam's $400K maximum, 2026-08-22; combined-award window ruled 2026-08-31).
  // The largest institution is picked on the ALLOCATION BASIS — COMBINED
  // credit + noncredit FTES (Mt San Antonio, whose Mt. SAC NC FTES ride its
  // row) — the largest by HEADCOUNT is East LA, which sits below the ceiling,
  // so a headcount-picked institution would fail this for a reason that has
  // nothing to do with the ceiling.
  const biggest = window.CPL_FUNDING.colleges.reduce(function (a, b) {
    const sa = (a.credit_ftes || 0) + (Number(a.noncredit_ftes) || 0);
    const sb = (b.credit_ftes || 0) + (Number(b.noncredit_ftes) || 0);
    return sa >= sb ? a : b;
  }).college;
  check("R8: the maximum award is the ceiling (the ceiling binds at this pool size)",
    p.cap_window > 0 && Math.abs(max - p.cap_window) < 0.5 && max > p.floor_window);
  check("R8: the largest institution on the allocation basis is one held to the ceiling",
    T._alloc(biggest).capped === true && Math.abs(T._alloc(biggest).total - p.cap_window) < 0.5);
}

finish();
