// tests/cpl_funding_basis.test.js
//
// The allocation basis: how big is an institution, and what is its share of the
// pool? (Sam, 2026-07-31 — "abandon headcount altogether and use college FTES";
// one-pool form adopted 2026-08-31 — COMBINED credit + noncredit FTES over 118
// institutions, the noncredit-only three as ordinary rows.)
//
// The FTES switch was decided on measurement, not argument. The objection was
// that FTES would penalise CPL-heavy colleges because working adults enrol
// part-time; it doesn't — corr(load factor, CPL penetration) = 0.086, and the
// switch moves money TOWARD the highest-CPL colleges. What settled it was data
// quality: credit FTES is uniform 2025-26, while headcount had 41/115 rows on
// 2022-23 vintage and 33/115 outside any credible FTES-per-head band (20 of
// those on CURRENT vintage — definitional drift, not staleness).
//
// These guard the properties that make the basis safe:
//   (a) ONE seam decides size — nothing computes its own share;
//   (b) conservation — Σ institution allocations equals the ONE pool, both bases;
//   (c) the headcount basis reduces to the proportional split, over the roster;
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
// The ONE-POOL roster (2026-08-31): every institution once — the 115 college
// rows plus the noncredit-only three as ordinary rows keyed by their shorts
// (Mt. SAC Noncredit rides the Mt San Antonio row, so it is NOT a name here).
const TRIO = D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; })
  .map(function (f) { return f.short; });
