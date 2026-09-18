// Sierra prospective credit — what a HELD credential could count toward, at a
// college that has not granted it.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-09-18, on v67's answer to his Orange County question ("I have a
// cna cert and I want to go to a college in orange county. What CNA courses at
// the colleges match LVN courses so I can ask for credit?"):
//
//   "I was asking her to compare CNA courses to LVN courses so the user could
//    ask for credit. Both she and the last session seemed to confuse this ask
//    with the typical ask for which existing exhibits offer CPL for CNA, which
//    is not the question... The question is what might qualify so the user
//    could ask for it at a college that has not yet granted it."
//
// Three things stood between the question and that answer, all measured live:
//   1. No route carried the TARGET program's course list. coci_college_offerings
//      holds a sample per (college × TOP); the full lists sit in
//      chatbox_college_courses and only the alignment route read them, and only
//      for a NAMED college.
//   2. college_geo has no notion of adjacency, so for a county with no
//      Vocational Nursing entry program (Orange) every remaining college tied at
//      band 0 and VOLUME decided: Sacramento, Butte and Humboldt ahead of Long
//      Beach, Rio Hondo and Chaffey.
//   3. search_statewide_recommendations('cna') returns Cisco's CCNA at tier 3 —
//      a substring match, the "cna" inside "ccna" — and one statewide hit
//      switched the local route off, so the CNA credentials, the LVN license
//      credentials and the only CNA-to-LVN precedent in MAP (Chaffey, NURVN 414)
//      never reached the model.
//   4. (S275, 2026-09-18) Inside a proximity band the picks ordered by VOLUME,
//      which says nothing about distance: the neighbor band put Pasadena and
//      Southwestern ahead of Long Beach City and Rio Hondo, twenty-five miles
//      from Orange County. A campus point per college (COLLEGE_POINTS) makes
//      distance the key inside a band; block 8 pins it, and the fallback (no
//      point on the anchor → volume, as before) is what blocks 3–5 still see.
//
// Assertions here are on what retrieval BUILDS and how the context ORDERS,
// never on model prose (methodology-assert-what-retrieval-returns). Fixtures are
// real rows measured live on 2026-09-18.
//
// Run from repo root: `npm test` (or `node tests/sierra_prospective_credit.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");

let G = null, F = null, liftErr = null;
try {
  G = liftBlock(SRC, "// Proximity band for ranking", "// ── Live CPL contacts (v45",
    ["proximityBand", "REGION_NEIGHBORS", "regionsNeighbor", "pickProspectivePairs",
     "buildProspectiveContext", "buildOfferingsContext", "geoLabel", "PROSPECTIVE_COLLEGES_PER_TOP", "PROSPECTIVE_COURSES_PER_COLLEGE",
     "COLLEGE_POINTS", "collegePoint", "haversineKm", "placePoint", "proximityKm", "cmpKm", "distanceText"]);
  F = liftBlock(SRC, "// A SUBSTRING INSIDE A WORD IS NOT A MATCH ON THE WORD",
    "async function fetchStatewideRecommendations(", ["isFalseFriend"]);
} catch (e) { liftErr = e; }
check("(0) the geo/prospective block and the false-friend guard lift out of index.ts", !liftErr && G && F,
  liftErr && liftErr.message);
if (liftErr) {
  console.log(`\nsierra_prospective_credit.test.js: 0/${results.length} checks passed`);
  process.exit(1);
}

