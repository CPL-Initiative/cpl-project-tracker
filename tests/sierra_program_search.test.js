// The program-search route — and the one collapse that would make it harmful.
//
// ⭐ WHY THIS FILE EXISTS. Until 2026-09-17 Sierra had no view of program data
// at all: search_college_offerings reads a COURSE rollup, and
// coci_college_programs sat unread at 22,335 rows over 118 colleges. She
// declined a real student question about LVN programs for that reason.
//
// ⚠️ THE FAILURE THIS GUARDS IS NOT "no results" — it is a CONFIDENT WRONG ONE.
// Measured on the active COCI export: the LVN question finds 53 colleges by
// program title, 44 by either code, and 56 in union — 12 colleges only the
// title finds, 3 only a code finds. Neither surface alone decides, so the RPC
// returns the union and reports `matched_via` per row.
//
// TWO HALVES OF ONE TRAP, AND THIS FILE GUARDS ONLY THE FIRST:
//
//   1. A CODE-ONLY match presented as the program asked for. Chabot's
//      "Registered Nursing" comes back on the LVN question because the shared
//      TOP/CIP code says Registered Nursing — it is NOT an LVN program.
//      buildProgramsContext must keep code-only rows in a separate, labeled
//      bucket, and that is what the assertions below pin. A "did it return
//      rows" check cannot see this: both the right and the wrong shape return
//      the same rows.
//
//   2. A TITLE-matched program that is for somebody else. "LVN 30 Unit Option"
//      and "LVN to RN" are bridges REQUIRING an LVN license to enter, and their
//      titles do say LVN, so they land in the named bucket correctly. Whether
//      one fits the person asking is a question about the title and the award,
//      which no bucketing can answer — PROGRAMS_RULE carries it, and block 6
//      asserts the rule still says so. Detecting "to RN" in a title would be an
//      unmeasured heuristic, so this does not attempt one.
//
// Run from repo root: `npm test` (or `node tests/sierra_program_search.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SQL = fs.readFileSync("chatbox/supabase_search_college_programs.sql", "utf8");
const VERIFY = fs.readFileSync("chatbox/verify_search_college_programs.sql", "utf8");
const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");

let M = null;
block("lift", () => {
  M = liftBlock(FN, "function proximityBand(", "// ── Build topic context (organized by college)",
    ["buildProgramsContext", "proximityBand", "geoLabel"]);
});

let V = null;
block("lift vocabulary", () => {
  V = liftBlock(FN, "const TOPIC_SYNONYMS", "// ── Topic-based exhibit search",
    ["extractTopicKeywords", "expandWithSynonyms", "singleTokenTerms"]);
});

// Real rows from the active export, not a synthetic shape: Golden West's own
// LVN programs (found by title), and Chabot's Registered Nursing (found only
// because it shares the bridge programs' TOP and CIP codes).
const LVN_ROWS = [
  { college: "Golden West College", program_title: "Vocational Nursing",
    award: "Certificate of Achievement", status: "Active",
    top_code: "1230.20", top_title: "Licensed Vocational Nursing",
    cip_code: "51.3901", cip_title: "Licensed Practical/Vocational Nurse Training",
    matched_via: "title+code", region: "Orange", county: "Orange" },
  { college: "Golden West College", program_title: "LVN 30 Unit Option",
    award: "Certificate of Achievement", status: "Active",
    top_code: "1230.10", top_title: "Registered Nursing",
    cip_code: "51.3801", cip_title: "Registered Nursing/Registered Nurse",
    matched_via: "title", region: "Orange", county: "Orange" },
  { college: "Chabot College", program_title: "Registered Nursing",
    award: "A.S. Degree", status: "Active",
    top_code: "1230.10", top_title: "Registered Nursing",
    cip_code: "51.3801", cip_title: "Registered Nursing/Registered Nurse",
    matched_via: "code", region: "Bay Area", county: "Alameda" },
];