const ROSTER = D.colleges.map(function (c) { return c.college; }).concat(TRIO);
function allRows(T) {
  return ROSTER.map(function (n) {
    const a = T._alloc(n);
    if (!a) return null;
    a.college = n;
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
// Every college carries a per-college noncredit FTES, and under ONE POOL (Sam,
// adopted 2026-08-31) it is ALLOCATION INPUT, not a courtesy column: an
// institution's FTES size is credit + noncredit COMBINED, and the same figure
// drives the award's CR/NC decomposition (laneShareOf — the NC share restricted
// to the noncredit measures). The noncredit-only three are sized by their own
// noncredit FTES as ordinary rows, so nothing is funded twice: Mt. SAC NC's
// FTES ride the Mt San Antonio row and it gets no row of its own.
check("colleges carry a per-college noncredit FTES (one-pool sizing input)",
  D.colleges.every(function (c) { return typeof c.noncredit_ftes === "number"; }));
{
  const sizeBody = (consumerSrc.match(/function sizeOf\(c\)[\s\S]*?\n  \}/) || [""])[0];
  check("the FTES basis is COMBINED — sizeOf sums credit_ftes + noncredit_ftes (one pool, 2026-08-31)",
    /\(c\.credit_ftes \|\| 0\) \+ \(Number\(c\.noncredit_ftes\) \|\| 0\)/.test(sizeBody));
  // The headcount basis stays headcount ALONE — an institution's headcount
  // already describes its whole student body, and adding noncredit FTES to a
  // headcount would mix units.
  check("...while the headcount fallback path stays unit-pure (no noncredit FTES mixed into headcount)",
    /return c\.headcount \|\| 0;/.test(sizeBody) &&
    !/headcount[^\n]*noncredit_ftes|noncredit_ftes[^\n]*\+[^\n]*headcount/.test(sizeBody));
}
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
    check(basis + ": Σ institution allocations over all 118 == the ONE pool",
      // ONE POOL (2026-08-31): the carve-outs are folded in, so the distributed
      // pool IS netCollege() ($25,240,308) and the sum runs over the FULL
      // roster — the noncredit-only three included. A sum over the 115 college
      // rows alone under-counts by exactly the trio's awards.
      near(sum, T._netCollege(), 5));
    check(basis + ": every institution gets a positive allocation",
      rows.length === ROSTER.length && rows.every(function (r) { return r.total > 0; }));
    check(basis + ": no allocation falls below the floor",
      rows.every(function (r) { return r.total >= D.pool.floor_window - 0.5; }));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the headcount basis still reduces to the proportional split
// ─────────────────────────────────────────────────────────────────────────────
// The regression guard: swapping the DEFAULT must not change what the headcount
// basis computes. An unbound institution's share should equal its headcount
// share of the unbound remainder — the historical formula, now over the
// ONE-POOL roster (the noncredit-only three are sized by their own headcounts
// on this basis; one-pool adoption 2026-08-31).
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ allocationBasis: "headcount" });
  T.render();
  const m = T._model();
  const hcOf = {};
  D.colleges.forEach(function (c) { hcOf[c.college] = c.headcount; });
  D.feeders.forEach(function (f) { if (!f.nc_ftes_on_credit_row) hcOf[f.short] = f.headcount; });
  // UNBOUND = neither brought up to the base nor held at the cap. Sam's
  // $400K maximum (2026-08-22) added the second way to be bound; a capped
  // institution's share is its ceiling, not its headcount share, exactly as a
  // floored one's is its floor. Excluding a set from a test is only honest
  // if that set gets its own assertion, so the bound rows are checked below
  // rather than dropped.
  const unbound = ROSTER.filter(function (n) { return !m.floored[n] && !m.capped[n]; });
  const baseHc = unbound.reduce(function (s, n) { return s + hcOf[n]; }, 0);
  const remaining = unbound.reduce(function (s, n) { return s + (m.W[n] || 0); }, 0);
  const worst = unbound.reduce(function (mx, n) {
    const expect = hcOf[n] / baseHc * remaining;
    return Math.max(mx, Math.abs((m.W[n] || 0) - expect));
  }, 0);
  check("headcount basis reproduces the proportional split over the roster (max err < $1)", worst < 1);
  check("headcount basis: every bound institution sits exactly on its bound (base or cap)",
    ROSTER.filter(function (n) { return m.floored[n] || m.capped[n]; })
      .every(function (n) {
        const total = T._alloc(n).total;
        return m.floored[n]
          ? Math.abs(total - m.floor) < 0.5
          : Math.abs(total - m.cap) < 0.5;
      }));
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
  check("...and the ONE pool still balances with the fallback in play (all 118)",
    near(ROSTER.reduce(function (s, n) { return s + (T._alloc(n) || {}).total; }, 0),
      T._netCollege(), 5));
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
  // ⚠️ Assert the CONTRACT, not Sam's current wording — a pinned label string
  // goes red on a routine rename. Under ONE POOL (2026-08-31) the single
  // basis-flipping size column is RETIRED: the table carries the CR FTES / NC
  // FTES pair (the two halves of the combined basis and of every award's
  // decomposition), and the basis in force is named by the size cell's hover
  // ("the allocation basis") and by the explainer's formula — those flip with
  // the control; the FTES pair does not.
  const sizeTh = (k) => doc.querySelector('#cplFundTable thead th[data-sort="' + k + '"]');
  check("the table carries the CR FTES / NC FTES pair — the combined basis on the face",
    !!sizeTh("cr_ftes") && /FTES/i.test(sizeTh("cr_ftes").textContent) &&
    !!sizeTh("nc_ftes") && /FTES/i.test(sizeTh("nc_ftes").textContent));
  check("the explainer names the COMBINED basis in the allocation formula",
    /credit \+ noncredit FTES share/.test(doc.body.textContent));
  // Both figures must be reachable regardless of which one is the basis, and
  // the hover must SAY which one is in force.
  const cell = doc.querySelector("#cplFundTable tbody tr.cplfund-row td[title*='credit FTES']");
  check("the size cell hover carries BOTH figures + names the basis in force (FTES)",
    !!cell && /Headcount:/.test(cell.getAttribute("title")) &&
    /allocation basis/.test(cell.getAttribute("title")) &&
    /context only/.test(cell.getAttribute("title")));

  T._setScenario({ allocationBasis: "headcount" });
  T.render();
  const hcCell = doc.querySelector("#cplFundTable tbody tr.cplfund-row td[title*='headcount']");
  check("the size hover flips with the basis — headcount named as the basis, FTES demoted to context",
    !!hcCell && /the allocation basis/.test(hcCell.getAttribute("title")) &&
    /Credit FTES:.*context only/.test(hcCell.getAttribute("title")));
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
// Part H — cap and target must ride the SAME basis (and now the same LANE SLICE)
// ─────────────────────────────────────────────────────────────────────────────
// The defect this guards (shipped in #959, fixed 2026-07-31): the allocation
// basis moved to credit FTES while the performance target stayed denominated on
// headcount. cap / target then diverged from the statewide per-student rate by
// 0.49x (Santa Ana) to 2.11x (Las Positas) for 72 of 115 colleges — so a college
// was asked to hit a target sized for a different college, while the screen
// asserted the statewide base rate. Both bases must satisfy this; it is
// basis-independent by design.
//
// ONE-POOL form (2026-08-31): a credit priority's cap is the CR SLICE of the
// award (prioCap over instSplit(c).cr) and its per-college target must ride the
// same slice — the model statement is "a credit priority's per-college target
// rides only the CR slice of the entitlement (laneShareOf(c).cr)", and the
// expand's own Target header says "what the credit share funds at the
// priority's price".
//
// ⚠️ KNOWN PRODUCT BUG (measured 2026-08-31, this port): prioTarget's
// STUDENTS-unit path (the baked default config) reads
// `sizeOf(c) × capScale(c) × target_rate` — the COMBINED size, with no
// laneShareOf(c).cr — while the cap moved to the CR slice. Measured on the live
// roster: cap ÷ target spans a 1.5076× spread across unbound colleges (min
// $38.93, max $58.69 per student on the FTES basis; the same 1.5076× on
// headcount, since the scatter is the lane split itself), and applying
// laneShareOf(c).cr to the target closes the spread to exactly 1.000000. The
// FTES-unit path (prioEntitlement) DOES carry the lane slice — this is the
// students path only. The two checks below assert the equal-yardstick property
// and are EXPECTED TO FAIL until prioTarget's students return (the
// `sizeOf(c) * capScale(c) ... * p.target_rate` line) carries the lane slice;
// do not re-aim them to the buggy arithmetic.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  ["ftes", "headcount"].forEach(function (basis) {
    T._setScenario({ allocationBasis: basis });
    T.render();
    const m = T._model();
    const rows = allRows(T).filter(function (r) { return !r.nco; });   // the credit-earning rows
    // For an UNFLOORED college the CR cap is a pure proportional CR-slice share
    // and the target must be the same slice at the same price, so their ratio
    // must be ONE statewide per-student rate (capScale keeps capped rows on it).
    const plain = rows.filter(function (r) { return !m.floored[r.college]; });
    const key = Object.keys(rows[0]).find(function (k) { return /_heads$/.test(k); });
    const cap = key.replace(/_heads$/, "");
    const rates = plain.map(function (r) { return r[key] > 0 ? r[cap] / r[key] : null; })
      .filter(function (x) { return x != null; });
    const spread = Math.max.apply(null, rates) / Math.min.apply(null, rates);
    check(basis + ": cap ÷ target is the SAME rate for every unfloored college (no lane/basis mismatch)",
      plain.length > 20 && spread < 1.001);
  });
  T._setScenario({});

  // And whatever rate the tab STATES, it must equal the two numbers beside it.
  // The per-college P-cells are retired (one-pool port — per-priority detail
  // lives in the row expand, which states no rate); the surviving stated-rate
  // surface is the priority card's front-load line: "Combined funding: $W …
  // earned against that same N students target. Effective $E/student". The E
  // the reader sees has to survive dividing the W and N in the same sentence.
  T._setScenario({ disbursement: "frontload" });
  T.render();
  const lines = Array.from(doc.querySelectorAll(".cplfund-prio .cplfund-fl-line"));
  const checked = [];
  const lying = [];
  lines.forEach(function (el) {
    const t = el.textContent.replace(/\s+/g, " ");
    const w = (t.match(/Combined funding: \$([\d,]+)/) || [])[1];
    const n = (t.match(/that same ([\d,.]+) (?:students|CPL FTES) target/) || [])[1];
    const e = (t.match(/Effective \$([\d,.]+)\//) || [])[1];
    if (!w || !n || !e) return;
    const eff = Number(w.replace(/,/g, "")) / Number(n.replace(/,/g, ""));
    const say = Number(e.replace(/,/g, ""));
    checked.push(el);
    // 1c tolerance on the rate, plus the rounding of a whole-dollar cap.
    if (Math.abs(eff - say) / say > 0.02) lying.push([eff, say, t.slice(0, 90)]);
  });
  check("every stated Effective $/unit rate matches its OWN funding ÷ target (all 3 priority cards)",
    checked.length === 3 && lying.length === 0);
  T._setScenario({});
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
