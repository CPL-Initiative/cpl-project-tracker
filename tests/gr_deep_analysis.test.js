// ⚖️ GR Priorities — the DEEP re-analysis (Lane B) in gr_priorities.js.
//
//   Sam, 2026-08-25: "a routine I can run on demand that looks at the edit I made
//   and reanalyzes everything for related Title 5 and Ed Code citations and an
//   analysis of whether it can be accomplished by a clarifying memo, regulation
//   revision, Ed Code revision, or some combination of the 3" — and decisively:
//   "It's the same routine used to create the tab in the first place."
//
//   Lane A (analyzeRevision) checks the row against ITSELF, deterministically.
//   Lane B asks a model the two questions Lane A structurally cannot answer:
//   related sections nobody has cited, and the instrument determination.
//
// WHAT THIS GUARDS, and why each is here rather than left to reading:
//
//   * THE BUDGET, READ OUT OF THE EDGE FUNCTION. QUERY_CAP_GR_ANALYSIS lives in
//     index.ts and is applied server-side; a number restated here would pass
//     happily while the real one moved. That is exactly how Autogenerate sent a
//     984-character envelope into a 1,000-character cap and drafted the wrong
//     subject (PR #1320). The envelope is built from the REAL longest row.
//
//   * THE ROW LEADS. Whatever a cap ever eats must be instruction text. If the
//     doctrine led, a truncation would keep the instructions and drop the
//     subject — a confident analysis of nothing.
//
//   * SURFACE VOCABULARY IN ALL THREE SERVER LISTS. A surface declared drafting
//     with no cap silently inherits the 1,000-character chat cap.
//
//   * THE DOCTRINE IS SCOPED TO THE AREA IT WAS MEASURED FROM. `dual-enrollment`
//     is a marked SAMPLE whose entries are "neutral review prompts, not
//     Chancellor's Office or MAP positions". Running an advocacy doctrine there
//     writes a position into the row that exists to demonstrate their absence.
//
//   * IT PROPOSES AND NEVER APPLIES, and a malformed reply is an error rather
//     than a half-filled object. A silently-defaulted `pathway` would read as an
//     instrument determination nobody made.
//
// Run from repo root: `npm test` (or `node tests/gr_deep_analysis.test.js`).
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
// ⚠️ A GUARD THAT THROWS TAKES EVERY CHECK BELOW IT WITH IT. Session 193 read
// five perturbations as "0 FAIL" because the suite CRASHED and stopped, so the
// checks that would have gone red were never reached and the exit code said only
// "something failed". Each block runs inside this, so a driver fault is ONE
// reported failure and the rest of the file still runs.
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const ROOT = path.join(__dirname, "..");
const GR = require(path.join(ROOT, "gr_priorities.js"));
const TS = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");

// The register as it actually stands, trimmed to the fields the envelope reads.
// Row #7 (apportionment) carries the longest prose in the table, so it is the
// row the budget has to hold; the other 15 are the ranking context.
const SIBLINGS = [
  [1, "Authorize CPL awards for course, GE area, and elective", 4, ["g", "y"]],
  [2, "CPL reciprocity between colleges (no secondary review)", 2, ["y", "r"]],
  [3, '"CR" (credit) notation rather than P/NP', 9, ["y"]],
  [4, "No local limit on CPL units", 7, ["g", "y"]],
  [5, "A central body awards CPL (CVC)", 12, ["r"]],
  [6, "Honor ASCCC statewide credit recommendations", 5, ["g", "y"]],
  [8, "High-school CPL counts toward dual enrollment", 13, ["g", "r"]],
  [9, "Remove the requirement to note CPL on the transcript", 3, ["y"]],
  [10, "Transcribe all CPL — incl. waived / GE-area / elective units", 3, ["y"]],
  [11, "Require CPL data on MAP + MAP/MIS integrity", 8, ["g", "y"]],
  [12, "CPL need not be listed on CORs — every catalog course is eligible", 6, ["g"]],
  [13, "Common Course Crosswalk via ASCCC Pathways to Credit", 5, ["g", "y"]],
  [14, "Identify and verify skills for all CPL", 10, ["g", "y"]],
  [15, "Record CPL denials with a written justification", 11, ["g", "y"]],
  [16, "Honor MAP CPL recommendations (parallels the ACE clause)", 5, ["g", "y"]],
].map(([n, title, rank, pw]) => ({
  id: "id" + n, area_id: "cpl", n, title, blast_rank: rank, pathway: pw,
  citations: ["T5 §55050"], grp: "Portability & statewide infrastructure",
  summary: "", consideration: "", instrument: "§55050", ed_first: "No", blast_why: "",
}));

