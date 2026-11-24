// The MQ view under the Subjects tab, #commons/subjects/mq, and the sidebars it opens (S719).
// Sam, 2026-11-23 (r-mq-view-more-than-codes-sam-2026-11-23): "we may need an mq view that integrates our subj codes and
// decisions to we can troubleshoot anything moving forward"; and (r-sidebar-tables-sort-resize-and-stack-sam-2026-11-23)
// "sidebar headers should be sortable and resizeable like the main table--this is a rule. Also add clickable links to
// open a second sidbar as needed--example Courses column for CT has 162 courses--would like to see those courses in
// another sidebar". The mock: https://claude.ai/artifact/SHS5eNN4nb5vLkNCzzWvVE.
//
// WHAT THIS GUARDS (each judged only on what the test injects, never on committed rows):
//   (1) ⭐ #commons/subjects/mq draws every injected MQ discipline with its list type, its provisions, its common code
//       and its local codes; it reads kb/status/mq_view.json only when it opens; its figures filter and say their
//       counts; its address round-trips, through address() and through the tab's viewAddress report;
//   (2) ⭐ a common code opens a sidebar holding the statewide list filtered to that code: its rows are exactly the
//       injected statewide codes whose common code (a person's filing first, then the call) is that code; the sidebar
//       has its own address, and the filter's own address, #commons/subjects/statewide/code/<CODE>, opens the same
//       list on the list's page;
//   (3) ⭐ a header press in the sidebar's table sorts its rows, a second press reverses them, and the arrow keys on a
//       header's edge change that column's width;
//   (4) ⭐ a count in the sidebar's table opens a second sidebar listing exactly the injected items it counts (the
//       courses from the state course list, loaded only on that press; the colleges from the statewide list); Close on
//       the second returns to the first, its address and the count that opened it;
//   (5) ⭐ the course panel, and every sidebar, starts at or below the bottom of COBI's header bar, read from the page,
//       and runs to the top once the bar scrolls away.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects_mq.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));

/* The MQ view's file, in kb/_mq_view.py's shape. */
function disc(name, code, extra) {
  return Object.assign({ name, key: name, areas: "", cite: "", code, code_note: "", code_source: "a person's pick", confidence: 0.97, level: "Confident",
    gaps: [], local_codes: null, mids_credit: 4, mids_noncredit: 0, noncredit: false, noncredit_categories: [], our_name: name, pages: "20",
    provisions: [], same_as: "", type_words: "Master's", types: ["masters"], vocational_share: null }, extra || {});
}
const MQV = {
  _what: "fixture",
  provisions: { apprenticeship_53413: { disciplines: {}, printed_page: 61, section: "CCR 53413", words: "Apprenticeship instructors." } },
  totals: { disciplines: 5 }, types: {},
  noncredit_categories_without_discipline: ["Workforce Preparation"],
  rows: [
    disc("Mathematics", "MATH", { local_codes: { colleges: 6, confident: 1, examples: ["MAT"], filed: 1, other: 2 } }),
    disc("Physics", "PHYS", { gaps: ["Master's list, but 91% of its credit M-IDs carry a vocational TOP code, which takes the experience qualifications"], level: "Leaning", confidence: 0.6, code_source: "assigned", code_note: "Assigned at Leaning (60%)." }),
    disc("Construction Technology", "CNST", { types: ["any"], type_words: "Any degree", provisions: ["apprenticeship_53413"], cite: "CCR 53413", local_codes: { colleges: 6, confident: 2, examples: ["CT", "CARP"], filed: 0, other: 0 } }),
    disc("African American Studies", "ETHS", { our_name: "Ethnic Studies", gaps: ["Our name is Ethnic Studies"] }),
    disc("Ethnic Studies", "ETHS")]
};
/* The statewide list, in kb/_statewide_subject_codes.py's shape. */
function code(k, common, conf, extra) {
  return Object.assign({ code: k, spellings: [k], colleges: [["Alpha College", 3], ["Beta College", 2]], courses: 5, credit: 5, noncredit: 0,
    titles: ["Intro " + k], local_titles: [], draft: null, filing: null, peers: { votes: 4, lead: common, share: 1, tally: [[common, 4]] },
    title_call: common, hint: null, "class": "peers",
    recommend: { common, discipline: common === "MATH" ? "Mathematics" : common === "PHYS" ? "Physics" : "Construction Technology", confidence: conf, why: "peer votes say " + common, next: null } }, extra || {});
}
const SW = {
  _rule: "fixture", totals: { codes: 7, colleges: 5, pairs: 14, courses: 40, one_college: 0, by_class: {} }, self_recall: [],
  common_codes: [["MATH", "Mathematics"], ["PHYS", "Physics"], ["CNST", "Construction Technology"]],
  codes: [
    code("MAT", "MATH", 0.995, { courses: 9 }), code("MTH", "MATH", 0.8, { courses: 2 }),
    /* a person filed MOVED under MATH, so its common code is MATH whatever the call says (kb/_mq_view.py keys it so) */
    code("MOVED", "PHYS", 0.4, { "class": "settled", filing: { common: "MATH", discipline: "Mathematics", who: "Sam", at: "2026-11-04" } }),
    code("LOW", "PHYS", 0.05),
    code("CT", "CNST", 1, { courses: 7, colleges: [["Alpha College", 3], ["Beta College", 2], ["Gamma College", 1], ["Delta College", 1]] }),
    code("CARP", "CNST", 0.95, { courses: 2, colleges: [["Alpha College", 2]] }),
    code("ZED", "PHYS", 0.7)]
};
/* The state course list: CT's seven courses, plus rows that must not count (another college, another code), and
   Beta's courses under "Beta College Credit", which the statewide builder reads as Beta College. */
