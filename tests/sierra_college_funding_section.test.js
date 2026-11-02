// Sierra reads a named college's own funding section (S529). S528 asked her about
// Cabrillo's funding conditions and she named Mt. San Jacinto, Pasadena and Skyline:
// the similarity search picks among 118 sections that read alike, and Cabrillo's had
// not reached the index (the vault's two indexers raced; CPLBrain#556). A funding
// question that names one college now reads that college's section by its heading.
// This lifts the block's functions out of index.ts and runs them on the note the
// funding-note workflow writes, so the guard is the code that ships.
// Run from repo root: `node tests/sierra_college_funding_section.test.js`.
const fs = require("fs");
const path = require("path");
const { liftBlock } = require("./lib/lift_ts");
const { buildNote, loadConfig, SECTION_SUFFIX, JST_ROLLUP_HEADING } = require("../scripts/funding_sierra_note.js");

const ROOT = path.join(__dirname, "..");
const FN = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

let L = null;
try {
  L = liftBlock(FN, "// ── COLLEGE FUNDING SECTION BLOCK START", "// ── COLLEGE FUNDING SECTION BLOCK END",
    ["fundingAsk", "fundingNameKey", "pickFundingSection", "fetchCollegeFundingSection", "withFundingSection",
     "FUNDING_SECTION_SUFFIX", "FUNDING_JST_HEADING", "jstRollupAsk", "joinJstRollup", "fetchJstRollupSection"]);
} catch (e) { check("the block lifts out of index.ts — " + e.message, false); }
check("the block lifts out of index.ts", !!L && typeof L.pickFundingSection === "function");

