// COCI Lookup tab (S110 — Sam's ask: a raw-COCI lookup surface with M-ID /
// C-ID / CCN chips per entry; sortable, filterable, flexible column widths).
// Since S542 the Courses view is the Catalog Commons' Courses List, drawn by the
// shared engine (commons_list.js); tests/coci_list.test.js guards the List's own
// behavior (bands, SkyView, the finder's words, today's M-ID). This file keeps the
// tab's original guards, read through the engine's table:
//   1. shell renders from the stub payload (head, view toggle, count)
//   2. search / college / subject / identity / credit filters
//   3. identity chips carry the right kind classes
//   4. sortable headers (a press toggles A to Z and Z to A)
//   5. resizable columns (the engine's separator: the arrow keys widen a column)
//   6. the Title drawer fetches the right per-letter description shard + outcomes
//   7. Download builds a spreadsheet from the FILTERED set
//   8. the Programs view (unchanged)
//   9. the S389 UI pass (words for controls, no chip fill, focus rings)
//
// Run from repo root: `npm test` (or `node tests/coci_lookup.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("coci_lookup.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// rows: [collegeIdx, ctrl, subj, num, title, units, credit, top, cid, ccn, mid]
const payload = {
  _built_at: "2026-07-09",
  colleges: ["American River College", "Rio Hondo College"],
  rows: [
    [0, "CCC000646669", "CARPT", "111", "Tool and Equipment Applications", 1.5, "C",
     "0952.10", "", "", "CNST M1009"],
    [1, "CCC000111111", "CARP", "040K", "Rigging", 2, "C", "0952.10", "", "", ""],
    [0, "CCC000222222", "ENGL", "300", "College Composition", 4, "C", "1501.00",
     "ENGL 100", "ENGL C1000", "ENGL M1001"],
    [1, "CCC000333333", "ESL", "010", "English Fundamentals", 0, "N", "4930.87",
     "", "", ""],
  ],
};

// programs: [collegeIdx, ctrl, title, top, cip, awardIdx, statusIdx, units, xfer]
const progPayload = {
  _built_at: "2026-06-17",
  colleges: ["ALAMEDA", "RIO HONDO"],
  awards: ["A.S. Degree", "A.A- T Degree"],
  statuses: ["Active", "Inactive"],
  rows: [
    [0, "01136", "African-American Studies", "2203.00", "05.0200", 0, 0, "18.00", 0],
    [1, "02001", "Business Administration for Transfer", "0505.00", "52.0201", 1, 0, "19.00", 1],
    [0, "03050", "Welding Technology", "0956.00", "48.0508", 0, 1, "30.00", 0],
  ],
};

// Today's identity file (unified_courses_members.js): the M-ID the List shows and bands by.
const members = {
  generated_at: "2026-11-01 05:18",
  colleges: ["American River College", "Rio Hondo College"],
  members: {
    "CNST M1009": [{ c: 0, cn: "CCC000646669" }],
    "ENGL M1001": [{ c: 0, cn: "CCC000222222" }],
  },
};
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

