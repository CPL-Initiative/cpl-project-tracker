// tests/cpl_funding_frontload.test.js
//
// Front-loaded disbursement: what money is on the table, and what it is earned
// against (Sam, 2026-07-30).
//
// Sam's design: "if we doubled the per-student amount when Front Load is
// selected (rather than doubling the students, which would make it twice as
// hard) … offer big funding up front for a big push the first year and then roll
// the unspent funds to Year 2. I would love to be out of funding at the end of
// Year 1 because it would mean everyone is up and running."
//
// The mechanism is NOT a special-case multiplier. Front-load already puts the
// whole window in the Year-1 cell; the fix is that the whole window is now
// EARNED against the Year-1 targets too. The doubled per-student rate falls out
// of that: same target, twice the money behind it.
//
// This also closes a live defect. Before the `slotEntitlement`/`prioCap` seam,
// front-load earned each year on ITS OWN slot's metrics and summed both into the
// Year-1 cell — so Year 2's three unmeasurable metrics paid every college a full
// ADVANCE for half the window regardless of what it posted in MAP. Both live
// scenarios have front-load ON, so this was real money reading wrong today.
//
// Lives in its own file deliberately: each test file gets a fresh process, and
// ending the process is the ONLY thing that reclaims a booted jsdom window —
// which is why the 2,955-line cpl_funding.test.js was itself split into nine
// suites on 2026-08-20. Budget + measurements:
// tests/lib/cpl_funding_harness.js.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_frontload.test.js`).
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
// All three Year-1 metrics are measurable against this feed. `over` posts far
// past its target on every one, so it earns 100% of whatever cap is on the table
// — which is what isolates the SCOPE change from the earning logic.
function perfHittingTarget(window, over) {
  const big = { pe: 999999, p2: 999999, p3: 999999, pp: 999999 };
  const colleges = {};
  (over || ["Alameda"]).forEach(function (n) { colleges[n] = big; });
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-30", suppress_below: 5,
    statewide: big, colleges: colleges, unmatched: {}
  };
  return window.CPL_FUNDING_PERF;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
// The tab exports _alloc(name) (one college's shaped allocation) but no row
// list — build one over the baked roster.
function allRows(T) {
  return D.colleges.map(function (c) {
    var a = T._alloc(c.college);
    if (!a) return null;
    a.college = c.college; a.rural = !!c.rural;
    return a;
  }).filter(Boolean);
}
function setViewSlot(T, slot) { T._state.viewSlot = String(slot); T.render(); }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — the seam exists and is the SINGLE place scope is decided
// ─────────────────────────────────────────────────────────────────────────────
check("slotEntitlement is the seam for 'what money slot N puts on the table'",
  /function slotEntitlement\(W, slot\)/.test(consumerSrc));
check("prioCap routes a priority's slice through that seam",
  /function prioCap\(W, slot, p\)/.test(consumerSrc));
check("slotIsCarryover names the front-loaded later years",
  /function slotIsCarryover\(slot\)/.test(consumerSrc));
