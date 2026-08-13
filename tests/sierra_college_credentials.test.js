/**
 * Route COLLEGE-CRED — "what CPL can I get HERE?" answered from the CURATED
 * credential names. BEHAVIOURAL.
 *
 * THE FAILURE THIS GUARDS IS A FALSE ZERO, which is the worst answer Sierra can
 * give: it tells someone a door is shut that is open.
 *
 * Sam reported it twice through Sierra Training, the second time AFTER v42 had
 * shipped (2026-08-12 23:39 and 2026-08-13 12:04):
 *
 *   "I have a journey worker license as Iron and Steel worker. What CPL can I
 *    get here?"  ->  nothing
 *   "You should have data on iron and steel articulations at Cerritos."
 *
 * Cerritos has THIRTEEN ironworker credentials. Three independent defects hid
 * them, and this file guards the two that live in cpl-chat:
 *
 *   - the RAW corpus abbreviates ("FIW Orientation", "IW- Mixed Base" — no
 *     substring of "iron"), so a college-scoped topic search returns 0 and
 *     there was NO college-scoped curated route to fall back to;
 *   - fetchAnyCredentials, the only route that reaches LOCAL credentials, had
 *     the NARROWEST probe budget of the three and dropped every content token
 *     past the third keyword — so "iron" was never asked.
 *
 * Run: node tests/sierra_college_credentials.test.js
 */
const fs = require("fs");
const path = require("path");
const { stripTypes } = require("./lib/lift_ts");

const SRC = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

function fnBlock(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: function " + name);
  let d = 0, s = src.indexOf("{", i), e = -1;
  for (let j = s; j < src.length; j++) {
    const c = src[j];
    if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) { e = j; break; } }
  }
  return src.slice(i, e + 1);
}

let buildCollegeCredentialContext, liftErr = null;
try {
  ({ buildCollegeCredentialContext } = new Function(
    stripTypes(fnBlock("buildCollegeCredentialContext")) +
    "\nreturn { buildCollegeCredentialContext };")());
} catch (e) { liftErr = e; }
check("buildCollegeCredentialContext lifts and evaluates", !liftErr, liftErr && liftErr.message);

/* ── Fixtures — live search_college_credentials('iron','Cerritos College') ─── */
const IRONWORKERS =
  "International Association of Bridge, Structural, Ornamental and Reinforcing Iron Workers";
const ROWS = [
  // Tier 3 — the credential's own title carries the word.
  { unified_title: "Ironworker Apprenticeship — Cranes", issuer: IRONWORKERS,
    trainer: "Ironworker Joint Apprenticeship Training Committee",
    statewide: false, n_adopters: 1, match_tier: 3 },
  { unified_title: "Ironworker Apprenticeship — Mixed Base", issuer: IRONWORKERS,
    trainer: null, statewide: false, n_adopters: 1, match_tier: 3 },
  // Tier 5 — the TITLE says nothing about ironwork; only the ISSUER does. These
  // three were unreachable by ANY query before the issuer rung existed.
  { unified_title: "FIW Orientation", issuer: "Field Ironworkers Local 416",
    trainer: null, statewide: false, n_adopters: 1, match_tier: 5 },
  { unified_title: "Foreman Training", issuer: "Field Ironworkers Local 416",
    trainer: null, statewide: false, n_adopters: 1, match_tier: 5 },
];

if (!liftErr) {
  const ctx = buildCollegeCredentialContext(ROWS, "Cerritos College");

  /* ── 1. The credentials are named, and named as FACT ────────────────────── */
  check("every matched credential is named",
        ROWS.every((r) => ctx.includes(r.unified_title)),
        "a credential omitted here is one the student never hears about");

  check("the college is named as already awarding them",
        /ALREADY AWARDS CPL/i.test(ctx) && /Cerritos College/.test(ctx));

  check("they are framed as established fact, not as a suggestion",
        /established fact/i.test(ctx) && /awards credit for these today/i.test(ctx),
        "hedging a fact invites the model to re-litigate it into a maybe");

  /* ── 2. The anti-false-zero guarantee ───────────────────────────────────── */
  // This is the whole point of the route. A model that has this section and
  // still says "no ironworker CPL at Cerritos" has done the one unforgivable
  // thing, so the instruction is explicit rather than implied.
  check("the context forbids reporting a zero it can see is wrong",
        /never say a college has none of something when this section lists it/i.test(ctx),
        "the false zero is the failure this whole route exists to end");

  check("the abbreviation trap is named concretely, not in the abstract",
        /ABBREVIATED/.test(ctx) && /FIW Orientation/.test(ctx),
        "an abstract warning does not survive contact with a confident-looking empty search");

  /* ── 3. An issuer match must not be passed off as a title match ─────────── */
  // Tier >=5 means we matched the awarding body, not the credential's name.
  // Claiming otherwise would put words in the college's mouth.
  const fiwLine = ctx.slice(ctx.indexOf("FIW Orientation"));
  check("an issuer-tier match discloses that the title did NOT match",
        /matched through the awarding body/i.test(fiwLine.slice(0, 220)),
        "otherwise the model reports 'FIW Orientation' as if the college named it for ironwork");

  const craneLine = ctx.slice(ctx.indexOf("Ironworker Apprenticeship — Cranes"));
  check("a title-tier match carries NO such disclaimer",
        !/matched through the awarding body/i.test(craneLine.slice(0, 160)),
        "disclaiming a clean match teaches the model to doubt good data");

  check("the issuer is attributed with each credential",
        ctx.includes(IRONWORKERS) && ctx.includes("Field Ironworkers Local 416"));

  /* ── 4. Honest empties ──────────────────────────────────────────────────── */
  check("no rows renders nothing at all",
        buildCollegeCredentialContext(null, "X") === "" &&
        buildCollegeCredentialContext([], "X") === "",
        "an empty heading reads as a measured zero");
}

