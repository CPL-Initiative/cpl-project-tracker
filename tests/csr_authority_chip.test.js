// Regression test for the CSR (canonical_subj4.js) authority chip — item 19 of
// the 2026-09-03 rulings (Sam: "stay with 4-characters and add a CID chip with
// the verbatim CID code showing"). The seed entry carries authority_chips /
// canonical_source / authority_flag (kb/_seed_authority_codes.py); the tab must:
//   (a) render a word chip "C-ID AJ" on the Common SUBJ cell of a discipline
//       whose canonical code differs from the authority's (CRIM vs C-ID AJ)
//   (b) render NO chip where the canonical IS the authority's code (PSYC = CCN)
//   (c) render the word "proposed" where no authority names the discipline
//   (d) make the chip code searchable — typing "AJ" in the discipline box
//       surfaces Administration of Justice; the SUBJ code box "aj" too
//   (e) offer the four authority filters and apply them
//   (f) count the sources in the summary line
//
// Run from repo root: `npm test` (or `node tests/csr_authority_chip.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("canonical_subj4.js", "utf8");

const SEED = {
  _counts: {},
  disciplines: {
    "Administration of Justice": {
      canonical_subj4: "CRIM", source: "curator_override", reviewed_at: "2026-05-23T17:28:23Z",
      reviewed_by: "map@rccd.edu", data_modal: "AJ", data_modal_is_4letter: false,
      total_mids: 1564, local_subject_variants: { AJ: 582, ADMJ: 226 },
      top_category_2digit: "21", needs_review: false,
      ccn_subject_code: null, cid_subject_codes: ["AJ", "LPPS"], canonical_source: "csr",
      authority_chips: [{ system: "C-ID", code: "AJ" }], authority_flag: "proposed",
      authority_note: "Common SUBJ CRIM is the CSR's four-letter code; the authority says C-ID AJ.",
    },
    "Psychology": {
      canonical_subj4: "PSYC", source: "curator_override", reviewed_at: "2026-05-23T17:28:23Z",
      reviewed_by: "map@rccd.edu", data_modal: "PSYC", data_modal_is_4letter: true,
      total_mids: 432, local_subject_variants: { PSYC: 524 },
      top_category_2digit: "20", needs_review: false,
      ccn_subject_code: "PSYC", cid_subject_codes: ["PSY"], canonical_source: "ccn",
      authority_chips: [{ system: "C-ID", code: "PSY" }], authority_flag: null,
    },
    "Dance": {
      canonical_subj4: "DANC", source: "data_modal", data_modal: "DANC",
      data_modal_is_4letter: true, total_mids: 1639, local_subject_variants: { DANC: 900 },
      top_category_2digit: "10",
      ccn_subject_code: null, cid_subject_codes: [], canonical_source: "csr",
      authority_chips: [], authority_flag: "proposed",
    },
    "Mathematics": {
      canonical_subj4: "MATH", source: "data_modal", data_modal: "MATH",
      data_modal_is_4letter: true, total_mids: 800, local_subject_variants: { MATH: 800 },
      top_category_2digit: "17",
      ccn_subject_code: "MATH", cid_subject_codes: ["MATH"], canonical_source: "ccn",
      authority_chips: [], authority_flag: null,
    },
  },
};

