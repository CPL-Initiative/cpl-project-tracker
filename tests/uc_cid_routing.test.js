// Guards the C-ID ARTICULATION ROUTER (Phase 1, Session 42 —
// docs/cid_articulation_authority_scope.md §4): members with c-id.net
// per-college approvals display under their descriptor's official row and
// leave their M-ID's display. MATH descriptors only in Phase 1.
//
//  1. The snippet row that started it: Folsom Lake MATH 400 "Calculus I"
//     renders in MATH 210's member table (no lexical rule could put it there).
//  2. Fully-routed M-IDs fold with provenance: MATH M1104 is no longer a row
//     and rides MATH 210's routed_from; rfold counts routed identities.
//  3. The genuinely-mixed row splits below family grain: MATH M1175 remains
//     as a SHRUNKEN residue (members < 13) and its member table no longer
//     lists the routed colleges (Folsom Lake gone).
//  4. Multi-descriptor approvals never auto-route: LA Pierce MATH 261 holds
//     both MATH 210 and MATH 211 approvals — it stays in M1175's table.
//  5. Regression: SPAN/AUTO rows untouched (no rfold outside MATH).
//
// Run from repo root: `npm test` (or `node tests/uc_cid_routing.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function loadPayload(file, globalName) {
  const src = fs.readFileSync(file, "utf8");
  const i = src.indexOf(globalName);
  let s = src.slice(src.indexOf("=", i) + 1).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
}

const data = loadPayload("unified_courses_data.js", "window.CPL_UNIFIED_COURSES");
const byId = {};
data.rows.forEach((r) => { byId[r.id] = r; });
const mem = loadPayload("unified_courses_members.js", "window.CPL_UC_MEMBERS");
const colleges = mem.colleges;
const tableOf = (id) => (mem.members[id] || []).map((m) => ({ college: colleges[m.c], n: m.n, t: m.t }));

// 1. the snippet row routed home
const m210 = tableOf("MATH 210");
check("Folsom Lake MATH 400 'Calculus I' renders in MATH 210's member table",
  m210.some((m) => /Folsom Lake/.test(m.college) && m.n === "MATH 400"));
check("MATH 210's row members count matches its member table", byId["MATH 210"]
  && byId["MATH 210"].members === m210.length);

// 2. fully-routed M-ID folds with provenance
check("MATH M1104 is no longer a top-level row", !byId["MATH M1104"]);
check("MATH 210 carries routed_from provenance for MATH M1104",
  byId["MATH 210"] && (byId["MATH 210"].routed_from || []).indexOf("MATH M1104") >= 0);
check("MATH 210 counts routed identities (rfold ≥ 1)",
  byId["MATH 210"] && (byId["MATH 210"].rfold || 0) >= 1);

// 3. the mixed row splits below family grain — residue stays
const m1175 = byId["MATH M1175"];
check("MATH M1175 remains as a shrunken residue row (members < 13)",
  m1175 && typeof m1175.members === "number" && m1175.members > 0 && m1175.members < 13);
const t1175 = tableOf("MATH M1175");
check("MATH M1175's member table no longer lists Folsom Lake",
  t1175.length > 0 && !t1175.some((m) => /Folsom Lake/.test(m.college)));

// 4. multi-descriptor approvals never auto-route
check("LA Pierce MATH 261 (approved for BOTH 210 and 211) stays in M1175's table",
  t1175.some((m) => /Pierce/.test(m.college) && m.n === "MATH 261"));

// 5. regression — routing is MATH-scoped
check("SPAN 200 keeps its folds, no rfold", byId["SPAN 200"]
  && (byId["SPAN 200"].consolidated_from || []).indexOf("FLSP M1342") >= 0
  && !byId["SPAN 200"].rfold);
check("AUTO 120 X untouched (descriptor title, kin folds, no rfold)", byId["AUTO 120 X"]
  && byId["AUTO 120 X"].title === "Automatic Transmissions and Transaxles"
  && (byId["AUTO 120 X"].consolidated_from || []).length === 2
  && !byId["AUTO 120 X"].rfold);
check("no rfold appears outside MATH descriptors",
  data.rows.every((r) => !r.rfold || r.id.startsWith("MATH")));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length && results.length > 0 ? 0 : 1);
