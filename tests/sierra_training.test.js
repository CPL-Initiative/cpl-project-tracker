// Sierra Training tab (sierra_training.js) — jsdom test (Session 93, SkyReach).
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the nav button / pane / lazy-boot are
//      present in BOTH HTMLs;
//  (b) gap classification — the failure modes measured in the live logs:
//      low-similarity (< 0.55 OR null), punt signatures ("don't have" /
//      "doesn't appear" / "don't see"…) fire, and a routine answer that merely
//      offers MAP@rccd.edu is NOT a punt (174/298 answers mention the email);
//  (c) theme extraction — recurring keywords counted once per turn, stopworded,
//      min count 2;
//  (d) feedback-queue filters — the default "open" view hides addressed rows;
//      rating / has-note filters work;
//  (e) XSS — question / note / response text is HTML-ESCAPED in both row
//      renderers (chat logs are untrusted public input);
//  (f) authHeaders — logged-out → anon Bearer; team phrase → x-team-pass
//      header; reviewer token → that token as Bearer;
//  (g) gates — logged out renders the sign-in gate (no fetch of gated data);
//      status buttons call the sierra_feedback_set_status RPC.
//
// Run from repo root: `npm test` (or `node tests/sierra_training.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["CPL_Dashboard.html", cpl], ["index.html", idx]].forEach(function (p) {
  check("nav button in " + p[0], /data-tab="sierra-training"[^>]*>Sierra Training</.test(p[1]));
  check("pane #sierra-training-root in " + p[0], /id="sierra-training-root"/.test(p[1]));
  check("lazy boot loadScript in " + p[0], /loadScript\('sierra_training\.js', 'CPL_SIERRA_TRAINING_TAB'/.test(p[1]));
});

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("sierra_training.js", "utf8");

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.reviewerToken) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: opts.reviewerToken, email: "rev@x.edu" }));
  }
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    const body = /sierra_feedback\?/.test(url) ? (opts.feedback || [])
      : /chat_interactions\?/.test(url) ? (opts.turns || [])
      : {};
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve(body); } });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

// (b) gap classification
(function () {
  const api = makeWin().CPL_SIERRA_TRAINING_TAB;
  check("low-sim: null similarity is a gap", api._isLowSim({ top_similarity: null }));
  check("low-sim: 0.42 is a gap", api._isLowSim({ top_similarity: 0.42 }));
  check("low-sim: 0.80 is NOT a gap", !api._isLowSim({ top_similarity: 0.80 }));
  check("punt: \"I don't have information on…\"", api._isPunt({ response: "I don't have information on that program." }));
  check("punt: \"doesn't appear\"", api._isPunt({ response: "That college doesn't appear to teach this." }));
  check("punt: \"couldn't find\"", api._isPunt({ response: "I couldn't find a matching exhibit." }));
  check("punt: curly apostrophe \"don’t have\"", api._isPunt({ response: "I don’t have that in my sources." }));
  check("NOT a punt: routine MAP@rccd.edu routing", !api._isPunt({
    response: "Great question! Here are the colleges… You can also reach the MAP team at MAP@rccd.edu for support.",
  }));
  const both = api._gapKinds({ top_similarity: 0.3, response: "I don't have that." });
  check("gapKinds: both kinds fire", both.indexOf("low-sim") >= 0 && both.indexOf("punt") >= 0);
  check("gapKinds: clean turn is no gap", api._gapKinds({ top_similarity: 0.9, response: "Here you go." }).length === 0);
})();

// (c) theme extraction
(function () {
  const api = makeWin().CPL_SIERRA_TRAINING_TAB;
  const themes = api._themeCounts([
    { question: "Do colleges give CPR credit? CPR is common." },   // "cpr" once (per-turn dedupe)
    { question: "First aid and CPR articulations?" },
    { question: "What about welding?" },                            // count 1 → excluded (min 2)
  ]);
  const cpr = themes.find(function (t) { return t.word === "cpr"; });
  check("themes: cpr counted once per turn (2, not 3)", cpr && cpr.n === 2);
  check("themes: min-count 2 excludes 'welding'", !themes.some(function (t) { return t.word === "welding"; }));
  check("themes: stop word 'colleges' excluded", !themes.some(function (t) { return t.word === "colleges"; }));
  const byAud = api._audienceCounts([{ audience: "student" }, { audience: "student" }, { audience: null }]);
  check("audience slice: counts + (not set) bucket", byAud.student === 2 && byAud["(not set)"] === 1);
})();