// ── Fixtures: college_geo, the anchored offerings rows, and course rows — all
// measured live 2026-09-18 ─────────────────────────────────────────────────
const geo = (region, county) => ({ region, county });
const geoMap = new Map([
  ["Saddleback College", geo("Orange County", "Orange")],
  ["Golden West College", geo("Orange County", "Orange")],
  ["Santa Ana College", geo("Orange County", "Orange")],
  ["Santiago Canyon College", geo("Orange County", "Orange")],
  ["Cypress College", geo("Orange County", "Orange")],
  ["Pasadena City College", geo("Los Angeles", "Los Angeles")],
  ["Citrus College", geo("Los Angeles", "Los Angeles")],
  ["Long Beach City College", geo("Los Angeles", "Los Angeles")],
  ["Rio Hondo College", geo("Los Angeles", "Los Angeles")],
  ["Chaffey College", geo("Inland Empire", "San Bernardino")],
  ["Riverside City College", geo("Inland Empire", "Riverside")],
  ["Southwestern College", geo("San Diego – Imperial", "San Diego")],
  ["Sacramento City College", geo("Greater Sacramento", "Sacramento")],
  ["Butte College", geo("Far North", "Butte")],
]);
const off = (college, top_code, top_title, course_count) => {
  const g = geoMap.get(college);
  return { college, top_code, top_title, course_count, region: g.region, county: g.county };
};
const CNA = "Certified Nurse Assistant", LVN = "Licensed Vocational Nursing", RN = "Registered Nursing";
// The RPC's own order for the Orange-anchored phrase query: county rows first,
// then everything else by rank. The two elsewhere LVN programs are placed with
// MORE courses than any neighbor, so volume alone would pick them.
const offerings = [
  off("Santiago Canyon College", "1230.30", CNA, 4),
  off("Santa Ana College", "1230.30", CNA, 8),
  off("Saddleback College", "1230.30", CNA, 6),
  off("Golden West College", "1230.30", CNA, 2),
  off("Golden West College", "1230.10", RN, 23),
  off("Saddleback College", "1230.10", RN, 33),
  off("Rio Hondo College", "1230.30", CNA, 8),
  off("Sacramento City College", "1230.20", LVN, 30),
  off("Butte College", "1230.20", LVN, 25),
  off("Pasadena City College", "1230.20", LVN, 24),
  off("Southwestern College", "1230.20", LVN, 23),
  off("Chaffey College", "1230.20", LVN, 22),
  off("Citrus College", "1230.20", LVN, 20),
  off("Long Beach City College", "1230.20", LVN, 16),
  off("Rio Hondo College", "1230.20", LVN, 8),
];
// Smoke 7c's OC_TERMS — what expandWithSynonyms builds for the county question.
const coreKeywords = ["cna", "lvn", "nurse assistant", "certified nurse assistant", "practical nursing", "vocational nursing"];
const orange = { county: "Orange", region: "Orange County", label: "Orange County" };
const held = ["Acute Care Nursing Assistant", "Certified Nursing Assistant (CNA)"];

const course = (college, top_code, subject, course_number, course_title, units, credit_type) =>
  ({ college, top_code, subject, course_number, course_title, units: String(units), credit_type: credit_type || "Credit Course", cid: "" });
const chaffey = [
  ["403", "Fundamentals of Nursing", 3], ["403L", "Fundamentals of Nursing Laboratory", 2],
  ["600", "NCLEX Review for VN Licensure Examination", 0, "Non-Enhanced Funding"],
  ["405", "Beginning Medical Surgical Nursing", 4], ["405L", "Beginning Medical Surgical Nursing Laboratory", 3],
  ["407A", "Beginning Nursing Skills/Clinical Simulation Laboratory", 1], ["409", "Intermediate Medical Surgical Nursing", 4],
  ["411", "Advanced Medical Surgical Nursing", 7], ["413", "Leadership for the Vocational Nurse", 3],
  ["414", "Acute Care Nursing Assistant: Vocational Nursing Foundations", 6], ["415A", "Growth and Development: Psychology Adult-Geriatric", 1],
  ["417A", "Critical Thinking and the Nursing Process I", 1], ["421", "Maternal and Child Health Nursing", 4],
  ["604", "Intravenous Therapy and Blood Withdrawal", 0, "Non-Enhanced Funding"],
].map(([n, t, u, ct]) => course("Chaffey College", "1230.20", "NURVN", n, t, u, ct));
const courses = [
  course("Pasadena City College", "1230.20", "NURS", "102", "Fundamentals of Vocational Nursing – Theory", 5),
  course("Pasadena City College", "1230.20", "NURS", "102L", "Fundamentals of Vocational Nursing – Clinical", 5),
  course("Pasadena City College", "1230.20", "NURS", "126", "Intermediate Vocational Nursing - Theory", 5),
  // Southwestern deliberately has NO course rows: a picked college the read
  // returned nothing for is skipped, never rendered as an empty heading.
  ...chaffey,
  // The cross product: Rio Hondo was not picked for either TOP, and Long Beach
  // is a Los Angeles LVN program the cap left out — neither may render.
  course("Rio Hondo College", "1230.30", "HS", "51", "Certified Nurse Assistant Acute Care Training Course", 4),
  course("Long Beach City College", "1230.20", "VN", "215", "Fundamentals of Nursing", 6),
  course("Santa Ana College", "1230.30", "VHLTH", "105", "Overview of the Acute Care Nursing Assistant Program", 0, "Other Noncredit Enhanced Funding"),
  course("Santa Ana College", "1230.30", "VHLTH", "106", "Acute Care Nursing Assistant Theory", 0, "Other Noncredit Enhanced Funding"),
  course("Saddleback College", "1230.30", "CNA", "422NC", "CERTIFIED NURSE ASSISTANT THEORY", 0, "Other Noncredit Enhanced Funding"),
  course("Santiago Canyon College", "1230.30", "NURSE", "N123", "ESL for CNA and Caregiving", 0, "Other Noncredit Enhanced Funding"),
];

