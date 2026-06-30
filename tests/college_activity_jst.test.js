// college_activity.js — the MIL/JST column + Veteran Star (Session 88).
//
// Guards: with veteran_jst data present (window.COLLEGE_HAS_JST = true) the
// table renders a "MIL / JST" cell per row, the ★ column reflects the Veteran
// Star (JST ≥ 75% of MIL — NOT the legacy "met ≥1 criterion" star), the totals
// sum MIL+JST, and the export carries MIL/JST/Veteran Star. With the data
// absent the column header hides, no MIL/JST cell renders, and the ★ falls back
// to the criteria star (graceful degradation).
//
// Run from repo root: `npm test` (or `node tests/college_activity_jst.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("college_activity.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function rec(o) {
  return Object.assign({
    tier: "Advancing", college: "X", district: "D", students: 0, veterans: 0,
    working_adults: 0, apprentices: 0, eligible_units: 0, transcribed_units: 0,
    exhibits: 0, credit_recs: 0, disciplines: 0, savings: 0, year_impact: 0,
    trans_rate: 0, criteria_met: 0, last_activity_days: 1,
    mil: 0, jst: 0, vstar: false, jst_rate: 0,
  }, o);
}

// Star college (JST≥75% MIL), non-star (64%), and a no-data college that DOES
// meet a tier criterion (to prove the ★ no longer uses criteria when JST is on).
const DATA = [
  rec({ college: "Star College", students: 541, mil: 168, jst: 535, vstar: true, jst_rate: 318, criteria_met: 0 }),
  rec({ college: "Below College", students: 468, mil: 724, jst: 467, vstar: false, jst_rate: 64, criteria_met: 5 }),
  rec({ college: "NoData College", students: 100, mil: 0, jst: 0, vstar: false, jst_rate: 0, criteria_met: 3 }),
];

const HTML = `<!DOCTYPE html><html><body>
  <table id="collegeActivityTable">
    <thead><tr>
      <th data-sort="tier">Tier<span class="sort-indicator"></span></th>
      <th data-sort="vstar">★<span class="sort-indicator"></span></th>
      <th data-sort="college">College<span class="sort-indicator"></span></th>
      <th data-sort="district">District<span class="sort-indicator"></span></th>
      <th data-sort="students">Students<span class="sort-indicator"></span></th>
      <th data-sort="veterans">Veterans<span class="sort-indicator"></span></th>
      <th id="caMilJstHeader" data-sort="jst_rate">MIL / JST<span class="sort-indicator"></span></th>
      <th data-sort="working_adults">Working<span class="sort-indicator"></span></th>
    </tr></thead>
    <tbody id="collegeTableBody"></tbody>
    <tfoot><tr id="collegeTotalsRow"></tr></tfoot>
  </table>
  <span id="caStarLegend">Veteran Star</span>
  <input id="collegeSearchBox" />
  <select id="tierFilter"><option value="">all</option></select>
  <select id="caDistrictFilter"><option value="">all</option></select>
  <select id="caDisciplineFilter"><option value="">all</option></select>
  <button id="exportExcelBtn"></button><button id="exportCSVBtn"></button>
  <button id="exportJSONBtn"></button><button id="caCustomReportBtn"></button>
</body></html>`;

function run(hasJst) {
  const dom = new JSDOM(HTML, { runScripts: "outside-only", url: "https://example.org/" });
  const { window } = dom;
  window.COLLEGE_ACTIVITY_DATA = DATA.map(d => Object.assign({}, d));
  window.COLLEGE_DISCIPLINE_DETAIL = {};
  window.COLLEGE_HAS_JST = hasJst;
  let threw = false;
  try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
  return { window, doc: window.document, threw };
}

let hasCellCount = 0, noneCellCount = 0;

// ── With JST data present ──
{
  const { doc, threw } = run(true);
  check("[has] init does not throw", !threw);
  const body = doc.getElementById("collegeTableBody");
  const totals = doc.getElementById("collegeTotalsRow");
  const txt = body.textContent;
  const starRow = Array.from(body.querySelectorAll("tr"))
    .find(tr => tr.textContent.includes("Star College"));
  const belowRow = Array.from(body.querySelectorAll("tr"))
    .find(tr => tr.textContent.includes("Below College"));
  const noDataRow = Array.from(body.querySelectorAll("tr"))
    .find(tr => tr.textContent.includes("NoData College"));

  check("[has] MIL/JST cell renders '168 / 535'", /168 \/ 535/.test(txt));
  check("[has] MIL/JST cell renders '724 / 467'", /724 \/ 467/.test(txt));
  check("[has] no-data college MIL/JST renders an em dash", /—/.test(noDataRow.textContent));
  check("[has] star college shows the ⭐", /⭐/.test(starRow.innerHTML));
  check("[has] below-75% college shows NO ⭐", !/⭐/.test(belowRow.innerHTML));
  // criteria_met=3 but vstar=false → the ★ must NOT fall back to criteria here.
  check("[has] criteria-meeting no-data college shows NO ⭐ (JST drives the star)",
    !/⭐/.test(noDataRow.innerHTML));
  check("[has] MIL/JST header stays visible",
    doc.getElementById("caMilJstHeader").style.display !== "none");
  check("[has] totals show MIL/JST sum (892 / 1,002)", /892 \/ 1,002/.test(totals.textContent));
  hasCellCount = starRow.querySelectorAll("td").length;
}

// ── With JST data absent → graceful fallback ──
{
  const { doc, threw } = run(false);
  check("[none] init does not throw", !threw);
  const body = doc.getElementById("collegeTableBody");
  const noDataRow = Array.from(body.querySelectorAll("tr"))
    .find(tr => tr.textContent.includes("NoData College"));
  check("[none] MIL/JST header hidden",
    doc.getElementById("caMilJstHeader").style.display === "none");
  check("[none] no MIL/JST cell text ('168 / 535' gone)", !/168 \/ 535/.test(body.textContent));
  // Fallback star = criteria_met >= 1; NoData College (criteria_met=3) gets a ⭐.
  check("[none] star falls back to the criteria star", /⭐/.test(noDataRow.innerHTML));
  check("[none] legend restored to the criteria-star text",
    /≥1 criterion/.test(doc.getElementById("caStarLegend").textContent));
  noneCellCount = noDataRow.querySelectorAll("td").length;
}

check("a body row has exactly one more cell with JST data than without",
  hasCellCount > 0 && hasCellCount === noneCellCount + 1);

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
