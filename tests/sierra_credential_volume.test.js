/**
 * Routes CRED·VOLUME + COLLEGE·ADOPT wiring in cpl-chat — static guards.
 *
 * WHAT THIS EXISTS TO PREVENT, concretely. Sierra was asked "how many students
 * statewide are eligible for credit for a CompTIA cert, and for which certs?"
 * It replied that no statewide recommendation had been adopted — MAP holds TEN
 * for CompTIA — and then listed "A+, Network+, Security+, Cloud+, CySA+" as
 * certs "commonly articulated nationally". That list was ACCIDENTALLY CORRECT,
 * which is worse than wrong: nobody catches it, and the next guess misses.
 *
 * So the guards below are deliberately weighted toward the two failure modes
 * that rot silently:
 *
 *   1. STATING A FLOOR AS A TOTAL. Only ~4% of student rows can be named, so
 *      every count is a floor. A count emitted without its coverage will be
 *      quoted as a systemwide figure in a report — the same failure as reading
 *      "not in this dataset" as zero. The count and its denominator must be
 *      inseparable in the emitted context, not merely mentioned in a caveat.
 *
 *   2. FILLING SILENCE FROM WORLD KNOWLEDGE. The model knows what CompTIA sells.
 *      The prohibition has to be explicit, because a fluent invented list is
 *      indistinguishable from a retrieved one at read time.
 *
 * Same static-only approach as sierra_credential_route.test.js: there is no deno
 * in the sandbox, so this guards the source text, not runtime behaviour.
 *
 * Run: node tests/sierra_credential_volume.test.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

/* ── 1. Boot-fatal syntax ──────────────────────────────────────────────────── */
const backticks = (src.match(/(?<!\\)`/g) || []).length;
check("template literals balanced (VOLUME_RULE is a template literal)",
      backticks % 2 === 0,
      `found ${backticks} unescaped backticks — an odd count is an unterminated ` +
      `literal, a parse error that kills the whole function at boot`);

/* ── 2. The RPCs are actually called, by their real names ──────────────────── */
check("calls search_credential_volume", /rpc\(\s*["']search_credential_volume["']/.test(src));
check("calls college_adoption_opportunities",
      /rpc\(\s*["']college_adoption_opportunities["']/.test(src));

/* ── 3. The handler's client is `sb`, not `supabase` ───────────────────────── */
check("volume lookups receive the handler's client (`sb`)",
      /fetchCredentialVolume\(searchText,\s*sb\)/.test(src) &&
      /fetchAdoptionOpportunities\([^)]*,\s*sb\)/.test(src),
      "the handler's client is `sb`; `supabase` is a ReferenceError on every request");

/* ── 4. volumeContext is threaded end to end ───────────────────────────────── */
// Three separate places, and missing any one is silent: the parameter, the
// emitted prompt body, and the call site. A context built but never passed
// looks completely fine in review.
check("buildSystemPrompt accepts volumeContext",
      /volumeContext:\s*string\s*=\s*""/.test(src));
check("volumeContext is emitted into the prompt body",
      /\$\{volumeContext\}/.test(src));
check("VOLUME_RULE is attached when the section is present",
      /body: VOLUME_RULE, appliesWhen: "volume"/.test(src));
// Assert that volumeContext REACHES buildSystemPrompt, not that it is the last
// argument. Pinning the position made this fail the moment alignmentContext was
// appended (Session 148) — a passing test that breaks on an unrelated addition
// is testing the call's punctuation, not its behaviour.
check("the handler passes volumeContext to buildSystemPrompt",
      /buildSystemPrompt\([^;]*\bvolumeContext\b[^;]*\)/.test(src));

/* ── 5. The floor travels WITH the number ──────────────────────────────────── */
const volFn = (src.match(/function buildVolumeContext[\s\S]*?\n\}/) || [""])[0];
check("buildVolumeContext exists", volFn.length > 0);
check("emitted student counts are marked as floors, not totals",
      /AT LEAST/.test(volFn),
      "a bare count will be quoted as a systemwide total");
check("adopter coverage is emitted alongside every credential",
      /colleges_adopted/.test(volFn) && /colleges_with_student_data/.test(volFn),
      "the denominator must be inseparable from the number, not left to prose");
check("rule forbids stating the bare count as a total",
      /FLOOR/.test(src) && /never a zero|NOT A ZERO/i.test(src));
check("a college we cannot see is a blind spot, not a zero",
      /BLIND SPOT/i.test(src),
      "absence of student data must never be reported as 'that college has none'");

/* ── 6. FERPA small-cell handling ──────────────────────────────────────────── */
// Sam's refinement: report the RANGE, don't refuse. "Fewer than 10" confirms
// activity exists without disclosing a count — strictly more useful than
// silence, and still safe.
check("suppressed cells emit the phrase 'fewer than 10'",
      /FEWER THAN 10/i.test(volFn),
      "the count is null but students_suppressed survives, so the range is sayable");
check("rule names FERPA as the reason when asked",
      /FERPA/.test(src));
check("rule forbids estimating or deriving a suppressed value",
      /never estimate/i.test(src) && /subtract/i.test(src),
      "a suppressed cell must not be recoverable by subtraction from a total");
check("reporting 'fewer than 10' is framed as a complete answer, not a failure",
      /not a failure to retrieve/i.test(src));

/* ── 7. No filling silence from world knowledge ────────────────────────────── */
check("rule forbids supplying credentials from general knowledge",
      /NEVER supply a credential[\s\S]{0,200}general knowledge/i.test(src),
      "this is the exact CompTIA failure: an invented list that happened to be right");
check("rule points the gap at MAP@rccd.edu rather than guessing",
      /MAP@rccd\.edu/.test((src.match(/const VOLUME_RULE[\s\S]*?`;/) || [""])[0]));

/* ── 8. Zero student data is a RESULT, distinct from suppression ───────────── */
// These render identically if you are careless, and they mean opposite things:
// "fewer than 10 real students" vs "nobody has been awarded credit here yet".
check("no-student-data is reported distinctly from suppression",
      /No student records carry this credential yet/.test(volFn),
      "suppressed and empty must not collapse into the same sentence");
check("rule says empty does not mean unavailable",
      /does NOT mean the credential is unavailable/i.test(src));

/* ── 9. Adoption answers must be specific ──────────────────────────────────── */
check("adoption opportunities name peer counts",
      /peers_already_adopted/.test(volFn));
check("rule demands named credentials over category advice",
      /you could explore industry certifications/i.test(src),
      "the rule cites the vague form explicitly as the thing NOT to do");

/* ── 10. A lookup failure must not take the answer down ────────────────────── */
check("volume lookup is wrapped so a failure degrades gracefully",
      /try\s*\{[\s\S]{0,600}fetchCredentialVolume[\s\S]{0,600}\}\s*catch/.test(src));
check("adoption lookup is skipped when no college is known",
      /if\s*\(!college\)\s*return null/.test(src),
      "'what could I adopt?' is meaningless without a subject");

/* ── 11. The grain is never queried live ───────────────────────────────────── */
check("no direct read of the 537,908-row student grain",
      !/from\(["']map_student_credit["']\)/.test(src),
      "aggregating the grain measured >60s against a 1.7-5.0s budget; " +
      "these routes read pre-computed rollups only");

/* ── report ────────────────────────────────────────────────────────────────── */
let failed = 0;
for (const [ok, name] of results) {
  if (!ok) failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
}
console.log(`\nsierra_credential_volume: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
