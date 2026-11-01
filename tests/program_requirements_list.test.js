// The Program Requirements List on the Catalog Commons' shared engine (Sam, 2026-11-01: "This new list view is so
// helpful that I want one now for each of our Catalog Commons groups"). Guards:
//   (1) #program-requirements/list opens the List: the sixth view word is selected, and the engine and COCI's program
//       list load through CPL_TABS.loadScript;
//   (2) one row per ACTIVE program, A to Z: an inactive program is left out, and a record on it is counted as off the
//       list rather than drawn;
//   (3) the columns are found by name: the college is the live table's name, never COCI's short one (a record joins
//       by control number, so "L.A. VALLEY" never has to match "Los Angeles Valley College"); the award in words; the
//       CIP family from the program's own CIP (no TOP column, CLAUDE.md Rule 7); units; Record, Machine checks and
//       Known issues from the index; no flag, edit, find and replace or AI sort (the List reads only);
//   (4) the filter words carry their counts and narrow to them;
//   (5) the finder reads a control number, COCI's short college name, a TOP code, and a name without its accent; a
//       column's own filter box narrows by that column;
//   (6) a numeric sort puts the largest first and the programs with no units last;
//   (7) the Record drawer names the checks in words and opens the record in Program records; the CIP family drawer
//       shows the TOP code as a search aid that decides nothing;
//   (8) the live read of COCI's active programs failing shows COCI's short names and says so;
//   (9) COCI's list failing to load says so, never "0 active programs";
//  (10) the real export: one row per Active control number (the headline's universe), the rows built once and reused,
//       and sorting and filtering 20,282 rows stays quick;
//  (11) no raw hex in the List's CSS.
// Run from repo root: `npm test` (or `node tests/program_requirements_list.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const SRC = fs.readFileSync("program_requirements.js", "utf8");
const COMMONS = fs.readFileSync("commons_progress.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const COCI_REAL = fs.readFileSync("coci_programs_data.js", "utf8");

const COCI = {
  _source: "tmc/source_data/coci_program_export_2026-06-17.csv (COCI program export, 2026-06-17)",
  colleges: ["L.A. VALLEY", "CERRITOS", "CANADA"],
  awards: ["A.A. Degree", "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", "A.S. T Degree", "Noncredit program"],
  statuses: ["Active", "Inactive"],
  rows: [
    [0, "10001", "Welding Technology", "0956.50", "48.0508", 1, 0, "18.00-24.00", 0, 1],
    [0, "10002", "Accounting", "0502.00", "52.0301", 0, 0, "60.00-60.00", 0, 1],
    [1, "10003", "Nursing", "1230.10", "51.3801", 0, 0, "", 0, 1],
    [1, "10004", "Art History", "1001.00", "", 2, 0, "18.00-18.00", 1, 0],
    [2, "10005", "English as a Second Language", "4930.84", "32.0109", 3, 0, "0.00-0.00", 0, 0],
    [1, "10006", "Old Program", "0101.00", "01.0000", 0, 1, "12.00-12.00", 0, 0]
  ]
};
const LIVE = { "10001": "Los Angeles Valley College", "10002": "Los Angeles Valley College", "10003": "Cerritos College",
  "10004": "Cerritos College", "10005": "Cañada College" };
function rec(college, ctl, title, checks) {
  return { college: college, control_number: ctl, program_title: title, checked: false, checks: checks, display: {}, _light: true };
}
const RECORDS = [
  rec("Los Angeles Valley College", "10001", "Welding Technology", { coverage: true, invented: true, arithmetic: "equal" }),
  rec("Los Angeles Valley College", "10002", "Accounting", { coverage: true, invented: true, arithmetic: "unequal" }),
  rec("Cerritos College", "10003", "Nursing (RN)", { coverage: false, invented: false, arithmetic: "equal" }),
  rec("Cerritos College", "10006", "Old Program", { coverage: true, invented: true, arithmetic: "equal" })
];

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="program-requirements-root"></div></body></html>',
    { url: "https://example.org/#program-requirements/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function () { return new Promise(function () {}); };
  [COMMONS, SRC].forEach(function (s) { const e = w.document.createElement("script"); e.textContent = s; w.document.body.appendChild(e); });
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push(s);
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "coci_programs_data.js" && !opts.noCoci) {
      if (opts.realCoci) { const e = w.document.createElement("script"); e.textContent = COCI_REAL; w.document.body.appendChild(e); }
      else w.CPL_COCI_PROGRAMS = JSON.parse(JSON.stringify(COCI));
    }
    setTimeout(cb, 0);
  } };
  const M = w.CPL_PROGRAM_REQUIREMENTS, S = M._state;
  M.activate();
  S.registry = []; S.records = opts.records || JSON.parse(JSON.stringify(RECORDS)); S.error = null; S.loading = false;
  S.progress = { active: opts.active != null ? opts.active : 5, activeKeys: {}, activeCollege: opts.noLive ? null : Object.assign({}, LIVE),
    errors: opts.noLive ? { active: "coci_college_programs answered 503" } : {}, readAt: new Date() };
  if (opts.noLive) S.progress.activeKeys = null;
  M._render();
  return { w: w, d: w.document, M: M, S: S, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".prl-table tbody tr:not(.prl-editrow)")); }
