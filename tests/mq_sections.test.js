// Guards the MQ Handbook reference files (kb/reference/mq_sections.json +
// mq_disciplines.json) after the 2026-07-11 re-validation against the
// authoritative 19th-ed Disciplines Index (Sam-supplied PDF; receipt:
// kb/mq_validation_out/2026-07-11/validation_report.json).
//
//  A. Structural invariants: counts match, vocabularies set-equal, every
//     mq_list value in-domain, every entry carries label/pages.
//  B. The specific regressions the S111 text parse caused: Humanities and
//     Physical Education mis-binned as not_masters (both are master's-list —
//     curator-confirmed), PEDS missing its CCR 53414(b) cite, and eight
//     disciplines (Accounting, African American Studies, ...) dropped
//     entirely — which also silently narrowed the CCR fire-gate vocabulary.
//
// Run from repo root: `npm test` (or `node tests/mq_sections.test.js`).
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const root = path.join(__dirname, "..");
const sec = JSON.parse(fs.readFileSync(path.join(root, "kb/reference/mq_sections.json"), "utf8"));
const dis = JSON.parse(fs.readFileSync(path.join(root, "kb/reference/mq_disciplines.json"), "utf8"));

const d = sec.disciplines || {};
const keys = Object.keys(d);

// A. structure
check("sections count field matches entries", sec.count === keys.length);
check("disciplines count field matches list", dis.count === dis.disciplines.length);
check("vocabularies are set-equal", (() => {
  const a = new Set(keys), b = new Set(dis.disciplines);
  return a.size === b.size && [...a].every((k) => b.has(k));
})());
const DOMAIN = new Set(["masters", "not_masters", "both_lists", "noncredit_53412"]);
check("every mq_list value in domain", keys.every((k) => DOMAIN.has(d[k].mq_list)));
check("every entry has a label and printed_pages", keys.every((k) =>
  typeof d[k].mq_list_label === "string" && Array.isArray(d[k].printed_pages)));

// B. the specific fixes
check("Humanities is masters (Sam-confirmed 2026-07-11)", d["Humanities"] && d["Humanities"].mq_list === "masters");
check("Physical Education is masters (Sam-confirmed 2026-07-11)",
  d["Physical Education"] && d["Physical Education"].mq_list === "masters");
check("PEDS is masters with CCR 53414(b)", d["Physical Education Disabled Students"]
  && d["Physical Education Disabled Students"].mq_list === "masters"
  && d["Physical Education Disabled Students"].special_ccr === "CCR 53414(b)");
const ADDED = ["Accounting", "Adapted Computer Technology: Disabled Students Programs and Services",
  "Addiction Paraprofessional Training", "Aeronautics", "African American Studies",
  "Agricultural Business and Related Services", "Citizenship: Noncredit",
  "Specialized Instruction: Vocational Noncredit"];
check("the 8 dropped disciplines are present in both files", ADDED.every((k) =>
  d[k] && dis.disciplines.includes(k)));
check("Accounting is masters w/ CCR 53410.1", d["Accounting"]
  && d["Accounting"].mq_list === "masters" && d["Accounting"].special_ccr === "CCR 53410.1");
// dual-page both_lists rows must not regress to masters
const BOTH = ["Child Development/Early Childhood Education", "Communication Studies",
  "Nutritional Science/Dietetics", "Physics/Astronomy", "Speech Communication", "Theater Arts"];
check("dual-listed disciplines stay both_lists", BOTH.every((k) => d[k] && d[k].mq_list === "both_lists"));
check("Vocational stays noncredit_53412 (CCR 53412(j))", d["Vocational"]
  && d["Vocational"].mq_list === "noncredit_53412" && d["Vocational"].special_ccr === "CCR 53412(j)");

let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
