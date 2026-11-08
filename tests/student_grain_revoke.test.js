// Student-grain tables lose anon and authenticated writes and TRUNCATE (S604, COBIx #2919 PR 1).
// RLS never governs TRUNCATE, so the grant itself is the gate. The guard:
//   (1) every write privilege and TRUNCATE is revoked on all three tables from anon and authenticated;
//   (2) SELECT stays (the reviewer policy gates it) and service_role / postgres are never touched;
//   (3) the rollback grants back exactly what was revoked.
// Run from repo root: `npm test` (or `node tests/student_grain_revoke.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const strip = (s) => s.replace(/--.*$/gm, "");
const mig = strip(fs.readFileSync("kb/migrations/2026-11-08_student_grain_revoke_writes.sql", "utf8"));
const rb = strip(fs.readFileSync("kb/migrations/2026-11-08_student_grain_revoke_writes_rollback.sql", "utf8"));
const TABLES = ["map_student_credit", "map_student_credit_prev", "stg_student_credit"];
const PRIVS = ["insert", "update", "delete", "truncate", "references", "trigger"];

const rev = (mig.match(/revoke ([^;]*?)\s+on ([^;]*?)\s+from ([^;]*);/i) || []);
const revPrivs = (rev[1] || "").toLowerCase().split(/\s*,\s*/);
const revTables = (rev[2] || "").toLowerCase().split(/\s*,\s*/).map((t) => t.replace(/^public\./, ""));
const revRoles = (rev[3] || "").toLowerCase().split(/\s*,\s*/);

check("one revoke statement", (mig.match(/\brevoke\b/gi) || []).length === 1);
PRIVS.forEach((p) => check(`revokes ${p}`, revPrivs.includes(p)));
check("TRUNCATE is revoked (RLS does not govern it)", revPrivs.includes("truncate"));
check("SELECT stays (the reviewer policy gates it)", !revPrivs.includes("select") && !/\bselect\b/i.test(rev[1] || ""));
TABLES.forEach((t) => check(`covers ${t}`, revTables.includes(t)));
check("from anon and authenticated only", revRoles.length === 2 && revRoles.includes("anon") && revRoles.includes("authenticated"));
check("service_role and postgres are never named", !/service_role|postgres/i.test(mig));
check("no grant in the forward migration", !/\bgrant\b/i.test(mig));

const g = (rb.match(/grant ([^;]*?)\s+on ([^;]*?)\s+to ([^;]*);/i) || []);
const gPrivs = (g[1] || "").toLowerCase().split(/\s*,\s*/).sort();
const gTables = (g[2] || "").toLowerCase().split(/\s*,\s*/).map((t) => t.replace(/^public\./, "")).sort();
check("rollback grants back exactly the revoked privileges", JSON.stringify(gPrivs) === JSON.stringify([...revPrivs].sort()));
check("rollback covers the same tables", JSON.stringify(gTables) === JSON.stringify([...revTables].sort()));
check("rollback names the same roles", /to anon, authenticated\s*$/i.test((g[0] || "").replace(/;$/, "")));

const failed = results.filter((r) => !r[1]);
results.forEach((r) => console.log((r[1] ? "  ok  " : "  FAIL ") + r[0]));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
