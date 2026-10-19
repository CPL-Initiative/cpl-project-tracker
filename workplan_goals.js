/*
 * workplan_goals.js — inline editor for the Workplan Goals tab.
 *
 * Phase 1 PR-5: hydrates the Python-rendered Workplan Goals + Annual Workplan
 * Goals tables with click-to-edit affordances. Year-cell GOAL/STRETCH values
 * write directly to Supabase public.workplan_goals via PATCH (no overlay layer
 * — workplan_goals IS the source of truth as of PR-4).
 *
 * Scope:
 *   - Per-cell GOAL/STRETCH year-ladder edit on existing rows
 *   - Add-activity flow (GOAL+STRETCH pair + associations)
 *   - Session 85: the Annual Workplan tab is the AUTHORITATIVE source —
 *       · manual "Current" editing for sub-activities NOT mapped to a live
 *         headline KPI; the KPI-mapped ones render the live value read-only
 *         (no edit affordance), so the table matches the headline card by
 *         construction. S426 (2026-10-19): Current is a five-year ladder like
 *         Goal and Stretch — one cell per year, stored as cur_<year> on the GOAL
 *         row (kb/supabase_workplan_goals_current_by_year.sql) and saved by the
 *         same editor the other two rows use.
 *       · sub-activity TITLE editing → PATCH projects.name (the single title
 *         store the Dashboard card editor also writes).
 *
 * Auth: shared magic-link session via sessionStorage `cpl_sb`. After sign-in,
 * editable cells light up; click → input → blur or Enter to save. Saves
 * optimistically update every cell with matching (activity_id, row_type, year)
 * so the workplan_goals + annual_goals tables both reflect the new value
 * without a page reload. Both public.workplan_goals and public.projects gate
 * writes on is_allowed_reviewer() (RLS) — the anon key alone can't write.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";

  // ─── DOM helpers ─────────────────────────────────────────────────────────
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "style") n.setAttribute("style", attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  // The ladder's five years: the column label, the Goal/Stretch column, the Current
  // column (S426), and the short label the phone card prints.
  var YEARS = [
    { lbl: "2025-26", key: "yr_2025_26", cur: "cur_2025_26", short: "25-26" },
    { lbl: "2026-27", key: "yr_2026_27", cur: "cur_2026_27", short: "26-27" },
    { lbl: "2027-28", key: "yr_2027_28", cur: "cur_2027_28", short: "27-28" },
    { lbl: "2028-29", key: "yr_2028_29", cur: "cur_2028_29", short: "28-29" },
    { lbl: "2029-30", key: "yr_2029_30", cur: "cur_2029_30", short: "29-30" }
  ];
  var YEAR_BY_SHORT = {};
  YEARS.forEach(function (y) { YEAR_BY_SHORT[y.short] = y; });

  // ─── Auth ────────────────────────────────────────────────────────────────
  function isValidJwt(t) {
    return typeof t === "string"
      && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
  }
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token)) return s;
    } catch (e) {}
    return null;
  }
  function signIn(email) {
    try {
      sessionStorage.setItem("cpl_sb_return_tab", "workplan-goals");
    } catch (e) {}
    var redirect = encodeURIComponent(location.origin + location.pathname);
    return fetch(SUPABASE_URL + "/auth/v1/otp?redirect_to=" + redirect, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, create_user: true })
    });
  }
  function signOut() {
    sessionStorage.removeItem("cpl_sb");
    if (window.CPL_TEAM_PHRASE) window.CPL_TEAM_PHRASE.clear();
  }

  // Phase 1 team-phrase widening (2026-07-03): a magic-link session wins;
  // otherwise the shared team phrase (localStorage cpl_team_pass, validated
  // server-side before store by team_phrase.js) yields a pseudo-session
  // {teamPass, email:"(team)"} — every gate here only checks truthiness.
  function fullSession() {
    return getSession()
      || (window.CPL_TEAM_PHRASE ? window.CPL_TEAM_PHRASE.session() : null);
  }

  // One header builder for every write: phrase sessions have no access_token,
  // so the bearer falls back to the ANON key and x-team-pass rides along
  // (RLS's team_pass_ok() reads the header; "Bearer undefined" would 401
  // before RLS even ran).
  function authHeaders(sess, prefer) {
    var h = {
      "apikey": SUPABASE_ANON,
      "Authorization": "Bearer " + ((sess && sess.access_token) || SUPABASE_ANON),
      "Content-Type": "application/json"
    };
    if (prefer) h.Prefer = prefer;
    if (window.CPL_TEAM_PHRASE) window.CPL_TEAM_PHRASE.decorateHeaders(h, sess);
    else if (sess && sess.teamPass) h["x-team-pass"] = sess.teamPass;
    return h;
  }

  // A save queues the dashboard build (Sam, Open Asks Sheet 75 card 2, "both"), so the
  // Activities cards, the charts, the counts and the report follow within minutes. The
  // function (chatbox/supabase/functions/workplan-rebuild) checks the caller as these
  // writes do and dispatches daily-dashboard.yml, or says a build is already waiting.
  // Until its GitHub key is set it answers 503, and the page says "tonight" as before.
  function queueRebuild(sess) {
    var h = authHeaders(sess);
    return fetch(SUPABASE_URL + "/functions/v1/workplan-rebuild", { method: "POST", headers: h, body: "{}" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.queued ? j : null; })
      .catch(function () { return null; });
  }
  // Rows added or moved since the build show an editor at once (Sheet 75 card 2's first half):
  // each live sub-activity the table does not show, less a tabled, archived or D.* row,
  // gets a row under its home Activity naming it until the build draws it in full, and
  // a drawn row whose id no longer exists (moved away) leaves.
  function paintNewRows(state) {
    var host = document.getElementById("tab-workplan-goals");
    // An editor's own change shows at once; a reader sees it when the queued build lands.
    if (!host || !state || !state.sess) return Promise.resolve();
    var h = { headers: { "apikey": SUPABASE_ANON } };
    function rows(url) {
      return fetch(url, h).then(function (r) { return r.ok ? r.json() : []; })
        .then(function (x) { return Array.isArray(x) ? x : []; }).catch(function () { return []; });
    }
    return Promise.all([
      rows(SUPABASE_URL + "/rest/v1/projects?select=id,name"),
      rows(SUPABASE_URL + "/rest/v1/workplan_activity_associations?select=project_id,activity_id&is_primary=eq.true"),
      rows(SUPABASE_URL + "/rest/v1/project_lifecycle?select=project_id,state")
    ]).then(function (got) {
      var hidden = {}, home = {};
      got[2].forEach(function (l) { if (l && (l.state === "tabled" || l.state === "archived")) hidden[String(l.project_id)] = true; });
      got[1].forEach(function (a) { if (a) home[String(a.project_id)] = String(a.activity_id); });
      // A drawn row whose id no longer exists (moved since the build) leaves at once.
      var live = {};
      got[0].forEach(function (p) { live[String(p.id)] = true; });
      if (got[0].length) host.querySelectorAll('[data-title-edit="1"][data-pid]').forEach(function (t) {
        if (live[t.getAttribute("data-pid")]) return;
        var cell = t.closest ? t.closest("th[rowspan], td[rowspan]") : null;
        var row = cell ? cell.parentNode : null;
        for (var i = 0, n = cell ? (parseInt(cell.getAttribute("rowspan"), 10) || 1) : 0; i < n && row; i++) {
          row.hidden = true;
          row = row.nextElementSibling;
        }
      });
      got[0].forEach(function (p) {
        var id = String(p.id);
        if (!/^[0-9]+(\.[0-9]+)+$/.test(id) || hidden[id]) return;
        var q = (window.CSS && CSS.escape) ? CSS.escape(id) : id;
        if (host.querySelector('[data-title-edit="1"][data-pid="' + q + '"], .wpg-new-row[data-pid="' + q + '"]')) return;
        var act = home[id] || id.split(".")[0];
        var head = host.querySelector('[data-activity-title-edit="1"][data-aid="' + act + '"]');
        var body = head && head.closest ? head.closest("tbody") : null;
        var th = head && head.closest ? head.closest("th") : null;
        if (!body) return;
        var span = Math.max(1, (parseInt(th && th.getAttribute("colspan"), 10) || 2) - 1);
        var tr = el("tr", { "class": "wpg-new-row", "data-pid": id }, [
          el("th", { "scope": "row", "class": "wpg-name" }, [el("span", { "class": "wpg-pid" }, [id]), " " + String(p.name || "")]),
          el("td", { "colspan": String(span), "class": "wpg-new-note" }, ["Added since the last build. Its goals and current values draw with the next one."])
        ]);
        body.appendChild(tr);
      });
    });
  }

  function whenShown(q) {
    return q ? "within about 10 minutes, when the build it queued finishes" : "after tonight's rebuild";
  }

  // An RLS-filtered PATCH "succeeds": PostgREST returns 200 with an EMPTY
  // return=representation array when the policy's USING clause hides the
  // target rows (rotated phrase / non-reviewer session) — never a 401/403.
  // So every PATCH here must verify the representation before confirming
  // the optimistic paint (team_phrase.js checkWrite reports the empty case
  // as a 403-shaped failure so the phrase-drop recovery below engages).
  function writeResult(r) {
    if (window.CPL_TEAM_PHRASE && window.CPL_TEAM_PHRASE.checkWrite) {
      return window.CPL_TEAM_PHRASE.checkWrite(r);
    }
    return Promise.resolve({ ok: r.ok, status: r.status });
  }

  // Rotated/stale phrase → drop it and let init()'s listener re-render the
  // auth widget + editability, so the user sees the entry box again instead
  // of silent 401s (the raci.js #598 recovery).
  function maybeDropStalePhrase(sess, status) {
    if (window.CPL_TEAM_PHRASE
        && window.CPL_TEAM_PHRASE.handleWriteFailure(sess, status)) {
      try { window.dispatchEvent(new CustomEvent("cpl-team-pass-dropped")); } catch (e) {}
      return true;
    }
    return false;
  }

  // ─── Save ────────────────────────────────────────────────────────────────
  /**
   * PATCH a single year-column on a (activity_id, row_type [, kind]) row.
   * Also recomputes + sends the new `total` so the DB stays consistent.
   *
   * PR-B: `kind` is optional. When the edited cell carries a `data-kind`
   * attribute (PR-B onward — "project" or "activity"), it's added to the
   * filter so the PATCH never crosses the kind boundary. Pre-PR-B cells
   * have no data-kind and work as before (no kind filter); activity_ids
   * for activities ("1"-"5") and projects ("1.1", "1.2", ...) are
   * disjoint today so the unscoped PATCH is still safe.
   */
  function saveCell(activity_id, row_type, year_key, value, new_total, sess, kind) {
    var qs = "activity_id=eq." + encodeURIComponent(activity_id)
           + "&row_type=eq." + encodeURIComponent(row_type);
    if (kind) qs += "&kind=eq." + encodeURIComponent(kind);
    var body = {};
    body[year_key] = value;
    // A Current cell (cur_<year>, S426) leaves `total` alone: that column is the
    // Goal total of the row the Current values ride on.
    if (new_total !== null && new_total !== undefined) body.total = new_total;
    return fetch(SUPABASE_URL + "/rest/v1/workplan_goals?" + qs, {
      method: "PATCH",
      headers: authHeaders(sess, "return=representation"),
      body: JSON.stringify(body)
    });
  }

  /**
   * Session 85 — authoritative title editor. Writes to projects.name (the one
   * title store; the same field the Dashboard card editor patches). The Annual
   * Workplan table renders projects.name, so the edit is reflected on the next
   * regen across every surface.
   */
  function saveTitle(pid, name, sess) {
    return fetch(SUPABASE_URL + "/rest/v1/projects?id=eq."
        + encodeURIComponent(pid), {
      method: "PATCH",
      headers: authHeaders(sess, "return=representation"),
      body: JSON.stringify({ name: name })
    });
  }

  /**
   * Sub-activity brief-description editor. Writes projects.description (the one
   * store; the Annual Workplan tab renders it, so the edit flows to every
   * surface — Activities cards, RACI, reports — on the next regen).
   */
  function saveDesc(pid, description, sess) {
    return fetch(SUPABASE_URL + "/rest/v1/projects?id=eq."
        + encodeURIComponent(pid), {
      method: "PATCH",
      headers: authHeaders(sess, "return=representation"),
      body: JSON.stringify({ description: description })
    });
  }

  /**
   * What the numbers count (projects.kpi_unit, the short label the Activities
   * cards print beside the number) and how they are counted (projects.count_note,
   * Sam 2026-10-12). `patch` is { kpi_unit } or { count_note }.
   */
  function saveProjectField(pid, patch, sess) {
    return fetch(SUPABASE_URL + "/rest/v1/projects?id=eq."
        + encodeURIComponent(pid), {
      method: "PATCH",
      headers: authHeaders(sess, "return=representation"),
      body: JSON.stringify(patch)
    });
  }

  /**
   * Top-level Activity field editor. The 4 Activities are kind='activity' rows
   * in workplan_goals with TWO row_types (GOAL+STRETCH) that share the same
   * name + description, so we PATCH by (activity_id, kind='activity') to keep
   * both rows in sync. `patch` is { name } or { description }.
   */
  function saveActivityField(activity_id, patch, sess) {
    var qs = "activity_id=eq." + encodeURIComponent(activity_id)
           + "&kind=eq.activity";
    return fetch(SUPABASE_URL + "/rest/v1/workplan_goals?" + qs, {
      method: "PATCH",
      headers: authHeaders(sess, "return=representation"),
      body: JSON.stringify(patch)
    });
  }

  // ═══ Activity↔Project association editor ════════════════════════════════
  // The popover (open / render / save / optimistic-paint / rollback) lives in
  // the SHARED module assoc_editor.js (window.CPL_ASSOC_EDITOR), so the Workplan
  // Goals chips here and the Dashboard project cards use ONE popover bound by a
  // single delegated listener — no double-popover. This module only nudges the
  // shared editor to re-light its ✎ affordance after a sign-in / sign-out.
  function paintAssocEditability() {
    if (window.CPL_ASSOC_EDITOR) window.CPL_ASSOC_EDITOR.refresh();
  }

  // ─── Auth widget (the card's head row) ──────────────────────────────────
  // Mounted in the title row of the Annual card (.wpg-auth-slot, display:contents,
  // printed by render_annual_goals_table_html): the controls sit to the right of
  // the title and the hint or status line takes the next line. Before S426 it was
  // a gray band above the card. Returns { widget, hint }.
  function buildAuthWidget(state, onChange) {
    var widget = el("div", { "class": "wpg-auth-widget" }, []);
    var hint = el("p", { "class": "wpg-auth-hint", "role": "status", "aria-live": "polite" }, []);

    if (state.sess) {
      widget.appendChild(el("span", { "class": "wpg-auth-who" },
        state.sess.teamPass
          ? ["Editing unlocked (team phrase)"]
          : ["Signed in as ", state.sess.email || "(no email)"]));
      var btnAdd = el("button", { "class": "wpg-btn wpg-btn-add", "type": "button" }, ["Add sub-activity"]);
      btnAdd.addEventListener("click", function () { openAddModal(state); });
      widget.appendChild(btnAdd);
      var btnOut = el("button", { "class": "wpg-btn", "type": "button" }, [state.sess.teamPass ? "Lock" : "Sign out"]);
      btnOut.addEventListener("click", function () {
        signOut();
        onChange();
      });
      widget.appendChild(btnOut);
      hint.textContent = "Tab to an underlined value and press Enter to edit it. Enter saves, Esc cancels.";
    } else {
      widget.classList.add("wpg-auth-out");   // its own line under the title: the row is wide
      widget.appendChild(el("span", { "class": "wpg-auth-who" }, ["Sign in to edit (CCCCO MAP team)"]));
      var emailInput = el("input", {
        "type": "email",
        "placeholder": "you@example.edu",
        "aria-label": "Email address",
        "class": "wpg-auth-email"
      }, []);
      var btnIn = el("button", { "class": "wpg-btn", "type": "button" }, ["Sign in"]);
      function say(cls, text) { hint.className = "wpg-auth-hint" + (cls ? " " + cls : ""); hint.textContent = text; }

      btnIn.addEventListener("click", function () {
        var email = (emailInput.value || "").trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          say("err", "Enter a valid email address.");
          return;
        }
        say("", "Sending magic link...");
        signIn(email).then(function (r) {
          if (r.ok) {
            say("ok", "Magic link sent to " + email + ". Click the link in your inbox to finish signing in.");
          } else if (r.status === 429) {
            say("err", "Too many sign-in emails. Wait a few minutes, then try again.");
          } else if (r.status === 400 || r.status === 422) {
            say("err", "Server rejected the sign-in; confirm your email is on the allowed-reviewers list.");
          } else {
            say("err", "Sign-in failed (HTTP " + r.status + ").");
          }
        }).catch(function (e) {
          say("err", "Network error sending magic link: " + e.message);
        });
      });

      widget.appendChild(emailInput);
      widget.appendChild(btnIn);
      // Team-phrase alternative (Phase 1 widening, 2026-07-03) — validated
      // server-side before store; one unlock covers every phrase-enabled tab.
      if (window.CPL_TEAM_PHRASE) {
        var unlock = window.CPL_TEAM_PHRASE.unlockRow({
          blurb: "or the team phrase:",
          onUnlocked: function () { onChange(); }
        });
        // Controls are underlined words (Sam, 2026-10-09): this view converts the
        // shared row's boxed Unlock button at its UI pass (S375); other tabs keep
        // theirs until their own pass.
        var ub = unlock.querySelector("button");
        if (ub) { ub.removeAttribute("style"); ub.className = "wpg-btn"; }
        widget.appendChild(unlock);
      }
    }

    return { widget: widget, hint: hint };
  }

  function mountAuthWidget(state) {
    var tab = document.getElementById("tab-workplan-goals");
    if (!tab) return;
    var built = buildAuthWidget(state, function () {
      state.sess = fullSession();
      mountAuthWidget(state);
      paintEditability(state);
      // Shared editor re-lights its affordance + closes the popover on sign-out.
      paintAssocEditability();
    });
    // The slot in the card's head row; a page without one (an older build) keeps
    // the widget at the top of the tab.
    var slot = tab.querySelector(".wpg-auth-slot");
    if (!slot) {
      slot = tab.querySelector(".wpg-auth-wrap");
      if (!slot) {
        slot = el("div", { "class": "wpg-auth-wrap" }, []);
        tab.insertBefore(slot, tab.firstChild);
      }
    }
    while (slot.firstChild) slot.removeChild(slot.firstChild);
    slot.appendChild(built.widget);
    slot.appendChild(built.hint);
  }

  // ─── Editability painting ───────────────────────────────────────────────
  /**
   * For every cell with data-editable="1": toggle a class that exposes the
   * pointer-cursor + hover affordance based on whether we have a session.
   */
  function paintEditability(state) {
    // Session 85: light up the year-ladder cells (Goal, Current and Stretch alike
    // since S426) and the editable words. Live-synced Current cells carry no edit
    // attr, so they're never selected here (read-only by construction).
    var cells = document.querySelectorAll(
      '[data-editable="1"], [data-title-edit="1"], '
      + '[data-desc-edit="1"], [data-activity-title-edit="1"], [data-activity-desc-edit="1"], '
      + '[data-unit-edit="1"], [data-note-edit="1"]');
    // Every editable value takes Tab focus for an editor and opens on Enter or
    // Space (S375 UI pass: a mouse-only editor fails WCAG 2.1.1, Level A). A table
    // cell keeps its cell role, so its row and column headers still name it; a
    // word in the name cell becomes a button.
    cells.forEach(function (c) {
      var isCell = c.tagName === "TD" || c.tagName === "TH";
      if (state.sess) {
        c.classList.add("wpg-editable");
        c.setAttribute("tabindex", "0");
        if (!isCell) c.setAttribute("role", "button");
      } else {
        c.classList.remove("wpg-editable");
        c.removeAttribute("tabindex");
        if (!isCell) c.removeAttribute("role");
      }
    });
    paintEmptyPrompts(state);
    paintCountLines(state);
    paintSetTargets(state);
    paintActivityAddLinks(state);
    paintMoveLinks(state);
    paintTabledList(state);
  }

  // An empty description is hidden from a reader; an editor sees "Add
  // description" in its place (S375 UI pass: the bare "—" told neither anything).
  // The value itself lives in data-val, so the prompt is never saved as text.
  function paintEmptyPrompts(state) {
    document.querySelectorAll('[data-desc-edit="1"], [data-activity-desc-edit="1"]').forEach(function (c) {
      if (c.classList.contains("wpg-editing") || c.classList.contains("wpg-saving")) return;
      if (!c.hasAttribute("data-val")) return;
      var val = (c.getAttribute("data-val") || "").trim();
      if (val) { c.hidden = false; c.classList.remove("wpg-empty"); return; }
      if (state.sess) {
        c.hidden = false;
        c.textContent = "Add description";
        c.classList.add("wpg-empty");
      } else {
        c.textContent = "";
        c.classList.remove("wpg-empty");
        c.hidden = true;
      }
    });
  }

  // The "Counts:" and "How it is counted:" lines stay hidden for a reader when
  // empty; an editor sees them with an "Add" prompt in place of the value.
  function paintCountLines(state) {
    document.querySelectorAll(".wpg-unit-cell, .wpg-note-cell").forEach(function (c) {
      if (c.classList.contains("wpg-editing")) return;
      var line = c.parentNode;
      var empty = !(c.getAttribute("data-val") || "").trim();
      if (!empty) { if (line) line.hidden = false; c.classList.remove("wpg-empty"); return; }
      if (state.sess) {
        if (line) line.hidden = false;
        c.textContent = "Add";
        c.classList.add("wpg-empty");
      } else {
        c.textContent = "";
        c.classList.remove("wpg-empty");
        if (line) line.hidden = true;
      }
    });
  }

  // A sub-activity with no goal ladder (the generator marks its name cell
  // data-no-ladder) gets "Set targets", which creates its GOAL + STRETCH rows.
  function paintSetTargets(state) {
    document.querySelectorAll('[data-no-ladder="1"]').forEach(function (cell) {
      var btn = cell.querySelector(".wpg-set-targets");
      if (!state.sess) { if (btn) btn.remove(); return; }
      if (btn) return;
      btn = el("button", { "class": "wpg-btn wpg-set-targets", "type": "button" }, ["Set targets"]);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        openAddModal(state, { targetsFor: {
          pid: cell.getAttribute("data-pid"), name: cell.getAttribute("data-name") || "" } });
      });
      var wrap = el("div", { "class": "wpg-set-targets-row" }, [btn]);
      cell.appendChild(wrap);
    });
  }

  // The Activities tab's activity headers get "Add sub-activity" for an editor,
  // opening the same dialog with that Activity preselected as the parent.
  function paintActivityAddLinks(state) {
    document.querySelectorAll(".activity-group-header").forEach(function (hdr) {
      var raci = hdr.querySelector('.act-raci-link[data-raci-key^="activity:"]');
      if (!raci) return;
      var act = raci.getAttribute("data-raci-key").split(":")[1];
      var btn = hdr.querySelector(".wpg-add-sub");
      if (!state.sess) { if (btn) btn.remove(); return; }
      if (btn) return;
      btn = el("button", { "class": "wpg-btn wpg-add-sub", "type": "button", "data-parent": act },
        ["Add sub-activity"]);
      btn.addEventListener("click", function () { openAddModal(state, { parent: act }); });
      raci.parentNode.appendChild(btn);
    });
  }

  // Each sub-activity name gets "Move" for a signed-in reviewer (PR C): the move
  // renumbers the sub-activity in every table that stores its id, through one
  // reviewer-gated function (kb/supabase_workplan_move.sql). The team phrase does
  // not open it: whether it should is Sam's call on the Open Asks sheet.
  function canMove(sess) { return !!(sess && !sess.teamPass && sess.access_token); }
  // Beside it, "Table" (Sam, Open Asks Sheet 75 card 3, "reviewer", 2026-10-13): an
  // official sub-activity may leave the workplan, reversibly, by a signed-in
  // reviewer. It opens the Activities tab's own Table / Archive dialog
  // (project_lifecycle.js), so project_lifecycle keeps one writer.
  function lifecycle() { return window.CPL_PROJECT_LIFECYCLE && window.CPL_PROJECT_LIFECYCLE.openTable ? window.CPL_PROJECT_LIFECYCLE : null; }
  function paintMoveLinks(state) {
    document.querySelectorAll('[data-title-edit="1"][data-pid]').forEach(function (title) {
      var cell = title.closest ? title.closest("th, td") : null;
      if (!cell) return;
      var row = cell.querySelector(".wpg-move-row");
      if (!canMove(state.sess)) { if (row) row.remove(); return; }
      if (row) return;
      var pid = title.getAttribute("data-pid");
      var name = (title.textContent || "").trim();
      var btn = el("button", { "class": "wpg-btn wpg-move", "type": "button",
        "aria-label": "Move " + pid + " " + name }, ["Move"]);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        openMoveModal(state, pid, name);
      });
      row = el("div", { "class": "wpg-move-row" }, [btn]);
      if (lifecycle()) {
        var tbl = el("button", { "class": "wpg-btn wpg-table", "type": "button",
          "aria-label": "Table or archive " + pid + " " + name }, ["Table"]);
        tbl.addEventListener("click", function (e) {
          e.stopPropagation();
          if (lifecycle()) lifecycle().openTable(pid, name);
        });
        row.appendChild(tbl);
      }
      cell.appendChild(row);
    });
  }

  // What a reviewer tabled or archived, under the table, each with Restore: the row
  // leaves the table at once and, after the rebuild, from the build itself, so this
  // list is where it comes back from (the Activities tab's Tabled & Archived lists it too).
  function fetchTabled() {
    var h = { headers: { "apikey": SUPABASE_ANON } };
    function rows(url) {
      return fetch(url, h).then(function (r) { return r.ok ? r.json() : []; })
        .then(function (x) { return Array.isArray(x) ? x : []; })
        .catch(function () { return []; });
    }
    return Promise.all([
      rows(SUPABASE_URL + "/rest/v1/project_lifecycle?select=project_id,state,reason,updated_at&order=updated_at.desc"),
      rows(SUPABASE_URL + "/rest/v1/projects?select=id,name")
    ]).then(function (got) {
      var names = {};
      got[1].forEach(function (p) { names[String(p.id)] = String(p.name || ""); });
      return got[0].filter(function (l) {
        return l && /^[0-9]+(\.[0-9]+)+$/.test(String(l.project_id)) && (l.state === "tabled" || l.state === "archived");
      }).map(function (l) {
        return { pid: String(l.project_id), state: l.state, reason: l.reason || "", name: names[String(l.project_id)] || "" };
      });
    });
  }
  function paintTabledList(state) {
    var host = document.getElementById("tab-workplan-goals");
    if (!host) return;
    var box = host.querySelector(".wpg-tabled");
    if (!canMove(state.sess) || !lifecycle() || !lifecycle().restore) { if (box) box.remove(); return; }
    return fetchTabled().then(function (list) {
      box = host.querySelector(".wpg-tabled");
      if (!canMove(state.sess)) { if (box) box.remove(); return; }
      if (!box) {
        box = el("section", { "class": "wpg-tabled", "aria-labelledby": "wpg-tabled-h" }, []);
        host.appendChild(box);
      }
      box.innerHTML = "";
      box.appendChild(el("h3", { "id": "wpg-tabled-h" }, ["Tabled and archived (" + list.length + ")"]));
      if (!list.length) {
        box.appendChild(el("p", { "class": "wpg-tabled-none" }, ["None. Table on a sub-activity moves it here, reversibly."]));
        return;
      }
      var ul = el("ul", {}, []);
      list.forEach(function (t) {
        var label = t.pid + (t.name ? " " + t.name : "");
        var btn = el("button", { "class": "wpg-btn wpg-restore", "type": "button", "aria-label": "Restore " + label }, ["Restore"]);
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          btn.disabled = true;
          if (lifecycle()) lifecycle().restore(t.pid);
        });
        ul.appendChild(el("li", {}, [
          el("span", { "class": "wpg-tabled-name" }, [label]), " ",
          el("span", { "class": "wpg-tabled-state" }, [t.state === "archived" ? "Archived" : "Tabled"]),
          t.reason ? el("span", { "class": "wpg-tabled-reason" }, [" \u00b7 " + t.reason]) : "", " ", btn ]));
      });
      box.appendChild(ul);
    });
  }

  // ─── Per-cell edit interaction ──────────────────────────────────────────
  // After Enter or Escape, focus goes back to the value that was edited, so a
  // keyboard editor keeps its place in the table (the field it typed in is gone).
  // Deferred one tick: Chrome drops a focus() made inside the keydown that removed
  // the focused field (measured S375: focus landed on <body>).
  function refocus(cell) {
    if (!cell || !cell.getAttribute || cell.getAttribute("tabindex") === null || !cell.focus) return;
    setTimeout(function () { if (cell.isConnected !== false) cell.focus(); }, 0);
  }

  function fmtVal(v, isPct) {
    if (isPct) return Math.round(v * 100) + "%";
    if (v === 0 || v === null || v === undefined || v === "") return "";
    var n = Number(v);
    if (Number.isInteger(n)) return n.toLocaleString();
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function parseInput(raw, isPct) {
    if (typeof raw !== "string") raw = String(raw);
    raw = raw.trim().replace(/,/g, "").replace(/\+/g, "");
    if (!raw) return 0;
    if (isPct && raw.slice(-1) === "%") raw = raw.slice(0, -1);
    var n = parseFloat(raw);
    if (Number.isNaN(n)) return null;
    if (isPct && n > 1) n = n / 100; // accept "75%" or "75"
    return n;
  }

  function startEdit(cell, state) {
    if (!state.sess) return;
    if (cell.classList.contains("wpg-editing")) return;
    var activity_id = cell.getAttribute("data-aid");
    var row_type = cell.getAttribute("data-rt");
    var year_key = cell.getAttribute("data-yr-key");
    var year_label = cell.getAttribute("data-yr");
    var isPct = cell.getAttribute("data-pct") === "1";
    // The Current row (S426) is a ladder like Goal and Stretch, stored as cur_<year>
    // on the GOAL row: its PATCH targets GOAL and sends no total.
    var isCurrent = row_type === "CURRENT";
    var db_row_type = isCurrent ? "GOAL" : row_type;
    // PR-B: optional kind discriminator. When absent (pre-PR-B cells), the
    // save path falls through to the unscoped PATCH, which is still safe
    // because Activity ids ("1"-"4") and project ids ("1.1", "1.2", …) are
    // disjoint.
    var kind = cell.getAttribute("data-kind") || "";
    if (!activity_id || !row_type || !year_key) return;

    var oldText = cell.textContent;
    var oldNum = Number(cell.getAttribute("data-val") || "0");

    var input = el("input", {
      "type": "text",
      "value": isPct && oldNum ? (Math.round(oldNum * 100) + "%") : (oldNum || ""),
      "class": "wpg-cell-input",
      "aria-label": (isCurrent ? "Current " : row_type === "STRETCH" ? "Stretch " : "Goal ") + year_label + " for " + activity_id,
      "style": "width:100%;box-sizing:border-box;padding:2px 4px;font:inherit;border:1px solid var(--cobalt);border-radius:3px;text-align:right;background:var(--surface-opaque);"
    }, []);

    cell.classList.add("wpg-editing");
    var prevHtml = cell.innerHTML;
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    input.select();

    // One close per open (S375): removing the field fires its blur in Chrome, and
    // blur commits, so without this the restore ran twice and threw mid-keydown.
    var done = false;
    function cancel() {
      if (done) return;
      done = true;
      cell.innerHTML = prevHtml;
      cell.classList.remove("wpg-editing");
    }

    function commit() {
      if (done) return;
      var newNum = parseInput(input.value, isPct);
      if (newNum === null) {
        input.style.borderColor = "var(--red-alert)";
        return;
      }
      if (newNum === oldNum) {
        cancel();
        return;
      }
      done = true;
      // Optimistic UI: paint all matching cells, mark as saving.
      // PR-B: when this cell carries a data-kind, scope the selectors so
      // an Activity edit can't paint a Project row (or vice-versa).
      var kindSel = kind ? '[data-kind="' + kind + '"]' : "";
      var matching = document.querySelectorAll(
        '[data-aid="' + activity_id + '"]' + kindSel + '[data-rt="' + row_type + '"][data-yr-key="' + year_key + '"]'
      );
      var totalCells = document.querySelectorAll(
        '[data-aid="' + activity_id + '"]' + kindSel + '[data-rt="' + row_type + '"][data-total="1"]'
      );

      // Compute the new row total by summing current data-val on every year
      // cell of this (aid, rt) row, substituting the new value for the
      // edited year_key. Picks one DOM region's cells (the first table).
      var rowYearCells = document.querySelectorAll(
        '[data-aid="' + activity_id + '"]' + kindSel + '[data-rt="' + row_type + '"][data-yr-key]'
      );
      var seenYearKeys = {};
      var newTotal = 0;
      rowYearCells.forEach(function (c) {
        var yk = c.getAttribute("data-yr-key");
        if (seenYearKeys[yk]) return;
        seenYearKeys[yk] = 1;
        if (yk === year_key) newTotal += newNum;
        else newTotal += Number(c.getAttribute("data-val") || "0");
      });

      // Optimistic paint
      matching.forEach(function (c) {
        c.classList.add("wpg-saving");
        c.setAttribute("data-val", String(newNum));
        c.innerHTML = fmtVal(newNum, isPct);
      });
      totalCells.forEach(function (c) {
        c.classList.add("wpg-saving");
        c.setAttribute("data-val", String(newTotal));
        c.innerHTML = fmtVal(newTotal, isPct);
      });
      cell.classList.remove("wpg-editing");

      saveCell(activity_id, db_row_type, year_key, newNum, isCurrent ? null : newTotal, state.sess, kind)
        .then(writeResult)
        .then(function (r) {
          var ok = r.ok;
          var paintClass = ok ? "wpg-saved" : "wpg-error";
          matching.forEach(function (c) {
            c.classList.remove("wpg-saving");
            c.classList.add(paintClass);
            setTimeout(function () { c.classList.remove(paintClass); }, 1500);
          });
          totalCells.forEach(function (c) {
            c.classList.remove("wpg-saving");
            c.classList.add(paintClass);
            setTimeout(function () { c.classList.remove(paintClass); }, 1500);
          });
          if (!ok) {
            // Roll back optimistic paint on failure
            matching.forEach(function (c) {
              c.setAttribute("data-val", String(oldNum));
              c.innerHTML = fmtVal(oldNum, isPct);
            });
            console.error("[workplan_goals] save failed:", r.status);
            maybeDropStalePhrase(state.sess, r.status);
          }
        })
        .catch(function (e) {
          matching.forEach(function (c) {
            c.classList.remove("wpg-saving");
            c.classList.add("wpg-error");
            c.setAttribute("data-val", String(oldNum));
            c.innerHTML = fmtVal(oldNum, isPct);
            setTimeout(function () { c.classList.remove("wpg-error"); }, 2000);
          });
          console.error("[workplan_goals] save error:", e);
        });
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(); refocus(cell); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); refocus(cell); }
    });
    input.addEventListener("blur", commit);
  }

  // ─── Session 85: authoritative title editor (PATCH projects.name) ────────
  function startTitleEdit(cell, state) {
    if (!state.sess) return;
    if (cell.classList.contains("wpg-editing")) return;
    var pid = cell.getAttribute("data-pid");
    if (!pid) return;
    var oldName = cell.textContent;
    var input = el("input", {
      "type": "text",
      "value": oldName,
      "class": "wpg-title-input",
      "aria-label": "Name of " + pid,
      "style": "width:100%;box-sizing:border-box;padding:2px 4px;font:inherit;border:1px solid var(--cobalt);border-radius:3px;background:var(--surface-opaque);"
    }, []);
    cell.classList.add("wpg-editing");
    var prevHtml = cell.innerHTML;
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    input.select();

    // One close per open (S375): removing the field fires its blur in Chrome, and
    // blur commits, so without this the restore ran twice and threw mid-keydown.
    var done = false;
    function cancel() {
      if (done) return;
      done = true;
      cell.innerHTML = prevHtml;
      cell.classList.remove("wpg-editing");
    }
    function commit() {
      if (done) return;
      var newName = (input.value || "").trim();
      if (!newName) { input.style.borderColor = "var(--red-alert)"; return; }
      if (newName === oldName.trim()) { cancel(); return; }
      done = true;
      cell.classList.remove("wpg-editing");
      cell.textContent = newName;
      cell.classList.add("wpg-saving");
      saveTitle(pid, newName, state.sess).then(writeResult).then(function (r) {
        cell.classList.remove("wpg-saving");
        var paint = r.ok ? "wpg-saved" : "wpg-error";
        cell.classList.add(paint);
        setTimeout(function () { cell.classList.remove(paint); }, 1500);
        if (!r.ok) {
          cell.textContent = oldName;
          console.error("[workplan_goals] title save failed:", r.status);
            maybeDropStalePhrase(state.sess, r.status);
        }
      }).catch(function (e) {
        cell.classList.remove("wpg-saving");
        cell.classList.add("wpg-error");
        cell.textContent = oldName;
        setTimeout(function () { cell.classList.remove("wpg-error"); }, 2000);
        console.error("[workplan_goals] title save error:", e);
      });
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(); refocus(cell); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); refocus(cell); }
    });
    input.addEventListener("blur", commit);
  }

  // ─── Shared inline text editor (description + Activity title/description) ───
  // Single-line input or multi-line textarea that PATCHes via opts.save(value,
  // sess). Mirrors startTitleEdit's optimistic-paint + rollback. In multiline
  // mode Enter inserts a newline; Cmd/Ctrl+Enter (or blur) saves. Empty renders
  // the "—" placeholder (the same neutral empty-state the generator emits).
  function inlineTextEditor(cell, state, opts) {
    if (!state.sess) return;
    if (cell.classList.contains("wpg-editing")) return;
    var oldVal = cell.getAttribute("data-val");
    if (oldVal === null) oldVal = cell.textContent;
    if (oldVal === "—") oldVal = "";  // the "—" placeholder means empty
    var field = opts.multiline
      ? el("textarea", { "class": "wpg-title-input",
          "style": "width:100%;box-sizing:border-box;min-height:3.4em;padding:3px 5px;font:inherit;border:1px solid var(--cobalt);border-radius:3px;background:var(--surface-opaque);color:var(--text-strong);resize:vertical;" }, [])
      : el("input", { "type": "text", "class": "wpg-title-input",
          "style": "width:100%;box-sizing:border-box;padding:2px 4px;font:inherit;border:1px solid var(--cobalt);border-radius:3px;background:var(--surface-opaque);color:var(--text-strong);" }, []);
    field.value = oldVal;
    if (opts.label) field.setAttribute("aria-label", opts.label);
    cell.classList.add("wpg-editing");
    var prevHtml = cell.innerHTML;
    cell.innerHTML = "";
    cell.appendChild(field);
    field.focus();
    if (field.select) field.select();

    var done = false;
    function cancel() {
      if (done) return;
      done = true;
      cell.innerHTML = prevHtml;
      cell.classList.remove("wpg-editing");
    }
    function commit() {
      if (done) return;
      var val = (field.value || "").trim();
      if (val === (oldVal || "").trim()) { cancel(); return; }
      if (opts.required && !val) { field.style.borderColor = "var(--red-alert)"; return; }
      done = true;
      cell.classList.remove("wpg-editing");
      cell.classList.add("wpg-saving");
      cell.textContent = val || (opts.emptyText != null ? opts.emptyText : "—");
      if (!val && opts.emptyText) cell.classList.add("wpg-empty"); else cell.classList.remove("wpg-empty");
      cell.setAttribute("data-val", val);
      opts.save(val, state.sess).then(writeResult).then(function (r) {
        cell.classList.remove("wpg-saving");
        var paint = r.ok ? "wpg-saved" : "wpg-error";
        cell.classList.add(paint);
        setTimeout(function () { cell.classList.remove(paint); }, 1500);
        if (!r.ok) {
          cell.innerHTML = prevHtml;
          cell.setAttribute("data-val", oldVal);
          console.error("[workplan_goals] save failed:", r.status);
          maybeDropStalePhrase(state.sess, r.status);
        }
      }).catch(function (e) {
        cell.classList.remove("wpg-saving");
        cell.classList.add("wpg-error");
        cell.innerHTML = prevHtml;
        cell.setAttribute("data-val", oldVal);
        setTimeout(function () { cell.classList.remove("wpg-error"); }, 2000);
        console.error("[workplan_goals] save error:", e);
      });
    }
    field.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (!opts.multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault(); commit(); refocus(cell);
      } else if (e.key === "Escape") {
        e.preventDefault(); cancel(); refocus(cell);
      }
    });
    field.addEventListener("blur", commit);
  }

  // Sub-activity brief description → projects.description.
  function startDescEdit(cell, state) {
    var pid = cell.getAttribute("data-pid");
    if (!pid) return;
    inlineTextEditor(cell, state, {
      multiline: true,
      emptyText: "Add description",
      label: "Description of " + pid,
      save: function (v, sess) { return saveDesc(pid, v || null, sess); }
    });
  }

  // Top-level Activity title → workplan_goals.name (rebuilt with the "Activity
  // N: " prefix so the number can't be edited away).
  function startActivityTitleEdit(cell, state) {
    var aid = cell.getAttribute("data-aid");
    if (!aid) return;
    inlineTextEditor(cell, state, {
      required: true,
      label: "Name of Activity " + aid,
      save: function (v, sess) {
        return saveActivityField(aid, { name: "Activity " + aid + ": " + v }, sess);
      }
    });
  }

  // Top-level Activity brief description → workplan_goals.description.
  function startActivityDescEdit(cell, state) {
    var aid = cell.getAttribute("data-aid");
    if (!aid) return;
    inlineTextEditor(cell, state, {
      multiline: true,
      emptyText: "Add description",
      label: "Description of Activity " + aid,
      save: function (v, sess) {
        return saveActivityField(aid, { description: v || null }, sess);
      }
    });
  }

  // What the numbers count → projects.kpi_unit (single line).
  function startUnitEdit(cell, state) {
    var pid = cell.getAttribute("data-pid");
    if (!pid) return;
    inlineTextEditor(cell, state, {
      emptyText: "Add",
      label: "What the numbers count for " + pid,
      save: function (v, sess) { return saveProjectField(pid, { kpi_unit: v || null }, sess); }
    });
  }

  // How the numbers are counted → projects.count_note (multi-line).
  function startNoteEdit(cell, state) {
    var pid = cell.getAttribute("data-pid");
    if (!pid) return;
    inlineTextEditor(cell, state, {
      multiline: true,
      emptyText: "Add",
      label: "How the numbers are counted for " + pid,
      save: function (v, sess) { return saveProjectField(pid, { count_note: v || null }, sess); }
    });
  }

  // One map from an element's edit marker to its editor, shared by the click
  // and the keyboard paths. Returns true when it opened one.
  var EDITORS = [
    ["data-editable", function (t, s) { startEdit(t, s); }],
    ["data-title-edit", function (t, s) { startTitleEdit(t, s); }],
    ["data-desc-edit", function (t, s) { startDescEdit(t, s); }],
    ["data-activity-title-edit", function (t, s) { startActivityTitleEdit(t, s); }],
    ["data-activity-desc-edit", function (t, s) { startActivityDescEdit(t, s); }],
    ["data-unit-edit", function (t, s) { startUnitEdit(t, s); }],
    ["data-note-edit", function (t, s) { startNoteEdit(t, s); }]
  ];
  function openEditorFor(target, state) {
    if (!target.getAttribute) return false;
    for (var i = 0; i < EDITORS.length; i++) {
      if (target.getAttribute(EDITORS[i][0]) === "1") { EDITORS[i][1](target, state); return true; }
    }
    return false;
  }

  function attachClickHandler(state) {
    // Use event delegation on the body — works for both tab tables.
    document.body.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        if (openEditorFor(target, state)) return;
        target = target.parentNode;
      }
    });
    // The keyboard path (S375 UI pass): Enter or Space on a focused editable value
    // opens its editor. Only the focused element itself counts, so Enter inside an
    // open editor's own field never reaches here as a second open.
    document.body.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains("wpg-editable")) return;
      if (t.classList.contains("wpg-editing")) return;
      if (openEditorFor(t, state)) e.preventDefault();
    });
  }

  // ─── The Annual Workplan Goals table (S375 UI pass; S426 formatting pass) ──
  // The generator (render_annual_goals_table_html) prints classes and these rules
  // paint them, so every color is a theme token and the phone card can reach each
  // cell (the old inline styles carried 715 raw hexes and beat any media query).
  // S426: hairline rows in place of a full grid, numbers right-aligned in tabular
  // figures, Activity headers on the subtle surface rather than a navy band, the
  // Stretch row in its text grade without italics, and the sign-in controls in the
  // card's head row rather than a band above it.
  // Goal and Stretch sit on the plain surface: the gray fill read as disabled.
  // Current is plain ink: green is for a state the user must act on.
  // An editor sees an at-rest cue on every editable value (a cobalt rule under the
  // cell, a dotted underline under editable words), and every one is reachable by Tab.
  var ANNUAL_TABLE_CSS = ''
    + '.wpg-annual { margin:2rem 0;padding:1.5rem;background:var(--surface-opaque);border-radius:10px;box-shadow:0 2px 8px rgba(28,28,26,0.06); }'
    + '.wpg-annual-head { display:flex;flex-wrap:wrap;align-items:center;gap:0.35rem 1.25rem;margin-bottom:0.6rem; }'
    + '.wpg-annual-title { color:var(--text-strong);margin:0; }'
    + '.wpg-auth-slot { display:contents; }'
    + '.wpg-auth-widget { display:flex;flex-wrap:wrap;align-items:center;gap:0.4rem 1rem;margin-left:auto;font-size:0.85rem;color:var(--text-strong); }'
    + '.wpg-auth-widget.wpg-auth-out { flex-basis:100%;margin-left:0; }'
    + '.wpg-auth-who { font-weight:600; }'
    + '.wpg-auth-hint { flex-basis:100%;margin:0;font-size:0.8rem;color:var(--text-muted);min-height:1.2em; }'
    + '.wpg-auth-hint.ok { color:var(--green-progress); }'
    + '.wpg-auth-hint.err { color:var(--red-alert); }'
    + '.wpg-auth-widget input[type="email"], .wpg-auth-widget input[type="password"], .wpg-auth-widget input[type="text"] { padding:0.3rem 0.5rem;border:1px solid var(--border-strong);border-radius:5px;font:inherit;font-size:0.8rem;min-width:11rem;min-height:24px;box-sizing:border-box;background:var(--surface-opaque);color:var(--text-strong); }'
    + '.wpg-annual-note { margin:0 0 0.75rem 0;font-size:0.8rem;color:var(--text-muted); }'
    + '.wpg-annual-scroll { overflow-x:auto; }'
    + '.wpg-annual-table { width:100%;border-collapse:collapse;font-size:0.82rem;table-layout:fixed;font-variant-numeric:tabular-nums; }'
    + '.wpg-annual-table .wpg-c-name { width:34%; }'
    + '.wpg-annual-table .wpg-c-type { width:4.75rem; }'
    + '.wpg-annual-table .wpg-c-total { width:5.5rem; }'
    // --white, not --on-accent: --seal-blue stays the navy in dark, where --on-accent
    // turns near-black (1.43:1 measured on the S375 preview).
    + '.wpg-annual-table thead th { background:var(--seal-blue);color:var(--white);padding:0.5rem 0.5rem;text-align:right;font-size:0.78rem;border:0; }'
    + '.wpg-annual-table thead th.wpg-h-name, .wpg-annual-table thead th.wpg-h-type { text-align:left; }'
    + '.wpg-annual-table thead th.wpg-h-name { padding-left:0.6rem; }'
    + '.wpg-annual-table .wpg-act-head { background:var(--surface-subtle);color:var(--text-strong);text-align:left;font-weight:700;padding:0.55rem 0.6rem;border:0;border-top:2px solid var(--border-strong); }'
    + '.wpg-annual-table .wpg-act-desc-cell { font-weight:400;font-size:0.78rem;margin-top:0.15rem;color:var(--text-muted); }'
    + '.wpg-annual-table td, .wpg-annual-table .wpg-type, .wpg-annual-table .wpg-name { border:0;border-bottom:1px solid var(--border);background:var(--surface-opaque);vertical-align:middle; }'
    + '.wpg-annual-table .wpg-r-goal > * { border-top:2px solid var(--border-strong); }'
    + '.wpg-annual-table .wpg-name { text-align:left;vertical-align:top;font-weight:600;font-style:normal;color:var(--text-strong);padding:0.45rem 0.6rem 0.45rem calc(0.6rem + var(--wpg-indent, 0rem));border-right:1px solid var(--border); }'
    + '.wpg-annual-table .wpg-name.wpg-nest { border-left:3px solid var(--seal-blue-text); }'
    + '.wpg-annual-table .wpg-sub-marker { color:var(--seal-blue-text); }'
    + '.wpg-annual-table .wpg-pid { color:var(--text-muted);font-size:0.75rem; }'
    + '.wpg-annual-table .wpg-desc-cell, .wpg-annual-table .wpg-count-line { font-weight:400;font-size:0.72rem;color:var(--text-muted);margin-top:0.15rem; }'
    + '.wpg-annual-table .wpg-assoc-cell { font-weight:400;font-size:0.65rem;color:var(--text-muted);margin-top:0.25rem; }'
    + '.wpg-annual-table .wpg-act-chip { margin-right:0.2rem;font-size:0.65rem; }'
    + '.wpg-annual-table .wpg-type { text-align:left;font-weight:600;font-size:0.72rem;color:var(--text-muted);padding:0.3rem 0.4rem; }'
    + '.wpg-annual-table .wpg-val { text-align:right;padding:0.3rem 0.5rem; }'
    + '.wpg-annual-table .wpg-total { font-weight:700;border-left:1px solid var(--border); }'
    + '.wpg-annual-table .wpg-r-goal { color:var(--text-strong); }'
    + '.wpg-annual-table .wpg-r-current { color:var(--text-strong);font-weight:700; }'
    + '.wpg-annual-table .wpg-r-stretch { color:var(--mustard-text); }'
    + '.wpg-annual-table td.wpg-editable { box-shadow:inset 0 -1px 0 var(--cobalt); }'
    + '.wpg-title-cell.wpg-editable, .wpg-desc-cell.wpg-editable, .wpg-act-desc-cell.wpg-editable, .wpg-unit-cell.wpg-editable, .wpg-note-cell.wpg-editable { text-decoration:underline dotted 1px;text-underline-offset:3px; }'
    // An editable word is a target once it takes focus, so it meets the 24x24
    // minimum (WCAG 2.5.8): the one-line words grow to 24px, "Add" included.
    + '.wpg-title-cell.wpg-editable, .wpg-unit-cell.wpg-editable, .wpg-note-cell.wpg-editable { display:inline-block;min-height:24px;min-width:24px;box-sizing:border-box;padding:3px 0; }'
    + '.wpg-desc-cell.wpg-editable, .wpg-act-desc-cell.wpg-editable, .wpg-assoc-cell.wpg-assoc-on { min-height:24px;box-sizing:border-box;padding-top:3px;padding-bottom:3px; }'
    + '.wpg-editable:focus-visible { outline:2px solid var(--focus-ring);outline-offset:-2px; }'
    + '.wpg-assoc-cell.wpg-assoc-on .wpg-assoc-label { text-decoration:underline dotted 1px;text-underline-offset:3px; }'
    + '.wpg-assoc-cell.wpg-assoc-on:focus-visible .wpg-assoc-edit-hint { opacity:1;color:var(--cobalt); }'
    + '.wpg-assoc-cell.wpg-assoc-on:focus-visible { outline:2px solid var(--focus-ring);outline-offset:2px; }'
    // Phone: each sub-activity becomes a card. Its name runs full width; each of
    // its three rows is the row's word, then its six values, each printing its
    // year above it. A cell takes the width its number needs and the row wraps
    // when the six will not fit (a 1,500,000 used to break mid-digit in a sixth
    // of 300px). The column headers stay in the page for a screen reader.
    + '@media (max-width: 560px) {'
    +   '.wpg-annual { margin:1rem 0;padding:1rem 0.75rem; }'
    +   '.wpg-auth-widget { margin-left:0; }'
    +   '.wpg-annual-scroll { overflow:visible; }'
    +   '.wpg-annual-table, .wpg-annual-table tbody, .wpg-annual-table .wpg-act-row, .wpg-annual-table .wpg-act-head { display:block;width:100%;box-sizing:border-box; }'
    +   '.wpg-annual-table colgroup { display:none; }'
    +   '.wpg-annual-table thead { position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0; }'
    +   '.wpg-annual-table .wpg-r { display:flex;flex-wrap:wrap;align-items:stretch;justify-content:flex-end;column-gap:0.15rem; }'
    +   '.wpg-annual-table .wpg-name { flex:0 0 100%;box-sizing:border-box;border:0;border-top:2px solid var(--border-strong);padding-left:calc(0.5rem + var(--wpg-indent, 0rem) / 2); }'
    +   '.wpg-annual-table .wpg-name.wpg-nest { border-left:3px solid var(--seal-blue-text); }'
    +   '.wpg-annual-table td, .wpg-annual-table .wpg-type { border:0;border-bottom:1px solid var(--border); }'
    +   '.wpg-annual-table .wpg-r-goal > td, .wpg-annual-table .wpg-r-goal > .wpg-type { border-top:0; }'
    +   '.wpg-annual-table .wpg-type { flex:0 0 2.9rem;box-sizing:border-box;text-align:left;padding:0.3rem 0 0.3rem 0.2rem;margin-right:auto; }'
    +   '.wpg-annual-table .wpg-val { flex:1 1 auto;min-width:2.4rem;padding:0.3rem 0.05rem;font-size:0.75rem;white-space:nowrap; }'
    +   '.wpg-annual-table .wpg-total { border-left:0; }'
    +   '.wpg-annual-table .wpg-val::before { content:attr(data-label);display:block;font-size:0.62rem;font-weight:600;color:var(--text-muted);margin-bottom:0.1rem; }'
    + '}';

  // ─── Style injection (light; matches existing dashboard palette) ────────
  function injectStyles() {
    if (document.getElementById("wpg-editor-styles")) return;
    var css = ''
      + '.wpg-editable { cursor: pointer; transition: background 0.15s; }'
      + '.wpg-editable:hover { background: var(--surface-subtle) !important; outline: 1px dashed var(--cobalt); }'
      + '.wpg-editing { background: var(--surface-opaque) !important; padding: 0 !important; }'
      // The save states read in both themes (S364): the dark-only tints with their light
      // fallbacks, and a failed save as a red outline, the status line naming the error.
      // Each sets its ink too: a title cell sits in a navy row with white text, which read
      // 1.06:1 on the pale tint in light as well as dark.
      + '.wpg-saving { background: var(--cpl-warn-bg, #FFF8E1) !important; color: var(--text-strong) !important; }'
      + '.wpg-saved { background: var(--cpl-green-soft, #E8F5E9) !important; color: var(--text-strong) !important; transition: background 0.4s; }'
      + '.wpg-error { background: var(--surface-muted) !important; color: var(--text-strong) !important; outline: 2px solid var(--red-alert); outline-offset: -2px; transition: background 0.4s; }'
      + '.wpg-saving *, .wpg-saved *, .wpg-error * { color: var(--text-strong) !important; }'
      // Controls are underlined words (Sam, 2026-10-09; S364): no border, no fill, 24px tall.
      + '.wpg-btn, .wpg-modal-card .wpg-modal-actions button, .wpg-modal-card .wpg-btn-cancel, .wpg-modal-card .wpg-btn-submit { border:0 !important;background:none;color:var(--cobalt);font-weight:600;padding:2px 0;min-height:24px;font-size:0.85rem;font-family:inherit;cursor:pointer;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;border-radius:2px; }'
      + '.wpg-btn:hover, .wpg-modal-card .wpg-modal-actions button:hover { text-decoration-thickness:2px; }'
      + '.wpg-btn:focus-visible, .wpg-modal-card .wpg-modal-actions button:focus-visible { outline:2px solid var(--gold-accent);outline-offset:2px; }'
      + '.wpg-btn-add { margin-left:auto; }'
      // PR-C add-flow modal
      + '.wpg-modal-overlay { position:fixed;inset:0;background:rgba(10,34,64,0.55);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:3rem 1rem; }'
      + '.wpg-modal-card { background:var(--surface-opaque);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.25);max-width:640px;width:100%;padding:1.5rem;font-family:inherit;color:var(--text-strong); }'
      + '.wpg-modal-card h3 { margin:0 0 0.25rem 0;color:var(--text-strong);font-size:1.1rem; }'
      + '.wpg-modal-card .wpg-sub { color:var(--text-muted);font-size:0.8rem;margin-bottom:1rem; }'
      + '.wpg-modal-card label { display:block;font-size:0.78rem;color:var(--text-muted);margin:0.6rem 0 0.2rem 0;font-weight:600; }'
      + '.wpg-modal-card input[type="text"], .wpg-modal-card input[type="number"] { width:100%;padding:0.4rem 0.55rem;border:1px solid var(--border-strong);border-radius:5px;font-size:0.85rem;box-sizing:border-box; }'
      + '.wpg-modal-card .wpg-radio-row { display:flex;gap:1.5rem;margin:0.3rem 0 0.5rem 0; }'
      + '.wpg-modal-card .wpg-radio-row label { display:flex;align-items:center;gap:0.4rem;font-weight:500;color:var(--text-strong);margin:0;font-size:0.9rem;cursor:pointer;min-height:24px; }'
      + '.wpg-modal-card .wpg-grid-years { display:grid;grid-template-columns:repeat(5,1fr);gap:0.4rem; }'
      + '.wpg-modal-card .wpg-assoc-checkboxes { display:flex;flex-wrap:wrap;gap:0.6rem;padding:0.5rem 0.6rem;background:var(--surface-subtle);border-radius:5px; }'
      // Each checkbox's label is its target, so it meets the 24px minimum (WCAG 2.5.8;
      // measured 19.9px tall on the published dialog, S375).
      + '.wpg-modal-card .wpg-assoc-checkboxes label { display:flex;align-items:center;gap:0.3rem;font-size:0.78rem;font-weight:500;margin:0;color:var(--text-strong);cursor:pointer;min-height:24px; }'
      + '.wpg-modal-card .wpg-status { margin-top:0.75rem;font-size:0.82rem;min-height:1.2em; }'
      + '.wpg-modal-card .wpg-status.ok { color:var(--green-progress); }'
      + '.wpg-modal-card .wpg-status.err { color:var(--red-alert); }'
      + '.wpg-modal-card .wpg-modal-actions { display:flex;justify-content:flex-end;gap:0.5rem 18px;margin-top:1rem; }'
      + '.wpg-modal-card .wpg-btn-submit:disabled { color:var(--text-muted);text-decoration:none;cursor:not-allowed; }'
      + '.wpg-act-chip { display:inline-block;padding:0.05rem 0.4rem;background:var(--surface-muted);color:var(--navy-secondary);border-radius:10px;font-size:0.7rem;font-weight:600; }'
      // Session 85 — Current hybrid + title editor affordances
      // Where a live Current comes from, in muted words under the value (S375 UI pass:
      // the filled blue badge read as a state to act on, which it is not).
      + '.wpg-live-badge { display:block;font-size:0.65rem;font-weight:400;font-style:normal;color:var(--text-muted);white-space:normal;line-height:1.25; }'
      // A closed year on a live row carries its June 30 reading, the same muted words.
      + '.wpg-val-note { display:block;font-size:0.65rem;font-weight:400;font-style:normal;color:var(--text-muted);white-space:normal;line-height:1.25; }'
      + '.wpg-title-cell { border-radius:3px; }'
      + '.wpg-count-label { font-weight:600; }'
      + '.wpg-empty { font-style:italic; }'
      + '.wpg-set-targets-row, .wpg-move-row { margin-top:0.3rem; }'
      + '.wpg-move, .wpg-table { font-size:0.75rem; }'
      + '.wpg-move-row { display:flex;flex-wrap:wrap;gap:0.6rem; }'
      + '.wpg-tabled { margin-top:1.2rem; }'
      + '.wpg-tabled h3 { font-size:0.95rem;margin:0 0 0.4rem 0;color:var(--text-strong); }'
      + '.wpg-tabled ul { list-style:none;margin:0;padding:0; }'
      + '.wpg-tabled li { display:flex;flex-wrap:wrap;align-items:center;gap:0.3rem;min-height:24px;padding:0.15rem 0; }'
      + '.wpg-tabled-state, .wpg-tabled-reason, .wpg-tabled-none { color:var(--text-muted);font-size:0.8rem; }'
      + '.wpg-new-note { color:var(--text-muted);font-style:italic;font-size:0.8rem; }'
      + '.wpg-modal-card .wpg-keep-row { display:flex;align-items:center;gap:0.4rem;font-weight:500;color:var(--text-strong);min-height:24px;margin-top:0.6rem; }'
      + '.wpg-add-sub { font-size:0.72rem; }'
      + '.wpg-modal-card select, .wpg-modal-card textarea { width:100%;padding:0.4rem 0.55rem;border:1px solid var(--border-strong);border-radius:5px;font:inherit;font-size:0.85rem;box-sizing:border-box;background:var(--surface-opaque);color:var(--text-strong); }'
      + '.wpg-modal-card textarea { min-height:4.2em;resize:vertical; }'
      + '.wpg-modal-card .wpg-fixed { font-size:0.95rem;font-weight:600;margin:0.4rem 0 0.2rem 0; }'
      + ANNUAL_TABLE_CSS;
    var style = document.createElement("style");
    style.id = "wpg-editor-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── PR-C add-flow modal ────────────────────────────────────────────────
  /**
   * Inspect the DOM for the set of existing activity_ids per kind. Used
   * for validation (collision check) + populating the Project's
   * "Contributes to" multi-select.
   */
  function collectExistingIds() {
    var acts = {}, projs = {};
    // The Activity header rows of the Annual table carry data-activity-title-edit;
    // an older layout marked ladder cells data-kind="activity". Reading only the
    // second left the list empty once the Annual table won the injection, so the
    // dialog refused every sub-activity (Sam, 2026-10-12, adding 3.9).
    document.querySelectorAll('[data-activity-title-edit="1"][data-aid]').forEach(function (c) {
      acts[c.getAttribute("data-aid")] = (c.getAttribute("data-val") || c.textContent || "").trim();
    });
    document.querySelectorAll('[data-aid][data-kind="activity"]').forEach(function (c) {
      var a = c.getAttribute("data-aid");
      if (!(a in acts)) acts[a] = "";
    });
    // Every sub-activity row, with or without a ladder (its title cell), plus
    // the ladder cells themselves.
    document.querySelectorAll('[data-title-edit="1"][data-pid]').forEach(function (c) {
      projs[c.getAttribute("data-pid")] = (c.textContent || "").trim();
    });
    document.querySelectorAll('[data-aid][data-kind="project"]').forEach(function (c) {
      var pid = c.getAttribute("data-aid");
      if (!(pid in projs)) projs[pid] = "";
    });
    return {
      activities: Object.keys(acts).sort(byNatural),
      activityNames: acts,
      projects: Object.keys(projs).sort(byNatural),
      projectNames: projs
    };
  }

  function byNatural(a, b) {
    var pa = String(a).split("."), pb = String(b).split(".");
    for (var k = 0; k < Math.max(pa.length, pb.length); k++) {
      var x = parseInt(pa[k] === undefined ? "-1" : pa[k], 10);
      var y = parseInt(pb[k] === undefined ? "-1" : pb[k], 10);
      if (x !== y) return x - y;
    }
    return 0;
  }

  // The next free child number under a parent, numeric not lexical:
  // "3" -> "3.10" after 3.9; "4.2" -> "4.2.2" after 4.2.1; none yet -> ".1".
  function suggestChildId(existing, parent) {
    if (!parent) return "";
    var re = new RegExp("^" + String(parent).replace(/\./g, "\\.") + "\\.(\\d+)$");
    var max = 0;
    (existing || []).forEach(function (id) {
      var m = String(id).match(re);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return parent + "." + (max + 1);
  }

  // A sub-activity's home Activity is its first number (3.9 -> 3, 4.2.1 -> 4).
  function homeActivityOf(id) {
    var m = String(id || "").match(/^(\d+)\./);
    return m ? m[1] : "";
  }

  // Tabled projects are absent from the page, so the dialog reads the live id
  // list (public read) before it accepts a new id; the primary key refuses a
  // duplicate anyway, this just says so before the save.
  function fetchProjectIds() {
    return fetch(SUPABASE_URL + "/rest/v1/projects?select=id", { headers: { "apikey": SUPABASE_ANON } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { return (rows || []).map(function (r) { return String(r.id); }); })
      .catch(function () { return []; });
  }

  // A sub-activity added since the page was built is not drawn until tonight's
  // rebuild, so Under could not offer it as a parent (Sam, 2026-10-13, adding
  // under 4.7 EMS Corps). The add dialog reads the live rows instead: every id
  // for the duplicate check, and as parents the sub-activities the page does not
  // show yet, less a tabled or archived one (project_lifecycle hides those from
  // the table) and the D.* helper rows the table leaves out.
  function fetchLiveProjects() {
    var h = { headers: { "apikey": SUPABASE_ANON } };
    function rows(url) {
      return fetch(url, h).then(function (r) { return r.ok ? r.json() : []; })
        .then(function (x) { return Array.isArray(x) ? x : []; })
        .catch(function () { return []; });
    }
    return Promise.all([
      rows(SUPABASE_URL + "/rest/v1/projects?select=id,name"),
      rows(SUPABASE_URL + "/rest/v1/project_lifecycle?select=project_id,state")
    ]).then(function (got) {
      var hidden = {};
      got[1].forEach(function (l) {
        if (l && (l.state === "tabled" || l.state === "archived")) hidden[String(l.project_id)] = true;
      });
      return {
        ids: got[0].map(function (r) { return String(r.id); }),
        parents: got[0].filter(function (r) {
          return /^[0-9]+(\.[0-9]+)+$/.test(String(r.id)) && !hidden[String(r.id)];
        }).map(function (r) { return { id: String(r.id), name: String(r.name || "") }; })
      };
    });
  }

  function parentOptionText(pid, name) {
    var depth = pid.split(".").length - 1;
    return new Array(depth + 1).join("\u00a0\u00a0\u00a0\u00a0") + pid + " " + (name || "");
  }

  // Under lists each Activity directly above its own sub-activities. It listed the
  // four Activities first and every sub-activity after them, so Activity 4 sat
  // far above 4.1-4.6 and adding 4.7 looked impossible (Sam, 2026-10-13).
  function fillParentOptions(parentSel, ids, added) {
    var keep = parentSel.value, placed = {};
    while (parentSel.firstChild) parentSel.removeChild(parentSel.firstChild);
    function addProject(pid) {
      placed[pid] = true;
      parentSel.appendChild(el("option", { "value": pid },
        [parentOptionText(pid, ids.projectNames[pid]) + (added.indexOf(pid) !== -1 ? " (new)" : "")]));
    }
    ids.activities.forEach(function (aid) {
      parentSel.appendChild(el("option", { "value": aid },
        ["Activity " + aid + (ids.activityNames[aid] ? ": " + ids.activityNames[aid] : "")]));
      ids.projects.forEach(function (pid) { if (homeActivityOf(pid) === aid) addProject(pid); });
    });
    ids.projects.forEach(function (pid) { if (!placed[pid]) addProject(pid); });
    if (keep) parentSel.value = keep;
  }

  // Adds to Under each live sub-activity the page does not show yet, in order,
  // marked new, keeping the current choice. Returns the ids it added.
  function addLiveParents(parentSel, ids, parents) {
    var added = [];
    parents.forEach(function (p) {
      if (ids.projects.indexOf(p.id) !== -1) return;
      if (ids.activities.indexOf(homeActivityOf(p.id)) === -1) return;
      ids.projects.push(p.id);
      ids.projectNames[p.id] = p.name;
      added.push(p.id);
    });
    if (!added.length) return added;
    ids.projects.sort(byNatural);
    fillParentOptions(parentSel, ids, added);
    return added;
  }

  // Tracks the active Esc listener so closeAddModal can detach it. Without
  // this, every modal open stacks another listener that survives Cancel /
  // overlay-click close paths until the next Esc keypress.
  var _activeEscListener = null;

  function closeAddModal() {
    var ov = document.querySelector(".wpg-modal-overlay");
    if (ov) ov.remove();
    if (_activeEscListener) {
      document.removeEventListener("keydown", _activeEscListener);
      _activeEscListener = null;
    }
  }

  /**
   * Move a sub-activity under a new parent (PR C). The dialog suggests the next
   * free number under the chosen parent (reading the live id list, so a tabled
   * id is never reused), asks whether to keep the link to the old Activity when
   * the home Activity changes (Sam kept it for 1.1.2), and calls
   * workplan_move_sub_activity, which re-keys every table in one transaction or
   * changes nothing. A sub-activity with sub-activities under it is refused here
   * and in the function: move those first.
   */
  function openMoveModal(state, pid, name) {
    closeAddModal();
    var ids = collectExistingIds();
    var liveIds = [];
    var idTouched = false;
    var oldHome = homeActivityOf(pid);
    var children = ids.projects.filter(function (x) { return x.indexOf(pid + ".") === 0; });

    var overlay = el("div", { "class": "wpg-modal-overlay" }, []);
    var card = el("div", { "class": "wpg-modal-card", "role": "dialog", "aria-modal": "true",
      "aria-labelledby": "wpg-move-title" }, []);
    overlay.appendChild(card);
    card.appendChild(el("h3", { "id": "wpg-move-title" }, ["Move a sub-activity"]));
    card.appendChild(el("div", { "class": "wpg-fixed" }, [pid + " " + name]));
    card.appendChild(el("div", { "class": "wpg-sub" }, ["Its goals, links, RACI, updates and history move with it, " +
      "all at once or not at all. It shows in its new place after tonight's rebuild."]));

    card.appendChild(el("label", { "for": "wpg-move-parent" }, ["Under"]));
    var parentSel = el("select", { "id": "wpg-move-parent" }, []);
    ids.activities.forEach(function (aid) {
      parentSel.appendChild(el("option", { "value": aid },
        ["Activity " + aid + (ids.activityNames[aid] ? ": " + ids.activityNames[aid] : "")]));
    });
    ids.projects.forEach(function (x) {
      if (x === pid || x.indexOf(pid + ".") === 0) return;  // never under itself
      var depth = x.split(".").length - 1;
      parentSel.appendChild(el("option", { "value": x },
        [new Array(depth + 1).join("\u00a0\u00a0\u00a0\u00a0") + x + " " + (ids.projectNames[x] || "")]));
    });
    card.appendChild(parentSel);

    card.appendChild(el("label", { "for": "wpg-move-id" }, ["New ID"]));
    var idInput = el("input", { "type": "text", "id": "wpg-move-id", "autocomplete": "off" }, []);
    card.appendChild(idInput);

    var keepBox = el("input", { "type": "checkbox", "id": "wpg-move-keep", "checked": "checked" }, []);
    var keepLabel = el("label", { "for": "wpg-move-keep", "class": "wpg-keep-row" }, []);
    keepLabel.appendChild(keepBox);
    var keepText = document.createTextNode(" Keep its link to Activity " + oldHome);
    keepLabel.appendChild(keepText);
    card.appendChild(keepLabel);

    var status = el("div", { "class": "wpg-status", "role": "status", "aria-live": "polite" }, []);
    card.appendChild(status);
    var actions = el("div", { "class": "wpg-modal-actions" }, []);
    var btnCancel = el("button", { "class": "wpg-btn-cancel", "type": "button" }, ["Cancel"]);
    var btnSubmit = el("button", { "class": "wpg-btn-submit", "type": "button" }, ["Move"]);
    actions.appendChild(btnSubmit);   // the lead word first, as in the Add dialog (S364)
    actions.appendChild(btnCancel);
    card.appendChild(actions);

    function allIds() { return ids.projects.concat(liveIds); }
    function sync() {
      if (!idTouched) idInput.value = suggestChildId(allIds(), parentSel.value);
      var home = homeActivityOf(idInput.value) || parentSel.value.split(".")[0];
      keepLabel.hidden = home === oldHome;
    }
    if (children.length) {
      status.className = "wpg-status err";
      status.textContent = pid + " has sub-activities under it (" + children.join(", ") + "). Move those first.";
      btnSubmit.disabled = true;
    }
    parentSel.addEventListener("change", function () { idTouched = false; sync(); });
    idInput.addEventListener("input", function () { idTouched = true; sync(); });
    sync();
    fetchProjectIds().then(function (list) { liveIds = list; sync(); });

    btnCancel.addEventListener("click", closeAddModal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeAddModal(); });
    _activeEscListener = function (e) { if (e.key === "Escape") closeAddModal(); };
    document.addEventListener("keydown", _activeEscListener);

    btnSubmit.addEventListener("click", function () {
      var newId = (idInput.value || "").trim();
      status.className = "wpg-status";
      if (!/^[1-4](\.\d+)+$/.test(newId)) {
        status.className = "wpg-status err";
        status.textContent = "A sub-activity ID looks like 3.9 or 4.2.1.";
        return;
      }
      if (newId === pid) { status.className = "wpg-status err"; status.textContent = "That is its current ID."; return; }
      if (allIds().indexOf(newId) !== -1) {
        status.className = "wpg-status err";
        status.textContent = newId + " is already in use (on the page or tabled).";
        return;
      }
      btnSubmit.disabled = true;
      status.textContent = "Moving…";
      fetch(SUPABASE_URL + "/rest/v1/rpc/workplan_move_sub_activity", {
        method: "POST",
        headers: authHeaders(state.sess),
        body: JSON.stringify({ p_old_id: pid, p_new_id: newId, p_keep_old_link: keepLabel.hidden ? true : keepBox.checked })
      }).then(function (r) {
        return r.text().then(function (t) {
          var body = null;
          try { body = t ? JSON.parse(t) : null; } catch (e) { body = null; }
          if (!r.ok) {
            var msg = (body && body.message) || ("HTTP " + r.status);
            throw new Error(msg.replace(/^workplan_move_sub_activity: /, ""));
          }
          return body;
        });
      }).then(function (res) {
        paintNewRows(state);
        return queueRebuild(state.sess).then(function (q) { return { res: res, q: q }; });
      }).then(function (got) {
        status.className = "wpg-status ok";
        status.textContent = "Moved " + pid + " to " + ((got.res && got.res.new_id) || newId) +
          ". It shows in its new place " + whenShown(got.q) + ".";
        btnSubmit.textContent = "Done";
        btnSubmit.disabled = false;
        btnSubmit.onclick = closeAddModal;
      }).catch(function (e) {
        btnSubmit.disabled = false;
        status.className = "wpg-status err";
        status.textContent = "Not moved: " + (e.message || "the save failed") + ".";
      });
    });

    document.body.appendChild(overlay);
    parentSel.focus();
  }

  /**
   * The one add dialog (Sam, 2026-10-12: one flow, reachable from both tabs).
   *   opts.parent     preselects the parent ("3" or "4.2") — the Activities tab
   *   opts.targetsFor { pid, name }: an existing sub-activity with no ladder;
   *                   the dialog only creates its GOAL + STRETCH rows.
   * A new sub-activity writes three tables in order: projects (the row the
   * Annual table and the Activities tab render), workplan_goals (its ladder)
   * and workplan_activity_associations (its home link plus any others).
   */
  function openAddModal(state, opts) {
    opts = opts || {};
    closeAddModal();
    var ids = collectExistingIds();
    var targets = opts.targetsFor && opts.targetsFor.pid ? opts.targetsFor : null;
    var liveIds = [];
    var idTouched = false;

    var overlay = el("div", { "class": "wpg-modal-overlay" }, []);
    var card = el("div", { "class": "wpg-modal-card", "role": "dialog", "aria-modal": "true",
      "aria-labelledby": "wpg-add-title" }, []);
    overlay.appendChild(card);

    card.appendChild(el("h3", { "id": "wpg-add-title" },
      [targets ? "Set targets" : "Add to the workplan"]));
    card.appendChild(el("div", { "class": "wpg-sub" }, [targets
      ? "Creates the Goal and Stretch rows for this sub-activity. Each year starts at 0; fill in what you know."
      : "Adds a sub-activity with its goals, or a new top-level Activity. It appears on both tabs after the next build, which saving queues."]));

    // ── Kind radio (not shown when setting targets) ──────────────
    var kindAct = el("input", { "type": "radio", "name": "wpg-kind", "value": "activity" }, []);
    var kindProj = el("input", { "type": "radio", "name": "wpg-kind", "value": "project", "checked": "checked" }, []);
    var parentSel = el("select", {}, []);
    var idInput = el("input", { "type": "text", "placeholder": "e.g. 3.9", "autocomplete": "off" }, []);
    var nameInput = el("input", { "type": "text", "placeholder": "Descriptive name", "autocomplete": "off" }, []);
    var unitInput = el("input", { "type": "text", "autocomplete": "off",
      "placeholder": "e.g. Cumulative MAP features released" }, []);
    var noteInput = el("textarea", {
      "placeholder": "e.g. A feature counts once it is released to production and listed in the release notes." }, []);
    var projectOnly = el("div", {}, []);
    var assocBoxes = {};

    if (targets) {
      card.appendChild(el("div", { "class": "wpg-fixed" }, [targets.pid + " " + targets.name]));
    } else {
      card.appendChild(el("label", {}, ["Row type"]));
      var radioRow = el("div", { "class": "wpg-radio-row" }, []);
      var kindProjLabel = el("label", {}, []);
      kindProjLabel.appendChild(kindProj);
      kindProjLabel.appendChild(document.createTextNode(" Sub-activity"));
      var kindActLabel = el("label", {}, []);
      kindActLabel.appendChild(kindAct);
      kindActLabel.appendChild(document.createTextNode(" Activity (top level)"));
      radioRow.appendChild(kindProjLabel);
      radioRow.appendChild(kindActLabel);
      card.appendChild(radioRow);

      // ── Parent picker → suggested id (sub-activity) ────────────
      var parentWrap = el("div", {}, []);
      parentWrap.appendChild(el("label", { "for": "wpg-add-parent" }, ["Under"]));
      parentSel.id = "wpg-add-parent";
      fillParentOptions(parentSel, ids, []);
      parentWrap.appendChild(parentSel);
      projectOnly.appendChild(parentWrap);
      card.appendChild(projectOnly);

      card.appendChild(el("label", { "for": "wpg-add-id" }, ["ID"]));
      idInput.id = "wpg-add-id";
      card.appendChild(idInput);
      card.appendChild(el("div", { "class": "wpg-sub", "style": "margin:0.2rem 0 0 0;font-size:0.72rem;" },
        ["Suggested from the parent. A sub-activity number starts with its Activity (3.9, 4.2.1); an Activity is a single number."]));

      card.appendChild(el("label", { "for": "wpg-add-name" }, ["Name"]));
      nameInput.id = "wpg-add-name";
      card.appendChild(nameInput);
    }

    // ── What the numbers count (sub-activity) ──────────────────────
    var countWrap = el("div", {}, []);
    if (!targets) {
      countWrap.appendChild(el("label", { "for": "wpg-add-unit" }, ["What it counts"]));
      unitInput.id = "wpg-add-unit";
      countWrap.appendChild(unitInput);
      countWrap.appendChild(el("label", { "for": "wpg-add-note" }, ["How it is counted"]));
      noteInput.id = "wpg-add-note";
      countWrap.appendChild(noteInput);
      card.appendChild(countWrap);
    }

    // ── Contributes to (sub-activity; the home Activity always links) ──
    var assocSection = el("div", {}, []);
    var assocLabels = {};
    // The dialog checks the home Activity for you. When the home changes (another
    // parent, a typed ID) it clears the box it checked before, unless you touched
    // that box: 4.7 kept the default parent's Activity 1 as a second link (S382).
    var autoHome = "", touchedBox = {};
    function setHome(home) {
      if (autoHome && autoHome !== home && !touchedBox[autoHome] && assocBoxes[autoHome]) {
        assocBoxes[autoHome].checked = false;
      }
      Object.keys(assocBoxes).forEach(function (aid) {
        var isHome = aid === home;
        if (isHome) assocBoxes[aid].checked = true;
        assocLabels[aid].textContent = " Activity " + aid + (isHome ? " (home)" : "");
      });
      autoHome = home;
    }
    if (!targets) {
      assocSection.appendChild(el("label", {}, ["Contributes to"]));
      var assocBox = el("div", { "class": "wpg-assoc-checkboxes" }, []);
      ids.activities.forEach(function (aid) {
        var lbl = el("label", {}, []);
        var cb = el("input", { "type": "checkbox", "value": aid }, []);
        assocBoxes[aid] = cb;
        cb.addEventListener("change", function () { touchedBox[aid] = true; });
        lbl.appendChild(cb);
        var txt = el("span", {}, [" Activity " + aid]);
        assocLabels[aid] = txt;
        lbl.appendChild(txt);
        assocBox.appendChild(lbl);
      });
      assocSection.appendChild(assocBox);
      card.appendChild(assocSection);
    }

    // ── Ladder fields (GOAL + STRETCH × 5 years) ─────────────────
    var goalInputs = {};
    var stretchInputs = {};
    function buildLadder(title, store) {
      card.appendChild(el("label", {}, [title]));
      var grid = el("div", { "class": "wpg-grid-years" }, []);
      YEARS.forEach(function (y) {
        var box = el("div", {}, []);
        var yid = "wpg-add-" + title.split(" ")[0].toLowerCase() + "-" + y.key;
        box.appendChild(el("label", { "for": yid,
          "style": "font-size:0.7rem;color:var(--text-muted);margin:0 0 0.15rem 0;font-weight:400;" }, [y.lbl]));
        var input = el("input", { "type": "number", "step": "any", "value": "0", "placeholder": "0", "id": yid }, []);
        store[y.key] = input;
        box.appendChild(input);
        grid.appendChild(box);
      });
      card.appendChild(grid);
    }
    buildLadder("Goal by year", goalInputs);
    buildLadder("Stretch by year", stretchInputs);

    // ── Status + Actions ─────────────────────────────────────────
    var status = el("div", { "class": "wpg-status", "role": "status", "aria-live": "polite" }, []);
    card.appendChild(status);

    var actions = el("div", { "class": "wpg-modal-actions" }, []);
    var btnCancel = el("button", { "class": "wpg-btn-cancel", "type": "button" }, ["Cancel"]);
    var btnSubmit = el("button", { "class": "wpg-btn-submit", "type": "button" }, [targets ? "Save targets" : "Add row"]);
    actions.appendChild(btnSubmit);   // the lead word first: no fill marks it (S364)
    actions.appendChild(btnCancel);
    card.appendChild(actions);

    function syncParent() {
      if (targets) return;
      var parent = parentSel.value;
      idInput.value = suggestChildId(ids.projects.concat(liveIds), parent);
      setHome(homeActivityOf(idInput.value));
    }
    function syncKindUI() {
      if (targets) return;
      var k = kindAct.checked ? "activity" : "project";
      projectOnly.style.display = (k === "project") ? "" : "none";
      countWrap.style.display = (k === "project") ? "" : "none";
      assocSection.style.display = (k === "project") ? "" : "none";
      idInput.placeholder = (k === "activity") ? "e.g. 5" : "e.g. 3.9";
      if (k === "activity") {
        var next = 1;
        ids.activities.forEach(function (a) { next = Math.max(next, parseInt(a, 10) + 1); });
        idInput.value = String(next);
      } else {
        syncParent();
      }
    }
    if (!targets) {
      if (opts.parent) parentSel.value = String(opts.parent);
      parentSel.addEventListener("change", function () { idTouched = false; syncParent(); });
      idInput.addEventListener("input", function () {
        idTouched = true;
        setHome(homeActivityOf(idInput.value));
      });
      kindAct.addEventListener("change", syncKindUI);
      kindProj.addEventListener("change", syncKindUI);
      syncKindUI();
    }
    fetchLiveProjects().then(function (live) {
      liveIds = live.ids;
      if (!targets) {
        var choice = parentSel.value;
        addLiveParents(parentSel, ids, live.parents);
        // A parent asked for by id (opts.parent) may only now be in the list.
        if (!choice && opts.parent) parentSel.value = String(opts.parent);
      }
      if (!targets && !idTouched && kindProj.checked) syncParent();
    });

    // Cancel / overlay click outside the card / Esc all close
    btnCancel.addEventListener("click", closeAddModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeAddModal();
    });
    _activeEscListener = function (e) {
      if (e.key === "Escape") closeAddModal();
    };
    document.addEventListener("keydown", _activeEscListener);

    btnSubmit.addEventListener("click", function () {
      submitAdd({
        state: state,
        ids: ids,
        liveIds: function () { return liveIds; },
        targets: targets,
        kindAct: kindAct,
        kindProj: kindProj,
        idInput: idInput,
        nameInput: nameInput,
        unitInput: unitInput,
        noteInput: noteInput,
        assocBoxes: assocBoxes,
        goalInputs: goalInputs,
        stretchInputs: stretchInputs,
        status: status,
        btnSubmit: btnSubmit
      });
    });

    document.body.appendChild(overlay);
    (targets ? goalInputs.yr_2025_26 : nameInput).focus();
  }

  /**
   * Validate the modal form. Returns { ok, errors[], payload } where
   * `payload` is null if invalid; otherwise carries the POST shapes.
   */
  function validateAdd(ctx) {
    var errors = [];
    var targets = ctx.targets || null;
    var kind = targets ? "project" : (ctx.kindAct.checked ? "activity" : "project");
    var rawId = targets ? String(targets.pid) : (ctx.idInput.value || "").trim();
    var name = targets ? String(targets.name || rawId) : (ctx.nameInput.value || "").trim();
    var home = homeActivityOf(rawId);
    var live = (ctx.liveIds && ctx.liveIds()) || [];
    var known = ctx.ids.projects.concat(live);

    if (!rawId) errors.push("ID is required.");
    if (!name) errors.push("Name is required.");

    if (rawId && !targets) {
      if (kind === "activity") {
        if (!/^[0-9]+$/.test(rawId)) {
          errors.push("An Activity ID is a single number (e.g. 5).");
        }
        if (ctx.ids.activities.indexOf(rawId) !== -1) {
          errors.push("Activity " + rawId + " already exists.");
        }
      } else {
        if (!/^[0-9]+(\.[0-9A-Za-z]+)+$/.test(rawId)) {
          errors.push("A sub-activity ID is numbers joined by dots under its parent (e.g. 3.9 or 4.2.1).");
        } else if (ctx.ids.activities.indexOf(home) === -1) {
          errors.push("Activity " + home + " does not exist. Pick the parent from Under.");
        }
        if (known.indexOf(rawId) !== -1) {
          errors.push(rawId + " is already in use. Pick the parent again for the next free number.");
        }
      }
    }

    // Associations: the home Activity always links; others as checked.
    var assocIds = [];
    if (kind === "project" && !targets) {
      Object.keys(ctx.assocBoxes || {}).forEach(function (aid) {
        if (ctx.assocBoxes[aid].checked) assocIds.push(aid);
      });
      if (home && assocIds.indexOf(home) === -1) assocIds.unshift(home);
    }

    if (errors.length) return { ok: false, errors: errors, payload: null };

    function valOf(input) {
      var n = parseFloat(input.value);
      return Number.isFinite(n) ? n : 0;
    }
    var goal = {};
    var stretch = {};
    var goalTotal = 0, stretchTotal = 0;
    Object.keys(ctx.goalInputs).forEach(function (k) {
      var v = valOf(ctx.goalInputs[k]); goal[k] = v; goalTotal += v;
    });
    Object.keys(ctx.stretchInputs).forEach(function (k) {
      var v = valOf(ctx.stretchInputs[k]); stretch[k] = v; stretchTotal += v;
    });

    function buildRow(rowType, values, total) {
      return Object.assign(
        { activity_id: rawId, name: name, row_type: rowType, kind: kind, total: total },
        values
      );
    }

    var projectRow = null;
    if (kind === "project" && !targets) {
      var unit = ((ctx.unitInput && ctx.unitInput.value) || "").trim();
      var note = ((ctx.noteInput && ctx.noteInput.value) || "").trim();
      projectRow = {
        id: rawId,
        name: name,
        // Grouping reads only the number; the name part matches the header.
        workplan_activity: "Activity " + home + (ctx.ids.activityNames && ctx.ids.activityNames[home]
          ? ": " + ctx.ids.activityNames[home] : ""),
        status: "Not Started",
        percent_complete: 0,
        kpi_unit: unit || null,
        count_note: note || null
      };
    }

    return {
      ok: true,
      errors: [],
      payload: {
        kind: kind,
        targets: !!targets,
        projectRow: projectRow,
        wpgRows: [
          buildRow("GOAL", goal, goalTotal),
          buildRow("STRETCH", stretch, stretchTotal)
        ],
        assocRows: assocIds.map(function (aid) {
          return { project_id: rawId, activity_id: aid, is_primary: aid === home };
        })
      }
    };
  }

  // After Set targets saves, the row's ladder edits at once: its blank cells take
  // the attributes the generator prints for a laddered row (Goal and Stretch from
  // the dialog, Current empty), and Set targets leaves the row.
  function activateLadder(state, pid, ladder) {
    var name = document.querySelector('[data-no-ladder="1"][data-pid="' + pid + '"]');
    if (!name) return;
    var goalRow = name.parentNode;
    var rows = { GOAL: goalRow, CURRENT: goalRow && goalRow.nextElementSibling,
                 STRETCH: goalRow && goalRow.nextElementSibling && goalRow.nextElementSibling.nextElementSibling };
    Object.keys(rows).forEach(function (rt) {
      var r = rows[rt];
      if (!r) return;
      var vals = (ladder && ladder[rt]) || {};
      var total = 0;
      r.querySelectorAll("td.wpg-val").forEach(function (td) {
        var y = YEAR_BY_SHORT[td.getAttribute("data-label")];
        if (!y) return;
        var key = rt === "CURRENT" ? y.cur : y.key;
        var v = Number(vals[key] || 0);
        total += v;
        td.setAttribute("data-editable", "1");
        td.setAttribute("data-aid", pid);
        td.setAttribute("data-kind", "project");
        td.setAttribute("data-rt", rt);
        td.setAttribute("data-yr", y.lbl);
        td.setAttribute("data-yr-key", key);
        td.setAttribute("data-val", String(v));
        td.textContent = v ? fmtVal(v, false) : "";
      });
      var tot = r.querySelector('td.wpg-val[data-label="Total"]');
      if (tot) {
        tot.setAttribute("data-aid", pid);
        tot.setAttribute("data-kind", "project");
        tot.setAttribute("data-rt", rt);
        tot.setAttribute("data-total", "1");
        tot.setAttribute("data-val", String(total));
        tot.textContent = total ? fmtVal(total, false) : "";
      }
    });
    name.removeAttribute("data-no-ladder");
    var ctl = name.querySelector(".wpg-set-targets-row");
    if (ctl) ctl.remove();
    paintEditability(state);
  }

  function submitAdd(ctx) {
    var v = validateAdd(ctx);
    ctx.status.className = "wpg-status";
    if (!v.ok) {
      ctx.status.className = "wpg-status err";
      ctx.status.innerHTML = "";
      v.errors.forEach(function (e) { ctx.status.appendChild(el("div", {}, [e])); });
      return;
    }

    ctx.btnSubmit.disabled = true;
    ctx.status.className = "wpg-status";
    ctx.status.textContent = "Saving…";

    var sess = ctx.state.sess;
    var headers = authHeaders(sess, "return=representation");
    var projectAdded = false;

    // Each insert names its table as a literal beside its method, so the Admin tab's
    // surface map and the dependency map (both static scans) see all three writes.
    function checked(table) {
      return function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            var err = new Error(table + " insert failed (HTTP " + r.status + "): " + t.slice(0, 200));
            err.status = r.status;
            throw err;
          });
        }
      };
    }

    var chain = Promise.resolve();
    if (v.payload.projectRow) {
      chain = chain.then(function () {
        return fetch(SUPABASE_URL + "/rest/v1/projects", { method: "POST", headers: headers,
          body: JSON.stringify(v.payload.projectRow) }).then(checked("projects"));
      }).then(function () { projectAdded = true; });
    }
    function postRows(rows) {
      return fetch(SUPABASE_URL + "/rest/v1/workplan_goals", { method: "POST", headers: headers,
        body: JSON.stringify(rows) }).then(checked("workplan_goals"));
    }
    var ladderId = v.payload.wpgRows[0].activity_id;
    chain = chain.then(function () {
      if (!v.payload.targets) return postRows(v.payload.wpgRows);
      // Set targets patches a ladder row that already exists and inserts only the
      // missing ones. A second press used to insert a second pair (1.1.1 carried four
      // GOAL and four STRETCH rows after 2026-10-14), because the row kept its Set
      // targets control until the nightly rebuild; activateLadder below removes it.
      return fetch(SUPABASE_URL + "/rest/v1/workplan_goals?select=id,row_type&activity_id=eq."
          + encodeURIComponent(ladderId) + "&kind=eq.project", { headers: { "apikey": SUPABASE_ANON } })
        .then(function (r) { return r.ok ? r.json() : []; }).then(null, function () { return []; })
        .then(function (have) {
          var present = {};
          (Array.isArray(have) ? have : []).forEach(function (x) { if (x && x.row_type) present[x.row_type] = true; });
          var seq = Promise.resolve();
          v.payload.wpgRows.filter(function (row) { return present[row.row_type]; }).forEach(function (row) {
            seq = seq.then(function () {
              var body = {};
              Object.keys(row).forEach(function (k) { if (/^yr_/.test(k) || k === "total") body[k] = row[k]; });
              return fetch(SUPABASE_URL + "/rest/v1/workplan_goals?activity_id=eq." + encodeURIComponent(row.activity_id)
                  + "&row_type=eq." + row.row_type + "&kind=eq.project",
                { method: "PATCH", headers: headers, body: JSON.stringify(body) }).then(checked("workplan_goals"));
            });
          });
          var missing = v.payload.wpgRows.filter(function (row) { return !present[row.row_type]; });
          if (missing.length) seq = seq.then(function () { return postRows(missing); });
          return seq;
        });
    });
    if (v.payload.kind === "project" && v.payload.assocRows.length) {
      chain = chain.then(function () {
        return fetch(SUPABASE_URL + "/rest/v1/workplan_activity_associations", { method: "POST", headers: headers,
          body: JSON.stringify(v.payload.assocRows) }).then(checked("workplan_activity_associations"));
      });
    }
    chain.then(function () {
      if (v.payload.targets) {
        activateLadder(ctx.state, ladderId, { GOAL: v.payload.wpgRows[0], STRETCH: v.payload.wpgRows[1] });
      }
      paintNewRows(ctx.state);
      return queueRebuild(sess);
    }).then(function (q) {
      ctx.status.className = "wpg-status ok";
      ctx.status.textContent = v.payload.targets
        ? "Saved. The row edits now; the Activities tab follows " + whenShown(q) + "."
        : "Added. It appears on Annual Workplan Goals and the Activities tab " + whenShown(q) + ".";
      ctx.btnSubmit.textContent = "Done";
      ctx.btnSubmit.disabled = false;
      ctx.btnSubmit.onclick = closeAddModal;
    }).catch(function (e) {
      ctx.btnSubmit.disabled = false;
      ctx.status.className = "wpg-status err";
      ctx.status.textContent = (e.message || "Save failed.")
        + (projectAdded ? " The sub-activity itself was saved; use Set targets on its row after the rebuild to finish." : "");
      console.error("[workplan_goals] add failed:", e);
      // Real HTTP status threaded onto the error — never regex the message
      // (the response-body slice could contain "401" as data and spuriously
      // drop a valid phrase for the whole browser).
      if (e.status) maybeDropStalePhrase(sess, e.status);
    });
  }

  // ─── Init ────────────────────────────────────────────────────────────────
  function init() {
    if (!document.getElementById("tab-workplan-goals")) return;
    injectStyles();
    var state = { sess: fullSession() };
    mountAuthWidget(state);
    paintEditability(state);
    paintNewRows(state);
    // The association popover + its click delegation live in assoc_editor.js
    // (bound once, document-wide). We only re-light its affordance here.
    paintAssocEditability();
    attachClickHandler(state);

    // Re-paint when the tab becomes visible (in case sign-in happened on
    // another tab and the URL fragment now reflects us).
    window.addEventListener("hashchange", function () {
      state.sess = fullSession();
      mountAuthWidget(state);
      paintEditability(state);
      paintAssocEditability();
    });
    // An unlock anywhere (the Activities tab included) lights the editors.
    window.addEventListener("cpl-team-pass-unlocked", function () {
      state.sess = fullSession();
      mountAuthWidget(state);
      paintEditability(state);
      paintAssocEditability();
    });
    // A Table, Archive or Restore saved on either tab redraws the list here.
    window.addEventListener("cpl-lifecycle-changed", function () { paintTabledList(state); });
    // The one add dialog, for the Activities tab and tests.
    window.CPL_WORKPLAN_ADD = {
      open: function (o) {
        state.sess = fullSession();
        if (!state.sess) return false;
        openAddModal(state, o);
        return true;
      },
      move: function (pid, name) {
        state.sess = fullSession();
        if (!canMove(state.sess)) return false;
        openMoveModal(state, pid, name || "");
        return true;
      },
      suggestChildId: suggestChildId,
      homeActivityOf: homeActivityOf,
      collectExistingIds: collectExistingIds,
      validateAdd: validateAdd
    };
    // A write under a rotated phrase dropped it — re-render lock state.
    window.addEventListener("cpl-team-pass-dropped", function () {
      state.sess = fullSession();
      mountAuthWidget(state);
      paintEditability(state);
      paintAssocEditability();
    });
    // A row tabled, archived or restored on either tab (project_lifecycle.js) is a
    // removal or a return: it queues the build too.
    window.addEventListener("cpl-lifecycle-changed", function () {
      var sess = fullSession();
      if (sess) queueRebuild(sess);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
