// College Data Collection (commons_data.js): a college's unit problems read as program-requirement problems, with the
// two figures they rest on, the day of the database check, who acts, and the state's award size band.
//
// WHAT THIS GUARDS (S678, Commons Clarity's units ride-along with Sam, #3461 "Page findings" 1 to 4 and 6, read on
// Chaffey College's panel):
//   (1) ⭐ the panel's known gaps name their dataset: a units cause reads "Program requirements, ..." and the SLO read
//       reads "Course SLOs, ...", so a reader arriving from the "SLO read waiting" card cannot take one for the other;
//       the cause table's caption says program requirements;
//   (2) ⭐ "live" in the census's "live, units unequal" names the database check and its day (Nov 13, 2026), and the
//       cause box says the check read our saved records, not the college's catalog;
//   (3) ⭐ each units program shows "Our lists add up to A; the catalog prints B" (Chaffey's Physical Therapist
//       Assistant, 56 against 65), in the cause list and in the program's own pane;
//   (4) ⭐ "What would move it" names who acts, and a college with no correction rules of its own says so; the census's
//       new words replace "the pipeline's reconcile steps";
//   (6) ⭐ the award reads "Certificate of Achievement", and the size band "16S/24Q to fewer than 30S/45Q" reads as the
//       state's band in words, never as the program's units.
// The sidecar is Chaffey's committed one with the builder's units entry and correction_rules flag laid over it (the
// shape tests/commons_data_status_build_test.py (14b) pins), so the checks run before the nightly rebuild carries
// them; once the committed sidecar carries them, (7) reads it as committed.
//
// Run from repo root: `node tests/commons_clarity_units.test.js`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_data.js", "utf8");
const CENSUS = fs.readFileSync("kb/_harvest_gap_census.py", "utf8");
const DATA = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));
/* The database check's day as the page writes it, from the committed census basis (the live read moves daily). */
const CHECK_DAY = (function () {
  const c = (DATA.colleges || []).find((x) => x && x.census_basis && x.census_basis.basis === "live") || {};
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String((c.census_basis || {}).at || ""));
  return m ? new Date(m[1] + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Nov 13, 2026";
})();
const CHECK_RE = CHECK_DAY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STATUS = fs.existsSync("kb/status/commons.json") ? JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")) : {};
const SIDE = "kb/status/commons_data_programs/chaffey.json";
const COMMITTED = JSON.parse(fs.readFileSync(SIDE, "utf8"));

/* The builder's units entries for three of Chaffey's units programs, as its scratch build wrote them (S678). */
const UNITS = {
  "42987": { sum: [56, 56], printed: [65, 65], status: "unequal", measure: "units", against: "program" },
  "20677": { sum: [18, 19], printed: [18, 18], status: "unequal", measure: "units", against: "program" },
  "31891": { sum: [78, 78], printed: [18, 18], status: "unequal", measure: "units", against: "program" },
};
const CHAFFEY = JSON.parse(JSON.stringify(COMMITTED));
/* The range case, Business 20677 (a Certificate of Achievement in the 16S/24Q band), passed in the census of
   2026-11-18 23:45Z (run 44421998189) and left the committed sidecar. Its row as of 2026-11-17 stands in for the page's
   rendering checks; every other row still comes from the committed file. */
