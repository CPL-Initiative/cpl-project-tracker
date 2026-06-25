// Guards the Suggested-merges worklist SEARCH (Session 69, Sam's ask #5): a
// search row in the worklist header filters which groups SURFACE by a term that
// matches the proposed title or any member title/id (e.g. "digital imag" jumps
// you there). The per-row Merge chip already covers ad-hoc merging; this is the
// "find it in the worklist" path. It never alters a group's membership.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_search.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "ARTS M1341", title: "Digital Imaging with Drones", id_system: "M-ID",
    disc: "Art", credit: "Credit", units: 3, top: "0699.00", subj: ["ARTS"],
    members: 2, adopted: [], potential: [], conf: 0.8, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
// Two anchored merge groups — one "Digital Imaging", one "Welding".
const sugStub = {
  groups: [
    { sig: "Digital Imaging", n: 2, score: 0.9, members: [
      { id: "ARTS M1341", t: "Digital Imaging with Drones", s: "ARTS", u: 3, k: "M-ID" },
      { id: "ARTS M1345", t: "Digital Imaging 1", s: "ARTS", u: 3, k: "M-ID" },
    ] },
    { sig: "Welding", n: 2, score: 0.9, members: [
      { id: "WELD M1001", t: "Welding Technology 1", s: "WELD", u: 3, k: "M-ID" },
      { id: "WELD M1003", t: "Welding 2", s: "WELD", u: 3, k: "M-ID" },
    ] },
  ],
  family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [], singleton_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Art", "Welding"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => Promise.resolve({
  ok: true, status: (opts && opts.method && opts.method !== "GET") ? 201 : 200,
  json: () => Promise.resolve([]),
});
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

function worklistSearch(doc) {
  return Array.from(doc.querySelectorAll('input[type=search]'))
    .find((i) => /comma separates terms/.test(i.placeholder || ""));
}

(async function main() {
  await sleep(120);
  const doc = window.document;
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(250);

  const search = worklistSearch(doc);
  check("worklist header carries a search row", !!search);
  check("no query: first group (Digital Imaging) shows + '1 of 2' count",
    /Digital Imaging with Drones/.test(doc.body.textContent) && /1 of 2/.test(doc.body.textContent));

  // Search "welding" → only the Welding group surfaces; Digital is filtered out.
  // Scope to the worklist OVERLAY (the main CCR table also lists the Digital row).
  search.value = "welding";
  search.dispatchEvent(new window.Event("input"));
  await sleep(240); // past the 180ms debounce
  const ovText = txt(Array.from(doc.querySelectorAll("div"))
    .find((dv) => /z-index:\s*9999/.test(dv.getAttribute("style") || "")));
  check("searching 'welding' surfaces ONLY the Welding group (in the worklist)",
    /Welding Technology 1/.test(ovText) && !/Digital Imaging with Drones/.test(ovText));
  check("count reflects the filtered set ('1 of 1 matching')",
    /1 of 1 matching/.test(doc.body.textContent));

  // Search a non-matching term → no-match message + a Clear-filter button.
  search.value = "zzznomatchxyz";
  search.dispatchEvent(new window.Event("input"));
  await sleep(240);
  check("a non-matching term shows the no-match message",
    /No suggested merges match/.test(doc.body.textContent));
  const clearBtn = Array.from(doc.querySelectorAll("button")).find((b) => /Clear filter/.test(txt(b)));
  check("a 'Clear filter' button is offered", !!clearBtn);

  // Clear → the worklist returns to the full set.
  clearBtn.dispatchEvent(new window.Event("click"));
  await sleep(60);
  check("clearing the filter restores the worklist (a group form returns)",
    /Proposed unified title/.test(doc.body.textContent) && /1 of 2/.test(doc.body.textContent));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
