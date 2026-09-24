// Suite sharding for tests/run.js — which files THIS machine runs.
//
// Extracted so it can be tested (run.js executes the suite on load, so nothing
// can require it; the limiter lives beside this for the same reason).
//
// WHY SHARDS, measured 2026-09-24. `npm test` is memory-bound, not CPU-bound:
// the runner already runs 4 files at once on a 16 GB machine and cannot go
// wider, because the cpl_funding_* family peaks at 2–4 GB per file (see the
// budget at the top of run.js). So one machine's wall time is the suite's
// serial time divided by 4 and nothing inside run.js can lower it. Every file
// timed on a 4-cpu / 16 GB box, main at 0476066:
//
//   362 files, 3,592 s serial, 898 s wall at 4-wide
//   cpl_funding_*   56 files   3,111 s   87% of the suite
//   (2026-08-28:    28 files     967 s   78% of a 1,245 s suite)
//   slowest: cpl_funding_render 222 s · outcome_cards 162 s · cpl_ftes 135 s
//
// The `npm test` step read 18 min on the CI runner the same day (run
// 36013462480) against 9–10 a month earlier. The only lever left is MORE
// MACHINES: js-tests.yml runs `node tests/run.js --shard i/N` on N runners at
// once and fans the results into one check named `test`.
//
// The partition is round-robin over the ALPHABETICAL file list, on purpose:
// the heavy family is alphabetically contiguous, so every shard gets the same
// number of cpl_funding_* files and the per-file variance inside the family
// averages out over the 14 each shard holds. A recorded-durations file would
// balance a little better and rot within a week; a hash would scatter the
// family unevenly. Simulated on the timings above, four round-robin shards
// hold 777 / 1,000 / 1,021 / 794 s of serial work (±14%), about 4.3 min each
// at 4-wide; six would hold 502–702 s. Four is the matrix in js-tests.yml,
// and that list is the one place to change it.
//
// Every shard still runs the check-ledger on its own files. What a shard
// must NOT do is re-baseline the ledger: writeLedger() replaces the whole
// file, so `--update-floor` from one shard would erase every other shard's
// floors. run.js refuses that combination before running anything.

// Read `--shard i/N` (or `--shard=i/N`) off argv. Returns null when absent.
// A malformed spec throws rather than silently running the whole suite:
// four shards each running everything is a 4x slower green, and a shard
// running nothing is a green over an unexercised suite.
function parseShard(argv) {
  let seen = false;
  let spec;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--shard") { seen = true; spec = argv[i + 1]; break; }
    if (a.startsWith("--shard=")) { seen = true; spec = a.slice("--shard=".length); break; }
  }
  if (!seen) return null;
  const m = /^(\d+)\/(\d+)$/.exec(String(spec === undefined ? "" : spec).trim());
  if (!m) throw new Error("--shard wants i/N (e.g. --shard 2/4), got " + JSON.stringify(spec));
  const index = parseInt(m[1], 10);
  const count = parseInt(m[2], 10);
  if (count < 1) throw new Error("--shard: N must be at least 1, got " + count);
  if (index < 1 || index > count) {
    throw new Error("--shard: i must be between 1 and N, got " + index + "/" + count);
  }
  return { index, count };
}

// The files shard `index` (1-based) of `count` runs: every count-th file of
// the sorted list, starting at index-1. Together the shards cover every file
// exactly once; shard 1 of 1 is the whole list.
function shardFiles(files, index, count) {
  return files.filter((_, i) => i % count === index - 1);
}

module.exports = { parseShard, shardFiles };
