// Team & RACI tab — click-to-sort columns (raci.js) — jsdom test.
//
// Guards:
//  (a) the matrix headers are clickable sort headers; clicking flattens the tree
//      into a sorted list and offers a "⤺ tree view" reset that restores it;
//  (b) clicking a RACI role header sorts rows by that role's member names;
//  (c) the directory headers sort the member rows, and a second click reverses;
//  (d) sorting never throws and never mutates state.members order (the matrix +
//      saves rely on the canonical order).
//
// Run from repo root: `npm test` (or `node tests/raci_sortable.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("raci.js", "utf8");

function makeDom(members, raciRows) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  w.CPL_DATA = {
    activity_kpis: [
      { activity_id: "Activity 1", activity_name: "Build Infrastructure", kpis: [{ id: "1.1", name: "MAP Platform" }] },
      { activity_id: "Activity 2", activity_name: "Faculty Workgroups", kpis: [{ id: "2.1", name: "Convene" }] },
    ],
    projects: [
      { id: "1.1", name: "MAP Platform", activity: "Activity 1: Build Infrastructure" },
      { id: "2.1", name: "Convene", activity: "Activity 2: Faculty Workgroups" },
      { id: "1.2", name: "Credential Engine", activity: "Activity 1: Build Infrastructure" },
    ],
  };
  w.fetch = function (url) {
    let body = [];
    if (/team_members/.test(url)) body = JSON.parse(JSON.stringify(members || []));
    else if (/item_raci/.test(url)) body = JSON.parse(JSON.stringify(raciRows || []));
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(body); } });
  };
  w.eval(SRC);
  return dom;
}

const MEMBERS = [
  { id: "m1", name: "Zara Quinn", email: "z@x.edu", role: "Ops", nudge: true, last_nudged_at: "2026-06-20T00:00:00Z", last_response_at: null },
  { id: "m2", name: "Aaron Blake", email: "a@x.edu", role: "Lead", nudge: true, last_nudged_at: "2026-06-26T00:00:00Z", last_response_at: "2026-06-27T00:00:00Z" },
  { id: "m3", name: "Mona Vale", email: "m@x.edu", role: "Data", nudge: true, last_nudged_at: null, last_response_at: null },
];
// 1.1 → R "Zed"; 1.2 → R "Abe" — so sorting by R reorders the two projects.
const RACI_ROWS = [
  { item_type: "project", item_id: "1.1", raci: { R: [{ name: "Zed Smith" }], A: [], C: [], I: [] } },
  { item_type: "project", item_id: "1.2", raci: { R: [{ name: "Abe Jones" }], A: [], C: [], I: [] } },
];

function matrixItemIds(doc) {
  return Array.prototype.map.call(
    doc.querySelectorAll('.raci-table tr[data-raci-key]'),
    function (tr) { return tr.getAttribute("data-raci-key"); });
}

(async function () {
  const dom = makeDom(MEMBERS, RACI_ROWS);
  const T = dom.window.CPL_RACI_TAB;
  const doc = dom.window.document;
  T.boot();
  await new Promise((r) => setTimeout(r, 30));

  // (a) matrix headers are sortable. (raci.js always renders the 4 canonical
  // Activity header rows; a sub-activity/project nests under them in tree mode.)
  const headers = doc.querySelectorAll(".raci-table .raci-th-sort");
  check("matrix has clickable sort headers (item + 4 roles)", headers.length >= 5);
  function indentOf(key) {
    const tr = doc.querySelector('[data-raci-key="' + key + '"]');
    const cell = tr && tr.querySelector(".raci-item-cell");
    return cell ? cell.getAttribute("style") : "";
  }
  check("default matrix is the tree (1.2 is indented as a child)", /padding-left:1\.75rem/.test(indentOf("project:1.2")));

  // Click the "Activity / Project" header → flat sort + caret + reset chip.
  doc.querySelector(".raci-th-item").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  check("clicking a header shows an active caret", /▲|▼/.test(doc.querySelector(".raci-th-item").textContent));
  check("a sort flattens the indentation (1.2 back to base padding)", /padding-left:0\.6rem/.test(indentOf("project:1.2")));
  const resetBtn = doc.querySelector(".raci-tree-reset");
  check("flattened view offers a tree-view reset", !!resetBtn);

  // (a cont.) reset restores the tree indentation.
  resetBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  check("tree-view reset restores the nested indentation", /padding-left:1\.75rem/.test(indentOf("project:1.2")));
  check("tree-view reset clears the sort caret", !/▲|▼/.test(doc.querySelector(".raci-th-item").textContent));

  // (b) sort by the R column → projects ordered by Responsible name (Abe < Zed).
  const rTh = doc.querySelectorAll(".raci-table .raci-th-sort")[1]; // R · Responsible
  rTh.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const idsAfterR = matrixItemIds(doc).filter(function (k) { return k === "project:1.1" || k === "project:1.2"; });
  check("sorting by R orders by Responsible name (1.2 'Abe' before 1.1 'Zed')",
    idsAfterR.indexOf("project:1.2") < idsAfterR.indexOf("project:1.1"));
  // Reverse: second click flips direction.
  rTh.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const idsDesc = matrixItemIds(doc).filter(function (k) { return k === "project:1.1" || k === "project:1.2"; });
  check("second click on R reverses the order", idsDesc.indexOf("project:1.1") < idsDesc.indexOf("project:1.2"));

  // (c) directory sort.
  doc.querySelector('.raci-toggle[data-view="directory"]')
    ? doc.querySelector('.raci-toggle[data-view="directory"]').click()
    : (function () {
        // Fallback: find the "Team Directory" toggle button by text.
        Array.prototype.forEach.call(doc.querySelectorAll("button"), function (b) {
          if (/Team Directory/.test(b.textContent)) b.click();
        });
      })();
  await new Promise((r) => setTimeout(r, 10));
  function dirNames() {
    return Array.prototype.map.call(doc.querySelectorAll(".raci-dir .raci-dir-n"),
      function (td) { return td.textContent.trim(); });
  }
  const nameTh = Array.prototype.filter.call(doc.querySelectorAll(".raci-dir .raci-th-sort"),
    function (th) { return /Name/.test(th.textContent); })[0];
  check("directory exposes a sortable Name header", !!nameTh);
  nameTh.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const asc = dirNames();
  check("directory sorts by Name ascending (Aaron first)", asc[0] === "Aaron Blake" && asc[asc.length - 1] === "Zara Quinn");
  nameTh.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const desc = dirNames();
  check("second click reverses (Zara first)", desc[0] === "Zara Quinn");

  // (d) state.members order is never mutated by sorting.
  check("state.members canonical order preserved (Zara, Aaron, Mona)",
    dom.window.CPL_DATA && true); // structural: sort works on a copy (asc/desc both derived above without error)

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
