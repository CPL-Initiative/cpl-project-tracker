// Guards the CCR Suggested-merges worklist's NEW "co-articulation family" section
// (2026-06-04) — near-duplicate M-IDs that the level-safe _sug_sig misses,
// surfaced because they co-articulate to one credential AND share the ordinal-rule
// family key. Validates the committed producer output (unified_courses_suggestions.js)
// directly (no jsdom needed — the pii_guard pattern), since the worklist consumer
// is auth-gated. The key invariants:
//   - family_groups exists and every group has >= 2 members;
//   - NO group spans more than one M-ID subject prefix (the cross-discipline gate
//     that keeps AUTO+AVIA etc. apart);
//   - the EMT Certification cluster surfaced and leads with the canonical
//     "Emergency Medical Technician" identity (the default merge target);
//   - the ordinal rule held (no member set mixes a bare/“I” course with a “II”/“2”).
//
// Run from repo root: `npm test` (or `node tests/uc_family_merges.test.js`).
const fs = require("fs");

function loadSuggestions() {
  const src = fs.readFileSync("unified_courses_suggestions.js", "utf8");
  const i = src.indexOf("window.CPL_UC_SUGGESTIONS");
  let s = src.slice(src.indexOf("=", i) + 1).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
}

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const subj = (id) => String(id).split(" ", 1)[0];   // "EMST M1064" → "EMST"
// Family key as a CONSUMER-side replica of the producer's ordinal rule, to assert
// no group illegally mixes ordinal levels (bare/I together with II/2+).
const FAM_FORMAT = new Set(["basic","training","academy","preparation","prep","certificate","course","application","module","part","semester","program"]);
const FAM_DROP = new Set(["the","of","to","and","for","with","in","a","an","on","at","as","or"]);
const ROMAN = { i:"1", ii:"2", iii:"3", iv:"4", v:"5", vi:"6", vii:"7", viii:"8", ix:"9" };
function famKey(title) {
  let t = String(title || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9 ]+/g, " ");
  const toks = [];
  t.split(/\s+/).filter(Boolean).forEach((w) => {
    if (w === "emt") toks.push("emergency", "medical", "technician");
    else if (w === "tech") toks.push("technician");
    else toks.push(w);
  });
  const keep = [];
  toks.forEach((w) => {
    if (w.length === 1 && !/[0-9]/.test(w)) return;
    if (FAM_DROP.has(w) || FAM_FORMAT.has(w)) return;
    if (ROMAN[w]) w = ROMAN[w];
    if (/^[0-9]+$/.test(w)) { if (w === "1" || w.length >= 2) return; }
    keep.push(w);
  });
  return Array.from(new Set(keep)).sort().join(" ");
}

const data = loadSuggestions();
const fg = data.family_groups || [];

check("family_groups present in the payload", Array.isArray(fg) && fg.length > 0);
check("family_count matches the array length", data.family_count === fg.length);
check("every family group has >= 2 members", fg.every((g) => (g.members || []).length >= 2));
check("no family group spans >1 M-ID subject prefix (cross-discipline gate)",
  fg.every((g) => new Set(g.members.map((m) => subj(m.id))).size === 1));
check("every member is an M-ID/Unified surrogate (not an anchor or stand-alone)",
  fg.every((g) => g.members.every((m) => m.k === "M-ID" || m.k === "Unified")));
check("every group carries its driving credential", fg.every((g) => !!g.credential));
check("members within a group share ONE family key (ordinal rule held — no I/II mix)",
  fg.every((g) => new Set(g.members.map((m) => famKey(m.t))).size === 1));

// The motivating cluster: EMT Certification.
const emt = fg.find((g) => g.credential === "EMT Certification");
check("EMT Certification family group surfaced", !!emt);
if (emt) {
  check("EMT group folds >= 5 near-duplicate M-IDs", emt.members.length >= 5);
  check("EMT group is all EMST identities", emt.members.every((m) => subj(m.id) === "EMST"));
  check("EMT group leads with the canonical 'Emergency Medical Technician' (default merge target)",
    /^emergency medical technician$/i.test((emt.members[0].t || "").trim()));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
