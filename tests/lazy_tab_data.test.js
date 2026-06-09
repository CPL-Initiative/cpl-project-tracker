// Regression test for the lazy per-tab data loading (Session 36 perf fix).
//
// The dashboard used to eager-load ~17 MB of per-tab JSON (unified_courses_data.js
// 7.1 MB + statewide_data.js 6.6 MB + credential_reference_data.js 2.6 MB +
// statewide_prescriptive.js 0.6 MB) via plain <script> tags before the page was
// interactive — none of it needed by the default Dashboard tab — which froze the
// main thread and tripped the browser's slow-script warning. Those payloads are
// now LAZY-loaded on first activation of their owning tab (CCR/EACR/CER), driven
// by tabs.js's onActivate + loadScript helpers and each consumer's boot wiring.
//
// This guards the FAILURE MODE: (a) nobody re-adds the heavy data files as eager
// <script src> tags, (b) the two HTMLs stay identical (Rule 4), (c) the consumers
// keep their onActivate/loadScript wiring, and (d) tabs.js's helpers actually
// behave — fire onActivate exactly once on the right tab, NOT on the default tab,
// and inject each data script only on demand (idempotently).
//
// Run from repo root: `npm test` (or `node tests/lazy_tab_data.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const DATA_FILES = [
  "unified_courses_data.js",
  "statewide_data.js",
  "statewide_prescriptive.js",
  "credential_reference_data.js",
];
const CONSUMERS = ["unified_courses.js", "statewide_interactive.js", "credential_reference.js"];

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants on the shipped HTML + sources
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");

check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);

DATA_FILES.forEach(function (f) {
  const eagerTag = '<script src="' + f + '">';
  check("no eager <script> for " + f + " (CPL_Dashboard.html)", cpl.indexOf(eagerTag) === -1);
  check("no eager <script> for " + f + " (index.html)", idx.indexOf(eagerTag) === -1);
});
// The CONSUMER scripts must STILL be eager so they can register their boots.
CONSUMERS.forEach(function (f) {
  check("consumer " + f + " still eager in index.html", idx.indexOf('<script src="' + f + '">') !== -1);
});

