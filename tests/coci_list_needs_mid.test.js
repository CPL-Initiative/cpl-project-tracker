// The Courses List's one gap pile, "Needs an M-ID" (Sam, 2026-11-20, working the Commons' needs-attention list: "the
// course list was filtered correctly but includes courses with cid and ccn, which don't need a mid ... also need
// links to sidebar to take action on assigning to a mid").
//
// WHAT THIS GUARDS (each a way the pile could send a person to work that is not there, or hide the way in):
//   (1) ⭐ a course that carries a C-ID or a CCN and no M-ID is NOT in the pile, and the pile's count leaves it out;
//   (2) the pile is the courses with no M-ID, no C-ID and no CCN, and it is the only gap chip (no "No M-ID", no
//       "No identity");
//   (3) the old address #coci-lookup/list/none still opens the pile, and #coci-lookup/list/nomid does;
//   (4) the panel of a course with a CCN and no M-ID says no M-ID is needed, never that one is missing; the panel of a
//       course in the pile still says it has none;
//   (5) ⭐ each title is the way into the side panel and reads as a link: a button underlined at rest (the tlink
//       class and its rule), whose press opens the panel.
// Run from repo root: `npm test` (or `node tests/coci_list_needs_mid.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

// rows: [collegeIdx, ctrl, subj, num, title, units, credit, top, cid, ccn, mid (the extract's)]
const LOOKUP = {
  _built_at: "2026-11-20",
  colleges: ["Citrus College", "Hartnell College", "Woodland Community College"],
  rows: [
    [0, "CCC1", "ENGL", "C1000E", "Academic Reading and Writing", 5, "C", "1501.00: English", "", "ENGL C1000E", ""],
    [1, "CCC2", "COMM", "110", "Public Speaking", 3, "C", "1506.00: Speech Communication", "COMM 110", "", ""],
    [1, "CCC3", "APP", "126", "4th Year Commercial Electrical Apprenticeship I", 4, "C", "0952.20: Electrical", "", "", ""],
    [2, "CCC4", "LEARN", "502", "Academic Assistance and Tutoring", 0, "N", "4930.09: Supervised Tutoring", "", "", ""],
    [0, "CCC5", "WELD", "110", "Welding I", 3, "C", "0956.50: Welding Technology", "", "", ""]
  ]
};
const MEMBERS = { generated_at: "2026-11-20 06:20", colleges: ["Citrus College", "Hartnell College", "Woodland Community College"],
  members: { "WELD M1109": [{ c: 0, cn: "CCC5" }] } };

function tab(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (hash || "#coci-lookup"), runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function () { return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }); };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    setTimeout(cb, 0);
  } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P = "ccl-";
