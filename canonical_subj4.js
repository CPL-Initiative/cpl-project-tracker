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
  // Two-stage curation: a row goes review (reviewed_at) -> validate
  // (validated_at). The validate stage is gated on the row being reviewed.
  var FIELD_VALIDATED_AT = "validated_at";
  var FIELD_VALIDATED_BY = "validated_by";

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
    // Stash the current tab so the master auth-fragment handler in
    // unified_courses.js (consumeAuthHash) can restore us here after the
    // magic-link round-trip — otherwise the user gets bounced to the
    // Common Course Reference tab.
    // sessionStorage is PER BROWSER TAB and the magic link opens a NEW one, so a
    // stash written here was invisible where it is read. The keeper writes both.
    if (window.CPL_SESSION && CPL_SESSION.stashReturnTab) CPL_SESSION.stashReturnTab("canonical-subj4");
    else try { sessionStorage.setItem("cpl_sb_return_tab", "canonical-subj4"); } catch (e) {}
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
          // The pick's reviewer is the code row's; a note's author is the note's (S425: a
          // cohort's note had been read as the pick's reviewer on eleven disciplines). The
          // latest row across fields stands in only where no code row exists.
          if (row.field === FIELD_CANON) {
            rec._pick_by = row.reviewer_email; rec._pick_at = row.reviewed_at;
          } else if (row.field === FIELD_NOTES) {
            rec._notes_by = row.reviewer_email; rec._notes_at = row.reviewed_at;
          }
          if (rec._pick_at) { rec.reviewed_by = rec._pick_by; rec.reviewed_at = rec._pick_at; }
          else if (!rec.reviewed_at || (row.reviewed_at || "") >= rec.reviewed_at) {
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

  /* ── The one save path for a Common SUBJ and its note ──
     The Reference table's boxes and the List (its Edit, Edit every row and Confirm this pick)
     write through these three, so the four-letter check, the confirm on a code another MQ
     discipline owns, the kb_curation row and the overlay stay one path.
     canonCheck runs before a write, synchronously (the confirm is a dialog): "" to go ahead,
     "format" when the value is not four letters, "declined" when the reader kept the code off.
     writeCanon and writeNote resolve to the fetch response and update the overlay on a save the
     way fetchOverlay reads the rows back: the pick's reviewer is the code row's, a note's author
     is the note's, and a note stands in as the review only where no code row exists (S425). */
  function canonCheck(entry, v) {
    if (v && !SUBJ4_RE.test(v)) return "format";
    if (v) {
      // Hard-collision guard: another discipline already owns this code as
      // its Common SUBJ (or umbrella split/span). Never silent — but never
      // blocking either: an intentional fan-in convergence is a legitimate
      // save, so confirm instead of refuse.
      var own = otherOwners(v, entry.discipline);
      if (own.length && !confirm(
        v + " is already the Common SUBJ of " + own.map(function (o) { return o.d; }).join(" + ") +
        ".\n\nTwo disciplines sharing one code will collide at the SUBJ4 fold re-mint. " +
        "Save anyway (e.g. an intentional convergence)?")) return "declined";
    }
    return "";
  }
  function overlayRec(d) { return state.overlay[d] = state.overlay[d] || {}; }
  function writeCanon(entry, v) {
    var sess = state.sess;
    return saveField(entry.discipline, FIELD_CANON, v, sess).then(function (r) {
      if (!r.ok) return r;
      // Reflect in state.overlay so the row updates without a refetch.
      var rec = overlayRec(entry.discipline), at = new Date().toISOString();
      rec[FIELD_CANON] = v;
      rec._pick_by = sess.email; rec._pick_at = at;
      rec.reviewed_by = sess.email; rec.reviewed_at = at;
      invalidateSubjIndex(); // ownership changed — next check/hint rebuilds
      return r;
    });
  }
  function writeNote(entry, text) {
    var sess = state.sess;
    return saveField(entry.discipline, FIELD_NOTES, text, sess).then(function (r) {
      if (!r.ok) return r;
      var rec = overlayRec(entry.discipline), at = new Date().toISOString();
      rec[FIELD_NOTES] = text;
      rec._notes_by = sess.email; rec._notes_at = at;
      if (!rec._pick_at) { rec.reviewed_by = sess.email; rec.reviewed_at = at; }
      invalidateSubjIndex();
      return r;
    });
  }

  // The validate stage (validated_at / validated_by) stays in the data and the sync; its column
  // and control left the tab on Sam's Sheet 99 card 5 (2026-10-19) until the faculty-published
  // moment, when they return.

  // ─── data ──────────────────────────────────────────────────────────────────
  // Fetch the seed file at runtime. Lives under kb/ in the repo and is served
  // by GH Pages as a sibling URL. Falls back to an empty state on 404 so a
  // missing-on-PR-preview deploy doesn't crash the tab.
  function fetchSeed() {
    return fetch("kb/discipline_canonical_subj4.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { disciplines: {}, _counts: {} }; })
      .catch(function () { return { disciplines: {}, _counts: {} }; });
  }

  // CSR rollup — per-discipline CPL opportunities (the mirror of the EACR/CCR at the
  // discipline grain). { byDiscipline: { discipline: {n_creds,n_colleges,n_courses,
  // creds:[{c,i,n}]} } }. Generated daily by excel_to_dashboard.py; empty-on-404.
  function fetchCplRollup() {
    return fetch("kb/discipline_cpl_rollup.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { byDiscipline: {} }; })
      .catch(function () { return { byDiscipline: {} }; });
  }

  // MQ Handbook (19th ed.) section per discipline — which minimum-quals list
  // the discipline sits on (master's vs experience vs noncredit CCR §53412).
  // Extracted 2026-07-10 from the CCCCO Disciplines Index (Sam-supplied PDF);
  // kb/reference/mq_sections.json is the committed reference. Empty-on-404.
  function fetchMqSections() {
    return fetch("kb/reference/mq_sections.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { disciplines: {} }; })
      .catch(function () { return { disciplines: {} }; });
  }

  // Per-language SUBJ4 split for umbrella disciplines (currently Foreign
  // Languages → FLSP/FLFR/FLGE/…). MQ has no per-language discipline, so the
  // discipline stays one row but carries MANY synthetic subjects. We surface
  // those splits on the row + make them searchable (so "Spanish"/"FLSP" find
  // the Foreign Languages row). Empty-on-404 so a missing file never crashes.
  function fetchFLSplit() {
    return fetch("kb/foreign_language_subj4.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Build { disciplineName: [{lang, code, subjects:[…]}, …] } from the split
  // file. Generalizes to future split files; today it's just Foreign Languages.
  function buildSplit(fl) {
    var map = {};
    if (fl && fl.discipline && fl.languages) {
      var arr = Object.keys(fl.languages).map(function (lang) {
        var L = fl.languages[lang] || {};
        return { lang: lang, code: L.subj4 || "", subjects: L.subjects || [] };
      }).filter(function (x) { return x.code; });
      arr.sort(function (a, b) { return a.lang.localeCompare(b.lang); });
      if (arr.length) map[fl.discipline] = arr;
    }
    return map;
  }

  // The split entry for a row's discipline, or null. (entry.discipline is
  // stamped on every seed entry at init + on every built row.)
  function splitFor(entry) {
    return (entry && entry.discipline && state.split && state.split[entry.discipline]) || null;
  }
  // Lowercase "lang code lang code …" haystack for search matching.
  function splitSearchText(entry) {
    var s = splitFor(entry);
    if (!s) return "";
    return s.map(function (x) { return x.lang + " " + x.code; }).join(" ").toLowerCase();
  }

  // Fan-in discipline aliases (canonical → [alternate names], e.g. Kinesiology
  // → ["Physical Education"]; kb/discipline_aliases.json). The alternate name
  // stays a valid MQ, but its identities were folded into the canonical row —
  // surface that as an "also: …" chip and make the alternate searchable so a
  // curator typing "Physical Education" finds Kinesiology. Empty-on-404.
  function fetchAliases() {
    return fetch("kb/discipline_aliases.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  // Alternate names for a row's discipline, or null.
  function aliasesFor(entry) {
    return (entry && entry.discipline && state.aliases && state.aliases[entry.discipline]) || null;
  }
  // Lowercase alternate-name haystack for search matching.
  // Authority chips (item 19, Sam 2026-09-03): the C-ID / CCN code the
  // authority uses where it differs from the Common SUBJ, from
  // kb/_seed_authority_codes.py. Searchable so "AJ" finds Administration of
  // Justice and "proposed" finds the CSR-minted codes (item 18).
  function authorityChips(entry) {
    return (entry && entry.authority_chips) || [];
  }
  function authoritySearchText(entry) {
    var words = authorityChips(entry).map(function (c) { return c.system + " " + c.code + " " + c.code; });
    if (entry && entry.canonical_source) words.push(entry.canonical_source);
    if (entry && entry.authority_flag === "proposed") words.push("proposed");
    return words.join(" ").toLowerCase();
  }
  function aliasSearchText(entry) {
    var a = aliasesFor(entry);
    return a ? a.join(" ").toLowerCase() : "";
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
        // A descriptor may end in " X" (ADS 110 X, WELD 100 X: 172 of the 495, in 17 subjects). The
        // pattern without it indexed 48 of the 65 C-ID subjects and the chips never saw the other 17 (S425).
        var m = desc.match(/^([A-Z]+(?:-[A-Z]+)?)\s+(\d+[A-Z]*(?:\s+X)?)$/);
        if (!m) return;
        var subj = m[1];
        (cidBySubj[subj] = cidBySubj[subj] || []).push({ id: desc, title: d.title || "" });
      });
      (parts[1].courses || []).forEach(function (c) {
        var subj = c.subject || "";
        if (!subj) return;
        (ccnBySubj[subj] = ccnBySubj[subj] || []).push({ id: c.ccn || (subj + " " + c.number), title: c.title || "" });
      });
      return { cidBySubj: cidBySubj, ccnBySubj: ccnBySubj,
        cidMeta: { count: (parts[0].descriptors || []).length, source: parts[0]._source || "" },
        ccnMeta: { count: (parts[1].courses || []).length, source: parts[1]._source || "" } };
    });
  }

  // Merge an overlay record onto a seed entry. Overlay wins; reviewed_by / _at
  // and validated_by / _at are surfaced from the overlay so a fresh save bumps
  // them on screen.
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
    if (ov.validated_at) {
      merged.validated_at = ov.validated_at;
      merged.validated_by = ov.validated_by;
    }
    return merged;
  }

  // Status state machine — two-stage:
  //   needs review  → curator hasn't set a canonical
  //   pre-seeded    → canonical was auto-seeded from data-modal (4-letter modal)
  //   initiated     → curator explicitly set canonical (Supabase reviewed_at)
  //   validated     → faculty validator confirmed (Supabase validated_at)
  //   invalid       → saved canonical isn't 4 letters
  function status(entry) {
    var c = entry.canonical_subj4;
    if (entry.validated_at) {
      if (!c || !SUBJ4_RE.test(c)) return { label: "invalid", cls: "warn" };
      return { label: "validated", cls: "ok" };
    }
    if (entry.reviewed_at) {
      if (!c || !SUBJ4_RE.test(c)) return { label: "invalid", cls: "warn" };
      return { label: "initiated", cls: "ok" };
    }
    if (c && SUBJ4_RE.test(c)) return { label: "pre-seeded", cls: "muted" };
    return { label: "needs review", cls: "mix" };
  }

  // Variants source — prefer `local_subject_variants` (raw college subject
  // codes per discipline; what colleges actually call this discipline's
  // courses) over `variants_observed` (the older MID-aggregated SUBJ4
  // distribution, which post-Phase-1e-apply is degenerate). Falls back to
  // variants_observed for any discipline that doesn't yet carry the local
  // aggregate (older seed files).
  function variantsFor(entry) {
    if (entry.local_subject_variants && Object.keys(entry.local_subject_variants).length) {
      return entry.local_subject_variants;
    }
    return entry.variants_observed || {};
  }

  // Re-key impact = total_mids * (variants count - 1). Disciplines with the
  // highest spread × size go first so the curator works the most impactful
  // entries before the long tail.
  function rekeyImpact(entry) {
    var v = variantsFor(entry);
    var nVars = Object.keys(v).length || 1;
    return (entry.total_mids || 0) * Math.max(0, nVars - 1);
  }

  // ═══ SUBJ ⇄ CCR error checking (Session 47) ═══════════════════════════════
  //
  // Two affordances over one ownership index:
  //   1. A curator-initiated "Check SUBJ ⇄ CCR" sweep (toolbar button): every
  //      discipline's Common SUBJ vs the SUBJ4 codes its CCR rows actually
  //      carry — shared codes (collisions), off-canonical rows (the
  //      subject_collision_signal class, queued for the next fold re-mint),
  //      invalid saves, and multi-code disciplines with no pick yet.
  //   2. Live feedback while typing in the Common SUBJ input: collision /
  //      in-use warnings + suggestion chips for codes that DON'T collide.
  //
  // Data grain: variants_observed in the seed = per-discipline SUBJ4
  // distribution across actual CCR rows (minted M-IDs + stand-alones),
  // refreshed at every re-seed (kb/_seed_canonical_subj4.py). Semantics
  // mirror kb/_row_audit.py's subject_collision_signal, umbrella exemptions
  // included.

  // Umbrella disciplines legitimately span >1 SUBJ4 and are EXEMPT from the
  // off-canonical checks (mirror of UMBRELLA_DISCIPLINES in kb/_row_audit.py —
  // keep the two in sync). Foreign Languages' per-language codes come from the
  // split file at runtime; Kinesiology's spans are fixed (KINE instruction +
  // ATHL intercollegiate athletics).
  var UMBRELLA_EXTRA_SUBJ4 = { "Kinesiology": ["KINE", "ATHL"] };

  // The spans an umbrella legitimately covers: the fixed table above plus the
  // codes the seed declares on the entry (`is_umbrella` + `umbrella_codes` —
  // Agriculture and Agricultural Production carry the C-ID family codes
  // AGAB/AGAS/AGPS/AGEH/AGMA since the 2026-09-03 recode, item 14).
  function umbrellaSpans(entry) {
    var fixed = UMBRELLA_EXTRA_SUBJ4[entry.discipline] || [];
    var seeded = (entry.is_umbrella && Array.isArray(entry.umbrella_codes)) ? entry.umbrella_codes : [];
    return fixed.concat(seeded);
  }

  function isUmbrellaEntry(entry) {
    return !!(splitFor(entry) || umbrellaSpans(entry).length);
  }

  // Codes that are LEGITIMATE on this discipline's CCR rows: the canonical
  // plus umbrella split codes / fixed umbrella spans.
  function allowedSubj4(entry) {
    var ok = {};
    if (entry.canonical_subj4) ok[entry.canonical_subj4] = true;
    (splitFor(entry) || []).forEach(function (x) { ok[x.code] = true; });
    umbrellaSpans(entry).forEach(function (c) { ok[c] = true; });
    return ok;
  }

  // The merged (seed + live overlay) entry list — the same merge render() shows,
  // so the checker always sees just-saved edits.
  function mergedEntries() {
    if (!state.seed) return [];
    return Object.keys(state.seed.disciplines).map(function (d) {
      var entry = applyOverlay(state.seed.disciplines[d], state.overlay[d]);
      entry.discipline = d;
      return entry;
    });
  }

  // SUBJ4 ownership index over the merged entries.
  //   owners:   SUBJ4 -> [{d: discipline, why: "canonical"|"split (lang)"|"umbrella span"}]
  //   observed: SUBJ4 -> { discipline: CCR row count }   (variants_observed)
  // Cached on state; invalidated on every canonical save.
  function subjIndex() {
    if (state._subjIdx) return state._subjIdx;
    var owners = {}, observed = {};
    mergedEntries().forEach(function (e) {
      var c = e.canonical_subj4;
      if (c && SUBJ4_RE.test(c)) (owners[c] = owners[c] || []).push({ d: e.discipline, why: "canonical" });
      (splitFor(e) || []).forEach(function (x) {
        (owners[x.code] = owners[x.code] || []).push({ d: e.discipline, why: "split (" + x.lang + ")" });
      });
      umbrellaSpans(e).forEach(function (s) {
        if (s !== c) (owners[s] = owners[s] || []).push({ d: e.discipline, why: "umbrella span" });
      });
      var vo = e.variants_observed || {};
      Object.keys(vo).forEach(function (s) {
        (observed[s] = observed[s] || {})[e.discipline] = vo[s];
      });
    });
    state._subjIdx = { owners: owners, observed: observed };
    return state._subjIdx;
  }
  // The List's rows read the same index and overlay, so they rebuild with it.
  function invalidateSubjIndex() { state._subjIdx = null; state._listRows = null; }

  // Fan-in alias families: a converged discipline and its recorded alternate
  // name(s) (kb/discipline_aliases.json) are ONE discipline for collision
  // purposes — sharing a SUBJ4 inside the family is the convergence working,
  // not an error. (The THEA lesson, 2026-06-12: the sweep flagged
  // Drama/Theater Arts + its alias "Theater Arts" as a collision and pushed a
  // needless re-code.)
  function aliasFamilyOf(d) {
    if (!state._aliasRev) {
      var rev = {};
      var a = state.aliases || {};
      Object.keys(a).forEach(function (canon) {
        (a[canon] || []).forEach(function (alt) { rev[alt] = canon; });
      });
      state._aliasRev = rev;
    }
    return state._aliasRev[d] || d;
  }
  function sameAliasFamily(d1, d2) { return aliasFamilyOf(d1) === aliasFamilyOf(d2); }

  // Disciplines (other than selfD's alias family) that OWN `code` as
  // canonical/split/span.
  function otherOwners(code, selfD) {
    return (subjIndex().owners[code] || []).filter(function (o) { return !sameAliasFamily(o.d, selfD); });
  }
  // Disciplines (other than selfD's alias family) whose CCR rows CARRY `code`,
  // by count desc.
  function otherUsers(code, selfD) {
    var m = subjIndex().observed[code] || {};
    return Object.keys(m).filter(function (d) { return !sameAliasFamily(d, selfD); })
      .map(function (d) { return { d: d, n: m[d] }; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  // The sweep. Categorized findings over the merged entries:
  //   collisions — one SUBJ4 claimed by ≥2 disciplines (error: one code must
  //                map to one discipline at the fold re-mint)
  //   drift      — non-umbrella discipline whose CCR rows carry codes other
  //                than its canonical (info: folds at the next re-mint; codes
  //                owned by ANOTHER discipline are flagged — likely
  //                mis-disciplined rows, the AUTB M1037 class). Carries
  //                own/total so a minority/new canonical reads on the line.
  //   invalid    — saved canonical isn't 4 letters
  //   missing    — no canonical yet + ≥2 observed codes (ranked by impact)
  /* A code two disciplines share BY DESIGN (S425): one alias family (the THEA lesson); a
     fan-in pair both entries declare in fan_in_with (FTVE, Sam's 2026-09-03 ruling, item 13);
     or an umbrella code every owner declares in umbrella_codes (the five agriculture family
     codes both agriculture umbrellas carry, Sam's cards 4 to 6 the same day). Until S425 the
     check listed the six as collisions beside the one real one (AUTB). */
  function sharedByDesign(names, byName, code) {
    var families = {};
    names.forEach(function (d) { families[aliasFamilyOf(d)] = true; });
    if (Object.keys(families).length < 2) return true;
    var mutual = names.every(function (d) {
      var mine = (byName[d] && byName[d].fan_in_with) || [];
      return names.every(function (o) { return o === d || mine.indexOf(o) >= 0; });
    });
    if (mutual) return true;
    // An umbrella code every owner declares is shared by design; so is a family code one MQ
    // discipline took as its own while the umbrellas keep declaring it (Sam, Sheet 99 card 3,
    // 2026-10-19: Agricultural Business and Related Services takes AGAB beside the two
    // agriculture umbrellas). Two disciplines canonical on one code is the collision.
    var canonicalOn = names.filter(function (d) { return !!(byName[d] && byName[d].canonical_subj4 === code); });
    if (canonicalOn.length > 1) return false;
    return names.every(function (d) {
      var e = byName[d];
      if (!e) return false;
      if (e.canonical_subj4 === code) return true;
      return (e.umbrella_codes || []).indexOf(code) >= 0;
    });
  }
  function runSubjCheck() {
    var rows = mergedEntries();
    var idx = subjIndex();
    var byName = {};
    rows.forEach(function (e) { byName[e.discipline] = e; });
    var out = { collisions: [], aliasShared: [], drift: [], invalid: [], missing: [], nRowsOff: 0 };

    Object.keys(idx.owners).sort().forEach(function (code) {
      var ds = {};
      idx.owners[code].forEach(function (o) { if (!ds[o.d]) ds[o.d] = o.why; });
      var names = Object.keys(ds);
      if (names.length < 2) return;
      var rec = {
        code: code,
        owners: names.map(function (d) {
          return { d: d, why: ds[d], n: (idx.observed[code] || {})[d] || 0 };
        }),
      };
      // Shared by design (an alias family, a ruled fan-in, an umbrella code both declare) is
      // informational, never a collision.
      if (sharedByDesign(names, byName, code)) out.aliasShared.push(rec);
      else out.collisions.push(rec);
    });

    rows.forEach(function (e) {
      var c = e.canonical_subj4;
      var vo = e.variants_observed || {};
      var voKeys = Object.keys(vo);
      var total = 0;
      voKeys.forEach(function (s) { total += vo[s]; });

      if (c && !SUBJ4_RE.test(c)) {
        out.invalid.push({ d: e.discipline, code: c });
        return;
      }
      if (!c) {
        if (voKeys.length >= 2) {
          out.missing.push({ d: e.discipline, codes: voKeys.length, rows: total, impact: rekeyImpact(e) });
        }
        return;
      }
      if (isUmbrellaEntry(e)) return; // umbrellas span many SUBJ4s by design

      var allow = allowedSubj4(e);
      var off = voKeys.filter(function (s) { return !allow[s]; })
        .map(function (s) {
          var own = otherOwners(s, e.discipline);
          return { code: s, n: vo[s], ownedBy: own.length ? own[0].d : null };
        })
        .sort(function (a, b) { return b.n - a.n; });
      if (off.length) {
        var nOff = 0;
        off.forEach(function (x) { nOff += x.n; });
        out.nRowsOff += nOff;
        out.drift.push({
          d: e.discipline, canonical: c, off: off, nOff: nOff,
          own: vo[c] || 0, total: total,
          cross: off.some(function (x) { return !!x.ownedBy; }),
        });
      }
    });
    out.drift.sort(function (a, b) { return (b.cross - a.cross) || (b.nOff - a.nOff); });
    out.missing.sort(function (a, b) { return b.impact - a.impact; });
    return out;
  }

  // Candidate codes for this discipline that don't collide elsewhere: its own
  // observed SUBJ4s + 4-letter local college codes + the data modal, minus
  // anything OWNED by another discipline. Codes merely IN USE under another
  // discipline's rows are kept but warn-marked (the curator sees the
  // trade-off). Prefix-filtered while the curator types; ranked by usage.
  function subjSuggestions(entry, prefix) {
    var weight = {};
    var vo = entry.variants_observed || {};
    Object.keys(vo).forEach(function (s) { if (SUBJ4_RE.test(s)) weight[s] = (weight[s] || 0) + vo[s] * 10; });
    var lv = entry.local_subject_variants || {};
    Object.keys(lv).forEach(function (s) { if (SUBJ4_RE.test(s)) weight[s] = (weight[s] || 0) + lv[s]; });
    if (entry.data_modal && SUBJ4_RE.test(entry.data_modal)) weight[entry.data_modal] = (weight[entry.data_modal] || 0) + 1;
    return Object.keys(weight)
      .filter(function (s) { return s !== entry.canonical_subj4; })
      .filter(function (s) { return !prefix || s.indexOf(prefix) === 0; })
      .filter(function (s) { return !otherOwners(s, entry.discipline).length; })
      .sort(function (a, b) { return weight[b] - weight[a]; })
      .slice(0, 6)
      .map(function (s) {
        var users = otherUsers(s, entry.discipline);
        return { code: s, mine: (vo[s] || 0) + (lv[s] || 0), conflict: users.length ? users[0] : null };
      });
  }

  // One-time CSS for the checker UI (layout only — colors ride the existing
  // cs-badge classes + design tokens).
  function ensureCheckCss() {
    if (document.getElementById("cs-check-css")) return;
    document.head.appendChild(el("style", { id: "cs-check-css" }, [
      "#tab-canonical-subj4 .cs-check-section{margin:14px 0 6px;font-size:.95rem;color:var(--text-strong);}" +
      "#tab-canonical-subj4 .cs-check-list{margin:0;padding:0;list-style:none;}" +
      "#tab-canonical-subj4 .cs-check-list li{padding:6px 4px;border-top:1px solid var(--border);font-size:.85rem;" +
        "color:var(--text-body);text-align:left;}" +
      "#tab-canonical-subj4 .cs-check-jump{margin-left:8px;font-size:.74rem;padding:1px 8px;border:1px solid var(--border-strong);" +
        "border-radius:10px;background:var(--surface-subtle);cursor:pointer;color:var(--accent-link);white-space:nowrap;}" +
      "#tab-canonical-subj4 .cs-check-jump:hover{background:var(--surface-muted);}" +
      "#tab-canonical-subj4 .cs-check-rec{margin:5px 0 2px 2px;font-size:.8rem;color:var(--text-muted);line-height:1.45;}" +
      "#tab-canonical-subj4 .cs-check-fix{margin-left:6px;font-size:.76rem;font-weight:600;padding:2px 9px;border:1px solid var(--gold-accent);" +
        "border-radius:10px;background:var(--surface-subtle);cursor:pointer;color:var(--navy-primary);white-space:nowrap;}" +
      "#tab-canonical-subj4 .cs-check-fix:hover{background:var(--gold-accent);color:#fff;}" +
      "#tab-canonical-subj4 .cs-check-note{color:var(--text-muted);font-size:.78rem;margin:4px 0 10px;text-align:left;}" +
      "#tab-canonical-subj4 .cs-check-ok{color:var(--green-progress);font-size:.95rem;margin:10px 0;}"
    ]));
  }

  // WCAG 2.2 target size (UI pass, S386): the sign-in link at least 24px tall, on the List's head. The rest of this
  // sheet styled the Reference table, which retired into the List (2026-11-04).
  function ensureCsrUiCss() {
    if (document.getElementById("cs-ui-css")) return;
    document.head.appendChild(el("style", { id: "cs-ui-css" }, [
      "#tab-canonical-subj4 a.cs-auth-link{display:inline-block;min-height:24px;line-height:24px;}"
    ]));
  }

  // Inject the report modal once (same pattern as ensureCplModal — appended
  // inside the pane so the scoped .cs-modal rules apply; no HTML edit).
  function ensureCheckModal() {
    if (document.getElementById("cs-check-modal")) return;
    var close = el("button", { class: "cs-modal-close", type: "button", "aria-label": "Close" }, ["×"]);
    var modal = el("div", { class: "cs-modal" }, [
      close,
      el("h3", { id: "cs-check-title" }, ["SUBJ ⇄ CCR check"]),
      el("div", { id: "cs-check-body" }),
    ]);
    var bg = el("div", { id: "cs-check-modal", class: "cs-modal-bg", role: "dialog", "aria-modal": "true" }, [modal]);
    function shut() { bg.classList.remove("show"); document.removeEventListener("keydown", esc); }
    function esc(e) { if (e.key === "Escape") shut(); }
    bg._esc = esc;
    close.onclick = shut;
    bg.onclick = function (e) { if (e.target === bg) shut(); };
    document.getElementById("tab-canonical-subj4").appendChild(bg);
  }

  // Cure affordance: close the check and open the MQ discipline's panel on the List, every filter
  // cleared, where its code is set or confirmed (2026-11-04: the Reference table retired into the List).
  function jumpToDiscipline(d) {
    var bg = document.getElementById("cs-check-modal");
    if (bg) bg.classList.remove("show");
    goTo({ view: "list", panel: d });
  }

  function _jumpBtn(d) {
    var b = el("button", { type: "button", class: "cs-check-jump", title: "Show this discipline's row (clears other filters)" }, ["show " + d + " →"]);
    b.onclick = function () { jumpToDiscipline(d); };
    return b;
  }

  // "Fix on CCR →" — deep-link the Common Course Reference tab, filtered to this
  // discipline + the off-canonical code, so the curator lands on exactly the
  // likely-mis-disciplined rows to re-discipline. Reuses the CPL_QS hint bus
  // (unified_courses.js already listens for 'cpl-qs-hint') + the CPL_TABS
  // router — no unified_courses.js change. The M-ID row id embeds the SUBJ4
  // (e.g. "BUSI M1082"), and the CCR search matches title+id, so passing the
  // code as the search isolates the off-canonical rows within the discipline.
  function _fixOnCcrBtn(disc, code) {
    var b = el("button", { type: "button", class: "cs-check-fix",
      title: "Open the Common Course Reference filtered to " + disc + (code ? " · " + code : "") +
             " so you can re-discipline these rows" }, ["Fix on CCR →"]);
    b.onclick = function () {
      var hint = { disc: disc };
      if (code) hint.search = code;
      try { sessionStorage.setItem("cpl_qs_hint_unified-courses", JSON.stringify(hint)); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("cpl-qs-hint", { detail: { tab: "unified-courses", hint: hint } })); } catch (e) {}
      if (window.CPL_TABS && window.CPL_TABS.activate) window.CPL_TABS.activate("unified-courses");
      else location.hash = "unified-courses";
      var bg = document.getElementById("cs-check-modal"); if (bg) bg.classList.remove("show");
    };
    return b;
  }

  function openCheckModal() {
    ensureCheckCss();
    ensureCheckModal();
    var res = runSubjCheck();
    var bg = document.getElementById("cs-check-modal");
    var body = document.getElementById("cs-check-body");
    body.innerHTML = "";

    var nIssues = res.collisions.length + res.invalid.length;
    document.getElementById("cs-check-title").textContent =
      "SUBJ ⇄ CCR check — " + res.collisions.length + " collision" + (res.collisions.length === 1 ? "" : "s") +
      " · " + res.drift.length + " discipline" + (res.drift.length === 1 ? "" : "s") + " with off-canonical rows" +
      (res.invalid.length ? " · " + res.invalid.length + " invalid" : "");

    if (!nIssues && !res.drift.length && !res.missing.length) {
      body.appendChild(el("p", { class: "cs-check-ok" },
        ["✅ No SUBJ collisions or mismatches — every Common SUBJ is unique and matches its CCR rows."]));
    }

    if (res.collisions.length) {
      body.appendChild(el("h5", { class: "cs-check-section" },
        ["🔴 Shared Common SUBJ codes (" + res.collisions.length + ")"]));
      body.appendChild(el("p", { class: "cs-check-note" }, [
        "One code must map to one discipline at the SUBJ4 fold re-mint, so each of these needs a decision: " +
        "change one side (open its row — the Common SUBJ box suggests collision-free codes), or, if the two " +
        "disciplines are deliberately converging (fan-in), leave it and record the intent in the row's notes."]));
      var ulC = el("ul", { class: "cs-check-list" });
      res.collisions.forEach(function (c) {
        var li = el("li");
        li.appendChild(el("strong", { class: "cs-mono" }, [c.code]));
        li.appendChild(document.createTextNode(" — " + c.owners.map(function (o) {
          return o.d + (o.why !== "canonical" ? " (" + o.why + ")" : "") + (o.n ? " ×" + o.n : "");
        }).join("  +  ") + " "));
        c.owners.forEach(function (o) { li.appendChild(_jumpBtn(o.d)); });
        ulC.appendChild(li);
      });
      body.appendChild(ulC);
    }

    if (res.aliasShared.length) {
      body.appendChild(el("h5", { class: "cs-check-section" },
        ["ℹ Codes shared by design (" + res.aliasShared.length + " — expected)"]));
      body.appendChild(el("p", { class: "cs-check-note" }, [
        "A converged discipline and its recorded alternate name, a fan-in pair both entries declare (FTVE), or an " +
        "umbrella code both agriculture umbrellas carry (Sam, 2026-09-03) share one Common SUBJ by design: not an error, nothing to fix."]));
      var ulAS = el("ul", { class: "cs-check-list" });
      res.aliasShared.forEach(function (c) {
        var li = el("li");
        li.appendChild(el("strong", { class: "cs-mono" }, [c.code]));
        li.appendChild(document.createTextNode(" — " + c.owners.map(function (o) {
          return o.d + (o.n ? " ×" + o.n : "");
        }).join("  +  ")));
        ulAS.appendChild(li);
      });
      body.appendChild(ulAS);
    }

    if (res.invalid.length) {
      body.appendChild(el("h5", { class: "cs-check-section" }, ["🔴 Invalid saved codes (" + res.invalid.length + ")"]));
      var ulI = el("ul", { class: "cs-check-list" });
      res.invalid.forEach(function (x) {
        var li = el("li");
        li.appendChild(document.createTextNode(x.d + " — saved value "));
        li.appendChild(el("strong", { class: "cs-mono" }, ['"' + x.code + '"']));
        li.appendChild(document.createTextNode(" isn't 4 letters "));
        li.appendChild(_jumpBtn(x.d));
        ulI.appendChild(li);
      });
      body.appendChild(ulI);
    }

    if (res.drift.length) {
      body.appendChild(el("h5", { class: "cs-check-section" },
        ["🟡 CCR rows keyed off-canonical (" + res.drift.length + " disciplines · " + res.nRowsOff + " rows)"]));
      body.appendChild(el("p", { class: "cs-check-note" }, [
        "These rows carry a SUBJ4 that differs from the discipline's Common SUBJ. They re-key to the canonical at " +
        "the next SUBJ4 fold re-mint (a receipted, Fable-side operation under the Rule-7 playbook) — nothing to fix " +
        "here unless the canonical itself is wrong (edit it on the row) or a row's discipline is wrong (fix that row " +
        "on the Common Course Reference). Codes marked ⚠ are another discipline's Common SUBJ — those rows are " +
        "likely mis-disciplined."]));
      var ulD = el("ul", { class: "cs-check-list" });
      res.drift.forEach(function (g) {
        var li = el("li");
        li.appendChild(el("strong", null, [g.d]));
        li.appendChild(document.createTextNode(" (canonical "));
        li.appendChild(el("span", { class: "cs-mono" }, [g.canonical]));
        var share = g.total ? Math.round((g.own / g.total) * 100) : 0;
        li.appendChild(document.createTextNode(
          g.own === 0 ? " — not on any CCR row yet)" : (share < 50 ? " — only " + share + "% of rows)" : ")")));
        li.appendChild(document.createTextNode(": "));
        g.off.forEach(function (x, i) {
          if (i) li.appendChild(document.createTextNode(" · "));
          li.appendChild(el("span", { class: "cs-mono" }, [x.code]));
          li.appendChild(document.createTextNode(" ×" + x.n));
          if (x.ownedBy) {
            li.appendChild(el("span", { class: "cs-badge warn", title: "This code is the Common SUBJ of " + x.ownedBy + " — these rows are likely mis-disciplined." },
              ["⚠ = " + x.ownedBy]));
          }
        });
        // A code OWNED by another discipline (⚠) means those rows are likely
        // mis-disciplined — give the curator a one-click route to the exact rows
        // on the Common Course Reference, with a plain recommendation. Codes with
        // no owner are just pre-fold drift (re-key at the next fold) → keep the
        // in-CSR "show →".
        var owned = g.off.filter(function (x) { return x.ownedBy; });
        if (owned.length) {
          owned.forEach(function (x) {
            var rec = el("div", { class: "cs-check-rec" });
            rec.appendChild(document.createTextNode(
              "💡 " + x.n + " row" + (x.n === 1 ? "" : "s") + " tagged " + g.d + " carry " +
              x.ownedBy + "’s Common SUBJ (" + x.code + ") — likely " + x.ownedBy +
              " (or cross-listed). Review + re-discipline on the CCR:"));
            rec.appendChild(_fixOnCcrBtn(g.d, x.code));
            li.appendChild(rec);
          });
        } else {
          li.appendChild(_jumpBtn(g.d));
        }
        ulD.appendChild(li);
      });
      body.appendChild(ulD);
    }

    if (res.missing.length) {
      body.appendChild(el("h5", { class: "cs-check-section" },
        ["⚪ Multi-code disciplines with no Common SUBJ yet (" + res.missing.length + ")"]));
      body.appendChild(el("p", { class: "cs-check-note" },
        ["Highest re-key impact first — pick a code so the fold re-mint can include them."]));
      var ulM = el("ul", { class: "cs-check-list" });
      res.missing.slice(0, 15).forEach(function (m) {
        var li = el("li");
        li.appendChild(el("strong", null, [m.d]));
        li.appendChild(document.createTextNode(" — " + m.codes + " codes across " + m.rows + " rows "));
        li.appendChild(_jumpBtn(m.d));
        ulM.appendChild(li);
      });
      if (res.missing.length > 15) {
        ulM.appendChild(el("li", { class: "cs-check-note" },
          ["…+" + (res.missing.length - 15) + ' more — use the "Needs curator review" filter.']));
      }
      body.appendChild(ulM);
    }

    body.appendChild(el("p", { class: "cs-check-note" }, [
      "CCR snapshot: seeded " + ((state.seed && state.seed._seeded_at) || "—") +
      " · row counts include stand-alones · umbrella disciplines (Foreign Languages, Kinesiology) span many codes by design and are exempt."]));

    document.addEventListener("keydown", bg._esc);
    bg.classList.add("show");
  }

  // ─── render ────────────────────────────────────────────────────────────────
  var state = {
    seed: null,
    overlay: {},
    cidBySubj: {},
    ccnBySubj: {},
    cidMeta: null, ccnMeta: null, mqDoc: null,
    view: "progress",            // "progress" (the Commons' dash), "list" or "local"; remembered
    scan: null, status: null, procs: null, secs: null, readAt: null,
    // Sign-in feedback lives in the auth widget (no corner toast). See
    // PR #119 / docs/exhibit_canonicalization_lessons.md for context.
    pendingSignInEmail: null,
    pendingSignInError: null,
    sess: null,
  };

  /* The sign-in sits on the List's head (2026-11-04); it renders into every host the tab draws. */
  function renderAuth() {
    Array.prototype.forEach.call(document.querySelectorAll("#tab-canonical-subj4 .cs-auth"), renderAuthInto);
  }
  function renderAuthInto(auth) {
    auth.innerHTML = "";

    // Signed in
    if (state.sess) {
      auth.appendChild(el("span", { class: "cs-auth-on" }, ["✓ " + state.sess.email]));
      auth.appendChild(document.createTextNode("  "));
      var out = el("a", { class: "cs-auth-link", href: "#" }, ["sign out"]);
      out.onclick = function (e) { e.preventDefault(); signOut(); state.sess = null; renderAuth(); render(); if (state.view === "list") listRepaint(); };
      auth.appendChild(out);
      return;
    }

    // Sign-in error
    if (state.pendingSignInError) {
      var errPanel = el("div", { class: "cs-auth-panel cs-auth-panel-err" });
      errPanel.appendChild(el("strong", null, ["✗ Sign-in failed"]));
      errPanel.appendChild(el("div", { class: "cs-auth-panel-detail" }, [state.pendingSignInError]));
      var retry = el("a", { class: "cs-auth-link", href: "#" }, ["try again"]);
      retry.onclick = function (e) {
        e.preventDefault();
        state.pendingSignInError = null;
        renderAuth();
      };
      errPanel.appendChild(retry);
      auth.appendChild(errPanel);
      return;
    }

    // Magic link sent — inline confirmation panel
    if (state.pendingSignInEmail) {
      var panel = el("div", { class: "cs-auth-panel cs-auth-panel-ok" });
      panel.appendChild(el("strong", null, ["✉ Magic link sent"]));
      panel.appendChild(el("div", { class: "cs-auth-panel-detail" },
        ["Check the inbox for ", state.pendingSignInEmail,
         " and click the link to complete sign-in. You'll land back on this tab signed in."]));
      var diff = el("a", { class: "cs-auth-link", href: "#" }, ["use a different email"]);
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
    var inn = el("a", { class: "cs-auth-link", href: "#" }, ["sign in to edit"]);
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
    auth.appendChild(el("span", { class: "cs-auth-tag" }, ["(CCCCO MAP only)"]));
  }

  /* After a save: the Progress view, when showing, reads the same merge. The List repaints itself (its callers redraw
     it and keep focus); the Reference table this once also redrew retired into the List, 2026-11-04. */
  function render() {
    if (!state.seed) return;
    if (state.view === "progress" && document.getElementById("cs-progress") && !document.getElementById("cs-progress").hidden) renderProgress();
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



  // ══════════════════════════════════════════════════════════════════════════════════════
  // The Progress view (S425, 2026-10-19): the Commons' dash for this reference.
  //
  // Sam, 2026-10-19: "Can you develop a dash for CSR similar to the one you created for PR?
  // Seems like each of our Commons consolidation projects should follow the same process",
  // and "We should have a CSR dash card for each key step that needs monitoring and stores
  // the procedures needed by agents". The shape is the shared module's (commons_progress.js,
  // the Commons' step 1): the run status, the headline pair, the milestone line with You are
  // here, a card per step and the side column from the run log (kb/status/subjects.json).
  // Each card's procedure lives in kb/csr_procedures.json and is drawn under the cards; a
  // count opens the List with the filter that lists exactly what it counted (the
  // Commons' step 3, the deep link behind a count: #canonical-subj4/<filter>).
  //
  // The definitions are this reference's; the renderer is the module's. The context x is
  // built from the reads this tab already makes (the seed, the live picks, the C-ID and CCN
  // tables, the MQ index) plus three more: the daily scan (kb/csr_out/latest.json, written by
  // kb/_csr_trail.py --latest), the run log and the procedures store. A read that failed is
  // null in x and named in x.errors; the module then says so on the card instead of drawing
  // a zero (the S343 rule). Sam's word for the handbook's discipline is "MQ discipline"
  // (2026-10-19: "This will help me remember the difference between SUBJECT and DISCIPLINE").
  // ══════════════════════════════════════════════════════════════════════════════════════
  var SCAN_URL = "kb/csr_out/latest.json";
  var STATUS_URL = "kb/status/subjects.json";
  var PROCS_URL = "kb/csr_procedures.json";
  var SKYVIEW_URL = "prototype/skyview.html";
  var VIEW_KEY = "cplCsr.view.v1";
  var SECS_KEY = "cplCsr.secs.v1";
  var VIEWS = [{ id: "progress", label: "Progress" }, { id: "list", label: "List" },
    { id: "local", label: "Local subjects" }];
  // The retired Reference view's filter addresses (and the quickstart's status hints), each opening the List on its filter.
  var FILTER_ROUTES = { needs_review: "nocode", pre_seeded: "open", reviewed: "confirmed", invalid: "nocode", ccn: "ccn", cid: "cid",
    chip: "chip", proposed: "proposed" };
  var ASK_SKIP = ["cs7_unreviewed", "cs4_aligned", "cs4_missed_alignment", "cs2_dup"];
  var RULE_WORDS = {
    cs1_format: "not four letters", cs2_dup: "a code on two MQ disciplines", cs3_squat: "an official prefix on another subject",
    cs4_aligned: "aligned with the official prefix", cs4_missed_alignment: "a missed alignment", cs4_divergence_noted: "a divergence the note records",
    cs5_modal_diverge: "a modal choice without a note", cs6_weak_mnemonic: "a weak mnemonic", cs7_unreviewed: "unconfirmed",
    cs7_needs_review: "needs review", cs8_seeder_bypass: "the mint path skips the reference", cs9_anchor_dead_format: "an anchor key in the dead format",
    cs9_anchor_subj_diverge: "an anchor off its code"
  };

  function readJsonStrict(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " answered " + r.status);
      return r.json();
    });
  }
  function readSoft(url, test) {
    return readJsonStrict(url).then(function (j) {
      if (test && !test(j)) throw new Error(url + " has no " + test.name);
      return { data: j, error: null };
    }).catch(function (e) { return { data: null, error: String(e && e.message || e) }; });
  }
  function written_at(j) { return !!(j && j.written_at); }
  function findings(j) { return !!(j && Array.isArray(j.findings)); }
  function procedures(j) { return !!(j && Array.isArray(j.procedures)); }
  function fetchScan() { return readSoft(SCAN_URL, findings); }
  function fetchStatus() { return readSoft(STATUS_URL, written_at); }
  function fetchProcedures() { return readSoft(PROCS_URL, procedures); }

  function fmtN(n) { return n == null || n === "" ? "" : Number(n).toLocaleString("en-US"); }
  function plural(n, one, many) { return fmtN(n) + " " + (Number(n) === 1 ? one : many); }
  function isCohort(who) { return /@bot$/.test(String(who || "")); }
  function hasCode(e) { return !!(e.canonical_subj4 && SUBJ4_RE.test(e.canonical_subj4)); }
  function isConfirmed(e) { return hasCode(e) && !!(e.reviewed_at || e.source === "curator_override"); }
  function onAuthorityCode(e) { return e.canonical_source === "ccn" || e.canonical_source === "c-id"; }
  function dayWords(v) {
    var CP = window.CPL_COMMONS_PROGRESS;
    if (!v) return "";
    return CP ? CP.dayOf(v) : String(v).slice(0, 10);
  }
  function retrievedDay(source) {
    var m = /retrieved (\d{4}-\d{2}-\d{2})/.exec(String(source || ""));
    return m ? m[1] : null;
  }

  /* ── where a count leads (the Commons' step 3) ──
     A target names the List with one filter set (the Reference view's lists became List filters
     when it retired into the List, 2026-11-04), the tab's own SUBJ check, a section of this view, a
     procedure's card, or another page. A pick waiting for a person leads to the List's Open filter
     (TO.confirm), where Confirm this pick lives (Sam, 2026-11-03, from the Commons). */
  var TO = {
    all: { view: "list", filter: "" },
    needsReview: { view: "list", filter: "nocode" },
    preSeeded: { view: "list", filter: "open" },
    confirm: { view: "list", filter: "open" },
    reviewed: { view: "list", filter: "confirmed" },
    ccn: { view: "list", filter: "ccn" },
    cid: { view: "list", filter: "cid" },
    chip: { view: "list", filter: "chip" },
    proposed: { view: "list", filter: "proposed" },
    check: { check: true },
    findings: { sec: "progress:findings" },
    procedures: { sec: "progress:procedures" },
    skyviewSubjects: { href: SKYVIEW_URL + "#subjects" },
    skyviewDisciplines: { href: SKYVIEW_URL + "#disciplines" },
    crosslistSheet: { href: "https://claude.ai/artifact/BizNPAbrucq6hWARVzTQBp" }
  };
  function procTarget(id) { return { sec: "progress:procedures", proc: id }; }

  /* ── the milestones: where the reference stands, in order ──
     Every milestone before the first with anything left is done; that one is You are here. A
     left item whose count could not be read keeps its milestone open. */
  var MILESTONES = [
    { id: "coded", title: "A code for every MQ discipline",
      fact: function (x) { return fmtN(x.total - x.missingCode) + " of " + fmtN(x.total) + " carry one"; },
      when: function () { return "the fold, Jun 12"; },
      left: function (x) { return [[x.missingCode, "MQ discipline without a code", "MQ disciplines without a code", TO.needsReview]]; } },
    { id: "authority", title: "The authority's codes adopted", needs: ["scan"],
      fact: function (x) { return fmtN(x.onAuthority) + " on an authority code, " + fmtN(x.chips) + " show a chip"; },
      when: function () { return "the recode, Sep 3"; },
      left: function (x) { return [[x.missed, "missed alignment", "missed alignments", TO.chip]]; } },
    { id: "confirmed", title: "Every pick confirmed",
      fact: function (x) { return fmtN(x.confirmed) + " of " + fmtN(x.total) + " by a person"; },
      left: function (x) { return [[x.unconfirmed, "pick to confirm", "picks to confirm", TO.confirm]]; } },
    { id: "checks", title: "The checks pass", needs: ["scan"],
      fact: function (x) { return plural(x.askable, "finding needs", "findings need") + " a judgment"; },
      left: function (x) {
        return [[x.collisions, "collision", "collisions", TO.check],
          [x.judgments, "finding to confirm or note", "findings to confirm or note", TO.findings]];
      } },
    { id: "selfrun", title: "Self-maintaining", needs: ["procs"],
      fact: function (x) { return fmtN(x.procsOn) + " of " + fmtN(x.procsAll) + " procedures in force"; },
      left: function (x) {
        return [[x.routinesToBuild, "source without a refresh routine", "sources without a refresh routine", TO.procedures],
          [x.proposed, "procedure waiting on " + x.decider, "procedures waiting on " + x.decider, TO.procedures]];
      } }
  ];

  /* ── the parts: Sam's eight steps of 2026-10-19, consolidated to one card each ──
     Steps 1 and 4 are the MQ list (every MQ discipline with courses carries a code); steps 2
     and 8 are the authority tables and their reconciliation; steps 3 and 7 are the authority
     rule and the identity codes it governs; 5 is one code, one MQ discipline; 6 is the
     cross-listings; then the confirmations and the checks. status(x) answers a STATUS key of
     the shared module; meter(x) answers [have, of, verb]; open(x) the list the card counts;
     more(x) the card's procedure. */
  var PARTS = [
    { id: "mq_list", title: "The MQ discipline list", needs: ["mq"],
      status: function (x) { return x.procOn("mq_list") ? "done" : "going"; },
      what: function (x) {
        return fmtN(x.mqTotal) + " MQ disciplines in the handbook's index" + (x.mqReadAt ? " (read " + dayWords(x.mqReadAt) + ")" : "") + "; " +
          fmtN(x.total) + " carry courses on the map and " + (x.missingCode ? fmtN(x.total - x.missingCode) + " of them carry" : "every one carries") +
          " a Common SUBJ; " + fmtN(x.mqNoCourses) + " carry none.";
      },
      meter: function (x) { return [x.total - x.missingCode, x.total, "coded"]; },
      foot: function (x) {
        return "A discipline with no courses takes a code when its first course appears. The quarterly check of the handbook is the procedure to build" +
          (x.procOn("mq_list") ? "." : "; until it runs, the index is as read in May.");
      },
      open: function (x) { return ["Open the " + fmtN(x.total) + " MQ disciplines", TO.all]; },
      more: function () { return ["Procedure", procTarget("mq_list")]; } },
    { id: "authority_tables", title: "The C-ID and CCN subject tables",
      status: function (x) { return x.procOn("authority_tables") ? "done" : "going"; },
      what: function (x) {
        return fmtN(x.cidSubjects) + " C-ID subject codes (" + fmtN(x.cidDescriptors) + " descriptors) and " + fmtN(x.ccnSubjects) + " CCN codes (" +
          fmtN(x.ccnCourses) + " courses)" + (x.cidReadAt ? ", both read " + dayWords(x.cidReadAt) : "") + "; " + plural(x.bothSubjects, "code is in both", "codes are in both") +
          (x.ccnOnly.length ? ", CCN adds " + x.ccnOnly.join(", ") : "") + ".";
      },
      foot: function (x) {
        return (x.differ.length ? "Where they differ, CCN wins: " + x.differ.join("; ") + ". " : "The two agree on every shared subject. ") +
          "The quarterly refresh is the procedure to build.";
      },
      open: function (x) { return ["Open the " + fmtN(x.ccn) + " on a CCN code", TO.ccn]; },
      more: function () { return ["Procedure", procTarget("authority_tables")]; } },
    { id: "authority_rule", title: "The authority's code sets the Common SUBJ", needs: ["scan"],
      status: function (x) { return x.missed ? "going" : "done"; },
      what: function (x) {
        return fmtN(x.ccn) + " MQ disciplines sit on the CCN code, " + fmtN(x.cid) + " on a C-ID code and " + fmtN(x.csr) +
          " on a code this reference minted; " + fmtN(x.chips) + " of those show the authority's code on a chip.";
      },
      meter: function (x) { return [x.onAuthority, x.total, "on an authority code"]; },
      foot: function (x) {
        return x.missed ? plural(x.missed, "missed alignment: the twin discipline's code differs from the official prefix.", "missed alignments: a twin discipline's code differs from the official prefix.")
          : "No missed alignment: every chip is a sub-subject the authority splits finer than the MQ discipline, or a code of two or three letters under the four-letter rule.";
      },
      open: function (x) { return ["Open the " + fmtN(x.chips) + " with a chip", TO.chip]; },
      more: function () { return ["Procedure", procTarget("authority_rule")]; } },
    { id: "mid_subjects", title: "Every M-ID carries its discipline's code", needs: ["scan"],
      status: function (x) { return x.strayCodes ? "going" : "done"; },
      what: function (x) {
        return fmtN(x.codes) + " codes on " + fmtN(x.codeIds) + " minted identities: " + fmtN(x.canonicalCodes) + " are a discipline's Common SUBJ, " +
          fmtN(x.umbrellaOnlyCodes) + " are umbrella codes, " + fmtN(x.strayCodes) + " are strays on " + fmtN(x.strayIds) + " identities.";
      },
      meter: function (x) { return [x.codeIds - x.strayIds, x.codeIds, "on their discipline's code"]; },
      foot: function (x) {
        var top = (x.strays || []).slice(0, 3).map(function (s) { return s.code + " " + fmtN(s.ids); });
        var noDisc = (x.strays || []).filter(function (s) { return s.disciplines && s.disciplines["(no discipline)"]; }).length;
        return (top.length ? "The largest: " + top.join(", ") + ". " : "") +
          (noDisc ? fmtN(noDisc) + " of the stray codes sit on identities with no discipline yet. " : "") +
          "A stray is re-key evidence under the playbook, never a hand edit.";
      },
      open: function () { return ["Open SkyView by subject", TO.skyviewSubjects]; },
      more: function () { return ["Procedure", procTarget("mid_subjects")]; } },
    { id: "every_code_homed", title: "One code, one MQ discipline",
      status: function (x) { return x.collisions || x.invalid ? "going" : "done"; },
      what: function (x) {
        return plural(x.collisions, "code on two MQ disciplines", "codes on two MQ disciplines") + (x.collisionCodes.length ? " (" + x.collisionCodes.join(", ") + ")" : "") +
          "; " + plural(x.aliasShared, "code is shared by design", "codes are shared by design") + "; " +
          plural(x.drift, "discipline carries", "disciplines carry") + " rows off their code.";
      },
      foot: function (x) {
        return x.collisions ? "A collision is a curator's call: another code for one discipline, or the mis-filed identities moved. The umbrellas and the ruled fan-in are not collisions."
          : "The umbrellas and the ruled fan-in are the only shared codes, by design.";
      },
      open: function () { return ["Run the SUBJ check", TO.check]; },
      more: function () { return ["Procedure", procTarget("every_code_homed")]; } },
    { id: "cross_listings", title: "Umbrellas, fan-ins and cross-listed courses",
      status: function () { return "going"; },
      what: function (x) {
        return plural(x.umbrellas, "umbrella discipline carries", "umbrella disciplines carry") + " " + fmtN(x.umbrellaCodes) + " codes beside their own; " +
          plural(x.aliasFamilies, "fan-in family folds", "fan-in families fold") + " " + fmtN(x.aliasNames) + " alternate names, and " +
          plural(x.fanInPairs, "pair shares", "pairs share") + " one code by ruling.";
      },
      foot: function () { return "A course whose colleges disagree about its discipline goes through the cross-list lane; its sheet is " + "Sam's."; },
      open: function () { return ["Open SkyView's disciplines", TO.skyviewDisciplines]; },
      answer: function () { return ["Answer on the cross-list sheet", TO.crosslistSheet]; },
      more: function () { return ["Procedure", procTarget("cross_listings")]; } },
    { id: "confirmation", title: "Confirmation",
      status: function (x) { return x.unconfirmed ? "going" : "done"; },
      what: function (x) {
        return fmtN(x.confirmed) + " of " + fmtN(x.total) + " picks confirmed by a person" + (x.cohort ? " or a session cohort (" + fmtN(x.cohort) + ")" : "") +
          "; " + fmtN(x.unconfirmed) + " wait, " + fmtN(x.unconfirmedAuthority) + " of them on the authority's own code.";
      },
      meter: function (x) { return [x.confirmed, x.total, "confirmed"]; },
      foot: function (x) {
        return x.procOn("confirmation")
          ? "The nightly procedure confirms a pick on the authority's own code under csr-confirm-authority@bot (Sam, Sheet 99, 2026-10-19); " +
            fmtN(x.cohort) + " picks carry a procedure's or a session cohort's stamp."
          : "The cohort confirm of authority-coded picks is proposed, a card for " + x.decider + ".";
      },
      open: function (x) { return ["Open the " + fmtN(x.unconfirmed) + " waiting", TO.confirm]; },
      more: function () { return ["Procedure", procTarget("confirmation")]; } },
    { id: "checks", title: "The daily scan and Jev's sitting", needs: ["scan"],
      status: function (x) { return x.askable ? "going" : "done"; },
      what: function (x) {
        return "The scan of " + dayWords(x.scanDay) + ": " + plural(x.findings, "finding", "findings") + "; " + fmtN(x.askable) + " need a judgment (" +
          x.askableWords + "), " + fmtN(x.byRule.cs7_unreviewed || 0) + " are the unconfirmed picks, " + fmtN(x.byRule.cs4_aligned || 0) + " confirm an alignment.";
      },
      foot: function () { return "Daily, read-only, from the daily run; Jev sits on dispatch. A recorded note settles a divergence and the scan stops asking."; },
      open: function () { return ["Open the findings", TO.findings]; },
      more: function () { return ["Procedure", procTarget("checks")]; } }
  ];
  var SOURCE = {
    scan: "The daily scan's file (" + SCAN_URL + ")", Q: "The reference's run log (" + STATUS_URL + ")",
    procs: "The procedures store (" + PROCS_URL + ")", mq: "The MQ handbook's index (kb/reference/mq_sections.json)"
  };
  /* The headline pair: every MQ discipline with courses on the map beside the ones whose Common
     SUBJ is settled: confirmed by a person, on the authority rule, in no collision. */
  var HEADLINE = {
    label: "Every MQ discipline with courses on the map, and how many carry a settled Common SUBJ",
    needs: [],
    all: { n: function (x) { return x.total; },
      words: "MQ disciplines with courses on the map",
      small: function (x) { return x.mqTotal != null ? "The handbook's Disciplines Index names " + fmtN(x.mqTotal) + "; " + fmtN(x.mqNoCourses) + " carry no courses" : "The handbook's Disciplines Index could not be read"; } },
    mine: { n: function (x) { return x.settled; },
      words: "carry a settled Common SUBJ",
      small: "Confirmed (by a person, or by the nightly procedure where the code is the authority's own), on the authority rule, in no collision with another MQ discipline",
      open: function (x) { return x.settled > 0 ? ["Open the " + fmtN(x.confirmed) + " confirmed", TO.reviewed] : null; } },
    barLabel: function (x) { return fmtN(x.settled) + " of " + fmtN(x.total) + " MQ disciplines settled"; },
    within: function (x) {
      return [{ n: x.unconfirmed, words: " picks wait for a person" },
        x.collisions > 0 ? { go: [plural(x.collisions, "collision", "collisions"), TO.check] } : null,
        { n: x.onAuthority, words: " on the authority's own code" }];
    }
  };
  var PROGRESS = {
    title: "Common Subjects Reference", sub: "Progress",
    lede: "Where the reference stands. The milestones and cards are read live from the seed, the picks and the daily scan on each visit; the next step, the calls and what changed come from the last session's checkpoint. Each card's procedure is under the cards.",
    milestones: MILESTONES, parts: PARTS, partsTitle: "The steps", headline: HEADLINE, sources: SOURCE
  };

  /* ── the context x ── */
  function progressContext(now) {
    var rows = mergedEntries();
    var CP = window.CPL_COMMONS_PROGRESS;
    var scan = state.scan && state.scan.data, Q = state.status && state.status.data, procsDoc = state.procs && state.procs.data;
    var errors = {};
    if (state.scan && state.scan.error) errors.scan = state.scan.error;
    if (state.status && state.status.error) errors.Q = state.status.error;
    if (state.procs && state.procs.error) errors.procs = state.procs.error;
    var mqTotal = state.mq && Object.keys(state.mq).length ? Object.keys(state.mq).length : null;
    if (mqTotal == null) errors.mq = "the index was empty or did not load";
    var confirmed = rows.filter(isConfirmed);
    var person = confirmed.filter(function (e) { return !isCohort(e.reviewed_by); }).length;
    var unconfirmed = rows.filter(function (e) { return !isConfirmed(e); });
    var check = runSubjCheck();
    var collided = {};
    check.collisions.forEach(function (c) { c.owners.forEach(function (o) { collided[o.d] = true; }); });
    var settled = confirmed.filter(function (e) { return !collided[e.discipline]; });
    var collidedDisc = rows.filter(function (e) { return collided[e.discipline]; }).length;
    var chips = rows.filter(function (e) { return authorityChips(e).length; });
    var bySource = { ccn: 0, "c-id": 0, csr: 0 };
    rows.forEach(function (e) { if (Object.prototype.hasOwnProperty.call(bySource, e.canonical_source)) bySource[e.canonical_source]++; });
    var umbrellas = rows.filter(function (e) { return (e.umbrella_codes || []).length; });
    var umbrellaCodes = {};
    umbrellas.forEach(function (e) { e.umbrella_codes.forEach(function (c) { if (c !== e.canonical_subj4) umbrellaCodes[c] = 1; }); });
    var fanIns = rows.filter(function (e) { return (e.fan_in_with || []).length; });
    var aliasFamilies = Object.keys(state.aliases || {});
    var aliasNames = aliasFamilies.reduce(function (n, k) { return n + ((state.aliases[k] || []).length); }, 0);
    var cidSubj = Object.keys(state.cidBySubj || {}), ccnSubj = Object.keys(state.ccnBySubj || {});
    var both = ccnSubj.filter(function (s) { return state.cidBySubj[s]; });
    var ccnOnly = ccnSubj.filter(function (s) { return !state.cidBySubj[s]; }).sort();
    var differ = rows.filter(function (e) {
      return e.ccn_subject_code && (e.cid_subject_codes || []).length && e.cid_subject_codes.indexOf(e.ccn_subject_code) < 0;
    }).map(function (e) { return e.discipline + " is " + e.ccn_subject_code + ", C-ID says " + e.cid_subject_codes.join(", "); });
    var byRule = {}, askable = null, judgments = null, askableWords = "", toNote = null, toNoteWords = "";
    if (scan) {
      scan.findings.forEach(function (f) { byRule[f.rule] = (byRule[f.rule] || 0) + 1; });
      var ask = scan.findings.filter(function (f) { return f.needs_judgment && f.rule !== "cs7_unreviewed" && f.rule !== "cs4_aligned"; });
      askable = ask.length;
      /* The opened page's findings item: those needing judgment, less the ones another item counts (the unconfirmed,
         the collisions, the missed alignments) and the aligned ones. kb/_build_commons_status.py counts the same set
         for the Commons card (CSR_ASK_SKIP there), so the card and the page agree (S561). */
      var note = scan.findings.filter(function (f) { return f.needs_judgment && ASK_SKIP.indexOf(f.rule) < 0; });
      toNote = note.length;
      var nr = {};
      note.forEach(function (f) { nr[f.rule] = (nr[f.rule] || 0) + 1; });
      toNoteWords = Object.keys(nr).sort(function (a, b) { return nr[b] - nr[a]; }).map(function (r) { return fmtN(nr[r]) + " " + (RULE_WORDS[r] || r); }).join(", ");
      judgments = (byRule.cs6_weak_mnemonic || 0) + (byRule.cs5_modal_diverge || 0);
      var ar = {};
      ask.forEach(function (f) { ar[f.rule] = (ar[f.rule] || 0) + 1; });
      askableWords = Object.keys(ar).sort(function (a, b) { return ar[b] - ar[a]; }).map(function (r) { return fmtN(ar[r]) + " " + (RULE_WORDS[r] || r); }).join(", ") || "none";
    }
    var mc = scan && scan._mid_codes || null;
    var plist = procsDoc && procsDoc.procedures || null;
    var procOn = function (id) { return !!(plist || []).filter(function (p) { return p.id === id && p.on; }).length; };
    var x = {
      rows: rows, Q: Q, scan: scan || null, procs: plist, mq: mqTotal == null ? null : state.mq, errors: errors, now: now,
      decider: (Q && Q.decider) || "Sam", procOn: procOn,
      total: rows.length, confirmed: confirmed.length, person: person, cohort: confirmed.length - person,
      validated: rows.filter(function (e) { return e.validated_at; }).length,
      unconfirmed: unconfirmed.length, unconfirmedAuthority: unconfirmed.filter(onAuthorityCode).length,
      settled: settled.length, personSettled: settled.filter(function (e) { return !isCohort(e.reviewed_by); }).length, missingCode: rows.filter(function (e) { return !hasCode(e); }).length, collidedDisc: collidedDisc,
      fanInDisc: fanIns.length,
      collisions: check.collisions.length, collisionCodes: check.collisions.map(function (c) { return c.code; }),
      aliasShared: check.aliasShared.length, drift: check.drift.length, driftRows: check.nRowsOff, invalid: check.invalid.length,
      chips: chips.length, ccn: bySource.ccn, cid: bySource["c-id"], csr: bySource.csr, onAuthority: bySource.ccn + bySource["c-id"],
      umbrellas: umbrellas.length, umbrellaCodes: Object.keys(umbrellaCodes).length, fanInPairs: Math.round(fanIns.length / 2),
      aliasFamilies: aliasFamilies.length, aliasNames: aliasNames,
      mqTotal: mqTotal, mqNoCourses: mqTotal == null ? null : mqTotal - rows.length, mqReadAt: state.mqDoc && (state.mqDoc._extracted_at || null),
      cidSubjects: cidSubj.length, cidDescriptors: state.cidMeta && state.cidMeta.count, cidReadAt: state.cidMeta && retrievedDay(state.cidMeta.source),
      ccnSubjects: ccnSubj.length, ccnCourses: state.ccnMeta && state.ccnMeta.count, bothSubjects: both.length, ccnOnly: ccnOnly, differ: differ,
      toNote: toNote, toNoteWords: toNoteWords,
      scanDay: scan && scan._scanned_at, missed: scan ? (byRule.cs4_missed_alignment || 0) : null, judgments: judgments, askable: askable,
      askableWords: askableWords, byRule: byRule, findings: scan ? scan.findings.length : null,
      codes: mc ? mc.codes : null, codeIds: mc ? mc.ids : null, canonicalCodes: mc ? mc.canonical : null, umbrellaOnlyCodes: mc ? mc.umbrella : null,
      strayCodes: mc ? mc.stray_codes : null, strayIds: mc ? mc.stray_ids : null, strays: mc ? mc.strays : [],
      procsOn: plist ? plist.filter(function (p) { return p.on; }).length : null, procsAll: plist ? plist.length : null,
      routinesToBuild: plist ? plist.filter(function (p) { return p.kind === "routine" && !p.on; }).length : null,
      proposed: plist ? plist.filter(function (p) { return p.kind !== "routine" && !p.on; }).length : null,
      syncedAt: state.seed && state.seed._synced_at
    };
    if (CP) {
      var st = CP.steps(MILESTONES, x);
      x.steps = st.steps; x.here = st.here; x.next = st.next;
    }
    return x;
  }

  /* ── the host the shared module borrows: sections, count controls, call cards ── */
  function secs() {
    if (!state.secs) {
      try { state.secs = JSON.parse(localStorage.getItem(SECS_KEY) || "{}") || {}; } catch (e) { state.secs = {}; }
    }
    return state.secs;
  }
  function secOpen(key) { var m = secs(); return m[key] != null ? !!m[key] : true; }
  function secSet(key, open) {
    secs()[key] = !!open;
    try { localStorage.setItem(SECS_KEY, JSON.stringify(state.secs)); } catch (e) { /* private window */ }
  }
  function section(key, title, meta, kids, opts) {
    opts = opts || {};
    var lazy = typeof kids === "function";
    var b = el("div", { class: "cs-sec-b" }, lazy ? [] : (kids || []).filter(function (k) { return k != null; }));
    var sum = el("summary", { class: "cs-sec-sum" }, [
      opts.label ? el("span", { class: "cs-sec-label" }, [opts.label]) : null,
      el(opts.h || "h3", { class: "cs-sec-t" }, [title]),
      meta ? el("span", { class: "cs-sec-meta" }, [meta]) : null
    ].filter(Boolean));
    var d = el("details", { class: "cs-sec" + (opts.cls ? " " + opts.cls : ""), "data-sec": key }, [sum, b]);
    if (!opts.shut && (opts.open || secOpen(key))) d.setAttribute("open", "");
    if (lazy) {
      var built = false;
      var fill = function () {
        if (built || !d.hasAttribute("open")) return;
        built = true;
        kids().forEach(function (k) { if (k != null) b.appendChild(k); });
      };
      fill();
      d.addEventListener("toggle", fill);
    }
    d.addEventListener("toggle", function () { secSet(key, d.open); });
    return d;
  }
  function bringUp(node) {
    if (!node) return;
    if (node.scrollIntoView) node.scrollIntoView({ block: "start" });
    try { node.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
  }
  /* A count's target, applied: the List with one filter set (or one MQ discipline's panel open);
     the SUBJ check; a section of this view (and a procedure's card inside it). */
  function goTo(to) {
    if (!to) return;
    if (to.view === "list") {
      var L = listState();
      L.f = to.filter || ""; L.q = to.search || ""; L.cf = to.cf || {};
      if (to.panel) L.panel = to.panel;
      applyView("list");
      bringUp(document.getElementById("cs-list"));
      return;
    }
    if (to.check) { openCheckModal(); return; }
    if (to.sec) {
      secSet(to.sec, true);
      applyView("progress");
      var sec = document.querySelector('#cs-progress details[data-sec="' + to.sec + '"]');
      if (sec) sec.setAttribute("open", "");
      var card = to.proc ? document.getElementById("cs-proc-" + to.proc) : null;
      if (card) card.setAttribute("open", "");
      bringUp(card || sec);
    }
  }
  function goControl(words, to, cls) {
    if (to && to.href) {
      var a = el("a", { class: "cs-word " + (cls || ""), href: to.href }, [words]);
      if (/^https:\/\//.test(to.href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
      return a;
    }
    var b = el("button", { class: "cs-word " + (cls || ""), type: "button" }, [words]);
    b.addEventListener("click", function () { goTo(to); });
    return b;
  }
  /* A call is answered on its sheet; the checkpoint that records the answer removes it from
     the run log, so an open call here is open. */
  function callAnswered() { return false; }
  function callRecords() { return null; }
  function callLinks(c) {
    var out = [];
    if (c.link && /^https:\/\//.test(c.link)) out.push(el("a", { class: "cs-word", href: c.link, target: "_blank", rel: "noopener" }, [c.link_text || "Open the decision sheet"]));
    var v = c.view;
    if (v && v.href && v.text) {
      if (/^#[A-Za-z0-9_.~\/-]+$/.test(v.href)) out.push(el("a", { class: "cs-word", href: v.href }, [v.text]));
      else if (/^https:\/\//.test(v.href)) out.push(el("a", { class: "cs-word", href: v.href, target: "_blank", rel: "noopener" }, [v.text]));
    }
    return out.length ? el("p", { class: "cs-links" }, out) : null;
  }
  function goToCall(i) {
    secSet("progress:call:" + i, true);
    var card = document.querySelector('#cs-progress details[data-sec="progress:call:' + i + '"]');
    if (card) { card.setAttribute("open", ""); bringUp(card); }
  }
  var HOST = {
    classes: { sec: "cs-sec", secBody: "cs-sec-b", secTitle: "cs-sec-t", secLabel: "cs-sec-label", quiet: "cs-quiet", caution: "cs-caution", lede: "cs-lede" },
    section: section, goControl: goControl, callAnswered: callAnswered, callRecords: callRecords, callLinks: callLinks, goToCall: goToCall
  };

  /* ── the procedures, under the cards (Sam: "stores the procedures needed by agents") ── */
  function procedureCard(p) {
    var head = el("summary", { class: "cs-sec-sum" }, [
      el("span", { class: "cs-sec-label" }, [(p.kind || "procedure") + (p.on ? ", in force" : ", not yet on") + (p.cadence ? ", " + p.cadence : "")]),
      el("h4", { class: "cs-sec-t" }, [p.name || p.id]),
      p.status ? el("span", { class: "cs-sec-meta" }, [p.status]) : null
    ].filter(Boolean));
    var body = [el("p", { class: "cs-proc-rule" }, [p.rule || ""])];
    if (Array.isArray(p.steps) && p.steps.length) body.push(el("ol", { class: "cs-proc-steps" }, p.steps.map(function (s) { return el("li", null, [s]); })));
    var meta = [];
    if (p.owner) meta.push("Owner: " + p.owner);
    if (Array.isArray(p.reads) && p.reads.length) meta.push("Reads: " + p.reads.join(", "));
    if (p.source && (p.source.who || p.source.words)) meta.push("Source: " + [p.source.who, p.source.date].filter(Boolean).join(", ") + (p.source.words ? ": " + p.source.words : ""));
    if (meta.length) body.push(el("p", { class: "cs-proc-meta" }, [meta.join(". ") + "."]));
    return el("details", { class: "cs-sec cs-proc", id: "cs-proc-" + p.id, "data-proc": p.id }, [head, el("div", { class: "cs-sec-b" }, body)]);
  }
  function proceduresSection(x) {
    var kids;
    if (!x.procs) kids = [el("p", { class: "cs-caution", role: "status" }, [SOURCE.procs + " could not be read (" + (x.errors.procs || "not read yet") + ")."])];
    else kids = [el("p", { class: "cs-quiet" }, ["One procedure per card: a rule in plain words, who set it and when, what it reads, who owns it and how often it runs. A session reads the same file before working the reference; a routine not yet on is the next build."])]
      .concat(x.procs.map(procedureCard));
    var meta = x.procs ? fmtN(x.procsOn) + " of " + fmtN(x.procsAll) + " in force" : "Could not be read";
    return section("progress:procedures", "Procedures", meta, kids, { cls: "cs-procs", h: "h4" });
  }
  /* ── the findings needing a judgment, from the daily scan ── */
  function findingsSection(x) {
    var kids;
    if (!x.scan) kids = [el("p", { class: "cs-caution", role: "status" }, [SOURCE.scan + " could not be read (" + (x.errors.scan || "not read yet") + ")."])];
    else {
      var ask = x.scan.findings.filter(function (f) { return f.needs_judgment && f.rule !== "cs7_unreviewed" && f.rule !== "cs4_aligned"; });
      kids = [el("p", { class: "cs-quiet" }, ["The scan of " + dayWords(x.scanDay) + ". Each line is one finding that needs a judgment; the unconfirmed picks are counted on the Confirmation card instead. A word opens its panel on the List."])];
      if (!ask.length) kids.push(el("p", null, ["No finding needs a judgment."]));
      else kids.push(el("ul", { class: "cs-findings" }, ask.map(function (f) {
        var disc = state.seed && state.seed.disciplines && state.seed.disciplines[f.item] ? f.item : null;
        var li = el("li", null, [el("b", null, [RULE_WORDS[f.rule] || f.rule]), ": " + f.item + ". " + (f.evidence || "") + (f.suggestion ? " " + f.suggestion.charAt(0).toUpperCase() + f.suggestion.slice(1) + "." : "")]);
        if (disc) {
          li.appendChild(document.createTextNode(" "));
          li.appendChild(goControl("Open its panel", { view: "list", panel: disc }));
        }
        return li;
      })));
    }
    var meta = x.scan ? plural(x.askable, "finding", "findings") : "Could not be read";
    return section("progress:findings", "Findings waiting on a judgment", meta, kids, { cls: "cs-findings-sec", h: "h4" });
  }

  /* ── the opened page (S556): the CPL Commons mock's shape, drawn by commons_page.js ──
     Sam locked the mock on 2026-11-02 (S552); its opened page is the pattern for every reference: the progress line
     over one denominator, Needs attention with an action each, three questions with every count over that same
     denominator. Here the denominator is the MQ discipline with courses, the headline's own unit (complete: a settled
     Common SUBJ, confirmed, on the authority rule, in no collision). A subject code carries no credit, so the questions
     fit a code: what it is called, whose code it is, how it reaches the courses. Every figure is the context the dash
     already reads live (progressContext), so the two cannot disagree; the dash stays one word away, under Details. */
  function subjPageSpec(x) {
    var Q = x.Q, go = function (to) { return function () { goTo(to); }; };
    var calls = Q && Array.isArray(Q.calls) ? Q.calls : [];
    var open = calls.filter(function (c) { return !(c.answer && c.answer.words); });
    var first = function (t) { var m = String(t || "").trim().match(/^[^.]*\.(?=\s|$)/); return m ? m[0] : String(t || "").trim(); };
    var recently = Q && Array.isArray(Q.changes) && Q.changes[0] && Q.changes[0].text ? "Recently: " + first(Q.changes[0].text) : "";
    var split = fmtN(x.person) + " confirmed by a person, " + fmtN(x.cohort) + " by the nightly procedure or a session cohort.";
    var items = [
      { n: x.unconfirmed, words: x.unconfirmed === 1 ? "MQ discipline on the data's modal code, unconfirmed." : "MQ disciplines on the data's modal code, unconfirmed.",
        action: { words: "Confirm them", go: go(TO.confirm) } },
      { n: x.collisions, words: x.collisions === 1 ? "Common SUBJ shared by two MQ disciplines." : "Common SUBJs shared by two or more MQ disciplines.",
        action: { words: "Check them", go: go(TO.check) } },
      { n: x.scan ? x.toNote : null, words: (x.toNote === 1 ? "scan finding to confirm or note" : "scan findings to confirm or note") + (x.toNoteWords ? " (" + x.toNoteWords + ")." : "."),
        action: { words: "Open the findings", go: go(TO.findings) } },
      x.missed ? { n: x.missed, words: x.missed === 1 ? "missed alignment with an authority code." : "missed alignments with an authority code.",
        action: { words: "Open them", go: go(TO.chip) } } : null,
      { n: x.strayCodes, words: "identity codes that are neither a Common SUBJ nor an umbrella code" +
        (x.strayIds != null ? ", on " + fmtN(x.strayIds) + " identities" : "") + ", for a re-mint under the playbook." }
    ];
    open.forEach(function (c) {
      items.push({ n: 1, words: "decision for " + x.decider + ": " + (c.title || "an open call") + ".",
        action: c.link && /^https:\/\//.test(c.link) ? { words: "Open the decision sheet", href: c.link } : null });
    });
    items = items.filter(Boolean);
    var sheet = calls.filter(function (c) { return c.link && /^https:\/\//.test(c.link); }).slice(-1)[0];
    var on = (x.procs || []).filter(function (p) { return p.on; }).length;
    var r = function (label, n, to) { return { label: label, n: n, go: go(to || TO.all) }; };
    var total = x.total;
    return {
      label: "Common Subjects Reference", prefix: "cs-pg-", reading: false,
      status: open.length ? "Needs you" : "In progress",
      lede: "The Common Subjects Reference: one Common SUBJ for each MQ discipline, the key every M-ID is minted under.",
      read: x.scanDay ? "Scanned " + x.scanDay + "." : "",
      links: [x.procs ? { words: "How it is kept: " + fmtN(on) + " procedures in force", go: go(TO.procedures) } : null,
        sheet ? { words: "Decision record", href: sheet.link } : null].filter(Boolean),
      progress: { n: x.settled, of: total, short: "settled", words: "MQ disciplines with courses carry a settled Common SUBJ",
        // Confirmed by a person, beside settled (Sheet 160; Sam, S565, 2026-11-03: all five references).
        confirmed: { n: x.person, done: x.personSettled, doneWords: "settled" },
        recently: [recently, split].filter(Boolean).join(" "),
        calls: Q ? (open.length ? (open.length === 1 ? "One decision waits on " : fmtN(open.length) + " decisions wait on ") + x.decider + "."
          : "No decisions wait on " + x.decider + ".") : "" },
      attention: { items: items, empty: "Nothing in the reference waits on a person.",
        next: Q && Q.next_step && Q.next_step.title ? Q.next_step.title + (Q.next_step.text ? ". " + Q.next_step.text : "") : "" },
      groups: [
        { q: "What is it called?", rows: [r("A Common SUBJ code", total - x.missingCode), r("Confirmed", x.confirmed, TO.reviewed),
          r("In no collision", total - x.collidedDisc, TO.check)] },
        { q: "Whose code is it?", rows: [r("The CCN's", x.ccn, TO.ccn), r("C-ID's", x.cid, TO.cid), r("Minted here", x.csr)] },
        { q: "How does it reach the courses?", rows: [r("An umbrella code over others", x.umbrellas), r("Paired in a fan-in", x.fanInDisc)] }
      ],
      of: total, ofWords: "MQ disciplines with courses",
      foot: "The reference is staging: not yet faculty-published. This page reads the picks live; the CPL Commons card counts them as the daily sync committed them, so between syncs this page runs ahead of it."
    };
  }

  /* ── the view, drawn by the shared module from this reference's definitions and context ── */
  function withProgressModule(cb) {
    if (window.CPL_COMMONS_PROGRESS && window.CPL_COMMONS_PAGE) { cb(); return; }
    if (window.CPL_TABS && typeof window.CPL_TABS.loadScript === "function") {
      window.CPL_TABS.loadScript("commons_progress.js", "CPL_COMMONS_PROGRESS", function () {
        // The opened page (S556): commons_page.js draws the CPL Commons mock's shape over the dash.
        window.CPL_TABS.loadScript("commons_page.js", "CPL_COMMONS_PAGE", cb);
      });
      return;
    }
    cb();
  }
  function renderProgress() {
    var mount = document.getElementById("cs-progress");
    if (!mount || !state.seed) return;
    withProgressModule(function () {
      var CP = window.CPL_COMMONS_PROGRESS;
      mount.innerHTML = "";
      if (!CP) {
        mount.appendChild(el("p", { class: "cs-caution", role: "alert" },
          ["The Progress view's shared module (commons_progress.js) could not be loaded. The List reads as usual; reload the tab to try again."]));
        return;
      }
      ensureProgressCss();
      var x = progressContext(new Date());
      var dash = CP.render(PROGRESS, x, { readAt: state.readAt || new Date(), errors: x.errors }, HOST);
      var PG = window.CPL_COMMONS_PAGE;
      if (PG) {
        /* The opened page first; the milestones and steps one word away (the Commons first view's Details). */
        mount.appendChild(PG.render(subjPageSpec(x)));
        mount.appendChild(el("details", { class: "cs-sec cs-more", "data-sec": "progress:details" }, [
          el("summary", { class: "cs-sec-sum" }, [el("h3", { class: "cs-sec-t" }, ["Details: the milestones and the steps"])]),
          el("div", { class: "cs-sec-b" }, [dash])]));
      } else mount.appendChild(dash);
      mount.appendChild(proceduresSection(x));
      mount.appendChild(findingsSection(x));
    });
  }

  /* ── List: every MQ discipline on one sheet, A to Z (the Catalog Commons' shared List) ──
     Sam, 2026-11-01, after the Exhibits List: "This new list view is so helpful that I want one now for each of our
     Catalog Commons groups." commons_list.js draws it; this spec makes it the CSR's: one row per MQ discipline with
     courses (147), its Common SUBJ, who confirmed it (a person, the nightly procedure, or open), the Local SUBJs
     colleges use for its courses and how many, its local courses and M-IDs, and any collision. Edit, Edit every row
     and Confirm this pick write through the table's own save path (canonCheck, writeCanon, writeNote: the
     _CANON_SUBJ4:: kb_curation rows), so the List adds no write surface. No flag column: the reference has no flag
     field. No find and replace: a replace on Common SUBJ would hand one code to several MQ disciplines, and a note
     saved where no code row exists stands in as the review (fetchOverlay and the sync read it so), so a replace
     across notes would confirm picks as a side effect. */
  var LIST_ENGINE = null, listLoading = false, listFailed = false;
  var NIGHTLY_COHORT = "csr-confirm-authority@bot";
  var CONFIRM_WORDS = { person: "Confirmed by a person", nightly: "Confirmed by the nightly procedure",
    cohort: "Confirmed by a session cohort", open: "Open" };
  var SOURCE_WORDS = { ccn: "CCN", "c-id": "C-ID", csr: "Minted here" };
  /* A new visit's List state; a quickstart hint waiting for the List (state.qsList) sets its filter, find and TOP once. */
  function listState() {
    if (state.ls) return state.ls;
    var L = state.ls = {}, q = state.qsList;
    if (q) {
      state.qsList = null;
      if (q.f) L.f = q.f;
      if (q.q) L.q = q.q;
      if (q.top) { L.cf = {}; L.cf[listCols().map(function (c) { return c.h; }).indexOf("TOP")] = q.top; }
    }
    return L;
  }
  /* The List's filters; #canonical-subj4/list/<id> opens the List on one (a Commons count, Sam 2026-11-03). */
  var LIST_FILTERS = [["", "All"], ["open", "Open"], ["suggested", "Suggested picks"], ["confirmed", "Confirmed"],
    ["person", "Confirmed by a person"], ["procedure", "Confirmed by a procedure"], ["nocode", "No code yet"], ["collision", "In a collision"],
    ["ccn", "On the CCN code"], ["cid", "On the C-ID code"], ["chip", "An official code differs"], ["proposed", "Proposed, no official code"],
    ["selected", "Selected"], ["changed", "Changed this visit"]];
  function listFilterId(id) { return LIST_FILTERS.some(function (f) { return f[0] === id; }) ? id : null; }
  function confirmedHow(e) {
    if (!isConfirmed(e)) return "open";
    if (!isCohort(e.reviewed_by)) return "person";
    return e.reviewed_by === NIGHTLY_COHORT ? "nightly" : "cohort";
  }
  /* One row per MQ discipline, built from the same merge, check and index the table reads; a save clears it
     (invalidateSubjIndex). A collision is the check's (two MQ disciplines on one code); a code shared by design
     (an alias family, a ruled fan-in, an umbrella code) rides in the drawer, never the column. */
  function listRowsAll() {
    if (state._listRows) return state._listRows;
    var check = runSubjCheck(), coll = {}, shared = {}, drift = {};
    function add(map, rec) {
      rec.owners.forEach(function (o) {
        (map[o.d] = map[o.d] || []).push({ code: rec.code, why: o.why, others: rec.owners.filter(function (x) { return x.d !== o.d; }) });
      });
    }
    check.collisions.forEach(function (c) { add(coll, c); });
    check.aliasShared.forEach(function (c) { add(shared, c); });
    check.drift.forEach(function (x) { drift[x.d] = x; });
    state._listRows = mergedEntries().map(function (e) {
      var lv = variantsFor(e), fromLocal = !!(e.local_subject_variants && Object.keys(e.local_subject_variants).length);
      var locals = Object.keys(lv).map(function (k) { return [k, lv[k]]; })
        .sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); });
      return { ut: e.discipline, e: e, how: confirmedHow(e), coll: coll[e.discipline] || [], shared: shared[e.discipline] || [],
        drift: drift[e.discipline] || null, locals: locals, more: fromLocal ? (e.local_subject_variants_truncated || 0) : 0 };
    });
    return state._listRows;
  }
  function collisionWords(r) {
    return r.coll.map(function (c) { return c.code + " with " + c.others.map(function (o) { return o.d; }).join(", "); }).join("; ");
  }
  function localWords(r) {
    return r.locals.map(function (x) { return x[0] + " (" + fmtN(x[1]) + ")"; }).join(", ") + (r.more ? ", and " + fmtN(r.more) + " more" : "");
  }
  function authorityWords(r) {
    var e = r.e, src = SOURCE_WORDS[e.canonical_source] || "";
    if (src && e.authority_flag === "proposed") src += " (proposed)";
    var chips = authorityChips(e).map(function (c) { return c.system + " says " + c.code; });
    return [src].concat(chips).filter(Boolean).join("; ");
  }
  function topWords(r) {
    var e = r.e;
    return e.top_category_2digit ? e.top_category_2digit + (e.top_category_title ? " " + e.top_category_title : "") : "";
  }
  function listCols() {
    return [
      { h: "MQ Discipline", w: 17, v: function (r) { return r.ut; } },
      { h: "Common SUBJ", w: 7, edit: "subj", v: function (r) { return r.e.canonical_subj4 || ""; } },
      { h: "Status", w: 11, v: function (r) { return CONFIRM_WORDS[r.how]; } },
      { h: "Collision", w: 11, v: collisionWords },
      { h: "Local SUBJs", w: 16, v: localWords },
      { h: "Local SUBJ count", w: 5, n: true, v: function (r) { return r.locals.length + r.more; } },
      { h: "Local courses", w: 6, n: true, v: function (r) { return r.e.local_subject_total == null ? null : r.e.local_subject_total; } },
      { h: "M-IDs", w: 5, n: true, v: function (r) { return r.e.total_mids == null ? null : r.e.total_mids; } },
      { h: "Authority", w: 7, v: authorityWords },
      // The TOP category, a fuzzy filter only (TOP is a last-in-line signal): the Reference view's TOP filter and grouping,
      // carried as a column a reader filters and sorts (2026-11-04).
      { h: "TOP", w: 9, v: topWords },
      { h: "Notes", w: 8, edit: "notes", v: function (r) { return r.e._notes || ""; } }
    ];
  }
  function listNote(text) { if (LIST_ENGINE) LIST_ENGINE.cellNote(text); }
  function listChanged(r) { if (LIST_ENGINE) LIST_ENGINE.markChanged(r.ut); }
  /* An open pick as the List's suggestion (the List norms, 2026-11-01): the code the seed proposes, with its reason,
     shown on every filter (the open picks are few). Confirm this pick writes the discipline's own code through the
     table's path, the same write as the Status drawer's; Dismiss sets it aside for the visit. */
  function listSuggestOf(r) {
    var e = r.e;
    // A code in a collision is a call for a person, never a suggestion: one code belongs to one MQ discipline.
    if (r.how !== "open" || !hasCode(e) || r.coll.length) return null;
    var share = e.data_modal === e.canonical_subj4 && e.data_modal_share ? Math.round(e.data_modal_share * 100) : null;
    return { text: e.canonical_subj4 + " as the Common SUBJ",
      why: e.source === "data_modal" ? "the code colleges use most for its courses" + (share != null ? ", " + share + "% of them" : "")
        : e.canonical_source === "ccn" ? "the CCN code" : e.canonical_source === "c-id" ? "the C-ID code" : "the seed's pick, not yet confirmed by a person" };
  }
  function listSuggestAccept(r) {
    var code = r.e.canonical_subj4;
    return listSaveCode(r, code, { confirm: true }).then(function (res) {
      if (res.ok) render();
      return { ok: res.ok, words: res.words };
    });
  }
  /* After a save: the table repaints (it is one click away and reads the same overlay), then the List, with
     focus back on the box or word that had it, so Edit every row keeps its place. */
  function listAfterSave(text) {
    render();
    if (!LIST_ENGINE) return;
    LIST_ENGINE.state().cellNote = text;
    var a = document.activeElement, label = a && a.getAttribute ? a.getAttribute("aria-label") : null;
    LIST_ENGINE.redraw();
    if (label) {
      var n = Array.prototype.filter.call(document.querySelectorAll("#cs-list [aria-label]"), function (x) { return x.getAttribute("aria-label") === label; })[0];
      if (n) n.focus();
    }
  }
  function signinWords() { return "Sign in as a reviewer to save; the sign-in sits at the head of the List."; }
  function failWords(r) { return r && r.status ? "status " + r.status : "no answer"; }
  /* A Common SUBJ through the table's path. Resolves to the words for the note line; `ok` says whether it saved.
     A List save never writes an empty code: the overlay would keep the seed's and only the reviewer would move. */
  function listSaveCode(r, value, opts) {
    var e = r.e, v = String(value == null ? "" : value).replace(/\s+/g, "").toUpperCase(), was = (e.canonical_subj4 || "").toUpperCase();
    opts = opts || {};
    if (v === was && !opts.confirm) return Promise.resolve({ ok: false, same: true, words: "Nothing changed." });
    if (!v) return Promise.resolve({ ok: false, words: "A Common SUBJ cannot be empty; " + (was || "the pick") + " stays on " + r.ut + "." });
    if (!state.sess) return Promise.resolve({ ok: false, words: signinWords() });
    var stop = canonCheck(e, v);
    if (stop === "format") return Promise.resolve({ ok: false, words: "A Common SUBJ is four letters, A to Z, and " + v + " is not; " + (was || "the pick") + " stays on " + r.ut + "." });
    if (stop === "declined") return Promise.resolve({ ok: false, words: v + " stays off " + r.ut + "; nothing changed." });
    return writeCanon(e, v).then(function (res) {
      if (!res.ok) return { ok: false, words: "The Common SUBJ of " + r.ut + " did not save (" + failWords(res) + "); it is back as it was." };
      return { ok: true, words: opts.confirm && v === was ? "Confirmed " + v + " for " + r.ut + "." : "Saved " + r.ut + ": " + v + "." };
    }, function () { return { ok: false, words: "The Common SUBJ of " + r.ut + " did not save (no answer); it is back as it was." }; });
  }
  function listSaveNote(r, text) {
    var e = r.e;
    if (text === (e._notes || "")) return Promise.resolve({ ok: false, same: true, words: "Nothing changed." });
    if (!state.sess) return Promise.resolve({ ok: false, words: signinWords() });
    return writeNote(e, text).then(function (res) {
      if (!res.ok) return { ok: false, words: "The note on " + r.ut + " did not save (" + failWords(res) + "); it is back as it was." };
      return { ok: true, words: "Saved the note on " + r.ut + "." };
    }, function () { return { ok: false, words: "The note on " + r.ut + " did not save (no answer); it is back as it was." }; });
  }
  function listSaveRow(r) {
    var L = listState(), d = L.draft || {};
    var code = String(d.subj == null ? "" : d.subj).replace(/\s+/g, "").toUpperCase(), note = String(d.notes == null ? "" : d.notes);
    var codeChanged = code !== (r.e.canonical_subj4 || "").toUpperCase(), noteChanged = note !== (r.e._notes || "");
    if (!codeChanged && !noteChanged) { L.edit = null; L.draft = null; L.note = "Nothing changed."; listRepaint(); return Promise.resolve(); }
    L.busy = true; listRepaint();
    var said = [];
    var p = codeChanged ? listSaveCode(r, code) : Promise.resolve({ ok: true });
    return p.then(function (a) {
      if (codeChanged) said.push(a.words);
      if (!a.ok || !noteChanged) return a;
      return listSaveNote(r, note).then(function (b) { said.push(b.words); return b; });
    }).then(function (last) {
      L.busy = false; L.note = said.join(" ");
      if (last.ok) { L.edit = null; L.draft = null; listChanged(r); }
      render(); listRepaint();
    });
  }
  function listCellSave(r, kind, inp) {
    var before = inp.getAttribute("data-was") || "";
    var p = kind === "subj" ? listSaveCode(r, inp.value) : listSaveNote(r, inp.value);
    if (kind === "subj") inp.value = inp.value.replace(/\s+/g, "").toUpperCase();
    inp.setAttribute("aria-busy", "true");
    return p.then(function (res) {
      inp.removeAttribute("aria-busy");
      if (res.same) { inp.value = before; return; }
      if (!res.ok) { inp.value = before; listNote(res.words); return; }
      listChanged(r);
      listAfterSave(res.words);
    });
  }
  function listDrawer(r, name, h) {
    var e = r.e, d = r.ut, ov = state.overlay[d] || {};
    if (name === "MQ Discipline") {
      var mq = state.mq && state.mq[d];
      h.line(mq ? "MQ handbook (19th edition): " + (mq.mq_list_label || mq.mq_list) + (mq.special_ccr ? "; " + mq.special_ccr : "") + "."
        : "The MQ handbook's index does not list this name.");
      var al = aliasesFor(e);
      if (al && al.length) h.line("Also: " + al.join(", ") + ". Identities minted under " + (al.length > 1 ? "those names" : "that name") + " were folded into " + d + ".");
      if ((e.umbrella_codes || []).length) h.line("An umbrella: it carries " + e.umbrella_codes.join(", ") + ".");
      var sp = splitFor(e);
      if (sp) h.line("Split by language: " + sp.map(function (x) { return x.lang + " " + x.code; }).join(", ") + ".");
      if ((e.fan_in_with || []).length) h.line("Shares its code by ruling with " + e.fan_in_with.join(", ") + ".");
      if (e.top_modal_4digit) h.line("Most common TOP: " + (e.top_modal_6digit || e.top_modal_4digit) + (e.top_modal_title ? ", " + e.top_modal_title : "") + ".");
    } else if (name === "Common SUBJ" || name === "Status") {
      h.line(e.canonical_subj4 ? "The Common SUBJ is " + e.canonical_subj4 + "." : "No Common SUBJ picked yet.");
      if (e.data_modal) h.line("Most used locally: " + e.data_modal + (e.data_modal_share ? ", " + Math.round(e.data_modal_share * 100) + "% of the local courses" : "") + ".");
      if (r.how === "open") h.line(e.source === "data_modal" ? "The pick is the data's most-used code and waits for a person to confirm it." : "The pick waits for a person.");
      else h.line(CONFIRM_WORDS[r.how] + (e.reviewed_by ? ", " + e.reviewed_by : "") + (e.reviewed_at ? " " + h.stamp(e.reviewed_at) : "") + ".");
      var nCid = e.canonical_subj4 ? (state.cidBySubj[e.canonical_subj4] || []).length : 0, nCcn = e.canonical_subj4 ? (state.ccnBySubj[e.canonical_subj4] || []).length : 0;
      if (nCid || nCcn) h.line("An official subject: " + [nCid ? plural(nCid, "C-ID descriptor", "C-ID descriptors") : "", nCcn ? plural(nCcn, "CCN course", "CCN courses") : ""].filter(Boolean).join(" and ") + " use " + e.canonical_subj4 + ".");
      if (r.how === "open" && hasCode(e)) h.box.appendChild(h.el("div", { cls: "csl-acts" }, [h.word("Confirm this pick", function () {
        listNote("Confirming " + e.canonical_subj4 + " for " + d + "…");
        listSaveCode(r, e.canonical_subj4, { confirm: true }).then(function (res) {
          if (res.ok) { h.L.open = null; listChanged(r); listAfterSave(res.words); } else listNote(res.words);
        });
      })]));
    } else if (name === "Collision") {
      if (!r.coll.length) h.line("In no collision: no other MQ discipline carries " + (e.canonical_subj4 || "its code") + " as its Common SUBJ.");
      r.coll.forEach(function (c) {
        h.line(c.code + " is also claimed by " + c.others.map(function (o) { return o.d + " (" + o.why + ")"; }).join(", ") + ". One code belongs to one MQ discipline, so one of them takes another code at the next fold.");
      });
      if (r.shared.length) {
        h.line("Shared by design (an alias family, a ruled fan-in, or an umbrella code every owner declares):");
        h.list(r.shared.map(function (c) { return c.code + " with " + c.others.map(function (o) { return o.d; }).join(", "); }));
      }
      if (r.drift) h.line(plural(r.drift.nOff, "identity carries", "identities carry") + " a code other than " + r.drift.canonical + ": "
        + r.drift.off.map(function (x) { return x.code + " " + fmtN(x.n) + (x.ownedBy ? " (the code of " + x.ownedBy + ")" : ""); }).join(", ") + ". They fold at the next re-mint.");
    } else if (name === "Local SUBJs" || name === "Local SUBJ count") {
      if (!r.locals.length) h.line("No college course under this MQ discipline names a subject code yet.");
      else {
        h.line(plural(r.locals.length + r.more, "local code", "local codes") + " on " + plural(e.local_subject_total || 0, "local course", "local courses") + ", most used first:");
        h.list(r.locals.map(function (x) { return x[0] + ", " + plural(x[1], "course", "courses"); }));
        if (r.more) h.line("And " + fmtN(r.more) + " more the reference file does not list.");
      }
    } else if (name === "Authority") {
      h.line(e.canonical_source === "ccn" ? "The Common SUBJ is the CCN code." : e.canonical_source === "c-id" ? "The Common SUBJ is the C-ID code."
        : e.canonical_source === "csr" ? "This reference minted the Common SUBJ" + (e.authority_flag === "proposed" ? "; no C-ID or CCN code names these courses yet, so it reads proposed." : ".")
        : "No authority reading recorded.");
      if (e.ccn_subject_code) h.line("CCN: " + e.ccn_subject_code + ".");
      if ((e.cid_subject_codes || []).length) h.line("C-ID: " + e.cid_subject_codes.join(", ") + ".");
      if (e.authority_note) h.line(e.authority_note);
    } else if (name === "Notes") {
      var by = ov._notes_by || e._notes_by, at = ov._notes_at || e._notes_at;
      h.line(e._notes ? e._notes : "No note yet.");
      if (e._notes && (by || at)) h.line("Written by " + (by || "a reviewer") + (at ? " " + h.stamp(at) : "") + ".");
    } else {
      var C = listCols()[h.colIndex(name)];
      h.line(name + ": " + ((C && C.v(r)) || "none") + ".");
    }
  }
  function listSpec() {
    return {
      prefix: "csl-", frPrefix: "csl-fr-",
      noun: { many: "MQ disciplines", region: "Every MQ discipline, A to Z", keyHeader: "MQ Discipline", file: "common-subjects-list",
        placeholder: "MQ discipline, Common SUBJ, local code or note", findLabel: "Find in the list" },
      state: listState, rows: listRowsAll, cols: listCols,
      key: function (r) { return r.ut; }, title: function (r) { return r.ut; }, render: listRepaint,
      changed: true,
      suggest: { get: listSuggestOf, verb: "Confirm this pick", accept: listSuggestAccept, always: true,
        label: function (r) { return "Confirm " + r.e.canonical_subj4 + " for " + r.ut; } },
      // The side panel (the List norms, The List is the workspace; Sam, 2026-11-03): an MQ discipline's title opens it
      // beside the table, with its local subjects, the codes it shares, Confirm this pick and the rest folded.
      panel: { label: function (r) { return "MQ discipline: " + r.ut; }, body: listPanelBody },
      head: function (wrap, api) {
        listLine(wrap, api);
        wrap.appendChild(api.el("p", { cls: "cs-quiet", text: "Every MQ discipline with courses, A to Z: its Common SUBJ, who confirmed it, "
          + "the Local SUBJs colleges use for its courses and how many, its local courses and M-IDs, and any collision. Press a cell for its details." }));
        // The sign-in and the SUBJ check, carried from the Reference view's toolbar (2026-11-04).
        var auth = api.el("span", { cls: "cs-auth" });
        renderAuthInto(auth);
        wrap.appendChild(api.el("p", { cls: "cs-lede csl-auth" }, state.sess ? ["Signed in: ", auth]
          : ["You are not signed in. The list reads; a save asks for a sign-in: ", auth]));
        wrap.appendChild(api.el("p", { cls: "csl-acts" }, [api.word("Run the SUBJ check", function () { openCheckModal(); }, { id: "csl-check" })]));
        return true;
      },
      filters: LIST_FILTERS,
      filterPass: function (r, L) {
        if (L.f === "open") return r.how === "open";
        if (L.f === "person") return r.how === "person";
        if (L.f === "procedure") return r.how === "nightly" || r.how === "cohort";
        if (L.f === "collision") return r.coll.length > 0;
        // The Reference view's lists, carried onto the List (2026-11-04).
        if (L.f === "confirmed") return r.how !== "open";
        if (L.f === "nocode") return !hasCode(r.e);
        if (L.f === "ccn") return r.e.canonical_source === "ccn";
        if (L.f === "cid") return r.e.canonical_source === "c-id";
        if (L.f === "chip") return authorityChips(r.e).length > 0;
        if (L.f === "proposed") return r.e.authority_flag === "proposed";
        return true;
      },
      hay: function (r) {
        var e = r.e;
        return [r.ut, e.canonical_subj4, CONFIRM_WORDS[r.how], aliasSearchText(e), splitSearchText(e), authoritySearchText(e),
          r.locals.map(function (x) { return x[0]; }).join(" "), e._notes || ""].join(" ");
      },
      drawer: listDrawer,
      edit: {
        fields: [{ id: "csl-subj", label: "Common SUBJ, four letters", key: "subj", ph: "ABCD" }, { id: "csl-notes", label: "Note", key: "notes" }],
        draft: function (r) { return { subj: r.e.canonical_subj4 || "", notes: r.e._notes || "" }; },
        save: listSaveRow
      },
      cellSave: listCellSave
    };
  }
  /* The line over the List and its folded cards (the List norms, The List is the workspace, norm 1; Exhibits' first
     (PR 2736), then CR's (PR 2743)): one line of the subjects row in kb/status/commons.json, each count opening the List's own
     filter where it has one, and the Progress view's opened page (its cards: Needs attention and the three questions)
     folded behind one word for the visit. The engine draws the line and reads the Commons file once a visit. */
  var LINE_FILTERS = { open: 1, suggested: 1, person: 1, procedure: 1, collision: 1, changed: 1 };
  function listLine(wrap, api) {
    var L = listState(), CLM = window.CPL_COMMONS_LIST;
    // Read once a visit (state.ls resets each visit), fresh: a failed read says so and is not retried until the next
    // visit, or a failed read would re-render and read again forever (the CR line's lesson, 2026-11-03).
    if (!L.cmRead && !L.cmLoading && CLM && CLM.readCommons) {
      L.cmLoading = true;
      CLM.readCommons(true).then(function (d) {
        L.cm = CLM.commonsRow(d, "subjects"); L.cmErr = L.cm ? null : "kb/status/commons.json has no subjects row";
      }, function (e) { L.cmErr = String(e && e.message || e); }).then(function () {
        L.cmLoading = false; L.cmRead = true; if (state.view === "list") listRepaint();
      });
    }
    var folded = !!L.dashFolded;
    wrap.appendChild(api.line({ row: L.cm, error: L.cmErr != null ? L.cmErr : (L.cmRead && !L.cm ? "" : null), folded: folded, foldId: "csl-fold",
      onToggle: function () { L.dashFolded = !L.dashFolded; listRepaint(); },
      control: function (open, text, li, w) {
        var m = /^#canonical-subj4\/(?:list\/)?([a-z-]+)$/.exec(open || ""), f = m ? m[1] : null;
        if (f === "list") return L.f ? api.word(text, function () { L.f = ""; L.limit = api.LIMIT; listRepaint(); }, { cls: w + " " + li }) : null;
        if (f && LINE_FILTERS[f]) return L.f === f ? null : api.word(text, function () { L.f = f; L.limit = api.LIMIT; listRepaint(); }, { cls: w + " " + li });
        if (open) return api.el("a", { href: open, cls: li, text: text });
        return null;
      } }));
    var fold = api.el("div", { cls: "csl-fold", id: "csl-fold" });
    if (folded) { fold.hidden = true; wrap.appendChild(fold); return; }
    var PG = window.CPL_COMMONS_PAGE;
    if (PG && window.CPL_COMMONS_PROGRESS) {
      // The Progress view's own page, under its own prefix, so its ids never meet the Progress view's.
      var spec = subjPageSpec(progressContext(new Date()));
      spec.prefix = "csl-pg-";
      fold.appendChild(PG.render(spec));
    } else if (L.pgTried) {
      fold.appendChild(api.el("p", { cls: "cs-caution", role: "alert", text: "The summary's cards (commons_page.js) could not be loaded. The List reads as usual; reload the tab to try again." }));
    } else {
      fold.appendChild(api.el("p", { cls: "cs-quiet", text: "Loading the summary…" }));
      // Loaded once a visit, success or failure, so a failed load never loops.
      if (!L.pgLoading) { L.pgLoading = true; withProgressModule(function () { L.pgLoading = false; L.pgTried = true; if (state.view === "list") listRepaint(); }); }
    }
    wrap.appendChild(fold);
  }
  /* An MQ discipline's side panel: what it is, its local subjects (the codes colleges use for its courses, the members
     the row folds), the codes it shares with another MQ discipline (another one's name opens its panel), Confirm this
     pick with its own status line, and the rest folded: the authority, the note and the identity codes off its code.
     The title's drawer (the MQ handbook, its other names, the umbrella and the TOP) moves in with it (the engine). */
  function listPanelBody(r, h) {
    var e = r.e, L = listState(), notes = L.pnNote || (L.pnNote = {}), out = [];
    var code = e.canonical_subj4 || "", total = e.local_subject_total || 0;
    out.push(h.title(r.ut));
    out.push(h.meta([code ? "Common SUBJ: " + code : "No Common SUBJ yet", CONFIRM_WORDS[r.how],
      e.local_subject_total != null ? plural(e.local_subject_total, "local course", "local courses") : "",
      e.total_mids != null ? plural(e.total_mids, "M-ID", "M-IDs") : "", authorityWords(r)]));
    out.push(h.el("p", { cls: "csl-pn-dec", text: r.how === "open"
      ? (e.source === "data_modal" ? "Open: the pick is the data's most-used code and waits for a person to confirm it." : "Open: the pick waits for a person.")
      : CONFIRM_WORDS[r.how] + (e.reviewed_by ? ", " + e.reviewed_by : "") + (e.reviewed_at ? " " + h.stamp(e.reviewed_at) : "") + "." }));
    var acts = [];
    if (r.how === "open" && hasCode(e)) {
      acts.push(h.word("Confirm this pick", function () {
        notes[r.ut] = "Confirming " + code + " for " + r.ut + "…"; status.textContent = notes[r.ut];
        listSaveCode(r, code, { confirm: true }).then(function (res) {
          notes[r.ut] = res.words;
          if (res.ok) { listChanged(r); render(); }
        }).then(function () {
          if (LIST_ENGINE) LIST_ENGINE.redraw();
          var n = document.getElementById("csl-pn-confirm") || document.getElementById("csl-panel-t"); if (n) n.focus();
        });
      }, { id: "csl-pn-confirm" }));
    }
    if (acts.length) out.push(h.el("div", { cls: "csl-acts" }, acts));
    var status = h.el("p", { cls: "cs-quiet", role: "status", "aria-live": "polite", text: notes[r.ut] || "" });
    out.push(status);
    out.push(h.heading("Its local subjects"));
    if (!r.locals.length) out.push(h.el("p", { cls: "cs-quiet", text: "No college course under this MQ discipline names a subject code yet." }));
    else out.push(h.table({ id: "locals", label: "The local subject codes colleges use for " + r.ut,
      note: plural(r.locals.length + r.more, "local code", "local codes") + " on " + plural(total, "local course", "local courses")
        + (r.more ? "; " + fmtN(r.more) + " more the reference file does not list" : "") + ". Press a header to sort.",
      cols: [["code", "Local SUBJ"], ["n", "Courses", true], ["share", "Share of its courses"], ["note", "Note"]], sort: { col: 1, dir: -1 },
      rows: r.locals.map(function (x) {
        var pct = total ? x[1] / total * 100 : null;
        return { code: x[0], n: x[1], share: pct == null ? "" : pct < 1 ? "Under 1%" : Math.round(pct) + "%",
          note: x[0] === code ? "The Common SUBJ" : x[0] === e.data_modal ? "Most used locally" : "" };
      }) }));
    var shares = [];
    r.coll.forEach(function (c) { c.others.forEach(function (o) { shares.push({ code: c.code, d: o.d, why: o.why || "", note: "A collision" }); }); });
    r.shared.forEach(function (c) { c.others.forEach(function (o) { shares.push({ code: c.code, d: o.d, why: o.why || "", note: "Shared by design" }); }); });
    if (shares.length) {
      out.push(h.heading("The codes it shares"));
      out.push(h.table({ id: "shares", label: "The MQ disciplines that share a code with " + r.ut,
        note: r.coll.length ? "One code belongs to one MQ discipline, so one side of a collision takes another code at the next fold. "
          + "A code shared by design (an alias family, a ruled fan-in, an umbrella code) stays. An MQ discipline's name opens its panel."
          : "Each is shared by design: an alias family, a ruled fan-in, or an umbrella code every owner declares. An MQ discipline's name opens its panel.",
        cols: [["code", "Code"], ["d", "MQ discipline"], ["why", "Its reason"], ["note", "Note"]],
        rows: shares,
        cell: function (row, k) {
          if (k !== "d") return row[k];
          return h.word(row.d, function () { h.open(row.d); }, { "aria-label": row.d + ", open its panel" });
        } }));
    }
    // The codes it could take: the Reference box's suggestions (its own local codes and identity codes, most used first,
    // none another MQ discipline holds), each a word that saves it through the same write as the Common SUBJ cell.
    var sugg = subjSuggestions(e, "");
    if (sugg.length) {
      out.push(h.heading("Codes it could take"));
      out.push(h.table({ id: "sugg", label: "Codes " + r.ut + " could take as its Common SUBJ",
        note: "Its own codes, most used first; a code another MQ discipline holds is left out. Take one to make it the Common SUBJ.",
        cols: [["code", "Code"], ["mine", "Its courses", true], ["note", "Note"], ["take", "Take it", false, true]],
        rows: sugg.map(function (x) {
          var nCid = (state.cidBySubj[x.code] || []).length, nCcn = (state.ccnBySubj[x.code] || []).length;
          return { code: x.code, mine: x.mine, take: x.code,
            note: [x.conflict ? "Also on " + plural(x.conflict.n, "identity", "identities") + " under " + x.conflict.d : "",
              nCid || nCcn ? "An official subject (" + [nCid ? nCid + " C-ID" : "", nCcn ? nCcn + " CCN" : ""].filter(Boolean).join(", ") + ")" : ""]
              .filter(Boolean).join("; ") };
        }),
        cell: function (row, k) {
          if (k !== "take") return row[k];
          return h.word("Take " + row.code, function () {
            notes[r.ut] = "Saving " + row.code + " for " + r.ut + "…"; status.textContent = notes[r.ut];
            listSaveCode(r, row.code).then(function (res) {
              notes[r.ut] = res.words;
              if (res.ok) { listChanged(r); render(); }
              if (LIST_ENGINE) LIST_ENGINE.redraw();
            });
          }, { "aria-label": "Take " + row.code + " as the Common SUBJ of " + r.ut });
        } }));
    }
    var more = [], ov = state.overlay[r.ut] || {};
    more.push(h.el("p", null, [e.canonical_source === "ccn" ? "The Common SUBJ is the CCN code." : e.canonical_source === "c-id" ? "The Common SUBJ is the C-ID code."
      : e.canonical_source === "csr" ? "This reference minted the Common SUBJ" + (e.authority_flag === "proposed" ? "; no C-ID or CCN code names these courses yet, so it reads proposed." : ".")
      : "No authority reading recorded."]));
    if (e.ccn_subject_code) more.push(h.el("p", null, ["CCN: " + e.ccn_subject_code + "."]));
    if ((e.cid_subject_codes || []).length) more.push(h.el("p", null, ["C-ID: " + e.cid_subject_codes.join(", ") + "."]));
    if (e.authority_note) more.push(h.el("p", null, [e.authority_note]));
    if (r.drift) more.push(h.el("p", null, [plural(r.drift.nOff, "identity carries", "identities carry") + " a code other than " + r.drift.canonical + ": "
      + r.drift.off.map(function (x) { return x.code + " " + fmtN(x.n) + (x.ownedBy ? " (the code of " + x.ownedBy + ")" : ""); }).join(", ") + ". They fold at the next re-mint."]));
    var by = ov._notes_by || e._notes_by, at = ov._notes_at || e._notes_at;
    more.push(h.el("p", null, [e._notes ? "Note: " + e._notes + (by || at ? " (written by " + (by || "a reviewer") + (at ? " " + h.stamp(at) : "") + ")" : "") : "No note yet."]));
    out.push(h.fold("more", "More about this MQ discipline: its authority, note and identity codes", more));
    // The Reference view's CPL and variants windows, carried into the panel (2026-11-04): the credentials colleges
    // articulate to its courses, and the C-ID and CCN courses that share one of its codes.
    var cpl = (state.cpl || {})[r.ut];
    if (cpl && cpl.n_creds) {
      out.push(h.fold("cpl", "Its CPL opportunities: " + plural(cpl.n_creds, "credential", "credentials") + " at " + plural(cpl.n_colleges, "college", "colleges"), [
        h.el("p", null, [plural(cpl.n_creds, "credential articulates", "credentials articulate") + " to its courses at "
          + plural(cpl.n_colleges, "college", "colleges") + ", across " + plural(cpl.n_courses, "course identity", "course identities") + "."]),
        h.table({ id: "cpl", label: "The credentials colleges articulate to " + r.ut + "'s courses", note: "Press a header to sort.",
          cols: [["c", "Credential"], ["i", "Issuer"], ["n", "Colleges", true]], sort: { col: 2, dir: -1 },
          rows: (cpl.creds || []).map(function (c) { return { c: c.c || "", i: c.i || "", n: c.n || 0 }; }) })]));
    }
    var official = officialOn(e);
    out.push(h.fold("official", official.length ? "C-ID and CCN courses on its codes: " + fmtN(official.length)
      : "C-ID and CCN courses on its codes: none", official.length ? [h.table({ id: "official",
        label: "The C-ID and CCN courses that share a code with " + r.ut, note: "Over the Common SUBJ and the local codes colleges use. Press a header to sort.",
        cols: [["sys", "System"], ["id", "Course"], ["t", "Title"], ["code", "On the code"]],
        rows: official })] : [h.el("p", null, ["No C-ID or CCN course shares any of its codes. Either it has no official course yet, or the official systems use other codes."])]));
    return out;
  }
  /* The C-ID and CCN courses whose subject is the Common SUBJ or one of the local codes (the variants window's lists). */
  function officialOn(e) {
    var codes = {};
    Object.keys(variantsFor(e) || {}).forEach(function (k) { codes[k] = 1; });
    if (e.canonical_subj4) codes[e.canonical_subj4] = 1;
    var out = [];
    Object.keys(codes).sort().forEach(function (code) {
      (state.cidBySubj[code] || []).forEach(function (x) { out.push({ sys: "C-ID", id: x.id, t: x.title || "", code: code }); });
      (state.ccnBySubj[code] || []).forEach(function (x) { out.push({ sys: "CCN", id: x.id, t: x.title || "", code: code }); });
    });
    return out.sort(function (a, b) { return a.id.localeCompare(b.id); });
  }
  function listApi() {
    if (!LIST_ENGINE && window.CPL_COMMONS_LIST) LIST_ENGINE = window.CPL_COMMONS_LIST.create(listSpec());
    return LIST_ENGINE;
  }
  /* ── The Local subjects List (csr_local_subjects.js; Sam, 2026-11-03: "yes on local subjects") ──
     One row per local subject code over kb/reference/subject_discipline_map.json, its confirms as _SUBJ_DISC::<CODE>
     rows in kb_curation (DR-25). The module and the List engine load the first time the view opens. */
  var LOCAL = null, localLoading = false, localFailed = false, localFilter = "";
  function saveCuration(courseId, field, value) {
    var sess = state.sess;
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON, "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({ course_id: courseId, field: field, value: value, reviewer_email: sess.email })
    });
  }
  function readCuration(prefix) {
    var url = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,reviewer_email,reviewed_at"
      + "&course_id=like." + encodeURIComponent(prefix) + "%25";
    return fetch(url, { headers: { "apikey": SUPABASE_ANON } }).then(function (r) {
      if (!r.ok) throw new Error("kb_curation answered " + r.status);
      return r.json();
    });
  }
  function localHost() {
    return {
      // The colleges' local codes only: variantsFor's fallback (variants_observed) is the M-IDs' own SUBJ4s, not local codes.
      entries: mergedEntries, variantsFor: function (e) { return e.local_subject_variants || {}; },
      session: function () { return state.sess && state.sess.access_token ? state.sess : null; },
      save: saveCuration, read: readCuration,
      fetchJson: function (url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(url + " answered " + r.status); return r.json(); }); },
      render: localRepaint,
      signIn: function () { applyView("list"); }
    };
  }
  function localRepaint() {
    var node = document.getElementById("cs-local");
    if (!node || state.view !== "local" || !state.seed) return;
    node.innerHTML = "";
    if (!LOCAL && window.CPL_CSR_LOCAL && window.CPL_COMMONS_LIST) {
      LOCAL = window.CPL_CSR_LOCAL.create(localHost());
      if (localFilter) LOCAL.setFilter(localFilter);
    }
    if (LOCAL) { LOCAL.render(node); return; }
    if (localFailed) {
      node.appendChild(el("p", { class: "cs-caution", role: "alert" }, ["The Local subjects List could not be loaded. The other views read as usual; reload the tab to try again."]));
      return;
    }
    node.appendChild(el("p", { class: "cs-quiet" }, ["Loading the Local subjects List…"]));
    var T = window.CPL_TABS;
    if (localLoading || !T || typeof T.loadScript !== "function") return;
    localLoading = true;
    var done = function () {
      localLoading = false;
      if (!window.CPL_COMMONS_LIST || !window.CPL_CSR_LOCAL) localFailed = true;
      localRepaint();
    };
    var mod = function () { if (window.CPL_CSR_LOCAL) done(); else T.loadScript("csr_local_subjects.js", "CPL_CSR_LOCAL", done); };
    if (window.CPL_COMMONS_LIST) mod(); else T.loadScript("commons_list.js", "CPL_COMMONS_LIST", mod);
  }

  /* Draw the List into its section; the engine loads the first time the view opens. */
  function listRepaint() {
    var node = document.getElementById("cs-list");
    if (!node || state.view !== "list" || !state.seed) return;
    node.innerHTML = "";
    if (listApi()) { LIST_ENGINE.render(node); return; }
    if (listFailed) {
      node.appendChild(el("p", { class: "cs-caution", role: "alert" }, ["The List (commons_list.js) could not be loaded. Progress reads as usual; reload the tab to try again."]));
      return;
    }
    node.appendChild(el("p", { class: "cs-quiet" }, ["Loading the List…"]));
    var T = window.CPL_TABS;
    if (listLoading || !T || typeof T.loadScript !== "function") return;
    listLoading = true;
    T.loadScript("commons_list.js", "CPL_COMMONS_LIST", function () {
      listLoading = false;
      if (!window.CPL_COMMONS_LIST) listFailed = true;
      listRepaint();
    });
  }

  /* ── the views and the route in the address ──
     #canonical-subj4/progress, /list and /local name a view (/reference, the retired view, opens the List);
     #canonical-subj4/<filter> opens the List on the filter that carries it (the Commons row's counts link here);
     #canonical-subj4/check opens the SUBJ check. The last view chosen is remembered; the List's filters,
     sort and selection last the visit (tabs never remember a filter, Sam 2026-10-21). */
  var VIEW_MOUNT = { progress: "cs-progress", list: "cs-list", local: "cs-local" };
  /* A reader who last chose the Reference view lands on the List, the view it retired into (2026-11-04). */
  function readView() {
    try { var v = localStorage.getItem(VIEW_KEY); if (v === "reference") v = "list"; return VIEW_MOUNT[v] ? v : null; } catch (e) { return null; }
  }
  function keepView(v) { try { localStorage.setItem(VIEW_KEY, v); } catch (e) { /* private window */ } }
  function applyView(v) {
    state.view = VIEW_MOUNT[v] ? v : "progress";
    keepView(state.view);
    var pg = document.getElementById("cs-progress");
    if (pg) pg.hidden = state.view !== "progress";
    var ls = document.getElementById("cs-list");
    if (ls) ls.hidden = state.view !== "list";
    var lo = document.getElementById("cs-local");
    if (lo) lo.hidden = state.view !== "local";
    var sw = document.getElementById("cs-views");
    if (sw) Array.prototype.forEach.call(sw.querySelectorAll("button[role=tab]"), function (b) {
      var sel = b.getAttribute("data-view") === state.view;
      b.setAttribute("aria-selected", sel ? "true" : "false");
      b.setAttribute("tabindex", sel ? "0" : "-1");
    });
    if (state.view === "progress") renderProgress();
    else if (state.view === "list") listRepaint();
    else if (state.view === "local") localRepaint();
  }
  function ensureViewMounts() {
    // The views mount before #cs-mount (#cs-toolbar in an older shell).
    var tb = document.getElementById("cs-mount") || document.getElementById("cs-toolbar");
    if (!tb || document.getElementById("cs-views")) return;
    ensureProgressCss();
    var sw = el("div", { class: "cs-views", id: "cs-views", role: "tablist", "aria-label": "Common Subjects Reference views" });
    VIEWS.forEach(function (v, i) {
      var b = el("button", { role: "tab", id: "cs-tab-" + v.id, "data-view": v.id, "aria-controls": VIEW_MOUNT[v.id],
        "aria-selected": "false", tabindex: "-1", type: "button" }, [v.label]);
      b.addEventListener("click", function () { applyView(v.id); b.focus(); });
      b.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? (i + 1) % VIEWS.length : e.key === "ArrowLeft" ? (i - 1 + VIEWS.length) % VIEWS.length
          : e.key === "Home" ? 0 : e.key === "End" ? VIEWS.length - 1 : null;
        if (j == null) return;
        e.preventDefault();
        applyView(VIEWS[j].id);
        var nb = document.getElementById("cs-tab-" + VIEWS[j].id);
        if (nb) nb.focus();
      });
      sw.appendChild(b);
    });
    tb.parentNode.insertBefore(sw, tb);
    var pg = el("section", { class: "cs-progress", id: "cs-progress", "aria-label": "Common Subjects Reference, Progress", hidden: "" });
    tb.parentNode.insertBefore(pg, tb);
    var ls = el("section", { class: "cs-list", id: "cs-list", "aria-label": "Common Subjects Reference, List", hidden: "" });
    tb.parentNode.insertBefore(ls, tb);
    var lo = el("section", { class: "cs-list", id: "cs-local", "aria-label": "Common Subjects Reference, Local subjects", hidden: "" });
    tb.parentNode.insertBefore(lo, tb);
  }
  function routeFromHash() {
    var h = (location.hash || "").replace(/^#/, "");
    var parts = h.split("/");
    if (parts[0] !== QS_TAB) return false;
    var r = parts[1] || "";
    if (r === "list" && parts[2] && listFilterId(parts[2])) { goTo({ view: "list", filter: parts[2] }); return true; }
    if (r === "local" && parts[2]) { localFilter = parts[2]; if (LOCAL) LOCAL.setFilter(parts[2]); applyView("local"); return true; }
    if (VIEW_MOUNT[r]) { applyView(r); return true; }
    if (r === "reference") { applyView("list"); return true; }
    if (FILTER_ROUTES[r]) { goTo({ view: "list", filter: FILTER_ROUTES[r] }); return true; }
    if (r === "check") { goTo(TO.check); return true; }
    if (r === "open") { goTo(TO.confirm); return true; }
    return false;
  }
  function onHashChange() { routeFromHash(); }

  /* ── CSS (tokens only; the section pattern the shared module borrows, the word controls,
     the procedures and the findings). Injected once, so both HTMLs carry it. ── */
  function ensureProgressCss() {
    if (document.getElementById("cs-progress-css")) return;
    document.head.appendChild(el("style", { id: "cs-progress-css" }, [[
      "#tab-canonical-subj4 .cs-views { display:flex; flex-wrap:wrap; gap:6px 18px; padding-block:6px 14px; }",
      // The dash under Details (S556) keeps its own width: the fold adds no side padding of its own.
      "#tab-canonical-subj4 .cs-more { margin-top:18px; border:0; background:none; }",
      "#tab-canonical-subj4 .cs-more > .cs-sec-b { padding:0; }",
      "#tab-canonical-subj4 .cs-views button { font:inherit; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      "#tab-canonical-subj4 .cs-views button:hover { text-decoration-thickness:2px; }",
      "#tab-canonical-subj4 .cs-views button[aria-selected=\"true\"] { color:var(--text-strong); font-weight:700; text-decoration-thickness:2px; }",
      "#tab-canonical-subj4 .cs-views button:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; }",
      "#tab-canonical-subj4 .cs-progress { display:block; margin-bottom:18px; min-width:0; }",
      "#tab-canonical-subj4 .cs-progress[hidden] { display:none; }",
      "#tab-canonical-subj4 .cs-list { display:block; margin-bottom:18px; min-width:0; max-width:100%; }",
      "#tab-canonical-subj4 .cs-list[hidden] { display:none; }",
      "#tab-canonical-subj4 .cs-list > p { margin:0 0 6px; font-size:.875rem; }",
      "#tab-canonical-subj4 .csl-acts { display:flex; flex-wrap:wrap; gap:6px 16px; }",
      "#tab-canonical-subj4 .csl-pn-dec { margin:10px 0 6px; }",
      // A local code is one word: it never breaks inside itself (the engine's cells wrap anywhere).
      "#tab-canonical-subj4 #csl-pn-locals td:first-child, #tab-canonical-subj4 #csl-pn-shares td:first-child { overflow-wrap:normal; white-space:nowrap; }",
      "#tab-canonical-subj4 .cs-word { font:inherit; font-size:.9rem; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; display:inline-block; }",
      "#tab-canonical-subj4 .cs-word:hover { text-decoration-thickness:2px; }",
      "#tab-canonical-subj4 .cs-word:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; }",
      "#tab-canonical-subj4 .cs-quiet { color:var(--text-muted); }",
      "#tab-canonical-subj4 .cs-caution { color:var(--mustard-text); }",
      "#tab-canonical-subj4 .cs-lede { color:var(--text-body); }",
      "#tab-canonical-subj4 .cs-sec { border:1px solid var(--border); border-radius:10px; background:var(--surface-opaque); margin-bottom:12px; min-width:0; }",
      "#tab-canonical-subj4 .cs-sec-sum { list-style:none; cursor:pointer; position:relative; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 12px; padding:11px 14px 11px 36px; min-height:44px; box-sizing:border-box; border-radius:10px; }",
      "#tab-canonical-subj4 .cs-sec-sum::-webkit-details-marker { display:none; }",
      "#tab-canonical-subj4 .cs-sec-sum::before { content:\"\"; position:absolute; left:15px; top:19px; width:7px; height:7px; border-right:2px solid var(--text-muted); border-bottom:2px solid var(--text-muted); transform:rotate(-45deg); }",
      "#tab-canonical-subj4 .cs-sec[open] > .cs-sec-sum::before { transform:rotate(45deg); top:16px; }",
      "#tab-canonical-subj4 .cs-sec-sum:hover .cs-sec-t { color:var(--cobalt); }",
      "#tab-canonical-subj4 .cs-sec-sum:focus-visible { outline:2px solid var(--cobalt); outline-offset:-2px; }",
      "#tab-canonical-subj4 .cs-sec-t { margin:0; font-size:1.05rem; color:var(--text-strong); font-family:inherit; }",
      "#tab-canonical-subj4 .cs-sec-meta { font-size:.875rem; color:var(--text-muted); font-variant-numeric:tabular-nums; }",
      "#tab-canonical-subj4 .cs-sec-label { flex:1 0 100%; font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); }",
      "#tab-canonical-subj4 .cs-sec-b { padding:2px 14px 14px; min-width:0; overflow-wrap:anywhere; }",
      // A procedure's steps name file paths no word break reaches; on a 320px phone they wrap anywhere (S556).
      "#tab-canonical-subj4 .cs-sec-sum > * { min-width:0; overflow-wrap:anywhere; }",
      "#tab-canonical-subj4 .cs-proc-steps li { min-width:0; overflow-wrap:anywhere; }",
      "#tab-canonical-subj4 .cs-sec-b p { margin:0 0 8px; font-size:.9rem; color:var(--text-body); }",
      "#tab-canonical-subj4 .cs-links { display:flex; flex-wrap:wrap; gap:.4rem 1rem; margin:.5rem 0 0; }",
      "#tab-canonical-subj4 .cs-proc { background:var(--surface-subtle); }",
      "#tab-canonical-subj4 .cs-proc .cs-sec-t { font-size:1rem; }",
      "#tab-canonical-subj4 .cs-proc-rule { font-size:.9375rem; color:var(--text-strong); }",
      "#tab-canonical-subj4 .cs-proc-steps { margin:0 0 8px; padding-left:22px; font-size:.875rem; color:var(--text-body); display:grid; gap:4px; }",
      "#tab-canonical-subj4 .cs-proc-meta { font-size:.8125rem; color:var(--text-muted); }",
      "#tab-canonical-subj4 .cs-findings { list-style:none; margin:0; padding:0; display:grid; gap:8px; font-size:.875rem; color:var(--text-body); }",
      "#tab-canonical-subj4 .cs-findings b { color:var(--text-strong); }",
      "#tab-canonical-subj4 .cs-progress .prh-pg-steps { grid-template-columns:repeat(5, minmax(0, 1fr)); }",
      "@media (max-width: 760px) { #tab-canonical-subj4 .cs-progress .prh-pg-steps { grid-template-columns:minmax(0, 1fr); } }"
    ].join("\n")]));
  }

  // Quickstart-C hint consumer. Pre-pops the status / TOP / search filters
  // from a routing hint stashed by quickstart.js. Unknown keys are silently
  // dropped; valid hints set state + sync the matching toolbar input.
  var QS_TAB = "canonical-subj4";
  var QS_STATUS = { needs_review: 1, pre_seeded: 1, reviewed: 1, invalid: 1 };
  /* A quickstart hint opens the List (2026-11-04): its status as the List's filter, its search as the find, its TOP in the
     TOP column. It waits in state.qsList for the List's next state, and state.qsHeld spares it the reset on arrival. */
  function applyQsHint(hint) {
    if (!hint || typeof hint !== "object") return false;
    var q = {};
    if (typeof hint.status === "string" && QS_STATUS[hint.status]) q.f = FILTER_ROUTES[hint.status];
    if (typeof hint.top_2digit === "string" && /^\d{2}$/.test(hint.top_2digit)) q.top = hint.top_2digit;
    if (typeof hint.search === "string" && hint.search) q.q = hint.search;
    if (!Object.keys(q).length) return false;
    state.qsList = q; state.ls = null; state.qsHeld = true;
    return true;
  }

  function init() {
    if (!document.getElementById("tab-canonical-subj4")) return;
    ensureCsrUiCss();
    state.sess = getSession();
    wireGuidelinesModal();
    Promise.all([fetchSeed(), fetchOverlay(), fetchCidCcn(), fetchCplRollup(), fetchFLSplit(), fetchAliases(), fetchMqSections(),
                 fetchScan(), fetchStatus(), fetchProcedures()]).then(function (parts) {
      state.seed = parts[0];
      state.overlay = parts[1];
      state.cidBySubj = parts[2].cidBySubj || {};
      state.ccnBySubj = parts[2].ccnBySubj || {};
      state.cidMeta = parts[2].cidMeta || null;
      state.ccnMeta = parts[2].ccnMeta || null;
      state.cpl = (parts[3] || {}).byDiscipline || {};
      state.split = buildSplit(parts[4]);
      state.aliases = (parts[5] || {}).aliases || {};
      state.mqDoc = parts[6] || null;
      state.mq = (parts[6] || {}).disciplines || {};
      state.scan = parts[7]; state.status = parts[8]; state.procs = parts[9];
      state.readAt = new Date();
      // Stamp the discipline name onto every seed entry (the entries are keyed
      // by name but don't carry it) so splitFor()/status() can resolve it from
      // the raw entry too, not just from built rows.
      var dd = state.seed.disciplines || {};
      Object.keys(dd).forEach(function (n) { if (dd[n] && !dd[n].discipline) dd[n].discipline = n; });
      // Apply any pending quickstart hint stashed before init (refresh case).
      if (window.CPL_QS && applyQsHint(window.CPL_QS.consume(QS_TAB))) window.CPL_QS_HINTED_CSR = true;
      // The Progress dash opens unless the address names a view or a filter, or the reader last chose
      // another view; a quickstart hint opens the List.
      ensureViewMounts();
      if (!routeFromHash()) applyView(window.CPL_QS_HINTED_CSR ? "list" : (readView() || "progress"));
      window.addEventListener("hashchange", onHashChange);
    });
    // A new visit drops the List's filters, sort and selection (tabs never remember a filter, Sam, 2026-10-21).
    var awayFromTab = false;
    window.addEventListener("cpl-tab-activated", function (e) {
      var t = e && e.detail && e.detail.tab;
      if (t !== QS_TAB) { awayFromTab = true; return; }
      if (!awayFromTab) { state.qsHeld = false; return; }
      awayFromTab = false;
      // A quickstart hint arrives just before its tab does: the visit it opens keeps the List it set.
      if (state.qsHeld) state.qsHeld = false; else state.ls = null;
      if (state.view === "list") listRepaint();
    });
    // Subscribe to runtime hints (quickstart fires after the tab is already
    // mounted — most common path). Rebuild the toolbar so the hinted filter
    // is visible in the dropdown chrome too.
    window.addEventListener("cpl-qs-hint", function (e) {
      if (!e || !e.detail || e.detail.tab !== QS_TAB) return;
      if (applyQsHint(e.detail.hint) && document.getElementById("cs-views")) applyView("list");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  /* Exposed for the tests and the a11y sweep's seed: the definitions, the context and the view. */
  window.CPL_CANONICAL_SUBJ4 = { MILESTONES: MILESTONES, PARTS: PARTS, HEADLINE: HEADLINE, TO: TO, progressContext: progressContext,
    subjPageSpec: subjPageSpec,
    applyView: applyView, routeFromHash: routeFromHash, renderProgress: renderProgress, _state: state,
    _listRows: listRowsAll, _listCols: listCols };
})();
