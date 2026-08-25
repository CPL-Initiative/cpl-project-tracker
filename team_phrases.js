/* team_phrases.js — 🔑 Team Phrases admin tab (window.CPL_TEAM_PHRASES)
 *
 * Sam, 2026-08-12: "I lost track of where Manage team phrases is. It should be
 * a tab that requires a magic link to view, though it should show up as a tab."
 *
 * It used to be a ⚙ button inside the Team & RACI auth bar, rendered ONLY to a
 * signed-in reviewer — so a phrase holder never saw it existed, and a reviewer
 * had to remember which tab it was buried in. Now it is a tab: listed in the
 * nav for everyone, contents gated on a magic-link reviewer sign-in.
 *
 * WHY REVIEWER-ONLY, AND WHY THE TEAM PHRASE MUST NOT OPEN IT. A phrase holder
 * being able to read or rotate the phrases would erase the difference between
 * holding a key and controlling who holds it — rotation is only meaningful if
 * the people you are rotating away from cannot read the new value. So this is
 * the one surface the phrase deliberately does NOT unlock, and the boundary is
 * server-side: public.team_access carries ONLY ta_select/ta_update, both
 * is_allowed_reviewer(). This module cannot widen that; it just presents it.
 *
 * ⚠ A NON-REVIEWER READ RETURNS [] , NOT 403 — PostgREST applies the RLS USING
 * clause as a filter. So "zero rows" is ambiguous: it means either "you are not
 * a reviewer" or "the table is empty". Rendering it as "no phrases" would tell a
 * locked-out user the opposite of the truth. We know the roster is non-empty, so
 * an empty read from a signed-in session is reported as NOT AUTHORISED.
 *
 * STATIC — NOT a daily-cron artifact. Lazy-loaded on first #team-phrases open.
 * Tests: tests/team_phrases.test.js
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var REST = SUPABASE_URL + "/rest/v1";

  // The roster. `slot` is the localStorage key this phrase lives in on a
  // browser that holds it — kept in sync on save so the editor is not locked
  // out by their own rotation. `null` = no client slot (ci has no site gate).
  var PHRASES = [
    /* The shared phrase. Its row was stored under the id `raci` from the days
     * it lived on the Team & RACI tab — a tab Sam renamed to "Team" on
     * 2026-08-15, leaving the phrase named after something that no longer
     * existed. `legacy` lets this find the row under EITHER id, so renaming the
     * database row and deploying this file can happen in either order without a
     * window where the card renders blank. A blank card is the dangerous state:
     * typing into it and saving would create a SECOND row, and team_pass_check
     * matches ANY secret in the table — two live shared phrases, one of them
     * invisible to whoever rotated the other. */
    { id: "team", legacy: "raci", label: "Shared team phrase", slot: "cpl_team_pass",
      opens: "Every shared team tab — the Workplan, Budget, Memory, MAP Users, Governance, Sierra Training and the rest.",
      who: "Everyone on the MAP team who curates anything." },
    { id: "ci", label: "C&I", slot: null,
      opens: "The shared team tabs. Curriculum & Instruction has no gated tables of its own today, so this opens nothing extra.",
      who: "C&I colleagues. Note it is currently equivalent to the shared phrase." },
    { id: "gr", label: "Government Relations", slot: "cpl_gr_pass",
      opens: "The GR Priorities tab (pre-decisional advocacy material) — plus the shared team tabs.",
      who: "The small group cleared for pre-decisional advocacy work." },
    { id: "fin", label: "Finance", slot: "cpl_fin_pass",
      opens: "The Contracts register (vendor payment terms) — plus the shared team tabs.",
      who: "Whoever works the contract register." }
  ];
  function defOf(id) {
    for (var i = 0; i < PHRASES.length; i++) {
      if (PHRASES[i].id === id || PHRASES[i].legacy === id) return PHRASES[i];
    }
    return null;
  }

  /* The id this phrase's row is ACTUALLY stored under right now.
   *
   * Read from the rows we just fetched rather than assumed, so a PATCH always
   * targets a row that exists. Falls back to the canonical id when nothing has
   * loaded — writing to the new id is the right guess when there is no evidence,
   * and the read that follows will correct the display either way. */
  function rowIdOf(def) {
    if (!def) return null;
    if (state.rows) {
      if (state.rows[def.id]) return def.id;
      if (def.legacy && state.rows[def.legacy]) return def.legacy;
    }
    return def.id;
  }
  function rowFor(def) {
    if (!def || !state.rows) return null;
    return state.rows[def.id] || (def.legacy ? state.rows[def.legacy] : null) || null;
  }

  var state = {
    sess: null,
    rows: null,          // id -> secret. null = not loaded
    loadState: "idle",   // idle | loading | ok | unauthorized | error | signedout
    error: null,
    reveal: {},          // id -> bool (never persisted)
    draft: {},           // id -> in-progress value
    busy: {},            // id -> save in flight
    msg: {},             // id -> {text, kind}
    signInMsg: ""
  };

  // ── Auth (shared cpl_sb magic-link session — the raci.js shape) ───────────
  function isValidJwt(t) { return typeof t === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t); }
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token) && (s.refresh_token || !s.exp || s.exp > Date.now())) return s;
    } catch (e) {}
    try { sessionStorage.removeItem("cpl_sb"); } catch (e) {}
    return null;
  }
  function refreshToken(rt) {
    return fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST", headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("refresh " + r.status)); });
  }
  // An access token expires (~1h) while still LOOKING valid, so refresh before
  // every call or a dead token 401s while the UI still says "Signed in".
  function ensureFresh() {
    // Re-read: refresh tokens rotate, so a cached session can hold a CONSUMED
    // one after a sibling module (or the cpl_session.js keeper) renewed. See
    // credential_reference.js — same line, same reason.
    var s = getSession() || state.sess;
    if (!s) return Promise.resolve(null);
    state.sess = s;
    if (s.exp && s.exp <= Date.now() + 60000 && s.refresh_token) {
      return refreshToken(s.refresh_token).then(function (tok) {
        if (!isValidJwt(tok.access_token)) throw new Error("bad refresh");
        s = { access_token: tok.access_token, refresh_token: tok.refresh_token || s.refresh_token,
          email: s.email, exp: Date.now() + (parseInt(tok.expires_in || "3600", 10) * 1000) };
        state.sess = s;
        try { sessionStorage.setItem("cpl_sb", JSON.stringify(s)); } catch (e) {}
        return s;
      }).catch(function () {
        state.sess = null; try { sessionStorage.removeItem("cpl_sb"); } catch (e) {}
        return null;
      });
    }
    return Promise.resolve(s);
  }
  function headersFor(s) {
    return { apikey: SUPABASE_ANON, Authorization: "Bearer " + ((s && s.access_token) || SUPABASE_ANON) };
  }
  function signIn(email) {
    // sessionStorage is PER BROWSER TAB and the magic link opens a NEW one, so a
    // stash written here was invisible where it is read. The keeper writes both.
    if (window.CPL_SESSION && CPL_SESSION.stashReturnTab) CPL_SESSION.stashReturnTab("team-phrases");
    else try { sessionStorage.setItem("cpl_sb_return_tab", "team-phrases"); } catch (e) {}
    var redirect = encodeURIComponent(location.origin + location.pathname);
    return fetch(SUPABASE_URL + "/auth/v1/otp?redirect_to=" + redirect, {
      method: "POST", headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, create_user: true })
    });
  }
  function signOut() {
    try { sessionStorage.removeItem("cpl_sb"); } catch (e) {}
    state.sess = null; state.rows = null; state.loadState = "signedout";
  }

  // ── Load ─────────────────────────────────────────────────────────────────
  function load(root) {
    state.sess = getSession();
    if (!state.sess) { state.loadState = "signedout"; state.rows = null; render(root); return Promise.resolve(); }
    state.loadState = "loading";
    render(root);
    return ensureFresh().then(function (s) {
      if (!s) { state.loadState = "signedout"; return null; }
      return fetch(REST + "/team_access?select=id,secret,updated_at&order=id.asc", { headers: headersFor(s) })
        .then(function (r) {
          if (!r.ok) throw new Error("read " + r.status);
          return r.json();
        })
        .then(function (rows) {
          // ⚠ The ambiguity this tab exists to get right. A signed-in NON-reviewer
          // is filtered to zero rows by the RLS USING clause and gets 200 + [] —
          // identical in shape to "the table is empty". The roster is known to be
          // non-empty, so [] here means NOT AUTHORISED, and saying "no phrases
          // configured" would tell a locked-out person the exact opposite.
          if (!Array.isArray(rows) || rows.length === 0) {
            state.loadState = "unauthorized"; state.rows = null; return null;
          }
          var map = {};
          rows.forEach(function (r) { map[r.id] = r; });
          state.rows = map; state.loadState = "ok"; state.error = null;
          return map;
        });
    }).catch(function (e) {
      // A failed READ is not an empty result — never render this as "none".
      state.loadState = "error"; state.error = e.message || String(e); state.rows = null;
    }).then(function () { render(root); });
  }

  function save(id, root) {
    var def = defOf(id);
    var v = (state.draft[id] != null ? state.draft[id] : "").trim();
    if (!def) return;
    if (!v) { state.msg[id] = { text: "The phrase can't be empty.", kind: "err" }; render(root); return; }
    state.busy[id] = true; state.msg[id] = { text: "Saving…", kind: "" }; render(root);
    ensureFresh().then(function (s) {
      if (!s) throw new Error("your sign-in expired — sign in again");
      return fetch(REST + "/team_access?id=eq." + encodeURIComponent(rowIdOf(def)), {
        method: "PATCH",
        headers: Object.assign(headersFor(s), {
          "Content-Type": "application/json", Prefer: "return=representation"
        }),
        body: JSON.stringify({ secret: v, updated_at: new Date().toISOString() })
      });
    }).then(function (r) {
      if (!r.ok) throw new Error("save failed (" + r.status + ")");
      return r.json();
    }).then(function (rows) {
      // PostgREST answers a policy-filtered UPDATE with 200 + an EMPTY body, not
      // 403 — so an "ok" write must also prove it touched a row, or a rotation
      // that silently changed nothing reads as success.
      if (Array.isArray(rows) && rows.length === 0) throw new Error("not saved — your sign-in isn't a reviewer");
      var live = rowFor(def);
      if (live) live.secret = v;
      // Keep this browser's own stored copy in sync so the editor is not locked
      // out by their own rotation — only the slot THIS phrase lives in.
      try {
        if (def.slot && localStorage.getItem(def.slot)) localStorage.setItem(def.slot, v);
      } catch (e) {}
      state.busy[id] = false;
      state.draft[id] = null;
      state.msg[id] = { text: "✓ Saved. Share the new " + def.label + " phrase with the people who need it.", kind: "ok" };
      render(root);
    }).catch(function (e) {
      state.busy[id] = false;
      state.msg[id] = { text: e.message || String(e), kind: "err" };
      render(root);
    });
  }

  // ── CSS ──────────────────────────────────────────────────────────────────
  function ensureCss() {
    if (document.getElementById("tphx-css")) return;
    var st = document.createElement("style");
    st.id = "tphx-css";
    st.textContent = [
      "#team-phrases-root{padding:0 0 2rem;max-width:900px;margin:0 auto;}",
      ".tphx h2{color:var(--navy-primary,#0A2240);margin:0 0 .25rem;}",
      ".tphx-intro{color:var(--text-faint,#555);font-size:.9rem;margin:0 0 1rem;max-width:var(--cpl-measure,none);line-height:1.5;}",
      ".tphx-gatechip{display:inline-block;font-size:.62rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;",
      "background:var(--gold-accent,#B8860B);color:var(--navy-primary,#0A2240);border-radius:4px;padding:.1rem .4rem;vertical-align:middle;margin-left:.4rem;}",
      ".tphx-card{background:var(--surface-0,#fff);border:1px solid var(--border,#e0e0e0);border-radius:10px;padding:14px 16px;margin-bottom:12px;}",
      ".tphx-card h3{margin:0 0 .2rem;font-size:1rem;color:var(--navy-primary,#0A2240);}",
      ".tphx-opens{font-size:.82rem;color:var(--text-body,#444);margin:.1rem 0 .3rem;line-height:1.45;}",
      ".tphx-who{font-size:.78rem;color:var(--text-muted,#6b7280);margin:0 0 .6rem;}",
      ".tphx-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}",
      ".tphx-in{flex:1 1 240px;min-width:0;padding:6px 10px;border:1px solid var(--border-strong,#ccc);border-radius:6px;font-size:.9rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}",
      ".tphx-btn{padding:6px 12px;border:1px solid var(--border-strong,#ccc);border-radius:6px;background:var(--surface-subtle,#f5f5f5);font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;color:var(--text-body,#333);}",
      ".tphx-btn:hover{background:var(--surface-muted,#ececec);}",
      ".tphx-btn[disabled]{opacity:.5;cursor:default;}",
      ".tphx-btn-go{background:var(--seal-blue,#00356B);color:#fff;border-color:var(--seal-blue,#00356B);}",
      ".tphx-msg{font-size:.78rem;margin-top:6px;min-height:1em;}",
      ".tphx-msg.err{color:var(--danger-text,#c00);}",
      ".tphx-msg.ok{color:var(--success-text,#2A7D4F);}",
      ".tphx-warn{font-size:.82rem;background:var(--mustard-fill,#f2dca0);color:var(--text-strong,#3a2f00);border-radius:8px;padding:10px 14px;margin:0 0 1rem;line-height:1.5;}",
      ".tphx-gate{background:var(--surface-1,#fafbfc);border:1px solid var(--border,#e0e0e0);border-radius:10px;padding:18px;max-width:560px;}",
      ".tphx-gate h3{margin:0 0 .4rem;font-size:1rem;color:var(--navy-primary,#0A2240);}",
      ".tphx-gate p{font-size:.85rem;color:var(--text-body,#444);line-height:1.5;margin:.3rem 0 .8rem;}",
      ".tphx-slot{font-size:.72rem;color:var(--text-muted,#6b7280);margin-top:.4rem;}",
      "@media (max-width:640px){.tphx-in{flex-basis:100%;}}"
    ].join("");
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function render(root) {
    if (!root) return;
    ensureCss();
    var h = '<div class="tphx">';
    h += '<h2>🔑 Team Phrases <span class="tphx-gatechip">Reviewer sign-in</span></h2>';
    h += '<p class="tphx-intro">The shared phrases that unlock COBI\'s team tabs — what each one opens, and how to '
      + "change one. Viewing and changing them needs a <b>magic-link sign-in</b>, not a phrase: someone who only holds "
      + "a phrase must not be able to read or rotate it, or rotating away from them would mean nothing.</p>";

    if (state.loadState === "loading") {
      h += '<div class="tphx-gate"><p>Loading…</p></div></div>';
      root.innerHTML = h; return;
    }

    // Not signed in — the tab is visible to everyone, its contents are not.
    if (state.loadState === "signedout" || !state.sess) {
      h += '<div class="tphx-gate"><h3>Sign in to view the phrases</h3>'
        + "<p>We'll email you a one-time link. Your address has to be on the reviewer list — "
        + "the phrases themselves are only readable to a reviewer, enforced by the database, not by this page.</p>"
        + '<div class="tphx-row">'
        + '<input class="tphx-in" type="email" data-email placeholder="you@rccd.edu" autocomplete="email">'
        + '<button class="tphx-btn tphx-btn-go" data-signin>Email me a link</button></div>'
        + '<div class="tphx-msg' + (/^✓/.test(state.signInMsg) ? " ok" : (state.signInMsg ? " err" : "")) + '">'
        + esc(state.signInMsg) + "</div></div></div>";
      root.innerHTML = h; wire(root); return;
    }

    // Signed in, but the read came back empty → filtered out by RLS. Saying
    // "no phrases" here would be the opposite of the truth.
    if (state.loadState === "unauthorized") {
      h += '<div class="tphx-gate"><h3>Signed in, but not as a reviewer</h3>'
        + "<p>You're signed in as <b>" + esc((state.sess && state.sess.email) || "(unknown)") + "</b>, but that address "
        + "isn't on the reviewer list, so the database returns nothing here. This is not an empty list — it's a "
        + "closed door. Ask an existing reviewer to add you.</p>"
        + '<div class="tphx-row"><button class="tphx-btn" data-signout>Sign out</button></div></div></div>';
      root.innerHTML = h; wire(root); return;
    }

    if (state.loadState === "error") {
      h += '<div class="tphx-gate"><h3>Could not read the phrases</h3>'
        + "<p>" + esc(state.error || "unknown error") + ". This is a failed read, <b>not</b> an empty list — "
        + "nothing has been changed. Try again, or sign in afresh.</p>"
        + '<div class="tphx-row"><button class="tphx-btn" data-reload>Try again</button>'
        + '<button class="tphx-btn" data-signout>Sign out</button></div></div></div>';
      root.innerHTML = h; wire(root); return;
    }

    h += '<p class="tphx-warn">⚠ Changing a phrase takes effect immediately for everyone. Anyone holding the old one '
      + "is locked out until you tell them the new one — there is no notification. Your own browser is updated "
      + "automatically so you don't lock yourself out.</p>";
    h += '<div class="tphx-row" style="margin-bottom:.8rem;"><span style="font-size:.8rem;color:var(--text-muted,#6b7280);">'
      + "Signed in as <b>" + esc((state.sess && state.sess.email) || "(reviewer)") + "</b></span>"
      + '<button class="tphx-btn" data-signout>Sign out</button></div>';

    PHRASES.forEach(function (def) {
      var row = rowFor(def);
      var val = state.draft[def.id] != null ? state.draft[def.id] : (row ? row.secret : "");
      var shown = !!state.reveal[def.id];
      var m = state.msg[def.id];
      h += '<div class="tphx-card">'
        + "<h3>" + esc(def.label) + "</h3>"
        + '<p class="tphx-opens"><b>Opens:</b> ' + esc(def.opens) + "</p>"
        + '<p class="tphx-who"><b>Who needs it:</b> ' + esc(def.who) + "</p>";
      if (!row) {
        // A phrase in the roster with no row in the table — say so plainly
        // rather than rendering a blank box that looks editable.
        h += '<p class="tphx-msg err">No row for “' + esc(def.id) + "” in team_access — it has never been set.</p>";
      } else {
        h += '<div class="tphx-row">'
          + '<input class="tphx-in" type="' + (shown ? "text" : "password") + '" data-phrase="' + esc(def.id) + '" '
          + 'value="' + esc(val) + '" autocomplete="off" spellcheck="false">'
          + '<button class="tphx-btn" data-reveal="' + esc(def.id) + '">' + (shown ? "Hide" : "Reveal") + "</button>"
          + '<button class="tphx-btn tphx-btn-go" data-save="' + esc(def.id) + '"'
          + (state.busy[def.id] ? " disabled" : "") + ">" + (state.busy[def.id] ? "Saving…" : "Save") + "</button>"
          + "</div>";
        h += '<div class="tphx-msg' + (m && m.kind ? " " + m.kind : "") + '">' + esc(m ? m.text : "") + "</div>";
        if (def.slot) {
          h += '<div class="tphx-slot">Stored on a holder\'s browser as <code>' + esc(def.slot) + "</code>.</div>";
        }
      }
      h += "</div>";
    });

    h += "</div>";
    root.innerHTML = h;
    wire(root);
  }

  function wire(root) {
    var si = root.querySelector("[data-signin]");
    if (si) {
      si.addEventListener("click", function () {
        var em = root.querySelector("[data-email]");
        var v = (em && em.value || "").trim();
        if (!v) { state.signInMsg = "Enter your email address."; render(root); return; }
        si.disabled = true;
        state.signInMsg = "Sending…"; render(root);
        signIn(v).then(function (r) {
          state.signInMsg = r.ok ? "✓ Check your email for the sign-in link."
            : "Could not send the link (" + r.status + ").";
          render(root);
        }).catch(function () {
          state.signInMsg = "Could not reach the server — try again in a moment.";
          render(root);
        });
      });
    }
    var so = root.querySelector("[data-signout]");
    if (so) so.addEventListener("click", function () { signOut(); render(root); });
    var rl = root.querySelector("[data-reload]");
    if (rl) rl.addEventListener("click", function () { load(root); });

    root.querySelectorAll("[data-reveal]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-reveal");
        state.reveal[id] = !state.reveal[id];
        render(root);
      });
    });
    root.querySelectorAll("[data-phrase]").forEach(function (inp) {
      inp.addEventListener("input", function () { state.draft[inp.getAttribute("data-phrase")] = inp.value; });
    });
    root.querySelectorAll("[data-save]").forEach(function (b) {
      b.addEventListener("click", function () { save(b.getAttribute("data-save"), root); });
    });
  }

  function activate() {
    var root = document.getElementById("team-phrases-root");
    if (!root) return;
    load(root);
  }

  window.CPL_TEAM_PHRASES = {
    activate: activate,
    render: render,
    PHRASES: PHRASES,
    _state: state,
    _defOf: defOf,
    _load: load,
    _save: save,
    _getSession: getSession
  };

  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "team-phrases") activate();
  });
})();
