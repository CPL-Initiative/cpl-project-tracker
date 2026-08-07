// Sierra and Credit for Being You — the student portal, framed as BOTH/AND.
//
// WHY THIS TEST EXISTS
// --------------------
// Sierra has known about the portal since 2026-07-17, but the rule read as an
// either/or, hinging on one word:
//
//   "...If INSTEAD the student is ALREADY enrolled at a specific college and
//    only needs THAT college to review their documentation, their college's
//    CPL landing page is the right path..."
//
// and LANDING_PAGE_RULE introduced the portal only as what to say when a
// college's landing page is MISSING — i.e. as a fallback.
//
// Sam's correction (2026-08-07): it is a both/and. The landing page shows what
// a student's own college will award; Credit for Being You shows what EVERY
// college would award for the same prior learning. People choose a college on
// exactly that comparison — proximity AND where their training is worth the
// most credit — so naming only the local landing page takes the choice away
// from them.
//
// Prompt text has no runtime behaviour to assert from Node, so these are
// source-level assertions on the rule constants — the same posture as
// sierra_guidance.test.js's wire checks. They exist to stop the framing
// silently reverting, and to stop the portal being demoted back to a fallback.
//
// Run from repo root: `npm test` (or `node tests/sierra_student_portal.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

// Pull one `const NAME = \`...\`;` template-literal rule out of the source.
function rule(name) {
  const m = new RegExp("const " + name + " = `([\\s\\S]*?)`;").exec(SRC);
  return m ? m[1] : "";
}
const PORTAL = rule("PORTAL_RULE");
const LANDING = rule("LANDING_PAGE_RULE");
const AUDIENCE = SRC.slice(SRC.indexOf("AUDIENCE_RULES"), SRC.indexOf("AUDIENCE_RULES") + 6000);
const STUDENT = /student: `([\s\S]*?)`,/.exec(AUDIENCE);
const STUDENT_RULE = STUDENT ? STUDENT[1] : "";

check("PORTAL_RULE is present", PORTAL.length > 200);
check("LANDING_PAGE_RULE is present", LANDING.length > 200);
check("the student audience rule is present", STUDENT_RULE.length > 200);

// ── The brand name, and one canonical URL ───────────────────────────────────
check("the portal is named 'Credit for Being You', not only 'the CPL Student Portal'",
  /Credit for Being You/i.test(PORTAL));
check("the student entry URL lives in ONE constant",
  /const PORTAL_STUDENT_URL = "https:\/\/creditforbeingyou\.org\/main\/student";/.test(SRC));
// TDZ: these rules are template literals evaluated at module load, so the const
// must be DECLARED above its first use or the function dies at boot.
check("PORTAL_STUDENT_URL is declared before its first use",
  SRC.indexOf("const PORTAL_STUDENT_URL") < SRC.indexOf("${PORTAL_STUDENT_URL}"));
check("no rule hardcodes a bare portal URL around the constant",
  !/https:\/\/creditforbeingyou\.org(?!\/main\/student)[^\s)`]*/.test(PORTAL + LANDING + STUDENT_RULE));
for (const [label, text] of [["PORTAL_RULE", PORTAL], ["LANDING_PAGE_RULE", LANDING], ["student rule", STUDENT_RULE]]) {
  check(`${label} points at the student entry URL`, /\$\{PORTAL_STUDENT_URL\}/.test(text));
}

// ── Both/and, explicitly ────────────────────────────────────────────────────
check("PORTAL_RULE states the both/and in as many words",
  /BOTH\/AND, NOT EITHER\/OR/.test(PORTAL));
check("PORTAL_RULE tells Sierra to point at BOTH routes",
  /point to BOTH/i.test(PORTAL));
check("PORTAL_RULE forbids demoting the portal to a fallback",
  /NOT present the portal as a fallback/i.test(PORTAL));
check("the old either/or hinge is gone", !/If instead the student is ALREADY enrolled/i.test(PORTAL));
check("the student audience rule gives BOTH routes",
  /BOTH routes, not one/i.test(STUDENT_RULE));

// ── The REASON — this is what makes the advice usable ───────────────────────
// A student weighs proximity against how much credit they'd get. Sierra has to
// say that out loud, or "here are two links" is just noise.
check("PORTAL_RULE explains the landing page = what THAT college awards",
  /THAT college specifically will award/i.test(PORTAL));
check("PORTAL_RULE explains the portal = what EVERY college awards",
  /EVERY college in the system would award/i.test(PORTAL));
check("PORTAL_RULE names the real decision: proximity AND most credit",
  /how close it is AND where their training is worth the most credit/i.test(PORTAL));
check("the student rule names that same trade-off",
  /how close it is AND on where their training earns the most credit/i.test(STUDENT_RULE));

// ── The audience the portal was built for ───────────────────────────────────
check("PORTAL_RULE names the 'college isn't for me' audience",
  /college isn't for me|never seriously considered college/i.test(PORTAL));
check("PORTAL_RULE starts from prior learning, not from enrolling",
  /what they have ALREADY learned/i.test(PORTAL));
check("the student rule works for someone who hasn't pictured college",
  /never pictured themselves at a college/i.test(STUDENT_RULE));

// ── Guardrails that must survive the rewrite ────────────────────────────────
check("PORTAL_RULE still says credit is never guaranteed",
  /Never imply credit is guaranteed/i.test(PORTAL));
check("PORTAL_RULE still says the college contacts the student directly",
  /CONTACTS THE STUDENT DIRECTLY/.test(PORTAL));
check("PORTAL_RULE still routes to counseling when neither route is open",
  /counseling office/i.test(PORTAL));
check("LANDING_PAGE_RULE still forbids inventing a link",
  /do NOT invent or guess a link/i.test(LANDING));
check("LANDING_PAGE_RULE still gives the MAP team as a route",
  /MAP@rccd\.edu/.test(LANDING));

// ── Wiring ──────────────────────────────────────────────────────────────────
check("PORTAL_RULE is still injected into the system prompt",
  /\$\{OFFERINGS_RULE\}\$\{PORTAL_RULE\}\$\{LANDING_PAGE_RULE\}/.test(SRC));

// ── report ──
let pass = 0;
for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
console.log("\nsierra_student_portal.test.js: " + pass + "/" + results.length + " checks passed");
process.exit(pass === results.length ? 0 : 1);
