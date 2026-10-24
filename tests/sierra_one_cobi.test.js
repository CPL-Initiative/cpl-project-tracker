// One Sierra in COBI (S398) — the CPL Assistant tab retired into Sierra AI.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-10-16: "I want to consolidate Sierra Assistant into Sierra AI and
// sunset the separate assistant. I don't want to lose any functionality in the
// process, but only gain. Requesting this because I was trying to fix some
// answers on Sierra Training ... and the Try it on Sierra button took me to the
// old assistant--I was expecting it to copy the question to Sierra AI and see if
// the outcome is improved."
//
// Each block guards a way the consolidation can go wrong while every page still
// renders:
//  (1) the old tab is GONE from both HTMLs, and the two stay identical (Rule 4);
//  (2) CPL_CHAT.open() builds ONE body-level box, opens it full screen at once,
//      reuses it (and its conversation) on the next open, and closing it hides
//      the host and gives focus back to what opened her;
//  (3) Sierra Training's default hand-off — "Try it in: Sierra" and "Save & ask
//      Sierra" — opens her over Training and SENDS, without navigating; focus
//      comes back even to a button Training repainted while she was open;
//  (4) "Try it in: My College" is unchanged: two keys, then the tab, and the
//      question lands in My College's own box when it is built;
//  (5) a #chatbot link (tabs.js lands it on the home tab) opens Sierra AI;
//  (6) ⭐ EACH BOX CARRIES ITS OWN CONTEXT: My College's scope, surface and
//      starters survive opening and closing Sierra AI, a My College send
//      afterwards carries My College's scope and surface, and My College
//      repainting under her never touches her box;
//  (7) the widget's base .cplchat- CSS comes from ensureChatCss(), with no pane
//      anywhere, on tokens only;
//  (8) the other doors: the Where To? router and My College's last resort open
//      Sierra AI rather than navigating to the retired tab.
//
// Run from repo root: `npm test` (or `node tests/sierra_one_cobi.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
async function block(label, fn) {
  try { await fn(); } catch (e) { check(label + " — driver threw: " + (e && e.stack || e), false); }
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));
// A hashchange reaches tabs.js and cpl_chat.js on a later task, and on a CI runner
// holding four jsdom processes that task can land past a fixed 20 ms (#2269, run
// 39356766779, shard 2). Wait for the state the check reads, up to 2 s.
const settle = async (cond, ms) => {
  const end = Date.now() + (ms || 2000);
  while (!cond() && Date.now() < end) await tick(10);
};

