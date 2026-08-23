// tests/funding_model_page.test.js
//
// The LIVE funding explainer (funding-model/index.html), served from GitHub
// Pages. It replaced a published snapshot that had to be rebuilt and
// re-republished by hand every time a dial moved — and therefore silently
// disagreed with the model it claims to explain (Sam, 2026-08-23: he changed
// two floors, the tab recalculated, and the explainer did not).
//
// What this guards: the page computes from the ENGINE, carries no baked
// figures, and says so rather than showing stale ones if the computation fails.
//
// Run from repo root: `npm test` (or `node tests/funding_model_page.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "funding-model", "index.html"), "utf8");

// ── it must not ship a payload ────────────────────────────────────────────
check("the page carries NO baked payload block", html.indexOf('id="DATA"') === -1);
check("the page loads the engine and the shared payload builder",
  /src="\.\.\/cpl_funding\.js"/.test(html) &&
  /src="\.\.\/cpl_funding_data\.js"/.test(html) &&
  /src="\.\.\/funding_model_payload\.js"/.test(html));
check("it is a complete document, not an artifact fragment",
  /^<!doctype html>/i.test(html) && /<html lang="en">/.test(html) && /<\/body>\s*<\/html>/.test(html));
check("it repaints when the model changes, rather than painting once",
  /onModelChange/.test(html) && /ensureLoaded/.test(html));

// ── it must actually paint, from the engine ───────────────────────────────
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
const win = dom.window;
win.CPL_FUNDING_NO_REMOTE = true;          // no Supabase from a test
win.scrollTo = function () {};
win.eval(fs.readFileSync(path.join(ROOT, "cpl_funding_data.js"), "utf8"));
win.eval(fs.readFileSync(path.join(ROOT, "funding_model_payload.js"), "utf8"));
win.eval(fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8"));
// The page's own two inline scripts, in document order.
const inline = Array.from(dom.window.document.querySelectorAll("script:not([src])"))
  .map(function (s) { return s.textContent; });
inline.forEach(function (code) { win.eval(code); });

const doc = win.document;
const D = win.CPL_FUNDING_EXPLAINER.buildPayload(win.CPL_FUNDING_TAB, win.CPL_FUNDING);
const money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };

check("the engine's own figures reach the page's headline numbers",
  doc.getElementById("f-main").textContent === money(D.net_main) &&
  doc.getElementById("f-floorv").textContent === money(D.pool.floor));
check("the college table is painted from the engine's rows, all of them",
  doc.querySelectorAll("#tbody tr").length === D.rows.length && D.rows.length > 100);
check("the noncredit lane count comes from the model, not a typed word",
  doc.getElementById("l-nc-count").textContent === String(D.nc.count));
check("the status line is empty on a successful paint",
  (doc.getElementById("live-status").textContent || "").trim() === "");

// ── a failed computation must SAY so, never leave stale figures standing ──
{
  const dom2 = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w2 = dom2.window;
  w2.CPL_FUNDING_NO_REMOTE = true;
  w2.scrollTo = function () {};
  w2.eval(fs.readFileSync(path.join(ROOT, "cpl_funding_data.js"), "utf8"));
  w2.eval(fs.readFileSync(path.join(ROOT, "funding_model_payload.js"), "utf8"));
  w2.eval(fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8"));
  // Break the payload builder the way a real regression would.
  w2.CPL_FUNDING_EXPLAINER.buildPayload = function () { throw new Error("boom"); };
  Array.from(dom2.window.document.querySelectorAll("script:not([src])"))
    .map(function (s) { return s.textContent; })
    .forEach(function (code) { w2.eval(code); });
  const msg = (dom2.window.document.getElementById("live-status").textContent || "");
  check("a failed computation is disclosed, not silently left on placeholders",
    /out of date|could not compute/i.test(msg));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
