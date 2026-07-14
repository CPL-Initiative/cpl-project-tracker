// "Our Process" tab (our_process.js) — guards the tab wiring + the renderer.
//   - Rule 4 (both HTMLs identical) + the nav button / pane / mount / lazy boot.
//   - nav_groups.js lists the tab in the Reference & Curation group.
//   - boot() renders the woven-systems viz into #our-process-root without
//     throwing, is idempotent (no double-render), and the "see it live" CTA
//     deep-links to the in-app #tmc-builder tab.
//   - Failure-mode guard: a headless/jsdom canvas (getContext → null) must NOT
//     crash boot() — this is the real reason wireContour bails on a null ctx.
//
// Run from repo root: `npm test` (or `node tests/our_process.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants on the shipped artifacts
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav has Our Process button", /data-tab="our-process" role="tab"/.test(cpl));
check("pane #tab-our-process exists", /id="tab-our-process"/.test(cpl));
check("mount #our-process-root exists", /id="our-process-root"/.test(cpl));
check("boot wiring: onActivate('our-process')", /onActivate\('our-process'/.test(cpl));
check("boot wiring: loadScript('our_process.js')", /loadScript\('our_process\.js'/.test(cpl));

const groupsSrc = fs.readFileSync("nav_groups.js", "utf8");
check("nav_groups.js lists 'our-process' in a group", /'our-process'/.test(groupsSrc));

const src = fs.readFileSync("our_process.js", "utf8");
check("our_process.js exposes CPL_OUR_PROCESS.boot", /window\.CPL_OUR_PROCESS\s*=\s*\{\s*boot/.test(src));
check("our_process.js carries no service key (static, no Supabase)", src.indexOf("service_role") === -1);
check("wireContour guards a null 2d context", /if\s*\(!ctx\)\s*return/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
// Part B — renderer behaviour in jsdom (canvas getContext returns null here,
// which is exactly the headless case the null-ctx guard protects)
// ─────────────────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html><html><body>
  <div class="cpl-tab-pane" id="tab-our-process"><div class="main-container">
    <div id="our-process-root"></div>
  </div></div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("our_process.js eval threw:", e); }
check("our_process.js evaluates without throwing", !threw);
check("module registered on window", window.CPL_OUR_PROCESS && typeof window.CPL_OUR_PROCESS.boot === "function");

let bootThrew = false;
try { window.CPL_OUR_PROCESS.boot(); } catch (e) { bootThrew = true; console.error("boot() threw:", e); }
check("boot() renders without throwing (null canvas ctx tolerated)", !bootThrew);

const root = document.getElementById("our-process-root");
check("renders the .opv container", root && root.querySelector(".opv"));
check("renders all four system cards", root && root.querySelectorAll(".op-node").length === 4);
check("renders the checkpoint loop svg", root && root.querySelector(".op-loop-flow"));
check("renders the four TMC problem stats", root && root.querySelectorAll(".op-problem .op-stat").length === 4);
check("renders the illustrated builder mock rows", root && root.querySelectorAll(".op-mock .op-mslot").length >= 4);

const cta = root && root.querySelector("a.op-livebtn");
check("'See it live' CTA deep-links to the in-app #tmc-builder tab", cta && cta.getAttribute("href") === "#tmc-builder");

// no IntersectionObserver in jsdom → reveal fallback shows everything
const reveals = root ? root.querySelectorAll(".op-reveal") : [];
check("reveal elements are shown (IntersectionObserver fallback)",
  reveals.length > 0 && Array.prototype.every.call(reveals, (el) => el.classList.contains("op-in")));

// idempotent: a second boot must not duplicate the DOM
window.CPL_OUR_PROCESS.boot();
check("boot() is idempotent (single .opv after a re-boot)",
  root && root.querySelectorAll(".opv").length === 1);

// injected CSS is scoped (no bare, un-prefixed global selectors that could leak)
const styleEl = document.getElementById("op-css");
check("scoped CSS is injected once", styleEl && document.querySelectorAll("#op-css").length === 1);
check("CSS scopes tokens under .opv (not :root)", styleEl && txt(styleEl).indexOf(".opv {") !== -1 && txt(styleEl).indexOf(":root") === -1);

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
