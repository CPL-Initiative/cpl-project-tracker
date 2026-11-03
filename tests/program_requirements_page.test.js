// CPL Pathways' Progress view draws the CPL Commons' opened page (S558), with the dash one word away.
//
// Sam locked the CPL Commons mock on 2026-11-02 (S552); commons_page.js draws its opened page for every reference.
// The Commons lane's next step after Exhibits, the CR Reference and Subjects: the Program Requirements tab (titled
// CPL Pathways). The checks guard what the spec can get wrong:
//   - every group count sits over the headline's one denominator, COCI's active programs, so a record on a program
//     COCI does not list never counts;
//   - a failed active read says "Could not be read", never a zero;
//   - Needs attention carries only what is non-zero, an action each, and an open call;
//   - the dash stays under Details, closed on a first visit, and opening a call opens Details;
//   - without commons_page.js the dash draws alone.
// Run from repo root: `npm test` (or `node tests/program_requirements_page.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SRC = fs.readFileSync("program_requirements.js", "utf8");
const COMMONS = fs.readFileSync("commons_progress.js", "utf8");
const PAGE = fs.readFileSync("commons_page.js", "utf8");

function load(withPage) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="program-requirements-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  [COMMONS].concat(withPage ? [PAGE] : []).concat([SRC]).forEach(function (t) {
    const s = w.document.createElement("script"); s.textContent = t; w.document.body.appendChild(s);
  });
  return { w: w, M: w.CPL_PROGRAM_REQUIREMENTS, root: w.document.getElementById("program-requirements-root") };
}
function rec(college, cn, checks) {
  return { college: college, control_number: cn, program_title: "Program " + cn, checked: false,
    checks: checks || { coverage: true, invented: true, arithmetic: "equal" }, display: {} };
}
function ready(opts) {
  opts = opts || {};
  const m = load(opts.page !== false);
  const reg = [
    { college: "Cerritos College", catalog_url: "https://c.example/", procedure: { v: 4 } },
    { college: "Irvine Valley College", catalog_url: "https://i.example/", procedure: null },
    { college: "Canyons College", catalog_url: null, procedure: null }
  ];
  const recs = [
    rec("Cerritos College", "1"), rec("Cerritos College", "2", { coverage: false, invented: true, arithmetic: "equal" }),
    rec("Irvine Valley College", "3", { coverage: true, invented: true, arithmetic: "unequal" }),
    rec("Irvine Valley College", "4", { coverage: true, invented: false, arithmetic: "equal" }),
    rec("Irvine Valley College", "9")      /* not on COCI's active list: never counted */
  ];
  const keys = { "Cerritos College|1": 1, "Cerritos College|2": 1, "Cerritos College|5": 1,
    "Irvine Valley College|3": 1, "Irvine Valley College|4": 1, "Canyons College|6": 1 };
  const queue = { decider: "Sam", next_step: { title: "Read Columbia", text: "Its trial first." },
    changes: [{ at: "2026-11-03T06:00:00Z", text: "Santa Ana read. Four parts." }],
    calls: [{ title: "Keep Glendale parked?", text: "x" }, { title: "Answered one", answer: { words: "yes" } }] };
  m.M._state.registry = reg; m.M._state.records = recs; m.M._state.error = null; m.M._state.loading = false;
  m.M._state.progress = { addenda: [], active: opts.noActive ? null : 6, activeKeys: opts.noActive ? null : keys,
    build: null, queue: queue, errors: opts.noActive ? { active: "coci_college_programs answered 503" } : {},
    readAt: new Date("2026-11-03T07:30:00Z") };
  m.M._state.view = "progress";
  m.M._render();
  return m;
}
function rowN(root, label) {
  const row = Array.from(root.querySelectorAll(".pr-pg-row, [class*='pr-pg'] li, [class*='pr-pg'] tr"))
    .find(function (r) { return r.textContent.indexOf(label) >= 0; });
  return row ? row.textContent : "";
}

(function () {
  const m = ready();
  const c = m.M.activeCounts(m.M._state.registry && { R: m.M._state.registry });
  check("(1) active counts: catalog address 5 of 6 (Canyons has none)", c.url === 5, JSON.stringify(c));
  check("(1) active counts: a reading procedure 3 (Cerritos' three)", c.proc === 3, JSON.stringify(c));
  check("(1) active counts: read 4, the record off COCI's list left out", c.read === 4, JSON.stringify(c));
  check("(1) active counts: units add up 3, nothing added 3, every listed course placed 3",
    c.units === 3 && c.added === 3 && c.listed === 3, JSON.stringify(c));

  const text = m.root.textContent;
  const nav = m.root.querySelector("nav[aria-label^='Common Programs']");
  const det0 = m.root.querySelector('details[data-sec="progress:details"]');
  check("(2) the opened page draws before the Details, named Common Programs",
    !!nav && !!det0 && (nav.compareDocumentPosition(det0) & 4) !== 0);
  check("(2) the three questions are asked", ["Where is it read from?", "What does it require?", "Does it match the state's record?"]
    .every(function (q) { return text.indexOf(q) >= 0; }));
  check("(2) the groups count over COCI's active programs", text.indexOf("active programs in COCI") >= 0);
  check("(3) Needs attention names the failing records and the open call, not the answered one",
    /3\s*records fail a machine check/.test(text) && text.indexOf("Keep Glendale parked?") >= 0 && text.indexOf("Answered one") < 0 ||
    (text.indexOf("records fail a machine check") >= 0 && text.indexOf("decision for Sam: Keep Glendale parked?") >= 0 && text.indexOf("decision for Sam: Answered one") < 0));
  check("(3) the next step is the status file's", text.indexOf("Read Columbia") >= 0);
  check("(3) a zero item is left out (no addenda to read)", text.indexOf("catalog addenda to read") < 0 && text.indexOf("catalog addendum to read") < 0);
  const det = m.root.querySelector('details[data-sec="progress:details"]');
  check("(4) the dash sits under Details, closed on a first visit", !!det && !det.hasAttribute("open"));
  check("(4) the dash is inside it (the milestones)", !!det && !!det.querySelector('details[data-sec="progress:milestones"]'));
  check("(5) no raw hex in the spec's code", !/#[0-9a-fA-F]{3,6}\b/.test((SRC.split("function pageSpec")[1] || "").split("function withPage")[0]));
})();

(function () {
  const m = ready({ noActive: true });
  const text = m.root.textContent;
  check("(6) a failed active read says Could not be read, never a zero", text.indexOf("Could not be read") >= 0);
  check("(6) and the counts are null", m.M.activeCounts({ R: m.M._state.registry }) === null);
})();

(function () {
  const m = ready({ page: false });
  check("(7) without commons_page.js the dash draws alone",
    !m.root.querySelector('details[data-sec="progress:details"]') && !!m.root.querySelector('details[data-sec="progress:milestones"]'));
})();

let pass = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
  if (ok) pass++;
}
console.log("\nprogram_requirements_page.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
