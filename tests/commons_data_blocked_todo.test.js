// The blocked-catalog to-do on the College Data Collection page (S678, COBIx's item 8 on #3464). Sam, 2026-11-17:
// "Make sure those blocked catalogs and cors are on my cdc to do"; "To do should be on both cdc and commons".
// Guards: the page draws the block from the committed file's blocked_hunt (the one source the Commons' Waiting on a
// person item also reads; tests/blocked_catalogs_test.py proves that side), lists each open college with its catalog
// link (a new tab, Sam's exception of 2026-11-20), names the still-taught courses, drops a filed college, draws nothing
// once all are filed, and says the course list is TBA only while the hunt file holds none.
// Run from repo root: node tests/commons_data_blocked_todo.test.js
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(e) { return (e && e.textContent || "").replace(/\s+/g, " ").trim(); }
const REAL = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));
// The hunt with every still-taught course open: a fixture, so these checks hold whatever a person has answered since
// (S693: Sam answered all 12 on 2026-11-20, which emptied the live to-do).
REAL.blocked_hunt = JSON.parse(fs.readFileSync("tests/fixtures/commons_hunt_open.json", "utf8"));

function page(data) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "https://example.org/#collect", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } }); };
  const s = w.document.createElement("script"); s.textContent = fs.readFileSync("commons_data.js", "utf8"); w.document.body.appendChild(s);
  const D = w.CPL_COMMONS_DATA, root = w.document.getElementById("root");
  D._reset();
  D.render(root, D.model(data), "", new Date("2026-11-17T23:30:00Z"));
  return root;
}
const r1 = page(REAL), b1 = r1.querySelector("#cdd-blocked");
const H = REAL.blocked_hunt, hunted = H.colleges.filter((c) => c.hunted && !c.filed);
check("⭐ the page draws the to-do from the committed file, named for its work", b1 && /^To do: Course Outline and Catalog Fixes Needed/.test(txt(b1.querySelector("h3"))), txt(b1));
check("⭐ it counts the still-taught courses and their colleges from the hunt file (Sam's work order, 2026-11-20), and says the one line a person needs",
  b1 && new RegExp("^" + H.still_taught_open + " courses still taught at " + hunted.length + " colleges need their course outline\\.").test(txt(b1.querySelector("p")))
  && /Send the PDF to COBIx in your Grok Bot chat\./.test(txt(b1)), txt(b1));
check("the folder a session files into is for the team, never the person's instruction", (function () {
  const f = b1 && b1.querySelector("[data-team-files]"); return f && /kb\/hand_filed_catalogs\/outlines/.test(txt(f)) && /^For the team:/.test(txt(f.querySelector("summary")));
})());
check("⭐ each hunted college is a row whose catalog address is a link that opens in a new tab with rel=noopener, its words the address (Sam's exception to the links-in-the-panel rule)",
  b1 && b1.querySelectorAll("[data-todo-college]").length === hunted.length && [...b1.querySelectorAll("[data-todo-college]")].every((li) => {
    const a = li.querySelector("a.cdd-todo-out"); return a && a.getAttribute("target") === "_blank" && /noopener/.test(a.getAttribute("rel") || "") && txt(a) === a.getAttribute("href") && /^https?:\/\//.test(txt(a));
  }), txt(b1));
check("⭐ the 12 courses are named, each under its college, where the page said TBA", b1 && b1.querySelectorAll("[data-todo-course]").length === 12 && !/TBA/.test(txt(b1))
  && hunted.every((c) => c.still_taught.every((x) => txt(b1.querySelector('[data-todo-college="' + c.slug + '"]')).indexOf(x.course + ", " + x.title) >= 0)), txt(b1));
check("a college with no still-taught course is set aside in one line, off the list", (function () {
  const a = b1 && b1.querySelector("[data-todo-aside]"); return a && /^No still-taught course waits at El Camino College or Fullerton College\.$/.test(txt(a))
    && !b1.querySelector('[data-todo-college="el_camino"]') && !b1.querySelector('[data-todo-college="fullerton"]');
})());
const one = JSON.parse(JSON.stringify(REAL));
one.blocked_hunt.colleges.filter((c) => c.slug === "grossmont")[0].filed = true; one.blocked_hunt.open -= 1; one.blocked_hunt.still_taught_open -= 1;
const b2 = page(one).querySelector("#cdd-blocked");
check("⭐ a filed college leaves the page's list and the count", b2 && b2.querySelectorAll("[data-todo-college]").length === hunted.length - 1 && !b2.querySelector('[data-todo-college="grossmont"]')
  && new RegExp("^" + (H.still_taught_open - 1) + " courses still taught at " + (hunted.length - 1) + " colleges").test(txt(b2.querySelector("p"))), txt(b2));
const all = JSON.parse(JSON.stringify(REAL));
all.blocked_hunt.colleges.forEach((c) => { c.filed = true; }); all.blocked_hunt.open = 0;
check("⭐ all filed: no to-do block at all", !page(all).querySelector("#cdd-blocked"));
const bare = JSON.parse(JSON.stringify(REAL));
bare.blocked_hunt.courses = null; bare.blocked_hunt.open = 6; bare.blocked_hunt.colleges.forEach((c) => { c.hunted = true; c.still_taught = null; });
const b4 = page(bare).querySelector("#cdd-blocked");
check("a hunt file with no course list still says the list is TBA, never a number it does not hold", b4 && /course-by-course list, still-taught courses first: TBA/.test(txt(b4)) && b4.querySelectorAll("[data-todo-college]").length === 6);
check("no glyph and no raw hex in the block's code", (function () { const src = fs.readFileSync("commons_data.js", "utf8"); const i = src.indexOf("function blockedTodo"), j = src.indexOf("function section(", i);
  const part = src.slice(i, j); return !/#[0-9a-fA-F]{3,6}\b/.test(part) && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(part); })());
results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
const failed = results.filter((r) => !r[1]).length;
console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
