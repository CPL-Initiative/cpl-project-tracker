// A Copy control on every code block of a decision sheet — kb/_decision_sheet_replies.py.
// Sam, 2026-10-17, answering a sheet from his phone: "Can you make it easy to copy the code to
// paste on the decision sheets? I'm working from my phone." A paste card's SQL sat in a <pre>
// with nothing to copy it by, and long-pressing a scrolling block on a phone selects a word.
//
// Guards: one control per block, even after a second inject; the control copies the block's
// exact text; where the clipboard refuses (some app views do), it selects the whole block and
// says so, never failing silently.
//
// Run from repo root: `npm test` (or `node tests/decision_sheet_pre_copy.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM, VirtualConsole } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SQL = "update public.program_source_registry r set\n  catalog_url = 'https://x.edu/'\nwhere r.college = 'X';";
const page = `<!doctype html><html><head><title>Open Asks Sheet 0</title><style>body{}</style></head><body>
<section><h2>Open</h2>
<div class="item" id="i1"><h3>Paste the correction?</h3><p class="ref">reference: lane</p>
<pre>${SQL.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></div>
<div class="item" id="i2"><h3>No code here</h3><p class="ref">reference: lane</p><p>Words only.</p></div>
</section></body></html>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pre-copy-"));
const f = path.join(dir, "sheet.html");
fs.writeFileSync(f, page);
execFileSync("python3", ["kb/_decision_sheet_replies.py", "--inject", f], { stdio: "pipe" });
// A sheet is rebuilt and injected again at every checkpoint: the control must not double.
execFileSync("python3", ["kb/_decision_sheet_replies.py", "--inject", f], { stdio: "pipe" });
const html = fs.readFileSync(f, "utf8");

function load(clipboard) {
  const vc = new VirtualConsole();
  const dom = new JSDOM(html, {
    runScripts: "dangerously", virtualConsole: vc, url: "https://example.test/",
    beforeParse(w) {
      Object.defineProperty(w.navigator, "clipboard", { value: clipboard, configurable: true });
    },
  });
  return dom.window;
}

(async () => {
  const copied = [];
  let w = load({ writeText: (t) => { copied.push(t); return Promise.resolve(); } });
  const btns = w.document.querySelectorAll(".pre-copy");
  check("one Copy control per code block, after two injects", btns.length === 1, btns.length);
  check("it is a button, named for its card", btns[0] && btns[0].tagName === "BUTTON"
        && /Paste the correction/.test(btns[0].getAttribute("aria-label") || ""),
        btns[0] && btns[0].getAttribute("aria-label"));
  check("it sits right above its block", btns[0] && btns[0].parentNode.nextElementSibling
        && btns[0].parentNode.nextElementSibling.tagName === "PRE");
  if (btns[0]) btns[0].click();
  await new Promise((r) => setTimeout(r, 0));
  check("it copies the block's exact text", copied[0] === SQL, JSON.stringify(copied[0]));
  check("it says Copied", /Copied/.test((w.document.querySelector(".pre-copy-said") || {}).textContent || ""));

  // An app view that refuses the clipboard: the block is selected and the line says so.
  w = load({ writeText: () => Promise.reject(new Error("not allowed")) });
  const b2 = w.document.querySelector(".pre-copy"); if (b2) b2.click();
  await new Promise((r) => setTimeout(r, 0));
  const sel = String(w.getSelection());
  check("a refused clipboard selects the whole block", sel === SQL, JSON.stringify(sel));
  check("and says to use the phone's Copy", /Selected/.test((w.document.querySelector(".pre-copy-said") || {}).textContent || ""));

  const failed = results.filter((r) => !r[1]);
  for (const [n, ok, why] of results) if (!ok) console.log("FAIL  " + n + (why !== undefined ? "  — " + why : ""));
  console.log(`${failed.length ? "FAIL" : "ok"}: decision sheet pre copy (${results.length - failed.length}/${results.length})`);
  process.exit(failed.length ? 1 : 0);
})();
