// Sierra's statewide catalog block (S398, 2026-10-16).
//
// Sam's Training rule of 2026-10-15: asked for "a complete list of statewide exhibit
// titles categorized by sector", Sierra's first response is a table of every title
// with its total units, and the CPL Fact Sheet arrives as a link. Asked exactly that
// three times on the public page, she said each time that she did not have the full
// list, and quoted 114 exhibits and 949 recommendations from an April vault note. The
// Fact Sheet counted 164 exhibits that day.
//
// This lifts the real block out of index.ts (tests/lib/lift_ts.js) and runs it against
// the committed catalog file, and it holds that file to the Fact Sheet's own outputs
// (fact_sheet_metrics.json, fact-sheet/statewide_recs.js, statewide_data.js), the way
// tests/roep_display_test.py holds a page and Sierra to one build. The inputs are
// rebuilt every morning; the daily run rebuilds the catalog in the same commit, so the
// outputs agree with each other on main whatever MAP did overnight.
//
// Sections: (0) lift, (1) which questions ask for the catalog, (2) the file agrees with
// the Fact Sheet, (3) the whole-catalog block, (4) a named program area, (5) a failed
// read, (6) the rule's words, (7) the handler's wiring, (8) the daily run and the
// generated-file check, (9) the builder's own test.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { liftBlock } = require("./lib/lift_ts");

const ROOT = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const FN = read("chatbox/supabase/functions/cpl-chat/index.ts");
const CATALOG = JSON.parse(read("fact-sheet/statewide_catalog.json"));
const METRICS = JSON.parse(read("fact_sheet_metrics.json"));
const FACT_SHEET_HTML = read("fact-sheet/index.html");
const LINK = "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/#statewide-exhibits";

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.stack || e), false); }
}
function windowVar(rel) {
  const s = read(rel);
  return JSON.parse(s.slice(s.indexOf("{")).trim().replace(/;\s*$/, ""));
}

