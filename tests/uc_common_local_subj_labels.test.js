// Guards the Common SUBJ / Local SUBJ vocabulary in the CCR (Sam, 2026-06-23):
// the word "Subject(s)" used to label BOTH the canonical shared subject (the
// column + filter, `subj4Of`) AND the per-college local codes (the disciplines
// legend + row tooltip, `r.subj`). Now: canonical = "Common SUBJ", per-college =
// "Local SUBJ". The "SUBJ4" label was an earlier-work artifact, retired.
//
// Run from repo root: `npm test` (or `node tests/uc_common_local_subj_labels.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "PHOT M1064", title: "Digital Imaging 1", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["PHOT", "GRAF", "MULT"],
    members: 4, adopted: [], potential: [], conf: 0.85, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "WELD M2001", title: "Intro Welding", id_system: "M-ID",
    disc: "Welding", credit: "Credit", units: 1.0, top: "0956.00", subj: ["WELD"],
    members: 2, adopted: [], potential: [], conf: 0.8, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Photography", "Welding"], topmap: {} })};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;

  // Column header is "Common SUBJ" (canonical), not the old "Subject(s)".
  // (The active-sort column appends a " ▲/▼" arrow, so match by substring.)
  const headers = Array.from(doc.querySelectorAll("table.uc-table th")).map(txt);
  check("column header is 'Common SUBJ'", headers.some((h) => h.indexOf("Common SUBJ") >= 0));
  check("old 'Subject(s)' header is gone", headers.every((h) => h.indexOf("Subject(s)") < 0));
  check("no 'SUBJ4' artifact label in the headers", headers.every((h) => h.indexOf("SUBJ4") < 0));

  // Filter default is "All Common SUBJ".
  const fSubj = doc.getElementById("uc-subj");
  check("subject filter default reads 'All Common SUBJ'",
    fSubj && fSubj.options[0] && txt(fSubj.options[0]) === "All Common SUBJ");

  // The Common SUBJ cell shows the canonical prefix; Local SUBJ codes are on hover.
  const subjCol = headers.findIndex((h) => h.indexOf("Common SUBJ") >= 0);
  const firstRow = doc.querySelector("table.uc-table tbody tr");
  const cell = firstRow.querySelectorAll("td")[subjCol];
  check("Common SUBJ cell shows the canonical prefix (PHOT)", txt(cell) === "PHOT");
  check("the cell tooltip labels the per-college codes 'Local SUBJ'",
    /Local SUBJ code\(s\):/.test(cell.getAttribute("title") || ""));
  check("the tooltip carries the local codes (GRAF/MULT), not the column",
    /GRAF/.test(cell.getAttribute("title") || ""));

  // Disciplines legend uses "Local SUBJ seen in …" (it lists per-college codes).
  fSubj && (function () {})();
  const fDisc = doc.getElementById("uc-disc");
  fDisc.value = "Photography"; fDisc.dispatchEvent(new window.Event("change"));
  await sleep(40);
  check("disciplines legend reads 'Local SUBJ seen in …'",
    /Local SUBJ seen in/.test(doc.body.textContent));
  check("legend does not use the bare 'Subjects seen in' wording",
    doc.body.textContent.indexOf("Subjects seen in") < 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
