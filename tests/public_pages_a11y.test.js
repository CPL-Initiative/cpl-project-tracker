// Sierra + the Veteran Sprint map — accessibility + mobile invariants (jsdom + static).
//
// Sam, 2026-08-20 (Session 175): "do a similar accessibility and mobile friendly
// check on Sierra AI and the Veteran Sprint MAP." These are the other two public
// standalone pages, both shared with colleges, and neither had ever been audited.
// Handoff 174 named it the highest-value next engineering step.
//
// SPLIT BY INSTRUMENT, exactly as fact-sheet/check_mobile_layout.js established:
// jsdom has no layout engine, so GEOMETRY (overflow at nine viewports, computed
// contrast, target sizes, whether a breakpoint drops a whole panel) is measured
// by scripts/a11y.js in Chromium, on demand. What lives HERE
// is the structure that suite cannot re-derive and that CI can check for free.
//
// What each group is protecting — every one of these was a real defect on
// 2026-08-20, and each failed this file before it was fixed:
//
//  SIERRA
//   (a) The beta disclaimer painted at 2.80:1 and the footer at 3.12:1, both
//       under AA. The beta box is the sentence telling a student to confirm
//       anything important with their coordinator — the most consequential text
//       on the page and the least legible.
//   (b) Two animations, no motion preference honoured: the typing indicator
//       pulses INFINITELY while an answer streams.
//   (c) role="radiogroup" over children that are aria-pressed toggle BUTTONS.
//       A screen reader announced a radio group; the arrow keys that promises
//       did nothing.
//   (d) The conversation log scrolls and was reachable only by accident — the
//       starter chips inside it are focusable and submit() REMOVES them after
//       the first question. So it was reachable while empty and unreachable once
//       it had content. ⚠️ Chromium 127+ auto-focuses overflowing scrollers, so
//       this does NOT reproduce as a behaviour failure in a Chromium harness;
//       the attribute is the check, which is why it is asserted here.
//   (e) The header's external link carries an "(opens in a new tab)" cue and the
//       footer's identical link did not.
//
//  VETERAN MAP  (generated — assert the GENERATOR, per Rule 1's principle;
//                the committed HTML is checked too so a stale artifact shows up)
//   (f) `@media (max-width:760px){#side{display:none}}` removed the ENTIRE side
//       panel on any phone: the Details pane, both directories, both searches,
//       every CPL landing-page link. Tapping a marker still selected it and
//       still rendered its detail — into a panel that was not on the page. The
//       map remained, so nothing looked broken.
//   (g) Markers and directory rows were mouse-only: a <g> is not focusable and
//       the only handler was "click", so the map's whole content was unreachable
//       by keyboard (WCAG 2.1.1).
//   (h) height:100vh on a phone puts the footer under the address bar.
//   (i) S350 ported the page to First Light (Sam, Open Asks Sheet 55): tokens in
//       :root only, dark on the cpl_theme contract, fonts embedded, and an
//       embedded layout (?embed=1) that fills COBI's iframe without an inner
//       scroll. Each is asserted so a later edit cannot quietly undo it.
//
// Run from repo root: `npm test` (or `node tests/public_pages_a11y.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
// Guard the DRIVERS too, not just the checks: an unguarded deref between checks
// kills the file before anything registers, and a missing check subtracts from
// BOTH sides of the ratio, so every run still reads "all passed".
function val(name, fn) {
  try { check(name, fn()); } catch (e) { check(name + " [threw: " + e.message + "]", false); }
}

// ─────────────────────────── Sierra ───────────────────────────
const S_HTML = fs.readFileSync("sierra/index.html", "utf8");
const S_CSS = fs.readFileSync("sierra/sierra.css", "utf8");
const S_JS = fs.readFileSync("sierra/sierra.js", "utf8");
const sd = new JSDOM(S_HTML).window.document;

