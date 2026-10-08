// Program Requirements tab (Beta draft) — the program requirements harvest in COBI.
//
// Sam, 2026-10-04: "we use the new tab based on mockup to manage the ongoing process
// to harvest program ROE and Pathway data... My goal is to not need to curate or
// manually adjust and instead to adjust college-based procedures". The tab reads the
// registry, the records and each college's reading procedure LIVE, so the checks
// below guard what a live read can get wrong:
//   - a failed read must say so, never paint "0 of 0 colleges";
//   - a record "passes" only when all four checks hold, not when any one does;
//   - the Procedures view shows what the record holds (open questions, a host marked
//     gone, a held request), because that is where a misread gets fixed;
//   - the tab writes nothing, uses tokens (no raw hex) and words (no glyphs);
//   - a private window (localStorage throws) still renders;
//   - the Progress view (S343) places You are here by what is left, counts from each read,
//     and says which read failed instead of drawing a zero.
//
// Run from repo root: `npm test` (or `node tests/program_requirements.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const pending = [];
function block(label, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      pending.push(r.catch(function (e) { check(label + " — driver threw: " + (e && e.message), false); }));
    }
  } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("program_requirements.js", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");
const NAV = fs.readFileSync("nav_groups.js", "utf8");

function loadModule(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>'
    + '<div id="program-requirements-root" style="text-align:center;padding:28px;">Loading&hellip;</div>'
    + "</body></html>", { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = opts.fetch || function () { return new Promise(function () {}); };
  if (opts.noStorage) {
    Object.defineProperty(w, "localStorage", { get: function () { throw new Error("SecurityError"); } });
  }
  const s = w.document.createElement("script");
  s.textContent = SRC;
  w.document.body.appendChild(s);
  return { w, M: w.CPL_PROGRAM_REQUIREMENTS, root: w.document.getElementById("program-requirements-root") };
}

const REGISTRY = [
  { college: "Cerritos College", catalog_url: "https://cerritos-public.courseleaf.com/", catalog_year: "2026-2027",
    catalog_platform: "courseleaf", catalog_format: "html_per_program", sequence_source: "none_found",
    sequence_url: null, sequence_host: null, sequence_access: null, sequence_note: null, access_status: "ok",
    corrected_by: null, census_checked_at: "2026-10-04T15:28:31Z",
    procedure: {
      v: 3, college: "Cerritos College", reader: "kb/_college_page_read.py",
      open: [{ question: "Cerritos's list of articulated high school courses, and Columbus High's route",
        next: "Read the archive's 2016 list" }],
      hosts: [{ host: "www.cerritos.edu", access: "open", note: "The college's own pages." },
        { host: "www.statewidepathways.org", access: "gone", note: "A domain for sale." }],
      steps: [{ run: "37232742985", date: "2026-10-04", plan: "kb/college_reads/x.json", found: "The B.S. list.", loads: 20, reached: 18 }],
      answers: [{ question: "The apprenticeship's classroom hours.", status: "answered", answer: "878 and 898." }],
      nuances: ["Articulation is faculty-driven."],
      requests: [{ to: "Educational Partnerships & Programs office", status: "held: Sam, sheet 36 card 2", question: "The list" }],
      workarounds: []
    },
    procedure_by: "college-page-read S330", procedure_at: "2026-10-04T23:59:52Z" },
  { college: "American River College", catalog_url: null, catalog_year: null, catalog_platform: null,
    catalog_format: null, sequence_source: "unknown", access_status: "not_found",
    corrected_by: "Sam (open-asks sheets 25 and 26)", census_checked_at: "2026-10-04T15:28:31Z", procedure: null },
  { college: "Evergreen Valley College", catalog_url: "https://catalog.evc.edu/", catalog_year: "2025-2026",
    catalog_platform: "courseleaf", catalog_format: "html_per_program", sequence_source: "none_found",
    access_status: "ok", census_checked_at: "2026-10-03T15:28:31Z", procedure: null },
  { college: "College of the Canyons", catalog_url: "https://www.canyons.edu/cat.pdf", catalog_year: "2026-2027",
    catalog_platform: "pdf", catalog_format: "single_pdf", sequence_source: "ppm",
    sequence_url: "https://canyons.programmapper.ws/", sequence_host: "canyons.programmapper.ws",
    sequence_access: "refused", sequence_note: "Answered 403 Forbidden.", access_status: "ok",
    census_checked_at: "2026-10-04T15:28:31Z", procedure: null }
];

const IRONWORKER = {
  college: "Cerritos College", control_number: "42158", program_title: "Apprenticeship: Field Ironworkers",
  award: "A.S. Degree", catalog_year: "2026-2027", source_url: "https://cerritos-public.courseleaf.com/field-ironworkers-aa/",
  measure: "units", total_min: 34, total_max: 38, checked: true, checked_by: "Sam",
  checks: { coverage: true, invented: true, reviewer: { by: "Sam", verdict: "ok" }, arithmetic: "equal" },
  record: { program: { measure: "units" }, blocks: [
    { name: "Core Requirements", rule: "all", stated: { min: 19, max: 19 }, option_group: null, courses: [
      { code: "IWAP 40.07", units: 4, units_max: null, alternatives: [], catalog_addition: false }] },
    { name: "Option 1: Reinforcing Program", rule: "all", option_group: "Reinforcing or Structural option",
      stated: { min: null, max: null }, courses: [{ code: "IWAP 40.12", units: 2, alternatives: [] }] },
    { name: "Option 2: Structural Program", rule: "all", option_group: "Reinforcing or Structural option",
      stated: { min: null, max: null }, courses: [{ code: "IWAP 40.16", units: 2, alternatives: [] }] }] },
  display: { build: "bbbbfb611f15", built: "2026-10-04",
    checks: { checked: true, coverage: { listed: 24, placed: 24 }, reviewer: "ok", additions: 0, arithmetic: "equal" },
    counts: { here: 15, adopt: 0, courses: 24, consider: 0 },
    figure: { up_to: 31.5, total: { min: 34, max: 38 } },
    courses: { "IWAP 40.07": { title: "FIW - Orientation", here: { recs: 0, credentials: ["FIW Orientation"], credentials_n: 1 } } },
    gaps: [{ kind: "Reader's note", text: "Catalog prints IWAP 40.50; the closed list stores 40.5." }] }
};
// One check fails (a person has not read it): the record must NOT pass.
const UNREAD = JSON.parse(JSON.stringify(IRONWORKER));
UNREAD.control_number = "99999"; UNREAD.program_title = "Unread Program";
UNREAD.checks.reviewer = null; UNREAD.display.checks.reviewer = null; UNREAD.display.counts.here = 0;

function ready(opts) {
  const m = loadModule(opts);
  m.M._state.registry = REGISTRY; m.M._state.records = [IRONWORKER, UNREAD];
  m.M._state.error = null; m.M._state.loading = false;
  return m;
}

// ── (1) Rule 4 and the wiring ─────────────────────────────────────────────
block("(1)", function () {
  check("(1) both HTMLs are byte-identical", DASH === INDEX, "Rule 4: the workflow copies one to the other");
  ['data-tab="program-requirements"', 'id="program-requirements-root"',
   "onActivate('program-requirements'", "loadScript('program_requirements.js'"].forEach(function (frag) {
    check("(1) the shell carries " + frag, DASH.indexOf(frag) >= 0);
  });
  check("(1) the tab sits in a nav group, so it does not fall to the catch-all",
    /id: 'reference'[^\n]*'program-requirements'/.test(NAV));
});

// ── (2) A failed read says so; it is never a zero ─────────────────────────
block("(2)", function () {
  const { M, root } = loadModule();
  M._state.error = "program_source_registry answered 401"; M._state.loading = false;
  M._render();
  const txt = root.textContent;
  check("(2) the error is named", /could not be read/.test(txt) && /401/.test(txt), txt.slice(0, 300));
  check("(2) a failed read paints no count", !/\b0 of 0\b/.test(txt) && !/Showing 0/.test(txt), txt.slice(0, 300));
  check("(2) the inline centering is shed before anything renders", !root.style.textAlign);
  check("(2) a retry is offered", !!root.querySelector("button"));

  const pend = loadModule();
  pend.M._render();
  check("(2) before the read lands, it says it is reading", /Reading the harvest/.test(pend.root.textContent));
});

// ── (3) The pure derivations ──────────────────────────────────────────────
block("(3)", function () {
  const { M } = loadModule();
  check("(3) a record with all four checks passes", M.recordChecks(IRONWORKER).passes === true);
  check("(3) a record no person has read does not pass", M.recordChecks(UNREAD).passes === false,
    "passing on three of four checks is the failure this guards");
  check("(3) the procedure filter keeps only colleges with a record",
    M.filterRegistry(REGISTRY, "", "procedure", "all").map(function (r) { return r.college; }).join() === "Cerritos College");
  check("(3) last year's catalog is found", M.filterRegistry(REGISTRY, "", "last", "all").length === 1);
  check("(3) a college with no address needs a person",
    M.filterRegistry(REGISTRY, "", "person", "all").some(function (r) { return r.college === "American River College"; }));
  check("(3) the award loses the state file's unit range",
    M.award("Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units") === "Certificate of Achievement");
  check("(3) an option block reads as one of its group's options",
    M.ruleText(IRONWORKER.record.blocks[1], "units", { "Reinforcing or Structural option": 2 }) === "Take one of 2 options");
  const n = M.procedureCounts(REGISTRY[0].procedure);
  check("(3) a held request is counted", n.held === 1 && n.open === 1 && n.hosts === 2, JSON.stringify(n));
});

// ── (4b) Sierra docks at the top of the tab (Sam, sheet 38 card 5; "Sierra at the top") ──
// The failure this guards: a second copy of the assistant, a mount that drops the
// tab's surface, or a reader's choice to close her that does not hold.
block("(4b)", function () {
  const a = ready();
  a.M._state.view = "catalogs"; a.M._render();
  const sec = a.root.querySelector("details#prh-sierra");
  check("(4b) Sierra's section is open until the reader closes it, as on My College", !!sec && sec.open === true);
  check("(4b) without the chat module the section links to the CPL Assistant",
    !!a.root.querySelector('#prh-sierra-mount a[href="#chatbot"]'));

  const b = ready();
  const calls = [];
  b.w.CPL_CHAT = { mountInto: function (h, surface) {
    calls.push([h.id, surface]);
    h.innerHTML = '<textarea class="cplchat-input"></textarea>';
  } };
  b.M._state.view = "catalogs"; b.M._render();
  check("(4b) the tab mounts the one assistant with its own surface",
    calls.length === 1 && calls[0][0] === "prh-sierra-mount" && calls[0][1] === "program-requirements", JSON.stringify(calls));
  check("(4b) her box is in the open section", !!b.root.querySelector("details#prh-sierra[open] .cplchat-input"));
  const sec2 = b.root.querySelector("details#prh-sierra");
  sec2.open = false;
  sec2.dispatchEvent(new b.w.Event("toggle"));
  check("(4b) closing her is remembered",
    b.w.localStorage.getItem("cplProgramRequirements.sierra.v1") === "0");
  b.M._render();
  check("(4b) a re-render keeps her closed and mounts her again",
    b.root.querySelector("details#prh-sierra").open === false && calls.length === 2);

  const c = ready({ noStorage: true });
  c.M._state.view = "catalogs"; c.M._render();
  check("(4b) a private window still renders her section", !!c.root.querySelector("details#prh-sierra"));
});

// ── (4) Render: the four views ────────────────────────────────────────────
block("(4)", function () {
  const { M, root, w } = ready();
  M._state.view = "catalogs"; M._render();
  let txt = root.textContent;
  check("(4) Catalogs counts the registry", /Showing 4 of 4/.test(txt), txt.slice(0, 400));
  check("(4) a person's correction is shown on the row", /Corrected by Sam/.test(txt));
  check("(4) the Beta draft label is on the tab", /Beta draft/.test(txt));
  const sierraSec = root.querySelector("details#prh-sierra"), switcher = root.querySelector(".prh-switch");
  check("(4) Sierra sits at the top of the tab, above the views (Sam: \"Sierra at the top\")",
    !!sierraSec && !!switcher && !!(sierraSec.compareDocumentPosition(switcher) & 4));
  check("(4) one way to reach her: no second Ask Sierra control in the header",
    !root.querySelector("header .prh-ask") &&
    !Array.prototype.some.call(root.querySelectorAll("header button, header a"), function (b) { return /Sierra|Ask/i.test(b.textContent); }));

  M._state.view = "records"; M._render();
  txt = root.textContent;
  check("(4) Records shows the CPL figure from the display build", /up to 31\.5 of 34–38 units/.test(txt), txt.slice(0, 600));
  check("(4) Records counts passing records honestly", /1 of 2/.test(txt));
  const btn = root.querySelector(".prh-toggle");
  check("(4) the blocks start closed", btn && btn.getAttribute("aria-expanded") === "false");
  btn.click();
  check("(4) the toggle opens its own body", btn.getAttribute("aria-expanded") === "true" &&
    !w.document.getElementById(btn.getAttribute("aria-controls")).hidden);
  check("(4) a course carries its title and its CPL here", /FIW - Orientation/.test(root.textContent));

  M._state.view = "sequences"; M._render();
  txt = root.textContent;
  check("(4) Sequences names a refusal in words", /Refused the reader/.test(txt));

  M._state.view = "procedures"; M._render();
  txt = root.textContent;
  check("(4) Procedures shows the open question", /Columbus High's route/.test(txt));
  check("(4) a host the record marks gone reads Gone", /Gone/.test(txt));
  check("(4) the version and author of the record are shown", /Version 3/.test(txt) && /college-page-read S330/.test(txt));
  check("(4) a held request is shown", /Requests and workarounds/.test(txt));
  check("(4) a read links its run", !!root.querySelector('a[href$="/actions/runs/37232742985"]'));
});

// ── (5) The view switch is a real tablist ─────────────────────────────────
block("(5)", function () {
  const { M, root, w } = ready();
  M._state.view = "catalogs"; M._render();
  const tabs = root.querySelectorAll('[role="tab"]');
  check("(5) five views, Progress first", tabs.length === 5 && /^Progress/.test(tabs[0].textContent));
  check("(5) one tab selected, the rest out of the tab order",
    root.querySelectorAll('[role="tab"][aria-selected="true"]').length === 1 &&
    root.querySelectorAll('[role="tab"][tabindex="-1"]').length === 4);
  tabs[1].dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  check("(5) ArrowRight moves to the next view", M._state.view === "records");
  check("(5) the panel names its tab",
    root.querySelector('[role="tabpanel"]').getAttribute("aria-labelledby") === "prh-tab-records");
});

// ── (6) A private window still renders ────────────────────────────────────
block("(6)", function () {
  const { M, root } = ready({ noStorage: true });
  M.activate();
  check("(6) localStorage throwing does not stop the render", /Program Requirements/.test(root.textContent));
});

// ── (6b) The live read asks for both tables and names the one that failed ──
block("(6b)", function () {
  const asked = [];
  const { M, root } = loadModule({ fetch: function (url) {
    asked.push(url);
    if (/program_requirement_records/.test(url)) return Promise.resolve({ ok: false, status: 503 });
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve(REGISTRY); } });
  } });
  return M._load().then(function () {
    check("(6b) both tables are read, and the Progress view's three reads beside them", asked.length === 5 &&
      asked.some(function (u) { return /\/rest\/v1\/program_source_registry\?select=/.test(u); }) &&
      asked.some(function (u) { return /\/rest\/v1\/program_requirement_records\?select=/.test(u); }) &&
      asked.some(function (u) { return /\/rest\/v1\/program_source_addenda\?select=/.test(u); }) &&
      asked.some(function (u) { return /\/rest\/v1\/coci_college_programs\?.*status=eq\.Active/.test(u); }) &&
      asked.indexOf("kb/queue_status.json") >= 0, asked.join(" "));
    check("(6b) one failed table fails the read, naming it", /program_requirement_records answered 503/.test(root.textContent),
      root.textContent.slice(0, 300));
  });
});

