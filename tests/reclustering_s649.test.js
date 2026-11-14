// The S649 BUSI row delete: the committed migration pair is the tool's, one guarded statement, and its rollback
// restores the row as it was.
//
// WHY. Sam's Open Asks Sheet 195 card 3 (01:18Z 2026-11-14, "Remove the row"; cpl_memory
// sam-sheet-195-answers-2026-11-14) authorizes one DELETE in kb_curation: (BUSI M10XW, merge_into, BUSI M1228),
// saved by automerge-titlelane-v1@bot on 2026-06-13. A delete of a saved row is the write Rule 10 guards hardest, so
// this file pins what makes it safe to apply from a runner: the file is the one kb/_reclustering_s649.py writes;
// it is one plain statement (the runner and the repo's Supabase guard refuse a DO block); it deletes only on its
// guard (the exact key, value, reviewer and stamp, no person's validation, no person's merge naming either id) and
// raises otherwise; it returns the whole row for the receipt; it inserts nothing; and the rollback re-inserts the
// same row, reviewer and reviewed_at unchanged, without overwriting a row saved since. The guards themselves are
// run against a real Postgres by tests/kb_curation_guarded_sql_proof.py (a session runs it before the apply).
//
// Run from repo root: `npm test` (or `node tests/reclustering_s649.test.js`).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const code = (s) => s.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

const chk = spawnSync("python3", ["kb/_reclustering_s649.py", "--sql", "--check"], { cwd: ROOT, encoding: "utf8" });
check("(1) the committed migration pair equals what kb/_reclustering_s649.py writes", chk.status === 0,
  (chk.stderr || chk.stdout || "").slice(-300));

const fwd = code(read("kb/migrations/2026-11-14_s649_busi_split_delete.sql"));
const rb = code(read("kb/migrations/2026-11-14_s649_busi_split_delete_rollback.sql"));

check("(2) the forward file is one plain statement with no DO block, function or dollar quote",
  (fwd.match(/;/g) || []).length === 1 && !/\bdo\s*\$|\$\$|\bplpgsql\b|\bcreate\b/i.test(fwd),
  "statements: " + (fwd.match(/;/g) || []).length);
check("(3) it deletes and never inserts or updates",
  /delete from public\.kb_curation/i.test(fwd) && !/\binsert\b|\bupdate\b|\btruncate\b|\bdrop\b/i.test(fwd));
check("(4) the delete hangs on the guard and names the exact key",
  /using guard g\s+where g\.ok and k\.course_id = 'BUSI M10XW' and k\.field = 'merge_into'/i.test(fwd));
check("(5) the guard matches the value, the bot reviewer and the saved stamp, and no person's validation",
  /t\.value = 'BUSI M1228'/.test(fwd) && /t\.reviewer_email = 'automerge-titlelane-v1@bot'/.test(fwd)
  && /t\.reviewed_at::timestamptz = '2026-06-13T17:47:56\.243497\+00:00'::timestamptz/.test(fwd)
  && /t\.validated_at is null\s+and t\.validated_by is null\) = 1/.test(fwd) && /\(select count\(\*\) from target\) = 1/.test(fwd));
check("(6) the guard refuses on a person's merge, confirm or Keep as-is naming either id",
  /reviewer_email not like '%@bot'/.test(fwd)
  && /'merge_into', 'unified_title_merge_confirm', 'merge_dismissed'/.test(fwd)
  && /'%BUSI M10XW%'/.test(fwd) && /'%BUSI M1228%'/.test(fwd) && /\(select n from person\) = 0/.test(fwd));
check("(7) a failed guard raises (a non-constant cast), so the statement writes nothing",
  /else \('refused by the guard: target rows ' \|\| g\.target_rows/.test(fwd) && /::int::text::jsonb/.test(fwd));
check("(8) the whole deleted row comes back for the receipt", /returning to_jsonb\(k\) as image/.test(fwd));
check("(9) the rollback re-inserts the same row, reviewer and reviewed_at as saved, and yields to a newer row",
  /insert into public\.kb_curation \(course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by\)/.test(rb)
  && /'BUSI M10XW', 'merge_into', 'BUSI M1228', 'automerge-titlelane-v1@bot',\s+'2026-06-13T17:47:56\.243497\+00:00'/.test(rb)
  && /on conflict \(course_id, field\) do nothing/.test(rb) && (rb.match(/;/g) || []).length === 1);

const plan = JSON.parse(read("kb/reclustering_s649_out/2026-11-14/plan.json"));
check("(10) the plan inserts nothing for the BUSI split, and says why", Array.isArray(plan.busi.inserts)
  && plan.busi.inserts.length === 0 && /stand-alone record/.test(plan.busi.why_no_insert));
check("(11) the plan stops the Honors step for the conductor and names the open questions",
  plan.honors.stopped === true && plan.honors.identities.length === 3 && plan.honors.why_stopped.length >= 4);

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nreclustering_s649.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
