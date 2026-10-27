// 🤖 Sierra's introduction lives behind a footer control, and a phone's first
// screen belongs to the conversation. Since 2026-10-27 the page has no header row
// (Sam: "since we have the cpl logo in the footer, we can eliminate the whole
// header row, moving the links down to the footer"): the logo, About Sierra,
// Light and Dark are in the footer.
//
//   Sam, 2026-09-11, with a screenshot of the header: "consolidate all this
//   text to hover overs in the header... and fix the ghosted mountain logo so
//   the peak fits". Measured before the change at 390×844: the header wrapped to
//   104px, the introduction and beta note took 287px, the audience picker 119px,
//   and the conversation began 540px down — 64% of the screen.
//
// WHAT THIS GUARDS, and why each is here rather than left to reading:
//
//   * THE TEXT IS REACHABLE WITHOUT A MOUSE. Hover-only content fails WCAG
//     1.4.13 and every touch and keyboard user. The control is a <button> with
//     aria-expanded and aria-controls; click toggles, Escape closes and returns
//     focus, a click outside closes. Hover is a convenience, never the only way.
//
//   * THE CONSEQUENTIAL SENTENCES SURVIVE THE MOVE. The footer, always visible,
//     carries the beta note (the coordinator decides; no personal information;
//     logged anonymously), so the person typing sees it without opening anything.
//
//   * THE LOGO IS THE WAY TO MAP (the 2026-10-08 redesign, after america.gov).
//     The navy band, the ghosted Whitney wordmark and the map.rccd.edu pill are
//     gone; Sam: "Make the CPL Initiative logo a link". The link says where it
//     goes and that it opens a new tab, and the logo swaps to its light-on-dark
//     version by the cpl_theme.js contract (the OS, or the reader's choice).
//
//   * NO HEADER ROW AT ALL. The page opens on her greeting at every width, and
//     the audience row folds behind its one "Answering for: …" control;
//     a11y.config.js says so, or the sweep reports a control that vanished.
//
// Run from repo root: `npm test` (or `node tests/sierra_header_about.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { TextEncoder, TextDecoder } = require("util");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const HTML = fs.readFileSync("sierra/index.html", "utf8");
const SRC = fs.readFileSync("sierra/sierra.js", "utf8");
const CSS = fs.readFileSync("sierra/sierra.css", "utf8");
const CFG = fs.readFileSync("a11y.config.js", "utf8");

function loadDom() {
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/sierra/" });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  w.fetch = function () { return Promise.reject(new Error("no network in this test")); };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return w;
}

block("(1) the control and the panel exist, and the text moved", () => {
  check("(1) ⭐ a footer <button> named About Sierra carries aria-expanded + aria-controls",
    /<footer class="s-foot">[\s\S]*?<button class="s-about" id="s-about-btn" type="button" aria-expanded="false" aria-controls="s-about">About Sierra<\/button>[\s\S]*?<\/footer>/.test(HTML),
    "hover-only text is unreachable by keyboard and touch; the control is the way in");
  check("(1) ⭐ the panel it controls exists in the footer, after its control, and starts hidden",
    /<footer class="s-foot">[\s\S]*?id="s-about-btn"[\s\S]*?<div class="s-about-panel" id="s-about" hidden>[\s\S]*?<\/footer>/.test(HTML));
  check("(1) the panel holds the introduction, and no second copy of the beta note",
    /id="s-about"[\s\S]*?Sierra answers questions about credit for prior learning/.test(HTML) && !/class="s-beta"/.test(HTML));
  check("(1) ⭐ there is no header row (Sam, 2026-10-27)",
    !/<header/.test(HTML) && !/class="s-head"/.test(HTML) && !/\.s-head\b/.test(CSS),
    "the logo, About Sierra, Light and Dark moved to the footer");
  check("(1) ⭐ Light and Dark are in the footer",
    /<footer class="s-foot">[\s\S]*?data-theme-pick="light"[^>]*>Light<\/button>[\s\S]*?data-theme-pick="dark"[^>]*>Dark<\/button>[\s\S]*?<\/footer>/.test(HTML));
  check("(1) ⭐ nothing sits between the header and the audience picker any more",
    !/class="s-intro"/.test(HTML),
    "the introduction above the conversation is what took 287px of a phone");
  check("(1) ⭐ the footer, always visible, carries beta + the privacy line",
    /<footer class="s-foot">[\s\S]*?in beta[\s\S]*?personal information[\s\S]*?logged anonymously[\s\S]*?<\/footer>/.test(HTML),
    "a person about to type must not need to open a panel to learn what is logged");
});

