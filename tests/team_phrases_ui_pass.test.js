// Team Phrases — the S366 UI pass (team_phrases.js).
//
// The phrases are readable only to a reviewer, so the unseeded sweeps measure the
// sign-in form alone. The seeded targets (team-phrases-reviewer, with -dark) store a
// reviewer session and stub team_access; they passed contrast and target size in both
// themes. What the sweep does not check, read at five widths and on screen:
//  (a) no input had a name: the email field and all four phrase fields carried
//      placeholders only;
//  (b) the save message read "Share the new Shared team phrase phrase": the code
//      appended " phrase" to a label that already ends in it;
//  (c) a key emoji led the heading, and a check mark led two messages, one of which
//      decided its own color by matching that mark;
//  (d) Sign out, Reveal, Save and Email me a link were boxed, two of them filled;
//      controls are underlined words (Sam, 2026-10-09);
//  (e) the warning was a full mustard fill on every visit and the gate chip a second
//      gold fill (muted by default); raw hex sat in about fifteen fallbacks.
// Each fails on the old file.
//
// Run from repo root: `npm test` (or `node tests/team_phrases_ui_pass.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const SRC = fs.readFileSync(process.env.TP_SRC || "team_phrases.js", "utf8");
const CODE = SRC.replace(/^\s*\/\/.*$/gm, "");
const CSS = (CODE.match(/st\.textContent = \[[\s\S]*?\]\.join\(""\)/) || [""])[0];

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why || ""]); }
const rule = (sel) => { const i = CSS.indexOf('"' + sel + "{"); return i < 0 ? "" : CSS.slice(i, CSS.indexOf("}", i)).replace(/",\s*"/g, ""); };

function win(opts) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="team-phrases-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.signedIn) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaa.bbb.ccc", refresh_token: "r",
      email: "map@rccd.edu", exp: Date.now() + 3600000 }));
  }
  w.fetch = function (url, init) {
    const m = (init && init.method) || "GET";
    if (/team_access/.test(url) && m === "PATCH") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: "x" }]) });
    if (/team_access/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(
      ["team", "ci", "gr", "fin"].map((id) => ({ id, secret: id + "-secret" }))) });
    if (/auth\/v1\/otp/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.eval(SRC);
  return w;
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 40));
const named = (w, inp) => !!(inp.labels && inp.labels.length) || !!inp.getAttribute("aria-label");

(async function () {
  // (a) + (b): signed in as a reviewer
  {
    const w = win({ signedIn: true });
    const root = w.document.getElementById("team-phrases-root");
    w.CPL_TEAM_PHRASES.activate();
    await tick();
    const inputs = Array.from(root.querySelectorAll("input[data-phrase]"));
    check("(a) precondition: four phrase fields render", inputs.length === 4, String(inputs.length));
    check("(a) every phrase field has a name", inputs.length && inputs.every((i) => named(w, i)));
    const names = inputs.map((i) => (i.getAttribute("aria-labelledby") || "").split(/\s+/)
      .map((id) => (w.document.getElementById(id) || {}).textContent || "").join(" ").trim());
    check("(a) …and the four names differ, each naming its card", new Set(names).size === 4 && /^Shared team phrase Phrase$/.test(names[0]), names.join(" | "));
    const save = root.querySelector('[data-save="team"]');
    w.CPL_TEAM_PHRASES._state.draft.team = "new-team-secret";
    save.click();
    await tick();
    const msg = root.querySelector(".tphx-msg.ok");
    check("(b) a save says Saved", !!msg && /^Saved\./.test(msg.textContent), msg ? msg.textContent : "no ok message");
    check("(b) …without saying phrase twice", !!msg && !/phrase phrase/.test(msg.textContent));
    check("(c) the heading carries no emoji", !/[\u{1F300}-\u{1FAFF}]/u.test(root.querySelector("h2").textContent));
  }
  // (a) + (c): signed out, the sign-in form
  {
    const w = win({ signedIn: false });
    const root = w.document.getElementById("team-phrases-root");
    w.CPL_TEAM_PHRASES.activate();
    await tick();
    const em = root.querySelector("[data-email]");
    check("(a) the email field has a name", !!em && named(w, em));
    em.value = "map@rccd.edu";
    root.querySelector("[data-signin]").click();
    await tick();
    const ok = root.querySelector(".tphx-msg.ok");
    check("(c) a sent link reads as ok without a leading check mark",
      !!ok && /^Check your email/.test(ok.textContent), ok ? ok.textContent : "no ok message");
  }
  check("(c) no check mark or key glyph in a rendered string", !/[✓🔑]/u.test(CODE));
  const btn = rule(".tphx-btn");
  check("(d) .tphx-btn is an underlined word, no border or fill, 24px",
    /text-decoration:underline/.test(btn) && /min-height:24px/.test(btn) && /border:0/.test(btn) && /background:none/.test(btn), btn.slice(0, 160));
  check("(d) no filled lead button remains", !/tphx-btn-go/.test(CODE));
  check("(d) a control shows keyboard focus", /\.tphx-btn:focus-visible/.test(CSS));
  check("(e) the warning is not a full mustard fill", !/background:var\(--mustard-fill/.test(rule(".tphx-warn")));
  check("(e) the gate chip is quiet", !/gold-accent|mustard/.test(rule(".tphx-gatechip")));
  check("(e) no raw hex in the view's CSS", !/#[0-9a-fA-F]{3,8}\b/.test(CSS), (CSS.match(/#[0-9a-fA-F]{3,8}\b/g) || []).join(" "));

  let failed = 0;
  results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
