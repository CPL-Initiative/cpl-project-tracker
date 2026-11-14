// The S649 CVMA correction: three of a person's kb_curation rows, changed exactly as Sam answered and no further.
//
// WHY. Sam's Open Asks Sheet 195 card 4 (01:18Z 2026-11-14, "Fix both, remove the Water Treatment row"; cpl_memory
// sam-sheet-195-answers-2026-11-14) is the authority for three changes to rows a person saved on 2026-07-09 in field
// issuing_agency_additional_override: two veterinary rows take the right spelling, and the Water Treatment
// Facilities row goes. A person's rows always win (CLAUDE.md Rule 10), so this pins what keeps the write inside his
// answer: one plain statement (the runner and the repo's Supabase guard refuse a DO block); the writes hang on one
// guard (exactly three rows, the exact misspelled value, a reviewer outside @bot, the saved stamps) that raises when
// it fails; the updates change the value alone and name only the two veterinary rows; the delete names only the
// Water Treatment row in that field (its SWRCB issuer row is a different field and stays); each before-image comes
// back for the receipt; and the rollback restores all three. tests/kb_curation_guarded_sql_proof.py runs both files
// against a real Postgres before the apply.
//
// Run from repo root: `npm test` (or `node tests/cvma_three_rows_s649.test.js`).
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);
const code = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8").split("\n")
  .filter((l) => !/^\s*--/.test(l)).join("\n");

const fwd = code("kb/migrations/2026-11-14_s649_cvma_three_rows.sql");
const rb = code("kb/migrations/2026-11-14_s649_cvma_three_rows_rollback.sql");
const TYPO = "'alifornia Veterinary Medical Association (CVMA)'";
const RIGHT = "'California Veterinary Medical Association (CVMA)'";
const EMERG = "'_CREDENTIAL_REVIEW::Veterinary Assistance & Nursing: Emergency Procedures'";
const EQUIP = "'_CREDENTIAL_REVIEW::Veterinary Equipment, Operation, Instrumentation and Safety'";
const WATER = "'_CREDENTIAL_REVIEW::Water Treatment Facilities'";
const count = (s, re) => (s.match(re) || []).length;

check("(1) the forward file is one plain statement with no DO block, function or dollar quote",
  count(fwd, /;/g) === 1 && !/\bdo\s*\$|\$\$|\bplpgsql\b|\bcreate\b|\binsert\b|\btruncate\b|\bdrop\b/i.test(fwd));
check("(2) it writes one UPDATE and one DELETE, both on the guard",
  count(fwd, /\bupdate public\.kb_curation\b/g) === 1 && count(fwd, /\bdelete from public\.kb_curation\b/g) === 1
  && count(fwd, /where g\.ok and k\.course_id/g) === 2);
check("(3) the guard wants exactly the three rows, the misspelled value, a reviewer outside @bot and the saved stamps",
  /\(select count\(\*\) from target\) = 3/.test(fwd) && fwd.includes("t.value = " + TYPO)
  && /t\.reviewer_email not like '%@bot'/.test(fwd)
  && /t\.reviewed_at::timestamptz = e\.reviewed_at::timestamptz\) = 3/.test(fwd)
  && fwd.includes("'2026-07-09T00:37:39.286263+00:00'") && fwd.includes("'2026-07-09T00:37:42.376764+00:00'")
  && fwd.includes("'2026-07-09T00:38:14.078346+00:00'"));
check("(4) the field is issuing_agency_additional_override everywhere it is named",
  count(fwd, /field = '([a-z_]+)'/g) === count(fwd, /field = 'issuing_agency_additional_override'/g));
check("(5) the update sets the value alone, to the right spelling, on the two veterinary rows only",
  /set value = 'California Veterinary Medical Association \(CVMA\)'\s+from guard g, target t/.test(fwd)
  && !/set [^;]*reviewer_email|set [^;]*reviewed_at/.test(fwd)
  && new RegExp("k\\.course_id in \\(" + EMERG.replace(/[()&]/g, "\\$&") + ",\\s+"
    + EQUIP.replace(/[(),&]/g, "\\$&") + "\\)").test(fwd));
check("(6) the delete names the Water Treatment row in that field only",
  fwd.includes("where g.ok and k.course_id = " + WATER + "\n    and k.field = 'issuing_agency_additional_override'"));
check("(7) a failed guard raises (a non-constant cast), so the statement writes nothing",
  /else \('refused by the guard: target rows ' \|\| g\.target_rows/.test(fwd) && /::int::text::jsonb/.test(fwd)
  && /\(select count\(\*\) from fixed\) = 2 and \(select count\(\*\) from gone\) = 1/.test(fwd));
check("(8) each before-image comes back for the receipt",
  /'row_before', to_jsonb\(t\)/.test(fwd) && /'row_before', to_jsonb\(k\)/.test(fwd));
check("(9) the rollback restores the two values only where the corrected value still stands, and re-inserts the third",
  count(rb, /;/g) === 1 && rb.includes("set value = " + TYPO) && rb.includes("k.value = " + RIGHT)
  && /on conflict \(course_id, field\) do nothing/.test(rb) && rb.includes(WATER)
  && rb.includes("'2026-07-09T00:38:14.078346+00:00'") && !/\bdelete\b/i.test(rb));
check("(10) the rollback re-inserts the Water Treatment row under the person's address, not a cohort",
  /values \('_CREDENTIAL_REVIEW::Water Treatment Facilities', 'issuing_agency_additional_override',\s+'alifornia Veterinary Medical Association \(CVMA\)', '[^'@]+@[^'@]+', '2026-07-09T00:38:14\.078346\+00:00'\)/.test(rb)
  && !/@bot'/.test(rb));

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\ncvma_three_rows_s649.test.js: " + (results.length - failed.length) + "/" + results.length
  + " checks passed");
if (failed.length) process.exit(1);