block("(2) it opens and closes without a mouse", () => {
  const w = loadDom();
  const btn = w.document.getElementById("s-about-btn");
  const panel = w.document.getElementById("s-about");
  check("(2) starts closed", btn.getAttribute("aria-expanded") === "false" && panel.hidden === true);
  btn.click();
  check("(2) ⭐ click opens: aria-expanded=true and the panel is shown",
    btn.getAttribute("aria-expanded") === "true" && panel.hidden === false);
  btn.click();
  check("(2) click again closes", btn.getAttribute("aria-expanded") === "false" && panel.hidden === true);
  btn.click();
  w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("(2) ⭐ Escape closes it", panel.hidden === true && btn.getAttribute("aria-expanded") === "false",
    "1.4.13 dismissible: the reader must be able to send it away without moving the pointer");
  check("(2) …and returns focus to the control", w.document.activeElement === btn);
  btn.click();
  w.document.getElementById("s-log").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("(2) a click outside closes it", panel.hidden === true);
  btn.click();
  panel.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("(2) a click inside the panel keeps it open (1.4.13 hoverable)", panel.hidden === false);
  check("(2) the page exposes setAbout for harnesses", typeof w.CPL_SIERRA_PAGE.setAbout === "function");
});

block("(3) the styles: the logo link, the footer row, the hidden companion", () => {
  check("(3) ⭐ the footer's logo is the link to map.rccd.edu, and says where it goes and that it opens a new tab",
    /<footer class="s-foot">[\s\S]*?<a class="s-home" href="https:\/\/map\.rccd\.edu" target="_blank" rel="noopener">[\s\S]*?<img class="s-foot-logo s-foot-logo-white"[\s\S]*?<span class="s-sr">map\.rccd\.edu \(opens in a new tab\)<\/span>\s*<\/a>/.test(HTML),
    "an image link's visible face names no destination, so the hidden words must");
  check("(3) the device never picks the theme (Sheet 126 card 2)", !/prefers-color-scheme/.test(CSS));
  const narrow = (CSS.match(/@media \(max-width: 560px\)\s*\{([\s\S]*?)\n\}/) || [])[1] || "";
  // The audience row folds behind its control at every width since the gentle prompt
  // (Sam, 2026-10-24), so the phone needs no rule of its own for it.
  const wide = CSS.replace(/@media[^{]*\{[\s\S]*?\n\}/g, "");
  check("(3) ⭐ the audience row folds behind its control at every width",
    /(^|\n)\.s-audience:not\(\.open\)\s*\{\s*display:\s*none/.test(wide) &&
    /\.s-aud-toggle\s*\{\s*display:\s*inline-flex/.test(wide),
    "the row was 119px of a 844px phone");
  check("(3) …and About Sierra stays (it is the only way to the text)", !/\.s-about\s*\{[^}]*display:\s*none/.test(narrow));
  check("(3) the panel has the [hidden] companion rule",
    /\.s-about-panel\[hidden\]\s*\{\s*display:\s*none/.test(CSS),
    "an author display rule beats the UA's [hidden] — the 2026-08-14 .s-fb-note lesson");
  check("(3) the About control and the theme words are styled <button>s in the band's ink (font and color spelled out)",
    /\.s-about\s*\{[^}]*font:[^}]*var\(--sierra-font\)/.test(CSS) && /\.s-about\s*\{[^}]*color:\s*var\(--sierra-foot-fg\)/.test(CSS)
    && /\.s-theme-btn\s*\{[^}]*color:\s*var\(--sierra-foot-fg\)/.test(CSS));
  check("(3) ⭐ the picked theme reads bold and keeps the band's ink (the header's navy pick would vanish on the navy band)",
    /\.s-theme-btn\[aria-pressed="true"\]\s*\{\s*font-weight:\s*700;[^}]*\}/.test(CSS) && !/\.s-theme-btn\[aria-pressed="true"\]\s*\{[^}]*color:/.test(CSS));
  check("(3) the footer's controls meet the 24px target floor",
    /\.s-about\s*\{[^}]*min-height:\s*24px/.test(CSS) && /\.s-theme-btn\s*\{[^}]*min-height:\s*24px/.test(CSS));
});

block("(4) the sweep is told what may vanish, and only that", () => {
  const sierraCfg = (CFG.match(/sierra:\s*\{[\s\S]*?mayHideBelow:\s*\[([^\]]*)\]/) || [])[1] || "";
  check("(4) ⭐ a11y.config.js allows the audience row to fold below 560 for the Sierra target",
    /"\.s-audience"/.test(sierraCfg), "otherwise the sweep reports a control that disappeared on a phone");
  check("(4) …and never the control that opens it", !/"\.s-aud-toggle"/.test(sierraCfg));
  check("(4) …and nothing else", sierraCfg.replace(/"\.s-audience"|[\s,]/g, "") === "");
  check("(4) no width hides a footer control", !/@media \(max-width: \d+px\)\s*\{[^@]*\.s-(about|theme|foot-ctl)[^{]*\{[^}]*display:\s*none/.test(CSS));
});

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
