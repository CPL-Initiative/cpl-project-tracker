// tests/cpl_funding_step_two_view.test.js
//
// Sam's 2026-10-19 interface asks on the Implementation Funding tab (the side
// session beside S427), the three that change what a reader sees:
//
//   3. "Move the Funding by Institution and its buttons up in the Step 1 box
//      to the right so the user is prompted to select a view after a college.
//      Add hover over instructions for each button." The view control sits in
//      the Step 1 box, each button carrying its hover text; nothing of it stays
//      under the section's introduction. It keeps its id, so every reader of
//      the old switch still finds it, and it is redrawn on every patch of the
//      box so a redraw never leaves a button hearing each click twice.
//      REORDERED 2026-10-20 (Sam: "Refine the Step 1 and 2 by having the user
//      select first which view they want: 'All Institutions' or 'My
//      Institution' ... the hover over should clarify this", and "Once a view
//      is chosen, if user selects My Institutions, require them to choose one
//      (either college or district)"): the view is Step 1, on the left; the
//      chooser is Step 2, shown under My Institution alone, and the reader
//      lands on it when My Institution has none chosen.
//   4. "We can delete the button links to restoring default order and funding
//      defaults--I would just create a new scenario and make any changes
//      needed to do that." No Reset scenario to defaults for a signed-in
//      curator, no Restore the default section order anywhere. The locked
//      what-if keeps Reset exploration: it clears a private overlay, never the
//      shared model.
//   5. "Move the Scenario selector and text up to the right of the Project
//      selector (save real estate)." jsdom lays nothing out, so this pins the
//      rule and the two blocks it applies to; the rendering was measured in
//      Chromium at 1440, 1024, 768 and 390 when it shipped.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_step_two_view.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const click = (w, el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));

function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>' +
    (opts.external ? '<div id="cplFundStep1Mount"></div>' : "") +
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount"></div></div><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  if (opts.external) { w.CPL_FUNDING_PUBLIC = true; w.CPL_FUNDING_EMBED = "college"; }
  w.fetch = function () { return new Promise(function () {}); };
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js", "college_briefing.js"].forEach(run);
  const T = w.CPL_FUNDING_TAB;
  T.boot();
  return { w, doc: w.document, T };
}
function reviewerSession() {
  return { get: () => ({ access_token: "header.payload.sig", email: "co@cccco.edu" }), isFresh: () => true, onChange: () => {},
    authHeaders: () => ({ Authorization: "Bearer header.payload.sig" }) };
}

