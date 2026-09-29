/**
 * Credit-recommendation wiring in cpl-chat — BEHAVIOURAL, not just static.
 *
 * Session 147 published 2,205 rows carrying every credential's full credit
 * recommendation set. Nothing read them, so Sierra kept answering from
 * chatbox_credentials.ccc_rec — ONE modal string — and told Sam that POST Basic
 * Academy carries a single course when the statewide set is ten lines that were
 * already public on the CPL Fact Sheet.
 *
 * The existing Sierra tests are source-regex guards because there is no deno in
 * the sandbox. That is fine for "is the RPC called", useless for "does the
 * context actually LIST the ten courses" — which is the only thing that was
 * ever wrong. So this test EXTRACTS the three pure renderers out of the .ts,
 * strips their type annotations, and RUNS them against fixtures copied verbatim
 * from live RPC output (POST Basic Academy and Carpenters Apprenticeship —
 * Carpenter, read from the production database on 2026-08-13).
 *
 * Assert what the CONTEXT contains, never that an answer reads better: a model
 * handed the wrong rows still writes fluent prose.
 *
 * Run: node tests/sierra_credential_recs.test.js
 */
const fs = require("fs");
const path = require("path");
// ONE stripper in the repo, not two. tests/lib/lift_ts.js exists precisely so a
// second copy cannot drift; this file supplies its own BOUNDARIES (brace
// matching rather than markers) but never its own type-stripping.
const { stripTypes } = require("./lib/lift_ts");

const SRC = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

/* ── Extract a function by brace-matching, then strip TS annotations ───────── */
function extract(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`function ${name} not found in cpl-chat/index.ts`);
  let i = src.indexOf("{", start), depth = 0, end = -1;
  // Brace-match rather than regex: these bodies contain braces inside template
  // literals and object literals, so any non-counting approach mis-slices them.
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  return src.slice(start, end);
}

const strip = stripTypes;

let renderRecLines, buildCredentialContext, buildVolumeContext;
let extractionError = null;
try {
  // renderAdopters must be in the bundle: buildCredentialContext has called it
  // since #1178, so evaluating the bundle without it threw "renderAdopters is
  // not defined" — this suite had been RED on main ever since, and the crash
  // read as an extraction failure rather than as a missing dependency.
  const bundle = strip(
    [extract("renderRecLines"), extract("renderAdopters"),
     extract("buildCredentialContext"), extract("buildVolumeContext")]
      .join("\n\n"),
  );
  // eslint-disable-next-line no-new-func
  ({ renderRecLines, buildCredentialContext, buildVolumeContext } = new Function(
    bundle + "\nreturn { renderRecLines, buildCredentialContext, buildVolumeContext };",
  )());
} catch (e) {
  extractionError = e;
}
check("the three renderers extract and evaluate", !extractionError,
      extractionError && String(extractionError.message));

/* ── Fixtures: copied verbatim from live RPC output, 2026-08-13 ───────────── */
// POST is the case Sam reported. Ten lines, nine carrying a C-ID, eight
// DISTINCT — AJ 110 appears twice, which is why no single count is safe.
const POST_RECS = {
  unified_title: "POST Basic Academy",
  rec_kind: "statewide_authoritative",
  n_recs: 10, n_cid_recs: 8, n_cid_lines: 9, n_non_cid_recs: 1,
  n_adopter_colleges: 35, cid_repeats: ["AJ 110"],
  recs: [
    { cid: "AJ 160", title: "Community Relations", units: "3", credit: "3 hours in Community Relations" },
    { cid: "AJ 124", title: "Criminal Evidence", units: "3", credit: "3 hours in Criminal Evidence" },
    { cid: "AJ 140", title: "Criminal Investigation", units: "3", credit: "3 hours in Criminal Investigation" },
    { cid: "AJ 120", title: "Criminal Law", units: "3", credit: "3 hours in Criminal Law" },
    { cid: "AJ 122", title: "Criminal Procedures", units: "3", credit: "3 hours in Criminal Procedures" },
    { cid: "AJ 110", title: "Intro to Administration of Justice", units: "3", credit: "3 hours in Intro to Administration of Justice" },
    { cid: "AJ 200", title: "Introduction to Corrections", units: "3", credit: "3 hours in Introduction to Corrections" },
    { cid: "AJ 220", title: "Juvenile Law and Procedures", units: "3", credit: "3 hours in Juvenile Law and Procedures" },
    { cid: "AJ 110", title: "Physical Training and Health Education (CSU GE Area E)", units: "3", credit: "3 hours in Physical Training and Health Education (CSU GE Area E)" },
    { cid: null, title: "Introduction to Policing (Elective Course)", units: "3", credit: "3 hours in Introduction to Policing (Elective Course)" },
  ],
};

