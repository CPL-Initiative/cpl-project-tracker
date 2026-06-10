// Regression test for the CSR (canonical_subj4.js) fan-in alternate-name chip
// (2026-06-10). A fan-in convergence folds two MQ discipline names for one
// converging field into a canonical (Kinesiology ⟵ Physical Education,
// Drama/Theater Arts ⟵ Theater Arts; kb/discipline_aliases.json). The CSR
// keeps ONE row (the canonical) — the alternate name must stay discoverable:
//   (a) an "also: <alternate>" chip renders on the canonical row
//   (b) discipline-search by the ALTERNATE name surfaces the canonical row
//   (c) a discipline with no alias shows NO chip
//
// Run from repo root: `npm test` (or `node tests/csr_alias_chip.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("canonical_subj4.js", "utf8");

const SEED = {
  _counts: {},
  disciplines: {
    "Kinesiology": {
      canonical_subj4: "KINE", source: "curator_override", reviewed_at: "2026-05-23T17:29:23Z",
      reviewed_by: "map@rccd.edu", data_modal: "KINE", data_modal_is_4letter: true,
      total_mids: 1308, local_subject_variants: { KIN: 700, PE: 400 },
      top_category_2digit: "08", needs_review: false,
    },
    "Drama/Theater Arts": {
      canonical_subj4: "THEA", source: "curator_override", reviewed_at: "2026-06-10T00:00:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "THEA", data_modal_is_4letter: true,
      total_mids: 316, local_subject_variants: { THEA: 200, DRAM: 100 },
      top_category_2digit: "10", needs_review: false,
    },
    "Biological Sciences": {
      canonical_subj4: "BIOL", source: "data_modal", data_modal: "BIOL",
      data_modal_is_4letter: true, total_mids: 300, local_subject_variants: { BIOL: 300 },
      top_category_2digit: "04",
    },
  },
};
const ALIASES = {
  _about: "test fixture",
  aliases: {
    "Kinesiology": ["Physical Education"],
    "Drama/Theater Arts": ["Theater Arts"],
  },
};

// Mock fetch: route by URL substring. Supabase/cid/ccn/rollup/fl-split → empty.
function mockFetch(url) {
  const body =
    url.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
    url.indexOf("discipline_aliases.json") >= 0 ? ALIASES :
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
// The chip lives INSIDE the cs-disc cell, so match on starts-with, not equality.
function discCellFor(disc) {
  return [...doc.querySelectorAll("td.cs-disc")].find(
    (td) => (td.textContent || "").trim().indexOf(disc) === 0);
}
function disciplinesShown() {
  return [...doc.querySelectorAll("td.cs-disc")].map((td) => (td.textContent || "").trim());
}
function setSearch(id, val) {
  const inp = doc.getElementById(id);
  inp.value = val;
  inp.dispatchEvent(new window.Event("input"));
}

// init() runs on load (readyState !== "loading") and is async (fetch chain).
setTimeout(() => {
  try {
    const kine = discCellFor("Kinesiology");
    check("Kinesiology row renders", !!kine);
    check("'also: Physical Education' chip renders on Kinesiology",
      kine && kine.textContent.indexOf("also: Physical Education") >= 0);
    const drama = discCellFor("Drama/Theater Arts");
    check("'also: Theater Arts' chip renders on Drama/Theater Arts",
      drama && drama.textContent.indexOf("also: Theater Arts") >= 0);
    const bio = discCellFor("Biological Sciences");
    check("non-aliased discipline shows NO chip",
      bio && bio.textContent.indexOf("also:") < 0);

    // Discipline search by the ALTERNATE name (no substring overlap with the
    // canonical — "physical education" is nowhere in "Kinesiology").
    setSearch("cs-search", "physical education");
    let shown = disciplinesShown();
    check("search 'physical education' surfaces Kinesiology",
      shown.some((d) => d.indexOf("Kinesiology") === 0));
    check("search 'physical education' filters OUT Biological Sciences",
      !shown.some((d) => d.indexOf("Biological Sciences") === 0));
    check("search 'physical education' filters OUT Drama/Theater Arts",
      !shown.some((d) => d.indexOf("Drama/Theater Arts") === 0));

    // The canonical's own name still matches, alias wiring notwithstanding.
    setSearch("cs-search", "kinesiology");
    shown = disciplinesShown();
    check("search 'kinesiology' still surfaces Kinesiology",
      shown.some((d) => d.indexOf("Kinesiology") === 0));
  } catch (e) {
    check("no exception during assertions: " + e.message, false);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
}, 200);