// (d) feedback-queue filters
(function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api._state.feedback = [
    { turn_id: "t1", rating: "down", status: "new", note: "bad", question: "q1" },
    { turn_id: "t2", rating: "up", status: "addressed", note: null, question: "q2" },
    { turn_id: "t3", rating: "down", status: "triaged", note: null, question: "q3" },
  ];
  api._state.fStatus = "open";
  let rows = api._filteredFeedback();
  check("filter: default 'open' hides addressed", rows.length === 2 && !rows.some(function (f) { return f.turn_id === "t2"; }));
  api._state.fStatus = ""; api._state.fRating = "down";
  rows = api._filteredFeedback();
  check("filter: rating=down", rows.length === 2 && rows.every(function (f) { return f.rating === "down"; }));
  api._state.fRating = ""; api._state.fNote = true;
  rows = api._filteredFeedback();
  check("filter: has-note", rows.length === 1 && rows[0].turn_id === "t1");
})();

// (e) XSS escaping in both row renderers
(function () {
  const api = makeWin().CPL_SIERRA_TRAINING_TAB;
  api._state.open["x1"] = true;
  const fb = api._feedbackRow({
    turn_id: "x1", rating: "down", status: "new",
    question: '<img src=x onerror=alert(1)>', note: "<script>n</script>", response: "<b>r</b>",
  });
  check("feedbackRow: question escaped", fb.indexOf("&lt;img") >= 0 && fb.indexOf("<img") < 0);
  check("feedbackRow: note escaped", fb.indexOf("&lt;script&gt;") >= 0);
  check("feedbackRow: response escaped", fb.indexOf("&lt;b&gt;r&lt;/b&gt;") >= 0);
  api._state.gOpen["g1"] = true;
  const gp = api._gapRow({ id: "g1", top_similarity: null, question: '<svg onload=1>', response: "I don't have it <i>x</i>" });
  check("gapRow: question escaped", gp.indexOf("&lt;svg") >= 0 && gp.indexOf("<svg") < 0);
  check("gapRow: response escaped", gp.indexOf("&lt;i&gt;x&lt;/i&gt;") >= 0);
})();

// (f) authHeaders
(function () {
  const anon = makeWin().CPL_SIERRA_TRAINING_TAB._authHeaders();
  check("auth: logged-out uses anon Bearer", /^Bearer eyJ/.test(anon.Authorization) && !anon["x-team-pass"]);
  const team = makeWin({ teamPass: "phrase-1" }).CPL_SIERRA_TRAINING_TAB._authHeaders();
  check("auth: team phrase → x-team-pass header", team["x-team-pass"] === "phrase-1");
  const tok = "e" + "x".repeat(30) + "." + "y".repeat(30) + "." + "z".repeat(30);
  const rev = makeWin({ reviewerToken: tok }).CPL_SIERRA_TRAINING_TAB._authHeaders();
  check("auth: reviewer token used as Bearer", rev.Authorization === "Bearer " + tok);
})();

