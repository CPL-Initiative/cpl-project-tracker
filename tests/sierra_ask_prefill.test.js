// Sierra standalone page — the ?ask= prefill (S327).
//
// CPL Pathways' "Ask Sierra" link carries the program question in ?ask=. The
// failure modes this guards: the question SENDS before the visitor picks an
// audience (the page requires one first, Sam 2026-07-01), a crafted link
// smuggles control characters or a wall of text into the box, and a normal
// visit (no ?ask=) changes at all.
//
// Run from repo root: `npm test` (or `node tests/sierra_ask_prefill.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const HTML = fs.readFileSync("sierra/index.html", "utf8");
const SRC = fs.readFileSync("sierra/sierra.js", "utf8");

function loadDom(url) {
  const dom = new JSDOM(HTML, { runScripts: "outside-only", url: url });
  const w = dom.window;
  const requests = [];
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  w.fetch = function (u, init) { requests.push(String(u)); return Promise.reject(new Error("no network in tests")); };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { w, requests, input: w.document.getElementById("s-input") };
}

const Q = "What does the Apprenticeship: Field Ironworkers (A.S. Degree) at Cerritos College require, and which of its courses can a learner clear through credit for prior learning?";
const base = "https://cpl-initiative.github.io/cpl-project-tracker/sierra/";

(async () => {
  const a = loadDom(base + "?ask=" + encodeURIComponent(Q));
  check("the question from ?ask= fills the box", a.input && a.input.value === Q, a.input && a.input.value);
  await new Promise((r) => setTimeout(r, 20));
  check("nothing is sent before the visitor presses Send", a.requests.length === 0, a.requests.join(", "));

  const b = loadDom(base);
  check("a normal visit leaves the box empty", b.input && b.input.value === "");

  const c = loadDom(base + "?ask=" + encodeURIComponent("line one\nline\u0007two\t\tthree"));
  check("control characters become single spaces", c.input && c.input.value === "line one line two three", c.input && c.input.value);

  const d = loadDom(base + "?ask=" + encodeURIComponent("x".repeat(2000)));
  check("a long question is capped at 500 characters", d.input && d.input.value.length === 500, d.input && d.input.value.length);

  const failed = results.filter((r) => !r[1]);
  for (const [name, ok, why] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || why === undefined ? "" : " — " + String(why).slice(0, 200)}`);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
})();
