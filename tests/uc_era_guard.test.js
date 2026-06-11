// Guards the ERA GUARD on the CCR's lazy files (Session 42).
//
// The lazy files (members/details/…) are fetched LATER than the main payload.
// A tab held open across a daily deploy joins old row ids against a NEW lazy
// file (a stale browser cache gives the inverse mix). Under re-mint slot
// reuse an id can denote a DIFFERENT course family in a different era, so a
// mixed-era join silently renders another family's members under a row — the
// "non-argumentation members under an Argumentation row" symptom.
//
//  1. MISMATCHED eras (data stamp vs members stamp > 15 min apart): expanding
//     a row surfaces the #uc-era-warning reload banner, exactly once.
//  2. MATCHED eras (≤ 15 min skew — same generator run): no banner.
//
// Run from repo root: `npm test` (or `node tests/uc_era_guard.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = fs.readFileSync("unified_courses.js", "utf8");

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Communication Studies", credit: "Credit", units: 3.0, top: "1506.00",
  subj: ["COMM"], members: 3, adopted: [], potential: [], conf: 0.85,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false,
});
const members = {
  "COMM M1006": [
    { c: 0, n: "COMM 44", t: "ARGUMENTATION", u: 3.0, p: "1506.00" },
  ],
};

function build(dataStamp, membersStamp) {
  const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({
    generated_at: dataStamp, rows: [mkRow("COMM M1006", "Argumentation")],
    colleges: ["A"], mq_disciplines: ["Communication Studies"], topmap: {},
  })};
  window.CPL_UC_MEMBERS = ${JSON.stringify({
    generated_at: membersStamp, colleges: ["College of Alameda"],
    members: members, topmap: {},
  })};
</script>
</body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  dom.window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  dom.window.eval(src);
  return dom.window;
}

(async function main() {
  // 1. mismatched eras → banner, once
  const w1 = build("2026-06-11 15:00", "2026-06-10 10:17");
  await sleep(120);
  const caret = w1.document.querySelector("a.uc-caret");
  check("expand caret renders", !!caret);
  caret.click();
  await sleep(120);
  check("mixed-era expand surfaces the #uc-era-warning banner",
    !!w1.document.getElementById("uc-era-warning"));
  check("the banner names the remedy (reload)",
    /[Rr]eload/.test((w1.document.getElementById("uc-era-warning") || {}).textContent || ""));
  check("banner renders exactly once",
    w1.document.querySelectorAll("#uc-era-warning").length === 1);
  check("the member table still renders (guard warns, never blocks)",
    !!w1.document.querySelector(".uc-member-table"));

  // 2. matched eras (same run, minute skew) → no banner
  const w2 = build("2026-06-11 15:00", "2026-06-11 15:04");
  await sleep(120);
  w2.document.querySelector("a.uc-caret").click();
  await sleep(120);
  check("same-era expand shows NO banner",
    !w2.document.getElementById("uc-era-warning"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