// A never-adopted statewide exhibit — the class that was unreachable entirely
// until 2026-08-13 (ccc_rec null, so the CRED-STD gate excluded it).
const CARP_RECS = {
  unified_title: "Carpenters Apprenticeship — Carpenter",
  rec_kind: "statewide_authoritative",
  n_recs: 8, n_cid_recs: 0, n_cid_lines: 0, n_non_cid_recs: 8,
  n_adopter_colleges: 0, cid_repeats: null,
  recs: [
    { cid: null, title: "Carpentry 1", units: "3", credit: "3 hours in Carpentry 1" },
    { cid: null, title: "Carpentry 2", units: "3", credit: "3 hours in Carpentry 2" },
    { cid: null, title: "Carpentry 3", units: "3", credit: "3 hours in Carpentry 3" },
    { cid: null, title: "Carpentry 4", units: "3", credit: "3 hours in Carpentry 4" },
    { cid: null, title: "Construction Safety", units: "2", credit: "2 hours in Construction Safety" },
    { cid: null, title: "Blueprint Reading", units: "2", credit: "2 hours in Blueprint Reading" },
    { cid: null, title: "Rigging", units: "1", credit: "1 hour in Rigging" },
    { cid: null, title: "Scaffolding", units: "1", credit: "1 hour in Scaffolding" },
  ],
};

// A local_modal row — different shape: colleges + example_course, no title.
const LOCAL_RECS = {
  unified_title: "Department of Veterans Affairs Police Officer (VA POST)",
  rec_kind: "local_modal",
  n_recs: 2, n_cid_recs: 0, n_cid_lines: 0, n_non_cid_recs: 2,
  n_adopter_colleges: 5, cid_repeats: null,
  recs: [
    { cid: null, credit: "3 hours in Criminal Law", colleges: 5, example_course: "CRIM B2" },
    { cid: null, credit: "3 hours in Criminal Investigation", colleges: 5, example_course: "CRIM B8" },
  ],
};

const recMap = new Map([
  [POST_RECS.unified_title, POST_RECS],
  [CARP_RECS.unified_title, CARP_RECS],
  [LOCAL_RECS.unified_title, LOCAL_RECS],
]);

