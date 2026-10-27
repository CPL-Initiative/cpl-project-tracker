// CPL Implementation Funding — the My College text, editable (Sam, 2026-10-15,
// his mockup's call 8: "Let me edit the My College text blocks the way I edit
// the explainer's passages (same editor, with Bold and Italic)").
//
//   1. The tab's seven text blocks take Bold and Italic: the two buttons in the
//      editor, and **two** / *one* asterisks rendered as bold and italic, the
//      FAQ's questions and answers included. A house text's own bold survives
//      into the edit box as marks.
//   2. The My CPL Funding block's sentences are passages (mc_*): a curator-only
//      section lists them, each with the same editor; a name in braces is a
//      figure filled in for each institution; an edit reaches the block every
//      surface draws (college_briefing.js fundingBlockHtml).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_my_college_text.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>' +
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount"></div></div><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  // My Institution is hidden on the public page (Sam, 2026-10-27); its code is kept, and this
  // suite keeps it honest with the switch on (cpl_funding.js oneViewOn).
  w.CPL_FUNDING_ONE_VIEW = true;
  w.fetch = function () { return new Promise(function () {}); };
  if (opts.signedIn) w.CPL_SESSION = session();
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js", "college_briefing.js"].forEach(run);
  const T = w.CPL_FUNDING_TAB;
  T.boot();
  return { w, doc: w.document, T };
}
const SEVEN = ["about", "reading", "elig_intro", "nc_rules", "college_intro", "timing_note", "faq"];

// ─────────────────────────────────────────────────────────────────────────────
// 1. The tab's seven blocks take Bold and Italic
// ─────────────────────────────────────────────────────────────────────────────
{
  const { doc, T } = setup({ signedIn: true });
  const withButtons = SEVEN.filter(function (k) {
    T._state.textEditing = k; T.render();
    return !!doc.querySelector('[data-textwrap="**"][data-textfor="' + k + '"]') &&
      !!doc.querySelector('[data-textwrap="*"][data-textfor="' + k + '"]');
  });
  check("1a: all seven of the tab's text blocks offer Bold and Italic in the editor (" + withButtons.length + " of 7)",
    withButtons.length === SEVEN.length);
  T._state.textEditing = "reading"; T.render();
  const ta = doc.querySelector('[data-textarea="reading"]');
  check("1b: a house text's own bold reaches the edit box as marks, so a save keeps it",
    !!ta && /\*\*max award\*\*/.test(ta.value));
  T._state.textEditing = "about"; T.render();
  check("1c: the editor says how the marks work",
    /press Bold or Italic/.test(doc.querySelector('[data-textblock="about"]').textContent));
  T._state.textEditing = null;
  T._setShared({ text: {
    about: "In 2026 the Legislature **appropriated** funds for *colleges*.\n\nA second paragraph.",
    faq: "Q: Where is **the guidance**?\n\nThe guidance follows *once* the procedure is final."
  } });
  T.render();
  const about = doc.querySelector('[data-textblock="about"]');
  check("1d: a saved introduction renders **bold** and *italic*",
    !!about && (about.querySelector("strong") || {}).textContent === "appropriated" &&
    (about.querySelector("em") || {}).textContent === "colleges" && !/\*/.test(about.textContent));
  const faq = doc.querySelector(".cplfund-faq");
  check("1e: the FAQ renders the marks in its questions and its answers",
    !!faq && (faq.querySelector("summary strong") || {}).textContent === "the guidance" &&
    (faq.querySelector("p em") || {}).textContent === "once");
  T._setShared({ text: { about: "Plain <b>markup</b> stays text." } });
  T.render();
  check("1f: typed markup still renders as text, never as markup",
    !doc.querySelector('[data-textblock="about"] b') &&
    /<b>markup<\/b>/.test(doc.querySelector('[data-textblock="about"]').textContent));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. My CPL Funding's text
// ─────────────────────────────────────────────────────────────────────────────
{
  const { w, doc, T } = setup({ signedIn: true });
  T.render();
  const sec = doc.querySelector('details[data-sec="mc_text"]');
  check("2a: a curator sees My CPL Funding's text, curator only, beside The explainer's text",
    !!sec && sec.getAttribute("data-curator-only") === "1" &&
    !!doc.querySelector('details[data-sec="explainer_text"]') &&
    /My CPL Funding.s text/.test(sec.querySelector("summary").textContent));
  // Fifteen since 2026-10-15: the four How to meet it passages joined the one
  // text (Sam's calls 4 and 5). Seventeen since S471: the two noncredit
  // conditions' passages (mc_how_nc_coord, mc_how_nc_team).
  check("2b: it lists the seventeen passages, each with its editor",
    sec.querySelectorAll(".cplfund-prose[data-textblock^=\"mc_\"]").length === 17);
  // A public rendering, as the public page's engine draws it: since 2026-10-15
  // (Sam's call 1) the tab's Public page view frames funding-model/.
  w.CPL_FUNDING_PUBLIC = true; T.render();
  check("2c: a public rendering carries no such section", !doc.querySelector('details[data-sec="mc_text"]'));
  w.CPL_FUNDING_PUBLIC = false;

  check("2d: a passage fills in its institution's figure by name",
    /qualifies for \$150,000 base funding/.test(T.mcTextHtml("mc_base", { "base award": "$150,000" })) &&
    /following three minimum conditions:/.test(T.mcTextHtml("mc_conds", { "condition count": "three" })));
  check("2e: a name the passage does not supply stays as typed, which shows the curator the slip",
    /\{cap\}/.test(T.mcTextHtml("mc_cap", {})));
  check("2f: an unknown key is not a passage", T.mcTextHtml("nope", {}) === null);

  T._setShared({ text: { mc_impl: "Your max award is **allocated** on *outcomes*.", mc_nc: "Noncredit: {noncredit portion}." } });
  w.CPL_FUNDING_PUBLIC = true; T.render();
  const pick = doc.getElementById("cplFundOnePick");
  const withNc = w.CPL_FUNDING.colleges.find(function (c) { return (c.ftes_nc || c.nc_ftes || 0) > 0; });
  pick.value = (withNc || w.CPL_FUNDING.colleges[0]).college;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  const panel = doc.querySelector("#cplFundOnePanel .cb-panel");
  check("2g: an edit reaches the block every surface draws, bold and italic rendered",
    !!panel && /Your max award is allocated on outcomes\./.test(panel.textContent) &&
    (panel.querySelector("strong") || {}).textContent !== undefined &&
    Array.prototype.some.call(panel.querySelectorAll(".cb-lab strong"), (e) => e.textContent === "allocated") &&
    Array.prototype.some.call(panel.querySelectorAll(".cb-lab em"), (e) => e.textContent === "outcomes"));
  check("2h: …and the institution's own figure fills the name in it",
    !withNc || /Noncredit: \$[\d,]+\./.test(panel.textContent));
  check("2i: the block's own house wording stays the fallback for a page without the module",
    /mcText\("mc_impl", \{\}, "Potential \(max\) funding available for the "/.test(read("college_briefing.js")));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
