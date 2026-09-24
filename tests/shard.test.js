// Guards tests/lib/shard.js — the partition behind the sharded CI runner.
//
// The failure modes here are green-looking: a shard that runs every file is
// a 4x slower pass, and shards that overlap or leave a gap pass while a file
// runs twice or never. Each is provoked below.
const { parseShard, shardFiles } = require("./lib/shard.js");

const EXPECTED_CHECKS = 14;
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name); }
}
function throws(fn) {
  try { fn(); return false; } catch (e) { return true; }
}

// ── parsing ──────────────────────────────────────────────────────────────
check("parse: absent flag means unsharded (null)",
  parseShard(["node", "tests/run.js"]) === null);
check("parse: --shard 2/4",
  JSON.stringify(parseShard(["node", "run.js", "--shard", "2/4"])) === '{"index":2,"count":4}');
check("parse: --shard=3/4",
  JSON.stringify(parseShard(["node", "run.js", "--shard=3/4"])) === '{"index":3,"count":4}');
check("parse: 1/1 is the whole suite, not an error",
  JSON.stringify(parseShard(["--shard", "1/1"])) === '{"index":1,"count":1}');
check("parse: a malformed spec throws instead of running everything",
  throws(() => parseShard(["--shard", "two-of-four"])) &&
  throws(() => parseShard(["--shard"])));
check("parse: i outside 1..N throws (0/4, 5/4)",
  throws(() => parseShard(["--shard", "0/4"])) &&
  throws(() => parseShard(["--shard", "5/4"])));
check("parse: N of 0 throws",
  throws(() => parseShard(["--shard", "1/0"])));

// ── partition ────────────────────────────────────────────────────────────
const files = Array.from({ length: 23 }, (_, i) => "f" + String(i).padStart(2, "0") + ".test.js");
const shards = [1, 2, 3, 4].map((i) => shardFiles(files, i, 4));
const union = [].concat(...shards);
check("partition: the shards cover every file exactly once",
  union.length === files.length && new Set(union).size === files.length &&
  files.every((f) => union.includes(f)));
check("partition: sizes differ by at most one (23 over 4 -> 6,6,6,5)",
  shards.map((s) => s.length).join(",") === "6,6,6,5");
check("partition: round-robin — alphabetical neighbors land on different shards",
  shards[0][0] === "f00.test.js" && shards[1][0] === "f01.test.js" &&
  shards[2][0] === "f02.test.js" && shards[3][0] === "f03.test.js" &&
  shards[0][1] === "f04.test.js");
check("partition: 1 of 1 is the identity",
  shardFiles(files, 1, 1).join() === files.join());
check("partition: deterministic (same input, same split)",
  shardFiles(files, 2, 4).join() === shardFiles(files, 2, 4).join());
check("partition: more shards than files leaves the extra shards empty rather than failing",
  shardFiles(["a.test.js"], 2, 3).length === 0 && shardFiles(["a.test.js"], 1, 3).length === 1);
check("partition: input order is preserved within a shard",
  shardFiles(files, 3, 4).join() === "f02.test.js,f06.test.js,f10.test.js,f14.test.js,f18.test.js,f22.test.js");

if (pass + fail !== EXPECTED_CHECKS) {
  fail++;
  console.log("  FAIL shard: only " + (pass + fail - 1) + " of " +
    EXPECTED_CHECKS + " checks ran — the suite exited early");
}
console.log("\n" + pass + "/" + (pass + fail) + " checks passed");
process.exit(fail === 0 ? 0 : 1);
