// Session 72 (StarLander) #7 — the worklist's top Search box is multi-term:
// COMMA separates terms and matches ANY of them ("digital, imag" surfaces groups
// matching "digital" OR "imag"). Guards the OR semantics + the ghost-text hint.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_multiterm.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: "Art",
  credit: "Credit", units: 3, top: "1002.00", subj: ["ARTS"], members: 2,
  adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [
  mkRow("ARTS M1001", "Digital Photography"), mkRow("ARTS M1002", "Digital Photography I"),
  mkRow("ARTS M2001", "Image Editing"), mkRow("ARTS M2002", "Image Editing I"),
  mkRow("ARTS M3001", "Sculpture"), mkRow("ARTS M3002", "Sculpture I"),
];
const grp = (a, b) => ({ sig: a, n: 2, score: 0.9, members: [
  { id: a, t: rows.find((r) => r.id === a).title, s: "ARTS", u: 3, k: "M-ID", d: "Art" },
  { id: b, t: rows.find((r) => r.id === b).title, s: "ARTS", u: 3, k: "M-ID", d: "Art" },
] });
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [grp("ARTS M1001", "ARTS M1002"), grp("ARTS M2001", "ARTS M2002"), grp("ARTS M3001", "ARTS M3002")],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Art"], topmap: {} })};
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
  Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(200);
  const dock = doc.querySelector(".uc-worklist-dock");
  const head = Array.from(dock.querySelectorAll("strong")).find((s) => /Suggested merges/.test(txt(s))).parentNode;
  const search = Array.from(dock.querySelectorAll("input[type=search]")).find((i) => /comma separates terms/.test(i.placeholder || ""));

  check("top Search box carries the multi-term ghost text", !!search && /digital, imag/.test(search.placeholder));
  check("starts at 1 of 3", /1 of 3/.test(txt(head)));

  // "digital, imag" → OR: the Digital and Image groups match, Sculpture does not.
  search.value = "digital, imag"; search.dispatchEvent(new window.Event("input"));
  await sleep(300);
  check("comma-OR surfaces BOTH matching groups (2 matching)", /of 2 matching/.test(txt(head)));
  check("the Sculpture group (matches neither term) is filtered out", !/Sculpture/.test(txt(dock)));
  check("a matching group is shown (Digital or Image)", /Digital Photography|Image Editing/.test(txt(dock)));

  // A single term still works (only the Image group).
  search.value = "imag"; search.dispatchEvent(new window.Event("input"));
  await sleep(300);
  check("single term narrows to 1 matching", /of 1 matching/.test(txt(head)));
  check("only the Image group remains", /Image Editing/.test(txt(dock)) && !/Digital Photography|Sculpture/.test(txt(dock)));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
