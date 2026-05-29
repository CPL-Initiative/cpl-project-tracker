/*
 * projects_editor.js — inline editor for the Dashboard tab's project cards.
 *
 * Phase 2 PR-5: hydrates the Python-rendered project cards
 * (_render_single_project_card in excel_to_dashboard.py) with click-to-edit
 * affordances. Each editable field PATCHes the matching column on Supabase
 * public.projects (the projects-grid source of truth as of Phase 2 PR-4 — no
 * overlay layer). Mirrors the proven workplan_goals.js editor pattern.
 *
 * Scope (narrow per PR-5 sizing):
 *   - EDIT-ONLY on the existing 34 project cards. NO add-row flow, NO delete.
 *   - 17 editable fields per card (12 single-line inline inputs, 5 multi-line
 *     modal textareas). Field -> Supabase column mapping is baked into the
 *     renderer's data-field attribute, so this file just reads it back.
 *
 * Auth: shared magic-link session via sessionStorage `cpl_sb` (the same session
 * unified_courses.js / credential_reference.js use). After sign-in, editable
 * fields light up; click -> input/modal -> save. Saves optimistically paint the
 * field and roll back on error.
 *
 * Filter consistency: dashboard_filters.js reads data-status / data-lead /
 * data-goal off the .project-card wrapper. When those columns are edited the
 * wrapper attribute is updated in lock-step so the Dashboard filters stay
 * consistent without a page reload. A percent_complete edit also repaints the
 * .progress-bar-fill width (+ --progress-width var) and the "{pct}%" label.
 *
 * RLS: public.projects writes are gated to is_allowed_reviewer() (tightened
 * live in Phase 2 PR-3). A signed-in but non-allowed user's PATCH returns 0
 * rows / an error and the optimistic paint rolls back.
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
      sessionStorage.setItem("cpl_sb_return_tab", "dashboard");
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
  }

  // ─── Save ────────────────────────────────────────────────────────────────
  /**
   * PATCH a single column on the projects row identified by `pid`.
   * The projects PK is a single `id`, so (unlike workplan_goals) there is no
   * kind= filter. `value` is sent as-is; numeric coercion is the caller's job.
   */
  function saveField(pid, column, value, sess) {
    var body = {};
    body[column] = value;
    return fetch(SUPABASE_URL + "/rest/v1/projects?id=eq." + encodeURIComponent(pid), {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(body)
    });
  }

  // ─── Auth widget (banner above the projects grid) ────────────────────────
  function buildAuthWidget(state, onChange) {
    var widget = el("div", { "class": "proj-auth-widget" }, []);

    if (state.sess) {
      widget.appendChild(el("span", { "style": "font-weight:600;" },
        ["Signed in as ", state.sess.email || "(no email)"]));
      widget.appendChild(el("span", { "style": "color:#666;" },
        ["Click any project field to edit • Enter saves • Esc cancels"]));
      var btnOut = el("button", { "class": "proj-btn proj-btn-out", "style": "margin-left:auto;" }, ["Sign out"]);
      btnOut.addEventListener("click", function () { signOut(); onChange(); });
      widget.appendChild(btnOut);
    } else {
      widget.appendChild(el("span", { "style": "color:#666;" },
        ["Sign in (CCCCO MAP only) to edit project details."]));
      var emailInput = el("input", { "type": "email", "placeholder": "you@example.edu" }, []);
      var btnIn = el("button", { "class": "proj-btn" }, ["Sign in"]);
      var status = el("span", { "style": "color:#666;flex-basis:100%;font-size:0.8rem;" }, []);

      btnIn.addEventListener("click", function () {
        var email = (emailInput.value || "").trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          status.textContent = "Enter a valid email address.";
          status.style.color = "#A33";
          return;
        }
        status.style.color = "#0A2240";
        status.textContent = "Sending magic link...";
        signIn(email).then(function (r) {
          if (r.ok) {
            status.style.color = "#2A7D4F";
            status.innerHTML = '✉ Magic link sent to <strong>' + email + '</strong>. Click the link in your inbox to finish signing in.';
          } else if (r.status === 429) {
            status.style.color = "#A33";
            status.textContent = "Too many sign-in emails. Wait a few minutes, then try again.";
          } else if (r.status === 400 || r.status === 422) {
            status.style.color = "#A33";
            status.textContent = "Server rejected the sign-in — confirm your email is on the allowed-reviewers list.";
          } else {
            status.style.color = "#A33";
            status.textContent = "Sign-in failed (HTTP " + r.status + ").";
          }
        }).catch(function (e) {
          status.style.color = "#A33";
          status.textContent = "Network error sending magic link: " + e.message;
        });
      });

      widget.appendChild(emailInput);
      widget.appendChild(btnIn);
      widget.appendChild(status);
    }

    return widget;
  }

  function mountAuthWidget(state) {
    var grid = document.getElementById("projectsGrid");
    if (!grid) return;
    // Anchor: the Projects <h2> that immediately precedes #projectsGrid.
    var anchor = grid.previousElementSibling;
    if (!anchor || anchor.tagName !== "H2") anchor = grid;
    var parent = anchor.parentNode;
    var existing = parent.querySelector(".proj-auth-widget");
    var widget = buildAuthWidget(state, function () {
      state.sess = getSession();
      mountAuthWidget(state);
      paintEditability(state);
    });
    if (existing) existing.replaceWith(widget);
    else parent.insertBefore(widget, anchor);
  }

  // ─── Editability painting ───────────────────────────────────────────────
  function paintEditability(state) {
    var grid = document.getElementById("projectsGrid");
    if (!grid) return;
    var cells = grid.querySelectorAll('[data-editable="1"]');
    cells.forEach(function (c) {
      if (state.sess) c.classList.add("proj-on");
      else c.classList.remove("proj-on");
    });
  }

  // ─── Helpers for optimistic display ─────────────────────────────────────
  function displayFor(type, raw) {
    if (raw === null || raw === undefined || raw === "") {
      return type === "date" ? "(set date)" : "";
    }
    return String(raw);
  }

  // Update the .project-card wrapper data-* attrs that dashboard_filters.js
  // reads, so a live edit keeps the Dashboard filters consistent without a
  // reload. status -> data-status, lead -> data-lead, cpl_goal -> data-goal.
  function syncWrapperAttr(cell, column, value) {
    var card = cell.closest(".project-card");
    if (!card) return;
    if (column === "status") card.setAttribute("data-status", value);
    else if (column === "lead") card.setAttribute("data-lead", value);
    else if (column === "cpl_goal") card.setAttribute("data-goal", value);
  }

  // Repaint the progress bar + label after a percent_complete edit.
  function repaintProgress(cell, pct) {
    var card = cell.closest(".project-card");
    if (!card) return;
    var n = Number(pct);
    if (!Number.isFinite(n)) return;
    var fill = card.querySelector(".progress-bar-fill");
    if (fill) {
      fill.style.width = n + "%";
      fill.style.setProperty("--progress-width", n + "%");
    }
  }

  // ─── Single-line inline edit ────────────────────────────────────────────
  function startInlineEdit(cell, state) {
    if (cell.classList.contains("proj-editing")) return;
    var pid = cell.getAttribute("data-pid");
    var column = cell.getAttribute("data-field");
    var type = cell.getAttribute("data-type") || "text";
    var oldVal = cell.getAttribute("data-val") || "";
    if (!pid || !column) return;

    var inputType = type === "num" ? "number" : (type === "date" ? "date" : "text");
    var input = el("input", {
      "type": inputType,
      "value": oldVal,
      "class": "proj-cell-input"
    }, []);
    if (type === "num") {
      input.setAttribute("min", "0");
      input.setAttribute("max", "100");
      input.setAttribute("step", "1");
    }
    input.style.width = type === "date" ? "auto" : "100%";

    var prevHtml = cell.innerHTML;
    cell.classList.add("proj-editing");
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    if (input.select) input.select();

    var done = false;
    function cancel() {
      if (done) return;
      done = true;
      cell.innerHTML = prevHtml;
      cell.classList.remove("proj-editing");
    }

    function commit() {
      if (done) return;
      var raw = (input.value || "").trim();

      // Numeric validation + clamp for percent_complete.
      var sendVal = raw;
      if (type === "num") {
        if (raw === "") { input.style.borderColor = "#A33"; return; }
        var n = parseFloat(raw.replace(/[%,]/g, ""));
        if (!Number.isFinite(n)) { input.style.borderColor = "#A33"; return; }
        n = Math.max(0, Math.min(100, Math.round(n)));
        sendVal = n;
        raw = String(n);
      } else if (type === "date") {
        // Empty date -> NULL (PostgREST accepts JSON null for nullable cols).
        sendVal = raw === "" ? null : raw;
      } else {
        // Empty text -> NULL so a cleared field doesn't store "".
        sendVal = raw === "" ? null : raw;
      }

      if (raw === oldVal) { cancel(); return; }

      done = true;
      // Optimistic paint.
      var bodyHtml;
      if (type === "num") {
        bodyHtml = raw + "%";
      } else {
        var disp = displayFor(type, raw);
        // Lead/Budget-style fields show a "(none)" placeholder when cleared.
        if (!disp) disp = (type === "date") ? "(set date)" : "(none)";
        bodyHtml = disp;
      }
      cell.classList.remove("proj-editing");
      cell.classList.add("proj-saving");
      cell.innerHTML = bodyHtml;
      cell.setAttribute("data-val", raw);

      // Live filter-attr + progress-bar consistency BEFORE the round-trip
      // (rolled back on failure).
      syncWrapperAttr(cell, column, raw);
      if (column === "percent_complete") repaintProgress(cell, sendVal);

      saveField(pid, column, sendVal, state.sess)
        .then(function (r) {
          cell.classList.remove("proj-saving");
          if (r.ok) {
            cell.classList.add("proj-saved");
            setTimeout(function () { cell.classList.remove("proj-saved"); }, 1500);
          } else {
            rollback(r.status);
          }
        })
        .catch(function (e) {
          cell.classList.remove("proj-saving");
          rollback(e && e.message);
        });

      function rollback(why) {
        cell.classList.add("proj-error");
        cell.innerHTML = prevHtml;
        cell.setAttribute("data-val", oldVal);
        syncWrapperAttr(cell, column, oldVal);
        if (column === "percent_complete") repaintProgress(cell, oldVal);
        setTimeout(function () { cell.classList.remove("proj-error"); }, 2000);
        console.error("[projects_editor] save failed:", why);
      }
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); }
    });
    input.addEventListener("blur", commit);
  }

  // ─── Multi-line modal edit ──────────────────────────────────────────────
  var _activeEscListener = null;

  function closeModal() {
    var ov = document.querySelector(".proj-modal-overlay");
    if (ov) ov.remove();
    if (_activeEscListener) {
      document.removeEventListener("keydown", _activeEscListener);
      _activeEscListener = null;
    }
  }

  // Re-derive the visible preview body for a multi-line field after a save.
  function multilinePreview(text, limit) {
    limit = limit || 90;
    var t = (text || "").replace(/\s+/g, " ").trim();
    if (t.length > limit) t = t.slice(0, limit).replace(/\s+\S*$/, "") + "…";
    return t;
  }

  // Field-specific empty-state placeholder for a multi-line field's preview.
  function emptyPreviewFor(column) {
    if (column === "description") return "(no description — click to add)";
    if (column === "latest_update" || column === "wp_notes") return "(none — click to add)";
    return "(none — click to add)";
  }

  var MODAL_LABELS = {
    "description": "Description",
    "milestones": "Milestones",
    "latest_update": "Latest Update",
    "wp_notes": "Workplan Note",
    "cpl_goal": "CPL Goal"
  };

  function startModalEdit(cell, state) {
    closeModal();
    var pid = cell.getAttribute("data-pid");
    var column = cell.getAttribute("data-field");
    var oldVal = cell.getAttribute("data-val") || "";
    if (!pid || !column) return;
    var label = MODAL_LABELS[column] || column;

    var overlay = el("div", { "class": "proj-modal-overlay" }, []);
    var card = el("div", { "class": "proj-modal-card" }, []);
    overlay.appendChild(card);

    card.appendChild(el("h3", {}, ["Edit " + label]));
    card.appendChild(el("div", { "class": "proj-modal-sub" }, [
      "Project " + pid + " — saves to Supabase on Save."
    ]));

    var textarea = el("textarea", {}, []);
    textarea.value = oldVal;
    card.appendChild(textarea);

    var status = el("div", { "class": "proj-modal-status" }, []);
    card.appendChild(status);

    var actions = el("div", { "class": "proj-modal-actions" }, []);
    var btnCancel = el("button", { "class": "proj-btn-cancel", "type": "button" }, ["Cancel"]);
    var btnSubmit = el("button", { "class": "proj-btn-submit", "type": "button" }, ["Save"]);
    actions.appendChild(btnCancel);
    actions.appendChild(btnSubmit);
    card.appendChild(actions);

    btnCancel.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    _activeEscListener = function (e) { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", _activeEscListener);

    btnSubmit.addEventListener("click", function () {
      var raw = textarea.value;
      var trimmed = (raw || "").trim();
      if (trimmed === oldVal.trim()) { closeModal(); return; }
      var sendVal = trimmed === "" ? null : raw; // preserve in-text newlines

      btnSubmit.disabled = true;
      status.className = "proj-modal-status";
      status.textContent = "Saving…";

      saveField(pid, column, sendVal, state.sess)
        .then(function (r) {
          if (!r.ok) {
            return r.text().then(function (t) {
              throw new Error("HTTP " + r.status + (t ? ": " + t.slice(0, 160) : ""));
            });
          }
          // Repaint the card preview optimistically.
          var newPreview = trimmed ? multilinePreview(trimmed) : emptyPreviewFor(column);
          cell.innerHTML = newPreview;
          cell.setAttribute("data-val", trimmed);
          if (column === "cpl_goal") syncWrapperAttr(cell, column, trimmed);
          cell.classList.add("proj-saved");
          setTimeout(function () { cell.classList.remove("proj-saved"); }, 1500);
          closeModal();
        })
        .catch(function (e) {
          btnSubmit.disabled = false;
          status.className = "proj-modal-status err";
          status.textContent = "Save failed — " + (e.message || "unknown error");
          console.error("[projects_editor] modal save failed:", e);
        });
    });

    document.body.appendChild(overlay);
    textarea.focus();
  }

  // ─── Dispatch ───────────────────────────────────────────────────────────
  function startEdit(cell, state) {
    if (!state.sess) return;
    if (cell.getAttribute("data-multiline") === "1") startModalEdit(cell, state);
    else startInlineEdit(cell, state);
  }

  function attachClickHandler(state) {
    var grid = document.getElementById("projectsGrid");
    if (!grid) return;
    grid.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== grid) {
        if (target.getAttribute && target.getAttribute("data-editable") === "1") {
          startEdit(target, state);
          return;
        }
        target = target.parentNode;
      }
    });
  }

  // ─── Init ────────────────────────────────────────────────────────────────
  function init() {
    // Guard: only run when the Dashboard tab + projects grid are present.
    if (!document.getElementById("tab-dashboard")) return;
    if (!document.getElementById("projectsGrid")) return;
    var state = { sess: getSession() };
    mountAuthWidget(state);
    paintEditability(state);
    attachClickHandler(state);

    // Re-paint when the hash changes (sign-in may have completed on another
    // tab and routed back here via cpl_sb_return_tab).
    window.addEventListener("hashchange", function () {
      state.sess = getSession();
      mountAuthWidget(state);
      paintEditability(state);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
