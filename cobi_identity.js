/*
 * COBI — masthead identity chip (window.COBI_IDENTITY)
 *
 * Sam, 2026-08-25: "Seems to me that both the team unlock and the magic link
 * login should show on the COBI header level with something like, 'Hi CPL team,
 * you're unlocked and may curate.' or 'Hi Sam, you're logged in and may
 * curate.'"
 *
 * WHAT THIS IS, AND THE ONE PLACE IT DEPARTS FROM THAT ASK.
 *
 * The greeting form is his and it is right: "Hi CPL team" vs "Hi <person>" is
 * not decoration, it IS the provenance — a shared secret with no identity and
 * no per-person revocation, versus a person. Two credentials, two grammars.
 *
 * But "and may curate" is a claim this chip cannot make truthfully, because
 * access is per TABLE, not global. On the Memory tab a team phrase can edit and
 * mark inactive and CANNOT delete (`reviewer deletes cpl_memory` has no
 * team_pass arm). A reviewer reaches map_student_credit — 537,908 student-grain
 * rows — plus kb_curation, the gr_* register and team_access itself; a phrase
 * reaches none of them. Five tabs are reviewer-only, twenty-four take the
 * phrase. A masthead sentence saying "you may curate" would be wrong on a lot
 * of screens, and that is the display-is-not-security trap the Admin tab
 * already carries a note about.
 *
 * So the split is: THIS CHIP SAYS WHO YOU ARE AND HOW. EACH TAB SAYS WHAT THAT
 * BUYS THERE. The chip never asserts a capability.
 *
 * WHY THE UTILITY STRIP AND NOT THE 🔒 LOCK. reviewer_signin.js's own docstring
 * settles this: the masthead lock is SITE-SCOPED (it re-labels Team ⇄ GR ⇄
 * Finance as you switch sites) and a reviewer sign-in is a personal identity
 * that is not site-scoped in any way — nesting one in the other would imply an
 * isolation the database does not enforce. This is a SIBLING control in
 * .cobi-utility, beside About, which is already the home for account-shaped
 * meta actions. It DELEGATES: the phrase's control is still
 * CPL_TEAM_PHRASE_HEADER, the sign-in box is still CPL_REVIEWER_SIGNIN. A
 * second copy of either is a second thing that can drift.
 *
 * WHAT IT FIXES ALONG THE WAY.
 *
 *   * tabs.js's rail badge has been HALF-BLIND since it was written: it reads
 *     only the magic-link session, so a team-phrase holder curating happily was
 *     told "— not signed in · use a curator tab to sign in". Both surfaces now
 *     read through read() and speak through greeting(), so they cannot disagree.
 *
 *   * "use a curator tab to sign in" was an instruction with no door — the same
 *     shape as the Memory banner that told a signed-in curator to "re-unlock"
 *     while rendering no unlock row (#1330). Every state here carries the
 *     control that state needs.
 *
 *   * cpl_session.js announces `cpl-session-changed`; tabs.js listened only for
 *     `cpl-auth-change`. The keeper's announcements reached nothing in the rail.
 *     Both names are honored here and in tabs.js.
 *
 * SIGNED IN IS NOT REVIEWER, AND FRESH IS NOT A SHAPE. The OTP endpoint mints a
 * session for any address; whether it can read anything is RLS's call. And a
 * token's SHAPE cannot tell a live one from an hour-dead one — thirteen modules
 * check only the shape, which is how a page comes to insist you are signed in
 * while every write 401s. This reads through cpl_session.js, which knows `exp`,
 * and reports the remaining life rather than implying it is unlimited.
 *
 * NO NAME IS INVENTED. COBI stores no display name for anyone — allowed_reviewers
 * is (email, added_at) and nothing else — so "Hi Sam" is only ever said when the
 * credential itself carries a name. Otherwise the chip names the address, which
 * is true. See the note in nameFrom().
 *
 * STATIC — NOT a daily-cron artifact. Runtime-injected (the cobi_brand.js /
 * team_phrase_header.js pattern) so the generator's regen of the masthead can
 * never strand it, and so no markup needs mirroring across both HTMLs; only the
 * <script> tag is mirrored (Rule 4). Loads AFTER cpl_session.js, team_phrase.js
 * and reviewer_signin.js. Tests: tests/cobi_identity.test.js
 */
