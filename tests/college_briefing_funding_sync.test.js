// My College — My CPL Funding follows the model (SkyRivet, S306, 2026-09-30).
//
// Sam: "make sure the My College, My CPL Funding block (screenshot) is updated
// upon funding refresh." The funding box read the module fresh on every paint,
// but the strategies nested under it came from the page's own copy of the
// config, read once at load, and from the scenario chosen then. After a publish
// the box showed Scenario 2's funding and dropped every strategy, because
// Scenario 1's list no longer lined up. Guarded here with the REAL funding
// module and the REAL briefing in one window, as COBI runs them:
//
//   (a) a publish reaches the block: the priorities, their funding and their
//       strategies all come from the newly published scenario;
//   (b) before the module has read the shared config, its default config is
//       never adopted (that would drop every strategy);
//   (c) the block names itself to the Refresh splash;
//   (d) fundingPanel() renders the same block for the funding page's
//       My CPL Funding view, pointing at the table beside it.
//
// Run from repo root: `npm test` (or `node tests/college_briefing_funding_sync.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dom = new JSDOM('<!doctype html><html><head></head><body>' +
  '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div><div id="cplFundingMount"></div></div>' +
  '<div id="college-briefing-root"></div><div id="panel"></div></body></html>',
  { url: "https://example.org/", runScripts: "dangerously" });
const w = dom.window;
w.scrollTo = function () {};
w.CPL_FUNDING_NO_REMOTE = true;
w.fetch = function () { return new Promise(function () {}); };
function run(f) { const s = w.document.createElement("script"); s.textContent = fs.readFileSync(f, "utf8"); w.document.body.appendChild(s); }
["college_short_names.js", "cpl_funding_data.js", "cpl_funding_performance.js", "cpl_funding.js", "team_phrase.js", "college_briefing.js"].forEach(run);
const T = w.CPL_FUNDING_TAB, B = w.CPL_COLLEGE_BRIEFING;

// Two scenarios in Sam's two shapes: Scenario 1 funds three measured
// priorities, Scenario 2 two, each with its own strategies.
function scen(shares, removed) {
  return { years: ["2026-27", "2027-28"], mirrorYears: true, prioRemoved: removed, disbursement: "frontload", priorityOrder: [0, 2, 1],
    yearPriorities: { "1": {
      "0": { goals: ["A"], share: shares[0], title: "Access", factor: 0.5, metric: "Applied CPL", metric_src: "pa_u", strategies: ["Access step " + shares[0]] },
      "1": { share: shares[1], title: "Completion with Transcription", factor: 0.5, metric: "Transcribed", metric_src: "p3_u" },
      "2": { goals: ["B"], share: shares[2], title: "Completion", factor: 0.5, metric: "Transcribed with counselor", metric_src: "ptc_u", strategies: ["Completion step " + shares[2]] },
      "3": { goals: ["C"], share: shares[3], factor: 0.5, strategies: ["Career step"] } } } };
}
function cfg(pub) {
  return { projects: { "cpl-implementation": { label: "CPL", area: "cpl", published: pub,
    scenarios: { "Scenario 1": scen([0.33, 0.33, 0.34, 0.33], [1]), "Scenario 2": scen([0.5, 0.33, 0.5, 0], [1, 3]) } } } };
}
T.boot();
const c1 = cfg("Scenario 1");
T._setConfig(c1);
T.render();

const KEY = w.CPL_FUNDING.colleges[0].college;   // a roster college, read not typed
const root = w.document.getElementById("college-briefing-root");
B._state.scope = "college";
B._state.data = { colleges: [KEY], nameToId: {}, summaryByName: {}, raw: { config: c1, nameToId: {}, summaryById: {}, contactByName: {} } };
B._state.college = KEY;
B._state.data.briefing = B._buildBriefing({ config: c1, college: null }, { scenario: B._briefingScenario(c1), year: "1" });
B._loadFunding(root);
const block = () => {
  const t = (root.querySelector('[data-sec="funding"]') || root).textContent.replace(/\s+/g, " ");
  return (/What counts toward it(.*?)Reaching a target/.exec(t) || [])[1] || "";
};
const money = (v) => "$" + Math.round(v).toLocaleString("en-US");

const s1 = block();
check("setup: Scenario 1 shows three funded priorities, each with its step",
  /Access/.test(s1) && /Completion/.test(s1) && /Career attainment/.test(s1) && /Access step 0\.33/.test(s1) && /Career step/.test(s1));

// (a) publish Scenario 2 — the way loadShared adopts a new row
T._setConfig(cfg("Scenario 2"));
T.render();
const s2 = block();
const p2 = T._prios(KEY, "1");
check("(a) a publish reaches the block: two priorities, Career attainment gone",
  !/Career attainment/.test(s2) && p2.length === 2 && /Access/.test(s2) && /Completion/.test(s2));
check("(a) the funding is the new scenario's, read from the model",
  s2.indexOf(money(p2[0].cap)) >= 0 && s2.indexOf(money(p2[1].cap)) >= 0);
check("(a) ⭐ and the strategies follow it (they were dropped before 2026-09-30)",
  /Access step 0\.5/.test(s2) && /Completion step 0\.5/.test(s2) && !/Access step 0\.33/.test(s2));
check("(a) the briefing now reads the model's own config", B._state.data.raw.config === T._scenario().config);

// (b) never adopt the module's default config
const src = fs.readFileSync("college_briefing.js", "utf8");
check("(b) the config is adopted only once the module has read the shared one",
  /if \(!s \|\| !s\.loaded \|\| !s\.config/.test(src) && T._scenario().loaded === true);

// (c) the Refresh splash hears what this block shows (it paints once the
// re-read resolves, a microtask later)
T._refreshAll();
setTimeout(function () {
  const dlg = w.document.querySelector("#cplFundSplash .cplfund-splash");
  check("(c) the block names itself to the Refresh splash",
    dlg && new RegExp("My College: My CPL Funding — redrawn for " + KEY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " \\(Scenario 2\\)").test(dlg.textContent));

  // (d) the standalone block
  const panel = w.document.getElementById("panel");
  const ok = B.fundingPanel(panel, KEY);
  const pt = panel.textContent.replace(/\s+/g, " ");
  check("(d) fundingPanel renders the same block for one institution",
    ok && /2026–2028 College Implementation Funding/.test(pt) && pt.indexOf(money(T._alloc(KEY).total)) >= 0 && /Access step 0\.5/.test(pt));
  check("(d) it points at the table beside it, not at the tab", /Choose All institutions/.test(pt) && !/Implementation Funding tab's model/.test(pt));
  check("(d) My College keeps its own footer", /Implementation Funding tab's model/.test(root.textContent));
  check("(d) one renderer: My College and the panel both call fundingBlockHtml",
    (src.match(/fundingBlockHtml\(\{/g) || []).length === 2);

  let pass = 0;
  for (const [n, ok2] of results) { console.log((ok2 ? "PASS" : "FAIL") + "  " + n); if (ok2) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 50);
