// CPL Assistant tab (cpl_chat.js) — audience selector + 👍/👎 feedback (jsdom).
//
// Guards (Session 92 — the Sierra audience/feedback layer, mirrored from
// sierra/sierra.js; see tests/sierra_page.test.js for the standalone page):
//  (a) the panel mounts into #tab-chatbot and injects its NEW-class CSS from JS
//      (no Rule-4 HTML edit — style#cplchat-aud-css);
//  (b) the audience selector renders the 5 population chips and the pick is
//      REQUIRED before the first send (no request without it);
//  (c) the pick persists to the localStorage key SHARED with sierra/ and rides
//      in the POST body as `audience`;
//  (d) a completed answer gets a feedback bar; 👍 calls the
//      sierra_feedback_upsert RPC with page:'cobi-tab' + the Q/A snapshot (a
//      direct table upsert would trip RLS — anon has no SELECT); the note
//      re-upserts the SAME turn row.
//
// Run from repo root: `npm test` (or `node tests/cpl_chat_audience.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("cpl_chat.js", "utf8");
const HTML = '<!doctype html><html><head></head><body>' +
  '<div id="tab-chatbot"><div class="main-container"></div></div></body></html>';

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
    url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  const requests = [];
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  if (!opts.noAudience) {
    try { w.localStorage.setItem("cplSierraAudience.v1", "student"); } catch (e) { /* ignore */ }
  }
  w.fetch = function (url, init) {
    const body = init && init.body ? JSON.parse(init.body) : null;
    requests.push({ url: String(url), init: init, body: body });
    return Promise.resolve(streamResp(opts.deltas || ["Hello ", "**world**"]));
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { dom: dom, w: w, API: w.CPL_CHAT, requests: requests };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function drain(n) { for (let i = 0; i < (n || 12); i++) await tick(); }
function submit(w, text) {
  w.document.getElementById("cplchat-input").value = text;
  w.document.querySelector(".cplchat-send").click();
}

(async function () {
  // ── (a) mount + injected CSS ──
  {
    const { w, API } = loadDom();
    check("panel mounts into #tab-chatbot", !!w.document.querySelector("#tab-chatbot .cplchat"));
    check("new-class CSS is injected from JS (style#cplchat-aud-css)",
      !!w.document.getElementById("cplchat-aud-css"));
    check("injected CSS uses var(--token) not bare hex for the brand roles",
      /var\(--seal-blue/.test(w.document.getElementById("cplchat-aud-css").textContent));
    check("exposes CPL_CHAT helpers", API && Array.isArray(API.AUDIENCES) &&
      typeof API.feedbackPayload === "function");
  }

  // ── (b) audience gate ──
  {
    const { w, requests } = loadDom({ noAudience: true });
    const chips = w.document.querySelectorAll("#cplchat-audience .cplchat-aud-chip");
    check("audience selector renders 5 population chips", chips.length === 5);
    submit(w, "hello?");
    await drain(6);
    check("send is BLOCKED until an audience is picked (no request)", requests.length === 0);
    check("the block explains itself in the status line",
      /who you are/i.test(w.document.getElementById("cplchat-status").textContent));
    chips[0].click(); // 🎓 student
    submit(w, "hello?");
    await drain(14);
    check("after picking, the request carries `audience`",
      requests.length === 1 && requests[0].body.audience === "student");
  }

  // ── (c) shared persistence + body field ──
  {
    const { w, requests, API } = loadDom(); // pre-seeded 'student'
    check("audience key is the one sierra/ shares", API.AUD_KEY === "cplSierraAudience.v1");
    submit(w, "Which colleges teach welding?");
    await drain(14);
    check("pre-seeded pick is honored and sent",
      requests.length === 1 && requests[0].body.audience === "student" &&
      Array.isArray(requests[0].body.history));
    const onChip = w.document.querySelector("#cplchat-audience .cplchat-aud-chip.on");
    check("the persisted pick renders selected", onChip && /Student/i.test(onChip.textContent));
  }

  // ── (d) feedback bar → sierra_feedback upserts ──
  {
    const { w, requests } = loadDom();
    submit(w, "Does Saddleback College offer firefighter CPL?");
    await drain(14);
    const fb = w.document.querySelector(".cplchat-fb");
    check("a feedback bar renders under the answer", !!fb);
    const btns = fb ? fb.querySelectorAll(".cplchat-fb-btn") : [];
    check("it offers 👍 and 👎", btns.length === 2);
    btns[1].click(); // 👎
    await drain(4);
    let fbReqs = requests.filter((r) => /\/rest\/v1\/rpc\/sierra_feedback_upsert$/.test(r.url));
    check("clicking 👎 calls the feedback RPC with page:'cobi-tab'",
      fbReqs.length === 1 && fbReqs[0].body.p_rating === "down" &&
      fbReqs[0].body.p_page === "cobi-tab" && fbReqs[0].body.p_audience === "student" &&
      /Saddleback/.test(fbReqs[0].body.p_question));
    const noteWrap = fb.querySelector(".cplchat-fb-note");
    check("the optional note box appears after rating", noteWrap && noteWrap.hidden === false);
    noteWrap.querySelector("input").value = "Answer missed the statewide standard";
    noteWrap.querySelector("button").click();
    await drain(4);
    fbReqs = requests.filter((r) => /\/rest\/v1\/rpc\/sierra_feedback_upsert$/.test(r.url));
    check("Send note re-upserts the SAME turn row with the note",
      fbReqs.length === 2 && fbReqs[1].body.p_note === "Answer missed the statewide standard" &&
      fbReqs[1].body.p_turn_id === fbReqs[0].body.p_turn_id);
  }

  // ── report ──
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\ncpl_chat_audience.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
