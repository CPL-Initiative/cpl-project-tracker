// Guards the CCR fixed-table-layout defense (Session 43 — the AoJ "blank
// columns" report). Under auto table layout, one wide cell inflates its
// column and silently parks the trailing columns past the right edge of the
// scroll wrap — the h-scrollbar sits at the BOTTOM of the 70vh wrap, so the
// columns simply look GONE, and the effect varies with the filtered row set
// (per-discipline). The defense: table-layout:fixed + an explicit colgroup,
// with min-width:900px keeping the wrap's overflow-x:auto as the
// narrow-screen safety net.
//
//  1. The injected #uc-fix-css carries table-layout:fixed + min-width:900px
//     and clips td overflow.
//  2. The main table renders a colgroup with one <col> per column, each with
//     an explicit width.
//  3. The member table (row expand) renders its own 5-col colgroup.
//
// Run from repo root: `npm test` (or `node tests/uc_fixed_layout.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = fs.readFileSync("unified_courses.js", "utf8");

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({
    generated_at: "2026-06-11 15:00",
    rows: [{
      kind: "Course", id: "AJ 110", title: "Introduction to Criminal Justice",
      id_system: "C-ID", disc: "Administration of Justice", credit: "Credit",
      units: 3.0, top: "2105.00", subj: ["AJ"], members: 2, adopted: [],
      potential: [], conf: null, locked: false,
      flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
    }],
    colleges: ["A"], mq_disciplines: ["Administration of Justice"], topmap: {},
  })};
  window.CPL_UC_MEMBERS = ${JSON.stringify({
    generated_at: "2026-06-11 15:02", colleges: ["Allan Hancock College"],
    members: { "AJ 110": [
      { c: 0, n: "AJ 101", t: "Introduction to Criminal Justice", u: 3.0, p: "2105.00" },
      { c: 0, n: "CJ 1", t: "Intro to CJ", u: 3.0, p: "2105.00" },
    ] },
    topmap: {},
  })};
</script>
</body></html>`;

(async function main() {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  dom.window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  dom.window.eval(src);
  await sleep(150);
  const d = dom.window.document;

  // 1. injected CSS carries the fixed-layout defense
  const css = (d.getElementById("uc-fix-css") || {}).textContent || "";
  check("#uc-fix-css locks table-layout:fixed on the main table",
    /table\.uc-table\{[^}]*table-layout:fixed/.test(css));
  check("#uc-fix-css keeps the narrow-screen safety net (min-width:900px)",
    /table\.uc-table\{[^}]*min-width:900px/.test(css));
  check("#uc-fix-css clips td overflow (no column inflation)",
    /\.uc-table td\{overflow:hidden;\}/.test(css));
  check("#uc-fix-css fixes the member-table layout too",
    /\.uc-member-table\{table-layout:fixed;\}/.test(css));

  // 2. main table colgroup — one col per column, each with a width
  const ths = d.querySelectorAll(".uc-table thead th");
  const cols = d.querySelectorAll(".uc-table colgroup col");
  check("main table renders a colgroup", cols.length > 0);
  check("colgroup has one <col> per header (" + ths.length + ")", cols.length === ths.length);
  check("every <col> carries an explicit width",
    Array.from(cols).every((c) => /width:\s*[\d.]+%/.test(c.getAttribute("style") || "")));

  // 3. member table colgroup on expand
  d.querySelector("a.uc-caret").click();
  await sleep(150);
  const mcols = d.querySelectorAll(".uc-member-table colgroup col");
  const mths = d.querySelectorAll(".uc-member-table thead th");
  check("member table renders a 5-col colgroup matching its headers",
    mcols.length === 5 && mths.length === 5);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
