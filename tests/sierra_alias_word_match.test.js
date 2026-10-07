// Sierra — "Does NOCE teach…?" must reach NOCE's catalog data.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-10-07, checking a Noncredit Summit slide:
//
//     "Does NOCE teach any noncredit courses designed to help students get IT
//      certs like CompTIA, Google, Microsoft or others?"
//
// Sierra said she had no NOCE catalog data. The catalog data holds 1,060 NOCE
// courses and 109 programs, among them the Google IT Support Professional
// Pre-Apprenticeship (control 43318, CIST 100-120). Three things stood between
// the question and the data, and each block below is one of them:
//
//   (1) No alias for "NOCE". The name match reads words of four letters or more
//       inside college names, and no word of an initialism is in the name.
//   (2) The alias test was a substring test. His follow-up, "You have the
//       noncredit courses in COCI and the MIS program and course dataset. Check
//       again and let me know", hit "coc" inside "coci" and Sierra read College
//       of the Canyons. Over 7,504 logged questions, 13 hit an alias only inside
//       a longer word, and all 13 resolved wrong.
//   (3) Ask-shape words were live search terms. "teach" ranked three ECE
//       "Teacher" programs ahead of the Google program, the course block shows
//       three lists, and the Google program lost its courses. The same words
//       (coci, mis, dataset, let, know) made the follow-up read as a new topic,
//       so it never folded the NOCE question back in.
//
// Run from repo root: `node tests/sierra_alias_word_match.test.js`.
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

let D = null, V = null, M = null;
block("lift", () => {
  D = liftBlock(SRC, "const COLLEGE_ALIASES", "// ── Topic synonym expansion", ["detectAndFetchCollegeProfile"]);
  V = liftBlock(SRC, "const TOPIC_SYNONYMS", "// ── Topic-based exhibit search",
    ["extractTopicKeywords", "expandWithSynonyms", "REFINE_NOISE"]);
  M = liftBlock(SRC, "// ── The courses a program lists, at the one college asked",
    "// ── Prospective credit: the courses a held credential could count toward",
    ["asksProgramCourses", "programTerms", "buildProgramCoursesContext"]);
});
check("the three blocks lift out of index.ts", D && V && M);

// chatbox_college_profiles names, read 2026-10-07 (the ones these questions can
// reach, plus every college an in-word alias pointed at).
const NAMES = [
  "Allan Hancock College", "American River College", "College of the Canyons",
  "College of the Desert", "Cypress College", "Fullerton College",
  "North Orange Continuing Education", "Orange Coast College",
  "San Diego City College", "San Diego College of Continuing Education",
  "San Diego College of Continuing Education Credit", "San Diego Continuing Education",
];

// Fake PostgREST over the profile names. map_colleges (the district roster) is
// empty, so a district question falls through to the name match as it would for
// a district with no roster row.
function fakeSb(names) {
  const rows = names.map((c) => ({ college: c }));
  return {
    from(table) {
      const q = { rows: table === "chatbox_college_profiles" ? rows.slice() : [] };
      const api = {
        select() { return api; },
        eq(col, val) { q.rows = q.rows.filter((r) => r[col] === val); return api; },
        in(col, vals) { q.rows = q.rows.filter((r) => vals.includes(r[col])); return api; },
        ilike(col, pattern) {
          const needle = pattern.replace(/%/g, "").toLowerCase();
          q.rows = q.rows.filter((r) => String(r[col]).toLowerCase().includes(needle));
          return api;
        },
        not() { return api; },
        order() { q.rows.sort((a, b) => a.college.localeCompare(b.college)); return api; },
        limit(n) { q.rows = q.rows.slice(0, n); return api; },
        single() { return { then: (res) => res({ data: q.rows[0] || null }) }; },
        then(res) { return res({ data: q.rows }); },
      };
      return api;
    },
  };
}
const sb = fakeSb(NAMES);
const name = (hit) => (hit && !Array.isArray(hit) ? hit.college : Array.isArray(hit) ? "[" + hit.map((h) => h.college).join(", ") + "]" : null);

const Q1 = "Does NOCE teach any noncredit courses designed to help students get IT certs like CompTIA, Google, Microsoft or others?";
const Q2 = "You have the noncredit courses in COCI and the MIS program and course dataset. Check again and let me know.";

