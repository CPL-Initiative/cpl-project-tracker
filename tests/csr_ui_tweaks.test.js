// Regression test for Sam's 2026-06-12 CSR UI tweaks (canonical_subj4.js):
//   (a) NO "⚠ needs 4-letter" chip on the Most-used-locally cell — local
//       college codes are the colleges' own vocabulary and are allowed to be
//       non-4-letter ("VN", "VOC ED"), so the chip there was noise.
//   (b) the residual warning case — canonical pick MISSING (needs review) —
//       still surfaces, on the Common SUBJ cell (where the fix happens),
//       and the Status chip still reads "needs review".
//   (c) the SUBJ dropdown (cs-subj-filter) renders with two optgroups
//       ("Common subjects ✓" canonical picks / "Local-derived variants"
//       leftover codes) and filters rows by canonical == code OR
//       variants_observed carrying the code, ANDing with the search box.
//   (d) the injected table-chrome CSS (cs-ui-css) makes the header text
//       white + non-bold and keeps the CTE badge on one line (nowrap),
//       stealing width from the Notes textarea, not the table.
//
// Run from repo root: `npm test` (or `node tests/csr_ui_tweaks.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("canonical_subj4.js", "utf8");

const SEED = {
  _counts: {},
  disciplines: {
    // Canonical SET + non-4-letter local modal → chip must NOT render anywhere.
    "Vocational Nursing": {
      canonical_subj4: "VOCN", source: "curator_override",
      reviewed_at: "2026-06-01T00:00:00Z", reviewed_by: "map@rccd.edu",
      data_modal: "VN", data_modal_is_4letter: false,
      total_mids: 120,
      variants_observed: { VOCN: 80, VN: 30, VNRS: 10 },
      local_subject_variants: { VN: 90, VOCN: 30 },
      top_category_2digit: "12", needs_review: false,
      cte_flag: "most", cte_share: 0.9, cte_known_n: 108, cte_unknown_n: 12,
    },
    // Clean pre-seeded row (4-letter modal); also feeds the canonical optgroup.
    "Welding": {
      canonical_subj4: "WELD", source: "data_modal",
      data_modal: "WELD", data_modal_is_4letter: true,
      total_mids: 200,
      variants_observed: { WELD: 200 },
      local_subject_variants: { WELD: 200 },
      top_category_2digit: "09",
      cte_flag: "all", cte_share: 1, cte_known_n: 200, cte_unknown_n: 0,
    },
    // Canonical MISSING (needs review) + non-4-letter modal → the residual
    // warning case: chip on the Common SUBJ cell, NOT the local-modal cell.
    "Vocational Education": {
      data_modal: "VOC ED", data_modal_is_4letter: false,
      total_mids: 40,
      variants_observed: { "VOC ED": 25, VOCE: 15 },
      local_subject_variants: { "VOC ED": 25, VOCE: 15 },
      top_category_2digit: "09", needs_review: true,
    },
  },
};

// Mock fetch: route by URL substring. Supabase/cid/ccn/rollup/fl-split → empty.
function mockFetch(url) {
  const body =
    url.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
    url.indexOf("cid_descriptors") >= 0 ? { descriptors: [] } :
    url.indexOf("ccn_courses") >= 0 ? { courses: [] } :
    url.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: {} } :
    url.indexOf("kb_curation") >= 0 ? [] : {};
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="tab-canonical-subj4">
    <div id="cs-toolbar"></div><div id="cs-summary"></div>
    <div id="cs-table-wrap"></div><div id="cs-toast"></div>
  </div>
