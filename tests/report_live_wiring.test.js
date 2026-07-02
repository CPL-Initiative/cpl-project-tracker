// Custom Report live wiring (report_generator.js) + the 2026-07-02 COBI tweaks
// — jsdom test.
//
// Guards:
//  (a) report_generator.js overlays LIVE card data before prompting: newest
//      item_updates body/date per project, RACI lead (Responsible →
//      Accountable), and the activity-level updates block in the prompt;
//  (b) an empty overlay keeps the baked CPL_DATA fields (no data loss when
//      Supabase is unreachable) + falls back to the build-time
//      CPL_DATA.live_updates map;
//  (c) nudge mailto drafts are SEMICOLON-delimited (Outlook rejects commas) —
//      functional for map_users.js, source-pinned for raci.js's two builders;
//  (d) the RACI 📝 update composer acknowledges then CLOSES after Save
//      (source-pinned — the modal used to stay open).
//
// Run from repo root: `npm test` (or `node tests/report_live_wiring.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — source-pinned invariants ──
const raciSrc = fs.readFileSync("raci.js", "utf8");
check("raci.js: team nudge joins recipients with ';'",
  /nudgeRecipients\(\);[\s\S]{0,400}?\.join\(";"\)/.test(raciSrc));
check("raci.js: per-item nudge joins recipients with ';'",
  /itemNudgeRecipients\(item\);[\s\S]{0,400}?\.join\(";"\)/.test(raciSrc));
check("raci.js: no comma-joined mailto recipient list remains",
  !/return m\.email; \}\)\.join\(","\)/.test(raciSrc));
check("raci.js: update composer Save acknowledges then closes the popup",
  /✓ Saved\.[\s\S]{0,900}?setTimeout\(closeModal, 900\)/.test(raciSrc));

// ── Part B — map_users.js nudge mailto (functional) ──
const muSrc = fs.readFileSync("map_users.js", "utf8");
(function () {
  const dom = new JSDOM('<!doctype html><html><body><div id="map-users-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve([]); } }); };
  const el = w.document.createElement("script");
  el.textContent = muSrc;
  w.document.body.appendChild(el);
  const api = w.CPL_MAP_USERS_TAB;
  const picks = [
    { key: "primary_contact", label: "Primary Contact", name: "Pat", email: "pat@x.edu" },
    { key: "ceo", label: "CEO / President", name: "Casey", email: "ceo@x.edu" },
  ];
  const mailto = decodeURIComponent(api._buildNudgeMailto("Foothill College", picks));
  check("map_users nudge: recipients semicolon-delimited", mailto.indexOf("pat@x.edu;ceo@x.edu") >= 0);
  check("map_users nudge: no comma between recipients", mailto.indexOf("pat@x.edu,ceo@x.edu") === -1);
})();

// ── Part C — report_generator.js live overlay + prompt ──
const rgSrc = fs.readFileSync("report_generator.js", "utf8");

const DATA = {
  last_updated: "July 2, 2026",
  kpis: {},
  live_updates: {},
  projects: [
    { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: AI-Enhanced CPL Infrastructure", status: "On Track", pct: 80, desc: "Platform", lead: "Old Lead", update: "creation-era update", update_date: "2026-04-01" },
    { id: "2.1", name: "Statewide Credit Recommendations", activity: "Activity 2: Faculty Workgroups & Credit Recommendations", status: "Goal Met", pct: 100, desc: "Recs", lead: "", update: "", update_date: "" },
  ],
};
const UPDATE_ROWS = [
  { item_type: "project", item_id: "1.1", body: "Newest live 1.1 update", author: "map@rccd.edu", created_at: "2026-07-01T12:00:00Z" },
  { item_type: "activity", item_id: "1", body: "Activity 1 rolling status", author: "map@rccd.edu", created_at: "2026-06-30T09:00:00Z" },
  { item_type: "project", item_id: "1.1", body: "Older 1.1 update", author: "map@rccd.edu", created_at: "2026-06-20T08:00:00Z" },
];
const RACI_ROWS = [
  { item_type: "project", item_id: "1.1", raci: { R: [{ name: "Malone Dunlavy", email: "m@x.edu" }] } },
  { item_type: "project", item_id: "2.1", raci: { A: [{ name: "Acc Only", email: "a@x.edu" }] } },
];

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_DATA = JSON.parse(JSON.stringify(DATA));
  w.fetch = function (url) {
    if (/item_updates/.test(url)) {
      return Promise.resolve({ ok: !!opts.updatesOk, json: function () { return Promise.resolve(opts.updates || []); } });
    }
    if (/item_raci/.test(url)) {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(opts.raci || []); } });
    }
    return Promise.resolve({ ok: false, json: function () { return Promise.resolve([]); } });
  };
  const el = w.document.createElement("script");
  el.textContent = rgSrc;
  w.document.body.appendChild(el);
  return w;
}

