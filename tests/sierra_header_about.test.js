// 🤖 Sierra's introduction and beta note live behind a header control, and a
// phone's first screen belongs to the conversation.
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
//   * THE CONSEQUENTIAL SENTENCES SURVIVE THE MOVE. The beta note (double-check
//     with the coordinator; no personal information; logged anonymously) is in
//     the panel, and the footer — always visible — carries the privacy line, so
//     the person typing sees it without opening anything.
//
//   * THE PEAK IS NOT CLIPPED. `.s-name-peak` clipped both axes and cut the
//     ridgeline off at the top of the wordmark. `overflow: clip visible` keeps
//     the sideways containment (a narrow phone must not scroll) and frees the top.
//
//   * ONE HEADER ROW ON A PHONE. Below 560px the map.rccd.edu pill yields to
//     the footer link with the same destination and cue; a11y.config.js says so,
//     or the sweep reports a control that vanished.
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
  check("(1) ⭐ a header <button> named About Sierra carries aria-expanded + aria-controls",
    /<button class="s-about" id="s-about-btn" type="button" aria-expanded="false" aria-controls="s-about">About Sierra<\/button>/.test(HTML),
    "hover-only text is unreachable by keyboard and touch; the control is the way in");
  check("(1) ⭐ the panel it controls exists and starts hidden",
    /<div class="s-about-panel" id="s-about" hidden>/.test(HTML));
  check("(1) the panel holds the introduction and the beta note",
    /id="s-about"[\s\S]*?Hi, I'm <strong>Sierra<\/strong>[\s\S]*?class="s-beta">Beta[\s\S]*?personal information[\s\S]*?logged anonymously/.test(HTML));
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

block("(3) the styles: the peak, the phone row, the hidden companion", () => {
  check("(3) ⭐ the wordmark clips sideways only, so the ridgeline's peak shows",
    /\.s-name-peak\s*\{[^}]*overflow:\s*clip visible/.test(CSS),
    "overflow: clip on both axes cut the peak off at the top of the line box");
  const narrow = (CSS.match(/@media \(max-width: 560px\)\s*\{([\s\S]*?)\n\}/) || [])[1] || "";
  check("(3) ⭐ below 560px the header does not wrap and the map.rccd.edu pill yields",
    /\.s-head\s*\{[^}]*flex-wrap:\s*nowrap/.test(narrow) && /\.s-back\s*\{\s*display:\s*none/.test(narrow),
    "two header rows were 104px of a 844px phone");
  check("(3) …and About Sierra stays (it is the only way to the text)", !/\.s-about\s*\{[^}]*display:\s*none/.test(narrow));
  check("(3) the panel has the [hidden] companion rule",
    /\.s-about-panel\[hidden\]\s*\{\s*display:\s*none/.test(CSS),
    "an author display rule beats the UA's [hidden] — the 2026-08-14 .s-fb-note lesson");
  check("(3) the About control is a styled <button> (font and color spelled out)",
    /\.s-about\s*\{[^}]*font:[^}]*var\(--sierra-font\)/.test(CSS) && /\.s-about\s*\{[^}]*color:\s*#fff/.test(CSS));
  check("(3) the beta note keeps its AA token", /\.s-beta\s*\{[^}]*color:\s*var\(--sierra-faint\)/.test(CSS));
});

block("(4) the sweep is told what may vanish, and only that", () => {
  const sierraCfg = (CFG.match(/sierra:\s*\{[\s\S]*?mayHideBelow:\s*\[([^\]]*)\]/) || [])[1] || "";
  check("(4) ⭐ a11y.config.js allows .s-back to yield below 560 for the Sierra target",
    /"\.s-back"/.test(sierraCfg), "otherwise the sweep reports a control that disappeared on a phone");
  check("(4) …and below 400 the tagline, whose words the name and title carry", /"\.s-role"/.test(sierraCfg));
  check("(4) …and nothing else", sierraCfg.replace(/"\.s-back"|"\.s-role"|[\s,]/g, "") === "");
  const narrow400 = (CSS.match(/@media \(max-width: 400px\)\s*\{([\s\S]*?)\n\}/) || [])[1] || "";
  check("(4) the 400px rule hides only the tagline, never the name or the control",
    /\.s-role\s*\{\s*display:\s*none/.test(narrow400) && !/h1|\.s-about\s*\{[^}]*display/.test(narrow400));
});

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
