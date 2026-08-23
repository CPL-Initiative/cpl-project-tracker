// Sierra uptime probe — chatbox/health_check.sh + .github/workflows/cpl-chat-health.yml
//
// ⭐ WHY. The Anthropic credit balance behind cpl-chat ran dry on 2026-08-21
// 21:33 UTC and AGAIN on 2026-08-22 ~21:30 UTC. Both outages took every Sierra
// surface down at once and both were found hours later by a session that
// happened to run a post-deploy check — because nothing was watching:
// cpl-chat-smoke.yml and sierra-preflight.yml fire only on dispatch or push, and
// no other workflow probes the function. A student who hit the widget in either
// window reached nobody and filed nothing, so the outage cannot be trusted to
// report itself through feedback.
//
// ⚠ THE WHOLE VALUE OF A LIVENESS CHECK IS THAT IT CAN SAY NO. A probe that
// reports UP whenever it cannot tell is worse than no probe, because it converts
// an outage into a green tick. So this file does not merely read the script — it
// RUNS it against a local mock server in five shapes and asserts that exactly
// one of them (a real streamed answer) reports up. Four consecutive sessions in
// this repo have shipped an assertion that could not fail; this is the cheapest
// place to prove otherwise.
//
// ⚠ It deliberately does NOT assert anything about answer CONTENT. Capability
// regressions belong to chatbox/smoke_test.sh; conflating the two is what makes
// an uptime alarm go red on a rephrasing and then get muted.
//
// Run from repo root: `npm test` (or `node tests/sierra_health_probe.test.js`).
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawnSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SCRIPT = "chatbox/health_check.sh";
const WF = ".github/workflows/cpl-chat-health.yml";
const SH = fs.readFileSync(SCRIPT, "utf8");
const YML = fs.readFileSync(WF, "utf8");

// ── 1. Behavior: run the real script against a mock cpl-chat ────────────────
// Each shape is a response the live function has actually produced (or plainly
// can): the billing error seen in runs 121-124, a generic error body, a healthy
// SSE stream, an SSE stream carrying no text frame, and nothing at all.
const SHAPES = {
  credit: {
    ct: "application/json",
    body: '{"error":"AI response failed","status":400,"details":"{\\"type\\":\\"error\\",\\"error\\":{\\"type\\":\\"invalid_request_error\\",\\"message\\":\\"Your credit balance is too low to access the Anthropic API.\\"}}"}',
  },
  othererr: { ct: "application/json", body: '{"error":"boom","status":500}' },
  ok: {
    ct: "text/event-stream",
    body: 'event: sources\ndata: []\n\nevent: text\ndata: {"text":"CPL is credit for prior learning."}\n\nevent: done\ndata: {}\n\n',
  },
  emptysse: { ct: "text/event-stream", body: "event: sources\ndata: []\n\nevent: done\ndata: {}\n\n" },
};

// A synchronous test runner cannot await a Node http server, so the mock is a
// short-lived python3 child — the same interpreter the script already needs for
// its SSE parser, so this adds no new dependency.
const MOCK_PY = `
import sys, http.server
BODY = sys.argv[1].encode(); CT = sys.argv[2]; PORT = int(sys.argv[3])
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200); self.send_header("Content-Type", CT)
        self.send_header("Content-Length", str(len(BODY))); self.end_headers(); self.wfile.write(BODY)
    def log_message(self, *a): pass
http.server.HTTPServer(("127.0.0.1", PORT), H).serve_forever()
`;

