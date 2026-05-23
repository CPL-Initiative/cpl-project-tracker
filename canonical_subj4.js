/*
 * canonical_subj4.js — UI for the "Canonical SUBJ4" curator tab.
 *
 * Phase 1e workspace: confirm a 4-letter canonical SUBJ4 per M-ID discipline
 * so the next re-mint can fold same-discipline SUBJ4 variants (e.g. 10
 * SUBJ4 codes for "Sign Language, American" → one canonical). Edits write to
 * Supabase kb_curation with a synthesized course_id namespace
 * `_CANON_SUBJ4::<discipline>` and fields `canonical_subj4` / `canonical_subj4_notes`.
 * The existing _apply_curation.py whitelists "discipline / merge_into /
 * unified_title / description" so it ignores these rows — kb/_apply_canonical_subj4.py
 * pulls them into kb/discipline_canonical_subj4.json instead.
 *
 * Auth piggybacks on the unified_courses.js Supabase session (sessionStorage
 * key `cpl_sb`). Signing in here works the same way; the magic-link redirect
 * lands at #unified-courses (the existing default) — close that and switch
 * back to this tab manually.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var KEY_PREFIX = "_CANON_SUBJ4::";
  var FIELD_CANON = "canonical_subj4";
  var FIELD_NOTES = "canonical_subj4_notes";
  var SUBJ4_RE = /^[A-Z]{4}$/;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "title") n.title = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  // ─── Supabase auth — shares the cpl_sb session with unified_courses.js ────
  function isValidJwt(t) {
    return typeof t === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
  }
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token) && (s.refresh_token || s.exp > Date.now())) return s;
    } catch (e) {}
    return null;
  }
  function signIn(email) {
    var redirect = encodeURIComponent(location.origin + location.pathname);
    return fetch(SUPABASE_URL + "/auth/v1/otp?redirect_to=" + redirect, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, create_user: true })
    });
  }
  function signOut() { sessionStorage.removeItem("cpl_sb"); }

  // Fetch overlay — only rows in our namespace.
  function fetchOverlay() {
    var url = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?select=course_id,field,value,reviewer_email,reviewed_at"
      + "&course_id=like." + encodeURIComponent(KEY_PREFIX) + "%25";
    return fetch(url, { headers: { "apikey": SUPABASE_ANON } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        // Group by discipline (key without prefix), one record per field.
        var m = {};
        arr.forEach(function (row) {
          var d = (row.course_id || "").slice(KEY_PREFIX.length);
          if (!d) return;
          var rec = m[d] = m[d] || {};
          rec[row.field] = row.value;
          // Keep latest reviewer/timestamp across fields.
          if (!rec.reviewed_at || (row.reviewed_at || "") >= rec.reviewed_at) {
            rec.reviewed_by = row.reviewer_email;
            rec.reviewed_at = row.reviewed_at;
          }
        });
        return m;
      })
      .catch(function () { return {}; });
  }
  function saveField(discipline, field, value, sess) {
    var body = {
      course_id: KEY_PREFIX + discipline,
      field: field,
      value: value,
      reviewer_email: sess.email
    };
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON, "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(body)
    });
  }

  // ─── data ──────────────────────────────────────────────────────────────────
  // Fetch the seed file at runtime. Lives under kb/ in the repo and is served
  // by GH Pages as a sibling URL. Falls back to an empty state on 404 so a
  // missing-on-PR-preview deploy doesn't crash the tab.
  function fetchSeed() {
    return fetch("kb/discipline_canonical_subj4.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { disciplines: {}, _counts: {} }; })
      .catch(function () { return { disciplines: {}, _counts: {} }; });
  }

  // Merge an overlay record onto a seed entry. Overlay wins; reviewed_by / _at
  // are surfaced from the overlay so a fresh save bumps them on screen.
  function applyOverlay(entry, ov) {
    if (!ov) return entry;
    var merged = Object.assign({}, entry);
    if (ov[FIELD_CANON]) {
      merged.canonical_subj4 = ov[FIELD_CANON];
      merged.source = "curator_override";
    }
    if (ov[FIELD_NOTES] != null) merged._notes = ov[FIELD_NOTES];
    if (ov.reviewed_at) {
      merged.reviewed_at = ov.reviewed_at;
      merged.reviewed_by = ov.reviewed_by;
      merged.needs_review = false;
    }
    return merged;
  }

  function status(entry) {
    var c = entry.canonical_subj4;
    if (entry.reviewed_at) {
      if (!c || !SUBJ4_RE.test(c)) return { label: "invalid", cls: "warn" };
      return { label: "reviewed", cls: "ok" };
    }
    if (c && SUBJ4_RE.test(c)) return { label: "pre-seeded", cls: "muted" };
    return { label: "needs review", cls: "mix" };
  }

  // Re-key impact = total_mids * (variants_observed.length - 1). Disciplines
  // with the highest spread x size go first so the curator works the most
  // impactful entries before the long tail.
  function rekeyImpact(entry) {
    var nVars = entry.variants_observed ? Object.keys(entry.variants_observed).length : 1;
    return (entry.total_mids || 0) * Math.max(0, nVars - 1);
  }

  function variantsHtml(entry) {
    if (!entry.variants_observed) return "";
    var modal = entry.data_modal;
    var pairs = Object.keys(entry.variants_observed).map(function (k) {
      return [k, entry.variants_observed[k]];
    }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
    // Render top 8 inline; collapse the rest into "+N more".
    var visible = pairs.slice(0, 8);
    var hidden = pairs.length - visible.length;
    var parts = visible.map(function (p) {
      var cls = (p[0] === modal) ? "cs-var-modal" : "cs-var-other";
      return '<span class="' + cls + '">' + p[0] + "·" + p[1] + "</span>";
    });
    if (hidden > 0) parts.push('<span class="cs-var-other">+' + hidden + " more</span>");
    return parts.join(" ");
  }

  // ─── render ────────────────────────────────────────────────────────────────
  var state = {
    seed: null,
    overlay: {},
    filter: "all",
    search: "",
    sess: null,
  };

  function toast(msg, isErr) {
    var t = document.getElementById("cs-toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "cs-toast show" + (isErr ? " err" : "");
    setTimeout(function () { t.className = "cs-toast" + (isErr ? " err" : ""); }, 2600);
  }

  function renderToolbar() {
    var tb = document.getElementById("cs-toolbar");
    if (!tb) return;
    tb.innerHTML = "";
    // Filter dropdown
    var sel = el("select", { class: "cs-filter", id: "cs-filter" });
    [
      ["all", "All disciplines"],
      ["needs_review", "Needs curator review"],
      ["pre_seeded", "Pre-seeded (data-modal already 4-letter)"],
      ["reviewed", "Reviewed"],
      ["invalid", "Invalid (saved value not 4 letters)"],
    ].forEach(function (opt) {
      var o = el("option", { value: opt[0] }, [opt[1]]);
      if (opt[0] === state.filter) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = function () { state.filter = this.value; render(); };
    tb.appendChild(sel);
    // Search
    var search = el("input", { class: "cs-filter", id: "cs-search", type: "search", placeholder: "Search discipline…" });
    search.value = state.search;
    search.oninput = function () { state.search = this.value.toLowerCase(); render(); };
    tb.appendChild(search);
    // Auth widget
    var auth = el("span", { id: "cs-auth", class: "cs-auth" });
    if (state.sess) {
      auth.appendChild(el("span", { class: "cs-auth-on" }, ["✓ " + state.sess.email]));
      auth.appendChild(document.createTextNode("  "));
      var out = el("a", { class: "cs-auth-link", href: "#" }, ["sign out"]);
      out.onclick = function (e) { e.preventDefault(); signOut(); state.sess = null; render(); };
      auth.appendChild(out);
    } else {
      var inn = el("a", { class: "cs-auth-link", href: "#" }, ["sign in to edit"]);
      inn.onclick = function (e) {
        e.preventDefault();
        var email = prompt("Email (must be an allowed reviewer):");
        if (!email) return;
        signIn(email)
          .then(function (r) {
            if (r.ok) toast("Magic link sent — check your email");
            else toast("Sign-in failed (" + r.status + ")", true);
          })
          .catch(function () { toast("Sign-in request failed", true); });
      };
      auth.appendChild(inn);
      auth.appendChild(el("span", { class: "cs-auth-tag" }, ["(CCCCO MAP only)"]));
    }
    tb.appendChild(auth);
  }

  function passesFilter(entry) {
    var s = status(entry);
    if (state.filter === "needs_review" && s.label !== "needs review") return false;
    if (state.filter === "pre_seeded" && s.label !== "pre-seeded") return false;
    if (state.filter === "reviewed" && s.label !== "reviewed") return false;
    if (state.filter === "invalid" && s.label !== "invalid") return false;
    return true;
  }

  function renderSummary(rows) {
    var sum = document.getElementById("cs-summary");
    if (!sum) return;
    var counts = { reviewed: 0, "needs review": 0, "pre-seeded": 0, invalid: 0 };
    rows.forEach(function (e) {
      var s = status(e);
      counts[s.label] = (counts[s.label] || 0) + 1;
    });
    sum.innerHTML = "<strong>" + rows.length + "</strong> disciplines · "
      + counts.reviewed + " reviewed · "
      + counts["pre-seeded"] + " pre-seeded · "
      + counts["needs review"] + " need review"
      + (counts.invalid ? " · <span style='color:#991b1b'>" + counts.invalid + " invalid</span>" : "");
  }

  function render() {
    if (!state.seed) return;
    renderToolbar();

    var allRows = Object.keys(state.seed.disciplines).map(function (d) {
      var entry = applyOverlay(state.seed.disciplines[d], state.overlay[d]);
      entry.discipline = d;
      entry._impact = rekeyImpact(entry);
      return entry;
    });

    var filtered = allRows.filter(function (e) {
      if (state.search && e.discipline.toLowerCase().indexOf(state.search) < 0) return false;
      return passesFilter(e);
    });
    filtered.sort(function (a, b) { return b._impact - a._impact || a.discipline.localeCompare(b.discipline); });

    renderSummary(allRows);

    var wrap = document.getElementById("cs-table-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    var table = el("table", { class: "cs-table" });
    var thead = el("thead", null, [el("tr", null, [
      el("th", null, ["Discipline"]),
      el("th", { title: "Number of cross-college course identities in this discipline." }, ["M-IDs"]),
      el("th", { title: "Different 4-letter subject codes colleges currently use for this discipline, with how many M-IDs use each." }, ["Variants observed (code·n)"]),
      el("th", { title: "The most-used code across colleges today. If shorter than 4 letters, pick a 4-letter expansion in the Canonical column." }, ["Most-used today"]),
      el("th", { title: "Required: exactly 4 uppercase letters (A–Z)." }, ["Canonical *"]),
      el("th", null, ["Status"]),
      el("th", null, ["Notes"]),
      el("th", null, ["Reviewed"]),
    ])]);
    table.appendChild(thead);
    var tbody = el("tbody");
    filtered.forEach(function (e) { tbody.appendChild(rowFor(e)); });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function rowFor(entry) {
    var tr = el("tr");
    tr.appendChild(el("td", { class: "cs-disc" }, [entry.discipline]));
    tr.appendChild(el("td", { class: "cs-mono" }, [String(entry.total_mids || 0)]));
    var tdVars = el("td", { class: "cs-variants", html: variantsHtml(entry) });
    tr.appendChild(tdVars);
    // Data-modal cell — show the most-common code colleges use today, with
    // an obvious flag when it isn't 4 letters (so a curator knows they need
    // to pick an expansion rather than just confirm).
    var tdModal = el("td", { class: "cs-mono" });
    tdModal.appendChild(document.createTextNode(entry.data_modal || "—"));
    if (entry.data_modal && !entry.data_modal_is_4letter) {
      var warn = el("span", {
        class: "cs-badge warn",
        title: "Data modal is shorter than 4 letters — pick a 4-letter expansion.",
      }, ["⚠ needs 4-letter"]);
      warn.style.marginLeft = "6px";
      tdModal.appendChild(warn);
    }
    tr.appendChild(tdModal);

    // Canonical SUBJ4 input
    var input = el("input", {
      class: "cs-canon", type: "text", maxlength: "4",
      value: entry.canonical_subj4 || "", placeholder: "ABCD"
    });
    if (!state.sess) input.disabled = true;
    var initial = input.value;
    function reflectValidity() {
      var v = (input.value || "").toUpperCase();
      input.value = v;
      input.classList.remove("cs-saved", "cs-invalid");
      if (v && !SUBJ4_RE.test(v)) input.classList.add("cs-invalid");
    }
    input.oninput = reflectValidity;
    input.onblur = function () {
      var v = (input.value || "").toUpperCase();
      if (v === initial.toUpperCase()) return;
      if (v && !SUBJ4_RE.test(v)) { toast("Canonical SUBJ4 must be exactly 4 letters", true); return; }
      saveField(entry.discipline, FIELD_CANON, v, state.sess)
        .then(function (r) {
          if (!r.ok) { toast("Save failed (" + r.status + ")", true); return; }
          input.classList.add("cs-saved");
          // Reflect in state.overlay so the row updates without a refetch.
          var rec = state.overlay[entry.discipline] = state.overlay[entry.discipline] || {};
          rec[FIELD_CANON] = v;
          rec.reviewed_by = state.sess.email;
          rec.reviewed_at = new Date().toISOString();
          toast("Saved " + entry.discipline + " → " + v);
          render();
        })
        .catch(function () { toast("Save failed (network)", true); });
    };
    input.onkeydown = function (e) { if (e.key === "Enter") input.blur(); };
    tr.appendChild(el("td", null, [input]));

    var st = status(entry);
    tr.appendChild(el("td", null, [el("span", { class: "cs-badge " + st.cls }, [st.label])]));

    // Notes textarea
    var ta = el("textarea", { class: "cs-notes", placeholder: "optional curator note" });
    ta.value = entry._notes || "";
    if (!state.sess) ta.disabled = true;
    var initialNote = ta.value;
    ta.onblur = function () {
      if (ta.value === initialNote) return;
      saveField(entry.discipline, FIELD_NOTES, ta.value, state.sess)
        .then(function (r) {
          if (!r.ok) { toast("Notes save failed (" + r.status + ")", true); return; }
          var rec = state.overlay[entry.discipline] = state.overlay[entry.discipline] || {};
          rec[FIELD_NOTES] = ta.value;
          rec.reviewed_by = state.sess.email;
          rec.reviewed_at = new Date().toISOString();
          toast("Note saved · " + entry.discipline);
          // Don't re-render the whole table — just bump initialNote tracker.
          initialNote = ta.value;
        })
        .catch(function () { toast("Note save failed (network)", true); });
    };
    tr.appendChild(el("td", null, [ta]));

    var rev = el("td", { class: "cs-reviewed" });
    if (entry.reviewed_at && entry.reviewed_by) {
      rev.textContent = (entry.reviewed_by || "").split("@")[0] + " · " + entry.reviewed_at.slice(0, 10);
    } else {
      rev.textContent = "—";
    }
    tr.appendChild(rev);
    return tr;
  }

  // Guidelines modal — wire the open/close on the curator-facing button.
  // Light-weight focus-trap-less modal; click-outside or × closes it.
  function wireGuidelinesModal() {
    var btn = document.getElementById("cs-guidelines-btn");
    var bg = document.getElementById("cs-guidelines-modal");
    if (!btn || !bg) return;
    var close = bg.querySelector(".cs-modal-close");
    function open() { bg.classList.add("show"); document.addEventListener("keydown", esc); }
    function shut() { bg.classList.remove("show"); document.removeEventListener("keydown", esc); }
    function esc(e) { if (e.key === "Escape") shut(); }
    btn.addEventListener("click", open);
    close && close.addEventListener("click", shut);
    bg.addEventListener("click", function (e) { if (e.target === bg) shut(); });
  }

  function init() {
    if (!document.getElementById("tab-canonical-subj4")) return;
    state.sess = getSession();
    wireGuidelinesModal();
    Promise.all([fetchSeed(), fetchOverlay()]).then(function (parts) {
      state.seed = parts[0];
      state.overlay = parts[1];
      render();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
