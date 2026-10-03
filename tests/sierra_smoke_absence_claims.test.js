// Smoke 7c and 7s: an absence CLAIM fails, an absence REPORT passes (2026-09-30).
//
// Run 36779373913 went red on two right answers. Sierra wrote "The catalog data
// lists no Orange County community college currently teaching a full LVN entry
// program — Golden West, Cypress, and Saddleback do offer LVN-to-RN bridge
// programs" (the honest form docs/kb-notes/methodology-an-absence-in-the-data-is-
// a-statement-about-the-data.md asks for: name the instrument, then the entries
// it holds) and "No San Gabriel Valley college has yet articulated CNA-to-LVN
// specifically" (about articulation, true, and a different claim). The patterns
// now run through answer_must_not_claim_absence, which sets those two shapes
// aside first. This test runs THAT helper, from chatbox/smoke_test.sh, in bash,
// with the smoke's own two patterns, so the file cannot drift from what is
// tested: the recorded answers pass, and the false claims Sam called flat wrong
// still fail.
//
// Windows: needs bash (Git Bash). Run from repo root: `npm test`
// (or `node tests/sierra_smoke_absence_claims.test.js`).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const SMOKE = fs.readFileSync(path.join(__dirname, "..", "chatbox", "smoke_test.sh"), "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const at = SMOKE.indexOf("answer_must_not_claim_absence() {");
const fn = at === -1 ? "" : SMOKE.slice(at, SMOKE.indexOf("\n}\n", at) + 3);
check("the helper is in the smoke script", !!fn);
function pattern(labelStart) {
  const line = SMOKE.split("\n").find((l) => l.startsWith("answer_must_not_claim_absence -i ") && l.includes(labelStart));
  const m = line && /^answer_must_not_claim_absence -i "(.*)" "(.*)"$/.exec(line);
  return m ? m[1] : null;
}
const RE_7C = pattern("7c ⭐ never states a catalog absence as a fact about Orange County");
const RE_7S = pattern("7s ⭐ never says the catalog shows no San Gabriel Valley college");
check("both checks call the helper with their own pattern", !!RE_7C && !!RE_7S);

function fails(answer, re) {
  const r = spawnSync("bash", ["-c", fn + '\nfail=0\nanswer_must_not_claim_absence -i "$RE" probe >/dev/null\necho "$fail"'],
    { env: Object.assign({}, process.env, { LAST_ANSWER: answer, RE: re }), encoding: "utf8" });
  // The helper reads $LAST_ANSWER as a shell variable, which the environment supplies.
  return String(r.stdout).trim() === "1";
}

// Recorded answers, run 36779373913 (2026-09-30 21:26 UTC).
const OC_REPORT = "The catalog data lists no Orange County community college currently teaching a full LVN entry program — "
  + "Golden West, Cypress, and Saddleback do offer LVN-to-RN bridge programs, but those are for people who already hold an LVN license.";
const OC_ARTIC = "No Orange County college has yet articulated a CNA credential toward LVN coursework, so any request there would be a first.";
const SGV_ARTIC = "No San Gabriel Valley college has yet articulated CNA-to-LVN specifically, so your request would likely be a first for them.";
// Recorded, run 36782710501 (2026-09-30 22:03 UTC): "no" matched inside "notes"
// until the pattern's negation took a word boundary.
const SGV_NOTES = "A few notes on the colleges in the San Gabriel Valley: Pasadena City College, Rio Hondo, and Citrus College "
  + "all teach full LVN programs, and each is well positioned to review a CNA-to-LVN request.";
// Recorded 2026-10-01 (S311), after #1800 had Sierra write the place in full: two
// articulation absences in the NOUN form, which the verb-only rule ("has yet
// articulated") missed. Runs 36901536066 and 36899387810. The answers had already
// named three San Gabriel Valley colleges that teach LVN.
const SGV_ARTIC_NOUN = "None of the three San Gabriel Valley colleges above have an existing CPL articulation for CNA-to-LVN "
  + "on file yet — so these are genuine requests to raise with their CPL coordinators, not guaranteed awards.";
const SGV_ARTIC_SHOWS = "No college in the San Gabriel Valley catalog data shows an existing CNA articulation yet, so a request "
  + "to Pasadena, Rio Hondo, or Citrus would be a new one for them to evaluate.";

