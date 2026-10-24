// Where To? router (quickstart.js): it routes through the one writer module (cpl_writer.js,
// Sam's Sheet 118 ruling 5). Guards the port's failure modes: the router skipping the writer's
// system prompt, losing its Haiku routing override (or taking the writer's drafting model for a
// 1-of-N classification), and a page without the writer failing to load the bar.
//
// Run from repo root: `npm test` (or `node tests/quickstart_writer.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const QS = fs.readFileSync("quickstart.js", "utf8");
const WRITER = fs.readFileSync("cpl_writer.js", "utf8");

function page(withWriter) {
  const dom = new JSDOM("<!DOCTYPE html><html><body><div class='header'></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  const w = dom.window;
  dom._sent = [];
  w.CPL_REPORT_PROXY_URL = "https://proxy.example.org/";
  w.fetch = function (url, init) {
    dom._sent.push({ url: String(url), body: JSON.parse(init.body) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ content: [{ type: "text",
      text: JSON.stringify({ tab: "budget", message: "Opening the Budget tab." }) }] }) });
  };
  if (withWriter) w.eval(WRITER);
  w.eval(QS);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
function ask(dom, text) {
  const input = dom.window.document.getElementById("qs-input");
  input.value = text;
  input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  return new Promise((r) => setTimeout(r, 600));
}

(async function () {
  const dom = page(true);
  await ask(dom, "show me the budget");
  const sent = dom._sent[0];
  check("the question goes to the page's proxy once", dom._sent.length === 1 && sent.url === "https://proxy.example.org/");
  check("routing keeps its Haiku override, not the writer's drafting model",
    sent && /^claude-haiku-/.test(sent.body.model) && sent.body.model !== dom.window.CPL_WRITER.MODEL);
  check("the system prompt carries the writer's naming rule and the routing table",
    sent && /Mapping Articulated Pathways \(MAP\)/.test(sent.body.system) && /budget/.test(sent.body.system) && /JSON object only/.test(sent.body.system));
  check("the system prompt leaves out the house voice", sent && !/house voice/i.test(sent.body.system));
  check("the route lands: the hash names the tab", /#budget$/.test(dom.window.location.href), dom.window.location.href);

  const bare = page(false);
  check("no writer: the bar still mounts", !!bare.window.document.getElementById("qs-chat"));
  await ask(bare, "show me the budget");
  check("no writer: nothing is sent", bare._sent.length === 0);

  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
