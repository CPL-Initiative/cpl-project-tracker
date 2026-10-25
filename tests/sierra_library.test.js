// Sierra reads the public CPL Library (cpl-chat's LIBRARY BLOCK, S469).
//
// Sam, 2026-10-20, approving the public library: "It would be great if Sierra could access
// the info in the public library... present links to appropriate library artifacts." On
// 2026-10-24 he asked Ask Sierra "What is one step I can take to create CPL for the ELL IET
// grantees?" and she answered with general steps, never naming ELL IET CPL Starting Points,
// a piece made for those grantees and listed on the public library: nothing in cpl-chat read
// the library. "Can you make sure she's wired to grab that info?"
//
// This lifts the real block out of index.ts (tests/lib/lift_ts.js) and holds:
//   (1) his question finds the ELL IET piece, and only it, among the pieces listed that day;
//   (2) a college's piece is found through the college the detection resolved, never by a
//       word: "Sierra" in a question is her name, not Sierra College;
//   (3) words every piece shares never match on their own, and a question with nothing to
//       do with a piece finds none;
//   (4) only the CPL Initiative's own pages under the tracker's library/ are read;
//   (5) a page's reading text is the piece, without its scripts, styles and header links;
//   (6) the block: the link, the page's text within a budget, the rule, nothing when nothing
//       fits, and the whole list when the visitor asks about the library;
//   (7) the handler: the read rides the main Promise.all, drafting surfaces skip it, the
//       block lands in the volatile half of the prompt (never the cached half) and is logged.
// Run from repo root: `node tests/sierra_library.test.js`.
const fs = require("fs");
const path = require("path");
const { liftBlock } = require("./lib/lift_ts");

const ROOT = path.join(__dirname, "..");
const FN = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const PAGES = "https://cpl-initiative.github.io/cpl-project-tracker/";
// The pieces cpl_library_public() listed on 2026-10-25 (S469's read), the two artifacts at
// their Pages addresses (Sam, 2026-10-25: "GitHub Pages now").
const college = (name, made) => ({ slug: "cpl-opportunity-" + name.toLowerCase().replace(/ college$/, "").replace(/[^a-z]+/g, "-") + "-visual",
  title: name + ": CPL Opportunity Analysis", kind: "visual", occasion: "CPL college workgroup meeting, 2026-10-21", made_on: made,
  summary: name + "'s COCI programs and courses, its MAP exhibits (AP and IB excluded), and the statewide credit recommendations it could adopt, each with a Could Adopt link to MAP.",
  topics: [], url: PAGES + "cpl-opportunity/?college=" + encodeURIComponent(name), for_kind: "college", for_category: null, for_name: name });
const PIECES = [
  { slug: "ell-iet-cpl-starting-points", title: "ELL IET CPL Starting Points", kind: "visual", occasion: "Prepare to meet with grant recipients on CPL",
    made_on: "2026-10-23", summary: "A card per ELL IET Fund project (EDD, PY 2022-23: eight grantees, $17.97 million), ordered by fit: where a project's completers could already turn their training into community college credit, read from the MAP platform and COCI.",
    topics: [], url: PAGES + "library/ell-iet-cpl-starting-points/", for_kind: "agency", for_category: null, for_name: "EDD ELL IET Fund grantees" },
  ...["Riverside City College", "Bakersfield College", "Cerritos College", "Foothill College", "Moreno Valley College", "Norco College",
      "Rio Hondo College", "San Bernardino Valley College", "San Joaquin Delta College", "Santiago Canyon College", "Sierra College",
      "American River College"].map((n) => college(n, "2026-10-21")),
  { slug: "dsp-credit-starting-points", title: "DSP Credit Starting Points", kind: "visual", occasion: "DDS, Aging and LWDA meeting on DSP Training",
    made_on: "2026-10-20", summary: "Preliminary scan of CCC courses and programs that could award CPL for California's Direct Support Professional Training: Taft and Porterville first, then Pasadena City, West Valley and short medication courses, and a wider ring.",
    topics: [], url: PAGES + "library/dsp-credit-starting-points/", for_kind: "agency", for_category: null, for_name: "DDS, Aging and LWDA" },
  { slug: "ironworker-pathway-in-motion", title: "Ironworker Pathway in Motion", kind: "film", occasion: "Cerritos College ironworker pathway",
    made_on: "2026-10-04", summary: "1:41 music cut. High school to a bachelor's degree, with CPL at each step.", topics: [],
    url: "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4",
    for_kind: null, for_category: null, for_name: null },
];

