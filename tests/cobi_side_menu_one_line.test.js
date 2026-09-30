// COBI side menu — one item per line, one line per item, regular weight.
//
// Sam, 2026-09-30: "clean up the Cobi side menu so it doesn't wrap and isn't
// bold font. I want it to look clean and sleek." His screenshot showed three
// faults, all measured again in Chromium before the fix (1440px, the live
// cobi_nav overlay seeded into the cache):
//
//  (a) TWO ITEMS SHARED A LINE. A <button> is inline-level, and nav_groups.js
//      moves the rail buttons into a plain block <div>, so two short items sat
//      side by side whenever they fit: Contracts + Budget, Memory + Our Process.
//  (b) A LAUNCHER FLOWED INTO ITS NEIGHBOUR. The Fact Sheet and Ask Sierra
//      anchors carry an inline display:block, and the site filter's
//      `el.style.display = ''` clears it, so each became an inline run that
//      wrapped mid-word after My College and CPL News ("CPL Fact / heet").
//  (c) SIX LABELS WRAPPED to two lines at 220px (Common Credit Rec Reference
//      (CCRR) the longest), and every item was font-weight 600.
//
// jsdom has no layout engine, so this file pins the declarations whose loss
// brings each fault back; `npm run a11y` and a Playwright measure are the
// geometric half. Run: `node tests/cobi_side_menu_one_line.test.js`.
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function val(name, fn) {
  try { check(name, fn()); } catch (e) { check(name + " [threw: " + e.message + "]", false); }
}

const IDX = fs.readFileSync("index.html", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const NAV = fs.readFileSync("nav_groups.js", "utf8");

// The body of the first rule whose selector is exactly `sel`, comments removed.
function rule(src, sel) {
  const css = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp("(^|[}\\s])" + esc + "\\s*\\{([^}]*)\\}"));
  return m ? m[2].replace(/\s+/g, " ") : null;
}
function decl(body, prop, value) {
  return body != null && new RegExp("(^|;|\\s)" + prop + "\\s*:\\s*" + value + "\\s*(;|$)").test(body);
}

for (const [name, src] of [["CPL_Dashboard.html", DASH], ["index.html", IDX]]) {
  const tab = rule(src, ".cpl-sidebar .cpl-tab");
  // (a)+(b): a block that fills the rail cannot share its line, and a CSS rule
  // survives the inline-style clearing that (b) turned on.
  val(name + ": a rail item is a block", () => decl(tab, "display", "block"));
  val(name + ": a rail item fills the rail's width", () => decl(tab, "width", "100%"));
  // (c): one line per item, with an ellipsis rather than a wrap if a curator
  // names an item longer than the rail.
  val(name + ": a rail label never wraps", () => decl(tab, "white-space", "nowrap"));
  val(name + ": an over-long label ends in an ellipsis", () =>
    decl(tab, "text-overflow", "ellipsis") && decl(tab, "overflow", "hidden"));
  val(name + ": rail items are regular weight, not bold", () => decl(tab, "font-weight", "400"));
  const active = rule(src, ".cpl-sidebar .cpl-tab.active");
  val(name + ": the active item does not reintroduce bold", () =>
    active != null && !/font-weight/.test(active));
  // The rail's width is ONE token, read by the desktop grid and the mobile
  // slide-over alike, so the two cannot disagree about what fits.
  val(name + ": the desktop grid reads --rail-w", () =>
    decl(rule(src, ".cpl-layout"), "grid-template-columns", "var\\(--rail-w\\) 1fr"));
  val(name + ": --rail-w is declared on :root", () => /--rail-w:\s*\d+px;/.test(src));
  val(name + ": the mobile slide-over reads --rail-w", () =>
    /width:\s*min\(var\(--rail-w\),\s*86vw\)/.test(src));
}

// Rule 4: the rail rule must be the same text in both HTMLs.
val("Rule 4: .cpl-sidebar .cpl-tab is identical in both HTMLs", () =>
  rule(DASH, ".cpl-sidebar .cpl-tab") === rule(IDX, ".cpl-sidebar .cpl-tab"));

// nav_groups.js: the group body stacks its members, and the headings are not bold.
val("nav: a group body stacks its members in a column", () =>
  /\.cpl-nav-group-body\{display:flex;flex-direction:column;\}/.test(NAV));
val("nav: group headings are semibold, not bold", () =>
  /\.cpl-nav-group-head\{[^}]*font-weight:600/.test(NAV) &&
  !/\.cpl-nav-group-head\{[^}]*font-weight:700/.test(NAV));

let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (failed ? failed + " of " + results.length + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
