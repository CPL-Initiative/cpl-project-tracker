// Sierra "📋 Copy" — copying an answer out to Word / Outlook / Teams.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam asked for a copy button so the MAP and CO teams can reuse Sierra's
// answers. The naive version (navigator.clipboard.writeText) silently does
// NOTHING in two of the three places Sierra actually runs:
//
//   * a cross-origin vendor iframe — the async Clipboard API needs
//     clipboard-write permission the embed does not grant;
//   * any non-secure context — navigator.clipboard is simply absent.
//
// and it would paste a wall of raw markdown (`## Heading`, `**bold**`) into
// Word, which is the single most likely destination for a copied answer.
//
// So the button writes text/html AND text/plain when it can, degrades through
// writeText to execCommand, and never throws into the chat flow. Those are the
// failure modes; this file asserts them rather than asserting that a button
// exists. Both surfaces are covered — sierra/sierra.js (standalone page) and
// cpl_chat.js (dashboard tab) carry parallel implementations.
//
// Run from repo root: `npm test` (or `node tests/sierra_copy_answer.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { TextEncoder, TextDecoder } = require("util");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("sierra/index.html", "utf8");
const SRC = fs.readFileSync("sierra/sierra.js", "utf8");
const CHAT_SRC = fs.readFileSync("cpl_chat.js", "utf8");

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

