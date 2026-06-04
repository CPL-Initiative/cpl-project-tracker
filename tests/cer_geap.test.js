// Regression tests for the CER system-level GE-Area AP-credit callout
// (2026-06-04). AP credit is set statewide (AB 1985 / AA 17-20): each AP
// credential is joined to its CCC GE AP List entry (GE Area + min units) and
// the expanded row headlines it. Guards:
//   - a GE-Area exam renders the callout with "Area or Area · N semester units"
//   - an N/A exam renders the "No GE Area assigned … elective" variant
//   - a non-AP credential (no r.ge_ap) renders NO callout
//
// Run from repo root: `npm test` (or `node tests/cer_geap.test.js`).
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

const geRow = {
  ut: "AP European History", raw_count: 2, audit_tags: {}, audit_tag_total: 0,
  ge_ap: { exam: "European History", areas: ["Social/Behavioral Sciences", "Humanities"], units: 3, na: false },
  articulations: [{ cid: "HIST 170", sys: "C-ID", title: "Western Civ I",
    local: [{ subj: "HIST", num: "170", t: "Western Civ I", colleges: ["Glendale Community College"] }] }],
};
const naRow = {
  ut: "AP Computer Science A", raw_count: 1, audit_tags: {}, audit_tag_total: 0,
  ge_ap: { exam: "Computer Science A", areas: [], units: 3, na: true }, articulations: [],
};
const plainRow = { ut: "ZZZ Not An AP Credential", raw_count: 1, audit_tags: {}, audit_tag_total: 0, articulations: [] };
const fixtureRows = [geRow, naRow, plainRow];

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

function expandBody(wrap, needle) {
  const tog = Array.from(wrap.querySelectorAll(".cr-title-toggle"))
    .find((b) => txt(b).indexOf(needle) >= 0);
  if (!tog) return null;
  tog.click();
  const trRow = Array.from(wrap.querySelectorAll("tr.cr-row"))
    .find((tr) => txt(tr).indexOf(needle) >= 0);
  const sib = trRow && trRow.nextElementSibling;
  return (sib && sib.classList && sib.classList.contains("cr-expanded"))
    ? sib.querySelector(".cr-expanded-body") : null;
}

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");
  check("table rendered", !!wrap.querySelector("table.cr-table"));

  const geBody = expandBody(wrap, "AP European History");
  check("GE-Area row expanded", !!geBody);
  if (geBody) {
    const box = geBody.querySelector(".cr-geap");
    check("GE callout present", !!box);
    const t = txt(box);
    check("callout names both GE Areas joined by 'or'", /Social\/Behavioral Sciences or Humanities/.test(t));
    check("callout states '3 semester units'", /3 semester units/.test(t));
    check("callout cites the system-level policy (AA 17-20)", /AA 17-20/.test(t));
  }

  const naBody = expandBody(wrap, "AP Computer Science A");
  check("N/A row expanded", !!naBody);
  if (naBody) {
    const box = naBody.querySelector(".cr-geap");
    check("N/A callout present", !!box);
    const t = txt(box);
    check("N/A callout says 'No GE Area assigned (N/A)'", /No GE Area assigned \(N\/A\)/.test(t));
    check("N/A callout offers elective units", /3 elective units/.test(t));
  }

  const plainBody = expandBody(wrap, "ZZZ Not An AP Credential");
  check("non-AP row expanded", !!plainBody);
  if (plainBody) {
    check("non-AP credential renders NO GE callout", !plainBody.querySelector(".cr-geap"));
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