// The whole point of the seam is that nothing computes its own per-priority
// scope any more. If this fires, a site has drifted back to the old formula and
// the two modes can silently disagree again.
{
  // ONE named exemption: prioEntitlement (added 2026-07-31 for the CPL-FTES
  // target) computes the PRE-FLOOR, PRE-RURAL, PER-YEAR proportional entitlement
  // and must NOT route through prioCap — prioCap returns the whole window in
  // slot 1 under front-load, so a target built on it would double alongside the
  // cap, the ratio would cancel, and the front-load incentive would silently
  // vanish. Exempt the one function; assert the property that makes it safe.
  const entBody = (consumerSrc.match(/function prioEntitlement\(c, p\)[\s\S]*?\n  \}/) || [""])[0];
  check("prioEntitlement exists and is the only exemption",
    /\* p\.share \/ nYears\(\)/.test(entBody));
  check("prioEntitlement is front-load BLIND (a target must not double with the cap)",
    entBody.length > 0 && !/frontload|slotEntitlement|prioCap/.test(entBody));
  // Still FLOOR-free: the target rides the college's PRE-FLOOR proportional
  // share, which is the whole point of the exemption. It is deliberately NOT
  // ceiling-free — capScale() is the single seam through which the maximum
  // lowers a capped college's target with its money (2026-08-22). Naming that
  // seam here means a future edit cannot quietly widen the exemption: anything
  // OTHER than capScale reaching into this function is the regression.
  check("prioEntitlement rides the PRE-FLOOR share (sizePct x netCollege, never allocModel W)",
    /sizePct\(c\)/.test(entBody) && /netCollege\(\)/.test(entBody) &&
    !/allocModel|\bW\b|rural/.test(entBody));
  check("prioEntitlement's ONLY bound-awareness is capScale()",
    /capScale\(c\)/.test(entBody) &&
    /function capScale/.test(consumerSrc) &&
    /m\.capped\[c\.college\]/.test((consumerSrc.match(/function capScale\(c\)[\s\S]*?\n  \}/) || [""])[0]));

  // SECOND named exemption (2026-08-27): ncPrioEntitlement, the NONCREDIT lane's
  // counterpart. Same role, same rationale — the pre-bounds, per-year
  // proportional entitlement that prioTarget divides by the price — over the
  // noncredit carve-out instead of the college pool. It is exempted BY NAME and
  // then held to the SAME three properties, so the exemption cannot be widened
  // into a hole: a future lane that quietly computes its own W × share ÷ nYears
  // still fires this.
  const ncEntBody = (consumerSrc.match(/function ncPrioEntitlement\(inst, p\)[\s\S]*?\n  \}/) || [""])[0];
  check("ncPrioEntitlement exists and is the second, named exemption",
    /\* p\.share \/ nYears\(\)/.test(ncEntBody));
  check("ncPrioEntitlement is front-load BLIND (an NC target must not double with its cap)",
    ncEntBody.length > 0 && !/frontload|SlotEntitlement|PrioCap/i.test(ncEntBody));
  check("ncPrioEntitlement rides the PRE-BOUNDS noncredit share (ncSizePct x the carve-out, never the floored award)",
    /ncSizePct\(inst\)/.test(ncEntBody) && /ncModel\(\)\.pool/.test(ncEntBody) &&
    !/ncAward|\.W\[/.test(ncEntBody));
  check("ncPrioEntitlement's ONLY bound-awareness is ncCapScale() — the noncredit floor raises money, never the bar",
    /ncCapScale\(inst\)/.test(ncEntBody) &&
    /m\.capped\[inst\.key\]/.test((consumerSrc.match(/function ncCapScale\(inst\)[\s\S]*?\n  \}/) || [""])[0]));

  const strays = (consumerSrc.replace(entBody, "").replace(ncEntBody, "")
      .match(/\*\s*p\.share\s*\/\s*nYears\(\)/g) || []).length +
    (consumerSrc.match(/\*\s*p\.share\s*\/\s*ny\b/g) || []).length;
  check("no OTHER site computes W × p.share ÷ nYears on its own (all go through prioCap)",
    strays === 0);
}
check("targets are NOT scaled by disbursement (per-student rate doubles, student count does not)",
  /function prioTargetRate/.test(consumerSrc) &&
  !/function prioTargetRate[\s\S]{0,400}frontload/.test(consumerSrc));

