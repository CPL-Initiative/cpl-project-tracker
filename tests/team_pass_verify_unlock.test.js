// Security step 2 (2026-11-06): every explicit unlock calls rpc/team_pass_verify,
// which records failed unlocks per IP. The phrase rides only in x-team-pass; the
// body names only the site. Guards the failure mode: a client that posts the
// phrase in the URL or body (logged), or calls team_pass_ok (records nothing).
const fs = require("fs");
const { JSDOM } = require("jsdom");
let pass = 0, fail = 0;
function check(name, ok) { if (ok) { pass++; console.log("PASS  " + name); } else { fail++; console.log("FAIL  " + name); } }

const PHRASE = "secret-phrase-xyz";
function load(site) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(false) });
  };
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync("team_phrase.js", "utf8");
  w.document.body.appendChild(s);
  return w;
}

(async () => {
  for (const [site, want] of [[undefined, "team"], ["gr", "gr"], ["fin", "fin"]]) {
    const w = load();
    const TP = w.CPL_TEAM_PHRASE;
    if (!TP || typeof TP.verify !== "function") { check("team_phrase.js exposes verify", false); break; }
    await TP.verify(PHRASE, site);
    const f = w.__fetches[0] || { url: "", init: {} };
    check(`verify(${site || "shared"}) posts to rpc/team_pass_verify`, /\/rest\/v1\/rpc\/team_pass_verify$/.test(f.url));
    check(`verify(${site || "shared"}) sends p_site ${want}`, f.init.body === JSON.stringify({ p_site: want }));
    check(`verify(${site || "shared"}) puts the phrase in x-team-pass only`,
      f.init.headers["x-team-pass"] === PHRASE && f.url.indexOf(PHRASE) === -1 && String(f.init.body).indexOf(PHRASE) === -1);
  }
  for (const file of ["team_phrase.js", "raci.js", "gr_priorities.js", "kb-portal/composer_util.js"]) {
    const src = fs.readFileSync(file, "utf8").replace(/\/\/.*$/mg, "").replace(/\/\*[\s\S]*?\*\//g, "");
    check(`${file}: no unlock posts to rpc/(team|gr|fin)_pass_ok`, !/rpc\/(team|gr|fin)_pass_ok/.test(src) && !/'(gr|fin)_pass_ok'/.test(src));
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
