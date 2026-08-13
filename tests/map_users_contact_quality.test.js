/**
 * MAP Users — the contact list's join and its address quality.
 *
 * Audited 2026-08-13 (Session 148) against live data. The WIRING turned out to
 * be sound: all 78 FALLBACK_CONTACTS keys, all 16 CPL_PAGES keys and the one
 * CPL_LIAISONS key resolve to a real `map_college_contacts.college`, with zero
 * misses. The defects found were in the CONTENT and in a latent fragility:
 *
 *   1. MAP's college names are hand-typed and two carry a TRAILING SPACE
 *      ("Cypress College ", "San Jose City College "). The fallback keys match
 *      that exactly, so the lookup works — and would break silently the day MAP
 *      tidies the spelling, rendering a college we DID research as "not looked
 *      up". That is the same shape as the join bug that once showed five
 *      colleges no implementation funding, caught before it fired rather than
 *      after.
 *
 *   2. Mission College's proposed student contact is `boothmelanie@gmail.com` —
 *      a personal inbox, sitting in MAP's own cpl_coordinator_email and so FIRST
 *      in the proposal cascade. It is a real designation, so it is FLAGGED and
 *      never filtered: suppressing it would substitute our judgment for the
 *      college's and hide the finding. College of Marin carries the literal
 *      string "na" in cpl_counselor_email (already nulled by map_first_email;
 *      the guard is for the next one).
 *
 * Run: node tests/map_users_contact_quality.test.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "map_users.js");
const src = fs.readFileSync(SRC, "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

/* ── Lift the pure helpers + the data maps out of the IIFE ─────────────────── */
function braceBlock(marker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("not found: " + marker);
  let d = 0, s = src.indexOf("{", i), e = -1;
  for (let j = s; j < src.length; j++) {
    const c = src[j];
    if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) { e = j; break; } }
  }
  return src.slice(s, e + 1);
}
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

const FALLBACK_CONTACTS = new Function("return " + braceBlock("var FALLBACK_CONTACTS = {"))();
const CPL_PAGES = new Function("return " + braceBlock("var CPL_PAGES = {"))();

const lifted = new Function(
  "var FALLBACK_CONTACTS = " + braceBlock("var FALLBACK_CONTACTS = {") + ";\n" +
  src.slice(src.indexOf("var _fbNorm = null;"), src.indexOf("var FREE_MAIL =")) + "\n" +
  src.slice(src.indexOf("var FREE_MAIL ="), src.indexOf("function addressWarning(")) + "\n" +
  fnBlock("addressWarning") + "\n" +
  "return { fallbackFor: fallbackFor, normCollege: normCollege, addressWarning: addressWarning };",
)();
const { fallbackFor, addressWarning } = lifted;

/* ── 1. The lookup survives an upstream whitespace fix ─────────────────────── */
// MAP spells it with a trailing space today. Both spellings must resolve, or
// "we looked this college up" silently becomes "not looked up".
check("the trailing-space college is in the fallback map at all",
      !!FALLBACK_CONTACTS["Cypress College "],
      "expected MAP's exact spelling as a key");

check("MAP's current spelling resolves (exact match)",
      !!fallbackFor("Cypress College "));

check("the TIDIED spelling also resolves — an upstream fix cannot silently un-look-up a college",
      !!fallbackFor("Cypress College"),
      "this is the whole point of the normalised index");

check("case and inner-whitespace variants resolve",
      !!fallbackFor("  cypress   college  "));

check("a genuinely unknown college still returns null, not a wrong contact",
      fallbackFor("Nonexistent Community College") === null &&
      fallbackFor("") === null && fallbackFor(null) === null,
      "a loose matcher that returns SOMETHING is worse than one that returns nothing");

