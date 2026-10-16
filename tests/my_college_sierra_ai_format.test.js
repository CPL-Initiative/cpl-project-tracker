// My College — Sierra AI's format in her seat (S400, jsdom).
//
// Sam, 2026-10-16: "pick back up on the Sierra AI consolidation and make sure
// it's integrated in the My College tab, which still has the old format". S398
// made one Sierra (CPL_CHAT.open() over any tab, the CPL Assistant tab retired)
// and left My College's docked box as it was: three nested cards, a description
// and the Note above the role row, a separate Full screen row, and the log's
// own 240px frame. Sierra AI over a tab is one column: her name and one control
// on a ruled bar, the role row, the starters, the box, the caution under it.
//
// The failure this guards is silent. The old format still works, so nothing
// errors when it comes back; the box just reads as a second assistant again.
//
//  (1) THE BOX ORDER IS SIERRA AI'S. Inside My College's box: the role row,
//      then the starters, then the input, then the caution. No paragraph sits
//      above the role row, and her heading is the section's summary.
//  (2) ONE CAUTION, UNDER THE BOX, IN BOTH BOXES. Sam's 2026-08-21 Note moved
//      out of the intro (which full screen hides, so Sierra AI over a tab had
//      shown only its privacy half) into `.cplchat-foot`; the COBI-wide box
//      carries the same words.
//  (3) ONE FRAME. My College's <details> inside .cb-assist draws no card, its
//      summary is the ruled bar, Full screen sits on that bar, and the log has
//      neither a frame nor a floor. jsdom has no layout, so these read the CSS;
//      `npm run a11y -- my-college-page` measures the painted result.
//
// ⚠ Budget: ~44 MB per booted jsdom window (docs/kb-notes/methodology-a-test-
// file-is-a-memory-budget.md). This file boots two.
//
// Run from repo root: `npm test` (or `node tests/my_college_sierra_ai_format.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
async function block(label, fn) {
  try { await fn(); } catch (e) { check(label + " — setup did not throw", false, String(e && e.message)); }
}

const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");
const NOTE = "Note: Sierra is in the development phase and may present incomplete or inaccurate information. "
  + "Please give a thumbs up or down and include a note if you notice an improvement to be made. "
  + "Please don't enter personal information; questions are logged to improve responses.";
const FOLLOWING = 4;   // Node.DOCUMENT_POSITION_FOLLOWING

function boot(html, scripts) {
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + html + "</body></html>",
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.localStorage.setItem("cplSierraAudience.v1", "faculty");
  w.sessionStorage.setItem("cplSierraAudienceOk.v1", "faculty");
  w.fetch = function () { return new Promise(function () {}); };
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  scripts.forEach(function (src) {
    const s = w.document.createElement("script");
    s.textContent = src;
    w.document.body.appendChild(s);
  });
  return w;
}

function myCollege() {
  const w = boot('<div class="cpl-tab-pane" id="tab-college-briefing"><div id="college-briefing-root"></div></div>',
    [TEAM, CHAT, BRIEFING]);
  const M = w.CPL_COLLEGE_BRIEFING;
  M._state.data = {
    colleges: ["Allan Hancock College"], summaryByName: {}, raw: {},
    briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 1", year: "1" },
  };
  M._state.scope = "college";
  M._state.college = "Allan Hancock College";
  M.render(w.document.getElementById("college-briefing-root"));
  return w;
}

