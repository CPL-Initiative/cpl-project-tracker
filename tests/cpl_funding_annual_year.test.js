// CPL Implementation Funding tab — under Annual funding an award cell compares
// a year with a year (Sam, 2026-09-27, funding asks card 1: "Year against
// year").
//
// THE DEFECT: under Annual funding the Max award cell shows ONE year's tranche
// (the award ÷ the years), while the qualifying line beneath it summed the
// WHOLE window. A college that qualified in both years read up to 200% of its
// award; on 2026-09-01 one read "qualifying $140,476 · 191%". The model
// already carried each year's qualifying figure (collegeAlloc's ey1, ey2), so
// the fix reads the viewed year's figure: the one the "Show priorities for"
// control names. Under Combined funding the award is the window's, and the
// window's qualifying figure stays beneath it.
//
// The same scope rule covers the held-in-reserve figure, the CR and NC cells'
// hovers, and the district and SYSTEM subtotal rows, which render through the
// same cells.
//
// Also here: the two lines the funding asks sheet found contradicting Sam's
// earlier rulings (To-Do s296-fable-funding-text-fixes): the timeline's code
// default no longer says the rolled funds are releveled (his ruling of
// 2026-09-25), and the ESS partial state names the feed's suppression floor
// (10 under the under-10 ADR) instead of a typed "fewer than 5".
//
// Memory budget (tests/lib/cpl_funding_harness.js): ~44 MB per booted
// window; this suite uses 3.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_annual_year.test.js`).
const {
  consumerSrc,
  D,
  check,
  freshDom,
  boot,
  finish,
} = require("./lib/cpl_funding_harness.js");

// The one-pool roster (the frontload suite's shape): the college rows plus the
// noncredit-only institutions by their shorts, each with its district.
const ROSTER = D.colleges.map(function (c) { return { name: c.college, district: c.district }; })
  .concat(D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; })
    .map(function (f) { return { name: f.short, district: f.district || "" }; }));
function allRows(T) {
  return ROSTER.map(function (r) {
    const a = T._alloc(r.name);
    if (!a) return null;
    a.district = r.district;
    return a;
  }).filter(Boolean);
}

function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.5 : eps); }
// fmtPctTrim's shape, so an expected percent compares as the screen prints it.
function pctText(v) { return String(parseFloat((v * 100).toFixed(2))) + "%"; }
// The percent at the end of a cell's qualifying line ("qualifying $X · 53.2%").
function subPct(cell) {
  const sub = cell && cell.querySelector(".sub");
  const m = (sub ? sub.textContent : "").match(/([\d.]+)%\s*$/);
  return m ? m[1] + "%" : null;
}
// Alameda posts far past every Year-1 target, so it qualifies for all of its
// Year-1 credit share; Year 2 is pinned to named gaps (the earning suite's
// fixture), which the model pays in full under Annual funding. Together they
// put Alameda's window figure near its whole credit award: the case that read
// past 100% of a one-year tranche.
function perfFixture(window) {
  const big = { pe: 999999, p2: 999999, p3: 999999, pp: 999999 };
  window.CPL_FUNDING_PERF = {
    as_of: "2026-09-27", suppress_below: 10,
    statewide: big,
    colleges: {
      Alameda: big,
      // Activity present, every count under the floor: the ESS partial state.
      Laney: { pe: null, pe_suppressed: true, p2: null, p2_suppressed: true, p3: null, p3_suppressed: true }
    },
    unmatched: {}
  };
}
function pinYears(T) {
  T._setShared({ yearPriorities: {
    "1": {
      "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." },
      "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
      "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    },
    "2": {
      "0": { metric: "Headcount with CPL Matched in MAP and MIS" },
      "1": { metric: "Headcount with Completion and 3+ Transcribed CPL Units" },
      "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    }
  } });
}
function rowCell(doc, name, sel) {
  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (r) { return new RegExp(name).test(r.textContent); });
  return row ? row.querySelector(sel) : null;
}

