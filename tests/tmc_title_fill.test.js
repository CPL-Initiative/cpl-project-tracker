// TMC Builder — approved-ADT title-fill recovery (Session 69, Ask 2).
//
// For a college that ALREADY holds an approved ADT in a discipline, approval
// implies every course was CO-vetted — but the Chancellor's Office doesn't retain
// a parseable PDF and the C-ID is often not recorded in COCI, so the slot can't
// C-ID auto-match. The builder recovers the mapping by matching the slot's title
// to a local course title (light stemming so "Introductory X" ↔ "Introduction to
// X" matches). These fills are flagged "≈ title-matched (verify)", NEVER "C-ID
// aligned", and are scoped to APPROVED ADTs only.
//
// Guards: (1) exact-title recovery (Sam's AJ 200 → AJ 130 example); (2) stemmed
// recovery (PSY 110 "Introductory Psychology" → "Introduction to Psychology");
// (3) C-ID auto-match still wins (stays ✓ ok, not ≈ tmatch); (4) no false fill
// when nothing matches; (5) the scope gate — a college WITHOUT an approved ADT
// gets NO title auto-fill even though the same titles exist locally.
//
// Run from repo root: `npm test` (or `node tests/tmc_title_fill.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const builderSrc = fs.readFileSync("tmc_builder.js", "utf8");

