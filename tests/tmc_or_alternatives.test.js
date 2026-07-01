// TMC Builder — "OR" alternatives on the left side (Session 90).
//
// Many ASCCC TMC templates express a requirement as "Course X OR Course Y [OR Z]"
// (pick ONE). The PDFs render this as a multi-column layout that the text parser
// scrambles, so parse_body() emitted every alternative as an independent slot and
// lost the OR grouping (0 slots carried alts). tmc/tmc_or_groups.json is a curated
// overlay (VISUAL PDF read + adversarial verification) of the intra-line OR-groups;
// tmc/_parse_tmc_pdfs.py folds each into a single slot (first existing-slot member =
// cid, the rest = alts[]). The Builder already renders "X or Y" and auto-matches a
// course carrying ANY alternative.
//
// Guards:
//   Part A (shipped artifacts): the overlay is valid; tmc_templates.js carries
//     folded slots (alts[]); the folds landed on the right slots (AoJ statistics
//     SOCI 125 OR MATH 110; African American Studies AFS 140 OR AFS 141); the fold
//     is idempotent-safe (no cid lost — every folded member survives as cid or alt);
//     _meta.or_groups.applied > 0.
//   Part B (consumer): a slot with alts auto-matches a local course carrying the
//     ALT C-ID (not the primary), renders the "or <alt>" hint, and is ✓ C-ID aligned.
//
// Run from repo root: `npm test` (or `node tests/tmc_or_alternatives.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function ns(c) { return String(c || "").replace(/\s+/g, "").toUpperCase(); }

// ── Part A — shipped artifacts ───────────────────────────────────────────────
function loadJsObj(path, marker) {
  const raw = fs.readFileSync(path, "utf8");
  const s = raw.indexOf("{", raw.indexOf(marker));
  return JSON.parse(raw.slice(s, raw.lastIndexOf("}") + 1));
}

const overlay = JSON.parse(fs.readFileSync("tmc/tmc_or_groups.json", "utf8"));
check("overlay tmc_or_groups.json has groups", Array.isArray(overlay.groups) && overlay.groups.length > 0);
check("every overlay group has ≥2 cids + a tmc + a section",
  overlay.groups.every((g) => g.tmc && g.section && Array.isArray(g.cids) && g.cids.length >= 2));

const T = loadJsObj("tmc_templates.js", "CPL_TMC_TEMPLATES");
const tmpl = {}; T.templates.forEach((t) => (tmpl[t.id] = t));

let slotsWithAlts = 0;
T.templates.forEach((t) => (t.sections || []).forEach((s) => s.slots.forEach((sl) => { if (sl.alts && sl.alts.length) slotsWithAlts++; })));
check("tmc_templates.js carries folded slots (alts[])", slotsWithAlts > 0);
check("_meta.or_groups.applied > 0", (T._meta.or_groups && T._meta.or_groups.applied) > 0);

function sectionOf(tid, name) { return (tmpl[tid].sections || []).filter((s) => s.name.toLowerCase() === name.toLowerCase()); }
function slotWithCid(tid, secName, cid) {
  for (const sec of sectionOf(tid, secName)) {
    const sl = sec.slots.find((x) => x.cid && ns(x.cid) === ns(cid));
    if (sl) return sl;
  }
  return null;
}
// AoJ statistics OR: SOCI 125 (anchor) OR MATH 110
const aoj = slotWithCid("administration-of-justice", "List B", "SOCI 125");
check("AoJ List B statistics slot folded (SOCI 125 anchor)", !!aoj);
check("AoJ statistics slot lists MATH 110 as an alternative",
  aoj && (aoj.alts || []).some((a) => ns(a) === ns("MATH 110")));
// African American Studies (dup 'Required Core' section) folded correctly
const afs = slotWithCid("african-american-studies", "Required Core", "AFS 140");
check("AAS Required Core folded across the duplicate section name (AFS 140 anchor)", !!afs);
check("AAS AFS 140 slot lists AFS 141 as an alternative",
  afs && (afs.alts || []).some((a) => ns(a) === ns("AFS 141")));