const COCI = {
  colleges: ["Alpha College", "Beta College Credit", "Gamma College", "Delta College", "Other College"],
  rows: [[0, "c1", "CT", "101", "Framing", 3, "C", "0952.10: Carpentry", "", "", ""], [0, "c2", "CT", "102", "Roofing", 3, "C", "0952.10: Carpentry", "", "", ""],
    [0, "c3", "CT", "103", "Stairs", 2, "C", "0952.10: Carpentry", "", "", ""], [1, "c4", "CT", "10", "Blueprints", 2, "C", "0952.00", "", "", ""],
    [1, "c5", "CT", "20", "Codes", 2, "N", "0952.00", "", "", ""], [2, "c6", "CT", "1", "Safety", 1, "C", "0952.00", "", "", ""],
    [3, "c7", "CT", "5", "Tools", 1, "C", "0952.00", "", "", ""],
    [4, "x1", "CT", "9", "Not one of CT's colleges", 3, "C", "", "", "", ""], [0, "x2", "CTE", "1", "Another code", 3, "C", "", "", "", ""],
    [0, "x3", "CARP", "1", "Carpentry I", 3, "C", "", "", "", ""]]
};
const CT_COURSES = ["Alpha College|CT 101", "Alpha College|CT 102", "Alpha College|CT 103", "Beta College|CT 10", "Beta College|CT 20", "Gamma College|CT 1", "Delta College|CT 5"];
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8")),
  "kb/status/statewide_subject_codes.json": SW,
  "kb/status/mq_view.json": MQV
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";