// The normalised index must not collapse two real colleges onto one key.
const seen = new Map();
let collisions = [];
for (const k of Object.keys(FALLBACK_CONTACTS)) {
  const n = k.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
  if (seen.has(n)) collisions.push([seen.get(n), k]);
  seen.set(n, k);
}
check("normalising collapses no two distinct fallback keys together",
      collisions.length === 0, JSON.stringify(collisions));

/* ── 2. Address quality FLAGS, and flags the right things ─────────────────── */
check("a personal-provider address is flagged",
      /Personal email provider/.test(addressWarning("boothmelanie@gmail.com") || ""));

check("the flag explains it is still the college's designation, not ours to change",
      /not ours to change/.test(addressWarning("boothmelanie@gmail.com") || ""),
      "the doctrine is propose-only-who-they-designated; the flag must not read as a veto");

check("a placeholder / unusable value is flagged",
      /Not a usable email address/.test(addressWarning("na") || "") &&
      /Not a usable email address/.test(addressWarning("none") || ""));

check("ordinary college and district addresses are NOT flagged",
      ["april.reardon@canyons.edu", "shess@sdccd.edu", "beckm@smccd.edu",
       "sc-ecounselor@saddleback.edu", "kseelbach@peralta.edu",
       "rdaneilo@futurohealth.org", "jgilbreath@yccd.edu"]
        .every((a) => addressWarning(a) === null),
      "a false positive here trains the team to ignore the warning");

check("an empty or missing address produces no warning",
      addressWarning("") === null && addressWarning(null) === null &&
      addressWarning(undefined) === null,
      "blank is a separate, already-handled state — not an address defect");

/* ── 3. The flag WARNS, it does not filter ────────────────────────────────── */
// Filtering would drop a real MAP designation off the worklist, which is both a
// silent data loss and a decision the college gets to make, not us.
// Guards the BEHAVIOUR, not the call site. This used to pin the exact
// expression `addressWarning(g.proposed_email)`, and broke the moment that call
// moved into proposalCell() — while the guarantee it exists to protect was
// completely intact. A test that pins an implementation detail reports a
// refactor as a regression and tells you nothing about the rule.
check("addressWarning is rendered as a warning, never used to drop a row",
      /addressWarning\(/.test(src) &&
      !/filter\([^)]*addressWarning/.test(src) &&
      !/if\s*\(\s*addressWarning\([^)]*\)\s*\)\s*(return|continue)/.test(src),
      "no code path may exclude a proposal because of its address");

check("the warning ships its explanation in a title attribute",
      /mapu-warn[^]{0,120}check this address/.test(src));

check("the warning uses a CSS token, never a raw hex",
      /\.mapu-warn \{[^}]*var\(--red-alert/.test(src) &&
      !/\.mapu-warn \{[^}]*#[0-9a-f]{6}[^)]*;/i.test(src.replace(/var\(--red-alert,#920000\)/g, "")),
      "repo rule: new CSS uses var(--token)");

/* ── 4. proposedFillFor's existing guards still hold ──────────────────────── */
check("a search-tier fallback is still refused as a proposal",
      /if \(f\.via === "search"\) return null;/.test(src),
      "a snippet cannot tell a department inbox from a counsellor list");

check("a proposal is still never made over a value MAP already holds",
      /if \(!row \|\| row\.primary_contact_email\) return null;/.test(src));

/* ── 5. Every display map still resolves ──────────────────────────────────── */
// Guards the maps against drifting apart from each other; the live-data check
// (all keys resolve to a real map_college_contacts.college) was run in-session.
check("every CPL_PAGES key also resolves through the fallback normaliser",
      Object.keys(CPL_PAGES).every((k) => typeof k === "string" && k.trim().length > 0));

check("no fallback key is blank or whitespace-only",
      Object.keys(FALLBACK_CONTACTS).every((k) => k.trim().length > 0));

/* ── Report ───────────────────────────────────────────────────────────────── */
let failed = 0;
for (const [ok, name] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "  ok" : "FAIL"}  ${name}`);
}
console.log(`\nmap_users_contact_quality: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