const html = `<!DOCTYPE html><html><body>
  <div class="cpl-tab-pane" id="tab-tmc-builder"><div class="main-container">
    <div id="tmc-builder-root"></div>
  </div></div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

// One TMC, four C-ID slots that exercise each path.
window.CPL_TMC_TEMPLATES = {
  _meta: { draft: true, sources: {} },
  templates: [{
    id: "test-aj", discipline: "Test AJ", degree: "AS-T", status: "draft", version: "draft", total_units: 13,
    sections: [{ name: "Required Core", select: "all", units: "13", slots: [
      { cid: "AJ 200", title: "Introduction to Corrections", units: "3" },   // exact title fill (Sam's case)
      { cid: "PSY 110", title: "Introductory Psychology", units: "3" },       // stemmed title fill
      { cid: "MATH 110", title: "Calculus I", units: "4" },                   // C-ID auto-match (control)
      { cid: "AJ 999", title: "Forensic Botany", units: "3" }                 // nothing matches → stays blank
    ]}]
  }]
};
// Both colleges carry the SAME local courses (so the title matches EXIST for both)
// — only the ADT-approval status differs, to prove the scope gate.
const courses = [
  ["AJ", "130", "Introduction to Corrections", 3, null],   // title match for AJ 200 (no C-ID recorded)
  ["PSYC", "5", "Introduction to Psychology", 3, null],     // stemmed title match for PSY 110
  ["MATH", "20", "Calculus I", 4, "MATH 110"],              // carries the C-ID → C-ID auto-match
  ["BIOL", "1", "General Biology", 4, null]                 // distractor — must NOT fill Forensic Botany
];
window.CPL_TMC_COLLEGE_COURSES = {
  colleges: ["Approved College", "No-ADT College"],
  courses: { "0": courses, "1": courses }
};
window.CPL_TMC_GE_PATTERNS = { _meta: {}, patterns: [] };
// Approved College holds test-aj ACTIVE; No-ADT College holds nothing.
window.CPL_TMC_COLLEGE_ADTS = {
  _meta: { unmatched_colleges: {} }, extra_tmcs: [],
  by_college: { "Approved College": {
    "test-aj": { b: "active", s: "Active", c: "10101", a: "2020-01-01", u: "18", t: "Test AJ" }
  } },
  tmc_totals: { "test-aj": { active: 1, approved: 0, in_progress: 0, teachout: 0, inactive: 0, colleges: 1 } }
};
window.fetch = function () { return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };

let threw = false;
try { window.eval(builderSrc); } catch (e) { threw = true; console.error("eval threw:", e); }
check("tmc_builder.js evaluates without throwing", !threw);
window.CPL_TMC_BUILDER.boot();

function selectVal(sel, val) { sel.value = val; sel.dispatchEvent(new window.Event("change")); }
function listRows() { return document.querySelectorAll("#tab-tmc-builder .tmc-listrow"); }
function rowFor(re) { return Array.prototype.filter.call(listRows(), (r) => re.test(txt(r)))[0]; }
function pickerBtns() { return document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn"); }
function statusPills() { return document.querySelectorAll("#tab-tmc-builder .tmc-status"); }

(async function () {
  // ── APPROVED COLLEGE → open the TMC; default Show = approved ADTs shows it ──
  selectVal(document.getElementById("tmc-college-sel"), "Approved College");
  await sleep(0);
  rowFor(/Test AJ/).click();
  await sleep(0);
  const btns = pickerBtns();
  check("approved ADT: 4 slot pickers render", btns.length === 4);

  // (1) exact-title recovery — Sam's AJ 200 → AJ 130 "Introduction to Corrections"
  check("AJ 200 (no C-ID locally) recovers AJ 130 by exact title",
    /AJ\s*130/.test(txt(btns[0])) && /Introduction to Corrections/.test(txt(btns[0])));
  // (2) stemmed recovery — "Introductory Psychology" ↔ "Introduction to Psychology"
  check("PSY 110 recovers PSYC 5 by stemmed title (introductory↔introduction)",
    /PSYC\s*5/.test(txt(btns[1])));
  // (3) C-ID auto-match still wins for the slot whose C-ID the college carries
  check("MATH 110 still C-ID auto-matches MATH 20", /MATH\s*20/.test(txt(btns[2])));
  // (4) no false fill when nothing matches
  check("Forensic Botany stays unfilled (no spurious match)", /Select your/.test(txt(btns[3])));

  // status pills: AJ 200 + PSY 110 are ≈ title-matched (verify), distinct from C-ID aligned
  const tmatch = document.querySelectorAll("#tab-tmc-builder .tmc-status.tmatch");
  check("title-recovered slots show a distinct ≈ title-matched status", tmatch.length === 2);
  check("title-matched label says 'verify', not 'C-ID aligned'",
    Array.prototype.every.call(tmatch, (p) => /title-match/i.test(txt(p)) && !/C-ID aligned/.test(txt(p))));
  const ok = document.querySelectorAll("#tab-tmc-builder .tmc-status.ok");
  check("the C-ID-matched slot is ✓ C-ID aligned (NOT title-matched)",
    ok.length === 1 && /C-ID aligned/.test(txt(ok[0])));

  // the explainer note + meter call out the recovery
  check("an explainer note states slots were pre-filled by title match",
    Array.prototype.some.call(document.querySelectorAll("#tab-tmc-builder .tmc-reviewbar"),
      (b) => /pre-filled by title match/.test(txt(b))));
  check("the header meter reports the title-matched count",
    /2<\/b>\s*title-matched|2 title-matched/.test(document.getElementById("tmc-meter").innerHTML));
  check("the legend documents the ≈ title-matched state",
    /title-matched/.test(txt(document.querySelector("#tab-tmc-builder .tmc-legend"))));

  // ── SCOPE GATE: No-ADT College has the same local courses but NO approved ADT ──
  document.querySelector("#tab-tmc-builder .tmc-back").click();
  await sleep(0);
  selectVal(document.getElementById("tmc-college-sel"), "No-ADT College");
  await sleep(0);
  selectVal(document.getElementById("tmc-status-filter"), "all"); // not-established is hidden by the default
  await sleep(0);
  rowFor(/Test AJ/).click();
  await sleep(0);
  const btns2 = pickerBtns();
  check("scope gate: NO title auto-fill without an approved ADT (AJ 200 stays blank)",
    /Select your/.test(txt(btns2[0])) && /Select your/.test(txt(btns2[1])));
  check("scope gate: C-ID auto-match still fills (MATH 20) regardless of ADT status",
    /MATH\s*20/.test(txt(btns2[2])));
  check("scope gate: no ≈ title-matched pills without an approved ADT",
    document.querySelectorAll("#tab-tmc-builder .tmc-status.tmatch").length === 0);

  // ── report ──
  let failed = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed."));
  process.exit(failed ? 1 : 0);
})();
