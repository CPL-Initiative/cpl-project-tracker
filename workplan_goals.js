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
 *         headline KPI (PATCH workplan_goals.current on the GOAL row); the
 *         KPI-mapped ones render the live value read-only (no edit affordance),
 *         so the table matches the headline card by construction.
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
    body.total = new_total;
    return fetch(SUPABASE_URL + "/rest/v1/workplan_goals?" + qs, {
      method: "PATCH",
      headers: authHeaders(sess, "return=representation"),
      body: JSON.stringify(body)
    });
  }

  /**
   * Session 85 — manual "Current" editor. Writes the single Current value to
   * workplan_goals.current on the GOAL row (canonical; the generator reads it
   * there). Only fires on UNMAPPED sub-activities — KPI-mapped ones render the
   * live value read-only (no data-current-edit attr), so they never reach here.
   */
  function saveCurrent(activity_id, value, sess) {
    var qs = "activity_id=eq." + encodeURIComponent(activity_id)
           + "&row_type=eq.GOAL";
    return fetch(SUPABASE_URL + "/rest/v1/workplan_goals?" + qs, {
      method: "PATCH",
      headers: authHeaders(sess, "return=representation"),
      body: JSON.stringify({ current: value })
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

  // ─── Auth widget (banner at top of tab) ──────────────────────────────────
  function buildAuthWidget(state, onChange) {
    var widget = el("div", {
      "class": "wpg-auth-widget",
      "style": "margin:1rem 0 0.5rem 0;padding:0.75rem 1rem;background:var(--surface-subtle);border-radius:8px;font-size:0.85rem;color:var(--text-strong);display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;"
    }, []);

    if (state.sess) {
      widget.appendChild(el("span", { "style": "font-weight:600;" },
        state.sess.teamPass
          ? ["Editing unlocked (team phrase)"]
          : ["Signed in as ", state.sess.email || "(no email)"]));
      var sub = el("span", { "style": "color:var(--text-muted);" }, ["Click any goal/stretch/current cell or a sub-activity title to edit • Enter saves • Esc cancels"]);
      widget.appendChild(sub);
      var btnAdd = el("button", {
        "class": "wpg-btn wpg-btn-add"
      }, ["Add new row"]);
      btnAdd.addEventListener("click", function () { openAddModal(state); });
      widget.appendChild(btnAdd);
      var btnOut = el("button", {
        "class": "wpg-btn"
      }, [state.sess.teamPass ? "Lock" : "Sign out"]);
      btnOut.addEventListener("click", function () {
        signOut();
        onChange();
      });
      widget.appendChild(btnOut);
    } else {
      widget.appendChild(el("span", { "style": "color:var(--text-muted);" },
        ["Sign in (CCCCO MAP only) to edit goal + stretch values."]));
      var emailInput = el("input", {
        "type": "email",
        "placeholder": "you@example.edu",
        "style": "padding:0.35rem 0.5rem;border:1px solid var(--border-strong);border-radius:5px;font-size:0.8rem;min-width:180px;"
      }, []);
      var btnIn = el("button", {
        "class": "wpg-btn"
      }, ["Sign in"]);
      var status = el("span", { "style": "color:var(--text-muted);flex-basis:100%;font-size:0.8rem;" }, []);

      btnIn.addEventListener("click", function () {
        var email = (emailInput.value || "").trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          status.textContent = "Enter a valid email address.";
          status.style.color = "var(--red-alert)";
          return;
        }
        status.style.color = "var(--text-strong)";
        status.textContent = "Sending magic link...";
        signIn(email).then(function (r) {
          if (r.ok) {
            status.style.color = "var(--green-progress)";
            status.innerHTML = '✉ Magic link sent to <strong>' + email + '</strong>. Click the link in your inbox to finish signing in.';
          } else if (r.status === 429) {
            status.style.color = "var(--red-alert)";
            status.textContent = "Too many sign-in emails. Wait a few minutes, then try again.";
          } else if (r.status === 400 || r.status === 422) {
            status.style.color = "var(--red-alert)";
            status.textContent = "Server rejected the sign-in — confirm your email is on the allowed-reviewers list.";
          } else {
            status.style.color = "var(--red-alert)";
            status.textContent = "Sign-in failed (HTTP " + r.status + ").";
          }
        }).catch(function (e) {
          status.style.color = "var(--red-alert)";
          status.textContent = "Network error sending magic link: " + e.message;
        });
      });

      widget.appendChild(emailInput);
      widget.appendChild(btnIn);
      // Team-phrase alternative (Phase 1 widening, 2026-07-03) — validated
      // server-side before store; one unlock covers every phrase-enabled tab.
      if (window.CPL_TEAM_PHRASE) {
        widget.appendChild(el("span", { "style": "color:var(--text-muted);" }, ["·"]));
        widget.appendChild(window.CPL_TEAM_PHRASE.unlockRow({
          blurb: "or the team phrase:",
          onUnlocked: function () { onChange(); }
        }));
      }
      widget.appendChild(status);
    }

    return widget;
  }

  function mountAuthWidget(state) {
    var tab = document.getElementById("tab-workplan-goals");
    if (!tab) return;
    var existing = tab.querySelector(".wpg-auth-widget");
    var widget = buildAuthWidget(state, function () {
      state.sess = fullSession();
      mountAuthWidget(state);
      paintEditability(state);
      // Shared editor re-lights its affordance + closes the popover on sign-out.
      paintAssocEditability();
    });
    if (existing) existing.replaceWith(widget);
    else tab.insertBefore(widget, tab.firstChild);
  }

  // ─── Editability painting ───────────────────────────────────────────────
  /**
   * For every cell with data-editable="1": toggle a class that exposes the
   * pointer-cursor + hover affordance based on whether we have a session.
   */
  function paintEditability(state) {
    // Session 85: light up the year-ladder cells AND the new manual-Current
    // cells + editable titles. Live-synced Current cells carry no edit attr, so
    // they're never selected here (read-only by construction).
    var cells = document.querySelectorAll(
      '[data-editable="1"], [data-current-edit="1"], [data-title-edit="1"], '
      + '[data-desc-edit="1"], [data-activity-title-edit="1"], [data-activity-desc-edit="1"], '
      + '[data-unit-edit="1"], [data-note-edit="1"]');
    cells.forEach(function (c) {
      if (state.sess) c.classList.add("wpg-editable");
      else c.classList.remove("wpg-editable");
    });
    paintCountLines(state);
    paintSetTargets(state);
    paintActivityAddLinks(state);
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

  // ─── Per-cell edit interaction ──────────────────────────────────────────
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
      "style": "width:100%;box-sizing:border-box;padding:2px 4px;font:inherit;border:1px solid var(--cobalt);border-radius:3px;text-align:right;background:var(--surface-opaque);"
    }, []);

    cell.classList.add("wpg-editing");
    var prevHtml = cell.innerHTML;
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    input.select();

    function cancel() {
      cell.innerHTML = prevHtml;
      cell.classList.remove("wpg-editing");
    }

    function commit() {
      var newNum = parseInput(input.value, isPct);
      if (newNum === null) {
        input.style.borderColor = "var(--red-alert)";
        return;
      }
      if (newNum === oldNum) {
        cancel();
        return;
      }
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

      saveCell(activity_id, row_type, year_key, newNum, newTotal, state.sess, kind)
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
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); }
    });
    input.addEventListener("blur", commit);
  }

  // ─── Session 85: manual "Current" cell editor ───────────────────────────
  function startCurrentEdit(cell, state) {
    if (!state.sess) return;
    if (cell.classList.contains("wpg-editing")) return;
    var activity_id = cell.getAttribute("data-aid");
    var isPct = cell.getAttribute("data-pct") === "1";
    if (!activity_id) return;

    var oldNum = Number(cell.getAttribute("data-val") || "0");
    var input = el("input", {
      "type": "text",
      "value": isPct && oldNum ? (Math.round(oldNum * 100) + "%") : (oldNum || ""),
      "class": "wpg-cell-input",
      "style": "width:100%;box-sizing:border-box;padding:2px 4px;font:inherit;border:1px solid var(--cobalt);border-radius:3px;text-align:right;background:var(--surface-opaque);"
    }, []);
    cell.classList.add("wpg-editing");
    var prevHtml = cell.innerHTML;
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    input.select();

    function paintCell(c, num, saving) {
      c.setAttribute("data-val", String(num));
      c.innerHTML = fmtVal(num, isPct)
        + ' <span class="wpg-manual-hint" aria-hidden="true">✎</span>';
      if (saving) c.classList.add("wpg-saving");
    }
    function cancel() {
      cell.innerHTML = prevHtml;
      cell.classList.remove("wpg-editing");
    }
    function commit() {
      var newNum = parseInput(input.value, isPct);
      if (newNum === null) { input.style.borderColor = "var(--red-alert)"; return; }
      if (newNum === oldNum) { cancel(); return; }
      // The TOTAL cell mirrors the single Current value (no ✎ hint there).
      var totalCell = document.querySelector(
        '[data-current-total="1"][data-aid="' + activity_id + '"]');
      cell.classList.remove("wpg-editing");
      paintCell(cell, newNum, true);
      if (totalCell) {
        totalCell.classList.add("wpg-saving");
        totalCell.innerHTML = fmtVal(newNum, isPct);
      }
      saveCurrent(activity_id, newNum, state.sess).then(writeResult).then(function (r) {
        var ok = r.ok;
        var paint = ok ? "wpg-saved" : "wpg-error";
        [cell, totalCell].forEach(function (c) {
          if (!c) return;
          c.classList.remove("wpg-saving");
          c.classList.add(paint);
          setTimeout(function () { c.classList.remove(paint); }, 1500);
        });
        if (!ok) {
          paintCell(cell, oldNum, false);
          if (totalCell) totalCell.innerHTML = fmtVal(oldNum, isPct);
          console.error("[workplan_goals] current save failed:", r.status);
            maybeDropStalePhrase(state.sess, r.status);
        }
      }).catch(function (e) {
        cell.classList.remove("wpg-saving");
        cell.classList.add("wpg-error");
        paintCell(cell, oldNum, false);
        if (totalCell) { totalCell.classList.remove("wpg-saving"); totalCell.innerHTML = fmtVal(oldNum, isPct); }
        setTimeout(function () { cell.classList.remove("wpg-error"); }, 2000);
        console.error("[workplan_goals] current save error:", e);
      });
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); }
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
      "style": "width:100%;box-sizing:border-box;padding:2px 4px;font:inherit;border:1px solid var(--cobalt);border-radius:3px;background:var(--surface-opaque);"
    }, []);
    cell.classList.add("wpg-editing");
    var prevHtml = cell.innerHTML;
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    input.select();

    function cancel() {
      cell.innerHTML = prevHtml;
      cell.classList.remove("wpg-editing");
    }
    function commit() {
      var newName = (input.value || "").trim();
      if (!newName) { input.style.borderColor = "var(--red-alert)"; return; }
      if (newName === oldName.trim()) { cancel(); return; }
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
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); }
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
        e.preventDefault(); commit();
      } else if (e.key === "Escape") {
        e.preventDefault(); cancel();
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
      save: function (v, sess) { return saveProjectField(pid, { count_note: v || null }, sess); }
    });
  }

  function attachClickHandler(state) {
    // Use event delegation on the body — works for both tab tables.
    document.body.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        if (target.getAttribute) {
          if (target.getAttribute("data-editable") === "1") {
            startEdit(target, state); return;
          }
          if (target.getAttribute("data-current-edit") === "1") {
            startCurrentEdit(target, state); return;
          }
          if (target.getAttribute("data-title-edit") === "1") {
            startTitleEdit(target, state); return;
          }
          if (target.getAttribute("data-desc-edit") === "1") {
            startDescEdit(target, state); return;
          }
          if (target.getAttribute("data-activity-title-edit") === "1") {
            startActivityTitleEdit(target, state); return;
          }
          if (target.getAttribute("data-activity-desc-edit") === "1") {
            startActivityDescEdit(target, state); return;
          }
          if (target.getAttribute("data-unit-edit") === "1") {
            startUnitEdit(target, state); return;
          }
          if (target.getAttribute("data-note-edit") === "1") {
            startNoteEdit(target, state); return;
          }
        }
        target = target.parentNode;
      }
    });
  }

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
      + '.wpg-modal-card .wpg-assoc-checkboxes label { display:flex;align-items:center;gap:0.3rem;font-size:0.78rem;font-weight:500;margin:0;color:var(--text-strong);cursor:pointer; }'
      + '.wpg-modal-card .wpg-status { margin-top:0.75rem;font-size:0.82rem;min-height:1.2em; }'
      + '.wpg-modal-card .wpg-status.ok { color:var(--green-progress); }'
      + '.wpg-modal-card .wpg-status.err { color:var(--red-alert); }'
      + '.wpg-modal-card .wpg-modal-actions { display:flex;justify-content:flex-end;gap:0.5rem 18px;margin-top:1rem; }'
      + '.wpg-modal-card .wpg-btn-submit:disabled { color:var(--text-muted);text-decoration:none;cursor:not-allowed; }'
      + '.wpg-act-chip { display:inline-block;padding:0.05rem 0.4rem;background:var(--surface-muted);color:var(--navy-secondary);border-radius:10px;font-size:0.7rem;font-weight:600; }'
      // Session 85 — Current hybrid + title editor affordances
      + '.wpg-live-badge { display:inline-block;margin-left:0.35rem;padding:0.02rem 0.34rem;background:var(--cobalt,#2A6FB0);color:var(--on-accent);border-radius:8px;font-size:0.6rem;font-weight:700;letter-spacing:0.02em;vertical-align:middle;white-space:nowrap; }'
      + '.wpg-manual-hint { color:var(--text-muted);font-size:0.72rem; }'
      + '.wpg-editable.wpg-manual-hint, .wpg-editable .wpg-manual-hint { color:var(--cobalt); }'
      + '.wpg-title-cell { border-radius:3px; }'
      + '.wpg-count-label { font-weight:600; }'
      + '.wpg-empty { font-style:italic; }'
      + '.wpg-set-targets-row { margin-top:0.3rem; }'
      + '.wpg-add-sub { font-size:0.72rem; }'
      + '.wpg-modal-card select, .wpg-modal-card textarea { width:100%;padding:0.4rem 0.55rem;border:1px solid var(--border-strong);border-radius:5px;font:inherit;font-size:0.85rem;box-sizing:border-box;background:var(--surface-opaque);color:var(--text-strong); }'
      + '.wpg-modal-card textarea { min-height:4.2em;resize:vertical; }'
      + '.wpg-modal-card .wpg-fixed { font-size:0.95rem;font-weight:600;margin:0.4rem 0 0.2rem 0; }';
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
      : "Adds a sub-activity with its goals, or a new top-level Activity. It appears on both tabs after tonight's rebuild."]));

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
      ids.activities.forEach(function (aid) {
        parentSel.appendChild(el("option", { "value": aid },
          ["Activity " + aid + (ids.activityNames[aid] ? ": " + ids.activityNames[aid] : "")]));
      });
      ids.projects.forEach(function (pid) {
        var depth = pid.split(".").length - 1;
        parentSel.appendChild(el("option", { "value": pid },
          [new Array(depth + 1).join("\u00a0\u00a0\u00a0\u00a0") + pid + " " + (ids.projectNames[pid] || "")]));
      });
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
    if (!targets) {
      assocSection.appendChild(el("label", {}, ["Contributes to"]));
      var assocBox = el("div", { "class": "wpg-assoc-checkboxes" }, []);
      ids.activities.forEach(function (aid) {
        var lbl = el("label", {}, []);
        var cb = el("input", { "type": "checkbox", "value": aid }, []);
        assocBoxes[aid] = cb;
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
    var YEARS = [
      { lbl: "2025-26", key: "yr_2025_26" },
      { lbl: "2026-27", key: "yr_2026_27" },
      { lbl: "2027-28", key: "yr_2027_28" },
      { lbl: "2028-29", key: "yr_2028_29" },
      { lbl: "2029-30", key: "yr_2029_30" }
    ];
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
      var home = homeActivityOf(idInput.value);
      Object.keys(assocBoxes).forEach(function (aid) {
        var isHome = aid === home;
        if (isHome) assocBoxes[aid].checked = true;
        assocLabels[aid].textContent = " Activity " + aid + (isHome ? " (home)" : "");
      });
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
        var home = homeActivityOf(idInput.value);
        Object.keys(assocLabels).forEach(function (aid) {
          assocLabels[aid].textContent = " Activity " + aid + (aid === home ? " (home)" : "");
        });
      });
      kindAct.addEventListener("change", syncKindUI);
      kindProj.addEventListener("change", syncKindUI);
      syncKindUI();
    }
    fetchProjectIds().then(function (list) {
      liveIds = list;
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

    function post(table, body) {
      return fetch(SUPABASE_URL + "/rest/v1/" + table, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            var err = new Error(table + " insert failed (HTTP " + r.status + "): " + t.slice(0, 200));
            err.status = r.status;
            throw err;
          });
        }
      });
    }

    var chain = Promise.resolve();
    if (v.payload.projectRow) {
      chain = chain.then(function () { return post("projects", v.payload.projectRow); })
                   .then(function () { projectAdded = true; });
    }
    chain = chain.then(function () { return post("workplan_goals", v.payload.wpgRows); });
    if (v.payload.kind === "project" && v.payload.assocRows.length) {
      chain = chain.then(function () {
        return post("workplan_activity_associations", v.payload.assocRows);
      });
    }
    chain.then(function () {
      ctx.status.className = "wpg-status ok";
      ctx.status.textContent = v.payload.targets
        ? "Saved. The targets appear in the table after tonight's rebuild."
        : "Added. It appears on Annual Workplan Goals and the Activities tab after tonight's rebuild.";
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
    // The one add dialog, for the Activities tab and tests.
    window.CPL_WORKPLAN_ADD = {
      open: function (o) {
        state.sess = fullSession();
        if (!state.sess) return false;
        openAddModal(state, o);
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
