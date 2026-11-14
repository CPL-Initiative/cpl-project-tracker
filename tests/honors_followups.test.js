// The S652 Honors follow-ups: the committed migration pair is the tool's, one guarded statement that updates two
// title values and inserts two Keep as-is rows, and its rollback undoes exactly that.
//
// WHY. After Sam's Sheet 197 card 2 delete (run 43607926526), HUMA M1110 and LIBR M1040 hold no Honors course yet
// keep the June auto-merge's "(Honors)" titles, and the nightly suggested-merge payload proposes each Honors record
// with its base again. The conductor's follow-up (Sam's standing view: CCN structures are the gold standard, no base
// holds an Honors course) retitles the two bases and holds both pairs apart. This file pins: the file is the one
// kb/_honors_followups_s652.py writes; one plain statement; two UPDATEs of the value alone, guarded on each row's
// before-value, reviewer and stamp; two INSERT-only merge_dismissed rows under honors-s652@bot whose values are the
// exact live-member signatures the simulated payload builds (both readers skip a group by that signature); a failed
// guard raises; and the rollback restores the titles only where they still hold the follow-up's value and deletes
// only the cohort's rows. The guards run against a real Postgres in tests/kb_curation_guarded_sql_proof.py (pair
// "honors follow-ups").
//
// Run from repo root: `npm test` (or `node tests/honors_followups.test.js`).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const code = (s) => s.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
const BOT = "automerge-v1" + "@bot";
const COHORT = "honors-s652" + "@bot";

const chk = spawnSync("python3", ["kb/_honors_followups_s652.py", "--sql", "--check"], { cwd: ROOT, encoding: "utf8" });
check("(1) the committed migration pair equals what kb/_honors_followups_s652.py writes", chk.status === 0,
  (chk.stderr || chk.stdout || "").slice(-300));

const fwd = code(read("kb/migrations/2026-11-14_s652_honors_followups.sql"));
const rb = code(read("kb/migrations/2026-11-14_s652_honors_followups_rollback.sql"));

check("(2) the forward file is one plain statement with no DO block, function or dollar quote",
  (fwd.match(/;/g) || []).length === 1 && !/\bdo\s*\$|\$\$|\bplpgsql\b|\bcreate\b/i.test(fwd));
check("(3) it updates and inserts, and never deletes",
  /update public\.kb_curation k\s+set value = e\.value_after/.test(fwd) && /insert into public\.kb_curation as k/.test(fwd)
  && !/\bdelete\b|\btruncate\b|\bdrop\b/i.test(fwd));
check("(4) the update changes the value alone, on the guard, the before-value and the bot reviewer",
  !/set [^\n]*reviewer_email|set [^\n]*reviewed_at/i.test(fwd)
  && new RegExp("where g\\.ok and k\\.course_id = t\\.course_id[\\s\\S]*k\\.value = e\\.value_before and k\\.reviewer_email = '" + BOT + "'").test(fwd));
check("(5) the two title rows and their exact before and after values",
  fwd.includes("('HUMA M1110', 'World Religions (Honors)', 'World Religions')")
  && fwd.includes("('LIBR M1040', 'Media & Information Literacy (Honors)', 'Media & Information Literacy')"));
check("(6) the guard matches reviewer, stamp and no validation, needs the delete landed, the slots free, no person's row",
  /\(select count\(\*\) from target\) = 2/.test(fwd) && /t\.validated_at is null\s+and t\.validated_by is null\) = 2/.test(fwd)
  && /t\.reviewed_at::timestamptz = '2026-06-12T22:47:01\.69179\+00:00'::timestamptz/.test(fwd)
  && /l\.course_id in \('HUMA M10ME', 'LIBR M10CJ'\)/.test(fwd) && /\(select n from leaf_rows\) = 0/.test(fwd)
  && /\(select n from slots\) = 0/.test(fwd) && /\(select n from person\) = 0/.test(fwd));
check("(7) two INSERT-only Keep as-is rows under the cohort, keyed on the signature's first id",
  fwd.includes("('HUMA M10ME', 'merge_dismissed', 'HUMA M10ME|HUMA M10OI|HUMA M1110')")
  && fwd.includes("('LIBR M1040', 'merge_dismissed', 'LIBR M1040|LIBR M10CJ')")
  && fwd.includes("'" + COHORT + "'") && /on conflict \(course_id, field\) do nothing/.test(fwd));
check("(8) a failed guard raises, and the result carries every before-image and insert",
  /::int::text::jsonb/.test(fwd) && /'row_before', to_jsonb\(t\)/.test(fwd) && /'row', to_jsonb\(k\)/.test(fwd)
  && /\(select count\(\*\) from retitled\) = 2 and \(select count\(\*\) from added\) = 2/.test(fwd));
check("(9) the rollback restores a title only while it holds the follow-up's value and stamp, and deletes only the cohort",
  /set value = e\.value_before/.test(rb) && /k\.value = e\.value_after/.test(rb)
  && new RegExp("k\\.reviewer_email = '" + COHORT + "' and k\\.field = 'merge_dismissed'").test(rb)
  && (rb.match(/;/g) || []).length === 1);

const plan = JSON.parse(read("kb/honors_delete_s652_out/2026-11-14/followups_plan.json"));
check("(10) simulated on committed data: every check of the plan holds",
  Object.keys(plan.checks).length >= 5 && Object.values(plan.checks).every(Boolean), JSON.stringify(plan.checks));
const sigs = new Set(plan.inserts.map((i) => i.value));
const sigOf = (ids) => ids.slice().sort().join("|");
check("(11) each dismissal value is its pair's group signature, sorted as the worklist sorts it, keyed on its first id",
  plan.inserts.every((i) => sigOf(i.value.split("|")) === i.value && i.course_id === i.value.split("|")[0])
  && plan.simulated.after_followups.groups.filter((g) => g.pairs_an_honors_record_with_its_base)
    .every((g) => sigs.has(g.live_signature) && !g.offered));
check("(12) the conductor's read is one SELECT", /^select /.test(plan.select_before)
  && (plan.select_before.match(/;/g) || []).length === 1);

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nhonors_followups.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
