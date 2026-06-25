// Session 72 (StarLander) #3 — the CCR table syncs to the worklist's current
// course: the sidebar group's course (and its subject neighbors) float to the
// TOP of the CCR list (still scrollable to adjacents), with the focused row
// highlighted. A "Sync the CCR list to the current course" toggle (on by default)
// turns it off; closing the worklist clears the focus.
//
// Run from repo root: `npm test` (or `node tests/uc_ccr_sidebar_sync.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, subj) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: "X",
  credit: "Credit", units: 3, top: "1002.00", subj: [subj], members: 2,
  adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
// AUTO sorts before RUSS, so by default the Russian course is NOT at the top.
const rows = [
  mkRow("AUTO M1001", "Brakes", "AUTO"), mkRow("AUTO M1002", "Engines", "AUTO"),
  mkRow("RUSS M5001", "Russian", "RUSS"), mkRow("RUSS M5002", "Russian I", "RUSS"),
];
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [{ sig: "russian", n: 2, score: 0.9, members: [
    { id: "RUSS M5001", t: "Russian", s: "RUSS", u: 3, k: "M-ID", d: "X" },
    { id: "RUSS M5002", t: "Russian I", s: "RUSS", u: 3, k: "M-ID", d: "X" },
  ] }],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["X"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.localStorage.setItem("cplCandLoosen.v1", "0");
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => Promise.resolve({
  ok: true, status: (opts && opts.method && opts.method !== "GET") ? 201 : 200, json: () => Promise.resolve([]),
});
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  function firstDataRow() {
    return Array.from(doc.querySelectorAll("table.uc-table tbody tr"))
      .filter((tr) => !tr.classList.contains("uc-member-row"))[0];
  }

  // Default sort: AUTO before RUSS → the first row is an AUTO course.
  check("by default the first CCR row is an AUTO course", /AUTO M100/.test(txt(firstDataRow())));

  // Open the worklist (lands on the Russian group) → it floats RUSS M5001 to top.
  Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(250);
  check("opening the worklist floats the current course (RUSS M5001) to the CCR top",
    /RUSS M5001/.test(txt(firstDataRow())));
  check("the focused CCR row is highlighted", !!firstDataRow().style.boxShadow);
  check("the focused course's subject neighbor sits just below it",
    /RUSS M5002/.test(txt(Array.from(doc.querySelectorAll("table.uc-table tbody tr"))
      .filter((tr) => !tr.classList.contains("uc-member-row"))[1])));

  // Toggle the sync OFF → the table returns to its own sort (AUTO first).
  const dock = doc.querySelector(".uc-worklist-dock");
  const syncCb = Array.from(dock.querySelectorAll("label"))
    .find((l) => /Sync the CCR list/.test(txt(l))).querySelector('input[type=checkbox]');
  check("sync toggle present (on by default)", syncCb && syncCb.checked === true);
  syncCb.checked = false; syncCb.dispatchEvent(new window.Event("change"));
  await sleep(60);
  check("toggling sync OFF restores the table sort (AUTO first)", /AUTO M100/.test(txt(firstDataRow())));
  syncCb.checked = true; syncCb.dispatchEvent(new window.Event("change"));
  await sleep(60);
  check("toggling sync back ON re-floats RUSS M5001", /RUSS M5001/.test(txt(firstDataRow())));

  // Closing the worklist clears the focus.
  Array.from(dock.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Close")
    .dispatchEvent(new window.Event("click"));
  await sleep(60);
  check("closing the worklist clears the CCR focus (AUTO first again)", /AUTO M100/.test(txt(firstDataRow())));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