let L = null;
try {
  L = liftBlock(FN, "// ── LIBRARY BLOCK START", "// ── LIBRARY BLOCK END",
    ["matchLibrary", "buildLibraryContext", "libraryPageText", "libraryHosted", "libraryAsk", "LIBRARY_RULE", "LIBRARY_PAGE",
     "LIBRARY_TEXT_MAX", "LIBRARY_TEXT_TOTAL", "LIBRARY_MAX_PIECES"]);
} catch (e) { check("(0) the library block lifts out of index.ts — " + e.message, false); }
check("(0) the library block lifts out of index.ts", !!L && typeof L.matchLibrary === "function");
if (!L) finish();

const slugs = (q, colleges) => L.matchLibrary(q, PIECES, colleges || []).map((p) => p.slug);

// (1) Sam's question.
{
  const got = slugs("What is one step I can take to create CPL for the ELL IET grantees?");
  check("(1) ⭐ Sam's question finds ELL IET CPL Starting Points, and only it", got.join() === "ell-iet-cpl-starting-points", JSON.stringify(got));
  check("(1) so do its other names: the grantees, the fund, the agency",
    slugs("Which ELL IET Fund grantees could award credit?")[0] === "ell-iet-cpl-starting-points" &&
    slugs("Can EDD grantees training English learners get college credit?")[0] === "ell-iet-cpl-starting-points");
  check("(1) the DSP piece answers to its training's name, by two words of its summary",
    slugs("Is there credit for direct support professional training?").join() === "dsp-credit-starting-points" &&
    slugs("DSP training credit").join() === "dsp-credit-starting-points");
  check("(1) the film answers to its trade", slugs("credit for ironworker apprentices").join() === "ironworker-pathway-in-motion");
}

// (2) A college's piece, by the college the detection resolved.
{
  check("(2) ⭐ a college's piece is found through the resolved college",
    slugs("What CPL could Riverside City College offer?", ["Riverside City College"]).join() === "cpl-opportunity-riverside-city-visual");
  check("(2) ⭐ the college's own name in the question finds nothing without the detection (one matcher, not two)",
    slugs("What CPL could Riverside City College offer?").length === 0);
  check("(2) ⭐ 'Sierra' is her name: a question to her finds no Sierra College piece",
    slugs("Sierra, how do I get credit for my military training?").length === 0 &&
    slugs("What does Sierra College offer?", ["Sierra College"]).join() === "cpl-opportunity-sierra-visual");
  check("(2) a district's colleges find each college's piece, three at most",
    slugs("RCCD", ["Riverside City College", "Moreno Valley College", "Norco College"]).length === 3 && L.LIBRARY_MAX_PIECES === 3 &&
    slugs("five colleges", ["Riverside City College", "Moreno Valley College", "Norco College", "Cerritos College", "Foothill College"]).length === 3);
}

// (3) Words every piece shares say nothing.
{
  check("(3) ⭐ 'CPL', 'credit', 'starting points' and 'college' match nothing on their own",
    slugs("What are the CPL starting points for credit at a college?").length === 0);
  check("(3) a question about something no piece covers finds none",
    slugs("How do I get credit for my CNA license?").length === 0 && slugs("What is the MAP platform?").length === 0);
  const wordy = { ...PIECES[13], slug: "wordy", summary: "The steps to start and create credit, and how to build each one now." };
  check("(3) a question's own words (step, start, create, build) never match a summary that uses them",
    L.matchLibrary("What steps can I take to start and create and build credit now?", [wordy], []).length === 0);
  check("(3) a piece with no link is never offered", L.matchLibrary("ELL IET", [{ ...PIECES[0], url: "" }], []).length === 0);
}

// (4) Which pages are read.
{
  check("(4) ⭐ the CPL Initiative's pages under the tracker's library/ are read",
    L.libraryHosted(PAGES + "library/ell-iet-cpl-starting-points/") && L.libraryHosted(PAGES + "library/dsp-credit-starting-points"));
  check("(4) nothing else is: a claude.ai page, an opportunity page, the library page itself, a look-alike host, a query",
    !L.libraryHosted("https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe") && !L.libraryHosted(PAGES + "cpl-opportunity/?college=Norco") &&
    !L.libraryHosted(PAGES + "library/") && !L.libraryHosted("https://cpl-initiative.github.io.evil.example/cpl-project-tracker/library/x/") &&
    !L.libraryHosted(PAGES + "library/x/?q=1") && !L.libraryHosted(PAGES + "library/../fact-sheet/"));
}

