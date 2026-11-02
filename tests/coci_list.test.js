// The Courses List: COCI Lookup's Courses view on the Catalog Commons' shared engine (S542; Sam, 2026-11-01: "This new
// list view is so helpful that I want one now for each of our Catalog Commons groups", and "WE have the COCI lookup
// tab in COBI...maybe courses in that?"). Guards:
//   (1) the view loads the engine and today's identity file through CPL_TABS.loadScript and draws every course;
//   (2) the columns are found by name, with the identity chips in their cell; no Edit, flag, find and replace or AI
//       sort (the List reads only);
//   (3) the M-ID is today's (unified_courses_members.js, joined on college and control number, a college spelled with
//       a trailing space included), never the extract's older one, which only the Identities drawer names;
//   (4) the bands: an M-ID two or more courses share is a band over its run, A to Z, with its common title, its facts
//       and Open in SkyView (prototype/skyview.html#outline/<id>); a course alone in its M-ID, or in none, sits under
//       "Not in a group"; a course in two M-IDs bands under the larger; a header press sorts inside the bands; the
//       word turns them off;
//   (5) the filter words carry their counts and narrow to them; the finder waits for the typing to stop, keeps a row
//       holding every word typed, and narrows what it kept as it grows; a column's own box narrows by that column;
//   (6) the Title drawer reads the catalog description and the learning outcomes; the College drawer filters;
//   (7) the identity file failing to arrive says so and draws no M-ID and no band; the engine failing says so;
//   (8) a new visit drops the finder (tabs never remember a filter);
//   (9) the engine's rank sort gives the order localeCompare gave (accents, case, punctuation, blanks last).
// Run from repo root: `npm test` (or `node tests/coci_list.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
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
    { url: "https://example.org/#coci-lookup", runScripts: "dangerously" });
  const w = dom.window, calls = [], fetches = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function (url) {
    fetches.push(String(url));
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

(async () => {
  // ── (1) loads and draws ──
  let t = tab();
  await sleep(20);
  let d = t.d;
  check("the view loads the engine and today's identity file", t.calls.indexOf("commons_list.js") >= 0 && t.calls.indexOf("unified_courses_members.js") >= 0);
  check("every course is a row", dataRows(d).length === 9 && /^9 local courses/.test(txt(d.querySelector("." + P + "count span"))));
  check("the lede counts the courses, the colleges and the M-IDs", /9 at 3 colleges/.test(txt(d.querySelector(".cplcoci-lede"))) && /6 sit in 4 common courses of the Common Course Reference/.test(txt(d.querySelector(".cplcoci-lede"))));
  check("the List spans the window (the engine's host lifts the cap)", !!d.getElementById(P + "host") && /\.main-container:has\(#ccl-host\)\{max-width:none/.test(txt(d.getElementById(P + "css"))));

  // ── (2) columns by name ──
  const want = ["Title", "College", "Subject", "Number", "Units", "Credit", "Transfer", "TOP", "Identities (M-ID, C-ID, CCN)", "Control number"];
  check("the columns are the tab's, by name", want.every((h) => colOf(d, h) >= 0) && heads(d).length === want.length);
  check("no Edit, flag, find and replace or AI sort: the List reads only",
    !word(d, /^Edit/) && !word(d, /^Find and replace$/) && !word(d, /^AI sort$/) && !Array.from(d.querySelectorAll("thead th")).some((th) => txt(th) === "Flag"));
  const comp = dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "College Composition");
  const ids = cell(comp, d, "Identities");
  check("the identity chips sit in their cell: M-ID, C-ID and CCN, each its kind", !!ids.querySelector(".cplcoci-chip.mid") && txt(ids.querySelector(".cplcoci-chip.cid")) === "C-ID ENGL 100"
    && txt(ids.querySelector(".cplcoci-chip.ccn")) === "ENGL C1000");
  check("the chips' cell still names itself to a screen reader", /^Identities \(M-ID, C-ID, CCN\): ENGL M1001, C-ID ENGL 100, ENGL C1000, details$/.test(ids.querySelector("button").getAttribute("aria-label")));
  check("Transfer and Credit read in words", txt(cell(comp, d, "Transfer")) === "Yes" && txt(cell(comp, d, "Credit")) === "Credit"
    && txt(cell(dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "Conversation"), d, "Credit")) === "Noncredit enhanced");

  // ── (3) today's M-ID ──
  const moved = dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "Composition and Reading");
  check("a course the extract named ENGL M1999 shows today's ENGL M1001", txt(cell(moved, d, "Identities").querySelector(".cplcoci-chip.mid")) === "ENGL M1001" && !/M1999/.test(txt(moved)));
  const cyp = dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "Freshman Composition");
  check("a college spelled with a trailing space still joins", txt(cell(cyp, d, "Identities")) === "ENGL M1001");

  // ── (4) bands ──
  let bands = bodyRows(d).filter((tr) => tr.classList.contains(P + "band"));
  check("the runs: a loner, ENGL M1001, WELD M1109, then the courses with no M-ID", bands.map((b) => txt(b.querySelector("th > span"))).join(" | ")
    === "Not in a group | ENGL M1001, College Composition | WELD M1109, Welding I | Not in a group");
  check("titles alone sit under Not in a group, without a band of their own", !bands.some((b) => /CNST M1009/.test(txt(b))));
  check("inside a band, the sort (Title, A to Z)", titles(d).slice(1, 4).join("|") === "College Composition|Composition and Reading|Freshman Composition");
  const engl = bands[1];
  check("a band's facts count its courses and colleges", /3 local courses at 3 colleges/.test(txt(engl)));
  const sky = engl.querySelector("a");
  check("a band opens its M-ID in SkyView, in a new tab", !!sky && sky.getAttribute("href") === "prototype/skyview.html#outline/ENGL%20M1001"
    && sky.getAttribute("target") === "_blank" && /noopener/.test(sky.getAttribute("rel")) && txt(sky) === "Open in SkyView");
  const intro = dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "Intro to Welding");
  check("a course in two M-IDs shows both and bands under the larger", cell(intro, d, "Identities").querySelectorAll(".cplcoci-chip.mid").length === 2
    && titles(d).indexOf("Intro to Welding") === 4);
  check("the sort line says the bands come first", /^In bands by M-ID; inside each, sorted by Title, A to Z/.test(txt(d.getElementById(P + "sortline"))));
  d.querySelectorAll("." + P + "sort")[colOf(d, "Units")].click();
  check("a header press sorts inside the bands (Units, low to high)", titles(d).slice(1, 4).join("|") === "Composition and Reading|College Composition|Freshman Composition"
    && bodyRows(d).filter((tr) => tr.classList.contains(P + "band")).length === 4);
  word(d, /^Clear the sort$/).click();
  const bw = d.getElementById(P + "bands");
  check("the bands word is pressed while they show", !!bw && txt(bw) === "Bands by M-ID" && bw.getAttribute("aria-pressed") === "true");
  bw.click();
  check("the word takes the bands off: one sort, A to Z", bodyRows(d).filter((tr) => tr.classList.contains(P + "band")).length === 0
    && titles(d)[0] === "College Composition" && titles(d)[8] === "Welding I" && /^Sorted by Title/.test(txt(d.getElementById(P + "sortline"))));
  d.getElementById(P + "bands").click();

  // ── (5) filters, the finder, a column's box ──
  const fwords = Array.from(d.querySelectorAll("." + P + "filters > *")).map(txt);
  check("the filter words carry their counts", fwords.join(" | ") === "All (9) | Has an M-ID (6) | No M-ID (3) | Has a C-ID (2) | Has a CCN (1) | Has any identity (6) | No identity (3) | Credit (7) | Noncredit (1) | Noncredit enhanced (1)");
  word(d, /^No identity \(3\)$/).click();
  check("No identity narrows to the three courses with none", titles(d).join("|") === "Conversation|English Fundamentals|Rigging");
  check("the current filter is marked, not a button", txt(d.querySelector("." + P + "filters [aria-current]")) === "No identity (3)");
  word(d, /^All \(9\)$/).click();
  input(t.w, d.getElementById(P + "find"), "rio composition");
  check("the finder waits for the typing to stop (160 ms, as COCI Lookup's finder did)", dataRows(d).length === 9);
  await sleep(200);
  check("the finder keeps a row holding every word, in any order", titles(d).join("|") === "Composition and Reading");
  input(t.w, d.getElementById(P + "find"), "engl 300");
  await sleep(200);
  check("the finder reads a subject and number", titles(d).join("|") === "College Composition");
  input(t.w, d.getElementById(P + "find"), "comp");
  await sleep(200);
  const nComp = dataRows(d).length;
  input(t.w, d.getElementById(P + "find"), "compo fresh");
  await sleep(200);
  const nFresh = dataRows(d).length;
  input(t.w, d.getElementById(P + "find"), "co");
  await sleep(200);
  check("a finder that grows narrows what it kept, and one that shrinks reads every row again", nComp === 3 && nFresh === 1 && dataRows(d).length === 9);
  input(t.w, d.getElementById(P + "find"), "");
  await sleep(200);
  input(t.w, d.getElementById(P + "cf-" + colOf(d, "College")), "rio");
  check("a column's box narrows by that column", dataRows(d).length === 5 && dataRows(d).every((tr) => txt(cell(tr, d, "College")) === "Rio Hondo College"));
  input(t.w, d.getElementById(P + "cf-" + colOf(d, "College")), "");

  // ── (6) drawers ──
  const comp2 = dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "College Composition");
  cell(comp2, d, "Title").querySelector("button").click();
  await sleep(20);
  let drawer = d.querySelector("." + P + "drawer");
  check("the Title drawer reads the catalog description from its subject's shard", t.calls.indexOf("coci_lookup_desc_E.js") >= 0 && /Expository writing and critical reading\./.test(txt(drawer)));
  check("and the learning outcomes, numbered, with where they were read", drawer.querySelectorAll(".cplcoci-outs ol li").length === 2 && /As printed in the course outline of record/.test(txt(drawer))
    && /college=eq\.American%20River%20College/.test(t.fetches[0] || ""));
  check("and opens the course's M-ID in SkyView", !!Array.from(drawer.querySelectorAll("a")).find((a) => a.getAttribute("href") === "prototype/skyview.html#outline/ENGL%20M1001"));
  const moved2 = dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "Composition and Reading");
  cell(moved2, d, "Identities").querySelector("button").click();
  drawer = d.querySelector("." + P + "drawer");
  check("the Identities drawer names today's M-ID and the extract's older one", /M-ID ENGL M1001: a common course in the Common Course Reference, holding 3 local courses\./.test(txt(drawer))
    && /COCI's 2026-07-09 extract named ENGL M1999; the course has moved since\./.test(txt(drawer)) && /re-mint: it happens in SkyView, under the playbook/.test(txt(drawer)));
  word(d, /^Show every course in ENGL M1001$/).click();
  check("Show every course in an M-ID filters to its band", dataRows(d).length === 3 && titles(d).every((x) => /Compos/.test(x)));
  input(t.w, d.getElementById(P + "cf-" + colOf(d, "Identities")), "");
  const rig = dataRows(d).find((tr) => txt(cell(tr, d, "Title")) === "Rigging");
  cell(rig, d, "College").querySelector("button").click();
  word(d, /^Show every course at Rio Hondo College$/).click();
  check("the College drawer filters to its college", dataRows(d).length === 5);

  // ── (8) a new visit drops the filter ──
  input(t.w, d.getElementById(P + "find"), "welding");
  await sleep(200);
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "coci-lookup" } }));
  check("a new visit drops the finder and the column filters", d.getElementById(P + "find").value === "" && dataRows(d).length === 9);

  // ── (7) failures say so ──
  t = tab({ noMembers: true });
  await sleep(20);
  d = t.d;
  check("the identity file failing says so", /did not arrive, so no course shows its M-ID and the List has no bands/.test(txt(d.querySelector(".cplcoci-meta"))));
  check("and draws the courses with no M-ID and no band", dataRows(d).length === 9 && !d.querySelector(".cplcoci-chip.mid")
    && bodyRows(d).filter((tr) => tr.classList.contains(P + "band") && !/Not in a group/.test(txt(tr))).length === 0);
  t = tab({ noEngine: true });
  await sleep(20);
  check("the engine failing says so, never zero courses", /The List could not be loaded \(commons_list\.js did not arrive\)/.test(txt(t.d.getElementById("cplcoci-list-mount"))));

  // ── (9) the engine's rank sort keeps localeCompare's order ──
  {
    const dom = new JSDOM("<!doctype html><html><head></head><body><div id='m'></div></body></html>", { runScripts: "dangerously" });
    const w = dom.window, e = w.document.createElement("script");
    e.textContent = LIST_SRC; w.document.body.appendChild(e);
    const words = ["Zebra", "apple", "Äpfel", "apple", "", "b-side", "B side", "bside", "Cañada", "canada", "10 units", "9 units", "éclair", "Eclair", "zz", null];
    const rows = words.map((x, i) => ({ ut: String(i), t: x, n: i % 3 === 0 ? null : (i * 7) % 5 }));
    const L = {};
    const api = w.CPL_COMMONS_LIST.create({ state: () => L, rows: () => rows, render: () => {}, key: (r) => r.ut,
      cols: () => [{ h: "T", w: 1, v: (r) => r.t }, { h: "N", w: 1, n: true, v: (r) => r.n }] });
    const ref = (lv) => rows.slice().sort((a, b) => {
      for (const x of lv) {
        const sc = x.col === 0 ? (r) => r.t : (r) => r.n;
        let p = sc(a), q = sc(b);
        if (x.col === 1) { if ((p == null || q == null) && p !== q) return p == null ? 1 : -1; const c = x.dir * ((+p || 0) - (+q || 0)); if (c) return c; continue; }
        p = String(p || ""); q = String(q || "");
        if ((!p || !q) && p !== q) return p ? -1 : 1;
        const c = x.dir * p.toLowerCase().localeCompare(q.toLowerCase()); if (c) return c;
      }
      return String(a.t || "").toLowerCase().localeCompare(String(b.t || "").toLowerCase());
    }).map((r) => r.ut).join(",");
    const same = [[{ col: 0, dir: 1 }], [{ col: 0, dir: -1 }], [{ col: 1, dir: 1 }, { col: 0, dir: -1 }], [{ col: 1, dir: -1 }]].every((lv) => {
      L.sort = lv; return api.rows().map((r) => r.ut).join(",") === ref(lv);
    });
    check("the rank sort gives localeCompare's order: accents, case, punctuation, blanks and nulls last, Shift levels", same);
  }

  let fail = 0;
  results.forEach(([name, ok]) => { console.log((ok ? "  ✓ " : "  ✗ ") + name); if (!ok) fail++; });
  console.log(`\ncoci_list: ${results.length - fail}/${results.length} checks passed`);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
