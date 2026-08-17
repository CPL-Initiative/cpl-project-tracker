// CER Adoption Matrix sub-tab — credentials down the side, colleges across the
// top, credit-recommendation units in the cells (Sam scoped it 2026-08-17).
//
// Sam's four rulings, each of which is a check below:
//   brown number   → the PEER BENCHMARK, not the line total
//   column grain   → colleges
//   default rows   → titles with ≥2 adopters
//   brown coverage → credible cells only (the M-ID "likely" tier)
//
// THE HEADLINE FAILURE MODE this guards. The natural reading of "units still
// available" is (line total − already claimed). Measured over the live payload:
// 83% of adoptions are PARTIAL (a median of 3.07 of 9.26 recommendation lines)
// and NO college has ever claimed a credential's full total. AP Biology carries
// 36 units where the median adopter gets 4 and the best in California gets 12.
// So the natural number would promise roughly 3× what the strongest peer has
// ever actually obtained — in a figure that leaves the screen as a CSV and
// reaches a college by email. `brownIsNotTheLineTotal` is the check that would
// catch a future refactor quietly restoring it.
//
// THE COLUMN-IDENTITY FAILURE MODE. One institution must never be two columns.
// Three ways that happens, all fixtured: a MAP sandbox org (must not be a column
// at all — it published 7 adopters on a real statewide card where the truth is
// 6), a " Credit"-suffixed duplicate spelling, and — found while building this —
// a MOJIBAKE duplicate, "CaÃ±ada College" being "Cañada College" read as latin-1.
// Both Cañada spellings are emitted by excel_to_dashboard.py on different paths,
// so the axis carried two Cañada columns with all the opportunities on one and
// the other empty. It was invisible because the only consumer resolving these
// names ran them through cplCollegeShort(), whose normalize() folds Ã± → n: the
// LABEL count read 118 while the axis under it was 119.
//
// Written against the failure modes. Verified against the pre-fix file.
//
// Run from repo root: `npm test` (or `node tests/eacr_matrix.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");
const rosterRules = JSON.parse(
  fs.readFileSync("kb/reference/map_college_roster_rules.json", "utf8"));

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
// A probe that throws must fail ITSELF, not silence the block it sits in.
function val(fn) { try { return fn(); } catch (e) { return undefined; } }
// ...and so must a DRIVER between checks. `val()` guards the assertions; a throw
// in the code that sets up the next one (dispatching on an element that does not
// exist pre-fix) skips every check after it and reports zero failures. Three
// harnesses in three days died this way — wrap the drivers too.
function drive(label, fn) { try { fn(); } catch (e) { check("driver ok: " + label, false); } }
function txt(el) { return (el && el.textContent || "").trim(); }

// The mojibake spelling, escaped rather than typed: writing it literally invites
// this very file to be re-encoded and the fixture to stop reproducing the bug.
const CANADA = "Cañada College";        // canonical — map_colleges id 25
const CANADA_MOJI = "CaÃ±ada College"; // the same name, latin-1 → UTF-8

