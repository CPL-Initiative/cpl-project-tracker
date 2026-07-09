// Regression tests for the CER "Eligible (units)" column (2026-06-09) — the
// long-blocked eligible side, sourced from MAP's Exhibit CRs Catalog per-exhibit
// credit funnel (export_credential_reference → _rollup_exhibit_cr_catalog).
// Guards the CONSUMER:
//   - a credit-unit value renders with thousands separators
//   - null (no catalog data yet) renders "—"
//   - the hover tip surfaces the funnel + "credit waiting to be unlocked"
//   - clicking the "Eligible" header sorts by eligible credits (desc → most first)
//
// Run from repo root: `npm test` (or `node tests/cer_eligible.test.js`).
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

const mk = (ut, elig, trans) => ({
  ut: ut, raw_count: 1, audit_tags: {}, audit_tag_total: 0, articulations: [],
  students_served: null, served_suppressed: false,
  eligible_credits: elig, transcribed_credits: trans, applied_credits: null, in_review_credits: null,
});
const fixtureRows = [
  mk("ZZZ Elig High", 6420, 100),   // value + funnel (waiting = 6320)
  mk("ZZZ Elig Zero", 0, 0),        // matched but none eligible → "0"
  mk("ZZZ Elig None", null, null),  // no catalog data → "—"
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
// v2: the Eligible-units column is hidable and OFF by default — enable it
// via the ⚙ Columns pref (cplCerCols.v1) before the tab boots.
window.localStorage.setItem("cplCerCols.v1", JSON.stringify({ elig: true }));
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(runAssertions, 80);

function rowByTitle(wrap, needle) {
  return Array.from(wrap.querySelectorAll("tr.cr-row")).find((tr) => txt(tr).indexOf(needle) >= 0);
}
// the Eligible cell is the <td> immediately after the Students cell
function eligCell(tr) {
  const cells = Array.from(tr.querySelectorAll("td.cr-served-cell"));
  return cells[cells.length - 1];  // Students first, Eligible second
}

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");
  check("table rendered", !!wrap.querySelector("table.cr-table"));

  const ths = Array.from(wrap.querySelectorAll("th"));
  const eligTh = ths.find((th) => /^Elig/.test(txt(th)));
  check("Eligible column header present", !!eligTh);
  check("Eligible header is sortable", !!eligTh && eligTh.classList.contains("sortable"));

  const hi = rowByTitle(wrap, "ZZZ Elig High");
  const hiCell = hi && eligCell(hi);
  check("eligible value renders with thousands separator", !!hiCell && /6,420/.test(txt(hiCell)));
  const span = hiCell && hiCell.querySelector(".cr-served-n");
  check("hover tip surfaces 'credit waiting to be unlocked'", !!span && /waiting to be unlocked/i.test(span.getAttribute("title") || ""));
  check("hover tip shows the waiting value (6,320)", !!span && /6,320/.test(span.getAttribute("title") || ""));

  const zero = rowByTitle(wrap, "ZZZ Elig Zero");
  check("matched-but-zero renders '0' (not '—')", !!zero && txt(eligCell(zero)) === "0");
  const none = rowByTitle(wrap, "ZZZ Elig None");
  check("no-data renders '—'", !!none && txt(eligCell(none)) === "—");

  if (eligTh) {
    eligTh.click();
    const firstRow = wrap.querySelector("tr.cr-row");
    check("sort floats the most-eligible credential to the top", /ZZZ Elig High/.test(txt(firstRow)));
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
