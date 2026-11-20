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
//       class and its rule), whose press opens the panel;
//   (6) ⭐ the closest M-ID (Sam, same day: "a new column with your recommended closest mid ... to get a confidence
//       score ... with a link to open a sidebar to curate"): the column shows it with a confidence the builder
//       measured, the panel says why and how it was measured, a course with a C-ID or CCN never gets one, a low
//       confidence says a new M-ID is the likely answer, and nothing in the panel saves.
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

// kb/coci_closest_mid.json in its filed shape: control number -> [confidence, band, [[M-ID, score, same title, of, catalog]]].
const CLOSEST = { identity_file: "2026-11-20 06:20", measure: { bands: [{ n: 168, right: 3 }, { n: 557, right: 69 }, { n: 962, right: 225 }, { n: 1052, right: 399 }, { n: 820, right: 406 },
  { n: 645, right: 610 }, { n: 1793, right: 1656 }] },
  rows: { CCC3: [0.924, 6, [["ELEC M1300", 0.91, 4, 6, 0.42], ["ELEC M1301", 0.6, 0, 3, null]]], CCC4: [0.124, 1, [["LRNA M9001", 0.41, 0, 1, null]]],
    CCC1: [0.946, 5, [["ENGL M1001", 0.8, 9, 9, 0.5]]] } };
function tab(hash, opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (hash || "#coci-lookup"), runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function (url) {
    if (/coci_closest_mid\.json/.test(String(url))) return opts.noClosest ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
      : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(CLOSEST))) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
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

  // ── (6) the closest M-ID: a column that sorts by a measured confidence, and the panel's reasons ──
  t = tab("#coci-lookup/list/nomid"); await sleep(60);
  d = t.d;
  function closestCol(tr) { return tr.children[heads(d).findIndex((h) => h.indexOf("Closest M-ID") === 0) + 1]; }
  const byTitle = {}; dataRows(d).forEach((tr) => { byTitle[txt(titleCell(tr, d))] = tr; });
  const appr = byTitle["4th Year Commercial Electrical Apprenticeship I"], tutor = byTitle["Academic Assistance and Tutoring"];
  check("(6) ⭐ a course in the pile shows its closest M-ID with the measured confidence",
    txt(closestCol(appr)) === "ELEC M1300, 92%" && txt(closestCol(tutor)) === "LRNA M9001, 12%", txt(closestCol(appr)) + " | " + txt(closestCol(tutor)));
  check("(6) the recommendation is drawn as a dashed chip, never as an identity the course holds",
    !!closestCol(appr).querySelector(".cplcoci-chip.rec") && !closestCol(appr).querySelector(".cplcoci-chip.mid") && /\.cplcoci-chip\.rec \{[^}]*border-style: dashed/.test(SRC));
  titleCell(appr, d).querySelector("button").click(); await sleep(20);
  const pn = txt(panel(d));
  check("(6) ⭐ the panel lists the closest common courses with why, and how the confidence was measured",
    /Closest common courses/.test(pn) && /ELEC M1300: score 0\.91, confidence 92%\. 4 of its 6 local courses carry this same title; catalog descriptions overlap 42%\./.test(pn)
      && /ELEC M1301: score 0\.60\. none of its 3 local courses carries this same title\./.test(pn)
      && /1,793 courses that hold an M-ID scored in this band when taken out of their own common course, and the first recommendation was their own M-ID for 1,656 of them \(92%\)\./.test(pn), pn.slice(0, 700));
  check("(6) each recommended common course is one word from SkyView, and the panel says nothing is saved",
    panel(d).querySelectorAll(".ccl-rec-list li a[href*='skyview.html#outline/']").length === 2 && /A recommendation saves nothing\./.test(pn));
  check("(6) no control in the panel assigns the course (the save waits on the build change)", !Array.from(panel(d).querySelectorAll("button")).some((b) => /assign/i.test(txt(b))));
  titleCell(tutor, d).querySelector("button").click(); await sleep(20);
  check("(6) ⭐ a low confidence says in words that the course most likely needs a new M-ID",
    /LRNA M9001: score 0\.41, confidence 12%/.test(txt(panel(d))) && /A confidence this low most often means no common course fits and the course needs a new M-ID\./.test(txt(panel(d))), txt(panel(d)).slice(0, 500));
  word(d, /^All \(5\)$/).click(); await sleep(20);
  const all = {}; dataRows(d).forEach((tr) => { all[txt(titleCell(tr, d))] = tr; });
  check("(6) ⭐ a course that carries a CCN gets no recommendation, even when the file holds one for it",
    txt(closestCol(all["Academic Reading and Writing"])) === "—" && txt(closestCol(all["Welding I"])) === "—", txt(closestCol(all["Academic Reading and Writing"])));
  t = tab("#coci-lookup/list/nomid", { noClosest: true }); await sleep(60);
  d = t.d;
  check("(6) with the file missing the column is blank and the pile still lists", dataRows(d).length === 2 && dataRows(d).every((tr) => txt(closestCol(tr)) === "—"));
  // the committed file: its shape, and a confidence that is a measured band's
  const F = JSON.parse(fs.readFileSync("kb/coci_closest_mid.json", "utf8"));
  const fr = Object.keys(F.rows);
  check("(6) the committed file holds one row per recommended course, each with a band the measure names",
    fr.length === F.recommended && fr.length > 0 && fr.every((k) => Array.isArray(F.rows[k]) && F.rows[k][2].length >= 1 && F.rows[k][2].length <= 3 && F.measure.bands[F.rows[k][1]] && F.rows[k][0] === F.measure.bands[F.rows[k][1]].confidence),
    fr.length + " rows");
  check("(6) ⭐ the measure is filed with its counts, and the top bands were right nine times in ten",
    F.measure.sampled >= 5000 && F.measure.bands.length === 7 && F.measure.bands.every((b) => b.right <= b.n) && F.measure.bands.slice(5).every((b) => b.n >= 300 && b.confidence >= 0.9),
    JSON.stringify(F.measure.bands.slice(5)));

  const bad = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ✓ " : "  ✗ ") + r[0] + (r[1] || !r[2] ? "" : "\n      " + String(r[2]).slice(0, 400))));
  console.log("\ncoci_list_needs_mid: " + (results.length - bad.length) + "/" + results.length + " checks passed");
  process.exit(bad.length ? 1 : 0);
})();
