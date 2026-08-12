/*
 * COBI — masthead team-phrase unlock (window.CPL_TEAM_PHRASE_HEADER)
 *
 * Sam, 2026-08-12: "look at each COBI tab and make sure there is a place to
 * enter the team phrase wherever needed … might be more efficient to just add
 * it to the main header … Since we select from the Site drop down initially, it
 * would have to be aware of that and respond to the correct team phrase."
 *
 * WHY A HEADER CONTROL. Seven tabs (Contracts, Governance, MAP Users, NC /
 * Learning Partners, Sierra Training, MAP Queue, College Briefing) consume the
 * phrase but never offered a box — each rendered "sign in on the Team & RACI
 * tab … and re-open this tab." Two of them gate a READ, so the bounce cost the
 * whole tab, not just the pen. One always-present control removes that.
 *
 * SITE AWARENESS — what it does and does NOT mean. Selecting a site does not
 * change which phrase is *valid*; team_pass_ok() matches any secret in
 * team_access, so every SHARED tab takes any phrase ("allow either", Sam's
 * call). What a site changes is which phrase a tab EXCLUSIVE to it requires:
 * cobi_orgs.js EXCLUSIVE == the only tabs that can carry a site phrase without
 * locking out CPL users, because every other tab is also a CPL tab. Today that
 * is gr-priorities (gr_pass_ok, shipped) and contracts (fin_pass_ok, this PR).
 * So this control offers the ACTIVE SITE's phrase when that site has one, and
 * the shared phrase otherwise — and it says which, rather than implying an
 * isolation the database does not enforce.
 *
 * Each site phrase lives in its OWN localStorage slot (cpl_gr_pass /
 * cpl_fin_pass, alongside the shared cpl_team_pass), so holding Finance never
 * costs you the shared phrase — no swapping, no lockout.
 *
 * STATIC — NOT a daily-cron artifact. Runtime-injected (the cobi_orgs.js
 * pattern) so the daily regen of the masthead can never strand it; only the
 * <script> tag is mirrored in BOTH HTMLs (Rule 4). Loads AFTER team_phrase.js
 * + cobi_orgs.js. Tests: tests/team_phrase_sites.test.js
 */
