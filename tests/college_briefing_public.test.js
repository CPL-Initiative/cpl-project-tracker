// My College, open to the public (Sam, 2026-09-17) — the two render paths that
// only exist because the page now reads published mirrors.
//
// ⭐ WHY. Opening the tab did not un-gate anything. Four tables stay behind
// `is_allowed_reviewer() OR team_pass_ok()`, and a credential-less reader is
// pointed at `_pub` mirrors built with suppression already applied. That shifts
// two things onto this page, and both fail SILENTLY if they are wrong:
//
//   1. A REMAINDER ROW. The published waiting table collapses every sub-k
//      recommendation for a college into one row with no recommendation, no
//      course and no headcount. Run through the existing grouping it lands as
//      "Not categorized" / "(no recommendation named in MAP)" — this data's
//      words for MAP being blank. A deliberate withholding would render as
//      somebody's oversight, and nothing would look wrong.
//   2. A HELD-BACK ROLE. The public contact mirror carries the CPL coordinator,
//      the CPL counselor and the landing page. Classifying the rest by falsiness
//      files them under "Not filled in" — the page telling a college its VP
//      Academic Affairs is missing when the truth is that we did not ask.
//
// Run from repo root: `npm test` (or `node tests/college_briefing_public.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function load(signedIn) {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  if (signedIn) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.__fetched = [];
  w.fetch = function (u) { w.__fetched.push(String(u)); return new Promise(function () {}); };
  const tp = w.document.createElement("script");
  tp.textContent = fs.readFileSync("team_phrase.js", "utf8");
  w.document.body.appendChild(tp);
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync("college_briefing.js", "utf8");
  w.document.body.appendChild(s);
  return w;
}

const pub = load(false), inn = load(true);
const P = pub.CPL_COLLEGE_BRIEFING, I = inn.CPL_COLLEGE_BRIEFING;

// ── (1) the source split ────────────────────────────────────────────────────
const sp = P._sources(), si = I._sources();
check("(1) a credential-less reader is routed to the mirrors",
  sp.pub === true && /_pub$/.test(sp.summary) && /_pub$/.test(sp.contacts)
  && /_pub$/.test(sp.goal2) && /_pub$/.test(sp.waiting));
check("(1) a phrase holder is routed to the bases",
  si.pub === false && !/_pub$/.test(si.summary) && !/_pub$/.test(si.waiting));
check("(1) ⚠ the public waiting read does NOT re-apply the base's filters",
  !/cpl_status_plan/.test(sp.waitingQuery) && !/sum_articulated_credits=gt/.test(sp.waitingQuery),
  "the mirror IS that slice already; re-filtering drops every remainder row, "
  + "which carries no cpl_status_plan at all");
check("(1) ⭐ the public waiting read asks for withheld_recommendations",
  /withheld_recommendations/.test(sp.waitingQuery),
  "without it the remainder is indistinguishable from a blank row");
check("(1) the public contact read asks for no executive role",
  !/vpaa|vpss|certifying_official|articulation_officer|faculty_lead/.test(sp.contactSelect));
check("(1) …and the signed-in one still does", /vpaa/.test(si.contactSelect));

// ── (2) the remainder row ───────────────────────────────────────────────────
const summary = { suppressed: false };
const detail = { waiting: [
  { credit_rec: "Fire Academy", college_course: "FIRE 1", course_type: "Elective credit",
    sum_articulated_credits: 60, distinct_students: 40 },
  { credit_rec: null, college_course: null, course_type: null,
    sum_articulated_credits: 40, distinct_students: null, withheld_recommendations: 5 }
] };
const wb = P._waitingBreakdown(detail, summary);
check("(2) the breakdown is produced", !!wb && !wb.empty && !wb.suppressed);
check("(2) ⭐ the remainder is reported, standing for its recommendations",
  wb && wb.withheld && wb.withheld.recommendations === 5 && wb.withheld.units === 40);
check("(2) ⭐ the remainder is NOT grouped as a named category",
  wb && wb.groups.every(function (g) { return !/not categorized/i.test(g.label); }),
  "grouped, it renders as this data's words for MAP being blank — a withholding "
  + "shown as an oversight");
check("(2) ⭐ no group claims the withheld recommendation as its own",
  wb && wb.groups.every(function (g) {
    return g.top.every(function (t) { return !/no recommendation named/i.test(t.name); }); }));
check("(2) ⭐ the withheld units stay IN the total, so it reconciles",
  wb && Math.round(wb.total) === 100,
  "the breakdown sits under the headline; a list that does not add up to the "
  + "number above it is worse than no list");
check("(2) ⚠ shares are NOT renormalized over the visible rows",
  wb && Math.abs(wb.groups[0].share - 0.6) < 1e-9,
  "renormalizing would report the withheld units as not existing");

const noneHeld = P._waitingBreakdown({ waiting: [
  { credit_rec: "A", college_course: "X", course_type: "Elective credit",
    sum_articulated_credits: 10, distinct_students: 30 }
] }, summary);
check("(2) nothing withheld reports no remainder", noneHeld && noneHeld.withheld === null);

// ── (3) held-back contact roles ─────────────────────────────────────────────
const row = { college: "Example College", cpl_coordinator: "A Person",
              cpl_coordinator_email: "a@example.edu", landing_page_url: "https://x" };
const rPub = P._contactRoster(row, true);
const labels = function (list) { return list.map(function (r) { return r.label; }); };
check("(3) ⭐ a role this reader may not see is NOT filed as blank",
  labels(rPub.blank).indexOf("VP Academic Affairs") === -1
  && labels(rPub.heldBack).indexOf("VP Academic Affairs") !== -1,
  "'Not filled in: VP Academic Affairs' would be the page telling a college its "
  + "VP is missing when we simply did not ask");
check("(3) the routing contact still publishes",
  labels(rPub.filled).indexOf("CPL coordinator") !== -1);
check("(3) a genuinely empty public role is still blank, not held back",
  labels(rPub.blank).indexOf("CPL counselor") !== -1
  && labels(rPub.heldBack).indexOf("CPL counselor") === -1,
  "the two states are different facts and must not render alike");

const rIn = I._contactRoster({ college: "Example College", vpaa: "A VP",
                               vpaa_email: "vp@example.edu" }, false);
check("(3) a signed-in reader holds nothing back", rIn.heldBack.length === 0);
check("(3) …and sees the executive role", labels(rIn.filled).indexOf("VP Academic Affairs") !== -1);

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\ncollege_briefing_public.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