if (!extractionError) {
  /* ── 1. THE BUG SAM REPORTED: all ten courses, not one ──────────────────── */
  const postCtx = buildCredentialContext(
    [{ unified_title: "POST Basic Academy", issuer: "CA POST", ccc_rec: "3 hours in Criminal Investigation", n_adopters: 35 }],
    null, recMap);

  const missing = POST_RECS.recs.map((r) => r.title).filter((t) => !postCtx.includes(t));
  check("POST context carries ALL TEN course titles, not just the modal one",
        missing.length === 0,
        `missing from the context: ${JSON.stringify(missing)}`);

  check("POST context carries the distinct C-IDs",
        ["AJ 160", "AJ 124", "AJ 140", "AJ 120", "AJ 122", "AJ 110", "AJ 200", "AJ 220"]
          .every((c) => postCtx.includes(c)));

  // The whole point: ccc_rec named ONE of the ten. If the context still leads
  // with it as "the statewide recommendation", nothing has been fixed.
  check("the single-string ccc_rec no longer stands in for the record",
        !/Statewide recommendation: 3 hours in Criminal Investigation/.test(postCtx),
        "ccc_rec is still being printed as though it were the whole recommendation");

  /* ── 2. The AJ 110 repeat is FLAGGED, never resolved ────────────────────── */
  check("the repeated C-ID is flagged with both counts",
        /AJ 110 appears on more than one line/.test(postCtx) &&
        postCtx.includes("10 recommendation lines") &&
        postCtx.includes("9") && postCtx.includes("8 DISTINCT"),
        "Sam ruled the repeat is flagged, never auto-resolved — both counts must ship");

  check("the model is told NOT to resolve the repeat itself",
        /Do NOT silently merge/.test(postCtx));

  /* ── 3. Zero adopters reads as an OPPORTUNITY, never an absence ─────────── */
  const carpCtx = buildCredentialContext(
    [{ unified_title: "Carpenters Apprenticeship — Carpenter",
       issuer: "Carpenters Training Committee for Northern California (CTCNC)",
       ccc_rec: null, n_adopters: 0 }],
    null, recMap);

  check("a never-adopted statewide exhibit still lists its credit",
        CARP_RECS.recs.every((r) => carpCtx.includes(r.title)));

  check("zero adopters is framed as an open opportunity, not unavailability",
        /NONE YET/.test(carpCtx) && /open opportunity/.test(carpCtx) &&
        /NEVER as the credential being unavailable/.test(carpCtx),
        "an absent adoption must never render as the credit not existing");

  // A null ccc_rec printed raw would read "Statewide recommendation: null".
  check("a null ccc_rec never reaches the context as the word 'null'",
        !/recommendation:\s*null/i.test(carpCtx));

  /* ── 4. local_modal renders its own shape, with college counts ──────────── */
  const localCtx = buildCredentialContext(
    null,
    [{ unified_title: LOCAL_RECS.unified_title, statewide: false, n_adopters: 5 }],
    recMap);
  check("local recommendations carry the college count behind each line",
        /5 college\(s\) award this/.test(localCtx) && /CRIM B2/.test(localCtx),
        "without the college count a local variant cannot be weighed");

  check("local lines are labelled as local, not as a statewide standard",
        /no statewide set exists/.test(localCtx) &&
        !/STATEWIDE CREDIT RECOMMENDATIONS/.test(localCtx));

  /* ── 5. The two adoption bands stay SEPARATE ────────────────────────────── */
  // Merging them lets Sierra say "N peers already articulate it" about a
  // credential with zero adopters — a fabricated route to a real counter.
  const adoptCtx = buildVolumeContext(null, [
    { unified_title: "POST Basic Academy", statewide: true, ccc_rec: null,
      peers_already_adopted: 9, band: "peer_leverage", n_rec_lines: 10 },
    { unified_title: "Carpenters Apprenticeship — Carpenter", statewide: true, ccc_rec: null,
      issuer: "CTCNC", peers_already_adopted: 0, band: "ready_to_adopt", n_rec_lines: 8 },
  ], "Bakersfield College", recMap);

  check("ready-to-adopt items appear under their own heading",
        /READY TO ADOPT — statewide standards NO college has taken up yet/.test(adoptCtx));

  check("a zero-adopter item is never described with a peer-adoption count",
        !/Carpenters Apprenticeship — Carpenter[^\n]*peer college\(s\) already articulate/.test(adoptCtx),
        "that claim would send someone to a college that has not articulated it");

  check("the shelf is explicitly not a lesser tier",
        /NOT a lesser tier/.test(adoptCtx) && /zero adopter count is NOT a quality signal/.test(adoptCtx),
        "Sam: unadopted exhibits are deliberate and must stay prominent");

  check("adoption opportunities now carry their actual credit lines",
        adoptCtx.includes("Community Relations") && adoptCtx.includes("Carpentry 1"),
        "an opportunity without its credit is not weighable — this was ccc_rec only");

  /* ── 6. Degrades to the old behaviour, never to nothing ─────────────────── */
  const noRecs = buildCredentialContext(
    [{ unified_title: "POST Basic Academy", issuer: "CA POST", ccc_rec: "3 hours in Criminal Investigation", n_adopters: 35 }],
    null, undefined);
  check("with no recs map the context still renders (falls back to ccc_rec)",
        noRecs.includes("POST Basic Academy") &&
        noRecs.includes("Statewide recommendation: 3 hours in Criminal Investigation"),
        "a failed recs lookup must cost the detail, never the credential section");

  check("renderRecLines is inert on a missing or empty record",
        renderRecLines(undefined) === "" && renderRecLines({ recs: [] }) === "");
}

/* ── 7. Static guards, same failure modes as the sibling Sierra tests ─────── */
const backticks = (src.match(/(?<!\\)`/g) || []).length;
check("template literals balanced (no escaped closing backtick)",
      backticks % 2 === 0,
      `found ${backticks} unescaped backticks — an unterminated literal is a parse ` +
      `error that kills the function at boot`);

check("the batched recs RPC is called by its real name",
      /rpc\("credential_recs_for_titles"/.test(src));

check("the recs lookup receives the handler's client (`sb`)",
      /fetchCredentialRecs\(titles,\s*sb\)/.test(src));

check("CREDIT_RECS_RULE ships whenever either credential section is present",
      /body: CREDIT_RECS_RULE, appliesWhen: "credential_or_volume"/.test(src));

check("the rule forbids answering with a bare count",
      /NEVER answer with just a count/.test(src));

check("the rule forbids giving statewide AND local together",
      /STATEWIDE OVERRIDES LOCAL, AND YOU NEVER GIVE BOTH/.test(src));

/* ── Report ───────────────────────────────────────────────────────────────── */
let failed = 0;
for (const [ok, name] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "  ok" : "FAIL"}  ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exit(1);
