// KPI card shelf (kpi_cards.js) — per-browser hide + centered title row +
// per-card collapse for the headline KPI grid (Session 86, SkyGuy).
//
// Guards: (a) Rule 4 (both HTMLs identical) + the <script> tag loaded once,
// right after kpi_reorder.js; (b) manageCard wraps the metric+label into a
// centered .kc-head and the rest into a collapsible .kc-body, leaving non-card
// full-width panels alone; (c) cards default to COLLAPSED (top half only);
// (d) toggle/hide/restore + Expand-all/Collapse-all persist per-browser in
// localStorage and round-trip across a fresh init (regen-safe re-match by label).
//
// Run from repo root: `npm test` (or `node tests/kpi_cards.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
const tag = '<script src="kpi_cards.js"></script>';
check("kpi_cards.js script tag present exactly once", cpl.split(tag).length === 2);
check("kpi_cards.js loads right after kpi_reorder.js",
  cpl.indexOf('<script src="kpi_reorder.js"></script>') < cpl.indexOf(tag) &&
  cpl.indexOf(tag) < cpl.indexOf('<script src="first_light.js"></script>'));

// ── Part B — behavior in jsdom ──
const SRC = fs.readFileSync("kpi_cards.js", "utf8");

const SECTION =
  '<div class="kpi-section-wrapper" id="kpiSectionWrapper">' +
  '<div class="kpi-section-header"><span class="kpi-section-title">KPI Metrics</span></div>' +
  '<div class="kpi-section">' +
    '<div class="kpi-card"><div class="kpi-number">48,158</div>' +
      '<div class="kpi-label">Cumulative CPL Students</div>' +
      '<div class="kpi-breakdowns"><div class="kpi-bd-row">Military</div></div>' +
      '<details class="algo-details"><summary>How this is calculated</summary></details></div>' +
    '<div class="kpi-card"><div class="kpi-number">$1.3B</div>' +
      '<div class="kpi-label">20-Year Impact</div></div>' +
    '<div class="kpi-trends-panel" style="grid-column:1/-1">Trends (not a card)</div>' +
  '</div></div>';