(async function () {
  const w = makeWin({ updatesOk: true, updates: UPDATE_ROWS, raci: RACI_ROWS });
  const API = w.CPL_CUSTOM_REPORT;
  check("module exposes CPL_CUSTOM_REPORT helpers", !!API && typeof API.applyLiveOverlay === "function");

  // (a) live overlay
  const live = await API.fetchLiveOverlay();
  check("fetchLiveOverlay keeps the newest update per key", live.updates["project:1.1"].body === "Newest live 1.1 update");
  const overlaid = API.applyLiveOverlay(w.CPL_DATA.projects, live);
  check("applyLiveOverlay: live body overrides the creation-era update", overlaid[0].update === "Newest live 1.1 update");
  check("applyLiveOverlay: live date is the created_at date part", overlaid[0].update_date === "2026-07-01");
  check("applyLiveOverlay: RACI Responsible becomes the lead", overlaid[0].lead === "Malone Dunlavy");
  check("applyLiveOverlay: Accountable is the fallback lead", overlaid[1].lead === "Acc Only");
  check("applyLiveOverlay: originals untouched (copies returned)", w.CPL_DATA.projects[0].update === "creation-era update");

  const actUpdates = API.activityUpdatesFor(overlaid, live.updates);
  check("activityUpdatesFor picks up Activity 1's update once", actUpdates.length === 1 && actUpdates[0].body === "Activity 1 rolling status");

  const prompt = API.buildPrompt({
    projects: overlaid,
    activityUpdates: actUpdates,
    audience: { label: "Test", prompt: "Test audience." },
    kpis: {},
    lastUpdated: "July 2, 2026",
  });
  check("prompt carries the LIVE project update (+ date)", prompt.indexOf("Newest live 1.1 update (2026-07-01)") >= 0);
  check("prompt carries the activity-level updates block", prompt.indexOf("Latest Activity-Level Updates") >= 0 && prompt.indexOf("Activity 1 rolling status") >= 0);
  check("prompt carries the live lead", prompt.indexOf("Lead: Malone Dunlavy") >= 0);

  // (b) unreachable overlay — baked fields survive; build-time map is the fallback
  const w2 = makeWin({ updatesOk: false, raci: [] });
  w2.CPL_DATA.live_updates = { "project:1.1": { body: "build-time folded", date: "2026-07-01" } };
  const live2 = await w2.CPL_CUSTOM_REPORT.fetchLiveOverlay();
  check("fetchLiveOverlay falls back to CPL_DATA.live_updates", live2.updates["project:1.1"].body === "build-time folded");
  const w3 = makeWin({ updatesOk: false, raci: [] });
  const live3 = await w3.CPL_CUSTOM_REPORT.fetchLiveOverlay();
  const kept = w3.CPL_CUSTOM_REPORT.applyLiveOverlay(w3.CPL_DATA.projects, live3);
  check("empty overlay keeps baked update + lead", kept[0].update === "creation-era update" && kept[0].lead === "Old Lead");
  const promptNoAct = w3.CPL_CUSTOM_REPORT.buildPrompt({
    projects: kept, activityUpdates: [], audience: { label: "T", prompt: "T." }, kpis: {}, lastUpdated: "x",
  });
  check("no activity updates → no empty block in the prompt", promptNoAct.indexOf("Latest Activity-Level Updates") === -1);

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
