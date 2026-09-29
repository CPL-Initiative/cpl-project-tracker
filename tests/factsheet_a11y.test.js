// Fact Sheet — accessibility + mobile invariants (fact-sheet/) — jsdom + static test.
//
// Sam, 2026-08-20: "run a check on the Fact Sheet to make sure everything is
// accessible and mobile friendly." The audit found four real defects; this file
// keeps them fixed. What each check is actually protecting:
//
//  (a) SKIP LINK (WCAG 2.4.1). The page opens with a sticky action bar and a
//      20-entry Contents list, so without one a keyboard user tabs through ~25
//      controls to reach any content. It must be the FIRST focusable element
//      and must point at a target that can actually take focus.
//  (b) KEYBOARD-REACHABLE SCROLL REGION (WCAG 2.1.1). The funding table is
//      674px wide inside `.tbl-wrap{overflow-x:auto}` — mouse-draggable, and
//      invisible to a keyboard unless the container is focusable. factsheet.js
//      makes it focusable ONLY while it overflows, so it is never a dead tab
//      stop on a wide screen.
//  (c) NO SKIPPED HEADING LEVELS (WCAG 1.3.1 / technique G141). Fixed by
//      correcting the LEVEL and carrying the old LOOK on a utility class — so
//      the h2/h3 utilities must stay TAG-QUALIFIED. `h3.h-sub` does not match an
//      h2; classing the Contents heading with it silently dropped it to the
//      browser's default 2em, which no assertion here would have caught. That
//      one was found by a before/after screenshot, and the guard for it is the
//      pixel diff in fact-sheet/check_mobile_layout.js, not this file.
//  (d) MOBILE. The statewide grid's 5-column track needs 368px; measured in
//      Chromium at 360px the page scrolled sideways by 31px, the program name
//      printed ON TOP of its own figure, and "Could adopt" sat off-screen
//      inside `overflow:hidden` — unreachable, on a page that looked complete.
//      jsdom has no layout engine, so the real geometry is measured by
//      fact-sheet/check_mobile_layout.js (Chromium, run on demand). What IS
//      checkable here: the stacking rules exist and label every column.
//
//  (e) CONTRAST. Every foreground/background pair the page actually paints,
//      against AA 4.5:1 text / 3:1 non-text, computed — not asserted.
//
// Run from repo root: `npm test` (or `node tests/factsheet_a11y.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const CSS = fs.readFileSync("fact-sheet/factsheet.css", "utf8");
const JS = fs.readFileSync("fact-sheet/factsheet.js", "utf8");
const WORD = fs.readFileSync("fact-sheet/factsheet_word.js", "utf8");
const d = new JSDOM(HTML).window.document;

// ── (a) skip link ──
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
const firstFocusable = d.querySelector(FOCUSABLE);
check("a skip link exists", !!d.querySelector("a.skip-link"));
check("the skip link is the FIRST focusable element",
  firstFocusable && firstFocusable.classList.contains("skip-link"));
const skip = d.querySelector("a.skip-link");
const target = skip && d.getElementById((skip.getAttribute("href") || "#").slice(1));
check("the skip link points at a real element", !!target);
check("the skip target can take focus (tabindex=-1)", target && target.getAttribute("tabindex") === "-1");
check("the skip target is <main>", target && target.tagName === "MAIN");
check("CSS: skip link is off-screen until focused",
  /\.skip-link\s*\{[^}]*top:\s*-/.test(CSS) && /\.skip-link:focus\s*\{[^}]*top:\s*\d/.test(CSS));
