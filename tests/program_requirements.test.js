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
//   - a private window (localStorage throws) still renders.
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

// ── (4b) Sierra docks in the tab (Sam, open-asks sheet 38 card 5) ─────────
// The failure this guards: a second copy of the assistant, or a mount that drops
// the tab's surface, or a section that hides her behind a dead control.
block("(4b)", function () {
  const a = ready();
  a.M._state.view = "catalogs"; a.M._render();
  const sec = a.root.querySelector("details#prh-sierra");
  check("(4b) Sierra's section is in the tab, closed until the reader opens it", !!sec && !sec.open);
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
  b.root.querySelector("header button.prh-ask").click();
  const sec2 = b.root.querySelector("details#prh-sierra");
  check("(4b) Ask Sierra opens the section", sec2.open === true);
  const act = b.w.document.activeElement;
  check("(4b) and puts the cursor in her box", !!act && act.classList.contains("cplchat-input"));
  check("(4b) the open section is remembered",
    b.w.localStorage.getItem("cplProgramRequirements.sierra.v1") === "1");
  b.M._render();
  check("(4b) a re-render keeps the section open and mounts her again",
    b.root.querySelector("details#prh-sierra").open === true && calls.length === 2);

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
  check("(4) the header asks Sierra with a button that opens her section",
    !!root.querySelector('header button.prh-ask[aria-controls="prh-sierra"]'));

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
  check("(5) four views", tabs.length === 4);
  check("(5) one tab selected, the rest out of the tab order",
    root.querySelectorAll('[role="tab"][aria-selected="true"]').length === 1 &&
    root.querySelectorAll('[role="tab"][tabindex="-1"]').length === 3);
  tabs[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
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
    check("(6b) both tables are read", asked.length === 2 &&
      asked.some(function (u) { return /\/rest\/v1\/program_source_registry\?select=/.test(u); }) &&
      asked.some(function (u) { return /\/rest\/v1\/program_requirement_records\?select=/.test(u); }), asked.join(" "));
    check("(6b) one failed table fails the read, naming it", /program_requirement_records answered 503/.test(root.textContent),
      root.textContent.slice(0, 300));
  });
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
