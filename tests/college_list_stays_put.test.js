// The college list stays put while the model redraws (Sam, 2026-10-15, call 7:
// "the black box").
//
// Sam saw the college list on COBI's My College tab turn into a black box in
// Chrome. SkyMeridian measured the cause (cpl_memory
// my-college-list-replaced-by-model-redraws-2026-10-15): every funding-model
// update redrew the whole tab, so after Choose another college #cb-college was
// replaced seven times in about eight seconds and a list the reader had open
// vanished; the funding page's Step 1 list (#cplFundOnePick) was replaced five
// times while the page loaded. Guarded here on both surfaces with the REAL
// modules, by element identity (===), which is what a reader's open list needs:
//
//   (a) the explainer: model updates keep the same Step 1 list, and a choice
//       made on it patches its value and the line under it in place, with one
//       change handler however many redraws ran;
//   (b) My College: on the college list, model updates redraw nothing, so the
//       same #cb-college survives;
//   (c) My College: on a college's page, a model update waits while a list is
//       in use and redraws once it loses focus.
//
// Run from repo root: `npm test` (or `node tests/college_list_stays_put.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// ── (a) the explainer's Step 1 list ──────────────────────────────────────
{
  const dom = new JSDOM('<!doctype html><html><head></head><body>' +
    '<div id="cplFundStep1Mount"></div><div id="cplFundingMount"></div></body></html>',
    { url: "https://example.org/funding-model/", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.CPL_FUNDING_PUBLIC = true;
  w.CPL_FUNDING_EMBED = "college";
  w.fetch = function () { return new Promise(function () {}); };
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js"].forEach(run);
  const T = w.CPL_FUNDING_TAB, doc = w.document;
  T.boot();
  T.render();
  const first = doc.getElementById("cplFundOnePick");
  check("setup: the explainer paints its Step 1 list in its own mount", !!first &&
    doc.getElementById("cplFundStep1Mount").contains(first) && first.options.length > 100);
  for (let i = 0; i < 6; i++) T.render();
  check("(a1) six model updates keep the SAME list element", doc.getElementById("cplFundOnePick") === first);

  let chosen = 0;
  doc.addEventListener("cplfund:onechoice", function () { chosen++; });
  const KEY = w.CPL_FUNDING.colleges[0].college;
  first.value = KEY;
  first.dispatchEvent(new w.Event("change"));
  const line = () => doc.querySelector("#cplFundStep1Mount .cplfund-step1-s").textContent;
  check("(a2) a choice is made on the same list, and the line under it names the college",
    doc.getElementById("cplFundOnePick") === first && first.value === KEY && /^Showing /.test(line()));
  check("(a3) one change handler, however many redraws ran (the list is never re-wired by stacking)",
    chosen === 1);
  T.render(); T.render();
  check("(a4) redraws after the choice keep the list and its value", doc.getElementById("cplFundOnePick") === first &&
    first.value === KEY);
  doc.getElementById("cplFundOneClear").click();
  check("(a5) Choose another institution clears it in place", doc.getElementById("cplFundOnePick") === first &&
    first.value === "" && line() === "" && !doc.getElementById("cplFundOneClear"));
}

// ── (b) and (c): My College ───────────────────────────────────────────────
{
  const dom = new JSDOM('<!doctype html><html><head></head><body>' +
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div><div id="cplFundingMount"></div></div>' +
    '<div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.fetch = function () { return new Promise(function () {}); };
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js", "team_phrase.js", "college_briefing.js"].forEach(run);
  const T = w.CPL_FUNDING_TAB, B = w.CPL_COLLEGE_BRIEFING, doc = w.document;
  T.boot();
  const cfg = T._config ? T._config() : null;
  T.render();
  const names = w.CPL_FUNDING.colleges.slice(0, 3).map((c) => c.college);
  const root = doc.getElementById("college-briefing-root");
  const config = cfg || { projects: {} };
  B._state.scope = "college";
  B._state.data = { colleges: names, nameToId: {}, summaryByName: {},
    raw: { config: config, nameToId: {}, summaryById: {}, contactByName: {} } };
  B._state.data.briefing = B._buildBriefing({ config: config, college: null }, { scenario: B._briefingScenario(config), year: "1" });
  // A college was open, so the funding module is loaded; then Choose another college.
  B._state.college = names[0];
  B._loadFunding(root);
  B._state.college = null;
  B.render(root);
  const list = doc.getElementById("cb-college");
  check("setup: My College shows its college list after Choose another college", !!list && list.options.length === 4);
  list.focus();
  for (let i = 0; i < 7; i++) T.render();
  check("(b) seven model updates keep the SAME college list, still focused",
    doc.getElementById("cb-college") === list && doc.activeElement === list);

  // (c) a college's page, with a list in use
  B._state.college = names[0];
  B.render(root);
  const page = root.firstElementChild;
  const sel = doc.createElement("select");
  sel.innerHTML = "<option>one</option><option>two</option>";
  root.appendChild(sel);
  sel.focus();
  T.render(); T.render();
  check("(c1) on a college's page, a model update waits while a list is in use",
    sel.isConnected && root.firstElementChild === page && doc.activeElement === sel);
  sel.blur();
  check("(c2) ...and redraws once the list loses focus", !sel.isConnected && root.firstElementChild !== page);
  T.render();
  const page2 = root.firstElementChild;
  T.render();
  check("(c3) with no list in use, a model update redraws the college's page as before", root.firstElementChild !== page2);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
