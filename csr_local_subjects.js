// csr_local_subjects.js — the Common Subjects Reference's Local subjects List.
//
// Sam, 2026-11-03, in chat: "yes on local subjects", a second List in the Subjects tab with one row per local subject
// code: the MQ discipline kb/reference/subject_discipline_map.json files it under, the Common SUBJ that discipline
// carries, the courses colleges file under the code, and who confirmed the filing.
//
// The map is the subject-discipline edge, DR-25, Sam's (kb/governance_register.json). The List records a person's
// confirm of a filing, a filing for a code the map does not name, and a note, as _SUBJ_DISC::<CODE> rows in
// kb_curation (subject_discipline_confirm, subject_discipline_note; kb/governance_surface_map.json maps both to DR-25).
// The map file itself changes only through a session under DR-25 with its ripple check, because the M-ID generator
// reads it: the List proposes, the map and the re-mint playbook act (the List norms; CLAUDE.md Rule 7).
//
// Course counts come from the seed (kb/discipline_canonical_subj4.json): each MQ discipline's local_subject_variants,
// the local codes colleges use for its courses, inverted here into each code's spread over the disciplines. The seed
// keeps each discipline's most-used codes, so a count can run low, and a code with no course in the seed reads 0.
//
// Loaded by canonical_subj4.js beside commons_list.js. window.CPL_CSR_LOCAL = { create(host), buildRows, norm, KEY,
// F_CONFIRM, F_NOTE }. host: { entries(), variantsFor(e), session() (the signed-in reviewer or null),
// save(courseId, field, value) -> Promise<Response>, read(prefix) -> Promise<rows>, fetchJson(url) -> Promise,
// render(), signIn() (opens the Reference view's sign-in) }. Tokens only, words for every control, no glyphs.
(function () {
  "use strict";
  var MAP_URL = "kb/reference/subject_discipline_map.json";
  var KEY = "_SUBJ_DISC::", F_CONFIRM = "subject_discipline_confirm", F_NOTE = "subject_discipline_note";
  var MOSTLY = 0.5;   /* a filing a code's courses mostly leave, and the share a code's top discipline needs to be offered */
  var HOW_WORDS = {
    person: "Confirmed by a person", open: "Open", moved: "Confirmed under another discipline",
    unmapped: "Left out of the map on purpose", absent: "Not in the map", filed: "Filed by a person, not yet in the map"
  };
  var FILTERS = [["", "All"], ["open", "Open"], ["suggested", "Suggested filings"], ["absent", "Not in the map"],
    ["elsewhere", "Most courses land elsewhere"], ["person", "Confirmed by a person"], ["unmapped", "Left out on purpose"],
    ["selected", "Selected"], ["changed", "Changed this visit"]];

  function norm(c) { return String(c == null ? "" : c).toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  function day(v) { var m = /^(\d{4}-\d\d-\d\d)/.exec(v || ""); return m ? m[1] : ""; }
  function plural(n, one, many) { return fmt(n) + " " + (n === 1 ? one : many); }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  /* Every local code the map names, leaves out on purpose, or the seed's courses use, one row each. overlay is
     { CODE: { confirm: { value, by, at }, note: { value, by, at } } }, read from kb_curation. */
  function buildRows(map, entries, variantsFor, overlay) {
    var mp = {}, un = {};
    Object.keys((map && map.map) || {}).forEach(function (k) { if (norm(k)) mp[norm(k)] = map.map[k]; });
    Object.keys((map && map._deliberately_unmapped) || {}).forEach(function (k) { if (norm(k)) un[norm(k)] = map._deliberately_unmapped[k]; });
    var subjOf = {}, lands = {};
    (entries || []).forEach(function (e) {
      subjOf[e.discipline] = e.canonical_subj4 || "";
      var lv = (variantsFor && variantsFor(e)) || {};
      Object.keys(lv).forEach(function (c) {
        var k = norm(c), n = +lv[c] || 0;
        if (!k || !n) return;
        var o = lands[k] = lands[k] || {};
        o[e.discipline] = (o[e.discipline] || 0) + n;
      });
    });
    var codes = {};
    [mp, un, lands].forEach(function (o) { Object.keys(o).forEach(function (c) { codes[c] = 1; }); });
    overlay = overlay || {};
    return Object.keys(codes).sort().map(function (c) {
      var disc = mp[c] || null, why = un[c] || null, L = lands[c] || {};
      var spread = Object.keys(L).map(function (d) { return [d, L[d]]; })
        .sort(function (a, b) { return b[1] - a[1] || cmp(a[0], b[0]); });
      var n = spread.reduce(function (s, x) { return s + x[1]; }, 0);
      var inMap = disc ? (L[disc] || 0) : 0;
      var ov = overlay[c] || {}, conf = ov.confirm && ov.confirm.value ? ov.confirm : null;
      var how = why ? "unmapped"
        : disc ? (conf ? (conf.value === disc ? "person" : "moved") : "open")
        : (conf ? "filed" : "absent");
      return { ut: c, disc: disc, why: why, subj: disc ? (subjOf[disc] || "") : (conf ? subjOf[conf.value] || "" : ""),
        spread: spread, n: n, inMap: inMap, top: spread[0] || null, conf: conf, note: (ov.note && ov.note.value) || "",
        noteBy: ov.note ? ov.note.by : "", how: how, mostlyElsewhere: !!(disc && n && inMap / n < MOSTLY) };
    });
  }
  function landsWords(r) {
    if (!r.spread.length) return "No course in the seed";
    var top = r.spread.slice(0, 3).map(function (x) { return x[0] + " " + fmt(x[1]); }).join(", ");
    return r.spread.length > 3 ? top + ", and " + plural(r.spread.length - 3, "more", "more") : top;
  }
  /* The filing a row offers: the map's own for an open (or since moved) code; for a code the map does not name, the
     discipline most of its courses land in, never a split one (a call for a person). */
  function suggestOf(r) {
    if (r.how === "open" || r.how === "moved") {
      return { disc: r.disc, text: r.disc + " as its MQ discipline",
        why: r.n ? fmt(r.inMap) + " of " + fmt(r.n) + " of its courses land there" : "the map's filing; no course in the seed uses it" };
    }
    if (r.how === "absent" && r.top && r.n && r.top[1] / r.n >= MOSTLY) {
      return { disc: r.top[0], text: r.top[0] + " as its MQ discipline",
        why: "where " + fmt(r.top[1]) + " of " + fmt(r.n) + " of its courses land; a confirm files it for the map" };
    }
    return null;
  }

  function create(host) {
    var st = { map: null, mapErr: null, overlay: {}, ovErr: null, loading: null, rows: null, ls: {}, engine: null };
    function invalidate() { st.rows = null; }
    function rows() {
      if (st.rows) return st.rows;
      st.rows = st.map ? buildRows(st.map, host.entries(), host.variantsFor, st.overlay) : [];
      return st.rows;
    }
    function readOverlay(arr) {
      var m = {};
      (arr || []).forEach(function (row) {
        var c = norm(String(row.course_id || "").slice(KEY.length));
        if (!c) return;
        var rec = m[c] = m[c] || {};
        var v = { value: row.value, by: row.reviewer_email, at: row.reviewed_at };
        if (row.field === F_CONFIRM) rec.confirm = v;
        else if (row.field === F_NOTE) rec.note = v;
      });
      return m;
    }
    function load() {
      if (st.loading) return st.loading;
      st.loading = Promise.all([
        host.fetchJson(MAP_URL).then(function (j) {
          if (!j || typeof j.map !== "object") throw new Error(MAP_URL + " holds no map");
          st.map = j;
        }, function (e) { st.mapErr = String(e && e.message || e); }),
        host.read(KEY).then(function (arr) { st.overlay = readOverlay(arr); }, function (e) { st.ovErr = String(e && e.message || e); })
      ]).then(function () { invalidate(); host.render(); });
      return st.loading;
    }
    function remember(r, field, value, sess) {
      var rec = st.overlay[r.ut] = st.overlay[r.ut] || {};
      rec[field === F_CONFIRM ? "confirm" : "note"] = { value: value, by: sess.email, at: new Date().toISOString() };
      invalidate();
    }
    function write(r, field, value) {
      var sess = host.session();
      if (!sess) return Promise.resolve({ ok: false, words: "Sign in on the Reference view to save; nothing changed." });
      return host.save(KEY + r.ut, field, value).then(function (res) {
        if (!res || !res.ok) return { ok: false, words: "That did not reach the reference (" + (res ? res.status : "no answer") + "); nothing changed." };
        remember(r, field, value, sess);
        return { ok: true };
      }, function () { return { ok: false, words: "That did not reach the reference (network); nothing changed." }; });
    }
    function confirmFiling(r, disc) {
      return write(r, F_CONFIRM, disc).then(function (res) {
        if (!res.ok) return res;
        return { ok: true, words: r.disc
          ? "Confirmed: " + r.ut + " under " + disc + "."
          : "Filed " + r.ut + " under " + disc + ". The map takes it when a session applies the filings under DR-25." };
      });
    }
    function cols() {
      return [
        { h: "Local SUBJ", w: 9, v: function (r) { return r.ut; } },
        { h: "MQ discipline", w: 19, v: function (r) { return r.disc || (r.why ? "Left out on purpose" : (r.conf ? r.conf.value : "None in the map")); } },
        { h: "Common SUBJ", w: 8, v: function (r) { return r.subj || ""; } },
        { h: "Courses", w: 7, n: true, v: function (r) { return r.n; } },
        { h: "Where its courses land", w: 24, v: landsWords },
        { h: "Status", w: 13, v: function (r) { return HOW_WORDS[r.how]; } },
        { h: "Confirmed by", w: 10, v: function (r) { return r.conf ? r.conf.by + (r.conf.at ? ", " + day(r.conf.at) : "") : ""; } },
        { h: "Note", w: 10, v: function (r) { return r.note; } }
      ];
    }
    function drawer(r, name, h) {
      if (name === "Where its courses land" || name === "Courses") {
        if (!r.spread.length) { h.line("No course in the seed uses " + r.ut + "."); return; }
        h.line(plural(r.n, "course", "courses") + " in the seed use " + r.ut + ", by the MQ discipline each is filed under:");
        h.list(r.spread.map(function (x) { return x[0] + ": " + plural(x[1], "course", "courses") + (x[0] === r.disc ? " (the map's filing)" : ""); }));
        h.line("The seed keeps each discipline's most-used local codes, so a count can run low.");
        return;
      }
      if (r.disc) h.line("The map files " + r.ut + " under " + r.disc + (r.subj ? ", whose Common SUBJ is " + r.subj : "") + ".");
      else if (r.why) h.line("The map leaves " + r.ut + " out on purpose: " + r.why + ".");
      else h.line("The map does not name " + r.ut + ".");
      if (r.how === "moved") h.line("A person confirmed it under " + r.conf.value + (r.conf.at ? " on " + day(r.conf.at) : "") + ", and the map files it under " + r.disc + " since.");
      else if (r.conf) h.line((r.how === "filed" ? "Filed under " + r.conf.value + " by " : "Confirmed by ") + r.conf.by + (r.conf.at ? ", " + day(r.conf.at) : "") + ".");
      else if (r.disc) h.line("No person has confirmed the filing yet.");
      if (r.mostlyElsewhere) h.line("Only " + fmt(r.inMap) + " of its " + plural(r.n, "course", "courses") + " land in the map's discipline.");
      if (r.note) h.line("Note" + (r.noteBy ? " (" + r.noteBy + ")" : "") + ": " + r.note);
      var sg = suggestOf(r);
      if (sg) h.box.appendChild(h.el("div", { cls: "csls-acts" }, [h.word(r.disc ? "Confirm this filing" : "File it under " + sg.disc, function () {
        engine().cellNote((r.disc ? "Confirming " : "Filing ") + r.ut + "…");
        confirmFiling(r, sg.disc).then(function (res) {
          h.L.open = null;
          if (res.ok) engine().markChanged([r.ut]);
          engine().cellNote(res.words); host.render();
        });
      })]));
      h.line("To file it under another MQ discipline, write a note: the change is Sam's under DR-25, and a session makes it in the map with its ripple check.");
    }
    function saveRow(r) {
      var L = st.ls, d = L.draft || {}, note = String(d.note == null ? "" : d.note);
      if (note === r.note) { L.edit = null; L.draft = null; L.note = "Nothing changed."; host.render(); return Promise.resolve(); }
      L.busy = true; host.render();
      return write(r, F_NOTE, note).then(function (res) {
        L.busy = false;
        if (res.ok) { L.edit = null; L.draft = null; L.note = "Saved the note on " + r.ut + "."; engine().markChanged([r.ut]); }
        else L.note = res.words;
        host.render();
      });
    }
    function spec() {
      return {
        prefix: "csls-", frPrefix: "csls-fr-",
        noun: { many: "local subject codes", region: "Every local subject code, A to Z", keyHeader: "Local SUBJ", file: "common-subjects-local",
          placeholder: "Local code, MQ discipline or note", findLabel: "Find a local code" },
        state: function () { return st.ls; }, rows: rows, cols: cols,
        key: function (r) { return r.ut; }, title: function (r) { return r.ut; }, render: host.render,
        changed: true,
        suggest: { get: suggestOf, verb: "Confirm", accept: function (r, sg) { return confirmFiling(r, sg.disc); }, always: true,
          label: function (r, sg) { return "Confirm " + sg.disc + " for " + r.ut; } },
        head: function (wrap, api) {
          wrap.appendChild(api.el("p", { cls: "cs-quiet", text: "Every local subject code colleges use, A to Z: the MQ discipline the "
            + "subject map files it under, that discipline's Common SUBJ, where its courses land, and who confirmed the filing. "
            + "Confirm records a person's yes; the map itself changes under DR-25, Sam's, when a session applies the filings." }));
          if (st.mapErr) { wrap.appendChild(api.el("p", { cls: "cs-caution", role: "alert", text: "The subject map could not be read (" + st.mapErr + ")." })); return false; }
          if (!st.map) { wrap.appendChild(api.el("p", { cls: "cs-quiet", text: "Reading the subject map…" })); return false; }
          if (st.ovErr) wrap.appendChild(api.el("p", { cls: "cs-caution", role: "alert", text: "The confirmations could not be read (" + st.ovErr + "); every code reads as no one has confirmed it." }));
          if (!host.session()) wrap.appendChild(api.el("p", { cls: "cs-lede" }, ["You are not signed in. The list reads; a save asks for a sign-in, which sits on the Reference view. ",
            api.word("Go to the Reference view", function () { host.signIn(); })]));
          return true;
        },
        filters: FILTERS,
        filterPass: function (r, L) {
          if (L.f === "open") return r.how === "open" || r.how === "moved";
          if (L.f === "absent") return r.how === "absent" || r.how === "filed";
          if (L.f === "elsewhere") return r.mostlyElsewhere;
          if (L.f === "person") return r.how === "person" || r.how === "filed";
          if (L.f === "unmapped") return r.how === "unmapped";
          return true;
        },
        hay: function (r) { return [r.ut, r.disc || "", r.subj, HOW_WORDS[r.how], r.why || "", r.note, r.spread.map(function (x) { return x[0]; }).join(" ")].join(" "); },
        drawer: drawer,
        edit: { fields: [{ id: "csls-note", label: "Note", key: "note" }], draft: function (r) { return { note: r.note }; }, save: saveRow }
      };
    }
    function engine() {
      if (!st.engine && window.CPL_COMMONS_LIST) st.engine = window.CPL_COMMONS_LIST.create(spec());
      return st.engine;
    }
    return {
      render: function (node) {
        if (!st.loading) load();
        var E = engine();
        if (E) E.render(node);
      },
      setFilter: function (f) { st.ls.f = FILTERS.some(function (x) { return x[0] === f; }) ? f : ""; st.ls.q = ""; },
      // The Subjects List's panel opens one code here (Refile <code> in Local subjects, 2026-11-04): every filter, the finder set.
      setFind: function (q) { st.ls.f = ""; st.ls.q = q || ""; },
      rows: rows, state: st, load: load
    };
  }

  window.CPL_CSR_LOCAL = { create: create, buildRows: buildRows, norm: norm, suggestOf: suggestOf, KEY: KEY, F_CONFIRM: F_CONFIRM,
    F_NOTE: F_NOTE, FILTERS: FILTERS, MAP_URL: MAP_URL };
})();
