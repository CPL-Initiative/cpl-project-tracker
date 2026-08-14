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

  // ── Site-scoped phrases (Sam, 2026-08-12) ────────────────────────────────
  // A tab that appears under ONE site only (cobi_orgs.js EXCLUSIVE) answers to
  // that site's own phrase; every SHARED tab keeps team_pass_ok(), which matches
  // any secret in team_access — so "allow either" on shared tabs is free and
  // nobody loses access they have today.
  //
  // Each site phrase gets its OWN localStorage slot, so a person can hold the
  // shared phrase AND a site phrase at once with no swapping. That is not a new
  // invention: gr_priorities.js has stored to `cpl_gr_pass` since it shipped —
  // this generalises the pattern it proved.
  var SITES = {
    gr:  { key: 'cpl_gr_pass',  rpc: 'gr_pass_ok',  label: 'GR' },
    fin: { key: 'cpl_fin_pass', rpc: 'fin_pass_ok', label: 'Finance' }
  };
  function siteDef(site) {
    return (site && Object.prototype.hasOwnProperty.call(SITES, site)) ? SITES[site] : null;
  }
  // Which localStorage slot backs this site (the shared slot when unscoped).
  function keyFor(site) { var d = siteDef(site); return d ? d.key : KEY; }
  function rpcFor(site) { var d = siteDef(site); return d ? d.rpc : 'team_pass_ok'; }

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

  // ── Site-scoped accessors ────────────────────────────────────────────────
  function siteGet(site) {
    try { return localStorage.getItem(keyFor(site)) || null; } catch (e) { return null; }
  }
  function siteClear(site) {
    try { localStorage.removeItem(keyFor(site)); } catch (e) { /* ignore */ }
  }
  // The phrase to SEND for a surface on `site`: that site's own phrase when the
  // user holds it, else the shared one. Sending the shared phrase to an
  // already-swapped policy simply fails closed and the tab re-offers its unlock
  // — which is what lets the policy swap land independently of this deploy.
  function passFor(site) { return siteGet(site) || (siteDef(site) ? get() : get()); }
  // Pseudo-session for a site surface, shape-compatible with `session()`.
  function sessionFor(site) {
    var p = passFor(site);
    if (!p) return null;
    var d = siteDef(site);
    return { teamPass: p, site: site || null, email: d && siteGet(site) ? '(' + d.label.toLowerCase() + ')' : '(team)' };
  }

  // Announce a successful unlock so already-rendered tabs can re-read. Tabs
  // that gate a READ (Contracts, MAP Queue, College Briefing…) render a locked
  // pane; without this they would sit locked until a manual reload — the exact
  // "re-open this tab" friction the header control exists to remove.
  function announceUnlock(site) {
    try {
      window.dispatchEvent(new CustomEvent('cpl-team-pass-unlocked', { detail: { site: site || null } }));
    } catch (e) { /* ignore */ }
  }

  // Server-side check WITHOUT storing. Resolves strict true (phrase matches),
  // false (server said no), or null (TRANSIENT — network error / 429 / 5xx:
  // we could not verify either way, so never report "wrong phrase").
  // `site` picks the RPC: the site's own gate, or the shared team gate.
  function verify(phrase, site) {
    return fetch(SUPABASE_URL + '/rest/v1/rpc/' + rpcFor(site), {
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
  // (nothing stored in either non-true case). `site` stores into that site's
  // own slot, leaving the shared phrase untouched.
  function unlock(phrase, site) {
    phrase = (phrase || '').trim();
    if (!phrase) return Promise.resolve(false);
    return verify(phrase, site).then(function (ok) {
      if (ok === true) {
        try { localStorage.setItem(keyFor(site), phrase); } catch (e) { /* ignore */ }
        announceUnlock(site);
      }
      return ok;
    });
  }

  // Attach x-team-pass on WRITE headers. For a phrase pseudo-session that's
  // the session's own phrase; for a magic-link (JWT) session the STORED
  // phrase still rides along when present — the RLS gates are OR-predicates,
  // so this is harmless for reviewers and it un-shadows the phrase for a
  // signed-in NON-reviewer (their JWT alone fails is_allowed_reviewer(),
  // and without the header the valid phrase they hold would never engage).
  // `site` scopes which phrase rides along: that site's own when held, else the
  // shared one. PostgREST carries exactly ONE x-team-pass, so this must choose.
  function decorateHeaders(headers, sess, site) {
    var p = (sess && sess.teamPass) || passFor(site);
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
  // Drops the SLOT the failing phrase actually came from — clearing the shared
  // phrase because a site-scoped write was refused would log the user out of
  // every other tab for a failure that had nothing to do with it.
  function handleWriteFailure(sess, status, site) {
    if (!(sess && sess.teamPass && isAuthError(status))) return false;
    var scoped = site || (sess && sess.site) || null;
    if (scoped && siteGet(scoped) === sess.teamPass) { siteClear(scoped); return true; }
    clear();
    return true;
  }

  // Small reusable unlock row (password input + button + inline error) for a
  // tab's auth bar. opts: {label?, placeholder?, blurb?, site?, onUnlocked(sess)}.
  // `site` targets a site-scoped phrase (validated against that site's RPC and
  // stored in its own slot); omit it for the shared team phrase.
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
      unlock(input.value, opts.site).then(function (ok) {
        btn.disabled = false;
        if (ok === true) {
          input.value = '';
          if (typeof opts.onUnlocked === 'function') opts.onUnlocked(sessionFor(opts.site));
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

  // ── The locked-state banner ──────────────────────────────────────────────
  // Sam, 2026-08-14: "What do you recommend to insure that all tabs that
  // require a Team Phrase have an input on them?"
  //
  // MEASURED FIRST. 43 tables gate on a phrase, 26 of them on the READ. Of the
  // 18 tabs touching one, EIGHT had neither a box nor even a mention of the
  // header control — and three still carried the pre-SkyFund copy telling
  // people to "sign in on the Team & RACI tab", which by then also promised a
  // magic link RACI no longer offered. When the gate is on the READ, the tab
  // does not look locked, it looks BROKEN: empty, with nothing to act on.
  //
  // The answer is NOT a box hand-rolled onto each of 18 tabs — that is 18
  // implementations to drift, and it re-creates what the header control
  // already solved. It is ONE banner that says what is locked, why, and
  // carries a WORKING input inline, so the tab never has to send anyone
  // anywhere. tests/team_phrase_affordance.test.js fails the build when a tab
  // that touches a phrase-gated table has neither this nor an equivalent —
  // mechanically, because a rule that relies on the next tab's author
  // remembering it will fail on their first day.
  //
  // opts: {what?, site?, reviewerOnly?, onUnlocked?}
  //   what         — what is unavailable, in the tab's own words
  //                  ("decisions cannot be recorded", "the briefing")
  //   reviewerOnly — the phrase CANNOT open this surface; point at the
  //                  personal sign-in instead of offering a box that will not
  //                  work. Offering an input that cannot succeed is worse than
  //                  offering none: it reads as a wrong phrase.
  function lockedBanner(opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'cpl-tp-locked';
    wrap.setAttribute('data-tp-locked', '');
    wrap.style.cssText = 'border:1px solid var(--border,#d9c9a3);background:var(--surface-2,#fdf8ec);' +
      'border-radius:8px;padding:.7rem .85rem;margin:.6rem 0;font-size:.85rem;line-height:1.45;' +
      'color:var(--text-body,#3A3A36);';

    var head = document.createElement('div');
    head.style.cssText = 'margin-bottom:.45rem;';
    var strong = document.createElement('b');
    strong.textContent = 'You are not signed in. ';
    head.appendChild(strong);
    head.appendChild(document.createTextNode(
      (opts.what ? opts.what : 'This tab’s contents') +
      (opts.reviewerOnly
        ? ' needs a personal reviewer sign-in — the shared team phrase does not open it.'
        : ' stays hidden until you unlock with the team phrase.')));
    wrap.appendChild(head);

    if (opts.reviewerOnly) {
      // No input here on purpose. The personal sign-in lives in ONE place
      // (reviewer_signin.js, in the ℹ About menu); a second copy would be a
      // second thing to drift, and this banner cannot mint a session anyway.
      var hint = document.createElement('div');
      hint.style.cssText = 'font-size:.8rem;color:var(--text-muted,#6b7280);';
      hint.textContent = 'Open ℹ About in the header and ask for a sign-in link. Your address must be on the reviewer list.';
      wrap.appendChild(hint);
      return wrap;
    }

    // A working input, right here. This is the whole point of the component.
    //
    // The DEFAULT onUnlocked re-dispatches cpl-tab-activated for the live tab,
    // which every gated tab already listens for — so unlocking re-renders the
    // tab you are looking at without each caller wiring its own reload, and
    // without this module knowing any tab's internals. A banner that unlocks
    // but leaves the page looking locked reads as a rejected phrase.
    wrap.appendChild(unlockRow({
      site: opts.site,
      label: '🔓 Unlock',
      onUnlocked: function (sess) {
        if (typeof opts.onUnlocked === 'function') { opts.onUnlocked(sess); return; }
        try {
          var cur = window.CPL_TABS && typeof window.CPL_TABS.current === 'function'
            ? window.CPL_TABS.current() : null;
          if (cur) window.dispatchEvent(new CustomEvent('cpl-tab-activated', { detail: { tab: cur } }));
        } catch (e) { /* the phrase is stored either way; a reload will show it */ }
      }
    }));
    var alt = document.createElement('div');
    alt.style.cssText = 'font-size:.78rem;color:var(--text-muted,#6b7280);margin-top:.4rem;';
    alt.textContent = 'The 🔒 button in the header does the same thing, from any tab.';
    wrap.appendChild(alt);
    return wrap;
  }

  var api = {
    KEY: KEY,
    SITES: SITES,
    lockedBanner: lockedBanner,
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
    // site-scoped
    siteDef: siteDef,
    keyFor: keyFor,
    rpcFor: rpcFor,
    siteGet: siteGet,
    siteClear: siteClear,
    passFor: passFor,
    sessionFor: sessionFor,
  };
  if (typeof window !== 'undefined') window.CPL_TEAM_PHRASE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
