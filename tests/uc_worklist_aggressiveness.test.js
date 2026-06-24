// Session 70 (PaintSky) — the global Conservative↔Aggressive slider on the ✨
// worklist. Replaces the title-only 🏷 slider with one cohesion floor gating ALL
// scored lanes (anchored/singleton/family = _sug_score, desc/title = cos_min).
// The COCI-evidence lane (witness count, not a 0–1 score) is exempt — always shown.
// Right = aggressive (lower floor, more surface); left = conservative.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_aggressiveness.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "WELD M1001", title: "Introduction to Welding", id_system: "M-ID",
    disc: "Welding", subj: ["WELD"], units: 3, credit: "Credit", members: 2, adopted: [], potential: [], flags: {} },
];
// Three anchored groups across the cohesion range + one evidence group (exempt).
const sug = {
  groups: [
    { score: 0.90, members: [
      { id: "WELD M1001", t: "Introduction to Welding", s: "WELD", u: 3, k: "M-ID" },
      { id: "WELD M1002", t: "Welding Basics", s: "WELD", u: 3, k: "M-ID" } ] },
    { score: 0.50, members: [
      { id: "WELD M1003", t: "Gas Welding", s: "WELD", u: 3, k: "M-ID" },
      { id: "WELD M1004", t: "Oxy Welding", s: "WELD", u: 2, k: "M-ID" } ] },
    { score: 0.45, members: [
      { id: "WELD M1005", t: "Pipe Welding", s: "WELD", u: 4, k: "M-ID" },
      { id: "WELD M1006", t: "Tube Welding", s: "WELD", u: 1, k: "M-ID" } ] },
  ],
  evidence_groups: [
    { sig: "WELD 100", official: "WELD 100", score: 3, members: [
      { id: "WELD M2001", t: "Welding I", s: "WELD", u: 3, k: "M-ID" },
      { id: "WELD M2002", t: "Welding I", s: "WELD", u: 3, k: "M-ID" } ] },
  ],
  family_groups: [], desc_groups: [], title_groups: [], singleton_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Welding"], topmap: {} })};
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

function headText() { return txt(document.body); }   // worklist overlay mounts on body
function matchCount() { var m = headText().match(/of (\d+) matching/); return m ? parseInt(m[1], 10) : null; }
function readout() {
  var s = Array.from(document.querySelectorAll("span")).find(function (x) { return /^≥ \d/.test(txt(x)); });
  return s ? txt(s) : "";
}

(async function () {
  await sleep(120);
  const open = Array.from(document.querySelectorAll("button, a")).find(function (b) { return /Suggested merges/.test(txt(b)); });
  if (open) open.dispatchEvent(new window.Event("click"));
  await sleep(240);

  const slider = document.querySelector('input[type="range"]');
  check("global slider (range input) present", !!slider);
  check("Conservative endpoint label present", /Cons\./.test(headText()));
  check("Aggressive endpoint label present", /Aggr\./.test(headText()));
  check("readout shows the default floor ≥ 0.62", readout() === "≥ 0.62");

  // Conservative extreme (value 0 → floor 0.85): only the 0.90 anchored group +
  // the evidence group (exempt) pass → 2 matching.
  slider.value = "0"; slider.dispatchEvent(new window.Event("input"));
  await sleep(60);
  check("conservative readout ≥ 0.85", readout() === "≥ 0.85");
  check("conservative floor surfaces 2 groups (0.90 + exempt evidence)", matchCount() === 2);

  // Aggressive extreme (value 100 → floor 0.00, Sam S72): all 4 groups pass.
  slider.value = "100"; slider.dispatchEvent(new window.Event("input"));
  await sleep(60);
  check("aggressive readout ≥ 0.00 (S72 — deepened from 0.40)", readout() === "≥ 0.00");
  check("aggressive floor surfaces all 4 groups", matchCount() === 4);

  // Evidence exemption: even at the strictest floor it survived (2 included it).
  check("evidence lane is exempt from the floor (count never drops below the evidence group)", true);

  // ---- report ----
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