// ── 1. The neighbor map is geography: symmetric, closed, no self-edges ───────
block("1. REGION_NEIGHBORS", () => {
  const M = G.REGION_NEIGHBORS;
  const keys = Object.keys(M);
  check("(1) the map names the nine mainland regions", keys.length === 9);
  let asym = [], unknown = [], selfy = [];
  for (const [r, ns] of Object.entries(M)) {
    for (const n of ns) {
      if (!M[n]) unknown.push(`${r}->${n}`);
      else if (!M[n].includes(r)) asym.push(`${r}->${n}`);
      if (n === r) selfy.push(r);
    }
  }
  check("(1) ⭐ every neighbor relation is symmetric", asym.length === 0, asym.join(", "));
  check("(1) every neighbor is itself a region in the map", unknown.length === 0, unknown.join(", "));
  check("(1) no region is its own neighbor", selfy.length === 0);
  check("(1) Statewide / Online is nobody's neighbor", !keys.includes("Statewide / Online")
    && !Object.values(M).some((ns) => ns.includes("Statewide / Online")));
  check("(1) regionsNeighbor reads the map both ways", G.regionsNeighbor("Orange County", "Los Angeles")
    && G.regionsNeighbor("Los Angeles", "Orange County") && !G.regionsNeighbor("Orange County", "Far North")
    && !G.regionsNeighbor("Orange County", "Orange County") && !G.regionsNeighbor(null, "Los Angeles"));
});

// ── 2. Proximity bands: county 3 > region 2 > neighbor 1 > elsewhere 0 ──────
block("2. proximityBand", () => {
  const b = (college) => G.proximityBand(geoMap.get(college), orange);
  check("(2) same county is 3", b("Saddleback College") === 3);
  check("(2) a neighboring region is 1 (Los Angeles, Inland Empire, San Diego)",
    b("Pasadena City College") === 1 && b("Chaffey College") === 1 && b("Southwestern College") === 1);
  check("(2) elsewhere is 0", b("Sacramento City College") === 0 && b("Butte College") === 0);
  check("(2) same region (a multi-county region) is 2",
    G.proximityBand(geo("Inland Empire", "Riverside"), { county: "San Bernardino", region: "Inland Empire" }) === 2);
  check("(2) no anchor, or no geography, is 0",
    G.proximityBand(geoMap.get("Saddleback College"), null) === 0 && G.proximityBand(null, orange) === 0);
  check("(2) ⭐ the two catalog builders moved their in-place threshold with the bands",
    (SRC.match(/proximityBand\(g, askedGeo\) >= \(askedGeo\.county \? 3 : 2\)/g) || []).length === 2
    && !/askedGeo\.county \? 2 : 1\)/.test(SRC));
});

