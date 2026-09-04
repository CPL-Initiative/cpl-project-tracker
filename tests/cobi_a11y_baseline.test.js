// COBI's app-wide accessibility baseline — the STRUCTURAL half of what
// `npm run a11y` measures.
//
// WHY BOTH INSTRUMENTS. scripts/a11y.js walks all 38 of COBI's hash routes in
// Chromium and measures geometry and paint; this file cannot re-derive any of
// that, because jsdom has no layout engine (getBoundingClientRect() returns
// zeroes, no breakpoint fires, no cascade resolves). What it CAN do is run in
// CI for free and pin the specific values whose return would put the failures
// back — the same split tests/public_pages_a11y.test.js established for Sierra.
//
// Every check below was a REAL defect on 2026-09-04, on EVERY ONE of COBI's 38
// views, because each lived in the chrome that every view paints:
//
//  (a) .cpl-nav-group-head — the sidebar group headings ("Workplan", "Funding")
//      were #8a8a86, a raw hex sitting on --text-faint, whose own token comment
//      reserves it for "decorative only — never essential text". Composited on
//      the glass rail: 3.38:1 against AA's 4.5. The caret inherits it.
//  (b) the same button measured 23.9px tall against WCAG 2.2 SC 2.5.8's 24px
//      floor — six controls, on every view, missing by a tenth of a pixel.
//  (c) .cpl-rail-auth-off — "— not unlocked", the line that tells a curator
//      whether they are signed in — was a raw #888 at 3.33:1.
//  (d) .cpl-sidebar-brand a (21.7px) and .qs-input (21.7px), both under the
//      24px floor. The brand link is how you get back to the dashboard.
//  (e) COBI declared FIVE animations and honoured prefers-reduced-motion in
//      none of them (WCAG 2.3.3): two progress bars grow on every render, and
//      a Where-To jump flashes the card it lands on and pulses the tab it left.
//  (f) .cplfl-imgfallback painted white-on-gradient at 3.08:1. Pure white would
//      not have fixed it either (3.50:1 over #a8842f) — the gradient itself had
//      to come down. That panel shows exactly when the network is poor.
//
// Run from repo root: `npm test` (or `node tests/cobi_a11y_baseline.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function val(name, fn) {
  try { check(name, fn()); } catch (e) { check(name + " [threw: " + e.message + "]", false); }
}

const IDX = fs.readFileSync("index.html", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const NAV = fs.readFileSync("nav_groups.js", "utf8");
const FL = fs.readFileSync("first_light.js", "utf8");
const A11Y = fs.readFileSync("cobi_a11y.js", "utf8");

// Rule 4: anything asserted about one HTML is asserted about both.
function both(name, re) { val(name, () => re.test(IDX) && re.test(DASH)); }

// ── (a)+(b) the sidebar group headings ──
// ⚠️ Match the DECLARATION, not the file: the comment beside the fix names the
// value it replaced, which is what a comment recording a defect is for.
val("nav: the group heading colour is a token, not the sub-AA #8a8a86",
  () => !/color:\s*#8a8a86/i.test(NAV) && /\.cpl-nav-group-head\{[^}]*color:var\(--text-muted/.test(NAV));
val("nav: the group heading clears the 24px target floor",
  () => /\.cpl-nav-group-head\{[^}]*min-height:24px/.test(NAV));

// ── (c) the rail's signed-out line ──
both("rail: the signed-out line is a token, not the sub-AA #888",
  /\.cpl-rail-auth-off\s*\{\s*color:\s*var\(--text-muted\)/);

// ── (d) the two chrome controls under the floor ──
both("brand: the sidebar brand link clears the 24px target floor",
  /\.cpl-sidebar-brand a \{[^}]*min-height:\s*24px/);
both("search: the Where To? box clears the 24px target floor",
  /\.qs-input \{[^}]*min-height:\s*24px/);

// ── (e) prefers-reduced-motion, app-wide ──
both("motion: cobi_a11y.js is loaded", /<script src="cobi_a11y\.js"><\/script>/);
val("motion: the baseline declares a reduced-motion block",
  () => /@media \(prefers-reduced-motion: reduce\)/.test(A11Y));
val("motion: it sweeps every element rather than naming today's five animations",
  () => /\*,\*::before,\*::after\{/.test(A11Y));
// ⚠️ NOT `animation: none`. The stand-down has to keep animationend firing, or
// handlers that wait for one never run — a silent break that looks like a fix.
val("motion: the stand-down is a near-zero duration, never a hard stop",
  () => /animation-duration:0\.001ms !important/.test(A11Y) &&
        !/animation:\s*none/.test(A11Y));
// ⚠️ jsdom reports readyState "loading" right after construction, so the module
// takes its DOMContentLoaded branch — which is the branch a real page takes too,
// and the one worth exercising. Fire the event rather than assuming the sheet.
function mount(times) {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { runScripts: "outside-only" });
  for (let i = 0; i < times; i++) {
    dom.window.eval(A11Y);
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  }
  return dom.window.document;
}
val("motion: it actually injects when required", () => {
  const st = mount(1).getElementById("cobi-a11y-baseline");
  return !!st && /prefers-reduced-motion/.test(st.textContent);
});
val("motion: injecting twice leaves one sheet",
  () => mount(2).querySelectorAll("#cobi-a11y-baseline").length === 1);

// ── (f) the First Light image fallback ──
val("first light: the fallback gradient no longer carries the sub-AA stops",
  () => !/linear-gradient\([^)]*#a8842f/i.test(FL) && !/linear-gradient\([^)]*#6e7d52/i.test(FL));
val("first light: its text is full-opacity white",
  () => /\.cplfl-imgfallback\{[^}]*color:#fff/.test(FL));

// ── the sweep's own reach ──
// a11y.config.js discovers COBI's routes from the running nav. A stale selector
// would make the sweep measure NOTHING and still print a clean bill, so the
// runtime guard (zero routes = FAIL) gets a static partner: the selector has to
// keep matching the markup CI can see.
val("sweep: the config loads and names COBI", () => {
  const cfg = require("../a11y.config.js");
  return !!(cfg.targets && cfg.targets.cobi && cfg.targets.cobi.discover);
});
val("sweep: the discover selector still finds COBI's tabs in the markup", () => {
  const cfg = require("../a11y.config.js");
  const d = cfg.targets.cobi.discover;
  const doc = new JSDOM(IDX).window.document;
  const found = Array.from(doc.querySelectorAll(d.selector))
    .map((el) => el.getAttribute(d.attr)).filter(Boolean);
  return found.length >= 30 && found.indexOf("memory") !== -1;
});
val("sweep: every config target names a file that exists", () => {
  const cfg = require("../a11y.config.js");
  return Object.keys(cfg.targets).every((k) => fs.existsSync(cfg.targets[k].file));
});
val("sweep: `npm run a11y` is wired", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  return pkg.scripts && pkg.scripts.a11y === "node scripts/a11y.js";
});

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (failed ? failed + " of " + results.length + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
