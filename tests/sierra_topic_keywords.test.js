// Sierra topic retrieval — the keyword layer that feeds search_exhibits_by_topic_v2.
//
// WHY THIS TEST EXISTS
// --------------------
// "Which colleges give CPL for a CPR cert?" has now broken TWICE.
//
//   2026-07-01 (Session 93) — cpl_type/collaborative_type were inside the
//     searched vector and ranking was `ORDER BY rec_count DESC`, so all 16
//     CPR exhibits (rec_count 1) ranked 285-677 and were cut by the limit.
//     Fixed by weighting the vector and ranking on ts_rank_cd.
//
//   2026-08-06 (this test) — the SYNONYM ADDED BY THAT FIX became the next
//     bug. `aed` was bridged into the CPR family so any one term would find
//     the whole group; but `to_tsquery('english','aed:*')` parses to `'a':*`,
//     because the Snowball stemmer reads the "-ed" as a past-tense suffix.
//     A prefix match on the letter "a" matched most of the corpus, and OR'd
//     against every other term it drowned the real CPR rows. Sierra answered
//     with 2 colleges when the corpus held 5.
//
// Both fixes were verified by READING AN ANSWER and judging it better. Neither
// asserted what retrieval actually returned, which is why the second defect
// rode in on the first one's fix and sat undetected for five weeks. This file
// is that missing assertion: it pins the KEYWORD SET a question produces, so a
// future synonym or stopword edit that silently re-poisons retrieval fails in
// CI instead of in front of a Chancellor's Office colleague.
//
// The database-side half (stemmer routing, document-frequency filter, "/"
// tokenisation) cannot be asserted from Node — it lives in
// chatbox/verify_search_exhibits_v2.sql, which is self-asserting SQL.
//
// Run from repo root: `npm test` (or `node tests/sierra_topic_keywords.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

// ── Lift the pure keyword functions out of the Deno module ──────────────────
// They have no Deno dependencies, so we can evaluate them directly rather than
// re-implementing (a re-implementation would drift and stop guarding anything).
//
// The lifter itself moved to tests/lib/lift_ts.js when a second test file needed
// it (sierra_geo_ranking) and the stripper had to learn `Map<string, any> | null`.
// That is exactly the escalation this comment used to prescribe: a shared module,
// not the same regex maintained in two places.
const { liftBlock } = require("./lib/lift_ts");

let mod = null, liftErr = null;
try {
  mod = liftBlock(SRC, "const TOPIC_SYNONYMS", "// ── Topic-based exhibit search",
    ["extractTopicKeywords", "expandWithSynonyms", "TOPIC_STOP_WORDS", "TOPIC_SYNONYMS"]);
} catch (e) { liftErr = e; }
check("keyword block lifts out of index.ts cleanly", !liftErr && mod);

