// Program records' card, carried into the Program Requirements List's side panel before that view retires (S574; the
// List norms, "A reference's original views retire once its List does everything they do, one PR each"). Guards:
//   (1) a read record's panel carries the card's checks in full (Courses, Off the state list, Units, Person's reading)
//       and its CPL line, under Its checks;
//   (2) the flags for the reading procedure, each saying where it sits, and each course row's flag mark;
//   (3) each course's C-ID, CCN or M-ID chip, and its CPL here number as the word that opens its exhibits;
//   (4) Side by side opens the record beside its catalog page; a light record carries no Side by side word;
//   (5) a signed-in reviewer gets Your reading's Confirm and Needs a fix: Confirm posts the one write, the state line
//       says so, and the Confirmed by a person count moves without a new build;
//   (6) a visitor gets the reviewers' sign-in, and a sign-in whose read failed says Confirm is left out;
//   (7) Waiting on your reading is offered to a reviewer only, and #program-requirements/list/waiting and /checked open
//       those filters;
//   (8) the careers, the source line and the notes for the reading procedure fold below;
//   (9) no raw hex and no glyph in the panel's code;
//  (10) a record on a program COCI does not list as active is a row under its own filter only, never under All or Pass
//       (PR 2 of 3: every way in opens the List);
//  (11) a reviewer on Waiting gets Read the first waiting record side by side, and the next record follows the List's order;
//  (12) the dropdowns over the List (District, College, SWP Region, CIP Sector, Sam 2026-10-14) narrow the rows and the
//       filter counts, and Clear the filters lifts them;
//  (13) a call's Open it in the List searches the record and opens its panel; a count clears the scope it did not set;
//  (14) a record with items for the college points to its drafts on Catalogs.
// Run from repo root: `npm test` (or `node tests/program_requirements_list_record_port.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const SRC = fs.readFileSync("program_requirements.js", "utf8");
const COMMONS = fs.readFileSync("commons_progress.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const PAGE_SRC = fs.readFileSync("commons_page.js", "utf8");

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
    { url: "https://example.org/" + (opts.hash || "#program-requirements/list"), runScripts: "dangerously" });
  const w = dom.window, calls = [];
  const reads = [];
  w.fetch = function (url, init) {
    url = String(url);
    if (opts.onFetch) { const got = opts.onFetch(url, init, reads); if (got) return got; }
    if (url.indexOf("kb/status/commons.json") >= 0) {
      reads.push(url);
      if (opts.commons) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opts.commons))) });
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    }
    if (opts.recordsFail && /program_requirement_records.*control_number=in\./.test(url)) { reads.push(url); return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}), text: () => Promise.resolve("") }); }
    return new Promise(function () {});
  };
  [COMMONS, SRC].forEach(function (s) { const e = w.document.createElement("script"); e.textContent = s; w.document.body.appendChild(e); });
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push(s);
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "coci_programs_data.js" && !opts.noCoci) {
      w.CPL_COCI_PROGRAMS = JSON.parse(JSON.stringify(COCI));
    }
    if (s === "commons_page.js" && opts.modules) { const e = w.document.createElement("script"); e.textContent = PAGE_SRC; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  const M = w.CPL_PROGRAM_REQUIREMENTS, S = M._state;
  M.activate();
  S.registry = []; S.records = opts.records || JSON.parse(JSON.stringify(RECORDS)); S.error = null; S.loading = false;
  S.progress = { active: opts.active != null ? opts.active : 5, activeKeys: {}, activeCollege: opts.noLive ? null : Object.assign({}, LIVE),
    errors: opts.noLive ? { active: "coci_college_programs answered 503" } : {}, readAt: new Date() };
  if (opts.noLive) S.progress.activeKeys = null;
  if (opts.setup) opts.setup(S);
  if (opts.review) S.review = { email: "sam@rccd.edu", records: S.records, verdicts: [], todos: [], error: null };
  if (opts.reviewError) S.review = { email: "sam@rccd.edu", records: null, verdicts: [], todos: [], error: "program_record_verdicts answered 500" };
  if (opts.review) w.CPL_SESSION = { get: () => ({ email: "sam@rccd.edu" }), isFresh: () => true, ensureFresh: () => ({ email: "sam@rccd.edu" }),
    authHeaders: (x) => Object.assign({ Authorization: "Bearer t" }, x || {}) };
  M._render();
  return { w: w, d: w.document, M: M, S: S, calls: calls, reads: reads };
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


const COMMONS_DOC = { schema: 1, rows: [{ key: "requirements", title: "Common Programs",
  pair: [{ n: 13553, of: 20282, words: "complete at 114 colleges", open: "#program-requirements/list" },
    { n: 32, of: 20282, words: "confirmed by a person, 28 of them complete", open: "#program-requirements/list", error: null }],
  issues: [{ n: 3380, words: "active programs whose record fails a check", open: "#program-requirements/list/fail" },
    { n: 3349, words: "active programs with no record yet", open: "#program-requirements/list/unread" }] }] };
function full(r) {
  return Object.assign(r, { _light: false, checked: true, checked_by: "ashley@rccd.edu", checked_at: "2026-10-20T17:00:00Z", measure: "units",
    total_min: 18, total_max: 18, catalog_year: "2026-2027", source_url: "https://example.edu/welding",
    record: { blocks: [
      { name: "Required core", rule: "all", courses: [{ code: "WELD 101", units: 4 }, { code: "WELD 102", units: 4, alternatives: [{ code: "WELD 103" }] }] },
      { name: "Electives", rule: "choose_units", min: 6, courses: [{ code: "WELD 201", units: 3 }, { code: "MATH 105", units: 3 }] }] },
    display: { courses: { "WELD 101": { title: "Intro to Welding", here: { exhibits_n: 4 } }, "WELD 102": { title: "Arc Welding" },
      "WELD 201": { title: "Pipe Welding", here: { recs: 1, credentials_n: 1 } }, "MATH 105": { title: "Shop Math" } } } });
}
function withFull() { const R = JSON.parse(JSON.stringify(RECORDS)); full(R[0]); return R; }
function lineOf(d) { return d.querySelector(".prl-line"); }
function panel(d) { return d.getElementById("prl-panel"); }
function titleBtn(d, title) { const r = rowOf(d, title); return r && r.querySelector("td.prl-title button.prl-open"); }


function rich(R) {
  full(R[0]);
  Object.assign(R[0], { checked: false, checked_by: null, checked_at: null, requirements_fp: "fp1",
    checks: { coverage: true, invented: true, arithmetic: "equal", placed: 4, listed: 4 } });
  R[0].record.program = { careers: ["Welder", "Fabricator"] };
  R[0].record.blocks[0].stated = { min: 8, max: 8 };
  R[0].display.courses["WELD 101"].ids = [{ kind: "C-ID", id: "WELD 110", title: "Introduction to Welding" }];
  R[0].display.counts = { here: 2, courses: 4 };
  R[0].display.gaps = [{ kind: "Alternative not on the state list", owner: "procedure", text: "WELD 102 has an alternative the state file lacks." },
    { kind: "Reader's note", text: "Read from the 2026 addendum." }];
  R[0].display.build = "roep-7";
  return R;
}
const pnl = (d) => d.getElementById("prl-panel");
const btn = (root, re) => Array.from(root.querySelectorAll("button")).find((b) => re.test(txt(b)));

(async function () {
  const t = tab({ commons: COMMONS_DOC, records: rich(JSON.parse(JSON.stringify(RECORDS))) });
  await settle();
  titleBtn(t.d, "Welding Technology").click(); await settle();
  let p = pnl(t.d);
  const dts = Array.from(p.querySelectorAll("dl.prh-checks dt")).map(txt);
  check("(1) ⭐ the card's checks in full", ["Courses", "Off the state list", "Units", "Person's reading", "Flags"].every((x) => dts.indexOf(x) >= 0)
    && /4 of 4 placed/.test(txt(p.querySelector("dl.prh-checks"))) && /Equal, 18 units/.test(txt(p.querySelector("dl.prh-checks"))), dts.join("|"));
  check("(1) the CPL line, under Its checks", /2 courses of 4 carry CPL at this college/.test(txt(p.querySelector(".prh-cpl")))
    && Array.from(p.querySelectorAll("h3")).map(txt).indexOf("Its checks") >= 0);
  const flag = p.querySelector(".prh-flags .prh-flag");
  check("(2) ⭐ a flag for the reading procedure says where it sits", !!flag && /Flag 1/.test(txt(flag)) && /In Required core/.test(txt(flag))
    && p.querySelectorAll(".prh-flags .prh-flag").length === 1, flag && txt(flag));
  const ct = p.querySelector("#prl-pn-courses");
  const weld102 = Array.from(ct.querySelectorAll("tbody tr")).find((r) => /WELD 102/.test(txt(r)));
  check("(2) the course row carries its flag mark", !!weld102 && !!weld102.querySelector(".prh-mark") && /Flag 1/.test(txt(weld102.querySelector(".prh-mark"))));
  check("(2) a block's printed units ride in its name", /the catalog prints 8 units/.test(txt(ct)));
  const chip = ct.querySelector("button.prh-id");
  check("(3) ⭐ a course's C-ID chip, with its title", !!chip && txt(chip) === "C-ID WELD 110" && /Introduction to Welding/.test(chip.getAttribute("aria-label")));
  const cplb = ct.querySelector("button.prh-cplbtn");
  check("(3) ⭐ CPL here is the word that opens its exhibits", !!cplb && /exhibits? articulated to WELD 101/.test(cplb.getAttribute("aria-label")));
  cplb.click(); await settle();
  check("(3) pressing it opens the exhibits", !!t.d.querySelector("[role='dialog']"));
  t.M.closeExhibits(); await settle();
  p = pnl(t.d);
  check("(4) ⭐ Side by side reads the record beside its catalog page", !!btn(p, /^Side by side$/)
    && btn(p, /^Side by side$/).getAttribute("data-split") === "Los Angeles Valley College|10001");
  check("(6) ⭐ a visitor gets the reviewers' sign-in, never Confirm", !!p.querySelector("details.prh-signin") && !btn(p, /^Confirm$/));
  const more = p.querySelector("details.prl-pn-more");
  check("(8) the careers and the source line fold below", /Careers the catalog names: Welder; Fabricator/.test(txt(more))
    && /Display build roep-7/.test(txt(more)) && !!more.querySelector("a[href='https://example.edu/welding']"));
  check("(8) the notes for the reading procedure fold, one each", /Notes for the reading procedure \(1\)/.test(txt(p.querySelector("details.prl-pn-notes")))
    && /Read from the 2026 addendum/.test(txt(p.querySelector("details.prl-pn-notes"))));
  const fl = Array.from(t.d.querySelectorAll(".prl-filters button, .prl-filters span")).map(txt);
  check("(7) a visitor sees Confirmed by a person, not Waiting on your reading", fl.some((x) => /^Confirmed by a person \(0\)$/.test(x))
    && !fl.some((x) => /^Waiting/.test(x)), fl.join("|"));

  // ── a light record ──
  const tl = tab({ commons: COMMONS_DOC });
  await settle();
  titleBtn(tl.d, "Accounting").click(); await settle();
  check("(4) a light record carries no Side by side word", !btn(pnl(tl.d), /^Side by side$/));

  // ── a reviewer ──
  const posts = [];
  const tr = tab({ commons: COMMONS_DOC, records: rich(JSON.parse(JSON.stringify(RECORDS))), review: true, onFetch: function (url, init) {
    if (/rpc\/program_record_verdict_add/.test(url)) {
      posts.push(JSON.parse(init.body));
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ id: 9, checked: true, by: "sam@rccd.edu", at: "2026-11-04T18:00:00Z", requirements_fp: "fp1" })) });
    }
    return null;
  } });
  await settle();
  const flr = Array.from(tr.d.querySelectorAll(".prl-filters button, .prl-filters span")).map(txt);
  check("(7) ⭐ a reviewer is offered Waiting on your reading, with its count", flr[1] === "Waiting on your reading (3)", flr.join("|"));
  titleBtn(tr.d, "Welding Technology").click(); await settle();
  p = pnl(tr.d);
  check("(5) ⭐ a reviewer gets Your reading's Confirm and Needs a fix, and the state line", !!btn(p, /^Confirm$/) && !!btn(p, /^Needs a fix$/)
    && /Waiting on your reading/.test(txt(p.querySelector(".prl-acts .prh-state"))));
  btn(p, /^Confirm$/).click(); await settle();
  p = pnl(tr.d);
  check("(5) ⭐ Confirm posts the one write for this record and its fingerprint", posts.length === 1 && posts[0].p_college === "Los Angeles Valley College"
    && posts[0].p_control_number === "10001" && posts[0].p_verdict === "confirm" && posts[0].p_requirements_fp === "fp1", JSON.stringify(posts));
  check("(5) the state line says who confirmed it", /Confirmed by you/.test(txt(p.querySelector(".prl-acts .prh-state"))), txt(p.querySelector(".prl-acts .prh-state")));
  check("(5) the save leaves the panel open and says so", /Confirmed\. The record is checked/.test(txt(p.querySelector(".prh-said"))), txt(p.querySelector(".prh-verdict")));
  btn(p, /^Close$/).click(); await settle();
  const flr2 = Array.from(tr.d.querySelectorAll(".prl-filters button, .prl-filters span")).map(txt);
  check("(5) the Confirmed and Waiting counts move without a new build", flr2.indexOf("Confirmed by a person (1)") >= 0 && flr2[1] === "Waiting on your reading (2)", flr2.join("|"));

  const te = tab({ commons: COMMONS_DOC, records: rich(JSON.parse(JSON.stringify(RECORDS))), reviewError: true });
  await settle();
  titleBtn(te.d, "Welding Technology").click(); await settle();
  check("(6) a sign-in whose read failed says Confirm is left out", /Confirm and Needs a fix are left out/.test(txt(pnl(te.d))) && !btn(pnl(te.d), /^Confirm$/));

  // ── the addresses ──
  const tw = tab({ commons: COMMONS_DOC, records: rich(JSON.parse(JSON.stringify(RECORDS))), hash: "#program-requirements/list/waiting" });
  await settle();
  check("(7) #program-requirements/list/waiting opens that filter", listOf(tw) === "waiting"
    && rows(tw.d).map((r) => txt(cell(tw.d, r, "Program"))).sort().join("|") === "Accounting|Nursing|Welding Technology", rows(tw.d).map((r) => txt(r)).join("|"));
  const tc = tab({ commons: COMMONS_DOC, records: withFull(), hash: "#program-requirements/list/checked" });
  await settle();
  check("(7) #program-requirements/list/checked opens Confirmed by a person", listOf(tc) === "checked"
    && rows(tc.d).map((r) => txt(cell(tc.d, r, "Program"))).join("|") === "Welding Technology");

  // ── (10) the off-list records ──
  const to = tab({ commons: COMMONS_DOC });
  await settle();
  const progs = (d) => rows(d).map((r) => txt(cell(d, r, "Program"))).sort().join("|");
  check("(10) ⭐ a record on a program COCI does not list as active is not under All", !/Old Program/.test(progs(to.d)), progs(to.d));
  btn(to.d, /^On a program COCI does not list as active \(1\)$/).click(); await settle();
  check("(10) ⭐ its own filter shows it, with the catalog's words", progs(to.d) === "Old Program"
    && /COCI does not list it as active/.test(txt(cell(to.d, rows(to.d)[0], "Known issues"))), progs(to.d));
  btn(to.d, /^Pass the machine checks/).click(); await settle();
  check("(10) a passing off-list record is not under Pass (Program records' Complete)", progs(to.d) === "Welding Technology", progs(to.d));

  // ── (12) the dropdowns ──
  const tdd = tab({ commons: COMMONS_DOC, setup: function (S) {
    S.registry = [{ college: "Los Angeles Valley College", college_id: 1 }, { college: "Cerritos College", college_id: 2 }, { college: "Cañada College", college_id: 3 }];
    S.districts = { 1: "Los Angeles CCD", 2: "Cerritos CCD", 3: "San Mateo CCD" }; S.regions = { 1: "Los Angeles", 2: "Los Angeles", 3: "Bay Area" };
  } });
  await settle();
  const dd = (key) => tdd.d.querySelector('.prl-scope .prh-dd[data-filter="' + key + '"]');
  check("(12) ⭐ District, College, SWP Region and CIP Sector sit over the List", ["district", "college", "region", "sector"].every((k) => !!dd(k)));
  const regionLA = dd("region").querySelector('input[value="Los Angeles"]');
  regionLA.checked = true; regionLA.dispatchEvent(new tdd.w.Event("change")); await settle();
  check("(12) ⭐ a region narrows the rows to its colleges", progs(tdd.d) === "Accounting|Art History|Nursing|Welding Technology", progs(tdd.d));
  const flt = Array.from(tdd.d.querySelectorAll(".prl-filters button, .prl-filters span")).map(txt);
  check("(12) and the filter counts follow it", flt[0] === "All (4)" && flt.indexOf("Not read yet (1)") >= 0, flt.join("|"));

  const sec = dd("sector").querySelector('input[value="48"]');
  sec.checked = true; sec.dispatchEvent(new tdd.w.Event("change")); await settle();
  check("(12) a CIP sector narrows by the program's own CIP code", progs(tdd.d) === "Welding Technology", progs(tdd.d));
  btn(tdd.d, /^Clear the filters$/).click(); await settle();
  check("(12) Clear the filters lifts them", rows(tdd.d).length === 5 && btn(tdd.d, /^Clear the filters$/).hidden, String(rows(tdd.d).length));

  // ── (13) a call's record, and a count ──
  const tg = tab({ commons: COMMONS_DOC, records: rich(JSON.parse(JSON.stringify(RECORDS))) });
  await settle();
  tg.S.pick = ["Cerritos College"];
  tg.M.goTo({ view: "list", lq: "10001", panel: { college: "Los Angeles Valley College", control_number: "10001" } }); await settle();
  check("(13) ⭐ Open it in the List searches the record and opens its panel", !!pnl(tg.d) && /Program: Welding Technology/.test(txt(tg.d.getElementById("prl-panel-t")))
    && rows(tg.d).length === 1 && tg.S.pick.length === 0, txt(pnl(tg.d)).slice(0, 80));
  tg.M.goTo(tg.M.TO.fail); await settle();
  check("(13) a count opens its filter with no search, no college and no panel", listOf(tg) === "fail" && !tg.S.ls.q && !pnl(tg.d)
    && progs(tg.d) === "Accounting|Nursing", progs(tg.d));

  // ── (14) the college's drafts ──
  const tk = tab({ commons: COMMONS_DOC, records: (function () { const R = rich(JSON.parse(JSON.stringify(RECORDS)));
    R[0].display.gaps.push({ kind: "Catalog and state file differ", owner: "college", text: "WELD 201 is printed at 3 units; the state file says 4." }); return R; })() });
  await settle();
  titleBtn(tk.d, "Welding Technology").click(); await settle();
  const dw = btn(pnl(tk.d), /^Open Los Angeles Valley's drafts on Catalogs$/);
  check("(14) a record with items for the college points to its drafts on Catalogs", !!dw && /1 place the catalog and the state file differ/.test(txt(pnl(tk.d))));
  dw.click(); await settle();
  check("(14) which opens Catalogs on the college", tk.S.view === "catalogs" && tk.S.q === "Los Angeles Valley College");

  // ── (11) the first waiting record, and the next in the List's order ──
  const tn = tab({ commons: COMMONS_DOC, review: true, records: (function () { const R = rich(JSON.parse(JSON.stringify(RECORDS)));
    full(R[1]); Object.assign(R[1], { checked: false, requirements_fp: "fp2", source_url: "https://example.edu/acct" }); return R; })(),
    hash: "#program-requirements/list/waiting" });
  await settle();
  const first = btn(tn.d, /^Read the first waiting record side by side$/);
  check("(11) ⭐ a reviewer on Waiting gets Read the first waiting record side by side", !!first);
  tn.w.open = function () { return null; };
  first.click(); await settle();
  const split = tn.d.querySelector(".prh-split");
  check("(11) it opens the List's first waiting record (A to Z: Accounting)", !!split && /Accounting/.test(txt(split.querySelector("#prh-split-t"))),
    split && txt(split.querySelector("#prh-split-t")));
  check("(11) ⭐ the next record follows the List's order", tn.M.nextToRead(tn.S.records[1]) === tn.S.records[0]);
  tn.M.closeSplit(true);

  const block = SRC.slice(SRC.indexOf("function listPanelBody("), SRC.indexOf("function listApi()"));
  check("(9) no raw hex and no glyph in the panel's code", block.length > 3000 && !/#[0-9a-fA-F]{3,6}\b/.test(block)
    && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(block));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { results.forEach(([n, ok, why]) => console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why))); console.error(e); process.exit(1); });
function listOf(t) { return (t.S.ls || {}).f; }
