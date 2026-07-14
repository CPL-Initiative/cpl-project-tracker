// COCI Lookup tab (S110 — Sam's ask: a raw-COCI lookup surface with M-ID /
// C-ID / CCN chips per entry; sortable, filterable, flexible column widths).
// Guards:
//   1. shell renders from the stub payload (head, toolbar, count)
//   2. search / college / subject / identity / credit filters
//   3. identity chips carry the right kind classes
//   4. sortable headers (click toggles asc/desc)
//   5. drag-resizable columns persisted in cplCociColWidths.v1
//   6. row expand fetches the right per-letter description shard
//   7. CSV export builds a blob from the FILTERED set
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

function makeDom() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="tab-coci-lookup"><div id="coci-lookup-root">Loading…</div></div>
  </body></html>`, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  const log = { lazyLoads: [], blobs: [] };
  window.CPL_COCI_LOOKUP = payload;
  // Stub the tab harness: desc-shard + programs loads register + resolve synchronously.
  window.CPL_TABS = {
    loadScript: function (srcPath, globalName, cb) {
      log.lazyLoads.push(srcPath);
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
  window.URL.createObjectURL = function (blob) { log.blobs.push(blob); return "blob:stub"; };
  window.URL.revokeObjectURL = function () {};
  window.eval(src);
  window.CPL_COCI_LOOKUP_TAB.activate();
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const visibleRows = (doc) => Array.from(doc.querySelectorAll("tr.cplcoci-row"));
const rowTitles = (doc) => visibleRows(doc).map((tr) => txt(tr.children[4]));

(async () => {
  const { window, log } = makeDom();
  const doc = window.document;

  // ── 1. shell ──
  check("shell: header renders", txt(doc.querySelector(".cplcoci-head .h")) === "COCI Lookup");
  check("shell: count reflects the full set",
    txt(doc.getElementById("cplcoci-count")).indexOf("4 of 4") === 0);
  check("shell: all rows render", visibleRows(doc).length === 4);

  // ── 3. chips ──
  const firstRow = visibleRows(doc)[0];
  check("chips: M-ID chip renders with the mid class",
    !!firstRow.querySelector(".cplcoci-chip.mid")
    && txt(firstRow.querySelector(".cplcoci-chip.mid")) === "CNST M1009");
  const englRow = visibleRows(doc).find((tr) => txt(tr.children[4]) === "College Composition");
  check("chips: C-ID + CCN + M-ID all chip on a fully-identified row",
    !!englRow.querySelector(".cplcoci-chip.cid")
    && !!englRow.querySelector(".cplcoci-chip.ccn")
    && !!englRow.querySelector(".cplcoci-chip.mid"));
  const eslRow = visibleRows(doc).find((tr) => txt(tr.children[4]) === "English Fundamentals");
  // columns: 0 caret,1 college,2 subj,3 num,4 title,5 units,6 credit,7 TRANSFER,8 top,9 ids,10 ctrl
  check("chips: identity-less row shows a dash", txt(eslRow.children[9]) === "—");

  // ── transfer column + filter (C-ID = transfer-model) ──
  check("transfer col: C-ID course shows 🎓", txt(englRow.children[7]) === "🎓");
  check("transfer col: non-C-ID course shows —", txt(eslRow.children[7]) === "—");
  const xfSel = doc.getElementById("cplcoci-transfer");
  xfSel.value = "xfer";
  xfSel.dispatchEvent(new window.Event("change"));
  check("transfer filter: 🎓 Transfer-model isolates the C-ID (ENGL) row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "College Composition");
  xfSel.value = "all";
  xfSel.dispatchEvent(new window.Event("change"));

  // ── 2. filters ──
  const q = doc.getElementById("cplcoci-q");
  q.value = "rigging";
  q.dispatchEvent(new window.Event("input"));
  await sleep(220);  // debounce
  check("search: 'rigging' narrows to the Rio Hondo row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "Rigging");
  q.value = "";
  q.dispatchEvent(new window.Event("input"));
  await sleep(220);

  const colIn = doc.getElementById("cplcoci-college");
  colIn.value = "American River College";
  colIn.dispatchEvent(new window.Event("input"));
  check("college: filters to ARC's two rows", visibleRows(doc).length === 2);
  colIn.value = "";
  colIn.dispatchEvent(new window.Event("input"));

  const subjIn = doc.getElementById("cplcoci-subject");
  subjIn.value = "carpt";
  subjIn.dispatchEvent(new window.Event("input"));
  check("subject: CARPT (case-insensitive) isolates the CARPT row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "Tool and Equipment Applications");
  subjIn.value = "";
  subjIn.dispatchEvent(new window.Event("input"));

  const idSel = doc.getElementById("cplcoci-identity");
  idSel.value = "ccn";
  idSel.dispatchEvent(new window.Event("change"));
  check("identity: has-CCN isolates the ENGL row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "College Composition");
  idSel.value = "none";
  idSel.dispatchEvent(new window.Event("change"));
  check("identity: no-identity isolates the ESL + Rio Hondo rows",
    visibleRows(doc).length === 2);
  idSel.value = "all";
  idSel.dispatchEvent(new window.Event("change"));

  const crSel = doc.getElementById("cplcoci-credit");
  crSel.value = "N";
  crSel.dispatchEvent(new window.Event("change"));
  check("credit: Noncredit isolates the ESL row",
    rowTitles(doc).length === 1 && rowTitles(doc)[0] === "English Fundamentals");
  crSel.value = "all";
  crSel.dispatchEvent(new window.Event("change"));

  // ── 4. sortable headers ──
  const titleTh = Array.from(doc.querySelectorAll(".cplcoci-table th"))
    .find((th) => txt(th).indexOf("Title") === 0);
  titleTh.click();
  let titles = rowTitles(doc);
  check("sort: Title asc", titles[0] === "College Composition"
    && titles[titles.length - 1] === "Tool and Equipment Applications");
  const titleTh2 = Array.from(doc.querySelectorAll(".cplcoci-table th"))
    .find((th) => txt(th).indexOf("Title") === 0);
  titleTh2.click();
  titles = rowTitles(doc);
  check("sort: second click flips to desc",
    titles[0] === "Tool and Equipment Applications");

  // ── 5. drag-resize + persistence ──
  const collegeTh = Array.from(doc.querySelectorAll(".cplcoci-table th"))
    .find((th) => txt(th).indexOf("College") === 0);
  const handle = collegeTh.querySelector(".cplcoci-resize");
  check("resize: header carries a drag handle", !!handle);
  handle.onmousedown({ preventDefault() {}, stopPropagation() {}, clientX: 100 });
  doc.dispatchEvent(new window.MouseEvent("mousemove", { clientX: 260 }));
  doc.dispatchEvent(new window.MouseEvent("mouseup", { clientX: 260 }));
  const widths = JSON.parse(window.localStorage.getItem("cplCociColWidths.v1") || "{}");
  check("resize: width persisted to cplCociColWidths.v1", widths.college === 160);

  // ── 6. row expand → the C shard ──
  const carptRow = visibleRows(doc).find((tr) => txt(tr.children[4]) === "Tool and Equipment Applications");
  carptRow.querySelector(".cplcoci-caret").onclick();
  await sleep(20);
  check("desc: expand lazy-loads the subject-letter shard",
    log.lazyLoads.some((s) => s === "coci_lookup_desc_C.js"));
  const descRow = doc.querySelector("tr.cplcoci-desc");
  check("desc: the shard's description renders",
    !!descRow && txt(descRow).indexOf("Safety and health training") >= 0);

  // ── 7. CSV of the filtered set ──
  const subjIn2 = doc.getElementById("cplcoci-subject");
  subjIn2.value = "ENGL";
  subjIn2.dispatchEvent(new window.Event("input"));
  doc.getElementById("cplcoci-csv").click();
  check("csv: export builds a blob", log.blobs.length === 1);
  const csvText = await log.blobs[0].text();
  check("csv: carries ONLY the filtered row (+ header)",
    csvText.split("\n").length === 2 && csvText.indexOf("College Composition") > 0
    && csvText.indexOf("Rigging") < 0);
  subjIn2.value = "";  // clear the CSV-test filter before the view-toggle checks
  subjIn2.dispatchEvent(new window.Event("input"));

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
  check("programs: ADT row shows the 🎓 ADT transfer marker", txt(adtRow.children[6]).indexOf("🎓") === 0);
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
  check("programs: toggling back to Courses restores the course table",
    !!doc.getElementById("cplcoci-identity") && visibleRows(doc).length === 4);

  // ── report ──
  let fail = 0;
  results.forEach(([name, ok]) => {
    console.log((ok ? "  ✓ " : "  ✗ ") + name);
    if (!ok) fail++;
  });
  console.log(`\ncoci_lookup: ${results.length - fail}/${results.length} checks passed`);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
