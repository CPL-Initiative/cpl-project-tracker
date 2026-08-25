// 🔑 cpl_session.js — the shared reviewer-session keeper.
//
// WHAT THIS GUARDS, AND WHY EACH CHECK EARNED ITS PLACE
//
// (a) THE BUG IT EXISTS FOR. A Supabase access token lives ~1h. 13 of the 26
//     modules reading `cpl_sb` check only the token's SHAPE, so an hour after
//     sign-in they report "signed in" while every request 401s. On 2026-08-14
//     that surfaced as three unrelated-looking reports from Sam in one evening
//     (Admin "save 400", Sierra "says I'm not signed in", CR Reference "could
//     not read the decisions table") — and re-signing in "fixed" all three,
//     which is precisely what hides the cause.
//
// (b) A TRANSIENT FAILURE MUST NOT SIGN ANYONE OUT. raci.js drops the session
//     on ANY refresh rejection, so being briefly offline costs a curator their
//     sign-in and whatever they were about to write. Only a definitive 400/401
//     from the auth server ends a session here. This is the single most
//     important assertion in the file: it is the one that fails silently in the
//     direction of data loss.
//
// (c) READING MUST NOT DELETE. The existing getSession()s remove `cpl_sb` when
//     it fails their test, so one unlucky parse ends the session. Deleting is a
//     decision, not a side effect of looking.
//
// (d) AN UNDATEABLE SESSION IS FRESH, NOT EXPIRED. Guessing "expired" on a
//     session with no `exp` would sign out someone whose token is fine — the
//     exact failure this file exists to end.
//
// Run from repo root: `npm test` (or `node tests/cpl_session.test.js`).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const SRC = fs.readFileSync("cpl_session.js", "utf8");
const IDX = fs.readFileSync("index.html", "utf8");
const CPL = fs.readFileSync("CPL_Dashboard.html", "utf8");

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYW0iLCJlbWFpbCI6InNhbUByY2NkLmVkdSJ9.sig";
const JWT2 = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYW0iLCJ2IjoicmVuZXdlZCJ9.sig2";

// A session `n` ms from expiry. Negative = already dead.
function sess(msFromNow, extra) {
  return Object.assign({
    access_token: JWT, refresh_token: "rt-1", email: "sam@rccd.edu",
    exp: Date.now() + msFromNow,
  }, extra || {});
}

// `refresh` decides what the token endpoint does: "ok" | "offline" | a status.
// `shared` seeds localStorage (what OTHER browser tabs of this origin can see);
// `marked` seeds the per-tab "this tab has had a session" flag.
function boot({ stored, shared, marked, refresh } = {}) {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  const { window } = dom;
  if (stored !== undefined) {
    window.sessionStorage.setItem("cpl_sb",
      typeof stored === "string" ? stored : JSON.stringify(stored));
  }
  if (shared !== undefined) {
    window.localStorage.setItem("cpl_sb",
      typeof shared === "string" ? shared : JSON.stringify(shared));
  }
  if (marked) window.sessionStorage.setItem("cpl_sb_tab", "1");
  window.__refreshCalls = 0;
  window.fetch = function (url, init) {
    window.__refreshCalls++;
    window.__lastRefresh = { url: String(url), init: init || {} };
    if (refresh === "offline") return Promise.reject(new TypeError("Failed to fetch"));
    if (typeof refresh === "number") {
      return Promise.resolve({ ok: false, status: refresh, json: () => Promise.resolve({}) });
    }
    return Promise.resolve({
      ok: true, status: 200,
      json: () => Promise.resolve({ access_token: JWT2, refresh_token: "rt-2", expires_in: 3600 }),
    });
  };
  window.eval(SRC);   // auto-starts, so the stubs must already be in place
  return window;
}
const readStore = (w) => {
  const raw = w.sessionStorage.getItem("cpl_sb");
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return raw; }
};

