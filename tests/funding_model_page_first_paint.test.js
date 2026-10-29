// The public funding page paints the published scenario first (S519, 2026-10-29).
//
// Sam: "The public page still seems to load scenario 1 first and after a pause refreshes
// to scenario 4". The page painted at once from the code's defaults, which read as
// Scenario 1, then again when the shared config landed. It now waits while the module
// holds its first paint for the config (T.configHeld), keeps the markup's placeholder
// figures out of sight (.cplfund-holding), says the figures are loading, and paints when
// the hold ends. Here the config read never answers, so the hold ends on its 4 s timeout.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const results = [];
function check(name, ok) { results.push([name, !!ok]); }

const html = fs.readFileSync(path.join(ROOT, "funding-model", "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
const win = dom.window;
win.scrollTo = function () {};
win.fetch = function () { return new Promise(function () {}); };   // the config read never answers
win.eval(fs.readFileSync(path.join(ROOT, "cpl_funding_data.js"), "utf8"));
win.eval(fs.readFileSync(path.join(ROOT, "funding_model_payload.js"), "utf8"));
win.eval(fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8"));
Array.from(win.document.querySelectorAll("script:not([src])")).forEach(function (s) { win.eval(s.textContent); });

const root = win.document.documentElement;
const status = win.document.getElementById("live-status");
check("the module says its first paint is held for the shared config", win.CPL_FUNDING_TAB.configHeld() === true);
check("⭐ while it is held, the page keeps its placeholder figures out of sight",
  root.classList.contains("cplfund-holding") && /\.cplfund-holding main\{visibility:hidden\}/.test(html));
check("…and the status line says the figures are loading", !!status && /Loading the current figures/.test(status.textContent));

setTimeout(function () {
  check("⭐ when the hold ends, the page paints and shows itself",
    win.CPL_FUNDING_TAB.configHeld() === false && !root.classList.contains("cplfund-holding") && status.textContent === "");
  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 4600);
