// TMC Builder — c-id.net authority wiring (multi-C-ID courses).
//
// The right-side pickers/auto-match now union each course's COCI CIDNumber with
// the official c-id.net approved-courses authority (cid_articulations.json), which
// roughly DOUBLES C-ID coverage. A course row can therefore carry MORE THAN ONE
// C-ID: [subj, num, title, units, cid] (single) OR [..., cid, xcid[]] (cid =
// primary/display C-ID, xcid[] = additional c-id.net C-IDs). A course satisfies a
// slot if ANY of its C-IDs matches.
//
// Guards:
//   (1) a 6-element row auto-matches a slot via its xcid (not just its primary);
//   (2) the picker option shows the MATCHED C-ID (the xcid), not the primary;
//   (3) statusFor labels an xcid match "✓ C-ID aligned" (same tier as COCI);
//   (4) used-tracking: one physical course can't auto-fill two slots (a multi-C-ID
//       course fills the first slot; the second falls to a different course);
//   (5) backward-compat: a plain 5-element row still C-ID auto-matches;
//   (6) no false fill for a slot no local course carries;
//   (7) shipped-artifact contract: tmc_college_courses.js carries the new _meta
//       provenance keys and well-formed 6-element (xcid) rows.
//
// Run from repo root: `npm test` (or `node tests/tmc_cid_articulations.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Part A — consumer logic (synthetic data)
// ─────────────────────────────────────────────────────────────────────────────
const builderSrc = fs.readFileSync("tmc_builder.js", "utf8");
const html = `<!DOCTYPE html><html><body>
  <div class="cpl-tab-pane" id="tab-tmc-builder"><div class="main-container">
    <div id="tmc-builder-root"></div>
  </div></div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

// One TMC; five C-ID slots exercising each path.
window.CPL_TMC_TEMPLATES = {
  _meta: { draft: true, sources: {} },
  templates: [{
    id: "test-cid", discipline: "Test CID", degree: "AS-T", status: "draft", version: "draft", total_units: 16,
    sections: [{ name: "Required Core", select: "all", units: "16", slots: [
      { cid: "BUS 140", title: "Business Information Systems", units: "3" }, // primary match (course A)
      { cid: "ITIS 120", title: "Information Security", units: "3" },        // A carries via xcid, but A is used → course C
      { cid: "ACCTG 110", title: "Financial Accounting", units: "4" },       // 5-element backward-compat (course B)
      { cid: "BUS 155", title: "Business Communication", units: "3" },        // xcid-only match (course D)
      { cid: "ZZZ 999", title: "Nonexistent", units: "3" }                    // nothing carries it → blank
    ]}]
  }]
};
// A = multi-C-ID (COCI BUS 140 + c-id.net xcid ITIS 120); C = ITIS 120 (own primary);
// B = plain 5-element ACCTG 110; D = multi-C-ID whose MATCH is the xcid (BUS 155),
// not the primary (MGT 100).
const courses = [
  ["CBIS", "101", "Business Info Systems", 3, "BUS 140", ["ITIS 120"]],  // A (index 0)
  ["INFO", "50", "Information Security", 3, "ITIS 120"],                  // C (index 1)
  ["ACCT", "1", "Financial Accounting", 4, "ACCTG 110"],                 // B (index 2)
  ["MGMT", "10", "Management", 3, "MGT 100", ["BUS 155"]],               // D (index 3)
  ["BIOL", "1", "General Biology", 4, null]                              // distractor
];
window.CPL_TMC_COLLEGE_COURSES = {
  _meta: {}, colleges: ["Test College"], courses: { "0": courses }
};
window.CPL_TMC_GE_PATTERNS = { _meta: {}, patterns: [] };
// No ADT presence → title-fill is gated OFF, isolating pure C-ID auto-match.
window.CPL_TMC_COLLEGE_ADTS = { _meta: { unmatched_colleges: {} }, extra_tmcs: [], by_college: {}, tmc_totals: {} };
window.fetch = function () { return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };

let threw = false;
try { window.eval(builderSrc); } catch (e) { threw = true; console.error("eval threw:", e); }
check("tmc_builder.js evaluates without throwing", !threw);
window.CPL_TMC_BUILDER.boot();

function selectVal(sel, val) { sel.value = val; sel.dispatchEvent(new window.Event("change")); }
function listRows() { return document.querySelectorAll("#tab-tmc-builder .tmc-listrow"); }
function rowFor(re) { return Array.prototype.filter.call(listRows(), (r) => re.test(txt(r)))[0]; }
function pickerBtns() { return document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn"); }

(async function () {
  selectVal(document.getElementById("tmc-college-sel"), "Test College");
  await sleep(0);
  selectVal(document.getElementById("tmc-status-filter"), "all"); // not-established is hidden by default
  await sleep(0);
  rowFor(/Test CID/).click();
  await sleep(0);

  const btns = pickerBtns();
  check("5 slot pickers render", btns.length === 5);

  // (5) backward-compat: plain 5-element row still C-ID auto-matches
  check("5-element row: ACCTG 110 auto-matches ACCT 1", /ACCT\s*1\b/.test(txt(btns[2])));

  // (1) primary match on the multi-C-ID course
  check("multi-C-ID row: BUS 140 (primary) auto-matches CBIS 101", /CBIS\s*101/.test(txt(btns[0])));

  // (4) used-tracking: CBIS 101 also carries ITIS 120 (xcid) but is already used
  //     for slot 0, so slot 1 must fall to a DIFFERENT course (INFO 50).
  check("used-tracking: ITIS 120 slot does NOT reuse CBIS 101", !/CBIS\s*101/.test(txt(btns[1])));
  check("used-tracking: ITIS 120 slot falls to INFO 50 instead", /INFO\s*50/.test(txt(btns[1])));

  // (1 cont.) xcid-only match: D's PRIMARY is MGT 100, but it matches BUS 155 via xcid
  check("xcid match: BUS 155 slot auto-matches MGMT 10 (via its xcid, not primary)", /MGMT\s*10/.test(txt(btns[3])));

  // (6) no false fill
  check("no local course carries ZZZ 999 → slot stays unfilled", /Select your/.test(txt(btns[4])));

  // (3) status: all four filled slots are "✓ C-ID aligned" (xcid == same tier as COCI)
  const ok = document.querySelectorAll("#tab-tmc-builder .tmc-status.ok");
  check("all 4 C-ID matches are ✓ C-ID aligned", ok.length === 4 &&
    Array.prototype.every.call(ok, (p) => /C-ID aligned/.test(txt(p))));

  // (2) the picker option shows the MATCHED C-ID (BUS 155), not the primary (MGT 100)
  btns[3].click(); // open slot 3's picker
  await sleep(0);
  const cidTags = document.querySelectorAll("#tab-tmc-builder .tmc-pop .tmc-pc-cid");
  const matchedShows155 = Array.prototype.some.call(cidTags, (t) => /BUS\s*155/.test(txt(t)));
  const matchedShowsPrimary = Array.prototype.some.call(cidTags, (t) => /MGT\s*100/.test(txt(t)));
  check("picker shows the MATCHED C-ID (BUS 155) on the xcid option", matchedShows155);
  check("picker does NOT show the primary (MGT 100) as the match badge", !matchedShowsPrimary);

  // ── Part B: shipped-artifact contract on the real tmc_college_courses.js ──
  runArtifactChecks();

  // ── report ──
  let failed = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed."));
  process.exit(failed ? 1 : 0);
})();

function runArtifactChecks() {
  let raw;
  try { raw = fs.readFileSync("tmc_college_courses.js", "utf8"); }
  catch (e) { check("tmc_college_courses.js present", false); return; }
  const data = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  const m = data._meta || {};
  check("artifact _meta cites the c-id.net source", m._source_cid_articulations === "kb/reference/cid_articulations.json");
  check("artifact _meta reports courses_gained_cid_from_cidnet > 0", (m.courses_gained_cid_from_cidnet || 0) > 0);
  check("artifact _meta reports courses_multi_cid > 0", (m.courses_multi_cid || 0) > 0);

  // find 6-element (xcid) rows and validate their shape
  let sixEl = 0, badShape = 0;
  Object.keys(data.courses).forEach((ci) => {
    data.courses[ci].forEach((r) => {
      if (r.length > 5) {
        sixEl++;
        if (!Array.isArray(r[5]) || !r[5].length || !r[5].every((x) => typeof x === "string" && x.length)) badShape++;
        if (typeof r[4] !== "string" || !r[4].length) badShape++; // a 6-el row must have a non-null primary
      }
    });
  });
  check("artifact carries 6-element (xcid) rows", sixEl > 0);
  check("every 6-element row is well-formed (string primary + non-empty string xcid[])", badShape === 0);
}
