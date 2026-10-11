// sierra_feedback readers: the CI rows are excluded on the server (S366).
//
// Three views read sierra_feedback and dropped the CI smoke rows in the browser,
// each under a row cap: Sierra Training newest-first at 500, the MAP Team Queue
// oldest-first at 1,000, Governance unordered at 1,000. On 2026-10-11 the table held
// 452 rows and gained about 46 CI rows a week, so within a week Sierra Training's
// oldest real reports would have fallen out of its triage queue while Governance and
// the Queue still counted them; by January the Queue would have lost its newest.
// Found by the Governance UI pass's wiring check. Each view now asks the server for
// real rows only, with or=(page.is.null,page.neq.smoke) (a bare page=neq.smoke drops
// NULL-page rows too), and Sierra Training reads the CI rows apart for its opt-in
// view, with an exact count for its label.
//
// Run from repo root: `npm test` (or `node tests/sierra_feedback_server_filter.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why || ""]); }

const REAL_FILTER = "or=(page.is.null,page.neq.smoke)";
const FILES = { "governance.js": null, "map_team_queue.js": null, "sierra_training.js": null };
Object.keys(FILES).forEach(function (f) {
  const src = fs.readFileSync(f, "utf8");
  FILES[f] = src;
  // Every sierra_feedback read that is not Sierra Training's own CI read carries the filter.
  const reads = src.split("\n").filter((l) => /sierra_feedback\?/.test(l) && !/^\s*\/\//.test(l));
  const block = src.replace(/\n\s*\+\s*"/g, ' + "');   // join a URL continued on the next line
  const ok = reads.length > 0 && reads.every(function (l) {
    const i = block.indexOf(l.trim().slice(0, 40));
    const stmt = i < 0 ? l : block.slice(i, block.indexOf(";", i) + 1);
    return stmt.indexOf(REAL_FILTER) !== -1 || /page=eq\.smoke/.test(stmt);
  });
  check(f + ": each sierra_feedback read excludes CI rows on the server", ok, reads.join(" | ").slice(0, 200));
});
check("sierra_training.js: the CI rows have a read of their own, with an exact count",
  /page=eq\.smoke/.test(FILES["sierra_training.js"]) && /count=exact/.test(FILES["sierra_training.js"]));

// Behavior: Sierra Training merges the two reads and labels the true CI total.
const REAL = [
  { turn_id: "r1", created_at: "2026-10-09T00:00:00Z", page: "cobi-tab", status: "new", rating: "down" },
  { turn_id: "r2", created_at: "2026-08-20T00:00:00Z", page: "sierra", status: "new", rating: "up" },
];
const CI = [
  { turn_id: "c1", created_at: "2026-10-10T00:00:00Z", page: "smoke", status: "ci", rating: "up" },
  { turn_id: "c2", created_at: "2026-10-08T00:00:00Z", page: "smoke", status: "ci", rating: "up" },
];

function run(answer) {
  const dom = new JSDOM('<!doctype html><html><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "p");
  w.fetch = function (url) {
    const u = decodeURIComponent(String(url));
    let body = [], headers = { "Content-Type": "application/json" };
    if (/sierra_feedback\?/.test(u)) {
      const a = answer(u);
      body = a.body; if (a.range) headers["Content-Range"] = a.range;
    }
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers }));
  };
  const el = w.document.createElement("script");
  el.textContent = FILES["sierra_training.js"];
  w.document.body.appendChild(el);
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api.activate();
  return new Promise((res) => setTimeout(res, 80)).then(() => ({ w, api }));
}

run(function (u) {
  if (u.indexOf(REAL_FILTER) !== -1) return { body: REAL };
  if (/page=eq\.smoke/.test(u)) return { body: CI, range: "0-1/365" };
  return { body: [] };
}).then(function ({ w, api }) {
  const fb = api._state.feedback || [];
  check("merge: real and CI rows are both on hand (4)", fb.length === 4, String(fb.length));
  check("merge: newest first across the two reads",
    fb.map((f) => f.turn_id).join(",") === "c1,r1,c2,r2", fb.map((f) => f.turn_id).join(","));
  check("label: names the exact CI total past the read's cap (365, not 2)",
    /include 365 automated test messages/.test(w.document.getElementById("sierra-training-root").textContent));
  // A stub answering both reads alike must not double the rows.
  return run(function () { return { body: REAL.concat(CI) }; });
}).then(function ({ api }) {
  const fb = api._state.feedback || [];
  check("merge: a row returned by both reads is kept once", fb.length === 4, String(fb.length));
}).catch(function (e) {
  check("behavior path completed", false, String(e && e.stack || e));
}).then(function () {
  let failed = 0;
  results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
});
