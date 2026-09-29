// Sierra Training tab — P1 team-session affordances (Session 94, SkySierra).
//
// Guards the additions from handoff-94 workstream 1:
//  (a) DATE FILTERS — the fDays / gDays "Any time / 24h / 7d / 30d" selects
//      narrow the feedback queue + gap miner by created_at;
//  (b) LOG-TURN LINK — a feedback row resolves its chat_interactions turn
//      (same normalized question, nearest in time) and the expanded row shows
//      the retrieval telemetry (similarity / topic-match / gap chips);
//  (c) TEST IN SIERRA — the 🧪 button stores the question under the shared
//      sessionStorage key and navigates to #chatbot; cpl_chat.js consumes it
//      on chatbot activation by PREFILLING the input (never auto-sending);
//  (d) BULK TRIAGE — "Mark all N filtered → status" fires one
//      sierra_feedback_set_status RPC per filtered row not already there,
//      and skips rows already at the target;
//  (e) WINDOW LISTENER FIX — tabs.js dispatches cpl-tab-activated on WINDOW;
//      the tab now re-activates on a window-dispatched event (the old
//      document listener never fired, breaking "sign in and come back").
//
// Run from repo root: `npm test` (or `node tests/sierra_training_p1.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("sierra_training.js", "utf8");
const CHAT_SRC = fs.readFileSync("cpl_chat.js", "utf8");

const NOW = Date.now();
const iso = (agoDays) => new Date(NOW - agoDays * 86400000).toISOString();

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
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

// ── (a) date filters ──
(function () {
  const api = makeWin().CPL_SIERRA_TRAINING_TAB;
  check("withinDays: no range passes everything", api._withinDays(iso(400), 0) && api._withinDays("garbage", 0));
  check("withinDays: 2-day-old row inside 7d", api._withinDays(iso(2), 7));
  check("withinDays: 12-day-old row outside 7d", !api._withinDays(iso(12), 7));
  check("withinDays: unparseable date fails a range", !api._withinDays("garbage", 7));

  api._state.feedback = [
    { turn_id: "a", created_at: iso(0.2), rating: "down", status: "new", question: "q-new" },
    { turn_id: "b", created_at: iso(9), rating: "down", status: "new", question: "q-old" },
  ];
  api._state.fStatus = "";
  api._state.fDays = "7";
  const rows = api._filteredFeedback();
  check("feedback fDays=7 keeps only the fresh row", rows.length === 1 && rows[0].turn_id === "a");

  api._state.turns = [
    { id: 1, created_at: iso(0.5), top_similarity: 0.2, question: "fresh gap" },
    { id: 2, created_at: iso(20), top_similarity: 0.2, question: "stale gap" },
  ];
  api._state.gDays = "7";
  const g = api._gapRows();
  check("gap gDays=7 keeps only the fresh gap", g.length === 1 && g[0].id === 1);
})();

// ── (b) log-turn link ──
(function () {
  const api = makeWin().CPL_SIERRA_TRAINING_TAB;
  api._state.turns = [
    { id: 1, created_at: iso(5), top_similarity: 0.9, topic_match: true, question: "Does RCC offer firefighter CPL?", response: "yes" },
    { id: 2, created_at: iso(1), top_similarity: 0.31, topic_match: false, question: "does rcc  offer firefighter cpl?", response: "I don't have that." },
    { id: 3, created_at: iso(1), top_similarity: 0.9, topic_match: true, question: "something else", response: "ok" },
  ];
  const fb = { turn_id: "t1", created_at: iso(1.01), question: "Does RCC offer firefighter CPL?", rating: "down", status: "new" };
  const m = api._logMatch(fb);
  check("logMatch resolves same normalized question nearest in time", m && m.id === 2);
  check("logMatch returns null when nothing matches", api._logMatch({ question: "nope", created_at: iso(1) }) === null);

  api._state.open = { t1: true };
  const rowHtml = api._feedbackRow(fb);
  check("expanded feedback row shows the log-turn similarity", /What Sierra had to work with/.test(rowHtml) && /Closest match in the knowledge base: <b>0\.31<\/b>/.test(rowHtml));
  check("expanded feedback row carries the gap chips from the matched turn",
    /nothing close/.test(rowHtml) && /didn\u2019t know/.test(rowHtml));
  const rowMiss = api._feedbackRow({ turn_id: "t2", created_at: iso(1), question: "unmatched", rating: "up", status: "new" });
  api._state.open = { t2: true };
  const rowMiss2 = api._feedbackRow({ turn_id: "t2", created_at: iso(1), question: "unmatched", rating: "up", status: "new" });
  check("unmatched feedback row states the honest miss", /older than the/.test(rowMiss2) && !/older than the/.test(rowMiss));
})();