// `clipboard` describes which tier the browser is pretending to support:
//   "rich"   — write() + ClipboardItem (a modern top-level page)
//   "plain"  — writeText() only (older browser / no ClipboardItem)
//   "denied" — clipboard present but every call rejects (the iframe case)
//   "none"   — no navigator.clipboard at all (insecure context)
function loadDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/sierra/" });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  try { w.localStorage.setItem("cplSierraAudience.v1", "student"); } catch (e) { /* ignore */ }

  const wrote = { rich: [], plain: [], legacy: [] };
  const mode = opts.clipboard || "rich";

  if (mode !== "none") {
    const clip = {};
    if (mode === "rich" || mode === "denied") {
      clip.write = (items) => mode === "denied"
        ? Promise.reject(new Error("NotAllowedError"))
        : (wrote.rich.push(items[0]), Promise.resolve());
    }
    clip.writeText = (t) => mode === "denied"
      ? Promise.reject(new Error("NotAllowedError"))
      : (wrote.plain.push(t), Promise.resolve());
    Object.defineProperty(w.navigator, "clipboard", { value: clip, configurable: true });
  }
  if (mode === "rich") {
    // jsdom ships no ClipboardItem; model it as a plain type→payload bag.
    w.ClipboardItem = function (payload) { this.payload = payload; };
    w.Blob = function (parts, o) { this.parts = parts; this.type = (o || {}).type; };
  }
  // execCommand is absent in jsdom — the legacy tier's success is ours to decide.
  w.document.execCommand = function (cmd) {
    if (cmd !== "copy") return false;
    const ta = w.document.querySelector("textarea[readonly]");
    if (ta) wrote.legacy.push(ta.value);
    return opts.execCommandFails ? false : !!ta;
  };
  w.fetch = function () {
    return Promise.resolve(streamResp(opts.deltas || ["## Colleges\n\n", "- **Cypress College** — First Aid"]));
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { w, wrote };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
async function drain(n) { for (let i = 0; i < (n || 20); i++) await tick(); }
function submit(w, text) {
  w.document.getElementById("s-input").value = text;
  w.document.getElementById("s-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}
const copyBtn = (w) => w.document.querySelector("#s-log .s-fb .s-fb-copy");

(async () => {
  // ── 1. The happy path: rich + plain, both flavours ────────────────────────
  {
    const { w, wrote } = loadDom({});
    submit(w, "which colleges give CPL for CPR?");
    await drain();

    const btn = copyBtn(w);
    check("a Copy button is added to each answer", !!btn);
    check("Copy is labelled for a human", btn && /Copy/.test(btn.textContent));
    check("Copy carries an aria-label", btn && !!btn.getAttribute("aria-label"));

    // It must sit BEFORE the rating prompt — the thing you reach for on a good
    // answer should not be behind the feedback flow.
    const bar = w.document.querySelector("#s-log .s-fb");
    check("Copy is the first control in the per-answer bar", bar && bar.firstChild === btn);
    // Copy must NOT wear .s-fb-btn: that class means "a rating button" to the
    // code (btns.up/btns.down) and to sierra_page/cpl_chat_audience, which
    // assert exactly two of them. Reusing it for the pill styling broke both.
    check("Copy does not masquerade as a rating button",
      !btn.classList.contains("s-fb-btn") &&
      w.document.querySelectorAll("#s-log .s-fb .s-fb-btn").length === 2);
    check("Copy is still styled (sierra.css defines .s-fb-copy)",
      /\.s-fb-copy\s*\{/.test(fs.readFileSync("sierra/sierra.css", "utf8")));
    check("cpl_chat.js styles .cplchat-fb-copy too",
      /\.cplchat-fb-copy \{/.test(CHAT_SRC) && !/'cplchat-fb-btn cplchat-fb-copy'/.test(CHAT_SRC));

    btn.dispatchEvent(new w.Event("click", { bubbles: true }));
    await drain();

    check("a rich copy is written (not writeText)", wrote.rich.length === 1 && wrote.plain.length === 0);
    const payload = wrote.rich[0] && wrote.rich[0].payload;
    check("the rich copy carries text/html", !!(payload && payload["text/html"]));
    check("the rich copy carries text/plain alongside it", !!(payload && payload["text/plain"]));
    const html = payload && payload["text/html"].parts.join("");
    const plain = payload && payload["text/plain"].parts.join("");
    // The HTML flavour is what makes a Word paste keep its shape.
    check("text/html is RENDERED markup, so Word keeps the formatting",
      /<(h3|h4|ul|li|strong)/i.test(html || ""));
    // The plain flavour is the markdown Sierra emitted, not stripped text.
    check("text/plain is the markdown source", /## Colleges/.test(plain || ""));
    check("text/plain keeps the answer's content", /Cypress College/.test(plain || ""));
    check("the button confirms the copy to the user", /Copied/.test(btn.textContent));
  }

  // ── 2. No ClipboardItem (older browser): fall back to writeText ───────────
  {
    const { w, wrote } = loadDom({ clipboard: "plain" });
    submit(w, "q");
    await drain();
    copyBtn(w).dispatchEvent(new w.Event("click", { bubbles: true }));
    await drain();
    check("without ClipboardItem it falls back to writeText", wrote.plain.length === 1);
    check("the writeText fallback still carries the markdown",
      /Cypress College/.test(wrote.plain[0] || ""));
    check("the fallback still confirms to the user", /Copied/.test(copyBtn(w).textContent));
  }

  // ── 3. The iframe case: clipboard present but every call is denied ────────
  {
    const { w, wrote } = loadDom({ clipboard: "denied" });
    submit(w, "q");
    await drain();
    copyBtn(w).dispatchEvent(new w.Event("click", { bubbles: true }));
    await drain();
    check("a denied Clipboard API falls through to execCommand", wrote.legacy.length === 1);
    check("the execCommand tier carries the markdown",
      /Cypress College/.test(wrote.legacy[0] || ""));
    check("the temporary textarea is removed again",
      !w.document.querySelector("textarea[readonly]"));
    check("a denied clipboard still reports success once execCommand works",
      /Copied/.test(copyBtn(w).textContent));
  }

  // ── 4. No clipboard at all (insecure context) ─────────────────────────────
  {
    const { w, wrote } = loadDom({ clipboard: "none" });
    submit(w, "q");
    await drain();
    copyBtn(w).dispatchEvent(new w.Event("click", { bubbles: true }));
    await drain();
    check("with no navigator.clipboard it still copies via execCommand", wrote.legacy.length === 1);
  }

  // ── 5. Total failure is honest, and leaves the user a route ───────────────
  {
    const { w } = loadDom({ clipboard: "none", execCommandFails: true });
    submit(w, "q");
    await drain();
    const btn = copyBtn(w);
    btn.dispatchEvent(new w.Event("click", { bubbles: true }));
    await drain();
    check("a total copy failure does NOT claim success", !/Copied/.test(btn.textContent));
    check("a total copy failure tells the user what to do", /Ctrl\+C/.test(btn.textContent));
    check("...and selects the answer so Ctrl+C works",
      String(w.getSelection()).indexOf("Cypress College") > -1);
  }

  // ── 6. The chat flow survives a broken clipboard ──────────────────────────
  // A copy failure must never break the conversation — the next question still
  // sends and still renders.
  {
    const { w } = loadDom({ clipboard: "denied", execCommandFails: true });
    submit(w, "q1");
    await drain();
    copyBtn(w).dispatchEvent(new w.Event("click", { bubbles: true }));
    await drain();
    submit(w, "q2");
    await drain();
    const bubbles = w.document.querySelectorAll("#s-log .s-msg.s-bot .s-bubble");
    check("a failed copy does not break the next turn", bubbles.length === 2);
    check("every answer gets its own Copy button",
      w.document.querySelectorAll("#s-log .s-fb .s-fb-copy").length === 2);
  }

  // ── 7. The dashboard surface carries the same button ─────────────────────
  // cpl_chat.js is a parallel implementation (see its comment); assert the
  // shape rather than re-driving the whole dashboard DOM here.
  check("cpl_chat.js builds a Copy button too", /makeCopyBtn/.test(CHAT_SRC));
  check("cpl_chat.js Copy is first in its feedback bar",
    /className: 'cplchat-fb' \}, \[makeCopyBtn\(afterRow, answer\), hint\]/.test(CHAT_SRC));
  for (const [label, re] of [
    ["writes both flavours", /'text\/html':[\s\S]{0,120}'text\/plain':/],
    ["falls back to writeText", /navigator\.clipboard\.writeText/],
    ["falls back to execCommand", /document\.execCommand\('copy'\)/],
    ["removes the temp textarea", /removeChild\(ta\)/],
    ["selects the answer when all tiers fail", /selectNode\(bub\)/],
  ]) {
    check(`cpl_chat.js ${label}`, re.test(CHAT_SRC));
    check(`sierra.js ${label}`, re.test(SRC));
  }

  // ── report ──
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\nsierra_copy_answer.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
