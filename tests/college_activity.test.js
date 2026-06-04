// Regression test for college_activity.js — small-cell suppression handling
// (Session 34). Per-college cohort counts of 1 are masked producer-side as the
// string "<2" (privacy: an exact singleton headcount of a possibly-protected
// group never ships). The consumer must render that mask, exclude it from the
// totals (numeric-only sum), and sort it as a small number — never crash, never
// emit NaN. Guards those three spots (fmtN / sums / sort).
//
// Run from repo root: `npm test` (or `node tests/college_activity.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("college_activity.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function rec(o) {
  // full per-college record shape the renderer expects
  return Object.assign({
    tier: "Advancing", college: "X", district: "D", students: 0, veterans: 0,
    working_adults: 0, apprentices: 0, eligible_units: 0, transcribed_units: 0,
    exhibits: 0, credit_recs: 0, disciplines: 0, savings: 0, year_impact: 0,
    trans_rate: 0, criteria_met: 0, last_activity_days: 1,
  }, o);
}
// Big college: all numeric. Tiny college: masked "<2" cohort cells (the case
// that used to break the int-only sum/sort).
const DATA = [
  rec({ tier: "Leading", college: "Big College", district: "D1",
        students: 5000, veterans: 300, working_adults: 2000, apprentices: 50,
        eligible_units: 9000, transcribed_units: 4000, exhibits: 10,
        credit_recs: 20, disciplines: 5, savings: 100000, year_impact: 1000000,
        trans_rate: 44, criteria_met: 3 }),
  rec({ tier: "Advancing", college: "Tiny College", district: "D2",
        students: "<2", veterans: "<2", working_adults: "<2", apprentices: 0,
        eligible_units: 10, exhibits: 1, credit_recs: 1, disciplines: 1 }),
];

const html = `<!DOCTYPE html><html><body>
  <table id="collegeActivityTable">
    <thead><tr><th data-sort="students">Students<span class="sort-indicator"></span></th></tr></thead>
    <tbody id="collegeTableBody"></tbody>
    <tfoot><tr id="collegeTotalsRow"></tr></tfoot>
  </table>
  <input id="collegeSearchBox" />
  <select id="tierFilter"><option value="">all</option></select>
  <select id="caDistrictFilter"><option value="">all</option></select>
  <select id="caDisciplineFilter"><option value="">all</option></select>
  <button id="exportExcelBtn"></button><button id="exportCSVBtn"></button>
  <button id="exportJSONBtn"></button><button id="caCustomReportBtn"></button>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
window.COLLEGE_ACTIVITY_DATA = DATA;
window.COLLEGE_DISCIPLINE_DETAIL = {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw on a masked '<2' cell", !threw);

const doc = window.document;
const body = doc.getElementById("collegeTableBody");
const totals = doc.getElementById("collegeTotalsRow");
const bodyTxt = (body && body.textContent) || "";
const totalsTxt = (totals && totals.textContent) || "";

check("both college rows rendered", body && body.querySelectorAll("tr").length === 2);
check("masked '<2' cohort cell is rendered (as text)", /<2/.test(bodyTxt));
check("totals row has no NaN (numeric-only sum)", !/NaN/.test(totalsTxt));
check("totals row has no 'undefined'", !/undefined/.test(totalsTxt));
// Students total = 5,000 (Big only; Tiny's "<2" excluded from the floor sum).
check("totals students = 5,000 (masked cell excluded)", /5,000/.test(totalsTxt));
// Default sort is students desc → Big (5000) above Tiny ("<2" → sorts ~1).
const order = Array.from(body.querySelectorAll("tr")).map(
  (tr) => (tr.textContent.indexOf("Big College") >= 0 ? "big" : "tiny"));
check("sort: numeric row sorts above the masked row", order[0] === "big" && order[1] === "tiny");

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