/* ── 5. Probe budget — the token that fell off the end ────────────────────── */
// Sam's sentence keyword-extracts to [journey, worker, license, iron, steel,
// worker]. At the old 3-pair/3-single budget the probes were [journey worker,
// worker license, license iron, journey, worker, license] and "iron" was NEVER
// asked, while search_credentials_any('iron') returns 25 rows. The subject of
// the sentence was dropped by a slice.
const swMatch = src.match(/const TOPIC_STOP_WORDS = new Set\(\[([\s\S]*?)\]\);/);
const STOP = new Set([...swMatch[1].matchAll(/"([a-z0-9]+)"/g)].map((m) => m[1]));
const extract = (q) => q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
  .filter((w) => w.length >= 3 && !STOP.has(w));

function probesOf(fnName) {
  const body = fnBlock(fnName);
  const pairCap = Number((body.match(/probes\.length\s*<\s*(\d+)/) || [])[1]);
  const singleCap = Number((body.match(/kws\.slice\(0,\s*(\d+)\)/) || [])[1]);
  const total = Number((body.match(/probes\.slice\(0,\s*(\d+)\)/) || [])[1]);
  const kws = extract("I have a journey worker license as Iron and Steel worker. "
                    + "What CPL can I get here?");
  const p = [];
  for (let i = 0; i < kws.length - 1 && p.length < pairCap; i++) p.push(kws[i] + " " + kws[i + 1]);
  for (const k of kws.slice(0, singleCap)) if (!p.includes(k)) p.push(k);
  return p.slice(0, total);
}

const anyProbes = probesOf("fetchAnyCredentials");
check("fetchAnyCredentials asks about IRON for Sam's actual question",
      anyProbes.includes("iron"),
      "probes were " + JSON.stringify(anyProbes) + " — the subject of the sentence was dropped");

const collProbes = probesOf("fetchCollegeCredentials");
check("fetchCollegeCredentials asks about IRON too",
      collProbes.includes("iron"),
      "probes were " + JSON.stringify(collProbes));

check("the local-credential route is not budgeted narrower than the statewide one",
      anyProbes.length >= probesOf("fetchStatewideRecommendations").length - 1,
      "the route that reaches LOCAL credentials had the smallest budget of the three");

/* ── 6. Wiring guards ─────────────────────────────────────────────────────── */
check("calls the college-scoped RPC by its real name",
      /rpc\("search_college_credentials"/.test(src));

check("the college-credential lookup is gated on a college being known",
      /function fetchCollegeCredentials[\s\S]{0,400}?if \(!college\) return null;/.test(src),
      "an ungated call would search every college's catalogue at once");

// It must NOT be gated on the topic route coming back empty: the raw corpus
// returning rows does not mean it returned the RIGHT rows.
check("the lookup runs unconditionally, not only as a topic-search fallback",
      /Runs UNCONDITIONALLY when a college/.test(src) &&
      !/topicResults[^\n]{0,40}&&[^\n]{0,40}fetchCollegeCredentials/.test(src));

// Both branches of the recs try/catch rebuild credentialContext from scratch,
// so appending inside either one drops the section on the failing path.
const appendIdx = src.indexOf("credentialContext += buildCollegeCredentialContext");
const catchIdx = src.indexOf("credential recs lookup failed:");
check("the section is appended AFTER the recs try/catch, so a failure cannot drop it",
      appendIdx > catchIdx,
      "a false zero must survive the recommendation enrichment breaking");

const backticks = (src.match(/(?<!\\)`/g) || []).length;
check("template literals balanced", backticks % 2 === 0,
      backticks + " unescaped backticks — an unterminated literal kills the function at boot");

/* ── Report ───────────────────────────────────────────────────────────────── */
let failed = 0;
for (const [ok, name] of results) {
  console.log(`  ${ok ? "ok " : "FAIL"}  ${name}`);
  if (!ok) failed++;
}
console.log(`\nsierra_college_credentials: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
