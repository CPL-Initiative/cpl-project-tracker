// CI smoke rows must never enter the human feedback queue — jsdom test.
// SkyDesk (Session 131), 2026-08-09.
//
// WHY THIS EXISTS. chatbox/smoke_test.sh MODE 12 exercises the PUBLIC anon
// 👍/👎 write path on every CI run. It cannot clean up after itself: anon is
// deliberately write-only on sierra_feedback (mode 12 asserts exactly that), so
// its rows accumulate forever. Measured 2026-08-09: 70 rows, 43 of them CI —
// 61% of a queue a human is supposed to read, and growing daily.
//
// Fixed at the SOURCE (kb/supabase_sierra_feedback_ci_status.sql): the RPC now
// stamps status='ci' at write time. The two display-side filters stay as the
// second guard. This file guards the JS half of that arrangement.
//
// THE PROPERTY, STATED POSITIVELY (per
// docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md — never
// assert "not the expected value", and always pair a hides-things check with a
// positive control that proves it did not hide EVERYTHING):
//
//   A row written by our own CI is excluded from the queue and its counts.
//   A row written by a real person is NOT excluded — ever, by either marker.
//
// Run from repo root: `npm test` (or `node tests/sierra_feedback_ci_rows.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Fixtures: the three shapes that actually exist in the table ──
// Measured 2026-08-09: page IN ('smoke', 'sierra', 'student-portal'), and
// page='smoke' <=> session_id LIKE 'smoke%' on 43 of 43 rows.
const CI_NEW = { turn_id: "smoke-1", page: "smoke", status: "ci", rating: "down", audience: "student" };
const CI_LEGACY = { turn_id: "smoke-0", page: "smoke", status: "new", rating: "down", audience: "student" };
const REAL_OPEN = { turn_id: "real-1", page: "sierra", status: "new", rating: "down", audience: "administrator" };
const REAL_DONE = { turn_id: "real-2", page: "sierra", status: "addressed", rating: "up", audience: "administrator" };
const REAL_PORTAL = { turn_id: "real-3", page: "student-portal", status: "new", rating: "up", audience: "student" };

// ── Part A — sierra_training.js: the queue itself ──
const SIT_SRC = fs.readFileSync("sierra_training.js", "utf8");

