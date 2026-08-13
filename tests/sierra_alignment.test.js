/**
 * Route ALIGN — the articulation worklist. BEHAVIOURAL.
 *
 * Sam, 2026-08-13: "If Sierra is answering for Cerritos College, I would want
 * her to recommend the most aligned Cerritos welding courses to be articulated
 * so the faculty don't have to guess, and have a link or access to the other
 * college articulations for this same welding certificate."
 *
 * The failure this guards is not "does it render" — it is that the two halves
 * are different KINDS of claim and must never be merged:
 *
 *   peer rows      FACT     — a named college really articulated that course
 *   candidate rows PROPOSAL — computed from title similarity, and title
 *                             similarity is structurally blind to the
 *                             broader-course pattern
 *
 * Fixtures are copied from live RPC output for
 * `ASME BPVC Section IX — FCAW Welder Qualification` at Cerritos College.
 *
 * Run: node tests/sierra_alignment.test.js
 */
const fs = require("fs");
const path = require("path");
const { stripTypes } = require("./lib/lift_ts");

const SRC = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

function fnBlock(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: function " + name);
  let d = 0, s = src.indexOf("{", i), e = -1;
  for (let j = s; j < src.length; j++) {
    const c = src[j];
    if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) { e = j; break; } }
  }
  return src.slice(i, e + 1);
}

let buildAlignmentContext, liftErr = null;
try {
  ({ buildAlignmentContext } = new Function(
    stripTypes(fnBlock("buildAlignmentContext")) +
    "\nreturn { buildAlignmentContext };")());
} catch (e) { liftErr = e; }
check("buildAlignmentContext lifts and evaluates", !liftErr, liftErr && liftErr.message);

/* ── Fixtures — live RPC shape ─────────────────────────────────────────────── */
const INTRO = "3-4 hours in Introduction to Flux Cored Arc Welding (FCAW)";
const ADV = "3-4 hours in Advanced Flux Cored Arc Welding (FCAW)";

const ROWS = [
  // The proposal: Cerritos' own closest course (the one the offerings rollup hid).
  { row_kind: "candidate", credit_rec: INTRO, rec_course: "Introduction to Flux Cored Arc Welding (FCAW)",
    college_name: "Cerritos College", subject: "WELD", course_number: "214L",
    course_title: "Flux Cored Arc Welding (FCAW) Certification Laboratory", units: 2, score: 0.671, attribution: null,
    match_kind: "title", rec_cid: null, course_cid: null, cid_title_divergent: false },
  { row_kind: "candidate", credit_rec: INTRO, rec_course: "Introduction to Flux Cored Arc Welding (FCAW)",
    college_name: "Cerritos College", subject: "WELD", course_number: "120",
    course_title: "Beginning Arc Welding", units: 5, score: 0.275, attribution: null,
    match_kind: "title", rec_cid: null, course_cid: null, cid_title_divergent: false },
  // The evidence: peers, INCLUDING the broader-course pattern a title match
  // cannot see (Santa Ana's SMAW course against an FCAW recommendation).
  { row_kind: "peer", credit_rec: INTRO, rec_course: "Introduction to Flux Cored Arc Welding (FCAW)",
    college_name: "Barstow Community College", subject: "WELD", course_number: "54B",
    course_title: "Flux Cored Arc Welding (FCAW)", units: null, score: null, attribution: "per_course" },
  { row_kind: "peer", credit_rec: INTRO, rec_course: "Introduction to Flux Cored Arc Welding (FCAW)",
    college_name: "Santa Ana College", subject: "WELD", course_number: "240",
    course_title: "Structural Welding SMAW", units: null, score: null, attribution: "per_course" },
  { row_kind: "candidate", credit_rec: ADV, rec_course: "Advanced Flux Cored Arc Welding (FCAW)",
    college_name: "Cerritos College", subject: "WELD", course_number: "214L",
    course_title: "Flux Cored Arc Welding (FCAW) Certification Laboratory", units: 2, score: 0.715, attribution: null,
    match_kind: "title", rec_cid: null, course_cid: null, cid_title_divergent: false },
  { row_kind: "peer", credit_rec: ADV, rec_course: "Advanced Flux Cored Arc Welding (FCAW)",
    college_name: "Santa Ana College", subject: "WELD", course_number: "244",
    course_title: "Welding Certification D1.1 Code Clinic", units: null, score: null, attribution: "per_course" },
];

