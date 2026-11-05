// cobi_refresh.js — the "Manually Refresh COBI" button's click.
//
// Until 2026-11-05 the generator wrote the button as an inline onclick that carried the
// worker's shared trigger secret in the query string and the body, so every visitor to
// the public page held it (SEC-3, docs/kb-notes/reference-codebase-audit-2026-06-01.md;
// COBIx round 1 item 2). The click now sends the reader's own credential: a reviewer's
// bearer (CPL_SESSION) or the team phrase (CPL_TEAM_PHRASE, the shared localStorage key),
// and the worker's /trigger verifies it by RPC (team_pass_ok, is_allowed_reviewer). A
// reader with neither gets a sentence, not a request. No secret lives in this file or in
// the page.
//
// The generator (excel_to_dashboard.py, the refresh button block) writes
// onclick="cobiTriggerRefresh(this)" and nothing else; the confirm, the credential and the
// status text live here so a fix is one static file, not a regeneration (Rule 1).
(function () {
  var root = (typeof window !== "undefined") ? window : globalThis;
  var TRIGGER_URL = "https://cpl-proxy.slee-548.workers.dev/trigger";
  var PHRASE_KEY = "cpl_team_pass";   // team_phrase.js's KEY; the KB portal shares it
  var CONFIRM = "Manual Pipeline Run\n\nThis will re-scrape live data from the MAP CPL Dashboard, " +
    "regenerate all charts and KPIs, and overwrite today's deployed dashboard.\n\n" +
    "The process typically takes 3-5 minutes.\n\nContinue?";
  var NEED_CREDENTIAL = "Sign in or enter the team phrase to refresh COBI";

  // The headers a refresh sends: Authorization for a reviewer session, x-team-pass for the
  // phrase, both when both are held. Reads the keepers at click time (a copy taken at load
  // goes stale after a laptop sleeps: cpl_memory tab-session-copy-goes-stale-2026-11-04).
  function credentialHeaders() {
    var h = { "Content-Type": "application/json" };
    var S = root.CPL_SESSION;
    var s = (S && typeof S.get === "function") ? S.get() : null;
    if (s && s.access_token) h.Authorization = "Bearer " + s.access_token;
    var P = root.CPL_TEAM_PHRASE;
    var p = (P && typeof P.get === "function") ? P.get() : null;
    if (!p) { try { p = root.localStorage ? root.localStorage.getItem(PHRASE_KEY) : null; } catch (e) { p = null; } }
    if (p) h["x-team-pass"] = p;
    return h;
  }
  function hasCredential(h) { return !!(h.Authorization || h["x-team-pass"]); }

  function fresh() {
    var S = root.CPL_SESSION;
    if (S && typeof S.ensureFresh === "function") {
      try { return Promise.resolve(S.ensureFresh()).catch(function () { return null; }); } catch (e) { /* fall through */ }
    }
    return Promise.resolve(null);
  }

  // trigger(button, opts) — opts.confirm (default window.confirm), opts.fetch, opts.reload
  // exist for tests. Resolves to one of: "declined", "no-credential", "ok", "error".
  function trigger(btn, opts) {
    opts = opts || {};
    var ask = opts.confirm || function (m) { return root.confirm(m); };
    var doFetch = opts.fetch || function (u, i) { return root.fetch(u, i); };
    var reload = opts.reload || function () { root.setTimeout(function () { root.location.reload(); }, 300000); };
    if (!ask(CONFIRM)) return Promise.resolve("declined");
    if (btn) { btn.disabled = true; btn.textContent = "Pipeline triggered — updating..."; }
    return fresh().then(function () {
      var headers = credentialHeaders();
      if (!hasCredential(headers)) {
        if (btn) { btn.textContent = NEED_CREDENTIAL; btn.disabled = false; }
        return "no-credential";
      }
      return doFetch(TRIGGER_URL, { method: "POST", headers: headers, body: "{}" })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, data: d || {} }; }); })
        .then(function (res) {
          if (res.data.success) {
            if (btn) btn.textContent = "Pipeline running — page will refresh in 5 min";
            reload();
            return "ok";
          }
          var why = (res.data.error && (res.data.error.message || res.data.error)) || ("the proxy answered " + res.status);
          if (btn) { btn.textContent = "Error: " + why; btn.disabled = false; }
          return "error";
        }, function (e) {
          if (btn) { btn.textContent = "Error: " + (e && e.message ? e.message : e); btn.disabled = false; }
          return "error";
        });
    });
  }

  root.cobiTriggerRefresh = trigger;
  root.COBI_REFRESH = { url: TRIGGER_URL, headers: credentialHeaders, trigger: trigger, NEED_CREDENTIAL: NEED_CREDENTIAL };
})();
