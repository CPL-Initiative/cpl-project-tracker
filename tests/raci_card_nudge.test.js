// Team & RACI tab — per-card 📣 Nudge deep-link + "Nudge All" rename (raci.js).
//
// StarFarout (Session 81): the Activity / sub-activity / project CARDS each gained
// a 📣 Nudge button that sets sessionStorage cpl_nudge_focus = "<type>:<id>" then
// navigates #raci. raci.js consumePendingFocus() resolves the key, focuses the
// row, and opens that item's per-item nudge. The filter-bar bulk button was
// renamed "📣 Nudge for updates" → "📣 Nudge All".
//
// Run from repo root: `npm test` (or `node tests/raci_card_nudge.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("raci.js", "utf8");

function makeDom(session) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  w.alert = function () {}; // openItemNudge alerts when a row has no recipients — no-op it
  if (session) w.sessionStorage.setItem("cpl_sb", JSON.stringify(session));
  w.CPL_DATA = {
    activity_kpis: [
      { activity_id: "Activity 1", activity_name: "Build", kpis: [{ id: "1.1", name: "Has a lead" }] },
      { activity_id: "Activity 2", activity_name: "Convene", kpis: [{ id: "2.1", name: "No lead yet" }] },
    ],
    projects: [
      { id: "1.1", name: "Has a lead", activity: "Activity 1: Build" },
      { id: "2.1", name: "No lead yet", activity: "Activity 2: Convene" },
    ],
  };
  const MEMBERS = [{ id: "m1", name: "Lead Person", email: "lead@x.edu", role: "Lead", nudge: true }];
  const RACI = [{ item_type: "project", item_id: "1.1", raci: { R: [{ name: "Lead Person", email: "lead@x.edu" }], A: [], C: [], I: [] } }];
  w.fetch = function (url, init) {
    const method = (init && init.method) || "GET";
    if (/\/auth\/v1\/token/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () {
        return Promise.resolve({ access_token: "n.a.b", refresh_token: "r2", expires_in: 3600 }); } });
    }
    if (method !== "GET") return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
    let body = [];
    if (/team_members/.test(url)) body = JSON.parse(JSON.stringify(MEMBERS));
    else if (/item_raci/.test(url)) body = JSON.parse(JSON.stringify(RACI));
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(body); } });
  };
  // Swallow jsdom's "Not implemented: navigation" when openItemNudge sets a mailto.
  try { Object.defineProperty(w, "location", { value: Object.assign({}, w.location, { set href(_v) {}, get href() { return ""; }, assign: function () {} }), writable: true }); } catch (e) {}
  w.eval(SRC);
  return dom;
}

(async function () {
  const SESSION = { access_token: "a.b.c", refresh_token: "r1", email: "map@rccd.edu", exp: Math.floor(Date.now() / 1000) + 3600 };

  // ── (1) The bulk button reads "📣 Nudge All" (signed in) ──
  const dom = makeDom(SESSION);
  const T = dom.window.CPL_RACI_TAB;
  T.boot();
  await new Promise((r) => setTimeout(r, 40));
  const doc = dom.window.document;
  const bulk = doc.querySelector(".raci-filter-nudge");
  check("filter-bar bulk button is labelled '📣 Nudge All'", !!bulk && /Nudge All/.test(bulk.textContent));
  check("old 'Nudge for updates' label is gone", !/Nudge for updates/.test(doc.body.textContent));

  // ── (2) Per-card deep-link consume → focuses the row + opens its nudge ──
  // The card sets cpl_nudge_focus then navigates #raci; consumePendingFocus reads it.
  dom.window.sessionStorage.setItem("cpl_nudge_focus", "project:1.1");
  T._consume();
  check("nudge deep-link key is consumed (removed from sessionStorage)",
    dom.window.sessionStorage.getItem("cpl_nudge_focus") === null);
  const focused = doc.querySelector('[data-raci-key="project:1.1"]');
  check("nudge deep-link focuses the target row", !!focused && /raci-row-focus/.test(focused.className));

  // A nudge deep-link to a row with NO recipients still consumes + focuses
  // (openItemNudge alerts there's no one to nudge — no crash).
  dom.window.sessionStorage.setItem("cpl_nudge_focus", "project:2.1");
  let threw = false;
  try { T._consume(); } catch (e) { threw = true; }
  check("nudge deep-link to an un-RACI'd row does not throw", !threw);
  check("nudge deep-link key consumed even with no recipients",
    dom.window.sessionStorage.getItem("cpl_nudge_focus") === null);

  // ── (3) Anonymous: no bulk button, no per-row 📣, but the consumer still routes ──
  const adom = makeDom(null);
  const aT = adom.window.CPL_RACI_TAB;
  aT.boot();
  await new Promise((r) => setTimeout(r, 40));
  const adoc = adom.window.document;
  check("anon: no '📣 Nudge All' bulk button", !adoc.querySelector(".raci-filter-nudge"));
  check("anon: no per-row 📣 (edit-gated)", !adoc.querySelector(".raci-itemnudge-btn"));
  adom.window.sessionStorage.setItem("cpl_nudge_focus", "project:1.1");
  aT._consume();
  check("anon: nudge deep-link still focuses the row (mailto works without sign-in)",
    !!adoc.querySelector('[data-raci-key="project:1.1"].raci-row-focus') ||
    !!adoc.querySelector('[data-raci-key="project:1.1"]') && /raci-row-focus/.test(adoc.querySelector('[data-raci-key="project:1.1"]').className));

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
