// tests/cpl_funding_my_institution_hidden.test.js
//
// Sam, 2026-10-27 (S500): "OK, let's hide the My Institution and save the code ...
// Later, when the My College or CPL Pathways pages are better settled, we can throw on
// a link to either on the dash college row." Then: "Hiding will mean hiding the Step 1
// and 2 at the top and any other link to it."
//
// With the switch off (the default, cpl_funding.js oneViewOn):
//   1. a public rendering paints no Step 1 or Step 2, no view buttons and no chooser,
//      and the explainer's Step 1 band is hidden, not left as an empty region;
//   2. PDF prints the page without asking for a college;
//   3. every way into the view opens the institution's row on the dashboard instead:
//      ?college=…&view=one, chooseOne (a college, or a district's colleges), and
//      showMyFunding does nothing;
//   4. the readers of the choice (oneChoice, landingPage) see none.
// window.CPL_FUNDING_ONE_VIEW = true brings Step 1 back, which is what the suites that
// keep the view's code honest set. My College's link is in college_briefing.test.js.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_my_institution_hidden.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>' +
    (opts.explainer ? '<section class="wrap step1-wrap" aria-label="Step 1, choose a view"><div id="cplFundStep1Mount"></div></section>' : "") +
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount"></div></div></body></html>',
    { url: "https://example.org/" + (opts.explainer ? "funding-model/" : "") + (opts.search || ""), runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.CPL_FUNDING_PUBLIC = true;
  if (opts.explainer) w.CPL_FUNDING_EMBED = "college";
  if (opts.on) w.CPL_FUNDING_ONE_VIEW = true;
  w.fetch = function () { return new Promise(function () {}); };
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js"].forEach(run);
  const T = w.CPL_FUNDING_TAB;
  T.boot();
  return { w, doc: w.document, T, D: w.CPL_FUNDING };
}

// 1. No Step 1 or Step 2 on either public rendering.
{
  const { doc, T } = setup();
  check("1a: the tab's public rendering paints no Step 1 box, no view buttons and no chooser",
    !doc.querySelector(".cplfund-step1") && !doc.getElementById("cplFundCollegeView") && !doc.getElementById("cplFundOnePick"));
  check("1b: …and shows the institution table", !!doc.getElementById("cplFundTable"));
  check("1c: oneChoice and landingPage see no institution", T.oneChoice() === "" && T.landingPage() === null);
}
{
  const { doc } = setup({ explainer: true });
  const mount = doc.getElementById("cplFundStep1Mount");
  check("1d: the explainer's Step 1 mount is empty", !!mount && mount.innerHTML === "");
  check("1e: …and its band is hidden, so no empty labeled region sits above the Contents",
    mount.parentNode.hidden === true);
  check("1f: …and the table shows", !!doc.getElementById("cplFundTable"));
}

// 2. PDF prints the page at once.
{
  const { doc, T } = setup({ explainer: true });
  let printed = 0;
  T.pdfGate(function () { printed++; });
  check("2a: PDF prints without asking for a college", printed === 1 && !doc.getElementById("cplFundPdfAsk"));
}

// 3. Every way in opens the row instead.
{
  const { doc, T, D } = setup({ explainer: true, search: "?college=" + encodeURIComponent(D_FIRST()) + "&view=one" });
  const c = D_FIRST();
  check("3a: ?view=one opens the institution's row on the dashboard, not My Institution",
    T._state.collegeView === "all" && T._state.open["c:" + c] === true && !!doc.getElementById("cplFundTable") &&
    !doc.getElementById("cplFundOnePanel"));
  check("3b: showMyFunding does nothing", T.showMyFunding() === false && T._state.collegeView === "all");
  const other = D.colleges[1].college;
  T.chooseOne(other);
  check("3c: chooseOne opens that college's row and leaves the view on the dashboard",
    T._state.collegeView === "all" && T._state.oneCollege === "" && T._state.open["c:" + other] === true &&
    !doc.getElementById("cplFundOnePanel"));
  const byD = {};
  D.colleges.forEach((x) => { if (x.district) (byD[x.district] = byD[x.district] || []).push(x.college); });
  const dist = Object.keys(byD).find((k) => byD[k].length > 1);
  T.chooseOne("d:" + dist);
  check("3d: a district choice opens each of its colleges' rows, grouped by district",
    T._state.group === "district" && byD[dist].every((m) => T._state.open["c:" + m] === true));
}
function D_FIRST() {
  // The roster's first college, read from the data file the page loads.
  const dom = new JSDOM("<!doctype html><body></body>", { runScripts: "outside-only" });
  dom.window.eval(read("cpl_funding_data.js"));
  return dom.window.CPL_FUNDING.colleges[0].college;
}

// 4. The switch brings it back.
{
  const { doc } = setup({ explainer: true, on: true });
  const mount = doc.getElementById("cplFundStep1Mount");
  check("4a: with window.CPL_FUNDING_ONE_VIEW = true, Step 1 paints again and its band shows",
    !!mount.querySelector("#cplFundCollegeView") && !!mount.querySelector("#cplFundOnePick") && mount.parentNode.hidden === false);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
