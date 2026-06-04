// Minimal test runner — runs every tests/*.test.js in its own child process
// and exits non-zero if any fail. Each test file is a standalone script that
// prints PASS/FAIL lines and exits 0 (all passed) or 1 (any failed).
//
//   npm test            # all tests
//   node tests/run.js   # same
//
// Adding a test = drop a `tests/<name>.test.js` that exits non-zero on failure.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter((f) => f.endsWith(".test.js"))
  .sort();

if (!files.length) {
  console.log("No tests found in tests/.");
  process.exit(0);
}

let failed = 0;
for (const f of files) {
  console.log("\n──────── " + f + " ────────");
  const r = spawnSync("node", [path.join(dir, f)], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}

console.log("\n════════════════════════════════════");
console.log(failed === 0
  ? `All ${files.length} test file(s) passed.`
  : `${failed} of ${files.length} test file(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
