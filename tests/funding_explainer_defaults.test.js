// tests/funding_explainer_defaults.test.js
//
// The audience-facing funding explainer (prototype/funding_model_explainer.html)
// fills its figures from an embedded JSON payload at render time, but the markup
// also carries a STATIC default inside each of those elements. A browser never
// shows the default, so it is a second source of truth that nothing exercises —
// and on 2026-08-22 six of them still said "$150,000" and one said "45 colleges"
// after the floor moved to $175,000 and 69. Wrong wherever the script does not
// run: view-source, a saved copy, a reader with scripts off, a PDF print of the
// raw file.
//
// The builder warns about this at build time (lintStaticDefaults() in
// prototype/build_funding_model_explainer.js). This is the CI half: the page in
// the repo must agree with the payload it ships, whether or not anyone ran the
// builder. Extend BOUND when a dial is added.
//
// Run from repo root: `npm test` (or `node tests/funding_explainer_defaults.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const PAGE = "prototype/funding_model_explainer.html";
const html = fs.readFileSync(PAGE, "utf8");

const m = html.match(/<script id="DATA" type="application\/json">([\s\S]*?)<\/script>/);
check("the page still carries its DATA payload", !!m);

if (m) {
  const D = JSON.parse(m[1]);
  const money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };

  // id → the string the page's own script writes into it.
  const BOUND = {
    "f-floorv":  money(D.pool.floor),
    "f-floor":   String(D.model.floorCount),
    "f-floor-k": "colleges land on the " + money(D.pool.floor) + " minimum",
    "r-min":     money(D.min),
    "l-floor":   money(D.pool.floor),
    "t-floor":   money(D.pool.floor),
    "g-floor":   money(D.pool.floor),
    "f-nc":      money(D.pool.feeder),
    "l-nc-count": D.nc ? String(D.nc.count) : null,
    "t-nc":      money(D.pool.feeder),
  };

  Object.keys(BOUND).filter(function (k) { return BOUND[k] != null; }).forEach(function (id) {
    const el = html.match(new RegExp('id="' + id + '"[^>]*>([^<]*)<'));
    if (!el) { check("#" + id + " exists in the page", false); return; }
    const got = el[1].replace(/&mdash;/g, "—").trim();
    check("#" + id + ' static default matches what it renders ("' + BOUND[id] + '")',
      got === BOUND[id]);
  });

  // The payload has to describe the model this repo actually ships, or the
  // defaults above are checked against a stale snapshot and agree for the wrong
  // reason. cpl_funding_data.js is the baked source of both bounds.
  const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
  const baked = (function () {
    const sandbox = { window: {} };
    new Function("window", dataSrc).call(sandbox, sandbox.window);
    return sandbox.window.CPL_FUNDING;
  })();
  const pool = baked.pool || {};
  check("the payload's floor is the repo's floor", D.pool.floor === pool.floor_window);
  check("the payload's ceiling is the repo's ceiling", D.pool.cap === (pool.cap_window || 0));

  // A retired mechanism must not survive in the prose of a document that goes
  // to the Chancellor's Office.
  check("the explainer no longer describes a rural allowance",
    !/rural/i.test(html.replace(m[0], "")));
  // Same rule, the noncredit lane's version: it was "the four noncredit
  // campuses" in five places, and stayed that way after the lane became 33
  // institutions — 30 of them credit colleges. A hand-typed count in an
  // audience-facing document is a claim nothing checks.
  check("the explainer no longer says the noncredit money goes to four campuses",
    !/four noncredit/i.test(html.replace(m[0], "")));
  check("the noncredit lane's size is stated from the payload",
    !!D.nc && D.nc.count > 4 && D.nc.colleges + D.nc.standalone === D.nc.count);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
