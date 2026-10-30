// search_college_programs reads the table, never a copy of it (S521, 2026-10-30).
//
// Until S521 the function copied all 22,335 rows of coci_college_programs, their
// four stored vectors and two concatenations of them, into a MATERIALIZED CTE.
// work_mem is 2 MB, so the copy went to temp files and each pass read it back:
// 9,051 pages written and 18,106 read for the six-term Orange County question,
// 35,703 and 88,246 for a 30-term call. Since 2026-10-26 the route was the
// database's largest consumer (862 calls, mean 2,014 ms, max 7,782) and smoke 7c
// timed out at ~7.5 s against the anon key's 3 s. Reading the table itself writes
// no temp page. This test pins that, and that the migration applies exactly the
// source file's block:
//
//   1. The function body holds no MATERIALIZED CTE and concatenates no vector.
//   2. Both passes read public.coci_college_programs directly, and the DF pass
//      tests both halves of a surface where the copy tested their concatenation.
//   3. The migration's function block is the source file's, character for
//      character; the rollback's is the copy version it replaces.
//
// Run from repo root: `npm test` (or `node tests/sierra_program_search_no_copy.test.js`).
const fs = require("fs");
const path = require("path");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
const SRC = read("chatbox/supabase_search_college_programs.sql");
const MIG = read("kb/migrations/2026-10-30_s521_search_college_programs_no_copy.sql");
const RB = read("kb/migrations/2026-10-30_s521_search_college_programs_no_copy_rollback.sql");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function fnBlock(text) {
  const f = text.indexOf("create or replace function public.search_college_programs(");
  const e = f === -1 ? -1 : text.indexOf("$function$;", f);
  return e === -1 ? "" : text.slice(f, e + "$function$;".length);
}
function bodyOf(block) {
  const b = block.indexOf("as $function$");
  const e = block.lastIndexOf("$function$;");
  return b === -1 || e === -1 ? "" : block.slice(b + "as $function$".length, e);
}
// Comment text names the old copy on purpose (NO COPY); the checks read code only.
const code = (s) => s.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");

const src = fnBlock(SRC);
const body = code(bodyOf(src));
check("(1) the function body is found", body.length > 1000);
check("(1) ⚠ no MATERIALIZED CTE (a copy of the table spills past work_mem to temp)",
  !/\bas\s+materialized\b/i.test(body));
check("(1) ⚠ no vector concatenation (te || ts built a new tsvector per row)",
  !/tsv_\w+\s*\|\|\s*\w+\.tsv_/.test(body));
check("(1) no CTE named tv, and nothing reads tv.", !/\btv\s+as\b/.test(body) && !/\btv\./.test(body));

check("(2) the DF pass reads the table: terms cross join public.coci_college_programs p",
  /from terms tm cross join public\.coci_college_programs p\b/.test(body));
check("(2) the ranked match reads the table: public.coci_college_programs p cross join q4",
  /from public\.coci_college_programs p cross join q4\b/.test(body));
const squash = (s) => s.replace(/\s+/g, " ");
check("(2) a non-phrase term counts on the title surface when either title vector matches",
  squash(body).includes("else p.tsv_title_en @@ tm.q or p.tsv_title_simple @@ tm.q end) as df_t"));
check("(2) …and on the code surface when either code vector matches",
  squash(body).includes("else p.tsv_code_en @@ tm.q or p.tsv_code_simple @@ tm.q end) as df_c"));
check("(2) a phrase still counts on the english vectors alone",
  squash(body).includes("case when tm.kind = 'phrase' then p.tsv_title_en @@ tm.q")
  && squash(body).includes("case when tm.kind = 'phrase' then p.tsv_code_en @@ tm.q"));

check("(3) ⚠ the migration applies exactly the source file's function block", fnBlock(MIG) === src && src.length > 0);
check("(3) the migration changes nothing else (one CREATE, no DROP, no ALTER)",
  (code(MIG).match(/\bcreate\b/gi) || []).length === 1 && !/\b(drop|alter)\b/i.test(code(MIG)));
check("(3) the rollback is the copy version (its body holds the materialized tv)",
  /with tv as materialized/.test(bodyOf(fnBlock(RB))));
check("(3) the rollback keeps the same signature",
  fnBlock(RB).slice(0, fnBlock(RB).indexOf(")")) === src.slice(0, src.indexOf(")")));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