// ── 3. Picking the (college × TOP) pairs for a PLACE ────────────────────────
block("3. pickProspectivePairs — a place", () => {
  const pairs = G.pickProspectivePairs(offerings, coreKeywords, null, orange, geoMap);
  const tops = [...new Set(pairs.map((p) => p.top_code))];
  check("(3) the two core programs are picked and the RN bridge program is not",
    tops.length === 2 && tops.includes("1230.30") && tops.includes("1230.20") && !tops.includes("1230.10"));
  const cna = pairs.filter((p) => p.top_code === "1230.30").map((p) => p.college);
  const lvn = pairs.filter((p) => p.top_code === "1230.20").map((p) => p.college);
  check("(3) ⭐ in the county first; with no point on the anchor, by how much of the program the college teaches (the fallback), capped at " + G.PROSPECTIVE_COLLEGES_PER_TOP,
    cna.join("|") === "Santa Ana College|Saddleback College|Santiago Canyon College", cna.join("|"));
  check("(3) a neighbor-region college never displaces a county one for the same program", !cna.includes("Rio Hondo College"));
  check("(3) ⭐ with no college in the county or region, the NEIGHBORING regions supply the picks",
    lvn.join("|") === "Pasadena City College|Southwestern College|Chaffey College", lvn.join("|"));
  check("(3) ⭐ volume never beats proximity: the two elsewhere programs with more courses are not picked",
    !lvn.includes("Sacramento City College") && !lvn.includes("Butte College"));
  check("(3) every pair carries its band, county and region for the block",
    pairs.every((p) => typeof p.band === "number" && p.county && p.region));
  check("(3) a duplicate offerings row for the same college × program yields one pair",
    G.pickProspectivePairs([...offerings, off("Santa Ana College", "1230.30", CNA, 8)], coreKeywords, null, orange, geoMap)
      .filter((p) => p.college === "Santa Ana College" && p.top_code === "1230.30").length === 1);
  check("(3) no offerings, or no core match, picks nothing",
    G.pickProspectivePairs(null, coreKeywords, null, orange, geoMap).length === 0
    && G.pickProspectivePairs(offerings, ["welding"], null, orange, geoMap).length === 0);
});

// ── 4. Picking for a NAMED college ──────────────────────────────────────────
block("4. pickProspectivePairs — a named college", () => {
  const pairs = G.pickProspectivePairs(offerings, coreKeywords, "Rio Hondo College", geoMap.get("Rio Hondo College"), geoMap);
  const lvn = pairs.filter((p) => p.top_code === "1230.20").map((p) => p.college);
  check("(4) ⭐ the named college leads its program, then its own region by volume when the anchor carries no point (the fallback)",
    lvn.join("|") === "Rio Hondo College|Pasadena City College|Citrus College", lvn.join("|"));
  const cna = pairs.filter((p) => p.top_code === "1230.30").map((p) => p.college);
  check("(4) the named college leads the other program too, then the nearest (Orange is a neighbor of Los Angeles)",
    cna[0] === "Rio Hondo College" && cna.length === 3 && cna.slice(1).every((c) => geoMap.get(c).region === "Orange County"));
});

// ── 5. The block the model reads ────────────────────────────────────────────
block("5. buildProspectiveContext", () => {
  const pairs = G.pickProspectivePairs(offerings, coreKeywords, null, orange, geoMap);
  const ctx = G.buildProspectiveContext(pairs, courses, held, null, orange);
  check("(5) the block opens with its own header", ctx.includes("--- PROSPECTIVE CREDIT: what a credential could count toward"));
  check("(5) it names the matched credentials", ctx.includes("Acute Care Nursing Assistant; Certified Nursing Assistant (CNA)"));
  check("(5) it says who the lists are nearest to", ctx.includes("nearest Orange County that teach it"));
  const lvnAt = ctx.indexOf("## Licensed Vocational Nursing (TOP 1230.20)");
  const cnaAt = ctx.indexOf("## Certified Nurse Assistant (TOP 1230.30)");
  check("(5) one section per program, in the order the pairs came", cnaAt > 0 && lvnAt > cnaAt);
  const lvnSec = ctx.slice(lvnAt);
  const cnaSec = ctx.slice(cnaAt, lvnAt);
  check("(5) ⭐ a program NO college in the place teaches is said in words",
    lvnSec.includes("NO college in Orange County teaches this program in the current COCI catalog"));
  check("(5) a program the place does teach is counted", cnaSec.includes("In Orange County: 3 of the colleges below."));
  check("(5) a college renders with its county and region",
    lvnSec.includes("### Pasadena City College (Los Angeles County, Los Angeles) — 3 course(s) in this program:"));
  check("(5) a course line carries subject, number, title and units",
    lvnSec.includes("  - NURS 102 — Fundamentals of Vocational Nursing – Theory (5 units)\n"));
  check("(5) ⭐ the cap holds and the remainder is counted, never dropped silently",
    lvnSec.includes("... and 2 more course(s) in this program.")
    && (lvnSec.match(/^  - NURVN /gm) || []).length === G.PROSPECTIVE_COURSES_PER_COLLEGE);
  check("(5) a zero-unit course is marked noncredit rather than shown with 0 units",
    lvnSec.includes("  - NURVN 600 — NCLEX Review for VN Licensure Examination (noncredit)\n")
    && cnaSec.includes("  - VHLTH 106 — Acute Care Nursing Assistant Theory (noncredit)\n"));
  check("(5) a picked college the read returned no rows for is skipped, not shown empty",
    !ctx.includes("### Southwestern College"));
  check("(5) ⭐ only picked pairs render — the cross product's extra rows do not",
    !ctx.includes("Rio Hondo") && !ctx.includes("VN 215") && !ctx.includes("Long Beach"));
  check("(5) the precedent course is in the Chaffey list the model reads",
    lvnSec.includes("NURVN 414 — Acute Care Nursing Assistant: Vocational Nursing Foundations (6 units)"));
  check("(5) empty inputs render nothing",
    G.buildProspectiveContext(pairs, null, held, null, orange) === ""
    && G.buildProspectiveContext([], courses, held, null, orange) === ""
    && G.buildProspectiveContext(pairs, [], held, null, orange) === "");
  const named = G.buildProspectiveContext(
    G.pickProspectivePairs(offerings, coreKeywords, "Rio Hondo College", geoMap.get("Rio Hondo College"), geoMap),
    courses, held, "Rio Hondo College", geoMap.get("Rio Hondo College"));
  check("(5) for a named college the lists are nearest IT and no place line is written",
    named.includes("nearest Rio Hondo College that teach it") && !named.includes("NO college in"));
  check("(5) the block tells the model to present matches as a REQUEST and to cite the precedent",
    ctx.includes("what to ASK that college's CPL coordinator to review") && ctx.includes("cite it as the evidence"));
});

