// CPL Implementation Funding — Sam's My College view, 2026-10-15 (his mockup,
// all nine calls as proposed; cpl_memory sam-my-college-funding-view-asks-2026-10-15).
//
//   1. STEP 1 FIRST. "Make the College selector more prominent so folks see that
//      it is an important first step." One chooser (cplFundOnePick), first in the
//      College Dashboard on a public rendering, and in its own mount above the
//      Contents on the explainer.
//
// ⚠ SINCE 2026-10-15 (Sam's call 1 on the one public funding page) the tab's
// Public page view frames funding-model/ itself, so these checks draw the
// public rendering the way the public page's engine does (CPL_FUNDING_PUBLIC)
// rather than through the tab's retired preview.
//   2. THE CHOICE IS REMEMBERED in the reader's browser (call 9), and "Choose
//      another college" forgets it.
//   3. THE PDF ASKS FOR A COLLEGE FIRST, with the statewide page as the second
//      choice (call 5), and prints landscape.
//   4. THE PROJECT REGISTER STAYS INTERNAL. "The CPL project dashboard is internal
//      team information for now": a public rendering names the designated
//      projects and nothing of their status, percent complete or register
//      (call 3); the explainer drops its dashboard sentence and link.
//   5. FOLDS. The introduction folds on a public rendering (call 1); the
//      recommended strategies open there (call 4).
//   6. THE PANEL, simplified (call 7): plain tags, no red rule on the noncredit
//      line, the boxes stacked and the priorities side by side, the steps open.
//   7. THE EXPLAINER'S SHAPE: the institutions first, the Overview folded, the
//      Timeline after the outcomes and carrying the dates, one width (calls 1, 2, 7).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_my_college_view.test.js`).
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
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount"></div></div><div id="college-briefing-root"></div></body></html>',
    { url: opts.url || "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.public) w.CPL_FUNDING_PUBLIC = true;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.fetch = function () { return new Promise(function () {}); };
  if (opts.stored) w.localStorage.setItem("cplfund_one_choice_v1", opts.stored);
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
  T.__win = w;
  return { w, doc: w.document, T, printed };
}
const pub = (T) => { T.__win.CPL_FUNDING_PUBLIC = true; T.render(); };

