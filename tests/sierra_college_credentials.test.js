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

let buildCollegeCredentialContext, renderRecLines, liftErr = null;
try {
  // renderRecLines comes along because the section now renders course lines
  // through it — the SAME renderer the other credential routes use, so the
  // statewide/local distinction and the C-ID handling cannot drift between them.
  ({ buildCollegeCredentialContext, renderRecLines } = new Function(
    stripTypes(fnBlock("renderRecLines")) +
    stripTypes(fnBlock("buildCollegeCredentialContext")) +
    "\nreturn { buildCollegeCredentialContext, renderRecLines };")());
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

  /* ── 6. The COURSES, not just the credential names (v45) ────────────────── */
  // Sam asked the ironworker question a THIRD time, on 2026-08-13 12:04, AFTER
  // v44 had ended the false zero — and rated it DOWN with a NEW complaint:
  //
  //   "You should have provided a list of courses I could get credit for and
  //    the industry certificates or licenses needed"
  //
  // He was right. This section named credentials and stopped, so a student
  // learned Cerritos awards CPL for "Ironworker Apprenticeship — General
  // Rigging" and never learned it is worth IWAP 40.09, 2 hours. The lines were
  // already in chatbox_credential_recs — every ironworker credential carries
  // one. This route was the only credential route that never asked for them.
  //
  // Fixtures are the REAL rows from chatbox_credential_recs, 2026-08-13.
  const RECS = new Map([
    ["Ironworker Apprenticeship — Cranes", {
      unified_title: "Ironworker Apprenticeship — Cranes", rec_kind: "local_modal",
      n_recs: 1, n_adopter_colleges: 1,
      recs: [{ cid: null, credit: "2 hours in IW - Cranes", colleges: 1, example_course: "IWAP 40.07" }],
    }],
    ["Ironworker Apprenticeship — Mixed Base", {
      unified_title: "Ironworker Apprenticeship — Mixed Base", rec_kind: "local_modal",
      n_recs: 1, n_adopter_colleges: 1,
      recs: [{ cid: null, credit: "2 hours in IW- Mixed Base", colleges: 1, example_course: "IWAP 40.03" }],
    }],
    // FIW Orientation and Foreman Training are deliberately ABSENT — a
    // credential with no recommendation line must still be named.
  ]);

  const withRecs = buildCollegeCredentialContext(ROWS, "Cerritos College", RECS);

  check("the courses a credential converts into are listed",
        /IWAP 40\.07/.test(withRecs) && /IWAP 40\.03/.test(withRecs),
        "naming the credential without the course leaves the student where they started");

  check("the credit each is worth travels with the course",
        /2 hours in IW - Cranes/.test(withRecs),
        "a course code with no units is not an answer to 'what would I get?'");

  check("the answer is instructed to carry BOTH halves — credential AND courses",
        /ANSWER WITH BOTH HALVES/.test(withRecs) &&
        /certificate, licence or apprenticeship/i.test(withRecs),
        "Sam asked for the courses AND the certificates needed to earn them");

  check("a credential with NO recommendation line is still named",
        withRecs.includes("FIW Orientation") && withRecs.includes("Foreman Training"),
        "dropping a credential for lacking a course line re-creates the false zero");

  check("a credential with no line is explained, not silently bare",
        /course award is set at review/i.test(withRecs) &&
        /never invent a course/i.test(withRecs),
        "an unexplained bare credential invites the model to fabricate a course");

  /* ── 7. The lines are ENRICHMENT — names survive without them ───────────── */
  // The caller appends this section outside the recs try/catch precisely so a
  // recommendation failure cannot restore the false zero. That guarantee is
  // only real if the function tolerates a missing map.
  const noRecs = buildCollegeCredentialContext(ROWS, "Cerritos College", null);
  check("a missing recs map still names every credential",
        ROWS.every((r) => noRecs.includes(r.unified_title)),
        "losing the enrichment must cost DETAIL, never the credentials themselves");
  check("a missing recs map renders no course lines and invents none",
        !/IWAP/.test(noRecs));
  check("omitting the argument entirely behaves the same as null",
        buildCollegeCredentialContext(ROWS, "Cerritos College") === noRecs,
        "every pre-v45 caller must be unchanged");

  /* ── 8. Local recommendations must not read as statewide ────────────────── */
  // rec_kind local_modal means "the most common award among adopting colleges",
  // which is a far weaker claim than a statewide standard. The shared renderer
  // makes that distinction; this asserts the college route inherits it.
  check("a local award is labelled local, with its college count",
        /most common LOCAL awards/i.test(withRecs) && /1 college\(s\) award this/.test(withRecs),
        "a one-college local award presented as a standard overstates the evidence");
  check("a local award is NOT announced as a statewide set",
        !/STATEWIDE CREDIT RECOMMENDATIONS/.test(withRecs));
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

// The course lines only appear if COLLEGE-CRED's titles actually reach the
// batched recommendation lookup. Renderer and wiring are separately correct-
// looking, and the alignment bug the day before was exactly a loss BETWEEN two
// individually-correct halves — so assert the wiring, not just the renderer.
const titlesBatch = src.slice(src.indexOf("const titles = ["),
                              src.indexOf("fetchCredentialRecs(titles, sb)"));
check("COLLEGE-CRED titles join the batched recs lookup",
      /\.\.\.\(collegeCreds \|\| \[\]\)/.test(titlesBatch),
      "without this the section renders names only and Sam's complaint stands");

check("the recs map is declared OUTSIDE the try, so the section can still use it",
      src.indexOf("let recsMap") < src.indexOf("const titles = ["),
      "declared inside, the college section could never see it");

// One round trip however many routes fired — the property the batch exists for.
check("there is still exactly ONE fetchCredentialRecs call",
      (src.match(/await fetchCredentialRecs\(/g) || []).length === 1,
      "a second lookup is a second matcher that can drift from the first");

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
