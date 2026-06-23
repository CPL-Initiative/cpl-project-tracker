// Session 70 (PaintSky follow-up) — re-discipline on merge + forward-looking
// Common SUBJ. Common SUBJ is a FUNCTION of discipline (one discipline → one
// canonical SUBJ4, §11). When a curator re-disciplines a course, its Common SUBJ
// must reflect the new discipline's canonical IMMEDIATELY (commonSubjOf), even
// though the M-ID's letters only re-key at the next canonical-SUBJ4 fold — the
// row carries a ⟲ pending marker for that lag. Generated (un-curated) disciplines
// stay literal so the column doesn't churn on low-confidence fills.
//
// Run from repo root: `npm test` (or `node tests/uc_redistribute_discipline_merge.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Two Photography-disciplined PHOT M-IDs make DISC_COMMON_SUBJ["Photography"] = "PHOT"
// (modal: PHOT count 2 > the one ARTS-keyed curated row below).
const rows = [
  { kind: "Course", id: "PHOT M1064", title: "Digital Photography 1", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["PHOT"],
    members: 4, adopted: [], potential: [], conf: 0.9, locked: false, flags: {} },
  { kind: "Course", id: "PHOT M1070", title: "Digital Photography 2", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["PHOT"],
    members: 3, adopted: [], potential: [], conf: 0.9, locked: false, flags: {} },
  // A third PHOT row so the modal Common SUBJ for Photography is PHOT even with the
  // two ARTS-prefixed Photography rows below (in production the authoritative
  // canonical_subj4 override settles this; jsdom has no fetch so it uses the modal).
  { kind: "Course", id: "PHOT M1072", title: "Digital Photography 3", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["PHOT"],
    members: 2, adopted: [], potential: [], conf: 0.9, locked: false, flags: {} },
  // CURATED re-discipline: an ARTS-keyed M-ID whose curator-set discipline is now
  // Photography → forward Common SUBJ should read PHOT (+ pending marker).
  { kind: "Course", id: "ARTS M1348", title: "Digital Imagery", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1030.00", subj: ["ARTS"],
    members: 2, adopted: [], potential: [], conf: 0.85, locked: false,
    _curated: true, flags: { reviewed: true } },
  // GENERATED (not curated) Art-keyed M-ID with an inferred Photography disc →
  // must stay literal "ARTS", no pending marker (collision signal owns that case).
  { kind: "Course", id: "ARTS M1341", title: "Digital Imaging with Drones", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "0699.00", subj: ["ARTS"],
    members: 3, adopted: [], potential: [], conf: 0.85, locked: false, flags: {} },
  // An official C-ID anchor — never re-disciplined; Common SUBJ stays its prefix.
  { kind: "Course", id: "ARTH 100", title: "Art History", id_system: "C-ID",
    disc: "Art", credit: "Credit", units: 3.0, subj: ["ARTH"], members: 1,
    adopted: [], potential: [], conf: 1.0, locked: true, flags: {} },
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Photography", "Art", "Welding"], topmap: {} })};
</script></body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
const { document } = window;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
// jsdom has no real fetch — GETs (incl. the canonical-seed regroup) fail-soft, so
// DISC_COMMON_SUBJ stays the row modal, which is exactly what we seeded for.
window.fetch = function () { return Promise.reject(new Error("no fetch in test")); };
window.alert = function () {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

(async function () {
  // The tab boots on init — give the IIFE a tick to render.
  await sleep(120);

  function cellFor(id, colHeader) {
    var trs = Array.from(document.querySelectorAll("#uc-table-wrap table tbody tr"));
    var heads = Array.from(document.querySelectorAll("#uc-table-wrap table thead th")).map(txt);
    var ci = heads.findIndex(function (h) { return h.indexOf(colHeader) >= 0; });
    for (const tr of trs) {
      var tds = tr.querySelectorAll("td");
      if (Array.from(tds).some(function (td) { return txt(td).indexOf(id) >= 0; })) return tds[ci];
    }
    return null;
  }

  const tableExists = !!document.querySelector("#uc-table-wrap table");
  check("table renders", tableExists);

  // 1. Forward-looking: curated ARTS M1348 (disc Photography) shows Common SUBJ PHOT.
  const csCurated = cellFor("ARTS M1348", "Common SUBJ");
  check("curated re-discipline shows forward Common SUBJ 'PHOT'", csCurated && txt(csCurated).indexOf("PHOT") >= 0);
  check("curated re-discipline does NOT show its stale 'ARTS' prefix as the value", csCurated && txt(csCurated).indexOf("ARTS") < 0);
  check("curated re-discipline carries the ⟲ pending-rekey marker", csCurated && csCurated.querySelector("span[title*='re-key']"));

  // 2. Generated (un-curated) ARTS M1341 stays literal 'ARTS', no marker.
  const csGen = cellFor("ARTS M1341", "Common SUBJ");
  check("generated row stays literal 'ARTS'", csGen && txt(csGen).indexOf("ARTS") >= 0 && txt(csGen).indexOf("PHOT") < 0);
  check("generated row has no pending marker", csGen && !csGen.querySelector("span[title*='re-key']"));

  // 3. A native PHOT row is unaffected (no marker, value PHOT).
  const csNative = cellFor("PHOT M1064", "Common SUBJ");
  check("native PHOT row shows PHOT, no marker", csNative && txt(csNative).indexOf("PHOT") >= 0 && !csNative.querySelector("span[title*='re-key']"));

  // 4. The Common SUBJ FILTER lists the forward value PHOT (so filtering matches display).
  const subjOpts = Array.from(document.querySelectorAll("#uc-subj option")).map(function (o) { return o.value; });
  check("Common SUBJ filter offers the forward 'PHOT'", subjOpts.indexOf("PHOT") >= 0);

  // ---- report ----
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
