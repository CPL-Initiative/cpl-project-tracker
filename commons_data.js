// commons_data.js — the Commons data dashboard (#3215): slice 1, the statewide tiles and the college list; slice 2, a
// college's row that opens in place and the same college in a side panel.
//
// Sam, 2026-11-13, relayed by COBIx on #3215: a Commons dashboard for each college's datasets we pull, how complete
// and how trustworthy each one is, what is in the way and who can help, in the Funding Follow-up Dashboard's pattern
// (csm_workspace.js: figures across the top, each the button that opens the list it counts; a college list under
// them; a side panel). Slice 1 drew the figures and the list. Slice 2 opens a college's row in place (each dataset the
// builder holds for it, with its bar, stamp and gaps) and draws the same college in a side panel (datasets grouped as
// the mock groups them, dates, gaps, asks, cost, sources; TBA with its reason where no committed file supplies one).
// Later slices: the overall bar and Teachout and Approved (a live export adds them to the file), AI workers,
// integrations and the API checklist, the data dictionary, the College view and the JST funnel. COLUMNS, FILTERS,
// datasets() and panelBody() below are where they join.
//
// What it reads, one committed file the site already serves (it WRITES NOTHING):
//   kb/status/commons_data.json   built by kb/_build_commons_data_status.py from the identity crosswalk, the harvest's
//                                 committed per-college files (through the gap census's own functions), the SLO
//                                 queue, the source scouts and any committed spot-check receipt.
// A figure the file marks TBA reads TBA, with its reason; nothing here is estimated or carried from the mock.
//
// Loaded by commons.js when the address names it (#commons/data, #commons/data/<filter>, and a college's panel at
// #commons/data[/<filter>]/college/<slug>). The filter and the panel's college last the visit and live only in the
// address; the sort, the search, the open row and the panel's width last the visit. Tokens only (the tab's --cmn roles), words
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
  /* A stamp in Pacific time with its hour; a bare date (the SLO queue's "on") is a calendar day and is shown as one. */
  function when(v) {
    if (!v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
      try { return new Date(v + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }); } catch (e) { return String(v); }
    }
    var d = new Date(v);
    if (isNaN(d.getTime())) return "";
    try { return d.toLocaleString("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " PT"; }
    catch (e) { return d.toISOString().slice(0, 16).replace("T", " ") + " UTC"; }
  }
  /* A college's address word: its name, lowercased, accents dropped, words joined by hyphens (Cañada College is
     canada-college). Names are unique in the crosswalk, so the word is too. */
  function slugOf(c) {
    var n = String((c && c.name) || "");
    try { n = n.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) { /* an old engine keeps the accent */ }
    return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function bySlug(M, slug) { return slug ? M.colleges.filter(function (c) { return slugOf(c) === slug; })[0] || null : null; }
  function byId(M, id) { return id == null ? null : M.colleges.filter(function (c) { return String(c.id) === String(id); })[0] || null; }
  var PLATFORMS = { courseleaf: "CourseLeaf", acalog: "Acalog", curriqunet: "CurriQunet", elumen: "eLumen", coursedog: "Coursedog",
    smartcatalog: "SmartCatalog", custom_html: "The college's own web pages", pdf: "PDF" };
  function words(v) { return String(v == null ? "" : v).replace(/_/g, " "); }
  function platformWord(v) { return v ? (PLATFORMS[v] || words(v)) : ""; }
  function minutes(sec) { return sec == null ? "" : (sec < 90 ? Math.round(sec) + " seconds" : Math.round(sec / 60) + " minutes"); }

  /* ── the filters each figure opens: one predicate, so the figure counts exactly the list it opens ── */
  var FILTERS = {
    all: { word: "All colleges", test: function () { return true; } },
    harvested: { word: "Harvested", test: function (c) { return c.harvested; } },
    unread: { word: "Not read yet", test: function (c) { return !c.harvested; } },
    gaps: { word: "Programs still to pass", test: function (c) { return c.harvested && c.gap > 0; } },
    slo: { word: "SLO read waiting", test: function (c) { return !!c.slo_queue; } },
    scouted: { word: "Scouted for a wave", test: function (c) { return !!c.scout; } },
    noncredit: { word: "Continuing education", test: function (c) { return c.kind === "continuing_education"; } },
    strong: { word: "Confidence strong", test: function (c) { return level(c) === "strong"; } },
    partial: { word: "Confidence partial", test: function (c) { return level(c) === "partial"; } },
    limited: { word: "Confidence limited", test: function (c) { return level(c) === "limited"; } }
  };
  /* The level the builder wrote from the rule (rule.confidence); the page never derives one of its own. */
  function level(c) { return c && c.confidence ? c.confidence.level : null; }
  var LEVEL_RANK = { strong: 3, partial: 2, limited: 1 };
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
      M.tba.confidence ? { v: "TBA", l: "Confidence", d: M.tba.confidence, tba: true }
        : { f: "strong", v: fmt(n("strong")), l: "Confidence strong", d: "5 or more spot-checked records at the college, all agreeing" },
      M.tba.confidence ? null : { f: "partial", v: fmt(n("partial")), l: "Confidence partial", d: "A spot-checked record differs, or a page could not be reached" },
      M.tba.confidence ? null : { f: "limited", v: fmt(n("limited")), l: "Confidence limited", d: "Machine checks only, or fewer than 5 records checked at the college" },
      { v: p == null ? "TBA" : Math.round(p * 100) + "%", l: "Program requirements passing", d: p == null ? "" : fmt(S.passing) + " of " + fmt(S.programs) + " listed programs pass the machine checks (committed files)" },
      { v: cp == null ? "TBA" : "$" + cp.toFixed(3), l: "Read cost per passing program", d: cp == null ? "" : "$" + Number(S.cost_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " over " + fmt(S.passed_at_read) + " passing at read time, " + fmt(S.cost_receipts) + " receipts" },
      { v: "TBA", l: "Overall completeness", d: M.tba.overall || "" , tba: true },
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
    { k: "conf", label: "Confidence", d0: -1, val: function (c) { return LEVEL_RANK[level(c)] || 0; } }
  ];
  var SORT_WORDS = { 1: { name: "A to Z", other: "low first" }, "-1": { name: "Z to A", other: "high first" } };

  var PW = { min: 300, max: 900, start: 480, step: 20 };   // the panel's width in px (Sam, 1:52 AM PT: 300 to 900; double-click resets)
  var S = { filter: "all", sort: { k: "name", d: 1 }, q: "", open: null, panel: null, pw: PW.start };
  function address() {
    var a = S.filter && S.filter !== "all" ? "commons/data/" + S.filter : "commons/data";
    var c = VIEW.M ? byId(VIEW.M, S.panel) : null;
    return c ? a + "/college/" + slugOf(c) : a;
  }
  /* What the address after #commons/data names: a filter, a college, or a filter then a college. */
  function parseRoute(route) {
    var p = String(route || "").split("/").filter(Boolean), out = { filter: "all", college: "" };
    if (p[0] === "college") { out.college = p[1] || ""; return out; }
    out.filter = p[0] || "all";
    if (p[1] === "college") out.college = p[2] || "";
    return out;
  }

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
    var open = String(S.open) === String(c.id);
    var word = el("button", { type: "button", cls: "cmn-word cdd-name", "data-expand": String(c.id), "aria-expanded": open ? "true" : "false",
      "aria-controls": "cdd-more-" + c.id, text: c.name });
    word.addEventListener("click", function () { toggleRow(c.id); });
    var name = el("th", { scope: "row", "data-label": "College" }, [word, el("span", { cls: "cdd-dist", text: c.district || "" }),
      flags.length ? el("span", { cls: "cdd-flags", text: flags.join("; ") }) : null]);
    return el("tr", { "data-college": c.name, "data-id": String(c.id), cls: open ? "cdd-open" : null }, [name, pr,
      el("td", { "data-label": "Still to pass", cls: "cdd-num", text: c.harvested ? fmt(c.gap) : "" }),
      read,
      el("td", { "data-label": "Read cost per passing program", cls: "cdd-num", text: cp == null ? "" : "$" + cp.toFixed(3) }),
      el("td", { "data-label": "Confidence", cls: c.confidence ? "" : "cdd-quiet" }, c.confidence
        ? [el("span", { cls: "cdd-level", text: c.confidence.level.charAt(0).toUpperCase() + c.confidence.level.slice(1) }), " ", el("span", { cls: "cdd-of", text: c.confidence.why })]
        : ["TBA"])]);
  }


  /* ── slice 2: one college, dataset by dataset, from what the builder holds for it ──
     Each dataset says whether the builder holds anything for this college (held). The row shows the held ones; the
     panel shows every one the mock's panel shows, and a figure no committed file supplies reads TBA with the
     builder's reason (M.tba), never a mock number. The overall bar, Teachout and Approved, AI workers, integrations,
     the API checklist and the JST funnel join here in later slices. */
  var GROUPS = ["Harvested", "Connected"];
  function causeWord(M, k) { return ((M.rule || {}).causes || {})[k] || words(k); }
  function tbaOf(M, k) { return (M.tba || {})[k] || ""; }
  /* The scout file's name, from the builder's own source line (the page names no internal folder of its own). */
  function scoutFile(M, c) { return String((M.sources || {}).scouts || "").replace(/[^/]*$/, "") + (c.scout.wave || "scout") + ".json"; }
  function datasets(M, c) {
    var L = [];
    var pr = { key: "pr", group: "Harvested", label: "Program requirements", held: !!c.harvested,
      src: "kb/program_requirements_college/" + (c.slug || "<slug>") + "/ (capture and summary), causes through the gap census's committed-files functions" };
    if (c.harvested) {
      var v = pct(c.passing, c.programs);
      pr.num = c.passing; pr.den = c.programs; pr.value = v == null ? "None listed" : Math.round(v * 100) + "%";
      pr.note = fmt(c.passing) + " of " + fmt(c.programs) + " listed programs pass the machine checks";
      pr.lines = [["Listed by the capture", fmt(c.programs)], c.listed_closed != null ? ["With a closed course list", fmt(c.listed_closed)] : null,
        c.found != null ? ["Pages found at read time", fmt(c.found)] : null, c.extracted != null ? ["Extracted at read time", fmt(c.extracted)] : null,
        ["Passing now", fmt(c.passing)], ["Still to pass", fmt(c.gap)]].filter(Boolean);
      pr.causes = Object.keys(c.causes || {}).sort(function (a, b) { return c.causes[b] - c.causes[a] || a.localeCompare(b); })
        .map(function (k) { return [causeWord(M, k), c.causes[k]]; });
      pr.stamp = { at: c.read_at, kind: c.read_kind === "capture_preview" ? "read, on a pull request branch" : "read" };
    } else pr.state = "Not read yet";
    pr.later = [["Teachout and Approved programs", "TBA", tbaOf(M, "teachout_approved")]];
    L.push(pr);

    var slo = { key: "slo", group: "Harvested", label: "Course SLOs", held: !!c.slo_queue, src: "kb/course_outcomes/queue.json", tba: tbaOf(M, "slo") };
    if (c.slo_queue) {
      slo.state = "SLO read " + c.slo_queue.state;
      slo.note = c.slo_queue.why || "";
      if (c.slo_queue.on) slo.stamp = { at: c.slo_queue.on, kind: "queued" };
    }
    L.push(slo);
    L.push({ key: "plo", group: "Harvested", label: "Program PLOs", tba: tbaOf(M, "plo") });
    L.push({ key: "obj", group: "Harvested", label: "Course objectives", tba: tbaOf(M, "objectives") });

    var cat = { key: "cat", group: "Harvested", label: "Catalog source", held: !!(c.platform || c.scout), tba: tbaOf(M, "catalog_registry"),
      src: (c.platform ? "the capture's own record of its catalog" : "") + (c.platform && c.scout ? "; " : "") + (c.scout ? scoutFile(M, c) : "") };
    cat.lines = [c.platform ? ["Catalog platform", platformWord(c.platform)] : null, c.catalog_year ? ["Catalog year read", c.catalog_year] : null,
      c.scout ? ["Source scout", "recommends " + words(c.scout.recommendation) + (c.scout.challenge && c.scout.challenge !== "none" ? "; " + words(c.scout.challenge) : "; no access barrier")] : null].filter(Boolean);
    cat.link = c.catalog_url || null;
    if (c.scout && c.scout.checked_at) cat.stamp = { at: c.scout.checked_at, kind: "scouted" };
    else if (c.platform && c.read_at) cat.stamp = { at: c.read_at, kind: "read" };
    L.push(cat);
    L.push({ key: "ppm", group: "Harvested", label: "Program Pathways Mapper (PPM)", tba: tbaOf(M, "ppm") });
    L.push({ key: "desc", group: "Connected", label: "Course descriptions", tba: tbaOf(M, "descriptions") });
    L.push({ key: "cpl", group: "Connected", label: "CPL and MAP", tba: tbaOf(M, "cpl") });
    L.push({ key: "mis", group: "Connected", label: "COMIS and MIS", tba: tbaOf(M, "mis") });
    L.push({ key: "coe", group: "Connected", label: "COE labor market (regional)", tba: tbaOf(M, "coe") });
    return L;
  }
  /* The open gaps and barriers the builder holds for this college: the census's causes, the scout's barrier, the SLO
     queue, and what the spot-check found. */
  function gaps(M, c) {
    var G = [];
    Object.keys(c.causes || {}).sort(function (a, b) { return c.causes[b] - c.causes[a] || a.localeCompare(b); }).forEach(function (k) {
      G.push(causeWord(M, k).replace(/^./, function (x) { return x.toUpperCase(); }) + ": " + fmt(c.causes[k]) + " program" + (c.causes[k] === 1 ? "" : "s"));
    });
    if (c.scout && ((c.scout.challenge && c.scout.challenge !== "none") || c.scout.recommendation === "blocked"))
      G.push("Source scout: " + words(c.scout.challenge && c.scout.challenge !== "none" ? c.scout.challenge : c.scout.recommendation) + " (recommends " + words(c.scout.recommendation) + ")");
    if (c.slo_queue) G.push("SLO read " + c.slo_queue.state + (c.slo_queue.why ? ": " + c.slo_queue.why : ""));
    var sp = c.spot_check;
    if (sp && sp.held) G.push("Display held: " + sp.differs + " spot-checked records differ from the catalog");
    else if (sp && sp.differs === 1) G.push("One spot-checked record differs from the catalog");
    if (sp && sp.unreachable) G.push(sp.unreachable + " spot-checked page" + (sp.unreachable === 1 ? "" : "s") + " could not be reached");
    return G;
  }
  /* The asks: each lever the gap census names for this college's programs, in its own words; and the spot-check
     COBIx makes of five records per college (the contract on #3111, kb/spot_checks/README.md) where none is filed. */
  function asks(M, c) {
    var A = [], LW = (M.rule || {}).levers || {};
    Object.keys(c.levers || {}).forEach(function (k) {
      var w = LW[k] || {};
      A.push({ text: (w.what || words(k)).replace(/^./, function (x) { return x.toUpperCase(); }), detail: fmt(c.levers[k]) + " program" + (c.levers[k] === 1 ? "" : "s") + (w.kind ? ", " + w.kind : ""), owner: null });
    });
    if (c.harvested && !c.spot_check) A.push({ text: "Spot-check five records against the catalog", detail: "the spot-check contract on #3111", owner: "COBIx" });
    return A;
  }
  function stampLine(st, now) {
    if (!st || !st.at) return el("span", { cls: "cdd-stampline", text: "Not yet" });
    var a = age(st.at, VIEW.M && VIEW.M.rule, now);
    return el("span", { cls: "cdd-stampline", text: "Updated " + when(st.at) + " (" + st.kind + ")" + (a ? ", " + a : "") });
  }
  function dl(lines) {
    return el("dl", { cls: "cdd-dl" }, [].concat.apply([], lines.map(function (l) { return [el("dt", { text: l[0] }), el("dd", { text: l[1] })]; })));
  }
  function bar(d) {
    var v = pct(d.num, d.den);
    return el("span", { cls: "cdd-pr" }, [meter(v || 0), el("span", { cls: "cdd-n", text: d.value || (v == null ? "" : Math.round(v * 100) + "%") }), d.note ? el("span", { cls: "cdd-of", text: d.note }) : null]);
  }
  function tba(reason) { return el("p", { cls: "cdd-tbaline" }, [el("strong", { text: "TBA. " }), reason || ""]); }

  /* The row, opened in place: the datasets the builder holds for this college and nothing else, the spot-check, the
     read's cost, the open gaps; a word opens the same college in the side panel. */
  function detail(M, c, now) {
    var cards = datasets(M, c).filter(function (d) { return d.held; }).map(function (d) {
      return el("section", { cls: "cdd-card", "data-ds": d.key, "aria-label": d.label }, [el("h4", { text: d.label }),
        d.den != null ? bar(d) : null, d.state ? el("p", { cls: "cdd-state", text: d.state }) : null,
        d.state && d.note ? el("p", { cls: "cdd-of", text: d.note }) : null,
        d.lines && d.lines.length ? dl(d.lines) : null,
        d.causes && d.causes.length ? el("p", { cls: "cdd-of", text: "Still to pass, by cause: " + d.causes.map(function (x) { return x[0] + " " + fmt(x[1]); }).join("; ") }) : null,
        stampLine(d.stamp, now)]);
    });
    if (c.spot_check || c.confidence) {
      var sp = c.spot_check;
      cards.push(el("section", { cls: "cdd-card", "data-ds": "confidence", "aria-label": "Confidence" }, [el("h4", { text: "Confidence" }),
        c.confidence ? el("p", { cls: "cdd-state", text: cap(c.confidence.level) }) : null,
        c.confidence ? el("p", { cls: "cdd-of", text: c.confidence.why }) : null,
        sp ? dl([["Spot-check", fmt(sp.agrees) + " agree, " + fmt(sp.differs) + " differ, " + fmt(sp.unreachable) + " unreachable"]]) : null,
        stampLine(sp ? { at: sp.checked_at, kind: "spot-checked" } : null, now)]));
    }
    if (c.cost_usd != null) {
      var cp = costPer(c);
      cards.push(el("section", { cls: "cdd-card", "data-ds": "cost", "aria-label": "Read cost" }, [el("h4", { text: "Read cost" }),
        dl([["Cost of the last read", "$" + Number(c.cost_usd).toFixed(2)], cp == null ? null : ["Per passing program", "$" + cp.toFixed(3)],
          c.read_seconds != null ? ["Run time", minutes(c.read_seconds)] : null].filter(Boolean))]));
    }
    var G = gaps(M, c);
    var openP = el("button", { type: "button", cls: "cmn-word", "data-panel-open": String(c.id), text: "Open " + c.name + " in the side panel" });
    openP.addEventListener("click", function () { openPanel(c.id, '[data-panel-open="' + c.id + '"]'); });
    var box = el("div", { cls: "cdd-more-in" }, [
      cards.length ? el("div", { cls: "cdd-ds" }, cards) : el("p", { cls: "cdd-of", text: "Not read yet: no committed file holds a dataset for this college." }),
      el("div", { cls: "cdd-gapbox" }, [el("h4", { text: "Open gaps" }),
        G.length ? el("ul", { cls: "cdd-gaps" }, G.map(function (g) { return el("li", { text: g }); })) : el("p", { cls: "cdd-of", text: c.harvested ? "None recorded in the committed files." : "Not read yet." })]),
      el("p", { cls: "cdd-more-act" }, [openP])
    ]);
    return el("tr", { cls: "cdd-more", id: "cdd-more-" + c.id, "data-more": String(c.id) }, [el("td", { colspan: String(COLUMNS.length) }, [box])]);
  }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function toggleRow(id) {
    S.open = String(S.open) === String(id) ? null : id;
    if (VIEW.drawBody) VIEW.drawBody();
    var w = VIEW.root && VIEW.root.querySelector('[data-expand="' + id + '"]');
    if (w && w.focus) w.focus();
  }

  /* ── the side panel: the same college beside the list (the Funding Follow-up Dashboard's drawer: its heading takes
     the focus on open, Escape closes it and the focus returns to the word that opened it); a dialog, so Tab stays
     inside it while it is open. Its width lasts the visit; nothing is stored. ── */
  function section(h, kids) { return el("section", { cls: "cdd-psec" }, [el("h3", { text: h })].concat(kids)); }
  function panelBody(M, c, now) {
    var sp = c.spot_check, out = [];
    out.push(section("Overall", [tba(tbaOf(M, "overall"))]));
    out.push(section("Confidence", c.confidence ? [el("p", { cls: "cdd-state", text: cap(c.confidence.level) }), el("p", { cls: "cdd-of", text: c.confidence.why })]
      : [tba("Not read yet: confidence starts with the first read.")]));
    GROUPS.forEach(function (g) {
      var ds = datasets(M, c).filter(function (d) { return d.group === g; });
      out.push(section(g, ds.map(function (d) {
        var kids = [el("h4", { text: d.label })];
        if (d.den != null) kids.push(bar(d));
        if (d.state) kids.push(el("p", { cls: "cdd-state", text: d.state }));
        if (d.state && d.note) kids.push(el("p", { cls: "cdd-of", text: d.note }));
        if (d.den == null && d.tba) kids.push(tba(d.tba));
        if (d.lines && d.lines.length) kids.push(dl(d.lines));
        if (d.causes && d.causes.length) kids.push(el("p", { cls: "cdd-of", text: "Still to pass, by cause: " + d.causes.map(function (x) { return x[0] + " " + fmt(x[1]); }).join("; ") }));
        (d.later || []).forEach(function (x) { kids.push(el("p", { cls: "cdd-tbaline" }, [el("strong", { text: x[0] + ": " + x[1] + ". " }), x[2]])); });
        if (d.link) kids.push(el("p", { cls: "cdd-of" }, [el("a", { href: d.link, text: "The catalog the capture read" })]));
        if (d.stamp || d.held) kids.push(stampLine(d.stamp, now));
        if (d.src && d.held) kids.push(el("p", { cls: "cdd-src", text: "Source: " + d.src }));
        return el("div", { cls: "cdd-pds", "data-ds": d.key }, kids);
      })));
    });
    var dates = [["Last read", c.read_at ? when(c.read_at) + (c.read_kind === "capture_preview" ? " (on a pull request branch)" : "") : "Not yet"],
      ["Last loaded", "TBA"], ["Last spot-checked", sp && sp.checked_at ? when(sp.checked_at) : "Not yet"],
      ["Last confirmed by a person", "TBA"], ["Last scouted", c.scout && c.scout.checked_at ? when(c.scout.checked_at) : "Not yet"]];
    out.push(section("Dates", [dl(dates), el("p", { cls: "cdd-tbaline" }, [el("strong", { text: "Loaded and confirmed: TBA. " }), tbaOf(M, "loaded")])]));
    var G = gaps(M, c);
    out.push(section("Known gaps and barriers", [G.length ? el("ul", { cls: "cdd-gaps" }, G.map(function (g) { return el("li", { text: g }); }))
      : el("p", { cls: "cdd-of", text: c.harvested ? "None recorded in the committed files." : "Not read yet." })]));
    var A = asks(M, c);
    out.push(section("Asks", [A.length ? el("ul", { cls: "cdd-gaps" }, A.map(function (a) {
      return el("li", null, [el("span", { cls: "cdd-ask", text: a.text }), el("span", { cls: "cdd-of", text: a.detail + (a.owner ? ". Owner: " + a.owner : ". Owner: TBA") })]);
    })) : el("p", { cls: "cdd-of", text: "None on file." }), tbaOf(M, "owners") ? el("p", { cls: "cdd-src", text: tbaOf(M, "owners") }) : null]));
    if (c.cost_usd != null) {
      var cp = costPer(c);
      out.push(section("Cost and run", [dl([["Cost of the last read", "$" + Number(c.cost_usd).toFixed(2)], cp == null ? null : ["Per passing program at read time", "$" + cp.toFixed(3)],
        c.read_seconds != null ? ["Run time", minutes(c.read_seconds)] : null, c.run ? ["Actions run", String(c.run)] : null].filter(Boolean))]));
    }
    var src = [c.slug ? "kb/program_requirements_college/" + c.slug + "/" : null, M.sources.census || null, c.slo_queue ? M.sources.slo_queue : null,
      c.scout ? scoutFile(M, c) : null, sp ? sp.file + (sp.pr ? " (pull request " + sp.pr + ")" : "") : null,
      sp && sp.settled_later ? "a later settlement beside the receipt (kb/spot_checks/README.md)" : null, M.sources.universe || null].filter(Boolean);
    out.push(section("Sources", [el("ul", { cls: "cdd-srcs" }, src.map(function (s) { return el("li", { text: s }); }))]));
    return out;
  }
  /* A dialog that says aria-modal makes the rest of the page inert while it is open (COBIx on PR 3231): every sibling
     on the way from the panel up to the body, the list and the site's header and menu among them, so a word behind
     the panel cannot be clicked or reached. Only the attributes set here are removed again. */
  var INERT = [];
  function holdInert(box) {
    releaseInert();
    for (var n = box; n && n.parentNode && n !== document.body; n = n.parentNode) {
      Array.prototype.forEach.call(n.parentNode.children, function (sib) {
        if (sib === n || sib.hasAttribute("inert") || /^(SCRIPT|STYLE|LINK)$/.test(sib.tagName)) return;
        sib.setAttribute("inert", ""); INERT.push(sib);
      });
    }
  }
  function releaseInert() { INERT.forEach(function (x) { x.removeAttribute("inert"); }); INERT = []; }
  window.addEventListener("cpl-tab-activated", function (e) { if (e && e.detail && e.detail.tab !== "commons") { S.panel = null; releaseInert(); } });
  function panelShell() {
    var box = el("aside", { cls: "cdd-panel", id: "cdd-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "cdd-panel-h", hidden: "" });
    box.addEventListener("keydown", function (e) { trap(e, box); });
    VIEW.panel = box;
    return box;
  }
  function drawPanel(now) {
    var box = VIEW.panel, M = VIEW.M;
    if (!box || !M) return;
    var c = byId(M, S.panel);
    box.textContent = "";
    if (!c) { box.setAttribute("hidden", ""); releaseInert(); return; }
    box.removeAttribute("hidden");
    holdInert(box);
    box.style.setProperty("--cdd-pw", S.pw + "px");
    var grip = el("div", { cls: "cdd-grip", role: "separator", "aria-orientation": "vertical", "aria-label": "Panel width", tabindex: "0",
      "aria-valuemin": String(PW.min), "aria-valuemax": String(PW.max), "aria-valuenow": String(S.pw), "aria-valuetext": S.pw + " pixels wide" });
    wireGrip(grip, box);
    var close = el("button", { type: "button", cls: "cmn-word", id: "cdd-panel-close", text: "Close" });
    close.addEventListener("click", function () { closePanel(); });
    var head = el("div", { cls: "cdd-panel-top" }, [el("div", null, [el("h2", { id: "cdd-panel-h", tabindex: "-1", text: c.name }),
      el("p", { cls: "cdd-of", text: (c.district || "") + (c.kind === "continuing_education" ? "; a continuing-education campus" : "") })]), close]);
    var inner = el("div", { cls: "cdd-panel-in" }, [head, el("p", { cls: "cdd-src" }, ["From the committed files, built " + (day(M.written) || "on a date the file does not give") + ".",
      el("span", { cls: "cdd-gripnote", text: " Drag the edge or use the arrow keys on it to change the width; double-click it to reset." })])]
      .concat(panelBody(M, c, now || VIEW.now)));
    box.appendChild(grip);
    box.appendChild(inner);
  }
  function setWidth(w, box) {
    var room = (window.innerWidth || PW.max) - 24;
    S.pw = Math.round(Math.max(PW.min, Math.min(PW.max, Math.min(room, w))));
    box.style.setProperty("--cdd-pw", S.pw + "px");
    var g = box.querySelector(".cdd-grip");
    if (g) { g.setAttribute("aria-valuenow", String(S.pw)); g.setAttribute("aria-valuetext", S.pw + " pixels wide"); }
  }
  function wireGrip(grip, box) {
    grip.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") setWidth(S.pw + PW.step, box);
      else if (e.key === "ArrowRight") setWidth(S.pw - PW.step, box);
      else if (e.key === "Home") setWidth(PW.min, box);
      else if (e.key === "End") setWidth(PW.max, box);
      else if (e.key === "Enter") setWidth(PW.start, box);
      else return;
      e.preventDefault();
    });
    grip.addEventListener("dblclick", function () { setWidth(PW.start, box); });
    grip.addEventListener("pointerdown", function (e) {
      var x0 = e.clientX, w0 = S.pw;
      try { grip.setPointerCapture(e.pointerId); } catch (er) { /* jsdom */ }
      function move(ev) { setWidth(w0 - (ev.clientX - x0), box); }
      function up() { grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up); }
      grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", up);
      e.preventDefault();
    });
  }
  function focusables(box) {
    return Array.prototype.filter.call(box.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]'), function (x) { return !x.closest("[hidden]"); });
  }
  function trap(e, box) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePanel(); return; }
    if (e.key !== "Tab") return;
    var f = focusables(box);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || !box.contains(a) || a === box.querySelector("#cdd-panel-h"))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !box.contains(a))) { e.preventDefault(); first.focus(); }
  }
  function setAddress() {
    var h = "#" + address();
    try { if (window.history && history.replaceState && location.hash !== h) history.replaceState(null, "", h); } catch (e) { /* the view still draws */ }
    if (VIEW.noted) VIEW.noted(String(location.hash || ""));
  }
  function openPanel(id, from) {
    S.panel = id; VIEW.from = from || null;
    drawPanel();
    setAddress();
    var h = VIEW.panel && VIEW.panel.querySelector("#cdd-panel-h");
    if (h && h.focus) h.focus();
  }
  function closePanel() {
    var id = S.panel;
    S.panel = null;
    drawPanel();
    setAddress();
    var back = (VIEW.from && VIEW.root && VIEW.root.querySelector(VIEW.from)) || (VIEW.root && VIEW.root.querySelector('[data-expand="' + id + '"]'));
    VIEW.from = null;
    if (back && back.focus) back.focus();
  }

  var VIEW = { root: null, M: null, noted: null, now: null, panel: null, from: null, drawBody: null };
  function render(root, M, route, now) {
    releaseInert();   // a redraw (a new address, a figure) starts with the whole page live
    VIEW.root = root; VIEW.M = M; VIEW.now = now || VIEW.now || new Date();
    ensureCss();
    var R = parseRoute(route), pc = bySlug(M, R.college);
    S.panel = pc ? pc.id : null;
    var f = FILTERS[R.filter] ? R.filter : "all";
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
    tiles(M).filter(Boolean).forEach(function (t) {
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
      L.forEach(function (c) {
        body.appendChild(row(M, c, VIEW.now));
        if (String(S.open) === String(c.id)) body.appendChild(detail(M, c, VIEW.now));
      });
      if (!L.length) body.appendChild(el("tr", null, [el("td", { colspan: String(COLUMNS.length), text: "No college matches." })]));
      shown.textContent = "Showing " + fmt(L.length) + " of " + fmt(M.colleges.length) + (S.filter !== "all" ? ": " + FILTERS[S.filter].word : "");
    }
    search.addEventListener("input", function () { S.q = search.value || ""; drawBody(); });
    VIEW.drawBody = drawBody;
    drawHead(); drawBody();
    list.appendChild(el("div", { cls: "cdd-wrap", role: "region", "aria-label": "Colleges", tabindex: "0" }, [table]));
    wrap.appendChild(list);
    wrap.appendChild(notes(M));
    var page = el("div", { cls: "cmn-page" }, [wrap, panelShell()]);   // the panel beside the wrapper, which goes inert while it is open
    page.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.panel != null) { e.preventDefault(); closePanel(); } });
    root.appendChild(page);
    drawPanel(VIEW.now);
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
      el("p", { cls: "cdd-src", text: "A college's name opens its row: each dataset the committed files hold for it, with its bar, its date and its open gaps. The row opens the same college in a side panel, with every dataset the dashboard tracks; one with no committed source reads TBA and says why." })
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
  /* An address that names a college opens its panel; the panel's heading takes the focus, as a click would give it. */
  function focusArrival() {
    var h = S.panel != null && VIEW.panel && VIEW.panel.querySelector("#cdd-panel-h");
    if (h && h.focus) h.focus();
  }
  function boot(root, filter, opts) {
    opts = opts || {};
    VIEW.noted = opts.noted || null;
    if (!root) return Promise.resolve(null);
    S.q = ""; S.filter = ""; S.sort = { k: "name", d: 1 }; S.open = null; S.panel = null; S.pw = PW.start;   // a visit starts fresh: nothing is remembered
    if (VIEW.M && cache) { render(root, VIEW.M, filter, new Date()); focusArrival(); return Promise.resolve(VIEW.M); }
    root.textContent = "Reading the Commons data dashboard…";
    cache = cache || load();
    return cache.then(function (M) {
      render(root, M, filter, new Date());
      focusArrival();
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
    ".cdd-c-name { width:24%; } .cdd-c-pr { width:23%; } .cdd-c-gap { width:9%; } .cdd-c-read { width:13%; } .cdd-c-cost { width:12%; } .cdd-c-conf { width:19%; }",
    ".cdd-level { display:block; font-weight:700; color:var(--cmn-heading); }",
    ".cdd-notes { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:16px 20px; display:grid; gap:8px; }",
    ".cdd-notes ul { margin:0; padding-left:20px; display:grid; gap:4px; color:var(--cmn-ink-2); }",
    ".cdd-src { margin:0; color:var(--cmn-muted); font-size:.88rem; overflow-wrap:anywhere; }",
    ".cdd-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }",
    /* slice 2: the row opened in place */
    ".cdd-table tbody th .cdd-name { display:inline-block; text-align:left; font-size:inherit; font-weight:700; }",
    ".cdd-table tr.cdd-open > th, .cdd-table tr.cdd-open > td { background:var(--cmn-pill-bg); border-bottom-color:var(--cmn-pill-bg); }",
    ".cdd-table tr.cdd-more > td { background:var(--cmn-page); padding:12px 14px 16px; }",
    ".cdd-more-in { display:grid; gap:12px; }",
    ".cdd-ds { display:grid; gap:10px; grid-template-columns:repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); }",
    ".cdd-card { min-width:0; display:grid; gap:4px; align-content:start; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:10px; padding:10px 12px; }",
    ".cdd-card h4, .cdd-gapbox h4, .cdd-pds h4 { margin:0; font-size:.95rem; color:var(--cmn-heading); }",
    ".cdd-state { margin:0; font-weight:700; color:var(--cmn-heading); }",
    ".cdd-card .cdd-of, .cdd-panel .cdd-of { margin:0; }",
    "dl.cdd-dl { margin:0; display:grid; grid-template-columns:minmax(0, auto) minmax(0, 1fr); gap:2px 12px; font-size:.86rem; }",
    "dl.cdd-dl dt { color:var(--cmn-muted); } dl.cdd-dl dd { margin:0; color:var(--cmn-ink); font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }",
    ".cdd-stampline { display:block; font-size:.84rem; color:var(--cmn-muted); }",
    ".cdd-gapbox { display:grid; gap:4px; }",
    "ul.cdd-gaps, ul.cdd-srcs { margin:0; padding-left:20px; display:grid; gap:4px; color:var(--cmn-ink-2); font-size:.9rem; }",
    "ul.cdd-gaps li > span { display:block; }",
    ".cdd-ask { color:var(--cmn-ink); }",
    ".cdd-more-act { margin:0; }",
    ".cdd-tbaline { margin:0; font-size:.88rem; color:var(--cmn-ink-2); }",
    ".cdd-tbaline strong { color:var(--cmn-heading); }",
    /* slice 2: the side panel, the Funding Follow-up Dashboard's drawer in the Commons look. Opaque in both themes
       (--cmn-dialog; the dark --cmn-surface is glass), and above the site header (z-index 100 to 201), as a dialog is. */
    ".cdd-panel { position:fixed; top:0; right:0; bottom:0; z-index:1000; display:flex; width:min(var(--cdd-pw, 480px), calc(100vw - 24px)); background:var(--cmn-dialog); border-left:1px solid var(--cmn-line); box-shadow:-12px 0 32px color-mix(in srgb, var(--cmn-heading) 16%, transparent); color:var(--cmn-ink); }",
    ".cdd-panel[hidden] { display:none; }",
    ".cdd-grip { flex:0 0 14px; cursor:col-resize; touch-action:none; display:flex; align-items:center; justify-content:center; }",
    ".cdd-grip::after { content:\"\"; width:4px; height:48px; border-radius:4px; background:var(--cmn-line); }",
    ".cdd-grip:hover::after { background:var(--cmn-accent); }",
    ".cdd-grip:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:-2px; }",
    ".cdd-grip:focus-visible::after { background:var(--cmn-accent); }",
    ".cdd-panel-in { flex:1 1 auto; min-width:0; overflow-y:auto; display:grid; gap:14px; align-content:start; padding:calc(18px + env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 24px 4px; }",
    ".cdd-panel-top { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }",
    ".cdd-panel-top h2 { margin:0; font-family:var(--cmn-serif); font-size:clamp(1.15rem, 1rem + .6vw, 1.4rem); color:var(--cmn-title); }",
    ".cdd-panel-top h2:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".cdd-psec { display:grid; gap:8px; border-top:1px solid var(--cmn-line-soft); padding-top:10px; }",
    ".cdd-psec > h3 { margin:0; font-family:var(--cmn-serif); font-size:1.05rem; color:var(--cmn-heading); }",
    ".cdd-pds { display:grid; gap:4px; padding:4px 0 6px; }",
    ".cdd-panel a { color:var(--cmn-link); } .cdd-panel a:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    "@media (prefers-reduced-motion: no-preference) { .cdd-grip::after { transition:background-color .15s ease; } }",
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
    "  .cdd-table tr.cdd-more > td::before { content:none; }",
    "  .cdd-panel { width:100vw; border-left:0; }",
    "  .cdd-grip, .cdd-gripnote { display:none; }",
    "  .cdd-panel-in { padding:calc(14px + env(safe-area-inset-top, 0px)) 16px 24px; }",
    "}"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cdd-css")) return;
    document.head.appendChild(el("style", { id: "cdd-css", text: CSS }));
  }

  window.CPL_COMMONS_DATA = {
    boot: boot, render: render, model: model, listFor: listFor, tiles: tiles, address: address, pick: pick, load: load, age: age,
    datasets: datasets, gaps: gaps, asks: asks, slugOf: slugOf, parseRoute: parseRoute, openPanel: openPanel, closePanel: closePanel, PW: PW,
    FILE: FILE, FILTERS: FILTERS, COLUMNS: COLUMNS, CSS: CSS, _state: S,
    _reset: function () { cache = null; VIEW.M = null; S.filter = "all"; S.q = ""; S.sort = { k: "name", d: 1 }; S.open = null; S.panel = null; S.pw = PW.start; }
  };
})();