const ROW7 = {
  id: "id7", area_id: "cpl", n: 7, grp: "Funding",
  title: "Add a CPL option through apportionment (units-based FTES)",
  summary: '<p><b>Approach.</b> The units engine is real and lawful — Title 5\'s Standardized '
    + 'Attendance Accounting Method (<a href="https://www.law.cornell.edu/regulations/california/5-CCR-58003.1">'
    + '§58003.2</a>, eff. 8/21/2024) computes FTES at 18 standardized hours/unit, not seat time '
    + '(≈9,349 FTES ≈ $50.6M on 2024-25 awards). But it still counts "students in attendance at census," and '
    + '<a href="https://www.law.cornell.edu/regulations/california/5-CCR-58050">§58050</a>/§58051 require '
    + 'supervised attendance, which a CPL award lacks. Put the units-based CPL FTES in the <b>TBL</b> (statute) '
    + '+ a §58050 "except transcribed CPL" carve-out, computed by the §58003.2 engine.</p>',
  consideration: "A bare Title 5 tweak collides with the statutory attendance premise (Gov. Code §11342.2 "
    + '+ Dept. of Finance). <a href="https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB744">'
    + "SB 744</a> tried the statute route but appears gutted-and-amended — a gap the TBL can fill.",
  blast_why: "The economics flip. Today a CPL award is unfunded cost — so many colleges treat CPL as a losing "
    + "endeavor. Paying apportionment on the <i>units</i> awarded turns CPL into a system-wide incentive.",
  instrument: "§58003.2 + §58050 → TBL", pathway: ["r"], ed_first: "Yes", blast_rank: 1,
  citations: ["GC §11342.2", "T5 §58003.2", "T5 §58050", "T5 §58051"],
};
const ALL = SIBLINGS.concat([ROW7]);
const LANE = GR._laneASummary({
  missing: ["T5 §55063"], unsupported: [], ambiguous: ["53410"],
  shared: [{ cite: "T5 §58003.2", areas: ["Dual Enrollment"] }],
  staleVerification: true, derived: true,
});

// ── (1) the budget, read out of the edge function ───────────────────────────
block("(1)", () => {
  const m = /const QUERY_CAP_GR_ANALYSIS = (\d+);/.exec(TS);
  check("(1) ⭐ the edge function declares a cap for this surface", !!m,
    "QUERY_CAP_GR_ANALYSIS not found in index.ts");
  if (!m) return;                       // report the absence; do not dereference it
  const CAP = Number(m[1]);
  check("(1) ⭐ the client's budget IS the server's cap, not a second number",
    GR._GR_QUERY_BUDGET === CAP, "client " + GR._GR_QUERY_BUDGET + " vs server " + CAP);

  const q = GR._analysisQuery(ROW7, ALL, LANE, "cpl");
  check("(1) ⭐ the longest real row's envelope fits under the cap",
    q.length < CAP, q.length + " >= " + CAP);
  // Headroom, not just fit. The register is edited live; a row that fits by 400
  // characters today truncates the first time someone rewrites its Approach.
  check("(1) ⚠ …with room for the prose to grow (fits under half the cap)",
    q.length < CAP / 2, q.length + " is over half of " + CAP);
});

