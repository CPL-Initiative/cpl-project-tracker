// Fact Sheet — ✎ Curate button VISIBILITY (fact-sheet/factsheet_edit.js) — jsdom test.
//
// Sam, 2026-08-20: hide the Curate button from the public, keep it reachable for
// the MAP team. The failure modes this guards, in the order they would bite:
//
//  (a) THE PUBLIC SEES IT ANYWAY. The button must ship `hidden` in the MARKUP
//      (not merely hidden by script, which flashes) AND `.btn[hidden]` must be
//      declared in factsheet.css — `.btn{display:inline-flex}` outranks the UA
//      sheet's [hidden]{display:none}, so without that rule the attribute is
//      decorative and the button paints for everyone.
//  (b) THE TEAM CANNOT GET IN. A signed-in reviewer must see it with no switch,
//      and ?curate=1 must reveal it for a curator who has NO session yet —
//      hiding the button otherwise hides the only way to START signing in.
//  (c) THE SWITCH LEAKS INTO A SHARED LINK. ?curate=1 must be stripped from the
//      address bar, so a URL copied out of a curator's own bar is the public one.
//  (d) IT BECOMES MISTAKEN FOR SECURITY. The write path stays RLS-gated; this
//      test asserts the reveal is presentation-only by pinning that the module
//      still gates writes on a session, never on the reveal flag.
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit_curate_visibility.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/factsheet_edit.js", "utf8");
const CSS = fs.readFileSync("fact-sheet/factsheet.css", "utf8");
const KEEPER = fs.readFileSync("cpl_session.js", "utf8");

// ── (a) static invariants on the shipped page ──
const BTN = /<button[^>]*id="btn-curate"[^>]*>/.exec(HTML);
check("index.html still has the #btn-curate button", !!BTN);
check("the button ships hidden in the markup", !!BTN && /\shidden(\s|>)/.test(BTN[0]));
check("factsheet.css declares .btn[hidden] (display:inline-flex would beat the UA rule)",
  /\.btn\[hidden\]\s*\{[^}]*display:\s*none/.test(CSS));
check("index.html loads the shared session keeper before factsheet_edit.js",
  /<script src="\.\.\/cpl_session\.js"><\/script>/.test(HTML) &&
  HTML.indexOf('../cpl_session.js') < HTML.indexOf('./factsheet_edit.js'));
check("the keeper is inert without a session (reads storage, never mints one)",
  /function readShared/.test(KEEPER) && !/create_user/.test(KEEPER));

// ── (d) the reveal is presentation, never the gate ──
check("writes still travel under a session token, not the reveal flag",
  /Authorization: 'Bearer ' \+ s\.access_token/.test(SRC));
check("the reveal flag is never consulted by the auth helpers",
  !/_revealed/.test(SRC.slice(SRC.indexOf("function authHeaders"))) );
check("the module documents that hiding is not security",
  /PRESENTATION, NOT SECURITY/.test(SRC));

// ── behaviour in jsdom ──
const BASE = "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/";
function loadDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: "outside-only", url: opts.url || BASE });
  const w = dom.window;
  w.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
  };
  if (opts.session) {
    // A shape-valid JWT — getSession() parses the payload, it does not verify it.
    const payload = Buffer.from(JSON.stringify({
      email: "curator@example.org", exp: Math.floor(Date.now() / 1000) + 3600
    })).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({
      access_token: "aaaa." + payload + ".bbbb", refresh_token: "r", email: "curator@example.org"
    }));
  }
  w.eval(SRC);
  // jsdom fires DOMContentLoaded during construction, before our eval — so the
  // deferred boot listener never runs here (the real page boots from its own
  // end-of-body script tag).
  if (w.CPL_FACTSHEET_EDIT) w.CPL_FACTSHEET_EDIT.boot();
  return dom;
}
function btnOf(dom) { return dom.window.document.getElementById("btn-curate"); }