// ─────────────────────────────────────────────────────────────────────────────
// Part B — conservation + the doubled rate
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  perfHittingTarget(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const ny = D.default_years.length || 2;

  T._setScenario({ disbursement: "even" });
  T.render();
  const evenRows = allRows(T);
  const evenTotal = evenRows.reduce(function (s, r) { return s + r.total; }, 0);
  const evenP1 = evenRows.find(function (r) { return r.college === "Alameda"; });

  T._setScenario({ disbursement: "frontload" });
  T.render();
  const flRows = allRows(T);
  const flTotal = flRows.reduce(function (s, r) { return s + r.total; }, 0);
  const flP1 = flRows.find(function (r) { return r.college === "Alameda"; });

  // Front-load moves TIMING, never the amount.
  check("front-load conserves the window: Σ college caps identical to even tranches",
    near(evenTotal, flTotal, 1));
  check("front-load conserves a single college's window cap", near(evenP1.total, flP1.total, 0.01));

  // The whole window lands in the Year-1 cell (this part predates the change).
  check("front-load puts the whole window in the Yr-1 cell", near(flP1.y1, flP1.total, 0.01));
  check("front-load leaves later years empty (carryover)", near(flP1.y2 || 0, 0, 0.01));

  // …and now the per-priority CAP follows it, while the TARGET does not. That
  // is the doubled per-student rate, expressed structurally.
  const pKey = Object.keys(evenP1).find(function (k) { return /_heads$/.test(k); });
  const key = pKey.replace(/_heads$/, "");
  check("front-load multiplies a priority's cap by the window length",
    evenP1[key] > 0 && near(flP1[key], evenP1[key] * ny, 1));
  check("front-load leaves the STUDENT TARGET untouched (Sam: don't make it twice as hard)",
    evenP1[pKey] > 0 && near(flP1[pKey], evenP1[pKey], 0.001));
  check("⇒ the effective per-student rate doubles on a 2-year window",
    near((flP1[key] / flP1[pKey]) / (evenP1[key] / evenP1[pKey]), ny, 0.001));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part C — the defect: Year-2 gap metrics no longer advance into the Yr-1 cell
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  perfHittingTarget(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // Year 2's baked metrics are all data gaps today (guarded in
  // cpl_funding_metric_wiring.test.js). Under EVEN they legitimately advance —
  // that half of the window has no measurable metric.
  T._setScenario({ disbursement: "even" });
  T.render();
  const evenRow = T._alloc("Alameda");
  check("even tranches: the Year-2 gap metrics DO advance (nothing can measure them)",
    (evenRow.earned_advance || 0) > 0);

  // Under front-load no Year-2 money is on the table, so nothing rides on those
  // metrics at all. Every Year-1 metric is measurable, so the advance is ZERO.
  T._setScenario({ disbursement: "frontload" });
  T.render();
  const flRow = T._alloc("Alameda");
  check("front-load: NO advance — Year-2's unmeasurable metrics carry no money",
    near(flRow.earned_advance || 0, 0, 0.5));
  check("front-load: the earned figure is measured, not advanced",
    (flRow.earned_measured || 0) > 0 &&
    near(flRow.earned_measured + (flRow.earned_guaranteed || 0), flRow.earned_total, 1));

  // The payoff Sam is buying: a college that hits its Year-1 target draws the
  // WHOLE window in Year 1. ("I would love to be out of funding at the end of
  // Year 1 because it would mean everyone is up and running.")
  check("front-load: hitting the Year-1 target draws the whole window",
    near(flRow.earned_total, flRow.total, 1));
  // Under even, hitting the same Year-1 target draws only Year 1's half on the
  // measured side — the rest is a Year-2 advance, not an achievement.
  check("even: the same performance earns measurably LESS on achievement",
    (evenRow.earned_measured || 0) < (flRow.earned_measured || 0) - 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — a non-participant still earns $0 (the incentive survives)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-30", suppress_below: 5,
    statewide: { pe: 40000, p2: 4000, p3: 16000, pp: 5 },
    colleges: { "Alameda": { pe: 999999, p2: 999999, p3: 999999, pp: 999999 } },
    unmatched: {}
  };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ disbursement: "frontload" });
  T.render();
  const rows = allRows(T);
  const poster = rows.find(function (r) { return r.college === "Alameda"; });
  const nonPoster = rows.find(function (r) {
    return r.college !== "Alameda" && r.total > 0 && !r.rural && !r.gate_blocked;
  });
  check("front-load: a college posting nothing still earns $0 on the main allocation",
    nonPoster && near(nonPoster.earned_total - (nonPoster.earned_guaranteed || 0), 0, 0.5));
  check("front-load: a college over its target is capped at its window cap",
    poster && near(poster.earned_total, poster.total, 1));
  check("front-load: unearned money is real (Σ earned < Σ cap while colleges lag)",
    rows.reduce(function (s, r) { return s + (r.earned_total || 0); }, 0) <
    rows.reduce(function (s, r) { return s + r.total; }, 0) - 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E — a front-loaded later year READS as carryover, never as $0
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  perfHittingTarget(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ disbursement: "frontload" });
  T.render();

  check("front-load: the year filter marks the carryover year",
    doc.querySelector("#cplFundYear").textContent.indexOf("↻") !== -1);
  const flLine = doc.querySelector(".cplfund-prio .cplfund-fl-line");
  check("front-load: the priority card states the window is on the table in Year 1",
    !!flLine && /full .* window/i.test(flLine.textContent) &&
    flLine.textContent.indexOf("Effective") !== -1);
  check("front-load: the priority card names the SAME student target",
    !!flLine && /same .*-student target|that same/.test(flLine.textContent));

  // Switch the viewed year to the carryover year.
  setViewSlot(T, "2");
  const cells = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-prio");
  check("carryover year: P-cells read ↻ carryover, not a wall of $0",
    cells.length > 0 &&
    Array.from(cells).every(function (td) { return td.textContent.indexOf("↻ carryover") !== -1; }));
  check("carryover year: no misleading 'earned $0 of $0 cap' line",
    !doc.querySelector(".cplfund-prio .cplfund-earned-line"));
  check("carryover year: the priority card explains where the money went",
    doc.querySelector(".cplfund-prio").textContent.indexOf("carryover") !== -1);

  // The money columns themselves are unchanged by the viewed year.
  const row = T._alloc("Alameda");
  check("carryover year: the college's window cap is unchanged by which year is viewed",
    row.total > 0 && near(row.y1, row.total, 0.01));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — even tranches are bit-for-bit what they were (the seam reduces)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  perfHittingTarget(window);
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const ny = D.default_years.length || 2;
  T._setScenario({ disbursement: "even" });
  T.render();
  const rows = allRows(T);
  const r = rows.find(function (c) { return c.college === "Alameda"; });
  const key = Object.keys(r).find(function (k) { return /_heads$/.test(k); }).replace(/_heads$/, "");
  // prioCap(W, slot, p) must reduce EXACTLY to the historical W × share ÷ nYears
  // under even tranches. Rebuild it from the baked share so the reduction is
  // checked against an independent source, not restated from the same call.
  {
    const share = D.year_priorities["1"][0].share;
    const pKeyName = D.year_priorities["1"][0].key;
    check("even: a priority's cap is still the historical W × share ÷ nYears",
      r[pKeyName] > 0 && near(r[pKeyName], r.w * share / ny, 0.01));
  }
  check("even: Σ per-year caps == the window cap",
    near((r.y1 || 0) + (r.y2 || 0), r.total, 0.01));
  check("even: each year carries an equal tranche", near(r.y1, r.total / ny, 1));
  check("even: Σ college rows still equals the whole distributed college pool",
    // No rural component to add back since 2026-08-22 — the pool IS netCollege().
    near(rows.reduce(function (s, x) { return s + x.total; }, 0), T._netCollege(), 5));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — the PROSE must move with the money
