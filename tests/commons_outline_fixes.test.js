// Course Outline and Catalog Fixes Needed, on the CPL Commons front page (Sam's work order of 2026-11-20, relayed by
// COBIx on #3584, comment 7038766315; the 12 courses in his comment 7039460536).
//
// WHAT THIS GUARDS (each a way the page misled Sam on his walk through the Commons):
//   (1) ⭐ two counts for one thing: the front page said "140 cards, 13 current" where College Data Collection said
//       12. Both now read the hunt file through kb/status/commons_data.json's blocked_hunt, so the front page's count
//       is the hunt's still_taught_open and no typed-in figure is left in the source;
//   (2) ⭐ a group named for nothing: "Rows waiting on a person" is gone; each group in Needs you is named for its
//       work, and the held exhibit titles sit under their own name;
//   (3) the still-taught courses are named by college, and a college with none (set aside) is not on the to-do;
//   (4) each catalog address is a link that opens in a new tab with rel=noopener, and its words are the address;
//   (5) the one line a person needs is there, word for word;
//   (6) a filed college leaves the list and the count; with every hunted college filed the group says so.
//
// Run from repo root: `npm test` (or `node tests/commons_outline_fixes.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("commons_front.js", "utf8");
const SCRIPTS = [fs.readFileSync("commons_progress.js", "utf8"), fs.readFileSync("commons_program_records.js", "utf8"), SRC, fs.readFileSync("commons.js", "utf8")];
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8"))
};
// The hunt with every still-taught course open: a fixture, so these checks hold whatever a person has answered since
// (S693: Sam answered all 12 on 2026-11-20, which emptied the live to-do).
FILES["kb/status/commons_data.json"].blocked_hunt = JSON.parse(fs.readFileSync("tests/fixtures/commons_hunt_open.json", "utf8"));
const HUNT = FILES["kb/status/commons_data.json"].blocked_hunt;

function load(files) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html#commons", runScripts: "dangerously" });
  const w = dom.window, o = {};
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  const all = Object.assign({}, FILES, files || {});
  w.fetch = function (url) {
    const hit = all[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
function withHunt(change) {
  const data = JSON.parse(JSON.stringify(FILES["kb/status/commons_data.json"]));
  change(data.blocked_hunt);
  return { "kb/status/commons_data.json": data };
}

(async function () {
  const x = load();
  await x.M.boot(); await settle();
  /* S723 (Sam, 2026-11-24): Needs you is the ranked links; the outline list lives in the Courses data card's outlines
     check, and each college's Needs you link lands on that college's own link there. */
  const OUT = (d) => d.querySelector('.cmf-card[data-key="courses-data"] .cmf-check[data-ref="outlines"]');
  const box = OUT(x.d), needs = x.d.querySelector("#cmf-needs");
  const hunted = HUNT.colleges.filter((c) => c.hunted && !c.filed);
  const line = (b) => txt(b.querySelector(".cmf-check-line"));

  check("(1) ⭐ the card's count is the hunt file's: " + HUNT.still_taught_open + " courses at " + hunted.length + " colleges",
    box && new RegExp("^" + HUNT.still_taught_open + " courses still taught at " + hunted.length + " colleges need their course outline from a person\\.").test(line(box)), box && txt(box));
  check("(1) the hunt lists 12 courses and they are the 12 the file counts", HUNT.still_taught_total === 12 && HUNT.courses.length === 12 && HUNT.still_taught_open === 12);
  check("(1) ⭐ no typed-in figure is left: the source has no outlinesBlocked, and the page prints no \"140 cards\" or \"13 current\"",
    !/outlinesBlocked/.test(SRC) && !/140 cards|13 current/.test(txt(x.d.querySelector("#commons-root"))));
  const ranked = Array.from(needs.querySelectorAll("#cmf-rank li a")).filter((a) => /: course outlines$/.test(txt(a)));
  check("(1) ⭐ Needs you links each hunted college, and each link lands on that college's own link in the card",
    ranked.length === hunted.length && ranked.every((a) => a.getAttribute("data-onpage") === "courses-data" && a.getAttribute("data-onpage-ref") === "outlines"
      && box.querySelector('.cmf-land a[href="' + a.getAttribute("data-onpage-to") + '"]')), ranked.map((a) => a.outerHTML).join(" "));
  check("(2) ⭐ \"Rows waiting on a person\" is gone, and Needs you holds no outline box of its own", !/Rows waiting on a person/.test(txt(needs)) && !needs.querySelector("[data-hunt-college]"));

  const rows = Array.from(box.querySelectorAll("[data-hunt-college]"));
  check("(3) each hunted college is a row that names its still-taught courses",
    rows.length === hunted.length && hunted.every((c) => { const li = box.querySelector('[data-hunt-college="' + c.slug + '"]'); return li && c.still_taught.every((s) => txt(li).indexOf(s.course) >= 0); }), rows.map(txt).join(" | "));
  const aside = HUNT.colleges.filter((c) => !c.hunted);
  check("(3) a college with no still-taught course is not on the to-do", aside.length === 2 && aside.every((c) => !box.querySelector('[data-hunt-college="' + c.slug + '"]') && txt(box).indexOf(c.college) < 0));

  const links = Array.from(box.querySelectorAll("a.cmf-out"));
  check("(4) ⭐ each catalog address is a link that opens in a new tab, with rel=noopener, and its words are the address",
    links.length === hunted.length && links.every((a) => a.getAttribute("target") === "_blank" && /noopener/.test(a.getAttribute("rel") || "") && /^https?:\/\//.test(a.getAttribute("href")) && txt(a) === a.getAttribute("href")),
    links.map((a) => a.outerHTML).join(" "));
  check("(5) ⭐ the one line a person needs, word for word", /Send the PDF to COBIx in your Grok Bot chat\./.test(txt(box)));
  check("(5) the check opens the courses by college on College Data Collection", (function () { const a = box.querySelector('.cmf-act a[href="#collect/outlines-blocked"]'); return a && txt(a) === "The courses by college"; })());

  const y = load(withHunt((h) => { const g = h.colleges.filter((c) => c.slug === "grossmont")[0]; g.filed = true; h.open -= 1; h.still_taught_open -= g.still_taught.length; }));
  await y.M.boot(); await settle();
  const b2 = OUT(y.d);
  check("(6) ⭐ a filed college leaves the list, the count and Needs you", b2 && !b2.querySelector('[data-hunt-college="grossmont"]') && b2.querySelectorAll("[data-hunt-college]").length === hunted.length - 1
    && new RegExp("^" + (HUNT.still_taught_open - 1) + " courses still taught at " + (hunted.length - 1) + " colleges").test(line(b2))
    && !Array.from(y.d.querySelectorAll("#cmf-rank li")).some((l) => /Grossmont/.test(txt(l))), txt(b2));
  const z = load(withHunt((h) => { h.colleges.forEach((c) => { c.filed = true; }); h.open = 0; h.still_taught_open = 0; }));
  await z.M.boot(); await settle();
  const b3 = OUT(z.d);
  check("(6) every hunted college filed: the check says nothing waits, with no list and no send line, and Needs you names none",
    b3 && /^No still-taught course waits on an outline from a person\./.test(line(b3)) && !b3.querySelector("[data-hunt-college]") && !/Send the PDF/.test(txt(b3))
    && !Array.from(z.d.querySelectorAll("#cmf-rank li")).some((l) => /course outlines$/.test(txt(l.querySelector("a")))), txt(b3));

  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
  const failed = results.filter((r) => !r[1]).length;
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})();
