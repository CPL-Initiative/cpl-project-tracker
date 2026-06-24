// Session 70 — the worklist cross-discipline flag (pairs with the morphological
// fold). When a merge group's members span ≥2 disciplines (the homonym risk the
// morphological fold can surface — music vs office "keyboard"), the group shows an
// amber "⚠ Spans N disciplines" banner. Single-discipline groups do not. Surface,
// don't withhold (suggestions-only).
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_cross_discipline_flag.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "MUSC M1001", title: "Keyboarding", id_system: "M-ID",
    disc: "Music", subj: ["MUSC"], units: 2, credit: "Credit", members: 2, adopted: [], potential: [], flags: {} },
];
const sug = {
  groups: [
    // Cross-discipline: "Keyboarding" tagged Music vs Office Technologies.
    { score: 0.85, members: [
      { id: "MUSC M1001", t: "Keyboarding", s: "MUSC", u: 2, k: "M-ID", d: "Music" },
      { id: "OFTC M1002", t: "Keyboarding", s: "OFTC", u: 2, k: "M-ID", d: "Office Technologies" } ] },
    // Single-discipline: both Foreign Languages.
    { score: 0.9, members: [
      { id: "FLSP M2001", t: "Conversational Spanish", s: "FLSP", u: 3, k: "M-ID", d: "Foreign Languages" },
      { id: "FLSP M2002", t: "Spanish Conversation", s: "FLSP", u: 3, k: "M-ID", d: "Foreign Languages" } ] },
  ],
  family_groups: [], desc_groups: [], title_groups: [], evidence_groups: [], singleton_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Music", "Office Technologies", "Foreign Languages"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sug)};
</script></body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
const { document } = window;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } }); };
window.alert = function () {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

function bodyText() { return txt(document.body); }

(async function () {
  await sleep(120);
  const open = Array.from(document.querySelectorAll("button, a")).find(function (b) { return /Suggested merges/.test(txt(b)); });
  if (open) open.dispatchEvent(new window.Event("click"));
  await sleep(240);

  // Group 1 is cross-discipline → banner present + names both disciplines.
  check("cross-discipline group shows the '⚠ Spans 2 disciplines' banner", /Spans 2 disciplines/.test(bodyText()));
  check("banner names Music", /Music/.test(bodyText()));
  check("banner names Office Technologies", /Office Technologies/.test(bodyText()));

  // Skip to group 2 (single discipline) → no banner.
  const skip = Array.from(document.querySelectorAll("button")).find(function (b) { return /Skip/.test(txt(b)); });
  check("Skip button present", !!skip);
  skip.dispatchEvent(new window.Event("click"));
  await sleep(80);
  check("advanced to the single-discipline group (Spanish)", /Conversational Spanish|Spanish Conversation/.test(bodyText()));
  check("single-discipline group shows NO 'Spans' banner", !/Spans \d+ disciplines/.test(bodyText()));

  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
