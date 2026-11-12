// Course details beside a Review card (Sam, 2026-11-12: "need to see the course details for abt 133 so i can decide
// what the best title should be. i suspect the ag and business tech title is just their area title and not the course
// title for which they are giving cs credit--add a link to course details that opens in sidebar view").
// Guarded here:
//   (1) the Review card's Source line carries a Course details control, a word in a <button>;
//   (2) pressing it puts the course's own title (from unified_courses_members.js, by college and code from the
//       exhibit's credit recommendation in statewide_data.js) in the side panel, in Related titles' place, distinct
//       from the canonical title, with its units, TOP, M-ID, credit recommendation and catalog description;
//   (3) a course the data does not hold says so, and still names the college, the code and the MAP link;
//   (4) Close and Escape give Related titles back and return focus to the control.
// Run from repo root: `node tests/exhibits_course_details.test.js` (or `npm test`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) {
  if (!el) return "";
  const parts = [], walk = el.ownerDocument.createTreeWalker(el, 4);
  while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
const src = fs.readFileSync("exhibits.js", "utf8");
check("the panel's CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(src.slice(src.indexOf('".exh-cd-head'), src.indexOf('".exh-cd-desc'))));

const CCC = "California Community Colleges";
const REVIEW = { schema: 1, written_at: "2026-11-12T07:50:00Z", sources: { procedures_run: "2026-11-12T07:47:00Z" },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 0, of: 2 }, saved_not_folded: 0 }, steps: {},
  colleges: ["Hartnell College", "Norco College"],
  held: [
    { raw: "Credit by Exam-- CFPL ABT 133", step: "Wording check", why: "the classifier's title has a course code left in", colleges: [0],
      title: "Agricultural Business and Technology (ABT 133)", issuer: CCC, from: "the classifier", ids: ["MAPCXI-CBEC2-1-001"],
      art: [0], could: [], basis: "", same: false, under: [], under_count: 0 },
    { raw: "Welding Exam", step: "Proposed", why: "unsure", colleges: [1], title: "Welding 1", issuer: CCC, from: "the classifier",
      ids: ["MAPCXI-WELD-1-001"], art: [1], could: [], basis: "", same: false, under: [], under_count: 0 }] };
const RELATED = { schema: 1, generated_at: "2026-11-12T07:55:00Z", issuers: [CCC], paths: {},
  titles: [["Agricultural Business", 0, 2, 1, 0], ["Welding 2", 0, 3, 1, 0]], pending: {}, batches: [], families: {} };
const STATEWIDE = { exhibits: [
  { exhibit_id: "MAPCXI-CBEC2-1-001", exhibit_ids: ["MAPCXI-CBEC2-1-001"], adopter_names: ["Hartnell College"],
    credit_recs: [{ course: "ABT 133", credit: "1.5 hours in Facility Management for Food Safety" }],
    adopter_rec_idx: { "Hartnell College": [0] } },
  { exhibit_id: "MAPCXI-WELD-1-001", exhibit_ids: ["MAPCXI-WELD-1-001"], adopter_names: ["Norco College"],
    credit_recs: [{ course: "WELD 99", credit: "3 units" }], adopter_rec_idx: { "Norco College": [0] } }] };
const MEMBERS = { generated_at: "2026-11-12 11:51", colleges: ["Gavilan College", "Hartnell College", "Norco College"],
  members: { "AGRI M1085": [{ c: 0, n: "FSAP 133", t: "Facility Management for Food Safety", u: 1.5, p: "0113.00", cn: "CCC000575190" },
    { c: 1, n: "ABT 133", t: "Facility Management for Food Safety", u: 1.5, p: "0113.00", cn: "CCC000519246" }] },
  topmap: { "0113.00": "Food Processing and Related Technologies" } };
const DESC_A = { CCC000519246: "Covers food safety issues and concerns in the manufacturing facility." };

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits", runScripts: "dangerously" });
  const w = dom.window;
  const loaded = [];
  w.fetch = function (url) {
    url = String(url);
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    if (url === "kb/exhibits_review.json") return ok(REVIEW);
    if (url === "kb/exhibits_related.json") return ok(RELATED);
    if (/\/rest\/v1\/kb_curation\?select=/.test(url)) return ok([]);
    if (/\/rest\/v1\/rpc\//.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  w.CPL_TABS = { loadScript: function (name, global, cb) {
    loaded.push(name);
    setTimeout(function () {
      if (name === "statewide_data.js") w.CPL_STATEWIDE = JSON.parse(JSON.stringify(STATEWIDE));
      if (name === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
      if (name === "coci_lookup_desc_A.js") { w.CPL_COCI_DESC = w.CPL_COCI_DESC || {}; w.CPL_COCI_DESC.A = DESC_A; }
      cb();
    }, 0);
  } };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(null); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, ""); };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, loaded: loaded };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function aside(d, label) { return d.querySelector('aside[aria-label="' + label + '"]'); }
