// The S652 Honors delete: the committed migration pair is the tool's, one guarded statement that deletes exactly two
// rows, and its rollback restores them as they were.
//
// WHY. Sam's Open Asks Sheet 197 card 2 (14:35Z 2026-11-14, "delete": Delete both rows) authorizes two DELETEs in
// kb_curation: (HUMA M10ME, merge_into, HUMA M1110) and (LIBR M10CJ, merge_into, LIBR M1040), saved by the June
// auto-merge bot on 2026-06-12, so MiraCosta College's RELG 101H and LIBR 201H stand apart from their bases. A delete
// of a saved row is the write Rule 10 guards hardest. This file pins what makes it safe to apply from a runner: the
// file is the one kb/_honors_two_row_delete_s652.py writes; it is one plain statement (the runner and the repo's
// Supabase guard refuse a DO block); it deletes only the two keys, only on its guard, and raises otherwise; it
// returns both rows whole for the receipt; it inserts nothing; and the rollback re-inserts the same two rows without
// overwriting a row saved since. The guards themselves run against a real Postgres in
// tests/kb_curation_guarded_sql_proof.py (pair "honors"; a session runs it before the apply).
//
// Run from repo root: `npm test` (or `node tests/honors_two_row_delete.test.js`).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const code = (s) => s.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
const BOT = "automerge-v1" + "@bot";
const STAMP = "2026-06-12T22:47:01\\.69179\\+00:00";

const chk = spawnSync("python3", ["kb/_honors_two_row_delete_s652.py", "--sql", "--check"], { cwd: ROOT, encoding: "utf8" });
check("(1) the committed migration pair equals what kb/_honors_two_row_delete_s652.py writes", chk.status === 0,
  (chk.stderr || chk.stdout || "").slice(-300));

const fwd = code(read("kb/migrations/2026-11-14_s652_honors_two_row_delete.sql"));
const rb = code(read("kb/migrations/2026-11-14_s652_honors_two_row_delete_rollback.sql"));
const KEYS = "\\(\\(k\\.course_id = 'HUMA M10ME' and k\\.field = 'merge_into'\\) or \\(k\\.course_id = 'LIBR M10CJ' and k\\.field = 'merge_into'\\)\\)";

check("(2) the forward file is one plain statement with no DO block, function or dollar quote",
  (fwd.match(/;/g) || []).length === 1 && !/\bdo\s*\$|\$\$|\bplpgsql\b|\bcreate\b/i.test(fwd),
  "statements: " + (fwd.match(/;/g) || []).length);
check("(3) it deletes and never inserts or updates",
  /delete from public\.kb_curation/i.test(fwd) && !/\binsert\b|\bupdate\b|\btruncate\b|\bdrop\b/i.test(fwd));
check("(4) the delete hangs on the guard, the bot reviewer and the two exact keys, and nothing wider",
  new RegExp("using guard g\\s+where g\\.ok and k\\.reviewer_email = '" + BOT + "'\\s+and " + KEYS).test(fwd)
  && (fwd.match(/delete from/gi) || []).length === 1);
check("(5) the guard asks for both rows, each with its value, the bot reviewer, the saved stamp and no validation",
  /\(select count\(\*\) from target\) = 2/.test(fwd)
  && /\(t\.course_id = 'HUMA M10ME' and t\.value = 'HUMA M1110'\)/.test(fwd)
  && /\(t\.course_id = 'LIBR M10CJ' and t\.value = 'LIBR M1040'\)/.test(fwd)
  && new RegExp("t\\.reviewer_email = '" + BOT + "'").test(fwd)
  && new RegExp("t\\.reviewed_at::timestamptz = '" + STAMP + "'::timestamptz").test(fwd)
  && /t\.validated_at is null\s+and t\.validated_by is null\) = 2/.test(fwd));
check("(6) the guard counts every person's row on the four ids, or in a merge field naming one",
  /p\.reviewer_email not like '%@bot'/.test(fwd)
  && /p\.course_id in \('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040'\)/.test(fwd)
  && /'merge_into', 'unified_title_merge_confirm', 'merge_dismissed'/.test(fwd)
  && ["HUMA M10ME", "LIBR M10CJ", "HUMA M1110", "LIBR M1040"].every((i) => fwd.includes("'%" + i + "%'"))
  && /\(select n from person\) = \d+/.test(fwd));
check("(7) the guard refuses when anything points into a leaf or re-homes either Honors course",
  /i\.value in \('HUMA M10ME', 'LIBR M10CJ'\)/.test(fwd) && /'CN:CCC000588084', 'CN:CCC000572223'/.test(fwd)
  && /\(select n from inward\) = 0/.test(fwd));
check("(8) a failed guard raises (a non-constant cast), so the statement writes nothing",
  /else \('refused by the guard: target rows ' \|\| g\.target_rows/.test(fwd) && /::int::text::jsonb/.test(fwd)
  && /when g\.ok and \(select count\(\*\) from gone\) = 2/.test(fwd));
check("(9) both deleted rows come back whole for the receipt", /returning to_jsonb\(k\) as image/.test(fwd));
check("(10) the rollback re-inserts the same two rows, reviewer and reviewed_at as saved, and yields to a newer row",
  /insert into public\.kb_curation \(course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by\)/.test(rb)
  && new RegExp("\\('HUMA M10ME', 'merge_into', 'HUMA M1110', '" + BOT + "', '" + STAMP + "', NULL, NULL\\)").test(rb)
  && new RegExp("\\('LIBR M10CJ', 'merge_into', 'LIBR M1040', '" + BOT + "', '" + STAMP + "', NULL, NULL\\)").test(rb)
  && /on conflict \(course_id, field\) do nothing/.test(rb) && (rb.match(/;/g) || []).length === 1);

const plan = JSON.parse(read("kb/honors_delete_s652_out/2026-11-14/plan.json"));
const ids = plan.simulated.ids;
check("(11) the plan inserts nothing and names what card 2 does not cover",
  Array.isArray(plan.inserts) && plan.inserts.length === 0 && plan.not_covered.length >= 3);
check("(12) simulated: each leaf comes back as a stand-alone row of one, and each base loses exactly that member",
  ids["HUMA M10ME"].row.after.kind === "Stand-Alone" && ids["LIBR M10CJ"].row.after.kind === "Stand-Alone"
  && ids["HUMA M10ME"].members.after.members === 1 && ids["LIBR M10CJ"].members.after.members === 1
  && ids["HUMA M1110"].members.before.members - ids["HUMA M1110"].members.after.members === 1
  && ids["LIBR M1040"].members.before.members - ids["LIBR M1040"].members.after.members === 1
  && plan.simulated.member_rows.before === plan.simulated.member_rows.after);
check("(13) the identities map needs nothing: no record on the four ids, no missing entry before or after",
  Object.values(plan.identities_map.records_on_the_four_ids).every((n) => n === 0)
  && plan.identities_map.before.missing_entries === plan.identities_map.after.missing_entries);
check("(14) each conductor read is one SELECT",
  plan.selects.length >= 5 && plan.selects.every((s) => /^select /.test(s.sql) && (s.sql.match(/;/g) || []).length === 1));

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nhonors_two_row_delete.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
