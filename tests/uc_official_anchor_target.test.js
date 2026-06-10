// Regression tests for OFFICIAL-ID merge targets (2026-06-10, Sam):
// "We only mint an M-ID when there is no aligned C-ID or CCN. When there is,
//  we rely on the C-ID/CCN as the common course reference."
//   1. A locked C-ID anchor row renders an ENABLED ⚇ Merge pill (signed in) —
//      merging variants INTO the official id is the whole point.
//   2. The dialog's "Merge into" DEFAULTS to the official id when one is among
//      the chosen (CCN > C-ID > M-ID precedence), even over the seed row.
//   3. Confirming writes ONLY merge_into pointers — no unified_title /
//      discipline curation on the authoritative anchor target.
//   4. (Layout) flags chips live in the width-capped .uc-flags-wrap block.
//
// Run from repo root: `npm test` (or `node tests/uc_official_anchor_target.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "SPAN 100", title: "Elementary Spanish I", id_system: "C-ID",
    disc: "Foreign Languages", credit: "Credit", units: 5.0, top: null, subj: ["SPAN"],
    members: 3, adopted: [], potential: [], conf: 0.9, locked: true,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false, reviewed: true } },
  { kind: "Course", id: "FLSP M1272", title: "Elementary Spanish I", id_system: "M-ID",
    disc: "Foreign Languages", credit: "Credit", units: 5.0, top: "1105.00", subj: ["SPAN"],
    members: 59, adopted: [], potential: [], conf: 0.72, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "FLSP M1019", title: "Spanish 1", id_system: "M-ID",
    disc: "Foreign Languages", credit: "Credit", units: 5.0, top: "1105.00", subj: ["SPAN"],
    members: 6, adopted: [], potential: [], conf: 0.85, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Foreign Languages"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify([
    ["SPAN 100", "Elementary Spanish I", "SPAN", "C-ID", 5.0],
    ["FLSP M1272", "Elementary Spanish I", "SPAN", "M-ID", 5.0],
    ["FLSP M1019", "Spanish 1", "SPAN", "M-ID", 5.0],
  ])};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const calls = [];
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  calls.push({ url: String(url), method: method, body: opts && opts.body ? JSON.parse(opts.body) : null });
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve([]) });
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

  // 4. flags chips inside the width-capped wrap
  const anyRow = rowFor("FLSP M1272");
  check("flags chips live in the .uc-flags-wrap inner block",
    !!(anyRow && anyRow.querySelector("td.uc-flags-cell .uc-flags-wrap")));

  // 1. the locked C-ID anchor renders an ENABLED merge pill
  const anchorRow = rowFor("SPAN 100");
  check("locked C-ID anchor renders an ENABLED ⚇ Merge link",
    !!(anchorRow && anchorRow.querySelector("a.uc-merge-link")));

  // 2. open the merge from the M-ID seed; the anchor (exact-title match) is
  // pre-checked and the TARGET defaults to the official id, not the seed.
  rowFor("FLSP M1272").querySelector("a.uc-merge-link").dispatchEvent(new window.Event("click"));
  await sleep(300);
  const identSel = Array.from(doc.querySelectorAll("select")).find((s) =>
    Array.from(s.options).some((o) => /Mint a NEW unified course/.test(o.textContent)));
  check("dialog renders the Merge-into selector", !!identSel);
  check("target DEFAULTS to the official C-ID (SPAN 100), beating the M-ID seed",
    identSel && identSel.value === "SPAN 100");
  const goBtn = Array.from(doc.querySelectorAll("button")).find((b) => /Merge \d+ course/.test(txt(b)));
  check("confirm button names the official target", goBtn && /into SPAN 100$/.test(txt(goBtn)));

  // 3. confirm writes ONLY merge_into pointers (anchor stays authoritative)
  goBtn.dispatchEvent(new window.Event("click"));
  await sleep(150);
  const post = calls.find((c) => c.method === "POST" && c.url.indexOf("kb_curation") >= 0 && Array.isArray(c.body));
  check("consolidation saved", !!post);
  check("M-ID member got merge_into -> SPAN 100",
    post && post.body.some((i) => i.field === "merge_into" && i.value === "SPAN 100" && i.course_id === "FLSP M1272"));
  check("NO unified_title written on the official target",
    post && !post.body.some((i) => i.field === "unified_title"));
  check("NO discipline written on the official target",
    post && !post.body.some((i) => i.field === "discipline"));
  const tgtRow = rowFor("SPAN 100");
  check("anchor keeps its own authoritative title", tgtRow && tgtRow.textContent.indexOf("Elementary Spanish I") >= 0);
  check("merged member row folded away", !rowFor("FLSP M1272"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
