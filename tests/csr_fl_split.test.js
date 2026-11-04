// Regression test for the CSR (Common Subjects Reference / canonical_subj4.js) Foreign-Language SUBJ4 split
// (2026-06-09). The "Foreign Languages" MQ discipline is split per language (FLSP/FLFR/...) via
// foreign_language_subj4.json. MQ has no per-language discipline, so it stays ONE row, but the splits must be
// (a) findable and (b) visible on it. Since 2026-11-04 the guards read the List (the Reference table retired into it):
//   - the panel of Foreign Languages names each language and its code
//   - a discipline with no split names none
//   - finding "spanish" or "flfr" (a split code) surfaces Foreign Languages and filters out the others
//   - finding a language the split does not hold leaves nothing
//
// Run from repo root: `npm test` (or `node tests/csr_fl_split.test.js`).
const { boot, txt, report } = require("./csr_list_harness.js");
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


(async function () {
  const results = [];
  const check = (name, cond, why) => results.push([name, !!cond, why]);
  const t = boot({ seed: SEED, flsplit: FLSPLIT });
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
  const fl = await t.panel("Foreign Languages");
  check("the panel names each language and its code", !!fl && /Split by language: French FLFR, German FLGE, Spanish FLSP\./.test(txt(fl)), fl && txt(fl).slice(0, 300));
  const bio = await t.panel("Biological Sciences");
  check("a discipline with no split names none", !!bio && !/Split by language/.test(txt(bio)));
  check("finding 'spanish' surfaces Foreign Languages only", (await t.find("spanish")).join("|") === "Foreign Languages", t.titles().join("|"));
  check("finding 'flfr' (a split code) surfaces Foreign Languages", (await t.find("flfr")).join("|") === "Foreign Languages", t.titles().join("|"));
  check("finding 'flsp' surfaces Foreign Languages", (await t.find("flsp")).join("|") === "Foreign Languages");
  check("finding a language the split does not hold leaves nothing", (await t.find("klingon")).length === 0);
  report(results);
})().catch((e) => { console.error(e); process.exit(1); });