function mockFetch(url) {
  const body =
    url.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
    url.indexOf("discipline_aliases.json") >= 0 ? { aliases: {} } :
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
function rowFor(disc) {
  return [...doc.querySelectorAll("tr")].find((tr) => {
    const td = tr.querySelector("td.cs-disc");
    return td && (td.textContent || "").trim().indexOf(disc) === 0;
  });
}
function disciplinesShown() {
  return [...doc.querySelectorAll("td.cs-disc")].map((td) => (td.textContent || "").trim());
}
function chipsIn(tr) {
  return tr ? [...tr.querySelectorAll(".cs-badge.auth")].map((c) => c.textContent.trim()) : [];
}
function setSearch(id, val) {
  const inp = doc.getElementById(id);
  inp.value = val;
  inp.dispatchEvent(new window.Event("input"));
}

setTimeout(() => {
  try {
    const aj = rowFor("Administration of Justice");
    check("Administration of Justice row renders", !!aj);
    check("(a) the chip reads the verbatim code as a word: 'C-ID AJ'",
      chipsIn(aj).length === 1 && chipsIn(aj)[0] === "C-ID AJ");
    check("(a) the chip is a hover explanation, not a control (title names rule 3)",
      !!aj && /rule 3/.test(aj.querySelector(".cs-badge.auth").getAttribute("title") || ""));
    check("(c) a CSR-proposed code shows the word 'proposed'",
      !!aj && [...aj.querySelectorAll(".cs-badge.proposed")].map((c) => c.textContent.trim()).join() === "proposed");
    const psyc = rowFor("Psychology");
    check("(b) a canonical that is the CCN code shows no 'proposed' word",
      !!psyc && psyc.querySelectorAll(".cs-badge.proposed").length === 0);
    check("(b) Psychology still shows the C-ID PSY chip (the code that differs)",
      chipsIn(psyc).join() === "C-ID PSY");
    const math = rowFor("Mathematics");
    check("(b) a canonical that IS the authority's code shows no chip at all",
      !!math && chipsIn(math).length === 0 && math.querySelectorAll(".cs-badge.proposed").length === 0);
    const dance = rowFor("Dance");
    check("(c) a discipline with no authority code shows 'proposed' and no chip",
      !!dance && chipsIn(dance).length === 0 && dance.querySelectorAll(".cs-badge.proposed").length === 1);
    check("the chip CSS is injected once from the tab's JS (both HTMLs covered)",
      doc.querySelectorAll("#cs-auth-css").length === 1
      && /--seal-blue/.test(doc.getElementById("cs-auth-css").textContent));

    // (d) search by the chip code
    setSearch("cs-search", "aj");
    let shown = disciplinesShown();
    check("(d) discipline search 'aj' surfaces Administration of Justice by its chip",
      shown.some((d) => d.indexOf("Administration of Justice") === 0));
    check("(d) discipline search 'aj' filters OUT Dance",
      !shown.some((d) => d.indexOf("Dance") === 0));
    setSearch("cs-search", "proposed");
    shown = disciplinesShown();
    check("(d) discipline search 'proposed' surfaces the CSR-proposed rows only",
      shown.some((d) => d.indexOf("Dance") === 0) && !shown.some((d) => d.indexOf("Psychology") === 0));
    setSearch("cs-search", "");
    const subjBox = doc.getElementById("cs-subj-search");
    if (subjBox) {
      setSearch("cs-subj-search", "psy");
      shown = disciplinesShown();
      check("(d) the SUBJ code box 'psy' surfaces Psychology through its C-ID chip",
        shown.some((d) => d.indexOf("Psychology") === 0));
      setSearch("cs-subj-search", "");
    } else {
      check("(d) the SUBJ code box exists", false);
    }

    // (e) filters
    const sel = doc.getElementById("cs-filter");
    const opts = [...sel.options].map((o) => o.value);
    check("(e) the four authority filters are offered",
      ["ccn", "cid", "chip", "proposed"].every((v) => opts.indexOf(v) >= 0));
    sel.value = "ccn"; sel.dispatchEvent(new window.Event("change"));
    shown = disciplinesShown();
    check("(e) filter 'Common SUBJ is the CCN code' keeps Psychology + Mathematics only",
      shown.length === 2 && shown.some((d) => d.indexOf("Psychology") === 0) && shown.some((d) => d.indexOf("Mathematics") === 0));
    sel.value = "chip"; sel.dispatchEvent(new window.Event("change"));
    shown = disciplinesShown();
    check("(e) filter 'shows a chip' keeps the two rows whose code differs",
      shown.length === 2 && shown.some((d) => d.indexOf("Administration of Justice") === 0) && shown.some((d) => d.indexOf("Psychology") === 0));
    sel.value = "proposed"; sel.dispatchEvent(new window.Event("change"));
    shown = disciplinesShown();
    check("(e) filter 'proposed' keeps the CSR-minted rows",
      shown.length === 2 && shown.some((d) => d.indexOf("Dance") === 0) && shown.some((d) => d.indexOf("Administration of Justice") === 0));
    sel.value = "all"; sel.dispatchEvent(new window.Event("change"));

    // (f) summary
    const sum = doc.getElementById("cs-summary").textContent;
    check("(f) the summary counts the sources", /on a CCN code 2/.test(sum) && /CSR proposed 2/.test(sum) && /with a chip 2/.test(sum));
  } catch (e) {
    check("no exception during assertions: " + e.message, false);
  }
  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 150);
