// tests/cpl_funding_metric_wiring.test.js
//
// Guards the class of bug that cost a debugging round on 2026-07-30: the Excel
// workbook + builder were RETIRED 2026-07-03, so cpl_funding_data.js is
// hand-maintained and NOTHING keeps its baked priority defaults in sync with the
// live Supabase config a curator actually edits. They can only go stale — and a
// slot whose metric is null falls back to that stale default silently.
//
// A priority whose metric MAP cannot measure pays EVERY college its full cap as
// an advance, so it earns nothing and incentivises nothing. That is invisible
// unless something says so out loud.
//
// Run from repo root: `npm test`.
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const D = (function () {
  var sandbox = { window: {} };
  new Function("window", dataSrc).call(sandbox, sandbox.window);
  return sandbox.window.CPL_FUNDING;
})();

// Rebuild MEASURES out of the consumer so the test uses the REAL predicates.
const has = (m, s) => String(m || "").toLowerCase().indexOf(s) !== -1;
const start = consumerSrc.indexOf("var MEASURES = [");
const end = consumerSrc.indexOf("];", start) + 2;
const MEASURES = eval("(" + consumerSrc.slice(start + "var MEASURES = ".length, end - 1) + ")");
function measure(metric) {
  const m = String(metric || "").toLowerCase();
  return MEASURES.find(function (x) { return x.test(m); }) || null;
}

check("the metric-wiring diagnostic exists (a gap can't hide silently)",
  /function metricDiagnosticHtml/.test(consumerSrc) &&
  /inheriting baked default/.test(consumerSrc));
check("the diagnostic is curator-only (public readers don't need it)",
  /function metricDiagnosticHtml\(\)\s*\{\s*\n\s*if \(publicMode\(\)\) return "";/.test(consumerSrc));
check("prioMetricSource distinguishes curated from baked-default",
  /function prioMetricSource/.test(consumerSrc) && /return "baked"/.test(consumerSrc));

// EVERY Year-1 baked metric must resolve to a real feed. Year 1 is the live
// funding year; a gap there means the incentive is off for that priority.
(D.year_priorities["1"] || []).forEach(function (p, i) {
  const m = measure(p.metric);
  check("Y1 P" + (i + 1) + " baked metric is MEASURABLE (" + String(p.metric).slice(0, 52) + "…)",
    !!(m && m.src));
});

// Year 2 is knowingly gap-heavy today. Don't assert it's measurable — assert we
// KNOW, so nobody is surprised again. If a Year-2 metric later becomes
// measurable this flips and the count below should be updated deliberately.
const y2gaps = (D.year_priorities["2"] || []).filter(function (p) {
  const m = measure(p.metric);
  return !(m && m.src);
});
check("Year-2 gap count is the KNOWN 3 (update deliberately when a feed lands, don't let it drift)",
  y2gaps.length === 3);

// Every baked metric must at least MATCH a predicate — an unmatched metric falls
// through to "no measure" and pays a silent advance with no explanation at all.
["1", "2"].forEach(function (slot) {
  (D.year_priorities[slot] || []).forEach(function (p, i) {
    const m = measure(p.metric);
    check("Y" + slot + " P" + (i + 1) + " matches a MEASURES predicate (measurable OR a NAMED gap)",
      !!m && (!!m.src || !!m.gap_short));
  });
});

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
