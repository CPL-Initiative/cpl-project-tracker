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
// jsdom-heavy files (e.g. cpl_funding.test.js spins up ~50 windows in a loop;
// jsdom's per-window vm contexts are not reclaimable mid-run, so peak heap
// climbs to ~4GB) can exceed Node's default old-space cap on CI's smaller-RAM
// runners and OOM — the suite passes locally only because dev machines default
// to a much larger heap (~8GB). Give each child a generous, uniform ceiling.
// Files run sequentially (spawnSync blocks), so only one child holds memory at
// a time; the cap only permits growth, it does not reserve, so small files are
// unaffected.
for (const f of files) {
  console.log("\n──────── " + f + " ────────");
  const r = spawnSync("node", ["--max-old-space-size=8192", path.join(dir, f)], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}

console.log("\n════════════════════════════════════");
console.log(failed === 0
  ? `All ${files.length} test file(s) passed.`
  : `${failed} of ${files.length} test file(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
