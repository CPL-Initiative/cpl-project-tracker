// The side bar asks Sierra a question and sends it (Sam, 2026-11-01, on the Sierra training
// tab: "Save and Ask Sierra or Try it on Sierra, both lead to what looks like a dead version
// of sierra--should go to the current version and open her in a side panel so the user
// doesn't get lost"). Guards:
//   (1) CPL_SIERRA_BAR.ask(q) opens the bar on Sierra's own page with ?panel=1, the question
//       in ?ask= and ?send=1;
//   (2) a second ask reloads the one frame with the new question, a fresh conversation;
//   (3) her page sends only inside the bar and only for a host on its own origin: a link from
//       anywhere else still only fills the box.
// Run from repo root: `npm test` (or `node tests/sierra_sidebar_ask.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const BAR = fs.readFileSync("sierra/sidebar.js", "utf8");
const PAGE = fs.readFileSync("sierra/sierra.js", "utf8");

const dom = new JSDOM('<!doctype html><html data-theme="light"><head></head><body><button id="b">Save &amp; ask</button></body></html>',
  { url: "https://example.org/cpl/", runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window;
w.eval(BAR);
const B = w.CPL_SIERRA_BAR;
const btn = w.document.getElementById("b");
B.ask("Which colleges have not yet met the 75% vet sprint goal?", btn);
const frame = w.document.querySelector("iframe.sbar-frame");
const src = frame ? frame.getAttribute("src") : "";
check("(1) ask opens the bar", B.isOpen());
check("(1) the frame is Sierra's own page, in the panel, with the question and send=1",
  /^https:\/\/example\.org\/cpl\/\?panel=1&theme=light&ask=Which%20colleges/.test(src) && /&send=1$/.test(src), src);
B.ask("A second question?", btn);
const frames = w.document.querySelectorAll("iframe.sbar-frame");
check("(2) a second ask reloads the one frame with the new question",
  frames.length === 1 && /ask=A%20second%20question%3F&send=1$/.test(frames[0].getAttribute("src")), frames[0] && frames[0].getAttribute("src"));

const gate = (PAGE.match(/function sendFromHost\(\) \{[\s\S]*?\n  \}/) || [""])[0];
check("(3) her page sends only with send=1 and panel=1", /sp\.get\('send'\) !== '1' \|\| sp\.get\('panel'\) !== '1'/.test(gate));
check("(3) never at the top level, and only for a parent on her own origin",
  /window\.parent === window\) return false/.test(gate) && /window\.parent\.location\.origin === location\.origin/.test(gate) &&
  /catch \(e\) \{ return false; \}/.test(gate));
check("(3) the send follows the prefill, never without a question", /if \(prefillAsk\(\) && sendFromHost\(\)\) setTimeout\(submit, 0\);/.test(PAGE));

let failed = 0;
for (const [name, ok, why] of results) { console.log((ok ? "PASS " : "FAIL ") + name + (ok || !why ? "" : "\n     " + why)); if (!ok) failed++; }
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
