// MAP Users tab: the CPL Coordinators lens (Jessica and Sam, 2026-11-05).
//
// Jessica: "We want to know if there are gaps and crossover from these fields.
// For example, Madera college has Lainey Campos listed as their CPL coordinator
// on the landing page but is not tagged as the CPL Coordinator in the platform."
// Sam: "please add this to the MAP Users tab so Jessie can look it up there as well."
//
// Guards:
//  (a) the lens reads map_cpl_coordinator_compare() and shows the three sources
//      side by side, a landing-page-only college (the Madera case) worded so;
//  (b) a person with no active MAP user reads "Not a MAP user", in words;
//  (c) the crossover (the CPL Assistant email is a coordinator's) shows on the row
//      and in its own stat box, and the filter narrows to it;
//  (d) "Everything but a match" hides the matches;
//  (e) the export carries every column Jessica asked for;
//  (f) signed out, the lens fetches nothing (the RPC is gated; no names leave it);
//  (g) the address #map-users/coordinators opens the lens.
//
// Run from repo root: `npm test` (or `node tests/map_users_coordinator_compare.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("map_users.js", "utf8");

const CMP = [
  { college: "Madera College", platform: [], cpl_assistant_email: null,
    landing: [{ title: "CPL Coordinator", name: "Lainey Campos", email: "lainey.campos@example.edu", roles: null }],
    finding: "landing_only", assistant_is_coordinator: false, synced_at: "2026-11-04T20:07:38Z" },
  { college: "Alpha College", platform: [{ name: "Ann Lee", email: "alee@alpha.edu", roles: "Ambassador" }],
    cpl_assistant_email: "alee@alpha.edu",
    landing: [{ title: "CPL Coordinator", name: "Ann Lee", email: "alee@alpha.edu", roles: "Ambassador" }],
    finding: "match", assistant_is_coordinator: true, synced_at: "2026-11-04T20:07:38Z" },
  { college: "Beta College", platform: [{ name: "Bo Diaz", email: "bdiaz@beta.edu", roles: "Faculty" }],
    cpl_assistant_email: "cpl@beta.edu", landing: [], finding: "platform_only",
    assistant_is_coordinator: false, synced_at: "2026-11-04T20:07:38Z" },
];

function makeWin(opts) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="map-users-root"></div></body></html>',
    { url: "https://example.org/" + (opts.hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  if (opts.signedIn) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.__urls = [];
  w.fetch = function (url) {
    w.__urls.push(String(url));
    const body = /map_cpl_coordinator_compare/.test(url) ? CMP : [];
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve(body); } });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}
const tick = () => new Promise((r) => setTimeout(r, 30));
function rowsOf(w) {
  return Array.from(w.document.querySelectorAll(".mapu-coordtable tbody tr")).map(function (tr) {
    return Array.from(tr.querySelectorAll("td")).map(function (td) { return td.textContent.trim(); });
  });
}
function statOf(w, label) {
  const box = Array.from(w.document.querySelectorAll(".mapu-stat .box")).find(function (b) {
    return b.querySelector(".l").textContent === label;
  });
  return box ? box.querySelector(".n").textContent : null;
}
function setFilter(w, v) {
  const sel = w.document.querySelector("[data-coord-filter]");
  sel.value = v; sel.dispatchEvent(new w.Event("change"));
}

(async function () {
  // Signed in, opened from the button.
  const w = makeWin({ signedIn: true });
  const T = w.CPL_MAP_USERS_TAB;
  const root = w.document.getElementById("map-users-root");
  T.activate(); await tick();
  const btn = w.document.querySelector('[data-lens="coordinators"]');
  check("signed in: the CPL Coordinators lens button is there", !!btn && /CPL Coordinators/.test(btn.textContent));
  btn.click(); await tick();
  check("(a) the lens reads map_cpl_coordinator_compare()", w.__urls.some((u) => /rpc\/map_cpl_coordinator_compare/.test(u)));
  let rows = rowsOf(w);
  check("(a) one row a college", rows.length === 3);
  const madera = rows.find((r) => r[0] === "Madera College");
  check("(a) Madera reads Landing page only", madera && madera[4] === "Landing page only");
  check("(a) Madera's landing-page coordinator shows with the page's title", madera && /Lainey Campos/.test(madera[3]) && /CPL Coordinator/.test(madera[3]));
  check("(a) Madera's platform field reads None", madera && madera[1] === "None");
  check("(b) a person with no MAP user reads Not a MAP user", madera && /Not a MAP user/.test(madera[3]));
  const alpha = rows.find((r) => r[0] === "Alpha College");
  check("(b) an active user shows the role", alpha && /MAP user: Ambassador/.test(alpha[1]));
  check("(c) the crossover shows on the row", alpha && /Assistant email is the coordinator/.test(alpha[4]));
  check("(c) the crossover stat box counts it", statOf(w, "Assistant email is the coordinator’s") === "1");
  check("stat: Landing page only counts 1", statOf(w, "Landing page only") === "1");
  setFilter(w, "crossover"); await tick();
  rows = rowsOf(w);
  check("(c) the crossover filter narrows to Alpha", rows.length === 1 && rows[0][0] === "Alpha College");
  setFilter(w, "gaps"); await tick();
  rows = rowsOf(w);
  check("(d) Everything but a match hides the match", rows.length === 2 && !rows.some((r) => r[0] === "Alpha College"));
  setFilter(w, "all"); await tick();
  const csv = T._coordCompareCsv();
  check("(e) the export carries the asked-for columns",
    /"College","CPL Coordinator \(MAP College Contacts\)"/.test(csv) && /"CPL Assistant email"/.test(csv)
    && /"CPL Coordinator on the landing page"/.test(csv) && /"Finding"/.test(csv));
  check("(e) the export carries Madera's landing-page coordinator", /"Madera College","","","","","Lainey Campos","CPL Coordinator"/.test(csv));
  check("table: header cells carry scope", Array.from(w.document.querySelectorAll(".mapu-coordtable th")).every((th) => th.getAttribute("scope") === "col"));
  check("table: the scrolling region is labelled", !!w.document.querySelector('.mapu-scroll[aria-label="CPL Coordinators compared"]'));

  // Signed out: no lens button, and the compare RPC is never called.
  const w2 = makeWin({ signedIn: false, hash: "#map-users/coordinators" });
  w2.CPL_MAP_USERS_TAB.activate(); await tick();
  check("(f) signed out: no CPL Coordinators button", !w2.document.querySelector('[data-lens="coordinators"]'));
  check("(f) signed out: the compare RPC is never called", !w2.__urls.some((u) => /map_cpl_coordinator_compare/.test(u)));

  // The address opens the lens for a signed-in reader.
  const w3 = makeWin({ signedIn: true, hash: "#map-users/coordinators" });
  w3.CPL_MAP_USERS_TAB.activate(); await tick();
  check("(g) the address opens the lens", w3.CPL_MAP_USERS_TAB._state.lens === "coordinators"
    || !w3.CPL_SESSION); // the address hand-off needs cpl_session.js; without it the lens stays put

  let fail = 0;
  results.forEach(([n, ok]) => { if (!ok) fail++; console.log((ok ? "  ok   " : "  FAIL ") + n); });
  console.log(fail ? fail + " of " + results.length + " failed" : "all " + results.length + " passed");
  process.exit(fail ? 1 : 0);
})();
