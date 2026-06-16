// Guards the Session-58 keyword-gather (Sam, 2026-06-16): the merge popup lets a
// curator GATHER extra courses into the merge by keyword search (the ⚇ Unify
// index) — type a term (e.g. "ESL"), click matches to add them as checked
// candidates, fold them all in. Distinct from "Merge into a DIFFERENT course"
// (which redirects the whole merge into one off-signature target). Needed
// because the synonym map + signature can't surface every related course (the
// broad ESL family — Vocational / Academic / Workplace — are different courses).
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
// ⚇ Unify index [id,title,subject,kind,units]. M9046 is an ESL course NOT in the
// suggested group — the curator gathers it in by keyword.
const idx = [
  ["ESOL M9046", "English as a Second Language Level 3", "ESLN", "M-ID", 0],
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
  const box = curBox(doc);

  // The group starts with 2 candidate rows.
  const nStart = box.querySelectorAll("input[type=checkbox]").length;
  check("group starts with 2 candidates", nStart === 2);

  // Open the ➕ keyword-gather; its search reveals.
  const gToggle = Array.from(box.querySelectorAll("a")).find((a) => /Add more courses to this merge/.test(txt(a)));
  check("the ➕ keyword-gather toggle is present", !!gToggle);
  const gSearch = gToggle.parentNode.querySelector("input[type=search]");
  check("gather search hidden until toggled", gSearch && hidden(gSearch));
  gToggle.dispatchEvent(new window.Event("click"));
  await sleep(20);
  check("gather search shown after toggle", gSearch && !hidden(gSearch));

  // Search "english" → M9046 surfaces; rows already in the group are excluded.
  gSearch.value = "english";
  gSearch.dispatchEvent(new window.Event("input"));
  await sleep(300);
  const panel = gToggle.parentNode;
  const resBtn = Array.from(panel.querySelectorAll("button")).find((b) => /ESOL M9046/.test(txt(b)));
  check("typing surfaces the off-group ESOL M9046", !!resBtn);
  check("a row already in the group is NOT offered to gather",
    !Array.from(panel.querySelectorAll("button")).some((b) => /ESOL M9010/.test(txt(b)) || /ESOL M9030/.test(txt(b))));

  // Click it → a new CHECKED candidate row appears with the ➕ added chip.
  resBtn.dispatchEvent(new window.Event("click"));
  await sleep(30);
  check("gathering adds a 3rd candidate row", box.querySelectorAll("input[type=checkbox]").length === 3);
  const addedRow = Array.from(box.querySelectorAll("div")).find((d) => /ESOL M9046/.test(txt(d)) && /➕ added/.test(txt(d)));
  check("the gathered row carries the ➕ added chip", !!addedRow);
  const addedCb = addedRow && addedRow.querySelector("input[type=checkbox]");
  check("the gathered candidate starts checked", addedCb && addedCb.checked === true);

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
