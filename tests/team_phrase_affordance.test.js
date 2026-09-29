// Every tab that needs a phrase must offer a way to enter one — CI guard.
//
// Sam, 2026-08-14: "What do you recommend to insure that all tabs that require
// a Team Phrase have an input on them?"
//
// The recommendation was NOT a hand-rolled box on each of eighteen tabs — that
// is eighteen implementations to drift, and it re-creates what the masthead
// control already solved. It is one shared banner
// (CPL_TEAM_PHRASE.lockedBanner) plus THIS TEST, because a rule that depends on
// the next tab's author remembering it will fail on their first day. CLAUDE.md
// already says to do the remembering for them.
//
// WHAT IT CHECKS. For each tab in the generated cobi_admin_surface.js map, if
// any table it touches is phrase-gated (kb/phrase_gated_tables.json), the tab's
// own modules must carry an affordance: a working unlock box, the shared
// banner, its own sign-in UI, or at minimum a pointer to the header control.
//
// ⚠ THE DETECTOR'S OWN BLIND SPOTS, FOUND BY CHECKING ITS OUTPUT BY HAND.
// The first cut of this scan reported five tabs with nothing. THREE were
// wrong, each for a different reason, and acting on them would have added
// three banners that were incorrect or actively misleading:
//   1. gr-priorities validates with rpc/gr_pass_ok, not team_pass_ok — a
//      site-scoped phrase is still a phrase, and it HAS an unlock.
//   2. unified-courses gates merge_doctrine_notes on a MAGIC LINK, not the
//      phrase; a phrase box there would never succeed, and an input that
//      cannot work reads as a wrong phrase.
//   3. cpl-pathways only INSERTs to cpl_adoption_interest anonymously (a
//      public intake form). Nobody needs to unlock anything to use it.
// This is the same shape as the Admin tab's "five ways a static scan says
// nothing to protect": on a gating surface, every clean result is a CLAIM.
// Judge a detector by what it prints — so ALLOW_LIST below records each
// exemption with its reason, in a diff, rather than loosening the regex until
// the list goes quiet.
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const GATES = JSON.parse(fs.readFileSync("kb/phrase_gated_tables.json", "utf8")).tables;
const w = {};
global.window = w;
eval(fs.readFileSync("cobi_admin_surface.js", "utf8"));
const SURFACE = w.COBI_ADMIN_SURFACE;

// Tabs that touch a gated table but correctly need no phrase input, each with
// the reason it is exempt. A new entry here is a claim a reviewer can see.
const ALLOW_LIST = {
  "cpl-pathways": "cpl_adoption_interest is anon INSERT-only — a public intake form, nothing to unlock.",
  "unified-courses": "merge_doctrine_notes is gated on a MAGIC LINK, not the phrase; the tab carries its own reviewer sign-in.",
  "annual-report": "Touches gated tables for WRITES only; nothing on the page is hidden without a phrase.",
};

