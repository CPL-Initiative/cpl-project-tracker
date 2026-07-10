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
    try { sessionStorage.setItem("cpl_sb_return_tab", "canonical-subj4"); } catch (e) {}
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

  // Two-stage curation: PATCH the canonical_subj4 row for this discipline to
  // stamp validated_at = now() and validated_by = signed-in user. The
  // validate stage is meaningful at the DISCIPLINE level, not per-field, but
  // we attach it to the canonical_subj4 row as the "primary" curation row.
  // kb/_apply_canonical_subj4.py reads validated_at across all rows and takes
  // the MAX, so any row carrying validated_at is enough to mark the
  // discipline validated.
  function saveValidate(discipline, sess) {
    var qs = "course_id=eq." + encodeURIComponent(KEY_PREFIX + discipline)
           + "&field=eq." + encodeURIComponent(FIELD_CANON);
    var nowIso = new Date().toISOString();
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation?" + qs, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_ANON, "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ validated_at: nowIso, validated_by: sess.email })
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

  function isUmbrellaEntry(entry) {
    return !!(splitFor(entry) || UMBRELLA_EXTRA_SUBJ4[entry.discipline]);
  }

  // Codes that are LEGITIMATE on this discipline's CCR rows: the canonical
  // plus umbrella split codes / fixed umbrella spans.
  function allowedSubj4(entry) {
    var ok = {};
    if (entry.canonical_subj4) ok[entry.canonical_subj4] = true;
    (splitFor(entry) || []).forEach(function (x) { ok[x.code] = true; });
    (UMBRELLA_EXTRA_SUBJ4[entry.discipline] || []).forEach(function (c) { ok[c] = true; });
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
      (UMBRELLA_EXTRA_SUBJ4[e.discipline] || []).forEach(function (s) {
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
  function invalidateSubjIndex() { state._subjIdx = null; }

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
  function runSubjCheck() {
    var rows = mergedEntries();
    var idx = subjIndex();
    var out = { collisions: [], aliasShared: [], drift: [], invalid: [], missing: [], nRowsOff: 0 };

    Object.keys(idx.owners).sort().forEach(function (code) {
      var ds = {};
      idx.owners[code].forEach(function (o) { if (!ds[o.d]) ds[o.d] = o.why; });
      var names = Object.keys(ds);
      if (names.length < 2) return;
      var families = {};
      names.forEach(function (d) { families[aliasFamilyOf(d)] = true; });
      var rec = {
        code: code,
        owners: names.map(function (d) {
          return { d: d, why: ds[d], n: (idx.observed[code] || {})[d] || 0 };
        }),
      };
      // One alias family sharing a code = the fan-in convergence working as
      // designed — report it as informational, never as a collision.
      if (Object.keys(families).length < 2) out.aliasShared.push(rec);
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

  // Live feedback under the Common SUBJ input: assessment line(s) + suggestion
  // chips. Chips set the value on mousedown (before blur) so the input's
  // natural blur saves the pick.
  function renderSubjHint(entry, input, hint) {
    if (input.disabled) return;
    var v = (input.value || "").toUpperCase();
    hint.innerHTML = "";
    if (v && SUBJ4_RE.test(v) && v !== entry.canonical_subj4) {
      var own = otherOwners(v, entry.discipline);
      var users = otherUsers(v, entry.discipline);
      var mineN = (entry.variants_observed || {})[v] || 0;
      if (own.length) {
        hint.appendChild(el("span", { class: "cs-badge warn" },
          ["✗ " + v + " is the Common SUBJ of " + own.map(function (o) { return o.d; }).join(" + ")]));
      } else if (users.length) {
        hint.appendChild(el("span", {
          class: "cs-badge mix",
          title: users.map(function (u) { return u.d + " ×" + u.n; }).join("\n"),
        }, ["⚠ on " + users[0].n + " CCR row" + (users[0].n === 1 ? "" : "s") + " under " + users[0].d]));
      }
      if (mineN) {
        hint.appendChild(el("span", { class: "cs-badge ok" },
          ["✓ on " + mineN + " of this discipline's CCR rows"]));
      } else if (!own.length && !users.length) {
        hint.appendChild(el("span", { class: "cs-badge muted" },
          ["new code — created at the next fold re-mint"]));
      }
      var nCid = (state.cidBySubj[v] || []).length;
      var nCcn = (state.ccnBySubj[v] || []).length;
      if (nCid || nCcn) {
        hint.appendChild(el("span", { class: "cs-badge muted" },
          ["ℹ official subject (" + (nCid ? nCid + " C-ID" : "") + (nCid && nCcn ? ", " : "") + (nCcn ? nCcn + " CCN" : "") + ")"]));
      }
    }
    // Partial input filters the suggestions by prefix; empty or a complete
    // 4-letter code shows the full alternative list (minus the typed code).
    var prefix = (v && !SUBJ4_RE.test(v)) ? v : "";
    var sugg = subjSuggestions(entry, prefix).filter(function (s) { return s.code !== v; });
    if (sugg.length) {
      var lab = el("span", { class: "cs-sugg-label" }, ["try:"]);
      hint.appendChild(lab);
      sugg.forEach(function (s) {
        var chip = el("button", {
          type: "button",
          class: "cs-sugg-chip" + (s.conflict ? " conflicted" : ""),
          title: (s.mine ? "Used " + s.mine + "× in this discipline's rows/local codes. " : "") +
                 (s.conflict ? "⚠ also on " + s.conflict.n + " CCR row(s) under " + s.conflict.d + "."
                             : "No collisions elsewhere.") + " Click to fill + save.",
        }, [s.code + (s.conflict ? " ⚠" : "")]);
        chip.onmousedown = function () {
          // mousedown fires BEFORE the input's blur, so setting the value here
          // lets the natural blur-save flow persist the pick.
          input.value = s.code;
        };
        hint.appendChild(chip);
      });
    }
    hint.classList.toggle("show", hint.children.length > 0);
  }

  // One-time CSS for the checker UI (layout only — colors ride the existing
  // cs-badge classes + design tokens).
  function ensureCheckCss() {
    if (document.getElementById("cs-check-css")) return;
    document.head.appendChild(el("style", { id: "cs-check-css" }, [
      "#tab-canonical-subj4 .cs-check-btn{padding:6px 10px;border:1px solid var(--border-strong);border-radius:6px;" +
        "background:var(--surface-opaque);font-size:.85rem;cursor:pointer;color:var(--text-strong);}" +
      "#tab-canonical-subj4 .cs-check-btn:hover{background:var(--surface-muted);}" +
      "#tab-canonical-subj4 .cs-subj-hint{display:none;margin-top:4px;text-align:left;line-height:1.9;max-width:34ch;}" +
      "#tab-canonical-subj4 .cs-subj-hint.show{display:block;}" +
      "#tab-canonical-subj4 .cs-subj-hint .cs-badge{display:inline-block;margin:0 4px 2px 0;}" +
      "#tab-canonical-subj4 .cs-sugg-label{color:var(--text-muted);font-size:.72rem;margin-right:4px;}" +
      "#tab-canonical-subj4 .cs-sugg-chip{font-family:ui-monospace,Menlo,monospace;font-size:.74rem;padding:1px 7px;" +
        "margin:0 3px 2px 0;border:1px solid var(--border-strong);border-radius:10px;background:var(--surface-subtle);" +
        "cursor:pointer;color:var(--text-strong);}" +
      "#tab-canonical-subj4 .cs-sugg-chip:hover{background:var(--surface-muted);}" +
      "#tab-canonical-subj4 .cs-sugg-chip.conflicted{border-style:dashed;color:var(--text-muted);}" +
      "#tab-canonical-subj4 .cs-check-section{margin:14px 0 6px;font-size:.95rem;color:var(--text-strong);}" +
      "#tab-canonical-subj4 .cs-check-list{margin:0;padding:0;list-style:none;}" +
      "#tab-canonical-subj4 .cs-check-list li{padding:6px 4px;border-top:1px solid var(--border);font-size:.85rem;" +
        "color:var(--text-body);text-align:left;}" +
      "#tab-canonical-subj4 .cs-check-jump{margin-left:8px;font-size:.74rem;padding:1px 8px;border:1px solid var(--border-strong);" +
        "border-radius:10px;background:var(--surface-subtle);cursor:pointer;color:var(--accent-link);white-space:nowrap;}" +
      "#tab-canonical-subj4 .cs-check-jump:hover{background:var(--surface-muted);}" +
      "#tab-canonical-subj4 .cs-check-note{color:var(--text-muted);font-size:.78rem;margin:4px 0 10px;text-align:left;}" +
      "#tab-canonical-subj4 .cs-check-ok{color:var(--green-progress);font-size:.95rem;margin:10px 0;}"
    ]));
  }

  // One-time CSS overrides for the table chrome (Sam's 2026-06-12 CSR
  // review). Injected from the tab's JS — the repo convention — so BOTH
  // CPL_Dashboard.html and index.html are covered without a Rule-4 mirror
  // edit. The base .cs-table rules live in the pane's in-body <style>
  // block, so each override carries one extra level of specificity
  // (thead / .cs-table ancestor) to win regardless of document order.
  function ensureCsrUiCss() {
    if (document.getElementById("cs-ui-css")) return;
    document.head.appendChild(el("style", { id: "cs-ui-css" }, [
      // Header text: white, NOT bold (was gold + UA-default bold). No
      // non-deprecated white-on-dark text token exists in :root (--white
      // sits in the deprecated legacy block), hence the literal #fff.
      // The inactive sort arrows inherit the white at .55 opacity; the
      // ACTIVE arrow keeps its gold accent rule so the affordance pops.
      "#tab-canonical-subj4 .cs-table thead th{color:#fff;font-weight:normal;}" +
      // CTE badge ("Y (90%)", "Y (all)") on ONE line. The extra width the
      // column needs is stolen from the Notes textarea (30ch → 26ch — it
      // has slack), NOT by widening the table: no horizontal scroll at
      // desktop widths (standing rule).
      "#tab-canonical-subj4 .cs-table td.cs-cte{white-space:nowrap;}" +
      "#tab-canonical-subj4 .cs-table td.cs-cte .cs-badge{white-space:nowrap;}" +
      "#tab-canonical-subj4 .cs-table textarea.cs-notes{width:26ch;}"
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

  // Cure affordance: clear every filter, search the discipline, close the
  // modal — the curator lands on the row with the live-checking input.
  function jumpToDiscipline(d) {
    state.search = d.toLowerCase();
    state.subj = "";
    state.subjSel = "";
    state.filter = "all";
    state.topFilter = "all";
    var inp = document.getElementById("cs-search"); if (inp) inp.value = d;
    var sj = document.getElementById("cs-subj-search"); if (sj) sj.value = "";
    var sf = document.getElementById("cs-subj-filter"); if (sf) sf.value = "";
    var f = document.getElementById("cs-filter"); if (f) f.value = "all";
    var tf = document.getElementById("cs-top-filter"); if (tf) tf.value = "all";
    render();
    var bg = document.getElementById("cs-check-modal");
    if (bg) bg.classList.remove("show");
  }

  function _jumpBtn(d) {
    var b = el("button", { type: "button", class: "cs-check-jump", title: "Show this discipline's row (clears other filters)" }, ["show " + d + " →"]);
    b.onclick = function () { jumpToDiscipline(d); };
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
        ["ℹ Alias families sharing one code (" + res.aliasShared.length + " — expected)"]));
      body.appendChild(el("p", { class: "cs-check-note" }, [
        "A converged discipline and its recorded alternate name share one Common SUBJ by design (fan-in " +
        "convergence) — not an error, nothing to fix."]));
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
        li.appendChild(_jumpBtn(g.d));
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

  // Build the inline variants summary — show top 5 + a "show all (n)" chip
  // that opens the variants modal. Modal listing always includes any C-IDs
  // and CCNs that share a SUBJ4 with the variants observed, so a curator
  // sees the full official-id landscape next to the local-code landscape.
  function variantsCell(entry) {
    var td = el("td", { class: "cs-variants" });
    var vsrc = variantsFor(entry);
    if (!Object.keys(vsrc).length) return td;
    var modal = entry.data_modal;
    var pairs = Object.keys(vsrc).map(function (k) {
      return [k, vsrc[k]];
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
      title: "Show all variants for this discipline (including any matching CIDs/CCNs)",
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
    var vsrcM = variantsFor(entry);
    var variants = Object.keys(vsrcM)
      .map(function (k) { return [k, vsrcM[k]]; })
      .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });

    body.innerHTML = "";
    var totalCourses = entry.local_subject_total || entry.total_mids || 0;
    var moreTrunc = entry.local_subject_variants_truncated || 0;
    var truncNote = moreTrunc > 0 ? " (+" + moreTrunc + " more codes truncated from this list)" : "";
    body.appendChild(el("p", { class: "cs-modal-meta" }, [
      String(totalCourses) + " local college courses across " + variants.length + " distinct subject codes" + truncNote + ". " +
      "Bold yellow = the most-used code locally; green = curator-confirmed Common SUBJ."
    ]));

    // Section 1: local college variants
    body.appendChild(el("h5", null, ["Local college subject codes (what colleges actually use)"]));
    var grid = el("div", { class: "cs-var-grid" });
    variants.forEach(function (p) {
      var isModal = p[0] === modal;
      var isCanon = p[0] === canon;
      var cls = "cs-var-chip" + (isCanon ? " canonical" : isModal ? " modal" : "");
      var chip = el("div", { class: cls });
      chip.appendChild(el("span", { class: "cs-var-code" }, [p[0]]));
      chip.appendChild(document.createTextNode(" · " + p[1] + " MIDs"));
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
      body.appendChild(el("h5", null, ["CIDs that share one of these subjects (" + cidHits.length + ")"]));
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
        "No CIDs or CCNs share any of the subject codes above. (Either this discipline has no official identifiers yet, or it uses different subject codes than the official systems.)"
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
    topFilter: "all",            // TOP 2-digit category filter; "all" = no filter
    grouped: true,               // Group rows under TOP 2-digit category headers
    collapsedCats: {},           // {top_cat_2digit: bool} — collapsed category groups
    search: "",
    subjSel: "",                 // SUBJ dropdown pick ("" = all) — see the cs-subj-filter select
    // Sort: default is re-key impact (descending). Curator clicks a sortable
    // header to override. Click again to flip direction. Clicking another
    // header switches the active column. When grouped, sort applies WITHIN
    // each category group.
    sort: { key: "_impact", dir: "desc" },
    // Sign-in feedback lives in the auth widget (no corner toast). See
    // PR #119 / docs/exhibit_canonicalization_lessons.md for context.
    pendingSignInEmail: null,
    pendingSignInError: null,
    sess: null,
  };

  // Sortable column descriptors: key = sort key on the row object, getter =
  // value extractor. Status uses an ordering enum so "validated" sorts above
  // "initiated" above "pre-seeded" above "needs review" above "invalid" by
  // default.
  var STATUS_ORDER = { "validated": 0, "initiated": 1, "pre-seeded": 2, "needs review": 3, "invalid": 4 };
  var CTE_ORDER = { "all": 0, "most": 1, "mixed": 2, "none": 3 };
  var SORT_GETTERS = {
    discipline: function (e) { return (e.discipline || "").toLowerCase(); },
    total_mids: function (e) { return e.total_mids || 0; },
    variants_count: function (e) { return Object.keys(variantsFor(e)).length; },
    data_modal: function (e) { return (e.data_modal || "").toLowerCase(); },
    canonical_subj4: function (e) { return (e.canonical_subj4 || "~").toLowerCase(); }, // ~ sorts blanks last
    status: function (e) { return STATUS_ORDER[status(e).label] || 99; },
    top_4digit: function (e) { return e.top_modal_4digit || "~"; },
    cte: function (e) { return CTE_ORDER[e.cte_flag] || 99; },
    _cpl_n: function (e) { return e._cpl_n || 0; },
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

  // Toolbar build — call ONCE at init. Subsequent state changes (filter
  // selection, search input, sort) don't re-call this; they only re-render
  // the table body via render(). This prevents the search input from being
  // recreated on every keystroke (which would steal focus, the bug behind
  // the curator's "stops typing after one character" report).
  //
  // The toolbar's <select>/input elements naturally stay in sync with
  // state because their values are USER-driven (onchange/oninput updates
  // state.* directly). Only the auth widget changes asynchronously
  // (sign-in/sign-out), so it gets its own renderAuth() that updates the
  // cs-auth span without touching the rest of the toolbar.
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
      ["reviewed", "Initiated (awaiting validation)"],
      ["validated", "Validated (faculty-confirmed)"],
      ["invalid", "Invalid (saved value not 4 letters)"],
    ].forEach(function (opt) {
      var o = el("option", { value: opt[0] }, [opt[1]]);
      if (opt[0] === state.filter) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = function () { state.filter = this.value; render(); };
    tb.appendChild(sel);

    // TOP category filter — 2-digit code dropdown. Populates from seed's
    // distinct top_category_2digit values so we don't list categories that
    // have no disciplines in this dataset.
    if (state.seed) {
      var cats = {};
      Object.keys(state.seed.disciplines || {}).forEach(function (d) {
        var e = state.seed.disciplines[d];
        if (e.top_category_2digit) {
          cats[e.top_category_2digit] = e.top_category_title || e.top_category_2digit;
        }
      });
      var topSel = el("select", { class: "cs-filter", id: "cs-top-filter", title: "Filter by TOP 2-digit category" });
      topSel.appendChild(el("option", { value: "all" }, ["TOP: any"]));
      Object.keys(cats).sort().forEach(function (k) {
        var o = el("option", { value: k }, [k + " — " + cats[k]]);
        if (k === state.topFilter) o.selected = true;
        topSel.appendChild(o);
      });
      topSel.onchange = function () { state.topFilter = this.value; render(); };
      tb.appendChild(topSel);
    }

    // Group toggle — when on, rows render under collapsible 2-digit TOP
    // category headers. When off, the table is flat (sort + filter only).
    var groupLabel = el("label", { class: "cs-flag-toggle", title: "Group rows under TOP category headers" });
    var groupCb = el("input", { type: "checkbox", id: "cs-group" });
    groupCb.checked = !!state.grouped;
    groupCb.onchange = function () { state.grouped = this.checked; render(); };
    groupLabel.appendChild(groupCb);
    groupLabel.appendChild(document.createTextNode(" Group by TOP"));
    tb.appendChild(groupLabel);

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
    // #8 SUBJ filter — match canonical SUBJ4 or any local subject code/variant.
    var subjSearch = el("input", {
      class: "cs-filter", id: "cs-subj-search", type: "search",
      placeholder: "SUBJ code…", autocomplete: "off", style: "min-width:120px;",
      title: "Filter by canonical SUBJ4 or any local subject code",
    });
    subjSearch.value = state.subj || "";
    subjSearch.oninput = function () { state.subj = this.value.trim(); render(); };
    tb.appendChild(subjSearch);
    // SUBJ dropdown (mirrors the CCR's Subject filter concept) — pick a
    // 4-letter code and see the disciplines it belongs to. Two optgroups:
    //   "Common subjects ✓"      — every distinct curator/seed canonical pick
    //   "Local-derived variants" — codes observed on CCR rows that are not a
    //                              canonical anywhere (post-fold this is
    //                              nearly empty — it's a progress meter)
    // A pick matches a discipline whose canonical IS the code OR whose
    // variants_observed carries it. ANDs with the search/status/TOP filters.
    if (state.seed) {
      var canonSet = {}, variantSet = {};
      mergedEntries().forEach(function (e) {
        if (e.canonical_subj4) canonSet[e.canonical_subj4] = true;
        Object.keys(e.variants_observed || {}).forEach(function (s) { variantSet[s] = true; });
      });
      var subjSel = el("select", {
        class: "cs-filter", id: "cs-subj-filter",
        title: "Filter disciplines by subject code: canonical Common SUBJ picks first, then local-derived variant codes not yet folded to a canonical.",
      });
      subjSel.appendChild(el("option", { value: "" }, ["All subjects"]));
      var ogCanon = el("optgroup", { label: "Common subjects ✓" });
      Object.keys(canonSet).sort().forEach(function (c) {
        ogCanon.appendChild(el("option", { value: c }, [c]));
      });
      subjSel.appendChild(ogCanon);
      var ogVar = el("optgroup", { label: "Local-derived variants" });
      Object.keys(variantSet).filter(function (s) { return !canonSet[s]; }).sort()
        .forEach(function (s) { ogVar.appendChild(el("option", { value: s }, [s])); });
      subjSel.appendChild(ogVar);
      subjSel.value = state.subjSel || "";
      subjSel.onchange = function () { state.subjSel = this.value; render(); };
      tb.appendChild(subjSel);
    }
    // SUBJ ⇄ CCR checker — curator-initiated sweep (works signed-out; cures
    // need sign-in). See the "SUBJ ⇄ CCR error checking" block above.
    var checkBtn = el("button", {
      class: "cs-check-btn", type: "button", id: "cs-subj-check",
      title: "Check every discipline's Common SUBJ against the SUBJ4 codes its Common Course Reference rows actually carry: shared codes (collisions), off-canonical rows (queued for the fold re-mint), invalid saves, and missing picks.",
    }, ["✓ Check SUBJ ⇄ CCR"]);
    checkBtn.onclick = openCheckModal;
    tb.appendChild(checkBtn);
    // Auth widget — populated by renderAuth() so async sign-in/out flows
    // don't have to rebuild the whole toolbar (and clobber search focus).
    tb.appendChild(el("span", { id: "cs-auth", class: "cs-auth" }));
    renderAuth();
  }

  // Re-render only the auth widget. Called from sign-in/out paths and from
  // init(). Safe to call repeatedly — touches no other toolbar element.
  function renderAuth() {
    var auth = document.getElementById("cs-auth");
    if (!auth) return;
    auth.innerHTML = "";

    // Signed in
    if (state.sess) {
      auth.appendChild(el("span", { class: "cs-auth-on" }, ["✓ " + state.sess.email]));
      auth.appendChild(document.createTextNode("  "));
      var out = el("a", { class: "cs-auth-link", href: "#" }, ["sign out"]);
      out.onclick = function (e) { e.preventDefault(); signOut(); state.sess = null; renderAuth(); render(); };
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

  function passesFilter(entry) {
    var s = status(entry);
    if (state.filter === "needs_review" && s.label !== "needs review") return false;
    if (state.filter === "pre_seeded" && s.label !== "pre-seeded") return false;
    if (state.filter === "reviewed" && s.label !== "initiated") return false;
    if (state.filter === "validated" && s.label !== "validated") return false;
    if (state.filter === "invalid" && s.label !== "invalid") return false;
    if (state.topFilter !== "all" && entry.top_category_2digit !== state.topFilter) return false;
    return true;
  }

  function renderSummary(rows) {
    var sum = document.getElementById("cs-summary");
    if (!sum) return;
    var counts = { initiated: 0, "needs review": 0, "pre-seeded": 0, invalid: 0 };
    rows.forEach(function (e) {
      var s = status(e);
      counts[s.label] = (counts[s.label] || 0) + 1;
    });
    sum.innerHTML = "<strong>" + rows.length + "</strong> disciplines · "
      + counts.initiated + " initiated · "
      + counts["pre-seeded"] + " pre-seeded · "
      + counts["needs review"] + " need review"
      + (counts.invalid ? " · <span style='color:#991b1b'>" + counts.invalid + " invalid</span>" : "");
  }

  // Re-render the table body + summary. Does NOT touch the toolbar — that's
  // built once at init by renderToolbar(). Called on every filter / search /
  // sort / group / collapsedCats change.
  function render() {
    if (!state.seed) return;

    var allRows = Object.keys(state.seed.disciplines).map(function (d) {
      var entry = applyOverlay(state.seed.disciplines[d], state.overlay[d]);
      entry.discipline = d;
      entry._impact = rekeyImpact(entry);
      entry._cpl = (state.cpl || {})[d] || null;        // CSR rollup for this discipline
      entry._cpl_n = entry._cpl ? entry._cpl.n_creds : 0; // sort key
      return entry;
    });

    var filtered = allRows.filter(function (e) {
      // Discipline search also matches a split discipline's language names +
      // codes ("Spanish"/"FLSP" → Foreign Languages) and a converged
      // discipline's alternate names ("Physical Education" → Kinesiology).
      if (state.search && e.discipline.toLowerCase().indexOf(state.search) < 0
          && splitSearchText(e).indexOf(state.search) < 0
          && aliasSearchText(e).indexOf(state.search) < 0) return false;
      if (state.subj) {
        var sq = state.subj.toUpperCase();
        var subjHit = (e.canonical_subj4 || "").toUpperCase().indexOf(sq) >= 0
          || (e.data_modal || "").toUpperCase().indexOf(sq) >= 0
          || Object.keys(variantsFor(e)).some(function (s) { return s.toUpperCase().indexOf(sq) >= 0; })
          || (splitFor(e) || []).some(function (x) { return x.code.toUpperCase().indexOf(sq) >= 0; });
        if (!subjHit) return false;
      }
      // SUBJ dropdown pick (exact code): the discipline's canonical IS the
      // code, or its CCR rows carry it (variants_observed). ANDs with the
      // other filters above/below.
      if (state.subjSel) {
        if ((e.canonical_subj4 || "") !== state.subjSel
            && !Object.prototype.hasOwnProperty.call(e.variants_observed || {}, state.subjSel)) return false;
      }
      return passesFilter(e);
    });
    filtered = sortRows(filtered);

    renderSummary(allRows);

    var wrap = document.getElementById("cs-table-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";

    // Collapse-all / Expand-all twisty — visible only when grouping is on.
    // The "wedge" the curator referred to is a disclosure triangle / twisty.
    // Toggle behavior: if ANY category is currently expanded, the button
    // collapses everything; if all are collapsed, it expands everything.
    if (state.grouped) {
      var allCats = {};
      Object.keys(state.seed.disciplines).forEach(function (d) {
        var k = state.seed.disciplines[d].top_category_2digit || "~~";
        allCats[k] = true;
      });
      var allCatKeys = Object.keys(allCats);
      var anyExpanded = allCatKeys.some(function (k) { return !state.collapsedCats[k]; });
      var twisty = el("button", {
        class: "cs-collapse-all", type: "button",
        title: anyExpanded ? "Collapse every TOP category" : "Expand every TOP category",
      }, [(anyExpanded ? "▼ Collapse all" : "▶ Expand all")]);
      twisty.onclick = function () {
        var collapseEverything = anyExpanded;
        state.collapsedCats = {};
        if (collapseEverything) {
          allCatKeys.forEach(function (k) { state.collapsedCats[k] = true; });
        }
        render();
      };
      wrap.appendChild(twisty);
    }

    var table = el("table", { class: "cs-table" });
    // Sortable column headers — click to set/flip sort. Indicator shows
    // current state (▲ asc / ▼ desc / ↕ inactive). CIP sits next to TOP
    // per the curator's preference — they read as a paired "taxonomy"
    // block, with CTE following as the derived designation.
    var COLS = [
      { key: "discipline",       label: "Discipline" },
      { key: "total_mids",       label: "MIDs",      title: "MIDs = Minted ID, the synthetic identifier for a single common course taught across one or more colleges. This number is how many distinct common courses fall under this discipline." },
      { key: "variants_count",   label: "Variants",  title: "Different 4-letter subject codes colleges currently use for this discipline. Click 'Show all' to see every code + any matching CIDs/CCNs." },
      { key: "data_modal",       label: "Most-used locally", title: "The most-used local college subject code across colleges. If shorter than 4 letters, pick a 4-letter expansion in the Common SUBJ column." },
      { key: "canonical_subj4",  label: "Common SUBJ *", title: "Required: exactly 4 uppercase letters (A–Z). The single shared subject code chosen for this discipline." },
      { key: "top_4digit",       label: "TOP",       title: "Modal TOP 4-digit category for this discipline (from the 2023 CCC Taxonomy of Programs Manual). Hover the cell for the 6-digit code + program title." },
      { key: null,               label: "CIP",       title: "CIP (Classification of Instructional Programs) — placeholder. The CCCCO is transitioning from TOP to CIP; column will populate when the mapping finalizes." },
      { key: "cte",              label: "CTE",       title: "Career Technical Education designation per the 2023 TOP Manual (asterisk-marked codes). 'all' = every MID is CTE; 'most' / 'mixed' / 'none' summarize the share." },
      { key: "_cpl_n",           label: "CPL opportunities", title: "Earned CPL articulations in this discipline: how many distinct exhibits/credentials articulate to its courses, across how many colleges. Click the badge for the full credential list. (The CER/EACR · CCR · CSR “three grains” family — this is the discipline grain.)" },
      { key: "status",           label: "Status" },
      { key: null,               label: "Notes" },
      { key: "reviewed_by",      label: "Reviewed" },
      { key: null,               label: "Validate", title: "Faculty validators confirm a reviewed row by clicking the button. Same allowed reviewers can validate; validation marks the row faculty-approved." },
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
    var colCount = COLS.length;
    if (state.grouped) {
      // Group by TOP 2-digit category, ordered by code (01, 02, …). Rows
      // without a top_category_2digit go under a "Uncategorized" group last.
      var groups = {};
      filtered.forEach(function (e) {
        var k = e.top_category_2digit || "~~";
        (groups[k] = groups[k] || []).push(e);
      });
      var keys = Object.keys(groups).sort();
      keys.forEach(function (k) {
        var rows = groups[k];
        var title = k === "~~" ? "(Uncategorized)" :
          (k + " — " + (rows[0].top_category_title || "TOP " + k));
        var collapsed = !!state.collapsedCats[k];
        var hr = el("tr", { class: "cs-cat-header" + (collapsed ? " collapsed" : "") });
        var td = el("td", { colspan: String(colCount) });
        td.innerHTML = (collapsed ? "▶ " : "▼ ") +
          "<strong>" + title + "</strong> " +
          "<span style='color:#6b7280;font-weight:400'>· " + rows.length + " discipline" + (rows.length === 1 ? "" : "s") + "</span>";
        td.style.cursor = "pointer";
        (function (key) {
          td.onclick = function () { state.collapsedCats[key] = !state.collapsedCats[key]; render(); };
        })(k);
        hr.appendChild(td);
        tbody.appendChild(hr);
        if (!collapsed) {
          rows.forEach(function (e) { tbody.appendChild(rowFor(e)); });
        }
      });
    } else {
      filtered.forEach(function (e) { tbody.appendChild(rowFor(e)); });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function rowFor(entry) {
    var tr = el("tr");
    // Discipline cell — name first; a converged discipline (fan-in) also
    // carries an "also: <alternate name>" chip so the folded-in name stays
    // discoverable (matched in render()'s search filter too).
    var tdDisc = el("td", { class: "cs-disc" }, [entry.discipline]);
    var aliasArr = aliasesFor(entry);
    if (aliasArr && aliasArr.length) {
      var aliasChip = el("span", {
        class: "cs-badge muted",
        title: "Alternate discipline name" + (aliasArr.length > 1 ? "s" : "")
          + " (fan-in convergence): identities minted under "
          + aliasArr.join(" / ") + " were folded into " + entry.discipline
          + ". The alternate remains a valid MQ for faculty qualification.",
      }, ["also: " + aliasArr.join(", ")]);
      aliasChip.style.marginLeft = "6px";
      aliasChip.style.cursor = "help";
      tdDisc.appendChild(aliasChip);
    }
    // MQ-list chip (19th ed. handbook) — 🎓 master's list · 🔧 experience list
    // (any bachelor's + 2 yrs OR associate + 6 yrs) · 🎓🔧 both · 📋 noncredit
    // CCR §53412. Added 2026-07-10 after Sam's Vocational/Business question:
    // re-disciplining a row changes the implied faculty-qualification pool —
    // this chip makes that visible at the point of decision.
    var mq = state.mq && state.mq[entry.discipline];
    if (mq) {
      var mqIcon = mq.mq_list === "masters" ? "🎓"
        : mq.mq_list === "not_masters" ? "🔧"
        : mq.mq_list === "both_lists" ? "🎓🔧" : "📋";
      var mqChip = el("span", {
        class: "cs-badge muted",
        title: "MQ Handbook (19th ed.): " + (mq.mq_list_label || mq.mq_list)
          + (mq.special_ccr ? " · " + mq.special_ccr : "")
          + (mq.flags ? " · " + mq.flags.join(", ") : "")
          + ". 🎓 = master's in the discipline; 🔧 = any bachelor's + 2 yrs"
          + " professional experience OR any associate + 6 yrs.",
      }, [mqIcon]);
      mqChip.style.marginLeft = "6px";
      mqChip.style.cursor = "help";
      tdDisc.appendChild(mqChip);
    }
    tr.appendChild(tdDisc);
    tr.appendChild(el("td", { class: "cs-mono" }, [String(entry.total_mids || 0)]));
    tr.appendChild(variantsCell(entry));
    // Data-modal cell — the most-used LOCAL college subject code. Local codes
    // are the colleges' own vocabulary and are ALLOWED to be non-4-letter
    // ("VN", "VOC ED"), so this cell carries NO warning chip (the old
    // "⚠ needs 4-letter" here was noise — removed 2026-06-12, Sam's CSR
    // review). The chip had been doing double duty: its real signal — the
    // canonical pick is still MISSING because the modal couldn't be
    // auto-seeded — now renders on the Common SUBJ cell (see tdCanon below),
    // where the fix actually happens.
    var tdModal = el("td", { class: "cs-mono" });
    tdModal.appendChild(document.createTextNode(entry.data_modal || "—"));
    tr.appendChild(tdModal);

    // Canonical SUBJ4 input
    var input = el("input", {
      class: "cs-canon", type: "text", maxlength: "4",
      value: entry.canonical_subj4 || "", placeholder: "ABCD"
    });
    if (!state.sess) input.disabled = true;
    var initial = input.value;
    // Live SUBJ ⇄ CCR feedback under the input: collision/in-use assessment
    // + collision-free suggestion chips. Populated on focus/input, cleared
    // shortly after blur (the delay lets a chip's mousedown set the value
    // before the blur-save runs).
    var hint = el("div", { class: "cs-subj-hint" });
    function reflectValidity() {
      var v = (input.value || "").toUpperCase();
      input.value = v;
      input.classList.remove("cs-saved", "cs-invalid");
      if (v && !SUBJ4_RE.test(v)) input.classList.add("cs-invalid");
    }
    input.oninput = function () { reflectValidity(); renderSubjHint(entry, input, hint); };
    input.onfocus = function () { ensureCheckCss(); renderSubjHint(entry, input, hint); };
    input.onblur = function () {
      setTimeout(function () { hint.innerHTML = ""; hint.classList.remove("show"); }, 150);
      var v = (input.value || "").toUpperCase();
      if (v === initial.toUpperCase()) return;
      if (v && !SUBJ4_RE.test(v)) { toast("Canonical SUBJ4 must be exactly 4 letters", true); return; }
      if (v) {
        // Hard-collision guard: another discipline already owns this code as
        // its Common SUBJ (or umbrella split/span). Never silent — but never
        // blocking either: an intentional fan-in convergence is a legitimate
        // save, so confirm instead of refuse.
        var own = otherOwners(v, entry.discipline);
        if (own.length && !confirm(
          v + " is already the Common SUBJ of " + own.map(function (o) { return o.d; }).join(" + ") +
          ".\n\nTwo disciplines sharing one code will collide at the SUBJ4 fold re-mint. " +
          "Save anyway (e.g. an intentional convergence)?")) {
          input.value = initial;
          reflectValidity();
          return;
        }
      }
      saveField(entry.discipline, FIELD_CANON, v, state.sess)
        .then(function (r) {
          if (!r.ok) { toast("Save failed (" + r.status + ")", true); return; }
          input.classList.add("cs-saved");
          // Reflect in state.overlay so the row updates without a refetch.
          var rec = state.overlay[entry.discipline] = state.overlay[entry.discipline] || {};
          rec[FIELD_CANON] = v;
          rec.reviewed_by = state.sess.email;
          rec.reviewed_at = new Date().toISOString();
          invalidateSubjIndex(); // ownership changed — next check/hint rebuilds
          toast("Saved " + entry.discipline + " → " + v);
          render();
        })
        .catch(function () { toast("Save failed (network)", true); });
    };
    input.onkeydown = function (e) { if (e.key === "Enter") input.blur(); };
    var tdCanon = el("td", null, [input, hint]);
    // Residual "⚠ needs 4-letter" warning — a discipline whose canonical
    // pick is MISSING (needs-review: no canonical_subj4, typically because
    // the most-used local code isn't 4 letters so it couldn't be
    // auto-seeded). This belongs HERE on the Common SUBJ cell — where the
    // curator picks the code — not on the Most-used-locally cell (local
    // codes are allowed to be non-4-letter; flagging them there was noise).
    // The Status chip's "needs review" keeps surfacing the same state.
    if (!entry.canonical_subj4) {
      var needsPick = el("span", {
        class: "cs-badge warn",
        title: "No 4-letter Common SUBJ picked yet"
          + (entry.data_modal && !entry.data_modal_is_4letter
              ? " — the most-used local code (" + entry.data_modal
                + ") isn't a usable 4-letter canonical, so pick an expansion here."
              : " — pick one for this discipline."),
      }, ["⚠ needs 4-letter"]);
      needsPick.style.marginLeft = "6px";
      tdCanon.appendChild(needsPick);
    }
    // Multi-SUBJ4 umbrella (e.g. Foreign Languages): show the per-language
    // split codes so the curator sees the discipline isn't single-canonical,
    // and the codes are visibly searchable (matched in render()'s filter).
    var splitArr = splitFor(entry);
    if (splitArr && splitArr.length) {
      var splitTip = splitArr.map(function (x) { return x.lang + " → " + x.code; }).join("\n");
      var splitChip = el("span", {
        class: "cs-badge muted",
        title: "Split per-language (multi-SUBJ4 umbrella):\n" + splitTip,
      }, ["⚯ " + splitArr.length + " splits"]);
      splitChip.style.marginLeft = "6px";
      splitChip.style.cursor = "help";
      tdCanon.appendChild(splitChip);
      var codesLine = el("div", {
        class: "cs-mono",
        style: "font-size:.68rem;color:#6b7280;margin-top:3px;line-height:1.3;",
      }, [splitArr.map(function (x) { return x.code; }).join(" · ")]);
      tdCanon.appendChild(codesLine);
    }
    // CID / CCN match badges — count official identifiers whose subject
    // equals the canonical SUBJ4 (or, if no canonical set yet, the data
    // modal). Hover tooltip lists the actual identifiers + titles (capped
    // for legibility); click opens the full list in the variants modal.
    var matchSubj = entry.canonical_subj4 || entry.data_modal;
    function _badgeTip(hits, kind) {
      // First 6 identifiers + their titles in the tooltip; the variants
      // modal carries the full list.
      var lines = [kind + " descriptors that use subject " + matchSubj + " (click to see all):"];
      hits.slice(0, 6).forEach(function (h) {
        lines.push("  " + h.id + (h.title ? " — " + h.title : ""));
      });
      if (hits.length > 6) lines.push("  …+" + (hits.length - 6) + " more");
      return lines.join("\n");
    }
    if (matchSubj) {
      var cidHits = state.cidBySubj[matchSubj] || [];
      var ccnHits = state.ccnBySubj[matchSubj] || [];
      if (cidHits.length > 0) {
        var cidBadge = el("span", {
          class: "cs-id-badge cid",
          title: _badgeTip(cidHits, "CID"),
          style: "cursor:pointer",
        }, ["CID·" + cidHits.length]);
        cidBadge.onclick = function (e) { e.stopPropagation(); openVariantsModal(entry); };
        tdCanon.appendChild(cidBadge);
      }
      if (ccnHits.length > 0) {
        var ccnBadge = el("span", {
          class: "cs-id-badge ccn",
          title: _badgeTip(ccnHits, "CCN"),
          style: "cursor:pointer",
        }, ["CCN·" + ccnHits.length]);
        ccnBadge.onclick = function (e) { e.stopPropagation(); openVariantsModal(entry); };
        tdCanon.appendChild(ccnBadge);
      }
    }
    tr.appendChild(tdCanon);

    // TOP cell — 4-digit modal code; tooltip shows the 6-digit code + program title
    var tdTop = el("td", { class: "cs-mono" });
    if (entry.top_modal_4digit) {
      var topText = entry.top_modal_4digit;
      var topTip = entry.top_modal_6digit
        ? (entry.top_modal_6digit + " — " + (entry.top_modal_title || ""))
        : "";
      tdTop.appendChild(el("span", { title: topTip }, [topText]));
    } else {
      tdTop.appendChild(document.createTextNode("—"));
    }
    tr.appendChild(tdTop);

    // CIP placeholder column — sits next to TOP (paired taxonomy block).
    // CCCCO is transitioning from TOP to CIP; column will populate when the
    // mapping finalizes. Always blank today.
    tr.appendChild(el("td", { class: "cs-mono", style: "color:#9ca3af", title: "CIP code — placeholder. The CCCCO is transitioning from TOP to CIP; column will populate when the mapping finalizes." }, ["—"]));

    // CTE cell — show the flag as a badge with color reflecting the share.
    // .cs-cte rides ensureCsrUiCss(): the badge ("Y (90%)") stays on ONE
    // line; the width it needs comes out of the Notes column's slack.
    var tdCte = el("td", { class: "cs-cte" });
    if (entry.cte_flag && entry.cte_flag !== "none") {
      var cls = entry.cte_flag === "all" ? "ok"
              : entry.cte_flag === "most" ? "ok"
              : entry.cte_flag === "mixed" ? "mix" : "muted";
      var share = Math.round((entry.cte_share || 0) * 100);
      var label = entry.cte_flag === "all" ? "Y (all)"
                : entry.cte_flag === "most" ? "Y (" + share + "%)"
                : "mixed (" + share + "%)";
      tdCte.appendChild(el("span", {
        class: "cs-badge " + cls,
        title: "CTE-designated MIDs: " + share + "% (" + (entry.cte_known_n || 0) + " of " +
               ((entry.cte_known_n || 0) + (entry.cte_unknown_n || 0)) + " with known TOP). Source: 2023 CCC TOP Manual.",
      }, [label]));
    } else {
      tdCte.appendChild(el("span", { class: "cs-badge muted", title: "No CTE-designated TOP codes in this discipline." }, ["—"]));
    }
    tr.appendChild(tdCte);

    // CPL opportunities cell — the CSR rollup (mirror of the EACR/CCR at the
    // discipline grain): how many exhibits/credentials articulate to this
    // discipline's courses, across how many colleges. Click to list them.
    tr.appendChild(cplCell(entry));

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
    if (entry.validated_at && entry.validated_by) {
      // Two-line: validator (top) + reviewer (bottom) when both exist.
      rev.innerHTML = "✓ <strong>" + (entry.validated_by || "").split("@")[0] + "</strong> · " + entry.validated_at.slice(0, 10);
      if (entry.reviewed_by && entry.reviewed_at) {
        rev.innerHTML += "<br><span style='color:#9ca3af;font-size:.7rem'>rev. " +
          (entry.reviewed_by || "").split("@")[0] + " · " + entry.reviewed_at.slice(0, 10) + "</span>";
      }
    } else if (entry.reviewed_at && entry.reviewed_by) {
      rev.textContent = (entry.reviewed_by || "").split("@")[0] + " · " + entry.reviewed_at.slice(0, 10);
    } else {
      rev.textContent = "—";
    }
    tr.appendChild(rev);

    // Validate cell — button enabled only when row is reviewed (not yet
    // validated) AND the curator is signed in. Same allowed_reviewers can
    // validate (per the schema migration's RLS policy).
    var tdValidate = el("td");
    var st2 = status(entry);
    if (st2.label === "validated") {
      tdValidate.appendChild(el("span", { class: "cs-badge ok", title: "Validated " + (entry.validated_at || "").slice(0, 10) + " by " + (entry.validated_by || "") }, ["✓ validated"]));
    } else if (st2.label === "initiated" && state.sess) {
      var vb = el("button", { type: "button", class: "cs-validate-btn", title: "Mark this row faculty-validated" }, ["Validate"]);
      vb.onclick = function () {
        if (!confirm("Validate " + entry.discipline + "?\n\nThis marks the row faculty-confirmed. Same allowed-reviewers can validate.")) return;
        vb.disabled = true;
        vb.textContent = "Validating…";
        saveValidate(entry.discipline, state.sess)
          .then(function (r) {
            if (!r.ok) { vb.disabled = false; vb.textContent = "Validate"; toast("Validate failed (" + r.status + ")", true); return; }
            var rec = state.overlay[entry.discipline] = state.overlay[entry.discipline] || {};
            rec.validated_at = new Date().toISOString();
            rec.validated_by = state.sess.email;
            toast("Validated · " + entry.discipline);
            render();
          })
          .catch(function () { vb.disabled = false; vb.textContent = "Validate"; toast("Validate failed (network)", true); });
      };
      tdValidate.appendChild(vb);
    } else {
      tdValidate.appendChild(el("span", { class: "cs-muted-dash", title: st2.label === "validated" ? "" : "Validation is only available for reviewed rows." }, ["—"]));
    }
    tr.appendChild(tdValidate);

    return tr;
  }

  // CPL-opportunities cell: a count badge ("🎓 N · M coll.") linking to the
  // credential list, or a muted dash when the discipline has no earned
  // articulations yet. Data from the CSR rollup (state.cpl[discipline]).
  function cplCell(entry) {
    var td = el("td");
    var r = entry._cpl;
    if (!r || !r.n_creds) {
      td.appendChild(el("span", { class: "cs-muted-dash", title: "No earned CPL articulations recorded for this discipline yet." }, ["—"]));
      return td;
    }
    var top = (r.creds || []).slice(0, 6).map(function (c) { return c.c; }).join(", ");
    var badge = el("span", {
      class: "cs-badge ok", style: "cursor:pointer",
      title: r.n_creds + " credential" + (r.n_creds === 1 ? "" : "s") + " · " +
             r.n_colleges + " college" + (r.n_colleges === 1 ? "" : "s") + " · " +
             r.n_courses + " course" + (r.n_courses === 1 ? "" : "s") +
             "\nTop: " + top + "\n(click for the full list)",
    }, ["🎓 " + r.n_creds + " · " + r.n_colleges + " coll."]);
    badge.onclick = function (e) { e.stopPropagation(); openCplModal(entry); };
    td.appendChild(badge);
    return td;
  }

  // Inject the CPL modal once (reuses the tab's .cs-modal-bg/.cs-modal classes;
  // appended inside the pane so those scoped rules apply — no HTML edit needed).
  function ensureCplModal() {
    if (document.getElementById("cs-cpl-modal")) return;
    if (!document.getElementById("cs-cpl-css")) {
      document.head.appendChild(el("style", { id: "cs-cpl-css" }, [
        "#tab-canonical-subj4 .cs-cpl-table{width:100%;border-collapse:collapse;font-size:.85rem;margin-top:8px;}" +
        "#tab-canonical-subj4 .cs-cpl-table th{text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;padding:4px 8px;}" +
        "#tab-canonical-subj4 .cs-cpl-table td{padding:4px 8px;border-bottom:1px solid #f1f5f9;vertical-align:top;}"
      ]));
    }
    var close = el("button", { class: "cs-modal-close", type: "button", "aria-label": "Close" }, ["×"]);
    var modal = el("div", { class: "cs-modal" }, [
      close,
      el("h3", { id: "cs-cpl-title" }, ["CPL opportunities"]),
      el("div", { id: "cs-cpl-body" }),
    ]);
    var bg = el("div", { id: "cs-cpl-modal", class: "cs-modal-bg", role: "dialog", "aria-modal": "true" }, [modal]);
    function shut() { bg.classList.remove("show"); document.removeEventListener("keydown", esc); }
    function esc(e) { if (e.key === "Escape") shut(); }
    bg._esc = esc;
    close.onclick = shut;
    bg.onclick = function (e) { if (e.target === bg) shut(); };
    document.getElementById("tab-canonical-subj4").appendChild(bg);
  }

  // Open the CPL modal for a discipline: list every aligned exhibit/credential
  // (credential · issuer · #colleges that earned it).
  function openCplModal(entry) {
    ensureCplModal();
    var r = entry._cpl;
    if (!r) return;
    var bg = document.getElementById("cs-cpl-modal");
    document.getElementById("cs-cpl-title").textContent = "🎓 CPL opportunities · " + entry.discipline;
    var body = document.getElementById("cs-cpl-body");
    body.innerHTML = "";
    body.appendChild(el("p", {}, [
      r.n_creds + " distinct exhibit/credential" + (r.n_creds === 1 ? "" : "s") +
      " articulate to this discipline’s courses, earned across " + r.n_colleges +
      " college" + (r.n_colleges === 1 ? "" : "s") + " (" + r.n_courses + " course identit" +
      (r.n_courses === 1 ? "y" : "ies") + ")."
    ]));
    var tbl = el("table", { class: "cs-cpl-table" });
    var hr = el("tr");
    ["Credential", "Issuer", "Colleges"].forEach(function (h) { hr.appendChild(el("th", {}, [h])); });
    tbl.appendChild(el("thead", null, [hr]));
    var tb = el("tbody");
    (r.creds || []).forEach(function (c) {
      var row = el("tr");
      row.appendChild(el("td", {}, [c.c || "—"]));
      row.appendChild(el("td", { style: "color:#6b7280;" }, [c.i || "—"]));
      row.appendChild(el("td", { class: "cs-mono", style: "text-align:center;" }, [String(c.n)]));
      tb.appendChild(row);
    });
    tbl.appendChild(tb);
    body.appendChild(tbl);
    document.addEventListener("keydown", bg._esc);
    bg.classList.add("show");
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

  // Quickstart-C hint consumer. Pre-pops the status / TOP / search filters
  // from a routing hint stashed by quickstart.js. Unknown keys are silently
  // dropped; valid hints set state + sync the matching toolbar input.
  var QS_TAB = "canonical-subj4";
  var QS_STATUS = { needs_review: 1, pre_seeded: 1, reviewed: 1, validated: 1, invalid: 1 };
  function applyQsHint(hint) {
    if (!hint || typeof hint !== "object") return false;
    var any = false;
    if (typeof hint.status === "string" && QS_STATUS[hint.status]) {
      state.filter = hint.status; any = true;
    }
    if (typeof hint.top_2digit === "string" && /^\d{2}$/.test(hint.top_2digit)) {
      state.topFilter = hint.top_2digit; any = true;
    }
    if (typeof hint.search === "string" && hint.search) {
      state.search = hint.search.toLowerCase(); any = true;
    }
    return any;
  }

  function init() {
    if (!document.getElementById("tab-canonical-subj4")) return;
    ensureCsrUiCss(); // table-chrome overrides (white non-bold header, one-line CTE)
    state.sess = getSession();
    wireGuidelinesModal();
    wireVariantsModal();
    Promise.all([fetchSeed(), fetchOverlay(), fetchCidCcn(), fetchCplRollup(), fetchFLSplit(), fetchAliases(), fetchMqSections()]).then(function (parts) {
      state.seed = parts[0];
      state.overlay = parts[1];
      state.cidBySubj = parts[2].cidBySubj || {};
      state.ccnBySubj = parts[2].ccnBySubj || {};
      state.cpl = (parts[3] || {}).byDiscipline || {};
      state.split = buildSplit(parts[4]);
      state.aliases = (parts[5] || {}).aliases || {};
      state.mq = (parts[6] || {}).disciplines || {};
      // Stamp the discipline name onto every seed entry (the entries are keyed
      // by name but don't carry it) so splitFor()/status() can resolve it from
      // the raw entry too, not just from built rows.
      var dd = state.seed.disciplines || {};
      Object.keys(dd).forEach(function (n) { if (dd[n] && !dd[n].discipline) dd[n].discipline = n; });
      // Apply any pending quickstart hint stashed before init (refresh case).
      if (window.CPL_QS) applyQsHint(window.CPL_QS.consume(QS_TAB));
      // Toolbar is built once at init. Subsequent state changes only
      // re-render the table (render()); the search input keeps focus.
      renderToolbar();
      render();
    });
    // Subscribe to runtime hints (quickstart fires after the tab is already
    // mounted — most common path). Rebuild the toolbar so the hinted filter
    // is visible in the dropdown chrome too.
    window.addEventListener("cpl-qs-hint", function (e) {
      if (!e || !e.detail || e.detail.tab !== QS_TAB) return;
      if (applyQsHint(e.detail.hint)) { renderToolbar(); render(); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
