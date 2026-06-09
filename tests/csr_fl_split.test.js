// Regression test for the CSR (Common Subjects Reference / canonical_subj4.js)
// Foreign-Language SUBJ4 split surfacing (2026-06-09). The "Foreign Languages"
// MQ discipline is split per-language (FLSP/FLFR/…) via foreign_language_subj4.json.
// MQ has no per-language discipline, so it stays ONE row — but the splits must be
// (a) searchable (typing "Spanish"/"FLSP" surfaces the row) and (b) visible on it.
//
// Guards:
//   - the split chip + per-language codes render on the Foreign Languages row
//   - a non-split discipline shows NO chip
//   - discipline-search "spanish" surfaces Foreign Languages, filters out others
//   - discipline-search "flfr" (a split code) surfaces Foreign Languages
//   - the SUBJ-code box "flsp" surfaces Foreign Languages
//   - searching a real language NOT present as a discipline name still works
//
// Run from repo root: `npm test` (or `node tests/csr_fl_split.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("canonical_subj4.js", "utf8");

const SEED = {
  _counts: {},
  disciplines: {
    "Foreign Languages": {
      canonical_subj4: "FLNG", source: "curator_override", reviewed_at: "2026-05-23T17:26:10Z",
      reviewed_by: "map@rccd.edu", data_modal: "SPAN", data_modal_is_4letter: true,
      total_mids: 1549, local_subject_variants: { SPAN: 709, FREN: 219 },
      top_category_2digit: "11", needs_review: false,
    },
    "Biological Sciences": {
      canonical_subj4: "BIOL", source: "data_modal", data_modal: "BIOL",
      data_modal_is_4letter: true, total_mids: 300, local_subject_variants: { BIOL: 300 },
      top_category_2digit: "04",
    },
  },
};
const FLSPLIT = {
  discipline: "Foreign Languages",
  languages: {
    Spanish: { subj4: "FLSP", subjects: ["SPAN", "SPA"], title: ["spanish"] },
    French: { subj4: "FLFR", subjects: ["FREN", "FR"], title: ["french"] },
    German: { subj4: "FLGE", subjects: ["GERM"], title: ["german"] },
  },
};

// Mock fetch: route by URL substring. Supabase/cid/ccn/rollup → empty.
function mockFetch(url) {
  const body =
    url.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
    url.indexOf("foreign_language_subj4.json") >= 0 ? FLSPLIT :
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

// Run the consumer IIFE in the jsdom window context.
const vm = require("vm");
vm.runInContext(src, dom.getInternalVMContext ? dom.getInternalVMContext() : require("vm").createContext(window), { filename: "canonical_subj4.js" });

const results = [];
const check = (name, cond) => results.push([name, !!cond]);
const doc = window.document;
function rowTextFor(disc) {
  const cells = [...doc.querySelectorAll("td")];
  // find the discipline cell, return its row's textContent
  for (const td of cells) {
    if (td.classList.contains("cs-disc") && (td.textContent || "").trim() === disc) {
      return (td.parentElement.textContent || "");
    }
  }
  return null;
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
    const flText = rowTextFor("Foreign Languages");
    check("Foreign Languages row renders", flText !== null);
    check("split chip renders (⚯ N splits)", flText && /splits/.test(flText));
    check("per-language split codes render (FLSP/FLFR/FLGE)", flText && flText.indexOf("FLSP") >= 0 && flText.indexOf("FLFR") >= 0 && flText.indexOf("FLGE") >= 0);
    const bioText = rowTextFor("Biological Sciences");
    check("non-split discipline shows NO split chip", bioText !== null && !/splits/.test(bioText));

    // Discipline search matches a language NAME not in the discipline title.
    setSearch("cs-search", "spanish");
    let shown = disciplinesShown();
    check("search 'spanish' surfaces Foreign Languages", shown.indexOf("Foreign Languages") >= 0);
    check("search 'spanish' filters OUT Biological Sciences", shown.indexOf("Biological Sciences") < 0);

    // Discipline search matches a split CODE.
    setSearch("cs-search", "flfr");
    shown = disciplinesShown();
    check("search 'flfr' (split code) surfaces Foreign Languages", shown.indexOf("Foreign Languages") >= 0);

    // Clear, then the SUBJ-code box matches a split code.
    setSearch("cs-search", "");
    setSearch("cs-subj-search", "flsp");
    shown = disciplinesShown();
    check("SUBJ box 'flsp' surfaces Foreign Languages", shown.indexOf("Foreign Languages") >= 0);
    check("SUBJ box 'flsp' filters OUT Biological Sciences", shown.indexOf("Biological Sciences") < 0);
  } catch (e) {
    check("no exception during assertions: " + e.message, false);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
}, 200);