// ── (6c) Drafts for the college (Sam, open-asks sheet 32 card 2, as proposed) ──
// A gap the college owns collects under the college as a draft the MAP team copies; a
// gap the reading procedure owns stays with the record. The tab composes, never sends.
block("(6c)", function () {
  const { M, root, w } = ready();
  const MIRA = JSON.parse(JSON.stringify(IRONWORKER));
  MIRA.college = "San Diego Miramar College"; MIRA.control_number = "35030"; MIRA.program_title = "Entrepreneurship";
  MIRA.display.gaps = [
    { kind: "MAP names a second course", owner: "college", where: "San Diego Miramar College's articulations in MAP",
      text: "MAP lists AUTO 156G Engine and Related Systems on the EMT Certification articulation (0.3 hours in Perilaryngeal Airway Adjuncts/Defibrillation Training) beside EMGM 106, the course the recommendation names." },
    { kind: "Catalog and state file differ", owner: "college", where: "state", text: "The catalog prints ECON C2002 for this program; the state's Program Course File does not list it." },
    { kind: "Reader's note", owner: "procedure", where: "proc", text: "A note for the procedure only." }];
  const records = [IRONWORKER, MIRA];
  const d = M.collegeDrafts(records);
  check("(6c) only college-owned gaps become drafts", Object.keys(d).length === 1 && d["San Diego Miramar College"].length === 2,
    JSON.stringify(Object.keys(d)));
  const t = M.draftText("San Diego Miramar College", d["San Diego Miramar College"]);
  check("(6c) the draft names the college, the catalog year, the program and each item",
    /San Diego Miramar College's 2026-27 catalog/.test(t) && /Entrepreneurship \(A\.S\. Degree, control number 35030\)/.test(t) &&
    /AUTO 156G/.test(t) && /ECON C2002/.test(t) && /2 items for your review/.test(t), t);
  check("(6c) the draft ends on a small ask, no bullets or bold", /\?$/.test(t) && !/^\s*[-*•]/m.test(t) && !/\*\*/.test(t), t);

  M._state.registry = REGISTRY.concat([{ college: "San Diego Miramar College", catalog_url: "https://sdccd.curriqunet.com/",
    catalog_year: "2026-2027", catalog_platform: "curriqunet", access_status: "ok", procedure: null }]);
  M._state.records = records;
  M._state.view = "records"; M._render();
  const box = root.querySelector("details.prh-drafts");
  check("(6c) Program records shows the drafts under the college", !!box && /Drafts for the college \(2\)/.test(box.textContent));
  check("(6c) the drafts say the MAP team decides when to send", !!box && /The MAP team decides when to send/.test(box.textContent));
  const ta = box && box.querySelector("textarea");
  check("(6c) the draft is labeled and read-only", !!ta && ta.hasAttribute("readonly") &&
    !!root.querySelector('label[for="' + ta.id + '"]') && /AUTO 156G/.test(ta.value));
  const notes = Array.prototype.filter.call(root.querySelectorAll("details.prh-notes:not(.prh-drafts)"),
    function (n) { return /AUTO 156G|ECON C2002/.test(n.textContent); });
  check("(6c) a college's draft is not listed among the procedure's notes", notes.length === 0);
  const copy = box && Array.prototype.filter.call(box.querySelectorAll("button"), function (b) { return /Copy the draft/.test(b.textContent); })[0];
  check("(6c) a Copy the draft control is offered", !!copy);
  if (copy) { copy.click(); check("(6c) copying says what happened", /Copied|Selected/.test(box.textContent)); }

  M._state.view = "catalogs"; M._state.show = "drafts"; M._render();
  check("(6c) Catalogs filters to colleges with drafts and counts them",
    /Showing 1 of 5/.test(root.textContent) && /2 drafts for the college/.test(root.textContent), root.textContent.slice(0, 600));
  M._state.show = "all";
});

