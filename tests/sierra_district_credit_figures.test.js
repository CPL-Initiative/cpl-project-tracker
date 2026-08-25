// cpl-chat — a district answer's per-college figures come from the LIVE table.
//
// ⭐ WHY. Sam, 2026-08-24, on a My College answer about Riverside CCD: "The data
// are wrong, particularly for Moreno Valley College, which has many students and
// is very active in MAP and has many transcribed units." Sierra rendered:
//
//     Moreno Valley College | 26 | 0 | 0 | 0
//
// The live table says 2,887 students, 14,029 applied units and 12,861
// transcribed — Moreno Valley is the LARGEST of RCCD's three colleges. Every
// figure in that table matched chatbox_college_profiles.credit_distribution,
// whose updated_at is 2026-06-25 21:59:58 and which NOTHING refreshes.
//
// ⚠ THE MECHANISM WAS A HOLE, NOT A BUG. `singleProfile` is null whenever the
// profile lookup returns an ARRAY — which is what a district question returns —
// so shapeCreditStatus was called with collegeName = null and produced no
// per-college figures at all. The stale profile line was then the only
// per-college source left in the entire context, while TABLE_COLUMN_RULE
// actively instructed the model to build exactly that table and claimed the
// values were "given for every college below".
//
// ⚠ AND A FALSE ZERO IS THE WORST ANSWER SIERRA GIVES: it reads as an inactive
// college, it closes the conversation, and nobody files feedback about a door
// they were told was not there. Measured across the 103 colleges that join, the
// snapshot understated transcribed units by 61% and students by 40%, with a
// false zero for transcribed at 17 colleges and for students at 6.
//
// Run from repo root: `npm test` (or `node tests/sierra_district_credit_figures.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

let M = null;
block("(0)", function () {
  M = liftBlock(SRC, "function shapeCreditStatus(", "/**\n * Route CRED-STD",
    ["shapeCreditStatus", "fmtN"]);
  check("(0) shapeCreditStatus lifts out of the edge function", !!(M && M.shapeCreditStatus));
});

// The real shape of the live tables, with RCCD's real figures as of 2026-08-24.
// Norco is college_id 1, Riverside City 2, Moreno Valley 3.
const RAW = {
  summary: [
    { college_id: 1, students: 780, suppressed: false, dormant_credits: 5914,
      articulated_waiting: 660, applied_credits: 6663.5, transcribed_credits: 4049 },
    { college_id: 2, students: 859, suppressed: false, dormant_credits: 718,
      articulated_waiting: 15, applied_credits: 4160, transcribed_credits: 4016 },
    { college_id: 3, students: 2887, suppressed: false, dormant_credits: 4421,
      articulated_waiting: 0, applied_credits: 14029, transcribed_credits: 12861 },
    // A suppressed college and a college absent from the summary, to prove the
    // two "not a zero" paths below are real rather than asserted.
    { college_id: 9, students: null, suppressed: true, dormant_credits: null,
      articulated_waiting: null, applied_credits: null, transcribed_credits: null },
  ],
  colleges: [
    { college_id: 1, college_name: "Norco College", entity_kind: "college" },
    { college_id: 2, college_name: "Riverside City College", entity_kind: "college" },
    { college_id: 3, college_name: "Moreno Valley College", entity_kind: "college" },
    { college_id: 9, college_name: "Tiny College", entity_kind: "college" },
    { college_id: 8, college_name: "Absent College", entity_kind: "college" },
  ],
  goal2: [],
  load: [{ loaded_at: "2026-08-24T13:40:00Z" }],
};
const RCCD = ["Moreno Valley College", "Norco College", "Riverside City College"];

/* ── (1) THE DISTRICT SHAPE PRODUCES LIVE PER-COLLEGE FIGURES ─────────────── */
block("(1)", function () {
  if (!M) return;
  // collegeName NULL is the district case: singleProfile is null for an array.
  const cs = M.shapeCreditStatus(RAW, null, RCCD);
  check("(1) a district scope still yields a credit status", !!cs);
  check("(1) ⭐ every named college gets a roster row",
    cs && Array.isArray(cs.roster) && cs.roster.length === 3);

  const mvc = cs && cs.roster.find((r) => r.name === "Moreno Valley College");
  check("(1) ⭐ Moreno Valley carries its LIVE figures, not the June snapshot",
    mvc && mvc.students === 2887 && mvc.applied === 14029 && mvc.transcribed === 12861,
    "the snapshot said 0 / 0 / 0 for the largest college in the district");
  check("(1) ⚠ …and is not zero on any measure",
    mvc && mvc.students > 0 && mvc.applied > 0 && mvc.transcribed > 0);

  const norco = cs && cs.roster.find((r) => r.name === "Norco College");
  check("(1) transcribed is non-zero where the live table says so",
    norco && norco.transcribed === 4049,
    "the snapshot reported 0 transcribed for all three RCCD colleges");
});

