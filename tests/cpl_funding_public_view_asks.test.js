// CPL Implementation Funding — Sam's Public view asks of 2026-09-30 (S307).
//
//   1. THE PUBLISHED SCENARIO OPENS. "Make the published scenario the default
//      view that opens": a scenario this browser picked on an earlier visit is
//      no longer restored; every load starts on the published one, and a
//      curator's pick holds for the visit.
//   2. AS COLLEGES SEE IT. "A button to the Public View that allows curators to
//      see the public view as they see it (without the curator choices
//      showing)", flipping back and forth. The Public view also opens by link,
//      ?fundview=public (the videos' way back).
//   3. MY CPL FUNDING AT THE TOP, BY COLLEGE OR DISTRICT, WITH A PDF. "Add
//      another copy of the My CPL Funding view button (allowing users to select
//      their college or district) to the top of the public view tab and
//      Explainer view ... and add a pdf button on all the My CPL Funding views."
//   4. The explainer's header button, My College's PDF button and the printer
//      they share.
//
// Windows: 6. Run from repo root: `npm test`
// (or `node tests/cpl_funding_public_view_asks.test.js`).
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
// A window with both modules loaded, as COBI loads them. `printed` collects
// what the print window was handed.
function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head><style>.probe{color:red}</style></head><body>' +
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount"></div></div><div id="college-briefing-root"></div></body></html>',
    { url: opts.url || "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.fetch = function () { return new Promise(function () {}); };
  if (opts.signedIn) w.CPL_SESSION = session();
  if (opts.selection) w.localStorage.setItem("cpl_funding_selection_v1", JSON.stringify(opts.selection));
  const printed = [];
  w.open = function () {
    const doc = { html: "", open: function () {}, write: function (s) { doc.html += s; }, close: function () {} };
    printed.push(doc);
    return { document: doc, focus: function () {}, print: function () {} };
  };
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js", "college_briefing.js"].forEach(run);
  const T = w.CPL_FUNDING_TAB;
  T.boot();
  return { w, doc: w.document, T, B: w.CPL_COLLEGE_BRIEFING, printed };
}
const click = (w, el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));
function scen(title) {
  return { years: ["2026-27", "2027-28"], mirrorYears: true, disbursement: "frontload",
    yearPriorities: { "1": { "0": { share: 0.5, title: title, factor: 0.5, metric: "Applied CPL", metric_src: "pa_u" } } } };
}
const CFG = { projects: { "cpl-implementation": { label: "CPL", area: "cpl", published: "Scenario 2",
  scenarios: { "Scenario 1": scen("One"), "Scenario 2": scen("Two") } } } };

