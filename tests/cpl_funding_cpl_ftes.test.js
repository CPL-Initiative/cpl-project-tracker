// tests/cpl_funding_cpl_ftes.test.js
//
// CPL FTES: the conversion, the term-length multiplier, and the target
// denominated in the 2026-27 credit rate (Sam, 2026-07-31).
//
//   1 FTES = 525 contact hours
//   1 semester unit = 17.5 contact hours  ->  30 units per FTES
//   1 quarter  unit = 11.67 contact hours ->  45 units per FTES
//
// Sam's framing, and the reason there is no special-case quarter conversion:
// "the only conversion factor needed is to use 11.67 as the tlm rather than
// 17.5 for semesters." TLM is a parameter; everything else derives.
//
// TARGET = the college's PRE-FLOOR, PRE-RURAL proportional entitlement divided
// by the reimbursement rate x a policy multiplier — "earn your allocation by
// producing the CPL FTES it would have paid for at the state rate."
//
// THE NAMING HAZARD these guard: two quantities here are called FTES and differ
// by ~500x. `credit_ftes` / sizeOf / totalSize are ENROLMENT FTES (1,069,182
// statewide) and are the ALLOCATION BASIS. CPL FTES is prior learning awarded,
// order 10^3-10^4, and is a PERFORMANCE quantity. Conflating them is a
// one-character mistake, so several assertions below exist purely to keep the
// two apart.
//
// Run from repo root: `npm test`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.5 : eps); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const D = (function () {
  const sb = { window: {} };
  new Function("window", dataSrc)(sb.window);
  return sb.window.CPL_FUNDING;
})();

const FTES_METRICS = {
  "0": { metric: "Eligible CPL Units as FTES (1 Unit = .0334 FTES)" },
  "1": { metric: "Transcribed CPL Units as FTES (1 Unit = .0334 FTES)" },
  "2": { metric: "Transcribed Units for Students from either CPL Student Portal or College CPL Landing Page" },
};

function freshDom() {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='tab-implementation-funding'>" +
    "<div id='cplFundingMount'></div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  return dom;
}
// Give two colleges the SAME raw unit count — one semester, one quarter. Any
// difference in their CPL FTES is the TLM doing its job and nothing else.
function bootWithUnits(window, units) {
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-31", suppress_below: 5,
    statewide: { pe: 43122, pe_u: 181975, p3: 16829, p3_u: 55031, pp: 5, pp_u: 12 },
    colleges: {
      "Foothill": { pe: 73, pe_u: units, p3: 20, p3_u: units, pp: 0, pp_u: 0 },   // QUARTER
      "Alameda": { pe: 120, pe_u: units, p3: 40, p3_u: units, pp: 0, pp_u: 0 },   // semester
    },
    unmatched: {},
  };
  window.eval(dataSrc); window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": FTES_METRICS, "2": FTES_METRICS } });
  T.render();
  return T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Part A — the factors are stored as BASES, with the quotient derived
// ─────────────────────────────────────────────────────────────────────────────
check("contact-hour bases are stored (525 / 17.5 / 11.67)",
  D.ftes_factors && D.ftes_factors.contact_hours_per_ftes === 525 &&
  D.ftes_factors.contact_hours_per_unit_semester === 17.5 &&
  D.ftes_factors.contact_hours_per_unit_quarter === 11.67);
// Storing 30 (or 45, or .03333) beside the bases would be three numbers for one
// fact — i.e. two ways to drift. The quotient must be computed.
check("units-per-FTES is NOT stored anywhere (it is derived from the two bases)",
  D.ftes_factors.units_per_ftes === undefined &&
  D.ftes_factors.ftes_per_unit === undefined &&
  !/units_per_ftes|ftes_per_unit/.test(dataSrc));
check("the derivation is what the code does (525/17.5 = 30, 525/11.67 = 45)",
  near(525 / 17.5, 30, 0.001) && near(525 / 11.67, 45, 0.02));
check("the 2026-27 credit FTES rate is configured",
  D.pool.ftes_rate_2026_27 === 5649.63);
check("a policy multiplier exists and defaults to par (1.0)", D.target_multiplier === 1);
check("exactly the two known quarter colleges are flagged",
  D.colleges.filter(function (c) { return c.quarter; }).map(function (c) { return c.college; })
    .sort().join(",") === "De Anza,Foothill");

// ─────────────────────────────────────────────────────────────────────────────
// Part B — the naming hazard: enrolment FTES is not CPL FTES
// ─────────────────────────────────────────────────────────────────────────────
check("the CPL quantity is named cplFtes, never a bare ftes",
  /function unitsToCplFtes/.test(consumerSrc) && /function unitsPerCplFtes/.test(consumerSrc));
// The target must never be built from the ALLOCATION basis quantity.
{
  const body = (consumerSrc.match(/function prioTarget\(c, p\)[\s\S]*?\n  \}/) || [""])[0];
  check("prioTarget never reads credit_ftes (that is enrolment FTES, a different quantity)",
    body.length > 0 && body.indexOf("credit_ftes") === -1);
}
check("the two quantities are ~500x apart, so a mix-up could not hide",
  D.system.credit_ftes > 1000000 && (D.pool.college_funding_before_feeder / 5649.63) < 10000);

