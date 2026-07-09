// EACR header re-grain (2026-07-09 — Sam: "count the common exhibit titles
// rather than the raw exhibits"). The Exhibit Adoption header now LEADS with
// the distinct-unified-title count; the per-card grain (title × issuer × CPL
// type) stays for the cards themselves and is reported as "issuer/type cards".
//
// Run from repo root: `npm test` (or `node tests/eacr_common_titles.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// 3 cards, 2 common titles: CompTIA A+ appears as a CCC card AND a Local
// card (the exact split the old header double-counted).
const exhibits = [
  { exhibit_id: "x1", title: "CompTIA A+", unified_title: "CompTIA A+", issuing_agency: "CompTIA",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "CCC Collaborative",
    adopters: 1, adopter_names: ["College A"], potential: 1, potential_names: ["College B"],
    credit_recs: [{ course: "CIS 110", credit: "4 hours in ICT Essentials" }] },
  { exhibit_id: "x2", title: "CompTIA A+", unified_title: "CompTIA A+", issuing_agency: "CompTIA",
    is_classified: true, cpl_type: "Credit By Exam", collaborative_type: "Local",
    adopters: 1, adopter_names: ["College B"], potential: 0, potential_names: [],
    credit_recs: [{ course: "CIS 50", credit: "3 hours in A+ Challenge" }] },
  { exhibit_id: "x3", title: "Cisco CCNA", unified_title: "Cisco CCNA", issuing_agency: "Cisco",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "Local",
    adopters: 1, adopter_names: ["College A"], potential: 0, potential_names: [],
    credit_recs: [{ course: "NET 1", credit: "3 hours in Networking" }] },
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CPL_STATEWIDE_PRESCRIPTIVE = {};
  window.CCC_COLLEGE_LOOKUP = { "College A": { district: "D1", swRegion: "R1" },
                                "College B": { district: "D2", swRegion: "R2" } };
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(() => {
  const doc = window.document;
  const sub = doc.querySelector(".exhibit-card-subtitle");
  const t = txt(sub);
  check("header subtitle renders", !!sub);
  check("header LEADS with the common-title count (2, not 3)",
    /^2 common exhibit titles/.test(t));
  check("card-grain count survives as 'issuer/type cards' (3)",
    /3 issuer\/type cards/.test(t));
  check("CCC/Local split still reported", /1 CCC Collaborative, 2 Local/.test(t));
  check("credit-recommendation count intact", /3 credit recommendations/.test(t));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 100);
