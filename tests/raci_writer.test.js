// Team & RACI tab (raci.js): the update composer's polish drafts through the one writer
// module (cpl_writer.js, Sam's Sheet 118 ruling 5). Guards the failure modes of the port:
// a model pin or a rules copy creeping back into raci.js, the polish skipping the writer's
// system prompt, and a page without the writer throwing at load instead of losing the polish.
//
// Run from repo root: `npm test` (or `node tests/raci_writer.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("raci.js", "utf8");
const WRITER = fs.readFileSync("cpl_writer.js", "utf8");

check("raci.js names no model", !/claude-[a-z0-9-]+/.test(SRC));
check("raci.js keeps no proxy constant or API header of its own", !/CPL_REPORT_PROXY_URL/.test(SRC) && !/anthropic-version/.test(SRC) && !/api\.anthropic\.com/.test(SRC));
check("raci.js keeps no copy of the naming rule", !/Mapping Articulated Pathways/.test(SRC));

function makeDom(withWriter, proxy) {
  const dom = new JSDOM("<!doctype html><html><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  dom._sent = [];
  if (proxy) w.CPL_REPORT_PROXY_URL = proxy;
  w.fetch = function (url, init) {
    dom._sent.push({ url: url, body: init && init.body ? JSON.parse(init.body) : null });
    return Promise.resolve({ ok: true, status: 200,
      json: function () { return Promise.resolve({ model: "served-model", content: [{ type: "text", text: "  The portal shipped.  " }] }); } });
  };
  if (withWriter) w.eval(WRITER);
  w.eval(SRC);
  return dom;
}

(async function () {
  // The page loads the writer before this lazy file, as both HTMLs do.
  const dom = makeDom(true, "https://proxy.example/");
  const T = dom.window.CPL_RACI_TAB;
  check("the polish is ready with the writer and a proxy", T._polishReady() === true);
  const sys = T._updateSystem();
  const composed = dom.window.CPL_WRITER.system({ role: "x" });
  check("the system prompt carries the writer's naming rule", /Mapping Articulated Pathways \(MAP\)/.test(sys));
  check("the system prompt carries the writer's shared rules after the role line", sys.indexOf(composed.slice(composed.indexOf("\n\n") + 2, 200)) > 0);
  check("the system prompt keeps the facts rule", /Do not invent specifics, numbers or names/.test(sys));
  const text = await T._polish("shipped the portal; 3 colleges", "MAP Platform Development");
  const sent = dom._sent[0];
  check("the polish goes to the page's proxy", dom._sent.length === 1 && sent.url === "https://proxy.example/");
  check("the request carries the composed system prompt", sent && sent.body.system === sys);
  check("the request carries the writer's model, never a pin", sent && sent.body.model === dom.window.CPL_WRITER.MODEL);
  check("the user prompt carries the item and the brain-dump", sent && /MAP Platform Development/.test(sent.body.messages[0].content) && /3 colleges/.test(sent.body.messages[0].content));
  check("the polish resolves the trimmed text", text === "The portal shipped.");

  // No proxy on the page: the control reads not ready.
  check("no proxy: the polish is not ready", makeDom(true, "").window.CPL_RACI_TAB._polishReady() === false);

  // No writer on the page: the tab still loads; only the polish is lost.
  const bare = makeDom(false, "https://proxy.example/");
  check("no writer: the tab still loads", !!bare.window.CPL_RACI_TAB);
  check("no writer: the polish is not ready", bare.window.CPL_RACI_TAB._polishReady() === false);
  let msg = "";
  await bare.window.CPL_RACI_TAB._polish("x", "y").catch(function (e) { msg = e.message; });
  check("no writer: the polish rejects with a sentence and sends nothing", /writer module/.test(msg) && bare._sent.length === 0);

  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