const CRED = "ASME BPVC Section IX — FCAW Welder Qualification";

if (!liftErr) {
  const ctx = buildAlignmentContext(ROWS, CRED, "Cerritos College");

  /* ── 1. Sam's ask, both halves present ──────────────────────────────────── */
  check("names the college's own aligned course",
        ctx.includes("WELD 214L") &&
        ctx.includes("Flux Cored Arc Welding (FCAW) Certification Laboratory"),
        "this is the course faculty would otherwise have to guess at");

  check("names the peer colleges AND their course numbers",
        ctx.includes("Barstow Community College") && ctx.includes("WELD 54B") &&
        ctx.includes("Santa Ana College") && ctx.includes("WELD 240"),
        "the course number is what makes the precedent checkable");

  check("walks each credit recommendation separately",
        ctx.includes(INTRO) && ctx.includes(ADV));

  /* ── 2. The two kinds of claim stay SEPARATE ────────────────────────────── */
  // A candidate presented under the peers heading would be a guess wearing the
  // authority of a precedent.
  const introBlock = ctx.slice(ctx.indexOf(INTRO), ctx.indexOf(ADV));
  const candIdx = introBlock.indexOf("WELD 214L");
  const peerHeadIdx = introBlock.indexOf("ALREADY articulate");
  check("candidates are listed BEFORE the peer-articulation heading, not inside it",
        candIdx > -1 && peerHeadIdx > -1 && candIdx < peerHeadIdx);

  // These two used to pin the pre-ladder wording ("SUGGESTIONS for faculty to
  // weigh", "ranked by how closely the course TITLE matches, nothing more").
  // The ladder replaced that with a rung-specific heading, so the assertions
  // now guard the ENDURING intent — candidates read differently from peers, and
  // the basis for a suggestion is always stated — rather than the old phrasing.
  check("candidates are labelled by their evidence rung, peers as already articulating",
        /matching course by TITLE/.test(ctx) &&
        /ALREADY articulate this recommendation/.test(ctx));

  check("the evidence basis is stated explicitly, never left implicit",
        /no C-ID on either side to confirm it/.test(ctx) &&
        /faculty confirm the content/.test(ctx),
        "an unqualified ranking reads as an equivalence judgment");

  check("no similarity score is rendered to the model",
        !ctx.includes("0.671") && !ctx.includes("0.715"),
        "scores are rankings, not probabilities — printing one invites a confidence claim");

  /* ── 3. group_wide is never paired to a college ─────────────────────────── */
  const GROUP = [
    { row_kind: "peer", credit_rec: INTRO, rec_course: "x", college_name: "Lemoore College",
      subject: "ADJ", course_number: "22", course_title: "Legal Aspects of Corrections",
      units: null, score: null, attribution: "group_wide" },
    { row_kind: "peer", credit_rec: INTRO, rec_course: "x", college_name: "Norco College",
      subject: "AOJ", course_number: "7", course_title: "Legal Aspects of Corrections",
      units: null, score: null, attribution: "group_wide" },
  ];
  const g = buildAlignmentContext(GROUP, "Correctional Officer Core Course", "Cerritos College");
  check("group-wide peers are named as a GROUP, not paired to courses",
        /does not record which college used which/.test(g) &&
        /do NOT pair a college to a course/.test(g),
        "pairing here would send someone to a college that never taught that course");
  check("group-wide peers are NOT rendered under the exact-attribution heading",
        !/ALREADY articulate this recommendation, and the course each used/.test(g));

  /* ── 4. Honest empties ──────────────────────────────────────────────────── */
  const noCand = buildAlignmentContext(
    [ROWS[2]], CRED, "Cerritos College");   // a peer row only
  // This used to pin the sentence "No Cerritos College course has a similar
  // title". Sam asked (2026-08-13) that an empty result show the closest match
  // it could find unless obviously wrong; the honest answer turned out to be
  // POINT AT THE PEERS, because a recommendation only reaches this branch when
  // nothing shares a subject word with it — building the nearest-by-wording
  // version proposed "Introduction to Automotive Electrical" for POST's
  // "Introduction to Policing". So the assertion now guards the three enduring
  // guarantees rather than the sentence that happened to carry them.
  check("no similarly-titled course is stated plainly, and points at peers",
        /No Cerritos College course/.test(noCand) &&
        /different name/.test(noCand) &&
        /do NOT reach for the nearest-sounding course/.test(noCand),
        "stretching for a match is worse than saying there isn't one");

  /* ── 4b. A capped peer list must never read as a complete one ───────────── */
  // POST x Cerritos returned 3,807 peer rows against 9 candidates before the RPC
  // bounded them, which is what buried five C-ID-confirmed matches. The cap is
  // right; a cap the model cannot see is not.
  const CAPPED_PEER = {
    row_kind: "peer", credit_rec: INTRO, rec_course: "x", college_name: "Barstow College",
    subject: "WELD", course_number: "54B", course_title: "Flux Cored Arc Welding (FCAW)",
    units: null, score: null, attribution: "per_course", peer_total: 261,
  };
  const capped = buildAlignmentContext([CAPPED_PEER], CRED, "Cerritos College");
  check("a capped peer list states how many of the true total it is showing",
        /showing 1 of 261/.test(capped) && /never present this as the full list/.test(capped),
        "a sample that reads as a census is the silent-cap failure this repo keeps rediscovering");

  const whole = buildAlignmentContext(
    [{ ...CAPPED_PEER, peer_total: 1 }], CRED, "Cerritos College");
  check("a complete peer list is NOT hedged as a sample",
        !/showing 1 of/.test(whole),
        "hedging a full list teaches the model to doubt data that is actually complete");

  const noPeer = buildAlignmentContext([ROWS[0]], CRED, "Cerritos College");
  check("an unarticulated recommendation is framed as being FIRST, not as absent",
        /would be first/.test(noPeer));

  check("empty input renders nothing at all",
        buildAlignmentContext(null, CRED, "X") === "" &&
        buildAlignmentContext([], CRED, "X") === "");
}