function heads(d) { return Array.from(d.querySelectorAll(".prl-table thead tr:first-child th")).map(txt); }
/* A column's cell by the column's name, never its position (the engine's rule, S541). */
function cell(d, tr, name) {
  const i = heads(d).findIndex((h) => h === name || h.indexOf(name + ",") === 0 || h.indexOf(name + " (") === 0);
  return i < 0 ? null : tr.children[i];
}
function rowOf(d, title) { return rows(d).find((r) => txt(cell(d, r, "Program")) === title); }
function words(d, re) { return Array.from(d.querySelectorAll("button")).find((b) => re.test(txt(b))); }

(async function () {
  const t = tab();
  await settle();
  const sel = t.d.querySelector('[role="tab"][aria-selected="true"]');
  check("(1) #program-requirements/list selects the List, the sixth view", t.d.querySelectorAll('[role="tab"]').length === 6
    && sel && sel.id === "prh-tab-list" && t.S.view === "list", sel && sel.id);
  check("(1) the engine and COCI's list load through CPL_TABS.loadScript", t.calls.indexOf("commons_list.js") >= 0
    && t.calls.indexOf("coci_programs_data.js") >= 0 && !!t.w.CPL_COMMONS_LIST);
  check("(1) the List word counts the active programs from the live read", /List\s*5$/.test(txt(sel)), txt(sel));
  let got = rows(t.d).map((r) => txt(cell(t.d, r, "Program")));
  check("(2) ⭐ one row per active program, A to Z, the inactive one left out", got.join("|") === "Accounting|Art History|English as a Second Language|Nursing|Welding Technology",
    got.join(" | "));
  const root = t.d.getElementById("program-requirements-root");
  check("(2) the lede counts as the headline does, and names the record on an inactive program",
    /5 at 3 colleges/.test(txt(root)) && /holds a record of 3/.test(txt(root)) && /1 of those pass the machine checks/.test(txt(root))
    && /1 record is on a program COCI does not list as active/.test(txt(root)), txt(root.querySelector(".prh-list")).slice(0, 400));

  const H = heads(t.d);
  check("(3) th scope=col headers in a labelled region, every column found by name",
    t.d.querySelectorAll(".prl-table thead tr:first-child th[scope='col']").length === H.length && !!t.d.querySelector(".prl-wrap[role='region'][aria-label]")
    && ["Program", "College", "Control number", "Award", "CIP family", "Units", "Record", "Machine checks", "Known issues"].every((n) => H.some((h) => h === n || h.indexOf(n + ",") === 0)),
    H.join(","));
  check("(3) no TOP column, no flag, no edit", !H.some((h) => /TOP/.test(h)) && H.indexOf("Flag") < 0 && H.indexOf("Edit") < 0 && !t.d.querySelector(".prl-cellin"));
  check("(3) the List reads only: no Find and replace, Edit every row or AI sort", !words(t.d, /^Find and replace$/) && !t.d.getElementById("prl-editall")
    && !t.d.getElementById("prl-ai") && !words(t.d, /^Edit$/));
  const weld = rowOf(t.d, "Welding Technology"), acct = rowOf(t.d, "Accounting"), nurse = rowOf(t.d, "Nursing"), art = rowOf(t.d, "Art History"), esl = rowOf(t.d, "English as a Second Language");
  check("(3) ⭐ the college is the live table's name, not COCI's short one", txt(cell(t.d, weld, "College")) === "Los Angeles Valley College"
    && txt(cell(t.d, esl, "College")) === "Cañada College", txt(cell(t.d, weld, "College")));
  check("(3) the award in words", txt(cell(t.d, weld, "Award")) === "Certificate of Achievement (16 to fewer than 30 units)"
    && txt(cell(t.d, art, "Award")) === "A.S.-T degree" && txt(cell(t.d, acct, "Award")) === "A.A. degree", txt(cell(t.d, weld, "Award")));
  check("(3) the CIP family from the program's own CIP, and none named where COCI holds none",
    txt(cell(t.d, weld, "CIP family")) === "48 · Precision Production" && txt(cell(t.d, art, "CIP family")) === "No CIP assigned yet");
  check("(3) units: the least, and none for a program listing zero or nothing", txt(cell(t.d, weld, "Units")) === "18"
    && txt(cell(t.d, esl, "Units")) === "—" && txt(cell(t.d, nurse, "Units")) === "—", [txt(cell(t.d, weld, "Units")), txt(cell(t.d, esl, "Units"))].join(","));
  check("(3) ⭐ Record, Machine checks and Known issues from the index", txt(cell(t.d, weld, "Record")) === "Read" && txt(cell(t.d, weld, "Machine checks")) === "Passes"
    && txt(cell(t.d, acct, "Machine checks")) === "Fails" && txt(cell(t.d, acct, "Known issues")) === "Units differ from the printed total"
    && /A listed course is not placed/.test(txt(cell(t.d, nurse, "Known issues"))) && /added that the state's list lacks/.test(txt(cell(t.d, nurse, "Known issues")))
    && txt(cell(t.d, art, "Record")) === "Not read yet" && txt(cell(t.d, art, "Machine checks")) === "—", txt(cell(t.d, nurse, "Known issues")));

  const fl = Array.from(t.d.querySelectorAll(".prl-filters button, .prl-filters span")).map(txt);
  check("(4) each filter word carries its count", fl.join("|") === "All (5)|Not read yet (2)|Read (3)|Pass the machine checks (1)|Fail a machine check (2)|Disagree with the state's course list (1)|Units do not add up (1)",
    fl.join(" | "));
  const expect = { "Not read yet": ["Art History", "English as a Second Language"], "Read": ["Accounting", "Nursing", "Welding Technology"],
    "Pass the machine checks": ["Welding Technology"], "Fail a machine check": ["Accounting", "Nursing"],
    "Disagree with the state's course list": ["Nursing"], "Units do not add up": ["Accounting"] };
  const bad = [];
  for (const k of Object.keys(expect)) {
    words(t.d, new RegExp("^" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " \\(")).click(); await settle();
    const g = rows(t.d).map((r) => txt(cell(t.d, r, "Program"))).join("|");
    if (g !== expect[k].join("|")) bad.push(k + ": " + g);
  }
  check("(4) ⭐ every filter narrows to what it counts", !bad.length, bad.join(" ; "));
  words(t.d, /^All \(/).click(); await settle();

  const q = t.d.getElementById("prl-find");
  async function find(v) { q.value = v; q.dispatchEvent(new t.w.Event("input")); await settle(); return rows(t.d).map((r) => txt(cell(t.d, r, "Program"))); }
  check("(5) the finder reads a control number", (await find("10003")).join("|") === "Nursing");
  check("(5) the finder reads COCI's short college name", (await find("L.A. VALLEY")).join("|") === "Accounting|Welding Technology");
  check("(5) the finder reads a TOP code, a search aid", (await find("0956.50")).join("|") === "Welding Technology");
  check("(5) the finder reads a name without its accent", (await find("canada")).join("|") === "English as a Second Language");
  check("(5) the finder reads the catalog's own name for a record", (await find("(RN)")).join("|") === "Nursing");
  await find("");
  const ci = heads(t.d).findIndex((h) => h === "College");
  const cf = t.d.getElementById("prl-cf-" + (ci - 1));
  cf.value = "cerritos"; cf.dispatchEvent(new t.w.Event("input")); await settle();
  check("(5) the College filter box narrows by college", rows(t.d).map((r) => txt(cell(t.d, r, "Program"))).join("|") === "Art History|Nursing");
  cf.value = ""; cf.dispatchEvent(new t.w.Event("input")); await settle();

  const ui = heads(t.d).findIndex((h) => h === "Units");
  t.d.querySelectorAll(".prl-sort")[ui - 1].click(); await settle();
  t.d.querySelectorAll(".prl-sort")[ui - 1].click(); await settle();
  got = rows(t.d).map((r) => txt(cell(t.d, r, "Program")));
  check("(6) Units high to low: the largest first, a tie A to Z, no units last", got.join("|") === "Accounting|Art History|Welding Technology|English as a Second Language|Nursing",
    got.join(" | "));
  words(t.d, /^Clear the sort$/).click(); await settle();

  cell(t.d, rowOf(t.d, "Welding Technology"), "CIP family").querySelector("button").click(); await settle();
  let drawer = t.d.querySelector(".prl-drawer");
  check("(7) the CIP family drawer shows the TOP code as a search aid that decides nothing", !!drawer && /CIP 48\.0508/.test(txt(drawer))
    && /TOP code 0956\.50/.test(txt(drawer)) && /decides nothing/.test(txt(drawer)), txt(drawer));
  cell(t.d, rowOf(t.d, "Accounting"), "Record").querySelector("button").click(); await settle();
  drawer = t.d.querySelector(".prl-drawer");
  check("(7) the Record drawer names the checks in words", !!drawer && /Units: they differ from the printed total/.test(txt(drawer))
    && /Courses: every listed course placed/.test(txt(drawer)) && /Not yet confirmed by a person/.test(txt(drawer)), txt(drawer));
  words(t.d, /^Open the record in Program records$/).click(); await settle();
  check("(7) ⭐ Open the record opens it in Program records, its college picked and its number searched",
    t.S.view === "records" && t.S.rq === "10002" && (t.S.pick || []).indexOf("Los Angeles Valley College") >= 0
    && t.S.open["Los Angeles Valley College|10002"] === true, JSON.stringify({ v: t.S.view, rq: t.S.rq, pick: t.S.pick }));
  t.S.view = "list"; t.M._render(); await settle();
  cell(t.d, rowOf(t.d, "Art History"), "Record").querySelector("button").click(); await settle();
  drawer = t.d.querySelector(".prl-drawer");
  check("(7) an unread program's drawer says the harvest holds no record, and offers none to open", /holds no record of this program yet/.test(txt(drawer))
    && !words(t.d, /^Open the record in Program records$/), txt(drawer));

  const u = tab({ noLive: true });
  await settle();
  check("(8) the live read failing shows COCI's short name and says so", txt(cell(u.d, rowOf(u.d, "Welding Technology"), "College")) === "L.A. VALLEY"
    && /live read of COCI's active programs did not arrive \(coci_college_programs answered 503\)/.test(txt(u.d.getElementById("program-requirements-root"))));
  const v = tab({ noCoci: true });
  await settle();
  const vr = v.d.getElementById("program-requirements-root");
  check("(9) ⭐ COCI's list failing says so, and draws no table and no zero", !!vr.querySelector('[role="alert"]') && /coci_programs_data\.js did not arrive/.test(txt(vr))
    && !vr.querySelector(".prl-table") && !/0 active programs/.test(txt(vr)), txt(vr.querySelector(".prh-list")));
  const drift = tab({ active: 6 });
  await settle();
  check("(8) a live count that differs from the export's says so", /live table lists 6 active programs and the export 5/.test(txt(drift.d.getElementById("program-requirements-root"))));

  // (10) The real export: 20,282 Active control numbers on 2026-11-01, one row each.
  const real = (function () { const w0 = {}; new Function("window", COCI_REAL)(w0); return w0.CPL_COCI_PROGRAMS; })();
  const ACT = real.statuses.indexOf("Active"), actRows = real.rows.filter((r) => r[6] === ACT);
  const ctls = new Set(actRows.map((r) => String(r[1])));
  const recs = [];
  actRows.forEach((r, i) => { if (i % 5) recs.push(rec("College " + r[0], String(r[1]), r[2], { coverage: i % 7 !== 0, invented: true, arithmetic: i % 9 ? "equal" : "unequal" })); });
  const x = tab({ realCoci: true, records: recs, active: actRows.length });
  x.S.progress.activeCollege = null;
  x.M._render();
  await settle();
  const all = x.M._listRows();
  check("(10) ⭐ the real export: one row per Active control number (the headline's universe), control numbers unique",
    all.length === actRows.length && ctls.size === actRows.length && new RegExp(actRows.length.toLocaleString("en-US") + " active programs").test(txt(x.d.querySelector(".prl-count"))),
    all.length + " rows, " + ctls.size + " control numbers, " + actRows.length + " active");
  check("(10) the rows are built once and reused while the index stands", x.M._listRows() === all);
  const api = x.M._listApi(), L = api.state();
  function timed(fn) { const a = Date.now(); fn(); return Date.now() - a; }
  const ms = [];
  L.sort = [{ col: 1, dir: 1 }, { col: 0, dir: 1 }]; ms.push(timed(() => api.rows()));
  L.q = "nursing"; ms.push(timed(() => api.rows()));
  L.q = ""; L.f = "fail"; ms.push(timed(() => api.rows()));
  L.f = ""; L.sort = [{ col: 0, dir: 1 }];
  // A generous ceiling (measured about 50 to 80 ms each in jsdom, 2026-11-01): it catches a rebuild per keystroke or per
  // row, not a slow machine.
  check("(10) sorting and filtering 20,282 rows stays quick", Math.max.apply(null, ms) < 2000, ms.join(", ") + " ms");

  check("(11) no raw hex in the List's CSS", !/#[0-9a-fA-F]{3,6}\b/.test(txt(t.d.getElementById("prl-css"))));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