if (mod) {
  const terms = (q) => mod.expandWithSynonyms(mod.extractTopicKeywords(q));

  // ── The exact question that broke, twice ──────────────────────────────────
  const cpr = terms("Which CCCs give CPL for a CPR cert?");

  check("CPR question yields the cpr term", cpr.includes("cpr"));
  check("CPR question bridges to aed", cpr.includes("aed"));
  check("CPR question bridges to bls", cpr.includes("bls"));

  // The meta-words are the flooders. "cert" alone matched 445 of 2,397
  // exhibits (18.6%); it describes the ASK, never the TOPIC.
  check("'cert' is stopped (445 exhibits / 18.6% of corpus)", !cpr.includes("cert"));
  check("'cpl' is stopped", !cpr.includes("cpl"));
  check("'cccs' is stopped", !cpr.includes("cccs"));
  for (const w of ["certificate", "certification", "certifications", "certs", "ccc", "articulation", "articulated"]) {
    check(`'${w}' is in the stopword list`, mod.TOPIC_STOP_WORDS.has(w));
  }

  // A question carrying ONLY meta-words must not retrieve on them.
  check("a pure meta-word question yields no topic terms",
    mod.extractTopicKeywords("What CPL certifications are articulated?").length === 0);

  // ── Regression probes: the topics Session 93 checked, still intact ────────
  const fire = terms("What CPL is available for firefighters?");
  check("firefighter still expands to fire", fire.includes("fire"));
  check("firefighter still expands to nfpa", fire.includes("nfpa"));

  const nccer = terms("which colleges have adopted NCCER carpentry");
  check("carpentry still expands to nccer", nccer.includes("nccer"));
  check("carpentry still expands to construction", nccer.includes("construction"));

  // ── Plurals must expand identically to singulars ──────────────────────────
  // The table is keyed on singulars but people ask in the plural. Before the
  // synonymKeys() fix, "firefighters" expanded to 1 term and "firefighter" to
  // 11 — the bridge silently vanished on the commoner phrasing.
  for (const [plural, singular] of [
    ["firefighters", "firefighter"],
    ["nurses", "nurse"],
    ["carpenters", "carpenter"],
    ["paramedics", "paramedic"],
    ["electricians", "electrician"],
  ]) {
    const p = new Set(terms(plural));
    const s = terms(singular);
    check(`'${plural}' expands like '${singular}'`, s.every((t) => p.has(t)));
    check(`'${plural}' is more than a bare token`, p.size > 2);
  }

  // ── Multi-word and hyphenated spellings of one-word families ─────────────
  // extractTopicKeywords splits on whitespace, so "fire fighter" used to reach
  // only the loose "fire" key (no emt/paramedic/emergency) and "life saving" /
  // "first aid" expanded to NOTHING — the last being the family behind the CPR
  // question that started all of this. A bigram pass joins adjacent tokens.
  for (const v of ["fire fighter", "fire fighters", "fire-fighter"]) {
    const t = terms(v);
    check(`'${v}' reaches the firefighter family`, t.includes("firefighter"));
    check(`'${v}' reaches emt via that family`, t.includes("emt"));
  }
  check("'life saving' reaches lifesaving", terms("life saving").includes("lifesaving"));
  check("'life saving' bridges to cpr", terms("life saving").includes("cpr"));
  check("'first aid' bridges to cpr", terms("first aid").includes("cpr"));
  check("'first aid' bridges to aed", terms("first aid").includes("aed"));
  check("'nursing' expands", terms("nursing").includes("lpn"));

  // The guard on that bigram pass: "financial aid" is far commoner in this
  // domain than "first aid" and must never be pulled into the CPR family.
  check("'financial aid' does NOT expand into CPR", !terms("financial aid").includes("cpr"));
  check("'financial aid' does NOT expand into aed", !terms("financial aid").includes("aed"));

  // ── The expanded name, and misspellings of it ────────────────────────────
  // Sam, 2026-08-06, having just looked the term up himself: "cardiopulminary
  // resuscitation and misspellings... like my misspellings :)". If the person
  // who runs the program has to Google the spelling, a student will too.
  // Note the asymmetry these cover: exhibit titles say "CPR", so the correct
  // full term matched almost nothing before this.
  for (const phrasing of [
    "cardiopulmonary resuscitation",
    "cardio pulmonary resuscitation",
    "cardiopulminary resuscitation",
    "cardiopulminary",
    "cardio pulminary",
    "defibrilator",
  ]) {
    check(`'${phrasing}' reaches the CPR family`, terms(phrasing).includes("cpr"));
  }

  // Fuzzy matching must not drag unrelated topics sideways. These resolve
  // exactly, so the fuzzy pass never runs for them — assert they stay put.
  for (const unrelated of ["welding", "nurses", "automotive", "carpentry", "aviation"]) {
    check(`'${unrelated}' is NOT pulled into the CPR family`, !terms(unrelated).includes("cpr"));
  }

  // ── The synonym table must stay acronym-safe ──────────────────────────────
  // Every synonym of <=4 chars is routed to the UNSTEMMED 'simple' vector by
  // the v2 RPC. That routing is what makes "aed" survivable — so if a future
  // edit adds a long synonym that the English stemmer mangles, we want to know
  // the rule that protects it still exists on the SQL side.
  const allSyn = new Set();
  for (const k of Object.keys(mod.TOPIC_SYNONYMS)) {
    allSyn.add(k);
    for (const s of mod.TOPIC_SYNONYMS[k]) allSyn.add(s);
  }
  check("aed is still a known synonym (the term that broke)", allSyn.has("aed"));
  check("synonym table is non-trivial", allSyn.size > 40);
}

// ── The call site must use v2, with v1 retained as fallback ─────────────────
check("calls search_exhibits_by_topic_v2", SRC.includes('"search_exhibits_by_topic_v2"'));
check("passes RAW terms, not a pre-built tsquery", /search_terms:\s*keywords/.test(SRC));
check("v1 retained as availability fallback", SRC.includes('"search_exhibits_by_topic"'));
check("v2 is attempted BEFORE v1",
  SRC.indexOf('"search_exhibits_by_topic_v2"') < SRC.indexOf('.rpc("search_exhibits_by_topic",'));

// The defect in one line: the old path built `k + ":*"` in JS and shipped it to
// Postgres. It still exists for the fallback, but must never be the first try.
const v2Idx = SRC.indexOf('"search_exhibits_by_topic_v2"');
const tsqIdx = SRC.indexOf('`${k}:*`');
check("client-side tsquery construction is below the v2 call", tsqIdx > v2Idx);

// ── Report ──────────────────────────────────────────────────────────────────
let failed = 0;
for (const [name, ok] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "  ok  " : "FAIL  "} ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (liftErr) console.log(`lift error: ${liftErr.message}`);
process.exit(failed ? 1 : 0);
