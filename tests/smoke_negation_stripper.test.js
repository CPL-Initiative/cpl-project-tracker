// chatbox/smoke_test.sh — the negation stripper behind answer_must_not_match_unnegated,
// run through REAL sed against the answers that went red while being right.
//
// ⭐ WHY. Modes 15a and 15c are framing guards ("never a report card", "an absent
// college is not zero"). A correct answer often says the opposite in the guard's
// own words, so #1555 added a stripper that removes a NEGATED phrase before the
// regex runs. It covered two shapes, and two later correct answers slipped past
// both (run 34639257647, 2026-09-11):
//
//   15a  "…not a backlog it's failing to work through"   — the negation sits four
//        words upstream of the stem; shape 1 allowed only an article between them
//   15c  "…awarded, applied, or transcribed — it's not that the number is zero"
//        — the guarded regex's own gap ran across the em-dash into the clause
//        where the "not" lives
//
// The fix is two characters of regex each, which is exactly the kind of change
// that is wrong silently. So this file extracts the two sed expressions and the
// two mode regexes OUT OF THE SCRIPT (never a copy — a copy passes while the
// script drifts), runs them with the same sed and grep the workflow uses, and
// asserts: the recorded right answers pass, and answers that ARE the failure
// still fail. A guard that cannot fail is the failure this repo keeps finding.
//
// Run from repo root: `npm test` (or `node tests/smoke_negation_stripper.test.js`).
const fs = require("fs");
const { spawnSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SH = fs.readFileSync("chatbox/smoke_test.sh", "utf8");

// Bash double-quote semantics, which is what the script's `sed -E -e "…"` and
// `answer_must_not_match_unnegated -i "…"` arguments go through: only \\ \" \$
// and \` are escapes; every other backslash (\b, \.) survives as written.
function unquote(s) { return s.replace(/\\([\\"$`])/g, "$1"); }

// The function body, and its sed expressions — in order, as `-e "…"` arguments.
function stripperExpressions() {
  const start = SH.indexOf("answer_must_not_match_unnegated() {");
  const end = SH.indexOf("\n}\n", start);
  const body = SH.slice(start, end);
  const exprs = [];
  const re = /-e "((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(body))) exprs.push(unquote(m[1]));
  return exprs;
}
// The regex a given mode hands the stripper — read from the script's own call.
function modeRegex(labelFragment) {
  const re = new RegExp('answer_must_not_match_unnegated -i "((?:[^"\\\\]|\\\\.)*)" \\\\\\n\\s*"' + labelFragment);
  const m = SH.match(re);
  return m ? unquote(m[1]) : null;
}

// The assertion, as the script performs it: strip, then grep -E -i.
// Returns true when the (stripped) answer still MATCHES — i.e. the guard fails.
function guardFires(exprs, re, answer) {
  const args = ["-E"];
  exprs.forEach((e) => { args.push("-e", e.replace(/\$re/g, re)); });
  const sed = spawnSync("sed", args, { input: answer, encoding: "utf8" });
  if (sed.status !== 0) throw new Error("sed failed: " + sed.stderr);
  const grep = spawnSync("grep", ["-E", "-i", "-q", "--", re], { input: sed.stdout, encoding: "utf8" });
  if (grep.status !== 0 && grep.status !== 1) throw new Error("grep failed: " + grep.stderr);
  return grep.status === 0;
}

let EXPRS = null, RE_15A = null, RE_15C = null;
block("(0)", function () {
  EXPRS = stripperExpressions();
  check("(0) the stripper is exactly two sed expressions, read out of the script", EXPRS.length === 2,
    "found " + EXPRS.length + " — a third shape (or a lost one) changes what every guard below means");
  check("(0) shape 1 bounds its gap to the same clause",
    /\[\^\.,;:—–\]\{0,40\}\(\$re\)/.test(EXPRS[0] || ""),
    "the gap must stop at , ; : — – . and at 40 characters, or a negation anywhere earlier in the sentence excuses the stem");
  check("(0) shape 2 runs a can't-say clause to its clause end, not its sentence end",
    /\[\^\.,;:—–\]\*/.test(EXPRS[1] || ""));
  RE_15A = modeRegex("15a does not frame the backlog as failure");
  RE_15C = modeRegex("15c does not report an absent college as zero");
  check("(0) modes 15a and 15c hand their regexes to the stripper", !!RE_15A && !!RE_15C);
  check("(0) 15c's own gap cannot cross a dash",
    /\[\^\.—–-\]\{0,40\}/.test(RE_15C || ""),
    "without the dashes in its class the match runs into the next clause, where the negation lives");
  const probe = spawnSync("sed", ["--version"], { encoding: "utf8" });
  check("(0) sed is present to run the real expressions", probe.status === 0 || probe.status === 1);
});

// ── (1) 15a — the recorded right answers pass ────────────────────────────────
block("(1)", function () {
  if (!EXPRS || !RE_15A) return;
  const fires = (a) => guardFires(EXPRS, RE_15A, a);
  check("(1) ⭐ run 34639257647: \"not a backlog it's failing to work through\" passes",
    !fires("So this total mostly reflects how many veterans a college serves, not a backlog it's failing to work through — many colleges are still building capacity to review the sheer volume of credit a JST can surface."));
  check("(1) ⭐ run 34621090976: \"not a failure to act\" still passes",
    !fires("About 30% of reviewed credit is correctly ruled Not Applicable — that's real work and a correct outcome, not a failure to act."));
  check("(1) \"isn't failing\" and \"rather than poorly\" still pass",
    !fires("The system isn't failing here.") && !fires("Colleges are doing this deliberately rather than poorly."));
  check("(1) a negation across a 40-character gap in one clause passes",
    !fires("This is not the sort of backlog anyone would call failing to act."));
});

// ── (2) 15a — answers that ARE the failure still fail ────────────────────────
block("(2)", function () {
  if (!EXPRS || !RE_15A) return;
  const fires = (a) => guardFires(EXPRS, RE_15A, a);
  check("(2) ⭐ a bare report card fails", fires("Colleges are failing to act on this backlog."));
  check("(2) ⭐ the negation cannot reach across a comma: \"not a problem, but colleges are failing to act\" fails",
    fires("This is not a problem, but colleges are failing to act."));
  check("(2) …nor across a dash", fires("This is not a debt — colleges are simply failing to work through it."));
  check("(2) …nor across a sentence", fires("This is not a debt. Colleges are failing to work through it."));
  check("(2) a second, un-negated stem in the next clause still fails",
    fires("The college is not failing, but the district is failing to act."));
  check("(2) ⚠ the gap is BOUNDED: a negation more than 40 characters upstream does not excuse the stem",
    fires("This is not something we would describe, in this many words, as failing to act."),
    "commas aside, the bound is what stops one early 'not' from excusing a whole paragraph");
  check("(2) \"worst\" and \"shameful\" fail outside a negation",
    fires("It is the worst backlog in the state.") && fires("The numbers are shameful."));
});

// ── (3) 15c — the recorded right answers pass ────────────────────────────────
block("(3)", function () {
  if (!EXPRS || !RE_15C) return;
  const fires = (a) => guardFires(EXPRS, RE_15C, a);
  check("(3) ⭐ run 34639257647: \"transcribed — it's not that the number is zero\" passes",
    !fires("Calbright College Credit: NOT in the CPL credit disposition dataset. This means I can't report figures for units awarded, applied, or transcribed — it's not that the number is zero, it's that this data isn't currently available in what I have access to."));
  check("(3) ⭐ run 34621090976: \"I can't say they've awarded zero\" still passes",
    !fires("I can't say they've awarded zero units; Calbright is not in the dataset."));
  check("(3) the same clause with an en dash or a hyphen passes",
    !fires("I can't report units awarded, applied, or transcribed – it's not that the number is zero.")
      && !fires("I can't report units awarded, applied, or transcribed - it's not that the number is zero."));
});

// ── (4) 15c — an invented zero still fails ───────────────────────────────────
block("(4)", function () {
  if (!EXPRS || !RE_15C) return;
  const fires = (a) => guardFires(EXPRS, RE_15C, a);
  check("(4) ⭐ \"has awarded 0 units\" fails", fires("Calbright College has awarded 0 units of CPL credit so far."));
  check("(4) ⭐ \"transcribed zero\" fails", fires("Calbright has transcribed zero units."));
  check("(4) ⭐ a can't-say clause does not excuse the NEXT clause: \"I cannot say more, but Calbright awarded 0\" fails",
    fires("I cannot say more, but Calbright awarded 0 units."));
  check("(4) \"applied none\" fails", fires("Students there have applied none of it."));
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsmoke_negation_stripper.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
