// My College — the Strong Workforce consortium scope and narrowing.
// SkyQuarry (Session 267), 2026-09-17.
//
// Sigrid runs a meeting with a regional consortium and needs that region's
// colleges in front of her — as a group, and one at a time as she flips between
// them. Picking 28 names out of 120 by hand is the thing she should not have to
// do, and it is what she was left doing.
//
// ⚠ WHY THIS FILE EXISTS. The consortium roster was derived, committed and wired
// into the crosswalk generator on 2026-09-17. This control went on shipping
// DISABLED the whole time, with the reason "Needs the college-to-consortium
// list — it is on the MAP Dashboard but not yet in an export we hold", which the
// roster landing had made false. A disabled control does not notice that its
// prerequisite arrived; nothing failed, because nothing asserted that the button
// turns on when its data exists. That assertion is (a) below.
//
// What is guarded here:
//
//  (a) ⭐ THE SCOPE IS OFFERED AND ENABLED. The regression that caused this file.
//  (b) ⭐ THE ROSTER IS THE CONSORTIUM'S, NOT A NEAR-MISS. 9 regions, 117
//      colleges, Bay Area 28 — and the five that the proximity scheme drops are
//      named, because 23 names look exactly as complete as 28;
//  (c) ⭐ THE COLLEGE PICKER NARROWS BY REGION. This is the actual ask: choose
//      the Bay, get 28 in the dropdown, flip between them;
//  (d) a college outside a newly-chosen region is CLEARED, never left on screen
//      under a picker that no longer lists it (same contract as the district
//      narrowing it sits beside);
//  (e) the narrowing SURVIVES the move from the region scope to the college
//      scope — that is the facilitator's path, and losing it there sends her
//      back to 120 names;
//  (f) headings use the region's NAME, never its code ("Bay Area", never "Bay",
//      and never "IE/D" in something read aloud in a meeting);
//  (g) a failed roster read says so rather than rendering an empty region list.
//
// Run from repo root: `npm test` (or `node tests/my_college_swp_region.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");
const HAS_ROSTER = fs.existsSync("swp_region_data.js");
const ROSTER = HAS_ROSTER ? fs.readFileSync("swp_region_data.js", "utf8") : null;

// A handful of real Bay members plus two colleges from other consortia, so the
// filter has something to exclude. Hartnell and Cabrillo are deliberate: the
// proximity scheme files them under Central Coast and Strong Workforce puts them
// in the Bay, which is exactly where a near-miss roster goes wrong.
const COLLEGES = [
  "Berkeley City College", "Cabrillo College", "Chabot College", "Hartnell College",
  "Monterey Peninsula College", "Ohlone College",
  "Bakersfield College", "Fresno City College"
];

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function () { return new Promise(function () {}); };
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  const srcs = [TEAM, CHAT];
  if (ROSTER && !opts.noRoster) srcs.push(ROSTER);
  srcs.push(BRIEFING);
  srcs.forEach(function (src) {
    const s = w.document.createElement("script");
    s.textContent = src;
    w.document.body.appendChild(s);
  });
  const M = w.CPL_COLLEGE_BRIEFING;
  const root = w.document.getElementById("college-briefing-root");
  M._state.data = {
    colleges: COLLEGES, summaryByName: {}, raw: {},
    briefing: { unread: [], leads: [], programs: [], strategyTotal: 3, scenario: "Scenario 1", year: "1" }
  };
  M._state.loading = false;
  // The module normally pulls this on activate(); the harness never runs the
  // loader, so hand it the same object the loader would have produced.
  if (ROSTER && !opts.noRoster) {
    M._state.swpData = w.CPL_SWP_REGIONS;
    M._state.swp = "ready";
  } else {
    M._state.swp = opts.failRoster ? "error" : "loading";
  }
  return { w, M, root };
}

// ── (a) the scope is offered AND enabled ──
{
  const { M, root } = load();
  M.render(root);
  const btn = root.querySelector('.cb-scope-b[data-scope="swp"]');
  check("(a) the Strong Workforce scope is offered", !!btn);
  check("(a) ⭐ …and it is ENABLED, because its roster exists",
    !!btn && !btn.hasAttribute("disabled"),
    "the roster landed 2026-09-17 and this button stayed dark for a day");
  check("(a) it carries no stale 'not in an export we hold' reason",
    !/not yet in an export/i.test(root.textContent));
}

// ── (b) the roster is the consortium's, not the proximity scheme's ──
if (HAS_ROSTER) {
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function("window", ROSTER)(sandbox.window);
  const D = sandbox.window.CPL_SWP_REGIONS;
  check("(b) the roster parses and carries regions", !!(D && D.regions));
  check("(b) nine consortia", Object.keys(D.regions).length === 9);
  const total = Object.keys(D.regions).reduce(function (n, c) {
    return n + D.regions[c].colleges.length;
  }, 0);
  check("(b) 117 colleges (118 less Calbright, which belongs to no consortium)", total === 117);
  check("(b) ⭐ Bay Area is 28, not the proximity scheme's 23",
    !!D.regions.Bay && D.regions.Bay.colleges.length === 28);
  // ⭐ Name the five a near-miss roster drops. A count alone would pass on any
  // 28 colleges; these are the ones that actually differ between the schemes.
  ["Berkeley City College", "Cabrillo College", "Cañada College",
   "Hartnell College", "Monterey Peninsula College"].forEach(function (n) {
    check("(b) ⭐ the Bay includes " + n, D.regions.Bay.colleges.indexOf(n) >= 0,
      "the proximity scheme omits this one, and 23 names look as complete as 28");
  });
  check("(b) the region's own NAME travels with its code",
    D.regions.Bay.name === "Bay Area");
} else {
  check("(b) roster absent — regenerate with kb/_emit_swp_region_data.py", false);
}