let C = null, V = null;
block("(0) lift", () => {
  C = liftBlock(FN, "// ── STATEWIDE CATALOG BLOCK START", "// ── STATEWIDE CATALOG BLOCK END",
    ["statewideCatalogAsk", "statewideCatalogScope", "buildStatewideCatalogContext",
     "STATEWIDE_CATALOG_RULE", "STATEWIDE_FACT_SHEET_LINK", "CATALOG_SECTOR_LINES_MAX"]);
  V = liftBlock(FN, "const TOPIC_SYNONYMS", "// ── Topic-based exhibit search", ["extractTopicKeywords"]);
  check("(0) the catalog block and the keyword block lift out of index.ts",
    typeof C.statewideCatalogScope === "function" && typeof V.extractTopicKeywords === "function");
});
if (!C || !V) {
  for (const [name, ok, why] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !why ? "" : " — " + why}`);
  process.exit(1);
}

// What the handler does: the ask before retrieval, the scope after detection.
function scopeOf(q, opts) {
  opts = opts || {};
  const ask = C.statewideCatalogAsk(q);
  const cat = Object.prototype.hasOwnProperty.call(opts, "catalog") ? opts.catalog : CATALOG;
  return C.statewideCatalogScope(ask, q, V.extractTopicKeywords(q), cat, opts.own || [], !!opts.collegeNamed);
}
const kindOf = (s) => (s ? (s.kind === "all" ? "all" : s.sectors.join(" + ")) : "none");

// ── (1) Which questions ask for the catalog ──────────────────────────────────
block("(1) intent", () => {
  const whole = [
    // Sam's two questions, verbatim (surface public, 2026-10-15 20:41-20:52Z).
    "Give me a complete list of statewide exhibit titles categorized by sector",
    "Give me a complete list of statewide exhibit titles and their credit recommendations categorized by sector so I can see what I might adopt",
    "List all the statewide exhibits",
    "What are all the CCC Collaborative exhibits?",
    "Show me every statewide credit recommendation by program area",
    "Which statewide exhibits could my college adopt?",
    "What statewide exhibits are there?",
    "Can I get the full catalog of statewide CPL exhibits?",
    "statewide exhibits by sector",
    "How many statewide exhibits are there in each program area?",
    "What CCC Collaborative standards could we adopt?",
    "list of statewide faculty recommendations",
    "Give me all the statewide credit recommendations",
    "Can you give me a table of all statewide CRs with units?",
    "As a counselor, list every statewide exhibit",
  ];
  for (const q of whole) check(`(1) the whole catalog: "${q}"`, kindOf(scopeOf(q)) === "all", kindOf(scopeOf(q)));

  const areas = [
    ["List the statewide exhibits for welding", "Welding"],
    ["List all statewide exhibits for welders", "Welding"],
    ["What statewide fire exhibits are there?", "Fire Technology + Fire Technology - Wildland"],
    ["What statewide exhibits are in the construction sector?", "Construction Technology"],
    ["List every statewide real estate exhibit", "Real Estate"],
  ];
  for (const [q, want] of areas) check(`(1) one program area: "${q}"`, kindOf(scopeOf(q)) === want, kindOf(scopeOf(q)));

  const others = [
    // A single named credential: the credential routes answer these.
    "What is the statewide recommendation for POST Basic Academy?",
    "Is there a statewide credit recommendation for CompTIA A+?",
    "List all statewide credit recommendations for EMT",
    "What are the statewide credit recommendations for the POST academy?",
    "Give me the statewide recommendation for EMT",
    // …named with a list word and no "for": the exhibit's own title words decide it.
    "List the statewide POST Basic Academy credit recommendations",
    "Give me a complete list of the statewide CompTIA Security+ recommendations",
    // A college's record, which the catalog does not hold.
    "How many statewide exhibits has Chaffey adopted?",
    "Which statewide exhibit does Lassen host?",
    "Which colleges have adopted the statewide EMT exhibit?",
    // "Statewide" meaning systemwide, and no set asked for.
    "How many students statewide have received CPL?",
    "What are the statewide totals for applied credit?",
    "How is CPL going statewide?",
    "What is a statewide exhibit?",
    "Tell me about statewide credit recommendations",
    "Are all statewide exhibits free to adopt?",
    // A subject no statewide exhibit covers, and no statewide word at all.
    "Show me all statewide exhibits for nursing",
    "List the courses in the LVN program at Chaffey",
    "What CPL can I get for my CNA certification?",
    "What could Chaffey adopt?",
  ];
  for (const q of others) check(`(1) not the catalog: "${q}"`, scopeOf(q) === null, kindOf(scopeOf(q)));

  // A named college: its own adoption route answers "could adopt", and a list ask
  // still gets the list, with the college's words set aside.
  check("(1) \"What statewide exhibits could Chaffey adopt?\" with Chaffey detected goes to its adoption route",
    scopeOf("What statewide exhibits could Chaffey adopt?", { own: ["chaffey", "college"], collegeNamed: true }) === null);
  check("(1) \"How many statewide exhibits does Chaffey offer?\" with Chaffey detected is about Chaffey",
    scopeOf("How many statewide exhibits does Chaffey offer?", { own: ["chaffey", "college"], collegeNamed: true }) === null);
  check("(1) a complete list asked from Chaffey is still the whole catalog",
    kindOf(scopeOf("Give me a complete list of statewide exhibits Chaffey College could adopt",
      { own: ["chaffey", "college"], collegeNamed: true })) === "all");
  check("(1) a statewide word alone is not the ask", C.statewideCatalogAsk("statewide exhibits") === null);
  // No surface gate: a drafting caller that asks gets the block as evidence, and
  // DRAFTING_BLOCK, appended last, still governs its output (sierra_memory_isolation
  // counts every place the surface reaches; this is not one of them).
  check("(1) the ask is read from the retrieval text, with no surface gate",
    /const catalogAsk = statewideCatalogAsk\(routeText\);/.test(FN));
});

// ── (2) The catalog file agrees with the Fact Sheet's own outputs ────────────
block("(2) the file and the Fact Sheet", () => {
  const sw = METRICS.statewide_exhibits;
  const total = Number(String(sw.total).replace(/,/g, ""));
  check("(2) ⭐ the catalog's exhibit count equals the Fact Sheet's statewide count",
    CATALOG.exhibits === total && total > 0, `${CATALOG.exhibits} vs ${sw.total}`);
  const listed = CATALOG.sectors.reduce((n, s) => n + s.items.length, 0);
  check("(2) …and it lists that many exhibits", listed === total, `${listed} listed`);
  check("(2) the program areas come in the Fact Sheet's order",
    JSON.stringify(CATALOG.sectors.map((s) => s.sector)) === JSON.stringify(sw.by_sector.map((r) => r.sector)));
  const off = sw.by_sector.filter((r, i) => (CATALOG.sectors[i] || {}).exhibits !== r.exhibits
    || (CATALOG.sectors[i] || { items: [] }).items.length !== r.exhibits);
  check("(2) each program area holds the Fact Sheet's count of exhibits", off.length === 0,
    off.map((r) => r.sector).join(", "));
  check("(2) the named program areas match the Fact Sheet's KPI",
    CATALOG.program_areas === Number(String(sw.program_areas).replace(/,/g, "")));

  const data = windowVar("statewide_data.js");
  const ccc = new Set(data.exhibits.filter((e) => e.collaborative_type === "CCC Collaborative")
    .map((e) => (e.unified_title || e.title || "").trim()).filter(Boolean));
  const titles = CATALOG.sectors.flatMap((s) => s.items.map((i) => i.title));
  check("(2) the titles are statewide_data.js's CCC Collaborative exhibits, each once",
    titles.length === ccc.size && titles.every((t) => ccc.has(t)) && new Set(titles).size === titles.length,
    `${titles.length} titles, ${ccc.size} CCC exhibits`);
  check("(2) the build stamp is statewide_data.js's", CATALOG.source_generated_at === data.generated_at);

  const recs = windowVar("fact-sheet/statewide_recs.js");
  let lineMismatch = [], countMismatch = [];
  for (const s of CATALOG.sectors) for (const it of s.items) {
    const fsLines = recs[it.title] || [];
    if (it.recs !== fsLines.length || it.lines.length !== fsLines.length) countMismatch.push(it.title);
    else if (JSON.stringify(it.lines) !== JSON.stringify(fsLines.map((r) => ({ t: r.t, u: r.u, cid: r.cid })))) lineMismatch.push(it.title);
  }
  check("(2) each exhibit's count is its line count on the Fact Sheet", countMismatch.length === 0, countMismatch.slice(0, 5).join("; "));
  check("(2) …and its lines are the Fact Sheet's lines, as written", lineMismatch.length === 0, lineMismatch.slice(0, 5).join("; "));
  const without = CATALOG.sectors.flatMap((s) => s.items.filter((i) => i.recs === 0));
  check("(2) an exhibit with no line on the Fact Sheet has no total, never a zero",
    without.length === CATALOG.exhibits_without_lines && without.every((i) => i.units === null));
  check("(2) the line total is the Fact Sheet's", CATALOG.recs === Object.values(recs).reduce((n, v) => n + v.length, 0));

  // Recompute every total from the Fact Sheet's own lines (one build, two readers: the
  // figure must recompute from the page's data).
  const span = (ln) => {
    if (ln.u) { const p = String(ln.u).split(/\s*[-–]\s*/).map(Number); return [Math.min(...p), Math.max(...p)]; }
    const m = /^\s*(\d+(?:\.\d+)?)\s*(?:-|–|—|or|to)\s*(\d+(?:\.\d+)?)\s*(?:semester\s+)?(?:hours?|units?)\b/i.exec(ln.t)
      || /^\s*(\d+(?:\.\d+)?)()\s*(?:semester\s+)?(?:hours?|units?)\b/i.exec(ln.t);
    if (!m) return null;
    const a = Number(m[1]), b = m[2] === "" ? a : Number(m[2]);
    return [Math.min(a, b), Math.max(a, b)];
  };
  const fmt = (v) => String(Math.round(v * 100) / 100);
  const bad = [];
  for (const s of CATALOG.sectors) for (const it of s.items) {
    if (!it.lines.length) continue;
    let lo = 0, hi = 0;
    for (const ln of it.lines) { const sp = span(ln); if (sp) { lo += sp[0]; hi += sp[1]; } }
    const want = Math.abs(lo - hi) < 1e-9 ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`;
    if (want !== it.units) bad.push(`${it.title}: ${it.units} vs ${want}`);
  }
  check("(2) ⭐ every total recomputes from the Fact Sheet's lines", bad.length === 0, bad.slice(0, 5).join("; "));
});

