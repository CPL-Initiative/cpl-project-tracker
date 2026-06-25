// Session 72 (StarLander) follow-up — the looseness slider blends CATALOG
// DESCRIPTION similarity (Sam: "rely on title and description if available").
// A course with ZERO title overlap with the seed but a similar DESCRIPTION
// surfaces when the curator loosens deeply (which lazy-loads the detail file);
// it never surfaces on title alone. Guards that the description signal works and
// is gated behind a deep loosen (so the ~34MB detail file isn't fetched eagerly).
//
// Run from repo root: `npm test` (or `node tests/uc_candidate_looseness_desc.test.js`).
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
// "Joining Metals Lab" shares NO title tokens with "Introduction to Welding
// Technology" — but its description does. So it surfaces only via description.
const rows = [
  mkRow("WELD M1001", "Introduction to Welding Technology"),
  mkRow("WELD M1060", "Joining Metals Lab"),
];
const idx = [
  ["WELD M1001", "Introduction to Welding Technology", "WELD", "M-ID", 3],
  ["WELD M1060", "Joining Metals Lab", "WELD", "M-ID", 3],
];
const details = {
  "WELD M1001": { d: "Fundamentals of welding technology and safe shop practices", s: "modal" },
  "WELD M1060": { d: "Oxyacetylene and arc welding technology for fabricating metal joints", s: "modal" },
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Welding"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify(idx)};
  window.CPL_UC_DETAILS = ${JSON.stringify(details)};
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

  rowFor("WELD M1001").querySelector("a.uc-merge-link").dispatchEvent(new window.Event("click"));
  await sleep(300);
  const dock = doc.querySelector(".uc-worklist-dock");
  const slider = dock.querySelector('input[type="range"]');

  // Default Tight + title-only: the title-disjoint course is NOT shown.
  check("'Joining Metals Lab' NOT shown at default (no title overlap)", !candRow("WELD M1060"));

  // Deep loosen → lazy-loads details → description blend surfaces it.
  slider.value = "100"; slider.dispatchEvent(new window.Event("input"));
  await sleep(450);   // debounce + loadDetails + re-surface
  check("deep loosen surfaces the description-similar course", !!candRow("WELD M1060"));
  check("the description-surfaced row is an UNCHECKED candidate",
    candRow("WELD M1060") && candRow("WELD M1060").querySelector(":scope > input.uc-cand-cb").checked === false);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
