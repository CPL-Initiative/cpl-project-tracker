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

// One row per college: name, district, credit FTES, two-year offer, and the
// three flags the page marks — lifted to the minimum, held to the maximum, and
// carrying the rural guarantee.
const rows = D.colleges.map(function (c) {
  const a = T._alloc(c.college);
  return [c.college, c.district || "", Math.round(c.credit_ftes || 0), Math.round(a.total),
          a.floored ? 1 : 0, a.rural_w > 0 ? 1 : 0, a.capped ? 1 : 0];
}).sort(function (x, y) {
  // Six colleges now TIE at the ceiling, so the offer alone no longer orders
  // the table — fall back to size, which is what a reader expects to see and
  // what explains why those six are the ones held.
  return (y[3] - x[3]) || (y[2] - x[2]);
});

// The worked example must be a college whose offer is NOT bent by either bound
// — the whole point of the walk-through is that the arithmetic on the page
// produces the figure on the page. It used to be simply the largest college,
// which was safe while the floor was the only bound (the floor never touches
// the top). Sam's $400K MAXIMUM (2026-08-22) does, so the largest college is
// now pinned to a round number its own share does not explain, and walking
// through it would show a subtraction the reader cannot reproduce.
const unbound = rows.filter(function (r) { return !r[4] && !r[6]; });
const example = (unbound[0] || rows[0])[0];
const prios = T._prios(example, "1").map(function (p) {
  return { label: p.label, title: p.title || "", metric: p.metric, share: p.share,
           factor: p.factor == null ? 1 : p.factor,
           cap: Math.round(p.cap), target: +p.target.toFixed(1) };
});

// The effective rate an UNBOUND college earns at, measured off the model rather
// than derived by hand: its whole window offer over the sum of its window
// targets. The page used to carry this as a typed $5,060 — a figure that was
// correct when written and silently wrong after any dial moved.
const effRate = (function () {
  const name = (unbound[0] || rows[0])[0];
  const a = T._alloc(name);
  let money = 0, target = 0;
  Object.keys(a).filter(function (k) { return /_heads$/.test(k); }).forEach(function (k) {
    money += a[k.replace(/_heads$/, "")] || 0;
    target += a[k] || 0;
  });
  return target > 0 ? money / target : 0;
})();

const totals = rows.map(function (r) { return r[3]; }).slice().sort(function (a, b) { return a - b; });
// AVERAGE and MEDIAN are both emitted and both used, because they differ by
// $43,614 here and the gap is the point: a handful of very large colleges pull
// the average well above what a typical college actually sees. Labelling one
// with the other's number would state a false figure.
const avg = Math.round(totals.reduce(function (s, v) { return s + v; }, 0) / totals.length);
const payload = {
  pool: { one_time: pool("one_time_2026_27"), admin: pool("admin_cost"),
          scaling: pool("scaling_projects_tech"), feeder: pool("feeder_carveout"),
          rural: pool("rural_carveout"), floor: pool("floor_window"),
          cap: pool("cap_window"), rate: pool("ftes_rate_2026_27") },
  net_main: Math.round(T._netCollege()),
  rural_per: Math.round(pool("rural_carveout") / D.colleges.filter(function (c) { return c.rural; }).length),
  model: { floor: model.floor, floorCount: model.floorCount, floorCost: Math.round(model.floorCost),
           cap: model.cap, cappedCount: model.cappedCount, capReleased: Math.round(model.capReleased) },
  median: totals[Math.floor(totals.length / 2)],
  avg: avg,
  min: totals[0],
  max: totals[totals.length - 1],
  maxName: rows[0][0],
  atMin: rows.filter(function (r) { return r[4]; }).length,
  atMax: rows.filter(function (r) { return r[6]; }).length,
  exampleName: example,
  effRate: Math.round(effRate),
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
console.log("  at the maximum     " + payload.atMax + " colleges" +
  (payload.pool.cap ? " (ceiling " + money(payload.pool.cap) + ", releasing " +
    money(payload.model.capReleased) + ")" : " (no ceiling set)"));
console.log("  effective rate     " + money(effRate) + " per CPL FTES for an unbound college" +
  " (statewide base " + money(pool("ftes_rate_2026_27")) + ")");
console.log("  worked example     " + example + (example === rows[0][0] ? "" : "  (largest UNBOUND college)"));
prios.forEach(function (p) {
  console.log("  " + p.label + " " + (p.title || "(untitled)") + "  " + Math.round(p.share * 100) + "%" +
    "  factor " + p.factor + "  " + money(p.cap) + "  target " + p.target + " FTES");
});
console.log("\nNow re-publish " + path.relative(ROOT, PAGE) + " to the artifact URL in cpl_funding.js.");
