/*
 * assoc_editor.js — shared Activity↔Project association editor popover.
 *
 * Owns the click-to-edit popover that lets a signed-in curator pick which
 * Activities a project contributes to (and which one is primary). Writes to
 * Supabase public.workplan_activity_associations:
 *   add    → POST  {project_id, activity_id [, is_primary]}
 *   remove → DELETE ?project_id=eq.X&activity_id=eq.Y
 *   primary→ PATCH  the chosen row is_primary=true + the project's OTHERS false
 *
 * Extracted from workplan_goals.js (PR #190) so TWO surfaces can share ONE
 * popover bound exactly ONCE:
 *   1. the Workplan Goals tab chips (27 projects with a KPI ladder), and
 *   2. all 34 Dashboard project cards — including 5.2-5.8, which have no
 *      workplan_goals row and were therefore unreachable by the #190 editor.
 *
 * Binding model: a SINGLE delegated `click` listener on `document` (installed
 * once, idempotently). Every anchor with `data-assoc-edit="1"` anywhere in the
 * page opens the same popover. workplan_goals.js no longer carries its own copy
 * — a naive second binding would open two popovers on the workplan chips.
 *
 * Auth: reads the shared magic-link session from sessionStorage `cpl_sb`
 * directly (the same session workplan_goals.js / projects_editor.js use), so
 * the module is self-contained — callers only nudge it via refresh() after a
 * sign-in / sign-out so the ✎ affordance re-paints.
 *
 * Public API (window.CPL_ASSOC_EDITOR):
 *   refresh()          — re-light .wpg-assoc-on affordance on every anchor
 *                        per the current session; closes the popover on sign-out.
 *   paintEditability() — alias of refresh() (re-light only).
 *   open(cell)         — open the popover for a specific anchor (used by the
 *                        delegated handler; exposed for completeness/testing).
 *   isSignedIn()       — boolean convenience.
 *   _hasListener       — true once the delegated listener is installed.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var ASSOC_TABLE = SUPABASE_URL + "/rest/v1/workplan_activity_associations";

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

  // ─── Auth (reads the shared cpl_sb session) ──────────────────────────────
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

  // ─── Supabase association CRUD ───────────────────────────────────────────
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

  function setPrimaryFlag(sess, pid, aid, value) {
    var qs = "project_id=eq." + encodeURIComponent(pid)
           + "&activity_id=eq." + encodeURIComponent(aid);
    return fetch(ASSOC_TABLE + "?" + qs, {
      method: "PATCH",
      headers: assocHeaders(sess, "return=minimal"),
      body: JSON.stringify({ is_primary: !!value })
    });
  }

  // ─── Reading the cell's data-* state ─────────────────────────────────────
  // [{activity_id, is_primary}] (the renderer already de-duped).
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
  function repaintAssocCell(cell, records) {
    // Drop existing chips (keep the leading "Contributes to:" span + the
    // trailing ✎ hint, which carry no curator data).
    Array.prototype.slice.call(cell.querySelectorAll(".wpg-act-chip"))
      .forEach(function (c) { c.remove(); });
    var hint = cell.querySelector(".wpg-assoc-edit-hint");
    var sorted = records.slice().sort(function (a, b) {
      return a.activity_id.localeCompare(b.activity_id, undefined, { numeric: true });
    });
    sorted.forEach(function (rec) {
      var aid = rec.activity_id;
      var chip = el("span", {
        "class": rec.is_primary ? "wpg-act-chip wpg-act-chip-primary" : "wpg-act-chip",
        "style": "display:inline-block;margin:0 0.25rem 0 0;padding:0.05rem 0.4rem;background:#EEF3F8;color:#163A5F;border-radius:10px;font-size:0.7rem;font-weight:600;"
      }, []);
      // The chip body is "Activity N" (no curator string) — but stay on
      // textContent for the hygiene contract regardless.
      chip.textContent = (rec.is_primary ? "★ " : "") + "Activity " + aid;
      if (hint) cell.insertBefore(chip, hint);
      else cell.appendChild(chip);
    });
    // Persist the new canonical state back onto the cell for the next open.
    cell.setAttribute("data-assoc", JSON.stringify(sorted));
    cell.setAttribute("data-assoc-backfilled", "0");
  }

  // ─── Popover lifecycle ───────────────────────────────────────────────────
  var _assocPop = null;
  var _assocPopCleanup = null;
  function closeAssocPop() {
    if (_assocPop && _assocPop.parentNode) _assocPop.parentNode.removeChild(_assocPop);
    _assocPop = null;
    if (_assocPopCleanup) { _assocPopCleanup(); _assocPopCleanup = null; }
  }

  function openAssocPop(cell) {
    var sess = getSession();
    if (!sess) return; // anonymous: chips are read-only
    closeAssocPop();

    var pid = cell.getAttribute("data-pid");
    if (!pid) return;
    var options = readActivityOptions(cell);
    var backfilled = cell.getAttribute("data-assoc-backfilled") === "1";
    // A backfilled chip is a derived guess (no real association row), so the
    // editor opens with NOTHING checked → the curator deliberately adds the
    // first real link.
    var current = backfilled ? [] : readAssoc(cell);
    var curChecked = {};
    var curPrimary = null;
    current.forEach(function (r) {
      curChecked[r.activity_id] = true;
      if (r.is_primary) curPrimary = r.activity_id;
    });

    // Per-open state (replaces the module-shared object the inline version used).
    var st = { sess: sess, hasPrimaryCol: false };

    var pop = el("div", { "class": "wpg-assoc-pop" }, []);
    pop.appendChild(el("h4", {}, ["Contributes to which Activities?"]));
    pop.appendChild(el("div", { "class": "wpg-assoc-pop-sub" }, [
      "Project " + pid + (backfilled ? " — no link set yet" : "")
    ]));

    var list = el("div", { "class": "wpg-assoc-list" }, []);
    var checkboxes = {};   // aid → input
    var primaryRadios = {}; // aid → input
    var statusEl = el("div", { "class": "wpg-assoc-pop-status" }, []);

    options.forEach(function (opt) {
      var aid = opt.id;
      var row = el("div", { "class": "wpg-assoc-row" }, []);

      var cbId = "assoc-cb-" + pid + "-" + aid;
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

      var prim = el("label", { "class": "wpg-assoc-prim wpg-assoc-prim-disabled" }, []);
      var radio = el("input", { "type": "radio", "name": "assoc-prim-" + pid, "value": aid }, []);
      radio.disabled = true; // toggled on once the column is confirmed
      if (curPrimary === aid) radio.checked = true;
      primaryRadios[aid] = radio;
      prim.appendChild(radio);
      prim.appendChild(document.createTextNode("primary"));
      prim.style.display = "none"; // revealed by the column probe below
      row.appendChild(prim);

      cb.addEventListener("change", function () { syncPrimaryEnabled(); });
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
        radio.disabled = !checked || !st.hasPrimaryCol;
        if (primLbl.classList) {
          primLbl.classList.toggle("wpg-assoc-prim-disabled", radio.disabled);
        }
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
      doAssocSave(cell, st, pid, options, checkboxes, primaryRadios, current, statusEl, btnSave);
    });

    document.body.appendChild(pop);
    _assocPop = pop;
    positionPop(pop, cell);

    // Probe the is_primary column once; reveal the primary radios if present.
    detectPrimaryColumn(sess).then(function (has) {
      st.hasPrimaryCol = has;
      if (has) {
        Object.keys(primaryRadios).forEach(function (aid) {
          primaryRadios[aid].parentNode.style.display = "";
        });
      }
      syncPrimaryEnabled();
    });
    syncPrimaryEnabled();

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
    var popW = pop.offsetWidth || 300;
    var maxLeft = window.scrollX + document.documentElement.clientWidth - popW - 8;
    if (left > maxLeft) left = Math.max(window.scrollX + 8, maxLeft);
    pop.style.top = top + "px";
    pop.style.left = left + "px";
  }

  // Compute the diff between the opened state (`current`) and the form, then
  // fire the minimal set of writes. Optimistic repaint with rollback.
  function doAssocSave(cell, st, pid, options, checkboxes, primaryRadios, current, statusEl, btnSave) {
    var sess = st.sess;
    if (!sess) return;

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

    var desiredPrimary = null;
    if (st.hasPrimaryCol) {
      Object.keys(primaryRadios).forEach(function (aid) {
        if (primaryRadios[aid].checked && desSet[aid]) desiredPrimary = aid;
      });
    }

    var toAdd = desired.filter(function (aid) { return !curSet[aid]; });
    var toRemove = Object.keys(curSet).filter(function (aid) { return !desSet[aid]; });

    var ops = [];
    toAdd.forEach(function (aid) {
      ops.push(addAssociation(sess, pid, aid, st.hasPrimaryCol, desiredPrimary === aid));
    });
    toRemove.forEach(function (aid) {
      ops.push(removeAssociation(sess, pid, aid));
    });
    if (st.hasPrimaryCol) {
      desired.forEach(function (aid) {
        var wasPrimary = (curPrimary === aid);
        var willBePrimary = (desiredPrimary === aid);
        var isNewlyAdded = toAdd.indexOf(aid) !== -1;
        if (isNewlyAdded) return; // POST already carried is_primary
        if (wasPrimary !== willBePrimary) {
          ops.push(setPrimaryFlag(sess, pid, aid, willBePrimary));
        }
      });
    }

    if (!ops.length) { closeAssocPop(); return; }

    var newRecords = desired.map(function (aid) {
      return { activity_id: aid, is_primary: st.hasPrimaryCol && desiredPrimary === aid };
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
      repaintAssocCell(cell, newRecords);
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
      console.error("[assoc_editor] association save failed:", e);
    });
  }

  // ─── Affordance painting (lights up .wpg-assoc-on per session) ──────────
  function paintEditability() {
    var signed = !!getSession();
    var cells = document.querySelectorAll('[data-assoc-edit="1"]');
    Array.prototype.forEach.call(cells, function (c) {
      if (signed) c.classList.add("wpg-assoc-on");
      else c.classList.remove("wpg-assoc-on");
    });
    if (!signed) closeAssocPop();
  }

  // ─── One delegated listener for the whole document ──────────────────────
  // Installed exactly once (idempotency guard) so re-including the script or
  // multiple init() calls can't stack handlers → no double-popover.
  function installListener() {
    if (window.CPL_ASSOC_EDITOR && window.CPL_ASSOC_EDITOR._hasListener) return;
    document.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== document.body && target.nodeType === 1) {
        if (target.getAttribute && target.getAttribute("data-assoc-edit") === "1") {
          if (!getSession()) return; // anonymous: read-only, no popover
          openAssocPop(target);
          e.stopPropagation();
          return;
        }
        target = target.parentNode;
      }
    });
    if (window.CPL_ASSOC_EDITOR) window.CPL_ASSOC_EDITOR._hasListener = true;
  }

  // ─── Public API + self-init ─────────────────────────────────────────────
  window.CPL_ASSOC_EDITOR = {
    open: openAssocPop,
    close: closeAssocPop,
    refresh: paintEditability,
    paintEditability: paintEditability,
    isSignedIn: function () { return !!getSession(); },
    _hasListener: false
  };

  function init() {
    installListener();
    paintEditability();
    // Re-light when the URL hash flips (sign-in may complete on another tab and
    // route back). Each editor also calls refresh() on its own auth changes.
    window.addEventListener("hashchange", paintEditability);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
