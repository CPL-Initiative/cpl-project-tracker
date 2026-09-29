// Sierra place anchor — a county or region named in the question is an ANCHOR,
// not a college.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam's test question on cpl-chat v67 (2026-09-18, chat_interactions
// 051d37b6): "I have a cna cert and I want to go to a college in orange
// county. What CNA courses at the colleges match LVN courses so I can ask for
// credit?" It went wrong three ways, all from one gap:
//
//   1. "orange" ilike-matched Orange Coast College and North Orange Continuing
//      Education, so the answer profiled two colleges nobody had asked about.
//   2. askedGeo came only from a RESOLVED college, so the county anchored
//      nothing and both catalog lists fell back to volume order; the seven LVN
//      programs she named were in Sacramento, Butte, Humboldt, Madera, Siskiyou
//      and Los Angeles counties, and the top-10 college cap never reached
//      Orange County.
//   3. "orange" and "county" — and "want", "courses", "match", "ask" — went to
//      every keyword route as live terms. The credential probes, built from the
//      first four keywords, were spent on "cna want", "want orange", "orange
//      county" and "county cna"; "lvn" was never asked, and the one CNA-to-LVN
//      precedent in MAP (Chaffey, NURVN 414) never reached the model.
//
// Two more findings rode along. `cna` had no synonym family (only a VALUE in
// the nursing families), so only titles that spell "CNA" matched; and the
// offerings builder dropped every phrase, so an LVN question reached the
// Vocational Nursing TOP (44 colleges) only where a course title spelled "LVN".
//
// Assertions here are on what retrieval BUILDS and how the context ORDERS,
// never on model prose — docs/kb-notes/methodology-assert-what-retrieval-
// returns.md. Fixtures are real rows measured live on 2026-09-18.
//
// Run from repo root: `npm test` (or `node tests/sierra_place_anchor.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");
const SQL_P = fs.readFileSync("chatbox/supabase_search_college_programs.sql", "utf8");
const SQL_O = fs.readFileSync("chatbox/supabase_search_college_offerings.sql", "utf8");

let V = null, P = null, G = null, liftErr = null;
try {
  V = liftBlock(SRC, "const TOPIC_SYNONYMS", "// ── Topic-based exhibit search",
    ["extractTopicKeywords", "expandWithSynonyms", "singleTokenTerms", "tsQueryFromTerms", "TOPIC_SYNONYMS"]);
  P = liftBlock(SRC, "// ── Place anchor", "// Proximity band for ranking",
    ["resolveAskedPlace", "buildPlaceContext", "PLACE_ALIASES", "SUBREGIONS", "REGION_ALIASES"]);
  G = liftBlock(SRC, "// Proximity band for ranking", "// ── Live CPL contacts (v45",
    ["proximityBand", "buildOfferingsContext", "buildProgramsContext"]);
} catch (e) { liftErr = e; }
check("the vocabulary, place and geo blocks lift out of index.ts", !liftErr && V && P && G,
  liftErr && liftErr.message);

