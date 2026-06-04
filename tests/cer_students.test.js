// Regression tests for the CER "Students" (student-impact) column (2026-06-04,
// path 1). Rolls up MAP View_ArticulatedCollegeCourses.Students per credential
// so curators can prioritize by impact. Guards:
//   - an exact count (>=5) renders with thousands separators
//   - a suppressed count (1-4) renders masked as "<5" (small-cell privacy)
//   - no data renders "—"
//   - clicking the "Students" header sorts by impact (desc → highest first,
//     suppressed above no-data)
//
// Run from repo root: `npm test` (or `node tests/cer_students.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
function loadPayload(p) {
  let s = fs.readFileSync(p, "utf8");
  s = s.slice(s.indexOf("=") + 1).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
}
const payload = loadPayload("credential_reference_data.js");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const mk = (ut, served, sup) => ({
  ut: ut, raw_count: 1, audit_tags: {}, audit_tag_total: 0, articulations: [],
  students_served: served, served_suppressed: !!sup,
});
const fixtureRows = [
  mk("ZZZ High Impact", 5000, false),     // exact count
  mk("ZZZ Suppressed", null, true),       // 1-4 → "<5"
  mk("ZZZ No Data", null, false),         // none → "—"
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-credential-reference">
  <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
</div>
<script>window.CPL_CREDENTIAL_REFERENCE = ${JSON.stringify({
  _generated_at: payload._generated_at, top_categories: payload.top_categories,
  unified_titles: fixtureRows,
})};</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(runAssertions, 80);

function rowByTitle(wrap, needle) {
  return Array.from(wrap.querySelectorAll("tr.cr-row")).find((tr) => txt(tr).indexOf(needle) >= 0);
}

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");
  check("table rendered", !!wrap.querySelector("table.cr-table"));

  // Header present + sortable.
  const ths = Array.from(wrap.querySelectorAll("th"));
  const studentsTh = ths.find((th) => /^Students/.test(txt(th)));
  check("Students column header present", !!studentsTh);
  check("Students header is sortable", !!studentsTh && studentsTh.classList.contains("sortable"));

  // Cell rendering.
  const hi = rowByTitle(wrap, "ZZZ High Impact");
  check("exact count renders with thousands separator", !!hi && /5,000/.test(txt(hi.querySelector(".cr-served-n"))));
  const sup = rowByTitle(wrap, "ZZZ Suppressed");
  check("suppressed (1-4) renders masked '<5'", !!sup && txt(sup.querySelector(".cr-served-sup")) === "<5");
  check("suppressed exact number not present anywhere", !/(^|[^0-9])[1-4]([^0-9]|$)/.test(txt(sup.querySelector(".cr-served-cell"))));
  const none = rowByTitle(wrap, "ZZZ No Data");
  check("no-data renders '—'", !!none && txt(none.querySelector(".cr-served-cell")) === "—");

  // Sort by impact: click the Students header → desc (highest first).
  if (studentsTh) {
    studentsTh.click();
    var firstRow = wrap.querySelector("tr.cr-row");
    check("sort-by-impact floats highest count to the top", /ZZZ High Impact/.test(txt(firstRow)));
    // Suppressed (<5) sorts above no-data.
    var rowsOrder = Array.from(wrap.querySelectorAll("tr.cr-row")).map((tr) => txt(tr));
    var iSup = rowsOrder.findIndex((t) => /ZZZ Suppressed/.test(t));
    var iNone = rowsOrder.findIndex((t) => /ZZZ No Data/.test(t));
    check("suppressed (<5) sorts above no-data", iSup >= 0 && iNone >= 0 && iSup < iNone);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
