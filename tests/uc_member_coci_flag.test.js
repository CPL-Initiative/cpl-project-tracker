// Guards the COCI title-correction flag in the CCR member table (Sam,
// 2026-06-12 — "IntroductionÃ‚Â Toã‚â Poetry"): when a raw college course
// title carried encoding artifacts (mojibake), the generator repairs it for
// display and stamps the member entry e:1. The expanded member table must
//   1. render the repaired title text, and
//   2. chip the flagged row "⚠ fix in COCI" with the explanatory tooltip
//      (the source record still needs correction in COCI; the queue lives in
//      kb/coci_title_corrections.json), and
//   3. leave unflagged members chip-free.
//
// Run from repo root: `npm test` (or `node tests/uc_member_coci_flag.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const row = {
  kind: "Course", id: "ENGL M1001", title: "Introduction to Poetry", id_system: "M-ID",
  disc: "English", credit: "Credit", units: 3, top: "1501.00", subj: ["ENGL"],
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
};
const members = {
  "ENGL M1001": [
    { c: 0, n: "ENGL 21", t: "Introduction To Poetry: Creative Writing", u: 3, p: "1501.00", e: 1 },
    { c: 1, n: "ENGL 105", t: "Intro to Poetry", u: 3, p: "1501.00" },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: [row], colleges: ["A", "B"], mq_disciplines: ["English"], topmap: {} })};
  window.CPL_UC_MEMBERS = ${JSON.stringify({ colleges: ["Moorpark College", "Oxnard College"], members: members, topmap: {} })};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

setTimeout(() => {
  const doc = window.document;
  const tr = Array.from(doc.querySelectorAll("#uc-table-wrap table.uc-table tbody tr"))
    .find((r) => /ENGL M1001/.test(txt(r)));
  check("the M-ID row renders", !!tr);
  const caret = tr.querySelector("a.uc-caret");
  caret.click();   // toggleMembers → loadMembers() resolves from window.CPL_UC_MEMBERS

  setTimeout(() => {
    const mt = tr.nextElementSibling && tr.nextElementSibling.querySelector("table.uc-member-table");
    check("member table renders", !!mt);
    const mrows = Array.from(mt.querySelectorAll("tbody tr"));
    const codeOf = (r) => txt(r.querySelectorAll("td")[1]);
    const flagged = mrows.find((r) => codeOf(r) === "ENGL 21");
    const clean = mrows.find((r) => codeOf(r) === "ENGL 105");
    check("repaired title text renders", flagged && /Introduction To Poetry: Creative Writing/.test(txt(flagged)));
    const chip = flagged && Array.from(flagged.querySelectorAll("span")).find((s) => /fix in COCI/.test(txt(s)));
    check("flagged member carries the ⚠ fix-in-COCI chip", !!chip);
    check("chip tooltip explains the artifact + the queue",
      chip && /encoding artifacts/.test(chip.getAttribute("title") || "")
      && /coci_title_corrections\.json/.test(chip.getAttribute("title") || ""));
    check("unflagged member has NO chip",
      clean && !Array.from(clean.querySelectorAll("span")).some((s) => /fix in COCI/.test(txt(s))));

    let pass = 0;
    for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
    console.log(`\n${pass}/${results.length} assertions passed`);
    process.exit(pass === results.length && results.length > 0 ? 0 : 1);
  }, 150);
}, 120);
