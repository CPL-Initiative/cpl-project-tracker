// My College (college_briefing.js) — AUTH ON THE WIRE. Sky167, 2026-08-17.
//
// Sam: "check this function on My College … I think all the colleges are coming
// up blank on this", against the "What that waiting credit actually is" section
// reporting `no figures held` — the unmeasured state.
//
// waitingBreakdown() was right. The credential never reached the server.
//
// getSession() read `localStorage.cpl_team_session`, a key that appeared exactly
// ONCE in the repo — as that read. Nothing wrote it, ever, so it returned null
// for every visitor. The reviewer session lives in `cpl_sb` (which cpl_session.js
// keeps fresh for the other 25 modules) and the team phrase in `cpl_team_pass`,
// and neither reached authHeaders(). Every gated read went out bearing the bare
// anon key, and both halves of `is_allowed_reviewer() OR team_pass_ok()` were
// false.
//
// ⭐ WHY THIS FILE ASSERTS HEADERS AND NOT PIXELS. An RLS-filtered SELECT is not
// an error: PostgREST answers 200 with `[]`. So the four gated reads
// (map_college_credit_summary, map_college_cr_unit, map_college_goal2,
// map_college_contacts) returned empty arrays that are indistinguishable from
// "this college has nothing", while the public reads beside them
// (map_colleges, chatbox_credentials, cpl_funding_config) kept working — which
// is why the tab looked healthy with every MAP figure on it blank. There is no
// rendered state that distinguishes the bug from the truth, which is exactly why
// 232 passing checks in college_briefing.test.js never caught it. Worse: that
// suite signs in with `cpl_team_pass` — the broken path — and stubs fetch, so it
// exercised the defect on every run and asserted nothing about it.
//
// Run from repo root: `npm test` (or `node tests/college_briefing_auth.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

/* ⚠ GUARD THE DRIVER, NOT JUST THE CHECK. Against the pre-fix file `_getSession`
 * and `_authHeaders` do not exist, so the imperative setup between checks throws
 * — and an unguarded throw ends the run, skipping every later check and
 * reporting them as neither passed nor failed. A verification pass that dies
 * early cannot tell you how much of the fix it actually covers. Each block runs
 * inside block(), which converts a throw into one honest failure and carries on.
 * (Handoff 166's safety pattern, applied to the case it was written for.) */
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("college_briefing.js", "utf8");

// A JWT-shaped token: three dot-separated parts, over 40 chars. isValidJwt only
// checks the shape (the keeper owns real freshness), so this is enough.
const JWT = "eyJhbGciOiJIUzI1NiJ9." + "x".repeat(60) + ".signature";

/* Mount the module the way the page does: team_phrase.js first (production
 * ships both), then college_briefing.js. `seed` runs against the window BEFORE
 * either script evaluates, so it can plant storage, a keeper, or neither. */
function load(seed) {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, opts) {
    calls.push({ url: String(url), headers: (opts && opts.headers) || {} });
    return new Promise(function () {});         // never resolves
  };
  if (seed) seed(w);
  ["team_phrase.js", "college_briefing.js"].forEach(function (f) {
    const s = w.document.createElement("script");
    s.textContent = fs.readFileSync(f, "utf8");
    w.document.body.appendChild(s);
  });
  return { w, calls, M: w.CPL_COLLEGE_BRIEFING };
}

