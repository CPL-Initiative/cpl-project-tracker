// Regression tests for the CER GE-Area coherence check (item #3, 2026-06-04).
// Flags an articulated local course whose DISCIPLINE sits in a GE division
// disjoint from the credit the exam grants (e.g. a Sociology course under AP
// Statistics, which grants Language & Rationality). Guards:
//   - an off-division identity gets a "⚠ off GE Area" badge + the callout note
//   - a coherent identity does NOT
//   - an UNKNOWN discipline does NOT (no false positives)
//   - an N/A exam (no GE Area) does NOT flag even an off-division discipline
//   - a non-exam credential (no ge_credit) does NOT flag
//
// Run from repo root: `npm test` (or `node tests/cer_ge_coherence.test.js`).
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

const LC = [{ subj: "X", num: "1", t: "course", colleges: ["Glendale Community College"] }];
const ident = (cid, disc) => ({ cid: cid, sys: "M-ID", title: "t", disc: disc, local: LC });
const base = (ut, ge, arts) => ({ ut: ut, raw_count: 1, audit_tags: {}, audit_tag_total: 0, ge_credit: ge, articulations: arts });

const statRow = base("AP Statistics",
  { program: "AP", exam: "Statistics", areas: ["Language and Rationality"], units: 3, na: false },
  [ident("MATH M1001", "Mathematics"),       // coherent (L&R) → no badge
   ident("SOCI M1083", "Sociology"),          // off (SBS) → badge
   ident("FOO M1001", "Unknownology")]);       // unknown discipline → no badge
const naRow = base("AP Seminar",
  { program: "AP", exam: "Seminar", areas: [], units: 0, na: true },
  [ident("SOCI M2", "Sociology")]);            // N/A exam → no flag even though Sociology
const plainRow = { ut: "ZZZ Not An Exam", raw_count: 1, audit_tags: {}, audit_tag_total: 0,
  articulations: [ident("SOCI M3", "Sociology")] };  // no ge_credit → no flag

const fixtureRows = [statRow, naRow, plainRow];
const DISC_GE = {
  "Mathematics": ["Language and Rationality"],
  "Sociology": ["Social/Behavioral Sciences"],
  "Communication Studies": ["Language and Rationality"],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-credential-reference">
  <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
</div>
<script>window.CPL_CREDENTIAL_REFERENCE = ${JSON.stringify({
  _generated_at: payload._generated_at, top_categories: payload.top_categories,
  disc_ge_areas: DISC_GE, unified_titles: fixtureRows,
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
  const tog = Array.from(wrap.querySelectorAll(".cr-title-toggle")).find((b) => txt(b).indexOf(needle) >= 0);
  if (!tog) return null;
  tog.click();
  const trRow = Array.from(wrap.querySelectorAll("tr.cr-row")).find((tr) => txt(tr).indexOf(needle) >= 0);
  const sib = trRow && trRow.nextElementSibling;
  return (sib && sib.classList && sib.classList.contains("cr-expanded")) ? sib.querySelector(".cr-expanded-body") : null;
}
function artRow(body, cid) {
  return Array.from(body.querySelectorAll(".cr-arts-table tr.cr-art-row")).find((tr) => txt(tr).indexOf(cid) >= 0);
}

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");

  const body = expandBody(wrap, "AP Statistics");
  check("AP Statistics expanded", !!body);
  if (body) {
    check("off-division identity (Sociology) gets the badge",
      !!artRow(body, "SOCI M1083") && !!artRow(body, "SOCI M1083").querySelector(".cr-ge-off"));
    check("coherent identity (Mathematics→L&R) has NO badge",
      !!artRow(body, "MATH M1001") && !artRow(body, "MATH M1001").querySelector(".cr-ge-off"));
    check("unknown discipline has NO badge (no false positive)",
      !!artRow(body, "FOO M1001") && !artRow(body, "FOO M1001").querySelector(".cr-ge-off"));
    check("exactly one off-GE badge in the table", body.querySelectorAll(".cr-ge-off").length === 1);
    var note = body.querySelector(".cr-geap-off");
    check("callout off-note present + counts 1", !!note && /1 articulated course /.test(txt(note)));
  }

  const naBody = expandBody(wrap, "AP Seminar");
  check("N/A exam: no off-GE badge (no GE Area to be off of)",
    !!naBody && naBody.querySelectorAll(".cr-ge-off").length === 0);

  const plainBody = expandBody(wrap, "ZZZ Not An Exam");
  check("non-exam credential: no off-GE badge", !!plainBody && plainBody.querySelectorAll(".cr-ge-off").length === 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
