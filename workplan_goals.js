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

  // ═══ Activity↔Project association editor ════════════════════════════════
  // Lets a curator edit which Activities an EXISTING project contributes to
  // (the add-flow already covers NEW projects). Writes to
  // public.workplan_activity_associations:
  //   add    → POST  {project_id, activity_id [, is_primary]}
  //   remove → DELETE ?project_id=eq.X&activity_id=eq.Y
  //   primary→ PATCH  the chosen row is_primary=true + the project's OTHERS false
  // The is_primary column is added by
  // kb/supabase_activity_associations_add_primary.sql (unapplied until a human
  // runs it). The editor probes for the column once; until it exists, the
  // primary radios are hidden and is_primary is omitted from write bodies so
  // nothing 400s.
  var ASSOC_TABLE = SUPABASE_URL + "/rest/v1/workplan_activity_associations";

  function assocHeaders(sess, prefer) {
    var h = {
      "apikey": SUPABASE_ANON,
      "Authorization": "Bearer " + sess.access_token,
      "Content-Type": "application/json"
    };
    if (prefer) h.Prefer = prefer;
    return h;
  }

  // One-time detection of the is_primary column. Resolves true/false; cached.
  var _primaryColPromise = null;
  function detectPrimaryColumn(sess) {
    if (_primaryColPromise) return _primaryColPromise;
    _primaryColPromise = fetch(
      ASSOC_TABLE + "?select=is_primary&limit=1",
      { headers: assocHeaders(sess) }
    ).then(function (r) {
      // 200 → column exists; 400 (undefined column) → not yet migrated.
      return r.ok;
    }).catch(function () {
      return false;
    });
    return _primaryColPromise;
  }

  function addAssociation(sess, pid, aid, includePrimary, isPrimary) {
    var body = { project_id: pid, activity_id: aid };
    if (includePrimary) body.is_primary = !!isPrimary;
    return fetch(ASSOC_TABLE, {
      method: "POST",
      headers: assocHeaders(sess, "return=minimal"),
      body: JSON.stringify([body])
    });
  }

  function removeAssociation(sess, pid, aid) {
    var qs = "project_id=eq." + encodeURIComponent(pid)
           + "&activity_id=eq." + encodeURIComponent(aid);
    return fetch(ASSOC_TABLE + "?" + qs, {
      method: "DELETE",
      headers: assocHeaders(sess, "return=minimal")
    });
  }

  // PATCH is_primary for a specific (project, activity) row.
  function setPrimaryFlag(sess, pid, aid, value) {
    var qs = "project_id=eq." + encodeURIComponent(pid)
           + "&activity_id=eq." + encodeURIComponent(aid);
    return fetch(ASSOC_TABLE + "?" + qs, {
      method: "PATCH",
      headers: assocHeaders(sess, "return=minimal"),
      body: JSON.stringify({ is_primary: !!value })
    });
  }

  // ─── Association editor — DOM + state helpers ───────────────────────────
  // Read the current association records off a chip cell's data-assoc.
  // Returns [{activity_id, is_primary}] (deduped, the renderer already did so).
  function readAssoc(cell) {
    try {
      var raw = cell.getAttribute("data-assoc") || "[]";
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (r) { return r && r.activity_id; })
        .map(function (r) {
          return { activity_id: String(r.activity_id), is_primary: !!r.is_primary };
        });
    } catch (e) { return []; }
  }
  function readActivityOptions(cell) {
    try {
      var raw = cell.getAttribute("data-activities") || "[]";
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (a) { return a && a.id != null; })
        .map(function (a) {
          return { id: String(a.id), name: String(a.name == null ? "" : a.name) };
        });
    } catch (e) { return []; }
  }

  // Repaint a chip cell's chips + data-assoc after a successful save. `records`
  // is the NEW canonical [{activity_id, is_primary}] state. Uses textContent /
  // DOM construction only — never innerHTML with Supabase strings.
  function repaintAssocCell(cell, records, options) {
    var labelOf = {};
    options.forEach(function (o) { labelOf[o.id] = o.name; });
    // Drop existing chips (keep the leading "Contributes to:" span + the
    // trailing ✎ hint, which carry no curator data).
    Array.prototype.slice.call(cell.querySelectorAll(".wpg-act-chip"))
      .forEach(function (c) { c.remove(); });
    var hint = cell.querySelector(".wpg-assoc-edit-hint");
    // Sort by natural activity id for a stable display.
    var sorted = records.slice().sort(function (a, b) {
      return a.activity_id.localeCompare(b.activity_id, undefined, { numeric: true });
    });
    sorted.forEach(function (rec) {
      var aid = rec.activity_id;
      var full = labelOf[aid] || ("Activity " + aid);
      var chip = el("span", {
        "class": rec.is_primary ? "wpg-act-chip wpg-act-chip-primary" : "wpg-act-chip",
        "style": "display:inline-block;margin:0 0.25rem 0 0;padding:0.05rem 0.4rem;background:#EEF3F8;color:#163A5F;border-radius:10px;font-size:0.7rem;font-weight:600;"
      }, []);
      chip.setAttribute("title", rec.is_primary ? (full + " (primary)") : full);
      // textContent keeps the curator-editable activity NAME inert (the chip
      // body shows the short label, but we keep the hygiene contract anyway).
      chip.textContent = (rec.is_primary ? "★ " : "") + "Activity " + aid;
      if (hint) cell.insertBefore(chip, hint);
      else cell.appendChild(chip);
    });
    // Persist the new canonical state back onto the cell for the next open.
    cell.setAttribute("data-assoc", JSON.stringify(sorted));
    cell.setAttribute("data-assoc-backfilled", "0");
  }

  // Tracks the open popover + its outside-click / Esc listeners so they can be
  // torn down cleanly (mirrors the add-modal's _activeEscListener pattern).
  var _assocPop = null;
  var _assocPopCleanup = null;
  function closeAssocPop() {
    if (_assocPop && _assocPop.parentNode) _assocPop.parentNode.removeChild(_assocPop);
    _assocPop = null;
    if (_assocPopCleanup) { _assocPopCleanup(); _assocPopCleanup = null; }
  }

  function openAssocPop(cell, state) {
    if (!state.sess) return;
    closeAssocPop();

    var pid = cell.getAttribute("data-pid");
    if (!pid) return;
    var options = readActivityOptions(cell);
    var backfilled = cell.getAttribute("data-assoc-backfilled") === "1";
    // The "current" set the editor opens with. A backfilled chip is a derived
    // guess (no real association row), so the editor opens with NOTHING checked
    // → the curator deliberately adds the first real link.
    var current = backfilled ? [] : readAssoc(cell);
    var curChecked = {};
    var curPrimary = null;
    current.forEach(function (r) {
      curChecked[r.activity_id] = true;
      if (r.is_primary) curPrimary = r.activity_id;
    });

    var pop = el("div", { "class": "wpg-assoc-pop" }, []);
    pop.appendChild(el("h4", {}, ["Contributes to which Activities?"]));
    pop.appendChild(el("div", { "class": "wpg-assoc-pop-sub" }, [
      "Project " + pid + (backfilled ? " — no link set yet" : "")
    ]));

    var list = el("div", { "class": "wpg-assoc-list" }, []);
    var checkboxes = {};   // aid → input
    var primaryRadios = {}; // aid → input
    var statusEl = el("div", { "class": "wpg-assoc-pop-status" }, []);

    // Build one row per activity option.
    options.forEach(function (opt) {
      var aid = opt.id;
      var row = el("div", { "class": "wpg-assoc-row" }, []);

      var cbId = "wpg-assoc-cb-" + pid + "-" + aid;
      var cb = el("input", { "type": "checkbox", "id": cbId }, []);
      if (curChecked[aid]) cb.checked = true;
      checkboxes[aid] = cb;

      var lbl = el("label", { "for": cbId }, []);
      lbl.appendChild(cb);
      var nameSpan = el("span", { "class": "wpg-assoc-name" }, []);
      // Activity NAME is curator-editable → textContent, never innerHTML.
      nameSpan.textContent = opt.name || ("Activity " + aid);
      lbl.appendChild(nameSpan);
      row.appendChild(lbl);

      // Primary radio (one group across the popover). Hidden until we know the
      // column exists; enabled only when the checkbox is checked.
      var prim = el("label", { "class": "wpg-assoc-prim wpg-assoc-prim-disabled" }, []);
      var radio = el("input", { "type": "radio", "name": "wpg-assoc-prim-" + pid, "value": aid }, []);
      radio.disabled = true; // toggled on once the column is confirmed
      if (curPrimary === aid) radio.checked = true;
      primaryRadios[aid] = radio;
      prim.appendChild(radio);
      prim.appendChild(document.createTextNode("primary"));
      prim.style.display = "none"; // revealed by the column probe below
      row.appendChild(prim);

      // Keep the primary radio's enabled-state in lock-step with the checkbox.
      cb.addEventListener("change", function () {
        syncPrimaryEnabled();
      });

      list.appendChild(row);
    });
    if (!options.length) {
      list.appendChild(el("div", { "style": "color:#888;font-size:0.78rem;padding:0.3rem;" },
        ["(no Activities available)"]));
    }
    pop.appendChild(list);

    function syncPrimaryEnabled() {
      Object.keys(checkboxes).forEach(function (aid) {
        var checked = checkboxes[aid].checked;
        var radio = primaryRadios[aid];
        var primLbl = radio.parentNode;
        radio.disabled = !checked || !state.hasPrimaryCol;
        if (primLbl.classList) {
          primLbl.classList.toggle("wpg-assoc-prim-disabled", radio.disabled);
        }
        // If an activity got unchecked while it was the primary, clear it.
        if (!checked && radio.checked) radio.checked = false;
      });
    }

    pop.appendChild(statusEl);
    pop.appendChild(el("div", { "class": "wpg-assoc-note" }, [
      "Exactly one Activity can be primary. Saving applies adds, removes, and the primary change together."
    ]));

    var actions = el("div", { "class": "wpg-assoc-pop-actions" }, []);
    var btnCancel = el("button", { "class": "wpg-assoc-cancel", "type": "button" }, ["Cancel"]);
    var btnSave = el("button", { "class": "wpg-assoc-save", "type": "button" }, ["Save"]);
    actions.appendChild(btnCancel);
    actions.appendChild(btnSave);
    pop.appendChild(actions);

    btnCancel.addEventListener("click", closeAssocPop);
    btnSave.addEventListener("click", function () {
      doAssocSave(cell, state, pid, options, checkboxes, primaryRadios, current, statusEl, btnSave);
    });

    // Position + mount. Append to body, then place near the cell.
    document.body.appendChild(pop);
    _assocPop = pop;
    positionPop(pop, cell);

    // Probe the is_primary column once; reveal the primary radios if present.
    detectPrimaryColumn(state.sess).then(function (has) {
      state.hasPrimaryCol = has;
      if (has) {
        Object.keys(primaryRadios).forEach(function (aid) {
          primaryRadios[aid].parentNode.style.display = "";
        });
      }
      syncPrimaryEnabled();
    });
    syncPrimaryEnabled();

    // Outside-click + Esc teardown.
    function onDocClick(e) {
      if (_assocPop && !_assocPop.contains(e.target) && e.target !== cell && !cell.contains(e.target)) {
        closeAssocPop();
      }
    }
    function onKey(e) { if (e.key === "Escape") closeAssocPop(); }
    // Defer the click listener so the opening click doesn't immediately close.
    setTimeout(function () { document.addEventListener("click", onDocClick, true); }, 0);
    document.addEventListener("keydown", onKey);
    _assocPopCleanup = function () {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }

  function positionPop(pop, cell) {
    var r = cell.getBoundingClientRect();
    var top = window.scrollY + r.bottom + 4;
    var left = window.scrollX + r.left;
    // Keep within the viewport horizontally.
    var popW = pop.offsetWidth || 300;
    var maxLeft = window.scrollX + document.documentElement.clientWidth - popW - 8;
    if (left > maxLeft) left = Math.max(window.scrollX + 8, maxLeft);
    pop.style.top = top + "px";
    pop.style.left = left + "px";
  }

  // Compute the diff between the opened state (`current`) and the form, then
  // fire the minimal set of writes. Optimistic repaint with rollback.
  function doAssocSave(cell, state, pid, options, checkboxes, primaryRadios, current, statusEl, btnSave) {
    var sess = state.sess;
    if (!sess) return;

    // Desired set from the form.
    var desired = [];
    Object.keys(checkboxes).forEach(function (aid) {
      if (checkboxes[aid].checked) desired.push(aid);
    });
    if (!desired.length) {
      statusEl.className = "wpg-assoc-pop-status err";
      statusEl.textContent = "Pick at least one Activity (or Cancel to leave unchanged).";
      return;
    }

    var curSet = {};
    var curPrimary = null;
    current.forEach(function (r) {
      curSet[r.activity_id] = true;
      if (r.is_primary) curPrimary = r.activity_id;
    });
    var desSet = {};
    desired.forEach(function (aid) { desSet[aid] = true; });

    // Desired primary (only meaningful if the column exists).
    var desiredPrimary = null;
    if (state.hasPrimaryCol) {
      Object.keys(primaryRadios).forEach(function (aid) {
        if (primaryRadios[aid].checked && desSet[aid]) desiredPrimary = aid;
      });
    }

    var toAdd = desired.filter(function (aid) { return !curSet[aid]; });
    var toRemove = Object.keys(curSet).filter(function (aid) { return !desSet[aid]; });

    // Build the write plan.
    //  - adds: POST (carry is_primary only if this aid is the desired primary)
    //  - removes: DELETE
    //  - primary change on a KEPT row: PATCH true; PATCH false on the others
    var ops = [];
    toAdd.forEach(function (aid) {
      ops.push(addAssociation(sess, pid, aid, state.hasPrimaryCol, desiredPrimary === aid));
    });
    toRemove.forEach(function (aid) {
      ops.push(removeAssociation(sess, pid, aid));
    });
    if (state.hasPrimaryCol) {
      desired.forEach(function (aid) {
        var wasPrimary = (curPrimary === aid);
        var willBePrimary = (desiredPrimary === aid);
        var isNewlyAdded = toAdd.indexOf(aid) !== -1;
        // Newly-added rows already carried their is_primary in the POST.
        if (isNewlyAdded) return;
        if (wasPrimary !== willBePrimary) {
          ops.push(setPrimaryFlag(sess, pid, aid, willBePrimary));
        }
      });
    }

    if (!ops.length) {
      // No change.
      closeAssocPop();
      return;
    }

    // Optimistic state for the repaint.
    var newRecords = desired.map(function (aid) {
      return { activity_id: aid, is_primary: state.hasPrimaryCol && desiredPrimary === aid };
    });

    btnSave.disabled = true;
    statusEl.className = "wpg-assoc-pop-status";
    statusEl.textContent = "Saving…";
    cell.classList.remove("wpg-assoc-saved", "wpg-assoc-error");
    cell.classList.add("wpg-assoc-saving");

    Promise.all(ops.map(function (p) {
      return p.then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            throw new Error("HTTP " + r.status + (t ? ": " + t.slice(0, 160) : ""));
          });
        }
      });
    })).then(function () {
      cell.classList.remove("wpg-assoc-saving");
      cell.classList.add("wpg-assoc-saved");
      setTimeout(function () { cell.classList.remove("wpg-assoc-saved"); }, 1500);
      repaintAssocCell(cell, newRecords, options);
      closeAssocPop();
    }).catch(function (e) {
      // A partial failure can leave the DB out of sync with the optimistic
      // plan; we did NOT pre-paint the chips, so the cell still shows the old
      // state. Surface the error + reload guidance so the curator re-checks.
      cell.classList.remove("wpg-assoc-saving");
      cell.classList.add("wpg-assoc-error");
      setTimeout(function () { cell.classList.remove("wpg-assoc-error"); }, 2500);
      btnSave.disabled = false;
      statusEl.className = "wpg-assoc-pop-status err";
      statusEl.textContent = "Save failed — " + (e.message || "unknown") + ". Reload to re-check.";
      console.error("[workplan_goals] association save failed:", e);
    });
  }

  // Light up the chip cells (cursor + ✎) when signed in.
  function paintAssocEditability(state) {
    var cells = document.querySelectorAll('[data-assoc-edit="1"]');
    cells.forEach(function (c) {
      if (state.sess) c.classList.add("wpg-assoc-on");
      else c.classList.remove("wpg-assoc-on");
    });
  }

  // Click delegation for the chip cells. Kept separate from the year-cell
  // handler so a chip-cell click never starts a year edit.
  function attachAssocClickHandler(state) {
    document.body.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        if (target.getAttribute && target.getAttribute("data-assoc-edit") === "1") {
          if (!state.sess) return; // anonymous: chips are read-only
          openAssocPop(target, state);
          e.stopPropagation();
          return;
        }
        target = target.parentNode;
      }
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
      var btnAdd = el("button", {
        "class": "wpg-btn wpg-btn-add",
        "style": "margin-left:auto;padding:0.35rem 0.75rem;border:1px solid #163A5F;background:#0A2240;color:#fff;border-radius:5px;font-size:0.8rem;cursor:pointer;font-weight:600;"
      }, ["+ Add new row"]);
      btnAdd.addEventListener("click", function () { openAddModal(state); });
      widget.appendChild(btnAdd);
      var btnOut = el("button", {
        "class": "wpg-btn",
        "style": "padding:0.35rem 0.75rem;border:1px solid #ccc;background:#fff;color:#333;border-radius:5px;font-size:0.8rem;cursor:pointer;"
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
      paintAssocEditability(state);
      if (!state.sess) closeAssocPop();
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
      + '.wpg-error { background: #FFEBEE !important; transition: background 0.4s; }'
      // PR-C add-flow modal
      + '.wpg-modal-overlay { position:fixed;inset:0;background:rgba(10,34,64,0.55);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:3rem 1rem; }'
      + '.wpg-modal-card { background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.25);max-width:640px;width:100%;padding:1.5rem;font-family:inherit;color:#0A2240; }'
      + '.wpg-modal-card h3 { margin:0 0 0.25rem 0;color:#0A2240;font-size:1.1rem; }'
      + '.wpg-modal-card .wpg-sub { color:#666;font-size:0.8rem;margin-bottom:1rem; }'
      + '.wpg-modal-card label { display:block;font-size:0.78rem;color:#666;margin:0.6rem 0 0.2rem 0;font-weight:600; }'
      + '.wpg-modal-card input[type="text"], .wpg-modal-card input[type="number"] { width:100%;padding:0.4rem 0.55rem;border:1px solid #ccc;border-radius:5px;font-size:0.85rem;box-sizing:border-box; }'
      + '.wpg-modal-card .wpg-radio-row { display:flex;gap:1.5rem;margin:0.3rem 0 0.5rem 0; }'
      + '.wpg-modal-card .wpg-radio-row label { display:flex;align-items:center;gap:0.4rem;font-weight:500;color:#0A2240;margin:0;font-size:0.9rem;cursor:pointer; }'
      + '.wpg-modal-card .wpg-grid-years { display:grid;grid-template-columns:repeat(5,1fr);gap:0.4rem; }'
      + '.wpg-modal-card .wpg-assoc-checkboxes { display:flex;flex-wrap:wrap;gap:0.6rem;padding:0.5rem 0.6rem;background:#F4F5F7;border-radius:5px; }'
      + '.wpg-modal-card .wpg-assoc-checkboxes label { display:flex;align-items:center;gap:0.3rem;font-size:0.78rem;font-weight:500;margin:0;color:#0A2240;cursor:pointer; }'
      + '.wpg-modal-card .wpg-status { margin-top:0.75rem;font-size:0.82rem;min-height:1.2em; }'
      + '.wpg-modal-card .wpg-status.ok { color:#2A7D4F; }'
      + '.wpg-modal-card .wpg-status.err { color:#A33; }'
      + '.wpg-modal-card .wpg-modal-actions { display:flex;justify-content:flex-end;gap:0.5rem;margin-top:1rem; }'
      + '.wpg-modal-card .wpg-modal-actions button { padding:0.4rem 0.9rem;border-radius:5px;font-size:0.85rem;cursor:pointer;border:0; }'
      + '.wpg-modal-card .wpg-btn-cancel { background:#fff;border:1px solid #ccc !important;color:#333; }'
      + '.wpg-modal-card .wpg-btn-submit { background:#0A2240;color:#fff;font-weight:600; }'
      + '.wpg-modal-card .wpg-btn-submit:disabled { opacity:0.6;cursor:not-allowed; }'
      + '.wpg-act-chip { display:inline-block;padding:0.05rem 0.4rem;background:#EEF3F8;color:#163A5F;border-radius:10px;font-size:0.7rem;font-weight:600; }';
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
    var actIds = {};
    var projIds = {};
    document.querySelectorAll('[data-aid][data-kind="activity"]').forEach(function (c) {
      actIds[c.getAttribute("data-aid")] = 1;
    });
    document.querySelectorAll('[data-aid][data-kind="project"]').forEach(function (c) {
      projIds[c.getAttribute("data-aid")] = 1;
    });
    return {
      activities: Object.keys(actIds).sort(),
      projects: Object.keys(projIds).sort()
    };
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

  function openAddModal(state) {
    closeAddModal();
    var ids = collectExistingIds();

    var overlay = el("div", { "class": "wpg-modal-overlay" }, []);
    var card = el("div", { "class": "wpg-modal-card" }, []);
    overlay.appendChild(card);

    card.appendChild(el("h3", {}, ["Add new row to Workplan Goals"]));
    card.appendChild(el("div", { "class": "wpg-sub" }, [
      "Inserts a new GOAL + STRETCH pair into Supabase. Year cells default to 0; you can fill them here or click-edit afterwards."
    ]));

    // ── Kind radio ────────────────────────────────────────────────
    card.appendChild(el("label", {}, ["Row type"]));
    var radioRow = el("div", { "class": "wpg-radio-row" }, []);
    var kindActLabel = el("label", {}, []);
    var kindAct = el("input", { "type": "radio", "name": "wpg-kind", "value": "activity" }, []);
    kindActLabel.appendChild(kindAct);
    kindActLabel.appendChild(document.createTextNode(" Activity (top-level)"));
    var kindProjLabel = el("label", {}, []);
    var kindProj = el("input", { "type": "radio", "name": "wpg-kind", "value": "project", "checked": "checked" }, []);
    kindProjLabel.appendChild(kindProj);
    kindProjLabel.appendChild(document.createTextNode(" Project (sub-activity)"));
    radioRow.appendChild(kindActLabel);
    radioRow.appendChild(kindProjLabel);
    card.appendChild(radioRow);

    // ── ID + Name ─────────────────────────────────────────────────
    card.appendChild(el("label", {}, ["ID"]));
    var idHint = el("div", { "class": "wpg-sub", "style": "margin:-0.15rem 0 0.3rem 0;font-size:0.72rem;" }, [
      "Project IDs: N.x where N is an existing Activity (e.g. 3.7, 4.1.5). Activity IDs: single digit."
    ]);
    var idInput = el("input", { "type": "text", "placeholder": "e.g. 3.7", "autocomplete": "off" }, []);
    card.appendChild(idInput);
    card.appendChild(idHint);

    card.appendChild(el("label", {}, ["Name"]));
    var nameInput = el("input", { "type": "text", "placeholder": "Descriptive name", "autocomplete": "off" }, []);
    card.appendChild(nameInput);

    // ── Project-only: associations multi-select ──────────────────
    var assocSection = el("div", {}, []);
    assocSection.appendChild(el("label", {}, ["Contributes to (one or more)"]));
    var assocBox = el("div", { "class": "wpg-assoc-checkboxes" }, []);
    var assocBoxes = {};
    ids.activities.forEach(function (aid) {
      var lbl = el("label", {}, []);
      var cb = el("input", { "type": "checkbox", "value": aid }, []);
      assocBoxes[aid] = cb;
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(" Activity " + aid));
      assocBox.appendChild(lbl);
    });
    if (!ids.activities.length) {
      assocBox.appendChild(el("span", { "style": "color:#888;font-size:0.78rem;" },
        ["(no Activities exist yet — add an Activity first, then return here)"]));
    }
    assocSection.appendChild(assocBox);
    card.appendChild(assocSection);

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
        box.appendChild(el("div", { "style": "font-size:0.7rem;color:#888;margin-bottom:0.15rem;" }, [y.lbl]));
        var input = el("input", { "type": "number", "step": "any", "value": "0", "placeholder": "0" }, []);
        store[y.key] = input;
        box.appendChild(input);
        grid.appendChild(box);
      });
      card.appendChild(grid);
    }
    buildLadder("GOAL ladder", goalInputs);
    buildLadder("STRETCH ladder", stretchInputs);

    // ── Status + Actions ─────────────────────────────────────────
    var status = el("div", { "class": "wpg-status" }, []);
    card.appendChild(status);

    var actions = el("div", { "class": "wpg-modal-actions" }, []);
    var btnCancel = el("button", { "class": "wpg-btn-cancel", "type": "button" }, ["Cancel"]);
    var btnSubmit = el("button", { "class": "wpg-btn-submit", "type": "button" }, ["Add row"]);
    actions.appendChild(btnCancel);
    actions.appendChild(btnSubmit);
    card.appendChild(actions);

    function syncKindUI() {
      // Read from the bound refs directly instead of querySelector — safer
      // if keyboard navigation briefly puts neither radio in the :checked
      // state during a transition.
      var k = kindAct.checked ? "activity" : "project";
      assocSection.style.display = (k === "project") ? "" : "none";
      idInput.placeholder = (k === "activity") ? "e.g. 6" : "e.g. 3.7";
    }
    kindAct.addEventListener("change", syncKindUI);
    kindProj.addEventListener("change", syncKindUI);
    syncKindUI();

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
        kindAct: kindAct,
        kindProj: kindProj,
        idInput: idInput,
        nameInput: nameInput,
        assocBoxes: assocBoxes,
        goalInputs: goalInputs,
        stretchInputs: stretchInputs,
        status: status,
        btnSubmit: btnSubmit
      });
    });

    document.body.appendChild(overlay);
    idInput.focus();
  }

  /**
   * Validate the modal form. Returns { ok, errors[], payload } where
   * `payload` is null if invalid; otherwise carries the POST shapes.
   */
  function validateAdd(ctx) {
    var errors = [];
    var kind = ctx.kindAct.checked ? "activity" : "project";
    var rawId = (ctx.idInput.value || "").trim();
    var name = (ctx.nameInput.value || "").trim();

    if (!rawId) errors.push("ID is required.");
    if (!name) errors.push("Name is required.");

    // ID format
    if (rawId) {
      if (kind === "activity") {
        if (!/^[0-9]+$/.test(rawId)) {
          errors.push("Activity ID must be a single number (e.g. 6).");
        }
        if (ctx.ids.activities.indexOf(rawId) !== -1) {
          errors.push("Activity ID '" + rawId + "' already exists.");
        }
      } else {
        // Project: must start with N. where N is an existing Activity id
        var prefixMatch = rawId.match(/^([0-9]+)\.[A-Za-z0-9.]+$/);
        if (!prefixMatch) {
          errors.push("Project ID must be N.x where N is an existing Activity (e.g. 3.7).");
        } else if (ctx.ids.activities.indexOf(prefixMatch[1]) === -1) {
          errors.push("Project prefix '" + prefixMatch[1] + "' is not an existing Activity ID.");
        }
        if (ctx.ids.projects.indexOf(rawId) !== -1) {
          errors.push("Project ID '" + rawId + "' already exists.");
        }
      }
    }

    // Gather selected associations (Project only)
    var assocIds = [];
    if (kind === "project") {
      Object.keys(ctx.assocBoxes).forEach(function (aid) {
        if (ctx.assocBoxes[aid].checked) assocIds.push(aid);
      });
      if (!assocIds.length) {
        errors.push("Select at least one Activity that this Project contributes to.");
      }
    }

    if (errors.length) return { ok: false, errors: errors, payload: null };

    // Compose payload
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

    return {
      ok: true,
      errors: [],
      payload: {
        kind: kind,
        wpgRows: [
          buildRow("GOAL", goal, goalTotal),
          buildRow("STRETCH", stretch, stretchTotal)
        ],
        assocRows: assocIds.map(function (aid) {
          return { project_id: rawId, activity_id: aid };
        })
      }
    };
  }

  function submitAdd(ctx) {
    var v = validateAdd(ctx);
    ctx.status.className = "wpg-status";
    if (!v.ok) {
      ctx.status.className = "wpg-status err";
      ctx.status.innerHTML = v.errors.map(function (e) {
        return "• " + e;
      }).join("<br>");
      return;
    }

    ctx.btnSubmit.disabled = true;
    ctx.status.className = "wpg-status";
    ctx.status.textContent = "Inserting…";

    var sess = ctx.state.sess;
    var headers = {
      "apikey": SUPABASE_ANON,
      "Authorization": "Bearer " + sess.access_token,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };

    fetch(SUPABASE_URL + "/rest/v1/workplan_goals", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(v.payload.wpgRows)
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error("workplan_goals insert failed (HTTP " + r.status + "): " + t.slice(0, 200));
        });
      }
      // Project: also insert associations
      if (v.payload.kind === "project" && v.payload.assocRows.length) {
        return fetch(SUPABASE_URL + "/rest/v1/workplan_activity_associations", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(v.payload.assocRows)
        }).then(function (r2) {
          if (!r2.ok) {
            return r2.text().then(function (t) {
              throw new Error("associations insert failed (HTTP " + r2.status + "): " + t.slice(0, 200));
            });
          }
        });
      }
    }).then(function () {
      ctx.status.className = "wpg-status ok";
      ctx.status.textContent = "✓ Inserted. Reloading the page…";
      setTimeout(function () { window.location.reload(); }, 800);
    }).catch(function (e) {
      ctx.btnSubmit.disabled = false;
      ctx.status.className = "wpg-status err";
      ctx.status.textContent = e.message || "Insert failed.";
      console.error("[workplan_goals] add failed:", e);
    });
  }

  // ─── Init ────────────────────────────────────────────────────────────────
  function init() {
    if (!document.getElementById("tab-workplan-goals")) return;
    injectStyles();
    // hasPrimaryCol is resolved lazily by detectPrimaryColumn() the first time
    // the association popover opens; default false → primary radios hidden +
    // is_primary omitted from writes until the migration lands.
    var state = { sess: getSession(), hasPrimaryCol: false };
    mountAuthWidget(state);
    paintEditability(state);
    paintAssocEditability(state);
    attachClickHandler(state);
    attachAssocClickHandler(state);

    // Re-paint when the tab becomes visible (in case sign-in happened on
    // another tab and the URL fragment now reflects us).
    window.addEventListener("hashchange", function () {
      state.sess = getSession();
      mountAuthWidget(state);
      paintEditability(state);
      paintAssocEditability(state);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
