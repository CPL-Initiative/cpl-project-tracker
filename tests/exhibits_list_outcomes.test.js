// The Exhibits List's Outcomes match hints (Sam, 2026-11-01: "yes to SLO hints and the nightly harvest"). The builder
// kb/_build_exhibit_slo_neighbors.py writes kb/exhibit_slo_neighbors.json; this guards the List side:
//   (1) a credential whose courses' SLOs match one in another group shows "Outcomes match: <title> (<group>)" under its
//       title; a title alone in the AI sort reads "not in a group"; a neighbor no longer in the reference is left out;
//   (2) a neighbor already in the row's group is no hint (nothing to move);
//   (3) a pair that shares an articulated course ("s") never shows as a hint;
//   (4) the Outcomes match filter lists exactly the titles carrying a hint, with a line saying what the hint means;
//   (5) the Title drawer lists every match with its similarity, and the shared-course pairs apart from them;
//   (6) the file is read once a visit, however often the List redraws;
//   (7) a group a reviewer keeps (the store) and a Move made under the AI sort both count: two titles that now share a
//       group lose the hint, and a group a move leaves with one title is named as none, as the List draws it;
//   (8) a missing file shows no hint and the filter says the matches could not be read.
// Run from repo root: `npm test` (or `node tests/exhibits_list_outcomes.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

function cred(ut) { return { ut: ut, issuer: "", cpl_types: [], disc_modal: "", raw_count: 1, articulations: [] }; }
const TITLES = ["Elementary Italian 1", "Elementary Spanish I", "Spanish Wines", "California Wines", "French Wines", "Welding 1", "Zoology Field Survey"];
const CREDREF = { _generated_at: "2026-11-01T05:19:00+00:00", unified_titles: TITLES.map(cred) };
const AISORT = { schema: 1, _reference_generated_at: "2026-11-01T05:19:00+00:00",
  groups: [{ name: "Elementary Italian", n: 1 }, { name: "Spanish", n: 2 }, { name: "Wines", n: 2 }, { name: "Welding", n: 1 }, { name: "Zoology Field Survey", n: 1 }],
  order: { "Elementary Italian 1": [0, 0], "Elementary Spanish I": [1, 1], "Spanish Wines": [1, 2], "California Wines": [2, 3],
    "French Wines": [2, 4], "Welding 1": [3, 5], "Zoology Field Survey": [4, 6] }, counts: {}, suggest: {} };
const NEIGHBORS = { schema: 1, _params: { threshold: 0.5 }, counts: { colleges: 9, credentials_reached: 746 }, neighbors: {
  "Elementary Italian 1": { g: null, n: [["Elementary Spanish I", 0.951, "Spanish"], ["Elementary Latin 1", 0.7, null]] },
  "Elementary Spanish I": { g: "Spanish", n: [["Elementary Italian 1", 0.951, null]] },
  "California Wines": { g: "Wines", n: [["French Wines", 0.882, "Wines"], ["Spanish Wines", 0.899, "Spanish"]] },
  "French Wines": { g: "Wines", n: [["California Wines", 0.882, "Wines"]] },
  "Spanish Wines": { g: "Spanish", n: [["California Wines", 0.899, "Wines"]] },
  "Welding 1": { g: null, s: [["Zoology Field Survey", 0.81, null, "course"]] },
  "Zoology Field Survey": { g: null, s: [["Welding 1", 0.81, null, "course"]] } } };
let OVERLAY_ROWS = [];
let HAS_FILE = true;

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-01T05:22:00Z", sources: {}, tiles: {}, steps: {}, colleges: [], held: [] });
    if (url === "kb/exhibits_ai_sort.json") return ok(AISORT);
    if (url === "kb/exhibit_slo_neighbors.json" && HAS_FILE) return ok(NEIGHBORS);
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok(/exhibit_group/.test(url) ? OVERLAY_ROWS : []);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "fact-sheet/statewide_recs.js") w[name] = {};
    setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function row(d, title) {
  const b = d.querySelector('input[aria-label="Select ' + title + '"]');
  return b && b.closest("tr");
}
function hint(d, title) { const r = row(d, title); return txt(r && r.querySelector(".exh-l-om")); }
function shown(d) {
  return TITLES.filter((t) => !!row(d, t));
}
function btn(root, t) { return Array.from(root.querySelectorAll("button")).find((b) => txt(b) === t); }
function nFetch(t) { return t.calls.filter((c) => c.url === "kb/exhibit_slo_neighbors.json").length; }

