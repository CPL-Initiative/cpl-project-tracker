/*
 * COBI — shared reviewer (magic-link) sign-in  ·  window.CPL_REVIEWER_SIGNIN
 *
 * Sam, 2026-08-14: "I tried using the magic link login on RACI tab but it only
 * has the team phrase input now, so I can't edit the new Admin tab." Then:
 * "Might be better to keep the Admin log in link in the About drop down on
 * COBI … Since Admin supersedes RACI."
 *
 * THE DEFECT THIS CLOSES. raci.js's renderAuth() offers ONLY the phrase box
 * when signed out; its signIn() had been left behind with no caller at all.
 * Meanwhile admin.js told anyone who landed there signed-out to "Sign in with
 * a magic link on the Team & RACI tab, then re-open this tab" — an instruction
 * that could not be followed, on a tab that is reviewer-ONLY, so the team
 * phrase could never have opened it either. That is exactly the bounce
 * team_phrase_header.js was written to end ("each rendered 'sign in on the
 * Team & RACI tab … and re-open this tab'"), one credential along: SkyFund
 * fixed it for the PHRASE and the magic link kept the bug.
 *
 * WHY ABOUT AND NOT THE MASTHEAD LOCK. The 🔒 control is SITE-SCOPED — it
 * re-labels Team ⇄ GR ⇄ Finance as you switch sites, because a site phrase
 * opens that site's exclusive tabs. A reviewer sign-in is a PERSONAL identity
 * and is not site-scoped in any way; hanging it inside the site control would
 * imply a scoping the database does not enforce, which is the precise error
 * that module's own docstring warns against. About is global, always on
 * screen, and already the home for account-shaped meta actions.
 *
 * ONE IMPLEMENTATION, TWO MOUNT POINTS. mountInto() is called by the About
 * panel (here, at init) and by admin.js on its signed-out screen, so a
 * reviewer who lands on Admin signs in WHERE THEY ARE. A second copy of a
 * sign-in box is a second thing that can drift.
 *
 * SIGNED IN IS NOT THE SAME AS REVIEWER. The OTP endpoint mints a session for
 * any address (create_user:true); whether it can read anything is decided by
 * RLS (is_allowed_reviewer()). So this control reports "Signed in as X" and
 * never claims the reviewer role — admin.js / team_phrases.js render the
 * distinct "signed in, but not a reviewer" state from what the DATABASE says.
 *
 * STATIC — NOT a daily-cron artifact. Runtime-injected (the
 * team_phrase_header.js / cobi_orgs.js pattern) so the generator's regen of
 * the About panel's PROJ-INFO block can never strand it, and so no markup
 * needs mirroring across both HTMLs; only the <script> tag is mirrored
 * (Rule 4). Tests: tests/reviewer_signin.test.js
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  // Public anon key — the same one committed across the dashboard JS.
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var SESSION_KEY = "cpl_sb";
  var RETURN_KEY = "cpl_sb_return_tab";

  // Per-mount state lives on the mount record, not in the DOM: render()
  // rewrites the block, and it is re-entered from tab activation and from the
  // sign-in result. Left in the DOM, a re-render arriving mid-typing swallows
  // the half-typed address and the error line with it — the failure
  // team_phrase_header.js hit and documented.
  var mounts = [];

  function isValidJwt(t) {
    return typeof t === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
  }
  // Same acceptance rule as unified_courses.js / raci.js: a session that is
  // still fresh OR carries a refresh_token (those self-heal on next use).
  // Anything else is dropped so the UI shows "Sign in" rather than pretending.
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (s && isValidJwt(s.access_token) && (s.refresh_token || !s.exp || s.exp > Date.now())) return s;
    } catch (e) { /* fall through */ }
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    return null;
  }

  function currentTab() {
    try {
      var t = window.CPL_TABS;
      if (t && typeof t.current === "function") return t.current() || null;
    } catch (e) { /* ignore */ }
    return null;
  }

  // Send the one-time link. The callback lands back on the page root, where
  // unified_courses.js consumeAuthHash() mints cpl_sb and routes to whatever
  // sits in cpl_sb_return_tab — so stash the tab the person is ON, and they
  // come back to it instead of to some other tab's idea of home.
  function sendLink(email, returnTab) {
    // ⚠ sessionStorage is PER BROWSER TAB and the magic link lands in a NEW one,
    // so a stash written here could never be seen where it is read — every
    // sign-in fell back to the reader's default (Sam, 2026-08-25). The keeper
    // writes the shared copy; the local one stays for the same-tab flow.
    var back = returnTab || currentTab() || "dashboard";
    if (window.CPL_SESSION && CPL_SESSION.stashReturnTab) CPL_SESSION.stashReturnTab(back);
    else try { sessionStorage.setItem(RETURN_KEY, back); } catch (e) { /* ignore */ }
    var redirect = encodeURIComponent(location.origin + location.pathname);
    return fetch(SUPABASE_URL + "/auth/v1/otp?redirect_to=" + redirect, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, create_user: true })
    });
  }

  function signOut() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    announce("cpl-reviewer-signed-out");
  }

  function announce(name) {
    try { window.dispatchEvent(new CustomEvent(name)); } catch (e) { /* ignore */ }
  }

  // After signing out, a gated tab already on screen must re-read. Gated tabs
  // already listen for cpl-tab-activated, so re-dispatching it for the LIVE tab
  // reuses proven wiring rather than adding a bespoke listener to each one.
  function refreshActiveTab() {
    try {
      var cur = currentTab();
      if (cur) window.dispatchEvent(new CustomEvent("cpl-tab-activated", { detail: { tab: cur } }));
    } catch (e) { /* ignore */ }
  }

  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById("cobi-rsi-css")) return;
    var st = document.createElement("style");
    st.id = "cobi-rsi-css";
    st.textContent =
      ".cobi-rsi{border-top:1px solid var(--border,rgba(28,28,26,.14));padding-top:.5rem;margin-top:.35rem;font-family:inherit;}" +
      ".cobi-rsi-ttl{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;" +
        "color:var(--text-muted,#6b7280);margin:0 0 .25rem;}" +
      ".cobi-rsi-sub{font-size:.75rem;color:var(--text-muted,#6b7280);margin:0 0 .45rem;line-height:1.4;}" +
      ".cobi-rsi-row{display:flex;gap:.35rem;align-items:center;flex-wrap:wrap;}" +
      ".cobi-rsi-in{flex:1 1 130px;min-width:0;padding:4px 8px;border:1px solid var(--border,#ccc);" +
        "border-radius:4px;font-size:.8rem;font-family:inherit;}" +
      ".cobi-rsi-go{padding:4px 10px;border:1px solid var(--seal-blue,#00356B);border-radius:4px;" +
        "background:var(--seal-blue,#00356B);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;}" +
      ".cobi-rsi-go[disabled]{opacity:.6;cursor:default;}" +
      ".cobi-rsi-out{padding:4px 10px;border:1px solid var(--border,#ccc);border-radius:4px;" +
        "background:var(--surface-2,#f5f5f5);font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;}" +
      ".cobi-rsi-who{font-size:.78rem;color:var(--text-body,#3A3A36);margin:0 0 .4rem;word-break:break-all;}" +
      ".cobi-rsi-msg{font-size:.72rem;margin-top:.4rem;min-height:1em;line-height:1.4;}" +
      ".cobi-rsi-msg.err{color:var(--danger-text,#c00);}" +
      ".cobi-rsi-msg.ok{color:var(--success-text,#2A7D4F);}";
    document.head.appendChild(st);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderMount(m) {
    if (!m || !m.el || !m.el.isConnected && !m.el.ownerDocument) return;
    ensureCss();
    var sess = getSession();
    m.el.innerHTML = "";
    var box = document.createElement("div");
    box.className = "cobi-rsi";

    var ttl = document.createElement("p");
    ttl.className = "cobi-rsi-ttl";
    ttl.textContent = sess ? "Signed in" : (m.title || "Admin sign-in");
    box.appendChild(ttl);

    if (sess) {
      var who = document.createElement("p");
      who.className = "cobi-rsi-who";
      // Never says "you are a reviewer" — this page cannot know that. The
      // database decides, and the gated tabs render that answer themselves.
      who.textContent = sess.email || "(signed in)";
      box.appendChild(who);
      var outBtn = document.createElement("button");
      outBtn.type = "button";
      outBtn.className = "cobi-rsi-out";
      outBtn.setAttribute("data-rsi-signout", "");
      outBtn.textContent = "Sign out";
      outBtn.addEventListener("click", function () {
        signOut();
        renderAll();
        refreshActiveTab();
      });
      box.appendChild(outBtn);
      m.el.appendChild(box);
      return;
    }

    var sub = document.createElement("p");
    sub.className = "cobi-rsi-sub";
    sub.textContent = m.blurb
      || "A personal one-time link, for the tabs the team phrase does not open (Admin, Team Phrases). Your address must be on the reviewer list.";
    box.appendChild(sub);

    var row = document.createElement("div");
    row.className = "cobi-rsi-row";
    var input = document.createElement("input");
    input.type = "email";
    input.className = "cobi-rsi-in";
    input.placeholder = "you@rccd.edu";
    input.autocomplete = "email";
    input.setAttribute("data-rsi-email", "");
    input.setAttribute("aria-label", "Your reviewer email address");
    input.value = m.draft || "";
    input.addEventListener("input", function () { m.draft = input.value; });

    var go = document.createElement("button");
    go.type = "button";
    go.className = "cobi-rsi-go";
    go.setAttribute("data-rsi-send", "");
    go.textContent = "Email me a link";

    var out = document.createElement("div");
    out.className = "cobi-rsi-msg" + (m.msgKind ? " " + m.msgKind : "");
    out.setAttribute("data-rsi-msg", "");
    out.textContent = m.msg || "";

    // Write through the mount record FIRST, then reflect it on whichever node
    // is live RIGHT NOW — never on the `out` captured when this closure was
    // built. A re-render between "Sending…" and the result (init() re-running,
    // a tab activation, a sign-out elsewhere) detaches that node, and writing
    // to it leaves the control frozen on "Sending…" forever: the send looks
    // like it hung when it actually succeeded or failed. Same fix, same reason,
    // as team_phrase_header.js's say().
    function say(text, kind) {
      m.msg = text; m.msgKind = kind || "";
      var live = (m.el && m.el.querySelector("[data-rsi-msg]")) || out;
      if (!live) return;
      live.className = "cobi-rsi-msg" + (m.msgKind ? " " + m.msgKind : "");
      live.textContent = m.msg;
    }

    // Same staleness rule as say(): re-enable the button that is live now, not
    // the one captured above, or a re-render mid-send leaves a dead control.
    function busy(on) {
      var live = (m.el && m.el.querySelector("[data-rsi-send]")) || go;
      if (live) live.disabled = !!on;
    }

    function submit() {
      var v = String(m.draft || input.value || "").trim();
      // Deliberately permissive — the server is the authority on the address.
      // A regex strict enough to be worth having rejects real addresses.
      if (!v || v.indexOf("@") < 1) { say("Enter your email address.", "err"); return; }
      busy(true);
      say("Sending…", "");
      sendLink(v, m.returnTab).then(function (r) {
        busy(false);
        // Confirm on r.ok ONLY. An unconditional confirmation thanks someone
        // for a link that was never sent, and they wait for mail that is not
        // coming — the Sky155 "send note" defect, which is why the typed
        // address is KEPT here on failure instead of being cleared.
        if (r && r.ok) {
          m.draft = "";
          say("✓ Check your email — the link signs you in and returns you here.", "ok");
          return;
        }
        say("Could not send the link (" + ((r && r.status) || "no response")
          + "). Your address is still here — try again.", "err");
      }).catch(function (e) {
        busy(false);
        say("Could not reach the sign-in service (" + (e && e.message ? e.message : "network error")
          + "). Your address is still here — try again.", "err");
      });
    }

    go.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); m.draft = input.value; submit(); }
    });

    row.appendChild(input);
    row.appendChild(go);
    box.appendChild(row);
    box.appendChild(out);
    m.el.appendChild(box);
  }

  function renderAll() { mounts.forEach(renderMount); }

  // Mount the control into `el`. opts: {title?, blurb?, returnTab?}.
  // Re-mounting the same element replaces its record rather than stacking a
  // second listener set — admin.js re-renders its whole pane on every read.
  function mountInto(el, opts) {
    if (!el) return null;
    opts = opts || {};
    var m = null;
    for (var i = 0; i < mounts.length; i++) { if (mounts[i].el === el) { m = mounts[i]; break; } }
    if (!m) { m = { el: el, draft: "", msg: "", msgKind: "" }; mounts.push(m); }
    m.title = opts.title;
    m.blurb = opts.blurb;
    m.returnTab = opts.returnTab;
    renderMount(m);
    return m;
  }

  // Drop mounts whose element has left the document, so a tab that re-renders
  // repeatedly doesn't grow the list forever.
  function prune() {
    mounts = mounts.filter(function (m) {
      try { return m.el && m.el.ownerDocument && m.el.ownerDocument.contains(m.el); } catch (e) { return false; }
    });
  }

  // ── About-panel mount ─────────────────────────────────────────────────────
  function mountAbout() {
    if (typeof document === "undefined") return null;
    var panel = document.getElementById("cobiAboutPanel");
    if (!panel) return null;
    var host = panel.querySelector(".cobi-rsi-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "cobi-rsi-host";
      panel.appendChild(host);
    }
    return mountInto(host, {
      title: "Admin sign-in",
      blurb: "A personal one-time link, for the tabs the team phrase does not open (Admin, Team Phrases). Your address must be on the reviewer list."
    });
  }

  var inited = false;
  function init() {
    ensureCss();
    mountAbout();
    if (inited) return;
    inited = true;
    // The session can be minted by the magic-link callback or dropped by
    // another surface; re-render so About never shows a stale identity.
    window.addEventListener("cpl-tab-activated", function () { prune(); renderAll(); });
    window.addEventListener("cpl-reviewer-signed-out", function () { prune(); renderAll(); });
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(function () { mountAbout(); });
  }

  window.CPL_REVIEWER_SIGNIN = {
    init: init,
    mountInto: mountInto,
    mountAbout: mountAbout,
    render: renderAll,
    getSession: getSession,
    signOut: signOut,
    _sendLink: sendLink,
    _currentTab: currentTab,
    _mounts: function () { return mounts; },
    _prune: prune,
    SESSION_KEY: SESSION_KEY,
    RETURN_KEY: RETURN_KEY
  };

  if (typeof module !== "undefined" && module.exports) module.exports = window.CPL_REVIEWER_SIGNIN;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
