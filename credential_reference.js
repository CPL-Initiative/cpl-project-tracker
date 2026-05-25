/*
 * credential_reference.js — UI for the "Credential Reference" curator tab.
 *
 * Curates the credential-identity layer (kb/unified_titles.json +
 * kb/credentials.json). Row grain: one per `unified_title`. Each row
 * shows the AI-classified credential identity + audit signals so a
 * curator can sign off (Mark initiated) or scrutinize low-confidence /
 * flagged entries.
 *
 * Auth piggybacks on the unified_courses.js Supabase session
 * (sessionStorage key `cpl_sb`). Edits write to kb_curation with a
 * synthesized course_id namespace `_CREDENTIAL_REVIEW::<unified_title>`
 * + field `reviewed_marker` (sentinel value "1") — the reviewed_at /
 * reviewer_email on that row marks the unified_title as initiated. The
 * existing _apply_curation.py whitelists "discipline / merge_into /
 * unified_title / description" so it ignores these rows — a future
 * kb/_apply_credential_review.py would pull them into the JSON layer.
 * For the MVP, edits live in Supabase + the overlay shows them live.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var KEY_PREFIX = "_CREDENTIAL_REVIEW::";
  var FIELD_MARKER = "reviewed_marker";

  // Allowlist-driven element builder. CodeQL's js/xss query flags dynamic
  // setAttribute(k, v) where the attribute name can be anything attacker-
  // controlled (e.g. "onclick"), so the helper uses property assignment for
  // every attribute we actually pass. The 10 keys below cover every call
  // site in this file; anything else is a programmer error and is ignored.
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      if (attrs["class"] != null) n.className = String(attrs["class"]);
      if (attrs.id != null) n.id = String(attrs.id);
      if (attrs.title != null) n.title = String(attrs.title);
      if (attrs.type != null) n.type = String(attrs.type);
      if (attrs.value != null) n.value = String(attrs.value);
      if (attrs.placeholder != null) n.placeholder = String(attrs.placeholder);
      if (attrs.autocomplete != null) n.autocomplete = String(attrs.autocomplete);
      if (attrs.href != null) n.href = String(attrs.href);
      if (attrs.list != null) n.setAttribute("list", String(attrs.list));
      if (attrs.colspan != null) n.colSpan = parseInt(attrs.colspan, 10) || 1;
    }
    if (kids) for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (typeof c === "string") {
        // String kids are wrapped via createTextNode — CodeQL recognises
        // createTextNode as a js/xss sanitizer, so the data flow is clear.
        n.appendChild(document.createTextNode(c));
      } else if (c instanceof Node) {
        // Non-string kids must be DOM Nodes constructed via this same helper
        // (every call path in this file recurses through el() → which routes
        // every string through createTextNode, a CodeQL js/xss sanitizer).
        // The `instanceof Node` guard drops anything else.
        //
        // CodeQL's js/xss query flags this appendChild because the helper's
        // recursive sanitisation is invisible to its data-flow analysis.
        // Suppressed at the config level for this file:
        // `.github/codeql/codeql-config.yml`. See the comment there for the
        // full rationale. (Inline lgtm[js/xss] suppression isn't honoured by
        // codeql-action v4 — config exclusion is the supported mechanism.)
        n.appendChild(c);
      }
    }
    return n;
  }

  function clearNode(n) {
    while (n.firstChild) n.removeChild(n.firstChild);
  }

  // ─── Supabase auth — shares the cpl_sb session with unified_courses.js ────
  function isValidJwt(t) {
    return typeof t === "string"
      && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
  }
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token)
          && (s.refresh_token || s.exp > Date.now())) return s;
    } catch (e) {}
    return null;
  }
  function signIn(email) {
    // Stash the current tab so the master auth-fragment handler in
    // unified_courses.js (consumeAuthHash) can restore us here after the
    // magic-link round-trip. Without this, sign-in completes successfully
    // but the user is bounced to the Common Course Reference tab and the
    // sign-in feels like it "didn't complete."
    try { sessionStorage.setItem("cpl_sb_return_tab", "credential-reference"); } catch (e) {}
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
        var m = {};
        arr.forEach(function (row) {
          var t = (row.course_id || "").slice(KEY_PREFIX.length);
          if (!t) return;
          var rec = m[t] = m[t] || {};
          if (row.field === FIELD_MARKER) {
            rec.reviewed_at = row.reviewed_at;
            rec.reviewed_by = row.reviewer_email;
          }
        });
        return m;
      })
      .catch(function () { return {}; });
  }

  function saveInitiated(unifiedTitle, sess) {
    var body = {
      course_id: KEY_PREFIX + unifiedTitle,
      field: FIELD_MARKER,
      value: "1",
      reviewer_email: sess.email
    };
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(body)
    });
  }

  // ─── data loading ───────────────────────────────────────────────────────

  function fetchKb() {
    return Promise.all([
      fetch("kb/unified_titles.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; }),
      fetch("kb/credentials.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; }),
      fetch("kb/exhibit_audit/latest.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; }),
    ]).then(function (parts) {
      return { unifiedTitles: parts[0], credentials: parts[1], audit: parts[2] };
    });
  }

  // ─── row builder ────────────────────────────────────────────────────────

  // Group raw_title entries by unified_title. Each row carries aggregated
  // confidence stats, the issuer + trainer from credentials.json, the
  // raw-variant list, and an audit tag count derived from
  // kb/exhibit_audit/latest.json. Singletons (1 raw → 1 unified) are still
  // rows but flagged so the curator can filter them out.
  function buildRows(unifiedTitles, credentials, audit) {
    var byUnified = {};
    // Pre-index audit tags by raw_title for O(N) lookup.
    var auditByRaw = {};
    if (audit && audit.title_cards) {
      audit.title_cards.forEach(function (c) {
        auditByRaw[c.raw_title] = c.tags || [];
      });
    }

    Object.keys(unifiedTitles).forEach(function (rawTitle) {
      var e = unifiedTitles[rawTitle];
      var ut = e.unified_title || "(blank)";
      var row = byUnified[ut] = byUnified[ut] || {
        unified_title: ut,
        raw_variants: [],
        confidences: [],
        quality_flags: [],
        audit_tags: {},
      };
      row.raw_variants.push({
        raw_title: rawTitle,
        confidence: e.confidence_title || 0,
        quality_flag: e.quality_flag || null,
        classified_by: e.classified_by || null,
        reviewed_at: e.reviewed_at || null,
        classified_at: e.classified_at || null,
        _notes: e._notes || null,
      });
      row.confidences.push(e.confidence_title || 0);
      if (e.quality_flag) row.quality_flags.push(e.quality_flag);
      var tags = auditByRaw[rawTitle] || [];
      tags.forEach(function (t) {
        row.audit_tags[t] = (row.audit_tags[t] || 0) + 1;
      });
    });

    // Attach credential records.
    Object.keys(byUnified).forEach(function (ut) {
      var creds = credentials[ut] || [];
      var row = byUnified[ut];
      row.credentials = creds.map(function (c) {
        return {
          issuing_agency: c.issuing_agency || null,
          training_agency: c.training_agency || null,
          confidence_issuer: c.confidence_issuer || 0,
          confidence_trainer: c.confidence_trainer || 0,
          reviewed_at: c.reviewed_at || null,
          reviewed_by: c.reviewed_by || null,
          _notes: c._notes || null,
        };
      });
      // Derived fields for the table.
      row.raw_count = row.raw_variants.length;
      row.conf_min = Math.min.apply(null, row.confidences);
      row.conf_max = Math.max.apply(null, row.confidences);
      row.conf_modal = _modal(row.confidences);
      var iss = row.credentials.length ? row.credentials[0] : null;
      row.primary_issuer = iss ? iss.issuing_agency : null;
      row.primary_trainer = iss ? iss.training_agency : null;
      row.conf_issuer = iss ? iss.confidence_issuer : 0;
      row.issuer_count = row.credentials.length;
      row.has_quality_flag = row.quality_flags.length > 0;
      row.flag_label = row.quality_flags[0] || null;
      // Audit tag total (sum across raw variants).
      row.audit_tag_total = Object.keys(row.audit_tags)
        .reduce(function (s, k) { return s + row.audit_tags[k]; }, 0);
      row.audit_tag_kinds = Object.keys(row.audit_tags).length;
    });

    return Object.keys(byUnified)
      .sort()
      .map(function (k) { return byUnified[k]; });
  }

  function _modal(arr) {
    if (!arr.length) return 0;
    var counts = {};
    arr.forEach(function (v) {
      var key = v.toFixed(2);
      counts[key] = (counts[key] || 0) + 1;
    });
    var best = null, bestN = -1;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > bestN) { best = parseFloat(k); bestN = counts[k]; }
    });
    return best;
  }

  function applyOverlay(rows, overlay) {
    rows.forEach(function (r) {
      var ov = overlay[r.unified_title];
      if (ov && ov.reviewed_at) {
        r.curator_reviewed_at = ov.reviewed_at;
        r.curator_reviewed_by = ov.reviewed_by;
      }
    });
    return rows;
  }

  // ─── filtering / sorting ────────────────────────────────────────────────

  function _band(c) {
    if (c >= 0.95) return "0.95-1.00";
    if (c >= 0.80) return "0.80-0.94";
    if (c >= 0.60) return "0.60-0.79";
    if (c >= 0.40) return "0.40-0.59";
    return "<0.40";
  }

  function passesFilter(row, state) {
    // Confidence band uses the modal confidence (most representative of the
    // unified title's classification, in case the variants disagree).
    if (state.bandFilter !== "all" && _band(row.conf_modal) !== state.bandFilter)
      return false;
    if (state.issuerFilter !== "all") {
      if (state.issuerFilter === "__null__") {
        if (row.primary_issuer) return false;
      } else if (row.primary_issuer !== state.issuerFilter) {
        return false;
      }
    }
    if (state.tagFilter !== "all") {
      if (!row.audit_tags[state.tagFilter]) return false;
    }
    if (state.flagOnly && !row.has_quality_flag) return false;
    if (state.search) {
      var q = state.search;
      var hit = row.unified_title.toLowerCase().indexOf(q) >= 0
        || (row.primary_issuer && row.primary_issuer.toLowerCase().indexOf(q) >= 0)
        || row.raw_variants.some(function (v) {
          return v.raw_title.toLowerCase().indexOf(q) >= 0;
        });
      if (!hit) return false;
    }
    return true;
  }

  function sortRows(rows, sort) {
    var k = sort.key, dir = sort.dir === "asc" ? 1 : -1;
    var getters = {
      unified_title:   function (r) { return r.unified_title.toLowerCase(); },
      raw_count:       function (r) { return r.raw_count; },
      primary_issuer:  function (r) { return (r.primary_issuer || "~").toLowerCase(); },
      conf_modal:      function (r) { return r.conf_modal; },
      conf_issuer:     function (r) { return r.conf_issuer; },
      audit_tag_total: function (r) { return r.audit_tag_total; },
      flag_label:      function (r) { return r.flag_label || "~"; },
      reviewed:        function (r) { return r.curator_reviewed_at ? 1 : 0; },
    };
    var f = getters[k] || getters.unified_title;
    return rows.slice().sort(function (a, b) {
      var va = f(a), vb = f(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return  1 * dir;
      return a.unified_title.localeCompare(b.unified_title);
    });
  }

  // ─── state ──────────────────────────────────────────────────────────────

  var state = {
    rows: [],
    overlay: {},
    audit: null,
    sess: null,
    search: "",
    bandFilter: "all",
    issuerFilter: "all",
    tagFilter: "all",
    flagOnly: false,
    sort: { key: "unified_title", dir: "asc" },
    expanded: {},  // unified_title → bool (row body open)
    // Sign-in feedback lives IN the auth widget (not a corner toast) so
    // curators can't miss it. pendingSignInEmail = "user@example.com" after
    // a successful OTP request; pendingSignInError = "msg" after a failure.
    // Cleared on successful sign-in (sess populated) or when the user
    // clicks "use a different email".
    pendingSignInEmail: null,
    pendingSignInError: null,
  };

  // ─── rendering ──────────────────────────────────────────────────────────

  function renderToolbar() {
    var tb = document.getElementById("cr-toolbar");
    if (!tb) return;
    clearNode(tb);

    var bandSel = el("select", { class: "cr-filter", id: "cr-band-filter" });
    [
      ["all", "Confidence: any"],
      ["0.95-1.00", "Confidence: 0.95–1.00"],
      ["0.80-0.94", "Confidence: 0.80–0.94"],
      ["0.60-0.79", "Confidence: 0.60–0.79 (review queue)"],
      ["0.40-0.59", "Confidence: 0.40–0.59 (high priority)"],
      ["<0.40",     "Confidence: <0.40 (lowest)"],
    ].forEach(function (opt) {
      var o = el("option", { value: opt[0] }, [opt[1]]);
      if (opt[0] === state.bandFilter) o.selected = true;
      bandSel.appendChild(o);
    });
    bandSel.onchange = function () { state.bandFilter = this.value; render(); };
    tb.appendChild(bandSel);

    // Issuer typeahead — many issuers (126), so use a datalist-backed input.
    var issuerSet = {};
    state.rows.forEach(function (r) {
      if (r.primary_issuer) issuerSet[r.primary_issuer] = true;
    });
    var issuerList = Object.keys(issuerSet).sort();
    var dlId = "cr-issuer-list";
    if (!document.getElementById(dlId)) {
      var dl = document.createElement("datalist");
      dl.id = dlId;
      issuerList.forEach(function (i) {
        dl.appendChild(el("option", { value: i }));
      });
      tb.appendChild(dl);
    }
    var issuerInput = el("input", {
      class: "cr-filter", id: "cr-issuer-filter", type: "search",
      placeholder: "Issuer: any (type to filter; \"(none)\" = local exhibits)",
      list: dlId, autocomplete: "off",
    });
    if (state.issuerFilter !== "all") {
      issuerInput.value = state.issuerFilter === "__null__"
        ? "(none)" : state.issuerFilter;
    }
    issuerInput.oninput = function () {
      var v = this.value.trim();
      if (!v) state.issuerFilter = "all";
      else if (v.toLowerCase() === "(none)") state.issuerFilter = "__null__";
      else if (issuerSet[v]) state.issuerFilter = v;
      else state.issuerFilter = "all";
      render();
    };
    tb.appendChild(issuerInput);

    // Audit-tag triage dropdown — populated from the live audit if present.
    var tagSel = el("select", { class: "cr-filter", id: "cr-tag-filter" });
    var tagOpts = [["all", "Audit tag: any"]];
    if (state.audit && state.audit._rules_active) {
      state.audit._rules_active.forEach(function (rule) {
        tagOpts.push([rule, "Tag: " + rule]);
      });
    } else {
      // Fallback to commonly-observed tags from the data.
      var seen = {};
      state.rows.forEach(function (r) {
        Object.keys(r.audit_tags).forEach(function (t) { seen[t] = true; });
      });
      Object.keys(seen).sort().forEach(function (t) {
        tagOpts.push([t, "Tag: " + t]);
      });
    }
    tagOpts.forEach(function (opt) {
      var o = el("option", { value: opt[0] }, [opt[1]]);
      if (opt[0] === state.tagFilter) o.selected = true;
      tagSel.appendChild(o);
    });
    tagSel.onchange = function () { state.tagFilter = this.value; render(); };
    tb.appendChild(tagSel);

    // Quality-flag-only checkbox.
    var flagLabel = el("label", {
      class: "cr-flag-toggle",
      title: "Show only rows where any raw variant carries quality_flag (e.g. suspect_course_as_exhibit)."
    });
    var flagCb = el("input", { type: "checkbox", id: "cr-flag-only" });
    flagCb.checked = !!state.flagOnly;
    flagCb.onchange = function () { state.flagOnly = this.checked; render(); };
    flagLabel.appendChild(flagCb);
    flagLabel.appendChild(document.createTextNode(" quality-flag only"));
    tb.appendChild(flagLabel);

    // Search (unified_title OR raw_title OR issuer).
    var search = el("input", {
      class: "cr-filter cr-search-wide", id: "cr-search", type: "search",
      placeholder: "Search title or raw variant…",
      autocomplete: "off",
    });
    search.value = state.search;
    search.oninput = function () {
      state.search = this.value.toLowerCase();
      render();
    };
    tb.appendChild(search);

    // Auth widget — separate so renderAuth() can refresh in place
    // without rebuilding the toolbar (keeps search focus).
    tb.appendChild(el("span", { id: "cr-auth", class: "cr-auth" }));
    renderAuth();
  }

  function renderAuth() {
    var auth = document.getElementById("cr-auth");
    if (!auth) return;
    clearNode(auth);

    // Signed in: show "✓ email · sign out"
    if (state.sess) {
      auth.appendChild(el("span", { class: "cr-auth-on" }, ["✓ " + state.sess.email]));
      auth.appendChild(document.createTextNode("  "));
      var out = el("a", { class: "cr-auth-link", href: "#" }, ["sign out"]);
      out.onclick = function (e) {
        e.preventDefault(); signOut(); state.sess = null; renderAuth(); render();
      };
      auth.appendChild(out);
      return;
    }

    // Pending sign-in error: show red panel + retry link
    if (state.pendingSignInError) {
      var errPanel = el("div", { class: "cr-auth-panel cr-auth-panel-err" });
      errPanel.appendChild(el("strong", null, ["✗ Sign-in failed"]));
      errPanel.appendChild(el("div", { class: "cr-auth-panel-detail" }, [state.pendingSignInError]));
      var retry = el("a", { class: "cr-auth-link", href: "#" }, ["try again"]);
      retry.onclick = function (e) {
        e.preventDefault();
        state.pendingSignInError = null;
        renderAuth();
      };
      errPanel.appendChild(retry);
      auth.appendChild(errPanel);
      return;
    }

    // Pending sign-in (magic link sent): show inline confirmation panel
    if (state.pendingSignInEmail) {
      var panel = el("div", { class: "cr-auth-panel cr-auth-panel-ok" });
      panel.appendChild(el("strong", null, ["✉ Magic link sent"]));
      panel.appendChild(el("div", { class: "cr-auth-panel-detail" },
        ["Check the inbox for ", state.pendingSignInEmail,
         " and click the link to complete sign-in. You'll land back on this tab signed in."]));
      var diff = el("a", { class: "cr-auth-link", href: "#" }, ["use a different email"]);
      diff.onclick = function (e) {
        e.preventDefault();
        state.pendingSignInEmail = null;
        renderAuth();
      };
      panel.appendChild(diff);
      auth.appendChild(panel);
      return;
    }

    // Default: show sign-in link
    var inn = el("a", { class: "cr-auth-link", href: "#" }, ["sign in to edit"]);
    inn.onclick = function (e) {
      e.preventDefault();
      var email = prompt("Email (must be an allowed reviewer):");
      if (!email) return;
      email = email.trim();
      if (!email) return;
      signIn(email)
        .then(function (r) {
          if (r.ok) {
            state.pendingSignInEmail = email;
            state.pendingSignInError = null;
          } else {
            state.pendingSignInError = "Server returned " + r.status
              + ". Confirm the email is in the allowed-reviewers list and try again.";
            state.pendingSignInEmail = null;
          }
          renderAuth();
        })
        .catch(function () {
          state.pendingSignInError = "Couldn't reach the auth server. Check your connection and try again.";
          state.pendingSignInEmail = null;
          renderAuth();
        });
    };
    auth.appendChild(inn);
    auth.appendChild(el("span", { class: "cr-auth-tag" }, ["(CCCCO MAP only)"]));
  }

  function renderSummary(rows, filtered) {
    var sum = document.getElementById("cr-summary");
    if (!sum) return;
    var revCount = 0;
    rows.forEach(function (r) { if (r.curator_reviewed_at) revCount += 1; });
    clearNode(sum);
    sum.appendChild(el("strong", null, [String(filtered.length)]));
    sum.appendChild(document.createTextNode(" of " + rows.length + " unified titles shown · "));
    sum.appendChild(el("strong", null, [String(revCount)]));
    sum.appendChild(document.createTextNode(" initiated · audit baseline: "
      + (state.audit ? state.audit._generated_at.slice(0, 10) : "—")));
  }

  function render() {
    var filtered = state.rows.filter(function (r) { return passesFilter(r, state); });
    filtered = sortRows(filtered, state.sort);
    renderSummary(state.rows, filtered);

    var wrap = document.getElementById("cr-table-wrap");
    if (!wrap) return;
    clearNode(wrap);

    var table = el("table", { class: "cr-table" });
    var COLS = [
      { key: "unified_title",   label: "Unified Title" },
      { key: "raw_count",       label: "Variants",
        title: "Number of distinct raw MAP titles collapsed under this unified title." },
      { key: "primary_issuer",  label: "Issuing Agency" },
      { key: "conf_modal",      label: "Confidence (title)",
        title: "Modal confidence across the raw variants." },
      { key: "conf_issuer",     label: "Confidence (issuer)" },
      { key: "audit_tag_total", label: "Audit",
        title: "Sum of audit tag firings across the raw variants. Hover a chip for details." },
      { key: "flag_label",      label: "Quality flag" },
      { key: "reviewed",        label: "Initiated" },
      { key: null,              label: "Action" },
    ];

    var headerRow = el("tr");
    COLS.forEach(function (col) {
      var attrs = col.title ? { title: col.title } : null;
      var children = [col.label];
      if (col.key) {
        var active = state.sort.key === col.key;
        var indicator = !active ? "↕" : (state.sort.dir === "asc" ? "▲" : "▼");
        children.push(el("span", {
          class: "cr-sort-indicator" + (active ? " active" : "")
        }, [indicator]));
      }
      var th = el("th", attrs, children);
      if (col.key) {
        th.classList.add("sortable");
        (function (k) {
          th.onclick = function () {
            if (state.sort.key === k) {
              state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
            } else {
              state.sort.key = k;
              state.sort.dir = k === "unified_title" ? "asc" : "desc";
            }
            render();
          };
        })(col.key);
      }
      headerRow.appendChild(th);
    });
    table.appendChild(el("thead", null, [headerRow]));

    var tbody = el("tbody");
    if (!filtered.length) {
      var tr = el("tr");
      var td = el("td", { colspan: String(COLS.length), class: "cr-empty" },
        ["No rows match the current filters."]);
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      filtered.forEach(function (r) {
        tbody.appendChild(renderRow(r));
        if (state.expanded[r.unified_title]) {
          tbody.appendChild(renderExpandedRow(r, COLS.length));
        }
      });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function renderRow(r) {
    var tr = el("tr", { class: "cr-row" });
    // Unified title — clickable to expand.
    var titleTd = el("td", { class: "cr-title-cell" });
    var caret = state.expanded[r.unified_title] ? "▾" : "▸";
    var titleBtn = el("button", {
      type: "button", class: "cr-title-toggle",
      title: "Show raw-title variants + credential record(s)"
    }, [caret + " " + r.unified_title]);
    titleBtn.onclick = function () {
      state.expanded[r.unified_title] = !state.expanded[r.unified_title];
      render();
    };
    titleTd.appendChild(titleBtn);
    tr.appendChild(titleTd);

    tr.appendChild(el("td", null, [String(r.raw_count)]));
    tr.appendChild(el("td", { class: "cr-issuer-cell" },
      [r.primary_issuer || el("span", { class: "cr-null" }, ["(none — local)"])]));

    tr.appendChild(el("td", { class: "cr-conf-cell " + _bandCls(r.conf_modal) },
      [r.conf_modal.toFixed(2)]));
    tr.appendChild(el("td", { class: "cr-conf-cell " + _bandCls(r.conf_issuer) },
      [r.conf_issuer ? r.conf_issuer.toFixed(2) : "—"]));

    // Audit-tag chip — count + hover tooltip listing the firing rules.
    var auditTd = el("td", { class: "cr-audit-cell" });
    if (r.audit_tag_total) {
      var auditTitle = Object.keys(r.audit_tags)
        .map(function (t) { return t + " ×" + r.audit_tags[t]; }).join("\n");
      var chipCls = r.conf_modal < 0.60 ? "warn" :
                    r.conf_modal < 0.80 ? "mix" : "muted";
      auditTd.appendChild(el("span", {
        class: "cr-audit-chip " + chipCls,
        title: auditTitle,
      }, ["⚠ " + r.audit_tag_total]));
    }
    tr.appendChild(auditTd);

    var flagTd = el("td", { class: "cr-flag-cell" });
    if (r.flag_label) {
      flagTd.appendChild(el("span", {
        class: "cr-flag-badge", title: r.flag_label
      }, [r.flag_label.replace(/_/g, " ")]));
    }
    tr.appendChild(flagTd);

    var revTd = el("td", { class: "cr-rev-cell" });
    if (r.curator_reviewed_at) {
      var who = (r.curator_reviewed_by || "").split("@")[0];
      var when = r.curator_reviewed_at.slice(0, 10);
      revTd.appendChild(el("span", { class: "cr-rev-on" },
        ["✓ " + who + " · " + when]));
    }
    tr.appendChild(revTd);

    // Action: Mark initiated (auth-gated).
    var actionTd = el("td", { class: "cr-action-cell" });
    if (r.curator_reviewed_at) {
      actionTd.appendChild(el("span", { class: "cr-action-noop" }, ["—"]));
    } else if (state.sess) {
      var b = el("button", {
        type: "button", class: "cr-action-btn",
        title: "Mark this unified title as initiated (curator-acknowledged classification)."
      }, ["Mark initiated"]);
      b.onclick = function () {
        if (!confirm("Mark \"" + r.unified_title + "\" initiated?\n\n"
            + "This records that you've reviewed the AI classification + "
            + "issuer attribution. It doesn't change the underlying data.")) return;
        b.disabled = true; b.textContent = "Saving…";
        saveInitiated(r.unified_title, state.sess)
          .then(function (resp) {
            if (!resp.ok) {
              b.disabled = false; b.textContent = "Mark initiated";
              toast("Save failed (" + resp.status + ")", true); return;
            }
            r.curator_reviewed_at = new Date().toISOString();
            r.curator_reviewed_by = state.sess.email;
            state.overlay[r.unified_title] = {
              reviewed_at: r.curator_reviewed_at,
              reviewed_by: r.curator_reviewed_by,
            };
            toast("Initiated · " + r.unified_title);
            render();
          })
          .catch(function () {
            b.disabled = false; b.textContent = "Mark initiated";
            toast("Save failed (network)", true);
          });
      };
      actionTd.appendChild(b);
    } else {
      actionTd.appendChild(el("span", {
        class: "cr-action-noop", title: "Sign in to mark initiated"
      }, ["—"]));
    }
    tr.appendChild(actionTd);
    return tr;
  }

  function renderExpandedRow(r, colSpan) {
    var tr = el("tr", { class: "cr-expanded" });
    var td = el("td", { colspan: String(colSpan) });
    var div = el("div", { class: "cr-expanded-body" });

    // Raw variants list.
    div.appendChild(el("h5", null, [
      "Raw MAP titles unified under this credential (" + r.raw_count + ")"
    ]));
    var ul = el("ul", { class: "cr-variants-list" });
    r.raw_variants
      .slice()
      .sort(function (a, b) { return a.confidence - b.confidence; })
      .forEach(function (v) {
        var li = el("li");
        li.appendChild(el("span", {
          class: "cr-variant-conf " + _bandCls(v.confidence)
        }, [v.confidence.toFixed(2)]));
        li.appendChild(document.createTextNode(" "));
        li.appendChild(el("code", { class: "cr-variant-code" }, [v.raw_title]));
        if (v.quality_flag) {
          li.appendChild(document.createTextNode(" "));
          li.appendChild(el("span", {
            class: "cr-flag-badge", title: v.quality_flag
          }, [v.quality_flag.replace(/_/g, " ")]));
        }
        if (v._notes) {
          li.appendChild(el("div", { class: "cr-variant-notes" }, [v._notes]));
        }
        ul.appendChild(li);
      });
    div.appendChild(ul);

    // Credential record(s).
    if (r.credentials.length) {
      div.appendChild(el("h5", null, [
        "Credential record" + (r.credentials.length > 1 ? "s" : "")
        + " (issuer / trainer attribution)"
      ]));
      r.credentials.forEach(function (c) {
        var d = el("div", { class: "cr-cred-record" });
        d.appendChild(el("div", null, [
          "Issuer: " + (c.issuing_agency || "(none)")
          + " · confidence " + c.confidence_issuer.toFixed(2)
        ]));
        if (c.training_agency) {
          d.appendChild(el("div", null, [
            "Trainer: " + c.training_agency
            + " · confidence " + c.confidence_trainer.toFixed(2)
          ]));
        }
        if (c._notes) {
          d.appendChild(el("div", { class: "cr-cred-notes" }, [c._notes]));
        }
        div.appendChild(d);
      });
    }

    // Audit tag rollup.
    if (r.audit_tag_total) {
      div.appendChild(el("h5", null, ["Audit signals"]));
      var ul2 = el("ul", { class: "cr-audit-list" });
      Object.keys(r.audit_tags).sort().forEach(function (t) {
        ul2.appendChild(el("li", null,
          [el("code", null, [t]), " × " + r.audit_tags[t]]));
      });
      div.appendChild(ul2);
    }

    td.appendChild(div);
    tr.appendChild(td);
    return tr;
  }

  function _bandCls(c) {
    if (c >= 0.95) return "cr-conf-high";
    if (c >= 0.80) return "cr-conf-ok";
    if (c >= 0.60) return "cr-conf-mid";
    if (c >= 0.40) return "cr-conf-low";
    return "cr-conf-min";
  }

  // ─── toast ──────────────────────────────────────────────────────────────

  function toast(msg, isErr) {
    var t = document.getElementById("cr-toast");
    if (!t) {
      t = el("div", { id: "cr-toast", class: "cr-toast" });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = "cr-toast" + (isErr ? " err" : "") + " show";
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = "cr-toast"; }, 3000);
  }

  // ─── init ───────────────────────────────────────────────────────────────

  function init() {
    if (!document.getElementById("tab-credential-reference")) return;
    state.sess = getSession();
    Promise.all([fetchKb(), fetchOverlay()]).then(function (parts) {
      var kb = parts[0];
      state.audit = kb.audit;
      state.rows = applyOverlay(
        buildRows(kb.unifiedTitles, kb.credentials, kb.audit),
        parts[1]
      );
      state.overlay = parts[1];
      renderToolbar();
      render();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
