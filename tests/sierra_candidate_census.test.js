// Sierra — a NAME-MATCH CANDIDATE LIST MUST NEVER READ AS A CENSUS.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-08-21, from the My College district view, asked:
//
//     "What should Los Angeles Community College District do to help its
//      colleges award more CPL?"
//
// Sierra opened with **"Three LACCD colleges appear in the MAP platform data"**,
// tabulated three, and then closed the SAME answer with "across all nine LACCD
// colleges". Nothing was missing from the data — measured that day, all NINE
// LACCD colleges are in `map_colleges` AND all nine are in
// `chatbox_college_profiles` (8 of 9 in map_college_credit_summary; LA Southwest
// is k=10 suppressed). The three were a `.slice(0, 3)` on the tie list inside
// detectAndFetchCollegeProfile.
//
// ⚠ THE LESSON HAD ALREADY BEEN LEARNED 34 LINES ABOVE. The per-word query in
// the same function carries the comment `"angeles" alone matches 9; a limit of 3
// truncated the answer` — the identical bug, on these identical nine colleges,
// fixed THERE (3 -> 12) and left standing HERE. That is why LA Harbor came back
// and the other six did not. See tests/sierra_geo_ranking.test.js for the first
// half of this story.
//
// ⭐ AND RAISING THE CAP IS NOT THE FIX. A bigger cap on an undisclosed list
// only moves the false claim from three to nine — still a name match presented
// as MAP's contents. Sierra has NO district dimension at all: zero columns named
// district in the whole public schema, zero occurrences of "district" in the
// 170KB edge function. She cannot enumerate a district and must say so. So the
// load-bearing change is the DISCLOSURE that buildCollegeContext now prepends.
//
// The repo already had the rule, unapplied here — from the alignment work:
// "peer_total ships as a COLUMN ('showing 9 of 261') — a capped list must never
// read as a census."
//
// Run from repo root: `npm test` (or `node tests/sierra_candidate_census.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

/* Strip line comments so a prose mention of a pattern cannot satisfy a source
 * check that is looking for CODE. Sky175's lesson: one of the new checks was
 * wrong before the code was, because it matched the comment describing the call
 * it had replaced. Block comments go too — this fix's own comments quote both
 * `slice(0, 3)` and the sentence the disclosure forbids. */
const CODE = SRC
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

// ── (1) One bound, used in both places ─────────────────────────────────────
block("(1)", function () {
  check("(1) CANDIDATE_MAX is declared, and is 12",
    /const CANDIDATE_MAX = 12;/.test(CODE));
  check("(1) ⭐ the per-word query and the tie list share it — they cannot drift apart again",
    (CODE.match(/CANDIDATE_MAX/g) || []).length >= 3,
    "declaration + .limit() + the tie slice");
  /* ⚠ SCOPED TO THE FUNCTION BODY, and it had to be.
   * The first version of this check was `!/scored\[0\]\.n\)\s*\.map\([^)]*\)\.slice\(0, 3\)/`
   * — which PASSED against the unfixed source, because `[^)]*` cannot span the
   * `(s) => s.college` arrow inside `.map(...)`. An unfailable check, written
   * while fixing an unfailable cap. Scoping to the function and banning the
   * literal is what actually holds. `keywords.slice(0, 3)` elsewhere in the
   * file is legitimate, which is why the scan is not repo-wide. */
  const fnStart = CODE.indexOf("async function detectAndFetchCollegeProfile(");
  const fnEnd = CODE.indexOf("\n}\n", fnStart);
  const FN = CODE.slice(fnStart, fnEnd);
  check("(1) precondition: the college matcher body was located",
    fnStart >= 0 && fnEnd > fnStart && /tiedAll/.test(FN));
  check("(1) ⚠ the tie list no longer truncates at 3",
    !/slice\(0, ?3\)/.test(FN), "the whole 'Three LACCD colleges' defect was this literal");
  check("(1) …and the query limit is not a bare number any more",
    !/\.limit\(12\);/.test(CODE) && /\.limit\(CANDIDATE_MAX\)/.test(CODE));
  // Positive control: a fix that deleted the bound entirely would pass the two
  // negative checks above.
  check("(1) the tie list is still bounded at all",
    /tiedAll\.slice\(0, CANDIDATE_MAX\)/.test(CODE));
  check("(1) …and the TRUE total is kept, not thrown away",
    /const tiedAll =/.test(CODE) && /total: tiedAll\.length/.test(CODE));
});