// ── 1. The phantom key is gone, and stays gone ────────────────────────────────
// Pinned against the SOURCE, not behaviour: a future edit could reintroduce the
// read and every rendered assertion would still pass.
// Scoped to the READ EXPRESSION, not the bare string: the fix's own comment
// explains the phantom key by name, and a test that greps for the name would
// fail on the explanation of why it is gone.
check("source no longer reads the phantom cpl_team_session key",
  !/getItem\(\s*["']cpl_team_session["']\s*\)/.test(SRC));
check("source reads the canonical reviewer key cpl_sb", SRC.indexOf("cpl_sb") !== -1);
check("source names the team-phrase header team_pass_ok() reads",
  SRC.indexOf("x-team-pass") !== -1);

// A window holding ONLY the old key must be logged out. This is the regression
// that would re-open the bug while looking like a working sign-in.
block("phantom key", function () {
  const { M } = load(function (w) {
    w.localStorage.setItem("cpl_team_session", JSON.stringify({ access_token: JWT }));
  });
  check("the phantom key alone does NOT sign anyone in", M._getSession() === null);
  const h = M._authHeaders();
  check("the phantom key alone sends no team-pass header", !h["x-team-pass"]);
});

// ── 2. The team phrase reaches the server ─────────────────────────────────────
// The headline defect. Sam's session is a phrase holder; the tab rendered for
// him because signedIn() checked cpl_team_pass separately, and then sent nothing.
block("team phrase", function () {
  const { M } = load(function (w) { w.localStorage.setItem("cpl_team_pass", "open sesame"); });
  const s = M._getSession();
  check("phrase holder is signed in", !!s && s.teamPass === "open sesame");
  const h = M._authHeaders();
  check("⭐ phrase holder's reads carry x-team-pass", h["x-team-pass"] === "open sesame");
  // The bearer must stay the ANON key: PostgREST 401s on a garbled Bearer, and
  // "Bearer <phrase>" is the classic version of this mistake.
  check("phrase holder's bearer is the anon key, not the phrase",
    h.Authorization.indexOf("open sesame") === -1 && h.Authorization.indexOf("Bearer ") === 0);
  check("apikey is always sent", !!h.apikey);
});

// ── 3. The reviewer session is seen — via the keeper, and without it ──────────
block("keeper session", function () {
  const { M } = load(function (w) {
    w.CPL_SESSION = { get: function () { return { access_token: JWT, email: "sam@cccco.edu" }; } };
  });
  const s = M._getSession();
  check("⭐ keeper's session is used when present", !!s && s.access_token === JWT);
  check("reviewer email is carried", s.email === "sam@cccco.edu");
  check("reviewer's bearer is the JWT", M._authHeaders().Authorization === "Bearer " + JWT);
});
block("cpl_sb fallback", function () {
  // Keeper absent (standalone mount / load order) — the fallback reads the same
  // canonical key rather than inventing a second notion of "signed in".
  const { M } = load(function (w) {
    w.localStorage.setItem("cpl_sb", JSON.stringify({ access_token: JWT, email: "r@x.org" }));
  });
  check("falls back to cpl_sb when the keeper has not loaded",
    !!M._getSession() && M._getSession().access_token === JWT);
});
block("malformed token", function () {
  // A malformed token must not be dressed up as a session — otherwise the bearer
  // is garbage and PostgREST 401s, which renders as "not signed in".
  const { M } = load(function (w) {
    w.localStorage.setItem("cpl_sb", JSON.stringify({ access_token: "not-a-jwt" }));
  });
  check("a malformed cpl_sb token is not treated as a session", M._getSession() === null);
});

// ── 4. A reviewer who ALSO holds the phrase sends both ────────────────────────
// The gates are OR-predicates. Sending the phrase alongside a JWT is harmless
// for a reviewer and it un-shadows the phrase for a signed-in NON-reviewer,
// whose JWT alone fails is_allowed_reviewer() — the case that otherwise reads as
// "signed in, still no data".
block("reviewer+phrase", function () {
  const { M } = load(function (w) {
    w.localStorage.setItem("cpl_sb", JSON.stringify({ access_token: JWT }));
    w.localStorage.setItem("cpl_team_pass", "open sesame");
  });
  const h = M._authHeaders();
  check("⭐ signed-in non-reviewer's phrase still rides along",
    h.Authorization === "Bearer " + JWT && h["x-team-pass"] === "open sesame");
});

// ── 5. Logged out sends no credential ─────────────────────────────────────────
block("logged out", function () {
  const { M } = load(null);
  check("logged out is logged out", M._getSession() === null);
  const h = M._authHeaders();
  check("logged out sends no team-pass header", !h["x-team-pass"]);
  check("logged out still sends the anon apikey", !!h.apikey);
});

// ── 6. THE REAL REQUEST PATH — the four gated reads on activate() ─────────────
// Asserting the helper is not enough: the defect was that the helper's output
// reached the wire. Drive activate() and read the headers off fetch itself.
block("real request path", function () {
  const { w, calls, M } = load(function (win) {
    win.localStorage.setItem("cpl_team_pass", "open sesame");
  });
  M.activate();
  const gated = calls.filter(function (c) {
    return /map_college_credit_summary|map_college_contacts|map_college_goal2|map_college_cr_unit/.test(c.url);
  });
  check("activate() issues both of its gated reads", gated.length === 2);
  check("⭐ EVERY gated read carries the phrase — the actual bug",
    gated.length > 0 && gated.every(function (c) { return c.headers["x-team-pass"] === "open sesame"; }));
  // map_college_credit_summary is the one behind Sam's screenshot: no row for a
  // college => waitingBreakdown() returns {unmeasured:true} => "no figures held".
  const sum = calls.filter(function (c) { return /map_college_credit_summary/.test(c.url); });
  check("⭐ the credit-summary read specifically is authenticated",
    sum.length === 1 && sum[0].headers["x-team-pass"] === "open sesame");
  // Scoped to Supabase: live_metrics.json is a same-origin static file and
  // correctly carries no credential. Asserting "every request" would fail on
  // the one request that is right.
  const sb = calls.filter(function (c) { return /supabase\.co\/rest\//.test(c.url); });
  check("every Supabase request sends the anon apikey",
    sb.length > 0 && sb.every(function (c) { return !!c.headers.apikey; }));
  check("the static metrics read is NOT given a credential",
    calls.some(function (c) { return /live_metrics\.json/.test(c.url) && !c.headers["x-team-pass"]; }));
  w.close();
});

// ── 7. waitingBreakdown itself was NEVER wrong — do not "fix" it ──────────────
// It reported unmeasured because it genuinely had no summary row. Keeping these
// pinned means a future session chasing the same screenshot cannot make the
// symptom go away by teaching this function to guess.
block("waitingBreakdown", function () {
  const { M } = load(null);
  const wb = M._waitingBreakdown({ waiting: [] }, null);
  check("no summary row still reports unmeasured, not a finished queue",
    !!wb && wb.unmeasured === true && !wb.empty);
  const wb2 = M._waitingBreakdown({ waiting: [] }, { suppressed: true });
  check("a suppressed college still reports suppressed", !!wb2 && wb2.suppressed === true);
  const wb3 = M._waitingBreakdown({ waiting: [] }, { articulated_waiting: 0 });
  check("a real summary row with no waiting rows is empty, NOT unmeasured",
    !!wb3 && wb3.empty === true && !wb3.unmeasured);
});

// ── report ──
let pass = 0;
results.forEach(function (r) {
  if (r[1]) { pass++; console.log("  ok   " + r[0]); }
  else console.log("  FAIL " + r[0]);
});
console.log("\ncollege_briefing_auth: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
