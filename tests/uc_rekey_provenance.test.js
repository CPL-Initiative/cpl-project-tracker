// Regression test for the re-key provenance line in the audit tooltip
// (Session 54). When a curator-driven cross-subject re-key (e.g. a course moved
// from Computer Science → Business, SUBJ4 CISC → BUSI) leaves a residual audit
// flag, the auditor stamps the row summary with `rk` (the prior identity). The
// CCR's ⚠ audit-chip tooltip (auditTagsTip) then shows "re-keyed from <id>" so a
// curator can tell a deliberate re-key from a real misassignment — the missing
// context Sam flagged on the subject_collision rows.
//
// Run from repo root: `npm test` (or `node tests/uc_rekey_provenance.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Business", credit: "Noncredit Enhanced", units: 0, top: "0514.00",
  subj: ["BUSI"], members: 2, adopted: [], potential: [], conf: 0.68,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false }, locked: false,
});
const rows = [
  mkRow("BUSI M9039", "QuickBooks Fundamentals for Financial Office Applications"),
  mkRow("MATH M1002", "College Algebra"),
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Business", "Mathematics"], topmap: {} })};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
// The audit overlay (loadAudit fetches kb/row_audit/latest.json) — BUSI M9039
// carries rk (a cross-subject re-key); MATH M1002 is flagged but NOT re-keyed.
window.fetch = (u) => Promise.resolve({ ok: true, status: 200,
  json: () => Promise.resolve(String(u).indexOf("row_audit") >= 0
    ? { _generated_at: "2026-06-13", rows: [
        { id: "BUSI M9039", tags: ["blank_description"], fts: 0.78, rk: "CISC M9030" },
        { id: "MATH M1002", tags: ["seed_untouched_discipline"], fts: 0.60 },
      ] }
    : []) });
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(160);   // loadAudit() resolves on init → render() paints the ⚠ chips
  const doc = window.document;
  const rowFor = (id) => Array.from(doc.querySelectorAll("table.uc-table tbody tr"))
    .find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf(id) >= 0);
  const auditChip = (tr) => tr && Array.from(tr.querySelectorAll("span.uc-badge"))
    .find((s) => txt(s).indexOf("⚠") >= 0);

  const reKeyed = auditChip(rowFor("BUSI M9039"));
  const plain = auditChip(rowFor("MATH M1002"));
  check("re-keyed row shows the ⚠ audit chip", !!reKeyed);
  check("plain flagged row shows the ⚠ audit chip", !!plain);
  check("re-keyed row's tooltip names the prior identity (re-keyed from CISC M9030)",
    reKeyed && /re-keyed from CISC M9030/.test(reKeyed.getAttribute("title") || ""));
  check("re-keyed tooltip frames it as a deliberate re-key (not a fresh mint)",
    reKeyed && /not a fresh mint/.test(reKeyed.getAttribute("title") || ""));
  check("a flagged row WITHOUT rk shows NO re-keyed line",
    plain && !/re-keyed from/.test(plain.getAttribute("title") || ""));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
