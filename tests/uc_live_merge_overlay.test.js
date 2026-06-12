// Guards the LIVE MERGE-OVERLAY REPLAY (2026-06-12 — Sam's "merges didn't
// save" report): fetchOverlay used to pull field=eq.discipline ONLY, so a
// curator's confirmed merge_into / unified_title rows were never read back —
// after a reload the merged rows reappeared un-merged even though the saves
// were sitting in Supabase. The fix fetches all three fields and replays live
// merges through the shared applyMergeLocal at startup.
//   1. A live merge (B -> T) folds B away on load and T shows the merged
//      state: live unified_title, members count, MAX st/eu carry, mt — and
//      stays Generated (merge ≠ verify, even on replay).
//   2. The pending-sync badge counts the merge edit alongside disc edits.
//   3. A merge already baked into the committed payload (member absent +
//      present in committed_curation) is NOT double-applied.
//   4. The original discipline-overlay behavior is intact for disc rows.
//
// Run from repo root: `npm test` (or `node tests/uc_live_merge_overlay.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, subj, extra) => Object.assign({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "", credit: "Credit", units: 3.0, top: "2205.00",
  subj: subj, members: 2, adopted: [], potential: [], conf: 0.7,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false,
}, extra || {});

const rows = [
  // A — plain row; gets a LIVE discipline overlay row (path 4).
  mkRow("HIST M1001", "World History", ["HIST"]),
  // B — live merge member (folds into T on replay).
  mkRow("HIST M1002", "History of the World", ["HIST"], { st: 500, eu: 1200 }),
  // T — live merge target (gets the live unified_title + the st/eu carry).
  mkRow("HIST M1003", "World History Survey", ["HIST"], { st: 100, eu: 300 }),
  // GEOG M1005 — a COMMITTED merge target the generator already baked
  // (member GEOG M1004 absent from the payload, mt row synthesized).
  mkRow("GEOG M1005", "World Geography", ["GEOG"], { mt: 1, members: 2, title_variants: ["World Geography", "Geography of the World"] }),
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({
    rows: rows, colleges: ["A"], mq_disciplines: ["History"], topmap: {},
    // committed_curation keys = every course_id already folded into git
    // (value = its committed discipline; merge-only members carry null).
    committed_curation: { "GEOG M1004": null },
  })};
</script>
</body></html>`;

// Live Supabase overlay: the combined field=in.(discipline,merge_into,
// unified_title) read. GEOG M1004's merge row is in Supabase too (rows are
// never deleted) — replay must SKIP it (already committed/baked).
const OVERLAY = [
  { course_id: "HIST M1002", field: "merge_into", value: "HIST M1003",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-12T01:00:00Z" },
  { course_id: "HIST M1003", field: "unified_title", value: "World History (Unified)",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-12T01:00:00Z" },
  { course_id: "GEOG M1004", field: "merge_into", value: "GEOG M1005",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-01T01:00:00Z" },
  { course_id: "HIST M1001", field: "discipline", value: "History",
    reviewer_email: "sam@rccd.edu", reviewed_at: "2026-06-12T01:00:00Z" },
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

  // 1. the live merge replays: B folds away, T shows the merged state
  check("live merge member row is folded away on load", !rowFor("HIST M1002"));
  const tgt = rowFor("HIST M1003");
  check("merge target row still renders", !!tgt);
  check("target carries the live unified_title", cell(tgt, 2) === "World History (Unified)");
  check("target members count reflects the merge (member + target = 2)", cell(tgt, 8) === "2");
  check("target carries the member's Students value (MAX carry, 500)", cell(tgt, 12) === "500");
  check("target carries the member's Eligible-units value (MAX carry, 1,200)", cell(tgt, 11).indexOf("1,200") === 0);
  check("replayed merge does NOT auto-verify (merge ≠ verify)", tgt && tgt.textContent.indexOf("✔ Verified") < 0);

  // 2. pending-sync badge counts the merge edit + the disc edit (2 total)
  const sync = doc.getElementById("uc-sync");
  check("pending-sync badge counts the merge + discipline edits (2)",
    /⟳ 2 edits awaiting daily sync/.test(txt(sync)));

  // 3. a COMMITTED merge is not double-applied
  const baked = rowFor("GEOG M1005");
  check("committed merge target still renders", !!baked);
  check("committed merge NOT double-applied (members stays 2, not 3)", cell(baked, 8) === "2");

  // 4. the discipline overlay behavior is intact
  const discRow = rowFor("HIST M1001");
  check("live discipline overlay still applies (disc cell shows History)",
    discRow && cell(discRow, 4).indexOf("History") >= 0);
  check("live-disc row renders Verified (original overlay semantics)",
    discRow && discRow.textContent.indexOf("✔ Verified") >= 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
