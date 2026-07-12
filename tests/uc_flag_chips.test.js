// Guards the CCR credit/noncredit flag-chip revisions (Session 69, Sam's ask #6).
//   - The PRIMARY credit status is already in the Credit COLUMN, so the
//     credit_mixed flag now surfaces the OTHER status the row ALSO carries:
//       primary Credit    → "+ NC"   (also offered noncredit somewhere)
//       primary Noncredit → "+ CR"   (also offered for credit somewhere)
//     The redundant bare "credit"/"noncredit" status words are gone.
//   - ncc_mixed (noncredit CATEGORY disagreement) is relabeled "NC type" so it
//     stops colliding with the credit/noncredit status mix.
//
// Run from repo root: `npm test` (or `node tests/uc_flag_chips.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = fs.readFileSync("unified_courses.js", "utf8");

const mkRow = (over) => ({ over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false, ...over });
const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({
    generated_at: "2026-06-22 16:00",
    rows: [
      { // primary Credit + members split credit + noncredit-category mix
        kind: "Course", id: "ARTS M1341", title: "Digital Imaging A", id_system: "M-ID",
        disc: "Art", credit: "Credit", units: 3.0, top: "0699.00", subj: ["ARTS"],
        members: 3, adopted: [], potential: [], conf: 0.85, locked: false,
        flags: mkRow({ credit_mixed: true, ncc_mixed: true }),
      },
      { // primary Noncredit + members split credit
        kind: "Course", id: "ARTS M9342", title: "Digital Imaging B", id_system: "M-ID",
        disc: "Art", credit: "Noncredit", units: 0.0, top: "0699.00", subj: ["ARTS"],
        members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
        flags: mkRow({ credit_mixed: true }),
      },
      { // CR/NC MIRROR (Doctrine v0.3): credit_mixed is a CPL feature, not a warning
        kind: "Course", id: "ELET M1002", title: "Industrial Electricity", id_system: "M-ID",
        disc: "Electronics", credit: "Credit", units: 4.0, top: "0934.00", subj: ["ELET"],
        members: 2, adopted: [], potential: [], conf: 0.8, locked: false,
        flags: mkRow({ credit_mixed: true, crnc_mirror: "mirror" }),
      },
    ],
    colleges: ["A"], mq_disciplines: ["Art"], topmap: {},
  })};
  window.CPL_UC_MEMBERS = { generated_at: "2026-06-22 16:02", colleges: ["A"], members: {}, topmap: {} };
</script>
</body></html>`;

function badgesFor(d, titleRe) {
  const tr = Array.from(d.querySelectorAll(".uc-table tbody tr"))
    .find((row) => titleRe.test(row.textContent));
  return tr ? Array.from(tr.querySelectorAll(".uc-badge")).map((b) => b.textContent.trim()) : [];
}

(async function main() {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  dom.window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  dom.window.eval(src);
  await sleep(150);
  const d = dom.window.document;

  const a = badgesFor(d, /Digital Imaging A/);
  const b = badgesFor(d, /Digital Imaging B/);
  const m = badgesFor(d, /Industrial Electricity/);

  check("primary-Credit row shows '+ NC' (also has noncredit)", a.indexOf("+ NC") >= 0);
  check("primary-Credit row has NO redundant bare 'credit' chip", a.indexOf("credit") < 0);
  check("noncredit-category mix shows 'NC type'", a.indexOf("NC type") >= 0);
  check("no bare 'noncredit' chip remains", a.indexOf("noncredit") < 0 && b.indexOf("noncredit") < 0);
  check("primary-Noncredit row shows '+ CR' (also has credit)", b.indexOf("+ CR") >= 0);
  // Doctrine v0.3 CR/NC mirror: shows the 🔁 chip, NOT the amber "+ NC/CR" warning
  check("mirror row shows the 🔁 CR/NC mirror chip", m.some((t) => /🔁 CR\/NC mirror/.test(t)));
  check("mirror row does NOT show the amber '+ NC'/'+ CR' warning", m.indexOf("+ NC") < 0 && m.indexOf("+ CR") < 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
