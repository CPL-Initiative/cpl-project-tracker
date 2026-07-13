// Common SUBJ column: blank ("—") for rows with NO discipline (Sam, S113).
// Common SUBJ is a FUNCTION of discipline — a row with no discipline has no
// canonical common subject, so the column must NOT fall back to the provisional
// local-derived SUBJ code (which implied a canonical assignment that doesn't
// exist). Regression: blank-discipline Z-scheme rows (e.g. "HVAC Z1003") were
// showing their comma-joined local codes there.
//
// Run from repo root: `npm test` (or `node tests/uc_common_subj_blank.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const mkRow = (id, title, disc, subj, idSys) => ({
  kind: idSys === "Unified" ? "Unified" : "Course", id: id, title: title,
  id_system: idSys, disc: disc, credit: "Credit", units: 3, top: null,
  subj: subj, members: 2, adopted: [], potential: [], conf: 0.8,
  flags: {}, locked: false,
});
const rows = [
  mkRow("SPAN M1001", "Spanish 1", "Spanish", ["SPAN"], "M-ID"),          // disciplined → shows a SUBJ
  mkRow("HVAC Z1003", "Related Math, Drawing & Rigging", "", ["DIESLTK", "PLMBNG"], "Unified"), // blank → "—"
  mkRow("ART M1117", "Ceramic Sculpture", null, ["ARCE"], "M-ID"),        // null discipline → "—"
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>window.CPL_UNIFIED_COURSES = ${JSON.stringify({
  rows: rows, colleges: ["College A"], mq_disciplines: ["Spanish", "Art"], topmap: {},
})};</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = (u) => Promise.resolve({ ok: true, status: 200,
  json: () => Promise.resolve(String(u).indexOf("row_audit") >= 0 ? { rows: [] } : []) });

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

setTimeout(runAssertions, 100);

// The Common SUBJ cell is the <td> whose title starts with "Local SUBJ code(s):".
function commonSubjCell(tr) {
  return Array.from(tr.querySelectorAll("td"))
    .find((td) => (td.getAttribute("title") || "").indexOf("Local SUBJ code(s):") === 0);
}
function rowFor(wrap, id) {
  // The ID cell renders with an ⓘ info icon prefix ("ⓘ HVAC Z1003"), so match
  // on substring, not equality.
  return Array.from(wrap.querySelectorAll("tbody tr"))
    .find((tr) => Array.from(tr.querySelectorAll("td")).some((td) => txt(td).indexOf(id) >= 0));
}

function runAssertions() {
  const wrap = window.document.getElementById("uc-table-wrap");

  const rDisc = rowFor(wrap, "SPAN M1001");
  const cDisc = rDisc && commonSubjCell(rDisc);
  check("disciplined row: Common SUBJ cell found", !!cDisc);
  check("disciplined row: Common SUBJ is NOT blank (shows a subject)", cDisc && txt(cDisc) !== "—" && txt(cDisc).length > 0);

  const rBlank = rowFor(wrap, "HVAC Z1003");
  const cBlank = rBlank && commonSubjCell(rBlank);
  check("blank-discipline (Unified) row: Common SUBJ cell found", !!cBlank);
  check("blank-discipline row: Common SUBJ renders '—' (not the local codes)",
    cBlank && txt(cBlank) === "—");
  check("blank-discipline row: local codes NOT leaked into the cell",
    cBlank && txt(cBlank).indexOf("DIESLTK") < 0 && txt(cBlank).indexOf("PLMBNG") < 0);
  check("blank-discipline row: hover explains the blank + shows provisional prefix",
    cBlank && /No discipline yet/.test(cBlank.getAttribute("title") || ""));

  const rNull = rowFor(wrap, "ART M1117");
  const cNull = rNull && commonSubjCell(rNull);
  check("null-discipline row: Common SUBJ renders '—'", cNull && txt(cNull) === "—");

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
}
