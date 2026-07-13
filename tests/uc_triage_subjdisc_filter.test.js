// Guards that the subject_discipline_outlier audit tag is actually reachable
// from the Unified Courses "Triage" dropdown. Regression: the tag shipped with
// a label + penalty (PR #761) but was NOT added to the Triage <select>, its
// predicate map, or the deep-link whitelist — so a curator couldn't filter to
// it. This pins all four sync points so the next tag can't half-land.
//
// More generally: every named per-tag TRIAGE_PRED entry must also appear as a
// dropdown option (fTriage) — an orphaned predicate is a dead filter.
const fs = require("fs");

const src = fs.readFileSync("unified_courses.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const LABEL = "Subject-code outlier (likely mis-mint)";
const TAG = "subject_discipline_outlier";

// (1) Dropdown option present (inside the fTriage sel([...]) list).
const fTriageBlock = (src.match(/sel\("uc-triage"[\s\S]*?\]\);/) || [""])[0];
check("triage dropdown lists the subject-code outlier option",
  fTriageBlock.indexOf('"' + LABEL + '"') >= 0);

// (2) Predicate exists and checks the right tag.
const predRe = new RegExp('"' + LABEL.replace(/[()]/g, "\\$&")
  + '":\\s*function \\(c\\) \\{[^}]*indexOf\\("' + TAG + '"\\)');
check("triage predicate maps the label to the subject_discipline_outlier tag",
  predRe.test(src));

// (3) Deep-link whitelist (QS_TRIAGE) includes the label so a shared URL restores it.
const qsBlock = (src.match(/var QS_TRIAGE = \{[\s\S]*?\};/) || [""])[0];
check("QS_TRIAGE whitelist includes the label (deep-linkable)",
  qsBlock.indexOf('"' + LABEL + '"') >= 0);

// (4) Sync invariant: every named TRIAGE_PRED label (i.e. every per-tag lane,
//     excluding the two aggregate lanes) is also offered in the dropdown.
const predBlock = (src.match(/var TRIAGE_PRED = \{[\s\S]*?\n    \};/) || [""])[0];
const predLabels = (predBlock.match(/"[^"]+":\s*function/g) || [])
  .map((s) => s.slice(1, s.indexOf('":')));
const AGGREGATE = new Set(["Any audit flag", "3+ findings", "Unified issues"]);
const orphaned = predLabels.filter((l) => !AGGREGATE.has(l) && fTriageBlock.indexOf('"' + l + '"') < 0);
check("no orphaned TRIAGE_PRED lane (every predicate has a dropdown option): "
  + (orphaned.length ? orphaned.join(", ") : "none"), orphaned.length === 0);

let failed = 0;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
