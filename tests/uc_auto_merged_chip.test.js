// Regression test for the ⚙ auto-merged second-look chip + the "Auto-merged"
// Triage lane in the CCR (Session 54).
//
// Auto-merge pass 1 (Session 53) folded 2,272 worklist groups via the gated
// bot (reviewed_by == "automerge-v1@bot"). The generator stamps each surviving
// merge target with `auto_n` (how many folded members came from the bot). The
// consumer (unified_courses.js) must:
//   1. render a ⚙ auto-merged chip on rows with auto_n > 0 (and ONLY those),
//      with a tooltip naming the cohort marker + saying it's reversible;
//   2. expose an "Auto-merged (pass 1, second look)" Triage option that scopes
//      the whole cohort in ONE click — a ROW-LEVEL filter (r.auto_n > 0), so it
//      works WITHOUT signing in and WITHOUT the audit overlay loaded.
//
// Guards the failure mode: a non-auto row must NOT get the chip, and the lane
// must not silently match everything (or nothing) when the audit index is absent.
//
// Run from repo root: `npm test` (or `node tests/uc_auto_merged_chip.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, extra) => Object.assign({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Welding", credit: "Credit", units: 3.0, top: "0956.00",
  subj: ["WELD"], members: 2, adopted: [], potential: [], conf: 0.7,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false,
}, extra || {});

// Three rows: an anchored auto-merge target (auto_n=2), a singleton-mint
// auto-merge target (UC-CUR-AUTO*, auto_n=3, Unified), and a plain row that
// the bot never touched (no auto_n).
const rows = [
  mkRow("WELD M1046", "Intermediate Gas Tungsten Arc Welding (GTAW)", { auto_n: 2 }),
  mkRow("UC-CUR-AUTO043A2728", "Fundamentals of Gas Tungsten Arc Welding",
        { kind: "Unified", id_system: "Unified", auto_n: 3 }),
  mkRow("MATH M1002", "College Algebra", { disc: "Mathematics", subj: ["MATH"], top: "1701.00" }),
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Welding", "Mathematics"], topmap: {} })};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;

// Public viewer (NOT signed in) — the chip + the Triage lane are public.
// Stub fetch so the audit/college-short-name loaders no-op gracefully.
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve(""),
    json: () => Promise.resolve(method === "GET" ? [] : {}) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(150);
  const doc = window.document;
  const allRows = () => Array.from(doc.querySelectorAll("table.uc-table tbody tr"));
  const rowFor = (id) => allRows().find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf(id) >= 0);
  const chipIn = (tr) => tr && txt(tr).indexOf("⚙ auto-merged") >= 0;

  // ── 1. chip presence/absence ─────────────────────────────────────────────
  const anchored = rowFor("WELD M1046");
  const mint = rowFor("UC-CUR-AUTO043A2728");
  const plain = rowFor("MATH M1002");
  check("anchored auto-merge target (auto_n=2) renders the ⚙ auto-merged chip", chipIn(anchored));
  check("singleton-mint auto-merge target (auto_n=3) renders the chip", chipIn(mint));
  check("plain row (no auto_n) does NOT render the chip", plain && !chipIn(plain));

  // ── 2. chip tooltip names the cohort + says reversible ───────────────────
  const chipSpan = anchored && Array.from(anchored.querySelectorAll(".uc-badge"))
    .find((s) => txt(s).indexOf("⚙ auto-merged") >= 0);
  check("chip tooltip names the cohort marker (automerge-v1@bot)",
    chipSpan && /automerge-v1@bot/.test(chipSpan.getAttribute("title") || ""));
  check("chip tooltip says the merge can be reverted",
    chipSpan && /revert/i.test(chipSpan.getAttribute("title") || ""));
  check("chip tooltip reflects the member count (2)",
    chipSpan && /\b2 members? (were|was)\b/.test(chipSpan.getAttribute("title") || ""));

  // ── 3. Triage lane ───────────────────────────────────────────────────────
  const triageSel = doc.getElementById("uc-triage");
  const autoOpt = triageSel && Array.from(triageSel.options)
    .find((o) => /Auto-merged \(pass 1, second look\)/.test(o.textContent));
  check("Triage dropdown exposes the Auto-merged lane", !!autoOpt);

  check("before triage: all 3 rows visible", allRows().length === 3);
  triageSel.value = autoOpt.value;
  triageSel.dispatchEvent(new window.Event("change"));
  await sleep(80);
  const filtered = allRows();
  check("Auto-merged triage shows exactly the 2 cohort rows", filtered.length === 2);
  check("Auto-merged triage keeps the anchored target", !!rowFor("WELD M1046"));
  check("Auto-merged triage keeps the mint target", !!rowFor("UC-CUR-AUTO043A2728"));
  check("Auto-merged triage hides the plain (non-cohort) row", !rowFor("MATH M1002"));

  // ── 4. clearing the lane restores all rows (no audit overlay needed) ─────
  triageSel.value = "";
  triageSel.dispatchEvent(new window.Event("change"));
  await sleep(80);
  check("clearing the lane restores all 3 rows", allRows().length === 3);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
