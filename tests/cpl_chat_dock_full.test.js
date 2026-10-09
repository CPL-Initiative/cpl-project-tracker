// The docked Sierra fills the window when she answers (cpl_chat.js, jsdom).
//
// Sam, 2026-10-08: "What do you think about having Sierra expand full screen for
// when responding?" — ruled Expand when answering (Sheet 54 card 1) and Expand
// in place (Sheet 53 card 3). Guards:
//  (a) the dedicated CPL Assistant pane gets no control and never expands;
//  (b) a dock (mountInto) gets ONE word control, a direct child of the wrap and
//      outside the intro My College hoists away; its CSS is injected, on tokens;
//  (c) a send through the dock expands IN PLACE: the same wrap moves to <body>
//      as a modal dialog named by its bar, the rest of the page inert and its
//      scroll locked, and the request still carries the tab's scope, surface
//      and the reader's credential;
//  (d) Back to the tab returns the wrap to its seat with the conversation;
//  (e) a reader who went back stays docked for that conversation, until
//  (f) Full screen, and (g) Escape returns too; (h) a new subject resets it;
//  (i) the tab repainting under a full-screen Sierra keeps her full screen and
//      keeps the conversation, a streaming answer included;
//  (j) a different tab's dock keeps today's empty log;
//  (k) arriving at another tab takes her back to her seat;
//  (l) an unconfirmed role never expands (the guard returns first).
//
// Run from repo root: `npm test` (or `node tests/cpl_chat_dock_full.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("cpl_chat.js", "utf8");
const HTML = '<!doctype html><html><head></head><body>' +
  '<header id="masthead"><button id="mast-btn">Menu</button></header>' +
  '<div id="greeting" style="position:fixed;inset:0;z-index:12000;display:none"><button>Close</button></div>' +
  '<div class="cpl-tab-pane" id="tab-chatbot"><div class="main-container"></div></div>' +
  '<div class="cpl-tab-pane" id="tab-program-requirements"><section class="glass" style="backdrop-filter:blur(8px)">' +
  '<div id="prh-root"><p id="before">Records</p><div id="prh-mount"></div><p id="after">Views</p></div></section></div>' +
  '<div class="cpl-tab-pane" id="tab-college-briefing"><div id="mc-mount"></div></div>' +
  '</body></html>';

