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
const OFFERINGS = rule("OFFERINGS_RULE");
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

// ── The balancing act (Sam, 2026-08-07) ─────────────────────────────────────
// "colleges will want to keep current and prospective students in their
// wheelhouse, whereas we want them to also be able to see their options
// systemwide". Sierra is embedded on COLLEGES' OWN PAGES, so an unprompted
// "you'd get more credit at X" reads as poaching a college's student off its
// own site. The systemwide view is offered as ADDED options; the comparison is
// the visitor's to ask for. If they DO ask, or have no college yet, Sierra
// compares freely — that is what the portal is for.
check("PORTAL_RULE names the college as host, not competition",
  /THE COLLEGE IS THE HOST, NOT THE COMPETITION/.test(PORTAL));
check("PORTAL_RULE starts with the named college and affirms it",
  /START with that college and affirm it/i.test(PORTAL));
check("PORTAL_RULE forbids pitching the portal by disparaging the college",
  /NEVER pitch the portal by disparaging their college/i.test(PORTAL));
check("PORTAL_RULE forbids an UNPROMPTED you-would-get-more-elsewhere",
  /never volunteer a comparison/i.test(PORTAL) && /reads as poaching/i.test(PORTAL));
check("PORTAL_RULE still allows comparison when the visitor ASKS",
  /If the visitor explicitly ASKS to compare colleges/i.test(PORTAL));
check("PORTAL_RULE still allows comparison when they have no college yet",
  /says they have not chosen one, compare freely/i.test(PORTAL));
check("PORTAL_RULE states whose call the comparison is",
  /comparison is theirs to ask for/i.test(PORTAL));

// ── The tie-break: restraint binds SALESMANSHIP, not FACTS ──────────────────
// Sam, 2026-08-07 (Session 126), resolving the tension he named a day earlier:
// "err on the side of CPL seekers…while supporting our colleges." #1027 shipped
// only the PROHIBITION half, and read literally it tells Sierra to WITHHOLD —
// a seeker asks about a credential their college hasn't articulated and gets a
// polite dead end, to protect the host's feelings. That fails the seeker AND the
// college, which never learns there was demand.
//
// ⚠️ THESE ARE THE CHECKS THAT MATTER MOST, and the reason is asymmetry: a
// violated PROHIBITION is loud (a college complains and you hear about it); a
// violated PERMISSION is silent (the person just isn't helped, leaves, and files
// nothing). The prohibition will never rot unnoticed. This half would.
// See docs/kb-notes/methodology-a-guardrail-that-only-forbids-disables-the-feature.md
check("PORTAL_RULE states the tie-break explicitly",
  /RESTRAINT BINDS SALESMANSHIP, NOT FACTS/i.test(PORTAL));
check("PORTAL_RULE forbids withholding an outcome-changing fact",
  /NEVER WITHHOLD a fact that materially changes/i.test(PORTAL));
check("PORTAL_RULE names withholding as failing BOTH parties",
  /fails the visitor AND fails the host college/i.test(PORTAL));
check("PORTAL_RULE bans editorialising rather than banning facts",
  /does NOT do is EDITORIALISE/i.test(PORTAL));
check("PORTAL_RULE spells out the un-articulated-credential case",
  /SAY WHERE IT IS AVAILABLE TODAY/i.test(PORTAL) &&
  /SAY THAT THE HOST CAN ADOPT IT/i.test(PORTAL));
check("PORTAL_RULE forbids the polite dead end by name",
  /Never stop at a polite dead end/i.test(PORTAL));
check("PORTAL_RULE states who wins when the two cannot be reconciled",
  /the visitor's outcome wins/i.test(PORTAL));
check("the student rule also refuses the dead end",
  /NEVER leave them at a dead end/i.test(STUDENT_RULE) &&
  /which colleges DO award it today/i.test(STUDENT_RULE));

// ── Mode 7's shape: host → precedent → nearest real route ───────────────────
// Sam's second decision the same day. Sierra had been stopping after PRECEDENT
// (Norco/Barstow ARTICULATED NCCER) and never reaching the LA-basin colleges
// that merely TEACH construction — leaving a seeker near LA Harbor with no local
// route, since NO LA-county college has a construction exhibit at all.
// Part (3) is the one that regressed; assert all three so it cannot again.
check("OFFERINGS_RULE is present", OFFERINGS.length > 200);
check("OFFERINGS_RULE prescribes all three parts in order",
  /give ALL THREE parts, in this order/i.test(OFFERINGS));
check("OFFERINGS_RULE part 1 = the host first",
  /THE HOST FIRST/i.test(OFFERINGS));
check("OFFERINGS_RULE part 2 = precedent, framed as evidence not redirect",
  /EVIDENCE FOR THE HOST'S ADOPTION, not a redirect/i.test(OFFERINGS));
check("OFFERINGS_RULE part 3 = nearest teaching college, even with no exhibit",
  /THE NEAREST REAL ROUTE/i.test(OFFERINGS) &&
  /EVEN IF none of them has articulated/i.test(OFFERINGS));
check("OFFERINGS_RULE calls stopping early a failure of the answer",
  /that is a FAILURE of the answer, not politeness/i.test(OFFERINGS));
check("OFFERINGS_RULE reconciles part 3 with the anti-poaching rule",
  /is NOT poaching/i.test(OFFERINGS) && /HOLD THE BALANCE/.test(OFFERINGS));

// ── Sam's two edge-case calls, 2026-08-07 ───────────────────────────────────
// Both follow from the same tie-break: restraint binds salesmanship, not facts.
// (a) DISTANCE. Part 3 names the nearest college that TEACHES the credential. In
// LA that is in-county; for a rural seeker it may be 200+ miles. Sam's call: name
// it anyway and state the distance plainly. Suppressing a far option leaves
// someone who would travel — or study online — with nothing, which is the
// withholding failure wearing a helpful face.
check("OFFERINGS_RULE refuses to suppress a distant teaching college",
  /DISTANCE IS A FACT, NOT A FILTER/i.test(OFFERINGS));
check("OFFERINGS_RULE requires the distance be stated, not hidden",
  /STATE THE DISTANCE PLAINLY/i.test(OFFERINGS));
check("OFFERINGS_RULE lets the visitor judge the distance themselves",
  /let the visitor judge/i.test(OFFERINGS));

// (b) THE TRUE DEAD END — nobody articulated it AND nobody nearby teaches it.
// The honest answer plus the two things that still help. The MAP referral is not
// politeness: an unmet request is how the system learns a credential is in
// demand, which is the same "the gap is the product" logic as the host-adoption
// framing. Asserting the portal AND the MAP inbox because either alone loses
// half the value — the seeker's option, or our demand signal.
check("OFFERINGS_RULE handles the all-three-empty case explicitly",
  /IF ALL THREE PARTS COME UP EMPTY/i.test(OFFERINGS));
check("dead end is stated plainly rather than padded",
  /SAY SO PLAINLY rather than padding/i.test(OFFERINGS));
check("dead end still routes to the portal", /Credit for Being You/.test(OFFERINGS));
check("dead end still captures the gap as demand signal",
  /MAP@rccd\.edu/.test(OFFERINGS) && /in demand/i.test(OFFERINGS));
check("⚠ dead end must never be filled with an invented college or articulation",
  /Never invent a college, a course or an articulation/i.test(OFFERINGS));

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
