// EACR adoption matrix — the third sub-tab (2026-08-17).
//
// Sam's Excel pivot on live MAP data: common exhibit titles down the side,
// colleges across the top, credit-recommendation units in the cells. Four of
// his rulings are INPUTS to the build, and each one is a way this view could
// go quietly wrong, so each gets a check that fails if it is undone:
//
//  1. THE BROWN NUMBER IS THE PEER BENCHMARK, NEVER `rec_units_total`. This is
//     the one that matters. 83% of adoptions are partial (a college claims a
//     median 3.07 of 9.26 available recommendation lines) and NO college has
//     ever reached the line total, so brown 36.0 on AP Biology would promise
//     roughly triple what the strongest college in California has ever got —
//     in a column that leaves this tab as a CSV and reaches a dean by email.
//     The fixture below sets rec_units_total to a value that appears NOWHERE
//     else, so if anyone ever wires brown back to it, a check says so by name.
//  2. Columns open on COLLEGES; district/region drill-down is the existing
//     filter bar narrowing the column set.
//  3. Rows default to credentials with >= 2 adopting colleges.
//  4. Brown lands on CREDIBLE cells only — a NON-adopter gets a number only
//     where the M-ID *likely* layer already names a course it teaches that maps
//     to the credential. Brown on every non-adopter would assert that every
//     college in California should adopt every credential.
//
// Plus the two structural facts the design is built on:
//  - 118 numeric columns is ~3,500px, about twice a desktop, so the geometry
//    (frozen title column, rotated short-caps headers, h-scroll) IS the design.
//  - The payload and the prescriptive layer are generated separately and spell
//    colleges differently. Both sides resolve through cplCollegeShort(), so a
//    brown cell can never miss its column because two generators disagreed.
//
// And the standing a11y expectation on this tab (WCAG 1.4.1): the opportunity
// figure is PARENTHESISED as well as brown, so it survives colour-blindness,
// forced colours and a printout.
//
// Run from repo root: `npm test` (or `node tests/eacr_matrix.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");
const shortNamesSrc = fs.readFileSync("college_short_names.js", "utf8");
const rosterRules = JSON.parse(
  fs.readFileSync("kb/reference/map_college_roster_rules.json", "utf8"));

// The mojibake spelling, escaped rather than typed: writing it literally invites
// this very file to be re-encoded and the fixture to stop reproducing the bug.
const CANADA = "Ca\u00f1ada College";              // canonical — map_colleges id 25
const CANADA_MOJI = "Ca\u00c3\u00b1ada College";   // the same name, latin-1 → UTF-8

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
// val() guards the CHECK; the drivers below are the other half. A driver that
// throws on a missing element takes the whole run down, and a verification pass
// that reports nothing is indistinguishable from one that passes.
function val(fn) { try { return fn(); } catch (e) { return undefined; } }

