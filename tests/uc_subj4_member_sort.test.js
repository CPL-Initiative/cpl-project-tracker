// Regression tests for two CCR refinements (2026-06-10):
//   #2  The "Subject(s)" column shows the CANONICAL SUBJ4 (the id prefix — the
//       product of the SUBJ4 re-mint), not the noisier raw per-college local code.
//       The raw local codes move to the cell hover; the Subject FILTER lists SUBJ4.
//       Synthetic UC-CUR-* rows (no subject prefix) fall back to their raw subj.
//   #4  The expanded member-college table is SORTABLE — clicking a header sorts
//       (re-click toggles direction); Units sorts numerically. Descriptions stay
//       correctly mapped after a sort (original-order pin).
//
// Run from repo root: `npm test` (or `node tests/uc_subj4_member_sort.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const mkRow = (id, title, subj, units, idSystem) => ({
  kind: "Course", id: id, title: title, id_system: idSystem || "M-ID",
  disc: "Kinesiology", credit: "Credit", units: units, top: "0835.00",
  subj: subj, members: 2, adopted: [], potential: [], conf: 0.7,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false,
});
const rows = [
  mkRow("KINE M1371", "Weight Training and Conditioning I", ["KIN"], 1.5),
  mkRow("PHYS M1804", "Weight Training", ["PE"], 1.0),
  mkRow("ACCT 110", "Financial Accounting", ["ACCT"], 4, "C-ID"),
  mkRow("UC-CUR-MPG029OM", "Auto Body Combo", ["AB", "ABDY"], 3, "Unified"),
];

// Member rows for KINE M1371 with varied units to exercise numeric sort.
const members = {
  "KINE M1371": [
    { c: 0, n: "KIN 167",  t: "Weight Training", u: 1.5, p: "0835.00" },
    { c: 1, n: "KIN R146A", t: "Weight Training", u: 0.5, p: "0835.00" },
    { c: 2, n: "KIN 96",   t: "Weight Training", u: 1.0, p: "0835.00" },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B", "C"], mq_disciplines: ["Kinesiology"], topmap: {} })};
  window.CPL_UC_MEMBERS = ${JSON.stringify({ colleges: ["Glendale", "Oxnard", "Desert"], members: members, topmap: { "0835.00": "Physical Education" } })};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

setTimeout(gridAssertions, 100);

function gridAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("uc-table-wrap");
  const bodyRows = Array.from(wrap.querySelectorAll("table.uc-table tbody tr"));
  const bySubj = {};
  bodyRows.forEach((tr) => {
    const cells = tr.querySelectorAll("td");
    const id = txt(cells[1]).replace(/^ⓘ\s*/, "");        // ID cell carries an ⓘ prefix
    bySubj[id] = txt(cells[7]);                            // 8th column = Subject(s)
  });

  // #2 — Subject column shows the canonical SUBJ4 (id prefix), not raw local code.
  check("M-ID Subject shows SUBJ4 'KINE' (not raw 'KIN')", bySubj["KINE M1371"] === "KINE");
  check("M-ID Subject shows SUBJ4 'PHYS' (not raw 'PE')", bySubj["PHYS M1804"] === "PHYS");
  check("C-ID Subject shows SUBJ4 'ACCT'", bySubj["ACCT 110"] === "ACCT");
  check("synthetic UC-CUR Subject falls back to raw subj 'AB, ABDY'", bySubj["UC-CUR-MPG029OM"] === "AB, ABDY");

  // #2 — the raw local code is preserved on the cell hover (nothing lost).
  const kineRow = bodyRows.find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf("KINE M1371") >= 0);
  const kineCell = kineRow.querySelectorAll("td")[7];
  check("raw local code preserved in Subject cell hover", (kineCell.getAttribute("title") || "").indexOf("KIN") >= 0);

  // #3 — Title/Discipline truncate via an inner .uc-trunc inline-block, NOT a bare-<td>
  // max-width (which is spec-undefined / ignored under table-layout:auto). Full text
  // stays on the cell hover; the Discipline cell itself is NOT clipped (its badges +
  // propose-correction link must remain visible).
  const titleCell = kineRow.querySelectorAll("td")[2];   // 3rd column = Title
  check("#3 Title text wrapped in .uc-trunc (truncates under table-layout:auto)", !!titleCell.querySelector(".uc-trunc"));
  check("#3 Title cell keeps the full title on hover", (titleCell.getAttribute("title") || "").indexOf("Weight Training and Conditioning I") >= 0);
  const discCell = kineRow.querySelectorAll("td")[3];    // 4th column = Discipline
  check("#3 Discipline NAME wrapped in .uc-trunc", !!discCell.querySelector(".uc-trunc"));

  // #2 — the Subject FILTER lists SUBJ4 values, not raw local codes.
  const opts = Array.from(doc.querySelectorAll("#uc-subj option")).map((o) => o.value);
  check("Subject filter lists SUBJ4 'KINE' and 'PHYS'", opts.indexOf("KINE") >= 0 && opts.indexOf("PHYS") >= 0);
  check("Subject filter does NOT list raw 'KIN' / 'PE'", opts.indexOf("KIN") < 0 && opts.indexOf("PE") < 0);

  memberSortAssertions();
}

function memberSortAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("uc-table-wrap");
  const kineTr = Array.from(wrap.querySelectorAll("table.uc-table tbody tr"))
    .find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf("KINE M1371") >= 0);
  const caret = kineTr.querySelector("a.uc-caret");
  caret.click();   // toggleMembers → loadMembers() resolves from window.CPL_UC_MEMBERS

  setTimeout(() => {
    const memberTable = kineTr.nextElementSibling.querySelector("table.uc-member-table");
    check("expanded row renders a member table", !!memberTable);
    const headers = memberTable.querySelectorAll("thead th");
    check("member table has 5 sortable headers", headers.length === 5);
    check("member headers are clickable (cursor:pointer)", /pointer/.test(headers[3].getAttribute("style") || ""));

    const unitsOf = () => Array.from(memberTable.querySelectorAll("tbody tr"))
      .map((tr) => parseFloat(txt(tr.querySelectorAll("td")[3]))).filter((n) => !isNaN(n));

    headers[3].click();   // sort by Units ascending
    const asc = unitsOf();
    check("Units header sorts ascending (0.5,1.0,1.5)", JSON.stringify(asc) === JSON.stringify([0.5, 1.0, 1.5]));

    headers[3].click();   // re-click → descending
    const desc = unitsOf();
    check("re-click Units header toggles to descending (1.5,1.0,0.5)", JSON.stringify(desc) === JSON.stringify([1.5, 1.0, 0.5]));

    finish();
  }, 80);
}

function finish() {
  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
