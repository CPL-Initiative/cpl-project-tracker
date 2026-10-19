// tests/cpl_funding_step_two_view.test.js
//
// Sam's 2026-10-19 interface asks on the Implementation Funding tab (the side
// session beside S427), the three that change what a reader sees:
//
//   3. "Move the Funding by Institution and its buttons up in the Step 1 box
//      to the right so the user is prompted to select a view after a college.
//      Add hover over instructions for each button." The All institutions ·
//      My CPL Funding control is Step 2, inside the Step 1 box, each button
//      carrying its hover text; nothing of it stays under the section's
//      introduction. It keeps its id, so every reader of the old switch still
//      finds it, and it is redrawn on every patch of the box so a redraw never
//      leaves a button hearing each click twice.
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

// ── 3. Step 2 in the Step 1 box (the tab's Public view) ─────────────────────
{
  const { w, doc, T } = setup();
  w.CPL_FUNDING_PUBLIC = true;
  T.render();
  const step = doc.querySelector(".cplfund-step1");
  const view = step && step.querySelector(".cplfund-step1-view");
  const seg = view && view.querySelector("#cplFundCollegeView");
  check("3a: the view control sits inside the Step 1 box, in its own column, headed Step 2",
    !!view && !!seg && /^Step 2$/.test(view.querySelector(".cplfund-step1-k2").textContent) &&
    view.querySelector(".cplfund-step1-vl").textContent === "Choose a view");
  check("3b: nothing of the old switch stays under the section's introduction",
    !doc.querySelector(".cplfund-viewswitch") && doc.querySelectorAll("#cplFundCollegeView").length === 1);
  const btns = seg ? Array.from(seg.querySelectorAll("button")) : [];
  check("3c: the two views, in Sam's words, each with hover text saying what it shows",
    btns.map((b) => b.textContent).join("|") === "All institutions|My CPL Funding" &&
    /max award/.test(btns[0].getAttribute("title") || "") &&
    /chosen in Step 1/.test(btns[1].getAttribute("title") || ""));
  // The box lays out as a three-column grid, one column on a phone.
  const css = doc.getElementById("cpl-funding-css").textContent;
  check("3d: three columns at desktop width, and the view column drops below on a phone",
    /\.cplfund-step1 \{ display: grid; grid-template-columns: auto minmax\(0,1fr\) auto;/.test(css) &&
    /@media \(max-width: 560px\) \{ \.cplfund-step1 \{ grid-template-columns: 1fr; \}[^}]*\}[^@]*\.cplfund-step1-view \{ grid-column: auto; grid-row: auto;/.test(css));
  // The buttons work from the box: choose a college, then switch views.
  const one = w.CPL_FUNDING.colleges[0].college;
  const pick = doc.getElementById("cplFundOnePick");
  pick.value = one;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("3e: choosing a college turns My CPL Funding on", T._state.collegeView === "one" &&
    doc.querySelector('#cplFundCollegeView button[data-val="one"]').getAttribute("aria-pressed") === "true" &&
    !!doc.querySelector("#cplFundOnePanel"));
  click(w, doc.querySelector('#cplFundCollegeView button[data-val="all"]'));
  check("3f: All institutions from the box shows the table", T._state.collegeView === "all" &&
    !!doc.getElementById("cplFundTable") && !doc.querySelector("#cplFundOnePanel > .cb-panel"));
  click(w, doc.querySelector('#cplFundCollegeView button[data-val="one"]'));
  check("3g: My CPL Funding from the box brings the chosen college back", T._state.collegeView === "one" &&
    T._state.oneCollege === one && doc.getElementById("cplFundOnePick").value === one);
}

// ── 3, on the explainer: the box lives in an external mount and is PATCHED ──
{
  const { w, doc, T } = setup({ external: true });
  T.render();
  const mount = doc.getElementById("cplFundStep1Mount");
  const seg0 = mount.querySelector("#cplFundCollegeView");
  check("3h: the explainer's Step 1 mount carries the view control too", !!seg0 &&
    !doc.querySelector("#cplFundingMount #cplFundCollegeView"));
  const pick = mount.querySelector("#cplFundOnePick");
  T.render();
  check("3i: a redraw keeps the chooser and redraws the view buttons (so no button hears a click twice)",
    mount.querySelector("#cplFundOnePick") === pick && mount.querySelector("#cplFundCollegeView") !== seg0);
  const one = w.CPL_FUNDING.colleges[1].college;
  pick.value = one;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  let renders = 0;
  const off = T.onModelChange(() => { renders++; });
  click(w, mount.querySelector('#cplFundCollegeView button[data-val="all"]'));
  off();
  check("3j: one click from the external box is one change", T._state.collegeView === "all" && renders === 1);
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
