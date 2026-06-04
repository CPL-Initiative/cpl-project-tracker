// Regression tests for the CER system-level GE-Area exam-credit callout
// (2026-06-04). AP/IB/CLEP credit is set statewide (AB 1985 / AA 17-20 for AP;
// title 5 §55052.5 for IB/CLEP; charts ESLEI 24-35): each exam credential is
// joined to its GE Area + min units and the expanded row headlines it. Guards:
//   - an AP "X or Y" exam renders the callout with the areas + semester units
//   - areas_all renders "X and Y" (e.g. AP English Literature, 6 units)
//   - IB / CLEP credentials render with the right program label
//   - an N/A exam with units renders the "elective" variant
//   - a non-exam credential (no r.ge_credit) renders NO callout
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

const apRow = {
  ut: "AP European History", raw_count: 2, audit_tags: {}, audit_tag_total: 0,
  ge_credit: { program: "AP", exam: "European History",
    areas: ["Social/Behavioral Sciences", "Arts and Humanities"], units: 3, na: false },
  articulations: [{ cid: "HIST 170", sys: "C-ID", title: "Western Civ I",
    local: [{ subj: "HIST", num: "170", t: "Western Civ I", colleges: ["Glendale Community College"] }] }],
};
const engLitRow = {
  ut: "AP English Literature and Composition", raw_count: 1, audit_tags: {}, audit_tag_total: 0,
  ge_credit: { program: "AP", exam: "English Literature and Composition",
    areas: ["Language and Rationality", "Arts and Humanities"], units: 6, na: false, areas_all: true },
  articulations: [],
};
const ibRow = {
  ut: "IB Biology HL", raw_count: 1, audit_tags: {}, audit_tag_total: 0,
  ge_credit: { program: "IB", exam: "Biology HL", areas: ["Natural Sciences"], units: 3, na: false },
  articulations: [],
};
const clepNaRow = {
  ut: "CLEP College Composition", raw_count: 1, audit_tags: {}, audit_tag_total: 0,
  ge_credit: { program: "CLEP", exam: "College Composition", areas: [], units: 0, na: true },
  articulations: [],
};
// Synthetic — exercises the N/A-with-units "elective" branch of the consumer.
const electiveRow = {
  ut: "ZZZ NA With Elective Units", raw_count: 1, audit_tags: {}, audit_tag_total: 0,
  ge_credit: { program: "AP", exam: "X", areas: [], units: 3, na: true }, articulations: [],
};
const plainRow = { ut: "ZZZ Not An Exam Credential", raw_count: 1, audit_tags: {}, audit_tag_total: 0, articulations: [] };
const fixtureRows = [apRow, engLitRow, ibRow, clepNaRow, electiveRow, plainRow];

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
function geText(wrap, needle) {
  const body = expandBody(wrap, needle);
  return body ? { body: body, box: body.querySelector(".cr-geap"), t: txt(body.querySelector(".cr-geap")) } : null;
}

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");
  check("table rendered", !!wrap.querySelector("table.cr-table"));

  const ap = geText(wrap, "AP European History");
  check("AP callout present", ap && !!ap.box);
  if (ap) {
    check("AP header reads 'Statewide AP credit · CCC GE AP List'", /Statewide AP credit · CCC GE AP List/.test(ap.t));
    check("AP areas joined by 'or'", /Social\/Behavioral Sciences or Arts and Humanities/.test(ap.t));
    check("AP shows '3 semester units'", /3 semester units/.test(ap.t));
    check("AP cites system-level policy", /ESLEI 24-35|AA 17-20|§55052/.test(ap.t));
  }

  const el2 = geText(wrap, "AP English Literature and Composition");
  check("areas_all joins with 'and'", el2 && /Language and Rationality and Arts and Humanities/.test(el2.t));
  check("areas_all shows '6 semester units'", el2 && /6 semester units/.test(el2.t));

  const ib = geText(wrap, "IB Biology HL");
  check("IB header reads 'Statewide IB credit · CCC GE IB List'", ib && /Statewide IB credit · CCC GE IB List/.test(ib.t));
  check("IB shows 'Natural Sciences'", ib && /Natural Sciences/.test(ib.t));

  const clep = geText(wrap, "CLEP College Composition");
  check("CLEP header reads 'Statewide CLEP credit'", clep && /Statewide CLEP credit · CCC GE CLEP List/.test(clep.t));
  check("CLEP N/A shows 'No GE Area assigned (N/A)'", clep && /No GE Area assigned \(N\/A\)/.test(clep.t));

  const elec = geText(wrap, "ZZZ NA With Elective Units");
  check("N/A-with-units shows '3 elective units'", elec && /3 elective units/.test(elec.t));

  const plainBody = expandBody(wrap, "ZZZ Not An Exam Credential");
  check("non-exam credential renders NO GE callout", plainBody && !plainBody.querySelector(".cr-geap"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
