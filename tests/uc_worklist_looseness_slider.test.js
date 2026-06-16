// Guards the Session-58 looseness slider (Sam, 2026-06-16): the worklist header
// carries a 🏷 "match strength" slider that filters which TITLE-similarity-lane
// groups surface, by their weakest-pair cosine (g.score). Default 0.62
// reproduces the pre-slider behavior (every pair ≥ 0.62 — what the receipt used
// to require); sliding down to 0.50 reveals the weaker 0.50–0.62 band the
// regenerated receipt now carries. Other lanes have no cosine → unaffected.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_looseness_slider.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "WELD M1001", title: "Welding Technology 1", id_system: "M-ID",
    disc: "Welding", credit: "Credit", units: 3, top: "0956.00", subj: ["WELD"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
// One TITLE-lane group whose weakest pair cosine (score) is 0.55 — below the
// default 0.62 floor, so it's hidden until the curator loosens the slider.
const sugStub = {
  groups: [], family_groups: [], desc_groups: [], evidence_groups: [], singleton_groups: [],
  title_groups: [
    { sig: "Welding Technology 1", n: 2, score: 0.55, cos_max: 0.78, same_college: false,
      spread: 0, terms: ["welding", "technology"], members: [
        { id: "WELD M1001", t: "Welding Technology 1", s: "WELD", u: 3, k: "M-ID" },
        { id: "WELD M10AB", t: "Intro to Welding Tech", s: "WELD", u: 3, k: "Stand-Alone", g: 1 },
      ] },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Welding"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => Promise.resolve({
  ok: true, status: (opts && opts.method && opts.method !== "GET") ? 201 : 200,
  json: () => Promise.resolve([]),
});
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(250);

  const slider = doc.querySelector('input[type=range]');
  check("🏷 looseness slider present in the worklist header", !!slider);
  check("slider defaults to 0.62 (today's behavior)", slider && slider.value === "0.62");

  // At the default floor the weak (0.55) title group is hidden — the worklist
  // shows the End state (no group form), NOT the 0.55 group.
  check("weak 0.55 title group HIDDEN at default floor (no group form shown)",
    !/Proposed unified title/.test(doc.body.textContent) && /End of the worklist/.test(doc.body.textContent));

  // Loosen to 0.50 → the group surfaces (its form + its title-lane-only
  // candidate "Intro to Welding Tech", which is not in the CCR table).
  slider.value = "0.50";
  slider.dispatchEvent(new window.Event("input"));
  await sleep(60);
  check("loosening to 0.50 REVEALS the weak title group (Proposed-title form appears)",
    /Proposed unified title/.test(doc.body.textContent));
  check("the revealed group shows its title-lane candidate",
    /Intro to Welding Tech/.test(doc.body.textContent));

  // Tighten back to 0.62 → hidden again.
  slider.value = "0.62";
  slider.dispatchEvent(new window.Event("input"));
  await sleep(60);
  check("tightening back to 0.62 hides it again",
    !/Proposed unified title/.test(doc.body.textContent) && /End of the worklist/.test(doc.body.textContent));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
