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
//  (e) ⭐ a REMEMBERED role is a shortcut, not an answer (Sam, 2026-08-21):
//      localStorage remembers the pick across visits, but it is only CONFIRMED
//      in the browser-tab session someone tapped it in. An unconfirmed role
//      blocks the send, names itself in the prompt, and RESUMES the held
//      question on the tap — the question is never dropped;
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
  /* Three fixture states, because the module now has three:
   *   default            — remembered AND confirmed this session (sends);
   *   {remembered:true}  — remembered from an earlier visit, NOT confirmed
   *                        (the new gate; localStorage only, no session mark);
   *   {noAudience:true}  — never picked anywhere (the original gate).
   * ⚠ The confirmation mark is per browser-tab session, so it goes in
   * sessionStorage. Seeding only localStorage — which every fixture here did
   * before 2026-08-21 — now means "remembered", which is why (c) and (d) set
   * both or they would be testing the gate instead of the thing they name. */
  if (!opts.noAudience) {
    try { w.localStorage.setItem("cplSierraAudience.v1", "student"); } catch (e) { /* ignore */ }
    if (!opts.remembered) {
      try { w.sessionStorage.setItem("cplSierraAudienceOk.v1", "student"); } catch (e) { /* ignore */ }
    }
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
    check("the confirmation key is SEPARATE from the shared pick key",
      API.AUD_OK_KEY === "cplSierraAudienceOk.v1" && API.AUD_OK_KEY !== API.AUD_KEY);
    submit(w, "Which colleges teach welding?");
    await drain(14);
    check("a CONFIRMED pick is honored and sent without a second tap",
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

  /* ── (e) ⭐ the remembered-role gate ────────────────────────────────────
   * Sam's screenshot: a chip he had never touched on this page was lit and
   * steering the answer, because the pick persists under a key SHARED with the
   * public standalone page and the Fact Sheet drawer. Same defect #1274 fixed
   * for the remembered COLLEGE, one level down. */
  {
    const { w, requests } = loadDom({ remembered: true });
    const row = w.document.getElementById("cplchat-audience");
    const chips = row.querySelectorAll(".cplchat-aud-chip");
    const remembered = row.querySelector(".cplchat-aud-chip.remembered");
    check("(e) a remembered pick renders PROVISIONAL, not confirmed",
      !!remembered && /Student/i.test(remembered.textContent) &&
      !row.querySelector(".cplchat-aud-chip.on"));
    check("(e) …and it is still the current selection for a screen reader",
      !!remembered && remembered.getAttribute("aria-pressed") === "true");
    // ⚠ Colour is never the only signal (First Light) — the provisional state
    // must be readable as WORDS, or a dashed border is the whole message.
    check("(e) the provisional state is stated in words, not just an outline",
      /previous visit/i.test((row.querySelector(".cplchat-aud-note") || {}).textContent || ""));

    submit(w, "Which colleges teach welding?");
    await drain(8);
    check("(e) ⭐ the send is HELD — a remembered role does not answer for you",
      requests.length === 0);
    const status = w.document.getElementById("cplchat-status");
    check("(e) the prompt NAMES the role it is asking about",
      /Student \/ future student/.test(status.textContent));
    check("(e) …and is not dressed as an error (nothing is wrong)",
      /cplchat-confirm/.test(status.className) && !/cplchat-error/.test(status.className));
    check("(e) the row is outlined while it waits", row.classList.contains("confirm"));
    check("(e) ⚠ the question is still in the box, not swallowed",
      w.document.getElementById("cplchat-input").value === "Which colleges teach welding?");

    /* The tap confirms AND resumes — the reader does not re-find the chip.
     * ⚠ Fall back to the first chip when there is no `.remembered` one: against
     * a pre-fix cpl_chat.js there is none, and a throw here would abort every
     * remaining check in the file and report one crash instead of a list. */
    (remembered || chips[0]).click();
    await drain(14);
    check("(e) ⭐ tapping the same chip RESUMES the held question",
      requests.length === 1 && requests[0].body.audience === "student" &&
      /welding/.test(requests[0].body.question || requests[0].body.q || JSON.stringify(requests[0].body)));
    check("(e) …and the chip is confirmed afterwards",
      !!row.querySelector(".cplchat-aud-chip.on") &&
      !row.querySelector(".cplchat-aud-chip.remembered") &&
      !row.querySelector(".cplchat-aud-note"));
    check("(e) …the outline and the prompt are both cleared",
      !row.classList.contains("confirm") &&
      !/still Student/i.test(w.document.getElementById("cplchat-status").textContent));
    check("(e) the confirmation is written per browser-tab SESSION, not per visit",
      w.sessionStorage.getItem("cplSierraAudienceOk.v1") === "student" &&
      w.localStorage.getItem("cplSierraAudience.v1") === "student");
  }

  /* (e2) Picking a DIFFERENT role from a remembered one is one tap too — the
   * gate must not force "confirm the wrong answer, then change it". */
  {
    const { w, requests } = loadDom({ remembered: true });
    const row = w.document.getElementById("cplchat-audience");
    submit(w, "How do we start?");
    await drain(6);
    check("(e2) held, as above", requests.length === 0);
    row.querySelectorAll(".cplchat-aud-chip")[1].click(); // Faculty
    await drain(14);
    check("(e2) ⭐ switching role also resumes, and sends the NEW role",
      requests.length === 1 && requests[0].body.audience === "faculty");
  }

  /* (e3) A role confirmed for THIS session survives a re-mount (the reader
   * switches COBI tabs and comes back). One tap per session, not per question:
   * a gate that re-asks on every mount is a gate people learn to click past. */
  {
    const { w, requests } = loadDom();  // confirmed fixture
    submit(w, "one");
    await drain(14);
    const API = w.CPL_CHAT;
    const host = w.document.createElement("div");
    w.document.body.appendChild(host);
    API.mountInto(host);
    /* ⚠ API.ask(), NOT the submit() helper — that one reaches the input by
     * getElementById, and with two panes mounted the id resolves to the FIRST
     * one while the module's `inputEl` points at the pane built LAST. The
     * documented two-pane trap, hit by the test rather than the code. */
    API.ask("two");
    await drain(14);
    const asks = requests.filter((r) => !/sierra_feedback_upsert/.test(r.url));
    check("(e3) a confirmed role is not re-asked after a re-mount",
      asks.length === 2 && asks[1].body.audience === "student");
  }

  /* (e5) ⚠ A STALE CONFIRMATION. The pick lives in localStorage under a key
   * SHARED with the public standalone page and the Fact Sheet drawer; the
   * confirmation lives in sessionStorage. So the pick can change underneath a
   * standing confirmation — confirm "Student" here, switch to "Faculty" over
   * there, come back. loadAudience() must ASSIGN the flag on every mount, not
   * only ever raise it, or the new role inherits the old one's confirmation and
   * the gate silently stops existing. */
  {
    const { w, requests } = loadDom();  // confirmed as 'student'
    submit(w, "one");
    await drain(14);
    check("(e5) precondition: the confirmed role sends", requests.length === 1);
    // The public page switches the shared pick without touching the session mark.
    w.localStorage.setItem("cplSierraAudience.v1", "faculty");
    const API = w.CPL_CHAT;
    const host = w.document.createElement("div");
    w.document.body.appendChild(host);
    API.mountInto(host);
    const row = host.querySelector(".cplchat-audience");
    check("(e5) ⭐ the changed role does NOT inherit the old confirmation",
      !!row.querySelector(".cplchat-aud-chip.remembered") &&
      !row.querySelector(".cplchat-aud-chip.on"));
    API.ask("two");
    await drain(8);
    check("(e5) …so it is held, not answered",
      requests.filter((r) => !/sierra_feedback_upsert/.test(r.url)).length === 1);
  }

  /* (e6) ⚠ THE HELD QUESTION IS PINNED TO ITS PANE. Two panes can be mounted at
   * once and `inputEl` points at whichever built LAST. A boolean "something is
   * pending" would let a confirm armed on My College fire submit() against the
   * CPL Assistant's box — sending a half-typed sentence nobody pressed Send on.
   * The same by-reference-not-by-id trap this file already documents twice. */
  {
    const { w, requests } = loadDom({ remembered: true });
    submit(w, "held on pane one");
    await drain(6);
    check("(e6) precondition: pane one armed the gate", requests.length === 0);
    const API = w.CPL_CHAT;
    const host = w.document.createElement("div");
    w.document.body.appendChild(host);
    API.mountInto(host);                       // inputEl now points at pane two
    API.prefill("half-typed on pane two");     // prefill does NOT send
    host.querySelectorAll(".cplchat-aud-chip")[1].click();  // confirm on pane two
    await drain(10);
    check("(e6) ⭐ confirming on the OTHER pane sends nothing",
      requests.length === 0, JSON.stringify(requests.map((r) => r.body)));
    check("(e6) …and pane two's half-typed text is still just sitting there",
      host.querySelector(".cplchat-input").value === "half-typed on pane two");
  }

  /* (e4) The role vocabulary is unchanged — this run added a STATE, not a
   * word. sierra_surfaces_aligned compares the arrays across all three files;
   * this pins that nothing here quietly edited one. */
  {
    const { API } = loadDom();
    check("(e4) still exactly the 5 shared audiences, keys unchanged",
      API.AUDIENCES.map((a) => a.k).join(",") ===
      "student,faculty,administrator,employer,civic");
  }

  // ── report ──
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\ncpl_chat_audience.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
