// Regression tests for the CER "Group by GE Area" grain view (2026-06-04).
// Groups AP/IB/CLEP exam credentials under collapsible GE-Area headers — the
// faculty/student rollup. Guards:
//   - the toolbar dropdown offers a "Group: GE Area" option
//   - a multi-area exam (e.g. AP European History → SBS *or* Arts & Humanities)
//     appears under BOTH area buckets (multi-bucketing)
//   - N/A exams bucket under "N/A — elective credit only"
//   - non-exam credentials land in a "Not a standardized exam" catch-all that is
//     COLLAPSED by default (its rows hidden until expanded)
//
// Run from repo root: `npm test` (or `node tests/cer_gearea.test.js`).
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

const mk = (ut, ge) => ({ ut: ut, raw_count: 1, audit_tags: {}, audit_tag_total: 0, articulations: [], ge_credit: ge || null });
const fixtureRows = [
  mk("AP European History", { program: "AP", areas: ["Social/Behavioral Sciences", "Arts and Humanities"], units: 3, na: false }),
  mk("IB Biology HL", { program: "IB", areas: ["Natural Sciences"], units: 3, na: false }),
  mk("AP Seminar", { program: "AP", areas: [], units: 0, na: true }),
  mk("ZZZ CompTIA A Plus (not an exam)", null),
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

function rowTitleCount(wrap, needle) {
  return Array.from(wrap.querySelectorAll("tr.cr-row")).filter((tr) => txt(tr).indexOf(needle) >= 0).length;
}

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");

  const sel = doc.getElementById("cr-group-by");
  check("group dropdown exists", !!sel);
  const hasGearea = sel && Array.from(sel.options).some((o) => o.value === "gearea" && /GE Area/.test(o.textContent));
  check("dropdown offers 'Group: GE Area'", hasGearea);

  // Switch to GE-Area grouping.
  sel.value = "gearea";
  sel.dispatchEvent(new window.Event("change", { bubbles: true }));

  const headers = Array.from(wrap.querySelectorAll("tr.cr-group-hdr .cr-group-label")).map(txt);
  check("Natural Sciences header present", headers.some((h) => /Natural Sciences/.test(h)));
  check("Social/Behavioral Sciences header present", headers.some((h) => /Social\/Behavioral Sciences/.test(h)));
  check("Arts and Humanities header present", headers.some((h) => /Arts and Humanities/.test(h)));
  check("N/A elective bucket header present", headers.some((h) => /N\/A — elective credit only/.test(h)));
  check("non-exam catch-all header present", headers.some((h) => /Not a standardized exam/.test(h)));

  // Multi-bucketing: AP European History (SBS or AH) renders under BOTH areas.
  check("multi-area exam appears in 2 buckets", rowTitleCount(wrap, "AP European History") === 2);
  // Single-area exam appears once.
  check("single-area exam appears in 1 bucket", rowTitleCount(wrap, "IB Biology HL") === 1);
  // N/A exam appears once (under the N/A bucket).
  check("N/A exam appears once", rowTitleCount(wrap, "AP Seminar") === 1);
  // Non-exam catch-all is collapsed by default → its row is not rendered.
  check("non-exam row hidden (catch-all collapsed by default)", rowTitleCount(wrap, "ZZZ CompTIA A Plus") === 0);

  // Expanding the catch-all reveals the non-exam row.
  const catchAllToggle = Array.from(wrap.querySelectorAll("tr.cr-group-hdr .cr-group-toggle"))
    .find((b) => /Not a standardized exam/.test(txt(b)));
  if (catchAllToggle) {
    catchAllToggle.click();
    check("expanding catch-all reveals the non-exam row", rowTitleCount(wrap, "ZZZ CompTIA A Plus") === 1);
  } else {
    check("(catch-all toggle found)", false);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
