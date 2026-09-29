// EACR → My College hand-off (2026-09-24 — Sam: "Add Create Handout button and
// link to the Handout feature on the My College tab").
//
// The handout lives on My College (its Report button builds the briefing
// document; its occupation opportunity register is the port of the per-college
// handout page). The EACR's button hands the reader over there, carrying the
// one college in the College filter as My College's REMEMBERED choice — that
// tab always asks first (Sam, 2026-08-21) and offers "open it again".
//
// Two things can go quietly wrong, and each gets a check:
//   1. The storage key is a literal in two files. If college_briefing.js renames
//      SCOPE_KEY the hand-off silently stops carrying the college — so the two
//      literals are asserted equal here, from the sources.
//   2. Carrying a college when TWO are selected would pick one silently. Zero
//      or several → navigate without writing.
//
// Run from repo root: `npm test` (or `node tests/eacr_handout.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");
const briefingSrc = fs.readFileSync("college_briefing.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function val(fn) { try { return fn(); } catch (e) { return undefined; } }

// ── 1. The key literal is in lockstep across the two files ──────────────────
const eacrKey = val(() => src.match(/MY_COLLEGE_SCOPE_KEY = "([^"]+)"/)[1]);
const briefingKey = val(() => briefingSrc.match(/var SCOPE_KEY = "([^"]+)"/)[1]);
check("the EACR names My College's storage key", !!eacrKey);
check("college_briefing.js still declares SCOPE_KEY", !!briefingKey);
check("⭐ the two literals are identical (a rename on either side breaks the hand-off)",
  !!eacrKey && eacrKey === briefingKey);
check("My College reads the remembered scope as {scope, college, district, swpRegion}",
  /scope: state\.scope, college: state\.college, district: state\.district,\s*swpRegion: state\.swpRegion/.test(briefingSrc));

// ── 2. Behaviour ────────────────────────────────────────────────────────────
const exhibits = [
  { exhibit_id: "x1", exhibit_ids: ["x1"], title: "CompTIA A+", unified_title: "CompTIA A+",
    issuing_agency: "CompTIA", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative", adopters: 2, adopter_names: ["Norco College", "Chaffey College"],
    potential: 0, potential_names: [], raw_titles: ["CompTIA A+"],
    credit_recs: [{ course: "CIS 110", credit: "4 hours in ICT" }] }
];
const lookup = {
  "Norco College": { district: "Riverside CCD", swRegion: "Inland Empire/Desert (Region 9)", ascccArea: "D" },
  "Chaffey College": { district: "Chaffey CCD", swRegion: "Inland Empire/Desert (Region 9)", ascccArea: "D" }
};
const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CPL_STATEWIDE_PRESCRIPTIVE = {};
  window.CCC_COLLEGE_LOOKUP = ${JSON.stringify(lookup)};
</script>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
const navs = [];
window.CPL_TABS = null; // the tab boots eagerly without it; navigate is stubbed below
try { window.eval(src); } catch (e) { console.error("init threw:", e); }
window.CPL_TABS = { navigate: function (tab, section) { navs.push([tab, section]); } };
const doc = window.document;

function click(el) {
  if (!el || !el.dispatchEvent) return false;
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  return true;
}
function setCollegeFilter(values) {
  const grp = doc.querySelector('.sw-filter-group[data-filter="college"]');
  if (!grp) return false;
  grp.querySelectorAll('.sw-filter-options input[type=checkbox]').forEach(function (cb) {
    cb.checked = values.indexOf(cb.value) >= 0;
  });
  grp.querySelector('.sw-filter-options input[type=checkbox]')
    .dispatchEvent(new window.Event("change", { bubbles: true }));
  return true;
}
function stored() { return val(() => JSON.parse(window.localStorage.getItem(eacrKey))); }

setTimeout(function () {
  try { run(); } catch (e) { check("the harness ran to completion (it threw: " + e.message + ")", false); }
  report();
}, 80);

function run() {
  const btn = () => doc.getElementById("sw-handout");
  check("a Create Handout button renders in the shared filter bar",
    !!btn() && !!val(() => btn().closest(".sw-filterbar")));
  check("...it is a WORD on a real <button type=button>, not a glyph or a link",
    val(() => btn().tagName) === "BUTTON" && val(() => btn().getAttribute("type")) === "button"
    && /^Create Handout$/.test(val(() => btn().textContent.trim()) || ""));
  check("...with a sentence beside it saying where it goes and what carries over",
    /My College/.test(val(() => doc.getElementById("sw-handout-hint").textContent) || "")
    && /one college/i.test(val(() => doc.getElementById("sw-handout-hint").textContent) || ""));
  check("...visible on every sub-tab (it lives outside the three panels)",
    !val(() => btn().closest(".sw-view")));

  // Zero colleges selected: navigate, write nothing.
  window.localStorage.clear();
  check("with no college filtered, the button still opens My College", click(btn()) && navs.length === 1
    && navs[0][0] === "college-briefing");
  check("...and writes no remembered college", stored() === null);

  // Exactly one: carry it.
  setCollegeFilter(["Norco College"]);
  click(btn());
  check("with ONE college filtered, it is handed over as My College's remembered choice",
    val(() => stored().college) === "Norco College" && val(() => stored().scope) === "college");
  check("...in the shape My College restores (district and swpRegion blank)",
    val(() => stored().district) === "" && val(() => stored().swpRegion) === "");
  check("...and the tab is opened by the router, not a hash guess",
    navs.length === 2 && navs[1][0] === "college-briefing");

  // Two: never pick one silently.
  window.localStorage.clear();
  setCollegeFilter(["Norco College", "Chaffey College"]);
  click(btn());
  check("with TWO colleges filtered, nothing is carried (no silent pick)", stored() === null);
  check("...but My College still opens", navs.length === 3);

  // No router at all: the hash still gets there.
  window.CPL_TABS = null;
  click(btn());
  check("without tabs.js the button falls back to the tab's hash",
    window.location.hash === "#college-briefing");
}

function report() {
  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
}
