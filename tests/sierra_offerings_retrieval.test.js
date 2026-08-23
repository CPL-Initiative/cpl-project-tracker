// Mode 7r — the LA-basin offerings assertion, and the drift guard under it.
//
// ⭐ WHY. chatbox/smoke_test.sh mode 7 asserts a THREE-PART answer that Sam chose
// on 2026-08-07. Part 3 — "name LA-basin colleges that TEACH construction, so a
// seeker has somewhere local to go" — was asserted by grepping Sierra's PROSE for
// six college names, and it had been red since Session 125 while she was
// answering correctly: she leads with the colleges that have ARTICULATED NCCER
// (Norco, Barstow), which is the other true thing. A CI job that goes red on a
// choice of emphasis gets muted, and a muted job protects nothing.
//
// So part 3 moved to where it is deterministic: mode 7r calls the same
// search_college_offerings RPC cpl-chat calls, and asserts the LA-basin teaching
// colleges COME BACK. Capability, not wording. The wording stays with mode 8.
//
// ⚠ WHAT THIS FILE GUARDS. Mode 7r pins a TSQUERY LITERAL — a transcription of
// what extractTopicKeywords() + expandWithSynonyms() produce for mode 7's
// question. Transcriptions drift silently: edit TOPIC_SYNONYMS and the smoke
// script keeps querying the OLD term set, still passes, and quietly stops
// testing the retrieval the function actually performs. This file re-derives the
// expected term set from index.ts on every run and fails the moment they part.
//
// Run from repo root: `npm test` (or `node tests/sierra_offerings_retrieval.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");
const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

// The question mode 7 actually asks — read out of the smoke script rather than
// retyped, so the two cannot disagree about what is being tested.
const MODE7_QUERY = (SMOKE.match(/run "7 offerings adoption[^\n]*\n\s*'\{"query":"([^"]+)"/) || [])[1];

// ── Parse the two retrieval inputs out of index.ts AS DATA ──────────────────
// Deliberately not an eval of the module: these are plain literals, and reading
// them is far more robust than stripping TypeScript out of a 3,500-line file.
function parseStopWords() {
  const m = FN.match(/const TOPIC_STOP_WORDS = new Set\(\[([\s\S]*?)\]\);/);
  if (!m) return null;
  return new Set((m[1].match(/"([a-z]+)"/g) || []).map((s) => s.slice(1, -1)));
}
function parseSynonyms() {
  const m = FN.match(/const TOPIC_SYNONYMS[^=]*= \{([\s\S]*?)\n\};/);
  if (!m) return null;
  const out = {};
  const re = /^\s*([a-z0-9_]+):\s*\[([^\]]*)\]/gm;
  let hit;
  while ((hit = re.exec(m[1]))) {
    out[hit[1]] = (hit[2].match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1));
  }
  return out;
}

const STOP = parseStopWords();
const SYN = parseSynonyms();

block("1. the inputs parsed", () => {
  check("(1) TOPIC_STOP_WORDS parsed out of index.ts", STOP && STOP.size > 40,
    "got " + (STOP ? STOP.size : "null") + " — if this is null the drift check "
    + "below is vacuous, which is the failure mode it exists to prevent");
  check("(1) TOPIC_SYNONYMS parsed out of index.ts", SYN && Object.keys(SYN).length > 20,
    "got " + (SYN ? Object.keys(SYN).length : "null"));
  check("(1) the synonym families this query depends on are present",
    SYN && SYN.nccer && SYN.carpentry && SYN.construction);
  check("(1) mode 7's question was read out of the smoke script", !!MODE7_QUERY);
});

