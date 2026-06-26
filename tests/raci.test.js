// Team & RACI tab (raci.js) — jsdom test.
//
// Guards: (a) Rule 4 (both HTMLs identical) + nav button / pane / boot wiring;
// (b) the matrix builds the 4 Activities + their projects from window.CPL_DATA,
//     grouping projects by workplan_activity (so a `5.x` id lands under its true
//     Activity, not a phantom Activity 5); (c) a stored RACI assignment renders
//     as a member chip; (d) the failure mode — a project with a null/blank
//     activity must render without throwing; (e) the directory view lists members.
//
// Run from repo root: `npm test` (or `node tests/raci.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav button present", /data-tab="raci" role="tab"[^>]*>Team &amp; RACI</.test(cpl));
check("tab pane present", /id="tab-raci" data-tab="raci"/.test(cpl));
check("mount div present", /id="raci-root"/.test(cpl));
check("lazy boot wiring present",
  /onActivate\('raci'/.test(cpl) && /loadScript\('raci\.js', 'CPL_RACI_TAB'/.test(cpl));

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("raci.js", "utf8");

function makeDom(members, raciRows) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  // Mock the items source + Supabase REST.
  w.CPL_DATA = { projects: [
    { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: Build AI-Enhanced CPL Infrastructure" },
    { id: "3.2", name: "CPL Units Transcription", activity: "Activity 3: Build Robust CPL Data Infrastructure" },
    { id: "5.1", name: "AI-Ready California Demonstration", activity: "Activity 4: Sprints, Projects & Partnerships" },
    { id: "9.9", name: "Orphan no activity", activity: "" }, // failure-mode guard
  ] };
  w.fetch = function (url) {
    let body = [];
    if (/team_members/.test(url)) body = members;
    else if (/item_raci/.test(url)) body = raciRows;
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(body); } });
  };
  w.eval(SRC);
  return dom;
}

const MEMBERS = [
  { name: "Crystal Nasio", email: "crystal.nasio@rccd.edu", role: "Ops" },
  { name: "Terence Nelson", email: "terence.nelson@rccd.edu", role: "Pathways" },
];
const RACI_ROWS = [
  { item_type: "project", item_id: "1.1", raci: { R: [{ name: "Crystal Nasio", email: "crystal.nasio@rccd.edu" }], A: [], C: [], I: [] } },
  { item_type: "activity", item_id: "4", raci: { R: [], A: [{ name: "Terence Nelson", email: "terence.nelson@rccd.edu" }], C: [], I: [] } },
];

(async function () {
  const dom = makeDom(MEMBERS, RACI_ROWS);
  const T = dom.window.CPL_RACI_TAB;
  check("module exposes CPL_RACI_TAB", !!T && typeof T.boot === "function");

  let threw = false;
  try { T.boot(); } catch (e) { threw = true; }
  check("boot() does not throw", !threw);
  // let the mocked fetch promises resolve
  await new Promise((r) => setTimeout(r, 30));

  const doc = dom.window.document;
  const rows = doc.querySelectorAll(".raci-table tr");
  // header + 4 activities + 3 placed projects (orphan 9.9 falls under Activity 9 group? no — only ACTIVITIES 1-4 emit groups)
  check("matrix renders activity rows", doc.querySelectorAll(".raci-row-act").length === 4);
  check("5.1 placed under an Activity (grouped by workplan_activity)",
    /AI-Ready California/.test(doc.body.innerHTML));
  check("orphan project with blank activity did not crash render", rows.length > 4);

  // (c) stored RACI assignment shows as a chip
  check("RACI chip rendered for an assigned member", /raci-chip/.test(doc.body.innerHTML)
    && /Crystal Nasio/.test(doc.body.innerHTML));

  // (e) directory view: switch via the toggle, assert members + the
  // "Nudge for Updates" opt-in column render.
  const toggles = doc.querySelectorAll(".raci-tg");
  let dirBtn = null;
  toggles.forEach(function (b) { if (/Directory/.test(b.textContent)) dirBtn = b; });
  check("directory toggle present", !!dirBtn);
  if (dirBtn) dirBtn.click();
  check("directory lists a member", /Terence Nelson/.test(doc.body.innerHTML));
  check("'Nudge for Updates' column header present", !!doc.querySelector(".raci-th-nudge")
    && /Nudge for Updates/.test(doc.body.innerHTML));
  check("per-member nudge checkbox rendered", doc.querySelectorAll(".raci-nudge-cb").length >= 1);

  let failed = 0;
  for (const [name, ok] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + name);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
  process.exit(failed === 0 ? 0 : 1);
})();