function encEvents(deltas) {
  const enc = new TextEncoder();
  return deltas.map((t) => enc.encode("event: text\ndata: " + JSON.stringify({ text: t }) + "\n\n"))
    .concat([enc.encode("event: done\ndata: {}\n\n")]);
}
function streamResp(deltas) {
  const events = encEvents(deltas);
  let i = 0;
  return {
    ok: true, status: 200,
    body: { getReader: () => ({
      read: () => i < events.length
        ? Promise.resolve({ value: events[i++], done: false })
        : Promise.resolve({ value: undefined, done: true }),
      releaseLock: function () {},
    }) },
  };
}
// A stream that holds after its first delta until release() — an answer still
// arriving while the tab repaints.
function heldResp(first, rest) {
  const head = encEvents([first]).slice(0, 1), tail = encEvents(rest);
  let i = 0, release;
  const gate = new Promise((r) => { release = r; });
  return {
    release: () => release(),
    resp: { ok: true, status: 200, body: { getReader: () => ({
      read: () => {
        if (i < head.length) return Promise.resolve({ value: head[i++], done: false });
        return gate.then(() => {
          const j = i++ - head.length;
          return j < tail.length ? { value: tail[j], done: false } : { value: undefined, done: true };
        });
      },
      releaseLock: function () {},
    }) } },
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
  w.localStorage.setItem("cplSierraAudience.v1", "faculty");
  if (!opts.remembered) w.sessionStorage.setItem("cplSierraAudienceOk.v1", "faculty");
  // A signed-in reviewer: the credential the expanded box must keep sending.
  w.CPL_SESSION = { get: () => ({ access_token: "aaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccc" }) };
  w.fetch = function (url, init) {
    requests.push({ url: String(url), headers: init && init.headers, body: init && init.body ? JSON.parse(init.body) : null });
    if (opts.held) return Promise.resolve(opts.held.resp);
    return Promise.resolve(streamResp(["Here is ", "the answer."]));
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { w: w, d: w.document, API: w.CPL_CHAT, requests: requests };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function drain(n) { for (let i = 0; i < (n || 14); i++) await tick(); }
function sendIn(root, text) {
  root.querySelector(".cplchat-input").value = text;
  root.querySelector(".cplchat-send").click();
}
function wrapOf(d) { return d.querySelector(".cplchat-dock-btn").closest(".cplchat"); }
// Every body child but the dialog, and the one layer that paints above it.
function bodyKidsInert(d, wrap) {
  return Array.prototype.every.call(d.body.children, (k) => k === wrap || k.id === "greeting" || k.hasAttribute("inert"));
}

(async function () {
  // ── (a) the dedicated pane: no control, no expansion ──
  {
    const { d, API } = loadDom();
    const pane = d.getElementById("tab-chatbot");
    check("(a) the CPL Assistant pane builds", !!pane.querySelector(".cplchat"));
    check("(a) ⭐ it carries no Full screen control", !pane.querySelector(".cplchat-dock-btn"));
    sendIn(pane, "What is CPL?");
    await drain();
    check("(a) …and a send there does not expand", !API._dockExpanded() && pane.contains(pane.querySelector(".cplchat-msg")));
  }

  // ── (b)–(h) one dock, the whole round trip ──
  {
    const { w, d, API, requests } = loadDom();
    const host = d.getElementById("prh-mount");
    API.mountInto(host, "program-requirements");
    API.setScope("college", "Irvine Valley College");
    const btns = d.querySelectorAll(".cplchat-dock-btn");
    const wrap = host.querySelector(".cplchat");
    check("(b) a dock gets exactly one control", btns.length === 1);
    check("(b) it is a word: Full screen", btns[0].textContent === "Full screen" && btns[0].tagName === "BUTTON");
    check("(b) ⭐ its bar is a direct child of the wrap, never inside the intro",
      btns[0].parentNode.classList.contains("cplchat-dockbar") && btns[0].parentNode.parentNode === wrap &&
      !btns[0].closest(".cplchat-intro"));
    const css = (d.getElementById("cplchat-dock-css") || {}).textContent || "";
    check("(b) the dock CSS is injected once, on the paper token", !!css && /var\(--paper/.test(css) &&
      d.querySelectorAll("#cplchat-dock-css").length === 1);
    check("(b) its one motion runs only with no reduced-motion preference",
      /@media \(prefers-reduced-motion: no-preference\) \{[^}]*animation/.test(css) &&
      (css.match(/animation:/g) || []).length === 1);
    check("(b) docked, nothing is inert and the page scrolls",
      !d.querySelector("[inert]") && !d.documentElement.classList.contains("cplchat-locked"));

    // (c) expand on send
    sendIn(wrap, "What does the Art A.A. require?");
    check("(c) ⭐ the send expands the dock", API._dockExpanded());
    check("(c) …in place: the SAME wrap, now a child of <body>", wrap.parentNode === d.body && wrap.classList.contains("cplchat-full"));
    check("(c) a modal dialog", wrap.getAttribute("role") === "dialog" && wrap.getAttribute("aria-modal") === "true");
    const lab = d.getElementById(wrap.getAttribute("aria-labelledby") || "");
    check("(c) named by its bar: Sierra AI", !!lab && lab.textContent.trim() === "Sierra AI" && wrap.contains(lab));
    check("(c) everything else on the page is inert", bodyKidsInert(d, wrap) && d.getElementById("mast-btn").closest("[inert]"));
    check("(c) ⭐ a fixed layer that paints above her stays live (the daily greeting)",
      !d.getElementById("greeting").hasAttribute("inert"));
    check("(c) the page underneath stops scrolling", d.documentElement.classList.contains("cplchat-locked"));
    const hold = host.querySelector(".cplchat-dock-hold");
    check("(c) a placeholder keeps its seat in the tab", !!hold && hold.hidden && host.firstElementChild === hold);
    check("(c) the control now reads Back to the tab", btns[0].textContent === "Back to the tab");
    check("(c) focus is inside the dialog", wrap.contains(d.activeElement));
    await drain();
    const req = requests[requests.length - 1];
    check("(c) ⭐ the question still names the tab's college", req.body.scope && req.body.scope.label === "Irvine Valley College");
    check("(c) …and the tab's surface", req.body.surface === "program-requirements");
    check("(c) …and the reviewer's credential", /^Bearer aaaa/.test(req.headers.Authorization));
    check("(c) the answer lands in the expanded wrap", wrap.querySelectorAll(".cplchat-msg").length === 2 &&
      /the answer/.test(wrap.querySelector(".cplchat-bot .cplchat-bubble").textContent));
    check("(c) the box takes focus back when she is done", d.activeElement === wrap.querySelector(".cplchat-input"));

    // (d) back to the tab
    btns[0].click();
    check("(d) Back to the tab collapses", !API._dockExpanded() && !wrap.classList.contains("cplchat-full"));
    check("(d) ⭐ the wrap is back in its seat, the placeholder gone",
      wrap.parentNode === host && host.firstElementChild === wrap && !d.querySelector(".cplchat-dock-hold"));
    check("(d) the conversation came back with it", host.querySelectorAll(".cplchat-msg").length === 2);
    check("(d) no dialog semantics remain", !wrap.hasAttribute("role") && !wrap.hasAttribute("aria-modal") && !wrap.hasAttribute("tabindex"));
    check("(d) nothing is left inert, the page scrolls again",
      !d.querySelector("[inert]") && !d.documentElement.classList.contains("cplchat-locked"));
    check("(d) focus lands on the control, which reads Full screen", d.activeElement === btns[0] && btns[0].textContent === "Full screen");

    // (e) a follow-up stays docked
    sendIn(wrap, "And the units?");
    check("(e) ⭐ having gone back, a follow-up stays docked", !API._dockExpanded() && wrap.parentNode === host);
    await drain();
    check("(e) …and is answered in the tab", host.querySelectorAll(".cplchat-msg").length === 4);

    // (f) Full screen on request
    btns[0].click();
    check("(f) Full screen expands on request", API._dockExpanded() && wrap.parentNode === d.body);
    check("(f) …with focus in the box", d.activeElement === wrap.querySelector(".cplchat-input"));

    // (g) Escape
    const pre = new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    pre.preventDefault();
    wrap.querySelector(".cplchat-input").dispatchEvent(pre);
    check("(g) an Escape someone else already handled is left alone", API._dockExpanded());
    wrap.querySelector(".cplchat-input").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    check("(g) ⭐ Escape returns her to the tab", !API._dockExpanded() && wrap.parentNode === host);
    sendIn(wrap, "One more?");
    check("(g) Escape counts as going back", !API._dockExpanded());
    await drain();

    // (h) a new subject is a new conversation
    API.setScope("college", "Santa Monica College");
    check("(h) a new subject clears the transcript", host.querySelectorAll(".cplchat-msg").length === 0);
    sendIn(wrap, "What does Barbering require?");
    check("(h) ⭐ and the next answer expands again", API._dockExpanded() && wrap.parentNode === d.body);
    await drain();
    API._collapseDock();
  }

  // ── (i) the tab repaints under a full-screen Sierra, mid-answer ──
  {
    const held = heldResp("Part one, ", ["part two."]);
    const { d, API } = loadDom({ held: held });
    const root = d.getElementById("prh-root");
    API.mountInto(d.getElementById("prh-mount"), "program-requirements");
    const oldWrap = wrapOf(d);
    sendIn(oldWrap, "Tell me about the record.");
    await drain();
    check("(i) precondition: expanded, the answer half written", API._dockExpanded() &&
      /Part one/.test(oldWrap.querySelector(".cplchat-bot .cplchat-bubble").textContent));
    // The tab repaints: its markup is replaced and it mounts into a NEW host.
    root.innerHTML = '<p>Records</p><div id="prh-mount2"></div>';
    const host2 = d.getElementById("prh-mount2");
    API.mountInto(host2, "program-requirements");
    check("(i) mid-repaint the new box sits in the tab, for the host to finish with", host2.querySelector(".cplchat") && !API._dockExpanded());
    check("(i) mid-answer, the new box waits", host2.querySelector(".cplchat-input").disabled && host2.querySelector(".cplchat-send").disabled);
    await Promise.resolve(); await Promise.resolve();
    const newWrap = wrapOf(d);
    check("(i) ⭐ after the repaint she is full screen again", API._dockExpanded() && newWrap.parentNode === d.body && newWrap !== oldWrap);
    check("(i) the old wrap is gone from the page", !d.documentElement.contains(oldWrap));
    check("(i) the new seat holds the placeholder", host2.querySelector(".cplchat-dock-hold") && bodyKidsInert(d, newWrap));
    check("(i) ⭐ the conversation came across", newWrap.querySelectorAll(".cplchat-msg").length === 2 &&
      /Tell me about the record/.test(newWrap.querySelector(".cplchat-user").textContent));
    held.release();
    await drain(20);
    check("(i) ⭐ the streaming answer finished where the reader can see it",
      /Part one, part two\./.test(newWrap.querySelector(".cplchat-bot .cplchat-bubble").textContent));
    check("(i) the box opens again when she is done", !newWrap.querySelector(".cplchat-input").disabled);
    API._collapseDock();
    check("(i) Back to the tab seats the new wrap in the new host", newWrap.parentNode === host2 && !d.querySelector(".cplchat-dock-hold"));
  }

  // ── (j) another tab's dock keeps today's empty log; (k) navigation ──
  {
    const { w, d, API } = loadDom();
    API.mountInto(d.getElementById("prh-mount"), "program-requirements");
    sendIn(wrapOf(d), "A question on Program Requirements");
    await drain();
    API._collapseDock();
    const mc = d.getElementById("mc-mount");
    API.mountInto(mc, "my-college");
    check("(j) a different tab's dock starts with an empty log", mc.querySelectorAll(".cplchat-msg").length === 0);
    API._expandDock();
    check("(k) precondition: My College's Sierra is full screen", API._dockExpanded());
    w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));
    check("(k) arriving at her own tab leaves her full screen", API._dockExpanded());
    w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "chatbot" } }));
    check("(k) ⭐ arriving at another tab takes her back to her seat", !API._dockExpanded() &&
      mc.querySelector(".cplchat") && mc.querySelector(".cplchat").parentNode === mc && !d.querySelector("[inert]"));
    // The Program Requirements box this mount superseded is still in its pane.
    const stale = d.getElementById("prh-mount").querySelector(".cplchat-dock-btn");
    stale.click();
    check("(k) a superseded box's control moves nothing", !API._dockExpanded() && !d.querySelector("[inert]"));
  }

  // ── (l) an unconfirmed role holds the question and never expands ──
  {
    const { d, API, requests } = loadDom({ remembered: true });
    API.mountInto(d.getElementById("prh-mount"), "program-requirements");
    sendIn(wrapOf(d), "Held until the role is confirmed");
    check("(l) ⭐ an unconfirmed role does not expand", !API._dockExpanded() && requests.length === 0);
  }

  let fails = 0;
  for (const [name, ok] of results) {
    console.log((ok ? "  ok  " : "  FAIL ") + name);
    if (!ok) fails++;
  }
  console.log("\ncpl_chat_dock_full.test.js: " + (results.length - fails) + "/" + results.length + " checks passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