// ── Fixture ───────────────────────────────────────────────────────────────
// Real college names, because the short-name resolver is part of what is under
// test — the rotated headers only fit because they carry short caps.
//
// AP Biology: three adopters with DELIBERATELY uneven units, so the merged peer
// median is a number that is not any single card's and the partial-adopter gap
// is non-zero and checkable:
//     Chaffey 1 · Riverside 4 · Norco 12  →  median 4, max 12
//   → Chaffey is a partial adopter: 4 − 1 = a gap of 3.
//   → Riverside sits exactly at the median: no gap, no brown.
//   → Norco is above it: no brown (and never a negative number).
// rec_units_total is 36 — the line total, which must appear NOWHERE.
const exhibits = [
  { exhibit_id: "apbio-1", exhibit_ids: ["MAPSAS-AB-1-001", "MAPCXO-BA-1-001"],
    title: "AP Biology", unified_title: "AP Biology", issuing_agency: "College Board",
    is_classified: true, cpl_type: "Credit by Exam", collaborative_type: "CCC Collaborative",
    adopters: 3, adopter_names: ["Chaffey College", "Norco College", "Riverside City College"],
    adopter_units: { "Chaffey College": 1, "Norco College": 12, "Riverside City College": 4 },
    adopter_lines: { "Chaffey College": 1, "Norco College": 3, "Riverside City College": 1 },
    peer_units_median: 4, peer_units_max: 12, rec_units_total: 36,
    // Citrus is the control: a non-adopter the M-ID layer does NOT name, so it
    // must stay blank. Palomar is a non-adopter on THIS card but an adopter on
    // the second one, which is what makes the row-grain merge checkable.
    potential: 6, potential_names: ["Moreno Valley College", "Palomar College",
      "Citrus College", "North Orange Continuing Education", "Norco College",
      "CA MAP INITIATIVE COLLEGE"],
    raw_titles: ["AP Biology"], credit_recs: [{ course: "BIO 100", credit: "4 hours in Biology" }] },
  // A second card folding under the SAME common title, with an adopter the first
  // card does not carry — the row grain is the title, so the matrix must merge.
  { exhibit_id: "apbio-2", exhibit_ids: ["MAPSAH-AB(1-1-001"],
    title: "AP Biology (Local)", unified_title: "AP Biology", issuing_agency: "College Board",
    is_classified: true, cpl_type: "Credit by Exam", collaborative_type: "Local",
    adopters: 1, adopter_names: ["Palomar College"],
    adopter_units: { "Palomar College": 4 }, adopter_lines: { "Palomar College": 1 },
    peer_units_median: 4, peer_units_max: 4, rec_units_total: 4,
    potential: 0, potential_names: [],
    raw_titles: ["AP Bio local"], credit_recs: [{ course: "BIO 101", credit: "4 hours in Biology" }] },
  // ONE adopter → below the default row threshold, reachable at "1 adopter".
  { exhibit_id: "solo-1", exhibit_ids: ["MAPICI-SOLO-1-001"],
    title: "CompTIA Linux+", unified_title: "CompTIA Linux+", issuing_agency: "CompTIA",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "CCC Collaborative",
    adopters: 1, adopter_names: ["Chaffey College"],
    adopter_units: { "Chaffey College": 3 }, adopter_lines: { "Chaffey College": 1 },
    peer_units_median: 3, peer_units_max: 3, rec_units_total: 20.5,
    potential: 1, potential_names: ["Palomar College"],
    raw_titles: ["CompTIA Linux+"], credit_recs: [{ course: "CIS 50", credit: "3 hours in CIS" }] },
];

// The prescriptive (M-ID *likely*) layer — the brown-cell gate. Note the
// spellings: this file is generated by a DIFFERENT pass than the exhibits
// payload and still carries the unfolded " Credit" twin. It must land on the
// same column as "North Orange Continuing Education", not create a second one.
const prescriptive = {
  "AP Biology": { n_colleges: 3, withheld: 0, colleges: [
    { college: "Moreno Valley College", courses: [{ subject: "BIO", number: "1", units: 4 }] },
    { college: "North Orange Continuing Education Credit", courses: [{ subject: "BIO", number: "2", units: 4 }] },
    // Already an adopter — must NOT be double-counted as an opportunity.
    { college: "Norco College", courses: [{ subject: "BIO", number: "3", units: 4 }] },
  ] },
};

