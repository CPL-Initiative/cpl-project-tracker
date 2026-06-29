// RACI matrix excludes tabled/archived projects (project_lifecycle overlay) —
// jsdom test. Guards Sam's Session-84 ask: a soft-deleted project leaves the
// RACI matrix (live, via state.tabled), not just the grid/goals/activity cards.
//
// Run from repo root: `npm test` (or `node tests/raci_tabled.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("raci.js", "utf8");

function makeDom() {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  // 5.1 nests under an emitted Activity (raci.js ACTIVITIES is 1–4) so it is
  // genuinely emitted, then filtered. The filter drops it from `projs`
  // regardless of which activity it sits under.
  w.CPL_DATA = {
    activity_kpis: [
      { activity_id: "Activity 4", activity_name: "Sprints", kpis: [{ id: "5.1", name: "AI-Ready California Demonstration" }] },
      { activity_id: "Activity 1", activity_name: "Infra", kpis: [{ id: "1.1", name: "MAP Platform Development" }] },
    ],
    projects: [
      { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: Infra" },
      { id: "5.1", name: "AI-Ready California Demonstration", activity: "Activity 4: Sprints" },
    ],
  };
  // Minimal Supabase mock: project_lifecycle returns tabled 5.1; everything else empty.
  w.fetch = function (url, init) {
    const method = (init && init.method) || "GET";
    if (method !== "GET") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    let body = [];
    if (/project_lifecycle/.test(url)) body = [{ project_id: "5.1", state: "tabled" }];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  };
  w.eval(SRC);
  return dom;
}

(async function () {
  const T = makeDom().window.CPL_RACI_TAB;
  check("module exposes test hooks", T && typeof T._buildItems === "function" && typeof T._setTabled === "function");

  function ids(items) { return items.map(function (i) { return i.key; }); }

  // No tabled set → 5.1 IS in the matrix.
  T._setTabled({});
  const before = ids(T._buildItems());
  check("with no overlay, 5.1 is in the matrix", before.indexOf("project:5.1") !== -1);
  check("1.1 is in the matrix", before.indexOf("project:1.1") !== -1);

  // Tabled 5.1 → excluded; 1.1 untouched.
  T._setTabled({ "5.1": true });
  const after = ids(T._buildItems());
  check("tabled 5.1 is EXCLUDED from the matrix", after.indexOf("project:5.1") === -1);
  check("non-tabled 1.1 remains", after.indexOf("project:1.1") !== -1);
  check("Activity 4 header still present (only the project drops)", after.indexOf("activity:4") !== -1);

  // Archived state is filtered the same way.
  T._setTabled({ "5.1": true });
  check("archived/tabled set drops the project row", ids(T._buildItems()).indexOf("project:5.1") === -1);

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
