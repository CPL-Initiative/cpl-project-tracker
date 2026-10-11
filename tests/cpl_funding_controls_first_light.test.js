// tests/cpl_funding_controls_first_light.test.js
//
// Implementation Funding on First Light (S364 UI pass, Sam's 2026-10-09 controls
// rule: a control that acts is an underlined cobalt word, no border, no fill).
//
// The failures this guards, each found by the seeded curator sweep
// (a11y.config.js funding-curator, funding-curator-dark), which the signed-out
// cobi sweep cannot see:
//  (a) a boxed or filled control: Rename, Remove, Hide from public, Add project,
//      Publish this scenario, Save. The word rule repeats each boxed rule's
//      selector and wins by coming later, so it must stay after them.
//  (b) the view in use (Internal / Public) shown by a fill: it is the word that
//      is not a link, carried by weight and aria-pressed
//  (c) an inline style boxing one button (Cancel), which no rule can undo
//  (d) a word under 24px: "Edit" measured 22.6px wide; the card-size sliders 19.9px tall
//  (e) "New scenario" wrapping onto a second line over the hint beside it at 390px
//  (f) the link in "Hidden from the public college page" outside a paragraph,
//      where the inline-link exception to WCAG 2.5.8 does not reach it
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_controls_first_light.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");

const dom = new JSDOM(
  "<!doctype html><html><head></head><body><div id='tab-implementation-funding'>" +
  "<div id='cplFundingMount'></div></div></body></html>",
  { runScripts: "outside-only", url: "https://example.org/" });
const w = dom.window;
w.scrollTo = function () {};
w.CPL_FUNDING_NO_REMOTE = true;
// A curator, the way cpl_session.js answers for a fresh sign-in.
const S = { email: "seed@example.org", access_token: "seed", expires_at: Math.floor(Date.now() / 1000) + 3600 };
w.CPL_SESSION = { get: function () { return S; }, isFresh: function () { return true; } };
w.eval(dataSrc);
w.eval(consumerSrc);
w.CPL_FUNDING_TAB.boot();
w.CPL_FUNDING_TAB.render();
const doc = w.document;

const css = (doc.getElementById("cpl-funding-css") || {}).textContent || "";
check("the tab injects its CSS", css.length > 10000);

// (a) the word rule, and its place after every rule it overrides
const WORDS = [".cplfund-optbtn", ".cplfund-textbtn", ".cplfund-textbtn.primary", ".cplfund-reqdel",
  ".cplfund-optin-jump", ".cplfund-card-eye", ".cplfund-card-x", ".cplfund-kindtoggle",
  ".cplfund-authbar button.rst", ".cplfund-authbar button.rst.primary", ".cplfund-strip button.rst",
  ".cplfund-addproj button.rst"];
const rules = css.split("\n");
const wordAt = rules.findIndex(function (r) {
  return r.indexOf(".cplfund-optbtn, .cplfund-textbtn, .cplfund-textbtn.primary,") === 0 && /border: 0;/.test(r);
});
const word = wordAt >= 0 ? rules[wordAt] : "";
check("(a) one rule makes every control an underlined cobalt word, 24px tall",
  /border: 0;/.test(word) && /background: none;/.test(word) && /color: var\(--cobalt\);/.test(word)
    && /text-decoration: underline;/.test(word) && /min-height: 24px;/.test(word));
WORDS.forEach(function (sel) {
  const head = word.split("{")[0].split(",").map(function (x) { return x.trim(); });
  check("(a) the word rule covers " + sel, head.indexOf(sel) >= 0);
  const boxed = rules.findIndex(function (r) {
    const h = r.split("{")[0].split(",").map(function (x) { return x.trim(); });
    return h.indexOf(sel) >= 0 && /border: 1px solid/.test(r);
  });
  check("(a) " + sel + ": the word rule comes after the boxed one", boxed < 0 || boxed < wordAt);
});

// (b) the view in use
const pressedFill = rules.findIndex(function (r) {
  return r.indexOf('.cplfund-actions [data-viewmode][aria-pressed="true"]') === 0 && /background: var\(--seal-blue\)/.test(r);
});
const pressedWord = rules.findIndex(function (r) {
  return r.indexOf('.cplfund-actions [data-viewmode][aria-pressed="true"]') === 0 && /background: none;/.test(r)
    && /text-decoration: none;/.test(r) && /font-weight: 700;/.test(r);
});
check("(b) the view in use is a word in weight, not a fill, and the rule wins by order",
  pressedWord > 0 && pressedWord > pressedFill);
const views = doc.querySelectorAll("[data-viewmode]");
check("(b) the two views say which is in use with aria-pressed",
  views.length === 2 && doc.querySelectorAll('[data-viewmode][aria-pressed="true"]').length === 1);

// (c) no inline style boxes a button, in the render or in the source
const styled = Array.prototype.filter.call(doc.querySelectorAll("#cplFundingMount button"), function (b) {
  return /border|background/.test(b.getAttribute("style") || "");
});
check("(c) no rendered button carries an inline border or fill: " +
  (styled.map(function (b) { return b.textContent; }).join(" | ") || "none"), !styled.length);
check("(c) no button in the source carries an inline border or fill",
  !/<button[^>]*style="[^"]*(border|background)/.test(consumerSrc));
check("(c) the curator's controls rendered (the seed reached the signed-in view)",
  doc.querySelectorAll("#cplFundingMount .cplfund-textbtn").length > 5);

// (d) and (e)
check("(d) a word is at least 24px wide, and keeps its line",
  /min-width: 24px;/.test(word) && /white-space: nowrap;/.test(word));
check("(d) the card-size sliders are 24px tall",
  /\.cplfund-cardsize-d input\[type="range"\] \{[^}]*min-height: 24px/.test(css));
check("(e) below 640px the control row wraps rather than squeezing a word",
  /@media \(max-width: 640px\) \{[\s\S]*\.cplfund-ctl \{ max-width: 100%; flex-wrap: wrap; \}/.test(css));

// (f) the inline link sits in a sentence the exception covers
check("(f) the hidden-from-public note is a paragraph",
  /'<p class="cplfund-reqrestore"><span class="dk">Hidden from the '/.test(consumerSrc));
const link = Array.prototype.find.call(doc.querySelectorAll("#cplFundingMount a"), function (a) {
  return a.textContent === "public college page";
});
check("(f) where it renders, its link is inside a <p>", !link || !!link.closest("p"));

let pass = 0;
results.forEach(function (r) { if (r[1]) pass++; else console.log("FAIL " + r[0]); });
console.log("cpl_funding_controls_first_light: " + pass + "/" + results.length + " passed");
if (pass !== results.length) process.exit(1);
