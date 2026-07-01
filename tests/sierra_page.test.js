// Sierra standalone page (sierra/index.html + sierra/sierra.js) — jsdom test.
//
// Guards:
//  (a) the page loads sierra.js + has the chat-first structure (log, form, input, send);
//  (b) wiring fills the suggested-question chips and exposes the pure helpers;
//  (c) submit POSTs to the shared cpl-chat function with {query, session_id, history}
//      + the anon apikey/Authorization, shows the user turn, and streams the SSE
//      answer into a bot bubble with markdown;
//  (d) MULTI-TURN — the prior turn rides in `history` on the next request;
//  (e) XSS-safe — a crafted streamed delta injects no live <script>/<img>;
//  (f) graceful when fetch is unavailable;
//  (g) AUDIENCE — the primary-population pick is REQUIRED before the first
//      send, persists to localStorage (key shared with the COBI tab), and
//      rides in the POST body as `audience`;
//  (h) FEEDBACK — 👍/👎 under each answer calls the sierra_feedback_upsert RPC
//      (rating, turn_id, audience, Q/A snapshot — a direct table upsert would
//      trip RLS since anon has no SELECT) and the optional note re-upserts the
//      SAME turn row;
//  (i) feedbackPayload clamps note/question/response lengths.
//
// Run from repo root: `npm test` (or `node tests/sierra_page.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("sierra/index.html", "utf8");
const SRC = fs.readFileSync("sierra/sierra.js", "utf8");

function streamResp(deltas) {
  const enc = new TextEncoder();
  const events = deltas.map((t) => "event: text\ndata: " + JSON.stringify({ text: t }) + "\n\n");
  events.push("event: done\ndata: {}\n\n");
  let i = 0;
  return {
    ok: true, status: 200,
    body: { getReader: () => ({
      read: () => i < events.length
        ? Promise.resolve({ value: enc.encode(events[i++]), done: false })
        : Promise.resolve({ value: undefined, done: true }),
      releaseLock: function () {},
    }) },
    text: () => Promise.resolve(deltas.join("")),
  };
}

function loadDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/sierra/" });
  const w = dom.window;
  const requests = [];
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  // The audience pick is required before send — pre-seed it for the legacy
  // scenarios; the dedicated audience test passes noAudience to test the gate.
  if (!opts.noAudience) {
    try { w.localStorage.setItem("cplSierraAudience.v1", "student"); } catch (e) { /* ignore */ }
  }
  if (opts.noFetch) { try { delete w.fetch; } catch (e) { w.fetch = undefined; } }
  else w.fetch = function (url, init) {
    const body = init && init.body ? JSON.parse(init.body) : null;
    requests.push({ url: String(url), init: init, body: body });
    const d = typeof opts.deltas === "function" ? opts.deltas(requests.length) : (opts.deltas || ["Hello ", "**world**"]);
    return Promise.resolve(streamResp(d));
  };
  w.eval(SRC);
  // Force wiring deterministically (jsdom may defer DOMContentLoaded); wire() is idempotent.
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { dom: dom, w: w, API: w.CPL_SIERRA_PAGE, requests: requests };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function drain(n) { for (let i = 0; i < (n || 12); i++) await tick(); }
function submit(w, text) {
  w.document.getElementById("s-input").value = text;
  w.document.getElementById("s-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}
function lastBotBubble(w) {
  const b = w.document.querySelectorAll("#s-log .s-msg.s-bot .s-bubble");
  return b[b.length - 1];
}

// ── Part A — static wiring ──
check("index.html loads sierra.js", /<script src="\.\/sierra\.js"><\/script>/.test(HTML));
check("index.html has the chat structure", /id="s-log"/.test(HTML) && /id="s-form"/.test(HTML) &&
  /id="s-input"/.test(HTML) && /id="s-send"/.test(HTML));
check("index.html has the audience selector container", /id="s-audience"/.test(HTML));
check("favicon references the repo-root seal", /href="\.\.\/cccco_seal\.png"/.test(HTML));
check("standalone — no COBI tab nav present", !/data-tab=/.test(HTML) && !/cpl-tab/.test(HTML));
{
  const { API } = loadDom();
  check("exposes CPL_SIERRA_PAGE helpers", API && typeof API.renderMarkdown === "function" &&
    typeof API.parseSse === "function" && /\/functions\/v1\/cpl-chat$/.test(API.CHAT_URL));
}

(async function () {
  // ── (b) chips filled ──
  {
    const { w } = loadDom();
    const chips = w.document.querySelectorAll("#s-suggest .s-chip");
    check("wiring fills the starter chips", chips.length >= 3);
    check("a chip references the new offerings capability (NCCER/OSHA/construction)",
      Array.from(chips).some((c) => /NCCER|OSHA|construction|welding/i.test(c.textContent)));
  }

  // ── (c) submit → POST + streamed answer ──
  {
    const { w, requests } = loadDom();
    submit(w, "How many students has CPL served?");
    await drain(14);
    check("submit POSTs exactly to the shared cpl-chat function",
      requests.length === 1 && /\/functions\/v1\/cpl-chat$/.test(requests[0].url) && requests[0].init.method === "POST");
    check("request carries the anon apikey + Authorization",
      requests[0].init.headers.apikey && /^Bearer /.test(requests[0].init.headers.Authorization));
    check("body = {query, session_id, history(array)} (opts into multi-turn)",
      requests[0].body.query === "How many students has CPL served?" &&
      typeof requests[0].body.session_id === "string" && Array.isArray(requests[0].body.history) &&
      requests[0].body.history.length === 0);
    check("the user message is shown", /How many students has CPL served\?/.test(w.document.getElementById("s-log").textContent));
    const bub = lastBotBubble(w);
    check("streamed answer renders into a bot bubble with markdown", bub && /Hello/.test(bub.textContent) && !!bub.querySelector("strong"));
    check("starter chips removed after first question", !w.document.getElementById("s-suggest"));
  }

  // ── (d) multi-turn — prior turn rides in history ──
  {
    const { w, requests } = loadDom();
    submit(w, "Which colleges teach welding?");
    await drain(14);
    submit(w, "How about near Long Beach?");
    await drain(14);
    check("second request carries the prior turn in history",
      requests.length === 2 && Array.isArray(requests[1].body.history) && requests[1].body.history.length >= 2 &&
      requests[1].body.history[0].role === "user" && /welding/.test(requests[1].body.history[0].content));
  }

  // ── (e) XSS-safe — crafted delta injects nothing live ──
  {
    const { w } = loadDom({ deltas: ['<img src=x onerror="alert(1)">', "<script>alert(2)</script>"] });
    submit(w, "test");
    await drain(14);
    const bub = lastBotBubble(w);
    check("no live <img> injected", bub && !bub.querySelector("img"));
    check("no live <script> injected", bub && !bub.querySelector("script"));
    check("the crafted markup shows as escaped text", bub && /alert\(1\)|alert\(2\)/.test(bub.textContent));
  }

  // ── (f) graceful with no fetch ──
  {
    const { w } = loadDom({ noFetch: true });
    submit(w, "hi");
    await drain(14);
    const bub = lastBotBubble(w);
    check("no-fetch shows a friendly error, not a crash", bub && /couldn.t reach|something went wrong/i.test(bub.textContent));
  }

  // ── (g) audience — required, persisted, sent ──
  {
    const { w, requests, API } = loadDom({ noAudience: true });
    const chips = w.document.querySelectorAll("#s-audience .s-aud-chip");
    check("audience selector renders 5 population chips", chips.length === 5);
    submit(w, "hello?");
    await drain(6);
    check("send is BLOCKED until an audience is picked (no request)", requests.length === 0);
    check("the block explains itself (flash + status)",
      /who you are/i.test(w.document.getElementById("s-status").textContent));
    chips[1].click(); // 📚 Faculty
    submit(w, "hello?");
    await drain(14);
    check("after picking, the request carries `audience`",
      requests.length === 1 && requests[0].body.audience === API.AUDIENCES[1].k);
    check("the pick persists to the SHARED localStorage key",
      w.localStorage.getItem(API.AUD_KEY) === API.AUDIENCES[1].k &&
      API.AUD_KEY === "cplSierraAudience.v1");
  }

  // ── (h) feedback — 👍/👎 + note upsert ──
  {
    const { w, requests } = loadDom();
    submit(w, "Which colleges give credit for a real estate license?");
    await drain(14);
    const fb = w.document.querySelector("#s-log .s-fb");
    check("a feedback bar renders under the answer", !!fb);
    const btns = fb ? fb.querySelectorAll(".s-fb-btn") : [];
    check("it offers 👍 and 👎", btns.length === 2);
    btns[0].click();
    await drain(4);
    let fbReqs = requests.filter((r) => /\/rest\/v1\/rpc\/sierra_feedback_upsert$/.test(r.url));
    check("clicking 👍 calls the feedback RPC with a rating (turn_id present)",
      fbReqs.length === 1 && fbReqs[0].body.p_rating === "up" &&
      typeof fbReqs[0].body.p_turn_id === "string" && fbReqs[0].body.p_turn_id.length >= 8);
    check("the row carries audience + page + the Q/A snapshot",
      fbReqs[0].body.p_audience === "student" && fbReqs[0].body.p_page === "sierra" &&
      /real estate/.test(fbReqs[0].body.p_question) && fbReqs[0].body.p_response.length > 0);
    const noteWrap = fb.querySelector(".s-fb-note");
    check("the optional note box appears after rating", noteWrap && noteWrap.hidden === false);
    noteWrap.querySelector("input").value = "Missing my college";
    noteWrap.querySelector("button").click();
    await drain(4);
    fbReqs = requests.filter((r) => /\/rest\/v1\/rpc\/sierra_feedback_upsert$/.test(r.url));
    check("Send note re-upserts the SAME turn row with the note",
      fbReqs.length === 2 && fbReqs[1].body.p_note === "Missing my college" &&
      fbReqs[1].body.p_turn_id === fbReqs[0].body.p_turn_id);
  }

  // ── (i) feedbackPayload clamps ──
  {
    const { API } = loadDom();
    const p = API.feedbackPayload({
      turnId: "t-123456789", rating: "down",
      note: "x".repeat(3000), question: "q".repeat(5000), response: "r".repeat(20000),
    });
    check("feedbackPayload clamps note/question/response lengths",
      p.p_note.length === 2000 && p.p_question.length === 4000 && p.p_response.length === 12000);
    check("feedbackPayload nulls an absent note",
      API.feedbackPayload({ turnId: "t-123456789", rating: "up" }).p_note === null);
  }

  // ── report ──
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\nsierra_page.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
