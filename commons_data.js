// commons_data.js — the Commons data dashboard, slice 1: the statewide tiles and the college list (#3215).
//
// Sam, 2026-11-13, relayed by COBIx on #3215: a Commons dashboard for each college's datasets we pull, how complete
// and how trustworthy each one is, what is in the way and who can help, in the Funding Follow-up Dashboard's pattern
// (csm_workspace.js: figures across the top, each the button that opens the list it counts; a college list under
// them; later a side panel). This slice draws the figures and the list. The expanding row, the side panel with the
// dataset bars, AI workers, integrations, the API checklist, the data dictionary, the College view and the JST funnel
// are later slices; COLUMNS and FILTERS below are where they join.
//
// What it reads, one committed file the site already serves (it WRITES NOTHING):
//   kb/status/commons_data.json   built by kb/_build_commons_data_status.py from the identity crosswalk, the harvest's
//                                 committed per-college files (through the gap census's own functions), the SLO
//                                 queue, the source scouts and any committed spot-check receipt.
// A figure the file marks TBA reads TBA, with its reason; nothing here is estimated or carried from the mock.
//
// Loaded by commons.js when the address names it (#commons/data, #commons/data/<filter>). The filter lasts the visit
// and lives only in the address; the sort and the search last the visit. Tokens only (the tab's --cmn roles), words
// for every control, no glyphs.
(function () {
  "use strict";

  var FILE = "kb/status/commons_data.json";
  var TZ = "America/Los_Angeles";

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
  function pct(n, d) { return n == null || !d ? null : n / d; }
  function day(v) {
    if (!v) return "";
    var d = new Date(v);
    if (isNaN(d.getTime())) return "";
    try { return d.toLocaleDateString("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" }); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }
  /* The age cue, from the thresholds the builder writes (rule.age_days), never restated here. */
  function age(v, rule, now) {
    if (!v) return null;
    var t = new Date(v).getTime();
    if (isNaN(t)) return null;
    var a = ((rule && rule.age_days) || {}), days = ((now || new Date()).getTime() - t) / 86400000;
    if (a.fresh != null && days <= a.fresh) return "fresh";
    if (a.recent != null && days <= a.recent) return "recent";
    return "stale";
  }
  function costPer(c) { return c.cost_usd != null && c.passed_at_read ? c.cost_usd / c.passed_at_read : null; }

  /* ── the filters each figure opens: one predicate, so the figure counts exactly the list it opens ── */
  var FILTERS = {
    all: { word: "All colleges", test: function () { return true; } },
    harvested: { word: "Harvested", test: function (c) { return c.harvested; } },
    unread: { word: "Not read yet", test: function (c) { return !c.harvested; } },
    gaps: { word: "Programs still to pass", test: function (c) { return c.harvested && c.gap > 0; } },
    slo: { word: "SLO read waiting", test: function (c) { return !!c.slo_queue; } },
    scouted: { word: "Scouted for a wave", test: function (c) { return !!c.scout; } },
    noncredit: { word: "Continuing education", test: function (c) { return c.kind === "continuing_education"; } }
  };
  var FILTER_SORT = { gaps: { k: "gap", d: -1 }, unread: { k: "name", d: 1 } };

  function model(data) {
    data = data || {};
    var colleges = Array.isArray(data.colleges) ? data.colleges : [];
    return { colleges: colleges, statewide: data.statewide || {}, rule: data.rule || {}, tba: data.tba || {},
      sources: data.sources || {}, written: data.written_at || "", fields: data.fields || {} };
  }
  function listFor(M, filter) {
    var f = FILTERS[filter] || FILTERS.all;
    return M.colleges.filter(function (c) { return f.test(c); });
  }

  /* The figures across the top. A figure that counts colleges is the button that opens them; a figure summed over
     many colleges stays plain (CLAUDE.md: a figure card opens what it counts); an unread figure reads TBA. */
  function tiles(M) {
    var S = M.statewide, n = function (k) { return listFor(M, k).length; };
    var p = pct(S.passing, S.programs), cp = S.cost_receipts && S.passed_at_read ? S.cost_usd / S.passed_at_read : null;
    return [
      { f: "all", v: fmt(n("all")), l: "Colleges and campuses", d: fmt(n("all") - n("noncredit")) + " colleges and " + fmt(n("noncredit")) + " continuing-education campuses, in " + fmt(S.districts) + " districts" },
      { f: "harvested", v: fmt(n("harvested")), l: "Harvested", d: "A capture and its records are committed" },
      { f: "unread", v: fmt(n("unread")), l: "Not read yet", d: "Shown as unread, never as zero complete" },
      { f: "gaps", v: fmt(n("gaps")), l: "Programs still to pass", d: fmt(S.gap) + " listed programs without a passing record; opens most first" },
      { f: "slo", v: fmt(n("slo")), l: "SLO read waiting", d: "Public pages print none, a hold names what it waits on, or a reader is still to build" },
      { f: "scouted", v: fmt(n("scouted")), l: "Scouted for a wave", d: fmt(S.scout_barrier) + " with an access barrier" },
      { v: p == null ? "TBA" : Math.round(p * 100) + "%", l: "Program requirements passing", d: p == null ? "" : fmt(S.passing) + " of " + fmt(S.programs) + " listed programs pass the machine checks (committed files)" },
      { v: cp == null ? "TBA" : "$" + cp.toFixed(3), l: "Read cost per passing program", d: cp == null ? "" : "$" + Number(S.cost_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " over " + fmt(S.passed_at_read) + " passing at read time, " + fmt(S.cost_receipts) + " receipts" },
      { v: "TBA", l: "Overall completeness", d: M.tba.overall || "" , tba: true },
      { v: "TBA", l: "Confidence", d: M.tba.confidence || "", tba: !!M.tba.confidence },
      { v: "TBA", l: "APIs connected", d: M.tba.apis || "", tba: true },
      { v: "TBA", l: "JST funnel", d: M.tba.jst || "", tba: true }
    ];
  }

  /* ── the list's columns, each with its sort key ── */
  var COLUMNS = [
    { k: "name", label: "College", d0: 1, val: function (c) { return c.name; } },
    { k: "pr", label: "Program requirements", d0: 1, val: function (c) { return c.harvested ? pct(c.passing, c.programs) || 0 : -1; } },
    { k: "gap", label: "Still to pass", d0: -1, val: function (c) { return c.harvested ? c.gap : -1; } },
    { k: "read", label: "Last read", d0: -1, val: function (c) { return c.read_at ? new Date(c.read_at).getTime() : 0; } },
    { k: "cost", label: "Read cost per passing program", d0: -1, val: function (c) { var v = costPer(c); return v == null ? -1 : v; } },
    { k: "conf", label: "Confidence", nosort: true, val: function () { return 0; } }
  ];
  var SORT_WORDS = { 1: { name: "A to Z", other: "low first" }, "-1": { name: "Z to A", other: "high first" } };

  var S = { filter: "all", sort: { k: "name", d: 1 }, q: "" };
  function address() { return S.filter && S.filter !== "all" ? "commons/data/" + S.filter : "commons/data"; }

  function sorted(M, list) {
    var col = COLUMNS.filter(function (c) { return c.k === S.sort.k; })[0] || COLUMNS[0];
    return list.slice().sort(function (a, b) {
      var x = col.val(a), y = col.val(b);
      var r = typeof x === "string" ? x.localeCompare(String(y)) : x - y;
      return r * S.sort.d || a.name.localeCompare(b.name);
    });
  }
  function searched(list) {
    var q = S.q.trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (c) { return (c.name + " " + (c.district || "")).toLowerCase().indexOf(q) >= 0; });
  }

  function meter(v) {
    var m = el("span", { cls: "cdd-meter", "aria-hidden": "true" });
    var i = el("i");
    i.style.width = Math.round(Math.max(0, Math.min(1, v)) * 100) + "%";
    m.appendChild(i);
    return m;
  }
  function row(M, c, now) {
    var pr = el("td", { "data-label": "Program requirements" });
    if (c.harvested) {
      var v = pct(c.passing, c.programs);
      pr.appendChild(el("span", { cls: "cdd-pr" }, [meter(v || 0), el("span", { cls: "cdd-n", text: (v == null ? "None listed" : Math.round(v * 100) + "%") }),
        el("span", { cls: "cdd-of", text: fmt(c.passing) + " of " + fmt(c.programs) + " listed programs" })]));
    } else pr.appendChild(el("span", { cls: "cdd-unread", text: "Not read yet" }));
    var a = age(c.read_at, M.rule, now);
    var read = el("td", { "data-label": "Last read" }, c.read_at ? [day(c.read_at), el("span", { cls: "cdd-age", text: ", " + a }),
      c.read_kind === "capture_preview" ? el("span", { cls: "cdd-of", text: "Read on a pull request branch" }) : null] : [el("span", { cls: "cdd-quiet", text: "Not yet" })]);
    var cp = costPer(c);
    var flags = [];
    if (c.slo_queue) flags.push("SLO read " + c.slo_queue.state);
    if (c.scout) flags.push("Scouted: " + String(c.scout.recommendation || "").replace(/_/g, " ") + (c.scout.challenge && c.scout.challenge !== "none" ? ", " + c.scout.challenge : ""));
    var name = el("th", { scope: "row", "data-label": "College" }, [el("span", { cls: "cdd-name", text: c.name }), el("span", { cls: "cdd-dist", text: c.district || "" }),
      flags.length ? el("span", { cls: "cdd-flags", text: flags.join("; ") }) : null]);
    return el("tr", { "data-college": c.name, "data-id": String(c.id) }, [name, pr,
      el("td", { "data-label": "Still to pass", cls: "cdd-num", text: c.harvested ? fmt(c.gap) : "" }),
      read,
      el("td", { "data-label": "Read cost per passing program", cls: "cdd-num", text: cp == null ? "" : "$" + cp.toFixed(3) }),
      el("td", { "data-label": "Confidence", cls: c.spot_check ? "" : "cdd-quiet", text: c.spot_check ? "Spot-checked" : "TBA" })]);
  }

  var VIEW = { root: null, M: null, noted: null, now: null };
  function render(root, M, filter, now) {
    VIEW.root = root; VIEW.M = M; VIEW.now = now || VIEW.now || new Date();
    ensureCss();
    var f = FILTERS[filter] ? filter : "all";
    if (f !== S.filter) { S.filter = f; if (FILTER_SORT[f]) S.sort = { k: FILTER_SORT[f].k, d: FILTER_SORT[f].d }; }
    root.removeAttribute("style");
    root.textContent = "";
    var wrap = el("div", { cls: "cmn-wrap cdd" });
    wrap.appendChild(el("p", { cls: "cdd-trail" }, [el("a", { href: "#commons", text: "CPL Commons" }), " / ", el("span", { text: "Data" })]));
    wrap.appendChild(el("header", { cls: "cmn-top" }, [
      el("h2", { cls: "cmn-title", id: "cdd-h", text: "How complete each college's data is" }),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      el("p", { cls: "cmn-lede", text: "Every college and continuing-education campus, the datasets we read for it, how far each has come, and what is in the way. This first part shows the program requirements harvest; the other datasets join it next." })
    ]));
    wrap.appendChild(el("p", { cls: "cdd-stamp", id: "cdd-stamp" }, [el("strong", { text: "From the committed files. " }),
      "Built " + (day(M.written) || "on a date the file does not give") + ". A program count here is the programs each college's capture listed; the Program Requirements tab counts the live Active programs. Dates are Pacific time."]));

    var grid = el("div", { cls: "cdd-tiles", role: "group", "aria-label": "Statewide figures" });
    tiles(M).forEach(function (t) {
      var kids = [el("span", { cls: "cdd-v" + (t.v === "TBA" ? " cdd-tba" : ""), text: t.v }), el("span", { cls: "cdd-l", text: t.l }), t.d ? el("span", { cls: "cdd-d", text: t.d }) : null];
      if (t.f) {
        var b = el("button", { type: "button", cls: "cdd-tile cdd-open", "data-filter": t.f, "aria-pressed": S.filter === t.f ? "true" : "false" }, kids);
        b.addEventListener("click", function () { pick(t.f); });
        grid.appendChild(b);
      } else grid.appendChild(el("div", { cls: "cdd-tile", "data-tile": t.l }, kids));
    });
    wrap.appendChild(grid);

    var list = el("section", { cls: "cdd-list", "aria-labelledby": "cdd-list-h" });
    list.appendChild(el("h3", { id: "cdd-list-h", cls: "cdd-h3", text: "Colleges" }));
    var search = el("input", { type: "search", id: "cdd-q", cls: "cdd-q", autocomplete: "off", value: S.q });
    var shown = el("p", { cls: "cdd-shown", id: "cdd-shown", role: "status" });
    var clear = el("button", { type: "button", cls: "cmn-word", id: "cdd-all", text: "Show all colleges" });
    clear.addEventListener("click", function () { pick("all"); });
    list.appendChild(el("div", { cls: "cdd-tools" }, [el("label", { "for": "cdd-q", cls: "cdd-label", text: "Find a college or district" }), search, shown, S.filter !== "all" ? clear : null]));
    var body = el("tbody");
    var head = el("tr");
    var table = el("table", { cls: "cdd-table", id: "cdd-colleges" }, [
      el("caption", { cls: "cdd-sr", text: "Each college: its program requirements harvest, programs still to pass, last read, read cost and confidence" }),
      el("colgroup", null, [el("col", { cls: "cdd-c-name" }), el("col", { cls: "cdd-c-pr" }), el("col", { cls: "cdd-c-gap" }), el("col", { cls: "cdd-c-read" }), el("col", { cls: "cdd-c-cost" }), el("col", { cls: "cdd-c-conf" })]),
      el("thead", null, [head]), body
    ]);
    function drawHead() {
      head.textContent = "";
      COLUMNS.forEach(function (col) {
        if (col.nosort) { head.appendChild(el("th", { scope: "col", text: col.label })); return; }
        var on = S.sort.k === col.k;
        var b = el("button", { type: "button", cls: "cmn-word cdd-sort", "data-sort": col.k, text: col.label });
        if (on) b.appendChild(el("span", { cls: "cdd-dir", text: " (" + (col.k === "name" ? SORT_WORDS[String(S.sort.d)].name : SORT_WORDS[String(S.sort.d)].other) + ")" }));
        b.addEventListener("click", function () { S.sort = { k: col.k, d: on ? -S.sort.d : col.d0 }; drawHead(); drawBody(); });
        head.appendChild(el("th", { scope: "col", "aria-sort": on ? (S.sort.d === 1 ? "ascending" : "descending") : "none" }, [b]));
      });
    }
    function drawBody() {
      body.textContent = "";
      var base = listFor(M, S.filter), L = sorted(M, searched(base));
      L.forEach(function (c) { body.appendChild(row(M, c, VIEW.now)); });
      if (!L.length) body.appendChild(el("tr", null, [el("td", { colspan: String(COLUMNS.length), text: "No college matches." })]));
      shown.textContent = "Showing " + fmt(L.length) + " of " + fmt(M.colleges.length) + (S.filter !== "all" ? ": " + FILTERS[S.filter].word : "");
    }
    search.addEventListener("input", function () { S.q = search.value || ""; drawBody(); });
    drawHead(); drawBody();
    list.appendChild(el("div", { cls: "cdd-wrap", role: "region", "aria-label": "Colleges", tabindex: "0" }, [table]));
    wrap.appendChild(list);
    wrap.appendChild(notes(M));
    var page = el("div", { cls: "cmn-page" }, [wrap]);
    root.appendChild(page);
    return page;
  }

  function notes(M) {
    var R = M.rule || {}, items = [];
    if (R.basis) items.push("Basis: " + R.basis + ".");
    if (R.passing) items.push("Passing: " + R.passing + ".");
    if (R.overall) items.push("Overall: " + R.overall + ".");
    if (R.confidence) items.push("Confidence: " + R.confidence + ".");
    if (R.age_days) items.push("Age: fresh within " + R.age_days.fresh + " days, recent within " + R.age_days.recent + ", stale after.");
    var src = Object.keys(M.sources).map(function (k) { return M.sources[k]; });
    return el("section", { cls: "cdd-notes", id: "cdd-notes", "aria-labelledby": "cdd-notes-h" }, [
      el("h3", { id: "cdd-notes-h", cls: "cdd-h3", text: "How these figures are read" }),
      el("ul", null, items.map(function (t) { return el("li", { text: t }); })),
      el("p", { cls: "cdd-src", text: "Sources: " + src.join("; ") + "." }),
      el("p", { cls: "cdd-src", text: "Next on this page: each college's record with a bar for every dataset (SLOs, PLOs, objectives, catalog source, course descriptions, CPL and MAP, Program Pathways Mapper), its gaps and the asks, with owners." })
    ]);
  }

  /* A figure's click: draw its list and put the filter in the address, the only place it lives. */
  function pick(filter) {
    if (!VIEW.root || !VIEW.M) return;
    var y = window.scrollY;
    render(VIEW.root, VIEW.M, filter);
    var h = "#" + address();
    try { if (window.history && history.replaceState && location.hash !== h) history.replaceState(null, "", h); } catch (e) { /* the view still draws */ }
    if (VIEW.noted) VIEW.noted(String(location.hash || ""));
    try { if (window.scrollTo && y) window.scrollTo(0, y); } catch (e) { /* jsdom */ }
    var t = VIEW.root.querySelector('.cdd-tile[data-filter="' + S.filter + '"]');
    if (t && t.focus) t.focus();
  }

  function load() {
    return fetch(FILE, { cache: "no-store" }).then(function (r) {
      if (!r || !r.ok) throw new Error(FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(model);
  }
  var cache = null;
  function boot(root, filter, opts) {
    opts = opts || {};
    VIEW.noted = opts.noted || null;
    if (!root) return Promise.resolve(null);
    S.q = ""; S.filter = ""; S.sort = { k: "name", d: 1 };   // a visit starts fresh: nothing is remembered
    if (VIEW.M && cache) { render(root, VIEW.M, filter, new Date()); return Promise.resolve(VIEW.M); }
    root.textContent = "Reading the Commons data dashboard…";
    cache = cache || load();
    return cache.then(function (M) {
      render(root, M, filter, new Date());
      return M;
    }, function (e) {
      cache = null;
      root.textContent = "The Commons data dashboard could not be read (" + (e && e.message ? e.message : e) + "). Reload the tab to try again.";
      return null;
    });
  }

  var CSS = [
    ".cmn-wrap.cdd { grid-template-columns:minmax(0, 1fr); }",
    ".cdd > * { min-width:0; }",
    ".cdd .cdd-trail { margin:0; color:var(--cmn-muted); font-size:.92rem; }",
    ".cdd .cdd-trail a { display:inline-block; min-height:24px; line-height:24px; }",
    ".cdd-stamp { margin:0; color:var(--cmn-ink-2); background:var(--cmn-surface); border:1px solid var(--cmn-line); border-left:4px solid var(--cmn-gold); border-radius:12px; padding:12px 16px; max-width:var(--cpl-measure,none); }",
    ".cdd-stamp strong { color:var(--cmn-heading); }",
    ".cdd-tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 13.5rem), 1fr)); gap:12px; }",
    ".cdd-tile { all:unset; box-sizing:border-box; display:flex; flex-direction:column; gap:2px; min-width:0; padding:12px 14px; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-left:3px solid var(--cmn-line); border-radius:0 10px 10px 0; color:var(--cmn-ink); font-family:inherit; }",
    "button.cdd-tile { cursor:pointer; }",
    "button.cdd-tile .cdd-l { color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; }",
    "button.cdd-tile:hover .cdd-l { color:var(--cmn-heading); }",
    "button.cdd-tile[aria-pressed=\"true\"] { border-left-color:var(--cmn-accent); background:var(--cmn-pill-bg); }",
    "button.cdd-tile[aria-pressed=\"true\"] .cdd-l { text-decoration-thickness:3px; color:var(--cmn-heading); }",
    "button.cdd-tile:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cdd-v { font-family:var(--cmn-serif); font-size:1.7rem; line-height:1.15; font-weight:700; color:var(--cmn-title); font-variant-numeric:tabular-nums; }",
    ".cdd-v.cdd-tba { color:var(--cmn-muted); }",
    ".cdd-l { font-weight:700; font-size:.92rem; color:var(--cmn-heading); }",
    ".cdd-d { font-size:.84rem; color:var(--cmn-muted); line-height:1.4; overflow-wrap:anywhere; }",
    ".cdd-list { display:grid; gap:12px; }",
    ".cdd-h3 { margin:0; font-family:var(--cmn-serif); font-size:1.25rem; color:var(--cmn-heading); }",
    ".cdd-tools { display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; }",
    ".cdd-label { font-weight:700; color:var(--cmn-heading); }",
    ".cdd-q { font:inherit; min-height:32px; flex:1 1 14rem; min-width:0; max-width:28rem; padding:4px 8px; border:1px solid var(--cmn-muted); border-radius:6px; background:var(--cmn-surface); color:var(--cmn-ink); }",
    ".cdd-q:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cdd-shown { margin:0; color:var(--cmn-muted); font-size:.9rem; font-variant-numeric:tabular-nums; }",
    ".cdd-wrap { overflow-x:auto; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; }",
    ".cdd-wrap:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cdd-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:.93rem; }",
    ".cdd-table th, .cdd-table td { text-align:left; vertical-align:top; padding:9px 12px; border-bottom:1px solid var(--cmn-line-soft); color:var(--cmn-ink); overflow-wrap:anywhere; }",
    ".cdd-table thead th { font-size:.8rem; font-weight:700; vertical-align:bottom; }",
    ".cdd-table thead button.cmn-word { font-size:.82rem; }",
    ".cdd-dir { font-weight:400; color:var(--cmn-muted); text-decoration:none; }",
    ".cdd-table tbody th { font-weight:400; }",
    ".cdd-name { display:block; font-weight:700; color:var(--cmn-heading); }",
    ".cdd-dist, .cdd-of, .cdd-flags { display:block; font-size:.84rem; color:var(--cmn-muted); }",
    ".cdd-num { font-variant-numeric:tabular-nums; }",
    ".cdd-pr { display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:center; gap:2px 10px; }",
    ".cdd-pr .cdd-of { grid-column:1 / -1; }",
    ".cdd-meter { display:block; height:8px; border-radius:999px; background:var(--cmn-track); overflow:hidden; }",
    ".cdd-meter i { display:block; height:100%; background:var(--cmn-accent); border-radius:999px; }",
    ".cdd-n { font-weight:700; font-variant-numeric:tabular-nums; color:var(--cmn-heading); }",
    ".cdd-unread { font-weight:600; color:var(--cmn-ask-label); }",
    ".cdd-age { color:var(--cmn-muted); }",
    ".cdd-quiet { color:var(--cmn-muted); }",
    ".cdd-c-name { width:27%; } .cdd-c-pr { width:25%; } .cdd-c-gap { width:10%; } .cdd-c-read { width:14%; } .cdd-c-cost { width:13%; } .cdd-c-conf { width:11%; }",
    ".cdd-notes { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:16px 20px; display:grid; gap:8px; }",
    ".cdd-notes ul { margin:0; padding-left:20px; display:grid; gap:4px; color:var(--cmn-ink-2); }",
    ".cdd-src { margin:0; color:var(--cmn-muted); font-size:.88rem; overflow-wrap:anywhere; }",
    ".cdd-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }",
    "@media (prefers-reduced-motion: no-preference) { button.cdd-tile { transition:background-color .15s ease; } }",
    /* One column under 560px: each college becomes a block with its labels, and the sort words wrap above. */
    "@media (max-width: 560px) {",
    "  .cdd-table, .cdd-table tbody, .cdd-table tr, .cdd-table td, .cdd-table tbody th { display:block; width:auto; }",
    "  .cdd-table colgroup { display:none; }",
    "  .cdd-table thead tr { display:flex; flex-wrap:wrap; gap:4px 14px; padding:10px 12px; border-bottom:1px solid var(--cmn-line); }",
    "  .cdd-table thead th { display:block; padding:0; border:0; }",
    "  .cdd-table tbody tr { padding:10px 12px; border-bottom:1px solid var(--cmn-line); }",
    "  .cdd-table tbody th, .cdd-table td { padding:3px 0; border:0; }",
    "  .cdd-table td::before { content:attr(data-label); display:block; font-size:.78rem; font-weight:700; color:var(--cmn-muted); }",
    "  .cdd-table td:empty { display:none; }",
    "}"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cdd-css")) return;
    document.head.appendChild(el("style", { id: "cdd-css", text: CSS }));
  }

  window.CPL_COMMONS_DATA = {
    boot: boot, render: render, model: model, listFor: listFor, tiles: tiles, address: address, pick: pick, load: load, age: age,
    FILE: FILE, FILTERS: FILTERS, COLUMNS: COLUMNS, CSS: CSS, _state: S, _reset: function () { cache = null; VIEW.M = null; S.filter = "all"; S.q = ""; S.sort = { k: "name", d: 1 }; }
  };
})();
