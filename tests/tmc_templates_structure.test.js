// TMC templates — structure + flexibility metadata invariants on the COMMITTED
// tmc_templates.js (built by tmc/_parse_tmc_pdfs.py). Guards the Session-66
// refinement: every TMC has >=1 C-ID slot (the African American Studies 0-C-ID
// parse bug — embedded "C-ID AFS 100" — is fixed), embedded C-IDs are recovered,
// flexible provisos are flagged (the acceptance-engine tier-2 metadata), and each
// TMC carries a flexibility classification.
//
// Run from repo root: `npm test` (or `node tests/tmc_templates_structure.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dom = new JSDOM("<!DOCTYPE html><body></body>", { runScripts: "outside-only" });
dom.window.eval(fs.readFileSync("tmc_templates.js", "utf8"));
const TT = dom.window.CPL_TMC_TEMPLATES;
const templates = (TT && TT.templates) || [];

check("templates parse to a non-empty list", templates.length >= 45);

const drafted = templates.filter((t) => t.sections && t.sections.length);
function cidSlots(t) {
  return (t.sections || []).flatMap((s) => s.slots).filter((sl) => sl.cid);
}
function flexSlots(t) {
  return (t.sections || []).flatMap((s) => s.slots).filter((sl) => sl.flexible);
}

// (1) the core repair: NO TMC with sections has zero C-ID slots
const empty = drafted.filter((t) => cidSlots(t).length === 0).map((t) => t.id);
check("every TMC with sections carries >=1 C-ID slot (no 0-C-ID templates)", empty.length === 0);

// (2) embedded-C-ID recovery worked on the known cases
function hasCid(id, cid) {
  const t = templates.find((x) => x.id === id);
  return t && cidSlots(t).some((sl) => sl.cid === cid);
}
// present as a slot cid OR a fold-alt (Session 90 folds "X OR Y" → cid X + alts[Y])
function hasCidOrAlt(id, cid) {
  const t = templates.find((x) => x.id === id);
  return t && (t.sections || []).flatMap((s) => s.slots)
    .some((sl) => sl.cid === cid || (sl.alts || []).includes(cid));
}
check("African American Studies recovered AFS 100/140/141 from inline 'C-ID …'",
  hasCid("african-american-studies", "AFS 100") &&
  hasCid("african-american-studies", "AFS 140") &&
  // AFS 141 is now an OR-alternative of AFS 140 (Session 90 fold), not a separate slot
  hasCidOrAlt("african-american-studies", "AFS 141"));
check("Studio Art recovered the embedded ARTS token C-IDs",
  hasCid("studio-art", "ARTS 230") && hasCid("studio-art", "ARTS 240"));

// (3) flexible-proviso flags exist and are well-formed (noncid, no cid)
const allFlex = templates.flatMap((t) => flexSlots(t));
check("flexible proviso slots are flagged across the catalog (>=80)", allFlex.length >= 80);
check("every flexible slot is a non-C-ID proviso (flagged, no cid)",
  allFlex.every((sl) => sl.flexible === true && !sl.cid && sl.noncid));

// (4) per-TMC flexibility classification is present + consistent
check("every TMC-with-sections has flexibility in {fixed, flexible}",
  drafted.every((t) => t.flexibility === "fixed" || t.flexibility === "flexible"));
check("'fixed' TMCs have no flexible slots and no select-N list",
  drafted.filter((t) => t.flexibility === "fixed").every((t) =>
    flexSlots(t).length === 0 && (t.sections || []).every((s) => s.select === "all")));
const byId = (id) => templates.find((t) => t.id === id);
check("Chemistry is fixed, Psychology is flexible (sanity anchors)",
  byId("chemistry").flexibility === "fixed" && byId("psychology").flexibility === "flexible");

let failed = 0;
results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) failed++; });
console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed."));
process.exit(failed ? 1 : 0);
