// Team & RACI tab — per-item nudge honors the Directory opt-out (raci.js).
//
// Guard: a member a reviewer has unchecked in the Team Directory ("Nudge for
// Updates" → nudge:false) is NOT a per-item nudge recipient, even when they are
// the item's Responsible/Accountable.
//
// Since StarFarout (Session 81) the per-row 📣 button shows on EVERY row when
// signed in (so a reviewer can nudge just one item), so the opt-out is enforced
// in the RECIPIENT/href layer, not button visibility: a row whose only R/A
// people are all opted out yields a NULL nudge href (no one to email), and one
// with ≥1 opted-in person yields a mailto targeting that person.
//
// Run from repo root: `npm test` (or `node tests/raci_nudge_optout.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("raci.js", "utf8");

function makeDom(members, raciRows, session) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (session) w.sessionStorage.setItem("cpl_sb", JSON.stringify(session));
  w.CPL_DATA = {
    activity_kpis: [
      { activity_id: "Activity 1", activity_name: "Build", kpis: [{ id: "1.1", name: "Opted-out lead" }] },
      { activity_id: "Activity 2", activity_name: "Convene", kpis: [{ id: "2.1", name: "Opted-in lead" }] },
    ],
    projects: [
      { id: "1.1", name: "Opted-out lead", activity: "Activity 1: Build" },
      { id: "2.1", name: "Opted-in lead", activity: "Activity 2: Convene" },
    ],
  };
  w.fetch = function (url, init) {
    const method = (init && init.method) || "GET";
    if (/\/auth\/v1\/token/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () {
        return Promise.resolve({ access_token: "n.a.b", refresh_token: "r2", expires_in: 3600 }); } });
    }
    if (method !== "GET") return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
    let body = [];
    if (/team_members/.test(url)) body = JSON.parse(JSON.stringify(members || []));
    else if (/item_raci/.test(url)) body = JSON.parse(JSON.stringify(raciRows || []));
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(body); } });
  };
  w.eval(SRC);
  return dom;
}

const MEMBERS = [
  { id: "m1", name: "Olive Opt", email: "olive@x.edu", role: "Lead", nudge: false }, // opted OUT
  { id: "m2", name: "Ivy In", email: "ivy@x.edu", role: "Lead", nudge: true },        // opted in
];
const RACI_ROWS = [
  // 1.1's only R/A person is opted out → no recipients → null href.
  { item_type: "project", item_id: "1.1", raci: { R: [{ name: "Olive Opt", email: "olive@x.edu" }], A: [], C: [], I: [] } },
  // 2.1's R is opted in → href targets Ivy.
  { item_type: "project", item_id: "2.1", raci: { R: [{ name: "Ivy In", email: "ivy@x.edu" }], A: [], C: [], I: [] } },
];

(async function () {
  const SESSION = { access_token: "a.b.c", refresh_token: "r1", email: "map@rccd.edu", exp: Math.floor(Date.now() / 1000) + 3600 };
  const dom = makeDom(MEMBERS, RACI_ROWS, SESSION);
  const T = dom.window.CPL_RACI_TAB;
  T.boot();
  await new Promise((r) => setTimeout(r, 40));
  const doc = dom.window.document;

  function nudgeBtnFor(key) {
    const tr = doc.querySelector('[data-raci-key="' + key + '"]');
    return tr ? tr.querySelector(".raci-itemnudge-btn") : null;
  }
  function hrefFor(key) { return T._itemNudgeHref(T._itemByKey(key)); }

  // Button visibility: now on EVERY row when signed in (both opted-in + opted-out).
  check("signed-in reviewer sees per-item 📣 on the opted-IN row (2.1)", !!nudgeBtnFor("project:2.1"));
  check("signed-in reviewer ALSO sees per-item 📣 on the opted-OUT row (1.1)", !!nudgeBtnFor("project:1.1"));

  // Opt-out enforced in the recipient/href layer, not button visibility.
  check("opted-OUT-only row yields a NULL nudge href (no one to email)", hrefFor("project:1.1") === null);
  const inHref = hrefFor("project:2.1");
  check("opted-IN row yields a mailto targeting the opted-in member",
    /^mailto:/.test(inHref || "") && /ivy@x\.edu/.test(decodeURIComponent(inHref || "")));

  // Re-checking the opted-out member restores them as a recipient (href non-null).
  const MEMBERS2 = [{ id: "m1", name: "Olive Opt", email: "olive@x.edu", role: "Lead", nudge: true }, MEMBERS[1]];
  const dom2 = makeDom(MEMBERS2, RACI_ROWS, SESSION);
  const T2 = dom2.window.CPL_RACI_TAB;
  T2.boot();
  await new Promise((r) => setTimeout(r, 40));
  const reHref = T2._itemNudgeHref(T2._itemByKey("project:1.1"));
  check("re-checking the member restores it as a per-item nudge recipient (1.1)",
    /^mailto:/.test(reHref || "") && /olive@x\.edu/.test(decodeURIComponent(reHref || "")));

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