/* ── (2) NEITHER "ABSENT" NOR "SUPPRESSED" MAY BECOME A ZERO ──────────────── */
block("(2)", function () {
  if (!M) return;
  const cs = M.shapeCreditStatus(RAW, null, ["Absent College", "Tiny College", "Norco College"]);
  const absent = cs.roster.find((r) => r.name === "Absent College");
  check("(2) ⭐ a college with no row is flagged, not zeroed",
    absent && absent.hasRow === false && absent.students === undefined,
    `"not in this dataset" and "zero" are different statements`);

  const tiny = cs.roster.find((r) => r.name === "Tiny College");
  check("(2) ⭐ a suppressed college keeps NULL measures and its flag",
    tiny && tiny.hasRow === true && tiny.suppressed === true && tiny.students === null,
    "rendering a suppressed cell as 0 leaks the opposite of what k-anonymity protects");
});

/* ── (3) THE SINGLE-COLLEGE SHAPE IS UNCHANGED ────────────────────────────── */
block("(3)", function () {
  if (!M) return;
  const cs = M.shapeCreditStatus(RAW, "Moreno Valley College", null);
  check("(3) a named college still gets its own block",
    cs && cs.college && cs.college.students === 2887);
  check("(3) …and no roster is invented for a single college",
    cs && Array.isArray(cs.roster) && cs.roster.length === 0);
  // A one-college array is the same shape as a single college upstream.
  const one = M.shapeCreditStatus(RAW, "Norco College", ["Norco College"]);
  check("(3) ⚠ a ONE-college roster does not trigger the district block",
    one && one.roster.length === 0,
    "the roster block is for a set; one college is already served by cs.college");
});

/* ── (4) THE STALE SOURCE IS GONE, AND THE TABLE RULE POINTS AT THE LIVE ONE ─ */
block("(4)", function () {
  check("(4) ⭐ the profile block no longer emits credit_distribution",
    !/ctx \+= `Credit distribution:/.test(SRC),
    "this line was the only per-college source in a district answer, and it was frozen in June");
  check("(4) ⚠ …and no per-college figure is read off a profile at all",
    !/cr\.eligible_credits|cr\.applied_credits|cr\.transcribed_credits|cr\.students_awarded/.test(SRC));
  check("(4) the table rule no longer claims the values sit in the profile blocks",
    !/it is given for every college below/.test(SRC),
    "a prompt must not promise a number it cannot show");
  check("(4) ⭐ the table rule sends the model to the live credit section",
    /TAKE EVERY NUMBER FROM THE "CPL CREDIT DISPOSITION" SECTION/.test(SRC));
  check("(4) ⭐ …and forbids writing 0 for absent or withheld",
    /NEVER write 0 for either/.test(SRC));
  check("(4) the roster is passed from the resolved profiles, not re-derived",
    /shapeCreditStatus\(creditData, singleProfile\?\.college \|\| null, rosterNames\)/.test(SRC));
});

/* ── (5) THE RENDERED CONTEXT SAYS THE RIGHT THINGS ───────────────────────── */
block("(5)", function () {
  if (!M) return;
  let B = null;
  try {
    /* ⚠ fmtN sits ~700 lines ABOVE buildCreditContext, with Deno-dependent code
     * in between, so neither a single slice nor a lift of buildCreditContext
     * alone works — the latter evaluates to "fmtN is not defined". Splice the
     * two REAL source ranges together instead of re-implementing fmtN here: a
     * re-implementation drifts and stops guarding the formatting the assertions
     * below actually match on. */
    const fmtSrc = SRC.slice(SRC.indexOf("function fmtN("),
                             SRC.indexOf("/**\n * Route CRED-STD"));
    const bcc = SRC.slice(SRC.indexOf("function buildCreditContext("),
                          SRC.indexOf("// Proximity band for ranking"));
    const synth = fmtSrc + "\n" + bcc + "\n// __LIFT_END__\n";
    B = liftBlock(synth, "function fmtN(", "// __LIFT_END__",
      ["buildCreditContext", "fmtN"]);
    check("(5) the spliced lift carries BOTH functions",
      typeof B.buildCreditContext === "function" && B.fmtN(2887) === "2,887");
  } catch (e) { check("(5) buildCreditContext lifts — " + e.message, false); return; }

  const cs = M.shapeCreditStatus(RAW, null, RCCD.concat(["Absent College", "Tiny College"]));
  const txt = B.buildCreditContext(cs);
  check("(5) ⭐ Moreno Valley's live numbers reach the prompt",
    /Moreno Valley College: 2,887 CPL students/.test(txt) && /12,861 units transcribed/.test(txt));
  check("(5) ⚠ the absent college is described, not zeroed",
    /Absent College: NOT in the credit dataset/.test(txt) && !/Absent College: 0/.test(txt));
  check("(5) ⚠ the suppressed college is described, not zeroed",
    /Tiny College: fewer than 10 CPL students/.test(txt) && !/Tiny College: 0/.test(txt));
  check("(5) the section tells the model these are the only per-college numbers",
    /USE THESE NUMBERS AND NO OTHERS/.test(txt));
  // ⚠ Guard the shape too: a single-college answer must not grow a roster list.
  const solo = B.buildCreditContext(M.shapeCreditStatus(RAW, "Norco College", null));
  check("(5) a single-college answer carries no per-college roster block",
    !/PER-COLLEGE FIGURES FOR THE COLLEGES NAMED ABOVE/.test(solo));
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_district_credit_figures.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