// Each consumer wires the lazy boot for its tab + data file(s).
const ucSrc = fs.readFileSync("unified_courses.js", "utf8");
const swSrc = fs.readFileSync("statewide_interactive.js", "utf8");
const crSrc = fs.readFileSync("credential_reference.js", "utf8");
check("unified_courses.js: onActivate(unified-courses)", /CPL_TABS\.onActivate\("unified-courses"/.test(ucSrc));
check("unified_courses.js: loadScript(unified_courses_data.js)", /CPL_TABS\.loadScript\("unified_courses_data\.js"/.test(ucSrc));
check("statewide_interactive.js: onActivate(exhibit-adoption)", /CPL_TABS\.onActivate\("exhibit-adoption"/.test(swSrc));
check("statewide_interactive.js: loadScript(statewide_data.js)", /CPL_TABS\.loadScript\("statewide_data\.js"/.test(swSrc));
check("statewide_interactive.js: loadScript(statewide_prescriptive.js)", /CPL_TABS\.loadScript\("statewide_prescriptive\.js"/.test(swSrc));
check("credential_reference.js: onActivate(credential-reference)", /CPL_TABS\.onActivate\("credential-reference"/.test(crSrc));
check("credential_reference.js: loadScript(credential_reference_data.js)", /CPL_TABS\.loadScript\("credential_reference_data\.js"/.test(crSrc));

// The generator must no longer EAGER-inject the data files: the sw_scripts list
// (the eager block) must not name them, and the stale-tag stripper must.
const py = fs.readFileSync("excel_to_dashboard.py", "utf8");
const swListStart = py.indexOf("sw_scripts = [");
const swListEnd = py.indexOf("]", swListStart);
const swList = swListStart !== -1 ? py.slice(swListStart, swListEnd) : "";
check("generator sw_scripts excludes unified_courses_data.js", swList.indexOf("unified_courses_data.js") === -1);
check("generator sw_scripts excludes statewide_data.js", swList.indexOf("statewide_data.js") === -1);
check("generator strips deprecated eager data tags", /Strip the deprecated EAGER data/.test(py));
DATA_FILES.forEach(function (f) {
  check("generator stale-stripper lists " + f, new RegExp("stale[\\s\\S]{0,400}" + f.replace(".", "\\.")).test(py));
});

// ─────────────────────────────────────────────────────────────────────────────
// Part B — tabs.js onActivate / loadScript behaviour (jsdom)
// ─────────────────────────────────────────────────────────────────────────────
const tabsSrc = fs.readFileSync("tabs.js", "utf8");
const html = `<!DOCTYPE html><html><body>
  <nav class="cpl-tabs">
    <button class="cpl-tab" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="unified-courses">CCR</button>
    <button class="cpl-tab" data-tab="exhibit-adoption">EACR</button>
    <button class="cpl-tab" data-tab="credential-reference">CER</button>
  </nav>
  <div class="cpl-tab-pane" data-tab="dashboard">D</div>
  <div class="cpl-tab-pane" data-tab="unified-courses">U</div>
  <div class="cpl-tab-pane" data-tab="exhibit-adoption">E</div>
  <div class="cpl-tab-pane" data-tab="credential-reference">C</div>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
window.scrollTo = function () {};  // jsdom no-op (avoid "Not implemented" noise)

let threw = false;
try { window.eval(tabsSrc); } catch (e) { threw = true; console.error("tabs.js eval threw:", e); }
check("tabs.js evaluates without throwing", !threw);
// Trigger init if it deferred to DOMContentLoaded (no-op if it already ran).
try { window.document.dispatchEvent(new window.Event("DOMContentLoaded")); } catch (e) {}

const T = window.CPL_TABS;
check("CPL_TABS exposes onActivate + loadScript + current", T && typeof T.onActivate === "function" && typeof T.loadScript === "function" && typeof T.current === "function");
check("default active tab is dashboard", T && T.current() === "dashboard");

// onActivate for a NON-default tab must NOT fire while dashboard is active —
// THIS is the perf guarantee (the heavy data isn't pulled on the default load).
let ccrBoots = 0;
T.onActivate("unified-courses", function () { ccrBoots++; });
check("CCR boot does NOT fire on default (dashboard) load", ccrBoots === 0);

// onActivate for the CURRENTLY active tab fires immediately (deep-link/refresh).
let dashBoots = 0;
T.onActivate("dashboard", function () { dashBoots++; });
check("onActivate fires immediately when its tab is already active", dashBoots === 1);

// Activating the CCR tab fires its boot exactly once; re-activating doesn't repeat.
T.navigate("unified-courses");
check("CCR boot fires when its tab is activated", ccrBoots === 1);
T.navigate("unified-courses");
check("CCR boot does not re-fire on re-activation", ccrBoots === 1);

// loadScript injects the data script once, on demand, and fires cb on load.
let loaded = 0;
T.loadScript("unified_courses_data.js", "CPL_UNIFIED_COURSES", function () { loaded++; });
const injected = window.document.querySelectorAll('script[data-lazy-src="unified_courses_data.js"]');
check("loadScript injects exactly one data <script>", injected.length === 1);
check("cb not called until the script loads (global absent)", loaded === 0);
// Simulate the browser finishing the load.
window.CPL_UNIFIED_COURSES = { rows: [] };
injected[0].dispatchEvent(new window.Event("load"));
check("cb fires after the script's load event", loaded === 1);

// Idempotent: a second call with the global present fires immediately, no 2nd tag.
let loaded2 = 0;
T.loadScript("unified_courses_data.js", "CPL_UNIFIED_COURSES", function () { loaded2++; });
check("loadScript is idempotent (global present → immediate cb)", loaded2 === 1);
check("loadScript does not inject a duplicate <script>", window.document.querySelectorAll('script[data-lazy-src="unified_courses_data.js"]').length === 1);

// Fail-soft: an error still resolves cb so the consumer can render an empty state.
let errCb = 0;
T.loadScript("does_not_exist.js", "NOPE_GLOBAL", function () { errCb++; });
const errScript = window.document.querySelector('script[data-lazy-src="does_not_exist.js"]');
errScript.dispatchEvent(new window.Event("error"));
check("loadScript fails soft (cb fires on error)", errCb === 1);

// ─────────────────────────────────────────────────────────────────────────────
let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