// ── Fixtures: college_geo rows, measured 2026-09-18 ──────────────────────────
const geo = (region, county) => ({ region, county });
const geoMap = new Map([
  ["Coastline Community College", geo("Orange County", "Orange")],
  ["Cypress College", geo("Orange County", "Orange")],
  ["Fullerton College", geo("Orange County", "Orange")],
  ["Golden West College", geo("Orange County", "Orange")],
  ["Irvine Valley College", geo("Orange County", "Orange")],
  ["North Orange Continuing Education", geo("Orange County", "Orange")],
  ["North Orange Continuing Education Credit", geo("Orange County", "Orange")],
  ["Orange Coast College", geo("Orange County", "Orange")],
  ["Saddleback College", geo("Orange County", "Orange")],
  ["Santa Ana College", geo("Orange County", "Orange")],
  ["Santiago Canyon College", geo("Orange County", "Orange")],
  ["Long Beach City College", geo("Los Angeles", "Los Angeles")],
  ["Rio Hondo College", geo("Los Angeles", "Los Angeles")],
  ["Citrus College", geo("Los Angeles", "Los Angeles")],
  ["Pasadena City College", geo("Los Angeles", "Los Angeles")],
  ["Mt. San Antonio College", geo("Los Angeles", "Los Angeles")],
  ["Glendale Community College", geo("Los Angeles", "Los Angeles")],
  ["East Los Angeles College", geo("Los Angeles", "Los Angeles")],
  ["Antelope Valley College", geo("Los Angeles", "Los Angeles")],
  ["Los Angeles Harbor College", geo("Los Angeles", "Los Angeles")],
  ["Chaffey College", geo("Inland Empire", "San Bernardino")],
  ["Riverside City College", geo("Inland Empire", "Riverside")],
  ["Allan Hancock College", geo("Central Coast", "Santa Barbara")],
  ["Butte College", geo("Far North", "Butte")],
  ["Sacramento City College", geo("Greater Sacramento", "Sacramento")],
  ["Laney College", geo("Bay Area", "Alameda")],
  ["San Diego City College", geo("San Diego – Imperial", "San Diego")],
  ["Calbright College Credit", geo("Statewide / Online", null)],
]);
const OC = [...geoMap.entries()].filter(([, g]) => g.county === "Orange").map(([c]) => c).sort();

const SAM_Q1 = "I have a cna cert and I want to go to a college in orange county. What CNA courses at the colleges match LVN courses so I can ask for credit?";
const SAM_Q2 = "What CNA courses match LVN courses so I can ask for credit. I don't care if they have an exhibit yet. I will request it.";

// ── 1. resolveAskedPlace ─────────────────────────────────────────────────────
block("1. a county in the question resolves", () => {
  if (!P) return;
  const p = P.resolveAskedPlace(SAM_Q1, geoMap);
  check("(1) ⭐ Sam's question resolves to Orange County", p && p.county === "Orange" && p.region === "Orange County",
    JSON.stringify(p));
  check("(1) the label is what the model reads", p && p.label === "Orange County");
  check("(1) ⭐ the place is STRIPPED from the text the college matcher sees",
    p && !/orange/i.test(p.stripped) && !/county/i.test(p.stripped), p && p.stripped);
  check("(1) …and the topic survives the strip", p && /cna/i.test(p.stripped) && /lvn/i.test(p.stripped));
  check("(1) case does not matter", (P.resolveAskedPlace("colleges in ORANGE COUNTY", geoMap) || {}).county === "Orange");
  check("(1) a two-word county resolves", (P.resolveAskedPlace("I live in los angeles county", geoMap) || {}).county === "Los Angeles");
  check("(1) ⚠ a college name that shares a word with a county does NOT resolve as a place",
    P.resolveAskedPlace("Does Orange Coast College give CPL for CPR?", geoMap) === null,
    "the county needs the word 'county' beside it; without this, every OCC question would anchor on the county and strip the college");
  check("(1) ⚠ a county name alone does not resolve — 'Riverside' is a college",
    P.resolveAskedPlace("Does Riverside teach welding?", geoMap) === null);
  check("(1) …but 'Riverside County' does, with its region",
    (() => { const r = P.resolveAskedPlace("welding programs in Riverside County", geoMap); return r && r.county === "Riverside" && r.region === "Inland Empire" && r.label === "Riverside County"; })());
  check("(1) a REGION resolves as a bare phrase, county null",
    (() => { const r = P.resolveAskedPlace("colleges in the inland empire that teach nursing", geoMap); return r && r.county === null && r.region === "Inland Empire" && r.label === "Inland Empire"; })());
  check("(1) another region", (P.resolveAskedPlace("bay area LVN programs", geoMap) || {}).region === "Bay Area");
  check("(1) ⚠ a region that is part of a college name never matches bare — 'Los Angeles' is in nine",
    P.resolveAskedPlace("Los Angeles Harbor College and NCCER", geoMap) === null);
  check("(1) alias: LA County", (P.resolveAskedPlace("LA County colleges with CNA", geoMap) || {}).county === "Los Angeles");
  check("(1) alias: the OC", (P.resolveAskedPlace("any college in the OC?", geoMap) || {}).county === "Orange");
  check("(1) the alias is word-bounded — OCC is not the OC",
    P.resolveAskedPlace("Does OCC give credit for CPR?", geoMap) === null);
  check("(1) empty text, no map, empty map all give null",
    P.resolveAskedPlace("", geoMap) === null && P.resolveAskedPlace(SAM_Q1, null) === null
    && P.resolveAskedPlace(SAM_Q1, new Map()) === null);
  check("(1) the second question carries no place of its own", P.resolveAskedPlace(SAM_Q2, geoMap) === null,
    "the prior-turn fold in the handler is what carries Orange County into it");
});

