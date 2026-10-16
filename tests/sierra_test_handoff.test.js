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
//      and build() used to re-point a module-level input at THAT box. The
//      hand-off then typed the question into a hidden box for the rest of the
//      session.
//
//   2. THE KEY WAS BURNED ON FAILURE. consumeTestQuestion() removed the
//      sessionStorage key BEFORE checking that an input existed, then bailed.
//      So an activation that fired before the widget was built consumed the
//      question and dropped it — and because the key was gone, clicking again
//      could not work either.
//
// Since S398 (Sam, 2026-10-16) there is no CPL Assistant tab: Sierra Training
// asks Sierra AI over its own tab through CPL_CHAT.open() (tests/
// sierra_one_cobi.test.js). A question can still wait under the key — a page
// without open() falls back to the #chatbot link — and that link delivers it
// into Sierra AI's OWN box, the COBI-wide one, never My College's, and only
// removes the key once the value is actually delivered.
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

// A page carrying My College's box, like the live dashboard; Sierra AI's own
// box is built by open() in a body-level host.
function boot(url) {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body>'
    + '<div class="cpl-tab-pane" id="tab-dashboard"></div>'
    + '<div class="cpl-tab-pane" id="tab-college-briefing"><div class="cplchat-mount"></div></div>'
    + "</body></html>",
    { url: url || "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };  // never resolves; no network in tests
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  w.eval(CHAT_SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return w;
}

function cobiInput(w) {
  return w.document.querySelector("#cplchat-cobi .cplchat-input, body > .cplchat.cplchat-full .cplchat-input");
}
function myCollegeInput(w) {
  return w.document.querySelector("#tab-college-briefing #cplchat-input, #tab-college-briefing .cplchat-input");
}
// What tabs.js does with a #chatbot link: no tab by that name, so it lands on
// the home tab and announces it.
function activate(w, tab) {
  w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: tab } }));
}
const tick = () => new Promise((r) => setTimeout(r, 0));

(async function () {
// ── 1. The plain case: the #chatbot link delivers into Sierra AI's box ─────
{
  const w = boot("https://example.org/#chatbot");
  w.sessionStorage.setItem(KEY, Q);
  activate(w, "dashboard");
  await tick(); await tick();
  const el = cobiInput(w);
  check("a #chatbot link opens Sierra AI's own box", !!el);
  check("the question lands in her input", el && el.value === Q);
  check("a delivered question is removed from sessionStorage",
        w.sessionStorage.getItem(KEY) === null);
  check("the address names the home tab beneath her, not the retired one",
        !/#chatbot/.test(w.location.href));
}

// ── 2. THE REPORTED BUG — after My College has mounted the same widget ──────
{
  const w = boot("https://example.org/");
  // Visit My College: its box is built, and was the last one built.
  w.CPL_CHAT.mountInto(w.document.querySelector("#tab-college-briefing .cplchat-mount"), "my-college");
  check("My College hosts its own input after mountInto", !!myCollegeInput(w));

  w.sessionStorage.setItem(KEY, Q);
  w.location.hash = "#chatbot";
  activate(w, "dashboard");
  await tick(); await tick();

  const cb = cobiInput(w);
  const mc = myCollegeInput(w);
  check("the question lands in SIERRA AI's input, not the hidden one",
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
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  w.eval(CHAT_SRC);                       // no box built anywhere yet
  w.sessionStorage.setItem(KEY, Q);
  w.CPL_CHAT.consumeTestQuestion();
  activate(w, "college-briefing");
  check("with no box anywhere, the question is NOT consumed",
        w.sessionStorage.getItem(KEY) === Q);

  // ...and it is delivered once Sierra AI's box exists.
  w.CPL_CHAT.open();
  w.CPL_CHAT.consumeTestQuestion();
  check("a pending question is delivered once her box is built",
        cobiInput(w) && cobiInput(w).value === Q && w.sessionStorage.getItem(KEY) === null);
}

// ── 4. Ordering: the key is read, delivered, THEN removed ───────────────────
// Asserted on the source because the ordering IS the fix — a future edit that
// moves removeItem back above the input check reinstates the silent drop.
{
  const fn = CHAT_SRC.slice(CHAT_SRC.indexOf("function consumeTestQuestion"),
                            CHAT_SRC.indexOf("// ── Sierra AI over any tab (S398)"));
  check("removeItem comes AFTER the element guard",
        fn.indexOf("if (!el) return") > 0 && fn.indexOf("if (!el) return") < fn.indexOf("removeItem"),
        "the key must not be burned before the question is delivered");
  check("the consumer resolves Sierra AI's own box, never the box built last",
        /\(cobiBox && cobiBox\.input\)/.test(fn));
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

// ── 7. NOTHING TO SUPPRESS, SO NOTHING TO REROUTE ───────────────────────────
// Sam, 2026-08-14, planning to hide the CPL Assistant tab: "nothing will be
// lost." The hand-off then fell back to My College when the tab was hidden.
// The tab is gone (S398), so the default has one place to go — Sierra AI's own
// box — and arriving at My College must never take a default hand-off into
// My College's box, even when that box is the one built last.
{
  const w = boot("https://example.org/");
  w.CPL_CHAT.mountInto(w.document.querySelector("#tab-college-briefing .cplchat-mount"), "my-college");
  w.sessionStorage.setItem(KEY, Q);
  activate(w, "college-briefing");
  const mc = myCollegeInput(w);
  check("arriving at My College leaves a default hand-off out of My College's box",
        !!mc && mc.value === "" && w.sessionStorage.getItem(KEY) === Q);
  w.location.hash = "#chatbot";
  activate(w, "dashboard");
  await tick(); await tick();
  check("…and the #chatbot link still delivers it into Sierra AI's box",
        cobiInput(w) && cobiInput(w).value === Q && mc.value === "" && w.sessionStorage.getItem(KEY) === null);
}

// ── 8. A delivered question is never SENT by the link ──────────────────────
// The link fills; the reviewer edits, then asks. One click to ask is
// CPL_CHAT.open({ send: true }), which Sierra Training uses directly.
{
  const w = boot("https://example.org/#chatbot");
  let posted = 0;
  w.fetch = function () { posted++; return new Promise(function () {}); };
  w.localStorage.setItem("cplSierraAudience.v1", "faculty");
  w.sessionStorage.setItem("cplSierraAudienceOk.v1", "faculty");
  w.sessionStorage.setItem(KEY, Q);
  activate(w, "dashboard");
  await tick(); await tick();
  check("the link fills her box and sends nothing", cobiInput(w) && cobiInput(w).value === Q && posted === 0);
}

let failed = 0;
for (const [name, ok] of results) {
  console.log(`  ${ok ? "ok  " : "FAIL"}   ${name}`);
  if (!ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exit(1);
})().catch(function (e) { console.error(e); process.exit(1); });
