// The Courses List's job filters, which the Commons counts open (Sam, 2026-11-04: "the links on all surfaces should open
// to the filtered view of the job needed"). Guards:
//   (1) #coci-lookup/list/<job> opens the Courses List on that job: the courses whose common course the auditor tags
//       (seedless, units, nodesc) or whose M-ID sits on a stray identity code from the Subjects scan;
//   (2) the auditor's ten-megabyte file is read only when a job filter is chosen, and once; until it is read the job
//       words carry no count, then they count;
//   (3) the List says how many common courses the job holds, or that the read failed, never an empty list as a zero;
//   (4) an address followed while the tab is open, or on a later arrival after the tab's reset, still opens the job;
//   (5) the Courses Progress page's issues open the job, filtered, and so do the Commons file's counts;
//   (6) the List first, SkyView beside it (Sam, 2026-11-04: "I want to be able to use list or skyview. Skyview is still
//       too buggy to make the main workspace"): the Commons row's home and links, the Progress page's links, and the
//       List's own line, whose counts set its filters.
// Run from repo root: `npm test` (or `node tests/coci_list_jobs.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond]); if (!cond && why) console.log("     " + name + ": " + why); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

// rows: [collegeIdx, ctrl, subj, num, title, units, credit, top, cid, ccn, mid (the extract's, 2026-07-09)]
const LOOKUP = {
  _built_at: "2026-07-09",
  colleges: ["American River College", "Rio Hondo College", "Cypress College "],
  rows: [
    [0, "CCC1", "ENGL", "300", "College Composition", 4, "C", "1501.00: English", "ENGL 100", "ENGL C1000", "ENGL M1001"],
    [1, "CCC2", "ENGL", "101", "Composition and Reading", 3, "C", "1501.00: English", "ENGL 100", "", "ENGL M1999"],
    [2, "CCC3", "ENGL", "100", "Freshman Composition", 4, "C", "1501.00: English", "", "", ""],
    [0, "CCC4", "CARPT", "111", "Tool and Equipment Applications", 1.5, "C", "0952.10: Carpentry", "", "", "CNST M1009"],
    [1, "CCC5", "CARP", "040K", "Rigging", 2, "C", "0952.10: Carpentry", "", "", ""],
    [1, "CCC6", "ESL", "010", "English Fundamentals", 0, "N", "4930.87: English as a Second Language", "", "", ""],
    [0, "CCC7", "WELD", "110", "Welding I", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [1, "CCC8", "WELD", "101", "Intro to Welding", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [1, "CCC9", "ESL", "020", "Conversation", 0, "E", "4930.87: English as a Second Language", "", "", ""]
  ]
};
const MEMBERS = {
  generated_at: "2026-11-01 05:18",
  colleges: ["American River College", "Rio Hondo College", "Cypress College", "Allan Hancock College"],
  members: {
    "ENGL M1001": [{ c: 0, cn: "CCC1" }, { c: 1, cn: "CCC2" }, { c: 2, cn: "CCC3" }],
    "CNST M1009": [{ c: 0, cn: "CCC4" }],
    "WELD M1109": [{ c: 0, cn: "CCC7" }, { c: 1, cn: "CCC8" }, { c: 3, cn: "CCCX" }],
    "MANF M1200": [{ c: 1, cn: "CCC8" }]
  }
};

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#coci-lookup"), runScripts: "dangerously" });
  const w = dom.window, calls = [], fetches = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function (url) {
    fetches.push(String(url));
    if (/row_audit\/latest\.json/.test(String(url))) return opts.auditFail ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
      : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(AUDIT))) });
    if (/csr_out\/latest\.json/.test(String(url))) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(SCAN))) });
    const rows = /CCC|ENGL%20300/.test(String(url)) ? [{ course_code: "ENGL 300", heading: "Student Learning Outcomes", lead: null,
      outcomes: ["Write an argument.", "Revise a draft."], maps_to: null, shape: "list", fingerprint: "a".repeat(32),
      source_url: "https://example.org/outline/engl300", source_kind: "course_outline", source_system: "curriqunet", read_run: 3,
      loaded_at: "2026-10-13T20:00:00Z" }] : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(rows) });
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push(s);
    if (s === "commons_list.js" && !opts.noEngine) { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js" && !opts.noMembers) w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    if (/^coci_lookup_desc_E\.js$/.test(s)) { w.CPL_COCI_DESC = w.CPL_COCI_DESC || {}; w.CPL_COCI_DESC.E = { CCC1: "Expository writing and critical reading." }; }
    setTimeout(cb, 0);
  } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document, calls, fetches };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P = "ccl-";