</body></html>`, { runScripts: "outside-only", pretendToBeVisual: true });

const { window } = dom;
window.fetch = (u) => mockFetch(String(u));
window.matchMedia = window.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };

const vm = require("vm");
vm.runInContext(src, dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(window), { filename: "canonical_subj4.js" });

const results = [];
const check = (name, cond) => results.push([name, !!cond]);
const doc = window.document;

// Column order (COLS in canonical_subj4.js):
// 0 Discipline · 1 MIDs · 2 Variants · 3 Most-used locally · 4 Common SUBJ
// · 5 TOP · 6 CIP · 7 CTE · 8 CPL · 9 Status · 10 Notes · 11 Reviewed · 12 Validate
const IDX = { modal: 3, canon: 4, cte: 7, status: 9 };
function rowCells(disc) {
  const cell = [...doc.querySelectorAll("td.cs-disc")].find(
    (td) => (td.textContent || "").trim().indexOf(disc) === 0);
  return cell ? cell.parentElement.querySelectorAll("td") : null;
}
function disciplinesShown() {
  return [...doc.querySelectorAll("td.cs-disc")].map((td) => (td.textContent || "").trim());
}
function setSearch(id, val) {
  const inp = doc.getElementById(id);
  inp.value = val;
  inp.dispatchEvent(new window.Event("input"));
}
function setSubjFilter(val) {
  const sel = doc.getElementById("cs-subj-filter");
  sel.value = val;
  sel.dispatchEvent(new window.Event("change"));
}

// init() runs on load (readyState !== "loading") and is async (fetch chain).
setTimeout(() => {
  try {
    // ── (a) no needs-4-letter chip on the local-modal cell when canonical set ──
    const vn = rowCells("Vocational Nursing");
    check("Vocational Nursing row renders", !!vn);
    check("(a) non-4-letter local modal 'VN' renders plain",
      vn && vn[IDX.modal].textContent.indexOf("VN") >= 0);
    check("(a) NO 'needs 4-letter' chip on the Most-used-locally cell",
      vn && vn[IDX.modal].textContent.indexOf("needs 4-letter") < 0);
    check("(a) NO 'needs 4-letter' chip anywhere on the row (canonical is set)",
      vn && vn[IDX.modal].parentElement.textContent.indexOf("needs 4-letter") < 0);

    // ── (b) missing-canonical discipline still warns — on the Common SUBJ cell ──
    const ve = rowCells("Vocational Education");
    check("Vocational Education row renders", !!ve);
    check("(b) missing canonical → '⚠ needs 4-letter' chip on the Common SUBJ cell",
      ve && ve[IDX.canon].textContent.indexOf("needs 4-letter") >= 0);
    check("(b) the chip is the warn-styled cs-badge",
      ve && !!ve[IDX.canon].querySelector(".cs-badge.warn"));
    check("(b) …and NOT on the Most-used-locally cell",
      ve && ve[IDX.modal].textContent.indexOf("needs 4-letter") < 0);
    check("(b) Status chip still reads 'needs review'",
      ve && ve[IDX.status].textContent.indexOf("needs review") >= 0);

    // ── (d) injected table-chrome CSS: white non-bold header, one-line CTE ──
    const css = (doc.getElementById("cs-ui-css") || {}).textContent || "";
    check("(d) cs-ui-css style element injected", css.length > 0);
    check("(d) header rule sets color:#fff",
      /\.cs-table thead th\{[^}]*color:#fff/.test(css));
    check("(d) header rule sets font-weight:normal",
      /\.cs-table thead th\{[^}]*font-weight:normal/.test(css));
    check("(d) CTE cell rule sets white-space:nowrap",
      /td\.cs-cte\{[^}]*white-space:nowrap/.test(css));
    check("(d) Notes textarea narrowed (width stolen from Notes, not the table)",
      /textarea\.cs-notes\{[^}]*width:26ch/.test(css));
    check("(d) CTE cell carries the cs-cte class and the one-line badge text",
      vn && vn[IDX.cte].classList.contains("cs-cte")
         && vn[IDX.cte].textContent.indexOf("Y (90%)") >= 0);

    // ── (c) SUBJ dropdown with optgroups ──
    const sel = doc.getElementById("cs-subj-filter");
    check("(c) cs-subj-filter select renders in the toolbar", !!sel);
    const ogs = sel ? [...sel.querySelectorAll("optgroup")] : [];
    check("(c) exactly two optgroups", ogs.length === 2);
    check("(c) first optgroup is 'Common subjects ✓'",
      ogs[0] && ogs[0].label === "Common subjects ✓");
    check("(c) second optgroup is 'Local-derived variants'",
      ogs[1] && ogs[1].label === "Local-derived variants");
    check("(c) first option is 'All subjects' (value '')",
      sel && sel.options[0] && sel.options[0].value === "" &&
      sel.options[0].textContent === "All subjects");
    const canonVals = ogs[0] ? [...ogs[0].querySelectorAll("option")].map((o) => o.value) : [];
    const varVals = ogs[1] ? [...ogs[1].querySelectorAll("option")].map((o) => o.value) : [];
    check("(c) canonical optgroup carries the distinct canonical picks (sorted)",
      canonVals.join(",") === "VOCN,WELD");
    check("(c) variants optgroup = observed codes that are canonical NOWHERE",
      varVals.indexOf("VN") >= 0 && varVals.indexOf("VNRS") >= 0 &&
      varVals.indexOf("VOCE") >= 0 && varVals.indexOf("VOC ED") >= 0 &&
      varVals.indexOf("VOCN") < 0 && varVals.indexOf("WELD") < 0);

    // Filter by a canonical code → only the matching discipline remains.
    setSubjFilter("VOCN");
    let shown = disciplinesShown();
    check("(c) picking canonical 'VOCN' shows only Vocational Nursing",
      shown.length === 1 && shown[0].indexOf("Vocational Nursing") === 0);

    // Filter by a variant-only code → matches via variants_observed.
    setSubjFilter("VN");
    shown = disciplinesShown();
    check("(c) picking variant 'VN' surfaces its discipline via variants_observed",
      shown.length === 1 && shown[0].indexOf("Vocational Nursing") === 0);

    // AND-composition with the discipline search box.
    setSubjFilter("VOCN");
    setSearch("cs-search", "welding");
    check("(c) SUBJ pick ANDs with discipline search (disjoint → zero rows)",
      disciplinesShown().length === 0);
    setSearch("cs-search", "");
    check("(c) clearing the search restores the SUBJ-filtered row",
      disciplinesShown().length === 1);
    setSubjFilter("");
    check("(c) 'All subjects' restores every row", disciplinesShown().length === 3);
  } catch (e) {
    check("no exception during assertions: " + e.message, false);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
}, 200);