(async function main() {
  const w = myCollege();
  const doc = w.document;
  const box = doc.querySelector(".cb-assist");

  // ── (1) the box order ──
  await block("(1)", async function () {
    const wrap = box && box.querySelector("#cb-assistant-mount .cplchat");
    check("(1) precondition: My College mounted Sierra's box", !!wrap);
    if (!wrap) return;
    const aud = wrap.querySelector(".cplchat-audience");
    const chips = wrap.querySelector(".cplchat-suggest");
    const input = wrap.querySelector(".cplchat-input");
    const foot = wrap.querySelector(".cplchat-foot");
    const after = function (a, b) { return !!(a && b && (a.compareDocumentPosition(b) & FOLLOWING)); };
    check("(1) ⭐ role row → starters → box → caution, in that order",
      after(aud, chips) && after(chips, input) && after(input, foot));
    const sum = box.querySelector("details[data-sec=\"sierra\"] > summary");
    check("(1) her heading is the section's summary, with her mark",
      !!sum && /Sierra AI/.test(sum.textContent) && !!sum.querySelector(".cplchat-title-mark"));
    // No paragraph between the summary and the role row: the description and
    // the Note above the box were the old format's first sight.
    const above = Array.prototype.filter.call(box.querySelectorAll("p"), function (p) { return after(p, aud); });
    check("(1) ⭐ no paragraph sits above the role row",
      above.length === 0, above.map(function (p) { return p.textContent.slice(0, 60); }).join(" | "));
    check("(1) the description is gone from the widget, not just hidden",
      !/Ask her anything/.test(CHAT.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "")));
  });

  // ── (2) one caution, under the box, in both boxes ──
  await block("(2)", async function () {
    const foot = box && box.querySelector("#cb-assistant-mount .cplchat-foot");
    check("(2) ⭐ My College's box carries Sam's Note, verbatim, under the box",
      !!foot && foot.textContent === NOTE, foot && foot.textContent);
    check("(2) …and only there: once in the box",
      (box.textContent.split("development phase").length - 1) === 1);
    w.CPL_CHAT.open();
    const cobi = doc.querySelector(".cplchat.cplchat-full");
    const cfoot = cobi && cobi.querySelector(".cplchat-foot");
    check("(2) ⭐ Sierra AI over a tab carries the same words under her box",
      !!cfoot && cfoot.textContent === NOTE, cfoot && cfoot.textContent);
    check("(2) the old privacy-only line is gone (one sentence for both boxes)",
      !doc.querySelector(".cplchat-full-note"));
  });

  // ── (3) one frame (CSS; the a11y sweep measures the paint) ──
  await block("(3)", async function () {
    const sheet = function (id) { const s = doc.getElementById(id); return s ? s.textContent : ""; };
    const chat = sheet("cplchat-aud-css"), dock = sheet("cplchat-dock-css");
    const all = Array.prototype.map.call(doc.querySelectorAll("style"), function (s) { return s.textContent; }).join("\n");
    const log = (chat.match(/(^|\n)\.cplchat-log \{[^}]*\}/) || [""])[0];
    check("(3) ⭐ the log draws no frame and has no floor",
      !!log && !/border:/.test(log) && !/background:/.test(log) && !/min-height: ?[1-9]/.test(log), log.trim());
    check("(3) …and no dark rule paints one back",
      !/\.cplchat-log \{ background/.test(chat));
    check("(3) the caution is shown docked as well as full screen",
      /(^|\n)\.cplchat-foot \{[^}]*font-size/.test(dock) && !/\.cplchat-foot \{ display:none/.test(dock));
    check("(3) ⭐ the <details> inside .cb-assist draws no card of its own",
      /\.cb-assist>\.cb-assist-d\.cb-sec\{border:0;[^}]*background:transparent/.test(all));
    check("(3) its summary is the ruled bar",
      /\.cb-assist>\.cb-assist-d\[open\]>\.cb-sum\{border-bottom:1px solid var\(--border\)/.test(all));
    check("(3) ⭐ Full screen sits on that bar, placed, never moved out of her box",
      /\.cb-assist-d \.cplchat:not\(\.cplchat-full\)>\.cplchat-dockbar\{position:absolute;top:0;right:0/.test(all)
        && !!box.querySelector("#cb-assistant-mount .cplchat > .cplchat-dockbar > .cplchat-dock-btn"));
  });

  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nmy_college_sierra_ai_format.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
  process.exit(0);
})();