function dom() {
  return new JSDOM("<!doctype html><html><head></head><body>" + SECTION + "</body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
}

// (b) manageCard wraps head/body; (c) defaults collapsed; non-card untouched
{
  const d = dom();
  d.window.eval(SRC);
  d.window.CPL_KPI_CARDS.init();
  const doc = d.window.document;
  const card1 = doc.querySelectorAll(".kpi-card")[0];
  check("metric (.kpi-number) lives in the centered .kc-head",
    !!card1.querySelector(".kc-head > .kpi-number"));
  check("label (.kpi-label) lives in the .kc-head",
    !!card1.querySelector(".kc-head > .kpi-label"));
  check("breakdowns moved into the collapsible .kc-body",
    !!card1.querySelector(".kc-body > .kpi-breakdowns"));
  check("'How this is calculated' moved into the .kc-body",
    !!card1.querySelector(".kc-body > .algo-details"));
  check("card carries a hide × control", !!card1.querySelector(".kc-hide"));
  check("card defaults to COLLAPSED (only the title row shows)",
    card1.classList.contains("kc-collapsed"));
  // The full-width Trends panel is NOT a .kpi-card → never managed.
  const trends = doc.querySelector(".kpi-trends-panel");
  check("non-card full-width panel is left untouched",
    !trends.classList.contains("kc-managed") && !trends.querySelector(".kc-head"));
  // Toolbar inserted above the grid.
  const grid = doc.querySelector(".kpi-section");
  check("toolbar bar inserted before the grid",
    grid.previousElementSibling && grid.previousElementSibling.classList.contains("kc-bar"));
  check("toolbar offers an Expand-all toggle (all collapsed by default)",
    /Expand all/.test(grid.previousElementSibling.textContent));
}

// toggle a card open → persists; collapse-all + expand-all
{
  const d = dom();
  d.window.eval(SRC);
  const api = d.window.CPL_KPI_CARDS;
  api.init();
  const doc = d.window.document;
  const card1 = doc.querySelectorAll(".kpi-card")[0];
  api.toggleCard(card1);
  check("toggleCard expands the card", !card1.classList.contains("kc-collapsed"));
  check("expanded state persisted to localStorage",
    JSON.parse(d.window.localStorage.getItem(api.KEY)).expanded.length === 1);
  // setAll(true) expands every visible card
  api.setAll(true);
  const allOpen = [...doc.querySelectorAll(".kpi-card")].every((c) => !c.classList.contains("kc-collapsed"));
  check("Expand all opens every card", allOpen);
  // setAll(false) collapses every card + clears the saved expanded set
  api.setAll(false);
  const allClosed = [...doc.querySelectorAll(".kpi-card")].every((c) => c.classList.contains("kc-collapsed"));
  check("Collapse all closes every card", allClosed);
  check("Collapse all clears the persisted expanded set",
    JSON.parse(d.window.localStorage.getItem(api.KEY)).expanded.length === 0);
}

// hide a card → persists + leaves the grid; restore brings it back
{
  const d = dom();
  d.window.eval(SRC);
  const api = d.window.CPL_KPI_CARDS;
  api.init();
  const doc = d.window.document;
  const card1 = doc.querySelectorAll(".kpi-card")[0];
  const key = api.cardKey(card1);
  api.hideCard(card1);
  check("hideCard hides the card (kc-hidden)", card1.classList.contains("kc-hidden"));
  check("hidden state persisted", JSON.parse(d.window.localStorage.getItem(api.KEY)).hidden.indexOf(key) !== -1);
  check("toolbar shows a Hidden (N) tray button", /Hidden \(1\)/.test(doc.querySelector(".kc-bar").textContent));
  api.restore(key);
  check("restore un-hides the card", !card1.classList.contains("kc-hidden"));
  check("restore clears the persisted hidden entry",
    JSON.parse(d.window.localStorage.getItem(api.KEY)).hidden.length === 0);
}

// regen-safe: saved state re-applies by label text on a fresh init
{
  const d = dom();
  d.window.eval(SRC);
  const api = d.window.CPL_KPI_CARDS;
  // Pre-seed: 1st card hidden, 2nd card expanded — keyed by label text.
  d.window.localStorage.setItem(api.KEY, JSON.stringify({
    hidden: ["cumulative cpl students"], expanded: ["20-year impact"]
  }));
  api.init();
  const doc = d.window.document;
  const cards = doc.querySelectorAll(".kpi-card");
  check("saved HIDDEN re-applies across a regen (by label)", cards[0].classList.contains("kc-hidden"));
  check("saved EXPANDED re-applies across a regen (by label)", !cards[1].classList.contains("kc-collapsed"));
}

// ─── mobile: the grid must be able to collapse (S248) ────────────────────────
// ⚠️ jsdom CANNOT see this — it returns zeroes for every rectangle — so these are
// SOURCE assertions, and `npm run a11y cobi` is what actually measures it. They
// exist because the failure is invisible in review and catastrophic on a phone.
//
// Two of .kpi-section's fifteen grid items are NOT KPI cards: the KPI Trends and
// College Activity blocks, each wrapping a ~1210px table. A grid item's default
// min-width:auto floors the track at its min-content, so at 390px the single 1fr
// column could not shrink below 1261.56px and EVERY CARD INHERITED THAT WIDTH —
// the page scrolled sideways by 888px and the card labels ran off the right edge
// (Sam's screenshot, 2026-09-09). The overflow-x:auto scrollers on those tables
// were already present and were doing NOTHING, because the box they were meant to
// constrain was itself 1262px. Measured after: track 358px, page 1278 -> 390.
// ⚠️ STRIP CSS COMMENTS FIRST. The comment written beside each of these fixes
// NAMES the defect it prevents ("minmax(500px, ...) is a HARD floor"), so a
// scanner that reads comments reports the explanation as the offence. This fired
// on its very first run. Same family as the spelling rule that has to write the
// wrong form in a code span to survive its own lint.
const decommented = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "");
for (const [name, raw] of [["CPL_Dashboard.html", cpl], ["index.html", idx]]) {
  const src = decommented(raw);
  check(name + ": .kpi-section > * sets min-width:0 so the track can collapse",
    /\.kpi-section\s*>\s*\*\s*\{[^}]*min-width:\s*0/.test(src));
  // A hard px floor on a flex/grid item is the same bug spelled differently: it
  // cannot go under that width, so anything above a phone's ~358px content box
  // forces sideways scroll. min(Npx, 100%) keeps the desktop intent.
  const hardFloors = (src.match(/min-width:\s*(\d{3,})px/g) || [])
    .filter((m) => parseInt(m.match(/(\d+)/)[1], 10) >= 330);
  check(name + ": no hard min-width floor >= 330px (use min(Npx, 100%))"
    + (hardFloors.length ? " -> " + hardFloors.join(", ") : ""), hardFloors.length === 0);
  // minmax()'s first argument is a floor too, and repeat(auto-fit, minmax(500px, 1fr))
  // on a 390px screen produces a 500px track.
  const hardTracks = (src.match(/minmax\(\s*(\d{3,})px/g) || [])
    .filter((m) => parseInt(m.match(/(\d+)/)[1], 10) >= 400);
  check(name + ": no minmax() track floor >= 400px"
    + (hardTracks.length ? " -> " + hardTracks.join(", ") : ""), hardTracks.length === 0);
}

let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}

console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
