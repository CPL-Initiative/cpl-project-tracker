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
// and the canonical SUBJ file. A catalog that prints the code alone reads TBA for its title. Beside a row with no
// title or no common code it shows the recommendation kb/status/local_subject_recommendations.json holds for it.
//
// Addresses (loaded by commons.js when the address names it): #commons/subjects (every college),
// #commons/subjects/noncredit (the draft noncredit subject title list, from kb/status/noncredit_subject_titles.json),
// #commons/subjects/<college slug> (one college), #commons/subjects/<college slug>/<local code> (that college with
// the code's course panel open, read from kb/status/subject_courses/<slug>.json), #commons/subjects/disagree (the codes only one side prints, the
// list of codes with no title), #commons/subjects/held (S695: the local subject codes the pile mint holds on, ranked by the held
// courses a decided common subject code releases; read from kb/status/held_subject_codes.json, built by
// kb/_held_subject_codes.py, and fetched only when that view opens). The view picked lasts the visit; only the address carries it. Tokens only (the tab's --cmn roles),
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
    not_in_catalog: { word: "Not in catalog", tip: "The catalog was read and gives this code no subject heading. It waits on a title from a person." },
    /* Sam, 2026-11-21 (COBIx on #3655): noncredit recommendations wait until the large noncredit programs' catalogs are read. */
    noncredit_hold: { word: "Noncredit: on hold", tip: "Every course under this code is noncredit and its catalog gives no heading. Noncredit titles and common codes wait until the large noncredit programs’ catalogs are read." }
  };
  /* A code's courses in COCI, credit and noncredit apart (Sam, 2026-11-21: the MQs separate them). */
  function bands(r) {
    if (r.noncredit_courses == null || !r.noncredit_courses) return "";
    return " (" + fmt(r.credit_courses || 0) + " credit, " + fmt(r.noncredit_courses) + " noncredit)";
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
     person who settles the row; the page saves nothing. A row on the noncredit hold has none. */
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
     kb/status/noncredit_subject_titles.json (kb/_build_noncredit_subject_titles.py): a draft a person settles. */
  var NC = "noncredit";
  var NC_FILE = "kb/status/noncredit_subject_titles.json";

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

  var S = { view: "", code: "", band: "" };   /* view: "", a college slug, "disagree" or "held"; code: the local code whose course
                                       panel is open at that college. The visit's pick, which only the address carries. */
  function address() {
    var base = S.view ? "commons/subjects/" + encodeURIComponent(S.view) : "commons/subjects";
    return S.code ? base + "/" + S.code.split("/").map(encodeURIComponent).join("/") : base;
  }
  function go(href, text) { return el("a", { href: href, "data-csb-go": href.replace(/^#commons\/subjects\/?/, ""), text: text }); }

  function trail(here) {
    return el("p", { cls: "csb-trail" }, [el("a", { href: "#commons", text: "CPL Commons" }), " / ",
      here ? go("#commons/subjects", "Subjects") : "Subjects", here ? " / " + here : ""]);
  }

  /* The colleges, one row each: what its catalog prints and what it shares with the state list. */
  function collegeTable(M, list) {
    var tbl = el("table", { cls: "csb-table" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col"), el("col"), el("col"), el("col"), el("col")]),
      el("thead", null, [el("tr", null, ["College", "Subject codes in the catalog", "Local titles", "Both", "Catalog only", "COCI only"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, list.map(function (c) {
        return el("tr", { "data-college": c.slug }, [el("th", { scope: "row" }, [S.view === c.slug ? c.college : go("#commons/subjects/" + c.slug, c.college)]),
          el("td", { text: fmt(c.codes) }), el("td", { cls: c.named ? null : "csb-tba", text: c.named ? fmt(c.named) : "TBA" }),
          el("td", { text: fmt(c.both) }), el("td", { text: fmt(c.catalogOnly) }), el("td", { text: fmt(c.stateOnly) })]);
      }))]);
    return el("div", { cls: "csb-wrap", role: "region", "aria-label": "Colleges with a catalog on file", tabindex: "0" }, [tbl]);
  }

  /* The codes, one row each: college, local code, printed name (the draft title), common code, courses, side. */
  function codeTable(rows, label) {
    var tbl = el("table", { cls: "csb-table csb-codes" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col"), el("col", { cls: "csb-c-wide" }), el("col"), el("col"), el("col")]),
      el("thead", null, [el("tr", null, ["College", "Local code", "Local Title", "Common subject code", "Courses", "Source"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, rows.length ? rows.map(function (r) {
        var heads = r.side === "state" ? fmt(r.state_courses) + " in COCI" + bands(r)
          : fmt(r.catalog_courses) + (r.side === "both" ? " in the catalog, " + fmt(r.state_courses) + " in COCI" + bands(r) : "")
            + (r.address && !r.catalog_courses ? (r.page_codes && r.page_codes.length ? "; its page prints its courses under " + r.page_codes.join(" and ") : "; its page is not read yet") : "");
        var st = needsTitle(r) ? stateOf(r) : null;
        var title = st ? el("td", { cls: "csb-tba" }, [
          el("span", { cls: "csb-chip", role: "note", tabindex: "0", "data-state": r.title_state || "not_read", "aria-label": st.word + ". " + st.tip, title: st.tip, text: st.word }),
          r.candidate ? el("span", { cls: "csb-sub", text: "A line near it in the catalog: " + r.candidate }) : null,
          recOf(r).title ? recNote("title", recOf(r).title.title, recOf(r).title) : null])
          : el("td", { text: r.printed_name });
        return el("tr", { "data-code": r.code, "data-side": r.side, "data-title-state": r.title_state || null }, [
          el("td", null, [S.view === r.slug ? r.college : go("#commons/subjects/" + r.slug, r.college)]),
          el("th", { scope: "row" }, [codeWord(r)]),
          title,
          el("td", null, [r.common ? r.common + (r.discipline ? " " + r.discipline : "") : "",
            !r.common && recOf(r).common ? recNote("common", recOf(r).common.code + " " + recOf(r).common.discipline, recOf(r).common) : null]),
          el("td", { text: heads }),
          el("td", { text: st && r.title_state === "not_read" ? st.word : SIDES[r.side] || r.side })]);
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
      var where = (t.members || []).map(function (x) { return (names[x.college] || x.college) + " " + x.code; }).join("; ");
      var share = t.category_share == null ? "" : Math.round(t.category_share * 100) + "% of its noncredit courses";
      var others = (t.categories || []).slice(1).map(function (c) { return c[0] + " " + fmt(c[1]); }).join("; ");
      rows.push(el("tr", { "data-title": t.title, "data-state": t.state }, [
        el("th", { scope: "row" }, [t.title, (t.printed_as || []).length > 1 || (t.printed_as || [])[0] !== t.title
          ? el("span", { cls: "csb-sub", text: "Printed as: " + (t.printed_as || []).join("; ") }) : null]),
        el("td", { text: fmt(t.programs) + " of " + fmt((N.programs || []).length) }),
        el("td", { text: where }),
        el("td", { text: fmt(t.catalog_courses) }),
        el("td", null, [t.category ? share : "", t.state === "several categories" && others ? el("span", { cls: "csb-sub", text: "Also under: " + others }) : null])]));
    });
    var tbl = el("table", { cls: "csb-table csb-nc" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-wide" }), el("col", { cls: "csb-c-num" }), el("col"), el("col", { cls: "csb-c-num" }), el("col", { cls: "csb-c-mid" })]),
      el("thead", null, [el("tr", null, ["Noncredit subject title", "Programs", "Where it is printed", "Courses in the catalogs", "Share under this category"]
        .map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, rows.length ? rows : [el("tr", null, [el("td", { colspan: "5", text: "No heading is filed yet." })])])]);
    return el("div", { cls: "csb-wrap", role: "region", "aria-label": "Noncredit subject titles by category", tabindex: "0" }, [tbl]);
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
  function codeWord(r) {
    var b = el("button", { type: "button", cls: "csb-word", "data-csb-code": r.code, "data-csb-slug": r.slug,
      "aria-label": "Courses under " + r.code + " at " + r.college, text: r.code });
    return b;
  }
  var BANDS = [["C", "Credit courses"], ["N", "Noncredit courses"], ["", "In the catalog only (COCI does not list it, so its band is not known)"]];
  function courseTable(rows, label) {
    var tbl = el("table", { cls: "csb-table csb-courses" }, [
      el("colgroup", null, [el("col", { cls: "csb-c-num" }), el("col"), el("col", { cls: "csb-c-code" }), el("col", { cls: "csb-c-mid" })]),
      el("thead", null, [el("tr", null, ["Number", "Title", "Listed in", "C-ID, CCN, M-ID"].map(function (t) { return el("th", { scope: "col", text: t }); }))]),
      el("tbody", null, rows.map(function (c) {
        var ids = [c.cid ? "C-ID " + c.cid : "", c.ccn ? "CCN " + c.ccn : "", c.mid ? "M-ID " + c.mid : ""].filter(Boolean).join("; ");
        return el("tr", { "data-number": c.number, "data-band": c.band || "" }, [el("th", { scope: "row", text: c.number }),
          el("td", { text: c.title || "" }), el("td", { text: c.listed || "" }), el("td", { text: ids })]);
      }))]);
    return el("div", { cls: "csb-wrap csb-wrap-in", role: "region", "aria-label": label, tabindex: "0" }, [tbl]);
  }
  function panelDraw(root, M) {
    var old = root.querySelector("#csb-panel");
    if (old) old.parentNode.removeChild(old);
    if (!S.code || !M.by[S.view]) return;
    var c = M.by[S.view], slug = S.view, code = S.code;
    var row = c.rows.filter(function (r) { return r.code === code; })[0];
    var close = el("button", { type: "button", cls: "csb-word", id: "csb-panel-close", text: "Close" });
    close.addEventListener("click", function () { open(slug); });
    var body = el("div", { id: "csb-panel-body" }, [el("p", { cls: "csb-note", role: "status", text: "Reading the courses…" })]);
    var name = row && row.printed_name ? row.printed_name : "";
    var panel = el("aside", { cls: "csb-panel", id: "csb-panel", role: "dialog", "aria-labelledby": "csb-panel-h" }, [
      el("div", { cls: "csb-panel-in" }, [
        el("div", { cls: "csb-panel-top" }, [el("p", { cls: "csb-eyebrow", text: "Courses under a local code" }), close]),
        el("h3", { id: "csb-panel-h", tabindex: "-1", text: code + (name ? ", " + name : "") }),
        el("p", { cls: "csb-note", text: c.college + ". " + (name ? "" : "No local title yet. ")
          + (row && row.common ? "Common subject code " + row.common + (row.discipline ? " " + row.discipline : "") + "." : "No common subject code yet.") }),
        body])]);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); open(slug); } });
    root.appendChild(panel);
    loadCourses(slug).then(function (codes) {
      if (S.code !== code || S.view !== slug) return;
      var rows = codes[code] || [];
      body.textContent = "";
      if (!rows.length) { body.appendChild(el("p", { cls: "csb-note", text: "No course is listed under " + code + " in the catalog on file or in COCI." })); return; }
      var both = rows.filter(function (x) { return x.listed === "Both"; }).length, cat = rows.filter(function (x) { return x.listed === "Catalog"; }).length;
      body.appendChild(el("p", { cls: "csb-note", id: "csb-panel-count", text: fmt(rows.length) + (rows.length === 1 ? " course: " : " courses: ")
        + fmt(both) + " in both the catalog and COCI, " + fmt(cat) + " in the catalog only, " + fmt(rows.length - both - cat) + " in COCI only." }));
      BANDS.forEach(function (b) {
        var part = rows.filter(function (x) { return (x.band || "") === b[0]; });
        if (!part.length) return;
        body.appendChild(el("h4", { cls: "csb-band", "data-band": b[0], text: b[1] + " (" + fmt(part.length) + ")" }));
        body.appendChild(courseTable(part, b[1] + " under " + code));
      });
    }, function (e) {
      if (S.code !== code) return;
      body.textContent = "";
      body.appendChild(el("p", { cls: "csb-note", role: "status", text: "The courses could not be read (" + (e && e.message ? e.message : e) + "). Close the panel and open it again to retry." }));
    });
  }

  var VIEW = { root: null, M: null, noted: null, H: null };
  function render(root, M, view) {
    VIEW.root = root; VIEW.M = M;
    ensureCss();
    view = String(view || "");
    /* <college slug>/<local code> opens that college with the code's course panel; a code may hold a slash (ES/A). */
    var cut = view.indexOf("/"), code = cut > 0 ? view.slice(cut + 1) : "";
    if (cut > 0) view = view.slice(0, cut);
    var special = view === DISAGREE || view === HELD || view === NC;
    var c = view && !special ? M.by[view] : null;
    var missing = view && !special && !c ? view : "";
    S.view = missing ? "" : view;
    S.code = c && code && c.rows.some(function (r) { return r.code === code; }) ? code : "";
    root.removeAttribute("style");
    root.textContent = "";
    var T = M.totals, all = [];
    M.list.forEach(function (x) { all = all.concat(x.rows); });
    var untitled = all.filter(needsTitle).length;
    var wrap = el("div", { cls: "cmn-wrap csb" });
    wrap.appendChild(trail(c ? c.college : S.view === DISAGREE ? "Codes with no title" : S.view === HELD ? "Codes the M-ID mint holds on" : S.view === NC ? "Noncredit subject titles" : ""));
    wrap.appendChild(el("header", { cls: "cmn-top" }, [
      el("h2", { cls: "cmn-title", id: "csb-h", text: c ? "Subjects at " + c.college : S.view === DISAGREE ? "Subject codes with no title" : S.view === HELD ? "Local subject codes the M-ID mint holds on" : S.view === NC ? "Noncredit subject titles" : "Subjects" }),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      el("p", { cls: "cmn-lede", text: "Step a is the common subject code each discipline shares; Step b is each college’s own name for its subject codes, read from its catalog. The Courses bot drafts each local title from the catalog’s subject heading. A curator settles the codes the catalog and the state course list disagree on." })
    ]));
    wrap.appendChild(el("p", { cls: "csb-stamp" }, [
      el("strong", { text: fmt(T.named) }), " local titles at ", el("strong", { text: fmt(T.colleges_named) + " of " + fmt(T.colleges) }),
      " colleges with a catalog on file (" + fmt(T.courses) + " courses, " + fmt(T.catalog_codes) + " subject codes in the catalogs). ",
      go("#commons/subjects/" + DISAGREE, fmt(untitled) + " codes with no title"),
      " (" + fmt(T.not_in_catalog || 0) + " not in catalog, " + fmt(T.not_read || 0) + " not read yet, " + fmt(T.blocked || 0) + " blocked, " + fmt(T.noncredit_hold || 0) + " noncredit on hold). ",
      fmt(T.with_common) + " codes have a common subject code from the subject map. ",
      el("a", { href: "#canonical-subj4", text: "Common Subjects Reference" }), ". ",
      go("#commons/subjects/" + HELD, "Codes the M-ID mint holds on"), ". ",
      go("#commons/subjects/" + NC, "Noncredit subject titles"), "."]));
    if (missing) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: "No college with a catalog on file is named " + missing + ". Every college is below." }));
    if (c) {
      wrap.appendChild(el("p", { cls: "csb-note", text: c.year + " catalog, read " + day(c.readAt) + ". " + (c.named ? fmt(c.named) + " of " + fmt(c.codes) + " codes have a local title." : "No subject heading is read for this catalog yet.") }));
      wrap.appendChild(collegeTable(M, [c]));
      wrap.appendChild(bandBar(c.rows));
      wrap.appendChild(codeTable(c.rows.filter(function (r) { return inBand(r, S.band); }), "Subject codes at " + c.college));
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
    } else if (S.view === NC) {
      var N = VIEW.N;
      if (!N) wrap.appendChild(el("p", { cls: "csb-note", role: "status", text: VIEW.ncError ? "The noncredit title list could not be read (" + VIEW.ncError + "). Reload the tab to try again." : "Reading the noncredit titles…" }));
      else {
        var NT = N.totals || {};
        wrap.appendChild(el("p", { cls: "csb-note", id: "csb-nc-note" }, [el("strong", { text: fmt(NT.titles) }), " noncredit subject titles from ", el("strong", { text: fmt(NT.headings) }),
          " subject headings in the catalogs of the four large noncredit programs: " + (N.programs || []).map(function (p) { return p.college; }).join(", ") + ". "
          + fmt(NT.titles_in_two_or_more_programs) + " titles are printed by two or more programs. " + fmt(NT.with_common_code) + " sit under a category whose noncredit MQ discipline has a common subject code, "
          + fmt(NT.category_without_code) + " under a category with no code yet, and " + fmt(NT.no_noncredit_course_in_coci) + " have no noncredit course in COCI. "
          + "This is a draft for a person to settle. Noncredit rows stay on hold until it is settled."]));
        wrap.appendChild(ncTable(N));
      }
    } else if (S.view === DISAGREE) {
      /* Every row with no title, in or out of the catalog (#3655, item 7: a code in both with no title was dropped
         by the old one-sided filter). Sam's rows first: Not in catalog, then Blocked, then Sky's Not read yet. */
      var order = { not_in_catalog: 0, blocked: 1, not_read: 2, noncredit_hold: 3 };
      wrap.appendChild(bandBar(all.filter(needsTitle)));
      wrap.appendChild(codeTable(all.filter(needsTitle).filter(function (r) { return inBand(r, S.band); }).sort(function (a, b) {
        return (order[a.title_state] == null ? 2 : order[a.title_state]) - (order[b.title_state] == null ? 2 : order[b.title_state])
          || a.college.localeCompare(b.college) || String(a.code).localeCompare(String(b.code));
      }), "Subject codes with no title"));
    } else {
      wrap.appendChild(collegeTable(M, M.list));
      wrap.appendChild(bandBar(all));
      wrap.appendChild(codeTable(all.filter(function (r) { return inBand(r, S.band); }), "Every subject code"));
    }
    wrap.appendChild(el("p", { cls: "csb-foot", text: "How codes are compared: " + (S.view === HELD && VIEW.H ? VIEW.H.rule : S.view === NC && VIEW.N ? VIEW.N._rule : M.rule + (M.built ? " The state course list was built " + day(M.built) + "." : "")) }));
    var page = el("div", { cls: "cmn-page" }, [wrap]);
    root.appendChild(page);
    Array.prototype.forEach.call(root.querySelectorAll("a[data-csb-go]"), function (a) {
      a.addEventListener("click", function (e) { if (e && e.preventDefault) e.preventDefault(); open(a.getAttribute("data-csb-go")); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("button[data-csb-band]"), function (b) {
      b.addEventListener("click", function () {
        S.band = b.getAttribute("data-csb-band") || "";
        render(root, M, S.view + (S.code ? "/" + S.code : ""));
        var on = root.querySelector('button[data-csb-band="' + S.band + '"]');
        if (on && on.focus) on.focus();
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll("button[data-csb-code]"), function (b) {
      b.addEventListener("click", function () { open(b.getAttribute("data-csb-slug") + "/" + b.getAttribute("data-csb-code")); });
    });
    panelDraw(root, M);
    return page;
  }
  /* A pick: draw it and put it in the address, which is the only place it lives. */
  /* The held view reads its own file the first time it opens, then draws again. */
  function withHeld(view) {
    if (String(view || "") === NC && !VIEW.N) {
      return loadNc().then(function (N) { VIEW.N = N; VIEW.ncError = ""; }, function (e) { VIEW.ncError = e && e.message ? e.message : String(e); })
        .then(function () { if (VIEW.root && VIEW.M && S.view === NC) render(VIEW.root, VIEW.M, NC); });
    }
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
        .then(function (rf) { REC = recModel(rf); return model(f); });
    });
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
    ".csb-rec { color:var(--cmn-ink-2); margin-top:4px; } .csb-rec strong { color:var(--cmn-heading); font-weight:600; }",
    ".csb-chip { display:inline-block; font-size:.78rem; font-weight:600; color:var(--cmn-ink-2); border:1px solid var(--cmn-line); border-radius:999px; padding:1px 9px; background:var(--cmn-surface); white-space:nowrap; cursor:help; }",
    ".csb-chip[data-state='not_in_catalog'] { color:var(--cmn-heading); border-color:var(--cmn-accent); }",
    ".csb-chip:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".csb-word { font:inherit; font-weight:600; color:var(--cmn-link); background:none; border:0; padding:0; min-width:24px; min-height:24px; line-height:24px; text-decoration:underline; text-underline-offset:3px; cursor:pointer; overflow-wrap:anywhere; text-align:left; }",
    ".csb-bands { margin:0; display:flex; flex-wrap:wrap; gap:6px 18px; align-items:baseline; color:var(--cmn-ink-2); }",
    ".csb-bands .csb-word[aria-pressed='true'] { color:var(--cmn-heading); text-decoration:none; border-bottom:2px solid var(--cmn-accent); }",
    ".csb-word:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".csb-panel { position:fixed; top:0; right:0; bottom:0; z-index:1000; display:flex; width:min(620px, calc(100vw - 24px)); background:var(--cmn-dialog, var(--cmn-surface)); border-left:1px solid var(--cmn-line); box-shadow:-12px 0 32px color-mix(in srgb, var(--cmn-heading) 16%, transparent); color:var(--cmn-ink); }",
    ".csb-panel-in { flex:1 1 auto; min-width:0; overflow-y:auto; display:grid; gap:12px; align-content:start; padding:calc(18px + env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 24px 18px; }",
    ".csb-panel-top { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }",
    ".csb-eyebrow { margin:0; font-size:.82rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--cmn-muted); }",
    ".csb-panel h3 { margin:0; font-family:var(--cmn-serif); font-size:clamp(1.15rem, 1rem + .6vw, 1.4rem); color:var(--cmn-title, var(--cmn-heading)); overflow-wrap:anywhere; }",
    ".csb-panel h3:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".csb-band { margin:6px 0 0; font-size:1rem; color:var(--cmn-heading); }",
    "#csb-panel-body { display:grid; gap:10px; min-width:0; }",
    ".csb-wrap-in { max-height:none; }",
    ".csb-courses { font-size:.88rem; } .csb-courses .csb-c-num { width:16%; } .csb-courses .csb-c-code { width:16%; } .csb-courses .csb-c-mid { width:30%; }",
    ".csb-nc-cat th { background:var(--cmn-surface-2, var(--cmn-surface)); color:var(--cmn-heading); font-weight:700; }",
    ".csb-foot { margin:0; color:var(--cmn-muted); font-size:.85rem; max-width:var(--cpl-measure,none); }",
    "@media (max-width: 560px) { .csb-table { min-width:36rem; } .csb-held { min-width:44rem; } .csb-nc { min-width:40rem; } .csb-courses { min-width:26rem; } .csb-table th, .csb-table td { padding:8px; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("csb-css")) return;
    document.head.appendChild(el("style", { id: "csb-css", text: CSS }));
  }

  window.CPL_COMMONS_SUBJECTS = {
    boot: boot, render: render, model: model, heldModel: heldModel, recModel: recModel, REC_FILE: REC_FILE,
    _recs: function (f) { REC = recModel(f); }, address: address, open: open, load: load, FILE: FILE, HELD_FILE: HELD_FILE, SIDES: SIDES, CSS: CSS,
    _state: S, COURSE_DIR: COURSE_DIR,
    _reset: function () { cache = null; heldCache = null; ncCache = null; courseCache = {}; VIEW.M = null; VIEW.H = null; VIEW.N = null; S.view = ""; S.code = ""; S.band = ""; }
  };
})();
