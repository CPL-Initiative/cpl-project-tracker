// Regression tests for the CCR "Eligible units" + "Students" impact columns and
// the "🎯 Cleanup impact" preset (2026-06-09). The columns roll up the CER's
// per-credential eligible-credit + student totals to each course via the
// articulation crosswalk, so the Unified Courses cleanup queue can be ranked by
// REAL student-credit impact (not just the auditor's structural leverage).
// Guards:
//   - both column headers render
//   - a row WITH eu renders the value (thousands sep) + the ⚠ over-merge badge
//   - a row WITHOUT eu/st renders "—" and does NOT crash render (omitted-field class)
//   - clicking the "Eligible units" header sorts numerically (desc → highest first)
//   - the preset narrows to auditor-flagged rows with eu>0, sorted by eligible desc
//
// Run from repo root: `npm test` (or `node tests/uc_impact_columns.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const mkRow = (id, title, eu, st, over) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Spanish", credit: "Credit", units: 4, top: null,
  subj: ["SPAN"], members: 5, adopted: [], potential: [], conf: 0.9,
  flags: { over_merged: !!over, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false, eu: eu, st: st,   // eu/st undefined when the course has no CPL articulations
});
const rows = [
  mkRow("M-IMPACT", "Spanish 1", 12136, 2569, true),       // high eligible + over-merge badge + auditor-flagged
  mkRow("M-SMALL", "Small Course", 50, undefined, false),  // small eligible, no students, NOT auditor-flagged
  mkRow("M-NONE", "No CPL Course", undefined, undefined, false), // no impact → "—", must not crash
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>window.CPL_UNIFIED_COURSES = ${JSON.stringify({
  rows: rows, colleges: ["College A"], mq_disciplines: ["Spanish"], topmap: {},
})};</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
// Audit overlay stub: only M-IMPACT is auditor-flagged → the Cleanup-impact preset
// (triage "Any audit flag") should keep only it. Other fetches resolve empty.
window.fetch = (u) => Promise.resolve({ ok: true, status: 200,
  json: () => Promise.resolve(String(u).indexOf("row_audit") >= 0
    ? { _generated_at: "2026-06-09", rows: [{ id: "M-IMPACT", tags: ["seed_untouched_discipline"], fts: 0.73 }] }
    : []) });

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw (incl. a row with no eu/st)", !threw);

setTimeout(runAssertions, 100);

function headerByText(wrap, needle) {
  return Array.from(wrap.querySelectorAll("th")).find((th) => txt(th).indexOf(needle) >= 0);
}
function rowById(wrap, id) {
  return Array.from(wrap.querySelectorAll("tbody tr")).find((tr) => txt(tr).indexOf(id) >= 0);
}
// Column order: kind,id,title,disc,credit,units,top,subj,members,adopted,potential,eu(11),st(12),conf,flags
const EU_COL = 11, ST_COL = 12;

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("uc-table-wrap");
  check("table rendered", !!wrap.querySelector("table.uc-table"));
  check("Eligible-units header present", !!headerByText(wrap, "Eligible units"));
  check("Students header present", !!headerByText(wrap, "Students"));

  const impactRow = rowById(wrap, "M-IMPACT");
  const euCell = impactRow && impactRow.querySelectorAll("td")[EU_COL];
  const stCell = impactRow && impactRow.querySelectorAll("td")[ST_COL];
  check("eligible value renders with thousands separator", !!euCell && /12,136/.test(txt(euCell)));
  check("over-merge ⚠ badge in the eligible cell", !!euCell && /⚠/.test(txt(euCell)));
  check("students value renders with thousands separator", !!stCell && /2,569/.test(txt(stCell)));

  const noneRow = rowById(wrap, "M-NONE");
  const noneEu = noneRow && noneRow.querySelectorAll("td")[EU_COL];
  check("no-impact row renders without crashing", !!noneRow);
  check("no-impact eligible cell is an em-dash", !!noneEu && txt(noneEu) === "—");

  // Numeric sort: two clicks on the Eligible-units header → desc (highest first).
  const euTh = headerByText(wrap, "Eligible units");
  if (euTh) {
    euTh.click(); euTh.click();
    check("sort by eligible floats highest to the top", /M-IMPACT/.test(txt(wrap.querySelector("tbody tr"))));
  }

  // Cleanup-impact preset: auditor-flagged ∩ eu>0 → only M-IMPACT survives.
  const btn = doc.getElementById("uc-impact");
  check("Cleanup-impact preset button present", !!btn);
  if (btn) {
    btn.click();
    setTimeout(function () {
      const ids = Array.from(wrap.querySelectorAll("tbody tr")).map(txt).join(" ");
      check("preset keeps the flagged + high-impact row", /M-IMPACT/.test(ids));
      check("preset drops the unflagged small-eligible row", !/M-SMALL/.test(ids));
      check("preset drops the no-impact row", !/M-NONE/.test(ids));
      finish();
    }, 80);
  } else { finish(); }
}

function finish() {
  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  if (pass !== results.length) process.exit(1);
}
