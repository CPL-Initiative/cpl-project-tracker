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
  // PR-4 — per-field override columns. Each one is a separate row in
  // kb_curation under the same KEY_PREFIX::<unified_title>, keyed by `field`.
  // The composite PK is (course_id, field), so a row per field stacks cleanly.
  // Display rule: override wins; original kept on r.original_* for tooltip.
  // unified_title_override is DISPLAY-ONLY — the original unified_title remains
  // the KB key (and the articulation join target). A future PR-5 will promote
  // overrides into real KB renames with an alias map + sync script.
  var FIELD_UTITLE_OVERRIDE  = "unified_title_override";
  var FIELD_ISSUER_OVERRIDE  = "issuing_agency_override";
  var FIELD_TRAINER_OVERRIDE = "training_agency_override";
  var FIELD_QFLAG_OVERRIDE   = "quality_flag_override";
  var QFLAG_OPTIONS = ["", "suspect_course_as_exhibit", "not_a_credential", "duplicate_of_other"];

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
          } else if (row.field === FIELD_UTITLE_OVERRIDE) {
            rec.utitle_override   = row.value || "";
            rec.utitle_overridden_by = row.reviewer_email;
            rec.utitle_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_ISSUER_OVERRIDE) {
            rec.issuer_override = row.value || "";
            rec.issuer_overridden_by = row.reviewer_email;
            rec.issuer_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_TRAINER_OVERRIDE) {
            rec.trainer_override = row.value || "";
            rec.trainer_overridden_by = row.reviewer_email;
            rec.trainer_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_QFLAG_OVERRIDE) {
            rec.qflag_override = row.value || "";
            rec.qflag_overridden_by = row.reviewer_email;
            rec.qflag_overridden_at = row.reviewed_at;
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

  // PR-4 — generic save for any per-field override. Uses the same
  // _CREDENTIAL_REVIEW::<unified_title> namespace with `field` discriminating.
  // `value` is a string; "" is meaningful (it overrides the original to empty —
  // useful for clearing an inferred issuer that's wrong). Use clearOverride()
  // to remove an override entirely (DELETE the row so the original shows again).
  function saveOverride(unifiedTitle, field, value, sess) {
    var body = {
      course_id: KEY_PREFIX + unifiedTitle,
      field: field,
      value: value,
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
  function clearOverride(unifiedTitle, field, sess) {
    var url = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?course_id=eq." + encodeURIComponent(KEY_PREFIX + unifiedTitle)
      + "&field=eq." + encodeURIComponent(field);
    return fetch(url, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + sess.access_token
      }
    });
  }

  // ─── data loading ───────────────────────────────────────────────────────

  // Adapter — converts a row from the baked payload (window.CPL_CREDENTIAL_REFERENCE)
  // to the row shape the renderer expects. Same shape as buildRows() output below
  // so render code is unified across both paths (baked vs runtime fetch).
  function adaptBakedRow(b) {
    var tags = b.audit_tags || {};
    var r = {
      unified_title: b.ut,
      raw_count: b.raw_count || 0,
      primary_issuer: b.issuer || null,
      primary_trainer: b.trainer || null,
      conf_modal: b.conf_title || 0,
      conf_issuer: b.conf_issuer || 0,
      conf_min: b.conf_title || 0,  // baked payload only carries modal
      conf_max: b.conf_title || 0,
      quality_flag: b.quality_flag || null,
      has_quality_flag: !!b.quality_flag,
      flag_label: b.quality_flag || null,
      quality_flags: b.quality_flag ? [b.quality_flag] : [],
      audit_tags: tags,
      audit_tag_total: b.audit_tag_total || 0,
      audit_tag_kinds: Object.keys(tags).length,
      // New from baked — common-course join + discipline + scope badge:
      disc_modal: b.disc_modal || "",
      top_modal: b.top_modal || "",
      statewide: !!b.statewide,
      articulations: b.articulations || [],
      n_articulation_lines: b.n_articulation_lines || 0,
      // The legacy raw_variants list is NOT included in baked (saves payload size);
      // the expanded body uses `articulations` instead. raw_count is still surfaced.
      raw_variants: null,
      credentials: null,
      issuer_count: b.issuer ? 1 : 0,
      confidences: [],
    };
    // PR-5a follow-up: surface baked curator overrides so applyOverlay() can
    // tell apart "AI baseline" from "curator override" and render the
    // originally:X hint correctly. The presence of an _original_* field
    // signals "the visible value is a baked override; baseline lives here."
    if (b._original_issuer !== undefined) r._original_primary_issuer = b._original_issuer;
    if (b._original_trainer !== undefined) r._original_primary_trainer = b._original_trainer;
    if (b._original_quality_flag !== undefined) r._original_flag_label = b._original_quality_flag;
    // PR-5b/0 — Mode-A display override for unified_title. The baked
    // `display_title` carries the curator's preferred label so cold-start
    // renders show curator-truth before fetchOverlay() resolves; the baked
    // `_original_display_title` is the baseline (== r.unified_title), used by
    // applyOverlay's case (b) when the curator clears the override between
    // the daily sync bake and the runtime fetch. `r.unified_title` STAYS as
    // the original (overlay key + identity).
    if (b.display_title !== undefined) r.display_title = b.display_title;
    if (b._original_display_title !== undefined) r._original_display_title = b._original_display_title;
    if (b.curated_by) r.curator_reviewed_by = b.curated_by;
    if (b.curated_at) r.curator_reviewed_at = b.curated_at;
    return r;
  }

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
      // Fallback path doesn't carry the common-course join — surface empty
      // defaults so the render code can rely on the fields being present.
      row.disc_modal = "";
      row.top_modal = "";
      row.statewide = false;
      row.articulations = [];
      row.n_articulation_lines = 0;
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
    // PR-5a follow-up — bake-aware overlay application.
    //
    // The baked payload now carries curator overrides directly (so non-
    // dashboard consumers + cold-start renders see the curator-truth). When
    // a field was baked-overridden, the row carries _original_<field> with
    // the AI baseline. Three cases per field:
    //   (a) Live overlay has an override → that wins; baseline (preferring
    //       the baked _original_ over the visible value) becomes original_*.
    //   (b) No live override but a baked _original_ exists → curator cleared
    //       the override in Supabase between the daily-sync bake and now;
    //       revert to baseline so the dashboard doesn't show stale data.
    //   (c) Neither → no-op.
    // Note: the loop visits EVERY row (no early-return on missing overlay
    // entry), because case (b) can fire even when ov is empty.
    rows.forEach(function (r) {
      var ov = overlay[r.unified_title] || {};
      if (ov.reviewed_at) {
        r.curator_reviewed_at = ov.reviewed_at;
        r.curator_reviewed_by = ov.reviewed_by;
      }
      // utitle_override — display-only, identity stays. Same bake-aware
      // pattern as the other fields.
      var utitle_baseline = (r._original_display_title !== undefined)
        ? r._original_display_title
        : (r.display_title || r.unified_title);
      if (ov.utitle_override !== undefined && ov.utitle_override !== "") {
        r.original_display_title = utitle_baseline;
        r.display_title = ov.utitle_override;
        r.utitle_overridden_by = ov.utitle_overridden_by;
        r.utitle_overridden_at = ov.utitle_overridden_at;
      } else if (r._original_display_title !== undefined) {
        r.display_title = r._original_display_title;
        delete r.original_display_title;
      }
      // issuer_override
      var issuer_baseline = (r._original_primary_issuer !== undefined)
        ? r._original_primary_issuer : r.primary_issuer;
      if (ov.issuer_override !== undefined) {
        r.original_primary_issuer = issuer_baseline;
        r.primary_issuer = ov.issuer_override || null;
        r.issuer_overridden_by = ov.issuer_overridden_by;
        r.issuer_overridden_at = ov.issuer_overridden_at;
      } else if (r._original_primary_issuer !== undefined) {
        r.primary_issuer = r._original_primary_issuer;
        delete r.original_primary_issuer;
      }
      // trainer_override
      var trainer_baseline = (r._original_primary_trainer !== undefined)
        ? r._original_primary_trainer : r.primary_trainer;
      if (ov.trainer_override !== undefined) {
        r.original_primary_trainer = trainer_baseline;
        r.primary_trainer = ov.trainer_override || null;
        r.trainer_overridden_by = ov.trainer_overridden_by;
        r.trainer_overridden_at = ov.trainer_overridden_at;
      } else if (r._original_primary_trainer !== undefined) {
        r.primary_trainer = r._original_primary_trainer;
        delete r.original_primary_trainer;
      }
      // qflag_override
      var qflag_baseline = (r._original_flag_label !== undefined)
        ? r._original_flag_label : r.flag_label;
      if (ov.qflag_override !== undefined) {
        r.original_flag_label = qflag_baseline;
        r.flag_label = ov.qflag_override || null;
        r.qflag_overridden_by = ov.qflag_overridden_by;
        r.qflag_overridden_at = ov.qflag_overridden_at;
      } else if (r._original_flag_label !== undefined) {
        r.flag_label = r._original_flag_label;
        delete r.original_flag_label;
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
      statewide:       function (r) { return r.statewide ? 1 : 0; },
      disc_modal:      function (r) { return (r.disc_modal || "~").toLowerCase(); },
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
    // PR-2: bulk-select state for the "Mark N initiated" workflow. Keys are
    // unified_title strings (selected = true). Only non-already-initiated
    // rows can be selected; selection is cleared after each successful
    // bulk save.
    selected: {},
    bulkSaving: false,    // true while a batch save is in flight (UI lock)
    bulkProgress: null,   // {done, total} during a save
    // PR-3: row grouping. "none" / "top" / "disc". Collapsed groups remember
    // their state across renders so toggling a filter doesn't re-expand
    // everything the curator just collapsed.
    groupBy: "none",
    collapsedGroups: {},
    topCategories: {},   // 2-digit → title (loaded from baked payload)
    // PR-4: per-row, per-field edit-mode tracker for the curation panel.
    // shape: { "unified_title": { "field_name": "display" | "edit" | "saving" } }
    curationEditing: {},
  };

  // Group key for a row given the current state.groupBy mode.
  function groupKeyOf(r) {
    if (state.groupBy === "top") {
      var t = (r.top_modal || "").slice(0, 2);
      return t || "~~";
    }
    if (state.groupBy === "disc") {
      return r.disc_modal || "~~";
    }
    return null;
  }
  // Display label for a group key.
  function groupLabelOf(key) {
    if (state.groupBy === "top") {
      if (key === "~~") return "(No TOP category)";
      var title = state.topCategories[key];
      return title ? ("TOP " + key + " — " + title) : ("TOP " + key);
    }
    if (state.groupBy === "disc") {
      return key === "~~" ? "(No discipline)" : key;
    }
    return "";
  }

  // Helpers for selection bookkeeping
  function selectionEligible(r) {
    // A row is eligible for "Mark initiated" only if not already initiated.
    // Treats the curator overlay AND any future server-side reviewed_at the
    // same way.
    return !r.curator_reviewed_at;
  }
  function selectedRows() {
    return state.rows.filter(function (r) {
      return state.selected[r.unified_title] && selectionEligible(r);
    });
  }
  function selectedCount() { return selectedRows().length; }

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

    // PR-3: group-by dropdown.
    var groupSel = el("select", { class: "cr-filter", id: "cr-group-by",
      title: "Group rows under collapsible TOP category or MQ discipline headers." });
    [
      ["none", "Group: none"],
      ["top",  "Group: TOP category"],
      ["disc", "Group: Discipline"],
    ].forEach(function (opt) {
      var o = el("option", { value: opt[0] }, [opt[1]]);
      if (opt[0] === state.groupBy) o.selected = true;
      groupSel.appendChild(o);
    });
    groupSel.onchange = function () {
      state.groupBy = this.value;
      // Don't carry collapsed-state across grouping modes — the keys are
      // namespaced by mode (e.g. "top:12" vs "disc:Health") to avoid clashes.
      // Reset to "all expanded" on mode change for predictability.
      state.collapsedGroups = {};
      render();
    };
    tb.appendChild(groupSel);

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

    // Bulk-action button — refreshed in place by renderBulkAction() so the
    // toolbar doesn't rebuild on every selection change (preserves focus +
    // dropdown state).
    tb.appendChild(el("span", { id: "cr-bulk", class: "cr-bulk" }));
    renderBulkAction();

    // Auth widget — separate so renderAuth() can refresh in place
    // without rebuilding the toolbar (keeps search focus).
    tb.appendChild(el("span", { id: "cr-auth", class: "cr-auth" }));
    renderAuth();
  }

  // Refresh ONLY the bulk-action widget. Called from render() after any
  // state.selected mutation, so the toolbar doesn't have to rebuild end-to-end.
  function renderBulkAction() {
    var slot = document.getElementById("cr-bulk");
    if (!slot) return;
    clearNode(slot);
    if (!state.sess) return;  // anonymous viewers see nothing here
    if (state.bulkSaving && state.bulkProgress) {
      var p = state.bulkProgress;
      slot.appendChild(el("span", { class: "cr-bulk-progress" },
        ["Saving " + p.done + " of " + p.total + "…"]));
      return;
    }
    var n = selectedCount();
    if (n === 0) return;
    var btn = el("button", {
      type: "button", class: "cr-bulk-btn",
      title: "Mark all selected credentials as initiated (curator-acknowledged classification)."
    }, ["✓ Mark " + n + " initiated"]);
    btn.onclick = function () { bulkMarkInitiated(); };
    slot.appendChild(btn);
    var clearLink = el("a", { class: "cr-bulk-clear", href: "#",
      title: "Clear the current selection" }, ["clear"]);
    clearLink.onclick = function (e) {
      e.preventDefault();
      state.selected = {};
      render();
    };
    slot.appendChild(document.createTextNode(" · "));
    slot.appendChild(clearLink);
  }

  // Sequential batch save — saveInitiated() per row, one at a time. Sequential
  // (not Promise.all) keeps us under Supabase's per-second rate limit, surfaces
  // any failures cleanly, and lets the curator see progress. Most batches are
  // 5–50 rows so the wall-clock is fine.
  function bulkMarkInitiated() {
    var rows = selectedRows();
    if (!rows.length || !state.sess || state.bulkSaving) return;
    if (!confirm("Mark " + rows.length + " credential" + (rows.length === 1 ? "" : "s")
        + " as initiated?\n\nThis records that you've reviewed the AI "
        + "classification + issuer attribution for each row. It doesn't change "
        + "the underlying data.")) return;
    state.bulkSaving = true;
    state.bulkProgress = { done: 0, total: rows.length };
    render();
    var ok = 0, fail = 0;
    function next(i) {
      if (i >= rows.length) {
        state.bulkSaving = false;
        state.bulkProgress = null;
        state.selected = {};
        toast(
          "Initiated " + ok + (fail ? " · " + fail + " failed" : ""),
          fail > 0
        );
        render();
        return;
      }
      var r = rows[i];
      saveInitiated(r.unified_title, state.sess)
        .then(function (resp) {
          if (resp.ok) {
            ok += 1;
            r.curator_reviewed_at = new Date().toISOString();
            r.curator_reviewed_by = state.sess.email;
            state.overlay[r.unified_title] = {
              reviewed_at: r.curator_reviewed_at,
              reviewed_by: r.curator_reviewed_by,
            };
          } else {
            fail += 1;
          }
        })
        .catch(function () { fail += 1; })
        .then(function () {
          state.bulkProgress = { done: i + 1, total: rows.length };
          // Re-render only the bulk widget for the in-flight progress text —
          // full table re-render would be expensive per row.
          renderBulkAction();
          next(i + 1);
        });
    }
    next(0);
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
          } else if (r.status === 429) {
            // Supabase rate-limits OTP sends per email/IP. Most common cause
            // of a sign-in failure during testing; misclassifying it as a
            // permission error sends curators down a rabbit hole.
            state.pendingSignInError = "Too many sign-in emails just now — "
              + "please wait a few minutes, then request one link.";
            state.pendingSignInEmail = null;
          } else if (r.status === 400 || r.status === 422) {
            state.pendingSignInError = "Server rejected the request (HTTP "
              + r.status + "). Confirm the email is in the allowed-reviewers list.";
            state.pendingSignInEmail = null;
          } else {
            state.pendingSignInError = "Server returned HTTP " + r.status
              + ". Try again in a moment, or contact the MAP team if it persists.";
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
    renderBulkAction();

    var wrap = document.getElementById("cr-table-wrap");
    if (!wrap) return;
    clearNode(wrap);

    var table = el("table", { class: "cr-table" });
    var COLS = [
      { key: null,              label: "" },  // checkbox column — header rendered separately below
      { key: "unified_title",   label: "Unified Title" },
      { key: "raw_count",       label: "Variants",
        title: "Number of distinct raw MAP titles collapsed under this unified title." },
      { key: "statewide",       label: "Scope",
        title: "🏛 Statewide if any articulation is CCC Collaborative; 🏠 Local otherwise. — = no articulations resolved." },
      { key: "disc_modal",      label: "Discipline",
        title: "Predominant MQ discipline across this credential's articulated common courses." },
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
    COLS.forEach(function (col, idx) {
      // First column (idx 0) is the bulk-select checkbox. Header renders a
      // "select all visible" checkbox that toggles every eligible row in the
      // current filtered view (NOT the full dataset).
      if (idx === 0) {
        var thChk = el("th", { class: "cr-chk-cell" });
        if (state.sess) {
          var visibleEligible = filtered.filter(selectionEligible);
          var allSelected = visibleEligible.length > 0
            && visibleEligible.every(function (r) { return state.selected[r.unified_title]; });
          var someSelected = !allSelected
            && visibleEligible.some(function (r) { return state.selected[r.unified_title]; });
          var headChk = el("input", { type: "checkbox", id: "cr-select-all",
            title: "Select all eligible rows in the current filter view" });
          headChk.checked = allSelected;
          headChk.indeterminate = someSelected;
          headChk.disabled = !!state.bulkSaving;
          headChk.onchange = function () {
            if (allSelected) {
              visibleEligible.forEach(function (r) { delete state.selected[r.unified_title]; });
            } else {
              visibleEligible.forEach(function (r) { state.selected[r.unified_title] = true; });
            }
            render();
          };
          thChk.appendChild(headChk);
        }
        headerRow.appendChild(thChk);
        return;
      }
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
    } else if (state.groupBy === "none") {
      filtered.forEach(function (r) {
        tbody.appendChild(renderRow(r));
        if (state.expanded[r.unified_title]) {
          tbody.appendChild(renderExpandedRow(r, COLS.length));
        }
      });
    } else {
      // Grouped render — bucket the filtered rows by the active group key
      // (already filtered + sorted) and emit a collapsible header before each
      // group's rows.
      var groups = {};
      var groupOrder = [];
      filtered.forEach(function (r) {
        var k = groupKeyOf(r);
        if (!(k in groups)) { groups[k] = []; groupOrder.push(k); }
        groups[k].push(r);
      });
      // Sort group order: by label (with the empty/no-X bucket last).
      groupOrder.sort(function (a, b) {
        if (a === "~~" && b !== "~~") return 1;
        if (b === "~~" && a !== "~~") return -1;
        return groupLabelOf(a).localeCompare(groupLabelOf(b));
      });
      groupOrder.forEach(function (k) {
        var rowsInGroup = groups[k];
        var collKey = state.groupBy + ":" + k;
        var collapsed = !!state.collapsedGroups[collKey];
        // Header row — single cell colspan'd across the full table width.
        var hdrTr = el("tr", { class: "cr-group-hdr" });
        var hdrTd = el("td", { colspan: String(COLS.length) });
        var twisty = collapsed ? "▶" : "▼";
        var btn = el("button", { type: "button", class: "cr-group-toggle",
          title: collapsed ? "Expand group" : "Collapse group" });
        btn.appendChild(el("span", { class: "cr-group-twisty" }, [twisty]));
        btn.appendChild(document.createTextNode(" "));
        btn.appendChild(el("span", { class: "cr-group-label" }, [groupLabelOf(k)]));
        btn.appendChild(document.createTextNode(" "));
        btn.appendChild(el("span", { class: "cr-group-count" },
          ["(" + rowsInGroup.length + ")"]));
        btn.onclick = function () {
          if (state.collapsedGroups[collKey]) delete state.collapsedGroups[collKey];
          else state.collapsedGroups[collKey] = true;
          render();
        };
        hdrTd.appendChild(btn);
        hdrTr.appendChild(hdrTd);
        tbody.appendChild(hdrTr);
        if (!collapsed) {
          rowsInGroup.forEach(function (r) {
            tbody.appendChild(renderRow(r));
            if (state.expanded[r.unified_title]) {
              tbody.appendChild(renderExpandedRow(r, COLS.length));
            }
          });
        }
      });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function renderRow(r) {
    var tr = el("tr", { class: "cr-row" });

    // Per-row checkbox (auth-gated). Disabled for already-initiated rows AND
    // while a bulk save is in flight (so the UI is locked during the batch).
    var chkTd = el("td", { class: "cr-chk-cell" });
    if (state.sess) {
      var elig = selectionEligible(r);
      var chk = el("input", {
        type: "checkbox", class: "cr-row-chk",
        title: elig ? "Select for bulk action" : "Already initiated — not eligible for bulk action",
      });
      chk.checked = !!state.selected[r.unified_title];
      chk.disabled = !elig || !!state.bulkSaving;
      chk.onchange = function () {
        if (chk.checked) state.selected[r.unified_title] = true;
        else delete state.selected[r.unified_title];
        // Re-render to refresh the header indeterminate state + toolbar count.
        render();
      };
      chkTd.appendChild(chk);
    }
    tr.appendChild(chkTd);

    // Unified title — clickable to expand.
    var titleTd = el("td", { class: "cr-title-cell" });
    var caret = state.expanded[r.unified_title] ? "▾" : "▸";
    var displayLabel = r.display_title || r.unified_title;
    var titleBtn = el("button", {
      type: "button", class: "cr-title-toggle",
      title: r.utitle_overridden_at
        ? "Curated label · originally: " + r.unified_title
          + " · expand for raw variants + curation panel"
        : "Show raw-title variants + curation panel + credential record(s)"
    }, [caret + " " + displayLabel]);
    titleBtn.onclick = function () {
      state.expanded[r.unified_title] = !state.expanded[r.unified_title];
      render();
    };
    titleTd.appendChild(titleBtn);
    if (r.utitle_overridden_at) {
      titleTd.appendChild(el("span", { class: "cr-override-marker",
        title: "Display label curated · originally: " + r.unified_title
      }, [" ✎"]));
    }
    tr.appendChild(titleTd);

    tr.appendChild(el("td", null, [String(r.raw_count)]));

    // Scope badge — Statewide vs Local, computed from any articulation's
    // collaborative_type ("CCC" / "CCC Collaborative" → statewide).
    var scopeTd = el("td", { class: "cr-scope-cell" });
    if (r.articulations && r.articulations.length) {
      scopeTd.appendChild(r.statewide
        ? el("span", { class: "cr-scope-badge cr-scope-state",
                       title: "At least one articulation is CCC Collaborative" },
             ["🏛 Statewide"])
        : el("span", { class: "cr-scope-badge cr-scope-local",
                       title: "All articulations are local (no CCC Collaborative)" },
             ["🏠 Local"]));
    } else {
      scopeTd.appendChild(el("span", { class: "cr-null",
        title: "No common-course articulations resolved for this credential" }, ["—"]));
    }
    tr.appendChild(scopeTd);

    // Discipline column — modal MQ discipline across this credential's
    // articulations (blank if no articulations).
    var discTd = el("td", { class: "cr-disc-cell" });
    discTd.appendChild(r.disc_modal
      ? document.createTextNode(r.disc_modal)
      : el("span", { class: "cr-null" }, ["—"]));
    tr.appendChild(discTd);

    var issuerTd = el("td", { class: "cr-issuer-cell" });
    issuerTd.appendChild(r.primary_issuer
      ? document.createTextNode(r.primary_issuer)
      : el("span", { class: "cr-null" }, ["(none — local)"]));
    if (r.issuer_overridden_at) {
      issuerTd.appendChild(el("span", { class: "cr-override-marker",
        title: "Issuing agency curated · originally: " +
               (r.original_primary_issuer || "(none)")
      }, [" ✎"]));
    }
    tr.appendChild(issuerTd);

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
    if (r.qflag_overridden_at) {
      flagTd.appendChild(el("span", { class: "cr-override-marker",
        title: "Quality flag curated · originally: " +
               (r.original_flag_label || "(none)")
      }, [" ✎"]));
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

  // PR-4 — curation panel rendered at the top of each expanded row.
  // For signed-in reviewers, lets them override display_title /
  // issuing_agency / training_agency / quality_flag. Each row in the panel:
  //   <label>      <value-or-input>   [edit | clear]
  // Click the value to edit it (becomes an inline input/select). Enter or
  // blur saves; Escape cancels. Clear (×) only appears when overridden.
  // For anonymous viewers, surfaces the current curated state read-only.
  function renderCurationPanel(r) {
    var panel = el("div", { class: "cr-curation-panel" });
    panel.appendChild(el("h5", { class: "cr-curation-h" }, ["Curation"]));

    if (!state.sess) {
      panel.appendChild(el("p", { class: "cr-curation-note" }, [
        "Sign in via the toolbar to edit display title, issuing agency, training agency, or quality flag."
      ]));
      // Still surface any existing overrides as read-only badges so anonymous
      // viewers see what curators have decided.
      if (r.utitle_overridden_at || r.issuer_overridden_at ||
          r.trainer_overridden_at || r.qflag_overridden_at) {
        var ul = el("ul", { class: "cr-curation-readonly" });
        if (r.utitle_overridden_at) {
          ul.appendChild(el("li", null, [
            "Display title: ", el("b", null, [r.display_title]),
            " (curated · originally: " + r.unified_title + ")"
          ]));
        }
        if (r.issuer_overridden_at) {
          ul.appendChild(el("li", null, [
            "Issuing agency: ", el("b", null, [r.primary_issuer || "(cleared)"]),
            " (curated · originally: " + (r.original_primary_issuer || "(none)") + ")"
          ]));
        }
        if (r.trainer_overridden_at) {
          ul.appendChild(el("li", null, [
            "Training agency: ", el("b", null, [r.primary_trainer || "(cleared)"]),
            " (curated · originally: " + (r.original_primary_trainer || "(none)") + ")"
          ]));
        }
        if (r.qflag_overridden_at) {
          ul.appendChild(el("li", null, [
            "Quality flag: ", el("b", null, [r.flag_label || "(cleared)"]),
            " (curated · originally: " + (r.original_flag_label || "(none)") + ")"
          ]));
        }
        panel.appendChild(ul);
      }
      return panel;
    }

    // Signed-in — render 4 editable fields.
    var tbl = el("table", { class: "cr-curation-tbl" });
    var tbody = el("tbody");

    tbody.appendChild(renderCurationFieldRow({
      r: r,
      label: "Display title",
      field: FIELD_UTITLE_OVERRIDE,
      kind: "text",
      currentValue: r.display_title || r.unified_title,
      originalValue: r.unified_title,
      isOverridden: !!r.utitle_overridden_at,
      overriddenBy: r.utitle_overridden_by,
      overriddenAt: r.utitle_overridden_at,
      hint: "Rename is DISPLAY-ONLY. KB key + articulation joins stay on the original. A future Cred-Ref PR-5 will promote overrides into real KB renames with an alias map.",
    }));

    tbody.appendChild(renderCurationFieldRow({
      r: r,
      label: "Issuing agency",
      field: FIELD_ISSUER_OVERRIDE,
      kind: "text",
      datalistId: "cr-issuer-list",   // re-use the existing toolbar datalist
      currentValue: r.primary_issuer || "",
      originalValue: r.original_primary_issuer || r.primary_issuer || "",
      isOverridden: !!r.issuer_overridden_at,
      overriddenBy: r.issuer_overridden_by,
      overriddenAt: r.issuer_overridden_at,
      hint: "Override the inferred issuer. Save \"\" (empty) to mark a credential as having no formal issuer (local exhibit, portfolio).",
    }));

    tbody.appendChild(renderCurationFieldRow({
      r: r,
      label: "Training agency",
      field: FIELD_TRAINER_OVERRIDE,
      kind: "text",
      currentValue: r.primary_trainer || "",
      originalValue: r.original_primary_trainer || r.primary_trainer || "",
      isOverridden: !!r.trainer_overridden_at,
      overriddenBy: r.trainer_overridden_by,
      overriddenAt: r.trainer_overridden_at,
      hint: "Override the inferred trainer (when distinct from the issuer).",
    }));

    tbody.appendChild(renderCurationFieldRow({
      r: r,
      label: "Quality flag",
      field: FIELD_QFLAG_OVERRIDE,
      kind: "select",
      options: QFLAG_OPTIONS,
      currentValue: r.flag_label || "",
      originalValue: r.original_flag_label || r.flag_label || "",
      isOverridden: !!r.qflag_overridden_at,
      overriddenBy: r.qflag_overridden_by,
      overriddenAt: r.qflag_overridden_at,
      hint: "Set a quality flag (e.g. suspect_course_as_exhibit) or clear an inferred one. Used by the Credential Reference audit to triage data-entry artifacts.",
    }));

    tbl.appendChild(tbody);
    panel.appendChild(tbl);
    return panel;
  }

  // Renders one row of the curation table. Each row goes through three states:
  //   1. display: show the value as text + an "edit" button
  //   2. edit: show an input/select + Save/Cancel buttons
  //   3. saving: show a spinner placeholder
  // Per-row state lives in state.curationEditing[r.unified_title][field].
  function renderCurationFieldRow(opts) {
    var r = opts.r;
    var rec = state.curationEditing[r.unified_title] || {};
    var mode = rec[opts.field] || "display";  // "display" | "edit" | "saving"

    var tr = el("tr", { class: "cr-curation-row" + (opts.isOverridden ? " cr-curation-overridden" : "") });
    tr.appendChild(el("th", { class: "cr-curation-label" }, [
      opts.label, opts.isOverridden ? el("span", { class: "cr-override-marker",
        title: "Curated"
      }, [" ✎"]) : ""
    ]));

    var valTd = el("td", { class: "cr-curation-value" });

    if (mode === "saving") {
      valTd.appendChild(el("span", { class: "cr-curation-saving" }, ["saving…"]));
    } else if (mode === "edit") {
      var input;
      if (opts.kind === "select") {
        input = el("select", { class: "cr-curation-input" });
        opts.options.forEach(function (v) {
          var o = el("option", { value: v }, [v === "" ? "(none)" : v]);
          if (v === (opts.currentValue || "")) o.selected = true;
          input.appendChild(o);
        });
      } else {
        input = el("input", {
          class: "cr-curation-input",
          type: "text",
          value: opts.currentValue || "",
          autocomplete: "off"
        });
        if (opts.datalistId) input.setAttribute("list", opts.datalistId);
      }
      valTd.appendChild(input);

      var saveBtn = el("button", {
        type: "button", class: "cr-curation-save"
      }, ["Save"]);
      var cancelBtn = el("button", {
        type: "button", class: "cr-curation-cancel"
      }, ["Cancel"]);
      valTd.appendChild(saveBtn);
      valTd.appendChild(cancelBtn);

      var doSave = function () {
        var newVal = input.value;
        // No-op guard — original value, no override existed → nothing to save.
        if (!opts.isOverridden && newVal === opts.originalValue) {
          rec[opts.field] = "display";
          state.curationEditing[r.unified_title] = rec;
          render();
          return;
        }
        rec[opts.field] = "saving";
        state.curationEditing[r.unified_title] = rec;
        render();
        // If new value equals the original AND we have an existing override,
        // treat Save-as-original as a Clear — DELETE the override row.
        var op = (opts.isOverridden && newVal === opts.originalValue)
          ? clearOverride(r.unified_title, opts.field, state.sess)
          : saveOverride(r.unified_title, opts.field, newVal, state.sess);
        op.then(function (resp) {
          if (!resp || !resp.ok) throw new Error("HTTP " + (resp && resp.status));
          // Update overlay + row state locally so the UI is immediately consistent.
          var ov = state.overlay[r.unified_title] || {};
          if (opts.isOverridden && newVal === opts.originalValue) {
            // Clear path
            applyOverrideClear(r, opts.field);
            delete ov[overlayKeyFor(opts.field)];
            delete ov[overlayMetaKeyFor(opts.field, "by")];
            delete ov[overlayMetaKeyFor(opts.field, "at")];
          } else {
            applyOverrideLocally(r, opts.field, newVal);
            ov[overlayKeyFor(opts.field)] = newVal;
            ov[overlayMetaKeyFor(opts.field, "by")] = state.sess.email;
            ov[overlayMetaKeyFor(opts.field, "at")] = new Date().toISOString();
          }
          state.overlay[r.unified_title] = ov;
          rec[opts.field] = "display";
          state.curationEditing[r.unified_title] = rec;
          render();
        }).catch(function (e) {
          alert("Save failed: " + (e && e.message ? e.message : e));
          rec[opts.field] = "edit";
          state.curationEditing[r.unified_title] = rec;
          render();
        });
      };
      var doCancel = function () {
        rec[opts.field] = "display";
        state.curationEditing[r.unified_title] = rec;
        render();
      };

      saveBtn.onclick = doSave;
      cancelBtn.onclick = doCancel;
      input.onkeydown = function (e) {
        if (e.key === "Enter") { e.preventDefault(); doSave(); }
        else if (e.key === "Escape") { e.preventDefault(); doCancel(); }
      };
      // Auto-focus the input when entering edit mode.
      setTimeout(function () { input.focus(); if (input.select) input.select(); }, 0);
    } else {
      // display mode
      var span = el("span", { class: "cr-curation-display" }, [
        opts.currentValue
          ? document.createTextNode(opts.currentValue)
          : el("span", { class: "cr-null" }, ["(none)"])
      ]);
      valTd.appendChild(span);

      var editBtn = el("button", {
        type: "button", class: "cr-curation-edit",
        title: "Edit · " + (opts.hint || "")
      }, ["edit"]);
      editBtn.onclick = function () {
        rec[opts.field] = "edit";
        state.curationEditing[r.unified_title] = rec;
        render();
      };
      valTd.appendChild(editBtn);

      if (opts.isOverridden) {
        var clearBtn = el("button", {
          type: "button", class: "cr-curation-clear",
          title: "Clear override — restore original: \"" + (opts.originalValue || "(none)") + "\""
        }, ["× clear"]);
        clearBtn.onclick = function () {
          if (!confirm("Clear this override and restore the original value (\""
                       + (opts.originalValue || "(none)") + "\")?")) return;
          rec[opts.field] = "saving";
          state.curationEditing[r.unified_title] = rec;
          render();
          clearOverride(r.unified_title, opts.field, state.sess)
            .then(function (resp) {
              if (!resp || !resp.ok) throw new Error("HTTP " + (resp && resp.status));
              applyOverrideClear(r, opts.field);
              var ov = state.overlay[r.unified_title] || {};
              delete ov[overlayKeyFor(opts.field)];
              delete ov[overlayMetaKeyFor(opts.field, "by")];
              delete ov[overlayMetaKeyFor(opts.field, "at")];
              state.overlay[r.unified_title] = ov;
              rec[opts.field] = "display";
              state.curationEditing[r.unified_title] = rec;
              render();
            }).catch(function (e) {
              alert("Clear failed: " + (e && e.message ? e.message : e));
              rec[opts.field] = "display";
              state.curationEditing[r.unified_title] = rec;
              render();
            });
        };
        valTd.appendChild(clearBtn);
      }
    }

    if (opts.isOverridden && opts.overriddenBy) {
      valTd.appendChild(el("div", { class: "cr-curation-meta" }, [
        "curated by " + opts.overriddenBy.split("@")[0]
          + (opts.overriddenAt ? " on " + opts.overriddenAt.slice(0, 10) : "")
          + " · originally: \"" + (opts.originalValue || "(none)") + "\""
      ]));
    } else if (opts.hint) {
      valTd.appendChild(el("div", { class: "cr-curation-hint" }, [opts.hint]));
    }

    tr.appendChild(valTd);
    return tr;
  }

  // Helpers — applyOverlay() walks all overlay rows at fetch time.
  // applyOverrideLocally / applyOverrideClear apply ONE field for ONE row,
  // mirroring applyOverlay's per-field logic so live edits don't require a
  // full overlay re-fetch.
  function overlayKeyFor(field) {
    if (field === FIELD_UTITLE_OVERRIDE)  return "utitle_override";
    if (field === FIELD_ISSUER_OVERRIDE)  return "issuer_override";
    if (field === FIELD_TRAINER_OVERRIDE) return "trainer_override";
    if (field === FIELD_QFLAG_OVERRIDE)   return "qflag_override";
    return null;
  }
  function overlayMetaKeyFor(field, suffix) {
    var prefix = overlayKeyFor(field).replace("_override", "");
    return prefix + "_overridden_" + suffix;
  }
  function applyOverrideLocally(r, field, value) {
    var nowIso = new Date().toISOString();
    var email  = state.sess.email;
    if (field === FIELD_UTITLE_OVERRIDE) {
      r.display_title = value;
      r.utitle_overridden_by = email;
      r.utitle_overridden_at = nowIso;
    } else if (field === FIELD_ISSUER_OVERRIDE) {
      if (r.original_primary_issuer === undefined) r.original_primary_issuer = r.primary_issuer;
      r.primary_issuer = value || null;
      r.issuer_overridden_by = email;
      r.issuer_overridden_at = nowIso;
    } else if (field === FIELD_TRAINER_OVERRIDE) {
      if (r.original_primary_trainer === undefined) r.original_primary_trainer = r.primary_trainer;
      r.primary_trainer = value || null;
      r.trainer_overridden_by = email;
      r.trainer_overridden_at = nowIso;
    } else if (field === FIELD_QFLAG_OVERRIDE) {
      if (r.original_flag_label === undefined) r.original_flag_label = r.flag_label;
      r.flag_label = value || null;
      r.qflag_overridden_by = email;
      r.qflag_overridden_at = nowIso;
    }
  }
  function applyOverrideClear(r, field) {
    if (field === FIELD_UTITLE_OVERRIDE) {
      r.display_title = r.original_display_title || r.unified_title;
      delete r.utitle_overridden_by;
      delete r.utitle_overridden_at;
    } else if (field === FIELD_ISSUER_OVERRIDE) {
      if (r.original_primary_issuer !== undefined) {
        r.primary_issuer = r.original_primary_issuer;
        delete r.original_primary_issuer;
      }
      delete r.issuer_overridden_by;
      delete r.issuer_overridden_at;
    } else if (field === FIELD_TRAINER_OVERRIDE) {
      if (r.original_primary_trainer !== undefined) {
        r.primary_trainer = r.original_primary_trainer;
        delete r.original_primary_trainer;
      }
      delete r.trainer_overridden_by;
      delete r.trainer_overridden_at;
    } else if (field === FIELD_QFLAG_OVERRIDE) {
      if (r.original_flag_label !== undefined) {
        r.flag_label = r.original_flag_label;
        delete r.original_flag_label;
      }
      delete r.qflag_overridden_by;
      delete r.qflag_overridden_at;
    }
  }

  function renderExpandedRow(r, colSpan) {
    // Lets a signed-in reviewer edit 4 fields: display title, issuing agency,
    // training agency, quality flag. Display-override pattern: the original
    // KB key (r.unified_title) is immutable; overrides change the rendered
    // label only. Future PR-5 will promote overrides into real KB renames.
    // Scaffolding (tr > td[colspan] > div.cr-expanded-body). Without these three
    // declarations the very first append below threw a ReferenceError, which
    // aborted the table render and left the tab blank on expand. Restored
    // 2026-05-30 (matches the .cr-expanded / .cr-expanded-body CSS).
    var tr = el("tr", { class: "cr-expanded" });
    var td = el("td", { colspan: String(colSpan) });
    var div = el("div", { class: "cr-expanded-body" });
    div.appendChild(renderCurationPanel(r));

    // ── Common-course identities articulating to this credential ──
    // Render a table per identity: identity badge on the left, local
    // college course rows on the right. CCN-ID / C-ID anchors first, then
    // M-ID / Cluster surrogates.
    if (r.articulations && r.articulations.length) {
      var n_lines = r.n_articulation_lines || 0;
      div.appendChild(el("h5", null, [
        "Common-course identities articulating to this credential "
        + "(" + r.articulations.length + " "
        + (r.articulations.length === 1 ? "identity" : "identities")
        + " · " + n_lines + " local-course line" + (n_lines === 1 ? "" : "s") + ")"
      ]));
      var tbl = el("table", { class: "cr-arts-table" });
      var thead = el("thead", null, [el("tr", null, [
        el("th", null, ["Common Course (CCR)"]),
        el("th", null, ["Local Course"]),
        el("th", null, ["Earning College(s)"]),
      ])]);
      tbl.appendChild(thead);
      var tbody2 = el("tbody");
      r.articulations.forEach(function (a) {
        var sysCls = "cr-sys-" + (a.sys || "mid").toLowerCase().replace(/[^a-z]/g, "");
        // First row of each identity carries the rowspan'd identity cell.
        var nLocal = Math.max(1, (a.local || []).length);
        var locals = a.local && a.local.length ? a.local : [{ subj: "", num: "", t: "", colleges: [] }];
        locals.forEach(function (lc, idx) {
          var row = el("tr", { class: "cr-art-row" + (idx === 0 ? " cr-art-first" : "") });
          if (idx === 0) {
            var idCell = el("td", { class: "cr-art-ident " + sysCls,
              rowspan: nLocal > 1 ? String(nLocal) : "1" });
            idCell.appendChild(el("span", { class: "cr-id-sys" }, [a.sys || "?"]));
            idCell.appendChild(document.createTextNode(" "));
            idCell.appendChild(el("code", { class: "cr-id-code" }, [a.cid || "—"]));
            if (a.title) {
              idCell.appendChild(el("div", { class: "cr-id-title" }, [a.title]));
            }
            var metaParts = [];
            if (a.disc) metaParts.push(a.disc);
            if (a.top)  metaParts.push("TOP " + a.top);
            if (metaParts.length) {
              idCell.appendChild(el("div", { class: "cr-id-meta" }, [metaParts.join(" · ")]));
            }
            row.appendChild(idCell);
          }
          var lcCell = el("td", { class: "cr-art-local" });
          if (lc.subj || lc.num || lc.t) {
            lcCell.appendChild(el("span", { class: "cr-lc-code" },
              [(lc.subj || "") + " " + (lc.num || "")]));
            if (lc.t) {
              lcCell.appendChild(document.createTextNode(" "));
              lcCell.appendChild(el("span", { class: "cr-lc-title" }, [lc.t]));
            }
          } else {
            lcCell.appendChild(el("span", { class: "cr-null" }, ["—"]));
          }
          row.appendChild(lcCell);
          var colCell = el("td", { class: "cr-art-colleges" },
            [(lc.colleges || []).join(", ") || "—"]);
          row.appendChild(colCell);
          tbody2.appendChild(row);
        });
      });
      tbl.appendChild(tbody2);
      div.appendChild(tbl);
    } else {
      div.appendChild(el("h5", null, ["No common-course articulations resolved"]));
      div.appendChild(el("p", { class: "cr-empty-note" }, [
        "This credential identity isn't tied to any common course in the COCI "
        + "articulation crosswalk. Could be a credential that articulates only "
        + "to local courses (no M-ID minted), or one outside the current MAP "
        + "exhibit-articulation dataset."
      ]));
    }

    // ── Raw MAP titles unified under this credential (legacy fallback only)
    // The baked payload doesn't carry the per-variant list; we just show the
    // count, since the audit + curation work at the unified-title level.
    if (r.raw_variants && r.raw_variants.length) {
      div.appendChild(el("h5", null, [
        "Raw MAP titles (" + r.raw_count + ")"
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
    }

    // ── Credential record(s) (issuer / trainer / confidence) ──
    if (r.credentials && r.credentials.length) {
      div.appendChild(el("h5", null, [
        "Credential record" + (r.credentials.length > 1 ? "s" : "")
        + " (issuer / trainer attribution)"
      ]));
      r.credentials.forEach(function (c) {
        var d = el("div", { class: "cr-cred-record" });
        d.appendChild(el("div", null, [
          "Issuer: " + (c.issuing_agency || "(none)")
          + " · confidence " + (c.confidence_issuer || 0).toFixed(2)
        ]));
        if (c.training_agency) {
          d.appendChild(el("div", null, [
            "Trainer: " + c.training_agency
            + " · confidence " + (c.confidence_trainer || 0).toFixed(2)
          ]));
        }
        if (c._notes) {
          d.appendChild(el("div", { class: "cr-cred-notes" }, [c._notes]));
        }
        div.appendChild(d);
      });
    } else if (r.primary_issuer || r.primary_trainer) {
      // Baked payload shape — surface what we have at the row level.
      div.appendChild(el("h5", null, ["Credential record"]));
      var d2 = el("div", { class: "cr-cred-record" });
      d2.appendChild(el("div", null, [
        "Issuer: " + (r.primary_issuer || "(none)")
        + " · confidence " + (r.conf_issuer || 0).toFixed(2)
      ]));
      if (r.primary_trainer) {
        d2.appendChild(el("div", null, ["Trainer: " + r.primary_trainer]));
      }
      div.appendChild(d2);
    }

    // ── Audit tag rollup ──
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

  // Quickstart-C hint consumer. Translates a routing hint into state writes,
  // then rebuilds the toolbar so the matching filter chrome reflects the hint.
  // Unknown keys / out-of-vocab values silently dropped.
  var QS_TAB = "credential-reference";
  var QS_AUDIT_TAGS = {
    low_confidence_title: 1, very_low_confidence_title: 1,
    low_confidence_issuer: 1, very_low_confidence_issuer: 1,
    low_confidence_trainer: 1, very_low_confidence_trainer: 1,
    agency_name_collision_signal: 1, suspect_course_as_exhibit: 1,
    blank_unified_title: 1, unclassified_in_map: 1, stale_kb_entry: 1,
  };
  var QS_BANDS = {
    "0.95-1.00": 1, "0.80-0.94": 1, "0.60-0.79": 1, "0.40-0.59": 1, "<0.40": 1,
  };
  function applyQsHint(hint) {
    if (!hint || typeof hint !== "object") return false;
    var any = false;
    if (typeof hint.audit_tag === "string" && QS_AUDIT_TAGS[hint.audit_tag]) {
      state.tagFilter = hint.audit_tag; any = true;
    }
    if (typeof hint.confidence_band === "string" && QS_BANDS[hint.confidence_band]) {
      state.bandFilter = hint.confidence_band; any = true;
    }
    if (typeof hint.issuer === "string" && hint.issuer) {
      // Accepted as-is (the issuer-input is free-form against the dataset);
      // if it isn't actually a known issuer the dataset reverts to "all" on
      // user edit. That's better than rejecting a near-match here.
      state.issuerFilter = hint.issuer; any = true;
    }
    if (hint.quality_flag_only === true) { state.flagOnly = true; any = true; }
    if (typeof hint.search === "string" && hint.search) {
      state.search = hint.search.toLowerCase(); any = true;
    }
    return any;
  }

  function init() {
    if (!document.getElementById("tab-credential-reference")) return;
    state.sess = getSession();
    // Apply any pending quickstart hint stashed before init (refresh case).
    if (window.CPL_QS) applyQsHint(window.CPL_QS.consume(QS_TAB));
    // Subscribe to runtime hints (already-mounted case — by far the
    // common path since this script runs at page load).
    window.addEventListener("cpl-qs-hint", function (e) {
      if (!e || !e.detail || e.detail.tab !== QS_TAB) return;
      if (applyQsHint(e.detail.hint)) { renderToolbar(); render(); }
    });

    // Prefer the baked payload (window.CPL_CREDENTIAL_REFERENCE from
    // credential_reference_data.js, generated by excel_to_dashboard.py).
    // Lean (~1.5 MB), pre-joined with the common-course identity layer +
    // audit-tag rollup. Falls back to runtime fetch of kb/*.json if the
    // baked file hasn't been generated yet — keeps local dev workflows
    // working without a full generator run.
    var baked = window.CPL_CREDENTIAL_REFERENCE;
    if (baked && Array.isArray(baked.unified_titles)) {
      fetchOverlay().then(function (overlay) {
        state.audit = null;  // baked payload carries pre-rolled audit_tags per row; no overlay needed
        state.rows = applyOverlay(
          baked.unified_titles.map(adaptBakedRow),
          overlay
        );
        state.overlay = overlay;
        state.bakedAt = baked._generated_at;
        state.topCategories = baked.top_categories || {};
        renderToolbar();
        render();
      });
      return;
    }

    // Fallback: runtime fetch of kb/*.json (slower; only used when the
    // baked file is absent — e.g. early local dev before first cron run).
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