(async () => {
  if (D) {
    const resolve = async (q) => name(await D.detectAndFetchCollegeProfile(q, sb));

    // ── (1) The initialisms resolve ────────────────────────────────────────
    check("(1) ⭐ \"Does NOCE teach…\" resolves to North Orange Continuing Education",
      (await resolve(Q1)) === "North Orange Continuing Education", await resolve(Q1));
    check("(1) \"SDCCE\" resolves to the San Diego profile that holds the catalog data",
      (await resolve("What IT courses does SDCCE teach?")) === "San Diego College of Continuing Education");
    check("(1) …and so does its former name, SDCE",
      (await resolve("Does SDCE offer noncredit welding?")) === "San Diego College of Continuing Education");

    // ── (2) An alias inside a longer word names no college ─────────────────
    check("(2) ⭐ \"COCI\" is not College of the Canyons (Sam's follow-up)",
      (await resolve(Q2)) !== "College of the Canyons", await resolve(Q2));
    check("(2) \"coding\" is not College of the Desert",
      (await resolve("I taught myself a lot of coding languages, can I get CPL for that?")) !== "College of the Desert");
    check("(2) \"search\" and \"research\" are not American River",
      (await resolve("Search college exhibits for non destructive testing")) !== "American River College"
      && (await resolve("Carpentry Hand Tools: NCCER (National Center for Construction Education and Research)")) !== "American River College");
    check("(2) ⭐ an Allan Hancock question resolves to Allan Hancock, not Canyons",
      (await resolve("Which statewide credit recommendations has Allan Hancock approved for fire?")) === "Allan Hancock College",
      await resolve("Which statewide credit recommendations has Allan Hancock approved for fire?"));
    check("(2) \"SDCCE\" is not San Diego City College (\"sdcc\" sits inside it)",
      (await resolve("What IT courses does SDCCE teach?")) !== "San Diego City College");
    check("(2) \"NOCCD\" is not Orange Coast College",
      (await resolve("Can you give me a list of the non-military CPL opportunities available at NOCCD colleges?")) !== "Orange Coast College");

    // Positive controls: an alias said as a word still resolves, punctuation and
    // possessives included.
    check("(2) positive control: \"COC\" as a word is still College of the Canyons",
      (await resolve("What does COC award for EMT?")) === "College of the Canyons");
    check("(2) positive control: \"ARC's\" is still American River",
      (await resolve("Does ARC's nursing program take CNA?")) === "American River College");
    check("(2) positive control: \"Allan Hancock\" said in full still wins",
      (await resolve("Tell me about Allan Hancock College")) === "Allan Hancock College");
  }

  if (V && M) {
    const kw = (q) => V.extractTopicKeywords(q);
    const NOCE = "North Orange Continuing Education";

    // ── (3) Ask-shape words are not topics ─────────────────────────────────
    const terms = V.expandWithSynonyms(M.programTerms(kw(Q1), NOCE));
    for (const w of ["teach", "designed", "students", "like", "others"]) {
      check(`(3) "${w}" is not a search term for the NOCE question`, !terms.includes(w), JSON.stringify(terms));
    }
    check("(3) positive control: the subject survives (google, microsoft, comptia, help)",
      ["google", "microsoft", "comptia", "help"].every((w) => terms.includes(w)), JSON.stringify(terms));
    check("(3) the question still asks for courses", M.asksProgramCourses(Q1));

    // The follow-up has no topic of its own, so the handler folds the earlier
    // turn into the retrieval text (isRefinement: fewer than two own words).
    const own = kw(Q2).filter((w) => !V.REFINE_NOISE.has(w));
    check("(3) ⭐ Sam's follow-up reads as a refinement, so the NOCE question folds back in",
      own.length < 2, JSON.stringify(own));

    // The rows college_program_courses returned for the old terms on
    // 2026-10-07, in the RPC's order (one course per list is enough here).
    const row = (t, cn, size, code, title) => ({ program_title: t, award: "Noncredit program", status: "Active",
      control_number: cn, list_size: size, course_code: code, course_title: title, units: 0 });
    const rows = [
      row("ECE Infant Care Teacher", "40950", 5, "ECED 105", "Child Development"),
      row("ECE Preschool Assistant Teacher", "40948", 1, "ECED 105", "Child Development"),
      row("ECE Preschool Teacher", "40951", 10, "ECED 105", "Child Development"),
      row("Google IT Support Professional Pre-Apprenticeship", "43318", 5, "CIST 100",
        "Information Technology (IT) Technical Support Fundamentals"),
    ];
    const ctx = M.buildProgramCoursesContext(NOCE, rows, terms, null);
    check("(3) ⭐ the Google IT Support program's courses reach the context",
      /### Google IT Support Professional Pre-Apprenticeship[^#]*CIST 100/.test(ctx), ctx.slice(0, 400));
    check("(3) …and it is listed first, ahead of the ECE programs",
      ctx.indexOf("### Google IT") >= 0 && ctx.indexOf("### Google IT") < ctx.indexOf("### ECE"));

    // ── (4) Smoke mode 7v asks what index.ts would build ───────────────────
    const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");
    const sq = (SMOKE.match(/^NOCE_QUESTION='([^']+)'/m) || [])[1];
    const st = (SMOKE.match(/^NOCE_TERMS='([^']+)'/m) || [])[1];
    check("(4) smoke 7v asks Sam's question", sq === Q1, sq);
    check("(4) ⭐ smoke 7v's NOCE_TERMS are the terms index.ts builds from it",
      st && JSON.stringify(JSON.parse(st)) === JSON.stringify(terms), st + " vs " + JSON.stringify(terms));
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + n + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nsierra_alias_word_match.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
