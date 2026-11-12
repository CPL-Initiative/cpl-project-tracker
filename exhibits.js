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
//                                    List: what each college articulated, the courses each
//                                    could-adopt college already teaches, the exhibits, the field, the peer median
//   map_links.js                     MAP's verified exhibits and who built each, for Request Quick Adopt
//   kb/status/commons.json           the Commons' row for this reference (key "exhibit"), and the run log it names,
//   kb/status/exhibit.json           read for the List's tiles exactly as commons.js reads them, so the
//                                    two pages show the same figures (Sam, 2026-11-01; see "The Commons' row" below)
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
// The credential's issuer and training sites (Sheet 147's order, step 2): every credential in the reference, from
// credential_reference_data.js (loaded on the first visit to the List) and the live _CREDENTIAL_REVIEW::
// rows, so a save shows at once. The Credentials view held the editor until 2026-11-03, when the List's side panel
// took it and the view retired (Sam, 2026-11-03: the original views retire once the List does what they do;
// #exhibits/credentials opens the List). Sam, 2026-10-30: "the issuer for an electrician apprentice is the
// national trade union and the training site is the local union school house"; "could be multiple
// training sites"; "would want to be able to set and change both issuer and training site from here".
// The editor's Save writes, under _CREDENTIAL_REVIEW::<credential>, issuing_agency_override and
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
  var FIELD_FOLD_RESOLUTION = "issuer_resolution";  // a fold's issuer decision (#3116, issuer_resolution.js)
  var FIELD_CRED_TRAINER = "training_agency_override";
  var FIELD_CRED_SITES = "training_sites_override";
  var FIELD_CRED_SUBJ = "subj_override";       // the Common SUBJ the Catalog's editor or the subject fill stored
  // The List view (Sam, 2026-11-01): a title edited there saves the rename field the reference already reads
  // (credential_reference.js: display-only until the daily dry-run projects it and the reviewed apply re-keys).
  var FIELD_CRED_TITLE = "unified_title_override";
  /* A fold into an existing credential: the rename apply merges only when this names the exact target. */
  var FIELD_MERGE_CONFIRM = "unified_title_merge_confirm";
  // A credential family (Sam, 2026-11-11: each ASE bundle stays its own title and carries the family).
  var FIELD_CRED_FAMILY = "credential_family";
  // Your flag (Sam, 2026-11-01: "a flag for any row that persists until I clear it"): one row per credential, the
  // value the time it was set; clearing writes "" (an upsert, never a delete, so a refused write cannot pass as done).
  var FIELD_LIST_FLAG = "list_flag";
  /* The group a reviewer keeps a credential in under the AI sort (Sam, 2026-11-01: "establish the groups and be able to
     move exhibits out and into more appropriate groups where needed"): the group's name. NO_GROUP takes the credential
     out of every group; "" hands it back to the night's sort. The view lays these over the nightly order, so a kept group
     and a moved title hold through every rebuild. */
  var FIELD_LIST_GROUP = "exhibit_group";
  var NO_GROUP = "_NO_GROUP";
  // Re-analyze my changes: one request row a press, worked by the CPL queue routine (scheduled_sessions step 9).
  var REANALYSIS_PREFIX = "_EXHIBIT_REANALYSIS::";
  var FIELD_REANALYSIS = "exhibit_reanalysis_request";
  var COLLISIONS_URL = "kb/cred_rename_dryrun/collisions.json";
  /* The AI sort's order, built daily by kb/_build_exhibits_ai_sort.py (Sam, 2026-11-01: "sort the list based on your
     understanding of the exhibits (like with like in an alpha-like order)"). */
  var AI_SORT_URL = "kb/exhibits_ai_sort.json";
  /* The Fact Sheet's statewide credentials, from MAP's CCC Collaborative rows: the List's Basis column reads it. */
  var STATEWIDE_RECS = "fact-sheet/statewide_recs.js";
  /* Which certs each canonical title holds, by the industry credential catalog's ids (kb/_build_exhibit_cert_links.py;
     Sam, 2026-11-01: "a separate canonical list of just our certs, apart from how they might be bundled"). */
  var CERT_LINKS_URL = "kb/exhibit_cert_links.json";
  var IN_REF = "In the reference";
  var MAP_PAGE = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses";
  var MAP_VIEW = "&View=Non-Military";
  var CHIP_MAX = 10;
  var CONFLICT = "Conflict with the reference";
  var STEPS = ["Proposed", "Wording check", "Two issuers", CONFLICT];
  var SWEEP = "Another look";
  var SWEEP_URL = "kb/exhibits_sweep.json";
  /* The titles beside a Review card and the rename batch (kb/_build_exhibits_related.py; Sam, 2026-11-11). */
  var RELATED_URL = "kb/exhibits_related.json";
  var RENAME = "Rename batch";
  /* A rename batch row skipped: the proposal declined, so the batch does not offer it again. */
  var FIELD_RENAME_KEPT = "cert_rename_kept";
  var FIELD_SUPERSEDES = "unified_title_supersedes";
  var FIELD_KEPT = "title_sweep_kept";
  var ASE_ISSUER = "National Institute for Automotive Service Excellence (ASE)";
  /* The certification itself opens with ASE (ASE A8 — Engine Performance). A course aligned to a test names it in
     parentheses and keeps its college or school as issuer (Sam, 2026-10-31: "Agree on your call on the college as
     issuer"). */
  var ASE_CERT_TITLE = /^\s*(?:ASE\b|Automotive Services? Excellence\b|National Institute for Automotive Service Excellence\b)/i;
  /* The certification named the way Sam ruled on 2026-11-11 (kb/cert_naming.py): its official name first, its code in
     parentheses, "Medium/Heavy Truck Parts Specialist (ASE P1)". The title carries the credential's issuer, ASE (his
     ruling 1 on #3110 the same day, which replaced "keep the college as issuer on the P1 title"); the college that
     gives the credit by its own exam shows on its local exhibit, as that exhibit's assessor. */
  var ASE_CERT_FORM = /\(ASE\s+(?:[A-Z]\d|xEV)\)\s*$/;
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
    "Rename batch": "Titles in the reference that are not named the way certifications now are: the official name first, the code in parentheses. Nothing is renamed until you approve the batch.",
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
    // Public requests to prioritize a credential (Sam, Sheet 162): the Credential Catalog's statewide route, read here.
    pq: { rows: null, error: null, loading: null },
    // Credentials the public added (Sam, 2026-11-06: "yes, build the add your credential route"), decided here.
    cs: { rows: null, error: null, loading: null, busy: "", note: "", mergeFor: "" },
    // Another look: the sweep's cards, decided this visit by card id.
    sw: { data: null, error: null, rule: "", cur: 0, done: {}, saved: {}, drafts: {}, issuers: {}, history: [], bulkAsk: false, bulkBusy: false,
      batchMode: false, batch: null },
    cs: { rows: null, error: null, loading: null, overlay: {}, overlayOk: null,
          drafts: {},
          adopt: null, adoptErr: false, open: null, links: null },
    // Related titles and the rename batch: the file, its titles indexed, and this visit's edits and decisions.
    rel: { data: null, error: null, idx: [], by: {}, all: null, plans: null, act: null, folded: {} },
    // Course details beside a Review card (Sam, 2026-11-12): the card it is open on, and the files read for it.
    cd: { open: null, ready: false, loading: null, err: "", byId: {}, byCourse: {}, topmap: {} },
    rb: { drafts: {}, skip: {}, done: {}, ask: false, busy: false, students: null, studentsWord: "" },
    // The Commons' row and its run log, read fresh each visit (commonsFresh()).
    cm: null
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
  /* The one MAP address is map_links.js's (CPL_MAP_LINKS.url), which COBI loads first; MAP_PAGE and MAP_VIEW are its
     copy for a page without it, held equal by tests/exhibits.test.js. */
  function mapUrl(id) {
    var L = typeof window !== "undefined" && window.CPL_MAP_LINKS;
    return L && typeof L.url === "function" ? L.url(id) : MAP_PAGE + "?Exhibit=" + encodeURIComponent(id) + MAP_VIEW;
  }
  function whoBuilt(h) { return h.colleges && h.colleges.length ? h.colleges : h.art; }
  /* The issuer a title brings with it: an ASE certification's title names ASE, ahead of the proposal's issuer;
     what a person typed in the box wins over both. */
  function aseIssuer(title) { return ASE_CERT_TITLE.test(title || "") || ASE_CERT_FORM.test(title || "") ? ASE_ISSUER : ""; }
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
      .then(function (d) { state.sw.data = d; state.sw.error = null; return reconcileSweep(d); })
      .catch(function (e) { state.sw.data = null; state.sw.error = String(e && e.message || e); });
  }
  /* The sweep is built nightly, so a card someone kept or changed since then is still in the file (COBIx on #2923).
     Its saves are on kb_curation: a card whose local titles carry a keep, or a fold off its current title, written
     after the sweep was built is decided, and leaves the queue and the batch. A failed read leaves the file's cards. */
  function reconcileSweep(d) {
    var key = anonKey(), cards = (d && d.cards) || [], since = d && d.generated_at;
    if (!key || !cards.length || !since) return Promise.resolve();
    var byId = {};
    cards.forEach(function (c) { (c.locals || []).forEach(function (l) { byId[UNCLASS_PREFIX + l.raw] = c; }); });
    var ids = Object.keys(byId);
    if (!ids.length) return Promise.resolve();
    var quoted = ids.map(function (i) { return encodeURIComponent('"' + i.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'); });
    var url = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,reviewed_at"
      + "&field=in.(" + [FIELD_KEPT, FIELD_SUPERSEDES].join(",") + ")"
      + "&reviewed_at=gt." + encodeURIComponent(since)
      + "&course_id=in.(" + quoted.join(",") + ")";
    return fetch(url, { headers: { "apikey": key, "Range-Unit": "items", "Range": "0-999" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (rows) {
        (rows || []).forEach(function (row) {
          var c = byId[row.course_id];
          if (!c) return;
          if (row.field === FIELD_KEPT || (row.field === FIELD_SUPERSEDES && row.value === c.current)) state.sw.done[c.id] = true;
        });
      })
      .catch(function () { /* the file's cards stand */ });
  }
  function sweepRule(id) {
    var rules = (state.sw.data && state.sw.data.rules) || [];
    for (var i = 0; i < rules.length; i++) if (rules[i].id === id) return rules[i];
    return { id: id, label: id, tip: "" };
  }
  /* The batch (Sam's Commons rulings, 2026-11-08, #2921 item 2): the Commons' Start opens #exhibits/another-look/batch,
     the first six open cards, fixed for the visit, decided one by one with no bulk acceptance, then a stop. */
  var BATCH_MAX = 6;
  function sweepShown(rule) {
    var d = state.sw.data;
    if (!d) return [];
    if (state.sw.batchMode) {
      if (!state.sw.batch) state.sw.batch = (d.cards || []).filter(function (c) { return !state.sw.done[c.id]; }).slice(0, BATCH_MAX).map(function (c) { return c.id; });
      return (d.cards || []).filter(function (c) { return state.sw.batch.indexOf(c.id) >= 0 && !state.sw.done[c.id]; });
    }
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
  /* Public requests to prioritize a credential's review (Sam, Open Asks Sheet 162, 2026-11-06: "a public request to
     prioritize review of a credential ... without promising any one person that we would evaluate their credential").
     The Credential Catalog's panel writes credential_priority_requests through one INSERT-only function; the team reads
     the rows here, behind the phrase or a reviewer sign-in (the table has no public policy), grouped by credential, most
     asked first. The count is the signal for what to work on next; no reply is owed, and an email a requester left stays
     a count here, never a column. */
  var PQ_URL = SUPABASE_URL + "/rest/v1/credential_priority_requests?select=credential,issuer,college,email,note,source,status,created_at&order=created_at.desc";
  function loadRequests() { return Promise.all([loadPq(), loadSubmissions()]); }
  function loadPq() {
    if (state.pq.loading) return state.pq.loading;
    state.pq.loading = session().then(function (sess) {
      var S = window.CPL_SESSION;
      var h = S && typeof S.authHeaders === "function" ? S.authHeaders({ "Range-Unit": "items", "Range": "0-999" }) : null;
      if (!h) throw new Error("no session");
      if (window.CPL_TEAM_PHRASE && typeof window.CPL_TEAM_PHRASE.decorateHeaders === "function") window.CPL_TEAM_PHRASE.decorateHeaders(h, sess);
      return fetch(PQ_URL, { headers: h });
    })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (rows) { state.pq.rows = Array.isArray(rows) ? rows : []; state.pq.error = null; })
      .catch(function (e) { state.pq.rows = null; state.pq.error = errText(e); })
      .then(function () { state.pq.loading = null; });
    return state.pq.loading;
  }
  /* Credentials the public added from the Catalog when its search found nothing (Sam, 2026-11-06: "yes, build the add
     your credential route"; DR-32). The Catalog writes credential_submissions through one INSERT-only function; the team
     reads the rows here behind the phrase or a reviewer sign-in, and a signed-in reviewer decides each one through
     credential_submission_decide(): Verify (it joins the Catalog as Not yet evaluated), Merge into an existing
     credential, Decline, or Reopen. Each decision keeps the row's prior state in its history. The email is counted,
     never shown. */
  var CS_URL = SUPABASE_URL + "/rest/v1/credential_submissions?select=id,created_at,name,issuer,kind,link,college,email,note,status,merged_into,decided_by,decided_at,decision_note&order=created_at.desc";
  var CS_DECIDE_URL = SUPABASE_URL + "/rest/v1/rpc/credential_submission_decide";
  var CS_STATUS = { "new": "Waiting for the team", verified: "Verified: in the Catalog as Not yet evaluated", merged: "Merged", declined: "Declined" };
  function loadSubmissions() {
    if (state.cs.loading) return state.cs.loading;
    state.cs.loading = session().then(function (sess) {
      var S = window.CPL_SESSION;
      var h = S && typeof S.authHeaders === "function" ? S.authHeaders({ "Range-Unit": "items", "Range": "0-999" }) : null;
      if (!h) throw new Error("no session");
      if (window.CPL_TEAM_PHRASE && typeof window.CPL_TEAM_PHRASE.decorateHeaders === "function") window.CPL_TEAM_PHRASE.decorateHeaders(h, sess);
      return fetch(CS_URL, { headers: h });
    })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (rows) { state.cs.rows = Array.isArray(rows) ? rows : []; state.cs.error = null; })
      .catch(function (e) { state.cs.rows = null; state.cs.error = errText(e); })
      .then(function () { state.cs.loading = null; });
    return state.cs.loading;
  }
  function submissionsOpen() { return (state.cs.rows || []).filter(function (r) { return r.status === "new"; }).length; }
  // A reviewer's decision. The function refuses anyone but a signed-in reviewer; the team phrase reads and does not decide.
  function decideSubmission(id, decision, into) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return fetch(CS_DECIDE_URL, { method: "POST", headers: headers(sess),
        body: JSON.stringify({ p_id: id, p_decision: decision, p_merged_into: into || null, p_note: null }) });
    }).then(function (r) {
      if (r.ok) return r.json();
      return r.json().catch(function () { return {}; }).then(function (b) {
        throw new Error(/reviewer sign-in/.test(String(b && b.message || "")) ? "signin" : "HTTP " + r.status);
      });
    });
  }
  function requestsOpen() { return (state.pq.rows || []).filter(function (r) { return !r.status || r.status === "new"; }).length; }
  /* One line per credential: how many asked, how many are still new, the colleges named, how many left an email, first and last. */
  function requestGroups() {
    var by = {}, out = [];
    (state.pq.rows || []).forEach(function (r) {
      var k = String(r.credential || "").toLowerCase();
      var g = by[k];
      if (!g) { g = by[k] = { credential: r.credential, issuer: r.issuer || "", n: 0, open: 0, colleges: {}, emails: 0, first: r.created_at, last: r.created_at, sources: {} }; out.push(g); }
      g.n += 1;
      if (!r.status || r.status === "new") g.open += 1;
      if (r.college) g.colleges[r.college] = true;
      if (r.email) g.emails += 1;
      if (r.source) g.sources[r.source] = true;
      if (!g.issuer && r.issuer) g.issuer = r.issuer;
      if (r.created_at < g.first) g.first = r.created_at;
      if (r.created_at > g.last) g.last = r.created_at;
    });
    out.sort(function (a, b) { return b.n - a.n || (a.last < b.last ? 1 : a.last > b.last ? -1 : 0); });
    return out;
  }
  /* kb_curation's reviewer emails answer a signed-in reviewer's token only (S614, Sam 2026-11-09: "go ahead and close
     the email exposure"). Signed out, a read asks for reviewer_label (a procedure's cohort id, or "a reviewer"),
     copied into reviewer_email so the code below reads one field. */
  function curationWho() {
    var S = window.CPL_SESSION, s = S && typeof S.get === "function" ? S.get() : null;
    var ok = s && s.access_token && (typeof S.isFresh !== "function" || S.isFresh(s));
    return ok ? { cols: "reviewer_email,reviewer_label", auth: { Authorization: "Bearer " + s.access_token } }
              : { cols: "reviewer_label", auth: {} };
  }
  var CURATION_ANON = { cols: "reviewer_label", auth: {} };
  /* One kb_curation read: the url's "{who}" takes curationWho()'s columns. A token the server refuses (401 or 403)
     reads again signed out, and st.W keeps that choice for the read's later pages, so a paged read never mixes a
     token-less page with the email columns (COBIx on #2950). */
  function curationFetch(url, headers, st) {
    st = st || { W: curationWho() };
    var go = function () { return fetch(url.split("{who}").join(st.W.cols), { headers: Object.assign({}, headers, st.W.auth) }); };
    return go().then(function (r) {
      if ((r.status === 401 || r.status === 403) && st.W.auth.Authorization) { st.W = CURATION_ANON; return go(); }
      return r;
    });
  }
  function curationRows(arr) {
    (arr || []).forEach(function (r) { if (r && !r.reviewer_email && r.reviewer_label) r.reviewer_email = r.reviewer_label; });
    return arr;
  }
  function loadRules() {
    var key = anonKey();
    var url = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,{who},reviewed_at"
      + "&course_id=like." + encodeURIComponent(REQ_PREFIX) + "%25"
      + "&field=in.(" + [FIELD_REQ, FIELD_BUILT, FIELD_SWITCH].join(",") + ")&order=course_id.asc";
    var rows = key
      ? curationFetch(url, { "apikey": key, "Range-Unit": "items", "Range": "0-999" })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(curationRows)
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

  /* ── Related titles, and the rename batch (Sam, 2026-11-11) ──
     The noncredit Automotive cards kept returning to Another look ("Noncredit for AUTO P1"): he went back and forth
     because the card did not show which canonical titles already exist for the same certification. So every Review
     card carries a side panel of the titles in its certification family, each with Use this title, and an exhibit
     based on a certification is named by the certification: its official name first, its code in parentheses,
     "Medium/Heavy Truck Parts Specialist (ASE P1)" (kb/cert_naming.py holds the rule and its notes). A title already
     in the reference under an older form is never renamed from a card: kb/_build_exhibits_related.py lists them in
     one rename batch, which Review shows as one card. Approving it writes each row's unified_title_override (and,
     where two titles are one certification, unified_title_merge_confirm), the rows the credential rename dry-run and
     apply already carry; a skipped row writes cert_rename_kept, the proposal declined. Until a row is decided the
     panel marks its title "Rename pending". An approved rename keeps the old title as a search alias. */
  function loadRelated() {
    return fetch(RELATED_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        var idx = [], by = {};
        (d.titles || []).forEach(function (row) {
          var issuer = row[1] >= 0 ? (d.issuers || [])[row[1]] || "" : "";
          var o = { t: row[0], issuer: issuer, locals: row[2] || 0, adopted: row[3] || 0, proposed: row[4] === 1, aka: row[5] || [], paths: row[6] || [] };
          o.ase = /Automotive Service Excellence/i.test(issuer) || /(?:^|[^A-Za-z])ASE(?![A-Za-z])/.test(o.t);
          o.codes = o.ase ? aseCodesIn(o.t) : [];
          o.words = relWords(o.t + " " + o.aka.join(" "));
          idx.push(o); by[o.t] = o;
        });
        // The credential families (Sam, 2026-11-11: each ASE bundle stays its own title and carries the family; its tests
        // are search aliases). title -> { name, aliases }; name -> member count.
        var fam = {}, famN = {};
        Object.keys(d.families || {}).forEach(function (name) {
          var mem = (d.families[name] || {}).members || {};
          famN[name] = Object.keys(mem).length;
          Object.keys(mem).forEach(function (t) { fam[t] = { name: name, aliases: mem[t] || [] }; });
        });
        state.rel.fam = fam; state.rel.famN = famN;
        state.rel.data = d; state.rel.idx = idx; state.rel.by = by; state.rel.error = null;
        return reconcileRename(d);
      })
      .catch(function (e) { state.rel.data = null; state.rel.idx = []; state.rel.by = {}; state.rel.error = String(e && e.message || e); });
  }
  /* Each local exhibit's CPL path and who assessed the student (Sam's rulings on #3110, 2026-11-11: the canonical
     title carries the credential's issuer, each local exhibit carries its path and assessor). The path is read from
     the MAP exhibit id by kb/exhibit_paths.py; an industry certification or an exam score is assessed by the title's
     issuer, a college's own exam or a portfolio by the college. One line a path: "9 by industry certification,
     assessed by ASE". */
  function shortIssuer(name) {
    var m = /\(([^()]+)\)\s*$/.exec(name || "");
    return m ? m[1] : (name || "");
  }
  function pathLines(paths, issuer) {
    var defs = (state.rel.data && state.rel.data.paths) || {};
    return (paths || []).map(function (p) {
      var d = defs[p[0]] || { words: p[0], assessed_by: "" };
      var who = d.assessed_by === "college" ? "the college"
        : d.assessed_by === "issuer" ? (issuer && issuer !== LOCAL_ISSUER ? shortIssuer(issuer) : "the credential's issuer") : "";
      return fmt(p[1]) + " by " + d.words + (who ? ", assessed by " + who : "");
    });
  }
  function pathsNode(paths, issuer) {
    var lines = pathLines(paths, issuer);
    if (!lines.length) return null;
    return el("span", { cls: "exh-muted exh-small exh-rel-paths" }, ["Local exhibits: " + lines.join("; ")]);
  }
  /* A title's credential family, or null. */
  function famOf(title) { return (state.rel.fam && state.rel.fam[title]) || null; }
  function famCount(name) { return (state.rel.famN && state.rel.famN[name]) || 0; }
  function famWords(name) { var n = famCount(name); return name + ", " + fmt(n) + (n === 1 ? " title" : " titles"); }
  /* The titles a credential carried before a rename or a merge: the List's finder searches them too. */
  function akaOf(title) { var o = state.rel.by && state.rel.by[title]; return o ? o.aka : []; }
  function aseCodesIn(text) {
    var out = [], m, re = /(?:^|[^A-Za-z0-9])([A-Z]\d|xEV)(?![A-Za-z0-9])/g;
    while ((m = re.exec(text || ""))) if (out.indexOf(m[1]) < 0) out.push(m[1]);
    return out;
  }
  var REL_STOP = { and: 1, the: 1, of: 1, "in": 1, "for": 1, to: 1, a: 1, an: 1, by: 1, on: 1, with: 1, or: 1, credit: 1, exam: 1, noncredit: 1,
    certification: 1, certificate: 1, course: 1, level: 1, introduction: 1, intro: 1, basic: 1, advanced: 1 };
  function relWords(text) {
    var out = {}, list = String(text || "").toLowerCase().match(/[a-z][a-z0-9+#]{2,}/g) || [];
    list.forEach(function (w) { if (!REL_STOP[w]) out[w.replace(/(?:es|s)$/, "")] = 1; });
    return out;
  }
  /* The ASE test a card is about: the code its title names, else the one its local title does (AUTO P1, ASE A5). */
  function aseOf(title, raw, issuer) {
    var t = title || "", r = raw || "";
    var isAse = !!aseIssuer(t) || /\(ASE\s/.test(t) || /Automotive Service Excellence/i.test(issuer || "")
      || /(?:^|[^A-Za-z])ASE(?![A-Za-z])/.test(r) || /\bAUTO\w*\s+[A-Z]\d\b/.test(r);
    if (!isAse) return null;
    var m = /\(ASE\s+([A-Z]\d|xEV)/.exec(t) || /^\s*ASE\s+([A-Z]\d|xEV)\b/.exec(t) || /\bAUTO\w*\s+([A-Z]\d)\b/.exec(r)
      || /(?:^|[^A-Za-z])ASE[^A-Za-z0-9]+(?:\w+\s+)?\(?([A-Z]\d)\b/.exec(r);
    return { code: m ? m[1] : "" };
  }
  var LOCAL_ISSUER = "California Community Colleges";
  /* The existing titles beside a card, nearest first. ASE: the same test, then the same series, then ASE's other
     titles. Any other card: the same issuer and shared words, then shared words alone. */
  function relatedFor(title, raw, issuer, skip) {
    var idx = state.rel.idx || [], out = [], fam = aseOf(title, raw, issuer);
    var skipSet = {};
    (skip || []).forEach(function (s) { if (s) skipSet[s] = 1; });
    if (fam) {
      var series = fam.code ? fam.code.charAt(0) : "";
      idx.forEach(function (o) {
        if (!o.ase || skipSet[o.t]) return;
        var tier = fam.code && o.codes.indexOf(fam.code) >= 0 ? 0
          : series && o.codes.some(function (c) { return c.charAt(0) === series; }) ? 1 : 2;
        // The test alone before a bundle that holds it.
        out.push({ o: o, tier: tier, rank: tier === 0 ? o.codes.length : 0 });
      });
      out.sort(function (a, b) { return a.tier - b.tier || a.rank - b.rank || b.o.locals - a.o.locals || a.o.t.localeCompare(b.o.t); });
      return { family: "ASE", code: fam.code, rows: out,
        tiers: [fam.code ? "The same test, ASE " + fam.code : "", series ? "The same series, ASE " + series : "", "Other ASE titles"] };
    }
    var words = relWords(title), keys = Object.keys(words), iss = (issuer || "").trim();
    var named = iss && iss !== LOCAL_ISSUER;
    idx.forEach(function (o) {
      if (skipSet[o.t]) return;
      var n = 0;
      keys.forEach(function (k) { if (o.words[k]) n++; });
      var same = named && o.issuer === iss;
      var tier = same && n ? 0 : (n >= 2 || (n && n === keys.length)) ? 1 : same ? 2 : -1;
      if (tier >= 0) out.push({ o: o, tier: tier, rank: -n });
    });
    out.sort(function (a, b) { return a.tier - b.tier || a.rank - b.rank || b.o.locals - a.o.locals || a.o.t.localeCompare(b.o.t); });
    return { family: "", code: "", rows: out, tiers: ["The same issuer, words in common", "Words in common", "The same issuer"] };
  }
  function renamePending(title) {
    var p = state.rel.data && state.rel.data.pending;
    return p && Object.prototype.hasOwnProperty.call(p, title) && !state.rb.done[title] ? { to: p[title] } : null;
  }
  var REL_MAX = 8;
  /* The side panel. o.title and o.issuer are the card's boxes; o.use(row) fills them. The list follows the title as
     it is edited. */
  function relatedPanel(o) {
    var box = el("aside", { cls: "exh-rel", "aria-label": "Related titles" }, [el("h4", { cls: "exh-q exh-small", text: "Related titles" })]);
    var body = el("div", { cls: "exh-rel-body" });
    box.appendChild(body);
    function draw() {
      while (body.firstChild) body.removeChild(body.firstChild);
      if (!state.rel.data) {
        body.appendChild(el("p", { cls: "exh-muted exh-small", text: state.rel.error
          ? "The titles in the reference could not be read (" + state.rel.error + ")." : "Reading the titles in the reference…" }));
        return;
      }
      var got = relatedFor(o.title.value.trim(), o.raw, o.issuer.value.trim() || o.issuer0, o.skip);
      body.appendChild(el("p", { cls: "exh-muted exh-small", text: got.family
        ? "Canonical titles for " + got.family + (got.code ? " " + got.code : "") + " certifications. Fold this card into one, or keep the proposed title."
        : "Canonical titles with the same issuer or the same words. Fold this card into one, or keep the proposed title." }));
      if (!got.rows.length) { body.appendChild(el("p", { cls: "exh-empty exh-small", text: "No title in the reference is close to this one." })); return; }
      // Review's panel names the statewide or most-used title and sorts it first (Sam, 2026-11-12).
      var mark = o.actions ? relAligned(got, o.title.value, o.issuer.value.trim() || o.issuer0) : null, all = got.rows;
      if (mark) all = [{ o: mark.o, tier: "mark" }].concat(got.rows.filter(function (x) { return x.o !== mark.o; }));
      var act = o.actions ? relAct(o, got, mark, draw) : null;
      if (act) body.appendChild(relActBar(o, act, draw));
      var rows = state.rel.all === o.key ? all : all.slice(0, REL_MAX), last = -1, ul = null;
      rows.forEach(function (x) {
        if (x.tier !== last) {
          last = x.tier;
          var th = x.tier === "mark" ? (mark.kind === "popular" ? "The most used title" : "The statewide exhibit") : got.tiers[x.tier];
          if (th) body.appendChild(el("h5", { cls: "exh-rel-tier", text: th }));
          ul = el("ul", { cls: "exh-rel-list" });
          body.appendChild(ul);
        }
        var r = x.o, pend = renamePending(r.t);
        var rf = famOf(r.t);
        var meta = [r.issuer || "No issuer named", fmt(r.locals) + " local title" + (r.locals === 1 ? "" : "s"),
          r.proposed ? "Proposed, not in the reference yet" : "In the reference"].concat(rf ? ["Family: " + rf.name] : []).join(" · ");
        var why = act ? relWhyNot(r.t, act) : null, can = act && why === "";
        var head = el("b", { cls: "exh-rel-t", text: r.t });
        if (can) {
          var cb = el("input", { type: "checkbox", id: "exh-rel-cb-" + relIdOf(r.t), cls: "exh-rel-cb" });
          cb.checked = !!act.checked[r.t];
          cb.addEventListener("change", function () { if (cb.checked) act.checked[r.t] = true; else delete act.checked[r.t]; act.note = ""; });
          head = el("label", { cls: "exh-rel-pick", "for": cb.id }, [cb, head]);
        }
        var li = el("li", null, [head]);
        var marks = [];
        if (o.actions && relStatewide(r.t)) marks.push("Statewide exhibit");
        if (mark && mark.kind === "popular" && mark.o === r) marks.push("Most used");
        if (marks.length) li.appendChild(el("span", { cls: "exh-rel-mark exh-small", text: marks.join(" · ") }));
        li.appendChild(el("span", { cls: "exh-muted exh-small", text: meta }));
        var pn = pathsNode(r.paths, r.issuer);
        if (pn) li.appendChild(pn);
        if (pend) li.appendChild(el("span", { cls: "exh-rel-pend exh-small", text: "Rename pending" + (pend.to ? ": " + pend.to : "") }));
        if (act && state.rel.folded[r.t]) li.appendChild(el("span", { cls: "exh-rel-pend exh-small",
          text: "Saved this visit: folds into " + state.rel.folded[r.t] + ". The daily dry run pairs them, and a reviewed apply merges the records." }));
        else if (act && r.t === act.target) li.appendChild(el("span", { cls: "exh-muted exh-small", text: "The checked titles change to this one." }));
        else if (why) li.appendChild(el("span", { cls: "exh-rel-why exh-small", text: why }));
        if (r.t === o.title.value.trim()) li.appendChild(el("span", { cls: "exh-muted exh-small", text: "This is the proposed title." }));
        else li.appendChild(word("Use this title", function () { o.use(r); draw(); }, { cls: "exh-w exh-small", "aria-label": "Use this title: " + r.t }));
        // Sam, 2026-11-12: "i need to be able to use this title on the sidebar candidates that need it". One row,
        // the same confirmation and the same rows as the checked titles.
        if (can && act.ok) li.appendChild(word("Change to " + act.target, function () { relAsk(act, [r.t]); }, { cls: "exh-w exh-small",
          "aria-label": "Change " + r.t + " to " + act.target }));
        ul.appendChild(li);
      });
      if (got.rows.length > REL_MAX) {
        body.appendChild(word(state.rel.all === o.key ? "Show fewer" : "Show all " + fmt(got.rows.length), function () {
          state.rel.all = state.rel.all === o.key ? null : o.key; draw();
        }, { cls: "exh-w exh-small" }));
      }
    }
    o.title.addEventListener("input", draw);
    draw();
    return box;
  }
  function withRelated(cardEl, o) { return el("div", { cls: "exh-with-rel" }, [cardEl, relatedPanel(o)]); }

  /* ── The statewide or most-used title, and related titles changed from the panel (Sam, 2026-11-12) ──
     "for the firefighter academy example, it should be renamed "Firefighter 1" which is the statewide exhibit ... it
     would be good to see some indication of the alignment with a statewide exhibit ... I would like to be able to
     change all those needing it to firefighter 1 in the sidebar." And: "i need to be able to use this title on the
     sidebar candidates that need it".
     The alignment: among the related titles that share words with the card (an ASE card: the same test), in the
     reference, a statewide exhibit wins (fact-sheet/statewide_recs.js, the List's Basis column's source; the
     reference's own statewide flag stands in when that list did not load), the most local titles, then the most
     colleges, leading. With none statewide, the most used title is named only when it has at least POPULAR_MIN local
     titles and more than every other related title (a tie names none).
     The change: a reference title folds into another reference title with the two rows the rename batch writes for a
     fold (renameRows: unified_title_override and unified_title_merge_confirm, both naming the target, on the title's
     _CREDENTIAL_REVIEW:: key, under the signed-in reviewer), posted by postRows. The daily dry run pairs them and the
     reviewed rename apply merges the records; the old title stays a search alias (kb/credential_aliases.py). Before
     the apply, the List's Edit back to the title's own name clears the rename (the override saved as "", which the dry
     run skips); after it, kb/_cred_rename_undo.py on the apply's receipt. Nothing is checked by default, and a title
     inside a ruled plan, the rename batch, a saved rename or fold, or one other titles wait to fold into, has no
     checkbox and says why; the saved rows are read live before the confirmation is offered and again at the save. */
  var DRYRUN_ALIAS_URL = "kb/cred_rename_dryrun/alias_map.json";
  var POPULAR_MIN = 3;
  function loadRelatedPlans() {
    return fetch(DRYRUN_ALIAS_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        var b = {};
        function block(t, why) { if (t && !b[t]) b[t] = why; }
        var ruled = (d && d.ruled) || {};
        (ruled.applied || []).concat(ruled.held || []).forEach(function (e) {
          block(e.old, "In a ruled plan (" + (e.plan_id || "a decision sheet") + ") that renames it to " + e["new"] + ".");
          block(e["new"], "A ruled plan (" + (e.plan_id || "a decision sheet") + ") renames another title to it.");
        });
        [["renames", "renamed"], ["merges", "folded"]].forEach(function (p) {
          var m = (d && d[p[0]]) || {};
          Object.keys(m).forEach(function (old) {
            block(old, "Saved to be " + p[1] + " into " + m[old] + "; the rename apply carries it.");
            block(m[old], "Another title is saved to be " + p[1] + " into it.");
          });
        });
        ((d && d.held_family) || []).concat((d && d.held_emptied) || []).forEach(function (e) {
          block(e.old, "Saved to fold into " + e.target + "; the rename run holds it (" + String(e.why || "").replace(/^held:\s*/, "") + ").");
        });
        state.rel.plans = { blocked: b, at: d && d._generated_at };
      })
      .catch(function (e) { state.rel.plans = { error: String(e && e.message || e) }; });
  }
  function loadStatewideRecs() {
    if (window.CPL_STATEWIDE_RECS) return Promise.resolve();
    var T = window.CPL_TABS;
    if (!T || typeof T.loadScript !== "function") return Promise.resolve();
    return new Promise(function (res) { T.loadScript(STATEWIDE_RECS, "CPL_STATEWIDE_RECS", res); });
  }
  var swIdx = null;
  function relStatewide(t) {
    var S = window.CPL_STATEWIDE_RECS;
    if (S) return Object.prototype.hasOwnProperty.call(S, t);
    var R = window.CPL_CREDENTIAL_REFERENCE;
    if (!R || !Array.isArray(R.unified_titles)) return false;
    if (!swIdx) { swIdx = {}; R.unified_titles.forEach(function (x) { if (x.statewide) swIdx[x.ut] = 1; }); }
    return !!swIdx[t];
  }
  /* The statewide exhibit or the most used title among the related titles, or null (the S642 review of #3160).
     (a) A card whose own title is in the reference and statewide is that exhibit: { kind: "self" }, nothing else named.
     (b) Otherwise a candidate shares the card's words (an ASE card: the same test), is in the reference, and has the
         card's own issuer; a title from another issuer is never named, however many words it shares (measured: the
         SMART welding card named AWS's SMAW, the UA refrigeration card an ESCO title).
     (c) Several statewide candidates: the leader is named only on a clear lead, at least STATEWIDE_LEAD times the
         local titles of the next one (Firefighter 1, 11, over Firefighter 1A, 2); else none, and the panel still
         marks each one Statewide exhibit.
     (d) None statewide: the most used candidate, by the same issuer rule, with at least POPULAR_MIN local titles and
         more than every other candidate. */
  var STATEWIDE_LEAD = 3;
  function relAligned(got, cardTitle, cardIssuer) {
    var t0 = (cardTitle || "").trim(), iss = (cardIssuer || "").trim();
    if (t0 && relInRef(t0) && relStatewide(t0)) return { kind: "self", o: state.rel.by[t0] };
    if (!iss) return null;
    var near = got.rows.filter(function (x) {
      return !x.o.proposed && x.o.t !== t0 && x.o.issuer === iss && (got.family ? x.tier === 0 : x.tier <= 1);
    });
    function byUse(a, b) { return b.o.locals - a.o.locals || b.o.adopted - a.o.adopted || a.o.t.localeCompare(b.o.t); }
    var sw = near.filter(function (x) { return relStatewide(x.o.t); }).sort(byUse);
    if (sw.length) {
      if (sw.length > 1 && sw[0].o.locals < STATEWIDE_LEAD * sw[1].o.locals) return null;
      return { kind: "statewide", o: sw[0].o };
    }
    // The card's own title, when it is in the reference, competes too: a card already on the most used title is told
    // nothing (a CompTIA Security+ card never names Network+).
    var pool = near.concat(got.rows.filter(function (x) { return x.o.t === t0 && !x.o.proposed && x.o.issuer === iss; }));
    var top = pool.slice().sort(byUse)[0];
    if (!top || top.o.t === t0 || top.o.locals < POPULAR_MIN) return null;
    if (pool.some(function (x) { return x !== top && x.o.locals >= top.o.locals; })) return null;
    return { kind: "popular", o: top.o };
  }
  function relAlignWords(a) {
    var r = a.o, n = fmt(r.locals) + " local title" + (r.locals === 1 ? "" : "s")
      + (r.adopted ? ", articulated at " + fmt(r.adopted) + " college" + (r.adopted === 1 ? "" : "s") : "");
    if (a.kind === "self") return "This is a statewide exhibit.";
    return a.kind === "statewide" ? "This looks like the statewide exhibit " + r.t + " (" + n + "). "
      : "A popular title for this is " + r.t + " (" + n + "). ";
  }
  function relIdOf(t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function relInRef(t) { var x = state.rel.by && state.rel.by[t]; return !!(x && !x.proposed); }
  /* This visit's state for one card's panel: the target, the checks, the confirmation, the live rows. Never stored. */
  function relAct(o, got, mark, redraw) {
    var a = state.rel.act;
    if (!a || a.key !== o.key) a = state.rel.act = { key: o.key, target: "", checked: {}, ask: null, busy: false, note: "", live: null, liveKey: "" };
    var box = o.title.value.trim(), seen = {}, opts = [];
    function add(t) { if (t && !seen[t] && relInRef(t)) { seen[t] = 1; opts.push(t); } }
    if (mark) add(mark.o.t);
    add(box);
    got.rows.forEach(function (x) { add(x.o.t); });
    a.opts = opts;
    // The target is the aligned title when one is named, else the card's title (when it is in the reference), else
    // the reviewer's choice; a choice holds until the reviewer changes it.
    if (a.target && opts.indexOf(a.target) < 0) { a.target = ""; a.picked = false; }
    if (!a.picked) a.target = mark ? mark.o.t : relInRef(box) ? box : "";
    delete a.checked[a.target];
    // The live rows for every title the panel could change, and the target.
    var want = opts.slice().sort(), k = want.join("\u0001");
    if (a.liveKey !== k) { a.liveKey = k; a.live = null; relLiveLoad(want).then(function (live) { if (a.liveKey === k) { a.live = live; redraw(); } }); }
    a.targetWhy = !opts.length ? "No related title is in the reference, so nothing can take the others in."
      : !a.target ? "Choose the title the checked ones fold into." : relTargetWhyNot(a.target, a);
    a.ok = !a.targetWhy;
    return a;
  }
  /* The saved rename rows on these titles, and the titles other rows rename or fold into them, read live. */
  var REL_LIVE_CHUNK = 20;
  function relLiveLoad(titles) {
    var key = anonKey();
    if (!key || !titles.length) return Promise.resolve({ error: key ? "" : "no reader key" , override: {}, merge: {}, into: {} });
    function q(t) { return encodeURIComponent('"' + t.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'); }
    var base = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,reviewed_at&field=in.(" + FIELD_CRED_TITLE + "," + FIELD_MERGE_CONFIRM + ")"
      + "&order=course_id.asc,field.asc";
    function paged(url, from, acc) {
      return fetch(url, { headers: { "apikey": key, "Range-Unit": "items", "Range": from + "-" + (from + 999) } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (rows) { acc = acc.concat(rows || []); return rows && rows.length === 1000 ? paged(url, from + 1000, acc) : acc; });
    }
    // In chunks of REL_LIVE_CHUNK titles, so a card with many related titles keeps each URL short; each chunk is
    // Range-paged, and any chunk that fails fails the whole read, which holds every title.
    var reads = [];
    for (var i = 0; i < titles.length; i += REL_LIVE_CHUNK) {
      var part = titles.slice(i, i + REL_LIVE_CHUNK);
      reads.push(paged(base + "&course_id=in.(" + part.map(function (t) { return q(CRED_PREFIX + t); }).join(",") + ")", 0, []));
      reads.push(paged(base + "&value=in.(" + part.map(q).join(",") + ")", 0, []));
    }
    return Promise.all(reads).then(function (got) {
      var out = { error: "", override: {}, merge: {}, into: {} };
      [].concat.apply([], got).forEach(function (row) {
        var t = String(row.course_id || "");
        if (t.indexOf(CRED_PREFIX) !== 0) return;
        t = t.slice(CRED_PREFIX.length);
        var v = row.value || "";
        if (row.field === FIELD_CRED_TITLE && titles.indexOf(t) >= 0) out.override[t] = v;
        if (row.field === FIELD_MERGE_CONFIRM && titles.indexOf(t) >= 0) out.merge[t] = v;
        if (v && v !== t && titles.indexOf(v) >= 0) { (out.into[v] = out.into[v] || {})[t] = 1; }
      });
      return out;
    }).catch(function (e) { return { error: String(e && e.message || e), override: {}, merge: {}, into: {} }; });
  }
  /* Why a related title cannot be checked, in words; "" when it can. */
  function relWhyNot(t, a, live) {
    live = live || a.live;
    if (t === a.target || !relInRef(t)) return null;
    if (state.rel.folded[t]) return null;
    if (!state.rel.plans) return "Reading the ruled plans…";
    if (state.rel.plans.error) return "The ruled plans could not be read (" + state.rel.plans.error + "), so it cannot be changed here.";
    if (renamePending(t)) return "In the rename batch; it is decided there.";
    if (state.rel.plans.blocked[t]) return state.rel.plans.blocked[t];
    var f = famOf(t);
    if (f) return "A member of " + f.name + "; the family's batch names it.";
    if (!live) return "Reading its saved rows…";
    if (live.error) return "Its saved rows could not be read (" + live.error + "), so it cannot be changed here.";
    var v = live.override[t];
    if (v && v !== t) return v === a.target && live.merge[t] === a.target ? "Already saved to fold into " + a.target + "."
      : "Already saved to be renamed " + v + "; the rename apply carries it.";
    // A merge confirm alone, naming another title, is a saved word too: it stays until a person settles it.
    var m = live.merge[t];
    if (m && m !== t && m !== a.target) return "A saved merge confirm folds it into " + m + ", with no rename beside it. It stays until a person "
      + "clears it: in the List, Edit its title to " + m + " and Save, then Edit it back and Save; the second save clears both rows.";
    var n = Object.keys(live.into[t] || {}).length;
    if (n) return fmt(n) + (n === 1 ? " title is" : " titles are") + " saved to fold into it, so it stays until they land.";
    return "";
  }
  function relTargetWhyNot(t, a, live) {
    live = live || a.live;
    if (!state.rel.plans || !live) return "Reading the saved rows…";
    if (state.rel.plans.error) return "The ruled plans could not be read (" + state.rel.plans.error + "), so nothing can be changed here.";
    if (live.error) return "The saved rows could not be read (" + live.error + "), so nothing can be changed here.";
    var b = state.rel.plans.blocked[t];
    if (b && !/into it\.$|to it\.$/.test(b)) return t + " cannot take the others in: " + b;
    var v = live.override[t];
    if (v && v !== t) return t + " is itself saved to be renamed " + v + "; choose that title.";
    var m = live.merge[t];
    if (m && m !== t) return t + " is itself saved to fold into " + m + "; choose that title.";
    if (famOf(t)) return t + " is a family member; its family's batch names it.";
    if (renamePending(t)) return t + " waits in the rename batch; decide it there first.";
    return "";
  }
  function relLocalsOf(t) { var x = state.rel.by && state.rel.by[t]; return x ? x.locals : 0; }
  function relAsk(a, titles) {
    a.note = "";
    if (!titles.length) { a.note = "Check one or more titles first."; render(); relFocus("exh-rel-note"); return; }
    a.ask = titles.slice();
    render();
    relFocus("exh-rel-ask-h");
  }
  function relFocus(id) { var e = document.getElementById(id); if (e) e.focus(); }
  /* The bar above the list: the target, the one control, the note, and the confirmation. */
  function relActBar(o, a, draw) {
    var bar = el("div", { cls: "exh-rel-acts" });
    if (a.opts.length) {
      var sel = el("select", { id: "exh-rel-target", cls: "exh-rel-sel" });
      if (!a.target) sel.appendChild(el("option", { value: "", text: "Choose a title" }));
      a.opts.forEach(function (t) { var op = el("option", { value: t, text: t }); if (t === a.target) op.selected = true; sel.appendChild(op); });
      sel.value = a.target;
      sel.addEventListener("change", function () { a.target = sel.value; a.picked = !!sel.value; a.ask = null; a.note = ""; render(); relFocus("exh-rel-target"); });
      bar.appendChild(el("label", { cls: "exh-small exh-rel-lab", "for": "exh-rel-target" }, ["Change related titles to"]));
      bar.appendChild(sel);
    }
    if (a.ok) bar.appendChild(word("Change the checked titles to " + a.target, function () {
      relAsk(a, Object.keys(a.checked).filter(function (t) { return relWhyNot(t, a) === ""; }));
    }, { cls: "exh-w exh-small", id: "exh-rel-go" }));
    else if (a.targetWhy) bar.appendChild(el("p", { cls: "exh-muted exh-small", text: a.targetWhy }));
    bar.appendChild(el("p", { cls: "exh-status exh-small", id: "exh-rel-note", role: "status", "aria-live": "polite", tabindex: "-1", text: a.note || "" }));
    if (a.ask && a.ask.length) {
      var n = a.ask.length, locals = a.ask.reduce(function (s, t) { return s + relLocalsOf(t); }, 0);
      var box = el("div", { cls: "exh-rel-confirm", role: "group", "aria-labelledby": "exh-rel-ask-h" });
      box.appendChild(el("p", { id: "exh-rel-ask-h", tabindex: "-1", role: "status", "aria-live": "polite", cls: "exh-strong exh-small",
        text: fmt(n) + (n === 1 ? " title, " : " titles, ") + fmt(locals) + " local title" + (locals === 1 ? "" : "s") + ", will fold into " + a.target + "." }));
      box.appendChild(el("ul", { cls: "exh-small exh-rel-asklist" }, a.ask.map(function (t) {
        var k = relLocalsOf(t);
        return el("li", { text: t + ", " + fmt(k) + " local title" + (k === 1 ? "" : "s") + ": folds into " + a.target + "; its name stays a search alias." });
      })));
      box.appendChild(el("p", { cls: "exh-muted exh-small", text: "The daily dry run pairs them and a reviewed rename apply merges the records. "
        + "Nothing a college or a student sees changes until then." }));
      box.appendChild(el("div", { cls: "exh-acts" }, [
        word(a.busy ? "Saving…" : "Save", function () { if (!a.busy) relSave(a); }, a.busy ? { disabled: "disabled", id: "exh-rel-save" } : { id: "exh-rel-save" }),
        word("Cancel", function () { a.ask = null; a.note = "Nothing was saved."; render(); relFocus(a.ok ? "exh-rel-go" : "exh-rel-note"); }, { id: "exh-rel-cancel" })]));
      bar.appendChild(box);
    }
    return bar;
  }
  /* Save: the reviewer signed in, the rows read again, then the rename batch's fold rows for each title. */
  function relSave(a) {
    var titles = a.ask.slice(), target = a.target;
    a.busy = true; render(); relFocus("exh-rel-ask-h");
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return relLiveLoad(titles.concat([target]).sort()).then(function (live) {
        var why = relTargetWhyNot(target, a, live);
        if (why) throw new Error("held:" + why);
        titles.forEach(function (t) { var w = relWhyNot(t, a, live); if (w) throw new Error("held:" + t + ": " + w); });
        var plan = { renames: titles.map(function (t) { return { r: { current: t }, to: target, merge: true }; }), skips: [] };
        return postRows(sess, renameRows(sess.email, plan));
      });
    }).then(function () {
      var writes = [[FIELD_CRED_TITLE, target], [FIELD_MERGE_CONFIRM, target]];
      titles.forEach(function (t) {
        state.rel.folded[t] = target;
        delete a.checked[t];
        if (a.live) { a.live.override[t] = target; a.live.merge[t] = target; }
        listApply({ ut: t }, writes);
      });
      a.busy = false; a.ask = null;
      a.note = "Saved: " + fmt(titles.length) + (titles.length === 1 ? " title folds" : " titles fold") + " into " + target
        + ". The daily dry run pairs them and a reviewed rename apply merges the records; each old title stays a search alias. They are in the List's Changed this visit.";
      render(); relFocus("exh-rel-note");
    }).catch(function (e) {
      var m = String(e && e.message || e);
      a.busy = false; a.ask = null;
      a.note = m === "signin" ? "Sign in as a reviewer to save. Nothing was saved."
        : m.indexOf("held:") === 0 ? "Nothing was saved: " + m.slice(5) + " The panel shows the rows as they stand now."
        : "The save did not reach the reference (" + m + "). Nothing changed; try again.";
      if (m.indexOf("held:") === 0) { a.liveKey = ""; }
      render(); relFocus("exh-rel-note");
    });
  }

  /* The rename batch. */
  function renameBatches() { return (state.rel.data && state.rel.data.batches) || []; }
  function renameOpen(b) { return (b.rows || []).filter(function (r) { return !state.rb.done[r.current]; }); }
  function renameCount() { return renameBatches().reduce(function (n, b) { return n + renameOpen(b).length; }, 0); }
  function renameTitle(r) { var d = state.rb.drafts[r.current]; return (d != null ? d : r.proposed || "").replace(/\s+/g, " ").trim(); }
  function renameSkipped(r) { var s = state.rb.skip[r.current]; return s != null ? s : false; }
  /* A row is renamed when it has a title to take and is not skipped; a row with no title is left as it is. */
  function renamePlan(b) {
    var open = renameOpen(b), renames = [], skips = [], left = [];
    open.forEach(function (r) {
      var t = renameTitle(r);
      if (renameSkipped(r)) { if (r.proposed) skips.push(r); else left.push(r); }
      else if (t && t !== r.current) renames.push({ r: r, to: t });
      else left.push(r);
    });
    // Two titles that take one name: the certification's own issuer leads, then the most local titles; the rest
    // fold into it on a confirmed merge. A name already in the reference is a merge for every row.
    var groups = {};
    renames.forEach(function (x) { (groups[x.to] = groups[x.to] || []).push(x); });
    Object.keys(groups).forEach(function (to) {
      var have = state.rel.by[to], exists = !!(have && !have.proposed);
      groups[to].sort(function (a, c) {
        return (a.r.issuer !== b.issuer) - (c.r.issuer !== b.issuer) || c.r.locals - a.r.locals || a.r.current.localeCompare(c.r.current);
      }).forEach(function (x, k) { x.merge = exists || k > 0; });
    });
    return { renames: renames, skips: skips, left: left };
  }
  function renameRows(email, plan, at) {
    var rows = [], t0 = at ? new Date(at) : new Date();
    var lead = t0.toISOString(), rest = new Date(t0.getTime() + 1000).toISOString();
    plan.renames.forEach(function (x) {
      var id = CRED_PREFIX + x.r.current, when = x.merge ? rest : lead;
      rows.push({ course_id: id, field: FIELD_CRED_TITLE, value: x.to, reviewer_email: email, reviewed_at: when });
      // The title that leads is saved first, so the dry run renames it and folds the others into it.
      if (x.merge) rows.push({ course_id: id, field: FIELD_MERGE_CONFIRM, value: x.to, reviewer_email: email, reviewed_at: when });
    });
    plan.skips.forEach(function (r) {
      rows.push({ course_id: CRED_PREFIX + r.current, field: FIELD_RENAME_KEPT, value: r.proposed, reviewer_email: email, reviewed_at: lead });
    });
    return rows;
  }
  function approveRename(b) {
    var plan = renamePlan(b);
    if (!plan.renames.length && !plan.skips.length) { state.note = "Nothing to save: every row is left as it is."; state.rb.ask = false; render(); return Promise.resolve(); }
    state.rb.busy = true; render();
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return postRows(sess, renameRows(sess.email, plan));
    }).then(function () {
      plan.renames.forEach(function (x) { state.rb.done[x.r.current] = "renamed"; });
      plan.skips.forEach(function (r) { state.rb.done[r.current] = "skipped"; });
      state.rb.busy = false; state.rb.ask = false;
      state.note = "Saved " + fmt(plan.renames.length) + " rename" + (plan.renames.length === 1 ? "" : "s")
        + (plan.skips.length ? " and " + fmt(plan.skips.length) + " skipped" : "") + ". The daily dry run reads them and the rename apply moves "
        + "the reference; each old title stays a search alias. Nothing a college or a student sees has changed yet.";
      render();
    }).catch(function (e) { state.rb.busy = false; failed(e); render(); });
  }
  /* A row decided since the file was built (an override or a skip saved on kb_curation) has left the batch. */
  function reconcileRename(d) {
    var key = anonKey(), since = d && d.generated_at, ids = [], byId = {};
    ((d && d.batches) || []).forEach(function (b) { (b.rows || []).forEach(function (r) { byId[CRED_PREFIX + r.current] = r; }); });
    ids = Object.keys(byId);
    if (!key || !since || !ids.length) return Promise.resolve();
    var quoted = ids.map(function (i) { return encodeURIComponent('"' + i.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'); });
    var url = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,reviewed_at"
      + "&field=in.(" + [FIELD_CRED_TITLE, FIELD_RENAME_KEPT].join(",") + ")"
      + "&reviewed_at=gt." + encodeURIComponent(since) + "&course_id=in.(" + quoted.join(",") + ")";
    return fetch(url, { headers: { "apikey": key, "Range-Unit": "items", "Range": "0-999" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (rows) {
        (rows || []).forEach(function (row) {
          var r = byId[row.course_id];
          if (!r || !row.value) return;
          if (row.field === FIELD_CRED_TITLE && row.value !== r.current) state.rb.done[r.current] = "renamed";
          if (row.field === FIELD_RENAME_KEPT && row.value === r.proposed) state.rb.done[r.current] = "skipped";
        });
      })
      .catch(function () { /* the file's rows stand */ });
  }
  /* Students who hold credit under each title in the batch: an allowed reviewer only, k=10 in the database. */
  function loadRenameStudents() {
    var keys = [], ids = [];
    renameBatches().forEach(function (b) {
      (b.rows || []).forEach(function (r) { (r.ids || []).forEach(function (id) { keys.push(r.current); ids.push(id); }); });
    });
    return session().then(function (sess) {
      if (!sess) { state.rb.students = null; state.rb.studentsWord = "signin"; return; }
      if (!ids.length) { state.rb.students = {}; state.rb.studentsWord = "ok"; return; }
      return fetch(SUPABASE_URL + "/rest/v1/rpc/exhibit_title_students", {
        method: "POST", headers: headers(sess), body: JSON.stringify({ p_keys: keys, p_ids: ids })
      }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (rows) {
          if (!rows.length) { state.rb.students = null; state.rb.studentsWord = "refused"; return; }
          var by = {};
          rows.forEach(function (row) { by[row.key] = { students: row.students, suppressed: !!row.suppressed }; });
          state.rb.students = by; state.rb.studentsWord = "ok";
        });
    }).catch(function () { state.rb.students = null; state.rb.studentsWord = "error"; });
  }
  function renameStudents(r) {
    var w = state.rb.studentsWord;
    if (w !== "ok") return w === "signin" ? "Reviewers only" : w === "refused" ? "Reviewers only" : w === "error" ? "Not read" : "Reading";
    var s = state.rb.students[r.current];
    return !s ? "None" : s.suppressed ? "Fewer than 10" : s.students ? fmt(s.students) : "None";
  }
  function renameTile() {
    var n = renameCount(), have = !!state.rel.data;
    var b = el("button", {
      type: "button", cls: "exh-step", "aria-pressed": state.filter === RENAME ? "true" : "false",
      "data-tip": TIPS[RENAME], "aria-label": RENAME + ", " + (have ? fmt(n) : "not built yet") + ". " + TIPS[RENAME]
    }, [el("span", { cls: "exh-sn", text: have ? fmt(n) : "–" }), el("span", { cls: "exh-sl", text: RENAME })]);
    if (!have) b.disabled = true;
    else b.addEventListener("click", function () { state.filter = RENAME; state.note = ""; state.rb.ask = false; render(); loadRenameStudents().then(render); });
    return b;
  }
  function renameCard(b) {
    var open = renameOpen(b), plan = renamePlan(b), rule = (state.rel.data && state.rel.data.rule) || {};
    var box = el("section", { cls: "exh-card exh-rb", "aria-labelledby": "exh-rb-h-" + b.id });
    box.appendChild(el("h3", { cls: "exh-q", id: "exh-rb-h-" + b.id, text: b.label + " titles to rename (" + fmt(open.length) + ")" }));
    box.appendChild(el("p", { cls: "exh-small" }, ["Titles in the reference that do not read ", el("b", { text: b.format }), ". ",
      rule.words ? el("span", { cls: "exh-muted", text: (rule.set_by || "Sam") + ", " + (rule.date || "") + ": “" + rule.words + "”" }) : null]));
    box.appendChild(el("p", { cls: "exh-small exh-muted", text: "Nothing is renamed until you approve. Edit a proposed title, or skip a row, before you do. "
      + "An approved title keeps its old name as a search alias, and its local titles, colleges and students move with it. "
      + "A row with no proposed title names more than one test or no test; it stays as it is unless you write a title. "
      + "A title that folds into another keeps each local exhibit's own path and assessor, shown under it." }));
    if (!open.length) { box.appendChild(el("p", { cls: "exh-empty", text: "Every title in this batch is decided." })); return box; }
    var cols = el("colgroup", null, [["26%"], ["34%"], ["8%"], ["9%"], ["9%"], ["14%"]].map(function (w) { var c = el("col"); c.style.width = w[0]; return c; }));
    var head = el("thead", null, [el("tr", null, ["Current title", "Proposed title", "Local titles", "Colleges", "Students", "Decision"].map(function (h) {
      return el("th", { scope: "col", text: h });
    }))]);
    var tb = el("tbody");
    open.forEach(function (r, i) {
      var inp = el("input", { type: "text", cls: "exh-rb-in", id: "exh-rb-" + b.id + "-" + i, autocomplete: "off",
        "aria-label": "Proposed title for " + r.current, placeholder: "No single certification name" });
      inp.value = state.rb.drafts[r.current] != null ? state.rb.drafts[r.current] : r.proposed || "";
      var skipped = renameSkipped(r);
      var fate = el("span", { cls: "exh-small" });
      function say() {
        var t = renameTitle(r), x = null;
        plan = renamePlan(b);
        plan.renames.forEach(function (p) { if (p.r === r) x = p; });
        fate.textContent = renameSkipped(r) ? (r.proposed ? "Skipped: keeps its title" : "Left as it is")
          : !t || t === r.current ? "Left as it is" : x && x.merge ? "Renamed, and folded into the title of that name" : "Renamed";
      }
      inp.addEventListener("input", function () { state.rb.drafts[r.current] = inp.value; say(); count(); });
      if (skipped) inp.disabled = true;
      say();
      tb.appendChild(el("tr", skipped ? { cls: "exh-rb-skip" } : null, [
        el("th", { scope: "row" }, [el("span", { cls: "exh-rb-cur", text: r.current }),
          el("span", { cls: "exh-muted exh-small", text: r.kind_label + (r.why ? ": " + r.why : "") + (r.issuer ? " · " + r.issuer : "") }),
          pathsNode(r.paths, r.issuer)]),
        el("td", null, [inp]),
        el("td", { text: fmt(r.locals) }),
        el("td", { text: r.adopted ? fmt(r.adopted) + " articulate it" : "None yet" }),
        el("td", { text: renameStudents(r) }),
        el("td", null, [fate, " ", word(skipped ? "Include" : "Skip", function () { state.rb.skip[r.current] = !skipped; state.rb.ask = false; render(); },
          { cls: "exh-w exh-small", "aria-label": (skipped ? "Include " : "Skip ") + r.current })])]));
    });
    box.appendChild(el("div", { cls: "exh-rb-scroll", role: "region", tabindex: "0", "aria-label": b.label + " titles to rename" }, [
      el("table", { cls: "exh-rb-table" }, [cols, head, tb])]));
    var acts = el("div", { cls: "exh-acts" });
    var go = word("", function () { state.rb.ask = true; render(); });
    function count() {
      plan = renamePlan(b);
      go.textContent = "Approve the batch (" + fmt(plan.renames.length) + " rename" + (plan.renames.length === 1 ? "" : "s") + ")";
    }
    count();
    if (!state.rb.ask) acts.appendChild(go);
    else {
      box.appendChild(el("p", { cls: "exh-small", role: "status" }, ["Save " + fmt(plan.renames.length) + " rename" + (plan.renames.length === 1 ? "" : "s")
        + (plan.skips.length ? ", and " + fmt(plan.skips.length) + " skipped so they do not come back" : "") + "? "
        + fmt(plan.renames.filter(function (x) { return x.merge; }).length) + " fold into another title of the same name. "
        + fmt(plan.left.length) + " stay as they are, still in this batch."]));
      acts.appendChild(word(state.rb.busy ? "Saving…" : "Save the batch", function () { if (!state.rb.busy) approveRename(b); }, state.rb.busy ? { disabled: "disabled" } : null));
      acts.appendChild(word("Cancel", function () { state.rb.ask = false; render(); }));
    }
    box.appendChild(acts);
    return box;
  }
  function renderRename(wrap) {
    var d = state.rel.data, bs = renameBatches();
    wrap.appendChild(el("p", { cls: "exh-muted exh-small", text: "Built " + stamp(d.generated_at) + " from every title in the reference. "
      + "One batch a certification issuer." + ((d.waiting || []).length ? " Waiting until this one is decided: " + d.waiting.join(", ") + "." : "") }));
    wrap.appendChild(el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: state.note || "" }));
    if (state.rb.studentsWord === "signin" && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
      var mount = el("div", { cls: "exh-signin" });
      wrap.appendChild(mount);
      window.CPL_REVIEWER_SIGNIN.mountInto(mount, { title: "Sign in to approve",
        blurb: "A reviewer's sign-in saves the batch and shows the students on each title.", returnTab: "exhibits" });
    }
    familyExceptionCards().forEach(function (c) { wrap.appendChild(c); });
    if (!bs.length) { wrap.appendChild(el("p", { cls: "exh-empty", text: "No rename batch is built." })); return; }
    bs.forEach(function (b) { wrap.appendChild(renameCard(b)); });
  }
  /* A family's members whose mix the parser cannot code fully, one list for a person to code (Sam's "family as a field",
     as COBIx relayed it on #3110): an "or", or a part ASE does not award, which joins the bundle "with" its ASE tests.
     Each carries the family all the same; the list only asks a person to say what the mix is. */
  function familyExceptionCards() {
    var fams = (state.rel.data && state.rel.data.families) || {}, out = [];
    Object.keys(fams).forEach(function (name, i) {
      var ex = fams[name].exceptions || [];
      if (!ex.length) return;
      var box = el("section", { cls: "exh-card exh-rb exh-famx", "aria-labelledby": "exh-famx-h-" + i });
      box.appendChild(el("h3", { cls: "exh-q", id: "exh-famx-h-" + i, text: name + ": titles to code by hand (" + fmt(ex.length) + ")" }));
      box.appendChild(el("p", { cls: "exh-small exh-muted", text: "Each title carries the family. The parser could not code its tests fully: "
        + "the mix holds an “or”, or a part that is not an ASE test. A part that is not an ASE test joins the bundle with its ASE tests. "
        + "Say what each mix is; its proposed title waits in the batch below." }));
      var cols = el("colgroup", null, ["40%", "24%", "18%", "18%"].map(function (w) { var c = el("col"); c.style.width = w; return c; }));
      var head = el("thead", null, [el("tr", null, ["Title", "Its mix as written", "ASE tests", "With"].map(function (h) {
        return el("th", { scope: "col", text: h }); }))]);
      var tb = el("tbody");
      ex.forEach(function (e) {
        tb.appendChild(el("tr", null, [el("th", { scope: "row", text: e.title }), el("td", { text: e.mix }),
          el("td", { text: (e.tests || []).join(", ") || "None" }), el("td", { text: (e.with || []).join(", ") || "Nothing else" })]));
      });
      box.appendChild(el("div", { cls: "exh-rb-scroll", role: "region", tabindex: "0", "aria-label": name + " titles to code by hand" }, [
        el("table", { cls: "exh-rb-table" }, [cols, head, tb])]));
      out.push(box);
    });
    return out;
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
    if (list.length > 1 && !state.sw.batchMode) {
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
    return withRelated(box, { key: "s:" + c.id, title: title, issuer: iss, issuer0: c.issuer, raw: (c.locals[0] || {}).raw || "", skip: [c.current],
      use: function (r) {
        title.value = r.t; state.sw.drafts[c.id] = r.t;
        if (r.issuer) { iss.value = r.issuer; state.sw.issuers[c.id] = r.issuer; }
        swShowAse();
        title.focus();
      } });
  }
  function renderBatch(wrap) {
    var list = sweepShown(), size = state.sw.batch ? state.sw.batch.length : 0, decided = size - list.length;
    wrap.appendChild(el("nav", { cls: "exh-trail exh-small", "aria-label": "Where you are" }, [
      el("a", { href: "#commons", text: "CPL Commons" }), " / ", el("a", { href: "#exhibits/another-look", text: "Another look" }), " / ",
      el("span", { "aria-current": "page", text: "Your next batch" })]));
    if (state.sw.cur >= list.length) state.sw.cur = Math.max(0, list.length - 1);
    wrap.appendChild(el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: state.note || "" }));
    if (!list.length) {
      wrap.appendChild(el("section", { cls: "exh-card exh-batch-done", "aria-label": "The batch is done" }, [
        el("h3", { cls: "exh-q", text: size ? "This batch is done" : "Nothing waits for another look" }),
        el("p", { text: size ? "You decided " + fmt(decided) + " of " + fmt(size) + ". Each choice is saved with your name and the time, "
          + "and the nightly sweep reads it. Stop here." : "Every card the sweep built has been decided." }),
        el("div", { cls: "exh-acts" }, [el("a", { href: "#commons", text: "Back to the Commons" }),
          state.sw.history.length ? word("Back", swBack, { "aria-label": "Back to the last card" }) : null].filter(Boolean))]));
      return;
    }
    wrap.appendChild(el("p", { cls: "exh-small exh-batch-pos" }, ["Card " + fmt(decided + 1) + " of " + fmt(size) + " in this batch. ",
      el("span", { cls: "exh-muted", text: "Keep what works, change what does not, or skip it for now. The batch stops when its cards are decided." })]));
    wrap.appendChild(sweepCard(list[state.sw.cur], list));
  }
  function shortListNames(names) {
    var s = (names || []).map(shortName).filter(Boolean);
    return s.length > 3 ? s.slice(0, 3).join(", ") + " and " + (s.length - 3) + " more" : s.join(", ");
  }
  function renderSweep(wrap) {
    var d = state.sw.data;
    if (state.sw.batchMode) return renderBatch(wrap);
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
  /* ── Course details (Sam, 2026-11-12: "need to see the course details for abt 133 so i can decide what the best
     title should be. i suspect the ag and business tech title is just their area title and not the course title ...
     add a link to course details that opens in sidebar view") ──
     The courses come from files COBI already serves: the exhibit's credit recommendations (course and credit) from
     statewide_data.js (Exhibit Adoption's file), each course's title, units, TOP and M-ID from
     unified_courses_members.js, and its catalog description from the COCI Lookup's shard. Read once, on the first
     press. The panel takes Related titles' place beside the card; Close or Escape gives it back. */
  function cdNorm(code) { return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function cdName(n) { return String(n || "").trim().toLowerCase(); }
  function loadCourseDetails() {
    var cd = state.cd;
    if (cd.ready) return Promise.resolve();
    if (cd.loading) return cd.loading;
    cd.loading = new Promise(function (resolve) {
      var T = window.CPL_TABS;
      if (!T || typeof T.loadScript !== "function") { resolve(); return; }
      T.loadScript("statewide_data.js", "CPL_STATEWIDE", function () {
        T.loadScript("unified_courses_members.js", "CPL_UC_MEMBERS", resolve);
      });
    }).then(function () {
      var S = window.CPL_STATEWIDE, M = window.CPL_UC_MEMBERS;
      var byId = {}, byCourse = {};
      ((S && S.exhibits) || []).forEach(function (e) { (e.exhibit_ids || [e.exhibit_id]).forEach(function (id) { if (id) byId[id] = e; }); });
      if (M && M.members) {
        var names = (M.colleges || []).map(cdName);
        Object.keys(M.members).forEach(function (mid) {
          (M.members[mid] || []).forEach(function (m) {
            if (!m || !m.n) return;
            var k = names[m.c] + "|" + cdNorm(m.n);
            var have = byCourse[k] || (byCourse[k] = { n: m.n, t: m.t, u: m.u, p: m.p, cn: m.cn, mids: [] });
            if (have.mids.indexOf(mid) < 0) have.mids.push(mid);
          });
        });
      }
      cd.byId = byId; cd.byCourse = byCourse; cd.topmap = (M && M.topmap) || {};
      cd.err = !S ? "the exhibit file (statewide_data.js) did not load" : !M ? "the course file (unified_courses_members.js) did not load" : "";
      cd.ready = true; cd.loading = null;
    });
    return cd.loading;
  }
  /* The courses behind a card's exhibits: [{ college, code, credit, course|null }]. */
  function courseDetailsFor(h) {
    var cd = state.cd, out = [], seen = {};
    var artNames = (h.art || []).map(college);
    (h.ids || []).forEach(function (id) {
      var e = cd.byId[id];
      if (!e) return;
      var recs = e.credit_recs || [], idx = e.adopter_rec_idx || {};
      var who = Object.keys(idx).length ? Object.keys(idx) : (e.adopter_names && e.adopter_names.length ? e.adopter_names : artNames);
      who.forEach(function (name) {
        var mine = idx[name] ? idx[name].map(function (i) { return recs[i]; }) : recs;
        mine.forEach(function (r) {
          if (!r || !r.course) return;
          var key = cdName(name) + "|" + cdNorm(r.course);
          if (seen[key]) return;
          seen[key] = 1;
          out.push({ college: name, code: r.course, credit: r.credit || "", id: id, course: cd.byCourse[key] || null });
        });
      });
    });
    return out;
  }
  function closeCourseDetails() {
    state.cd.open = null;
    render();
    var b = document.getElementById("exh-cd-btn");
    if (b) b.focus();
  }
  function openCourseDetails(h) {
    state.cd.open = h.raw;
    render();
    var p = document.getElementById("exh-cd-h");
    if (p) p.focus();
    if (!state.cd.ready) loadCourseDetails().then(function () {
      if (state.cd.open !== h.raw) return;
      render();
      var q = document.getElementById("exh-cd-h");
      if (q) q.focus();
    });
  }
  function courseDetailsPanel(h) {
    var cd = state.cd;
    var box = el("aside", { cls: "exh-rel exh-cd", id: "exh-cd", "aria-label": "Course details" });
    box.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closeCourseDetails(); } });
    box.appendChild(el("div", { cls: "exh-cd-head" }, [
      el("h4", { cls: "exh-q exh-small", id: "exh-cd-h", tabindex: "-1", text: "Course details" }),
      word("Close", closeCourseDetails, { cls: "exh-w exh-small", "aria-label": "Close course details and show Related titles" })]));
    var body = el("div", { cls: "exh-rel-body" });
    box.appendChild(body);
    if (!cd.ready) { body.appendChild(el("p", { cls: "exh-muted exh-small", role: "status", text: "Reading the courses…" })); return box; }
    if (cd.err) body.appendChild(el("p", { cls: "exh-muted exh-small", text: "Part of the course data could not be read: " + cd.err + "." }));
    var rows = courseDetailsFor(h);
    if (!rows.length) {
      var at = shortList((h.art || []).map(college).filter(Boolean));
      body.appendChild(el("p", { cls: "exh-empty exh-small", text: "No course is on file for this exhibit" + (at ? " at " + at : "")
        + " in the data COBI reads. Open it in MAP to see its courses." }));
    }
    rows.forEach(function (r) {
      var c = r.course;
      var sec = el("section", { cls: "exh-cd-course", "aria-label": r.code + " at " + r.college });
      sec.appendChild(el("p", { cls: "exh-muted exh-small", text: r.college + " · " + r.code }));
      if (c) {
        sec.appendChild(el("b", { cls: "exh-rel-t exh-cd-title", text: (c.t || "").trim() || "No title on file" }));
        var facts = el("dl", { cls: "exh-cd-facts exh-small" });
        function fact(k, v) { if (v) { facts.appendChild(el("dt", { text: k })); facts.appendChild(el("dd", { text: v })); } }
        fact("Units", c.u ? String(c.u) : "Noncredit");
        fact("TOP", c.p ? c.p + (cd.topmap[c.p] ? ", " + cd.topmap[c.p] : "") : "");
        fact("M-ID", c.mids.join(", "));
        fact("Control number", c.cn || "");
        fact("Credit recommendation", r.credit);
        sec.appendChild(facts);
        var desc = el("p", { cls: "exh-small exh-cd-desc" });
        sec.appendChild(desc);
        if (c.cn) {
          var key = /^[A-Za-z]/.test(c.n) ? c.n.charAt(0).toUpperCase() : "0";
          var put = function () { var d = window.CPL_COCI_DESC && window.CPL_COCI_DESC[key]; desc.textContent = d && d[c.cn] ? d[c.cn] : (d ? "No catalog description on file." : ""); };
          if (window.CPL_COCI_DESC && window.CPL_COCI_DESC[key]) put();
          else if (window.CPL_TABS && typeof window.CPL_TABS.loadScript === "function") {
            desc.textContent = "Reading the catalog description…";
            window.CPL_TABS.loadScript("coci_lookup_desc_" + key + ".js", null, put);
          }
        }
      } else {
        sec.appendChild(el("p", { cls: "exh-small", text: "This course is not in the course data COBI reads (unified_courses_members.js)." }));
        if (r.credit) sec.appendChild(el("p", { cls: "exh-small", text: "Credit recommendation: " + r.credit }));
      }
      sec.appendChild(el("p", { cls: "exh-small" }, [el("a", { href: mapUrl(r.id), target: "_blank", rel: "noopener", text: r.id + " in MAP" })]));
      body.appendChild(sec);
    });
    if (!rows.length && h.ids && h.ids.length) {
      body.appendChild(el("p", { cls: "exh-small" }, [el("a", { href: mapUrl(h.ids[0]), target: "_blank", rel: "noopener", text: h.ids[0] + " in MAP" })]));
    }
    return box;
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
    // The List's side panel sets training sites; a title new to the reference gets them once the nightly run adds it.
    canon.appendChild(el("div", { cls: "exh-inbox exh-read" }, [el("span", { cls: "exh-pre", text: "Training site:" }),
      el("span", { cls: "exh-grow", text: sites || "None named" }),
      h.exists ? word("Set them in the List", function () { openCredential(h.title); }, { cls: "exh-w exh-small" })
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
    // The statewide exhibit or the most used title among the related ones (Sam, 2026-11-12), in words; Use it does
    // what the panel's Use this title does. Follows the title as it is edited.
    var align = el("p", { cls: "exh-small exh-align" });
    function drawAlign() {
      while (align.firstChild) align.removeChild(align.firstChild);
      var iss = issuer.value.trim() || h.issuer;
      var a = state.rel.data ? relAligned(relatedFor(title.value.trim(), h.raw, iss, []), title.value, iss) : null;
      align.hidden = !a;
      if (!a) return;
      align.appendChild(document.createTextNode(relAlignWords(a)));
      if (a.kind === "self") return;
      align.appendChild(word("Use it", function () { useRow(a.o); title.dispatchEvent(new Event("input")); },
        { cls: "exh-w exh-small", "aria-label": "Use it: " + a.o.t }));
    }
    title.addEventListener("input", drawAlign);
    drawAlign();
    canon.appendChild(align);
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
      var cdOpen = state.cd.open === h.raw;
      src.appendChild(document.createTextNode(" · "));
      var cdBtn = word("Course details", function () { if (state.cd.open === h.raw) closeCourseDetails(); else openCourseDetails(h); },
        { cls: "exh-w exh-small", id: "exh-cd-btn", "aria-expanded": cdOpen ? "true" : "false", "aria-controls": cdOpen ? "exh-cd" : null });
      cdBtn.addEventListener("keydown", function (e) { if (e.key === "Escape" && state.cd.open === h.raw) { e.preventDefault(); closeCourseDetails(); } });
      src.appendChild(cdBtn);
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
    if (state.cd.open === h.raw) return el("div", { cls: "exh-with-rel" }, [c, courseDetailsPanel(h)]);
    return withRelated(c, { key: "r:" + h.raw, title: title, issuer: issuer, issuer0: h.issuer, raw: h.raw, skip: [], actions: true,
      use: function (r) { useRow(r); drawAlign(); } });
    function useRow(r) {
      title.value = r.t;
      // The title's own issuer comes with it, as if picked.
      if (r.issuer) { issuer.value = r.issuer; issuerTyped = true; }
      keepDraft(); showAse(); exists.hidden = true;
      state.note = "";
      title.focus();
    }
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

  /* ── The credential's issuer and training sites (the side panel's editor) ── */
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

  function loadCertLinks() {
    return fetch(CERT_LINKS_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { state.cs.certLinks = d && d.links ? d : null; }, function () { state.cs.certLinks = null; });
  }
  function loadCredentials() {
    var cs = state.cs;
    if (cs.rows) return Promise.resolve();
    if (cs.loading) return cs.loading;
    cs.loading = new Promise(function (resolve) {
      var T = window.CPL_TABS;
      if (window.CPL_CREDENTIAL_REFERENCE || !T || typeof T.loadScript !== "function") { resolve(); return; }
      T.loadScript(CRED_DATA, "CPL_CREDENTIAL_REFERENCE", function () {
        if (window.CPL_STATEWIDE_RECS) { resolve(); return; }
        T.loadScript(STATEWIDE_RECS, "CPL_STATEWIDE_RECS", resolve);
      });
    }).then(function () {
      var d = window.CPL_CREDENTIAL_REFERENCE;
      if (!d || !Array.isArray(d.unified_titles)) { cs.error = "the credential file did not load"; return; }
      var rows = d.unified_titles.slice();
      rows.sort(function (a, b) {
        return credStudents(b).n - credStudents(a).n || credColleges(b).length - credColleges(a).length
          || credName(a).toLowerCase().localeCompare(credName(b).toLowerCase());
      });
      cs.rows = rows; cs.generated = d._generated_at; cs.error = null;
      return Promise.all([loadCredOverlay(), loadAdoption(), loadLinks(), loadCertLinks()]);
    }).then(function () { cs.loading = null; });
    return cs.loading;
  }
  /* A credential fold's issuer resolution (#3116): the issuer row resolves through issuer_resolution.js, the one
     browser port of kb/fold_issuer.py effective_issuer(). A struck issuer leaves o.issuer unset, so the reference's
     own (folded) issuer shows; the fold's winner shows as the issuer; o.fold drives the editor's plain line. */
  function resolveFoldIssuers(m) {
    var R = (typeof window !== "undefined" && window.CPL_ISSUER_RESOLUTION) || null;
    if (!R) return m;
    Object.keys(m).forEach(function (t) {
      var o = m[t], res = R.parse(o.resolution);
      if (!res) return;
      var got = R.resolve({ issuing_agency_override: { value: o.issuer || "", at: o.issuerAt || "" } }, res);
      if (got.issuer) o.issuer = got.issuer; else delete o.issuer;
      o.fold = got.fold;
    });
    return m;
  }
  /* The editor's plain lines under the issuer: "Set by the fold on <date>", then each stored row it superseded. */
  function foldLines(o) {
    var R = (typeof window !== "undefined" && window.CPL_ISSUER_RESOLUTION) || null;
    if (!R || !o || !o.fold) return [];
    var out = [], line = R.foldLine(o.fold);
    if (line) out.push(line);
    (o.fold.superseded || []).forEach(function (s) {
      if (s.field === "issuing_agency_override")
        out.push("Superseded: " + s.value + (s.at ? ", saved " + String(s.at).slice(0, 10) : ""));
    });
    return out;
  }
  /* The live _CREDENTIAL_REVIEW:: rows for the three fields, paginated (PostgREST caps a response at 1,000). */
  function loadCredOverlay() {
    var PAGE = 1000, key = anonKey();
    var url = SUPABASE_URL + "/rest/v1/kb_curation?select=course_id,field,value,reviewed_at"
      + "&course_id=like." + encodeURIComponent(CRED_PREFIX) + "%25"
      + "&field=in.(" + [FIELD_CRED_ISSUER, FIELD_CRED_TRAINER, FIELD_CRED_SITES, FIELD_CRED_TITLE, FIELD_LIST_FLAG, FIELD_LIST_GROUP, FIELD_MERGE_CONFIRM, FIELD_FOLD_RESOLUTION, FIELD_CRED_SUBJ, FIELD_CRED_FAMILY].join(",") + ")"
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
        if (row.field === FIELD_CRED_ISSUER) { o.issuer = row.value || ""; o.issuerAt = row.reviewed_at || ""; }
        else if (row.field === FIELD_FOLD_RESOLUTION) o.resolution = row.value || "";
        else if (row.field === FIELD_CRED_TRAINER) { o.trainer = row.value; o.trainerAt = row.reviewed_at || ""; }
        else if (row.field === FIELD_CRED_SITES) { o.sites = row.value || ""; o.sitesAt = row.reviewed_at || ""; }
        else if (row.field === FIELD_CRED_TITLE) o.title = row.value || "";
        else if (row.field === FIELD_LIST_FLAG) o.flag = row.value || "";
        else if (row.field === FIELD_LIST_GROUP) o.group = row.value || "";
        else if (row.field === FIELD_MERGE_CONFIRM) o.merge = row.value || "";
        else if (row.field === FIELD_CRED_SUBJ) o.subj = row.value || "";
        else if (row.field === FIELD_CRED_FAMILY) o.family = row.value || "";
      });
      resolveFoldIssuers(m);
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
      // reviewed_at: a save is a new decision with its own stamp, so an issuer saved after a fold decided wins
      // over the fold (issuer_resolution.js); an upsert that kept the old stamp would hide it.
      body: JSON.stringify({ course_id: CRED_PREFIX + ut, field: field, value: value, reviewer_email: sess.email,
                             reviewed_at: new Date().toISOString() })
    });
  }
  /* Many credentials, one field, one request: [[title, value], ...], each an upsert on (course_id, field). */
  function saveCredRows(sess, field, pairs) {
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: headers(sess, { "Prefer": "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(pairs.map(function (p) { return { course_id: CRED_PREFIX + p[0], field: field, value: p[1], reviewer_email: sess.email, reviewed_at: new Date().toISOString() }; }))
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
  function credSave(r, ui) {
    var cs = state.cs, d = credDraft(r), cur = credCurrent(r);
    ui = ui || credUi(r.ut);
    var issuer = d.issuer.replace(/\s+/g, " ").trim();
    var sites = parseSites(JSON.stringify(d.sites)) || [];
    var writes = [];
    if (issuer !== (cur.issuer || "")) writes.push([FIELD_CRED_ISSUER, issuer]);
    if (JSON.stringify(sites) !== JSON.stringify(cur.sites)) {
      writes.push([FIELD_CRED_SITES, JSON.stringify(sites)]);
      writes.push([FIELD_CRED_TRAINER, joinSites(sites)]);
    }
    var again = ui.pf + "save";
    if (!writes.length) { ui.setNote("Nothing changed."); ui.redraw(again); return Promise.resolve(); }
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return Promise.all(writes.map(function (w) { return saveCredRow(sess, r.ut, w[0], w[1]); }));
    }).then(function (rs) {
      if (!rs.every(function (x) { return x.ok; })) throw new Error("HTTP " + rs.map(function (x) { return x.status; }).join("/"));
      var o = cs.overlay[r.ut] = cs.overlay[r.ut] || {};
      var now = new Date().toISOString();
      writes.forEach(function (w) {
        if (w[0] === FIELD_CRED_ISSUER) { o.issuer = w[1]; o.issuerAt = now; }
        else if (w[0] === FIELD_CRED_TRAINER) { o.trainer = w[1]; o.trainerAt = now; }
        else { o.sites = w[1]; o.sitesAt = now; }
      });
      var one = {}; one[r.ut] = o; resolveFoldIssuers(one);  // a newer row: the person's save wins
      delete cs.drafts[r.ut];
      ui.changed();
      ui.setNote("Saved. The tabs show it now; the daily run writes it into the reference.");
      ui.redraw(again);
    }).catch(function (e) {
      ui.setNote(e && e.message === "signin" ? "Sign in as a reviewer to save."
        : "The save did not reach the reference (" + (e && e.message || "no answer") + "). Nothing changed; try again.");
      ui.redraw(again);
    });
  }
  /* The Review card's way in: the credential a held title joins, in the List's side panel with its issuer and
     training sites open. A title not yet in the reference opens no panel; the List says so. */
  function openCredential(ut) {
    var L = listState();
    state.view = "list"; L.f = ""; L.limit = LIST_LIMIT; L.open = null; L.edit = null;
    L.panel = ut; (L.pnFold || (L.pnFold = {})).edit = true;
    render();
    return loadCredentials().then(function () {
      var inRef = (state.cs.rows || []).some(function (r) { return r.ut === ut; });
      if (!inRef) { L.panel = null; listCellNote("“" + ut + "” is not in the reference yet. The nightly run adds it."); }
      // Focus lands once the List draws, which waits for its engine on a first visit.
      state.listFocus = inRef ? "exh-l-panel-t" : "exh-l-find";
      render();
    });
  }

  /* ── The Commons' row, carried on the tiles above the List (the Credentials view's until it retired) ──
     Sam, 2026-11-01, comparing the Catalog Commons row for the Common Exhibit Reference with these tiles: "I like the
     tiles above the list and thinking you could integrate what's needed into existing tiles and create any others needed
     to capture everything from 1st into Exhibits view." So the row's headline pair, its tests and its known issues join
     What is it called?, and How is it kept? carries its settled procedures, the Decision Sheet Library and the last run.
     The tiles read what commons.js reads: kb/status/commons.json, its row keyed "exhibit", and the run log the row names
     (kb/status/exhibit.json). Nothing is copied by hand, so the two pages agree. A figure that could not be read says so,
     never a zero (the S343 rule). The List draws the same tiles above its table (the Catalog Commons List norms, norm 1:
     docs/kb-notes/reference-catalog-commons-list-norms.md). A count opens the List filtered to it where the List holds a
     filter for it (#exhibits/list/<filter>), else the Exhibits view holding its list (held titles open Review), else
     where the Commons sends it. */
  var COMMONS_URL = "kb/status/commons.json";
  var COMMONS_KEY = "exhibit";
  var RUNLOG_URL = "kb/status/exhibit.json";   /* read directly when the Commons file itself could not be */
  var DECIDER = "Sam";
  var MACHINE_SLACK = 1.5;                     /* commons.js: a machine stamp older than 1.5 cadences reads stale */
  var SESSION_STALE_HOURS = 7 * 24;            /* commons.js: a run log a week old reads stale */
  /* The Commons' procedures count opens the CER's list; here, the Rules view lists every procedure. */
  var COMMONS_EQUIV = { "#credential-reference/procs": "#exhibits/rules" };
  var ROUTE_WORDS = { held: "Review, every held title", conflict: "Review, Conflict with the reference", "another-look": "Review, Another look",
    credentials: "the List view", rules: "the Rules view", list: "the List view", progress: "the Progress view", queue: "the Queue view", requests: "the Requests view",
    "cpl-ai": "the CPL-AI recommendations view" };

  function commonsFresh() {
    return { row: null, at: null, error: null, Q: null, qErr: null, logFile: null, loading: null, done: false };
  }
  function errText(e) { return e && e.message ? e.message : String(e); }
  /* The Commons' read: a status file must name written_at (commons_progress.js readStatus). */
  function readStatusJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " answered " + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || typeof j !== "object" || !j.written_at) throw new Error(url + " names no written_at");
      return j;
    });
  }
  /* The Commons file through the List engine's one reader where the engine is loaded (the List norms: never a second
     reader), fresh for this read; the tab's own read before the engine arrives. Either way it must name written_at. */
  function readCommonsJson() {
    var CLM = window.CPL_COMMONS_LIST;
    if (!CLM || typeof CLM.readCommons !== "function") return readStatusJson(COMMONS_URL);
    return CLM.readCommons(true).then(function (j) {
      if (!j || !j.written_at) throw new Error(COMMONS_URL + " names no written_at");
      return j;
    });
  }
  function loadCommons() {
    var cm = state.cm = state.cm || commonsFresh();
    if (cm.done) return Promise.resolve();
    if (cm.loading) return cm.loading;
    cm.loading = readCommonsJson().then(function (d) {
      if (!Array.isArray(d.rows)) throw new Error(COMMONS_URL + " is not the Commons' status file");
      var row = d.rows.filter(function (r) { return r && r.key === COMMONS_KEY; })[0];
      if (!row) throw new Error(COMMONS_URL + " has no " + COMMONS_KEY + " row");
      cm.row = row; cm.at = d.written_at; cm.error = null;
      return row.status_file || null;
    }, function (e) {
      cm.row = null; cm.error = errText(e);
      return RUNLOG_URL;
    }).then(function (file) {
      cm.logFile = file;
      if (!file) return null;
      return readStatusJson(file).then(function (Q) { cm.Q = Q; }, function (e) { cm.qErr = errText(e); });
    }).then(function () { cm.done = true; cm.loading = null; });
    return cm.loading;
  }

  /* Ages and states, as commons.js reads them. */
  function cmDate(v) {
    if (!v) return null;
    var d = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(v + "T12:00:00Z") : new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  /* The Commons' stamp: "Oct 31, 12:32 PM PT" (commons_progress.js stampOf). */
  function cmStamp(v) {
    var d = cmDate(v);
    if (!d) return "";
    return d.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" }) + ", "
      + d.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }) + " PT";
  }
  function hoursSince(at, now) { var d = cmDate(at); return d ? (now.getTime() - d.getTime()) / 36e5 : null; }
  function cadenceWords(h) {
    if (h == null) return "on dispatch";
    if (h === 24) return "daily";
    if (h === 168) return "weekly";
    return "every " + fmt(h) + " hours";
  }
  function machineState(m, now) {
    if (!m || !m.at) return { key: "unread", word: "Could not be read" };
    var age = hoursSince(m.at, now);
    if (age == null) return { key: "unread", word: "Could not be read" };
    if (m.every_hours == null) return { key: "neutral", word: "on dispatch" };
    return age <= m.every_hours * MACHINE_SLACK ? { key: "ok", word: "current" } : { key: "stale", word: "stale" };
  }
  function sessionState(Q, err, now) {
    if (err) return { key: "unread", word: "Could not be read" };
    if (!Q) return { key: "neutral", word: "no run log" };
    var age = hoursSince(Q.written_at, now);
    if (age == null) return { key: "unread", word: "Could not be read" };
    return age <= SESSION_STALE_HOURS ? { key: "ok", word: "current" } : { key: "stale", word: "stale" };
  }
  function stateWord(s) {
    return el("span", { cls: s.key === "stale" || s.key === "unread" ? "exh-cm-warn" : null, text: s.word });
  }

  /* Where a Commons count opens: the List on one of its filters, an Exhibits view, or the address the Commons gives. */
  function cmTarget(href) {
    var h = COMMONS_EQUIV[href] || href || "";
    var m = /^#exhibits\/([a-z-]+)(?:\/([a-z-]+))?$/.exec(h);
    if (m && m[1] === "list" && m[2] && listFilterLabel(m[2])) return { route: "list", filter: m[2] };
    if (m && !m[2] && ROUTES[m[1]]) return { route: m[1] };
    return h ? { href: h } : null;
  }
  function listFilterLabel(id) {
    var f = LIST_FILTERS.filter(function (x) { return x[0] === id; })[0];
    return f ? f[1] : "";
  }
  /* The reference's own list is the List (#exhibits/credentials opens it too), so a count naming it is not a control there. */
  function cmHere(t) {
    if (t.filter) return state.view === "list" && listState().f === t.filter;
    return ROUTES[t.route][0] === state.view;
  }
  function cmGo(route, filter) {
    var r = ROUTES[route];
    state.view = r[0]; state.filter = r[1]; state.cur = 0; state.note = ""; state.openCollege = null; state.teach = false;
    state.sw.cur = 0; state.sw.rule = ""; state.sw.bulkAsk = false;
    if (r[0] === "list") { var L = listState(); L.f = filter || ""; L.limit = LIST_LIMIT; }
    render();
    if (r[0] === "list" || r[0] === "progress") loadCredentials().then(render);
    if (r[0] === "requests") loadRequests().then(render);
    if (r[0] === "cpl-ai") loadCplAi();
    var h = document.querySelector(".exh-h");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }
  function cmCount(n, href, words) {
    if (n == null) return el("b", { text: "Could not be read" });
    var t = cmTarget(href), about = fmt(n) + " " + (words || "");
    if (t && t.route && !cmHere(t)) {
      return word(fmt(n), function () { cmGo(t.route, t.filter); }, { cls: "exh-w exh-tcount", "aria-label": about + ". Opens "
        + (t.filter ? "the List, filtered to " + listFilterLabel(t.filter) : ROUTE_WORDS[t.route]) });
    }
    if (t && t.href && !t.route) {
      var a = el("a", { href: t.href, cls: "exh-tcount", text: fmt(n), "aria-label": about + ". Opens "
        + (/^#credential-reference/.test(t.href) ? "the Common Exhibit Reference tab" : /^https:\/\//.test(t.href) ? "a new tab" : "its list") });
      if (/^https:\/\//.test(t.href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
      return a;
    }
    return el("b", { text: fmt(n) });
  }
  function cmBig(text) { return el("b", { text: text }); }
  /* One tile in the tab's shape: label, number (a node), of, meter, words, asides, and anything more. */
  function cmTile(o) {
    var kids = [el("span", { cls: "exh-tl", text: o.label })];
    if (o.big) {
      var tn = el("span", { cls: "exh-tn" }, [o.big]);
      if (o.of != null && o.n != null) tn.appendChild(document.createTextNode(" of " + fmt(o.of)));
      kids.push(tn);
    }
    if (typeof o.n === "number" && typeof o.of === "number" && o.of > 0) {
      var bar = el("span", { cls: "exh-bar", role: "img", "aria-label": pct(o.n, o.of) + " percent" });
      var i = el("i"); i.style.width = Math.max(0, Math.min(100, pct(o.n, o.of))) + "%"; bar.appendChild(i); kids.push(bar);
    }
    if (o.words) kids.push(el("span", { cls: "exh-tt", text: o.words }));
    (o.asides || []).forEach(function (a) { if (a) kids.push(el("span", { cls: "exh-ts", text: a })); });
    (o.more || []).forEach(function (k) { if (k) kids.push(k); });
    return el("div", { cls: "exh-tile" + (o.cls ? " " + o.cls : ""), role: "listitem" }, kids);
  }
  /* The tile while the Commons is read, or once its file could not be. */
  function cmPending(label, cls) {
    var cm = state.cm;
    if (!cm || !cm.done) return cmTile({ label: label, big: cmBig("Reading"), cls: cls });
    return cmTile({ label: label, big: cmBig("Could not be read"), asides: [cm.error], cls: cls });
  }

  /* What is it called?: the headline pair, its meter and its tests. */
  function cmPairTiles() {
    var cm = state.cm, row = cm && cm.row;
    if (!row) return [cmPending("Review stamp", "exh-wide")];
    var pairs = Array.isArray(row.pair) ? row.pair : [];
    if (!pairs.length) return [cmTile({ label: "Review stamp", big: cmBig("Could not be read"), asides: [row.error], cls: "exh-wide" })];
    return pairs.map(function (p, k) {
      var tests = k === 0 && Array.isArray(row.tests) && row.tests.length
        ? el("span", { cls: "exh-tests", role: "group", "aria-label": "The tests behind the count" },
          row.tests.map(function (t) { return el("span", { cls: "exh-chip", text: t }); })) : null;
      return cmTile({ label: "Review stamp", big: cmCount(p.n, p.open, p.words), n: p.n, of: p.of, words: p.words,
        asides: [p.n == null ? row.error : null], more: [tests], cls: "exh-wide" });
    });
  }
  /* What is it called?: each known issue, its count opening its list, and who owns it. */
  function cmIssueTiles() {
    var cm = state.cm, row = cm && cm.row;
    if (!row) return [cmPending("Known issues")];
    var items = Array.isArray(row.issues) ? row.issues : [];
    if (!items.length) return [cmTile({ label: "Known issues", big: cmBig(row.error ? "Could not be read" : "None known"), asides: [row.error] })];
    return items.map(function (i) {
      return cmTile({ label: "Known issue", big: cmCount(i.n, i.open, i.words), words: i.words,
        asides: [i.owner ? "Owner: " + i.owner : null, i.n == null ? i.error : null] });
    });
  }
  /* How is it kept?: the settled procedures. A procedure with a count takes a tile; one without joins the first. */
  function cmProcTiles() {
    var cm = state.cm, row = cm && cm.row;
    if (!row) return [cmPending("Settled procedures")];
    var items = Array.isArray(row.procedures) ? row.procedures : [];
    if (!items.length) return [cmTile({ label: "Settled procedures", big: cmBig(row.error ? "Could not be read" : "None yet"), asides: [row.error] })];
    var counted = items.filter(function (i) { return "n" in i; });
    var plain = items.filter(function (i) { return !("n" in i); }).map(function (i) { return i.words || ""; });
    if (!counted.length) return [cmTile({ label: "Settled procedures", asides: plain })];
    return counted.map(function (i, k) {
      return cmTile({ label: "Settled procedures", big: cmCount(i.n, i.open, i.words), words: i.words,
        asides: [i.n == null ? i.error : null].concat(k === 0 ? plain : []) });
    });
  }
  function sheetLink(c, node) {
    if (c.link && /^https:\/\//.test(c.link)) {
      node.appendChild(document.createTextNode(" "));
      node.appendChild(el("a", { href: c.link, target: "_blank", rel: "noopener", text: c.link_text || "Open the decision sheet" }));
    } else if (c.view && c.view.href && c.view.text) {
      node.appendChild(document.createTextNode(" "));
      node.appendChild(el("a", { href: c.view.href, text: c.view.text }));
    }
    return node;
  }
  /* How is it kept?: the Decision Sheet Library, the calls the run log carries. The count waiting on Sam is bold and a
     0 is green; answered calls sit under Completed Decision Sheets, one line each that opens (Sam, 2026-11-01). */
  function cmLibraryTile() {
    var cm = state.cm, label = "Decision Sheet Library", cls = "exh-dsl";
    if (!cm || !cm.done) return cmTile({ label: label, big: cmBig("Reading"), cls: cls });
    if (cm.qErr) return cmTile({ label: label, big: cmBig("Could not be read"), asides: [cm.qErr], cls: cls });
    if (!cm.Q) return cmTile({ label: label, big: cmBig("No run log"), cls: cls });
    var calls = Array.isArray(cm.Q.calls) ? cm.Q.calls : [];
    function answered(c) { return !!(c.answer && c.answer.words); }
    var open = calls.filter(function (c) { return !answered(c); }), done = calls.filter(answered);
    var big = el("b", { cls: "exh-waiting" }, open.length ? [fmt(open.length) + " open"] : [el("span", { cls: "exh-zero", text: "0" }), " open"]);
    var more = [];
    if (open.length) more.push(el("ul", { cls: "exh-open" }, open.map(function (c) { return sheetLink(c, el("li", { text: c.title || "" })); })));
    if (done.length) {
      more.push(el("h4", { cls: "exh-dsl-h", text: "Completed Decision Sheets" }));
      more.push(el("ul", { cls: "exh-done" }, done.map(function (c) {
        var why = "Answered by " + (c.answer.by || DECIDER) + (c.answer.at ? ", " + c.answer.at : "") + ": " + c.answer.words;
        return el("li", null, [el("details", null, [
          el("summary", { title: (c.title || "") + ". " + why }, [el("span", { cls: "exh-done-line", text: (c.title || "") + " · " + why })]),
          sheetLink(c, el("p", { cls: "exh-done-body", text: c.text || "" }))])]);
      })));
    }
    return cmTile({ label: label, big: big, words: "waiting on " + DECIDER, more: more, cls: cls });
  }
  /* How is it kept?: the last run, the machine stamp against its cadence and the session that wrote the run log. */
  function cmRunTile(now) {
    var cm = state.cm, label = "Last run";
    if (!cm || !cm.done) return cmTile({ label: label, big: cmBig("Reading"), cls: "exh-run" });
    var row = cm.row, m = (row && row.machine) || {}, machine;
    if (row) machine = el("p", null, ["Machine: " + (m.what ? m.what + (m.at ? ", " + cmStamp(m.at) : "") : (row.error || "no stamp")),
      el("span", { cls: "exh-age" }, [" · " + cadenceWords(m.every_hours) + " · "]), stateWord(machineState(m, now))]);
    else machine = el("p", null, ["Machine: ", stateWord({ key: "unread", word: "Could not be read" }), el("span", { cls: "exh-age", text: " " + cm.error })]);
    var ss = sessionState(cm.Q, cm.qErr, now), session;
    if (cm.Q) {
      var who = (cm.Q.session ? "S" + cm.Q.session + " " : "") + (cm.Q.moniker || "a session");
      session = el("p", null, ["Session: " + who + " wrote the run log, " + cmStamp(cm.Q.written_at),
        el("span", { cls: "exh-age" }, [" · each checkpoint · "]), stateWord(ss)]);
    } else {
      session = el("p", null, ["Session: ", stateWord(ss), cm.qErr ? el("span", { cls: "exh-age", text: " " + cm.qErr }) : null]);
    }
    var more = [machine, session];
    if (cm.Q && cm.Q.next_step && cm.Q.next_step.title) more.push(el("p", null, [el("span", { cls: "exh-age", text: "Next: " }), cm.Q.next_step.title]));
    if (cm.at) more.push(el("p", { cls: "exh-age", text: "The Commons' figures, read " + cmStamp(cm.at) }));
    return cmTile({ label: label, more: more, cls: "exh-run" });
  }
  /* The tiles above the List (norm 1). */
  /* The tiles fold behind one word for the visit, and one line of their counts stays above the list (Sam, 2026-11-03:
     "incorporating the list view below the action/metric cards and make that top level collapsible while keeping the
     one-line action/metric links like we do elsewhere", the CSM Workspace's Today line, #2727). The line reads the same
     Commons row the tiles read, and each count opens where its tile's count opens. */
  function credDash(wrap) {
    if (!state.cm) loadCommons().then(function () { if (state.view === "list") render(); });
    // The top's fold is one stored choice for every Commons view (commons_list.js topFolded), read as a visit starts.
    if (state.dashFolded == null && window.CPL_COMMONS_LIST && CPL_COMMONS_LIST.topFolded) state.dashFolded = CPL_COMMONS_LIST.topFolded();
    var folded = !!state.dashFolded;
    wrap.appendChild(cmLine(folded));
    var fold = el("div", { cls: "exh-fold", id: "exh-fold", hidden: folded ? "" : null });
    fold.appendChild(credTiles());
    fold.appendChild(credMoreTiles());
    fold.appendChild(cmKeptGroup());
    wrap.appendChild(fold);
  }
  /* One item of the line: the whole phrase is the control, as on the CSM Workspace; the list it names, when it shows
     here already, reads as plain words. A count that could not be read says so, never a zero (the S343 rule). */
  /* A count on the line opens where its tile's count opens: a route in this tab (not the one the reader is on), or a link. */
  function cmLineControl(href, text) {
    var t = cmTarget(href);
    if (t && t.route && !cmHere(t)) return word(text, function () { cmGo(t.route, t.filter); }, { cls: "exh-w exh-li" });
    if (t && t.href && !t.route) {
      var a = el("a", { href: t.href, cls: "exh-li", text: text });
      if (/^https:\/\//.test(t.href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
      return a;
    }
    return null;
  }
  /* The line itself is the List engine's (commons_list.js api.line, one renderer for every List's line), drawn with this
     tab's class names so it looks as it did when Exhibits drew the first (#2736). */
  function cmLine(folded) {
    var cm = state.cm;
    return LIST_ENGINE.line({ row: cm && cm.row, error: cm && cm.done ? (cm.error || "") : null, folded: folded, foldId: "exh-fold", top: [],
      onToggle: function () { state.dashFolded = !state.dashFolded; render(); },
      control: cmLineControl,
      cls: { bar: "exh-linebar", line: "exh-line", sep: "exh-sep", li: "exh-li", w: "exh-w" } });
  }
  function cmKeptGroup() {
    var now = new Date();
    return el("div", { cls: "exh-group" }, [el("h3", { cls: "exh-q", text: "How is it kept?" }),
      el("div", { cls: "exh-dash exh-kept", role: "list", "aria-label": "How is it kept" },
        cmProcTiles().concat([cmLibraryTile(), cmRunTile(now)]))]);
  }

  /* The reference's counts over its credentials, one pass: the tiles and the Progress view's three questions read
     the same figures. A count whose read has not landed is null (adopt: kb/exhibits_adoption.json; links: map_links.js). */
  function credCounts() {
    var cs = state.cs, rows = cs.rows || [];
    var c = { n: cs.rows ? rows.length : null, iss: 0, site: 0, recs: 0, statewide: 0, field: 0, adoptable: 0, shared: 0, could: 0 };
    rows.forEach(function (r) {
      var cur = credCurrent(r);
      if (cur.issuer) c.iss++;
      if (cur.sites.length) c.site++;
      if (r.ccc_rec || r.gen_rec) c.recs++;
      if (r.ccc_rec) c.statewide++;
      var a = credAdopt(r);
      if (a && a.s) c.field++;
      if (credArt(r).length >= 2) c.shared++;
      if (credCould(r).length) c.could++;
      var ix = cs.links;
      if (ix && ix.by_title && (ix.by_title[r.ut] || []).some(function (id) { return ix.found[String(id).toUpperCase()]; })) c.adoptable++;
    });
    if (c.n == null) { c.iss = c.site = c.recs = c.statewide = c.shared = null; }
    if (c.n == null || !cs.adopt) { c.field = c.could = null; }
    if (c.n == null || !cs.links) c.adoptable = null;
    return c;
  }
  function credTiles() {
    var cs = state.cs, rows = cs.rows || [];
    var cc = credCounts(), nIss = cc.iss || 0, nSite = cc.site || 0;
    var group = el("div", { cls: "exh-group" }, [el("h3", { cls: "exh-q", text: "What is it called?" })]);
    group.appendChild(el("div", { cls: "exh-dash", role: "list", "aria-label": "What is it called" }, cmPairTiles().concat([
      tile("Credentials", cs.rows ? rows.length : null, null, "canonical credentials in the reference", "", "Reading"),
      tile("Issuers", cs.rows ? nIss : null, cs.rows ? rows.length : null, "credentials naming an issuing agency", "", "Reading"),
      tile("Training sites", cs.rows ? nSite : null, cs.rows ? rows.length : null, "credentials naming where the training happens",
        "Set them in a credential's panel", "Reading")])));
    /* The known issues take the wider grid: an owner names its reasons, which a narrow tile stacks a word a line. */
    group.appendChild(el("div", { cls: "exh-dash exh-kept", role: "list", "aria-label": "Known issues" }, cmIssueTiles()));
    return group;
  }
  /* What credit does it carry? and Who could adopt it? (mock-up version 26), counted over the reference's credentials. */
  function credMoreTiles() {
    var cs = state.cs, cc = credCounts(), n = cc.n;
    var recs = cc.recs, statewide = cc.statewide, field = cc.field, adoptable = cc.adoptable, shared = cc.shared, could = cc.could;
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
  function siteRow(r, d, k, colleges, ui) {
    var x = d.sites[k], pf = ui.pf;
    var sel = el("select", { id: pf + "col-" + k, "aria-label": "College for training site " + (k + 1) });
    var opts = [""].concat(colleges);
    if (x.college && opts.indexOf(x.college) === -1) opts.push(x.college);
    opts.forEach(function (c) {
      var o = el("option", { value: c, text: c ? shortName(c) : "Any college" });
      if (c === (x.college || "")) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { x.college = sel.value; });
    var inp = el("input", { id: pf + "site-" + k, type: "text", autocomplete: "off",
      placeholder: "Local school house or training center", "aria-label": "Training site " + (k + 1) });
    inp.value = x.site || "";
    inp.addEventListener("input", function () { x.site = inp.value; });
    var rm = word("Remove", function () {
      d.sites.splice(k, 1); ui.redraw(pf + "add");
    }, { "aria-label": "Remove training site " + (k + 1) });
    return el("div", { cls: "exh-siteitem" }, [el("div", { cls: "exh-siterow" }, [sel, inp, rm]),
      suggest(inp, "sites", function (t) { x.site = t; })]);
  }
  /* The credential's editor, in the List's side panel: the issuer (offering the names already in the reference), the
     issuers the reference holds beside it, and the training sites, each for a college or any college. ui = { pf: the id
     prefix, redraw(focusId), note: the status words, setNote(text), changed() }. The panel's words last the visit with
     the List's state, and a save joins the List's Changed this visit. */
  function credUi(ut) {
    var L = listState(), notes = L.pnNote || (L.pnNote = {});
    return { pf: "exh-pn-", note: notes[ut] || "",
      redraw: function (fid) { redrawList(); var n = fid && document.getElementById(fid); if (n) n.focus(); },
      setNote: function (t) { notes[ut] = t; },
      changed: function () { if (L.changed && L.changed.indexOf(ut) === -1) L.changed.push(ut); } };
  }
  function credEditor(r, ui) {
    var d = credDraft(r), pf = ui.pf, out = [];
    var issuer = el("input", { id: pf + "issuer", type: "text", autocomplete: "off", placeholder: "None named" });
    issuer.value = d.issuer;
    issuer.addEventListener("input", function () { d.issuer = issuer.value; });
    out.push(el("label", { cls: "exh-inbox", "for": pf + "issuer" }, [el("span", { cls: "exh-pre", text: "Issuer:" }), issuer]));
    out.push(suggest(issuer, "issuers", function (t) { d.issuer = t; }));
    foldLines(state.cs.overlay[r.ut]).forEach(function (txt) {
      out.push(el("p", { cls: "exh-muted exh-small exh-fold-line", text: txt }));
    });
    var also = (r.issuers || []).filter(function (x) { return x !== d.issuer.trim() && x !== (r.issuer || ""); });
    if (also.length) out.push(el("p", { cls: "exh-muted exh-small", text: "Also issued by " + also.join(", ")
      + ". The Common Exhibit Reference edits a credential's other issuers." }));
    var fs = el("fieldset", { cls: "exh-sites" }, [el("legend", { cls: "exh-cl", text: "Training sites" })]);
    var colleges = credArt(r);
    if (!d.sites.length) fs.appendChild(el("p", { cls: "exh-muted exh-small", text: "None named" }));
    d.sites.forEach(function (x, k) { fs.appendChild(siteRow(r, d, k, colleges, ui)); });
    fs.appendChild(el("p", { cls: "exh-muted exh-small", text: colleges.length
      ? "Name the college a site trains for, or leave Any college." : "No college articulates it yet, so each site reads Any college." }));
    out.push(fs);
    out.push(el("div", { cls: "exh-acts" }, [
      word("Add a training site", function () {
        d.sites.push({ site: "", college: colleges.length === 1 ? colleges[0] : "" });
        ui.redraw(pf + "site-" + (d.sites.length - 1));
      }, { id: pf + "add" }),
      word("Save", function () { credSave(r, ui); }, { id: pf + "save" })]));
    out.push(el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: ui.note || "" }));
    return out;
  }
  /* ── List: every credential on one sheet, A to Z (Sam, 2026-11-01) ──
     "a simple exhibit view in small font, alpha order with tight margins and padding. I want to be able to scan
     and correct directly on the view exhibit titles next to their key information, such as status, CIP title,
     Subject, Discipline, issuing agency, CPL types". Fable advised the columns (S540, docs/cer_procedures lessons):
     no TOP column (Rule 7: TOP is last-in-line), the CIP field named as a family read from TOP, never a code;
     the discipline is the M-IDs' own. Edit saves what the side panel's editor saves (issuer, training sites) and the
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
    ["nosubj", "No Common SUBJ"],
    ["changed", "Changed this visit"],
    ["suggested", "Suggested folds"],
    ["outcomes", "Outcomes match"],
    ["waiting", "Folds waiting for the apply"],
    ["statewide", "Based on statewide"],
    ["local", "Local only"],
    ["left", "A title that has left MAP"],
    ["cplai", "CPL-AI recommendations"]
  ];
  /* Outcomes match (Sam, 2026-11-01: "yes to SLO hints and the nightly harvest"): the credentials whose articulated
     courses' SLOs match a row's at cosine 0.5 or more through distinct courses, from kb/exhibit_slo_neighbors.json
     (kb/_build_exhibit_slo_neighbors.py, daily; a shared course is articulation evidence and never shows as a hint). A
     second signal, never a decider (Rule 7's TOP precedent): the List names the match and its group under the title, a
     reviewer acts on it with Move, and nothing moves by itself. Read once a visit, with the AI sort's order, on the List's
     first draw: the group a hint names is the one the List draws. */
  var SLO_NEIGHBORS_URL = "kb/exhibit_slo_neighbors.json";
  /* CPL-AI on the List (Sam, 2026-11-06: "have the Exhibits List row name its CPL-AI pairs"): kb/cpl_ai/exhibit_join.json's
     by_exhibit (kb/_build_cpl_ai_join.py) names, under a row's title, each CPL-AI certification joined to it, its pairs and
     the colleges holding a Strong evidence course, and opens it in the CPL-AI recommendations view. Read once a page load:
     the snapshot is frozen. A related join says so; it is a lead, never the credential's own. */
  var CPLAI_JOIN_URL = "kb/cpl_ai/exhibit_join.json";
  var CPJ = { data: null, error: null, loading: null };
  function listCplAiLoad() {
    if (CPJ.data || CPJ.loading) return CPJ.loading || Promise.resolve(CPJ.data);
    CPJ.loading = fetch(CPLAI_JOIN_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { CPJ.data = d; }, function (e) { CPJ.error = errText(e); })
      .then(function () { CPJ.loading = null; });
    return CPJ.loading;
  }
  function listCplAi(r) { return CPJ.data && CPJ.data.by_exhibit ? CPJ.data.by_exhibit[r.ut] || [] : []; }
  function openCplAi(code, q) {
    state.view = "cpl-ai"; state.cplAiCode = code; state.cplAiQ = q || null; state.note = "";
    if (window.CPL_EXHIBITS_CPLAI) { window.CPL_EXHIBITS_CPLAI.open(code, null, q); state.cplAiCode = undefined; state.cplAiQ = null; }
    render();
    loadCplAi();
    var h = document.querySelector(".exh-h");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }
  function cplAiSentence(c) {
    return c.title + (c.kind === "related" ? " (a related certification)" : "") + ": " + fmt(c.pairs) + " pairs, "
      + fmt(c.strong_colleges) + (c.strong_colleges === 1 ? " college holds" : " colleges hold") + " a Strong evidence course";
  }
  /* The row's line is short, so it reads in the title column; its full sentence is the word's title and label, and the
     side panel spells each out. One certification opens on itself; several open the CPL-AI list searched to this exhibit. */
  function listCplAiLine(r) {
    var cs = listCplAi(r);
    if (!cs.length) return null;
    var pairs = cs.reduce(function (n, c) { return n + c.pairs; }, 0), full = cs.map(cplAiSentence).join("; ");
    var words = "CPL-AI, " + (cs.length > 1 ? fmt(cs.length) + " certifications, " : "") + fmt(pairs) + " pairs"
      + (cs.every(function (c) { return c.kind === "related"; }) ? ", related" : "");
    var b = word(words, function () { if (cs.length === 1) openCplAi(cs[0].code); else openCplAi(null, r.ut); },
      { title: full, "aria-label": "Open in the CPL-AI recommendations: " + full });
    return el("span", { cls: "exh-l-sub exh-l-cai" }, [b]);
  }
  var SLO_SHOW = 3;
  function listSloLoad() {
    var L = listState();
    if (L.sloP) return L.sloP;
    var order = listApi() ? LIST_ENGINE.aiLoad().catch(function () { return null; }) : null;
    L.sloP = Promise.all([fetch(SLO_NEIGHBORS_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }), order])
      .then(function (got) { L.slo = got[0] && got[0].neighbors ? got[0] : false; }, function () { L.slo = false; });
    return L.sloP;
  }
  function listByUt() {
    var cs = state.cs;
    if (cs._byUtFor !== cs.rows) { cs._byUt = {}; (cs.rows || []).forEach(function (r) { cs._byUt[r.ut] = r; }); cs._byUtFor = cs.rows; }
    return cs._byUt;
  }
  /* The group a title sits in now, "" when it stands alone: the List's own grouping (commons_list.js, kept groups over
     the night's order), worked out once a draw; until the order is read, a kept group, then the file's record. */
  function listGroupsNow() {
    var L = listState();
    if (L.sloGi === undefined) {
      L.sloGi = listApi() && LIST_ENGINE.groupIndex ? LIST_ENGINE.groupIndex() : null;
      Promise.resolve().then(function () { L.sloGi = undefined; });
    }
    return L.sloGi;
  }
  function listGroupNow(ut, fileGroup) {
    var gi = listGroupsNow();
    if (gi && gi.by[ut]) { var GR = gi.groups[gi.by[ut].key]; return GR && GR.isGroup ? GR.name : ""; }
    var saved = String(((state.cs.overlay || {})[ut] || {}).group || "").trim();
    if (saved) return saved === NO_GROUP ? "" : saved;
    return fileGroup || "";
  }
  /* A row's hints: each distinct-course neighbor still in the reference that sits outside the row's group. */
  function listOutcomeHints(r) {
    var d = listState().slo, e = d && d.neighbors[r.ut];
    if (!e || !e.n) return [];
    var rows = listByUt(), mine = listGroupNow(r.ut, e.g).toLowerCase();
    return e.n.map(function (x) { return { row: rows[x[0]], score: x[1], group: listGroupNow(x[0], x[2]) }; })
      .filter(function (x) { return x.row && !(mine && x.group.toLowerCase() === mine); });
  }
  function listOutcomeLabel(x) { return listTitle(x.row) + " (" + (x.group || "not in a group") + ")"; }
  function listState() {
    return state.ls || (state.ls = { q: "", f: "", limit: LIST_LIMIT, edit: null, draft: null, changed: [], note: "",
      busy: false, collisions: null, sgDone: {}, sort: [{ col: 0, dir: 1 }], cf: {}, wrap: false, widths: null, sel: {}, open: null, flagBusy: {}, move: null, gEdit: null, gBusy: false });
  }
  /* The columns, each with what it shows (Sam, 2026-11-01: "sometimes I miss good ol' Excel, where I can quickly
     filter any column, sort any way ... use find and replace to fix things on the fly--that freedom is what you're
     doing for me"). One accessor serves the cell, the column's filter, the sort and the download. */
  function listCols() {
    return [
      { h: "Title", w: 17, edit: "title", v: function (r) { return listTitle(r); } },
      { h: "Status", w: 8, v: function (r) { return listStatus(r) + (r.quality_flag ? "; " + String(r.quality_flag).replace(/_/g, " ") : ""); } },
      // The classifier's title confidence, a percent (Sam, 2026-11-01: "add the confidence indicator as a column").
      { h: "Confidence", w: 5, n: true, suffix: "%", v: function (r) { return r.conf_title != null ? Math.round(r.conf_title * 100) : null; } },
      { h: "CPL types", w: 9, v: function (r) { return (r.cpl_types || []).join(", "); } },
      { h: "Issuer", w: 10, edit: "issuer", v: function (r) { return credCurrent(r).issuer || ""; } },
      { h: "Training sites", w: 8, edit: "sites", v: function (r) { return credCurrent(r).sites.map(function (x) { return x.site; }).join("; "); } },
      { h: "Discipline (M-IDs)", w: 9, v: function (r) { return r.disc_modal || ""; } },
      { h: "Common SUBJ", w: 5, v: listSubj },
      { h: "CIP family (from TOP)", w: 7, v: listCip },
      { h: "Colleges", w: 5, n: true, v: function (r) { return credColleges(r).length; } },
      { h: "MAP titles", w: 5, n: true, v: function (r) { return r.raw_count || 0; } },
      // Students who hold credit for it (Sam, 2026-11-03, on the side-panel mock): the reference's own count, with a
      // suppressed one reading Too few.
      { h: "Students", w: 5, n: true, v: function (r) { return r.students_served != null ? r.students_served : null; },
        cell: function (r) { return [credStudents(r).word]; } },
      { h: "Basis", w: 5, v: listBasis }
    ];
  }
  /* The certs a title holds or is aligned to, by catalog id, and the words the finder matches them by: each cert's test
     code ("T8") and name ("Preventive Maintenance Inspection"), so a bundle answers to any test inside it. */
  function listCertLink(r) { var d = state.cs.certLinks; return (d && d.links[r.ut]) || null; }
  function listCerts(r) { var l = listCertLink(r); return l ? l.certs : []; }
  function listCertWords(r) {
    var l = listCertLink(r), d = state.cs.certLinks;
    if (!l) return "";
    return l.certs.map(function (id) { var c = d.certs[id] || {}; return [c.code, c.name, c.family ? c.family + " " + c.code : "", id].join(" "); })
      .concat(l.unresolved || []).join(" | ");
  }
  function listCertName(id) { var c = (state.cs.certLinks || {}).certs ? state.cs.certLinks.certs[id] : null; return c ? (c.family ? c.family + " " : "") + c.code + " " + c.name : id; }
  function listColIndex(h) {
    var C = listCols();
    for (var i = 0; i < C.length; i++) if (C[i].h === h) return i;
    return 0;
  }
  /* Based on statewide (Sam, 2026-11-01: "count all canonical exhibit titles that include a statewide as based on a
     statewide, whether local or not. It goes with our adopted or adapted approach"). A credential is based on statewide
     when MAP's CCC Collaborative rows place a statewide exhibit under it: fact-sheet/statewide_recs.js, the Fact Sheet's
     list, names 152 such credentials (2026-11-01). The reference's own statewide flag counts the same set since #2667
     (152, S543), and it stands in only when that list did not load. */
  function listStatewideExhibits(r) {
    var S = window.CPL_STATEWIDE_RECS, recs = S && S[r.ut];
    if (!recs) return [];
    var by = {}, out = [];
    recs.forEach(function (x) { if (!x.id) return; if (!by[x.id]) { by[x.id] = { id: x.id, n: 0 }; out.push(by[x.id]); } by[x.id].n++; });
    return out;
  }
  function listBasis(r) {
    var S = window.CPL_STATEWIDE_RECS;
    return (S ? !!S[r.ut] : !!r.statewide) ? "Statewide" : "Local";
  }
  /* A saved fold is a reviewed row (Sam, 2026-11-11, #3110: he approved 35 folds, opened Folds waiting for the apply,
     and every row read Unreviewed). Saving the decision is the review: a row whose saved rename or fold the reference
     already carries (its title is now an old name of another credential, kb/exhibits_related.json's aka) reads Applied;
     a saved rename or fold the apply has not reached reads Saved, waiting for apply. Only then the reference's stamp. */
  var STATUS_SAVED = "Saved, waiting for apply", STATUS_APPLIED = "Applied";
  function listAppliedTo(ut) {
    var d = state.rel.data;
    if (!d) return "";
    if (state.rel._akaFor !== d) {
      var m = {};
      // A retired name can be an old name of two titles (Elementary French went to Elementary French 1 and 2): keep each.
      (state.rel.idx || []).forEach(function (o) {
        (o.aka || []).forEach(function (a) {
          if (!a || a === o.t) return;
          var to = Object.prototype.hasOwnProperty.call(m, a) ? m[a] : (m[a] = []);
          if (to.indexOf(o.t) < 0) to.push(o.t);
        });
      });
      state.rel._akaTo = m; state.rel._akaFor = d;
    }
    var to = Object.prototype.hasOwnProperty.call(state.rel._akaTo, ut) ? state.rel._akaTo[ut] : null;
    return to ? to.join(" and ") : "";
  }
  function listDecision(r) {
    var to = listAppliedTo(r.ut);
    if (to) return { status: STATUS_APPLIED, to: to };
    var o = (state.cs.overlay || {})[r.ut] || {};
    if (o.title && o.title !== r.ut) return { status: STATUS_SAVED, to: o.title, fold: !!(o.merge && o.merge === o.title) };
    return null;
  }
  /* A title's family, read live (kb_curation credential_family) or from the reference build. The family row comes only from
     a person's decision (Sam's 31 saved folds, read as family tags, #3117), so a title that carries one reads as reviewed:
     the conversion deletes the only rows that stamped it, and it must not fall back to Unreviewed. */
  var STATUS_FAMILY = "Family set";
  function listFamily(r) {
    var o = (state.cs.overlay || {})[r.ut] || {}, f = famOf(r.ut);
    return o.family || (f ? f.name : "");
  }
  function listStatus(r) {
    var dec = listDecision(r);
    if (dec) return dec.status;
    if (listFamily(r)) return STATUS_FAMILY;
    var by = String(r.curated_by || "");
    if (!r.curated_at && !by) return "Unreviewed";
    return /@bot$/.test(by) ? "Cohort" : "Person";
  }
  /* The Common SUBJ, read as the Catalog reads it (credential_reference.js subjOf; Sam, 2026-11-11): a stored
     subj_override on _CREDENTIAL_REVIEW::<title> wins; else every articulation's subject token, M-ID and C-ID
     alike, the Catalog's modal one first, then the rest by count. tests/exhibits_list_subject.test.js holds the two
     readers to one answer. */
  function listSubj(r) {
    var o = (state.cs.overlay || {})[r.ut] || {};
    if (o.subj) return o.subj;
    var counts = {}, order = [], best = "", bestN = 0;
    (r.articulations || []).forEach(function (a) {
      var tok = a && a.cid ? String(a.cid).split(/\s+/)[0] : "";
      if (!/^[A-Za-z][A-Za-z-]{1,7}$/.test(tok)) return;
      if (!counts[tok]) order.push(tok);
      counts[tok] = (counts[tok] || 0) + 1;
      if (counts[tok] > bestN) { bestN = counts[tok]; best = tok; }
    });
    if (!best) return "";
    var rest = order.filter(function (t) { return t !== best; });
    rest.sort(function (a, b) { return counts[b] - counts[a] || order.indexOf(a) - order.indexOf(b); });
    return [best].concat(rest).join(", ");
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
  /* Where a credential is articulated, for the finder (Sam, 2026-11-01: find a credential by "college, district, SWP
     region or ASCCC region"). The colleges come from the reference; college_lookup.js, which COBI loads, names each
     college's district, SWP region and ASCCC area. Measured 2026-11-01: all 86 college names in the reference match
     its keys exactly. */
  function listWhere(r) {
    if (r._where != null) return r._where;
    var look = window.CCC_COLLEGE_LOOKUP, parts = [];
    credColleges(r).forEach(function (c) {
      var i = (look && look[c]) || {};
      parts.push(c, i.district || "", i.swRegion || "", i.ascccArea ? "ASCCC Area " + i.ascccArea : "");
    });
    var out = parts.filter(Boolean).join(" | ");
    if (look) r._where = out;
    return out;
  }
  /* Check alignment beside Save (Sam, 2026-11-04: "a Check Alignment button in the code box that fires a little audit
     and recommendation"; "We could use that feature on all our commons list views"). For a credential, alignment is its
     unified title and issuer against the reference: the title another credential already carries (two names, one
     credential, or a collision), the close titles beside it, what colleges wrote for it (raw variants), the noise the
     canonicalization rules strip (.claude/skills/exhibit-canonicalization, Rule 1), and the issuer's spellings across
     the reference. It reads what the List holds; the daily run's collision check and the re-analysis stay the record. */
  function auditNorm(t) {
    return String(t == null ? "" : t).toLowerCase().replace(/\bu\.?\s?s\.?\b/g, "us").replace(/united states/g, "us")
      .replace(/&/g, " and ").replace(/[^a-z0-9+#]+/g, " ").replace(/\b(the|of)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  function auditWords(t) { return auditNorm(t).split(" ").filter(function (w) { return w.length > 1; }); }
  function auditClose(a, b) {
    var A = auditWords(a), B = auditWords(b);
    if (!A.length || !B.length) return 0;
    var inB = {}; B.forEach(function (w) { inB[w] = 1; });
    var both = A.filter(function (w) { return inB[w]; }).length;
    return both / (A.length + B.length - both);
  }
  var AUDIT_NOISE = [
    [/credit\s*by\s*exam|\bcbe\b|portfolio(\s+review)?|industry\s+certification|certificate\s+prep|\bprep\b/i, "a CPL mechanism (the CPL type carries it)"],
    [/\bscore\s*\d|\(\s*score|\bversion\s*\d|\bv\d+(\.\d+)?\b|\beffective\s+(fall|spring|summer|winter)|\bprior\s+(fall|spring|summer)/i, "a score or version note"],
    [/\bat\s+[a-z .'-]+\b(college|university)\b/i, "a college's name"],
    [/[.,;:]\s*$/, "trailing punctuation"],
    [/\s{2,}/, "a double space"]
  ];
  function exhibitAudit(r, d) {
    var rows = state.cs.rows || [], typed = String(d.title || "").replace(/\s+/g, " ").trim(), was = listTitle(r);
    var title = typed || was, issuer = String(d.issuer || "").replace(/\s+/g, " ").trim();
    if (!title) return "Type a title to check it.";
    var facts = [], recs = [], key = auditNorm(title);
    var nColl = function (x) { return credColleges(x).length; };
    // The title another credential carries, or nearly.
    var same = rows.filter(function (x) { return x !== r && auditNorm(listTitle(x)) === key; });
    var close = rows.filter(function (x) { return x !== r && same.indexOf(x) < 0; })
      .map(function (x) { return { x: x, s: auditClose(title, listTitle(x)) }; })
      .filter(function (y) { return y.s >= 0.6; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
    if (same.length) facts.push("“" + listTitle(same[0]) + "” is already a credential (" + fmt(nColl(same[0])) + (nColl(same[0]) === 1 ? " college" : " colleges") + ")");
    else facts.push("no other credential carries this title");
    if (close.length) facts.push("close titles: " + close.map(function (y) { return "“" + listTitle(y.x) + "” (" + fmt(nColl(y.x)) + (nColl(y.x) === 1 ? " college" : " colleges") + ")"; }).join(", "));
    // What colleges wrote for this credential.
    var raws = (r.raw_variants || []).map(function (v) { return v.r; }).filter(Boolean);
    if (raws.length) {
      var hit = raws.some(function (x) { return auditNorm(x) === key; });
      facts.push(fmt(raws.length) + (raws.length === 1 ? " college-written title folds" : " college-written titles fold") + " here" + (hit ? ", and one reads this way" : "; none reads this way"));
    }
    // The noise the canonicalization rules strip.
    var noise = AUDIT_NOISE.filter(function (n) { return n[0].test(title); }).map(function (n) { return n[1]; });
    if (noise.length) facts.push("the title carries " + noise.join(" and "));
    // The issuer's spellings across the reference.
    var spell = {}, ikey = auditNorm(issuer), twin = null;
    if (issuer) {
      rows.forEach(function (x) {
        var i = (x === r ? issuer : credCurrent(x).issuer) || "";
        if (i && auditNorm(i) === ikey) spell[i] = (spell[i] || 0) + 1;
      });
      var names = Object.keys(spell).sort(function (a, b) { return spell[b] - spell[a]; });
      facts.push("the issuer “" + issuer + "” names " + fmt(spell[issuer] || 1) + (spell[issuer] === 1 || !spell[issuer] ? " credential" : " credentials")
        + (names.length > 1 ? ", and the reference also spells it " + names.filter(function (n) { return n !== issuer; }).map(function (n) { return "“" + n + "” (" + fmt(spell[n]) + ")"; }).join(", ") : ""));
      // A twin spelling is recommended only when more credentials use it than the one typed.
      if (names.length > 1 && names[0] !== issuer && spell[names[0]] > (spell[issuer] || 0)) twin = names[0];
    } else facts.push("no issuer named");
    // One recommendation, the most pressing first.
    if (same.length) recs.push(typed && typed !== was
      ? "this title is “" + listTitle(same[0]) + "”'s. If they are one credential, fold them (Suggested folds, or Move); if not, add what tells them apart, a level, an exam or a version"
      : "two credentials carry one title: fold them if they are one, or tell them apart");
    else if (twin) recs.push("spell the issuer “" + twin + "”, as " + fmt(spell[twin]) + " credentials do");
    else if (noise.length) recs.push("drop " + noise[0] + " from the title; the canonicalization rules keep the credential's own name");
    else if (close.length && close[0].s >= 0.75) recs.push("check “" + listTitle(close[0].x) + "”: if it is the same credential, fold one into the other");
    else if (!issuer) recs.push("name the issuer, the body that grants the credential");
    else recs.push("the title and issuer read well against the reference");
    return facts.join("; ") + ". Recommendation: " + recs[0] + ".";
  }
  function listCheckAlignment(r, d) {
    d._hint = exhibitAudit(r, d);
    var hn = document.getElementById("exh-l-edit-hint");
    if (hn) { hn.textContent = d._hint; hn.hidden = false; }
  }
  function listSave(r) {
    var L = listState(), d = L.draft, cur = credCurrent(r), cs = state.cs;
    var title = d.title.replace(/\s+/g, " ").trim(), issuer = d.issuer.replace(/\s+/g, " ").trim();
    /* The row's box holds the site names alone, so a site whose name stands keeps the college it trains for (set in
       the side panel's editor); a new name trains for any college. Repeats pair off in order. */
    var pool = cur.sites.slice();
    var sites = parseSites(JSON.stringify(d.sites.split(";").map(function (x) { return x.replace(/\s+/g, " ").trim(); })
      .filter(Boolean).map(function (x) {
        var k = -1;
        pool.some(function (p, i) { if (p.site === x) { k = i; return true; } return false; });
        var col = k > -1 ? pool.splice(k, 1)[0].college : "";
        return col ? { site: x, college: col } : { site: x };
      }))) || [];
    var writes = [];
    if (!title) { L.note = "A title cannot be empty."; render(); return Promise.resolve(); }
    if (title !== listTitle(r)) writes.push([FIELD_CRED_TITLE, title === r.ut ? "" : title]);
    // An Edit back to the title's own name undoes a fold before the apply: it clears the merge confirm beside the
    // rename too, the same way ("" upserted), so no leftover confirm holds the old target in the Review panel
    // (COBIx on #3160). A lone confirm, with no rename beside it, is left to a person.
    var ov0 = state.cs.overlay[r.ut] || {};
    if (title !== listTitle(r) && title === r.ut && ov0.title && ov0.merge) writes.push([FIELD_MERGE_CONFIRM, ""]);
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
      listApply(r, writes);
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
  /* What a saved write means on the row, at once: the same fields the daily run reads back from kb_curation. */
  function listApply(r, writes) {
    var L = listState(), o = state.cs.overlay[r.ut] = state.cs.overlay[r.ut] || {};
    var now = new Date().toISOString();
    writes.forEach(function (w) {
      if (w[0] === FIELD_CRED_ISSUER) { o.issuer = w[1]; o.issuerAt = now; }
      else if (w[0] === FIELD_CRED_TRAINER) { o.trainer = w[1]; o.trainerAt = now; }
      else if (w[0] === FIELD_CRED_SITES) { o.sites = w[1]; o.sitesAt = now; }
      else if (w[0] === FIELD_MERGE_CONFIRM) o.merge = w[1];
      else if (w[0] === FIELD_CRED_TITLE) o.title = w[1];
    });
    var one = {}; one[r.ut] = o; resolveFoldIssuers(one);  // a newer row: the person's save wins
    if (L.changed.indexOf(r.ut) === -1) L.changed.push(r.ut);
  }

  /* Find and replace (Sam, 2026-11-01: "use find and replace to fix things on the fly"): the three columns a reviewer
     can edit, drawn by the shared List (commons_list.js); these are the writes each one needs, the same fields Edit saves. */
  var FR_COLS = [["title", "Title"], ["issuer", "Issuer"], ["sites", "Training sites"]];
  /* The writes one row needs to hold a value: the same fields Edit saves. */
  function frWrites(r, col, value, sites) {
    if (col === "title") return [[FIELD_CRED_TITLE, value === r.ut ? "" : value]];
    if (col === "issuer") return [[FIELD_CRED_ISSUER, value]];
    return [[FIELD_CRED_SITES, JSON.stringify(sites)], [FIELD_CRED_TRAINER, joinSites(sites)]];
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
        "Its findings show below once it has run, and anything that needs your word is also a card on the standing decision sheet.";
      render();
    }).catch(function (e) {
      L.busy = false;
      L.note = e && e.message === "signin" ? "Sign in as a reviewer to ask for a re-analysis."
        : "The request did not reach the routine (" + (e && e.message || "no answer") + "). Try again.";
      render();
    });
  }
  /* The last re-analysis, under the box that asks for one (the cer-procedures lane's NEXT, S628): the routine writes
     its findings to kb/exhibits_reanalysis/<date>.json and copies the newest to latest.json, which this reads once a
     visit. What waits on the sender's word comes first; the checks' counts and the routine's notes fold below. */
  var REANALYSIS_URL = "kb/exhibits_reanalysis/latest.json";
  var RX_CHECKS = [["rename_collision", "a rename that collides with an existing title"],
    ["issuer_spellings", "an issuer spelled two ways"], ["stem_issuer_differs", "an issuer that differs from its title's siblings"],
    ["no_cpl_type", "no CPL type"], ["shared_mid_same_issuer", "two credentials sharing an M-ID"]];
  function listReanalysisLoad() {
    var L = listState();
    if (L.rxP) return L.rxP;
    L.rxP = fetch(REANALYSIS_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { L.rx = d && d.summary ? d : false; }, function () { L.rx = false; })
      .then(function () { render(); });
    return L.rxP;
  }
  function listReanalysisPanel() {
    var L = listState(), d = L.rx;
    if (d === undefined) { listReanalysisLoad(); return null; }
    if (!d) return null;
    var s = d.summary || {}, asks = d.for_sam || [];
    var counts = RX_CHECKS.filter(function (c) { return s[c[0]]; }).map(function (c) { return fmt(s[c[0]]) + " with " + c[1]; });
    var head = "The last re-analysis (" + (stamp(d.sent_at) || "undated") + " request, by " + (d.run || "the routine") + ") looked at "
      + fmt(s.credentials || (d.findings || []).length) + (s.credentials === 1 ? " credential" : " credentials") + ". "
      + (asks.length ? asks.length + (asks.length === 1 ? " needs" : " need") + " your word." : "Nothing needs your word.");
    var kids = [el("p", { cls: "exh-l-rxhead", text: head })];
    if (asks.length) kids.push(el("ul", { cls: "exh-l-rxlist" }, asks.map(function (a) {
      return el("li", null, [el("strong", { text: a.credential + ": " }), a.ask + (a.held_because ? " Held: " + a.held_because + "." : "")]);
    })));
    if (d.comments_answer) kids.push(el("p", { cls: "exh-muted exh-small", text: "Your comments: " + d.comments_answer }));
    var more = [el("summary", { text: "What the checks found" + (counts.length ? " (" + counts.length + (counts.length === 1 ? " kind)" : " kinds)") : "") })];
    more.push(el("p", { cls: "exh-small", text: counts.length ? "Of the credentials looked at: " + counts.join("; ") + "." : "No check found anything." }));
    if (d.method) more.push(el("p", { cls: "exh-muted exh-small", text: "How: " + d.method + "." }));
    if ((d.notes || []).length) more.push(el("ul", { cls: "exh-l-rxlist exh-small" }, d.notes.map(function (n) { return el("li", { text: n }); })));
    kids.push(el("details", { cls: "exh-l-rxmore" }, more));
    return el("section", { cls: "exh-l-rx", id: "exh-l-rx", "aria-label": "The last re-analysis" }, kids);
  }
  /* A spelling twin's fold (Sam, 2026-11-01: "what do you think about offering suggested titles based on what you
     see?"). Shown until it is accepted, dismissed for the visit, or the credential already carries a rename. */
  function listSuggest(r) {
    var L = listState(), sg = L.aiData && L.aiData.suggest && L.aiData.suggest[r.ut];
    if (!sg || (L.sgDone || {})[r.ut]) return null;
    var o = state.cs.overlay[r.ut] || {};
    if (o.title) return null;
    var end = listChainEnd(sg.to);
    if (end === r.ut) return null;
    return end === sg.to ? sg : { to: end, why: sg.why + "; " + sg.to + " itself now folds into " + end };
  }
  /* Where a title lands once the pending renames run: follow each credential's saved rename until one has none
     (Sam, 2026-11-01: "for the folds already accepted I would want to be sure that we can fold to better titles"). */
  function listChainEnd(t) {
    var seen = {}, ov = state.cs.overlay || {};
    for (var k = 0; k < 12 && t && !seen[t]; k++) {
      seen[t] = true;
      var nx = (ov[t] || {}).title;
      if (!nx || nx === t) break;
      t = nx;
    }
    return t;
  }
  /* A fold accepted and waiting for the reviewed apply: a rename and a merge confirm naming the same target. */
  function listPendingFold(r) {
    var o = state.cs.overlay[r.ut] || {};
    if (!o.title || !o.merge || o.merge !== o.title) return null;
    return { to: o.title, end: listChainEnd(o.title) };
  }
  /* Re-point a waiting fold at the end of its chain, so the dry-run never holds it as stale. */
  function listRepoint(r, pf) {
    var L = listState(), writes = [[FIELD_CRED_TITLE, pf.end], [FIELD_MERGE_CONFIRM, pf.end]];
    listCellNote("Re-pointing the fold of " + r.ut + " to " + pf.end + "…");
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return Promise.all(writes.map(function (w) { return saveCredRow(sess, r.ut, w[0], w[1]); }));
    }).then(function (rs) {
      if (!rs.every(function (x) { return x.ok; })) throw new Error("HTTP " + rs.map(function (x) { return x.status; }).join("/"));
      listApply(r, writes);
      L.cellNote = "Saved: " + r.ut + " now folds straight into " + pf.end + ".";
      redrawList();
    }).catch(function (e) {
      listCellNote(e && e.message === "signin" ? "Sign in as a reviewer to re-point a fold." : "The re-point of " + r.ut
        + " did not reach the reference (" + (e && e.message || "no answer") + "); nothing changed.");
    });
  }
  /* Accept writes the rename and the merge confirm naming the same target, the pair the rename dry-run needs to fold
     one credential's records into the other; a reviewed apply does the merge. The engine's suggestion slot draws the
     line and its two words, keeps what was accepted or dismissed for the visit, and marks the row changed; this hands it
     the write and the words for the status line (the List norms' step 1, onto Exhibits in S545). */
  function listSuggestAccept(r, sg) {
    var from = r.ut, writes = [[FIELD_CRED_TITLE, sg.to], [FIELD_MERGE_CONFIRM, sg.to]];
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return Promise.all(writes.map(function (w) { return saveCredRow(sess, from, w[0], w[1]); }));
    }).then(function (rs) {
      if (!rs.every(function (x) { return x.ok; })) throw new Error("HTTP " + rs.map(function (x) { return x.status; }).join("/"));
      listApply(r, writes);
      return { ok: true, words: "Saved: " + from + " folds into " + sg.to + ". The daily dry-run pairs them, and a reviewed apply merges the records." };
    }).catch(function (e) {
      return { ok: false, words: e && e.message === "signin" ? "Sign in as a reviewer to accept a fold." : "The fold of " + from
        + " did not reach the reference (" + (e && e.message || "no answer") + "); nothing changed." };
    });
  }
  function listCellSave(r, kind, inp, label) {
    var cur = credCurrent(r), value = inp.value.replace(/\s+/g, " ").trim(), before = inp.getAttribute("data-was"), sites = null;
    if (kind === "title" && !value) { inp.value = before; listCellNote("A title cannot be empty; " + before + " stays."); return Promise.resolve(); }
    if (kind === "sites") {
      var keep = {};
      cur.sites.forEach(function (x) { if (x.college) keep[x.site] = x.college; });
      sites = value.split(";").map(function (x) { return x.replace(/\s+/g, " ").trim(); }).filter(Boolean)
        .map(function (x) { return keep[x] ? { site: x, college: keep[x] } : { site: x }; });
      value = sites.map(function (x) { return x.site; }).join("; ");
    }
    if (value === before) { inp.value = before; return Promise.resolve(); }
    var name = listTitle(r);
    inp.setAttribute("aria-busy", "true");
    listCellNote("Saving the " + label.toLowerCase() + " of " + name + "…");
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      var writes = frWrites(r, kind, value, sites);
      return Promise.all(writes.map(function (w) { return saveCredRow(sess, r.ut, w[0], w[1]); })).then(function (rs) {
        if (!rs.every(function (x) { return x.ok; })) throw new Error("HTTP " + rs.map(function (x) { return x.status; }).join("/"));
        listApply(r, writes);
      });
    }).then(function () {
      inp.value = value; inp.setAttribute("data-was", value); inp.removeAttribute("aria-busy");
      listCellNote("Saved the " + label.toLowerCase() + " of " + name + (kind === "title" ? "; the daily run checks the new title for a collision." : "."));
    }).catch(function (e) {
      inp.value = before; inp.removeAttribute("aria-busy");
      listCellNote(e && e.message === "signin" ? "Sign in as a reviewer to save." : "The " + label.toLowerCase() + " of " + name
        + " did not reach the reference (" + (e && e.message || "no answer") + "); it is back as it was.");
    });
  }
  function listFlag(r) { var o = state.cs.overlay[r.ut]; return o && o.flag ? o.flag : ""; }
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
  /* A cell's drawer, by column name (the shared List draws the frame and the Close word). */
  function listDrawerFill(r, name, h) {
    var L = h.L, box = h.box, line = h.line, list = h.list, listFilterBy = h.filterBy;
    var ad = credAdopt(r) || {};
    if (name === "Title") {
      line("Local titles in MAP, as colleges typed them:");
      list((r.raw_variants || []).map(function (v) { return v.r + (v.c != null ? " (title " + Math.round(v.c * 100) + "%)" : "") + (v.q ? ", " + String(v.q).replace(/_/g, " ") : ""); }));
      var cl = listCertLink(r);
      if (cl && (cl.certs.length || (cl.unresolved || []).length)) {
        line(cl.relation === "aligned" ? "Aligned to this test: the college issues the course, and ASE issues only the test."
          : cl.certs.length > 1 ? (cl.rule === "any" ? "Holds any one of these certifications:" : "Holds all of these certifications:")
          : "Holds this certification:");
        list(cl.certs.map(function (id) {
          return [listCertName(id) + " (" + id + ") ", word("Show every exhibit with it", function () {
            L.cert = id; L.f = ""; L.open = null; L.limit = LIST_LIMIT; render(); }, { "aria-label": "Show every exhibit with " + listCertName(id) })];
        }));
        if ((cl.unresolved || []).length) line("Also names, not yet in the cert table: " + cl.unresolved.join("; ") + ".");
      }
      var om = listOutcomeHints(r), se = (listState().slo || {}).neighbors, sh = ((se && se[r.ut]) || {}).s || [];
      if (om.length) {
        line("Outcomes match, by the SLOs of distinct articulated courses (a hint, never a decision):");
        list(om.map(function (x) { return listOutcomeLabel(x) + ", similarity " + x.score.toFixed(2); }));
      }
      if (sh.length) {
        line("Alike through a shared course or identical SLO text, which is articulation evidence and never a hint:");
        list(sh.map(function (x) { return x[0] + ", similarity " + Number(x[1]).toFixed(2) + (x[3] === "text" ? ", identical text" : ", a shared course"); }));
      }
      // The title's drawer shows inside the side panel, whose editor sets the issuer and training sites.
    } else if (name === "Status" || name === "Confidence") {
      var dec = listDecision(r);
      if (dec && dec.status === STATUS_APPLIED) line("Applied: the reference now carries this title as an old name of " + dec.to + ".");
      else if (dec) line("Saved: " + (dec.fold ? "the fold into " : "the rename to ") + dec.to
        + " is the review. The apply runs it with no click from you.");
      else if (listStatus(r) === STATUS_FAMILY) line("Family set: " + listFamily(r) + ", from a person's decision. The title stays its own credential, adopted on its own.");
      else line(listStatus(r) === "Unreviewed" ? "No review stamp yet." : "Reviewed " + (stamp(r.curated_at) || "") + " by " +
        (listStatus(r) === "Cohort" ? "the cohort " + r.curated_by : "a person") + ".");
      var tags = r.audit_tags || {};
      if (Object.keys(tags).length) { line("The audit's tags:"); list(Object.keys(tags).map(function (k) { return k.replace(/_/g, " ") + ": " + tags[k]; })); }
      if (r.conf_title != null) line("Title confidence " + Math.round(r.conf_title * 100) + "%" + (r.conf_issuer != null ? ", issuer " + Math.round(r.conf_issuer * 100) + "%" : "") + ".");
    } else if (name === "CPL types") {
      line("Show every credential of a type:");
      box.appendChild(el("div", { cls: "exh-l-acts" }, (r.cpl_types || []).map(function (t) { return word(t, function () { listFilterBy(listColIndex("CPL types"), t); }); })));
    } else if (name === "Issuer") {
      var iss = credCurrent(r).issuer || "", norm = function (x) { return String(x || "").toLowerCase().replace(/[^a-z0-9]/g, ""); };
      if (!iss) { line("No issuer named."); }
      else {
        var same = state.cs.rows.filter(function (x) { return (credCurrent(x).issuer || "") === iss; });
        var alike = {};
        state.cs.rows.forEach(function (x) { var i2 = credCurrent(x).issuer || ""; if (i2 && i2 !== iss && norm(i2) === norm(iss)) alike[i2] = (alike[i2] || 0) + 1; });
        line(fmt(same.length) + (same.length === 1 ? " credential names " : " credentials name ") + iss + ".");
        box.appendChild(word("Show them all", function () { listFilterBy(listColIndex("Issuer"), iss); }));
        var ak = Object.keys(alike);
        if (ak.length) { line("Spelled another way:", "warn"); list(ak.map(function (k) { return k + " (" + alike[k] + ")"; })); }
      }
    } else if (name === "Training sites") {
      var sites = credCurrent(r).sites;
      if (!sites.length) line("No training site named.");
      else list(sites.map(function (x) { return x.site + (x.college ? ", " + x.college : ""); }));
    } else if (name === "Discipline (M-IDs)" || name === "Common SUBJ") {
      var arts = (r.articulations || []).filter(function (a) { return name !== "Common SUBJ" || a.sys === "M-ID"; });
      if (!arts.length) line("No M-ID or C-ID carries it yet.");
      list(arts.map(function (a) {
        var loc = (a.local || []).map(function (l) { return [l.subj, l.num].filter(Boolean).join(" ") + (l.t ? " " + l.t : "") +
          (l.colleges && l.colleges.length ? " (" + l.colleges.join(", ") + ")" : ""); }).join("; ");
        return (a.sys ? a.sys + " " : "") + a.cid + (a.title ? ", " + a.title : "") + (a.disc ? " · " + a.disc : "") + (loc ? ". Local: " + loc : "");
      }));
      if (name === "Common SUBJ" && listSubj(r)) box.appendChild(word("Show every credential under " + listSubj(r).split(",")[0], function () { listFilterBy(listColIndex("Common SUBJ"), listSubj(r).split(",")[0]); }));
    } else if (name === "CIP family (from TOP)") {
      if (!listCip(r)) line("No CIP family read.");
      else { line("Read from TOP, so a hint, never a determination."); box.appendChild(word("Show every credential in " + listCip(r), function () { listFilterBy(listColIndex("CIP family (from TOP)"), listCip(r)); })); }
    } else if (name === "Colleges") {
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
    } else if (name === "MAP titles") {
      var xs = ad.x || [];
      if (!xs.length) line("No MAP exhibit is read for it.");
      list(xs.map(function (x) { return [el("a", { href: mapUrl(x[0]), target: "_blank", rel: "noopener", text: x[0] }), " " + x[1] + (x[2] != null ? ", " + fmt(x[2]) + " units" : "")]; }));
    } else if (name === "Basis") {
      var sw = listStatewideExhibits(r);
      if (!sw.length) line("No statewide exhibit is part of it, so it counts as local.");
      else {
        line("Based on statewide: it includes " + (sw.length === 1 ? "this statewide exhibit" : "these statewide exhibits")
          + ", which colleges adopt or adapt (CCC Collaborative rows in MAP).");
        list(sw.map(function (x) { return [el("a", { href: mapUrl(x.id), target: "_blank", rel: "noopener", text: x.id }), ", " + fmt(x.n)
          + (x.n === 1 ? " credit recommendation" : " credit recommendations")]; }));
      }
    }
  }
  /* The List is drawn by the Catalog Commons' shared engine, commons_list.js (Sam, 2026-11-01: "I want one now for each
     of our Catalog Commons groups"); this spec is what makes it the Exhibits List. The engine loads on the List's first
     open, as commons_progress.js does for the Progress views. */
  var LIST_ENGINE = null;
  function listSpec() {
    return {
      prefix: "exh-l-", frPrefix: "exh-fr-",
      cls: { w: "exh-w", muted: "exh-muted", small: "exh-small", note: "exh-note", search: "exh-search", on: "exh-view-on", vh: "exh-vh", empty: "exh-empty" },
      noun: { many: "credentials", region: "Every credential, A to Z", keyHeader: "Credential key", file: "exhibits-list",
        placeholder: "Title, local title, issuer, training site, college, district, SWP region, ASCCC area, discipline, subject or CPL type", findLabel: "Find in the list" },
      state: listState, rows: function () { return state.cs.rows || []; }, cols: listCols,
      panel: { label: function (r) { return "Exhibit: " + listTitle(r); }, body: listPanelBody },
      trail: { home: [["CPL Commons", "#commons"]], name: "Exhibits" },
      key: function (r) { return r.ut; }, title: listTitle, render: function () { render(); }, session: session,
      head: function (wrap) {
        var L = listState(), cs = state.cs;
        credDash(wrap);
        wrap.appendChild(viewsNav());
        if (cs.error) { wrap.appendChild(el("p", { cls: "exh-empty", text: "The credentials could not be read (" + cs.error + ")." })); return false; }
        if (!cs.rows) { wrap.appendChild(el("p", { cls: "exh-empty", text: "Reading the credentials…" })); return false; }
        if (L.collisions == null) {
          L.collisions = [];
          fetch(COLLISIONS_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { L.collisions = (d && d.collisions) || []; if (state.view === "list") render(); }).catch(function () {});
        }
        if (!L.sloP) listSloLoad().then(function () { if (state.view === "list") render(); });
        if (!CPJ.data && !CPJ.loading && !CPJ.error) listCplAiLoad().then(function () { if (state.view === "list") render(); });
        if (L.f === "left") {
          if (!LEFT.by && !LEFT.error) listLeftLoad().then(function () { if (state.view === "list") render(); });
          wrap.appendChild(listLeftNote());
        }
        return true;
      },
      filters: LIST_FILTERS,
      filterPass: function (r, L) {
        if (L.f === "unreviewed" && listStatus(r) !== "Unreviewed") return false;
        if (L.f === "low" && !(r.conf_title != null && r.conf_title < 0.6)) return false;
        if (L.f === "flagged" && !r.quality_flag) return false;
        if (L.f === "bare" && (r.articulations || []).length) return false;
        if (L.f === "nosubj" && listSubj(r)) return false;
        if (L.f === "mine" && !listFlag(r)) return false;
        if (L.f === "outcomes" && !listOutcomeHints(r).length) return false;
        if (L.f === "waiting" && !listPendingFold(r)) return false;
        if (L.f === "statewide" && listBasis(r) !== "Statewide") return false;
        if (L.f === "local" && listBasis(r) !== "Local") return false;
        if (L.f === "left" && !listLeft(r).length) return false;
        if (L.f === "cplai" && !listCplAi(r).length) return false;
        if (L.cert && listCerts(r).indexOf(L.cert) === -1) return false;
        if (L.fam && !(famOf(r.ut) && famOf(r.ut).name === L.fam)) return false;
        return true;
      },
      /* A filter whose data is still unread shows no count, never a 0 (S343): the suggested folds come with the AI
         sort's file, the outcomes matches with theirs, your flags and the waiting folds with today's saves. */
      uncounted: function (id) {
        var L = listState();
        if (id === "suggested") return !L.aiData;
        if (id === "outcomes") return !(L.slo && L.slo.neighbors);
        if (id === "mine" || id === "waiting") return state.cs.overlayOk !== true;
        if (id === "left") return !LEFT.by;
        if (id === "cplai") return !CPJ.data;
        return false;
      },
      onFilter: function (id, api) {
        if (id === "outcomes") return listSloLoad();
        if (id === "left") return listLeftLoad();
        if (id === "cplai") return listCplAiLoad();
        return id === "suggested" && !listState().aiData ? api.aiLoad() : null;
      },
      hay: function (r) {
        var cur = credCurrent(r);
        // The local titles and other issuers too, as the retired Credentials view's search found them.
        return [r.ut, listTitle(r), cur.issuer, (r.issuers || []).join(" "), cur.sites.map(function (x) { return x.site; }).join(" "), (r.cpl_types || []).join(" "),
          r.disc_modal, listSubj(r), r.top_modal, r.quality_flag].join(" ") + " | " + listWhere(r) + " | " + listCertWords(r)
          + " | " + (r.raw_variants || []).map(function (v) { return v.r; }).join(" | ")
          // A title it carried before a rename or a merge (Sam, 2026-11-11: an old title stays a search alias).
          + " | " + akaOf(r.ut).join(" | ")
          // Its family and the tests it names, as search aliases ("ASE A4" finds every bundle with A4).
          + " | " + (famOf(r.ut) ? famOf(r.ut).name + " | " + famOf(r.ut).aliases.join(" | ") : "")
          + " | " + listCplAi(r).map(function (c) { return "CPL-AI " + c.title; }).join(" | ");
      },
      afterBar: function (wrap) {
        var L = listState(), cs = state.cs;
        if (cs.overlayOk === false) wrap.appendChild(el("p", { cls: "exh-muted exh-small",
          text: "Today's saves could not be read, so the list shows the reference as of " + (stamp(cs.generated) || "the last daily run") + "." }));
        // The comments box (Sam, 2026-11-01: "add in a comments box to the reanalysis routine where I can add my
        // observations or concerns or opportunities to better inform the reanalysis"). Kept across repaints this visit.
        var box = el("textarea", { id: "exh-l-note", cls: "exh-l-in exh-l-ta", rows: "3", maxlength: "4000",
          placeholder: "Observations, concerns or opportunities: what you were fixing, a pattern you noticed, titles that should fold, an issuer that looks wrong" });
        box.value = L.comments || "";
        box.addEventListener("input", function () { L.comments = box.value; });
        wrap.appendChild(el("div", { cls: "exh-l-re" }, [
          el("label", { cls: "exh-l-relabel", "for": "exh-l-note", text: "Your comments for the re-analysis" }),
          box,
          el("div", { cls: "exh-l-acts" }, [word(L.busy ? "Working…" : "Re-analyze my changes", listReanalyze),
            el("span", { cls: "exh-muted exh-small", text: L.changed.length
              ? fmt(L.changed.length) + " changed this visit go with it" : "With no change this visit, it looks over everything you changed since its last pass" })])]));
        var rx = listReanalysisPanel();
        if (rx) wrap.appendChild(rx);
      },
      beforeTable: function (wrap) {
        var L = listState();
        // The waiting folds, told plainly (#3110 step 2): saved, applied without a click, and gone from here once applied.
        // Worded to hold whether a session or a schedule starts the apply.
        if (L.f === "waiting") wrap.appendChild(el("p", { cls: "exh-note", id: "exh-l-waitline",
          text: "These folds are saved, the apply runs them without a click from you, and each one leaves this list once it is applied." }));
        if (L.f === "outcomes") {
          var sd = L.slo, sc = (sd && sd.counts) || {};
          wrap.appendChild(el("p", { cls: "exh-note", id: "exh-l-sloline", text: sd === false
            ? "The outcomes matches could not be read; the daily run writes them."
            : !sd ? "Reading the outcomes matches…"
            : "Showing credentials whose articulated courses' SLOs match a credential in another group, at a similarity of "
              + (sd._params && sd._params.threshold || 0.5) + " or more through distinct courses. SLOs are on file for "
              + fmt(sc.colleges) + (sc.colleges === 1 ? " college" : " colleges") + " so far, reaching " + fmt(sc.credentials_reached)
              + " credentials. A hint, never a decision: select a row and Move it if the match is right." }));
        }
        if (L.fam) wrap.appendChild(el("p", { cls: "exh-note", id: "exh-l-famline" }, ["Showing the family " + famWords(L.fam)
          + ". Each title stays its own credential, adopted on its own. ", word("Clear", function () { L.fam = null; L.limit = LIST_LIMIT; render(); })]));
        if (L.cert) wrap.appendChild(el("p", { cls: "exh-note", id: "exh-l-certline" }, ["Showing every exhibit that holds or is aligned to "
          + listCertName(L.cert) + ". ", word("Clear", function () { L.cert = null; L.limit = LIST_LIMIT; render(); })]));
      },
      titleSubs: function (r, L, aiOn) {
        var out = [], o = state.cs.overlay[r.ut] || {}, col = listCollision(r);
        var pf = listPendingFold(r);
        if (pf) out.push(el("span", { cls: "exh-l-sub exh-l-sg" }, pf.end === pf.to
          ? ["folds " + r.ut + " into this credential; waits for the reviewed apply"]
          : [pf.to + " now folds into " + pf.end + ", so this fold would stall. ",
            word("Re-point to " + pf.end, function () { listRepoint(r, pf); }, { "aria-label": "Re-point the fold of " + r.ut + " to " + pf.end })]));
        else if (o.title) out.push(el("span", { cls: "exh-l-sub", text: "renamed from " + r.ut + "; pending the apply" }));
        var fm = famOf(r.ut);
        if (fm) out.push(el("span", { cls: "exh-l-sub exh-l-fam" }, ["Family: ", word(famWords(fm.name), function () {
          L.fam = fm.name; L.f = ""; L.open = null; L.limit = LIST_LIMIT; render(); }, { "aria-label": "Show the family " + fm.name })]));
        if (col) out.push(el("span", { cls: "exh-l-sub", text: "collides with " + (col.proposed_new_title || "an existing title") }));
        var om = listOutcomeHints(r);
        if (om.length) out.push(el("span", { cls: "exh-l-sub exh-l-om", text: "Outcomes match: "
          + om.slice(0, SLO_SHOW).map(listOutcomeLabel).join("; ") + (om.length > SLO_SHOW ? "; " + (om.length - SLO_SHOW) + " more" : "") }));
        var cai = listCplAiLine(r);
        if (cai) out.push(cai);
        return out;
      },
      drawer: listDrawerFill,
      // The engine draws a spelling twin's fold under its title (with the AI sort on, or under Suggested folds), owns the
      // filter ids suggested, changed and selected, and keeps the visit's changed set that Re-analyze sends.
      suggest: { get: function (r) { var sg = listSuggest(r); return sg ? { text: "fold into " + sg.to, why: sg.why, to: sg.to } : null; },
        verb: "Accept", accept: listSuggestAccept, label: function (r, sg) { return "Fold " + r.ut + " into " + sg.to; } },
      changed: true,
      flag: { get: listFlag, set: listSetFlag },
      edit: {
        fields: [{ id: "exh-l-t", label: "Title", key: "title" }, { id: "exh-l-i", label: "Issuer", key: "issuer" },
          { id: "exh-l-s", label: "Training sites, separated by ;", key: "sites", ph: "Site; Site" }],
        draft: function (r) {
          var cur = credCurrent(r);
          return { title: listTitle(r), issuer: cur.issuer || "", sites: cur.sites.map(function (x) { return x.site; }).join("; ") };
        },
        save: listSave,
        // A keystroke in the title or issuer box clears an earlier check; Check alignment writes a new one.
        onInput: function (r, key, d) { if (key === "title" || key === "issuer") d._hint = ""; },
        extra: function (r, d, word) {
          return [word("Check alignment", function () { listCheckAlignment(r, d); }, { "aria-label": "Check the alignment of the title and issuer typed for " + listTitle(r) })];
        }
      },
      cellSave: listCellSave,
      fr: {
        cols: FR_COLS, defaultCol: "issuer", rowHeader: "Credential", one: "credential", many: "credentials",
        wholeLabel: function (col) { return col === "sites" ? "Whole site name" : "Whole cell"; },
        change: function (r, col, F, api) {
          var cur = credCurrent(r), before, after, sites = null;
          if (col === "title") { before = listTitle(r); after = api.frClean(api.frSwap(before, F)); return { before: before, after: after, refuseEmpty: true }; }
          if (col === "issuer") { before = cur.issuer || ""; after = api.frClean(api.frSwap(before, F)); return { before: before, after: after }; }
          before = cur.sites.map(function (x) { return x.site; }).join("; ");
          sites = [];
          cur.sites.forEach(function (x) {
            var s = api.frClean(api.frSwap(x.site, F));
            if (s) sites.push(x.college ? { site: s, college: x.college } : { site: s });
          });
          after = sites.map(function (x) { return x.site; }).join("; ");
          return { before: before, after: after, sites: sites, prevSites: cur.sites };
        },
        save: function (sess, r, col, value, sites) {
          var writes = frWrites(r, col, value, sites);
          return Promise.all(writes.map(function (w) { return saveCredRow(sess, r.ut, w[0], w[1]); })).then(function (rs) {
            if (rs.every(function (x) { return x.ok; })) { listApply(r, writes); return true; }
            return false;
          });
        },
        savedTail: function (col, n) { return col === "title" && n ? " The daily run checks each new title for a collision; a reviewed apply renames it in the reference." : ""; }
      },
      groups: {
        url: AI_SORT_URL, none: NO_GROUP, item: "title",
        saved: function (r) { return ((state.cs.overlay || {})[r.ut] || {}).group || ""; },
        save: function (keys, value) {
          var cs = state.cs;
          return session().then(function (sess) {
            if (!sess) throw new Error("signin");
            return saveCredRows(sess, FIELD_LIST_GROUP, keys.map(function (u) { return [u, value]; }));
          }).then(function (x) {
            if (!x.ok) throw new Error("HTTP " + x.status);
            keys.forEach(function (u) { (cs.overlay[u] = cs.overlay[u] || {}).group = value; });
          });
        },
        facts: function (members) {
          var colls = {}, sw = 0;
          members.forEach(function (m) { credColleges(m).forEach(function (c) { colls[c] = 1; }); if (listBasis(m) === "Statewide") sw++; });
          var nc = Object.keys(colls).length;
          return fmt(nc) + " college" + (nc === 1 ? "" : "s") + (sw ? ", " + fmt(sw) + " based on statewide" : "");
        },
        extra: { test: listSuggest, words: function (n) { return fmt(n) + " suggested fold" + (n === 1 ? "" : "s"); } },
        sortLine: function (L) {
          return "AI sort: like with like, the groups A to Z. A group gathers titles that share their subject words once level words (Beginning, 1, II, Advanced) "
            + "are set aside, with discipline and issuer weighing in; built " + (stamp(L.aiData._built_at) || L.aiData._reference_generated_at && stamp(L.aiData._reference_generated_at) || "daily")
            + ". " + (L.aiData.counts && L.aiData.counts.suggested_folds ? fmt(L.aiData.counts.suggested_folds) + " spelling twins carry a suggested fold. " : "")
            + "Select rows to move them to another group; Keep this group fixes a group and its name, and a rename to another group's name joins the two. "
            + "What you keep or move holds through every nightly rebuild. Press a header to sort by it instead.";
        }
      }
    };
  }
  function listApi() {
    if (!LIST_ENGINE && window.CPL_COMMONS_LIST) LIST_ENGINE = window.CPL_COMMONS_LIST.create(listSpec());
    return LIST_ENGINE;
  }
  function renderList(wrap) {
    if (listApi()) {
      LIST_ENGINE.render(wrap);
      var f = state.listFocus && document.getElementById(state.listFocus);
      if (f) { state.listFocus = null; f.focus(); }
      return;
    }
    wrap.appendChild(viewsNav());
    if (state.listFailed) { wrap.appendChild(el("p", { cls: "exh-empty", text: "The list could not be loaded; reload the tab to try again." })); return; }
    wrap.appendChild(el("p", { cls: "exh-empty", text: "Reading the list…" }));
    ensureListEngine();
  }
  /* The shared List engine, loaded once: the List draws with it and the Queue counts the List's filters with it. */
  function ensureListEngine() {
    if (window.CPL_COMMONS_LIST || state.listLoading || state.listFailed || !window.CPL_TABS || !window.CPL_TABS.loadScript) return;
    state.listLoading = true;
    window.CPL_TABS.loadScript("commons_list.js", "CPL_COMMONS_LIST", function () {
      state.listLoading = false;
      if (!window.CPL_COMMONS_LIST) state.listFailed = true;
      if (state.view === "list" || state.view === "queue") render();
    });
  }
  function redrawList() { if (listApi()) LIST_ENGINE.redraw(); else render(); }
  /* ── The side panel (Sam, 2026-11-03: "when you click on an exhibit in the list and open the side bar it shows a list
     (like you've designed) of the folded members"; the mock https://claude.ai/artifact/PJKHZ8QwfyfbRW7U6qwBV4, after
     SkyView's course outline). One line of what the credential is, its members (the MAP exhibits folded under it,
     kb/exhibits_adoption.json's x), and the rest folded below: the credit each college awards, the issuer and training
     sites, and who could adopt it. The issuer and training sites are edited here (credEditor: a site for a college or
     any college, the names already in the reference offered as you type); with the credit lines, each college's own
     exhibit and MAP's Request Quick Adopt line, the panel does what the Credentials view did, and that view retired
     (the List norms, The List is the workspace). Each fold
     keeps its place for the visit, so a sort, an added site or a save does not close it. */
  /* The titles in the reference MAP no longer carries (the auditor's stale_kb_entry, never an unclassified title still in
     MAP), by the credential they fold under: the Commons' keep-or-retire count opens this filter (Sam, 2026-11-04: "the
     links on all surfaces should open to the filtered view of the job needed"). Read only when it is chosen. */
  var LEFT = { by: null, error: null, p: null };
  function listLeftLoad() {
    if (LEFT.p) return LEFT.p;
    LEFT.p = fetch("kb/exhibit_audit/latest.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("kb/exhibit_audit/latest.json answered " + r.status);
      return r.json();
    }).then(function (d) {
      var by = {};
      ((d && d.title_cards) || []).forEach(function (c) {
        var t = c.tags || [];
        if (t.indexOf("stale_kb_entry") >= 0 && t.indexOf("unclassified_in_map") < 0) (by[c.unified_title] = by[c.unified_title] || []).push(String(c.raw_title || "").trim());
      });
      LEFT.by = by;
    }, function (e) { LEFT.error = String(e && e.message || e); });
    return LEFT.p;
  }
  function listLeft(r) { return (LEFT.by && LEFT.by[r.ut]) || []; }
  function listLeftNote() {
    if (LEFT.error) return el("p", { cls: "exh-empty", role: "alert", text: LEFT.error + ", so this filter shows nothing. Reload the tab to try again." });
    if (!LEFT.by) return el("p", { cls: "exh-muted exh-small", role: "status", text: "Reading the auditor's titles for this filter…" });
    var names = Object.keys(LEFT.by), n = names.reduce(function (t, k) { return t + LEFT.by[k].length; }, 0);
    return el("p", { cls: "exh-muted exh-small", text: fmt(n) + (n === 1 ? " old title no MAP exhibit uses any more sits" : " old titles no MAP exhibit uses any more sit") +
      " in the reference, under " + fmt(names.length) + (names.length === 1 ? " credential" : " credentials") + " below. Nothing breaks while they stay. " +
      "Open a credential to see its titles; a curator retires each, or keeps one a college may enter again." });
  }
  function listPanelBody(r, h) {
    var el2 = h.el, ad = credAdopt(r), cur = credCurrent(r), st = credStudents(r), art = credArt(r), could = credCould(r);
    var cip = listCip(r), n = r.raw_count || 0;
    // The engine's shared parts (commons_list.js h.title, h.meta, h.heading, h.table, h.fold), so every List's panel reads alike.
    var out = [h.title(listTitle(r)), h.meta([cur.issuer || "No issuer named", cip ? "CIP " + cip : "", n + " MAP title" + (n === 1 ? "" : "s"),
      art.length + " college" + (art.length === 1 ? "" : "s") + " articulate" + (art.length === 1 ? "s" : ""),
      could.length ? could.length + " could adopt" : "", "Students: " + st.word])];
    // Its family (#3117), beside the issuer the fold may have set (#3116): the family names the set, the fold line the issuer.
    var famName = listFamily(r);
    if (famName) out.push(el2("p", { cls: "exh-muted exh-small exh-pn-fam", text: "Family: " + famName
      + ". This title stays its own credential, adopted on its own." }));
    var gone = listLeft(r);
    if (gone.length) {
      out.push(h.heading(gone.length === 1 ? "A title that has left MAP" : "Titles that have left MAP"));
      out.push(el2("p", { cls: "exh-muted exh-small", text: "The reference still folds " + (gone.length === 1 ? "this title" : "these titles") +
        " under this credential, and no MAP exhibit uses " + (gone.length === 1 ? "it" : "them") + " any more. Nothing breaks while " + (gone.length === 1 ? "it stays" : "they stay") + "; a curator keeps or retires each." }));
      out.push(el2("ul", { cls: "exh-pn-left" }, gone.map(function (t) { return el2("li", { text: t }); })));
    }
    var cai = listCplAi(r);
    if (cai.length) {
      out.push(h.heading("CPL-AI recommendations"));
      out.push(el2("ul", { cls: "exh-pn-ul" }, cai.map(function (c) {
        return el2("li", null, [word(c.title, function () { openCplAi(c.code); }, { "aria-label": "Open " + c.title + " in the CPL-AI recommendations" }),
          (c.kind === "related" ? " (a related certification)" : "") + ": " + fmt(c.pairs) + " pairs, " + fmt(c.strong) + " with Strong evidence; "
          + fmt(c.strong_colleges) + (c.strong_colleges === 1 ? " college holds" : " colleges hold") + " a Strong evidence course."]);
      })));
    }
    var members = ad && Array.isArray(ad.x) ? ad.x.map(function (x) { return { id: x[0], title: x[1], units: x[2] }; }) : [];
    out.push(h.heading("Members"));
    if (!members.length) {
      out.push(el2("p", { cls: "exh-muted exh-small", text: state.cs.adopt ? "MAP records no exhibit under this name."
        : state.cs.adoptErr ? "The exhibits under this name could not be read." : "Reading the exhibits…" }));
    } else {
      // Each exhibit's number links to it in MAP; the table opens A to Z by local title.
      out.push(h.table({ id: "members", label: "Members of " + listTitle(r), sort: { col: 1, dir: 1 },
        note: "The MAP exhibits folded under this name, as colleges entered them. Press a header to sort; an exhibit's number opens it in MAP.",
        cols: [["id", "Exhibit"], ["title", "Local title"], ["units", "Units", true]],
        rows: members,
        cell: function (m, k) {
          if (k !== "id") return m[k];
          return el2("a", { href: mapUrl(m.id), target: "_blank", rel: "noopener", cls: "exh-pn-id", text: m.id, "aria-label": m.id + " in MAP (opens a new tab)" });
        } }));
    }
    // The issuer and training sites, edited in place.
    out.push(h.fold("edit", "Who issues it, and where it is trained: " + (cur.issuer || "no issuer named") + "; "
      + (cur.sites.length ? cur.sites.length + " training site" + (cur.sites.length === 1 ? "" : "s") : "no training site named"),
      credEditor(r, credUi(r.ut))));
    // The rest, folded: its credit, what each college awards (and the exhibit it built), and who could adopt it.
    var more = [];
    var awards = adoptMap(ad && ad.a), names = art.slice().sort(function (a, b) {
      return ((awards[b] || [])[0] || 0) - ((awards[a] || [])[0] || 0) || a.localeCompare(b); });
    more.push(el2("h3", { cls: "exh-pn-q", text: "What credit it carries" }));
    var facts = [[r.ccc_rec ? "Statewide recommendation" : "Credit recommendation", r.ccc_rec || r.gen_rec || "None in MAP"],
      ["CPL type", (r.cpl_types || []).join(", ")], ["Discipline", r.disc_modal || ""]];
    var ids = (r.articulations || []).map(function (a) { return (a.sys ? a.sys + " " : "") + a.cid + (a.title ? ", " + a.title : ""); });
    if (ids.length) facts.push(["Courses", ids.slice(0, 3).join("; ") + (ids.length > 3 ? "; and " + (ids.length - 3) + " more" : "")]);
    facts.forEach(function (f) { if (f[1]) more.push(el2("p", { cls: "exh-small" }, [el2("span", { cls: "exh-muted", text: f[0] + ": " }), f[1]])); });
    if (ad && ad.p != null) more.push(el2("p", { cls: "exh-small", text: "The median articulating college awards " + h.fmt(ad.p) + " units." }));
    more.push(names.length ? el2("ul", { cls: "exh-pn-ul" }, names.map(function (nm) {
      var a = awards[nm], lines = a ? (a[1] || []).map(function (x) { return x[0] + (x[1] ? ", " + x[1] : ""); }).join("; ") : "";
      var li = el2("li", null, [el2("b", { text: nm }), a ? ", " + h.fmt(a[0]) + " units" + (lines ? ": " + lines : "")
        : ", articulates it; MAP lists no credit recommendation line for it"]);
      // The exhibit it built, which another college may Request Quick Adopt from.
      var own = builtBy(r, nm);
      if (own.length) {
        li.appendChild(document.createTextNode(". Its exhibit in MAP: "));
        own.slice(0, 3).forEach(function (id, k) {
          if (k) li.appendChild(document.createTextNode(", "));
          li.appendChild(el2("a", { href: mapUrl(id), target: "_blank", rel: "noopener", text: id, "aria-label": nm + "'s exhibit " + id + " in MAP" }));
        });
      }
      return li;
    })) : el2("p", { cls: "exh-muted exh-small", text: "No college articulates it yet." }));
    if (could.length || (ad && ad.w) || state.cs.adoptErr) more.push(el2("h3", { cls: "exh-pn-q", text: "Who could adopt it" }));
    if (could.length) {
      var cmap = adoptMap(ad && ad.c);
      more.push(el2("ul", { cls: "exh-pn-ul" }, could.map(function (nm) {
        var cs = (cmap[nm] || []).map(function (x) { return x[0] + (x[2] != null ? " (" + h.fmt(x[2]) + " units)" : ""); }).join(", ");
        return el2("li", null, [el2("b", { text: nm }), cs ? " already teaches " + cs + "." : ""]);
      })));
    }
    if (ad && ad.w) more.push(el2("p", { cls: "exh-small exh-muted", text: h.fmt(ad.w) + (ad.w === 1 ? " college teaches" : " colleges teach")
      + " a course under an identity that joins too many courses to name them; curating the identity names them." }));
    if (state.cs.adoptErr) more.push(el2("p", { cls: "exh-small exh-muted", text: "Who could adopt it could not be read." }));
    // MAP's own line for the credential: its exhibits and the way to Request Quick Adopt (map_links.js).
    var ML = window.CPL_MAP_LINKS;
    if (ML && typeof ML.node === "function") more.push(el2("p", { cls: "exh-small" }, [ML.node(r.ut)]));
    out.push(h.fold("more", "More about this exhibit: its credit and who could adopt it", more));
    return out;
  }
  function listRows() { return listApi() ? LIST_ENGINE.rows() : []; }
  function listCsv(rows) { return listApi() ? LIST_ENGINE.csv(rows) : ""; }
  function listCellNote(text) {
    if (listApi()) { LIST_ENGINE.cellNote(text); return; }
    listState().cellNote = text;
  }

  function viewsNav() {
    function v(id, label, n) {
      var kids = [label + " ", el("span", { cls: "exh-n", text: n == null ? "" : fmt(n) })];
      if (state.view === id) return el("span", { cls: "exh-view-on", "aria-current": "page" }, kids);
      var b = el("button", { type: "button", cls: "exh-w" }, kids);
      b.addEventListener("click", function () {
        state.view = id; state.note = "";
        render();
        if (id === "list" || id === "progress" || id === "queue") loadCredentials().then(render);
        if (id === "requests") loadRequests().then(render);
        if (id === "cpl-ai") loadCplAi();
      });
      return b;
    }
    return el("nav", { cls: "exh-views", "aria-label": "Views" }, [
      v("queue", "Queue", null),
      v("progress", "Progress", null),
      v("review", "Review", state.data ? stepCount("") : null),
      v("list", "List", state.cs.rows ? state.cs.rows.length : null),
      v("rules", "Rules", state.rq.rows ? requestsWaitingOnYou() : null),
      v("requests", "Requests", state.pq.rows ? requestsOpen() + submissionsOpen() : null),
      v("cpl-ai", "CPL-AI recommendations", cplAiCount()),
      el("a", { href: "#exhibit-adoption", text: "The college matrix, in Exhibit Adoption" })]);
  }

  /* ── Progress: the reference opened, in the CPL Commons mock's shape ──
     Sam locked the CPL Commons mock on 2026-11-02 (S552), the Exhibits artboard with it: a progress line, Needs attention
     with an action each, and the three questions with every count over one denominator. The page is drawn by the
     Commons' shared renderer, commons_page.js, so the CR Reference, Subjects and CPL Pathways take the same page next.
     It reads what the tiles read: the Commons' row and run log (loadCommons) and the reference's credentials
     (credCounts), plus the tab's own queues, so the Commons card, the tiles and this page cannot disagree. The headline
     is the Commons row's pair, a title with a review stamp (Sam's keep, Sheets 107 and 108). The tab still opens on
     Review; the Common Exhibits card opens #exhibits/progress. */
  function progressSpec() {
    var cm = state.cm || {}, row = cm.row || null, Q = cm.Q || null, f = row && row.facts || {};
    var pair = row && Array.isArray(row.pair) ? row.pair[0] : null;
    var reading = !cm.done;
    var to = function (href) {
      var t = cmTarget(href);
      if (t && t.route) return function () { cmGo(t.route, t.filter); };
      return null;
    };
    var hrefOf = function (href) { var t = cmTarget(href); return t && !t.route ? t.href : null; };
    var calls = Q && Array.isArray(Q.calls) ? Q.calls : [];
    var open = calls.filter(function (c) { return !(c.answer && c.answer.words); });
    var recently = Q && Array.isArray(Q.changes) && Q.changes[0] && Q.changes[0].text
      ? "Recently: " + String(Q.changes[0].text).trim().replace(/^([^.]*\.)(?=\s|$)[\s\S]*$/, "$1") : "";
    var split = f.person != null && f.cohort != null
      ? fmt(f.person) + " by a person, " + fmt(f.cohort) + " by a procedure in force or a session cohort." : "";
    var callWords = !Q ? "" : open.length
      ? (open.length === 1 ? "One decision waits on " : fmt(open.length) + " decisions wait on ") + DECIDER + "."
      : "No decisions wait on " + DECIDER + ".";

    var items = [];
    if (state.data) {
      var held = stepCount("") - stepCount(CONFLICT) - stepCount(SWEEP);
      items.push({ n: held, words: held === 1 ? "title the nightly run held for a curator." : "titles the nightly run held for a curator.",
        action: { words: "Review them", go: function () { cmGo("held"); } } });
      var conf = stepCount(CONFLICT);
      items.push({ n: conf, words: conf === 1 ? "saved title disagrees with one a person approved." : "saved titles disagree with one a person approved.",
        action: { words: "Decide them", go: function () { cmGo("conflict"); } } });
    } else if (state.error) items.push({ n: null, words: "held titles: the review file could not be read" });
    if (state.sw.data) {
      var sw = sweepShown("").length;
      items.push({ n: sw, words: sw === 1 ? "title in the reference to take another look at, to fold or correct."
        : "titles in the reference to take another look at, to fold or correct.",
        action: { words: "Take another look", go: function () { cmGo("another-look"); } } });
    }
    (row && row.issues || []).forEach(function (i) {
      if (i.n == null) return;
      /* The held and conflict queues are counted live above once the review file is read; the row's copies are
         the nightly run's, the same titles, so listing both would count them twice (S561). */
      if (state.data && /\/(held|conflict)$/.test(i.open || "")) return;
      var go = to(i.open), href = hrefOf(i.open);
      /* The owner reads as who settles it: "a curator (retire or keep)" says "for a curator to retire or keep". */
      var own = /^(.+?) \((.+)\)$/.exec(i.owner || "");
      items.push({ n: i.n, words: i.words + (own ? ", for " + own[1] + " to " + own[2] + "." : i.owner ? ", for " + i.owner + "." : "."),
        action: { words: "Review the " + fmt(i.n), go: go, href: go ? null : href } });
    });
    if (state.rq.rows) {
      var rq = requestsWaitingOnYou();
      items.push({ n: rq, words: rq === 1 ? "rule built and switched off, waiting for you to turn it on." : "rules built and switched off, waiting for you to turn them on.",
        action: { words: "Open the rules", go: function () { cmGo("rules"); } } });
    }
    if (state.pq.rows) {
      var pq = requestsOpen();
      items.push({ n: pq, words: (pq === 1 ? "public request" : "public requests") + " to prioritize a credential's review, for the Initiative to route to a college or the statewide list; the count is the signal and no reply is owed (Sam, Sheet 162).",
        action: { words: "Read them", go: function () { cmGo("requests"); } } });
    } else if (state.pq.error && state.pq.error !== "no session") items.push({ n: null, words: "public requests to prioritize a credential: could not be read (" + state.pq.error + ")" });
    if (state.cs.rows && submissionsOpen()) {
      var cs = submissionsOpen();
      items.push({ n: cs, words: (cs === 1 ? "credential the public added, waiting" : "credentials the public added, waiting") + " for a reviewer to verify, merge or decline; nothing shows in the Catalog until verified (Sam, 2026-11-06).",
        action: { words: "Decide them", go: function () { cmGo("requests"); } } });
    }
    open.forEach(function (c) {
      items.push({ n: 1, words: "decision for " + DECIDER + ": " + (c.title || "an open call") + ".",
        action: c.link && /^https:\/\//.test(c.link) ? { words: "Open the decision sheet", href: c.link } : null });
    });

    var procs = row && (row.procedures || []).filter(function (p) { return p.n != null; })[0];
    var sheet = calls.filter(function (c) { return c.link && /^https:\/\//.test(c.link); }).slice(-1)[0];
    /* The views row above already names Review, List and Rules; these are the two it does not. */
    var links = [
      { words: "How it is kept" + (procs ? ": " + fmt(procs.n) + " procedures" : ""), go: function () { cmGo("list"); } },
      sheet ? { words: "Decision record", href: sheet.link } : null
    ].filter(Boolean);

    var cc = credCounts();
    var cred = function (label) { return { label: label, n: null, go: function () { cmGo("list"); } }; };
    var row3 = function (label, n) { var r = cred(label); r.n = n; return r; };
    var groups = [
      { q: "What is it called?", rows: [row3("Issuer named", cc.iss), row3("Training site named", cc.site), row3("Field of study (CIP) assigned", cc.field)] },
      { q: "What credit does it carry?", rows: [row3("Credit recommendation in MAP", cc.recs), row3("Statewide recommendation", cc.statewide)] },
      { q: "Who could adopt it?", rows: [row3("An exhibit to adopt from", cc.adoptable), row3("Articulated by two or more colleges", cc.shared),
        row3("A college could adopt it now", cc.could)] }
    ];
    var ptRead = cm.at ? "Figures read " + cmStamp(cm.at) + "." : "";
    return {
      label: "Common Exhibit Reference", prefix: "exh-pg-", reading: reading || !!state.cs.loading,
      status: open.length ? "Needs you" : "In progress",
      lede: "The Common Exhibit Reference: every credential colleges grant credit for, under one name and issuer.",
      read: ptRead, links: links,
      progress: { n: pair ? pair.n : null, of: pair ? pair.of : null, short: "stamped",
        // Confirmed by a person, beside the stamp (Sheet 160; Sam, S565): a person's stamp is complete here, so no clause.
        confirmed: { n: row && row.facts ? row.facts.confirmed : null },
        words: "college-entered titles carry a review stamp",
        recently: [recently, split].filter(Boolean).join(" "), calls: callWords,
        error: cm.done ? (cm.error || (pair ? null : "the Commons row names no pair")) : null },
      attention: { items: items, next: Q && Q.next_step && Q.next_step.title
        ? Q.next_step.title + (Q.next_step.text ? ". " + Q.next_step.text : "") : "",
        empty: "Nothing in the reference waits on a person." },
      groups: groups, of: cc.n, ofWords: "credentials in the reference",
      foot: "The reference is staging: not yet faculty-published. Needs attention reads this tab's queues live: a title leaves them the moment a person decides it. The CPL Commons card counts the nightly procedures run and lists only the reference's known issues, so its list is shorter and between runs its counts can run behind this page."
    };
  }
  function renderProgress(wrap) {
    wrap.appendChild(viewsNav());
    if (!state.cm || !state.cm.done) loadCommons().then(function () { if (state.view === "progress") render(); });
    if (!state.pq.rows && !state.pq.loading && !state.pq.error) loadRequests().then(function () { if (state.view === "progress") render(); });
    if (!window.CPL_COMMONS_PAGE) {
      if (state.pageFailed) { wrap.appendChild(el("p", { cls: "exh-empty", text: "The Progress view could not be loaded; reload the tab to try again." })); return; }
      wrap.appendChild(el("p", { cls: "exh-empty", text: "Reading the figures…" }));
      if (state.pageLoading || !window.CPL_TABS || !window.CPL_TABS.loadScript) return;
      state.pageLoading = true;
      window.CPL_TABS.loadScript("commons_page.js", "CPL_COMMONS_PAGE", function () {
        state.pageLoading = false;
        if (!window.CPL_COMMONS_PAGE) state.pageFailed = true;
        if (state.view === "progress") render();
      });
      return;
    }
    wrap.appendChild(window.CPL_COMMONS_PAGE.render(progressSpec()));
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
    if (p.notes && p.notes.length) c.appendChild(ruleNotes(p.notes));
    if (tally) c.appendChild(el("p", { cls: "exh-small exh-muted", text: "On the last run it settled " + fmt(tally.settled) + " and held " + fmt(tally.held) + " for a person." }));
    return c;
  }
  /* A rule's notes (Sam, 2026-11-11: "put this in the rule's notes, not on the card"): a lead line, the points
     numbered, a closing line. */
  function ruleNotes(notes) {
    return el("div", { cls: "exh-small exh-rule-notes" }, [el("h5", { cls: "exh-rel-tier", text: "Notes" }),
      el("p", { text: notes[0] }), el("ol", null, notes.slice(1, -1).map(function (n) { return el("li", { text: n }); })),
      notes.length > 1 ? el("p", { text: notes[notes.length - 1] }) : null]);
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
        if (r.ruling) c.appendChild(el("p", { cls: "exh-small" }, [el("span", { cls: "exh-muted", text: r.ruling.who + ", " + r.ruling.date + ": " }), "“" + r.ruling.words + "”"]));
        if (r.notes && r.notes.length) c.appendChild(ruleNotes(r.notes));
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

  /* The Requests view: the public's asks to prioritize a credential, one line per credential, most asked first. */
  function renderRequests(wrap) {
    wrap.appendChild(viewsNav());
    wrap.appendChild(el("p", { cls: "exh-muted", text: "What the public asked the Initiative to prioritize for review, from the Credential Catalog's "
      + "Ask us to prioritize this credential. Sam, 2026-11-06 (Open Asks Sheet 162): a request helps the Initiative prioritize its work; "
      + "it promises no one an evaluation, which rests with each college's faculty, and no reply is owed. Route a credential to a college that "
      + "already teaches for it, or to the statewide list, and the count beside it is the order." }));
    var groups = state.pq.rows ? requestGroups() : [];
    var g = el("section", { cls: "exh-group", "aria-labelledby": "exh-pq-h" }, [el("h3", { cls: "exh-q", id: "exh-pq-h",
      text: "Requests by credential" + (state.pq.rows ? " (" + fmt(state.pq.rows.length) + " on " + fmt(groups.length) + (groups.length === 1 ? " credential" : " credentials") + ")" : "") })]);
    if (state.pq.rows == null) g.appendChild(el("p", { cls: "exh-empty", text: state.pq.error === "no session" ? "Requests read behind the team phrase or a reviewer sign-in."
      : state.pq.error ? "The requests could not be read (" + state.pq.error + ")." : "Reading the requests…" }));
    else if (!groups.length) g.appendChild(el("p", { cls: "exh-empty", text: "No requests to show. The rows read behind the team phrase or a reviewer sign-in; the Credential Catalog's panel writes them." }));
    else {
      var tb = el("tbody");
      groups.forEach(function (r) {
        var cols = Object.keys(r.colleges).sort();
        tb.appendChild(el("tr", {}, [
          el("th", { scope: "row" }, [el("span", { text: r.credential }), r.issuer ? el("span", { cls: "exh-small exh-muted", text: " " + r.issuer }) : null]),
          el("td", { cls: "exh-num", text: fmt(r.n) + (r.open !== r.n ? " (" + fmt(r.open) + " new)" : "") }),
          el("td", { text: cols.length ? cols.map(function (c) { return typeof window.cplCollegeShort === "function" ? window.cplCollegeShort(c) : c; }).join(", ") : "Statewide only" }),
          el("td", { cls: "exh-num", text: r.emails ? fmt(r.emails) : "0" }),
          el("td", { text: stamp(r.first) }),
          el("td", { text: r.last === r.first ? "" : stamp(r.last) })]));
      });
      var table = el("table", { cls: "exh-pq" }, [
        el("colgroup", {}, [el("col", { style: "width:34%" }), el("col", { style: "width:10%" }), el("col", { style: "width:26%" }), el("col", { style: "width:8%" }), el("col", { style: "width:11%" }), el("col", { style: "width:11%" })]),
        el("thead", {}, [el("tr", {}, [el("th", { scope: "col", text: "Credential" }), el("th", { scope: "col", cls: "exh-num", text: "Requests" }), el("th", { scope: "col", text: "Colleges named" }),
          el("th", { scope: "col", cls: "exh-num", text: "Left an email" }), el("th", { scope: "col", text: "First asked" }), el("th", { scope: "col", text: "Last asked" })])]), tb]);
      g.appendChild(el("div", { cls: "exh-tblwrap", role: "region", "aria-label": "Public requests by credential", tabindex: "0" }, [table]));
      g.appendChild(el("p", { cls: "exh-small exh-muted", text: "An email a requester left is counted, never shown here; the row holds it for the Initiative's records." }));
    }
    wrap.appendChild(g);
    wrap.appendChild(renderSubmissions());
  }

  /* The credentials the public added, newest first: what they named, its issuer and kind, the link to check it against,
     and the decision. Verify, Merge and Decline are a signed-in reviewer's; a decided one can be reopened. */
  function renderSubmissions() {
    var rows = state.cs.rows, open = rows ? submissionsOpen() : 0;
    var g = el("section", { cls: "exh-group", "aria-labelledby": "exh-cs-h" }, [el("h3", { cls: "exh-q", id: "exh-cs-h",
      text: "Credentials the public added" + (rows ? " (" + fmt(rows.length) + (open ? ", " + fmt(open) + " waiting" : "") + ")" : "") })]);
    g.appendChild(el("p", { cls: "exh-small exh-muted", text: "From the Credential Catalog's Add it, when its search finds nothing. Check each against its link. "
      + "Verify adds it to the Catalog as Not yet evaluated, with its asks counted; Merge folds it into a credential the Catalog already holds; "
      + "Decline keeps it out. Nothing a visitor typed shows until verified (Sam, 2026-11-06)." }));
    if (rows == null) {
      g.appendChild(el("p", { cls: "exh-empty", text: state.cs.error === "no session" ? "The added credentials read behind the team phrase or a reviewer sign-in."
        : state.cs.error ? "The added credentials could not be read (" + state.cs.error + ")." : "Reading the added credentials…" }));
      return g;
    }
    if (!rows.length) { g.appendChild(el("p", { cls: "exh-empty", text: "None added yet." })); return g; }
    if (state.cs.note) g.appendChild(el("p", { cls: "exh-small", role: "status", text: state.cs.note }));
    var tb = el("tbody");
    rows.forEach(function (r) {
      var busy = state.cs.busy === r.id;
      function act(label, decision, into) {
        return word(busy ? "Saving…" : label, function () {
          if (state.cs.busy) return;
          state.cs.busy = r.id; state.cs.note = ""; render();
          decideSubmission(r.id, decision, into).then(function (st) {
            state.cs.busy = ""; state.cs.mergeFor = "";
            state.cs.note = r.name + ": " + (CS_STATUS[st] || st) + (st === "verified" ? ". The Catalog shows it on its next read." : ".");
            return loadSubmissions();
          }).then(render).catch(function (e) {
            state.cs.busy = "";
            state.cs.note = String(e && e.message) === "signin" ? "Sign in as a reviewer to decide an added credential; the team phrase reads them." : "It did not save (" + errText(e) + ").";
            render();
          });
        }, { "aria-label": label + ": " + r.name });
      }
      var acts = el("td", { cls: "exh-cs-acts" });
      if (r.status === "new" && state.cs.mergeFor === r.id) {
        var inp = el("input", { type: "text", id: "exh-cs-into-" + r.id, maxlength: "200", "aria-label": "The credential it merges into", placeholder: "The Catalog's name for it" });
        acts.appendChild(inp);
        acts.appendChild(word("Merge", function () {
          var into = (inp.value || "").trim();
          if (into.length < 2) { state.cs.note = "Name the credential it merges into."; render(); return; }
          act("Merge", "merge", into).click();
        }, { "aria-label": "Merge " + r.name }));
        acts.appendChild(word("Cancel", function () { state.cs.mergeFor = ""; render(); }));
      } else if (r.status === "new") {
        acts.appendChild(act("Verify", "verify"));
        acts.appendChild(word("Merge", function () { state.cs.mergeFor = r.id; render(); var i = document.getElementById("exh-cs-into-" + r.id); if (i) i.focus(); }, { "aria-label": "Merge " + r.name + " into a credential" }));
        acts.appendChild(act("Decline", "decline"));
      } else acts.appendChild(act("Reopen", "reopen"));
      var link = /^https?:\/\//i.test(r.link || "") ? el("a", { href: r.link, target: "_blank", rel: "noopener noreferrer", text: "Check it" }) : el("span", { text: "" });
      var st = (CS_STATUS[r.status] || r.status) + (r.status === "merged" && r.merged_into ? " into " + r.merged_into : "")
        + (r.decided_by && r.status !== "new" ? ", " + stamp(r.decided_at) + " by " + r.decided_by : "");
      tb.appendChild(el("tr", {}, [
        el("th", { scope: "row" }, [el("span", { text: r.name }), el("span", { cls: "exh-small exh-muted", text: " " + (r.issuer || "") })]),
        el("td", { text: r.kind || "" }),
        el("td", {}, [link]),
        el("td", { text: r.college ? (typeof window.cplCollegeShort === "function" ? window.cplCollegeShort(r.college) : r.college) : "" }),
        el("td", { text: r.email ? "Yes" : "No" }),
        el("td", { text: stamp(r.created_at) }),
        el("td", { text: st }),
        acts]));
    });
    var table = el("table", { cls: "exh-pq exh-cs" }, [
      el("colgroup", {}, [el("col", { style: "width:22%" }), el("col", { style: "width:9%" }), el("col", { style: "width:7%" }), el("col", { style: "width:11%" }),
        el("col", { style: "width:6%" }), el("col", { style: "width:9%" }), el("col", { style: "width:16%" }), el("col", { style: "width:20%" })]),
      el("thead", {}, [el("tr", {}, [el("th", { scope: "col", text: "Credential" }), el("th", { scope: "col", text: "Kind" }), el("th", { scope: "col", text: "Link" }),
        el("th", { scope: "col", text: "College named" }), el("th", { scope: "col", text: "Left an email" }), el("th", { scope: "col", text: "Added" }),
        el("th", { scope: "col", text: "Decision" }), el("th", { scope: "col", text: "Decide" })])]), tb]);
    g.appendChild(el("div", { cls: "exh-tblwrap", role: "region", "aria-label": "Credentials the public added", tabindex: "0" }, [table]));
    return g;
  }

  /* The CPL-AI recommendations view (Sam, 2026-11-06, SkyLantern: "connect CPL-AI in the Exhibits tab and make sure we
     can host all the data"). exhibits_cpl_ai.js holds the view and reads the hosted snapshot (kb/cpl_ai/hosted/, built by
     kb/_build_cpl_ai_hosted.py); this tab loads it on first open and mounts it on every render. */
  function loadCplAi() {
    var M = window.CPL_EXHIBITS_CPLAI;
    if (M) { if (state.cplAiCode !== undefined) { M.open(state.cplAiCode, null, state.cplAiQ); state.cplAiCode = undefined; state.cplAiQ = null; } return M.load().then(function () { render(); }); }
    if (state.cplAiLoading || !window.CPL_TABS || !window.CPL_TABS.loadScript) return Promise.resolve();
    state.cplAiLoading = true;
    return new Promise(function (resolve) {
      window.CPL_TABS.loadScript("exhibits_cpl_ai.js", "CPL_EXHIBITS_CPLAI", function () { state.cplAiLoading = false; resolve(); });
    }).then(function () { return window.CPL_EXHIBITS_CPLAI ? loadCplAi() : render(); });
  }
  function cplAiCount() {
    var M = window.CPL_EXHIBITS_CPLAI, ix = M && M._state.index;
    return ix ? ix.counts.pairs : null;
  }
  function renderCplAi(wrap) {
    wrap.appendChild(viewsNav());
    var host = el("div", { cls: "exh-group", id: "exh-cplai" });
    wrap.appendChild(host);
    var M = window.CPL_EXHIBITS_CPLAI;
    if (!M) { host.appendChild(el("p", { cls: "exh-empty", text: state.cplAiLoading === false ? "The CPL-AI view could not be loaded." : "Reading the CPL-AI data…" })); return; }
    M.mount(host, { onChange: function () { if (state.view === "cpl-ai") render(); } });
  }

  /* ── Queue: six lenses over the lists this tab already holds (Sam's Commons ruling 1, 2026-11-08, #2921; COBIx's
     filter contract of 16:49Z) ──
     Needs Sam, Ready to check, All, Connections, Later, History, in that order. Each lens is a set of entry points into
     an existing list, counted from the set that list opens: no new store, no second decision screen, no bulk
     acceptance. Review stays the tab's first view and every deep link stays. A read that failed, the classifier's
     errors or a review file gone stale show in their own Blocked on Sky line, never as an empty lens. */
  var QUEUE_LENSES = [
    ["needs-sam", "Needs " + DECIDER], ["ready", "Ready to check"], ["all", "All"],
    ["connections", "Connections"], ["later", "Later"], ["history", "History"]
  ];
  var QUEUE_STALE_HOURS = 48;   /* the review file is rebuilt nightly; two days without a rebuild reads stale */
  function queueLens() {
    var id = state.qLens;
    return QUEUE_LENSES.some(function (l) { return l[0] === id; }) ? id : "needs-sam";
  }
  function queueBlocked() {
    var out = [];
    if (state.error) out.push("The review file could not be read (" + state.error + "), so held titles are not counted.");
    if (state.sw.error) out.push("Another look's file could not be read (" + state.sw.error + ").");
    if (state.cs.error) out.push("The reference's list could not be read (" + state.cs.error + "), so the List's counts are missing.");
    var rp = state.rq.report, cr = rp && rp.classifier_run;
    if (cr && Array.isArray(cr.errors) && cr.errors.length) {
      out.push("Last night's classifier answered " + fmt(cr.answered || 0) + " and reported: " + cr.errors.slice(0, 2).join("; ")
        + (cr.errors.length > 2 ? "; and " + fmt(cr.errors.length - 2) + " more" : "") + ".");
    }
    var at = state.data && Date.parse(state.data.written_at);
    if (at && Date.now() - at > QUEUE_STALE_HOURS * 3600e3) {
      out.push("The review queue was built " + stamp(state.data.written_at) + ", more than two days ago, so its counts may be stale.");
    }
    return out;
  }
  function queueGoReview(step) {
    state.view = "review"; state.filter = step; state.cur = 0; state.note = ""; state.openCollege = null; state.teach = false;
    state.sw.cur = 0; state.sw.rule = ""; state.sw.bulkAsk = false; state.sw.batchMode = false;
    render();
    var h = document.querySelector(".exh-h");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }
  function queueGoBatch() {
    state.sw.batchMode = true; state.sw.batch = null; state.sw.cur = 0; state.sw.rule = ""; state.sw.bulkAsk = false;
    state.view = "review"; state.filter = SWEEP; state.note = "";
    render();
    var h = document.querySelector(".exh-h");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }
  /* The batch as the Start word opens it: the first six open cards. Counted without touching state.sw.batch, which
     only the batch view itself fixes for the visit. */
  function queueBatchSize() {
    var d = state.sw.data;
    if (!d) return null;
    return Math.min(BATCH_MAX, (d.cards || []).filter(function (c) { return !state.sw.done[c.id]; }).length);
  }
  function queueListCounts() {
    if (!state.cs.rows || !listApi() || typeof LIST_ENGINE.filterCounts !== "function") return null;
    return LIST_ENGINE.filterCounts();
  }
  /* One entry: its count (none while unread, never a 0 standing in for a failed read), its words, and the underlined
     word that opens the list it counts. */
  function queueEntry(n, words, action, go) {
    var kids = [];
    if (n != null) kids.push(el("b", { cls: "exh-qn", text: fmt(n) }), " ");
    kids.push(words);
    if (go) kids.push(" ", word(action, go, { "aria-label": action + ": " + (n != null ? fmt(n) + " " : "") + words }));
    return el("li", { cls: "exh-qe" }, kids);
  }
  function queueListEntry(lc, f, words, action) {
    var n = lc ? lc[f] : null;
    return queueEntry(n == null ? null : n, words + (lc && n == null ? " (counted once the List reads its file)" : ""),
      action, function () { cmGo("list", f); });
  }
  function queueSpec(lens) {
    var lc = queueListCounts(), have = !!state.data, cm = state.cm || {}, Q = cm.Q || null;
    var held = have ? stepCount("") : null;
    if (lens === "needs-sam") {
      var calls = Q && Array.isArray(Q.calls) ? Q.calls.filter(function (c) { return !(c.answer && c.answer.words); }).length : null;
      return { lead: "The judgments only a person can make, one small batch at a time. Each card says what is decided and on what evidence; Keep holds the title, Change records the correction, and the batch stops after its last card.",
        entries: [
          queueEntry(queueBatchSize(), "Another look cards in your next batch, six at most.", "Start", state.sw.data ? queueGoBatch : null),
          queueEntry(have ? stepCount(CONFLICT) : null, "saved titles that disagree with one a person approved.", "Decide them", have ? function () { cmGo("conflict"); } : null),
          queueEntry(have ? stepCount("Two issuers") : null, "titles with two issuers whose roles the sources do not settle.", "Review them", have ? function () { queueGoReview("Two issuers"); } : null),
          queueEntry(calls, calls === 1 ? "decision about the reference waits on " + DECIDER + "." : "decisions about the reference wait on " + DECIDER + ".", "Read them", Q ? function () { cmGo("progress"); } : null)
        ] };
    }
    if (lens === "ready") {
      return { lead: "Machine proposals with enough source evidence to check, and no open question of policy or identity. Checking one approves that title only; it is never faculty approval of credit or a bulk acceptance.",
        entries: [
          queueEntry(have ? stepCount("Proposed") : null, "titles the nightly run proposed a name for.", "Check them", have ? function () { queueGoReview("Proposed"); } : null),
          queueEntry(have ? stepCount("Wording check") : null, "titles held for a wording check.", "Check them", have ? function () { queueGoReview("Wording check"); } : null),
          queueListEntry(lc, "suggested", "suggested folds in the List.", "Open them")
        ],
        after: [el("h4", { cls: "exh-qh", text: "Waiting on a process, not on a check" }), el("ul", { cls: "exh-ql" }, [
          queueEntry(have ? (state.data.tiles && state.data.tiles.saved_not_folded || 0) : null, "titles saved and not yet folded; the nightly run adds them to the reference.", "", null),
          queueListEntry(lc, "waiting", "folds waiting for the reviewed apply.", "Open them")])] };
    }
    if (lens === "all") {
      return { lead: "The whole reference, searchable, and every title the nightly run held.",
        entries: [
          queueEntry(state.cs.rows ? state.cs.rows.length : null, "credentials in the reference.", "Open the List", function () { cmGo("list"); }),
          queueEntry(held, "titles the nightly run held for a curator.", "Review them", have ? function () { cmGo("held"); } : null)
        ] };
    }
    if (lens === "connections") {
      return { lead: "What links an exhibit to colleges, courses and outcomes. A credential with no articulation is not a defect, and an outcomes match is a lead, never an identity or a credit approval.",
        entries: [
          queueListEntry(lc, "bare", "credentials with no articulation yet.", "Open them"),
          queueListEntry(lc, "outcomes", "credentials whose courses' outcomes match another's.", "Open them"),
          queueListEntry(lc, "cplai", "credentials joined to a CPL-AI recommendation.", "Open them"),
          queueListEntry(lc, "statewide", "credentials based on a statewide articulation.", "Open them"),
          queueListEntry(lc, "local", "credentials articulated locally only.", "Open them")
        ] };
    }
    if (lens === "later") {
      return { lead: "What waits by choice. Titles that have left MAP keep their links, so a title that comes back finds its history.",
        entries: [queueListEntry(lc, "left", "titles that have left MAP.", "Open them")],
        after: [el("p", { cls: "exh-small exh-muted", text: "Park is not yet a lasting status: Skip in Another look sets a card aside for this visit only, and the card returns on the next one." })] };
    }
    var visit = state.sw.history.length;
    return { lead: "What was decided and where it stands. This visit's decisions last only the visit; saved titles and rule runs are the lasting record.",
      entries: [
        queueEntry(visit, visit === 1 ? "Another look decision this visit (this visit only)." : "Another look decisions this visit (this visit only).", "", null),
        queueListEntry(lc, "changed", "credentials changed in the List this visit (this visit only).", "Open them"),
        queueListEntry(lc, "waiting", "folds saved and waiting for the reviewed apply (saved, not applied).", "Open them"),
        queueEntry(state.rq.rows ? state.rq.rows.length : null, "rule requests and their runs (lasting).", "Open the rules", function () { cmGo("rules"); })
      ] };
  }
  function renderQueue(wrap) {
    wrap.appendChild(viewsNav());
    if (!state.cs.rows && !state.cs.loading && !state.cs.error) loadCredentials().then(function () { if (state.view === "queue") render(); });
    if (!state.cm || !state.cm.done) loadCommons().then(function () { if (state.view === "queue") render(); });
    ensureListEngine();
    var blocked = queueBlocked();
    if (blocked.length) {
      wrap.appendChild(el("div", { cls: "exh-qb", role: "status" }, [el("h3", { cls: "exh-qh", text: "Blocked on Sky" }),
        el("ul", { cls: "exh-ql" }, blocked.map(function (t) { return el("li", { text: t }); }))]));
    }
    var lens = queueLens();
    wrap.appendChild(el("nav", { cls: "exh-views", "aria-label": "Queue" }, QUEUE_LENSES.map(function (l) {
      if (l[0] === lens) return el("span", { cls: "exh-view-on", "aria-current": "true", text: l[1] });
      return word(l[1], function () { state.qLens = l[0]; render(); }, { cls: "exh-w exh-qw" });
    })));
    var spec = queueSpec(lens), name = QUEUE_LENSES.filter(function (l) { return l[0] === lens; })[0][1];
    var sec = el("section", { cls: "exh-qs", "aria-label": name }, [
      el("h3", { cls: "exh-qh", text: name }), el("p", { cls: "exh-small", text: spec.lead }),
      el("ul", { cls: "exh-ql" }, spec.entries)].concat(spec.after || []));
    wrap.appendChild(sec);
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
    if (state.view === "rules") {
      renderRules(wrap);
      return;
    }
    if (state.view === "requests") {
      renderRequests(wrap);
      return;
    }
    if (state.view === "cpl-ai") {
      renderCplAi(wrap);
      return;
    }
    if (state.view === "progress") {
      renderProgress(wrap);
      return;
    }
    if (state.view === "queue") {
      renderQueue(wrap);
      return;
    }
    if (state.view === "list") {
      if (state.cs.generated) head.appendChild(el("span", { cls: "exh-muted exh-small", text: "Reference built " + stamp(state.cs.generated) }));
      renderList(wrap);
      // A reviewer's sign-in saves from the List: a row's Edit, its side panel, find and replace.
      if (state.studentsWord === "signin" && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
        var lm = el("div", { cls: "exh-signin" });
        wrap.appendChild(lm);
        window.CPL_REVIEWER_SIGNIN.mountInto(lm, { title: "Sign in to edit",
          blurb: "A reviewer's sign-in saves a credential's title, issuer and training sites.", returnTab: "exhibits" });
      }
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
      [stepTile("", "All held")].concat(STEPS.map(function (s) { return stepTile(s, s); }), [stepTile("Saved, not folded", "Saved, not folded"), sweepTile(), renameTile()]));
    group.appendChild(steps);
    wrap.appendChild(group);

    wrap.appendChild(viewsNav());

    if (state.filter === SWEEP && state.sw.data) {
      renderSweep(wrap);
      return;
    }
    if (state.filter === RENAME && state.rel.data) {
      renderRename(wrap);
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
    ".exh-l-rx { display:grid; gap:4px; margin:4px 0 10px; padding:8px 12px; border-left:3px solid var(--border); max-width:var(--cpl-measure,none); }",
    ".exh-l-rxhead { margin:0; font-weight:600; color:var(--text-strong); }",
    ".exh-l-rxlist { margin:0; padding-left:1.2em; display:grid; gap:2px; }",
    ".exh-l-rxmore summary { cursor:pointer; color:var(--seal-blue-text); text-decoration:underline; min-height:24px; }",
    ".exh-l-rxmore summary:focus-visible { outline:2px solid var(--seal-blue-text); outline-offset:2px; }",
    ".exh-small { font-size:.88rem; }",
    ".exh-group { display:grid; gap:8px; }",
    ".exh-tblwrap { overflow-x:auto; max-width:100%; }",
    ".exh-pq { width:100%; border-collapse:collapse; table-layout:fixed; font-size:.92rem; }",
    ".exh-pq th, .exh-pq td { text-align:left; vertical-align:top; padding:6px 8px 6px 0; border-bottom:1px solid var(--border); overflow-wrap:anywhere; }",
    ".exh-pq th[scope=col] { color:var(--text-muted); font-weight:600; font-size:.82rem; }",
    ".exh-pq th[scope=row] { font-weight:600; color:var(--seal-blue-text); }",
    ".exh-pq .exh-num { text-align:right; font-variant-numeric:tabular-nums; }",
    ".exh-cs-acts { display:flex; flex-wrap:wrap; gap:4px 10px; align-items:center; }",
    ".exh-cs-acts input { min-height:28px; width:100%; padding:2px 6px; font:inherit; color:var(--text-body); background:var(--surface); border:1px solid var(--border); border-radius:4px; }",
    "@media (max-width:560px) { .exh-cs { table-layout:auto; min-width:640px; } }",
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
    ".exh-linebar { display:flex; flex-wrap:wrap; gap:6px 22px; align-items:baseline; justify-content:space-between; margin:12px 0 10px; }",
    ".exh-line { margin:0; display:flex; flex-wrap:wrap; gap:4px 0; align-items:baseline; color:var(--text-strong); }",
    ".exh-sep { color:var(--text-muted); margin:0 .55em; }",
    ".exh-fold[hidden] { display:none; }",
    ".exh-qs, .exh-qb { margin:12px 0; }",
    ".exh-qb { border-left:3px solid var(--border); padding:4px 0 4px 12px; }",
    ".exh-qh { font-size:1rem; margin:8px 0 4px; color:var(--text-strong); }",
    ".exh-ql { list-style:none; margin:4px 0; padding:0; }",
    ".exh-qe { margin:6px 0; line-height:1.5; }",
    ".exh-qn { font-variant-numeric:tabular-nums; }",
    "button.exh-w.exh-qw { display:inline-block; min-width:24px; text-align:center; }",
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
    ".exh-sites { border:0; margin:0; padding:0; display:grid; gap:6px; min-width:0; }",
    ".exh-sites p { margin:0; }",
    ".exh-siterow { display:flex; flex-wrap:wrap; gap:6px 10px; align-items:center; min-width:0; }",
    ".exh-siterow select { flex:1 1 9em; }",
    ".exh-siterow input { flex:3 1 14em; }",
    ".exh-siterow select, .exh-siterow input { min-width:0; font:inherit; font-size:.9rem; color:var(--text-body); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:4px 6px; }",
    ".exh-siterow select:focus-visible, .exh-siterow input:focus-visible, .exh-search:focus-visible { outline:2px solid var(--seal-blue); outline-offset:1px; }",
    "@media (max-width: 560px) { .exh-ccrow { grid-template-columns:minmax(0, 1fr); } .exh-dash, .exh-steps { grid-template-columns:repeat(2, minmax(0, 1fr)); } }",
    ".exh-why { display:grid; gap:4px; min-width:0; }",
    /* The Commons' row on the tiles (Sam, 2026-11-01). */
    ".exh-tile.exh-wide { grid-column:1 / -1; }",
    ".exh-kept { grid-template-columns:repeat(auto-fit, minmax(min(100%, 260px), 1fr)); align-items:start; }",
    ".exh-tn .exh-tcount { font-size:1.35rem; font-weight:600; font-variant-numeric:tabular-nums; }",
    /* A one-digit count is a target too: WCAG 2.2's 24px floor (the a11y sweep, 2026-11-03). */
    "button.exh-w.exh-tcount, a.exh-tcount { display:inline-block; min-width:24px; min-height:24px; text-align:start; }",
    ".exh-l-pn-h { margin:0 0 4px; font-family:'Playfair Display', Georgia, serif; font-size:clamp(1.35rem, 2.2vw, 1.8rem); line-height:1.15; color:var(--text-strong); }",
    ".exh-l-pn-meta { margin:0 0 12px; }",
    ".exh-pn-q { margin:14px 0 4px; font-size:1.02rem; color:var(--text-strong); }",
    // An exhibit's number in the panel is its link to MAP: a word in the List's control style, 24px tall.
    "a.exh-pn-id { display:inline-block; min-height:24px; line-height:24px; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.8rem; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; }",
    ".exh-pn-ul { margin:4px 0 0; padding-left:1.1em; font-size:.88rem; display:flex; flex-direction:column; gap:5px; }",
    ".exh-l-pn-edit > .exh-l-pn-fbody { display:grid; gap:8px; margin-top:10px; min-width:0; }",
    ".exh-vh { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }",
    "a.exh-tcount { text-decoration:underline; text-underline-offset:3px; }",
    ".exh-tile .exh-zero { color:var(--hunter); }",
    ".exh-tests { display:flex; flex-wrap:wrap; gap:6px; padding-top:2px; }",
    ".exh-tile ul { margin:0; padding:0; list-style:none; font-size:.88rem; color:var(--text-body); min-width:0; }",
    ".exh-tile li { margin:0 0 3px; min-width:0; overflow-wrap:anywhere; }",
    ".exh-dsl-h { margin:6px 0 2px; font-size:.78rem; font-weight:700; color:var(--text-strong); }",
    ".exh-done details { min-width:0; }",
    ".exh-done summary { list-style:none; cursor:pointer; min-height:24px; display:flex; align-items:center; min-width:0; }",
    ".exh-done summary::-webkit-details-marker { display:none; }",
    ".exh-done-line { display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; min-width:0; flex:1 1 auto; }",
    ".exh-done summary:hover .exh-done-line { text-decoration:underline; text-underline-offset:2px; }",
    ".exh-done summary:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-done details[open] .exh-done-line { white-space:normal; overflow-wrap:anywhere; }",
    ".exh-done-body { margin:0 0 4px; color:var(--text-muted); }",
    ".exh-run p { margin:0; font-size:.88rem; color:var(--text-body); overflow-wrap:anywhere; }",
    ".exh-age { color:var(--text-muted); }",
    ".exh-cm-warn { font-weight:600; color:var(--text-strong); }",
    ".exh-why ul { margin:0; padding-left:1.2em; display:grid; gap:4px; }",
    ".exh-locals li { overflow-wrap:anywhere; }",
    ".exh-strong { color:var(--text-strong); font-weight:600; }",
    /* Related titles: beside the card at desktop widths, under it on a narrow screen. */
    ".exh-with-rel { display:grid; grid-template-columns:minmax(0, 1fr); gap:16px; align-items:start; min-width:0; }",
    "@media (min-width: 980px) { .exh-with-rel { grid-template-columns:minmax(0, 1fr) minmax(260px, 30%); } }",
    ".exh-rel { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:clamp(12px, 2vw, 18px); display:grid; gap:10px; min-width:0; }",
    ".exh-rel-body { display:grid; gap:8px; min-width:0; }",
    ".exh-rel-body p { margin:0; }",
    ".exh-rel-tier { margin:6px 0 0; font-size:.82rem; font-weight:600; color:var(--text-muted); }",
    ".exh-rel-list { list-style:none; margin:0; padding:0; display:grid; gap:10px; }",
    ".exh-rel-list li { display:grid; gap:2px; justify-items:start; padding-bottom:8px; border-bottom:1px solid var(--border); min-width:0; }",
    ".exh-rel-t { color:var(--text-strong); overflow-wrap:anywhere; }",
    ".exh-rel-paths { overflow-wrap:anywhere; }",
    ".exh-rb-table .exh-rel-paths { display:block; }",
    ".exh-rel-pend { color:var(--text-strong); font-weight:600; overflow-wrap:anywhere; }",
    /* The statewide or most-used mark, the reason a title cannot be checked, and the panel's change bar (2026-11-12). */
    ".exh-rel-mark { color:var(--text-strong); font-weight:600; }",
    ".exh-rel-why { color:var(--text-muted); overflow-wrap:anywhere; }",
    ".exh-rel-pick { display:flex; align-items:flex-start; gap:8px; min-height:24px; cursor:pointer; min-width:0; }",
    ".exh-rel-cb { width:18px; height:18px; margin:2px 0 0; flex:0 0 auto; accent-color:var(--seal-blue); }",
    ".exh-rel-cb:focus-visible, .exh-rel-sel:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-rel-acts { display:grid; gap:6px; padding:8px 0; border-top:1px solid var(--border); border-bottom:1px solid var(--border); min-width:0; }",
    ".exh-rel-acts p { margin:0; }",
    ".exh-rel-lab { color:var(--text-muted); }",
    ".exh-rel-sel { min-height:32px; max-width:100%; min-width:0; font:inherit; font-size:.9rem; color:var(--text-body); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:2px 6px; }",
    ".exh-rel-confirm { display:grid; gap:6px; border-left:3px solid var(--seal-blue-text); background:var(--surface-subtle); padding:8px 12px; min-width:0; }",
    ".exh-rel-confirm p:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-rel-asklist { margin:0; padding-left:1.1em; display:grid; gap:2px; overflow-wrap:anywhere; }",
    ".exh-align { margin:0; color:var(--text-body); overflow-wrap:anywhere; }",
    ".exh-align[hidden] { display:none; }",
    ".exh-cd-head { display:flex; justify-content:space-between; align-items:baseline; gap:8px; flex-wrap:wrap; }",
    ".exh-cd-head h4 { margin:0; }",
    ".exh-cd-head h4:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-cd-course { display:grid; gap:4px; padding-bottom:8px; border-bottom:1px solid var(--border); min-width:0; }",
    ".exh-cd-course p { margin:0; overflow-wrap:anywhere; }",
    ".exh-cd-facts { display:grid; grid-template-columns:max-content minmax(0, 1fr); gap:2px 10px; margin:0; }",
    ".exh-cd-facts dt { color:var(--text-muted); }",
    ".exh-cd-facts dd { margin:0; color:var(--text-body); overflow-wrap:anywhere; }",
    ".exh-cd-desc { color:var(--text-body); }",
    ".exh-rule-notes p, .exh-rule-notes ol { margin:4px 0; }",
    ".exh-rb-scroll { overflow-x:auto; min-width:0; }",
    ".exh-rb-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:.88rem; }",
    ".exh-rb-table th, .exh-rb-table td { text-align:left; vertical-align:top; padding:8px 8px; border-bottom:1px solid var(--border); overflow-wrap:anywhere; font-weight:400; color:var(--text-body); }",
    ".exh-rb-table thead th { font-weight:600; color:var(--text-muted); font-size:.82rem; }",
    ".exh-rb-cur { display:block; color:var(--text-strong); font-weight:600; }",
    ".exh-rb-in { width:100%; box-sizing:border-box; min-height:32px; font:inherit; color:var(--text-body); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:4px 8px; }",
    ".exh-rb-in:focus-visible { outline:2px solid var(--seal-blue); outline-offset:1px; }",
    ".exh-rb-skip th .exh-rb-cur, .exh-rb-skip td { color:var(--text-muted); }",
    "@media (max-width: 720px) { .exh-rb-table { min-width:640px; } }",
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
    state.sw.rule = ""; state.sw.cur = 0; state.sw.bulkAsk = false; state.sw.batchMode = false; state.sw.batch = null;
    state.ls = null; state.qLens = "";
    state.rb.ask = false; state.rel.all = null; state.rel.act = null; state.rel.folded = {};
    if (!state.cm || state.cm.done) state.cm = null;   /* the Commons' figures are read again each visit, as the Commons reads them */
    routeFromHash();
    render();
  }
  /* #exhibits/<route> opens one place, read once per visit (the Commons row's counts link here, the way
     they linked into the retired CER tab): held = Review on all held, conflict = Review on Conflict with
     the reference, credentials = the List (the Credentials view retired into it), rules = the rules sent to the routine, list = the List, and
     list/<filter> the List on that filter. The address is not a remembered filter. */
  var ROUTES = { held: ["review", ""], conflict: ["review", CONFLICT], "another-look": ["review", SWEEP], "rename-batch": ["review", RENAME], credentials: ["list", ""],
    rules: ["rules", ""], list: ["list", ""], progress: ["progress", ""], queue: ["queue", ""], requests: ["requests", ""], "cpl-ai": ["cpl-ai", ""] };
  function routeFromHash() {
    var parts = String(location.hash || "").replace(/^#/, "").split("/");
    var r = parts[0] === "exhibits" && ROUTES[parts[1]];
    if (!r) return false;
    state.view = r[0]; state.filter = r[1];
    state.sw.batchMode = parts[1] === "another-look" && parts[2] === "batch";
    if (state.sw.batchMode) { state.sw.batch = null; state.sw.cur = 0; state.sw.rule = ""; state.sw.bulkAsk = false; }
    /* #exhibits/list/<filter> opens the List on one of its filters (a Commons count, norm 1). */
    if (r[0] === "list" && parts[2] && listFilterLabel(parts[2])) listState().f = parts[2];
    if (state.filter === RENAME && state.rel.data) loadRenameStudents().then(render);
    if (r[0] === "queue") { state.qLens = parts[2] || ""; loadCredentials().then(render); }
    if (r[0] === "list" || r[0] === "progress") loadCredentials().then(render);
    if (r[0] === "requests") loadRequests().then(render);
    if (r[0] === "cpl-ai") { state.cplAiCode = parts[2] ? decodeURIComponent(parts[2]) : null; loadCplAi(); }
    return true;
  }
  /* The view a sign-in link returns to (cpl_session.js viewAddress): the address routeFromHash reads, built from
     what is on screen. Reads state.ls without listState(), so asking never creates or consumes List state. */
  if (window.CPL_SESSION && CPL_SESSION.viewAddress) CPL_SESSION.viewAddress("exhibits", function () {
    var v = state.view, f = state.ls && state.ls.f;
    if (v === "list") return "exhibits/list" + (f ? "/" + f : "");
    if (v === "progress" || v === "rules" || v === "requests") return "exhibits/" + v;
    if (v === "queue") return "exhibits/queue/" + queueLens();
    if (v === "cpl-ai") return window.CPL_EXHIBITS_CPLAI ? window.CPL_EXHIBITS_CPLAI.address() : "exhibits/cpl-ai";
    if (v === "review") return "exhibits/" + (state.filter === CONFLICT ? "conflict" : state.filter === SWEEP ? (state.sw.batchMode ? "another-look/batch" : "another-look") : state.filter === RENAME ? "rename-batch" : "held");
    return "exhibits";
  });
  function boot() {
    if (booted) return Promise.resolve();
    booted = true;
    routeFromHash();
    render();
    window.addEventListener("cpl-tab-activated", function (e) {
      if (e && e.detail && e.detail.tab === "exhibits") newVisit();
    });
    window.addEventListener("cpl-session-changed", function () {
      loadStudents().then(render);
      if (state.filter === RENAME) loadRenameStudents().then(render);
    });
    // The statewide list names the statewide exhibit on a Review card; a script that never answers holds nothing up.
    loadStatewideRecs().then(function () { if (state.view === "review") render(); });
    return Promise.all([load(), loadSweep(), loadRules(), loadRelated(), loadRelatedPlans()]).then(function () {
      render();
      return Promise.all([loadStudents(), state.filter === RENAME ? loadRenameStudents() : null]);
    }).then(render);
  }

  window.CPL_EXHIBITS = {
    boot: boot, render: render, load: load, loadStudents: loadStudents, ensureCss: ensureCss,
    _state: state, _shown: shown, _teachText: teachText, _TIPS: TIPS,
    loadCredentials: loadCredentials, openCredential: openCredential,
    _parseSites: parseSites, _joinSites: joinSites, _resolveSites: resolveSites, _credCurrent: credCurrent,
    _credCould: credCould, _routeFromHash: routeFromHash, loadSweep: loadSweep, _sweepShown: sweepShown, _sweepRows: sweepRows,
    _aseIssuer: aseIssuer, _issuerFor: issuerFor, _nameOptions: nameOptions, _nameMatches: nameMatches, _bulkItems: bulkItems,
    _sweepIssuer: sweepIssuer,
    loadRules: loadRules, _requestRows: requestRows, _requestState: requestState, _sendRequest: sendRequest,
    _switchRequest: switchRequest, _dryRunLines: dryRunLines, _listCsv: listCsv, _listRows: listRows,
    _progressSpec: progressSpec, _credCounts: credCounts, loadCommons: loadCommons,
    _listCplAi: listCplAi, _listCplAiLoad: listCplAiLoad,
    loadRelated: loadRelated, _relatedFor: relatedFor, _relAligned: relAligned, _relWhyNot: relWhyNot, _POPULAR_MIN: POPULAR_MIN, _aseOf: aseOf, _renamePlan: renamePlan, _renameRows: renameRows,
    _renameCount: renameCount, _akaOf: akaOf, _appliedTo: listAppliedTo, _famOf: famOf, _listStatus: listStatus, loadRenameStudents: loadRenameStudents
  };
})();