const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TABS = fs.readFileSync("tabs.js", "utf8");
const TRAIN = fs.readFileSync("sierra_training.js", "utf8");
const DEFAULTS = fs.readFileSync("sierra_rule_defaults.js", "utf8");
const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const QUICK = fs.readFileSync("quickstart.js", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");

const Q_KEY = "cplSierraTestQ.v1";
const DEST_KEY = "cplSierraTestDest.v1";

// A window with the reader's role confirmed and every cpl-chat request recorded.
function win(body, opts) {
  opts = opts || {};
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + body + "</body></html>",
    { url: opts.url || "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  w.scrollTo = function () {};
  w.alert = function () {};
  w.confirm = function () { return true; };
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.localStorage.setItem("cplSierraAudience.v1", "faculty");
  w.sessionStorage.setItem("cplSierraAudienceOk.v1", "faculty");
  w.__asks = [];
  w.__patches = [];
  w.fetch = function (url, init) {
    const u = String(url);
    if (/\/functions\/v1\/cpl-chat$/.test(u)) {
      w.__asks.push(JSON.parse(init.body));
      return Promise.resolve(answer(w, "An answer from Sierra AI."));
    }
    if (/sierra_guidance/.test(u) && init && init.method === "PATCH") {
      w.__patches.push(JSON.parse(init.body));
      return Promise.resolve({ ok: true, json: () => Promise.resolve([Object.assign({ id: "g1", active: true }, JSON.parse(init.body))]) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  (opts.scripts || [CHAT]).forEach(function (src) {
    const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  });
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return w;
}
// One SSE answer, the way cpl-chat streams it.
function answer(w, text) {
  const enc = new w.TextEncoder();
  const frames = ["event: text\ndata: " + JSON.stringify({ text: text }) + "\n\n", "event: done\ndata: {}\n\n"];
  let i = 0;
  return { ok: true, status: 200, body: { getReader: () => ({
    read: () => Promise.resolve(i < frames.length ? { value: enc.encode(frames[i++]), done: false } : { value: undefined, done: true }),
    releaseLock: function () {},
  }) } };
}
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
const cobiWrap = (w) => w.document.querySelector("body > .cplchat.cplchat-full, #cplchat-cobi > .cplchat");

(async function main() {
  // ── (1) the retired tab is gone from both pages ──
  await block("(1)", async function () {
    [["index.html", INDEX], ["CPL_Dashboard.html", DASH]].forEach(function (p) {
      check("(1) " + p[0] + " has no #tab-chatbot pane", !/id="tab-chatbot"/.test(p[1]));
      check("(1) " + p[0] + " has no data-tab=\"chatbot\" anywhere", !/data-tab="chatbot"/.test(p[1]));
    });
    check("(1) Rule 4: the two HTMLs are byte-identical", INDEX === DASH);
    check("(1) the side menu's Sierra group no longer lists the tab",
      !/'chatbot'/.test(fs.readFileSync("nav_groups.js", "utf8")));
  });

  // ── (2) open(): one body-level box, full screen, reused ──
  await block("(2)", async function () {
    const w = win('<button id="opener">Ask</button><main id="page"><p>A tab</p></main>');
    const API = w.CPL_CHAT;
    check("(2) nothing builds on load", !w.document.querySelector(".cplchat"));
    const opener = w.document.getElementById("opener");
    opener.focus();
    check("(2) open() says it opened", API.open() === true);
    const host = w.document.getElementById("cplchat-cobi");
    const wrap = cobiWrap(w);
    check("(2) ⭐ ONE body-level host, hidden, holding her seat", !!host && host.parentNode === w.document.body && host.hidden
      && w.document.querySelectorAll("#cplchat-cobi").length === 1);
    check("(2) ⭐ she is full screen at once: a named modal dialog in <body>",
      API._dockExpanded() && !!wrap && wrap.parentNode === w.document.body && wrap.classList.contains("cplchat-full")
      && wrap.getAttribute("role") === "dialog" && wrap.getAttribute("aria-modal") === "true");
    check("(2) the page behind her is inert", w.document.getElementById("page").hasAttribute("inert")
      && opener.hasAttribute("inert"));
    check("(2) focus is in her box", w.document.activeElement === wrap.querySelector(".cplchat-input"));
    check("(2) her one control reads Back to the tab", wrap.querySelector(".cplchat-dock-btn").textContent === "Back to the tab");
    API.open({ question: "What is CPL?", send: true });
    // Sending disables her box, and a browser drops focus from a disabled box to
    // <body>: it has to be on the dialog while she answers.
    check("(2) ⭐ while she answers, focus holds on the dialog, never the disabled box",
      w.document.activeElement === wrap && wrap.querySelector(".cplchat-input").disabled);
    await tick(10);
    check("(2) open({ question, send }) asks", w.__asks.length === 1 && w.__asks[0].query === "What is CPL?"
      && wrap.querySelectorAll(".cplchat-msg").length === 2);
    check("(2) …and when she is done, focus is back in her box",
      w.document.activeElement === wrap.querySelector(".cplchat-input"));
    w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    check("(2) ⭐ Escape closes her: back in the hidden host, nothing inert, the page scrolls",
      !API._dockExpanded() && host.contains(wrap) && !w.document.querySelector("[inert]")
      && !w.document.documentElement.classList.contains("cplchat-locked"));
    check("(2) ⭐ …and focus goes back to what opened her", w.document.activeElement === opener);
    API.open();
    check("(2) ⭐ re-opening reuses the same box, the conversation still in it",
      cobiWrap(w) === wrap && API._dockExpanded() && wrap.querySelectorAll(".cplchat-msg").length === 2
      && w.document.querySelectorAll(".cplchat").length === 1);
    click(w, wrap.querySelector(".cplchat-dock-btn"));
    check("(2) Back to the tab closes her too", !API._dockExpanded() && host.contains(wrap));
    API.open({ question: "Held for the role" });
    check("(2) a question without send waits in the box, unsent",
      wrap.querySelector(".cplchat-input").value === "Held for the role" && w.__asks.length === 1);
    API._collapseDock();
    // ask() names no box: the reader last acted in hers, so it opens her and sends.
    check("(2) ask() with her box the one in use opens her and sends",
      API.ask("And who decides?") === true && API._dockExpanded() && w.__asks.length === 2
      && w.__asks[1].query === "And who decides?" && w.document.activeElement === wrap);
    await tick(10);
    API._collapseDock();
    // A role nobody has confirmed: the prompt runs, the question waits.
    w.sessionStorage.removeItem("cplSierraAudienceOk.v1");
    const w2 = win('<main id="page"></main>');
    w2.sessionStorage.removeItem("cplSierraAudienceOk.v1");
    w2.CPL_CHAT.open({ question: "Which colleges give welding CPL?", send: true });
    await tick(5);
    const box2 = cobiWrap(w2);
    check("(2) ⭐ with the role unconfirmed, send runs the role prompt and the question waits in the box",
      w2.__asks.length === 0 && box2.querySelector(".cplchat-input").value === "Which colleges give welding CPL?"
      && /cplchat-confirm/.test(box2.querySelector(".cplchat-status").className));
    box2.querySelector(".cplchat-aud-chip.remembered").click();
    await tick(10);
    check("(2) …and the tap sends it", w2.__asks.length === 1 && w2.__asks[0].query === "Which colleges give welding CPL?");
  });

  // ── (3) Sierra Training asks Sierra AI over its own tab ──
  await block("(3)", async function () {
    const w = win('<div class="cpl-tab-pane" id="tab-sierra-training"><div id="sierra-training-root">Loading</div></div>',
      { url: "https://example.org/#sierra-training", scripts: [CHAT, DEFAULTS, TRAIN] });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    api._state.feedback = [{ turn_id: "f1", rating: "down", status: "new", question: "what about comptia",
      response: "an answer", audience: "student", page: "cobi-tab", created_at: new Date().toISOString() }];
    api._state.turns = [];
    api._state.turnReviews = {};
    api._state.guidance = [{ id: "g1", rule: "Name the college.", kind: "directive", active: true, created_by: "(team)",
      created_at: new Date().toISOString() }];
    api._state.open = { f1: true };
    const root = w.document.getElementById("sierra-training-root");
    api.render(root);
    const sierraBtn = root.querySelector('[data-qact="test"][data-host="sierra"]');
    check("(3) \"Try it in:\" carries the word Sierra", !!sierraBtn && sierraBtn.textContent === "Sierra");
    click(w, sierraBtn);
    await tick(10);
    check("(3) ⭐ Try it in: Sierra opens Sierra AI over Training and SENDS the question",
      w.CPL_CHAT._dockExpanded() && w.__asks.length === 1 && w.__asks[0].query === "what about comptia",
      JSON.stringify(w.__asks));
    check("(3) ⭐ …without navigating: still on Training, no hand-off key left behind",
      w.location.hash === "#sierra-training" && w.sessionStorage.getItem(Q_KEY) === null
      && w.sessionStorage.getItem(DEST_KEY) === null);
    check("(3) …and she answers in her own box", /An answer from Sierra AI/.test(cobiWrap(w).textContent));
    w.CPL_CHAT._collapseDock();
    check("(3) closing her gives focus back to the Sierra button", w.document.activeElement === sierraBtn);

    // "Save & ask Sierra": save first, then ask — the owner's own loop.
    api._openEdit("g1", root);
    api._state.editRule = "Name the college, and its CPL coordinator.";
    api._state.editTestQ = "Who do I ask about CPL at Cerritos College?";
    const save = root.querySelector("[data-guid-savetest]");
    check("(3) the editor offers Save & ask Sierra", !!save && /Save &(amp;)? ask Sierra/.test(save.textContent));
    click(w, save);
    await tick(20);
    check("(3) ⭐ Save & ask Sierra saves FIRST, then asks Sierra AI over Training",
      w.__patches.length === 1 && /CPL coordinator/.test(w.__patches[0].rule)
      && w.__asks.length === 2 && w.__asks[1].query === "Who do I ask about CPL at Cerritos College?"
      && w.CPL_CHAT._dockExpanded() && w.location.hash === "#sierra-training");
    check("(3) the editor is still open behind her", !!root.querySelector(".sit-guid-edit-input"));
    w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    const again = root.querySelector("[data-guid-savetest]");
    check("(3) ⭐ closing her gives focus back to Save & ask Sierra, repainted while she was open",
      !!again && again !== save && w.document.activeElement === again);
  });

  // ── (4) "Try it in: My College" is unchanged ──
  await block("(4)", async function () {
    const w = win('<div class="cpl-tab-pane" id="tab-college-briefing"><div class="cplchat-mount"></div></div>'
      + '<div class="cpl-tab-pane" id="tab-sierra-training"><div id="sierra-training-root">Loading</div></div>',
      { url: "https://example.org/#sierra-training", scripts: [CHAT, DEFAULTS, TRAIN] });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    api._state.feedback = [{ turn_id: "f1", rating: "down", status: "new", question: "what about comptia",
      response: "an answer", audience: "student", page: "cobi-tab", created_at: new Date().toISOString() }];
    api._state.turns = []; api._state.turnReviews = {}; api._state.guidance = [];
    api._state.open = { f1: true };
    const root = w.document.getElementById("sierra-training-root");
    api.render(root);
    click(w, root.querySelector('[data-qact="test"][data-host="college-briefing"]'));
    check("(4) ⭐ My College writes the question and its destination, and goes to My College",
      w.sessionStorage.getItem(Q_KEY) === "what about comptia" && w.sessionStorage.getItem(DEST_KEY) === "college-briefing"
      && w.location.hash === "#college-briefing");
    check("(4) …and opens no Sierra AI and asks nothing", !w.CPL_CHAT._dockExpanded() && w.__asks.length === 0);
    w.CPL_CHAT.mountInto(w.document.querySelector("#tab-college-briefing .cplchat-mount"), "my-college");
    const mc = w.document.querySelector("#tab-college-briefing .cplchat-input");
    check("(4) ⭐ the question lands in My College's own box when it is built, unsent",
      !!mc && mc.value === "what about comptia" && w.__asks.length === 0
      && w.sessionStorage.getItem(Q_KEY) === null && w.sessionStorage.getItem(DEST_KEY) === null);
  });

  // ── (5) a #chatbot link opens Sierra AI over the home tab ──
  await block("(5)", async function () {
    const nav = '<nav class="cpl-tabs"><button class="cpl-tab" data-tab="dashboard">Dashboard</button>'
      + '<button class="cpl-tab" data-tab="sierra-training">Sierra Training</button></nav>'
      + '<div class="cpl-tab-pane" id="tab-dashboard" data-tab="dashboard"><p>Home</p></div>'
      + '<div class="cpl-tab-pane" id="tab-sierra-training" data-tab="sierra-training"></div>';
    const w = win(nav, { url: "https://example.org/#chatbot", scripts: [TABS, CHAT] });
    await tick(10);
    check("(5) tabs.js lands the retired address on the home tab",
      w.document.getElementById("tab-dashboard").classList.contains("active"));
    check("(5) ⭐ and Sierra AI opens over it", w.CPL_CHAT._dockExpanded() && !!cobiWrap(w)
      && cobiWrap(w).parentNode === w.document.body);
    check("(5) the address now names the tab beneath her", !/#chatbot/.test(w.location.href));
    w.CPL_CHAT._collapseDock();
    w.location.hash = "#chatbot";
    await settle(() => w.CPL_CHAT._dockExpanded());
    check("(5) a #chatbot link followed later opens her again", w.CPL_CHAT._dockExpanded());
    w.location.hash = "#sierra-training";
    await settle(() => !w.CPL_CHAT._dockExpanded()
      && w.document.getElementById("tab-sierra-training").classList.contains("active"));
    check("(5) going to another tab (Back, a link) closes her", !w.CPL_CHAT._dockExpanded()
      && w.document.getElementById("tab-sierra-training").classList.contains("active"));
  });

  // ── (6) ⭐ each box carries its own context ──
  await block("(6)", async function () {
    const w = win('<div class="cpl-tab-pane" id="tab-college-briefing"><div id="mc-host"></div></div>'
      + '<div class="cpl-tab-pane" id="tab-sierra-training"></div>');
    const API = w.CPL_CHAT;
    const host = w.document.getElementById("mc-host");
    API.mountInto(host, "my-college");
    API.setScope("college", "Cabrillo College");
    API.setSuggestions(["How is Cabrillo College doing on CPL, and what quick steps do you recommend?"]);
    const mcWrap = host.querySelector(".cplchat");
    const chips = () => Array.from(host.querySelectorAll(".cplchat-chip")).map((b) => b.textContent);
    const before = { ctx: API._boxContext("dock"), chips: chips() };
    check("(6) precondition: My College's box holds its scope, surface and starters",
      before.ctx.scope && before.ctx.scope.label === "Cabrillo College" && before.ctx.surface === "my-college"
      && before.chips.length === 1 && /Cabrillo/.test(before.chips[0]));

    API.open();
    const cobi = cobiWrap(w);
    check("(6) ⭐ she shows the generic starters, never My College's",
      /Riverside City College/.test(cobi.textContent) && !/How is Cabrillo College doing/.test(cobi.textContent)
      && chips().length === 1);
    API.open({ question: "What is credit for prior learning?", send: true });
    await tick(10);
    check("(6) ⭐ Sierra AI's question goes out with HER context: no college, her own surface",
      w.__asks.length === 1 && w.__asks[0].scope === null && w.__asks[0].surface === "cobi-assistant");
    // My College repaints under her (its roster arriving): a new host, the setters again.
    const host2 = w.document.createElement("div");
    host.parentNode.replaceChild(host2, host);
    API.mountInto(host2, "my-college");
    API.setScope("college", "Cabrillo College");
    API.setSuggestions(["How is Cabrillo College doing on CPL, and what quick steps do you recommend?"]);
    check("(6) ⭐ a My College repaint under her leaves her open, her box and her context untouched",
      API._dockExpanded() && cobiWrap(w) === cobi && cobi.parentNode === w.document.body
      && API._boxContext("cobi").scope === null && API._boxContext("cobi").surface === "cobi-assistant"
      && API._boxContext("cobi").suggestions === null);
    API._collapseDock();
    const after = API._boxContext("dock");
    check("(6) ⭐ after she closes, My College still has its scope, surface and starters",
      after.scope && after.scope.label === "Cabrillo College" && after.surface === "my-college"
      && JSON.stringify(after.suggestions) === JSON.stringify(before.ctx.suggestions)
      && Array.from(host2.querySelectorAll(".cplchat-chip")).length === 1);
    check("(6) …and its box is in its own tab, not hers", !!host2.querySelector(".cplchat")
      && !w.document.getElementById("cplchat-cobi").contains(host2.querySelector(".cplchat")));
    const box = host2.querySelector(".cplchat-input");
    box.value = "And what should Cabrillo do first?";
    host2.querySelector(".cplchat-send").click();
    await tick(10);
    const last = w.__asks[w.__asks.length - 1];
    check("(6) ⭐ a My College send afterwards carries My College's scope and surface",
      w.__asks.length === 2 && last.query === "And what should Cabrillo do first?"
      && last.scope && last.scope.kind === "college" && last.scope.label === "Cabrillo College"
      && last.surface === "my-college", JSON.stringify(last));
    check("(6) the thread follows the reader between the boxes while the subject holds",
      Array.isArray(last.history) && last.history.length === 2);
    // My College's box fills the window as she answers (its own full screen), so
    // the answer is read from that box's wrap, wherever it sits.
    const mcBox = API._boxContext("dock").wrap;
    check("(6) and the answer lands in My College's box, not hers",
      mcBox !== cobi && mcBox.querySelectorAll(".cplchat-msg").length === 2
      && /An answer from Sierra AI/.test(mcBox.textContent) && cobi.querySelectorAll(".cplchat-msg").length === 2);
    API._collapseDock();
    API.setScope("college", "Santa Monica College");
    check("(6) a new subject in My College drops the thread there and never touches her box",
      API._thread().length === 0 && host2.querySelectorAll(".cplchat-msg").length === 0
      && cobi.querySelectorAll(".cplchat-msg").length === 2 && API._boxContext("cobi").scope === null);
  });

  // ── (7) the base CSS is the widget's own ──
  await block("(7)", async function () {
    const w = win('<div class="cpl-tab-pane" id="tab-college-briefing"><div id="mc-host"></div></div>');
    w.CPL_CHAT.mountInto(w.document.getElementById("mc-host"), "my-college");
    const st = w.document.getElementById("cplchat-aud-css");
    const css = st ? st.textContent : "";
    check("(7) no pane anywhere, and no .cplchat rule in either HTML",
      !w.document.getElementById("tab-chatbot") && !/\.cplchat[\w-]* \{/.test(INDEX) && !/\.cplchat[\w-]* \{/.test(DASH));
    const BASE = [".cplchat", ".cplchat-log", ".cplchat-msg", ".cplchat-bubble", ".cplchat-user .cplchat-bubble",
      ".cplchat-bot .cplchat-bubble", ".cplchat-chip", ".cplchat-status", ".cplchat-inputrow", ".cplchat-input",
      ".cplchat-send", ".cplchat-send:disabled", ".cplchat-typing"];
    const missing = BASE.filter(function (sel) {
      return css.indexOf("\n" + sel + " {") === -1 && css.indexOf(sel + " {") !== 0;
    });
    check("(7) ⭐ ensureChatCss() injects the base rules the pane used to carry", !!st && missing.length === 0,
      "missing: " + missing.join(", "));
    check("(7) …first in the sheet, so every refinement after them still wins",
      css.indexOf(".cplchat-log {") >= 0 && css.indexOf(".cplchat-log {") < css.indexOf(".cplchat-audience {"));
    const baseRules = css.slice(0, Math.max(0, css.indexOf(".cplchat-audience {")));
    check("(7) ⭐ on tokens only: no raw hex or rgba in the base rules",
      baseRules.length > 500 && !/#[0-9a-fA-F]{3,8}\b/.test(baseRules) && !/rgba?\(/.test(baseRules),
      (baseRules.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || []).join(" "));
    check("(7) the mobile block comes with them (the log gets MORE of a phone)",
      /@media \(max-width: 600px\) \{[^\n]*\.cplchat-log \{[^}]*max-height/.test(css));
  });

  // ── (8) the other doors open Sierra AI ──
  await block("(8)", async function () {
    // My College's last resort: no box of its own to fill.
    const w = win('<div id="college-briefing-root"></div>', { scripts: [BRIEFING] });
    const opened = [];
    w.CPL_CHAT = { open: function (o) { opened.push(o); return true; } };
    w.CPL_COLLEGE_BRIEFING._askSierra("How is Cabrillo College doing on CPL?");
    check("(8) ⭐ My College with no box opens Sierra AI and asks, never the retired tab",
      opened.length === 1 && opened[0].question === "How is Cabrillo College doing on CPL?" && opened[0].send === true
      && !/#chatbot/.test(w.location.href));

    // The real module: My College's box was repainted off the page, so ask()
    // has nowhere a reader can see, and the question goes to Sierra AI instead.
    const r = win('<div class="cpl-tab-pane" id="tab-college-briefing"><div id="college-briefing-root"></div>'
      + '<div id="old-host"></div></div>', { scripts: [CHAT, BRIEFING] });
    const oldHost = r.document.getElementById("old-host");
    r.CPL_CHAT.mountInto(oldHost, "my-college");
    oldHost.parentNode.removeChild(oldHost);
    r.CPL_COLLEGE_BRIEFING._askSierra("What CPL does Cabrillo College offer?");
    await tick(10);
    check("(8) a box repainted off the page is never asked: Sierra AI opens and answers instead",
      r.CPL_CHAT._dockExpanded() && r.__asks.length === 1 && r.__asks[0].surface === "cobi-assistant"
      && /An answer from Sierra AI/.test(cobiWrap(r).textContent));

    // The Where To? router: "chatbot" is Sierra AI, opened with the question.
    const q = win('<div id="cobiQsSlot"></div>', { scripts: [] });
    const asked = [];
    q.CPL_REPORT_PROXY_URL = "https://proxy.example.org/";
    q.CPL_CHAT = { open: function (o) { asked.push(o); return true; } };
    q.fetch = function () {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ type: "text", text:
        JSON.stringify({ tab: "chatbot", message: "Asking Sierra AI." }) }] }) });
    };
    // The page loads the writer module first; the router drafts through it (Sheet 118 ruling 5).
    const sw = q.document.createElement("script"); sw.textContent = fs.readFileSync("cpl_writer.js", "utf8"); q.document.body.appendChild(sw);
    const s = q.document.createElement("script"); s.textContent = QUICK; q.document.body.appendChild(s);
    q.document.dispatchEvent(new q.Event("DOMContentLoaded"));
    const input = q.document.getElementById("qs-input");
    input.value = "what is credit for prior learning?";
    input.dispatchEvent(new q.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await tick(500);
    check("(8) ⭐ the Where To? router sends an \"ask\" question to Sierra AI, not to a tab",
      asked.length === 1 && asked[0].question === "what is credit for prior learning?" && asked[0].send === true
      && !/#chatbot/.test(q.location.href), JSON.stringify(asked) + " " + q.location.href);
    check("(8) …and its list names her Sierra AI, opened here", /label: 'Sierra AI',\s*meta: 'Opens here'/.test(QUICK));
  });

  const failed = results.filter((r) => !r[1]);
  results.forEach(([name, ok, why]) =>
    console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
  console.log("\nsierra_one_cobi.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})();