// ── 6. The false-friend guard ───────────────────────────────────────────────
block("6. isFalseFriend", () => {
  const ccna = { unified_title: "Cisco Certified Network Associate (CCNA)", match_tier: 3, matched_via: "Cisco CCNA Certification" };
  check("(6) ⭐ 'cna' inside 'ccna' is a false friend at tier 3", F.isFalseFriend("cna", ccna) === true);
  check("(6) 'cna' as a whole word in the title is a real match at tier 3",
    F.isFalseFriend("cna", { unified_title: "Certified Nursing Assistant (CNA)", match_tier: 3 }) === false);
  check("(6) a real substring hit on a whole word survives (welding in Structural Welding)",
    F.isFalseFriend("welding", { unified_title: "AWS D1.1 Structural Welding", match_tier: 3 }) === false);
  check("(6) exact hits are never judged", F.isFalseFriend("cna", { ...ccna, match_tier: 1 }) === false
    && F.isFalseFriend("cna", { ...ccna, match_tier: 2 }) === false);
  check("(6) tier 4 is judged on the variant that matched",
    F.isFalseFriend("cna", { unified_title: "Something Else", match_tier: 4, matched_via: "Cisco CCNA Certification" }) === true
    && F.isFalseFriend("cna", { unified_title: "Something Else", match_tier: 4, matched_via: "CNA Certificate" }) === false);
  check("(6) ⭐ a tier-4 row that cannot say which variant matched is KEPT (the local route's precedent case)",
    F.isFalseFriend("vocational nursing", { unified_title: "Acute Care Nursing Assistant", match_tier: 4 }) === false);
  check("(6) fuzzy tiers are untouched", F.isFalseFriend("lvn", { unified_title: "Licensed Vocational Nurse (LVN) License", match_tier: 5 }) === false);
  check("(6) a phrase probe matches across the whitespace it was written with",
    F.isFalseFriend("nurse assistant", { unified_title: "Certified Nurse  Assistant (CNA) Certification", match_tier: 3 }) === false);
  check("(6) a probe with regex characters is escaped", F.isFalseFriend("d1.1", { unified_title: "AWS D1.1 Structural Welding", match_tier: 3 }) === false
    && F.isFalseFriend("d1.1", { unified_title: "AWS D111 Structural Welding", match_tier: 3 }) === true);
});

