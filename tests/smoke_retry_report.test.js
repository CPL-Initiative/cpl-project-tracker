// The deploy smoke retries a read and reports a wording (Sam, Open Asks Sheet 142
// card 2, 00:21Z 2026-10-30, "retry-report"; built S521).
//
// The four deploys before it each failed one check, a different one each time,
// while the deploy itself was sound: 7q (10-27), 7v (10-28, 10-29), and 7c
// (10-29, the program search timing out under load). This test runs the
// script's own helpers in bash against a curl stub, and pins:
//
//   1. rpc_post asks once more after an empty answer or a PostgREST error
//      object, and never after a real [] (the negative controls stay exact).
//   2. In report mode a missed answer check prints ::warning:: and leaves the
//      run green; in the default mode it fails, as before.
//   3. A rule guard (7z, the naming rule; the opener and COCI checks inside
//      run()) fails the run in either mode.
//   4. Only cpl-chat-smoke.yml turns report mode on; the preview A/B runs the
//      script directly and keeps failing on a missed answer.
//
// Run from repo root: `npm test` (or `node tests/smoke_retry_report.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
const SMOKE = read("chatbox/smoke_test.sh");
const SMOKE_YML = read(".github/workflows/cpl-chat-smoke.yml");
const AB_YML = read(".github/workflows/cpl-chat-preview-ab.yml");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const cut = SMOKE.indexOf('\nrun "1 general"');
check("the helpers end where mode 1 begins", cut > 0);
const helpers = SMOKE.slice(0, cut);

// One bash process per scenario. The curl stub plays back $REPLIES one line per
// call ("<empty>" for an empty answer) and counts its calls.
function scenario(body, env) {
  const calls = path.join(os.tmpdir(), `smoke_rr_${process.pid}_${results.length}`);
  fs.writeFileSync(calls, "");
  const script = helpers + `
curl() {
  echo x >> "$CALLS"
  local n; n=$(wc -l < "$CALLS" | tr -d ' ')
  local r; r=$(printf '%s\\n' "$REPLIES" | sed -n "\${n}p")
  [ "$r" = "<empty>" ] || printf '%s' "$r"
}
sleep() { :; }
${body}
echo "RESULT calls=$(wc -l < "$CALLS" | tr -d ' ') fail=$fail warned=$answer_warnings"`;
  const r = spawnSync("bash", ["-c", script], {
    env: Object.assign({}, process.env, { CALLS: calls, REPLIES: "" }, env || {}), encoding: "utf8",
  });
  fs.rmSync(calls, { force: true });
  const out = String(r.stdout) + String(r.stderr);
  const m = /RESULT calls=(\d+) fail=(\d+) warned=(\d+)/.exec(out);
  return m ? { calls: +m[1], fail: +m[2], warned: +m[3], out } : { calls: -1, fail: -1, warned: -1, out };
}

// ── 1. rpc_post ──────────────────────────────────────────────────────────────
let s = scenario('got=$(rpc_post "rpc/search_college_programs" \'{}\'); echo "GOT=$got"', { REPLIES: "<empty>\n[1]" });
check("(1) an empty answer is asked once more, and the second answer is the one returned",
  s.calls === 2 && /GOT=\[1\]/.test(s.out));
s = scenario('got=$(rpc_post "rpc/search_college_programs" \'{}\'); echo "GOT=$got"',
  { REPLIES: '{"code":"57014","message":"canceling statement due to statement timeout"}\n[{"college":"x"}]' });
check("(1) a PostgREST error object (57014, a statement timeout) is asked once more",
  s.calls === 2 && /GOT=\[\{"college":"x"\}\]/.test(s.out));
check("(1) …and the retry is announced as a warning", /::warning::rpc\/search_college_programs answered/.test(s.out));
s = scenario('got=$(rpc_post "rpc/search_college_programs" \'{}\'); echo "GOT=$got"', { REPLIES: "[]" });
check("(1) ⚠ a real [] is an answer: never retried (a negative control must stay exact)",
  s.calls === 1 && /GOT=\[\]$/m.test(s.out));
