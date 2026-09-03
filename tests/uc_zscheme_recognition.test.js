// Guards applyMergeLocal's id-shape recognition of a merge target that is NOT
// in the payload. Since the Z band retired (2026-09-03, items 20-21 of Sam's
// rulings) every machine cluster is a real M-ID record, so a row-less
// `SUBJ M####` target is an M-ID Course: curatable (it takes the live
// unified_title) and never title-firewalled like an official anchor, never a
// "Unified" row (that shape is the transient `UC-CUR-*` client mint only).
// Before the 2026-06-15 fix a synthetic target fell through to the `else` and
// was mis-classified as **C-ID** (title-firewalled, uncuratable); this replays a
// live merge into a row-less M target and asserts the Course / M-ID branch.
// The discriminator is the KIND cell (which reflects the id_system):
//   - id_system "M-ID"      → Kind cell shows "Course", title curatable
//   - id_system "Unified"   → Kind cell shows "Unified" (wrong for an M shape)
// (The Subject/Common-SUBJ cell renders "—" for a blank-discipline target —
// Common SUBJ is a FUNCTION of discipline, S113 — so it does not discriminate.)
// A C-ID control target (ENGL 110) confirms the M regex doesn't over-match.
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
  // ZB — live merge member, distinctive subject ZOOL, folds into a row-less M-ID target.
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

// Live overlay: ZOOL M1002 → "BIOL M1009" (a row-less M-ID target, not in the
// payload); ENGW M1004 → "ENGL 110" (official C-ID control). Both targets are
// synthesized by applyMergeLocal from the id shape.
const OVERLAY = [
  { course_id: "ZOOL M1002", field: "merge_into", value: "BIOL M1009",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-15T01:00:00Z" },
  { course_id: "BIOL M1009", field: "unified_title", value: "Marine Biology (Unified)",
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

  // member folds away; the row-less M-ID target is synthesized and renders.
  check("merge member ZOOL M1002 folds away on load", !rowFor("ZOOL M1002"));
  const z = rowFor("BIOL M1009");
  check("row-less M-ID merge target renders", !!z);
  // THE failure-mode guard: a correctly-recognized M target's Kind cell reads
  // "Course" (id_system M-ID); a "Unified" reading would mean the retired Z
  // branch is back. (Its Common SUBJ is "—" — blank-discipline target — so we
  // key on Kind, not Subject.)
  check("row-less M-ID target is classified Course / M-ID (Kind cell 'Course', not 'Unified')",
    cell(z, 0).indexOf("Course") >= 0 && cell(z, 0).indexOf("Unified") < 0);
  check("M-ID target's Common SUBJ is blank (no discipline → no canonical subject)",
    cell(z, 3) === "—");
  // M-ID targets are NOT title-firewalled → they take the live unified_title.
  check("M-ID target takes the live unified_title (not firewalled like an official)",
    cell(z, 2) === "Marine Biology (Unified)");

  // C-ID control: a real C-ID target is still treated as official (Subject =
  // id-prefix "ENGL"), proving the M regex doesn't over-match.
  check("ENGW M1004 folds away on load", !rowFor("ENGW M1004"));
  const cid = rowFor("ENGL 110");
  check("C-ID control target renders", !!cid);
  check("C-ID control stays official (Kind 'Course', not over-matched to 'Unified')",
    cell(cid, 0).indexOf("Unified") < 0 && cell(cid, 0).indexOf("Course") >= 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