function dataRows(d) { return Array.from(d.querySelectorAll("." + P + "table tbody tr")).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow")); }
function heads(d) { return Array.from(d.querySelectorAll("." + P + "table thead th")).map((th) => txt(th.querySelector("." + P + "sort"))).filter(Boolean); }
function titleCell(tr, d) { return tr.children[heads(d).findIndex((h) => h.indexOf("Title") === 0) + 1]; }
function titles(d) { return dataRows(d).map((tr) => txt(titleCell(tr, d))).sort(); }
function words(d) { return Array.from(d.querySelectorAll("." + P + "filters button, ." + P + "filters [aria-current]")).map(txt); }
function word(d, re) { return Array.from(d.querySelectorAll("button")).find((b) => re.test(txt(b))); }
function panel(d) { return d.getElementById(P + "panel"); }

(async () => {
  let t = tab("#coci-lookup/courses");
  await sleep(40);
  let d = t.d, fw = words(d);
  // ── (1) and (2) the pile and its count ──
  check("(1) ⭐ the pile counts the two courses with no M-ID, C-ID or CCN, and leaves out the two that carry a C-ID or a CCN",
    fw.indexOf("Needs an M-ID (2)") >= 0 && fw.indexOf("Has any identity (3)") >= 0 && fw.indexOf("Has an M-ID (1)") >= 0, fw.join(" | "));
  check("(2) it is the only gap chip", !fw.some((x) => /^No M-ID|^No identity/.test(x)), fw.join(" | "));
  word(d, /^Needs an M-ID \(2\)$/).click(); await sleep(20);
  check("(1) ⭐ the pile lists those two courses alone",
    titles(d).join("|") === "4th Year Commercial Electrical Apprenticeship I|Academic Assistance and Tutoring", titles(d).join("|"));
  check("(2) the chosen pile is marked current", txt(d.querySelector("." + P + "filters [aria-current]")) === "Needs an M-ID (2)");

  // ── (5) the title is a link into the side panel ──
  const first = dataRows(d)[0], btn = titleCell(first, d).querySelector("button");
  check("(5) ⭐ each title is a button that reads as a link", !!btn && btn.classList.contains(P + "tlink") && /open its panel$/.test(btn.getAttribute("aria-label")),
    btn && btn.className + " | " + btn.getAttribute("aria-label"));
  check("(5) the engine underlines such a title at rest, in the link color",
    /\.ccl-tlink\{color:var\(--accent-link\);text-decoration:underline/.test(txt(d.getElementById(P + "css"))));
  check("(5) only the title carries it, not the other cells", dataRows(d).every((tr) => tr.querySelectorAll("." + P + "tlink").length === 1));
  btn.click(); await sleep(20);
  check("(5) pressing it opens the course's side panel", !!panel(d) && /^Course: /.test(txt(panel(d).querySelector("#" + P + "panel-t"))), panel(d) && txt(panel(d)).slice(0, 120));
  // ── (4) the panel's words ──
  check("(4) a course in the pile says it has no M-ID", /No M-ID: the Common Course Reference holds this course in no common course today/.test(txt(panel(d))), txt(panel(d)).slice(0, 300));
  word(d, /^Has a CCN \(1\)$/).click(); await sleep(20);
  titleCell(dataRows(d)[0], d).querySelector("button").click(); await sleep(20);
  check("(4) ⭐ a course with a CCN and no M-ID says none is needed, never that one is missing",
    /No M-ID is needed: this course carries CCN ENGL C1000E, which is its common identity\./.test(txt(panel(d))) && !/holds this course in no common course/.test(txt(panel(d))), txt(panel(d)).slice(0, 300));
  word(d, /^Has a C-ID \(1\)$/).click(); await sleep(20);
  titleCell(dataRows(d)[0], d).querySelector("button").click(); await sleep(20);
  check("(4) and so does a course with a C-ID", /No M-ID is needed: this course carries C-ID COMM 110, which is its common identity\./.test(txt(panel(d))), txt(panel(d)).slice(0, 300));

  // ── (3) the addresses ──
  t = tab("#coci-lookup/list/none"); await sleep(40);
  check("(3) the old No identity address opens the pile", txt(t.d.querySelector("." + P + "filters [aria-current]")) === "Needs an M-ID (2)" && titles(t.d).length === 2,
    txt(t.d.querySelector("." + P + "filters [aria-current]")));
  t = tab("#coci-lookup/list/nomid"); await sleep(40);
  check("(3) the Commons' own link opens it too", txt(t.d.querySelector("." + P + "filters [aria-current]")) === "Needs an M-ID (2)" && titles(t.d).length === 2,
    txt(t.d.querySelector("." + P + "filters [aria-current]")));
  check("(3) the Commons links to the pile by its name", /a\("#coci-lookup\/list\/nomid", "Needs an M-ID filter"\)/.test(fs.readFileSync("commons_front.js", "utf8")));

  const bad = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ✓ " : "  ✗ ") + r[0] + (r[1] || !r[2] ? "" : "\n      " + String(r[2]).slice(0, 400))));
  console.log("\ncoci_list_needs_mid: " + (results.length - bad.length) + "/" + results.length + " checks passed");
  process.exit(bad.length ? 1 : 0);
})();