// (g) gates + the status RPC wiring
(function () {
  const w = makeWin(); // logged out
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api.activate();
  const html = w.document.getElementById("sierra-training-root").innerHTML;
  check("gate: logged-out sees the sign-in gate", /Team &amp; RACI/.test(html));
  check("gate: logged-out fetches NO gated data", w.__fetches.length === 0);
})();
(function (done) {
  const tok = "e" + "x".repeat(30) + "." + "y".repeat(30) + "." + "z".repeat(30);
  const w = makeWin({
    reviewerToken: tok,
    feedback: [{ turn_id: "t1", rating: "down", status: "new", question: "q", response: "a", note: "n", created_at: "2026-07-01T00:00:00Z" }],
    turns: [{ id: 1, question: "cpr?", response: "I don't have that.", top_similarity: 0.3, created_at: "2026-07-01T00:00:00Z" }],
  });
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api.activate();
  setTimeout(function () {
    const root = w.document.getElementById("sierra-training-root");
    check("signed-in: queue + gap panes render", /Feedback queue/.test(root.innerHTML) && /Gap miner/.test(root.innerHTML));
    // expand the row, click "triaged" → the RPC is called
    root.querySelector('[data-open="t1"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    const btn = root.querySelector('[data-status="triaged"]');
    check("signed-in: triage buttons render on the open row", !!btn);
    btn.dispatchEvent(new w.Event("click", { bubbles: true }));
    setTimeout(function () {
      const rpc = w.__fetches.find(function (f) { return f.url.indexOf("/rpc/sierra_feedback_set_status") >= 0; });
      check("status click calls sierra_feedback_set_status RPC", !!rpc);
      check("status RPC body carries turn_id + status", !!rpc && rpc.init.body.indexOf('"p_turn_id":"t1"') >= 0 && rpc.init.body.indexOf('"p_status":"triaged"') >= 0);
      done();
    }, 30);
  }, 30);
})(smokeFilterTest);

// ── CI smoke rows must not drown the real queue (2026-08-07) ────────────────
// chatbox/smoke_test.sh MODE 12 exercises the anon 👍/👎 write path on every CI
// run and leaves a page='smoke' row behind. It CANNOT clean up: the RPC is anon,
// and anon is write-only on this table by design. By 2026-08-07 those rows were
// 28 of 53 — 53% of the queue, every one rated "down", so the headline "👎 total"
// read 38 when only 10 were real reports.
// The failure this guards is the SILENT one: a reviewer opening a queue that is
// mostly CI noise concludes the feedback channel is worthless and stops reading
// it. Assert both halves — hidden by default, AND still reachable on request.
function smokeFilterTest() {
  const done = finish;
  const tok = "e" + "x".repeat(30) + "." + "y".repeat(30) + "." + "z".repeat(30);
  const mk = function (id, page) {
    return { turn_id: id, page: page, rating: "down", status: "new", question: "q " + id,
             response: "a", note: "n", created_at: "2026-08-01T00:00:00Z" };
  };
  const w = makeWin({
    reviewerToken: tok,
    feedback: [mk("real1", "sierra"), mk("ci1", "smoke"), mk("ci2", "smoke"), mk("ci3", "smoke")],
    turns: [],
  });
  w.CPL_SIERRA_TRAINING_TAB.activate();
  setTimeout(function () {
    const root = w.document.getElementById("sierra-training-root");
    const html = root.innerHTML;
    check("smoke rows are hidden from the queue by default", !!root.querySelector('[data-open="real1"]') && !root.querySelector('[data-open="ci1"]'));
    // The stat box is the number a reviewer trusts at a glance — 1 real 👎, not 4.
    check("stats count only real rows (👎 total excludes CI)", /<div class="n">1<\/div><div class="l">\u{1F44E} total/u.test(html));
    check("the hidden CI rows are disclosed, not silently dropped", /show 3 CI rows/.test(html));
    const box = root.querySelector("[data-f-smoke]");
    check("a reviewer can still opt in to see CI rows", !!box);
    box.checked = true;
    box.dispatchEvent(new w.Event("change", { bubbles: true }));
    setTimeout(function () {
      const after = w.document.getElementById("sierra-training-root");
      check("toggling CI rows on brings them back", !!after.querySelector('[data-open="ci1"]'));
      check("stats follow the toggle too", /<div class="n">4<\/div><div class="l">\u{1F44E} total/u.test(after.innerHTML));
      done();
    }, 30);
  }, 30);
}

function finish() {
  let fail = 0;
  results.forEach(function (r) {
    if (!r[1]) { fail++; console.error("  ✗ " + r[0]); }
    else console.log("  ✓ " + r[0]);
  });
  console.log(results.length + " checks, " + fail + " failed — sierra_training.test.js");
  if (fail) process.exit(1);
}
