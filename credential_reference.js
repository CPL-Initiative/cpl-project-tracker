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

  // ── Unclassified-triage worklist ──────────────────────────────────────────
  // The raw MAP exhibit titles flagged `unclassified_in_map` by the exhibit
  // auditor (kb/exhibit_audit/latest.json) — they have NO entry in
  // kb/unified_titles.json yet, so they don't appear as credential rows above.
  // The worklist lets a signed-in reviewer assign each one an existing or new
  // unified_title (+ issuer), folding it into the credential layer. Separate
  // kb_curation namespace so assignments never collide with the per-credential
  // override rows. PR-1 (this) = overlay-only (Supabase + live display); the
  // JSON sync into unified_titles.json (+ daily cron) is PR-2.
  var UNCLASS_PREFIX = "_UNCLASSIFIED::";
  var FIELD_UNCLASS_TITLE  = "unified_title_assignment";
  var FIELD_UNCLASS_ISSUER = "issuing_agency_assignment";
  var AUDIT_URL = "kb/exhibit_audit/latest.json";

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

  // Cosmetic display label for the identity-system value: M-ID→MID, C-ID→CID,
  // CCN-ID→CCNID. Stored 'sys' values + CSS classes are unchanged; maps only at render.
  function idSysLabel(v) { return v === "M-ID" ? "MID" : v === "C-ID" ? "CID" : v === "CCN-ID" ? "CCNID" : (v || ""); }
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

  // ─── Token refresh before every write (2026-07-07) ───────────────────────
  // getSession() deliberately keeps an EXPIRED session alive whenever a
  // refresh_token exists (so the tab can self-heal without another magic-link
  // email) — but this file never renewed the access token, so ~1h after
  // sign-in every kb_curation write started 401ing while the UI still showed
  // signed-in: Save buttons died into an endless "retry", the worklist
  // "clear" link silently no-opped, and the tab read as "stopped working"
  // (2026-07-07, Sam's triage session). Same latent bug raci.js fixed in
  // Session 77 — see docs/kb-notes/methodology-refresh-token-before-write.md.
  // Port of that trio, plus SINGLE-FLIGHT: concurrent writes (the worklist
  // saves title+issuer in a Promise.all) must share one refresh call, because
  // GoTrue rotates refresh tokens and a second parallel exchange with the
  // same token can kill the whole session.
  function refreshToken(rt) {
    return fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("refresh " + r.status)); });
  }
  var _refreshing = null;
  function ensureFresh() {
    // Start from sessionStorage (not the init-time snapshot) so a token a
    // sibling module (CCR/RACI) rotated is picked up instead of re-spending
    // a consumed refresh token.
    var s = getSession() || state.sess;
    if (!s) return Promise.resolve(null);
    state.sess = s;
    if (!(s.exp && s.exp <= Date.now() + 60000 && s.refresh_token)) {
      return Promise.resolve(s);
    }
    if (!_refreshing) {
      _refreshing = refreshToken(s.refresh_token).then(function (tok) {
        _refreshing = null;
        if (!isValidJwt(tok.access_token)) throw new Error("bad refresh");
        var ns = {
          access_token: tok.access_token,
          refresh_token: tok.refresh_token || s.refresh_token,
          email: s.email,
          exp: Date.now() + (parseInt(tok.expires_in || "3600", 10) * 1000)
        };
        state.sess = ns;
        try { sessionStorage.setItem("cpl_sb", JSON.stringify(ns)); } catch (e) {}
        renderAuth();
        return ns;
      }).catch(function () {
        _refreshing = null;
        state.sess = null;
        try { sessionStorage.removeItem("cpl_sb"); } catch (e) {}
        renderAuth();
        return null;
      });
    }
    return _refreshing;
  }
  // A 401/403 on a write whose session ensureFresh() just vouched for means
  // the session is dead or unauthorized — drop it so the auth widget flips to
  // "Sign in" instead of leaving dead "retry" buttons (the #598 lesson).
  // Deliberately does NOT re-render the table/worklist: unsaved input typed in
  // other worklist rows must survive.
  function dropDeadSession(resp) {
    if (resp && (resp.status === 401 || resp.status === 403)) {
      state.sess = null;
      try { sessionStorage.removeItem("cpl_sb"); } catch (e) {}
      renderAuth();
    }
    return resp;
  }
  // Every write funnels through here: fresh session → do the write → drop the
  // session on an auth failure. Rejects with "signed out" when no session can
  // be produced (callers' existing .catch paths show their retry affordance).
  function withFreshSession(work) {
    return ensureFresh().then(function (s) {
      if (!s) return Promise.reject(new Error("signed out"));
      return work(s).then(dropDeadSession);
    });
  }

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

  function saveInitiated(unifiedTitle) {
    return withFreshSession(function (sess) {
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + sess.access_token,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({
          course_id: KEY_PREFIX + unifiedTitle,
          field: FIELD_MARKER,
          value: "1",
          reviewer_email: sess.email
        })
      });
    });
  }

  // PR-4 — generic save for any per-field override. Uses the same
  // _CREDENTIAL_REVIEW::<unified_title> namespace with `field` discriminating.
  // `value` is a string; "" is meaningful (it overrides the original to empty —
  // useful for clearing an inferred issuer that's wrong). Use clearOverride()
  // to remove an override entirely (DELETE the row so the original shows again).
  function saveOverride(unifiedTitle, field, value) {
    return withFreshSession(function (sess) {
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + sess.access_token,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({
          course_id: KEY_PREFIX + unifiedTitle,
          field: field,
          value: value,
          reviewer_email: sess.email
        })
      });
    });
  }
  function clearOverride(unifiedTitle, field) {
    var url = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?course_id=eq." + encodeURIComponent(KEY_PREFIX + unifiedTitle)
      + "&field=eq." + encodeURIComponent(field);
    return withFreshSession(function (sess) {
      return fetch(url, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + sess.access_token
        }
      });
    });
  }

  // ─── Unclassified-triage worklist data layer ──────────────────────────────
  // The unclassified raw titles are baked into the committed audit snapshot, so
  // we lazily fetch + filter it (no producer/cron change for PR-1). Each card
  // with no unified_title AND the `unclassified_in_map` tag is a backlog item.
  function fetchUnclassified() {
    return fetch(AUDIT_URL, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var cards = (d && d.title_cards) || [];
        return cards.filter(function (c) {
          return c && !c.unified_title
            && (c.tags || []).indexOf("unclassified_in_map") >= 0;
        }).map(function (c) {
          return { raw_title: c.raw_title, band: c.band || "", quality_flag: c.quality_flag || null };
        }).sort(function (a, b) { return (a.raw_title || "").localeCompare(b.raw_title || ""); });
      })
      .catch(function () { return []; });
  }
  // Assignments made so far (own namespace). Returns raw_title → {title, issuer, by, at}.
  function fetchUnclassOverlay() {
    var url = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?select=course_id,field,value,reviewer_email,reviewed_at"
      + "&course_id=like." + encodeURIComponent(UNCLASS_PREFIX) + "%25";
    return fetch(url, { headers: { "apikey": SUPABASE_ANON } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        var m = {};
        arr.forEach(function (row) {
          var raw = (row.course_id || "").slice(UNCLASS_PREFIX.length);
          if (!raw) return;
          var rec = m[raw] = m[raw] || {};
          if (row.field === FIELD_UNCLASS_TITLE) {
            rec.title = row.value || "";
            rec.by = row.reviewer_email; rec.at = row.reviewed_at;
          } else if (row.field === FIELD_UNCLASS_ISSUER) {
            rec.issuer = row.value || "";
          }
        });
        return m;
      })
      .catch(function () { return {}; });
  }
  function saveUnclass(raw, field, value) {
    return withFreshSession(function (sess) {
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + sess.access_token,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({
          course_id: UNCLASS_PREFIX + raw, field: field, value: value,
          reviewer_email: sess.email
        })
      });
    });
  }
  function clearUnclass(raw) {
    // Remove BOTH the title + issuer rows for this raw title (un-assign).
    var base = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?course_id=eq." + encodeURIComponent(UNCLASS_PREFIX + raw);
    return withFreshSession(function (sess) {
      return fetch(base, { method: "DELETE", headers: {
        "apikey": SUPABASE_ANON, "Authorization": "Bearer " + sess.access_token
      } });
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
      // Session 29 CER enrichment — scope/CPL chips + statewide/generated rec +
      // potential-adopter badges (rendered by renderScopeAndBadges).
      has_local: !!b.has_local,
      cpl_types: b.cpl_types || [],
      ccc_rec: b.ccc_rec || "",
      gen_rec: b.gen_rec || "",
      potential_colleges: b.potential_colleges || [],
      articulations: b.articulations || [],
      n_articulation_lines: b.n_articulation_lines || 0,
      // System-level GE-Area credit for AP/IB/CLEP exams — null otherwise.
      ge_credit: b.ge_credit || null,
      // Student-impact roll-up (path 1): total CPL students served across
      // articulating colleges. null + served_suppressed when 1-4 (masked "<5");
      // null + !served_suppressed when 0 / no data. Populates on the daily cron.
      students_served: (typeof b.students_served === "number") ? b.students_served : null,
      served_suppressed: !!b.served_suppressed,
      // Eligible-credit FUNNEL (units) from the Exhibit CRs Catalog (2026-06-09):
      // per-credential statewide credit volume — eligible / transcribed / applied /
      // in-review. Credit UNITS (not headcounts), so no <5 suppression. null = no
      // catalog match yet ("—"); 0 = matched but none eligible. eligible −
      // transcribed = "credit waiting to be unlocked". Populates on the daily cron.
      eligible_credits: (typeof b.eligible_credits === "number") ? b.eligible_credits : null,
      transcribed_credits: (typeof b.transcribed_credits === "number") ? b.transcribed_credits : null,
      applied_credits: (typeof b.applied_credits === "number") ? b.applied_credits : null,
      in_review_credits: (typeof b.in_review_credits === "number") ? b.in_review_credits : null,
      // Raw college-entered MAP exhibit-title variants collapsed under this
      // unified title. Baked compactly as {r:raw_title, c:confidence, q:flag}
      // (added 2026-06-04, item 6) so the expanded row can list them — a
      // raw_count of "1" means one college title maps here, which may differ
      // from the AI-generated unified title. Mapped to the {raw_title,…} shape
      // the renderer + search share with the runtime-fetch path.
      raw_variants: Array.isArray(b.raw_variants)
        ? b.raw_variants.map(function (v) {
            return { raw_title: v.r, confidence: v.c || 0,
                     quality_flag: v.q || null, _notes: null };
          })
        : null,
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
      // raw_variants is null on baked rows until the payload carries them, so
      // guard with `|| []` — without it, searching a non-matching baked row
      // throws (null.some), aborting the whole render and freezing search AND
      // the expand wedges (the root cause of the "search/expand stopped working"
      // reports). Also matches the curator-facing display label.
      var hit = row.unified_title.toLowerCase().indexOf(q) >= 0
        || (row.display_title && row.display_title.toLowerCase().indexOf(q) >= 0)
        || (row.primary_issuer && row.primary_issuer.toLowerCase().indexOf(q) >= 0)
        || (row.raw_variants || []).some(function (v) {
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
      // Students-served sort: known count (≥5) → its value; suppressed (1-4) →
      // 0.5 (above no-data, below any real count); none → 0. So "sort desc"
      // floats the highest-impact credentials to the top for curation triage.
      students:        function (r) {
        return (typeof r.students_served === "number") ? r.students_served
             : (r.served_suppressed ? 0.5 : 0);
      },
      // Eligible-credits sort: credit-unit value, or 0 when no catalog data —
      // sort desc floats the credentials with the most eligible (unlockable)
      // credit to the top.
      eligible:        function (r) {
        return (typeof r.eligible_credits === "number") ? r.eligible_credits : 0;
      },
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
    curateOpen: {},  // unified_title → bool (per-row Curate panel open; default collapsed)
    worklistOpen: false,  // unclassified-triage worklist replacing the main table
    unclassified: null,   // lazy: [{raw_title, band, …}] from the audit
    unclassLoading: false,
    unclassAssign: {},    // raw_title → {title, issuer, by, at} (Supabase overlay + live edits)
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
    discGeAreas: {},     // MQ discipline → [GE divisions] (GE-Area coherence check)
    // PR-4: per-row, per-field edit-mode tracker for the curation panel.
    // shape: { "unified_title": { "field_name": "display" | "edit" | "saving" } }
    curationEditing: {},
    // CareerOneStop authority matches (kb/cos_matches.json, lazy + optional):
    // unified_title → {name, org, tier, in_demand, …}. null until the file
    // exists + loads; renders the ✓/≈ COS chips + the summary attribution.
    cosMatches: null,
    cosAttribution: null,
  };

  // Group key for a row given the current state.groupBy mode (single-key modes).
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
  // Group keys for a row — an ARRAY so a row can belong to MULTIPLE buckets.
  // GE-Area grouping (the faculty/student grain view) is multi-bucket: an exam
  // that satisfies "Social/Behavioral Sciences or Arts and Humanities" appears
  // under BOTH areas, since either qualifies. N/A exams → "NA"; non-exam
  // credentials → "~~none" (the default-collapsed catch-all). Single-key modes
  // (top/disc) just wrap groupKeyOf in a one-element array.
  function groupKeysOf(r) {
    if (state.groupBy === "gearea") {
      var g = r.ge_credit;
      if (!g) return ["~~none"];
      if (g.na || !(g.areas && g.areas.length)) return ["NA"];
      return g.areas.slice();
    }
    return [groupKeyOf(r)];
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
    if (state.groupBy === "gearea") {
      if (key === "~~none") return "— Not a standardized exam (no statewide GE credit)";
      if (key === "NA") return "N/A — elective credit only (no GE Area)";
      return key;  // the GE-Area name itself
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
      title: "Group rows under collapsible headers: TOP category, MQ discipline, "
           + "or GE Area (the statewide AP/IB/CLEP exam-credit rollup)." });
    [
      ["none",   "Group: none"],
      ["gearea", "Group: GE Area"],
      ["top",    "Group: TOP category"],
      ["disc",   "Group: Discipline"],
    ].forEach(function (opt) {
      var o = el("option", { value: opt[0] }, [opt[1]]);
      if (opt[0] === state.groupBy) o.selected = true;
      groupSel.appendChild(o);
    });
    groupSel.onchange = function () {
      state.groupBy = this.value;
      // Don't carry collapsed-state across grouping modes — the keys are
      // namespaced by mode (e.g. "top:12" vs "disc:Health") to avoid clashes.
      // Reset to "all expanded", except: in GE-Area mode the big "not a
      // standardized exam" catch-all starts collapsed so the exam buckets lead.
      state.collapsedGroups = (this.value === "gearea") ? { "gearea:~~none": true } : {};
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

    // Unclassified-triage worklist toggle — opens a worklist over the raw MAP
    // exhibit titles the auditor flagged `unclassified_in_map` (no credential
    // identity yet). Count fills in after the lazy fetch and shows OPEN items
    // (unassigned), not the raw queue size — an all-assigned queue reads
    // "awaiting fold", not "5 still to do" (the 2026-07-07 stuck-feeling fix).
    var wlLabel = "⚠ Triage unclassified";
    if (state.unclassified) {
      var wlOpen = state.unclassified.filter(function (it) {
        var a = state.unclassAssign[it.raw_title];
        return !(a && a.title);
      }).length;
      var wlAssigned = state.unclassified.length - wlOpen;
      wlLabel = wlOpen ? ("⚠ Triage unclassified (" + wlOpen + ")")
        : wlAssigned ? ("✓ Triage unclassified (" + wlAssigned + " awaiting fold)")
        : "✓ Triage unclassified (0)";
    }
    var triageBtn = el("button", { type: "button", class: "cr-triage-btn",
      title: "Review raw MAP exhibit titles with no credential identity yet and assign each a unified title. "
           + "Saved assignments fold into the credential layer on the daily refresh." },
      [wlLabel]);
    triageBtn.onclick = openWorklist;
    tb.appendChild(triageBtn);

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
      saveInitiated(r.unified_title)
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
    // Required data-use attribution whenever CareerOneStop-derived matches
    // render (the ✓/≈ COS chips) — see the COS terms in
    // docs/kb-notes/reference-authority-anchored-credential-naming.md.
    if (state.cosMatches) {
      var nCos = Object.keys(state.cosMatches).length;
      sum.appendChild(el("span", { class: "cr-cos-attrib" },
        ["✓/≈ COS badges (" + nCos + " titles): "
         + (state.cosAttribution || "Source: CareerOneStop, sponsored by the "
            + "U.S. Department of Labor ETA; data maintained by Minnesota DEED.")]));
    }
  }

  function render() {
    ensureCerScopeCss();  // scope/CPL chip styles now also used at the title level (collapsed rows)
    if (state.worklistOpen) { renderWorklist(); return; }
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
        title: "Number of distinct college-entered MAP exhibit titles collapsed under this unified title. Expand the row to see them — \"1\" means a single college title maps here, which may differ from the generated unified title." },
      { key: "students",        label: "Eligible students",
        title: "Students eligible for CPL credit recommendations for this credential, statewide (MAP Exhibit CRs Catalog, TotalStudentsForCR) — a volume signal for prioritizing curation, not a distinct headcount. Sort to surface the highest-impact credentials. Counts below 5 are masked as \"<5\" for privacy; \"—\" = no catalog match yet. Populates on the daily MAP pull." },
      { key: "eligible",        label: "Eligible (units)",
        title: "Statewide CPL credit-UNITS eligible for this credential, from MAP's Exhibit CRs Catalog (the per-exhibit credit funnel, JST-aggregated for military). Credit waiting to be unlocked = eligible − transcribed (shown on hover). Credit units, not a headcount. \"—\" = no catalog data yet; populates on the daily MAP pull." },
      { key: "disc_modal",      label: "Discipline",
        title: "Predominant MQ discipline across this credential's articulated common courses." },
      { key: "primary_issuer",  label: "Issuing Agency" },
      { key: "conf_modal",      label: "Confidence",
        title: "Modal title confidence / issuer confidence across the raw variants (title · issuer)." },
      { key: "audit_tag_total", label: "Audit",
        title: "Sum of audit tag firings across the raw variants. Hover a chip for details." },
      { key: "flag_label",      label: "Quality flag" },
      { key: "reviewed",        label: "Initiated",
        title: "Curator-initiated state + the Mark-initiated / Curate actions." },
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
      // Grouped render — bucket the filtered rows by the active group key(s)
      // (already filtered + sorted) and emit a collapsible header before each
      // group's rows. groupKeysOf returns an ARRAY, so GE-Area mode multi-buckets
      // (a row can appear under each area it satisfies).
      var groups = {};
      var groupOrder = [];
      filtered.forEach(function (r) {
        groupKeysOf(r).forEach(function (k) {
          if (!(k in groups)) { groups[k] = []; groupOrder.push(k); }
          groups[k].push(r);
        });
      });
      // Sort group order: by label. GE-Area mode floats the real areas first,
      // then the N/A bucket, then the non-exam catch-all last; other modes put
      // the empty/no-X ("~~") bucket last.
      groupOrder.sort(function (a, b) {
        if (state.groupBy === "gearea") {
          var rank = function (k) { return k === "~~none" ? 3 : (k === "NA" ? 2 : 1); };
          if (rank(a) !== rank(b)) return rank(a) - rank(b);
          return groupLabelOf(a).localeCompare(groupLabelOf(b));
        }
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
    // Scope + CPL chips at the title level (the Scope column was folded into
    // these — same chips the curator liked from the expanded enrichment block).
    var tchips = crTitleChips(r);
    if (tchips) titleTd.appendChild(tchips);
    tr.appendChild(titleTd);

    tr.appendChild(el("td", null, [String(r.raw_count)]));

    // Students-served column (path 1) — the curation-prioritization signal.
    // Exact count ≥5; "<5" masked (small-cell suppression); "—" no data.
    var servedTd = el("td", { class: "cr-served-cell" });
    if (typeof r.students_served === "number") {
      servedTd.appendChild(el("span", { class: "cr-served-n",
        title: "Total CPL students served across articulating colleges." },
        [r.students_served.toLocaleString()]));
    } else if (r.served_suppressed) {
      servedTd.appendChild(el("span", { class: "cr-served-sup",
        title: "Fewer than 5 students — exact count withheld (small-cell privacy suppression)." },
        ["<5"]));
    } else {
      servedTd.appendChild(el("span", { class: "cr-null" }, ["—"]));
    }
    tr.appendChild(servedTd);

    // Eligible-credits column — statewide CPL credit UNITS eligible (Exhibit CRs
    // Catalog). Credit units, not a headcount → no suppression. Hover shows the
    // funnel + "credit waiting to be unlocked" (eligible − transcribed). "—" = no
    // catalog data yet.
    var eligTd = el("td", { class: "cr-served-cell" });
    if (typeof r.eligible_credits === "number") {
      var _waiting = (typeof r.transcribed_credits === "number")
        ? Math.max(0, r.eligible_credits - r.transcribed_credits) : null;
      var _tip = "Statewide eligible CPL credit units."
        + (typeof r.transcribed_credits === "number" ? " Transcribed: " + r.transcribed_credits.toLocaleString() + " units." : "")
        + (typeof r.applied_credits === "number" ? " Applied: " + r.applied_credits.toLocaleString() + "." : "")
        + (typeof r.in_review_credits === "number" ? " In review: " + r.in_review_credits.toLocaleString() + "." : "")
        + (_waiting != null ? " Credit waiting to be unlocked (eligible − transcribed): " + _waiting.toLocaleString() + " units." : "");
      eligTd.appendChild(el("span", { class: "cr-served-n", title: _tip },
        [r.eligible_credits.toLocaleString()]));
    } else {
      eligTd.appendChild(el("span", { class: "cr-null" }, ["—"]));
    }
    tr.appendChild(eligTd);

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

    // Merged Confidence cell — title / issuer (2026-06-03 economy: was two
    // columns). Band color keys off the title confidence (the primary signal);
    // the issuer figure rides muted alongside.
    var confTd = el("td", { class: "cr-conf-cell " + _bandCls(r.conf_modal),
      title: "Title confidence " + r.conf_modal.toFixed(2)
        + " · issuer confidence " + (r.conf_issuer ? r.conf_issuer.toFixed(2) : "—") });
    confTd.appendChild(el("span", { class: "cr-conf-title" }, [r.conf_modal.toFixed(2)]));
    confTd.appendChild(el("span", { class: "cr-conf-sep" }, [" / "]));
    confTd.appendChild(el("span", { class: "cr-conf-issuer" },
      [r.conf_issuer ? r.conf_issuer.toFixed(2) : "—"]));
    tr.appendChild(confTd);

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

    // Merged "Initiated" cell (2026-06-03 economy: the standalone Reviewed
    // column was folded in here). Shows the ✓ who · date stamp once initiated
    // (visible to everyone), else the ✎ Curate + Mark-initiated actions for
    // signed-in reviewers. The Curate toggle was moved up from the expanded body
    // 2026-06-03 so a reviewer can jump straight into editing without the panel
    // eating a row of vertical space on every expand.
    var actionTd = el("td", { class: "cr-action-cell" });
    if (state.sess) {
      var curOpenNow = !!state.curateOpen[r.unified_title];
      var curateBtn = el("button", {
        type: "button",
        class: "cr-curate-toggle cr-action-curate" + (curOpenNow ? " is-open" : ""),
        title: "Show/hide the curation panel (display title, issuing agency, training agency, quality flag)."
      }, [curOpenNow ? "▾ ✎ Curate" : "✎ Curate"]);
      curateBtn.onclick = function () {
        var open = !state.curateOpen[r.unified_title];
        state.curateOpen[r.unified_title] = open;
        if (open) state.expanded[r.unified_title] = true;  // reveal the panel
        render();
      };
      actionTd.appendChild(curateBtn);
    }
    if (r.curator_reviewed_at) {
      var who = (r.curator_reviewed_by || "").split("@")[0];
      var when = r.curator_reviewed_at.slice(0, 10);
      actionTd.appendChild(el("span", {
        class: "cr-rev-on",
        title: "Initiated by " + (r.curator_reviewed_by || "?") + " on " + when
      }, ["✓ " + who + " · " + when]));
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
        saveInitiated(r.unified_title)
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
          ? clearOverride(r.unified_title, opts.field)
          : saveOverride(r.unified_title, opts.field, newVal);
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
          clearOverride(r.unified_title, opts.field)
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

  // ── Session 29 CER enrichment: scope/CPL chips, statewide-or-generated credit
  // rec, and green(articulated)/orange(potential) college badges. Injected CSS
  // (cr-scope-css) keeps it self-contained — no HTML-template edit (Rule 4). ──
  function ensureCerScopeCss() {
    if (document.getElementById("cr-scope-css")) return;
    var st = document.createElement("style");
    st.id = "cr-scope-css";
    st.textContent =
      "#tab-credential-reference .cr-scope-block{margin:2px 0 14px;}" +
      "#tab-credential-reference .cr-chip{display:inline-block;padding:2px 8px;border-radius:8px;font-size:.72rem;font-weight:600;background:rgba(255,255,255,.5);border:1px solid var(--border-strong);}" +
      "#tab-credential-reference .cr-chip-ccc{color:var(--hunter);}" +
      "#tab-credential-reference .cr-chip-cos{color:var(--hunter);border-color:var(--hunter);}" +
      "#tab-credential-reference .cr-cos-attrib{display:block;margin-top:2px;font-size:.68rem;color:var(--text-muted);}" +
      "#tab-credential-reference .cr-chip-local{color:var(--text-muted);}" +
      "#tab-credential-reference .cr-chip-gen{color:var(--violet);}" +
      "#tab-credential-reference .cr-chip-none{background:#f1f5f9;color:#94a3b8;}" +
      "#tab-credential-reference .cr-chip-cpl{background:#f1f5f9;color:#475569;border-color:#e2e8f0;font-weight:500;}" +
      "#tab-credential-reference .cr-rec{font-size:.78rem;color:#334155;margin-bottom:8px;}" +
      "#tab-credential-reference .cr-rec-label{font-weight:600;}" +
      "#tab-credential-reference .cr-rec-ccc{color:var(--text-strong);}" +
      "#tab-credential-reference .cr-rec-gen{color:#7a5c00;}" +
      "#tab-credential-reference .cr-rec-val{font-family:ui-monospace,Menlo,monospace;}" +
      "#tab-credential-reference .cr-badges{display:flex;flex-direction:column;gap:6px;margin-bottom:6px;}" +
      "#tab-credential-reference .cr-badge-group{display:flex;flex-wrap:wrap;gap:4px;align-items:center;}" +
      "#tab-credential-reference .cr-badge-grouplabel{font-size:.72rem;font-weight:600;color:#475569;margin-right:4px;}" +
      "#tab-credential-reference .cr-college-badge{display:inline-block;padding:1px 7px;border-radius:9px;font-size:.68rem;font-weight:500;border:1px solid;}" +
      "#tab-credential-reference .cr-badge-green{background:rgba(255,255,255,.5);color:var(--hunter);border-color:var(--border-strong);}" +
      "#tab-credential-reference .cr-badge-orange{background:rgba(255,255,255,.5);color:var(--mustard-text);border-color:var(--border-strong);}" +
      "#tab-credential-reference .cr-badge-more{font-size:.68rem;color:var(--cobalt);cursor:pointer;text-decoration:underline;}" +
      // Scope/CPL chips under the unified title on collapsed rows (compact).
      "#tab-credential-reference .cr-title-chips{display:flex;flex-wrap:wrap;gap:4px;margin:3px 0 0 18px;}" +
      "#tab-credential-reference .cr-title-chips .cr-chip{font-size:.62rem;padding:1px 6px;}" +
      // Left-justify the Unified Title column (header + body) — overrides the
      // global center-align with higher specificity.
      "#tab-credential-reference table.cr-table td.cr-title-cell{text-align:left;}" +
      "#tab-credential-reference table.cr-table th:nth-child(2){text-align:left;}" +
      // Curate panel is now opened from the row's Action cell (2026-06-03).
      "#tab-credential-reference .cr-curate-toggle{background:var(--surface-muted);border:1px solid var(--border-strong);border-radius:6px;color:var(--text-strong);font-size:.74rem;font-weight:600;cursor:pointer;padding:3px 10px;margin-bottom:8px;}" +
      "#tab-credential-reference .cr-curate-toggle:hover{background:#e2e8f0;}" +
      "#tab-credential-reference .cr-curate-toggle.is-open{background:var(--cobalt);color:#fff;border-color:var(--cobalt);}" +
      // Action cell stacks Curate over Mark-initiated / the ✓ initiated stamp.
      "#tab-credential-reference .cr-action-cell{display:flex;flex-direction:column;gap:4px;align-items:flex-start;}" +
      "#tab-credential-reference .cr-action-curate{margin-bottom:0;}" +
      // Merged Confidence cell — title figure leads, issuer rides muted.
      "#tab-credential-reference .cr-conf-sep{opacity:.45;}" +
      "#tab-credential-reference .cr-conf-issuer{opacity:.6;font-size:.92em;}" +
      // Unclassified-triage worklist.
      "#tab-credential-reference .cr-triage-btn{background:#FEF3C7;border:1px solid #F59E0B;color:#92400e;border-radius:6px;font-size:.82rem;font-weight:600;cursor:pointer;padding:6px 10px;}" +
      "#tab-credential-reference .cr-triage-btn:hover{background:#fde68a;}" +
      "#tab-credential-reference .cr-worklist{padding:4px 2px 16px;}" +
      "#tab-credential-reference .cr-wl-back{font-size:.82rem;color:#2563eb;text-decoration:none;}" +
      "#tab-credential-reference .cr-wl-back:hover{text-decoration:underline;}" +
      "#tab-credential-reference .cr-wl-title{color:var(--text-strong);margin:8px 0 4px;}" +
      "#tab-credential-reference .cr-wl-intro{color:#4b5563;font-size:.85rem;margin:0 0 8px;max-width:74ch;}" +
      "#tab-credential-reference .cr-wl-progress{font-size:.85rem;color:#374151;margin-bottom:10px;}" +
      "#tab-credential-reference .cr-wl-note{color:#6b7280;font-style:italic;}" +
      "#tab-credential-reference .cr-wl-table{border-collapse:collapse;width:100%;font-size:.85rem;}" +
      "#tab-credential-reference .cr-wl-table th{text-align:left;background:var(--navy-primary);color:var(--gold-accent);padding:7px 10px;position:sticky;top:0;}" +
      "#tab-credential-reference .cr-wl-table td{padding:6px 10px;border-top:1px solid #eef2f7;vertical-align:top;}" +
      "#tab-credential-reference .cr-wl-row.cr-wl-done{background:#f0fdf4;}" +
      "#tab-credential-reference .cr-wl-raw{max-width:42ch;}" +
      "#tab-credential-reference .cr-wl-band{color:#94a3b8;font-size:.72rem;}" +
      "#tab-credential-reference .cr-wl-input{width:100%;min-width:15ch;padding:4px 6px;border:1px solid #cbd5e1;border-radius:5px;font-size:.82rem;}" +
      "#tab-credential-reference .cr-wl-input:disabled{background:#f8fafc;color:#94a3b8;}" +
      "#tab-credential-reference .cr-wl-act{white-space:nowrap;}" +
      "#tab-credential-reference .cr-wl-save{background:var(--cobalt);color:#fff;border:none;border-radius:5px;font-size:.78rem;font-weight:600;cursor:pointer;padding:4px 12px;}" +
      "#tab-credential-reference .cr-wl-save:disabled{opacity:.6;cursor:default;}" +
      "#tab-credential-reference .cr-wl-clear{font-size:.74rem;color:#b45309;margin-left:8px;text-decoration:none;}" +
      "#tab-credential-reference .cr-wl-clear:hover{text-decoration:underline;}" +
      "#tab-credential-reference .cr-wl-assigned-by{color:#1e7e45;font-size:.78rem;font-weight:600;}" +
      // Item 4 (2026-06-04): the CCR identity runs on one line + muted inline
      // local-course units. The articulations table is LEFT-aligned (header +
      // data) — Sam's call 2026-06-04: the global center-align made the long
      // one-line identities read awkwardly. `table.cr-arts-table` (extra element
      // bump → 0,1,1,2) beats the (0,1,1,1) `.cr-table th/td` center rule the
      // inner cells would otherwise inherit. Injected here (not the HTML <style>)
      // so it covers both CPL_Dashboard.html + index.html without a Rule-4 mirror.
      "#tab-credential-reference table.cr-arts-table th{text-align:left;}" +
      "#tab-credential-reference table.cr-arts-table td{text-align:left;}" +
      "#tab-credential-reference .cr-art-ident{max-width:none;}" +
      // Widen the CCR identity column so the one-line identity wraps to fewer
      // lines → shorter rows (Sam, 2026-06-04). The HTML <style> caps
      // .cr-art-ident at max-width:32ch under table-layout:auto, which squeezed
      // the longest column (identity = code · title · discipline · TOP) into 5-6
      // lines while the Local/Colleges columns sat short. Switch the table to
      // table-layout:fixed and give the identity the largest share (42/40/18).
      // Set widths on BOTH the header th's (drives the main table) AND the td
      // classes (drives the headerless elective-bucket table). overflow-wrap so
      // a long code can't overflow a fixed column.
      "#tab-credential-reference table.cr-arts-table{table-layout:fixed;}" +
      "#tab-credential-reference table.cr-arts-table th:nth-child(1),#tab-credential-reference table.cr-arts-table td.cr-art-ident{width:42%;}" +
      "#tab-credential-reference table.cr-arts-table th:nth-child(2),#tab-credential-reference table.cr-arts-table td.cr-art-local{width:40%;}" +
      "#tab-credential-reference table.cr-arts-table th:nth-child(3),#tab-credential-reference table.cr-arts-table td.cr-art-colleges{width:18%;}" +
      "#tab-credential-reference table.cr-arts-table td{overflow-wrap:anywhere;}" +
      "#tab-credential-reference .cr-lc-units{color:#6b7280;font-size:.92em;}" +
      // R1 noise suppression (2026-06-04): subject-outlier review badge (amber,
      // matches the file's existing gen-chip/triage palette) + the collapsed
      // elective-bucket disclosure. Native <details> marker kept (the expand
      // affordance) per the Session-28 toggle lesson.
      "#tab-credential-reference .cr-art-outlier{display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;font-size:.62rem;font-weight:600;background:rgba(255,255,255,.5);color:var(--mustard-text);border:1px solid var(--border-strong);white-space:nowrap;}" +
      // Consolidated-identity badge (2026-06-04) — informational (consolidation
      // is good), so navy-on-light like the Local chip, not the amber warn badges.
      "#tab-credential-reference .cr-art-merged{display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;font-size:.62rem;font-weight:600;background:rgba(255,255,255,.5);color:var(--text-muted);border:1px solid var(--border-strong);white-space:nowrap;cursor:help;}" +
      "#tab-credential-reference .cr-bucket-details{margin:8px 0 4px;}" +
      "#tab-credential-reference .cr-bucket-summary{cursor:pointer;font-size:.78rem;font-weight:600;color:#92400e;background:#FEF3C7;border:1px solid #F59E0B;border-radius:6px;padding:4px 10px;display:inline-block;}" +
      "#tab-credential-reference .cr-bucket-note{font-size:.74rem;color:#6b7280;font-style:italic;margin:6px 0 4px;max-width:74ch;}" +
      "#tab-credential-reference .cr-bucket-table{opacity:.72;margin-top:2px;}" +
      "#tab-credential-reference .cr-bucket-row .cr-id-code{color:#6b7280;}" +
      // System-level GE-Area AP-credit callout (2026-06-04) — navy/brand accent
      // (authoritative statewide info), sits at the top of the expanded body.
      "#tab-credential-reference .cr-geap{border:1px solid var(--border-strong);border-left:4px solid var(--navy-primary);background:var(--surface-subtle);border-radius:6px;padding:8px 12px;margin:2px 0 12px;}" +
      "#tab-credential-reference .cr-geap-head{font-size:.68rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text-strong);margin-bottom:3px;}" +
      "#tab-credential-reference .cr-geap-body{font-size:.92rem;color:#1f2937;}" +
      "#tab-credential-reference .cr-geap-area{color:var(--text-strong);}" +
      "#tab-credential-reference .cr-geap-na{color:#7a5c00;font-weight:600;}" +
      "#tab-credential-reference .cr-geap-note{font-size:.72rem;color:#6b7280;font-style:italic;margin-top:4px;max-width:80ch;}" +
      // Students-served column (path 1) — the count stands out for triage; the
      // masked "<5" is muted (small-cell suppression).
      "#tab-credential-reference .cr-served-n{font-weight:600;color:var(--text-strong);}" +
      "#tab-credential-reference .cr-served-sup{color:#94a3b8;font-style:italic;font-size:.85em;}" +
      // GE-Area coherence (item #3) — per-identity "off GE Area" badge (warn) +
      // the credential-level callout note.
      "#tab-credential-reference .cr-ge-off{display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;font-size:.62rem;font-weight:600;background:#FEF3C7;color:#92400e;border:1px solid #F59E0B;white-space:nowrap;}" +
      "#tab-credential-reference .cr-geap-off{font-size:.74rem;font-weight:600;color:#92400e;margin-top:5px;}";
    document.head.appendChild(st);
  }

  // Compact college label for the pills (full name kept in the title attr). Looks
  // up window.cplCollegeShort lazily — college_short_names.js loads after this file
  // — and falls back to the full name so a pill never renders blank.
  function SHORT(c) { var f = window.cplCollegeShort; return c ? (f ? (f(c) || c) : c) : c; }

  // A label + capped list of college pills with an expandable "+N more".
  function collegeBadgeGroup(label, names, cls, icon) {
    var CAP = 12;
    var g = el("div", { class: "cr-badge-group" });
    g.appendChild(el("span", { class: "cr-badge-grouplabel" }, [icon + " " + label + " (" + names.length + ")"]));
    names.slice(0, CAP).forEach(function (c) {
      g.appendChild(el("span", { class: "cr-college-badge " + cls, title: c }, [SHORT(c)]));
    });
    if (names.length > CAP) {
      var more = el("a", { href: "#", class: "cr-badge-more" }, ["+" + (names.length - CAP) + " more"]);
      more.onclick = function (e) {
        e.preventDefault();
        names.slice(CAP).forEach(function (c) {
          g.insertBefore(el("span", { class: "cr-college-badge " + cls, title: c }, [SHORT(c)]), more);
        });
        if (more.parentNode) more.parentNode.removeChild(more);
      };
      g.appendChild(more);
    }
    return g;
  }

  // The enrichment block: scope chips + CPL chips, the statewide/generated rec,
  // and the articulated/potential college badges (the screenshot's green/orange).
  // Compact scope + CPL-type chips shown UNDER the unified title on the
  // collapsed row (replaces the old standalone "Scope" column). Same chip
  // vocabulary as the expanded enrichment block, just smaller. Returns null
  // when there's nothing to show so the title stays clean.
  function crTitleChips(r) {
    var c = el("div", { class: "cr-title-chips" });
    // "Generated Title" — the credential's Common Exhibit Title is an
    // AI-generated draft, not yet curator-confirmed (Mark initiated) or renamed
    // (✎). Shown on every AI-draft title so a curator can tell at a glance
    // which exhibit titles are machine-generated vs human-confirmed (Sam's
    // call, 2026-06-04). Curated/initiated rows surface ✓ / ✎ instead.
    if (!r.curator_reviewed_at && !r.utitle_overridden_at) {
      c.appendChild(el("span", { class: "cr-chip cr-chip-gen",
        title: "Common Exhibit Title is an AI-generated draft (title confidence "
          + (r.conf_modal != null ? r.conf_modal.toFixed(2) : "—")
          + "), not yet curator-confirmed. Sign in and Mark initiated, or rename, to confirm it."
      }, ["⚙ Generated Title"]));
    }
    if (r.statewide) {
      c.appendChild(el("span", { class: "cr-chip cr-chip-ccc", title: "At least one CCC Collaborative (statewide) articulation." }, ["🏛 CCC"]));
    }
    if (r.has_local) {
      c.appendChild(el("span", { class: "cr-chip cr-chip-local", title: "At least one local-college articulation." }, ["🏠 Local"]));
    }
    if (!r.statewide && r.has_local) {
      // This "Generated" is about the Common Course ALIGNMENT / credit
      // recommendation (no statewide CCC standard → the rec is derived from the
      // MID/CID/CCN identities), distinct from the "Generated Title" chip above.
      c.appendChild(el("span", { class: "cr-chip cr-chip-gen", title: "Common Course alignment: no statewide CCC standard — the credit recommendation is generated from the MID/CID/CCN identities, for consideration only, NOT an official CCC standard." + (r.gen_rec ? "\nSuggested: " + r.gen_rec : "") }, ["⚙ Generated MID Credit Rec"]));
    }
    if (!r.statewide && !r.has_local && !(r.articulations && r.articulations.length)) {
      c.appendChild(el("span", { class: "cr-chip cr-chip-none", title: "No common-course articulations resolved." }, ["— no articulations"]));
    }
    (r.cpl_types || []).forEach(function (t) {
      c.appendChild(el("span", { class: "cr-chip cr-chip-cpl", title: "CPL Type" }, [t]));
    });
    // CareerOneStop authority anchor (kb/cos_matches.json, lazy — absent until
    // the cos-authority-sync workflow first lands data). Green-lights that this
    // unified title matches an entry in the national certification registry;
    // the tooltip carries the certifying org + the REQUIRED USDOL/DEED
    // attribution (per the COS data-use terms).
    var cos = state.cosMatches && state.cosMatches[r.unified_title];
    if (cos) {
      c.appendChild(el("span", { class: "cr-chip cr-chip-cos",
        title: "Matches the CareerOneStop certification registry"
          + (cos.tier !== "exact" ? " (" + cos.tier + " match)" : "")
          + ":\n" + cos.name + (cos.org ? " — " + cos.org : "")
          + (cos.in_demand ? "\n★ Flagged in-demand nationally." : "")
          + "\n\n" + (state.cosAttribution || "Source: CareerOneStop (USDOL ETA / MN DEED).")
      }, [cos.tier === "exact" ? "✓ COS" : "≈ COS"]));
    }
    return c.childNodes.length ? c : null;
  }

  // Enrichment block for the EXPANDED row: the statewide/generated credit rec
  // + the articulated (green) / potential-adopter (orange) college badges.
  // The scope (🏛CCC / 🏠Local / ⚙Generated) + CPL-type chips that used to LEAD
  // this block were removed 2026-06-03 — they duplicated the title-level chips
  // already shown on the collapsed row (crTitleChips). Returns null when there's
  // nothing to add so the caller skips an empty block.
  function renderScopeAndBadges(r) {
    ensureCerScopeCss();
    var wrap = el("div", { class: "cr-scope-block" });

    if (r.statewide && r.ccc_rec) {
      wrap.appendChild(el("div", { class: "cr-rec" }, [
        el("span", { class: "cr-rec-label cr-rec-ccc" }, ["🏛 Statewide standard: "]),
        el("span", { class: "cr-rec-val" }, [r.ccc_rec]),
      ]));
    } else if (!r.statewide && r.gen_rec) {
      wrap.appendChild(el("div", { class: "cr-rec", title: "Best available credit recommendation from the MID/CID/CCN identities — for consideration only, not an official CCC standard." }, [
        el("span", { class: "cr-rec-label cr-rec-gen" }, ["⚙ Generated MID Credit Recommendation (consideration only): "]),
        el("span", { class: "cr-rec-val" }, [r.gen_rec]),
      ]));
    }

    // Green = articulated (earning colleges across the identities); orange =
    // potential adopters (adoption_leverage; over-merged already withheld upstream).
    var adopters = {};
    (r.articulations || []).forEach(function (a) {
      (a.local || []).forEach(function (lc) {
        (lc.colleges || []).forEach(function (c) { if (c) adopters[c] = 1; });
      });
    });
    var green = Object.keys(adopters).sort();
    var orange = (r.potential_colleges || []);
    if (green.length || orange.length) {
      var badges = el("div", { class: "cr-badges" });
      if (green.length) badges.appendChild(collegeBadgeGroup("Articulated", green, "cr-badge-green", "✅"));
      if (orange.length) badges.appendChild(collegeBadgeGroup("Potential adopters", orange, "cr-badge-orange", "○"));
      wrap.appendChild(badges);
    }
    return wrap.childNodes.length ? wrap : null;
  }

  // ─── Unclassified-triage worklist ─────────────────────────────────────────
  function openWorklist() {
    state.worklistOpen = true;
    if (!state.unclassified && !state.unclassLoading) {
      state.unclassLoading = true;
      Promise.all([fetchUnclassified(), fetchUnclassOverlay()]).then(function (parts) {
        state.unclassified = parts[0];
        state.unclassAssign = parts[1] || {};
        state.unclassLoading = false;
        renderToolbar();  // refresh the button count
        render();
      });
    }
    renderToolbar();
    render();
  }
  function closeWorklist() {
    state.worklistOpen = false;
    renderToolbar();
    render();
  }

  // Shared <datalist>s for the assign inputs (built once): existing unified
  // titles + existing issuers, so a reviewer can pick an existing credential or
  // type a brand-new one.
  function ensureWorklistDatalists() {
    if (!document.getElementById("cr-unclass-titles")) {
      var dl = el("datalist", { id: "cr-unclass-titles" }), seen = {};
      state.rows.forEach(function (r) {
        var t = r.unified_title;
        if (t && !seen[t]) { seen[t] = 1; dl.appendChild(el("option", { value: t })); }
      });
      document.body.appendChild(dl);
    }
    if (!document.getElementById("cr-unclass-issuers")) {
      var dl2 = el("datalist", { id: "cr-unclass-issuers" }), seen2 = {};
      state.rows.forEach(function (r) {
        var i = r.primary_issuer;
        if (i && !seen2[i]) { seen2[i] = 1; dl2.appendChild(el("option", { value: i })); }
      });
      document.body.appendChild(dl2);
    }
  }

  function unclassAssignedCount() {
    var n = 0;
    (state.unclassified || []).forEach(function (it) {
      var a = state.unclassAssign[it.raw_title];
      if (a && a.title) n++;
    });
    return n;
  }
  function updateWorklistProgress() {
    var el2 = document.getElementById("cr-wl-progress-count");
    if (el2) el2.textContent = String(unclassAssignedCount());
  }

  function renderWorklist() {
    var wrap = document.getElementById("cr-table-wrap");
    if (!wrap) return;
    clearNode(wrap);
    var sum = document.getElementById("cr-summary"); if (sum) clearNode(sum);

    var panel = el("div", { class: "cr-worklist" });
    var back = el("a", { class: "cr-wl-back", href: "#" }, ["← back to credentials"]);
    back.onclick = function (e) { e.preventDefault(); closeWorklist(); };
    panel.appendChild(back);
    panel.appendChild(el("h3", { class: "cr-wl-title" }, ["Unclassified exhibit triage"]));

    if (state.unclassLoading || !state.unclassified) {
      panel.appendChild(el("p", { class: "cr-wl-note" }, ["Loading unclassified titles…"]));
      wrap.appendChild(panel);
      return;
    }

    var items = state.unclassified;
    if (!items.length) {
      panel.appendChild(el("p", { class: "cr-wl-note" }, [
        "🎉 Queue clear — every raw MAP exhibit title currently has a credential "
        + "identity. New unclassified titles appear here when the exhibit auditor "
        + "next runs against fresh MAP data."
      ]));
      wrap.appendChild(panel);
      return;
    }
    panel.appendChild(el("p", { class: "cr-wl-intro" }, [
      "These " + items.length + " raw MAP exhibit titles have no credential identity in the "
      + "knowledge base yet. Assign each an existing unified title (start typing to pick one) or "
      + "type a brand-new credential name; optionally set the issuing agency. "
      + (state.sess ? "Assignments save to the curation overlay immediately."
                    : "Sign in via the toolbar to save assignments.")
    ]));
    var prog = el("div", { class: "cr-wl-progress" });
    prog.appendChild(el("strong", { id: "cr-wl-progress-count" }, [String(unclassAssignedCount())]));
    prog.appendChild(document.createTextNode(" of " + items.length + " assigned"));
    panel.appendChild(prog);
    panel.appendChild(el("p", { class: "cr-wl-note" }, [
      "Saved assignments fold into the credential layer automatically on the next "
      + "daily refresh (clean assignments and supersedes of unreviewed machine drafts; "
      + "anything conflicting with a human-reviewed classification waits for a manual "
      + "fold). Rows leave this list once folded."
    ]));

    ensureWorklistDatalists();

    var tbl = el("table", { class: "cr-wl-table" });
    tbl.appendChild(el("thead", null, [el("tr", null, [
      el("th", null, ["Raw MAP exhibit title"]),
      el("th", null, ["Assign unified title"]),
      el("th", null, ["Issuing agency (optional)"]),
      el("th", null, [""]),
    ])]));
    var tbody = el("tbody");
    items.forEach(function (it) { tbody.appendChild(renderWorklistRow(it)); });
    tbl.appendChild(tbody);
    panel.appendChild(tbl);
    wrap.appendChild(panel);
  }

  // One worklist row. Saves update the row IN PLACE (no full re-render) so
  // unsaved input typed in other rows isn't wiped.
  function renderWorklistRow(it) {
    var raw = it.raw_title;
    var cur = state.unclassAssign[raw] || {};
    var tr = el("tr", { class: "cr-wl-row" + (cur.title ? " cr-wl-done" : "") });

    var rawTd = el("td", { class: "cr-wl-raw" });
    rawTd.appendChild(el("span", { class: "cr-wl-rawt" }, [raw]));
    if (it.band) rawTd.appendChild(el("span", { class: "cr-wl-band", title: "Auditor title-confidence band" }, [" " + it.band]));
    tr.appendChild(rawTd);

    var titleInp = el("input", { class: "cr-wl-input cr-wl-title-input", type: "text",
      list: "cr-unclass-titles", placeholder: "existing or new credential…",
      value: cur.title || "", autocomplete: "off" });
    titleInp.disabled = !state.sess;
    var titleTd = el("td", {}); titleTd.appendChild(titleInp); tr.appendChild(titleTd);

    var issInp = el("input", { class: "cr-wl-input cr-wl-iss-input", type: "text",
      list: "cr-unclass-issuers", placeholder: "issuer…", value: cur.issuer || "", autocomplete: "off" });
    issInp.disabled = !state.sess;
    var issTd = el("td", {}); issTd.appendChild(issInp); tr.appendChild(issTd);

    var actTd = el("td", { class: "cr-wl-act" });
    if (state.sess) {
      var saveBtn = el("button", { type: "button", class: "cr-wl-save" }, [cur.title ? "✓ Saved" : "Save"]);
      titleInp.oninput = function () { if (saveBtn.textContent !== "Save") saveBtn.textContent = "Save"; };
      issInp.oninput   = function () { if (saveBtn.textContent !== "Save") saveBtn.textContent = "Save"; };
      saveBtn.onclick = function () {
        var t = (titleInp.value || "").trim();
        if (!t) { titleInp.focus(); return; }
        var iss = (issInp.value || "").trim();
        saveBtn.disabled = true; saveBtn.textContent = "saving…";
        Promise.all([
          saveUnclass(raw, FIELD_UNCLASS_TITLE, t),
          saveUnclass(raw, FIELD_UNCLASS_ISSUER, iss)
        ]).then(function (rs) {
          saveBtn.disabled = false;
          if (rs.every(function (r) { return r.ok; })) {
            state.unclassAssign[raw] = { title: t, issuer: iss, by: state.sess.email, at: new Date().toISOString() };
            tr.className = "cr-wl-row cr-wl-done";
            saveBtn.textContent = "✓ Saved";
            if (!actTd.querySelector(".cr-wl-clear")) actTd.appendChild(makeClearLink(raw, tr, actTd, saveBtn));
            updateWorklistProgress();
            renderToolbar();  // triage-button count: open → awaiting-fold
          } else {
            // dropDeadSession already flipped the auth widget on 401/403; the
            // row-level affordance just offers the retry.
            saveBtn.textContent = "retry";
          }
        }).catch(function () { saveBtn.disabled = false; saveBtn.textContent = "retry"; });
      };
      actTd.appendChild(saveBtn);
      if (cur.title) actTd.appendChild(makeClearLink(raw, tr, actTd, saveBtn));
    } else if (cur.title) {
      actTd.appendChild(el("span", { class: "cr-wl-assigned-by", title: "Assigned by " + (cur.by || "") }, ["✓ assigned"]));
    }
    tr.appendChild(actTd);
    return tr;
  }
  function makeClearLink(raw, tr, actTd, saveBtn) {
    var clr = el("a", { class: "cr-wl-clear", href: "#", title: "Remove this assignment" }, ["clear"]);
    clr.onclick = function (e) {
      e.preventDefault();
      clearUnclass(raw).then(function (r) {
        if (!r.ok) return;
        delete state.unclassAssign[raw];
        tr.className = "cr-wl-row";
        if (saveBtn) saveBtn.textContent = "Save";
        if (clr.parentNode) clr.parentNode.removeChild(clr);
        updateWorklistProgress();
        renderToolbar();  // triage-button count: awaiting-fold → open
      }).catch(function () {});
    };
    return clr;
  }

  // GE-Area coherence check (item #3): true when this articulated course's
  // discipline sits in GE division(s) DISJOINT from the credit the exam grants
  // (e.g. a Sociology course under AP Statistics, which grants Language &
  // Rationality). A review candidate, not a verdict — disciplines like
  // History/Geography legitimately cross divisions, and unknown disciplines never
  // flag. Map (disc → [divisions]) is baked from kb/reference/ccc_ge_exam_credit.json.
  function geAreaOff(disc, ge) {
    if (!ge || ge.na || !(ge.areas && ge.areas.length) || !disc) return false;
    var divs = state.discGeAreas[disc];
    if (!divs || !divs.length) return false;          // unknown discipline → don't flag
    return !divs.some(function (d) { return ge.areas.indexOf(d) >= 0; });
  }

  // System-level GE-Area credit callout for an AP/IB/CLEP credential (CCC GE
  // charts, ESLEI 24-35 + AA 17-20). Returns null for non-exam credentials +
  // exams not on the charts (no r.ge_credit baked). The GE Area is the statewide
  // constant; the per-college local courses (shown below) vary.
  function renderGeApCredit(r) {
    var g = r.ge_credit;
    if (!g) return null;
    ensureCerScopeCss();
    var prog = g.program || "exam";
    var box = el("div", { class: "cr-geap" });
    box.appendChild(el("div", { class: "cr-geap-head" },
      ["📜 Statewide " + prog + " credit · CCC GE " + prog + " List"]));
    var body = el("div", { class: "cr-geap-body" });
    if (g.na || !(g.areas && g.areas.length)) {
      body.appendChild(el("span", { class: "cr-geap-na" }, ["No GE Area assigned (N/A)"]));
      if (g.units) {
        body.appendChild(document.createTextNode(" — colleges may award "));
        body.appendChild(el("strong", null, [g.units + " elective unit" + (g.units === 1 ? "" : "s")]));
      }
    } else {
      // areas_all → credit awarded in ALL listed areas together ("X and Y");
      // otherwise any one listed area qualifies ("X or Y").
      body.appendChild(document.createTextNode("General Education — "));
      body.appendChild(el("strong", { class: "cr-geap-area" },
        [g.areas.join(g.areas_all ? " and " : " or ")]));
      if (g.units != null) {
        body.appendChild(document.createTextNode(" · "));
        body.appendChild(el("strong", null, [g.units + " semester unit" + (g.units === 1 ? "" : "s")]));
        body.appendChild(document.createTextNode(" (minimum)"));
      }
    }
    box.appendChild(body);
    // GE-Area coherence (item #3): count articulated courses whose discipline
    // sits outside the granted GE Area (excludes demoted elective-bucket rows —
    // those are flagged separately). Surfaced as a credential-level review cue.
    var nOff = (r.articulations || []).filter(function (a) {
      return !a.bucket && geAreaOff(a.disc, g);
    }).length;
    if (nOff) {
      box.appendChild(el("div", { class: "cr-geap-off",
        title: "These articulated courses' disciplines fall in a different GE division "
             + "than the credit this exam grants — review whether the articulation is correct." },
        ["⚠ " + nOff + " articulated course" + (nOff === 1 ? "" : "s")
         + " sit outside this GE Area — worth a review."]));
    }
    box.appendChild(el("div", { class: "cr-geap-note" }, [
      "Credit for AP/IB/CLEP exams is set at the system level (AP: AB 1985 / "
      + "AA 17-20; IB & CLEP: title 5 §55052.5; current charts ESLEI 24-35). The "
      + "local courses below are how individual colleges grant it — course-to-course "
      + "credit is a local faculty decision; the GE Area is the statewide constant."
      + (g.note ? "  " + g.note : "")
    ]));
    return box;
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
    if (!state.curateOpen) state.curateOpen = {};
    var tr = el("tr", { class: "cr-expanded" });
    var td = el("td", { colspan: String(colSpan) });
    var div = el("div", { class: "cr-expanded-body" });

    // ── Curation panel — toggled from the row's Action-cell "✎ Curate" button
    // (moved out of the expanded body 2026-06-03 to save vertical space; the
    // in-body toggle was redundant once the Action cell carries it). Shown only
    // when the curator opened it; otherwise the expanded row leads straight into
    // the enrichment block + identities table. Open-state persists in
    // state.curateOpen across re-renders. ──
    if (state.curateOpen[r.unified_title]) {
      div.appendChild(renderCurationPanel(r));
    }

    // ── System-level GE-Area credit for AP/IB/CLEP exams (2026-06-04). This
    // credit is set statewide (AP: AB 1985 / AA 17-20; IB+CLEP: title 5 §55052.5;
    // charts: ESLEI 24-35): the authoritative anchor is the GE Area + min units,
    // NOT a course-identity fold (course-to-course credit is a local faculty
    // decision). Headlined at the top so the system-level truth leads; the
    // local-course identity table below is framed as the local detail. ──
    var geBlock = renderGeApCredit(r);
    if (geBlock) div.appendChild(geBlock);

    // ── Statewide/generated credit rec + articulated/potential college badges
    // (Session 29 CER enrichment) — the duplicate scope/CPL chips were dropped
    // 2026-06-03 (they live on the collapsed-row title now). Skip if empty. ──
    var scopeBlock = renderScopeAndBadges(r);
    if (scopeBlock) div.appendChild(scopeBlock);

    // ── Audit signals — moved up here (2026-06-04, Sam's call) so they sit
    // directly under the Articulated / Potential-adopter section, where a
    // curator triaging a credential expects to find them (was at the bottom). ──
    if (r.audit_tag_total) {
      div.appendChild(el("h5", { class: "cr-audit-h" }, ["Audit signals"]));
      var ulA = el("ul", { class: "cr-audit-list" });
      Object.keys(r.audit_tags).sort().forEach(function (t) {
        ulA.appendChild(el("li", null, [el("code", null, [t]), " × " + r.audit_tags[t]]));
      });
      div.appendChild(ulA);
    }

    // ── Common-course identities articulating to this credential ──
    // Render a table per identity: identity badge on the left, local
    // college course rows on the right. CCN-ID / C-ID anchors first, then
    // M-ID / Cluster surrogates.
    if (r.articulations && r.articulations.length) {
      // R1 noise suppression (2026-06-04): split identities into the substantive
      // set (shown) and "elective-bucket" entries (a.bucket — a single local
      // course a college maps many unrelated exams to for generic elective
      // credit, e.g. Clovis's COMM M1038 → 61 credentials). Buckets are demoted
      // into a collapsed disclosure so the table boils down to essentials.
      // Subject-outliers (a.outlier) stay visible with a review badge — a
      // minority subject may still be a legitimate local/GE choice.
      var shownArts = r.articulations.filter(function (a) { return !a.bucket; });
      var bucketArts = r.articulations.filter(function (a) { return a.bucket; });

      // Build one identity <tr>. `bucketRow` mutes it (used in the disclosure).
      function mkArtRow(a, bucketRow) {
        var sysCls = "cr-sys-" + (a.sys || "mid").toLowerCase().replace(/[^a-z]/g, "");
        // One row per identity (no rowspan) — local courses folded into one cell.
        var row = el("tr", { class: "cr-art-row cr-art-first" + (bucketRow ? " cr-bucket-row" : "") });

        var idCell = el("td", { class: "cr-art-ident " + sysCls });
        idCell.appendChild(el("span", { class: "cr-id-sys" }, [idSysLabel(a.sys) || "?"]));
        idCell.appendChild(document.createTextNode(" "));
        idCell.appendChild(el("code", { class: "cr-id-code" }, [a.cid || "—"]));
        // Item 4 (2026-06-04): keep the whole CCR identity on ONE line — the
        // title + discipline/TOP meta as inline <span>s joined by " · ".
        if (a.title) {
          idCell.appendChild(document.createTextNode(" · "));
          idCell.appendChild(el("span", { class: "cr-id-title" }, [a.title]));
        }
        var metaParts = [];
        if (a.disc) metaParts.push(a.disc);
        if (a.top)  metaParts.push("TOP " + a.top);
        if (metaParts.length) {
          idCell.appendChild(document.createTextNode(" · "));
          idCell.appendChild(el("span", { class: "cr-id-meta" }, [metaParts.join(" · ")]));
        }
        // Consolidated-identity badge (2026-06-04) — this row folds N near-
        // duplicate common-course identities (the same course minted as separate
        // single-college M-IDs, differing only in level/format title wording:
        // "EMT" / "EMT Academy" / "EMT I" / "EMT Training" …) into one, so the
        // EMT-style 29-row sprawl reads as the ~12 real courses. Producer-side
        // (_consolidate_arts); the DURABLE identity merges are queued in the CCR
        // Suggested-merges worklist. The folded ids + titles ride in the tooltip.
        if (a.merged && a.merged > 1) {
          idCell.appendChild(document.createTextNode(" "));
          var _mem = (a.members || []).map(function (m) {
            return m.cid + (m.title ? " (" + m.title + ")" : "");
          });
          idCell.appendChild(el("span", {
            class: "cr-art-merged",
            title: a.merged + " near-duplicate common-course identities folded into this "
                 + "row (same course, different local title wording). Folded: "
                 + (_mem.join("; ") || "—") + ". Durable identity merges are queued in "
                 + "the CCR Suggested-merges worklist."
          }, ["⛓ " + a.merged + " variants"]));
        }
        // Subject-outlier review badge (R1) — minority subject vs this
        // credential's predominant one; a candidate for review, not a verdict.
        if (a.outlier) {
          idCell.appendChild(document.createTextNode(" "));
          idCell.appendChild(el("span", {
            class: "cr-art-outlier",
            title: "Subject outlier — a minority subject vs this credential's "
                 + "predominant one. Review whether the articulation is correct "
                 + "(it may be a legitimate cross-listing or local GE choice)."
          }, ["⚠ subject outlier"]));
        }
        // GE-Area coherence badge (item #3) — this course's discipline sits in a
        // GE division other than the one this exam grants. Policy-grounded cousin
        // of the subject-outlier badge; only fires on exam credentials (ge_credit).
        if (geAreaOff(a.disc, r.ge_credit)) {
          idCell.appendChild(document.createTextNode(" "));
          idCell.appendChild(el("span", {
            class: "cr-ge-off",
            title: "Off GE Area — this course's discipline (" + a.disc + ") sits in a "
                 + "different GE division than the " + ((r.ge_credit && r.ge_credit.areas || []).join(" / "))
                 + " credit this exam grants. Review whether the articulation is correct."
          }, ["⚠ off GE Area"]));
        }
        row.appendChild(idCell);

        // Local courses — code + title + units inline (item 4), e.g.
        // "BIT 375 10-Key on the Computer (1 unit)". Units from the baked `u`.
        var locals = (a.local || []).filter(function (lc) { return lc.subj || lc.num || lc.t; });
        var lcCell = el("td", { class: "cr-art-local" });
        if (locals.length) {
          locals.forEach(function (lc, i) {
            if (i) lcCell.appendChild(document.createTextNode(", "));
            var code = ((lc.subj || "") + " " + (lc.num || "")).trim();
            lcCell.appendChild(el("span", { class: "cr-lc-code" }, [code || "—"]));
            if (lc.t) {
              lcCell.appendChild(document.createTextNode(" "));
              lcCell.appendChild(el("span", { class: "cr-lc-title" }, [lc.t]));
            }
            if (lc.u != null && lc.u !== "") {
              lcCell.appendChild(document.createTextNode(" "));
              lcCell.appendChild(el("span", { class: "cr-lc-units" },
                ["(" + lc.u + " unit" + (Number(lc.u) === 1 ? "" : "s") + ")"]));
            }
          });
        } else {
          lcCell.appendChild(el("span", { class: "cr-null" }, ["—"]));
        }
        row.appendChild(lcCell);

        // Earning colleges — deduped union across this identity's local courses,
        // as short-name chips (full names on hover).
        var colSet = {};
        (a.local || []).forEach(function (lc) {
          (lc.colleges || []).forEach(function (c) { if (c) colSet[c] = 1; });
        });
        var allCols = Object.keys(colSet).sort();
        row.appendChild(el("td", { class: "cr-art-colleges", title: allCols.join(", ") },
          [allCols.length ? allCols.map(SHORT).join(", ") : "—"]));
        return row;
      }

      // Header count reflects the SHOWN (substantive) identities only.
      var shownLines = shownArts.reduce(function (s, a) {
        return s + (a.local || []).filter(function (lc) { return lc.subj || lc.num || lc.t; }).length;
      }, 0);
      var nId = shownArts.length;
      div.appendChild(el("h5", null, [
        nId
          ? ("Common-course identities articulating to this credential ("
             + nId + " " + (nId === 1 ? "identity" : "identities")
             + " · " + shownLines + " local-course line" + (shownLines === 1 ? "" : "s") + ")")
          : "Common-course identities articulating to this credential"
      ]));

      if (nId) {
        var tbl = el("table", { class: "cr-arts-table" });
        tbl.appendChild(el("thead", null, [el("tr", null, [
          el("th", null, ["Common Course (CCR)"]),
          el("th", null, ["Local Course"]),
          el("th", null, ["Earning College(s)"]),
        ])]));
        var tbody2 = el("tbody");
        shownArts.forEach(function (a) { tbody2.appendChild(mkArtRow(a, false)); });
        tbl.appendChild(tbody2);
        div.appendChild(tbl);
      }

      // Demoted elective-bucket entries — collapsed, not counted above.
      if (bucketArts.length) {
        var det = el("details", { class: "cr-bucket-details" });
        det.appendChild(el("summary", { class: "cr-bucket-summary" }, [
          "⚠ " + bucketArts.length + " non-substantive “elective-bucket” "
          + (bucketArts.length === 1 ? "entry" : "entries") + " hidden"
        ]));
        det.appendChild(el("p", { class: "cr-bucket-note" }, [
          "A single local course a college maps many unrelated exams to for "
          + "generic elective credit — not specific to this credential. "
          + "Surfaced for review, not counted above."
        ]));
        var btbl = el("table", { class: "cr-arts-table cr-bucket-table" });
        var bbody = el("tbody");
        bucketArts.forEach(function (a) { bbody.appendChild(mkArtRow(a, true)); });
        btbl.appendChild(bbody);
        det.appendChild(btbl);
        div.appendChild(det);
      }
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
        "College-entered exhibit titles (" + r.raw_count + ")"
      ]));
      div.appendChild(el("p", { class: "cr-empty-note" }, [
        "The raw title(s) colleges actually entered in MAP, collapsed under the "
        + "generated Common Exhibit Title above. A count of 1 means a single "
        + "college title maps here — it may read differently from the generated title."
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

  // A failed boot used to leave the pane permanently blank (the lazy
  // onActivate boot is once-per-page-load, so there was no second chance).
  // Render an inline error card with a Retry that re-runs init().
  function renderInitError(err) {
    var wrap = document.getElementById("cr-table-wrap");
    if (!wrap) return;
    clearNode(wrap);
    var card = el("div", { class: "cr-wl-note" }, [
      "The Credential Reference failed to load (" + (err && err.message || "error") + "). "
    ]);
    var retry = el("button", { type: "button", class: "cr-triage-btn" }, ["↻ Retry"]);
    retry.onclick = function () { init(); };
    card.appendChild(retry);
    wrap.appendChild(card);
  }

  // CareerOneStop authority matches — optional overlay (absent until the
  // cos-authority-sync workflow first lands kb/cos_matches.json). Loaded
  // AFTER the first render so the table never waits on it; a successful load
  // re-renders once to surface the ✓/≈ COS chips.
  function fetchCosMatches() {
    return fetch("kb/cos_matches.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.matches && Object.keys(d.matches).length) {
          state.cosMatches = d.matches;
          state.cosAttribution = d._attribution || null;
          if (!state.worklistOpen) render();
        }
      })
      .catch(function () {});
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
        state.discGeAreas = baked.disc_ge_areas || {};
        renderToolbar();
        render();
        fetchCosMatches();
      }).catch(renderInitError);
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
      fetchCosMatches();
    }).catch(renderInitError);
  }

  // Lazy boot (perf): the ~2.6 MB baked CPL_CREDENTIAL_REFERENCE payload + the
  // table render are deferred until the Credential Reference (CER) tab is first
  // opened — no longer eager at page load. tabs.js loadScript injects
  // credential_reference_data.js on demand, then init() runs. (init() still
  // falls back to a runtime kb/*.json fetch if the baked global is absent —
  // e.g. pre-first-cron local dev.) See tabs.js onActivate/loadScript.
  if (window.CPL_TABS && CPL_TABS.onActivate) {
    CPL_TABS.onActivate("credential-reference", function () {
      CPL_TABS.loadScript("credential_reference_data.js", "CPL_CREDENTIAL_REFERENCE", init);
    });
  } else {
    // Fallback (tabs.js absent — unit tests, or a load-order regression): eager
    // init, as before the lazy split. init() guards on the data global itself.
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