function esc(w, target) { target.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); }

(async function () {
  let t = load();
  await t.M.boot(); await settle();
  check("the ABT 133 card is the one on screen", t.d.getElementById("exh-title").value === "Agricultural Business and Technology (ABT 133)");
  let btn = t.d.getElementById("exh-cd-btn");
  check("the Review card's Source line carries a Course details button, in words",
    btn && btn.tagName === "BUTTON" && txt(btn) === "Course details" && /^Source:/.test(txt(btn.parentNode))
    && !!btn.closest("section.exh-card") && btn.getAttribute("aria-expanded") === "false");
  check("Related titles shows beside the card before it is pressed", !!aside(t.d, "Related titles") && !aside(t.d, "Course details"));
  check("nothing large is read until it is pressed", t.loaded.length === 0);

  btn.click(); await settle();
  let p = aside(t.d, "Course details");
  check("pressing it opens Course details in the side panel, in Related titles' place",
    p && !aside(t.d, "Related titles") && p.parentNode.className === "exh-with-rel" && !!p.parentNode.querySelector("section.exh-card"));
  const title = p && p.querySelector(".exh-cd-title");
  check("the panel shows the course's own title, distinct from the canonical title",
    txt(title) === "Facility Management for Food Safety" && txt(title) !== t.d.getElementById("exh-title").value);
  check("with the college and the code", /Hartnell College · ABT 133/.test(txt(p)));
  check("its units, TOP, M-ID and control number",
    /Units 1\.5/.test(txt(p)) && /TOP 0113\.00, Food Processing and Related Technologies/.test(txt(p))
    && /M-ID AGRI M1085/.test(txt(p)) && /CCC000519246/.test(txt(p)));
  check("another college's course with the same M-ID is not shown as this one", !/FSAP 133/.test(txt(p)));
  check("the exhibit's credit recommendation", /Credit recommendation 1\.5 hours in Facility Management for Food Safety/.test(txt(p)));
  check("the catalog description", /Covers food safety issues/.test(txt(p)));
  check("and the MAP link", !!Array.from(p.querySelectorAll("a")).find(function (a) { return txt(a) === "MAPCXI-CBEC2-1-001 in MAP"; }));
  check("focus moves to the panel", t.d.activeElement === t.d.getElementById("exh-cd-h"));
  check("the control says it is open", t.d.getElementById("exh-cd-btn").getAttribute("aria-expanded") === "true"
    && t.d.getElementById("exh-cd-btn").getAttribute("aria-controls") === "exh-cd");

  const close = Array.from(p.querySelectorAll("button")).find(function (b) { return txt(b) === "Close"; });
  check("the panel has a Close word", !!close);
  close.click(); await settle();
  check("Close gives Related titles back", !!aside(t.d, "Related titles") && !aside(t.d, "Course details"));
  check("and returns focus to the control", t.d.activeElement === t.d.getElementById("exh-cd-btn"));

  t.d.getElementById("exh-cd-btn").click(); await settle();
  p = aside(t.d, "Course details");
  esc(t.w, p.querySelector("h4"));
  await settle();
  check("Escape closes it too, and returns focus", !!aside(t.d, "Related titles") && !aside(t.d, "Course details")
    && t.d.activeElement === t.d.getElementById("exh-cd-btn"));

  // A course the data does not hold.
  Array.from(t.d.querySelectorAll(".exh-acts button")).find(function (b) { return txt(b) === "Skip"; }).click(); await settle();
  check("the next card is the welding one", t.d.getElementById("exh-title").value === "Welding 1");
  t.d.getElementById("exh-cd-btn").click(); await settle();
  p = aside(t.d, "Course details");
  check("a course not in the data says so in plain words", /not in the course data COBI reads/.test(txt(p)));
  check("and still names the college, the code and the MAP link", /Norco College · WELD 99/.test(txt(p))
    && !!Array.from(p.querySelectorAll("a")).find(function (a) { return txt(a) === "MAPCXI-WELD-1-001 in MAP"; }));

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log(failed ? failed + " of " + results.length + " failed" : "all " + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