(function () {
  "use strict";

  var TP = null;             // window.CPL_TEAM_PHRASE, resolved lazily
  // Popover state lives HERE, not in the DOM — render() rewrites the wrapper,
  // and it is re-entered from rAF, tab activation and the site switcher. Left in
  // the DOM, a re-render arriving mid-typing silently swallowed both the
  // half-typed phrase and the "that doesn't match" line, so the control looked
  // like it had simply ignored the click.
  var openPane = false;      // popover visibility
  var draft = "";            // in-progress phrase text
  var msg = "";              // inline result line
  var msgKind = "";          // "" | "err" | "ok"

  function tp() {
    if (!TP && typeof window !== "undefined") TP = window.CPL_TEAM_PHRASE || null;
    return TP;
  }

  // Which site is showing, and does it have a phrase of its own?
  function activeSite() {
    try {
      var orgs = window.CPL_ORGS;
      var cur = orgs && typeof orgs.current === "function" ? orgs.current() : null;
      return (cur && cur.id) || null;
    } catch (e) { return null; }
  }
  // The scope this control unlocks: a site id when that site has its own gate,
  // else null (the shared team phrase).
  function scope() {
    var t = tp(), s = activeSite();
    return (t && s && t.siteDef(s)) ? s : null;
  }
  function scopeLabel(sc) {
    var t = tp(), d = t && sc ? t.siteDef(sc) : null;
    return d ? d.label : "Team";
  }
  function held(sc) {
    var t = tp();
    if (!t) return false;
    return sc ? !!t.siteGet(sc) : !!t.get();
  }

  function ensureCss() {
    if (document.getElementById("cobi-tph-css")) return;
    var st = document.createElement("style");
    st.id = "cobi-tph-css";
    st.textContent =
      ".cobi-tph{position:relative;display:inline-flex;align-items:center;margin-left:10px;font-family:inherit;}" +
      ".cobi-tph-btn{font-size:.78rem;font-weight:700;line-height:1.35;cursor:pointer;font-family:inherit;" +
        "color:var(--text-strong,#243b53);background:var(--surface-2,rgba(20,20,30,0.05));" +
        "border:1px solid var(--border,#cdd5dd);border-radius:6px;padding:3px 8px;}" +
      ".cobi-tph-btn:hover{border-color:var(--seal-blue,#00356B);}" +
      ".cobi-tph-btn:focus-visible{outline:2px solid var(--seal-blue,#00356B);outline-offset:1px;}" +
      ".cobi-tph-btn.on{color:var(--success-text,#2A7D4F);border-color:var(--success-text,#2A7D4F);}" +
      ".cobi-tph-pane{position:absolute;top:calc(100% + 6px);right:0;z-index:60;min-width:250px;" +
        "background:var(--surface-0,#fff);border:1px solid var(--border,#cdd5dd);border-radius:8px;" +
        "box-shadow:0 6px 20px rgba(0,0,0,.16);padding:10px;}" +
      ".cobi-tph-ttl{font-size:.78rem;font-weight:700;color:var(--text-strong,#243b53);margin:0 0 4px;}" +
      ".cobi-tph-sub{font-size:.72rem;color:var(--text-muted,#6b7280);margin:0 0 8px;line-height:1.4;}" +
      ".cobi-tph-row{display:flex;gap:6px;align-items:center;}" +
      ".cobi-tph-in{flex:1 1 auto;min-width:0;padding:4px 8px;border:1px solid var(--border,#ccc);" +
        "border-radius:4px;font-size:.8rem;font-family:inherit;}" +
      ".cobi-tph-go{padding:4px 10px;border:1px solid var(--seal-blue,#00356B);border-radius:4px;" +
        "background:var(--seal-blue,#00356B);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;}" +
      ".cobi-tph-lock{padding:4px 10px;border:1px solid var(--border,#ccc);border-radius:4px;" +
        "background:var(--surface-2,#f5f5f5);font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;}" +
      ".cobi-tph-msg{font-size:.72rem;margin-top:6px;min-height:1em;}" +
      ".cobi-tph-msg.err{color:var(--danger-text,#c00);}" +
      ".cobi-tph-msg.ok{color:var(--success-text,#2A7D4F);}" +
      "@media (max-width:640px){.cobi-tph{margin-left:6px;}.cobi-tph-pane{right:auto;left:0;}}";
    document.head.appendChild(st);
  }

  // After an unlock, tabs already on screen must re-read. Most gated tabs
  // already listen for cpl-tab-activated, so re-dispatching it for the LIVE tab
  // reuses proven wiring instead of adding a bespoke listener to each one.
  function refreshActiveTab() {
    try {
      var cur = window.CPL_TABS && typeof window.CPL_TABS.current === "function"
        ? window.CPL_TABS.current() : null;
      if (cur) window.dispatchEvent(new CustomEvent("cpl-tab-activated", { detail: { tab: cur } }));
    } catch (e) { /* ignore */ }
  }

  function render() {
    var host = document.querySelector(".header .cobi-brand");
    if (!host) return;
    var wrap = host.querySelector(".cobi-tph");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "cobi-tph";
      host.appendChild(wrap);
    }
    var sc = scope(), label = scopeLabel(sc), unlocked = held(sc);
    wrap.innerHTML = "";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cobi-tph-btn" + (unlocked ? " on" : "");
    btn.textContent = (unlocked ? "🔓 " : "🔒 ") + label;
    btn.setAttribute("aria-expanded", openPane ? "true" : "false");
    btn.title = unlocked
      ? label + " editing is unlocked on this browser"
      : "Enter the " + label + " phrase to view and edit gated tabs";
    btn.addEventListener("click", function () {
      openPane = !openPane; msg = ""; msgKind = ""; draft = ""; render();
    });
    wrap.appendChild(btn);
    if (!openPane) return;

    var pane = document.createElement("div");
    pane.className = "cobi-tph-pane";
    var ttl = document.createElement("p");
    ttl.className = "cobi-tph-ttl";
    ttl.textContent = unlocked ? label + " phrase — held" : "Enter the " + label + " phrase";
    pane.appendChild(ttl);

    var sub = document.createElement("p");
    sub.className = "cobi-tph-sub";
    // Say plainly what this phrase opens. A site phrase ALSO opens the shared
    // tabs (team_pass_ok matches any secret) — stating that is the difference
    // between describing the gate and implying an isolation it does not have.
    sub.textContent = sc
      ? "Opens the " + label + " tabs, plus every shared team tab."
      : "Opens the shared team tabs. Tabs belonging to one site only (Government Relations, Finance) ask for their own phrase.";
    pane.appendChild(sub);

    if (unlocked) {
      var lockBtn = document.createElement("button");
      lockBtn.type = "button";
      lockBtn.className = "cobi-tph-lock";
      lockBtn.textContent = "Lock again";
      lockBtn.addEventListener("click", function () {
        var t = tp(); if (!t) return;
        if (sc) t.siteClear(sc); else t.clear();
        msg = ""; openPane = false; render(); refreshActiveTab();
      });
      pane.appendChild(lockBtn);
      wrap.appendChild(pane);
      return;
    }

    var row = document.createElement("div");
    row.className = "cobi-tph-row";
    var input = document.createElement("input");
    input.type = "password";
    input.className = "cobi-tph-in";
    input.placeholder = label.toLowerCase() + " phrase…";
    input.autocomplete = "off";
    input.value = draft;
    input.setAttribute("aria-label", label + " phrase");
    input.addEventListener("input", function () { draft = input.value; });
    var go = document.createElement("button");
    go.type = "button";
    go.className = "cobi-tph-go";
    go.textContent = "Unlock";
    var out = document.createElement("div");
    out.className = "cobi-tph-msg" + (msgKind ? " " + msgKind : "");
    out.textContent = msg;

    // Write through module state so a re-render (rAF, tab switch, site change)
    // cannot lose the line, then reflect it on the node that is live right now.
    function say(text, kind) {
      msg = text; msgKind = kind || "";
      var live = document.querySelector(".header .cobi-brand .cobi-tph .cobi-tph-msg");
      if (live) { live.className = "cobi-tph-msg" + (msgKind ? " " + msgKind : ""); live.textContent = msg; }
    }

    function submit() {
      var t = tp();
      if (!t) { say("unlock helper not loaded", "err"); return; }
      var v = (draft || input.value || "").trim();
      if (!v) { say("Enter the phrase.", "err"); return; }
      go.disabled = true;
      say("Checking…", "");
      t.unlock(v, sc).then(function (ok) {
        go.disabled = false;
        if (ok === true) {
          msg = ""; msgKind = ""; draft = ""; openPane = false;
          render();
          refreshActiveTab();
        } else if (ok === null) {
          // TRANSIENT — never report a wrong phrase we could not actually check.
          say("Couldn't reach the server — try again in a moment.", "err");
        } else {
          say("That doesn't match — check with the team.", "err");
        }
      });
    }
    go.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); draft = input.value; submit(); }
    });
    row.appendChild(input);
    row.appendChild(go);
    pane.appendChild(row);
    pane.appendChild(out);
    wrap.appendChild(pane);
    try { input.focus(); } catch (e) { /* ignore */ }
  }

  var inited = false;
  function init() {
    ensureCss();
    render();
    if (inited) return;
    inited = true;
    // The site switcher rewrites the masthead's identity tag on change; re-render
    // so the control follows the selected site (Finance ⇄ shared).
    window.addEventListener("hashchange", render);
    window.addEventListener("cpl-tab-activated", function () { render(); });
    // Another surface (a tab's own unlock box) may have stored a phrase.
    window.addEventListener("cpl-team-pass-unlocked", function () { openPane = false; render(); });
    window.addEventListener("cpl-team-pass-dropped", function () { render(); });
    // Close on outside click so the popover doesn't sit over the nav.
    document.addEventListener("click", function (e) {
      if (!openPane) return;
      var wrap = document.querySelector(".header .cobi-brand .cobi-tph");
      if (wrap && !wrap.contains(e.target)) { openPane = false; render(); }
    });
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(render);
  }

  window.CPL_TEAM_PHRASE_HEADER = {
    init: init,
    render: render,
    _scope: scope,
    _scopeLabel: scopeLabel,
    _held: held,
    _refreshActiveTab: refreshActiveTab,
    _setOpen: function (v) { openPane = !!v; },
    _isOpen: function () { return openPane; }
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