(async function () {
  if (L) {
    check("the note and Sierra use one heading suffix", L.FUNDING_SECTION_SUFFIX === SECTION_SUFFIX);
    // The headings the note writes, as the index would hold them.
    const c = loadConfig(path.join(__dirname, "fixtures", "cpl_funding_config_de95c290.json"));
    const note = buildNote(c.cfg, "2026-10-20T15:22:49Z");
    const heads = note.split("\n").filter((l) => /^### .+: CPL funding standing$/.test(l))
      .map((l, i) => ({ id: "s" + i, heading: l.slice(4) }));
    check("the note gives 118 headings", heads.length === 118);
    const pick = (college) => (L.pickFundingSection(heads, college) || {}).heading || "";
    check("Cabrillo College finds its own section", pick("Cabrillo College") === "Cabrillo College: CPL funding standing");
    check("MAP's 'Mt. San Jacinto College' finds 'Mt San Jacinto College'", /^Mt San Jacinto College: /.test(pick("Mt. San Jacinto College")));
    check("'Cañada College' finds its section without the accent", /^Canada College: /.test(pick("Cañada College")));
    check("Pasadena City College is not Cabrillo", pick("Pasadena City College") === "Pasadena City College: CPL funding standing");
    // MAP's profile names that differ from the note's full names (measured S529 against
    // chatbox_college_profiles: all 118 headings reachable, only the 7 non-CCC names miss).
    for (const [asked, want] of [["Lassen College", "Lassen Community College"], ["Barstow Community College", "Barstow College"],
      ["Madera College", "Madera Community College"], ["Southwestern College", "Southwestern Community College"],
      ["Coalinga College", "West Hills College Coalinga"], ["Lemoore College", "West Hills College Lemoore"],
      ["Calbright College Non-Credit", "Calbright College"], ["San Diego Continuing Education", "San Diego College of Continuing Education"],
      ["North Orange Continuing Education", "North Orange Continuing Education"], ["Mission College", "Mission College"],
      ["Los Angeles Mission College", "Los Angeles Mission College"]]) {
      check(`'${asked}' finds '${want}'`, pick(asked) === want + SECTION_SUFFIX, pick(asked));
    }
    check("a name that is no institution finds nothing", pick("Hogwarts") === "" && pick("") === "");
    check("two matching headings give nothing rather than a guess",
      L.pickFundingSection([{ id: "a", heading: "X College" + SECTION_SUFFIX }, { id: "b", heading: "X college" + SECTION_SUFFIX }], "X College") === null);

    check("a funding question is a funding ask",
      L.fundingAsk("Has Cabrillo College met the CPL funding conditions, and is it at 75 percent on veteran JSTs?") &&
      L.fundingAsk("What is Pasadena's max award?") && L.fundingAsk("Has Skyline confirmed participation?"));
    check("a catalog question is not", !L.fundingAsk("What courses does Norco College offer in welding?") &&
      !L.fundingAsk("Can I get credit for my EMT certificate at Cabrillo?"));

    // The two reads, against a recorded client.
    const calls = [];
    const cabId = heads.find((h) => h.heading === "Cabrillo College" + SECTION_SUFFIX).id;
    const row = { id: cabId, document_id: "d", heading: "Cabrillo College" + SECTION_SUFFIX, content: "- Funding status: held", metadata: {} };
    const sb = { from: (t) => {
      const q = { t, sel: "", f: [] };
      const api = {
        select: (c) => { q.sel = c; return api; },
        like: (col, v) => { q.f.push(["like", col, v]); calls.push(q); return Promise.resolve({ data: heads, error: null }); },
        eq: (col, v) => { q.f.push(["eq", col, v]); return api; },
        maybeSingle: () => { calls.push(q); return Promise.resolve({ data: row, error: null }); },
      };
      return api;
    } };
    const got = await L.fetchCollegeFundingSection(sb, "Cabrillo College");
    check("the read returns the section's text, ranked first", got && got.content === row.content && got.similarity === 1);
    check("it reads the headings by the suffix, then one row by id",
      calls.length === 2 && calls[0].f[0][2] === "%" + SECTION_SUFFIX && calls[1].f[0][0] === "eq" && calls[1].f[0][2] === cabId);
    const bad = { from: () => ({ select: () => ({ like: () => Promise.resolve({ data: null, error: { message: "x" } }) }) }) };
    check("a failed read gives null, never an error", (await L.fetchCollegeFundingSection(bad, "Cabrillo College")) === null);
    const merged = L.withFundingSection([{ id: "x" }, { id: cabId }], got);
    check("the section leads the sources, once", merged.map((s) => s.id).join() === cabId + ",x");
    check("no section leaves the sources as they were", L.withFundingSection([{ id: "x" }], null).map((s) => s.id).join() === "x");

    // Every institution against the JST condition (S543). Sam, 2026-11-01, asked "which
    // college have not yet met the 75% jst vet sprint goal for the new funding?" and
    // Sierra said she had no per-college percentages: no college was named, so no
    // section was read.
    check("the note and Sierra use one JST heading", L.FUNDING_JST_HEADING === JST_ROLLUP_HEADING);
    check("Sam's question is a JST ask", L.jstRollupAsk("which college have not yet met the 75% jst vet sprint goal for the new funding?"));
    check("other ways to ask it are too", L.jstRollupAsk("Which colleges are below 75 percent of their veterans?") &&
      L.jstRollupAsk("List the colleges without Veteran Star") && L.jstRollupAsk("How many joint services transcripts are in MAP?"));
    check("a funding question without JSTs is not", !L.jstRollupAsk("What is Pasadena's max award?") &&
      !L.jstRollupAsk("Which colleges have confirmed participation?") && !L.jstRollupAsk("Can I get credit for my EMT certificate?"));
    // The section as the indexer stores it: split at paragraphs past 2,000 characters
    // (CPLBrain .github/scripts/index_vault.py), each chunk under the one heading.
    const roll = (note.split(/\n(?=## )/).find((b) => b.startsWith("## " + JST_ROLLUP_HEADING)) || "").split("\n").slice(1).join("\n").trim();
    const chunks = []; let cur = "";
    for (const para of roll.split("\n\n")) {
      if (cur && cur.length + para.length > 2000) { chunks.push(cur); cur = para; } else cur = cur ? cur + "\n\n" + para : para;
    }
    if (cur) chunks.push(cur);
    const stored = chunks.map((c, i) => ({ id: "j" + i, document_id: "note", heading: JST_ROLLUP_HEADING, content: c, metadata: { chunk_index: 40 + i } }));
    stored.push({ id: "old", document_id: "other", heading: JST_ROLLUP_HEADING, content: "stale", metadata: { chunk_index: 1 } });
    const joined = L.joinJstRollup(stored.slice().reverse().filter((r) => r.id !== "old").concat(stored.filter((r) => r.id === "old")));
    check("the indexer splits the section, so the read is tested on chunks", chunks.length >= 2, String(chunks.length));
    check("the read joins one document's chunks in order, the whole section", joined && joined.content === chunks.join("\n\n") &&
      /Not yet met \(\d+\):/.test(joined.content) && /Met \(\d+\): /.test(joined.content) && joined.similarity === 1);
    check("no chunks give null", L.joinJstRollup([]) === null && L.joinJstRollup(null) === null);
    const jsb = { from: () => ({ select: () => ({ eq: (col, v) => Promise.resolve({ data: stored.filter((r) => r[col] === v), error: null }) }) }) };
    check("the read asks for the heading", ((await L.fetchJstRollupSection(jsb)) || {}).heading === JST_ROLLUP_HEADING);
    const jbad = { from: () => ({ select: () => ({ eq: () => Promise.reject(new Error("x")) }) }) };
    check("a failed JST read gives null, never an error", (await L.fetchJstRollupSection(jbad)) === null);
  }

  // The handler wiring: the read fires only for a named college and a funding ask, and
  // the prompt and the sources event both carry it.
  check("the handler reads the section for a named college's funding question",
    /fundingSection = singleProfile\?\.college\s*\? \(fundingAsk\(routeText\) \? await fetchCollegeFundingSection\(sb, singleProfile\.college\) : null\)/.test(FN));
  check("and every institution's JST standing for a JST question naming no single college",
    /: \(jstRollupAsk\(routeText\) \? await fetchJstRollupSection\(sb\) : null\);/.test(FN));
  check("the live metrics name the statewide JST count", /JSTs uploaded to MAP, the statewide JST count\): \$\{raw\.MilitaryStudents/.test(FN));
  check("the prompt is built from the merged sources", /buildSystemPrompt\(\s*promptSections,/.test(FN));
  check("the sources event lists the merged sources", /const sourcesData = promptSections\.map/.test(FN));

  let pass = 0;
  for (const [n, ok, why] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "\n        > " + why : "")); if (ok) pass++; }
  console.log(`\nsierra_college_funding_section.test.js: ${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
