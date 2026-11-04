// Regression test for Sam's 2026-06-12 CSR UI tweaks (canonical_subj4.js), read off the List since 2026-11-04 (the
// Reference table retired into it; its SUBJ dropdown and table chrome went with it):
//   (a) local college codes carry no "needs 4-letter" warning: they are the colleges' own vocabulary and may be
//       non-4-letter ("VN", "VOC ED"), so a warning there is noise;
//   (b) the residual warning case, a missing Common SUBJ, still surfaces where the fix happens: the row reads Open,
//       its Common SUBJ cell is empty, and No code yet lists it;
//   (c) the dropdown's job, finding a discipline by its Common SUBJ or a local code, is the List's find.
//
// Run from repo root: `npm test` (or `node tests/csr_ui_tweaks.test.js`).
const { boot, txt, report } = require("./csr_list_harness.js");
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


(async function () {
  const results = [];
  const check = (name, cond, why) => results.push([name, !!cond, why]);
  const t = boot({ seed: SEED });
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
  const locals = t.cell("Vocational Nursing", "Local SUBJs");
  check("(a) the local codes show as the colleges wrote them", /VN \(90\)/.test(locals || "") && /VOCN \(30\)/.test(locals || ""), locals);
  check("(a) no local code carries a four-letter warning", !/4-letter|four letters|needs/i.test(txt(t.d.getElementById("cs-list").querySelector(".csl-table tbody"))));
  check("(b) a missing Common SUBJ reads Open on its row", t.cell("Vocational Education", "Status") === "Open", t.cell("Vocational Education", "Status"));
  const code = t.cell("Vocational Education", "Common SUBJ");
  check("(b) and its Common SUBJ cell is empty", code === "" || code === "\u2014", code);
  t.word("No code yet").click();
  for (let i = 0; i < 15; i++) await new Promise((r) => setTimeout(r, 0));
  check("(b) No code yet lists it, and only it", t.titles().join("|") === "Vocational Education", t.titles().join("|"));
  t.word("All").click();
  for (let i = 0; i < 15; i++) await new Promise((r) => setTimeout(r, 0));
  check("(c) finding a Common SUBJ surfaces its discipline", (await t.find("WELD")).join("|") === "Welding", t.titles().join("|"));
  check("(c) finding a local code surfaces its discipline", (await t.find("voce")).join("|") === "Vocational Education", t.titles().join("|"));
  check("(c) finding a code that is both a Common SUBJ and a local code surfaces its one discipline", (await t.find("vocn")).join("|") === "Vocational Nursing", t.titles().join("|"));
  report(results);
})().catch((e) => { console.error(e); process.exit(1); });
