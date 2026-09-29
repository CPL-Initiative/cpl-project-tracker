/* ============================================================================
   Regenerate the data baked into prototype/funding_model_explainer.html — the
   plain-language "How this funding model works" artifact linked from the
   Implementation Funding tab.

   ⚠ SUPERSEDED 2026-08-23 for the LIVE page. The tab now links to
   funding-model/index.html, served from Pages, which computes the same figures
   from the same engine and the live Supabase config on every load — so there is
   nothing to rebuild and nothing to go stale. Sam asked for that after changing
   two floors and finding the tab had recalculated while the artifact had not.

   This script is kept for one job: producing a FROZEN snapshot to hand to
   someone who needs stable numbers in an email — a figure that will not move
   under a reader mid-conversation. It writes prototype/funding_model_explainer.html
   only; it no longer feeds anything the tab links to. Both it and the live page
   build their payload with funding_model_payload.js, so a snapshot can differ
   from the live page only by WHEN it was taken, never by how it was computed.

   To take a snapshot:

     1. Read the live shared config (the sandbox reaches Supabase only through
        the MCP tools):
          select config::text from public.cpl_funding_config where id='default';
        Save it to a file.
     2. node prototype/build_funding_model_explainer.js <config.json>
        (omit the argument to use the baked defaults in cpl_funding_data.js.)
     3. Publish prototype/funding_model_explainer.html wherever the snapshot is
        wanted. Do NOT repoint SANITY_URL at it — that link is the live page now.

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

// The payload is built by the SHARED module, so the snapshot this script
// publishes and the live page served from Pages can never disagree about a
// figure. See funding_model_payload.js for why that matters.
const payload = require(path.join(ROOT, "funding_model_payload.js")).buildPayload(T, D);

const html = fs.readFileSync(PAGE, "utf8");
const marker = /(<script id="DATA" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!marker.test(html)) {
  console.error("could not find the DATA block in " + PAGE + " — has the page been restructured?");
  process.exit(1);
}
fs.writeFileSync(PAGE, html.replace(marker, "$1" + JSON.stringify(payload) + "$2"));

const money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };

// ── stale-default lint ───────────────────────────────────────────────────────
// The page ships STATIC text inside the elements its own script fills at render
// time, so a superseded figure is invisible in the browser and wrong the moment
// JS does not run (view-source, a saved copy, a reader with scripts off). This
// run found six `$150,000` defaults still in the source after the floor moved to
// $175,000. Every figure in this page comes from the engine — the defaults have
// to as well. Extend the map when you add a dial.
(function lintStaticDefaults() {
  const written = fs.readFileSync(PAGE, "utf8");
  const expect = {
    "f-floorv":  money(payload.pool.floor),
    "f-floor":   String(payload.model.floorCount),
    "f-floor-k": "institutions are brought up to the " + money(payload.pool.floor) + " base award",
    "r-min":     money(payload.min),
    "l-floor":   money(payload.pool.floor),
    "t-floor":   money(payload.pool.floor),
    "g-floor":   money(payload.pool.floor),
    "f-nc":      money(payload.nc.face),
    "l-nc-count": String(payload.nc.ncColleges),
    "t-nc":      money(payload.nc.face),
  };
  const stale = [];
  Object.keys(expect).forEach(function (id) {
    const m = written.match(new RegExp('id="' + id + '"[^>]*>([^<]*)<'));
    if (!m) { stale.push("  " + id + " — no such element (page restructured?)"); return; }
    const got = m[1].replace(/&mdash;/g, "\u2014").trim();
    if (got !== expect[id]) stale.push("  " + id + '  static "' + got + '"  renders "' + expect[id] + '"');
  });
  if (stale.length) {
    console.warn("\nSTALE STATIC DEFAULTS in " + path.relative(ROOT, PAGE) + " — the rendered page is");
    console.warn("correct, but the source disagrees with it. Update the markup:");
    stale.forEach(function (s) { console.warn(s); });
    console.warn("");
  }
})();

console.log("wrote " + path.relative(ROOT, PAGE));
console.log("  colleges           " + payload.rows.length);
console.log("  to institutions    " + money(pool("one_time_2026_27") - pool("admin_cost") -
  pool("scaling_projects_tech")));
console.log("  main pot           " + money(payload.net_main));
console.log("  average offer      " + money(payload.avg));
console.log("  median offer       " + money(payload.median));
console.log("  range              " + money(payload.min) + " – " + money(payload.max) + " (" + payload.maxName + ")");
console.log("  at the base        " + payload.model.floorCount + " institutions");
console.log("  at the cap         " + payload.atMax + " institutions" +
  (payload.pool.cap ? " (ceiling " + money(payload.pool.cap) + ", releasing " +
    money(payload.model.capReleased) + ")" : " (no ceiling set)"));
console.log("  noncredit face     " + money(payload.nc.face) + " of the one pool — " +
  money(payload.nc.collegeShares) + " riding " + payload.nc.ncColleges + " college awards + " +
  money(payload.nc.trioHeld) + " held by origination at the noncredit-only three");
console.log("  effective rate     " + money(payload.effRate) + " per CPL FTES for an unbound college" +
  " (statewide base " + money(pool("ftes_rate_2026_27")) + ")");
console.log("  worked example     " + payload.exampleName +
  (payload.exampleName === payload.rows[0][0] ? "" : "  (largest UNBOUND college)"));
payload.prios.forEach(function (p) {
  console.log("  " + p.label + " " + (p.title || "(untitled)") + "  " + Math.round(p.share * 100) + "%" +
    "  factor " + p.factor + "  " + money(p.cap) + "  target " + p.target + " FTES");
});
console.log("\nNow re-publish " + path.relative(ROOT, PAGE) + " to the artifact URL in cpl_funding.js.");
