// Shared "team phrase" edit gate on the Team & RACI tab (raci.js) — jsdom test.
//
// Guards:
//  (a) raci.js carries the phrase plumbing (TEAM_PASS_KEY, the x-team-pass header,
//      the "Unlock editing" UI) and the schema file documents the server gate;
//  (b) headersFor() attaches x-team-pass ONLY for a team-phrase pseudo-session,
//      and a real magic-link session still sends its Bearer token (no regression);
//  (c) teamSession() reflects localStorage (set ⇒ {teamPass}; unset ⇒ null).
//
// The server side (team_pass_ok reading the request header) is validated live via
// the Supabase MCP — it can't be exercised from this sandbox.
//
// Run from repo root: `npm test` (or `node tests/raci_team_pass.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const SRC = fs.readFileSync("raci.js", "utf8");
check("raci.js defines TEAM_PASS_KEY", /TEAM_PASS_KEY\s*=\s*"cpl_team_pass"/.test(SRC));
check("raci.js sends the x-team-pass header", /x-team-pass/.test(SRC));
check("raci.js has the phrase-unlock UI", /Unlock editing/.test(SRC) && /team phrase/i.test(SRC));
check("raci.js no longer forces an email magic-link to edit", !/Sign in to edit/.test(SRC));
// The update composer offers the team phrase IN PLACE (email-link visitor unlocks
// without leaving the popup) — not a dead "sign in elsewhere" message.
check("update composer offers the team phrase in place", /unlockBox\(/.test(SRC) && !/Sign in \(CCCCO MAP\) to add an update/.test(SRC));

const SQL = fs.readFileSync("raci/supabase_raci.sql", "utf8");
check("schema documents team_access + the server gate", /team_access/.test(SQL) && /team_pass_ok/.test(SQL));
check("schema reads the x-team-pass header server-side", /request\.headers.*x-team-pass|x-team-pass/.test(SQL));

// ── Part B — behavior, loaded into jsdom ──
const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
  { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
const w = dom.window;
w.fetch = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } }); };
w.eval(SRC);
const API = w.CPL_RACI_TAB;
check("module exposes the test hooks", !!API && typeof API._headersFor === "function" && typeof API._teamSession === "function");

// (b) headersFor — the phrase pseudo-session attaches x-team-pass.
const hTeam = API._headersFor({ teamPass: "secret-phrase" });
check("team-phrase session attaches x-team-pass", hTeam["x-team-pass"] === "secret-phrase");
check("team-phrase session still carries the anon apikey", !!hTeam.apikey);
// The 401 bug: a phrase session has no user token, so it MUST fall back to the
// anon key as the bearer — an empty "Bearer " 401s at PostgREST's auth layer
// before team_pass_ok() ever runs.
check("team-phrase session sends the anon key as bearer (never an empty Bearer)",
  hTeam.Authorization && hTeam.Authorization !== "Bearer " && /^Bearer .+/.test(hTeam.Authorization));
check("team-phrase bearer matches the anon apikey", hTeam.Authorization === "Bearer " + hTeam.apikey);

// a real magic-link session sends its Bearer token and NO x-team-pass (no regression).
const hSess = API._headersFor({ access_token: "jwt.aa.bb" });
check("magic-link session sends its Bearer token", hSess.Authorization === "Bearer jwt.aa.bb");
check("magic-link session does NOT send x-team-pass", !("x-team-pass" in hSess));

// Prefer header still threads through.
check("Prefer header threads through headersFor", API._headersFor({ teamPass: "p" }, "return=minimal").Prefer === "return=minimal");

// (c) teamSession reflects localStorage.
try { w.localStorage.removeItem("cpl_team_pass"); } catch (e) {}
check("no stored phrase ⇒ teamSession() is null", API._teamSession() === null);
w.localStorage.setItem("cpl_team_pass", "open-sesame");
const ts = API._teamSession();
check("stored phrase ⇒ teamSession() unlocks", ts && ts.teamPass === "open-sesame");

// ── report ──
let failed = 0;
results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
