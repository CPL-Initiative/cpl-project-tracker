// "Try it on Sierra" — the hand-off from Sierra Training to the assistant.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-08-13, mid-triage: "tried to use Try it With Sierra button but it
// didn't copy the question into Sierra and when I tried to copy and paste the
// question, it doesn't the training tab doesn't allow it."
//
// Two independent defects, both of which fail SILENTLY — the button appears to
// do nothing, which is indistinguishable from a dead button:
//
//   1. WRONG TARGET. My College mounts the SAME assistant through mountInto(),
//      and build() re-points the module-level `inputEl` at THAT pane's input.
//      mount() then early-returns on the data-cplchat-mounted flag, so
//      returning to #chatbot never re-points it back. After one visit to My
//      College, the hand-off typed the question into a hidden box for the rest
//      of the session.
//
//   2. THE KEY WAS BURNED ON FAILURE. consumeTestQuestion() removed the
//      sessionStorage key BEFORE checking that an input existed, then bailed.
//      So an activation that fired before the widget was built consumed the
//      question and dropped it — and because the key was gone, clicking again
//      could not work either.
//
// The fix targets the #chatbot pane's OWN input and only removes the key once
// the value is actually delivered.
//
// Run from repo root: `npm test` (or `node tests/sierra_test_handoff.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const CHAT_SRC = fs.readFileSync("cpl_chat.js", "utf8");
const TRAIN_SRC = fs.readFileSync("sierra_training.js", "utf8");
const KEY = "cplSierraTestQ.v1";
const Q = "I have a journey worker license as Iron and Steel worker. What CPL can I get here?";

// A page carrying BOTH mounts, exactly like the live dashboard: the #chatbot
// pane and a My College pane that hosts the same widget.
function boot() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body>'
    + '<div id="tab-chatbot"><div class="main-container"></div></div>'
    + '<div id="tab-my-college"><div class="cplchat-mount"></div></div>'
    + "</body></html>",
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };  // never resolves; no network in tests
  w.eval(CHAT_SRC);
  // jsdom may still be at readyState "loading" when the script evaluates, in
  // which case cpl_chat defers mount() to DOMContentLoaded. Fire it so the
  // assertions below are synchronous. mount() is idempotent, so this is a
  // no-op when it already ran.
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return w;
}

function chatbotInput(w) {
  return w.document.querySelector("#tab-chatbot #cplchat-input, #tab-chatbot .cplchat-input");
}
function myCollegeInput(w) {
  return w.document.querySelector("#tab-my-college #cplchat-input, #tab-my-college .cplchat-input");
}
function activateChatbot(w) {
  w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "chatbot" } }));
}

// ── 1. The plain case still works ───────────────────────────────────────────
{
  const w = boot();
  check("the assistant mounts into #tab-chatbot", !!chatbotInput(w));
  w.sessionStorage.setItem(KEY, Q);
  activateChatbot(w);
  const el = chatbotInput(w);
  check("the question lands in the chatbot input", el && el.value === Q);
  check("a delivered question is removed from sessionStorage",
        w.sessionStorage.getItem(KEY) === null);
}

// ── 2. THE REPORTED BUG — after My College has mounted the same widget ──────
{
  const w = boot();
  // Visit My College: this is what re-points the module's inputEl.
  w.CPL_CHAT.mountInto(w.document.querySelector("#tab-my-college .cplchat-mount"));
  check("My College hosts its own input after mountInto", !!myCollegeInput(w));

  w.sessionStorage.setItem(KEY, Q);
  activateChatbot(w);

  const cb = chatbotInput(w);
  const mc = myCollegeInput(w);
  check("the question lands in the CHATBOT input, not the hidden one",
        cb && cb.value === Q);
  check("the hidden My College input is NOT filled",
        !mc || mc.value !== Q);
  check("the key is cleared once actually delivered",
        w.sessionStorage.getItem(KEY) === null);
}

// ── 3. The key must SURVIVE a failed delivery ───────────────────────────────
// Consuming-then-bailing is what made a second click useless. If there is
// nowhere to put the question, the hand-off has to stay pending.
{
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  w.eval(CHAT_SRC);                       // no #tab-chatbot at all: nothing mounts
  w.sessionStorage.setItem(KEY, Q);
  activateChatbot(w);
  check("with no input anywhere, the question is NOT consumed",
        w.sessionStorage.getItem(KEY) === Q);

  // ...and it is delivered on the next activation once the pane exists.
  const pane = w.document.createElement("div");
  pane.id = "tab-chatbot";
  pane.innerHTML = '<div class="main-container"></div>';
  w.document.body.appendChild(pane);
  w.CPL_CHAT.mountInto(pane.querySelector(".main-container"));
  activateChatbot(w);
  check("a pending question is delivered on a later activation",
        chatbotInput(w) && chatbotInput(w).value === Q);
}