// ── Window 1: Annual funding (the default) ──────────────────────────────────
{
  const { window } = freshDom();
  perfFixture(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  pinYears(T);
  T._setScenario({ disbursement: "even" });
  T._state.viewSlot = "1";
  T.render();

  const a = T._alloc("Alameda");
  const tranche = a.total / 2;   // the Annual cell's award: the window ÷ its two years
  check("A1: the model carries each year's qualifying, held and lane figures",
    ["ey", "hy", "ecy", "eny"].every(function (f) {
      return typeof a[f + "1"] === "number" && typeof a[f + "2"] === "number";
    }));
  check("A1: the years add up to the window (qualifying, credit, noncredit, held)",
    near(a.ey1 + a.ey2, a.earned_total, 1) && near(a.ecy1 + a.ecy2, a.earned_cr, 1) &&
    near(a.eny1 + a.eny2, a.earned_nc, 1) && near(a.hy1 + a.hy2, a.earned_withheld || 0, 1));
  check("A1: each year's lanes add up to that year's qualifying figure",
    near(a.ecy1 + a.eny1, a.ey1, 1) && near(a.ecy2 + a.eny2, a.ey2, 1));
  // The fixture is the defect's case: the window over one year's tranche
  // passes 100%, so an assertion below that still read the window would fail.
  check("A2: the fixture reproduces the defect (the window's figure over one year's tranche > 100%)",
    a.earned_total / tranche > 1 && a.ey1 > 0 && a.ey2 > 0);

  const max = rowCell(doc, "Alameda", "td.cf-max");
  check("A3: under Annual funding the Max award cell prints the viewed year's percent (Year 1)",
    !!max && subPct(max) === pctText(a.ey1 / tranche));
  check("A3: ...which stays at or under 100%",
    !!max && parseFloat(subPct(max)) <= 100);
  check("A3: the hover names the year the qualifying figure covers",
    !!max && /qualifying so far in 2026-27: \$/.test(max.getAttribute("title") || ""));
  const cr = rowCell(doc, "Alameda", "td.cf-award:not(.cf-max)");
  check("A4: the CR award hover reads the viewed year's credit figure beside the per-year share",
    !!cr && (cr.getAttribute("title") || "").indexOf("qualifying so far in 2026-27: $" +
      Math.round(a.ecy1).toLocaleString("en-US")) !== -1);
  const th = doc.querySelector('#cplFundTable th[data-sort="total"]');
  check("A5: the Max award header says the Current Total beneath is the viewed year's",
    !!th && /Current Total for 2026-27 beneath/.test(th.getAttribute("title") || ""));

  // Year 2 on the same control: the cell follows it.
  T._state.viewSlot = "2";
  T.render();
  const max2 = rowCell(doc, "Alameda", "td.cf-max");
  check("A6: viewing Year 2 prints Year 2's percent against the same tranche",
    !!max2 && subPct(max2) === pctText(a.ey2 / tranche) &&
    /qualifying so far in 2027-28: \$/.test(max2.getAttribute("title") || ""));

  // The SYSTEM row reads the statewide sum of the viewed year.
  T._state.viewSlot = "1";
  T.render();
  const sysMax = doc.querySelector(".cplfund-systemrow td.cf-max");
  const rows = allRows(T);
  const sumEy1 = rows.reduce(function (s, r) { return s + (r.ey1 || 0); }, 0);
  const sumTot = rows.reduce(function (s, r) { return s + (r.total || 0); }, 0);
  check("A7: the SYSTEM row's percent is Year 1's statewide figure over the statewide tranche",
    !!sysMax && sumEy1 > 0 && subPct(sysMax) === pctText(sumEy1 / (sumTot / 2)));

  // A district subtotal adds its members' Year-1 figures.
  T._state.group = "district";
  T.render();
  const hdr = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-grouphdr"))
    .find(function (r) { return /Peralta/.test(r.textContent); });
  const peralta = rows.filter(function (r) { return /Peralta/.test(r.district || ""); });
  const pEy1 = peralta.reduce(function (s, r) { return s + (r.ey1 || 0); }, 0);
  const pTot = peralta.reduce(function (s, r) { return s + (r.total || 0); }, 0);
  check("A8: a district subtotal's percent is its members' Year-1 figure over their tranche",
    !!hdr && peralta.length > 1 && subPct(hdr.querySelector("td.cf-max")) === pctText(pEy1 / (pTot / 2)));
  T._state.group = "none";
  T.render();

  // The text fixes (To-Do s296-fable-funding-text-fixes).
  const la = T._ess("Laney").o3;
  check("C1: the ESS partial state names the feed's floor (10), not a typed 5",
    la.state === "partial" && /fewer than 10 students/.test(la.why) && !/fewer than 5\b/.test(la.why));
  check("C1: (source) no typed 'fewer than 5 students' survives in the tab",
    consumerSrc.indexOf("fewer than 5 students") === -1);
  const labels = Array.from(doc.querySelectorAll(".cplfund-timing-label"))
    .map(function (el) { return String(el.tagName === "INPUT" || el.tagName === "TEXTAREA" ? el.value : el.textContent).trim(); });
  check("C2: the default timeline rolls the funds to Year 2 and never relevels them (Sam, 2026-09-25)",
    labels.indexOf("Undispersed Funds Rolled to Year 2") !== -1 && !labels.some(function (l) { return /relevel/i.test(l); }));
  const block = (consumerSrc.split("var DEFAULT_TIMING = [")[1] || "").split("];")[0];
  check("C2: (source) DEFAULT_TIMING carries no releveling label",
    block.length > 0 && !/label:[^}]*relevel/i.test(block));
}

// ── Window 2: Combined funding — the window against the window ─────────────
{
  const { window } = freshDom();
  perfFixture(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  pinYears(T);
  T._setScenario({ disbursement: "frontload" });
  T._state.viewSlot = "1";
  T.render();

  const a = T._alloc("Alameda");
  const max = rowCell(doc, "Alameda", "td.cf-max");
  check("B1: under Combined funding the Max award cell prints the window's figure over the window's award",
    !!max && a.total > 0 && subPct(max) === pctText(a.earned_total / a.total));
  check("B1: the hover keeps the window wording, with no year named",
    !!max && /qualifying so far: \$/.test(max.getAttribute("title") || "") &&
    !/qualifying so far in /.test(max.getAttribute("title") || ""));
  const th = doc.querySelector('#cplFundTable th[data-sort="total"]');
  check("B2: the Max award header keeps 'the Current Total beneath' under Combined funding",
    !!th && /with the Current Total beneath/.test(th.getAttribute("title") || ""));
}

finish();
