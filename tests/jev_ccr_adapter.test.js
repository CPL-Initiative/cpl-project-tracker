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
const TRAPS = ["top_discipline_disagreement", "member_top_divergence"];
check("the TOP traps are named as never-ask",
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
check("the identity tags stay rank-only and never reach the evidence rungs",
  IDENTITY.every((t) => data.rank_only.includes(t)) &&
  IDENTITY.every((t) => !data.rules.includes(t)),
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

/* ── 5. Sam's revised ladder, and the two kinds of rung ──────────────────── */
// Sam, 2026-09-21: "make CIP the 3rd level and add units into the ladder ...
// Add in a rung for subject code outliers and untouched seeds, and blanks
// (where there is something useful to work with in the aggregate)."
//
// ⚠️ RUNGS 1-3 ARE ONE QUESTION WITH CUMULATIVE EVIDENCE; RUNGS 4-6 ARE
// SEPARATE QUESTIONS OVER SEPARATE POPULATIONS. Conflating them would let a
// future session read rung 4 as "rung 3 plus units" and ask the units question
// of rows that have no unit spread.
const L = JSON.parse(py(
  "f, _ = j.ccr_findings('cip')\n" +
  "x = [y for y in f if 'CIP colleges assigned' in y['rungs']['cip']][0]\n" +
  "counts = {r: len(j.ccr_findings(r)[0]) for r in j.CCR_RUNGS}\n" +
  "u, _ = j.ccr_findings('units')\n" +
  "ag, _ = j.ccr_findings('aggregate')\n" +
  "print(json.dumps({'order': list(j.CCR_RUNGS), 'kind': j.CCR_RUNG_KIND,\n" +
  "  'r': x['rungs'], 'counts': counts, 'thresh': j.UNITS_NONCRITICAL,\n" +
  "  'never_auto': list(j.CCR_NEVER_AUTO), 'moved': sorted(j.CCR_MOVED_TO_RUNG),\n" +
  "  'u_ev': u[0]['evidence'], 'ag_ev': ag[0]['evidence']}))"));

check("the ladder runs title, description, cip, units, subject, aggregate",
  L.order.join(",") === "title,description,cip,units,subject,aggregate",
  L.order.join(","));

check("the first three are evidence rungs and the last three are populations",
  ["title", "description", "cip"].every((r) => L.kind[r] === "evidence") &&
  ["units", "subject", "aggregate"].every((r) => L.kind[r] === "population"),
  JSON.stringify(L.kind));

check("each EVIDENCE rung contains the one before it",
  L.r.description.startsWith(L.r.title) && L.r.cip.startsWith(L.r.description),
  "an evidence rung that drops earlier evidence is a different question");

check("the description arrives at rung 2 and the CIP at rung 3",
  !/description:/.test(L.r.title) && /description:/.test(L.r.description) &&
  !/CIP colleges assigned/.test(L.r.description) && /CIP colleges assigned/.test(L.r.cip),
  "Sam moved CIP behind the description on 2026-09-21");

check("the three evidence rungs share one population",
  L.counts.title === L.counts.description && L.counts.description === L.counts.cip,
  `${L.counts.title}/${L.counts.description}/${L.counts.cip}`);

check("each population rung has its own, different population",
  L.counts.units !== L.counts.title && L.counts.subject !== L.counts.title &&
  L.counts.aggregate !== L.counts.title,
  JSON.stringify(L.counts));

// ⚠️ CIP CORROBORATES, NEVER GATES. A bare code would read as fact where a TOP
// carries a mean of 2.85 CIPs.
check("the CIP arrives with its own majority attached",
  /the modal CIP on \d+% of \d+ programs/.test(L.r.cip), L.r.cip.slice(-140));

/* ── 6. Sam's units rule is applied, not asked open ──────────────────────── */
// `unit_anomaly` was never-ask because Jev scored AUC 0.281 on it, below
// chance, applying the general prior that different hours mean different
// content. Sam's rule overrules that prior, so the question is askable ONLY
// with the threshold stated in it.
check("units moved out of never-ask and into a rung",
  L.moved.includes("unit_anomaly") && !data.never.includes("unit_anomaly"),
  "moved: " + L.moved.join(",") + " | never: " + data.never.join(","));

check("⭐ the non-critical range is stated IN the question's evidence",
  new RegExp("non-critical range of " + L.thresh).test(L.u_ev),
  "without the rule the model invents a threshold — that is the 0.281 run");

check("nothing at or under the non-critical range becomes a question",
  JSON.parse(py(
    "u, _ = j.ccr_findings('units')\n" +
    "sp = [j._units_spread(x['id'].split('||')[0]) for x in u]\n" +
    "print(json.dumps(min(s for s in sp if s is not None) > j.UNITS_NONCRITICAL))")),
  "a spread inside the rule is settled by the rule, and costs no call");

/* ── 7. the subject rung asks, and its answer is never an action ─────────── */
check("the subject rung is named never-auto",
  L.never_auto.includes("subject"),
  "a subject-code change is a re-mint under the playbook, never a model's call");

/* ── 8. the aggregate rung is scoped to what the members supply ──────────── */
// Sam's qualifier: "where there is something useful to work with in the
// aggregate". Membership records carry no description, so the fill comes from
// the member-description artifact instead.
check("the aggregate rung quotes the members' own descriptions",
  /member: /.test(L.ag_ev) && /member course\(s\) describe it/.test(L.ag_ev),
  L.ag_ev.slice(0, 160));

check("it reaches thousands of rows, not a handful",
  L.counts.aggregate > 1000, String(L.counts.aggregate));

/* ── report ──────────────────────────────────────────────────────────────── */
let pass = 0;
for (const [name, ok, why] of results) {
  console.log(`${ok ? "  ok" : "FAIL"}  ${name}${ok ? "" : "  — " + why}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
