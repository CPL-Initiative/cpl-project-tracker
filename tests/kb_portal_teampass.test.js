// CPL Knowledge Base portal — team-phrase access (Session 86, SkyGuy).
//
// The portal can be unlocked + curated via the SHARED CPL team phrase (the same
// gate raci.js / mission_control.js use) as an alternative to a per-person
// magic-link sign-in. The phrase is validated server-side against the main
// dashboard's team_pass_ok() RPC; because kb-portal is served same-origin as the
// dashboard, an unlock done on the Team & RACI tab carries over via shared
// localStorage. app.js imports esm.sh modules at the top, so it can't be eval'd
// in Node — these guard the wiring (config + markup + app.js) as source checks;
// the pure request contract is unit-tested in kb_portal_composer.test.js
// (teamPassRequest).
//
// Run from repo root: `npm test` (or `node tests/kb_portal_teampass.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const cfg = fs.readFileSync("kb-portal/config.js", "utf8");
const app = fs.readFileSync("kb-portal/app.js", "utf8");
const html = fs.readFileSync("kb-portal/index.html", "utf8");
const util = fs.readFileSync("kb-portal/composer_util.js", "utf8");

// ── config.js: the team-phrase consts point at the MAIN dashboard project ──
check("config exports TEAM_SUPABASE_URL = main dashboard project",
  /export const TEAM_SUPABASE_URL\s*=\s*"https:\/\/hvuwhnbuahrtptokpqfh\.supabase\.co"/.test(cfg));
check("config exports a TEAM_SUPABASE_ANON publishable key", /export const TEAM_SUPABASE_ANON\s*=\s*"eyJ/.test(cfg));
check("config exports TEAM_PASS_KEY = the shared localStorage key 'cpl_team_pass'",
  /export const TEAM_PASS_KEY\s*=\s*"cpl_team_pass"/.test(cfg));

// ── composer_util.js: the pure request builder is exported ──
check("composer_util exports teamPassRequest", /teamPassRequest:\s*teamPassRequest/.test(util));

// ── index.html: the login view offers a team-phrase entry ──
check("login view has a team-phrase form", /id="team-form"/.test(html));
check("team-phrase input is a password field", /id="team-phrase"[^>]*type="password"|type="password"[^>]*id="team-phrase"/.test(html));
check("team unlock button present", /id="btn-team"/.test(html));
check("team status banner present", /id="team-msg"/.test(html));
check("copy explains the phrase is shared with the Team & RACI tab", /Team &amp; RACI/.test(html));

// ── app.js: imports + verify + unlock + render gating + signout clears phrase ──
check("app imports the team consts",
  /TEAM_SUPABASE_URL,\s*TEAM_SUPABASE_ANON,\s*TEAM_PASS_KEY/.test(app));
check("app has a teamUnlocked state", /let teamUnlocked\s*=\s*false/.test(app));
check("app verifies a phrase via the pure builder + fetch",
  /window\.KBComposer\.teamPassRequest\(TEAM_SUPABASE_URL, TEAM_SUPABASE_ANON/.test(app) &&
  /function verifyPhrase/.test(app));
check("app re-validates a stored phrase on boot (maybeTeamUnlock)",
  /maybeTeamUnlock/.test(app) && /localStorage\.getItem\(TEAM_PASS_KEY\)/.test(app));
check("app drops a stored phrase that no longer validates",
  /if \(!ok\) \{ try \{ localStorage\.removeItem\(TEAM_PASS_KEY\)/.test(app));
check("render shows the portal when team-unlocked (not just signed-in)",
  /if \(signedIn \|\| teamUnlocked\)/.test(app));
check("team-unlocked session box reads 'Team access'", /"Team access"/.test(app));
check("team-form submit stores the SHARED phrase + renders the portal",
  /localStorage\.setItem\(TEAM_PASS_KEY, phrase\)/.test(app) && /teamUnlocked = true/.test(app));
check("a wrong phrase is rejected with a message (not stored)",
  /doesn't match/.test(app));
check("sign-out clears the shared team phrase (locks team access everywhere)",
  /localStorage\.removeItem\(TEAM_PASS_KEY\)/.test(app) && /sb\.auth\.signOut\(\)/.test(app));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
