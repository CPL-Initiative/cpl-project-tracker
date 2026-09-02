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
// wantsUnits() is referenced from inside the predicates, so it must exist in
// scope when they run — rebuild it from the consumer's own definition.
const wantsUnits = (function () {
  const m = consumerSrc.match(/function wantsUnits\(m\) \{[\s\S]*?\n  \}/);
  return eval("(" + m[0].replace(/^function wantsUnits/, "function") + ")");
})();
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
// Was 3 until 2026-07-31: "Units of Transcribed CPL" became MEASURABLE when the
// builder started emitting unit sums — that gap's own text said "builder
// extension queued", and this is the extension. The remaining two both need the
// CO's MIS match-back.
check("Year-2 gap count is the KNOWN 2 (update deliberately when a feed lands, don't let it drift)",
  y2gaps.length === 2);

// ── UNIT AGREEMENT (2026-07-31) ─────────────────────────────────────────────
// The assertion that would have caught Sam's mis-wire. "Measurable" is not
// enough: "Eligible CPL Units as FTES" resolved to `pe`, a student COUNT, and
// every existing check passed because `src` was truthy. A measure has to return
// the QUANTITY its metric asks for.
check("every measurable MEASURES entry declares its unit",
  MEASURES.filter(function (x) { return x.src; }).every(function (x) {
    return x.unit === "units" || x.unit === "students";
  }));
[["1", D.year_priorities["1"]], ["2", D.year_priorities["2"]]].forEach(function (pair) {
  (pair[1] || []).forEach(function (p, i) {
    const m = measure(p.metric);
    if (!m || !m.src) return;                       // a named gap has no unit to agree with
    const wantU = wantsUnits(String(p.metric || "").toLowerCase());
    check("Y" + pair[0] + " P" + (i + 1) + " measure returns the quantity the metric asks for (" +
      (wantU ? "units" : "students") + ")",
      m.unit === (wantU ? "units" : "students"));
  });
});
// Sam's live FTES strings must resolve to UNIT measures — the regression this
// whole change exists to prevent.
[["Eligible CPL Units as FTES (1 Unit = .0334 FTES)", "pe_u"],
 ["Transcribed CPL Units as FTES (1 Unit = .0334 FTES)", "p3_u"],
 ["Transcribed Units for Students from either CPL Student Portal or College CPL Landing Page", "pp_u"]
].forEach(function (pair) {
  const m = measure(pair[0]);
  check("live FTES metric resolves to " + pair[1] + " (units): " + pair[0].slice(0, 44) + "…",
    !!m && m.src === pair[1] && m.unit === "units");
});
// …and the headcount metrics that merely MENTION units must NOT flip to a unit
// measure. This is the trap the "does it say headcount" discriminator avoids.
[["Headcount with =>3 Units Eligible CPL", "pe"],
 ["Headcount with any transcribed CPL", "p3"],
 ["Headcount of students with transcribed Credit from either CPL Student Portal or CPL Landing Page", "pp"]
].forEach(function (pair) {
  const m = measure(pair[0]);
  check("headcount metric mentioning units stays a STUDENT measure: " + pair[0].slice(0, 40) + "…",
    !!m && m.src === pair[1] && m.unit === "students");
});
check("a headcount metric that mentions units still reaches its GAP, not a unit measure",
  (function () { const m = measure("Headcount with Completion and 3+ Transcribed CPL Units");
    return !!m && !m.src && /match-back/.test(m.gap_short || ""); })());
check("the diagnostic flags a unit mismatch (not just measurable-vs-gap)",
  /Unit mismatch/.test(consumerSrc) && /function wantsUnits/.test(consumerSrc));

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
