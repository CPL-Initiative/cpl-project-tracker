// chatbox/smoke_test.sh — the mode filter (SMOKE_MODES), Sam, 2026-10-27.
//
// Every run() in the smoke file is one Sierra answer billed to her Anthropic key,
// and the whole file asks 33. A re-check of one failed mode should cost one or two
// answers, so SMOKE_MODES names the modes to ask by the first word of their run()
// label. This test runs the file's own helpers in bash, with curl replaced by a
// stub that counts calls, so the file cannot drift from what is tested: a mode left
// out makes no call and fails no assertion, a mode named still asks and still fails,
// "15a" never matches "1", and the A/B harness still finds "ALL MODES OK".
//
// Windows: needs bash (Git Bash). Run from repo root: `npm test`
// (or `node tests/smoke_mode_filter.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SMOKE = fs.readFileSync(path.join(__dirname, "..", "chatbox", "smoke_test.sh"), "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const cut = SMOKE.indexOf('\nrun "1 general"');
check("the helpers end where mode 1 begins", cut > 0);
const helpers = SMOKE.slice(0, cut);

// One bash process per scenario: the file's helpers, then a curl stub that records
// each call and streams a one-word answer, then the scenario. Prints "<calls> <fail>".
function scenario(modes, body) {
  const calls = path.join(os.tmpdir(), `smoke_calls_${process.pid}_${results.length}`);
  fs.writeFileSync(calls, "");
  const script = helpers + `
curl() { echo x >> "$CALLS"; printf 'event: text\\ndata: {"text":"hello"}\\n\\n'; }
sleep() { :; }
${body}
echo "RESULT $(wc -l < "$CALLS" | tr -d ' ') $fail"`;
  const r = spawnSync("bash", ["-c", script], {
    env: Object.assign({}, process.env, { SMOKE_MODES: modes, CALLS: calls }), encoding: "utf8",
  });
  fs.rmSync(calls, { force: true });
  const m = /RESULT (\d+) (\d+)/.exec(String(r.stdout));
  return m ? { calls: +m[1], fail: +m[2], out: String(r.stdout) } : { calls: -1, fail: -1, out: String(r.stdout) + r.stderr };
}

const ASK_FOUR = `run "1 general" '{}'
run "7c place anchor (Orange County)" '{}'
run "9 offerings multi-cert" '{}'
run "15a credit disposition statewide" '{}'`;

const all = scenario("", ASK_FOUR);
check("with SMOKE_MODES empty, every mode asks (4 calls)", all.calls === 4);

const some = scenario("9, 15a", ASK_FOUR);
check("SMOKE_MODES=\"9, 15a\" asks two modes and no others (2 calls)", some.calls === 2);
check("a skipped mode says so in the log", /skipped \(SMOKE_MODES\): 7c place anchor/.test(some.out));
check("\"15a\" never matches mode 1 (a whole first word, not a prefix)", !/MODE: 1 general/.test(some.out));

const skippedAssert = scenario("9", `run "7c place anchor" '{}'
answer_must_match -i "never in the answer" "7c probe"
answer_must_not_match -i "hello" "7c probe"
answer_head_must_match 80 "never" "7c probe"
answer_must_name_at_least 1 "7c probe" "never"`);
check("an assertion on a mode that was not asked passes over it (fail stays 0)", skippedAssert.fail === 0 && skippedAssert.calls === 0);

const askedAssert = scenario("9", `run "9 offerings multi-cert" '{}'
answer_must_match -i "never in the answer" "9 probe"`);
check("an assertion on a mode that was asked still fails (fail = 1)", askedAssert.fail === 1 && askedAssert.calls === 1);

const passAssert = scenario("9", `run "9 offerings multi-cert" '{}'
answer_must_match -i "hello" "9 probe"`);
check("…and still passes on a right answer", passAssert.fail === 0);

// Every run() label must start with its mode id, or the filter cannot name it.
const labels = [...SMOKE.matchAll(/^\s*run "([^"]+)"/gm)].map((m) => m[1]);
check("the file asks at least 30 modes (the filter has something to filter)", labels.length >= 30);
const unnamed = labels.filter((l) => !/^\d+[a-z]?\s/.test(l));
check("every run() label starts with a mode id like 7c or 15a" + (unnamed.length ? ": " + unnamed.join(" | ") : ""), unnamed.length === 0);

// Every assertion helper carries the guard, so a new one cannot fail a skipped mode.
const helpersMissing = [...SMOKE.matchAll(/^(answer_[a-z_]+)\(\) \{[^\n]*\n([^\n]*)/gm)]
  .filter((m) => !/SKIP_MODE/.test(m[2])).map((m) => m[1]);
check("every answer_* helper opens with the SKIP_MODE guard" + (helpersMissing.length ? ": " + helpersMissing.join(", ") : ""),
  helpersMissing.length === 0);

// The A/B harness compares runs by the phrase "ALL MODES OK" (cpl-chat-preview-ab.yml).
const tail = SMOKE.slice(SMOKE.lastIndexOf('if [ "$fail" -ne 0 ]'));
check("both closing lines keep \"ALL MODES OK\" for the A/B harness", (tail.match(/ALL MODES OK/g) || []).length >= 2);
check("a filter that matches no mode fails the run", /matched no mode/.test(SMOKE));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
