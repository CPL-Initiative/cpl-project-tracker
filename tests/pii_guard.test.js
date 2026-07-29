// Standing PII guard (Session 34) — turns the one-time CustomReport privacy audit
// into a permanent regression check. Fails the build if any committed/public
// artifact carries:
//   1. a per-college cohort count that should be small-cell-suppressed
//      (students / veterans / working_adults / apprentices == 1 → must be "<2"),
//   2. a CER students_served exact count in 1-4 (must be "<5"-masked → null),
//   3. an email address outside the allowed domains (a staff-PII leak from the
//      MAP CustomReport Contacts/Users views, which must never be baked).
//
// Keep the cohort floor in sync with COHORT_SUPPRESS_BELOW in excel_to_dashboard.py
// (currently <2) and the CER floor with SERVED_SUPPRESS_BELOW (currently <5).
//
// Run from repo root: `npm test` (or `node tests/pii_guard.test.js`).
const fs = require("fs");

const COHORT_FLOOR = 2;   // per-college cohort counts: 1..COHORT_FLOOR-1 must be masked
const SERVED_FLOOR = 5;   // CER students_served: 1..SERVED_FLOOR-1 must be masked
// Allowed email domains: the project's own shared account + placeholder domains
// used in curator sign-in UI. Anything else = a real-person PII leak.
const ALLOWED_EMAIL_DOMAINS = ["rccd.edu", "example.com", "example.edu", "example.org"];

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }

function extractArray(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  let j = html.indexOf("[", i), depth = 0, k = j;
  for (; k < html.length; k++) {
    const c = html[k];
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) { k++; break; } }
  }
  return JSON.parse(html.slice(j, k));
}
function loadAssign(path) {
  let s = fs.readFileSync(path, "utf8");
  s = s.slice(s.indexOf("=") + 1).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
}

// ── 1. Per-college cohort counts (COLLEGE_ACTIVITY_DATA in both HTMLs) ──
const COHORT_FIELDS = ["students", "veterans", "working_adults", "apprentices"];
for (const f of ["CPL_Dashboard.html", "index.html"]) {
  const data = extractArray(fs.readFileSync(f, "utf8"), "window.COLLEGE_ACTIVITY_DATA");
  check(`${f}: COLLEGE_ACTIVITY_DATA present`, Array.isArray(data));
  const bad = [];
  (data || []).forEach((r) => COHORT_FIELDS.forEach((k) => {
    const v = r[k];
    if (typeof v === "number" && v >= 1 && v < COHORT_FLOOR) bad.push(`${r.college}.${k}=${v}`);
  }));
  check(`${f}: no exact cohort count < ${COHORT_FLOOR} (small-cell suppressed)`, bad.length === 0, bad.slice(0, 8).join(", "));
}

// ── 2. CER students_served (credential_reference_data.js) ──
const cer = loadAssign("credential_reference_data.js").unified_titles || [];
const badServed = cer.filter((r) => typeof r.students_served === "number"
  && r.students_served >= 1 && r.students_served < SERVED_FLOOR)
  .map((r) => `${r.ut}=${r.students_served}`);
check(`CER: no exact students_served < ${SERVED_FLOOR}`, badServed.length === 0, badServed.slice(0, 8).join(", "));

// ── 2b. CCR per-course student rollup (`st` in unified_courses_data.js) ──
// The Unified Courses "Students" column sums already-<5-suppressed per-credential
// counts, so a course total is >=5 or absent by construction — guard it anyway.
const ccr = (loadAssign("unified_courses_data.js").rows) || [];
const badCcrSt = ccr.filter((r) => typeof r.st === "number" && r.st >= 1 && r.st < SERVED_FLOOR)
  .map((r) => `${r.id}=${r.st}`);
check(`CCR: no exact st < ${SERVED_FLOOR} (unified_courses_data.js)`, badCcrSt.length === 0, badCcrSt.slice(0, 8).join(", "));

// ── 3. Email scan across the committed data artifacts ──
// Scope: artifacts derived from the MAP CustomReport / KPI pull (where staff PII
// would land if a Contacts/Users consumer ever crept in), plus other committed
// public data artifacts (the funding-model extract). Consumer UI JS with
// intentional placeholder emails is excluded by the placeholder-domain allowlist.
const EMAIL_FILES = [
  "CPL_Dashboard.html", "index.html", "CPL_Data.js",
  "credential_reference_data.js", "statewide_data.js",
  "statewide_prescriptive.js", "college_activity.js",
  "cpl_funding_data.js", "cpl_funding_performance.js", "cpl_funding_ess.js",
];
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const offending = new Set();
for (const f of EMAIL_FILES) {
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, "utf8");
  const matches = text.match(EMAIL_RE) || [];
  for (const m of matches) {
    const domain = m.split("@")[1].toLowerCase();
    const ok = ALLOWED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
    if (!ok) offending.add(m);
  }
}
check("no out-of-domain email in committed artifacts (staff-PII leak)", offending.size === 0,
  Array.from(offending).slice(0, 8).join(", "));

let pass = 0;
for (const [n, ok, detail] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && detail ? "  →  " + detail : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
