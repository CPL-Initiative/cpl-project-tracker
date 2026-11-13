// commons_data.js — the Commons data dashboard (#3215): slice 1, the statewide tiles and the college list; slice 2, a
// college's row that opens in place and the same college in a side panel; slice 3, the overall bar and the live counts
// (the builder's "live" and "overall" keys, basis live, each figure with its date in words and TBA until the first live
// read), the data dictionary (#commons/data/dictionary, the "dictionary" key), the API checklist (#commons/data/apis,
// the "apis" key; an unverified status never counts as connected), the district roll-up (#commons/data/districts,
// S648), the catalog platform filter, and one "Coming next"
// section naming what the mock shows beyond these, each with what it waits on.
//
// Sam, 2026-11-13, relayed by COBIx on #3215: a Commons dashboard for each college's datasets we pull, how complete
// and how trustworthy each one is, what is in the way and who can help, in the Funding Follow-up Dashboard's pattern
// (csm_workspace.js: figures across the top, each the button that opens the list it counts; a college list under
// them; a side panel). Slice 1 drew the figures and the list. Slice 2 opens a college's row in place (each dataset the
// builder holds for it, with its bar, stamp and gaps) and draws the same college in a side panel (datasets grouped as
// the mock groups them, dates, gaps, asks, cost, sources; TBA with its reason where no committed file supplies one).
// Still to come (the page's own "Coming next" section): AI workers, integrations per college, the College view
// (internal only), the JST funnel, and the per-college reads of PPM, descriptions, MIS and COE.
//
// What it reads, committed files the site already serves (it WRITES NOTHING):
//   kb/status/commons_data.json   built by kb/_build_commons_data_status.py from the identity crosswalk, the harvest's
//                                 committed per-college files (through the gap census's own functions), the SLO
//                                 queue, the source scouts and any committed spot-check receipt.
//   kb/status/commons_data_programs/<slug>.json   the same builder's per-college list of the programs still to pass,
//                                 each with its cause, lever and catalog page (S649); read only when that college's row
//                                 or panel opens, so a cause opens its programs at .../college/<slug>/cause/<key>.
// A figure the file marks TBA reads TBA, with its reason; nothing here is estimated or carried from the mock.
//
// Loaded by commons.js when the address names it (#commons/data, #commons/data/<filter>, the platform filter at
// #commons/data[/<filter>]/platform/<key>, a college's panel at #commons/data[/<filter>][/platform/<key>]/college/<slug>,
// and the two views at #commons/data/dictionary and #commons/data/apis). The view, the filter, the platform and the
// panel's college last the visit and live only in the address; the sort, the search, the open row and the panel's width last the visit. Tokens only (the tab's --cmn roles), words
// for every control, no glyphs.
(function () {
  "use strict";

  var FILE = "kb/status/commons_data.json";
  var GITHUB_REPO = "https://github.com/cpl-initiative/cpl-project-tracker/";
  /* The view's name (Sam, Nov 13, 5:56 AM PT, on #3229: "rename it College Data Collection"). */
  var TITLE = "College Data Collection";
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
  function plural(n, one, many) { return fmt(n) + " " + (Number(n) === 1 ? one : many); }
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
    /* Collected: a committed program-requirements capture with its records (Sam, Nov 13, #3229: "instead of
       Harvested, let's use the word Collected"; the builder's field keeps its name, harvested). */
    collected: { word: "Collected", test: function (c) { return c.harvested; } },
    unread: { word: "Not collected yet", test: function (c) { return !c.harvested; } },
    /* Collected, but the capture read an older catalog year than the newest any capture read (#3229's table). */
    reread: { word: "Needs a re-read for the newest catalog", test: function (c, M) { var y = newestYear(M || VIEW.M); return !!(c.harvested && y && c.catalog_year && c.catalog_year < y); } },
    /* Collection freshness, from each capture's start and the builder's own thresholds (rule.age_days). */
    fresh: { word: "Collected within a week", test: function (c, M) { return ageOf(c, M) === "fresh"; } },
    recent: { word: "Collected within a month", test: function (c, M) { return ageOf(c, M) === "recent"; } },
    stale: { word: "Collected more than a month ago", test: function (c, M) { return ageOf(c, M) === "stale"; } },
    gaps: { word: "Programs still to pass", test: function (c) { return c.harvested && c.gap > 0; } },
    slo: { word: "SLO read waiting", test: function (c) { return !!c.slo_queue; } },
    scouted: { word: "Scouted for a wave", test: function (c) { return !!c.scout; } },
    noncredit: { word: "Continuing education", test: function (c) { return c.kind === "continuing_education"; } },
    strong: { word: "Confidence strong", test: function (c) { return level(c) === "strong"; } },
    partial: { word: "Confidence partial", test: function (c) { return level(c) === "partial"; } },
    limited: { word: "Confidence limited", test: function (c) { return level(c) === "limited"; } },
    overall: { word: "Colleges with an overall bar", test: function (c, M) { return !!overallOf(M || VIEW.M, c); } }
  };
  /* The level the builder wrote from the rule (rule.confidence); the page never derives one of its own. */
  function level(c) { return c && c.confidence ? c.confidence.level : null; }
  var LEVEL_RANK = { strong: 3, partial: 2, limited: 1 };
  var FILTER_SORT = { gaps: { k: "gap", d: -1 }, unread: { k: "name", d: 1 }, overall: { k: "overall", d: 1 } };
  /* An old address keeps working: #commons/data/harvested opens the Collected list. */
  var FILTER_ALIAS = { harvested: "collected" };
  function ageOf(c, M) { return c && c.harvested && c.read_at ? age(c.read_at, (M || VIEW.M || {}).rule, VIEW.now) : null; }
  /* The newest catalog year any committed capture read ("2026-2027"), the year a re-read is measured against. */
  function newestYear(M) {
    var y = "";
    ((M && M.colleges) || []).forEach(function (c) { if (c.harvested && c.catalog_year && c.catalog_year > y) y = c.catalog_year; });
    return y;
  }
  /* "2026-2027" as "2026-27". */
  function yearWords(y) { var m = /^(\d{4})-\d{2}(\d{2})$/.exec(String(y || "")); return m ? m[1] + "-" + m[2] : String(y || ""); }
  /* The confidence mix in words, the way a completeness figure carries it beside itself (Sam, Nov 13, #3229 comment
     6857124403: "upfocus the confidence and completeness indicators"): each level is a word, never a color alone. */
  function confWords(M) {
    var n = function (k) { return listFor(M, k).length; };
    var parts = [["limited", n("limited")], ["partial", n("partial")], ["strong", n("strong")]].filter(function (p) { return p[1]; })
      .sort(function (a, b) { return b[1] - a[1]; });
    if (!parts.length || (M.tba || {}).confidence) return "";
    return "Confidence: " + parts.map(function (p, i) { return p[0] + " at " + (i ? fmt(p[1]) : plural(p[1], "college", "colleges")); }).join(", ");
  }

  function model(data) {
    data = data || {};
    var colleges = Array.isArray(data.colleges) ? data.colleges : [];
    var obj = function (v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
    return { colleges: colleges, statewide: data.statewide || {}, rule: data.rule || {}, tba: data.tba || {},
      sources: data.sources || {}, written: data.written_at || "", fields: data.fields || {},
      live: obj(data.live), overall: obj(data.overall), dictionary: obj(data.dictionary), apis: obj(data.apis) };
  }
  function listFor(M, filter) {
    var f = FILTERS[filter] || FILTERS.all;
    return M.colleges.filter(function (c) { return f.test(c, M); });
  }

  /* ── slice 3: the live read (the builder's "live" and "overall" keys, basis live) ──
     Its figures always carry their basis and date in words, apart from the committed files' figures, and read TBA
     until the first live read. A read the builder kept after a later attempt failed says so, with the earlier date. */
  function liveRead(M) {
    var L = M.live || {}, O = M.overall || {};
    return L.basis === "live" && L.state === "read" && !!L.read_at && O.state === "read";
  }
  function attemptFailed(M) { var a = (M.live || {}).last_attempt; return a && a.ok === false ? a : null; }
  /* "live read, Nov 13, 2026", the basis and date every live figure carries. */
  function liveWords(M) { return "live read, " + (day((M.live || {}).read_at) || "on a date the file does not give"); }
  /* What a reader needs beside a live figure: the earlier read's date when the builder kept it. */
  function keptWords(M) {
    var a = attemptFailed(M);
    if (!a || !liveRead(M)) return "";
    return "The latest live read" + (a.at ? ", " + day(a.at) + "," : "") + " did not complete (" + words(a.error_class || "other") + "); these figures are from the earlier read of " + day(M.live.read_at) + ".";
  }
  /* Why a live figure reads TBA. */
  function liveReason(M) {
    var a = attemptFailed(M);
    return "The live read has not run yet." + (a ? " Its last attempt" + (a.at ? ", " + day(a.at) + "," : "") + " did not complete (" + words(a.error_class || "other") + ")." : "");
  }
  function overallOf(M, c) {
    if (!liveRead(M) || !c) return null;
    var o = ((M.overall || {}).colleges || {})[String(c.id)];
    return o && typeof o.value === "number" ? o : null;
  }
  function liveOf(M, c) {
    if (!liveRead(M) || !c) return null;
    return ((M.live || {}).colleges || {})[String(c.id)] || null;
  }
  var MISSING = "The live read holds no counts for this college.";
  var NO_COUNT = "The live read holds this college but no count for this figure.";
  function liveSrc(M, k) { return ((M.live || {}).tables || {})[k] || "the live counts"; }
  function pc(v) { return v == null ? "" : Math.round(v * 100) + "%"; }
  /* A registry boolean in words: the registry records a link only when one is seen, so the word is "held". */
  function heldWord(v) { return v ? "held" : "not held"; }
  function pathwayWord(g) { return g.sequence_source ? "held" : g.sequence_checked ? "none found when looked for" : "not looked for yet"; }

  /* ── slice 3: the catalog platform each harvested college's capture read (shareable), a filter of words ── */
  function platformsOf(M, filter) {
    var n = {};
    (filter ? listFor(M, filter) : M.colleges).forEach(function (c) { if (c.platform) n[c.platform] = (n[c.platform] || 0) + 1; });
    return Object.keys(n).sort(function (a, b) { return n[b] - n[a] || platformWord(a).localeCompare(platformWord(b)); }).map(function (k) { return [k, n[k]]; });
  }

  /* The figures across the top. A figure that counts colleges is the button that opens them; a figure summed over
     many colleges stays plain (CLAUDE.md: a figure card opens what it counts); an unread figure reads TBA. */
  /* The order is Sam's (Nov 13, #3229): what is collected, then how confident we are and how complete it is, each
     completeness figure with its confidence beside it; then what is still in the way; then the team's own figures.
     Every card carries a one-line definition under its number. A card whose count is zero and says nothing (Not
     collected yet, a re-read nobody needs) is left out, so no card can empty the list. */
  function tiles(M) {
    var S = M.statewide, n = function (k) { return listFor(M, k).length; };
    var p = pct(S.passing, S.programs), cp = S.cost_receipts && S.passed_at_read ? S.cost_usd / S.passed_at_read : null;
    var conf = confWords(M), ny = newestYear(M);
    return [
      { f: "collected", v: fmt(n("collected")) + " of " + fmt(n("all")), l: "Collected",
        d: "A committed program-requirements capture with its records is on file. " + plural(n("all") - n("noncredit"), "college", "colleges") + " and " + plural(n("noncredit"), "continuing-education campus", "continuing-education campuses") + ", in " + plural(S.districts, "district", "districts") + "." },
      n("unread") ? { f: "unread", v: fmt(n("unread")), l: "Not collected yet", d: "No committed capture yet; shown as not collected, never as zero complete." } : null,
      M.tba.confidence ? { v: "TBA", l: "Confidence", d: M.tba.confidence, tba: true }
        /* The card's line is the builder's (rule.confidence_card), written from the same thresholds as each level. */
        : { l: "Confidence", parts: [["strong", n("strong")], ["partial", n("partial")], ["limited", n("limited")]],
          d: (M.rule || {}).confidence_card || (M.rule || {}).confidence || "The level the builder writes for each college from its spot-check receipts." },
      /* Two bases sit side by side, so each definition starts with its own: the captures list every program the
         collection reads (Active, Active - Teachout Only and Approved: STATUS_FILTER in kb/_program_requirements_college.py),
         and the live card beside it counts Active programs only. */
      p == null ? { v: "TBA", l: "Program requirements passing", d: "No committed capture lists a program yet.", tba: true }
        : { v: Math.round(p * 100) + "%", l: "Program requirements passing", conf: conf,
          d: "Of the " + fmt(S.programs) + " programs listed in the committed captures, " + fmt(S.passing) + " pass the machine checks: coverage, nothing invented, units equal or unstated. The captures list Active, Teachout and Approved programs; the Active programs card counts Active programs only." },
      activeTile(M, conf),
      overallTile(M, conf),
      /* It counts programs, so the card stays plain; the word inside it opens the colleges that hold them. */
      { v: fmt(S.gap), l: "Programs still to pass", open: n("gaps") ? { f: "gaps", word: "Their " + plural(n("gaps"), "college", "colleges") + ", most first" } : null,
        d: "Of the " + fmt(S.programs) + " programs listed in the committed captures, those that do not yet pass the machine checks." },
      /* Without the builder's thresholds every capture would read stale, so the card reads TBA with its reason. */
      freshWords(M) ? { l: "Collection freshness", parts: [["fresh", n("fresh"), "fresh"], ["recent", n("recent"), "recent"], ["stale", n("stale"), "stale"]], d: freshWords(M) }
        : { v: "TBA", l: "Collection freshness", d: "The file gives no freshness thresholds (rule.age_days), so no capture's age is read.", tba: true },
      ny && n("reread") ? { f: "reread", v: fmt(n("reread")), l: "Needs a " + yearWords(ny) + " re-read", d: "Collected, but the committed capture read an earlier catalog year." } : null,
      slosTile(M),
      { f: "slo", v: fmt(n("slo")), l: "SLO read waiting", d: "Colleges whose public pages print no SLOs, or whose SLO read is held or waiting on a reader." },
      { f: "scouted", v: fmt(n("scouted")), l: "Scouted for a wave", d: "Colleges whose catalog host was checked ahead of a collection wave, " + fmt(S.scout_barrier) + " with an access barrier. Not a completeness score." },
      cp == null ? { v: "TBA", l: "Read cost per passing program", d: "No committed read receipt carries a cost yet.", tba: true }
        : { v: "$" + cp.toFixed(3), l: "Read cost per passing program", d: "Dollars for the last committed read, divided by programs that passed at read time: $" + Number(S.cost_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " over " + fmt(S.passed_at_read) + ", " + fmt(S.cost_receipts) + " receipts." },
      apiTile(M)
    ];
  }
  /* Active programs with a passing record, of the Active programs: the live table's completeness count, basis live,
     with its confidence beside it (Sam's direction on #3229: a completeness count with its confidence level beside it). A figure
     summed over every college stays plain. */
  function activeTile(M, conf) {
    var st = (M.live || {}).statewide || {}, pr = st.programs || {}, rc = st.records || {};
    if (!liveRead(M)) return { v: "TBA", l: "Active programs complete", d: liveReason(M), tba: true };
    if (pr.active == null || rc.active_passing == null) return { v: "TBA", l: "Active programs complete", d: "The live read holds no statewide count of Active programs.", tba: true };
    return { v: fmt(rc.active_passing) + " of " + fmt(pr.active), l: "Active programs complete", conf: conf, basis: liveWords(M),
      d: "Of the " + fmt(pr.active) + " Active programs in COCI, " + liveWords(M) + ", those with a passing record in the live program requirements table." + (keptWords(M) ? " " + keptWords(M) : "") };
  }
  /* Collection freshness's line, from the builder's thresholds; without them it names no day count. */
  function freshWords(M) {
    var a = (M.rule || {}).age_days;
    if (!a || a.fresh == null || a.recent == null) return "";
    return "From each capture's start: fresh within " + a.fresh + " days, recent within " + a.recent + ", stale after.";
  }
  /* The statewide overall figure: the mean of the colleges' overall bars, basis live; it opens those colleges,
     lowest first. Until the first live read it reads TBA and says why. */
  function overallTile(M, conf) {
    var st = (M.overall || {}).statewide || {};
    if (!liveRead(M) || st.mean == null) return { v: "TBA", l: "Overall completeness", d: liveReason(M), tba: true };
    return { f: "overall", v: pc(st.mean), l: "Overall completeness", basis: liveWords(M), conf: conf,
      d: "The mean of " + fmt(st.colleges) + " colleges' overall bars, " + liveWords(M) + ". " + (keptWords(M) ? keptWords(M) + " " : "") + "Opens them, lowest first." };
  }
  /* The API checklist's figure: connected, of the APIs a connection is needed for. A status the builder reads
     unverified never counts as connected. It opens the checklist. */
  function apiCount(M) {
    var rows = Array.isArray((M.apis || {}).rows) ? M.apis.rows : [];
    var need = rows.filter(function (r) { return r.needed === "yes"; });
    return { rows: rows, need: need.length, connected: need.filter(function (r) { return r.status === "connected"; }).length,
      unverified: rows.filter(function (r) { return r.status === "unverified"; }).length };
  }
  /* Colleges whose course SLOs the live read holds (Sam, in session, S649: "need a link to show the colleges with
     collected slos"). It opens their view. */
  function slosTile(M) {
    var R = slosRows(M);
    if (!liveRead(M)) return { v: "TBA", l: "Colleges with collected SLOs", d: liveReason(M), tba: true };
    var so = R.filter(function (r) { return r.slo; }).length, ob = R.filter(function (r) { return r.obj; }).length;
    return { view: "slos", v: fmt(so) + " of " + fmt(M.colleges.length), l: "Colleges with collected SLOs", basis: liveWords(M),
      d: "Colleges whose course SLOs the " + liveWords(M) + " holds; " + plural(ob, "college holds", "colleges hold") + " objectives too. Opens them." };
  }
  function apiTile(M) {
    var a = apiCount(M);
    if (!a.rows.length) return { v: "TBA", l: "APIs connected", d: M.tba.apis || "The API checklist is not in the file yet.", tba: true };
    return { view: "apis", v: fmt(a.connected) + " of " + fmt(a.need), l: "APIs connected",
      d: "Connected, of the APIs a connection is needed for" + (a.unverified ? "; " + fmt(a.unverified) + " read unverified, since the repo holds no evidence for the status claimed" : "") + ". Opens the checklist." };
  }

  /* ── the list's columns, each with its sort key ── */
  var COLUMNS = [
    { k: "name", label: "College", d0: 1, val: function (c) { return c.name; } },
    { k: "overall", label: "Overall", d0: 1, val: function (c) { var o = overallOf(VIEW.M, c); return o ? o.value : -1; } },
    /* Sam, in session, S649: "add an slo/objective progress bar to the top row". Sorts on the SLO share. */
    { k: "out", label: "SLOs and objectives", d0: 1, val: function (c) { var o = outcomeShares(VIEW.M, c); return o ? o.slo : -1; } },
    { k: "pr", label: "Program requirements", d0: 1, val: function (c) { return c.harvested ? pct(c.passing, c.programs) || 0 : -1; } },
    { k: "gap", label: "Still to pass", d0: -1, val: function (c) { return c.harvested ? c.gap : -1; } },
    { k: "read", label: "Last read", d0: -1, val: function (c) { return c.read_at ? new Date(c.read_at).getTime() : 0; } },
    { k: "cost", label: "Read cost per passing program", d0: -1, val: function (c) { var v = costPer(c); return v == null ? -1 : v; } },
    { k: "conf", label: "Confidence", d0: -1, val: function (c) { return LEVEL_RANK[level(c)] || 0; } }
  ];
  var SORT_WORDS = { 1: { name: "A to Z", other: "low first" }, "-1": { name: "Z to A", other: "high first" } };

  var PW = { min: 300, max: 900, start: 480, step: 20 };   // the panel's width in px (Sam, 1:52 AM PT: 300 to 900; double-click resets)
  /* sort null means the default, resolved when the list draws (defaultSort); a person's own sort lasts the visit. */
  var S = { view: "", filter: "all", platform: "", district: "", sort: null, q: "", open: null, panel: null, cause: null, pane: null, pw: PW.start };
  /* The list opens lowest completeness first (#3229; the commons lane's NEXT): the overall bar where the live read
     holds one, else program requirements passing. "auto" marks the default, so the words above the list say so and
     a heading's first click starts a person's own sort. */
  /* Courses with SLOs, and with objectives, of the courses on the college's Active programs: the live read's counts. */
  /* A college whose course outlines print no objectives (the builder's objectives_printed false: every committed read
     is on an outline system that prints none, and none was found) says so in words, never a missing figure (S649). */
  var NO_OBJ_SHORT = "Objectives: its course outlines print none";
  var NO_OBJ = "This college's course outlines print no objectives, so there are none to collect; the SLOs are read from the same outlines.";
  function outcomeShares(M, c) {
    var lv = M ? liveOf(M, c) : null, lo = (lv && lv.outcomes) || {}, lc = (lv && lv.program_courses) || {};
    if (!lv || !lc.active_courses) return null;
    return { slo: Math.min(1, (lo.slo_courses_on_active || 0) / lc.active_courses), obj: Math.min(1, (lo.objective_courses_on_active || 0) / lc.active_courses),
      sloN: lo.slo_courses_on_active || 0, objN: lo.objective_courses_on_active || 0, den: lc.active_courses };
  }
  function defaultSort(M) { return liveRead(M) ? { k: "overall", d: 1, auto: true } : { k: "pr", d: 1, auto: true }; }
  /* The three views beside the college list (slice 3; the districts S648), each at its own address. */
  var VIEWS = { districts: "Colleges by district", slos: "Colleges with collected SLOs", dictionary: "The data dictionary", apis: "The API checklist" };
  /* What a link opens in the side panel (Sam, in session, S649: "all links should open to the sidebar instead on new
     tab ... give the option to go to new tab from the sidebar"). Each is a word in the address after the college (or
     after a view): one that names an item takes it as the next word, a safe word (a control number, a key, a slug),
     never a URL, since the arrival splits the address on "/". */
  var PANES = { catalog: 0, scout: 0, capture: 0, run: 0, pathways: 0, slos: 0, plos: 0, program: 1, source: 1, entry: 1 };
  function paneRoute(p) { return p ? "/" + p.k + (PANES[p.k] && p.a ? "/" + p.a : "") : ""; }
  function listRoute(filter, platform, district) {
    return (filter && filter !== "all" ? "/" + filter : "") + (platform ? "/platform/" + platform : "") + (district ? "/district/" + district : "");
  }
  /* A district's address word, the way a college's is made. */
  function districtSlug(name) { return slugOf({ name: name }); }
  function districtName(M, slug) {
    var c = slug ? M.colleges.filter(function (x) { return x.district && districtSlug(x.district) === slug; })[0] : null;
    return c ? c.district : "";
  }
  function address() {
    if (S.view) return "commons/data/" + S.view + (S.pane && S.panel == null ? paneRoute(S.pane) : "");
    var a = "commons/data" + listRoute(S.filter, S.platform, S.district);
    var c = VIEW.M ? byId(VIEW.M, S.panel) : null;
    if (!c) return a + (S.pane ? paneRoute(S.pane) : "");
    return a + "/college/" + slugOf(c) + (S.pane ? paneRoute(S.pane) : S.cause && (c.causes || {})[S.cause] ? "/cause/" + S.cause : "");
  }
  /* What the address after #commons/data names: a view (dictionary, apis), or the list's filter, then its catalog
     platform (platform/<key>), then a college (college/<slug>), then one of its causes (cause/<key>, the panel opened
     at that cause's programs, S649), or what one of its links opens (a word of PANES, S649), each optional. A view
     (districts, slos, dictionary, apis) takes a pane that needs no college (source/<key>, entry/<slug>). */
  function parseRoute(route) {
    var p = String(route || "").split("/").filter(Boolean), out = { view: "", filter: "all", platform: "", college: "", district: "", cause: "", pane: null };
    var i = 0;
    if (VIEWS[p[0]]) { out.view = p[0]; i = 1; }
    else if (!(p[0] === "college" || p[0] === "platform" || p[0] === "district" || p[0] in PANES)) { out.filter = p[0] || "all"; i = 1; }
    while (i < p.length) {
      var w = p[i];
      if (w in PANES) { out.pane = { k: w, a: PANES[w] ? p[i + 1] || "" : "" }; i += PANES[w] ? 2 : 1; continue; }
      if (!out.view) {
        if (p[i] === "platform") out.platform = p[i + 1] || "";
        else if (p[i] === "college") out.college = p[i + 1] || "";
        else if (p[i] === "district") out.district = p[i + 1] || "";
        else if (p[i] === "cause") out.cause = p[i + 1] || "";
      }
      i += 2;
    }
    return out;
  }

  /* The list's order in words: the default says what "lowest completeness" reads from and where the colleges with no
     value go; a person's own order says it lasts the visit. */
  function sortWords(M) {
    var s = S.sort || defaultSort(M);
    var col = COLUMNS.filter(function (c) { return c.k === s.k; })[0] || COLUMNS[0];
    if (s.auto && s.k === "overall") return "Sorted lowest overall completeness first (" + liveWords(M) + "); a college the live read does not hold comes last. A column heading sorts another way for this visit.";
    if (s.auto) return "Sorted lowest program requirements passing first, colleges not collected yet at the top. A column heading sorts another way for this visit.";
    var by = "Sorted by " + col.label.toLowerCase() + ", " + (col.k === "name" ? SORT_WORDS[String(s.d)].name : SORT_WORDS[String(s.d)].other);
    if (s.card) return by + ", as its card opens the list" + noValueWords(col, s.d) + ". Show all colleges returns to lowest completeness first.";
    return by + ", for this visit" + noValueWords(col, s.d) + ". A new visit opens lowest completeness first.";
  }
  /* Where the colleges with no value for the column go, as sorted() places them: the overall bar's always last; every
     other column's missing value sorts as the lowest. */
  function noValueWords(col, d) {
    if (col.k === "name") return "";
    if (col.k === "overall") return "; colleges the live read does not hold last";
    return "; colleges with no value " + (d === 1 ? "first" : "last");
  }
  function sorted(M, list) {
    var col = COLUMNS.filter(function (c) { return c.k === S.sort.k; })[0] || COLUMNS[0];
    /* A college the live read does not hold has no overall value: it goes last in either direction, never first. */
    var last = col.k === "overall";
    return list.slice().sort(function (a, b) {
      var x = col.val(a), y = col.val(b);
      if (last && (x < 0 || y < 0)) return x < 0 && y < 0 ? a.name.localeCompare(b.name) : x < 0 ? 1 : -1;
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
    } else pr.appendChild(el("span", { cls: "cdd-unread", text: "Not collected yet" }));
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
    var ov = overallOf(M, c);
    var ovCell = el("td", { "data-label": "Overall", cls: ov ? null : "cdd-quiet" }, ov
      ? [el("span", { cls: "cdd-pr" }, [meter(ov.value), el("span", { cls: "cdd-n", text: pc(ov.value) }), el("span", { cls: "cdd-of", text: cap(liveWords(M)) })])]
      : [liveRead(M) ? "Not in the live read" : "TBA"]);
    var os = outcomeShares(M, c);
    var outCell = el("td", { "data-label": "SLOs and objectives", cls: os ? "cdd-outs" : "cdd-quiet" }, os
      ? [el("span", { cls: "cdd-pr" }, [meter(os.slo), el("span", { cls: "cdd-n", text: pc(os.slo) }), el("span", { cls: "cdd-of", text: "SLOs" })]),
        c.objectives_printed === false ? el("span", { cls: "cdd-of", "data-noobj": "true", text: NO_OBJ_SHORT })
          : el("span", { cls: "cdd-pr" }, [meter(os.obj), el("span", { cls: "cdd-n", text: pc(os.obj) }), el("span", { cls: "cdd-of", text: "Objectives" })])]
      : [liveRead(M) ? "Not in the live read" : "TBA"]);
    return el("tr", { "data-college": c.name, "data-id": String(c.id), cls: open ? "cdd-open" : null }, [name, ovCell, outCell, pr,
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
  /* The panel's groups; "Collected" was "Harvested" (Sam, Nov 13, #3229). */
  var GROUPS = ["Collected", "Connected"];
  var CHECK_WORDS = { coverage: "coverage", invented: "a course invented", arithmetic: "units arithmetic", repeated: "a course repeated", outcomes: "outcomes" };
  function causeWord(M, k) { return ((M.rule || {}).causes || {})[k] || words(k); }
  function tbaOf(M, k) { return (M.tba || {})[k] || ""; }
  /* The scout file's name, from the builder's own source line (the page names no internal folder of its own). */
  function scoutFile(M, c) { return String((M.sources || {}).scouts || "").replace(/[^/]*$/, "") + (c.scout.wave || "scout") + ".json"; }
  function datasets(M, c) {
    var L = [];
    var pr = { key: "pr", group: "Collected", label: "Program requirements", held: !!c.harvested,
      src: "kb/program_requirements_college/" + (c.slug || "<slug>") + "/ (capture and summary), causes through the gap census's committed-files functions" };
    if (c.harvested) {
      var v = pct(c.passing, c.programs);
      pr.num = c.passing; pr.den = c.programs; pr.value = v == null ? "None listed" : Math.round(v * 100) + "%";
      pr.note = fmt(c.passing) + " of " + fmt(c.programs) + " listed programs pass the machine checks";
      pr.lines = [["Listed by the capture", fmt(c.programs)], c.listed_closed != null ? ["With a closed course list", fmt(c.listed_closed)] : null,
        c.found != null ? ["Programs whose page the capture found", fmt(c.found)] : null, c.extracted != null ? ["Records extracted (a reread can add some)", fmt(c.extracted)] : null,
        ["Passing now", fmt(c.passing)], ["Still to pass", fmt(c.gap)]].filter(Boolean);
      pr.causes = Object.keys(c.causes || {}).sort(function (a, b) { return c.causes[b] - c.causes[a] || a.localeCompare(b); })
        .map(function (k) { return [causeWord(M, k), c.causes[k], k]; });
      /* Records failing each machine check, from the capture's committed summary (failed_checks); a record can fail
         more than one, so these do not sum to the programs still to pass. Only the checks that failed any. */
      var fc = c.failed_checks || {}, fk = Object.keys(fc).filter(function (k) { return fc[k] > 0; }).sort(function (a, b) { return fc[b] - fc[a] || a.localeCompare(b); });
      if (fk.length) pr.fails = el("div", { cls: "cdd-part", "data-part": "fails" }, [el("p", { cls: "cdd-partname", text: "Records failing each machine check, of the " + (c.extracted != null ? fmt(c.extracted) + " " : "") + "records extracted as the capture read them (a record can fail more than one)" }),
        dl(fk.map(function (k) { return [cap(CHECK_WORDS[k] || words(k)), fmt(fc[k])]; }))]);
      pr.stamp = { at: c.read_at, kind: c.read_kind === "capture_preview" ? "read, on a pull request branch" : "read" };
      /* The completeness figure carries its confidence beside it, as a word (Sam, Nov 13, #3229). */
      if (level(c)) pr.conf = "Confidence: " + level(c);
    } else pr.state = "Not collected yet";
    /* The live counts for this college (basis live, its own date), apart from the committed files' figures above. */
    var lv = liveOf(M, c), lp = (lv && lv.programs) || {}, lr = (lv && lv.records) || {}, lc = (lv && lv.program_courses) || {},
      lo = (lv && lv.outcomes) || {}, lg = (lv && lv.registry) || {};
    /* A completed live read that holds no counts for this college is its own case, with its own reason. */
    var gone = !lv && liveRead(M) ? MISSING : "";
    var liveAt = lv ? { at: M.live.read_at, kind: "live read" } : null;
    if (lv) {
      pr.live = { title: "From the " + liveWords(M), lines: [["Active programs", fmt(lp.active)], ["Teachout programs (apart from Active)", fmt(lp.teachout)],
        ["Approved programs (apart from Active)", fmt(lp.approved)], ["Program records on file", fmt(lr.total)], ["Active programs with a passing record", fmt(lr.active_passing)],
        ["Courses on Active programs", fmt(lc.active_courses)]] };
      /* Records a person confirmed is left out: Sam's direction (Nov 13, #3229) allows a quiet team date at most, never
         a count of person review. */
      pr.held = true; pr.src += "; live: " + liveSrc(M, "programs") + "; " + liveSrc(M, "records");
      pr.liveStamp = liveAt;
    } else pr.later = [["Teachout and Approved programs", "TBA", gone || liveReason(M)]];
    L.push(pr);

    var slo = { key: "slo", group: "Collected", label: "Course SLOs", held: !!c.slo_queue, src: "kb/course_outcomes/queue.json", tba: lv ? "" : gone || tbaOf(M, "slo") };
    if (c.slo_queue) {
      slo.state = "SLO read " + c.slo_queue.state;
      slo.note = c.slo_queue.why || "";
      if (c.slo_queue.on) slo.stamp = { at: c.slo_queue.on, kind: "queued" };
    }
    /* A live figure: courses with the outcome, of the courses on the college's Active programs. */
    function liveCourses(d, n, all, at, what) {
      d.held = true; d.basis = cap(liveWords(M));
      d.liveStamp = at ? { at: at, kind: "loaded" } : liveAt;
      if (n == null || lc.active_courses == null) d.tba = NO_COUNT;
      else {
        d.num = n; d.den = lc.active_courses;
        d.value = d.den ? pc(pct(d.num, d.den)) : "None listed";
        d.liveNote = fmt(n) + " of " + fmt(lc.active_courses) + " courses on Active programs have " + what + (all == null ? "" : "; " + fmt(all) + " courses in all");
      }
      d.src = (d.src ? d.src + "; " : "") + "live: " + liveSrc(M, "outcomes") + "; " + liveSrc(M, "program_courses");
    }
    if (lv) liveCourses(slo, lo.slo_courses_on_active, lo.slo_courses, lo.slo_loaded_at, "SLOs");
    /* A figure opens what it counts (S649): the college's SLO and objective courses, in the panel. */
    if (slo.held) slo.word = ["The SLO and objective courses collected for " + c.name, { k: "slos" }];
    L.push(slo);
    var plo = { key: "plo", group: "Collected", label: "Program PLOs", tba: gone || tbaOf(M, "plo") };
    if (lv) {
      plo.held = true; plo.tba = ""; plo.basis = cap(liveWords(M)); plo.src = "live: " + liveSrc(M, "records"); plo.liveStamp = liveAt;
      if (lr.active_with_plos == null || lp.active == null) plo.tba = NO_COUNT;
      else {
        plo.num = lr.active_with_plos; plo.den = lp.active;
        plo.value = plo.den ? pc(pct(plo.num, plo.den)) : "None listed";
        plo.liveNote = fmt(lr.active_with_plos) + " of " + fmt(lp.active) + " Active programs carry PLOs in their record";
      }
    }
    if (plo.held) plo.word = ["The program PLOs collected for " + c.name, { k: "plos" }];
    L.push(plo);
    var obj = { key: "obj", group: "Collected", label: "Course objectives", tba: gone || tbaOf(M, "objectives") };
    if (lv) { obj.tba = ""; liveCourses(obj, lo.objective_courses_on_active, lo.objective_courses, lo.objective_loaded_at, "objectives"); }
    if (c.objectives_printed === false) { obj.held = true; obj.num = null; obj.den = null; obj.tba = ""; obj.state = "None printed"; obj.note = NO_OBJ; }
    if (obj.held) obj.word = ["The SLO and objective courses collected for " + c.name, { k: "slos" }];
    L.push(obj);

    var cat = { key: "cat", group: "Collected", label: "Catalog source", held: !!(c.platform || c.scout || lv), tba: lv ? "" : gone || tbaOf(M, "catalog_registry"),
      src: (c.platform ? "the capture's own record of its catalog" : "") + (c.platform && c.scout ? "; " : "") + (c.scout ? scoutFile(M, c) : "") };
    /* Each source keeps its own lines and its own stamp (the capture's read, the scout's check), so an age cue never
       dates a line another source wrote; where they disagree, both show, labeled. */
    cat.parts = [];
    if (c.platform || c.catalog_year) cat.parts.push({ key: "capture", title: "What the capture read",
      lines: [c.platform ? ["Catalog platform", platformWord(c.platform)] : null, c.catalog_year ? ["Catalog year", c.catalog_year] : null].filter(Boolean),
      pane: isHttp(c.catalog_url) ? { k: "catalog" } : null, linkWord: "The catalog the capture read", stamp: c.read_at ? { at: c.read_at, kind: "read" } : null });
    if (c.scout) {
      var sc = c.scout;
      cat.parts.push({ key: "scout", title: "What the source scout found",
        lines: [sc.platform ? ["Catalog platform", platformWord(sc.platform)] : null, sc.catalog_year ? ["Catalog year", sc.catalog_year] : null,
          ["Recommends", words(sc.recommendation) + (sc.challenge && sc.challenge !== "none" ? "; " + words(sc.challenge) : "; no access barrier")]].filter(Boolean),
        pane: isHttp(sc.catalog_url) ? { k: "scout" } : null, linkWord: "The catalog the scout found", stamp: sc.checked_at ? { at: sc.checked_at, kind: "scouted" } : null });
      if (c.platform && ((sc.platform && sc.platform !== c.platform) || (sc.catalog_year && c.catalog_year && sc.catalog_year !== c.catalog_year)))
        cat.differ = "The scout found a different " + [sc.platform && sc.platform !== c.platform ? "platform" : null,
          sc.catalog_year && c.catalog_year && sc.catalog_year !== c.catalog_year ? "catalog year" : null].filter(Boolean).join(" and ") + " than the capture read.";
    }
    if (lv) cat.parts.push({ key: "registry", title: "What the program source registry holds (" + liveWords(M) + ")",
      lines: lg.row === false ? [["Registry row", "No registry row for this college"]]
        : [["Catalog link", heldWord(lg.catalog_link)], ["Curriculum view", heldWord(lg.course_outline_link)], ["Pathway source", pathwayWord(lg)]],
      stamp: { at: M.live.read_at, kind: "live read" } });
    if (lv) cat.src = (cat.src ? cat.src + "; " : "") + "live: " + liveSrc(M, "registry");
    L.push(cat);
    L.push({ key: "ppm", group: "Collected", label: "Program Pathways Mapper (PPM)", tba: tbaOf(M, "ppm") });
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
    if (c.harvested && !c.spot_check) A.push({ text: "Team-internal: COBIx spot-checks five records against the catalog", detail: "the spot-check contract on #3111", owner: "COBIx" });
    return A;
  }
  function stampLine(st, now) {
    if (!st || !st.at) return el("span", { cls: "cdd-stampline", text: "Not yet" });
    var a = age(st.at, VIEW.M && VIEW.M.rule, now);
    return el("span", { cls: "cdd-stampline", text: "Updated " + when(st.at) + " (" + st.kind + ")" + (a ? ", " + a : "") });
  }
  /* A value that is a figure ("144", "$3.83", "67%", "40 minutes") never breaks inside itself (S648). */
  var FIGURE = /^\$?[\d,.]+%?( (seconds|minutes))?$/;
  function dl(lines) {
    return el("dl", { cls: "cdd-dl" }, [].concat.apply([], lines.map(function (l) {
      return [el("dt", { text: l[0] }), el("dd", { cls: FIGURE.test(String(l[1] == null ? "" : l[1]).trim()) ? "cdd-ddn" : null, text: l[1] })];
    })));
  }
  /* Every link on the page opens its content in the side panel (Sam, in session, S649, reversing #3257's links that
     opened a new tab); the panel carries one control, "Open in a new tab", for the same place. A word here is a button
     naming its pane; cid is the college it belongs to, or null for a view's own source. */
  function paneWord(word, pane, cid, cls) {
    var b = el("button", { type: "button", cls: "cmn-word cdd-paneword" + (cls ? " " + cls : ""), "data-pane": pane.k + (pane.a ? "/" + pane.a : ""), text: word });
    b.addEventListener("click", function () { openPane(cid, pane, b); });
    return b;
  }
  function isHttp(u) { return /^https?:\/\//i.test(String(u || "")); }
  function repoHref(path) { return GITHUB_REPO + (/\/$/.test(path) ? "tree/main/" : "blob/main/") + path; }
  function repoPath(s) { var m = /^((?:kb|docs|scripts|tests)\/[^\s<>*]*)(.*)$/.exec(String(s || "")); return m ? { path: m[1], rest: m[2] } : null; }
  function actionsHref(run) { return /^\d+$/.test(String(run || "")) ? GITHUB_REPO.replace(/\/$/, "") + "/actions/runs/" + run : null; }
  function pathwaysHref(c) { return "#cpl-pathways/college/" + encodeURIComponent(c.name); }
  /* Still to pass, by cause: a small table, most programs first (S648; it was one long sentence). Each cause is the
     word that opens its programs (S649, Sam on #3229: "make sure any card that has what looks like a link opens up to
     something"): in the opened row it opens the side panel at that cause; in the panel it shows or hides the list
     below the table. The panel's cause is in the address, #commons/data/college/<slug>/cause/<key>. */
  function causeTable(d, c, inPanel) {
    var rows = d.causes.map(function (x) {
      var k = x[2], on = !!inPanel && S.cause === k;
      var w = c && k ? el("button", { type: "button", cls: "cmn-word cdd-cause", "data-cause": k, text: cap(x[0]) }) : null;
      if (w && inPanel) { w.setAttribute("aria-expanded", on ? "true" : "false"); w.setAttribute("aria-controls", "cdd-cprogs"); }
      if (w) w.addEventListener("click", function () { if (inPanel) pickCause(c, on ? null : k, k); else openPanel(c.id, '[data-expand="' + c.id + '"]', k); });
      return el("tr", { cls: on ? "cdd-on" : null }, [el("th", { scope: "row" }, [w || cap(x[0])]), el("td", { cls: "cdd-num", text: fmt(x[1]) })]);
    });
    var t = el("table", { cls: "cdd-causes", "data-causes": "true" }, [el("caption", { text: "Still to pass, by cause" }),
      el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "Cause" }), el("th", { scope: "col", cls: "cdd-num", text: "Programs" })])]),
      el("tbody", null, rows)]);
    if (!c) return t;
    var note = el("p", { cls: "cdd-of", text: inPanel ? "A cause shows its programs below it; a program opens what we hold about it and its catalog page, where the capture found one."
      : "A cause opens its programs in the side panel." });
    return el("div", { cls: "cdd-causebox" }, [t, note, inPanel && S.cause && (c.causes || {})[S.cause] ? causePrograms(c, S.cause) : null]);
  }

  /* ── each cause's programs (S649; COBIx's item 1 on #3229) ──
     The builder writes one small file per college (kb/status/commons_data_programs/<slug>.json, named in the row's
     programs_file); the page reads a college's file only when its row or its panel opens, once a visit. */
  var PROGS = {};
  function loadPrograms(c) {
    if (!c || !c.programs_file || PROGS[c.programs_file]) return;
    var key = c.programs_file;
    PROGS[key] = { state: "loading" };
    var p;
    try { p = fetch(key, { cache: "no-store" }); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(function (r) {
      if (!r || !r.ok) throw new Error(key + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (j) { PROGS[key] = { state: "ok", rows: (j && Array.isArray(j.programs)) ? j.programs : [] }; },
      function () { PROGS[key] = { state: "error" }; })
      .then(function () { redrawFor(c); });
  }
  /* A list that arrives after its college opened draws in place; the focus stays on the word it was on. */
  function redrawFor(c) {
    if (!VIEW.root || !VIEW.M || !onData()) return;
    var a = document.activeElement, sel = null;
    if (a && a.getAttribute) {
      if (a.getAttribute("data-cause")) sel = '[data-cause="' + a.getAttribute("data-cause") + '"]';
      else if (a.getAttribute("data-expand")) sel = '[data-expand="' + a.getAttribute("data-expand") + '"]';
      else if (a.id) sel = "#" + a.id;
      if (sel && VIEW.panel && VIEW.panel.contains(a)) sel = "#cdd-panel " + sel;
    }
    if (String(S.panel) === String(c.id)) drawPanel();
    else if (String(S.open) === String(c.id) && VIEW.drawBody) VIEW.drawBody();
    else return;
    var b = sel && VIEW.root.querySelector(sel);
    if (b && b.focus) b.focus();
  }
  /* What the committed files hold about a college's outcomes (the builder's <slug>.outcomes.json): PLO text per
     program, SLO and objective courses by subject. Read only when its pane opens. */
  var OUTS = {};
  function loadOutcomes(c) {
    if (!c || !c.outcomes_file || OUTS[c.outcomes_file]) return;
    var key = c.outcomes_file;
    OUTS[key] = { state: "loading" };
    var p;
    try { p = fetch(key, { cache: "no-store" }); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(function (r) {
      if (!r || !r.ok) throw new Error(key + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (j) { OUTS[key] = { state: "ok", d: j || {} }; }, function () { OUTS[key] = { state: "error" }; })
      .then(function () { if (String(S.panel) === String(c.id) && S.pane) redrawFor(c); });
  }
  function pickCause(c, k, from) {
    S.cause = k; S.pane = null;
    drawPanel();
    setAddress();
    var b = VIEW.panel && (VIEW.panel.querySelector('[data-cause="' + (from || k || "") + '"]') || VIEW.panel.querySelector("#cdd-panel-h"));
    if (b && b.focus) b.focus();
  }
  function causePrograms(c, k) {
    var M = VIEW.M, n = (c.causes || {})[k] || 0, LW = (M.rule || {}).levers || {};
    var head = el("h4", { id: "cdd-cprogs-h", text: cap(causeWord(M, k)) + ": " + plural(n, "program", "programs") });
    var P = c.programs_file ? PROGS[c.programs_file] : null, body;
    if (!c.programs_file) body = el("p", { cls: "cdd-of", text: "The committed files hold no program list for this college." });
    else if (!P || P.state === "loading") body = el("p", { cls: "cdd-of", role: "status", text: "Reading the programs." });
    else if (P.state === "error") body = el("p", { cls: "cdd-state", text: "The program list could not be read (" + c.programs_file + "). The count above stands." });
    else {
      var rows = P.rows.filter(function (r) { return r.cause === k; });
      body = rows.length ? el("ul", { cls: "cdd-progs" }, rows.map(function (r) {
        var t = r.title || ("Program " + r.cn);
        var lw = LW[r.lever] || {};
        return el("li", { "data-cn": r.cn }, [r.url ? paneWord(t, { k: "program", a: r.cn }, c.id) : el("span", { cls: "cdd-ptitle", text: t }),
          el("span", { cls: "cdd-of", text: [r.award, "control number " + r.cn, r.url ? null : "no catalog page found"].filter(Boolean).join("; ") }),
          lw.what ? el("span", { cls: "cdd-of", text: "What would move it: " + lw.what + (lw.kind ? " (" + lw.kind + ")" : "") }) : null]);
      })) : el("p", { cls: "cdd-of", text: "The program list holds none for this cause; the list and the count were built on different days." });
    }
    return el("section", { cls: "cdd-cprogs", id: "cdd-cprogs", "aria-labelledby": "cdd-cprogs-h", "data-cause-programs": k }, [head, body]);
  }
  function bar(d) {
    var v = pct(d.num, d.den);
    var note = d.liveNote || d.note;
    return el("span", { cls: "cdd-pr" }, [meter(v || 0), el("span", { cls: "cdd-n", text: d.value || (v == null ? "" : Math.round(v * 100) + "%") }),
      d.conf ? el("span", { cls: "cdd-conf", text: d.conf }) : null, note ? el("span", { cls: "cdd-of", text: note }) : null]);
  }
  /* What a dataset's live part adds below its committed-file lines: the basis in words, the live lines, its stamp. */
  function liveBits(d, now) {
    var out = [];
    if (d.basis) out.push(el("p", { cls: "cdd-basis", text: d.basis }));
    if (d.live) out.push(el("div", { cls: "cdd-part", "data-part": "live" }, [el("p", { cls: "cdd-partname", text: d.live.title }), dl(d.live.lines)]));
    if (d.liveStamp !== undefined) out.push(stampLine(d.liveStamp, now));
    return out;
  }
  function tba(reason) { return el("p", { cls: "cdd-tbaline" }, [el("strong", { text: "TBA. " }), reason || ""]); }
  /* A dataset read from more than one source: each part's lines, link and stamp together, and the disagreement. */
  function parts(d, now, c) {
    var out = (d.parts || []).map(function (p) {
      return el("div", { cls: "cdd-part", "data-part": p.key }, [el("p", { cls: "cdd-partname", text: p.title }), dl(p.lines),
        p.pane && c ? el("p", { cls: "cdd-of" }, [paneWord(p.linkWord, p.pane, c.id)]) : null, stampLine(p.stamp, now)]);
    });
    if (d.differ) out.push(el("p", { cls: "cdd-state", "data-differ": "true", text: d.differ }));
    return out;
  }

  /* The row, opened in place: the datasets the builder holds for this college and nothing else, the spot-check, the
     read's cost, the open gaps; a word opens the same college in the side panel. */
  function detail(M, c, now) {
    var cards = datasets(M, c).filter(function (d) { return d.held; }).map(function (d) {
      return el("section", { cls: "cdd-card", "data-ds": d.key, "aria-label": d.label }, [el("h4", { text: d.label }),
        d.den != null ? bar(d) : d.basis && d.tba ? tba(d.tba) : null, d.state ? el("p", { cls: "cdd-state", text: d.state }) : null,
        d.state && d.note ? el("p", { cls: "cdd-of", text: d.note }) : null,
        d.lines && d.lines.length ? dl(d.lines) : null,
        d.causes && d.causes.length ? causeTable(d, c, false) : null, d.fails ? d.fails : null]
        .concat(!d.parts && (d.stamp || d.liveStamp === undefined) ? [stampLine(d.stamp, now)] : [], liveBits(d, now), d.parts ? parts(d, now, c) : [], d.word ? [el("p", { cls: "cdd-of cdd-dsword" }, [paneWord(d.word[0], d.word[1], c.id)])] : []));
    });
    /* The row leads with the confidence level, then completeness (the overall bar), then each dataset (Sam, Nov 13,
       #3229 comment 6857124403, point 3). */
    var ov = overallOf(M, c);
    if (ov) cards.unshift(el("section", { cls: "cdd-card", "data-ds": "overall", "aria-label": "Overall" }, overallBits(M, ov, false, c)));
    if (c.spot_check || c.confidence) {
      var sp = c.spot_check;
      cards.unshift(el("section", { cls: "cdd-card", "data-ds": "confidence", "aria-label": "Confidence" }, [el("h4", { text: "Confidence" }),
        c.confidence ? el("p", { cls: "cdd-state", text: cap(c.confidence.level) }) : null,
        c.confidence ? el("p", { cls: "cdd-of", text: c.confidence.why }) : null,
        sp ? dl([["Spot-check", fmt(sp.agrees) + " agree, " + fmt(sp.differs) + " differ, " + fmt(sp.unreachable) + " unreachable"]]) : null,
        /* With no spot-check there is no date to give: the card says what each level rests on, in the builder's words
           (rule.confidence_card), never a bare "Not yet" (S648). */
        sp ? stampLine({ at: sp.checked_at, kind: "spot-checked" }, now)
          : (M.rule || {}).confidence_card ? el("p", { cls: "cdd-of", "data-levels": "true", text: M.rule.confidence_card }) : null]));
    }
    if (c.cost_usd != null) {
      var cp = costPer(c);
      cards.push(el("section", { cls: "cdd-card", "data-ds": "cost", "aria-label": "Read cost" }, [el("h4", { text: "Read cost" }),
        dl([["Cost of the last read", "$" + Number(c.cost_usd).toFixed(2)], cp == null ? null : ["Per passing program", "$" + cp.toFixed(3)],
          c.read_seconds != null ? ["Page-finding time (the capture, before the paid read)", minutes(c.read_seconds)] : null].filter(Boolean))]));
    }
    var G = gaps(M, c);
    var openP = el("button", { type: "button", cls: "cmn-word", "data-panel-open": String(c.id), text: "Open " + c.name + " in the side panel" });
    openP.addEventListener("click", function () { openPanel(c.id, '[data-panel-open="' + c.id + '"]'); });
    /* The college's sources, each opening in the side panel (S649): the catalog the capture read, what the capture
       holds, the paid read, and the college's CPL Pathways view in COBI (Sam, in session: "Need a link to the colleges
       CPL Pathways cobi page"). */
    var srcs = sourceWords(c);
    var box = el("div", { cls: "cdd-more-in" }, [
      srcs.length ? el("p", { cls: "cdd-srcrow", "data-sources": "true" }, [el("span", { cls: "cdd-partname", text: "Sources:" })].concat(srcs)) : null,
      cards.length ? el("div", { cls: "cdd-ds" }, cards) : el("p", { cls: "cdd-of", text: "Not collected yet: no committed file holds a dataset for this college." }),
      el("div", { cls: "cdd-gapbox" }, [el("h4", { text: "Open gaps" }),
        G.length ? el("ul", { cls: "cdd-gaps" }, G.map(function (g) { return el("li", { text: g }); })) : el("p", { cls: "cdd-of", text: c.harvested ? "None recorded in the committed files." : "Not collected yet." })]),
      el("p", { cls: "cdd-more-act" }, [openP])
    ]);
    return el("tr", { cls: "cdd-more", id: "cdd-more-" + c.id, "data-more": String(c.id) }, [el("td", { colspan: String(COLUMNS.length) }, [box])]);
  }
  function sourceWords(c) {
    return [isHttp(c.catalog_url) ? paneWord("The catalog", { k: "catalog" }, c.id) : null,
      c.harvested ? paneWord("What the capture holds", { k: "capture" }, c.id) : null,
      actionsHref(c.run) ? paneWord("The paid read", { k: "run" }, c.id) : null,
      paneWord("CPL Pathways", { k: "pathways" }, c.id)].filter(Boolean);
  }
  /* A college's overall bar and its four parts, with its basis and date in words (never beside a committed figure).
     The SLO and PLO parts open what is collected, in the panel (Sam, in session, S649). */
  function overallBits(M, ov, noHead, c) {
    var p = ov.parts || {};
    return [noHead ? null : el("h4", { text: "Overall" }),
      el("span", { cls: "cdd-pr" }, [meter(ov.value), el("span", { cls: "cdd-n", text: pc(ov.value) }),
        el("span", { cls: "cdd-of", text: "Catalog source, program requirements and outcomes (SLOs and PLOs averaged), averaged" })]),
      dl([["Catalog source", pc(p.catalog)], ["Program requirements passing", pc(p.requirements)], ["Course SLOs", pc(p.slos)], ["Program PLOs", pc(p.plos)]]),
      c ? el("p", { cls: "cdd-of cdd-dsword" }, [paneWord("Course SLOs and objectives collected", { k: "slos" }, c.id), " ", paneWord("Program PLOs collected", { k: "plos" }, c.id)]) : null,
      el("p", { cls: "cdd-basis", text: cap(liveWords(M)) }),
      keptWords(M) ? el("p", { cls: "cdd-of", "data-kept": "true", text: keptWords(M) }) : null].filter(Boolean);
  }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function toggleRow(id) {
    S.open = String(S.open) === String(id) ? null : id;
    if (S.open != null && VIEW.M) loadPrograms(byId(VIEW.M, S.open));
    if (VIEW.drawBody) VIEW.drawBody();
    var w = VIEW.root && VIEW.root.querySelector('[data-expand="' + id + '"]');
    if (w && w.focus) w.focus();
  }

  /* ── what each word opens in the side panel (S649) ──
     For an outside site (most college catalogs refuse to be shown inside another page) the panel shows what we hold
     about it: its title, its address in words, when it was read; "Open in a new tab" goes to the site. For a COBI
     place the panel shows its content, and "Open in a new tab" opens the same address. Never a blank frame. */
  var SOURCE_KEYS = ["census", "slo_queue", "scout", "spot", "universe"];
  function sourceOf(M, c, k) {
    var S0 = M.sources || {}, sp = c && c.spot_check, rp;
    if (k === "census") rp = repoPath(S0.census);
    else if (k === "slo_queue") rp = c && c.slo_queue ? repoPath(S0.slo_queue) : null;
    else if (k === "scout") rp = c && c.scout ? repoPath(scoutFile(M, c)) : null;
    else if (k === "spot") rp = sp && sp.file ? repoPath(sp.file) : null;
    else if (k === "universe") rp = repoPath(S0.universe);
    else if (k === "dictionary") rp = repoPath(String((M.dictionary || {}).source || "docs/reference/data_dictionary.md").split("#")[0]);
    else if (k === "apis") rp = repoPath(String((M.apis || {}).source || "docs/reference/data_dictionary.md").split("#")[0]);
    if (!rp) return null;
    var W = { census: ["The gap census", "The script that gives every program still to pass one cause and one lever, read through its committed-files functions."],
      slo_queue: ["The SLO read queue", "The colleges whose course SLO read is held, has nothing to read, or waits on a parser, with why."],
      scout: ["The source scout's file", "What the source scout found at the college's catalog host ahead of a collection wave."],
      spot: ["The spot-check receipt", "COBIx's check of five records against the catalog" + (sp && sp.pr ? ", filed on pull request " + sp.pr : "") + "."],
      universe: ["The college identity crosswalk", "Every college and continuing-education campus, by district: the page's universe."],
      dictionary: ["The data dictionary", "The doc the dictionary view is parsed from: every dataset, its owner, how we get it and what would improve it."],
      apis: ["The API checklist", "The checklist section of the data dictionary: each API, whether a connection is needed, its status and evidence."] }[k];
    return { word: W[0], about: W[1], path: rp.path };
  }
  function PANE_OK(M, c, p) {
    if (!p || !(p.k in PANES)) return false;
    if (p.k === "source") return !!sourceOf(M, c, p.a);
    if (p.k === "entry") return !c && ((M.dictionary || {}).datasets || []).some(function (x) { return x.link && slugOf({ name: x.name }) === p.a; });
    if (!c) return false;
    if (p.k === "catalog") return isHttp(c.catalog_url);
    if (p.k === "scout") return !!(c.scout && isHttp(c.scout.catalog_url));
    if (p.k === "capture") return !!c.harvested;
    if (p.k === "run") return !!actionsHref(c.run);
    if (p.k === "program") return !!(c.programs_file && p.a);
    return true;   // pathways, slos, plos
  }
  function paneView(M, c, p) {
    var LW = (M.rule || {}).levers || {};
    var outside = "A college's site usually refuses to be shown inside another page, so this panel shows what we hold about it.";
    if (p.k === "source" || p.k === "entry") {
      var src = p.k === "source" ? sourceOf(M, c, p.a) : null, ent = null;
      if (p.k === "entry") ent = ((M.dictionary || {}).datasets || []).filter(function (x) { return slugOf({ name: x.name }) === p.a; })[0];
      if (ent) return { title: "The " + ent.name + " entry", tab: GITHUB_REPO + "blob/main/" + ent.link, basis: "A file in the repository.",
        kids: [dl([["Dataset", ent.name], ["Stage", ent.stage || "TBA"], ["Where it lives", String(ent.link)]]), el("p", { cls: "cdd-of", text: "The entry is a section of the data dictionary; the new tab opens it on GitHub." })] };
      if (!src) return { title: "Not found", kids: [el("p", { cls: "cdd-state", text: "This source is not in the file." })] };
      return { title: src.word, tab: repoHref(src.path), basis: "A file in the repository.",
        kids: [el("p", { cls: "cdd-of", text: src.about }), dl([["Where it lives", src.path]]), el("p", { cls: "cdd-of", text: "The new tab opens the file on GitHub." })] };
    }
    if (p.k === "catalog") return { title: "The catalog the capture read", tab: c.catalog_url, basis: outside,
      kids: [dl([["Address", c.catalog_url], c.platform ? ["Catalog platform", platformWord(c.platform)] : null, c.catalog_year ? ["Catalog year", c.catalog_year] : null,
        ["Read", c.read_at ? when(c.read_at) : "Not yet"]].filter(Boolean))] };
    if (p.k === "scout") { var sc = c.scout; return { title: "The catalog the scout found", tab: sc.catalog_url, basis: outside,
      kids: [dl([["Address", sc.catalog_url], sc.platform ? ["Catalog platform", platformWord(sc.platform)] : null, sc.catalog_year ? ["Catalog year", sc.catalog_year] : null,
        ["Recommends", words(sc.recommendation)], ["Scouted", sc.checked_at ? when(sc.checked_at) : "Not yet"]].filter(Boolean))] }; }
    if (p.k === "run") { var cp = costPer(c); return { title: "The paid read", tab: actionsHref(c.run), basis: "The GitHub Actions run that read this college's programs; the new tab opens its log.",
      kids: [dl([["Run", String(c.run)], ["Read", c.read_at ? when(c.read_at) : "Not yet"], c.cost_usd != null ? ["Cost of the read", "$" + Number(c.cost_usd).toFixed(2)] : null,
        cp == null ? null : ["Per passing program", "$" + cp.toFixed(3)], c.found != null ? ["Programs whose page the capture found", fmt(c.found)] : null,
        c.extracted != null ? ["Records extracted", fmt(c.extracted)] : null, c.read_seconds != null ? ["Page-finding time", minutes(c.read_seconds)] : null].filter(Boolean))] }; }
    if (p.k === "pathways") { var ph = pathwaysHref(c);
      return { title: "CPL Pathways", tab: ph, basis: "A view in COBI.",
        kids: [el("p", { cls: "cdd-of", text: "CPL Pathways shows " + c.name + "'s programs, its pathways and the credit for prior learning a student could use toward them." }),
          el("p", null, [el("a", { href: ph, "data-goto-pathways": "true", text: "Go to " + c.name + " in CPL Pathways" })])] }; }
    if (p.k === "capture") {
      var d = datasets(M, c)[0];
      return { title: "What the capture holds", basis: "From the committed files: the college's capture, its records and the gap census.",
        kids: [dl((d.lines || []).concat([c.platform ? ["Catalog platform", platformWord(c.platform)] : null, c.catalog_year ? ["Catalog year", c.catalog_year] : null,
          ["Read", c.read_at ? when(c.read_at) : "Not yet"]].filter(Boolean))),
          d.causes && d.causes.length ? causeTable(d, c, true) : el("p", { cls: "cdd-of", text: "Every program the capture listed passes." })] };
    }
    if (p.k === "program") {
      var P = c.programs_file ? PROGS[c.programs_file] : null, r = P && P.state === "ok" ? P.rows.filter(function (x) { return x.cn === p.a; })[0] : null;
      if (!r) return { title: "Program " + p.a, kids: [el("p", { cls: P && P.state === "loading" ? "cdd-of" : "cdd-state", role: "status",
        text: !P || P.state === "loading" ? "Reading the program." : "The program list holds no program " + p.a + "." })] };
      var lw = LW[r.lever] || {};
      return { title: r.title || "Program " + r.cn, tab: isHttp(r.url) ? r.url : null, basis: outside,
        kids: [dl([["Award", r.award || "TBA"], ["Control number", r.cn], ["Still to pass because", cap(causeWord(M, r.cause))],
          lw.what ? ["What would move it", cap(lw.what) + (lw.kind ? " (" + lw.kind + ")" : "")] : null, ["Catalog page", r.url || "None found"]].filter(Boolean))] };
    }
    if (p.k === "slos" || p.k === "plos") return outcomesPane(M, c, p.k);
    return { title: "Not found", kids: [] };
  }
  function outcomesPane(M, c, k) {
    var lv = liveOf(M, c), lo = (lv && lv.outcomes) || {}, lc = (lv && lv.program_courses) || {}, lr = (lv && lv.records) || {}, lp = (lv && lv.programs) || {};
    var O = c.outcomes_file ? OUTS[c.outcomes_file] : null, kids = [];
    var wait = !c.outcomes_file ? el("p", { cls: "cdd-of", text: "The committed files hold no " + (k === "slos" ? "course outline read" : "program record with PLOs") + " for this college." })
      : !O || O.state === "loading" ? el("p", { cls: "cdd-of", role: "status", text: "Reading what is collected." })
      : O.state === "error" ? el("p", { cls: "cdd-state", text: "The outcomes file could not be read (" + c.outcomes_file + "). The live counts above stand." }) : null;
    if (k === "slos") {
      kids.push(el("h3", { text: "From the " + liveWords(M) }));
      kids.push(lv ? dl([["Courses with SLOs on Active programs", fmt(lo.slo_courses_on_active) + " of " + fmt(lc.active_courses)], ["Courses with SLOs, in all", fmt(lo.slo_courses)],
        ["SLOs loaded", lo.slo_loaded_at ? when(lo.slo_loaded_at) : "Not yet"], ["Courses with objectives on Active programs", fmt(lo.objective_courses_on_active) + " of " + fmt(lc.active_courses)],
        ["Courses with objectives, in all", fmt(lo.objective_courses)], ["Objectives loaded", lo.objective_loaded_at ? when(lo.objective_loaded_at) : "Not yet"]])
        : tba(liveRead(M) ? "The live read holds no counts for this college." : liveReason(M)));
      if (c.objectives_printed === false) kids.push(el("p", { cls: "cdd-of", "data-noobj": "true", text: NO_OBJ }));
      if (lv && !lo.slo_courses && !lo.objective_courses) kids.push(el("p", { cls: "cdd-state", text: "Not read yet: the SLO read has not reached " + c.name + (c.slo_queue ? " (SLO read " + c.slo_queue.state + (c.slo_queue.why ? ": " + c.slo_queue.why : "") + ")" : "") + "." }));
      kids.push(el("h3", { text: "By subject, from the committed course outline reads" }));
      var cs = O && O.state === "ok" ? (O.d.courses || {}) : null;
      if (wait) kids.push(wait);
      else if (!cs || !(cs.by_subject || []).length) kids.push(el("p", { cls: "cdd-of", text: "No committed course outline read names this college yet." }));
      else {
        kids.push(el("p", { cls: "cdd-of", text: fmt(cs.slo_courses) + " courses with SLOs and " + fmt(cs.objective_courses) + " with objectives, read " + (cs.read_at ? when(cs.read_at) : "on a date the file does not give") + ". Counts only; the outcomes' own words live in the course outline reads." }));
        kids.push(el("div", { cls: "cdd-wrap", role: "region", "aria-label": "SLO and objective courses by subject", tabindex: "0" }, [el("table", { cls: "cdd-causes cdd-subj" }, [
          el("caption", { text: "Courses by subject" }),
          el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "Subject" }), el("th", { scope: "col", cls: "cdd-num", text: "With SLOs" }), el("th", { scope: "col", cls: "cdd-num", text: "With objectives" })])]),
          el("tbody", null, cs.by_subject.map(function (r) { return el("tr", null, [el("th", { scope: "row", text: r.subject }), el("td", { cls: "cdd-num", text: fmt(r.slo_courses) }), el("td", { cls: "cdd-num", text: fmt(r.objective_courses) })]); }))])]));
      }
      var vw = el("button", { type: "button", cls: "cmn-word", "data-view": "slos", text: "Every college with collected SLOs" });
      vw.addEventListener("click", function () { S.panel = null; S.pane = null; go("slos"); });
      kids.push(el("p", { cls: "cdd-of" }, [vw]));
      return { title: "Course SLOs and objectives", basis: "A view in COBI, from the live read and the committed course outline reads.", kids: kids };
    }
    kids.push(el("h3", { text: "From the " + liveWords(M) }));
    kids.push(lv ? dl([["Active programs whose record carries PLOs", fmt(lr.active_with_plos) + " of " + fmt(lp.active)]])
      : tba(liveRead(M) ? "The live read holds no counts for this college." : liveReason(M)));
    kids.push(el("h3", { text: "Each program's PLOs, from the committed records" }));
    var pl = O && O.state === "ok" ? (O.d.programs || []) : null;
    if (wait) kids.push(wait);
    else if (!pl || !pl.length) kids.push(el("p", { cls: "cdd-of", text: "No committed record carries PLOs for this college." }));
    else {
      kids.push(el("p", { cls: "cdd-of", text: plural(pl.length, "program carries", "programs carry") + " PLOs in its filed record, in the record's own words. A program's name shows them." }));
      kids.push(el("div", { cls: "cdd-plos" }, pl.map(function (r) {
        return el("details", { cls: "cdd-plo", "data-cn": r.cn }, [el("summary", { text: (r.title || "Program " + r.cn) + (r.award ? ", " + r.award : "") + " (" + plural(r.outcomes.length, "PLO", "PLOs") + ")" }),
          el("ol", null, r.outcomes.map(function (o) { return el("li", { text: o }); }))]);
      })));
    }
    return { title: "Program PLOs", basis: "A view in COBI, from the live read and the committed program records.", kids: kids };
  }

  /* ── Colleges with collected SLOs (S649; Sam, in session: "need a link to show the colleges with collected slos").
     From the live read: each college whose course SLOs or objectives it holds. ── */
  function slosRows(M) {
    var out = [];
    M.colleges.forEach(function (c) {
      var lv = liveOf(M, c), lo = (lv && lv.outcomes) || {};
      if (!lv || !(lo.slo_courses || lo.objective_courses)) return;
      out.push({ c: c, slo: lo.slo_courses || 0, sloA: lo.slo_courses_on_active || 0, obj: lo.objective_courses || 0, objA: lo.objective_courses_on_active || 0,
        den: ((lv.program_courses || {}).active_courses) || 0, at: lo.slo_loaded_at || lo.objective_loaded_at || null, objAt: lo.objective_loaded_at || null });
    });
    return out.sort(function (a, b) { return b.slo - a.slo || a.c.name.localeCompare(b.c.name); });
  }
  function slosView(M) {
    var sec = el("section", { cls: "cdd-view", id: "cdd-slos", "aria-labelledby": "cdd-h" });
    if (!liveRead(M)) { sec.appendChild(tba(liveReason(M))); return sec; }
    var R = slosRows(M), so = R.filter(function (r) { return r.slo; }).length, ob = R.filter(function (r) { return r.obj; }).length;
    var np = R.filter(function (r) { return r.c.objectives_printed === false; }).length;
    sec.appendChild(el("p", { cls: "cdd-sortline", id: "cdd-slos-sum", text: plural(so, "college holds", "colleges hold") + " course SLOs and " + plural(ob, "college holds", "colleges hold") + " objectives, " + liveWords(M) +
      (np ? "; the course outlines of " + plural(np, "college", "colleges") + " print no objectives" : "") +
      ". The other " + plural(M.colleges.length - R.length, "college has", "colleges have") + " not been read yet. Most SLO courses first; a college's name opens what is collected for it." }));
    var body = el("tbody", null, R.map(function (r) {
      var w = el("button", { type: "button", cls: "cmn-word cdd-name", "data-slos-college": slugOf(r.c), text: r.c.name });
      w.addEventListener("click", function () { openCollegePane(r.c, { k: "slos" }); });
      return el("tr", { "data-slos-row": r.c.name }, [el("th", { scope: "row", "data-label": "College" }, [w, el("span", { cls: "cdd-dist", text: r.c.district || "" })]),
        el("td", { "data-label": "Courses with SLOs", cls: "cdd-num", text: fmt(r.slo) }),
        el("td", { "data-label": "On Active programs" }, [el("span", { cls: "cdd-pr" }, [meter(r.den ? Math.min(1, r.sloA / r.den) : 0), el("span", { cls: "cdd-n", text: r.den ? pc(Math.min(1, r.sloA / r.den)) : "" }), el("span", { cls: "cdd-of", text: fmt(r.sloA) + " of " + fmt(r.den) + " courses" })])]),
        r.c.objectives_printed === false ? el("td", { "data-label": "Courses with objectives", cls: "cdd-of", "data-noobj": "true", text: "Outlines print none" })
          : el("td", { "data-label": "Courses with objectives", cls: "cdd-num", text: fmt(r.obj) }),
        el("td", { "data-label": "Loaded" }, [r.at ? day(r.at) : el("span", { cls: "cdd-quiet", text: "Not yet" }), r.objAt && r.objAt !== r.at ? el("span", { cls: "cdd-of", text: "Objectives " + day(r.objAt) }) : null])]);
    }));
    var table = el("table", { cls: "cdd-table", id: "cdd-slos-table" }, [
      el("caption", { cls: "cdd-sr", text: "Each college with collected SLOs or objectives: its courses with SLOs, the share on Active programs, its courses with objectives, and when they were loaded" }),
      el("colgroup", null, [el("col", { cls: "cdd-c-sname" }), el("col", { cls: "cdd-c-sn" }), el("col", { cls: "cdd-c-sact" }), el("col", { cls: "cdd-c-sn" }), el("col", { cls: "cdd-c-sat" })]),
      el("thead", null, [el("tr", null, ["College", "Courses with SLOs", "On Active programs", "Courses with objectives", "Loaded"].map(function (h) { return el("th", { scope: "col", text: h }); }))]), body]);
    sec.appendChild(el("div", { cls: "cdd-wrap", role: "region", "aria-label": VIEWS.slos, tabindex: "0" }, [table]));
    return sec;
  }
  /* A college's pane from a view: the college list, its panel open at that pane. */
  function openCollegePane(c, pane) {
    if (!VIEW.root || !VIEW.M) return;
    render(VIEW.root, VIEW.M, "college/" + slugOf(c) + paneRoute(pane));
    setAddress();
    var h = VIEW.panel && VIEW.panel.querySelector("#cdd-panel-h");
    if (h && h.focus) h.focus();
  }

  /* ── the side panel: the same college beside the list (the Funding Follow-up Dashboard's drawer: its heading takes
     the focus on open, Escape closes it and the focus returns to the word that opened it); a dialog, so Tab stays
     inside it while it is open. Its width lasts the visit; nothing is stored. ── */
  function section(h, kids) { return el("section", { cls: "cdd-psec" }, [el("h3", { text: h })].concat(kids)); }
  function panelBody(M, c, now) {
    var sp = c.spot_check, out = [];
    var ov = overallOf(M, c);
    /* Confidence first, then completeness, as in the opened row (Sam, Nov 13, #3229). */
    out.push(section("Confidence", c.confidence ? [el("p", { cls: "cdd-state", text: cap(c.confidence.level) }), el("p", { cls: "cdd-of", text: c.confidence.why })]
      : [tba("Not collected yet: confidence starts with the first collection.")]));
    out.push(section("Overall", ov ? overallBits(M, ov, true, c)
      : [tba(liveRead(M) ? "The live read holds no counts for this college." : liveReason(M) + (tbaOf(M, "overall") ? " " + tbaOf(M, "overall") : ""))]));
    GROUPS.forEach(function (g) {
      var ds = datasets(M, c).filter(function (d) { return d.group === g; });
      out.push(section(g, ds.map(function (d) {
        var kids = [el("h4", { text: d.label })];
        if (d.den != null) kids.push(bar(d));
        if (d.state) kids.push(el("p", { cls: "cdd-state", text: d.state }));
        if (d.state && d.note) kids.push(el("p", { cls: "cdd-of", text: d.note }));
        if (d.den == null && d.tba) kids.push(tba(d.tba));
        if (d.lines && d.lines.length) kids.push(dl(d.lines));
        if (d.causes && d.causes.length) kids.push(causeTable(d, c, true));
        if (d.fails) kids.push(d.fails);
        (d.later || []).forEach(function (x) { kids.push(el("p", { cls: "cdd-tbaline" }, [el("strong", { text: x[0] + ": " + x[1] + ". " }), x[2]])); });
        /* The committed lines' stamp sits under them, before the live block and its own stamp. */
        if (!d.parts && (d.stamp || (d.held && d.liveStamp === undefined))) kids.push(stampLine(d.stamp, now));
        kids = kids.concat(liveBits(d, now));
        if (d.parts) kids = kids.concat(parts(d, now, c));
        if (d.word) kids.push(el("p", { cls: "cdd-of cdd-dsword" }, [paneWord(d.word[0], d.word[1], c.id)]));
        if (d.src && d.held) kids.push(el("p", { cls: "cdd-src", text: "Source: " + d.src }));
        return el("div", { cls: "cdd-pds", "data-ds": d.key }, kids);
      })));
    });
    /* Dates: when the collection was read, spot-checked and scouted. Whether a person confirmed a record is never a
       headline (Sam, Nov 13, #3229: "downfocus on whether something has been reviewed"): the load time and the
       person-confirmed count sit in one quiet team-internal line under the dates. */
    var dates = [["Last read", c.read_at ? when(c.read_at) + (c.read_kind === "capture_preview" ? " (on a pull request branch)" : "") : "Not yet"],
      ["Last spot-checked", sp && sp.checked_at ? when(sp.checked_at) : "Not yet"],
      ["Last scouted", c.scout && c.scout.checked_at ? when(c.scout.checked_at) : "Not yet"]];
    out.push(section("Dates", [dl(dates), el("p", { cls: "cdd-src", "data-team": "dates", text: "For the team: last loaded, TBA. " + tbaOf(M, "loaded") })]));
    var G = gaps(M, c);
    out.push(section("Known gaps and barriers", [G.length ? el("ul", { cls: "cdd-gaps" }, G.map(function (g) { return el("li", { text: g }); }))
      : el("p", { cls: "cdd-of", text: c.harvested ? "None recorded in the committed files." : "Not collected yet." })]));
    /* The asks are the MAP team's and COBIx's work, never the college's (Sam, Nov 13, #3229: "steer away from anything
       that could be construed as an expectation to do double work"). */
    var A = asks(M, c);
    out.push(section("Team asks", [el("p", { cls: "cdd-src", "data-team": "asks", text: "Work for the MAP team and COBIx. Nothing here asks the college to do anything." }),
      A.length ? el("ul", { cls: "cdd-gaps" }, A.map(function (a) {
        return el("li", null, [el("span", { cls: "cdd-ask", text: a.text }), el("span", { cls: "cdd-of", text: a.detail + (a.owner ? ". Owner: " + a.owner : ". Owner: TBA") })]);
      })) : el("p", { cls: "cdd-of", text: "None on file." }), tbaOf(M, "owners") ? el("p", { cls: "cdd-src", text: tbaOf(M, "owners") }) : null]));
    if (c.cost_usd != null) {
      var cp = costPer(c);
      out.push(section("Cost and run", [dl([["Cost of the last read", "$" + Number(c.cost_usd).toFixed(2)], cp == null ? null : ["Per passing program at read time", "$" + cp.toFixed(3)],
        c.run ? ["Actions run of the paid read", String(c.run)] : null,
        c.read_seconds != null ? ["Page-finding time (the capture, before the paid read)", minutes(c.read_seconds)] : null].filter(Boolean))]));
    }
    /* Each source opens in this panel (S649); the capture's folder is what the capture holds, never a GitHub page. */
    var src = sourceWords(c).concat(SOURCE_KEYS.filter(function (k) { return sourceOf(M, c, k); }).map(function (k) { return paneWord(sourceOf(M, c, k).word, { k: "source", a: k }, c.id); }));
    if (sp && sp.settled_later) src.push(el("span", { text: "A later settlement beside the spot-check receipt" }));
    out.push(section("Sources", [el("ul", { cls: "cdd-srcs" }, src.map(function (s) { return el("li", null, [s]); }))]));
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
  /* Idempotent: removes only what holdInert set, and the document's Escape with it. */
  function releaseInert() {
    INERT.forEach(function (x) { x.removeAttribute("inert"); }); INERT = [];
    document.removeEventListener("keydown", onDocKey, true);
  }
  /* Escape closes the panel wherever the focus is, a click on its plain text included (the focus is then the body). */
  function onDocKey(e) {
    if (e.key !== "Escape" || S.panel == null) return;
    e.preventDefault(); e.stopPropagation(); closePanel();
  }
  /* Leaving the data view by any path (another tab, #commons, #commons/ase, browser Back from an open panel) releases
     the page: commons.js draws another view into the root without telling this module. */
  function onData() { return /^#?commons\/data(\/|$)/.test(String(location.hash || "")); }
  function leave() { if (!onData()) { S.panel = null; S.cause = null; S.pane = null; releaseInert(); } }
  window.addEventListener("cpl-tab-activated", leave);
  window.addEventListener("hashchange", leave);
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
    if (!c && !S.pane) { box.setAttribute("hidden", ""); releaseInert(); return; }
    box.removeAttribute("hidden");
    holdInert(box);
    document.removeEventListener("keydown", onDocKey, true);
    document.addEventListener("keydown", onDocKey, true);
    box.style.setProperty("--cdd-pw", S.pw + "px");
    var grip = el("div", { cls: "cdd-grip", role: "separator", "aria-orientation": "vertical", "aria-label": "Panel width", tabindex: "0",
      "aria-valuemin": String(PW.min), "aria-valuemax": String(PW.max), "aria-valuenow": String(S.pw), "aria-valuetext": S.pw + " pixels wide" });
    wireGrip(grip, box);
    var close = el("button", { type: "button", cls: "cmn-word", id: "cdd-panel-close", text: "Close" });
    close.addEventListener("click", function () { closePanel(); });
    var pv = S.pane ? paneView(M, c, S.pane) : null;
    var head = el("div", { cls: "cdd-panel-top" }, [el("div", null, [el("h2", { id: "cdd-panel-h", tabindex: "-1", text: pv ? pv.title : c.name }),
      el("p", { cls: "cdd-of", text: pv ? (c ? c.name : TITLE) : (c.district || "") + (c.kind === "continuing_education" ? "; a continuing-education campus" : "") })]), close]);
    var top = [head];
    if (pv) {
      /* One control to the same place in a new tab, for the bigger view; back to the college where there is one. */
      var acts = [];
      if (c) {
        var back = el("button", { type: "button", cls: "cmn-word", id: "cdd-pane-back", text: "Back to " + c.name });
        back.addEventListener("click", function () { S.pane = null; drawPanel(); setAddress(); var h = VIEW.panel.querySelector("#cdd-panel-h"); if (h && h.focus) h.focus(); });
        acts.push(back);
      }
      var nt = pv.tab || ("#" + address());
      acts.push(el("a", { cls: "cdd-newtab", href: nt, target: "_blank", rel: "noopener noreferrer", "data-newtab": "true", text: "Open in a new tab" }));
      top.push(el("p", { cls: "cdd-paneacts" }, acts));
    }
    var inner = el("div", { cls: "cdd-panel-in" }, top.concat([el("p", { cls: "cdd-src" }, [pv ? pv.basis || "" : "From the committed files, built " + (day(M.written) || "on a date the file does not give") + ".",
      el("span", { cls: "cdd-gripnote", text: " Drag the edge or use the arrow keys on it to change the width; double-click it to reset." })])])
      .concat(pv ? pv.kids : panelBody(M, c, now || VIEW.now)));
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
    /* Only what is drawn: the width edge is display:none under 560px, and a control with no box takes no focus. */
    return Array.prototype.filter.call(box.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]'), function (x) {
      if (x.closest("[hidden]")) return false;
      try { return window.getComputedStyle(x).display !== "none"; } catch (e) { return true; }
    });
  }
  function trap(e, box) {
    if (e.key !== "Tab") return;   // Escape is the document's (onDocKey)
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
  /* A word's pane: the college's panel showing what the word names (or a view's source with no college). */
  function openPane(cid, pane, fromEl) {
    /* A word inside the panel keeps the word that opened the panel as the place the focus returns to on Close. */
    var inside = fromEl && VIEW.panel && VIEW.panel.contains(fromEl) && String(S.panel) === String(cid);
    if (!inside) { VIEW.from = null; VIEW.fromEl = fromEl || null; }
    S.panel = cid; S.pane = pane; S.cause = null;
    var c = VIEW.M ? byId(VIEW.M, cid) : null;
    if (c && (pane.k === "program" || pane.k === "capture")) loadPrograms(c);
    if (c && (pane.k === "slos" || pane.k === "plos")) loadOutcomes(c);
    drawPanel();
    setAddress();
    var h = VIEW.panel && VIEW.panel.querySelector("#cdd-panel-h");
    if (h && h.focus) h.focus();
  }
  function openPanel(id, from, cause) {
    S.panel = id; VIEW.from = from || null; VIEW.fromEl = null; S.cause = cause || null; S.pane = null;
    if (VIEW.M) loadPrograms(byId(VIEW.M, id));
    drawPanel();
    setAddress();
    var h = VIEW.panel && VIEW.panel.querySelector("#cdd-panel-h");
    if (h && h.focus) h.focus();
  }
  function closePanel() {
    var id = S.panel;
    var fromEl = VIEW.fromEl && VIEW.root && VIEW.root.contains(VIEW.fromEl) && !(VIEW.panel && VIEW.panel.contains(VIEW.fromEl)) ? VIEW.fromEl : null;
    S.panel = null; S.cause = null; S.pane = null;
    drawPanel();
    setAddress();
    var back = fromEl || (VIEW.from && VIEW.root && VIEW.root.querySelector(VIEW.from)) || (VIEW.root && VIEW.root.querySelector('[data-expand="' + id + '"]'));
    VIEW.from = null; VIEW.fromEl = null;
    if (back && back.focus) back.focus();
  }

  var VIEW = { root: null, M: null, noted: null, now: null, panel: null, from: null, fromEl: null, drawBody: null };
  function render(root, M, route, now) {
    releaseInert();   // a redraw (a new address, a figure, another view) starts with the whole page live
    VIEW.root = root; VIEW.M = M; VIEW.now = now || VIEW.now || new Date();
    ensureCss();
    var R = parseRoute(route), pcol = R.view ? null : bySlug(M, R.college);
    S.view = R.view;
    S.panel = pcol ? pcol.id : null;
    S.cause = pcol && R.cause && (pcol.causes || {})[R.cause] ? R.cause : null;
    if (pcol) loadPrograms(pcol);
    /* An address naming a cause the college does not hold opens the college alone, and says so in the address. */
    var fixCause = !!(pcol && R.cause && !S.cause);
    /* A pane from the address: a college's needs its college; a view's own source needs none. */
    S.pane = R.pane && (pcol ? PANE_OK(M, pcol, R.pane) : !R.college && PANE_OK(M, null, R.pane)) ? R.pane : null;
    if (R.pane && !S.pane) fixCause = true;
    if (pcol && S.pane && (S.pane.k === "slos" || S.pane.k === "plos")) loadOutcomes(pcol);
    var rf = FILTER_ALIAS[R.filter] || R.filter, f = FILTERS[rf] ? rf : "all";
    /* A card sets its own order (card: true) and the order lasts only while its card's list shows: on a filter change
       the default or a card's order gives way to the new card's, or to the default. A heading's order is the person's
       and stays for the visit. */
    if (f !== S.filter) {
      S.filter = f;
      if (!S.sort || S.sort.auto || S.sort.card) S.sort = FILTER_SORT[f] ? { k: FILTER_SORT[f].k, d: FILTER_SORT[f].d, card: true } : null;
    }
    if (!S.sort) S.sort = defaultSort(M);
    S.platform = platformsOf(M).some(function (p) { return p[0] === R.platform; }) ? R.platform : "";
    S.district = districtName(M, R.district) ? R.district : "";
    root.removeAttribute("style");
    root.textContent = "";
    var wrap = el("div", { cls: "cmn-wrap cdd" });
    wrap.appendChild(el("p", { cls: "cdd-trail" }, [el("a", { href: "#commons", text: "CPL Commons" }), " / ",
      S.view ? el("a", { href: "#commons/data", text: TITLE }) : el("span", { text: TITLE }), S.view ? " / " : null, S.view ? el("span", { text: VIEWS[S.view] }) : null]));
    wrap.appendChild(el("header", { cls: "cmn-top" }, [
      el("h2", { cls: "cmn-title", id: "cdd-h", text: S.view ? VIEWS[S.view] : TITLE }),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      el("p", { cls: "cmn-lede", text: S.view === "districts" ? "Each district's colleges together: how many are collected, how complete their collection is and how confident we are in it, from the same figures as the college list."
        : S.view === "slos" ? "The colleges whose course SLOs or objectives the live read holds: how many courses, how many sit on Active programs, and when each was loaded."
        : S.view === "dictionary" ? "Every dataset College Data Collection tracks: who holds it, how we get it today, what would improve it, how far it has come, and the evidence for each claim."
        : S.view === "apis" ? "Each API the datasets would connect through: who holds it, whether a connection is needed, its status and the evidence for that status."
        : "Every college and continuing-education campus: what we have collected for it, how complete it is, how confident we are in it, and what is in the way." })
    ]));
    wrap.appendChild(viewNav());
    if (S.view) {
      wrap.appendChild(S.view === "districts" ? districtsView(M) : S.view === "slos" ? slosView(M) : S.view === "dictionary" ? dictionaryView(M) : apisView(M));
      var vpage = el("div", { cls: "cmn-page" }, [wrap, panelShell()]);
      root.appendChild(vpage);
      drawPanel(VIEW.now);   // no college on a view: the panel stays hidden and the page live, unless a source is open
      if (fixCause) setAddress();
      return vpage;
    }
    wrap.appendChild(el("p", { cls: "cdd-stamp", id: "cdd-stamp" }, [el("strong", { text: "From the committed files. " }),
      "Built " + (day(M.written) || "on a date the file does not give") + ". A program count here is the programs each college's capture listed; the Program Requirements tab counts the live Active programs. Dates are Pacific time.",
      el("span", { cls: "cdd-stamp-live", id: "cdd-stamp-live" }, [el("strong", { text: "From the live read. " }),
        liveRead(M) ? "The overall bar and every figure marked live come from the " + liveWords(M) + ", kept apart from the committed files' figures." + (keptWords(M) ? " " + keptWords(M) : "")
          : "The overall bar and the live counts read TBA. " + liveReason(M)])]));

    var grid = el("div", { cls: "cdd-tiles", role: "group", "aria-label": "Statewide figures" });
    tiles(M).filter(Boolean).forEach(function (t) {
      var kids = [el("span", { cls: "cdd-v" + (t.v === "TBA" ? " cdd-tba" : ""), text: t.v }), el("span", { cls: "cdd-l", text: t.l }),
        t.conf ? el("span", { cls: "cdd-conf", text: t.conf }) : null, t.d ? el("span", { cls: "cdd-d", text: t.d }) : null];
      if (t.parts) {
        /* One card, several counts: each count is the word that opens the colleges it counts (a button may not hold
           another, so the card is a group of them). */
        var line = el("span", { cls: "cdd-v cdd-vparts" });
        t.parts.forEach(function (p, i) {
          if (i) line.appendChild(document.createTextNode(", "));
          /* A zero count is plain text: a word that opened it would empty the list. */
          if (!p[1]) { line.appendChild(el("span", { cls: "cdd-partz", "data-zero": p[0], text: "0 " + (p[2] || p[0]) })); return; }
          var pb = el("button", { type: "button", cls: "cmn-word cdd-partw", "data-filter": p[0], "aria-pressed": S.filter === p[0] ? "true" : "false",
            text: fmt(p[1]) + " " + (p[2] || p[0]) });
          pb.addEventListener("click", function () { pick(p[0]); });
          line.appendChild(pb);
        });
        grid.appendChild(el("div", { cls: "cdd-tile cdd-split", role: "group", "aria-label": t.l, "data-tile": t.l }, [line].concat(kids.slice(1))));
      } else if (t.open) {
        /* A figure summed over many colleges stays plain; the underlined word in it opens the colleges that hold it. */
        var ow = el("button", { type: "button", cls: "cmn-word cdd-openw", "data-filter": t.open.f, "aria-pressed": S.filter === t.open.f ? "true" : "false", text: t.open.word });
        ow.addEventListener("click", function () { pick(t.open.f); });
        grid.appendChild(el("div", { cls: "cdd-tile", "data-tile": t.l }, kids.concat([el("span", { cls: "cdd-d" }, [ow])])));
      } else if (t.f && !listFor(M, t.f).length) {
        /* A card whose count is zero would open an empty list: it draws plain (review of #3257). */
        grid.appendChild(el("div", { cls: "cdd-tile", "data-tile": t.l, "data-zero": t.f }, kids));
      } else if (t.f) {
        var b = el("button", { type: "button", cls: "cdd-tile cdd-open", "data-filter": t.f, "aria-pressed": S.filter === t.f ? "true" : "false" }, kids);
        b.addEventListener("click", function () { pick(t.f); });
        grid.appendChild(b);
      } else if (t.view) {
        var v = el("button", { type: "button", cls: "cdd-tile cdd-open", "data-view": t.view }, kids);
        v.addEventListener("click", function () { go(t.view); });
        grid.appendChild(v);
      } else grid.appendChild(el("div", { cls: "cdd-tile", "data-tile": t.l }, kids));
    });
    wrap.appendChild(grid);

    var list = el("section", { cls: "cdd-list", "aria-labelledby": "cdd-list-h" });
    list.appendChild(el("h3", { id: "cdd-list-h", cls: "cdd-h3", tabindex: "-1", text: "Colleges" }));
    var search = el("input", { type: "search", id: "cdd-q", cls: "cdd-q", autocomplete: "off", value: S.q });
    var shown = el("p", { cls: "cdd-shown", id: "cdd-shown", role: "status" });
    var clear = el("button", { type: "button", cls: "cmn-word", id: "cdd-all", text: "Show all colleges" });
    clear.addEventListener("click", function () { pick("all"); });
    list.appendChild(el("div", { cls: "cdd-tools" }, [el("label", { "for": "cdd-q", cls: "cdd-label", text: "Find a college or district" }), search, shown, S.filter !== "all" || S.platform || S.district ? clear : null]));
    /* The order in words, above the list, announced when it changes (role status). */
    var sortLine = el("p", { cls: "cdd-sortline", id: "cdd-sortline", role: "status" });
    list.appendChild(sortLine);
    var plats = platformControl(M);
    if (plats) list.appendChild(plats);
    var body = el("tbody");
    var head = el("tr");
    var table = el("table", { cls: "cdd-table", id: "cdd-colleges" }, [
      el("caption", { cls: "cdd-sr", text: "Each college: its overall completeness (live read), its courses with SLOs and with objectives (live read), its collected program requirements, programs still to pass, last read, read cost and confidence" }),
      el("colgroup", null, [el("col", { cls: "cdd-c-name" }), el("col", { cls: "cdd-c-ov" }), el("col", { cls: "cdd-c-out" }), el("col", { cls: "cdd-c-pr" }), el("col", { cls: "cdd-c-gap" }), el("col", { cls: "cdd-c-read" }), el("col", { cls: "cdd-c-cost" }), el("col", { cls: "cdd-c-conf" })]),
      el("thead", null, [head]), body
    ]);
    function drawHead() {
      head.textContent = "";
      COLUMNS.forEach(function (col) {
        if (col.nosort) { head.appendChild(el("th", { scope: "col", text: col.label })); return; }
        var on = S.sort.k === col.k;
        /* The default order is no click of the person's: a first click on its column starts their own sort, low first. */
        var mine = on && !S.sort.auto && !S.sort.card;
        var b = el("button", { type: "button", cls: "cmn-word cdd-sort", "data-sort": col.k, text: col.label });
        if (on) b.appendChild(el("span", { cls: "cdd-dir", text: " (" + (col.k === "name" ? SORT_WORDS[String(S.sort.d)].name : SORT_WORDS[String(S.sort.d)].other) + ")" }));
        b.addEventListener("click", function () {
          S.sort = { k: col.k, d: mine ? -S.sort.d : col.d0 };
          drawHead(); drawBody();
          /* The header row is drawn again: the focus returns to the same column's new word, never to the body. */
          var again = head.querySelector('button.cdd-sort[data-sort="' + col.k + '"]');
          if (again && again.focus) again.focus();
        });
        head.appendChild(el("th", { scope: "col", "aria-sort": on ? (S.sort.d === 1 ? "ascending" : "descending") : "none" }, [b]));
      });
    }
    function drawBody() {
      body.textContent = "";
      var base = listFor(M, S.filter).filter(function (c) { return (!S.platform || c.platform === S.platform) && (!S.district || (c.district && districtSlug(c.district) === S.district)); }),
        L = sorted(M, searched(base));
      L.forEach(function (c) {
        body.appendChild(row(M, c, VIEW.now));
        if (String(S.open) === String(c.id)) body.appendChild(detail(M, c, VIEW.now));
      });
      if (!L.length) body.appendChild(el("tr", null, [el("td", { colspan: String(COLUMNS.length), text: "No college matches." })]));
      shown.textContent = "Showing " + fmt(L.length) + " of " + fmt(M.colleges.length) + (S.filter !== "all" ? ": " + FILTERS[S.filter].word : "")
        + (S.platform ? (S.filter !== "all" ? "; " : ": ") + "catalog platform " + platformWord(S.platform) : "")
        + (S.district ? (S.filter !== "all" || S.platform ? "; " : ": ") + districtName(M, S.district) : "");
      /* Set only when the words change, so typing in the search never re-announces the order. */
      var sw = sortWords(M);
      if (sortLine.textContent !== sw) sortLine.textContent = sw;
    }
    search.addEventListener("input", function () { S.q = search.value || ""; drawBody(); });
    VIEW.drawBody = drawBody;
    drawHead(); drawBody();
    list.appendChild(el("div", { cls: "cdd-wrap", role: "region", "aria-label": "Colleges", tabindex: "0" }, [table]));
    wrap.appendChild(list);
    wrap.appendChild(notes(M));
    wrap.appendChild(comingNext(M));
    var page = el("div", { cls: "cmn-page" }, [wrap, panelShell()]);   // the panel beside the wrapper, which goes inert while it is open
    root.appendChild(page);
    drawPanel(VIEW.now);
    if (fixCause) setAddress();
    return page;
  }

  /* The three views of the dashboard, as words: the list, the dictionary, the checklist. */
  function viewNav() {
    var items = [["", "The college list"], ["districts", VIEWS.districts], ["slos", VIEWS.slos], ["dictionary", VIEWS.dictionary], ["apis", VIEWS.apis]];
    return el("nav", { cls: "cdd-views", "aria-label": "College Data Collection views" }, items.map(function (it) {
      var on = (S.view || "") === it[0];
      var a = el("a", { href: "#commons/data" + (it[0] ? "/" + it[0] : ""), cls: "cdd-viewword", "data-goto": it[0] || "list", "aria-current": on ? "page" : null, text: it[1] });
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;   // a new window opens the address itself
        e.preventDefault(); go(it[0]);
      });
      return a;
    }));
  }
  /* The list's catalog platform filter: each platform the captures read, as a word with its count; it lives only in
     the address and the visit. */
  function platformControl(M) {
    /* Each word's figure counts within the active filter, the list it opens; the chosen word stays even at zero. */
    var P = platformsOf(M, S.filter);
    if (S.platform && !P.some(function (p) { return p[0] === S.platform; })) P.push([S.platform, 0]);
    if (!P.length) return null;
    var kids = [el("span", { cls: "cdd-label", id: "cdd-plat-l", text: "Catalog platform" })];
    [["", "Any", null]].concat(P.map(function (p) { return [p[0], platformWord(p[0]), p[1]]; })).forEach(function (p) {
      var b = el("button", { type: "button", cls: "cmn-word cdd-plat", "data-platform": p[0] || "any", "aria-pressed": S.platform === p[0] ? "true" : "false",
        text: p[1] + (p[2] != null ? " (" + fmt(p[2]) + ")" : "") });
      b.addEventListener("click", function () { choosePlatform(p[0]); });
      kids.push(b);
    });
    return el("div", { cls: "cdd-plats", role: "group", "aria-labelledby": "cdd-plat-l" }, kids);
  }
  function choosePlatform(key) {
    if (!VIEW.root || !VIEW.M) return;
    var y = window.scrollY;
    render(VIEW.root, VIEW.M, listRoute(S.filter, key, S.district).replace(/^\//, ""));
    setAddress();
    try { if (window.scrollTo && y) window.scrollTo(0, y); } catch (e) { /* jsdom */ }
    var b = VIEW.root.querySelector('.cdd-plat[data-platform="' + (key || "any") + '"]');
    if (b && b.focus) b.focus();
  }
  /* Another view of the dashboard: drawn at once, its address replacing the last; the panel never follows. */
  function go(view) {
    if (!VIEW.root || !VIEW.M) return;
    render(VIEW.root, VIEW.M, view || "");
    setAddress();
    try { if (window.scrollTo && window.scrollY) window.scrollTo(0, 0); } catch (e) { /* jsdom */ }
    var h = VIEW.root.querySelector("#cdd-h");
    if (h) { h.setAttribute("tabindex", "-1"); if (h.focus) h.focus(); }
  }

  /* Text from the dictionary doc, drawn as text: a `code span` becomes <code>, a *mark* loses its asterisks. Nothing
     from the file is ever parsed as HTML. */
  function docText(tag, s, cls) {
    var e = el(tag, cls ? { cls: cls } : null);
    String(s == null ? "" : s).split("`").forEach(function (part, i) {
      if (!part) return;
      e.appendChild(i % 2 ? el("code", { text: part }) : document.createTextNode(part.replace(/\*([^*]+)\*/g, "$1")));
    });
    return e;
  }
  function evidenceWord(s) {
    var p = String(s || "").split("::");
    return p.length > 1 ? p[0] + ", at " + p.slice(1).join(" ").replace(/^#+\s*/, "") : p[0];
  }
  /* Evidence in kinds, said apart: what the repo holds and a reader can check, what the doc family only cites, and
     what is named but missing. */
  function evidenceBits(x) {
    var cited = Array.isArray(x.evidence_cited) ? x.evidence_cited : [], missing = Array.isArray(x.evidence_missing) ? x.evidence_missing : [];
    var repo = (Array.isArray(x.evidence) ? x.evidence : []).filter(function (e) { return cited.indexOf(e) < 0 && missing.indexOf(e) < 0; });
    var out = [];
    function group(title, kind, L) {
      out.push(el("div", { cls: "cdd-ev", "data-evidence": kind }, [el("p", { cls: "cdd-partname", text: title + " (" + fmt(L.length) + ")" }),
        L.length ? el("ul", { cls: "cdd-srcs" }, L.map(function (e) { return el("li", { text: evidenceWord(e) }); })) : el("p", { cls: "cdd-of", text: "None." })]));
    }
    group("Verifiable in the repo", "repo", repo);
    group("Cited, outside the repo's checks", "cited", cited);
    if (missing.length) group("Named but not found in the repo", "missing", missing);
    return out;
  }
  function unverifiedWords(x) {
    var w = [];
    if (x.repo_verifiable === false) w.push("Unverified: nothing in the repo outside the doc family backs this entry.");
    if (x.unverified_claims) w.push(fmt(x.unverified_claims) + " claim" + (x.unverified_claims === 1 ? " in this entry is" : "s in this entry are") + " marked unverified in the doc.");
    return w.join(" ");
  }
  var GITHUB = GITHUB_REPO + "blob/main/";
  function dictionaryView(M) {
    var D = M.dictionary || {}, L = Array.isArray(D.datasets) ? D.datasets : [];
    var sec = el("section", { cls: "cdd-view", id: "cdd-dict", "aria-labelledby": "cdd-h" });
    if (!L.length) { sec.appendChild(tba("The data dictionary is not in the file yet.")); return sec; }
    var groups = [];
    L.forEach(function (x) { if (groups.indexOf(x.group || "Other") < 0) groups.push(x.group || "Other"); });
    var src = String(D.source || "docs/reference/data_dictionary.md");
    sec.appendChild(el("p", { cls: "cdd-src" }, ["Parsed from ", paneWord(src.split("#")[0], { k: "source", a: "dictionary" }, null),
      " by the College Data Collection builder: " + fmt(L.length) + " datasets in " + fmt(groups.length) + " groups, as the doc groups them."]));
    if (Array.isArray(D.errors) && D.errors.length) sec.appendChild(el("p", { cls: "cdd-state", text: "The builder could not read all of the doc: " + D.errors.join("; ") }));
    groups.forEach(function (g) {
      var gid = "cdd-dg-" + slugOf({ name: g });
      /* The doc's group "Harvested" reads Collected on the page (Sam, Nov 13, #3229); the doc keeps its own word. */
      var gs = el("section", { cls: "cdd-dgroup", "data-group": g, "aria-labelledby": gid }, [el("h3", { cls: "cdd-h3", id: gid, text: g === "Harvested" ? "Collected" : g })]);
      L.filter(function (x) { return (x.group || "Other") === g; }).forEach(function (x) {
        var uv = unverifiedWords(x);
        gs.appendChild(el("article", { cls: "cdd-entry", "data-dataset": x.name, "aria-label": x.name }, [
          el("h4", { text: x.name }),
          uv ? el("p", { cls: "cdd-unv", "data-unverified": "true", text: uv }) : null,
          el("dl", { cls: "cdd-dl" }, [el("dt", { text: "Stage" }), el("dd", { text: x.stage || "TBA" }), el("dt", { text: "Owner or steward" }), docText("dd", x.owner || "TBA"),
            el("dt", { text: "How we get it today" }), docText("dd", x.procedure_today || "TBA"), el("dt", { text: "Planned improvement" }), docText("dd", x.planned_improvement || "TBA")]),
          x.link ? el("p", { cls: "cdd-of" }, [paneWord("The entry in the data dictionary", { k: "entry", a: slugOf({ name: x.name }) }, null)]) : null
        ].concat(evidenceBits(x))));
      });
      sec.appendChild(gs);
    });
    return sec;
  }
  var API_WORDS = { connected: "connected", "in progress": "in progress", in_progress: "in progress", configured: "in progress", "in talks": "in progress",
    planned: "planned", "not needed": "not needed", unverified: "unverified" };
  function apiStatus(r) {
    if (r.status === "unverified") return "unverified";
    if (r.needed === "no" && r.status !== "connected") return "not needed";
    return API_WORDS[r.status] || "unverified";
  }
  function apisView(M) {
    var a = apiCount(M), sec = el("section", { cls: "cdd-view", id: "cdd-apis", "aria-labelledby": "cdd-h" });
    if (!a.rows.length) { sec.appendChild(tba("The API checklist is not in the file yet.")); return sec; }
    sec.appendChild(el("p", { cls: "cdd-stamp", id: "cdd-api-sum" }, [el("strong", { text: fmt(a.connected) + " of " + fmt(a.need) + " connected. " }),
      "Connected, of the APIs a connection is needed for. A status reads unverified when the repo holds no evidence for it beyond the doc family's citation; an unverified API never counts as connected. Parsed from ",
      paneWord("the checklist in the data dictionary", { k: "source", a: "apis" }, null), "."]));
    var NEED = { yes: "Needed", no: "Not needed", unknown: "Unknown" };
    var body = el("tbody", null, a.rows.map(function (r) {
      var st = apiStatus(r);
      return el("tr", { "data-api": r.api, "data-status": st }, [
        el("th", { scope: "row", "data-label": "API" }, [el("span", { cls: "cdd-name", text: r.api }), r.priority ? el("span", { cls: "cdd-of", text: "Priority" }) : null, r.note ? docText("span", r.note, "cdd-of") : null]),
        el("td", { "data-label": "Who holds it", text: r.holder || "TBA" }),
        el("td", { "data-label": "Connection needed", text: NEED[r.needed] || "Unknown" }),
        el("td", { "data-label": "Status" }, [el("span", { cls: "cdd-level", text: cap(st) }),
          st === "unverified" && r.claimed ? el("span", { cls: "cdd-of", text: "Claimed " + words(r.claimed) + "; no evidence for it in the repo" }) : null]),
        el("td", { "data-label": "Evidence" }, evidenceBits(r))
      ]);
    }));
    var table = el("table", { cls: "cdd-table cdd-apitable", id: "cdd-api-table" }, [
      el("caption", { cls: "cdd-sr", text: "Each API: who holds it, whether a connection is needed, its status and its evidence" }),
      el("colgroup", null, [el("col", { cls: "cdd-c-api" }), el("col", { cls: "cdd-c-holder" }), el("col", { cls: "cdd-c-need" }), el("col", { cls: "cdd-c-status" }), el("col", { cls: "cdd-c-ev" })]),
      el("thead", null, [el("tr", null, ["API", "Who holds it", "Connection needed", "Status", "Evidence"].map(function (h) { return el("th", { scope: "col", text: h }); }))]), body]);
    sec.appendChild(el("div", { cls: "cdd-wrap", role: "region", "aria-label": "The API checklist", tabindex: "0" }, [table]));
    return sec;
  }

  /* The district roll-up (S648, a planned item whose source exists: each college's district is in the crosswalk the
     builder reads). Each figure is summed from that district's colleges, the same figures the college list shows; the
     district's name is the word that opens the list searched to its colleges. Nothing is stored. */
  function districtRows(M) {
    var by = {};
    M.colleges.forEach(function (c) {
      var k = c.district || "No district on file";
      var d = by[k] || (by[k] = { name: k, none: !c.district, colleges: 0, collected: 0, programs: 0, passing: 0, ov: [], levels: {} });
      d.colleges++;
      if (c.harvested) { d.collected++; d.programs += c.programs || 0; d.passing += c.passing || 0; }
      var o = overallOf(M, c); if (o) d.ov.push(o.value);
      if (level(c)) d.levels[level(c)] = (d.levels[level(c)] || 0) + 1;
    });
    return Object.keys(by).map(function (k) {
      var d = by[k]; d.mean = d.ov.length ? d.ov.reduce(function (a, b) { return a + b; }, 0) / d.ov.length : null; return d;
    });
  }
  function districtsView(M) {
    var sec = el("section", { cls: "cdd-view", id: "cdd-districts", "aria-labelledby": "cdd-h" });
    var R = districtRows(M).sort(function (a, b) {
      var x = a.mean == null ? 2 : a.mean, y = b.mean == null ? 2 : b.mean;
      return x - y || a.name.localeCompare(b.name);
    });
    sec.appendChild(el("p", { cls: "cdd-sortline", id: "cdd-dist-sum", text: fmt(R.length) + " districts, lowest overall completeness first (" + (liveRead(M) ? liveWords(M) : "the live read has not run yet") +
      "); a district the live read does not hold comes last. A district's name opens the college list at its colleges." }));
    var body = el("tbody", null, R.map(function (d) {
      /* The name opens exactly its colleges (the district is in the address, district/<slug>); the bucket of colleges
         with no district has no address, so it stays plain text. */
      var w = d.none ? el("span", { cls: "cdd-name", text: d.name })
        : el("button", { type: "button", cls: "cmn-word cdd-name", "data-district": d.name, text: d.name });
      if (!d.none) w.addEventListener("click", function () { openDistrict(d.name); });
      var lv = ["limited", "partial", "strong"].filter(function (k) { return d.levels[k]; }).map(function (k) { return k + " " + fmt(d.levels[k]); }).join(", ");
      return el("tr", { "data-district-row": d.name }, [
        el("th", { scope: "row", "data-label": "District" }, [w]),
        el("td", { "data-label": "Colleges", cls: "cdd-num", text: fmt(d.colleges) }),
        el("td", { "data-label": "Collected", cls: "cdd-num", text: fmt(d.collected) + " of " + fmt(d.colleges) }),
        el("td", { "data-label": "Program requirements passing" }, d.programs ? [el("span", { cls: "cdd-pr" }, [meter(d.passing / d.programs), el("span", { cls: "cdd-n", text: pc(d.passing / d.programs) }),
          el("span", { cls: "cdd-of", text: fmt(d.passing) + " of " + fmt(d.programs) + " listed programs" })])] : [el("span", { cls: "cdd-quiet", text: "Not collected yet" })]),
        el("td", { "data-label": "Overall, mean of its colleges" }, d.mean == null ? [el("span", { cls: "cdd-quiet", text: liveRead(M) ? "Not in the live read" : "TBA" })]
          : [el("span", { cls: "cdd-pr" }, [meter(d.mean), el("span", { cls: "cdd-n", text: pc(d.mean) }), el("span", { cls: "cdd-of", text: "Of " + plural(d.ov.length, "college", "colleges") })])]),
        el("td", { "data-label": "Confidence" }, [lv ? cap(lv) : el("span", { cls: "cdd-quiet", text: "TBA" })])
      ]);
    }));
    var table = el("table", { cls: "cdd-table", id: "cdd-dist-table" }, [
      el("caption", { cls: "cdd-sr", text: "Each district: its colleges, how many are collected, program requirements passing, the mean overall bar, and the confidence levels of its colleges" }),
      el("colgroup", null, [el("col", { cls: "cdd-c-dname" }), el("col", { cls: "cdd-c-dn" }), el("col", { cls: "cdd-c-dcol" }), el("col", { cls: "cdd-c-dpr" }), el("col", { cls: "cdd-c-dov" }), el("col", { cls: "cdd-c-dconf" })]),
      el("thead", null, [el("tr", null, ["District", "Colleges", "Collected", "Program requirements passing", "Overall, mean of its colleges", "Confidence"].map(function (h) { return el("th", { scope: "col", text: h }); }))]), body]);
    sec.appendChild(el("div", { cls: "cdd-wrap", role: "region", "aria-label": "Colleges by district", tabindex: "0" }, [table]));
    return sec;
  }

  /* A district's colleges: the list at #commons/data/district/<slug>, the search cleared, the focus on its heading. */
  function openDistrict(name) {
    if (!VIEW.root || !VIEW.M) return;
    S.q = "";
    render(VIEW.root, VIEW.M, "district/" + districtSlug(name));
    setAddress();
    try { if (window.scrollTo && window.scrollY) window.scrollTo(0, 0); } catch (e) { /* jsdom */ }
    var h = VIEW.root.querySelector("#cdd-list-h");
    if (h && h.focus) h.focus();
  }

  /* What the mock shows beyond these views, each in one line with what it waits on: the builder's own reason where
     the file holds one, and the dictionary's stage where the doc names the dataset. No empty panel. */
  function comingNext(M) {
    var D = Array.isArray((M.dictionary || {}).datasets) ? M.dictionary.datasets : [];
    function stage(name) { var x = D.filter(function (d) { return d.name === name; })[0]; return x && x.stage ? " Dictionary stage: " + x.stage + "." : ""; }
    var items = [
      ["The College view", "Internal only: one college's page in plain words, drawn from the fields the builder flags shareable. It waits on Sam's review; it has no share link and nothing goes to a college."],
      ["AI workers per college", "Waits on a committed record of each worker and the colleges it serves; the district bots wait on the district profiles (#3198)."],
      /* Sam, Nov 13, 7:13 AM PT, on #3229: a long-term direction, recorded here and not built. */
      ["A signed-in Sierra where college staff may direct changes", "College staff could give directions for procedure and rule changes that improve the accuracy, completeness, connectivity and visibility of their college's collection. Waits on Sierra's sign-in and access controls; a long-term direction, not built in this slice."],
      /* S649: each cause opens its programs, and each program its own catalog page; what remains is the registry's. */
      ["Curriculum view and pathway source links per college", "The live registry says whether each is held, never its address. Waits on the live read carrying the links themselves; the catalog the capture read opens from the row, and each program still to pass opens its own catalog page from its cause."],
      ["The JST funnel",(tbaOf(M, "jst") || "Waits on an authorized-student feed.") + stage("JST authorizations")],
      ["SIS and curriculum system tiles", "Wait on the district profiles (#3198); a college's system stays unknown until its profile names it."],
      ["Program Pathways Mapper reads per college", (tbaOf(M, "ppm") || "Waits on a per-college read of the committed term maps.") + stage("Program Pathways Mapper (PPM)")],
      ["Course descriptions per college", (tbaOf(M, "descriptions") || "Waits on the description classifier's counts (#3219).") + stage("Course descriptions")],
      ["MIS course matches per college", (tbaOf(M, "mis") || "Waits on a join of the committed MIS course file to each college.") + stage("COMIS / MIS data")],
      ["COE regional demand per college", (tbaOf(M, "coe") || "Waits on a per-college read of the regional crosswalk.") + stage("COE labor market data")]
    ];
    var planned = D.filter(function (d) { return d.group === "Planned"; });
    if (planned.length) items.push(["Planned datasets", "Each waits on a connection, at its dictionary stage: " + planned.map(function (d) { return d.name + " (" + (d.stage || "TBA") + ")"; }).join("; ") + "."]);
    return el("section", { cls: "cdd-notes cdd-next", id: "cdd-next", "aria-labelledby": "cdd-next-h" }, [
      el("h3", { id: "cdd-next-h", cls: "cdd-h3", text: "Coming next" }),
      el("ul", null, items.map(function (it) { return el("li", { "data-next": it[0] }, [el("strong", { text: it[0] + ". " }), it[1]]); }))
    ]);
  }

  function notes(M) {
    var R = M.rule || {}, items = [];
    if (R.basis) items.push("Basis: " + R.basis + ".");
    if (R.passing) items.push("Passing: " + R.passing + ".");
    var O = M.overall || {}, LR = (M.live || {}).rule || {};
    if (O.rule || R.overall) items.push("Overall (basis live): " + (O.rule || R.overall) + ".");
    items.push("Live read: " + (liveRead(M) ? cap(liveWords(M)) + "." + (keptWords(M) ? " " + keptWords(M) : "") : liveReason(M)));
    if (LR.registry) items.push("Registry: a link reads held when the registry records one, since it records a link only when one is seen.");
    if (R.confidence) items.push("Confidence: " + R.confidence + ".");
    if (R.age_days) items.push("Age: fresh within " + R.age_days.fresh + " days, recent within " + R.age_days.recent + ", stale after.");
    var src = Object.keys(M.sources).map(function (k) { return M.sources[k]; });
    return el("section", { cls: "cdd-notes", id: "cdd-notes", "aria-labelledby": "cdd-notes-h" }, [
      el("h3", { id: "cdd-notes-h", cls: "cdd-h3", text: "How these figures are read" }),
      el("ul", null, items.map(function (t) { return el("li", { text: t }); })),
      el("p", { cls: "cdd-src", text: "Sources: " + src.join("; ") + "." }),
      el("p", { cls: "cdd-src", text: "A college's name opens its row: each dataset the committed files hold for it, with its bar, its date and its open gaps. The row opens the same college in a side panel, with every dataset College Data Collection tracks; one with no committed source reads TBA and says why." })
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
    /* All colleges has no card since #3229: the focus goes to the list's heading, never lost to the body. */
    var t = VIEW.root.querySelector('.cdd-tiles [data-filter="' + S.filter + '"]') || VIEW.root.querySelector("#cdd-list-h");
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
    /* A session renewal mid-visit (opts.keep) draws the view as it stands: the person's own sort and search last the
       visit. A new visit starts fresh: nothing is remembered, the order back to its default. */
    var keep = opts.keep ? { q: S.q, sort: S.sort && !S.sort.auto && !S.sort.card ? S.sort : null } : null;
    S.q = ""; S.filter = ""; S.view = ""; S.platform = ""; S.district = ""; S.sort = null; S.open = null; S.panel = null; S.pw = PW.start;
    if (keep) { S.q = keep.q || ""; S.sort = keep.sort; }
    if (VIEW.M && cache) { render(root, VIEW.M, filter, new Date()); focusArrival(); return Promise.resolve(VIEW.M); }
    root.textContent = "Reading the " + TITLE + "…";
    cache = cache || load();
    return cache.then(function (M) {
      render(root, M, filter, new Date());
      focusArrival();
      return M;
    }, function (e) {
      cache = null;
      root.textContent = "The " + TITLE + " could not be read (" + (e && e.message ? e.message : e) + "). Reload the tab to try again.";
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
    /* Issue 3229: a completeness figure's confidence, in words, beside it; a card of several counts, each a word. */
    ".cdd-conf { display:block; font-size:.84rem; font-weight:600; color:var(--cmn-ink-2); line-height:1.4; }",
    ".cdd-pr .cdd-conf { grid-column:1 / -1; }",
    ".cdd-vparts { display:block; font-size:1.2rem; line-height:1.35; }",
    ".cdd-vparts button.cdd-partw { display:inline-block; min-height:24px; font-family:var(--cmn-serif); font-size:1.2rem; font-weight:700; line-height:1.3; }",
    ".cdd-vparts button.cdd-partw[aria-pressed=\"true\"] { color:var(--cmn-heading); text-decoration-thickness:3px; }",
    ".cdd-vparts .cdd-partz { font-family:var(--cmn-serif); font-size:1.2rem; font-weight:700; line-height:1.3; color:var(--cmn-muted); }",
    "button.cdd-openw[aria-pressed=\"true\"] { color:var(--cmn-heading); text-decoration-thickness:3px; }",
    ".cdd-list > .cdd-h3:focus { outline:none; } .cdd-list > .cdd-h3:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; }",
    ".cdd-list { display:grid; gap:12px; }",
    ".cdd-h3 { margin:0; font-family:var(--cmn-serif); font-size:1.25rem; color:var(--cmn-heading); }",
    ".cdd-tools { display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; }",
    ".cdd-label { font-weight:700; color:var(--cmn-heading); }",
    ".cdd-q { font:inherit; min-height:32px; flex:1 1 14rem; min-width:0; max-width:28rem; padding:4px 8px; border:1px solid var(--cmn-muted); border-radius:6px; background:var(--cmn-surface); color:var(--cmn-ink); }",
    ".cdd-q:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cdd-shown { margin:0; color:var(--cmn-muted); font-size:.9rem; font-variant-numeric:tabular-nums; }",
    ".cdd-sortline { margin:0; color:var(--cmn-ink-2); font-size:.9rem; max-width:var(--cpl-measure,none); }",
    ".cdd-wrap { container:cddlist / inline-size; overflow-x:auto; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; }",
    ".cdd-wrap:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cdd-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:.93rem; }",
    ".cdd-table th, .cdd-table td { text-align:left; vertical-align:top; padding:9px 12px; border-bottom:1px solid var(--cmn-line-soft); color:var(--cmn-ink); overflow-wrap:break-word; }",
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
    ".cdd-c-name { width:16%; } .cdd-c-ov { width:12%; } .cdd-c-out { width:13%; } .cdd-c-pr { width:16%; } .cdd-c-gap { width:7%; } .cdd-c-read { width:11%; } .cdd-c-cost { width:10%; } .cdd-c-conf { width:15%; }",
    /* Sam, in session, S649: "use the full width of the window"; prose keeps its measure (--cpl-measure). */
    ".cmn-wrap.cdd { max-width:none; }",
    "td.cdd-outs { } td.cdd-outs .cdd-pr + .cdd-pr { margin-top:4px; }",
    ".cdd-c-sname { width:30%; } .cdd-c-sn { width:15%; } .cdd-c-sact { width:24%; } .cdd-c-sat { width:16%; }",
    ".cdd-paneacts { display:flex; flex-wrap:wrap; gap:8px 18px; align-items:center; margin:0; }",
    ".cdd-paneacts a.cdd-newtab { color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; min-height:24px; display:inline-flex; align-items:center; }",
    ".cdd-panel h3 { margin:12px 0 4px; font-size:1rem; color:var(--cmn-heading); }",
    ".cdd-plos { display:grid; gap:6px; } details.cdd-plo summary { cursor:pointer; min-height:24px; color:var(--cmn-ink); }",
    "details.cdd-plo ol { margin:4px 0 6px; padding-left:22px; display:grid; gap:4px; font-size:.9rem; color:var(--cmn-ink-2); }",
    ".cdd-dsword { margin-top:6px; } .cdd-dsword button + button { margin-left:12px; }",
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
    /* S648: columns, so the short cards stack beside the long Program requirements card instead of each grid row
       taking the height of its tallest card; at most three, each at least 16rem, one under that. */
    ".cdd-ds { columns:3 16rem; column-gap:10px; }",
    ".cdd-card { min-width:0; display:grid; gap:4px; align-content:start; break-inside:avoid; margin:0 0 10px; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:10px; padding:10px 12px; }",
    "table.cdd-causes { width:100%; border-collapse:collapse; font-size:.86rem; table-layout:auto; }",
    "table.cdd-causes caption { text-align:left; font-weight:700; font-size:.84rem; color:var(--cmn-ink-2); padding:4px 0 2px; }",
    "table.cdd-causes th, table.cdd-causes td { text-align:left; vertical-align:top; padding:2px 0; border-bottom:1px solid var(--cmn-line-soft); font-weight:400; color:var(--cmn-ink); overflow-wrap:break-word; }",
    "table.cdd-causes thead th { color:var(--cmn-muted); font-size:.8rem; font-weight:700; }",
    "table.cdd-causes .cdd-num { text-align:right; padding-left:12px; width:1%; }",
    /* Each cause's programs (S649): the cause word wraps like prose; the open one carries the pressed weight. */
    "table.cdd-causes button.cdd-cause { min-height:24px; text-align:left; font-size:inherit; overflow-wrap:break-word; }",
    "table.cdd-causes tr.cdd-on button.cdd-cause { text-decoration-thickness:3px; color:var(--cmn-heading); font-weight:700; }",
    ".cdd-causebox > .cdd-of { margin:4px 0 0; font-size:.82rem; }",
    ".cdd-cprogs { margin-top:10px; padding-top:8px; border-top:1px solid var(--cmn-line); min-width:0; }",
    ".cdd-cprogs h4 { margin:0 0 6px; }",
    "ul.cdd-progs { margin:0; padding-left:20px; display:grid; gap:8px; font-size:.9rem; color:var(--cmn-ink); }",
    "ul.cdd-progs > li { min-width:0; overflow-wrap:anywhere; }",
    "ul.cdd-progs > li > .cdd-of { display:block; font-size:.82rem; }",
    ".cdd-srcrow { margin:0; display:flex; flex-wrap:wrap; gap:2px 16px; font-size:.88rem; }",
    /* A link's text is a long path or address: it may break anywhere, or it widens the opened row past the list's box
       at phone width (the PR review, S648: 117 of 118 rows at 320 with break-word; 0 with anywhere). */
    ".cdd a[target] { overflow-wrap:anywhere; }",
    ".cdd-card h4, .cdd-gapbox h4, .cdd-pds h4 { margin:0; font-size:.95rem; color:var(--cmn-heading); }",
    ".cdd-state { margin:0; font-weight:700; color:var(--cmn-heading); }",
    ".cdd-card .cdd-of, .cdd-panel .cdd-of { margin:0; }",
    /* S648, Sam's Skyline screenshot: the label column was minmax(0, auto), which grows to a long label's full width
       before the value column gets any, and the value inherited overflow-wrap:anywhere, so 144 broke one digit a line.
       Now the label takes the rest and wraps at its words; the value column sizes to its content (capped at 60%, where
       a long value wraps at its words) and a figure never breaks (cdd-ddn: nowrap). */
    "dl.cdd-dl { margin:0; display:grid; grid-template-columns:minmax(0, 1fr) fit-content(60%); gap:2px 12px; font-size:.86rem; }",
    "dl.cdd-dl dt { color:var(--cmn-muted); overflow-wrap:break-word; } dl.cdd-dl dd { margin:0; min-width:0; color:var(--cmn-ink); font-variant-numeric:tabular-nums; overflow-wrap:break-word; }",
    "dl.cdd-dl dd.cdd-ddn { white-space:nowrap; text-align:right; }",
    ".cdd-n, .cdd-num, .cdd-nowrap { white-space:nowrap; }",
    ".cdd-stampline { display:block; font-size:.84rem; color:var(--cmn-muted); }",
    ".cdd-part { display:grid; gap:2px; padding-top:4px; }",
    ".cdd-partname { margin:0; font-size:.84rem; font-weight:700; color:var(--cmn-ink-2); }",
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
    /* slice 3: the live basis, the views, the platform words, the dictionary and the API checklist */
    ".cdd-stamp-live { display:block; margin-top:6px; }",
    ".cdd-basis { margin:0; font-size:.84rem; font-weight:600; color:var(--cmn-ink-2); }",
    ".cdd-views { display:flex; flex-wrap:wrap; gap:4px 20px; }",
    ".cdd-views a { display:inline-block; min-height:24px; line-height:24px; color:var(--cmn-link); font-weight:600; text-decoration:underline; text-underline-offset:3px; }",
    ".cdd-views a[aria-current=\"page\"] { color:var(--cmn-heading); text-decoration-thickness:3px; }",
    ".cdd-plats { display:flex; flex-wrap:wrap; align-items:center; gap:4px 14px; }",
    "button.cdd-plat[aria-pressed=\"true\"] { color:var(--cmn-heading); text-decoration-thickness:3px; }",
    ".cdd-view { display:grid; gap:14px; min-width:0; }",
    ".cdd-dgroup { display:grid; gap:10px; min-width:0; }",
    ".cdd-view > *, .cdd-dgroup > *, .cdd-entry > *, .cdd-notes li { min-width:0; overflow-wrap:anywhere; }",
    ".cdd-entry { display:grid; gap:6px; min-width:0; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:12px 16px; }",
    ".cdd-entry h4 { margin:0; font-size:1rem; color:var(--cmn-heading); }",
    ".cdd-unv { margin:0; font-weight:700; color:var(--cmn-ask-label); }",
    ".cdd-ev { display:grid; gap:2px; }",
    /* The API checklist's evidence paths break anywhere, so its table never scrolls sideways (the PR review, S648). */
    ".cdd-ev, .cdd-ev > *, ul.cdd-srcs > li { min-width:0; overflow-wrap:anywhere; }",
    /* A dictionary entry's labels are short words beside long prose: the prose takes the rest of the width. */
    ".cdd-entry dl.cdd-dl { grid-template-columns:max-content minmax(0, 1fr); }",
    ".cdd code { font-size:.86em; overflow-wrap:anywhere; }",
    ".cdd-c-dname { width:26%; } .cdd-c-dn { width:9%; } .cdd-c-dcol { width:11%; } .cdd-c-dpr { width:20%; } .cdd-c-dov { width:18%; } .cdd-c-dconf { width:16%; }",
    ".cdd-c-api { width:28%; } .cdd-c-holder { width:18%; } .cdd-c-need { width:11%; } .cdd-c-status { width:13%; } .cdd-c-ev { width:30%; }",
    ".cdd-apitable .cdd-ev .cdd-partname { font-size:.8rem; }",
    "@media (prefers-reduced-motion: no-preference) { .cdd-grip::after { transition:background-color .15s ease; } }",
    "@media (prefers-reduced-motion: no-preference) { button.cdd-tile { transition:background-color .15s ease; } }",
    /* One column under 560px: each college becomes a block with its labels, and the sort words wrap above. */
    /* S648: the list's table is a block per college whenever its own box is under 760px (a container query), so a
       narrow main column beside the side menu never squeezes a figure or a heading word to one character a line. */
    "@container cddlist (max-width: 760px) {",
    "  .cdd-table, .cdd-table > tbody, .cdd-table > tbody > tr, .cdd-table > tbody > tr > td, .cdd-table > tbody > tr > th { display:block; width:auto; }",
    "  .cdd-table > colgroup { display:none; }",
    "  .cdd-table > thead > tr { display:flex; flex-wrap:wrap; gap:4px 14px; padding:10px 12px; border-bottom:1px solid var(--cmn-line); }",
    "  .cdd-table > thead > tr > th { display:block; padding:0; border:0; }",
    "  .cdd-table > tbody > tr { padding:10px 12px; border-bottom:1px solid var(--cmn-line); }",
    "  .cdd-table > tbody > tr > th, .cdd-table > tbody > tr > td { padding:3px 0; border:0; }",
    "  .cdd-table > tbody > tr > td::before { content:attr(data-label); display:block; font-size:.78rem; font-weight:700; color:var(--cmn-muted); }",
    "  .cdd-table > tbody > tr > td:empty { display:none; }",
    "  .cdd-table tr.cdd-more > td::before { content:none; }",
    "}",
    "@media (max-width: 560px) {",
    "  .cdd-entry dl.cdd-dl { grid-template-columns:minmax(0, 1fr); } .cdd-entry dl.cdd-dl dd { margin-bottom:6px; }",
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
    datasets: datasets, gaps: gaps, asks: asks, apiCount: apiCount, parseRouteViews: VIEWS, go: go, slugOf: slugOf, parseRoute: parseRoute, openPanel: openPanel, closePanel: closePanel, PW: PW,
    FILE: FILE, FILTERS: FILTERS, COLUMNS: COLUMNS, CSS: CSS, _state: S,
    _reset: function () { cache = null; VIEW.M = null; S.filter = "all"; S.view = ""; S.platform = ""; S.district = ""; S.q = ""; S.sort = null; S.open = null; S.panel = null; S.cause = null; S.pane = null; S.pw = PW.start; PROGS = {}; OUTS = {}; }
  };
})();