// ── 4. Ordering: the key is read, delivered, THEN removed ───────────────────
// Asserted on the source because the ordering IS the fix — a future edit that
// moves removeItem back above the input check reinstates the silent drop.
{
  const fn = CHAT_SRC.slice(CHAT_SRC.indexOf("function consumeTestQuestion"),
                            CHAT_SRC.indexOf("function mount("));
  check("removeItem comes AFTER the element guard",
        fn.indexOf("if (!el) return") < fn.indexOf("removeItem"),
        "the key must not be burned before the question is delivered");
  check("the consumer resolves the chatbot pane's own input",
        /chatbotInputEl\(\)/.test(fn));
}

// ── 5. Sierra Training: the silent no-op is gone ────────────────────────────
{
  check("a missing question tells the user instead of returning silently",
        /if \(!q\) \{ flashBtn\(btn, /.test(TRAIN_SRC),
        "a button that does nothing reads as broken");
  check("a failed clipboard write falls back instead of swallowing",
        /writeText\(q\)\.then\(flash, legacyCopy\)/.test(TRAIN_SRC),
        "navigator.clipboard rejects on an unfocused document — silently, before this");
  check("both copy paths failing says so on the button",
        /couldn’t copy — select the text/.test(TRAIN_SRC));
}

// ── 6. Sierra Training: selecting the question no longer collapses the row ──
{
  check("the row toggle bails when the click ended a text selection",
        /if \(hasTextSelection\(el\)\) return;/.test(TRAIN_SRC),
        "re-rendering on mouseup destroys the selection before it can be copied");
  check("hasTextSelection ignores a collapsed selection",
        /sel\.isCollapsed/.test(TRAIN_SRC));
  check("hasTextSelection only counts a selection inside THIS row",
        /el\.contains\(sel\.anchorNode\)/.test(TRAIN_SRC),
        "a stale selection elsewhere must not make every row unclickable");
  // The rule is built by string concatenation, so the match must tolerate the
  // quote/plus between the fragments.
  check("the question is explicitly selectable in CSS",
        /\.sit-q \{[\s\S]{0,260}user-select:text/.test(TRAIN_SRC));
}

// ── Report ──────────────────────────────────────────────────────────────────

// ── 4. CPL ASSISTANT SUPPRESSED — the hand-off must still land ──────────────
// Sam, 2026-08-14: "CPL Assistant on COBI is the same as Sierra now, right? So
// if I later set CPL Assistant to suppressed using the Admin tab, nothing will
// be lost." It IS the same assistant — but this hand-off named #chatbot
// specifically, so suppressing that tab would have broken the only way to test
// an instruction, and it would have broken SILENTLY. cobi_orgs.js marks a hidden
// nav button data-org-hidden="1", so that is the signal both sides read.
{
  const w = boot();
  // The live page uses id="tab-college-briefing" for My College; give the
  // fixture that id alongside a suppressed CPL Assistant nav button.
  w.document.body.insertAdjacentHTML("beforeend",
    '<div id="tab-college-briefing"><div class="cplchat-mount"></div></div>'
    + '<nav><button class="cpl-tab" data-tab="chatbot" data-org-hidden="1"></button></nav>');
  w.CPL_CHAT.mountInto(w.document.querySelector("#tab-college-briefing .cplchat-mount"));

  w.sessionStorage.setItem(KEY, Q);
  w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));

  const mc = w.document.querySelector("#tab-college-briefing .cplchat-input, #tab-college-briefing #cplchat-input");
  check("a suppressed CPL Assistant routes the hand-off into My College",
        !!mc && mc.value === Q);
  check("the key is consumed once delivered", w.sessionStorage.getItem(KEY) === null);
  check("the suppressed chatbot pane did NOT receive it",
        !(chatbotInput(w) && chatbotInput(w).value === Q));
}

// ── 5. …and an UNsuppressed page still prefers the CPL Assistant pane ───────
// The fallback must not quietly become the default: with both panes present and
// nothing suppressed, the dedicated tab still wins.
{
  const w = boot();
  w.document.body.insertAdjacentHTML("beforeend",
    '<div id="tab-college-briefing"><div class="cplchat-mount"></div></div>'
    + '<nav><button class="cpl-tab" data-tab="chatbot"></button></nav>');
  w.CPL_CHAT.mountInto(w.document.querySelector("#tab-college-briefing .cplchat-mount"));

  w.sessionStorage.setItem(KEY, Q);
  activateChatbot(w);
  check("with nothing suppressed the CPL Assistant pane still wins",
        chatbotInput(w) && chatbotInput(w).value === Q);
}


let failed = 0;
for (const [name, ok] of results) {
  console.log(`  ${ok ? "ok  " : "FAIL"}   ${name}`);
  if (!ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exit(1);
