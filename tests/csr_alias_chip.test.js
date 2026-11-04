// Regression test for the CSR (canonical_subj4.js) fan-in alternate name (2026-06-10). A fan-in convergence folds
// two MQ discipline names for one converging field into a canonical (Kinesiology <- Physical Education,
// Drama/Theater Arts <- Theater Arts; kb/discipline_aliases.json). The CSR keeps ONE row (the canonical); the
// alternate name must stay discoverable. Since 2026-11-04 these guards read the List (the Reference table retired
// into it; the "also:" chip became the panel's line):
//   (a) the canonical's panel names the alternate ("Also: Physical Education")
//   (b) finding the ALTERNATE name surfaces the canonical row
//   (c) a discipline with no alias names none
//
// Run from repo root: `npm test` (or `node tests/csr_alias_chip.test.js`).
const { boot, txt, report } = require("./csr_list_harness.js");
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


(async function () {
  const results = [];
  const check = (name, cond, why) => results.push([name, !!cond, why]);
  const t = boot({ seed: SEED, aliases: ALIASES });
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
  check("the List lists the three MQ disciplines", t.titles().length === 3, t.titles().join("|"));
  const kin = await t.panel("Kinesiology");
  check("(a) Kinesiology's panel names its alternate", !!kin && /Also: Physical Education\./.test(txt(kin)), kin && txt(kin).slice(0, 300));
  const dra = await t.panel("Drama/Theater Arts");
  check("(a) Drama/Theater Arts' panel names Theater Arts", !!dra && /Also: Theater Arts\./.test(txt(dra)));
  const bio = await t.panel("Biological Sciences");
  check("(c) a discipline with no alias names none", !!bio && !/Also:/.test(txt(bio)));
  check("(b) finding 'physical education' surfaces Kinesiology only", (await t.find("physical education")).join("|") === "Kinesiology", t.titles().join("|"));
  check("(b) finding 'theater arts' surfaces Drama/Theater Arts", (await t.find("theater arts")).indexOf("Drama/Theater Arts") >= 0);
  check("(b) finding 'biological' does not surface the alias rows", (await t.find("biological")).join("|") === "Biological Sciences");
  report(results);
})().catch((e) => { console.error(e); process.exit(1); });
