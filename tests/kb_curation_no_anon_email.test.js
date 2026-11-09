// kb_curation's reviewer emails answer a signed-in reviewer only (S614, Sam 2026-11-09: "go ahead and close the email
// exposure"; kb/migrations/2026-11-09_kb_curation_hide_reviewer_email.sql). Since the anon key cannot read
// reviewer_email or validated_by, a browser read that names either column in its select fails whole. Guards:
//   (1) no shipped script names reviewer_email or validated_by inside a kb_curation select literal; the readers take
//       their columns from curationWho() (reviewer_label signed out, both signed in) or add the email only with a token;
//   (2) each file that reads emails defines curationWho and curationRows, and curationWho sends the token only when
//       the session is fresh, asking for reviewer_label otherwise;
//   (3) curationRows copies reviewer_label into reviewer_email, so a procedure's cohort id still reads as a cohort.
// Run from repo root: `npm test` (or `node tests/kb_curation_no_anon_email.test.js`).
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const ROOT = path.join(__dirname, "..");
const SKIP = /^(tests|docs|node_modules|kb|prototype|archive|tools)\//;
function walk(dir, out) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir ? dir + "/" + e.name : e.name;
    if (SKIP.test(rel + "/") || e.name.startsWith(".")) continue;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.js$/.test(e.name) && !/_data\.js$|_desc_[A-Z]\.js$/.test(e.name)) out.push(rel);
  }
  return out;
}
const files = walk("", []);
const bad = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  if (s.indexOf("kb_curation") < 0) continue;
  const re = /kb_curation\?select=[^"'`]*?(reviewer_email|validated_by)|"\?select=[^"'`]*?(reviewer_email|validated_by)/g;
  let m;
  while ((m = re.exec(s))) bad.push(f + ":" + s.slice(0, m.index).split("\n").length);
}
check("(1) ⭐ no kb_curation select literal names reviewer_email or validated_by", bad.length === 0, bad.join(", "));

const READERS = ["canonical_subj4.js", "exhibits.js", "unified_courses.js", "statewide_interactive.js", "credential_reference.js"];
const HELPER_RE = /function curationWho\(\) \{[\s\S]*?\n  \}\n  function curationRows\(arr\) \{[\s\S]*?\n  \}\n/;
const missing = READERS.filter((f) => !HELPER_RE.test(fs.readFileSync(path.join(ROOT, f), "utf8")));
check("(2) each email reader defines curationWho and curationRows", missing.length === 0, missing.join(", "));

const helper = fs.readFileSync(path.join(ROOT, READERS[0]), "utf8").match(HELPER_RE)[0];
function run(session, fresh) {
  const ctx = { window: { CPL_SESSION: session === undefined ? undefined : { get: () => session, isFresh: () => fresh } } };
  vm.createContext(ctx);
  vm.runInContext(helper + "; this.W = curationWho(); this.rows = curationRows;", ctx);
  return ctx;
}
const out = run(null, false), stale = run({ email: "a@rccd.edu", access_token: "t" }, false), live = run({ email: "a@rccd.edu", access_token: "t" }, true);
check("(2) signed out: reviewer_label, no token", out.W.cols === "reviewer_label" && !out.W.auth.Authorization);
check("(2) a stale session reads as signed out", stale.W.cols === "reviewer_label" && !stale.W.auth.Authorization);
check("(2) ⭐ signed in and fresh: the email beside the label, with the reviewer's token",
  live.W.cols === "reviewer_email,reviewer_label" && live.W.auth.Authorization === "Bearer t");
const rows = out.rows([{ reviewer_label: "csr-confirm-authority@bot" }, { reviewer_label: "a reviewer" }, { reviewer_email: "x@rccd.edu", reviewer_label: "a reviewer" }]);
check("(3) the label stands in for the email; a cohort keeps its id; a read email is kept",
  rows[0].reviewer_email === "csr-confirm-authority@bot" && rows[1].reviewer_email === "a reviewer" && rows[2].reviewer_email === "x@rccd.edu");

const failed = results.filter((r) => !r[1]);
results.forEach((r) => console.log((r[1] ? "  ✓ " : "  ✗ ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
console.log("kb_curation_no_anon_email: " + (results.length - failed.length) + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