// ── (2) The stamp is per ROW, because .map() drops array properties ────────
block("(2)", function () {
  check("(2) ⚠ each returned row carries `_match`, not the array",
    /rows\.map\(\([^)]*\) => \(\{ \.\.\.r, _match: stamp \}\)\)/.test(CODE),
    "withLiveContacts does profile.map(attach) and buildCollegeContext does profiles.map(...) — " +
    "a property hung on the array is dropped by the first of those");
  check("(2) the stamp records shown AND total AND what matched",
    /shown: rows\.length/.test(CODE) && /total: tiedAll\.length/.test(CODE) && /words:/.test(CODE));
});

/* ── Lift the real functions and RUN them ─────────────────────────────────
 * A source scan cannot tell a disclosure that is assembled from one that is
 * assembled and dropped, and it cannot tell a raised cap from a cap that still
 * truncates. Both blocks lift cleanly with the repo's shared stripper, so this
 * file exercises the SHIPPING code rather than a re-implementation of it —
 * tests/lib/lift_ts.js exists precisely because a re-implementation drifts and
 * stops guarding anything. */
let detectMod = null, ctxMod = null, liftErr = null;
try {
  /* ⚠ Ask ONLY for the function, not for CANDIDATE_MAX. Naming the new constant
   * here made the lift THROW against a pre-fix index.ts, so block (6) was
   * skipped rather than reproducing the defect — a fail-first check that proved
   * only that the constant was missing. Lifting just the function lets the old
   * code run and return its three. */
  detectMod = liftBlock(SRC, "const COLLEGE_ALIASES", "// ── Topic synonym expansion",
    ["detectAndFetchCollegeProfile"]);
  ctxMod = liftBlock(SRC, "function buildCollegeContext(", "// Reusable response rules",
    ["buildCollegeContext"]);
} catch (e) { liftErr = e; }
check("both blocks lift out of index.ts cleanly", !liftErr && detectMod && ctxMod,
  liftErr && liftErr.message);

/* Fake PostgREST, mirroring tests/sierra_geo_ranking.test.js: `.limit()` slices
 * AFTER `.order()` sorts, so a truncation is observable rather than hidden by
 * fixture order. */
function fakeSb(names) {
  const rows = names.map((c) => ({ college: c, total_exhibits: 0, total_credit_recs: 0, discipline_count: 0 }));
  return {
    from() {
      const q = { rows: rows.slice() };
      const api = {
        select() { return api; },
        eq(col, val) { q.rows = q.rows.filter((r) => r[col] === val); return api; },
        in(col, vals) { q.rows = q.rows.filter((r) => vals.includes(r[col])); return api; },
        ilike(col, pattern) {
          const needle = pattern.replace(/%/g, "").toLowerCase();
          q.rows = q.rows.filter((r) => String(r[col]).toLowerCase().includes(needle));
          return api;
        },
        order() { q.rows.sort((a, b) => a.college.localeCompare(b.college)); return api; },
        limit(n) { q.rows = q.rows.slice(0, n); return api; },
        single() { return { then: (res) => res({ data: q.rows[0] || null }) }; },
        then(res) { return res({ data: q.rows }); },
      };
      return api;
    },
  };
}

// The nine LACCD colleges, verified 2026-08-21 against map_colleges (ids 49,
// 69-75, 115) AND chatbox_college_profiles — all nine present in both.
const LACCD = [
  "East Los Angeles College", "Los Angeles City College", "Los Angeles Harbor College",
  "Los Angeles Mission College", "Los Angeles Pierce College", "Los Angeles Southwest College",
  "Los Angeles Trade Technical College", "Los Angeles Valley College", "West Los Angeles College",
];
const NEIGHBOURS = ["Cerritos College", "El Camino College", "Long Beach City College"];

const profile = (college, extra) => Object.assign({
  college: college, total_exhibits: 5, total_credit_recs: 9, discipline_count: 2,
  credit_distribution: { eligible_credits: 100, applied_credits: 1, transcribed_credits: 0, students_awarded: 3 },
}, extra || {});

// ── (3) ⭐ The disclosure renders, and forbids the exact sentence ──────────
block("(3)", function () {
  const build = ctxMod.buildCollegeContext;

  const stamp = { shown: 3, total: 9, words: ["angeles", "district"] };
  const many = ["East Los Angeles College", "Los Angeles Harbor College", "Los Angeles City College"]
    .map((n) => profile(n, { _match: stamp }));
  const ctx = build(many);

  check("(3) ⭐ a multi-college context declares itself a CANDIDATE list",
    /NAME-MATCH CANDIDATES, NOT A ROSTER/.test(ctx), JSON.stringify(ctx.slice(0, 200)));
  check("(3) ⭐ …and forbids the sentence Sierra actually wrote",
    /Do NOT write "3 colleges appear in the MAP platform data"/.test(ctx),
    "the count is interpolated, so the ban names the number the model can see");
  check("(3) ⚠ …and states plainly that a district cannot be enumerated",
    /CANNOT ENUMERATE A DISTRICT/.test(ctx));
  check("(3) ⚠ …and forbids filling the gap from general knowledge",
    /Do not guess/.test(ctx) && /general knowledge/.test(ctx),
    "she closed the bad answer with 'all nine LACCD colleges' — which the data never told her");
  check("(3) ⭐ the capped count ships WITH its total, never alone",
    /3 of 9 matches are shown/.test(ctx), "a capped list must never read as a census");
  check("(3) the matched words are named, so the set is explicable",
    /matched on: angeles, district/.test(ctx));

  // The profiles themselves must still be there — a disclosure that suppressed
  // the data would trade a false answer for no answer.
  check("(3) positive control: all three profiles still render",
    (ctx.match(/--- College Profile:/g) || []).length === 3);
});

