// Guards the CCR tab's authority words (item 19 of the 2026-09-03 rulings) —
// the Subject dropdown option for a Common SUBJ whose canonical code differs
// from the authority's reads "CRIM — C-ID AJ"; a CSR-proposed code reads
// "DANC — proposed" (item 18); the option VALUE stays the bare code so
// passes()/state.subj are untouched; a code the authority owns reads bare; and
// the Common SUBJ cell's hover names the authority. Fail-soft: a 404 keeps the
// flat labels.
//
// Run from repo root: `npm test` (or `node tests/ccr_subject_authority_label.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rejections = [];
process.on("unhandledRejection", (e) => rejections.push(e));

const mkRow = (id, title, disc, subj) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: disc, credit: "Credit", units: 3.0, top: null, subj: subj,
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [
  mkRow("CRIM M1001", "Patrol Procedures", "Administration of Justice", ["AJ"]),
  mkRow("DANC M1002", "Ballet I", "Dance", ["DANC"]),
  mkRow("PSYC M1003", "General Psychology", "Psychology", ["PSYC"]),
];
const SEED = {
  disciplines: {
    "Administration of Justice": { canonical_subj4: "CRIM", variants_observed: { CRIM: 5 },
      canonical_source: "csr", authority_chips: [{ system: "C-ID", code: "AJ" }], authority_flag: "proposed" },
    "Dance": { canonical_subj4: "DANC", variants_observed: { DANC: 3 },
      canonical_source: "csr", authority_chips: [], authority_flag: "proposed" },
    "Psychology": { canonical_subj4: "PSYC", variants_observed: { PSYC: 4 },
      canonical_source: "ccn", authority_chips: [], authority_flag: null },
  },
};
function boot(seedResponder) {
  const html = `<!DOCTYPE html><html><head></head><body>
  <div id="tab-unified-courses">
    <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
  </div>
  <script>
    window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"],
      mq_disciplines: ["Administration of Justice", "Dance", "Psychology"], topmap: {} })};
  </script>
  </body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.fetch = (url) => {
    if (String(url).indexOf("discipline_canonical_subj4.json") >= 0) return seedResponder(window);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  window.alert = () => {};
  let threw = false;
  try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
  return { window: window, threw: threw };
}
(async function main() {
  const b1 = boot(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(SEED) }));
  check("init does not throw", !b1.threw);
  await sleep(160);
  const doc = b1.window.document;
  const selEl = doc.getElementById("uc-subj");
  const opt = (v) => selEl && [...selEl.querySelectorAll("option")].find((o) => o.value === v);
  check("the Subject option for CRIM reads the chip as a word: 'CRIM — C-ID AJ · proposed'",
    !!opt("CRIM") && opt("CRIM").textContent === "CRIM — C-ID AJ · proposed");
  check("the option VALUE stays the bare code", !!opt("CRIM") && opt("CRIM").value === "CRIM");
  check("a CSR-proposed code with no chip reads 'DANC — proposed'",
    !!opt("DANC") && opt("DANC").textContent === "DANC — proposed");
  check("a code the authority owns reads bare (PSYC is the CCN code)",
    !!opt("PSYC") && opt("PSYC").textContent === "PSYC");
  const cells = [...doc.querySelectorAll("table.uc-table tbody tr td")];
  const crimCell = cells.find((td) => (td.textContent || "").trim() === "CRIM" && /Authority/.test(td.getAttribute("title") || ""));
  check("the Common SUBJ cell's hover names the authority for CRIM",
    !!crimCell && /Authority: C-ID AJ/.test(crimCell.getAttribute("title")));
  const psycCell = cells.find((td) => (td.textContent || "").trim() === "PSYC");
  check("the Common SUBJ cell's hover stays quiet where the code is the authority's",
    !!psycCell && !/Authority:/.test(psycCell.getAttribute("title") || ""));
  // the filter still works on the bare value after the relabel
  selEl.value = "CRIM";
  selEl.dispatchEvent(new b1.window.Event("change"));
  await sleep(10);
  check("filtering by the relabeled option still selects on the bare code",
    doc.querySelectorAll("table.uc-table tbody tr").length === 1 && doc.body.textContent.indexOf("CRIM M1001") >= 0);

  // fail-soft: the seed 404s
  const b2 = boot(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) }));
  await sleep(120);
  const sel2 = b2.window.document.getElementById("uc-subj");
  check("a 404 on the seed keeps the flat, bare labels",
    !!sel2 && [...sel2.options].every((o) => o.textContent.indexOf("—") < 0));
  check("no unhandled rejections", rejections.length === 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
