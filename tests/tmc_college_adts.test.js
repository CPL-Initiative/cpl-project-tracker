// TMC Builder — per-college approved-ADT overlay (window.CPL_TMC_COLLEGE_ADTS,
// built by tmc/_build_college_adts.py from the COCI program export). Guards:
//   Part A — build-correctness invariants on the COMMITTED artifact:
//     * shape (_meta / by_college / extra_tmcs / tmc_totals)
//     * every tmc_id used resolves to a real TMC template id OR a UC Transfer
//       Pathway extra id (no orphan keys)
//     * every college key joins to the tab's own college list (the loose
//       COCI-program names were reconciled to the full course-export names)
//     * every record bucket is one of the four known buckets
//     * the UCTP pathways are their OWN instances (not folded into Chem/Physics)
//   Part B — the tab wiring (jsdom) with controlled mock data:
//     * the directory gains an ADT column (statewide count in review mode; the
//       college's status when one is picked) + the "this college's ADTs" filter
//     * the detail header shows the approved / not-established banner
//     * a UC Transfer Pathway row opens its own minimal pathway detail
//
// Run from repo root: `npm test` (or `node tests/tmc_college_adts.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Part A — invariants on the committed artifact
// ─────────────────────────────────────────────────────────────────────────────
const adom = new JSDOM("<!DOCTYPE html><body></body>", { runScripts: "outside-only" });
adom.window.eval(fs.readFileSync("tmc_college_adts.js", "utf8"));
adom.window.eval(fs.readFileSync("tmc_templates.js", "utf8"));
adom.window.eval(fs.readFileSync("tmc_college_courses.js", "utf8"));
const A = adom.window.CPL_TMC_COLLEGE_ADTS;
const TT = adom.window.CPL_TMC_TEMPLATES;
const tabColleges = new Set(adom.window.CPL_TMC_COLLEGE_COURSES.colleges);

check("overlay parses to an object", A && typeof A === "object");
check("has _meta + by_college + extra_tmcs + tmc_totals",
  A._meta && A.by_college && Array.isArray(A.extra_tmcs) && A.tmc_totals);
check("by_college is non-empty (every CA college with an ADT)",
  Object.keys(A.by_college || {}).length > 100);

const templateIds = new Set((TT.templates || []).map((t) => t.id));
const extraIds = new Set((A.extra_tmcs || []).map((x) => x.id));
const validIds = new Set([...templateIds, ...extraIds]);
const BUCKETS = new Set(["approved", "in_progress", "teachout", "inactive"]);

let orphanTmc = 0, badBucket = 0, badCollege = 0, recCount = 0;
Object.keys(A.by_college || {}).forEach((college) => {
  if (!tabColleges.has(college)) badCollege++;
  const m = A.by_college[college];
  Object.keys(m).forEach((tid) => {
    recCount++;
    if (!validIds.has(tid)) orphanTmc++;
    if (!BUCKETS.has(m[tid].b)) badBucket++;
  });
});
check("every tmc_id resolves to a template or UCTP-pathway id (no orphans)", orphanTmc === 0);
check("every record carries a known bucket", badBucket === 0);
check("every college key joins to the tab's college list (name reconciliation)", badCollege === 0);
check("the build resolved every college (no _meta.unmatched_colleges)",
  A._meta.unmatched_colleges && Object.keys(A._meta.unmatched_colleges).length === 0);
check("overlay carries a meaningful number of (college,TMC) records", recCount > 2000);

// UCTP pathways are their own instances, NOT folded into Chemistry/Physics
const uctpChem = (A.extra_tmcs || []).filter((x) => x.id === "uctp-chemistry")[0];
const uctpPhys = (A.extra_tmcs || []).filter((x) => x.id === "uctp-physics")[0];
check("UCTP Chemistry is its own instance (uc-transfer-pathway)",
  uctpChem && uctpChem.kind === "uc-transfer-pathway" && /UC Transfer/.test(uctpChem.title));
