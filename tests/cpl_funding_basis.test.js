// tests/cpl_funding_basis.test.js
//
// The allocation basis: how big is a college, and what is its share of the pool?
// (Sam, 2026-07-31 — "abandon headcount altogether and use college FTES".)
//
// The switch was decided on measurement, not argument. The objection was that
// FTES would penalise CPL-heavy colleges because working adults enrol part-time;
// it doesn't — corr(load factor, CPL penetration) = 0.086, and the switch moves
// money TOWARD the highest-CPL colleges. What settled it was data quality:
// credit FTES is uniform 2025-26, while headcount had 41/115 rows on 2022-23
// vintage and 33/115 outside any credible FTES-per-head band (20 of those on
// CURRENT vintage — definitional drift, not staleness).
//
// These guard the properties that make the swap safe:
//   (a) ONE seam decides size — nothing computes its own share;
//   (b) conservation — Σ college allocations still equals the pool, both bases;
//   (c) the headcount basis still reduces to exactly what it did before;
//   (d) fail-safe — a row with no FTES falls back to headcount, never to $0;
//   (e) the active basis is always NAMED on screen, never an invisible mode.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_basis.test.js`).
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

function freshDom() {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='tab-implementation-funding'>" +
    "<div id='cplFundingMount'></div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  return dom;
}
function boot(window) {
  window.eval(dataSrc); window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
function allRows(T) {
  return D.colleges.map(function (c) {
    const a = T._alloc(c.college);
    if (!a) return null;
    a.college = c.college;
    return a;
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part A — the data landed, and it landed completely
// ─────────────────────────────────────────────────────────────────────────────
check("every college carries credit_ftes", D.colleges.every(function (c) { return typeof c.credit_ftes === "number"; }));
// The vintage is ONE fact, stated once — not repeated on 115 rows where it
// could drift row-by-row.
check("the FTES vintage is stated once at the top level", D.ftes_vintage === "2025-26");
check("no college carries a baked FTES share (sizePct computes it — a baked share drifts)",
  D.colleges.every(function (c) { return c.ftes_pct === undefined; }));
check("no college has zero/negative credit FTES (a zero would zero its allocation)",
  D.colleges.every(function (c) { return c.credit_ftes > 0; }));
check("statewide credit FTES is stamped and equals Σ colleges",
  near(D.system.credit_ftes, D.colleges.reduce(function (s, c) { return s + c.credit_ftes; }, 0), 1));
check("the FTES source is cited (DataMart annual, by college)",
  !!(D.ftes_source && /datamart/i.test(D.ftes_source.url || "")));
check("default basis is ftes", D.allocation_basis === "ftes");
// Noncredit is carried but deliberately NOT the basis — the noncredit campuses
// have their own carve-out, so using total FTES would fund them twice.
// Noncredit is deliberately NOT carried per college: the basis is credit-only
// (the noncredit campuses have their own carve-out, so total FTES would fund
// that population twice) and an unused field is just weight.
check("colleges carry credit FTES only — noncredit lives with the feeders",
  D.colleges.every(function (c) { return c.noncredit_ftes === undefined; }));
check("the noncredit feeders carry their own FTES",
  D.feeders.filter(function (f) { return typeof f.noncredit_ftes === "number"; }).length === D.feeders.length);

// ─────────────────────────────────────────────────────────────────────────────
// Part B — ONE seam decides size
// ─────────────────────────────────────────────────────────────────────────────
check("sizeOf is the seam for a college's allocation weight",
  /function sizeOf\(c\)/.test(consumerSrc));
check("sizePct is COMPUTED, never read from a baked percentage",
  /function sizePct\(c\)\s*\{[\s\S]{0,160}sizeOf\(c\) \/ t/.test(consumerSrc));
// The allocation model must not reach past the seam to a raw field. `headcount`
// may still be READ for display, but not to compute a proportional split.
{
  const m = consumerSrc.match(/function allocModel\(\)[\s\S]*?\n  \}/);
  const body = m ? m[0] : "";
  check("allocModel contains no raw headcount arithmetic (all through sizeOf)",
    body.length > 0 && body.indexOf("c.headcount") === -1);
  check("allocModel does use the seam", body.indexOf("sizeOf(c)") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part C — conservation, on BOTH bases
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;

  ["ftes", "headcount"].forEach(function (basis) {
    T._setScenario({ allocationBasis: basis });
    T.render();
    const rows = allRows(T);
    const sum = rows.reduce(function (s, r) { return s + r.total; }, 0);
    check(basis + ": Σ college allocations == the distributed college pool",
      near(sum, T._netCollege() + D.pool.rural_carveout, 5));
    check(basis + ": every college gets a positive allocation",
      rows.length === D.colleges.length && rows.every(function (r) { return r.total > 0; }));
    check(basis + ": no allocation falls below the floor",
      rows.every(function (r) { return r.total >= D.pool.floor_window - 0.5; }));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the headcount basis still behaves exactly as it did
// ─────────────────────────────────────────────────────────────────────────────
// This is the regression guard: swapping the DEFAULT must not change what the
// old basis computed. An unfloored college's share should equal its headcount
// share of the unfloored remainder — the pre-2026-07-31 formula.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ allocationBasis: "headcount" });
  T.render();
  const m = T._model();
  const unfloored = D.colleges.filter(function (c) { return !m.floored[c.college]; });
  const baseHc = unfloored.reduce(function (s, c) { return s + c.headcount; }, 0);
  const remaining = unfloored.reduce(function (s, c) { return s + (m.W[c.college] || 0); }, 0);
  const worst = unfloored.reduce(function (mx, c) {
    const expect = c.headcount / baseHc * remaining;
    return Math.max(mx, Math.abs((m.W[c.college] || 0) - expect));
  }, 0);
  check("headcount basis reproduces the historical proportional split (max err < $1)", worst < 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E — the switch does what the measurement said it would
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const get = function (basis) {
    T._setScenario({ allocationBasis: basis });
    T.render();
    const o = {};
    allRows(T).forEach(function (r) { o[r.college] = r.total; });
    return o;
  };
  const hc = get("headcount"), ft = get("ftes");
  const moved = Object.keys(hc).reduce(function (s, k) { return s + Math.abs(ft[k] - hc[k]); }, 0) / 2;
  const pool = Object.keys(hc).reduce(function (s, k) { return s + hc[k]; }, 0);
  // Measured at ~11.8% of the pool. Pin a band: a switch that moves almost
  // nothing means the seam isn't wired; one that moves most of the pool means
  // something is wrong with the data.
  check("the basis switch moves a material but bounded share of the pool (2%-25%)",
    moved / pool > 0.02 && moved / pool < 0.25);
  check("Pasadena — the clearest headcount defect — gains under FTES",
    ft["Pasadena"] > hc["Pasadena"]);
  check("the two bases still distribute the SAME total",
    near(Object.values(ft).reduce(function (s, x) { return s + x; }, 0), pool, 5));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — fail-safe: a missing FTES must never zero a college
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.eval(dataSrc);
  // Knock out one college's FTES before boot, as a bad data refresh would.
  window.CPL_FUNDING.colleges[3].credit_ftes = null;
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  const T = window.CPL_FUNDING_TAB;
  const victim = window.CPL_FUNDING.colleges[3].college;
  const a = T._alloc(victim);
  check("a college with null credit_ftes still gets a real allocation (falls back to headcount)",
    a && a.total > 0);
  check("...and the pool still balances with the fallback in play",
    near(D.colleges.reduce(function (s, c) { return s + (T._alloc(c.college) || {}).total; }, 0),
      T._netCollege() + D.pool.rural_carveout, 5));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — the basis is never an invisible mode
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ allocationBasis: "ftes" });
  T.render();
  check("a curator-visible control selects the basis", !!doc.querySelector("#cplFundAllocBasis"));
  check("the size column is labelled Credit FTES under the FTES basis",
    /Credit FTES/.test(doc.querySelector("#cplFundTable thead").textContent));
  check("the explainer names the basis in the allocation formula",
    /credit FTES share/.test(doc.body.textContent));
  // Both figures must be reachable regardless of which one is rendered.
  const cell = doc.querySelector("#cplFundTable tbody tr.cplfund-row td[title*='credit FTES']");
  check("the size cell hover carries BOTH figures + their vintages",
    !!cell && /Headcount:/.test(cell.getAttribute("title")) &&
    /allocation basis/.test(cell.getAttribute("title")));

  T._setScenario({ allocationBasis: "headcount" });
  T.render();
  check("the size column flips its label with the basis",
    /Headcount/.test(doc.querySelector("#cplFundTable thead").textContent) &&
    !/Credit FTES/.test(doc.querySelector("#cplFundTable thead").textContent));
  check("the explainer follows the basis too",
    /headcount share/.test(doc.body.textContent));
  // Public readers get the numbers, not the modelling control.
  const pub = freshDom();
  pub.window.CPL_FUNDING_PUBLIC = true;
  const pdoc = boot(pub.window);
  check("public mode hides the basis control (it is a modelling lever)",
    !pdoc.querySelector("#cplFundAllocBasis") &&
    pdoc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part H — cap and target must ride the SAME basis
// ─────────────────────────────────────────────────────────────────────────────
// The defect this guards (shipped in #959, fixed 2026-07-31): the allocation
// basis moved to credit FTES while the performance target stayed denominated on
// headcount. cap / target then diverged from the statewide per-student rate by
// 0.49x (Santa Ana) to 2.11x (Las Positas) for 72 of 115 colleges — so a college
// was asked to hit a target sized for a different college, and the P-cell hover
// asserted "at the $X/student statewide base rate" while the real rate was half
// or double it. Both bases must satisfy this; it is basis-independent by design.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  ["ftes", "headcount"].forEach(function (basis) {
    T._setScenario({ allocationBasis: basis });
    T.render();
    const m = T._model();
    const rows = allRows(T);
    // For an UNFLOORED, NON-RURAL college the cap is a pure proportional share
    // and the target a pure proportional share of the same basis, so their ratio
    // must be the statewide per-student rate exactly.
    const plain = rows.filter(function (r) {
      return !m.floored[r.college] && !(r.rural_w > 0);
    });
    const key = Object.keys(rows[0]).find(function (k) { return /_heads$/.test(k); });
    const cap = key.replace(/_heads$/, "");
    const rates = plain.map(function (r) { return r[key] > 0 ? r[cap] / r[key] : null; })
      .filter(function (x) { return x != null; });
    const spread = Math.max.apply(null, rates) / Math.min.apply(null, rates);
    check(basis + ": cap ÷ target is the SAME rate for every unfloored college (no basis mismatch)",
      plain.length > 20 && spread < 1.001);
  });

  // And whatever rate a P-cell STATES, it must equal that cell's own cap / target.
  // Two sentence forms exist: "an effective $X/student" (floored, rural, or
  // renormalised) and "at the $X/student statewide base rate" (exactly on base).
  // Either way the number the reader sees has to survive dividing the two other
  // numbers in the same tooltip.
  T._setScenario({ allocationBasis: "ftes" });
  T.render();
  const cells = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-prio"));
  const checked = [];
  const lying = [];
  cells.forEach(function (td) {
    const t = td.getAttribute("title") || "";
    const cap = (t.match(/Funding cap \$([\d,]+)/) || [])[1];
    const tgt = (t.match(/Target ([\d,]+) students/) || [])[1];
    const stated = (t.match(/an effective \$([\d,.]+)\/student/) ||
                    t.match(/at the \$([\d,.]+)\/student statewide base rate/) || [])[1];
    if (!cap || !tgt || !stated) return;
    const eff = Number(cap.replace(/,/g, "")) / Number(tgt.replace(/,/g, ""));
    const say = Number(stated.replace(/,/g, ""));
    checked.push(td);
    // 1c tolerance on the rate, plus the rounding of a whole-dollar cap.
    if (Math.abs(eff - say) / say > 0.02) lying.push([eff, say, t.slice(0, 90)]);
  });
  check("every P-cell states a $/student rate that matches its OWN cap ÷ target",
    checked.length > 100 && lying.length === 0);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
