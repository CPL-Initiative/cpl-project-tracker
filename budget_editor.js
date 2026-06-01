/*
 * budget_editor.js — inline editor for the Budget tab's 5-Year Funding Plan.
 *
 * Excel→Supabase Phase 3 (Budget editor): hydrates the Python-rendered funding
 * table (render_budget_html in excel_to_dashboard.py) with click-to-edit dollar
 * cells. Each cell PATCHes the matching column on Supabase public.budget_funding
 * (the budget read-path source of truth as of PR #189 — no overlay layer).
 * Mirrors the proven projects_editor.js / workplan_goals.js editor pattern.
 *
 * Scope (narrow, deliberate):
 *   - EDIT-ONLY on the 6 existing funding rows. NO add/delete.
 *   - 7 editable dollar cells per row: the 5 annual budgets + the 2025-26
 *     expense + the total. Each PATCHes its own column independently — there is
 *     NO total=Σyears / avg formula yet (a later PR adds that, then makes total
 *     read-only). Funding-source name/code, personnel (the live table is
 *     deduped 26→13 so row identity is ambiguous), and the held expenditures
 *     are all out of scope for this round.
 *
 * Auth: shared magic-link session via sessionStorage `cpl_sb` (the same session
 * unified_courses.js / projects_editor.js use). After sign-in, editable cells
 * light up; click → number input → Enter/blur saves, Esc cancels. Saves
 * optimistically paint the cell (re-formatted via fmtDollars) and roll back on
 * error.
 *
 * RLS: public.budget_funding writes are gated to is_allowed_reviewer(). A
 * signed-in but non-allowed user's PATCH returns 0 rows / an error and the
 * optimistic paint rolls back.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";

  // ─── DOM helper ──────────────────────────────────────────────────────────
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "style") n.setAttribute("style", attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  // ─── fmtDollars — mirrors excel_to_dashboard.py fmt_dollars() exactly ──────
  function fmtDollars(val) {
    var num = typeof val === "number"
      ? val : parseFloat(String(val).replace(/[$,\s]/g, ""));
    if (!Number.isFinite(num) || num === 0) return "$0";
    var a = Math.abs(num);
    if (a >= 1e6) {
      return "$" + (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (a >= 1e3) {
      return "$" + Math.round(num / 1e3) + "K";
    }
    return "$" + Math.round(num).toLocaleString("en-US");
  }

  // ─── Auth (shared cpl_sb session) ────────────────────────────────────────
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
    try { sessionStorage.setItem("cpl_sb_return_tab", "budget"); } catch (e) {}
    var redirect = encodeURIComponent(location.origin + location.pathname);
    return fetch(SUPABASE_URL + "/auth/v1/otp?redirect_to=" + redirect, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, create_user: true })
    });
  }
  function signOut() { sessionStorage.removeItem("cpl_sb"); }

  // ─── Save: PATCH one column on a budget_funding row (single-PK, no kind) ───
  function saveField(bid, column, value, sess) {
    var body = {};
    body[column] = value;
    return fetch(SUPABASE_URL + "/rest/v1/budget_funding?id=eq." + encodeURIComponent(bid), {
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

  // ─── Auth widget (banner above the funding plan) ─────────────────────────
  function buildAuthWidget(state, onChange) {
    var widget = el("div", { "class": "budget-auth-widget" }, []);
    if (state.sess) {
      widget.appendChild(el("span", { "style": "font-weight:600;" },
        ["Signed in as ", state.sess.email || "(no email)"]));
      widget.appendChild(el("span", { "style": "color:#666;" },
        ["Click any dollar figure to edit • Enter saves • Esc cancels"]));
      var btnOut = el("button", { "class": "budget-btn budget-btn-out" }, ["Sign out"]);
      btnOut.addEventListener("click", function () { signOut(); onChange(); });
      widget.appendChild(btnOut);
    } else {
      widget.appendChild(el("span", { "style": "color:#666;" },
        ["Sign in (CCCCO MAP only) to edit funding figures."]));
      var emailInput = el("input", { "type": "email", "placeholder": "you@example.edu" }, []);
      var btnIn = el("button", { "class": "budget-btn" }, ["Sign in"]);
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
            status.innerHTML = "✉ Magic link sent to <strong></strong>. "
              + "Click the link in your inbox to finish signing in.";
            status.querySelector("strong").textContent = email; // no HTML injection
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
    var anchor = document.getElementById("budget-funding");
    if (!anchor || !anchor.parentNode) return;
    var parent = anchor.parentNode;
    var widget = buildAuthWidget(state, function () {
      state.sess = getSession();
      mountAuthWidget(state);
      paintEditability(state);
    });
    var existing = parent.querySelector(".budget-auth-widget");
    if (existing) existing.replaceWith(widget);
    else parent.insertBefore(widget, anchor);
  }

  // ─── Editability painting ────────────────────────────────────────────────
  function editableCells() {
    var root = document.getElementById("budget-funding");
    return root ? root.querySelectorAll('.budget-cell[data-editable="1"]') : [];
  }
  function paintEditability(state) {
    Array.prototype.forEach.call(editableCells(), function (c) {
      if (state.sess) c.classList.add("budget-on");
      else c.classList.remove("budget-on");
    });
  }

  // ─── Inline numeric edit ─────────────────────────────────────────────────
  function startInlineEdit(cell, state) {
    if (cell.classList.contains("budget-editing")) return;
    var bid = cell.getAttribute("data-bid");
    var column = cell.getAttribute("data-field");
    var oldVal = cell.getAttribute("data-val") || "";
    if (!bid || !column) return;

    var input = el("input", {
      "type": "number", "step": "any", "min": "0",
      "value": oldVal, "class": "budget-cell-input"
    }, []);

    var prevHtml = cell.innerHTML;
    cell.classList.add("budget-editing");
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    if (input.select) input.select();

    var done = false;
    function cancel() {
      if (done) return;
      done = true;
      cell.classList.remove("budget-editing");
      cell.innerHTML = prevHtml;
    }

    function commit() {
      if (done) return;
      var raw = (input.value || "").trim();
      if (raw === "") { input.style.borderColor = "#A33"; return; }   // require a number (0 is allowed, blank is not)
      var n = parseFloat(raw.replace(/[$,]/g, ""));
      if (!Number.isFinite(n) || n < 0) { input.style.borderColor = "#A33"; return; }
      var normalized = String(n);
      if (normalized === oldVal) { cancel(); return; }

      done = true;
      cell.classList.remove("budget-editing");
      cell.classList.add("budget-saving");
      cell.textContent = fmtDollars(n);          // textContent — never treat input as markup
      cell.setAttribute("data-val", normalized);

      saveField(bid, column, n, state.sess)
        .then(function (r) {
          cell.classList.remove("budget-saving");
          if (r.ok) {
            cell.classList.add("budget-saved");
            setTimeout(function () { cell.classList.remove("budget-saved"); }, 1500);
          } else {
            rollback("HTTP " + r.status);
          }
        })
        .catch(function (e) { cell.classList.remove("budget-saving"); rollback(e && e.message); });

      function rollback(why) {
        cell.classList.add("budget-error");
        cell.innerHTML = prevHtml;
        cell.setAttribute("data-val", oldVal);
        setTimeout(function () { cell.classList.remove("budget-error"); }, 2000);
        console.error("[budget_editor] save failed:", why);
      }
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); }
    });
    input.addEventListener("blur", commit);
  }

  // ─── Dispatch ────────────────────────────────────────────────────────────
  function attachClickHandler(state) {
    var root = document.getElementById("budget-funding");
    if (!root) return;
    root.addEventListener("click", function (e) {
      if (!state.sess) return;
      var target = e.target;
      while (target && target !== root) {
        if (target.classList && target.classList.contains("budget-cell")
            && target.getAttribute("data-editable") === "1") {
          startInlineEdit(target, state);
          return;
        }
        target = target.parentNode;
      }
    });
  }

  // ─── Init ────────────────────────────────────────────────────────────────
  function init() {
    // Run only on the Budget tab, and only once the regenerated funding table
    // carries editable cells (pre-regen the attrs aren't there yet → stay silent
    // rather than show a sign-in box with nothing to edit).
    if (!document.getElementById("tab-budget")) return;
    if (!document.getElementById("budget-funding")) return;
    if (editableCells().length === 0) return;

    var state = { sess: getSession() };
    mountAuthWidget(state);
    paintEditability(state);
    attachClickHandler(state);

    // Re-paint when sign-in completes on another tab and routes back here.
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
