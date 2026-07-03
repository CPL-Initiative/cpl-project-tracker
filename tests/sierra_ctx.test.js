// Sierra standalone page — the ?ctx=external contacts-gate passthrough (v27).
//
// Guards the FAIL-OPEN contract of the external contacts gate:
//  (a) a normal visit (no query param) sends NO `ctx` field at all — the
//      payload is byte-identical to pre-v27, so COBI-adjacent behavior and the
//      production widget's contract are untouched;
//  (b) loading the page as sierra/?ctx=external sends ctx:"external" on every
//      chat POST (the vendor-iframe path — the Edge Function suppresses the
//      college staff contact line for these requests);
//  (c) an UNKNOWN ctx value (?ctx=banana) is dropped client-side — fail-open;
//  (d) buildPayload is the single payload builder (query/session_id/history/
//      audience present in both variants).
//
// Server-side counterpart: chatbox/smoke_test.sh mode 14 asserts the live
// function includes the CPL contact by default and omits it under ctx=external.
//
// Run from repo root: `npm test` (or `node tests/sierra_ctx.test.js`).
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

function loadDom(url) {
  const dom = new JSDOM(HTML, { runScripts: "outside-only", url: url });
  const w = dom.window;
  const requests = [];
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  try { w.localStorage.setItem("cplSierraAudience.v1", "student"); } catch (e) { /* ignore */ }
  w.fetch = function (u, init) {
    requests.push({ url: String(u), body: init && init.body ? JSON.parse(init.body) : null });
    return Promise.resolve(streamResp(["Hello"]));
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { w: w, API: w.CPL_SIERRA_PAGE, requests: requests };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function drain(n) { for (let i = 0; i < (n || 12); i++) await tick(); }
function submit(w, text) {
  w.document.getElementById("s-input").value = text;
  w.document.getElementById("s-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}

const BASE = "https://cpl-initiative.github.io/cpl-project-tracker/sierra/";

(async function () {
  // ── (a) default visit: NO ctx field, payload shape unchanged ──
  {
    const { w, API, requests } = loadDom(BASE);
    check("default visit exposes ctxVariant = null", API.ctxVariant === null);
    submit(w, "What is CPL?");
    await drain();
    const chat = requests.filter((r) => /\/functions\/v1\/cpl-chat$/.test(r.url));
    check("default visit sends a chat request", chat.length === 1);
    check("default visit sends NO ctx key at all", chat.length === 1 && !("ctx" in chat[0].body));
    check("default payload keeps query/session_id/history/audience",
      chat.length === 1 && chat[0].body.query === "What is CPL?" &&
      typeof chat[0].body.session_id === "string" && Array.isArray(chat[0].body.history) &&
      chat[0].body.audience === "student");
  }

  // ── (b) ?ctx=external: ctx rides on every chat POST ──
  {
    const { w, API, requests } = loadDom(BASE + "?ctx=external");
    check("?ctx=external exposes ctxVariant = 'external'", API.ctxVariant === "external");
    submit(w, "Who is the CPL contact at San Diego Mesa College?");
    await drain();
    const chat = requests.filter((r) => /\/functions\/v1\/cpl-chat$/.test(r.url));
    check("?ctx=external sends ctx:'external'", chat.length === 1 && chat[0].body.ctx === "external");
    check("?ctx=external payload still carries query/history/audience",
      chat.length === 1 && typeof chat[0].body.query === "string" &&
      Array.isArray(chat[0].body.history) && chat[0].body.audience === "student");
    // second turn also carries it
    submit(w, "And at Norco College?");
    await drain();
    const chat2 = requests.filter((r) => /\/functions\/v1\/cpl-chat$/.test(r.url));
    check("ctx rides on the SECOND turn too", chat2.length === 2 && chat2[1].body.ctx === "external");
  }

  // ── (c) unknown ctx value is dropped (fail-open) ──
  {
    const { w, API, requests } = loadDom(BASE + "?ctx=banana");
    check("unknown ?ctx value → ctxVariant null", API.ctxVariant === null);
    submit(w, "What is CPL?");
    await drain();
    const chat = requests.filter((r) => /\/functions\/v1\/cpl-chat$/.test(r.url));
    check("unknown ?ctx value → no ctx key sent", chat.length === 1 && !("ctx" in chat[0].body));
  }

  // ── (d) buildPayload is the single builder ──
  {
    const { API } = loadDom(BASE + "?ctx=external");
    const p = API.buildPayload("q");
    check("buildPayload('q') carries ctx under the external variant",
      p.query === "q" && p.ctx === "external" && Array.isArray(p.history));
  }

  // ── report ──
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\nsierra_ctx.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