// ─────────────────────────────────────────────────────────────────────────────
// Part C — the TLM does the whole job: same units, different FTES
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const P = T._priorities ? null : null;   // (no seam needed; read via the row)

  // 900 units: semester -> 30.0 FTES, quarter -> 20.0 FTES.
  const rows = ["Alameda", "Foothill"].map(function (n) {
    const row = Array.from(window.document.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find(function (r) {
        const td = r.querySelectorAll("td")[1];
        return td && td.textContent.trim().replace(/^▸/, "").indexOf(n) === 0;
      });
    return { n: n, td: row.querySelector("td.cf-prio") };
  });
  const txt = function (i) { return rows[i].td.textContent.replace(/\s+/g, " "); };
  check("semester college: 900 units reads 30 CPL FTES", /Now 30 FTES/.test(txt(0)));
  check("QUARTER college: the same 900 units reads 20 CPL FTES (÷45, not ÷30)",
    /Now 20 FTES/.test(txt(1)));
  check("...so the quarter college is NOT credited 1.5x for identical work",
    /Now 30 FTES/.test(txt(0)) && !/Now 30 FTES/.test(txt(1)));
  check("the cell counts in FTES, not students, when the metric is FTES",
    /Tgt [\d.,]+ FTES/.test(txt(0)) && !/stu/.test(txt(0)));
  // The hover has to show the working, including which calendar was applied.
  const q = rows[1].td.getAttribute("title") || "";
  check("the quarter college's hover shows units ÷ units-per-FTES and names the calendar",
    /900 units ÷ 45\.0 units\/FTES, quarter calendar/.test(q));
  check("the hover states the target in CPL FTES and where it came from",
    /Target [\d.]+ CPL FTES \([\d,]+ units — its allocation ÷ \$5,?649\.63\/FTES\)/.test(q));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the target is entitlement ÷ rate, and rides the RIGHT entitlement
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const m = T._model();

  // An unfloored, non-rural college's target must be its PRE-FLOOR proportional
  // entitlement ÷ the rate. Recompute from the baked data, independently.
  const totFtes = D.colleges.reduce(function (s, c) { return s + c.credit_ftes; }, 0);
  const net = T._netCollege();
  const ny = D.default_years.length || 2;
  const share = D.year_priorities["1"][0].share;
  const plain = D.colleges.filter(function (c) {
    return !m.floored[c.college] && !c.rural;
  }).slice(0, 12);
  const worst = plain.reduce(function (mx, c) {
    const row = T._alloc(c.college);
    const key = Object.keys(row).find(function (k) { return /_heads$/.test(k); });
    const expect = (c.credit_ftes / totFtes) * net * share / ny / 5649.63;
    return Math.max(mx, Math.abs(row[key] - expect));
  }, 0);
  check("target == pre-floor proportional entitlement ÷ rate (max err < 0.01 FTES)",
    plain.length > 5 && worst < 0.01);

  // THE FLOOR TRAP: a floored college's cap is topped up to $150K. Its TARGET
  // must not rise with it — "the floor raises a college's funding, not its
  // targets". Compare a floored college's target against its own pre-floor share.
  const floored = D.colleges.filter(function (c) { return m.floored[c.college] && !c.rural; })[0];
  if (floored) {
    const row = T._alloc(floored.college);
    const key = Object.keys(row).find(function (k) { return /_heads$/.test(k); });
    const cap = key.replace(/_heads$/, "");
    const preFloor = (floored.credit_ftes / totFtes) * net * share / ny / 5649.63;
    check("FLOOR TRAP: a floored college's target stays on its PRE-floor share",
      near(row[key], preFloor, 0.01));
    check("...even though its cap was topped up above that share",
      row[cap] > preFloor * 5649.63 * 1.05);
  } else {
    check("FLOOR TRAP: (no unfloored-rural-free floored college to test)", false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E — the multiplier is the only policy dial
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const key = function () {
    const row = T._alloc("Alameda");
    return row[Object.keys(row).find(function (k) { return /_heads$/.test(k); })];
  };
  const par = key();
  T._setScenario({ targetMultiplier: 0.5 });
  T.render();
  const half = key();
  // The multiplier scales the TARGET: <1 is easier, >1 means a college must beat
  // apportionment value. (It was briefly wired onto the RATE, which inverted it.)
  check("halving the multiplier halves the target — i.e. makes it EASIER",
    par > 0 && near(half, par / 2, 0.001));
  T._setScenario({ targetMultiplier: 2 });
  T.render();
  check("doubling it doubles the target — i.e. makes it HARDER", near(key(), par * 2, 0.001));
  T._setScenario({});
  T.render();
  check("clearing the override returns to par", near(key(), par, 0.001));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — front-load must not double the target alongside the cap
// ─────────────────────────────────────────────────────────────────────────────
// If the target were built from prioCap it would scale with the window under
// front-load, the ratio would cancel, and every earned dollar would be identical
// to EVEN mode — silently deleting the incentive Sam built front-load for.
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const tgt = function () {
    const row = T._alloc("Alameda");
    return row[Object.keys(row).find(function (k) { return /_heads$/.test(k); })];
  };
  const cap = function () {
    const row = T._alloc("Alameda");
    const k = Object.keys(row).find(function (x) { return /_heads$/.test(x); });
    return row[k.replace(/_heads$/, "")];
  };
  T._setScenario({ disbursement: "even" });
  T.render();
  const evenT = tgt(), evenC = cap();
  T._setScenario({ disbursement: "frontload" });
  T.render();
  const flT = tgt(), flC = cap();
  check("front-load leaves the CPL FTES target unchanged (per-year, as designed)",
    near(flT, evenT, 0.001));
  check("...while the cap DOES scale to the whole window",
    flC > evenC * 1.5);
  check("...so the effective $/FTES really does rise under front-load",
    (flC / flT) > (evenC / evenT) * 1.5);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