// ── (8) The Progress view (Sam, 2026-10-07; mock-up approved S343) ─────────
// The failures this guards: You are here placed by hand instead of by what is left;
// a count of zero where a read failed; the unchecked records counted from a read anon
// cannot make; the routine's next run shown in the past.
function progressFixture(nChecked) {
  const reg = [
    { college: "Irvine Valley College", catalog_url: "https://ivc.example/cat", catalog_year: "2026-2027",
      sequence_source: "program_map_page", sequence_access: "open", sequence_host: "maps.example", census_checked_at: "2026-10-04T15:38:14Z",
      procedure: null },
    { college: "Cerritos College", catalog_url: "https://cerritos.example/", catalog_year: "2026-2027",
      sequence_source: "ppm", sequence_access: "refused", sequence_host: "maps.example", census_checked_at: "2026-10-04T15:28:31Z",
      procedure: { v: 4, open: [] } },
    { college: "Santa Monica College", catalog_url: "https://smc.example/", catalog_year: "2025-2026",
      sequence_source: "program_map_page", sequence_access: "refused", sequence_host: "maps.example", census_checked_at: "2026-10-04T15:28:31Z",
      procedure: { v: 1 } },
    { college: "College of the Canyons", catalog_url: "https://coc.example/", catalog_year: "2026-2027",
      sequence_source: "none_found", sequence_access: null, census_checked_at: "2026-10-03T15:28:31Z", procedure: null }
  ];
  const recs = [];
  for (let i = 0; i < nChecked; i++) {
    const r = JSON.parse(JSON.stringify(IRONWORKER));
    r.control_number = String(50000 + i); r.checked_at = "2026-10-04T10:22:45Z";
    r.display.build = "8292780f6cd5"; r.display.built = "2026-10-06";
    if (i % 2) r.college = "West Los Angeles College";
    recs.push(r);
  }
  const queue = {
    schema: 1, written_at: "2026-10-07T20:15:50Z", session: 342, moniker: "SkyBeacon", run: "Sam's session",
    decider: "Sam", handoff: "docs/session_343_handoff.md",
    next_run: { name: "CPL Queue", at: "2026-10-08T15:07:00Z", every_hours: 24 },
    unchecked: [
      { college: "Irvine Valley College", program: "Art", award: "A.A.", control_number: "10265", loaded: "2026-10-07" },
      { college: "Santa Monica College", program: "Barbering", award: "A.S.", control_number: "43767", loaded: "2026-10-07" }],
    next_step: { title: "A procedure for each pilot college", text: "Five pilot colleges have none yet." },
    calls: [{ title: "Check two new records?", text: "Irvine Valley Art and Santa Monica Barbering.", if_no_reply: "both stay unchecked." }],
    notes: { addenda: "The reading agent starts after the Oct 11 census apply." },
    changes: [{ at: "2026-10-07T14:20:00Z", text: "Sam answered sheet 47" }, { at: "2026-10-07T19:23:00Z", text: "Sierra deployed" }]
  };
  const addenda = [{ college: "Irvine Valley College", status: "listed" }, { college: "Cerritos College", status: "read" },
    { college: "Cerritos College", status: "gone" }];
  return { reg: reg, recs: recs, queue: queue, addenda: addenda };
}
function progressReady(nChecked, errors) {
  const f = progressFixture(nChecked == null ? 20 : nChecked);
  const m = loadModule();
  errors = errors || {};
  m.M._state.registry = f.reg; m.M._state.records = f.recs; m.M._state.error = null; m.M._state.loading = false;
  m.M._state.progress = { addenda: errors.A ? null : f.addenda, active: errors.active ? null : 20282,
    queue: errors.Q ? null : f.queue, errors: errors, readAt: new Date("2026-10-07T21:40:00Z") };
  m.M._state.view = "progress";
  m.M._render();
  return Object.assign(m, { f: f });
}
block("(8)", function () {
  const fresh = loadModule();
  check("(8) Progress is the view a first visit opens", fresh.M._state.view === "progress");

  const { root, M } = progressReady(20);
  const txt = root.textContent;
  const steps = root.querySelectorAll(".prh-pg-steps > li");
  check("(8) five milestones", steps.length === 5 && M.MILESTONES.length === 5);
  const here = root.querySelector('.prh-pg-steps > li[aria-current="step"]');
  check("(8) You are here sits on the first milestone with anything left: Read program maps",
    !!here && /Read program maps/.test(here.textContent) && /You are here/.test(here.textContent) &&
    root.querySelectorAll('[aria-current="step"]').length === 1, here && here.textContent);
  check("(8) the milestones before it read Done, with their dates",
    /Done · Oct 4 census/.test(steps[0].textContent) && /Done · Oct 4/.test(steps[1].textContent), steps[0].textContent);
  check("(8) the one after it is the next milestone, the rest later",
    /Next milestone/.test(steps[3].textContent) && /Later/.test(steps[4].textContent));
  check("(8) the facts count from the reads", /4 of 4 colleges/.test(steps[0].textContent) &&
    /1 of 3 published maps/.test(here.textContent) && /2 of 4 written/.test(steps[3].textContent) &&
    /20,282 active programs/.test(steps[4].textContent), Array.prototype.map.call(steps, function (s) { return s.textContent; }).join(" | "));
  const left = root.querySelector(".prh-pg-left");
  check("(8) what is left before the next milestone: maps, the unchecked records, the addenda",
    !!left && /^3/.test(left.textContent) && /2 published maps to read/.test(left.textContent) &&
    /2 new records to check/.test(left.textContent) && /1 catalog addendum to read/.test(left.textContent), left && left.textContent);

  const parts = root.querySelectorAll(".prh-pg-grid > li");
  check("(8) eight parts", parts.length === 8 && M.PARTS.length === 8);
  const byTitle = {};
  Array.prototype.forEach.call(parts, function (p) { byTitle[p.querySelector("h4").textContent] = p; });
  check("(8) the census part counts addresses and this year's catalogs",
    /4 colleges have a catalog address; 3 name 2026-2027\./.test(byTitle["Catalog census"].textContent));
  check("(8) the census's next apply is a Sunday", /Weekly; next apply/.test(byTitle["Catalog census"].textContent) &&
    M.nextWeekly(new Date("2026-10-07T21:40:00Z"), 0, 10, 29).toISOString() === "2026-10-11T10:29:00.000Z");
  check("(8) catalog reading adds the status file's unchecked records to the checked ones",
    /22 programs read at 4 colleges/.test(byTitle["Catalog reading"].textContent) &&
    /Irvine Valley and Santa Monica added Oct 7/.test(byTitle["Catalog reading"].textContent), byTitle["Catalog reading"].textContent);
  const checks = byTitle["The four checks"];
  check("(8) the four checks wait on Sam, in crimson, by name",
    checks.classList.contains("prh-pg-call") && /Waiting on Sam/.test(checks.textContent) && /20 of 22 programs checked/.test(checks.textContent) &&
    /2 wait on Sam's reading/.test(checks.textContent), checks.textContent);
  const meter = checks.querySelector('.prh-pg-meter[role="img"]');
  check("(8) a meter says its numbers in words", !!meter && meter.getAttribute("aria-label") === "20 of 22 checked");
  check("(8) maps name the colleges read and count the refusals",
    /1 of the 3 published maps read/.test(byTitle["Program maps"].textContent) &&
    /Read: Irvine Valley\. 2 refused the reader\./.test(byTitle["Program maps"].textContent), byTitle["Program maps"].textContent);
  check("(8) procedures list each college's version and read Next while their milestone is next",
    /Cerritos v4, Santa Monica v1/.test(byTitle["Reading procedures"].textContent) &&
    /^Next$/.test(byTitle["Reading procedures"].querySelector(".prh-pg-status").textContent));
  check("(8) addenda count live ones only, and a status-file note replaces the foot",
    /2 found at 2 colleges; 1 read\./.test(byTitle["Catalog addenda"].textContent) &&
    /The reading agent starts after the Oct 11 census apply\./.test(byTitle["Catalog addenda"].textContent), byTitle["Catalog addenda"].textContent);
  check("(8) the CPL figures name the one build", /Build 8292780f6cd5 on every checked program \(20\)/.test(byTitle["CPL figures"].textContent) &&
    /Built Oct 6/.test(byTitle["CPL figures"].textContent));
  const partsSum = root.querySelector('details[data-sec="progress:parts"] > summary');
  check("(8) the parts section's summary counts the done ones, so it reads shut", !!partsSum && /4 of 8 done/.test(partsSum.textContent),
    partsSum && partsSum.textContent);
  const roadSum = root.querySelector('details[data-sec="progress:milestones"] > summary');
  check("(8) the milestones' summary names where the harvest is", !!roadSum && /You are here: Read program maps/.test(roadSum.textContent));

  const meta = root.querySelector(".prh-pg-meta");
  check("(8) the header names the last run and links its handoff",
    /Last run S342 SkyBeacon \(Sam's session\), Oct 7, 1:15 PM PT/.test(meta.textContent) &&
    !!meta.querySelector('a[href$="/blob/main/docs/session_343_handoff.md"]'), meta.textContent);
  check("(8) the header says what waits on Sam", /1 waiting on Sam/.test(meta.textContent) && !!meta.querySelector(".prh-pg-waiting"));
  check("(8) the routine's next run rolls forward past now",
    M.nextRun({ next_run: { at: "2026-10-08T15:07:00Z", every_hours: 24 } }, new Date("2026-10-10T16:00:00Z")).toISOString() === "2026-10-11T15:07:00.000Z" &&
    M.nextRun({ next_run: { at: "2026-10-08T15:07:00Z", every_hours: 0 } }, new Date("2026-10-10T16:00:00Z")) === null);
  const side = root.querySelector(".prh-pg-side");
  check("(8) the side column carries the next step, the call and what changed",
    /A procedure for each pilot college/.test(side.textContent) && !!side.querySelector(".prh-pg-call") &&
    /Needs Sam's call/.test(side.textContent) && /No reply: both stay unchecked\./.test(side.textContent) &&
    side.querySelectorAll(".prh-pg-log li").length === 2 && !!side.querySelector("time[datetime]"), side.textContent);

  // Fewer than the pilot's twenty checked: You are here moves back to Read the pilot.
  const early = progressReady(12);
  const h2 = early.root.querySelector('[aria-current="step"]');
  check("(8) with 12 checked, You are here is Read the pilot, and Read program maps is next",
    !!h2 && /Read the pilot/.test(h2.textContent) && /8 pilot programs to check/.test(early.root.querySelector(".prh-pg-left").textContent) &&
    /Next milestone/.test(early.root.querySelectorAll(".prh-pg-steps > li")[2].textContent));
});

block("(8b)", function () {
  // Each read fails on its own and says so; none is drawn as a zero.
  const { root } = progressReady(20, { Q: "kb/queue_status.json answered 404", A: "program_source_addenda answered 503",
    active: "coci_college_programs gave no count" });
  const txt = root.textContent;
  check("(8b) the header names the status file that could not be read",
    /The queue's status file \(kb\/queue_status\.json\) could not be read \(kb\/queue_status\.json answered 404\)/.test(root.querySelector(".prh-pg-meta").textContent));
  const parts = {};
  Array.prototype.forEach.call(root.querySelectorAll(".prh-pg-grid > li"), function (p) { parts[p.querySelector("h4").textContent] = p; });
  check("(8b) the four checks cannot be counted without the file, and say so",
    /Could not be read/.test(parts["The four checks"].textContent) && !parts["The four checks"].querySelector(".prh-pg-meter"),
    parts["The four checks"].textContent);
  check("(8b) the addenda part names its failed read", /The addenda table could not be read \(program_source_addenda answered 503\)/.test(parts["Catalog addenda"].textContent));
  check("(8b) catalog reading falls back to the checked records it can see",
    /20 checked programs read at 2 colleges/.test(parts["Catalog reading"].textContent), parts["Catalog reading"].textContent);
  const left = root.querySelector(".prh-pg-left").textContent;
  check("(8b) an unknown count keeps the milestone open and is named, never zero",
    /New records to check \(could not be read\)/.test(left) && /Catalog addenda to read \(could not be read\)/.test(left) &&
    !/\b0 new records/.test(left), left);
  check("(8b) Every program says its count could not be read",
    /Could not be read/.test(root.querySelectorAll(".prh-pg-steps > li")[4].textContent));
  check("(8b) the side column says where its words come from", /could not be read/.test(root.querySelector(".prh-pg-side").textContent) &&
    !root.querySelector(".prh-pg-side .prh-pg-call"));
});

block("(8c)", function () {
  // The live read: COCI's count comes from Content-Range, the status file is never cached,
  // and a failed addenda read leaves the rest of the tab standing.
  const asked = [];
  const f = progressFixture(20);
  const { M, root } = loadModule({ fetch: function (url, opts) {
    asked.push([url, opts]);
    const ok = function (body, range) {
      return Promise.resolve({ ok: true, status: 200, headers: { get: function (h) { return /content-range/i.test(h) ? range : null; } },
        json: function () { return Promise.resolve(body); } });
    };
    if (/program_source_registry/.test(url)) return ok(f.reg);
    if (/program_requirement_records/.test(url)) return ok(f.recs);
    if (/program_source_addenda/.test(url)) return Promise.resolve({ ok: false, status: 503 });
    if (/coci_college_programs/.test(url)) return ok([{ control_number: "x" }], "0-0/20282");
    if (/queue_status/.test(url)) return ok(f.queue);
    return Promise.resolve({ ok: false, status: 404 });
  } });
  M._state.view = "progress";
  return M._load().then(function () {
    const coci = asked.filter(function (a) { return /coci_college_programs/.test(a[0]); })[0];
    check("(8c) COCI's count asks for an exact count", !!coci && coci[1].headers.Prefer === "count=exact");
    const q = asked.filter(function (a) { return /queue_status/.test(a[0]); })[0];
    check("(8c) the status file is read fresh", !!q && q[1].cache === "no-store");
    const txt = root.textContent;
    check("(8c) the count lands", /20,282 active programs/.test(txt), txt.slice(0, 500));
    check("(8c) a failed addenda read fails only its part", /You are here/.test(txt) &&
      /The addenda table could not be read \(program_source_addenda answered 503\)/.test(txt) && !/could not be read \(program_source_registry/.test(txt));
  });
});

block("(8d)", function () {
  // The Sequences view counts a host the reader opened ("open", the column's value) as read.
  const { M, root } = progressReady(20);
  M._state.view = "sequences"; M._render();
  const facts = root.querySelector(".prh-facts").textContent;
  check("(8d) Sequences counts an open map host as read", /1maps read/.test(facts.replace(/\s+/g, "")) || /1\s*maps read/.test(facts), facts);
});

block("(8f)", function () {
  // Sam, 2026-10-08, on this view: he saw two calls and "don't see how to view them and respond", then
  // "If you can embed the links on the tab, it would be fantastic". A call carries the sheet that answers it
  // (link, link_text) and where to see the item (view): a COBI tab's bare hash opens in place.
  const f = progressFixture(20);
  f.queue.calls[0].link = "https://claude.ai/artifact/sheet50";
  f.queue.calls[0].link_text = "Answer on Open Asks Sheet 50, cards 1 and 2";
  f.queue.calls[0].view = { href: "#cpl-pathways", text: "See both records on CPL Pathways" };
  const m = loadModule();
  m.M._state.registry = f.reg; m.M._state.records = f.recs; m.M._state.error = null; m.M._state.loading = false;
  m.M._state.progress = { addenda: f.addenda, active: 20282, queue: f.queue, errors: {}, readAt: new Date("2026-10-07T21:40:00Z") };
  m.M._state.view = "progress"; m.M._render();
  const call = m.root.querySelector(".prh-pg-box.prh-pg-call");
  const a = call ? call.querySelectorAll(".prh-pg-links a") : [];
  check("(8f) a call links the sheet card that answers it, in a new tab",
    a.length === 2 && a[0].getAttribute("href") === "https://claude.ai/artifact/sheet50" &&
    a[0].textContent === "Answer on Open Asks Sheet 50, cards 1 and 2" && a[0].getAttribute("target") === "_blank",
    call && call.innerHTML.slice(0, 500));
  check("(8f) and the tab where the item can be seen, opened in place",
    a.length === 2 && a[1].getAttribute("href") === "#cpl-pathways" && !a[1].getAttribute("target"));
  f.queue.calls[0].view = { href: "javascript:alert(1)", text: "x" };
  m.M._render();
  const bad = m.root.querySelector(".prh-pg-box.prh-pg-call .prh-pg-links").querySelectorAll("a");
  check("(8f) a view address that is neither https nor a bare hash is dropped", bad.length === 1);
});

block("(8e)", function () {
  // S345: a map a session's read found on a page the census does not score (Mt. San
  // Antonio's Guided Pathways sequences) leaves sequence_source none_found and sets
  // sequence_host, which the census never writes. Progress counts it as published and
  // read; Catalogs names its host instead of "None found".
  const f = progressFixture(20);
  const coc = f.reg[3];
  coc.sequence_host = "www.coc.example"; coc.sequence_access = "open";
  const m = loadModule();
  m.M._state.registry = f.reg; m.M._state.records = f.recs; m.M._state.error = null; m.M._state.loading = false;
  m.M._state.progress = { addenda: f.addenda, active: 20282, queue: f.queue, errors: {}, readAt: new Date("2026-10-07T21:40:00Z") };
  m.M._state.view = "progress"; m.M._render();
  const here = m.root.querySelector('.prh-pg-steps > li[aria-current="step"]');
  check("(8e) a read-recorded host counts as a published map, and as read when open",
    !!here && /2 of 4 published maps/.test(here.textContent), here && here.textContent);
  m.M._state.view = "catalogs"; m.M._state.show = "seq"; m.M._render();
  const txt = m.root.textContent;
  check("(8e) Catalogs lists it under Has a program map and names the host it was read on",
    /Found by a read on www\.coc\.example/.test(txt) && /College of the Canyons/.test(txt), txt.slice(0, 400));
  m.M._state.show = "all";
});

// ── (9) Every section collapses, and one control opens or shuts them all ────
// Sam, 2026-10-07: "make sure every section is collapsible and the tab has a
// collapse/expand all button." The failures this guards: a view with a section
// that cannot close, a Collapse all that skips Sierra or the views not on screen,
// and a choice that does not survive a re-render.
block("(9)", function () {
  const views = ["progress", "catalogs", "records", "sequences", "procedures"];
  const p = progressReady(20);
  views.forEach(function (v) {
    p.M._state.view = v; p.M._render();
    const panel = p.root.querySelector('[role="tabpanel"]');
    const secs = panel.querySelectorAll("details.prh-sec");
    const loose = Array.prototype.filter.call(panel.children[0].children, function (c) {
      return !c.matches("details.prh-sec, .prh-lede, .prh-pg-head, .prh-pg-main, .prh-empty");
    });
    check("(9) " + v + ": every section is a collapsible details with a heading in its summary",
      secs.length >= 2 && Array.prototype.every.call(secs, function (d) {
        const sum = d.querySelector(":scope > summary");
        return !!sum && !!sum.querySelector("h3, h4");
      }) && loose.length === 0, v + ": " + secs.length + " sections; loose: " + loose.map(function (c) { return c.className || c.tagName; }).join(","));
  });
  p.M._state.view = "progress"; p.M._render();
  const btns = p.root.querySelectorAll("header .prh-allctl button[data-all]");
  check("(9) the header offers Expand all and Collapse all, as words",
    btns.length === 2 && btns[0].textContent === "Expand all" && btns[1].textContent === "Collapse all");
  btns[1].click();
  const shut = p.root.querySelectorAll("details.prh-sec[open], details#prh-sierra[open]");
  check("(9) Collapse all shuts every section, Sierra included", shut.length === 0, shut.length + " still open");
  check("(9) Collapse all is remembered for Sierra", p.w.localStorage.getItem("cplProgramRequirements.sierra.v1") === "0");
  p.M._state.view = "catalogs"; p.M._render();
  check("(9) Collapse all carries to a view that was not on screen",
    p.root.querySelectorAll("details.prh-sec").length >= 2 && !p.root.querySelector("details.prh-sec[open]"));
  const sum = p.root.querySelector('details[data-sec="catalogs:glance"] > summary');
  check("(9) a shut section still says what is inside", /colleges with a catalog address/.test(sum.textContent), sum.textContent);
  p.root.querySelector("header .prh-allctl button[data-all=open]").click();
  check("(9) Expand all opens every section, Sierra included",
    !p.root.querySelector("details.prh-sec:not([open])") && p.root.querySelector("details#prh-sierra").open === true);
  const d = p.root.querySelector('details[data-sec="catalogs:registry"]');
  d.open = false; d.dispatchEvent(new p.w.Event("toggle"));
  p.M._render();
  check("(9) one section's choice survives a re-render",
    p.root.querySelector('details[data-sec="catalogs:registry"]').open === false &&
    p.root.querySelector('details[data-sec="catalogs:glance"]').open === true);
  const priv = loadModule({ noStorage: true });
  priv.M._state.registry = REGISTRY; priv.M._state.records = [IRONWORKER]; priv.M._state.view = "catalogs"; priv.M._render();
  priv.root.querySelector("header .prh-allctl button[data-all=close]").click();
  check("(9) a private window still collapses", !priv.root.querySelector("details.prh-sec[open]"));
});

// ── (7) Read-only, tokens, words ──────────────────────────────────────────
block("(7)", function () {
  check("(7) the tab writes nothing", !/method\s*:\s*["'](POST|PATCH|PUT|DELETE)/i.test(SRC) && !/\/rpc\//.test(SRC));
  const css = (SRC.match(/function ensureCss\(\)[\s\S]*?\n  }\n/) || [""])[0];
  check("(7) the injected CSS uses tokens, never a raw hex", css.length > 500 && !/#[0-9a-fA-F]{3,8}\b/.test(css));
  check("(7) plain words, no emoji", !/[\u{1F300}-\u{1FAFF}✅✔✓❌⚠]/u.test(SRC));
  check("(7) American spelling in rendered text", !/\b(colour|behaviour|organisation|catalogue|centre)\b/i.test(SRC));
});

Promise.all(pending).then(function () {
  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nprogram_requirements.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
});