check("UCTP Physics is its own instance", uctpPhys && uctpPhys.kind === "uc-transfer-pathway");
check("uctp-* ids are NOT template ids (kept distinct from the 45 ASCCC TMCs)",
  !templateIds.has("uctp-chemistry") && !templateIds.has("uctp-physics"));

// statewide totals are present + sane for a well-adopted TMC
const ba = A.tmc_totals["business-administration"];
check("tmc_totals has Business Administration with approved colleges", ba && ba.approved > 50);

// ─────────────────────────────────────────────────────────────────────────────
// Part B — tab wiring with mock data (jsdom)
// ─────────────────────────────────────────────────────────────────────────────
const builderSrc = fs.readFileSync("tmc_builder.js", "utf8");
check("tmc_builder.js lazy-loads the ADT overlay", /tmc_college_adts\.js/.test(builderSrc));
check("tmc_builder.js defines the ADT helpers", /function adtFor\(/.test(builderSrc) && /function adtBannerEl\(/.test(builderSrc));
check("STATUS_META gained the UC Transfer Pathway state", /pathway:\s*\{[^}]*UC Transfer Pathway/.test(builderSrc));

const html = `<!DOCTYPE html><html><body>
  <div class="cpl-tab-pane" id="tab-tmc-builder"><div class="main-container">
    <div id="tmc-builder-root"></div>
  </div></div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

window.CPL_TMC_TEMPLATES = {
  _meta: { draft: true, sources: {} },
  templates: [
    { id: "test-official", discipline: "Test Official", degree: "AS-T", status: "official", version: "2026",
      total_units: 6, sections: [{ name: "Required Core", select: "all", units: "6",
        slots: [{ cid: "BIOL 110", title: "General Biology", units: "3" }] }] },
    { id: "test-psych", discipline: "Test Psychology", degree: "AA-T", status: "draft", version: "draft",
      total_units: 6, sections: [{ name: "Required Core", select: "all", units: "6",
        slots: [{ cid: "PSY 110", title: "Introductory Psychology", units: "3" }] }] }
  ]
};
window.CPL_TMC_COLLEGE_COURSES = {
  colleges: ["Test College", "Other College"],
  courses: { "0": [["BIOL", "10", "General Biology", 3, "BIOL 110"]], "1": [] }
};
window.CPL_TMC_GE_PATTERNS = { _meta: {}, patterns: {} };
// the overlay: Test College has Test Official APPROVED + the UCTP chem pathway,
// but NOT Test Psychology → that one reads "not established".
window.CPL_TMC_COLLEGE_ADTS = {
  _meta: { unmatched_colleges: {} },
  extra_tmcs: [{ id: "uctp-chemistry", title: "Chemistry for UC Transfer", degree: "AS", kind: "uc-transfer-pathway" }],
  by_college: {
    "Test College": {
      "test-official": { b: "approved", s: "Active", c: "12345", a: "2019-05-01", u: "18", t: "Test Official" },
      "uctp-chemistry": { b: "approved", s: "Active", c: "67890", a: "2022-01-01", u: "30", t: "UCTP Chemistry" }
    }
  },
  tmc_totals: {
    "test-official": { approved: 12, in_progress: 1, teachout: 0, inactive: 0, colleges: 13 },
    "test-psych": { approved: 3, in_progress: 0, teachout: 0, inactive: 0, colleges: 3 },
    "uctp-chemistry": { approved: 5, in_progress: 0, teachout: 0, inactive: 0, colleges: 5 }
  }
};
window.fetch = function () { return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };

let threw = false;
try { window.eval(builderSrc); } catch (e) { threw = true; console.error("eval threw:", e); }
check("tmc_builder.js evaluates without throwing", !threw);
window.CPL_TMC_BUILDER.boot();

function selectVal(sel, val) { sel.value = val; sel.dispatchEvent(new window.Event("change")); }
function listRows() { return document.querySelectorAll("#tab-tmc-builder .tmc-listrow"); }
function rowFor(re) { return Array.prototype.filter.call(listRows(), (r) => re.test(txt(r)))[0]; }
function theadTxt() { return txt(document.querySelector("#tab-tmc-builder .tmc-listtable thead")); }

(async function () {
  // ── review mode (All colleges): statewide approved column + UCTP pathway row ──
  check("directory includes the UCTP pathway as its own row",
    !!rowFor(/Chemistry for UC Transfer/));
  const pathChip = rowFor(/Chemistry for UC Transfer/) &&
    rowFor(/Chemistry for UC Transfer/).querySelector(".tmc-stchip.path");
  check("the UCTP row carries a '◆ UC Transfer Pathway' chip", pathChip && /UC Transfer Pathway/.test(txt(pathChip)));
  check("review mode shows an 'Approved (CA)' statewide column", /Approved \(CA\)/.test(theadTxt()));
  check("a TMC row shows its statewide approved-college count",
    /12 colleges/.test(txt(rowFor(/Test Official/))));

  // ── pick a college → the column becomes the college's own status ──
  selectVal(document.getElementById("tmc-college-sel"), "Test College");
  await sleep(0);
  check("column header switches to \"This college's ADT\"", /This college's ADT/.test(theadTxt()));
  check("an approved TMC shows a ✓ Approved chip", /✓ Approved/.test(txt(rowFor(/Test Official/))));
  check("a not-established TMC shows a '—' in the ADT column",
    /—/.test(txt(rowFor(/Test Psychology/).querySelector(".tmc-adt"))));
  const stf = document.getElementById("tmc-status-filter");
  check("the Show filter gains a 'this college's approved ADTs' option",
    Array.prototype.some.call(stf.options, (o) => o.value === "adt-yes"));

  // ── filter to the college's approved ADTs ──
  selectVal(stf, "adt-yes");
  await sleep(0);
  check("the adt-yes filter keeps only this college's approved rows (Official + UCTP)",
    listRows().length === 2 && !rowFor(/Test Psychology/));

  // ── open the approved TMC → green 'has an approved ADT' banner ──
  selectVal(stf, "all"); await sleep(0);
  rowFor(/Test Official/).click(); await sleep(0);
  const banner = document.querySelector("#tab-tmc-builder .tmc-adtbanner.adt-ok");
  check("approved TMC detail shows a green 'has an approved ADT' banner",
    banner && /has an .*approved.*ADT/.test(txt(banner)) && /Control #12345/.test(txt(banner)));

  // ── open a not-established TMC → the invitation banner ──
  document.querySelector("#tab-tmc-builder .tmc-back").click(); await sleep(0);
  rowFor(/Test Psychology/).click(); await sleep(0);
  const none = document.querySelector("#tab-tmc-builder .tmc-adtbanner.adt-none");
  check("not-established TMC detail shows the 'hasn’t established' invitation banner",
    none && /hasn’t established/.test(txt(none)));

  // ── open the UCTP pathway → its own minimal pathway detail (no slot builder) ──
  document.querySelector("#tab-tmc-builder .tmc-back").click(); await sleep(0);
  rowFor(/Chemistry for UC Transfer/).click(); await sleep(0);
  check("UCTP pathway opens its own detail (UC Transfer Pathway explainer)",
    /UC Transfer Pathway/.test(txt(document.querySelector("#tab-tmc-builder .tmc-reviewbar"))));
  check("UCTP pathway detail has NO C-ID slot builder", document.querySelectorAll("#tab-tmc-builder .tmc-section").length === 0);
  check("UCTP pathway detail shows the college's approved banner",
    !!document.querySelector("#tab-tmc-builder .tmc-adtbanner.adt-ok"));

  // ── report ──
  let failed = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed."));
  process.exit(failed ? 1 : 0);
})();
