// Fact Sheet — "Sierra" CPL Assistant (fact-sheet/factsheet_sierra.js) — jsdom test.
//
// Guards:
//  (a) the page wires the script + the widget injects a screen-only launcher into
//      the action bar (NOT inside <main>, so print/Word exclude it);
//  (b) opening builds a Sierra-branded dialog drawer (appended to <body>, .no-print)
//      with greeting, suggested chips, input, close; launcher click + Esc toggle it;
//  (c) submit POSTs to the shared cpl-chat function with {query, session_id, history}
//      + the anon apikey/Authorization, and streams the SSE answer into a bot bubble;
//  (d) multi-turn — the prior turn rides in `history` on the next request;
//  (e) XSS-safe — a crafted streamed delta injects no live <script>/<img>;
//  (f) markdown-lite basics; (g) graceful with no fetch.
//
// Run from repo root: `npm test` (or `node tests/factsheet_sierra.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8");

// A streaming Response: SSE `event: text` deltas, then `event: done`.
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
    url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/" });
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
  if (w.CPL_FACTSHEET_SIERRA) w.CPL_FACTSHEET_SIERRA.boot();
  return { dom: dom, w: w, API: w.CPL_FACTSHEET_SIERRA, requests: requests };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function drain(n) { for (let i = 0; i < (n || 10); i++) await tick(); }
function lastBotBubble(w) {
  const b = w.document.querySelectorAll("#fs-sra-log .fs-sra-msg.fs-sra-bot .fs-sra-bubble");
  return b[b.length - 1];
}

// ── Part A — static wiring ──
check("index.html loads factsheet_sierra.js", /<script src="\.\/factsheet_sierra\.js"><\/script>/.test(HTML));
check("exposes the API", typeof loadDom().API === "object");

(async function () {
  // ── (a) launcher in the action bar, screen-only, outside <main> ──
  {
    const { w, API } = loadDom();
    const btn = w.document.getElementById("btn-sierra");
    check("boot injects a #btn-sierra launcher", !!btn);
    check("launcher is labeled with the Sierra brand", btn && /Sierra/.test(btn.textContent));
    check("launcher is screen-only (.no-print)", btn && btn.classList.contains("no-print"));
    check("launcher lives in the action bar (the title row)", btn && !!btn.closest(".actionbar"));
    check("launcher is NOT inside <main> (so print/Word exclude it)", !w.document.querySelector("main #btn-sierra"));
    // boot is idempotent (no duplicate launcher on a second boot)
    API.boot();
    check("boot is idempotent — one launcher", w.document.querySelectorAll("#btn-sierra").length === 1);
  }

  // ── (b) open builds the drawer; toggle via click + Esc ──
  {
    const { w, API } = loadDom();
    check("drawer not built until opened", !w.document.getElementById("fs-sra-drawer"));
    w.document.getElementById("btn-sierra").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const dr = w.document.getElementById("fs-sra-drawer");
    check("clicking the launcher opens the drawer", !!dr && API.isOpen() && dr.classList.contains("on"));
    check("drawer is a dialog appended to <body>, .no-print", dr && dr.getAttribute("role") === "dialog" &&
      dr.parentElement === w.document.body && dr.classList.contains("no-print"));
    check("drawer is NOT inside <main>", !w.document.querySelector("main #fs-sra-drawer"));
    check("drawer shows the Sierra name + greeting", /Sierra/.test(dr.textContent) && /Credit for Prior Learning/.test(dr.textContent));
    check("drawer has suggested chips, an input, and a close button",
      !!dr.querySelector("#fs-sra-suggest .fs-sra-chip") && !!dr.querySelector("#fs-sra-input") && !!dr.querySelector(".fs-sra-close"));
    // Escape closes
    w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape" }));
    check("Escape closes the drawer", !API.isOpen() && !dr.classList.contains("on"));
  }

  // ── (c) submit → POST to cpl-chat + streamed answer renders ──
  {
    const { w, API, requests } = loadDom();
    API.open();
    w.document.getElementById("fs-sra-input").value = "How many students?";
    w.document.querySelector(".fs-sra-send").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await drain(12);
    check("submit POSTs exactly to the shared cpl-chat function",
      requests.length === 1 && /\/functions\/v1\/cpl-chat$/.test(requests[0].url) && (requests[0].init.method === "POST"));
    check("request carries the anon apikey + Authorization",
      requests[0].init.headers.apikey && /^Bearer /.test(requests[0].init.headers.Authorization));
    check("request body = {query, session_id, history(array)} (opts into multi-turn)",
      requests[0].body.query === "How many students?" && typeof requests[0].body.session_id === "string" &&
      Array.isArray(requests[0].body.history));
    check("the user message is shown in the transcript", /How many students\?/.test(w.document.getElementById("fs-sra-log").textContent));
    const bub = lastBotBubble(w);
    check("the streamed answer renders into a bot bubble (with markdown)",
      bub && /Hello/.test(bub.textContent) && !!bub.querySelector("strong"));
  }

  // ── (d) multi-turn — prior turn rides in history on the next request ──
  {
    const { w, API, requests } = loadDom();
    API.open();
    function send(q) {
      w.document.getElementById("fs-sra-input").value = q;
      w.document.querySelector(".fs-sra-send").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    }
    send("Q1"); await drain(12);
    check("turn 1 history is empty", requests[0].body.history.length === 0);
    check("convo recorded the completed turn", API.convo().length === 2);
    send("Q2"); await drain(12);
    check("turn 2 sends the prior turn in history",
      requests.length === 2 && requests[1].body.history.length === 2 &&
      requests[1].body.history[0].role === "user" && requests[1].body.history[0].content === "Q1");
  }

  // ── (e) XSS-safe streamed delta ──
  {
    const { w, API } = loadDom({ deltas: ['<script>alert(1)</script> <img src=x onerror=evil()> **ok**'] });
    API.open();
    w.document.getElementById("fs-sra-input").value = "x";
    w.document.querySelector(".fs-sra-send").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await drain(12);
    const bub = lastBotBubble(w);
    check("no live <script>/<img> element from a crafted answer", bub && bub.querySelectorAll("script,img").length === 0);
    check("the dangerous text is shown escaped, formatting still applies", bub && /alert\(1\)/.test(bub.textContent) && !!bub.querySelector("strong"));
  }

  // ── (f) markdown-lite + (g) graceful no-fetch ──
  {
    const { API } = loadDom();
    const md = API.renderMarkdown("see **this** and https://map.rccd.edu now");
    check("renderMarkdown bolds **text**", /<strong>this<\/strong>/.test(md));
    check("renderMarkdown linkifies bare https URLs with rel=noopener", /<a href="https:\/\/map\.rccd\.edu"[^>]*rel="noopener/.test(md));
    check("escapeHtml neutralizes a tag", API.escapeHtml("<b>x</b>") === "&lt;b&gt;x&lt;/b&gt;");
  }
  {
    let threw = false;
    try { loadDom({ noFetch: true }); } catch (e) { threw = true; }
    check("boots without throwing when fetch is unavailable", !threw);
  }

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();