// ── (3) The whole-catalog block ──────────────────────────────────────────────
let ALL = "";
block("(3) the whole catalog", () => {
  ALL = C.buildStatewideCatalogContext(CATALOG, { kind: "all" });
  const body = ALL.slice(0, ALL.indexOf("HOW TO ANSWER FROM THE STATEWIDE EXHIBIT CATALOG"));
  const rows = body.split("\n").filter((l) => /^- .+ \| .+ \| \d+$/.test(l));
  const total = Number(String(METRICS.statewide_exhibits.total).replace(/,/g, ""));
  check("(3) ⭐ one row per exhibit, as many rows as the Fact Sheet counts", rows.length === total,
    `${rows.length} rows vs ${total}`);
  const titles = CATALOG.sectors.flatMap((s) => s.items.map((i) => i.title));
  check("(3) every title appears, in the catalog's order",
    JSON.stringify(rows.map((r) => r.slice(2, r.indexOf(" | ")))) === JSON.stringify(titles));
  const heads = body.split("\n").filter((l) => l.startsWith("Program area — "));
  check("(3) a heading per program area, in the Fact Sheet's order, with its count",
    JSON.stringify(heads) === JSON.stringify(METRICS.statewide_exhibits.by_sector.map((r) =>
      `Program area — ${r.sector} (${r.exhibits} exhibit${r.exhibits === 1 ? "" : "s"})`)), heads.join(" / "));
  // Rows are checked against the file, never against figures typed here: the data
  // moves every morning, and (2) already holds the file to the Fact Sheet.
  const items = CATALOG.sectors.flatMap((s) => s.items);
  const rowOf = (it) => `- ${it.title} | ${it.units ? it.units : "lines not yet published"} | ${it.recs}`;
  const mismatched = items.filter((it) => !rows.includes(rowOf(it)));
  check("(3) every row carries its exhibit's title, total units and count, as the file holds them",
    mismatched.length === 0, mismatched.slice(0, 3).map(rowOf).join("; "));
  const ranged = items.find((it) => /–/.test(String(it.units || "")));
  check("(3) a range stays a range in its row", !!ranged && rows.includes(rowOf(ranged)), ranged && rowOf(ranged));
  check("(3) an exhibit with no line says so, never zero units",
    rows.filter((r) => / \| lines not yet published \| 0$/.test(r)).length === CATALOG.exhibits_without_lines
    && !rows.some((r) => / \| 0 \| /.test(r)));
  check("(3) ⭐ the Fact Sheet arrives as a link, to its statewide section", ALL.includes(`CPL Fact Sheet, statewide exhibits: ${LINK}`));
  check("(3) that anchor exists on the Fact Sheet", /<section id="statewide-exhibits">/.test(FACT_SHEET_HTML));
  check("(3) the link the block carries is the one the file carries",
    CATALOG.fact_sheet_url + CATALOG.fact_sheet_anchor === LINK && C.STATEWIDE_FACT_SHEET_LINK === LINK);
  check("(3) the heading dates the build and retires older statewide figures",
    ALL.includes(`Built from MAP data on ${CATALOG.source_generated_at.slice(0, 10)}`)
    && ALL.includes("these counts replace any older statewide figures above"));
  check("(3) the totals line states the Fact Sheet's numbers",
    ALL.includes(`${CATALOG.exhibits} statewide exhibits in ${CATALOG.program_areas} program areas plus Other Statewide, carrying ${CATALOG.recs} credit recommendation lines`));
  check("(3) the whole catalog carries counts, not the 400-odd course lines", !/•/.test(body));
  // Size: it rides on top of every other route's context, so it has to stay compact.
  // ~11,100 characters on 2026-10-16; chars/4 is ~2,800 tokens, and this file's header
  // measured Sonnet 5 at about 28% above chars/4, so about 3,600.
  check("(3) the block stays compact (under 13,000 characters)", ALL.length < 13000, `${ALL.length} chars`);
  check("(3) the rule rides with the block", ALL.endsWith(C.STATEWIDE_CATALOG_RULE + "\n"));
});