// ── Fixture ────────────────────────────────────────────────────────────────
// "Widget Cert" is the pivot: TWO cards of ONE unified title (the CER grain), so
// College A's units must SUM across them and the pair must render as ONE row.
// Its rec_units_total (60) is deliberately far above what any adopter achieved
// (max 12) — that gap is what the headline check measures.
const exhibits = [
  { exhibit_id: "w1", exhibit_ids: ["w1"], title: "Widget Cert", unified_title: "Widget Cert",
    issuing_agency: "WidgetCo", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative",
    adopters: 3, adopter_names: ["College A", "College B", "College D"],
    adopter_units: { "College A": 4, "College B": 12, "College D": 2 },
    adopter_lines: { "College A": 1, "College B": 3, "College D": 1 },
    peer_units_median: 4, peer_units_max: 12, rec_units_total: 60,
    potential: 1, potential_names: ["College E"], raw_titles: ["Widget"],
    credit_recs: [{ course: "WID 1", credit: "4 hours in Widgetry" }] },
  // Second card of the SAME unified title — College A appears again (+2 units).
  { exhibit_id: "w2", exhibit_ids: ["w2"], title: "Widget Cert", unified_title: "Widget Cert",
    issuing_agency: "", is_classified: false, cpl_type: "Credit By Exam",
    collaborative_type: "Local",
    adopters: 1, adopter_names: ["College A"],
    adopter_units: { "College A": 2 }, adopter_lines: { "College A": 1 },
    peer_units_median: 2, peer_units_max: 2, rec_units_total: 60,
    potential: 0, potential_names: [], raw_titles: ["Widget local"], credit_recs: [] },
  // Single-card title — its recomputed median MUST equal the payload's figure.
  { exhibit_id: "g1", exhibit_ids: ["g1"], title: "Gadget Cert", unified_title: "Gadget Cert",
    issuing_agency: "GadgetCo", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative",
    adopters: 4, adopter_names: ["College A", "College B", "College D", CANADA],
    // Even count → median is the average of the two middle values (3 and 5 → 4).
    adopter_units: { "College A": 1, "College B": 3, "College D": 5, [CANADA]: 9 },
    adopter_lines: { "College A": 1, "College B": 1, "College D": 2, [CANADA]: 3 },
    peer_units_median: 4, peer_units_max: 9, rec_units_total: 30,
    potential: 0, potential_names: [], raw_titles: ["Gadget"], credit_recs: [] },
  // SINGLE adopter — excluded by default, included by the toggle.
  { exhibit_id: "s1", exhibit_ids: ["s1"], title: "Solo Cert", unified_title: "Solo Cert",
    issuing_agency: "SoloCo", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "Local", adopters: 1, adopter_names: ["College A"],
    adopter_units: { "College A": 7 }, adopter_lines: { "College A": 2 },
    peer_units_median: 7, peer_units_max: 7, rec_units_total: 20,
    potential: 0, potential_names: [], raw_titles: ["Solo"], credit_recs: [] },
  // The DUPLICATE-SPELLING card: one institution entered twice, plus the MAP
  // sandbox org counted as a real adopter.
  { exhibit_id: "f1", exhibit_ids: ["f1"], title: "Fold Cert", unified_title: "Fold Cert",
    issuing_agency: "FoldCo", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative",
    // Four raw spellings, THREE real colleges: the sandbox drops out and the two
    // North Orange spellings are one institution. College A is here so the row
    // still clears the ≥2 default after that collapse — which is the point of
    // `foldedAdopterCountIsReal` below.
    adopters: 4,
    adopter_names: ["North Orange Continuing Education",
                    "North Orange Continuing Education Credit",
                    "CA MAP INITIATIVE COLLEGE", "College A"],
    adopter_units: { "North Orange Continuing Education": 3,
                     "North Orange Continuing Education Credit": 5,
                     "CA MAP INITIATIVE COLLEGE": 99, "College A": 1 },
    adopter_lines: { "North Orange Continuing Education": 1,
                     "North Orange Continuing Education Credit": 2,
                     "CA MAP INITIATIVE COLLEGE": 9, "College A": 1 },
    peer_units_median: 5, peer_units_max: 99, rec_units_total: 40,
    potential: 0, potential_names: [], raw_titles: ["Fold"], credit_recs: [] }
];

// The prescriptive (M-ID "likely") layer — the ONLY source of brown cells.
// College F has NOT adopted Widget Cert but already teaches a mapping course, so
// it is the brown cell the headline check measures. The MOJIBAKE Cañada spelling
// is an opportunity on Widget Cert too and must land on the SAME column the
// canonical spelling uses in Gadget Cert. College A is listed here as well even
// though it ADOPTED Widget Cert — green must win that cell.
const prescriptive = {
  "Widget Cert": { n_colleges: 3, withheld: 0, colleges: [
    { college: "College F", courses: ["WID 5 Widget Basics"] },
    { college: CANADA_MOJI, courses: ["WID 9 Widget Studies"] },
    { college: "College A", courses: ["WID 1 Widgetry"] }
  ] },
  "Gadget Cert": { n_colleges: 1, withheld: 0, colleges: [
    { college: "College E", courses: ["GAD 2 Gadgetry"] }
  ] }
};

