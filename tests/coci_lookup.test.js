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

function makeDom() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="tab-coci-lookup"><div id="coci-lookup-root">Loading…</div></div>
  </body></html>`, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  const log = { lazyLoads: [], blobs: [] };
  window.CPL_COCI_LOOKUP = payload;
  // Stub the tab harness: desc-shard loads register + resolve synchronously.
  window.CPL_TABS = {
    loadScript: function (srcPath, globalName, cb) {
      log.lazyLoads.push(srcPath);
      if (/coci_lookup_desc_C\.js$/.test(srcPath)) {
        window.CPL_COCI_DESC = window.CPL_COCI_DESC || {};
        window.CPL_COCI_DESC["C"] = {
          CCC000646669: "Safety and health training for the carpenter.",
        };
      }
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
  check("chips: identity-less row shows a dash", txt(eslRow.children[8]) === "—");

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

  // ── report ──
  let fail = 0;
  results.forEach(([name, ok]) => {
    console.log((ok ? "  ✓ " : "  ✗ ") + name);
    if (!ok) fail++;
  });
  console.log(`\ncoci_lookup: ${results.length - fail}/${results.length} checks passed`);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