// (5) A page's reading text.
{
  const html = fs.readFileSync(path.join(ROOT, "library/ell-iet-cpl-starting-points/index.html"), "utf8");
  const text = L.libraryPageText(html);
  check("(5) ⭐ the ELL IET page's text carries its title, its projects and colleges, and its practical next steps, whole",
    /Fresno Area Workforce Investment Corporation/.test(text) && /Credit already articulated in MAP at Fresno City College/.test(text) &&
    /Where credit for ELL IET training could start/.test(text) && /Practical next steps\nSend each project the card above/.test(text) &&
    /This is a preliminary scan, not an articulation\./.test(text) && text.indexOf(" …") < 0);
  check("(5) without its head, styles, scripts or the public header: its links, its logo and its theme words",
    !/<|\{|localStorage|Find your college|data:image/.test(text) && !/cplh/.test(text) && !/^Theme$|^Light$|^Dark$|Light Dark/m.test(text));
  check("(5) entities become characters", /EDD's ELL IET Fund grantees/.test(text) && !/&#x27;|&amp;/.test(text));
  const long = L.libraryPageText("<p>START " + "a ".repeat(30000) + "</p><p>Practical next steps END</p>");
  check("(5) a longer page is capped by losing its middle: its opening and its next steps stay",
    long.length <= L.LIBRARY_TEXT_MAX + 4 && /^START/.test(long) && /Practical next steps END$/.test(long) && / …\n/.test(long));
}

// (6) The block.
{
  const ell = PIECES[0];
  const page = "Fresno Area Workforce Investment Corporation · Construction trades: credit already articulated at Fresno City College";
  const out = L.buildLibraryContext([ell], new Map([[ell.url, page]]), null);
  check("(6) ⭐ the block names the piece with its link and carries what the page says",
    /--- CPL LIBRARY: PUBLISHED PIECES THAT FIT THIS QUESTION/.test(out) && out.indexOf('"ELL IET CPL Starting Points"') > 0 &&
    out.indexOf("Link: " + ell.url) > 0 && out.indexOf(page) > 0 && /made for EDD ELL IET Fund grantees|for EDD ELL IET Fund grantees/.test(out));
  check("(6) ⭐ the rule rides with it: link the piece first, answer from its text, add nothing",
    out.indexOf(L.LIBRARY_RULE) > 0 && /first paragraph as a markdown link/.test(L.LIBRARY_RULE) &&
    /answer from it/.test(L.LIBRARY_RULE) && /add nothing to what it says/.test(L.LIBRARY_RULE) && /preliminary scan/.test(L.LIBRARY_RULE));
  check("(6) nothing fits, no block", L.buildLibraryContext([], null, null) === "" && L.buildLibraryContext([], new Map(), []) === "");
  const all = L.buildLibraryContext([], null, PIECES);
  check("(6) asked about the library, the block lists every piece with its link",
    PIECES.every((p) => all.indexOf(p.url) > 0) && L.libraryAsk("What is in the CPL Library?") && L.libraryAsk("library") && !L.libraryAsk("libraries of credit"));
  const big = "x".repeat(L.LIBRARY_TEXT_TOTAL);
  const two = L.buildLibraryContext([ell, PIECES[13]], new Map([[ell.url, big], [PIECES[13].url, big]]), null);
  check("(6) two long pages share one budget", two.length < L.LIBRARY_TEXT_TOTAL + 4000 && two.indexOf(PIECES[13].url) > 0);
  check("(6) house words: no business register and no 'leverage' in the rule", !/leverage|utilize|robust|deep dive/i.test(L.LIBRARY_RULE));
}

// (7) The handler.
{
  const all = FN.match(/const \[searchResult, collegeProfile[^\]]*\] = await Promise\.all\(\[([\s\S]*?)\]\);/);
  check("(7) ⭐ the library read rides the main Promise.all, last, and drafting surfaces skip it",
    !!all && /libraryRows\] = await Promise\.all/.test(FN) && /drafting \? Promise\.resolve\(\[\]\) : fetchLibrary\(sb\)/.test(all[1]));
  check("(7) the match uses the colleges the detection resolved, and the question with its prior turn",
    /matchLibrary\(searchText, libraryRows \|\| \[\], libraryColleges\)/.test(FN) && /const libraryColleges = \(Array\.isArray\(resolvedProfile\)/.test(FN));
  const vol = (FN.match(/const volatilePart = `([\s\S]*?)`;/) || [])[1] || "";
  const stable = (FN.match(/const stable = `([\s\S]*?)`;/) || [])[1] || "";
  check("(7) ⭐ the block lands in the volatile half, never the cached one",
    /\$\{libraryContext\}/.test(vol) && !/libraryContext/.test(stable) && /statewideCatalogContext, libraryContext\);/.test(FN));
  check("(7) the timing log records which pieces an answer was given",
    /library: \{\s*pieces: libraryMatched\.map\(\(p: any\) => p\.slug\)/.test(FN));
  check("(7) the read is cached and fails soft", /const LIBRARY_TTL_MS = 10 \* 60 \* 1000;/.test(FN) &&
    /return libraryCache \? libraryCache\.rows : \[\];/.test(FN) && /AbortSignal\.timeout\(4000\)/.test(FN));
}

finish();
function finish() {
  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\nsierra_library.test.js: ${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
}