function makeSitWin(feedback) {
  const dom = new JSDOM('<!doctype html><html><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "p");
  w.fetch = function () { return new Promise(function () {}); };
  const el = w.document.createElement("script");
  el.textContent = SIT_SRC;
  w.document.body.appendChild(el);
  w.CPL_SIERRA_TRAINING_TAB._state.feedback = feedback;
  return w;
}
function makeSit(feedback) { return makeSitWin(feedback).CPL_SIERRA_TRAINING_TAB; }

(function () {
  const api = makeSit([]);
  // Both markers are recognised. `status` is the durable server-side label;
  // `page` covers rows written before the migration and any hand-run curl.
  check("isSmoke: status='ci' is CI", api._isSmoke(CI_NEW));
  check("isSmoke: legacy page='smoke' with status='new' is still CI", api._isSmoke(CI_LEGACY));
  // POSITIVE CONTROL — the half that rots unnoticed. A filter that hid
  // everything would pass every check above and no check below.
  check("isSmoke: a real thumbs-down is NOT CI", !api._isSmoke(REAL_OPEN));
  check("isSmoke: a real student-portal row is NOT CI", !api._isSmoke(REAL_PORTAL));
  check("isSmoke: an addressed real row is NOT CI", !api._isSmoke(REAL_DONE));
  check("isSmoke: null/undefined is not CI and does not throw", !api._isSmoke(null) && !api._isSmoke(undefined));
})();

(function () {
  const api = makeSit([CI_NEW, CI_LEGACY, REAL_OPEN, REAL_DONE, REAL_PORTAL]);
  api._state.fSmoke = false;
  api._state.fStatus = "";       // "Any status" — isolate the CI filter itself
  const shown = api._filteredFeedback();
  const ids = shown.map(function (f) { return f.turn_id; }).sort();
  check("queue: CI rows hidden by default", ids.join(",") === "real-1,real-2,real-3");
  check("queue: default view keeps BOTH real thumbs-down and thumbs-up",
    shown.some(function (f) { return f.rating === "down"; }) &&
    shown.some(function (f) { return f.rating === "up"; }));

  // Never silently: the toggle exists precisely so a reviewer can see what was
  // withheld and how much of it there was.
  api._state.fSmoke = true;
  check("queue: CI rows visible when the reviewer asks for them",
    api._filteredFeedback().length === 5);
})();

(function () {
  // Bulk triage must not re-label CI rows even when they are on screen —
  // that would overwrite status='ci' and quietly undo the write-time fix.
  // confirm() returning false stops before any network call; the candidate set
  // is already computed by then, and the prompt names its size.
  function promptFor(feedback) {
    const w = makeSitWin(feedback);
    const api = w.CPL_SIERRA_TRAINING_TAB;
    api._state.fSmoke = true;    // CI rows deliberately ON SCREEN
    api._state.fStatus = "";
    api._state.bulkStatus = "addressed";
    let msg = null;
    w.confirm = function (m) { msg = m; return false; };
    w.alert = function (m) { msg = m; };
    api._bulkTriage(w.document.getElementById("sierra-training-root"));
    return msg;
  }
  check("bulk triage: counts 1 row — the real one, CI excluded even when shown",
    /\b1 filtered feedback row/.test(promptFor([CI_NEW, CI_LEGACY, REAL_OPEN]) || ""));
  // POSITIVE CONTROL: with two real rows it must offer TWO, so the check above
  // is measuring exclusion of CI rather than a bulk action that never fires.
  check("bulk triage: counts 2 rows when two real rows qualify",
    /\b2 filtered feedback row/.test(promptFor([CI_NEW, REAL_OPEN, REAL_PORTAL]) || ""));
})();

// ── Part B — governance.js: the CA-06 headline count ──
const GOV_SRC = fs.readFileSync("governance.js", "utf8");

(function () {
  const dom = new JSDOM('<!doctype html><html><body><div id="governance-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "p");
  const rows = [CI_NEW, CI_LEGACY, REAL_OPEN, REAL_DONE, REAL_PORTAL];
  w.fetch = function (url) {
    const u = String(url);
    const body = /sierra_feedback\?/.test(u) ? rows : [];
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve(body); } });
  };
  w.eval(GOV_SRC);
  return w.CPL_GOVERNANCE._loadLive().then(function (out) {
    // 3 real rows total; 2 of them not yet addressed (real-1, real-3).
    check("CA-06: fbTotal counts real rows only (3, not 5)", out.fbTotal === 3);
    check("CA-06: fbOpen counts real untriaged only (2, not 4)", out.fbOpen === 2);
  });
})().then(function () {
  // ── Part C — the SQL that makes the JS filters second-line rather than sole ──
  const sql = fs.readFileSync("kb/supabase_sierra_feedback_ci_status.sql", "utf8");
  check("sql: status vocabulary includes 'ci'", /'ci'::text/.test(sql) && /sierra_feedback_status_chk/.test(sql));
  check("sql: the RPC stamps ci from page='smoke'",
    /case when left\(p_page, 40\) = 'smoke' then 'ci' else 'new' end/.test(sql));
  // Scope the match to the ON CONFLICT ... SET list ONLY, up to the statement's
  // terminating semicolon. An unscoped [\s\S]*? runs past the function body and
  // matches step 3's `set status = 'ci'` backfill — which is a different
  // statement doing a legitimate thing, and reading it as a violation is the
  // proxy-instead-of-property mistake the KB note above describes. (It failed
  // that way on first run; the SQL was correct and the assertion was not.)
  const onConflict = (sql.match(/on conflict \(turn_id\) do update set[\s\S]*?;/i) || [""])[0];
  check("sql: an ON CONFLICT SET list was actually found to inspect", onConflict.length > 40);
  check("sql: ON CONFLICT never overwrites a human's triage",
    onConflict.length > 40 && !/\bstatus\s*=/i.test(onConflict));
  // POSITIVE CONTROL: the same scoped slice DOES carry the fields it is
  // supposed to update, so a regex that silently matched nothing cannot pass.
  check("sql: ON CONFLICT does still update rating/note/audience",
    /\brating\s*=/.test(onConflict) && /\bnote\s*=/.test(onConflict) && /\baudience\s*=/.test(onConflict));
  check("sql: the backfill is scoped to page='smoke'", /update public\.sierra_feedback[\s\S]*?where page = 'smoke'/.test(sql));

  // ── Report ──
  let failed = 0;
  results.forEach(function (r) {
    if (!r[1]) failed++;
    console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]);
  });
  console.log((results.length - failed) + "/" + results.length + " checks passed");
  if (failed) process.exit(1);
}).catch(function (e) {
  console.error("test harness error:", e);
  process.exit(1);
});