// ── 2. THE DRIFT GUARD ───────────────────────────────────────────────────────
block("2. the pinned tsquery still matches index.ts", () => {
  const pinned = (SMOKE.match(/OFFERINGS_TSQ='([^']+)'/) || [])[1];
  check("(2) mode 7r pins a tsquery", !!pinned);
  if (!pinned || !STOP || !SYN) return;

  const pinnedTerms = new Set(pinned.split("|").map((t) => t.trim().replace(/:\*$/, "")).filter(Boolean));

  // extractTopicKeywords, verbatim: lowercase, strip non-alphanumerics, split on
  // whitespace, keep tokens of 3+ characters that are not stop words.
  const raw = (MODE7_QUERY || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w));
  // expandWithSynonyms, for a query where every token either resolves exactly or
  // has no family at all — which is the case here, and check (3) pins that it
  // stays the case by comparing the sets rather than trusting this shortcut.
  const expected = new Set(raw);
  raw.forEach((k) => (SYN[k] || []).forEach((s) => expected.add(s)));

  const missing = [...expected].filter((t) => !pinnedTerms.has(t));
  const extra = [...pinnedTerms].filter((t) => !expected.has(t));

  check("(2) ⭐ every term index.ts would produce is in the pinned tsquery",
    missing.length === 0,
    "MISSING from chatbox/smoke_test.sh OFFERINGS_TSQ: " + JSON.stringify(missing)
    + " — TOPIC_SYNONYMS changed and the smoke script is now querying a term set "
    + "the function no longer builds. Re-derive it.");
  check("(2) ⭐ …and the pinned tsquery carries nothing extra",
    extra.length === 0,
    "EXTRA in OFFERINGS_TSQ: " + JSON.stringify(extra)
    + " — the smoke script is testing a WIDER retrieval than the function performs, "
    + "so a real truncation regression could hide behind the extra matches.");
  check("(2) the raw tokens survive stop-word filtering as expected",
    raw.includes("carpentry") && raw.includes("construction") && raw.includes("nccer"),
    "got " + JSON.stringify(raw));
});

// ── 3. Mode 7r's own shape ───────────────────────────────────────────────────
block("3. mode 7r shape", () => {
  // ⚠ COMMENTS ARE NOT CODE, and this check learned it the hard way: mode 7r's
  // preamble QUOTES the retired assertion so the next reader knows what was
  // removed and why, and a naive grep of the whole file reported it as still
  // live. Strip comment lines before judging what the script DOES. (The repo has
  // hit this before — "a marker is load-bearing text", handoff 185.)
  const CODE = SMOKE.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
  check("(3) ⭐ the prose grep for the six college names is GONE from mode 7",
    !/answer_must_match[^\n]*El Camino\|Long Beach\|Trade/.test(CODE),
    "this is the assertion that was red since Session 125 on correct answers");
  check("(3) ⚠ …and the retired assertion is still QUOTED in the comment",
    /#\s+answer_must_match -i "El Camino\|Long Beach/.test(SMOKE),
    "a future reader hitting a red 7r needs to know what this replaced");
  check("(3) ⚠ …but part 3 is still asserted, at retrieval",
    /rpc\/search_college_offerings/.test(SMOKE) && /LA-basin/.test(SMOKE),
    "moving it and dropping it look identical in a diff; Sam's three-part product "
    + "decision is unchanged");
  check("(3) ⭐ a NEGATIVE control runs first",
    /zzqqxxwwvv/.test(SMOKE)
    && SMOKE.indexOf("zzqqxxwwvv") < SMOKE.indexOf("positive control: the offerings RPC"),
    "'did these names come back?' is answered by an empty body just as "
    + "convincingly by a broken call as by a real miss");
  check("(3) ⭐ a POSITIVE control runs too",
    /positive control: the offerings RPC returned rows/.test(SMOKE));
  check("(3) ⚠ the assertion is a THRESHOLD, not a named college",
    /-ge 3 \]/.test(SMOKE) && /of 6 LA-basin/.test(SMOKE),
    "mode 14 learned that an assertion pinned to a value which can leave the data "
    + "stops being a guard the moment it does; a college can leave the catalog");
  check("(3) it uses the function's own result_limit",
    /"result_limit":150/.test(SMOKE),
    "a different limit would test a different truncation than the one that ships");
  check("(3) ⚠ the 150-row truncation is recorded, not hidden",
    /truncation is live here/.test(SMOKE),
    "the query fills the limit exactly, so which colleges survive is a ranking "
    + "question — guarded by tests/sierra_geo_ranking.test.js, not by this");
  check("(3) mode 8 still greps the prose for the same capability",
    /8 offerings broad \(who teaches construction\)/.test(SMOKE)
    && /answer_must_match -i "carpentry\|construction" "8 on-topic offerings"/.test(SMOKE),
    "part 3's WORDING was handed to mode 8; if mode 8 goes away, nothing checks "
    + "that she ever says it out loud");
});

// ── 4. The function still calls what mode 7r calls ───────────────────────────
block("4. still the same route", () => {
  check("(4) cpl-chat calls search_college_offerings",
    /sb\.rpc\("search_college_offerings"/.test(FN),
    "if the function moves to a different route, mode 7r is testing a road "
    + "nobody drives on");
  check("(4) ⚠ …at result_limit 150, the number mode 7r mirrors",
    /result_limit:\s*150/.test(FN));
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_offerings_retrieval.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
