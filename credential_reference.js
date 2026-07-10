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
  // PR-5b/2 (Session 107) — the curator's explicit merge confirmation. When a
  // saved rename's target equals an EXISTING credential key, the rename apply
  // queues it as a collision until this row exists naming that exact target;
  // then the apply FOLDS the old credential's records into the existing key.
  // Its own kb_curation field (the additional-issuer pattern) so a confirm
  // never clobbers the rename override itself. NEVER inferred server-side.
  var FIELD_UTITLE_MERGE_CONFIRM = "unified_title_merge_confirm";
  var FIELD_ISSUER_OVERRIDE  = "issuing_agency_override";
  // An ADDITIONAL issuing agency (Rule 4 — same credential, multiple
  // certifying bodies). Its own kb_curation field so a second agency never
  // clobbers the primary override; Mode A2 promotes it ADDITIVELY into
  // kb/credentials.json (fill-or-append, never overwrite). Sam, 2026-07-08.
  var FIELD_ISSUER2_OVERRIDE = "issuing_agency_additional_override";
  var FIELD_TRAINER_OVERRIDE = "training_agency_override";
  var FIELD_QFLAG_OVERRIDE   = "quality_flag_override";
  // CER v2 round 2 (2026-07-09, Sam): credential-grain Discipline + SUBJ
  // in-cell overrides. OVERLAY/DISPLAY-ONLY for now — deliberately NOT in
  // the kb/_apply_credential_review.py promotion lanes (the anchor-proposal
  // precedent): they live in Supabase, render live, and ride the ⬇ extracts.
  var FIELD_DISC_OVERRIDE    = "discipline_override";
  var FIELD_SUBJ_OVERRIDE    = "subj_override";
  var FIELD_CPLTYPE_OVERRIDE = "cpl_type_override";
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
      // fixed literal names only (never attacker-controlled); values String()d
      if (attrs["data-raw"] != null) n.setAttribute("data-raw", String(attrs["data-raw"]));
      if (attrs["data-ut"] != null) n.setAttribute("data-ut", String(attrs["data-ut"]));
      if (attrs.role != null) n.setAttribute("role", String(attrs.role));
      if (attrs["aria-label"] != null) n.setAttribute("aria-label", String(attrs["aria-label"]));
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

  // ─── Paginated overlay read (2026-07-08, Session 105) ────────────────────
  // PostgREST caps any single response at 1,000 rows (server default) and
  // returns them in ARBITRARY order, so a one-shot GET silently drops a
  // DIFFERENT tail of the overlay on every load once the namespace outgrows
  // the cap. That is exactly what bit Sam on 2026-07-07: 1,200 _UNCLASSIFIED::
  // rows → ~200 dropped per fetch → already-saved assignments rendered as
  // "needs triage" (the fire certs that "did not save" HAD saved; later the
  // "113 still showing" were the same truncated read). Page with Range
  // headers over a stable order until a short page so every row lands no
  // matter how large the namespace grows.
  function fetchAllRows(url) {
    var PAGE = 1000;
    var out = [];
    url += "&order=course_id.asc,field.asc";  // stable order — Range pages must not shear
    function page(from) {
      return fetch(url, { headers: {
        "apikey": SUPABASE_ANON,
        "Range-Unit": "items",
        "Range": from + "-" + (from + PAGE - 1)
      } })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (arr) {
          out = out.concat(arr || []);
          return (arr && arr.length === PAGE) ? page(from + PAGE) : out;
        });
    }
    return page(0).catch(function () { return out; });
  }

  // Fetch overlay — only rows in our namespace.
  function fetchOverlay() {
    var url = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?select=course_id,field,value,reviewer_email,reviewed_at"
      + "&course_id=like." + encodeURIComponent(KEY_PREFIX) + "%25";
    return fetchAllRows(url)
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
          } else if (row.field === FIELD_UTITLE_MERGE_CONFIRM) {
            rec.merge_confirm = row.value || "";
            rec.merge_confirmed_by = row.reviewer_email;
            rec.merge_confirmed_at = row.reviewed_at;
          } else if (row.field === FIELD_ISSUER_OVERRIDE) {
            rec.issuer_override = row.value || "";
            rec.issuer_overridden_by = row.reviewer_email;
            rec.issuer_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_ISSUER2_OVERRIDE) {
            rec.issuer2_override = row.value || "";
            rec.issuer2_overridden_by = row.reviewer_email;
            rec.issuer2_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_TRAINER_OVERRIDE) {
            rec.trainer_override = row.value || "";
            rec.trainer_overridden_by = row.reviewer_email;
            rec.trainer_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_QFLAG_OVERRIDE) {
            rec.qflag_override = row.value || "";
            rec.qflag_overridden_by = row.reviewer_email;
            rec.qflag_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_DISC_OVERRIDE) {
            rec.disc_override = row.value || "";
            rec.disc_overridden_by = row.reviewer_email;
            rec.disc_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_SUBJ_OVERRIDE) {
            rec.subj_override = row.value || "";
            rec.subj_overridden_by = row.reviewer_email;
            rec.subj_overridden_at = row.reviewed_at;
          } else if (row.field === FIELD_CPLTYPE_OVERRIDE) {
            rec.cpltype_override = row.value || "";
            rec.cpltype_overridden_by = row.reviewer_email;
            rec.cpltype_overridden_at = row.reviewed_at;
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
        // Originating-college index over ALL cards (classified included, once
        // the auditor stamps them — Session 106) so the issuer lane can show
        // who entered each raw title without flipping to the main CER row.
        var colIdx = {};
        cards.forEach(function (c) {
          if (c && c.raw_title && c.colleges && c.colleges.length) {
            colIdx[c.raw_title] = c.colleges;
          }
        });
        state.rawColleges = colIdx;
        return cards.filter(function (c) {
          return c && !c.unified_title
            && (c.tags || []).indexOf("unclassified_in_map") >= 0;
        }).map(function (c) {
          return { raw_title: c.raw_title, band: c.band || "", quality_flag: c.quality_flag || null,
                   colleges: c.colleges || [] };  // originating college(s), stamped by the auditor (Session 104)
        }).sort(function (a, b) { return (a.raw_title || "").localeCompare(b.raw_title || ""); });
      })
      .catch(function () { return []; });
  }
  // Assignments made so far (own namespace). Returns raw_title → {title, issuer, by, at}.
  function fetchUnclassOverlay() {
    var url = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?select=course_id,field,value,reviewer_email,reviewed_at"
      + "&course_id=like." + encodeURIComponent(UNCLASS_PREFIX) + "%25";
    return fetchAllRows(url)  // 1,200+ rows — the single-GET 1,000-row cap is the "didn't save" bug
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
  // Identity-anchored title suggestions (kb/unclassified_suggestions.json,
  // generated daily by kb/_suggest_unclassified.py — Rule 5c precedence:
  // CCN > C-ID > COS authority > modal local course title). Optional; the
  // worklist renders 💡 one-click fill chips. Curator always confirms.
  function fetchUnclassSuggestions() {
    return fetch("kb/unclassified_suggestions.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.suggestions) || {}; })
      .catch(function () { return {}; });
  }

  // STAGED pre-seed suggestions (kb/unclassified_preseed.json, generated by
  // kb/_preseed_unclassified.py --stage). Unlike the Session-102 brand-lane
  // applies, these are NOT in Supabase: the worklist prefills the inputs and
  // the curator saves — "ready to save but not yet saved" (Sam, 2026-07-07).
  function fetchUnclassPreseed() {
    return fetch("kb/unclassified_preseed.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.staged) || {}; })
      .catch(function () { return {}; });
  }

  // STAGED issuer pre-seeds for the missing-issuer lane (kb/issuer_preseed.json,
  // generated by kb/_preseed_null_issuers.py --stage). Same contract as the
  // unclassified pre-seed: prefill-only, the curator's click saves. An entry
  // whose issuer is "" stages the explicit "no formal issuer (local)" verdict.
  function fetchIssuerPreseed() {
    return fetch("kb/issuer_preseed.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.staged) || {}; })
      .catch(function () { return {}; });
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
      // All distinct issuing agencies (baked only when >1 — Rule 4 multi-issuer
      // credentials like Fire Inspector I; renders as a "+N" chip).
      issuers: Array.isArray(b.issuers) ? b.issuers : null,
      issuer_count: Array.isArray(b.issuers) ? b.issuers.length : (b.issuer ? 1 : 0),
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
      // Multi-issuer surface (Rule 4) — mirror the baked `issuers` field.
      var issAll = [];
      row.credentials.forEach(function (c) {
        var a = (c.issuing_agency || "").trim();
        if (a && issAll.indexOf(a) < 0) issAll.push(a);
      });
      row.issuers = issAll.length > 1 ? issAll : null;
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
      // discipline_override + subj_override (v2 round 2) — overlay-only;
      // the bake doesn't carry these yet, so no bake-aware revert path.
      if (ov.disc_override !== undefined && ov.disc_override !== "") {
        if (r.original_disc_modal === undefined) r.original_disc_modal = r.disc_modal;
        r.disc_modal = ov.disc_override;
        r.disc_overridden_at = ov.disc_overridden_at;
      }
      if (ov.subj_override !== undefined && ov.subj_override !== "") {
        r._subj = ov.subj_override;   // pre-seeds the subjOf() cache
        r.subj_overridden_at = ov.subj_overridden_at;
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
    // CER v2 lean filters + grid lanes (2026-07-09)
    if (state.cplTypeFilter !== "all"
        && cplTypesOf(row).indexOf(state.cplTypeFilter) < 0) return false;
    if (state.discFilter !== "all" && row.disc_modal !== state.discFilter) return false;
    // SUBJ code (S110) — matches the derived modal SUBJ4 OR the overlay
    // subj_override (both flow through subjOf's _subj cache).
    if (state.subjFilter !== "all"
        && (subjOf(row) || "").toUpperCase() !== state.subjFilter) return false;
    if (state.collegeFilter !== "all") {
      if (state.collegeFilter === "__ccc__") {
        if (!row.statewide) return false;
      } else if (collegesOf(row).indexOf(state.collegeFilter) < 0) return false;
    }
    if (!inLane(row, state.lane)) return false;
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
      subj:            function (r) { return subjOf(r) || "~"; },
      primary_trainer: function (r) { return (r.primary_trainer || "~").toLowerCase(); },
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
    // ── CER v2 (2026-07-09, design locked on prototype/cer_triage_redesign_v1.html) ──
    // One editable surface: `lane` picks a queue chip; "unc"/"noiss"/"merge"
    // render the (already in-cell) triage sections, everything else is the
    // main grid — which now edits in-cell too.
    lane: "all",           // all | unc | noiss | merge | open | done
    cplTypeFilter: "all",  // new lean-filter row
    discFilter: "all",
    subjFilter: "all",     // SUBJ4 code (S110) — derived or subj_override
    collegeFilter: "all",  // originating college; "__ccc__" = CCC statewide
    colWidths: null,       // th drag-resize widths (localStorage)
    rowDraft: {},          // ut → {title, issuer, extra:[..], trainer} UNSAVED grid edits
    rowSaved: {},          // ut → true — grid row saved this session (✓ saved)
    mergeSugOpen: {},      // ut → true — the ⇆ merge-suggestion panel open
    visCols: null,         // column-picker prefs (loaded from localStorage in init)
    sort: { key: "unified_title", dir: "asc" },
    expanded: {},  // unified_title → bool (row body open)
    curateOpen: {},  // unified_title → bool (per-row Curate panel open; default collapsed)
    worklistOpen: false,  // unclassified-triage worklist replacing the main table
    unclassified: null,   // lazy: [{raw_title, band, …}] from the audit
    unclassLoading: false,
    unclassAssign: {},    // raw_title → {title, issuer, by, at} (Supabase overlay + live edits)
    unclassSuggest: {},   // raw_title → [{kind, id, title, org?}] (💡 fill chips)
    unclassPreseed: {},   // raw_title → {title, issuer, via, confidence, note} — ⚡ STAGED
                          // pre-seeds (kb/unclassified_preseed.json): prefill the assign
                          // inputs, NEVER auto-saved; the curator reviews + clicks Save
    wlShowAll: false,     // triage-view toggle: false = only rows still needing triage
    wlDraft: {},          // raw_title → {title, issuer} — UNSAVED input typed into
                          // worklist rows, survives re-renders (2026-07-08: hand-typed
                          // fire-cert rows were wiped by a view-toggle re-render)
    issuerPreseed: {},    // unified_title → {issuer, via, confidence, note} — ⚡ STAGED
                          // issuer pre-seeds (kb/issuer_preseed.json) for the
                          // missing-issuer triage lane; prefill-only, curator saves
    niDraft: {},          // unified_title → {issuer, title} drafts for the issuer lane
    niSaved: {},          // unified_title → true — lane row saved this session (in-place ✓)
    rawColleges: {},      // raw_title → [originating colleges] (auditor-stamped)
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

  // ─── CER v2 helpers (2026-07-09) ────────────────────────────────────────

  // Column-picker prefs — per-browser, label-stable across regens.
  var COL_PREFS_KEY = "cplCerCols.v1";
  var COL_DEFAULTS = { subj: true, disc: true, issuer: true, trainer: true,
    students: true, variants: false, conf: false, elig: false };
  function loadColPrefs() {
    try {
      var raw = localStorage.getItem(COL_PREFS_KEY);
      if (!raw) return Object.assign({}, COL_DEFAULTS);
      var got = JSON.parse(raw);
      var out = Object.assign({}, COL_DEFAULTS);
      Object.keys(COL_DEFAULTS).forEach(function (k) {
        if (typeof got[k] === "boolean") out[k] = got[k];
      });
      return out;
    } catch (e) { return Object.assign({}, COL_DEFAULTS); }
  }
  function saveColPrefs() {
    try { localStorage.setItem(COL_PREFS_KEY, JSON.stringify(state.visCols)); }
    catch (e) { /* private mode — session-only prefs */ }
  }
  function visCols() {
    if (!state.visCols) state.visCols = loadColPrefs();
    return state.visCols;
  }
  // Column drag-resize (v2 round 3) — widths keyed by the column's sort key
  // (stable across regens), persisted per-browser.
  var COL_WIDTHS_KEY = "cplCerColWidths.v1";
  function colWidths() {
    if (!state.colWidths) {
      try { state.colWidths = JSON.parse(localStorage.getItem(COL_WIDTHS_KEY)) || {}; }
      catch (e) { state.colWidths = {}; }
    }
    return state.colWidths;
  }
  function saveColWidths() {
    try { localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(state.colWidths)); }
    catch (e) { /* private mode */ }
  }
  function attachResize(th, key, table) {
    var h = el("span", { class: "cr-resize",
      title: "Drag to resize this column (saved per-browser)." });
    h.onmousedown = function (e) {
      e.preventDefault(); e.stopPropagation();
      var startX = e.clientX, startW = th.offsetWidth;
      table.style.tableLayout = "fixed";
      function move(ev) {
        var w = Math.max(48, startW + (ev.clientX - startX));
        th.style.width = w + "px";
      }
      function up(ev) {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        colWidths()[key] = Math.max(48, startW + (ev.clientX - startX));
        saveColWidths();
      }
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };
    // A resize drag must never trigger the th's sort handler.
    h.onclick = function (e) { e.stopPropagation(); };
    th.appendChild(h);
  }

  // Modal SUBJ4 across a credential's articulated common courses — the CCR
  // identity's subject token ("CNSR M10AA" → CNSR, "EMS 100" → EMS,
  // "BIOL C1000" → BIOL). Representative, cached per row.
  function subjOf(r) {
    if (r._subj !== undefined) return r._subj;
    var counts = {}, best = "", bestN = 0;
    (r.articulations || []).forEach(function (a) {
      var tok = a && a.cid ? String(a.cid).split(/\s+/)[0] : "";
      if (!/^[A-Za-z][A-Za-z-]{1,7}$/.test(tok)) return;
      counts[tok] = (counts[tok] || 0) + 1;
      if (counts[tok] > bestN) { bestN = counts[tok]; best = tok; }
    });
    r._subj = best || null;
    return r._subj;
  }

  // CPL types with the curated override applied (v2 round 3 — the
  // apprenticeship tagging lane; cpl_type_override is overlay-only like
  // discipline/subj).
  function cplTypesOf(r) {
    var ov = state.overlay[r.unified_title] || {};
    if (ov.cpltype_override) return [ov.cpltype_override];
    return r.cpl_types || [];
  }

  // Originating colleges for a row (cached) — the audit-stamped entering
  // college(s), falling back to articulating colleges (niColleges).
  function collegesOf(r) {
    if (r._colleges) return r._colleges;
    r._colleges = niColleges(r).names;
    return r._colleges;
  }

  // Lane membership for the main-grid lanes ("unc"/"noiss"/"merge" render the
  // triage sections instead — see render()).
  function inLane(r, lane) {
    if (lane === "open") return !r.curator_reviewed_at;
    if (lane === "done") return !!r.curator_reviewed_at;
    return true;  // "all"
  }

  // Draft plumbing — the grid's unsaved in-cell edits. Baselines come from
  // the overlay-applied row so an untouched input is never "dirty".
  function draftOf(r) {
    var ut = r.unified_title;
    if (!state.rowDraft[ut]) {
      var ov = state.overlay[ut] || {};
      state.rowDraft[ut] = {
        title: r.display_title || ut,
        issuer: r.primary_issuer || "",
        extra: splitIssuers(ov.issuer2_override || ""),
        trainer: r.primary_trainer || "",
        disc: r.disc_modal || "",
        subj: subjOf(r) || "",
      };
    }
    return state.rowDraft[ut];
  }
  function rowIsDirty(r) {
    var ut = r.unified_title;
    if (!state.rowDraft[ut] || state.rowSaved[ut]) return false;
    var d = state.rowDraft[ut];
    var ov = state.overlay[ut] || {};
    var extraBase = splitIssuers(ov.issuer2_override || "").join(" | ");
    return d.title !== (r.display_title || ut)
      || d.issuer !== (r.primary_issuer || "")
      || d.extra.filter(function (x) { return x.trim(); }).join(" | ") !== extraBase
      || d.trainer !== (r.primary_trainer || "")
      || d.disc !== (r.disc_modal || "")
      || d.subj.trim().toUpperCase() !== (subjOf(r) || "");
  }
  function dirtyRows() {
    return state.rows.filter(function (r) { return rowIsDirty(r); });
  }

  // ── ⬇ extract buttons (2026-07-09, Sam) — live credential layer, overlay
  // included. CSV opens in Excel (the funding-tab precedent); JSON is the
  // full canonical record set.
  function downloadBlob(name, mime, text) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 0);
  }
  function exportRecords() {
    return state.rows.map(function (r) {
      var ov = state.overlay[r.unified_title] || {};
      return {
        unified_title: r.display_title || r.unified_title,
        kb_key: r.unified_title,
        issuing_agency: r.primary_issuer || null,
        additional_issuing_agencies: splitIssuers(ov.issuer2_override || ""),
        all_recorded_issuers: r.issuers || (r.primary_issuer ? [r.primary_issuer] : []),
        training_agency: r.primary_trainer || null,
        subj: subjOf(r),
        discipline: r.disc_modal || null,
        top_code: r.top_modal || null,
        cpl_types: cplTypesOf(r),
        statewide_ccc: !!r.statewide,
        students_served: (typeof r.students_served === "number") ? r.students_served
          : (r.served_suppressed ? "<5" : null),
        eligible_credit_units: (typeof r.eligible_credits === "number") ? r.eligible_credits : null,
        quality_flag: r.flag_label || null,
        confidence_title: (typeof r.conf_modal === "number") ? r.conf_modal : null,
        initiated_by: r.curator_reviewed_by || null,
        initiated_at: r.curator_reviewed_at || null,
        raw_variants: (r.raw_variants || []).map(function (v) { return v.raw_title; }),
        articulations: (r.articulations || []).map(function (a) {
          return {
            course_id: a.cid, id_system: a.sys, title: a.t,
            discipline: a.disc || null,
            local_courses: (a.local || []).map(function (lc) {
              return { code: ((lc.subj || "") + " " + (lc.num || "")).trim(),
                       title: lc.t || null, units: (lc.u != null ? lc.u : null),
                       colleges: lc.colleges || [] };
            }),
          };
        }),
      };
    });
  }
  function csvCell(v) {
    if (v == null) v = "";
    v = String(v);
    return (/[",\n]/.test(v)) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function exportCsv() {
    var head = ["Unified Title", "Issuing Agency", "Additional Issuers", "Training Agency",
      "SUBJ", "Discipline", "TOP", "CPL Types", "Statewide (CCC)", "Students",
      "Eligible Units", "Quality Flag", "Confidence", "Initiated By", "Initiated On",
      "Raw Variants", "Articulated Courses"];
    var lines = [head.join(",")];
    exportRecords().forEach(function (x) {
      lines.push([
        x.unified_title, x.issuing_agency, x.additional_issuing_agencies.join(" | "),
        x.training_agency, x.subj, x.discipline, x.top_code,
        x.cpl_types.join(" | "), x.statewide_ccc ? "yes" : "",
        x.students_served, x.eligible_credit_units, x.quality_flag,
        x.confidence_title, x.initiated_by,
        x.initiated_at ? x.initiated_at.slice(0, 10) : "",
        x.raw_variants.join(" | "),
        x.articulations.map(function (a) { return a.course_id; }).join(" | "),
      ].map(csvCell).join(","));
    });
    var d = new Date().toISOString().slice(0, 10);
    downloadBlob("credential_reference_" + d + ".csv",
      "text/csv;charset=utf-8", "\uFEFF" + lines.join("\r\n"));
  }
  function exportJson() {
    var d = new Date().toISOString().slice(0, 10);
    var payload = {
      _meta: {
        generated_at: new Date().toISOString(),
        source: "COBI Credential Reference (canonical credential layer)",
        rows: state.rows.length,
        note: "Live view — includes Supabase curation overrides applied at export time.",
      },
      credentials: exportRecords(),
    };
    downloadBlob("credential_reference_" + d + ".json",
      "application/json", JSON.stringify(payload, null, 2));
  }

  // ─── rendering ──────────────────────────────────────────────────────────

  function renderToolbar() {
    var tb = document.getElementById("cr-toolbar");
    if (!tb) return;
    clearNode(tb);

    // ── CER v2 lean bar (2026-07-09): Search · CPL type · Discipline ·
    // Issuer · Conf · Group · ⚙ Columns · ⬇ CSV · ⬇ JSON · bulk · Save all ·
    // auth. The audit-tag dropdown + quality-flag checkbox retired from the
    // bar (both live on in the drawer); the ⚠ Triage button became lanes.

    // Search first — the highest-frequency control.
    var search = el("input", {
      class: "cr-filter cr-search-wide", id: "cr-search", type: "search",
      placeholder: "Search title, raw variant, issuer…",
      autocomplete: "off",
    });
    search.value = state.search;
    search.oninput = function () {
      state.search = this.value.toLowerCase();
      render();
    };
    tb.appendChild(search);

    // CPL type (new) — union of the rows' cpl_types.
    var cplSet = {};
    state.rows.forEach(function (r) {
      cplTypesOf(r).forEach(function (t) { if (t) cplSet[t] = true; });
    });
    var cplSel = el("select", { class: "cr-filter", id: "cr-cpltype-filter", title: "CPL type" });
    cplSel.appendChild(el("option", { value: "all" }, ["CPL type: any"]));
    Object.keys(cplSet).sort().forEach(function (t) {
      var o = el("option", { value: t }, [t]);
      if (t === state.cplTypeFilter) o.selected = true;
      cplSel.appendChild(o);
    });
    cplSel.onchange = function () { state.cplTypeFilter = this.value; render(); };
    tb.appendChild(cplSel);

    // Discipline (new) — union of disc_modal.
    var discSet = {};
    state.rows.forEach(function (r) { if (r.disc_modal) discSet[r.disc_modal] = true; });
    var discSel = el("select", { class: "cr-filter", id: "cr-disc-filter", title: "Discipline" });
    discSel.appendChild(el("option", { value: "all" }, ["Discipline: any"]));
    Object.keys(discSet).sort().forEach(function (d) {
      var o = el("option", { value: d }, [d]);
      if (d === state.discFilter) o.selected = true;
      discSel.appendChild(o);
    });
    discSel.onchange = function () { state.discFilter = this.value; render(); };
    tb.appendChild(discSel);
    if (!document.getElementById("cr-disc-datalist")) {
      var discDl = document.createElement("datalist");
      discDl.id = "cr-disc-datalist";
      Object.keys(discSet).sort().forEach(function (d2) {
        discDl.appendChild(el("option", { value: d2 }));
      });
      tb.appendChild(discDl);
    }

    // SUBJ code filter (S110) — datalist-backed input like the college
    // filter (hundreds of distinct SUBJ4s). Matches subjOf(), so overlay
    // subj_override values (e.g. the CARP queue fills) are first-class.
    var subjSet = {};
    state.rows.forEach(function (r) {
      var s = subjOf(r);
      if (s) subjSet[String(s).toUpperCase()] = true;
    });
    var subjDlId = "cr-subj-list";
    var subjDl = document.getElementById(subjDlId);
    if (!subjDl) {
      subjDl = document.createElement("datalist");
      subjDl.id = subjDlId;
      tb.appendChild(subjDl);
    }
    clearNode(subjDl);
    Object.keys(subjSet).sort().forEach(function (s2) {
      subjDl.appendChild(el("option", { value: s2 }));
    });
    var subjInput = el("input", {
      class: "cr-filter cr-subj-filter", id: "cr-subj-filter", type: "search",
      placeholder: "SUBJ…",
      list: subjDlId, autocomplete: "off",
      title: "Filter by SUBJ code (the CCR canonical SUBJ4 — derived from articulations, or the curated SUBJ override).",
    });
    if (state.subjFilter !== "all") subjInput.value = state.subjFilter;
    subjInput.oninput = function () {
      var v = this.value.trim().toUpperCase();
      state.subjFilter = (v && subjSet[v]) ? v : "all";
      render();
    };
    tb.appendChild(subjInput);

    // Originating-college filter (v2 round 3) — audit-stamped entering
    // college(s), falling back to articulating; "CCC (statewide)" = the
    // statewide-collaborative rows.
    var collegeSet = {};
    state.rows.forEach(function (r) {
      collegesOf(r).forEach(function (c2) { if (c2) collegeSet[c2] = true; });
    });
    var colDlId = "cr-college-list";
    var colDl = document.getElementById(colDlId);
    if (!colDl) {
      colDl = document.createElement("datalist");
      colDl.id = colDlId;
      tb.appendChild(colDl);
    }
    clearNode(colDl);
    colDl.appendChild(el("option", { value: "CCC (statewide)" }));
    Object.keys(collegeSet).sort().forEach(function (c3) {
      colDl.appendChild(el("option", { value: c3 }));
    });
    var collegeInput = el("input", {
      class: "cr-filter", id: "cr-college-filter", type: "search",
      placeholder: "College… (originating)",
      list: colDlId, autocomplete: "off",
      title: "Filter to credentials entered by (or articulated at) one college. Pick \"CCC (statewide)\" for the statewide-collaborative rows.",
    });
    if (state.collegeFilter !== "all") {
      collegeInput.value = state.collegeFilter === "__ccc__"
        ? "CCC (statewide)" : state.collegeFilter;
    }
    collegeInput.oninput = function () {
      var v = this.value.trim();
      if (!v) state.collegeFilter = "all";
      else if (v === "CCC (statewide)") state.collegeFilter = "__ccc__";
      else if (collegeSet[v]) state.collegeFilter = v;
      else state.collegeFilter = "all";
      render();
    };
    tb.appendChild(collegeInput);

    // Issuer typeahead — many issuers, so a datalist-backed input.
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
      placeholder: "Issuer… (\"(none)\" = local)",
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

    // Confidence band — compact labels.
    var bandSel = el("select", { class: "cr-filter", id: "cr-band-filter", title: "Title-confidence band" });
    [
      ["all", "Conf: any"],
      ["0.95-1.00", "Conf: 0.95–1.00"],
      ["0.80-0.94", "Conf: 0.80–0.94"],
      ["0.60-0.79", "Conf: 0.60–0.79"],
      ["0.40-0.59", "Conf: 0.40–0.59"],
      ["<0.40",     "Conf: <0.40"],
    ].forEach(function (opt) {
      var o = el("option", { value: opt[0] }, [opt[1]]);
      if (opt[0] === state.bandFilter) o.selected = true;
      bandSel.appendChild(o);
    });
    bandSel.onchange = function () { state.bandFilter = this.value; render(); };
    tb.appendChild(bandSel);

    // Group-by (unchanged behavior).
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
      state.collapsedGroups = (this.value === "gearea") ? { "gearea:~~none": true } : {};
      render();
    };
    tb.appendChild(groupSel);

    // ⚙ Columns picker — per-browser (cplCerCols.v1).
    var colsDd = el("details", { class: "cr-cols-dd", id: "cr-cols-dd" });
    colsDd.appendChild(el("summary", { title: "Show/hide columns (saved per-browser)" }, ["⚙ Columns"]));
    var colsPanel = el("div", { class: "cr-cols-panel" });
    [
      ["subj", "SUBJ"], ["disc", "Discipline"], ["issuer", "Issuing agency"],
      ["trainer", "Trainer"], ["students", "Students"],
      ["variants", "Variants #"], ["conf", "Confidence"], ["elig", "Eligible units"],
    ].forEach(function (c) {
      var lab = el("label", null);
      var cb = el("input", { type: "checkbox" });
      cb.checked = !!visCols()[c[0]];
      cb.onchange = function () {
        state.visCols[c[0]] = cb.checked;
        saveColPrefs();
        render();
      };
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(" " + c[1]));
      colsPanel.appendChild(lab);
    });
    var resetW = el("button", { type: "button", class: "cr-export-btn cr-resetw-btn",
      title: "Reset all column widths to automatic." }, ["↺ reset widths"]);
    resetW.onclick = function () {
      state.colWidths = {};
      saveColWidths();
      render();
    };
    resetW.style.marginTop = "6px";
    colsPanel.appendChild(resetW);
    colsDd.appendChild(colsPanel);
    tb.appendChild(colsDd);

    // ⬇ extract buttons — the live canonical layer (overlay applied).
    var csvBtn = el("button", { type: "button", class: "cr-export-btn",
      title: "Download the full credential layer as CSV (opens in Excel). Live — curation overrides included." },
      ["⬇ Excel (CSV)"]);
    csvBtn.onclick = exportCsv;
    tb.appendChild(csvBtn);
    var jsonBtn = el("button", { type: "button", class: "cr-export-btn",
      title: "Download the full credential layer as JSON. Live — curation overrides included." },
      ["⬇ JSON"]);
    jsonBtn.onclick = exportJson;
    tb.appendChild(jsonBtn);

    // Bulk-action button — refreshed in place by renderBulkAction() so the
    // toolbar doesn't rebuild on every selection change (preserves focus +
    // dropdown state).
    tb.appendChild(el("span", { id: "cr-bulk", class: "cr-bulk" }));
    renderBulkAction();

    // 💾 Save all — appears only with unsaved grid edits; refreshed in place.
    tb.appendChild(el("span", { id: "cr-saveall-slot" }));
    refreshSaveAll();

    // Auth widget — separate so renderAuth() can refresh in place
    // without rebuilding the toolbar (keeps search focus).
    tb.appendChild(el("span", { id: "cr-auth", class: "cr-auth" }));
    renderAuth();
    renderLanes();  // lane counts ride every toolbar refresh (in-place saves)
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
    renderLanes();
    if (state.worklistOpen) { renderWorklist(); return; }
    // v2 triage lanes reuse the (already in-cell) worklist sections.
    if (state.lane === "unc" || state.lane === "noiss" || state.lane === "merge") {
      renderWorklist(state.lane === "unc" ? "unc" : state.lane);
      return;
    }
    var filtered = state.rows.filter(function (r) { return passesFilter(r, state); });
    filtered = sortRows(filtered, state.sort);
    renderSummary(state.rows, filtered);
    renderBulkAction();
    refreshSaveAll();

    var wrap = document.getElementById("cr-table-wrap");
    if (!wrap) return;
    clearNode(wrap);
    ensureWorklistDatalists();  // grid inputs share the title/issuer datalists

    var table = el("table", { class: "cr-table cr-grid-v2" });
    var vc = visCols();
    var COLS = [
      { key: null,            label: "" },  // checkbox — header rendered separately below
      { key: null,            label: "" },  // expand caret
      { key: "unified_title", label: "Credential",
        title: "The canonical unified credential name. Edit right here (signed-in); the line beneath shows scope chips + the raw college-entered title(s)." },
    ];
    if (vc.subj) COLS.push({ key: "subj", label: "SUBJ",
      title: "Modal SUBJ4 across this credential's articulated common courses (the CCR identity's subject token)." });
    if (vc.disc) COLS.push({ key: "disc_modal", label: "Discipline",
      title: "Predominant MQ discipline across this credential's articulated common courses." });
    if (vc.issuer) COLS.push({ key: "primary_issuer", label: "Issuing Agency",
      title: "The certifying body. Edit right here; ＋ issuer records additional certifying bodies (never replacing the primary). Empty + Save = \"no formal issuer (local exhibit)\"." });
    if (vc.trainer) COLS.push({ key: "primary_trainer", label: "Trainer",
      title: "Training agency (when distinct from the issuer — Rule 5f)." });
    if (vc.students) COLS.push({ key: "students", label: "Students",
      title: "Students eligible for CPL credit recommendations for this credential, statewide — a volume signal for prioritizing curation, not a distinct headcount. <5 masked for privacy; populates on the daily MAP pull." });
    if (vc.variants) COLS.push({ key: "raw_count", label: "Var",
      title: "Number of distinct college-entered MAP exhibit titles collapsed under this unified title." });
    if (vc.conf) COLS.push({ key: "conf_modal", label: "Conf",
      title: "Modal title confidence / issuer confidence across the raw variants (title · issuer)." });
    if (vc.elig) COLS.push({ key: "eligible", label: "Elig. units",
      title: "Statewide CPL credit-UNITS eligible for this credential (MAP Exhibit CRs Catalog). Credit units, not a headcount." });
    COLS.push({ key: "reviewed", label: "Status",
      title: "💾 Save appears on rows with unsaved in-cell edits. ✓ Init = a one-time review sign-off recording that you checked the AI classification (who + when) — it changes nothing in the data and is never required. ✎ opens the full Curate panel." });

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
      var wsaved = col.key && colWidths()[col.key];
      if (wsaved) {
        th.style.width = wsaved + "px";
        table.style.tableLayout = "fixed";
      }
      if (col.key) attachResize(th, col.key, table);
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
      filtered.forEach(function (r) { appendRowSafe(tbody, r, COLS.length); });
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
          rowsInGroup.forEach(function (r) { appendRowSafe(tbody, r, COLS.length); });
        }
      });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  // Row-level error isolation (Session 104 — Sam reported the list vanishing
  // around an expand/collapse of the first row). render() is all-or-nothing:
  // it clears the wrap up front and re-attaches only at the end, so ONE row
  // whose render throws (e.g. a malformed field in the daily-regenerated
  // payload) would previously destroy the entire table. Now a bad row degrades
  // to an inline ⚠ placeholder and every other row still renders.
  function appendRowSafe(tbody, r, ncols) {
    try {
      tbody.appendChild(renderRow(r));
      if (state.expanded[r.unified_title]) {
        tbody.appendChild(renderExpandedRow(r, ncols));
      }
    } catch (e) {
      if (window.console && console.error) {
        console.error("CER row render failed:", r && r.unified_title, e);
      }
      tbody.appendChild(el("tr", { class: "cr-row-error" }, [
        el("td", { colspan: String(ncols) },
          ["⚠ Could not render “"
           + ((r && (r.display_title || r.unified_title)) || "?")
           + "” — see the console; the rest of the list is unaffected."])
      ]));
    }
  }

  // ── Merge-suggestion engine (v2 round 2, 2026-07-09 — Sam: "add a chip
  // for any title that you think should be merged"). Rows whose NORMALIZED
  // title signature collides are likely the same credential entered twice
  // (the exhibit-unification analog of the CCR's _sug_sig): lowercase,
  // parentheticals dropped, cert/license/exam-family stopwords dropped,
  // roman numerals folded to digits, tokens sorted. NEVER auto-applied —
  // the ⇆ chip opens a panel and the click routes through the standard
  // PR-5b/2 confirm-merge flow (rename to the existing key + merge_confirm).
  var _MERGE_STOP = { certification:1, certificate:1, cert:1, certified:1,
    license:1, licensure:1, licensed:1, exam:1, examination:1, credential:1,
    the:1, a:1, an:1, of:1, "for":1, "in":1, and:1 };
  var _MERGE_ROMAN = { i:"1", ii:"2", iii:"3", iv:"4", v:"5" };
  function mergeSig(title) {
    var toks = String(title || "").toLowerCase()
      .replace(/\(.*?\)/g, " ")
      .replace(/[^a-z0-9+#]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) { return _MERGE_ROMAN[w] || w; })
      .filter(function (w) { return !_MERGE_STOP[w]; });
    return toks.length ? toks.sort().join(" ") : null;
  }
  function mergeSuggestions() {
    if (state._mergeSug) return state._mergeSug;
    var buckets = {};
    (state.rows || []).forEach(function (r) {
      var ov = state.overlay[r.unified_title] || {};
      if ((ov.utitle_override || "").trim()
          && mergeTargetFor(r, ov.utitle_override)) return;  // already merging
      var sig = mergeSig(r.display_title || r.unified_title);
      if (!sig) return;
      (buckets[sig] = buckets[sig] || []).push(r.unified_title);
    });
    var map = {};
    Object.keys(buckets).forEach(function (sig) {
      if (buckets[sig].length > 1) {
        buckets[sig].forEach(function (ut) { map[ut] = buckets[sig]; });
      }
    });
    state._mergeSug = map;
    return map;
  }

  // ─── CER v2 lane chips (2026-07-09) — the Triage queues as filters over
  // one surface. Injected before the toolbar (regen-proof).
  function renderLanes() {
    var tbEl = document.getElementById("cr-toolbar");
    if (!tbEl) return;
    var host = document.getElementById("cr-lanes");
    if (!host) {
      host = el("div", { id: "cr-lanes", class: "cr-lanes" });
      tbEl.parentNode.insertBefore(host, tbEl);
    }
    clearNode(host);
    var uncN = "(…)";
    if (state.unclassified) {
      var uncOpen = state.unclassified.filter(function (it) {
        var a = state.unclassAssign[it.raw_title];
        return !(a && a.title);
      }).length;
      var uncAssigned = state.unclassified.length - uncOpen;
      uncN = uncOpen ? "(" + uncOpen + ")"
        : uncAssigned ? "(" + uncAssigned + " awaiting fold)" : "(0)";
    }
    var doneN = 0;
    state.rows.forEach(function (r) { if (r.curator_reviewed_at) doneN++; });
    var niQueue = issuerQueue();
    var staged = niQueue.filter(function (r) { return state.issuerPreseed[r.unified_title]; }).length;
    var lanes = [
      { k: "all",   label: "All", n: state.rows.length,
        title: "Every canonical credential." },
      { k: "unc",   label: "📥 Unclassified", nText: uncN,
        title: "Raw MAP exhibit titles with no credential identity yet — assign each a unified title. Saved assignments fold on the daily sync (\"awaiting fold\")." },
      { k: "noiss", label: "🏷 No issuer", n: niQueue.length,
        title: "Classified credentials still needing agency/title triage."
          + (staged ? " ⚡ " + staged + " pre-filled from the staged plan." : "") },
      { k: "merge", label: "⇒ Merge confirms", n: pendingMerges().length,
        title: "Saved renames that match an EXISTING credential — confirm the merge or re-title." },
      { k: "open",  label: "○ Not initiated", n: state.rows.length - doneN,
        title: "Awaiting a one-time curator sign-off. \"Initiated\" only records that a human reviewed the AI classification (who + when) — it never changes the data, and no other action is required. Work these at your own pace." },
      { k: "done",  label: "✓ Initiated", n: doneN,
        title: "A curator has signed off on the AI classification (the ✓ name · date stamp on the row). Purely a review receipt — the data is identical either way." },
    ];
    lanes.forEach(function (l) {
      var active = state.lane === l.k && !state.worklistOpen;
      var b = el("button", { type: "button", title: l.title,
        class: "cr-lane" + (active ? " active" : "") });
      b.appendChild(document.createTextNode(l.label + " "));
      b.appendChild(el("span", { class: "cr-lane-n" },
        [l.nText || (l.n == null ? "(…)" : "(" + l.n + ")")]));
      b.onclick = function () { setLane(l.k); };
      host.appendChild(b);
    });
  }

  // 💾 Save all (N) — toolbar slot, refreshed in place on every edit/save.
  function refreshSaveAll() {
    var slot = document.getElementById("cr-saveall-slot");
    if (!slot) return;
    clearNode(slot);
    if (!state.sess) return;
    var dirty = dirtyRows();
    if (!dirty.length) return;
    var b = el("button", { type: "button", class: "cr-saveall",
      title: "Save every row with unsaved in-cell edits." },
      ["💾 Save all (" + dirty.length + ")"]);
    b.onclick = function () {
      b.disabled = true; b.textContent = "saving…";
      Promise.all(dirtyRows().map(function (r) { return saveGridRowCore(r); }))
        .then(function (results) {
          var failed = results.filter(function (x) { return !x.ok; }).length;
          if (failed) toast(failed + " row(s) failed to save — retry from the row", true);
          else toast("Saved " + results.length + " rows");
          render();
        });
    };
    slot.appendChild(b);
  }

  // Data-level row save shared by the per-row 💾 and Save-all. Diffs the
  // draft against the overlay-applied baseline and writes ONLY changed
  // fields via the existing override lanes (so Mode A2 / the rename apply
  // see exactly the rows the Curate panel would have written).
  function saveGridRowCore(r) {
    var ut = r.unified_title;
    if (!state.sess || !rowIsDirty(r)) return Promise.resolve({ ok: true, noop: true });
    var d = draftOf(r);
    var ov = state.overlay[ut] || {};
    var writes = [];
    var titleVal = (d.title || "").trim();
    var titleChanged = titleVal !== (r.display_title || ut);
    var target = null;
    if (titleChanged) {
      if (!titleVal) return Promise.resolve({ ok: false, err: "empty title" });
      target = mergeTargetFor(r, titleVal);
      if (target && !window.confirm(mergeConfirmMessage(r, titleVal))) {
        return Promise.resolve({ ok: false, err: "merge declined" });
      }
      writes.push(saveOverride(ut, FIELD_UTITLE_OVERRIDE, titleVal));
      if (target) writes.push(saveOverride(ut, FIELD_UTITLE_MERGE_CONFIRM, titleVal));
      else if (ov.merge_confirm) writes.push(clearOverride(ut, FIELD_UTITLE_MERGE_CONFIRM));
    }
    var issuerVal = (d.issuer || "").trim();
    var issuerChanged = issuerVal !== (r.primary_issuer || "");
    if (issuerChanged) writes.push(saveOverride(ut, FIELD_ISSUER_OVERRIDE, issuerVal));
    var extraJoined = (d.extra || []).map(function (s) { return (s || "").trim(); })
      .filter(function (s) { return s; }).join(" | ");
    var extraBase = splitIssuers(ov.issuer2_override || "").join(" | ");
    var extraChanged = extraJoined !== extraBase;
    if (extraChanged) {
      writes.push(extraJoined
        ? saveOverride(ut, FIELD_ISSUER2_OVERRIDE, extraJoined)
        : clearOverride(ut, FIELD_ISSUER2_OVERRIDE));
    }
    var trainerVal = (d.trainer || "").trim();
    var trainerChanged = trainerVal !== (r.primary_trainer || "");
    if (trainerChanged) writes.push(saveOverride(ut, FIELD_TRAINER_OVERRIDE, trainerVal));
    var discVal = (d.disc || "").trim();
    var discChanged = discVal !== (r.disc_modal || "");
    if (discChanged) writes.push(discVal
      ? saveOverride(ut, FIELD_DISC_OVERRIDE, discVal)
      : clearOverride(ut, FIELD_DISC_OVERRIDE));
    var subjVal = (d.subj || "").trim().toUpperCase();
    var subjChanged = subjVal !== (subjOf(r) || "");
    if (subjChanged) writes.push(subjVal
      ? saveOverride(ut, FIELD_SUBJ_OVERRIDE, subjVal)
      : clearOverride(ut, FIELD_SUBJ_OVERRIDE));
    if (!writes.length) { delete state.rowDraft[ut]; return Promise.resolve({ ok: true, noop: true }); }
    return Promise.all(writes).then(function (rs) {
      if (!rs.every(function (resp) { return resp && resp.ok; })) return { ok: false };
      var now = new Date().toISOString();
      var o = state.overlay[ut] = state.overlay[ut] || {};
      if (titleChanged) {
        o.utitle_override = titleVal;
        o.merge_confirm = target ? titleVal : "";
        r.display_title = titleVal;
        r.utitle_overridden_at = now;
      }
      if (issuerChanged) {
        o.issuer_override = issuerVal;
        if (r.original_primary_issuer === undefined) r.original_primary_issuer = r.primary_issuer;
        r.primary_issuer = issuerVal || null;
        r.issuer_overridden_at = now;
        addIssuerOption(issuerVal);
      }
      if (extraChanged) o.issuer2_override = extraJoined;
      if (trainerChanged) {
        o.trainer_override = trainerVal;
        r.primary_trainer = trainerVal || null;
        r.trainer_overridden_at = now;
      }
      if (discChanged) {
        o.disc_override = discVal;
        if (r.original_disc_modal === undefined) r.original_disc_modal = r.disc_modal;
        r.disc_modal = discVal || r.original_disc_modal;
        r.disc_overridden_at = discVal ? now : undefined;
      }
      if (subjChanged) {
        o.subj_override = subjVal;
        if (subjVal) { r._subj = subjVal; r.subj_overridden_at = now; }
        else { delete r._subj; r.subj_overridden_at = undefined; }
      }
      if (titleChanged) state._mergeSug = null;  // signatures moved
      delete state.rowDraft[ut];
      state.rowSaved[ut] = true;
      return { ok: true };
    }).catch(function () { return { ok: false }; });
  }
  // DOM wrapper — in-place row feedback, never a full re-render (typed input
  // in OTHER rows must survive; the worklist's applySavedAssignment lesson).
  function saveGridRow(r, tr) {
    var btn = tr.querySelector(".cr-grid-save");
    if (btn) { btn.disabled = true; btn.textContent = "saving…"; }
    saveGridRowCore(r).then(function (res) {
      if (!res.ok) {
        tr.classList.add("cr-save-failed");
        if (btn) { btn.disabled = false; btn.textContent = "retry"; }
        if (res.err !== "merge declined") toast("Save failed", true);
        return;
      }
      tr.classList.remove("cr-dirty", "cr-save-failed");
      tr.classList.add("cr-saved");
      refreshRowStatus(r, tr);
      refreshSaveAll();
      renderLanes();
      toast("Saved · " + (r.display_title || r.unified_title));
    });
  }
  function markRowDirty(r, tr) {
    delete state.rowSaved[r.unified_title];
    tr.classList.remove("cr-saved", "cr-save-failed");
    if (rowIsDirty(r)) tr.classList.add("cr-dirty");
    else tr.classList.remove("cr-dirty");
    refreshRowStatus(r, tr);
    refreshSaveAll();
  }

  // Status/action cell — rebuilt in place as the row moves through
  // clean → dirty → saved. Keeps the Mark-initiated flow + a compact ✎
  // (quality flag + the rest live in the drawer's Curate panel).
  function refreshRowStatus(r, tr) {
    var td = tr.querySelector(".cr-action-cell");
    if (!td) return;
    clearNode(td);
    var ut = r.unified_title;
    if (state.sess && rowIsDirty(r)) {
      var sv = el("button", { type: "button", class: "cr-grid-save",
        title: "Save this row's edits (Enter in any cell also saves)." },
        ["💾 Save"]);
      sv.onclick = function () { saveGridRow(r, tr); };
      td.appendChild(sv);
      return;
    }
    if (state.rowSaved[ut]) {
      td.appendChild(el("span", { class: "cr-rev-on" }, ["✓ saved"]));
    }
    if (r.curator_reviewed_at) {
      var who = (r.curator_reviewed_by || "").split("@")[0];
      var when = r.curator_reviewed_at.slice(0, 10);
      td.appendChild(el("span", {
        class: "cr-rev-on",
        title: "Initiated by " + (r.curator_reviewed_by || "?") + " on " + when
      }, ["✓ " + who + " · " + when]));
    } else if (state.sess) {
      var b = el("button", {
        type: "button", class: "cr-action-btn",
        title: "Mark this unified title as initiated (curator-acknowledged classification)."
      }, ["✓ Init"]);
      b.onclick = function () {
        if (!confirm("Mark \"" + r.unified_title + "\" initiated?\n\n"
            + "This records that you've reviewed the AI classification + "
            + "issuer attribution. It doesn't change the underlying data.")) return;
        b.disabled = true; b.textContent = "Saving…";
        saveInitiated(r.unified_title)
          .then(function (resp) {
            if (!resp.ok) {
              b.disabled = false; b.textContent = "✓ Init";
              toast("Save failed (" + resp.status + ")", true); return;
            }
            r.curator_reviewed_at = new Date().toISOString();
            r.curator_reviewed_by = state.sess.email;
            state.overlay[r.unified_title] = state.overlay[r.unified_title] || {};
            state.overlay[r.unified_title].reviewed_at = r.curator_reviewed_at;
            state.overlay[r.unified_title].reviewed_by = r.curator_reviewed_by;
            toast("Initiated · " + r.unified_title);
            render();
          })
          .catch(function () {
            b.disabled = false; b.textContent = "✓ Init";
            toast("Save failed (network)", true);
          });
      };
      td.appendChild(b);
    }
    if (state.sess) {
      var curOpenNow = !!state.curateOpen[ut];
      var more = el("button", {
        type: "button",
        class: "cr-curate-toggle cr-action-curate" + (curOpenNow ? " is-open" : ""),
        title: "More fields — quality flag, per-field history (opens the row's Curate panel)."
      }, ["✎"]);
      more.onclick = function () {
        var open = !state.curateOpen[ut];
        state.curateOpen[ut] = open;
        if (open) state.expanded[ut] = true;
        render();
      };
      td.appendChild(more);
    }
  }

  // In-cell input factory for the grid (the missing-issuer-lane pattern
  // promoted to the whole list). Enter saves, Escape reverts the field.
  function gridInput(r, tr, key, cls, placeholder, listId) {
    var d = draftOf(r);
    var attrs = { class: "cr-cellin " + (cls || ""), type: "text",
      value: d[key] || "", autocomplete: "off" };
    if (placeholder) attrs.placeholder = placeholder;
    if (listId && document.getElementById(listId)) attrs.list = listId;
    var inp = el("input", attrs);
    inp.disabled = !state.sess;
    inp.oninput = function () {
      d[key] = inp.value;
      markRowDirty(r, tr);
      if (key === "title") refreshMergeStrip(r, tr);
    };
    inp.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); saveGridRow(r, tr); }
      if (e.key === "Escape") {
        d[key] = key === "title" ? (r.display_title || r.unified_title)
          : key === "issuer" ? (r.primary_issuer || "")
          : key === "trainer" ? (r.primary_trainer || "")
          : key === "disc" ? (r.disc_modal || "")
          : key === "subj" ? (subjOf(r) || "") : "";
        inp.value = d[key];
        markRowDirty(r, tr);
        if (key === "title") refreshMergeStrip(r, tr);
      }
    };
    return inp;
  }

  // Inline merge-collision strip under the title input (PR-5b/2 surfaced at
  // the point of edit): typing a title that equals an EXISTING credential
  // key shows ⇒ + ✓ Confirm merge right there.
  function refreshMergeStrip(r, tr) {
    var holder = tr.querySelector(".cr-merge-slot");
    if (!holder) return;
    clearNode(holder);
    var d = draftOf(r);
    var val = (d.title || "").trim();
    if (!val || val === (r.display_title || r.unified_title)) return;
    var target = mergeTargetFor(r, val);
    if (!target) return;
    var strip = el("div", { class: "cr-merge-strip" });
    strip.appendChild(el("span", null, ["⇒ matches existing “" + val + "”"]));
    var okb = el("button", { type: "button", class: "cr-merge-confirm" }, ["✓ Confirm merge"]);
    okb.onclick = function () { saveGridRow(r, tr); };
    strip.appendChild(okb);
    holder.appendChild(strip);
  }

  // The ⇆ panel: the row's look-alikes, each with a "Merge into this"
  // action that reuses the PR-5b/2 flow (unified_title_override = the
  // target's KB key + unified_title_merge_confirm; the fold does the rest).
  function renderMergeSugPanel(r, group) {
    var panel = el("div", { class: "cr-mergesug-panel" });
    panel.appendChild(el("div", { class: "cr-mergesug-h" },
      ["Looks like the same credential — pick the row that SURVIVES:"]));
    var myIssuer = (r.primary_issuer || "").toLowerCase();
    group.forEach(function (ut2) {
      if (ut2 === r.unified_title) return;
      var cand = credKeyIndex()[ut2];
      if (!cand) return;
      var line = el("div", { class: "cr-mergesug-row" });
      var meta = [];
      if (cand.primary_issuer) meta.push(cand.primary_issuer);
      if (typeof cand.students_served === "number") meta.push(cand.students_served.toLocaleString() + " students");
      meta.push(cand.raw_count + " variant" + (cand.raw_count === 1 ? "" : "s"));
      line.appendChild(el("span", { class: "cr-mergesug-title" },
        [cand.display_title || ut2]));
      line.appendChild(el("span", { class: "cr-mergesug-meta" },
        [" · " + meta.join(" · ")]));
      var candIssuer = (cand.primary_issuer || "").toLowerCase();
      if (myIssuer && candIssuer && myIssuer !== candIssuer) {
        line.appendChild(el("span", { class: "cr-mergesug-warn",
          title: "The issuers differ (" + r.primary_issuer + " vs "
            + cand.primary_issuer + ") — these may be genuinely different credentials."
        }, [" ⚠ different issuer"]));
      }
      if (state.sess) {
        var btn = el("button", { type: "button", class: "cr-mergesug-btn",
          title: "Merge “" + (r.display_title || r.unified_title)
            + "” INTO “" + (cand.display_title || ut2)
            + "” — you'll get the standard merge confirmation." },
          ["⇆ Merge into this"]);
        btn.onclick = function () {
          var tr2 = btn.closest("tr");
          draftOf(r).title = ut2;      // the target's KB key — the fold's join
          delete state.rowSaved[r.unified_title];
          saveGridRow(r, tr2);
        };
        line.appendChild(btn);
      }
      panel.appendChild(line);
    });
    var close = el("button", { type: "button", class: "cr-mergesug-close" }, ["dismiss"]);
    close.onclick = function () { delete state.mergeSugOpen[r.unified_title]; render(); };
    panel.appendChild(close);
    return panel;
  }

  function renderRow(r) {
    var ut = r.unified_title;
    var tr = el("tr", { class: "cr-row" + (rowIsDirty(r) ? " cr-dirty" : "")
      + (state.rowSaved[ut] ? " cr-saved" : "") });

    // Per-row checkbox (auth-gated) — bulk Mark-initiated.
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
        render();
      };
      chkTd.appendChild(chk);
    }
    tr.appendChild(chkTd);

    // Expand caret — the "dig in" affordance (drawer: variants, aligned
    // courses, Curate panel with the retired columns).
    var caretTd = el("td", { class: "cr-caret-cell" });
    var caret = el("button", { type: "button", class: "cr-caret",
      title: "Open the full record — raw variants, aligned common courses, curation panel."
    }, [state.expanded[ut] ? "▾" : "▸"]);
    caret.onclick = function () {
      state.expanded[ut] = !state.expanded[ut];
      render();
    };
    caretTd.appendChild(caret);
    tr.appendChild(caretTd);

    // Credential — in-cell editable unified title + one context line.
    var titleTd = el("td", { class: "cr-title-cell" });
    if (state.sess) {
      titleTd.appendChild(gridInput(r, tr, "title", "cr-title-in",
        "unified title…", "cr-unclass-titles"));
    } else {
      var displayLabel = r.display_title || r.unified_title;
      var titleBtn = el("button", {
        type: "button", class: "cr-title-toggle",
        title: r.utitle_overridden_at
          ? "Curated label · originally: " + r.unified_title
            + " · expand for raw variants + credential record(s)"
          : "Show raw-title variants + credential record(s)"
      }, [displayLabel]);
      titleBtn.onclick = function () {
        state.expanded[r.unified_title] = !state.expanded[r.unified_title];
        render();
      };
      titleTd.appendChild(titleBtn);
    }
    if (r.utitle_overridden_at) {
      titleTd.appendChild(el("span", { class: "cr-override-marker",
        title: "Display label curated · originally: " + r.unified_title
      }, [" ✎"]));
    }
    // Context line: scope/CPL/COS chips + first raw variant (full list on
    // hover) — one nowrap row so grid rows stay short.
    var tchips = crTitleChips(r);
    if (!tchips) tchips = el("span", { class: "cr-title-chips" });
    if (r.raw_variants && r.raw_variants.length) {
      var rawFirst = r.raw_variants[0].raw_title || "";
      var rawMore = r.raw_variants.length > 1 ? "  ＋" + (r.raw_variants.length - 1) : "";
      tchips.appendChild(el("span", { class: "cr-ctx-raw",
        title: "Raw college-entered title(s):\n" + r.raw_variants.map(function (v) {
          return v.raw_title;
        }).join("\n") }, [rawFirst + rawMore]));
    }
    // ⇆ merge-suggestion chip — titles whose normalized signature collides
    // (likely the same credential entered twice). Click → inline panel;
    // merging routes through the standard confirm-merge flow.
    var sugGroup = mergeSuggestions()[ut];
    if (sugGroup && sugGroup.length > 1) {
      var nOthers = sugGroup.length - 1;
      var sugChip = el("button", { type: "button", class: "cr-chip cr-chip-mergesug",
        title: "This title looks like the same credential as " + nOthers
          + " other row" + (nOthers === 1 ? "" : "s") + " — click to review and merge."
      }, ["⇆ " + nOthers + " similar"]);
      sugChip.onclick = function (e) {
        e.stopPropagation();
        state.mergeSugOpen[ut] = !state.mergeSugOpen[ut];
        render();
      };
      tchips.appendChild(sugChip);
    }
    titleTd.appendChild(tchips);
    titleTd.appendChild(el("div", { class: "cr-merge-slot" }));
    if (sugGroup && state.mergeSugOpen[ut]) {
      titleTd.appendChild(renderMergeSugPanel(r, sugGroup));
    }
    tr.appendChild(titleTd);

    var vc = visCols();

    // SUBJ — modal SUBJ4 across the aligned common courses; in-cell
    // overridable at the credential grain (v2 round 2).
    if (vc.subj) {
      var subjTd = el("td", { class: "cr-subj-cell" });
      if (state.sess) {
        subjTd.appendChild(gridInput(r, tr, "subj", "cr-subj-in", "SUBJ"));
      } else {
        var s = subjOf(r);
        subjTd.appendChild(s
          ? el("span", { class: "cr-subj",
              title: "Modal SUBJ4 across this credential's articulated common courses." }, [s])
          : el("span", { class: "cr-null" }, ["—"]));
      }
      if (r.subj_overridden_at) {
        subjTd.appendChild(el("span", { class: "cr-override-marker",
          title: "SUBJ curated at the credential grain" }, ["✎"]));
      }
      tr.appendChild(subjTd);
    }

    // Discipline — modal MQ discipline; in-cell overridable (v2 round 2).
    if (vc.disc) {
      var discTd = el("td", { class: "cr-disc-cell" });
      if (state.sess) {
        discTd.appendChild(gridInput(r, tr, "disc", "cr-disc-in",
          "discipline…", "cr-disc-datalist"));
      } else {
        discTd.appendChild(r.disc_modal
          ? document.createTextNode(r.disc_modal)
          : el("span", { class: "cr-null" }, ["—"]));
      }
      if (r.disc_overridden_at) {
        discTd.appendChild(el("span", { class: "cr-override-marker",
          title: "Discipline curated at the credential grain · originally: "
            + (r.original_disc_modal || "(blank)") }, ["✎"]));
      }
      tr.appendChild(discTd);
    }

    // Issuing agency — in-cell editable + unlimited additional agencies.
    if (vc.issuer) {
      var issuerTd = el("td", { class: "cr-issuer-cell" });
      if (state.sess) {
        issuerTd.appendChild(gridInput(r, tr, "issuer", "cr-issuer-in",
          "issuer… (empty = no formal issuer)", "cr-issuer-list"));
        var d = draftOf(r);
        (d.extra || []).forEach(function (x, xi) {
          var attrs2 = { class: "cr-cellin cr-issuer-in2", type: "text",
            value: x || "", placeholder: "additional issuing agency…", autocomplete: "off" };
          if (document.getElementById("cr-issuer-list")) attrs2.list = "cr-issuer-list";
          var inp2 = el("input", attrs2);
          inp2.oninput = function () { d.extra[xi] = inp2.value; markRowDirty(r, tr); };
          inp2.onkeydown = function (e) {
            if (e.key === "Enter") { e.preventDefault(); saveGridRow(r, tr); }
          };
          issuerTd.appendChild(inp2);
        });
        var add = el("button", { type: "button", class: "cr-issuer-add",
          title: "Some credentials are certified by more than one body (Rule 4). "
            + "Each is ADDED alongside the primary, never replacing it." },
          ["＋ issuer"]);
        add.onclick = function () {
          draftOf(r).extra.push("");
          markRowDirty(r, tr);
          render();
        };
        issuerTd.appendChild(add);
      } else {
        issuerTd.appendChild(r.primary_issuer
          ? document.createTextNode(r.primary_issuer)
          : el("span", { class: "cr-null" }, ["(none — local)"]));
      }
      if (r.issuers && r.issuers.length > 1) {
        issuerTd.appendChild(el("span", { class: "cr-issuer-more",
          title: "All recorded certifying bodies:\n" + r.issuers.join("\n")
        }, ["+" + (r.issuers.length - 1)]));
      }
      if (r.issuer_overridden_at) {
        issuerTd.appendChild(el("span", { class: "cr-override-marker",
          title: "Issuing agency curated · originally: " +
                 (r.original_primary_issuer || "(none)")
        }, [" ✎"]));
      }
      tr.appendChild(issuerTd);
    }

    // Trainer — in-cell editable.
    if (vc.trainer) {
      var trTd = el("td", { class: "cr-trainer-cell" });
      if (state.sess) {
        trTd.appendChild(gridInput(r, tr, "trainer", "cr-trainer-in", "training agency…"));
      } else {
        trTd.appendChild(r.primary_trainer
          ? document.createTextNode(r.primary_trainer)
          : el("span", { class: "cr-null" }, ["—"]));
      }
      if (r.trainer_overridden_at) {
        trTd.appendChild(el("span", { class: "cr-override-marker",
          title: "Training agency curated" }, [" ✎"]));
      }
      tr.appendChild(trTd);
    }

    // Students (renamed from "Eligible students") — the volume signal.
    if (vc.students) {
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
    }

    // Variants # (hidable, default off).
    if (vc.variants) {
      tr.appendChild(el("td", { class: "cr-var-cell" }, [String(r.raw_count)]));
    }

    // Confidence (hidable, default off).
    if (vc.conf) {
      var _confTxt = (typeof r.conf_modal === "number") ? r.conf_modal.toFixed(2) : "—";
      var confTd = el("td", { class: "cr-conf-cell " + _bandCls(r.conf_modal),
        title: "Title confidence " + _confTxt
          + " · issuer confidence " + (typeof r.conf_issuer === "number" && r.conf_issuer ? r.conf_issuer.toFixed(2) : "—") });
      confTd.appendChild(el("span", { class: "cr-conf-title" }, [_confTxt]));
      confTd.appendChild(el("span", { class: "cr-conf-sep" }, [" / "]));
      confTd.appendChild(el("span", { class: "cr-conf-issuer" },
        [r.conf_issuer ? r.conf_issuer.toFixed(2) : "—"]));
      tr.appendChild(confTd);
    }

    // Eligible credit units (hidable, default off).
    if (vc.elig) {
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
    }

    // Status / actions — 💾 Save (dirty) · ✓ stamp/Init · ✎ more.
    var actionTd = el("td", { class: "cr-action-cell" });
    tr.appendChild(actionTd);
    refreshRowStatus(r, tr);
    refreshMergeStrip(r, tr);
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
            if (opts.field === FIELD_ISSUER_OVERRIDE) addIssuerOption(newVal);
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
      // Auto-focus the input when entering edit mode (and bring the panel
      // into view — "＋ set" can open it from a row whose panel renders
      // below the fold).
      setTimeout(function () {
        if (input.scrollIntoView) { try { input.scrollIntoView({ block: "center" }); } catch (e) {} }
        input.focus(); if (input.select) input.select();
      }, 0);
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
    if (field === FIELD_UTITLE_MERGE_CONFIRM) return "merge_confirm";
    if (field === FIELD_ISSUER_OVERRIDE)  return "issuer_override";
    if (field === FIELD_ISSUER2_OVERRIDE) return "issuer2_override";
    if (field === FIELD_TRAINER_OVERRIDE) return "trainer_override";
    if (field === FIELD_QFLAG_OVERRIDE)   return "qflag_override";
    return null;
  }
  function overlayMetaKeyFor(field, suffix) {
    if (field === FIELD_UTITLE_MERGE_CONFIRM) return "merge_confirmed_" + suffix;
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
    } else if (field === FIELD_ISSUER2_OVERRIDE) {
      r.additional_issuer = value || null;
      r.issuer2_overridden_by = email;
      r.issuer2_overridden_at = nowIso;
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
      "#tab-credential-reference #cr-subj-filter{max-width:6.5em;}" +
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
      // Scope/CPL chips under the unified title on collapsed rows — ONE row
      // (Sam, 2026-07-08: chip stacking made the rows too tall). nowrap +
      // hidden-scrollbar overflow keeps every chip reachable without adding
      // height; each chip's full story stays in its tooltip.
      "#tab-credential-reference .cr-title-chips{display:flex;flex-wrap:nowrap;gap:4px;margin:3px 0 0 18px;overflow-x:auto;scrollbar-width:none;}" +
      "#tab-credential-reference .cr-title-chips::-webkit-scrollbar{display:none;}" +
      "#tab-credential-reference .cr-title-chips .cr-chip{font-size:.62rem;padding:1px 6px;white-space:nowrap;flex:0 0 auto;}" +
      // Left-justify the Unified Title column (header + body) — overrides the
      // global center-align with higher specificity. The title cell also gets
      // room to breathe (the old max-width:32ch wrapped titles into 3-4 lines).
      "#tab-credential-reference table.cr-table td.cr-title-cell{text-align:left;max-width:none;min-width:30ch;}" +
      "#tab-credential-reference table.cr-table th:nth-child(2){text-align:left;}" +
      "#tab-credential-reference table.cr-table td{padding:6px 8px;}" +
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
      // Dark headers ride the CO seal blue, never ink/black (Sam, 2026-07-08).
      "#tab-credential-reference .cr-wl-table th{text-align:left;background:var(--seal-blue);color:#fff;padding:7px 10px;position:sticky;top:0;}" +
      "#tab-credential-reference .cr-wl-table td{padding:6px 10px;border-top:1px solid #eef2f7;vertical-align:top;}" +
      "#tab-credential-reference .cr-wl-row.cr-wl-done{background:#f0fdf4;}" +
      "#tab-credential-reference .cr-wl-raw{max-width:42ch;}" +
      "#tab-credential-reference .cr-wl-band{color:#94a3b8;font-size:.72rem;}" +
      "#tab-credential-reference .cr-wl-suggs{margin-top:3px;display:flex;flex-wrap:wrap;gap:4px;}" +
      "#tab-credential-reference .cr-wl-sugg{cursor:pointer;font-size:.68rem;text-align:left;color:var(--hunter);background:rgba(255,255,255,.6);}" +
      "#tab-credential-reference .cr-wl-sugg:hover{background:#ecfdf5;}" +
      "#tab-credential-reference .cr-wl-sugg:disabled{cursor:default;opacity:.55;}" +
      // ⤷ use-raw-title chip (S110) — the .cr-wl-sugg look in the muted-text
      // role (it's a fallback, not an identity-anchored recommendation); its
      // OWN class so suggestion-chip selectors/tests never count it.
      "#tab-credential-reference .cr-wl-rawfill{cursor:pointer;font-size:.68rem;text-align:left;color:var(--text-muted);background:rgba(255,255,255,.6);}" +
      "#tab-credential-reference .cr-wl-rawfill:hover{background:var(--surface-subtle);}" +
      "#tab-credential-reference .cr-wl-rawfill:disabled{cursor:default;opacity:.55;}" +
      "#tab-credential-reference .cr-wl-input{width:100%;min-width:15ch;padding:4px 6px;border:1px solid #cbd5e1;border-radius:5px;font-size:.82rem;}" +
      "#tab-credential-reference .cr-wl-input:disabled{background:#f8fafc;color:#94a3b8;}" +
      "#tab-credential-reference .cr-wl-act{white-space:nowrap;}" +
      "#tab-credential-reference .cr-wl-save{background:var(--cobalt);color:#fff;border:none;border-radius:5px;font-size:.78rem;font-weight:600;cursor:pointer;padding:4px 12px;}" +
      "#tab-credential-reference .cr-wl-save:disabled{opacity:.6;cursor:default;}" +
      "#tab-credential-reference .cr-wl-clear{font-size:.74rem;color:#b45309;margin-left:8px;text-decoration:none;}" +
      "#tab-credential-reference .cr-wl-clear:hover{text-decoration:underline;}" +
      "#tab-credential-reference .cr-wl-assigned-by{color:#1e7e45;font-size:.78rem;font-weight:600;}" +
      "#tab-credential-reference .cr-wl-toggle{display:flex;gap:0;margin:0 0 8px;}" +
      "#tab-credential-reference .cr-wl-toggle-btn{border:1px solid #cbd5e1;background:rgba(255,255,255,.6);color:#374151;font-size:.78rem;padding:4px 12px;cursor:pointer;}" +
      "#tab-credential-reference .cr-wl-toggle-btn:first-child{border-radius:6px 0 0 6px;}" +
      "#tab-credential-reference .cr-wl-toggle-btn:last-child{border-radius:0 6px 6px 0;border-left:none;}" +
      "#tab-credential-reference .cr-wl-toggle-on{background:var(--seal-blue);color:#fff;border-color:var(--seal-blue);font-weight:600;}" +
      "#tab-credential-reference .cr-wl-preseed-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:.8rem;color:#374151;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:6px 10px;margin:0 0 8px;}" +
      "#tab-credential-reference .cr-wl-saveall{background:var(--hunter,#166534);color:#fff;border:none;border-radius:5px;font-size:.76rem;font-weight:600;cursor:pointer;padding:4px 10px;}" +
      "#tab-credential-reference .cr-wl-saveall:disabled{opacity:.6;cursor:default;}" +
      "#tab-credential-reference .cr-wl-row.cr-wl-preseeded{background:#fffdf5;}" +
      "#tab-credential-reference .cr-wl-preseed-badge{display:inline-block;margin-left:6px;font-size:.68rem;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:9px;padding:0 6px;cursor:help;white-space:nowrap;}" +
      // Originating-college chips (Session 104) — who ENTERED the exhibit, so a
      // curator can resolve Cx rows against that college's local catalog.
      "#tab-credential-reference .cr-wl-colleges{margin-top:3px;display:flex;flex-wrap:wrap;gap:4px;}" +
      "#tab-credential-reference .cr-wl-college{display:inline-block;font-size:.68rem;color:#334155;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:9px;padding:0 6px;cursor:help;white-space:nowrap;}" +
      // Multi-issuer "+N" chip + the point-of-need "＋ set" issuer affordance
      // (Session 104 — Rule 4 multi-issuer families; the 10-Key null-issuer case).
      "#tab-credential-reference .cr-issuer-more{display:inline-block;margin-left:5px;font-size:.68rem;color:#1e40af;background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:0 6px;cursor:help;white-space:nowrap;}" +
      "#tab-credential-reference .cr-issuer-set{margin-left:6px;font-size:.68rem;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:9px;padding:0 6px;cursor:pointer;white-space:nowrap;}" +
      "#tab-credential-reference .cr-issuer-set:hover{background:#fde68a;}" +
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
      "#tab-credential-reference .cr-geap{border:1px solid var(--border-strong);border-left:4px solid var(--seal-blue);background:var(--surface-subtle);border-radius:6px;padding:8px 12px;margin:2px 0 12px;}" +
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
      "#tab-credential-reference .cr-geap-off{font-size:.74rem;font-weight:600;color:#92400e;margin-top:5px;}" +
      // ── Session 105 (2026-07-08) — glass/light consistency pass ──
      // Curation panel: its label cells are <th> INSIDE .cr-table, so the main
      // table's sticky seal-blue th rule bled in (they rendered as black boxes
      // with dark slate text — Sam's screenshot). Neutralize + restyle quiet.
      "#tab-credential-reference table.cr-table .cr-curation-tbl th{position:static;background:transparent;color:#475569;text-align:right;font-size:.8rem;z-index:auto;}" +
      "#tab-credential-reference .cr-curation-panel{background:var(--surface-opaque,#fff);border:1px solid var(--border);border-left:4px solid var(--seal-blue);}" +
      "#tab-credential-reference .cr-curation-input{background:#fff;color:var(--text-body,#3A3A36);border:1px solid #cbd5e1;border-radius:5px;padding:4px 6px;font-size:.82rem;min-width:24ch;}" +
      // A bulk/row save that failed is loud (2026-07-08 — a partial batch
      // previously read as success unless you noticed the button text).
      "#tab-credential-reference .cr-wl-row.cr-wl-save-failed{background:#fef2f2;outline:1px solid #fca5a5;}" +
      "#tab-credential-reference .cr-wl-row.cr-wl-save-failed .cr-wl-save{background:var(--crimson,#920000);}" +
      // Missing-issuer lane — its own table/row classes (cr-ni-*) mirroring
      // the worklist look, so the two lanes never mix in queries or CSS.
      "#tab-credential-reference .cr-ni-title{margin-top:22px;}" +
      "#tab-credential-reference .cr-ni-table{border-collapse:collapse;width:100%;font-size:.85rem;}" +
      "#tab-credential-reference .cr-ni-table th{text-align:left;background:var(--seal-blue);color:#fff;padding:7px 10px;position:sticky;top:0;}" +
      "#tab-credential-reference .cr-ni-table td{padding:6px 10px;border-top:1px solid #eef2f7;vertical-align:top;}" +
      "#tab-credential-reference .cr-ni-row.cr-wl-done{background:#f0fdf4;}" +
      "#tab-credential-reference .cr-mg-table{width:100%;border-collapse:collapse;margin:.4em 0 1em;}" +
      "#tab-credential-reference .cr-mg-row td{padding:.3em .5em;border-bottom:1px solid var(--border-soft,#e5e7eb);vertical-align:middle;}" +
      "#tab-credential-reference .cr-mg-old{font-weight:600;max-width:26em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      "#tab-credential-reference .cr-mg-arrow{color:var(--text-soft,#6b7280);}" +
      "#tab-credential-reference .cr-mg-input{width:100%;min-width:16em;box-sizing:border-box;}" +
      "#tab-credential-reference .cr-mg-row.cr-wl-done{background:#f0fdf4;}" +
      "#tab-credential-reference .cr-mg-row.cr-wl-save-failed{background:#fef2f2;outline:1px solid #fca5a5;}" +
      "#tab-credential-reference .cr-ni-lookup{margin-top:.25em;display:flex;align-items:center;gap:.5em;flex-wrap:wrap;}" +
      "#tab-credential-reference .cr-ni-search,#tab-credential-reference .cr-ni-suggest," +
      "#tab-credential-reference .cr-ni-tsearch,#tab-credential-reference .cr-ni-tsuggest{" +
        "background:none;border:none;padding:0;cursor:pointer;font-size:.78em;color:var(--link,#2563eb);text-decoration:underline;}" +
      "#tab-credential-reference .cr-ni-suggest:disabled,#tab-credential-reference .cr-ni-tsuggest:disabled{opacity:.5;cursor:wait;}" +
      "#tab-credential-reference .cr-ni-suggest-out,#tab-credential-reference .cr-ni-tsuggest-out{font-size:.78em;color:var(--text-soft,#6b7280);}" +
      "#tab-credential-reference .cr-ni-suggest-chip{background:#eff6ff;border:1px solid var(--link,#2563eb);" +
        "border-radius:1em;padding:.05em .6em;cursor:pointer;font-size:1em;color:var(--link,#2563eb);}" +
      "#tab-credential-reference .cr-ni-row.cr-wl-preseeded{background:#fffdf5;}" +
      "#tab-credential-reference .cr-ni-row.cr-wl-save-failed{background:#fef2f2;outline:1px solid #fca5a5;}" +
      // Session 106 — raw-title/college context + editable title in the lane.
      "#tab-credential-reference .cr-ni-table td.cr-wl-raw{width:34%;}" +
      "#tab-credential-reference .cr-ni-rawline{margin-top:3px;font-size:.72rem;color:#64748b;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}" +
      "#tab-credential-reference .cr-ni-trainer-chip{display:inline-block;margin-top:3px;font-size:.68rem;color:var(--hunter,#166534);background:#ecfdf5;border:1px solid #a7f3d0;border-radius:9px;padding:0 6px;cursor:help;white-space:nowrap;}" +
      "#tab-credential-reference .cr-ni-add-issuer{display:inline-block;margin-top:3px;font-size:.72rem;color:var(--seal-blue,#1e40af);text-decoration:none;}" +
      "#tab-credential-reference .cr-ni-add-issuer:hover{text-decoration:underline;}" +
      "#tab-credential-reference .cr-ni-iss2{margin-top:4px;}" +
      // ── CER v2 (2026-07-09) — one editable surface, full width ──
      // Full-bleed: the CER pane escapes the main-container max-width (Sam:
      // horizontal real estate is valuable; PC/laptop is the target).
      "#tab-credential-reference > .main-container{max-width:none;}" +
      // Lane chips (the Triage queues as filters over one surface).
      "#tab-credential-reference .cr-lanes{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px;}" +
      "#tab-credential-reference .cr-lane{border:1px solid var(--border-strong);background:var(--surface-opaque,#fff);color:var(--text-body,#3A3A36);border-radius:16px;padding:4px 12px;font-size:.78rem;font-weight:600;cursor:pointer;}" +
      "#tab-credential-reference .cr-lane:hover{background:var(--surface-muted,#ECE9E2);}" +
      "#tab-credential-reference .cr-lane.active{background:var(--seal-blue);color:#fff;border-color:var(--seal-blue);}" +
      "#tab-credential-reference .cr-lane-n{color:var(--text-muted,#5C5C55);font-variant-numeric:tabular-nums;}" +
      "#tab-credential-reference .cr-lane.active .cr-lane-n{color:var(--mustard-on-dark,#E3B341);}" +
      // In-cell inputs — quiet until hover/focus (the issuer-lane pattern
      // promoted to the whole grid).
      "#tab-credential-reference .cr-cellin{width:100%;font-size:.82rem;color:var(--text-strong,#1C1C1A);border:1px solid transparent;border-radius:5px;padding:4px 6px;background:transparent;font-family:inherit;box-sizing:border-box;text-align:left;}" +
      "#tab-credential-reference .cr-cellin:hover{border-color:var(--border,#d4d4d0);background:var(--surface-opaque,#fff);}" +
      "#tab-credential-reference .cr-cellin:focus{border-color:var(--cobalt,#0047AB);background:var(--surface-opaque,#fff);outline:none;}" +
      "#tab-credential-reference .cr-cellin:disabled{background:transparent;color:var(--text-muted,#5C5C55);}" +
      "#tab-credential-reference .cr-title-in{font-weight:600;}" +
      "#tab-credential-reference .cr-issuer-in2{margin-top:3px;}" +
      "#tab-credential-reference .cr-issuer-add{background:none;border:none;color:var(--cobalt,#0047AB);font-size:.7rem;font-weight:600;cursor:pointer;padding:1px 4px;}" +
      "#tab-credential-reference .cr-issuer-add:hover{text-decoration:underline;}" +
      // Dirty / saved / failed row states — the left stripe is the signal.
      "#tab-credential-reference tr.cr-dirty td:first-child{box-shadow:inset 3px 0 0 var(--mustard-fill,#E3B341);}" +
      "#tab-credential-reference tr.cr-saved td:first-child{box-shadow:inset 3px 0 0 var(--hunter,#2C601A);}" +
      "#tab-credential-reference tr.cr-save-failed{background:#fef2f2;outline:1px solid #fca5a5;}" +
      "#tab-credential-reference .cr-grid-save{background:var(--cobalt,#0047AB);color:#fff;border:none;border-radius:6px;font-size:.76rem;font-weight:600;padding:4px 10px;cursor:pointer;}" +
      "#tab-credential-reference .cr-grid-save:disabled{opacity:.6;cursor:default;}" +
      "#tab-credential-reference .cr-saveall{background:var(--cobalt,#0047AB);color:#fff;border:none;border-radius:7px;font-size:.8rem;font-weight:600;padding:6px 12px;cursor:pointer;}" +
      // Expand caret.
      "#tab-credential-reference .cr-caret{background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--text-muted,#5C5C55);padding:2px 4px;line-height:1;}" +
      "#tab-credential-reference .cr-caret:hover{color:var(--cobalt,#0047AB);}" +
      // Context line bits (chips row reused from cr-title-chips).
      "#tab-credential-reference .cr-ctx-raw{font-size:.68rem;color:var(--text-muted,#5C5C55);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;max-width:46ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto;cursor:help;}" +
      // SUBJ — mono, compact.
      "#tab-credential-reference .cr-subj{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.78rem;font-weight:700;color:var(--text-strong,#1C1C1A);}" +
      // Inline merge-collision strip under the title input (PR-5b/2 at the
      // point of edit).
      "#tab-credential-reference .cr-merge-strip{margin:4px 0 0;padding:4px 8px;border:1px solid var(--crimson,#920000);border-radius:6px;background:#FBF1F1;font-size:.72rem;color:var(--crimson,#920000);display:flex;gap:8px;align-items:center;flex-wrap:wrap;text-align:left;}" +
      "#tab-credential-reference .cr-merge-confirm{border:1px solid var(--crimson,#920000);background:var(--crimson,#920000);color:#fff;border-radius:5px;font-size:.7rem;font-weight:600;padding:2px 8px;cursor:pointer;}" +
      // ⚙ Columns popover.
      "#tab-credential-reference .cr-cols-dd{position:relative;display:inline-block;}" +
      "#tab-credential-reference .cr-cols-dd>summary{list-style:none;cursor:pointer;font-size:.8rem;font-weight:600;border:1px solid var(--border-strong);border-radius:6px;padding:6px 10px;background:var(--surface-opaque,#fff);color:var(--text-body,#3A3A36);user-select:none;}" +
      "#tab-credential-reference .cr-cols-dd>summary::-webkit-details-marker{display:none;}" +
      "#tab-credential-reference .cr-cols-dd[open]>summary{background:var(--surface-muted,#ECE9E2);}" +
      "#tab-credential-reference .cr-cols-panel{position:absolute;left:0;top:calc(100% + 4px);z-index:30;background:var(--surface-opaque,#fff);border:1px solid var(--border-strong);border-radius:8px;box-shadow:0 8px 22px rgba(28,28,26,.18);padding:10px 12px;min-width:170px;}" +
      "#tab-credential-reference .cr-cols-panel label{display:flex;gap:7px;align-items:center;font-size:.8rem;padding:3px 0;cursor:pointer;white-space:nowrap;text-align:left;}" +
      // ⬇ extract buttons.
      "#tab-credential-reference .cr-export-btn{border:1px solid var(--border-strong);background:var(--surface-opaque,#fff);border-radius:6px;font-size:.78rem;font-weight:600;padding:6px 10px;cursor:pointer;color:var(--text-body,#3A3A36);}" +
      "#tab-credential-reference .cr-export-btn:hover{border-color:var(--cobalt,#0047AB);color:var(--cobalt,#0047AB);}" +
      // v2 grid ergonomics: left-align the editable cells; compact status col.
      "#tab-credential-reference table.cr-grid-v2 td.cr-issuer-cell,#tab-credential-reference table.cr-grid-v2 td.cr-trainer-cell{text-align:left;max-width:none;}" +
      "#tab-credential-reference table.cr-grid-v2 td.cr-caret-cell{width:30px;}" +
      "#tab-credential-reference table.cr-grid-v2 .cr-action-cell{flex-direction:row;align-items:center;gap:6px;white-space:nowrap;}" +
      // ── v2 round 2 (Sam, 2026-07-09) ──
      // The tab's overall background: cream, not gray (scoped token).
      // Cream TINT, not opaque — the First Light ghost painting shows
      // through like the other tabs (Sam, round 3).
      "#tab-credential-reference{--cer-cream:rgba(254,249,218,.8);background:var(--cer-cream);}" +
      "#tab-credential-reference .cr-table-wrap{background:var(--surface-opaque,#fff);}" +
      // In-cell SUBJ (uppercase display) + Discipline inputs.
      "#tab-credential-reference .cr-subj-in{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;text-transform:uppercase;max-width:9ch;}" +
      // ⇆ merge-suggestion chip (violet = machine-suggested) + panel.
      "#tab-credential-reference .cr-chip-mergesug{color:var(--violet,#6D28D9);border-color:var(--violet,#6D28D9);background:#F6F2FD;cursor:pointer;}" +
      "#tab-credential-reference .cr-chip-mergesug:hover{background:#EDE4FB;}" +
      "#tab-credential-reference .cr-mergesug-panel{margin:5px 0 0;padding:7px 10px;border:1px solid var(--violet,#6D28D9);border-radius:6px;background:#F6F2FD;font-size:.76rem;text-align:left;}" +
      "#tab-credential-reference .cr-mergesug-h{font-weight:700;color:var(--violet,#6D28D9);margin-bottom:4px;}" +
      "#tab-credential-reference .cr-mergesug-row{padding:3px 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap;}" +
      "#tab-credential-reference .cr-mergesug-title{font-weight:600;color:var(--text-strong,#1C1C1A);}" +
      "#tab-credential-reference .cr-mergesug-meta{color:var(--text-muted,#5C5C55);}" +
      "#tab-credential-reference .cr-mergesug-warn{color:var(--mustard-text,#8B6800);font-weight:600;cursor:help;}" +
      "#tab-credential-reference .cr-mergesug-btn{border:1px solid var(--violet,#6D28D9);background:var(--violet,#6D28D9);color:#fff;border-radius:5px;font-size:.72rem;font-weight:600;padding:2px 8px;cursor:pointer;}" +
      "#tab-credential-reference .cr-mergesug-btn:disabled{opacity:.6;}" +
      "#tab-credential-reference .cr-mergesug-close{border:none;background:none;color:var(--text-muted,#5C5C55);font-size:.7rem;cursor:pointer;text-decoration:underline;padding:2px 0 0;}" +
      // ── v2 round 3 (Sam, 2026-07-09 evening) ──
      // Violet chip TEXT → CO seal blue (Sam's call; the violet
      // machine-suggested coding yields to the CO palette on this tab).
      "#tab-credential-reference .cr-chip-gen{color:var(--seal-blue,#1e40af);}" +
      "#tab-credential-reference .cr-chip-mergesug{color:var(--seal-blue,#1e40af);border-color:var(--seal-blue,#1e40af);}" +
      "#tab-credential-reference .cr-mergesug-h{color:var(--seal-blue,#1e40af);}" +
      // Header row text: white, not gold.
      "#tab-credential-reference .cr-table th{color:#fff;}" +
      "#tab-credential-reference .cr-sort-indicator.active{color:#fff;}" +
      // Column drag-resize handles (widths persist per-browser).
      "#tab-credential-reference .cr-table th{position:sticky;}" +
      "#tab-credential-reference .cr-resize{position:absolute;right:0;top:0;bottom:0;width:7px;cursor:col-resize;user-select:none;}" +
      "#tab-credential-reference .cr-resize:hover{background:rgba(255,255,255,.35);}";
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
    cplTypesOf(r).forEach(function (t) {
      c.appendChild(el("span", { class: "cr-chip cr-chip-cpl",
        title: "CPL Type" + ((state.overlay[r.unified_title] || {}).cpltype_override ? " (curated)" : "") }, [t]));
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
  // Lazy worklist-data load, shared by the legacy openWorklist path and the
  // v2 lane chips (unc / noiss / merge all need preseeds + rawColleges).
  function ensureWorklistData() {
    if (state.unclassified || state.unclassLoading) return;
    state.unclassLoading = true;
    Promise.all([fetchUnclassified(), fetchUnclassOverlay(), fetchUnclassSuggestions(), fetchUnclassPreseed(), fetchIssuerPreseed()]).then(function (parts) {
      state.unclassified = parts[0];
      state.unclassAssign = parts[1] || {};
      state.unclassSuggest = parts[2] || {};
      state.unclassPreseed = parts[3] || {};
      state.issuerPreseed = parts[4] || {};
      state.unclassLoading = false;
      renderToolbar();  // refresh counts
      render();
    });
  }
  function openWorklist() {
    state.worklistOpen = true;
    ensureWorklistData();
    renderToolbar();
    render();
  }
  function closeWorklist() {
    state.worklistOpen = false;
    state.lane = "all";
    renderToolbar();
    render();
  }
  // v2 lane switch — the triage lanes reuse the worklist sections (already
  // in-cell editable); the rest filter the main grid.
  function setLane(k) {
    state.lane = k;
    state.worklistOpen = false;
    if (k === "unc" || k === "noiss" || k === "merge") ensureWorklistData();
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
      function addIss(i) {
        if (i && !seen2[i]) { seen2[i] = 1; dl2.appendChild(el("option", { value: i })); }
      }
      state.rows.forEach(function (r) {
        addIss(r.primary_issuer);
        (r.issuers || []).forEach(addIss);  // multi-issuer credentials carry extras
      });
      // Issuers the curator already typed into worklist assignments + the
      // staged pre-seed plan — so a NEW agency becomes pickable everywhere.
      Object.keys(state.unclassAssign || {}).forEach(function (k) {
        addIss((state.unclassAssign[k] || {}).issuer);
      });
      Object.keys(state.unclassPreseed || {}).forEach(function (k) {
        addIss((state.unclassPreseed[k] || {}).issuer);
      });
      document.body.appendChild(dl2);
    }
  }

  // Keep the issuer datalists LIVE (2026-07-08 — Sam typed a brand-new agency
  // for one fire cert and it wasn't offered on the next row; the lists were
  // built once and never updated). Called after every save that carries an
  // issuer: worklist assignments, curation-panel overrides, issuer-lane saves.
  function addIssuerOption(issuer) {
    if (!issuer) return;
    ["cr-unclass-issuers", "cr-issuer-list"].forEach(function (id) {
      var dl = document.getElementById(id);
      if (!dl) return;
      var has = Array.prototype.some.call(dl.children, function (o) {
        return o.value === issuer;
      });
      if (!has) dl.appendChild(el("option", { value: issuer }));
    });
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
    // keep the view-toggle chips + pre-seed bar honest after in-place
    // saves/clears (they are only otherwise rebuilt on a full re-render)
    var total = (state.unclassified || []).length;
    var open = total - unclassAssignedCount();
    var chips = document.querySelectorAll(".cr-wl-toggle-btn");
    if (chips.length === 2) {
      chips[0].textContent = "Needs triage (" + open + ")";
      chips[1].textContent = "All (" + total + ")";
    }
  }

  // Save-success bookkeeping shared by the per-row Save button and the bulk
  // "Save all pre-filled" path: state write + IN-PLACE row update (never a
  // full re-render — unsaved input typed in other rows must survive).
  function applySavedAssignment(raw, tr, title, issuer) {
    state.unclassAssign[raw] = { title: title, issuer: issuer,
      by: state.sess && state.sess.email, at: new Date().toISOString() };
    delete state.wlDraft[raw];       // draft superseded by the saved assignment
    addIssuerOption(issuer);         // a NEW agency becomes pickable on the next row
    tr.className = "cr-wl-row cr-wl-done";
    var saveBtn = tr.querySelector(".cr-wl-save");
    if (saveBtn) saveBtn.textContent = "✓ Saved";
    var actTd = tr.querySelector(".cr-wl-act");
    if (actTd && !actTd.querySelector(".cr-wl-clear")) {
      actTd.appendChild(makeClearLink(raw, tr, actTd, saveBtn));
    }
    updateWorklistProgress();
    renderToolbar();  // triage-button count: open → awaiting-fold
  }

  function renderWorklist(section) {
    var wrap = document.getElementById("cr-table-wrap");
    if (!wrap) return;
    clearNode(wrap);
    var sum = document.getElementById("cr-summary"); if (sum) clearNode(sum);

    // v2 lane sections — each renders alone (the lane chips are the nav).
    if (section === "noiss" || section === "merge") {
      var lanePanel = el("div", { class: "cr-worklist" });
      if (state.unclassLoading && !state.unclassified) {
        lanePanel.appendChild(el("p", { class: "cr-wl-note" }, ["Loading…"]));
      } else if (section === "merge") {
        renderPendingMergesInto(lanePanel);
        if (!pendingMerges().length) {
          lanePanel.appendChild(el("p", { class: "cr-wl-note" },
            ["✓ No pending merge confirmations."]));
        }
      } else {
        renderIssuerLaneInto(lanePanel, { skipMerges: true });
      }
      wrap.appendChild(lanePanel);
      return;
    }

    var panel = el("div", { class: "cr-worklist" });
    if (!section) {
      var back = el("a", { class: "cr-wl-back", href: "#" }, ["← back to credentials"]);
      back.onclick = function (e) { e.preventDefault(); closeWorklist(); };
      panel.appendChild(back);
    }
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
      if (!section) renderIssuerLaneInto(panel);   // the missing-issuer lane still applies
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

    // View toggle (Sam, 2026-07-07: "shouldn't we have a toggle that allows me
    // to see all or just the ones needing to be triaged?"). Default = only
    // rows with no saved assignment; "All" restores the full list.
    var open = items.filter(function (it) {
      var a = state.unclassAssign[it.raw_title];
      return !(a && a.title);
    });
    var shown = state.wlShowAll ? items : open;
    var toggle = el("div", { class: "cr-wl-toggle", role: "group", "aria-label": "Triage view" });
    [{ all: false, label: "Needs triage (" + open.length + ")" },
     { all: true, label: "All (" + items.length + ")" }].forEach(function (opt) {
      var b = el("button", { type: "button",
        class: "cr-wl-toggle-btn" + (state.wlShowAll === opt.all ? " cr-wl-toggle-on" : "") },
        [opt.label]);
      b.onclick = function () {
        // clicking the ACTIVE chip re-renders too — after in-place saves the
        // visible rows can lag the count, and this is the reconcile affordance
        state.wlShowAll = opt.all;
        renderWorklist();
      };
      toggle.appendChild(b);
    });
    panel.appendChild(toggle);

    // ⚡ staged pre-seeds among the SHOWN, still-unassigned rows. The bulk
    // button now saves every FILLED shown row — pre-seeded and hand-typed
    // alike (2026-07-08: it previously read only .cr-wl-preseeded rows, so a
    // set of hand-completed fire certs was silently left out of "Save all").
    var openShown = shown.filter(function (it) {
      var a = state.unclassAssign[it.raw_title];
      return !(a && a.title);
    });
    var preseeded = openShown.filter(function (it) {
      return state.unclassPreseed[it.raw_title];
    });
    if (openShown.length && state.sess) {
      var psRow = el("div", { class: "cr-wl-preseed-bar" });
      psRow.appendChild(el("span", null, [
        (preseeded.length
          ? "⚡ " + preseeded.length + " row" + (preseeded.length === 1 ? "" : "s")
            + " pre-filled from the staged pre-seed plan — review each (or edit), then Save. "
          : "")
        + "Save all saves every shown row with a filled-in title — pre-filled "
        + "or typed by you. Nothing is saved until you save it."
      ]));
      var saveAll = el("button", { type: "button", class: "cr-wl-saveall" },
        ["💾 Save all filled shown"]);
      saveAll.onclick = function () { bulkSaveFilled(saveAll); };
      psRow.appendChild(saveAll);
      panel.appendChild(psRow);
    } else if (preseeded.length) {
      panel.appendChild(el("div", { class: "cr-wl-preseed-bar" }, [
        el("span", null, ["⚡ " + preseeded.length + " row"
          + (preseeded.length === 1 ? "" : "s")
          + " pre-filled from the staged pre-seed plan — sign in to save."])
      ]));
    }

    // ✓ Initiate all assigned (S110, Sam's pick: "pre-initiate assignments").
    // Every ASSIGNED (awaiting-fold) row's TARGET credential gets the
    // reviewed_marker now, so when the fold lands those credentials arrive
    // ✓ Initiated instead of piling into the ○ Not initiated lane. Targets
    // resolve to an existing row's KEY when the assigned title matches one
    // (already-initiated ones are skipped); brand-new titles key by the
    // assigned title — the fold mints that exact key.
    if (state.sess) {
      var seenT = {}, initTargets = [];
      items.forEach(function (it2) {
        var a2 = state.unclassAssign[it2.raw_title];
        var t2 = a2 && a2.title;
        if (!t2 || seenT[t2]) return;
        seenT[t2] = true;
        var match = null;
        for (var ri = 0; ri < state.rows.length; ri++) {
          var rr = state.rows[ri];
          if (rr.unified_title === t2 || rr.display_title === t2) { match = rr; break; }
        }
        if (match) {
          if (!match.curator_reviewed_at) initTargets.push({ key: match.unified_title, row: match });
        } else {
          initTargets.push({ key: t2, row: null });
        }
      });
      if (initTargets.length) {
        var initBar = el("div", { class: "cr-wl-preseed-bar" });
        initBar.appendChild(el("span", null, [
          "Initiate all marks the " + initTargets.length + " credential"
          + (initTargets.length === 1 ? "" : "s") + " targeted by saved "
          + "assignments as ✓ Initiated (already-initiated targets are skipped), "
          + "so they don't land in ○ Not initiated after the fold."
        ]));
        var initAll = el("button", { type: "button", class: "cr-wl-saveall",
          id: "cr-wl-initall" }, ["✓ Initiate all assigned (" + initTargets.length + ")"]);
        initAll.onclick = function () {
          if (!window.confirm("Mark " + initTargets.length + " assigned credential"
              + (initTargets.length === 1 ? "" : "s") + " as Initiated?")) return;
          initAll.disabled = true;
          var done = 0, failed = 0, queue = initTargets.slice();
          function step() {
            if (!queue.length) {
              initAll.textContent = failed
                ? "✓ " + done + " initiated · " + failed + " failed — retry"
                : "✓ " + done + " initiated";
              initAll.disabled = !failed;
              renderToolbar();
              renderLanes();
              return;
            }
            var batch = queue.splice(0, 8);
            Promise.all(batch.map(function (tg) {
              return saveInitiated(tg.key).then(function (resp) {
                if (resp && resp.ok) {
                  done++;
                  if (tg.row) {
                    tg.row.curator_reviewed_at = new Date().toISOString();
                    tg.row.curator_reviewed_by = (state.sess && state.sess.email) || "";
                  }
                } else { failed++; }
              }).catch(function () { failed++; });
            })).then(function () {
              initAll.textContent = "initiating… " + done + "/" + initTargets.length;
              step();
            });
          }
          step();
        };
        initBar.appendChild(initAll);
        panel.appendChild(initBar);
      }
    }
    if (!shown.length) {
      // every row is assigned but not yet folded — say so instead of
      // rendering a bare table (the queue-clear state above only covers a
      // truly EMPTY queue)
      panel.appendChild(el("p", { class: "cr-wl-note" }, [
        "✓ Nothing needs triage — all " + items.length + " rows have saved "
        + "assignments awaiting the next daily fold. Use the \"All\" view to "
        + "review or clear them."
      ]));
      if (!section) renderIssuerLaneInto(panel);
      wrap.appendChild(panel);
      return;
    }
    var tbl = el("table", { class: "cr-wl-table" });
    tbl.appendChild(el("thead", null, [el("tr", null, [
      el("th", null, ["Raw MAP exhibit title"]),
      el("th", null, ["Assign unified title"]),
      el("th", null, ["Issuing agency (optional)"]),
      el("th", null, [""]),
    ])]));
    var tbody = el("tbody");
    shown.forEach(function (it) { tbody.appendChild(renderWorklistRow(it)); });
    tbl.appendChild(tbody);
    panel.appendChild(tbl);
    if (!section) renderIssuerLaneInto(panel);
    wrap.appendChild(panel);
  }

  // ─── Missing-issuer triage lane (2026-07-08, Session 105) ─────────────────
  // Sam: "I would expect all the exhibits that don't have an issuing agency to
  // pop on the Triage list." Classified credentials whose issuer is still null
  // (and not already curated) get their own section below the unclassified
  // queue. Saving writes the standard issuing_agency_override — the exact lane
  // Mode A2 (kb/_apply_credential_review.py) promotes into kb/credentials.json
  // on the daily sync, so a saved row leaves this queue canonically. Saving an
  // EMPTY input is the explicit "no formal issuer (local exhibit)" verdict —
  // the override-to-"" semantic the Curate panel already documents.
  // Session 106 (Sam's Rule 5f): the lane also surfaces rows the staged plan
  // marks for TITLE/TRAINER cleanup even when their issuer is already set
  // (`resurface` entries — e.g. PLTW-issued ROP rows whose display title still
  // carries the school suffix). Convergence: a row leaves the queue once its
  // staged title/trainer match reality or an override lands.
  function issuerQueue() {
    return (state.rows || []).filter(function (r) {
      var ut = r.unified_title;
      if (state.niSaved[ut]) return false;
      var needsIssuer = !r.primary_issuer && !r.issuer_overridden_at;
      var ps = state.issuerPreseed[ut];
      var ovr = state.overlay[ut] || {};
      var needsTitle = !!(ps && ps.title && ovr.utitle_override === undefined
        && ps.title !== (r.display_title || ut));
      var needsTrainer = !!(ps && ps.trainer && ovr.trainer_override === undefined
        && ps.trainer !== (r.primary_trainer || ""));
      return needsIssuer || needsTitle || needsTrainer;
    });
  }
  // ── PR-5b/2 — the pending-merges strip (Session 107) ─────────────────────
  // Saved renames whose target equals an EXISTING credential key sit in the
  // rename dry-run's collision queue until confirmed. These rows usually
  // carry an issuer already (so they've left the issuer queue) — this strip
  // is their confirm surface: ✓ Confirm merge writes the
  // unified_title_merge_confirm row; ✎ re-title saves a different target
  // instead (and clears a stale confirm).
  function pendingMerges() {
    var out = [];
    (state.rows || []).forEach(function (r) {
      var ov = state.overlay[r.unified_title] || {};
      var t = (ov.utitle_override || "").trim();
      if (!t) return;
      var target = mergeTargetFor(r, t);
      if (!target) return;
      if ((ov.merge_confirm || "") === t) return;  // already confirmed
      out.push({ r: r, target: target, title: t });
    });
    return out.sort(function (a, b) {
      return (a.r.unified_title || "").localeCompare(b.r.unified_title || "");
    });
  }
  function renderPendingMergesInto(panel) {
    var pending = pendingMerges();
    if (!pending.length) return;
    panel.appendChild(el("h3", { class: "cr-wl-title cr-mg-title" },
      ["Merge confirmations (" + pending.length + ")"]));
    panel.appendChild(el("p", { class: "cr-wl-note" }, [
      "These saved unified titles match an EXISTING credential — the rename "
      + "apply holds each one in its collision queue until you decide. "
      + "✓ Confirm merge folds the credential's records into the existing one "
      + "on the next rename apply; or re-title it to something that doesn't "
      + "collide."
    ]));
    var tbl = el("table", { class: "cr-mg-table" });
    var tbody = el("tbody");
    pending.forEach(function (p) {
      var tr = el("tr", { class: "cr-mg-row", "data-ut": p.r.unified_title });
      tr.appendChild(el("td", { class: "cr-mg-old" }, [p.r.unified_title]));
      tr.appendChild(el("td", { class: "cr-mg-arrow" }, ["⇒"]));
      var inp = el("input", { type: "text", class: "cr-mg-input",
        value: p.title, title: "Edit to re-title instead of merging" });
      tr.appendChild(el("td", null, [inp]));
      var actTd = el("td", { class: "cr-mg-act" });
      var btn = el("button", { type: "button", class: "cr-mg-confirm" },
        ["✓ Confirm merge"]);
      inp.oninput = function () {
        var again = mergeTargetFor(p.r, inp.value);
        btn.textContent = again ? "✓ Confirm merge" : "Save re-title";
      };
      btn.onclick = function () {
        var ut = p.r.unified_title;
        var val = (inp.value || "").trim();
        if (!val) return;
        var target = mergeTargetFor(p.r, val);
        if (target && !window.confirm(mergeConfirmMessage(p.r, val))) return;
        btn.disabled = true; btn.textContent = "saving…";
        var writes = [saveOverride(ut, FIELD_UTITLE_OVERRIDE, val)];
        if (target) {
          writes.push(saveOverride(ut, FIELD_UTITLE_MERGE_CONFIRM, val));
        } else if ((state.overlay[ut] || {}).merge_confirm) {
          writes.push(clearOverride(ut, FIELD_UTITLE_MERGE_CONFIRM));
        }
        Promise.all(writes).then(function (rs) {
          if (!rs.every(function (resp) { return resp && resp.ok; })) {
            btn.disabled = false; btn.textContent = "retry";
            tr.classList.add("cr-wl-save-failed");
            return;
          }
          var ov = state.overlay[ut] = state.overlay[ut] || {};
          ov.utitle_override = val;
          ov.merge_confirm = target ? val : "";
          tr.classList.remove("cr-wl-save-failed");
          tr.classList.add("cr-wl-done");
          btn.textContent = target ? "✓ merge confirmed" : "✓ re-titled";
        }).catch(function () {
          btn.disabled = false; btn.textContent = "retry";
          tr.classList.add("cr-wl-save-failed");
        });
      };
      actTd.appendChild(btn);
      tr.appendChild(actTd);
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    panel.appendChild(tbl);
  }

  function renderIssuerLaneInto(panel, opts) {
    ensureWorklistDatalists();  // the queue-clear early path skips the main list's call
    if (!(opts && opts.skipMerges)) renderPendingMergesInto(panel);
    var queue = issuerQueue().slice().sort(function (a, b) {
      // staged pre-seeds first (they're one click from done), then A→Z
      var pa = state.issuerPreseed[a.unified_title] ? 0 : 1;
      var pb = state.issuerPreseed[b.unified_title] ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.unified_title || "").localeCompare(b.unified_title || "");
    });
    var savedN = Object.keys(state.niSaved).length;
    panel.appendChild(el("h3", { class: "cr-wl-title cr-ni-title" },
      ["Missing issuing agency (" + queue.length + ")"]));
    if (!queue.length) {
      panel.appendChild(el("p", { class: "cr-wl-note" }, [
        savedN ? "✓ All set — " + savedN + " issuer assignment"
                 + (savedN === 1 ? "" : "s") + " saved this session fold on the next daily sync."
               : "🎉 Every credential carries an issuing agency (or a curated “no formal issuer”)."
      ]));
      return;
    }
    panel.appendChild(el("p", { class: "cr-wl-intro" }, [
      "These classified credentials still need agency/title triage. Edit the "
      + "unified title right here (Rule 5f: strip a school/trainer name from the "
      + "title — it belongs in the agency fields), type an issuer (or pick from "
      + "the list), or Save an empty issuer box to record “no formal issuer — "
      + "local exhibit”. Each row shows the raw college-entered title(s) and the "
      + "originating college so you can complete triage without flipping to the "
      + "main list. Saves are curation overrides that fold into the knowledge "
      + "base on the next daily sync. ⚡ rows are pre-filled from the staged "
      + "pre-seed plan — nothing is saved until you save it."
    ]));
    var staged = queue.filter(function (r) { return state.issuerPreseed[r.unified_title]; });
    if (state.sess) {
      var bar = el("div", { class: "cr-wl-preseed-bar" });
      bar.appendChild(el("span", null, [
        (staged.length ? "⚡ " + staged.length + " pre-filled. " : "")
        + "Save all saves every shown row with a filled-in issuer or an edited "
        + "title/trainer"
        + (staged.length ? " — plus the pre-seeded “no formal issuer” rows" : "") + "."
      ]));
      var saveAll = el("button", { type: "button", class: "cr-wl-saveall" },
        ["💾 Save all filled shown"]);
      saveAll.onclick = function () { bulkSaveIssuers(saveAll); };
      bar.appendChild(saveAll);
      panel.appendChild(bar);
    }
    // Own table + row classes (cr-ni-*) so the unclassified worklist's row
    // queries, bulk save, and tests never mix the two lanes up.
    var tbl = el("table", { class: "cr-ni-table" });
    tbl.appendChild(el("thead", null, [el("tr", null, [
      el("th", null, ["Credential (raw title · colleges)"]),
      el("th", null, ["Unified title"]),
      el("th", null, ["Issuing agency"]),
      el("th", null, [""]),
    ])]));
    var tbody = el("tbody");
    queue.forEach(function (r) { tbody.appendChild(renderIssuerLaneRow(r)); });
    tbl.appendChild(tbody);
    panel.appendChild(tbl);
  }

  // Originating colleges for a lane row: auditor-stamped per raw title when
  // available (exact "who entered this exhibit" semantics), else the earning
  // colleges from the row's articulations (for a local single-college exhibit
  // they coincide).
  function niColleges(r) {
    var seen = {}, names = [], src = "originating";
    (r.raw_variants || []).forEach(function (v) {
      (state.rawColleges[v.raw_title] || []).forEach(function (c) {
        if (c && !seen[c]) { seen[c] = 1; names.push(c); }
      });
    });
    if (!names.length) {
      src = "articulating";
      (r.articulations || []).forEach(function (a) {
        ((a && a.local) || []).forEach(function (lc) {
          ((lc && lc.colleges) || []).forEach(function (c) {
            if (c && !seen[c]) { seen[c] = 1; names.push(c); }
          });
        });
      });
    }
    return { names: names.sort(), src: src };
  }

  function renderIssuerLaneRow(r) {
    var ut = r.unified_title;
    var ps = state.issuerPreseed[ut];
    var draft = state.niDraft[ut] || {};
    var tr = el("tr", { class: "cr-ni-row" + (ps ? " cr-wl-preseeded" : ""),
      "data-ut": ut });

    // ── credential context: name + ⚡ badge + raw title(s) + colleges ──
    var nameTd = el("td", { class: "cr-wl-raw" });
    nameTd.appendChild(el("span", { class: "cr-wl-rawt" }, [r.display_title || ut]));
    if (ps) {
      var psLabel = ps.issuer === ""
        ? "⚡ pre-seed · no formal issuer" : "⚡ pre-seed · " + (ps.via || "");
      nameTd.appendChild(el("span", { class: "cr-wl-preseed-badge",
        title: "Pre-filled by the staged pre-seed plan (lane: " + (ps.via || "?")
          + ", confidence " + (ps.confidence != null ? ps.confidence : "?") + ")."
          + (ps.title ? " Staged title: “" + ps.title + "”." : "")
          + (ps.trainer ? " Staged training agency: “" + ps.trainer + "”." : "")
          + (ps.note ? " " + ps.note : "") + " Review or edit, then Save." },
        [psLabel]));
    }
    // Raw college-entered title(s) + originating college — the context Sam
    // was flipping to the main CER row for (2026-07-08). Both render inline
    // so triage completes in one place.
    (r.raw_variants || []).forEach(function (v) {
      nameTd.appendChild(el("div", { class: "cr-ni-rawline",
        title: "Raw college-entered MAP exhibit title" }, [v.raw_title]));
    });
    var cols = niColleges(r);
    if (cols.names.length) {
      var crow = el("div", { class: "cr-wl-colleges" });
      cols.names.forEach(function (name) {
        var short = (typeof window.cplCollegeShort === "function"
          && window.cplCollegeShort(name)) || name;
        crow.appendChild(el("span", { class: "cr-wl-college",
          title: (cols.src === "originating" ? "Originating college: "
            : "Articulating college: ") + name }, [short]));
      });
      nameTd.appendChild(crow);
    }
    tr.appendChild(nameTd);

    // ── unified-title input (Sam, 2026-07-08: edit the pre-seeded exhibit
    // title right here, not via the main-tab Curate panel) ──
    var baseTitle = r.display_title || ut;
    var titleInp = el("input", { class: "cr-wl-input cr-ni-title-input", type: "text",
      list: "cr-unclass-titles", placeholder: "unified title…",
      value: (draft.title !== undefined ? draft.title : ((ps && ps.title) || baseTitle)),
      autocomplete: "off" });
    titleInp.disabled = !state.sess;
    var titleTd = el("td", {});
    titleTd.appendChild(titleInp);
    if (ps && ps.trainer) {
      titleTd.appendChild(el("div", { class: "cr-ni-trainer-chip",
        title: "Rule 5f: the training agency defaults to the same school as the "
          + "issuer. Saving this row also records training agency “" + ps.trainer
          + "” (following your issuer edit when they were staged the same). "
          + "Fine-tune later via the row's Curate panel if needed." },
        ["trainer ⇒ " + ps.trainer]));
    }
    titleTd.appendChild(buildTitleLookup(r, titleInp));
    tr.appendChild(titleTd);

    // ── issuer input (null staged issuer = keep the current one) ──
    var rowNoteDraft = null;  // assigned once the Save block wires noteDraft
    var baseIssuer = (ps && ps.issuer != null) ? ps.issuer : (r.primary_issuer || "");
    var inp = el("input", { class: "cr-wl-input cr-ni-input", type: "text",
      list: "cr-unclass-issuers", placeholder: "issuer… (empty = no formal issuer)",
      value: (draft.issuer !== undefined ? draft.issuer : baseIssuer) || "",
      autocomplete: "off" });
    inp.disabled = !state.sess;
    var inpTd = el("td", {}); inpTd.appendChild(inp);
    // ── ADDITIONAL issuing agencies (Rule 4 multi-issuer — Sam, 2026-07-08;
    // UNLIMITED count Session 107, same day: "I need to be able to add as
    // many as needed"): a "＋" reveal keeps the common single-issuer row
    // clean and each click appends another input. All extra agencies join
    // into ONE override value (" | "-delimited — a single kb_curation row,
    // the (course_id, field) PK stays honest) and Mode A2 splits + APPENDS
    // each as its own credential record (the primary is never clobbered). ──
    var ov0 = state.overlay[ut] || {};
    var iss2Base = (draft.issuer2 !== undefined) ? draft.issuer2
                                                 : (ov0.issuer2_override || "");
    var inp2Wrap = el("div", { class: "cr-ni-iss2" });
    function addExtraIssuerInput(val) {
      var x = el("input", { class: "cr-wl-input cr-ni-input2", type: "text",
        list: "cr-unclass-issuers", placeholder: "additional issuing agency…",
        value: val || "", autocomplete: "off" });
      x.disabled = !state.sess;
      x.oninput = function () { if (rowNoteDraft) rowNoteDraft(); };
      inp2Wrap.appendChild(x);
      return x;
    }
    splitIssuers(iss2Base).forEach(addExtraIssuerInput);
    var addLink = el("a", { class: "cr-ni-add-issuer", href: "#",
      title: "Some credentials are certified by more than one body (Rule 4). "
        + "Record additional issuing agencies — each is ADDED alongside the "
        + "one above, never replacing it. Click again for another." },
      ["＋ add issuing agency"]);
    addLink.onclick = function (e) {
      e.preventDefault();
      inp2Wrap.style.display = "";
      addExtraIssuerInput("").focus();
    };
    inp2Wrap.style.display = inp2Wrap.childNodes.length ? "" : "none";
    inpTd.appendChild(inp2Wrap);
    inpTd.appendChild(addLink);
    inpTd.appendChild(buildIssuerLookup(r, titleInp, inp));
    tr.appendChild(inpTd);

    var actTd = el("td", { class: "cr-wl-act" });
    if (state.sess) {
      var saveBtn = el("button", { type: "button", class: "cr-wl-save cr-ni-save" }, ["Save"]);
      function syncLabel() {
        var issuerRequired = !r.primary_issuer && !r.issuer_overridden_at;
        var noIssuer = issuerRequired && !(inp.value || "").trim();
        saveBtn.textContent = noIssuer ? "Save “no issuer”" : "Save";
        saveBtn.title = noIssuer
          ? "Record the explicit verdict that this credential has no formal issuer (local exhibit, portfolio)."
          : "Save the title/issuer exactly as shown in the inputs.";
      }
      syncLabel();
      function noteDraft() {
        state.niDraft[ut] = { title: titleInp.value, issuer: inp.value,
                              issuer2: joinIssuers(inp2Wrap) };
        // Re-editing a saved row makes it dirty again — RE-ARM the button.
        // applySavedLane disables it as "✓ Saved" while the inputs stay
        // live; syncLabel() then relabeled the still-DISABLED button back
        // to "Save" on the next keystroke — the unresponsive firearms Save
        // (Sam, 2026-07-08). Never re-arm a save that's mid-flight.
        if (saveBtn.disabled && !saveBtn.getAttribute("data-busy")) {
          saveBtn.disabled = false;
          delete state.niSaved[ut];
          tr.classList.remove("cr-wl-done");
          updateIssuerLaneCount();
        }
        syncLabel();
      }
      titleInp.oninput = noteDraft;
      inp.oninput = noteDraft;
      rowNoteDraft = noteDraft;  // the dynamic extra-issuer inputs call this
      saveBtn.onclick = function () { saveIssuerLaneRow(r, tr, titleInp, inp, inp2Wrap, saveBtn); };
      actTd.appendChild(saveBtn);
    }
    tr.appendChild(actTd);
    return tr;
  }

  // ── Issuer lookup — 🔎 web search + ✨ AI suggestion (Sam's ask 4,
  // 2026-07-08 evening: "I've been doing a web search with the question
  // 'who is the agency that issues an Aspects of Building and Safety
  // certificate?' … Is there a way to add a search button that grabs the
  // useful part of the title and does a search and recommendation?").
  // 🔎 opens that exact question in a new tab (his manual workflow, one
  // click, uses the CURRENT title input so an edited title searches right).
  // ✨ asks Claude through the existing report proxy
  // (window.CPL_REPORT_PROXY_URL — the Custom Report path; renders only when
  // configured) and offers the answer as a click-to-fill chip. A suggestion
  // is a RECOMMENDATION for the curator's judgment, never auto-saved. ──
  // Sam (2026-07-08 late): drop course-lead decoration from the query ("
  // Introduction to Warehouse Management" searches as "Warehouse Management")
  // and scope it to California — the exact shape of his productive searches:
  // `who is the agency that issues a "Warehouse Management" certificate in CA?`
  var QUERY_LEAD_RX = /^(?:an?\s+)?(?:introduction\s+to|intro\s+to|fundamentals?\s+of|principles?\s+of|essentials?\s+of|basics?\s+of)\s+/i;
  function issuerSearchQuery(title) {
    var core = (title || "").replace(QUERY_LEAD_RX, "").trim() || title;
    return "who is the agency that issues a \"" + core + "\" certificate in CA?";
  }
  function buildIssuerLookup(r, titleInp, issuerInp) {
    var wrap = el("div", { class: "cr-ni-lookup" });
    var searchBtn = el("button", { type: "button", class: "cr-ni-search",
      title: "Open a web search asking who issues this credential (uses the "
        + "current unified-title input)" }, ["🔎 who issues this?"]);
    searchBtn.onclick = function () {
      var t = (titleInp && titleInp.value || "").trim()
        || r.display_title || r.unified_title;
      window.open("https://www.google.com/search?q="
        + encodeURIComponent(issuerSearchQuery(t)), "_blank", "noopener");
    };
    wrap.appendChild(searchBtn);
    if (window.CPL_REPORT_PROXY_URL) {
      var aiBtn = el("button", { type: "button", class: "cr-ni-suggest",
        title: "Ask Claude (via the report proxy) who issues this credential — "
          + "the answer is a recommendation to review, never auto-saved" },
        ["✨ suggest"]);
      var out = el("span", { class: "cr-ni-suggest-out" });
      aiBtn.onclick = function () {
        var t = (titleInp && titleInp.value || "").trim()
          || r.display_title || r.unified_title;
        var raws = (r.raw_variants || []).slice(0, 3)
          .map(function (v) { return v.r || v.raw_title || ""; })
          .filter(Boolean);
        aiBtn.disabled = true; out.textContent = "asking…";
        var prompt = "A California community college awards credit for prior "
          + "learning documented by an exhibit titled: \"" + t + "\"."
          + (raws.length ? " The college-entered raw title(s): "
             + raws.map(function (x) { return "\"" + x + "\""; }).join(", ") + "."
             : "")
          + " Which organization issues or governs this credential or "
          + "certificate? Reply with ONLY the agency name, preferring the "
          + "long canonical form with the common abbreviation in parentheses "
          + "(e.g. \"International Code Council (ICC)\"). If it is a local "
          + "college course with no external issuer, reply exactly: none. "
          + "If you are not reasonably sure, reply exactly: unknown.";
        fetch(window.CPL_REPORT_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json",
                     "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 100,
            messages: [{ role: "user", content: prompt }] })
        }).then(function (resp) { return resp.ok ? resp.json() : null; })
          .then(function (json) {
            aiBtn.disabled = false;
            var text = (json && json.content && json.content[0]
                        && json.content[0].text || "").trim();
            if (!text || text.length > 120 || /^unknown\b/i.test(text)) {
              out.textContent = "no confident suggestion — try 🔎";
              return;
            }
            if (/^none\b/i.test(text)) {
              out.textContent = "suggests: no external issuer (local exhibit)";
              return;
            }
            out.textContent = "";
            var chip = el("button", { type: "button", class: "cr-ni-suggest-chip",
              title: "Click to fill the issuer input with this suggestion "
                + "(review before saving)" }, ["→ " + text]);
            chip.onclick = function () {
              issuerInp.value = text;
              issuerInp.dispatchEvent(new Event("input", { bubbles: true }));
              issuerInp.focus();
            };
            out.appendChild(chip);
          })
          .catch(function () {
            aiBtn.disabled = false;
            out.textContent = "suggestion failed — try 🔎";
          });
      };
      wrap.appendChild(aiBtn);
      wrap.appendChild(out);
    }
    return wrap;
  }

  // ── Title lookup — 🔎 web search + ✨ AI suggestion for UNHELPFUL titles
  // (Sam, 2026-07-08 late: exhibits titled by a bare course code — "CD-005",
  // "Cinema 24" — "I just look them up with 'CD-005 West Hills Lemoore' and
  // it gives me the title 'Child Development'. Can you add the Suggest or
  // what is this feature here too?"). The #701 issuer-lookup pattern on the
  // title column: 🔎 opens his exact code-plus-college search in a new tab;
  // ✨ asks Claude via the report proxy and offers a click-to-fill chip —
  // a RECOMMENDATION for the curator's judgment, never auto-saved. (The bulk
  // path is server-side: kb/_preseed_null_issuers.py resolves code-shaped
  // titles against COCI and stages the real course title.) ──
  function buildTitleLookup(r, titleInp) {
    return buildTitleLookupCtx(function () {
      var t = (titleInp && titleInp.value || "").trim()
        || r.display_title || r.unified_title;
      var cols = niColleges(r).names;
      var raws = (r.raw_variants || []).slice(0, 3)
        .map(function (v) { return v.r || v.raw_title || ""; })
        .filter(Boolean);
      return { t: t, college: cols[0] || "", raws: raws };
    }, titleInp);
  }
  // Core shared with the Unclassified worklist rows (S110, Sam: "add the What
  // is this and Suggested functions to the Unclassified view") — the ctx
  // closure supplies {t, college, raws} so any surface can mount the pair.
  function buildTitleLookupCtx(ctx, titleInp) {
    var wrap = el("div", { class: "cr-ni-lookup" });
    var searchBtn = el("button", { type: "button", class: "cr-ni-tsearch",
      title: "Open a web search for this course code at its college — Sam's "
        + "manual lookup, one click (uses the current title input)" },
      ["🔎 what is this?"]);
    searchBtn.onclick = function () {
      var c = ctx();
      window.open("https://www.google.com/search?q="
        + encodeURIComponent("\"" + c.t + "\" "
          + (c.college ? c.college + " " : "") + "course"),
        "_blank", "noopener");
    };
    wrap.appendChild(searchBtn);
    if (window.CPL_REPORT_PROXY_URL) {
      var aiBtn = el("button", { type: "button", class: "cr-ni-tsuggest",
        title: "Ask Claude (via the report proxy) what course or credential "
          + "this code refers to — the answer is a recommendation to review, "
          + "never auto-saved" },
        ["✨ suggest"]);
      var out = el("span", { class: "cr-ni-tsuggest-out" });
      aiBtn.onclick = function () {
        var c = ctx();
        var raws = c.raws || [];
        aiBtn.disabled = true; out.textContent = "asking…";
        var prompt = "A California community college recorded a credit-for-"
          + "prior-learning exhibit under an unhelpful title — usually a bare "
          + "local course code. Current title: \"" + c.t + "\"."
          + (raws.length ? " Raw college-entered title(s): "
             + raws.map(function (x) { return "\"" + x + "\""; }).join(", ") + "."
             : "")
          + (c.college ? " Recorded at: " + c.college + "." : "")
          + " What descriptive course or credential title does this refer to? "
          + "Reply with ONLY the title (e.g. \"Child Development\") — no code, "
          + "no college name. If you are not reasonably sure, reply exactly: "
          + "unknown.";
        fetch(window.CPL_REPORT_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json",
                     "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 100,
            messages: [{ role: "user", content: prompt }] })
        }).then(function (resp) { return resp.ok ? resp.json() : null; })
          .then(function (json) {
            aiBtn.disabled = false;
            var text = (json && json.content && json.content[0]
                        && json.content[0].text || "").trim();
            if (!text || text.length > 120 || /^unknown\b/i.test(text)) {
              out.textContent = "no confident suggestion — try 🔎";
              return;
            }
            out.textContent = "";
            var chip = el("button", { type: "button", class: "cr-ni-suggest-chip",
              title: "Click to fill the title input with this suggestion "
                + "(review before saving)" }, ["→ " + text]);
            chip.onclick = function () {
              titleInp.value = text;
              titleInp.dispatchEvent(new Event("input", { bubbles: true }));
              titleInp.focus();
            };
            out.appendChild(chip);
          })
          .catch(function () {
            aiBtn.disabled = false;
            out.textContent = "suggestion failed — try 🔎";
          });
      };
      wrap.appendChild(aiBtn);
      wrap.appendChild(out);
    }
    return wrap;
  }

  // The overrides one lane save writes, from the row's current input values:
  //  - unified_title_override when the title input differs from the display
  //    baseline (display-only rename per Mode B — the KB key stays);
  //  - issuing_agency_override always on a null-issuer row ("" = the explicit
  //    no-formal-issuer verdict), but only-on-change when an issuer already
  //    stands (the Rule-5f resurface cohort must never accidentally blank a
  //    real issuer like PLTW);
  //  - training_agency_override when the plan staged a trainer (Rule 5f:
  //    defaults to the school; follows an issuer edit when staged the same);
  //  - issuing_agency_additional_override when the ＋-revealed second input
  //    differs from the recorded additional (Rule 4 multi-issuer — Mode A2
  //    APPENDS it as its own credential record; "" clears the recorded one).
  function laneJobsFor(r, titleVal, issVal, iss2Val) {
    var ut = r.unified_title;
    var jobs = [];
    var baseTitle = r.display_title || ut;
    var t = (titleVal || "").trim();
    if (t && t !== baseTitle) jobs.push({ field: FIELD_UTITLE_OVERRIDE, value: t });
    var iv = (issVal || "").trim();
    var issuerRequired = !r.primary_issuer && !r.issuer_overridden_at;
    if (issuerRequired || iv !== (r.primary_issuer || "")) {
      jobs.push({ field: FIELD_ISSUER_OVERRIDE, value: iv });
    }
    var i2 = (iss2Val || "").trim();
    var cur2 = (state.overlay[ut] || {}).issuer2_override || "";
    if (i2 !== cur2 && (i2 || cur2)) {
      jobs.push({ field: FIELD_ISSUER2_OVERRIDE, value: i2 });
    }
    var ps = state.issuerPreseed[ut];
    if (ps && ps.trainer) {
      var tv = (ps.issuer != null && ps.trainer === ps.issuer && iv) ? iv : ps.trainer;
      if (tv && tv !== (r.primary_trainer || "")) {
        jobs.push({ field: FIELD_TRAINER_OVERRIDE, value: tv });
      }
    }
    return jobs;
  }

  // ── Unlimited additional issuing agencies (Session 107) ──────────────────
  // The extra agencies live in ONE issuing_agency_additional_override value,
  // " | "-delimited (kb_curation's PK is (course_id, field) — one row).
  // Names never contain a pipe; Mode A2 splits and appends each additively.
  function splitIssuers(s) {
    return (s || "").split("|").map(function (x) { return x.trim(); })
      .filter(function (x) { return !!x; });
  }
  function joinIssuers(wrap) {
    if (!wrap) return "";
    return Array.prototype.slice.call(wrap.querySelectorAll(".cr-ni-input2"))
      .map(function (x) { return (x.value || "").trim(); })
      .filter(function (x) { return !!x; })
      .join(" | ");
  }

  // ── PR-5b/2 — merge-collision detection (Session 107) ────────────────────
  // A typed unified title that EXACTLY matches a DIFFERENT credential's key
  // (r.unified_title — the credentials.json key, not the display label) is a
  // merge in the making: the rename dry-run queues it as a collision until
  // the curator confirms. Mirrors the dry-run's `new_ut in credentials` test.
  function credKeyIndex() {
    if (!state._credKeyIndex) {
      var m = {};
      (state.rows || []).forEach(function (r) { m[r.unified_title] = r; });
      state._credKeyIndex = m;
    }
    return state._credKeyIndex;
  }
  function mergeTargetFor(r, titleVal) {
    var t = (titleVal || "").trim();
    if (!t || t === r.unified_title) return null;
    var hit = credKeyIndex()[t];
    return (hit && hit !== r) ? hit : null;
  }
  // Append the merge-confirm job when the row's title job collides and the
  // curator has said yes. Returns the (possibly grown) jobs array.
  function withMergeConfirmJob(r, jobs) {
    var titleJob = null;
    jobs.forEach(function (j) { if (j.field === FIELD_UTITLE_OVERRIDE) titleJob = j; });
    if (!titleJob) return jobs;
    var target = mergeTargetFor(r, titleJob.value);
    if (!target) return jobs;
    return jobs.concat([{ field: FIELD_UTITLE_MERGE_CONFIRM, value: titleJob.value }]);
  }
  function mergeConfirmMessage(r, targetTitle) {
    return "“" + targetTitle + "” already exists as its own credential.\n\n"
      + "Saving CONFIRMS A MERGE: on the next rename apply, “"
      + (r.display_title || r.unified_title)
      + "”’s records fold into the existing “" + targetTitle
      + "” and the two become one credential.\n\nContinue?";
  }

  function saveIssuerLaneRow(r, tr, titleInp, inp, inp2Wrap, saveBtn) {
    var jobs = laneJobsFor(r, titleInp.value, inp.value, joinIssuers(inp2Wrap));
    if (!jobs.length) {          // nothing changed — treat as reviewed-OK
      applySavedLane(r, tr, jobs);
      return;
    }
    var grown = withMergeConfirmJob(r, jobs);
    if (grown.length !== jobs.length) {
      var target = grown[grown.length - 1].value;
      if (!window.confirm(mergeConfirmMessage(r, target))) return;  // curator declined — inputs stay editable
      jobs = grown;
    }
    saveBtn.disabled = true; saveBtn.textContent = "saving…";
    saveBtn.setAttribute("data-busy", "1");
    Promise.all(jobs.map(function (j) {
      return saveOverride(r.unified_title, j.field, j.value);
    })).then(function (rs) {
      saveBtn.removeAttribute("data-busy");
      if (!rs.every(function (resp) { return resp && resp.ok; })) { markRowFailed(tr); return; }
      applySavedLane(r, tr, jobs);
    }).catch(function () { saveBtn.removeAttribute("data-busy"); markRowFailed(tr); });
  }
  // In-place success bookkeeping (never a full re-render — unsaved input in
  // other rows must survive): the row leaves the queue on the NEXT render;
  // right now it goes green with a ✓ so the curator sees the progress.
  function applySavedLane(r, tr, jobs) {
    var ut = r.unified_title;
    var ov = state.overlay[ut] || {};
    var nowIso = new Date().toISOString();
    var email = state.sess && state.sess.email;
    var issuerJob = null;
    jobs.forEach(function (j) {
      applyOverrideLocally(r, j.field, j.value);
      ov[overlayKeyFor(j.field)] = j.value;
      ov[overlayMetaKeyFor(j.field, "by")] = email;
      ov[overlayMetaKeyFor(j.field, "at")] = nowIso;
      if (j.field === FIELD_ISSUER_OVERRIDE) issuerJob = j;
      if (j.field === FIELD_ISSUER2_OVERRIDE && j.value) {
        splitIssuers(j.value).forEach(addIssuerOption);
      }
    });
    state.overlay[ut] = ov;
    state.niSaved[ut] = true;
    delete state.niDraft[ut];
    if (issuerJob && issuerJob.value) addIssuerOption(issuerJob.value);
    tr.classList.remove("cr-wl-save-failed");
    tr.className = "cr-ni-row cr-wl-done";
    var sb = tr.querySelector(".cr-ni-save");
    if (sb) {
      sb.disabled = true;
      sb.textContent = (issuerJob && issuerJob.value === "") ? "✓ no issuer" : "✓ Saved";
    }
    updateIssuerLaneCount();
    renderToolbar();
  }
  function updateIssuerLaneCount() {
    var h = document.querySelector(".cr-ni-title");
    if (h) h.textContent = "Missing issuing agency (" + issuerQueue().length + ")";
  }

  // Bulk-save the issuer lane: every shown, unsaved row with something to
  // write — a NON-EMPTY issuer input, a title/trainer change, or an empty
  // issuer whose staged pre-seed explicitly stages "" (the no-formal-issuer
  // verdict). An empty issuer box the plan did NOT stage is never bulk-saved
  // (deliberate: mass "no issuer" needs staged intent) — its title/trainer
  // changes still save, and the row stays in the issuer queue.
  function bulkSaveIssuers(btn) {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".cr-ni-row"));
    var byUt = {};
    (state.rows || []).forEach(function (r) { byUt[r.unified_title] = r; });
    var todo = [];
    var nEmpty = 0, nTitle = 0, nTrainer = 0, nIssuer = 0, nMerge = 0;
    rows.forEach(function (tr) {
      var ut = tr.getAttribute("data-ut");
      if (!ut || state.niSaved[ut] || !byUt[ut]) return;
      var inp = tr.querySelector(".cr-ni-input");
      var titleInp = tr.querySelector(".cr-ni-title-input");
      var iss2Wrap = tr.querySelector(".cr-ni-iss2");
      if (!inp) return;
      var ps = state.issuerPreseed[ut];
      var jobs = laneJobsFor(byUt[ut], titleInp ? titleInp.value : "", inp.value,
                             joinIssuers(iss2Wrap));
      jobs = jobs.filter(function (j) {
        if (j.field !== FIELD_ISSUER_OVERRIDE) return true;
        return !!j.value || (ps && ps.issuer === "");
      });
      if (!jobs.length) return;
      jobs = withMergeConfirmJob(byUt[ut], jobs);
      jobs.forEach(function (j) {
        if (j.field === FIELD_ISSUER_OVERRIDE) { nIssuer++; if (!j.value) nEmpty++; }
        if (j.field === FIELD_UTITLE_OVERRIDE) nTitle++;
        if (j.field === FIELD_TRAINER_OVERRIDE) nTrainer++;
        if (j.field === FIELD_UTITLE_MERGE_CONFIRM) nMerge++;
      });
      todo.push({ ut: ut, tr: tr, jobs: jobs });
    });
    if (!todo.length) return;
    var parts = [];
    if (nIssuer) parts.push(nIssuer + " issuer" + (nEmpty ? " (" + nEmpty + " as “no formal issuer”)" : ""));
    if (nTitle) parts.push(nTitle + " unified-title");
    if (nTrainer) parts.push(nTrainer + " training-agency");
    var msg = "Save " + todo.length + " row" + (todo.length === 1 ? "" : "s")
      + " — " + parts.join(" · ") + " assignment"
      + (nIssuer + nTitle + nTrainer === 1 ? "" : "s")
      + (nMerge ? " — ⚠ " + nMerge + " title" + (nMerge === 1 ? " matches" : "s match")
                + " an EXISTING credential and will save as CONFIRMED MERGE"
                + (nMerge === 1 ? "" : "s")
                + " (records fold into the existing credential on the next rename apply)"
        : "")
      + " — exactly as shown in the inputs?";
    if (!window.confirm(msg)) return;
    btn.disabled = true;
    var done = 0, failed = 0;
    function step(i) {
      if (i >= todo.length) {
        btn.textContent = failed ? ("saved " + done + ", " + failed + " failed — retry")
                                 : ("✓ saved " + done);
        btn.disabled = !failed;
        return;
      }
      var job = todo[i];
      btn.textContent = "saving " + (i + 1) + " / " + todo.length + "…";
      Promise.all(job.jobs.map(function (j) {
        return saveOverride(job.ut, j.field, j.value);
      })).then(function (rs) {
        if (rs.every(function (resp) { return resp && resp.ok; })) {
          done++;
          job.tr.classList.remove("cr-wl-save-failed");
          applySavedLane(byUt[job.ut], job.tr, job.jobs);
        } else { failed++; markRowFailed(job.tr); }
        step(i + 1);
      }).catch(function () { failed++; markRowFailed(job.tr); step(i + 1); });
    }
    step(0);
  }

  // Bulk-save every currently SHOWN row whose title input is filled — the
  // ⚡ pre-seeded rows AND rows the curator completed by hand (2026-07-08:
  // the old .cr-wl-preseeded-only query silently skipped hand-typed rows).
  // What-you-see-is-what-saves; skips rows already assigned or with an
  // emptied title. A row whose save fails is marked ⚠ in place and its Save
  // button flips to "retry", so a partial batch can never pass silently.
  function bulkSaveFilled(btn) {
    var rows = Array.prototype.slice.call(
      document.querySelectorAll(".cr-wl-row"));
    var todo = [];
    rows.forEach(function (tr) {
      var raw = tr.getAttribute("data-raw");
      if (!raw) return;
      var a = state.unclassAssign[raw];
      if (a && a.title) return;
      var t = (tr.querySelector(".cr-wl-title-input") || {}).value || "";
      var iss = (tr.querySelector(".cr-wl-iss-input") || {}).value || "";
      if (t.trim()) todo.push({ raw: raw, tr: tr, title: t.trim(), issuer: iss.trim() });
    });
    if (!todo.length) return;
    if (!window.confirm("Save " + todo.length + " assignment"
        + (todo.length === 1 ? "" : "s") + " exactly as shown in the inputs?")) return;
    btn.disabled = true;
    var done = 0, failed = 0;
    function step(i) {
      if (i >= todo.length) {
        // rows were updated IN PLACE (applySavedAssignment) — no full
        // re-render, so unsaved input typed in OTHER rows survives.
        btn.textContent = failed ? ("saved " + done + ", " + failed + " failed — retry")
                                 : ("✓ saved " + done);
        btn.disabled = !failed;  // re-enable only when there is something to retry
        return;
      }
      var job = todo[i];
      btn.textContent = "saving " + (i + 1) + " / " + todo.length + "…";
      Promise.all([
        saveUnclass(job.raw, FIELD_UNCLASS_TITLE, job.title),
        saveUnclass(job.raw, FIELD_UNCLASS_ISSUER, job.issuer)
      ]).then(function (rs) {
        if (rs.every(function (r) { return r.ok; })) {
          done++;
          job.tr.classList.remove("cr-wl-save-failed");
          applySavedAssignment(job.raw, job.tr, job.title, job.issuer);
        } else { failed++; markRowFailed(job.tr); }
        step(i + 1);
      }).catch(function () { failed++; markRowFailed(job.tr); step(i + 1); });
    }
    step(0);
  }
  function markRowFailed(tr) {
    tr.classList.add("cr-wl-save-failed");
    var sb = tr.querySelector(".cr-wl-save");
    if (sb) { sb.disabled = false; sb.textContent = "retry"; }
  }

  // One worklist row. Saves update the row IN PLACE (no full re-render) so
  // unsaved input typed in other rows isn't wiped.
  // Raw title minus any course-code text (S110, Sam: "a chip that adds the
  // raw title minus any course number text to the Exhibit title when it's
  // blank and there is no green course title recommendation"). Conservative:
  // strips a trailing UPPERCASE subj+number token (" CARP 019", " - FIRE 101A",
  // "(ACCT 1A)") up to twice, and a leading code ("CD-005 — …") when real
  // words follow. If stripping leaves nothing useful, the chip offers the raw
  // title verbatim — still one click instead of highlight-copy-paste.
  function stripCourseCode(t) {
    var s = (t || "").trim();
    for (var i = 0; i < 2; i++) {
      var n = s.replace(/[\s\-–—:·,]*\(?[A-Z][A-Z&]{1,4}[- ]?\d{1,4}[A-Za-z]{0,2}\)?\s*$/, "");
      if (n === s) break;
      s = n.trim();
    }
    var lead = s.replace(/^[A-Za-z]{1,8}[- ]?\d{1,4}[A-Za-z]{0,2}[\s\-–—:·]+(?=\S+\s+\S)/, "");
    if (lead !== s) s = lead.trim();
    s = s.replace(/^[\s\-–—:·,]+|[\s\-–—:·,]+$/g, "");
    return (s && s.length >= 3) ? s : (t || "").trim();
  }

  function renderWorklistRow(it) {
    var raw = it.raw_title;
    var cur = state.unclassAssign[raw] || {};
    // Unsaved input the curator already typed survives any re-render (view
    // toggles, sign-in refresh) via state.wlDraft — the 2026-07-08 fix for
    // hand-completed rows getting wiped before they were saved.
    var draft = !cur.title && state.wlDraft[raw];
    // ⚡ staged pre-seed: prefill the inputs for a row with NO live assignment.
    // The value only lands in the inputs — saving stays the curator's click.
    var ps = !cur.title && state.unclassPreseed[raw];
    var tr = el("tr", { class: "cr-wl-row" + (cur.title ? " cr-wl-done" : "")
      + (ps ? " cr-wl-preseeded" : ""), "data-raw": raw });

    var rawTd = el("td", { class: "cr-wl-raw" });
    rawTd.appendChild(el("span", { class: "cr-wl-rawt" }, [raw]));
    if (it.band) rawTd.appendChild(el("span", { class: "cr-wl-band", title: "Auditor title-confidence band" }, [" " + it.band]));
    if (ps) {
      rawTd.appendChild(el("span", { class: "cr-wl-preseed-badge",
        title: "Pre-filled by the staged pre-seed plan (lane: " + (ps.via || "?")
          + ", confidence " + (ps.confidence != null ? ps.confidence : "?") + ")."
          + (ps.note ? " " + ps.note : "") + " Review or edit, then Save." },
        ["⚡ pre-seed · " + (ps.via || "") ]));
    }
    // Originating-college chips — who entered the exhibit (Sam, 2026-07-07:
    // "knowing their local title could help determine the common course title
    // to use"). Short name on the chip, full name in the tooltip; soft-absent
    // until the auditor next runs with MAP data.
    if (it.colleges && it.colleges.length) {
      var crow = el("div", { class: "cr-wl-colleges" });
      it.colleges.forEach(function (name) {
        var short = (typeof window.cplCollegeShort === "function" && window.cplCollegeShort(name)) || name;
        crow.appendChild(el("span", { class: "cr-wl-college",
          title: "Originating college: " + name }, [short]));
      });
      rawTd.appendChild(crow);
    }
    tr.appendChild(rawTd);

    var titleInp = el("input", { class: "cr-wl-input cr-wl-title-input", type: "text",
      list: "cr-unclass-titles", placeholder: "existing or new credential…",
      value: cur.title || (draft && draft.title) || (ps && ps.title) || "", autocomplete: "off" });
    titleInp.disabled = !state.sess;
    var titleTd = el("td", {}); titleTd.appendChild(titleInp);
    // 💡 identity-anchored fill chips (Rule 5c precedence — CCN > C-ID > COS
    // > modal local course title). Click fills the inputs; the curator still
    // reviews + Saves.
    var suggs = state.unclassSuggest && state.unclassSuggest[raw];
    if (suggs && suggs.length) {
      var srow = el("div", { class: "cr-wl-suggs" });
      suggs.forEach(function (s) {
        var label =
          s.kind === "ccn" ? "💡 CCN " + s.id + ": " + s.title :
          s.kind === "cid" ? "💡 C-ID " + s.id + ": " + s.title :
          s.kind === "cos" ? "💡 COS: " + s.title + (s.org ? " — " + s.org : "") :
          "💡 course title: " + s.title;
        var tip =
          s.kind === "ccn" ? "Official AB-1111 Common Course Number title — the statewide student-facing name (Rule 5c tier 1). Click to fill." :
          s.kind === "cid" ? "Official C-ID descriptor title" + (s.unverified ? " (code not in our descriptor extract — verify)" : "") + " (Rule 5c tier 2). Click to fill." :
          s.kind === "cos" ? "CareerOneStop certification registry match — clicking also fills the certifying organization as the issuer." :
          "Modal local course title across colleges teaching " + (s.code || "this course")
            + (s.share ? " (" + Math.round(s.share * 100) + "% agreement)" : "")
            + " — the Rule 5c fallback when no CCN/C-ID exists. Click to fill.";
        var chip = el("button", { type: "button", class: "cr-chip cr-wl-sugg", title: tip }, [label]);
        chip.disabled = !state.sess;
        chip.onclick = function () {
          titleInp.value = s.title;
          titleInp.dispatchEvent(new Event("input", { bubbles: true }));
          if (s.kind === "cos" && s.org) {
            issInp.value = s.org;
            issInp.dispatchEvent(new Event("input", { bubbles: true }));
          }
          titleInp.focus();
        };
        srow.appendChild(chip);
      });
      titleTd.appendChild(srow);
    }
    // ⤷ use-raw-title chip (S110) — ONLY when the row is truly bare: no saved
    // assignment, no 💡 suggestion, no ⚡ pre-seed. One click fills the title
    // input with the raw title minus any course-code text (review, then Save).
    if (!cur.title && !(suggs && suggs.length) && !ps) {
      var rawFill = stripCourseCode(raw);
      var rawChip = el("button", { type: "button",
        class: "cr-chip cr-wl-rawfill",
        title: "No suggestion available for this row — click to fill the "
          + "Exhibit title with the raw college-entered title"
          + (rawFill !== raw ? " (course-code text stripped)" : "")
          + ". Review or edit, then Save." },
        ["⤷ " + rawFill]);
      rawChip.disabled = !state.sess;
      rawChip.onclick = function () {
        titleInp.value = rawFill;
        titleInp.dispatchEvent(new Event("input", { bubbles: true }));
        titleInp.focus();
      };
      var rrow = el("div", { class: "cr-wl-suggs" });
      rrow.appendChild(rawChip);
      titleTd.appendChild(rrow);
    }
    // 🔎 what is this? + ✨ suggest (S110 — the #701/#707 lookup pair, now on
    // Unclassified rows too; ctx = the typed title (else the raw title) + the
    // originating college).
    titleTd.appendChild(buildTitleLookupCtx(function () {
      return {
        t: (titleInp.value || "").trim() || raw,
        college: (it.colleges && it.colleges[0]) || "",
        raws: [raw],
      };
    }, titleInp));
    tr.appendChild(titleTd);

    var issInp = el("input", { class: "cr-wl-input cr-wl-iss-input", type: "text",
      list: "cr-unclass-issuers", placeholder: "issuer…",
      value: cur.issuer || (draft && draft.issuer !== undefined ? draft.issuer : (ps && ps.issuer)) || "", autocomplete: "off" });
    issInp.disabled = !state.sess;
    var issTd = el("td", {}); issTd.appendChild(issInp); tr.appendChild(issTd);

    var actTd = el("td", { class: "cr-wl-act" });
    if (state.sess) {
      var saveBtn = el("button", { type: "button", class: "cr-wl-save" }, [cur.title ? "✓ Saved" : "Save"]);
      function noteDraft() {
        if (saveBtn.textContent !== "Save") saveBtn.textContent = "Save";
        // capture unsaved input so a re-render can't wipe it (2026-07-08)
        state.wlDraft[raw] = { title: titleInp.value, issuer: issInp.value };
      }
      titleInp.oninput = noteDraft;
      issInp.oninput   = noteDraft;
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
            applySavedAssignment(raw, tr, t, iss);
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
        ensureWorklistData();  // v2 lanes — populate queue counts up front
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