// ── (c) Test in Sierra — producer + cpl_chat consumer ──
(function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api._state.feedback = [{ turn_id: "t9", question: "What about CPR credit?", rating: "down", status: "new", created_at: iso(1) }];
  api._state.turns = [{ id: 7, question: "gap question", top_similarity: 0.1, created_at: iso(1) }];
  check("lookupQuestion resolves a feedback handle", api._lookupQuestion("fb:t9") === "What about CPR credit?");
  check("lookupQuestion resolves a gap handle (numeric id)", api._lookupQuestion("gap:7") === "gap question");
  check("lookupQuestion rejects a malformed handle", api._lookupQuestion("zzz") === null);

  // The real page HAS a CPL Assistant pane; this fixture did not, so the
  // hand-off's new suppression fallback correctly routed elsewhere and the
  // assertion read as a regression. Give the fixture the pane it is meant to
  // represent, then test the suppressed case on purpose below.
  w.document.body.insertAdjacentHTML("beforeend",
    '<div id="tab-chatbot"></div><nav><button class="cpl-tab" data-tab="chatbot"></button></nav>');

  api._testInSierra("What about CPR credit?");
  check("testInSierra stores the question under the shared key",
    w.sessionStorage.getItem("cplSierraTestQ.v1") === "What about CPR credit?");
  check("testInSierra navigates to #chatbot", w.location.hash === "#chatbot");

  // Sam, 2026-08-14, planning to suppress CPL Assistant from an Admin tab
  // because it is now the same assistant as Sierra. It is — but this hand-off
  // named #chatbot, so suppressing that tab would have left the trainer with no
  // way to test an instruction, and it would have failed SILENTLY.
  w.document.querySelector('.cpl-tab[data-tab="chatbot"]').setAttribute("data-org-hidden", "1");
  w.location.hash = "#none";
  api._testInSierra("suppressed-case question");
  check("a suppressed CPL Assistant reroutes the hand-off to My College",
    w.location.hash === "#college-briefing");
  check("the question still reaches the shared key when rerouted",
    w.sessionStorage.getItem("cplSierraTestQ.v1") === "suppressed-case question");

  // And with no pane at all (removed rather than hidden).
  w.document.getElementById("tab-chatbot").remove();
  w.location.hash = "#none";
  api._testInSierra("no-pane question");
  check("a missing CPL Assistant pane also reroutes rather than dead-ending",
    w.location.hash === "#college-briefing");

  // consumer side: cpl_chat.js prefills (never auto-sends) on chatbot activation
  const dom2 = new JSDOM('<!doctype html><html><head></head><body><div class="cpl-tab-pane" id="tab-chatbot"><div class="main-container"></div></div></body></html>',
    { url: "https://example.org/", runScripts: "outside-only" });
  const w2 = dom2.window;
  w2.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  w2.__fetches = [];
  w2.fetch = function (url, init) { w2.__fetches.push({ url: String(url), init: init }); return Promise.reject(new Error("no net")); };
  w2.sessionStorage.setItem("cplSierraTestQ.v1", "What about CPR credit?");
  w2.eval(CHAT_SRC);
  w2.document.dispatchEvent(new w2.Event("DOMContentLoaded", { bubbles: false }));
  const input = w2.document.getElementById("cplchat-input");
  check("cpl_chat consumes the prefill at mount (deep-link landing)",
    input && input.value === "What about CPR credit?");
  check("prefill key is cleared after consumption", w2.sessionStorage.getItem("cplSierraTestQ.v1") === null);
  check("prefill never auto-sends", w2.__fetches.length === 0);

  // and again via the window-dispatched tab-activation event
  w2.sessionStorage.setItem("cplSierraTestQ.v1", "second question");
  w2.dispatchEvent(new w2.CustomEvent("cpl-tab-activated", { detail: { tab: "chatbot" } }));
  check("cpl_chat consumes the prefill on cpl-tab-activated (window)",
    input.value === "second question");
})();

// ── (d) bulk triage ──
(async function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  w.confirm = () => true;
  api._state.feedback = [
    { turn_id: "b1", created_at: iso(1), rating: "down", status: "new", question: "one" },
    { turn_id: "b2", created_at: iso(1), rating: "down", status: "triaged", question: "two" },
    { turn_id: "b3", created_at: iso(1), rating: "down", status: "addressed", question: "three" },
  ];
  api._state.fStatus = "";       // no status filter — all three visible
  api._state.bulkStatus = "triaged";
  const root = w.document.getElementById("sierra-training-root");
  await api._bulkTriage(root);
  const rpc = w.__fetches.filter((f) => /rpc\/sierra_feedback_set_status/.test(f.url));
  check("bulk triage fires one RPC per row NOT already at the target", rpc.length === 2);
  const bodies = rpc.map((f) => JSON.parse(f.init.body));
  check("bulk triage targets the right rows with the right status",
    bodies.every((b) => b.p_status === "triaged") &&
    bodies.map((b) => b.p_turn_id).sort().join(",") === "b1,b3");
  check("bulk triage updates local state", api._state.feedback.every((f) => f.status === "triaged"));
})().then(report);

// ── (e) window-listener fix ──
function checkListener() {
  const w = makeWin();
  // logged-out variant: strip the team pass so activate() renders the gate
  w.localStorage.removeItem("cpl_team_pass");
  const root = w.document.getElementById("sierra-training-root");
  root.innerHTML = "";
  w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "sierra-training" } }));
  check("tab re-activates on a WINDOW-dispatched cpl-tab-activated", /Sierra Training/.test(root.innerHTML));
  check("source listens on window, not document",
    /window\.addEventListener\("cpl-tab-activated"/.test(SRC) && !/document\.addEventListener\("cpl-tab-activated"/.test(SRC));
  const MAP_SRC = fs.readFileSync("map_users.js", "utf8");
  check("map_users.js got the same window-listener fix",
    /window\.addEventListener\("cpl-tab-activated"/.test(MAP_SRC) && !/document\.addEventListener\("cpl-tab-activated"/.test(MAP_SRC));
}

// ── report (after the async bulk test) ──
let reported = false;
function report() {
  if (reported) return;
  reported = true;
  checkListener();
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\nsierra_training_p1.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
}