// ── 1. The split survives ────────────────────────────────────────────────────
block("1. matched_via split", () => {
  const ctx = M.buildProgramsContext(LVN_ROWS, null, null, null);
  check("(1) a code-only match is labeled as same-field, not as the program asked for",
    /SAME FIELD BY CODE ONLY/.test(ctx),
    "without the label, an LVN-to-RN bridge reads as an LVN program and the "
    + "student is sent somewhere they cannot enroll");
  check("(1) title matches get their own heading",
    /AWARDS THIS/.test(ctx));

  // The load-bearing assertion: the code-only program must be listed UNDER the
  // same-field heading, which is not where a collapsed implementation puts it.
  // Asserted on Chabot's own slice so it cannot be satisfied by Golden West's
  // rows, and by POSITION rather than presence — a collapsed builder still
  // prints both headings and still lists every row.
  const idxField = ctx.indexOf("SAME FIELD BY CODE ONLY");
  const idxCodeOnly = ctx.indexOf("- Registered Nursing — A.S. Degree");
  check("(1) ⚠ the code-only row is listed under the same-field heading",
    idxField > -1 && idxCodeOnly > idxField,
    "Chabot teaches Registered Nursing, not LVN; above that heading it reads as "
    + "an answer to the LVN question");
  check("(1) ⚠ …and a title-matched program is listed before it, under AWARDS THIS",
    ctx.indexOf("- Vocational Nursing —") > -1
    && ctx.indexOf("- Vocational Nursing —") < idxField,
    "if the named bucket empties into the same-field bucket the split has "
    + "inverted, which reads as though no college awards what was asked");

  // Chabot matched only by code, so it must carry no "AWARDS THIS" block.
  const chabot = ctx.slice(ctx.indexOf("## Chabot College"));
  check("(1) a college with only code matches gets no AWARDS THIS block",
    !/AWARDS THIS/.test(chabot),
    "claiming Chabot awards what was asked is the wrong-answer failure");
  check("(1) …and Golden West, whose titles matched, keeps its AWARDS THIS block",
    /AWARDS THIS/.test(ctx.slice(ctx.indexOf("## Golden West"), ctx.indexOf("## Chabot"))));
});

// ── 2. A blank CIP is a blank field, never a claim ───────────────────────────
block("2. blank CIP renders as nothing", () => {
  const noCip = [{
    college: "Allan Hancock College", program_title: "LVN to RN",
    award: "Certificate of Achievement", status: "Active",
    top_code: "1230.10", top_title: "Registered Nursing",
    cip_code: null, cip_title: null, matched_via: "title",
    region: null, county: null,
  }];
  const ctx = M.buildProgramsContext(noCip, null, null, null);
  check("(2) no CIP fragment is printed for a row that has none",
    !/CIP/.test(ctx),
    "CIP is blank on 13.4% of active rows; printing 'CIP null' or an empty CIP "
    + "reads as a program with no discipline, which is the gate-on-CIP error");
  check("(2) the TOP code still renders",
    /TOP 1230\.10 Registered Nursing/.test(ctx));
  check("(2) the program is still named",
    /LVN to RN/.test(ctx));
});

// ── 3. Status is surfaced only when it is not plain Active ───────────────────
block("3. teachout is visible", () => {
  const teachout = [{
    college: "Barstow Community College", program_title: "Welding Technology",
    award: "Certificate", status: "Active - Teachout Only",
    top_code: "0956.00", top_title: "Welding Technology",
    cip_code: null, cip_title: null, matched_via: "title+code",
    region: null, county: null,
  }];
  const ctx = M.buildProgramsContext(teachout, null, null, null);
  check("(3) a teachout program says so",
    /Teachout/.test(ctx),
    "a program closing to new students must not be offered as though it were open");
  const active = JSON.parse(JSON.stringify(teachout));
  active[0].status = "Active";
  check("(3) …and a plain Active program does not carry a status aside",
    !/status Active/.test(M.buildProgramsContext(active, null, null, null)));
});

// ── 4. Empty input is empty output, never a neighbour ───────────────────────
block("4. zero rows is a result", () => {
  check("(4) no rows produces no section at all",
    M.buildProgramsContext([], null, null, null) === ""
    && M.buildProgramsContext(null, null, null, null) === "",
    "an empty section is how a genuine zero reaches the model; a header with no "
    + "rows invites it to fill the gap");
});

