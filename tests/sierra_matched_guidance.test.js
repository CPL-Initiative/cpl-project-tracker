// Instructions matched to the question (Sam, Open Asks Sheet 153 card 3, "deploy", 2026-11-01).
//
// Sam: "worrying that we are removing part of her brain to stuff in different parts." cpl-chat sent every
// active instruction newest first until 9,000 characters, the question playing no part, so the oldest went
// for every question. These checks run cpl-chat's own functions, lifted from index.ts:
//   (1) a standing rule (no When/If) goes first, whatever the question;
//   (2) a conditional rule whose trigger shares a distinctive word with the question goes before the newer
//       unmatched ones, so the oldest rule reaches Sierra when the question is about it;
//   (3) ask-shape words ("someone asks something like", "college", "table") match nothing;
//   (4) the sent and dropped ids follow guidanceBlock's budget exactly;
//   (5) the function logs them in timings.guidance and passes the question in.
// Run from repo root: `npm test` (or `node tests/sierra_matched_guidance.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

const kw = SRC.slice(SRC.indexOf("const TOPIC_STOP_WORDS"), SRC.indexOf("// Words that mark a follow-up as NARROWING"));
const g0 = SRC.indexOf("const GUIDANCE_GENERIC"), g1 = SRC.indexOf("async function fetchTeamGuidance(");
const gb0 = SRC.indexOf("function guidanceBlock("), gb1 = SRC.indexOf("/* ── Instructions matched to the question");
const lifted = kw + "\nconst GUIDANCE_MAX_CHARS_PER_RULE = 1500;\n" + SRC.slice(gb0, gb1) + SRC.slice(g0, g1) + "//END";
let G = null;
try {
  G = liftBlock(lifted, "const TOPIC_STOP_WORDS", "//END",
    ["orderGuidanceForQuestion", "guidanceSentIds", "guidanceBlock", "isStandingRule", "guidanceWords"]);
} catch (e) { check("lift", false, e.message); }

if (G) {
  // Newest first, as the table read returns them.
  const rows = [
    { id: "vet00001", rule: 'When someone asks something like "which colleges have not yet met the 75% JST vet sprint goal for the new funding?", answer from the JST block.' },
    { id: "name0002", rule: "Name only what the reader can open." },
    { id: "kitch003", rule: 'When someone asks something like "What does the Basic Kitchen Skills program at Cabrillo College require? I have a ServSafe certificate," answer with a table.' },
    { id: "great004", rule: 'Don\'t start every Sierra response with "Great question."' },
    { id: "trans005", rule: "When referring to Transcribing CPL, note that we are not asking colleges to primarily transcribe in their local SIS." },
  ];
  const o1 = G.orderGuidanceForQuestion(rows, "Which colleges have not met the vet sprint goal?");
  check("(1) standing rules go first, in their own order",
    o1.rows[0].id === "name0002" && o1.rows[1].id === "great004", o1.rows.map((r) => r.id).join(","));
  check("(2) the matching rule follows them, and is named as matched",
    o1.rows[2].id === "vet00001" && o1.matched.join(",") === "vet00001", o1.matched.join(","));
  const o2 = G.orderGuidanceForQuestion(rows, "Should a college transcribe CPL in its local SIS?");
  check("(2) ⭐ the oldest rule moves up when the question is about it",
    o2.rows[2].id === "trans005" && o2.matched.join(",") === "trans005", o2.rows.map((r) => r.id).join(","));
  check("(2) the unmatched conditionals keep newest first behind it",
    o2.rows.slice(3).map((r) => r.id).join(",") === "vet00001,kitch003");
  const o3 = G.orderGuidanceForQuestion(rows, "Can someone ask something like which college has a table?");
  check("(3) ask-shape words match nothing", o3.matched.length === 0, o3.matched.join(","));
  check("(3) with no match the order is today's: standing, then newest first",
    o3.rows.map((r) => r.id).join(",") === "name0002,great004,vet00001,kitch003,trans005");
  const budget = rows[1].rule.length + rows[3].rule.length + rows[0].rule.length + 2;
  const ids = G.guidanceSentIds(o1.rows, budget);
  const text = G.guidanceBlock(o1.rows, budget);
  check("(4) the sent ids are the rules guidanceBlock carries",
    ids.sent.join(",") === "name0002,great004" || ids.sent.every((id) => text.includes(rows.find((r) => r.id === id).rule.slice(0, 20))),
    ids.sent.join(","));
  check("(4) everything past the budget is dropped, in order",
    ids.sent.length + ids.dropped.length === rows.length && ids.dropped.every((id) => !text.includes(rows.find((r) => r.id === id).rule.slice(0, 30))),
    JSON.stringify(ids));
  check("(4) an empty question changes nothing", G.orderGuidanceForQuestion(rows, "").matched.length === 0);
  // The 7v regression (preview A/B, 2026-11-01): one shared word is not a match.
  const k = G.orderGuidanceForQuestion(rows, "You have the noncredit courses in COCI and the MIS program and course dataset. Check again and let me know.");
  check("(6) ⭐ one shared word is not a match (the noncredit follow-up leaves the kitchen rule where it was)", k.matched.length === 0, k.matched.join(","));
}
check("(5) the function passes the question and a log object in",
  /fetchTeamGuidance\(sb, hostSurface, routeText, guidanceLog\)/.test(SRC));
check("(5) the turn's timings carry the log", /guidance: guidanceLog,/.test(SRC));
check("(5) both reads select the id", (SRC.match(/\.select\("id, rule"\)/g) || []).length === 2);

let failed = 0;
for (const [name, ok, why] of results) { console.log((ok ? "PASS " : "FAIL ") + name + (ok || !why ? "" : "\n     " + why)); if (!ok) failed++; }
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
