// The CCR Trust Card adapter, and the three tags Jev must never be asked about.
//
// The CCR's method half emits Trust Cards -- a per-row score across 19 rules --
// where the CSR, CER and CCRR emit findings, which are discrete questions. The
// adapter's whole job is deciding which tags ARE questions, and the expensive
// mistake is not missing one: it is asking about a signal this repo has already
// ruled non-authoritative, because Jev answers those confidently and backwards.
//
//   * unit_anomaly (4,179 rows) -- the lane rules units are NOT identity
//     (SPAN 100 at 4/4.5/5 is one course). The pre-registered battery MEASURED
//     Jev on this exact question and scored AUC 0.281, below chance, because a
//     general model assumes an hours difference means a content difference.
//
//   * top_discipline_disagreement (1,189) and member_top_divergence (1,253) --
//     Rule 7's TOP caveat. TOP is faculty-entered with no gatekeeper and never
//     gates a primary determination, so a question whose premise is "TOP
//     disagrees" asks Jev to gate on TOP.
//
// That is 6,621 rows a future session could re-add in one line while believing
// it was widening coverage. This file fails that.
//
// Run from repo root: `npm test` (or `node tests/jev_ccr_adapter.test.js`).
const { execFileSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function py(src) {
  return execFileSync("python3", ["-c",
    "import sys, json\nsys.path.insert(0, 'kb')\nimport _jev_adjudicate as j\n" + src],
    { stdio: "pipe", maxBuffer: 64 * 1024 * 1024 }).toString();
}

const data = JSON.parse(py(
  "f, src = j.ccr_findings()\n" +
  "rules = sorted({x['rule'] for x in f})\n" +
  "print(json.dumps({'n': len(f), 'rules': rules, 'src': src,\n" +
  "  'askable': sorted(j.CCR_ASKABLE), 'never': sorted(j.CCR_NEVER_ASK),\n" +
  "  'rank_only': sorted(j.CCR_RANK_ONLY),\n" +
  "  'registered': 'ccr' in j.REFS,\n" +
  "  'sample': f[0] if f else None}))"));

/* ── 1. the traps are never asked ─────────────────────────────────────────── */
const TRAPS = ["unit_anomaly", "top_discipline_disagreement", "member_top_divergence"];
check("the three measured traps are named as never-ask",
  TRAPS.every((t) => data.never.includes(t)),
  "CCR_NEVER_ASK = " + data.never.join(","));

check("no finding is ever generated for a trap tag",
  TRAPS.every((t) => !data.rules.includes(t)),
  "rules emitted: " + data.rules.join(","));

check("no trap tag is in the askable set",
  TRAPS.every((t) => !data.askable.includes(t)),
  "askable: " + data.askable.join(","));

/* ── 2. identity tags rank, they never rule ───────────────────────────────── */
// Same Rule 7 logic that held the CSR out of the ladder: a SUBJ4 change is a
// re-mint, so Jev may order these for a curator and must not carry the verdict.
const IDENTITY = ["subject_discipline_outlier", "subject_collision_signal"];
check("the identity tags are rank-only, never asked",
  IDENTITY.every((t) => data.rank_only.includes(t) && !data.rules.includes(t)),
  "rank_only: " + data.rank_only.join(",") + " | emitted: " + data.rules.join(","));

/* ── 3. what IS asked is the content judgment, and only that ──────────────── */
check("only the three content-judgment rules are asked",
  data.askable.join(",") === [
    "description_discipline_disagreement",
    "discipline_title_mismatch",
    "generic_title_concrete_discipline",
  ].join(","),
  data.askable.join(","));

check("the adapter produces findings and is registered as a reference",
  data.n > 0 && data.registered, `n=${data.n} registered=${data.registered}`);

/* ── 4. the evidence carries what the question needs ──────────────────────── */
// The description rides EVERY rule including the title one: discipline_title_
// mismatch fires on token overlap, so most of its rows are artifacts (Three-
// Dimensional Design under Art), and the description is the only evidence that
// separates those from a real miss.
const ev = (data.sample || {}).evidence || "";
check("evidence names the title and the discipline",
  /title: .+/.test(ev) && /discipline: .+/.test(ev), ev.slice(0, 120));

check("COCI carriage-return escapes are stripped from the evidence",
  !/_x000D_/.test(py(
    "f,_ = j.ccr_findings()\nprint(' '.join(x['evidence'] for x in f))")),
  "a window spent on escape artifacts is a window not spent on the course");

/* ── report ──────────────────────────────────────────────────────────────── */
let pass = 0;
for (const [name, ok, why] of results) {
  console.log(`${ok ? "  ok" : "FAIL"}  ${name}${ok ? "" : "  — " + why}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
