// The My College occupation register, one file per Strong Workforce region.
//
// Sam, 2026-09-30, with a screenshot: My College at San Diego City College
// showed "not in the Bay Region's occupation set, so there is nothing to show
// here yet." Two causes, each guarded here:
//
//  (a) ⭐ THE REGISTER COVERED ONE REGION. It shipped for the Bay's 28 colleges
//      in one file, so 89 colleges read "not in this set". Every region now has
//      its own file, and the tab loads only the picked college's region. The
//      shipped-files block fails if any region in swp_region_data.js has no
//      file, so a tenth consortium cannot quietly re-open the gap.
//  (b) ⭐ THE REGISTER AND THE PICKER SPELLED COLLEGES DIFFERENTLY. The matcher
//      wrote "Canada College", "City College Of San Francisco", "College Of
//      Marin"; the picker offers map_colleges.name ("Cañada College", ...). The
//      lookup missed, and three Bay colleges had shown "not in this set" since
//      the register shipped. Every college key in every file must be a name the
//      picker offers for that region.
//  (c) A college picked in ANOTHER region while the section is closed reads as
//      not yet loaded, never as "not in this set" from the previous region's file.
//  (d) Calbright belongs to no region, and says so rather than rendering empty.
//
// Run: `node tests/college_briefing_register_regions.test.js`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function val(name, fn) {
  try { check(name, fn()); } catch (e) { check(name + " [threw: " + e.message + "]", false); }
}

function load() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); }; // never resolves
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync("college_briefing.js", "utf8");
  w.document.body.appendChild(s);
  return w;
}
const win = load();
const M = win.CPL_COLLEGE_BRIEFING;
const S = M._state;

// The real roster, so the name rule is tested against the names the picker uses.
const rosterBox = {};
new Function("window", fs.readFileSync("swp_region_data.js", "utf8"))(rosterBox);
const SWP = rosterBox.CPL_SWP_REGIONS;

// ── the slug rule, shared with kb/_emit_regional_opps_data.py region_slug() ──
val("slug: SD/I -> sdi, IE/D -> ied, Bay -> bay, CVML -> cvml",
  () => M._regionSlug("SD/I") === "sdi" && M._regionSlug("IE/D") === "ied"
    && M._regionSlug("Bay") === "bay" && M._regionSlug("CVML") === "cvml");
val("slug: the emitter's rule is the same rule (alnum only, lowercased)",
  () => /return "".join\(ch for ch in \(code or ""\).lower\(\) if ch.isalnum\(\)\)/
    .test(fs.readFileSync("kb/_emit_regional_opps_data.py", "utf8")));

// ── which region a college belongs to ──
val("region: San Diego City College is SD/I",
  () => M._regionOfCollege(SWP, "San Diego City College") === "SD/I");
val("region: Cañada College (the picker's spelling) is Bay",
  () => M._regionOfCollege(SWP, "Cañada College") === "Bay");
val("region: a college in no consortium is \"\", not null",
  () => M._regionOfCollege(SWP, "Calbright College Non-Credit") === "");
val("region: null while the roster has not arrived",
  () => M._regionOfCollege(null, "San Diego City College") === null);

// ── the loader picks the college's own region file ──
const loaded = [];
const FIX = {
  SDI: { meta: { region: "the San Diego/Imperial Region", colleges: ["San Diego City College"],
                 priority_labels: {}, accuracy: {} },
         colleges: { "San Diego City College": { rows: [{ priority: "P1", occupation: "Welders" }],
                     unmatched: [], not_teaching: [], adopted_no_program: [] } } },
  BAY: { meta: { region: "the Bay Region", colleges: ["Cañada College"], priority_labels: {}, accuracy: {} },
         colleges: { "Cañada College": { rows: [], unmatched: [], not_teaching: [], adopted_no_program: [] } } }
};
win.CPL_TABS = {
  loadScript: function (src, g, cb) {
    loaded.push([src, g]);
    const key = g.replace("CPL_REGIONAL_OPPS_", "");
    if (FIX[key]) win[g] = FIX[key];
    cb();
  }
};
S.swp = "ready"; S.swpData = SWP;

