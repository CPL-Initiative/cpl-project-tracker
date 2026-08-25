/*
 * cpl_session.js — the shared reviewer-session KEEPER.
 *
 * WHY THIS EXISTS
 * ---------------
 * Sam, 2026-08-14, in one evening, three reports that looked like three bugs:
 *   • Admin  — dragged the menu, pressed Save, "save 400"
 *   • Sierra Training — "it says I'm not signed in, but I should be"
 *   • Common CR Reference — "Could not read the decisions table"
 * and then, having re-signed in: "now Sierra is allowing edits."
 *
 * One cause. A Supabase access token lives about an hour. `cpl_sb` carries
 * `exp` (MILLISECONDS — `Date.now() + expires_in * 1000`, minted by
 * unified_courses.js persistToken) and a `refresh_token` for renewing it
 * silently. THIRTEEN of the twenty-six modules that read that session check
 * only the token's SHAPE — three dot-separated parts, over 40 characters — so
 * an hour after signing in they still report "signed in" while every request
 * they send bears a dead token and comes back 401. The UI then renders that as
 * "not signed in" or "could not read", which sends the curator to re-enter a
 * credential that was never the problem, and re-signing in "fixes" it, which
 * hides the cause for the next person.
 *
 * ── A KEEPER, NOT A THIRTEENTH COPY ─────────────────────────────────────────
 * The obvious fix is to teach all thirteen to refresh. That is thirteen edits
 * to auth code, unverifiable outside a browser, and it leaves the same mistake
 * available to the next tab anyone writes.
 *
 * Instead this keeps the ONE thing they all read — `sessionStorage.cpl_sb` —
 * continuously fresh underneath them. Every module benefits, including the ones
 * this change does not touch, because they all parse the same key and it is
 * simply never stale when they look. A tab that already refreshes (raci.js,
 * unified_courses.js, tmc_builder.js …) keeps doing so and finds nothing to do.
 *
 * ── FAIL-SAFE: A REFRESH THAT DOES NOT ANSWER MUST NOT SIGN ANYONE OUT ──────
 * raci.js drops the session whenever a refresh rejects — including a network
 * blip, which signs a curator out for being briefly offline and loses whatever
 * they were about to write. Here a session is cleared ONLY when the auth server
 * definitively rejects the refresh token (400/401 — used, revoked, malformed).
 * Anything else (offline, DNS, 5xx, CORS, a timeout) leaves the session exactly
 * where it was and we try again on the next tick.
 *
 * ── NEVER DELETE ON READ ────────────────────────────────────────────────────
 * `read()` has no side effects. Existing getSession()s delete `cpl_sb` when it
 * fails their test, which means a single unlucky parse silently ends the
 * session. Deleting is a decision; it belongs with the code that learned the
 * credential is dead, not with the code that merely looked at it.
 *
 * Loaded EAGERLY in both HTMLs (Rule 4 — the two files stay identical). Every
 * consumer must still work when this file is absent: it improves a session, it
 * is never required to have one.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var KEY = "cpl_sb";

  /* ── THE SESSION IS SHARED ACROSS BROWSER TABS ──────────────────────────────
   *
   * Sam, 2026-08-14: "when I logged in, it opened a new tab and I was trying to
   * work on Sierra from the original tab… so it would have worked had I
   * navigated to Sierra Training from the new tab."
   *
   * He diagnosed it exactly. A magic link is opened by the mail client, which
   * lands in a NEW browser tab, and the session is kept in `sessionStorage` —
   * which is scoped to one browser tab by definition. Every other tab already
   * open, including the one the person was working in, stays signed out. There
   * is nothing to route: `cpl_sb_return_tab` restores the right IN-APP tab, and
   * the person is still in the wrong BROWSER tab.
   *
   * So the canonical copy moves to `localStorage`, which every tab of an origin
   * shares — and this module MIRRORS it into each tab's `sessionStorage`, which
   * is where all 26 existing readers look. No other file changes, and a browser
   * without localStorage (private mode, storage disabled) simply behaves as it
   * does today.
   *
   * ── SIGNING OUT HAS TO STAY SIGNED OUT ──────────────────────────────────────
   * The hazard of a shared copy: the sign-out paths scattered through the tabs
   * call `sessionStorage.removeItem("cpl_sb")`, so a naive mirror would help
   * itself to the localStorage copy on the next tick and sign the person back
   * in — a sign-out button that does nothing, which is far worse than a session
   * that ends too early.
   *
   * A per-tab MARK distinguishes the two cases that otherwise look identical:
   *   no session + no mark  → a fresh browser tab      → hydrate from the share
   *   no session + a mark   → this tab HAD one, gone   → a sign-out, so clear
   *                                                      the share as well
   * The mark lives in sessionStorage, so it dies with the tab, which is exactly
   * the lifetime the question needs.
   */
  var TAB_MARK = "cpl_sb_tab";

  /* Closing the browser used to end the session; now it does not. This caps how
   * long a shared session may be revived for, so a machine left signed in does
   * not stay that way indefinitely. Deliberately ONE constant: a reviewer
   * credential outliving the working day is the trade this change makes, and it
   * should be adjustable without reading the rest of the file. */
  var MAX_SHARED_AGE_MS = 12 * 60 * 60 * 1000;

  // Renew this far ahead of expiry. Comfortably longer than a slow round trip,
  // so a request is never sent on a token that dies mid-flight.
  var SKEW_MS = 5 * 60 * 1000;
  // How often to look. The check is a clock comparison and costs nothing; the
  // network call happens only inside the skew window, so this is ~12 refreshes
  // a day for someone who leaves the dashboard open.
  var TICK_MS = 60 * 1000;

  function isValidJwt(t) {
    return typeof t === "string" && t.split(".").length === 3 && t.length > 40;
  }

  /* Read WITHOUT side effects — see the header. Returns the stored session
   * whatever its freshness; judging it is a separate step, because "expired"
   * and "absent" are different states and only one of them is recoverable. */
  function read() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (s && isValidJwt(s.access_token)) return s;
    } catch (e) { /* private mode, or a garbled value */ }
    return null;
  }

  /* Every write lands in BOTH stores. Writing only the per-tab copy would let a
   * refresh rotate the token here while the shared copy kept the consumed one,
   * so the next tab to open would hydrate a dead session. */
  function write(s) {
    writeShared(s);              // stamps shared_since, so both copies carry it
    var ok = false;
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); ok = true; } catch (e) { /* ignore */ }
    try { sessionStorage.setItem(TAB_MARK, "1"); } catch (e) { /* ignore */ }
    return ok;
  }

  /* …and every drop clears both, so a sign-out cannot be undone by the share. */
  function drop() {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    try { sessionStorage.removeItem(TAB_MARK); } catch (e) { /* ignore */ }
    clearShared();
  }

  function readShared() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && isValidJwt(s.access_token)) return s;
    } catch (e) { /* no localStorage, or a garbled value */ }
    return null;
  }

  function writeShared(s) {
    try {
      // Stamp the first time this browser sees the session, so MAX_SHARED_AGE_MS
      // bounds the SESSION rather than the access token — `exp` moves forward on
      // every refresh and so can never express an absolute age.
      if (s && !s.shared_since) s.shared_since = Date.now();
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) { /* private mode — the per-tab copy still works */ }
  }

  function clearShared() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  function sharedTooOld(s) {
    return !!(s && s.shared_since && (Date.now() - s.shared_since) > MAX_SHARED_AGE_MS);
  }

  /* Reconcile this tab with the shared copy. Runs on every tick, on focus, and
   * whenever another tab writes the shared key. Returns true if anything moved,
   * so callers can announce. */
  function sync() {
    var mine = read();
    if (mine) {
      try { sessionStorage.setItem(TAB_MARK, "1"); } catch (e) { /* ignore */ }
      var shared = readShared();
      /* ⭐ THE FRESHEST TOKEN WINS — NOT "MINE". This read "this tab has the
       * session: it is the truth", which is the one rule a ROTATING credential
       * in a SHARED store cannot obey. Refresh tokens rotate: the first use
       * invalidates the old one. So when a sibling tab renews, this tab's
       * per-tab copy is not another opinion about the session, it is simply
       * OLD — and "mine is the truth" made it overwrite the sibling's live
       * token with a consumed one, then exchange that consumed token, get a
       * definitive 400, and drop() BOTH stores. Every tab signed out, mid-edit,
       * with nothing having gone wrong.
       *
       * (Sam, 2026-08-25, editing GR row #3 with several sessions open: his
       * console showed `token?grant_type=refresh_token 400` and then NO
       * SESSION, while the save he had just pressed reported that his sign-in
       * did not allow writing to the register.)
       *
       * ⚠️ COMPARE ON `exp`, NOT ON PRESENCE. Both copies are well-formed and
       * both look valid; the only thing that distinguishes them is which one
       * was minted later. */
      if (shared && shared.access_token !== mine.access_token
          && (shared.exp || 0) > (mine.exp || 0)) {
        // A sibling renewed while this tab held an older copy. Adopt it rather
        // than publishing ours over it — ours is the consumed one.
        try {
          sessionStorage.setItem(KEY, JSON.stringify(shared));
          sessionStorage.setItem(TAB_MARK, "1");
        } catch (e) { /* ignore */ }
        return true;               // this tab's credential changed underneath it
      }
      if (!shared || shared.access_token !== mine.access_token) {
        // Carry the existing stamp forward rather than restarting the clock —
        // otherwise every refresh would reset the cap and it would never bite.
        if (shared && shared.shared_since) mine.shared_since = shared.shared_since;
        writeShared(mine);
      }
      return false;
    }

    var hadOne = false;
    try { hadOne = sessionStorage.getItem(TAB_MARK) === "1"; } catch (e) { /* ignore */ }
    if (hadOne) {
      // A session existed in this tab and is gone: somebody signed out (or a
      // module dropped a dead one). Propagate it rather than resurrecting.
      clearShared();
      try { sessionStorage.removeItem(TAB_MARK); } catch (e) { /* ignore */ }
      return false;
    }

    var s = readShared();
    if (!s) return false;
    if (sharedTooOld(s)) { clearShared(); return false; }
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
      sessionStorage.setItem(TAB_MARK, "1");
    } catch (e) { return false; }
    return true;                   // a signed-out-looking tab just became signed in
  }

  /* `exp` absent means an older session shape we cannot date. Treat it as fresh
   * rather than as expired: guessing "expired" would sign out someone whose
   * token is fine, which is the exact failure this file exists to end. */
  function isFresh(s, skewMs) {
    if (!s) return false;
    if (!s.exp) return true;
    return s.exp > Date.now() + (skewMs || 0);
  }

  function expiresInMs(s) {
    if (!s || !s.exp) return null;
    return s.exp - Date.now();
  }

  var inFlight = null;   // one refresh at a time; callers share the promise

  function exchange(refreshToken) {
    return fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).then(function (r) {
      if (r.ok) return r.json();
      // THE DISTINCTION THIS WHOLE FILE TURNS ON. 400/401 is the auth server
      // saying this refresh token will never work again — that session is over.
      // Any other status is the server or the network having a bad moment, and
      // a bad moment must not cost a curator their sign-in.
      var err = new Error("refresh " + r.status);
      err.rejected = (r.status === 400 || r.status === 401);
      throw err;
    });
  }

  /* Resolve to a usable session, renewing first if it is near expiry.
   * Resolves null when there is no session at all, or when the refresh token
   * was definitively rejected. NEVER rejects — callers treat null as
   * "signed out" and anything else as "go ahead". */
  function ensureFresh() {
    sync();                       // a fresh browser tab hydrates before we judge it
    var s = read();
    if (!s) return Promise.resolve(null);
    if (isFresh(s, SKEW_MS)) return Promise.resolve(s);
    if (!s.refresh_token) {
      // Expired with no way to renew. This IS the end of the session, and
      // saying so is what lets the UI offer the sign-in control instead of
      // insisting the person is signed in while every read 401s.
      if (!isFresh(s, 0)) { drop(); announce(null); return Promise.resolve(null); }
      return Promise.resolve(s);   // inside the skew window but not yet dead
    }
    if (inFlight) return inFlight;

    inFlight = exchange(s.refresh_token).then(function (tok) {
      if (!tok || !isValidJwt(tok.access_token)) throw new Error("bad refresh payload");
      var prior = readShared();
      var ns = {
        access_token: tok.access_token,
        refresh_token: tok.refresh_token || s.refresh_token,
        email: s.email || null,
        exp: Date.now() + (parseInt(tok.expires_in || "3600", 10) * 1000),
        // Carry the age stamp across the renewal. Minting a fresh one here
        // would restart MAX_SHARED_AGE_MS on every refresh — and since the
        // keeper refreshes roughly hourly, the cap would never once be reached.
        // An expiry that renews itself is not a cap.
        shared_since: s.shared_since || (prior && prior.shared_since) || Date.now(),
      };
      write(ns);
      inFlight = null;
      announce(ns);
      return ns;
    }).catch(function (e) {
      inFlight = null;
      if (e && e.rejected) {
        /* ⚠️ A REJECTED REFRESH TOKEN IS NOT PROOF THE SESSION ENDED — it can be
         * proof a SIBLING TAB ALREADY RENEWED IT. The rotation above is meant to
         * stop this tab ever reaching here with a consumed token, but a renewal
         * that lands between our read and our exchange still can. drop() clears
         * BOTH stores, so believing this rejection would delete a live session
         * out from under every other tab.
         *
         * So consult the SHARED copy before concluding anything: if it carries a
         * DIFFERENT token that is still usable, a sibling renewed and this tab
         * merely exchanged a stale one. Only an absent shared copy — or the very
         * token just rejected — means the session is actually over. */
        var live = readShared();
        if (live && live.access_token !== s.access_token && isFresh(live, 0)) {
          try {
            sessionStorage.setItem(KEY, JSON.stringify(live));
            sessionStorage.setItem(TAB_MARK, "1");
          } catch (e2) { /* ignore */ }
          announce(live);
          return live;
        }
        drop(); announce(null); return null;
      }
      // Transient. Keep the session and hand back what we have — if it is still
      // inside its skew window the caller's request will succeed anyway, and if
      // it is not, one 401 is a far better outcome than a wrongful sign-out.
      return read();
    });
    return inFlight;
  }

  /* Tabs render their lock state at activation, so a session that changes
   * underneath them needs to say so. Named distinctly from the team-phrase
   * event: they are different credentials and a tab may care about only one. */
  function announce(sess) {
    try {
      window.dispatchEvent(new CustomEvent("cpl-session-changed", {
        detail: { signedIn: !!sess, email: sess ? sess.email : null },
      }));
    } catch (e) { /* CustomEvent unavailable — the keeper still works */ }
  }

  /* Headers for a Supabase REST call under this session. Offered as a
   * convenience for new code; nothing is obliged to use it, and every existing
   * caller keeps working untouched because the token they read is now fresh. */
  function authHeaders(extra) {
    var s = read();
    var h = {
      apikey: SUPABASE_ANON,
      Authorization: "Bearer " + ((s && s.access_token) || SUPABASE_ANON),
    };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  /* ── where to come back to ────────────────────────────────────────────────
   * Sam, 2026-08-25: "when log in to curate is done and magic link is clicked
   * from email, it takes me to the CCR screen and should take me to the screen
   * I was on."
   *
   * ⭐ SAME ROOT CAUSE AS THIS WHOLE FILE, ONE KEY OVER. Nine modules stash the
   * tab in `sessionStorage.cpl_sb_return_tab` — and sessionStorage is PER
   * BROWSER TAB. The magic link opens a NEW tab, so the stash written in the
   * old one is invisible there, the reader falls back to its default, and every
   * sign-in from anywhere landed on the Common Course Reference. This file's own
   * header comment cites cpl_sb_return_tab as the thing that "restores the right
   * IN-APP tab" while it could not, for exactly the reason the file exists.
   *
   * So the canonical copy moves to localStorage, which every tab of an origin
   * shares. Two differences from the session itself:
   *   · IT EXPIRES. A session should outlive the trip to an inbox; a "come back
   *     to Memory" note should not still be lying around tomorrow, quietly
   *     hijacking an unrelated sign-in. 30 minutes is longer than any inbox
   *     round trip and shorter than any working session.
   *   · IT IS TAKEN, NOT READ. One sign-in, one redirect: leaving it behind
   *     would send the NEXT arrival to the same place.
   */
  var RETURN_KEY = "cpl_sb_return_tab";
  var RETURN_TTL_MS = 30 * 60 * 1000;
  function stashReturnTab(tab) {
    if (!tab) return;
    // Both stores: localStorage is what the new browser tab can see, and
    // sessionStorage keeps the same-tab flow working with no behavior change
    // where it already worked.
    try { localStorage.setItem(RETURN_KEY, JSON.stringify({ tab: tab, at: Date.now() })); } catch (e) { /* ignore */ }
    try { sessionStorage.setItem(RETURN_KEY, tab); } catch (e) { /* ignore */ }
  }
  function takeReturnTab() {
    var out = null;
    try {
      var raw = localStorage.getItem(RETURN_KEY);
      if (raw) {
        var v = JSON.parse(raw);
        // An older plain-string value (or one with no stamp) is honored once
        // rather than discarded — a stash written before this shipped is still
        // a real answer to "where was I".
        if (typeof v === "string") out = v;
        else if (v && v.tab && (!v.at || Date.now() - v.at < RETURN_TTL_MS)) out = v.tab;
      }
    } catch (e) { /* ignore */ }
    if (!out) { try { out = sessionStorage.getItem(RETURN_KEY) || null; } catch (e) { /* ignore */ } }
    try { localStorage.removeItem(RETURN_KEY); } catch (e) { /* ignore */ }
    try { sessionStorage.removeItem(RETURN_KEY); } catch (e) { /* ignore */ }
    return out;
  }

  var timer = null;
  function tick() {
    if (sync()) announce(read());   // this tab just picked up another tab's sign-in
    ensureFresh();
  }

  function start() {
    if (timer) return;
    tick();
    timer = setInterval(tick, TICK_MS);
    /* localStorage fires `storage` in the OTHER tabs of the origin, so a sign-in
     * or sign-out anywhere reaches every open tab within milliseconds instead of
     * waiting for the next tick. This event could never fire for the old
     * sessionStorage copy, which is why tabs.js's rail badge — which has
     * listened for it since it was written — never once updated from it. */
    window.addEventListener("storage", function (e) {
      if (e && e.key && e.key !== KEY) return;
      if (sync()) announce(read());
      else if (!read()) announce(null);
    });
    // Timers in a backgrounded browser tab are throttled hard, so a laptop
    // reopened after lunch can hold an hours-dead token with a tick that has
    // barely run. Re-check on the moments a person actually returns.
    window.addEventListener("focus", tick);
    window.addEventListener("cpl-tab-activated", tick);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tick();
    });
  }

  window.CPL_SESSION = {
    get: read,
    isFresh: function (s) { return isFresh(s || read(), 0); },
    expiresInMs: function () { return expiresInMs(read()); },
    ensureFresh: ensureFresh,
    authHeaders: authHeaders,
    signOut: function () { drop(); announce(null); },
    stashReturnTab: stashReturnTab,
    takeReturnTab: takeReturnTab,
    _returnTtlMs: RETURN_TTL_MS,
    sync: sync,
    start: start,
    _skewMs: SKEW_MS,
    _tickMs: TICK_MS,
    _maxSharedAgeMs: MAX_SHARED_AGE_MS,
    _isValidJwt: isValidJwt,
    _readShared: readShared,
  };

  /* Start IMMEDIATELY, not on DOMContentLoaded. Hydrating a browser tab from the
   * shared session is pure storage work — it needs no DOM — and every other
   * module reads `cpl_sb` while its own script evaluates. Waiting for DOM ready
   * would leave a tab reading "signed out" for the whole parse, which is the
   * very state this file exists to prevent. Listener registration is legal
   * during parsing too, so there is nothing here to defer. */
  start();
})();
