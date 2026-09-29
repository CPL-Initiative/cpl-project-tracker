// Shared reviewer (magic-link) sign-in — jsdom test.
//
// Sam, 2026-08-14: "I tried using the magic link login on RACI tab but it only
// has the team phrase input now, so I can't edit the new Admin tab." Then:
// "Might be better to keep the Admin log in link in the About drop down on
// COBI … Since Admin supersedes RACI."
//
// THE BUG THIS PINS DOWN was a pointer, not a permission. raci.js still carried
// a complete signIn() whose button had been removed, so the function had NO
// caller — while admin.js told anyone landing there signed-out to "sign in with
// a magic link on the Team & RACI tab, then re-open this tab". Admin is
// reviewer-ONLY, so the team phrase could never have opened it either: the one
// documented route in was an instruction that could not be carried out.
//
// Guards, each one a way this can silently regress:
//  (a) the PRE-FIX defect itself — Admin must not send anyone to RACI for a
//      credential RACI does not offer, and RACI must not keep a signIn() that
//      nothing calls (dead code an instruction points at reads as a live path);
//  (b) the control reaches the About panel, so it is available from EVERY tab —
//      the discoverability failure is what Sam actually hit;
//  (c) Admin mounts THE SAME control inline (no second sign-in box to drift),
//      so a reviewer signs in where they are instead of being bounced;
//  (d) ⚠ a send is confirmed on res.ok ONLY, and a failed send KEEPS the typed
//      address — an unconditional "check your email" leaves someone waiting for
//      mail that was never sent (the Sky155 send-note defect);
//  (e) the current tab is stashed in cpl_sb_return_tab so the callback returns
//      you where you were, not to some other tab's idea of home;
//  (f) ⚠ SIGNED IN IS NOT REVIEWER — the OTP endpoint mints a session for any
//      address; only RLS decides. The control must never claim the role;
//  (g) both HTMLs load it (Rule 4).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("reviewer_signin.js", "utf8");
const ADMIN = fs.readFileSync("admin.js", "utf8");
const RACI = fs.readFileSync("raci.js", "utf8");

// Minimal COBI shell: the About panel is the mount target.
function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body>' +
    '<div class="header"><div class="cobi-brand"></div>' +
    '<span class="cobi-about"><div class="cobi-about-panel" id="cobiAboutPanel">' +
    '<h4>About COBI</h4><div class="cobi-about-links"></div></div></span></div>' +
    '<div id="admin-root"></div></body></html>',
    { url: "https://example.org/dash.html", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.session) w.sessionStorage.setItem("cpl_sb", JSON.stringify(opts.session));
  w.CPL_TABS = { current: function () { return opts.tab || "governance"; } };
  // Record every OTP request so we can assert on the stashed return tab.
  w.__sent = [];
  w.fetch = function (url, init) {
    w.__sent.push({ url: url, init: init });
    if (opts.fetchThrows) return Promise.reject(new Error("boom"));
    return Promise.resolve({ ok: opts.sendOk !== false, status: opts.status || (opts.sendOk === false ? 429 : 200) });
  };
  w.eval(SRC);
  // jsdom is still "loading" when we eval, so the module defers to
  // DOMContentLoaded exactly as it does in a browser. Fire it, so these tests
  // exercise the REAL boot path rather than reaching past it to mountAbout().
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return w;
}
const tick = () => new Promise(function (r) { setTimeout(r, 0); });
const FRESH = { access_token: "aaa.bbb.ccc", refresh_token: "r", email: "map@rccd.edu", exp: Date.now() + 3600000 };