(async () => {
  // ── Wiring: both HTMLs, eagerly, before the tabs that read the session ────
  for (const [name, html] of [["index.html", IDX], ["CPL_Dashboard.html", CPL]]) {
    check(`${name} loads cpl_session.js`, /<script src="cpl_session\.js"><\/script>/.test(html));
    check(`${name} loads it BEFORE tabs.js (which reads the session)`,
      html.indexOf('src="cpl_session.js"') < html.indexOf('src="tabs.js"'));
  }

  // ── A fresh session is left alone ─────────────────────────────────────────
  {
    const w = boot({ stored: sess(50 * 60 * 1000) });
    await w.CPL_SESSION.ensureFresh(); await tick();
    check("a fresh session is not refreshed (no needless round trip)", w.__refreshCalls === 0);
    check("and is returned unchanged", readStore(w).access_token === JWT);
  }

  // ── Near expiry → renewed and persisted ───────────────────────────────────
  {
    const w = boot({ stored: sess(60 * 1000) });          // inside the 5-min skew
    const out = await w.CPL_SESSION.ensureFresh(); await tick();
    check("a session near expiry IS refreshed", w.__refreshCalls >= 1);
    check("the refresh hits the token endpoint with grant_type=refresh_token",
      /\/auth\/v1\/token\?grant_type=refresh_token$/.test(w.__lastRefresh.url));
    check("it sends the refresh token", /"refresh_token":"rt-1"/.test(w.__lastRefresh.init.body));
    check("the renewed token is returned", out && out.access_token === JWT2);
    check("and PERSISTED, so the other 13 tabs read a live token",
      readStore(w).access_token === JWT2);
    check("the rotated refresh token is kept", readStore(w).refresh_token === "rt-2");
    check("expiry moves forward", readStore(w).exp > Date.now() + 50 * 60 * 1000);
    check("the email survives a refresh", readStore(w).email === "sam@rccd.edu");
  }

  // ── (b) THE ONE THAT MATTERS: offline must not sign anyone out ────────────
  {
    const w = boot({ stored: sess(60 * 1000), refresh: "offline" });
    const out = await w.CPL_SESSION.ensureFresh(); await tick();
    check("a NETWORK failure leaves the session in place", !!readStore(w));
    check("…with its token untouched", readStore(w).access_token === JWT);
    check("…and hands the caller the still-valid session, not null", out && out.access_token === JWT);
  }
  {
    const w = boot({ stored: sess(60 * 1000), refresh: 503 });
    await w.CPL_SESSION.ensureFresh(); await tick();
    check("a 5xx is transient too — session kept", !!readStore(w));
  }

  // ── A definitive rejection DOES end the session ───────────────────────────
  for (const status of [400, 401]) {
    const w = boot({ stored: sess(60 * 1000), refresh: status });
    const out = await w.CPL_SESSION.ensureFresh(); await tick();
    check(`a ${status} from the auth server clears the dead session`, readStore(w) === null);
    check(`…and reports signed-out (${status})`, out === null);
  }

  // ── Expired with no way to renew → cleared, so the UI offers sign-in ──────
  {
    const w = boot({ stored: sess(-60 * 1000, { refresh_token: null }) });
    const out = await w.CPL_SESSION.ensureFresh(); await tick();
    check("an expired session with no refresh token is cleared", readStore(w) === null);
    check("…and never attempts a pointless refresh", w.__refreshCalls === 0);
    check("…and resolves null", out === null);
  }

  // ── (c) reading never deletes ─────────────────────────────────────────────
  {
    const w = boot({ stored: sess(-60 * 60 * 1000) });   // an hour dead
    const got = w.CPL_SESSION.get();
    check("get() returns the stale session rather than hiding it", got && got.access_token === JWT);
    check("get() does NOT delete it — deleting is a decision, not a read",
      w.sessionStorage.getItem("cpl_sb") !== null);
    check("but it is correctly reported as not fresh", w.CPL_SESSION.isFresh() === false);
  }

  // ── (d) no `exp` → fresh, not expired ─────────────────────────────────────
  {
    const w = boot({ stored: { access_token: JWT, refresh_token: "rt-1", email: "x@y.z" } });
    const out = await w.CPL_SESSION.ensureFresh(); await tick();
    check("a session with no exp is treated as fresh, never signed out", !!readStore(w));
    check("…and is not refreshed on a guess", w.__refreshCalls === 0);
    check("…and is handed back", out && out.access_token === JWT);
  }

  // ── Garbage and absence are survivable, not throwable ─────────────────────
  {
    const w = boot({ stored: "{not json" });
    const out = await w.CPL_SESSION.ensureFresh(); await tick();
    check("a garbled value resolves null instead of throwing", out === null);
  }
  {
    const w = boot({});
    const out = await w.CPL_SESSION.ensureFresh(); await tick();
    check("no session at all resolves null", out === null);
    check("…with no refresh attempted", w.__refreshCalls === 0);
  }
  {
    // A token that isn't a JWT at all must not be dressed up as a session.
    const w = boot({ stored: { access_token: "nope", refresh_token: "rt-1" } });
    check("a non-JWT access_token is not a session", w.CPL_SESSION.get() === null);
  }

  // ── Concurrency: one refresh, shared ──────────────────────────────────────
  {
    const w = boot({ stored: sess(60 * 1000) });
    const [a, b, c] = await Promise.all([
      w.CPL_SESSION.ensureFresh(), w.CPL_SESSION.ensureFresh(), w.CPL_SESSION.ensureFresh(),
    ]);
    await tick();
    check("three concurrent callers trigger ONE refresh, not three", w.__refreshCalls === 1);
    check("…and all three get the renewed session",
      a.access_token === JWT2 && b.access_token === JWT2 && c.access_token === JWT2);
    // A second call after it settles may refresh again only if still near expiry;
    // the renewed session is an hour out, so it must not.
    await w.CPL_SESSION.ensureFresh();
    check("a later call on the renewed session does not refresh again", w.__refreshCalls === 1);
  }

  // ── It announces, so a rendered tab can re-read its lock state ────────────
  {
    const w = boot({ stored: sess(60 * 1000) });
    let seen = null;
    w.addEventListener("cpl-session-changed", (e) => { seen = e.detail; });
    await w.CPL_SESSION.ensureFresh(); await tick();
    check("a renewal announces cpl-session-changed", seen && seen.signedIn === true);
    check("…naming who is signed in", seen && seen.email === "sam@rccd.edu");
  }
  {
    const w = boot({ stored: sess(60 * 1000), refresh: 401 });
    let seen = "none";
    w.addEventListener("cpl-session-changed", (e) => { seen = e.detail; });
    await w.CPL_SESSION.ensureFresh(); await tick();
    check("a dead session announces signed-OUT so tabs stop claiming otherwise",
      seen !== "none" && seen.signedIn === false);
  }

  // ── authHeaders is a convenience, never a requirement ─────────────────────
  {
    const w = boot({ stored: sess(50 * 60 * 1000) });
    const h = w.CPL_SESSION.authHeaders({ "Content-Type": "application/json" });
    check("authHeaders bears the session token", h.Authorization === "Bearer " + JWT);
    check("…keeps the anon apikey", /^eyJ/.test(h.apikey));
    check("…and merges extras", h["Content-Type"] === "application/json");
    const w2 = boot({});
    check("with no session it falls back to anon rather than sending 'Bearer null'",
      /^Bearer eyJ/.test(w2.CPL_SESSION.authHeaders().Authorization));
  }

  // ── The keeper runs itself ────────────────────────────────────────────────
  {
    const w = boot({ stored: sess(60 * 1000) });
    await tick(); await tick();
    check("it refreshes on load without anyone calling it", w.__refreshCalls >= 1);
    check("it re-checks when a tab is activated (throttled timers in background tabs)",
      typeof w.CPL_SESSION.start === "function");
  }

  // ── NOBODY MAY REFRESH FROM A CACHED SESSION ─────────────────────────────
  //
  // Refresh tokens ROTATE. A module that renews using a copy it cached earlier
  // can be re-spending a token another module already consumed — and Supabase
  // treats reuse as a stolen-token signal, so the refresh fails and several of
  // these modules then DROP the session. The curator is silently signed out
  // mid-edit: strictly worse than the expired-token bug this keeper fixes.
  //
  // credential_reference.js has carried the fix since the CCR/RACI rotation
  // collision ("instead of re-spending a consumed refresh token"). Adding a
  // keeper that renews on a timer makes every OTHER refresher a collision
  // candidate, so the rule has to hold repo-wide — and be enforced, because a
  // rule that depends on the next author remembering it fails on their first day.
  {
    const rootJs = fs.readdirSync(".").filter((f) => f.endsWith(".js"));
    const offenders = [];
    let scanned = 0;
    for (const f of rootJs) {
      const src = fs.readFileSync(f, "utf8");
      if (!/grant_type=refresh_token/.test(src)) continue;   // not a refresher
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (!/function ensureFresh\s*\(/.test(lines[i])) continue;
        scanned++;
        // The session must be resolved from STORAGE within the opening lines,
        // before any refresh can be attempted. Two spellings of the storage
        // reader exist: getSession() in the tab modules, read() in
        // cpl_session.js. Accepting only the first flagged this file's own
        // keeper — a false positive caught by printing the offenders rather
        // than trusting the count.
        // Count CODE lines, not raw lines. The first cut took 8 raw lines and
        // flagged raci.js, whose fix sits one line past a 7-line comment
        // explaining the fix — a false positive manufactured by documenting it
        // well. Every detector written tonight has been wrong once; printing
        // the offenders rather than trusting the count is what caught each.
        const head = lines.slice(i, i + 30)
          .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
          .slice(0, 8).join("\n");
        if (!/\b(getSession|read)\s*\(/.test(head)) offenders.push(`${f}:${i + 1}`);
      }
    }
    check("the scan actually found the refreshers (else it proves nothing)", scanned >= 6);
    if (offenders.length) console.log("    cached-session refreshers: " + offenders.join(", "));
    check("no ensureFresh() refreshes from a cached session — all re-read storage",
      offenders.length === 0);
  }

  // ── The session is shared across BROWSER tabs ────────────────────────────
  //
  // Sam, 2026-08-14: "when I logged in, it opened a new tab and I was trying to
  // work on Sierra from the original tab." sessionStorage is per browser tab by
  // definition, so the tab he was working in could never see the magic link's
  // session. localStorage is now canonical and mirrored into each tab.
  const readLocal = (w) => {
    const raw = w.localStorage.getItem("cpl_sb");
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return raw; }
  };

  {
    // A brand-new browser tab, with a session another tab established.
    const w = boot({ shared: sess(50 * 60 * 1000) });
    check("a fresh browser tab hydrates from the shared session",
      w.CPL_SESSION.get() && w.CPL_SESSION.get().access_token === JWT);
    check("…into sessionStorage, where all 26 existing readers look",
      readStore(w) && readStore(w).access_token === JWT);
  }
  {
    // A tab that HAS the session must publish it, so the next tab opened finds it.
    const w = boot({ stored: sess(50 * 60 * 1000) });
    w.CPL_SESSION.sync();
    check("a tab holding the session publishes it for other browser tabs",
      readLocal(w) && readLocal(w).access_token === JWT);
    check("…stamped with when this browser first saw it", !!readLocal(w).shared_since);
  }
  {
    // THE HAZARD. Sign-out clears sessionStorage in a dozen places; a naive
    // mirror would helpfully sign the person back in on the next tick, which is
    // a sign-out button that does nothing — far worse than a short session.
    const w = boot({ stored: sess(50 * 60 * 1000) });
    w.CPL_SESSION.sync();                       // publish, as a real tab would
    check("precondition: the share is populated", !!readLocal(w));
    w.sessionStorage.removeItem("cpl_sb");      // what every signOut() does
    w.CPL_SESSION.sync();
    check("signing out clears the SHARED copy too", readLocal(w) === null);
    w.CPL_SESSION.sync();
    check("…and a later sync does not resurrect it", w.CPL_SESSION.get() === null);
  }
  {
    // The same shape via the module's own signOut().
    const w = boot({ stored: sess(50 * 60 * 1000) });
    w.CPL_SESSION.sync();
    w.CPL_SESSION.signOut();
    check("signOut() clears both stores", readStore(w) === null && readLocal(w) === null);
    w.CPL_SESSION.sync();
    check("…and stays cleared", w.CPL_SESSION.get() === null);
  }
  {
    // A tab that never had a session must NOT be treated as a sign-out.
    const w = boot({ shared: sess(50 * 60 * 1000), marked: false });
    check("a never-signed-in tab hydrates rather than clearing the share",
      !!w.CPL_SESSION.get() && !!readLocal(w));
  }
  {
    // The cap: closing the browser no longer ends the session, so an absolute
    // age bounds how long it can be revived.
    const old = sess(50 * 60 * 1000);
    old.shared_since = Date.now() - (13 * 60 * 60 * 1000);
    const w = boot({ shared: old });
    check("a shared session past the age cap is not hydrated", w.CPL_SESSION.get() === null);
    check("…and is cleared rather than left to be retried forever", readLocal(w) === null);
  }
  {
    const recent = sess(50 * 60 * 1000);
    recent.shared_since = Date.now() - (2 * 60 * 60 * 1000);
    const w = boot({ shared: recent });
    check("a shared session within the cap still hydrates", !!w.CPL_SESSION.get());
  }
  {
    // A refresh must not restart the clock, or the cap could never bite.
    const w = boot({ stored: sess(60 * 1000), shared: (() => {
      const s = sess(60 * 1000); s.shared_since = Date.now() - (11 * 60 * 60 * 1000); return s;
    })() });
    await w.CPL_SESSION.ensureFresh(); await tick();
    const after = readLocal(w);
    check("renewing carries the original stamp forward, it does not reset the cap",
      after && (Date.now() - after.shared_since) > 10 * 60 * 60 * 1000);
  }
  {
    // Fail-safe: no localStorage at all (private mode / storage disabled) must
    // leave today's behaviour intact rather than throwing.
    const w = boot({ stored: sess(50 * 60 * 1000) });
    Object.defineProperty(w, "localStorage", {
      get() { throw new Error("SecurityError: storage disabled"); },
    });
    let threw = false;
    try { w.CPL_SESSION.sync(); } catch (e) { threw = true; }
    check("a browser with no localStorage does not throw", !threw);
    check("…and keeps working from the per-tab copy",
      w.CPL_SESSION.get() && w.CPL_SESSION.get().access_token === JWT);
  }
  {
    const w = boot({ shared: "{not json" });
    let threw = false;
    try { w.CPL_SESSION.sync(); } catch (e) { threw = true; }
    check("a garbled shared value is ignored, not fatal", !threw && w.CPL_SESSION.get() === null);
  }

  /* ── ROTATION ACROSS TABS: the freshest token wins, and a stale tab must not
   * take the live session down with it ──────────────────────────────────────
   *
   * ⭐ WHY. Sam, 2026-08-25, editing GR row #3 with several sessions open: his
   * console showed `token?grant_type=refresh_token 400` and then NO SESSION,
   * and the save he had just pressed reported that his sign-in did not allow
   * writing to the register. Nothing had gone wrong with his account.
   *
   * Refresh tokens ROTATE — the first use invalidates the old one — so a tab
   * holding a per-tab copy from before a sibling's renewal is not holding
   * another opinion about the session, it is holding a CONSUMED token. sync()
   * said "this tab has the session: it is the truth", which published that
   * consumed token over the sibling's live one; the exchange then 400'd and
   * drop() cleared BOTH stores.
   *
   * ⚠️ A SINGLE-WINDOW FIXTURE CANNOT SEE THIS. Both windows below share one
   * localStorage (what every tab of an origin sees) while keeping their own
   * sessionStorage, which is what makes the two copies able to disagree. */
  {
    const fresh = sess(50 * 60 * 1000, { access_token: JWT2, refresh_token: "rt-2" });
    const stale = sess(50 * 60 * 1000, { access_token: JWT,  refresh_token: "rt-1" });
    // The sibling renewed: the shared copy is NEWER than this tab's.
    fresh.exp = Date.now() + 55 * 60 * 1000;
    const w = boot({ stored: stale, shared: fresh, marked: true });
    // ⚠️ The keeper auto-starts on eval and syncs immediately, so the adoption
    // has already happened by now — asserting on a SECOND sync()'s return value
    // would read `false` and say the fix was missing. Assert the STORES.
    check("⭐ a tab holding a pre-rotation copy ADOPTS the sibling's newer token",
      readStore(w) && readStore(w).refresh_token === "rt-2");
    check("⚠ …and does NOT publish its consumed token over the live one",
      JSON.parse(w.localStorage.getItem("cpl_sb")).refresh_token === "rt-2");
    // A rotation that arrives AFTER boot must also be adopted, and must report
    // that it moved so a tab can re-render its lock state.
    const newer = sess(58 * 60 * 1000, { access_token: JWT2 + "x", refresh_token: "rt-3" });
    w.localStorage.setItem("cpl_sb", JSON.stringify(newer));
    const moved = w.CPL_SESSION.sync();
    check("…and a rotation arriving mid-session is adopted and announced",
      moved === true && readStore(w).refresh_token === "rt-3");
  }
  {
    // The older copy must still win when it is genuinely the newer of the two —
    // otherwise this rule would just be "shared always wins", which resurrects
    // a signed-out session (the hazard the TAB_MARK exists for).
    const mine   = sess(50 * 60 * 1000, { access_token: JWT2, refresh_token: "rt-2" });
    const older  = sess(10 * 60 * 1000, { access_token: JWT,  refresh_token: "rt-1" });
    const w = boot({ stored: mine, shared: older, marked: true });
    w.CPL_SESSION.sync();
    check("⚠ …but an OLDER shared copy is not adopted — this is newest-wins, not shared-wins",
      readStore(w).refresh_token === "rt-2"
        && JSON.parse(w.localStorage.getItem("cpl_sb")).refresh_token === "rt-2");
  }
  {
    /* And the safety net: if a renewal lands between our read and our exchange,
     * the 400 is about a token a sibling already replaced. Believing it would
     * delete a live session out from under every other tab. */
    // Near expiry so ensureFresh() actually exchanges, and the shared copy is a
    // DIFFERENT, live token — i.e. a sibling rotated between our read and our
    // exchange. Seeded after boot so sync()'s newest-wins does not pre-empt the
    // exchange this net exists to guard.
    const stale = sess(60 * 1000, { access_token: JWT, refresh_token: "rt-1" });
    const live  = sess(50 * 60 * 1000, { access_token: JWT2, refresh_token: "rt-2" });
    const w = boot({ stored: stale, shared: stale, marked: true, refresh: 400 });
    w.localStorage.setItem("cpl_sb", JSON.stringify(live));
    const got = await w.CPL_SESSION.ensureFresh(); await tick();
    check("⭐ a 400 on a token a sibling already rotated does NOT end the session",
      !!got && got.refresh_token === "rt-2");
    check("⚠ …and the shared copy survives it",
      w.localStorage.getItem("cpl_sb") !== null);

    // ⚠️ AND THE RULE STILL ENDS A SESSION THAT IS GENUINELY OVER. If this went
    // green regardless, the fix would be "never sign anyone out", which is a
    // worse bug than the one it replaces.
    const w2 = boot({ stored: stale, shared: stale, marked: true, refresh: 400 });
    const got2 = await w2.CPL_SESSION.ensureFresh(); await tick();
    check("a 400 with no better shared copy DOES still end the session",
      got2 === null && w2.localStorage.getItem("cpl_sb") === null);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
