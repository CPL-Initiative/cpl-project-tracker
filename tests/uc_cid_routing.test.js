// Guards the C-ID ARTICULATION ROUTER (Phase 1 Session 42, widened
// STATEWIDE in Phase 3 Session 45 — docs/cid_articulation_authority_scope.md
// §4/§8): members with c-id.net per-college approvals display under their
// descriptor's official row and leave their M-ID's display.
//
//  1. The snippet row that started it: Folsom Lake MATH 400 "Calculus I"
//     renders in MATH 210's member table (no lexical rule could put it there).
//  2. Fully-routed M-IDs fold with provenance: the calc-I family M-ID (was
//     MATH M1104, era-dependent) is no longer a row and rides MATH 210's
//     routed_from; rfold counts routed identities.
//  3. The genuinely-mixed row splits below family grain: the "Calculus I"
//     M-ID residue (was MATH M1175, era-dependent) remains SHRUNKEN
//     (members < 13) and its member table no longer lists the routed
//     colleges (Folsom Lake gone).
//  4. Multi-descriptor approvals never auto-route: LA Pierce MATH 261 holds
//     both MATH 210 and MATH 211 approvals — it stays in M1175's table.
//  5. Phase 3: routing reaches beyond MATH (SPAN/AUTO/AJ descriptors carry
//     rfold) without disturbing the kin/Phase-B folds those rows already had.
//  6. Phase-3 honesty fix: a course approved under TWO descriptors in
//     different subjects (the MATH 110 ∧ SOCI 125 stats-pathway duals) is
//     HELD — Phase 1's MATH-only view auto-picked MATH 110 for these because
//     the gate hid the SOCI approval from the uniqueness test.
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

// 2. fully-routed M-ID folds with provenance. The folded id is DERIVED from
// MATH 210's own routed_from list, never pinned — re-mints re-sequence M-IDs
// with slot reuse (the fully-routed calc-I family M-ID rode MATH M1104 →
// M1098; a vacated id may hold an unrelated course next regen). The C-ID
// anchor id is official and stable; its provenance list travels with it.
const routed210 = (byId["MATH 210"] && byId["MATH 210"].routed_from) || [];
check("MATH 210 carries routed_from provenance (≥1 fully-routed MATH M-ID)",
  routed210.length >= 1 && routed210.every((id) => /^MATH M/.test(id)));
check("every routed_from M-ID is no longer a top-level row (folded with provenance)",
  routed210.length >= 1 && routed210.every((id) => !byId[id]));
check("MATH 210 counts routed identities (rfold ≥ 1)",
  byId["MATH 210"] && (byId["MATH 210"].rfold || 0) >= 1);

// 3. the mixed row splits below family grain — residue stays. The residue is
// the corroborated MATH M-ID still TITLED "Calculus 1" (was "Calculus I"
// before the 2026-06-12 title normalization folded romans→digits, and
// MATH M1175 pre-fold; found by title + shape since ids re-sequence — pick
// the largest if several).
const residue = data.rows.filter((r) =>
    r.id_system === "M-ID" && /^MATH M1\d{3}$/.test(r.id) && (r.title || "") === "Calculus 1")
  .sort((a, b) => (b.members || 0) - (a.members || 0))[0];
check("the 'Calculus 1' M-ID residue remains as a shrunken row (members < 13)",
  residue && typeof residue.members === "number" && residue.members > 0 && residue.members < 13);
const t1175 = residue ? tableOf(residue.id) : [];
check("the residue's member table no longer lists Folsom Lake (routed out)",
  t1175.length > 0 && !t1175.some((m) => /Folsom Lake/.test(m.college)));

// 4. multi-descriptor approvals never auto-route
check("LA Pierce MATH 261 (approved for BOTH 210 and 211) stays in the residue's table",
  t1175.some((m) => /Pierce/.test(m.college) && m.n === "MATH 261"));

// 5. Phase 3 — routing reaches beyond MATH, prior folds undisturbed. The kin
// folds are asserted by their TITLES (carried on the anchor's title_variants),
// not by folded-M-ID pins — the Intermediate-Spanish-I family rode
// FLSP M1342 → M1090 in the 2026-06-12 fold.
check("SPAN 200 keeps its kin folds AND gains routed members (rfold)",
  byId["SPAN 200"]
  && (byId["SPAN 200"].consolidated_from || []).length >= 2
  && (byId["SPAN 200"].title_variants || []).indexOf("Intermediate Spanish 1") >= 0
  && (byId["SPAN 200"].title_variants || []).indexOf("Spanish 3") >= 0
  && (byId["SPAN 200"].rfold || 0) >= 1);
check("AUTO 120 X keeps descriptor title + kin folds AND gains rfold",
  byId["AUTO 120 X"]
  && byId["AUTO 120 X"].title === "Automatic Transmissions and Transaxles"
  && (byId["AUTO 120 X"].consolidated_from || []).length === 2
  && (byId["AUTO 120 X"].rfold || 0) >= 1);
const rfoldSubjects = new Set(
  data.rows.filter((r) => r.rfold).map((r) => r.id.split(" ")[0]));
check("rfold spans many descriptor subjects statewide (≥ 20)", rfoldSubjects.size >= 20);
check("AJ descriptors carry routed members (the screenshot family)",
  byId["AJ 200"] && (byId["AJ 200"].rfold || 0) >= 1);

// 6. multi-SUBJECT dual approvals are held, not auto-picked (Phase-3 honesty
// fix: these 4 stats courses hold MATH 110 ∧ SOCI 125 approvals; Phase 1
// auto-routed them to MATH 110 because its gate hid the SOCI side). Each is
// DERIVED by its unique TITLE — the 2026-06-12 fold moved SOCS M10CE → M10ID
// and SOCI M10FF → M10FC while RE-OCCUPYING the vacated slots with unrelated
// courses, so id pins would silently assert the wrong rows.
const standalone = loadPayload("unified_courses_standalone.js", "window.CPL_UC_STANDALONE");
const saByTitle = {};
(standalone.rows || standalone).forEach((r) => {
  (saByTitle[r.title] = saByTitle[r.title] || []).push(r.id);
});
// (the last two were ALL-CAPS in the raw catalog; the 2026-06-12 title
// normalization re-cased every displayed title, so pin the Title Case form)
[
  "Statistics - Social Sciences",
  "Introductory Statistics for the Behavioral and Social Sciences",
  "Social Justice Statistics",
  "Statistical Methods in the Behavioral Sciences Honors",
].forEach((t) => {
  const ids = saByTitle[t] || [];
  check(`dual-approval stats course '${t}' stays a stand-alone (held for curation)`,
    ids.length === 1 && !byId[ids[0]]);
});

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length && results.length > 0 ? 0 : 1);
