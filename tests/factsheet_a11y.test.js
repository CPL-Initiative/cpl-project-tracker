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
//  (f) THE S350 UI PASS. The harness found 141 targets under 24px (the
//      statewide-recs toggles at 21px, resource titles at 18, team emails and
//      links in running text at 15-18) and the action bar pinned at 200px of a
//      390px phone. First Light: four raw hex in factsheet.css, hex fallbacks in
//      the injected CSS, and the recs toggle reading an --accent token this page
//      never defines (it painted #1c5d99). Three toolbar glyphs (the glyph sweep
//      never read this page's HTML) became words.
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
// The light palette is the first :root block; the dark blocks (S352, screen-only)
// restate the same names, so a whole-file read would take the dark values.
const tokensOf = (src) => {
  const t = {};
  (src.match(/--[\w-]+:\s*#[0-9A-Fa-f]{6}/g) || []).forEach((m) => {
    const [k, v] = m.split(/:\s*/); if (!(k.trim() in t)) t[k.trim()] = v.trim();
  });
  return t;
};
const LIGHT_ROOT = (CSS.match(/(^|\n):root \{[^}]*\}/) || [""])[0];
const DARK_ROOT = (CSS.match(/:root\[data-theme="dark"\] \{[^}]*\}/) || [""])[0];
const tok = tokensOf(LIGHT_ROOT);
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
  ["--on-accent on the cobalt Send and Ask Sierra hover", T("on-accent"), T("cobalt"), 4.5],
  ["--on-accent on the editor's crimson buttons", T("on-accent"), T("crimson"), 4.5],
  ["skip link text on its own surface", T("cobalt"), T("surface"), 4.5],
  // non-text UI, 3:1
  ["focus ring on paper", T("cobalt"), T("paper"), 3.0], ["focus ring on card", T("cobalt"), T("surface"), 3.0],
  ["focus ring on the navy button", T("mustard-fill"), T("seal-blue"), 3.0],
  ["KPI top rule on card", T("seal-blue"), T("surface"), 3.0],
  ["savings KPI rule on card", T("hunter"), T("surface"), 3.0],
];
// Dark (S352): the same roles on the night ground, from the explicit dark block
// (the OS block carries the same values; tests/factsheet_first_light.test.js
// holds them equal).
const dk = Object.assign({}, tok, tokensOf(DARK_ROOT));
const D = (n) => dk["--" + n];
check("factsheet.css carries a dark palette", !!D("paper") && D("paper") !== T("paper"));
[
  ["dark: body on paper", D("body"), D("paper"), 4.5], ["dark: body on card", D("body"), D("surface"), 4.5],
  ["dark: ink on total row", D("ink"), D("surface-muted"), 4.5], ["dark: muted on zebra row", D("muted"), D("surface-subtle"), 4.5],
  ["dark: muted on total row", D("muted"), D("surface-muted"), 4.5], ["dark: faint on total row", D("faint"), D("surface-muted"), 4.5],
  ["dark: seal ink on paper", D("seal-blue-text"), D("paper"), 4.5], ["dark: seal ink on card", D("seal-blue-text"), D("surface"), 4.5],
  ["dark: link on zebra row", D("cobalt"), D("surface-subtle"), 4.5], ["dark: hunter on card", D("hunter"), D("surface"), 4.5],
  ["dark: crimson on card", D("crimson"), D("surface"), 4.5], ["dark: mustard-text on card", D("mustard-text"), D("surface"), 4.5],
  ["dark: --on-accent on cobalt", D("on-accent"), D("cobalt"), 4.5], ["dark: --on-accent on crimson", D("on-accent"), D("crimson"), 4.5],
  ["dark: white on the navy table head", "#FFFFFF", D("seal-blue"), 4.5],
].forEach((p) => PAIRS.push(p));
PAIRS.forEach(([label, fg, bg, target]) => {
  // A token factsheet.css does not define reads as a failed pair, not a throw.
  const r = fg && bg ? ratio(h2rgb(fg), h2rgb(bg)) : 0;
  check(`contrast ${target}:1 — ${label} (${fg && bg ? r.toFixed(2) + ":1" : "undefined token"})`, r >= target);
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

// ── (f) the S350 UI pass ──
const RECS = fs.readFileSync("fact-sheet/statewide_recs_render.js", "utf8");
const STORIES_R = fs.readFileSync("fact-sheet/cpl_stories_render.js", "utf8");
const EDIT = fs.readFileSync("fact-sheet/factsheet_edit.js", "utf8");
const SRA = fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8");
const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/;
const cssNoComments = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
check("factsheet.css: every color outside :root is a token (no raw hex)",
  !/:[^;{}]*#[0-9a-fA-F]{3,8}\b/.test(cssNoComments.replace(/:root[^{]*\{[^}]*\}/g, "")));
check("the injected CSS of the recs list, the stories and the editor carries no raw hex",
  !HEX.test(RECS) && !HEX.test(STORIES_R) && !HEX.test(EDIT));
check("Sierra's question bubble names its text color as a token",
  /\.fs-sra-user \.fs-sra-bubble\{background:var\(--seal-blue\);color:var\(--on-seal\);/.test(SRA));
check("the recs toggle uses First Light's link blue, never the undefined --accent",
  /\.sw-rec-tg\{[^}]*color:var\(--cobalt\)/.test(RECS) && !/--accent/.test(RECS));
check("the recs toggle reaches the 24px floor", /\.sw-rec-tg\{[^}]*min-height:24px/.test(RECS));
check("resource titles reach 24px", /\.res a\.res-title \{[^}]*min-height: 24px/.test(CSS));
check("team emails reach 24px", /\.person \.pe a \{[^}]*min-height: 24px/.test(CSS));
check("links in running text get a 24px pressable box without moving the line",
  /\.mh-text \.sub a, \.note a, figure figcaption a, h3\.h-sub a \{ padding-block: 5px; \}/.test(CSS));
check("the action bar scrolls away on a phone instead of pinning 200px",
  /@media \(max-width: 560px\) \{ \.actionbar \{ position: static; \} \}/.test(CSS));
const GLYPH = /[\u{1F300}-\u{1FAFF}\u2190-\u21FF\u2300-\u23FF\u2600-\u27BF\u2B00-\u2BFF\u229E-\u22A1]/u;
check("the toolbar's controls are words (the Curate pencil is one of the 26 Sam kept)",
  [...d.querySelectorAll(".actionbar button")].filter((b) => b.id !== "btn-curate")
    .every((b) => !GLYPH.test(b.textContent)) &&
  /btn\.textContent = anyOpen \? 'Expand all' : 'Collapse all';/.test(JS));

// ── (g) no phantom tokens (S352) ──
// An undefined custom property with no fallback drops its declaration at
// computed-value time, and nothing errors: the Fact Sheet never defined
// --on-accent, so the drawer's Send button and Ask Sierra on hover painted the
// body's ink on cobalt (1.35:1) behind a clean a11y sweep (one is hover-only,
// the other sits in a shut drawer). Every bare var() the page's own CSS and
// the CSS its scripts inject read must be one factsheet.css defines.
{
  const defined = new Set((CSS.match(/--[\w-]+(?=\s*:)/g) || []));
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const srcs = { "factsheet.css": CSS, "index.html": HTML };
  fs.readdirSync("fact-sheet").filter((f) => f.endsWith(".js"))
    .forEach((f) => { srcs[f] = fs.readFileSync("fact-sheet/" + f, "utf8"); });
  const bare = [];
  for (const [f, src] of Object.entries(srcs)) {
    for (const m of strip(src).matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
      if (!defined.has(m[1])) bare.push(f + " -> " + m[1]);
    }
  }
  check("every bare var() the page and its scripts read is defined in factsheet.css" +
    (bare.length ? " (" + [...new Set(bare)].join(", ") + ")" : ""), bare.length === 0);
}

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