// ── (2) the row leads the envelope ──────────────────────────────────────────
block("(2)", () => {
  const q = GR._analysisQuery(ROW7, ALL, LANE, "cpl");
  const iRow = q.indexOf("THE ROW UNDER ANALYSIS");
  const iDoc = q.indexOf("THE DOCTRINE");
  const iOut = q.indexOf("RETURN EXACTLY ONE JSON OBJECT");
  check("(2) ⭐ the row comes before the doctrine and the contract",
    iRow >= 0 && iDoc > iRow && iOut > iDoc,
    "row@" + iRow + " doctrine@" + iDoc + " contract@" + iOut);
  check("(2) the row's own title is in the first 200 characters",
    q.slice(0, 200).indexOf(ROW7.title) >= 0);
  check("(2) ⭐ Lane A's findings are handed to Lane B",
    q.indexOf("T5 §55063") >= 0 && q.indexOf("DETERMINISTIC PASS") >= 0);
  check("(2) ⭐ the siblings are labeled context, not the subject",
    /CONTEXT FOR RANKING ONLY, NOT THE SUBJECT/.test(q));
  // ⚠️ THE ORDINAL IS NOT THE RANK. Row #12 carries rank 6 and row #5 carries
  // rank 12 — asserting on a row where the two happen to coincide would pass
  // just as happily if the block printed `n` twice.
  check("(2) …and they carry the RANKS, not their ordinals, so ranking is comparative",
    /#5 \[rank 12\]/.test(q) && /#12 \[rank 6\]/.test(q));
});

// ── (3) HTML is stripped, and it is most of the budget ──────────────────────
block("(3)", () => {
  const plain = GR._plainText(ROW7.summary);
  check("(3) ⭐ markup and href targets never reach the model",
    plain.indexOf("<") < 0 && plain.indexOf("cornell.edu") < 0 && plain.indexOf("href") < 0);
  check("(3) …and the section numbers survive the strip",
    plain.indexOf("§58003.2") >= 0 && plain.indexOf("§58050") >= 0);
  // ⚠️ ORDER MATTERS THE OTHER WAY ROUND. Decode BEFORE stripping and an escaped
  // `&lt;b&gt;` in a curator's prose becomes a real tag and is then EATEN — the
  // author's literal text silently disappears from the prompt. Stripping first
  // means the entity survives as visible characters, which is harmless: nothing
  // downstream re-parses this string as HTML.
  check("(3) ⚠ escaped markup in the copy survives as text instead of being eaten",
    GR._plainText("a &lt;b&gt; c").indexOf("b") >= 0
      && GR._plainText("a &lt;b&gt; c").replace(/\s/g, "") === "a<b>c");
  check("(3) the strip is worth doing (it removes a fifth of this field)",
    plain.length < ROW7.summary.length * 0.85,
    plain.length + " vs " + ROW7.summary.length);
  // ⭐ SEARCH TEXT IS NOT SENT TEXT. cpl-chat embeds `query` to search the KB;
  // embedding a JSON contract retrieves documents about JSON contracts.
  const rq = GR._analysisRetrieval(ROW7);
  check("(3) ⭐ retrieval_query is the row's subject, not the envelope",
    rq.indexOf(ROW7.title) >= 0 && rq.indexOf("RETURN EXACTLY ONE JSON") < 0 && rq.length <= 900);
});

// ── (4) the doctrine is scoped to the area it was measured from ─────────────
block("(4)", () => {
  const cpl = GR._analysisQuery(ROW7, ALL, LANE, "cpl");
  const de = GR._analysisQuery(
    { id: "d1", area_id: "dual-enrollment", n: 1, title: "CCAP partnership agreement requirements",
      summary: "A review would ask which elements are fixed in statute.", citations: ["EC §76004"],
      pathway: ["g", "r"], ed_first: "Split" }, [], { findings: [] }, "dual-enrollment");
  check("(4) ⭐ the CPL area gets the measured doctrine", /THE DOCTRINE/.test(cpl));
  check("(4) …with the worked examples that pin the instrument logic",
    /#12/.test(cpl) && /#9/.test(cpl) && /#7/.test(cpl) && /#5/.test(cpl));
  check("(4) ⭐ a SAMPLE area does not get an advocacy doctrine",
    !/THE DOCTRINE/.test(de) && /MARKED SAMPLE/.test(de));
  check("(4) ⚠ …and is told not to propose an instrument, pathway or rank",
    /Do NOT recommend an instrument/.test(de) && /return those keys as null/.test(de));
  check("(4) the doctrine's area list is explicit, not a string sniff",
    GR._doctrineAreas.cpl === 1 && GR._doctrineAreas["dual-enrollment"] === undefined);
});

// ── (5) the three server lists agree ────────────────────────────────────────
block("(5)", () => {
  const known = /const KNOWN_SURFACES = new Set\(\[([\s\S]*?)\]\)/.exec(TS);
  const draft = /const DRAFTING_SURFACES = new Set\(\[([\s\S]*?)\]\)/.exec(TS);
  const caps = /const SURFACE_QUERY_CAPS[^{]*\{([\s\S]*?)\n\};/.exec(TS);
  check("(5) all three server lists are readable", !!(known && draft && caps));
  if (!(known && draft && caps)) return;
  const S = GR._GR_ANALYSIS_SURFACE;
  // ⚠️ QUOTED ON BOTH SIDES, ALWAYS. A bare indexOf(S) matches inside
  // "gr-analysis-typo", so the check could not fail for the single most likely
  // real mistake — a mistyped key. Found by perturbation: renaming the
  // SURFACE_QUERY_CAPS key left this suite GREEN, which is indistinguishable
  // from the guard holding.
  const Q = '"' + S + '"';
  check("(5) ⭐ the surface is KNOWN (else it normalizes to null)", known[1].indexOf(Q) >= 0);
  check("(5) ⭐ …is a DRAFTING surface (else it gets the conversational doctrine)",
    draft[1].indexOf(Q) >= 0);
  check("(5) ⚠ …and has its OWN CAP (else it silently inherits 1,000 chars)",
    caps[1].indexOf(Q) >= 0);
  // The two places the scope doc forgot, and the memory table remembered.
  const sql = fs.readFileSync(path.join(ROOT, "chatbox/supabase_sierra_guidance.sql"), "utf8");
  const picker = fs.readFileSync(path.join(ROOT, "sierra_training.js"), "utf8");
  check("(5) ⭐ the CHECK constraint allows it (else a curator cannot scope a rule to it)",
    sql.indexOf("'" + S + "'") >= 0);
  check("(5) ⭐ the curator picker offers it (the third place, and the classic miss)",
    picker.indexOf('"' + S + '"') >= 0);
});

// ── (6) the reply is parsed strictly ────────────────────────────────────────
block("(6)", () => {
  const good = JSON.stringify({
    citations: ["T5 §55050", 42], citations_related: [{ cite: "T5 §55063", why: "residency floor" }, "nope"],
    pathway: ["g", "y", "purple"], ed_first: "No", instrument: "§55050",
    blast_why: "why", blast_rank_suggested: 4.4, reasoning: "because",
  });
  const p = GR._parseAnalysis("```json\n" + good + "\n```");
  check("(6) a code fence is tolerated", p.instrument === "§55050");
  check("(6) ⚠ non-string citations are dropped, not coerced", p.citations.length === 1);
  check("(6) ⚠ a pathway value outside g/y/r is dropped", p.pathway.join(",") === "g,y");
  check("(6) a malformed related entry is dropped", p.citations_related.length === 1);
  check("(6) a fractional rank is rounded", p.blast_rank_suggested === 4);
  check("(6) an out-of-vocabulary ed_first becomes null",
    GR._parseAnalysis(JSON.stringify({ ed_first: "maybe" })).ed_first === null);

  // ⚠️ A HALF-PARSED OBJECT WOULD READ AS AN INSTRUMENT DETERMINATION NOBODY MADE.
  let threw = 0;
  for (const bad of ["not json at all", "[1,2,3]", "", "{oops"]) {
    try { GR._parseAnalysis(bad); } catch (e) { threw++; }
  }
  check("(6) ⭐ anything that is not a JSON object is an error, never a default", threw === 4,
    threw + " of 4 threw");
});

// ── (7) a truncated envelope names the DEPLOY, not the model ────────────────
// ⭐ THE FAILURE THIS FEATURE IS MOST LIKELY TO HAVE. The client ships with Pages
// on merge; the Edge Function needs a separate dispatch. In between, the server
// does not know `gr-analysis`, normalizes it to null, applies the 1,000-char
// chat cap and eats the output contract at the end of the envelope — so the
// model answers in prose. The client's own budget check CANNOT see this: it
// compares against the cap this repo declares, not the deployed one.
// ⚠️ THE WHOLE ASYNC TAIL IS WRAPPED, AND report() RUNS IN `finally`. Session
// 193 read five perturbations as "0 FAIL" because the suite CRASHED and stopped
// — every check below the crash went unreported while the exit code said only
// "something failed". An async block that throws before its reporter does
// exactly that, so the reporter is not allowed to be skippable.
(async () => {
  try {
  const realFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    text: async () => "Credit for Prior Learning lets students earn credit for what they know.",
  });
  try {
    await GR._deepFetch(ROW7, ALL, LANE);
    check("(7) ⭐ a non-JSON reply is an error, not a silent empty analysis", false,
      "it resolved instead of rejecting");
  } catch (e) {
    const m = String(e && e.message);
    check("(7) ⭐ a non-JSON reply is an error, not a silent empty analysis", m.length > 0);
    check("(7) ⭐ …and it names the DEPLOY as the likely cause, not the model",
      /deploy/i.test(m) && /gr-analysis/.test(m), m.slice(0, 160));
    check("(7) …and tells the reader which workflow to run",
      /cpl-chat-deploy/.test(m), m.slice(0, 160));
  }

  // ⚠️ And the budget refusal must fire BEFORE any network call — sending a
  // knowingly-oversized envelope is the silent content swap, not a retryable error.
  let called = 0;
  global.fetch = async () => { called++; return { ok: true, text: async () => "{}" }; };
  const fat = Object.assign({}, ROW7, { summary: "x".repeat(GR._GR_QUERY_BUDGET + 5000) });
  try {
    await GR._deepFetch(fat, ALL, LANE);
    check("(7) ⚠ an over-budget row is refused before it is sent", false, "it was sent");
  } catch (e) {
    check("(7) ⚠ an over-budget row is refused before it is sent", called === 0,
      "fetch was called " + called + " times");
    check("(7) …and the refusal says what to shorten",
      /Shorten the Approach/.test(String(e.message)));
  }
  global.fetch = realFetch;
  } catch (e) {
    check("(7) — driver threw: " + (e && e.message), false);
  } finally {
    report();
  }
})();

function report() {
let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
}