/* ── 5. Wiring guards ─────────────────────────────────────────────────────── */
const backticks = (src.match(/(?<!\\)`/g) || []).length;
check("template literals balanced", backticks % 2 === 0,
      `${backticks} unescaped backticks — an unterminated literal kills the function at boot`);

check("calls the alignment RPC by its real name",
      /rpc\("credential_alignment_for_college"/.test(src));

check("the alignment lookup receives the handler's client (`sb`)",
      /fetchAlignment\(topTitle,\s*college,\s*sb\)/.test(src));

check("alignment only fires when BOTH a credential and a college are known",
      /if \(college && topTitle\)/.test(src),
      "\"which of my courses\" is meaningless without a subject");

check("ALIGNMENT_RULE ships only when the section is present",
      /alignmentContext \? ALIGNMENT_RULE : ""/.test(src));

check("the rule forbids equivalence language on a suggestion",
      /Never say a course "qualifies", "counts", "is equivalent" or "will be accepted"/.test(src));

check("the rule tells the model to surface a peer/title disagreement",
      /WHEN THE TWO DISAGREE, SAY SO/.test(src));

check("the rule teaches the ladder and its rungs",
      /THE LADDER — SAY WHICH RUNG A SUGGESTION CAME FROM/.test(src) &&
      /statewide course-identity standard/.test(src) &&
      /Never present rung 3 with the confidence of rung 1/.test(src));

check("the rule requires flagging a divergent C-ID rather than dropping it",
      /IF A C-ID MATCHES BUT THE NAMES DIVERGE, SAY SO/.test(src));

check("the rule prefers an honest blank to a stretch",
      /IF NOTHING MATCHES A RECOMMENDATION, SAY NOTHING MATCHED IT/.test(src));

check("the rule forbids inventing a course or college",
      /NEVER invent a course, a course number, or a college/.test(src));

/* ── Report ───────────────────────────────────────────────────────────────── */
let failed = 0;
for (const [ok, name] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "  ok" : "FAIL"}  ${name}`);
}
console.log(`\nsierra_alignment: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