// Recorded, run 36951885947 (2026-10-02, S314): the adjective form inside markdown
// emphasis. The answer had already named Rio Hondo, Pasadena and Citrus as LVN colleges.
const SGV_ARTIC_ADJ = "A couple of honest caveats: none of the three San Gabriel Valley colleges above currently has an "
  + "*articulated* CPL exhibit matching CNA to LVN credit specifically — so this would be a request for the college to review.";

// Recorded, run 37129004481 (2026-10-03, S319, the smoke after the cpl-chat deploy):
// "exhibit ... articulating", the -ing form beside MAP's word for the record. The
// answer had already named Rio Hondo VN 61, Pasadena NURS 102 and Citrus VNRS 150.
const SGV_ARTIC_EXHIBIT = "No San Gabriel Valley college has an exhibit specifically articulating CNA-to-LVN credit yet, "
  + "so this would be a request you're initiating, not one already on file — which is exactly how new articulations get built.";

if (RE_7C && RE_7S && fn) {
  check("7s: an articulation absence with \"an exhibit ... articulating\" passes", !fails(SGV_ARTIC_EXHIBIT, RE_7S));
  check("7s: \"has no exhibit for LVN\" passes as an articulation absence",
    !fails("No San Gabriel Valley college has an existing LVN exhibit yet.", RE_7S));
  check("7s: …and neither excuses a bare program claim beside it",
    fails(SGV_ARTIC_EXHIBIT + " No San Gabriel Valley college offers an LVN entry program.", RE_7S));
  check("7s: an articulation absence in the adjective form, in markdown emphasis, passes (\"has an *articulated* CPL exhibit\")",
    !fails(SGV_ARTIC_ADJ, RE_7S));
  check("7s: …and does not excuse a bare program claim beside it",
    fails(SGV_ARTIC_ADJ + " No San Gabriel Valley college offers an LVN entry program.", RE_7S));
  check("7c: the recorded catalog report passes", !fails(OC_REPORT, RE_7C));
  check("7c: the recorded articulation sentence passes", !fails(OC_ARTIC, RE_7C));
  check("7c: the whole recorded pair passes together", !fails(OC_REPORT + " " + OC_ARTIC, RE_7C));
  check("7c: \"No Orange County colleges teach LVN\" still fails", fails("No Orange County colleges currently teach LVN.", RE_7C));
  check("7c: \"None of the Orange County colleges offer\" still fails",
    fails("None of the Orange County colleges offer a vocational nursing program.", RE_7C));
  check("7c: an attributed report does not excuse a bare claim beside it",
    fails(OC_REPORT + " No Orange County college teaches LVN.", RE_7C));
  check("7s: the recorded articulation sentence passes", !fails(SGV_ARTIC, RE_7S));
  check("7s: \"notes on the colleges in the San Gabriel Valley … teach full LVN\" passes (no word inside a word)",
    !fails(SGV_NOTES, RE_7S));
  check("7s: \"None of the colleges near the San Gabriel Valley run an LVN entry program\" still fails",
    fails("None of the colleges near the San Gabriel Valley run an LVN entry program.", RE_7S));
  check("7s: \"No San Gabriel Valley college offers an LVN entry program\" still fails",
    fails("No San Gabriel Valley college offers an LVN entry program.", RE_7S));
  check("7s: \"I don't see a San Gabriel Valley college with vocational nursing\" still fails",
    fails("I don't see a San Gabriel Valley college with vocational nursing.", RE_7S));
  check("7s: v72's shape, \"no colleges in the San Gabriel Valley\", still fails",
    fails("There are no colleges in the San Gabriel Valley with an LVN program.", RE_7S));
  check("7s: an articulation absence in the noun form passes (\"have an existing CPL articulation\")",
    !fails(SGV_ARTIC_NOUN, RE_7S));
  check("7s: …and with \"shows an existing CNA articulation\"", !fails(SGV_ARTIC_SHOWS, RE_7S));
  check("7s: a noun-form articulation sentence does not excuse a bare program claim beside it",
    fails(SGV_ARTIC_NOUN + " No San Gabriel Valley college offers an LVN entry program.", RE_7S));
  check("7s: \"none of the San Gabriel Valley colleges have an LVN program\" still fails (a program is not an articulation)",
    fails("None of the San Gabriel Valley colleges have an LVN program.", RE_7S));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
