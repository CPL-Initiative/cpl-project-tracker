// Sierra geography — college detection, and ranking peers by DISTANCE not VOLUME.
//
// WHY THIS TEST EXISTS
// --------------------
// Smoke mode 7 asks "Does Los Angeles Harbor College give credit for NCCER
// carpentry?" and expects a genuinely adjacent college. It answered with Norco
// (Riverside County, ~50 mi) while LA Trade Tech, Rio Hondo, Cerritos, Long
// Beach City and El Camino — all in LA Harbor's own county, all in the data —
// ranked below it. The handoff called this "volume outranking distance." The
// measurement said something sharper:
//
//   1. THE HOME COLLEGE WAS NEVER DETECTED. detectAndFetchCollegeProfile walked
//      the query's words in order and returned on the FIRST word with several
//      matches. "angeles" matches 9 colleges, so it returned that ambiguous set
//      and never reached "harbor", which matches exactly ONE. And `.limit(3)`
//      with no ORDER BY is non-deterministic — two identical live calls returned
//      {East LA, LA City, LA Harbor} and {LA Mission, LA Southwest, West LA}. So
//      the question found its home college only when LA Harbor happened to land
//      in an arbitrary window. That is a large part of what looked like model
//      flake: retrieval itself was flaky.
//
//   2. WITH NO HOME COLLEGE, THERE IS NO "NEAREST". askedGeo was null, so every
//      proximity band scored 0 and both lists fell back to volume ordering.
//
//   3. THE EXHIBIT LIST HAD NO GEOGRAPHY AT ALL. search_exhibits_by_topic
//      returns no region/county, so that list could only ever sort by count —
//      "Does Fullerton College give CPL for CPR?" led with Modesto (Stanislaus
//      County, ~300 mi, 12 exhibits) over Cypress College, which is 7 miles from
//      Fullerton in the same district. Fixed by loading college_geo once per
//      question and ranking both lists against it.
//
// Assertions here are on the ORDERED SET each builder produces, never on model
// prose — see docs/kb-notes/methodology-assert-what-retrieval-returns.md, which
// names smoke mode 7 as the last place still grepping an answer.
//
// The fixtures are REAL rows measured from the live database on 2026-08-07, not
// invented shapes.
//
// Run from repo root: `npm test` (or `node tests/sierra_geo_ranking.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

let ctxMod = null, detectMod = null, liftErr = null;
try {
  ctxMod = liftBlock(SRC, "// Proximity band for ranking", "// includeContacts (v27)",
    ["proximityBand", "geoLabel", "buildOfferingsContext", "buildTopicContext"]);
  detectMod = liftBlock(SRC, "const COLLEGE_ALIASES", "// ── Topic synonym expansion",
    ["detectAndFetchCollegeProfile", "COLLEGE_ALIASES"]);
} catch (e) { liftErr = e; }
check("geo + detection blocks lift out of index.ts cleanly", !liftErr && ctxMod && detectMod);

