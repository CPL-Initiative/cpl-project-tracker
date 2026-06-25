// Session 72 (StarLander) follow-up — the "Add more courses" control is now a
// keyword GUIDE + a Tight↔Loose looseness SLIDER (Sam: "the way it adds more is
// what I expected the strength bar to do … consolidate, keyword as guide; rely
// on title and description"). Lives in the shared buildMergeEditor so both the
// per-row ⚇ dock and the worklist groups get it. Guards (per-row dock):
//   1. A title-similar course BELOW the findCandidates base cutoff is NOT shown
//      at the default (Tight) slider.
//   2. Dragging toward Loose SURFACES it as an UNCHECKED candidate (ranked by
//      title similarity); tightening back removes the unchecked surfaced row.
//   3. The keyword box surfaces a specific course regardless of similarity, and
//      a ticked surfaced row persists when the slider/keyword change.
//
// Run from repo root: `npm test` (or `node tests/uc_candidate_looseness.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: "Welding",
  credit: "Credit", units: 3, top: "0956.00", subj: ["WELD"], members: 2,
  adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
// Seed tokens ≈ {welding, technology}. "Welding Technology" = exact (in the
// findCandidates base ≥0.5). "Pipe Welding Inspection" ≈ {pipe,welding,inspection}
// → Jaccard 0.25 (NOT in base; surfaces only when loosened).
const rows = [
  mkRow("WELD M1001", "Introduction to Welding Technology"),
  mkRow("WELD M1002", "Welding Technology"),
  mkRow("WELD M1050", "Pipe Welding Inspection"),
  mkRow("AUTO M1009", "Automotive Brakes"),   // unrelated — should never surface
];
const idx = [
  ["WELD M1001", "Introduction to Welding Technology", "WELD", "M-ID", 3],
  ["WELD M1002", "Welding Technology", "WELD", "M-ID", 3],
  ["WELD M1050", "Pipe Welding Inspection", "WELD", "M-ID", 3],
  ["AUTO M1009", "Automotive Brakes", "AUTO", "M-ID", 3],
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Welding"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify(idx)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => {
  const u = String(url), method = (opts && opts.method) || "GET";
  let body = []; if (u.indexOf("allowed_reviewers") >= 0) body = [{ email: "test@rccd.edu" }];
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve(body) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  const rowFor = (id) => Array.from(doc.querySelectorAll("table.uc-table tbody tr"))
    .find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf(id) >= 0);
  function candRow(id) {
    return Array.from(doc.querySelectorAll("div"))
      .find((d) => d.querySelector(":scope > input.uc-cand-cb") && d.textContent.indexOf(id) >= 0);
  }
  function candCb(id) { const r = candRow(id); return r && r.querySelector(":scope > input.uc-cand-cb"); }

  rowFor("WELD M1001").querySelector("a.uc-merge-link").dispatchEvent(new window.Event("click"));
  await sleep(300);
  const dock = doc.querySelector(".uc-worklist-dock");
  const slider = dock.querySelector('input[type="range"]');
  const kw = Array.from(dock.querySelectorAll('input[type=search]')).find((i) => /keyword to guide/i.test(i.placeholder || ""));
  check("looseness slider present", !!slider);
  check("keyword guide box present", !!kw);

  // ── 1. default (Tight): the loose 0.25 match is NOT surfaced ──
  check("exact 'Welding Technology' IS in the base candidate list", !!candRow("WELD M1002"));
  check("loose 'Pipe Welding Inspection' NOT shown at the default Tight slider", !candRow("WELD M1050"));

  // ── 2. drag toward Loose → it surfaces as an UNCHECKED candidate ──
  slider.value = "100"; slider.dispatchEvent(new window.Event("input"));
  await sleep(350);
  check("loosening surfaces 'Pipe Welding Inspection'", !!candRow("WELD M1050"));
  check("the surfaced candidate starts UNCHECKED", candCb("WELD M1050") && candCb("WELD M1050").checked === false);
  check("the surfaced row carries the ➕ added chip", candRow("WELD M1050") && /➕ added/.test(txt(candRow("WELD M1050"))));
  check("the unrelated 'Automotive Brakes' never surfaces (no title overlap)", !candRow("AUTO M1009"));

  // Tick it, then tighten back → the ticked row persists (it's a real selection).
  candCb("WELD M1050").checked = true; candCb("WELD M1050").dispatchEvent(new window.Event("change"));
  slider.value = "0"; slider.dispatchEvent(new window.Event("input"));
  await sleep(300);
  check("a ticked surfaced row persists after tightening", candCb("WELD M1050") && candCb("WELD M1050").checked === true);

  // Untick → next tighten removes it.
  candCb("WELD M1050").checked = false; candCb("WELD M1050").dispatchEvent(new window.Event("change"));
  slider.value = "0"; slider.dispatchEvent(new window.Event("input"));
  await sleep(300);
  check("an unchecked surfaced row clears when tightened", !candRow("WELD M1050"));

  // ── 3. keyword guide surfaces a specific course regardless of slider ──
  kw.value = "pipe"; kw.dispatchEvent(new window.Event("input"));
  await sleep(350);
  check("keyword 'pipe' surfaces 'Pipe Welding Inspection' even at Tight", !!candRow("WELD M1050"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
