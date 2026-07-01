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
//  (f) graceful when fetch is unavailable.
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

  // ── report ──
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\nsierra_page.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
