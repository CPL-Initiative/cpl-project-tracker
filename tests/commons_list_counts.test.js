// The Catalog Commons List engine's filter counts (the List norms' second step: "the filter vocabulary with counts in the
// engine (Program Requirements' count getter generalized)"; docs/kb-notes/reference-catalog-commons-list-norms.md).
// The engine alone, on a spec with four rows. Guards:
//   (1) every filter word carries its count, the engine's own pass over every row (the finder and the column boxes
//       aside), the current word included, and counting leaves the current filter where it was;
//   (2) the counts follow the table: an accepted suggestion moves Suggested and Changed this visit, a tick moves
//       Selected, and Selected (an engine id for every List) keeps the ticked rows;
//   (3) counts() hands the tab's own (Program Requirements, Courses): an id it leaves out shows no count, and the ids
//       the engine owns are still counted by the engine;
//   (4) uncounted(id) shows no count while a filter's data is unread, never a 0 (S343); counts: false shows none;
//   (5) the finder narrows the table, never the counts.
// Run from repo root: `npm test` (or `node tests/commons_list_counts.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

const ROWS = [
  { ut: "Alpha", grp: "one" }, { ut: "Bravo", grp: "two" }, { ut: "Charlie", grp: "two" }, { ut: "Delta", grp: "three" }
];
const FILTERS = [["", "All"], ["two", "Group two"], ["suggested", "Suggested"], ["selected", "Selected"], ["changed", "Changed this visit"]];

function boot(over) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>', { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  w.eval(LIST_SRC);
  const state = {}, rows = ROWS.map((r) => Object.assign({}, r));
  let api = null;
  function render() { const m = d.getElementById("mount"); m.innerHTML = ""; api.render(m); }
  const spec = Object.assign({
    state: () => state, rows: () => rows, render: render,
    cols: () => [{ h: "Name", w: 30, v: (r) => r.ut }, { h: "Group", w: 20, v: (r) => r.grp }],
    filters: FILTERS,
    filterPass: (r, L) => L.f !== "two" || r.grp === "two",
    changed: true,
    suggest: {
      get: (r) => (r.ut === "Bravo" || r.ut === "Charlie") && !r.done ? { text: "fold into Delta" } : null,
      accept: (r) => { r.done = true; return Promise.resolve({ ok: true, words: "Saved.", keys: ["Delta"] }); }
    }
  }, (over && over.spec) || {});
  api = w.CPL_COMMONS_LIST.create(spec);
  render();
  return { w, d, api, state };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
function bar(d) { return Array.from(d.querySelectorAll("#cl-filters > *")).map(txt).join("|"); }
function rows(d) { return Array.from(d.querySelectorAll(".cl-table tbody tr:not(.cl-editrow):not(.cl-band)")); }
function titles(d) { return rows(d).map((r) => txt(r.querySelector(".cl-title .cl-open"))).join("|"); }
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }

(async function () {
  // (1)
  const a = boot();
  check("(1) ⭐ every filter word carries its count from the engine's own pass", bar(a.d) === "All (4)|Group two (2)|Suggested (2)|Selected (0)|Changed this visit (0)", bar(a.d));
  words(a.d, "Group two").click(); await settle();
  check("(1) the current word keeps its count, and counting leaves the filter where it was",
    txt(a.d.querySelector('#cl-filters [aria-current="true"]')) === "Group two (2)" && a.state.f === "two" && titles(a.d) === "Bravo|Charlie", titles(a.d));

  // (2)
  const b = boot();
  words(b.d, "Suggested").click(); await settle();
  b.d.querySelector(".cl-sg button").click(); await settle();
  check("(2) ⭐ an accepted suggestion moves Suggested and Changed this visit at once", bar(b.d) === "All (4)|Group two (2)|Suggested (1)|Selected (0)|Changed this visit (2)", bar(b.d));
  words(b.d, "All").click(); await settle();
  const box = b.d.querySelector('input[aria-label="Select Alpha"]');
  box.checked = true; box.dispatchEvent(new b.w.Event("change")); await settle();
  check("(2) a tick moves Selected", /\|Selected \(1\)\|/.test(bar(b.d)), bar(b.d));
  words(b.d, "Selected").click(); await settle();
  check("(2) Selected keeps the ticked rows, on any List", titles(b.d) === "Alpha", titles(b.d));

  // (3)
  const c = boot({ spec: { counts: () => ({ "": 99, two: 7 }) } });
  check("(3) ⭐ counts() hands the tab's own; an id it leaves out shows none; the engine's ids stay the engine's",
    bar(c.d) === "All (99)|Group two (7)|Suggested (2)|Selected (0)|Changed this visit (0)", bar(c.d));
  const c2 = boot({ spec: { counts: () => ({ two: 7 }) } });
  check("(3) a tab count left out reads the bare word", bar(c2.d).split("|")[0] === "All", bar(c2.d));

  // (4)
  const u = boot({ spec: { uncounted: (id) => id === "suggested" } });
  check("(4) ⭐ a filter whose data is unread shows no count, never a 0", bar(u.d) === "All (4)|Group two (2)|Suggested|Selected (0)|Changed this visit (0)", bar(u.d));
  const n = boot({ spec: { counts: false } });
  check("(4) counts: false shows none", bar(n.d) === "All|Group two|Suggested|Selected|Changed this visit", bar(n.d));

  // (5)
  const f = boot();
  const q = f.d.getElementById("cl-find");
  q.value = "alpha"; q.dispatchEvent(new f.w.Event("input")); await settle();
  check("(5) the finder narrows the table, never the counts", titles(f.d) === "Alpha" && bar(f.d) === "All (4)|Group two (2)|Suggested (2)|Selected (0)|Changed this visit (0)", bar(f.d));

  let pass = 0;
  results.forEach(([nm, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + nm + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
