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

  // Load C-ID and CCN reference data. Used to:
  //   (a) Show C-ID / CCN match badges per row (count + visual indicator of
  //       whether the canonical SUBJ4 matches the official identifier's
  //       subject).
  //   (b) List C-IDs / CCNs that share a SUBJ4 inside the variants modal so
  //       the curator can see if a canonical choice will line up with an
  //       existing official identifier.
  // Builds an index { SUBJ -> [{identifier, title}, ...] }. C-ID descriptors
  // with hyphenated subjects (AG-PS) are kept under their full subject
  // string — they won't match a 4-letter SUBJ but show up if needed.
  function fetchCidCcn() {
    return Promise.all([
      fetch("kb/reference/cid_descriptors.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : { descriptors: [] }; })
        .catch(function () { return { descriptors: [] }; }),
      fetch("kb/reference/ccn_courses.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : { courses: [] }; })
        .catch(function () { return { courses: [] }; }),
    ]).then(function (parts) {
      var cidBySubj = {};
      var ccnBySubj = {};
      (parts[0].descriptors || []).forEach(function (d) {
        var desc = (d.descriptor || "").trim();
        var m = desc.match(/^([A-Z]+(?:-[A-Z]+)?)\s+(\d+[A-Z]*)$/);
        if (!m) return;
        var subj = m[1];
        (cidBySubj[subj] = cidBySubj[subj] || []).push({ id: desc, title: d.title || "" });
      });
      (parts[1].courses || []).forEach(function (c) {
        var subj = c.subject || "";
        if (!subj) return;
        (ccnBySubj[subj] = ccnBySubj[subj] || []).push({ id: c.ccn || (subj + " " + c.number), title: c.title || "" });
      });
      return { cidBySubj: cidBySubj, ccnBySubj: ccnBySubj };
    });
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

  // Build the inline variants summary — show top 5 + a "show all (n)" chip
  // that opens the variants modal. Modal listing always includes any C-IDs
  // and CCNs that share a SUBJ4 with the variants observed, so a curator
  // sees the full official-id landscape next to the local-code landscape.
  function variantsCell(entry) {
    var td = el("td", { class: "cs-variants" });
    if (!entry.variants_observed) return td;
    var modal = entry.data_modal;
    var pairs = Object.keys(entry.variants_observed).map(function (k) {
      return [k, entry.variants_observed[k]];
    }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
    var visible = pairs.slice(0, 5);
    var hidden = pairs.length - visible.length;
    var parts = visible.map(function (p) {
      var cls = (p[0] === modal) ? "cs-var-modal" : "cs-var-other";
      return '<span class="' + cls + '">' + p[0] + "·" + p[1] + "</span>";
    });
    td.innerHTML = parts.join(" ");
    // Show-all chip — appended as a clickable button so it can dispatch to
    // the modal opener.
    var btn = el("button", {
      class: "cs-var-show", type: "button",
      title: "Show all variants for this discipline (including any matching C-IDs/CCNs)",
    }, [hidden > 0 ? "Show all (" + pairs.length + ") →" : "Show details →"]);
    btn.onclick = function () { openVariantsModal(entry); };
    td.appendChild(document.createTextNode(" "));
    td.appendChild(btn);
    return td;
  }

  function openVariantsModal(entry) {
    var bg = document.getElementById("cs-variants-modal");
    var body = document.getElementById("cs-variants-body");
    var title = document.getElementById("cs-variants-title");
    if (!bg || !body) return;
    title.textContent = "Variants for " + entry.discipline;

    var modal = entry.data_modal;
    var canon = entry.canonical_subj4;
    var variants = Object.keys(entry.variants_observed || {})
      .map(function (k) { return [k, entry.variants_observed[k]]; })
      .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });

    body.innerHTML = "";
    body.appendChild(el("p", { class: "cs-modal-meta" }, [
      String(entry.total_mids || 0) + " M-IDs across " + variants.length + " distinct codes. " +
      "Bold yellow = the most-used code today; green = curator-confirmed canonical."
    ]));

    // Section 1: local college variants
    body.appendChild(el("h5", null, ["Local college subject codes (in this dataset)"]));
    var grid = el("div", { class: "cs-var-grid" });
    variants.forEach(function (p) {
      var isModal = p[0] === modal;
      var isCanon = p[0] === canon;
      var cls = "cs-var-chip" + (isCanon ? " canonical" : isModal ? " modal" : "");
      var chip = el("div", { class: cls });
      chip.appendChild(el("span", { class: "cs-var-code" }, [p[0]]));
      chip.appendChild(document.createTextNode(" · " + p[1] + " M-IDs"));
      if (isCanon) chip.appendChild(el("span", { class: "cs-var-flag" }, ["canonical"]));
      else if (isModal) chip.appendChild(el("span", { class: "cs-var-flag" }, ["most-used"]));
      grid.appendChild(chip);
    });
    body.appendChild(grid);

    // Section 2: C-IDs that share a SUBJ4 with this discipline (canonical or
    // any local variant). Helps the curator see what official identifiers
    // line up with their choice.
    var allSubjs = new Set(variants.map(function (p) { return p[0]; }));
    if (canon) allSubjs.add(canon);
    var cidHits = [];
    var ccnHits = [];
    allSubjs.forEach(function (s) {
      (state.cidBySubj[s] || []).forEach(function (h) { cidHits.push(Object.assign({ subject: s }, h)); });
      (state.ccnBySubj[s] || []).forEach(function (h) { ccnHits.push(Object.assign({ subject: s }, h)); });
    });

    if (cidHits.length) {
      body.appendChild(el("h5", null, ["C-IDs that share one of these subjects (" + cidHits.length + ")"]));
      var cidGrid = el("div", { class: "cs-var-grid" });
      cidHits.sort(function (a, b) { return a.id.localeCompare(b.id); }).forEach(function (h) {
        var chip = el("div", { class: "cs-var-chip", title: h.title });
        chip.appendChild(el("span", { class: "cs-var-code" }, [h.id]));
        if (h.title) chip.appendChild(el("span", { class: "cs-var-flag" }, [h.title.length > 28 ? h.title.slice(0, 28) + "…" : h.title]));
        cidGrid.appendChild(chip);
      });
      body.appendChild(cidGrid);
    }
    if (ccnHits.length) {
      body.appendChild(el("h5", null, ["CCNs that share one of these subjects (" + ccnHits.length + ")"]));
      var ccnGrid = el("div", { class: "cs-var-grid" });
      ccnHits.sort(function (a, b) { return a.id.localeCompare(b.id); }).forEach(function (h) {
        var chip = el("div", { class: "cs-var-chip", title: h.title });
        chip.appendChild(el("span", { class: "cs-var-code" }, [h.id]));
        if (h.title) chip.appendChild(el("span", { class: "cs-var-flag" }, [h.title.length > 28 ? h.title.slice(0, 28) + "…" : h.title]));
        ccnGrid.appendChild(chip);
      });
      body.appendChild(ccnGrid);
    }
    if (!cidHits.length && !ccnHits.length) {
      body.appendChild(el("h5", null, ["Official identifiers"]));
      body.appendChild(el("p", { class: "cs-modal-meta" }, [
        "No C-IDs or CCNs share any of the subject codes above. (Either this discipline has no official identifiers yet, or it uses different subject codes than the official systems.)"
      ]));
    }

    bg.classList.add("show");
    document.addEventListener("keydown", _variantsModalEsc);
  }
  function _variantsModalEsc(e) {
    if (e.key === "Escape") {
      var bg = document.getElementById("cs-variants-modal");
      if (bg) bg.classList.remove("show");
      document.removeEventListener("keydown", _variantsModalEsc);
    }
  }

  // ─── render ────────────────────────────────────────────────────────────────
  var state = {
    seed: null,
    overlay: {},
    cidBySubj: {},
    ccnBySubj: {},
    filter: "all",
    search: "",
    // Sort: default is re-key impact (descending). Curator clicks a sortable
    // header to override. Click again to flip direction. Clicking another
    // header switches the active column.
    sort: { key: "_impact", dir: "desc" },
    sess: null,
  };

  // Sortable column descriptors: key = sort key on the row object, getter =
  // value extractor. Status uses an ordering enum so "reviewed" sorts above
  // "pre-seeded" above "needs review" above "invalid" by default.
  var STATUS_ORDER = { "reviewed": 0, "pre-seeded": 1, "needs review": 2, "invalid": 3 };
  var SORT_GETTERS = {
    discipline: function (e) { return (e.discipline || "").toLowerCase(); },
    total_mids: function (e) { return e.total_mids || 0; },
    variants_count: function (e) { return e.variants_observed ? Object.keys(e.variants_observed).length : 0; },
    data_modal: function (e) { return (e.data_modal || "").toLowerCase(); },
    canonical_subj4: function (e) { return (e.canonical_subj4 || "~").toLowerCase(); }, // ~ sorts blanks last
    status: function (e) { return STATUS_ORDER[status(e).label] || 99; },
    reviewed_by: function (e) { return (e.reviewed_by || "~").toLowerCase(); },
    _impact: function (e) { return e._impact || 0; },
  };
  function sortRows(rows) {
    var key = state.sort.key, dir = state.sort.dir;
    var get = SORT_GETTERS[key] || SORT_GETTERS._impact;
    var sign = dir === "asc" ? 1 : -1;
    return rows.slice().sort(function (a, b) {
      var va = get(a), vb = get(b);
      if (va < vb) return -sign;
      if (va > vb) return sign;
      // tiebreaker: discipline alpha asc (stable, readable)
      return (a.discipline || "").localeCompare(b.discipline || "");
    });
  }

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
    // Search — typeahead via native <datalist>. Browser shows a dropdown of
    // matching disciplines as the curator types; picking one (or typing a
    // full match) filters the table to just rows containing the term.
    // Width widened to ~280px so longer discipline names are readable.
    var datalistId = "cs-discipline-list";
    if (!document.getElementById(datalistId) && state.seed) {
      var dl = document.createElement("datalist");
      dl.id = datalistId;
      Object.keys(state.seed.disciplines || {}).sort().forEach(function (d) {
        dl.appendChild(el("option", { value: d }));
      });
      tb.appendChild(dl);
    }
    var search = el("input", {
      class: "cs-filter cs-search-wide", id: "cs-search", type: "search",
      placeholder: "Search discipline (start typing for suggestions)…",
      list: datalistId,
      autocomplete: "off",
    });
    search.value = state.search;
    // Re-render on input so the table filters incrementally; the datalist
    // dropdown is handled by the browser, so there's no race with our state.
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
    filtered = sortRows(filtered);

    renderSummary(allRows);

    var wrap = document.getElementById("cs-table-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    var table = el("table", { class: "cs-table" });
    // Sortable column headers — click to set/flip sort. Indicator shows
    // current state (▲ asc / ▼ desc / ↕ inactive).
    var COLS = [
      { key: "discipline",       label: "Discipline" },
      { key: "total_mids",       label: "M-IDs",     title: "Number of cross-college course identities in this discipline." },
      { key: "variants_count",   label: "Variants",  title: "Different 4-letter subject codes colleges currently use for this discipline. Click the chip to see all + any matching C-IDs/CCNs." },
      { key: "data_modal",       label: "Most-used today", title: "The most-used code across colleges today. If shorter than 4 letters, pick a 4-letter expansion in the Canonical column." },
      { key: "canonical_subj4",  label: "Canonical *", title: "Required: exactly 4 uppercase letters (A–Z)." },
      { key: "status",           label: "Status" },
      { key: null,               label: "Notes" },
      { key: "reviewed_by",      label: "Reviewed" },
    ];
    var headerRow = el("tr");
    COLS.forEach(function (col) {
      var attrs = col.title ? { title: col.title } : null;
      var children = [col.label];
      if (col.key) {
        var active = state.sort.key === col.key;
        var indicator = !active ? "↕" : (state.sort.dir === "asc" ? "▲" : "▼");
        children.push(el("span", {
          class: "cs-sort-indicator" + (active ? " active" : ""),
        }, [indicator]));
      }
      var th = el("th", attrs, children);
      if (col.key) {
        th.classList.add("sortable");
        (function (k) {
          th.onclick = function () {
            if (state.sort.key === k) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
            else { state.sort.key = k; state.sort.dir = k === "discipline" ? "asc" : "desc"; }
            render();
          };
        })(col.key);
      }
      headerRow.appendChild(th);
    });
    var thead = el("thead", null, [headerRow]);
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
    tr.appendChild(variantsCell(entry));
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
    var tdCanon = el("td", null, [input]);
    // C-ID / CCN match badges — count official identifiers whose subject
    // equals the canonical SUBJ4 (or, if no canonical set yet, falls back
    // to the data modal so the curator still sees what's out there).
    // Click goes nowhere — full list lives in the variants modal.
    var matchSubj = entry.canonical_subj4 || entry.data_modal;
    if (matchSubj) {
      var nCid = (state.cidBySubj[matchSubj] || []).length;
      var nCcn = (state.ccnBySubj[matchSubj] || []).length;
      if (nCid > 0) {
        tdCanon.appendChild(el("span", {
          class: "cs-id-badge cid",
          title: nCid + " C-ID descriptor" + (nCid === 1 ? "" : "s") + " use subject " + matchSubj,
        }, ["C-ID·" + nCid]));
      }
      if (nCcn > 0) {
        tdCanon.appendChild(el("span", {
          class: "cs-id-badge ccn",
          title: nCcn + " CCN" + (nCcn === 1 ? "" : "s") + " use subject " + matchSubj,
        }, ["CCN·" + nCcn]));
      }
    }
    tr.appendChild(tdCanon);

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

  // Variants modal — close handlers (the opener lives inline in variantsCell).
  function wireVariantsModal() {
    var bg = document.getElementById("cs-variants-modal");
    if (!bg) return;
    var close = bg.querySelector(".cs-modal-close");
    function shut() { bg.classList.remove("show"); document.removeEventListener("keydown", _variantsModalEsc); }
    close && close.addEventListener("click", shut);
    bg.addEventListener("click", function (e) { if (e.target === bg) shut(); });
  }

  function init() {
    if (!document.getElementById("tab-canonical-subj4")) return;
    state.sess = getSession();
    wireGuidelinesModal();
    wireVariantsModal();
    Promise.all([fetchSeed(), fetchOverlay(), fetchCidCcn()]).then(function (parts) {
      state.seed = parts[0];
      state.overlay = parts[1];
      state.cidBySubj = parts[2].cidBySubj || {};
      state.ccnBySubj = parts[2].ccnBySubj || {};
      render();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