// No PARTIAL loss: a group either fully survives (as slot cids + alts) or — if it
// was skipped for having no existing-slot anchor (e.g. studio-art's ARTS 280/281/282
// that the parser never lifted into slots) — is wholly absent. A group with SOME
// members present and some missing would mean a fold dropped a real requirement.
let partialLoss = 0;
overlay.groups.forEach((g) => {
  const present = new Set();
  (tmpl[g.tmc].sections || []).forEach((s) => s.slots.forEach((sl) => {
    if (sl.cid) present.add(ns(sl.cid));
    (sl.alts || []).forEach((a) => present.add(ns(a)));
  }));
  const have = g.cids.filter((c) => present.has(ns(c))).length;
  if (have > 0 && have < g.cids.length) partialLoss++;
});
check("no fold partially drops a group's members (all-or-nothing)", partialLoss === 0);

// ── Part B — consumer: a slot's ALT auto-matches a local course ───────────────
const builderSrc = fs.readFileSync("tmc_builder.js", "utf8");
const html = `<!DOCTYPE html><html><body>
  <div class="cpl-tab-pane" id="tab-tmc-builder"><div class="main-container">
    <div id="tmc-builder-root"></div>
  </div></div></body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

window.CPL_TMC_TEMPLATES = {
  _meta: { draft: true, sources: {} },
  templates: [{
    id: "test-or", discipline: "Test OR", degree: "AS-T", status: "draft", version: "draft", total_units: 6,
    sections: [{ name: "Required Core", select: "all", units: "6", slots: [
      { cid: "BUS 100", title: "Statistics", units: "3", alts: ["BUS 200"] }, // OR slot — college carries the ALT
      { cid: "ENG 100", title: "Composition", units: "3" }                     // control, primary match
    ]}]
  }]
};
const courses = [
  ["MATH", "12", "Elementary Statistics", 3, "BUS 200"], // carries the ALT (not the primary BUS 100)
  ["ENGL", "1", "Composition", 3, "ENG 100"]
];
window.CPL_TMC_COLLEGE_COURSES = { _meta: {}, colleges: ["Test College"], courses: { "0": courses } };
window.CPL_TMC_GE_PATTERNS = { _meta: {}, patterns: [] };
window.CPL_TMC_COLLEGE_ADTS = { _meta: { unmatched_colleges: {} }, extra_tmcs: [], by_college: {}, tmc_totals: {} };
window.fetch = function () { return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };

let threw = false;
try { window.eval(builderSrc); } catch (e) { threw = true; console.error("eval threw:", e); }
check("tmc_builder.js evaluates without throwing", !threw);
window.CPL_TMC_BUILDER.boot();

function selectVal(sel, val) { sel.value = val; sel.dispatchEvent(new window.Event("change")); }
function rowFor(re) { return Array.prototype.filter.call(document.querySelectorAll("#tab-tmc-builder .tmc-listrow"), (r) => re.test(txt(r)))[0]; }

(async function () {
  selectVal(document.getElementById("tmc-college-sel"), "Test College");
  await sleep(0);
  selectVal(document.getElementById("tmc-status-filter"), "all");
  await sleep(0);
  rowFor(/Test OR/).click();
  await sleep(0);

  const btns = document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn");
  check("OR slot auto-matches the local course carrying the ALT C-ID (BUS 200)", /MATH\s*12/.test(txt(btns[0])));
  const left0 = txt(document.querySelectorAll("#tab-tmc-builder .tmc-left")[0]);
  check("left side renders the 'or <alt>' hint (or BUS 200)", /or\s*BUS\s*200/.test(left0));
  const ok = document.querySelectorAll("#tab-tmc-builder .tmc-status.ok");
  check("an ALT match is ✓ C-ID aligned (same tier)", ok.length >= 1 &&
    Array.prototype.some.call(ok, (p) => /C-ID aligned/.test(txt(p))));

  let failed = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed."));
  process.exit(failed ? 1 : 0);
})();