// ── (4) A single college is untouched — no scare text on the common path ───
block("(4)", function () {
  const build = ctxMod.buildCollegeContext;
  const ctx = build(profile("Cabrillo College"));
  check("(4) ⚠ a single-college answer gets NO candidate preamble",
    !/NAME-MATCH CANDIDATES/.test(ctx) && !/CANNOT ENUMERATE A DISTRICT/.test(ctx),
    "this is the overwhelmingly common path; a warning here would train the model to ignore it");
  check("(4) …and still renders its profile", /--- College Profile: Cabrillo College ---/.test(ctx));
  // An array OF ONE is the same situation and must behave the same way.
  const one = build([profile("Cabrillo College")]);
  check("(4) an array of one is also a single college, not a candidate set",
    !/NAME-MATCH CANDIDATES/.test(one));
});

// ── (5) The disclosure survives a missing stamp ────────────────────────────
block("(5)", function () {
  const build = ctxMod.buildCollegeContext;
  // An older/other caller can hand over an array with no `_match` — the warning
  // still has to render. Failing OPEN here would restore the original defect
  // for exactly the callers nobody remembered to update.
  const ctx = build([profile("A College"), profile("B College")]);
  check("(5) ⚠ no stamp still yields the roster warning",
    /NAME-MATCH CANDIDATES, NOT A ROSTER/.test(ctx) && /CANNOT ENUMERATE A DISTRICT/.test(ctx));
  check("(5) …and simply omits the shown/total line rather than inventing one",
    !/matches are shown/.test(ctx) && !/undefined/.test(ctx));
});

/* ── (6) ⭐ THE DEFECT ITSELF, end to end ──────────────────────────────────
 * Sam's actual sentence, through the actual matcher, against the actual nine.
 * Everything above this is a component check; this is the bug. */
(async () => {
  if (detectMod && ctxMod) {
    const Q = "What should Los Angeles Community College District do to help its colleges award more CPL?";
    const hit = await detectMod.detectAndFetchCollegeProfile(Q, fakeSb(LACCD.concat(NEIGHBOURS)));

    check("(6) the district question resolves to an AMBIGUOUS SET, not one college",
      Array.isArray(hit), hit && !Array.isArray(hit) ? "got " + hit.college : "got null");
    check("(6) ⭐ ALL NINE LACCD colleges come back — not three",
      Array.isArray(hit) && hit.length === 9,
      Array.isArray(hit) ? "got " + hit.length + ": " + hit.map((h) => h.college).join(", ") : "not an array");
    check("(6) …and they are the nine, not nine of anything",
      Array.isArray(hit) && LACCD.every((n) => hit.some((h) => h.college === n)));
    check("(6) ⚠ every row is stamped, so the context can disclose what this is",
      Array.isArray(hit) && hit.every((h) => h && h._match && h._match.shown === 9 && h._match.total === 9));
    // ⚠ Null-safe: against a pre-fix index.ts `_match` is undefined, and a throw
    // here aborts every remaining check in the file — reporting one crash where
    // a list of red checks is the actual evidence.
    check("(6) the stamp records what actually matched",
      Array.isArray(hit) && hit[0]?._match?.words?.includes("angeles") === true,
      "\"los\" is dropped (<4 chars) and community/college are stopwords, so the " +
      "query reduces to angeles+district and all nine tie at score 1");

    // And the string a model would actually receive.
    const ctx = ctxMod.buildCollegeContext(hit);
    check("(6) ⭐ the context forbids the exact false sentence, at the real count",
      /Do NOT write "9 colleges appear in the MAP platform data"/.test(ctx));
    check("(6) ⚠ …and does not claim to be LACCD's membership",
      /CANNOT ENUMERATE A DISTRICT/.test(ctx) && /NOT the set of colleges in any district/.test(ctx));
    check("(6) positive control: all nine profiles are still in the context",
      (ctx.match(/--- College Profile:/g) || []).length === 9);
  }

  // ── report ──
  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nsierra_candidate_census.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
