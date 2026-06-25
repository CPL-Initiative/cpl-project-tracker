// Guards the Session-71 PR-1 extraction: the ✨ worklist's merge editor is now a
// shared component, buildMergeEditor(container, opts), embedded by renderGroup
// (and — PR-2 — the per-row ⚇ dialog). This test pins the SEAM so a future edit
// can't silently re-inline it or break the two-feeders contract:
//
//   1. The shared editor renders its full control set into the worklist box:
//      Proposed unified title input, Discipline select, Completion note input,
//      a Candidates list, and a Confirm button.
//   2. The "Add more by search" / "Merge into a different course" override panel
//      affordances the editor owns are present.
//   3. Confirm routes through the shared onConfirm → doConsolidate path: folding
//      a Stand-Alone into an M-ID posts the merge_into curation row. (If the
//      extraction dropped the onConfirm wiring, no POST would fire.)
//   4. Skip (a caller-owned QUEUE-chrome button passed via extraActions) still
//      advances the worklist — proving the editor places extraActions correctly.
//
// Run from repo root: `npm test` (or `node tests/uc_merge_editor_shared.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Structural guard: the shared seam exists and the worklist routes through it.
check("buildMergeEditor(container, opts) is defined",
  /function buildMergeEditor\(container, opts\)/.test(src));
check("the worklist embeds the shared editor (buildMergeEditor(box, …))",
  /buildMergeEditor\(box, \{/.test(src));
check("the shared editor confirms via opts.onConfirm (not a hard-wired doConsolidate)",
  /opts\.onConfirm\(\{/.test(src));

const rows = [
  { kind: "Course", id: "BIOL M90BE", title: "Life Science – Physiology", id_system: "M-ID",
    disc: "Biological Sciences", credit: "Credit", units: 0, top: "0410.00", subj: ["BIOL"],
    members: 2, adopted: [], potential: [], conf: 0.84, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];

const sugStub = {
  groups: [
    { sig: "Life Science – Physiology", n: 2, score: 0.84,
      members: [
        { id: "BIOL M90BE", t: "Life Science – Physiology", s: "BIOL", u: 0, k: "M-ID" },
        { id: "BIOL M90BE-SA", t: "Life Science – Physiology", s: "BIOL", u: 0, k: "Stand-Alone", g: 1 },
      ] },
    { sig: "Second Group Placeholder", n: 2, score: 0.8,
      members: [
        { id: "BIOL M90BE", t: "Life Science – Physiology", s: "BIOL", u: 0, k: "M-ID" },
        { id: "BIOL SA2", t: "Life Science – Physiology", s: "BIOL", u: 0, k: "Stand-Alone", g: 1 },
      ] },
  ],
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [],
  title_count: 0, title_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Biological Sciences", "Physics"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
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

  const sugBtn = Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(250);

  let box = curBox(doc);
  // ── 1. the shared editor's control set rendered ──
  check("editor renders a Proposed unified title input",
    !!box.querySelector("input[type=text]"));
  check("editor renders a Discipline select", !!box.querySelector("select.uc-filter"));
  check("editor renders a Completion note input",
    Array.from(box.querySelectorAll("input")).some((i) => /Completion note|both parts|segments/i.test(i.placeholder || "")));
  check("editor renders a Candidates list (checkbox rows)",
    box.querySelectorAll(".uc-cand-cb").length === 2);
  check("editor renders a Confirm button",
    !!Array.from(box.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b))));

  // ── 2. editor-owned search affordances ──
  // The "Add more" search is now an always-visible inline box (Session 72 #2 —
  // matches drop into the Candidates list as unchecked rows), not a collapsible
  // keyword panel.
  check("editor offers the inline 'Add more courses' search",
    /Add more courses/i.test(box.textContent)
    && Array.from(box.querySelectorAll('input[type=search]')).some((i) => /add more candidates/i.test(i.placeholder || "")));
  check("editor offers the ⌕ merge-into-a-different-course affordance",
    /Merge into a different existing course/i.test(box.textContent));

  // ── 4. Skip (extraActions, caller-owned) advances the worklist ──
  const skip = Array.from(box.querySelectorAll("button")).find((b) => /Skip/.test(txt(b)));
  check("Skip button (extraActions) is present in the editor's action row", !!skip);
  skip.dispatchEvent(new window.Event("click"));
  await sleep(150);
  box = curBox(doc);
  // Group 2's distinct Stand-Alone (BIOL SA2) now appears — proves the queue
  // advanced and the shared editor re-rendered for the next group.
  check("Skip advanced to the next group (its distinct member is shown)",
    /BIOL SA2\b/.test(box.textContent) && !/BIOL M90BE-SA\b/.test(box.textContent));

  // ── 3. Confirm routes through onConfirm → doConsolidate (a merge POST) ──
  // Reopen on group 1 for a clean confirm.
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(200);
  box = curBox(doc);
  for (const cb of Array.from(box.querySelectorAll(".uc-cand-cb"))) {
    if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new window.Event("change")); }
  }
  await sleep(20);
  const go = Array.from(box.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)));
  go.dispatchEvent(new window.Event("click"));
  await sleep(250);
  const bodies = posts.map((p) => String(p.body || "")).join(" ");
  check("Confirm posts the merge through the shared onConfirm path (merge_into -> BIOL M90BE)",
    /"field":\s*"merge_into"/.test(bodies)
    && /"value":\s*"BIOL M90BE"/.test(bodies)
    && /"course_id":\s*"BIOL M90BE-SA"/.test(bodies));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
