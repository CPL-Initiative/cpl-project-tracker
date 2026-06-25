// Guards the "Add more courses" search (Session 72 #2, Sam — supersedes the
// Session-58 collapsible ➕ keyword-gather): an always-visible search whose
// matches drop straight INTO the Candidates list as UNCHECKED rows. The curator
// ticks the ones to fold in and ignores the rest — no click-to-add step. Rows
// already in the group are excluded; unchecked search rows clear on a changed/
// emptied query while checked ones persist. Needed because the synonym map +
// signature can't surface every related course (the broad ESL family —
// Vocational / Academic / Workplace — are different courses sharing a keyword).
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_keyword_gather.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function hidden(elm) { let p = elm; while (p) { if (p.style && p.style.display === "none") return true; p = p.parentElement; } return false; }

const rows = [
  { kind: "Course", id: "ESOL M9010", title: "English as a Second Language Level 1", id_system: "M-ID",
    disc: "English as a Second Language", credit: "Noncredit", units: 0, top: "4930.87", subj: ["ESLN"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
const sugStub = {
  groups: [
    { sig: "esl", n: 2, score: 0.9, members: [
      { id: "ESOL M9010", t: "English as a Second Language Level 1", s: "ESLN", u: 0, k: "M-ID" },
      { id: "ESOL M9030", t: "English as a Second Language Level 2", s: "ESLN", u: 0, k: "M-ID" },
    ] },
  ],
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
};
// ⚇ Unify index [id,title,subject,kind,units]. M9046 is an ESL-adjacent course
// NOT in the suggested group; its title is dissimilar enough that it does NOT
// auto-surface at the Tight pin, so the curator gathers it in by the KEYWORD
// "english" — the path this test exercises.
const idx = [
  ["ESOL M9046", "Vocational English Communication", "ESLN", "M-ID", 0],
  ["ESOL M9010", "English as a Second Language Level 1", "ESLN", "M-ID", 0],
  ["ESOL M9030", "English as a Second Language Level 2", "ESLN", "M-ID", 0],
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["English as a Second Language"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
  window.CPL_UC_INDEX = ${JSON.stringify(idx)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
// Pin the candidate-looseness slider to Tight so the editor doesn't auto-surface
// extra similar candidates (Session 72 #4 made the default Loose) — this test
// exercises the keyword path against a group that starts with only its 2 members.
window.localStorage.setItem("cplCandLoosen.v1", "0");
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const posts = [];
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  if (method !== "GET") posts.push({ url: String(url), method, body: opts && opts.body });
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve([]) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

function curBox(doc) {
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Proposed unified title/.test(txt(d)));
  return boxes[boxes.length - 1];
}

(async function main() {
  await sleep(120);
  const doc = window.document;
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(250);
  let box = curBox(doc);

  // The group starts with 2 candidate rows (Tight pin → no auto-surface).
  const nStart = box.querySelectorAll("input.uc-cand-cb").length;
  check("group starts with 2 candidates", nStart === 2);

  // The keyword now comes from the worklist's TOP Search box (S72 #5), not a box
  // inside the editor — typing there guides the shown group's candidate surfacing.
  const dock = box.closest(".uc-worklist-dock");
  const sugSearch = Array.from(dock.querySelectorAll("input[type=search]"))
    .find((i) => /comma separates terms/i.test(i.placeholder || ""));
  check("the worklist top Search box is present", !!sugSearch);
  check("the editor no longer has its own keyword box",
    !Array.from(box.querySelectorAll("input[type=search]")).some((i) => /keyword to guide/i.test(i.placeholder || "")));

  // Search "english" → the ESL group stays (it matches) and the off-group
  // "Vocational English Communication" (M9046) surfaces as a NEW unchecked row;
  // rows already in the group are excluded (no duplicate).
  sugSearch.value = "english";
  sugSearch.dispatchEvent(new window.Event("input"));
  await sleep(350);
  box = curBox(doc);
  check("typing the keyword surfaces a 3rd candidate row",
    box.querySelectorAll("input.uc-cand-cb").length === 3);
  const addedRow = Array.from(box.querySelectorAll("div"))
    .find((d) => d.querySelector(":scope > input.uc-cand-cb") && /ESOL M9046/.test(txt(d)));
  check("the search-added row carries the ➕ added chip", addedRow && /➕ added/.test(txt(addedRow)));
  const addedCb = addedRow && addedRow.querySelector(":scope > input.uc-cand-cb");
  check("the search-added candidate starts UNCHECKED (check to merge or ignore)",
    addedCb && addedCb.checked === false);
  check("a row already in the group is NOT re-added by the search",
    Array.from(box.querySelectorAll("div"))
      .filter((d) => d.querySelector(":scope > input.uc-cand-cb") && /ESOL M9010/.test(txt(d))).length === 1);

  // Tick the search-added row + the native ESOL M9030 → all three merge.
  addedCb.checked = true; addedCb.dispatchEvent(new window.Event("change"));
  for (const cb of Array.from(box.querySelectorAll(".uc-cand-cb"))) {
    if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new window.Event("change")); }
  }
  await sleep(20);

  // Confirm → all three fold into the M-ID target (ESOL M9010 by precedence).
  const go = Array.from(box.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)));
  go.dispatchEvent(new window.Event("click"));
  await sleep(250);
  const bodies = posts.map((p) => String(p.body || "")).join(" ");
  check("the gathered ESOL M9046 folds into the merge target",
    /"course_id":\s*"ESOL M9046"/.test(bodies) && /"value":\s*"ESOL M9010"/.test(bodies));
  check("the native ESOL M9030 also folds into ESOL M9010",
    /"course_id":\s*"ESOL M9030"/.test(bodies) && /"value":\s*"ESOL M9010"/.test(bodies));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
