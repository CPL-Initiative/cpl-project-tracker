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

  // Server-side check WITHOUT storing — resolves strict true/false.
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
      if (!r.ok) return false;
      return r.json().then(function (v) { return v === true; });
    }).catch(function () { return false; });
  }

  // Validate-then-store. Resolves true on success (phrase persisted).
  function unlock(phrase) {
    phrase = (phrase || '').trim();
    if (!phrase) return Promise.resolve(false);
    return verify(phrase).then(function (ok) {
      if (ok) { try { localStorage.setItem(KEY, phrase); } catch (e) { /* ignore */ } }
      return ok;
    });
  }

  // Attach x-team-pass for phrase sessions; harmless no-op otherwise.
  function decorateHeaders(headers, sess) {
    if (sess && sess.teamPass) headers['x-team-pass'] = sess.teamPass;
    return headers;
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
        if (ok) {
          input.value = '';
          if (typeof opts.onUnlocked === 'function') opts.onUnlocked(session());
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
    unlockRow: unlockRow,
  };
  if (typeof window !== 'undefined') window.CPL_TEAM_PHRASE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
