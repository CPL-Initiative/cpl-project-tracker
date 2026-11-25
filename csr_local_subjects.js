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
//
// The courses sidebar (S733; Sam, 2026-11-25: row "A" has "one course (interdisciplinary studies) incorrectly
// associated with but no way to fix it", and "there should at least be a side bar that allows me to move one or more
// courses to another subject"). A row's Courses or Where its courses land opens, beside the list, every course COCI
// lists under the code statewide, each with its college, number, title and M-ID, and says in words which ones sit under
// another common subject than the code's filing. A signed-in reviewer checks one or several and moves them to a common
// subject: the Subjects tab's own read and write (commons_subjects.js, CPL_COMMONS_SUBJECTS.localCourses and
// moveCourses; field course_subject_decision, course_id CRS:<college>|<local code>|<course number>, DR-25), loaded the
// first time the sidebar opens, so a move made here shows there and the other way round. Edit changes the row's filing
// (its MQ discipline, and so its Common SUBJ) through the same subject_discipline_confirm save as Confirm, beside the
// note; a person's filing wins over the map's on this list.
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
      /* A person's filing wins over the map's (person-settled): a row a person filed under another discipline shows
         that discipline's Common SUBJ. */
      return { ut: c, disc: disc, why: why, subj: conf && how === "moved" ? (subjOf[conf.value] || "") : disc ? (subjOf[disc] || "") : (conf ? subjOf[conf.value] || "" : ""),
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
    var st = { map: null, mapErr: null, overlay: {}, ovErr: null, loading: null, rows: null, ls: {}, engine: null,
      side: null, sideMsg: "", courses: {}, node: null };
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
        { h: "MQ discipline", w: 19, v: function (r) { return r.how === "moved" ? r.conf.value + " (a person’s filing; the map says " + r.disc + ")" : r.disc ||(r.why ? "Left out on purpose" : (r.conf ? r.conf.value : "None in the map")); } },
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
        /* The seed's count stays one line; the courses themselves, and the move, open in the sidebar beside the list. */
        h.line(r.spread.length ? "In the seed: " + landsWords(r) + ". The seed keeps each discipline's most-used local codes, so a count can run low."
          : "No course in the seed uses " + r.ut + ".");
        h.box.appendChild(h.el("div", { cls: "csls-acts" }, [h.word("Show the courses under " + r.ut + " beside this list", function () { openSide(r.ut); })]));
        if (st.side !== r.ut) Promise.resolve().then(function () { openSide(r.ut); });
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
      h.line("To file it under another MQ discipline, use Edit on the row. A filing is a person's save and stands on this list; the map takes it when a session applies the filings under DR-25.");
    }
    /* What a typed filing names: an MQ discipline by name, or a Common SUBJ that one discipline carries. */
    function resolveDisc(typed) {
      var t = String(typed == null ? "" : typed).trim();
      if (!t) return { disc: "", words: "" };
      var low = t.toLowerCase(), code = norm(t), byName = null, byCode = [];
      (host.entries() || []).forEach(function (e) {
        if (String(e.discipline).toLowerCase() === low) byName = e.discipline;
        if (norm(e.canonical_subj4) === code) byCode.push(e.discipline);
      });
      if (byName) return { disc: byName, words: "Files it under " + byName + "." };
      if (byCode.length === 1) return { disc: byCode[0], words: code + " is the Common SUBJ of " + byCode[0] + "; Save files it there." };
      if (byCode.length > 1) return { disc: "", words: code + " is the Common SUBJ of " + byCode.sort().join(" and ") + "; type the MQ discipline you mean." };
      return { disc: "", words: "No MQ discipline or Common SUBJ reads " + t + "; type a discipline's name or its Common SUBJ." };
    }
    function filingOf(r) { return (r.conf && r.conf.value) || r.disc || ""; }
    function saveRow(r) {
      var L = st.ls, d = L.draft || {}, note = String(d.note == null ? "" : d.note);
      var typed = String(d.disc == null ? "" : d.disc).trim(), res = resolveDisc(typed), cur = filingOf(r);
      if (typed && typed !== cur && !res.disc) { L.note = res.words + " Nothing was saved."; host.render(); return Promise.resolve(); }
      var refile = !!(res.disc && res.disc !== cur), renote = note !== r.note;
      if (!refile && !renote) { L.edit = null; L.draft = null; L.note = "Nothing changed."; host.render(); return Promise.resolve(); }
      L.busy = true; host.render();
      var said = [];
      var chain = refile ? confirmFiling(r, res.disc).then(function (x) { if (x.ok) said.push(x.words); return x; }) : Promise.resolve({ ok: true });
      return chain.then(function (x) {
        if (!x.ok || !renote) return x;
        return write(r, F_NOTE, note).then(function (y) { if (y.ok) said.push("Saved the note on " + r.ut + "."); return y; });
      }).then(function (x) {
        L.busy = false;
        if (x.ok) { L.edit = null; L.draft = null; L.note = said.join(" "); engine().markChanged([r.ut]); }
        else L.note = said.concat([x.words]).join(" ");
        host.render();
      });
    }

    /* ── the courses sidebar (S733) ── */
    function subjects() { return window.CPL_COMMONS_SUBJECTS || null; }
    function needSubjects(then) {
      if (subjects()) { then(); return; }
      var T = window.CPL_TABS;
      if (st.subjFailed || !T || typeof T.loadScript !== "function") { st.subjFailed = true; then(); return; }
      if (st.subjWait) { st.subjWait.push(then); return; }
      st.subjWait = [then];
      T.loadScript("commons_subjects.js", "CPL_COMMONS_SUBJECTS", function () {
        var w = st.subjWait; st.subjWait = null;
        if (!subjects()) st.subjFailed = true;
        w.forEach(function (f) { f(); });
      });
    }
    function openSide(code) {
      if (st.side !== code) { st.side = code; st.sideMsg = ""; st.focusSide = true; }
      drawSide();
    }
    function closeSide() {
      var code = st.side;
      st.side = null; st.sideMsg = "";
      if (st.ls.open && st.ls.open.ut === code) st.ls.open = null;
      host.render();
      var f = document.getElementById("csls-find");
      if (f && f.focus) f.focus();
    }
    function courses(code) {
      var C = st.courses[code];
      if (C) return C;
      C = st.courses[code] = { rows: null, err: "" };
      needSubjects(function () {
        var A = subjects();
        if (!A || typeof A.localCourses !== "function") { C.err = "the Subjects tab's code (commons_subjects.js) could not be loaded"; drawSide(); return; }
        A.localCourses(code).then(function (rows) { C.rows = rows; drawSide(); },
          function (e) { C.err = String(e && e.message || e); drawSide(); });
      });
      return C;
    }
    var SIDE_CSS = [
      /* The Subjects tab's sidebar styles read the Commons' --cmn roles; on this tab they take First Light's tokens. */
      "#cs-local { --cmn-surface:var(--surface-opaque); --cmn-dialog:var(--surface-opaque); --cmn-ink:var(--text-body); --cmn-ink-2:var(--text-body); --cmn-muted:var(--text-muted); --cmn-heading:var(--text-strong); --cmn-title:var(--text-strong); --cmn-link:var(--accent-link); --cmn-accent:var(--cobalt); --cmn-line:var(--border); --cmn-line-soft:var(--border); --cmn-serif:inherit; }",
      "@media (min-width: 900px) { #cs-local.csb-beside > .csls-page { margin-right:var(--csb-panel-w, 620px); } }",
      ".csls-side-tbl { width:100%; border-collapse:collapse; table-layout:fixed; font-size:.92rem; }",
      ".csls-side-tbl th, .csls-side-tbl td { text-align:left; vertical-align:top; padding:6px 8px; border-bottom:1px solid var(--border); overflow-wrap:break-word; word-break:normal; }",
      ".csls-vh { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }",
      ".csls-side-tbl thead th { color:var(--text-strong); font-weight:600; }",
      ".csls-side-tbl .csls-c-box { width:2.25rem; } .csls-side-tbl .csls-c-course { width:28%; } .csls-side-tbl .csls-c-mid { width:30%; }",
      ".csls-side-tbl input[type=checkbox] { width:24px; height:24px; margin:0; }",
      ".csls-side-wrap { overflow-x:auto; max-width:100%; }",
      ".csls-sub { display:block; color:var(--text-muted); font-size:.86rem; }",
      ".csls-off { font-weight:600; color:var(--text-strong); }",
      ".csls-side-move { position:sticky; bottom:0; display:grid; gap:6px; padding:10px 0 4px; background:var(--surface-opaque); border-top:1px solid var(--border); }",
      ".csls-side-move label { font-weight:600; color:var(--text-strong); }",
      ".csls-side-row { display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; }",
      ".csls-side-in { font:inherit; min-height:32px; padding:4px 8px; box-sizing:border-box; width:min(16rem, 100%); border:1px solid var(--border-strong); border-radius:6px; color:var(--text-body); background:var(--surface-opaque); text-transform:uppercase; }",
      ".csls-side-in:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; }",
      ".csls-side p { margin:0; }",
      "@media (max-width: 560px) { .csls-side-tbl { font-size:.88rem; } .csls-side-tbl .csls-c-mid { width:34%; } }"
    ].join("\n");
    function ensureSideCss(A) {
      if (A && typeof A.ensureCss === "function") A.ensureCss();
      if (document.getElementById("csls-side-css")) return;
      var s = document.createElement("style"); s.id = "csls-side-css"; s.textContent = SIDE_CSS;
      document.head.appendChild(s);
    }
    /* The common subject a code's courses are measured against: the row's filing, else the one most of its courses'
       M-IDs sit under (half or more), else none. */
    function refOf(r, rows) {
      if (r && r.subj) return { code: r.subj, why: "" };
      var n = {}, all = 0;
      rows.forEach(function (c) { if (c.minted) { n[c.minted] = (n[c.minted] || 0) + 1; all += 1; } });
      var top = Object.keys(n).sort(function (a, b) { return n[b] - n[a] || cmp(a, b); })[0];
      return top && n[top] * 2 >= all ? { code: top, why: ", where most of its courses' M-IDs sit" } : { code: "", why: "" };
    }
    function whereWords(c, ref) {
      if (c.move) return null;
      if (!c.mid) return "No M-ID yet";
      var under = c.minted + (c.mintedName ? " " + c.mintedName : "");
      if (ref.code && c.minted !== ref.code) return "Under another subject: " + under;
      return "Under " + under;
    }
    function sideBody(r, E) {
      var el = E.el, word = E.word, code = st.side, C = courses(code), A = subjects(), signed = !!host.session(), out = [];
      var filing = r ? (r.how === "moved" ? r.conf.value : r.disc || (r.conf ? r.conf.value : "")) : "";
      if (C.err) { out.push(el("p", { cls: "cs-caution", role: "alert", text: "The courses under " + code + " could not be read (" + C.err + "). Close the panel and open it again to retry." })); return out; }
      if (!C.rows) { out.push(el("p", { cls: "cs-quiet", role: "status", text: "Reading the courses under " + code + "…" })); return out; }
      var rows = C.rows, cols = {};
      rows.forEach(function (c) { cols[c.college] = 1; });
      out.push(el("p", { cls: "cs-quiet", id: "csls-side-sum", text: "COCI lists " + plural(rows.length, "course", "courses") + " under " + code + " at "
        + plural(Object.keys(cols).length, "college", "colleges") + ". " + (filing ? "This list files " + code + " under " + filing + (r.subj ? ", whose Common SUBJ is " + r.subj : "") + "."
        : "No MQ discipline is filed for " + code + " yet.") + (r && r.spread.length ? " In the seed: " + landsWords(r) + "." : "") }));
      if (!rows.length) return out;
      var ref = refOf(r, rows);
      var off = rows.filter(function (c) { return !c.move && c.mid && ref.code && c.minted !== ref.code; });
      if (off.length) out.push(el("p", { cls: "csls-off", id: "csls-side-off", text: plural(off.length, "course holds", "courses hold") + " an M-ID under another subject than "
        + ref.code + ref.why + ": " + off.map(function (c) { return c.code + " " + c.number + " " + c.title + " (" + c.minted + (c.mintedName ? " " + c.mintedName : "") + ")"; }).join("; ") + "." }));
      var boxes = [];
      var tbl = el("table", { cls: "csls-side-tbl" }, [
        el("colgroup", null, (signed ? [el("col", { cls: "csls-c-box" })] : []).concat([el("col", { cls: "csls-c-course" }), el("col"), el("col", { cls: "csls-c-mid" })])),
        el("thead", null, [el("tr", null, (signed ? [el("th", { scope: "col" }, [el("span", { cls: "csls-vh", text: "Move" })])] : []).concat(["Course", "Title", "M-ID and where it sits"].map(function (t) { return el("th", { scope: "col", text: t }); })))]),
        el("tbody", null, rows.map(function (c, i) {
          var name = c.code + " " + c.number, theirs = c.move && !c.move.mine;
          var kids = [];
          if (signed) {
            var b = el("input", { type: "checkbox", cls: "csls-move", id: "csls-move-" + i, "aria-label": "Move " + name + " " + c.title + ", " + c.college,
              disabled: theirs || !c.slug ? true : null });
            b._course = c; boxes.push(b);
            kids.push(el("td", null, [b]));
          }
          var where = [c.mid ? el("span", { text: c.mid }) : null];
          var w = whereWords(c, ref);
          if (w) where.push(el("span", { cls: "csls-sub" + (/another subject/.test(w) ? " csls-off" : ""), text: w }));
          if (c.move) {
            where.push(el("span", { cls: "csls-sub csls-moved", "data-moved": c.move.common, text: "Moved to " + c.move.common + (c.move.commonName ? " " + c.move.commonName : "")
              + " by " + c.move.by + (c.move.at ? ", " + c.move.at : "") + ". The M-ID moves at the next re-mint." }));
            if (c.move.mine && signed) where.push(word("Take it back", function () { takeBack(c, name); }, { "aria-label": "Take back the move of " + name, "data-move-undo": c.key }));
          }
          if (!c.slug) where.push(el("span", { cls: "csls-sub", text: "Its college is not on the Subjects tab's list, so it cannot be moved here." }));
          kids.push(el("th", { scope: "row" }, [name, el("span", { cls: "csls-sub", text: c.college })]), el("td", { text: c.title }), el("td", null, where));
          return el("tr", { "data-course": c.key || (c.college + "|" + name), "data-off": w && /another subject/.test(w) ? "yes" : null }, kids);
        }))]);
      out.push(el("div", { cls: "csls-side-wrap", role: "region", "aria-label": "Courses under " + code + ", statewide", tabindex: "0" }, [tbl]));
      if (!signed) {
        out.push(el("p", { cls: "cs-lede", id: "csls-side-signin" }, ["Sign in to move a course. The sign-in sits on the Reference view. ", word("Go to the Reference view", function () { host.signIn(); })]));
        return out;
      }
      var list = A && typeof A.codeList === "function" ? A.codeList() : null;
      var inp = el("input", { type: "text", id: "csls-move-to", cls: "csls-side-in", list: list ? list.id : null, autocomplete: "off", placeholder: "IDST, or pick one",
        "aria-describedby": "csls-move-msg" });
      var msg = el("p", { cls: "cs-quiet", id: "csls-move-msg", role: "status", tabindex: "-1", text: st.sideMsg || "" });
      var go = word("Move the checked courses", function () { move(boxes, inp.value, msg, go); }, { id: "csls-move-go" });
      out.push(el("div", { cls: "csls-side-move", role: "group", "aria-labelledby": "csls-move-lbl" }, [
        el("label", { id: "csls-move-lbl", "for": "csls-move-to", text: "Move the checked courses to the common subject" }),
        el("div", { cls: "csls-side-row" }, [inp, list, go]),
        el("p", { cls: "csls-sub", text: "Type its Common SUBJ or pick it from the list. Each move is saved under your sign-in and shows on its course here and on the Subjects tab; a course another person moved keeps that move." }),
        msg]));
      return out;
    }
    function codeOf(typed) {
      var A = subjects(), C = A && A.commonCodes ? A.commonCodes() : null, t = String(typed || "").trim();
      if (!C) return { err: "The list of common subjects could not be read, so no code can be checked. Nothing was saved." };
      var m = /\(([A-Za-z0-9]{2,6})\)\s*$/.exec(t), k = (m ? m[1] : t).toUpperCase();
      if (C[k]) return { code: k };
      var low = t.toLowerCase(), hit = Object.keys(C).filter(function (x) { return String(C[x]).toLowerCase() === low; });
      if (hit.length === 1) return { code: hit[0] };
      return { err: (t ? t + " is not a common subject on the Common Subjects Reference." : "Type or pick the common subject they belong under.") + " Nothing was saved." };
    }
    function move(boxes, typed, msg, go) {
      var A = subjects(), on = boxes.filter(function (b) { return b.checked && !b.disabled; });
      function say(t) { st.sideMsg = t; msg.textContent = t; }
      if (!on.length) { say("Check one course or more first."); return Promise.resolve(); }
      var k = codeOf(typed);
      if (k.err) { say(k.err); return Promise.resolve(); }
      go.disabled = true;
      say("Moving " + plural(on.length, "course", "courses") + " to " + k.code + "…");
      return A.moveCourses(on.map(function (b) { return b._course; }), k.code).then(function (R) {
        var w = R.done.length ? "Moved " + R.done.map(function (c) { return c.code + " " + c.number; }).join(", ") + " to " + k.code + ". The M-IDs move at the next re-mint." : "";
        if (R.bad.length) w += (w ? " " : "") + "Not moved: " + R.bad.map(function (c) { return c.code + " " + c.number + " (" + c.college + ")"; }).join(", ")
          + (R.lapsed ? ". Your sign-in has ended; sign in again, then move them." : ". Only a reviewer on the list may move a course; press again to retry.");
        st.sideMsg = w;
        if (R.done.length) delete st.courses[st.side];
        drawSide("csls-move-msg");
      }, function () { go.disabled = false; say("The move did not reach the reference (network). Nothing more was saved."); });
    }
    function takeBack(c, name) {
      return subjects().takeBackMove(c.key).then(function (res) {
        st.sideMsg = res.ok && res.n ? "Taken back the move of " + name + "." : "Not taken back: " + (res.lapsed ? "your sign-in has ended; sign in again." : "the reference refused it; try again.");
        if (res.ok && res.n) delete st.courses[st.side];
        drawSide("csls-move-msg");
      }, function () { st.sideMsg = "Not taken back: the network failed; try again."; drawSide("csls-move-msg"); });
    }
    function drawSide(focusId) {
      var node = st.node, E = engine();
      if (!node || !E) return;
      Array.prototype.slice.call(node.children).forEach(function (n) { if (n.classList && n.classList.contains("csb-panel")) node.removeChild(n); });
      var A = subjects(), lay = A && A.sidebar;
      if (!st.side) { if (lay) lay.off(node); return; }
      ensureSideCss(A);
      var r = rows().filter(function (x) { return x.ut === st.side; })[0] || null;
      var close = E.word("Close", closeSide, { id: "csls-side-close" });
      var title = st.side + (r ? ", " + (r.subj ? "filed under " + r.subj : "no Common SUBJ yet") : "");
      var panel = E.el("aside", { cls: "csb-panel csb-side csls-side", id: "csls-side", role: "dialog", "aria-labelledby": "csls-side-h" }, [
        E.el("div", { cls: "csb-panel-in" }, [
          E.el("div", { cls: "csb-panel-head" }, [
            E.el("div", { cls: "csb-panel-top" }, [E.el("p", { cls: "csb-eyebrow", text: "Courses under a local subject, statewide" }), close]),
            E.el("h3", { id: "csls-side-h", tabindex: "-1", text: title })])].concat(sideBody(r, E)))]);
      panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeSide(); } });
      if (lay) panel.insertBefore(lay.grip(panel, "csls-side-grip"), panel.firstChild);
      node.appendChild(panel);
      if (lay) lay.layout(node);
      if (!st.resizeOn) {
        st.resizeOn = true;
        try { window.addEventListener("resize", function () { var S = subjects(); if (st.side && st.node && S && S.sidebar) S.sidebar.layout(st.node); }); } catch (e) { /* the panel keeps its place */ }
      }
      var f = focusId ? document.getElementById(focusId) : st.focusSide ? document.getElementById("csls-side-h") : null;
      st.focusSide = false;
      if (f && f.focus) f.focus();
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
            + "Confirm records a person's yes, and Edit files a code under another discipline; the map itself changes under DR-25, Sam's, when a session applies the filings. "
            + "A code's Courses opens its courses beside the list, where a signed-in reviewer moves one or several to another common subject." }));
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
        /* Edit changes the filing (an MQ discipline by name or its Common SUBJ, picked or typed) and the note. */
        edit: { fields: [{ id: "csls-disc", label: "MQ discipline (or its Common SUBJ)", key: "disc", ph: "Astronomy, or ASTR" },
          { id: "csls-note", label: "Note", key: "note" }],
          draft: function (r) { return { disc: filingOf(r), note: r.note }; }, save: saveRow,
          onInput: function (r, key, d) { if (key === "disc") d._hint = String(d.disc || "").trim() === filingOf(r) ? "" : resolveDisc(d.disc).words; },
          extra: function () {
            var E = engine(), names = (host.entries() || []).map(function (e) { return e.discipline; }).sort();
            Promise.resolve().then(function () { var i = document.getElementById("csls-disc"); if (i) i.setAttribute("list", "csls-disc-list"); });
            return [E.el("datalist", { id: "csls-disc-list" }, names.map(function (n) { return E.el("option", { value: n }); }))];
          } }
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
        if (!E) return;
        /* The list draws in its own page box, so a sidebar beside it is the box's sibling and the box gives up its width. */
        st.node = node;
        if (node.setAttribute) node.setAttribute("data-csb-view-root", "");
        var page = E.el("div", { cls: "csls-page" });
        node.appendChild(page);
        E.render(page);
        drawSide();
      },
      openSide: openSide,
      setFilter: function (f) { st.ls.f = FILTERS.some(function (x) { return x[0] === f; }) ? f : ""; st.ls.q = ""; },
      // The Subjects List's panel opens one code here (Refile <code> in Local subjects, 2026-11-04): every filter, the finder set.
      setFind: function (q) { st.ls.f = ""; st.ls.q = q || ""; },
      rows: rows, state: st, load: load
    };
  }

  window.CPL_CSR_LOCAL = { create: create, buildRows: buildRows, norm: norm, suggestOf: suggestOf, KEY: KEY, F_CONFIRM: F_CONFIRM,
    F_NOTE: F_NOTE, FILTERS: FILTERS, MAP_URL: MAP_URL };
})();
