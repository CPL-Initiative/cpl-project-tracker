// search_college_programs: the fuzzy fallback reads one college through its index (S400).
//
// A college-scoped call that matched nothing fell through to a fallback filtered
// with `(college_filter is null or p.college = college_filter)`. plpgsql caches a
// generic plan on a pooled connection, and a generic plan cannot use
// coci_programs_college for that OR, so the call scanned every statewide program:
// 2.06 s under force_generic_plan against anon's 3 s limit, where
// `p.college = $1` takes 0.25 s. The cpl-chat smoke's 7l negative control timed
// out with 57014 on 2026-10-16 (run 38957574640). The failure is silent in
// Sierra: the route drops out of Promise.all and the answer reads complete.
//
//  (1) The canonical file's fallback has one branch per scope, and the
//      college-scoped branch filters by equality alone.
//  (2) The migration file carries the canonical fallback, byte for byte, so the
//      file that was applied and the file that documents it cannot part. Only
//      the fallback: a later migration may change the passes above it (S521's
//      no-copy change did), and tests/sierra_program_search_no_copy.test.js pins
//      the newest migration to the whole canonical function.
//  (3) The smoke's negative control still runs, so a regression shows in CI.
//
// Run from repo root: `npm test` (or `node tests/sierra_program_search_fallback.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const CANON = fs.readFileSync("chatbox/supabase_search_college_programs.sql", "utf8");
const MIG = fs.readFileSync("chatbox/supabase_search_college_programs_fallback_2026_10_16.sql", "utf8");
const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");

function fnOf(src) {
  const a = src.indexOf("create or replace function public.search_college_programs(");
  const b = src.indexOf("$function$;", a);
  return a < 0 || b < 0 ? "" : src.slice(a, b + "$function$;".length);
}
const fn = fnOf(CANON);
const code = fn.replace(/--[^\n]*/g, "");

// ── (1) one branch per scope ──
const scoped = code.indexOf("if not found and college_filter is not null then");
const statewide = code.indexOf("elsif not found then");
check("(1) precondition: the canonical file holds the function", fn.length > 5000, fn.length);
check("(1) ⭐ the fallback opens with a college-scoped branch", scoped > 0);
check("(1) …followed by the statewide branch", statewide > scoped);
const scopedBlock = scoped > 0 && statewide > scoped ? code.slice(scoped, statewide) : "";
check("(1) ⭐ the scoped branch filters by equality, which the index serves",
  /where p\.college = college_filter\b/.test(scopedBlock));
check("(1) ⭐ …and never by the OR a generic plan cannot index",
  !/college_filter is null or p\.college = college_filter/.test(scopedBlock), scopedBlock.slice(0, 200));
check("(1) the old single `if not found then` fallback is gone",
  !/\n\s*if not found then\b/.test(code));
// Both branches keep the same similarity floor and order, so the rows match.
const sim = (s) => (s.match(/word_similarity\(/g) || []).length;
check("(1) both branches keep the same similarity filter and ordering",
  sim(scopedBlock) === 2 && sim(code.slice(statewide)) === 2,
  sim(scopedBlock) + " / " + sim(code.slice(statewide)));

// ── (2) the applied file is the documented one ──
// From the fallback's first branch to the end of the function.
const fallbackOf = (f) => { const i = f.indexOf("if not found and college_filter is not null then"); return i < 0 ? "" : f.slice(i); };
check("(2) ⭐ the migration carries the canonical fallback byte for byte",
  fallbackOf(fn).length > 1000 && fallbackOf(fnOf(MIG)) === fallbackOf(fn));
check("(2) the migration re-runs nothing else (no drop, no grant, no other function)",
  !/\bdrop\b|\bgrant\b|\brevoke\b/i.test(MIG.replace(/--[^\n]*/g, ""))
    && (MIG.match(/create or replace function/gi) || []).length === 1);

// ── (3) the smoke still asks ──
check("(3) the smoke's 7l negative control still posts a nonsense phrase",
  /program_courses_call '\["zzq qqz"\]'/.test(SMOKE) && /7l negative control FAILED/.test(SMOKE));

let pass = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why !== undefined ? "\n        > " + why : ""));
  if (ok) pass++;
}
console.log("\nsierra_program_search_fallback.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
