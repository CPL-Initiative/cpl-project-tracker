// The Credential Reference tab reads the credential family (#3117 review: the tab did not read `family` yet). Sam,
// 2026-11-11 (cpl_memory sam-bundle-family-is-a-field-2026-11-11): each ASE bundle stays its own title and carries
// the family "ASE Certificate Bundles". Guards:
//   1. a member's row names its family in plain words on the quiet context line; a title in no family shows none;
//   2. the open row says the family and that the title stays its own credential;
//   3. a search for the family name returns every member and nothing else (the family is a search alias);
//   4. a member whose issuer the fold decided (#3116) shows the family line and "Set by the fold on <date>" both.
//
// Run from repo root: `npm test` (or `node tests/credential_family_reference.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const FAM = "ASE Certificate Bundles";
const rows = [
  { ut: "ASE Bundle — A4, A5", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0, family: FAM },
  { ut: "ASE Bundle — T2, T8", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0, family: FAM },
  { ut: "Brakes (ASE A5)", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
];

const P = "_CREDENTIAL_REVIEW::";
const RES = JSON.stringify({ rule: "reviewer", winner: "National Institute for Automotive Service Excellence (ASE)", dropped: ["ASE"],
  kept_additional: [], decided_at: "2026-11-11T16:00:00Z", fold_id: "2026-11-11@2026-11-11T16:05:00Z" });
const LIVE = [
  { course_id: P + "ASE Bundle — A4, A5", field: "issuing_agency_override", value: "ASE", reviewed_at: "2026-07-09T00:07:08Z" },
  { course_id: P + "ASE Bundle — A4, A5", field: "issuer_resolution", value: RES, reviewed_at: "2026-11-11T16:06:00Z" }
];

function makeDom(live) {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = { _generated_at: "t", top_categories: {}, unified_titles: rows };
  window.fetch = function (url) {
    const body = live && /kb_curation/.test(String(url)) ? JSON.parse(JSON.stringify(live)) : [];
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, json: () => Promise.resolve(body) });
  };
  if (live) window.eval(fs.readFileSync("issuer_resolution.js", "utf8"));
  window.eval(src);
  return window;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const w = makeDom();
  await sleep(120);
  const d = w.document;
  const rowOf = (t) => Array.from(d.querySelectorAll("tr.cr-row")).find((tr) => txt(tr).indexOf(t) >= 0);
  const famOf = (t) => txt(rowOf(t) && rowOf(t).querySelector(".cr-ctx-fam"));
  check("a member's row names its family in words", famOf("ASE Bundle — A4, A5") === "Family: " + FAM);
  check("a title in no family shows no family line", rowOf("Brakes (ASE A5)") && !rowOf("Brakes (ASE A5)").querySelector(".cr-ctx-fam"));
  check("the family line carries no glyph", !/[←-⯿\u{1F300}-\u{1FAFF}]/u.test(famOf("ASE Bundle — A4, A5")));

  rowOf("ASE Bundle — A4, A5").querySelector("button.cr-title-toggle").click();
  await sleep(40);
  const line = d.querySelector(".cr-expanded .cr-fam-line");
  check("the open row says the family and that the title stays its own credential",
    /^Family: ASE Certificate Bundles\. This title stays its own credential/.test(txt(line)));

  const s = d.getElementById("cr-search");
  s.value = FAM; s.dispatchEvent(new w.Event("input"));
  await sleep(40);
  const shown = Array.from(d.querySelectorAll("tr.cr-row")).map((tr) => txt(tr.querySelector("button.cr-title-toggle")));
  check("a search for the family returns every member and nothing else",
    shown.length === 2 && shown.indexOf("ASE Bundle — A4, A5") >= 0 && shown.indexOf("ASE Bundle — T2, T8") >= 0);

  {
    const w2 = makeDom(LIVE);
    await sleep(200);
    const d2 = w2.document;
    const r2 = Array.from(d2.querySelectorAll("tr.cr-row")).find((tr) => txt(tr).indexOf("ASE Bundle — A4, A5") >= 0);
    const fold = Array.from((r2 && r2.querySelectorAll(".cr-fold-line")) || []).map(txt);
    check("a member the fold decided shows its family and the fold's line both",
      txt(r2 && r2.querySelector(".cr-ctx-fam")) === "Family: " + FAM && fold[0] === "Set by the fold on 2026-11-11");
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
