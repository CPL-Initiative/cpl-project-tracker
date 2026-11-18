// The blocked-catalog to-do on the College Data Collection page (S678, COBIx's item 8 on #3464). Sam, 2026-11-17:
// "Make sure those blocked catalogs and cors are on my cdc to do"; "To do should be on both cdc and commons".
// Guards: the page draws the block from the committed file's blocked_hunt (the one source the Commons' Waiting on a
// person item also reads; tests/blocked_catalogs_test.py proves that side), lists each open college with its catalog
// link, drops a filed college, draws nothing once all are filed, and says the course list is TBA while it is not filed.
// Run from repo root: node tests/commons_data_blocked_todo.test.js
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(e) { return (e && e.textContent || "").replace(/\s+/g, " ").trim(); }
const REAL = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));

function page(data) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "https://example.org/#commons/data", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } }); };
  const s = w.document.createElement("script"); s.textContent = fs.readFileSync("commons_data.js", "utf8"); w.document.body.appendChild(s);
  const D = w.CPL_COMMONS_DATA, root = w.document.getElementById("root");
  D._reset();
  D.render(root, D.model(data), "", new Date("2026-11-17T23:30:00Z"));
  return root;
}
const r1 = page(REAL), b1 = r1.querySelector("#cdd-blocked");
check("⭐ the page draws the to-do from the committed file", b1 && /^To do: Find catalogs or course outlines/.test(txt(b1.querySelector("h3"))), txt(b1));
check("it says how many colleges and courses, that only still-taught courses are hunted, and where to file",
  b1 && /6 of 6 colleges still to find, 345 local courses in all; 12 of them are still taught/.test(txt(b1)) && /kb\/hand_filed_catalogs\/outlines/.test(txt(b1)), txt(b1));
check("each open college is a row with its catalog address, as words (the page's one outbound link is the panel's new-tab control)",
  b1 && b1.querySelectorAll("[data-todo-college]").length === 6 && !b1.querySelector("a") && [...b1.querySelectorAll("[data-todo-college]")].every((li) => /Its catalog: https?:\/\//.test(txt(li))));
check("the course list says TBA, never a number it does not hold", b1 && /course-by-course list, still-taught courses first: TBA/.test(txt(b1)));
const one = JSON.parse(JSON.stringify(REAL));
one.blocked_hunt.colleges[1].filed = true; one.blocked_hunt.open = 5; one.blocked_hunt.local_courses_open = 303;
const b2 = page(one).querySelector("#cdd-blocked");
check("⭐ a filed college leaves the page's list", b2 && b2.querySelectorAll("[data-todo-college]").length === 5 && !b2.querySelector('[data-todo-college="grossmont"]') && /5 of 6 colleges/.test(txt(b2)));
const all = JSON.parse(JSON.stringify(REAL));
all.blocked_hunt.colleges.forEach((c) => { c.filed = true; }); all.blocked_hunt.open = 0;
check("⭐ all filed: no to-do block at all", !page(all).querySelector("#cdd-blocked"));
check("no glyph and no raw hex in the block's code", (function () { const src = fs.readFileSync("commons_data.js", "utf8"); const i = src.indexOf("function blockedTodo"), j = src.indexOf("function section(", i);
  const part = src.slice(i, j); return !/#[0-9a-fA-F]{3,6}\b/.test(part) && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(part); })());
results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
const failed = results.filter((r) => !r[1]).length;
console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