(async function () {
  // ── (a) the PRE-FIX defect: a pointer at a route that does not exist ──────
  {
    check("admin.js no longer sends people to Team & RACI to sign in",
      !/magic link on the\s*'?\s*\+?\s*"?<b>Team &amp; RACI<\/b> tab/.test(ADMIN)
      && !/<b>Team &amp; RACI<\/b> tab using an address/.test(ADMIN));
    check("…and Admin offers the sign-in on its own signed-out screen",
      /adm-signin/.test(ADMIN) && /CPL_REVIEWER_SIGNIN\.mountInto/.test(ADMIN));
    check("…naming About as the everywhere-route",
      /About<\/b> in the header/.test(ADMIN));
    // raci.js kept a full magic-link implementation with no caller. Assert both
    // halves: the definition is gone AND nothing calls it.
    check("raci.js no longer defines a signIn() (it had no caller)",
      !/function signIn\s*\(/.test(RACI));
    check("…and raci.js no longer posts to the OTP endpoint",
      !/auth\/v1\/otp/.test(RACI));
    check("…RACI points at the personal sign-in instead of dropping the subject",
      /raci-auth-hint/.test(RACI) && /About/.test(RACI));
  }

  // ── (b) it reaches the About panel, from every tab ────────────────────────
  {
    const w = makeWin({});
    const host = w.document.querySelector("#cobiAboutPanel .cobi-rsi-host");
    check("About panel gets the sign-in control", !!host);
    check("…with an email box and a send button",
      !!(host && host.querySelector("[data-rsi-email]") && host.querySelector("[data-rsi-send]")));
    check("…it does not disturb the existing About links",
      !!w.document.querySelector("#cobiAboutPanel .cobi-about-links"));
    check("mountAbout() is idempotent — re-init does not stack a second box",
      (w.CPL_REVIEWER_SIGNIN.mountAbout(), w.CPL_REVIEWER_SIGNIN.mountAbout(),
        w.document.querySelectorAll("#cobiAboutPanel .cobi-rsi-host").length === 1));
    check("…and re-mounting the same element keeps ONE mount record",
      w.CPL_REVIEWER_SIGNIN._mounts().length === 1);
  }

  // ── (c) one implementation, mounted in more than one place ───────────────
  {
    const w = makeWin({});
    const el = w.document.getElementById("admin-root");
    w.CPL_REVIEWER_SIGNIN.mountInto(el, { title: "Sign in", returnTab: "admin" });
    check("mountInto() renders the same control elsewhere (Admin's inline mount)",
      !!el.querySelector("[data-rsi-email]") && !!el.querySelector("[data-rsi-send]"));
    check("…and both mounts are tracked", w.CPL_REVIEWER_SIGNIN._mounts().length === 2);
  }

  // ── (d) a send is confirmed ONLY when it succeeded ───────────────────────
  {
    const w = makeWin({ sendOk: true });
    const host = w.document.querySelector(".cobi-rsi-host");
    host.querySelector("[data-rsi-email]").value = "map@rccd.edu";
    host.querySelector("[data-rsi-email]").dispatchEvent(new w.Event("input"));
    host.querySelector("[data-rsi-send]").click();
    await tick(); await tick();
    const msg = host.querySelector("[data-rsi-msg]");
    check("a successful send says to check your email", /check your email/i.test(msg.textContent));
    check("…and marks it ok, not an error", /\bok\b/.test(msg.className));
    check("…and it actually called the OTP endpoint once",
      w.__sent.length === 1 && /auth\/v1\/otp/.test(w.__sent[0].url));
  }
  {
    // ⚠ THE ONE THAT ROTS SILENTLY. A non-ok response must NOT be thanked for.
    const w = makeWin({ sendOk: false, status: 429 });
    const host = w.document.querySelector(".cobi-rsi-host");
    const input = host.querySelector("[data-rsi-email]");
    input.value = "map@rccd.edu";
    input.dispatchEvent(new w.Event("input"));
    host.querySelector("[data-rsi-send]").click();
    await tick(); await tick();
    const msg = host.querySelector("[data-rsi-msg]");
    check("a FAILED send is never reported as sent", !/check your email/i.test(msg.textContent));
    check("…it says it could not send, with the status", /could not send/i.test(msg.textContent) && /429/.test(msg.textContent));
    check("…it is marked as an error", /err/.test(msg.className));
    check("…and the typed address is KEPT so it need not be retyped",
      host.querySelector("[data-rsi-email]").value === "map@rccd.edu");
  }
  {
    // A thrown fetch (offline) is the same promise: never a success line.
    const w = makeWin({ fetchThrows: true });
    const host = w.document.querySelector(".cobi-rsi-host");
    host.querySelector("[data-rsi-email]").value = "map@rccd.edu";
    host.querySelector("[data-rsi-email]").dispatchEvent(new w.Event("input"));
    host.querySelector("[data-rsi-send]").click();
    await tick(); await tick();
    const msg = host.querySelector("[data-rsi-msg]");
    check("an offline send reports a failure, not a sent link", !/check your email/i.test(msg.textContent));
    check("…and keeps the address", host.querySelector("[data-rsi-email]").value === "map@rccd.edu");
    check("…and re-enables the button so it can be retried",
      host.querySelector("[data-rsi-send]").disabled === false);
  }
  {
    const w = makeWin({});
    const host = w.document.querySelector(".cobi-rsi-host");
    host.querySelector("[data-rsi-send]").click();
    await tick();
    check("an empty address asks for one and sends nothing",
      /enter your email/i.test(host.querySelector("[data-rsi-msg]").textContent) && w.__sent.length === 0);
  }

  // ── (e) come back where you were ─────────────────────────────────────────
  {
    const w = makeWin({ tab: "admin" });
    const host = w.document.querySelector(".cobi-rsi-host");
    host.querySelector("[data-rsi-email]").value = "map@rccd.edu";
    host.querySelector("[data-rsi-email]").dispatchEvent(new w.Event("input"));
    host.querySelector("[data-rsi-send]").click();
    await tick();
    check("the CURRENT tab is stashed for the magic-link callback",
      w.sessionStorage.getItem("cpl_sb_return_tab") === "admin");
    check("…and the redirect_to is the page itself, no hash",
      /redirect_to=https%3A%2F%2Fexample\.org%2Fdash\.html/.test(w.__sent[0].url));
  }
  {
    const w = makeWin({ tab: "governance" });
    const el = w.document.getElementById("admin-root");
    w.CPL_REVIEWER_SIGNIN.mountInto(el, { returnTab: "admin" });
    el.querySelector("[data-rsi-email]").value = "map@rccd.edu";
    el.querySelector("[data-rsi-email]").dispatchEvent(new w.Event("input"));
    el.querySelector("[data-rsi-send]").click();
    await tick();
    check("an explicit returnTab wins over the live tab (Admin's inline mount)",
      w.sessionStorage.getItem("cpl_sb_return_tab") === "admin");
  }

  // ── (f) signed in is NOT the same as reviewer ────────────────────────────
  {
    const w = makeWin({ session: FRESH });
    const host = w.document.querySelector(".cobi-rsi-host");
    check("a live session shows who you are", /map@rccd\.edu/.test(host.textContent));
    check("…and offers a way out", !!host.querySelector("[data-rsi-signout]"));
    check("…and does NOT ask you to sign in again", !host.querySelector("[data-rsi-email]"));
    // The OTP endpoint mints a session for ANY address; RLS decides the rest.
    check("⚠ it never claims you are a reviewer — RLS decides that",
      !/\breviewer\b/i.test(host.textContent));
    host.querySelector("[data-rsi-signout]").click();
    check("signing out drops the session", w.sessionStorage.getItem("cpl_sb") === null);
    check("…and the box comes back", !!w.document.querySelector(".cobi-rsi-host [data-rsi-email]"));
  }
  {
    // A garbled or expired-without-refresh session must read as signed OUT
    // rather than rendering a stale identity that cannot actually write.
    const w = makeWin({ session: { access_token: "not-a-jwt", email: "x@y.z" } });
    check("a malformed session renders as signed out",
      !!w.document.querySelector(".cobi-rsi-host [data-rsi-email]"));
    check("…and is cleared rather than left to fail on the next write",
      w.sessionStorage.getItem("cpl_sb") === null);
    const w2 = makeWin({ session: { access_token: "aaa.bbb.ccc", email: "x@y.z", exp: Date.now() - 1000 } });
    check("an expired session with no refresh_token renders as signed out",
      !!w2.document.querySelector(".cobi-rsi-host [data-rsi-email]"));
  }

  // ── the fail-safe: a missing About panel must not throw ──────────────────
  {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>',
      { url: "https://example.org/", runScripts: "dangerously" });
    let threw = false;
    try { dom.window.eval(SRC); } catch (e) { threw = true; }
    check("no About panel (e.g. the standalone Fact Sheet) does not throw", !threw);
    check("…and the module still exposes its API", !!dom.window.CPL_REVIEWER_SIGNIN);
  }

  // ── (g) Rule 4 — both HTMLs, byte-identical ──────────────────────────────
  {
    const a = fs.readFileSync("index.html", "utf8");
    const b = fs.readFileSync("CPL_Dashboard.html", "utf8");
    check("index.html loads reviewer_signin.js", /<script src="reviewer_signin\.js"><\/script>/.test(a));
    check("CPL_Dashboard.html loads it too (Rule 4)", /<script src="reviewer_signin\.js"><\/script>/.test(b));
    check("…and the two HTMLs are identical", a === b);
    check("…loaded after team_phrase_header.js, before the tab scripts",
      a.indexOf("team_phrase_header.js") < a.indexOf("reviewer_signin.js"));
  }

  let failed = 0;
  results.forEach(function (x) {
    console.log((x[1] ? "PASS " : "FAIL ") + x[0]);
    if (!x[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error("FATAL", e); process.exit(1); });
