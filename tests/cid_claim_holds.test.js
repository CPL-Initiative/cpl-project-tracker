// COCI C-ID claims set aside (SkyHarbor, 2026-11-06). Sam, on Sierra College's CPL Pathways visual: "the HIST
// course should not be recommend for Basic Training... Definitely don't want Sierra recommending this."
// Moreno Valley College's COCI row for HES 1 Health Science claims HIST 150 (World History to 1500), with no ASCCC
// approval behind it, so Basic Military Training read as a peer path to every world history course: in the CPL
// Pathways visual and workbook, unified_courses_aligned.js, and Sierra's chatbox_peer_articulations. Pins:
//   - each hold names its course, the claim, a home and four signals, and who held it when;
//   - kb/coci_articulations.json keys no record to a held claim on the held course, and the held college has left
//     the claimed C-ID's offering list and every one of its records' could-adopt lists;
//   - Moreno Valley's Basic Military Training record sits in HLTH M1148 with Norco and Riverside City;
//   - the member export blanks a held claim and seats the course in its home; the daily run audits for new ones;
//   - Sierra's peer table is built from the same articulation file, so the move reaches her on the next sync.
//
// Run from repo root: `npm test` (or `node tests/cid_claim_holds.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const norm = (x) => String(x || "").trim().split(/\s+/).join(" ").toUpperCase();

const holds = JSON.parse(fs.readFileSync("kb/reference/cid_claim_holds.json", "utf8")).holds;
const art = JSON.parse(fs.readFileSync("kb/coci_articulations.json", "utf8"));
const exp = fs.readFileSync("excel_to_dashboard.py", "utf8");
// The daily's build commands live in scripts/daily_build.sh, run by its one build step (S641): read in place.
const daily = fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8").replace("run: bash scripts/daily_build.sh", "run: bash scripts/daily_build.sh\n" + fs.readFileSync("scripts/daily_build.sh", "utf8"));
const peer = fs.readFileSync("kb/_build_peer_articulations.py", "utf8");

check("each hold names its course, the claim, a home, four signals, and who held it when", holds.length >= 1 && holds.every((h) =>
  h.control_number && h.college && h.course && h.claimed_cid && h.home && Array.isArray(h.signals) && h.signals.length >= 4
  && h.held_by && /^\d{4}-\d{2}-\d{2}$/.test(h.held_on || "")));
check("Moreno Valley's HES 1 claim on HIST 150 is held, homed in HLTH M1148", holds.some((h) => h.control_number === "CCC000520534"
  && h.claimed_cid === "HIST 150" && h.home === "HLTH M1148"));

const onHeld = (r, h) => r.course_id === h.claimed_cid && (r.earned_by_colleges || []).indexOf(h.college) >= 0
  && (r.local_courses || []).length && (r.local_courses || []).every((c) => norm(c.subject + " " + c.number) === norm(h.course));
check("no articulation record keys a held claim on the held course", !art.articulations.some((r) => holds.some((h) => onHeld(r, h))));
check("the held college has left the claimed C-ID's offering list", holds.every((h) =>
  ((art.identities[h.claimed_cid] || {}).colleges_offering || []).indexOf(h.college) < 0));
check("and every could-adopt list of that C-ID's records", holds.every((h) => !art.articulations.some((r) =>
  r.course_id === h.claimed_cid && (r.adoption_leverage || []).indexOf(h.college) >= 0)));
check("no Basic Military Training record on HIST 150", !art.articulations.some((r) => r.course_id === "HIST 150" && /Basic Military Training/.test(r.unified_title)));
const bmt = art.articulations.find((r) => r.course_id === "HLTH M1148" && r.exhibit_id === "MAPMM-BMT1-1-001");
check("Moreno Valley's Basic Military Training sits in HLTH M1148 beside Norco and Riverside City", !!bmt
  && ["Moreno Valley College", "Norco College", "Riverside City College"].every((c) => bmt.earned_by_colleges.indexOf(c) >= 0)
  && bmt.adoption_leverage.indexOf("Moreno Valley College") < 0 && bmt.adoption_leverage_count === bmt.adoption_leverage.length);
check("the file's totals agree with its records", art.articulation_records === art.articulations.length
  && art.total_adoption_leverage === art.articulations.reduce((n, r) => n + (r.adoption_leverage || []).length, 0));
check("a receipt keeps the before-values", fs.readdirSync("kb/cid_claim_holds_out").some((f) => {
  if (!/^applied_.*\.json$/.test(f)) return false;
  const r = JSON.parse(fs.readFileSync("kb/cid_claim_holds_out/" + f, "utf8"));
  return r.before && r.before.articulations && r.before.identities && r.moved && r.moved.length >= 1;
}));

check("the member export blanks a held claim", /if cidn and ctrl in CID_HOLDS and cidn == _nrm\(CID_HOLDS\[ctrl\]\.get\("claimed_cid"\)\):\s*\n\s*cidn = ""/.test(exp));
check("and seats the held course in its home", /CID_HOLDS = _cid_claim_holds\(\)/.test(exp) && /memships\.setdefault\(_home, \[\]\)\.append/.test(exp));
check("the daily run audits for new claims and keeps the audit", /python3 kb\/_audit_cid_claims\.py/.test(daily) && /git add kb\/cid_claim_audit\.json/.test(daily));
check("Sierra's peer table is built from the same articulation file", /kb", "coci_articulations\.json"/.test(peer));

const failed = results.filter((r) => !r[1]);
results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
console.log((results.length - failed.length) + "/" + results.length + " checks passed");
process.exit(failed.length ? 1 : 0);
