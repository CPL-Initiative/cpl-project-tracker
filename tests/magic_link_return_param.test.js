// The magic link returns to the view it was asked from when it opens in another browser (Sam, 2026-11-26, on his
// phone: the link "takes me to COBI dashboard and no way to navigate to the tool").
//
// The link opens in whatever browser the mail app picks; a private tab or another browser shares no storage with the
// tab that asked for it, so the stash (cpl_sb_return_tab) is never seen there and the landing fell back to home.
// sendLink now carries the address in the link (?cpl_return=), and consumeAuthHash reads it when no stash answers.
//
// WHAT THIS GUARDS:
//   (A) ⭐ with no stash, ?cpl_return= routes the landing to that view, and the parameter leaves the address bar;
//   (B) a stash still wins over the parameter (the same-browser flow is unchanged);
//   (C) a parameter that is not a plain view address is refused (no script or other site rides in);
//   (D) reviewer_signin.js puts the address into the link's redirect_to.
//
// Run from repo root: `npm test` (or `node tests/magic_link_return_param.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const src = fs.readFileSync("cpl_session.js", "utf8");

function b64url(o) { return Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_"); }
const JWT = b64url({ alg: "HS256", typ: "JWT" }) + "." + b64url({ email: "curator@rccd.edu", sub: "u1" }) + ".c2ln";


const tok = "#access_token=" + JWT + "&refresh_token=r1&expires_in=3600";
function landAt(search, hash, stash) {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + search + hash });
  const w = dom.window;
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  const local = {};
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag({}), configurable: true });
  if (stash) local.cpl_sb_return_tab = JSON.stringify({ tab: stash, at: Date.now() });
  w.fetch = () => Promise.resolve({ ok: false, status: 400 });
  w.eval(src);
  if (w.CPL_SESSION && w.CPL_SESSION.consumeAuthHash) w.CPL_SESSION.consumeAuthHash();
  return w;
}
{
  const w = landAt("?cpl_return=" + encodeURIComponent("commons/subjects/rapid"), tok);
  check("⭐ (A) no stash: the link's cpl_return routes the landing to the view", w.location.hash === "#commons/subjects/rapid", w.location.href);
  check("(A) the parameter and the token leave the address bar", w.location.search === "" && !/access_token/.test(w.location.href), w.location.href);
}
{
  const w = landAt("?cpl_return=" + encodeURIComponent("commons/subjects/rapid"), tok, "library");
  check("(B) a stash still wins over the parameter", w.location.hash === "#library", w.location.href);
}
{
  const w = landAt("?cpl_return=" + encodeURIComponent("javascript:alert(1)"), tok);
  check("(C) an address that is not a plain view is refused", w.location.hash === "" || w.location.hash === "#", w.location.href);
  const w2 = landAt("?cpl_return=" + encodeURIComponent("//evil.example/x"), tok);
  check("(C) a leading slash is refused too", !/evil/.test(w2.location.hash), w2.location.href);
}
{
  const rs = fs.readFileSync("reviewer_signin.js", "utf8");
  check("(D) reviewer_signin.js carries the address in redirect_to", /\?cpl_return=" \+ encodeURIComponent\(addr\)/.test(rs) && /CPL_SESSION\.returnAddress\(back\)/.test(rs));
}
let fail = 0;
for (const [name, ok, why] of results) { console.log((ok ? "ok   " : "FAIL ") + name + (ok || !why ? "" : "\n       " + why)); if (!ok) fail++; }
console.log("\nmagic_link_return_param.test.js: " + (results.length - fail) + "/" + results.length + " checks passed");
process.exit(fail ? 1 : 0);
