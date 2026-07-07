// Regression tests for the CER's CareerOneStop authority badge (2026-07-07).
//
// kb/cos_matches.json is an OPTIONAL overlay (absent until the
// cos-authority-sync workflow first lands data). Guards:
//   1. file absent (404) → no chips, no crash, no attribution line;
//   2. file present → matched row shows "✓ COS" (exact) / "≈ COS" (weaker
//      tier), tooltip carries the org + the required USDOL/DEED attribution,
//      and the summary renders the attribution line;
//   3. unmatched rows stay chip-free.
//
// Run from repo root: `npm test` (or `node tests/cer_cos_badge.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const fixtureRows = [
  { ut: "CompTIA A+", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
  { ut: "Firefighter I Academy", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
  { ut: "Unmatched Credential", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
];
const cosMatches = {
  _attribution: "Source: CareerOneStop (www.careeronestop.org), sponsored by USDOL ETA; data maintained by Minnesota DEED.",
  count: 2,
  matches: {
    "CompTIA A+": { name: "CompTIA A+", org: "Computing Technology Industry Association (CompTIA)", tier: "exact", in_demand: true },
    "Firefighter I Academy": { name: "Firefighter I", org: "National Fire Protection Association", tier: "contains" },
  },
};

function makeDom(withCos) {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = { _generated_at: "t", top_categories: {}, unified_titles: fixtureRows };
  window.fetch = function (url) {
    url = String(url);
    if (url.indexOf("cos_matches.json") >= 0) {
      return withCos
        ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(cosMatches) })
        : Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  window.eval(src);
  return window;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // Scenario A — overlay absent.
  const wa = makeDom(false);
  await sleep(100);
  const da = wa.document;
  check("absent: table rendered", da.querySelectorAll("tr.cr-row").length === 3);
  check("absent: no COS chips", da.querySelectorAll(".cr-chip-cos").length === 0);
  check("absent: no attribution line", !da.querySelector(".cr-cos-attrib"));

  // Scenario B — overlay present.
  const wb = makeDom(true);
  await sleep(120);
  const db = wb.document;
  const chips = Array.from(db.querySelectorAll(".cr-chip-cos"));
  check("present: exactly 2 COS chips", chips.length === 2);
  const rowOf = (t) => Array.from(db.querySelectorAll("tr.cr-row"))
    .find((tr) => txt(tr).indexOf(t) >= 0);
  const comptia = rowOf("CompTIA A+") && rowOf("CompTIA A+").querySelector(".cr-chip-cos");
  check("present: exact tier renders ✓ COS", comptia && txt(comptia) === "✓ COS");
  check("present: tooltip carries the org", comptia && /Computing Technology Industry Association/.test(comptia.title));
  check("present: tooltip carries the attribution", comptia && /CareerOneStop/.test(comptia.title) && /DEED/.test(comptia.title));
  check("present: in-demand surfaces in the tooltip", comptia && /in-demand/.test(comptia.title));
  const ff = rowOf("Firefighter I Academy") && rowOf("Firefighter I Academy").querySelector(".cr-chip-cos");
  check("present: weaker tier renders ≈ COS", ff && txt(ff) === "≈ COS");
  check("present: unmatched row has no chip",
    rowOf("Unmatched Credential") && !rowOf("Unmatched Credential").querySelector(".cr-chip-cos"));
  check("present: summary attribution line renders", /CareerOneStop/.test(txt(db.querySelector(".cr-cos-attrib"))));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
