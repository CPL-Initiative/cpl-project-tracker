// CPL Pathways — Common Course Reference enrichment (cpl_pathways_ccr_data.js) test.
//
// Guards the generator's (kb/_build_cpl_pathway_ccr.py) failure modes on the
// committed artifact:
//  (a) the payload parses and is keyed "<NORMCOLLEGE>|<top4>", one per baccalaureate;
//  (b) FIELD-FROM-CATALOG — the join must NOT field-filter on coci_articulations'
//      2-digit TOP division ("58"); Santa Ana Automotive (…|0948) must resolve a
//      full articulated set (the bug that returned 0 when it filtered on "0948"
//      against a "58"-stamped articulation);
//  (c) every reference has a kind in {CCN, C-ID, CCR} and a non-empty id;
//  (d) FLAG PRECISION — a `flag` is only the cross_field_merge kind, and it fires
//      on the AUTO 116 → Construction (CNST) over-merge while the clean automotive
//      M-IDs (e.g. AUTO 118) carry NO flag (the miscalibrated 2-digit-division flag
//      false-positived on legit courses);
//  (e) course-grain opportunity shape — Santa Ana's AUTO 218 surfaces as an
//      adoption opportunity (a course it teaches that a peer articulates);
//  (f) certs are listed (AUTO 102 carries its many local + high-school pathways).
//
// Run from repo root: `npm test` (or `node tests/cpl_pathway_ccr.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const src = fs.readFileSync("cpl_pathways_ccr_data.js", "utf8");
const dom = new JSDOM("<body></body>", { runScripts: "outside-only" });
dom.window.eval(src);
const payload = dom.window.CPL_PATHWAY_CCR;

check("payload parses", payload && typeof payload === "object");
check("has pathways map", payload && payload.pathways && typeof payload.pathways === "object");
const paths = (payload && payload.pathways) || {};
check("count matches keys", payload && payload.count === Object.keys(paths).length);
check("keyed '<COLLEGE>|<top4>'", Object.keys(paths).every((k) => /\|\d{4}$/.test(k)));

// (b) field-from-catalog: Santa Ana Automotive resolves a non-empty articulated set
const sac = paths["SANTA ANA COLLEGE|0948"];
check("Santa Ana 0948 present", !!sac);
check("Santa Ana articulated non-empty (field-from-catalog, not the '58' bug)",
  sac && Array.isArray(sac.articulated) && sac.articulated.length >= 8);
check("Santa Ana units_total > 0", sac && typeof sac.units_total === "number" && sac.units_total > 0);

// (c) every reference well-formed
const KINDS = { CCN: 1, "C-ID": 1, CCR: 1 };
let refBad = 0, sawRef = 0;
Object.values(paths).forEach((p) => {
  (p.articulated || []).concat(p.opportunities || []).forEach((r) => {
    if (r.ref) { sawRef++; if (!KINDS[r.ref.kind] || !r.ref.id) refBad++; }
  });
});
check("saw references", sawRef > 0);
check("every reference kind∈{CCN,C-ID,CCR} with an id", refBad === 0);

// (d) flag precision
const byNum = {};
(sac ? sac.articulated : []).forEach((r) => { byNum[r.subj + " " + r.num] = r; });
const a118 = byNum["AUTO 118"];
check("AUTO 118 present & articulated", !!a118);
check("AUTO 118 (clean automotive M-ID) carries NO flag", a118 && !a118.flag);
check("AUTO 118 has field agreement (peers on same reference)", a118 && a118.agree >= 1);
const flagged = (sac ? sac.articulated : []).filter((r) => r.flag);
check("every flag is kind cross_field_merge", flagged.every((r) => r.flag.kind === "cross_field_merge"));
check("AUTO 116 (Electrical Fundamentals → Construction) is flagged",
  (byNum["AUTO 116"] && byNum["AUTO 116"].flag) ||
  (byNum["AUTO 116B"] && byNum["AUTO 116B"].flag) || false);

// (e) opportunity shape — AUTO 218 is an adoption opportunity for Santa Ana
const opp218 = (sac ? sac.opportunities : []).some(
  (o) => (o.my_courses || []).indexOf("AUTO 218") !== -1 && o.agree >= 1);
check("Santa Ana opportunity AUTO 218 (peer-proven course-grain gap)", opp218);

// (f) certs listed, incl. AUTO 102's many pathways
const a102 = byNum["AUTO 102"];
check("AUTO 102 lists multiple local certs (incl. high-school pathways)",
  a102 && Array.isArray(a102.certs) && a102.certs.length >= 5);

// (g) FEEDER FIELDS — a multidisciplinary program aggregates CPL across its
// lower-division feeder disciplines (Miramar Public Safety Management → Fire /
// EMS / AJ), and feeder courses legitimately in another TOP field are NOT
// false-flagged as over-merges.
const psm = paths["SAN DIEGO MIRAMAR COLLEGE|2199"];
check("Public Safety Management pathway present", !!psm);
check("PSM declares feeder fields (Fire/EMS/AJ)",
  psm && Array.isArray(psm.feeders) && psm.feeders.indexOf("2133") !== -1);
check("PSM pathway populated via feeders (was empty on program TOP alone)",
  psm && psm.articulated.length >= 10);
check("PSM surfaces Fire (FIPT) CPL courses",
  psm && psm.articulated.some((r) => r.subj === "FIPT"));
check("feeder courses are NOT false-flagged (flag uses each course's own field)",
  psm && psm.articulated.filter((r) => r.flag).length === 0);

// ── report ──
const fail = results.filter(([, ok]) => !ok);
results.forEach(([n, ok]) => { if (!ok) console.log("  ✗ " + n); });
console.log(`\ncpl_pathway_ccr: ${results.length - fail.length}/${results.length} checks passed`);
process.exit(fail.length ? 1 : 0);