(function () {
  "use strict";

  var CSS_ID = "cobi-identity-css";
  var SESSION_KEY = "cpl_sb";
  var openPane = false;          // popover state lives HERE, not in the DOM:
                                 // render() rewrites the wrapper and is re-entered
                                 // from events, so DOM-held state is swallowed.

  function isValidJwt(t) { return typeof t === "string" && t.split(".").length === 3 && t.length > 40; }

  // ── reading the two credentials ──────────────────────────────────────────
  function rawSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      return s && isValidJwt(s.access_token) ? s : null;
    } catch (e) { return null; }
  }
  // A name is used ONLY if the credential carries one. Supabase puts whatever
  // the account has under user_metadata; an OTP-only account usually has
  // nothing, and COBI stores no roster of names to fall back on. Guessing one
  // from an address ("slee" → "Sam") would be a fabricated identity on the most
  // visible line of the page.
  function nameFrom(sess) {
    if (!sess || !isValidJwt(sess.access_token)) return null;
    try {
      var part = sess.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      while (part.length % 4) part += "=";
      var claims = JSON.parse(typeof atob === "function" ? atob(part) : "null");
      var m = (claims && claims.user_metadata) || {};
      var n = m.full_name || m.name || m.display_name || (claims && claims.name) || null;
      return (typeof n === "string" && n.trim()) ? n.trim() : null;
    } catch (e) { return null; }
  }
  function readReviewer() {
    var K = typeof window !== "undefined" ? window.CPL_SESSION : null;
    var s = (K && K.get) ? K.get() : rawSession();
    if (!s || !isValidJwt(s.access_token)) return null;
    return {
      email: s.email || null,
      name: nameFrom(s),
      // MEASURED, not assumed. Null when the session shape carries no `exp`
      // (an older one) — which is reported as unknown, never as fresh-forever.
      fresh: (K && K.isFresh) ? !!K.isFresh(s) : null,
      expiresInMs: (K && K.expiresInMs) ? K.expiresInMs() : null,
    };
  }
  function activeSite() {
    try {
      var O = window.CPL_ORGS;
      if (O && typeof O.current === "function") { var c = O.current(); return (c && c.id) || c || null; }
    } catch (e) { /* fall through */ }
    return null;
  }
  function readPhrase() {
    var TP = typeof window !== "undefined" ? window.CPL_TEAM_PHRASE : null;
    if (!TP) return null;
    var site = activeSite(), s = null;
    try { s = (site && TP.sessionFor) ? TP.sessionFor(site) : (TP.session ? TP.session() : null); } catch (e) { s = null; }
    if (!s || !s.teamPass) return null;
    // `email` on a phrase pseudo-session is the SLOT label — "(team)" for the
    // shared phrase, "(finance)"/"(gr)" for a site's own. It is the only thing
    // that distinguishes them, so it is carried rather than flattened.
    var slot = String(s.email || "(team)").replace(/^\(|\)$/g, "");
    return { site: s.site || null, slot: slot, shared: slot === "team" };
  }
  function read() { return { reviewer: readReviewer(), phrase: readPhrase() }; }

  // ── the sentence ─────────────────────────────────────────────────────────
  // ONE function, called by the masthead chip AND by tabs.js's rail badge. The
  // two surfaces disagreeing about whether you are signed in is precisely the
  // defect this replaces, so they share the sentence rather than each deriving
  // one. Returns {text, short, tone} — tone is a WORD-bearing state name, never
  // a color on its own.
  function greeting(st) {
    st = st || read();
    var r = st.reviewer, p = st.phrase;
    // The GREETING form is used only when a name exists. "Hi slee@cccco.edu" is
    // not a greeting, and inventing "Sam" from the address would put a
    // fabricated identity on the most visible line of the page. With no name,
    // the sentence states the fact instead of performing a welcome.
    var named = r && r.name ? r.name : null;
    var addr = r ? (r.email || "a reviewer") : null;
    var phraseWord = p ? (p.shared ? "the team phrase" : "the " + p.slot + " phrase") : null;
    if (r && p) {
      return { tone: "both", short: named ? "Hi " + named : "Signed in",
        text: named
          ? "Hi " + named + " — signed in, and " + phraseWord + " is unlocked."
          : "Signed in as " + addr + ", and " + phraseWord + " is unlocked." };
    }
    if (r) {
      return { tone: "reviewer", short: named ? "Hi " + named : "Signed in",
        text: named ? "Hi " + named + " — signed in as yourself." : "Signed in as " + addr + "." };
    }
    if (p) {
      // No identity behind a shared secret, so the greeting addresses the team.
      // That IS the provenance: nothing here can say who typed it.
      return { tone: "phrase", short: "Hi CPL team",
        text: "Hi CPL team — unlocked by " + phraseWord + "." };
    }
    return { tone: "none", short: "Not unlocked", text: "Not unlocked." };
  }
  // Remaining life, said plainly. An unknown expiry says so; it must not read
  // as "no expiry", because that is the belief that costs a curator their edit.
  function expiryLine(r) {
    if (!r) return "";
    if (r.expiresInMs == null) return "This browser can’t tell when it expires; it renews itself while COBI is open.";
    var mins = Math.round(r.expiresInMs / 60000);
    if (mins <= 0) return "Expired — it renews itself, or use Sign out and in again.";
    if (mins < 60) return "About " + mins + " minute" + (mins === 1 ? "" : "s") + " left; it renews itself while COBI is open.";
    var hrs = Math.round(mins / 60);
    return "About " + hrs + " hour" + (hrs === 1 ? "" : "s") + " left; it renews itself while COBI is open.";
  }

  // ── CSS ──────────────────────────────────────────────────────────────────
  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
    var s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = [
      ".cobi-ident{position:relative;order:0;}",
      ".cobi-ident-btn{font-family:'Source Sans 3',Arial,sans-serif!important;font-size:.74rem!important;",
      "font-weight:600!important;background:none!important;border:none!important;cursor:pointer;",
      "padding:.15rem .3rem!important;display:inline-flex!important;align-items:center;gap:.3rem;",
      "white-space:nowrap;transition:color .15s;color:var(--text-faint,#87877F)!important;}",
      ".cobi-ident-btn:hover{color:var(--cobalt,#0047AB)!important;}",
      ".cobi-ident-btn:focus-visible{outline:2px solid var(--cobalt,#0047AB);outline-offset:2px;}",
      // State is carried by the WORD in the label; the tint only reinforces it.
      ".cobi-ident-btn.is-on{color:var(--hunter,#2C601A)!important;}",
      ".cobi-ident-dot{width:.5rem;height:.5rem;border-radius:50%;background:currentColor;flex:none;}",
      ".cobi-ident-pane{position:absolute;right:0;top:calc(100% + .4rem);z-index:300;width:290px;",
      "background:var(--surface-opaque,#fff);border:1px solid var(--border-strong,rgba(28,28,26,.30));",
      "border-radius:8px;box-shadow:0 10px 30px rgba(20,20,30,.16);padding:.8rem .9rem;display:none;text-align:left;}",
      ".cobi-ident-pane.open{display:block;}",
      ".cobi-ident-h{font-family:'Source Sans 3',sans-serif;font-size:.72rem;letter-spacing:.06em;",
      "text-transform:uppercase;color:var(--text-muted,#5C5C55);margin:0 0 .35rem;}",
      ".cobi-ident-say{font-size:.86rem;font-weight:700;color:var(--text-strong,#1C1C1A);margin:0 0 .3rem;line-height:1.35;}",
      ".cobi-ident-sub{font-size:.75rem;color:var(--text-muted,#5C5C55);margin:0 0 .5rem;line-height:1.4;}",
      ".cobi-ident-row{display:flex;align-items:flex-start;gap:.4rem;font-size:.78rem;line-height:1.4;",
      "color:var(--text-body,#3A3A36);padding:.25rem 0;border-top:1px solid var(--border,rgba(28,28,26,.14));}",
      ".cobi-ident-row:first-of-type{border-top:none;}",
      ".cobi-ident-mark{flex:none;font-weight:700;}",
      ".cobi-ident-act{font-family:'Source Sans 3',sans-serif;font-size:.78rem;font-weight:600;",
      "color:var(--cobalt,#0047AB);background:none;border:none;text-align:left;cursor:pointer;padding:.25rem 0;}",
      ".cobi-ident-act:hover{text-decoration:underline;}",
      ".cobi-ident-act:focus-visible{outline:2px solid var(--cobalt,#0047AB);outline-offset:2px;}",
      ".cobi-ident-note{font-size:.72rem;color:var(--text-faint,#87877F);margin:.45rem 0 0;line-height:1.4;",
      "border-top:1px solid var(--border,rgba(28,28,26,.14));padding-top:.4rem;}",
      ".cobi-ident-host{margin:.35rem 0 0;}",
      "@media (max-width:560px){.cobi-ident-pane{width:min(290px,86vw);}}",
    ].join("");
    document.head.appendChild(s);
  }

  // ── render ───────────────────────────────────────────────────────────────
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function render() {
    if (typeof document === "undefined") return;
    var host = document.querySelector(".header .cobi-utility");
    if (!host) return;
    ensureCss();
    var wrap = host.querySelector(".cobi-ident");
    if (!wrap) { wrap = el("span", "cobi-ident"); host.insertBefore(wrap, host.firstChild); }
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

    var st = read(), g = greeting(st);
    var btn = el("button", "cobi-ident-btn" + (g.tone === "none" ? "" : " is-on"));
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", openPane ? "true" : "false");
    btn.appendChild(el("span", "cobi-ident-dot"));
    btn.appendChild(el("span", null, g.short));
    btn.appendChild(el("span", null, "▾"));
    btn.title = g.text;
    btn.onclick = function (e) { e.stopPropagation(); openPane = !openPane; render(); };
    wrap.appendChild(btn);

    if (!openPane) return;
    var pane = el("div", "cobi-ident-pane open");
    pane.appendChild(el("div", "cobi-ident-h", "Your access"));
    pane.appendChild(el("p", "cobi-ident-say", g.text));

    // ── the reviewer row ──
    var rRow = el("div", "cobi-ident-row");
    rRow.appendChild(el("span", "cobi-ident-mark", st.reviewer ? "✓" : "—"));
    var rBody = el("div");
    rBody.appendChild(el("div", null, st.reviewer
      ? "Signed in as " + (st.reviewer.email || "a reviewer") + "."
      : "Not signed in as yourself."));
    if (st.reviewer) {
      var xl = expiryLine(st.reviewer);
      if (xl) rBody.appendChild(el("div", "cobi-ident-sub", xl));
      var out = el("button", "cobi-ident-act", "Sign out");
      out.type = "button";
      out.onclick = function () {
        var R = window.CPL_REVIEWER_SIGNIN;
        if (R && R.signOut) R.signOut();
        else if (window.CPL_SESSION && window.CPL_SESSION.signOut) window.CPL_SESSION.signOut();
        openPane = false; renderAll();
      };
      rBody.appendChild(out);
    } else {
      // THE SHARED IMPLEMENTATION, mounted where the reader is. A second copy
      // of a sign-in box is a second thing that can drift, and "sign in on
      // another tab" is the bounce this chip exists to end.
      var signHost = el("div", "cobi-ident-host");
      rBody.appendChild(signHost);
      var R2 = window.CPL_REVIEWER_SIGNIN;
      if (R2 && R2.mountInto) { try { R2.mountInto(signHost); } catch (e) { /* leave the row honest */ } }
      if (!signHost.firstChild) rBody.appendChild(el("div", "cobi-ident-sub", "The sign-in box is in the ℹ About menu."));
    }
    rRow.appendChild(rBody);
    pane.appendChild(rRow);

    // ── the phrase row ──
    var pRow = el("div", "cobi-ident-row");
    pRow.appendChild(el("span", "cobi-ident-mark", st.phrase ? "✓" : "—"));
    var pBody = el("div");
    pBody.appendChild(el("div", null, st.phrase
      ? "Team phrase held" + (st.phrase.shared ? "." : " (" + st.phrase.slot + ").")
      : "No team phrase."));
    var TPH = window.CPL_TEAM_PHRASE_HEADER;
    if (!st.phrase && TPH && TPH.open) {
      // DELEGATE to the one real control. It is site-scoped — it offers the
      // active site's phrase when that site has one — and reproducing that here
      // would mean two implementations of a rule that is easy to get subtly
      // wrong. Opening it puts the reader in front of the genuine box.
      var unlock = el("button", "cobi-ident-act", "Unlock with a team phrase");
      unlock.type = "button";
      unlock.onclick = function () { openPane = false; render(); TPH.open(); };
      pBody.appendChild(unlock);
    } else if (!st.phrase) {
      pBody.appendChild(el("div", "cobi-ident-sub", "Use the 🔒 control beside the COBI title."));
    }
    pRow.appendChild(pBody);
    pane.appendChild(pRow);

    // THE LINE THAT KEEPS THIS HONEST. What a credential opens is decided per
    // table by RLS, not here, and the two credentials do not nest: a phrase can
    // curate tables a reviewer sign-in is not required for, and a reviewer
    // reaches tables no phrase does.
    pane.appendChild(el("p", "cobi-ident-note",
      "What each one opens differs by tab — the tab itself will say. Signing in doesn’t make you a reviewer; that’s decided per table."));
    wrap.appendChild(pane);
  }

  function renderAll() { render(); if (window.CPL_TABS && window.CPL_TABS.renderRailAuth) window.CPL_TABS.renderRailAuth(); }

  var _wired = false;
  function init() {
    if (typeof document === "undefined") return;
    render();
    if (_wired) return;
    _wired = true;
    // BOTH event names. cpl_session.js announces `cpl-session-changed`;
    // the older curator tabs announce `cpl-auth-change`; team_phrase.js
    // announces `cpl-team-pass-unlocked`. Listening for one of three is how a
    // badge comes to sit stale next to a credential that has changed.
    ["cpl-session-changed", "cpl-auth-change", "cpl-team-pass-unlocked", "focus", "cpl-tab-activated"]
      .forEach(function (ev) { window.addEventListener(ev, renderAll); });
    window.addEventListener("storage", function (e) {
      if (!e || !e.key || e.key === "cpl_sb" || e.key.indexOf("cpl_") === 0) renderAll();
    });
    document.addEventListener("click", function () { if (openPane) { openPane = false; render(); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openPane) { openPane = false; render(); } });
  }

  window.COBI_IDENTITY = {
    init: init,
    render: render,
    renderAll: renderAll,
    read: read,
    greeting: greeting,
    _expiryLine: expiryLine,
    _nameFrom: nameFrom,
    _setOpen: function (v) { openPane = !!v; },
    _isOpen: function () { return openPane; },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = window.COBI_IDENTITY;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