function bodyRows(d) { return Array.from(d.querySelectorAll("." + P + "table tbody tr")); }
function dataRows(d) { return bodyRows(d).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow")); }
function heads(d) { return Array.from(d.querySelectorAll("." + P + "table thead th")).map((th) => txt(th.querySelector("." + P + "sort"))).filter(Boolean); }
function colOf(d, name) { return heads(d).findIndex((h) => h.indexOf(name) === 0); }
// The cell under a column, found by its name (the select box comes first).
function cell(tr, d, name) { return tr.children[colOf(d, name) + 1]; }
function titles(d) { return dataRows(d).map((tr) => txt(cell(tr, d, "Title"))); }
function word(d, re) { return Array.from(d.querySelectorAll("button")).find((b) => re.test(txt(b))); }
function input(w, node, v) { node.value = v; node.dispatchEvent(new w.Event("input")); }

const AUDIT = { rows: [{ id: "ENGL M1001", k: "C", tags: ["unit_anomaly", "blank_description"] }, { id: "WELD M1109", k: "C", tags: ["seed_untouched_discipline"] },
  { id: "MANF M1200", k: "C", tags: [] }] };
const SCAN = { _mid_codes: { strays: [{ code: "CNST", ids: 1, disciplines: { "(no discipline)": 1 } }] }, findings: [] };
const auditReads = (t) => t.fetches.filter((u) => /row_audit/.test(u)).length;

(async () => {
  const t = tab({ hash: "#coci-lookup/list/units" });
  await sleep(40);
  check("(1) ⭐ #coci-lookup/list/units lists the courses of the common course the auditor tags", titles(t.d).sort().join("|") === "College Composition|Composition and Reading|Freshman Composition", titles(t.d).join("|"));
  check("(3) the List says how many common courses the job holds", /A unit anomaly: 1 common course the auditor marks; their 3 local courses are below/.test(txt(t.d.querySelector(".cplcoci-list, #cplcoci-list-mount") || t.d.body)));
  const fw = Array.from(t.d.querySelectorAll("." + P + "fgroup > :not(." + P + "fglabel)")).map(txt);
  check("(2) once read, the job words count their courses", fw.indexOf("A unit anomaly (3)") >= 0 && fw.indexOf("Discipline no seed has touched (2)") >= 0
    && fw.indexOf("No catalog description (3)") >= 0 && fw.indexOf("On a stray identity code (1)") >= 0, fw.join(" | "));
  word(t.d, /^Discipline no seed has touched/).click(); await sleep(20);
  check("(1) seedless lists the courses in a common course whose discipline no seed touched", titles(t.d).sort().join("|") === "Intro to Welding|Welding I", titles(t.d).join("|"));
  word(t.d, /^On a stray identity code/).click(); await sleep(20);
  check("(1) ⭐ stray lists the courses whose M-ID sits on a stray code", titles(t.d).join("|") === "Tool and Equipment Applications", titles(t.d).join("|"));
  check("(2) the auditor's file is read once", auditReads(t) === 1);

  const plain = tab();
  await sleep(40);
  const fw2 = Array.from(plain.d.querySelectorAll("." + P + "fgroup > :not(." + P + "fglabel)")).map(txt);
  check("(2) ⭐ the auditor's file is not read until a job is chosen, and its words carry no count", auditReads(plain) === 0 && fw2.indexOf("A unit anomaly") >= 0, fw2.join(" | "));
  plain.w.location.hash = "#coci-lookup/list/nodesc";
  plain.w.dispatchEvent(new plain.w.HashChangeEvent("hashchange")); await sleep(40);
  check("(4) ⭐ an address followed while the tab is open opens the job", titles(plain.d).length === 3 && auditReads(plain) === 1, titles(plain.d).join("|"));
  plain.w.dispatchEvent(new plain.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  plain.w.location.hash = "#coci-lookup/list/seedless";
  plain.w.dispatchEvent(new plain.w.CustomEvent("cpl-tab-activated", { detail: { tab: "coci-lookup" } })); await sleep(40);
  check("(4) a later arrival's reset keeps the address's job", titles(plain.d).sort().join("|") === "Intro to Welding|Welding I", titles(plain.d).join("|"));

  const bad = tab({ hash: "#coci-lookup/list/units", auditFail: true });
  await sleep(40);
  check("(3) a failed read says so, never an empty list as a zero", /row_audit\/latest\.json answered 404, so this filter shows nothing/.test(txt(bad.d.body)));

  const SRC2 = fs.readFileSync("coci_lookup.js", "utf8");
  check("(5) the Progress page's issues open their job on the List", /words: "Open them in the List", go: goList\(lf\[1\]\)/.test(SRC2));
  const CM = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
  const course = CM.rows.find((r) => r.key === "course"), subj = CM.rows.find((r) => r.key === "subjects");
  check("(5) ⭐ the Commons file's Courses counts open their jobs", ["seedless", "units", "nodesc"].every((f) => course.issues.some((i) => i.open === "#coci-lookup/list/" + f)));
  check("(5) and the Subjects strays open the stray filter", subj.issues.some((i) => /neither a Common SUBJ/.test(i.words) && i.open === "#coci-lookup/list/stray"));

  check("(6) ⭐ the Commons row opens the Courses List first, SkyView second", course.tab === "#coci-lookup/courses"
    && course.links[0].href === "#coci-lookup/courses" && /skyview\.html$/.test(course.links[1].href) && course.pair.every((p) => p.open === "#coci-lookup/courses"));
  check("(6) the Progress page's links put the List first", /links: \[\{ words: "Open the Courses List", go: goView\("courses"\) \}, \{ words: "Open SkyView", href: sky \}/.test(SRC2));
  check("(6) the List's line sets its own filters from a count", /var m = \/\^#coci-lookup\\\/\(\?:courses\|list\\\/\(\[a-z\]\+\)\)\$\/\.exec\(open\)/.test(SRC2));

  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ✓ " : "  ✗ ") + n); if (ok) pass++; });
  console.log("\ncoci_list_jobs: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
