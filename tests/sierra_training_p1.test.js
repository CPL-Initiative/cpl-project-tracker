// Sierra Training tab — P1 team-session affordances (Session 94, SkySierra).
//
// Guards the additions from handoff-94 workstream 1:
//  (a) DATE FILTERS — the fDays / gDays "Any time / 24h / 7d / 30d" selects
//      narrow the feedback queue + gap miner by created_at;
//  (b) LOG-TURN LINK — a feedback row resolves its chat_interactions turn
//      (same normalized question, nearest in time) and the expanded row shows
//      the retrieval telemetry (similarity / topic-match / gap chips);
//  (c) TEST IN SIERRA — since S398 the button opens Sierra AI over this tab and
//      asks (CPL_CHAT.open, send: true), leaving no key behind; without the
//      chat module it stores the question under the shared sessionStorage key
//      and goes by the #chatbot link, which cpl_chat.js answers by opening
//      Sierra AI and PREFILLING her input (never auto-sending);
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
// Since S398 the producer asks Sierra AI over this tab (CPL_CHAT.open with
// send: true) and never leaves it; the key-and-link path is its fallback when
// the chat module cannot open, and the #chatbot link is what consumes it.
// Awaited before the report: the consumer half waits on the link's deferral.
const handoffDone = (async function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api._state.feedback = [{ turn_id: "t9", question: "What about CPR credit?", rating: "down", status: "new", created_at: iso(1) }];
  api._state.turns = [{ id: 7, question: "gap question", top_similarity: 0.1, created_at: iso(1) }];
  check("lookupQuestion resolves a feedback handle", api._lookupQuestion("fb:t9") === "What about CPR credit?");
  check("lookupQuestion resolves a gap handle (numeric id)", api._lookupQuestion("gap:7") === "gap question");
  check("lookupQuestion rejects a malformed handle", api._lookupQuestion("zzz") === null);

  // The live page has the chat module; Sierra AI opens over this tab and asks.
  const opened = [];
  w.CPL_CHAT = { open: function (o) { opened.push(o); return true; } };
  const btn = w.document.createElement("button");
  w.location.hash = "#sierra-training";
  api._testInSierra("What about CPR credit?", undefined, btn);
  check("testInSierra opens Sierra AI with the question, to be asked at once",
    opened.length === 1 && opened[0].question === "What about CPR credit?" && opened[0].send === true);
  check("…and hands her the control that asked, for focus on the way back", opened.length === 1 && opened[0].from === btn);
  check("…and stays on this tab, writing no hand-off key",
    w.location.hash === "#sierra-training" && w.sessionStorage.getItem("cplSierraTestQ.v1") === null);

  // Sam, 2026-11-01: "should go to the current version and open her in a side panel so the
  // user doesn't get lost". With the side bar's script present, the current Sierra opens
  // beside this tab with the question, and the full-screen chat stays shut.
  const asked = [];
  opened.length = 0;
  w.CPL_SIERRA_BAR = { ask: function (q, from) { asked.push([q, from]); }, setChip: function () {}, isOpen: function () { return false; } };
  api._testInSierra("Which colleges have met the vet sprint goal?", undefined, btn);
  check("⭐ with the side bar loaded, testInSierra asks the current Sierra beside the tab, not the full-screen chat",
    asked.length === 1 && asked[0][0] === "Which colleges have met the vet sprint goal?" && asked[0][1] === btn && opened.length === 0);
  check("…and maps the bar's tokens onto First Light", !!w.document.getElementById("sit-sbar-css"));
  w.CPL_SIERRA_BAR = undefined;

  // No chat module that can open (an older page): the question waits under the
  // shared key and the retired tab's address carries it to Sierra AI.
  w.CPL_CHAT = undefined;
  w.sessionStorage.setItem("cplSierraTestDest.v1", "college-briefing");   // stale, from a hop that never landed
  api._testInSierra("fallback question");
  check("without open(), testInSierra stores the question under the shared key",
    w.sessionStorage.getItem("cplSierraTestQ.v1") === "fallback question");
  check("…clears a stale My College destination, so the default stays the default",
    w.sessionStorage.getItem("cplSierraTestDest.v1") === null);
  check("…and goes by the #chatbot link", w.location.hash === "#chatbot");

  // consumer side: the #chatbot link opens Sierra AI and fills (never sends)
  const dom2 = new JSDOM('<!doctype html><html><head></head><body><div class="cpl-tab-pane" id="tab-dashboard"></div></body></html>',
    { url: "https://example.org/#chatbot", runScripts: "outside-only" });
  const w2 = dom2.window;
  w2.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  w2.__fetches = [];
  w2.fetch = function (url, init) { w2.__fetches.push({ url: String(url), init: init }); return Promise.reject(new Error("no net")); };
  w2.sessionStorage.setItem("cplSierraTestQ.v1", "What about CPR credit?");
  w2.eval(CHAT_SRC);
  w2.document.dispatchEvent(new w2.Event("DOMContentLoaded", { bubbles: false }));
  await new Promise((r) => setTimeout(r, 5));
  const input = w2.document.querySelector("#cplchat-cobi .cplchat-input, .cplchat-full .cplchat-input");
  check("cpl_chat consumes the prefill on the #chatbot landing, in Sierra AI's own box",
    input && input.value === "What about CPR credit?");
  check("prefill key is cleared after consumption", w2.sessionStorage.getItem("cplSierraTestQ.v1") === null);
  check("prefill never auto-sends", w2.__fetches.length === 0);

  // and again via the window-dispatched tab-activation event, on a later link
  w2.sessionStorage.setItem("cplSierraTestQ.v1", "second question");
  w2.CPL_CHAT._collapseDock();
  w2.history.replaceState(null, "", "/#chatbot");
  w2.dispatchEvent(new w2.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
  await new Promise((r) => setTimeout(r, 5));
  check("cpl_chat consumes the prefill on cpl-tab-activated (window) with the #chatbot link",
    !!input && input.value === "second question" && w2.CPL_CHAT._dockExpanded());
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
})().then(function () { return handoffDone; }).then(report);

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