// (b1) an anonymous visitor: no button.
const anon = loadDom();
check("anonymous visitor: button stays hidden", btnOf(anon).hidden === true);
check("anonymous visitor: isRevealed() is false", anon.window.CPL_FACTSHEET_EDIT.isRevealed() === false);

// (b2) a signed-in reviewer: button, no switch needed.
const signedIn = loadDom({ session: true });
check("signed-in reviewer: button is revealed", btnOf(signedIn).hidden === false);
check("signed-in reviewer: label is the idle '✎ Curate'", /Curate/.test(btnOf(signedIn).textContent));

// (b3) ?curate=1 with NO session — the escape hatch that keeps sign-in reachable.
const revealed = loadDom({ url: BASE + "?curate=1" });
check("?curate=1 without a session: button is revealed", btnOf(revealed).hidden === false);
check("?curate=1 without a session: still NOT a reviewer (sign-in is still required)",
  revealed.window.CPL_FACTSHEET_EDIT.isReviewer() === false);

// (c) the switch is stripped from the address bar, and other params survive.
check("?curate=1 is stripped from the URL", revealed.window.location.search.indexOf("curate") === -1);
const withOther = loadDom({ url: BASE + "?curate=1&utm_source=email" });
check("stripping keeps unrelated params", /utm_source=email/.test(withOther.window.location.search) &&
  withOther.window.location.search.indexOf("curate") === -1);
const API0 = anon.window.CPL_FACTSHEET_EDIT;
check("stripCurate('?curate=1') → ''", API0.stripCurate("?curate=1") === "");
check("stripCurate('') → ''", API0.stripCurate("") === "");

// the unlock is remembered per browser, and ?curate=0 forgets it.
check("?curate=1 remembers the unlock in localStorage",
  revealed.window.localStorage.getItem("cpl_fs_curate") === "1");
const remembered = new JSDOM(HTML, { runScripts: "outside-only", url: BASE });
remembered.window.localStorage.setItem("cpl_fs_curate", "1");
remembered.window.fetch = function () {
  return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
};
remembered.window.eval(SRC);
remembered.window.CPL_FACTSHEET_EDIT.boot();
check("a remembered unlock reveals it on a later plain visit", btnOf(remembered).hidden === false);

const forgotten = new JSDOM(HTML, { runScripts: "outside-only", url: BASE + "?curate=0" });
forgotten.window.localStorage.setItem("cpl_fs_curate", "1");
forgotten.window.fetch = function () {
  return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
};
forgotten.window.eval(SRC);
forgotten.window.CPL_FACTSHEET_EDIT.boot();
check("?curate=0 forgets the unlock and re-hides", btnOf(forgotten).hidden === true &&
  forgotten.window.localStorage.getItem("cpl_fs_curate") === null);

// the keeper's announcement reveals the button without a reload.
const late = loadDom();
check("before the announcement: still hidden", btnOf(late).hidden === true);
const payload = Buffer.from(JSON.stringify({
  email: "curator@example.org", exp: Math.floor(Date.now() / 1000) + 3600
})).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
late.window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "aaaa." + payload + ".bbbb", refresh_token: "r", email: "curator@example.org"
}));
late.window.dispatchEvent(new late.window.CustomEvent("cpl-session-changed", { detail: { signedIn: true } }));
check("a session arriving in another tab reveals it without a reload", btnOf(late).hidden === false);

// a private-mode browser (no localStorage) must still honour ?curate=1 for the pageview.
const priv = new JSDOM(HTML, { runScripts: "outside-only", url: BASE + "?curate=1" });
Object.defineProperty(priv.window, "localStorage", {
  get: function () { throw new Error("localStorage is disabled"); }
});
priv.window.fetch = function () {
  return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
};
let privThrew = false;
try {
  priv.window.eval(SRC);
  priv.window.CPL_FACTSHEET_EDIT.boot();
} catch (e) { privThrew = true; }
check("no localStorage: does not throw", !privThrew);
check("no localStorage: ?curate=1 still reveals for this pageview", !privThrew && btnOf(priv).hidden === false);

// ── report ──
let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
}
console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