const lookup = {
  "College A": { district: "D1", swRegion: "R1" },
  "College B": { district: "D1", swRegion: "R1" },
  "College D": { district: "D2", swRegion: "R2" },
  "College E": { district: "D2", swRegion: "R2" }
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CPL_STATEWIDE_PRESCRIPTIVE = ${JSON.stringify(prescriptive)};
  window.CCC_COLLEGE_LOOKUP = ${JSON.stringify(lookup)};
  // Stub of college_short_names.js. The matrix must ASK for the "caps" style
  // (rotated headers pay for every character) and must fall back to the full
  // name for anything the resolver does not know — a blank column header is
  // indistinguishable from a college with no data.
  window.cplCollegeShort = function (name, style) {
    var map = { "College A": { short: "A Coll", caps: "A COLL" } };
    var r = map[name];
    if (!r) return name;
    return style === "caps" ? r.caps : r.short;
  };
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

const doc = window.document;
function showView(v) {
  const b = doc.querySelector('.sw-subtab[data-view="' + v + '"]');
  if (b) b.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}
function headerLabels() {
  return Array.from(doc.querySelectorAll(".mx-th")).map((e) => txt(e));
}
function headerTitles() {
  return Array.from(doc.querySelectorAll(".mx-th")).map((e) => e.getAttribute("title") || "");
}
function rowFor(title) {
  return Array.from(doc.querySelectorAll(".mx-table tbody tr")).find(
    (tr) => txt(tr.querySelector(".mx-title-text")) === title);
}
function rowTitles() {
  return Array.from(doc.querySelectorAll(".mx-table tbody .mx-title-text")).map((e) => txt(e));
}
// Cell for (row title, column full-name), located by the header's title attr so
// the lookup does not depend on short-name spelling.
function cellFor(title, collegeFull) {
  const tr = rowFor(title);
  if (!tr) return null;
  const idx = headerTitles().indexOf(collegeFull);
  if (idx < 0) return null;
  return tr.querySelectorAll(".mx-c")[idx];
}

setTimeout(runAssertions, 80);

function runAssertions() {
  // ── 1. The sub-tab exists and completes the ARIA pattern ─────────────────
  check("a third sub-tab renders", !!val(() => doc.querySelector('.sw-subtab[data-view="matrix"]')));
  check("there are now three sub-tabs", val(() => doc.querySelectorAll(".sw-subtab").length) === 3);
  check("the matrix tab controls a real panel",
    val(() => !!doc.getElementById(doc.querySelector('.sw-subtab[data-view="matrix"]')
      .getAttribute("aria-controls"))));
  check("the matrix panel is a tabpanel",
    val(() => doc.getElementById("sw-view-matrix").getAttribute("role")) === "tabpanel");
  check("the matrix panel is HIDDEN before it is selected",
    val(() => doc.getElementById("sw-view-matrix").hidden) === true);
  // Perf: ~51,000 cells must not be built while another view is showing.
  check("the matrix does NOT render until its tab is selected",
    val(() => doc.getElementById("sw-mx-body").innerHTML.trim()) === "");

  drive("select the matrix view", () => showView("matrix"));
  check("selecting the tab renders the matrix",
    !!val(() => doc.querySelector(".mx-table")));
  check("the matrix panel is visible once selected",
    val(() => doc.getElementById("sw-view-matrix").hidden) === false);
  check("selecting the matrix hides the credential view",
    val(() => doc.getElementById("sw-view-credentials").hidden) === true);
  check("the matrix tab reports itself selected",
    val(() => doc.querySelector('.sw-subtab[data-view="matrix"]').getAttribute("aria-selected")) === "true");

  // ── 2. THE HEADLINE — brown is the peer benchmark, not the line total ─────
  // College F has NOT adopted Widget Cert but already teaches WID 5, so its cell
  // is brown. Adopters got 12, 2 and (A, summed across two cards) 6 → median 6.
  // rec_units_total is 60. A cell showing anything near 60 is the defect.
  const brownB = val(() => cellFor("Widget Cert", "College F"));
  check("a likely non-adopter gets a brown cell", !!brownB && brownB.classList.contains("mx-brown"));
  check("the brown number is the PEER MEDIAN (6), not the line total (60)",
    txt(brownB) === "(6)");
  check("the brown number is nowhere near rec_units_total",
    !/60/.test(txt(brownB) || ""));
  check("brownIsNotTheLineTotal — no brown cell in the grid shows the line total",
    Array.from(doc.querySelectorAll(".mx-brown")).every((td) => !/\b60\b|\b30\b|\b40\b/.test(txt(td))));
  // WCAG 1.4.1 — the green/brown distinction must survive greyscale.
  check("brown is marked by PARENTHESES, not colour alone", /^\(\d/.test(txt(brownB) || ""));
  check("green cells carry a bare number (no parentheses)",
    Array.from(doc.querySelectorAll(".mx-green")).every((td) => !/[()]/.test(txt(td))));
  check("the legend explains the parentheses, not just the colour",
    /parenthes/i.test(val(() => txt(doc.querySelector(".mx-legend"))) || ""));
  check("the note says the number is what peers achieved",
    /peers actually got|median/i.test(val(() => txt(doc.querySelector(".mx-note"))) || ""));

  // ── 3. Green wins a contested cell ───────────────────────────────────────
  // College A both ADOPTED Widget Cert and appears in its prescriptive list.
  const cellA = val(() => cellFor("Widget Cert", "College A"));
  check("a college that adopted is GREEN even when the likely layer also lists it",
    !!cellA && cellA.classList.contains("mx-green") && !cellA.classList.contains("mx-brown"));
  check("a cell is never both adopted and an opportunity",
    Array.from(doc.querySelectorAll(".mx-c")).every(
      (td) => !(td.classList.contains("mx-green") && td.classList.contains("mx-brown"))));

  // ── 4. Row grain is the unified TITLE — two cards, one row, units summed ──
  check("the two Widget Cert cards render as ONE row",
    rowTitles().filter((t) => t === "Widget Cert").length === 1);
  check("a college's units SUM across the cards of one title (4 + 2 = 6)",
    txt(cellA) === "6");
  check("the row's adopter count is distinct COLLEGES, not cards",
    /\b3 adopted\b/.test(val(() => txt(rowFor("Widget Cert").querySelector(".mx-title-meta"))) || ""));

  // ── 5. Column identity — one institution is never two columns ────────────
  const labels = headerLabels(), titles = headerTitles();
  check("the MAP sandbox org is NOT a column",
    titles.indexOf("CA MAP INITIATIVE COLLEGE") === -1);
  check("the sandbox's units reach no cell",
    Array.from(doc.querySelectorAll(".mx-c")).every((td) => txt(td) !== "99"));
  check("the ' Credit' duplicate spelling is NOT its own column",
    titles.indexOf("North Orange Continuing Education Credit") === -1);
  check("the canonical spelling of the folded college IS a column",
    titles.indexOf("North Orange Continuing Education") !== -1);
  check("folding a duplicate spelling SUMS its units (3 + 5 = 8)",
    txt(val(() => cellFor("Fold Cert", "North Orange Continuing Education"))) === "8");
  // foldedAdopterCountIsReal — the count Sam sees must be INSTITUTIONS, not rows.
  // Fold Cert lists four adopter spellings; one is the sandbox and two are the
  // same college, so the honest count is 2. This is the same defect that
  // published 7 adopters on California Real Estate Broker License where the
  // truth was 6, and it is why the row's own meta line is asserted here rather
  // than the payload's `adopters` field.
  check("the adopter count reflects the fold and the sandbox drop (4 spellings → 2)",
    /\b2 adopted\b/.test(val(() => txt(rowFor("Fold Cert").querySelector(".mx-title-meta"))) || ""));
  // The mojibake pair — the defect found while building this view.
  check("the mojibake spelling is NOT its own column", titles.indexOf(CANADA_MOJI) === -1);
  check("the canonical Cañada spelling IS a column", titles.indexOf(CANADA) !== -1);
  check("Cañada appears exactly ONCE in the axis",
    titles.filter((t) => t === CANADA || t === CANADA_MOJI).length === 1);
  check("the mojibake college's opportunity lands on the canonical column",
    val(() => cellFor("Widget Cert", CANADA).classList.contains("mx-brown")) === true);
  check("no two columns share a label",
    new Set(labels).size === labels.length);

  // ── 6. Sam's ruling: default rows are titles with ≥2 adopters ────────────
  check("the single-adopter title is EXCLUDED by default",
    rowTitles().indexOf("Solo Cert") === -1);
  check("multi-adopter titles are included", rowTitles().indexOf("Widget Cert") !== -1);
  check("a control offers the single-adopter tail", !!val(() => doc.getElementById("mx-show-all")));
  drive("toggle single-adopter rows on", () => {
    const box = doc.getElementById("mx-show-all");
    box.checked = true;
    box.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  check("the toggle brings in single-adopter titles", rowTitles().indexOf("Solo Cert") !== -1);
  drive("toggle single-adopter rows back off", () => {
    const box = doc.getElementById("mx-show-all");
    box.checked = false;
    box.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  check("un-toggling restores the default depth", rowTitles().indexOf("Solo Cert") === -1);

  // ── 7. Brown is the CREDIBLE tier only ───────────────────────────────────
  // College E is a bare TOP/C-ID "potential" on Widget Cert and must stay blank;
  // it is prescriptive on Gadget Cert, where it must be brown.
  const eWidget = val(() => cellFor("Widget Cert", "College E"));
  check("a bare TOP/C-ID potential gets NO brown cell",
    !!eWidget && !eWidget.classList.contains("mx-brown") && txt(eWidget) === "");
  check("the same college IS brown where the M-ID layer names its course",
    val(() => cellFor("Gadget Cert", "College E").classList.contains("mx-brown")) === true);
  check("the brown tooltip NAMES the course the college already teaches",
    /GAD 2 Gadgetry/.test(val(() => cellFor("Gadget Cert", "College E").getAttribute("title")) || ""));

  // ── 8. The recomputed median agrees with the generator ───────────────────
  // Gadget Cert is a single card, so the row-level median must equal the
  // payload's peer_units_median (4) — the two are the same quantity there.
  check("for a single-card title the recomputed median matches peer_units_median",
    txt(val(() => cellFor("Gadget Cert", "College E"))) === "(4)");

  // ── 10. Structure that keeps a scrolled grid readable ────────────────────
  check("the credential column is frozen", /\.mx-title\{[^}]*position:sticky/.test(src));
  check("the header row is frozen", /\.mx-th\{[^}]*position:sticky/.test(src));
  check("the corner cell outranks both", /\.mx-corner\{[^}]*z-index:4/.test(src));
  check("the grid scrolls inside its own wrapper", /\.mx-wrap\{[^}]*overflow:auto/.test(src));
  check("row headers are th[scope=row]",
    val(() => doc.querySelector(".mx-title").getAttribute("scope")) === "row");
  check("column headers are th[scope=col]",
    val(() => doc.querySelector(".mx-th").getAttribute("scope")) === "col");
  check("the table carries a caption for screen readers",
    !!val(() => doc.querySelector(".mx-table caption")));
  check("headers ask the resolver for the CAPS short form", labels.indexOf("A COLL") !== -1);
  check("a college the resolver does not know falls back to its full name, not a blank",
    labels.indexOf("College D") !== -1 && labels.every((l) => l !== ""));
  check("the full college name survives in the header tooltip",
    titles.indexOf("College A") !== -1);
  check("new CSS uses design tokens, not raw hex",
    !/\.mx-[a-z-]+\{[^}]*#[0-9a-fA-F]{3,6}/.test(src));

  // ── 11. The roster rules the view mirrors ────────────────────────────────
  check("the roster-rules file carries the mojibake fold",
    !!rosterRules.fold.map[CANADA_MOJI]);
  check("the mojibake folds onto the canonical MAP spelling",
    rosterRules.fold.map[CANADA_MOJI] === CANADA);
  check("every fold target is itself a name, not another variant",
    Object.values(rosterRules.fold.map).every((v) => !(v in rosterRules.fold.map)));
  check("the view mirrors every sandbox name in the rules file",
    rosterRules.sandbox.names.every((n) => src.indexOf(n) !== -1));

  // ── 12. The axis is stable under filtering ───────────────────────────────
  // A column vanishing as you filter reads as "this college has nothing", which
  // is a different and false claim from "nothing matching your filter".
  // The search box is debounced 300ms, so this stage waits rather than asserting
  // into the gap — an assertion that fires before the handler runs passes for
  // the wrong reason as easily as it fails.
  const beforeCols = headerTitles().length;
  const beforeRows = rowTitles().length;
  drive("type a search that matches one title", () => {
    const box = doc.getElementById("sw-search");
    box.value = "Gadget";
    box.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  setTimeout(function () {
    check("filtering narrows the ROWS", rowTitles().length < beforeRows);
    check("the surviving row is the searched one", rowTitles().indexOf("Gadget Cert") !== -1);
    check("filtering does NOT drop columns", headerTitles().length === beforeCols);
    report();
  }, 420);
}

function report() {
  let failed = 0;
  results.forEach(([name, ok]) => {
    if (!ok) failed++;
    console.log((ok ? "PASS" : "FAIL") + " — " + name);
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
}
