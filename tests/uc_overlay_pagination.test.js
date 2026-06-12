// Guards the live-overlay pagination (2026-06-12): PostgREST caps one
// response at 1,000 rows (db-max-rows). Auto-merge pass 1 pushed
// kb_curation past that, and the unpaginated fetchOverlay silently
// truncated the live overlay to an arbitrary first-1,000 subset — merges
// beyond the cap never replayed. fetchAllRows must:
//   1. request pages with Range headers (0-999, then 1000-…),
//   2. keep fetching until a short page,
//   3. apply rows from the SECOND page (a merge_into beyond the cap folds
//      its member at startup).
//
// Run from repo root: `npm test` (or `node tests/uc_overlay_pagination.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Art", credit: "Credit", units: 3.0, top: "1002.00", subj: ["ART"],
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [mkRow("ARTS M1001", "Ceramics"), mkRow("ARTS M1002", "Ceramics I")];

// Page 1 = exactly 1,000 filler discipline rows (forces a second request);
// page 2 = a short page whose merge_into MUST replay (the pre-fix bug:
// this row was silently dropped).
const page1 = [];
for (let i = 0; i < 1000; i++) {
  page1.push({ course_id: "FILL M" + String(1000 + i), field: "discipline",
               value: "Art", reviewer_email: "automerge-v1@bot", reviewed_at: "2026-06-12" });
}
const page2 = [{ course_id: "ARTS M1002", field: "merge_into", value: "ARTS M1001",
                 reviewer_email: "automerge-v1@bot", reviewed_at: "2026-06-12" }];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Art"], topmap: {} })};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
const overlayRanges = [];
window.fetch = (url, opts) => {
  const u = String(url);
  const range = opts && opts.headers && (opts.headers.Range || opts.headers.range);
  if (u.indexOf("field=in.") >= 0) {            // the overlay query
    overlayRanges.push(range || "(none)");
    const body = (range || "").indexOf("0-") === 0 ? page1
               : (range || "").indexOf("1000-") === 0 ? page2 : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  }
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(250);
  const doc = window.document;
  check("overlay fetched with Range pagination (page 1 = 0-999)",
    overlayRanges[0] === "0-999");
  check("a second page was requested after a full page (1000-1999)",
    overlayRanges[1] === "1000-1999");
  check("no third page after the short page", overlayRanges.length === 2);
  const wrap = doc.getElementById("uc-table-wrap");
  const ids = Array.from(wrap.querySelectorAll("table.uc-table tbody tr"))
    .map((tr) => txt(tr.querySelectorAll("td")[1]).replace(/^ⓘ\s*/, ""));
  check("the SECOND-page merge replayed (member folded out of the table)",
    ids.indexOf("ARTS M1002") < 0);
  check("the merge target still renders", ids.indexOf("ARTS M1001") >= 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
