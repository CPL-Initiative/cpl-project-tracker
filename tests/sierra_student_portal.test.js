// Sierra and Credit for Being You — the student portal, framed as YES/AND.
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
// Sam's correction (2026-08-07), in two passes. First: it is not an either/or.
// Then, sharper — "more accurate to say Yes/And rather than both/and", and that
// is a correction to the SUBSTANCE, not the label. My first rewrite split the
// two routes by FUNCTION: compare at the portal, act at the landing page. Wrong.
// A student can see their CPL opportunities AND request a review in BOTH
// places; Credit for Being You simply ADDS the view across every CCC. So Sierra
// says yes to the college landing page and ADDS the portal — it never negates,
// corrects, or hands off. People choose a college on how close it is AND where
// their prior learning earns the most credit, and naming only the local page
// quietly narrows that.
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
check("PORTAL_RULE states the yes/and in as many words",
  /YES\/AND, NOT EITHER\/OR/.test(PORTAL));
// Sam, 2026-08-07: "more accurate to say Yes/And rather than both/and". The
// difference is not cosmetic. My first pass split the two by FUNCTION —
// compare at the portal, act at the landing page — and that is wrong: a
// student can see opportunities AND request a review in BOTH places. The
// portal simply ADDS the system-wide view. Never negate the landing page.
check("PORTAL_RULE says YES to the landing page first, then adds",
  /Say YES to the college landing page, AND add the portal/i.test(PORTAL));
check("PORTAL_RULE forbids the compare-there / act-here split",
  /not divided into "compare over there, act over here"/i.test(PORTAL));
check("PORTAL_RULE grants the SAME capability to both routes",
  /they can do THE SAME THING at CREDIT FOR BEING YOU/i.test(PORTAL));
check("PORTAL_RULE says the portal is not a hand-off comparison tool",
  /not a comparison tool that hands you off/i.test(PORTAL));
check("the student rule frames it as yes/and, not one instead of the other",
  /YES\/AND, never one instead of the other/i.test(STUDENT_RULE));
check("the student rule grants review at BOTH routes",
  /request a CPL review at their college's CPL landing page/i.test(STUDENT_RULE) &&
  /do the very same thing at Credit for Being You/i.test(STUDENT_RULE));
check("PORTAL_RULE gives Sierra the phrasing to use",
  /Phrase it as an addition/i.test(PORTAL));
check("PORTAL_RULE forbids demoting the portal to a fallback",
  /NOT present the portal as a fallback/i.test(PORTAL));
check("the old either/or hinge is gone", !/If instead the student is ALREADY enrolled/i.test(PORTAL));
check("the student audience rule gives BOTH routes",
  /Give them BOTH routes/i.test(STUDENT_RULE));

// ── The REASON — this is what makes the advice usable ───────────────────────
// A student weighs proximity against how much credit they'd get. Sierra has to
// say that out loud, or "here are two links" is just noise.
check("PORTAL_RULE says the portal ADDS the any-CCC view",
  /shows their options at any California community college/i.test(PORTAL));
// Sam, 2026-08-07: the portal "offers a much more comprehensive CPL portfolio
// development procedure". That is the second half of the AND — the portal is
// not merely a wider view, it helps a student build a stronger case, which is
// worth more credit wherever they take it.
check("PORTAL_RULE names the fuller portfolio development process",
  /MUCH MORE COMPREHENSIVE CPL PORTFOLIO DEVELOPMENT PROCESS/i.test(PORTAL));
check("PORTAL_RULE says what that process actually does",
  /assemble and describe everything they have learned/i.test(PORTAL) &&
  /evidence a college can actually assess/i.test(PORTAL));
check("the student rule mentions the fuller portfolio build",
  /fuller way of building out their CPL portfolio/i.test(STUDENT_RULE));
check("the student rule connects a better portfolio to more credit",
  /better-built portfolio tends to be worth more credit/i.test(STUDENT_RULE));
check("PORTAL_RULE names the real decision: proximity AND most credit",
  /how close it is AND where their prior learning earns the most credit/i.test(PORTAL));
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