s = scenario('got=$(rpc_post "rpc/search_college_programs" \'{}\'); echo "GOT=$got"', { REPLIES: "<empty>\n<empty>" });
check("(1) it asks once more, never twice", s.calls === 2);
for (const fn of ["offerings_call", "programs_call", "programs_call_anchored", "offerings_call_anchored", "program_courses_call"]) {
  const at = SMOKE.indexOf(fn + "() {");
  const body = at === -1 ? "" : SMOKE.slice(at, SMOKE.indexOf("\n}\n", at));
  check(`(1) ${fn} reads through rpc_post`, /\n\s*rpc_post "rpc\//.test(body) && !/curl /.test(body));
}
check("(1) the 7p and 7l timing checks measure once more before they fail",
  (SMOKE.match(/for _try in 1 2; do\n\s+[pl]secs=\$\(curl/g) || []).length === 2);

// ── 2. answer checks report, or fail ─────────────────────────────────────────
const miss = 'LAST_ANSWER="hello"; SKIP_MODE=0\nanswer_must_match -i "goodbye" "9 probe"';
s = scenario(miss, { SMOKE_ANSWER_CHECKS: "report" });
check("(2) report mode: a missed answer check leaves the run green", s.fail === 0 && s.warned === 1);
check("(2) …prints ::warning:: with the wording the A/B grid reads",
  /::warning::9 probe: expected answer to match \/goodbye\//.test(s.out));
s = scenario(miss, {});
check("(2) default mode: the same miss fails the run, as before", s.fail === 1 && /::error::9 probe: expected answer/.test(s.out));
const misses = [
  'answer_must_not_match -i "hello" "9 probe"',
  'answer_head_must_match 10 "goodbye" "9 probe"',
  'answer_head_must_not_match 10 "hello" "9 probe"',
];
for (const m of misses) {
  const r = scenario('LAST_ANSWER="hello"; SKIP_MODE=0\n' + m, { SMOKE_ANSWER_CHECKS: "report" });
  check(`(2) report mode covers ${m.split(" ")[0]}`, r.fail === 0 && r.warned === 1);
}
s = scenario('LAST_ANSWER="hello"; SKIP_MODE=0\nanswer_must_match -i "hello" "9 probe"', { SMOKE_ANSWER_CHECKS: "report" });
check("(2) a passing check warns nothing", s.fail === 0 && s.warned === 0);

// ── 3. rule guards fail either way ───────────────────────────────────────────
s = scenario('LAST_ANSWER="hello"; SKIP_MODE=0\nanswer_rule_must_match -i "Mapping Articulated Pathways" "7z probe"',
  { SMOKE_ANSWER_CHECKS: "report" });
check("(3) ⚠ a rule guard fails the run in report mode", s.fail === 1 && s.warned === 0);
s = scenario('LAST_ANSWER="hello"; SKIP_MODE=0\nanswer_rule_must_match -i "Mapping Articulated Pathways" "7z probe"\nanswer_must_match -i "goodbye" "9 probe"',
  { SMOKE_ANSWER_CHECKS: "report" });
check("(3) …and its fail mode does not leak into the next check", s.warned === 1);
check("(3) 7z, the naming rule, is a rule guard",
  /^answer_rule_must_match -i "Mapping Articulated Pathways" "7z/m.test(SMOKE));
const runAt = SMOKE.indexOf("run() { # label");
const runFn = runAt === -1 ? "" : SMOKE.slice(runAt, SMOKE.indexOf("\n}\n", runAt));
check("(3) run()'s opener and COCI checks still fail the run",
  /echo "::error::\$label: answer should NOT match \/opens with a remark/.test(runFn)
  && /echo "::error::\$label: answer should NOT match \/\\bCOCI\\b\//.test(runFn)
  && !/report_answer_miss/.test(runFn));
check("(3) an empty answer still fails the run", /echo "::error::empty answer for \$label/.test(runFn));

// ── 4. only the smoke workflow reports ───────────────────────────────────────
check("(4) cpl-chat-smoke.yml runs the script with SMOKE_ANSWER_CHECKS: report",
  /SMOKE_ANSWER_CHECKS: report/.test(SMOKE_YML));
check("(4) the preview A/B does not (it compares failures, so a miss must still count)",
  !/SMOKE_ANSWER_CHECKS/.test(AB_YML));
check("(4) the script's default is fail", /SMOKE_ANSWER_CHECKS="\$\{SMOKE_ANSWER_CHECKS:-fail\}"/.test(SMOKE));
check("(4) the summary keeps ALL MODES OK, which the A/B harness reads",
  (SMOKE.match(/echo "ALL MODES OK/g) || []).length >= 2);

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
