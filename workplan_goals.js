/*
 * workplan_goals.js — inline editor for the Workplan Goals tab.
 *
 * Phase 1 PR-5: hydrates the Python-rendered Workplan Goals + Annual Workplan
 * Goals tables with click-to-edit affordances. Year-cell GOAL/STRETCH values
 * write directly to Supabase public.workplan_goals via PATCH (no overlay layer
 * — workplan_goals IS the source of truth as of PR-4).
 *
 * Scope (narrow per Sam's PR-5 sizing decision):
 *   - Per-cell edit on existing rows only (the 27 A+-derived activities)
 *   - NO add-activity flow yet (deferred until the Activity↔Project N-to-N
 *     data model is designed — Sam flagged prior consolidation work)
 *   - NO Current-column editing (kpi_metric is still Excel-sourced; Phase 2)
 *
 * Auth: shared magic-link session via sessionStorage `cpl_sb`. After sign-in,
 * editable cells light up; click → input → blur or Enter to save. Saves
 * optimistically update every cell with matching (activity_id, row_type, year)
 * so the workplan_goals + annual_goals tables both reflect the new value
 * without a page reload.
 *
 * Known RLS gap: public.workplan_goals currently has "Allow auth write" with
 * qual=true — ANY authenticated user can write, not just allowed_reviewers.
 * Tightening this to mirror kb_curation's is_allowed_reviewer() policy is a
 * follow-up migration that needs Sam's explicit sign-off.
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
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(body)
    });
  }

  // ─── Auth widget (banner at top of tab) ──────────────────────────────────
  function buildAuthWidget(state, onChange) {
    var widget = el("div", {
      "class": "wpg-auth-widget",
      "style": "margin:1rem 0 0.5rem 0;padding:0.75rem 1rem;background:#F4F5F7;border-radius:8px;font-size:0.85rem;color:#0A2240;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;"
    }, []);

    if (state.sess) {
      widget.appendChild(el("span", { "style": "font-weight:600;" },
        ["Signed in as ", state.sess.email || "(no email)"]));
      var sub = el("span", { "style": "color:#666;" }, ["Click any year cell to edit • Enter saves • Esc cancels"]);
      widget.appendChild(sub);
      var btnOut = el("button", {
        "class": "wpg-btn",
        "style": "margin-left:auto;padding:0.35rem 0.75rem;border:1px solid #ccc;background:#fff;color:#333;border-radius:5px;font-size:0.8rem;cursor:pointer;"
      }, ["Sign out"]);
      btnOut.addEventListener("click", function () {
        signOut();
        onChange();
      });
      widget.appendChild(btnOut);
    } else {
      widget.appendChild(el("span", { "style": "color:#666;" },
        ["Sign in (CCCCO MAP only) to edit goal + stretch values."]));
      var emailInput = el("input", {
        "type": "email",
        "placeholder": "you@example.edu",
        "style": "padding:0.35rem 0.5rem;border:1px solid #ccc;border-radius:5px;font-size:0.8rem;min-width:180px;"
      }, []);
      var btnIn = el("button", {
        "class": "wpg-btn",
        "style": "padding:0.35rem 0.75rem;border:0;background:#0A2240;color:#fff;border-radius:5px;font-size:0.8rem;cursor:pointer;"
      }, ["Sign in"]);
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
    var tab = document.getElementById("tab-workplan-goals");
    if (!tab) return;
    var existing = tab.querySelector(".wpg-auth-widget");
    var widget = buildAuthWidget(state, function () {
      state.sess = getSession();
      mountAuthWidget(state);
      paintEditability(state);
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
    var cells = document.querySelectorAll('[data-editable="1"]');
    cells.forEach(function (c) {
      if (state.sess) c.classList.add("wpg-editable");
      else c.classList.remove("wpg-editable");
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
    // because Activity ids ("1"-"5") and project ids ("1.1", "1.2", …) are
    // disjoint.
    var kind = cell.getAttribute("data-kind") || "";
    if (!activity_id || !row_type || !year_key) return;

    var oldText = cell.textContent;
    var oldNum = Number(cell.getAttribute("data-val") || "0");

    var input = el("input", {
      "type": "text",
      "value": isPct && oldNum ? (Math.round(oldNum * 100) + "%") : (oldNum || ""),
      "class": "wpg-cell-input",
      "style": "width:100%;box-sizing:border-box;padding:2px 4px;font:inherit;border:1px solid #4D7EA8;border-radius:3px;text-align:right;background:#fff;"
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
        input.style.borderColor = "#A33";
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

  function attachClickHandler(state) {
    // Use event delegation on the body — works for both tab tables.
    document.body.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        if (target.getAttribute && target.getAttribute("data-editable") === "1") {
          startEdit(target, state);
          return;
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
      + '.wpg-editable:hover { background: #F0F4F8 !important; outline: 1px dashed #4D7EA8; }'
      + '.wpg-editing { background: #fff !important; padding: 0 !important; }'
      + '.wpg-saving { background: #FFF8E1 !important; }'
      + '.wpg-saved { background: #E8F5E9 !important; transition: background 0.4s; }'
      + '.wpg-error { background: #FFEBEE !important; transition: background 0.4s; }';
    var style = document.createElement("style");
    style.id = "wpg-editor-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── Init ────────────────────────────────────────────────────────────────
  function init() {
    if (!document.getElementById("tab-workplan-goals")) return;
    injectStyles();
    var state = { sess: getSession() };
    mountAuthWidget(state);
    paintEditability(state);
    attachClickHandler(state);

    // Re-paint when the tab becomes visible (in case sign-in happened on
    // another tab and the URL fragment now reflects us).
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
