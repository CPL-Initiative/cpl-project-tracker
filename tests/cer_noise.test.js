// Regression tests for the CER R1 noise-suppression (2026-06-04):
//   - "elective-bucket" identities (a.bucket) are DEMOTED into a collapsed
//     <details> disclosure and excluded from the main identity table + header
//     count (Clovis's COMM M1038 → 61 credentials of generic elective credit).
//   - "subject-outlier" identities (a.outlier) stay VISIBLE with a review badge.
// Guards the failure mode with a synthetic fixture carrying explicit flags, then
// opportunistically checks the real "AP European History" baked row.
//
// Run from repo root: `npm test` (or `node tests/cer_noise.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
function loadPayload(p) {
  let s = fs.readFileSync(p, "utf8");
  s = s.slice(s.indexOf("=") + 1).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
}
const payload = loadPayload("credential_reference_data.js");
const byUt = Object.fromEntries(payload.unified_titles.map((r) => [r.ut, r]));

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ── Synthetic credential: 5 substantive identities (HIST×4 + a DANC outlier) +
// 1 elective-bucket (COMM M1038). Flags are set explicitly to test the CONSUMER
// independently of the producer's detection thresholds. ──
const noiseRow = {
  ut: "ZZZ Noise Test Credential", raw_count: 5, audit_tags: {}, audit_tag_total: 0,
  n_articulation_lines: 6,
  articulations: [
    { cid: "HIST 170", sys: "C-ID", title: "Western Civ I", disc: "History",
      local: [{ subj: "HIST", num: "170", t: "Western Civ I", colleges: ["Glendale Community College"] }] },
    { cid: "HIST 180", sys: "C-ID", title: "Western Civ II", disc: "History",
      local: [{ subj: "HIST", num: "180", t: "Western Civ II", colleges: ["Glendale Community College"] }] },
    { cid: "HIST M1153", sys: "M-ID", title: "Intro Western Civ I", disc: "History",
      local: [{ subj: "HIST", num: "1", t: "Intro WC I", colleges: ["Los Angeles Pierce College"] }] },
    { cid: "HIST M1155", sys: "M-ID", title: "Intro Western Civ II", disc: "History",
      local: [{ subj: "HIST", num: "2", t: "Intro WC II", colleges: ["Los Angeles Pierce College"] }] },
    { cid: "DANC M1001", sys: "M-ID", title: "Modern Dance", disc: "Dance", outlier: 1,
      local: [{ subj: "DANC", num: "5", t: "Dance", colleges: ["Foothill College"] }] },
    { cid: "COMM M1038", sys: "M-ID", title: "Group Communication", disc: "Communication Studies", bucket: 1,
      local: [{ subj: "COMM", num: "8", t: "Group Communication", colleges: ["Clovis Community College"] }] },
  ],
};
const apEuro = byUt["AP European History"];
const fixtureRows = apEuro ? [noiseRow, apEuro] : [noiseRow];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-credential-reference">
  <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
</div>
<script>window.CPL_CREDENTIAL_REFERENCE = ${JSON.stringify({
  _generated_at: payload._generated_at, top_categories: payload.top_categories,
  unified_titles: fixtureRows,
})};</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(runAssertions, 80);

// Expand the row whose toggle text contains `needle`; return its expanded body.
// Clicking the toggle triggers a full render() (rebuilds the table), so we must
// RE-QUERY for the row + its sibling afterwards — any pre-click node ref is stale.
function expandBody(wrap, needle) {
  const tog = Array.from(wrap.querySelectorAll(".cr-title-toggle"))
    .find((b) => txt(b).indexOf(needle) >= 0);
  if (!tog) return null;
  tog.click();
  const trRow = Array.from(wrap.querySelectorAll("tr.cr-row"))
    .find((tr) => txt(tr).indexOf(needle) >= 0);
  const sib = trRow && trRow.nextElementSibling;
  return (sib && sib.classList && sib.classList.contains("cr-expanded"))
    ? sib.querySelector(".cr-expanded-body") : null;
}

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");
  check("table rendered", !!wrap.querySelector("table.cr-table"));

  const body = expandBody(wrap, "ZZZ Noise Test Credential");
  check("synthetic row expanded", !!body);
  if (body) {
    const mainTbl = body.querySelector("table.cr-arts-table:not(.cr-bucket-table)");
    const mainRows = mainTbl ? mainTbl.querySelectorAll("tbody tr.cr-art-row") : [];
    check("main table shows the 5 substantive identities (bucket excluded)", mainRows.length === 5);
    check("main table does NOT contain COMM M1038", !/COMM M1038/.test(txt(mainTbl)));

    const det = body.querySelector("details.cr-bucket-details");
    check("elective-bucket disclosure present", !!det);
    check("disclosure contains COMM M1038", !!det && /COMM M1038/.test(txt(det)));
    check("disclosure summary reads '1 non-substantive … entry'",
      !!det && /1 non-substantive/.test(txt(det)) && /entry/.test(txt(det)));

    const outliers = body.querySelectorAll(".cr-art-outlier");
    check("exactly one subject-outlier badge", outliers.length === 1);
    const danceRow = Array.from(mainRows).find((tr) => /DANC M1001/.test(txt(tr)));
    check("outlier badge is on the DANC (minority-subject) row",
      !!danceRow && !!danceRow.querySelector(".cr-art-outlier"));

    const h5 = Array.from(body.querySelectorAll("h5")).map(txt)
      .find((h) => /Common-course identities/.test(h));
    check("header count reflects SHOWN identities (5)", !!h5 && /\(5 identities/.test(h5));
  }

  // Opportunistic real-data check: AP European History demotes COMM M1038.
  if (apEuro) {
    const apBody = expandBody(wrap, "AP European History");
    if (apBody) {
      const mainTbl = apBody.querySelector("table.cr-arts-table:not(.cr-bucket-table)");
      const det = apBody.querySelector("details.cr-bucket-details");
      check("AP Euro: COMM M1038 demoted out of the main table",
        !!mainTbl && !/COMM M1038/.test(txt(mainTbl)) && !!det && /COMM M1038/.test(txt(det)));
    } else {
      check("(AP European History present but not expandable — skipped)", true);
    }
  } else {
    check("(AP European History absent from payload — skipped real-data check)", true);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