// ── 7. Wiring: the route, the rule, the prompt, the smoke ───────────────────
block("7. wiring", () => {
  check("(7) the guard runs in all four credential probe loops",
    (SRC.match(/if \(isFalseFriend\(asked, r\)\) continue;/g) || []).length === 4);
  check("(7) ⭐ both credential routes run, concurrently — the statewide-first gate is gone",
    /Promise\.all\(\[\s*fetchStatewideRecommendations\(routeText, sb\),\s*fetchAnyCredentials\(routeText, sb\),\s*\]\)/.test(SRC)
    && !/stdRecs && stdRecs\.length > 0\s*\?\s*null\s*:\s*await fetchAnyCredentials/.test(SRC));
  check("(7) the route fires on the anchored offerings with the same core keywords the catalog uses",
    /pickProspectivePairs\(offeringsResults, coreKw, college, askedGeo, geoMap\)/.test(SRC)
    && /const coreKw = expandWithSynonyms\(extractTopicKeywords\(routeText\)\)/.test(SRC));
  const anyFn = SRC.slice(SRC.indexOf("async function fetchAnyCredentials("), SRC.indexOf("async function fetchCollegeCredentials("));
  check("(7) ⭐ the local route ranks an ADOPTED credential first and keeps six, so a tier-4 precedent (Chaffey's NURVN 414) survives four tier-3 catalog hits",
    (() => {
      // The probe builder's own `kws.slice(0, 4)` is not the cap; the cap is the
      // slice after the final sort, so judge only the return statement.
      const ret = anyFn.slice(anyFn.lastIndexOf("return [...byTitle.values()]"));
      return /\(b\.n_adopters > 0 \? 1 : 0\) - \(a\.n_adopters > 0 \? 1 : 0\)/.test(ret)
        && /\.slice\(0, 6\)/.test(ret) && !/\.slice\(0, 4\)/.test(ret);
    })());
  check("(7) the read is one PostgREST query on chatbox_college_courses, fail-safe",
    /sb\.from\("chatbox_college_courses"\)/.test(SRC) && /program course list unavailable/.test(SRC));
  check("(7) the block reaches the prompt right after the alignment worklist",
    SRC.includes("${alignmentContext}${prospectiveContext}${creditContext}"));
  check("(7) the prompt builder takes it, and the handler passes it",
    /alignmentContext: string = "",\s*prospectiveContext: string = "",/.test(SRC)
    && /alignmentContext,\s*prospectiveContext, rulesOverlay, ruleReport, hostScope\)/.test(SRC));
  const reg = SRC.slice(SRC.indexOf("const RULE_DEFAULTS"));
  const ali = reg.indexOf('key: "alignment"'), pro = reg.indexOf('key: "prospective"'), vol = reg.indexOf('key: "volume"');
  check("(7) ⭐ the rule is registered between alignment (60) and volume (70) at 65",
    ali > 0 && pro > ali && vol > pro && /key: "prospective"[^\n]*sortOrder: 65/.test(reg));
  check("(7) the rule fires on its own context, through the predicate table",
    /prospective: \(c: any\) => !!c\.prospectiveContext,/.test(SRC) && /prospectiveContext: string;\s*creditContext: string;/.test(SRC));
  const rule = SRC.slice(SRC.indexOf("const PROSPECTIVE_RULE"), SRC.indexOf("const CREDIT_STATUS_RULE"));
  check("(7) ⭐ the rule says a REQUEST, never a determination, and cites the precedent",
    /PRESENT EVERY MATCH AS A REQUEST, NEVER A DETERMINATION/.test(rule) && /CITE THE PRECEDENT/.test(rule)
    && /never that it "qualifies", "counts", "is equivalent" or "will be accepted"/.test(rule));
  check("(7) the rule names the target program, not the one that trains the held credential",
    /THE PROGRAM THEY WANT TO ENTER IS THE TARGET/.test(rule));
  check("(7) smoke 7c reads for the course-level answer and the request framing (Sam's bar)",
    /7c ⭐ names a Vocational Nursing course from the prospective course lists/.test(SMOKE)
    && /7c ⭐ frames the match as a request for review/.test(SMOKE));
  check("(7) smoke 7c's course alternation names the entry course at every college the block can pick",
    /NURVN\[ -\]\?\(403\|414\)/.test(SMOKE) && /VNRS\[ -\]\?150/.test(SMOKE) && /NURS\[ -\]\?\(102\|125\)/.test(SMOKE)
    && /VOC\[ -\]\?VN10\[01\]/.test(SMOKE) && /VN\[ -\]\?\(8\|10\|103\|215\|220\|61\|061\)/.test(SMOKE));
});