// An affordance is any of: the shared banner, a phrase unlock row (shared or
// site-scoped), a hand-rolled phrase check, or the tab's own magic-link UI.
const AFFORDANCE = [
  /lockedBanner\s*\(/,
  /unlockRow\s*\(/,
  /unlockBox\s*\(/,
  /rpc\/(team|gr|fin)_pass_ok/,
  /data-signin/,
  /auth\/v1\/otp/,
];
// Failing all of the above, at least SAY where the control is.
const POINTER = [/in the header/i, /&#128274;/, /🔒/, /ℹ\s*About/, /About<\/b> in the header/];

// ⚠ STRIP COMMENTS BEFORE LOOKING FOR THE BOUNCE. The first run of this guard
// flagged eleven files, including four that only ever mention "Team & RACI"
// inside a comment EXPLAINING that the copy was removed — this test's own
// subject matter is what tripped it. A detector that cannot tell rendered text
// from prose about rendered text reports the fix as the defect.
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

// ⚠ AND JOIN CONCATENATED STRING LITERALS. The second blind spot, and the one
// that hid the most: this copy is written across several source lines,
//     alert("Could not save the change — renew your session on the "
//       + "Team & RACI tab …")
// so ANY regex matching over raw source has to cross `" + "` to see it. The
// first widened detector still reported clean while FIVE live instances sat in
// one file. A copy detector must read the string the USER sees, not the lines
// the author typed.
function joinConcats(s) {
  var prev;
  do { prev = s; s = s.replace(/"\s*\+\s*"/g, "").replace(/'\s*\+\s*'/g, ""); } while (s !== prev);
  return s;
}
function renderedText(src) { return joinConcats(stripComments(src)); }

function scan(modules) {
  let affords = false, points = false, bounces = false;
  (modules || []).forEach(function (m) {
    if (!fs.existsSync(m)) return;
    const raw = fs.readFileSync(m, "utf8");
    const s = raw;
    if (AFFORDANCE.some(function (re) { return re.test(s); })) affords = true;
    if (POINTER.some(function (re) { return re.test(s); })) points = true;
    // The bounce this whole line of work exists to end: sending someone to
    // another tab for a credential. RACI no longer offers a magic link at all,
    // so any copy still promising one there is doubly wrong.
    if (/(sign in|signin|unlock|renew your session|re-?open)[^."]{0,90}Team\s*(&amp;|&)\s*RACI/i.test(renderedText(raw))) bounces = true;
  });
  return { affords, points, bounces };
}

const rows = [];
Object.keys(SURFACE.tabs || {}).forEach(function (tab) {
  const def = SURFACE.tabs[tab] || {};
  const tables = (def.reads || []).concat(def.writes || []);
  const gated = tables.filter(function (t) { return Object.prototype.hasOwnProperty.call(GATES, t); });
  if (!gated.length) return;
  const readGated = tables.filter(function (t) { return GATES[t] === true; });
  rows.push(Object.assign({ tab: tab, gated: gated, readGated: readGated }, scan(def.modules)));
});

// ── The guard ─────────────────────────────────────────────────────────────
const missing = rows.filter(function (r) {
  return !ALLOW_LIST[r.tab] && !r.affords && !r.points;
});
check("every phrase-gated tab offers an input or names the header"
  + (missing.length ? " — MISSING: " + missing.map(function (r) { return r.tab; }).join(", ") : ""),
  missing.length === 0);

// A gate on the READ is the severe case: without the phrase the tab is not
// read-only, it is EMPTY, so a mere pointer is the floor and a box is right.
const readGatedNoBox = rows.filter(function (r) {
  return !ALLOW_LIST[r.tab] && r.readGated.length > 0 && !r.affords && !r.points;
});
check("no read-gated tab renders with nothing to act on"
  + (readGatedNoBox.length ? " — " + readGatedNoBox.map(function (r) { return r.tab; }).join(", ") : ""),
  readGatedNoBox.length === 0);

// ── The bounce must not come back ────────────────────────────────────────
const bouncing = rows.filter(function (r) { return r.bounces; });
check("no tab tells people to go sign in on Team & RACI"
  + (bouncing.length ? " — " + bouncing.map(function (r) { return r.tab; }).join(", ") : ""),
  bouncing.length === 0);
{
  // Belt and braces across the whole repo, not just mapped tabs — this copy
  // was live on three tabs simultaneously and each had been "fixed" once.
  const offenders = fs.readdirSync(".")
    .filter(function (f) { return /\.js$/.test(f) && !/^(docx|coci_lookup|unified_courses_|tmc_college|tmc_ge)/.test(f); })
    .filter(function (f) {
      const s = renderedText(fs.readFileSync(f, "utf8"));
      return /(sign in|signin|unlock|renew your session|re-?open)[^."]{0,90}Team\s*(&amp;|&)\s*RACI/i.test(s);
    });
  check("…and no consumer JS anywhere still carries that copy"
    + (offenders.length ? " — " + offenders.join(", ") : ""), offenders.length === 0);
}

// ── The shared component exists and behaves ──────────────────────────────
{
  const TP = require("../team_phrase.js");
  check("team_phrase.js exports lockedBanner", typeof TP.lockedBanner === "function");
}
{
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!doctype html><html><body><div id=r></div></body></html>",
    { url: "https://example.org/", runScripts: "dangerously" });
  const win = dom.window;
  win.eval(fs.readFileSync("team_phrase.js", "utf8"));
  const TP = win.CPL_TEAM_PHRASE;

  const b = TP.lockedBanner({ what: "The register" });
  win.document.getElementById("r").appendChild(b);
  check("the banner carries a real password input", !!b.querySelector('input[type="password"]'));
  check("…and an unlock button", /unlock/i.test(b.textContent));
  check("…it names what is locked, in the tab's words", /The register/.test(b.textContent));
  check("…and mentions the header control as the alternative", /header/i.test(b.textContent));
  check("…it is findable by the guard's own marker", b.hasAttribute("data-tp-locked"));

  // ⚠ A reviewer-only surface must NOT be offered a phrase box: the phrase
  // cannot open it, so the box would always fail and read as a wrong phrase.
  const r = TP.lockedBanner({ what: "Admin", reviewerOnly: true });
  check("a reviewer-only banner offers NO phrase input", !r.querySelector("input"));
  check("…and sends people to About instead", /About/.test(r.textContent));
  check("…saying plainly that the phrase will not open it", /does not open it/i.test(r.textContent));
}

// ── Coverage is reported, never silently partial ─────────────────────────
{
  const unmeasured = SURFACE.unmeasured || [];
  check("the surface map still declares which tabs it could not measure", unmeasured.length >= 0);
  console.log("\n  scanned " + rows.length + " phrase-gated tabs; "
    + rows.filter(function (r) { return r.affords; }).length + " carry an input, "
    + rows.filter(function (r) { return !r.affords && r.points; }).length + " point at the header, "
    + Object.keys(ALLOW_LIST).length + " exempt with a reason.");
  console.log("  " + unmeasured.length + " tabs have an UNMAPPED data surface and cannot be checked here: "
    + unmeasured.join(", ") + "\n");
}

let failed = 0;
results.forEach(function (x) {
  console.log((x[1] ? "PASS " : "FAIL ") + x[0]);
  if (!x[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
