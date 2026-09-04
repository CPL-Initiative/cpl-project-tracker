/*
 * COBI — shared team-phrase unlock box  ·  window.CPL_TEAM_PHRASE_HEADER
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
 * ⚠️ IT IS NO LONGER A CONTROL OF ITS OWN (Sam, 2026-09-04). This used to
 * render a 🔒/🔓 button into .cobi-brand with its own popover, one cluster away
 * from the magic-link sign-in that lives in the identity chip. Two doors to the
 * same room, in two places, one of them a glyph: "move the team phrase stuff in
 * proximity to the magic link login … no need for the cheesy unlock glyph if we
 * note that the CPL team is logged in with the phrase."
 *
 * So this module keeps ALL of the phrase logic and gives up its chrome: it
 * exposes mountInto(el), the same shape reviewer_signin.js already uses, and
 * cobi_identity.js mounts it beside the sign-in box so both credentials are
 * read and entered in one pane. ONE IMPLEMENTATION, ANY NUMBER OF MOUNTS — a
 * second copy of an unlock box is a second thing that can drift, and the
 * site-scope rule below is exactly the kind of rule that drifts silently.
 *
 * WHAT THE MERGE MUST NOT LOSE. cobi_identity.js's docstring argued the lock
 * should stay OUT of the identity chip, because the phrase is SITE-SCOPED and a
 * reviewer session is not, and nesting one in the other would imply an
 * isolation the database does not enforce. That argument is about the COPY, not
 * the container: the fix is that the mounted box still says which phrase it is
 * offering and what that phrase opens (the "Opens the … tabs" line below), so
 * the scoping is stated where it is entered rather than implied by position.
 *
 * SITE AWARENESS — what it does and does NOT mean. Selecting a site does not
 * change which phrase is *valid*; team_pass_ok() matches any secret in
 * team_access, so every SHARED tab takes any phrase ("allow either", Sam's
 * call). What a site changes is which phrase a tab EXCLUSIVE to it requires:
 * cobi_orgs.js EXCLUSIVE == the only tabs that can carry a site phrase without
 * locking out CPL users, because every other tab is also a CPL tab. Today that
 * is gr-priorities (gr_pass_ok) and contracts (fin_pass_ok). So this box offers
 * the ACTIVE SITE's phrase when that site has one, and the shared phrase
 * otherwise — and it says which, rather than implying an isolation the database
 * does not enforce.
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

  // Per-mount state lives on the mount record, NOT in the DOM — renderMount()
  // rewrites the block and is re-entered from tab activation, the site
  // switcher and the unlock result. Left in the DOM, a re-render arriving
  // mid-typing silently swallowed both the half-typed phrase and the "that
  // doesn't match" line, so the box looked like it had ignored the click.
  var mounts = [];

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
  // The scope this box unlocks: a site id when that site has its own gate,
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
    if (typeof document === "undefined" || document.getElementById("cobi-tph-css")) return;
    var st = document.createElement("style");
    st.id = "cobi-tph-css";
    // The box is mounted INSIDE another pane now, so it carries no surface,
    // border or shadow of its own — those belong to the host. What it keeps is
    // the geometry of its own row and the two message tones.
    st.textContent =
      ".cobi-tph{display:block;font-family:inherit;margin:.15rem 0 0;}" +
      ".cobi-tph-sub{font-size:.72rem;color:var(--text-muted,#5C5C55);margin:0 0 .35rem;line-height:1.4;}" +
      ".cobi-tph-row{display:flex;gap:6px;align-items:center;}" +
      ".cobi-tph-in{flex:1 1 auto;min-width:0;padding:4px 8px;border:1px solid var(--border,#ccc);" +
        "border-radius:4px;font-size:.8rem;font-family:inherit;}" +
      ".cobi-tph-in:focus-visible{outline:2px solid var(--cobalt,#0047AB);outline-offset:1px;}" +
      ".cobi-tph-go{padding:4px 10px;border:1px solid var(--seal-blue,#00356B);border-radius:4px;" +
        "background:var(--seal-blue,#00356B);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;}" +
      ".cobi-tph-go:focus-visible{outline:2px solid var(--cobalt,#0047AB);outline-offset:2px;}" +
      // min-height 24px is WCAG 2.2 SC 2.5.8 (target size); measured 65x22.
      ".cobi-tph-lock{font-family:inherit;font-size:.78rem;font-weight:600;color:var(--cobalt,#0047AB);" +
        "background:none;border:none;text-align:left;cursor:pointer;padding:.25rem 0;" +
        "min-height:24px;display:inline-flex;align-items:center;}" +
      ".cobi-tph-lock:hover{text-decoration:underline;}" +
      ".cobi-tph-lock:focus-visible{outline:2px solid var(--cobalt,#0047AB);outline-offset:2px;}" +
      ".cobi-tph-msg{font-size:.72rem;margin-top:6px;min-height:1em;}" +
      ".cobi-tph-msg.err{color:var(--red-alert,#B3261E);}" +
      ".cobi-tph-msg.ok{color:var(--hunter,#2C601A);}";
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

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function renderMount(m) {
    if (!m || !m.el) return;
    ensureCss();
    var host = m.el;
    while (host.firstChild) host.removeChild(host.firstChild);

    var sc = scope(), label = scopeLabel(sc), unlocked = held(sc);
    var wrap = el("div", "cobi-tph");
    host.appendChild(wrap);

    if (unlocked) {
      var lockBtn = el("button", "cobi-tph-lock", "Lock again");
      lockBtn.type = "button";
      lockBtn.addEventListener("click", function () {
        var t = tp(); if (!t) return;
        if (sc) t.siteClear(sc); else t.clear();
        m.msg = ""; m.msgKind = ""; renderAll(); refreshActiveTab();
      });
      wrap.appendChild(lockBtn);
      return;
    }

    // Say plainly what this phrase opens. A site phrase ALSO opens the shared
    // tabs (team_pass_ok matches any secret) — stating that is the difference
    // between describing the gate and implying an isolation it does not have.
    // This line is what lets the box live inside the identity pane without
    // implying the phrase is scoped the way a personal sign-in is.
    wrap.appendChild(el("p", "cobi-tph-sub", sc
      ? "Opens the " + label + " tabs, plus every shared team tab."
      : "Opens the shared team tabs. Tabs belonging to one site only (Government Relations, Finance) ask for their own phrase."));

    var row = el("div", "cobi-tph-row");
    var input = el("input", "cobi-tph-in");
    input.type = "password";
    input.placeholder = label.toLowerCase() + " phrase…";
    input.autocomplete = "off";
    input.value = m.draft || "";
    input.setAttribute("aria-label", label + " phrase");
    input.addEventListener("input", function () { m.draft = input.value; });
    var go = el("button", "cobi-tph-go", "Unlock");
    go.type = "button";
    var out = el("div", "cobi-tph-msg" + (m.msgKind ? " " + m.msgKind : ""));
    out.textContent = m.msg || "";
    out.setAttribute("role", "status");

    // Write through mount state, then reflect it on the node that is LIVE RIGHT
    // NOW — re-looked-up, never the `out` captured above.
    //
    // ⚠️ This is not defensive style, it is the bug. A render can land between
    // "Checking…" and the server's answer (the identity pane re-renders on its
    // own events, and renderMount rebuilds the block from scratch), which
    // detaches the captured node. Writing the verdict to a detached element
    // leaves "Checking…" on screen forever and the reader concludes the button
    // is broken. Caught by "a wrong phrase says so inline" — which passed for
    // the closure version only until the pane re-rendered.
    function say(text, kind) {
      m.msg = text; m.msgKind = kind || "";
      var live = m.el && m.el.querySelector(".cobi-tph-msg");
      if (live) {
        live.className = "cobi-tph-msg" + (m.msgKind ? " " + m.msgKind : "");
        live.textContent = m.msg;
      }
    }

    function submit() {
      var t = tp();
      if (!t) { say("unlock helper not loaded", "err"); return; }
      var v = (m.draft || input.value || "").trim();
      if (!v) { say("Enter the phrase.", "err"); return; }
      go.disabled = true;
      say("Checking…", "");
      t.unlock(v, sc).then(function (ok) {
        go.disabled = false;
        if (ok === true) {
          m.msg = ""; m.msgKind = ""; m.draft = "";
          renderAll();
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
      if (e.key === "Enter") { e.preventDefault(); m.draft = input.value; submit(); }
    });
    row.appendChild(input);
    row.appendChild(go);
    wrap.appendChild(row);
    wrap.appendChild(out);
  }

  // Drop mounts whose element has left the document, so a pane that re-renders
  // repeatedly doesn't grow the list forever.
  function prune() {
    mounts = mounts.filter(function (m) {
      try { return m.el && m.el.ownerDocument && m.el.ownerDocument.contains(m.el); }
      catch (e) { return false; }
    });
  }

  function renderAll() {
    prune();
    mounts.forEach(renderMount);
    // The identity chip owns the greeting that names this credential; it has to
    // re-read after an unlock or a re-lock or it sits stale beside its own box.
    try {
      if (window.COBI_IDENTITY && window.COBI_IDENTITY.renderAll) window.COBI_IDENTITY.renderAll();
    } catch (e) { /* ignore */ }
  }

  // THE mount point API — the same shape reviewer_signin.js exposes, so the
  // identity pane treats both credentials identically.
  function mountInto(host) {
    if (!host) return null;
    // The identity pane hands us a FRESH host on every open, so prune here as
    // well as in renderAll(): otherwise opening and closing the pane grows the
    // mount list forever without a render ever collecting it.
    prune();
    var m = null;
    for (var i = 0; i < mounts.length; i++) { if (mounts[i].el === host) { m = mounts[i]; break; } }
    if (!m) { m = { el: host, draft: "", msg: "", msgKind: "" }; mounts.push(m); }
    renderMount(m);
    return m;
  }

  var inited = false;
  function init() {
    ensureCss();
    renderAll();
    if (inited) return;
    inited = true;
    // The site switcher changes which phrase this box offers (Finance ⇄ shared),
    // so re-render on the same signals the old masthead control listened for.
    window.addEventListener("hashchange", renderAll);
    window.addEventListener("cpl-tab-activated", renderAll);
    // Another surface (a tab's own unlock box) may have stored a phrase.
    window.addEventListener("cpl-team-pass-unlocked", renderAll);
    window.addEventListener("cpl-team-pass-dropped", renderAll);
  }

  window.CPL_TEAM_PHRASE_HEADER = {
    init: init,
    mountInto: mountInto,
    render: renderAll,
    _scope: scope,
    _scopeLabel: scopeLabel,
    _held: held,
    _refreshActiveTab: refreshActiveTab,
    _mounts: function () { return mounts; }
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