if (!CHAFFEY.programs.some((r) => r.cn === "20677")) {
  const at = CHAFFEY.programs.findIndex((r) => r.cn === "31891");
  CHAFFEY.programs.splice(at < 0 ? CHAFFEY.programs.length : at, 0, { cn: "20677", title: "Business",
    award: "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", cause: "units_unequal", lever: "reconcile_steps",
    url: "https://chaffey.curriqunet.com/catalog/iq/19210/program_index/20351" });
}
CHAFFEY.correction_rules = false;
CHAFFEY.programs.forEach((r) => { if (UNITS[r.cn]) r.units = UNITS[r.cn]; });
/* The census's new lever words, so the page draws what the rebuilt file will hold. */
const M2 = JSON.parse(JSON.stringify(DATA));
const lw = /"reconcile_steps": \("free", "([^"]+)"\s*"([^"]+)"\)/.exec(CENSUS);
if (lw) M2.rule.levers.reconcile_steps = { kind: "free", what: lw[1] + lw[2] };

function load(hash, data, side) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = { "kb/status/commons_data.json": data, "kb/status/commons.json": STATUS, [SIDE]: side };
  w.fetch = function (url) {
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [SESSION, PROGRESS, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }

(async () => {
  const chaffey = DATA.colleges.find((c) => c.name === "Chaffey College");
  check("fixture: Chaffey's row holds units causes and a live census basis",
    chaffey && (chaffey.census_causes || {}).units_unequal > 0 && (chaffey.census_basis || {}).basis === "live" && chaffey.programs_file === SIDE, chaffey && chaffey.census_causes);

  // ── the panel at the units cause ──
  const a = load("#commons/data/college/chaffey-college/cause/units_unequal", M2, CHAFFEY);
  await a.M.boot(); await settle();
  const panel = a.d.querySelector("#cdd-panel");
  const gaps = Array.from(panel.querySelectorAll(".cdd-gaps li")).map(txt);
  check("(1) ⭐ every census cause in the known gaps names program requirements",
    gaps.filter((g) => /programs?$/.test(g)).length >= 5 && gaps.filter((g) => /programs?$/.test(g)).every((g) => /^Program requirements, /.test(g)), gaps);
  check("(1) the SLO read names course SLOs", gaps.some((g) => /^Course SLOs, SLO read /.test(g)), gaps);
  check("(1) the cause table's caption says program requirements",
    /^Program requirements still to pass, by cause$/.test(txt(panel.querySelector("table.cdd-causes caption"))), txt(panel.querySelector("table.cdd-causes caption")));
  check("(2) ⭐ the units cause names the database check and its day, with no bare \"live\"",
    gaps.some((g) => new RegExp("^Program requirements, units unequal at the database check of " + CHECK_RE + ": \\d+ programs?$").test(g)) && !gaps.some((g) => /\blive, /i.test(g)), gaps);
  const basis = txt(panel.querySelector("[data-census-basis]"));
  check("(2) the cause box says the check read our saved records and not the catalog",
    new RegExp("From the database check of " + CHECK_RE).test(basis) && /saved program records/.test(basis) && /did not read the college's catalog again/.test(basis), basis);
  const pta = panel.querySelector('ul.cdd-progs > li[data-cn="42987"]');
  check("(3) ⭐ Physical Therapist Assistant shows both figures in the cause list",
    txt(pta && pta.querySelector("[data-units]")) === "Our lists add up to 56 units; the catalog prints 65 units.", txt(pta));
  const bus = panel.querySelector('ul.cdd-progs > li[data-cn="20677"]');
  check("(3) a range reads as a range (Business, 18 to 19 against 18)",
    txt(bus && bus.querySelector("[data-units]")) === "Our lists add up to 18 to 19 units; the catalog prints 18 units.", txt(bus));
  const mv = txt(pta && pta.querySelector("[data-lever]"));
  check("(4) ⭐ what would move it names who acts, in plain words",
    /^What would move it: a team session writes correction rules from the catalog's own wording, then rescores the saved record \(free\)\./.test(mv) && !/pipeline|reconcile/.test(mv), mv);
  check("(4) ⭐ and says Chaffey has no correction rules of its own yet", /Chaffey College has no correction rules of its own on file yet\.$/.test(mv), mv);
  const busOf = txt(bus && bus.querySelector(".cdd-of"));
  check("(6) ⭐ the award reads alone, without the band", /^Certificate of Achievement; control number 20677$/.test(busOf), busOf);
  check("(6) ⭐ the band reads as the state's, in words",
    txt(bus && bus.querySelector("[data-band]")) === "The state sets this award's size band at 16 to fewer than 30 semester units (24 to fewer than 45 quarter units). The program's own units are the catalog's figure.",
    txt(bus && bus.querySelector("[data-band]")));
  check("(6) a degree carries no band line", !(pta && pta.querySelector("[data-band]")), txt(pta));

  // ── the program's own pane ──
  const b = load("#commons/data/college/chaffey-college/program/42987", M2, CHAFFEY);
  await b.M.boot(); await settle();
  const pane = txt(b.d.querySelector("#cdd-panel"));
  check("(3) ⭐ the program pane shows both figures", /Units\s*Our lists add up to 56 units; the catalog prints 65 units\./.test(pane), pane.slice(0, 600));
  check("(1) the program pane names the cause as a program requirement",
    new RegExp("Still to pass because\\s*Program requirements: units unequal at the database check of " + CHECK_RE).test(pane), pane.slice(0, 600));
  check("(4) the program pane's lever names who acts and the missing rules",
    /What would move it\s*A team session writes correction rules/.test(pane) && /Chaffey College has no correction rules of its own on file yet/.test(pane), pane.slice(0, 900));
  const c = load("#commons/data/college/chaffey-college/program/20677", M2, CHAFFEY);
  await c.M.boot(); await settle();
  const pane2 = txt(c.d.querySelector("#cdd-panel"));
  check("(6) the program pane gives the award and the state's size band apart",
    /Award\s*Certificate of Achievement\s*The state's size band\s*The state sets this award's size band at 16 to fewer than 30 semester units/.test(pane2), pane2.slice(0, 600));

  // ── (7) the committed sidecar, once the rebuild carries the figures ──
  if (COMMITTED.programs.some((r) => r.units)) {
    const d = load("#commons/data/college/chaffey-college/program/42987", DATA, COMMITTED);
    await d.M.boot(); await settle();
    check("(7) the committed Chaffey sidecar shows both figures", /Our lists add up to 56 units; the catalog prints 65 units\./.test(txt(d.d.querySelector("#cdd-panel"))));
  }

  let failed = 0;
  for (const [name, ok, detail] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (detail !== undefined ? "  [" + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 700) + "]" : "")); }
    else console.log("PASS " + name);
  }
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  /* The jsdom windows keep timers alive; the run ends here. */
  process.exit(failed ? 1 : 0);
})();