function probe(shape, port) {
  const { spawn } = require("child_process");
  let mock = null;
  if (shape) {
    mock = spawn("python3", ["-c", MOCK_PY, shape.body, shape.ct, String(port)], { stdio: "ignore" });
    // Give the listener a moment. spawnSync below blocks, so a plain busy-wait
    // is the only option available in a synchronous runner.
    const until = Date.now() + 1500;
    while (Date.now() < until) { spawnSync("sh", ["-c", "sleep 0.05"]); if (Date.now() > until - 1200) break; }
  }
  const r = spawnSync("bash", [SCRIPT], {
    encoding: "utf8",
    env: Object.assign({}, process.env, { CPL_CHAT_URL: `http://127.0.0.1:${port}`, GITHUB_OUTPUT: "" }),
  });
  if (mock) { try { mock.kill(); } catch (e) {} }
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

block("1. probe behavior", () => {
  const up = probe(SHAPES.ok, 8171);
  check("(1) ⭐ a real streamed answer reports UP and exits 0",
    up.code === 0 && /STATUS: up/.test(up.out),
    "got exit " + up.code + " / " + (up.out.match(/STATUS: \w+/) || [""])[0]);

  const credit = probe(SHAPES.credit, 8172);
  check("(1) ⭐ the credit-balance error reports DOWN and exits non-zero",
    credit.code !== 0 && /STATUS: down/.test(credit.out));
  check("(1) ⚠ …and names the billing remedy, not just 'an error'",
    /CREDIT BALANCE EXHAUSTED/.test(credit.out) && /Plans & Billing/.test(credit.out),
    "this is the one failure whose fix is a person topping up an account, so the "
    + "alert has to say so — an engineer reading 'HTTP 400' will look for a bug");

  const other = probe(SHAPES.othererr, 8173);
  check("(1) any other error body reports DOWN",
    other.code !== 0 && /STATUS: down/.test(other.out));

  const empty = probe(SHAPES.emptysse, 8174);
  check("(1) ⚠ an SSE stream with NO text frame reports DOWN",
    empty.code !== 0 && /STATUS: down/.test(empty.out),
    "a 200 with well-formed frames and no answer is still a failed visit");

  const unreachable = probe(null, 8175);   // nothing listening
  check("(1) ⚠ an unreachable function reports DOWN, not 'inconclusive'",
    unreachable.code !== 0 && /STATUS: down/.test(unreachable.out),
    "from a student's browser an unreachable function and a broken one are the "
    + "same event; a probe that abstains here is the muted-alarm failure");
});

// ── 2. The script's own shape ────────────────────────────────────────────────
block("2. script shape", () => {
  check("(2) it asks ONE question, not a battery",
    (SH.match(/curl -sS/g) || []).length === 1,
    "the whole point of this probe over cpl-chat-smoke.yml is one model call");
  check("(2) ⚠ it asserts nothing about the answer's content",
    !/El Camino|Norco|Barstow|answer_must_match/.test(SH),
    "a content grep here would make uptime go red on a rephrasing");
  check("(2) it publishes status + reason for the workflow to read",
    /GITHUB_OUTPUT/.test(SH) && /status=/.test(SH) && /reason=/.test(SH));
  check("(2) ⚠ the reason is stripped of newlines and quotes before it is emitted",
    /tr -d '\\r\\n"'/.test(SH),
    "it lands in a GitHub output and then an issue body");
});

// ── 3. The workflow wiring ───────────────────────────────────────────────────
block("3. workflow wiring", () => {
  check("(3) ⭐ it is SCHEDULED — the whole gap being closed",
    /schedule:/.test(YML) && /cron: '7 \*\/3 \* \* \*'/.test(YML),
    "cpl-chat-smoke.yml and sierra-preflight.yml are dispatch/push only, which "
    + "is why two outages went unnoticed");
  check("(3) ⚠ …and the cadence carries its COST, so raising it is a decision",
    /PERSONAL Anthropic funding/.test(YML) && /~\$7\/month/.test(YML),
    "Sierra is on Sam's personal funding until the corporate account exists; a "
    + "cadence with no price beside it gets raised by whoever finds it annoying");
  check("(3) it self-tests on a push that touches it",
    /push:/.test(YML) && /chatbox\/health_check\.sh/.test(YML),
    "a broken monitor should be found by the change that broke it, not by the "
    + "outage it then fails to report");
  check("(3) it can also be dispatched by hand",
    /workflow_dispatch:/.test(YML),
    "a session needs a cheap way to answer 'is she up?' without the 16-call suite");
  check("(3) it may write issues",
    /issues: write/.test(YML));
  check("(3) ⚠ two attempts before declaring an outage",
    /sleep 60/.test(YML) && /retrying in 60s/.test(YML),
    "a single transient 502 must not page anyone — an alarm that cries wolf "
    + "gets muted, which is the state this replaces");
  check("(3) ⭐ an open outage issue is REUSED, not duplicated hourly",
    /gh issue list --label sierra-outage --state open/.test(YML) && /gh issue comment/.test(YML),
    "24 issues a day is indistinguishable from spam and would be muted");
  check("(3) ⭐ recovery closes the issue",
    /gh issue close/.test(YML));
  check("(3) ⚠ the RUN still fails when Sierra is down",
    /Fail the run if Sierra is down/.test(YML) && /exit 1/.test(YML),
    "continue-on-error on the probe step is what lets the issue steps run; "
    + "without this the workflow would report green through an outage");
  check("(3) the probe step is the one carrying continue-on-error",
    YML.indexOf("continue-on-error: true") > YML.indexOf("id: probe")
    && YML.indexOf("continue-on-error: true") < YML.indexOf("Raise or update the outage issue"));
  check("(3) it is not a required check on any PR",
    !/pull_request/.test(YML),
    "an uptime alarm must never block a merge — Sierra being down is not the "
    + "PR author's doing. NOTE this is about `pull_request:`, not the `push:` "
    + "self-test above: a push-triggered run reports its own status and gates "
    + "nothing, exactly as cpl-chat-smoke.yml already does");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_health_probe.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