// ── (4) A named program area ─────────────────────────────────────────────────
block("(4) one program area", () => {
  const weld = C.buildStatewideCatalogContext(CATALOG, { kind: "sectors", sectors: ["Welding"] });
  const w = CATALOG.sectors.find((s) => s.sector === "Welding");
  const rows = weld.split("\n").filter((l) => /^- .+ \| .+ \| \d+$/.test(l));
  check("(4) a named area lists only its exhibits", rows.length === w.items.length
    && !weld.includes("Program area — Construction Technology"), `${rows.length} rows`);
  const lines = weld.split("\n").filter((l) => l.startsWith("    • "));
  check("(4) an area that fits lists every exhibit's lines beneath it",
    lines.length === w.recs && weld.includes("each exhibit's lines beneath it"), `${lines.length} lines vs ${w.recs}`);
  // The line format and the repeated C-ID note, on a fixture shaped like POST's record
  // (AJ 110 sits on two of its lines; Sam: "AJ 110 may be C-ID and it is Elective").
  const FIX = {
    exhibits: 2, program_areas: 1, recs: 3, exhibits_without_lines: 1,
    source_generated_at: "2026-10-16T13:59:04", fact_sheet_url: CATALOG.fact_sheet_url,
    fact_sheet_anchor: CATALOG.fact_sheet_anchor,
    sectors: [{ sector: "Administration of Justice", exhibits: 2, recs: 3, items: [
      { title: "POST Basic Academy", units: "7", recs: 3, lines: [
        { t: "Criminal Law", u: "3", cid: "AJ 120" },
        { t: "Intro to Administration of Justice", u: "3", cid: "AJ 110" },
        { t: "Physical Training and Health Education", u: "1", cid: "AJ 110" }] },
      { title: "Unpublished Standard", units: null, recs: 0, lines: [] }] }],
  };
  const aj = C.buildStatewideCatalogContext(FIX, { kind: "sectors", sectors: ["Administration of Justice"] });
  check("(4) a line carries its C-ID, its title and its units as the Fact Sheet prints them",
    aj.includes("    • C-ID AJ 120 — Criminal Law — 3 units") && aj.includes("    • C-ID AJ 110 — Physical Training and Health Education — 1 unit\n"), aj);
  check("(4) a repeated C-ID is flagged, never resolved", /Note — C-ID AJ 110 appears on more than one line; list the lines as given\./.test(aj));
  check("(4) the area's heading and counts read in plain words",
    aj.includes("The Administration of Justice program area of the statewide catalog, 2 of its 2 exhibits")
    && aj.includes("Shown here, 2 exhibits and 3 lines, each exhibit's lines beneath it.")
    && aj.includes("2 statewide exhibits in 1 program area, carrying 3 credit recommendation lines; 1 exhibit with no lines published yet."));
  check("(4) an unpublished exhibit reads as such under a named area too", aj.includes("- Unpublished Standard | lines not yet published | 0"));
  const cons = C.buildStatewideCatalogContext(CATALOG, { kind: "sectors", sectors: ["Construction Technology"] });
  const c = CATALOG.sectors.find((s) => s.sector === "Construction Technology");
  check("(4) an area too large for its lines lists its exhibits and points to the Fact Sheet for the lines",
    !/    • /.test(cons) && cons.split("\n").filter((l) => /^- .+ \| .+ \| \d+$/.test(l)).length === c.items.length
    && cons.includes("the lines are on the Fact Sheet, and any exhibit's lines are available on request"));
  check("(4) the line budget is the one the block declares", C.CATALOG_SECTOR_LINES_MAX === 6000);
});