// ─────────────────────────────────────────────────────────────────────────────
// 1-3. Step 1, the remembered choice, the PDF prompt (the tab's Public view)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { w, doc, T, printed } = setup();
  check("1a: the Internal view carries no Step 1", !doc.querySelector(".cplfund-step1"));
  pub(T);
  const step = doc.querySelector(".cplfund-step1");
  const sec = step && step.closest('[data-sec="college"]');
  // The view switch moved INTO the box (Sam, 2026-10-19) and leads it as
  // Step 1 since 2026-10-20; the chooser follows as Step 2. Nothing of the
  // switch is left under the section's introduction.
  const seg = step && step.querySelector(".cplfund-step1-view #cplFundCollegeView");
  check("1b: a public rendering carries the Step 1 box inside the College Dashboard, the view switch first as Step 1",
    !!step && !!sec && !!seg && !doc.querySelector(".cplfund-viewswitch") &&
    /^Step 1$/.test(step.querySelector(".cplfund-step1-view .cplfund-step1-k").textContent) &&
    Array.from(seg.querySelectorAll("button")).every((b) => (b.getAttribute("title") || "").length > 40));
  const pick = doc.getElementById("cplFundOnePick");
  check("1c: Step 2 names itself in words and labels its chooser",
    /^Step 2$/.test(step.querySelector(".cplfund-step1-pick .cplfund-step1-k2").textContent) &&
    doc.querySelector('label[for="cplFundOnePick"]').textContent === "Choose your college or district" &&
    !!pick && step.contains(pick) && pick.options[0].textContent === "Choose your college or district");
  check("1d: with nothing chosen the table shows, and nothing is stored",
    T._state.collegeView !== "one" && w.localStorage.getItem("cplfund_one_choice_v1") === null);

  // 3. PDF with no college chosen asks first, and prints nothing yet.
  const before = printed.length;
  click(w, doc.getElementById("cplFundPdfTop"));
  const dlg = doc.getElementById("cplFundPdfAsk");
  check("3a: PDF with no college chosen opens the prompt and prints nothing",
    !!dlg && dlg.hasAttribute("open") && printed.length === before &&
    /Choose a college first/.test(dlg.textContent));
  const go = doc.getElementById("cplFundPdfAskGo");
  check("3b: the prompt offers the same choices, Continue waits for one, and the statewide page is the second choice",
    !!go && go.disabled &&
    doc.getElementById("cplFundPdfAskPick").options.length === pick.options.length &&
    doc.getElementById("cplFundPdfAskState").textContent === "Print the statewide page instead" &&
    doc.getElementById("cplFundPdfAskCancel").textContent === "Cancel");
  click(w, doc.getElementById("cplFundPdfAskState"));
  const html = printed.length > before ? printed[printed.length - 1].html : "";
  check("3c: the statewide choice prints, and the print window is landscape",
    !dlg.hasAttribute("open") && printed.length === before + 1 && /@page\{size:letter landscape/.test(html));

  // 1-2. Choose a college in Step 2.
  const D = w.CPL_FUNDING;
  const one = D.colleges[0].college;
  let heard = null;
  doc.addEventListener("cplfund:onechoice", (e) => { heard = e.detail && e.detail.value; });
  pick.value = one;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("1e: choosing in Step 2 opens that institution's funding",
    T._state.collegeView === "one" && T._state.oneCollege === one && T.oneChoice() === one &&
    !!doc.querySelector("#cplFundOnePanel > .cb-panel"));
  check("2a: …remembers it in this browser and tells the page", w.localStorage.getItem("cplfund_one_choice_v1") === one &&
    heard === one);
  check("1f: …and Step 2 says what it shows, with Choose another institution beside it",
    /Showing /.test(doc.querySelector(".cplfund-step1-s").textContent) &&
    doc.getElementById("cplFundOneClear").textContent === "Choose another institution" &&
    doc.getElementById("cplFundOnePick").value === one);
  // 3. With a college chosen, PDF prints straight away.
  const n2 = printed.length;
  click(w, doc.getElementById("cplFundPdfTop"));
  check("3d: with a college chosen, PDF prints without asking", printed.length === n2 + 1);
  click(w, doc.getElementById("cplFundOneClear"));
  check("2b: Choose another institution forgets the choice and returns to the chooser",
    T.oneChoice() === "" && w.localStorage.getItem("cplfund_one_choice_v1") === null &&
    doc.getElementById("cplFundOnePick").value === "" && doc.activeElement === doc.getElementById("cplFundOnePick"));
}
{
  // 2. A returning reader sees their own funding first; a stale value is ignored.
  const s1 = setup({ stored: "Not A College" });
  pub(s1.T);
  check("2c: a stored value that names no institution is ignored", s1.T.oneChoice() === "");
  const D = s1.w.CPL_FUNDING;
  const one = D.colleges[1].college;
  const s2 = setup({ stored: one });
  check("2d: the Internal view never opens a remembered college", s2.T.oneChoice() === "");
  pub(s2.T);
  check("2e: a returning reader's Public view opens on their college",
    s2.T.oneChoice() === one && !!s2.doc.querySelector("#cplFundOnePanel > .cb-panel"));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4-5. The register stays internal; the folds
// ─────────────────────────────────────────────────────────────────────────────
{
  const { doc, T } = setup();
  T._setShared({
    projectGoals: { "1.4": ["C", "D"], "4.2": ["D"] },
    projectNames: { "1.4": "California Credential Registry", "4.2": "Apprenticeship Sprint" },
    yearPriorities: { "1": { "0": { strategies: ["Configure your College CPL Landing Page", "Post every exhibit"] } } }
  });
  T.render();
  const aboutInternal = doc.querySelector('details[data-sec="about"]');
  check("5a: the Internal view keeps the introduction open", !!aboutInternal && aboutInternal.open);
  pub(T);
  {
    // A fresh window: a reader of a public rendering arrives there, never from
    // the Internal view (a curator's own toggle holds for the visit, by design).
    const f = setup();
    pub(f.T);
    const about = f.doc.querySelector('details[data-sec="about"]');
    check("5b: a public rendering folds the introduction", !!about && !about.open);
  }
  const strat = doc.querySelectorAll("details.cplfund-strat");
  check("5c: a public rendering opens the recommended strategies",
    strat.length > 0 && Array.prototype.every.call(strat, (d) => d.open));
  const mount = doc.getElementById("cplFundingMount");
  const txt = mount.textContent;
  check("4a: a public rendering names the designated projects",
    /California Credential Registry/.test(txt) && /Apprenticeship Sprint/.test(txt));
  check("4b: …and says nothing of their status, percent complete or the register",
    !mount.querySelector(".cplfund-rprio-state") && !/% complete/.test(txt) &&
    !/Activities register/.test(txt) && !/tagged projects?/.test(txt));
  check("4c: …and no card says it awaits designated activities", !/Awaiting designated activities/.test(txt));
}
{
  const src = read("funding-model/index.html");
  check("4d: the explainer no longer points at the project dashboard",
    !/textContent = "CPL project dashboard"/.test(src) && !/reports its own progress/.test(src) &&
    !/href = "https:\/\/cpl-initiative\.github\.io\/cpl-project-tracker\/"/.test(src));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. The panel, simplified (college_briefing.js, every surface that shows it)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { w, doc, T } = setup();
  pub(T);
  const pick = doc.getElementById("cplFundOnePick");
  const withNc = w.CPL_FUNDING.colleges.find((c) => (c.ftes_nc || c.nc_ftes || 0) > 0) || w.CPL_FUNDING.colleges[0];
  pick.value = withNc.college;
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  const panel = doc.querySelector("#cplFundOnePanel .cb-panel");
  check("6a: the boxes' tags read as plain words",
    !!panel && panel.querySelectorAll(".cb-fbox header .cb-tagword").length === 2 &&
    !panel.querySelector(".cb-fbox header .cb-tag"));
  check("6b: the noncredit line carries no red rule", !!panel && !panel.querySelector(".cb-floor"));
  // The rendered half lives in college_briefing.test.js ("the nested steps
  // arrive open"), whose fixture carries a program's steps; this pins the call.
  check("6c: the funding block asks for its steps open",
    /stratHtml\(progPrio\.items, null, true\)/.test(read("college_briefing.js")));
  const css = read("college_briefing.js");
  check("6d: the two boxes stack, and the priorities sit side by side",
    /"\.cb-fund\{display:grid;grid-template-columns:minmax\(0,1fr\);/.test(css) &&
    /"\.cb-fund \.cb-prios\{display:flex;flex-wrap:wrap;/.test(css) &&
    /"\.cb-fund \.cb-prios > \.cb-prow\{flex:1 1 320px;min-width:0;\}"/.test(css));
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. The explainer's shape (static: funding_model_page.test.js loads the page)
// ─────────────────────────────────────────────────────────────────────────────
{
  const html = read("funding-model/index.html");
  const doc = new JSDOM(html).window.document;
  const ids = Array.from(doc.querySelectorAll("main > section")).map((s) => s.id);
  // The Introduction joined just before the Overview on 2026-10-15 (Sam's call 3).
  check("7a: the institutions first, the Introduction and the Overview next, the Timeline right after the outcomes",
    ids[0] === "institutions" && ids[1] === "introduction" && ids[2] === "overview" && ids[3] === "outcomes" &&
    ids[4] === "disbursement");
  check("7b: the Overview arrives folded, the Timeline open",
    !doc.querySelector("#overview details.fold").hasAttribute("open") &&
    doc.querySelector("#disbursement details.fold").hasAttribute("open"));
  check("7c: the dates live in the Timeline, ahead of the timing settings, and the outcomes carry outcomes",
    !!doc.querySelector("#disbursement #timing-list") && !doc.querySelector("#outcomes #timing-list") &&
    !!(doc.getElementById("timing-list").compareDocumentPosition(doc.querySelector('#disbursement [data-ftext="x_timing"]')) & 4) &&
    doc.querySelector("#outcomes summary h2").textContent === "Funding outcomes");
  check("7d: Step 1's mount sits between the masthead and the Contents",
    !!doc.getElementById("cplFundStep1Mount") &&
    !!(doc.querySelector("header.masthead").compareDocumentPosition(doc.getElementById("cplFundStep1Mount")) & 4) &&
    !!(doc.getElementById("cplFundStep1Mount").compareDocumentPosition(doc.getElementById("contents")) & 4));
  check("7e: every section runs one width, the institution table's",
    /\.wrap\{width:100%; max-width:1320px;/.test(html) && /\.wrap\.wide\{max-width:1320px\}/.test(html));
  check("7f: PDF goes through the tab's prompt, which asks for a college first",
    /T\.pdfGate\(function \(\) \{ window\.print\(\); \}\)/.test(html));
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. My College's Open My CPL Funding (Sam, 2026-10-21: "move funding to Implementation
//    Funding"): ?college=<roster key>&view=one opens the My Institution view on the college;
//    ?college= alone still opens the table's row.
// ─────────────────────────────────────────────────────────────────────────────
{
  const probe = setup();
  const KEY = probe.w.CPL_FUNDING.colleges[0].college;
  const one = setup({ public: true, url: "https://example.org/funding-model/?college=" + encodeURIComponent(KEY) + "&view=one" });
  one.T.render();
  check("8a: view=one opens My Institution on the college", one.T.oneChoice() === KEY);
  const box = one.doc.querySelector(".cplfund-step1");
  check("8b: the Step 1 box shows the My Institution view", !!box && box.getAttribute("data-view") === "one");
  const row = setup({ public: true, url: "https://example.org/funding-model/?college=" + encodeURIComponent(KEY) });
  row.T.render();
  check("8c: ?college= alone still opens the table, not My Institution", row.T.oneChoice() === "");
  const inner = setup({ url: "https://example.org/?college=" + encodeURIComponent(KEY) + "&view=one" });
  inner.T.render();
  check("8d: off a public rendering, view=one changes nothing", inner.T.oneChoice() === "");
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
