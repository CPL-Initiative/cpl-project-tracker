/*
 * COBI — shared team-phrase unlock helper (window.CPL_TEAM_PHRASE)
 *
 * Phase 1 of the team-phrase expansion (docs/team_phrase_expansion_plan.md,
 * Sam: "Go phase 1", 2026-07-03). Extracts the raci.js pattern (Session 83,
 * hardened #598) into one shared module so the Annual Workplan, Budget, and
 * TMC-curator surfaces don't each re-implement it:
 *
 *   - The phrase lives in localStorage `cpl_team_pass` (RAW string — the
 *     same same-origin key raci.js / mission_control.js / kb-portal use, so
 *     one unlock covers every tab).
 *   - VALIDATE BEFORE STORE (the #598 lesson): unlock() POSTs the anon-granted
 *     rpc/team_pass_ok with the typed phrase as the x-team-pass header and
 *     only stores on a strict `true`.
 *   - Writes: callers keep their own fetch plumbing and call
 *     decorateHeaders(headers, sess) — for a phrase session the bearer stays
 *     the ANON key and x-team-pass rides along (RLS's team_pass_ok() reads
 *     the header server-side; a "Bearer undefined" is the classic bug).
 *   - Stale/rotated phrase: a 401/403 on a write with a teamPass session →
 *     handleWriteFailure() drops the stored phrase and returns true so the
 *     caller re-renders its lock state.
 *
 * The RLS boundary is server-side (is_allowed_reviewer() OR team_pass_ok());
 * this module is convenience, not security. STATIC — NOT a daily-cron
 * artifact; <script>-loaded in BOTH HTMLs (Rule 4) before its consumers.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://hvuwhnbuahrtptokpqfh.supabase.co';
  // Public anon key — the same one committed across the dashboard JS.
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM';
  var KEY = 'cpl_team_pass';

  function get() {
    try { return localStorage.getItem(KEY) || null; } catch (e) { return null; }
  }
  // Pseudo-session, shape-compatible with the magic-link session consumers
  // gate on (`state.sess` truthiness): no access_token → callers fall back to
  // the anon bearer; teamPass → decorateHeaders attaches x-team-pass.
  function session() {
    var p = get();
    return p ? { teamPass: p, email: '(team)' } : null;
  }
  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  // Server-side check WITHOUT storing. Resolves strict true (phrase matches),
  // false (server said no), or null (TRANSIENT — network error / 429 / 5xx:
  // we could not verify either way, so never report "wrong phrase").
  function verify(phrase) {
    return fetch(SUPABASE_URL + '/rest/v1/rpc/team_pass_ok', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: 'Bearer ' + SUPABASE_ANON,
        'Content-Type': 'application/json',
        'x-team-pass': phrase,
      },
      body: '{}',
    }).then(function (r) {
      if (r.status === 429 || r.status >= 500) return null;
      if (!r.ok) return false;
      return r.json().then(function (v) { return v === true; });
    }).catch(function () { return null; });
  }

  // Validate-then-store. Resolves true on success (phrase persisted),
  // false on a rejected phrase, null on a transient verification failure
  // (nothing stored in either non-true case).
  function unlock(phrase) {
    phrase = (phrase || '').trim();
    if (!phrase) return Promise.resolve(false);
    return verify(phrase).then(function (ok) {
      if (ok === true) { try { localStorage.setItem(KEY, phrase); } catch (e) { /* ignore */ } }
      return ok;
    });
  }

  // Attach x-team-pass on WRITE headers. For a phrase pseudo-session that's
  // the session's own phrase; for a magic-link (JWT) session the STORED
  // phrase still rides along when present — the RLS gates are OR-predicates,
  // so this is harmless for reviewers and it un-shadows the phrase for a
  // signed-in NON-reviewer (their JWT alone fails is_allowed_reviewer(),
  // and without the header the valid phrase they hold would never engage).
  function decorateHeaders(headers, sess) {
    var p = (sess && sess.teamPass) || get();
    if (p) headers['x-team-pass'] = p;
    return headers;
  }

  // PostgREST + RLS failure mode this whole module must respect: a PATCH /
  // DELETE whose target rows are filtered out by the policy's USING clause
  // (rotated phrase, non-reviewer session) returns HTTP 200/204 with ZERO
  // affected rows — NOT 401/403. An "ok" write must therefore also prove it
  // touched a row. Call with a fetch Response from a write that sent
  // `Prefer: return=representation`; resolves {ok, status, rows} where an
  // ok-but-empty representation is reported as a 403-shaped failure so the
  // callers' stale-phrase recovery (handleWriteFailure) engages.
  function checkWrite(r) {
    if (!r.ok) return Promise.resolve({ ok: false, status: r.status, rows: null });
    return r.json().then(function (rows) {
      var wrote = !Array.isArray(rows) || rows.length > 0;
      return { ok: wrote, status: wrote ? r.status : 403, rows: rows };
    }).catch(function () {
      // No JSON body (e.g. a 204) — can't count rows; trust r.ok.
      return { ok: true, status: r.status, rows: null };
    });
  }

  function isAuthError(status) { return status === 401 || status === 403; }

  // Rotated/stale phrase recovery: on an auth failure under a phrase session,
  // drop the stored phrase and tell the caller to re-render its lock state.
  function handleWriteFailure(sess, status) {
    if (sess && sess.teamPass && isAuthError(status)) { clear(); return true; }
    return false;
  }

  // Small reusable unlock row (password input + button + inline error) for a
  // tab's auth bar. opts: {label?, placeholder?, blurb?, onUnlocked(sess)}.
  function unlockRow(opts) {
    opts = opts || {};
    var wrap = document.createElement('span');
    wrap.className = 'cpl-tp-unlock';
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:0.4rem;flex-wrap:wrap;';
    if (opts.blurb) {
      var b = document.createElement('span');
      b.style.cssText = 'font-size:0.78rem;color:#666;';
      b.textContent = opts.blurb;
      wrap.appendChild(b);
    }
    var input = document.createElement('input');
    input.type = 'password';
    input.placeholder = opts.placeholder || 'team phrase…';
    input.autocomplete = 'off';
    input.style.cssText = 'padding:4px 8px;border:1px solid #ccc;border-radius:4px;font-size:0.8rem;font-family:inherit;max-width:160px;';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opts.label || '🔓 Unlock editing';
    btn.style.cssText = 'padding:4px 10px;border:1px solid #ccc;border-radius:4px;background:#f5f5f5;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit;';
    var msg = document.createElement('span');
    msg.style.cssText = 'font-size:0.75rem;color:#c00;';
    function go() {
      msg.textContent = '';
      btn.disabled = true;
      unlock(input.value).then(function (ok) {
        btn.disabled = false;
        if (ok === true) {
          input.value = '';
          if (typeof opts.onUnlocked === 'function') opts.onUnlocked(session());
        } else if (ok === null) {
          msg.textContent = "couldn't reach the server — try again in a moment";
        } else {
          msg.textContent = "that doesn't match — check with the team";
        }
      });
    }
    btn.addEventListener('click', go);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); go(); }
    });
    wrap.appendChild(input);
    wrap.appendChild(btn);
    wrap.appendChild(msg);
    return wrap;
  }

  var api = {
    KEY: KEY,
    get: get,
    session: session,
    clear: clear,
    verify: verify,
    unlock: unlock,
    decorateHeaders: decorateHeaders,
    isAuthError: isAuthError,
    handleWriteFailure: handleWriteFailure,
    checkWrite: checkWrite,
    unlockRow: unlockRow,
  };
  if (typeof window !== 'undefined') window.CPL_TEAM_PHRASE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