// ── (5) A failed read ────────────────────────────────────────────────────────
block("(5) the read failed", () => {
  const ask = "Give me a complete list of statewide exhibit titles categorized by sector";
  const scope = scopeOf(ask, { catalog: null });
  check("(5) the whole-set ask still gets a block when the file did not load", scope && scope.kind === "all");
  const out = C.buildStatewideCatalogContext(null, scope);
  check("(5) it says the list did not load and links the Fact Sheet",
    out.includes("did not load") && out.includes(`[CPL Fact Sheet](${LINK})`));
  check("(5) it forbids a list or a count from memory", out.includes("Name no statewide exhibit from memory and give no count of them"));
  check("(5) it names no exhibit", !/POST Basic Academy|NCCER|CompTIA/.test(out));
  check("(5) a narrower ask with no catalog gets no block", scopeOf("List the statewide exhibits for welding", { catalog: null }) === null);
  check("(5) no scope, no block", C.buildStatewideCatalogContext(CATALOG, null) === "");
});

// ── (6) The rule's words ─────────────────────────────────────────────────────
block("(6) the rule", () => {
  const R = C.STATEWIDE_CATALOG_RULE;
  check("(6) it leads with the table", /- Lead with the table\./.test(R));
  check("(6) one table per program area, with the columns Sam asked for",
    R.includes("one markdown table for each program area") && R.includes("Exhibit, Total units and Credit recommendations"));
  check("(6) every exhibit gets a row", R.includes("a row for every exhibit the section lists"));
  check("(6) the totals are quoted, never re-added", R.includes("The totals are already summed, so quote them"));
  check("(6) the Fact Sheet is a link, never a bare name", R.includes("[CPL Fact Sheet](the URL in this section)"));
  check("(6) an unpublished exhibit is said plainly", R.includes(`"lines not yet published"`));
  check("(6) the count column is named as the right detail here, and lines are offered",
    R.includes("The count column is the right detail for the full table") && R.includes("offer to list its lines"));
  check("(6) any college may adopt", R.includes("any college may adopt any of these exhibits"));
  check("(6) a how-many question gets the counts first", R.includes("When the visitor asked only how many"));
  check("(6) no business register", !/\b(leverage|utiliz|robust|deep dive|synergy|operationaliz|impactful)/i.test(R));
  check("(6) no bold, no inside term", !/\*\*/.test(R) && !/\bCOCI\b/.test(R));
  check("(6) no \"it is this, not that\"", !/\bnot\b[^.;]{0,60}\bbut\b/i.test(R) && !/,\s*not\s+(a|an|the)\b/i.test(R));
  check("(6) the existing statewide and credit rules are untouched",
    FN.includes("const STATEWIDE_RULE = `\\n\\nABOUT STATEWIDE COLLABORATIVE (CCC) CREDIT RECOMMENDATIONS")
    && /const CREDIT_LIST_RULE = `\\n\\nWHEN DESCRIBING WHAT CREDIT IS AVAILABLE: do NOT just state a count/.test(FN)
    && /NEVER answer with just a count/.test(FN));
  check("(6) the catalog rule stays out of the rule registry (its count is pinned by the Training tab's tests)",
    !/key: "statewide_catalog"/.test(FN));
});

// ── (7) The handler's wiring ─────────────────────────────────────────────────
block("(7) wiring", () => {
  // Asserts that each value arrives, never that it is last (sierra_viewer pins the
  // viewer as the batch's final binding, so the catalog sits just before it).
  const batch = FN.slice(FN.indexOf("teamGuidance, creditData, statewideCatalog, viewer] = await Promise.all(["),
    FN.indexOf("markTiming(timings, \"retrieved\""));
  check("(7) the catalog is read beside the other routes, in the slot its binding names, only on the ask",
    batch.length > 0
    && /fetchCreditData\(sb\),[^\n]*\n\s*catalogAsk \? fetchStatewideCatalog\(\) : Promise\.resolve\(null\),[^\n]*\n\s*deriveViewer\(req\.headers\),/.test(batch));
  check("(7) the scope is decided after detection, with the college's and place's words set aside",
    /statewideCatalogScope\(catalogAsk, routeText, extractTopicKeywords\(routeText\),\s*statewideCatalog, ownWords, !!singleProfile\)/.test(FN));
  check("(7) the block reaches the prompt builder", /buildSystemPrompt\([^;]*\bhostScope, statewideCatalogContext\b[^;]*\)/.test(FN));
  check("(7) it sits after the sources and the live metrics it supersedes",
    FN.includes("${context}${metricsContext}${statewideCatalogContext}"));
  check("(7) the builder declares the parameter with a default", /statewideCatalogContext: string = ""/.test(FN));
  check("(7) the read is main's catalog file, under a time limit, with an override that needs no deploy",
    FN.includes(`"https://raw.githubusercontent.com/CPL-Initiative/cpl-project-tracker/main/fact-sheet/statewide_catalog.json"`)
    && /fetch\(STATEWIDE_CATALOG_URL, \{ signal: AbortSignal\.timeout\(5000\) \}\)/.test(FN)
    && /Deno\.env\.get\("CPL_STATEWIDE_CATALOG_URL"\)/.test(FN));
  check("(7) the turn's timing row records what the block did", /statewide_catalog: \{\s*scope: catalogScope \? catalogScope\.kind : "none",/.test(FN));
});

// ── (8) The daily run builds it, and the generated-file check watches it ────
block("(8) refresh path", () => {
  const wf = read(".github/workflows/daily-dashboard.yml");
  const recsAt = wf.indexOf("python3 fact-sheet/_build_statewide_recs.py");
  const catAt = wf.indexOf("python3 fact-sheet/_build_statewide_catalog.py");
  check("(8) the daily run rebuilds the catalog after the Fact Sheet's recs", recsAt > 0 && catAt > recsAt);
  const add = wf.slice(wf.indexOf("git add index.html CPL_Dashboard.html"), wf.indexOf("git add index.html CPL_Dashboard.html") + 900);
  check("(8) …and commits it with them", add.includes("fact-sheet/statewide_catalog.json") && add.includes("fact-sheet/statewide_recs.js"));
  check("(8) scripts/check_generated.sh runs the builder's --check",
    read("scripts/check_generated.sh").includes("python3 fact-sheet/_build_statewide_catalog.py --check"));
});

// ── (9) The builder's own test ───────────────────────────────────────────────
block("(9) builder", () => {
  let ok = false, msg = "";
  try {
    execFileSync("python3", [path.join(ROOT, "tests", "statewide_catalog_build_test.py")], { stdio: "pipe" });
    ok = true;
  } catch (e) {
    msg = String((e.stdout || "") + (e.stderr || "")).split("\n").filter((l) => /FAIL|Error|error/.test(l)).slice(0, 5).join(" | ");
  }
  check("(9) tests/statewide_catalog_build_test.py passes (units, order, refusals)", ok, msg);
});

const failed = results.filter((r) => !r[1]);
for (const [name, ok, why] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !why ? "" : " — " + String(why).slice(0, 400)}`);
console.log(`\nsierra_statewide_catalog.test.js: ${results.length - failed.length}/${results.length} checks passed`
  + (ALL ? ` (whole-catalog block: ${ALL.length} characters, ~${Math.round(ALL.length / 4)} tokens by chars/4)` : ""));
process.exit(failed.length ? 1 : 0);