S.college = "San Diego City College";
M._loadOpps(null);
val("load: San Diego City College reads regional_cpl_opportunity_sdi.js",
  () => loaded.length === 1 && loaded[0][0] === "regional_cpl_opportunity_sdi.js" && loaded[0][1] === "CPL_REGIONAL_OPPS_SDI");
val("load: and its register is ready with its own rows",
  () => S.oppsState === "ready" && S.oppsRegion === "SD/I" && M._oppsView().opps === FIX.SDI);
val("load: the closed summary counts its adopt-now row",
  () => /1 to adopt now/.test(M._oppsSummaryFor(M._oppsView().opps, S.college, M._oppsView().st)));

M._loadOpps(null);
val("load: a second call for the same region fetches nothing", () => loaded.length === 1);

// (c) a college in another region, section not yet re-opened
S.college = "Cañada College";
val("(c) another region's college reads as not yet loaded, not as outside the set", () => {
  const v = M._oppsView();
  return v.st === "idle" && v.opps === null
    && M._oppsSummaryFor(v.opps, S.college, v.st) === "open to load";
});
M._loadOpps(null);
val("load: Cañada College (picker spelling) reads regional_cpl_opportunity_bay.js and finds itself", () =>
  loaded.length === 2 && loaded[1][0] === "regional_cpl_opportunity_bay.js"
  && M._oppsView().opps.colleges[S.college] != null);

// (d) no region
S.college = "Calbright College Non-Credit";
M._loadOpps(null);
val("(d) Calbright: no file is fetched", () => loaded.length === 2);
val("(d) Calbright: the section says it belongs to no consortium", () => {
  const v = M._oppsView();
  const body = M._oppsBodyFor(v.opps, S.college, v.st, [], "");
  return v.st === "noregion" && /belongs to no regional Strong Workforce/.test(body)
    && !/not in /.test(body) && M._oppsSummaryFor(v.opps, S.college, v.st) === "no regional list";
});

// A roster that has not arrived holds the section on loading, then resolves.
S.college = "San Diego City College"; S.swp = "loading"; S.oppsState = "idle"; S.oppsRegion = null;
M._loadOpps(null);
val("load: while the roster loads, the register says loading and fetches nothing",
  () => S.oppsState === "loading" && loaded.length === 2);
S.swp = "ready";
M._loadOpps(null);
val("load: once the roster arrives the same call loads the region", () => S.oppsState === "ready" && S.oppsRegion === "SD/I");

// ── (a)+(b) the shipped files ──
val("shipped: the old one-region file is gone", () => !fs.existsSync("regional_cpl_opportunity_data.js"));
Object.keys(SWP.regions).forEach(function (code) {
  const slug = M._regionSlug(code);
  const file = "regional_cpl_opportunity_" + slug + ".js";
  if (!fs.existsSync(file)) { check("shipped: " + code + " has " + file, false); return; }
  const box = {};
  new Function("window", fs.readFileSync(file, "utf8"))(box);
  const D = box["CPL_REGIONAL_OPPS_" + slug.toUpperCase()];
  check("shipped: " + file + " sets CPL_REGIONAL_OPPS_" + slug.toUpperCase(), !!(D && D.meta && D.colleges));
  if (!D) return;
  const roster = SWP.regions[code].colleges;
  const keys = Object.keys(D.colleges);
  const foreign = keys.filter(function (k) { return roster.indexOf(k) < 0; });
  check("shipped: every " + code + " college key is a name the picker offers"
    + (foreign.length ? " — not: " + foreign.join(", ") : ""), foreign.length === 0);
  const absent = roster.filter(function (n) { return keys.indexOf(n) < 0; });
  check("shipped: every " + code + " roster college has a register"
    + (absent.length ? " — missing: " + absent.join(", ") : ""), absent.length === 0);
  check("shipped: " + code + " meta names its region code", D.meta.region_code === code);
  check("shipped: " + code + " carries the accuracy block with its data",
    !!(D.meta.accuracy && D.meta.accuracy.precision && D.meta.accuracy.recall));
});

let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (failed ? failed + " of " + results.length + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