// ── (c) the college picker narrows by region — the actual ask ──
{
  const { M, root } = load();
  M._state.scope = "college";
  M.render(root);
  const sel = root.querySelector("#cb-swp");
  check("(c) ⭐ the college picker offers a Strong Workforce narrowing", !!sel);
  check("(c) …listing every consortium", !!sel && sel.querySelectorAll("option").length === 10);
  check("(c) …by name rather than code", !!sel && /Bay Area/.test(sel.textContent));

  // Choosing the Bay leaves only the Bay members of this fixture.
  M._state.swpRegion = "Bay";
  M.render(root);
  const opts = Array.prototype.map.call(
    root.querySelectorAll("#cb-college option"), function (o) { return o.value; }
  ).filter(Boolean);
  check("(c) ⭐ the college list narrows to the region", opts.length === 6);
  check("(c) …and it is the RIGHT six",
    opts.indexOf("Hartnell College") >= 0 && opts.indexOf("Cabrillo College") >= 0
      && opts.indexOf("Bakersfield College") < 0 && opts.indexOf("Fresno City College") < 0);
}

// ── (d) a selection the new filter excludes is cleared ──
// ⚠ The picker only renders BEFORE a college is chosen, so a stale
// `state.college` reaches this handler from a remembered scope rather than from
// the same screen. Set up exactly that: the picker is showing, and state still
// carries a college from last time.
{
  const { M, root } = load();
  M._state.scope = "college";
  M._state.college = null;
  M.render(root);                       // picker renders
  M._state.college = "Bakersfield College";   // …as a remembered value
  const sel = root.querySelector("#cb-swp");
  check("(d) the narrowing is present on the choose-a-college step", !!sel);
  sel.value = "Bay";
  sel.onchange();
  check("(d) ⭐ a college outside the chosen region is cleared, not left dangling",
    M._state.college === null,
    "a name on screen that its own picker does not list reads as broken");

  // …and one INSIDE it survives, so the test cannot pass by clearing always.
  const b = load();
  b.M._state.scope = "college";
  b.M._state.college = null;
  b.M.render(b.root);
  b.M._state.college = "Chabot College";
  const sel2 = b.root.querySelector("#cb-swp");
  sel2.value = "Bay";
  sel2.onchange();
  check("(d) control: a college INSIDE the region survives the same change",
    b.M._state.college === "Chabot College");
}

// ── (e) the narrowing survives region scope -> college scope ──
{
  const { M, root } = load();
  M._state.scope = "swp";
  M._state.swpRegion = "Bay";
  M.render(root);
  check("(e) the region scope reports ready once a region is chosen", M._scopeReady());

  // The facilitator's path: look at the region, then drill into one college.
  // "Change view" returns to the question; picking `college` must KEEP the Bay.
  M._state.scope = null;
  M.render(root);
  const collegeBtn = root.querySelector('.cb-scope-b[data-scope="college"]');
  check("(e) the scope question offers the college scope", !!collegeBtn);
  collegeBtn.click();
  check("(e) ⭐ the consortium narrowing survives the move to the college scope",
    M._state.swpRegion === "Bay",
    "losing it here sends her back to 120 names mid-meeting");
  check("(e) …and the college list is already narrowed to it",
    Array.prototype.map.call(root.querySelectorAll("#cb-college option"),
      function (o) { return o.value; }).filter(Boolean).indexOf("Bakersfield College") < 0);

  // A scope that is NOT a consortium view clears it, so it cannot leak into
  // statewide and quietly shrink the denominator.
  M._state.scope = null;
  M.render(root);
  const swBtn = root.querySelector('.cb-scope-b[data-scope="statewide"]');
  swBtn.click();
  check("(e) ⭐ …and statewide CLEARS it, so it cannot shrink that denominator",
    M._state.swpRegion === "");
}

// ── (f) names, never codes ──
{
  const { M, root } = load();
  M._state.scope = "swp";
  M._state.swpRegion = "IE/D";
  M.render(root);
  const txt = root.textContent;
  check("(f) ⭐ the heading uses the region's NAME",
    /Inland Empire\/Desert/.test(txt));
  check("(f) …and never shows the bare code as a label",
    !/\bIE\/D\b/.test(txt.replace(/Inland Empire\/Desert/g, "")));
}

// ── (g) a failed roster read says so ──
{
  const { M, root } = load({ noRoster: true, failRoster: true });
  M._state.scope = "swp";
  M.render(root);
  const txt = root.textContent;
  check("(g) ⭐ a failed roster read is NAMED, not rendered as an empty region list",
    /could not be read/i.test(txt));
  check("(g) …and it offers the reader somewhere to go",
    /pick a college instead/i.test(txt));
  check("(g) …and it does not claim the list does not exist",
    !/not yet in an export/i.test(txt));
}

let failed = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (ok || !why ? "" : "  — " + why));
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
