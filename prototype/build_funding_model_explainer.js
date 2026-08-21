/* ============================================================================
   Regenerate the data baked into prototype/funding_model_explainer.html — the
   plain-language "How this funding model works" artifact linked from the
   Implementation Funding tab.

   WHY THIS EXISTS. The artifact is a SNAPSHOT: it carries the pool waterfall,
   every college's two-year offer, and the three priorities as they stood when
   it was published. That is deliberate — a CO colleague opening it from an
   email should see stable numbers, not a page that silently re-reads a config
   somebody is mid-edit on. But a snapshot goes stale the moment Sam moves a
   dial, and re-deriving it by hand means re-reading the whole engine. So the
   numbers are COMPUTED by cpl_funding.js's own engine, never retyped:

     1. Read the live shared config (the sandbox reaches Supabase only through
        the MCP tools):
          select config::text from public.cpl_funding_config where id='default';
        Save it to a file.
     2. node prototype/build_funding_model_explainer.js <config.json>
        (omit the argument to use the baked defaults in cpl_funding_data.js.)
     3. Re-publish prototype/funding_model_explainer.html to the SAME artifact
        URL (see SANITY_URL in cpl_funding.js) so the tab's link still works.

   The engine is loaded through tests/lib/cpl_funding_harness.js, which is the
   one place that knows how to boot the tab in jsdom. Requires `npm install`.
   ========================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGE = path.join(__dirname, "funding_model_explainer.html");
const H = require(path.join(ROOT, "tests", "lib", "cpl_funding_harness.js"));

const { window } = H.freshDom();
H.boot(window);
const T = window.CPL_FUNDING_TAB;
const cfgPath = process.argv[2];
if (cfgPath) T._setConfig(JSON.parse(fs.readFileSync(cfgPath, "utf8")));
else console.warn("no config file given — using the BAKED defaults, which CLAUDE.md notes are stale by design.");

const D = window.CPL_FUNDING;
const pool = (k) => Number(T._pool(k));
const model = T._model();

// One row per college: name, district, credit FTES, two-year offer, and the two
// flags the page marks — lifted to the minimum, and carrying the rural guarantee.
const rows = D.colleges.map(function (c) {
  const a = T._alloc(c.college);
  return [c.college, c.district || "", Math.round(c.credit_ftes || 0), Math.round(a.total),
          a.floored ? 1 : 0, a.rural_w > 0 ? 1 : 0];
}).sort(function (x, y) { return y[3] - x[3]; });

// The worked example is the LARGEST college, because its offer is the one not
// bent by the floor — the arithmetic reads cleanly there.
const example = rows[0][0];
const prios = T._prios(example, "1").map(function (p) {
  return { label: p.label, title: p.title || "", metric: p.metric, share: p.share,
           factor: p.factor == null ? 1 : p.factor,
           cap: Math.round(p.cap), target: +p.target.toFixed(1) };
});

const totals = rows.map(function (r) { return r[3]; }).slice().sort(function (a, b) { return a - b; });
// AVERAGE and MEDIAN are both emitted and both used, because they differ by
// $43,614 here and the gap is the point: a handful of very large colleges pull
// the average well above what a typical college actually sees. Labelling one
// with the other's number would state a false figure.
const avg = Math.round(totals.reduce(function (s, v) { return s + v; }, 0) / totals.length);
const payload = {
  pool: { one_time: pool("one_time_2026_27"), admin: pool("admin_cost"),
          scaling: pool("scaling_projects_tech"), feeder: pool("feeder_carveout"),
          rural: pool("rural_carveout"), floor: pool("floor_window"), rate: pool("ftes_rate_2026_27") },
  net_main: Math.round(T._netCollege()),
  rural_per: Math.round(pool("rural_carveout") / D.colleges.filter(function (c) { return c.rural; }).length),
  model: { floor: model.floor, floorCount: model.floorCount, floorCost: Math.round(model.floorCost) },
  median: totals[Math.floor(totals.length / 2)],
  avg: avg,
  min: totals[0],
  max: totals[totals.length - 1],
  maxName: rows[0][0],
  atMin: rows.filter(function (r) { return r[4]; }).length,
  prios: prios,
  rows: rows,
};

const html = fs.readFileSync(PAGE, "utf8");
const marker = /(<script id="DATA" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!marker.test(html)) {
  console.error("could not find the DATA block in " + PAGE + " — has the page been restructured?");
  process.exit(1);
}
fs.writeFileSync(PAGE, html.replace(marker, "$1" + JSON.stringify(payload) + "$2"));

const money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
console.log("wrote " + path.relative(ROOT, PAGE));
console.log("  colleges           " + rows.length);
console.log("  to the colleges    " + money(pool("one_time_2026_27") - pool("admin_cost") -
  pool("scaling_projects_tech") - pool("feeder_carveout")));
console.log("  main pot           " + money(payload.net_main));
console.log("  average offer      " + money(payload.avg));
console.log("  median offer       " + money(payload.median));
console.log("  range              " + money(payload.min) + " – " + money(payload.max) + " (" + payload.maxName + ")");
console.log("  at the minimum     " + payload.model.floorCount + " colleges");
console.log("  worked example     " + example);
prios.forEach(function (p) {
  console.log("  " + p.label + " " + (p.title || "(untitled)") + "  " + Math.round(p.share * 100) + "%" +
    "  factor " + p.factor + "  " + money(p.cap) + "  target " + p.target + " FTES");
});
console.log("\nNow re-publish " + path.relative(ROOT, PAGE) + " to the artifact URL in cpl_funding.js.");
