// EACR filter controls (2026-08-13 — Sam: "filters need drop downs and they
// don't all work").
//
// ONE defect explains both halves of that sentence. `.sw-interactive` sets
// `overflow:hidden` so the v1 table's corners clip to the card radius, and the
// page-level filter bar reuses that class as `<div class="sw-interactive
// sw-filterbar">`. Every `.sw-filter-dropdown` is `position:absolute; top:100%`,
// so inside a ~70px-tall wrapper all eight opened into a clipped sliver: you
// click, nothing appears, and you conclude both that there are no dropdowns and
// that the filters are broken.
//
// Also guarded here: the two colleges the district/SW-region filters silently
// dropped. `collegeMatchesFilters()` fails CLOSED on a LOOKUP miss — correct
// (we must not claim an unknown college sits in the district you asked for) but
// silent, which is how "Calbright College Non-Credit" lost 88 rows of adoptions.
//
// These checks are written against the FAILURE MODE, not the happy path: each
// one fails on the pre-fix file.
//
// Run from repo root: `npm test` (or `node tests/eacr_filters.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");
const lookupSrc = fs.readFileSync("college_lookup.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── 1. The clipping fix, asserted on the injected CSS ────────────────────────
// jsdom does no layout, so we cannot observe the clip. We assert the rule that
// prevents it, and that the class it must override still behaves as assumed.
check("`.sw-filterbar` declares overflow:visible (un-clips all 8 dropdowns)",
  /\.sw-filterbar\{[^}]*overflow:\s*visible/.test(src));
check("the filter bar still reuses .sw-interactive (so the override is needed)",
  /class="sw-interactive sw-filterbar"/.test(src));
check("dropdowns are still absolutely positioned (the reason clipping bit)",
  /\.sw-filter-dropdown\s*\{[^}]*position:absolute/.test(
    fs.readFileSync("index.html", "utf8")));

// ── 2. The silently-dropped college ──────────────────────────────────────────
check("Calbright College Non-Credit resolves in CCC_COLLEGE_LOOKUP",
  /"Calbright College Non-Credit":\s*\{[^}]*district:/.test(lookupSrc));
check("...and carries an swRegion (both filters need it)",
  /"Calbright College Non-Credit":\s*\{[^}]*swRegion:/.test(lookupSrc));

// ── 3. Behavioural: sandbox org excluded, real college kept, miss is loud ────
const exhibits = [
  { exhibit_id: "x1", title: "CompTIA A+", unified_title: "CompTIA A+", issuing_agency: "CompTIA",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "CCC Collaborative",
    adopters: 2, adopter_names: ["College A", "CA MAP INITIATIVE COLLEGE"],
    potential: 1, potential_names: ["Calbright College Non-Credit"], credit_recs: [] },
  { exhibit_id: "x2", title: "Cisco CCNA", unified_title: "Cisco CCNA", issuing_agency: "Cisco",
    is_classified: true, cpl_type: "Credit By Exam", collaborative_type: "Local",
    adopters: 1, adopter_names: ["Ghost College"], potential: 0, potential_names: [], credit_recs: [] },
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CPL_STATEWIDE_PRESCRIPTIVE = {};
  window.CCC_COLLEGE_LOOKUP = {
    "College A": { district: "D1", swRegion: "R1" },
    "Calbright College Non-Credit": { district: "Calbright College", swRegion: "Capital (Region 2)" }
  };
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

const warnings = [];
window.console.warn = function () { warnings.push(Array.prototype.join.call(arguments, " ")); };

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(() => {
  const doc = window.document;

  // All eight filter groups render.
  const groups = Array.from(doc.querySelectorAll(".sw-filter-group"))
    .map(function (g) { return g.getAttribute("data-filter"); });
  ["collabType", "cplType", "sector", "discipline", "issuer", "college", "district", "swRegion"]
    .forEach(function (key) {
      check("filter group renders: " + key, groups.indexOf(key) !== -1);
    });

  // Every group has an openable dropdown with at least one option.
  let emptyGroups = [];
  doc.querySelectorAll(".sw-filter-group").forEach(function (g) {
    const opts = g.querySelectorAll(".sw-filter-options input[type=checkbox]");
    if (!opts.length) emptyGroups.push(g.getAttribute("data-filter"));
  });
  check("no filter renders an empty option list", emptyGroups.length === 0);

  // The college filter: sandbox org out, real college in.
  const collegeGroup = doc.querySelector('.sw-filter-group[data-filter="college"]');
  const collegeOpts = Array.from(
    collegeGroup.querySelectorAll(".sw-filter-options input[type=checkbox]")
  ).map(function (i) { return i.value; });
  check("sandbox org CA MAP INITIATIVE COLLEGE is NOT offered as a college filter",
    collegeOpts.indexOf("CA MAP INITIATIVE COLLEGE") === -1);
  check("real college Calbright College Non-Credit IS offered",
    collegeOpts.indexOf("Calbright College Non-Credit") !== -1);

  // Its district/region reach the district + swRegion option lists — the thing
  // the fail-closed miss was suppressing.
  const districtOpts = Array.from(
    doc.querySelectorAll('.sw-filter-group[data-filter="district"] input[type=checkbox]')
  ).map(function (i) { return i.value; });
  check("Calbright's district reaches the District filter",
    districtOpts.indexOf("Calbright College") !== -1);
  const regionOpts = Array.from(
    doc.querySelectorAll('.sw-filter-group[data-filter="swRegion"] input[type=checkbox]')
  ).map(function (i) { return i.value; });
  check("Calbright's region reaches the SW Region filter",
    regionOpts.indexOf("Capital (Region 2)") !== -1);

  // A genuinely unknown college still fails closed — but LOUDLY.
  check("an unresolved college name is warned about, not dropped silently",
    warnings.some(function (w) { return /Ghost College/.test(w) && /CCC_COLLEGE_LOOKUP/.test(w); }));
  check("the sandbox org is NOT reported as unresolved (it was excluded, not missed)",
    !warnings.some(function (w) { return /CA MAP INITIATIVE COLLEGE/.test(w); }));

  // Clicking a filter button opens exactly that dropdown.
  const btn = collegeGroup.querySelector(".sw-filter-btn");
  btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("clicking a filter button opens its dropdown",
    collegeGroup.querySelector(".sw-filter-dropdown").classList.contains("open"));
  check("only one dropdown is open at a time",
    doc.querySelectorAll(".sw-filter-dropdown.open").length === 1);

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
}, 60);