// Order of "## College Name" headings — this IS the retrieved set, in rank order.
const headings = (ctx) =>
  [...ctx.matchAll(/^## ([^—(\n]+?)\s*(?:\(|—)/gm)].map((m) => m[1].trim());
const idx = (ctx, college) => headings(ctx).indexOf(college);

// ── Fake PostgREST client ───────────────────────────────────────────────────
// Emulates just the chain detectAndFetchCollegeProfile uses. Every builder is
// awaitable, and `.limit()` slices AFTER `.order()` sorts — so a test can prove
// the code no longer depends on an arbitrary window.
function fakeSb(collegeNames, counter) {
  const rows = collegeNames.map((c) => ({ college: c, total_exhibits: 0, _full: true }));
  return {
    from() {
      const q = { rows: rows.slice(), ordered: false, limited: null };
      const api = {
        select() { return api; },
        eq(col, val) { q.rows = q.rows.filter((r) => r[col] === val); return api; },
        in(col, vals) { q.rows = q.rows.filter((r) => vals.includes(r[col])); return api; },
        ilike(col, pattern) {
          if (counter) counter.queries++;
          const needle = pattern.replace(/%/g, "").toLowerCase();
          q.rows = q.rows.filter((r) => r[col].toLowerCase().includes(needle));
          return api;
        },
        order() { q.ordered = true; q.rows.sort((a, b) => a.college.localeCompare(b.college)); return api; },
        limit(n) { q.limited = n; q.rows = q.rows.slice(0, n); return api; },
        single() { return { then: (res) => res({ data: q.rows[0] || null }) }; },
        then(res) { return res({ data: q.rows }); },
      };
      return api;
    },
  };
}

// The nine colleges whose names contain "angeles", plus the neighbours that make
// the ambiguity real. Verified against chatbox_college_profiles.
const LA_COLLEGES = [
  "East Los Angeles College", "Los Angeles City College", "Los Angeles Harbor College",
  "Los Angeles Mission College", "Los Angeles Pierce College", "Los Angeles Southwest College",
  "Los Angeles Trade Technical College", "Los Angeles Valley College", "West Los Angeles College",
  "Cerritos College", "El Camino College", "Long Beach City College", "Cypress College",
];

(async () => {
  if (ctxMod && detectMod) {
    // ── 1. Detection: the specific word must beat the ambiguous one ──────────
    const Q7 = "does los angeles harbor college give credit for nccer carpentry or construction certifications?";
    const counter = { queries: 0 };
    const hit = await detectMod.detectAndFetchCollegeProfile(Q7, fakeSb(LA_COLLEGES, counter));

    check("mode 7 resolves a SINGLE home college (not an ambiguous array)",
      hit && !Array.isArray(hit));
    check("mode 7 resolves it to Los Angeles Harbor College",
      hit && hit.college === "Los Angeles Harbor College");

    // The old code returned on "angeles" (9 matches) and never reached "harbor"
    // (1 match). Proving we now consult every candidate word, not just the first.
    check("detection consults more than one candidate word", counter.queries > 1);

    // Determinism: the live defect was an unordered LIMIT window, so identical
    // calls disagreed. Same input must give the same answer, every time.
    const repeats = [];
    for (let i = 0; i < 5; i++) {
      const r = await detectMod.detectAndFetchCollegeProfile(Q7, fakeSb(LA_COLLEGES));
      repeats.push(r && !Array.isArray(r) ? r.college : "AMBIGUOUS");
    }
    check("detection is deterministic across repeated identical calls",
      new Set(repeats).size === 1 && repeats[0] === "Los Angeles Harbor College");

    // Source-level guards on the two properties a fixture cannot show.
    // Comments are stripped first — this block DESCRIBES the old `.limit(3)` in
    // prose, and an un-stripped regex happily matched the description instead of
    // the code (which is its own small lesson about source-level assertions).
    const detectSrc = SRC
      .slice(SRC.indexOf("async function detectAndFetchCollegeProfile"),
             SRC.indexOf("// ── Topic synonym expansion"))
      .split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
    check("the ilike lookup is ORDERED (no arbitrary LIMIT window)",
      /\.order\("college"\)/.test(detectSrc));
    const limits = [...detectSrc.matchAll(/\.limit\((\d+)\)/g)].map((m) => Number(m[1]));
    check("the ilike limit is wider than the 9 'angeles' matches",
      limits.length > 0 && limits.every((n) => n > 9));

    // ── 2. Detection: genuine ambiguity still yields an ARRAY ────────────────
    // The caller narrows these by topic hits (the West-LA real-estate path), so
    // collapsing them to one college here would resurrect that bug.
    const ambiguous = await detectMod.detectAndFetchCollegeProfile(
      "what about angeles colleges", fakeSb(LA_COLLEGES));
    check("a genuinely ambiguous query still returns an ARRAY for the caller",
      Array.isArray(ambiguous) && ambiguous.length > 1);

    // ── 3. Detection: trailing punctuation no longer kills the lookup ────────
    // `%cerritos.%` matched nothing; the word is stripped to `cerritos` first.
    const punct = await detectMod.detectAndFetchCollegeProfile(
      "tell me about cerritos.", fakeSb(LA_COLLEGES));
    check("a trailing period does not break college detection",
      punct && !Array.isArray(punct) && punct.college === "Cerritos College");

    // ── 4. proximityBand semantics ───────────────────────────────────────────
    const LA = { county: "Los Angeles", region: "Los Angeles" };
    const pb = ctxMod.proximityBand;
    check("same county scores above same region",
      pb({ county: "Los Angeles", region: "Los Angeles" }, LA) >
      pb({ county: "Orange", region: "Los Angeles" }, LA));
    check("a different county+region scores 0",
      pb({ county: "Riverside", region: "Inland Empire" }, LA) === 0);
    check("no home college => every band is 0 (ordering unchanged)",
      pb({ county: "Los Angeles", region: "Los Angeles" }, null) === 0);
    check("an ungeocoded college scores 0 rather than throwing",
      pb(null, LA) === 0);
    check("geoLabel renders county + region",
      ctxMod.geoLabel({ county: "Orange", region: "Orange County" }) === " (Orange County, Orange County)" ||
      ctxMod.geoLabel({ county: "Orange", region: "Orange County" }).includes("Orange County"));
    check("geoLabel on an ungeocoded college is empty", ctxMod.geoLabel(null) === "");

    // ── 5. Exhibit list: Fullerton/CPR — the 7-mile college beats the 300-mile one
    // Live rows, 2026-08-07: search_exhibits_by_topic_v2 for the CPR family.
    const cprRows = [
      ...Array.from({ length: 12 }, (_, i) => ({ college: "Modesto Junior College", exhibit_title: `CPR exhibit ${i}`, rec_count: 1 })),
      { college: "Cabrillo College", exhibit_title: "First Aid", rec_count: 1 },
      { college: "City College of San Francisco", exhibit_title: "Adult CPR and Standard First Aid", rec_count: 1 },
      { college: "Cypress College", exhibit_title: "First Aid, CPR and Emergencies", rec_count: 1 },
      { college: "Las Positas College", exhibit_title: "First Aid, CPR and AED", rec_count: 1 },
    ];
    const geoMap = new Map([
      ["Modesto Junior College", { county: "Stanislaus", region: "San Joaquin Valley" }],
      ["Cabrillo College", { county: "Santa Cruz", region: "Central Coast" }],
      ["City College of San Francisco", { county: "San Francisco", region: "Bay Area" }],
      ["Cypress College", { county: "Orange", region: "Orange County" }],
      ["Las Positas College", { county: "Alameda", region: "Bay Area" }],
    ]);
    const fullertonGeo = { county: "Orange", region: "Orange County" };

    const nearCtx = ctxMod.buildTopicContext(cprRows, false, geoMap, fullertonGeo);
    check("Fullerton/CPR: Cypress (7 mi, same county) outranks Modesto (300 mi, 12 exhibits)",
      idx(nearCtx, "Cypress College") < idx(nearCtx, "Modesto Junior College"));
    check("Fullerton/CPR: the nearest college is listed FIRST",
      headings(nearCtx)[0] === "Cypress College");
    check("exhibit headings carry county/region so the model can say 'nearby'",
      /## Cypress College \(Orange County, Orange County\)/.test(nearCtx));
    check("the exhibit list announces its nearest-first ordering",
      /LOCAL EXHIBITS by college \(nearest first\)/.test(nearCtx));

    // No home college => byte-for-byte the previous behaviour: volume first.
    const volCtx = ctxMod.buildTopicContext(cprRows, false, geoMap, null);
    check("no home college: exhibit ordering stays volume-first (Modesto leads)",
      headings(volCtx)[0] === "Modesto Junior College");
    check("no home college: no nearest-first claim is made",
      !/nearest first/.test(volCtx));
    const noGeoCtx = ctxMod.buildTopicContext(cprRows, false, null, null);
    check("with no geo map at all the builder still works (pre-v30 call shape)",
      headings(noGeoCtx)[0] === "Modesto Junior College");

    // ── 5b. The case a REVIEWER reported, 2026-07-03 ─────────────────────────
    // sierra_feedback, thumbs-up-with-a-caveat on "can I get cpl at Crafton Hills
    // college for my firefighter 1 cert?":
    //
    //   "Good answer, but could be improved. Moreno Valley College is closer to
    //    Crafton than Bako and should have been mentioned"
    //
    // A human found this defect five weeks before the smoke battery did, and the
    // note sat at status='new' the whole time. Crafton Hills is San Bernardino /
    // Inland Empire; Bakersfield is Kern / San Joaquin Valley with 9 exhibits;
    // Moreno Valley is Riverside / Inland Empire with 2. Volume ordering put
    // Bakersfield fourth and Moreno Valley nowhere. Live rows, 2026-08-07.
    const fireRows = [
      ...Array.from({ length: 134 }, (_, i) => ({ college: "Modesto Junior College", exhibit_title: `Fire ${i}`, rec_count: 1 })),
      ...Array.from({ length: 9 }, (_, i) => ({ college: "Bakersfield College", exhibit_title: `Fire Tech ${i}`, rec_count: 1 })),
      ...Array.from({ length: 2 }, (_, i) => ({ college: "Moreno Valley College", exhibit_title: `Fire Academy ${i}`, rec_count: 1 })),
      ...Array.from({ length: 2 }, (_, i) => ({ college: "Chaffey College", exhibit_title: `Fire ${i}`, rec_count: 1 })),
    ];
    const fireGeo = new Map([
      ["Modesto Junior College", { county: "Stanislaus", region: "San Joaquin Valley" }],
      ["Bakersfield College", { county: "Kern", region: "San Joaquin Valley" }],
      ["Moreno Valley College", { county: "Riverside", region: "Inland Empire" }],
      ["Chaffey College", { county: "San Bernardino", region: "Inland Empire" }],
    ]);
    const craftonCtx = ctxMod.buildTopicContext(fireRows, false, fireGeo,
      { county: "San Bernardino", region: "Inland Empire" });
    check("Crafton/firefighter: Moreno Valley (same region) outranks Bakersfield (more exhibits, 200 mi)",
      idx(craftonCtx, "Moreno Valley College") < idx(craftonCtx, "Bakersfield College"));
    check("Crafton/firefighter: Chaffey (same COUNTY) leads — the college the reviewer did not spot",
      headings(craftonCtx)[0] === "Chaffey College");
    check("Crafton/firefighter: Modesto's 134 exhibits no longer lead a San Bernardino question",
      idx(craftonCtx, "Modesto Junior College") > idx(craftonCtx, "Moreno Valley College"));

    // ── 6. Offerings list: mode 7 — LA county beats a bigger, distant catalog ─
    // Live rows, 2026-08-07: search_college_offerings for the NCCER family.
    const off = (college, county, region, top_title, course_count) =>
      ({ college, county, region, top_title, top_code: "0952.00", course_count, cid_count: 0, sample_courses: [] });
    const offerings = [
      // American River leads the raw catalog on VOLUME by a wide margin — and is
      // in Sacramento. It is the control: it must not win an LA question.
      off("American River College", "Sacramento", "Greater Sacramento", "Carpentry", 223),
      off("Los Angeles Trade Technical College", "Los Angeles", "Los Angeles", "Carpentry", 131),
      off("Rio Hondo College", "Los Angeles", "Los Angeles", "Carpentry", 131),
      off("Norco College", "Riverside", "Inland Empire", "Construction Crafts Technology", 110),
      off("Santiago Canyon College", "Orange", "Orange County", "Carpentry", 91),
      off("Cerritos College", "Los Angeles", "Los Angeles", "Welding Technology", 76),
      off("Long Beach City College", "Los Angeles", "Los Angeles", "Carpentry", 51),
      off("El Camino College", "Los Angeles", "Los Angeles", "Carpentry", 49),
    ];
    const coreKeywords = ["los", "angeles", "harbor", "nccer", "carpentry", "construction",
      "welding", "electrician", "plumbing", "carpenter", "woodworking"];
    const harborGeo = { county: "Los Angeles", region: "Los Angeles" };
    const offCtx = ctxMod.buildOfferingsContext(
      offerings, "Los Angeles Harbor College", harborGeo, coreKeywords, geoMap);

    const LA_COUNTY = ["Los Angeles Trade Technical College", "Rio Hondo College",
      "Cerritos College", "Long Beach City College", "El Camino College"];
    check("mode 7: every LA-county college outranks Norco (~50 mi)",
      LA_COUNTY.every((c) => idx(offCtx, c) > -1 && idx(offCtx, c) < idx(offCtx, "Norco College")));
    check("mode 7: every LA-county college outranks American River (223 courses, Sacramento)",
      LA_COUNTY.every((c) => idx(offCtx, c) < idx(offCtx, "American River College")));
    check("mode 7: the smoke-asserted neighbours are all present",
      ["El Camino College", "Long Beach City College", "Los Angeles Trade Technical College",
        "Rio Hondo College", "Cerritos College"].every((c) => offCtx.includes(c)));

    // The knife-edge that made volume competitive with geography: the old bands
    // were core 200 / county 100 / region 40 against a volume term of
    // min(courses, 39). A distant college with 39+ courses scored 239; a
    // same-region college with none scored 240. One point is a coin flip.
    const knife = ctxMod.buildOfferingsContext([
      off("Distant Big College", "Far", "Far Region", "Carpentry", 400),
      off("Nearby Small College", "Other", "Los Angeles", "Carpentry", 1),
    ], "Los Angeles Harbor College", harborGeo, coreKeywords, null);
    check("a same-REGION college with 1 course still outranks a distant one with 400",
      idx(knife, "Nearby Small College") < idx(knife, "Distant Big College"));

    // Teaching the core discipline still outranks mere proximity — pointing a
    // student at a neighbour that does not teach the subject helps nobody.
    const coreVsNear = ctxMod.buildOfferingsContext([
      off("Nearby Unrelated College", "Los Angeles", "Los Angeles", "Philosophy", 30),
      off("Distant Carpentry College", "Far", "Far Region", "Carpentry", 30),
    ], "Los Angeles Harbor College", harborGeo, coreKeywords, null);
    check("teaching the CORE discipline still outranks proximity",
      idx(coreVsNear, "Distant Carpentry College") < idx(coreVsNear, "Nearby Unrelated College"));

    // ── 6b. Mode 7 part 3: the CONTEXT, built from the REAL 150-row window ───
    // The two prior handoffs left one thing explicitly unmeasured: whether
    // buildOfferingsContext's `others` list was populated at all for mode 7's
    // query. Two candidate causes needed OPPOSITE fixes — retrieval thinning
    // (no prompt wording could fix it) vs the model not following the rule —
    // and guessing between them is the mistake this workstream keeps repeating.
    //
    // Measured 2026-08-07 against the live RPC with the EXACT tsquery the
    // deployed function builds for mode 7 (see the fixture header): 613 rows
    // across 117 colleges match, the RPC caps at 150, and the window contains
    // Los Angeles Trade Technical at rank 2 and Rio Hondo at 6. Retrieval is
    // NOT the cause. The whole of part 3's answer was in the context.
    //
    // These assertions run on that committed window, so if a future keyword,
    // synonym, cap or ranking change starts thinning the LA colleges out, this
    // goes red at the retrieval layer instead of surfacing as model flake.
    const mode7Rows = fs.readFileSync("tests/fixtures/offerings_mode7_2026-08-07.tsv", "utf8")
      .split("\n").filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const [college, top_title, course_count, cid_count, region, county] = l.split("\t");
        return { college, top_title, top_code: "", course_count: +course_count,
                 cid_count: +cid_count, region, county, sample_courses: [] };
      });
    check("mode 7 fixture is the full 150-row RPC window", mode7Rows.length === 150);
    // The fixture is a snapshot of a CAPPED window. Cerritos sits at rank 71 and
    // Compton at 111, so a smaller cap silently drops them out of part 3 — and
    // the snapshot would keep passing while production regressed. Tie the two.
    check("the offerings cap is still the 150 this window was measured at",
      /result_limit: 150/.test(SRC));

    // Core keywords come from the REAL query through the REAL keyword pipeline,
    // not a hand-written list — a stop-word edit that dropped "carpentry" or
    // "construction" would otherwise pass this test while breaking production.
    const kwMod = liftBlock(SRC, "const TOPIC_SYNONYMS", "// ── Topic-based exhibit search",
      ["extractTopicKeywords", "expandWithSynonyms"]);
    const Q7_FULL = "Does Los Angeles Harbor College give credit for NCCER carpentry or construction certifications?";
    const q7Core = kwMod.expandWithSynonyms(kwMod.extractTopicKeywords(Q7_FULL));
    check("mode 7's keywords still carry the discipline itself",
      ["carpentry", "construction", "welding"].every((k) => q7Core.includes(k)));

    const m7 = ctxMod.buildOfferingsContext(
      mode7Rows, "Los Angeles Harbor College", harborGeo, q7Core, null);
    const m7Heads = headings(m7);

    // LA Harbor teaches none of this — so the branch that fires is the one that
    // explicitly hands the model part 3. If this line stops being emitted, the
    // rule in OFFERINGS_RULE is the ONLY thing left asking for part 3.
    check("mode 7: LA Harbor is absent from the offerings window",
      !mode7Rows.some((r) => r.college === "Los Angeles Harbor College"));
    check("mode 7: the context tells the model to point at the nearest teaching colleges",
      /Los Angeles Harbor College does NOT appear to teach[\s\S]*point to the nearest colleges that do/.test(m7));

    // Part 3's answer WAS in the context, and every college offered was local.
    check("mode 7: the offerings list is populated (10 colleges printed)",
      m7Heads.length === 10);
    const laCounty = new Set(mode7Rows.filter((r) => r.county === "Los Angeles").map((r) => r.college));
    check("mode 7: every printed college is in LA Harbor's own county",
      m7Heads.every((h) => laCounty.has(h)));

    // The exact colleges smoke mode 7 greps for — all six are in the printed set.
    check("mode 7: every college the smoke assertion accepts is in the context",
      ["Los Angeles Trade Technical College", "Rio Hondo College", "Long Beach City College",
        "El Camino College", "Cerritos College", "Compton College"]
        .every((c) => m7Heads.includes(c)));

    // Provenance: the roll-up totals the LIVE function quoted back on 2026-08-07
    // (smoke run 49, deploy 12 / v35) are these numbers, which only exist after
    // buildOfferingsContext sums a college's TOP programs. The answer came from
    // this list, not from the model's own knowledge of LA colleges.
    check("mode 7: the course totals Sierra quoted live are the ones this builder computes",
      /Los Angeles Trade Technical College[^\n]*teaches 131 course/.test(m7) &&
      /Long Beach City College[^\n]*teaches 51 course/.test(m7) &&
      /El Camino College[^\n]*teaches 49 course/.test(m7) &&
      /Cerritos College[^\n]*teaches 76 course/.test(m7));

    // WHY PROXIMITY IS THE ONLY THING DOING WORK HERE. Every row in this window
    // is a construction / carpentry / welding / plumbing TOP program, so the
    // core term scores 1000 for EVERY college and discriminates nothing. The
    // volume term saturates at min(courses, 39), which every serious trades
    // catalog clears — so within a band the order is just the RPC's ts_rank
    // order. Strip the proximity band and the LA question is answered with
    // Oakland, Sacramento, San Diego and Riverside.
    const isCore = (t) => q7Core.some((k) => k.length >= 4 && t.toLowerCase().includes(k));
    check("mode 7: `core` does no discriminating work — every returned row is core",
      mode7Rows.every((r) => isCore(r.top_title)));
    const m7NoGeo = headings(
      ctxMod.buildOfferingsContext(mode7Rows, "Los Angeles Harbor College", null, q7Core, null));
    check("mode 7: without the proximity band, most of the offered list leaves LA County",
      m7NoGeo.filter((h) => laCounty.has(h)).length <= 4);
    check("mode 7: without it, the 223-course Sacramento catalog is offered to an LA visitor",
      m7NoGeo.includes("American River College"));
    check("mode 7: with it, that Sacramento catalog is not offered at all",
      !m7Heads.includes("American River College"));

    // ── 7. The geo map fills in rows the RPC left ungeocoded ─────────────────
    const ungeocoded = ctxMod.buildOfferingsContext([
      off("Norco College", null, null, "Carpentry", 110),
      off("El Camino College", null, null, "Carpentry", 49),
    ], "Los Angeles Harbor College", harborGeo, coreKeywords,
      new Map([
        ["Norco College", { county: "Riverside", region: "Inland Empire" }],
        ["El Camino College", { county: "Los Angeles", region: "Los Angeles" }],
      ]));
    check("geoMap supplies county/region when the offerings row has none",
      idx(ungeocoded, "El Camino College") < idx(ungeocoded, "Norco College"));

    // ── 8. Call-site wiring ──────────────────────────────────────────────────
    check("the geo map is fetched once, in the main parallel batch",
      /fetchCollegeGeoMap\(sb\),/.test(SRC));
    check("askedGeo is derived from the resolved home college",
      /const askedGeo = singleProfile \? geoMap\.get\(singleProfile\.college\)/.test(SRC));
    check("the exhibit list receives the geo map when a home college is known",
      /buildTopicContext\(topicResults, false, geoMap, askedGeo\)/.test(SRC));
    check("the offerings list receives the same geo map",
      /buildOfferingsContext\(offeringsResults, askedCollege, askedGeo, coreKeywords, geoMap\)/.test(SRC));
    check("the per-question single-row geo lookup is gone",
      !/fetchCollegeGeo\(/.test(SRC.replace(/fetchCollegeGeoMap\(/g, "")));
  }

  // ── Report ────────────────────────────────────────────────────────────────
  let failed = 0;
  for (const [name, ok] of results) {
    if (!ok) failed++;
    console.log(`${ok ? "  ok  " : "FAIL  "} ${name}`);
  }
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  if (liftErr) console.log(`lift error: ${liftErr.message}`);
  process.exit(failed ? 1 : 0);
})();
