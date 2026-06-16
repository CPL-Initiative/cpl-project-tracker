// Guards the Session-58 Suggested-merges refinements (Sam, 2026-06-16):
//   - task 1: picking a NON-OFFICIAL course from the "⌕ Merge into a different
//     existing course" dropdown REPOPULATES the Proposed unified title with that
//     course's CLEANED name AND keeps the field EDITABLE, so the curator can tidy
//     it; on Confirm the (edited) title renames the target (unified_title write).
//     An official C-ID/CCN target stays read-only (guarded by uc_worklist_override_target).
//   - task 3: a "Completion note" input writes a `merge_note` curation row on the
//     surviving target (e.g. "both segments must be completed for full credit").
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_note_rename.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The screenshot's case: a MATH "Elementary Algebra, Part 1" M-ID group; the
// curator redirects it into an off-signature IDST "Algebra 1-2, Semester 1"
// identity (non-official) and renames it to "Elementary Algebra 1-2".
const rows = [
  { kind: "Course", id: "MATH M1066", title: "Elementary Algebra, Part 1", id_system: "M-ID",
    disc: "Mathematics", credit: "Credit", units: 3, top: "1701.00", subj: ["MATH"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
const sugStub = {
  groups: [
    { sig: "algebra", n: 2, score: 0.8, members: [
      { id: "MATH M1066", t: "Elementary Algebra, Part 1", s: "MATH", u: 3, k: "M-ID" },
      { id: "MATH M10AD", t: "Algebra 1: Part 2", s: "MATH", u: 3, k: "Stand-Alone", g: 1 },
    ] },
  ],
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
};
// The ⚇ Unify search index: [id, title, subject, kind, units]. IDST M9001 is a
// NON-official (M-ID) off-signature identity the curator redirects into; its
// title carries "(NC)" noise that cleanTitle() strips on repopulate.
const idx = [
  ["IDST M9001", "Algebra 1-2, Semester 1 (NC)", "IDST", "M-ID", 3.0],
  ["MATH M1066", "Elementary Algebra, Part 1", "MATH", "M-ID", 3],
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Mathematics"], topmap: {} })};
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

  // ── task 3: the Completion note input is present ───────────────────────────
  const noteIn = Array.from(box.querySelectorAll("input[type=text]"))
    .find((n) => /full credit/i.test(n.getAttribute("placeholder") || ""));
  check("a Completion note input is present", !!noteIn);

  // ── task 1: pick a NON-OFFICIAL override target ────────────────────────────
  const toggle = Array.from(box.querySelectorAll("a")).find((a) => /different existing course/.test(txt(a)));
  toggle.dispatchEvent(new window.Event("click"));
  await sleep(20);
  // Scope to the override panel (a second ➕ keyword-gather search also exists).
  const search = toggle.parentNode.querySelector("input[type=search]");
  search.value = "algebra";
  search.dispatchEvent(new window.Event("input"));
  await sleep(300);
  const resBtn = Array.from(box.querySelectorAll("button")).find((b) => /IDST M9001/.test(txt(b)));
  check("typing surfaces the off-signature IDST M9001 identity", !!resBtn);
  resBtn.dispatchEvent(new window.Event("click"));
  await sleep(30);

  const titleIn = box.querySelector("input[type=text]");
  check("picking a non-official target REPOPULATES the Proposed title (cleaned, no '(NC)')",
    titleIn && titleIn.value === "Algebra 1-2, Semester 1");
  check("the Proposed title stays EDITABLE under a non-official override",
    titleIn && titleIn.disabled === false);
  check("the banner notes that editing the title renames the course",
    /Editing the Proposed title above renames/.test(box.textContent));

  // Curator tidies the title + adds a completion note, then folds in.
  titleIn.value = "Elementary Algebra 1-2";
  noteIn.value = "Both segments (1 & 2) must be completed for full credit.";
  const go = Array.from(box.querySelectorAll("button")).find((b) => /Fold into IDST M9001/.test(txt(b)));
  check("Confirm relabels to ✓ Fold into IDST M9001", !!go);
  go.dispatchEvent(new window.Event("click"));
  await sleep(250);

  const bodies = posts.map((p) => String(p.body || "")).join(" ");
  check("members fold into IDST M9001 (merge_into written)",
    /"course_id":\s*"MATH M1066"/.test(bodies) && /"value":\s*"IDST M9001"/.test(bodies));
  check("the EDITED title renames the target (unified_title = 'Elementary Algebra 1-2')",
    /"field":\s*"unified_title"[^}]*"value":\s*"Elementary Algebra 1-2"/.test(bodies)
    || (/"course_id":\s*"IDST M9001"[^}]*"field":\s*"unified_title"/.test(bodies) && /Elementary Algebra 1-2/.test(bodies)));
  check("a merge_note row is written on the target",
    /"field":\s*"merge_note"[^}]*Both segments/.test(bodies)
    || (/"field":\s*"merge_note"/.test(bodies) && /Both segments/.test(bodies)));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
