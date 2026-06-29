// card_actions.js — open the card 📝 Update / 📣 Nudge popups IN PLACE (no #raci
// redirect) + consume the nudge-email ?update= deep-link. jsdom test.
//
// Run from repo root: `npm test` (or `node tests/card_actions.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("card_actions.js", "utf8");

// ── Part A — static invariants across the wiring ──
const RACI = fs.readFileSync("raci.js", "utf8");
check("raci.js exposes openCardUpdate + openCardNudge", /openCardUpdate:\s*openCardUpdate/.test(RACI) && /openCardNudge:\s*openCardNudge/.test(RACI));
check("the per-item nudge email lands on #activities-projects (not #raci)",
  /\?update=" \+ encodeURIComponent\(item\.key\) \+ "#activities-projects/.test(RACI));
const HTML_A = fs.readFileSync("CPL_Dashboard.html", "utf8");
const HTML_B = fs.readFileSync("index.html", "utf8");
check("both HTMLs load card_actions.js (Rule 4)",
  /<script src="card_actions\.js"><\/script>/.test(HTML_A) && /<script src="card_actions\.js"><\/script>/.test(HTML_B));

// ── helper: a jsdom window with the module evaluated, plus RACI/TABS mocks ──
function mkDom(url) {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { runScripts: "outside-only", url: url || "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  w.eval(SRC);
  return w;
}
function wireMocks(w, calls) {
  w.CPL_TABS = { loadScript: function (src, name, cb) { calls.loaded = src; cb(); } };
  w.CPL_RACI_TAB = {
    openCardUpdate: function (k) { calls.update = k; },
    openCardNudge: function (k) { calls.nudge = k; }
  };
}

// ── Part B — keyFromLink reads the inline onclick ──
{
  const w = mkDom();
  const API = w.CPL_CARD_ACTIONS;
  check("module exposes its hooks", API && typeof API.onClick === "function" && typeof API.keyFromLink === "function");
  const a = w.document.createElement("a");
  a.className = "update-link";
  a.setAttribute("onclick", "try{sessionStorage.setItem('cpl_update_focus','project:5.1')}catch(e){}");
  check("keyFromLink extracts the key from the onclick", API.keyFromLink(a, "update") === "project:5.1");
}

// ── Part C — clicking an Update card link opens the composer in place ──
{
  const w = mkDom();
  const calls = {};
  wireMocks(w, calls);
  const a = w.document.createElement("a");
  a.className = "update-link"; a.setAttribute("href", "#raci");
  a.setAttribute("onclick", "try{sessionStorage.setItem('cpl_update_focus','activity:1')}catch(e){}");
  w.document.body.appendChild(a);
  const ev = new w.MouseEvent("click", { bubbles: true, cancelable: true });
  a.dispatchEvent(ev);
  check("Update click lazy-loads raci.js", calls.loaded === "raci.js");
  check("Update click opens the composer in place with the right key", calls.update === "activity:1");
  check("Update click does NOT fall through to a nudge", calls.nudge === undefined);
  check("Update click cancels the #raci navigation (preventDefault)", ev.defaultPrevented === true);
}

// ── Part D — clicking a Nudge card link opens the nudge in place ──
{
  const w = mkDom();
  const calls = {};
  wireMocks(w, calls);
  const a = w.document.createElement("a");
  a.className = "act-nudge-link"; a.setAttribute("href", "#raci");
  a.setAttribute("onclick", "try{sessionStorage.setItem('cpl_nudge_focus','project:3.1.2a')}catch(e){}");
  w.document.body.appendChild(a);
  const ev = new w.MouseEvent("click", { bubbles: true, cancelable: true });
  a.dispatchEvent(ev);
  check("Nudge click opens the nudge in place with the right key", calls.nudge === "project:3.1.2a");
  check("Nudge click cancels the #raci navigation", ev.defaultPrevented === true);
}

// ── Part E — a click elsewhere is left alone ──
{
  const w = mkDom();
  const calls = {};
  wireMocks(w, calls);
  const b = w.document.createElement("button");
  w.document.body.appendChild(b);
  const ev = new w.MouseEvent("click", { bubbles: true, cancelable: true });
  b.dispatchEvent(ev);
  check("a non-card click does not preventDefault", ev.defaultPrevented === false);
  check("a non-card click opens nothing", calls.update === undefined && calls.nudge === undefined);
}

// ── Part F — the nudge-email ?update= deep-link opens in place + strips the param ──
{
  const w = mkDom("https://cpl-initiative.github.io/cpl-project-tracker/?update=project:1.1#activities-projects");
  const calls = {};
  wireMocks(w, calls);
  // boot already ran consumeQueryParam at eval (before mocks) — call again now that
  // the page is "open"; the real boot order on the live site has CPL_TABS present.
  w.CPL_CARD_ACTIONS.consumeQueryParam();
  check("?update= opens the composer in place", calls.update === "project:1.1");
  check("?update= is stripped from the URL after consuming", w.location.search.indexOf("update=") === -1);
}

// ── report ──
let failed = 0;
results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
