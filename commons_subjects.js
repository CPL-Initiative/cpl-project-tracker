// commons_subjects.js — the CPL Commons' Subjects list: Steps a and b of Sam's curation order, college by college.
//
// Sam, 2026-11-20 (r-subjects-card-on-the-commons-sam-2026-11-20): "don't we need a commons card for subjects to house
// the common subjects and local subject titles we'll be establishing from catalog data?" His curation order runs Step a,
// the common subject code; Step b, the local subject title; Step c, the M-ID. Under his delegation the same day
// (d-step-b-owner-courses-bot-2026-11-20) the Courses bot drafts each local subject title from the catalog's subject
// heading, and a curator settles the codes the catalog and the state list disagree on.
//
// What it reads (WRITES NOTHING): kb/status/local_subject_titles.json, built by kb/_build_local_subject_titles.py from
// the printed catalogs (kb/hand_filed_catalogs/courses/), the state course list (coci_lookup_data.js), the subject map
// and the canonical SUBJ file. A catalog that prints the code alone reads TBA for its title.
//
// Addresses (loaded by commons.js when the address names it): #commons/subjects (every college),
// #commons/subjects/<college slug> (one college), #commons/subjects/disagree (the codes only one side prints, the
// curator's list), #commons/subjects/held (S695: the local subject codes the pile mint holds on, ranked by the held
// courses a decided common subject code releases; read from kb/status/held_subject_codes.json, built by
// kb/_held_subject_codes.py, and fetched only when that view opens). The view picked lasts the visit; only the address carries it. Tokens only (the tab's --cmn roles),
// words for every control, no glyphs.
(function () {
  "use strict";

  var FILE = "kb/status/local_subject_titles.json";
  var SIDES = { both: "Both", catalog: "Catalog only", state: "State list only" };
  var DISAGREE = "disagree";
  var HELD = "held";
  var HELD_FILE = "kb/status/held_subject_codes.json";

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

  var S = { view: "" };   /* "", a college slug, or "disagree": the visit's pick, which only the address carries */
  function address() { return S.view ? "commons/subjects/" + encodeURIComponent(S.view) : "commons/subjects"; }
  function go(href, text) { return el("a", { href: href, "data-csb-go": href.replace(/^#commons\/subjects\/?/, ""), text: text }); }

  function trail(here) {
    return el("p", { cls: "csb-trail" }, [el("a", { href: "#commons", text: "CPL Commons" }), " / ",
      here ? go("#commons/subjects", "Subjects") : "Subjects", here ? " / " + here : ""]);
  }

  /* The colleges, one row each: what its catalog prints and what it shares with the state list. */
  function collegeTable(M, list) {
    var tbl = el("table", { cls: "csb-table" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col"), el("col"), el("col"), el("col"), el("col")]),
      el("thead", null, [el("tr", null, ["College", "Subject codes the catalog prints", "Local titles drafted", "Both print", "Catalog only", "State list only"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, list.map(function (c) {
        return el("tr", { "data-college": c.slug }, [el("th", { scope: "row" }, [go("#commons/subjects/" + c.slug, c.college)]),
          el("td", { text: fmt(c.codes) }), el("td", { cls: c.named ? null : "csb-tba", text: c.named ? fmt(c.named) : "TBA" }),
          el("td", { text: fmt(c.both) }), el("td", { text: fmt(c.catalogOnly) }), el("td", { text: fmt(c.stateOnly) })]);
      }))]);
    return el("div", { cls: "csb-wrap", role: "region", "aria-label": "Colleges with a printed catalog", tabindex: "0" }, [tbl]);
  }

  /* The codes, one row each: college, local code, printed name (the draft title), common code, courses, side. */
  function codeTable(rows, label) {
    var tbl = el("table", { cls: "csb-table csb-codes" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col"), el("col", { cls: "csb-c-wide" }), el("col"), el("col"), el("col")]),
      el("thead", null, [el("tr", null, ["College", "Local code", "Printed name (draft title)", "Common subject code", "Courses it heads", "Printed by"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, rows.length ? rows.map(function (r) {
        var heads = r.side === "state" ? fmt(r.state_courses) + " in the state list" : fmt(r.catalog_courses);
        return el("tr", { "data-code": r.code, "data-side": r.side }, [el("td", null, [go("#commons/subjects/" + r.slug, r.college)]),
          el("th", { scope: "row", text: r.code }),
          el("td", { cls: r.printed_name ? null : "csb-tba", text: r.printed_name || "TBA" }),
          el("td", { text: r.common || "" }),
          el("td", { text: heads }),
          el("td", { text: SIDES[r.side] || r.side })]);
      }) : [el("tr", null, [el("td", { colspan: "6", text: "No code is in this list." })])])]);
    return el("div", { cls: "csb-wrap", role: "region", "aria-label": label, tabindex: "0" }, [tbl]);
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
    var tbl = el("table", { cls: "csb-table csb-held" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-code" }), el("col", { cls: "csb-c-num" }), el("col", { cls: "csb-c-mid" }), el("col", { cls: "csb-c-mid" }), el("col", { cls: "csb-c-ev" })]),
      el("thead", null, [el("tr", null, ["Local code", "Held courses it releases", "Colleges using it", "Example held courses", "Evidence that fell short"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, H.codes.length ? H.codes.map(function (c) {
        return el("tr", { "data-code": c.key, "data-held": String(c.held) }, [
          el("th", { scope: "row" }, [c.code, (c.printed_names || []).length ? el("span", { cls: "csb-sub", text: c.printed_names.join("; ") }) : null]),
          el("td", { text: fmt(c.held) }),
          el("td", { text: (c.colleges || []).map(function (x) { return x.college + " " + fmt(x.held); }).join("; ") }),
          el("td", { text: (c.examples || []).map(function (x) { return x.title + " (" + x.college + ")"; }).join("; ") }),
          el("td", { cls: "csb-ev" }, evidence(c))]);
      }) : [el("tr", null, [el("td", { colspan: "5", text: "The pile mint holds no course for want of a common subject code." })])])]);
    return el("div", { cls: "csb-wrap", role: "region", "aria-label": "Local subject codes the M-ID mint holds on", tabindex: "0" }, [tbl]);
  }
  var heldCache = null;
  function loadHeld() {
    heldCache = heldCache || fetch(HELD_FILE, { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(HELD_FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(heldModel, function (e) { heldCache = null; throw e; });
    return heldCache;
  }

  var VIEW = { root: null, M: null, noted: null, H: null };
  function render(root, M, view) {
    VIEW.root = root; VIEW.M = M;
    ensureCss();
    view = String(view || "");
    var c = view && view !== DISAGREE && view !== HELD ? M.by[view] : null;
    var missing = view && view !== DISAGREE && view !== HELD && !c ? view : "";
    S.view = missing ? "" : view;
    root.removeAttribute("style");
    root.textContent = "";
    var T = M.totals, all = [];
    M.list.forEach(function (x) { all = all.concat(x.rows); });
    var wrap = el("div", { cls: "cmn-wrap csb" });
    wrap.appendChild(trail(c ? c.college : S.view === DISAGREE ? "Codes only one side prints" : S.view === HELD ? "Codes the M-ID mint holds on" : ""));
    wrap.appendChild(el("header", { cls: "cmn-top" }, [
      el("h2", { cls: "cmn-title", id: "csb-h", text: c ? "Subjects at " + c.college : S.view === DISAGREE ? "Subject codes only one side prints" : S.view === HELD ? "Local subject codes the M-ID mint holds on" : "Subjects" }),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      el("p", { cls: "cmn-lede", text: "Step a is the common subject code each discipline shares; Step b is each college’s own name for its subject codes, read from its printed catalog. The Courses bot drafts each local title from the catalog’s subject heading. A curator settles the codes the catalog and the state course list disagree on." })
    ]));
    wrap.appendChild(el("p", { cls: "csb-stamp" }, [
      el("strong", { text: fmt(T.named) }), " local titles drafted at ", el("strong", { text: fmt(T.colleges_named) + " of " + fmt(T.colleges) }),
      " colleges with a printed catalog (" + fmt(T.courses) + " courses, " + fmt(T.catalog_codes) + " subject codes). ",
      go("#commons/subjects/" + DISAGREE, fmt((T.catalog_only || 0) + (T.state_only || 0)) + " codes only one side prints"),
      " (" + fmt(T.catalog_only) + " catalog only, " + fmt(T.state_only) + " state list only). ",
      fmt(T.with_common) + " codes have a common subject code from the subject map. ",
      el("a", { href: "#canonical-subj4", text: "Common Subjects Reference" }), ". ",
      go("#commons/subjects/" + HELD, "Codes the M-ID mint holds on"), "."]));
    if (missing) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: "No college with a printed catalog is named " + missing + ". Every college is below." }));
    if (c) {
      wrap.appendChild(el("p", { cls: "csb-note", text: c.year + " catalog, read " + day(c.readAt) + ". " + (c.named ? fmt(c.named) + " of " + fmt(c.codes) + " codes carry a printed name." : "This catalog prints the code alone, so every title reads TBA.") }));
      wrap.appendChild(collegeTable(M, [c]));
      wrap.appendChild(codeTable(c.rows, "Subject codes at " + c.college));
    } else if (S.view === HELD) {
      var H = VIEW.H;
      if (!H) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: VIEW.heldError ? "The held codes could not be read (" + VIEW.heldError + "). Reload the tab to try again." : "Reading the held codes…" }));
      else {
        var HT = H.totals;
        wrap.appendChild(el("p", { cls: "csb-note" }, [el("strong", { text: fmt(HT.held) }), " courses the M-ID mint holds wait on ", el("strong", { text: fmt(HT.codes) }),
          " local subject codes (" + fmt(HT.pairs) + " college-and-code pairs) that no route gives a common subject code. The top 20 codes release " + fmt(HT.top_20_release) + " of them. "
          + "Deciding a code’s common subject code releases every held course under it. Each suggestion is a vote that missed the 98% floor, shown with its votes; it decides nothing."
          + (H.plan ? " From the pile mint dry run of " + day(H.plan) + "." : "")]));
        wrap.appendChild(heldTable(H));
      }
    } else if (S.view === DISAGREE) {
      wrap.appendChild(codeTable(all.filter(function (r) { return r.side !== "both"; }), "Subject codes only one side prints"));
    } else {
      wrap.appendChild(collegeTable(M, M.list));
      wrap.appendChild(codeTable(all, "Every subject code"));
    }
    wrap.appendChild(el("p", { cls: "csb-foot", text: "How codes are compared: " + (S.view === HELD && VIEW.H ? VIEW.H.rule : M.rule + (M.built ? " The state course list was built " + day(M.built) + "." : "")) }));
    var page = el("div", { cls: "cmn-page" }, [wrap]);
    root.appendChild(page);
    Array.prototype.forEach.call(root.querySelectorAll("a[data-csb-go]"), function (a) {
      a.addEventListener("click", function (e) { if (e && e.preventDefault) e.preventDefault(); open(a.getAttribute("data-csb-go")); });
    });
    return page;
  }
  /* A pick: draw it and put it in the address, which is the only place it lives. */
  /* The held view reads its own file the first time it opens, then draws again. */
  function withHeld(view) {
    if (String(view || "") !== HELD || VIEW.H) return Promise.resolve();
    return loadHeld().then(function (H) { VIEW.H = H; VIEW.heldError = ""; }, function (e) { VIEW.heldError = e && e.message ? e.message : String(e); })
      .then(function () { if (VIEW.root && VIEW.M && S.view === HELD) render(VIEW.root, VIEW.M, HELD); });
  }
  function open(view) {
    if (!VIEW.root || !VIEW.M) return;
    render(VIEW.root, VIEW.M, view || "");
    withHeld(view);
    var h = "#" + address();
    try { if (window.history && history.pushState && location.hash !== h) history.pushState(null, "", h); } catch (e) { /* the view still draws */ }
    if (VIEW.noted) VIEW.noted(String(location.hash || ""));
    var h2 = VIEW.root.querySelector("#csb-h");
    if (h2) { h2.setAttribute("tabindex", "-1"); if (h2.focus) h2.focus(); }
  }

  function load() {
    return fetch(FILE, { cache: "no-cache" }).then(function (r) {
      if (!r || !r.ok) throw new Error(FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(model);
  }
  var cache = null;
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
    ".cmn-wrap.csb { grid-template-columns:minmax(0, 1fr); }",
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
    ".csb-table td { font-variant-numeric:tabular-nums; }",
    ".csb-c-wide { width:24%; }",
    ".csb-c-code { width:12%; } .csb-c-num { width:10%; } .csb-c-mid { width:20%; } .csb-c-ev { width:38%; }",
    ".csb-sub { display:block; font-weight:400; color:var(--cmn-muted); font-size:.85rem; }",
    ".csb-ev p { margin:0 0 4px; } .csb-ev strong { color:var(--cmn-heading); font-weight:600; }",
    ".csb-tba { color:var(--cmn-muted); }",
    ".csb-foot { margin:0; color:var(--cmn-muted); font-size:.85rem; max-width:var(--cpl-measure,none); }",
    "@media (max-width: 560px) { .csb-table { min-width:36rem; } .csb-held { min-width:44rem; } .csb-table th, .csb-table td { padding:8px; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("csb-css")) return;
    document.head.appendChild(el("style", { id: "csb-css", text: CSS }));
  }

  window.CPL_COMMONS_SUBJECTS = {
    boot: boot, render: render, model: model, heldModel: heldModel, address: address, open: open, load: load, FILE: FILE, HELD_FILE: HELD_FILE, SIDES: SIDES, CSS: CSS,
    _state: S, _reset: function () { cache = null; heldCache = null; VIEW.M = null; VIEW.H = null; S.view = ""; }
  };
})();