// (a) contrast token — the ratios themselves are computed in Chromium; what is
// pinned here is that the failing value never comes back.
val("sierra: --sierra-faint is no longer the sub-AA #8394a3",
  () => !/--sierra-faint:\s*#8394a3/i.test(S_CSS));
val("sierra: --sierra-faint is defined", () => /--sierra-faint:\s*#[0-9a-f]{6}/i.test(S_CSS));
val("sierra: the beta disclaimer and footer still use a token, not a raw hex",
  () => /\.s-beta\s*\{[^}]*color:\s*var\(--sierra-faint\)/.test(S_CSS) &&
        /\.s-foot\s*\{[^}]*color:\s*var\(--sierra-faint\)/.test(S_CSS));

// (b) reduced motion
val("sierra: honours prefers-reduced-motion",
  () => /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(S_CSS));
val("sierra: the reduced-motion block stands the typing pulse down",
  () => {
    const i = S_CSS.indexOf("@media (prefers-reduced-motion: reduce)");
    return i !== -1 && /\.s-typing\s*\{[^}]*animation:\s*none/.test(S_CSS.slice(i));
  });
val("sierra: the audience flash is replaced by a still outline, not deleted",
  () => {
    const i = S_CSS.indexOf("@media (prefers-reduced-motion: reduce)");
    return i !== -1 && /\.s-audience\.s-need\s*\{[^}]*outline:/.test(S_CSS.slice(i));
  });

// (c) the audience picker describes what it is
val("sierra: the audience picker is role=group", () => {
  const a = sd.getElementById("s-audience");
  return a && a.getAttribute("role") === "group";
});
val("sierra: it is NOT a radiogroup (its children are aria-pressed buttons)",
  () => !/role="radiogroup"/.test(S_HTML));
val("sierra: the picker still has an accessible name", () => {
  const a = sd.getElementById("s-audience");
  return a && (a.getAttribute("aria-label") || "").length > 10;
});
val("sierra: the chips are still built as aria-pressed buttons",
  () => /setAttribute\('aria-pressed'/.test(S_JS));

// (d) scroll regions
val("sierra: sierra.js wires the scroll regions", () => /function syncScrollRegions/.test(S_JS));
val("sierra: the log is focusable ONLY while it overflows (no dead tab stop)",
  () => /scrollHeight > logEl\.clientHeight \+ 1/.test(S_JS) &&
        /logEl\.removeAttribute\('tabindex'\)/.test(S_JS));
val("sierra: answer tables become focusable regions when they scroll sideways",
  () => /\.s-bubble table/.test(S_JS) && /scrollWidth > t\.clientWidth \+ 1/.test(S_JS));
val("sierra: a scrolling answer table gets an accessible name",
  () => /\(scrollable\)/.test(S_JS));
val("sierra: it re-syncs as streamed content arrives, not once at load",
  () => /MutationObserver/.test(S_JS) && /addEventListener\('resize', syncScrollRegions\)/.test(S_JS));
val("sierra: the log keeps its accessible name in the markup", () => {
  const l = sd.getElementById("s-log");
  return l && (l.getAttribute("aria-label") || "").length > 5;
});

// (e) external link cues, skip link, focus ring
val("sierra: every target=_blank link warns that it opens a new tab", () => {
  const links = [...sd.querySelectorAll('a[target="_blank"]')];
  // One since the 2026-10-08 redesign: the logo is the link to map.rccd.edu
  // (the pill and the footer's MAP link it replaced are gone). At least one, so
  // an empty list cannot pass.
  return links.length >= 1 && links.every((a) => /opens in a new tab/i.test(a.textContent));
});
val("sierra: a skip link exists and is the first focusable element", () => {
  const first = sd.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  return first && first.classList.contains("s-skip");
});
val("sierra: the skip link points at a target that can take focus", () => {
  const s = sd.querySelector("a.s-skip");
  const t = s && sd.getElementById((s.getAttribute("href") || "#").slice(1));
  return t && t.getAttribute("tabindex") === "-1";
});
val("sierra: CSS keeps the skip link off-screen until focused",
  () => /\.s-skip\s*\{[^}]*top:\s*-/.test(S_CSS) && /\.s-skip:focus\s*\{[^}]*top:\s*\d/.test(S_CSS));
val("sierra: there is an explicit :focus-visible ring", () => /:focus-visible/.test(S_CSS));
val("sierra: the input can shrink (min-width:0) so Send never leaves a 320px screen",
  () => /\.s-input\s*\{[^}]*min-width:\s*0/.test(S_CSS));
// ─────────────────────── Veteran Sprint map ───────────────────────
// The HTML is GENERATED by build_selfcontained.py, so the generator is the
// authority (Rule 1's principle: change the generator, not the artifact). Byte
// equality is `build_selfcontained.py --check` (CI and scripts/check_generated.sh);
// here both files are asserted so the failure modes below cannot come back.
// S350 ported the page to First Light (Sam, Open Asks Sheet 55 card 1, "Port it"):
// a document that scrolls, controls beside the map, a stacked panel below 981px.
const GEN = fs.readFileSync("veteran-sprint-map/build_selfcontained.py", "utf8");
const M_HTML = fs.readFileSync("veteran-sprint-map/ca_cpl_map_selfcontained.html", "utf8");
const md = new JSDOM(M_HTML).window.document;
const M_CSS = (M_HTML.match(/<style>([\s\S]*?)<\/style>/) || ["", ""])[1];

/* Strip comments before asserting a rule is ABSENT. The first cut of the
   breakpoint check failed on both files — because the fix's own comment QUOTES
   the deleted rule verbatim, to say what it used to be. A documented defect is
   not a live one, and a check that cannot tell them apart would have forced the
   explanation out of the code to keep the test green. */
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*#.*$/gm, "");
const GEN_CODE = strip(GEN);
const M_CODE = strip(M_HTML);
const CSS_CODE = strip(M_CSS);

const both = (name, re) => val(name, () => re.test(GEN) && re.test(M_HTML));
// The body of the first `@media (<query>){...}` block, braces balanced.
function mediaBlock(css, query) {
  const i = css.indexOf("@media " + query + "{");
  if (i < 0) return null;
  let depth = 0;
  for (let j = css.indexOf("{", i); j < css.length; j++) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}" && --depth === 0) return css.slice(css.indexOf("{", i) + 1, j);
  }
  return null;
}

// (f) the phone breakpoint: the panel must never leave the page
val("map: no rule anywhere hides the details panel",
  () => !/(#side|\.panel)\{[^}]*display:\s*none/.test(CSS_CODE) &&
        !/#side\{flex-basis:0;display:none\}/.test(GEN_CODE) && !/#side\{flex-basis:0;display:none\}/.test(M_CODE));
val("map: below 981px the grid is one column, so the panel stacks under the map",
  () => /\.grid\{grid-template-columns:1fr\}/.test(mediaBlock(CSS_CODE, "(max-width:980px)") || ""));
val("map: the stacked panel grows with its content (no clipped inner scroll)",
  () => /\.panel\{height:auto/.test(mediaBlock(CSS_CODE, "(max-width:980px)") || ""));
val("map: the map keeps a usable height on a phone",
  () => /\.stage\{height:\d+vh;min-height:\d{3}px\}/.test(mediaBlock(CSS_CODE, "(max-width:560px)") || ""));
val("map: selecting a marker scrolls the panel into view once it is stacked",
  () => /scrollIntoView/.test(GEN.slice(GEN.indexOf("function activate"))) &&
        /max-width:980px/.test(GEN.slice(GEN.indexOf("function activate"), GEN.indexOf("function bind"))));

// (g) keyboard operation
both("map: markers are focusable", /g\.setAttribute\("tabindex","0"\)/);
both("map: markers say what they are", /g\.setAttribute\("role","button"\)/);
both("map: every marker carries an accessible name", /g\.setAttribute\("aria-label"/);
both("map: Enter and Space activate a marker", /ev\.key==="Enter"\s*\|\|\s*ev\.key===" "/);
both("map: focus shows the same tooltip hover does", /g\.addEventListener\("focus"/);
both("map: the tooltip can be placed without a mouse event", /function showTipAt\(x,y,/);
both("map: college directory rows are focusable", /li\.tabIndex=0/);
both("map: directory rows respond to Enter/Space", /li\.onkeydown=ev=>/);
val("map: the panel tabs report their state to assistive tech, not just a class",
  () => /setAttribute\("aria-pressed", t\.dataset\.tab===name \? "true" : "false"\)/.test(GEN));
val("map: the zoom controls are words (+ and − are not names)", () => {
  const z = md.getElementById("zin"), o = md.getElementById("zout");
  return z && o && z.textContent.trim() === "Zoom in" && o.textContent.trim() === "Zoom out";
});
val("map: a skip link exists and is the first focusable element", () => {
  const first = md.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  return first && first.classList.contains("skip");
});
val("map: the skip target can take focus", () => {
  const s = md.querySelector("a.skip");
  const t = s && md.getElementById((s.getAttribute("href") || "#").slice(1));
  return t && t.getAttribute("tabindex") === "-1";
});
both("map: there is an explicit :focus-visible ring", /\.mk:focus-visible/);
val("map: the a11y target's selectors all exist (pins, tabs, directories, detail)", () =>
  ["g-colleges", "g-bases", "list-col", "list-base", "detail"].every((id) => md.getElementById(id)) &&
  md.querySelector('.tab[data-tab="colleges"]') && md.querySelector('.tab[data-tab="bases"]'));

// (h) mobile: no page-tall column at phone widths
val("map: 100vh appears only in the embedded desktop layout, never at phone widths", () => {
  const embed = mediaBlock(CSS_CODE, "(min-width:981px)") || "";
  return /\.embed \.wrap\{height:100vh/.test(embed) && !/100vh/.test(CSS_CODE.replace(embed, ""));
});
val("map: the layer toggles meet the 24px tap-target floor", () => {
  const m = CSS_CODE.match(/label\.toggle\{[^}]*min-height:(\d+)px/);
  return m && +m[1] >= 24;
});

// (i) First Light (S350): the palette, the dark contract, the fonts, the embed
val("map: every color lives in a :root block (no raw hex in a component rule)", () => {
  const rest = CSS_CODE.replace(/@font-face\{[^}]*\}/g, "").replace(/:root[^{]*\{[^}]*\}/g, "");
  return !/:[^;{}]*#[0-9a-fA-F]{3,8}\b/.test(rest);
});
val("map: dark follows the OS unless the reader chose light, and an explicit dark choice",
  () => /@media \(prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{/.test(CSS_CODE) &&
        /:root\[data-theme="dark"\]\{/.test(CSS_CODE));
val("map: the COBI theme choice is read before the first paint and followed live", () => {
  const head = M_HTML.slice(0, M_HTML.indexOf("<style>"));
  return /localStorage\.getItem\("cpl_theme"\)/.test(head) &&
         /addEventListener\("storage",function\(e\)\{if\(e&&e\.key==="cpl_theme"\)/.test(head);
});
val("map: the two First Light faces are embedded, so the page loads nothing", () =>
  (M_CSS.match(/@font-face\{[^}]*src:url\(data:font\/woff2;base64,/g) || []).length === 4 &&
  !/<link\b/i.test(M_HTML) && !/<script[^>]+src=/i.test(M_HTML) && !/url\(\s*['"]?https?:/i.test(M_CSS));
val("map: COBI's Military Partnerships iframe opens the embedded layout (both HTMLs)", () =>
  ["CPL_Dashboard.html", "index.html"].every((f) =>
    fs.readFileSync(f, "utf8").includes('src="veteran-sprint-map/ca_cpl_map_selfcontained.html?embed=1"')));
val("map: ?embed=1 sets the embedded layout before the first paint",
  () => /if\(\/\[\?&\]embed=1\(&\|\$\)\/\.test\(location\.search\)\)document\.documentElement\.classList\.add\("embed"\)/
        .test(M_HTML.slice(0, M_HTML.indexOf("<style>"))));
val("map: above 980px a shorter map keeps the approved marker size (COBI's frame)", () => {
  const fn = GEN.slice(GEN.indexOf("function sizeFactor"), GEN.indexOf("function rescaleMarkers"));
  return /REF_PPU=0\.55/.test(GEN) && /min-width:981px/.test(GEN.slice(GEN.indexOf("const REF_PPU"))) &&
         /if\(!wide\.matches\) return 1;/.test(fn) && /sizeFactor\(\)\/scale/.test(GEN) &&
         /addEventListener\("resize", rescaleMarkers\)/.test(GEN);
});
val("map: the committed HTML is a full build (no template placeholder left)",
  () => !/__FONTS__|__DATA_JS__/.test(M_HTML) && /const DATA = \{"colleges"/.test(M_HTML));

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (failed ? failed + " of " + results.length + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
