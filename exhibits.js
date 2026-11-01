// exhibits.js — the Exhibits tab: what a MAP exhibit is called, what credit it carries, who could adopt it.
//
// Sam, Open Asks Sheet 147 card 1 (2026-10-31, "merge"): one Exhibits tab in the Catalog Commons replaces
// the Common Exhibit Reference and Exhibit Adoption, and Review is built first; the two tabs stay until
// this one carries everything they show. The card is the mock-up at version 26
// (docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html) and his words on it (2026-10-30): "I do
// like your 3 categories"; "shouldn't the proposed canonical title always be the focus and the differing
// titles below it in small print"; "call it Local titles"; "chip showing the status of CER step" with a
// hover; "the filters for status could be in the higher cards"; "change Accept to Keep Current Title and
// Change the title to Changed to Proposed Title...but what if we want to edit the proposed title?"; "can
// we shoot to a certain exhibit to set the title using a search bar?"; "When college could adopt chips
// clicked they should open with the courses and Request Quick Adopt links". Lane:
// docs/reference/lanes/cer-procedures.md.
//
// What it reads:
//   kb/exhibits_review.json          the held titles, written nightly by kb/_build_exhibits_review.py
//   kb/exhibits_review_courses.json  the courses behind a could-adopt chip, fetched on the first click
//   kb/exhibits_adoption.json        Exhibit Adoption's per-credential view (Sheet 147 step 3), read with the
//                                    Credentials view: what each college articulated, the courses each
//                                    could-adopt college already teaches, the exhibits, the field, the peer median
//   map_links.js                     MAP's verified exhibits and who built each, for Request Quick Adopt
//   exhibit_title_students()         students per title: an allowed reviewer only, k=10 applied in the
//                                    database (the student-detail ADR), so this page never holds a count
//                                    under ten. Without a reviewer sign-in the queue keeps the builder's
//                                    order, the most widely articulated title first.
// What it writes, signed in as a reviewer: the CER's own kb_curation rows, _UNCLASSIFIED::<local title>
// with unified_title_assignment and issuing_agency_assignment, exactly as the CER's Unclassified Save
// writes them. The nightly fold adds them to the reference. A conflict's Change to Proposed Title clears
// the saved assignment (the CER's "Keep the reference's title"); re-keying a person-reviewed entry stays
// a session's reviewed change.
//
// The buttons, read from Sam's words: the current title is the exhibit's latest decision (its local title,
// or the title a person saved for a conflict); the proposed title is the box, which he may edit first.
//
// Credentials (the credential panel, Sheet 147's order, step 2): every credential in the reference, from
// credential_reference_data.js (loaded on the first visit to the view) and the live _CREDENTIAL_REVIEW::
// rows, so a save shows at once. Sam, 2026-10-30: "the issuer for an electrician apprentice is the
// national trade union and the training site is the local union school house"; "could be multiple
// training sites"; "would want to be able to set and change both issuer and training site from here".
// The panel's Save writes, under _CREDENTIAL_REVIEW::<credential>, issuing_agency_override and
// training_sites_override (a JSON list of {site, college}, college optional), with training_agency_override
// set to the sites joined, so a reader that takes one trainer (the bake, MAP export, the CER tab) stays
// right. kb/_apply_credential_review.py resolves the two the way resolveSites() does here.
//
// Another look (Sam, 2026-10-31, after his pass through Review): "build an audit process as part of the
// overall procedure to look for opportunities to take another look at exhibits that look the same but
// still have differences and things we can fold and correct". kb/_sweep_exhibit_titles.py writes
// kb/exhibits_sweep.json nightly: cards of titles already in the reference, each with its proposed title,
// why, and the local titles it moves. Change to Proposed Title saves each local title's _UNCLASSIFIED::
// assignment and issuer as Review does, and unified_title_supersedes, the title it replaces: the fold
// re-points a title a person approved only while that title still stands. Keep Current Title saves
// title_sweep_kept, the proposal declined, which the sweep never shows again.
//
// Sam, 2026-10-31, at the last card of his pass, a conflict that would not save: "anything with an ASE cert in
// the title should auto-populate the issuer and allow me to accept it. When I enter text in the issuer or
// trainer box, it should search for text matches for existing items and present option to click with each
// text entry". So a conflict card's Change and Keep save the way Another look does, with
// unified_title_supersedes naming the reviewed title (the fold re-points it only while that title still
// stands); a title that is an ASE certification fills its issuer box with ASE until he types his own (a course
// aligned to a test keeps its college or school, Sam's later word that day); and the issuer
// and training-site boxes offer the names already in the reference (kb/exhibits_review.json's issuers and
// sites, and the credential view's rows once read).
//
// Rules (Sam, 2026-10-31: "can you add a link to a view of all the rules used to suggest or fold exhibit
// titles?"): the view lists every procedure in kb/cer_procedures.json (its words, who set it and when, what
// it settled and held on the last procedures run, kb/cer_procedures_out/latest.json) and Another look's
// rules (kb/exhibits_sweep.json), then the rules sent to the routine. Linked from the views row and from
// Another look's rule filter, at #exhibits/rules.
//
// Rules sent to the routine (Sam, Open Asks Sheet 149 card 2, 2026-10-31, "routine": "Can we, should we be able to run this added
// rule from the Exhibits tab rather than a session? ... Or have an agent run the rule and return the results?").
// Teach a rule's Send to the routine writes a request row, _CER_PROCEDURE_REQUEST::<when>-<tag> with
// cer_procedure_request (his words, the example title, the title it should read and its issuer, as JSON).
// The CPL queue routine's first firing of the night (step 7 of docs/reference/scheduled_sessions.md) builds
// the procedure off in kb/cer_procedures.json, merges it, and writes cer_procedure_built back: the dry run of
// kb/_cer_procedures.py --try and the pull request, or why it could not. Turn on and Discard write
// cer_procedure_switch; the routine's next firing sets the procedure on, or takes it out. An off rule
// changes no answer, so nothing reaches a college until Turn on. The view reads the rows (public, as every
// kb_curation row is) and the store, which says whether a procedure is on. Governance: DR-07.
//
// Loaded by the tab's boot block (both HTMLs, Rule 4). First Light tokens only, words for every control.
(function () {
  "use strict";

  var ROOT_ID = "exhibits-root";
  var DATA_URL = "kb/exhibits_review.json";
  var COURSES_URL = "kb/exhibits_review_courses.json";
  var ADOPTION_URL = "kb/exhibits_adoption.json";
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var UNCLASS_PREFIX = "_UNCLASSIFIED::";
  var FIELD_TITLE = "unified_title_assignment";
  var FIELD_ISSUER = "issuing_agency_assignment";
  var CRED_DATA = "credential_reference_data.js";
  var CRED_PREFIX = "_CREDENTIAL_REVIEW::";
  var FIELD_CRED_ISSUER = "issuing_agency_override";
  var FIELD_CRED_TRAINER = "training_agency_override";
  var FIELD_CRED_SITES = "training_sites_override";
  // The List view (Sam, 2026-11-01): a title edited there saves the rename field the reference already reads
  // (credential_reference.js: display-only until the daily dry-run projects it and the reviewed apply re-keys).
  var FIELD_CRED_TITLE = "unified_title_override";
  // Your flag (Sam, 2026-11-01: "a flag for any row that persists until I clear it"): one row per credential, the
  // value the time it was set; clearing writes "" (an upsert, never a delete, so a refused write cannot pass as done).
  var FIELD_LIST_FLAG = "list_flag";
  // Re-analyze my changes: one request row a press, worked by the CPL queue routine (scheduled_sessions step 9).
  var REANALYSIS_PREFIX = "_EXHIBIT_REANALYSIS::";
  var FIELD_REANALYSIS = "exhibit_reanalysis_request";
  var COLLISIONS_URL = "kb/cred_rename_dryrun/collisions.json";
  var CRED_PAGE = 50;
  var IN_REF = "In the reference";
  var MAP_PAGE = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses";
  var MAP_VIEW = "&View=Non-Military";
  var CHIP_MAX = 10;
  var CONFLICT = "Conflict with the reference";
  var STEPS = ["Proposed", "Wording check", "Two issuers", CONFLICT];
  var SWEEP = "Another look";
  var SWEEP_URL = "kb/exhibits_sweep.json";
  var FIELD_SUPERSEDES = "unified_title_supersedes";
  var FIELD_KEPT = "title_sweep_kept";
  var ASE_ISSUER = "National Institute for Automotive Service Excellence (ASE)";
  /* The certification itself opens with ASE (ASE A8 — Engine Performance). A course aligned to a test names it in
     parentheses and keeps its college or school as issuer (Sam, 2026-10-31: "Agree on your call on the college as
     issuer"). */
  var ASE_CERT_TITLE = /^\s*(?:ASE\b|Automotive Services? Excellence\b|National Institute for Automotive Service Excellence\b)/i;
  var OPTS_MAX = 8;
  var REQ_PREFIX = "_CER_PROCEDURE_REQUEST::";
  var FIELD_REQ = "cer_procedure_request";
  var FIELD_BUILT = "cer_procedure_built";
  var FIELD_SWITCH = "cer_procedure_switch";
  var PROCEDURES_URL = "kb/cer_procedures.json";
  var PROC_REPORT_URL = "kb/cer_procedures_out/latest.json";
  var PR_BASE = "https://github.com/CPL-Initiative/cpl-project-tracker/pull/";
  var ROUTINE_WHEN = "The CPL queue routine's first run of the night, at 10:12 PM Pacific";
  /* What each CER step means, in a sentence or two (the chip's hover; the mock-up's words). */
  var TIPS = {
    "": "Every held title, most students first.",
    "Proposed": "A rule or the classifier suggested a title, but not surely enough to save it. It waits for a person to keep, change or edit it.",
    "Wording check": "The suggested title is likely right, but a word in it failed a quality check: a leftover course code, a dangling word or a method word. A person confirms it.",
    "Two issuers": "The suggested title would join this exhibit to a credential the reference gives another issuer. A person decides whether they are one credential or two.",
    "Saved, not folded": "A person or a rule saved a title. The nightly run adds it to the reference.",
    "In the reference": "Settled. The exhibit sits under its canonical credential, and the tabs and public pages show that name.",
    "Conflict with the reference": "The title saved for this exhibit disagrees with one a person already approved. The nightly run never overwrites a person's decision, so it waits for you.",
    "Another look": "Titles already in the reference that still differ from their neighbors: an ASE test to name, Roman numerals, a language level, a course number left in, a level that disagrees, or two titles to fold. Built nightly."
  };

  var state = {
    data: null, error: null, filter: "", cur: 0,
    students: null, studentsWord: "", total: null,
    done: {}, note: "", courses: null, coursesErr: false, drafts: {}, teachDraft: "",
    // Back (Sam, 2026-10-31): the cards decided or skipped this visit, newest last, as {raw, saved}.
    history: [], bulkAsk: false, bulkBusy: false,
    teach: false, openCollege: null, showAllArt: false, showAllCould: false, showUnder: false,
    view: "review",
    // Rules sent to the routine: the request rows grouped by request, and the procedures store.
    rq: { rows: null, store: null, report: null, error: null, busy: "", note: "" },
    // Another look: the sweep's cards, decided this visit by card id.
    sw: { data: null, error: null, rule: "", cur: 0, done: {}, saved: {}, drafts: {}, issuers: {}, history: [], bulkAsk: false, bulkBusy: false },
    cs: { rows: null, error: null, loading: null, overlay: {}, overlayOk: null, q: "", sel: null, limit: CRED_PAGE,
          drafts: {}, note: "", showTitles: false, showArt: false, showCould: false, showRecords: false,
          adopt: null, adoptErr: false, open: null, links: null }
  };

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "cls") e.className = attrs[k];
      else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function word(text, onClick, attrs) {
    var b = el("button", Object.assign({ type: "button", cls: "exh-w" }, attrs || {}), [text]);
    b.addEventListener("click", onClick);
    return b;
  }
  function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  /* "2026-10-31T07:47:00Z" -> "2026-10-31 07:47Z" */
  function stamp(v) {
    var m = /^(\d{4}-\d\d-\d\d)T(\d\d:\d\d)/.exec(v || "");
    return m ? m[1] + " " + m[2] + "Z" : (v || "");
  }
  function pct(n, of) { return of ? Math.round(1000 * n / of) / 10 : 0; }
  function college(i) { return ((state.data && state.data.colleges) || [])[i] || ""; }
  function shortName(name) {
    return typeof window.cplCollegeShort === "function" ? (window.cplCollegeShort(name) || name) : name;
  }
  function shortList(idx) {
    var names = (idx || []).map(function (i) { return shortName(college(i)); }).filter(Boolean);
    if (!names.length) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + " and " + names[1];
    if (names.length === 3) return names[0] + ", " + names[1] + " and " + names[2];
    return names[0] + ", " + names[1] + " and " + (names.length - 2) + " more";
  }
  function mapUrl(id) { return MAP_PAGE + "?Exhibit=" + encodeURIComponent(id) + MAP_VIEW; }
  function whoBuilt(h) { return h.colleges && h.colleges.length ? h.colleges : h.art; }
  /* The issuer a title brings with it: an ASE certification's title names ASE, ahead of the proposal's issuer;
     what a person typed in the box wins over both. */
  function aseIssuer(title) { return ASE_CERT_TITLE.test(title || "") ? ASE_ISSUER : ""; }
  function issuerFor(title, issuer) { return aseIssuer(title) || issuer || ""; }

  /* ── names to pick from: the issuers and training sites already in the reference ── */
  function nameOptions(kind) {
    var seen = {}, out = [];
    function add(v) {
      v = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
      var k = v.toLowerCase();
      if (v && !seen[k]) { seen[k] = true; out.push(v); }
    }
    var d = state.data || {}, ov = state.cs.overlay || {};
    (d[kind] || []).forEach(add);
    if (kind === "issuers") {
      add(ASE_ISSUER);
      (d.held || []).forEach(function (h) { add(h.issuer); });
      (state.cs.rows || []).forEach(function (r) { add(r.issuer); (r.issuers || []).forEach(add); });
      Object.keys(ov).forEach(function (t) { add(ov[t].issuer); });
    } else {
      (d.held || []).forEach(function (h) { (h.trainers || []).forEach(function (t) { add(String(t).replace(/ \([^)]*\)$/, "")); }); });
      (state.cs.rows || []).forEach(function (r) { add(r.trainer); (credCurrent(r).sites || []).forEach(function (x) { add(x.site); }); });
    }
    return out;
  }
  /* The names holding what was typed: a match at the start of a word first, then the rest, A to Z. */
  function nameMatches(options, typed, max) {
    var q = String(typed || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (q.length < 2) return [];
    var starts = [], inside = [];
    options.forEach(function (o) {
      var l = o.toLowerCase(), i = l.indexOf(q);
      if (i < 0 || l === q) return;
      (i === 0 || /[\s(\/-]/.test(l.charAt(i - 1)) ? starts : inside).push(o);
    });
    function az(a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; }
    return starts.sort(az).concat(inside.sort(az)).slice(0, max || OPTS_MAX);
  }
  /* A list of matching names under a box, one word each, redrawn as the box is typed in; a click fills the box. */
  function suggest(input, kind, onPick) {
    var id = input.id + "-opts";
    var list = el("ul", { cls: "exh-opts", id: id, "aria-label": kind === "issuers" ? "Issuers in the reference" : "Training sites in the reference" });
    list.hidden = true;
    input.setAttribute("aria-controls", id);
    function close() { list.hidden = true; }
    function draw() {
      while (list.firstChild) list.removeChild(list.firstChild);
      var hits = nameMatches(nameOptions(kind), input.value);
      hits.forEach(function (t, k) {
        var b = el("button", { type: "button", cls: "exh-opt" }, [t]);
        b.addEventListener("mousedown", function (e) { e.preventDefault(); });
        b.addEventListener("click", function () { input.value = t; close(); if (onPick) onPick(t); input.focus(); });
        b.addEventListener("keydown", function (e) {
          var bs = list.querySelectorAll("button");
          if (e.key === "ArrowDown" && bs[k + 1]) { e.preventDefault(); bs[k + 1].focus(); }
          else if (e.key === "ArrowUp") { e.preventDefault(); (bs[k - 1] || input).focus(); }
          else if (e.key === "Escape") { e.preventDefault(); close(); input.focus(); }
        });
        list.appendChild(el("li", null, [b]));
      });
      list.hidden = !hits.length;
    }
    input.addEventListener("input", draw);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" && !list.hidden) { e.preventDefault(); var f = list.querySelector("button"); if (f) f.focus(); }
      else if (e.key === "Escape") close();
    });
    input.addEventListener("blur", function () {
      setTimeout(function () { if (!list.contains(document.activeElement) && document.activeElement !== input) close(); }, 150);
    });
    return list;
  }

  /* ── the queue ── */
  function studentsOf(h) { return state.students ? state.students[h._i] : null; }
  /* Could adopt names a college only with a course behind it: the aligned identity's, else one mapped to the
     proposed credential (the builder's courses_key). A file built before 2026-10-31 carried Exhibit Adoption's
     TOP and C-ID overlap as a fallback, off every screen since Sam's ruling of 2026-09-24 (Rule 7): never shown. */
  function coursesKey(h) { return h.courses_key || (h.same ? h.aligned_id : ""); }
  function couldOf(h) { return coursesKey(h) ? h.could || [] : []; }
  /* Most students first: a count of ten or more by its size, then the cells under ten, then none. */
  function rank(h) {
    var s = studentsOf(h);
    if (!s) return -1;
    if (s.suppressed) return 5;
    return s.students || 0;
  }
  function shown() {
    if (!state.data) return [];
    var list = state.data.held.filter(function (h) {
      return !state.done[h.raw] && (!state.filter || h.step === state.filter);
    });
    if (state.students) {
      list = list.slice().sort(function (a, b) { return rank(b) - rank(a) || a._i - b._i; });
    }
    return list;
  }
  function stepCount(step) {
    if (!state.data) return 0;
    return state.data.held.filter(function (h) { return !state.done[h.raw] && (!step || h.step === step); }).length;
  }

  /* ── reads ── */
  function load() {
    return fetch(DATA_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        (d.held || []).forEach(function (h, i) { h._i = i; });
        state.data = d; state.error = null;
        return d;
      })
      .catch(function (e) { state.error = String(e && e.message || e); state.data = null; });
  }
  function session() {
    var S = window.CPL_SESSION;
    if (!S || typeof S.ensureFresh !== "function") return Promise.resolve(null);
    return Promise.resolve(S.ensureFresh()).then(function (s) { return s && s.access_token ? s : null; })
      .catch(function () { return null; });
  }
  function headers(sess, extra) {
    var h = { "apikey": anonKey(), "Authorization": "Bearer " + sess.access_token, "Content-Type": "application/json" };
    for (var k in (extra || {})) h[k] = extra[k];
    return h;
  }
  function anonKey() {
    var S = window.CPL_SESSION;
    var h = S && typeof S.authHeaders === "function" ? S.authHeaders() : null;
    return (h && h.apikey) || "";
  }
  /* Students per title, from the reviewer-only function; each title's exhibits counted together, and
     every held exhibit together under "*" for the Students waiting tile. */
  function loadStudents() {
    if (!state.data) return Promise.resolve();
    return session().then(function (sess) {
      if (!sess) { state.students = null; state.total = null; state.studentsWord = "signin"; return; }
      var keys = [], ids = [];
      state.data.held.forEach(function (h) {
        (h.ids || []).forEach(function (id) { keys.push(String(h._i)); ids.push(id); keys.push("*"); ids.push(id); });
      });
      return fetch(SUPABASE_URL + "/rest/v1/rpc/exhibit_title_students", {
        method: "POST", headers: headers(sess), body: JSON.stringify({ p_keys: keys, p_ids: ids })
      }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (rows) {
          if (!rows.length && ids.length) { state.students = null; state.studentsWord = "refused"; return; }
          var by = {};
          rows.forEach(function (row) {
            if (row.key === "*") state.total = row;
            else by[row.key] = { students: row.students, suppressed: !!row.suppressed };
          });
          state.data.held.forEach(function (h) {
            if (!by[h._i]) by[h._i] = { students: 0, suppressed: false };
          });
          state.students = by; state.studentsWord = "ok"; state.cur = 0;
        })
        .catch(function () { state.students = null; state.studentsWord = "error"; });
    });
  }
  function loadSweep() {
    return fetch(SWEEP_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { state.sw.data = d; state.sw.error = null; })
      .catch(function (e) { state.sw.data = null; state.sw.error = String(e && e.message || e); });
  }
  function sweepRule(id) {
    var rules = (state.sw.data && state.sw.data.rules) || [];
    for (var i = 0; i < rules.length; i++) if (rules[i].id === id) return rules[i];
    return { id: id, label: id, tip: "" };
  }
  function sweepShown(rule) {
    var d = state.sw.data;
    if (!d) return [];
    var r = rule == null ? state.sw.rule : rule;
    return (d.cards || []).filter(function (c) { return !state.sw.done[c.id] && (!r || c.rules[0] === r); });
  }
  function loadCourses() {
    if (state.courses || state.coursesErr) return Promise.resolve();
    return fetch(COURSES_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { state.courses = d; })
      .catch(function () { state.coursesErr = true; });
  }

  /* Rules sent to the routine: every _CER_PROCEDURE_REQUEST:: row (a handful; one page) and the store. */
  function parseJson(v) {
    if (v == null || v === "") return null;
    if (typeof v === "object") return v;
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  function loadRules() {
    var key = anonKey();
    var url = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,reviewer_email,reviewed_at"
      + "&course_id=like." + encodeURIComponent(REQ_PREFIX) + "%25"
      + "&field=in.(" + [FIELD_REQ, FIELD_BUILT, FIELD_SWITCH].join(",") + ")&order=course_id.asc";
    var rows = key
      ? fetch(url, { headers: { "apikey": key, "Range-Unit": "items", "Range": "0-999" } })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      : Promise.reject(new Error("no key"));
    var store = fetch(PROCEDURES_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { return d.procedures || []; })
      .catch(function () { return null; });
    var report = fetch(PROC_REPORT_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function () { return null; });
    store.then(function (st) { state.rq.store = st; });
    report.then(function (rp) { state.rq.report = rp; });
    return Promise.all([rows, store, report]).then(function (got) {
      state.rq.store = got[1]; state.rq.report = got[2]; state.rq.rows = requestRows(got[0], got[1]); state.rq.error = null;
    }).catch(function (e) {
      state.rq.rows = null; state.rq.error = String(e && e.message || e);
      return Promise.all([store, report]).then(function (got) { state.rq.store = got[0]; state.rq.report = got[1]; });
    });
  }
  /* The rows grouped into one record per request, newest first, each with its state. */
  function requestRows(rows, store) {
    var by = {};
    (rows || []).forEach(function (row) {
      var id = row.course_id || "";
      if (id.indexOf(REQ_PREFIX) !== 0) return;
      var r = by[id] = by[id] || { id: id };
      if (row.field === FIELD_REQ) { r.ask = parseJson(row.value) || { words: String(row.value || "") }; r.by = row.reviewer_email || ""; r.at = row.reviewed_at || ""; }
      else if (row.field === FIELD_BUILT) { r.built = parseJson(row.value) || {}; r.builtAt = row.reviewed_at || ""; }
      else if (row.field === FIELD_SWITCH) { r.sw = String(row.value || ""); r.swBy = row.reviewer_email || ""; r.swAt = row.reviewed_at || ""; }
    });
    var procs = {};
    (store || []).forEach(function (p) { if (p && p.request) procs[p.request] = p; });
    return Object.keys(by).map(function (id) { return by[id]; }).filter(function (r) { return r.ask; })
      .map(function (r) { r.proc = procs[r.id] || null; r.state = requestState(r, store != null); return r; })
      .sort(function (a, b) { return a.id < b.id ? 1 : a.id > b.id ? -1 : 0; });
  }
  /* waiting · could-not · built (Turn on or Discard) · turning-on · on · discarding · discarded. The store
     settles on and gone; a switch row shows the choice until the routine carries it out. */
  function requestState(r, storeRead) {
    if (r.proc && r.proc.on) return "on";
    if (r.sw === "on") return "turning-on";
    if (r.sw === "discard") return r.proc ? "discarding" : "discarded";
    if (r.built && r.built.could_not) return "could-not";
    if (r.proc || (r.built && r.built.procedure)) return storeRead || r.proc ? "built" : "built";
    return "waiting";
  }
  function requestsWaitingOnYou() {
    return (state.rq.rows || []).filter(function (r) { return r.state === "built"; }).length;
  }

  /* ── writes: the CER's own kb_curation rows ── */
  function saveRow(sess, raw, field, value) {
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: headers(sess, { "Prefer": "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ course_id: UNCLASS_PREFIX + raw, field: field, value: value, reviewer_email: sess.email })
    });
  }
  /* A rule sent to the routine: one new request row. The key carries the moment and a tag, so two sends
     never share a row. */
  function sendRequest(words, raw, title, issuer) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      var when = new Date().toISOString().replace(/\.\d+Z$/, "Z");
      var tag = Math.random().toString(16).slice(2, 6);
      var ask = { words: (words || "").trim(), raw: raw || "", title: title || "", issuer: issuer || "" };
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
        method: "POST", headers: headers(sess, { "Prefer": "return=minimal" }),
        body: JSON.stringify({ course_id: REQ_PREFIX + when + "-" + tag, field: FIELD_REQ,
          value: JSON.stringify(ask), reviewer_email: sess.email })
      });
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
  }
  /* Turn on or Discard: the request's switch row, replaced by a later choice until the routine acts on it. */
  function switchRequest(id, value) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
        method: "POST", headers: headers(sess, { "Prefer": "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({ course_id: id, field: FIELD_SWITCH, value: value, reviewer_email: sess.email })
      });
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
  }
  function saveAssignment(raw, title, issuer) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return Promise.all([saveRow(sess, raw, FIELD_TITLE, title), saveRow(sess, raw, FIELD_ISSUER, issuer)]);
    }).then(function (rs) {
      if (!rs.every(function (r) { return r.ok; })) throw new Error("HTTP " + rs.map(function (r) { return r.status; }).join("/"));
    });
  }
  /* A re-pick over a person-reviewed title (a conflict card): the assignment, its issuer, and the title it
     replaces, as Another look writes them. The fold's revise lane applies it only while that title still
     stands; the time goes with the rows, since an upsert keeps a row's first reviewed_at. */
  function saveRevision(raw, title, issuer, replaces) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      var at = new Date().toISOString(), id = UNCLASS_PREFIX + raw;
      return postRows(sess, [FIELD_TITLE, FIELD_ISSUER, FIELD_SUPERSEDES].map(function (f, k) {
        return { course_id: id, field: f, value: [title, issuer, replaces][k], reviewer_email: sess.email, reviewed_at: at };
      }));
    });
  }
  function clearAssignment(raw) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation?course_id=eq." + encodeURIComponent(UNCLASS_PREFIX + raw),
        { method: "DELETE", headers: headers(sess) });
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
  }

  /* kb_curation rows posted in batches of 200, each batch an upsert on (course_id, field). */
  function postRows(sess, rows) {
    var chain = Promise.resolve();
    for (var i = 0; i < rows.length; i += 200) {
      (function (part) {
        chain = chain.then(function () {
          return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
            method: "POST", headers: headers(sess, { "Prefer": "resolution=merge-duplicates,return=minimal" }),
            body: JSON.stringify(part)
          }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
        });
      })(rows.slice(i, i + 200));
    }
    return chain;
  }
  /* Accept all proposed titles: the same two rows per title, posted in batches of 100 titles. */
  function saveMany(items) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      var rows = [];
      items.forEach(function (it) {
        rows.push({ course_id: UNCLASS_PREFIX + it.raw, field: FIELD_TITLE, value: it.title, reviewer_email: sess.email });
        rows.push({ course_id: UNCLASS_PREFIX + it.raw, field: FIELD_ISSUER, value: it.issuer, reviewer_email: sess.email });
      });
      return postRows(sess, rows);
    });
  }
  /* Another look's rows for one card. Change: each local title's assignment and issuer, and the title it
     replaces, so the fold applies it only while that title stands. Keep: the proposal declined; after a
     Change this visit, the assignment goes back to the current title too. */
  /* Each row carries the time: an upsert keeps a row's first reviewed_at, and the fold re-points a title
     only for an assignment newer than the reviewed entry. */
  function sweepRows(email, c, kind, title, issuer, at) {
    var rows = [], when = at || new Date().toISOString();
    var iss = issuer != null ? issuer : sweepIssuer(c, title);
    c.locals.forEach(function (l) {
      var id = UNCLASS_PREFIX + l.raw;
      if (kind === "change") {
        rows.push({ course_id: id, field: FIELD_TITLE, value: title, reviewer_email: email, reviewed_at: when });
        rows.push({ course_id: id, field: FIELD_ISSUER, value: iss, reviewer_email: email, reviewed_at: when });
        rows.push({ course_id: id, field: FIELD_SUPERSEDES, value: c.current, reviewer_email: email, reviewed_at: when });
      } else {
        rows.push({ course_id: id, field: FIELD_KEPT, value: c.proposed, reviewer_email: email, reviewed_at: when });
        if (state.sw.saved[c.id] === "change") {
          rows.push({ course_id: id, field: FIELD_TITLE, value: c.current, reviewer_email: email, reviewed_at: when });
          rows.push({ course_id: id, field: FIELD_SUPERSEDES, value: c.current, reviewer_email: email, reviewed_at: when });
        }
      }
    });
    return rows;
  }
  /* A card's issuer: what was typed in its box, else the ASE test the title names, else the card's own. */
  function sweepIssuer(c, title) {
    var typed = state.sw.issuers[c.id];
    return typed != null ? String(typed).trim() : issuerFor(title, c.issuer);
  }
  function saveSweep(cards, kind, titles) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      var rows = [];
      cards.forEach(function (c, i) { rows = rows.concat(sweepRows(sess.email, c, kind, titles[i])); });
      return postRows(sess, rows);
    });
  }

  /* ── the actions ── */
  function decided(h, note, saved) {
    state.history.push({ raw: h.raw, saved: saved == null ? null : saved });
    h.saved = saved || h.saved;
    state.done[h.raw] = true;
    delete state.drafts[h.raw];
    state.teachDraft = "";
    state.note = note;
    state.teach = false; state.openCollege = null;
    state.showAllArt = state.showAllCould = state.showUnder = false;
    render();
    var t = document.getElementById("exh-title");
    if (t) t.focus();
  }
  function failed(e) {
    state.note = e && e.message === "signin"
      ? "Sign in as a reviewer to save."
      : "The save did not reach the reference (" + (e && e.message || "no answer") + "). Nothing changed; try again.";
    render();
  }
  function keepCurrent(h, box, issuer) {
    if (h.step === CONFLICT) {
      var kept = h.saved || h.raw.trim();
      saveRevision(h.raw, kept, issuer, h.title)
        .then(function () { decided(h, "Saved “" + kept + "” over the reviewed title “" + h.title + "”. The nightly run moves it while that title still stands.", kept); })
        .catch(failed);
      return;
    }
    saveAssignment(h.raw, h.raw.trim(), issuer)
      .then(function () { decided(h, "Saved “" + h.raw.trim() + "” as its own title. The nightly run adds it to the reference.", h.raw.trim()); })
      .catch(failed);
  }
  function changeToProposed(h, box, issuer) {
    var title = (box || "").trim();
    if (!title) { state.note = "Write a canonical title first."; render(); return; }
    if (h.step === CONFLICT) {
      if (title !== h.title) {
        saveRevision(h.raw, title, issuer, h.title)
          .then(function () { decided(h, "Saved “" + title + "” over the reviewed title “" + h.title + "”. The nightly run moves it while that title still stands.", title); })
          .catch(failed);
        return;
      }
      clearAssignment(h.raw)
        .then(function () { decided(h, "Cleared the saved assignment; the reference's title “" + title + "” stands.", title); })
        .catch(failed);
      return;
    }
    saveAssignment(h.raw, title, issuer)
      .then(function () { decided(h, "Saved “" + title + "”. The nightly run adds it to the reference.", title); })
      .catch(failed);
  }
  function resetCard() {
    state.teach = false; state.openCollege = null; state.teachDraft = ""; state.bulkAsk = false;
    state.showAllArt = state.showAllCould = state.showUnder = false;
  }
  function skip(list) {
    if (list[state.cur]) state.history.push({ raw: list[state.cur].raw, skipped: true });
    state.cur = list.length ? (state.cur + 1) % list.length : 0;
    state.note = "";
    resetCard();
    render();
  }
  /* Back (Sam, 2026-10-31: "need a back button ... to go to a few previous items"): the last card
     decided or skipped this visit returns to the queue where it was, with what was saved for it; a new
     choice replaces that save (kb_curation's key is the title and the field). */
  function back() {
    var last = state.history.pop();
    if (!last) return;
    var h = state.data.held.filter(function (x) { return x.raw === last.raw; })[0];
    if (!h) { render(); return; }
    delete state.done[h.raw];
    if (last.saved) h.saved = last.saved;
    var list = shown();
    if (list.indexOf(h) < 0) { state.filter = ""; list = shown(); }
    state.cur = Math.max(0, list.indexOf(h));
    state.note = "Back to “" + h.raw + "”." + (last.saved
      ? " You saved “" + last.saved + "”; a new choice replaces it." : "");
    resetCard();
    render();
    var t = document.getElementById("exh-title");
    if (t) t.focus();
  }
  /* ── Another look's actions ── */
  function swDecided(c, kind, title, note) {
    state.sw.history.push({ id: c.id, kind: kind, title: title });
    state.sw.saved[c.id] = kind;
    state.sw.done[c.id] = true;
    delete state.sw.drafts[c.id];
    delete state.sw.issuers[c.id];
    state.sw.bulkAsk = false;
    state.note = note;
    render();
    var t = document.getElementById("exh-sw-title");
    if (t) t.focus();
  }
  function swChange(c, box) {
    var title = (box || "").trim();
    if (!title) { state.note = "Write a canonical title first."; render(); return; }
    if (title === c.current) { swKeep(c); return; }
    saveSweep([c], "change", [title])
      .then(function () {
        swDecided(c, "change", title, "Saved “" + title + "” for " + fmt(c.locals.length) + " local title"
          + (c.locals.length === 1 ? "" : "s") + ". The nightly fold moves them while “" + c.current + "” still stands.");
      }).catch(failed);
  }
  function swKeep(c) {
    saveSweep([c], "keep", [c.current])
      .then(function () { swDecided(c, "keep", c.current, "Kept “" + c.current + "”. This proposal will not come back."); })
      .catch(failed);
  }
  function swSkip(list) {
    if (list[state.sw.cur]) state.sw.history.push({ id: list[state.sw.cur].id, skipped: true });
    state.sw.cur = list.length ? (state.sw.cur + 1) % list.length : 0;
    state.note = ""; state.sw.bulkAsk = false;
    render();
  }
  function swBack() {
    var last = state.sw.history.pop();
    if (!last) return;
    var c = ((state.sw.data && state.sw.data.cards) || []).filter(function (x) { return x.id === last.id; })[0];
    if (!c) { render(); return; }
    delete state.sw.done[c.id];
    var list = sweepShown();
    if (list.indexOf(c) < 0) { state.sw.rule = ""; list = sweepShown(); }
    state.sw.cur = Math.max(0, list.indexOf(c));
    state.note = "Back to “" + c.current + "”." + (last.kind === "change" ? " You saved “" + last.title + "”; a new choice replaces it."
      : last.kind === "keep" ? " You kept the current title; a new choice replaces it." : "");
    state.sw.bulkAsk = false;
    render();
  }
  function swAcceptAll(list) {
    var cards = list.slice();
    var titles = cards.map(function (c) { var d = state.sw.drafts[c.id]; return String(d != null ? d : c.proposed).trim(); });
    cards = cards.filter(function (c, i) { return titles[i] && titles[i] !== c.current; });
    titles = titles.filter(function (t, i) { return t && t !== list[i].current; });
    if (!cards.length) return;
    state.sw.bulkBusy = true; render();
    saveSweep(cards, "change", titles).then(function () {
      cards.forEach(function (c, i) {
        state.sw.history.push({ id: c.id, kind: "change", title: titles[i] });
        state.sw.saved[c.id] = "change"; state.sw.done[c.id] = true; delete state.sw.drafts[c.id];
      });
      state.sw.bulkBusy = false; state.sw.bulkAsk = false; state.sw.cur = 0;
      state.note = "Saved the proposed title for " + fmt(cards.length) + " cards. The nightly fold moves them. Back returns to them one at a time.";
      render();
    }).catch(function (e) { state.sw.bulkBusy = false; state.sw.bulkAsk = false; failed(e); });
  }

  /* Accept all proposed titles (Sam, 2026-10-31): every title in the list on screen takes its proposed
     title and issuer, a typed edit where there is one. A conflict with the reference stays for a person, and
     a title someone already saved keeps that save: the bulk word never overwrites a person's decision. */
  function bulkItems(list) {
    return list.filter(function (h) { return h.step !== CONFLICT && !h.saved; }).map(function (h) {
      var d = state.drafts[h.raw] || {};
      var title = String(d.title != null ? d.title : (h.title || "")).trim();
      return { h: h, raw: h.raw, title: title, issuer: String(d.issuer != null ? d.issuer : issuerFor(title, h.issuer)).trim() };
    }).filter(function (it) { return !!it.title; });
  }
  function acceptAll(list) {
    var items = bulkItems(list);
    if (!items.length) return;
    state.bulkBusy = true; render();
    saveMany(items).then(function () {
      items.forEach(function (it) {
        state.history.push({ raw: it.raw, saved: it.title });
        it.h.saved = it.title;
        state.done[it.raw] = true;
        delete state.drafts[it.raw];
      });
      state.bulkBusy = false; state.cur = 0;
      resetCard();
      state.note = "Saved the proposed title for " + fmt(items.length) + " titles. The nightly run adds them to the reference. Back returns to them one at a time.";
      render();
    }).catch(function (e) { state.bulkBusy = false; state.bulkAsk = false; failed(e); });
  }
  function teachText(h, words, box, issuer) {
    return "Add a CER procedure (from the Exhibits tab, " + new Date().toISOString().slice(0, 10) + "): "
      + (words || "").trim() + "\nExample: “" + h.raw + "” should read “" + (box || h.title) + "”"
      + (issuer ? ", issued by " + issuer : "") + ".\nPaste the procedures run's dry run here; no investigation.";
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return Promise.reject(new Error("no clipboard"));
  }

  /* ── the page ── */
  function tile(label, n, of, words, aside, instead) {
    var kids = [el("span", { cls: "exh-tl", text: label })];
    var tn = el("span", { cls: "exh-tn" }, [el("b", { text: n == null ? (instead || "Could not be read") : fmt(n) })]);
    if (of != null) tn.appendChild(document.createTextNode(" of " + fmt(of)));
    kids.push(tn);
    if (of) {
      var bar = el("span", { cls: "exh-bar", role: "img", "aria-label": pct(n, of) + " percent" });
      var i = el("i"); i.style.width = pct(n, of) + "%"; bar.appendChild(i); kids.push(bar);
    }
    kids.push(el("span", { cls: "exh-tt", text: words }));
    if (aside) kids.push(el("span", { cls: "exh-ts", text: aside }));
    return el("div", { cls: "exh-tile", role: "listitem" }, kids);
  }
  function studentsTile() {
    var t = state.total;
    if (state.studentsWord === "ok" && t) {
      return tile("Students waiting", t.suppressed ? null : t.students, null,
        "students hold credit on titles still held", "Most students first");
    }
    var w = state.studentsWord;
    var why = w === "signin" ? "Sign in as a reviewer to see them"
      : w === "refused" ? "Your sign-in is not a reviewer's" : w === "error" ? "The count did not load" : "";
    var big = w === "signin" || w === "refused" ? "Reviewers only" : w === "error" ? "Could not be read"
      : w === "ok" ? "Too few to show" : "Reading";
    return tile("Students waiting", null, null, "students hold credit on titles still held", why, big);
  }
  function stepTile(step, label) {
    var n = step === "Saved, not folded" ? (state.data.tiles.saved_not_folded || 0) : stepCount(step);
    var b = el("button", {
      type: "button", cls: "exh-step", "aria-pressed": state.filter === step ? "true" : "false",
      "data-tip": TIPS[step], "aria-label": label + ", " + fmt(n) + ". " + TIPS[step]
    }, [el("span", { cls: "exh-sn", text: fmt(n) }), el("span", { cls: "exh-sl", text: label })]);
    if (step === "Saved, not folded") {
      b.disabled = true;
    } else {
      b.addEventListener("click", function () {
        state.filter = step; state.cur = 0; state.note = ""; state.openCollege = null; state.teach = false;
        render();
      });
    }
    return b;
  }
  function sweepTile() {
    var n = sweepShown("").length;
    var b = el("button", {
      type: "button", cls: "exh-step", "aria-pressed": state.filter === SWEEP ? "true" : "false",
      "data-tip": TIPS[SWEEP], "aria-label": SWEEP + ", " + (state.sw.data ? fmt(n) : "not built yet") + ". " + TIPS[SWEEP]
    }, [el("span", { cls: "exh-sn", text: state.sw.data ? fmt(n) : "–" }), el("span", { cls: "exh-sl", text: SWEEP })]);
    if (!state.sw.data) b.disabled = true;
    else b.addEventListener("click", function () {
      state.filter = SWEEP; state.sw.cur = 0; state.sw.rule = ""; state.note = ""; state.sw.bulkAsk = false;
      render();
    });
    return b;
  }
  function sweepRules() {
    var d = state.sw.data;
    var box = el("div", { cls: "exh-views", role: "group", "aria-label": "Another look by rule" });
    [{ id: "", label: "Every rule" }].concat(d.rules || []).forEach(function (r) {
      var n = sweepShown(r.id).length;
      if (r.id && !n && state.sw.rule !== r.id) return;
      var b = word(r.label + " (" + fmt(n) + ")", function () { state.sw.rule = r.id; state.sw.cur = 0; state.note = ""; state.sw.bulkAsk = false; render(); },
        { "aria-pressed": state.sw.rule === r.id ? "true" : "false", title: r.tip || "" });
      if (state.sw.rule === r.id) b.className = "exh-w exh-view-on";
      box.appendChild(b);
    });
    // Sam, 2026-10-31: "a link to a view of all the rules used to suggest or fold exhibit titles".
    box.appendChild(word("Every rule, with its words", function () { state.view = "rules"; state.note = ""; render(); }, { cls: "exh-w" }));
    return box;
  }
  function sweepCard(c, list) {
    var box = el("section", { cls: "exh-card", "aria-label": "Take another look at one title" });
    var row = el("div", { cls: "exh-chiprow" });
    c.rules.forEach(function (id) {
      var r = sweepRule(id);
      row.appendChild(el("span", { cls: "exh-chip", tabindex: "0", "data-tip": r.tip || "", "aria-label": r.label + ". " + (r.tip || "") }, [r.label]));
    });
    if (state.sw.saved[c.id]) row.appendChild(el("span", { cls: "exh-muted exh-small", text: state.sw.saved[c.id] === "change" ? "Changed earlier this visit" : "Kept earlier this visit" }));
    box.appendChild(row);

    var canon = el("div", { cls: "exh-canon" });
    canon.appendChild(el("p", { cls: "exh-small" }, [el("span", { cls: "exh-muted", text: "Current title: " }), el("span", { cls: "exh-strong", text: c.current }),
      el("span", { cls: "exh-muted", text: " · " + fmt(c.current_locals) + " local title" + (c.current_locals === 1 ? "" : "s") + (c.issuer ? " · " + c.issuer : "") })]));
    canon.appendChild(el("label", { cls: "exh-muted exh-small", "for": "exh-sw-title", text: "Proposed title (edit it here)" }));
    var title = el("input", { cls: "exh-edit", id: "exh-sw-title", type: "text", autocomplete: "off" });
    title.value = state.sw.drafts[c.id] != null ? state.sw.drafts[c.id] : c.proposed;
    canon.appendChild(title);
    var iss = el("input", { id: "exh-sw-issuer", type: "text", autocomplete: "off", placeholder: "None named" });
    iss.value = sweepIssuer(c, title.value);
    var swAse = el("p", { cls: "exh-muted exh-small", text: "Issuer filled: the title is an ASE certification. Type another to change it." });
    function swShowAse() { swAse.hidden = state.sw.issuers[c.id] != null || !aseIssuer(title.value); }
    function swTyped() { state.sw.issuers[c.id] = iss.value; swShowAse(); }
    iss.addEventListener("input", swTyped);
    title.addEventListener("input", function () {
      state.sw.drafts[c.id] = title.value;
      if (state.sw.issuers[c.id] == null) iss.value = sweepIssuer(c, title.value);
      swShowAse();
    });
    canon.appendChild(el("label", { cls: "exh-inbox", "for": "exh-sw-issuer" }, [el("span", { cls: "exh-pre", text: "Issuer:" }), iss]));
    canon.appendChild(suggest(iss, "issuers", swTyped));
    swShowAse();
    canon.appendChild(swAse);
    canon.appendChild(el("p", { cls: "exh-muted exh-small", text: c.proposed_exists
      ? "Joins the credential already in the reference under this title (" + fmt(c.proposed_locals) + " local title" + (c.proposed_locals === 1 ? "" : "s") + ")."
        + (c.proposed_issuer && c.issuer && c.proposed_issuer !== c.issuer ? " Its issuer is " + c.proposed_issuer + "; this one's is " + c.issuer + "." : "")
      : "A new credential in the reference." }));
    box.appendChild(canon);

    box.appendChild(el("div", { cls: "exh-why" }, [el("h4", { cls: "exh-q exh-small", text: "Why" }),
      el("ul", null, c.why.map(function (w) { return el("li", { text: w }); }))]));
    var locals = el("ul", { cls: "exh-locals" }, c.locals.map(function (l) {
      var meta = [shortListNames(l.colleges), l.course, l.credit].filter(Boolean).join(" · ");
      return el("li", null, [el("b", { text: l.raw }), meta ? el("span", { cls: "exh-muted exh-small", text: " · " + meta }) : null]);
    }));
    box.appendChild(el("div", { cls: "exh-why" }, [el("h4", { cls: "exh-q exh-small", text: "Local titles that move (" + fmt(c.locals.length) + ")" }), locals,
      c.moves_all ? null : el("p", { cls: "exh-muted exh-small", text: "The other " + fmt(c.current_locals - c.locals.length)
        + " under “" + c.current + "” stay where they are." })]));

    var acts = el("div", { cls: "exh-acts" });
    acts.appendChild(word("Change to Proposed Title", function () { swChange(c, title.value); }));
    acts.appendChild(word("Keep Current Title", function () { swKeep(c); }));
    if (state.sw.history.length) acts.appendChild(word("Back", swBack, { "aria-label": "Back to the previous card" }));
    acts.appendChild(word("Skip", function () { swSkip(list); }));
    box.appendChild(acts);
    if (list.length > 1) {
      var bulk = el("div", { cls: "exh-bulk" });
      if (!state.sw.bulkAsk) {
        bulk.appendChild(word("Accept all proposed titles (" + fmt(list.length) + ")", function () { state.sw.bulkAsk = true; render(); },
          { cls: "exh-w exh-small", "aria-expanded": "false" }));
      } else {
        bulk.appendChild(el("p", { cls: "exh-small", role: "status" }, ["Save the proposed title for the " + fmt(list.length)
          + " cards in " + (state.sw.rule ? sweepRule(state.sw.rule).label : "every rule") + "? An edit you typed on a card counts as its proposal. "
          + "Each moves only while its current title still stands."]));
        bulk.appendChild(el("div", { cls: "exh-acts" }, [
          word(state.sw.bulkBusy ? "Saving…" : "Save all " + fmt(list.length), function () { if (!state.sw.bulkBusy) swAcceptAll(list); },
            state.sw.bulkBusy ? { disabled: "disabled" } : null),
          word("Cancel", function () { state.sw.bulkAsk = false; render(); })]));
      }
      box.appendChild(bulk);
    }
    var next = list[state.sw.cur + 1];
    box.appendChild(el("div", { cls: "exh-foot" }, [
      el("span", { text: (state.sw.cur + 1) + " of " + fmt(list.length) + " in " + SWEEP }),
      el("span", { text: next ? "Next: " + next.current + " → " + next.proposed : "" })]));
    return box;
  }
  function shortListNames(names) {
    var s = (names || []).map(shortName).filter(Boolean);
    return s.length > 3 ? s.slice(0, 3).join(", ") + " and " + (s.length - 3) + " more" : s.join(", ");
  }
  function renderSweep(wrap) {
    var d = state.sw.data;
    wrap.appendChild(el("p", { cls: "exh-muted exh-small", text: "Built " + stamp(d.generated_at) + " from every title in the reference. "
      + "Each card names its rule; a change moves its local titles at the nightly fold." }));
    wrap.appendChild(sweepRules());
    var list = sweepShown();
    if (state.sw.cur >= list.length) state.sw.cur = Math.max(0, list.length - 1);
    wrap.appendChild(el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: state.note || "" }));
    if (!list.length) {
      wrap.appendChild(el("p", { cls: "exh-empty", text: "Nothing waits for another look in this rule." }));
      if (state.sw.history.length) wrap.appendChild(el("div", { cls: "exh-acts" }, [word("Back", swBack)]));
      return;
    }
    wrap.appendChild(sweepCard(list[state.sw.cur], list));
  }
  function chips(idx, max, all, onMore, pick) {
    var box = el("span", { cls: "exh-cchips" });
    if (!idx.length) { box.appendChild(el("span", { cls: "exh-muted", text: "None yet" })); return box; }
    (all ? idx : idx.slice(0, max)).forEach(function (i) {
      var name = college(i);
      if (pick) {
        var b = el("button", { type: "button", cls: "exh-cchip", title: name, "aria-controls": "exh-adopt",
          "aria-expanded": state.openCollege === i ? "true" : "false" }, [shortName(name)]);
        b.addEventListener("click", function () { pick(i); });
        box.appendChild(b);
      } else {
        box.appendChild(el("span", { cls: "exh-cchip", title: name, text: shortName(name) }));
      }
    });
    if (idx.length > max) box.appendChild(word(all ? "Show fewer" : "and " + (idx.length - max) + " more", onMore, { cls: "exh-w exh-small" }));
    return box;
  }
  function adoptPanel(h) {
    var i = state.openCollege;
    var box = el("div", { cls: "exh-adopt", id: "exh-adopt" });
    if (i == null) { box.hidden = true; return box; }
    var name = college(i);
    box.appendChild(el("h4", { text: name }));
    var key = coursesKey(h);
    var rows = key && state.courses && state.courses.courses[key] ? state.courses.courses[key][String(i)] || [] : [];
    var lead;
    if (!state.courses && !state.coursesErr) lead = "Reading the courses…";
    else if (state.coursesErr) lead = "The courses could not be read.";
    else if (rows.length && h.same) lead = "Courses aligned to " + h.basis + " at this college:";
    else if (rows.length) lead = "Courses at this college mapped to " + h.title + ":";
    else lead = "No course on file here; the college's faculty choose the course.";
    box.appendChild(el("p", { cls: "exh-muted", text: lead }));
    if (rows.length) box.appendChild(courseList(rows));
    if (h.ids && h.ids.length) {
      var a = el("a", { href: mapUrl(h.ids[0]), target: "_blank", rel: "noopener", text: "Request Quick Adopt in MAP" });
      box.appendChild(el("p", null, [a, ", from " + h.ids[0] + ", " + shortList(whoBuilt(h)) + "’s exhibit"]));
    }
    return box;
  }
  /* [code, title, units] rows; a prescriptive course carries no title. */
  function courseList(rows) {
    return el("ul", null, rows.map(function (r) {
      var u = r[2] ? r[2] + (r[2] === 1 ? " unit" : " units") : "noncredit";
      return el("li", { text: [r[0], r[1]].filter(Boolean).join(" ") + ", " + u });
    }));
  }
  function studentsLine(h) {
    var s = studentsOf(h);
    var many = h.ids && h.ids.length > 1 ? "these exhibits" : "this exhibit";
    if (state.studentsWord === "signin") return "Sign in as a reviewer to see students";
    if (state.studentsWord === "refused") return "Students show to a reviewer's sign-in";
    if (state.studentsWord === "error") return "Students could not be read";
    if (!s) return "Reading students";
    if (s.suppressed) return "Too few students to show";
    if (!s.students) return "No students with credit yet";
    return fmt(s.students) + " students have credit on " + many;
  }

  function card(h, list) {
    var c = el("section", { cls: "exh-card", "aria-label": "Review one title" });
    var chip = el("span", { cls: "exh-chip", tabindex: "0", "data-tip": TIPS[h.step] || "",
      "aria-label": "CER step: " + h.step + ". " + (TIPS[h.step] || "") }, ["CER step: " + h.step]);
    var row = el("div", { cls: "exh-chiprow" }, [chip]);
    if (h.saved) row.appendChild(el("span", { cls: "exh-muted exh-small", text: "Saved earlier as “" + h.saved + "”" }));
    c.appendChild(row);

    var canon = el("div", { cls: "exh-canon" });
    canon.appendChild(el("label", { cls: "exh-muted exh-small", "for": "exh-title",
      text: "Canonical title, from " + (h.from || "the classifier") + " (edit it here)" }));
    // An edit outlives a re-render (opening a chip, showing more colleges) until the title is decided.
    var draft = state.drafts[h.raw] || {};
    var title = el("input", { cls: "exh-edit", id: "exh-title", type: "text", autocomplete: "off" });
    title.value = draft.title != null ? draft.title : (h.title || "");
    canon.appendChild(title);
    var issuer = el("input", { id: "exh-issuer", type: "text", autocomplete: "off", placeholder: "None named" });
    // The issuer follows the title (an ASE test names ASE) until a person types or picks one.
    var issuerTyped = draft.issuer != null;
    issuer.value = issuerTyped ? draft.issuer : issuerFor(title.value, h.issuer);
    function keepDraft() { var dd = { title: title.value }; if (issuerTyped) dd.issuer = issuer.value; state.drafts[h.raw] = dd; }
    var aseNote = el("p", { cls: "exh-muted exh-small", text: "Issuer filled: the title is an ASE certification. Type another to change it." });
    function showAse() { aseNote.hidden = issuerTyped || !aseIssuer(title.value); }
    issuer.addEventListener("input", function () { issuerTyped = true; keepDraft(); showAse(); });
    canon.appendChild(el("label", { cls: "exh-inbox", "for": "exh-issuer" }, [el("span", { cls: "exh-pre", text: "Issuer:" }), issuer]));
    canon.appendChild(suggest(issuer, "issuers", function () { issuerTyped = true; keepDraft(); showAse(); }));
    showAse();
    canon.appendChild(aseNote);
    var sites = (h.trainers || []).join("; ");
    // The credential panel sets training sites; a title new to the reference gets them once the nightly run adds it.
    canon.appendChild(el("div", { cls: "exh-inbox exh-read" }, [el("span", { cls: "exh-pre", text: "Training site:" }),
      el("span", { cls: "exh-grow", text: sites || "None named" }),
      h.exists ? word("Set in the credential panel", function () { openCredential(h.title); }, { cls: "exh-w exh-small" })
        : el("span", { cls: "exh-muted exh-small", text: "set once it joins the reference" })]));
    var exists = el("p", { cls: "exh-muted exh-small" },
      [h.exists ? "Joins the credential already in the reference under this title." : "A new credential in the reference."]);
    exists.hidden = title.value.trim() !== (h.title || "");
    title.addEventListener("input", function () {
      if (!issuerTyped) issuer.value = issuerFor(title.value, h.issuer);
      keepDraft(); showAse(); exists.hidden = title.value.trim() !== (h.title || "");
    });
    canon.appendChild(exists);
    (h.alternates || []).forEach(function (alt) {
      canon.appendChild(el("p", { cls: "exh-muted exh-small" }, [
        (h.step === CONFLICT ? "The reference also names: " : "Also proposed: ") + alt + " ",
        word("Use it", function () { title.value = alt; keepDraft(); exists.hidden = true; title.focus(); }, { cls: "exh-w exh-small" })]));
    });
    c.appendChild(canon);

    var typed = el("div", { cls: "exh-typed" }, [el("span", { cls: "exh-cl", text: "Local titles" })]);
    var nowLi = el("li", { cls: "exh-now" }, [
      el("span", { cls: "exh-muted", text: "Deciding now, " + shortList(whoBuilt(h)) + ": " }),
      el("strong", { text: h.raw })]);
    if (h.course) nowLi.appendChild(el("span", { cls: "exh-muted", text: " · articulated to " + h.course }));
    typed.appendChild(el("ul", null, [nowLi]));
    var under = el("ul", { cls: "exh-under" });
    var others = h.under || [];
    if (!others.length) under.appendChild(el("li", { text: "No other local titles under it yet" }));
    else {
      if (state.showUnder) others.forEach(function (t) { under.appendChild(el("li", { text: t })); });
      var more = (h.under_count || others.length) - (state.showUnder ? others.length : 0);
      var label = state.showUnder ? (more > 0 ? "and " + more + " more not shown; Show fewer" : "Show fewer") : "and " + (h.under_count || others.length) + " more";
      under.appendChild(el("li", null, [word(label, function () { state.showUnder = !state.showUnder; render(); }, { cls: "exh-w exh-small" })]));
    }
    typed.appendChild(under);
    c.appendChild(typed);

    var cc = el("div", { cls: "exh-colleges" });
    cc.appendChild(el("div", { cls: "exh-ccrow" }, [
      el("span", { cls: "exh-cl", text: "Articulated at (" + h.art.length + ")" }),
      chips(h.art, CHIP_MAX, state.showAllArt, function () { state.showAllArt = !state.showAllArt; render(); })]));
    var could = couldOf(h);
    var basis = h.same ? ", same course as " + h.basis : ", teach a course mapped to it";
    cc.appendChild(el("div", { cls: "exh-ccrow" }, [
      el("span", { cls: "exh-cl", text: "Could adopt (" + could.length + ")" + (could.length ? basis : "") }),
      chips(could, CHIP_MAX, state.showAllCould, function () { state.showAllCould = !state.showAllCould; render(); },
        function (i) {
          state.openCollege = state.openCollege === i ? null : i;
          render();
          if (state.openCollege != null && !state.courses) loadCourses().then(render);
        })]));
    cc.appendChild(adoptPanel(h));
    c.appendChild(cc);

    c.appendChild(el("p", { cls: "exh-why", text: studentsLine(h) + " · " + h.why }));
    if (h.ids && h.ids.length) {
      var src = el("p", { cls: "exh-small" }, ["Source: "]);
      h.ids.slice(0, 3).forEach(function (id, k) {
        if (k) src.appendChild(document.createTextNode(", "));
        src.appendChild(el("a", { href: mapUrl(id), target: "_blank", rel: "noopener", text: id + " in MAP" }));
      });
      if (h.ids.length > 3) src.appendChild(document.createTextNode(" and " + (h.ids.length - 3) + " more"));
      c.appendChild(src);
    }

    var acts = el("div", { cls: "exh-acts" });
    // Change to Proposed Title first (Sam, 2026-10-31: "to the left of keep current title").
    acts.appendChild(word("Change to Proposed Title", function () { changeToProposed(h, title.value, issuer.value.trim()); }));
    acts.appendChild(word("Keep Current Title", function () { keepCurrent(h, title.value, issuer.value.trim()); }));
    acts.appendChild(word("Teach a rule", function () { state.teach = !state.teach; render(); }, { "aria-expanded": state.teach ? "true" : "false", "aria-controls": "exh-teach" }));
    if (state.history.length) acts.appendChild(word("Back", back, { "aria-label": "Back to the previous title, " + state.history[state.history.length - 1].raw }));
    acts.appendChild(word("Skip", function () { skip(list); }));
    c.appendChild(acts);
    var many = bulkItems(list);
    if (many.length > 1) {
      var bulk = el("div", { cls: "exh-bulk" });
      if (!state.bulkAsk) {
        bulk.appendChild(word("Accept all proposed titles (" + fmt(many.length) + ")", function () { state.bulkAsk = true; render(); },
          { cls: "exh-w exh-small", "aria-expanded": "false" }));
      } else {
        var steps = {};
        many.forEach(function (it) { steps[it.h.step] = (steps[it.h.step] || 0) + 1; });
        var held = list.length - many.length;
        bulk.appendChild(el("p", { cls: "exh-small", role: "status" }, [
          "Save the proposed title and issuer for the " + fmt(many.length) + " titles in this list ("
          + Object.keys(steps).map(function (k) { return fmt(steps[k]) + " " + k; }).join(", ") + ")? An edit you typed on a card counts as its proposal."
          + (held ? " The other " + fmt(held) + ", in conflict with the reference or saved earlier, stay as they are." : "")]));
        bulk.appendChild(el("div", { cls: "exh-acts" }, [
          word(state.bulkBusy ? "Saving…" : "Save all " + fmt(many.length), function () { if (!state.bulkBusy) acceptAll(list); },
            state.bulkBusy ? { disabled: "disabled" } : null),
          word("Cancel", function () { state.bulkAsk = false; render(); })]));
      }
      c.appendChild(bulk);
    }
    if (state.teach) {
      var ta = el("textarea", { id: "exh-teach-words", rows: "3", cls: "exh-ta",
        placeholder: "The rule in plain words, as you would tell a session" });
      ta.value = state.teachDraft;
      ta.addEventListener("input", function () { state.teachDraft = ta.value; });
      var out = el("span", { cls: "exh-muted exh-small", "aria-live": "polite" });
      c.appendChild(el("div", { cls: "exh-teach", id: "exh-teach" }, [
        el("label", { "for": "exh-teach-words", cls: "exh-small", text: "Write the rule as you would tell a session. Send to the routine: "
          + ROUTINE_WHEN.charAt(0).toLowerCase() + ROUTINE_WHEN.slice(1) + ", builds it switched off and returns its dry run under Rules, "
          + "where you Turn it on or Discard it. Or copy the message for a session you drive." }),
        ta,
        el("div", { cls: "exh-acts" }, [word(state.rq.busy === "send" ? "Sending…" : "Send to the routine", function () {
          if (state.rq.busy) return;
          if (!ta.value.trim()) { out.textContent = "Write the rule first."; return; }
          state.rq.busy = "send"; out.textContent = "Sending…";
          sendRequest(ta.value, h.raw, title.value, issuer.value.trim()).then(function () {
            state.rq.busy = ""; state.teachDraft = ""; state.teach = false;
            state.note = "Sent to the routine. It waits under Rules until tonight's run builds it.";
            return loadRules();
          }).then(render).catch(function (e) {
            state.rq.busy = "";
            out.textContent = String(e && e.message) === "signin" ? "Sign in as a reviewer to send it, or copy it for a session."
              : "It did not send (" + (e && e.message || e) + "). Copy it for a session instead.";
          });
        }, state.rq.busy ? { disabled: "disabled" } : null), word("Copy for a session", function () {
          copy(teachText(h, ta.value, title.value, issuer.value.trim()))
            .then(function () { out.textContent = "Copied. Paste it into a session."; })
            .catch(function () { ta.value = teachText(h, ta.value, title.value, issuer.value.trim()); ta.select(); out.textContent = "Select and copy the message in the box."; });
        }), out])]));
    }
    var next = list[state.cur + 1];
    c.appendChild(el("div", { cls: "exh-foot" }, [
      el("span", { text: (state.cur + 1) + " of " + fmt(list.length) + (state.filter ? " in " + state.filter : "")
        + (state.students ? " · most students first" : " · most colleges first") }),
      el("span", { text: next ? "Next: " + next.raw + ", " + shortList(whoBuilt(next)) : "" })]));
    return c;
  }

  function finder(list) {
    var wrap = el("div", { cls: "exh-finder" });
    wrap.appendChild(el("label", { cls: "exh-muted exh-small", "for": "exh-find", text: "Go to an exhibit" }));
    var input = el("input", { cls: "exh-search", id: "exh-find", type: "search", autocomplete: "off",
      placeholder: "Title, exhibit ID, college or course code", "aria-controls": "exh-results" });
    var results = el("ul", { cls: "exh-results", id: "exh-results", role: "listbox", "aria-label": "Matching exhibits" });
    results.hidden = true;
    function draw() {
      while (results.firstChild) results.removeChild(results.firstChild);
      var q = input.value.trim().toLowerCase();
      if (!q) { results.hidden = true; return; }
      var hits = [];
      list.forEach(function (h, i) {
        var hay = [h.raw, h.title, h.course || "", (h.ids || []).join(" "),
          whoBuilt(h).map(college).join(" "), whoBuilt(h).map(function (k) { return shortName(college(k)); }).join(" ")].join(" ").toLowerCase();
        if (hay.indexOf(q) !== -1) hits.push([h, i]);
      });
      if (!hits.length) {
        results.appendChild(el("li", { cls: "exh-none", text: state.filter
          ? "No held exhibit in " + state.filter + " matches." : "No held exhibit matches. Settled credentials are in Credentials." }));
      }
      hits.slice(0, 40).forEach(function (p) {
        var h = p[0];
        var b = el("button", { type: "button", role: "option" }, [
          el("span", { cls: "exh-rt", text: h.raw }),
          el("span", { cls: "exh-chiprow" }, [
            el("span", { cls: "exh-rm", text: shortList(whoBuilt(h)) + (h.ids && h.ids[0] ? " · " + h.ids[0] : "") + (h.course ? " · " + h.course : "") }),
            el("span", { cls: "exh-chip", text: h.step })])]);
        b.addEventListener("click", function () {
          state.cur = p[1]; state.note = ""; state.openCollege = null; state.teach = false;
          render();
          var t = document.getElementById("exh-title");
          if (t) t.focus();
        });
        results.appendChild(el("li", null, [b]));
      });
      results.hidden = false;
    }
    input.addEventListener("input", draw);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var first = results.querySelector("button"); if (first) { e.preventDefault(); first.click(); } }
      if (e.key === "Escape") results.hidden = true;
    });
    wrap.appendChild(input);
    wrap.appendChild(results);
    return wrap;
  }

  /* ── Credentials: the credential panel ── */
  /* One rule with kb/_apply_credential_review.py: a list of {site, college}, blank sites and repeats
     dropped, anything else read as null (ignored, never half-applied). */
  function parseSites(value) {
    var got;
    try { got = JSON.parse(value || ""); } catch (e) { return null; }
    if (!Array.isArray(got)) return null;
    var out = [], seen = {};
    got.forEach(function (x) {
      if (!x || typeof x !== "object" || Array.isArray(x)) return;
      var site = String(x.site == null ? "" : x.site).replace(/\s+/g, " ").trim();
      var col = String(x.college == null ? "" : x.college).replace(/\s+/g, " ").trim();
      var k = site + "\u0000" + col;
      if (!site || seen[k]) return;
      seen[k] = true;
      out.push(col ? { site: site, college: col } : { site: site });
    });
    return out;
  }
  function joinSites(sites) {
    var names = [];
    (sites || []).forEach(function (x) { if (names.indexOf(x.site) === -1) names.push(x.site); });
    return names.join("; ");
  }
  /* The list stands unless a later one-trainer edit (the CER's Trainer box) says something else. */
  function resolveSites(o) {
    if (!o || o.sites == null) return null;
    var sites = parseSites(o.sites);
    if (sites == null) return null;
    if (o.trainer != null && String(o.trainer).replace(/\s+/g, " ").trim() !== joinSites(sites)
        && (o.trainerAt || "") > (o.sitesAt || "")) return null;
    return sites;
  }
  function credName(r) { return r.display_title || r.ut; }
  function credCurrent(r) {
    var o = state.cs.overlay[r.ut] || {};
    var issuer = o.issuer != null ? o.issuer : (r.issuer || "");
    var sites = resolveSites(o);
    if (sites == null && o.trainer != null) sites = o.trainer.trim() ? [{ site: o.trainer.trim() }] : [];
    if (sites == null) sites = r.trainers ? parseSites(JSON.stringify(r.trainers)) || [] : (r.trainer ? [{ site: r.trainer }] : []);
    return { issuer: issuer, sites: sites };
  }
  function credColleges(r) {
    var out = [];
    (r.articulations || []).forEach(function (a) {
      (a.local || []).forEach(function (l) {
        (l.colleges || []).forEach(function (c) { if (c && out.indexOf(c) === -1) out.push(c); });
      });
    });
    return out.sort();
  }
  function credStudents(r) {
    if (r.students_served != null) return { n: r.students_served, word: fmt(r.students_served) };
    if (r.served_suppressed) return { n: 5, word: "Too few" };
    return { n: 0, word: "None yet" };
  }
  /* Exhibit Adoption's per-credential view (kb/exhibits_adoption.json): what each college articulated, the courses
     each could-adopt college already teaches (the M-ID prescriptive layer; never the TOP or C-ID overlap), the
     exhibits, the CIP sector and the peer median. Keyed by the canonical title. */
  function credAdopt(r) {
    var f = state.cs.adopt;
    return f && f.credentials ? f.credentials[r.ut] || null : null;
  }
  function adoptName(i) { return ((state.cs.adopt && state.cs.adopt.colleges) || [])[+i] || ""; }
  function adoptMap(m) {
    var out = {};
    Object.keys(m || {}).forEach(function (k) { var n = adoptName(k); if (n) out[n] = m[k]; });
    return out;
  }
  /* Articulated at: the reference's colleges (a local course under the credential's identity) and, once the
     file is read, every college MAP records articulating it (Exhibit Adoption's adopters, rows with no course
     identity included). */
  function credArt(r) {
    var out = credColleges(r).slice();
    Object.keys(adoptMap((credAdopt(r) || {}).a)).forEach(function (n) { if (out.indexOf(n) === -1) out.push(n); });
    return out.sort();
  }
  /* Who could adopt it: the colleges teaching a mapped course, once the file is read; the articulating
     colleges left out. */
  function credCould(r) {
    var a = credAdopt(r);
    if (!a) return [];
    var art = credArt(r);
    return Object.keys(adoptMap(a.c)).filter(function (n) { return art.indexOf(n) === -1; }).sort();
  }
  function credAdoption(r) {
    var a = credArt(r).length, c = credCould(r).length;
    var parts = [];
    if (a) parts.push(fmt(a) + (a === 1 ? " articulates it" : " articulate it"));
    if (c) parts.push(fmt(c) + " could adopt");
    return parts.join(" · ") || "No college yet";
  }
  function credRows() {
    var cs = state.cs;
    if (!cs.rows) return [];
    var words = cs.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var list = cs.rows;
    if (words.length) {
      list = list.filter(function (r) {
        var cur = credCurrent(r);
        var hay = [credName(r), r.ut, cur.issuer, (r.issuers || []).join(" "), joinSites(cur.sites),
          (r.raw_variants || []).map(function (v) { return v.r; }).join(" ")].join(" ").toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      });
    }
    return list;
  }

  function loadCredentials() {
    var cs = state.cs;
    if (cs.rows) return Promise.resolve();
    if (cs.loading) return cs.loading;
    cs.loading = new Promise(function (resolve) {
      var T = window.CPL_TABS;
      if (window.CPL_CREDENTIAL_REFERENCE || !T || typeof T.loadScript !== "function") { resolve(); return; }
      T.loadScript(CRED_DATA, "CPL_CREDENTIAL_REFERENCE", resolve);
    }).then(function () {
      var d = window.CPL_CREDENTIAL_REFERENCE;
      if (!d || !Array.isArray(d.unified_titles)) { cs.error = "the credential file did not load"; return; }
      var rows = d.unified_titles.slice();
      rows.sort(function (a, b) {
        return credStudents(b).n - credStudents(a).n || credColleges(b).length - credColleges(a).length
          || credName(a).toLowerCase().localeCompare(credName(b).toLowerCase());
      });
      cs.rows = rows; cs.generated = d._generated_at; cs.error = null;
      return Promise.all([loadCredOverlay(), loadAdoption(), loadLinks()]);
    }).then(function () { cs.loading = null; });
    return cs.loading;
  }
  /* The live _CREDENTIAL_REVIEW:: rows for the three fields, paginated (PostgREST caps a response at 1,000). */
  function loadCredOverlay() {
    var PAGE = 1000, key = anonKey();
    var url = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,reviewed_at"
      + "&course_id=like." + encodeURIComponent(CRED_PREFIX) + "%25"
      + "&field=in.(" + [FIELD_CRED_ISSUER, FIELD_CRED_TRAINER, FIELD_CRED_SITES, FIELD_CRED_TITLE, FIELD_LIST_FLAG].join(",") + ")"
      + "&order=course_id.asc,field.asc";
    var out = [];
    function page(from) {
      return fetch(url, { headers: { "apikey": key, "Range-Unit": "items", "Range": from + "-" + (from + PAGE - 1) } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (arr) { out = out.concat(arr || []); return arr && arr.length === PAGE ? page(from + PAGE) : out; });
    }
    if (!key) { state.cs.overlayOk = false; return Promise.resolve(); }
    return page(0).then(function (rows) {
      var m = {};
      rows.forEach(function (row) {
        var t = (row.course_id || "").slice(CRED_PREFIX.length);
        if (!t) return;
        var o = m[t] = m[t] || {};
        if (row.field === FIELD_CRED_ISSUER) o.issuer = row.value || "";
        else if (row.field === FIELD_CRED_TRAINER) { o.trainer = row.value; o.trainerAt = row.reviewed_at || ""; }
        else if (row.field === FIELD_CRED_SITES) { o.sites = row.value || ""; o.sitesAt = row.reviewed_at || ""; }
        else if (row.field === FIELD_CRED_TITLE) o.title = row.value || "";
        else if (row.field === FIELD_LIST_FLAG) o.flag = row.value || "";
      });
      state.cs.overlay = m; state.cs.overlayOk = true;
    }).catch(function () { state.cs.overlayOk = false; });
  }
  function loadAdoption() {
    var cs = state.cs;
    if (cs.adopt) return Promise.resolve();
    return fetch(ADOPTION_URL)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { cs.adopt = d && d.credentials ? d : null; cs.adoptErr = !cs.adopt; })
      .catch(function () { cs.adopt = null; cs.adoptErr = true; });
  }
  /* MAP's verified exhibits and who built each (map_links.js reads kb/reference/map_cpl_opportunities_verified.json). */
  function loadLinks() {
    var L = window.CPL_MAP_LINKS;
    if (!L || typeof L.load !== "function") return Promise.resolve();
    return Promise.resolve(L.load()).then(function (ix) { state.cs.links = ix || null; }).catch(function () { state.cs.links = null; });
  }
  function linkUrl(id) {
    var L = window.CPL_MAP_LINKS;
    return L && typeof L.url === "function" ? L.url(id) : mapUrl(id);
  }
  /* The verified exhibits of a credential a college built, for its own Request Quick Adopt link. */
  function builtBy(r, name) {
    var ix = state.cs.links;
    if (!ix || !ix.by_title) return [];
    return (ix.by_title[r.ut] || []).filter(function (id) {
      var f = ix.found[String(id).toUpperCase()];
      return f && f.college === name;
    });
  }
  function saveCredRow(sess, ut, field, value) {
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: headers(sess, { "Prefer": "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ course_id: CRED_PREFIX + ut, field: field, value: value, reviewer_email: sess.email })
    });
  }

  function credDraft(r) {
    var cs = state.cs;
    if (!cs.drafts[r.ut]) {
      var cur = credCurrent(r);
      cs.drafts[r.ut] = { issuer: cur.issuer, sites: cur.sites.map(function (x) { return { site: x.site, college: x.college || "" }; }) };
    }
    return cs.drafts[r.ut];
  }
  function credSave(r) {
    var cs = state.cs, d = credDraft(r), cur = credCurrent(r);
    var issuer = d.issuer.replace(/\s+/g, " ").trim();
    var sites = parseSites(JSON.stringify(d.sites)) || [];
    var writes = [];
    if (issuer !== (cur.issuer || "")) writes.push([FIELD_CRED_ISSUER, issuer]);
    if (JSON.stringify(sites) !== JSON.stringify(cur.sites)) {
      writes.push([FIELD_CRED_SITES, JSON.stringify(sites)]);
      writes.push([FIELD_CRED_TRAINER, joinSites(sites)]);
    }
    if (!writes.length) { cs.note = "Nothing changed."; render(); return Promise.resolve(); }
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return Promise.all(writes.map(function (w) { return saveCredRow(sess, r.ut, w[0], w[1]); }));
    }).then(function (rs) {
      if (!rs.every(function (x) { return x.ok; })) throw new Error("HTTP " + rs.map(function (x) { return x.status; }).join("/"));
      var o = cs.overlay[r.ut] = cs.overlay[r.ut] || {};
      var now = new Date().toISOString();
      writes.forEach(function (w) {
        if (w[0] === FIELD_CRED_ISSUER) o.issuer = w[1];
        else if (w[0] === FIELD_CRED_TRAINER) { o.trainer = w[1]; o.trainerAt = now; }
        else { o.sites = w[1]; o.sitesAt = now; }
      });
      delete cs.drafts[r.ut];
      cs.note = "Saved. The tabs show it now; the daily run writes it into the reference.";
      render();
    }).catch(function (e) {
      cs.note = e && e.message === "signin" ? "Sign in as a reviewer to save."
        : "The save did not reach the reference (" + (e && e.message || "no answer") + "). Nothing changed; try again.";
      render();
    });
  }
  function credOpen(ut) {
    var cs = state.cs;
    cs.sel = ut; cs.note = ""; cs.showTitles = cs.showArt = cs.showCould = cs.showRecords = false; cs.open = null;
    render();
    var h = document.getElementById("exh-c-h");
    if (h) h.focus();
  }
  /* The Review card's way in: the credential a held title joins. */
  function openCredential(ut) {
    state.view = "credentials"; state.cs.q = ""; state.cs.limit = CRED_PAGE;
    state.cs.sel = ut; state.cs.note = ""; state.cs.open = null;
    render();
    loadCredentials().then(function () { render(); var h = document.getElementById("exh-c-h"); if (h) h.focus(); });
  }

  function credTiles() {
    var cs = state.cs, rows = cs.rows || [];
    var nIss = 0, nSite = 0;
    rows.forEach(function (r) {
      var cur = credCurrent(r);
      if (cur.issuer) nIss++;
      if (cur.sites.length) nSite++;
    });
    var group = el("div", { cls: "exh-group" }, [el("h3", { cls: "exh-q", text: "What is it called?" })]);
    group.appendChild(el("div", { cls: "exh-dash", role: "list", "aria-label": "What is it called" }, [
      tile("Credentials", cs.rows ? rows.length : null, null, "canonical credentials in the reference", "", "Reading"),
      tile("Issuers", cs.rows ? nIss : null, cs.rows ? rows.length : null, "credentials naming an issuing agency", "", "Reading"),
      tile("Training sites", cs.rows ? nSite : null, cs.rows ? rows.length : null, "credentials naming where the training happens",
        "Set them in a credential's panel", "Reading")]));
    return group;
  }
  /* What credit does it carry? and Who could adopt it? (mock-up version 26), counted over the reference's credentials. */
  function credMoreTiles() {
    var cs = state.cs, rows = cs.rows || [], n = cs.rows ? rows.length : null;
    var recs = 0, statewide = 0, field = 0, adoptable = 0, shared = 0, could = 0;
    rows.forEach(function (r) {
      if (r.ccc_rec || r.gen_rec) recs++;
      if (r.ccc_rec) statewide++;
      var a = credAdopt(r);
      if (a && a.s) field++;
      if (credArt(r).length >= 2) shared++;
      if (credCould(r).length) could++;
      var ix = cs.links;
      if (ix && ix.by_title && (ix.by_title[r.ut] || []).some(function (id) { return ix.found[String(id).toUpperCase()]; })) adoptable++;
    });
    var adoptWord = cs.adopt ? null : (cs.adoptErr ? "Could not be read" : "Reading");
    var credit = el("div", { cls: "exh-group" }, [el("h3", { cls: "exh-q", text: "What credit does it carry?" }),
      el("div", { cls: "exh-dash", role: "list", "aria-label": "What credit does it carry" }, [
        tile("Credit recs", n == null ? null : recs, n, "credentials with a credit recommendation in MAP", "", "Reading"),
        tile("Statewide recs", n == null ? null : statewide, n, "credentials with a statewide recommendation", "", "Reading"),
        tile("Field", cs.adopt && n != null ? field : null, cs.adopt ? n : null, "credentials with a CIP sector", "", adoptWord)])]);
    var adopt = el("div", { cls: "exh-group" }, [el("h3", { cls: "exh-q", text: "Who could adopt it?" }),
      el("div", { cls: "exh-dash", role: "list", "aria-label": "Who could adopt it" }, [
        tile("Adoptable", cs.links && n != null ? adoptable : null, cs.links ? n : null,
          "credentials with an exhibit to Request Quick Adopt from", "", cs.rows ? "Not read" : "Reading"),
        tile("Shared", n == null ? null : shared, n, "credentials two or more colleges articulate", "", "Reading"),
        tile("Could adopt", cs.adopt && n != null ? could : null, cs.adopt ? n : null,
          "credentials a college could adopt, teaching a mapped course", "", adoptWord)])]);
    return el("div", { cls: "exh-groups" }, [credit, adopt]);
  }
  function credTable(list) {
    var cs = state.cs;
    var box = el("div", { cls: "exh-ctable" });
    var wrap = el("div", { cls: "exh-tablewrap", role: "region", "aria-label": "Credentials", tabindex: "0" });
    var table = el("table", { cls: "exh-table" });
    table.appendChild(el("colgroup", null, [el("col", { style: "width:31%" }), el("col", { style: "width:20%" }),
      el("col", { style: "width:19%" }), el("col", { style: "width:13%" }), el("col", { style: "width:17%" })]));
    table.appendChild(el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "Credential" }),
      el("th", { scope: "col", text: "Issuer" }), el("th", { scope: "col", text: "Training sites" }),
      el("th", { scope: "col", cls: "exh-r", text: "Students" }), el("th", { scope: "col", text: "Adoption" })])]));
    var body = el("tbody");
    list.slice(0, cs.limit).forEach(function (r) {
      var cur = credCurrent(r), on = cs.sel === r.ut;
      var b = word(credName(r), function () { credOpen(r.ut); }, { cls: "exh-w exh-cred", "aria-controls": "exh-cpanel",
        "aria-current": on ? "true" : null });
      var iss = cur.issuer || "None named";
      var more = (r.issuers || []).filter(function (x) { return x !== cur.issuer; }).length;
      var sites = joinSites(cur.sites);
      body.appendChild(el("tr", { cls: on ? "exh-sel" : null }, [
        el("td", null, [b]),
        el("td", { cls: cur.issuer ? null : "exh-muted" }, [iss + (more ? " and " + more + " more" : "")]),
        el("td", { cls: sites ? null : "exh-muted", text: sites || "None named" }),
        el("td", { cls: "exh-r", text: credStudents(r).word }),
        el("td", { text: credAdoption(r) })]));
    });
    table.appendChild(body);
    wrap.appendChild(table);
    box.appendChild(wrap);
    var foot = el("p", { cls: "exh-small exh-muted" }, [list.length
      ? "Showing " + fmt(Math.min(cs.limit, list.length)) + " of " + fmt(list.length) + ", most students first. "
      : (cs.q.trim() ? "No credential matches." : "No credentials.")]);
    if (list.length > cs.limit) {
      foot.appendChild(word("Show " + fmt(Math.min(CRED_PAGE, list.length - cs.limit)) + " more", function () {
        cs.limit += CRED_PAGE; redrawCredTable();
      }, { cls: "exh-w exh-small" }));
    }
    box.appendChild(foot);
    return box;
  }
  function redrawCredTable() {
    var old = document.querySelector(".exh-ctable");
    if (old && old.parentNode) old.parentNode.replaceChild(credTable(credRows()), old);
  }
  function siteRow(r, d, k, colleges) {
    var x = d.sites[k];
    var sel = el("select", { id: "exh-c-col-" + k, "aria-label": "College for training site " + (k + 1) });
    var opts = [""].concat(colleges);
    if (x.college && opts.indexOf(x.college) === -1) opts.push(x.college);
    opts.forEach(function (c) {
      var o = el("option", { value: c, text: c ? shortName(c) : "Any college" });
      if (c === (x.college || "")) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { x.college = sel.value; });
    var inp = el("input", { id: "exh-c-site-" + k, type: "text", autocomplete: "off",
      placeholder: "Local school house or training center", "aria-label": "Training site " + (k + 1) });
    inp.value = x.site || "";
    inp.addEventListener("input", function () { x.site = inp.value; });
    var rm = word("Remove", function () {
      d.sites.splice(k, 1); render();
      var a = document.getElementById("exh-c-add"); if (a) a.focus();
    }, { "aria-label": "Remove training site " + (k + 1) });
    return el("div", { cls: "exh-siteitem" }, [el("div", { cls: "exh-siterow" }, [sel, inp, rm]),
      suggest(inp, "sites", function (t) { x.site = t; })]);
  }
  function credPanel(r) {
    var cs = state.cs, d = credDraft(r);
    var p = el("section", { cls: "exh-card exh-cpanel", id: "exh-cpanel", "aria-labelledby": "exh-c-h" });
    p.appendChild(el("h3", { cls: "exh-ph", id: "exh-c-h", tabindex: "-1", text: credName(r) }));
    p.appendChild(el("div", { cls: "exh-chiprow" }, [el("span", { cls: "exh-chip", tabindex: "0", "data-tip": TIPS[IN_REF],
      "aria-label": "CER step: " + IN_REF + ". " + TIPS[IN_REF] }, ["CER step: " + IN_REF])]));

    var called = el("div", { cls: "exh-block" }, [el("h4", { cls: "exh-q", text: "What is it called?" })]);
    var issuer = el("input", { id: "exh-c-issuer", type: "text", autocomplete: "off", placeholder: "None named" });
    issuer.value = d.issuer;
    issuer.addEventListener("input", function () { d.issuer = issuer.value; });
    called.appendChild(el("label", { cls: "exh-inbox", "for": "exh-c-issuer" }, [el("span", { cls: "exh-pre", text: "Issuer:" }), issuer]));
    called.appendChild(suggest(issuer, "issuers", function (t) { d.issuer = t; }));
    var also = (r.issuers || []).filter(function (x) { return x !== d.issuer.trim() && x !== (r.issuer || ""); });
    if (also.length) called.appendChild(el("p", { cls: "exh-muted exh-small", text: "Also issued by " + also.join(", ")
      + ". The Common Exhibit Reference edits a credential's other issuers." }));
    var fs = el("fieldset", { cls: "exh-sites" }, [el("legend", { cls: "exh-cl", text: "Training sites" })]);
    var colleges = credArt(r);
    if (!d.sites.length) fs.appendChild(el("p", { cls: "exh-muted exh-small", text: "None named" }));
    d.sites.forEach(function (x, k) { fs.appendChild(siteRow(r, d, k, colleges)); });
    fs.appendChild(el("p", { cls: "exh-muted exh-small", text: colleges.length
      ? "Name the college a site trains for, or leave Any college." : "No college articulates it yet, so each site reads Any college." }));
    called.appendChild(fs);
    var acts = el("div", { cls: "exh-acts" }, [
      word("Add a training site", function () {
        d.sites.push({ site: "", college: colleges.length === 1 ? colleges[0] : "" });
        render();
        var n = document.getElementById("exh-c-site-" + (d.sites.length - 1)); if (n) n.focus();
      }, { id: "exh-c-add" }),
      word("Save", function () { credSave(r); }, { id: "exh-c-save" })]);
    called.appendChild(acts);
    called.appendChild(el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: cs.note || "" }));
    var vars = (r.raw_variants || []).map(function (v) { return v.r; });
    var shownVars = cs.showTitles ? vars : vars.slice(0, 3);
    var lt = el("p", { cls: "exh-small" }, [el("span", { cls: "exh-cl", text: "Local titles: " }), shownVars.join(" · ") || "None"]);
    if (vars.length > 3) {
      lt.appendChild(document.createTextNode(" "));
      lt.appendChild(word(cs.showTitles ? "Show fewer" : "and " + (vars.length - 3) + " more",
        function () { cs.showTitles = !cs.showTitles; render(); }, { cls: "exh-w exh-small" }));
    }
    called.appendChild(lt);
    p.appendChild(called);

    var credit = el("div", { cls: "exh-block" }, [el("h4", { cls: "exh-q", text: "What credit does it carry?" })]);
    var dl = el("dl", { cls: "exh-dl" });
    function dd(label, value) { if (value) { dl.appendChild(el("dt", { text: label })); dl.appendChild(el("dd", { text: value })); } }
    dd(r.ccc_rec ? "Statewide recommendation" : "Credit recommendation", r.ccc_rec || r.gen_rec || "None in MAP");
    dd("CPL type", (r.cpl_types || []).join(", "));
    dd("Discipline", r.disc_modal || "");
    var ids = (r.articulations || []).map(function (a) { return (a.sys ? a.sys + " " : "") + a.cid + (a.title ? ", " + a.title : ""); });
    dd("Courses", ids.slice(0, 3).join("; ") + (ids.length > 3 ? "; and " + (ids.length - 3) + " more" : ""));
    var ad = credAdopt(r);
    if (ad && ad.s) {
      var sector = ((cs.adopt && cs.adopt.cip_sectors) || {})[ad.s];
      dd("Field", "CIP " + ad.s + (sector ? ", " + sector : ""));
    }
    if (ad && ad.p) dd("Units", "The median articulating college awards " + fmt(ad.p) + (ad.p === 1 ? " unit" : " units"));
    credit.appendChild(dl);
    if (ad && ad.x && ad.x.length) {
      var recs = cs.showRecords ? ad.x : ad.x.slice(0, 3);
      var xp = el("p", { cls: "exh-small" }, [el("span", { cls: "exh-cl", text: "Exhibits in MAP (" + ad.x.length + "): " })]);
      recs.forEach(function (x, k) {
        if (k) xp.appendChild(document.createTextNode(" · "));
        xp.appendChild(el("span", { title: x[0], text: (x[1] || x[0]) + (x[2] ? ", " + fmt(x[2]) + (x[2] === 1 ? " unit" : " units") : "") }));
      });
      if (ad.x.length > 3) {
        xp.appendChild(document.createTextNode(" "));
        xp.appendChild(word(cs.showRecords ? "Show fewer" : "and " + (ad.x.length - 3) + " more",
          function () { cs.showRecords = !cs.showRecords; render(); }, { cls: "exh-w exh-small" }));
      }
      credit.appendChild(xp);
    }
    p.appendChild(credit);

    var adopt = el("div", { cls: "exh-block" }, [el("h4", { cls: "exh-q", text: "Who could adopt it?" })]);
    var st = credStudents(r);
    adopt.appendChild(el("p", { cls: "exh-small", text: st.n >= 10 ? st.word + " students with credit"
      : st.n ? "Too few students to show" : "No students with credit yet" }));
    /* A college chip opens what it articulated, or the course it already teaches, and the way to adopt in MAP
       (Sam, 2026-10-30: "When college could adopt chips clicked they should open with the courses and Request
       Quick Adopt links"). Exhibit Adoption's cell panel, folded in. */
    function names(kind, label, list, all, toggle) {
      var box = el("span", { cls: "exh-cchips" });
      if (!list.length) box.appendChild(el("span", { cls: "exh-muted", text: kind === "c" && !cs.adopt
        ? (cs.adoptErr ? "Could not be read" : "Reading") : "None yet" }));
      (all ? list : list.slice(0, CHIP_MAX)).forEach(function (n) {
        var on = cs.open && cs.open.k === kind && cs.open.n === n;
        var b = el("button", { type: "button", cls: "exh-cchip", title: n, "aria-controls": "exh-c-adopt",
          "aria-expanded": on ? "true" : "false" }, [shortName(n)]);
        b.addEventListener("click", function () { cs.open = on ? null : { k: kind, n: n }; render(); });
        box.appendChild(b);
      });
      if (list.length > CHIP_MAX) box.appendChild(word(all ? "Show fewer" : "and " + (list.length - CHIP_MAX) + " more", toggle, { cls: "exh-w exh-small" }));
      return el("div", { cls: "exh-ccrow" }, [el("span", { cls: "exh-cl", text: label + " (" + list.length + ")" }), box]);
    }
    var could = credCould(r);
    adopt.appendChild(names("a", "Articulated at", colleges, cs.showArt, function () { cs.showArt = !cs.showArt; render(); }));
    adopt.appendChild(names("c", "Could adopt", could, cs.showCould, function () { cs.showCould = !cs.showCould; render(); }));
    if (ad && ad.w) adopt.appendChild(el("p", { cls: "exh-small exh-muted", text: fmt(ad.w) + (ad.w === 1 ? " college teaches" : " colleges teach")
      + " a course under an identity that joins too many courses to name them; curating the identity names them." }));
    adopt.appendChild(credAdoptBox(r, ad));
    var L = window.CPL_MAP_LINKS;
    if (L && typeof L.node === "function") adopt.appendChild(L.node(r.ut));
    p.appendChild(adopt);
    p.appendChild(el("p", { cls: "exh-small exh-muted" }, ["Its other issuers, discipline and title edits are in ",
      el("a", { href: "#credential-reference", text: "the Common Exhibit Reference" }), "."]));
    return p;
  }
  function credAdoptBox(r, ad) {
    var cs = state.cs, o = cs.open;
    var box = el("div", { cls: "exh-adopt", id: "exh-c-adopt" });
    if (!o) { box.hidden = true; return box; }
    box.appendChild(el("h4", { text: o.n }));
    if (!cs.adopt) {
      box.appendChild(el("p", { cls: "exh-muted", text: cs.adoptErr ? "What each college articulated could not be read." : "Reading…" }));
      return box;
    }
    if (o.k === "a") {
      var got = adoptMap(ad && ad.a)[o.n];
      if (got && got[1].length) {
        box.appendChild(el("p", { cls: "exh-muted", text: "Articulated, " + fmt(got[0]) + (got[0] === 1 ? " unit" : " units") + " in all:" }));
        box.appendChild(el("ul", null, got[1].map(function (l) { return el("li", { text: [l[0], l[1]].filter(Boolean).join(": ") }); })));
      } else {
        box.appendChild(el("p", { cls: "exh-muted", text: "Articulates it; MAP lists no credit recommendation line for this college." }));
      }
      var own = builtBy(r, o.n);
      if (own.length) {
        box.appendChild(el("p", null, ["Its exhibit in MAP, for others to Request Quick Adopt from: "].concat(own.slice(0, 3).map(function (id, k) {
          return el("span", null, [k ? ", " : "", el("a", { href: linkUrl(id), target: "_blank", rel: "noopener", text: id })]);
        }))));
      }
      return box;
    }
    var rows = adoptMap(ad && ad.c)[o.n] || [];
    box.appendChild(el("p", { cls: "exh-muted", text: rows.length ? "Already teaches a course mapped to it:" : "No course on file here; the college's faculty choose the course." }));
    if (rows.length) box.appendChild(courseList(rows));
    box.appendChild(el("p", { cls: "exh-muted exh-small", text: "Request Quick Adopt from an exhibit a college built, below." }));
    return box;
  }
  function renderCredentials(wrap) {
    var cs = state.cs;
    wrap.appendChild(credTiles());
    wrap.appendChild(credMoreTiles());
    wrap.appendChild(viewsNav());
    if (cs.error) { wrap.appendChild(el("p", { cls: "exh-empty", text: "The credentials could not be read (" + cs.error + ")." })); return; }
    if (!cs.rows) { wrap.appendChild(el("p", { cls: "exh-empty", text: "Reading the credentials…" })); return; }
    var find = el("div", { cls: "exh-finder" });
    find.appendChild(el("label", { cls: "exh-muted exh-small", "for": "exh-c-find", text: "Find a credential" }));
    var q = el("input", { cls: "exh-search", id: "exh-c-find", type: "search", autocomplete: "off",
      placeholder: "Credential, issuer, training site or local title" });
    q.value = cs.q;
    q.addEventListener("input", function () { cs.q = q.value; cs.limit = CRED_PAGE; redrawCredTable(); });
    find.appendChild(q);
    wrap.appendChild(find);
    if (cs.overlayOk === false) wrap.appendChild(el("p", { cls: "exh-muted exh-small",
      text: "Today's saves could not be read, so the credentials show as of " + (stamp(cs.generated) || "the last daily run") + "." }));
    var sel = cs.sel && cs.rows.filter(function (r) { return r.ut === cs.sel; })[0];
    var split = el("div", { cls: "exh-split" + (sel ? " exh-has-panel" : "") });
    split.appendChild(credTable(credRows()));
    if (sel) split.appendChild(credPanel(sel));
    else if (cs.sel) split.appendChild(el("p", { cls: "exh-empty", text: "“" + cs.sel + "” is not in the reference yet. The nightly run adds it." }));
    wrap.appendChild(split);
    if (state.studentsWord === "signin" && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
      var mount = el("div", { cls: "exh-signin" });
      wrap.appendChild(mount);
      window.CPL_REVIEWER_SIGNIN.mountInto(mount, { title: "Sign in to edit",
        blurb: "A reviewer's sign-in saves a credential's issuer and training sites.", returnTab: "exhibits" });
    }
  }
  /* ── List: every credential on one sheet, A to Z (Sam, 2026-11-01) ──
     "a simple exhibit view in small font, alpha order with tight margins and padding. I want to be able to scan
     and correct directly on the view exhibit titles next to their key information, such as status, CIP title,
     Subject, Discipline, issuing agency, CPL types". Fable advised the columns (S540, docs/cer_procedures lessons):
     no TOP column (Rule 7: TOP is last-in-line), the CIP field named as a family read from TOP, never a code;
     the discipline is the M-IDs' own. Edit saves what the credential panel saves (issuer, training sites) and the
     rename field the reference already reads (unified_title_override; the daily dry-run checks collisions and a
     reviewed apply re-keys). Re-analyze my changes writes one request row the CPL queue routine works. */
  var LIST_LIMIT = 400;
  var LIST_FILTERS = [
    ["", "All"],
    ["unreviewed", "Unreviewed"],
    ["low", "Low-confidence title"],
    ["flagged", "Quality flag"],
    ["mine", "Your flags"],
    ["selected", "Selected"],
    ["bare", "No articulation"],
    ["changed", "Changed this visit"]
  ];
  function listState() {
    return state.ls || (state.ls = { q: "", f: "", limit: LIST_LIMIT, edit: null, draft: null, changed: [], note: "",
      busy: false, collisions: null, sort: [{ col: 0, dir: 1 }], cf: {}, wrap: false, widths: null, sel: {}, open: null, flagBusy: {} });
  }
  /* The columns, each with what it shows (Sam, 2026-11-01: "sometimes I miss good ol' Excel, where I can quickly
     filter any column, sort any way ... use find and replace to fix things on the fly--that freedom is what you're
     doing for me"). One accessor serves the cell, the column's filter, the sort and the download. */
  function listCols() {
    return [
      { h: "Title", w: 19, v: function (r) { return listTitle(r); } },
      { h: "Status", w: 8, v: function (r) { return listStatus(r) + (r.quality_flag ? "; " + String(r.quality_flag).replace(/_/g, " ") : ""); } },
      // The classifier's title confidence, a percent (Sam, 2026-11-01: "add the confidence indicator as a column").
      { h: "Confidence", w: 5, n: true, v: function (r) { return r.conf_title != null ? Math.round(r.conf_title * 100) : null; } },
      { h: "CPL types", w: 9, v: function (r) { return (r.cpl_types || []).join(", "); } },
      { h: "Issuer", w: 11, v: function (r) { return credCurrent(r).issuer || ""; } },
      { h: "Training sites", w: 9, v: function (r) { return credCurrent(r).sites.map(function (x) { return x.site; }).join("; "); } },
      { h: "Discipline (M-IDs)", w: 9, v: function (r) { return r.disc_modal || ""; } },
      { h: "Common SUBJ", w: 5, v: listSubj },
      { h: "CIP family (from TOP)", w: 8, v: listCip },
      { h: "Colleges", w: 5, n: true, v: function (r) { return credColleges(r).length; } },
      { h: "MAP titles", w: 5, n: true, v: function (r) { return r.raw_count || 0; } }
    ];
  }
  function listStatus(r) {
    var by = String(r.curated_by || "");
    if (!r.curated_at && !by) return "Unreviewed";
    return /@bot$/.test(by) ? "Cohort" : "Person";
  }
  function listSubj(r) {
    var out = [];
    (r.articulations || []).forEach(function (a) {
      var p = String(a.cid || "").split(" ")[0];
      if (a.sys === "M-ID" && p && out.indexOf(p) === -1) out.push(p);
    });
    return out.join(", ");
  }
  function listCip(r) {
    var ad = credAdopt(r);
    if (!ad || !ad.s) return "";
    var name = ((state.cs.adopt && state.cs.adopt.cip_sectors) || {})[ad.s];
    return ad.s + (name ? " " + name : "");
  }
  function listTitle(r) {
    var o = state.cs.overlay[r.ut] || {};
    return o.title ? o.title : credName(r);
  }
  function listCollision(r) {
    var c = listState().collisions;
    if (!c) return null;
    return c.filter(function (x) { return x.old_unified_title === r.ut; })[0] || null;
  }
  function listRows() {
    var L = listState(), cs = state.cs, q = L.q.trim().toLowerCase();
    // Custom sort (Sam, 2026-11-01: "first by title then by issuer or vice versa ... like Excel Custom sort"): the
    // levels apply in order; a press on a header sorts by it alone, Shift and a press adds it as the next level.
    var C0 = listCols(), levels = L.sort.length ? L.sort : [{ col: 0, dir: 1 }];
    function cmp(a, b, lv) {
      var sc = C0[lv.col] || C0[0], x = sc.v(a), y = sc.v(b);
      if (sc.n) {
        if ((x == null || y == null) && x !== y) return x == null ? 1 : -1;
        return lv.dir * ((+x || 0) - (+y || 0));
      }
      x = String(x || ""); y = String(y || "");
      if ((!x || !y) && x !== y) return x ? -1 : 1;   // blanks last, either way
      return lv.dir * x.toLowerCase().localeCompare(y.toLowerCase());
    }
    var rows = cs.rows.slice().sort(function (a, b) {
      for (var i = 0; i < levels.length; i++) { var c = cmp(a, b, levels[i]); if (c) return c; }
      return listTitle(a).toLowerCase().localeCompare(listTitle(b).toLowerCase());
    });
    return rows.filter(function (r) {
      if (L.f === "unreviewed" && listStatus(r) !== "Unreviewed") return false;
      if (L.f === "low" && !(r.conf_title != null && r.conf_title < 0.6)) return false;
      if (L.f === "flagged" && !r.quality_flag) return false;
      if (L.f === "bare" && (r.articulations || []).length) return false;
      if (L.f === "changed" && L.changed.indexOf(r.ut) === -1) return false;
      if (L.f === "mine" && !listFlag(r)) return false;
      if (L.f === "selected" && !L.sel[r.ut]) return false;
      var cols = listCols();
      for (var k in L.cf) {
        var want = String(L.cf[k] || "").trim().toLowerCase();
        if (want && String(cols[+k].v(r)).toLowerCase().indexOf(want) === -1) return false;
      }
      if (!q) return true;
      var cur = credCurrent(r);
      var hay = [r.ut, listTitle(r), cur.issuer, cur.sites.map(function (x) { return x.site; }).join(" "), (r.cpl_types || []).join(" "),
        r.disc_modal, listSubj(r), r.top_modal, r.quality_flag].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }
  function listSave(r) {
    var L = listState(), d = L.draft, cur = credCurrent(r), cs = state.cs;
    var title = d.title.replace(/\s+/g, " ").trim(), issuer = d.issuer.replace(/\s+/g, " ").trim();
    var sites = d.sites.split(";").map(function (x) { return x.replace(/\s+/g, " ").trim(); })
      .filter(Boolean).map(function (x) { return { site: x }; });
    var writes = [];
    if (!title) { L.note = "A title cannot be empty."; render(); return Promise.resolve(); }
    if (title !== listTitle(r)) writes.push([FIELD_CRED_TITLE, title === r.ut ? "" : title]);
    if (issuer !== (cur.issuer || "")) writes.push([FIELD_CRED_ISSUER, issuer]);
    var curSites = cur.sites.map(function (x) { return x.site; }).join("; ");
    if (sites.map(function (x) { return x.site; }).join("; ") !== curSites) {
      writes.push([FIELD_CRED_SITES, JSON.stringify(sites)]);
      writes.push([FIELD_CRED_TRAINER, joinSites(sites)]);
    }
    if (!writes.length) { L.edit = null; L.draft = null; L.note = "Nothing changed."; render(); return Promise.resolve(); }
    L.busy = true; render();
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return Promise.all(writes.map(function (w) { return saveCredRow(sess, r.ut, w[0], w[1]); }));
    }).then(function (rs) {
      if (!rs.every(function (x) { return x.ok; })) throw new Error("HTTP " + rs.map(function (x) { return x.status; }).join("/"));
      var o = cs.overlay[r.ut] = cs.overlay[r.ut] || {};
      var now = new Date().toISOString();
      writes.forEach(function (w) {
        if (w[0] === FIELD_CRED_ISSUER) o.issuer = w[1];
        else if (w[0] === FIELD_CRED_TRAINER) { o.trainer = w[1]; o.trainerAt = now; }
        else if (w[0] === FIELD_CRED_SITES) { o.sites = w[1]; o.sitesAt = now; }
        else o.title = w[1];
      });
      if (L.changed.indexOf(r.ut) === -1) L.changed.push(r.ut);
      L.busy = false; L.edit = null; L.draft = null;
      L.note = "Saved “" + listTitle(r) + "”." + (writes.some(function (w) { return w[0] === FIELD_CRED_TITLE; })
        ? " The new title shows now; the daily run checks it for a collision, and a reviewed apply renames it in the reference." : "");
      render();
    }).catch(function (e) {
      L.busy = false;
      L.note = e && e.message === "signin" ? "Sign in as a reviewer to save."
        : "The save did not reach the reference (" + (e && e.message || "no answer") + "). Nothing changed; try again.";
      render();
    });
  }
  /* One request row a press: the credentials changed this visit and the reader's note. The routine reads every
     change since its last re-analysis from kb_curation itself, so a list left empty still asks for a full pass. */
  function listReanalyze() {
    var L = listState(), note = L.comments || (document.getElementById("exh-l-note") || {}).value || "";
    L.busy = true; render();
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      var when = new Date().toISOString();
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
        method: "POST", headers: headers(sess, { "Prefer": "return=minimal" }),
        body: JSON.stringify({ course_id: REANALYSIS_PREFIX + when + "-" + Math.random().toString(36).slice(2, 6),
          field: FIELD_REANALYSIS, reviewer_email: sess.email, reviewed_at: when,
          value: JSON.stringify({ changed: L.changed.slice(0, 200), comments: String(note).trim().slice(0, 4000) }) })
      });
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      L.busy = false; L.comments = "";
      L.note = "Queued with your comments. " + ROUTINE_WHEN + " looks at what changed: the code checks (a rename that collides, an issuer spelled two ways, " +
        "a credential with no CPL type) and Jev's two questions (the same credential under two names? an issuer that is really a training site?). " +
        "Its findings come back to you as cards on the standing decision sheet until this view shows them.";
      render();
    }).catch(function (e) {
      L.busy = false;
      L.note = e && e.message === "signin" ? "Sign in as a reviewer to ask for a re-analysis."
        : "The request did not reach the routine (" + (e && e.message || "no answer") + "). Try again.";
      render();
    });
  }
  function listCell(text, cls) {
    var t = text == null ? "" : String(text);
    return el("td", { cls: cls || null, text: t, title: t || null });
  }
  function listEditRow(r) {
    var L = listState(), d = L.draft;
    function box(id, label, key, ph) {
      var i = el("input", { id: id, type: "text", cls: "exh-l-in", placeholder: ph || "" });
      i.value = d[key];
      i.addEventListener("input", function () { d[key] = i.value; });
      return el("label", { cls: "exh-l-f", "for": id }, [el("span", { text: label }), i]);
    }
    var td = el("td", { colspan: "13" }, [
      el("div", { cls: "exh-l-edit" }, [
        box("exh-l-t", "Title", "title"), box("exh-l-i", "Issuer", "issuer"),
        box("exh-l-s", "Training sites, separated by ;", "sites", "Site; Site"),
        el("div", { cls: "exh-l-acts" }, [
          word(L.busy ? "Saving…" : "Save", function () { listSave(r); }),
          word("Cancel", function () { L.edit = null; L.draft = null; render(); })])])]);
    return el("tr", { cls: "exh-l-editrow" }, [td]);
  }
  function renderList(wrap) {
    var L = listState(), cs = state.cs;
    ensureListCss();
    wrap.appendChild(viewsNav());
    if (cs.error) { wrap.appendChild(el("p", { cls: "exh-empty", text: "The credentials could not be read (" + cs.error + ")." })); return; }
    if (!cs.rows) { wrap.appendChild(el("p", { cls: "exh-empty", text: "Reading the credentials…" })); return; }
    if (L.collisions == null) {
      L.collisions = [];
      fetch(COLLISIONS_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { L.collisions = (d && d.collisions) || []; if (state.view === "list") render(); }).catch(function () {});
    }
    var bar = el("div", { cls: "exh-l-bar" });
    var q = el("input", { cls: "exh-search exh-l-q", id: "exh-l-find", type: "search", autocomplete: "off",
      placeholder: "Title, issuer, discipline, subject or CPL type", "aria-label": "Find in the list" });
    q.value = L.q;
    q.addEventListener("input", function () { L.q = q.value; L.limit = LIST_LIMIT; redrawList(); });
    bar.appendChild(q);
    var fl = el("div", { cls: "exh-l-filters", role: "group", "aria-label": "Show" });
    LIST_FILTERS.forEach(function (f) {
      if (f[0] === L.f) fl.appendChild(el("span", { cls: "exh-view-on", "aria-current": "true", text: f[1] }));
      else fl.appendChild(word(f[1], function () { L.f = f[0]; L.limit = LIST_LIMIT; render(); }));
    });
    bar.appendChild(fl);
    wrap.appendChild(bar);
    if (cs.overlayOk === false) wrap.appendChild(el("p", { cls: "exh-muted exh-small",
      text: "Today's saves could not be read, so the list shows the reference as of " + (stamp(cs.generated) || "the last daily run") + "." }));
    // The comments box (Sam, 2026-11-01: "add in a comments box to the reanalysis routine where I can add my
    // observations or concerns or opportunities to better inform the reanalysis"). Kept across repaints this visit.
    var box = el("textarea", { id: "exh-l-note", cls: "exh-l-in exh-l-ta", rows: "3", maxlength: "4000",
      placeholder: "Observations, concerns or opportunities: what you were fixing, a pattern you noticed, titles that should fold, an issuer that looks wrong" });
    box.value = L.comments || "";
    box.addEventListener("input", function () { L.comments = box.value; });
    var re = el("div", { cls: "exh-l-re" }, [
      el("label", { cls: "exh-l-relabel", "for": "exh-l-note", text: "Your comments for the re-analysis" }),
      box,
      el("div", { cls: "exh-l-acts" }, [word(L.busy ? "Working…" : "Re-analyze my changes", listReanalyze),
        el("span", { cls: "exh-muted exh-small", text: L.changed.length
          ? fmt(L.changed.length) + " changed this visit go with it" : "With no change this visit, it looks over everything you changed since its last pass" })])]);
    wrap.appendChild(re);
    if (L.note) wrap.appendChild(el("p", { cls: "exh-note", role: "status", text: L.note }));
    wrap.appendChild(el("div", { id: "exh-l-host" }, [listTable()]));
    listSyncGrips();
  }
  function redrawList() {
    var host = document.getElementById("exh-l-host");
    if (!host) { render(); return; }
    while (host.firstChild) host.removeChild(host.firstChild);
    host.appendChild(listTable());
    listSyncGrips();
  }
  function listTable() {
    var L = listState(), rows = listRows(), shown = rows.slice(0, L.limit);
    var C = listCols();
    var editW = 100 - 6 - C.reduce(function (a, c) { return a + c.w; }, 0);
    var cols = el("colgroup", null, [el("col", { style: "width:32px" }), el("col", { style: "width:32px" })].concat(C.map(function (c, i) {
      return el("col", { style: "width:" + (L.widths ? L.widths[i] + "px" : c.w + "%") }); }))
      .concat([el("col", { style: "width:" + (L.widths ? L.widths[C.length] + "px" : editW + "%") })]));
    var allBox = el("input", { type: "checkbox", id: "exh-l-selall", "aria-label": "Select every row shown" });
    allBox.checked = shown.length > 0 && shown.every(function (r) { return L.sel[r.ut]; });
    allBox.addEventListener("change", function () {
      shown.forEach(function (r) { if (allBox.checked) L.sel[r.ut] = true; else delete L.sel[r.ut]; });
      redrawList(); var b = document.getElementById("exh-l-selall"); if (b) b.focus();
    });
    var headRow = el("tr", null, [el("th", { scope: "col", cls: "exh-l-box" }, [allBox]),
      el("th", { scope: "col", cls: "exh-l-box", text: "Flag" })].concat(C.map(function (c, i) {
      var lvIdx = -1; L.sort.forEach(function (x, k) { if (x.col === i) lvIdx = k; });
      var on = lvIdx > -1, up = on && L.sort[lvIdx].dir > 0;
      var b = el("button", { type: "button", cls: "exh-l-sort", title: "Press to sort by this column; Shift and press to sort within the sort already set" },
        [c.h + (!on ? "" : (L.sort.length > 1 ? " (" + (lvIdx + 1) + ")" : "") + (c.n ? (up ? ", low to high" : ", high to low") : (up ? ", A to Z" : ", Z to A")))]);
      b.addEventListener("click", function (e) {
        if (e.shiftKey) {
          if (on) L.sort[lvIdx].dir = -L.sort[lvIdx].dir; else L.sort.push({ col: i, dir: 1 });
        } else L.sort = [{ col: i, dir: on && L.sort.length === 1 ? -L.sort[0].dir : 1 }];
        redrawList();
        var nb = document.querySelectorAll(".exh-l-sort")[i]; if (nb) nb.focus();
      });
      return el("th", { scope: "col", "aria-sort": lvIdx === 0 ? (up ? "ascending" : "descending") : "none" }, [b, listGrip(i, c.h)]);
    })).concat([el("th", { scope: "col" }, [el("span", { cls: "exh-vh", text: "Edit" })])]));
    var filterRow = el("tr", { cls: "exh-l-cf" }, [el("td"), el("td")].concat(C.map(function (c, i) {
      var inp = el("input", { type: "search", cls: "exh-l-in exh-l-cfin", id: "exh-l-cf-" + i, autocomplete: "off",
        "aria-label": "Filter " + c.h, placeholder: "Filter" });
      inp.value = L.cf[i] || "";
      inp.addEventListener("input", function () {
        L.cf[i] = inp.value; L.limit = LIST_LIMIT; redrawList();
        var n = document.getElementById("exh-l-cf-" + i); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} }
      });
      return el("td", null, [inp]);
    })).concat([el("td")]));
    var thead = el("thead", null, [headRow, filterRow]);
    var body = el("tbody");
    shown.forEach(function (r) {
      var cur = credCurrent(r), o = state.cs.overlay[r.ut] || {}, col = listCollision(r);
      var titleTd = el("td", { cls: "exh-l-title", title: listTitle(r) }, [listTitle(r)]);
      if (o.title) titleTd.appendChild(el("span", { cls: "exh-l-sub", text: "renamed from " + r.ut + "; pending the apply" }));
      if (col) titleTd.appendChild(el("span", { cls: "exh-l-sub", text: "collides with " + (col.proposed_new_title || "an existing title") }));
      if (L.changed.indexOf(r.ut) !== -1) titleTd.appendChild(el("span", { cls: "exh-l-sub", text: "changed this visit" }));
      var editBtn = word("Edit", function () {
        L.edit = r.ut;
        L.draft = { title: listTitle(r), issuer: cur.issuer || "", sites: cur.sites.map(function (x) { return x.site; }).join("; ") };
        L.note = ""; redrawList();
        var t = document.getElementById("exh-l-t"); if (t) t.focus();
      }, { "aria-label": "Edit " + listTitle(r) });
      var selBox = el("input", { type: "checkbox", "aria-label": "Select " + listTitle(r) });
      selBox.checked = !!L.sel[r.ut];
      selBox.addEventListener("change", function () { if (selBox.checked) L.sel[r.ut] = true; else delete L.sel[r.ut]; listCountSel(); });
      var flagBox = el("input", { type: "checkbox", "aria-label": "Flag " + listTitle(r), title: listFlag(r) ? "Flagged " + stamp(listFlag(r)) : null });
      flagBox.checked = !!listFlag(r);
      flagBox.disabled = !!L.flagBusy[r.ut];
      flagBox.addEventListener("change", function () { listSetFlag(r, flagBox.checked); });
      var open = L.open && L.open.ut === r.ut ? L.open.col : -1;
      titleTd.insertBefore(listOpener(r, 0, listTitle(r), open === 0), titleTd.firstChild);
      titleTd.removeChild(titleTd.childNodes[1]);
      body.appendChild(el("tr", { cls: (L.sel[r.ut] ? "exh-l-sel" : "") + (listFlag(r) ? " exh-l-flagged" : "") || null }, [
        el("td", { cls: "exh-l-box" }, [selBox]), el("td", { cls: "exh-l-box" }, [flagBox]), titleTd].concat(C.slice(1).map(function (c, k) {
        var v = c.v(r), t = c.n ? (v == null ? "" : fmt(v) + (c.h === "Confidence" ? "%" : "")) : v;
        var td = el("td", { cls: c.n ? "exh-l-n" : null, title: t ? String(t) : null });
        td.appendChild(listOpener(r, k + 1, t == null ? "" : String(t), open === k + 1));
        return td;
      }), [el("td", null, [editBtn])])));
      if (open > -1) body.appendChild(listDrawer(r, open));
      if (L.edit === r.ut && L.draft) body.appendChild(listEditRow(r));
    });
    var region = el("div", { cls: "exh-l-wrap", role: "region", "aria-label": "Every credential, A to Z", tabindex: "0" }, [
      el("table", { cls: "exh-l-table" + (L.wrap ? "" : " exh-l-nowrap"),
        style: L.widths ? "width:" + (L.widths.reduce(function (a, w) { return a + w; }, 0) + 64) + "px" : null }, [cols, thead, body])]);
    var dl = word("Download these " + fmt(rows.length) + " as a spreadsheet", function () { listDownload(rows); });
    // Wrap text (Sam, 2026-11-01: "a toggle to wrap or unwrap all fields and set it to default unwrapped ... that tight
    // scrollable, scannable view I need"). Unwrapped, each cell keeps one line and shows the rest on hover.
    var wrapBtn = word("Wrap text", function () { L.wrap = !L.wrap; redrawList(); var b = document.getElementById("exh-l-wrap"); if (b) b.focus(); },
      { id: "exh-l-wrap", "aria-pressed": L.wrap ? "true" : "false" });
    var out = el("div", null, [el("div", { cls: "exh-l-count" }, [el("span", { cls: "exh-muted exh-small", text: fmt(rows.length) + " credentials" +
      (rows.length > shown.length ? ", the first " + fmt(shown.length) + " shown" : "") }),
      el("span", { cls: "exh-muted exh-small", id: "exh-l-selcount", text: listSelWords() }),
      el("span", { cls: "exh-muted exh-small", id: "exh-l-sortline", text: "Sorted by " + L.sort.map(function (x) {
        var c = listCols()[x.col]; return c.h + (c.n ? (x.dir > 0 ? ", low to high" : ", high to low") : (x.dir > 0 ? ", A to Z" : ", Z to A")); }).join(", then ")
        + ". Shift and press a header to add a level." }),
      L.sort.length > 1 || L.sort[0].col !== 0 || L.sort[0].dir !== 1 ? word("Clear the sort", function () { L.sort = [{ col: 0, dir: 1 }]; redrawList(); }) : null,
      word("Clear the selection", function () { L.sel = {}; redrawList(); }), wrapBtn, dl]), region]);
    if (rows.length > shown.length) out.appendChild(word("Show " + fmt(Math.min(LIST_LIMIT, rows.length - shown.length)) + " more",
      function () { L.limit += LIST_LIMIT; redrawList(); }));
    return out;
  }
  function listFlag(r) { var o = state.cs.overlay[r.ut]; return o && o.flag ? o.flag : ""; }
  function listSelWords() {
    var n = Object.keys(listState().sel).length;
    return n ? fmt(n) + " selected" : "";
  }
  function listCountSel() { var n = document.getElementById("exh-l-selcount"); if (n) n.textContent = listSelWords(); }
  /* Your flag: set writes the time, clear writes "". Both are upserts on (course_id, field). */
  function listSetFlag(r, on) {
    var L = listState(), cs = state.cs;
    L.flagBusy[r.ut] = true;
    var when = on ? new Date().toISOString() : "";
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return saveCredRow(sess, r.ut, FIELD_LIST_FLAG, when);
    }).then(function (x) {
      if (!x.ok) throw new Error("HTTP " + x.status);
      (cs.overlay[r.ut] = cs.overlay[r.ut] || {}).flag = when;
      delete L.flagBusy[r.ut];
      L.note = (on ? "Flagged “" : "Cleared the flag on “") + listTitle(r) + "”.";
      render();
    }).catch(function (e) {
      delete L.flagBusy[r.ut];
      L.note = e && e.message === "signin" ? "Sign in as a reviewer to flag a row."
        : "The flag did not save (" + (e && e.message || "no answer") + "). Nothing changed; try again.";
      render();
    });
  }
  /* A cell opens its drill-down in a drawer under the row (Sam, 2026-11-01: "how many of these fields can you make
     drill downs for on click?"; "build the open in detail as you propose"). A second press closes it. */
  function listOpener(r, col, text, isOpen) {
    var L = listState();
    var b = el("button", { type: "button", cls: "exh-l-open", "aria-expanded": isOpen ? "true" : "false",
      "aria-label": listCols()[col].h + ": " + (text || "none") + ", details" }, [text || "—"]);
    b.addEventListener("click", function () {
      L.open = isOpen ? null : { ut: r.ut, col: col }; L.edit = null; redrawList();
      var again = document.querySelector('.exh-l-open[aria-expanded="true"]'); if (again) again.focus();
    });
    return b;
  }
  function listFilterBy(col, value) {
    var L = listState();
    L.cf = {}; L.cf[col] = value; L.open = null; L.limit = LIST_LIMIT; render();
  }
  function listDrawer(r, col) {
    var L = listState(), C = listCols(), box = el("div", { cls: "exh-l-drawer" });
    var h = el("p", { cls: "exh-l-dh" }, [C[col].h + ", " + listTitle(r)]);
    box.appendChild(h);
    function line(text, cls) { box.appendChild(el("p", { cls: "exh-l-dl" + (cls ? " " + cls : ""), text: text })); }
    function list(items) { box.appendChild(el("ul", { cls: "exh-l-dul" }, items.map(function (x) { return el("li", null, typeof x === "string" ? [x] : x); }))); }
    var ad = credAdopt(r) || {};
    if (col === 0) {
      line("Local titles in MAP, as colleges typed them:");
      list((r.raw_variants || []).map(function (v) { return v.r + (v.c != null ? " (title " + Math.round(v.c * 100) + "%)" : "") + (v.q ? ", " + String(v.q).replace(/_/g, " ") : ""); }));
      var openC = word("Open it in Credentials", function () { openCredential(r.ut); });
      box.appendChild(openC);
    } else if (col === 1) {
      line(listStatus(r) === "Unreviewed" ? "No review stamp yet." : "Reviewed " + (stamp(r.curated_at) || "") + " by " +
        (listStatus(r) === "Cohort" ? "the cohort " + r.curated_by : "a person") + ".");
      var tags = r.audit_tags || {};
      if (Object.keys(tags).length) { line("The audit's tags:"); list(Object.keys(tags).map(function (k) { return k.replace(/_/g, " ") + ": " + tags[k]; })); }
      if (r.conf_title != null) line("Title confidence " + Math.round(r.conf_title * 100) + "%" + (r.conf_issuer != null ? ", issuer " + Math.round(r.conf_issuer * 100) + "%" : "") + ".");
    } else if (col === 2) {
      line("Show every credential of a type:");
      box.appendChild(el("div", { cls: "exh-l-acts" }, (r.cpl_types || []).map(function (t) { return word(t, function () { listFilterBy(2, t); }); })));
    } else if (col === 3) {
      var iss = credCurrent(r).issuer || "", norm = function (x) { return String(x || "").toLowerCase().replace(/[^a-z0-9]/g, ""); };
      if (!iss) { line("No issuer named."); }
      else {
        var same = state.cs.rows.filter(function (x) { return (credCurrent(x).issuer || "") === iss; });
        var alike = {};
        state.cs.rows.forEach(function (x) { var i2 = credCurrent(x).issuer || ""; if (i2 && i2 !== iss && norm(i2) === norm(iss)) alike[i2] = (alike[i2] || 0) + 1; });
        line(fmt(same.length) + (same.length === 1 ? " credential names " : " credentials name ") + iss + ".");
        box.appendChild(word("Show them all", function () { listFilterBy(3, iss); }));
        var ak = Object.keys(alike);
        if (ak.length) { line("Spelled another way:", "exh-l-warn"); list(ak.map(function (k) { return k + " (" + alike[k] + ")"; })); }
      }
    } else if (col === 4) {
      var sites = credCurrent(r).sites;
      if (!sites.length) line("No training site named.");
      else list(sites.map(function (x) { return x.site + (x.college ? ", " + x.college : ""); }));
    } else if (col === 5 || col === 6) {
      var arts = (r.articulations || []).filter(function (a) { return col === 5 || a.sys === "M-ID"; });
      if (!arts.length) line("No M-ID or C-ID carries it yet.");
      list(arts.map(function (a) {
        var loc = (a.local || []).map(function (l) { return [l.subj, l.num].filter(Boolean).join(" ") + (l.t ? " " + l.t : "") +
          (l.colleges && l.colleges.length ? " (" + l.colleges.join(", ") + ")" : ""); }).join("; ");
        return (a.sys ? a.sys + " " : "") + a.cid + (a.title ? ", " + a.title : "") + (a.disc ? " · " + a.disc : "") + (loc ? ". Local: " + loc : "");
      }));
      if (col === 6 && listSubj(r)) box.appendChild(word("Show every credential under " + listSubj(r).split(",")[0], function () { listFilterBy(6, listSubj(r).split(",")[0]); }));
    } else if (col === 7) {
      if (!listCip(r)) line("No CIP family read.");
      else { line("Read from TOP, so a hint, never a determination."); box.appendChild(word("Show every credential in " + listCip(r), function () { listFilterBy(7, listCip(r)); })); }
    } else if (col === 8) {
      var a = ad.a || {}, c = ad.c || {};
      if (Object.keys(a).length) {
        line("Articulated at:");
        list(Object.keys(a).map(function (k) { var v = a[k]; return adoptName(k) + ": " + fmt(v[0]) + " units" +
          ((v[1] || []).length ? ", " + v[1].map(function (x) { return x[0] + (x[1] ? " (" + x[1] + ")" : ""); }).join("; ") : ""); }));
      } else line("No college has articulated it.");
      if (Object.keys(c).length) {
        line("Could adopt, teaching a course mapped to it:");
        list(Object.keys(c).map(function (k) { return adoptName(k) + ": " + (c[k] || []).map(function (x) { return x[0]; }).join(", "); }));
      }
    } else if (col === 9) {
      var xs = ad.x || [];
      if (!xs.length) line("No MAP exhibit is read for it.");
      list(xs.map(function (x) { return [el("a", { href: linkUrl(x[0]), target: "_blank", rel: "noopener", text: x[0] }), " " + x[1] + (x[2] != null ? ", " + fmt(x[2]) + " units" : "")]; }));
    }
    box.appendChild(word("Close", function () { L.open = null; redrawList(); }));
    return el("tr", { cls: "exh-l-editrow" }, [el("td", { colspan: "13" }, [box])]);
  }
  /* Resizable columns (Sam, 2026-11-01: "make the columns resizable"). Each header's right edge is a separator: drag
     it, or focus it and use the arrow keys (Home narrows to the least). The first resize fixes every column at its
     drawn width in pixels, so the table may grow wider and scroll inside its own box. Widths last the visit; a column
     width is not a filter (CLAUDE.md, tabs never remember a filter). */
  var LIST_MIN_W = 48, LIST_STEP = 24;
  function listFixWidths() {
    var L = listState();
    if (L.widths) return L.widths;
    var cols = Array.prototype.slice.call(document.querySelectorAll(".exh-l-table col"), 2);
    L.widths = cols.map(function (c) {
      var w = c.getBoundingClientRect ? Math.round(c.getBoundingClientRect().width) : 0;
      return w > 0 ? w : 120;
    });
    return L.widths;
  }
  function listSetWidth(i, w) {
    var L = listState(), W = listFixWidths();
    W[i] = Math.max(LIST_MIN_W, Math.round(w));
    var col = document.querySelectorAll(".exh-l-table col")[i + 2];
    if (col) col.style.width = W[i] + "px";
    var t = document.querySelector(".exh-l-table");
    if (t) t.style.width = (W.reduce(function (a, x) { return a + x; }, 0) + 64) + "px";
    var g = document.getElementById("exh-l-grip-" + i);
    if (g) g.setAttribute("aria-valuenow", String(W[i]));
    return L;
  }
  // Each separator reports its column's drawn width once the table is on the page.
  function listSyncGrips() {
    var cols = Array.prototype.slice.call(document.querySelectorAll(".exh-l-table col"), 2);
    Array.prototype.forEach.call(document.querySelectorAll(".exh-l-grip"), function (g, i) {
      var w = cols[i] && cols[i].getBoundingClientRect ? Math.round(cols[i].getBoundingClientRect().width) : 0;
      if (w > 0) g.setAttribute("aria-valuenow", String(w));
    });
  }
  function listGrip(i, label) {
    var L = listState();
    var g = el("span", { cls: "exh-l-grip", id: "exh-l-grip-" + i, role: "separator", tabindex: "0", "aria-orientation": "vertical",
      "aria-label": "Resize " + label, "aria-valuemin": String(LIST_MIN_W), "aria-valuemax": "1200",
      "aria-valuenow": L.widths ? String(L.widths[i]) : "120" });
    g.addEventListener("keydown", function (e) {
      var W = listFixWidths();
      if (e.key === "ArrowRight") listSetWidth(i, W[i] + LIST_STEP);
      else if (e.key === "ArrowLeft") listSetWidth(i, W[i] - LIST_STEP);
      else if (e.key === "Home") listSetWidth(i, LIST_MIN_W);
      else return;
      e.preventDefault();
    });
    g.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      var startX = e.clientX, startW = listFixWidths()[i];
      function move(ev) { listSetWidth(i, startW + (ev.clientX - startX)); }
      function up() { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
    g.addEventListener("click", function (e) { e.stopPropagation(); });
    return g;
  }
  /* The rows as they are filtered and sorted, as a CSV Excel opens (a byte-order mark keeps é and – intact). */
  function listCsv(rows) {
    var C = listCols();
    var q = function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [["Credential key"].concat(C.map(function (c) { return c.h; })).map(q).join(",")];
    rows.forEach(function (r) { lines.push([r.ut].concat(C.map(function (c) { return c.v(r); })).map(q).join(",")); });
    return "\ufeff" + lines.join("\r\n") + "\r\n";
  }
  function listDownload(rows) {
    var csv = listCsv(rows), L = listState();
    try {
      var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      var a = el("a", { href: url, download: "exhibits-list-" + new Date().toISOString().slice(0, 10) + ".csv" });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      L.note = "Downloaded " + fmt(rows.length) + " rows. Edits made in the spreadsheet do not come back here yet; make them in the list.";
    } catch (e) { L.note = "This browser could not make the file (" + (e && e.message || "no answer") + ")."; }
    render();
  }
  function ensureListCss() {
    if (document.getElementById("exh-l-css")) return;
    document.head.appendChild(el("style", { id: "exh-l-css", text: [
      ".exh-l-bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:8px 0}",
      ".exh-l-q{flex:1 1 280px;max-width:520px}",
      ".exh-l-filters{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.8125rem}",
      ".exh-l-re{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin:4px 0 8px}",
      ".exh-l-re{flex-direction:column;align-items:stretch;max-width:760px}",
      ".exh-l-relabel{font-size:.8125rem;color:var(--text-strong);font-weight:600}",
      ".exh-l-ta{width:100%;box-sizing:border-box;resize:vertical;min-height:3.5em}",
      ".exh-l-in{font:inherit;font-size:.8125rem;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--surface-opaque);color:var(--text-body)}",
      "#exh-l-host{min-width:0;max-width:100%}",
      ".exh-l-wrap{width:100%;max-width:100%;box-sizing:border-box;overflow-x:auto;max-height:75vh;overflow-y:auto;border:1px solid var(--border);border-radius:6px}",
      ".exh-l-table{width:100%;min-width:1100px;table-layout:fixed;border-collapse:collapse;font-size:.75rem;line-height:1.3}",
      ".exh-l-table th{position:sticky;top:0;background:var(--surface-opaque);color:var(--text-strong);text-align:left;font-weight:600;padding:3px 6px;border-bottom:1px solid var(--border)}",
      ".exh-l-table td{padding:2px 6px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--text-body);overflow-wrap:anywhere}",
      ".exh-l-title{color:var(--text-strong)}",
      ".exh-l-box{text-align:center;padding-left:2px;padding-right:2px}",
      ".exh-l-box input{width:24px;height:24px;margin:0;accent-color:var(--accent-link)}",
      ".exh-l-open{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;text-align:inherit;cursor:pointer;min-height:24px;width:100%;overflow:hidden;text-overflow:ellipsis;display:block}",
      ".exh-l-nowrap .exh-l-open{white-space:nowrap}",
      ".exh-l-open:hover,.exh-l-open:focus-visible{text-decoration:underline;text-decoration-color:var(--accent-link);text-underline-offset:2px}",
      ".exh-l-open[aria-expanded='true']{font-weight:600}",
      ".exh-l-sel td{background:var(--surface-opaque)}",
      ".exh-l-flagged td:nth-child(3){box-shadow:inset 3px 0 0 var(--accent-link)}",
      ".exh-l-drawer{display:flex;flex-direction:column;gap:4px;padding:6px 4px;max-width:960px;white-space:normal}",
      ".exh-l-dh{margin:0;font-weight:600;color:var(--text-strong)}",
      ".exh-l-dl{margin:0}",
      ".exh-l-dul{margin:0;padding-left:18px}",
      ".exh-l-warn{color:var(--text-strong);font-weight:600}",
      ".exh-l-table th{position:sticky}",
      ".exh-l-grip{position:absolute;top:0;right:-12px;width:24px;height:100%;min-height:24px;cursor:col-resize;z-index:3;touch-action:none}",
      ".exh-l-grip::after{content:'';position:absolute;top:20%;bottom:20%;left:12px;width:1px;background:var(--border)}",
      ".exh-l-grip:hover::after,.exh-l-grip:focus-visible::after{width:3px;left:11px;background:var(--accent-link)}",
      ".exh-l-grip:focus-visible{outline:2px solid var(--focus-ring);outline-offset:-2px}",
      ".exh-l-nowrap td{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".exh-l-nowrap .exh-l-sub{display:inline;margin-left:6px}",
      ".exh-l-nowrap .exh-l-editrow td,.exh-l-nowrap .exh-l-cf td{white-space:normal;overflow:visible}",
      ".exh-l-count .exh-w[aria-pressed='true']{font-weight:600}",
      ".exh-l-sub{display:block;color:var(--text-muted);font-size:.6875rem}",
      ".exh-l-n{text-align:right;font-variant-numeric:tabular-nums}",
      ".exh-l-table .exh-w{font-size:.75rem;min-height:24px;min-width:24px;padding:0 2px}",
      ".exh-l-editrow td{background:var(--surface-opaque)}",
      ".exh-l-edit{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:flex-end;padding:4px 0}",
      ".exh-l-f{display:flex;flex-direction:column;gap:2px;flex:1 1 200px;font-size:.6875rem;color:var(--text-muted)}",
      ".exh-l-acts{display:flex;gap:12px}",
      ".exh-l-count{display:flex;flex-wrap:wrap;gap:4px 16px;align-items:baseline;margin:2px 0 4px}",
      ".exh-l-sort{background:none;border:0;padding:0;font:inherit;font-weight:600;color:var(--text-strong);text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:2px;min-height:24px}",
      ".exh-l-cf td{background:var(--surface-opaque);padding:5px 4px 4px;border-bottom:1px solid var(--border)}",
      ".exh-l-cfin{width:100%;min-width:24px;box-sizing:border-box;font-size:.6875rem;min-height:24px}",
      ".exh-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
      "@media (max-width:560px){.exh-l-table{table-layout:auto;min-width:900px}}"
    ].join("\n") }));
  }

  function viewsNav() {
    function v(id, label, n) {
      var kids = [label + " ", el("span", { cls: "exh-n", text: n == null ? "" : fmt(n) })];
      if (state.view === id) return el("span", { cls: "exh-view-on", "aria-current": "page" }, kids);
      var b = el("button", { type: "button", cls: "exh-w" }, kids);
      b.addEventListener("click", function () {
        state.view = id; state.note = ""; state.cs.note = "";
        render();
        if (id === "credentials" || id === "list") loadCredentials().then(render);
      });
      return b;
    }
    return el("nav", { cls: "exh-views", "aria-label": "Views" }, [
      v("review", "Review", state.data ? stepCount("") : null),
      v("credentials", "Credentials", state.cs.rows ? state.cs.rows.length : null),
      v("list", "List", state.cs.rows ? state.cs.rows.length : null),
      v("rules", "Rules", state.rq.rows ? requestsWaitingOnYou() : null),
      el("a", { href: "#exhibit-adoption", text: "The college matrix, in Exhibit Adoption" })]);
  }

  /* ── Rules: what each rule sent to the routine would do, and the word that turns it on ── */
  var RQ_WORDS = {
    "waiting": ROUTINE_WHEN + " builds it switched off and writes its dry run here.",
    "could-not": "The routine could not build it.",
    "built": "Built and switched off. Nothing changes until you turn it on.",
    "turning-on": "Turned on. The routine's next run switches it on, and the night's procedures run saves what it settles under its own cohort, so its saves undo together.",
    "on": "On. The nightly procedures run applies it; its saves undo together.",
    "discarding": "Discarded. The routine's next run takes it out.",
    "discarded": "Discarded."
  };
  function dryRunLines(b) {
    var lines = [];
    if (!b || !b.queue) return lines;
    var q = b.queue;
    lines.push("On the queue of " + fmt(q.waiting) + " waiting " + (q.waiting === 1 ? "title" : "titles") + ", it settles "
      + fmt(q.settled) + " and holds " + fmt(q.held) + " for you.");
    if (b.reference) lines.push("In the reference, it reads " + fmt(b.reference.read) + " titles, and " + fmt(b.reference.differ)
      + (b.reference.differ === 1 ? " reads" : " read") + " differently from their canonical title.");
    if (b.reasks != null) lines.push("The classifier asks again about " + fmt(b.reasks) + " titles it was unsure of.");
    return lines;
  }
  function requestCard(r) {
    var ask = r.ask || {};
    var c = el("article", { cls: "exh-card exh-rq", "aria-label": "Rule sent " + stamp(r.at) });
    c.appendChild(el("p", { cls: "exh-rq-words", text: ask.words || "(no words)" }));
    if (ask.raw) c.appendChild(el("p", { cls: "exh-small exh-muted", text: "Example: “" + ask.raw + "” should read “" + (ask.title || "") + "”"
      + (ask.issuer ? ", issued by " + ask.issuer : "") + "." }));
    c.appendChild(el("p", { cls: "exh-small exh-muted", text: "Sent " + stamp(r.at) + (r.by ? " by " + r.by : "") }));
    var b = r.built || {};
    var name = (r.proc && r.proc.name) || b.name;
    if (name) c.appendChild(el("p", { cls: "exh-small" }, [el("b", { text: "The procedure: " }), name
      + (b.procedure || (r.proc && r.proc.id) ? " (" + (b.procedure || r.proc.id) + ")" : "")]));
    var st = el("p", { cls: "exh-rq-state" }, [el("b", { text: { "waiting": "Waiting", "could-not": "Could not build",
      "built": "Ready for you", "turning-on": "Turning on", "on": "On", "discarding": "Discarding", "discarded": "Discarded" }[r.state] + ". " }),
      RQ_WORDS[r.state] + (r.state === "could-not" && b.could_not ? " " + b.could_not : "")]);
    c.appendChild(st);
    var lines = dryRunLines(b);
    if (lines.length && r.state !== "discarded") {
      var dry = el("div", { cls: "exh-rq-dry" }, [el("p", { cls: "exh-small exh-muted", text: "Its dry run" + (b.at ? ", " + stamp(b.at) : "") + ":" })]);
      lines.forEach(function (t) { dry.appendChild(el("p", { text: t })); });
      var ex = (b.queue && b.queue.examples || []).map(function (e) { return e[0] + " → " + e[1]; })
        .concat((b.reference && b.reference.examples || []).map(function (e) { return e[0] + ": " + e[1] + " → " + e[2]; })).slice(0, 8);
      if (ex.length) {
        var ul = el("ul", { cls: "exh-rq-ex", "aria-label": "Examples from the dry run" });
        ex.forEach(function (t) { ul.appendChild(el("li", { text: t })); });
        dry.appendChild(ul);
      }
      c.appendChild(dry);
    }
    if (b.pr) c.appendChild(el("p", { cls: "exh-small" }, [el("a", { href: PR_BASE + encodeURIComponent(b.pr), target: "_blank", rel: "noopener", text: "The pull request that built it" })]));
    if (r.sw && r.swBy && (r.state === "turning-on" || r.state === "discarding" || r.state === "discarded"))
      c.appendChild(el("p", { cls: "exh-small exh-muted", text: (r.sw === "on" ? "Turned on " : "Discarded ") + stamp(r.swAt) + " by " + r.swBy }));
    var acts = [];
    function act(label, value) {
      var busy = state.rq.busy === r.id;
      return word(busy ? "Saving…" : label, function () {
        if (state.rq.busy) return;
        state.rq.busy = r.id; state.rq.note = ""; render();
        switchRequest(r.id, value).then(function () {
          state.rq.busy = "";
          state.rq.note = value === "on" ? "Turned on. The routine switches it on at its next run." : "Discarded. The routine takes it out at its next run.";
          return loadRules();
        }).then(render).catch(function (e) {
          state.rq.busy = "";
          state.rq.note = String(e && e.message) === "signin" ? "Sign in as a reviewer to turn a rule on or discard it." : "It did not save (" + (e && e.message || e) + ").";
          render();
        });
      }, state.rq.busy ? { disabled: "disabled" } : null);
    }
    if (r.state === "built") acts.push(act("Turn on", "on"), act("Discard", "discard"));
    else if (r.state === "turning-on") acts.push(act("Discard instead", "discard"));
    else if (r.state === "discarding") acts.push(act("Turn on instead", "on"));
    if (acts.length) c.appendChild(el("div", { cls: "exh-acts" }, acts));
    return c;
  }
  function procedureCard(p, tally) {
    var src = p.source || {};
    var c = el("article", { cls: "exh-card exh-rq", "aria-label": p.name });
    c.appendChild(el("h4", { cls: "exh-q", text: p.name }));
    c.appendChild(el("p", { cls: "exh-small exh-muted", text: (p.kind === "rule" ? "A rule: it settles a title by itself" : "Guidance the classifier reads")
      + (p.on ? "" : ". Switched off") + (p.request ? ". Sent from this tab" : "") }));
    c.appendChild(el("p", { cls: "exh-rq-words", text: p.rule || "" }));
    var who = [src.who, src.date].filter(Boolean).join(", ");
    if (who || src.words) c.appendChild(el("p", { cls: "exh-small" }, [el("span", { cls: "exh-muted", text: "Set by " + (who || "a person") + (src.words ? ": " : "") }),
      src.words ? "“" + src.words + "”" : ""]));
    (p.amended || []).forEach(function (m) {
      c.appendChild(el("p", { cls: "exh-small" }, [el("span", { cls: "exh-muted", text: "Amended by " + [m.who, m.date].filter(Boolean).join(", ") + (m.words ? ": " : "") }),
        m.words ? "“" + m.words + "”" : ""]));
    });
    if (tally) c.appendChild(el("p", { cls: "exh-small exh-muted", text: "On the last run it settled " + fmt(tally.settled) + " and held " + fmt(tally.held) + " for a person." }));
    return c;
  }
  function renderRules(wrap) {
    wrap.appendChild(viewsNav());
    wrap.appendChild(el("p", { cls: "exh-muted", text: "Every rule that suggests or folds an exhibit title. The procedures run each night, "
      + "in this order, and propose a title for each new exhibit; Another look's rules read the titles already in the reference." }));
    wrap.appendChild(el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: state.rq.note || "" }));

    var store = state.rq.store, report = state.rq.report || {};
    var tallies = {};
    (report.procedures || []).forEach(function (t) { tallies[t.id] = t; });
    var g1 = el("section", { cls: "exh-group", "aria-labelledby": "exh-rules-procs" }, [el("h3", { cls: "exh-q", id: "exh-rules-procs",
      text: "The procedures: new exhibits" + (store ? " (" + fmt(store.length) + ")" : "") })]);
    if (report._generated_at) g1.appendChild(el("p", { cls: "exh-small exh-muted", text: "Last run " + stamp(report._generated_at) + "." }));
    if (store == null) g1.appendChild(el("p", { cls: "exh-empty", text: "The procedures could not be read." }));
    else {
      var pl = el("div", { cls: "exh-rq-list" });
      store.forEach(function (p) { pl.appendChild(procedureCard(p, tallies[p.id])); });
      if (tallies.classifier) pl.appendChild(procedureCard({ name: "The classifier decides the rest", kind: "guidance", on: true,
        rule: "Every title no rule settles goes to the classifier, which reads the exhibit-canonicalization skill and every procedure above.",
        source: { who: "Sam", date: "2026-10-18", words: "have you classify and complete common exhibit titles" } }, tallies.classifier));
      g1.appendChild(pl);
    }
    wrap.appendChild(g1);

    var sw = state.sw.data;
    var g2 = el("section", { cls: "exh-group", "aria-labelledby": "exh-rules-sweep" }, [el("h3", { cls: "exh-q", id: "exh-rules-sweep",
      text: "Another look: titles already in the reference" + (sw && sw.rules ? " (" + fmt(sw.rules.length) + ")" : "") })]);
    if (!sw || !sw.rules) g2.appendChild(el("p", { cls: "exh-empty", text: "Another look's rules could not be read." }));
    else {
      var sl = el("div", { cls: "exh-rq-list" });
      sw.rules.forEach(function (r) {
        var n = (sw.cards || []).filter(function (c) { return c.rules[0] === r.id; }).length;
        var c = el("article", { cls: "exh-card exh-rq", "aria-label": r.label }, [el("h4", { cls: "exh-q", text: r.label }),
          el("p", { cls: "exh-rq-words", text: r.tip || "" })]);
        if (r.words) c.appendChild(el("p", { cls: "exh-small" }, [el("span", { cls: "exh-muted", text: "Sam, 2026-10-31: " }), "“" + r.words + "”"]));
        c.appendChild(el("p", { cls: "exh-small" }, [el("span", { cls: "exh-muted", text: fmt(n) + " card" + (n === 1 ? "" : "s") + " tonight. " }),
          n ? word("Open them", function () { state.view = "review"; state.filter = SWEEP; state.sw.rule = r.id; state.sw.cur = 0; render(); }, { cls: "exh-w exh-small" }) : null]));
        sl.appendChild(c);
      });
      g2.appendChild(sl);
    }
    wrap.appendChild(g2);

    var g3 = el("section", { cls: "exh-group", "aria-labelledby": "exh-rules-sent" }, [el("h3", { cls: "exh-q", id: "exh-rules-sent", text: "Rules sent to the routine" }),
      el("p", { cls: "exh-small exh-muted", text: ROUTINE_WHEN + " builds each one switched off and writes back what it would do. Turn on lets the nightly procedures run apply it." })]);
    if (state.rq.rows == null) g3.appendChild(el("p", { cls: "exh-empty", text: state.rq.error ? "The rules sent could not be read (" + state.rq.error + ")." : "Reading the rules sent…" }));
    else if (!state.rq.rows.length) g3.appendChild(el("p", { cls: "exh-empty", text: "None sent yet. Teach a rule, on any card in Review, sends one." }));
    else {
      var list = el("div", { cls: "exh-rq-list" });
      state.rq.rows.forEach(function (r) { list.appendChild(requestCard(r)); });
      g3.appendChild(list);
    }
    wrap.appendChild(g3);
    if (state.studentsWord === "signin" && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
      var mount = el("div", { cls: "exh-signin" });
      wrap.appendChild(mount);
      window.CPL_REVIEWER_SIGNIN.mountInto(mount, { title: "Sign in to decide",
        blurb: "A reviewer's sign-in turns a rule sent to the routine on or discards it.", returnTab: "exhibits" });
    }
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    ensureCss();
    root.removeAttribute("style");   // the pane's loading placeholder
    while (root.firstChild) root.removeChild(root.firstChild);
    var wrap = el("div", { cls: "exh-wrap" });
    root.appendChild(wrap);
    var head = el("div", { cls: "exh-titlebar" }, [el("h2", { cls: "exh-h", text: "Exhibits" })]);
    wrap.appendChild(head);
    if (state.view === "credentials") {
      if (state.cs.generated) head.appendChild(el("span", { cls: "exh-muted exh-small", text: "Reference built " + stamp(state.cs.generated) }));
      renderCredentials(wrap);
      return;
    }
    if (state.view === "rules") {
      renderRules(wrap);
      return;
    }
    if (state.view === "list") {
      if (state.cs.generated) head.appendChild(el("span", { cls: "exh-muted exh-small", text: "Reference built " + stamp(state.cs.generated) }));
      renderList(wrap);
      return;
    }
    if (state.error || !state.data) {
      wrap.appendChild(el("p", { cls: "exh-empty", text: state.error
        ? "The review file could not be read (" + state.error + ")." : "Reading the review queue…" }));
      return;
    }
    var d = state.data, src = d.sources || {};
    head.appendChild(el("span", { cls: "exh-muted exh-small", text: "Procedures run " + (stamp(src.procedures_run) || "not read")
      + " · queue built " + stamp(d.written_at) }));

    var group = el("div", { cls: "exh-group" }, [el("h3", { cls: "exh-q", text: "What is it called?" })]);
    var t = d.tiles || {};
    group.appendChild(el("div", { cls: "exh-dash", role: "list", "aria-label": "What is it called" }, [
      tile("Names", t.names && t.names.n, t.names && t.names.of, "MAP titles under a canonical credential",
        t.names ? fmt(t.names.waiting) + " wait for a title" : ""),
      tile("Aligned course", t.aligned && t.aligned.n, t.aligned && t.aligned.of,
        "held titles articulated to a course that names them", "The course names the proposal"),
      studentsTile()]));
    var steps = el("div", { cls: "exh-steps", role: "group", "aria-label": "Filter the review queue by CER step" },
      [stepTile("", "All held")].concat(STEPS.map(function (s) { return stepTile(s, s); }), [stepTile("Saved, not folded", "Saved, not folded"), sweepTile()]));
    group.appendChild(steps);
    wrap.appendChild(group);

    wrap.appendChild(viewsNav());

    if (state.filter === SWEEP && state.sw.data) {
      renderSweep(wrap);
      return;
    }
    var list = shown();
    if (state.cur >= list.length) state.cur = Math.max(0, list.length - 1);
    wrap.appendChild(finder(list));
    var status = el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: state.note || "" });
    wrap.appendChild(status);
    if (state.studentsWord === "signin" && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
      var mount = el("div", { cls: "exh-signin" });
      wrap.appendChild(mount);
      window.CPL_REVIEWER_SIGNIN.mountInto(mount, { title: "Sign in to review",
        blurb: "A reviewer's sign-in saves titles and shows the students on each exhibit.", returnTab: "exhibits" });
    }
    if (!list.length) {
      wrap.appendChild(el("p", { cls: "exh-empty", text: "Nothing waits in this step tonight." }));
      return;
    }
    wrap.appendChild(card(list[state.cur], list));
  }

  /* ── the look: First Light tokens only ── */
  var CSS = [
    ".exh-wrap { display:grid; gap:16px; min-width:0; }",
    ".exh-titlebar { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:6px 18px; }",
    ".exh-h { margin:0; font-family:var(--f-display, Georgia, serif); color:var(--seal-blue-text); font-size:clamp(1.5rem, 3vw, 2rem); }",
    ".exh-q { margin:0; font-family:var(--f-display, Georgia, serif); color:var(--seal-blue-text); font-size:1.05rem; font-weight:600; }",
    ".exh-muted { color:var(--text-muted); }",
    ".exh-small { font-size:.88rem; }",
    ".exh-group { display:grid; gap:8px; }",
    ".exh-groups { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap:16px; min-width:0; }",
    ".exh-dash, .exh-steps { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px; }",
    ".exh-tile { display:grid; gap:4px; align-content:start; padding:12px 14px; background:var(--surface); border:1px solid var(--border); border-radius:8px; min-width:0; }",
    ".exh-tl { font-size:.75rem; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); font-weight:600; }",
    ".exh-tn { color:var(--text-muted); font-variant-numeric:tabular-nums; }",
    ".exh-tn b { font-size:1.35rem; color:var(--text-strong); font-weight:600; }",
    ".exh-bar { height:6px; background:var(--border); border-radius:3px; overflow:hidden; }",
    ".exh-bar i { display:block; height:100%; background:var(--cobalt); }",
    ".exh-tt { font-size:.82rem; color:var(--text-muted); line-height:1.35; }",
    ".exh-ts { font-size:.85rem; color:var(--text-body); }",
    ".exh-step { position:relative; display:grid; gap:2px; text-align:left; padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:8px; font:inherit; color:var(--text-body); cursor:pointer; min-width:0; min-height:24px; }",
    ".exh-step:hover { border-color:var(--border-strong); }",
    ".exh-step[disabled] { cursor:default; }",
    ".exh-sn { font-size:1.25rem; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; }",
    ".exh-sl { font-size:.88rem; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }",
    ".exh-step[disabled] .exh-sl { color:var(--text-muted); text-decoration:none; }",
    ".exh-step[aria-pressed='true'] { border:2px solid var(--seal-blue-text); padding:7px 11px; background:var(--surface-subtle); }",
    ".exh-step[aria-pressed='true'] .exh-sl { color:var(--text-strong); font-weight:600; text-decoration-thickness:2px; }",
    ".exh-chip { position:relative; display:inline-block; font-size:.75rem; font-weight:600; color:var(--text-muted); border:1px solid var(--border-strong); border-radius:999px; padding:1px 9px; background:var(--surface-subtle); white-space:nowrap; }",
    ".exh-chip[data-tip] { cursor:help; }",
    ".exh-chip[data-tip]:hover::after, .exh-chip[data-tip]:focus-visible::after, .exh-step[data-tip]:hover::after, .exh-step[data-tip]:focus-visible::after { content:attr(data-tip); position:absolute; left:0; top:calc(100% + 6px); z-index:3; width:max-content; max-width:min(300px, 80vw); white-space:normal; font-size:.82rem; font-weight:400; line-height:1.4; color:var(--text-body); background:var(--surface); border:1px solid var(--border-strong); border-radius:6px; padding:8px 10px; }",
    ".exh-views { display:flex; flex-wrap:wrap; gap:6px 22px; align-items:baseline; border-bottom:1px solid var(--border); padding-bottom:8px; font-size:.95rem; }",
    ".exh-view-on { color:var(--text-strong); font-weight:600; text-decoration:underline; text-decoration-thickness:3px; text-decoration-color:var(--seal-blue-text); text-underline-offset:3px; }",
    ".exh-n { color:var(--text-muted); font-weight:400; }",
    ".exh-wrap a { color:var(--cobalt); text-underline-offset:3px; }",
    "button.exh-w { all:unset; cursor:pointer; min-height:24px; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; }",
    ".exh-acts button.exh-w { font-weight:600; }",
    "button.exh-w:focus-visible, .exh-wrap a:focus-visible, .exh-step:focus-visible, .exh-cchip:focus-visible, .exh-chip:focus-visible, .exh-results button:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-finder { position:relative; display:grid; gap:4px; }",
    ".exh-search { min-width:0; padding:8px 12px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface); color:var(--text-body); font:inherit; }",
    ".exh-results { list-style:none; margin:0; padding:4px 0; position:absolute; top:100%; left:0; right:0; z-index:4; background:var(--surface); border:1px solid var(--border-strong); border-radius:6px; max-height:320px; overflow-y:auto; }",
    ".exh-results[hidden] { display:none; }",
    ".exh-results button { display:grid; gap:2px; width:100%; text-align:left; background:none; border:0; padding:8px 12px; font:inherit; color:var(--text-body); cursor:pointer; }",
    ".exh-results button:hover { background:var(--surface-subtle); }",
    ".exh-rt { color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }",
    ".exh-rm { font-size:.82rem; color:var(--text-muted); overflow-wrap:anywhere; }",
    ".exh-none { padding:8px 12px; font-size:.88rem; color:var(--text-muted); }",
    ".exh-status { margin:0; min-height:1.2em; color:var(--text-body); }",
    ".exh-card { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:clamp(14px, 3vw, 24px); display:grid; gap:14px; min-width:0; }",
    ".exh-chiprow { display:flex; flex-wrap:wrap; gap:6px 10px; align-items:center; }",
    ".exh-canon { display:grid; gap:6px; min-width:0; }",
    ".exh-canon p { margin:0; }",
    ".exh-edit { font-family:var(--f-display, Georgia, serif); font-size:clamp(1.3rem, 2.8vw, 1.8rem); font-weight:700; color:var(--seal-blue-text); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:4px 8px; width:100%; min-width:0; box-sizing:border-box; }",
    ".exh-inbox { display:flex; align-items:center; gap:6px; background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:3px 8px; min-width:0; font-size:.9rem; }",
    ".exh-inbox.exh-read { border-style:dashed; flex-wrap:wrap; }",
    ".exh-grow { flex:1 1 auto; min-width:0; overflow-wrap:anywhere; }",
    ".exh-pre { color:var(--text-muted); white-space:nowrap; }",
    ".exh-inbox input { flex:1 1 auto; min-width:0; border:0; background:transparent; font:inherit; color:var(--text-body); padding:2px 0; }",
    ".exh-inbox:focus-within { outline:2px solid var(--seal-blue); outline-offset:1px; }",
    ".exh-typed { display:grid; gap:4px; }",
    ".exh-typed ul { list-style:none; margin:0; padding:0; display:grid; gap:2px; font-size:.9rem; }",
    ".exh-now { background:var(--surface-subtle); border-left:3px solid var(--seal-blue-text); padding:4px 8px; color:var(--text-strong); overflow-wrap:anywhere; }",
    ".exh-under li { color:var(--text-muted); padding:0 11px; overflow-wrap:anywhere; }",
    ".exh-cl { font-size:.82rem; color:var(--text-muted); padding-top:3px; }",
    ".exh-colleges { display:grid; gap:8px; min-width:0; }",
    ".exh-ccrow { display:grid; grid-template-columns:minmax(0, 12em) minmax(0, 1fr); gap:4px 12px; align-items:start; }",
    ".exh-cchips { display:flex; flex-wrap:wrap; gap:4px 6px; min-width:0; align-items:center; }",
    ".exh-cchip { font-size:.82rem; color:var(--text-body); border:1px solid var(--border); border-radius:999px; padding:1px 9px; background:var(--surface-subtle); white-space:nowrap; }",
    "button.exh-cchip { font:inherit; font-size:.82rem; min-height:24px; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; cursor:pointer; }",
    "button.exh-cchip[aria-expanded='true'] { color:var(--text-strong); text-decoration:none; border-color:var(--seal-blue-text); }",
    ".exh-adopt { border-left:3px solid var(--seal-blue-text); background:var(--surface-subtle); padding:8px 12px; display:grid; gap:6px; font-size:.9rem; }",
    ".exh-adopt[hidden] { display:none; }",
    ".exh-adopt h4 { margin:0; font-size:.9rem; color:var(--text-strong); }",
    ".exh-adopt ul { margin:0; padding-left:18px; display:grid; gap:2px; }",
    ".exh-adopt p { margin:0; }",
    ".exh-why { margin:0; color:var(--text-muted); border-left:2px solid var(--border-strong); padding-left:10px; overflow-wrap:anywhere; }",
    ".exh-card > p { margin:0; }",
    ".exh-acts { display:flex; flex-wrap:wrap; gap:8px 22px; align-items:center; }",
    ".exh-opts { list-style:none; margin:-2px 0 4px; padding:6px 12px; background:var(--surface); border:1px solid var(--border); border-radius:6px; max-height:240px; overflow-y:auto; display:grid; gap:2px; }",
    ".exh-opts[hidden] { display:none; }",
    "button.exh-opt { all:unset; cursor:pointer; min-height:24px; font-size:.92rem; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }",
    "button.exh-opt:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-rq-list { display:grid; gap:12px; min-width:0; }",
    ".exh-rq { gap:8px; }",
    ".exh-rq p { margin:0; }",
    ".exh-rq-words { color:var(--text-strong); font-size:1.02rem; white-space:pre-wrap; overflow-wrap:anywhere; max-width:var(--cpl-measure,none); }",
    ".exh-rq-dry { display:grid; gap:4px; padding-top:6px; border-top:1px solid var(--border); }",
    ".exh-rq-ex { margin:2px 0 0; padding-left:1.2em; font-size:.88rem; color:var(--text-body); overflow-wrap:anywhere; }",
    ".exh-bulk { display:grid; gap:6px; padding-top:8px; border-top:1px solid var(--border); }",
    ".exh-bulk p { margin:0; color:var(--text-body); max-width:var(--cpl-measure,none); }",
    ".exh-teach { display:grid; gap:6px; border-top:1px solid var(--border); padding-top:10px; }",
    ".exh-ta { font:inherit; color:var(--text-body); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:6px 8px; width:100%; box-sizing:border-box; min-width:0; }",
    ".exh-foot { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px 16px; font-size:.88rem; color:var(--text-muted); }",
    ".exh-foot span { overflow-wrap:anywhere; min-width:0; }",
    ".exh-empty { color:var(--text-muted); margin:0; }",
    ".exh-views button.exh-w { font-size:.95rem; }",
    ".exh-split { display:grid; gap:16px; min-width:0; align-items:start; }",
    ".exh-split.exh-has-panel { grid-template-columns:minmax(0, 1.35fr) minmax(0, 1fr); }",
    ".exh-ctable { display:grid; gap:6px; min-width:0; }",
    ".exh-ctable > p { margin:0; }",
    ".exh-tablewrap { overflow-x:auto; border:1px solid var(--border); border-radius:8px; background:var(--surface); min-width:0; }",
    ".exh-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:.9rem; }",
    ".exh-table th { text-align:left; font-size:.75rem; letter-spacing:.04em; text-transform:uppercase; color:var(--text-muted); font-weight:600; padding:8px 8px; border-bottom:1px solid var(--border-strong); background:var(--surface-subtle); }",
    ".exh-table td { padding:7px 8px; border-bottom:1px solid var(--border); vertical-align:top; overflow-wrap:anywhere; color:var(--text-body); }",
    ".exh-table .exh-r { text-align:right; font-variant-numeric:tabular-nums; }",
    ".exh-table td.exh-muted { color:var(--text-muted); }",
    ".exh-table tr.exh-sel td { background:var(--surface-subtle); }",
    ".exh-table tr.exh-sel td:first-child { box-shadow:inset 3px 0 0 var(--seal-blue-text); }",
    "button.exh-cred { overflow-wrap:anywhere; }",
    "button.exh-cred[aria-current='true'] { color:var(--text-strong); font-weight:600; }",
    ".exh-cpanel { gap:12px; }",
    ".exh-ph { margin:0; font-family:var(--f-display, Georgia, serif); color:var(--seal-blue-text); font-size:clamp(1.2rem, 2.4vw, 1.5rem); overflow-wrap:anywhere; }",
    ".exh-ph:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-block { display:grid; gap:8px; padding-top:12px; border-top:1px solid var(--border); min-width:0; }",
    ".exh-block > p { margin:0; }",
    ".exh-sites { border:0; margin:0; padding:0; display:grid; gap:6px; min-width:0; }",
    ".exh-sites p { margin:0; }",
    ".exh-siterow { display:flex; flex-wrap:wrap; gap:6px 10px; align-items:center; min-width:0; }",
    ".exh-siterow select { flex:1 1 9em; }",
    ".exh-siterow input { flex:3 1 14em; }",
    ".exh-siterow select, .exh-siterow input { min-width:0; font:inherit; font-size:.9rem; color:var(--text-body); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:4px 6px; }",
    ".exh-siterow select:focus-visible, .exh-siterow input:focus-visible, .exh-search:focus-visible { outline:2px solid var(--seal-blue); outline-offset:1px; }",
    ".exh-dl { display:grid; grid-template-columns:minmax(0, 11em) minmax(0, 1fr); gap:4px 12px; margin:0; font-size:.9rem; }",
    ".exh-dl dt { color:var(--text-muted); }",
    ".exh-dl dd { margin:0; color:var(--text-body); overflow-wrap:anywhere; }",
    "@media (max-width: 1200px) { .exh-split.exh-has-panel { grid-template-columns:minmax(0, 1fr); } .exh-cpanel { order:-1; } }",
    "@media (max-width: 560px) { .exh-ccrow { grid-template-columns:minmax(0, 1fr); } .exh-dash, .exh-steps { grid-template-columns:repeat(2, minmax(0, 1fr)); }"
      + " .exh-dl { grid-template-columns:minmax(0, 1fr); }"
      + " .exh-table { min-width:560px; } }",
    ".exh-why { display:grid; gap:4px; min-width:0; }",
    ".exh-why ul { margin:0; padding-left:1.2em; display:grid; gap:4px; }",
    ".exh-locals li { overflow-wrap:anywhere; }",
    ".exh-strong { color:var(--text-strong); font-weight:600; }",
    "@media (prefers-reduced-motion: reduce) { .exh-wrap * { transition:none !important; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("exh-css")) return;
    document.head.appendChild(el("style", { id: "exh-css", text: CSS }));
  }

  var booted = false;
  /* A visit starts on All held at the top (Sam, 2026-10-21: tabs never remember a filter); what was
     saved stays saved. */
  function newVisit() {
    state.filter = ""; state.cur = 0; state.openCollege = null; state.teach = false; state.note = "";
    state.view = "review";
    state.sw.rule = ""; state.sw.cur = 0; state.sw.bulkAsk = false;
    state.ls = null;
    state.cs.q = ""; state.cs.sel = null; state.cs.limit = CRED_PAGE; state.cs.note = ""; state.cs.open = null;
    routeFromHash();
    render();
  }
  /* #exhibits/<route> opens one place, read once per visit (the Commons row's counts link here, the way
     they linked into the retired CER tab): held = Review on all held, conflict = Review on Conflict with
     the reference, credentials = the Credentials view, rules = the rules sent to the routine. The address is
     not a remembered filter. */
  var ROUTES = { held: ["review", ""], conflict: ["review", CONFLICT], "another-look": ["review", SWEEP], credentials: ["credentials", ""],
    rules: ["rules", ""], list: ["list", ""] };
  function routeFromHash() {
    var parts = String(location.hash || "").replace(/^#/, "").split("/");
    var r = parts[0] === "exhibits" && ROUTES[parts[1]];
    if (!r) return false;
    state.view = r[0]; state.filter = r[1];
    if (r[0] === "credentials" || r[0] === "list") loadCredentials().then(render);
    return true;
  }
  function boot() {
    if (booted) return Promise.resolve();
    booted = true;
    routeFromHash();
    render();
    window.addEventListener("cpl-tab-activated", function (e) {
      if (e && e.detail && e.detail.tab === "exhibits") newVisit();
    });
    window.addEventListener("cpl-session-changed", function () { loadStudents().then(render); });
    return Promise.all([load(), loadSweep(), loadRules()]).then(function () { render(); return loadStudents(); }).then(render);
  }

  window.CPL_EXHIBITS = {
    boot: boot, render: render, load: load, loadStudents: loadStudents, ensureCss: ensureCss,
    _state: state, _shown: shown, _teachText: teachText, _TIPS: TIPS,
    loadCredentials: loadCredentials, openCredential: openCredential,
    _parseSites: parseSites, _joinSites: joinSites, _resolveSites: resolveSites, _credCurrent: credCurrent, _credRows: credRows,
    _credCould: credCould, _routeFromHash: routeFromHash, loadSweep: loadSweep, _sweepShown: sweepShown, _sweepRows: sweepRows,
    _aseIssuer: aseIssuer, _issuerFor: issuerFor, _nameOptions: nameOptions, _nameMatches: nameMatches, _bulkItems: bulkItems,
    _sweepIssuer: sweepIssuer,
    loadRules: loadRules, _requestRows: requestRows, _requestState: requestState, _sendRequest: sendRequest,
    _switchRequest: switchRequest, _dryRunLines: dryRunLines, _listCsv: listCsv, _listRows: listRows
  };
})();
