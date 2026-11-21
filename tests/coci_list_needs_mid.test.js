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
//       score ... with a link to open a sidebar to curate"; and COBIx's note he relayed: three levels in place of a raw
//       score, and "Propose new M-ID" when a course has no strong match): the column shows the M-ID with its level in
//       words, the panel says how the level was measured and why each of the closest is close, a course with a C-ID
//       or CCN never gets one, and signed out nothing in the panel saves;
//   (7) ⭐ the pile opens in the order the exhibit titles need (COBIx, relayed by Sam, 2026-11-20: "sort the pile by how
//       many exhibits each M-ID would unlock, so Group Communication, with 67 links, comes first"): a strong or possible
//       match with more exhibit links above one with fewer, a strong match before a possible one at the same count, a
//       No strong match row below them all however linked its candidate, the count in words beside the M-ID, a header
//       press the person's own sort, and the fixture's links map in the shape kb/_closest_mid.py writes.
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

// kb/coci_closest_mid.json in its filed shape: control number -> [confidence, band, [[M-ID, score, same title, of, catalog]]],
// and the three levels the builder measured (each a run of score bands).
const CLOSEST = { identity_file: "2026-11-20 06:20", measure: { levels: [
  { key: "strong", label: "Strong match", bands: [5, 6], n: 2438, right: 2266, share: 0.929 },
  { key: "possible", label: "Possible match", bands: [3, 4], n: 1872, right: 805, share: 0.43 },
  { key: "none", label: "No strong match", bands: [0, 1, 2], n: 1687, right: 297, share: 0.176 }] },
  rows: { CCC3: [0.924, 6, [["ELEC M1300", 0.91, 4, 6, 0.42], ["ELEC M1301", 0.6, 0, 3, null]]], CCC4: [0.124, 1, [["LRNA M9001", 0.41, 0, 1, null]]],
    CCC1: [0.946, 5, [["ENGL M1001", 0.8, 9, 9, 0.5]]] } };
