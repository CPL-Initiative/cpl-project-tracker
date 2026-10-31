// Guards tests/lib/shard.js — the partition behind the sharded CI runner.
//
// The failure modes here are green-looking: a shard that runs every file is
// a 4x slower pass, and shards that overlap or leave a gap pass while a file
// runs twice or never. Each is provoked below.
const { parseShard, shardFiles, balancedFiles, heaviestFirst } = require("./lib/shard.js");

const EXPECTED_CHECKS = 21;
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

// ── balanced by measured time ─────────────────────────────────────────────
// Two heavy files beside each other alphabetically, the case round-robin gets
// wrong whenever the count is right and the seconds are not.
const timed = ["a.test.js", "b.test.js", "c.test.js", "d.test.js", "e.test.js", "f.test.js", "g.test.js"];
const secs = { "a.test.js": 100, "b.test.js": 90, "c.test.js": 10, "d.test.js": 10, "e.test.js": 10, "f.test.js": 10 };
const bal = [1, 2, 3].map((i) => balancedFiles(timed, i, 3, secs));
const ball = [].concat(...bal);
check("balanced: every file on exactly one shard, a file the table does not know included",
  ball.length === timed.length && new Set(ball).size === timed.length && ball.includes("g.test.js"));
const loadOf = (s) => s.reduce((a, f) => a + (f in secs ? secs[f] : 10), 0);
check("balanced: the two heavy files land on different shards, and the spread is smaller than round-robin's",
  bal.findIndex((s) => s.includes("a.test.js")) !== bal.findIndex((s) => s.includes("b.test.js")) &&
  Math.max(...bal.map(loadOf)) - Math.min(...bal.map(loadOf)) <
    Math.max(...[1, 2, 3].map((i) => loadOf(shardFiles(timed, i, 3)))) - Math.min(...[1, 2, 3].map((i) => loadOf(shardFiles(timed, i, 3)))));
check("balanced: each shard runs its heaviest file first",
  bal.every((s) => s.every((f, i) => i === 0 || (secs[s[i - 1]] || 10) >= (secs[f] || 10))));
check("balanced: deterministic (same input, same split)",
  JSON.stringify([1, 2, 3].map((i) => balancedFiles(timed, i, 3, secs))) === JSON.stringify(bal));
check("balanced: no table (null or empty) falls back to round-robin",
  balancedFiles(files, 2, 4, null).join() === shardFiles(files, 2, 4).join() &&
  balancedFiles(files, 2, 4, {}).join() === shardFiles(files, 2, 4).join());
check("balanced: a name in the table that no longer exists is ignored",
  [].concat(...[1, 2].map((i) => balancedFiles(["x.test.js", "y.test.js"], i, 2, { "gone.test.js": 999, "x.test.js": 5 }))).sort().join() === "x.test.js,y.test.js");
check("heaviest first: the unsharded run starts the long files first, and keeps every file",
  heaviestFirst(timed, secs)[0] === "a.test.js" && heaviestFirst(timed, secs).length === timed.length &&
  heaviestFirst(timed, null) === timed);

if (pass + fail !== EXPECTED_CHECKS) {
  fail++;
  console.log("  FAIL shard: only " + (pass + fail - 1) + " of " +
    EXPECTED_CHECKS + " checks ran — the suite exited early");
}
console.log("\n" + pass + "/" + (pass + fail) + " checks passed");
process.exit(fail === 0 ? 0 : 1);
