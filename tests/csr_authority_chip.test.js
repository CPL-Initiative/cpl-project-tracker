// Regression test for the CSR (canonical_subj4.js) authority code, item 19 of the 2026-09-03 rulings (Sam: "stay
// with 4-characters and add a CID chip with the verbatim CID code showing"). The seed entry carries authority_chips /
// canonical_source / authority_flag (kb/_seed_authority_codes.py). Since 2026-11-04 the guards read the List (the
// Reference table retired into it; the chip became the Authority column's words):
//   (a) the Authority column says "C-ID says AJ" on a discipline whose Common SUBJ differs from the authority's (CRIM)
//   (b) it reads the CCN where the Common SUBJ IS the authority's code (PSYC), with only the differing C-ID named
//   (c) it reads "Minted here (proposed)" where no authority names the discipline
//   (d) the authority's code is findable: finding "AJ" surfaces Administration of Justice
//   (e) the four authority filters apply: On the CCN code, On the C-ID code, An official code differs, Proposed
//
// Run from repo root: `npm test` (or `node tests/csr_authority_chip.test.js`).
const { boot, txt, report } = require("./csr_list_harness.js");
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


(async function () {
  const results = [];
  const check = (name, cond, why) => results.push([name, !!cond, why]);
  const t = boot({ seed: SEED });
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
  const aj = t.cell("Administration of Justice", "Authority");
  check("(a) the Authority column names the C-ID code that differs", /C-ID says AJ/.test(aj || ""), aj);
  check("(b) PSYC sits on the CCN's code, the differing C-ID named", /^CCN/.test(t.cell("Psychology", "Authority") || "") && /C-ID says PSY/.test(t.cell("Psychology", "Authority")), t.cell("Psychology", "Authority"));
  check("(b) MATH sits on the CCN's code and names no other", t.cell("Mathematics", "Authority") === "CCN", t.cell("Mathematics", "Authority"));
  check("(c) a code minted here reads proposed", /Minted here \(proposed\)/.test(t.cell("Dance", "Authority") || ""), t.cell("Dance", "Authority"));
  check("(d) finding AJ surfaces Administration of Justice", (await t.find("AJ")).indexOf("Administration of Justice") >= 0, t.titles().join("|"));
  await t.find("");
  const pick = async (label) => { t.word(label).click(); for (let i = 0; i < 15; i++) await new Promise((r) => setTimeout(r, 0)); return t.titles().join("|"); };
  check("(e) On the CCN code lists Psychology and Mathematics", (await pick("On the CCN code")) === "Mathematics|Psychology", t.titles().join("|"));
  check("(e) On the C-ID code lists none here", (await pick("On the C-ID code")) === "");
  check("(e) An official code differs lists the two with a differing code", (await pick("An official code differs")) === "Administration of Justice|Psychology", t.titles().join("|"));
  check("(e) Proposed lists the two minted here", (await pick("Proposed, no official code")) === "Administration of Justice|Dance", t.titles().join("|"));
  report(results);
})().catch((e) => { console.error(e); process.exit(1); });
