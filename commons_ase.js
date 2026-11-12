// commons_ase.js — the CPL Commons' first slice: where an ASE certification can count, at every college.
//
// The Commons plan's v2 Agreed final (#3111, comment 6808952144; Sam's go, Open Asks Sheet 181 card 10, "Go when
// built"): "A person names what they have learned, and the Commons shows every course at every college it likely
// counts for, how strong the match is, and how to ask for it." The first slice is ASE, end to end: every ASE
// credential in MAP at every college in one of three states (lists credit, a likely match with its level, no answer
// yet), with the level, the reasons, and Request CPL Review where the college has it on. A best-effort stamp, and a
// source and read date under each fact. The page never says credit is awarded; faculty award it. The slice ends with
// the data gaps it found, drawn on the page.
//
// What it reads, all committed files the site already serves (it WRITES NOTHING):
//   kb/exhibits_related.json        the reference's titles, each with its issuer (the credential's issuer, on the
//                                   title) and its local exhibits by CPL path (kb/exhibit_paths.py: the path and who
//                                   assessed the student, read from the MAP id). Scope is the issuer on the title:
//                                   a title the colleges issue stays out even when its exhibits were assessed by ASE
//                                   (docs/reference/canonical_credential_model.md, ruling 1).
//   kb/exhibits_adoption.json       per credential, each college that lists credit (units, course, recommendation)
//                                   and each college that teaches a course in the same common course.
//   library/adopt/adopt_ai.json     CPL-AI's course ratings against each certification, three tiers.
//   kb/credential_title_moves.json  where a renamed title went, built by kb/credential_aliases.py. Every stored title
//                                   (a file's key, an address) resolves through CPL_MAP_LINKS.nowTitle, the browser's
//                                   one reader of that table (map_links.js); this file holds no resolver of its own.
//   map_links.js's index            the MAP exhibit each college built, for the source link under a listed credit.
// Request CPL Review: no file or table COBI holds says which colleges have it on, so the page links it nowhere and
// names the gap (the plan: link it "only where that state is read from MAP").
//
// Loaded by commons.js when the address names it (#commons/ase, #commons/ase/<title>). The certification picked lasts
// the visit; only the address carries it. Tokens only (the tab's --cmn roles), words for every control, no glyphs.
(function () {
  "use strict";

  var FILES = {
    related: "kb/exhibits_related.json",
    adoption: "kb/exhibits_adoption.json",
    ai: "library/adopt/adopt_ai.json",
    moves: "kb/credential_title_moves.json"
  };
  var ISSUER = /Automotive Service Excellence/i;   // the credential's issuer, read from the title's issuer field only
  var LEVELS = { strong: "Strong", partial: "Partial", limited: "Limited" };
  var RANK = { strong: 1, partial: 2, limited: 3 };
  var AI_LEVEL = { 1: "strong", 2: "partial", 3: "limited" };   // CPL-AI's three tiers, the alignment scale
  var STATES = {
    credit: { word: "Lists credit", plural: "list credit", line: "This college lists credit for it in MAP." },
    likely: { word: "Likely match", plural: "likely match", line: "No credit is listed yet. A course here likely matches." },
    none: { word: "No answer yet", plural: "no answer yet", line: "We have no answer for this college yet." }
  };
  var ORDER = ["credit", "likely", "none"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "cls") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  function units(n) { return n == null ? "" : (Math.round(Number(n) * 10) / 10) + (Number(n) === 1 ? " unit" : " units"); }
  function day(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
    return m ? MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1] : "a date the file does not give";
  }
  function has(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function L() { return window.CPL_MAP_LINKS || null; }

  /* ── the model: every ASE credential at every college, in one of three states ── */
  function model(f) {
    f = f || {};
    var rel = f.related || {}, ad = f.adoption || {}, ai = f.ai || {}, mv = f.moves || {}, idx = f.index || null;
    var issuers = Array.isArray(rel.issuers) ? rel.issuers : [];
    var live = {}, creds = {}, list = [];
    (rel.titles || []).forEach(function (t) {
      if (!Array.isArray(t) || t[4] !== 0) return;     // 0: in the reference; 1: only proposed
      live[t[0]] = 1;
      var issuer = t[1] == null ? "" : issuers[t[1]] || "";
      if (!ISSUER.test(issuer)) return;
      var c = { title: t[0], issuer: issuer, locals: t[2] || 0, earlier: Array.isArray(t[5]) ? t[5] : [],
        paths: Array.isArray(t[6]) ? t[6] : [], credit: {}, teaches: {}, ai: {}, exhibits: [] };
      creds[t[0]] = c; list.push(c);
    });
    var nowTitle = L() && L().nowTitle;
    function resolve(k) { return nowTitle ? nowTitle(mv.moves || {}, k, live, mv.retires || {}) : k; }
    /* A key a rename moved joins the title it moved to, after that title's own entries. */
    function byResolved(obj, each) {
      var keys = Object.keys(obj || {});
      keys.filter(function (k) { return resolve(k) === k; }).concat(keys.filter(function (k) { return resolve(k) !== k; }))
        .forEach(function (k) { var c = creds[resolve(k)]; if (c) each(c, obj[k], k); });
    }
    var colleges = Array.isArray(ad.colleges) ? ad.colleges : [];
    byResolved(ad.credentials, function (c, e) {
      Object.keys((e && e.a) || {}).forEach(function (i) {
        var name = colleges[+i], v = e.a[i];
        if (!name || has(c.credit, name)) return;
        c.credit[name] = { units: v && v[0], lines: (v && v[1]) || [] };
      });
      Object.keys((e && e.c) || {}).forEach(function (i) {
        var name = colleges[+i];
        if (!name || has(c.teaches, name)) return;
        c.teaches[name] = ((e.c[i]) || []).map(function (r) { return r && r[0]; }).filter(Boolean);
      });
      ((e && e.x) || []).forEach(function (x) { if (x && x[0] && c.exhibits.indexOf(x[0]) < 0) c.exhibits.push(x[0]); });
    });
    var aiColleges = Array.isArray(ai.colleges) ? ai.colleges : [];
    byResolved(ai.by_exhibit, function (c, certs) {
      (certs || []).forEach(function (cert) {
        Object.keys((cert && cert.by_college) || {}).forEach(function (k) {
          var name = /^\d+$/.test(k) ? aiColleges[+k] : k, rows = cert.by_college[k] || [];
          if (!name || !rows.length) return;
          var best = rows.slice().sort(function (a, b) { return a[2] - b[2] || (b[3] || 0) - (a[3] || 0); })[0];
          var lv = AI_LEVEL[best[2]];
          if (!lv) return;
          var had = c.ai[name];
          if (!had || RANK[lv] < RANK[had.level]) c.ai[name] = { level: lv, course: best[0], course_title: best[1], tier: best[2],
            matched: best[3], areas: best[4], cert: cert.title || cert.code || "" };
        });
      });
    });
    list.sort(function (a, b) { return a.title.localeCompare(b.title); });
    return { creds: creds, list: list, colleges: colleges, live: live, resolve: resolve, index: idx,
      tiers: ai.tiers || {}, aiPage: ai.page || "", aiCredit: ai.credit || "",
      read: { adoption: ad.written_at, ai: ai.written_at, related: rel.generated_at, map: idx && idx.checked_at } };
  }

  /* One pair: a credential at a college. */
  function pair(M, c, college) {
    var cr = c.credit[college];
    if (cr) return { state: "credit", credit: cr, exhibit: exhibitFor(M, c, college) };
    var reasons = [], level = null;
    var a = c.ai[college];
    if (a) {
      level = a.level;
      reasons.push({ kind: "ai", level: a.level, text: "CPL-AI rated " + a.course + (a.course_title ? " (" + a.course_title + ")" : "") + " against " +
        a.cert + ": " + fmt(a.matched) + " of " + fmt(a.areas) + " skill areas matched, " + (M.tiers[a.tier] || "tier " + a.tier).toLowerCase() + "." });
    }
    var t = c.teaches[college];
    if (t && t.length) {
      /* One identity signal (the credited course) agrees: partial on the identity scale (the plan's level rule). */
      if (!level || RANK.partial < RANK[level]) level = "partial";
      reasons.push({ kind: "course", level: "partial", text: "Teaches " + t.slice(0, 3).join(", ") + ", in the same common course other colleges list credit through for it." });
    }
    if (level) return { state: "likely", level: level, reasons: reasons };
    return { state: "none" };
  }
  /* The MAP exhibit this college built for the title, for the source link (map_links.js's index, renames read in). */
  function exhibitFor(M, c, college) {
    var idx = M.index;
    if (!idx || !idx.by_title || !idx.found) return null;
    var ids = idx.by_title[c.title] || [];
    for (var i = 0; i < ids.length; i++) {
      var rec = idx.found[String(ids[i]).toUpperCase()];
      if (rec && rec.college === college) return ids[i];
    }
    return null;
  }
  function tally(M, c) {
    var n = { credit: 0, likely: 0, none: 0 };
    M.colleges.forEach(function (col) { n[pair(M, c, col).state]++; });
    return n;
  }

  /* ── the view ── */
  var S = { cur: "", show: "all", missing: "" };
  function address() { return S.cur ? "commons/ase/" + encodeURIComponent(S.cur) : "commons/ase"; }

  function pathWords(M, c) {
    var R = (M.related && M.related.paths) || {};
    var parts = c.paths.map(function (p) {
      var words = (R[p[0]] && R[p[0]].words) || p[0], who = R[p[0]] ? R[p[0]].assessed_by : "";
      var by = who === "issuer" ? "assessed by " + c.issuer : who === "college" ? "assessed by the college" : "assessor not recorded";
      return fmt(p[1]) + " by " + words + " (" + by + ")";
    });
    var n = c.paths.reduce(function (s, p) { return s + p[1]; }, 0);
    return parts.length ? "Colleges list it through " + fmt(n) + (n === 1 ? " local exhibit: " : " local exhibits: ") + parts.join("; ") + "." : "";
  }

  function stamp(M) {
    return el("p", { cls: "cas-stamp", id: "cas-stamp" }, [
      el("strong", { text: "Best effort. " }),
      "Read from public records: MAP's exhibits and articulations (read " + day(M.read.adoption) + "), CPL-AI's course ratings (read " + day(M.read.ai) +
      "). A college's faculty decide whether to award credit; this page lists what we found and how to ask."
    ]);
  }
  function trail(here) {
    return el("p", { cls: "cas-trail" }, [el("a", { href: "#commons", text: "CPL Commons" }), " / ",
      here ? el("a", { href: "#commons/ase", "data-cas-go": "", text: "ASE" }) : el("span", { text: "ASE" }),
      here ? " / " : null, here ? el("span", { text: here }) : null]);
  }
  function picker(M) {
    var sel = el("select", { id: "cas-pick", cls: "cas-select" }, [el("option", { value: "", text: "Every ASE certification" })]
      .concat(M.list.map(function (c) { var o = el("option", { value: c.title, text: c.title }); if (c.title === S.cur) o.setAttribute("selected", "selected"); return o; })));
    var go = el("button", { type: "button", cls: "cmn-word", id: "cas-show", text: "Show" });
    go.addEventListener("click", function () { open(sel.value); });
    return el("div", { cls: "cas-pickrow" }, [el("label", { "for": "cas-pick", cls: "cas-label", text: "Your ASE certification" }), sel, go]);
  }

  function overview(M, wrap) {
    var tot = { credit: 0, likely: 0, none: 0 }, rows = [];
    M.list.forEach(function (c) { var n = tally(M, c); ORDER.forEach(function (k) { tot[k] += n[k]; }); rows.push([c, n]); });
    var pairs = M.list.length * M.colleges.length;
    var answered = tot.credit + tot.likely;
    wrap.appendChild(el("p", { cls: "cas-top", id: "cas-top" }, [
      el("strong", { text: pairs ? Math.round(100 * answered / pairs) + "%" : "None" }),
      " of the " + fmt(pairs) + " pairs of an ASE certification and a college have an answer and a next step: " +
      fmt(tot.credit) + " list credit, " + fmt(tot.likely) + " a likely match, " + fmt(tot.none) + " no answer yet. " +
      fmt(M.list.length) + " ASE certifications, " + fmt(M.colleges.length) + " colleges."
    ]));
    var tbl = el("table", { cls: "cas-table" }, [
      el("caption", { cls: "cas-sr", text: "Each ASE certification and how many colleges are in each state" }),
      el("colgroup", null, [el("col", { cls: "cas-c-name" }), el("col"), el("col"), el("col")]),
      el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "ASE certification" })].concat(ORDER.map(function (k) { return el("th", { scope: "col", text: STATES[k].word }); })))]),
      el("tbody", null, rows.map(function (r) {
        var a = el("a", { href: "#commons/ase/" + encodeURIComponent(r[0].title), "data-cas-go": r[0].title, text: r[0].title });
        return el("tr", { "data-title": r[0].title }, [el("th", { scope: "row" }, [a])].concat(ORDER.map(function (k) { return el("td", { text: fmt(r[1][k]) }); })));
      }))
    ]);
    wrap.appendChild(el("div", { cls: "cas-wrap", role: "region", "aria-label": "ASE certifications by state", tabindex: "0" }, [tbl]));
  }

  function credView(M, c, wrap) {
    wrap.appendChild(el("p", { cls: "cas-issuer", id: "cas-issuer" }, ["Issued by ", el("strong", { text: c.issuer }), "."]));
    var pw = pathWords(M, c);
    if (pw) wrap.appendChild(el("p", { cls: "cas-paths", id: "cas-paths", text: pw }));
    if (c.earlier.length) wrap.appendChild(el("p", { cls: "cas-aka", text: "Also known as: " + c.earlier.slice(0, 6).join("; ") + "." }));
    var n = tally(M, c);
    var figs = el("div", { cls: "cas-figs", role: "group", "aria-label": "Show colleges by state" }, [["all", "All " + fmt(M.colleges.length) + " colleges"]].concat(ORDER.map(function (k) {
      return [k, STATES[k].word + ": " + fmt(n[k])];
    })).map(function (f) {
      var b = el("button", { type: "button", cls: "cmn-word cas-fig", "data-show": f[0], "aria-pressed": S.show === f[0] ? "true" : "false", text: f[1] });
      b.addEventListener("click", function () { S.show = f[0]; draw(); });
      return b;
    }));
    wrap.appendChild(figs);
    var body = el("tbody");
    var tbl = el("table", { cls: "cas-table", id: "cas-colleges" }, [
      el("caption", { cls: "cas-sr", text: "Every college and what we found for " + c.title }),
      el("colgroup", null, [el("col", { cls: "cas-c-col" }), el("col", { cls: "cas-c-state" }), el("col")]),
      el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "College" }), el("th", { scope: "col", text: "What we found" }), el("th", { scope: "col", text: "Why, and where it comes from" })])]),
      body
    ]);
    function draw() {
      body.textContent = "";
      Array.prototype.forEach.call(figs.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-show") === S.show ? "true" : "false"); });
      var all = M.colleges.map(function (col) { return [col, pair(M, c, col)]; });
      all.sort(function (a, b) {
        return ORDER.indexOf(a[1].state) - ORDER.indexOf(b[1].state) || (RANK[a[1].level] || 0) - (RANK[b[1].level] || 0) || a[0].localeCompare(b[0]);
      });
      all.filter(function (r) { return S.show === "all" || r[1].state === S.show; }).forEach(function (r) { body.appendChild(collegeRow(M, c, r[0], r[1])); });
      if (!body.children.length) body.appendChild(el("tr", null, [el("td", { colspan: "3", text: "No college is in this state." })]));
    }
    draw();
    wrap.appendChild(el("div", { cls: "cas-wrap", role: "region", "aria-label": "Colleges for " + c.title, tabindex: "0" }, [tbl]));
    wrap.appendChild(el("p", { cls: "cas-ask", id: "cas-ask" }, [el("strong", { text: "How to ask. " }),
      "Ask the college's credit for prior learning office to review your ASE certificate. MAP's Request CPL Review is not linked here yet: we cannot yet read which colleges have it on."]));
  }
  function collegeRow(M, c, college, p) {
    var why = el("td", { cls: "cas-why" }), what = el("td", { cls: "cas-what" }, [el("span", { cls: "cas-state cas-state-" + p.state, text: STATES[p.state].word })]);
    if (p.state === "credit") {
      var lines = p.credit.lines.slice(0, 3).map(function (l) { return l[0] + (l[1] ? " (" + l[1] + ")" : ""); });
      why.appendChild(el("p", { text: (p.credit.units != null ? units(p.credit.units) + ": " : "") + (lines.join("; ") || "the course is not named") + "." }));
      var src = el("p", { cls: "cas-src" }, ["Source: MAP's articulations, read " + day(M.read.adoption) + "."]);
      if (p.exhibit && L() && L().url) src.appendChild(document.createTextNode(" "));
      if (p.exhibit && L() && L().url) src.appendChild(el("a", { href: L().url(p.exhibit), target: "_blank", rel: "noopener", text: "See it in MAP" }));
      why.appendChild(src);
    } else if (p.state === "likely") {
      what.appendChild(el("span", { cls: "cas-level", "data-level": p.level, text: " " + LEVELS[p.level] }));
      p.reasons.forEach(function (r) { why.appendChild(el("p", { "data-reason": r.kind, text: r.text })); });
      var bits = p.reasons.map(function (r) { return r.kind === "ai" ? "CPL-AI's ratings, read " + day(M.read.ai) : "MAP's articulations at other colleges, read " + day(M.read.adoption); });
      var s2 = el("p", { cls: "cas-src" }, ["Source: " + bits.join("; ") + "."]);
      if (p.reasons.some(function (r) { return r.kind === "ai"; }) && M.aiPage) { s2.appendChild(document.createTextNode(" ")); s2.appendChild(el("a", { href: M.aiPage, target: "_blank", rel: "noopener", text: "About CPL-AI" })); }
      why.appendChild(s2);
    } else {
      why.appendChild(el("p", { cls: "cas-quiet", text: "No credit listed and no course rated or matched yet." }));
    }
    return el("tr", { "data-college": college, "data-state": p.state }, [el("th", { scope: "row", text: college }), what, why]);
  }

  /* The slice's receipt: the data gaps it found, counted from what it read. */
  function gaps(M) {
    var noAi = M.list.filter(function (c) { return !Object.keys(c.ai).length; }).length;
    var noEx = M.list.filter(function (c) { return !Object.keys(c.credit).length; }).length;
    var credit = 0, noSrc = 0;
    M.list.forEach(function (c) { Object.keys(c.credit).forEach(function (col) { credit++; if (!exhibitFor(M, c, col)) noSrc++; }); });
    var items = [
      "Request CPL Review: no table we hold says which colleges have it on, so the page links it nowhere. MAP holds that state.",
      "The colleges are the " + fmt(M.colleges.length) + " in the adoption file; MAP's own count is for MAP and ITPI to confirm.",
      fmt(noEx) + " of " + fmt(M.list.length) + " ASE certifications have no college listing credit, so every college reads a likely match or no answer for them.",
      fmt(noAi) + " of " + fmt(M.list.length) + " ASE certifications have no CPL-AI rating, so a likely match for them rests on the common course alone.",
      fmt(noSrc) + " of " + fmt(credit) + " listed credits have no MAP exhibit page found for that college (MAP's list was checked " + day(M.read.map) + ").",
      "A likely match reads two signals so far: CPL-AI's rating and the common course. The full list of signals is still to be built.",
      "MAP does not yet record whether a credit by exam is mirrored, or an apprenticeship path, so neither shows."
    ];
    return el("section", { cls: "cas-gaps", id: "cas-gaps", "aria-labelledby": "cas-gaps-h" }, [
      el("h3", { id: "cas-gaps-h", cls: "cas-h3", text: "What this page cannot show yet" }),
      el("ul", null, items.map(function (t) { return el("li", { text: t }); }))
    ]);
  }

  var VIEW = { root: null, M: null, noted: null };
  function render(root, M, title) {
    VIEW.root = root; VIEW.M = M;
    ensureCss();
    var want = title ? M.resolve(title) : "";
    S.missing = want && !M.creds[want] ? title : "";
    if (S.cur !== (S.missing ? "" : want)) S.show = "all";
    S.cur = S.missing ? "" : want;
    root.removeAttribute("style");
    root.textContent = "";
    var c = S.cur ? M.creds[S.cur] : null;
    var wrap = el("div", { cls: "cmn-wrap cas" });
    wrap.appendChild(trail(c ? c.title : ""));
    wrap.appendChild(el("header", { cls: "cmn-top" }, [
      el("h2", { cls: "cmn-title", id: "cas-h", text: c ? c.title : "Where your ASE certification can count" }),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      el("p", { cls: "cmn-lede", text: "Name the ASE certification you hold. The page shows each California community college: whether it lists credit for it, how strong a likely match is, and how to ask." })
    ]));
    wrap.appendChild(stamp(M));
    wrap.appendChild(picker(M));
    if (S.missing) wrap.appendChild(el("p", { cls: "cas-note", role: "status", text: "No ASE certification in the reference is named " + S.missing + ". Pick one below." }));
    if (c) credView(M, c, wrap); else overview(M, wrap);
    wrap.appendChild(gaps(M));
    wrap.appendChild(el("p", { cls: "cas-foot", text: M.aiCredit ? "CPL-AI: " + M.aiCredit : "" }));
    var page = el("div", { cls: "cmn-page" }, [wrap]);
    root.appendChild(page);
    Array.prototype.forEach.call(root.querySelectorAll("a[data-cas-go]"), function (a) {
      a.addEventListener("click", function (e) { if (e && e.preventDefault) e.preventDefault(); open(a.getAttribute("data-cas-go")); });
    });
    return page;
  }
  /* A pick: draw it and put it in the address, which is the only place it lives. */
  function open(title) {
    if (!VIEW.root || !VIEW.M) return;
    render(VIEW.root, VIEW.M, title || "");
    var h = "#" + address();
    try { if (window.history && history.pushState && location.hash !== h) history.pushState(null, "", h); } catch (e) { /* the view still draws */ }
    if (VIEW.noted) VIEW.noted(String(location.hash || ""));
    var h2 = VIEW.root.querySelector("#cas-h");
    if (h2) { h2.setAttribute("tabindex", "-1"); if (h2.focus) h2.focus(); }
  }

  function readJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r || !r.ok) throw new Error(url + " answered " + (r ? r.status : "nothing"));
      return r.json();
    });
  }
  function load() {
    var idx = L() && L().load ? Promise.resolve(L().load()).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([readJson(FILES.related), readJson(FILES.adoption), readJson(FILES.ai).catch(function () { return {}; }),
      readJson(FILES.moves).catch(function () { return {}; }), idx]).then(function (g) {
      var M = model({ related: g[0], adoption: g[1], ai: g[2], moves: g[3], index: g[4] });
      M.related = g[0];
      return M;
    });
  }
  var cache = null;
  function boot(root, title, opts) {
    opts = opts || {};
    VIEW.noted = opts.noted || null;
    if (!root) return Promise.resolve(null);
    if (!L()) { root.textContent = "The MAP links module (map_links.js) did not load, so stored titles cannot be read through their renames. Reload the tab to try again."; return Promise.resolve(null); }
    if (VIEW.M && cache) { render(root, VIEW.M, title); return Promise.resolve(VIEW.M); }
    root.textContent = "Reading the ASE slice…";
    cache = cache || load();
    return cache.then(function (M) {
      render(root, M, title);
      var h = "#" + address();
      if (title && location.hash !== h) { try { history.replaceState(null, "", h); } catch (e) { /* keep the view */ } if (VIEW.noted) VIEW.noted(String(location.hash || "")); }
      return M;
    }, function (e) {
      cache = null;
      root.textContent = "The ASE slice could not be read (" + (e && e.message ? e.message : e) + "). Reload the tab to try again.";
      return null;
    });
  }

  var CSS = [
    ".cmn-wrap.cas { grid-template-columns:minmax(0, 1fr); }",
    ".cas > * { min-width:0; }",
    ".cas .cas-trail { margin:0; color:var(--cmn-muted); font-size:.92rem; }",
    ".cas .cas-trail a { display:inline-block; min-height:24px; line-height:24px; }",
    ".cas-stamp, .cas-issuer, .cas-paths, .cas-aka, .cas-top, .cas-ask, .cas-note { margin:0; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".cas-stamp { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-left:4px solid var(--cmn-gold); border-radius:12px; padding:12px 16px; }",
    ".cas-issuer strong, .cas-top strong, .cas-stamp strong, .cas-ask strong { color:var(--cmn-heading); }",
    ".cas-top strong { font-family:var(--cmn-serif); font-size:1.6rem; }",
    ".cas-pickrow { display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; }",
    ".cas-label { font-weight:700; color:var(--cmn-heading); }",
    ".cas-select { font:inherit; min-height:32px; flex:1 1 16rem; min-width:0; width:100%; max-width:40rem; padding:4px 8px; border:1px solid var(--cmn-line); border-radius:6px; background:var(--cmn-surface); color:var(--cmn-ink); }",
    ".cas-select:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cas-figs { display:flex; flex-wrap:wrap; gap:4px 20px; }",
    ".cas-figs button.cmn-word[aria-pressed=\"true\"] { color:var(--cmn-heading); font-weight:700; text-decoration-thickness:3px; }",
    ".cas-wrap { overflow-x:auto; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; }",
    ".cas-wrap:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cas-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:.93rem; }",
    ".cas-table th, .cas-table td { text-align:left; vertical-align:top; padding:8px 12px; border-bottom:1px solid var(--cmn-line-soft); color:var(--cmn-ink); overflow-wrap:anywhere; }",
    ".cas-table thead th { font-size:.75rem; letter-spacing:.04em; text-transform:uppercase; color:var(--cmn-muted); font-weight:700; }",
    ".cas-table tbody th { font-weight:600; }",
    ".cas-table td { font-variant-numeric:tabular-nums; }",
    ".cas-table a { display:inline-block; min-height:24px; line-height:24px; color:var(--cmn-link); }",
    ".cas-c-name { width:46%; } .cas-c-col { width:26%; } .cas-c-state { width:20%; }",
    ".cas-why p { margin:0 0 4px; }",
    ".cas-src, .cas-quiet { color:var(--cmn-muted); font-size:.86rem; }",
    ".cas-state { font-weight:700; color:var(--cmn-heading); }",
    ".cas-level { color:var(--cmn-ink-2); font-weight:600; }",
    ".cas-gaps { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:16px 20px; }",
    ".cas-h3 { margin:0 0 8px; font-family:var(--cmn-serif); font-size:1.15rem; color:var(--cmn-heading); }",
    ".cas-gaps ul { margin:0; padding-left:20px; display:grid; gap:6px; color:var(--cmn-ink-2); }",
    ".cas-foot { margin:0; color:var(--cmn-muted); font-size:.85rem; }",
    ".cas-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }",
    "@media (max-width: 560px) { .cas-c-name { width:52%; } .cas-c-col { width:34%; } .cas-c-state { width:28%; } .cas-table th, .cas-table td { padding:8px; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cas-css")) return;
    document.head.appendChild(el("style", { id: "cas-css", text: CSS }));
  }

  window.CPL_COMMONS_ASE = {
    boot: boot, render: render, model: model, pair: pair, tally: tally, address: address, open: open, load: load,
    FILES: FILES, CSS: CSS, STATES: STATES, LEVELS: LEVELS, _state: S, _reset: function () { cache = null; VIEW.M = null; S.cur = ""; S.show = "all"; }
  };
})();
