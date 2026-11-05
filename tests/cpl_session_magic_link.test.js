// The magic link's landing (cpl_session.js consumeAuthHash).
//
// A magic link opens index.html#access_token=…&refresh_token=…&expires_in=… in a
// new browser tab. Until SkyJujube (2026-11-04) unified_courses.js turned that
// fragment into the session, at load, for every COBI tab: the hidden Common
// Course Reference held every sign-in, and it is due to retire into COCI
// Lookup's Courses List. The landing now lives in the shared keeper.
//
// WHAT THIS GUARDS:
//   (A) the link becomes the session both stores read (this tab's and the shared
//       one), with the email from the token and the refresh token kept;
//   (B) the person lands on the tab they signed in from, and the token leaves
//       the address bar; with nothing stashed the address is left bare (home),
//       never the Common Course Reference;
//   (C) a garbled token is refused, so a stray fragment never reads as signed in;
//   (D) a redirect that already carried a hash (#cpl-news#access_token=…) parses;
//   (E) ⭐ ONE reader: no other file still lands the link, so deleting the old tab
//       cannot take signing in with it.
//
// Run from repo root: `npm test` (or `node tests/cpl_session_magic_link.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const src = fs.readFileSync("cpl_session.js", "utf8");

function b64url(o) { return Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_"); }
const JWT = b64url({ alg: "HS256", typ: "JWT" }) + "." + b64url({ email: "curator@rccd.edu", sub: "u1" }) + ".c2ln";

// One browser tab landing on `hash`, with an optional stash left by the tab that asked for the link.
function land(hash, stash) {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window;
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  const local = {}, per = {};
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  if (stash) local.cpl_sb_return_tab = JSON.stringify({ tab: stash, at: Date.now() });
  w.fetch = () => Promise.resolve({ ok: false, status: 400 });
  w.__events = [];
  w.addEventListener("cpl-session-changed", (e) => w.__events.push(e.detail));
  w.eval(src);
  return { w, local, per };
}
function json(s) { try { return JSON.parse(s); } catch (e) { return null; } }

(function () {
  const frag = "#access_token=" + JWT + "&refresh_token=r1&expires_in=3600&token_type=bearer";

  // ── (A) and (B): a link asked for from Memory ────────────────────────────
  {
    const { w, local, per } = land(frag, "memory");
    const mine = json(per.cpl_sb), shared = json(local.cpl_sb);
    check("(A) ⭐ the link becomes this tab's session", !!mine && mine.access_token === JWT, per.cpl_sb);
    check("(A) …and the shared one, so every other tab picks it up", !!shared && shared.access_token === JWT, local.cpl_sb);
    check("(A) the email is read from the token", mine && mine.email === "curator@rccd.edu", mine && mine.email);
    check("(A) the refresh token is kept, so the session renews without another email", mine && mine.refresh_token === "r1");
    check("(A) it expires about an hour out", mine && mine.exp > Date.now() + 3500000 && mine.exp < Date.now() + 3700000);
    check("(B) ⭐ the person lands on the tab they signed in from", w.location.hash === "#memory", w.location.hash);
    check("(B) the token leaves the address bar", w.location.href.indexOf("access_token") < 0, w.location.href);
    check("(B) the keeper says where it returned", w.CPL_SESSION.returnedTo() === "memory");
    check("(B) the stash is taken, so the next arrival is not sent there", !("cpl_sb_return_tab" in local));
    check("(A) the tabs hear the sign-in", w.__events.some((d) => d && d.signedIn && d.email === "curator@rccd.edu"));
    check("(A) CPL_SESSION.get() reads the new session", (w.CPL_SESSION.get() || {}).access_token === JWT);
  }

  // ── (B) nothing stashed: home, never the Common Course Reference ─────────
  {
    const { w, per } = land(frag, null);
    check("(B) with no stash the session still lands", !!json(per.cpl_sb));
    check("(B) ⭐ …and the address is left bare, so tabs.js opens home", w.location.hash === "", w.location.hash);
    check("(B) returnedTo is null", w.CPL_SESSION.returnedTo() === null);
  }

  // ── (C) a garbled token is refused ───────────────────────────────────────
  {
    const { w, per, local } = land("#access_token=not-a-token…&expires_in=3600", "memory");
    check("(C) ⭐ a garbled token never becomes a session", !per.cpl_sb && !local.cpl_sb, per.cpl_sb);
    check("(C) …and the stash is left for a real arrival", "cpl_sb_return_tab" in local);
    check("(C) returnedTo stays null", w.CPL_SESSION.returnedTo() === null);
  }

  // ── (D) a redirect that already carried a hash ───────────────────────────
  {
    const { w, per } = land("#cpl-news" + frag, "cpl-news");
    check("(D) #cpl-news#access_token=… still parses", (json(per.cpl_sb) || {}).access_token === JWT, per.cpl_sb);
    check("(D) …and returns to the news", w.location.hash === "#cpl-news", w.location.hash);
  }

  // ── (F) ⭐ back to the VIEW, not just the tab ─────────────────────────────
  // Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view
  // they logged in from". The stash is written in one browser tab and read where the link lands, in another.
  function stashFrom(hash, name) {
    const { w, local } = land(hash, null);
    w.CPL_SESSION.stashReturnTab(name);
    return json(local.cpl_sb_return_tab) || {};
  }
  {
    const st = stashFrom("#exhibits/list/left", "exhibits");
    check("(F) ⭐ signing in on Exhibits' List, filter left, stashes that view", st.tab === "exhibits/list/left", st.tab);
    const { w } = land(frag, st.tab);
    check("(F) ⭐ …and the link lands on it", w.location.hash === "#exhibits/list/left", w.location.hash);
    check("(F) a Progress page returns to itself", stashFrom("#coci-lookup/progress", "coci-lookup").tab === "coci-lookup/progress");
    check("(F) a tab named in the address with no view keeps its name", stashFrom("#canonical-subj4", "canonical-subj4").tab === "canonical-subj4");
    check("(F) a name that is not the tab in the address is kept as given",
      stashFrom("#memory", "dashboard").tab === "dashboard");
    check("(F) a longer tab name sharing the prefix is not taken for the view",
      stashFrom("#exhibits-old/list", "exhibits").tab === "exhibits");
    check("(F) home (no address) keeps the name", stashFrom("", "dashboard").tab === "dashboard");
  }

  // ── (E) one reader ───────────────────────────────────────────────────────
  {
    check("(E) the keeper lands the link before its first tick",
      /consumeAuthHash\(\);\s*\n\s*start\(\);/.test(src));
    const uc = fs.readFileSync("unified_courses.js", "utf8");
    check("(E) ⭐ the old Common Course Reference tab no longer lands the link",
      !/indexOf\(\s*["']access_token=/.test(uc) && !/consumeAuthHash/.test(uc));
    check("(E) a curator who signed in there still returns to its list",
      /stashReturnTab\("unified-courses"\)/.test(uc) && /split\("\/"\)\[0\] === "unified-courses"/.test(uc));
    // cpl_news.js keeps its own capture for the lazy news view; it runs only after the keeper, on a hash already read.
    const readers = fs.readdirSync(".").filter((f) => /\.js$/.test(f) && f !== "cpl_session.js" && f !== "cpl_news.js")
      .filter((f) => /indexOf\(\s*["']access_token=["']\s*\)/.test(fs.readFileSync(f, "utf8")));
    check("(E) no other COBI file reads the link's fragment", readers.length === 0, readers.join(", "));
    const html = fs.readFileSync("CPL_Dashboard.html", "utf8");
    const iS = html.indexOf('<script src="cpl_session.js">'), iT = html.indexOf('<script src="tabs.js">');
    check("(E) cpl_session.js loads before tabs.js, so the first tab opened is the return tab", iS > 0 && iT > iS);
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