// ── 3. the view as Step 1, the chooser as Step 2 (the tab's Public view) ───
{
  const { w, doc, T } = setup();
  w.CPL_FUNDING_PUBLIC = true;
  T.render();
  const step = doc.querySelector(".cplfund-step1");
  const kids = step ? Array.from(step.children) : [];
  const view = kids[0], pickCol = kids[1];
  const seg = view && view.querySelector("#cplFundCollegeView");
  check("3a: the box leads with the view, headed Step 1, and the chooser follows, headed Step 2",
    kids.length === 2 && /\bcplfund-step1-view\b/.test(view.className) && !!seg &&
    view.querySelector(".cplfund-step1-k").textContent === "Step 1" &&
    view.querySelector(".cplfund-step1-vl").textContent === "Choose a view" &&
    /\bcplfund-step1-pick\b/.test(pickCol.className) && pickCol.contains(doc.getElementById("cplFundOnePick")) &&
    pickCol.querySelector(".cplfund-step1-k2").textContent === "Step 2" &&
    pickCol.querySelector('label[for="cplFundOnePick"]').textContent === "Choose your college or district");
  check("3b: nothing of the old switch stays under the section's introduction",
    !doc.querySelector(".cplfund-viewswitch") && doc.querySelectorAll("#cplFundCollegeView").length === 1);
  const btns = seg ? Array.from(seg.querySelectorAll("button")) : [];
  check("3c: the two views in Sam's words, each hover saying an institution is a college or a district",
    btns.map((b) => b.textContent).join("|") === "All Institutions|My Institution" &&
    btns.every((b) => /^An institution is a college or a district\. /.test(b.getAttribute("title") || "")) &&
    /max award/.test(btns[0].getAttribute("title")) && /Step 2/.test(btns[1].getAttribute("title")) &&
    /funding outcomes/.test(btns[1].getAttribute("title")));
  check("3d: All Institutions is the view a first visit opens on, and Step 2 waits hidden",
    btns[0].getAttribute("aria-pressed") === "true" && pickCol.hidden && step.getAttribute("data-view") === "all" &&
    !!doc.getElementById("cplFundTable"));
  // The box lays out as two columns, one at a tablet's width, kickers above on a phone.
  const css = doc.getElementById("cpl-funding-css").textContent;
  // An auto first column grows to the description's whole line and squeezed Step 2 to 21px (Sam's screenshot,
  // 2026-10-26); Step 2 keeps a 22rem floor, and with Step 2 hidden Step 1 takes the row.
  check("3e: two columns at desktop width, Step 2 never squeezed; Step 2 drops under Step 1 below 860px; Step 2 hides by its attribute",
    /\.cplfund-step1 \{ display: grid; grid-template-columns: minmax\(0,3fr\) minmax\(min\(100%,22rem\),2fr\);/.test(css) &&
    !/\.cplfund-step1 \{[^}]*grid-template-columns: auto/.test(css) &&
    /\.cplfund-step1\[data-view="all"\] \{ grid-template-columns: minmax\(0,1fr\); \}/.test(css) &&
    /@media \(max-width: 860px\) \{ \.cplfund-step1 \{ grid-template-columns: 1fr; \} \.cplfund-step1-pick \{ padding-left: 0; border-left: 0;/.test(css) &&
    /@media \(max-width: 560px\) \{ \.cplfund-step1-view, \.cplfund-step1-pick \{ flex-direction: column;/.test(css) &&
    /\.cplfund-step1-pick\[hidden\] \{ display: none; \}/.test(css));
  // My Institution first: Step 2 shows, the view asks for one, and the reader lands on the list.
  click(w, doc.querySelector('#cplFundCollegeView button[data-val="one"]'));
  const pick = doc.getElementById("cplFundOnePick");
  check("3f: My Institution shows Step 2 and puts the reader on its list, with no figures until one is chosen",
    T._state.collegeView === "one" && !doc.querySelector(".cplfund-step1-pick").hidden &&
    doc.querySelector(".cplfund-step1").getAttribute("data-view") === "one" &&
    doc.activeElement === pick && !doc.getElementById("cplFundTable") &&
    /Choose your college or district in Step 2/.test(doc.getElementById("cplFundOnePanel").textContent));
  const one = w.CPL_FUNDING.colleges[0].college;
  pick.value = one;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("3g: choosing one in Step 2 shows its funding, and the line names it",
    T._state.collegeView === "one" && T._state.oneCollege === one &&
    doc.querySelector('#cplFundCollegeView button[data-val="one"]').getAttribute("aria-pressed") === "true" &&
    !!doc.querySelector("#cplFundOnePanel") && /^Showing /.test(doc.querySelector(".cplfund-step1-s").textContent) &&
    doc.getElementById("cplFundOneClear").textContent === "Choose another institution");
  click(w, doc.querySelector('#cplFundCollegeView button[data-val="all"]'));
  check("3h: All Institutions from the box shows the table, hides Step 2, and keeps focus on its button",
    T._state.collegeView === "all" && !!doc.getElementById("cplFundTable") &&
    !doc.querySelector("#cplFundOnePanel > .cb-panel") && doc.querySelector(".cplfund-step1-pick").hidden &&
    doc.activeElement === doc.querySelector('#cplFundCollegeView button[data-val="all"]'));
  click(w, doc.querySelector('#cplFundCollegeView button[data-val="one"]'));
  check("3i: My Institution from the box brings the chosen college back, with focus on its button",
    T._state.collegeView === "one" && T._state.oneCollege === one && doc.getElementById("cplFundOnePick").value === one &&
    doc.activeElement === doc.querySelector('#cplFundCollegeView button[data-val="one"]'));
}

// ── 3, on the explainer: the box lives in an external mount and is PATCHED ──
{
  const { w, doc, T } = setup({ external: true });
  T.render();
  const mount = doc.getElementById("cplFundStep1Mount");
  const seg0 = mount.querySelector("#cplFundCollegeView");
  check("3j: the explainer's Step 1 mount carries the view control too", !!seg0 &&
    !doc.querySelector("#cplFundingMount #cplFundCollegeView"));
  const pick = mount.querySelector("#cplFundOnePick");
  T.render();
  check("3k: a redraw keeps the chooser and redraws the view buttons (so no button hears a click twice)",
    mount.querySelector("#cplFundOnePick") === pick && mount.querySelector("#cplFundCollegeView") !== seg0);
  click(w, mount.querySelector('#cplFundCollegeView button[data-val="one"]'));
  check("3l: My Institution from the external box shows Step 2 there, on the same list",
    !mount.querySelector(".cplfund-step1-pick").hidden && mount.querySelector("#cplFundOnePick") === pick &&
    doc.activeElement === pick);
  const one = w.CPL_FUNDING.colleges[1].college;
  pick.value = one;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  let renders = 0;
  const off = T.onModelChange(() => { renders++; });
  click(w, mount.querySelector('#cplFundCollegeView button[data-val="all"]'));
  off();
  check("3m: one click from the external box is one change, and Step 2 hides again",
    T._state.collegeView === "all" && renders === 1 && mount.querySelector(".cplfund-step1-pick").hidden &&
    mount.querySelector("#cplFundOnePick") === pick);
}

// ── 4. the two default-restoring controls are gone ───────────────────────────
{
  const { w, doc, T } = setup();
  w.CPL_SESSION = reviewerSession();
  T._setShared({ pool: { admin_cost: 900000 }, secOrder: ["timing", "about"] });
  T.render();
  // The mount's words, never the body's: the scripts are appended as text.
  const words = doc.getElementById("cplFundingMount").textContent;
  check("4a: a signed-in curator with edits sees no Reset scenario to defaults",
    !!doc.querySelector(".cplfund-authbar .mode.shared") && !doc.getElementById("cplFundReset") &&
    !/Reset scenario to defaults/.test(words));
  check("4b: a custom section order offers no Restore the default section order",
    !doc.getElementById("cplFundSecOrderReset") && !/Restore the default section order/.test(words));
  check("4c: New scenario is the way to start over, and it is still offered",
    !!doc.getElementById("cplFundScenNew"));
  const src = read("cpl_funding.js");
  check("4d: the two controls are gone from the file, not hidden",
    !/cplFundSecOrderReset/.test(src) && !/Reset scenario to defaults/.test(src) && !/secOrderIsCustom\(/.test(src));
}
{
  const { w, doc, T } = setup();
  T._setScenario({ pool: { admin_cost: 950000 } });
  T.render();
  check("4e: the locked what-if keeps Reset exploration (a private overlay, never the shared model)",
    !!doc.querySelector(".cplfund-authbar .mode.scenario") &&
    doc.getElementById("cplFundReset") && doc.getElementById("cplFundReset").textContent === "Reset exploration");
}

// ── 5. the Scenario block sits to the right of the Project block ─────────────
{
  const { w, doc, T } = setup();
  w.CPL_SESSION = reviewerSession();
  T.render();
  const strip = doc.querySelector(".cplfund-strip");
  const blocks = strip ? Array.from(strip.children) : [];
  check("5a: the strip holds the Project block, then the Scenario block, each marked",
    blocks.length === 2 && /\bcplfund-ctl-proj\b/.test(blocks[0].className) && /\bcplfund-ctl-scen\b/.test(blocks[1].className) &&
    !!blocks[0].querySelector("#cplFundProjSel") && !!blocks[1].querySelector("#cplFundScenSel") &&
    !!blocks[1].querySelector(".cplfund-pubstate"));
  const css = doc.getElementById("cpl-funding-css").textContent;
  check("5b: the strip never wraps a block under the other; each block wraps its own words",
    /\.cplfund-strip \{ display: flex; flex-wrap: nowrap;/.test(css) &&
    /\.cplfund-ctl \{ display: inline-flex; align-items: center; gap: 7px; flex-wrap: wrap; min-width: 0; \}/.test(css) &&
    /\.cplfund-ctl-scen \{ flex: 1 1 18rem; \}/.test(css));
  check("5c: on a phone the strip still stacks", /@media \(max-width: 640px\)[\s\S]*\.cplfund-strip \{ flex-direction: column; align-items: stretch;/.test(css));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
