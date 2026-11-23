// commons_subjects.js — the CPL Commons' Subjects list: Steps a and b of Sam's curation order, college by college.
//
// Sam, 2026-11-20 (r-subjects-card-on-the-commons-sam-2026-11-20): "don't we need a commons card for subjects to house
// the common subjects and local subject titles we'll be establishing from catalog data?" His curation order runs Step a,
// the common subject code; Step b, the local subject title; Step c, the M-ID. Under his delegation the same day
// (d-step-b-owner-courses-bot-2026-11-20) the Courses bot drafts each local subject title from the catalog's subject
// heading, and a curator settles the codes the catalog and the state list disagree on.
//
// What it reads: kb/status/local_subject_titles.json, built by kb/_build_local_subject_titles.py from
// the printed catalogs (kb/hand_filed_catalogs/courses/), the state course list (coci_lookup_data.js), the subject map
// and the canonical SUBJ file. A catalog that prints the code alone reads TBA for its title. Beside a row with no
// title or no common code it shows the recommendation kb/status/local_subject_recommendations.json holds for it.
//
// What it writes (S701, r-subject-save-path-kb-curation-sam-2026-11-22, Sam: "Fine."): Edit and Save in a code's
// course panel, for a signed-in reviewer. One kb_curation row per decision, course_id SUBJ:<college>|<code>|<band>
// (band credit, or whole where COCI lists no course under the code), field subject_decision, value JSON text with
// local_title and or common_code, under the reviewer's own email; Take it back deletes that one row. A person's save
// wins on this page over the catalog, the subject map and every recommendation. A code's noncredit courses save one
// row per COCI noncredit category it holds, band nc:<category slug> (#3655, d-subject-save-key-three-part-s698; the
// slugs come from the titles file's noncredit_slugs): a noncredit-only code keeps its title on its dominant category's
// row, and a category with no common subject code takes a title and no code (d-noncredit-four-categories-no-code-s701).
// The rows hold a college slug, a code, a title and a common code; no student or staff detail (Rule 10 a3;
// kb/governance_surface_map.json maps the field to DR-25). The daily build reads them (kb/_sync_subject_decisions.py,
// kb/subject_decisions.py).
//
// Addresses (loaded by commons.js when the address names it): #commons/subjects (every college),
// #commons/subjects/noncredit (the noncredit subject title list, standing on Sam's word of 2026-11-22, from kb/status/noncredit_subject_titles.json),
// #commons/subjects/<college slug> (one college), #commons/subjects/<college slug>/<local code> (that college with
// the code's course panel open, read from kb/status/subject_courses/<slug>.json), #commons/subjects/disagree (the codes only one side prints, the
// list of codes with no title), #commons/subjects/held (S695: the local subject codes the pile mint holds on, ranked by the held
// courses a decided common subject code releases; read from kb/status/held_subject_codes.json, built by
// kb/_held_subject_codes.py, and fetched only when that view opens), #commons/subjects/statewide (S712: every local code at
// every college with a call and a confidence, read from kb/status/statewide_subject_codes.json when it opens; a confirm
// is a person's statewide filing, _SUBJ_DISC::<CODE>). The view picked lasts the visit; only the address carries it. Tokens only (the tab's --cmn roles),
// words for every control, no glyphs.
(function () {
  "use strict";

  var FILE = "kb/status/local_subject_titles.json";
  var SIDES = { both: "Both", catalog: "Catalog only", state: "COCI only" };
  /* Why a row has no title (Sam, 2026-11-21, #3655: "an indicator (chip) in the row to indicate that the catalog read
     was either blocked, title not in catalog, or not parsed yet"). The builder writes the state from a recorded fact;
     a row nothing proves reads Not read yet. Only Not in catalog rows are Sam's; Not read yet is Sky's to clear. */
  var STATES = {
    not_read: { word: "Not read yet", tip: "The catalog has this subject and our read did not take its heading. Sky clears it with a re-read." },
    blocked: { word: "Blocked", tip: "The college’s site refused our reader. A person hands the page over, or the reader is fixed." },
    not_in_catalog: { word: "Not in catalog", tip: "The catalog was read and gives this code no subject heading. It waits on a title from a person." }
  };
  /* A code's courses in COCI, credit and noncredit apart (Sam, 2026-11-21: the MQs separate them), and noncredit and
     noncredit enhanced apart (Sam, 2026-11-22: "Coci has a credit, noncredit, noncredit enhanced indicator"). */
  function ncWords(r) {
    if (r.noncredit_plain == null && r.noncredit_enhanced == null) return fmt(r.noncredit_courses) + " noncredit";
    return [r.noncredit_plain ? fmt(r.noncredit_plain) + " noncredit" : "", r.noncredit_enhanced ? fmt(r.noncredit_enhanced) + " noncredit enhanced" : ""]
      .filter(Boolean).join(", ");
  }
  function bands(r) {
    if (r.noncredit_courses == null || !r.noncredit_courses) return "";
    return " (" + fmt(r.credit_courses || 0) + " credit, " + ncWords(r) + ")";
  }
  /* A noncredit row's COCI noncredit categories, most courses first, and the dominant one's noncredit MQ discipline;
     a category with no common code shows by name and says so (d-noncredit-four-categories-no-code-s701). */
  var NC_MQ = {};
  function categoryLine(r) {
    var parts = (r.categories || []).filter(function (p) { return p && p[0] && p[0] !== "(no category in the export)"; });
    if (!r.noncredit_courses || !parts.length) return null;
    var m = NC_MQ[parts[0][0]] || {};
    return el("span", { cls: "csb-sub csb-nc-line", "data-category": parts[0][0] }, [
      "COCI noncredit " + (parts.length === 1 ? "category: " : "categories: ") + parts.map(function (p) { return p[0] + " (" + fmt(p[1]) + ")"; }).join(", ") + ". "
      + (m.mq_discipline ? "Noncredit MQ discipline: " + m.mq_discipline + (m.common_code ? ", common subject code " + m.common_code + "." : ", no common subject code yet.")
        : "No noncredit MQ discipline is named for " + parts[0][0] + ", and no common subject code yet.")]);
  }
  function needsTitle(r) { return !r.printed_name; }
  /* One list, every subject (Sam, 2026-11-22: "view inside subjects"; "should be able to see all subjects on one
     list"). The list opens on All; Credit and Noncredit narrow it to the codes that hold such courses in COCI, so a
     code with both shows under each. The pick lasts the visit and is never stored (tabs do not remember a filter). */
  var BAND_WORDS = [["", "All subjects"], ["C", "Credit"], ["N", "Noncredit"]];
  function inBand(r, band) { return !band || (band === "C" ? (r.credit_courses || 0) > 0 : (r.noncredit_courses || 0) > 0); }
  function bandBar(rows) {
    var bar = el("p", { cls: "csb-bands", role: "group", "aria-label": "Show credit or noncredit subjects" }, [el("span", { cls: "csb-bands-l", text: "Show: " })]);
    BAND_WORDS.forEach(function (b) {
      var n = rows.filter(function (r) { return inBand(r, b[0]); }).length;
      bar.appendChild(el("button", { type: "button", cls: "csb-word", "data-csb-band": b[0], "aria-pressed": S.band === b[0] ? "true" : "false", text: b[1] + " (" + fmt(n) + ")" }));
    });
    return bar;
  }
  function stateOf(r) { return STATES[r.title_state] || STATES.not_read; }
  /* The recommendations (S700, #3655; Sam, 2026-11-21): a recommended local title beside every row with no catalog
     heading and a recommended common code beside every credit row with none, each with the level its source
     measured on the titled codes (kb/_build_local_subject_recommendations.py). A recommendation is a note for the
     person who settles the row. A noncredit-only row's recommendation is lined up with the noncredit title list by its own
     COCI noncredit category (S701, after the hold lifted). */
  var REC_FILE = "kb/status/local_subject_recommendations.json";
  var REC = {};
  function recModel(f) {
    var by = {};
    ((f || {}).colleges || []).forEach(function (c) {
      (c.rows || []).forEach(function (r) { by[c.slug + "|" + r.code] = r; });
    });
    return by;
  }
  function recOf(r) { return REC[r.slug + "|" + r.code] || {}; }
  function recNote(kind, what, x) {
    if (kind === "common" && !x.code) return el("span", { cls: "csb-sub csb-rec", "data-rec": "common-none" }, [
      el("strong", { text: "No common subject code yet" }), ". " + (x.why || "")]);
    var also = (x.also || []).map(function (a) { return a.title; }).filter(Boolean);
    return el("span", { cls: "csb-sub csb-rec", "data-rec": kind, "data-level": x.level }, [
      el("strong", { text: "Recommended: " + what }), ". Confidence: " + x.level + ". " + (x.why || "")
      + (also.length ? " Also read: " + also.join("; ") + "." : "")]);
  }
  var DISAGREE = "disagree";
  var HELD = "held";
  var HELD_FILE = "kb/status/held_subject_codes.json";
  /* The noncredit subject title list (S700; Sam, 2026-11-21, relayed by COBIx on #3655: build it from the four large
     noncredit programs' catalogs, then line the smaller programs up with it). #commons/subjects/noncredit draws
     kb/status/noncredit_subject_titles.json (kb/_build_noncredit_subject_titles.py). The titles stand on Sam's word of
     2026-11-22 (r-noncredit-title-list-go-sam-2026-11-22) and are his to change. */
  var NC = "noncredit";
  /* Every local code statewide (S712; Sam, 2026-11-23: "what's settled-3019 unique list with the colleges that uses",
     "all colleges count", "always provide a recommendation based on your best available data and always provide a
     confidence score"). Read from kb/status/statewide_subject_codes.json (kb/_statewide_subject_codes.py) when the view
     opens. A save is a person's statewide filing, the Local subjects List's own row (_SUBJ_DISC::<CODE>, field
     subject_discipline_confirm, the MQ discipline as plain text; DR-25), which the daily sync reads for every college. */
  var SW = "statewide", SW_FILE = "kb/status/statewide_subject_codes.json", SW_FIELD = "subject_discipline_confirm", SW_PREFIX = "_SUBJ_DISC::";
  var NC_FILE = "kb/status/noncredit_subject_titles.json";
  /* Colleges by source (S717; the Subjects card mock's Colleges artboard, Sam's ask of 2026-11-23): every college, its
     catalog platform, its codes and titled codes, a status word for each way to look for its subject titles in the
     ladder's order (d-subject-title-sources-ladder-s712), and the next step. Read from kb/status/subject_sources.json
     (kb/_subject_sources.py) when the view opens; a college with a catalog on file counts its titled codes live. */
  var SRC = "sources", SRC_FILE = "kb/status/subject_sources.json";
  var SRC_PICKS = [["needed", "Titles needed", function (r) { return !r.catalog_on_file; }],
    ["titled", "Titled", function (r) { return r.catalog_on_file; }], ["all", "All", function () { return true; }]];
  var SRCS = { pick: "needed" };

  /* ── Edit and Save (S701): a person's decision as one kb_curation row ── */
  var REST = (window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co") + "/rest/v1";
  var SAVE_PREFIX = "SUBJ:", SAVE_FIELD = "subject_decision", PAGE = 1000;
  var SAVED = {}, SAVE_ERR = "", SAID = {}, LAPSED = false;
  var COMMON = null, TC = null;   /* from the titles file: canonical SUBJ -> MQ discipline, and the Title Case word lists */
  /* The band a decision is keyed by (Sam, 2026-11-21: credit and noncredit disciplines are separate in the MQs):
     credit where COCI lists a credit course under the code, whole where it lists none (the catalog alone prints it),
     noncredit where every COCI course is noncredit, whose saves are keyed one per COCI noncredit category
     (nc:<category slug>; the code's noncredit courses in a code with credit ones are keyed the same way). */
  function bandOf(r) {
    if ((r.credit_courses || 0) > 0) return "credit";
    if ((r.noncredit_courses || 0) > 0) return "noncredit";
    return (r.state_courses || 0) ? "credit" : "whole";
  }
  function isLink(u) { return /^https?:\/\/[^\s\/]+\.[^\s]+$/i.test(String(u || "").trim()); }
  function saveKey(slug, code, band) { return SAVE_PREFIX + slug + "|" + code + "|" + band; }
  /* The noncredit categories (#3655): each category's slug comes from the titles file (noncredit_slugs, copied from
     the one list in kb/status/noncredit_categories.json), so the page makes no slug of its own. */
  var NO_CAT = "(no category in the export)", NC_SLUGS = {};
  function ncParts(r) { return (r.categories || []).filter(function (p) { return p && p[0] && (p[1] || 0) > 0; }); }
  /* The category a noncredit-only code keeps its title under: the most courses (ties A to Z), a named category before
     the export's blank one. kb/subject_decisions.py dominant is the same rule. */
  function dominantOf(parts) {
    var named = parts.filter(function (p) { return p[0] !== NO_CAT; });
    if (!named.length) named = parts;
    return named.slice().sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); }).map(function (p) { return p[0]; })[0] || null;
  }
  function catWords(cat) { return cat === NO_CAT ? "the courses COCI names no category for" : cat; }
  function catOfSlug(slug) { for (var k in NC_SLUGS) if (NC_SLUGS[k] === slug) return k; return null; }
  function slugOfSave(sv) { var i = String(sv.mapKey).lastIndexOf("|nc:"); return i < 0 ? "" : String(sv.mapKey).slice(i + 4); }
  function ncSaves(r) {
    var base = r.slug + "|" + r.code + "|nc:";
    return Object.keys(SAVED).sort().filter(function (k) { return k.indexOf(base) === 0 && k.slice(base.length).indexOf("|") < 0; }).map(function (k) { return SAVED[k]; });
  }
  /* A noncredit-only code's title: the dominant category's save, else another category's, marked moved (the latest
     first, then by key: kb/subject_decisions.py noncredit_title). */
  function ncTitleOf(r) {
    var dom = dominantOf(ncParts(r)), ds = dom ? NC_SLUGS[dom] : null, mk = r.slug + "|" + r.code + "|nc:" + ds;
    var here = ds ? SAVED[mk] : null;
    if (here && here.title) return { title: here.title, sv: here, cat: dom, moved: false };
    var best = null;
    ncSaves(r).forEach(function (sv) {
      if (sv.mapKey === mk || !sv.title) return;
      if (!best || String(sv.at || "") > String(best.at || "") || (String(sv.at || "") === String(best.at || "") && sv.key > best.key)) best = sv;
    });
    return best ? { title: best.title, sv: best, cat: catOfSlug(slugOfSave(best)), moved: true } : null;
  }
  /* The row's save under its band today. COCI's counts move, so a code saved whole can gain a credit course (and the
     reverse): where the current band has no save, the save under the other band stands, marked moved, and a new Save
     writes under the current band. A noncredit-only row shows its code's title and its dominant category's code. */
  function savedOf(r) {
    var b = bandOf(r);
    if (b === "noncredit") {
      var parts = ncParts(r);
      if (!parts.length) return null;
      var ds = NC_SLUGS[dominantOf(parts)], dsv = ds ? SAVED[r.slug + "|" + r.code + "|nc:" + ds] : null, t = ncTitleOf(r);
      var cm = dsv && dsv.common ? dsv : null;
      if (!t && !cm) return null;
      var base = cm || t.sv, n = {};
      for (var q in base) n[q] = base[q];
      n.title = t ? t.title : ""; n.common = cm ? cm.common : "";
      return n;
    }
    var here = SAVED[r.slug + "|" + r.code + "|" + b];
    if (here) return here;
    var other = b === "credit" ? "whole" : "credit", there = SAVED[r.slug + "|" + r.code + "|" + other];
    if (!there) return null;
    var o = {};
    for (var k in there) o[k] = there[k];
    o.moved = { from: other, to: b };
    return o;
  }
  function savesModel(rows) {
    var by = {};
    (rows || []).forEach(function (row) {
      var id = String(row.course_id || "");
      if (id.indexOf(SAVE_PREFIX) !== 0) return;
      var parts = id.slice(SAVE_PREFIX.length).split("|");
      if (parts.length < 3) return;
      var v;
      try { v = JSON.parse(row.value || "{}"); } catch (e) { return; }
      if (!v || typeof v !== "object") return;
      var slug = parts[0], band = parts[parts.length - 1], code = parts.slice(1, -1).join("|");
      by[slug + "|" + code + "|" + band] = { title: v.local_title || "", common: v.common_code || "", source: v.source_url || "",
        at: v.decided_at || row.reviewed_at || "", by: row.reviewer_email || "", label: row.reviewer_label || "",
        decidedBy: v.decided_by || "", key: id, mapKey: slug + "|" + code + "|" + band };
    });
    return by;
  }
  /* ── Move courses (Sam, 2026-11-22, r-subjects-move-courses-sam-2026-11-22): "the list of ELEC courses that at one
     point got defined as AED, which is an error. I have no way to fix that error on this screen or sidebar and need a
     simple way to do that for 1 or a groups of courses that need to be reassigned." A signed-in reviewer checks one
     course or a group in the panel, names the common subject code they belong under, and saves: one kb_curation row
     per course, field course_subject_decision, course_id CRS:<college>|<local code>|<course number>, value
     { common_code, from_mid, title, band }, under the reviewer's own email (governance DR-25). It records the person's
     decision; the M-ID itself moves by the re-mint playbook (docs/coursecontrolnumber_remint.md), which reads these. A
     course another person moved keeps that move (person-settled wins). ── */
  var MOVE_FIELD = "course_subject_decision", MOVE_PREFIX = "CRS:", MOVES = {}, MOVE_SAID = {};
  function moveKey(slug, code, number) { return MOVE_PREFIX + slug + "|" + code + "|" + number; }
  function movesModel(rows) {
    var by = {};
    (rows || []).forEach(function (row) {
      var id = String(row.course_id || "");
      if (id.indexOf(MOVE_PREFIX) !== 0) return;
      var v;
      try { v = JSON.parse(row.value || "{}"); } catch (e) { return; }
      if (!v || typeof v !== "object" || !v.common_code) return;
      by[id] = { common: String(v.common_code).toUpperCase(), fromMid: v.from_mid || "", title: v.title || "", at: v.decided_at || row.reviewed_at || "",
        by: row.reviewer_email || "", label: row.reviewer_label || "", decidedBy: v.decided_by || "", key: id };
    });
    return by;
  }
  function session() {
    var Sx = window.CPL_SESSION;
    if (!Sx || typeof Sx.get !== "function") return null;
    var s = Sx.get();
    return s && s.email && s.access_token && (typeof Sx.isFresh !== "function" || Sx.isFresh(s)) ? s : null;
  }
  /* Who may see the form: a fresh session, or one whose token lapsed and can renew (the save renews it first). */
  function reviewer() {
    var Sx = window.CPL_SESSION;
    if (!Sx || typeof Sx.get !== "function") return null;
    var s = Sx.get();
    return s && s.email && ((typeof Sx.isFresh !== "function" || Sx.isFresh(s)) || s.refresh_token) ? s : null;
  }
  /* kb_curation's reviewer emails answer a signed-in reviewer's token only (S614): signed out the read asks for
     reviewer_label, and a token the server refuses reads again signed out for this page and the pages after it. */
  function readSaves() { return readRows(SAVE_FIELD, SAVE_PREFIX).then(function (rows) { return rows === null ? null : savesModel(rows); }); }
  function readRows(field, prefix) {
    var Sx = window.CPL_SESSION;
    if (!Sx || typeof Sx.authHeaders !== "function") return Promise.resolve(null);
    var W = session() ? { cols: "reviewer_email,reviewer_label", tok: true } : { cols: "reviewer_label", tok: false };
    var rows = [];
    function page(from) {
      var h = Sx.authHeaders({ "Range-Unit": "items", Range: from + "-" + (from + PAGE - 1) });
      if (!W.tok) h.Authorization = "Bearer " + h.apikey;
      var url = REST + "/kb_curation?select=course_id,value,reviewed_at," + W.cols + "&field=eq." + field
        + "&course_id=like." + encodeURIComponent(prefix) + "*&order=course_id";
      return fetch(url, { headers: h }).then(function (r) {
        if (r && (r.status === 401 || r.status === 403) && W.tok) { W = { cols: "reviewer_label", tok: false }; return page(from); }
        if (!r || !r.ok) throw new Error("kb_curation answered " + (r ? r.status : "nothing"));
        return r.json().then(function (arr) {
          arr = Array.isArray(arr) ? arr : [];
          rows = rows.concat(arr);
          return arr.length === PAGE ? page(from + PAGE) : rows;
        });
      });
    }
    return page(0);
  }
  /* The session at the moment of the write: the keeper renews a token near expiry, and null means it has ended. */
  function freshReviewer() {
    var Sx = window.CPL_SESSION;
    var p = Sx && typeof Sx.ensureFresh === "function" ? Promise.resolve(Sx.ensureFresh()) : Promise.resolve(null);
    return p.then(function () { return session(); }, function () { return session(); });
  }
  function writeSave(key, value, field) {
    return freshReviewer().then(function (s) {
      if (!s) return { ok: false, lapsed: true };
      return fetch(REST + "/kb_curation?on_conflict=course_id,field", { method: "POST",
        headers: window.CPL_SESSION.authHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({ course_id: key, field: field || SAVE_FIELD, value: JSON.stringify(value), reviewer_email: s.email }) })
        .then(function (r) { return { ok: r.ok, status: r.status, lapsed: r.status === 401, email: s.email }; });
    });
  }
  /* The delete names the signed-in reviewer's email as well as the key: the table's delete policy lets any allowed
     reviewer delete any row, so the filter is what keeps one reviewer from removing another's save or a filed one. */
  function takeBack(key, field) {
    return freshReviewer().then(function (s) {
      if (!s) return { ok: false, lapsed: true };
      return fetch(REST + "/kb_curation?course_id=eq." + encodeURIComponent(key) + "&field=eq." + (field || SAVE_FIELD)
        + "&reviewer_email=eq." + encodeURIComponent(s.email) + "&select=course_id",
        { method: "DELETE", headers: window.CPL_SESSION.authHeaders({ Prefer: "return=representation" }) })
        .then(function (r) {
          if (!r.ok) return { ok: false, status: r.status, lapsed: r.status === 401 };
          return r.json().then(function (arr) { return { ok: true, n: Array.isArray(arr) ? arr.length : 0 }; }, function () { return { ok: true, n: 1 }; });
        });
    });
  }
  /* Title Case, the rule of kb/subject_title_case.py (r-subject-titles-title-case-sam-2026-11-21), with its word lists
     read from the titles file so the page holds no copy of them. */
  function isUpperWord(s) { return s !== s.toLowerCase() && s === s.toUpperCase(); }
  function hasUpper(s) { for (var i = 0; i < s.length; i++) { var ch = s.charAt(i); if (ch !== ch.toLowerCase() && ch === ch.toUpperCase()) return true; } return false; }
  var ROMAN = /^(?=[IVX])(X{0,3})(IX|IV|V?I{0,3})$/;
  function tcWord(w, first, coded) {
    var small = (TC && TC.small) || [], kept = (TC && TC.kept) || [];
    var core = w.replace(/^[()\[\],;:.–—]+/, "").replace(/[()\[\],;:.–—]+$/, "");
    if (!core) return w;
    var up = core.toUpperCase(), out;
    if (coded && ((isUpperWord(core) && core.length >= 2) || core === core.toLowerCase() && core !== core.toUpperCase())) out = core;   /* inside parentheses a code and a note word stay as printed */
    else if (kept.indexOf(up) >= 0 || (ROMAN.test(up) && up.length <= 4 && isUpperWord(core))) out = up;
    else if (small.indexOf(core.toLowerCase()) >= 0 && !first) out = core.toLowerCase();
    else if (/[-\/]/.test(core)) out = core.replace(/[^-\/]+/g, function (m) { return tcWord(m, true); });
    else if (!isUpperWord(core) && hasUpper(core.slice(1))) out = core;
    else out = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
    return w.replace(core, function () { return out; });
  }
  function titleCase(s) {
    if (!s || !String(s).trim()) return s;
    var out = [], depth = 0;
    String(s).trim().split(/\s+/).forEach(function (w, i) {
      var prev = out[i - 1] || "";
      /* A word in capitals inside parentheses is a subject code (Sam, 2026-11-23: "(formerly COTR)"); it keeps them. */
      out.push(tcWord(w, i === 0 || /[:–—]$/.test(prev) || prev === "-" || prev === "–" || prev === "—", depth > 0 || w.charAt(0) === "("));
      depth = Math.max(0, depth + (w.split("(").length - 1) - (w.split(")").length - 1));
    });
    return out.join(" ");
  }
  function filedRow(sv) { return (/@bot$/.test(sv.by || sv.label || "") || !!sv.fromFile) && !!sv.decidedBy; }
  /* The daily build honors a saved decision (kb/_sync_subject_decisions.py, #3655): a row the file took one for
     carries it in `decision`, with what the catalog and the map gave in decision.was. The live read stays the
     authority, so a row shows one line: a save the live read holds is that line; a save the file holds and the live
     read no longer does was taken back since the build, so the row reads the files' own values again; where no live
     read ran or it failed, the file's save shows in its place. */
  function revert(r) {
    var w = (r && r.decision && r.decision.was) || {};
    if (!r || !r.decision) return;
    ["printed_name", "common", "discipline", "title_state", "title_source", "common_source"].forEach(function (k) { r[k] = w[k] == null ? null : w[k]; });
    r.decision = null;
  }
  function whoOf(w) { return w && w !== "a reviewer" && !/@/.test(w) ? w : ""; }
  function reconcile(M, live) {
    ((M && M.list) || []).forEach(function (x) {
      x.rows.forEach(function (r) {
        /* The noncredit decisions the build carries, one per category: where no live read ran, they stand in its place. */
        if (!live) (r.noncredit_decisions || []).forEach(function (n) {
          if (String(n.key || "").indexOf(SAVE_PREFIX) !== 0) return;
          var nk = String(n.key).slice(SAVE_PREFIX.length);
          if (!SAVED[nk]) SAVED[nk] = { title: n.local_title || "", common: n.common_code || "", at: n.at || "", by: "", label: "",
            decidedBy: whoOf(n.who), key: n.key, mapKey: nk, fromFile: true };
        });
        var d = r.decision;
        if (!d || d.from !== "subject_decision" || String(d.key || "").indexOf(SAVE_PREFIX) !== 0) return;
        var mk = String(d.key).slice(SAVE_PREFIX.length);
        var tk = d.title_key && String(d.title_key).indexOf(SAVE_PREFIX) === 0 ? String(d.title_key).slice(SAVE_PREFIX.length) : "";
        if (SAVED[mk] && (!tk || SAVED[tk])) return;
        if (live) { revert(r); return; }
        var who = whoOf(d.who);
        SAVED[mk] = { title: d.title ? r.printed_name || "" : "", common: d.common ? r.common || "" : "", at: d.at || "",
          by: "", label: "", decidedBy: who, key: d.key, mapKey: mk, fromFile: true };
      });
    });
  }
  function mine(sv) {
    var s = reviewer();
    return !!(sv && sv.by && s && s.email && String(sv.by).toLowerCase() === String(s.email).toLowerCase());
  }
  function savedLine(sv) {
    var when = day(sv.at) ? ", " + day(sv.at) : "";
    var who = filedRow(sv) ? "Filed for " + sv.decidedBy + when + "."
      : "Saved by a person" + (sv.by && !/@bot$/.test(sv.by) ? ", " + sv.by : "") + when + ".";
    var words = who + (sv.moved ? " Saved under the " + sv.moved.from
      + " band; the code’s band is now " + sv.moved.to + ", so a new Save writes under " + sv.moved.to + "." : "");
    return el("span", { cls: "csb-sub csb-saved" }, [words, sv.source && isLink(sv.source) ? " " : null,
      sv.source && isLink(sv.source) ? el("a", { href: sv.source, target: "_blank", rel: "noopener", "data-saved": "source" }, ["Source"]) : null]);
  }

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "cls") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c != null && c !== false) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  function day(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
  }

  /* ── the model: the file's rows as objects, keyed by college ── */
  function model(f) {
    f = f || {};
    COMMON = f.common_codes || null; TC = f.title_case || null; NC_MQ = f.noncredit_mq || {}; NC_SLUGS = f.noncredit_slugs || {};
    var cols = f.columns || [], by = {}, list = [];
    (f.colleges || []).forEach(function (c) {
      var rows = (c.rows || []).map(function (r) {
        var o = {};
        cols.forEach(function (k, i) { o[k] = r[i]; });
        o.college = c.college; o.slug = c.slug;
        return o;
      });
      var x = { slug: c.slug, college: c.college, year: c.catalog_year || "", readAt: c.read_at || "", courses: c.courses,
        codes: c.catalog_codes, named: c.named, both: c.both, catalogOnly: c.catalog_only, stateOnly: c.state_only, rows: rows };
      by[c.slug] = x; list.push(x);
    });
    list.sort(function (a, b) { return a.college.localeCompare(b.college); });
    return { list: list, by: by, totals: f.totals || {}, rule: f._rule || "", built: (f._sources || {}).state_list_built_at || "" };
  }

  /* view: the surface, "" (every college), a college slug, "disagree", "held" or "noncredit"; code: the local code
     whose course panel is open; at: that code's college where the surface is not the college's own view (S702, Sam,
     2026-11-22: the panel and Edit open from every Subjects surface); band and pick: the visit's filters, never stored.
     The address carries the surface and the panel: <slug>/<code> on a college's view, <surface>/<slug>/<code> on the
     three lists, all/<slug>/<code> on the front list. */
  var S = { view: "", code: "", at: "", band: "", pick: "" };
  var ALL = "all";
  function address() {
    var base = S.view ? "commons/subjects/" + encodeURIComponent(S.view) : S.code ? "commons/subjects/" + ALL : "commons/subjects";
    if (S.code && S.at) base += "/" + encodeURIComponent(S.at);
    return S.code ? base + "/" + S.code.split("/").map(encodeURIComponent).join("/") : base;
  }
  /* The same pick as render reads it: the surface, then the panel's college and code. */
  function viewPath() {
    if (!S.code) return S.view;
    return (S.view || ALL) + (S.at ? "/" + S.at : "") + "/" + S.code;
  }
  function panelPath(slug, code) { return S.view === slug ? slug + "/" + code : (S.view || ALL) + "/" + slug + "/" + code; }
  /* The filters a count opens (CLAUDE.md, a figure card opens what it counts). */
  var PICKS = {
    both: ["in both the catalog and COCI", function (r) { return r.side === "both"; }],
    catalog: ["in the catalog only", function (r) { return r.side === "catalog"; }],
    state: ["in COCI only", function (r) { return r.side === "state"; }],
    incat: ["in the catalog", function (r) { return r.side !== "state"; }],
    titled: ["with a local title", function (r) { var sv = savedOf(r); return !needsTitle(r) || !!(sv && sv.title); }],
    common: ["with a common subject code", function (r) { var sv = savedOf(r); return !!r.common || !!(sv && sv.common); }],
    saved: ["settled by a person’s save", function (r) { return !!savedOf(r); }]
  };
  function inPick(r) { return !S.pick || !PICKS[S.pick] || PICKS[S.pick][1](r); }
  /* ── The figures a save moves at once (Sam, 2026-11-23: "when I make edits or decisions, they are immediately
     reflected in the numbers (going in the right direction) shown in the links"). Each figure is counted from the rows
     with the live saves on top, by the same test the list it opens applies, so a figure always equals its list and
     moves the moment a save lands or is taken back. With no save since the build it equals the file's own totals. ── */
  function untitledNow(r) { var sv = savedOf(r); return needsTitle(r) && !(sv && sv.title); }
  function figures(M) {
    var F = { named: 0, withCommon: 0, untitled: 0, notInCatalog: 0, notRead: 0, blocked: 0, saved: 0, colleges: 0, collegesNamed: 0, by: {} };
    ((M && M.list) || []).forEach(function (x) {
      var n = 0;
      x.rows.forEach(function (r) {
        if (PICKS.titled[1](r)) n++;
        if (PICKS.common[1](r)) F.withCommon++;
        if (savedOf(r)) F.saved++;
        if (untitledNow(r)) {
          F.untitled++;
          if (r.title_state === "not_in_catalog") F.notInCatalog++; else if (r.title_state === "blocked") F.blocked++; else F.notRead++;
        }
      });
      F.by[x.slug] = { named: n };
      F.named += n; F.colleges++; if (n) F.collegesNamed++;
    });
    return F;
  }
  /* The common subject codes people saved at each college, "<slug>|<CODE>" -> the save. `fresh` keeps only the saves
     the daily build has not carried yet (the titles file's decision names another value or none), which is what the
     held codes subtract: the build already released the courses of a decision it carried. */
  function commonSaves(M, fresh) {
    var out = {};
    ((M && M.list) || []).forEach(function (x) {
      x.rows.forEach(function (r) {
        var sv = savedOf(r);
        if (!sv || !sv.common) return;
        if (fresh) {
          if (sv.fromFile) return;
          var d = r.decision;
          if (d && d.key === sv.key && d.common && r.common === sv.common) return;
          if ((r.noncredit_decisions || []).some(function (n) { return n.key === SAVE_PREFIX + sv.mapKey && n.common_code === sv.common; })) return;
        }
        out[x.slug + "|" + String(r.code).toUpperCase()] = sv;
      });
    });
    return out;
  }
  function savedAt(map, slug, c) {
    if (!slug) return null;
    var names = [c.code, c.key].concat(c.spellings || []);
    for (var i = 0; i < names.length; i++) if (names[i] && map[slug + "|" + String(names[i]).toUpperCase()]) return map[slug + "|" + String(names[i]).toUpperCase()];
    return null;
  }
  /* The held courses a decision saved since the build releases, by the mint's own rule (kb/_pile_mint_dryrun.py route
     p): a common subject code saved at a college places that college's held credit courses with ordinary titles under
     the code. A shell title stays held whatever a person decides, and a statewide filing decides no M-ID, so neither
     moves the count. */
  var SHELL_HOLD = "shell_title_no_convention";
  function heldReleased(c, fresh, M) {
    var n = 0, at = [];
    (c.colleges || []).forEach(function (x) {
      if (!savedAt(fresh, slugOfName(x.college, M), c)) return;
      var k = (x.reasons || []).filter(function (r) { return r !== SHELL_HOLD; }).length;
      if (k) { n += k; at.push(x.college); }
    });
    return { n: n, at: at };
  }
  function heldNow(H, M) {
    M = M || VIEW.M;
    var fresh = commonSaves(M, true), out = { held: 0, codes: 0, released: 0, releasedCodes: 0, by: {} };
    ((H && H.codes) || []).forEach(function (c) {
      var rel = heldReleased(c, fresh, M);
      out.by[c.key] = rel;
      out.released += rel.n;
      var left = (c.held || 0) - rel.n;
      out.held += left;
      if (left > 0) out.codes++; else out.releasedCodes++;
    });
    return out;
  }
  /* A figure that opens the rows it counts: the surface (a college slug, or "" for every college) and the filter. */
  function count(n, slug, pick, label) {
    return el("button", { type: "button", cls: "csb-word csb-num", "data-csb-pick": pick, "data-csb-pick-at": slug, "aria-label": label, text: fmt(n) });
  }
  function go(href, text) { return el("a", { href: href, "data-csb-go": href.replace(/^#commons\/subjects\/?/, ""), text: text }); }

  function trail(here) {
    return el("p", { cls: "csb-trail" }, [el("a", { href: "#commons", text: "CPL Commons" }), " / ",
      here ? go("#commons/subjects", "Subjects") : "Subjects", here ? " / " + here : ""]);
  }

  /* The colleges, one row each: what its catalog prints and what it shares with the state list. */
  /* Sortable and resizable columns on every Subjects table (Sam, 2026-11-22, r-subjects-columns-sort-resize-sam-2026-11-22:
     "The columns on subjects tab need to be sortable and resizable--following our formatting norms for commons views";
     the Commons List's norms, commons_list.js). A header is a word that sorts (a second press reverses it); its right
     edge is a separator to drag, or to focus and move with the arrow keys (Home narrows to the least). The first resize
     fixes every column at its drawn width, so the table may grow wider and scroll inside its own box. A sort and the
     widths last the visit and are never stored. A table whose rows sit under category rows sorts within each category. */
  var GRID = {}, COL_MIN = 64, COL_STEP = 24;
  function cellValue(tr, i) {
    var c = tr.children[i];
    if (!c) return "";
    var v = c.getAttribute("data-sort");
    return v != null ? v : String(c.textContent || "").replace(/\s+/g, " ").trim();
  }
  function numOf(v) { var m = /^-?[\d,]+(\.\d+)?/.exec(String(v)); return m ? parseFloat(m[0].replace(/,/g, "")) : null; }
  function gridify(wrap, key, skip) {
    var tbl = wrap.querySelector("table"), head = tbl && tbl.querySelector("thead tr");
    var body = tbl && tbl.querySelector("tbody");
    if (!head || !body) return wrap;
    var G = GRID[key] || (GRID[key] = { col: -1, dir: 1, widths: null });
    var ths = Array.prototype.slice.call(head.children), cols = tbl.querySelectorAll("col");
    var data = function (tr) { return !tr.classList.contains("csb-nc-cat") && !(tr.children.length === 1 && tr.children[0].hasAttribute("colspan")); };
    function sortRows() {
      if (G.col < 0) return;
      var all = Array.prototype.slice.call(body.children), segs = [[]];
      all.forEach(function (tr) { if (!data(tr)) segs.push([tr]); else segs[segs.length - 1].push(tr); });
      var vals = all.filter(data).map(function (tr) { return cellValue(tr, G.col); }).filter(Boolean);
      var numeric = vals.length > 0 && vals.every(function (v) { return numOf(v) !== null; });
      segs.forEach(function (seg) {
        var lead = seg.length && !data(seg[0]) ? [seg[0]] : [], rest = seg.slice(lead.length);
        rest.sort(function (a, b) {
          var x = cellValue(a, G.col), y = cellValue(b, G.col);
          var d = numeric ? (numOf(x) || 0) - (numOf(y) || 0) : x.localeCompare(y, "en", { sensitivity: "base", numeric: true });
          return d * G.dir;
        });
        lead.concat(rest).forEach(function (tr) { body.appendChild(tr); });
      });
    }
    function fixWidths() {
      if (G.widths) return G.widths;
      G.widths = ths.map(function (th) { var w = th.getBoundingClientRect ? Math.round(th.getBoundingClientRect().width) : 0; return w > 0 ? w : 140; });
      return G.widths;
    }
    function applyWidths() {
      if (!G.widths) return;
      G.widths.forEach(function (w, i) { if (cols[i]) cols[i].style.width = w + "px"; });
      tbl.style.width = G.widths.reduce(function (a, x) { return a + x; }, 0) + "px";
      tbl.style.minWidth = "0";
    }
    function setWidth(i, w, g) {
      var W = fixWidths();
      W[i] = Math.max(COL_MIN, Math.round(w));
      applyWidths();
      if (g) g.setAttribute("aria-valuenow", String(W[i]));
    }
    var labels = ths.map(function (th) { return String(th.textContent || "").trim(); }), buttons = [];
    function heads() {
      buttons.forEach(function (b, i) {
        if (!b) return;
        var on = G.col === i, words = numeric0(i) ? (G.dir > 0 ? ", low to high" : ", high to low") : (G.dir > 0 ? ", A to Z" : ", Z to A");
        b.textContent = labels[i] + (on ? words : "");
        ths[i].setAttribute("aria-sort", on ? (G.dir > 0 ? "ascending" : "descending") : "none");
      });
    }
    ths.forEach(function (th, i) {
      var label = labels[i];
      th.classList.add("csb-th");
      if (!(skip && skip.indexOf(i) >= 0)) {
        var b = el("button", { type: "button", cls: "csb-sort", "data-csb-sort": String(i), title: "Press to sort by this column; press again to reverse it", text: label });
        b.addEventListener("click", function () {
          if (G.col === i) G.dir = -G.dir; else { G.col = i; G.dir = 1; }
          sortRows(); heads(); b.focus();
        });
        th.textContent = "";
        th.appendChild(b);
        buttons[i] = b;
      }
      var g = el("span", { cls: "csb-grip", role: "separator", tabindex: "0", "aria-orientation": "vertical", "aria-label": "Resize " + label,
        "aria-valuemin": String(COL_MIN), "aria-valuemax": "1600", "aria-valuenow": String(G.widths ? G.widths[i] : 140) });
      g.addEventListener("keydown", function (e) {
        var W = fixWidths();
        if (e.key === "ArrowRight") setWidth(i, W[i] + COL_STEP, g);
        else if (e.key === "ArrowLeft") setWidth(i, W[i] - COL_STEP, g);
        else if (e.key === "Home") setWidth(i, COL_MIN, g);
        else return;
        e.preventDefault(); e.stopPropagation();
      });
      g.addEventListener("pointerdown", function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        var startX = e.clientX, startW = fixWidths()[i];
        try { g.setPointerCapture(e.pointerId); } catch (err) { /* an older engine */ }
        function move(ev) { if (ev.pointerId === e.pointerId) setWidth(i, startW + (ev.clientX - startX), g); }
        function up(ev) {
          if (ev && ev.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
          g.removeEventListener("pointermove", move); document.removeEventListener("pointermove", move);
          ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { g.removeEventListener(t, up); document.removeEventListener(t, up); });
        }
        g.addEventListener("pointermove", move); document.addEventListener("pointermove", move);
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { g.addEventListener(t, up); document.addEventListener(t, up); });
      });
      g.addEventListener("click", function (e) { e.stopPropagation(); });
      th.appendChild(g);
    });
    function numeric0(i) {
      var v = Array.prototype.filter.call(body.children, data).map(function (tr) { return cellValue(tr, i); }).filter(Boolean);
      return v.length > 0 && v.every(function (x) { return numOf(x) !== null; });
    }
    sortRows();
    heads();
    applyWidths();
    return wrap;
  }
  function collegeTable(M, list) {
    var F = figures(M);
    var tbl = el("table", { cls: "csb-table" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col"), el("col"), el("col"), el("col"), el("col")]),
      el("thead", null, [el("tr", null, ["College", "Subject codes in the catalog", "Local titles", "Both", "Catalog only", "COCI only"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, list.map(function (c) {
        var named = (F.by[c.slug] || {}).named || 0;
        return el("tr", { "data-college": c.slug }, [el("th", { scope: "row" }, [S.view === c.slug ? c.college : go("#commons/subjects/" + c.slug, c.college)]),
          el("td", null, [count(c.codes, c.slug, "incat", fmt(c.codes) + " subject codes in the catalog at " + c.college + ". Show them.")]),
          named ? el("td", null, [count(named, c.slug, "titled", fmt(named) + " codes with a local title at " + c.college + ". Show them."), " of " + fmt(c.rows.length) + " codes"])
            : el("td", { cls: "csb-tba", text: "TBA" }),
          el("td", null, [count(c.both, c.slug, "both", fmt(c.both) + " codes in both the catalog and COCI at " + c.college + ". Show them.")]),
          el("td", null, [count(c.catalogOnly, c.slug, "catalog", fmt(c.catalogOnly) + " codes in the catalog only at " + c.college + ". Show them.")]),
          el("td", null, [count(c.stateOnly, c.slug, "state", fmt(c.stateOnly) + " codes in COCI only at " + c.college + ". Show them.")])]);
      }))]);
    return gridify(el("div", { cls: "csb-wrap", role: "region", "aria-label": "Colleges with a catalog on file", tabindex: "0" }, [tbl]), "colleges");
  }

  /* The codes, one row each: college, local code, printed name (the draft title), common code, courses, side. */
  function codeTable(rows, label) {
    var tbl = el("table", { cls: "csb-table csb-codes" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col"), el("col", { cls: "csb-c-wide" }), el("col"), el("col"), el("col"), el("col", { cls: "csb-c-act" })]),
      el("thead", null, [el("tr", null, ["College", "Local code", "Local Title", "Common subject code", "Courses", "Source", "Settle"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, rows.length ? rows.map(function (r) {
        var heads = r.side === "state" ? fmt(r.state_courses) + " in COCI" + bands(r)
          : fmt(r.catalog_courses) + (r.side === "both" ? " in the catalog, " + fmt(r.state_courses) + " in COCI" + bands(r) : "")
            + (r.address && !r.catalog_courses ? (r.page_codes && r.page_codes.length ? "; its page prints its courses under " + r.page_codes.join(" and ") : "; its page is not read yet") : "");
        var sv = savedOf(r);
        var st = needsTitle(r) && !(sv && sv.title) ? stateOf(r) : null;
        var title = sv && sv.title ? el("td", { "data-saved": "title" }, [sv.title, " ", savedLine(sv)])
          : st ? el("td", { cls: "csb-tba" }, [
          el("span", { cls: "csb-chip", role: "note", tabindex: "0", "data-state": r.title_state || "not_read", "aria-label": st.word + ". " + st.tip, title: st.tip, text: st.word }),
          r.candidate ? el("span", { cls: "csb-sub", text: "A line near it in the catalog: " + r.candidate }) : null,
          recOf(r).title ? recNote("title", recOf(r).title.title, recOf(r).title) : null])
          : el("td", { text: r.printed_name });
        return el("tr", { "data-code": r.code, "data-side": r.side, "data-title-state": r.title_state || null, "data-saved": sv ? "yes" : null }, [
          el("td", null, [S.view === r.slug ? r.college : go("#commons/subjects/" + r.slug, r.college)]),
          el("th", { scope: "row" }, [codeWord(r)]),
          title,
          sv && sv.common ? el("td", { "data-saved": "common" }, [sv.common + (COMMON && COMMON[sv.common] ? " " + COMMON[sv.common] : ""), " ", savedLine(sv)])
          : el("td", null, [r.common ? r.common + (r.discipline ? " " + r.discipline : "") : "",
            r.common_source === "statewide_filing" ? " " : null,
            r.common_source === "statewide_filing" ? el("span", { cls: "csb-sub csb-saved", text: "Filed statewide by a person in the Local subjects List." }) : null,
            !r.common && recOf(r).common ? recNote("common", recOf(r).common.code + " " + recOf(r).common.discipline, recOf(r).common) : null]),
          el("td", null, [el("button", { type: "button", cls: "csb-word csb-num", "data-csb-code": r.code, "data-csb-slug": r.slug,
            "aria-label": "Courses under " + r.code + " at " + r.college + ": " + heads + ". Show them.", text: heads }), categoryLine(r)]),
          el("td", { text: st && r.title_state === "not_read" ? st.word : SIDES[r.side] || r.side }),
          el("td", null, [el("button", { type: "button", cls: "csb-word", "data-csb-code": r.code, "data-csb-slug": r.slug, "data-csb-edit": "yes",
            "aria-label": "Edit " + r.code + " at " + r.college, text: "Edit" })])]);
      }) : [el("tr", null, [el("td", { colspan: "7", text: "No code is in this list." })])])]);
    return gridify(el("div", { cls: "csb-wrap", role: "region", "aria-label": label, tabindex: "0" }, [tbl]), "codes", [6]);
  }

  /* ── the held codes (S695): one row per local subject code, ranked by the held courses it releases ── */
  function heldModel(f) {
    f = f || {};
    var codes = (f.codes || []).slice().sort(function (a, b) { return (b.held || 0) - (a.held || 0) || String(a.key).localeCompare(String(b.key)); });
    return { codes: codes, totals: f.totals || {}, floors: f.floors || {}, rule: f._rule || "", plan: (f._sources || {}).plan_date || "" };
  }
  function pct(v) { return v == null ? "" : Math.round(v * 100) + "%"; }
  function voteLine(v) {
    if (!v || !v.votes) return v && v.missed ? v.missed + "." : "";
    return (v.winner ? v.winner + " won " : "No winner: ") + fmt(v.votes) + (v.votes === 1 ? " vote" : " votes") + (v.share != null ? ", " + pct(v.share) + " share" : "") + "; " + v.missed + ".";
  }
  function evidence(c) {
    var out = [];
    var sm = c.subject_map || {}, notes = Object.keys(sm.notes || {});
    out.push(el("p", null, [el("strong", { text: "Subject map: " }), sm.reads ? "reads " + sm.reads + ". " : "has no entry. ",
      notes.filter(function (n) { return n !== "no route reaches its floor"; }).join(" ")]));
    if (c.suggestion) out.push(el("p", { cls: "csb-sug" }, [el("strong", { text: "Suggestion, not a decision: " }),
      c.suggestion.subj4 + ", from the " + c.suggestion.from + " (" + fmt(c.suggestion.votes) + (c.suggestion.votes === 1 ? " vote" : " votes") + ", " + pct(c.suggestion.share) + " share)."]));
    out.push(el("p", null, [el("strong", { text: "Statewide vote: " }), voteLine(c.statewide_vote)]));
    var voted = (c.colleges || []).filter(function (x) { return x.college_vote && x.college_vote.votes; });
    if (voted.length) out.push(el("p", null, [el("strong", { text: "College votes: " }), voted.map(function (x) { return x.college + ", " + voteLine(x.college_vote); }).join(" ")]));
    if ((c.near_entries || []).length) out.push(el("p", null, [el("strong", { text: "Near entries in the subject map: " }),
      c.near_entries.map(function (n) { return n.key + " (" + n.discipline + ")"; }).join(", ") + "."]));
    return out;
  }
  function heldTable(H) {
    var HN = heldNow(H);
    var tbl = el("table", { cls: "csb-table csb-held" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-code" }), el("col", { cls: "csb-c-num" }), el("col", { cls: "csb-c-mid" }), el("col", { cls: "csb-c-mid" }), el("col", { cls: "csb-c-ev" })]),
      el("thead", null, [el("tr", null, ["Local code", "Held courses it releases", "Colleges using it", "Example held courses", "Evidence that fell short"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, H.codes.length ? H.codes.map(function (c) {
        var rel = HN.by[c.key] || { n: 0, at: [] }, left = (c.held || 0) - rel.n;
        return el("tr", { "data-code": c.key, "data-held": String(left) }, [
          el("th", { scope: "row" }, [c.code, (c.printed_names || []).length ? el("span", { cls: "csb-sub", text: c.printed_names.join("; ") }) : null]),
          el("td", null, [fmt(left), rel.n ? el("span", { cls: "csb-sub csb-saved", text: fmt(rel.n) + " released at " + rel.at.join(", ") + " by a save since the build." }) : null]),
          el("td", null, sep((c.colleges || []).map(function (x) { return codeAt(slugOfName(x.college), c.code, x.college + " " + fmt(x.held)); }))),
          el("td", { text: (c.examples || []).map(function (x) { return x.title + " (" + x.college + ")"; }).join("; ") }),
          el("td", { cls: "csb-ev" }, evidence(c))]);
      }) : [el("tr", null, [el("td", { colspan: "5", text: "The pile mint holds no course for want of a common subject code." })])])]);
    return gridify(el("div", { cls: "csb-wrap", role: "region", "aria-label": "Local subject codes the M-ID mint holds on", tabindex: "0" }, [tbl]), "held", [4]);
  }
  function ncTable(N) {
    var names = {};
    (N.programs || []).forEach(function (p) { names[p.slug] = p.college; });
    var rows = [], last = null;
    (N.titles || []).forEach(function (t) {
      var cat = t.category || "No noncredit course in COCI";
      if (cat !== last) {
        var m = (N.mq || {})[t.category] || {};
        rows.push(el("tr", { cls: "csb-nc-cat", "data-category": cat }, [el("th", { scope: "colgroup", colspan: "5" }, [cat,
          el("span", { cls: "csb-sub", text: !t.category ? "The export lists no noncredit course under these codes, so no category is counted."
            : m.common_code ? "Noncredit MQ discipline: " + m.mq_discipline + ". Common subject code " + m.common_code + "."
            : m.mq_discipline ? "Noncredit MQ discipline: " + m.mq_discipline + ". No common subject code yet." : "No noncredit MQ discipline is named for this category, and no common subject code yet." })])]));
        last = cat;
      }
      var where = sep((t.members || []).map(function (x) { return codeAt(x.college, x.code, (names[x.college] || x.college) + " " + x.code); }));
      var share = t.category_share == null ? "" : Math.round(t.category_share * 100) + "% of its noncredit courses";
      var others = (t.categories || []).slice(1).map(function (c) { return c[0] + " " + fmt(c[1]); }).join("; ");
      rows.push(el("tr", { "data-title": t.title, "data-state": t.state }, [
        el("th", { scope: "row" }, [t.title, (t.printed_as || []).length > 1 || (t.printed_as || [])[0] !== t.title
          ? el("span", { cls: "csb-sub", text: "Printed as: " + (t.printed_as || []).join("; ") }) : null]),
        el("td", { text: fmt(t.programs) + " of " + fmt((N.programs || []).length) }),
        el("td", null, where),
        el("td", { text: fmt(t.catalog_courses) }),
        el("td", null, [t.category ? share : "", t.state === "several categories" && others ? el("span", { cls: "csb-sub", text: "Also under: " + others }) : null])]));
    });
    var tbl = el("table", { cls: "csb-table csb-nc" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col", { cls: "csb-c-num" }), el("col"), el("col", { cls: "csb-c-num" }), el("col", { cls: "csb-c-mid" })]),
      el("thead", null, [el("tr", null, ["Noncredit subject title", "Programs", "Where it is printed", "Courses in the catalogs", "Share under this category"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, rows.length ? rows : [el("tr", null, [el("td", { colspan: "5", text: "No heading is filed yet." })])])]);
    return gridify(el("div", { cls: "csb-wrap", role: "region", "aria-label": "Noncredit subject titles by category", tabindex: "0" }, [tbl]), "noncredit");
  }
  var ncCache = null;
  function loadNc() {
    ncCache = ncCache || fetch(NC_FILE, { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(NC_FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(null, function (e) { ncCache = null; throw e; });
    return ncCache;
  }
  var heldCache = null;
  function loadHeld() {
    heldCache = heldCache || fetch(HELD_FILE, { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(HELD_FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(heldModel, function (e) { heldCache = null; throw e; });
    return heldCache;
  }

  /* ── every local code statewide (S712) ── */
  var SWS = { filter: "top", q: "", shown: 200, saved: null, readErr: "", msg: "", bulk: false, busy: false };
  var SW_FILTERS = [
    ["top", "Calls at 90% or better", function (c) { return canFile(c) && !filedOf(c) && c.recommend.confidence >= 0.9; }],
    ["all", "All", function () { return true; }],
    ["confirm", "Draft and peers agree", function (c) { return c["class"] === "confirm"; }],
    ["draft_differs", "Draft differs from peers", function (c) { return c["class"] === "draft_differs"; }],
    ["draft_broad", "Broad drafts", function (c) { return c["class"] === "draft_broad"; }],
    ["peers", "Peers agree, no draft", function (c) { return c["class"] === "peers"; }],
    ["peers_split", "Peers split", function (c) { return c["class"] === "peers_split"; }],
    ["named_code", "Titles name another code", function (c) { return c["class"] === "named_code"; }],
    ["titles", "From course titles", function (c) { return c["class"] === "titles"; }],
    ["look", "No evidence", function (c) { return c["class"] === "look"; }],
    ["noncredit", "Noncredit, by category", function (c) { return c["class"] === "noncredit"; }],
    ["one", "One college", function (c) { return (c.colleges || []).length === 1; }],
    ["settled", "Filed by a person", function (c) { return !!filedOf(c); }]];
  function swModel(f) {
    f = f || {};
    var disc = {};
    (f.common_codes || []).forEach(function (p) { disc[p[0]] = p[1]; });
    return { codes: f.codes || [], totals: f.totals || {}, rule: f._rule || "", recall: f.self_recall || [], disc: disc, pairs: f.common_codes || [] };
  }
  var swCache = null;
  function loadStatewide() {
    swCache = swCache || fetch(SW_FILE, { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(SW_FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(swModel, function (e) { swCache = null; throw e; });
    /* The filings people made since the last nightly: read live, so a save shows at once on the next visit too. */
    return swCache.then(function (W) {
      return readRows(SW_FIELD, SW_PREFIX).then(function (rows) {
        SWS.saved = {};
        (rows || []).forEach(function (r) {
          var k = String(r.course_id || "").slice(SW_PREFIX.length);
          if (k) SWS.saved[k] = { discipline: String(r.value || ""), by: r.reviewer_email || r.reviewer_label || "a reviewer", at: r.reviewed_at };
        });
        SWS.readErr = "";
        return W;
      }, function (e) { SWS.saved = {}; SWS.readErr = e && e.message ? e.message : String(e); return W; });
    });
  }
  /* A credit call files statewide; a noncredit code is settled by its COCI category at each college. */
  function canFile(c) { return c["class"] !== "noncredit" && !!(c.recommend && c.recommend.discipline); }
  function filedOf(c) {
    var live = SWS.saved && SWS.saved[c.code];
    if (live) return live;
    return c.filing ? { discipline: c.filing.discipline, by: c.filing.who || "a reviewer", at: c.filing.at } : null;
  }
  /* The four levels Sam's ruling measures by (r-confidence-not-person-settled-sam-2026-11-23): a call is settled when it
     is Confident, whether the data took it there or a person's confirm did. */
  function levelOf(v) { return v >= 0.9 ? "Confident" : v >= 0.75 ? "Likely" : v >= 0.5 ? "Leaning" : "Unsure"; }
  /* The levels by college-and-code pair, by course and by code, with the live filings and saves on top: one count for
     the statewide view and the Commons card. A pair is Confident when a person filed the code statewide or saved a
     common subject code at that college, so a Confirm or a college's Save moves it at once. */
  var LEVELS = ["Confident", "Likely", "Leaning", "Unsure"];
  function levels(W, M) {
    M = M || VIEW.M;
    var L = { pairs: {}, courses: {}, codes: {}, totalPairs: 0, totalCourses: 0 };
    LEVELS.forEach(function (k) { L.pairs[k] = 0; L.courses[k] = 0; L.codes[k] = 0; });
    var saves = commonSaves(M, false), slugs = {};
    ((M && M.list) || []).forEach(function (x) { slugs[x.college] = x.slug; });
    ((W && W.codes) || []).forEach(function (c) {
      var base = filedOf(c) ? "Confident" : levelOf((c.recommend || {}).confidence || 0);
      L.codes[base]++;
      (c.colleges || []).forEach(function (x) {
        var k = base === "Confident" || savedAt(saves, slugs[x[0]], c) ? "Confident" : base, n = x[1] || 0;
        L.pairs[k]++; L.courses[k] += n; L.totalPairs++; L.totalCourses += n;
      });
    });
    return L;
  }
  function confWords(v) { var n = Math.round((v || 0) * 100); return (n < 1 ? "under 1" : String(n)) + "% " + levelOf(v || 0); }
  function swRows(W) {
    var F = SW_FILTERS.filter(function (f) { return f[0] === SWS.filter; })[0] || SW_FILTERS[0];
    var q = SWS.q.trim().toLowerCase();
    return W.codes.filter(F[2]).filter(function (c) {
      if (!q) return true;
      return (c.code + " " + (c.spellings || []).join(" ") + " " + (c.titles || []).join(" ") + " " + (c.colleges || []).map(function (x) { return x[0]; }).join(" ")).toLowerCase().indexOf(q) >= 0;
    });
  }
  function fileRows(items) {
    /* One request a batch of 200: each row a person's statewide filing, merged on its key. */
    return freshReviewer().then(function (sx) {
      if (!sx) return { ok: false, lapsed: true, n: 0 };
      var done = 0;
      function batch(i) {
        if (i >= items.length) return Promise.resolve({ ok: true, n: done, email: sx.email });
        var part = items.slice(i, i + 200).map(function (it) {
          return { course_id: SW_PREFIX + it.code, field: SW_FIELD, value: it.discipline, reviewer_email: sx.email };
        });
        return fetch(REST + "/kb_curation?on_conflict=course_id,field", { method: "POST",
          headers: window.CPL_SESSION.authHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
          body: JSON.stringify(part) }).then(function (r) {
          if (!r.ok) return { ok: false, status: r.status, lapsed: r.status === 401, n: done };
          part.forEach(function (p) { SWS.saved[p.course_id.slice(SW_PREFIX.length)] = { discipline: p.value, by: sx.email, at: new Date().toISOString() }; });
          done += part.length;
          return batch(i + 200);
        });
      }
      return batch(0);
    });
  }
  function swRedraw(focusId) {
    if (VIEW.root && VIEW.M && S.view === SW) render(VIEW.root, VIEW.M, SW);
    var f = focusId && VIEW.root && VIEW.root.querySelector("#" + focusId);
    if (f && f.focus) f.focus();
  }
  function swSave(items, focusId) {
    SWS.busy = true; SWS.msg = "Saving " + fmt(items.length) + (items.length === 1 ? " filing" : " filings") + "…"; swRedraw();
    return fileRows(items).then(function (res) {
      SWS.busy = false; SWS.bulk = false;
      SWS.msg = res.ok ? "Saved " + fmt(res.n) + (res.n === 1 ? " statewide filing" : " statewide filings") + " under your name. The daily build carries them to every college."
        : res.lapsed ? "Your sign-in lapsed; sign in again to save. " + (res.n ? fmt(res.n) + " were saved before it lapsed." : "Nothing was saved.")
        : "The save did not reach the table (" + (res.status || "no answer") + "). " + (res.n ? fmt(res.n) + " were saved before it stopped." : "Nothing was saved.");
      swRedraw(focusId);
    }, function () { SWS.busy = false; SWS.msg = "The save did not reach the table (network). Nothing more was saved."; swRedraw(focusId); });
  }
  function swActions(W, c, signed) {
    var filed = filedOf(c);
    var cell = [];
    if (filed) cell.push(el("span", { cls: "csb-saved", text: "Filed under " + filed.discipline + (filed.at ? ", " + day(filed.at) : "") + "." }));
    if (!canFile(c)) {
      var read = (c.colleges || []).map(function (x) { return { name: x[0], slug: slugOfName(x[0]) }; }).filter(function (x) { return VIEW.M && VIEW.M.by[x.slug]; });
      cell.push(el("span", { cls: "csb-sub", text: c["class"] === "noncredit" ? "Settled by its noncredit category at each college." : "No common code to file." }));
      if (read.length) cell.push(el("span", { cls: "csb-sub" }, ["Open at "].concat(sep(read.slice(0, 3).map(function (x) { return codeAt(x.slug, (c.spellings || [c.code])[0], x.name); })))));
      return cell;
    }
    if (!signed) return cell;
    var id = "csw-" + c.code.replace(/[^A-Za-z0-9]/g, "_");
    if (!filed || filed.discipline !== c.recommend.discipline) {
      var ok = el("button", { type: "button", cls: "csb-word", id: id + "-ok", disabled: SWS.busy ? "" : null, text: "Confirm " + c.recommend.common });
      ok.addEventListener("click", function () { swSave([{ code: c.code, discipline: c.recommend.discipline }], id + "-ok"); });
      cell.push(ok);
    }
    var pick = el("select", { id: id + "-pick", "aria-label": "Another common code for " + c.code }, [el("option", { value: "", text: "Another code…" })]
      .concat(W.pairs.map(function (p) { return el("option", { value: p[1], text: p[0] + ", " + p[1] }); })));
    var other = el("button", { type: "button", cls: "csb-word", id: id + "-other", disabled: SWS.busy ? "" : null, text: "Save that code" });
    other.addEventListener("click", function () {
      if (!pick.value) { pick.focus(); return; }
      swSave([{ code: c.code, discipline: pick.value }], id + "-other");
    });
    cell.push(el("span", { cls: "csw-change" }, [pick, " ", other]));
    return cell;
  }
  var srcCache = null;
  function loadSources() {
    srcCache = srcCache || fetch(SRC_FILE, { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(SRC_FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(null, function (e) { srcCache = null; throw e; });
    return srcCache;
  }
  /* A status word, plain text: Read carries weight, the ways with nothing to do are muted, so it reads the same without color. */
  function srcCell(R, w) {
    var st = w || { status: "to_try" }, word = (R.status_words || {})[st.status] || st.status;
    var quiet = st.status === "to_try" || st.status === "not_needed" || st.status === "no_system";
    var title = [st.note, st.date ? "(" + st.date + ")" : ""].filter(Boolean).join(" ");
    return el("td", { cls: quiet ? "csb-tba" : st.status === "read" ? "csb-src-read" : "csb-src-on", title: title || null }, [word]);
  }
  function sourcesView(R, F) {
    var box = el("div", { cls: "csb-src" });
    var ways = R.ways || [], T = R.totals || {}, BW = T.by_way || {};
    var line = ways.map(function (w) {
      var b = BW[w[0]] || {}, bits = [];
      ["read", "probing", "blocked", "to_try"].forEach(function (k) { if (b[k]) bits.push((R.status_words[k] || k).toLowerCase() + " " + fmt(b[k])); });
      return w[1] + " " + (bits.join(", ") || "none");
    }).join(" · ");
    box.appendChild(el("p", { cls: "csb-note", id: "csb-src-sum" }, ["Each college’s own subject titles, and each way we look for them, in the order we try them. ",
      el("strong", { text: fmt(T.titled) + " of " + fmt(T.colleges) }), " colleges have a catalog read; " + fmt(T.titles_needed) + " still need titles. " + line
      + ". COCI and the MIS reports carry no subject names, so neither is a way to look."]));
    var chips = el("p", { cls: "csb-bands", role: "group", "aria-label": "Show" }, SRC_PICKS.map(function (f) {
      var n = (R.colleges || []).filter(f[2]).length;
      var b = el("button", { type: "button", cls: "csb-word", id: "csb-src-f-" + f[0], "aria-pressed": SRCS.pick === f[0] ? "true" : "false", text: f[1] + " (" + fmt(n) + ")" });
      b.addEventListener("click", function () {
        SRCS.pick = f[0];
        render(VIEW.root, VIEW.M, SRC);
        var on = VIEW.root.querySelector("#csb-src-f-" + f[0]); if (on && on.focus) on.focus();
      });
      return b;
    }));
    box.appendChild(chips);
    var pick = SRC_PICKS.filter(function (f) { return f[0] === SRCS.pick; })[0] || SRC_PICKS[2];
    var list = (R.colleges || []).filter(pick[2]);
    var tbl = el("table", { cls: "csb-table" }, [
      el("colgroup", null, [el("col", { cls: "csb-src-c-college" }), el("col", { cls: "csb-src-c-plat" }), el("col", { cls: "csb-src-c-n" }), el("col", { cls: "csb-src-c-n" })]
        .concat(ways.map(function () { return el("col", { cls: "csb-src-c-way" }); })).concat([el("col", { cls: "csb-src-c-next" })])),
      el("thead", null, [el("tr", null, ["College", "Catalog platform", "Codes", "Titled"].concat(ways.map(function (w) { return w[1]; })).concat(["Next"])
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, list.length ? list.map(function (r) {
        var on = VIEW.M && VIEW.M.by[r.slug];
        var titled = on ? ((F.by[r.slug] || {}).named || 0) : r.titled;   /* live saves on top, as the college's own view counts */
        return el("tr", { "data-college": r.slug }, [el("th", { scope: "row" }, [on ? go("#commons/subjects/" + r.slug, r.college) : r.college]),
          el("td", { text: r.platform_words }), el("td", { text: fmt(r.codes) }), el("td", { text: fmt(titled) })]
          .concat(ways.map(function (w) { return srcCell(R, (r.ways || {})[w[0]]); }))
          .concat([el("td", { text: r.next })]));
      }) : [el("tr", null, [el("td", { colspan: String(5 + ways.length), text: "No college in this list." })])])]);
    box.appendChild(gridify(el("div", { cls: "csb-wrap", role: "region", "aria-label": "Colleges by source", tabindex: "0" }, [tbl]), "sources"));
    box.appendChild(el("p", { cls: "csb-note", text: "A college with a catalog on file opens its codes, each with its title and common code. A status word’s note and date show when you point at it. "
      + "Each attempt the catalog read cannot show, such as a probe sent, a way blocked or a read by hand, is recorded with its date." }));
    return box;
  }
  function statewideView(W) {
    var T = W.totals, signed = !!reviewer();
    var box = el("div", { cls: "csw" });
    var top = W.recall[0] || {};
    box.appendChild(el("p", { cls: "csb-note", id: "csw-sum" }, [el("strong", { text: fmt(T.codes) }), " local subject codes at ", el("strong", { text: fmt(T.colleges) }),
      " colleges (" + fmt(T.pairs) + " college-and-code pairs, " + fmt(T.courses) + " COCI courses); " + fmt(T.one_college) + " are used at one college. "
      + "Every code carries a call and a confidence from the evidence the list names: the subject map’s draft, the M-IDs its courses joined at three or more colleges, its course titles, and a noncredit code’s COCI category. "
      + (top.tried ? "On " + fmt(top.tried) + " codes whose peers already agree, calls at 90% or better were right " + Math.round((top.accuracy || 0) * 100) + "% of the time. " : "")
      + "A confirm is your statewide filing for the code; the daily build carries it to every college that uses it."]));
    if (SWS.readErr) box.appendChild(el("p", { cls: "csb-note", role: "status", text: "The filings people made could not be read live (" + SWS.readErr + "); the list shows the filings the daily build carried." }));
    var lv = levels(W).pairs;
    box.appendChild(el("p", { cls: "csb-note", id: "csw-levels" }, ["College-and-code pairs by level: ",
      ["Confident", "Likely", "Leaning", "Unsure"].map(function (k) { return k + " " + fmt(lv[k]); }).join(" · "),
      ". Confident is 90% or more, Likely 75 to 90%, Leaning 50 to 75%, Unsure under 50%. A confirm raises a call to Confident."]));
    var chips = el("p", { cls: "csw-chips", role: "group", "aria-label": "Show" }, SW_FILTERS.map(function (f) {
      var n = W.codes.filter(f[2]).length;
      var b = el("button", { type: "button", cls: "csb-word", "data-csw-filter": f[0], "aria-pressed": SWS.filter === f[0] ? "true" : "false", text: f[1] + " (" + fmt(n) + ")" });
      b.addEventListener("click", function () { SWS.filter = f[0]; SWS.shown = 200; SWS.bulk = false; swRedraw("csw-f-" + f[0]); });
      b.id = "csw-f-" + f[0];
      return b;
    }));
    box.appendChild(chips);
    var search = el("input", { type: "search", id: "csw-q", value: SWS.q, "aria-label": "Find a code, a course title or a college", placeholder: "Find a code, a course title or a college" });
    search.addEventListener("change", function () { SWS.q = search.value; SWS.shown = 200; swRedraw("csw-q"); });
    box.appendChild(el("p", null, [el("label", { "for": "csw-q", cls: "csb-sub", text: "Find " }), search]));
    var rows = swRows(W);
    var bulkable = rows.filter(function (c) { return canFile(c) && !filedOf(c) && c.recommend.confidence >= 0.9; });
    if (!signed) box.appendChild(el("p", { cls: "csb-note", text: "Sign in as a reviewer to confirm a call or file another code." }));
    else if (bulkable.length) {
      if (!SWS.bulk) {
        var bulk = el("button", { type: "button", cls: "csb-word", id: "csw-bulk", disabled: SWS.busy ? "" : null, text: "Confirm the " + fmt(bulkable.length) + " calls shown at 90% or better" });
        bulk.addEventListener("click", function () { SWS.bulk = true; swRedraw("csw-bulk-yes"); });
        box.appendChild(el("p", null, [bulk]));
      } else {
        var yes = el("button", { type: "button", cls: "csb-word", id: "csw-bulk-yes", text: "Save " + fmt(bulkable.length) + " filings" });
        var no = el("button", { type: "button", cls: "csb-word", id: "csw-bulk-no", text: "Cancel" });
        yes.addEventListener("click", function () { swSave(bulkable.map(function (c) { return { code: c.code, discipline: c.recommend.discipline }; }), "csw-sum"); });
        no.addEventListener("click", function () { SWS.bulk = false; swRedraw("csw-bulk"); });
        box.appendChild(el("p", { cls: "csb-note", id: "csw-bulk-ask", role: "group", "aria-label": "Confirm the calls" }, [
          "Save " + fmt(bulkable.length) + " statewide filings under your name, each code under its call? Any one can be changed later from its row. ", yes, " ", no]));
      }
    }
    if (SWS.msg) box.appendChild(el("p", { cls: "csb-note", id: "csw-msg", role: "status", text: SWS.msg }));
    var shown = rows.slice(0, SWS.shown);
    var tbl = el("table", { cls: "csb-table csw-table" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-code" }), el("col", { cls: "csb-c-mid" }), el("col", { cls: "csb-c-num" }), el("col", { cls: "csb-c-mid" }),
        el("col", { cls: "csb-c-num" }), el("col", { cls: "csb-c-num" }), el("col", { cls: "csb-c-ev" }), el("col", { cls: "csb-c-mid" })]),
      el("thead", null, [el("tr", null, ["Local code", "Colleges", "Courses", "Call", "Confidence", "Runner-up", "Why", "Action"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, shown.length ? shown.map(function (c) {
        var cols = c.colleges || [], nx = c.recommend.next;
        return el("tr", { "data-code": c.code, "data-class": c["class"] }, [
          el("th", { scope: "row" }, [c.code, (c.spellings || []).length > 1 || (c.spellings || [])[0] !== c.code ? el("span", { cls: "csb-sub", text: "Spelled " + (c.spellings || []).join(", ") }) : null,
            el("span", { cls: "csb-sub", text: (c.titles || []).slice(0, 3).join("; ") }),
            (c.local_titles || []).length ? el("span", { cls: "csb-sub", text: "Catalog title: " + c.local_titles.map(function (t) { return t[0]; }).join("; ") }) : null]),
          el("td", null, cols.length <= 3 ? [cols.map(function (x) { return x[0]; }).join("; ")]
            : [el("details", null, [el("summary", { text: fmt(cols.length) + " colleges" }), el("span", { cls: "csb-sub", text: cols.map(function (x) { return x[0] + " " + fmt(x[1]); }).join("; ") })])]),
          el("td", { text: fmt(c.courses) }),
          el("td", null, [c.recommend.common || "", el("span", { cls: "csb-sub", text: c.recommend.discipline || "" })]),
          el("td", { text: filedOf(c) && filedOf(c).discipline === c.recommend.discipline ? "Filed" : confWords(c.recommend.confidence) }),
          el("td", { text: nx ? nx.common + " " + Math.max(0, Math.round(nx.confidence * 100)) + "%" : "" }),
          el("td", { cls: "csb-ev", text: c.recommend.why ? c.recommend.why.charAt(0).toUpperCase() + c.recommend.why.slice(1) + "." : "" }),
          el("td", null, swActions(W, c, signed))]);
      }) : [el("tr", null, [el("td", { colspan: "8", text: "No code matches." })])])]);
    box.appendChild(gridify(el("div", { cls: "csb-wrap", role: "region", "aria-label": "Every local subject code, statewide", tabindex: "0" }, [tbl]), "statewide", [1, 6, 7]));
    if (rows.length > shown.length) {
      var more = el("button", { type: "button", cls: "csb-word", id: "csw-more", text: "Show " + fmt(Math.min(200, rows.length - shown.length)) + " more (" + fmt(rows.length - shown.length) + " not shown)" });
      more.addEventListener("click", function () { SWS.shown += 200; swRedraw("csw-more"); });
      box.appendChild(el("p", null, [more]));
    }
    return box;
  }

  /* ── the course panel (S700, #3655 item 3): a local code opens its courses at that college, credit and noncredit
     apart (Sam, 2026-11-21: "nc and cr courses should be differentiated in the college subject sidebars"). It reads
     kb/status/subject_courses/<slug>.json (kb/_build_subject_courses.py), one college's file, when it opens. ── */
  var COURSE_DIR = "kb/status/subject_courses/";
  var courseCache = {};
  function loadCourses(slug) {
    courseCache[slug] = courseCache[slug] || fetch(COURSE_DIR + slug + ".json", { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(COURSE_DIR + slug + ".json answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (f) {
      var cols = f.columns || [], codes = {};
      Object.keys(f.codes || {}).forEach(function (k) {
        codes[k] = f.codes[k].map(function (row) { var o = {}; cols.forEach(function (c, i) { o[c] = row[i]; }); return o; });
      });
      return codes;
    }, function (e) { delete courseCache[slug]; throw e; });
    return courseCache[slug];
  }
  /* A college's code named on a list that is not the college's own: a word that opens its panel where the college
     has a catalog on file and the code is in its list, and plain words where it does not. */
  function slugOfName(name, M0) {
    var M = M0 || VIEW.M, hit = "";
    ((M && M.list) || []).forEach(function (x) { if (x.college === name) hit = x.slug; });
    return hit;
  }
  function codeAt(slug, code, words) {
    var M = VIEW.M, c = slug && M && M.by[slug];
    if (!c || !c.rows.some(function (r) { return r.code === code; })) return words;
    return el("button", { type: "button", cls: "csb-word", "data-csb-code": code, "data-csb-slug": slug,
      "aria-label": words + ". Show its courses and settle it.", text: words });
  }
  function sep(parts) {
    var out = [];
    parts.forEach(function (p, i) { if (i) out.push("; "); out.push(p); });
    return out;
  }
  function codeWord(r) {
    var b = el("button", { type: "button", cls: "csb-word", "data-csb-code": r.code, "data-csb-slug": r.slug,
      "aria-label": "Courses under " + r.code + " at " + r.college, text: r.code });
    return b;
  }
  var BANDS = [["C", "Credit courses"], ["N", "Noncredit courses"], ["E", "Noncredit enhanced courses"], ["", "In the catalog only (COCI does not list it, so its band is not known)"]];
  function moveCell(ctx, c) {
    var mv = MOVES[moveKey(ctx.slug, ctx.code, c.number)];
    if (!mv) return null;
    var who = mine(mv) ? "you" : mv.decidedBy || "a person";
    var kids = [el("span", { cls: "csb-sub csb-saved", "data-moved": mv.common }, ["Moved to " + mv.common + (COMMON && COMMON[mv.common] ? " " + COMMON[mv.common] : "")
      + " by " + who + (day(mv.at) ? ", " + day(mv.at) : "") + ". The M-ID moves at the next re-mint."])];
    if (mine(mv)) {
      var tb = el("button", { type: "button", cls: "csb-word", "data-move-undo": mv.key, "aria-label": "Take back the move of " + c.number, text: "Take it back" });
      tb.addEventListener("click", function () {
        tb.disabled = true;
        takeBack(mv.key, MOVE_FIELD).then(function (res) {
          if (!res.ok || !res.n) { tb.disabled = false; tb.textContent = "Not taken back; try again"; return; }
          delete MOVES[mv.key];
          MOVE_SAID[ctx.slug + "|" + ctx.code] = "Taken back the move of " + c.number + ".";
          if (VIEW.root && VIEW.M) render(VIEW.root, VIEW.M, viewPath());
        }, function () { tb.disabled = false; tb.textContent = "Not taken back; try again"; });
      });
      kids.push(" ", tb);
    }
    return kids;
  }
  function courseTable(rows, label, ctx) {
    var can = !!(ctx && ctx.can);
    var all = can ? el("input", { type: "checkbox", cls: "csb-move-all", id: "csb-move-all-" + ctx.n, "aria-label": "Check every course in " + label }) : null;
    var tbl = el("table", { cls: "csb-table csb-courses" + (can ? " csb-movable" : "") }, [
      el("colgroup", null, (can ? [el("col", { cls: "csb-c-box" })] : []).concat([el("col", { cls: "csb-c-num" }), el("col"), el("col", { cls: "csb-c-code" }), el("col", { cls: "csb-c-mid" })])),
      el("thead", null, [el("tr", null, (can ? [el("th", { scope: "col" }, [el("label", { cls: "csb-vh", "for": all.id, text: "Move" }), all])] : [])
        .concat(["Number", "Title", "Listed in", "C-ID, CCN, M-ID"].map(function (t) { return el("th", { scope: "col", text: t }); })))]),
      el("tbody", null, rows.map(function (c) {
        var ids = [c.cid ? "C-ID " + c.cid : "", c.ccn ? "CCN " + c.ccn : "", c.mid ? "M-ID " + c.mid + (ctx && ctx.common && String(c.mid).split(" ")[0] !== ctx.common ? " (minted under " + String(c.mid).split(" ")[0] + ")" : "") : ""].filter(Boolean).join("; ");
        var mv = ctx ? MOVES[moveKey(ctx.slug, ctx.code, c.number)] : null, theirs = mv && !mine(mv);
        var box = can ? el("input", { type: "checkbox", cls: "csb-move", "data-move-number": c.number, "data-move-mid": c.mid || "", "data-move-title": c.title || "",
          "data-move-band": c.band || "", "aria-label": "Move " + c.number + " " + (c.title || ""), disabled: theirs ? true : null }) : null;
        var idCell = el("td", null, [ids].concat(ctx ? (moveCell(ctx, c) ? [" "].concat(moveCell(ctx, c)) : []) : []));
        return el("tr", { "data-number": c.number, "data-band": c.band || "", "data-moved": mv ? mv.common : null }, (can ? [el("td", { "data-sort": mv ? "1" : "0" }, [box])] : []).concat([
          el("th", { scope: "row", text: c.number }), el("td", { text: c.title || "" }), el("td", { text: (c.listed || "") + (c.band === "E" ? ", enhanced" : "") }), idCell]));
      }))]);
    if (all) all.addEventListener("change", function () {
      Array.prototype.forEach.call(tbl.querySelectorAll("input.csb-move:not([disabled])"), function (b) { b.checked = all.checked; });
      if (ctx.onCheck) ctx.onCheck();
    });
    if (can) tbl.addEventListener("change", function (e) { if (e.target && e.target.classList && e.target.classList.contains("csb-move") && ctx.onCheck) ctx.onCheck(); });
    return gridify(el("div", { cls: "csb-wrap csb-wrap-in", role: "region", "aria-label": label, tabindex: "0" }, [tbl]), can ? "courses-move" : "courses", can ? [0] : null);
  }
  /* The common subject code a noncredit category's courses take: the category form's save, else its noncredit MQ
     discipline's code, else none. */
  function catCode(row, cat) {
    var sl = NC_SLUGS[cat], sv = sl ? SAVED[row.slug + "|" + row.code + "|nc:" + sl] : null, m = NC_MQ[cat] || {};
    if (sv && sv.common) return { code: sv.common, saved: true, mq: m.mq_discipline || "" };
    if (m.common_code) return { code: m.common_code, saved: false, mq: m.mq_discipline || "" };
    return null;
  }
  /* An M-ID's four letters name the Common SUBJ it was minted under, never the course's local subject (Sam, 2026-11-22,
     on Cerritos AED: "it appeared to me that they were sitting under the AED local subject...we want to make sure that is
     not the appearance"). Where a code's courses hold M-IDs under a Common SUBJ other than the code's common subject code
     today, the panel says so above the tables, counted by prefix, and says how they move: by the code's decision at a
     re-mint, so a course is moved one at a time only where it belongs under another code than the rest. */
  function mintNote(row, rows, code, college) {
    var by = {}, n = 0;
    rows.forEach(function (x) { var p = String(x.mid || "").split(" ")[0]; if (p) { by[p] = (by[p] || 0) + 1; n += 1; } });
    var sv = row ? savedOf(row) : null, cc = (sv && sv.common) || (row && row.common) || "";
    var off = Object.keys(by).filter(function (p) { return p !== cc; }).sort(function (a, b) { return by[b] - by[a] || (a < b ? -1 : 1); });
    if (!off.length) return null;
    var parts = off.map(function (p) { return fmt(by[p]) + " under " + p + (COMMON && COMMON[p] ? " (" + COMMON[p] + ")" : ""); });
    var m = off.reduce(function (a, p) { return a + by[p]; }, 0);
    return el("p", { cls: "csb-note csb-mint", id: "csb-mint", role: "note" }, [
      el("strong", { text: "Every course below is listed under " + code + " at " + college + ". " }),
      "The four letters of an M-ID name the common subject code it was minted under, not the course’s local subject. "
      + fmt(m) + " of these " + fmt(rows.length) + " courses hold M-IDs minted under another code: " + parts.join("; ") + ". "
      + ((row && (row.noncredit_courses || 0) > 0) ? "Each noncredit category’s save above sets the code for that category’s courses only, shown under each heading below; the M-IDs move at the next re-mint, and the local subject stays " + code + ". "
        : cc ? code + "’s common subject code is " + cc + (sv && sv.common ? ", from a person’s save" : "") + ", so those M-IDs move at the next re-mint. "
        : code + " has no common subject code yet; settle it above and those M-IDs move at the next re-mint. ")
      + "Move a course one at a time only where it belongs under a different code than the rest."]);
  }
  /* The move bar under the panel's course tables: one common subject code for the checked courses, and one Save. */
  /* The common subject code picker for a move (Sam, 2026-11-23: "List the subjects in selector grouped by cr first alpha
     then nc alpha"): credit codes, then noncredit codes, each by discipline name. A code is noncredit where its MQ
     discipline says Noncredit or a COCI noncredit category names it (VOCE, Vocational). */
  function ncCodeSet() {
    var set = {};
    Object.keys(NC_MQ || {}).forEach(function (k) { var c = (NC_MQ[k] || {}).common_code; if (c) set[c] = true; });
    Object.keys(COMMON || {}).forEach(function (k) { if (/noncredit/i.test(String(COMMON[k]))) set[k] = true; });
    return set;
  }
  function codePicker(id, describedBy) {
    var nc = ncCodeSet(), keys = Object.keys(COMMON || {});
    var byName = function (a, b) { var x = String(COMMON[a]).toLowerCase(), y = String(COMMON[b]).toLowerCase(); return x < y ? -1 : x > y ? 1 : (a < b ? -1 : 1); };
    var opt = function (k) { return el("option", { value: k, text: COMMON[k] + " (" + k + ")" }); };
    return el("select", { id: id, cls: "csb-input csb-move-pick", "aria-describedby": describedBy || null }, [el("option", { value: "", text: "Choose a common subject code" }),
      el("optgroup", { label: "Credit" }, keys.filter(function (k) { return !nc[k]; }).sort(byName).map(opt)),
      el("optgroup", { label: "Noncredit" }, keys.filter(function (k) { return nc[k]; }).sort(byName).map(opt))]);
  }
  /* One move: the checked boxes inside scope, one kb_curation row each, under the reviewer's sign-in. */
  function moveControls(slug, code, scope, pre, label) {
    var co = codePicker(pre + "-code", pre + "-code-msg");
    var cmsg = el("p", { cls: "csb-ed-msg", id: pre + "-code-msg" });
    var status = el("p", { cls: "csb-ed-msg", id: pre + "-status", role: "status", tabindex: "-1" });
    var save = el("button", { type: "button", cls: "csb-word", id: pre + "-save", text: "Move the checked courses" });
    function checked() { return Array.prototype.slice.call(scope.querySelectorAll("input.csb-move:checked:not([disabled])")); }
    save.addEventListener("click", function () {
      var k = String(co.value || "").trim().toUpperCase(), boxes = checked();
      cmsg.textContent = ""; status.textContent = "";
      if (!boxes.length) { status.textContent = "Check one course or more first."; return; }
      if (!k) { status.textContent = "Choose the common subject code they belong under, then move them."; return; }
      if (!COMMON) { cmsg.textContent = "The list of common subject codes could not be read, so no code can be checked. Nothing was saved."; return; }
      if (!COMMON[k]) { cmsg.textContent = k + " is not a common subject code on the Common Subjects Reference. Nothing was saved."; return; }
      save.disabled = true;
      status.textContent = "Moving " + fmt(boxes.length) + (boxes.length === 1 ? " course…" : " courses…");
      var done = 0, bad = [], stop = false;
      boxes.reduce(function (p, b) {
        return p.then(function () {
          var num = b.getAttribute("data-move-number"), key = moveKey(slug, code, num);
          if (stop || String(num).indexOf("|") >= 0) { bad.push(num); return; }
          var value = { common_code: k, from_mid: b.getAttribute("data-move-mid") || null, title: b.getAttribute("data-move-title") || null, band: b.getAttribute("data-move-band") || null };
          return writeSave(key, value, MOVE_FIELD).then(function (res) {
            if (!res.ok) { bad.push(num); if (res.lapsed) { LAPSED = true; stop = true; } return; }
            done += 1;
            MOVES[key] = { common: k, fromMid: value.from_mid || "", title: value.title || "", at: new Date().toISOString(), by: res.email || "", label: "a reviewer", decidedBy: "", key: key };
          }, function () { bad.push(num); });
        });
      }, Promise.resolve()).then(function () {
        var w = done ? "Moved " + fmt(done) + (done === 1 ? " course" : " courses") + " to " + k + ". The M-IDs move at the next re-mint." : "";
        if (bad.length) w += (w ? " " : "") + "Not moved: " + bad.join(", ") + (stop ? ". Your sign-in has ended; sign in again, then save." : ". Only a reviewer on the list may save; press again to retry.");
        MOVE_SAID[slug + "|" + code] = w;
        if (!done) { save.disabled = false; status.textContent = w; return; }
        if (VIEW.root && VIEW.M) render(VIEW.root, VIEW.M, viewPath());
      });
    });
    var row = el("div", { cls: "csb-move-row" }, [el("label", { "for": pre + "-code", text: label || "Move the checked courses to" }), co, save]);
    return { row: row, cmsg: cmsg, status: status, checked: checked };
  }
  /* The move bar under the panel's course tables: one common subject code for every checked course, and one Save. */
  function moveBar(slug, code, body) {
    var pre = "csb-move";
    var mc = moveControls(slug, code, body, pre, "Common subject code for the checked courses");
    var n = el("p", { cls: "csb-note", id: pre + "-n", role: "status", text: "No course is checked." });
    /* Once a course is checked the bar pins to the panel's foot, so the save is in reach however far down the course is
       (Sam, 2026-11-23, on Cerritos AED's construction courses: "I don't see a way to fix them from here"). */
    function count() {
      var k = mc.checked().length;
      n.textContent = k ? fmt(k) + (k === 1 ? " course is checked." : " courses are checked.") : "No course is checked.";
      if (node.classList) node.classList.toggle("csb-move-live", k > 0);
    }
    var node = el("section", { cls: "csb-edit csb-move-bar", id: pre, "aria-labelledby": pre + "-h" }, [
      el("h4", { cls: "csb-edit-head", id: pre + "-h", text: "Move courses to another common subject code" }),
      el("p", { cls: "csb-note csb-move-help", text: "For the course that belongs under a different code than the rest of " + code + ": check it, or a group, choose the common subject code it belongs under, and move it. The code’s own common subject code, settled above, moves the rest at the next re-mint. Each move is saved under your sign-in and shows on its course. A course another person moved keeps that move." }),
      n, mc.row, mc.cmsg, mc.status]);
    return { node: node, count: count };
  }
  /* A panel section that folds under its own heading; Collapse all and Expand all reach every one (Sam, 2026-11-23:
     "a collapse all for the sidebar--it's a lot to scroll"). The heading stays the section's first element's text. */
  function fold(node, head, kids) {
    var det = el("details", { cls: "csb-fold", open: "" }, [el("summary", { cls: "csb-fold-sum" }, [head])].concat(kids || []));
    if (node) {
      if (head && head.parentNode === node) node.removeChild(head);
      while (node.firstChild) det.appendChild(node.firstChild);
      node.appendChild(det);
      return node;
    }
    return det;
  }
  /* Edit and Save, above the course tables: the local title and the common subject code a person settles. A code's
     credit courses take one form (band credit, or whole where COCI lists no course); its noncredit courses take one
     form per COCI noncredit category it holds, most courses first (band nc:<category slug>, #3655;
     d-subject-save-key-three-part-s698). A code has one local title: a code with credit courses keeps it on its credit
     form, a noncredit-only code on the form of its dominant category; the other forms take a common subject code. */
  function form(c, row, f) {
    /* f: ids, key, mapKey, sv (the save under this key), wrap (where the form goes), notes (before the fields),
       after (after the line about another's save), title ("edit", a text shown read-only, or null), tVal,
       code (true for a code field), kVal, noCode (the words where it takes none), fromRec. */
    var I = f.ids, key = f.key, sv = f.sv, box = f.wrap;
    (f.notes || []).forEach(function (n) { if (n) box.appendChild(n); });
    if (f.fromRec && f.fromRec.length) box.appendChild(el("p", { cls: "csb-note csb-rec", id: I.rec, text: "Filled in from the recommendation: " + f.fromRec.join(" and ") + ". It stays a recommendation until you save it." }));
    var ti = null, co = null, si = null, smsg = null, editable = f.title === "edit" || !!f.code;
    var tmsg = el("p", { cls: "csb-ed-msg", id: I.tmsg }), cmsg = el("p", { cls: "csb-ed-msg", id: I.cmsg });
    var status = el("p", { cls: "csb-ed-msg", id: I.status, role: "status", tabindex: "-1", text: SAID[key] || (LAPSED ? "Your sign-in has ended. Sign in again, then save." : "") });
    var save = editable ? el("button", { type: "button", cls: "csb-word", id: I.save, text: "Save" }) : null;
    /* Take it back only on the signed-in reviewer's own save; on anyone else's (a filed decision included) a new Save
       replaces it, and the page says so. */
    var undo = sv && mine(sv) ? el("button", { type: "button", cls: "csb-word", id: I.undo, text: "Take it back" }) : null;
    if (sv && !undo) box.appendChild(el("p", { cls: "csb-note", id: I.others, text: (filedRow(sv) ? "This decision was filed for " + sv.decidedBy
      : "Another reviewer saved this decision") + "." + (editable ? " A new Save replaces it." : "") }));
    (f.after || []).forEach(function (n) { if (n) box.appendChild(n); });
    if (f.title === "edit") {
      ti = el("input", { type: "text", id: I.title, cls: "csb-input", maxlength: "120", autocomplete: "off", "aria-describedby": I.tmsg });
      ti.value = f.tVal || "";
      box.appendChild(el("div", { cls: "csb-ed-field" }, [el("label", { "for": I.title, text: "Local title" }), ti, tmsg]));
      /* Where the title comes from (Sam, 2026-11-22, r-subject-title-source-link-sam-2026-11-22: "I wanted to add the link
         and test it"): a link saved with the decision, and Open the link to check it in a new tab before Save. */
      si = el("input", { type: "url", id: I.src, cls: "csb-input", maxlength: "500", autocomplete: "off", spellcheck: "false", inputmode: "url", "aria-describedby": I.smsg });
      si.value = (sv && sv.source) || "";
      smsg = el("p", { cls: "csb-ed-msg", id: I.smsg });
      var openL = el("button", { type: "button", cls: "csb-word", id: I.open, text: "Open the link" });
      openL.addEventListener("click", function () {
        var u = String(si.value || "").trim();
        smsg.textContent = "";
        if (!isLink(u)) { smsg.textContent = u ? "That is not a web address. A link starts with https:// or http://." : "Paste the page's address first."; si.focus(); return; }
        var w = window.open(u, "_blank", "noopener");
        smsg.textContent = w === null ? "Your browser held the new tab. Allow pop-ups for this site, or copy the link into a new tab." : "Opened in a new tab. Check that it names " + row.code + ", then save.";
      });
      box.appendChild(el("div", { cls: "csb-ed-field" }, [el("label", { "for": I.src, text: "Source link (the page that names this title)" }), si, el("p", { cls: "csb-ed-row" }, [openL]), smsg]));
    } else if (f.title) box.appendChild(el("p", { cls: "csb-ed-ro", id: I.title + "-ro" }, [el("strong", { text: "Local title: " }), f.title]));
    if (f.code) {
      co = el("input", { type: "text", id: I.code, cls: "csb-input csb-input-code", maxlength: "4", autocomplete: "off", spellcheck: "false",
        autocapitalize: "characters", list: COMMON ? "csb-ed-codes" : null, "aria-describedby": I.cmsg });
      co.value = f.kVal || "";
      box.appendChild(el("div", { cls: "csb-ed-field" }, [el("label", { "for": I.code, text: "Common subject code" }), co, cmsg]));
    } else if (f.noCode) box.appendChild(el("p", { cls: "csb-ed-ro", id: I.code + "-none", text: f.noCode }));
    if (save || undo) box.appendChild(el("p", { cls: "csb-ed-row" }, [save, undo]));
    box.appendChild(status);
    var stay = viewPath();
    function redraw(focusId) {
      if (!VIEW.root || !VIEW.M) return;
      render(VIEW.root, VIEW.M, stay);
      var fx = VIEW.root.querySelector("#" + focusId) || VIEW.root.querySelector("#" + I.status);
      if (fx && fx.focus) fx.focus();
    }
    function failed(res) {
      if (res && res.lapsed) { LAPSED = true; return "Not saved: your sign-in has ended. Sign in again, then save."; }
      return "Not saved: the server answered " + (res && res.status) + ". Only a reviewer on the list may save.";
    }
    if (save) save.addEventListener("click", function () {
      var t = ti ? String(ti.value || "").trim().replace(/\s+/g, " ") : "", k = co ? String(co.value || "").trim().toUpperCase() : "";
      tmsg.textContent = ""; cmsg.textContent = ""; status.textContent = "";
      var bad = false;
      if (t) {
        var tc = titleCase(t);
        if (tc !== t) {
          bad = true;
          var use = el("button", { type: "button", cls: "csb-word", id: I.use, text: "Use “" + tc + "”" });
          use.addEventListener("click", function () { ti.value = tc; tmsg.textContent = ""; ti.focus(); });
          tmsg.appendChild(document.createTextNode((isUpperWord(t) ? "A title is saved in Title Case, not in capitals." : "A title is saved in Title Case.") + " Nothing was saved. "));
          tmsg.appendChild(use);
        }
      }
      if (k) {
        if (!COMMON) { bad = true; cmsg.textContent = "The list of common subject codes could not be read, so no code can be checked. Nothing was saved."; }
        else if (!COMMON[k]) { bad = true; cmsg.textContent = k + " is not a common subject code on the Common Subjects Reference. Type a code it holds, such as KINE for Kinesiology. Nothing was saved."; }
      }
      var src = si ? String(si.value || "").trim() : "";
      if (smsg) smsg.textContent = "";
      if (src && !isLink(src)) { bad = true; smsg.textContent = "That is not a web address. A link starts with https:// or http://. Nothing was saved."; }
      if (!t && !k) { bad = true; status.textContent = ti && co ? "Type a local title or a common subject code, then save." : ti ? "Type a local title, then save." : "Type a common subject code, then save."; }
      if (bad) return;
      var value = {};
      if (t) value.local_title = t;
      if (k) value.common_code = k;
      if (src) value.source_url = src;
      save.disabled = true;
      status.textContent = "Saving…";
      writeSave(key, value).then(function (res) {
        if (!res.ok) { save.disabled = false; status.textContent = failed(res); return; }
        LAPSED = false;
        SAVED[f.mapKey] = { title: value.local_title || "", common: value.common_code || "", source: value.source_url || "", at: new Date().toISOString(), by: res.email || "",
          label: "a reviewer", decidedBy: "", key: key, mapKey: f.mapKey };
        SAID[key] = "Saved. The list shows your decision in place of the files.";
        redraw(I.status);
      }, function (e) { save.disabled = false; status.textContent = "Not saved: " + ((e && e.message) || "the network failed") + "."; });
    });
    if (undo) undo.addEventListener("click", function () {
      undo.disabled = true;
      status.textContent = "Taking it back…";
      takeBack(sv.key).then(function (res) {
        if (!res.ok) { undo.disabled = false; status.textContent = failed(res).replace("Not saved", "Not taken back"); return; }
        if (!res.n) { undo.disabled = false; status.textContent = "Nothing was taken back: no save of yours is stored under this code now. Reload the tab to read the saves again."; return; }
        delete SAVED[sv.mapKey];
        if (row.decision && (row.decision.key === sv.key || row.decision.title_key === sv.key)) revert(row);
        SAID[key] = "Taken back. The row reads from the files again.";
        redraw(I.status);
      }, function (e) { undo.disabled = false; status.textContent = "Not taken back: " + ((e && e.message) || "the network failed") + "."; });
    });
    return box;
  }
  function ids(pre, notes) {
    return { title: pre + "-title", code: pre + "-code", tmsg: pre + "-title-msg", cmsg: pre + "-code-msg", status: pre + "-status",
      save: pre + "-save", undo: pre + "-undo", use: pre + "-use", rec: notes + "-rec", others: notes + "-others", moved: notes + "-moved",
      src: pre + "-source", smsg: pre + "-source-msg", open: pre + "-source-open" };
  }
  /* The credit form: band credit, or whole where COCI lists no course under the code. */
  function creditForm(c, row, box, band) {
    var key = saveKey(c.slug, row.code, band), sv = savedOf(row), rec = recOf(row);
    var tVal = sv && sv.title ? sv.title : row.printed_name || (rec.title && rec.title.title) || "";
    var kVal = sv && sv.common ? sv.common : row.common || (rec.common && rec.common.code) || "";
    var fromRec = [];
    if (!(sv && sv.title) && !row.printed_name && rec.title && rec.title.title) fromRec.push("the local title");
    if (!(sv && sv.common) && !row.common && rec.common && rec.common.code) fromRec.push("the common subject code");
    var nc = (row.noncredit_courses || 0) > 0, forms = nc && ncParts(row).length > 0;
    return form(c, row, { ids: ids("csb-ed", "csb-edit"), key: key, mapKey: c.slug + "|" + row.code + "|" + band, sv: sv, wrap: box,
      notes: [el("p", { cls: "csb-note", id: "csb-edit-band", text: band === "whole"
        ? "COCI lists no course under " + row.code + ", so a save settles the whole code."
        : nc ? row.code + " holds credit and noncredit courses in COCI. A save here settles its credit courses and the code’s local title"
          + (forms ? "; each noncredit category below has its own form." : "; no COCI noncredit category is on file for its noncredit courses, so they take no save yet.")
        : "A save settles " + row.code + " for its credit courses. A person’s save wins over the catalog, the subject map and every recommendation." })],
      after: [sv && sv.moved ? el("p", { cls: "csb-note", id: "csb-edit-moved", text: "This decision was saved under the " + sv.moved.from
        + " band. COCI’s counts have changed since, and the code’s band is now " + sv.moved.to + ", so a new Save writes under " + sv.moved.to + "." }) : null],
      title: "edit", tVal: tVal, code: true, kVal: kVal, fromRec: fromRec });
  }
  /* One form per noncredit category the code holds, most courses first, and a line for each save whose category the
     code no longer holds (it settles no course; its title may still stand as the code’s). */
  function ncForms(c, row, box) {
    var parts = ncParts(row), only = bandOf(row) === "noncredit", dom = dominantOf(parts), rec = recOf(row);
    var held = only ? ncTitleOf(row) : null, credit = only ? null : savedOf(row);
    var codeTitle = only ? (held && held.title) || row.printed_name || "" : (credit && credit.title) || row.printed_name || "";
    box.appendChild(el("h5", { cls: "csb-edit-head csb-nc-head", id: "csb-nc-h", text: "Noncredit courses, by COCI noncredit category" }));
    box.appendChild(el("p", { cls: "csb-note", id: "csb-nc-title-rule", text: only
      ? "A code has one local title, so " + row.code + " keeps its title on the form of the category with the most courses, " + catWords(dom) + "; each other category takes a common subject code only."
      : "A code has one local title, so " + row.code + " keeps its title with its credit courses above; each noncredit category takes a common subject code only." }));
    var shown = {};
    parts.forEach(function (p) {
      var cat = p[0], slug = NC_SLUGS[cat];
      var fs = el("fieldset", { cls: "csb-nc-form", "data-category": cat, "data-slug": slug || null }, [
        el("legend", { text: catWords(cat) + ", " + fmt(p[1]) + (p[1] === 1 ? " noncredit course" : " noncredit courses") })]);
      box.appendChild(fs);
      if (!slug) { fs.appendChild(el("p", { cls: "csb-note", text: "No noncredit save can be keyed for " + cat + ": the list of category keys does not name it." })); return; }
      shown[slug] = true;
      var m = NC_MQ[cat] || {}, hasCode = !!m.common_code, holder = only && cat === dom;
      var mapKey = c.slug + "|" + row.code + "|nc:" + slug, sv = SAVED[mapKey] || null;
      var pre = "csb-nc-" + slug;
      var mq = el("p", { cls: "csb-note", id: pre + "-mq", text: cat === NO_CAT
        ? "COCI names no noncredit category for these courses, so they have no noncredit MQ discipline and no common subject code."
        : (m.mq_discipline ? "Noncredit MQ discipline: " + m.mq_discipline + ". " : "No noncredit MQ discipline is named for this category. ")
          + (hasCode ? "Its common subject code is " + m.common_code + "." : "It has no common subject code yet.") });
      var tVal = "", fromRec = [];
      if (holder) {
        tVal = sv && sv.title ? sv.title : held && held.title ? held.title : row.printed_name || (rec.title && rec.title.title) || "";
        if (!(sv && sv.title) && !held && !row.printed_name && rec.title && rec.title.title) fromRec.push("the local title");
      }
      var kVal = hasCode ? (sv && sv.common ? sv.common : m.common_code) : "";
      if (hasCode && !(sv && sv.common)) fromRec.push("the common subject code");
      /* A title saved on this form when it held the code's title (its category held most of the courses, or the code
         held noncredit courses only) shows read-only and says where the code's title lives now; a Save here writes no
         title, so the old one is never stamped anew. */
      var stale = !holder && sv && sv.title && sv.title !== codeTitle ? el("p", { cls: "csb-note", id: pre + "-stale" }, [
        el("strong", { text: "Saved here earlier: " }), sv.title + ". It was saved as this form’s title when "
        + (only ? catWords(cat) + " held most of the courses. The code’s title now lives on the " + catWords(dom) + " form"
          : row.code + " held noncredit courses only. The code’s title now lives on the credit form above")
        + ", and a Save here writes no title."]) : null;
      if (!holder && !hasCode && !sv) {
        fs.appendChild(mq);
        if (codeTitle) fs.appendChild(el("p", { cls: "csb-ed-ro", id: pre + "-title-ro" }, [el("strong", { text: "Local title: " }), codeTitle + " (the code’s own)."]));
        fs.appendChild(el("p", { cls: "csb-ed-ro", id: pre + "-code-none", text: "This category takes no save: its title is the code’s, and it has no common subject code yet." }));
        return;
      }
      form(c, row, { ids: ids(pre, pre), key: saveKey(c.slug, row.code, "nc:" + slug), mapKey: mapKey, sv: sv, wrap: fs, notes: [mq],
        after: [holder && held && held.moved ? el("p", { cls: "csb-note", id: pre + "-moved", text: "The title " + held.title + " was saved on the "
          + catWords(held.cat) + " form, when that category held the most courses. A Save here writes it under " + catWords(dom) + "." }) : null, stale],
        title: holder ? "edit" : codeTitle ? codeTitle + " (the code’s own)." : null, tVal: tVal,
        code: hasCode, kVal: kVal, noCode: hasCode ? null : catWords(cat) + " has no common subject code yet, so this form takes a title and no code.",
        fromRec: fromRec });
    });
    ncSaves(row).filter(function (sv) { return !shown[slugOfSave(sv)]; }).forEach(function (sv) {
      var slug = slugOfSave(sv), cat = catOfSlug(slug), pre = "csb-nc-gone-" + slug;
      var fs = el("fieldset", { cls: "csb-nc-form", "data-category": cat || "", "data-slug": slug, "data-gone": "yes" }, [
        el("legend", { text: (cat ? catWords(cat) : "A category the list does not name (" + slug + ")") + ", no course now" })]);
      box.appendChild(fs);
      /* Where this save's title is the code's title today (a noncredit-only code whose dominant form holds none), it
         says so, as the list row and the dominant form do; its code settles no course. */
      var isTitle = only && held && held.sv === sv;
      var settles = [!isTitle && sv.title ? "the title " + sv.title : "", sv.common ? "the common subject code " + sv.common : ""].filter(Boolean).join(" and ");
      form(c, row, { ids: ids(pre, pre), key: sv.key, mapKey: sv.mapKey, sv: sv, wrap: fs,
        notes: [el("p", { cls: "csb-note", id: pre + "-gone", text: "A decision was saved under this category, and COCI lists no course of " + row.code + " in it now. "
          + (isTitle ? "Its title, " + sv.title + ", stands as the code’s title until the " + catWords(dom) + " form saves one." + (settles ? " " : "") : "")
          + (settles ? "It settles no course: " + settles + "." : "") })],
        title: null, code: false });
    });
  }
  function editBlock(c, row) {
    var box = el("section", { cls: "csb-edit", id: "csb-edit", "aria-labelledby": "csb-edit-h" }, [
      el("h4", { cls: "csb-edit-head", id: "csb-edit-h", text: "Settle this code" })]);
    var band = bandOf(row);
    if (String(row.code).indexOf("|") >= 0) {
      box.appendChild(el("p", { cls: "csb-note", text: "This code holds a character the saved key cannot carry, so it cannot be saved here." }));
      return box;
    }
    if (band === "noncredit" && !ncParts(row).length) {
      box.appendChild(el("p", { cls: "csb-note", id: "csb-edit-hold", text: "Every course COCI lists under " + row.code + " is noncredit, and no COCI noncredit category is on file for them, so this code has no Edit yet." }));
      return box;
    }
    if (!reviewer()) {
      box.appendChild(el("p", { cls: "csb-note", id: "csb-edit-signin", text: "Edit opens once you sign in as a reviewer. Sign in from the control in COBI’s header, at the top of the window; this page has no sign-in of its own." }));
      return box;
    }
    if (band !== "noncredit") creditForm(c, row, box, band);
    if ((row.noncredit_courses || 0) > 0 && ncParts(row).length) ncForms(c, row, box);
    if (COMMON) box.appendChild(el("datalist", { id: "csb-ed-codes" }, Object.keys(COMMON).sort().map(function (k) { return el("option", { value: k, label: COMMON[k] }); })));
    return box;
  }
  /* The same local code at the other colleges with a catalog on file (Sam, 2026-11-22: "all the AEDs that are in ELEC
     erroneously"): each opens that college's form, so a code wrong at several colleges is settled from one place. */
  function elsewhere(M, slug, code) {
    var others = M.list.filter(function (x) { return x.slug !== slug && x.rows.some(function (r) { return r.code === code; }); });
    if (!others.length) return null;
    return el("p", { cls: "csb-note", id: "csb-elsewhere" }, [code + " is also a code at " + fmt(others.length) + (others.length === 1 ? " other college" : " other colleges")
      + " with a catalog on file, and each college’s code is settled on its own: "].concat(sep(others.map(function (x) {
        var r = x.rows.filter(function (q) { return q.code === code; })[0], sv = savedOf(r);
        var has = (sv && sv.common) || r.common || "";
        return el("span", null, [el("button", { type: "button", cls: "csb-word", "data-csb-code": code, "data-csb-slug": x.slug,
          "aria-label": code + " at " + x.college + ". Show its courses and settle it.", text: x.college }), has ? " (" + has + (sv && sv.common ? ", saved" : "") + ")" : " (no common subject code)"]);
      })), ["."]));
  }
  /* One Save that settles a code's common subject code at every college on file using it (#3655 item 0, S705;
     d-subjects-one-save-every-college-credit-forms-s705). It writes one kb_curation row per college, keyed as that
     college's own credit form keys it (credit, or whole where COCI lists no course), under the reviewer's own email.
     A college whose code a person or a filing already settled keeps that decision (person-settled wins), the
     reviewer's own save keeps its title, and a noncredit-only code keeps its own forms: each COCI noncredit category
     takes the code its noncredit MQ discipline names, so no one code fits them all. */
  function everyPlan(M, code, k) {
    var plan = { write: [], same: [], other: [], nc: [] };
    M.list.forEach(function (x) {
      var r = x.rows.filter(function (q) { return q.code === code; })[0];
      if (!r) return;
      var band = bandOf(r), sv = savedOf(r);
      if (band === "noncredit") { plan.nc.push({ x: x, r: r }); return; }
      if (sv && !mine(sv)) { plan.other.push({ x: x, r: r, sv: sv }); return; }
      if (k && sv && !sv.moved && sv.common === k) { plan.same.push({ x: x, r: r }); return; }
      var value = {};
      if (sv && sv.title) value.local_title = sv.title;
      if (k) value.common_code = k;
      if (sv && sv.source) value.source_url = sv.source;
      plan.write.push({ x: x, r: r, band: band, key: saveKey(x.slug, code, band), mapKey: x.slug + "|" + code + "|" + band, value: value });
    });
    return plan;
  }
  function names(items, extra) {
    return items.map(function (it) { return it.x.college + (extra ? extra(it) : ""); }).join("; ");
  }
  function everyCollege(M, slug, code, row) {
    if (!row || String(code).indexOf("|") >= 0 || !reviewer()) return null;
    var others = M.list.filter(function (x) { return x.slug !== slug && x.rows.some(function (r) { return r.code === code; }); });
    if (!others.length) return null;
    var pre = "csb-all", sv0 = savedOf(row);
    var co = el("input", { type: "text", id: pre + "-code", cls: "csb-input csb-input-code", maxlength: "4", autocomplete: "off", spellcheck: "false",
      autocapitalize: "characters", list: COMMON ? "csb-ed-codes" : null, "aria-describedby": pre + "-code-msg" });
    co.value = (sv0 && sv0.common) || row.common || "";
    var cmsg = el("p", { cls: "csb-ed-msg", id: pre + "-code-msg" });
    var status = el("p", { cls: "csb-ed-msg", id: pre + "-status", role: "status", tabindex: "-1", text: SAID[pre + "|" + code] || "" });
    var save = el("button", { type: "button", cls: "csb-word", id: pre + "-save", text: "Save at every college" });
    var plan0 = everyPlan(M, code, "");
    var left = [];
    if (plan0.other.length) left.push(el("p", { cls: "csb-note", id: pre + "-other" }, ["Kept as a person settled them: " + names(plan0.other, function (it) {
      return it.sv.common ? " (" + it.sv.common + ")" : " (a title only)"; }) + "."]));
    if (plan0.nc.length) left.push(el("p", { cls: "csb-note", id: pre + "-nc" }, ["Settled on their own noncredit forms, one per COCI noncredit category: " + names(plan0.nc) + "."]));
    var box = el("section", { cls: "csb-edit", id: pre, "aria-labelledby": pre + "-h" }, [
      el("h4", { cls: "csb-edit-head", id: pre + "-h", text: "Settle " + code + " at every college" }),
      el("p", { cls: "csb-note", id: pre + "-rule", text: "One Save writes this common subject code for " + code + "’s credit courses at each of the "
        + fmt(plan0.write.length + plan0.same.length) + (plan0.write.length + plan0.same.length === 1 ? " college" : " colleges")
        + " on file that use the code and have no other person’s decision on it: " + (names(plan0.write.concat(plan0.same)) || "none") + "."
        + " Each save is yours, under your sign-in, and Take it back on each college’s form removes it." })]
      .concat(left, [
        el("div", { cls: "csb-ed-field" }, [el("label", { "for": pre + "-code", text: "Common subject code at every college" }), co, cmsg]),
        el("p", { cls: "csb-ed-row" }, [save]), status]));
    save.addEventListener("click", function () {
      var k = String(co.value || "").trim().toUpperCase();
      cmsg.textContent = ""; status.textContent = "";
      if (!k) { status.textContent = "Type a common subject code, then save."; return; }
      if (!COMMON) { cmsg.textContent = "The list of common subject codes could not be read, so no code can be checked. Nothing was saved."; return; }
      if (!COMMON[k]) { cmsg.textContent = k + " is not a common subject code on the Common Subjects Reference. Type a code it holds, such as KINE for Kinesiology. Nothing was saved."; return; }
      var plan = everyPlan(M, code, k);
      if (!plan.write.length) { status.textContent = "Nothing to save: every college listed already holds your save of " + k + "."; return; }
      save.disabled = true;
      status.textContent = "Saving at " + fmt(plan.write.length) + (plan.write.length === 1 ? " college…" : " colleges…");
      var done = [], bad = [], stop = null;
      var chain = plan.write.reduce(function (p, it) {
        return p.then(function () {
          if (stop) { bad.push(it); return; }
          return writeSave(it.key, it.value).then(function (res) {
            if (!res.ok) { bad.push(it); if (res.lapsed) { LAPSED = true; stop = "lapsed"; } return; }
            done.push(it);
            SAVED[it.mapKey] = { title: it.value.local_title || "", common: k, source: it.value.source_url || "", at: new Date().toISOString(), by: res.email || "",
              label: "a reviewer", decidedBy: "", key: it.key, mapKey: it.mapKey };
          }, function () { bad.push(it); });
        });
      }, Promise.resolve());
      chain.then(function () {
        if (done.length) LAPSED = stop === "lapsed";
        var said = done.length ? "Saved " + k + " at " + fmt(done.length) + (done.length === 1 ? " college: " : " colleges: ") + names(done) + "." : "";
        if (bad.length) said += (said ? " " : "") + "Not saved at " + names(bad) + (stop === "lapsed" ? ": your sign-in has ended. Sign in again, then save." : ". Only a reviewer on the list may save; press Save again to retry.");
        SAID[pre + "|" + code] = said;
        if (!done.length) { save.disabled = false; status.textContent = said; return; }
        if (!VIEW.root || !VIEW.M) return;
        render(VIEW.root, VIEW.M, viewPath());
        var fx = VIEW.root.querySelector("#" + pre + "-status");
        if (fx && fx.focus) fx.focus();
      });
    });
    return box;
  }
  /* The panel's width: dragged by mouse, pen or finger from its left edge, or set from the keyboard on the grip (Left
     widens, Right narrows, Home returns it to its own width). One width for every Subjects panel, kept across visits:
     a width is no filter (CLAUDE.md, tabs never remember a filter). */
  var PANEL_KEY = "cplSubjectsPanelW", PANEL_MIN = 360, PANEL_STEP = 40, panelMem;
  function panelMax() { return Math.max(PANEL_MIN, (window.innerWidth || 1280) - 24); }
  function panelW() {
    if (panelMem === undefined) { try { panelMem = parseInt(window.localStorage.getItem(PANEL_KEY), 10) || null; } catch (e) { panelMem = null; } }
    return panelMem;
  }
  function setPanelW(w) {
    panelMem = w || null;
    try { if (panelMem) window.localStorage.setItem(PANEL_KEY, String(panelMem)); else window.localStorage.removeItem(PANEL_KEY); } catch (e) { /* storage blocked */ }
  }
  function panelSize(panel) { var w = panelW(); panel.style.width = w ? Math.min(w, panelMax()) + "px" : ""; }
  function panelGrip(panel) {
    function now() { return panelW() || Math.round(panel.getBoundingClientRect().width) || 620; }
    var g = el("span", { cls: "csb-pgrip", id: "csb-panel-grip", role: "separator", tabindex: "0", "aria-orientation": "vertical",
      "aria-label": "Resize the panel", "aria-valuemin": String(PANEL_MIN), "aria-valuemax": String(panelMax()), "aria-valuenow": String(now()) });
    function set(w) {
      w = Math.max(PANEL_MIN, Math.min(panelMax(), Math.round(w)));
      setPanelW(w); panelSize(panel); g.setAttribute("aria-valuenow", String(w));
    }
    g.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") set(now() + PANEL_STEP);
      else if (e.key === "ArrowRight") set(now() - PANEL_STEP);
      else if (e.key === "Home") { setPanelW(null); panelSize(panel); g.setAttribute("aria-valuenow", String(now())); }
      else return;
      e.preventDefault(); e.stopPropagation();
    });
    g.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      var startX = e.clientX, startW = now();
      try { g.setPointerCapture(e.pointerId); } catch (err) { /* an older engine */ }
      /* The grip sits on the panel's left edge, so a drag to the left widens it. */
      function move(ev) { if (ev.pointerId === e.pointerId) set(startW - (ev.clientX - startX)); }
      function up(ev) {
        if (ev && ev.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
        g.removeEventListener("pointermove", move); document.removeEventListener("pointermove", move);
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { g.removeEventListener(t, up); document.removeEventListener(t, up); });
      }
      g.addEventListener("pointermove", move); document.addEventListener("pointermove", move);
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { g.addEventListener(t, up); document.addEventListener(t, up); });
    });
    return g;
  }
  function foldEdit(sec) {
    if (!sec || !sec.firstChild || sec.firstChild.tagName !== "H4") return sec;
    return fold(sec, sec.firstChild);
  }
  function panelDraw(root, M) {
    var old = root.querySelector("#csb-panel");
    if (old) old.parentNode.removeChild(old);
    var slug = S.at || S.view, back = S.view;
    if (!S.code || !M.by[slug]) return;
    var c = M.by[slug], code = S.code;
    var row = c.rows.filter(function (r) { return r.code === code; })[0];
    var close = el("button", { type: "button", cls: "csb-word", id: "csb-panel-close", text: "Close" });
    close.addEventListener("click", function () { open(back); });
    var body = el("div", { id: "csb-panel-body" }, [el("p", { cls: "csb-note", role: "status", text: "Reading the courses…" })]);
    var sv = row ? savedOf(row) : null;
    var name = sv && sv.title ? sv.title : row && row.printed_name ? row.printed_name : "";
    var common = sv && sv.common ? sv.common + (COMMON && COMMON[sv.common] ? " " + COMMON[sv.common] : "")
      : row && row.common ? row.common + (row.discipline ? " " + row.discipline : "") : "";
    /* The top row (the eyebrow, Close and the heading) stays frozen at the panel's top while its body scrolls, and the
       panel resizes from its left edge (Sam, 2026-11-22, r-sidebars-resize-and-frozen-top-sam-2026-11-22: "the
       sidebar needs to be adjustable width and the top row, including the close button, should be frozen to the top as
       you scroll--this is a rule to apply to all side bars"). */
    var panel = el("aside", { cls: "csb-panel", id: "csb-panel", role: "dialog", "aria-labelledby": "csb-panel-h" }, [
      el("div", { cls: "csb-panel-in" }, [
        el("div", { cls: "csb-panel-head", id: "csb-panel-head" }, [
          el("div", { cls: "csb-panel-top" }, [el("p", { cls: "csb-eyebrow", text: "Courses under a local code" }), close]),
          el("h3", { id: "csb-panel-h", tabindex: "-1", text: code + (name ? ", " + name : "") })]),
        el("p", { cls: "csb-note", text: c.college + ". " + (name ? "" : "No local title yet. ")
          + (common ? "Common subject code " + common + "." : "No common subject code yet.") }),
        foldEdit(row ? editBlock(c, row) : null),
        elsewhere(M, slug, code),
        foldEdit(everyCollege(M, slug, code, row)),
        body])]);
    var head = panel.querySelector("#csb-panel-head");
    var foldAll = function (open) { Array.prototype.forEach.call(panel.querySelectorAll("details.csb-fold"), function (d) { d.open = open; }); };
    var shut = el("button", { type: "button", cls: "csb-word", id: "csb-fold-all", text: "Collapse all" });
    var opn = el("button", { type: "button", cls: "csb-word", id: "csb-unfold-all", text: "Expand all" });
    shut.addEventListener("click", function () { foldAll(false); });
    opn.addEventListener("click", function () { foldAll(true); });
    head.appendChild(el("p", { cls: "csb-fold-row" }, [shut, opn]));
    Array.prototype.forEach.call(panel.querySelectorAll("button[data-csb-code]"), function (b) {
      b.addEventListener("click", function () { open(panelPath(b.getAttribute("data-csb-slug"), b.getAttribute("data-csb-code"))); });
    });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); open(back); } });
    panel.insertBefore(panelGrip(panel), panel.firstChild);
    panelSize(panel);
    root.appendChild(panel);
    loadCourses(slug).then(function (codes) {
      if (S.code !== code || (S.at || S.view) !== slug) return;
      var rows = codes[code] || [];
      body.textContent = "";
      if (!rows.length) { body.appendChild(el("p", { cls: "csb-note", text: "No course is listed under " + code + " in the catalog on file or in COCI." })); return; }
      var both = rows.filter(function (x) { return x.listed === "Both"; }).length, cat = rows.filter(function (x) { return x.listed === "Catalog"; }).length;
      body.appendChild(el("p", { cls: "csb-note", id: "csb-panel-count", text: fmt(rows.length) + (rows.length === 1 ? " course: " : " courses: ")
        + fmt(both) + " in both the catalog and COCI, " + fmt(cat) + " in the catalog only, " + fmt(rows.length - both - cat) + " in COCI only." }));
      var mn = mintNote(row, rows, code, c.college);
      if (mn) body.appendChild(mn);
      var can = !!reviewer() && String(code).indexOf("|") < 0, bar = can ? moveBar(slug, code, body) : null, nT = 0;
      if (bar) body.appendChild(el("p", { cls: "csb-note", id: "csb-move-how", text: "To move a course that sits under the wrong code: check its box, choose the common subject code it belongs under from the list at the top of its group, and move it. The move box at the foot of this panel moves every checked course at once, and stays in view once a course is checked." }));
      var ctxOf = function (common) { return { slug: slug, code: code, can: can, n: nT++, onCheck: bar ? bar.count : null, common: common }; };
      var rowCommon = (row && savedOf(row) && savedOf(row).common) || (row && row.common) || "";
      var said = MOVE_SAID[slug + "|" + code];
      if (said) body.appendChild(el("p", { cls: "csb-ed-msg", id: "csb-move-said", role: "status", text: said }));
      /* A course group folds under its heading, and carries its own move row at its top (Sam, 2026-11-23: "add a subj
         selector and change to function to the top of each set of courses so I don't have to scroll to the bottom"). */
      var nG = 0;
      function group(head, note, table) {
        var kids = [];
        if (can) {
          var mc = moveControls(slug, code, table, "csb-move-g" + (nG++), "Move the checked courses in this group to");
          kids.push(el("div", { cls: "csb-move-top" }, [mc.row, mc.cmsg, mc.status]));
        }
        if (note) kids.push(note);
        kids.push(table);
        body.appendChild(el("section", { cls: "csb-group", "data-band": head.getAttribute("data-band") || "" }, [fold(null, head, kids)]));
      }
      function bandTable(b) {
        var part = rows.filter(function (x) { return (x.band || "") === b[0]; });
        if (!part.length) return;
        group(el("h4", { cls: "csb-band", "data-band": b[0], text: b[1] + " (" + fmt(part.length) + ")" }), null, courseTable(part, b[1] + " under " + code, ctxOf(rowCommon)));
      }
      bandTable(BANDS[0]);
      /* Noncredit courses by COCI noncredit category (Sam, 2026-11-22: "the appearance makes it seem like I am changing
         all the listed courses to AED, even though I maybe be just moving the AED out and associating them with the
         common subject VOCE"): a category's save touches that category's courses only, so each category's courses
         stand under their own heading with the code that save sets, and the local subject never changes. */
      var nc = rows.filter(function (x) { return x.band === "N" || x.band === "E"; }), groups = {};
      nc.forEach(function (x) { var k = x.category || ""; (groups[k] = groups[k] || []).push(x); });
      Object.keys(groups).sort(function (a, b) { return (a === "") - (b === "") || groups[b].length - groups[a].length || (a < b ? -1 : 1); }).forEach(function (cat) {
        var part = groups[cat], cc = row && cat ? catCode(row, cat) : null, them = part.length === 1 ? "this course" : "these " + fmt(part.length) + " courses", their = part.length === 1 ? "its" : "their";
        var head = el("h4", { cls: "csb-band", "data-band": "N", "data-category": cat || "none", text: (cat ? "Noncredit, " + catWords(cat) : "Noncredit, no category in COCI’s export") + " (" + fmt(part.length) + ")" });
        var note = el("p", { cls: "csb-note csb-cat-code", "data-category": cat || "none", text: !cat
          ? "COCI’s export gives " + them + " no credit type and no noncredit category, so no category’s save reaches " + (part.length === 1 ? "it. Move it" : "them. Move one") + " where it belongs under a code."
          : cc && cc.saved ? "Common subject code " + cc.code + ", from a person’s save on the " + catWords(cat) + " form. It applies to " + them + " only: " + their + " local subject stays " + code + ", and " + their + " M-IDs move to " + cc.code + " at the next re-mint."
          : cc ? "Not settled yet. " + catWords(cat) + "’s noncredit MQ discipline, " + cc.mq + ", has the common subject code " + cc.code + "; a Save on that form above applies it to " + them + " only. The local subject stays " + code + "."
          : "No common subject code yet: " + (cc === null && NC_MQ[cat] && NC_MQ[cat].mq_discipline ? "the noncredit MQ discipline " + NC_MQ[cat].mq_discipline + " has none" : "no noncredit MQ discipline is named for this category") + ". " + (part.length === 1 ? "This course keeps its M-ID" : "These " + fmt(part.length) + " courses keep their M-IDs") + " until one is set." });
        group(head, note, courseTable(part, (cat ? catWords(cat) : "Noncredit courses with no category") + " under " + code, ctxOf(cc ? cc.code : "")));
      });
      bandTable(BANDS[3]);
      if (bar) body.appendChild(bar.node);
    }, function (e) {
      if (S.code !== code) return;
      body.textContent = "";
      body.appendChild(el("p", { cls: "csb-note", role: "status", text: "The courses could not be read (" + (e && e.message ? e.message : e) + "). Close the panel and open it again to retry." }));
    });
  }

  var VIEW = { root: null, M: null, noted: null, H: null };
  /* The filter a count opened, said in words above the table, with the way back to every code. */
  function pickLine(rows) {
    if (!S.pick || !PICKS[S.pick]) return null;
    var n = rows.filter(inPick).length;
    return el("p", { cls: "csb-note csb-pick", id: "csb-pick", role: "status" }, ["Showing the " + fmt(n) + (n === 1 ? " code " : " codes ") + PICKS[S.pick][0] + ", of " + fmt(rows.length) + ". ",
      el("button", { type: "button", cls: "csb-word", "data-csb-pick": "", "data-csb-pick-at": S.view, text: "Show every code" })]);
  }
  function render(root, M, view) {
    VIEW.root = root; VIEW.M = M;
    ensureCss();
    view = String(view || "");
    /* <college slug>/<local code> opens that college with the code's course panel; a code may hold a slash (ES/A). */
    var seg = view.split("/"), code = "", at = "";
    view = seg[0] === ALL && seg.length >= 3 ? "" : seg[0];
    var special = view === DISAGREE || view === HELD || view === NC || view === SW || view === SRC;
    if (seg.length >= 3 && (special || seg[0] === ALL)) { at = seg[1]; code = seg.slice(2).join("/"); }
    else if (seg.length >= 2 && !special && seg[0] !== ALL) code = seg.slice(1).join("/");
    var c = view && !special ? M.by[view] : null;
    var missing = view && !special && !c ? view : "";
    S.view = missing ? "" : view;
    var pc = at ? M.by[at] : c;   /* the panel's college */
    S.code = pc && code && pc.rows.some(function (r) { return r.code === code; }) ? code : "";
    S.at = S.code && at && at !== S.view ? at : "";
    root.removeAttribute("style");
    root.textContent = "";
    var T = M.totals, all = [], F = figures(M);
    M.list.forEach(function (x) { all = all.concat(x.rows); });
    var untitled = F.untitled, nSaved = F.saved;   /* counted as the lists they open count, the live saves on top */
    var wrap = el("div", { cls: "cmn-wrap csb" });
    wrap.appendChild(trail(c ? c.college : S.view === DISAGREE ? "Codes with no title" : S.view === HELD ? "Codes the M-ID mint holds on" : S.view === NC ? "Noncredit subject titles" : S.view === SW ? "Every local code, statewide" : S.view === SRC ? "Colleges by source" : ""));
    wrap.appendChild(el("header", { cls: "cmn-top" }, [
      el("h2", { cls: "cmn-title", id: "csb-h", text: c ? "Subjects at " + c.college : S.view === DISAGREE ? "Subject codes with no title" : S.view === HELD ? "Local subject codes the M-ID mint holds on" : S.view === NC ? "Noncredit subject titles" : S.view === SW ? "Every local subject code, statewide" : S.view === SRC ? "Subjects: colleges by source" : "Subjects" }),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      el("p", { cls: "cmn-lede", text: "Step a is the common subject code each discipline shares; Step b is each college’s own name for its subject codes, read from its catalog. The Courses bot drafts each local title from the catalog’s subject heading. A curator settles the codes the catalog and the state course list disagree on." })
    ]));
    wrap.appendChild(el("p", { cls: "csb-stamp" }, [
      count(F.named, "", "titled", fmt(F.named) + " codes with a local title. Show them."), " local titles at ", el("strong", { text: fmt(F.collegesNamed) + " of " + fmt(F.colleges) }),
      " colleges with a catalog on file (" + fmt(T.courses) + " courses, ", count(T.catalog_codes, "", "incat", fmt(T.catalog_codes) + " subject codes in the catalogs. Show them."), " subject codes in the catalogs). ",
      go("#commons/subjects/" + DISAGREE, fmt(untitled) + " codes with no title"),
      " (" + fmt(F.notInCatalog) + " not in catalog, " + fmt(F.notRead) + " not read yet, " + fmt(F.blocked) + " blocked). ",
      count(F.withCommon, "", "common", fmt(F.withCommon) + " codes with a common subject code. Show them."), " codes have a common subject code, from the subject map or a person’s save. ",
      el("a", { href: "#canonical-subj4", text: "Common Subjects Reference" }), ". ",
      go("#commons/subjects/" + HELD, "Codes the M-ID mint holds on"), ". ",
      go("#commons/subjects/" + NC, "Noncredit subject titles"), ". ",
      go("#commons/subjects/" + SRC, "Colleges by source"), ".",
      nSaved ? " " : null, nSaved ? count(nSaved, "", "saved", fmt(nSaved) + " codes settled by a person’s save. Show them.") : null,
      nSaved ? (nSaved === 1 ? " code is" : " codes are") + " settled by a person’s save." : ""]));
    if (SAVE_ERR) wrap.appendChild(el("p", { cls: "csb-note", id: "csb-save-err", role: "status", text: "The saves people made could not be read (" + SAVE_ERR + "). The list below is drawn from the files alone, with the saves the daily build carried." }));
    if (missing) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: "No college with a catalog on file is named " + missing + ". Every college is below." }));
    if (c) {
      var cn = (F.by[c.slug] || {}).named || 0;
      wrap.appendChild(el("p", { cls: "csb-note", text: c.year + " catalog, read " + day(c.readAt) + ". " + (cn ? fmt(cn) + " of " + fmt(c.rows.length) + " codes have a local title." : "No subject heading is read for this catalog yet.") }));
      wrap.appendChild(collegeTable(M, [c]));
      wrap.appendChild(bandBar(c.rows));
      var pl = pickLine(c.rows); if (pl) wrap.appendChild(pl);
      wrap.appendChild(codeTable(c.rows.filter(inPick).filter(function (r) { return inBand(r, S.band); }), "Subject codes at " + c.college));
    } else if (S.view === SRC) {
      if (!VIEW.R) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: VIEW.srcError ? "The colleges by source could not be read (" + VIEW.srcError + "). Reload the tab to try again." : "Reading the colleges by source…" }));
      else wrap.appendChild(sourcesView(VIEW.R, F));
    } else if (S.view === SW) {
      if (!VIEW.W) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: VIEW.swError ? "The statewide list could not be read (" + VIEW.swError + "). Reload the tab to try again." : "Reading the statewide list…" }));
      else wrap.appendChild(statewideView(VIEW.W));
    } else if (S.view === HELD) {
      var H = VIEW.H;
      if (!H) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: VIEW.heldError ? "The held codes could not be read (" + VIEW.heldError + "). Reload the tab to try again." : "Reading the held codes…" }));
      else {
        var HT = H.totals, HN = heldNow(H);
        wrap.appendChild(el("p", { cls: "csb-note", id: "csb-held-note" }, [el("strong", { text: fmt(HN.held) }), " courses the M-ID mint holds wait on ", el("strong", { text: fmt(HN.codes) }),
          " local subject codes (" + fmt(HT.pairs) + " college-and-code pairs) that no route gives a common subject code. The top 20 codes held " + fmt(HT.top_20_release) + " of them at the last build. "
          + (HN.released ? fmt(HN.released) + (HN.released === 1 ? " course is" : " courses are") + " released by decisions saved since the build; the next nightly mint places them. " : "")
          + "A common subject code saved at a college releases that college’s held credit courses with ordinary titles. A shell title stays held whatever a person decides, and a statewide filing decides no M-ID. Each suggestion is a vote that missed the 98% floor, shown with its votes; it decides nothing."
          + (H.plan ? " From the pile mint dry run of " + day(H.plan) + "." : "")]));
        wrap.appendChild(heldTable(H));
      }
    } else if (S.view === NC) {
      var N = VIEW.N;
      if (!N) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: VIEW.ncError ? "The noncredit title list could not be read (" + VIEW.ncError + "). Reload the tab to try again." : "Reading the noncredit titles…" }));
      else {
        var NT = N.totals || {};
        wrap.appendChild(el("p", { cls: "csb-note", id: "csb-nc-note" }, [el("strong", { text: fmt(NT.titles) }), " noncredit subject titles from ", el("strong", { text: fmt(NT.headings) }),
          " subject headings in the catalogs of the four large noncredit programs: " + (N.programs || []).map(function (p) { return p.college; }).join(", ") + ". "
          + fmt(NT.titles_in_two_or_more_programs) + " titles are printed by two or more programs. " + fmt(NT.with_common_code) + " sit under a category whose noncredit MQ discipline has a common subject code, "
          + fmt(NT.category_without_code) + " under a category with no code yet, and " + fmt(NT.no_noncredit_course_in_coci) + " have no noncredit course in COCI. "
          + "The titles stand on Sam’s word of November 22, 2026, and are his to change. A category with no common subject code keeps none and is shown by name."]));
        wrap.appendChild(ncTable(N));
      }
    } else if (S.view === DISAGREE) {
      /* Every row with no title, in or out of the catalog (#3655, item 7: a code in both with no title was dropped
         by the old one-sided filter). Sam's rows first: Not in catalog, then Blocked, then Sky's Not read yet. */
      var order = { not_in_catalog: 0, blocked: 1, not_read: 2 };
      wrap.appendChild(bandBar(all.filter(untitledNow)));
      wrap.appendChild(codeTable(all.filter(untitledNow).filter(function (r) { return inBand(r, S.band); }).sort(function (a, b) {
        return (order[a.title_state] == null ? 2 : order[a.title_state]) - (order[b.title_state] == null ? 2 : order[b.title_state])
          || a.college.localeCompare(b.college) || String(a.code).localeCompare(String(b.code));
      }), "Subject codes with no title"));
    } else {
      wrap.appendChild(collegeTable(M, M.list));
      wrap.appendChild(bandBar(all));
      var pl2 = pickLine(all); if (pl2) wrap.appendChild(pl2);
      wrap.appendChild(codeTable(all.filter(inPick).filter(function (r) { return inBand(r, S.band); }), "Every subject code"));
    }
    /* Below the tables, so the lists above keep their place (S712). */
    if (S.view !== SW) wrap.appendChild(el("p", { cls: "csb-note", id: "csb-to-statewide" }, ["Every college’s codes, with a call and a confidence for each: ",
      go("#commons/subjects/" + SW, "Every local code, statewide"), "."]));
    wrap.appendChild(el("p", { cls: "csb-foot", text: "How codes are compared: " + (S.view === HELD && VIEW.H ? VIEW.H.rule : S.view === NC && VIEW.N ? VIEW.N._rule : M.rule + (M.built ? " The state course list was built " + day(M.built) + "." : "")) }));
    var page = el("div", { cls: "cmn-page" }, [wrap]);
    root.appendChild(page);
    Array.prototype.forEach.call(root.querySelectorAll("a[data-csb-go]"), function (a) {
      a.addEventListener("click", function (e) { if (e && e.preventDefault) e.preventDefault(); open(a.getAttribute("data-csb-go")); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("button[data-csb-band]"), function (b) {
      b.addEventListener("click", function () {
        S.band = b.getAttribute("data-csb-band") || "";
        render(root, M, viewPath());
        var on = root.querySelector('button[data-csb-band="' + S.band + '"]');
        if (on && on.focus) on.focus();
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll("button[data-csb-code]"), function (b) {
      b.addEventListener("click", function () {
        open(panelPath(b.getAttribute("data-csb-slug"), b.getAttribute("data-csb-code")));
        var ed = b.getAttribute("data-csb-edit") && VIEW.root.querySelector("#csb-edit-h");
        if (ed) { ed.setAttribute("tabindex", "-1"); if (ed.focus) ed.focus(); if (ed.scrollIntoView) ed.scrollIntoView({ block: "start" }); }
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll("button[data-csb-pick]"), function (b) {
      b.addEventListener("click", function () {
        S.pick = b.getAttribute("data-csb-pick") || "";
        open(b.getAttribute("data-csb-pick-at") || "", true);
        var line = VIEW.root.querySelector("#csb-pick");
        if (line) { line.setAttribute("tabindex", "-1"); if (line.focus) line.focus(); if (line.scrollIntoView) line.scrollIntoView({ block: "start" }); }
      });
    });
    panelDraw(root, M);
    return page;
  }
  /* A pick: draw it and put it in the address, which is the only place it lives. */
  /* The held view reads its own file the first time it opens, then draws again. */
  function withHeld(view) {
    if (String(view || "") === SRC && !VIEW.R) {
      return loadSources().then(function (R) { VIEW.R = R; VIEW.srcError = ""; }, function (e) { VIEW.srcError = e && e.message ? e.message : String(e); })
        .then(function () { if (VIEW.root && VIEW.M && S.view === SRC) render(VIEW.root, VIEW.M, SRC); });
    }
    if (String(view || "") === SW && !VIEW.W) {
      return loadStatewide().then(function (W) { VIEW.W = W; VIEW.swError = ""; }, function (e) { VIEW.swError = e && e.message ? e.message : String(e); })
        .then(function () { if (VIEW.root && VIEW.M && S.view === SW) render(VIEW.root, VIEW.M, SW); });
    }
    if (String(view || "") === NC && !VIEW.N) {
      return loadNc().then(function (N) { VIEW.N = N; VIEW.ncError = ""; }, function (e) { VIEW.ncError = e && e.message ? e.message : String(e); })
        .then(function () { if (VIEW.root && VIEW.M && S.view === NC) render(VIEW.root, VIEW.M, NC); });
    }
    if (String(view || "") !== HELD || VIEW.H) return Promise.resolve();
    return loadHeld().then(function (H) { VIEW.H = H; VIEW.heldError = ""; }, function (e) { VIEW.heldError = e && e.message ? e.message : String(e); })
      .then(function () { if (VIEW.root && VIEW.M && S.view === HELD) render(VIEW.root, VIEW.M, HELD); });
  }
  function open(view, keep) {
    if (!VIEW.root || !VIEW.M) return;
    /* A count's filter lasts while its surface is open; a move to another surface drops it. */
    var first = String(view || "").split("/")[0];
    if (!keep && (first === ALL ? "" : first) !== S.view) S.pick = "";
    if (first !== SRC) SRCS.pick = "needed";   /* a pick lasts the visit (Sam, 2026-10-21) */
    render(VIEW.root, VIEW.M, view || "");
    withHeld(view);
    var h = "#" + address();
    try { if (window.history && history.pushState && location.hash !== h) history.pushState(null, "", h); } catch (e) { /* the view still draws */ }
    if (VIEW.noted) VIEW.noted(String(location.hash || ""));
    var h2 = VIEW.root.querySelector(S.code ? "#csb-panel-h" : "#csb-h");
    if (h2) { h2.setAttribute("tabindex", "-1"); if (h2.focus) h2.focus(); }
  }

  function load() {
    return fetch(FILE, { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (f) {
      /* The recommendations are a second file; the list draws without them when they cannot be read. */
      return fetch(REC_FILE, { cache: "no-cache" }).then(function (r) { return r && r.ok ? r.json() : null; }, function () { return null; })
        .then(function (rf) {
          REC = recModel(rf);
          var M = model(f);
          /* The saves are a third read; a failed one leaves the list drawn from the files and says so. */
          return readSaves().then(function (m) { SAVED = m || {}; SAVE_ERR = ""; reconcile(M, m !== null); },
            function (e) { SAVED = {}; SAVE_ERR = e && e.message ? e.message : String(e); reconcile(M, false); })
            .then(function () { return readRows(MOVE_FIELD, MOVE_PREFIX).then(function (rows) { MOVES = movesModel(rows); }, function () { MOVES = {}; }); })
            .then(function () { return M; });
        });
    });
  }
  /* A sign-in or sign-out while a code is open redraws it, so Edit appears or goes without a reload. */
  try {
    window.addEventListener("cpl-session-changed", function () {
      if (VIEW.root && VIEW.M && VIEW.root.querySelector && VIEW.root.querySelector(".csb") && VIEW.root.isConnected !== false) {
        LAPSED = false;
        render(VIEW.root, VIEW.M, viewPath());
      }
    });
  } catch (e) { /* the page still draws */ }
  var cache = null;
  /* The Commons front's Subjects card asks for the same figures (commons_front.js), so the card and the tab never
     disagree: one read shared with the tab, and where the tab already holds the saves, no read at all. A held list
     that cannot be read leaves `held` null, and the card keeps the status file's line. */
  function liveFigures(opts) {
    opts = opts || {};
    cache = cache || load();
    return cache.then(function (M) {
      var F = figures(M);
      var held = loadHeld().then(function (H) { var N = heldNow(H, M); F.held = N.held; F.heldCodes = N.codes; F.released = N.released; },
        function () { F.held = null; });
      /* The statewide list is the larger read (every code at every college), so only a caller that shows its levels asks. */
      var sw = !opts.statewide ? null : (VIEW.W ? Promise.resolve(VIEW.W) : loadStatewide().then(function (W) { VIEW.W = W; return W; }))
        .then(function (W) { F.levels = levels(W, M); F.statewide = W.totals || {}; }, function () { F.levels = null; });
      return Promise.all([held, sw]).then(function () { return F; });
    }, function (e) { cache = null; throw e; });
  }
  function boot(root, view, opts) {
    opts = opts || {};
    VIEW.noted = opts.noted || null;
    if (!root) return Promise.resolve(null);
    if (VIEW.M && cache) { render(root, VIEW.M, view); return withHeld(view).then(function () { return VIEW.M; }); }
    root.textContent = "Reading the subjects…";
    cache = cache || load();
    return cache.then(function (M) {
      render(root, M, view);
      var h = "#" + address();
      if (view && location.hash !== h) { try { history.replaceState(null, "", h); } catch (e) { /* keep the view */ } if (VIEW.noted) VIEW.noted(String(location.hash || "")); }
      return withHeld(view).then(function () { return M; });
    }, function (e) {
      cache = null;
      root.textContent = "The subjects list could not be read (" + (e && e.message ? e.message : e) + "). Reload the tab to try again.";
      return null;
    });
  }

  var CSS = [
    /* The Subjects surfaces take the window's width (Sam, 2026-11-22: "the subjects surfaces should use the full width of window, which is a design standard"). */
    ".cmn-wrap.csb { grid-template-columns:minmax(0, 1fr); max-width:none; }",
    ".csb-c-act { width:6%; }",
    ".csb-num { font-weight:400; font-variant-numeric:tabular-nums; }",
    ".csb-stamp .csb-num { font-weight:700; }",
    ".csb-pick:focus { outline:none; } .csb-pick:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".csb > * { min-width:0; }",
    ".csb .csb-trail { margin:0; color:var(--cmn-muted); font-size:.92rem; }",
    ".csb a { color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; }",
    ".csb a:focus-visible, .csb-wrap:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".csb-trail a, .csb-stamp a, .csb-table a { display:inline-block; min-height:24px; line-height:24px; }",
    ".csb-stamp, .csb-note { margin:0; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".csb-stamp { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-left:4px solid var(--cmn-gold); border-radius:12px; padding:12px 16px; }",
    ".csb-stamp strong { color:var(--cmn-heading); }",
    ".csb-wrap { overflow-x:auto; max-height:70vh; overflow-y:auto; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; }",
    ".csb-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:.93rem; }",
    ".csb-table th, .csb-table td { text-align:left; vertical-align:top; padding:8px 12px; border-bottom:1px solid var(--cmn-line-soft); color:var(--cmn-ink); overflow-wrap:anywhere; }",
    ".csb-table thead th { position:sticky; top:0; background:var(--cmn-surface); font-size:.75rem; letter-spacing:.04em; text-transform:uppercase; color:var(--cmn-muted); font-weight:700; }",
    ".csb-table tbody th { font-weight:600; }",
    ".csb-courses .csb-c-box { width:44px; } .csb-courses input[type=checkbox] { width:20px; height:20px; margin:2px 0; accent-color:var(--cmn-accent); }",
    ".csb-vh { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }",
    ".csb-table thead th.csb-th { position:sticky; padding-right:20px; }",
    ".csb-sort { all:unset; box-sizing:border-box; cursor:pointer; min-height:24px; font:inherit; letter-spacing:inherit; text-transform:inherit; color:inherit; text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }",
    ".csb-sort:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".csb-th[aria-sort='ascending'] .csb-sort, .csb-th[aria-sort='descending'] .csb-sort { color:var(--cmn-heading); }",
    ".csw-chips { display:flex; flex-wrap:wrap; gap:6px 16px; margin:8px 0; }",
    ".csw-chips button[aria-pressed=\"true\"] { color:var(--cmn-heading); font-weight:700; text-decoration-thickness:2px; }",
    ".csw input[type=search] { min-height:32px; padding:4px 8px; width:min(420px, 100%); border:1px solid var(--cmn-line); border-radius:8px; font:inherit; color:var(--cmn-ink); background:var(--cmn-surface); }",
    ".csw select { min-height:28px; max-width:100%; font:inherit; color:var(--cmn-ink); background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:6px; }",
    ".csw-change { display:block; margin-top:4px; }",
    ".csb-table.csw-table { min-width:56rem; }",
    ".csb-grip { position:absolute; top:0; right:0; width:14px; height:100%; min-height:24px; cursor:col-resize; touch-action:none; z-index:3; }",
    ".csb-grip:hover, .csb-grip:focus-visible { background:var(--cmn-line); }",
    ".csb-grip:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:-2px; }",
    ".csb-table td { font-variant-numeric:tabular-nums; }",
    ".csb-c-wide { width:24%; }",
    ".csb-c-code { width:12%; } .csb-c-num { width:10%; } .csb-c-mid { width:20%; } .csb-c-ev { width:38%; }",
    ".csb-sub { display:block; font-weight:400; color:var(--cmn-muted); font-size:.85rem; }",
    ".csb-ev p { margin:0 0 4px; } .csb-ev strong { color:var(--cmn-heading); font-weight:600; }",
    ".csb-tba { color:var(--cmn-muted); }",
    ".csb-src-c-college { width:15%; } .csb-src-c-plat { width:10%; } .csb-src-c-n { width:7%; } .csb-src-c-way { width:11.5%; } .csb-src-c-next { width:15%; }",
    ".csb-src .csb-table th, .csb-src .csb-table td, .csb-src .csb-sort { overflow-wrap:normal; word-break:normal; }",
    ".csb-src .csb-table th, .csb-src .csb-table td { padding-left:8px; } .csb-src .csb-table thead th.csb-th { padding-right:14px; }",
    ".csb-src-read { font-weight:700; color:var(--cmn-heading); }",
    ".csb-src-on { font-weight:600; color:var(--cmn-ink-2); }",
    ".csb-rec { color:var(--cmn-ink-2); margin-top:4px; } .csb-rec strong { color:var(--cmn-heading); font-weight:600; }",
    ".csb-chip { display:inline-block; font-size:.78rem; font-weight:600; color:var(--cmn-ink-2); border:1px solid var(--cmn-line); border-radius:999px; padding:1px 9px; background:var(--cmn-surface); white-space:nowrap; cursor:help; }",
    ".csb-chip[data-state='not_in_catalog'] { color:var(--cmn-heading); border-color:var(--cmn-accent); }",
    ".csb-chip:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".csb-word { font:inherit; font-weight:600; color:var(--cmn-link); background:none; border:0; padding:0; min-width:24px; min-height:24px; line-height:24px; text-decoration:underline; text-underline-offset:3px; cursor:pointer; overflow-wrap:anywhere; text-align:left; }",
    ".csb-bands { margin:0; display:flex; flex-wrap:wrap; gap:6px 18px; align-items:baseline; color:var(--cmn-ink-2); }",
    ".csb-bands .csb-word[aria-pressed='true'] { color:var(--cmn-heading); text-decoration:none; border-bottom:2px solid var(--cmn-accent); }",
    ".csb-word:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".csb-panel { position:fixed; top:0; right:0; bottom:0; z-index:1000; display:flex; width:min(620px, calc(100vw - 24px)); background:var(--cmn-dialog, var(--cmn-surface)); border-left:1px solid var(--cmn-line); box-shadow:-12px 0 32px color-mix(in srgb, var(--cmn-heading) 16%, transparent); color:var(--cmn-ink); }",
    ".csb-panel-in { flex:1 1 auto; min-width:0; overflow-y:auto; overscroll-behavior:contain; display:grid; gap:12px; align-content:start; padding:0 max(18px, env(safe-area-inset-right, 0px)) 24px 18px; }",
    ".csb-panel-head { position:sticky; top:0; z-index:2; display:grid; gap:6px; margin:0 calc(-1 * max(18px, env(safe-area-inset-right, 0px))) 0 -18px; padding:calc(14px + env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 10px 18px; background:var(--cmn-dialog, var(--cmn-surface)); border-bottom:1px solid var(--cmn-line); }",
    ".csb-panel-top { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }",
    ".csb-pgrip { flex:0 0 12px; align-self:stretch; cursor:col-resize; touch-action:none; background:transparent; }",
    ".csb-pgrip:hover, .csb-pgrip:focus-visible { background:var(--cmn-line); }",
    ".csb-pgrip:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:-2px; }",
    "@media (max-width: 560px) { .csb-panel { width:calc(100vw - 12px) !important; } .csb-pgrip { display:none; } }",
    ".csb-eyebrow { margin:0; font-size:.82rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--cmn-muted); }",
    ".csb-panel h3 { margin:0; font-family:var(--cmn-serif); font-size:clamp(1.15rem, 1rem + .6vw, 1.4rem); color:var(--cmn-title, var(--cmn-heading)); overflow-wrap:anywhere; }",
    ".csb-panel h3:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".csb-band { margin:6px 0 0; font-size:1rem; color:var(--cmn-heading); }",
    "#csb-panel-body { display:grid; gap:10px; min-width:0; }",
    ".csb-move-bar.csb-move-live { position:sticky; bottom:0; z-index:2; background:var(--cmn-dialog, var(--cmn-surface)); box-shadow:0 -8px 20px color-mix(in srgb, var(--cmn-heading) 14%, transparent); }",
    ".csb-move-bar.csb-move-live .csb-move-help { display:none; }",
    ".csb-fold-row { margin:2px 0 6px; display:flex; flex-wrap:wrap; gap:4px 18px; }",
    ".csb-fold > summary { cursor:pointer; list-style-position:outside; margin-left:1.1em; min-height:24px; }",
    ".csb-fold > summary > h4 { display:inline; margin:0; }",
    ".csb-fold[open] > summary { margin-bottom:8px; }",
    ".csb-group { display:grid; gap:8px; min-width:0; }",
    ".csb-move-top { display:grid; gap:4px; padding:8px 10px; border:1px solid var(--cmn-line-soft); border-radius:10px; margin-bottom:8px; }",
    ".csb-move-row { display:flex; flex-wrap:wrap; align-items:center; gap:6px 10px; }",
    ".csb-move-row label { font-weight:600; color:var(--cmn-heading); }",
    ".csb-move-pick { max-width:100%; min-height:32px; }",
    ".csb-wrap-in { max-height:none; }",
    ".csb-courses { font-size:.88rem; } .csb-courses .csb-c-num { width:16%; } .csb-courses .csb-c-code { width:16%; } .csb-courses .csb-c-mid { width:30%; }",
    ".csb-nc-cat th { background:var(--cmn-surface-2, var(--cmn-surface)); color:var(--cmn-heading); font-weight:700; }",
    ".csb-foot { margin:0; color:var(--cmn-muted); font-size:.85rem; max-width:var(--cpl-measure,none); }",
    ".csb-saved { margin-top:4px; color:var(--cmn-ink-2); }",
    ".csb-edit { display:grid; gap:8px; padding:12px 14px; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:10px; min-width:0; }",
    ".csb-edit-head { margin:0; font-size:1rem; color:var(--cmn-heading); }",
    ".csb-ed-field { display:grid; gap:4px; min-width:0; }",
    ".csb-ed-field label { font-weight:600; color:var(--cmn-heading); font-size:.92rem; }",
    ".csb-input { font:inherit; font-size:.95rem; color:var(--cmn-ink); background:var(--cmn-surface); border:1px solid var(--cmn-muted); border-radius:6px; padding:6px 8px; min-height:32px; box-sizing:border-box; width:100%; max-width:28rem; }",
    ".csb-input-code { max-width:8rem; text-transform:uppercase; letter-spacing:.04em; }",
    ".csb-input:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".csb-ed-row { margin:0; display:flex; flex-wrap:wrap; gap:6px 18px; align-items:baseline; }",
    ".csb-ed-msg { margin:0; color:var(--cmn-ink-2); font-size:.9rem; max-width:var(--cpl-measure,none); }",
    ".csb-ed-msg:empty { display:none; }",
    ".csb-ed-msg:focus { outline:none; } .csb-ed-msg:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".csb-word:disabled { color:var(--cmn-muted); cursor:default; }",
    ".csb-nc-head { margin-top:6px; }",
    ".csb-nc-form { display:grid; gap:8px; min-width:0; margin:0; padding:8px 12px 10px; border:1px solid var(--cmn-line); border-radius:8px; }",
    ".csb-nc-form legend { padding:0 4px; font-weight:600; color:var(--cmn-heading); font-size:.95rem; overflow-wrap:anywhere; }",
    ".csb-ed-ro { margin:0; color:var(--cmn-ink-2); font-size:.92rem; max-width:var(--cpl-measure,none); overflow-wrap:anywhere; } .csb-ed-ro strong { color:var(--cmn-heading); font-weight:600; }",
    "@media (max-width: 560px) { .csb-table { min-width:36rem; } .csb-codes { min-width:44rem; } .csb-held { min-width:44rem; } .csb-nc { min-width:40rem; } .csb-courses { min-width:26rem; } .csb-table th, .csb-table td { padding:8px; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("csb-css")) return;
    document.head.appendChild(el("style", { id: "csb-css", text: CSS }));
  }

  window.CPL_COMMONS_SUBJECTS = {
    boot: boot, render: render, model: model, figures: figures, liveFigures: liveFigures, heldNow: heldNow, levels: levels, heldModel: heldModel, recModel: recModel, REC_FILE: REC_FILE,
    _recs: function (f) { REC = recModel(f); }, address: address, open: open, load: load, FILE: FILE, HELD_FILE: HELD_FILE, SIDES: SIDES, CSS: CSS,
    _state: S, COURSE_DIR: COURSE_DIR, bandOf: bandOf, saveKey: saveKey, titleCase: titleCase, savesModel: savesModel,
    SAVE_FIELD: SAVE_FIELD, SAVE_PREFIX: SAVE_PREFIX, dominantOf: dominantOf,
    _reset: function () { SAVED = {}; SAVE_ERR = ""; SAID = {}; LAPSED = false; COMMON = null; TC = null; NC_SLUGS = {}; cache = null; heldCache = null; ncCache = null; courseCache = {}; VIEW.M = null; VIEW.H = null; VIEW.N = null; S.view = ""; S.code = ""; S.at = ""; S.band = ""; S.pick = ""; }
  };
})();