// ── 5. The call and the schema of record cannot drift apart ─────────────────
block("5. route agrees with the migration", () => {
  check("(5) cpl-chat calls search_college_programs",
    /sb\.rpc\("search_college_programs"/.test(FN),
    "the section is built from this RPC; a rename leaves buildProgramsContext "
    + "guarding a road nobody drives on");

  // Every argument the function passes must be a parameter the SQL declares.
  const sig = (SQL.match(/create or replace function public\.search_college_programs\(([\s\S]*?)\)\s*returns/) || [])[1];
  check("(5) the SQL file declares the function", !!sig);
  if (sig) {
    const declared = new Set((sig.match(/^\s*(\w+)\s+/gm) || []).map((x) => x.trim()));
    const callBlock = (FN.match(/sb\.rpc\("search_college_programs",\s*\{([\s\S]*?)\}\)/) || [])[1] || "";
    const passed = (callBlock.match(/(\w+)\s*:/g) || []).map((x) => x.replace(/\s*:$/, ""));
    const unknown = passed.filter((k) => !declared.has(k));
    check("(5) ⚠ every argument passed is a parameter the SQL declares",
      passed.length > 0 && unknown.length === 0,
      "passed=" + JSON.stringify(passed) + " declared=" + JSON.stringify([...declared])
      + " — a PostgREST call with an undeclared name fails at runtime, and the "
      + "route returns null, which looks exactly like 'no programs found'");
    check("(5) search_terms is passed as RAW TERMS, not a caller-built tsquery",
      /search_terms:/.test(callBlock) && !/:\*/.test(callBlock),
      "the aed→'a':* stemmer defect; LVN is the same three-letter class and is "
      + "this route's headline query");
  }
});

// ── 6. The model is told about the split ────────────────────────────────────
block("6. the rule ships", () => {
  check("(6) PROGRAMS_RULE exists and is registered",
    /const PROGRAMS_RULE = /.test(FN) && /key: "programs"/.test(FN),
    "the context distinguishes the buckets; if no rule explains them the model "
    + "is free to flatten them back together in prose");
  check("(6) the rule names the bridge trap",
    /LVN to RN/.test(FN) && /REQUIRES the visitor to already hold/.test(FN));
  check("(6) the rule forbids reading a blank CIP as a missing discipline",
    /NEVER TREAT A MISSING CIP AS A MISSING DISCIPLINE/.test(FN));
  check("(6) programsContext reaches the prompt",
    /\$\{offeringsContext\}\$\{programsContext\}/.test(FN),
    "a context built and never concatenated is the quietest possible failure");
});

// ── 7. The LVN question is askable at all ───────────────────────────────────
// ⚠️ THE WHOLE ROUTE WAS REACHABLE AND STILL UNDER-ANSWERED. On the day it
// shipped, "How do I become an LVN?" extracted ["become","lvn"] and expanded to
// NOTHING: no `lvn` key in TOPIC_SYNONYMS (the table carried `lpn`, the term
// other states use), and nearestSynonymKey("lvn") returned null so the fuzzy
// last resort missed too. It reached 28 of the 56 colleges the union can find.
//
// Single tokens were measured and rejected: "vocational" reaches 82 colleges
// against a 56 ideal; "practical" is 9 chars so it takes the stemmed-prefix
// path, `practical:*` becomes `'practic':*`, and 30 of the 36 title rows it
// added were Architectural PRACTICE / Teaching PRACTICES / PRACTICUM. The
// PHRASES measure 56 union colleges and zero non-nursing rows.
block("7. the LVN vocabulary", () => {
  const terms = V.expandWithSynonyms(V.extractTopicKeywords("How do I become an LVN?"));
  check("(7) ⚠ an LVN question expands past the bare acronym",
    terms.length > 1,
    "with no lvn family the query is one token and reaches half the colleges");
  check("(7) ⚠ …and expands to PHRASES, which is what the precision depends on",
    terms.some((t) => /\s/.test(t)),
    "a single-token synonym either overshoots (vocational) or prefix-matches "
    + "PRACTICE/PRACTICUM (practical) — both measured");
  check("(7) the phrases are the nursing ones",
    terms.includes("vocational nursing") && terms.includes("practical nursing"));
  check("(7) ⚠ `become` is a stop word — it describes the ASK, not the topic",
    !terms.includes("become"),
    "it returned 'BECOMING a Social Media Influencer', the only non-nursing row "
    + "in 118; the DF filter cannot catch it because it is rare AND uninformative");
  check("(7) a plain topic query is untouched by all this",
    V.expandWithSynonyms(V.extractTopicKeywords("which colleges teach welding")).includes("welder"));
});

// ── 8. A phrase must not reach a builder that cannot express one ───────────
// to_tsquery('english', 'lvn:* | practical nursing:*') is a hard 42601 syntax
// error — verified against the live database. searchCollegeOfferings is a
// PRIMARY path, so an unfiltered phrase would make it return null and silently
// cost the course-catalog section on every LVN question.
block("8. phrases stay out of the token builders", () => {
  check("(8) singleTokenTerms drops whitespace-bearing terms",
    JSON.stringify(V.singleTokenTerms(["lvn", "practical nursing", "weld"]))
      === JSON.stringify(["lvn", "weld"]));
  check("(8) …and keeps every single token, in order",
    JSON.stringify(V.singleTokenTerms(["a", "b", "c"])) === JSON.stringify(["a", "b", "c"]));
  const builders = FN.match(/\.map\(\(k\) => `\$\{k\}:\*`\)/g) || [];
  const guarded = FN.match(/singleTokenTerms\(keywords\)\.map\(\(k\) => `\$\{k\}:\*`\)/g) || [];
  check("(8) ⚠ EVERY `${k}:*` tsquery builder is guarded",
    builders.length > 0 && builders.length === guarded.length,
    "found " + builders.length + " builder(s), " + guarded.length + " guarded — an "
    + "unguarded one takes a 42601 and returns null, which reads as 'no results'");
  check("(8) the program route passes RAW terms, phrases and all",
    /search_terms: keywords/.test(FN),
    "the phrases have to survive the trip to the RPC that can express them");
});

// ── 9. The SQL can actually express a phrase ────────────────────────────────
block("9. the phrase branch exists in the schema of record", () => {
  check("(9) search_college_programs uses phraseto_tsquery",
    /phraseto_tsquery/.test(SQL),
    "without it a whitespace term is normalized to one glued token and matches "
    + "nothing at all");
  check("(9) the phrase branch runs BEFORE the single-token normalization",
    SQL.indexOf("phraseto_tsquery") < SQL.indexOf("norm := lower(regexp_replace"),
    "the normalizer strips whitespace, so a phrase reaching it first is lost");
  check("(9) the verification file covers phrases",
    /C2 FAIL/.test(VERIFY) && /adjacency/i.test(VERIFY));
});

// ── 10. The smoke literal cannot drift from the real expansion ─────────────
// smoke mode 7p pins the LVN term set as a shell literal. A transcription drifts
// silently: edit TOPIC_SYNONYMS and the smoke script keeps querying the OLD
// terms, still passes, and quietly stops testing the retrieval the function
// performs. tests/sierra_offerings_retrieval.test.js was written for exactly
// this failure on mode 7r's literal; this is the same guard for 7p's.
block("10. smoke 7p agrees with index.ts", () => {
  const m = SMOKE.match(/PROGRAMS_TERMS='(\[[^']*\])'/);
  check("(10) mode 7p pins a term list", !!m,
    "if the literal moved, this guard is testing nothing");
  if (!m) return;
  let pinned = null;
  try { pinned = JSON.parse(m[1]); } catch (e) { /* reported below */ }
  check("(10) …and it is valid JSON", Array.isArray(pinned));
  if (!Array.isArray(pinned)) return;

  const live = V.expandWithSynonyms(V.extractTopicKeywords("How do I become an LVN?"));
  const a = [...pinned].sort().join("|");
  const b = [...live].sort().join("|");
  check("(10) ⚠ the pinned terms ARE what an LVN question expands to today",
    a === b,
    "smoke 7p queries " + JSON.stringify([...pinned].sort())
    + " but index.ts now produces " + JSON.stringify([...live].sort())
    + " — update PROGRAMS_TERMS in chatbox/smoke_test.sh");
  check("(10) mode 7p asserts REACH and CLEANLINESS, not just rows",
    /reached \$pcolleges colleges/.test(SMOKE) && /non-nursing program/.test(SMOKE),
    "either assertion alone passes on a broken build — reach without cleanliness "
    + "misses the PRACTICE/PRACTICUM noise, cleanliness without reach misses a "
    + "phrase branch that matches nothing");
  check("(10) …behind a negative control, like 7r",
    /negative control: a nonsense PHRASE returns no programs/.test(SMOKE));
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_program_search.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