const lookup = {
  "Chaffey College": { district: "Chaffey CCD", swRegion: "Inland Empire/Desert" },
  "Norco College": { district: "Riverside CCD", swRegion: "Inland Empire/Desert" },
  "Riverside City College": { district: "Riverside CCD", swRegion: "Inland Empire/Desert" },
  "Moreno Valley College": { district: "Riverside CCD", swRegion: "Inland Empire/Desert" },
  "Palomar College": { district: "Palomar CCD", swRegion: "San Diego/Imperial" },
  "Citrus College": { district: "Citrus CCD", swRegion: "Los Angeles" },
  "North Orange Continuing Education": { district: "North Orange CCD", swRegion: "Orange County" },
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CPL_STATEWIDE_PRESCRIPTIVE = ${JSON.stringify(prescriptive)};
  window.CCC_COLLEGE_LOOKUP = ${JSON.stringify(lookup)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
const blobs = [];
window.URL.createObjectURL = function (b) { blobs.push(b); return "blob:stub"; };
window.URL.revokeObjectURL = function () {};
window.alert = function () {};
// The short-name resolver loads AFTER the tab in the real page; the tab looks it
// up lazily at call time. Load it the same way round.
try { window.eval(src); } catch (e) { console.error("init threw:", e); }
try { window.eval(shortNamesSrc); } catch (e) { console.error("short names threw:", e); }

const doc = window.document;

// ── Null-safe drivers ─────────────────────────────────────────────────────
function click(el) {
  if (!el || !el.dispatchEvent) return false;
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  return true;
}
function pick(sel) {
  const r = doc.querySelector(sel);
  if (!r) return false;
  r.checked = true;
  r.dispatchEvent(new window.Event("change", { bubbles: true }));
  return true;
}
function showMatrix() { return click(doc.querySelector('.sw-subtab[data-view="matrix"]')); }
const headers = () => Array.from(doc.querySelectorAll(".mx-table thead th.mx-col"));
const headerCaps = () => headers().map((h) => (h.textContent || "").trim());
const bodyRows = () => Array.from(doc.querySelectorAll(".mx-table tbody tr")).filter((tr) => tr.querySelector("th.mx-row"));
const rowTitles = () => bodyRows().map((tr) => (tr.querySelector(".mx-rtitle").textContent || "").trim());
function rowFor(title) {
  return bodyRows().find((tr) => ((tr.querySelector(".mx-rtitle") || {}).textContent || "").trim() === title);
}
// A cell by (row title, college full name) — resolved through the HEADER, so
// the check reads the grid the way a person does and cannot drift from it.
function cell(title, collegeFull) {
  const tr = rowFor(title);
  if (!tr) return undefined;
  const i = headers().findIndex((h) => {
    const a = h.querySelector("abbr");
    return a && a.getAttribute("title") === collegeFull;
  });
  if (i < 0) return undefined;
  return tr.querySelectorAll("td.mx-cell")[i];
}
const cellText = (t, c) => ((cell(t, c) || {}).textContent || "").trim();

setTimeout(function () {
  try { run(); }
  catch (e) {
    check("the harness ran to completion (it threw: " + e.message + ")", false);
    report();
  }
}, 80);

function run() {
  // ── 1. The sub-tab exists and is a complete tab, like its two siblings ───
  check("a third sub-tab is declared", !!doc.querySelector('.sw-subtab[data-view="matrix"]'));
  check("...it is type=button (it must not submit anything)",
    val(() => doc.querySelector('.sw-subtab[data-view="matrix"]').getAttribute("type")) === "button");
  check("...pointing at a real tabpanel via aria-controls",
    val(() => doc.getElementById(doc.querySelector('.sw-subtab[data-view="matrix"]')
      .getAttribute("aria-controls")).getAttribute("role")) === "tabpanel");
  check("...which is labelled by the tab",
    val(() => doc.getElementById("sw-view-matrix").getAttribute("aria-labelledby")) === "sw-tab-matrix");
  check("the matrix panel is hidden while another view is active",
    val(() => doc.getElementById("sw-view-matrix").hidden) === true);
  check("...and the matrix does not build while hidden",
    /state\.view === "matrix"/.test(src));

  check("the matrix tab can be activated", showMatrix());
  check("...which un-hides its panel",
    val(() => doc.getElementById("sw-view-matrix").hidden) === false);
  check("...and hides the other two",
    val(() => doc.getElementById("sw-view-credentials").hidden) === true
    && val(() => doc.getElementById("sw-view-table").hidden) === true);
  check("the grid renders", !!doc.querySelector(".mx-table"));

  // ── 2. Ruling 3 — the default row bound ──────────────────────────────────
  check("rows default to credentials with >= 2 adopting colleges",
    val(() => rowTitles().join("|")) === "AP Biology");
  check("...so a single-adopter credential is out by default",
    val(() => rowTitles().indexOf("CompTIA Linux+")) === -1);
  check("the threshold control offers 1 adopter", !!doc.querySelector('.mx-min-radio[value="1"]'));
  check("...and lowering it brings the single-adopter row in",
    pick('.mx-min-radio[value="1"]') && val(() => rowTitles().indexOf("CompTIA Linux+")) >= 0);
  check("...without disturbing the other views' pagination",
    val(() => window.document.getElementById("sw-status")) === null
    || !/NaN/.test(val(() => doc.getElementById("sw-status").textContent) || ""));
  pick('.mx-min-radio[value="2"]');
  check("restoring the threshold restores the default row set",
    val(() => rowTitles().join("|")) === "AP Biology");

  // ── 3. Ruling 2 — columns are colleges, and the axis is the payload's ────
  // Seven names reach the payload; the MAP sandbox org is not one of the six
  // that become columns... and the " Credit" twin folds onto its sibling, so
  // the axis is Chaffey · Citrus · Moreno Valley · Norco · North Orange ·
  // Palomar · Riverside City = 7.
  check("every real college in the payload gets a column", headers().length === 7);
  check("...the MAP sandbox org is NOT one of them",
    !headerCaps().some((t) => /MAP INITIATIVE/i.test(t))
    && !headers().some((h) => /MAP INITIATIVE/i.test(h.querySelector("abbr").getAttribute("title") || "")));
  check("headers carry SHORT CAPS, which is what makes them fit",
    headerCaps().indexOf("CHAFFEY") >= 0 && headerCaps().indexOf("RIVERSIDE") >= 0);
  check("...and no header falls back to a long raw name",
    headerCaps().every((t) => t.length > 0 && t.length <= 20));
  check("headers are <abbr>, so AT gets the full college name",
    headers().every((h) => {
      const a = h.querySelector("abbr");
      return a && a.tagName === "ABBR" && (a.getAttribute("title") || "").length > 0;
    }));
  check("column headers are scoped to their column",
    headers().every((h) => h.getAttribute("scope") === "col"));
  check("row headers are <th scope=row>, not a plain cell",
    bodyRows().every((tr) => {
      const th = tr.querySelector("th.mx-row");
      return th && th.tagName === "TH" && th.getAttribute("scope") === "row";
    }));

  // ── 4. THE RULING THAT MATTERS — brown is the peer benchmark ─────────────
  // Merged over both AP Biology cards the units are 1 · 4 · 4 · 12, so the peer
  // median is 4 and the best adopter is 12. The credential's LINE TOTAL is 36.
  check("green = the units a college has actually articulated",
    cellText("AP Biology", "Norco College").indexOf("12") === 0);
  check("a college at the peer median carries no opportunity figure",
    cellText("AP Biology", "Riverside City College") === "4");
  check("a PARTIAL adopter shows both: what it has, and the gap to its peers",
    /^1\s*\(3\)$/.test(cellText("AP Biology", "Chaffey College")));
  check("...and an ABOVE-median adopter is never shown a negative gap",
    !/\(/.test(cellText("AP Biology", "Norco College")));
  const allCells = () => Array.from(doc.querySelectorAll(".mx-table td.mx-cell"))
    .map((td) => (td.textContent || "").trim()).join(" ");
  check("⭐ the line total (36) appears in NO cell — brown is not rec_units_total",
    val(() => allCells().indexOf("36") === -1));
  check("...and the row meta publishes the peer median and the best adopter",
    /peer median 4u/.test(val(() => rowFor("AP Biology").querySelector(".mx-rmeta").textContent) || "")
    && /best 12u/.test(val(() => rowFor("AP Biology").querySelector(".mx-rmeta").textContent) || ""));
  check("the peer median is recomputed at the ROW grain, not lifted from a card",
    /matrixRows[\s\S]{0,1400}vals\[mid - 1\]/.test(src));

  // ── 5. Ruling 4 — brown only where it is credible ────────────────────────
  check("a non-adopter the M-ID layer names DOES get an opportunity figure",
    cellText("AP Biology", "Moreno Valley College") === "(4)");
  check("⭐ a non-adopter the M-ID layer does NOT name gets no number at all",
    cellText("AP Biology", "Citrus College") !== "" &&
    !/\d/.test(cellText("AP Biology", "Citrus College")));
  check("...it reads as an explicit 'no signal' mark, not an empty cell",
    cellText("AP Biology", "Citrus College") === "·");
  // The row grain is the common TITLE: Palomar adopts only on the second card,
  // and must still read as an adopter of AP Biology rather than an opportunity.
  check("an adopter carried by a SECOND card under the same title still reads green",
    cellText("AP Biology", "Palomar College") === "4");

  // ── 6. Two generators, one column ────────────────────────────────────────
  // The prescriptive layer says "North Orange Continuing Education Credit";
  // the payload says "North Orange Continuing Education". One column, and the
  // brown cell lands on it.
  check("⭐ an unfolded ' Credit' twin does not create a second column",
    headers().filter((h) => /NORTH ORANGE/i.test(h.querySelector("abbr").getAttribute("title") || "")
      || /NORTH ORANGE/i.test(h.textContent || "")).length === 1);
  check("...and its opportunity cell still lands, resolved through the short-name folder",
    cellText("AP Biology", "North Orange Continuing Education") === "(4)");
  check("a college that has already adopted is never ALSO an opportunity",
    !/\(/.test(cellText("AP Biology", "Norco College")));

  // ── 7. WCAG 1.4.1 — meaning never carried by colour alone ────────────────
  check("⭐ the opportunity figure is PARENTHESISED, not just brown",
    /\(4\)/.test(cellText("AP Biology", "Moreno Valley College")));
  check("the legend states both meanings in words",
    /adopted — credit-recommendation units/i.test(val(() => doc.querySelector(".mx-key").textContent) || "")
    && /opportunity — units the median adopting peer obtained/i
      .test(val(() => doc.querySelector(".mx-key").textContent) || ""));
  check("each inked cell carries a per-cell explanation naming the college",
    /Chaffey College/.test(val(() => cell("AP Biology", "Chaffey College").getAttribute("title")) || ""));
  check("...which says what the parenthesised half means",
    /peers here reach/.test(val(() => cell("AP Biology", "Chaffey College").getAttribute("title")) || ""));
  check("the table has a caption describing the two colours",
    /median adopting peer/i.test(val(() => doc.querySelector(".mx-table caption").textContent) || ""));
  check("...visually hidden through a NAMESPACED class (.sr-only is not on this page)",
    val(() => doc.querySelector(".mx-table caption").className) === "mx-sr-only"
    && /\.mx-sr-only\{position:absolute/.test(src));

  // ── 8. The geometry that makes 118 columns possible at all ───────────────
  check("the grid is a scrollable, labelled, focusable region",
    val(() => doc.querySelector(".mx-box").getAttribute("role")) === "region"
    && !!val(() => doc.querySelector(".mx-box").getAttribute("aria-label"))
    && val(() => doc.querySelector(".mx-box").getAttribute("tabindex")) === "0");
  check("the title column is frozen (sticky left) in BOTH the corner and the rows",
    /th\.mx-corner\{position:sticky;left:0/.test(src) && /th\.mx-row\{position:sticky;left:0/.test(src));
  check("the header row is frozen (sticky top)", /th\.mx-col\{height:132px;vertical-align:bottom;position:sticky;top:0/.test(src));
  check("...and the corner outranks both, so it cannot be scrolled under",
    /th\.mx-corner\{position:sticky;left:0;top:0;z-index:5/.test(src));
  check("column headers are rotated so a 34px column can carry a name",
    /transform:rotate\(-60deg\)/.test(src));
  check("rotation is presentation only — the text stays upright in the DOM",
    val(() => headers()[0].querySelector("abbr").textContent.trim().length) > 0);
  check("the matrix ships mobile rules for the frozen column",
    /\.mx-table thead th\.mx-corner,\.mx-table tbody th\.mx-row\{min-width:180px/.test(src));
  check("forced colours keeps the sticky panes opaque",
    /\.mx-table thead th\.mx-col,\.mx-table thead th\.mx-corner,\.mx-table tbody th\.mx-row\{background:Canvas;\}/.test(src));
  check("the matrix radios stay focusable (opacity, never display:none)",
    /\.mx-seg input\{position:absolute;opacity:0/.test(src) && !/\.mx-seg input\{[^}]*display:none/.test(src));
  check("the density is published, so the reader knows how sparse the grid is",
    /% inked/.test(val(() => doc.querySelector(".mx-stats").textContent) || ""));

  // ── 9. The cell-contents control ─────────────────────────────────────────
  check("switching to 'Opportunity only' drops the adopted numbers",
    pick('.mx-cells-radio[value="opp"]')
    && cellText("AP Biology", "Norco College") === "·"
    && cellText("AP Biology", "Moreno Valley College") === "(4)");
  check("switching to 'Adopted only' drops the opportunity figures",
    pick('.mx-cells-radio[value="got"]')
    && cellText("AP Biology", "Chaffey College") === "1"
    && cellText("AP Biology", "Moreno Valley College") === "·");
  pick('.mx-cells-radio[value="both"]');
  check("...and 'Both' restores them", /^1\s*\(3\)$/.test(cellText("AP Biology", "Chaffey College")));

  // ── 10. The folded MAP exhibit IDs, per row ──────────────────────────────
  const disc = () => val(() => rowFor("AP Biology").querySelector(".mx-disc"));
  check("the row offers the folded MAP exhibit records", !!disc());
  check("...counting all three across BOTH cards under the common title",
    /3 exhibits/.test(val(() => disc().textContent) || ""));
  check("...declaring its collapsed state to AT", val(() => disc().getAttribute("aria-expanded")) === "false");
  check("clicking it reveals the exhibit IDs", click(disc())
    && /MAPSAS-AB-1-001/.test(val(() => doc.querySelector(".mx-exp").textContent) || ""));
  check("...and re-announces itself as expanded", val(() => disc().getAttribute("aria-expanded")) === "true");
  check("the disclosure row spans the whole grid",
    val(() => doc.querySelector(".mx-exp td").getAttribute("colspan")) === String(headers().length + 1));
  check("clicking again collapses it", click(disc()) && !doc.querySelector(".mx-exp"));

  // ── 11. Column drill-down reuses the college filter ──────────────────────
  // "System, regional or district level" — the existing filter bar narrows the
  // column axis. No second grain with its own roll-up arithmetic.
  check("the district filter narrows the COLUMNS", (function () {
    state_setFilter("district", ["Riverside CCD"]);
    const caps = headerCaps();
    return caps.length === 3 && caps.indexOf("CHAFFEY") === -1 && caps.indexOf("NORCO") >= 0;
  })());
  check("...and the rows survive the narrowing",
    val(() => rowTitles().join("|")) === "AP Biology");
  state_setFilter("district", []);
  check("clearing the filter restores every column", headers().length === 7);

  // ── 12. The export cannot disagree with the screen ───────────────────────
  // This tab has already shipped that defect once, one layer down, and the
  // export is the layer that reaches a college by email.
  check("the matrix offers its own CSV", !!doc.getElementById("mx-export-csv"));
  check("...which produces a blob", click(doc.getElementById("mx-export-csv")) && blobs.length > 0);
  blobs[blobs.length - 1].text().then(function (csv) {
    check("CSV leads with a provenance line saying what 'opportunity' means",
      /median units colleges that adopted this credential actually obtained/i.test(csv));
    check("⭐ ...and says explicitly that it is NOT the recommendation total",
      /NOT the credential's full recommendation total/i.test(csv));
    check("CSV names the college scope it was taken under", /College scope:/.test(csv));
    check("CSV records the row threshold it was taken under",
      /at least 2 adopting college/.test(csv));
    check("CSV splits adopted and opportunity into separate labelled columns",
      /Chaffey — adopted/.test(csv) && /Chaffey — opportunity/.test(csv));
    const apRow = csv.split("\n").find((l) => l.indexOf("AP Biology") === 0);
    check("CSV carries the row's peer median and best adopter", !!apRow && /^AP Biology,4,4,12,/.test(apRow));
    check("⭐ the CSV agrees with the grid cell-for-cell (both call matrixCell)",
      /exportMatrixCSV[\s\S]{0,2000}matrixCell\(r, c\.key, likely\)/.test(src));
    check("⭐ the line total never reaches the spreadsheet either",
      !/(^|,)36(,|$)/m.test(csv));
    checkRosterLayer();
    report();
  }, function (e) {
    check("the CSV blob could be read (" + e.message + ")", false);
    checkRosterLayer();
    report();
  });
}

// ── The identity layer BELOW the short-name resolver ──────────────────────
// The resolver folds two spellings to one label, which is why a duplicate
// Ca\u00f1ada column survived a whole day: every consumer counted these names
// THROUGH it, so the LABEL count read 118 over a 119-row axis. Resolving there
// is necessary but not sufficient — it makes identity a side effect of a
// function whose job is shortening headers, and it leaves no reviewable record
// of which colleges were folded and why.
//
// So the committed roster rules are the FIRST layer (explicit, listed, and read
// by the Python generator too) and the resolver is the second. These checks
// guard the first layer; `no two columns share a label` above guards that the
// second still catches anything the list has not caught yet.
function checkRosterLayer() {
  check("the roster-rules file carries the mojibake fold",
    !!rosterRules.fold.map[CANADA_MOJI]);
  check("...folding onto the canonical spelling map_colleges actually holds",
    rosterRules.fold.map[CANADA_MOJI] === CANADA);
  check("every fold target is itself a name, never another variant",
    Object.values(rosterRules.fold.map).every((v) => !(v in rosterRules.fold.map)));
  check("the view drops sandbox orgs by the rules file's list, not a stale copy",
    rosterRules.sandbox.names.every((n) => src.indexOf(n) !== -1));
  check("mxName() applies the roster fold BEFORE the short-name resolver",
    /function mxName[\s\S]{0,200}rosterName\(c\)[\s\S]{0,200}cplCollegeShort/.test(src));
  check("...and returns empty for a sandbox org so callers must drop it",
    /function mxName[\s\S]{0,160}if \(!n\) return "";/.test(src));
  check("the tripwire still expects 118 columns after the rules",
    rosterRules._expected_axis.after_rules === 118);
}

// Drive a multi-select filter the way the UI does, so the check exercises the
// real change handler rather than poking state directly.
function state_setFilter(key, values) {
  const group = doc.querySelector('.sw-filter-group[data-filter="' + key + '"]');
  if (!group) return false;
  group.querySelectorAll('.sw-filter-options input[type=checkbox]').forEach(function (cb) {
    cb.checked = values.indexOf(cb.value) >= 0;
  });
  const any = group.querySelector('.sw-filter-options input[type=checkbox]');
  if (any) any.dispatchEvent(new window.Event("change", { bubbles: true }));
  return true;
}

function report() {
  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
}