function load(hash, opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="header" id="hdr" style="height:64px">COBI</div><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window, o = {}, fetched = [], scripts = [], reports = {};
  const hdr = { bottom: opt.headerBottom == null ? 64 : opt.headerBottom };
  w.document.getElementById("hdr").getBoundingClientRect = () => ({ top: hdr.bottom - 64, bottom: hdr.bottom, left: 0, right: 1280, width: 1280, height: 64 });
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = {
    get: () => null, isFresh: () => false, ensureFresh: () => Promise.resolve(null),
    authHeaders: (extra) => Object.assign({ apikey: "ANON", Authorization: "Bearer ANON" }, extra || {}),
    viewAddress: (tab, fn) => { reports[tab] = fn; }
  };
  /* The tab loader: the state course list arrives only when asked for. */
  w.CPL_TABS = { loadScript: (src, g, cb) => { scripts.push(src); if (src === "coci_lookup_data.js") w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(COCI)); setTimeout(cb, 0); } };
  w.fetch = function (url) {
    url = String(url);
    fetched.push(url);
    if (url.indexOf(REST) === 0) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    const hit = FILES[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, S: w.CPL_COMMONS_SUBJECTS, fetched, scripts, reports, hdr };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
const mqRows = (d) => Array.from(d.querySelectorAll("table.csb-mq tbody tr")).map((r) => r.getAttribute("data-mq"));
const sideRows = (d) => Array.from(d.querySelectorAll("#csb-side-1 .csw-table tbody tr")).map((r) => r.getAttribute("data-code"));
const same = (a, b) => JSON.stringify(a.slice().sort()) === JSON.stringify(b.slice().sort());

/* Each group runs on its own, so a group that stops part way records one failing check and the rest still run. */
async function group(n, fn) {
  try { await fn(); check("(" + n + ") the group ran to its end", true); }
  catch (e) { check("(" + n + ") ⭐ the group ran to its end", false, String(e && e.message || e).slice(0, 200)); }
}

(async function () {
  /* (1) the view */
  await group(1, async function () {
    let x, d;
    x = load("#commons/subjects");
    await x.M.boot(); await settle();
    check("(1) the Subjects page does not read the MQ file until the view opens", x.fetched.indexOf("kb/status/mq_view.json") < 0);
    check("(1) the Subjects page links the MQ view", !!x.d.querySelector('a[data-csb-go="mq"]'));
    x.d.querySelector('a[data-csb-go="mq"]').click(); await settle();
    check("(1) ⭐ the link opens the MQ view, which reads its file then", txt(x.d.getElementById("csb-h")) === "Minimum Qualifications disciplines" && x.fetched.indexOf("kb/status/mq_view.json") >= 0);
    x = load("#commons/subjects/mq");
    await x.M.boot(); await settle();
    d = x.d;
    check("(1) ⭐ the address opens the MQ view", txt(d.getElementById("csb-h")) === "Minimum Qualifications disciplines");
    check("(1) ⭐ every injected discipline is a row, A to Z", JSON.stringify(mqRows(d)) === JSON.stringify(["African American Studies", "Construction Technology", "Ethnic Studies", "Mathematics", "Physics"]), mqRows(d));
    const cn = d.querySelector('table.csb-mq tr[data-mq="Construction Technology"]');
    check("(1) a row shows its list type, its provisions, its common code with its level, and its local codes",
      txt(cn.children[1]) === "Any degree" && /Apprenticeship tie/.test(txt(cn.children[2])) && /CCR 53413/.test(txt(cn.children[2]))
      && txt(cn.children[3].querySelector("button[data-mq-code]")) === "CNST" && txt(cn.children[3].querySelector(".csb-sub")) === "Confident 97%, a person’s pick"
      && txt(cn.children[6].querySelector("button[data-mq-count]")) === "2 codes" && txt(cn.children[6].querySelector(".csb-sub")) === "0 filed, 2 Confident", txt(cn));
    const ph = d.querySelector('table.csb-mq tr[data-mq="Physics"]');
    check("(1) a row names what to look at, and an assigned code shows its level alone (the mock)", /vocational TOP code/.test(txt(ph.children[8])) && txt(ph.children[3].querySelector(".csb-sub")) === "Leaning 60%", txt(ph));
    check("(1) the figures say their counts", txt(d.getElementById("csb-mq-f-all")) === "All 5" && txt(d.getElementById("csb-mq-f-gaps")) === "Something to look at 2"
      && txt(d.getElementById("csb-mq-f-appr")) === "Apprenticeship 1", txt(d.getElementById("csb-mq-figs")));
    d.getElementById("csb-mq-f-gaps").click(); await settle();
    check("(1) ⭐ a figure shows what it counts", same(mqRows(d), ["African American Studies", "Physics"]) && d.getElementById("csb-mq-f-gaps").getAttribute("aria-pressed") === "true"
      && /^2 of 5 disciplines$/.test(txt(d.getElementById("csb-mq-count"))), mqRows(d));
    d.getElementById("csb-mq-f-all").click(); await settle();
    const q = d.getElementById("csb-mq-q");
    q.focus(); q.value = "apprentice"; q.dispatchEvent(new x.w.Event("input", { bubbles: true }));
    check("(1) the search finds a discipline by its provision, and keeps its focus", same(mqRows(d), ["Construction Technology"]) && d.activeElement === q
      && /^1 of 5 disciplines$/.test(txt(d.getElementById("csb-mq-count"))), mqRows(d));
    check("(1) the provisions and the noncredit category with no discipline are named", /Apprenticeship tie, CCR 53413 \(printed page 61\)/.test(txt(d.querySelector(".csb-mq-prov")))
      && /Workforce Preparation/.test(txt(d.querySelector(".csb-foot"))));
    check("(1) ⭐ the view reports its address, to address() and to the tab's viewAddress", x.S.address() === "commons/subjects/mq" && x.w.location.hash === "#commons/subjects/mq"
      && typeof x.reports.commons === "function" && x.reports.commons() === "commons/subjects/mq", x.reports.commons && x.reports.commons());
    check("(1) every header cell carries a scope and the table scrolls in a labelled region", Array.from(d.querySelectorAll("table.csb-mq th")).every((th) => th.getAttribute("scope"))
      && d.getElementById("csb-mq-wrap").getAttribute("role") === "region");
  });

  /* (2) a code opens the statewide list filtered to it */
  await group(2, async function () {
    let x, d;
    x = load("#commons/subjects/mq");
    await x.M.boot(); await settle();
    d = x.d;
    d.querySelector('table.csb-mq tr[data-mq="Mathematics"] button[data-mq-code="MATH"]').click(); await settle();
    const side = d.getElementById("csb-side-1");
    check("(2) ⭐ a code opens a sidebar beside the view, its heading the code and its discipline", side && txt(d.getElementById("csb-side-1-h")) === "MATH, Mathematics"
      && d.getElementById("commons-root").classList.contains("csb-beside"));
    check("(2) ⭐ the sidebar's rows are exactly the statewide codes whose common code is MATH, a person's filing first", same(sideRows(d), ["MAT", "MTH", "MOVED"]), sideRows(d));
    check("(2) the sidebar is the statewide list itself, its table and its rows", !!side.querySelector(".csw-side .csw-table") && /3 local codes statewide take MATH as their common code/.test(txt(d.getElementById("csw-side-sum"))));
    check("(2) ⭐ the sidebar has its own address", x.S.address() === "commons/subjects/mq/code/MATH" && x.w.location.hash === "#commons/subjects/mq/code/MATH");
    const own = side.querySelector('a[data-csb-go="statewide/code/MATH"]');
    check("(2) the sidebar links the filter's own address", !!own && own.getAttribute("href") === "#commons/subjects/statewide/code/MATH");
    d.querySelector('table.csb-mq tr[data-mq="Physics"] button[data-mq-code="PHYS"]').click(); await settle();
    check("(2) another code's sidebar holds its own codes, the filed code left out", same(sideRows(d), ["LOW", "ZED"]), sideRows(d));
    x = load("#commons/subjects/mq/code/CNST");
    await x.M.boot(); await settle();
    check("(2) ⭐ the sidebar's address opens it directly", same(sideRows(x.d), ["CT", "CARP"]) && x.S.address() === "commons/subjects/mq/code/CNST", sideRows(x.d));
    x = load("#commons/subjects/statewide/code/MATH");
    await x.M.boot(); await settle();
    const swRows = Array.from(x.d.querySelectorAll(".csw-table tbody tr")).map((r) => r.getAttribute("data-code"));
    check("(2) ⭐ the filter's own address opens the same list on the list's page", same(swRows, ["MAT", "MTH", "MOVED"]) && txt(x.d.getElementById("csb-h")) === "Every local subject code, statewide"
      && x.d.getElementById("csw-f-code").getAttribute("aria-pressed") === "true" && /^Under MATH \(3\)$/.test(txt(x.d.getElementById("csw-f-code"))), swRows);
    check("(2) the list's page reports the filter's address", x.S.address() === "commons/subjects/statewide/code/MATH");
    x.d.getElementById("csw-f-all").click(); await settle();
    check("(2) another chip leaves the code filter and its address", x.S.address() === "commons/subjects/statewide" && !x.d.getElementById("csw-f-code")
      && x.d.querySelectorAll(".csw-table tbody tr").length === 7);
  });

  /* (3) the sidebar's table sorts and resizes */
  await group(3, async function () {
    let x, d;
    x = load("#commons/subjects/mq/code/MATH");
    await x.M.boot(); await settle();
    d = x.d;
    const sortB = d.querySelector('#csb-side-1 .csw-table thead button[data-csb-sort="2"]');
    sortB.click(); await settle();
    const up = sideRows(d);
    check("(3) ⭐ a header press in the sidebar sorts its rows (Courses, low to high)", JSON.stringify(up) === '["MTH","MOVED","MAT"]' && /low to high/.test(txt(sortB)), up);
    d.querySelector('#csb-side-1 .csw-table thead button[data-csb-sort="2"]').click(); await settle();
    const down = sideRows(d);
    check("(3) ⭐ a second press reverses the order", JSON.stringify(down) === JSON.stringify(up.slice().reverse()) && d.querySelector('#csb-side-1 .csw-table thead th:nth-child(3)').getAttribute("aria-sort") === "descending", down);
    const grip = d.querySelectorAll("#csb-side-1 .csw-table thead .csb-grip")[2], col = d.querySelectorAll("#csb-side-1 .csw-table col")[2];
    const before = col.style.width;
    grip.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const wider = col.style.width;
    grip.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    grip.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    check("(3) ⭐ the arrow keys on a header's edge change that column's width", grip.getAttribute("role") === "separator" && before !== wider && /^\d+px$/.test(wider)
      && parseInt(col.style.width, 10) === parseInt(wider, 10) - 48, [before, wider, col.style.width]);
    check("(3) the main table's sort and resize are the same code (one gridify)", (fs.readFileSync("commons_subjects.js", "utf8").match(/function gridify\(/g) || []).length === 1
      && /side \? "statewide-side" : "statewide"/.test(fs.readFileSync("commons_subjects.js", "utf8")));
  });

  /* (4) a count opens a second sidebar */
  await group(4, async function () {
    let x, d;
    x = load("#commons/subjects/mq/code/CNST");
    await x.M.boot(); await settle();
    d = x.d;
    check("(4) the state course list is not read before a Courses count is pressed", x.scripts.indexOf("coci_lookup_data.js") < 0);
    const ctCount = d.querySelector('#csb-side-1 button[data-csb-second="courses"][data-csb-local="CT"]');
    check("(4) a code's Courses figure is a word that opens what it counts", !!ctCount && txt(ctCount) === "7" && /The 7 courses under CT in COCI/.test(ctCount.getAttribute("aria-label")));
    ctCount.click(); await settle();
    const second = d.getElementById("csb-side-2");
    const listed = Array.from(d.querySelectorAll("#csb-side-2 table tbody tr")).map((r) => r.getAttribute("data-course"));
    check("(4) ⭐ the count opens a second sidebar listing exactly the courses it counts", second && same(listed, CT_COURSES) && x.scripts.indexOf("coci_lookup_data.js") >= 0, listed);
    check("(4) ⭐ the first sidebar stays open beside it, and the address names both", !!d.getElementById("csb-side-1") && x.S.address() === "commons/subjects/mq/code/CNST/courses/CT"
      && /^(beside|over)$/.test(d.getElementById("commons-root").getAttribute("data-csb-stack")));
    check("(4) the second sidebar's table sorts and resizes too", !!second.querySelector("thead button.csb-sort") && !!second.querySelector("thead .csb-grip[role=separator]"));
    check("(4) the second sidebar resizes from its own edge and keeps its top row", !!d.getElementById("csb-side-2-grip") && d.getElementById("csb-side-2-head").contains(d.getElementById("csb-side-2-close")));
    d.getElementById("csb-side-2-close").click(); await settle();
    check("(4) ⭐ Close on the second returns to the first, its address and the count that opened it", !d.getElementById("csb-side-2") && !!d.getElementById("csb-side-1")
      && x.S.address() === "commons/subjects/mq/code/CNST" && d.activeElement && d.activeElement.getAttribute("data-csb-local") === "CT");
    d.querySelector('#csb-side-1 button[data-csb-second="colleges"][data-csb-local="CT"]').click(); await settle();
    const cols = Array.from(d.querySelectorAll("#csb-side-2 table tbody tr")).map((r) => r.getAttribute("data-college"));
    check("(4) ⭐ a Colleges count opens the colleges it counts", same(cols, ["Alpha College", "Beta College", "Gamma College", "Delta College"]) && x.S.address() === "commons/subjects/mq/code/CNST/colleges/CT", cols);
    d.getElementById("csb-side-1-close").click(); await settle();
    check("(4) Close on the first closes both and gives the view its width back", !d.querySelector(".csb-side") && x.S.address() === "commons/subjects/mq"
      && !d.getElementById("commons-root").classList.contains("csb-beside"));
    x = load("#commons/subjects/mq/code/CNST/courses/CT");
    await x.M.boot(); await settle();
    check("(4) the second sidebar's address opens both", !!x.d.getElementById("csb-side-1") && same(Array.from(x.d.querySelectorAll("#csb-side-2 table tbody tr")).map((r) => r.getAttribute("data-course")), CT_COURSES));
    x = load("#commons/subjects/statewide");
    await x.M.boot(); await settle();
    x.d.getElementById("csw-f-all").click(); await settle();
    x.d.querySelector('.csw-table button[data-csb-second="courses"][data-csb-local="CT"]').click(); await settle();
    check("(4) on the list's own page a count opens what it counts in a sidebar", x.S.address() === "commons/subjects/statewide/courses/CT"
      && same(Array.from(x.d.querySelectorAll("#csb-side-2 table tbody tr")).map((r) => r.getAttribute("data-course")), CT_COURSES));
  });

  /* (5) below the header bar */
  await group(5, async function () {
    let x, d;
    x = load("#commons/subjects/alpha/MATH");
    await x.M.boot(); await settle();
    const panel = x.d.getElementById("csb-panel");
    check("(5) ⭐ the course panel starts at or below the header bar's bottom", panel && parseInt(panel.style.top, 10) >= 64, panel && panel.style.top);
    x.hdr.bottom = -10;
    x.d.dispatchEvent(new x.w.Event("scroll"));
    check("(5) once the bar scrolls away the panel runs to the top", panel.style.top === "0px", panel.style.top);
    x = load("#commons/subjects/mq/code/CNST/courses/CT", { headerBottom: 80 });
    await x.M.boot(); await settle();
    check("(5) ⭐ both sidebars start below the header bar too", parseInt(x.d.getElementById("csb-side-1").style.top, 10) >= 80 && parseInt(x.d.getElementById("csb-side-2").style.top, 10) >= 80,
      [x.d.getElementById("csb-side-1").style.top, x.d.getElementById("csb-side-2").style.top]);
    check("(5) the offset is read from the page, never a fixed number", /function headerBottom\(\)[\s\S]{0,200}getBoundingClientRect\(\)\.bottom/.test(fs.readFileSync("commons_subjects.js", "utf8")));
  });

  let fail = 0;
  for (const [n, ok, det] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + JSON.stringify(det))); if (!ok) fail++; }
  console.log("\n" + (fail ? fail + " FAILED" : results.length + "/" + results.length + " checks passed"));
  process.exit(fail ? 1 : 0);
})();
