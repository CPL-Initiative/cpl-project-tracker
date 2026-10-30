// Guards how tests/run.js captures a child's output.
//
// THE BUG THIS EXISTS FOR (2026-08-28, found by the first full parallel run):
// `console.log` to a PIPE is asynchronous in Node, so a script ending in
// `process.exit()` discards whatever is still in its stdout buffer. The old
// spawnSync runner never saw it — the parent was blocked, the OS pipe filled,
// and the child blocked on write rather than getting ahead. An async parent
// drains the pipe, removing that back-pressure, so the child races ahead and
// exits with output unwritten.
//
// It surfaced as a FALSE test failure: cip_crosswalk.test.js reported 178 of
// its 354 assertions and the check-ledger called it "176 checks stopped
// running". Every assertion had run; only the report was cut off. That is the
// worst shape of bug this runner can have — it makes a healthy file look like a
// silently-disabled rule, which is the exact signal the ledger exists to raise.
//
// Writes to a file descriptor are synchronous, so process.exit() cannot
// truncate them.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name); }
}

const runjs = fs.readFileSync(path.join(__dirname, "run.js"), "utf8");

// Static, and deliberately so: reproducing the truncation on demand is
// load-dependent and would be flaky. What is NOT flaky is whether the runner
// still hands its children a file descriptor.
check("runner: children write to a file descriptor, not a pipe " +
      "(a pipe + process.exit() truncates output)",
  /stdio:\s*\["ignore",\s*fd,\s*fd\]/.test(runjs));
check("runner: the temp log is read back after close", /readFileSync\(logPath/.test(runjs));
check("runner: the temp directory is cleaned up", /function cleanupTmp/.test(runjs) &&
  (runjs.match(/cleanupTmp\(\)/g) || []).length >= 3);

// ⚠️ `node --check` parses; it does not resolve references. Rewriting the
// capture block once deleted the limiter's `require` line, `--check` stayed
// green, and the runner died at startup with "makeLimiter is not defined" —
// having run zero tests. A parse check is not a smoke test.
check("runner: every top-level helper it calls is actually required",
  /require\(\"\.\/lib\/limiter\.js\"\)/.test(runjs) &&
  /require\(\"\.\/lib\/check_ledger\.js\"\)/.test(runjs));

// Functional: a child that prints a lot and then exits immediately must not
// lose a single line through the path the runner actually uses.
const LINES = 20000;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cpl-capture-"));
const logPath = path.join(dir, "child.log");
const fd = fs.openSync(logPath, "w");
const child = spawn(process.execPath, ["-e",
  `for (let i = 0; i < ${LINES}; i++) console.log("line " + i); process.exit(0);`],
  { stdio: ["ignore", fd, fd] });

child.on("close", () => {
  fs.closeSync(fd);
  const out = fs.readFileSync(logPath, "utf8");
  const got = (out.match(/^line /gm) || []).length;
  check("runner: a child that floods stdout then calls process.exit() " +
        "loses nothing (" + got + "/" + LINES + " lines)", got === LINES);
  check("runner: the LAST line survives — truncation eats the end",
    out.includes("line " + (LINES - 1)));
  fs.rmSync(dir, { recursive: true, force: true });
  summarySurvivesPipe();
});

// THE SAME BUG, ONE LEVEL UP (S522, 2026-10-30). The runner itself writes to a
// pipe on CI, and it ended in `process.exit(1)` after printing megabytes of
// child output and then its summary. The exit discarded the unwritten tail, so
// a failing shard's log stopped mid-file with no FAILED list (#2446 shard 4,
// #2570 shard 3). Reproduced here: the old runner wrote 146 KB of 3.3 MB and no
// summary, read promptly or slowly. Now it sets process.exitCode and returns.
check("runner: the summary path sets process.exitCode and returns, " +
      "never process.exit() (a pipe + process.exit() drops the summary)",
  !/process\.exit\(failed/.test(runjs) &&
  (runjs.match(/process\.exitCode = failed === 0 \? 0 : 1;/g) || []).length === 2);

function summarySurvivesPipe() {
  // A copy of the real runner and its lib, beside two stand-in test files: one
  // that prints about 3 MB and passes, one that fails. Read through a pipe.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cpl-runner-pipe-"));
  const t = path.join(root, "tests");
  fs.mkdirSync(path.join(t, "lib"), { recursive: true });
  fs.copyFileSync(path.join(__dirname, "run.js"), path.join(t, "run.js"));
  for (const f of fs.readdirSync(path.join(__dirname, "lib"))) {
    fs.copyFileSync(path.join(__dirname, "lib", f), path.join(t, "lib", f));
  }
  fs.writeFileSync(path.join(t, "aa_loud.test.js"),
    'for (let i = 0; i < 60000; i++) console.log("ok   line " + i + " ".repeat(40));' +
    ' console.log("1/1 checks passed");');
  fs.writeFileSync(path.join(t, "zz_fails.test.js"),
    'console.log("FAIL stand-in"); console.log("0/1 checks passed"); process.exit(1);');
  const runner = spawn(process.execPath, [path.join(t, "run.js")],
    { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  runner.stdout.on("data", (d) => { out += d; });
  runner.on("close", (code) => {
    check("runner: through a pipe, a failing run exits 1 (got " + code + ")", code === 1);
    check("runner: through a pipe, the child output arrives whole (" +
          (out.match(/^ok   line /gm) || []).length + "/60000 lines)",
      out.includes("ok   line 59999 "));
    check("runner: through a pipe, the summary counts the failure",
      /1 of 2 test file\(s\) FAILED/.test(out));
    check("runner: through a pipe, the summary names the failing file",
      /✗ zz_fails\.test\.js — exit 1/.test(out));
    fs.rmSync(root, { recursive: true, force: true });
    console.log("\n" + pass + "/" + (pass + fail) + " checks passed");
    process.exit(fail === 0 ? 0 : 1);
  });
}