// ─────────────────────────────────────────────────────────────────────────────
// 1. The published scenario opens
// ─────────────────────────────────────────────────────────────────────────────
{
  const { w, T } = setup({ signedIn: true, selection: { project: "cpl-implementation", scenario: "Scenario 1" } });
  T._setConfig(CFG);
  T.render();
  check("1a: a browser that picked Scenario 1 last visit opens on the published Scenario 2",
    T._scenario().name === "Scenario 2" && T._scenario().published === "Scenario 2");
  const sel = w.document.getElementById("cplFundScenSel");
  if (sel) {
    sel.value = "Scenario 1";
    sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  }
  T._setConfig(CFG);   // a config re-read in the same visit (Refresh, another window's save)
  check("1b: a curator's pick holds for the visit, through a config re-read",
    !!sel && T._scenario().name === "Scenario 1");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. As colleges see it
// ─────────────────────────────────────────────────────────────────────────────
{
  const { w, doc, T } = setup({ signedIn: true });
  T._state.previewPublic = true;
  T.render();
  const mount = doc.getElementById("cplFundingMount");
  const curatorBits = () => mount.querySelectorAll(
    "[data-secpvhide], [data-secpvshow], [data-secpvpos], [data-pubsechide], [data-pubsecshow], [data-pubsecpos], " +
    ".cplfund-pubsec, .cplfund-sec-stub, #cplFundSecOrderReset, #cplFundPubOrderReset").length;
  const eye = () => doc.getElementById("cplFundPublicEye");
  check("2a: in the Public view a curator sees the curator choices and the As colleges see it button, unpressed",
    curatorBits() > 0 && !!eye() && eye().getAttribute("aria-pressed") === "false" && eye().textContent === "As colleges see it");
  click(w, eye());
  check("2b: pressed, every curator choice leaves the page and the button stays, pressed",
    curatorBits() === 0 && !/Curator only/.test(mount.textContent) && !!eye() && eye().getAttribute("aria-pressed") === "true");
  check("2c: …and focus stays on it, so a keyboard user can flip straight back", doc.activeElement === eye());
  click(w, eye());
  check("2d: pressed again, the curator choices return", curatorBits() > 0 && eye().getAttribute("aria-pressed") === "false");
  T._state.previewPublic = false;
  T.render();
  check("2e: the Internal view has no such button", !eye());
}
{
  const { doc, T } = setup();
  T._state.previewPublic = true;
  T.render();
  check("2f: signed out, the Public view offers no curator switch", !doc.getElementById("cplFundPublicEye"));
}
{
  const { doc } = setup({ url: "https://example.org/?fundview=public#implementation-funding" });
  const pressed = doc.querySelector('[data-viewmode="public"]');
  check("2g: ?fundview=public opens the tab on the Public view",
    !!pressed && pressed.getAttribute("aria-pressed") === "true" && !doc.getElementById("cplFundDraftMemo"));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. My CPL Funding at the top, by college or district, with a PDF
// ─────────────────────────────────────────────────────────────────────────────
{
  const { w, doc, T, printed } = setup();
  const D = w.CPL_FUNDING;
  check("3a: the Internal view carries no top My CPL Funding button", !doc.getElementById("cplFundMyFundingTop"));
  T._state.previewPublic = true;
  T.render();
  const top = doc.getElementById("cplFundMyFundingTop");
  check("3b: the Public view carries My CPL Funding in its top row of actions",
    !!top && top.textContent === "My CPL Funding" && !!top.closest(".cplfund-actions"));
  click(w, top);
  const pick = doc.getElementById("cplFundOnePick");
  check("3c: pressed, it opens the one-institution view and puts the reader on the chooser",
    T._state.collegeView === "one" && !!pick && doc.activeElement === pick);
  const groups = Array.from(pick.querySelectorAll("optgroup")).map((g) => g.getAttribute("label"));
  check("3d: the chooser offers Institutions and Districts", JSON.stringify(groups) === JSON.stringify(["Institutions", "Districts"]));
  const byD = {};
  D.colleges.forEach((c) => { if (c.district) (byD[c.district] = byD[c.district] || []).push(c.college); });
  const multi = Object.keys(byD).filter((d) => byD[d].length > 1);
  const dvals = Array.from(pick.querySelectorAll('optgroup[label="Districts"] option')).map((o) => o.value);
  check("3e: every district of two or more institutions is offered, and no other",
    dvals.length === multi.length && multi.every((d) => dvals.indexOf("d:" + d) !== -1));
  const pdf = () => doc.getElementById("cplFundOnePdf");
  check("3f: Save as PDF sits beside the chooser, disabled until a choice is made", !!pdf() && pdf().disabled);
  // A district: its line, then each institution's block.
  const dist = multi.sort((a, b) => byD[b].length - byD[a].length)[0];
  pick.value = "d:" + dist;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  const panel = doc.getElementById("cplFundOnePanel");
  const members = panel.querySelectorAll(".cplfund-onemember");
  check("3g: a district shows its line and one block per institution",
    !!panel.querySelector(".cplfund-onedist h3") && members.length === byD[dist].length &&
    // One through nine spelled out (Sam's mockup round, 2026-10-01).
    new RegExp("(" + byD[dist].length + "|" + ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][byD[dist].length] + ") institutions", "i")
      .test((panel.querySelector(".cplfund-onedist") || { textContent: "" }).textContent) &&
    Array.from(members).every((m) => m.querySelector(".cb-panel")));
  const names = Array.from(members).map((m) => (m.querySelector("h4.cplfund-onemember-h") || {}).textContent || "");
  check("3g2: each block sits under its institution's name, alphabetical, labeling its region",
    names.length === byD[dist].length && names.every((n) => n.length > 0) &&
    JSON.stringify(names) === JSON.stringify(names.slice().sort((a, b) => a.localeCompare(b))) &&
    Array.from(members).every((m) => m.getAttribute("aria-labelledby") === m.querySelector("h4").id));
  const distLine = (panel.querySelector(".cplfund-onedist") || { textContent: "" }).textContent;
  check("3h: the district line carries the max award total and the current total",
    /a combined max award of \$[\d,]+/.test(distLine) && /a current total of (\$|<\$)[\d,]+/.test(distLine));
  check("3i: with a choice made, Save as PDF is enabled", !!pdf() && !pdf().disabled);
  click(w, pdf());
  const html = printed.length ? printed[printed.length - 1].html : "";
  check("3j: the PDF window holds this view under the light theme, titled for the district",
    /data-theme="light"/.test(html) && html.indexOf("My CPL Funding: " + dist.replace(/\s+Community College District$/i, " CCD")) !== -1 &&
    /cplfund-onedist/.test(html) && /\.probe\{color:red\}/.test(html));
  check("3k: …with no control left in it", !/<button|<select|<input/.test(html));
  // One institution.
  const one = D.colleges[0].college;
  doc.getElementById("cplFundOnePick").value = one;
  doc.getElementById("cplFundOnePick").dispatchEvent(new w.Event("change", { bubbles: true }));
  check("3l: an institution shows its own block alone",
    !!doc.querySelector("#cplFundOnePanel > .cb-panel") && !doc.querySelector("#cplFundOnePanel .cplfund-onedist"));
  check("3m: the institution's block carries no PDF button of its own (the toolbar's covers the view)",
    !doc.querySelector("#cplFundOnePanel [data-cbpdf]"));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. The explainer's button, My College's button, the shared printer
// ─────────────────────────────────────────────────────────────────────────────
{
  const html = read("funding-model/index.html");
  // In the action bar at the top since 2026-10-01 (the Fact Sheet's title row),
  // the one filled button there.
  const bar = html.slice(html.indexOf('<div class="actionbar">'), html.indexOf("<header", html.indexOf('<div class="actionbar">')));
  check("4a: the explainer's action bar carries My CPL Funding as its lead button, linked to the table",
    /<a class="btn primary" id="my-funding-btn" href="#institutions">My CPL Funding<\/a>/.test(bar) &&
    (bar.match(/class="btn primary"/g) || []).length === 1);
  check("4b: …and its click opens the table's fold, then the one-institution view through the module",
    /getElementById\("my-funding-btn"\)[\s\S]{0,600}T\.showMyFunding\(\)/.test(html) &&
    /getElementById\("my-funding-btn"\)[\s\S]{0,300}sectionFold\(document\.getElementById\("institutions"\)\)/.test(html));
}
{
  const { w, B, printed } = setup();
  const el = w.document.createElement("div");
  el.innerHTML = '<details><summary>Fold</summary><p>Inside</p></details><div data-noprint="1">Row</div>' +
    '<button type="button">Press</button><p>Figures</p>';
  const ok = B.printPanel(el, "My CPL Funding: Test");
  const html = printed[0] ? printed[0].html : "";
  check("4c: the printer opens every fold and drops controls and no-print rows",
    ok === true && /<details open="">/.test(html) && !/<button/.test(html) && !/>Row</.test(html) && /Figures/.test(html));
  w.open = function () { return null; };
  check("4d: a blocked print window reports false rather than throwing", B.printPanel(el, "x") === false);
  const src = read("college_briefing.js");
  check("4e: My College's own block carries Save as PDF, wired to the printer",
    /if \(!ctx\.standalone\) \{[\s\S]{0,200}data-cbpdf="1"[\s\S]{0,200}Save as PDF/.test(src) &&
    /\[data-cbpdf\][\s\S]{0,300}printPanel\(sec, "My CPL Funding: "/.test(src));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. The videos lead back (Sam, 2026-09-30: "Add a link to get back to the
//    public view and explainer view to the video explainer")
// ─────────────────────────────────────────────────────────────────────────────
{
  const PUBLIC_VIEW = "https://cpl-initiative.github.io/cpl-project-tracker/?fundview=public#implementation-funding";
  const pages = ["funding_in_motion.html", "funding_in_motion_s2.html", "funding_in_motion_n1.html", "funding_in_motion_n2.html"];
  const ok = pages.every((f) => {
    const html = read("prototype/funding_video/" + f);
    const ctl = html.slice(html.indexOf('<div class="controls">'), html.indexOf("</div>", html.indexOf('id="dl"')));
    const ex = /<a class="btn" id="to-explainer" href="([^"]+)">Back to the explainer<\/a>/.exec(ctl);
    return !!ex && /\/funding-model\//.test(ex[1]) &&
      ctl.indexOf('<a class="btn" id="to-public" href="' + PUBLIC_VIEW + '">Back to the public view</a>') !== -1;
  });
  check("5a: every video page carries both ways back in its control row, which stays on screen", ok);
  check("5b: the Scenario 2 pages lead back to the Scenario 2 explainer",
    ["funding_in_motion_s2.html", "funding_in_motion_n2.html"].every((f) =>
      /id="to-explainer" href="[^"]*\?scenario=Scenario%202"/.test(read("prototype/funding_video/" + f))));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
