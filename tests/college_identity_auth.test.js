// College Identity — the tab must SEND an apikey, and must not feature-test a
// method that does not exist.
//
// ⭐ WHY. Sam opened the tab on 2026-09-11 and saw only the findings list:
// "This tab only shows the colleges with problems that need to be fixed. The
// main view should be a complete table of all MAP locations." The table was
// built all along — `Every entity (N of M)`, filterable by name, district and
// variant, covering continuing_education and partner rows (Futuro Health,
// Launch Apprenticeship) as well as colleges. It is drawn under `if (live)`,
// and `live` is the map_colleges read, and that read was answering 401.
//
// ⚠ THE CAUSE WAS A FEATURE-TEST ON A METHOD THAT DOES NOT EXIST:
//
//     if (window.CPL_TEAM_PHRASE && window.CPL_TEAM_PHRASE.headers) {
//       h = window.CPL_TEAM_PHRASE.headers() || {};
//     }
//
// `CPL_TEAM_PHRASE` exposes `decorateHeaders`. It has never exposed `headers`.
// So the guard was always false, `h` stayed `{}`, every fetch went out with no
// apikey, PostgREST answered 401 — and because the guard's else-branch is
// "degrade politely", nothing anywhere said the method was missing. The tab's
// main table had never rendered for anyone, on any sign-in, since it shipped.
//
// Block (3) is the general form of that guard and the reason this file exists:
// every CPL_TEAM_PHRASE member the tab names is checked against team_phrase.js's
// own api object, so the next typo fails in CI instead of in a browser.
//
// Run from repo root: `npm test` (or `node tests/college_identity_auth.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("college_identity.js", "utf8");
const PHRASE = fs.readFileSync("team_phrase.js", "utf8");

/* ⚠ SCAN CODE, NOT PROSE. The fix's own comment quotes the broken line verbatim
 * so the next reader understands what "fails silent" looked like — and block (3)
 * read that quotation as a live call and went red on the documentation of the
 * bug it exists to prevent. `kb/_docs_audit.py` hit exactly this with
 * `american_spelling` correcting the words its own rule was documenting. Strip
 * comments first; `//` inside a URL (https://…) is left alone. */
function codeOnly(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ")
            .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const SRC_CODE = codeOnly(SRC);

function mount(opts) {
  opts = opts || {};
  const dom = new JSDOM("<!doctype html><div id='college-identity-root'></div>", {
    url: "https://example.test/", runScripts: "outside-only",
  });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };   // never resolves; we only read headers
  if (opts.jwt) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: opts.jwt }));
  if (opts.phrase) {
    w.CPL_TEAM_PHRASE = {
      decorateHeaders: function (h) { h["x-team-pass"] = opts.phrase; return h; },
    };
  }
  w.eval(SRC);
  return w;
}

const REAL_JWT = "aaaaaaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc";

// ── 1. The apikey is never conditional ───────────────────────────────────────
block("1. apikey always present", () => {
  const w = mount({});
  const api = w.CPL_COLLEGE_IDENTITY_TAB;
  check("(1) the tab exposes _authHeaders", api && typeof api._authHeaders === "function");
  const h = api._authHeaders();
  check("(1) ⭐ an anonymous visitor still sends an apikey",
    typeof h.apikey === "string" && h.apikey.length > 40,
    "without it PostgREST answers 401 and the roster never draws — this is the bug");
  check("(1) …and an Authorization bearer",
    typeof h.Authorization === "string" && h.Authorization.indexOf("Bearer ") === 0);
  check("(1) no team-pass header when no phrase is mounted",
    !("x-team-pass" in h));
});

// ── 2. A reviewer's own token is used when there is one ──────────────────────
block("2. session token beats anon", () => {
  const wNo = mount({});
  const wYes = mount({ jwt: REAL_JWT });
  const hNo = wNo.CPL_COLLEGE_IDENTITY_TAB._authHeaders();
  const hYes = wYes.CPL_COLLEGE_IDENTITY_TAB._authHeaders();
  check("(2) signed out, Authorization carries the anon key",
    hNo.Authorization === "Bearer " + hNo.apikey);
  check("(2) ⭐ signed in, Authorization carries the REVIEWER's jwt",
    hYes.Authorization === "Bearer " + REAL_JWT,
    "the contacts half is gated on the reviewer session; sending anon loses it");
  check("(2) …while apikey stays the anon key either way",
    hYes.apikey === hNo.apikey && hYes.apikey.length > 40);
  check("(2) a malformed stored session is ignored, not sent",
    mount({ jwt: "not-a-jwt" }).CPL_COLLEGE_IDENTITY_TAB._authHeaders().Authorization
      === "Bearer " + hNo.apikey);
});

// ── 3. ⭐ Every CPL_TEAM_PHRASE member the tab names must EXIST ──────────────
// The general form of the bug: a feature-test on a misspelled method reads as
// "not mounted" and degrades silently, so the failure never surfaces.
block("3. no phantom CPL_TEAM_PHRASE members", () => {
  const apiBlock = (PHRASE.match(/var api = \{([\s\S]*?)\n  \};/) || [])[1] || "";
  const exported = new Set((apiBlock.match(/^\s*([A-Za-z_$][\w$]*)\s*:/gm) || [])
    .map((s) => s.trim().replace(/:$/, "")));
  check("(3) team_phrase.js's api surface was parsed", exported.size > 5,
    "parsed " + exported.size + " members — if this is 0 the check below is vacuous");
  const used = new Set((SRC_CODE.match(/CPL_TEAM_PHRASE\s*\.\s*([A-Za-z_$][\w$]*)/g) || [])
    .map((s) => s.replace(/.*\.\s*/, "")));
  const phantom = [...used].filter((m) => !exported.has(m));
  check("(3) ⭐ every member the tab names exists on the api",
    phantom.length === 0,
    "phantom: " + phantom.join(", ") + " — a truthiness guard on these fails "
    + "silent, which is exactly how the 401 survived to production");
  check("(3) …and the tab does name decorateHeaders, so the check is not vacuous",
    used.has("decorateHeaders"),
    "if the tab stops using the phrase at all, delete this block deliberately");
  check("(3) ⚠ the retired `headers` spelling has not come back",
    !/CPL_TEAM_PHRASE\s*\.\s*headers\b/.test(SRC_CODE),
    "the quotation of it in the fix's comment is deliberate and must stay");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\ncollege_identity_auth.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
