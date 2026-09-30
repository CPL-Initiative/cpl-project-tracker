// search_college_programs reads STORED vectors (2026-09-30, Sam: "Go ahead
// with the stored vectors").
//
// The function built four tsvectors for all 22,335 rows of
// coci_college_programs on every call: through PostgREST 1,391 calls averaged
// 2,353 ms (max 7,951) against the anon key's 3 s, and smoke 7p timed out on
// run 36784284959. The vectors now live on the row as generated columns. Three
// things keep that true, and this test pins each:
//
//   1. The function builds no tsvector. A to_tsvector( back in its body is the
//      per-call cost returning.
//   2. A stored value does not follow its function: Postgres accepts a CREATE
//      OR REPLACE of cx_search_norm while the columns depend on it and keeps
//      the old vectors. chatbox/supabase_search_exhibits_by_topic_v2.sql, which
//      defines cx_search_norm, recomputes the columns right AFTER the
//      definition, with the SAME four expressions; the verify file's A9 counts
//      stale rows with them too. An expression that drifts in one place is a
//      recompute that never fires, or a check that always fails.
//   3. Nothing writes the columns: a generated column accepts no value in an
//      INSERT, so the loader must not name them.
//
// Run from repo root: `npm test` (or `node tests/sierra_program_search_stored_vectors.test.js`).
const fs = require("fs");
const path = require("path");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
const PROG = read("chatbox/supabase_search_college_programs.sql");
const EXH = read("chatbox/supabase_search_exhibits_by_topic_v2.sql");
const VER = read("chatbox/verify_search_college_programs.sql");
const SYNC = read("chatbox/sync_coci_offerings.py");
const RECEIPT_PATH = "kb/receipts/search_college_programs_stored_vectors_2026-09-30.sql";

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const COLS = ["tsv_title_en", "tsv_title_simple", "tsv_code_en", "tsv_code_simple"];
const squash = (s) => String(s || "").replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();

// ── 1. The four generated columns, and their expressions ────────────────────
const gen = {};
for (const c of COLS) {
  const m = new RegExp("add column if not exists " + c + " tsvector generated always as\\s*\\(([\\s\\S]*?)\\) stored").exec(PROG);
  gen[c] = m ? squash(m[1]) : null;
  check(`(1) ${c} is a generated STORED tsvector column`, !!gen[c]);
}
check("(1) the title columns vectorize cx_search_norm(program_title), english and simple",
  gen.tsv_title_en === "to_tsvector('english', public.cx_search_norm(program_title))"
  && gen.tsv_title_simple === "to_tsvector('simple', public.cx_search_norm(program_title))");
check("(1) the code columns vectorize top_title + cip_title, english and simple",
  /^to_tsvector\('english', public\.cx_search_norm\(coalesce\(top_title,''\) \|\| ' ' \|\| coalesce\(cip_title,''\)\)\)$/.test(gen.tsv_code_en || "")
  && /^to_tsvector\('simple', public\.cx_search_norm\(coalesce\(top_title,''\) \|\| ' ' \|\| coalesce\(cip_title,''\)\)\)$/.test(gen.tsv_code_simple || ""));

// ── 2. The function reads them and builds none ──────────────────────────────
const f0 = PROG.indexOf("create or replace function public.search_college_programs(");
const b0 = f0 === -1 ? -1 : PROG.indexOf("as $function$", f0);
const b1 = b0 === -1 ? -1 : PROG.indexOf("$function$;", b0 + 13);
const body = b1 === -1 ? "" : PROG.slice(b0 + 13, b1);
check("(2) the function body is found", body.length > 1000);
check("(2) ⚠ the function builds no tsvector (to_tsvector would put the per-call cost back)",
  body && !/to_tsvector\s*\(/.test(body));
check("(2) its tv CTE reads all four stored columns",
  COLS.every((c) => new RegExp("\\bp\\." + c + "\\b").test(body)));
check("(2) the columns are added before the function that reads them",
  PROG.indexOf("add column if not exists tsv_title_en") !== -1
  && PROG.indexOf("add column if not exists tsv_title_en") < f0);

// ── 3. The recompute follows cx_search_norm, with the same expressions ─────
const normDef = EXH.indexOf("create or replace function public.cx_search_norm(");
const rc = EXH.indexOf("update public.coci_college_programs");
check("(3) the file that defines cx_search_norm recomputes the stored columns", rc !== -1);
check("(3) ⚠ …AFTER the definition (before it, a changed normalizer leaves stale vectors)",
  normDef !== -1 && rc > normDef);
const rcBlock = rc === -1 ? "" : EXH.slice(rc, EXH.indexOf("end if;", rc));
check("(3) the recompute resets all four columns to default",
  COLS.every((c) => new RegExp("\\b" + c + " = default\\b").test(rcBlock)));
function distinctExprs(text) {
  const out = {};
  for (const c of COLS) {
    const m = new RegExp("\\b" + c + " is distinct from\\s*\\(([\\s\\S]*?)\\)\\s*(?:\\n\\s*or\\b|;|$)").exec(text);
    out[c] = m ? squash(m[1]) : null;
  }
  return out;
}
const rcExpr = distinctExprs(rcBlock);
check("(3) ⚠ the recompute's four expressions equal the column definitions",
  COLS.every((c) => rcExpr[c] && rcExpr[c] === gen[c]));
check("(3) the recompute is skipped until the columns exist (a fresh database runs this file first)",
  /if exists \(select 1 from information_schema\.columns[\s\S]*column_name = 'tsv_title_en'\)/.test(EXH.slice(normDef, rc)));

// ── 4. The verify file counts stale rows with the same expressions ──────────
const a9 = VER.indexOf("A9");
const a9Block = a9 === -1 ? "" : VER.slice(a9, VER.indexOf("raise exception 'A9 FAIL", a9));
const verExpr = distinctExprs(a9Block);
check("(4) verify A9 counts stale stored vectors", a9 !== -1 && /raise exception 'A9 FAIL/.test(VER));
check("(4) ⚠ A9's four expressions equal the column definitions",
  COLS.every((c) => verExpr[c] && verExpr[c] === gen[c]));
check("(4) Part A reports nine checks", /PART A: 9 checks passed/.test(VER));

// ── 5. Nothing writes the generated columns ─────────────────────────────────
const ld = PROG.indexOf("create or replace function public.coci_programs_replace(");
const ldBody = ld === -1 ? "" : PROG.slice(ld, PROG.indexOf("$function$;", ld));
const ins = /insert into public\.coci_college_programs\s*\(([^)]*)\)/.exec(ldBody);
check("(5) the loader names its INSERT columns", !!ins);
check("(5) ⚠ …and none of them is a stored vector (a generated column takes no value)",
  ins && !/tsv_/.test(ins[1]));
check("(5) the sync script sends no stored-vector key", !/tsv_/.test(SYNC));

// ── 6. The receipt holds the rollback ───────────────────────────────────────
const receipt = fs.existsSync(path.join(__dirname, "..", RECEIPT_PATH)) ? read(RECEIPT_PATH) : "";
check("(6) the receipt exists", receipt.length > 0);
check("(6) it records the BEFORE function hash and the rollback order",
  /e6f7f08713b19565e65dc774d388ffc4/.test(receipt) && /ROLLBACK/.test(receipt)
  && COLS.every((c) => receipt.includes("drop column if exists " + c)));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