function makeDom() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="tab-coci-lookup"><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></div>
  </body></html>`, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  const log = { lazyLoads: [], blobs: [] };
  window.CPL_COCI_LOOKUP = payload;
  // Stub the tab harness: the engine, the identity file, desc shards + programs register and resolve.
  window.CPL_TABS = {
    loadScript: function (srcPath, globalName, cb) {
      log.lazyLoads.push(srcPath);
      if (srcPath === "commons_list.js") window.eval(LIST_SRC);
      if (srcPath === "unified_courses_members.js") window.CPL_UC_MEMBERS = members;
      if (/coci_lookup_desc_C\.js$/.test(srcPath)) {
        window.CPL_COCI_DESC = window.CPL_COCI_DESC || {};
        window.CPL_COCI_DESC["C"] = {
          CCC000646669: "Safety and health training for the carpenter.",
        };
      }
      if (/coci_programs_data\.js$/.test(srcPath)) window.CPL_COCI_PROGRAMS = progPayload;
      cb();
    },
    onActivate: function () {},
  };
  // course_outcomes (Sam, 2026-10-14): CARPT 111 at American River has outcomes, read twice.
  log.fetches = [];
  window.fetch = function (url) {
    log.fetches.push(String(url));
    const qp = new URL(String(url)).searchParams;
    const want = (qp.get("course_code") || "").replace(/^in\.\(|\)$/g, "").split(",").map((c) => c.replace(/^"|"$/g, ""));
    if (want.indexOf("ESL-010") >= 0) return Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve(null) });
    const rows = qp.get("college") === "eq.American River College" && want.indexOf("CARPT111") >= 0 ? [
      { course_code: "CARPT111", heading: "Student Learning Outcomes", lead: null, outcomes: ["Use hand tools safely.", "Maintain power equipment."],
        maps_to: [["Critical Thinking"], null], shape: "list", fingerprint: "a".repeat(32), source_url: "https://example.org/outline/carpt111",
        source_kind: "course_outline", source_system: "curriqunet", read_run: 20, loaded_at: "2026-10-13T20:00:00Z" },
      { course_code: "CARPT111", heading: "Student Learning Outcomes", lead: null, outcomes: ["An older read."],
        maps_to: null, shape: "list", fingerprint: "b".repeat(32), source_url: "https://example.org/outline/carpt111",
        source_kind: "course_outline", source_system: "curriqunet", read_run: 10, loaded_at: "2026-10-12T20:00:00Z" }] : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(rows) });
  };
  window.URL.createObjectURL = function (blob) { log.blobs.push(blob); return "blob:stub"; };
  window.URL.revokeObjectURL = function () {};
  window.HTMLAnchorElement.prototype.click = function () {};   // a download, not a navigation
  window.eval(src);
  window.CPL_COCI_LOOKUP_TAB.activate();
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P = "ccl-";
// The engine's table: columns by name, never position (S541); the select box is the first cell.
const heads = (doc) => Array.from(doc.querySelectorAll("." + P + "table thead ." + P + "sort")).map((b) => txt(b));
const colOf = (doc, name) => heads(doc).findIndex((h) => h.indexOf(name) === 0);
const cellOf = (doc, tr, name) => tr.children[colOf(doc, name) + 1];
// Courses: the engine's rows; Programs: the tab's own table rows.
const visibleRows = (doc) => doc.querySelector("." + P + "table")
  ? Array.from(doc.querySelectorAll("." + P + "table tbody tr")).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow"))
  : Array.from(doc.querySelectorAll("tr.cplcoci-row"));
const rowTitles = (doc) => visibleRows(doc).map((tr) => txt(cellOf(doc, tr, "Title")));
const wordBtn = (doc, re) => Array.from(doc.querySelectorAll("button")).find((b) => re.test(txt(b)));
const typeIn = (window, node, v) => { node.value = v; node.dispatchEvent(new window.Event("input")); };
const rowByTitle = (doc, t) => visibleRows(doc).find((tr) => txt(cellOf(doc, tr, "Title")) === t);

(async () => {
  const { window, log } = makeDom();
  const doc = window.document;

  // ── 1. shell ──
  check("shell: header renders", txt(doc.querySelector(".cplcoci-head .h")) === "COCI Lookup");
  check("shell: the Courses view is the Courses List on the shared engine",
    log.lazyLoads.indexOf("commons_list.js") >= 0 && !!doc.querySelector("#cplcoci-list-mount ." + P + "table"));
  check("shell: count reflects the full set",
    txt(doc.querySelector("." + P + "count span")).indexOf("4 local courses") === 0);
  check("shell: all rows render", visibleRows(doc).length === 4);

  // ── 3. chips ──
  const carpt = rowByTitle(doc, "Tool and Equipment Applications");
  check("chips: M-ID chip renders with the mid class",
    !!carpt.querySelector(".cplcoci-chip.mid")
    && txt(carpt.querySelector(".cplcoci-chip.mid")) === "CNST M1009");
  const englRow = rowByTitle(doc, "College Composition");
  check("chips: C-ID + CCN + M-ID all chip on a fully-identified row",
    !!englRow.querySelector(".cplcoci-chip.cid")
    && !!englRow.querySelector(".cplcoci-chip.ccn")
    && !!englRow.querySelector(".cplcoci-chip.mid"));
  const eslRow = rowByTitle(doc, "English Fundamentals");
  check("chips: identity-less row shows a dash", txt(cellOf(doc, eslRow, "Identities")) === "—");

  // ── transfer column + filter (C-ID = transfer-model) ──
  check("transfer col: C-ID course reads Yes", txt(cellOf(doc, englRow, "Transfer")) === "Yes");
  check("transfer col: non-C-ID course reads No", txt(cellOf(doc, eslRow, "Transfer")) === "No");
  wordBtn(doc, /^Has a C-ID \(1\)$/).click();
  check("transfer filter: Has a C-ID (transfer-model) isolates the ENGL row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "College Composition");
  wordBtn(doc, /^All \(4\)$/).click();
  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "Transfer")), "no");
  check("transfer filter: the column's box finds the three with no C-ID", visibleRows(doc).length === 3);
  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "Transfer")), "");

  // ── 2. filters ──
  typeIn(window, doc.getElementById(P + "find"), "rigging");
  await sleep(220);  // debounce
  check("search: 'rigging' narrows to the Rio Hondo row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "Rigging");
  typeIn(window, doc.getElementById(P + "find"), "");
  await sleep(220);

  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "College")), "American River College");
  check("college: filters to ARC's two rows", visibleRows(doc).length === 2);
  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "College")), "");

  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "Subject")), "carpt");
  check("subject: CARPT (case-insensitive) isolates the CARPT row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "Tool and Equipment Applications");
  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "Subject")), "");

  wordBtn(doc, /^Has a CCN \(1\)$/).click();
  check("identity: has-CCN isolates the ENGL row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "College Composition");
  wordBtn(doc, /^No identity \(2\)$/).click();
  check("identity: no-identity isolates the ESL + Rio Hondo rows",
    visibleRows(doc).length === 2);
  wordBtn(doc, /^Has an M-ID \(2\)$/).click();
  check("identity: has-M-ID reads today's identity file", visibleRows(doc).length === 2);

  wordBtn(doc, /^Noncredit \(1\)$/).click();
  check("credit: Noncredit isolates the ESL row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "English Fundamentals");
  wordBtn(doc, /^All \(4\)$/).click();

  // ── 4. sortable headers (the bands off, so one sort runs over every row) ──
  doc.getElementById(P + "bands").click();
  const sortBtn = (name) => doc.querySelectorAll("." + P + "sort")[colOf(doc, name)];
  sortBtn("Title").click();
  let titles = rowTitles(doc);
  check("sort: the first press on the sorted Title flips it to Z to A", titles[0] === "Tool and Equipment Applications"
    && sortBtn("Title").closest("th").getAttribute("aria-sort") === "descending");
  sortBtn("Title").click();
  titles = rowTitles(doc);
  check("sort: a second press puts it back to A to Z", titles[0] === "College Composition"
    && titles[titles.length - 1] === "Tool and Equipment Applications");
  sortBtn("Units").click();
  check("sort: a numeric column sorts low to high", rowTitles(doc)[0] === "English Fundamentals");
  doc.getElementById(P + "bands").click();

  // ── 5. resizable columns ──
  const grip = doc.getElementById(P + "grip-" + colOf(doc, "College"));
  check("resize: header carries a separator to drag", !!grip && grip.getAttribute("role") === "separator");
  grip.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const W = window.CPL_COCI_LOOKUP_TAB._state.ls.widths;
  check("resize: the arrow key widens the column by 24px", !!W && W[colOf(doc, "College")] === 120 + 24);

  // ── 6. the Title drawer → the C shard ──
  cellOf(doc, rowByTitle(doc, "Tool and Equipment Applications"), "Title").querySelector("button").click();
  await sleep(20);
  check("desc: the drawer lazy-loads the subject-letter shard",
    log.lazyLoads.some((s) => s === "coci_lookup_desc_C.js"));
  const descRow = doc.querySelector("." + P + "drawer");
  check("desc: the shard's description renders",
    !!descRow && txt(descRow).indexOf("Safety and health training") >= 0);
  // Learning outcomes (Sam, 2026-10-14: "there should be a link to them on each course listing").
  const outs = descRow.querySelector(".cplcoci-outs");
  check("outcomes: the drawer shows the newest read's outcomes, numbered, with what each maps to",
    !!outs && /Student Learning Outcomes \(2\)/.test(txt(outs)) && outs.querySelectorAll("ol li").length === 2
    && /Maps to: Critical Thinking/.test(txt(outs)) && !/older read/.test(txt(outs)));
  const srcA = outs && outs.querySelector('a[href="https://example.org/outline/carpt111"]');
  check("outcomes: it names and links where it was read", !!srcA && txt(srcA) === "the course outline of record"
    && /read 2026-10-13\./.test(txt(outs)));
  check("outcomes: asked under the code's spellings, for that college",
    /college=eq\.American%20River%20College/.test(log.fetches[0] || "") && /%22CARPT%20111%22,%22CARPT111%22,%22CARPT-111%22/.test(log.fetches[0] || ""));
  const reopen = () => cellOf(doc, rowByTitle(doc, "Tool and Equipment Applications"), "Title").querySelector("button").click();
  reopen(); reopen();
  await sleep(20);
  check("outcomes: re-opening reads them from memory", log.fetches.length === 1);
  reopen();

  // ── 7. a spreadsheet of the filtered set ──
  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "Subject")), "ENGL");
  wordBtn(doc, /^Download these 1 as a spreadsheet$/).click();
  check("csv: Download builds a blob", log.blobs.length === 1);
  const csvText = (await log.blobs[0].text()).replace(/^﻿/, "");
  check("csv: carries ONLY the filtered row (+ header)",
    csvText.trim().split(/\r\n/).length === 2 && csvText.indexOf("College Composition") > 0
    && csvText.indexOf("Rigging") < 0 && csvText.indexOf("ENGL M1001") > 0);
  typeIn(window, doc.getElementById(P + "cf-" + colOf(doc, "Subject")), "");

  // ── 8. Programs view (toggle → lazy-load → table + transfer/award filters) ──
  const progBtn = Array.from(doc.querySelectorAll(".cplcoci-viewbtn")).find((b) => txt(b) === "Programs");
  check("programs: a Programs view toggle exists", !!progBtn);
  progBtn.click();
  await sleep(10);
  check("programs: lazy-loaded coci_programs_data.js", log.lazyLoads.some((s) => s === "coci_programs_data.js"));
  check("programs: all 3 programs render", visibleRows(doc).length === 3);
  check("programs: count reflects the set",
    txt(doc.getElementById("cplcoci-pcount")).indexOf("3 of 3") === 0);
  // transfer (ADT) column + filter
  const adtRow = visibleRows(doc).find((tr) => txt(tr.children[2]).indexOf("Business Administration") === 0);
  check("programs: ADT row shows the ADT transfer marker", /ADT/.test(txt(adtRow.children[6])));
  const pxfSel = doc.getElementById("cplcoci-ptransfer");
  pxfSel.value = "xfer";
  pxfSel.dispatchEvent(new window.Event("change"));
  check("programs: transfer filter isolates the ADT program",
    visibleRows(doc).length === 1 && txt(visibleRows(doc)[0].children[2]).indexOf("Business Administration") === 0);
  pxfSel.value = "all";
  pxfSel.dispatchEvent(new window.Event("change"));
  // award filter
  const pawSel = doc.getElementById("cplcoci-paward");
  pawSel.value = "A.A- T Degree";
  pawSel.dispatchEvent(new window.Event("change"));
  check("programs: award filter narrows to the A.A-T degree", visibleRows(doc).length === 1);
  pawSel.value = "all";
  pawSel.dispatchEvent(new window.Event("change"));
  // CIP column present (programs carry CIP)
  check("programs: CIP code renders in its column", txt(adtRow.children[5]) === "52.0201");
  // back to Courses
  const courseBtn = Array.from(doc.querySelectorAll(".cplcoci-viewbtn")).find((b) => txt(b) === "Courses");
  courseBtn.click();
  check("programs: toggling back to Courses restores the Courses List",
    !!doc.getElementById(P + "find") && visibleRows(doc).length === 4);

  // ── 9. The S389 UI pass: controls are underlined words; dark mode keeps every pair AA ──
  // npm run a11y cobi-dark measured the CSV control at 1.29:1 (a dark fill under dark text),
  // the chips at 1.2:1 (a half-white fill over the dark surface) and six inputs with no focus
  // ring. The failures this guards: a fill coming back, a glyph standing in for the word, and
  // outline:none with nothing in its place.
  const css = (doc.getElementById("cpl-coci-lookup-css") || {}).textContent || "";
  check("ui pass: the Courses download reads in words, no glyph",
    !!wordBtn(doc, /^Download these 4 as a spreadsheet$/));
  check("ui pass: a control is an underlined cobalt word with no border or fill, 24px tall",
    /\.cplcoci-btn \{ border:0; background:none; color: var\(--cobalt\);[^}]*min-height:24px; text-decoration:underline;/.test(css)
    && !/cplcoci-btn ghost/.test(src));
  check("ui pass: a chip paints no light fill of its own", /\.cplcoci-chip \{[^}]*background: transparent;/.test(css)
    && !/rgba\(255,255,255,\.5\)/.test(css));
  check("ui pass: the filters show a focus ring", /\.cplcoci-toolbar input:focus-visible, \.cplcoci-toolbar select:focus-visible \{ outline:2px solid var\(--cobalt\)/.test(css)
    && !/outline:none/.test(css));
  check("ui pass: the Transfer column is a word, no glyph", !/🎓/.test(txt(doc.querySelector("." + P + "table"))));

  // A failed outcomes read says so; it never reads as none.
  {
    const fresh = makeDom();
    await sleep(20);
    const fdoc = fresh.window.document;
    cellOf(fdoc, rowByTitle(fdoc, "English Fundamentals"), "Title").querySelector("button").click();
    await sleep(20);
    const fouts = fdoc.querySelector("." + P + "drawer .cplcoci-outs");
    check("outcomes: a failed read says so, naming the table", !!fouts && /could not be read \(course_outcomes answered 503\)/.test(txt(fouts)));
  }

  // ── report ──
  let fail = 0;
  results.forEach(([name, ok]) => {
    console.log((ok ? "  ✓ " : "  ✗ ") + name);
    if (!ok) fail++;
  });
  console.log(`\ncoci_lookup: ${results.length - fail}/${results.length} checks passed`);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