// ── 2. buildPlaceContext ─────────────────────────────────────────────────────
block("2. the place block", () => {
  if (!P) return;
  const ctx = P.buildPlaceContext(P.resolveAskedPlace(SAM_Q1, geoMap), geoMap);
  check("(2) the block names the place", /THE VISITOR'S PLACE: Orange County/.test(ctx));
  check("(2) it says a PLACE was named, not a college", /named a PLACE, not a college/.test(ctx));
  check("(2) ⭐ it lists every college in the county, from the geography table",
    OC.every((c) => ctx.includes(c)) && ctx.includes(`(${OC.length})`), ctx);
  check("(2) it forbids guessing at a catalog", /never guess at a college's catalog/.test(ctx));
  const ie = P.buildPlaceContext(P.resolveAskedPlace("nursing in riverside county", geoMap), geoMap);
  check("(2) a county whose region has a different name shows both", /Riverside County \(Inland Empire region\)/.test(ie));
  check("(2) …and lists only that county's colleges",
    ie.includes("Riverside City College") && !ie.includes("Chaffey College"));
  check("(2) no place, no block", P.buildPlaceContext(null, geoMap) === "");
});

// ── 3. the catalog builders under a place anchor ─────────────────────────────
// Real rows from search_college_programs / search_college_offerings, 2026-09-18.
const prog = (college, program_title, award, top_code, matched_via) =>
  ({ college, program_title, award, top_code, top_title: top_code === "1230.10" ? "Registered Nursing" : top_code === "1230.30" ? "Certified Nurse Assistant" : "Licensed Vocational Nursing", matched_via });
const PROGRAMS = [
  prog("Allan Hancock College", "Vocational Nursing", "A.S. Degree", "1230.20", "title+code"),
  prog("Butte College", "Licensed Vocational Nursing", "A.S. Degree", "1230.20", "title+code"),
  prog("Rio Hondo College", "Vocational Nursing", "A.S. Degree", "1230.20", "title+code"),
  prog("Sacramento City College", "Vocational Nursing", "A.S. Degree", "1230.20", "title+code"),
  prog("Saddleback College", "Licensed Vocational Nurse (LVN) to Registered Nurse (RN) 30-Unit Option", "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units", "1230.20", "title+code"),
  prog("Golden West College", "LVN to RN", "A.S. Degree", "1230.10", "title"),
  prog("Golden West College", "Certified Nurse Assistant", "Noncredit program", "1230.30", "title"),
  prog("Cypress College", "30-Unit Option Career Mobility: Licensed Vocational Nurse to Registered Nurse", "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", "1230.10", "title"),
  prog("Santa Ana College", "Nursing Assistant", "Noncredit program", "1230.30", "title"),
  prog("Long Beach City College", "Nursing: Vocational/Practical", "A.S. Degree", "1230.20", "code"),
  prog("Chaffey College", "Nursing: Vocational", "A.S. Degree", "1230.20", "code"),
];
const off = (college, top_code, top_title, course_count, samples) =>
  ({ college, top_code, top_title, course_count, cid_count: 0, sample_courses: samples.map((s) => ({ code: s.split("|")[0], title: s.split("|")[1] })) });
const OFFERINGS = [
  off("Long Beach City College", "1230.20", "Licensed Vocational Nursing", 16, ["VN 220|Transition to Vocational Nursing", "VN 230|Common Health Deviations 1"]),
  off("Rio Hondo College", "1230.20", "Licensed Vocational Nursing", 8, ["VN 61|Basic Fundamentals of Nursing", "VN 78|Vocational Nursing I"]),
  off("Chaffey College", "1230.20", "Licensed Vocational Nursing", 22, ["NURVN 403|Fundamentals of Nursing", "NURVN 414|Acute Care Nursing Assistant: Vocational Nursing Foundations"]),
  off("Butte College", "1230.20", "Licensed Vocational Nursing", 12, ["VN 10|Fundamentals"]),
  off("Santa Ana College", "1230.30", "Certified Nurse Assistant", 8, ["VHLTH 101|Overview of the Nursing Assistant Training Program", "VHLTH 102|Certified Nursing Assistant (CNA) Training - Theory"]),
  off("Saddleback College", "1230.30", "Certified Nurse Assistant", 6, ["CNA 422NC|CERTIFIED NURSE ASSISTANT THEORY"]),
  off("Saddleback College", "1230.10", "Registered Nursing", 33, ["N 164L|LVN TO RN CLINICAL LAB"]),
  off("Golden West College", "1230.30", "Certified Nurse Assistant", 2, ["NURS G060N|Certified Nurse Assistant"]),
];
const headings = (ctx) => [...ctx.matchAll(/^## ([^\n(]+?)(?: \(|$)/gm)].map((m) => m[1].trim());

block("3. the builders lead with the place", () => {
  if (!G || !P || !V) return;
  const anchor = (() => { const p = P.resolveAskedPlace(SAM_Q1, geoMap); return { county: p.county, region: p.region, label: p.label }; })();

  const pc = G.buildProgramsContext(PROGRAMS, null, anchor, geoMap);
  const ph = headings(pc);
  check("(3) ⭐ programs: the Orange County colleges come first",
    ph.length >= 4 && ph.slice(0, 4).every((c) => geoMap.get(c) && geoMap.get(c).county === "Orange"), JSON.stringify(ph));
  check("(3) programs: the place line counts the county's colleges", /### In Orange County: 4 college\(s\) have a matching program/.test(pc), pc);
  check("(3) programs: the place line warns about the bridge before it is called the program asked for",
    /LVN to RN.*already hold the license/.test(pc));
  const none = G.buildProgramsContext(PROGRAMS.filter((r) => geoMap.get(r.college).county !== "Orange"), null, anchor, geoMap);
  check("(3) ⭐ programs: a county with NO matching program is told so, in words",
    /### The current program catalog data lists no college in Orange County with a matching program/.test(none), none);
  check("(3) programs: …and the nearest still follow", headings(none).length > 0);
  const noAnchor = G.buildProgramsContext(PROGRAMS, null, null, geoMap);
  check("(3) programs: without an anchor there is no place line", !/In Orange County|lists no college in/.test(noAnchor));
  const collegeAnchor = G.buildProgramsContext(PROGRAMS, "Saddleback College", { county: "Orange", region: "Orange County" }, geoMap);
  check("(3) programs: a college-derived anchor (no label) adds no place line", !/In Orange County|lists no college in/.test(collegeAnchor));

  const core = V.expandWithSynonyms(V.extractTopicKeywords(P.resolveAskedPlace(SAM_Q1, geoMap).stripped));
  const oc = G.buildOfferingsContext(OFFERINGS, null, anchor, core, geoMap);
  const oh = headings(oc);
  check("(3) ⭐ offerings: the Orange County colleges come first",
    oh.length >= 3 && oh.slice(0, 3).every((c) => geoMap.get(c).county === "Orange"), JSON.stringify(oh));
  check("(3) offerings: the place line counts the county's colleges", /### In Orange County: 3 college\(s\) teach in this area/.test(oc), oc);
  check("(3) ⭐ offerings: the Vocational Nursing course lines reach the model",
    /VN 220 Transition to Vocational Nursing/.test(oc) && /NURVN 414 Acute Care Nursing Assistant/.test(oc),
    "these rows only exist once the offerings query can express 'vocational nursing' as a phrase");
  const onone = G.buildOfferingsContext(OFFERINGS.filter((r) => geoMap.get(r.college).county !== "Orange"), null, anchor, core, geoMap);
  check("(3) ⭐ offerings: a county with NO teaching college is told so, in words",
    /### The current catalog data lists no college in Orange County teaching courses matching this/.test(onone), onone);
  const region = { county: null, region: "Inland Empire", label: "Inland Empire" };
  const ie = G.buildOfferingsContext(OFFERINGS, null, region, core, geoMap);
  check("(3) a region-only anchor counts by region", /### In Inland Empire: 1 college\(s\) teach/.test(ie), ie);
});

// ── 4. the offerings query can say a phrase ──────────────────────────────────
block("4. tsQueryFromTerms", () => {
  if (!V) return;
  check("(4) a single token is a prefix term", V.tsQueryFromTerms(["cna"]) === "cna:*");
  check("(4) ⭐ a phrase becomes an adjacency, parenthesized",
    V.tsQueryFromTerms(["nurse assistant"]) === "(nurse:* <-> assistant:*)");
  check("(4) terms are OR-joined", V.tsQueryFromTerms(["cna", "vocational nursing"]) === "cna:* | (vocational:* <-> nursing:*)");
  check("(4) blanks are dropped", V.tsQueryFromTerms(["", " ", "lvn"]) === "lvn:*");
  check("(4) singleTokenTerms survives for the v1 exhibit fallback",
    typeof V.singleTokenTerms === "function" && /singleTokenTerms\(keywords\)\.map/.test(SRC));
  check("(4) ⚠ the offerings route builds with the phrase form, not the single-token filter",
    /const tsQuery = tsQueryFromTerms\(keywords\);/.test(SRC) && !/singleTokenTerms\(keywords\)\.map\(\(k\) => `\$\{k\}:\*`\)\.join\(" \| "\);\n  const \{ data, error \} = await sb\.rpc\("search_college_offerings"/.test(SRC));
});

// ── 5. the vocabulary ────────────────────────────────────────────────────────
block("5. cna family and ask-shape stop words", () => {
  if (!V || !P) return;
  const fam = V.TOPIC_SYNONYMS.cna;
  check("(5) ⭐ `cna` has a synonym family", Array.isArray(fam) && fam.length >= 2, JSON.stringify(fam));
  check("(5) ⚠ every cna synonym is a PHRASE — 'assistant' alone is Medical/Dental/Administrative Assistant",
    Array.isArray(fam) && fam.every((t) => /\s/.test(t)));
  check("(5) the family reaches 'nurse assistant'", V.expandWithSynonyms(["cna"]).includes("nurse assistant"));
  const kw = V.extractTopicKeywords(P.resolveAskedPlace(SAM_Q1, geoMap).stripped);
  check("(5) ⭐ Sam's question keyword-extracts to the topic and nothing else",
    JSON.stringify(kw) === JSON.stringify(["cna", "cna", "lvn"]), JSON.stringify(kw));
  check("(5) the ask-shape words are stopped",
    V.extractTopicKeywords("I want to ask which courses match the program").length === 0);
  check("(5) a contraction stem is stopped", !V.extractTopicKeywords("I don't care if they have an exhibit yet").includes("don"));
  check("(5) topic words are untouched", JSON.stringify(V.extractTopicKeywords("welding courses in the OC")) === JSON.stringify(["welding"]));
  const q2 = V.expandWithSynonyms(V.extractTopicKeywords(SAM_Q2));
  check("(5) the second question expands to the nursing phrases", q2.includes("nurse assistant") && q2.includes("vocational nursing"), JSON.stringify(q2));
});

// ── 6. the smoke transcriptions match what index.ts builds ───────────────────
block("6. mode 7c transcriptions", () => {
  if (!V || !P) return;
  const q = (SMOKE.match(/^OC_QUESTION='([^']+)'/m) || [])[1];
  const terms = (SMOKE.match(/^OC_TERMS='([^']+)'/m) || [])[1];
  const tsq = (SMOKE.match(/^OC_OFFERINGS_TSQ='([^']+)'/m) || [])[1];
  check("(6) mode 7c pins its question, terms and tsquery", !!q && !!terms && !!tsq);
  if (!q || !terms || !tsq) return;
  const place = P.resolveAskedPlace(q, geoMap);
  check("(6) the 7c question resolves to Orange County", place && place.county === "Orange");
  const derived = V.expandWithSynonyms(V.extractTopicKeywords(place ? place.stripped : q));
  check("(6) ⭐ OC_TERMS is what index.ts builds for the stripped question",
    JSON.stringify(derived) === JSON.stringify(JSON.parse(terms)),
    "index.ts builds " + JSON.stringify(derived) + " — re-derive the smoke literal");
  check("(6) ⭐ OC_OFFERINGS_TSQ is what tsQueryFromTerms builds from them",
    V.tsQueryFromTerms(derived) === tsq, "index.ts builds " + V.tsQueryFromTerms(derived));
  check("(6) the verify script carries the same tsquery",
    fs.readFileSync("chatbox/verify_search_college_offerings.sql", "utf8").includes(tsq));
  const CODE = SMOKE.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
  check("(6) 7c asserts the programs RPC leads with the county, contiguously", /the programs RPC leads with \$pn contiguous Orange County rows/.test(CODE));
  check("(6) 7c asserts the phrase reaches the Vocational Nursing TOP", /Licensed Vocational Nursing rows/.test(CODE));
  check("(6) 7c asks the county question of the function", /run "7c place anchor/.test(CODE));
  check("(6) 7c passes anchor_county to both RPCs", (CODE.match(/"anchor_county":"%s"/g) || []).length === 2);
});

// ── 7. the wiring ────────────────────────────────────────────────────────────
block("7. wiring — the place reaches the routes, the RPCs and the prompt", () => {
  check("(7) ⭐ the geography table is read BEFORE detection, beside the embedding",
    /const \[queryEmbedding, geoMap\] = await Promise\.all\(\[\s*session\.run\(searchText[\s\S]{0,200}fetchCollegeGeoMap\(sb\),/.test(SRC));
  check("(7) the place is parsed from this turn, then from earlier turns",
    /resolveAskedPlace\(searchText, geoMap\)/.test(SRC) && /resolveAskedPlace\(priorUserText, geoMap\)/.test(SRC));
  check("(7) ⭐ the college matcher sees the STRIPPED text", /detectAndFetchCollegeProfile\(routeText, sb\)/.test(SRC));
  check("(7) the keyword routes see the stripped text",
    /searchExhibitsByTopic\(routeText, sb\)/.test(SRC) && /searchCollegeOfferings\(routeText, sb, placeAnchor\)/.test(SRC)
    && /searchCollegePrograms\(routeText, sb, placeAnchor\)/.test(SRC) && /extractTopicKeywords\(routeText\)/.test(SRC)
    && /fetchStatewideRecommendations\(routeText, sb\)/.test(SRC) && /fetchAnyCredentials\(routeText, sb\)/.test(SRC)
    && /fetchCredentialVolume\(routeText, sb\)/.test(SRC));
  check("(7) ⭐ askedGeo falls back to the place when no college resolved",
    /const askedGeo = singleProfile \? geoMap\.get\(singleProfile\.college\) \|\| null : placeAnchor;/.test(SRC));
  check("(7) the place block reaches the prompt", /collegeContext = buildPlaceContext\(askedPlace, geoMap\) \+ collegeContext;/.test(SRC));
  // `anchor?.county ?? null`, not a ternary: sierra_program_search.test.js reads
  // every `word:` in the call block as a passed argument, and a ternary's colon
  // would read as one ("county", "region") that the SQL does not declare.
  check("(7) ⭐ both RPC calls pass the anchor", (SRC.match(/anchor_county: anchor\?\.county \?\? null,/g) || []).length === 2
    && (SRC.match(/anchor_region: anchor\?\.region \?\? null,/g) || []).length === 2);
  check("(7) ⭐ both SQL files of record declare the anchor parameters",
    /anchor_county\s+text\s+default null,\s*\n\s*anchor_region\s+text\s+default null/.test(SQL_P)
    && /anchor_county\s+text\s+default null,\s*\n\s*anchor_region\s+text\s+default null/.test(SQL_O));
  check("(7) ⚠ both drop the superseded signature first — the overload trap",
    /drop function if exists public\.search_college_programs\(text\[\], text, integer, numeric, real\);/.test(SQL_P)
    && /drop function if exists public\.search_college_offerings\(text, text, integer\);/.test(SQL_O));
  check("(7) ⚠ both restore the grants the drop discards",
    /grant execute on function public\.search_college_programs\(text\[\], text, integer, numeric, real, text, text\)\s*\n?\s*to anon, authenticated, service_role;/.test(SQL_P)
    && /grant execute on function public\.search_college_offerings\(text, text, integer, text, text\)\s*\n?\s*to anon, authenticated, service_role;/.test(SQL_O));
  check("(7) the anchor is an ORDER key, never a filter, in both",
    /order by \(anchor_county is not null and g\.county is not distinct from anchor_county\) desc/.test(SQL_P)
    && /order by \(anchor_county is not null and g\.county is not distinct from anchor_county\) desc/.test(SQL_O)
    && !/anchor_/.test((SQL_O.match(/\n\s*where ([\s\S]*?)\n\s*(?:--[^\n]*\n\s*)*order by/) || [])[1] || "anchor_"));
  check("(7) the verify scripts assert order-not-set", /E3 FAIL: the anchor changed the row set/.test(fs.readFileSync("chatbox/verify_search_college_programs.sql", "utf8"))
    && /O5 FAIL: the anchor changed the row set/.test(fs.readFileSync("chatbox/verify_search_college_offerings.sql", "utf8")));
  check("(7) the rule tells the model what a place block is for", /WHEN THE VISITOR NAMED A PLACE/.test(SRC));
  check("(7) ⭐ the rule tells the model how to match courses to a credential from data", /WHICH COURSES A CREDENTIAL COULD COUNT TOWARD/.test(SRC));
  check("(7) the four credential probe builders take phrase synonyms", (SRC.match(/phraseSynonymProbes\(kws\)/g) || []).length === 4);
  check("(7) …under a budget that keeps the raw probes", (SRC.match(/probes\.slice\(0, 10\)/g) || []).length === 4 && !/probes\.slice\(0, 8\)/.test(SRC));
  check("(7) the geo test's pinned call is still there for it", /fetchCollegeGeoMap\(sb\),/.test(SRC));
});

// ── 8. A SUB-REGION IS A PLACE TOO (2026-09-18, S277) ────────────────────────
// Sam, 2026-09-18, on a live answer: "Sierra is still not answering correctly."
// The visitor wrote "I have a cna cert and live in the San Gabriel Valley …
// compare typical CNA courses to LVN". resolveAskedPlace matched NOTHING — no
// "<county> county", no alias, and "Los Angeles" is skipped as a bare region
// because nine colleges carry it in their name — so askedGeo was null, both
// catalog RPCs fell back to volume order, and Sierra offered Los Medanos
// College (Contra Costa, ~370 mi) as "one of the nearer matches I can confirm"
// while stating the catalog data showed no San Gabriel Valley college teaching
// an LVN entry program. Measured against the live catalog that same day, FIVE
// do, with 87 course rows between them: Pasadena City (NURS 102/125, 28 rows),
// Citrus (VNRS 150, 20), Glendale (NS 110, 19), Mt. San Antonio (VOC VN101, 12)
// and Rio Hondo (VN 61, 8). The answer then named Pasadena and Rio Hondo from
// the model's own knowledge and said "my data doesn't confirm their course
// lists here" — while the data held 28 rows and 8.
const SAM_Q3 = "I have a cna cert and live in the San Gabriel Valley where I want to get credit for my classes toward LVN or related job. Can you compare typical CNA courses to LVN and others so I can see what credit I might request?";
block("8. a sub-region resolves, anchors and strips", () => {
  if (!P) return;
  const p = P.resolveAskedPlace(SAM_Q3, geoMap);
  check("(8) ⭐ the San Gabriel Valley resolves at all — it returned null before",
    p !== null, "resolveAskedPlace returned null for Sam's question");
  if (!p) return;
  check("(8) it anchors on the county that contains it", p.county === "Los Angeles");
  check("(8) …and carries that county's region for the band", p.region === "Los Angeles");
  check("(8) it labels itself, never as its county", /San Gabriel Valley/.test(p.label) && !/Los Angeles County/.test(p.label));
  check("(8) ⭐ it carries its OWN campuses, so the anchor point is not the county centroid",
    Array.isArray(p.colleges) && p.colleges.includes("Pasadena City College") && p.colleges.includes("Citrus College"));
  check("(8) …filtered to colleges the geography table actually holds",
    p.colleges.every((c) => geoMap.has(c)));
  check("(8) the place is STRIPPED from the text the keyword routes see",
    !/san gabriel valley/i.test(p.stripped) && /cna cert/i.test(p.stripped),
    "stripped = " + JSON.stringify(p.stripped));
});
block("8. the place block names the colleges that ARE there", () => {
  if (!P) return;
  const p = P.resolveAskedPlace(SAM_Q3, geoMap);
  const ctx = P.buildPlaceContext(p, geoMap);
  check("(8) ⭐ it lists the San Gabriel Valley colleges by name",
    /Pasadena City College/.test(ctx) && /Citrus College/.test(ctx) && /Rio Hondo College/.test(ctx));
  check("(8) ⚠ and says the rest of the county is still close — the list is not a fence",
    /rest of that county is still close/.test(ctx) && /never read/i.test(ctx),
    "a sub-region's college list must never read as the only colleges within reach");
  check("(8) it keeps the standing never-state-an-absence-as-a-fact instruction",
    /never that no college in/.test(ctx));
});
block("8. a sub-region beats the county it sits in", () => {
  if (!P) return;
  const p = P.resolveAskedPlace("I live in the San Gabriel Valley in Los Angeles County", geoMap);
  check("(8) ⚠ the more specific place wins the tie", p && /San Gabriel Valley/.test(p.label),
    "got " + (p && p.label));
});
block("8. the vocabulary is real", () => {
  if (!P || !P.SUBREGIONS) return;
  const rows = P.SUBREGIONS;
  // The typo guard: a misspelled college is silently dropped by the geoMap
  // filter, which shrinks a sub-region without failing anything.
  const known = new Set(JSON.parse(fs.readFileSync("chatbox/college_geo.json", "utf8")).map((r) => r.college));
  const unknown = [];
  for (const sr of rows) for (const c of sr.colleges) if (!known.has(c)) unknown.push(sr.label + " → " + c);
  check("(8) ⭐ every college named in a sub-region exists in college_geo.json", unknown.length === 0,
    unknown.join("; "));
  const counties = new Set(JSON.parse(fs.readFileSync("chatbox/college_geo.json", "utf8")).map((r) => r.county));
  const badCounty = rows.filter((sr) => !counties.has(sr.county)).map((sr) => sr.label + " → " + sr.county);
  check("(8) every sub-region's county exists too", badCounty.length === 0, badCounty.join("; "));
  check("(8) names are lower-case — resolveAskedPlace matches case-insensitively but escapes them verbatim",
    rows.every((sr) => sr.names.every((n) => n === n.toLowerCase())));
  check("(8) ⚠ no sub-region claims an ambiguous name — \"South Bay\" is Torrance to one student and San Jose to another",
    !rows.some((sr) => sr.names.some((n) => n === "south bay")),
    "a confidently wrong anchor is worse than none");
  check("(8) the region aliases point at regions college_geo declares", P.REGION_ALIASES &&
    Object.values(P.REGION_ALIASES).every((r) =>
      new Set(JSON.parse(fs.readFileSync("chatbox/college_geo.json", "utf8")).map((x) => x.region)).has(r)));
});
block("8. the padded-table rule is gone", () => {
  check("(8) ⭐ the rule no longer demands five to eight rows", !/Five to eight rows/.test(SRC),
    "that count is what made the model restate one CNA course under six names");
  check("(8) it tells the model to take the rows the quick list gives and stop",
    /TAKE THE ROWS THE QUICK LIST GIVES YOU AND STOP/.test(SRC));
  check("(8) ⚠ and that the two columns are lists, not row-by-row pairings",
    /THE COLUMNS ARE TWO INDEPENDENT LISTS, NOT PAIRINGS/.test(SRC));
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_place_anchor.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
