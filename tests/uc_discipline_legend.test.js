// Guards the CCR discipline↔subject clarifier (Session 69, Sam's ask #4).
// A DISCIPLINE (our normalized field, e.g. "Art") gathers many local SUBJECT
// codes (ART / ARTS / PHOT / MMST…). The fix surfaces that rollup so the two
// stop being confusing:
//   - each Disciplines-filter OPTION carries an inline subject hint
//     ("Art — ART · ARTS · PHOT [· +N]"), derived from the noisy local r.subj;
//   - the Disciplines select is widened to fit it;
//   - selecting a discipline shows a LEGEND row of its SUBJ chips + the homonym
//     caveat ("subjects SEEN IN this discipline, not authoritative").
//
// Run from repo root: `npm test` (or `node tests/uc_discipline_legend.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = fs.readFileSync("unified_courses.js", "utf8");

const mkFlags = () => ({ over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false });
const row = (id, disc, subj) => ({
  kind: "Course", id, title: id + " course", id_system: "M-ID", disc, credit: "Credit",
  units: 3.0, top: "0699.00", subj, members: 2, adopted: [], potential: [], conf: 0.8,
  locked: false, flags: mkFlags(),
});
const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({
    generated_at: "2026-06-22 17:00",
    rows: [
      row("ARTS M1341", "Art", ["ART"]),
      row("ARTS M1345", "Art", ["ARTS", "PHOT"]),
      row("CISC M1001", "Computer Science", ["CISC"]),
    ],
    colleges: ["A"], mq_disciplines: ["Art", "Computer Science"], topmap: {},
  })};
  window.CPL_UC_MEMBERS = { generated_at: "2026-06-22 17:02", colleges: ["A"], members: {}, topmap: {} };
</script>
</body></html>`;

(async function main() {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  dom.window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  dom.window.eval(src);
  await sleep(150);
  const d = dom.window.document;

  // #4a — the Disciplines option carries the inline subject hint (local codes, sorted)
  const fDisc = d.getElementById("uc-disc");
  const optTexts = Array.from(fDisc.querySelectorAll("option")).map((o) => o.textContent);
  check("Disciplines option shows inline subject hint ('Art — ART · ARTS · PHOT')",
    optTexts.indexOf("Art — ART · ARTS · PHOT") >= 0);
  check("the option VALUE stays the bare discipline (filtering unaffected)",
    Array.from(fDisc.querySelectorAll("option")).some((o) => o.value === "Art"));

  // #4b — the select is widened for the hint
  check("Disciplines select is widened (minWidth set)", fDisc.style.minWidth === "230px");

  // no legend until a discipline is picked
  check("no legend row before a discipline is selected",
    !d.querySelector(".uc-disc-legend"));

  // #4c — selecting a discipline reveals the SUBJ-chip legend + homonym caveat
  fDisc.value = "Art";
  fDisc.dispatchEvent(new dom.window.Event("change"));
  await sleep(60);
  const legend = d.querySelector(".uc-disc-legend");
  check("selecting 'Art' shows the discipline→subject legend row", !!legend);
  const chips = legend ? Array.from(legend.querySelectorAll(".uc-disc-legend-chip")).map((c) => c.textContent) : [];
  check("legend lists the local subject chips (ART, ARTS, PHOT)",
    chips.indexOf("ART") >= 0 && chips.indexOf("ARTS") >= 0 && chips.indexOf("PHOT") >= 0);
  check("legend carries the 'seen in' framing + homonym caveat (ⓘ)",
    legend && /seen in/i.test(legend.textContent) && !!legend.querySelector(".uc-disc-legend-info"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