(async function () {
  let t = load();
  await t.M.boot(); await settle();
  check("(1) ⭐ the match and its group show under the title; a neighbor gone from the reference is left out",
    hint(t.d, "Elementary Italian 1") === "Outcomes match: Elementary Spanish I (Spanish)", hint(t.d, "Elementary Italian 1"));
  check("(1) a neighbor the AI sort leaves alone reads as not in a group",
    hint(t.d, "Elementary Spanish I") === "Outcomes match: Elementary Italian 1 (not in a group)", hint(t.d, "Elementary Spanish I"));
  check("(2) a neighbor already in the row's group is no hint",
    hint(t.d, "California Wines") === "Outcomes match: Spanish Wines (Spanish)" && hint(t.d, "French Wines") === "", hint(t.d, "California Wines"));
  check("(3) ⭐ a pair that shares an articulated course never shows as a hint",
    hint(t.d, "Welding 1") === "" && hint(t.d, "Zoology Field Survey") === "" && !!row(t.d, "Welding 1"));

  btn(t.d.querySelector(".exh-l-filters"), "Outcomes match").click(); await settle();
  check("(4) ⭐ the Outcomes match filter lists exactly the titles carrying a hint",
    shown(t.d).join("|") === "Elementary Italian 1|Elementary Spanish I|Spanish Wines|California Wines", shown(t.d).join("|"));
  const line = t.d.getElementById("exh-l-sloline");
  check("(4) a line says what the hint means and how far the SLOs reach",
    /similarity of 0\.5 or more through distinct courses/.test(txt(line)) && /9 colleges so far, reaching 746 credentials/.test(txt(line))
    && /never a decision/.test(txt(line)), txt(line));

  const open = Array.from(t.d.querySelectorAll(".exh-l-open")).find((b) => b.getAttribute("aria-label") === "Title: California Wines, details");
  open.click(); await settle();
  const dr = txt(t.d.querySelector(".exh-l-drawer"));
  check("(5) the Title drawer lists each match with its similarity", /Spanish Wines \(Spanish\), similarity 0\.90/.test(dr) && !/French Wines/.test(dr), dr);
  btn(t.d.querySelector(".exh-l-filters"), "All").click(); await settle();
  const open2 = Array.from(t.d.querySelectorAll(".exh-l-open")).find((b) => b.getAttribute("aria-label") === "Title: Welding 1, details");
  open2.click(); await settle();
  const dr2 = txt(t.d.querySelector(".exh-l-drawer"));
  check("(5) the shared-course pairs sit apart, named as articulation evidence",
    /Alike through a shared course or identical SLO text/.test(dr2) && /Zoology Field Survey, similarity 0\.81, a shared course/.test(dr2) && !/Outcomes match/.test(dr2), dr2);
  check("(6) the file is read once a visit", nFetch(t) === 1, String(nFetch(t)));

  // (7) a Move under the AI sort: Elementary Italian 1 joins Spanish, so the two no longer carry a hint.
  t.d.getElementById("exh-l-ai").click(); await settle();
  const box = t.d.querySelector('input[aria-label="Select Elementary Italian 1"]');
  box.checked = true; box.dispatchEvent(new t.w.Event("change")); await settle();
  const to = t.d.getElementById("exh-l-moveto");
  to.value = "Spanish"; to.dispatchEvent(new t.w.Event("input"));
  btn(t.d.querySelector(".exh-l-move"), "Move").click(); await settle();
  check("(7) ⭐ a Move under the AI sort ends the hint between titles that now share a group",
    hint(t.d, "Elementary Italian 1") === "" && hint(t.d, "Elementary Spanish I") === "" && hint(t.d, "California Wines") === "Outcomes match: Spanish Wines (Spanish)",
    hint(t.d, "Elementary Italian 1") + " / " + hint(t.d, "Elementary Spanish I"));

  OVERLAY_ROWS = [{ course_id: "_CREDENTIAL_REVIEW::California Wines", field: "exhibit_group", value: "Spanish" }];
  t = load();
  await t.M.boot(); await settle();
  check("(7) a group kept in the store counts with the AI sort off: Spanish Wines loses its hint, and the group the move left with one title is none",
    hint(t.d, "Spanish Wines") === "" && hint(t.d, "French Wines") === "Outcomes match: California Wines (Spanish)"
    && hint(t.d, "California Wines") === "Outcomes match: French Wines (not in a group)",
    hint(t.d, "California Wines") + " / " + hint(t.d, "French Wines") + " / " + hint(t.d, "Spanish Wines"));
  OVERLAY_ROWS = [];

  HAS_FILE = false;
  t = load();
  await t.M.boot(); await settle();
  btn(t.d.querySelector(".exh-l-filters"), "Outcomes match").click(); await settle();
  check("(8) a missing file shows no hint, and the filter says the matches could not be read",
    !t.d.querySelector(".exh-l-om") && shown(t.d).length === 0 && /could not be read/.test(txt(t.d.getElementById("exh-l-sloline"))),
    txt(t.d.getElementById("exh-l-sloline")));
  HAS_FILE = true;

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