function tab(hash, opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (hash || "#coci-lookup"), runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(opts.lookup || LOOKUP));
  w.fetch = function (url) {
    if (/coci_closest_mid\.json/.test(String(url))) return opts.noClosest ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
      : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opts.closest || CLOSEST))) });
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
  check("(6) ⭐ a strong match shows its M-ID and the level in words; no strong match offers a new M-ID; no raw score shows",
    txt(closestCol(appr)) === "ELEC M1300, strong match" && txt(closestCol(tutor)) === "Propose a new M-ID" && !/0\.\d\d|\d%/.test(txt(closestCol(appr)) + txt(closestCol(tutor))),
    txt(closestCol(appr)) + " | " + txt(closestCol(tutor)));
  check("(6) the recommendation is drawn as a dashed chip, never as an identity the course holds",
    !!closestCol(appr).querySelector(".cplcoci-chip.rec") && !closestCol(appr).querySelector(".cplcoci-chip.mid") && /\.cplcoci-chip\.rec \{[^}]*border-style: dashed/.test(SRC));
  titleCell(appr, d).querySelector("button").click(); await sleep(20);
  const pn = txt(panel(d));
  check("(6) ⭐ the panel names the level, how it was measured, and why each of the closest is close",
    /Closest common courses/.test(pn) && /Strong match: ELEC M1300\. Of 2,438 courses with a known M-ID that scored at this level when taken out of their own common course, 2,266 \(93%\) had their own M-ID come first\./.test(pn)
      && /ELEC M1300: 4 of its 6 local courses carry this same title; catalog descriptions overlap 42%\./.test(pn) && /ELEC M1301: none of its 3 local courses carries this same title\./.test(pn)
      && panel(d).querySelector("[data-rec-level]").getAttribute("data-rec-level") === "strong", pn.slice(0, 700));
  check("(6) each of the closest is one word from SkyView, and signed out the panel offers no save (tests/coci_list_assign.test.js guards the save)",
    panel(d).querySelectorAll(".ccl-rec-list li a[href*='skyview.html#outline/']").length === 2 && !panel(d).querySelector("[data-assign]")
      && /Assigning saves one row under your name/.test(pn));
  check("(6) signed out, no control in the panel assigns the course or mints an M-ID", !Array.from(panel(d).querySelectorAll("button")).some((b) => /assign|propose/i.test(txt(b))));
  titleCell(tutor, d).querySelector("button").click(); await sleep(20);
  check("(6) ⭐ no strong match says so, offers a new M-ID, and still lists the closest for reference",
    /No strong match\. Propose a new M-ID\. The closest are listed for reference\. Of 1,687 courses .* 297 \(18%\) had their own M-ID come first\./.test(txt(panel(d))) && /LRNA M9001: none of its 1 local course carries this same title\./.test(txt(panel(d))), txt(panel(d)).slice(0, 600));
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
  check("(6) the committed file names three levels that cover every band once, each with its measured share and its count on the pile",
    F.measure.levels.length === 3 && F.measure.levels.map((l) => l.key).join() === "strong,possible,none" && [].concat(...F.measure.levels.map((l) => l.bands)).sort().join() === "0,1,2,3,4,5,6"
      && F.measure.levels.every((l) => l.right <= l.n && l.share === Math.round(l.right / l.n * 1000) / 1000) && F.measure.levels.reduce((n, l) => n + l.pile, 0) === F.pile
      && F.measure.levels[0].share >= 0.9 && F.measure.levels[2].share < 0.3, JSON.stringify(F.measure.levels));
  check("(6) the committed file holds one row per recommended course, each with a band the measure names",
    fr.length === F.recommended && fr.length > 0 && fr.every((k) => Array.isArray(F.rows[k]) && F.rows[k][2].length >= 1 && F.rows[k][2].length <= 3 && F.measure.bands[F.rows[k][1]] && F.rows[k][0] === F.measure.bands[F.rows[k][1]].confidence),
    fr.length + " rows");
  check("(6) ⭐ the measure is filed with its counts, and the top bands were right nine times in ten",
    F.measure.sampled >= 5000 && F.measure.bands.length === 7 && F.measure.bands.every((b) => b.right <= b.n) && F.measure.bands.slice(5).every((b) => b.n >= 300 && b.confidence >= 0.9),
    JSON.stringify(F.measure.bands.slice(5)));

  // ── (7) the pile's order: the exhibits each closest M-ID would unlock ──
  // A fixture, never the live worklist (p-test-tied-to-a-live-worklist-2026-11-20). Six pile courses; the links map
  // is the builder's: M-ID -> exhibit links, only M-IDs a row names, only those with a link.
  const PILE = { _built_at: "2026-11-20", colleges: ["Citrus College", "Hartnell College"], rows: [
    [0, "P1", "SPCH", "10", "Aardvark Studies", 3, "C", "", "", "", ""],
    [0, "P2", "SPCH", "20", "Argumentation", 3, "C", "", "", "", ""],
    [1, "P3", "SPCH", "30", "Debate", 3, "C", "", "", "", ""],
    [1, "P4", "SPCH", "40", "Group Communication", 3, "C", "", "", "", ""],
    [0, "P5", "SPCH", "50", "Interpersonal Communication", 3, "C", "", "", "", ""],
    [1, "P6", "SPCH", "60", "Persuasion", 3, "C", "", "", "", ""]] };
  const PILE_CLOSEST = { identity_file: "2026-11-20 06:20", measure: CLOSEST.measure,
    rows: { P1: [0.124, 1, [["COMM M1037", 0.41, 0, 6, null]]], P2: [0.946, 5, [["COMM M1040", 0.8, 3, 5, null]]],
      P3: [0.379, 3, [["COMM M1041", 0.6, 1, 4, null]]], P4: [0.379, 3, [["COMM M1037", 0.62, 2, 6, null], ["COMM M1041", 0.5, 0, 4, null]]],
      P5: [0.924, 6, [["COMM M1042", 0.9, 4, 4, null]]], P6: [0.495, 4, [["COMM M1043", 0.7, 1, 2, null]]] },
    links: { "COMM M1037": 67, "COMM M1040": 5, "COMM M1041": 5, "COMM M1043": 1 } };
  t = tab("#coci-lookup/list/nomid", { lookup: PILE, closest: PILE_CLOSEST }); await sleep(60);
  d = t.d;
  const order = () => dataRows(d).map((tr) => txt(titleCell(tr, d)));
  const want = ["Group Communication", "Argumentation", "Debate", "Persuasion", "Interpersonal Communication", "Aardvark Studies"];
  check("(7) ⭐ the pile opens most-linked first: Group Communication's 67 above five, strong before possible at five, one, none, then No strong match",
    order().join("|") === want.join("|"), order().join("|"));
  check("(7) ⭐ a No strong match row sorts below every match, though its candidate carries 67 links",
    order().indexOf("Aardvark Studies") === order().length - 1);
  const pr = {}; dataRows(d).forEach((tr) => { pr[txt(titleCell(tr, d))] = txt(closestCol(tr)); });
  check("(7) ⭐ the count reads in words beside the M-ID, singular for one, nothing when zero or no strong match",
    pr["Group Communication"] === "COMM M1037, possible match, 67 exhibit links" && pr["Argumentation"] === "COMM M1040, strong match, 5 exhibit links"
      && pr["Persuasion"] === "COMM M1043, possible match, 1 exhibit link" && pr["Interpersonal Communication"] === "COMM M1042, strong match"
      && pr["Aardvark Studies"] === "Propose a new M-ID", JSON.stringify(pr));
  check("(7) the figure is plain text: no COBI view lists an M-ID's exhibits, so it opens nothing",
    dataRows(d).every((tr) => !closestCol(tr).querySelector("a") && Array.from(closestCol(tr).querySelectorAll(".cplcoci-chip.rec")).every((c) => !c.children.length)));
  check("(7) the sort line says the pile is sorted by the Closest M-ID, high to low",
    /sorted by Closest M-ID, high to low/.test(txt(d.getElementById(P + "sortline"))), txt(d.getElementById(P + "sortline")));
  titleCell(dataRows(d).find((tr) => txt(titleCell(tr, d)) === "Group Communication"), d).querySelector("button").click(); await sleep(20);
  check("(7) the panel gives each candidate's links too", /COMM M1037: 2 of its 6 local courses carry this same title; 67 exhibit links point to it\./.test(txt(panel(d))), txt(panel(d)).slice(0, 500));
  Array.from(d.querySelectorAll("." + P + "sort")).find((b) => /^Title/.test(txt(b))).click(); await sleep(20);
  check("(7) ⭐ a person's header press wins for the visit: Title sorts the pile A to Z",
    order().join("|") === want.slice().sort().join("|"), order().join("|"));
  word(d, /^All \(6\)$/).click(); await sleep(20); word(d, /^Needs an M-ID \(6\)$/).click(); await sleep(20);
  check("(7) and it holds when the person comes back to the pile in the same visit", order().join("|") === want.slice().sort().join("|"), order().join("|"));
  t = tab("#coci-lookup/courses", { lookup: PILE, closest: PILE_CLOSEST }); await sleep(60);
  d = t.d;
  check("(7) outside the pile the List keeps its title order", order().join("|") === want.slice().sort().join("|"), order().join("|"));
  // The fixture's links map is the builder's shape: the committed file names links per recommended M-ID.
  const lk = F.links || {}, named = new Set([].concat(...Object.values(F.rows).map((r) => r[2].map((x) => x[0]))));
  check("(7) ⭐ the committed file's links are M-ID -> a positive count, only for M-IDs a row recommends, and its shape says so",
    Object.keys(lk).length > 0 && Object.entries(lk).every(([m, n]) => named.has(m) && Number.isInteger(n) && n > 0)
      && /links: M-ID: exhibit links/.test(F.row_shape) && F.links_moved_by_alias_chain === 0 && /^[0-9a-f]{64}$/.test(F.fingerprint || ""),
    Object.keys(lk).length + " " + F.row_shape);
  check("(7) the fixture uses the same shape", Object.entries(PILE_CLOSEST.links).every(([m, n]) => Number.isInteger(n) && n > 0
    && Object.values(PILE_CLOSEST.rows).some((r) => r[2].some((x) => x[0] === m))));

  const bad = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ✓ " : "  ✗ ") + r[0] + (r[1] || !r[2] ? "" : "\n      " + String(r[2]).slice(0, 400))));
  console.log("\ncoci_list_needs_mid: " + (results.length - bad.length) + "/" + results.length + " checks passed");
  process.exit(bad.length ? 1 : 0);
})();