// ─────────────────────────────────────────────────────────────────────────────
// Every scope change that leaves an explainer behind re-creates exactly the
// mismatch the toggle retirement was for: a number that says one thing and a
// sentence beside it that says another.
{
  const { window } = freshDom();
  perfHittingTarget(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  T._setScenario({ disbursement: "even" });
  T.render();
  const evenExplain = doc.querySelector(".cplfund-formula, .cplfund-howto") || doc.body;
  check("even: the 'how an allocation is computed' bullet still quotes the ANNUAL tranche",
    evenExplain.textContent.indexOf("one annual tranche") !== -1);

  T._setScenario({ disbursement: "frontload" });
  T.render();
  const flExplain = doc.querySelector(".cplfund-formula, .cplfund-howto") || doc.body;
  check("front-load: the explainer stops quoting an annual tranche",
    flExplain.textContent.indexOf("one annual tranche") === -1);
  check("front-load: the explainer names the full window + the multiplied per-student rate",
    /full .* window, placed on the table in Year 1/.test(flExplain.textContent) &&
    /effective rate per student is \d+×/.test(flExplain.textContent));

  // The P-cell hover: a plain college's cap is nYears× the annual base rate, so
  // calling that "the statewide base rate" without saying front-load is false.
  const cell = doc.querySelector("#cplFundTable tbody tr.cplfund-row td.cf-prio");
  const title = cell ? cell.getAttribute("title") || "" : "";
  check("front-load: the P-cell hover discloses the front-loaded base rate",
    title.indexOf("Front-loaded") !== -1 && /statewide base works out to/.test(title));
  check("front-load: the hover does NOT claim the doubled cap sits at the annual base rate",
    !/at the \$[\d,.]+\/student statewide base rate\.$/.test(title));

  // The rural allowance is retired (2026-08-22), so no hover may still offer one
  // — a stale promise of money is worse than no explanation at all.
  const hovers = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-prio"))
    .map(function (td) { return td.getAttribute("title") || ""; }).join(" ");
  check("front-load: no hover still promises a guaranteed rural allowance",
    hovers.length > 0 && !/rural allowance/.test(hovers));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