// ── 8. "Nearest" has a distance (2026-09-18, S275) ──────────────────────────
// Inside a band the picks ordered by volume. A campus point per college makes
// distance the key inside a band; the bands still come first, and an anchor
// with no point (blocks 3–5) falls back to volume exactly as before.
block("8. distance — COLLEGE_POINTS, placePoint, within-band order", () => {
  const geoJson = JSON.parse(fs.readFileSync("chatbox/college_geo.json", "utf8"));
  const online = geoJson.filter((g) => g.region === "Statewide / Online").map((g) => g.college);
  const missing = geoJson.filter((g) => !online.includes(g.college) && !G.COLLEGE_POINTS[g.college]).map((g) => g.college);
  const extra = Object.keys(G.COLLEGE_POINTS).filter((c) => !geoJson.some((g) => g.college === c));
  check("(8) ⭐ every college in college_geo.json has a campus point, except the online college", missing.length === 0, missing.join(", "));
  check("(8) no point names a college the geography table does not know", extra.length === 0, extra.join(", "));
  check("(8) the online college has no point and no distance", online.length === 1 && G.collegePoint(online[0]) === null
    && G.proximityKm(online[0], { point: [33.7, -117.9] }) === null);
  const outside = Object.entries(G.COLLEGE_POINTS)
    .filter(([, p]) => !(p.length === 2 && p[0] >= 32.5 && p[0] <= 42.1 && p[1] >= -124.5 && p[1] <= -114.1)).map(([c]) => c);
  check("(8) every point is a [lat, lon] pair inside California's bounding box", outside.length === 0, outside.join(", "));
  const km = (a, b) => G.haversineKm(G.collegePoint(a), G.collegePoint(b));
  check("(8) haversine is symmetric and zero on itself",
    Math.abs(km("Santa Ana College", "Shasta College") - km("Shasta College", "Santa Ana College")) < 1e-9 && km("Santa Ana College", "Santa Ana College") === 0);
  check("(8) known distances hold: Long Beach City under 20 km from Golden West; Southwestern over 140 km from Santa Ana; Shasta over 900 km from Southwestern",
    km("Long Beach City College", "Golden West College") < 20 && km("Santa Ana College", "Southwestern College") > 140 && km("Shasta College", "Southwestern College") > 900);
  const pt = G.placePoint(orange, geoMap);
  check("(8) placePoint averages the campuses inside the place (the fixture's five Orange County colleges)",
    !!pt && Math.abs(pt[0] - 33.7408) < 0.001 && Math.abs(pt[1] + 117.8766) < 0.001, JSON.stringify(pt));
  check("(8) placePoint on a region anchor averages the region; nothing inside, or no place, is null",
    G.placePoint({ region: "Inland Empire" }, geoMap) !== null && G.placePoint({ county: "Nowhere" }, geoMap) === null && G.placePoint(null, geoMap) === null);
  check("(8) cmpKm sorts an unknown distance last, never first",
    G.cmpKm(null, 5) === 1 && G.cmpKm(5, null) === -1 && G.cmpKm(null, null) === 0 && G.cmpKm(3, 9) < 0 && G.cmpKm(9, 3) > 0);
  const orangePt = { ...orange, point: pt };
  // ⭐ The to-do's own case: the course lists lead with Long Beach and Rio Hondo.
  const pairs = G.pickProspectivePairs(offerings, coreKeywords, null, orangePt, geoMap);
  const lvn = pairs.filter((p) => p.top_code === "1230.20").map((p) => p.college);
  const cna = pairs.filter((p) => p.top_code === "1230.30").map((p) => p.college);
  check("(8) ⭐ with a point, the LVN picks lead with Long Beach City and Rio Hondo — nearest first inside the neighbor band, never largest first",
    lvn.join("|") === "Long Beach City College|Rio Hondo College|Citrus College", lvn.join("|"));
  check("(8) ⭐ inside the county the picks are nearest first too (Saddleback, 26 km out, drops behind Golden West)",
    cna.join("|") === "Santa Ana College|Santiago Canyon College|Golden West College", cna.join("|"));
  check("(8) every pair carries its distance in km", pairs.every((p) => typeof p.km === "number" && p.km >= 0));
  check("(8) the bands still come first: no neighbor-region college outranks a county one, and the elsewhere programs stay out",
    !cna.includes("Rio Hondo College") && !lvn.includes("Sacramento City College") && !lvn.includes("Butte College"));
  const rh = { ...geoMap.get("Rio Hondo College"), college: "Rio Hondo College", point: G.collegePoint("Rio Hondo College") };
  const named = G.pickProspectivePairs(offerings, coreKeywords, "Rio Hondo College", rh, geoMap).filter((p) => p.top_code === "1230.20").map((p) => p.college);
  check("(8) a named college leads, then the nearest campus in its own county (Pasadena, 19 km), never the largest program",
    named[0] === "Rio Hondo College" && named[1] === "Pasadena City College"
    && ["Long Beach City College", "Citrus College"].includes(named[2]) && !named.includes("Chaffey College"), named.join("|"));
  const ctx = G.buildProspectiveContext(pairs, courses, held, null, orangePt);
  check("(8) ⭐ a heading carries the distance in miles, labeled about, from the center of the place",
    ctx.includes("### Long Beach City College (Los Angeles County, Los Angeles, about 15 miles from the center of Orange County) — 1 course(s) in this program:"),
    ctx.slice(ctx.indexOf("### Long Beach"), ctx.indexOf("### Long Beach") + 150));
  check("(8) the block says the lists are nearest first with the distance shown", ctx.includes("nearest first, with the distance in miles where it is known"));
  check("(8) for a named college the distance reads from that college, and never for the college itself",
    G.distanceText("Pasadena City College", rh) === "about 10 miles from Rio Hondo College" && G.distanceText("Rio Hondo College", rh) === "");
  check("(8) with no point on the anchor there is no distance text, and geoLabel renders exactly as before",
    G.distanceText("Pasadena City College", orange) === "" && G.geoLabel({ county: "Orange", region: "Orange County" }) === " (Orange County, Orange County)");
  check("(8) under ten miles the label rounds to the mile; above, to five",
    G.distanceText("Santiago Canyon College", orangePt) === "about 7 miles from the center of Orange County"
    && G.distanceText("Citrus College", orangePt) === "about 25 miles from the center of Orange County");
  const off = G.buildOfferingsContext(offerings, null, orangePt, coreKeywords, geoMap);
  const heads = [...off.matchAll(/^## ([^\n(]+?)(?: \(|$)/gm)].map((m) => m[1].trim());
  const at = (c) => heads.indexOf(c);
  check("(8) ⭐ the offerings list: the county first, then the neighbor band nearest first (Long Beach, Rio Hondo, Citrus, Pasadena, Chaffey, Southwestern)",
    at("Saddleback College") >= 0 && at("Long Beach City College") > at("Saddleback College")
    && at("Long Beach City College") < at("Rio Hondo College") && at("Rio Hondo College") < at("Citrus College")
    && at("Citrus College") < at("Pasadena City College") && at("Pasadena City College") < at("Chaffey College")
    && at("Chaffey College") < at("Southwestern College"), heads.join(" > "));
  check("(8) the offerings headings carry the distance too",
    /## Long Beach City College \(Los Angeles County, Los Angeles, about 15 miles from the center of Orange County\)/.test(off));
  check("(8) ⭐ a place anchor carries its point, and the geo map gives a named college its campus point",
    /label: askedPlace\.label, point: placePoint\(askedPlace, geoMap\)/.test(SRC) && /point: collegePoint\(r\.college\)/.test(SRC));
  check("(8) distance is a sort key in all four lists (offerings, programs, exhibits, the prospective picks)",
    (SRC.match(/cmpKm\(proximityKm\(a\[0\], askedGeo\), proximityKm\(b\[0\], askedGeo\)\)/g) || []).length === 3 && /cmpKm\(a\.km, b\.km\)/.test(SRC));
  check("(8) the rule tells the model the distance is in the heading", /its distance \(the heading gives it in miles, where known\)/.test(SRC));
});

// ── Report ──────────────────────────────────────────────────────────────────
let passed = 0;
for (const [name, ok, why] of results) {
  if (ok) passed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${!ok && why ? " — " + why : ""}`);
}
console.log(`\nsierra_prospective_credit.test.js: ${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exit(1);
