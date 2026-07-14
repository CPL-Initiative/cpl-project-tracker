// Quick-start "What are you working on" bar — guards the Session-60 placement +
// the pin (sticky) chrome:
//   (1) the bar mounts at the overall header level (right after .header),
//   (2) it's PINNED (position:sticky) on desktop, and
//   (3) the other viewport-level sticky elements (.cpl-sidebar, .filter-bar) are
//       offset by --qs-h so the pinned bar never covers them — the whole reason
//       the offset rules exist. Desktop-only so mobile keeps it in normal flow.
//
// Run from repo root: `npm test` (or `node tests/quickstart_header_bar.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const qs = fs.readFileSync("quickstart.js", "utf8");
const html = `<!DOCTYPE html><html><head></head><body>
  <div class="header"><h1>CPL</h1></div>
  <button id="cpl-hamburger"></button>
  <div class="cpl-layout">
    <aside class="cpl-sidebar"><nav class="cpl-tabs"><button class="cpl-tab" data-tab="dashboard">Dashboard</button></nav></aside>
    <main class="cpl-main"><div class="cpl-tab-pane" id="tab-dashboard"></div></main>
  </div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

let threw = false;
try { window.eval(qs); } catch (e) { threw = true; console.error("quickstart.js eval threw:", e); }
check("quickstart.js evaluates without throwing", !threw);

// Under jsdom readyState can still be 'loading' at eval time, so the IIFE
// defers mount to DOMContentLoaded — fire it to run the mount deterministically.
document.dispatchEvent(new window.Event("DOMContentLoaded"));
const bar = document.getElementById("qs-chat");
check("quick-start bar mounts", !!bar);
check("bar sits at the header level (immediately after .header)",
  bar && bar.previousElementSibling && bar.previousElementSibling.classList.contains("header"));
check("the search input is present; Go button removed (Enter submits)",
  bar && bar.querySelector(".qs-input") && !bar.querySelector(".qs-go"));

const css = document.getElementById("qs-chrome-css");
check("sticky-chrome CSS injected once", !!css);
check("bar is PINNED (position:sticky) on desktop", css && /#qs-chat\{position:sticky;top:0/.test(css.textContent));
check("left rail (.cpl-sidebar) is offset by --qs-h so the bar never covers it",
  css && /\.cpl-sidebar\{top:var\(--qs-h/.test(css.textContent));
check("Activities filter bar (.filter-bar) is offset by --qs-h",
  css && /\.filter-bar\{top:var\(--qs-h/.test(css.textContent));
check("pin is desktop-only (mobile keeps the bar in normal flow)",
  css && /@media \(min-width:901px\)/.test(css.textContent));
check("pinned bar gets an opaque background (content can't show through)",
  css && /#qs-chat\{position:sticky[^}]*#fffdf6/.test(css.textContent));

// idempotent: a second mount trigger must not duplicate the bar
document.dispatchEvent(new window.Event("DOMContentLoaded"));
check("only one #qs-chat in the DOM (mount is idempotent)", document.querySelectorAll("#qs-chat").length === 1);

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