check("CSS: the skip link never prints", /\.skip-link\s*\{\s*display:\s*none/.test(CSS.slice(CSS.indexOf("@media print"))) ||
  /\.actionbar,\s*\.no-print,\s*\.skip-link\s*\{\s*display:\s*none/.test(CSS));

// ── (b) scrolling region ──
check("factsheet.js wires .tbl-wrap as a focusable region", /function setupScrollRegions/.test(JS));
check("setupScrollRegions runs at load", /setupScrollRegions\(\);/.test(JS));
check("it is focusable ONLY while it overflows (no dead tab stop)",
  /scrollWidth > \w+\.clientWidth \+ 1/.test(JS) && /removeAttribute\('tabindex'\)/.test(JS));
check("it re-checks on resize", /addEventListener\('resize'/.test(JS));
check("its accessible name comes from the table's own <caption>", /querySelector\('caption'\)/.test(JS));
check("CSS: the scroll region shows a focus ring", /\.tbl-wrap:focus-visible/.test(CSS));
check("every data table still has a <caption>",
  [...d.querySelectorAll("table.data")].every((t) => !!t.querySelector("caption")));
check("every <th> still carries a scope",
  [...d.querySelectorAll("th")].every((th) => th.hasAttribute("scope")));

// ── (c) heading outline ──
const levels = [...d.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
check("exactly one h1", levels.filter((n) => n === 1).length === 1);
let skipped = [];
for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skipped.push(levels[i - 1] + "->" + levels[i]);
check("no skipped heading levels" + (skipped.length ? " (found " + skipped.join(", ") + ")" : ""), skipped.length === 0);
// The utilities that let LEVEL and LOOK disagree must be tag-qualified per level.
check("CSS: h3.h-sub is tag-qualified", /(^|\s|,)h3\.h-sub\s*\{/m.test(CSS));
check("CSS: h2.h-card is tag-qualified", /(^|\s|,)h2\.h-card\s*\{/m.test(CSS));
check("no BARE .h-sub/.h-card rule (an unqualified one would restyle both levels)",
  !/(^|[\s,}])\.h-(sub|card)\s*\{/m.test(CSS));
check("every .h-sub in the markup is an h3",
  [...d.querySelectorAll(".h-sub")].length > 0 && [...d.querySelectorAll(".h-sub")].every((h) => h.tagName === "H3"));
check("every .h-card in the markup is an h2",
  [...d.querySelectorAll(".h-card")].every((h) => h.tagName === "H2"));
check("the Word export mirrors h3.h-sub so card titles don't get promoted", /h3\.h-sub\{/.test(WORD));

// ── (d) mobile ──
check("viewport meta is present and scalable",
  /width=device-width/.test((d.querySelector("meta[name=viewport]") || { content: "" }).getAttribute("content") || "") &&
  !/user-scalable=no|maximum-scale=1/.test(HTML));
const narrow = CSS.slice(CSS.indexOf("@media (max-width: 560px)"));
check("CSS: a ≤560px block stacks the statewide row", /@media \(max-width: 560px\)/.test(CSS));
check("CSS: the .sw-head label strip is hidden there", /\.sw-head\s*\{\s*display:\s*none/.test(narrow));
check("CSS: the stacked row is a 4-up grid", /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/.test(narrow));
check("CSS: the program area spans the full row", /\.sw-sec\s*\{\s*grid-column:\s*1 \/ -1/.test(narrow));
// every column must carry its own label once the head strip is gone
["Exhibits", "Credit recs", "Adoptions", "Could adopt"].forEach((label) => {
  check(`CSS: the stacked row labels "${label}"`, new RegExp('content:\\s*"' + label + '"').test(narrow));
});
check("the labels are ::before content, so textContent (and the Word export) is untouched",
  /::before\s*\{[^}]*content/.test(narrow) || /::before\s+\{/.test(narrow));
check("the four .sw-col data-col keys the labels hang off still exist in the markup",
  ["ex", "rec", "adopt", "could"].every((k) => !!d.querySelector('.sw-col[data-col="' + k + '"]')));
check("the total row's 4th column is still positional (no data-tcol) as the CSS assumes",
  (() => { const t = d.querySelector(".sw-total"); if (!t) return false;
           const cols = t.querySelectorAll(".sw-col");
           return cols.length === 4 && !cols[3].hasAttribute("data-tcol"); })());
check("CSS: reduced motion is honoured", /@media \(prefers-reduced-motion: reduce\)/.test(CSS));

// ── (e) contrast — computed, not claimed ──
const tok = {};
(CSS.match(/--[\w-]+:\s*#[0-9A-Fa-f]{6}/g) || []).forEach((m) => {
  const [k, v] = m.split(/:\s*/); tok[k.trim()] = v.trim();
});
const h2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const over = (fg, alpha, bg) => h2rgb(fg).map((c, i) => Math.round(h2rgb(bg)[i] + (c - h2rgb(bg)[i]) * alpha));
const rgbHex = (c) => "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
const T = (n) => tok["--" + n];
check("factsheet.css still defines the brand tokens", !!T("paper") && !!T("seal-blue") && !!T("faint"));
const bar = rgbHex(over("#FFFFFF", 0.92, T("paper")));                 // sticky action bar over paper
const chip = rgbHex(over(T("hunter"), 0.10, bar));                     // live chip fill on the bar
const stale = rgbHex(over("#8B6800", 0.10, bar));                      // stale chip fill (a derived tint)
const PAIRS = [
  ["body on paper", T("body"), T("paper"), 4.5], ["body on card", T("body"), T("surface"), 4.5],
  ["body on zebra row", T("body"), T("surface-subtle"), 4.5], ["ink on total row", T("ink"), T("surface-muted"), 4.5],
  ["muted on card", T("muted"), T("surface"), 4.5], ["muted on paper", T("muted"), T("paper"), 4.5],
  ["muted in .note", T("muted"), T("surface-subtle"), 4.5], ["muted on total row", T("muted"), T("surface-muted"), 4.5],
  ["muted = the stacked sw-col label", T("muted"), T("surface"), 4.5],
  ["faint small-text on card", T("faint"), T("surface"), 4.5], ["faint small-text on paper", T("faint"), T("paper"), 4.5],
  ["seal-blue heading on paper", T("seal-blue"), T("paper"), 4.5], ["seal-blue heading on card", T("seal-blue"), T("surface"), 4.5],
  ["action-bar title on the bar", T("seal-blue"), bar, 4.5],
  ["link on paper", T("cobalt"), T("paper"), 4.5], ["link on card", T("cobalt"), T("surface"), 4.5],
  ["link on zebra row", T("cobalt"), T("surface-subtle"), 4.5],
  ["hunter on card", T("hunter"), T("surface"), 4.5], ["hunter on the live chip", T("hunter"), chip, 4.5],
  ["mustard-text on card", T("mustard-text"), T("surface"), 4.5], ["mustard-text on paper", T("mustard-text"), T("paper"), 4.5],
  ["mustard-text on the stale chip", T("mustard-text"), stale, 4.5],
  ["crimson on card", T("crimson"), T("surface"), 4.5],
  ["white on the navy table head", "#FFFFFF", T("seal-blue"), 4.5],
  ["white on the primary button", "#FFFFFF", T("seal-blue"), 4.5],
  ["skip link text on its own surface", T("cobalt"), T("surface"), 4.5],
  // non-text UI, 3:1
  ["focus ring on paper", T("cobalt"), T("paper"), 3.0], ["focus ring on card", T("cobalt"), T("surface"), 3.0],
  ["focus ring on the navy button", T("mustard-fill"), T("seal-blue"), 3.0],
  ["KPI top rule on card", T("seal-blue"), T("surface"), 3.0],
  ["savings KPI rule on card", T("hunter"), T("surface"), 3.0],
];
PAIRS.forEach(([label, fg, bg, target]) => {
  const r = ratio(h2rgb(fg), h2rgb(bg));
  check(`contrast ${target}:1 — ${label} (${r.toFixed(2)}:1)`, r >= target);
});
// --mustard-fill as a DECORATIVE rule (masthead underline, .note edge, .strategy
// top) is 1.95:1 on white. That is the same documented class as --border-strong
// at 1.92:1 (CLAUDE.md): decorative, not a UI component and not required to
// understand content — every one of them sits beside text that carries the
// meaning. Pinned so a future change cannot quietly start LEANING on it.
check("decorative mustard rules are still only decorative (no text uses --mustard-fill)",
  // Anchored: an unanchored /color:/ also matches `outline-color`, which is the
  // focus ring — non-text, verified at 3:1 above, and not a decorative rule at all.
  !/(^|[;{\s])color:\s*var\(--mustard-fill\)/m.test(CSS));

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
