// Guards the UC-CUR → Z-scheme consumer recognition (2026-06-15 re-mint).
// applyMergeLocal infers a merge target's kind/id_system from its id shape. A
// synthetic Unified target now arrives as `SUBJ Z<band><seq>` (the re-minted
// form) instead of `UC-CUR-*`. Before the fix, a Z id fell through the C-ID/CCN/
// M-ID branches to the `else` and was mis-classified as **C-ID** (and then
// title-firewalled as an official anchor — uncuratable). This test replays a
// live merge into a Z target NOT present in the payload and asserts it renders
// as a curatable Unified row, using the Subject cell as the discriminator:
//   - id_system "Unified"  → subj4Of returns the MEMBER subjects ("ZOOL")
//   - id_system "C-ID" (bug) → subj4Of returns the id PREFIX ("BIOL")
// A C-ID control target (ENGL 110) confirms the Z regex doesn't over-match.
//
// Run from repo root: `npm test` (or `node tests/uc_zscheme_recognition.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, subj, extra) => Object.assign({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "", credit: "Credit", units: 3.0, top: "0401.00",
  subj: subj, members: 2, adopted: [], potential: [], conf: 0.7,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false,
}, extra || {});

const rows = [
  // ZB — live merge member, distinctive subject ZOOL, folds into a Z target.
  mkRow("ZOOL M1002", "Marine Biology", ["ZOOL"], { st: 700, eu: 1500 }),
  // EC — live merge member, folds into a C-ID control target.
  mkRow("ENGW M1004", "College Writing", ["ENGW"]),
  // a plain row so the table has something native too.
  mkRow("HIST M1001", "World History", ["HIST"]),
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({
    rows: rows, colleges: ["A"], mq_disciplines: ["Biology", "English"], topmap: {},
    committed_curation: {},
  })};
</script>
</body></html>`;

// Live overlay: ZOOL M1002 → "BIOL Z9001" (synthetic Z target, not in payload);
// ENGW M1004 → "ENGL 110" (official C-ID control). Both targets are synthesized
// by applyMergeLocal from the id shape.
const OVERLAY = [
  { course_id: "ZOOL M1002", field: "merge_into", value: "BIOL Z9001",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-15T01:00:00Z" },
  { course_id: "BIOL Z9001", field: "unified_title", value: "Marine Biology (Unified)",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-15T01:00:00Z" },
  { course_id: "ENGW M1004", field: "merge_into", value: "ENGL 110",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-15T01:00:00Z" },
];

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = (url, opts) => {
  const u = String(url);
  const method = (opts && opts.method) || "GET";
  const body = u.indexOf("field=in.") >= 0 ? OVERLAY : [];
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve(body) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(150);
  const doc = window.document;
  const rowFor = (id) => Array.from(doc.querySelectorAll("table.uc-table tbody tr"))
    .find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf(id) >= 0);
  const cell = (tr, i) => txt(tr && tr.querySelectorAll("td")[i]);

  // member folds away; Z target is synthesized and renders.
  check("merge member ZOOL M1002 folds away on load", !rowFor("ZOOL M1002"));
  const z = rowFor("BIOL Z9001");
  check("Z merge target renders", !!z);
  // THE failure-mode guard: a Unified row's Subject cell = member subjects;
  // a C-ID misclassification would show the id prefix "BIOL".
  check("Z target is Unified (Subject shows member 'ZOOL', not id-prefix 'BIOL')",
    cell(z, 3) === "ZOOL");
  // Unified targets are NOT title-firewalled → they take the live unified_title.
  check("Z target takes the live unified_title (not firewalled like an official)",
    cell(z, 2) === "Marine Biology (Unified)");

  // C-ID control: a real C-ID target is still treated as official (Subject =
  // id-prefix "ENGL"), proving the Z regex doesn't over-match.
  check("ENGW M1004 folds away on load", !rowFor("ENGW M1004"));
  const cid = rowFor("ENGL 110");
  check("C-ID control target renders", !!cid);
  check("C-ID control stays official (Subject shows id-prefix 'ENGL', not member)",
    cell(cid, 3) === "ENGL");

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
