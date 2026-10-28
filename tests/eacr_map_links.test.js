// EACR — the MAP link wherever the tab says a college could adopt (Sam, 2026-10-26:
// "the same MAP link on every public surface that suggests an adoption", and beside
// each exhibit ID "a chip with the short name of the college that built it, each
// opening MAP searched for its own ID"). Guards:
//   1. a verified exhibit ID gets a chip naming its builder, opening MAP's CPL
//      Opportunities page searched for that ID alone (?Exhibit=, Malone, 2026-10-26)
//   2. an ID MAP's API did not list gets no link (Ashley: "Only include verified, working links")
//   3. the could-adopt block, the near-me band and the table's Could Adopt column each
//      carry the line of chips, so no could-adopt claim stands without the way to act on it
//   4. with no verification file, the tab renders as before, with no links
//
// Run from repo root: `npm test` (or `node tests/eacr_map_links.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const exhibits = [
  { exhibit_id: "MAPICI-DREB1-1-001|MAPICI-CREB1-1-001|MAPICI-ZZZ-1-001",
    exhibit_ids: ["MAPICI-CREB1-1-001", "MAPICI-DREB1-1-001", "MAPICI-ZZZ-1-001"],
    title: "California Real Estate Broker License", unified_title: "California Real Estate Broker License",
    issuing_agency: "California DRE", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative", adopters: 1, adopter_names: ["College A"],
    potential: 1, potential_names: ["College B"], credit_recs: [{ course: "RE 1", credit: "3 hours in Real Estate Principles" }] }
];
const VERIFIED = { checked_at: "2026-10-26T23:30Z", found: {
  "MAPICI-CREB1-1-001": { title: "CA Real Estate Broker", map_id: 63210, college: "West Los Angeles College", college_id: 115 },
  "MAPICI-DREB1-1-001": { title: "DRE Real Estate Broker v1", map_id: 56398, college: "Saddleback College", college_id: 16 } } };

function boot(withVerified) {
  const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CPL_STATEWIDE_PRESCRIPTIVE = { "California Real Estate Broker License":
    { n_colleges: 1, colleges: [{ college: "College B", courses: [{ subject: "RE", number: "10", units: 3 }] }] } };
  window.CCC_COLLEGE_LOOKUP = { "College A": { district: "D1", swRegion: "R1" }, "College B": { district: "D2", swRegion: "R2" } };
  window.cplCollegeShort = function (n) { return { "Saddleback College": "Saddleback", "West Los Angeles College": "West LA" }[n] || n; };
</script></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const w = dom.window;
  w.fetch = (url) => Promise.resolve(/map_cpl_opportunities_verified\.json$/.test(String(url))
    ? (withVerified ? { ok: true, status: 200, json: () => Promise.resolve(VERIFIED) } : { ok: false, status: 404, json: () => Promise.resolve(null) })
    : { ok: true, status: 200, json: () => Promise.resolve([]) });
  let threw = false;
  try { w.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
  return { w, threw };
}

const A = boot(true), B = boot(false);
check("init does not throw", !A.threw && !B.threw);

setTimeout(() => {
  const doc = A.w.document;
  const card = doc.querySelector(".cv-credential");
  const ex = card && card.querySelector(".cv-ex");
  const chips = ex ? Array.from(ex.querySelectorAll("a.sw-map-chip")) : [];
  check("each verified exhibit ID in the aligned list carries one chip", chips.length === 2);
  const west = chips.find((a) => /West LA/.test(a.textContent));
  const sadd = chips.find((a) => /Saddleback/.test(a.textContent));
  check("a chip opens MAP searched for its own ID",
    west && west.getAttribute("href") === "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses?Exhibit=MAPICI-CREB1-1-001&View=Non-Military" &&
    sadd && sadd.getAttribute("href") === "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses?Exhibit=MAPICI-DREB1-1-001&View=Non-Military");
  check("the chip sits beside its own ID",
    sadd && sadd.previousElementSibling && sadd.previousElementSibling.textContent === "MAPICI-DREB1-1-001");
  check("a chip names the builder in full for a screen reader",
    sadd && /\(built by Saddleback College; opens MAP searched for MAPICI-DREB1-1-001\)/.test(sadd.textContent));
  check("a chip opens MAP in a new tab", sadd && sadd.getAttribute("target") === "_blank" && /noopener/.test(sadd.getAttribute("rel")));
  check("an ID MAP did not list gets no link", !doc.querySelector('a.sw-map-chip[href*="MAPICI-ZZZ-1-001"]'));
  const rx = card && card.querySelector(".cv-rx");
  check("the could-adopt block carries the line of MAP chips",
    rx && /Request Quick Adopt in MAP, from the exhibit each college built/.test(rx.textContent) && rx.querySelectorAll("a.sw-map-chip").length === 2);

  const tab = doc.querySelector('.sw-subtab[data-view="table"]');
  if (tab) tab.dispatchEvent(new A.w.MouseEvent("click", { bubbles: true }));
  const tbl = doc.getElementById("sw-tbody");
  check("the table's Could Adopt column carries the MAP chips",
    tbl && tbl.querySelectorAll(".sw-could-group").length > 0 && tbl.querySelectorAll(".sw-map-line a.sw-map-chip").length === 2);

  const docB = B.w.document;
  check("with no verification file the tab renders with no MAP links",
    !!docB.querySelector(".cv-credential") && !docB.querySelector("a.sw-map-chip"));
  check("the chip is a 24px target with an underline",
    /\.sw-map-chip\{[^}]*min-height:24px;[^}]*text-decoration:underline;/.test(src));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 150);
