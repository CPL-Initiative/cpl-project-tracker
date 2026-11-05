// The line over the Program Requirements List, its folded cards and a program's side panel (the List norms, The List is
// the workspace; Sam, 2026-11-03: "incorporating the list view below the action/metric cards and make that top level
// collapsible while keeping the one-line action/metric links like we do elsewhere", and "a side bar open for list items
// to show all the details"). Exhibits, CR and Subjects came first. Guards:
//   (1) the line reads the requirements row of kb/status/commons.json through the engine, once a visit;
//   (2) a count whose place is one of the List's filters (Fail a machine check, Not read yet) is a word that sets it and
//       shows its rows; the List's own count is plain text until a filter is set;
//   (3) the Progress view's opened page sits in a fold under the line, under its own prefix (prl-pg-); Hide the top
//       hides it and its word says so;
//   (4) a failed read of the Commons file says so once, with no retry loop;
//   (5) a title opens the panel: the program, its record's checks in words, its courses block by block with each one's
//       title, units and the CPL on record at the college, sortable; the title's drawer moves in; COCI's words folded;
//   (6) a record the index holds light is read once from the panel; a failed read says so and is not retried on a
//       repaint; an unread program says the harvest holds no record;
//   (7) no raw hex and no glyph in the new code.
// Run from repo root: `npm test` (or `node tests/program_requirements_list_panel.test.js`).
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
  w.fetch = function (url) {
    url = String(url);
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

(async function () {
  // ── (1) and (2) the line ──
  const t = tab({ commons: COMMONS_DOC, records: withFull() });
  await settle();
  const ln = lineOf(t.d);
  const parts = ln ? Array.from(ln.children).filter((x) => !x.classList.contains("prl-sep")).map(txt) : [];
  check("(1) ⭐ the line reads the requirements row", parts.join(" | ") === "13,553 of 20,282 complete at 114 colleges | 32 confirmed by a person"
    + " | 3,380 active programs whose record fails a check | 3,349 active programs with no record yet", parts.join(" | "));
  check("(1) the Commons file is read once", t.reads.filter((u) => /commons\.json/.test(u)).length === 1);
  const lw = (re) => Array.from(lineOf(t.d).querySelectorAll("button")).find((b) => re.test(txt(b)));
  check("(2) the List's own counts are plain text on All; the issues are words", !lw(/^13,553/) && !lw(/^32 /) && !!lw(/^3,380/) && !!lw(/^3,349/));
  lw(/^3,380/).click(); await settle();
  check("(2) ⭐ the failing count sets Fail a machine check and shows its rows", listOf(t) === "fail"
    && rows(t.d).map((r) => txt(cell(t.d, r, "Program"))).sort().join("|") === "Accounting|Nursing", rows(t.d).map((r) => txt(cell(t.d, r, "Program"))).join("|"));
  lw(/^13,553/).click(); await settle();
  check("(2) the List's own count turns back to All, every program shown", listOf(t) === "" && rows(t.d).length === 5, String(rows(t.d).length));
  check("(1) a repaint does not read the file again", t.reads.filter((u) => /commons\.json/.test(u)).length === 1);

  // ── (3) the fold ──
  const tm = tab({ commons: COMMONS_DOC, modules: true, records: withFull() });
  await settle();
  const fold = tm.d.getElementById("prl-fold"), tog = tm.d.getElementById("prl-fold-w");
  check("(3) ⭐ the Progress view's page sits in the fold under its own prefix", !!fold && !fold.hidden && !!fold.querySelector("#prl-pg-attention")
    && !fold.querySelector("[id^='pr-pg-']"), fold && txt(fold).slice(0, 160));
  check("(3) its word reads Hide the top and controls the fold", tog && txt(tog) === "Hide the top" && tog.getAttribute("aria-controls") === "prl-fold");
  tog.click(); await settle();
  const tog2 = tm.d.getElementById("prl-fold-w");
  check("(3) Hide the top hides it; the word says Show the top and keeps focus", tm.d.getElementById("prl-fold").hidden
    && txt(tog2) === "Show the top" && tog2.getAttribute("aria-expanded") === "false" && tm.d.activeElement === tog2);

  // ── (4) a failed read ──
  const tf = tab();
  await settle(); await settle();
  check("(4) ⭐ a failed read says the figures could not be read, once", /could not be read/.test(txt(lineOf(tf.d)))
    && tf.reads.filter((u) => /commons\.json/.test(u)).length === 1, txt(lineOf(tf.d)));

  // ── (5) the panel ──
  titleBtn(t.d, "Welding Technology").click(); await settle();
  const p = panel(t.d);
  check("(5) ⭐ a title opens the panel, named for the program", !!p && txt(t.d.getElementById("prl-panel-t")) === "Program: Welding Technology"
    && /Los Angeles Valley College/.test(txt(p.querySelector(".prl-pn-meta"))) && /Control number 10001/.test(txt(p.querySelector(".prl-pn-meta"))));
  check("(5) the record's checks in words, and who confirmed it", /A person confirmed it, ashley@rccd\.edu/.test(txt(p.querySelector(".prl-pn-dec")))
    && /every listed course placed/.test(txt(p.querySelector(".prl-pn-dec"))) && /units: they add up to the printed total/.test(txt(p.querySelector(".prl-pn-dec"))));
  const ct = p.querySelector("#prl-pn-courses");
  const crow = ct ? Array.from(ct.querySelectorAll("tbody tr")).map((r) => Array.from(r.children).map(txt).slice(2).join(",")) : [];
  check("(5) ⭐ its courses block by block: the course and its alternative, title, units and the CPL here",
    crow.join("|") === "WELD 101,Intro to Welding,4,4|WELD 102 or WELD 103,Arc Welding,4,0|WELD 201,Pipe Welding,3,2|MATH 105,Shop Math,3,0", crow.join("|"));
  check("(5) each row names its block", /Required core/.test(txt(ct.querySelector("tbody tr"))) && /4 courses in 2 blocks; the program totals 18 units/.test(txt(p)));
  check("(5) the table is a labelled region with th scope=col", ct.getAttribute("role") === "region" && !!ct.getAttribute("aria-label")
    && ct.querySelectorAll("th[scope='col']").length === 6);
  Array.from(ct.querySelectorAll("th button")).find((b) => /^CPL here/.test(txt(b))).click(); await settle();
  const sorted = Array.from(panel(t.d).querySelectorAll("#prl-pn-courses tbody tr")).map((r) => txt(r.children[5]));
  check("(5) a header sorts it", sorted.join(",") === "0,0,2,4", sorted.join(","));
  check("(5) the title's drawer moves in, and COCI's words fold below", !!panel(t.d).querySelector(".prl-pdrawer")
    && /TOP code 0956\.50/.test(txt(panel(t.d).querySelector("details.prl-pn-more"))) && /decides nothing/.test(txt(panel(t.d).querySelector("details.prl-pn-more"))));
  check("(5) the panel carries the record, so no word sends it to Program records (S574)",
    !Array.from(panel(t.d).querySelectorAll("button")).some((b) => /Program records/.test(txt(b))));

  // ── (6) a light record, an unread program ──
  const tl = tab({ recordsFail: true });
  await settle();
  titleBtn(tl.d, "Accounting").click(); await settle(); await settle();
  const before = tl.reads.filter((u) => /program_requirement_records/.test(u)).length;
  check("(6) ⭐ a light record is read from the panel; a failed read says so", before >= 1 && /could not be read/.test(txt(panel(tl.d))), txt(panel(tl.d)).slice(0, 300));
  tl.M._render(); await settle(); await settle();
  check("(6) a repaint does not read it again", tl.reads.filter((u) => /program_requirement_records/.test(u)).length === before, before + " vs " + tl.reads.filter((u) => /program_requirement_records/.test(u)).length);
  Array.from(panel(tl.d).querySelectorAll("button")).find((b) => txt(b) === "Read again").click(); await settle(); await settle();
  check("(6) Read again reads it once more (S574)", tl.reads.filter((u) => /program_requirement_records/.test(u)).length > before);
  titleBtn(tl.d, "Art History").click(); await settle();
  check("(6) an unread program says the harvest holds no record and lists no courses", /holds no record of this program yet/.test(txt(panel(tl.d)))
    && !panel(tl.d).querySelector("#prl-pn-courses"));

  // ── (7) the source ──
  const block = SRC.slice(SRC.indexOf("var LINE_FILTERS"), SRC.indexOf("function listApi()"));
  check("(7) no raw hex and no glyph in the new code", block.length > 2000 && !/#[0-9a-fA-F]{3,6}\b/.test(block)
    && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(block));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { results.forEach(([n, ok, why]) => console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why))); console.error(e); process.exit(1); });
function listOf(t) { return (t.S.ls || {}).f; }
