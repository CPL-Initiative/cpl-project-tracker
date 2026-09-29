// Mode 16r — the district roster assertion, and the drift guard under it.
//
// ⭐ WHY. chatbox/smoke_test.sh mode 16a asked whether Sierra answers a district
// question from the ROSTER rather than from a name match, and it asserted that
// by grepping her prose for "pierce" AND "valley" AND one of harbor/southwest/
// trade. It went red twice on 2026-09-09 (runs 153/154) on two DIFFERENT subsets
// of the nine LACCD colleges, both times against a correct answer — recorded in
// `cpl_memory` as `smoke-16a-prose-grep-fails-not-the-function-2026-09-09`.
//
// Asked what a DISTRICT should do, Sierra names the members her advice bears on.
// Which two or three that is is EMPHASIS, not capability — the same failure mode
// mode 7 paid for over four handoffs before 7r moved its property to retrieval.
//
// So 16a split in two, exactly as mode 7 did:
//   16r — does the district's ACTUAL membership reach the function?  (data)
//   16a — does she answer without the obsolete caveat, naming SOME of them?  (prose)
//
// ⚠ WHAT THIS FILE GUARDS. Mode 16r transcribes the function's own roster query
// — `map_colleges`, filtered on `district`, with MAP's sandbox rows dropped by
// `entity_kind`. Transcriptions drift silently: re-point the district route at
// another table and the smoke script keeps querying map_colleges, still passes,
// and quietly stops testing the retrieval the function actually performs. This
// file re-derives the route from index.ts on every run and fails when they part.
//
// Run from repo root: `npm test` (or `node tests/sierra_district_roster.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");
const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

// ── 1. The function still reads the roster mode 16r mirrors ──────────────────
block("1. still the same route", () => {
  check("(1) cpl-chat's district route selects from map_colleges",
    /\.from\("map_colleges"\)[\s\S]{0,200}?\.select\("college_name,district/.test(FN),
    "if the roster moves to another table, 16r is querying a road nobody drives "
    + "on — it would keep passing while the answer lost its data");
  check("(1) …filtered to rows that HAVE a district",
    /\.not\("district",\s*"is",\s*null\)/.test(FN));
  check("(1) ⚠ …with MAP's sandbox rows dropped by entity_kind",
    /\(r\.entity_kind \|\| "college"\) !== "college"\) continue/.test(FN),
    "test orgs must never reach an answer; 16r drops them the same way, and if "
    + "the function stops doing it the smoke count silently starts disagreeing");
});

// ── 2. Mode 16r mirrors it, rather than having drifted ───────────────────────
block("2. the transcription still matches", () => {
  check("(2) 16r queries map_colleges over REST",
    /district_roster\(\)\s*\{[\s\S]{0,400}?REST_BASE\/map_colleges/.test(SMOKE));
  check("(2) …keyed on the district column",
    /--data-urlencode "district=eq\.\$1"/.test(SMOKE));
  check("(2) ⚠ …and applies the SAME entity_kind filter as the function",
    /\(r\.get\("entity_kind"\) or "college"\) == "college"/.test(SMOKE),
    "the function drops non-college rows before counting; if 16r stops doing "
    + "the same, the two disagree about what the roster contains");
  check("(2) 16r keeps a negative control before its assertion",
    /16r negative control FAILED/.test(SMOKE),
    '"did these names come back?" is answered by an empty body just as '
    + "convincingly by a broken call as by a real miss");
  check("(2) 16r keeps a positive control",
    /16r positive control FAILED/.test(SMOKE));
});

// ── 3. The threshold is a threshold, not a pinned member ─────────────────────
// Mode 14 learned that an assertion pinned to a value which can leave the data
// stops being a guard the moment it does. A college can leave a district on any
// nightly load, so both 16r and 16a assert a FLOOR over a known set.
block("3. floors, not pinned members", () => {
  const laccd = (SMOKE.match(/LACCD = \[([\s\S]*?)\]/) || [])[1] || "";
  const names = laccd.match(/"[^"]+"/g) || [];
  check("(3) 16r's LACCD list holds the nine member colleges",
    names.length === 9,
    "found " + names.length + " — if the district genuinely changed size, move "
    + "the floor deliberately rather than letting the list drift");
  const floor = (SMOKE.match(/roster_hits:-0\}"\s*-ge\s*(\d+)/) || [])[1];
  check("(3) …and asserts a FLOOR under it, not all nine",
    floor && Number(floor) > 0 && Number(floor) < names.length,
    "floor reads " + floor + " against " + names.length + " colleges");
  const need = (SMOKE.match(/answer_must_name_at_least -i (\d+) "16a/) || [])[1];
  check("(3) 16a asks the ANSWER for a floor too, not for named colleges",
    need && Number(need) >= 1,
    "naming NONE of the nine is the real regression — the roster did not reach "
    + "her and she fell back to the caveat");
  check("(3) ⭐ 16a no longer pins Pierce or Valley by name",
    !/answer_must_match -i "pierce"/.test(SMOKE)
    && !/answer_must_match -i "valley"/.test(SMOKE),
    "this is the 2026-09-09 failure itself; restoring either grep re-creates it");
});

// ── 4. The prose half kept the assertions that DON'T depend on emphasis ──────
block("4. the bans survived the split", () => {
  check("(4) 16a still bans the obsolete 'cannot enumerate' caveat",
    /no 'cannot enumerate a district' caveat/.test(SMOKE),
    "Sam reported the caveat as the first thing he noticed (2026-08-21); "
    + "hedging over a complete answer teaches the reader to discount every hedge");
  check("(4) 16a still bans the 'Students Awarded' label",
    /does not use the 'Students Awarded' label/.test(SMOKE),
    "the figure counts students with a CPL record, not awards");
  check("(4) ⭐ 16b still covers a district named after none of its colleges",
    /16b ⭐ names Laney — unreachable by name match/.test(SMOKE),
    "LACCD is reachable by name match because MAP happens to store its colleges "
    + "as 'Los Angeles …'; Peralta is the case that can ONLY come from the roster");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_district_retrieval.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
