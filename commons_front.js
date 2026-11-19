// commons_front.js — the CPL Commons front page: one page for the Commons, with the College Data Collection page
// folded in (#3533; Sam's go, Nov 19, 2026, 2:49 AM PT, and "build the CPL Commons page now", 4:28 AM PT, relayed by
// COBIx in #3533 comment 7006930860). Top to bottom: the header and Sam's lede, the Projected Completion Date widget
// with its 30-day daily bars, Needs you, the eight cards in Collect / Curate / Connect, the Building line, the More
// collection detail line and the scorecard line.
//
// What it reads (committed files the site already serves; it WRITES NOTHING but the fold, in this browser):
//   kb/status/commons.json                    (handed in by commons.js, which loaded it) the cards' figures:
//                                             courses, exhibits, credit recommendations, subjects, building.
//   kb/status/program-requirements.json       headline: the Active programs complete per day, which give the
//                                             programs figure, the pace, the projected date and the daily bars.
//   kb/status/commons_data.json               statewide and live: colleges collected, the program bases, the
//                                             course SLO and objective counts, the outline links.
//   kb/reference/industry_credential_skills.json   harvested_on: the issuer-published skills collected per day.
// A figure with no single committed source on main yet is in ASKED below, named with where it comes from, so the
// page never invents one and a later source replaces it in one place. Every figure is read once into the model, and
// every place on the page that shows it reads the model, so the page agrees with itself (S490).
//
// The fold is the one thing kept: localStorage cplCommons.fold.v1, a JSON array of collapsed card keys ([] = all
// expanded), the key the live Commons build already used. The earlier first view's order and fold move once to
// cplCommons.detailsOrder.v1 / cplCommons.detailsFold.v1 (that view is at #commons/details), and cplCommons.order.v1
// is removed. Tokens only (the tab's --cmn roles and three series tokens below), words for every control, no glyphs.
(function () {
  "use strict";

  var FOLD_KEY = "cplCommons.fold.v1";
  var ORDER_KEY = "cplCommons.order.v1";
  var MIGRATED_KEY = "cplCommons.front.v1";
  var DETAILS_ORDER_KEY = "cplCommons.detailsOrder.v1";
  var DETAILS_FOLD_KEY = "cplCommons.detailsFold.v1";
  var FILES = { program: "kb/status/program-requirements.json", data: "kb/status/commons_data.json",
    skills: "kb/reference/industry_credential_skills.json" };
  var KEYS = ["colleges", "programs", "courses-data", "courses", "exhibit", "credentials", "cr", "interconnect"];
  var DAYS = 30;   /* the same window as the live College Collections ETA (commons_eta_clock.js, DAYS=30) */
  var REPO = "https://github.com/CPL-Initiative/cpl-project-tracker/issues/";

  /* Figures with no single committed source on main yet, as COBIx's ask gives them (#3533 comment 7006930860, read
     against origin/main 09e5c0d1 and the program-requirements snapshot written 2026-11-19T09:27:50Z). Each names its
     source; when one lands on main, read it in model() and drop it here. */
  var ASKED = {
    cociOnly: 713,              /* COCI-only Active programs (in the CO inventory, not the current catalog); open question 4 */
    sloSnap: { at: "November 17, 2026, 1:59 PM PT", slo: 13293, obj: 9680 },   /* the snapshot the recent rates start from */
    outlinesBlocked: { cards: 140, current: 13 },   /* the Courses' count of course outlines blocked */
    missingMembership: 4036,    /* cards missing from the published membership list (the membership fix) */
    noSubjectWas: { day: "November 12", n: 366 },   /* the no-common-subject queue a week ago */
    evergreen: "Evergreen Valley College",           /* the one saved catalog read still from 2025–2026 */
    credentials: { of: 2896, credit: 1603, one: 1261, two5: 247, six10: 58, eleven: 37, max: 32, lines: 4239 },
    cr: { rows: 31055, pairs: 29701, noExhibit: 1354, settled: 2235, rule: 859, ace: 25984, cannot: 1977,
      cannotNoExhibit: 1315, cannotTruncated: 593, cannotNoId: 69, crm: 17466, since: "November 4",
      post: { colleges: 19, rows: 139 } },
    ctid: 51,                   /* catalog rows with a Credential Engine ID (CTID) */
    noDescription: 6373,        /* active COCI courses with no description */
    curation: { exhibitDate: "May 9, 2027", exhibitFall: 18, courseDate: "November 27, 2026", courseFall: 1521 },
    doubt: ["M1524", "M1553", "M1568", "M1762", "M1847"]
  };

  /* ── helpers ── */
  function fmt(n) { return n == null || isNaN(n) ? "" : Number(n).toLocaleString("en-US"); }
  function pct(n, d) { return d ? n / d * 100 : 0; }
  function dnum(s) { var p = String(s).slice(0, 10).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
  function dstr(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
  function longDate(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }); }
  function monthDay(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }); }
  function shortDay(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }); }
  /* December 17–18, 2026: a range inside one month, else two long dates. */
  function dayRange(a, b) {
    if (a === b) return longDate(a);
    var A = new Date(a * 86400000), B = new Date(b * 86400000);
    if (A.getUTCMonth() === B.getUTCMonth() && A.getUTCFullYear() === B.getUTCFullYear())
      return monthDay(a) + "–" + B.getUTCDate() + ", " + B.getUTCFullYear();
    return longDate(a) + "–" + longDate(b);
  }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === "text") e.textContent = attrs[k]; else if (k === "cls") e.className = attrs[k]; else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function a(href, text, cls) { return el("a", { href: href, cls: cls || null, text: text }); }
  function p(kids, cls) { return el("p", { cls: cls || null }, kids); }
  function readJson(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " answered " + r.status);
      return r.json();
    });
  }
  function store(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function put(key, v) { try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch (e) { /* private window */ } }

  /* ── the fold: one migration, then a JSON array of collapsed card keys ── */
  function migrate() {
    if (store(MIGRATED_KEY)) return;
    var order = store(ORDER_KEY), fold = store(FOLD_KEY);
    if (order != null && store(DETAILS_ORDER_KEY) == null) put(DETAILS_ORDER_KEY, order);
    if (fold != null && store(DETAILS_FOLD_KEY) == null) put(DETAILS_FOLD_KEY, fold);
    put(ORDER_KEY, null);
    put(FOLD_KEY, "[]");
    put(MIGRATED_KEY, "1");
  }
  function readFold() {
    try {
      var v = JSON.parse(store(FOLD_KEY));
      return Array.isArray(v) ? v.filter(function (k) { return KEYS.indexOf(k) >= 0; }) : [];
    } catch (e) { return []; }
  }

  /* ── the model: every figure the page shows, read once ── */
  function model(C, PR, D, K) {
    var rows = {};
    ((C && C.rows) || []).concat((C && C.building) || []).forEach(function (r) { rows[r.key] = r; });
    function facts(k) { return (rows[k] && rows[k].facts) || {}; }
    var queue = {};
    ((C && C.queue && C.queue.reasons) || []).forEach(function (g) { (g.items || []).forEach(function (i) { queue[i.ref + "|" + i.open] = i; }); });

    /* Programs, the pace and the date: the headline's complete count per day. */
    var H = ((PR && PR.headline) || []).filter(function (r) { return r && r.day && typeof r.complete === "number"; });
    if (!H.length) throw new Error(FILES.program + " has no headline of complete programs");
    var byDay = {};
    H.forEach(function (r) { byDay[dnum(r.day)] = r.complete; });
    var lastN = dnum(H[H.length - 1].day);
    function at(n) { for (var i = 0; i < 8; i++) if (byDay[n - i] != null) return byDay[n - i]; return null; }
    var pr = facts("requirements"), live = (D && D.live && D.live.statewide) || {}, sw = (D && D.statewide) || {};
    var complete = at(lastN), active = H[H.length - 1].active || pr.active;
    var target = active - ASKED.cociOnly, left = target - complete;
    var gain = complete - at(lastN - 7), pace = gain / 7;
    var prevGain = at(lastN - 7) - at(lastN - 14), prevPace = prevGain / 7;
    var exact = pace > 0 ? left / pace : null;
    var doneN = exact == null ? null : lastN + Math.ceil(exact);
    var prevN = prevPace > 0 ? lastN + Math.ceil(left / prevPace) : null;

    /* The 30 daily bars: programs newly finished (the day's rise in complete) and issuer skills collected. */
    var skillsBy = {};
    ((K && K.credentials) || []).forEach(function (c) {
      if (!c || !c.harvested_on) return;
      var n = dnum(c.harvested_on), s = skillsBy[n] || (skillsBy[n] = { skills: 0, creds: 0 });
      s.skills += Array.isArray(c.skills) ? c.skills.length : 0; s.creds += 1;
    });
    var days = [];
    for (var n = lastN - DAYS + 1; n <= lastN; n++) {
      var today = at(n), before = at(n - 1), sk = skillsBy[n] || { skills: 0, creds: 0 };
      days.push({ n: n, programs: today != null && before != null ? Math.max(0, today - before) : 0, skills: sk.skills, creds: sk.creds });
    }

    var outcomes = live.outcomes || {}, pc = live.program_courses || {}, reg = live.registry || {}, progs = live.programs || {};
    var liveCols = (D && D.live && D.live.colleges) || {};
    var sloColleges = 0, objColleges = 0;
    Object.keys(liveCols).forEach(function (k) {
      var o = (liveCols[k] && liveCols[k].outcomes) || {};
      if (o.slo_courses > 0) sloColleges += 1;
      if (o.objective_courses > 0) objColleges += 1;
    });
    var course = facts("course"), ex = facts("exhibit"), cr = facts("cr"), subj = facts("subjects"), cred = facts("credentials"), out = facts("outcomes");
    var held = queue["exhibit|#exhibits/held"] || {};
    var heldParts = String(held.owner || "").match(/unsure (\d+).*?issuers (\d+).*?left in (\d+)/);
    var sloSnap = ASKED.sloSnap, sloGrow = (outcomes.slo_courses_on_active || 0) - sloSnap.slo, objGrow = (outcomes.objective_courses_on_active || 0) - sloSnap.obj;
    var sloLeft = (pc.active_courses || 0) - (outcomes.slo_courses_on_active || 0), objLeft = (pc.active_courses || 0) - (outcomes.objective_courses_on_active || 0);
    return {
      lastN: lastN, written: PR.written_at || "",
      programs: { complete: complete, active: active, target: target, cociOnly: ASKED.cociOnly, left: left, gain: gain, pace: pace,
        fromN: lastN - 7, exact: exact, doneN: doneN, lowN: exact == null ? null : lastN + Math.floor(exact), prevN: prevN,
        gap: pr.failing, unread: pr.unread, confirmed: pr.confirmed, confirmedComplete: pr.confirmed_complete,
        wider: sw.passing, widerOf: sw.programs, approved: progs.approved, teachout: progs.teachout },
      days: days,
      colleges: { collected: sw.harvested, total: sw.colleges, blocked: Math.max(0, (sw.colleges || 0) - (sw.harvested || 0)),
        ce: sw.continuing_education, districts: sw.districts, outlineLinks: reg.course_outline_link, registry: reg.row || sw.colleges },
      courses: { active: pc.active_courses, slo: outcomes.slo_courses_on_active, obj: outcomes.objective_courses_on_active,
        sloColleges: sloColleges, objColleges: objColleges, sloGrow: sloGrow, objGrow: objGrow, sloLeft: sloLeft, objLeft: objLeft,
        sloDoneN: sloGrow > 0 ? lastN + Math.ceil(sloLeft / sloGrow) : null, objDoneN: objGrow > 0 ? lastN + Math.ceil(objLeft / objGrow) : null },
      cards: { ready: course.ready, total: course.total, review: course.needs_review, repair: course.needs_repair, notReady: course.not_ready,
        confirmed: course.confirmed, confirmedReady: course.confirmed_ready },
      exhibits: { stamped: ex.stamped, titles: (ex.titles || 0) + (ex.backlog || 0), person: ex.person, cohort: ex.cohort, backlog: ex.backlog,
        names: ex.credentials, noSubject: ex.no_subject, left: ex.left_map, renamed: ex.review_list },
      held: { n: held.n, unsure: heldParts ? +heldParts[1] : null, issuers: heldParts ? +heldParts[2] : null, code: heldParts ? +heldParts[3] : null },
      cr: { settled: cr.settled, wordings: cr.wordings, rule: cr.rule_wordings, curator: cr.curator_only, groups: cr.names_to_check },
      subjects: { settled: subj.settled, of: subj.disciplines },
      building: { skillsCreds: (facts("skills").with_issuer_skills != null ? facts("skills").with_issuer_skills : cred.with_issuer_skills),
        industry: cred.credentials, issuers: cred.issuers, outcomes: out.outcomes, outcomeCourses: out.courses,
        outcomeColleges: Array.isArray(out.colleges) ? out.colleges.length : out.colleges }
    };
  }

  /* ── the parts of the page ── */
  function method(label, kids, onToggle) {
    var d = el("details", { cls: "cmf-method" }, [el("summary", { text: label }), el("div", { cls: "cmf-method-body" }, kids)]);
    if (onToggle) d.addEventListener("toggle", function () { onToggle(d.open); });
    return d;
  }
  function meter(value, label) {
    return el("div", { cls: "cmf-meter", role: "img", "aria-label": label }, [el("i", { style: "width:" + Math.max(0, Math.min(100, value)).toFixed(1) + "%" })]);
  }
  /* A link to the Courses data card on this page: scroll, never route (the tab router reads #courses-data as a tab). */
  function cardLink(text) {
    var l = a("#courses-data", text);
    l.addEventListener("click", function (e) {
      e.preventDefault();
      var c = document.getElementById("courses-data");
      if (!c) return;
      if (c.scrollIntoView) c.scrollIntoView({ block: "start" });
      var h = c.querySelector("h3");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    });
    return l;
  }

  function header(M, onAll) {
    var all = el("button", { type: "button", cls: "cmn-word cmf-all", id: "cmf-all", text: "Collapse all" });
    all.addEventListener("click", onAll);
    return el("header", { cls: "cmn-top cmf-top" }, [
      el("div", { cls: "cmf-top-row" }, [el("h2", { cls: "cmn-title", id: "cmf-h", text: "CPL Commons" }), all]),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      p(["Workspace to collect, curate, and connect common datasets: catalogs with program and course requirements, PLOs, SLOs, objectives, and attributes; CPL credentials and exhibits with credit recommendations and skills; and connections to the related datasets and platforms needed to clarify paths, in one integrated statewide view."], "cmn-lede"),
      p(["Dates below use the last 7 days’ pace, with no optional speed-up choices turned on. Every date is a projection, not a promise."], "cmn-sub")
    ]);
  }

  function programsMethod(M) {
    var P = M.programs;
    return "The date is the latest of three finishes in Phase 1 of college data collection, using the last 7 days’ pace and no optional speed-up choices (on the live page those choices are chips you can turn on for a new data connection, a second reviewer, or a new sorting rule). "
      + "Program records: " + fmt(P.complete) + " of " + fmt(P.active) + " Active programs are complete as of " + monthDay(M.lastN) + ". "
      + "The target is every Active program in its college’s current catalog: " + fmt(P.active) + " minus the COCI-only programs, about " + fmt(P.target) + ", so about " + fmt(P.left) + " are left. "
      + fmt(P.gain) + " more were completed from " + monthDay(P.fromN) + " to " + new Date(M.lastN * 86400000).getUTCDate() + " (about " + fmt(Math.round(P.pace)) + " a day). "
      + (P.doneN == null ? "At that pace this target has no date. "
        : "At that pace this target finishes in about " + fmt(Math.floor(P.exact)) + " days from " + monthDay(M.lastN) + ", on " + dayRange(P.lowN, P.doneN) + (P.lowN !== P.doneN ? "; this page uses " + longDate(P.doneN) : "") + ". ")
      + "Programs that appear only in the Chancellor’s Office curriculum inventory are optional cleanup, not part of this date. Programs and course outlines that still can’t be read automatically will take longer. "
      + "Course student learning outcomes (SLOs) and course objectives now have measured recent rates, but a finish date should be set only for courses that can already be read automatically. That readable-course count is not computed yet, so those dates are pending — see Courses data. "
      + (P.prevN == null ? "" : "The pace of the 7 days before would put program-record collection at " + longDate(P.prevN) + ", also set by programs.");
  }
  function curationMethod(M) {
    var E = M.exhibits, Cd = M.cards, R = M.cr, S = M.subjects, X = ASKED.curation;
    return "The curation date is the latest of four references’ finish dates at the last 7 days’ pace (the net fall of remaining work). A reference whose remaining work does not fall is not dated, and if any still-open reference is undated the overall date is “Not dated yet.” "
      + "Credit-recommendation wordings have sat at " + fmt(R.settled) + " of " + fmt(R.wordings) + " settled every day since " + ASKED.cr.since + " because human credit-recommendation curation is paused, and the number settled by a rule only grows when a new rule ships. A later copy of curator decisions has not synced yet. "
      + "The credit-recommendation line should later point at the " + fmt(ASKED.cr.rows) + "-row inventory, which is the set that rules actually move. The curation date still runs on the older " + fmt(R.wordings) + " wordings set. "
      + "At the same pace, exhibit titles would finish " + X.exhibitDate + " (" + fmt(E.titles - E.stamped) + " left; a net fall of " + X.exhibitFall + " a day, all by people, and that fall rested on only two days); "
      + "course cards would finish " + X.courseDate + " (" + fmt(Cd.total - Cd.ready) + " left; a net fall of about " + fmt(X.courseFall) + " a day — that " + X.courseDate.replace(/, \d{4}$/, "") + " date rests on one day’s step); "
      + "common subjects are " + (S.settled === S.of ? "already complete (" + fmt(S.settled) + " of " + fmt(S.of) + ")" : fmt(S.settled) + " of " + fmt(S.of) + " settled") + ". "
      + "Optional speed-up choices on the live page (a second reviewer, or a new sorting rule) can date a reference; none are on here. This is a projection, not a promise.";
  }

  var SERIES = [
    { key: "programs", word: "Catalog programs, course requirements, and program learning outcomes (PLOs)", token: "--cmf-s-programs" },
    { key: "skills", word: "Issuer-published credential skills", token: "--cmf-s-skills" },
    { key: "slo", word: "Course SLOs (no daily counts yet)", token: "--cmf-s-slo", none: true },
    { key: "obj", word: "Course objectives (no daily counts yet)", token: "--cmf-s-obj", none: true }
  ];
  function bars(M) {
    var D = M.days, max = 1;
    D.forEach(function (d) { max = Math.max(max, d.programs, d.skills); });
    var W = 600, H = 84, gap = 2, slot = W / D.length, bw = Math.max(1, (slot - gap * 2) / 2);
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + (H + 14));
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "cmf-bars-svg");
    svg.setAttribute("aria-hidden", "true");
    function rect(x, h, cls, t) {
      var r = document.createElementNS(NS, "rect");
      r.setAttribute("x", x.toFixed(2)); r.setAttribute("width", bw.toFixed(2));
      r.setAttribute("y", (H - h).toFixed(2)); r.setAttribute("height", Math.max(h, 0).toFixed(2));
      r.setAttribute("class", cls);
      var ti = document.createElementNS(NS, "title"); ti.textContent = t; r.appendChild(ti);
      svg.appendChild(r);
    }
    var base = document.createElementNS(NS, "line");
    base.setAttribute("x1", "0"); base.setAttribute("x2", String(W)); base.setAttribute("y1", String(H)); base.setAttribute("y2", String(H));
    base.setAttribute("class", "cmf-base");
    svg.appendChild(base);
    D.forEach(function (d, i) {
      var x = i * slot + gap;
      if (d.programs) rect(x, d.programs / max * H, "cmf-b-programs", shortDay(d.n) + ": " + fmt(d.programs) + " programs newly finished");
      if (d.skills) rect(x + bw, d.skills / max * H, "cmf-b-skills", shortDay(d.n) + ": " + fmt(d.skills) + " skills on " + fmt(d.creds) + " credentials");
    });
    var first = D[0].n, last = D[D.length - 1].n;
    var legend = el("ul", { cls: "cmf-legend" }, SERIES.map(function (s) {
      return el("li", null, [el("span", { cls: "cmf-swatch", style: "background:var(" + s.token + ")", "aria-hidden": "true" }), s.word]);
    }));
    var table = el("table", { cls: "cmf-table" }, [
      el("caption", { text: "Daily counts, " + longDate(first) + " to " + longDate(last) }),
      el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "Day" }), el("th", { scope: "col", text: "Programs newly finished" }), el("th", { scope: "col", text: "Skills collected" })])]),
      el("tbody", null, D.map(function (d) {
        return el("tr", null, [el("th", { scope: "row", text: shortDay(d.n) }), el("td", { text: fmt(d.programs) }),
          el("td", { text: d.skills ? fmt(d.skills) + " skills on " + fmt(d.creds) + " credentials" : "0" })]);
      }))
    ]);
    return el("figure", { cls: "cmf-bars" }, [
      el("figcaption", { text: "Daily counts from " + longDate(first) + " to " + longDate(last) + ": newly finished catalog programs and newly collected credential skills. Course SLOs and course objectives have no daily counts yet." }),
      svg, el("div", { cls: "cmf-barfoot" }, [legend,
      el("details", { cls: "cmf-method cmf-tablefold" }, [el("summary", { text: "The daily counts as a table" }),
        el("div", { cls: "cmf-tablewrap", role: "region", "aria-label": "Daily counts table", tabindex: "0" }, [table])])])
    ]);
  }

  function eta(M) {
    var P = M.programs;
    return el("section", { cls: "cmf-eta", "aria-labelledby": "cmf-eta-h" }, [
      el("h3", { id: "cmf-eta-h", cls: "cmf-eta-h", text: "Projected Completion Date" }),
      p([fmt(P.complete) + " of " + fmt(P.active) + " Active program records are complete, and credit-recommendation wordings have not moved since " + ASKED.cr.since + ", so only collections has a projected date."], "cmf-status"),
      el("div", { cls: "cmf-dates" }, [
        el("div", { cls: "cmf-date" }, [
          p(["Program records done"], "cmf-date-l"),
          p([P.doneN == null ? "Not dated yet" : longDate(P.doneN)], "cmf-date-v"),
          p(["For every Active program in its college’s current catalog, at the last 7 days’ pace, with no optional speed-up choices turned on. Programs that appear only in the Chancellor’s Office curriculum inventory, and programs and course outlines that still can’t be read automatically, will take longer. Dates for student learning outcomes and course objectives wait on a count of readable courses, which is not computed yet — see ", cardLink("Courses data"), "."], "cmf-date-n"),
          method("Calculation Method", [p([programsMethod(M)])])
        ]),
        el("div", { cls: "cmf-date" }, [
          p(["Curation done"], "cmf-date-l"),
          p(["Not dated yet"], "cmf-date-v cmf-undated"),
          p(["Human curation of credit-recommendation wordings is paused; restarting it or adopting a rule would bring a date back."], "cmf-date-n"),
          method("Calculation Method", [p([curationMethod(M)])])
        ])
      ]),
      bars(M)
    ]);
  }

  function needs(M) {
    var H = M.held;
    var heldWords = H.unsure != null ? " (the title-sorting routine is unsure on " + H.unsure + ", a merge would join two issuers on " + H.issuers + ", a course code is left in the title on " + H.code + ")" : "";
    return el("section", { cls: "cmf-needs", "aria-labelledby": "cmf-needs-h" }, [
      el("h3", { id: "cmf-needs-h", cls: "cmf-needs-h", text: "Needs you" }),
      el("div", { cls: "cmf-needs-grid" }, [
        el("div", { cls: "cmf-need" }, [el("h4", { text: "Decisions waiting" }),
          p(["None waiting. The November 18 ruling that eight titles joining two whole names with a slash stay as printed stands unless you change it."]),
          p([a("#commons/details", "Decision record")], "cmf-need-links")]),
        el("div", { cls: "cmf-need" }, [el("h4", { text: "Fixes owed to you" }),
          p(["Five common-course cards you already ruled on (shared course IDs " + ASKED.doubt.slice(0, -1).join(", ") + ", and " + ASKED.doubt[ASKED.doubt.length - 1] + ") are still in the discipline-in-doubt file on main, with no landed ruling in the November 19 curation snapshot. Nothing for you to decide."]),
          p([a("#coci-lookup/list/doubt", "Open the discipline-in-doubt list")], "cmf-need-links")]),
        el("div", { cls: "cmf-need" }, [el("h4", { text: "Rows waiting on a person" }),
          p(["Course outlines blocked: " + ASKED.outlinesBlocked.cards + " cards, " + ASKED.outlinesBlocked.current + " current. Send any outline or catalog PDF to COBIx, who prepares it and hands Sky one ask."]),
          p([a("#collect/outlines-blocked", "Open the list of those colleges")], "cmf-need-links"),
          p([a("#exhibits/held", fmt(H.n) + " titles"), " held for a person" + heldWords + "."]),
          p(["· a curator"], "cmf-owner")])
      ])
    ]);
  }

  /* One card: title, pill, headline (its number stays when folded), meter, body (clamped to six lines), the method
     toggle (which un-clamps the body) and the reserved link row. */
  function card(o) {
    var art = el("article", { cls: "cmf-card", "data-key": o.key, id: o.id || null, "aria-labelledby": "cmf-t-" + o.key });
    var fold = el("button", { type: "button", cls: "cmn-word cmf-fold", "aria-expanded": "true", "aria-controls": "cmf-x-" + o.key, text: "Collapse" });
    art.appendChild(el("div", { cls: "cmf-card-head" }, [el("h3", { id: "cmf-t-" + o.key, cls: "cmf-card-t", text: o.title }),
      o.pill ? el("span", { cls: "cmn-pill cmf-pill" + (o.pillCls ? " " + o.pillCls : ""), text: o.pill }) : null, fold]));
    art.appendChild(el("p", { cls: "cmf-headline" }, [el("strong", { cls: "cmf-big", text: o.big }), el("span", { cls: "cmf-rest" }, o.rest)]));
    var x = el("div", { cls: "cmf-x", id: "cmf-x-" + o.key });
    (o.after || []).forEach(function (n) { x.appendChild(n); });
    x.appendChild(el("div", { cls: "cmf-body" }, o.body));
    x.appendChild(method(o.methodLabel || "Counting Method", o.method, function (open) { art.classList.toggle("cmf-unclamped", open); }));
    art.appendChild(x);
    art.appendChild(el("nav", { cls: "cmf-links", "aria-label": o.title + " links" }, (o.links || []).map(function (l) { return a(l[1], l[0]); })));
    art._fold = fold;
    return art;
  }

  function cards(M) {
    var P = M.programs, Cl = M.colleges, Co = M.courses, Cd = M.cards, E = M.exhibits, R = M.cr, X = ASKED.cr, K = ASKED.credentials;
    var sloPct = pct(Co.slo, Co.active), objPct = pct(Co.obj, Co.active), progPct = pct(P.complete, P.active);
    var collect = [
      card({ key: "colleges", title: "Colleges and catalogs", pill: "catalog blocked: " + fmt(Cl.blocked), pillCls: Cl.blocked ? "cmn-pill-needs" : "cmn-pill-done",
        big: fmt(Cl.collected), rest: [" colleges with a collected catalog"],
        body: [p(["Catalogs read for every college, plus what’s still blocked."]),
          p([fmt(Cl.collected) + " means we have read each college’s catalog and have saved a read of its ", a("#program-requirements/list", "program requirements"),
            ", at least once. It does not mean we already have everything we need from each college. Still missing: " + fmt(P.active - P.complete) + " Active programs left to finish (every college still has some); course outlines, student learning outcomes, and course objectives (a public outline link is on file for " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges); and " + ASKED.evergreen + "’s saved catalog read is still from the 2025–2026 catalog and needs a re-read for the newest year."])],
        method: [p(["“Collected” means we have saved a program-requirements catalog read for the college — the catalog has been read at least once. “Not collected yet” would mean no such saved read exists; today that count is " + fmt(Cl.total - Cl.collected) + ", and catalog blocked is " + fmt(Cl.blocked) + ". Some adoption lists also include " + fmt(Cl.ce) + " continuing-education campuses, which is why ASE coverage uses " + fmt(Cl.total + Cl.ce) + " names. The statewide district count is " + fmt(Cl.districts) + ": " + fmt(Cl.districts - 1) + " districts plus Calbright. Open the ", a("#collect", fmt(Cl.total) + "-college list"), " for the college-by-college view."])],
        links: [[fmt(Cl.total) + "-college list", "#collect"]] }),
      card({ key: "programs", title: "Programs", pill: "In progress",
        big: fmt(P.complete) + " of " + fmt(P.active), rest: [" Active programs complete at ", a("#collect", fmt(Cl.collected) + " colleges")],
        after: [meter(progPct, fmt(P.complete) + " of " + fmt(P.active) + " complete, " + Math.round(progPct) + " percent")],
        body: [p(["Each college program’s requirements, read from its catalog."]),
          p([fmt(P.complete) + " of " + fmt(P.active) + " (" + Math.round(progPct) + "%). Target: every Active program in its college’s current catalog, about " + fmt(P.target) + " (" + fmt(P.active) + " minus the COCI-only programs). On pace for: " + (P.doneN == null ? "not dated yet" : monthDay(P.doneN)) + " for that target."])],
        method: [p([fmt(P.complete) + " of " + fmt(P.active) + " is the live count of Active programs with a complete record. " + fmt(P.gap) + " have a gap noted; " + fmt(P.unread) + " have no record yet; " + fmt(P.confirmed) + " have been confirmed by a person, " + fmt(P.confirmedComplete) + " of them complete. A wider count of " + fmt(P.wider) + " of " + fmt(P.widerOf) + " adds Approved programs, which are approved but not yet offered (" + fmt(P.approved) + "), and Teachout programs, which are being phased out (" + fmt(P.teachout) + "). The collection target is every Active program in its college’s current catalog: " + fmt(P.active) + " minus the COCI-only programs, about " + fmt(P.target) + ", which leaves about " + fmt(P.left) + ". About " + fmt(P.cociOnly) + " COCI-only programs (active in the Chancellor’s Office curriculum inventory but not in the current catalog) are optional cleanup, not unfinished work, and are not part of that target. " + (P.doneN == null ? "" : "On pace, at about " + fmt(Math.round(P.pace)) + " a day, that target finishes " + longDate(P.doneN) + ". ") + "The older 72% “passing” card is cut from this page. ", a("#program-requirements/list", "Open the programs list"), "."])],
        links: [["Open Programs", "#program-requirements/list"]] }),
      card({ key: "courses-data", id: "courses-data", title: "Courses data", pill: "In progress",
        big: fmt(Co.slo) + " of " + fmt(Co.active), rest: [" courses in active programs have student learning outcomes"],
        after: [meter(sloPct, fmt(Co.slo) + " of " + fmt(Co.active) + " have SLOs, " + Math.round(sloPct) + " percent")],
        body: [p(["Course outlines, plus student learning outcomes (SLOs) and course objectives, collected from each college."]),
          p([fmt(Co.slo) + " of " + fmt(Co.active) + " have SLOs (" + Math.round(sloPct) + "%), and " + fmt(Co.obj) + " have course objectives (" + Math.round(objPct) + "%). Target: SLOs and objectives for every course we can already read automatically. The count of those readable courses is not computed yet (Sky would add it). Dates: pending readable-course count. The rest need people or a district request. A bot test found about 43% of colleges readable (range 35–65%); the Los Angeles district’s 9 colleges need a district request."]),
          p(["Course outlines blocked: " + ASKED.outlinesBlocked.cards + " cards, " + ASKED.outlinesBlocked.current + " current. A public outline link is on file for " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges. " + fmt(Co.sloColleges) + " colleges have any SLOs in the live statewide count; " + fmt(Co.objColleges) + " have objectives. Those " + fmt(Co.sloColleges) + " are not the same as the " + fmt(M.building.outcomeColleges) + " colleges on the Building line’s deeper outcomes read."])],
        method: [p([fmt(Co.active) + " is the number of courses that appear in Active programs statewide. " + fmt(Co.slo) + " of those already have student learning outcomes on file, and " + fmt(Co.obj) + " have course objectives (a course can have both). Those are live statewide counts. A separate Building-line read has " + fmt(M.building.outcomes) + " outcomes from " + fmt(M.building.outcomeCourses) + " courses at " + fmt(M.building.outcomeColleges) + " colleges; it is not the same " + fmt(Co.sloColleges) + "-college live SLO cut. The recent rates are measured from those nights, not one fixed nightly estimate: from the " + ASKED.sloSnap.at + " snapshot to this page’s counts, about one and a half days, SLOs grew by " + fmt(Co.sloGrow) + " (" + fmt(ASKED.sloSnap.slo) + " to " + fmt(Co.slo) + ") and objectives by " + fmt(Co.objGrow) + " (" + fmt(ASKED.sloSnap.obj) + " to " + fmt(Co.obj) + "). "
          + (Co.objDoneN != null && Co.sloDoneN != null ? "If every one of the " + fmt(Co.active) + " were already readable, objectives at about " + fmt(Math.round(Co.objGrow / 100) * 100) + " a night would finish around " + longDate(Co.objDoneN) + " (" + fmt(Co.objLeft) + " left), and SLOs at about " + fmt(Math.round(Co.sloGrow / 100) * 100) + " a night around " + longDate(Co.sloDoneN) + " (" + fmt(Co.sloLeft) + " left). " : "")
          + "Those dates are not shown, because a finish date should be set only for courses that can already be read automatically, and that readable-course count is not computed yet."])],
        links: [["Outlines blocked", "#collect/outlines-blocked"], ["Courses List", "#coci-lookup/courses"]] })
    ];
    var cardPct = pct(Cd.ready, Cd.total), exPct = pct(E.stamped, E.titles);
    var curate = [
      card({ key: "courses", title: "Courses and M-IDs", pill: "In progress",
        big: fmt(Cd.ready) + " of " + fmt(Cd.total), rest: [" cards the automatic check scores as ready (0.85 or better)"],
        after: [meter(cardPct, fmt(Cd.ready) + " of " + fmt(Cd.total) + " ready, " + Math.round(cardPct) + " percent")],
        body: [p(["Local courses grouped into shared common courses, each with a shared course ID (an M-ID)."]),
          p([el("strong", { text: "M-ID gap — not counted yet" }), " A once-through count of program courses with no shared course ID is not counted yet. Open the Courses list’s ", a("#coci-lookup/list/nomid", "No M-ID filter"), ". One known cause: " + fmt(ASKED.missingMembership) + " cards are missing from the published list of which local courses belong to each shared course (a membership fix)."])],
        method: [p(["Of the " + fmt(Cd.total) + " cards, " + fmt(Cd.review) + " need review, " + fmt(Cd.repair) + " need repair, and " + fmt(Cd.notReady) + " are not ready. " + fmt(Cd.confirmed) + " have been confirmed by a person, " + fmt(Cd.confirmedReady) + " of them ready. The " + fmt(Cd.ready) + " ready cards are those the automatic check scores 0.85 or better. The M-ID gap is a placeholder; it is not the older 2,362 of 8,912 figure, which this page does not show. Five cards you already ruled on are still in the discipline-in-doubt file — see the ", a(REPO + "3447", "Backfill fix"), "."])],
        links: [["Open the Courses List", "#coci-lookup/courses"], ["No M-ID filter", "#coci-lookup/list/nomid"]] }),
      card({ key: "exhibit", title: "Exhibit titles", pill: "In progress",
        big: fmt(E.stamped) + " of " + fmt(E.titles), rest: [" local titles reviewed"],
        after: [meter(exPct, fmt(E.stamped) + " of " + fmt(E.titles) + " reviewed, " + Math.round(exPct) + " percent")],
        body: [p(["The local titles colleges use in MAP, each filed under one credential name."]),
          p([fmt(E.noSubject) + " credentials (464 exhibits) have no common subject code yet. That queue is growing: " + fmt(ASKED.noSubjectWas.n) + " on " + ASKED.noSubjectWas.day + ", now " + fmt(E.noSubject) + "."]),
          p([fmt(E.left) + " old titles no college uses in MAP any more."])],
        method: [p(["The exhibit name list has " + fmt(E.names) + " names, " + fmt(E.names - K.of) + " more than the " + fmt(K.of) + " credentials on the Credentials card. Cleanup lists: ", a("#exhibits/held", fmt(M.held.n) + " titles held for a person"), "; ", a("#exhibits/list/nosubj", fmt(E.noSubject) + " with no common subject code"), "; ", a("#exhibits/list/left", fmt(E.left) + " old titles"),
          " (a local wording the Commons still files under a shared name, but no college’s current MAP exhibit uses it any more, usually because the college renamed or retyped it — for example, “Automotive Services Excellence (A5: Brakes) Certificate” sits under “ASE A5 — Brakes,” which current MAP titles already cover; nothing breaks while it stays); and ", a("#exhibits/renamed", fmt(E.renamed) + " renamed titles"),
          ". Of the " + fmt(E.titles) + " local titles, " + fmt(E.stamped) + " carry a review stamp (" + fmt(E.person) + " a person’s, " + fmt(E.cohort) + " a review-group’s), counting " + fmt(E.backlog) + " titles MAP carries with no entry yet."])],
        links: [["Open Exhibits", "#exhibits/list"], [fmt(M.held.n) + " held", "#exhibits/held"], [fmt(E.left) + " old titles", "#exhibits/list/left"], ["No subject code", "#exhibits/list/nosubj"]] })
    ];
    var seg = [["settled", X.settled, "cmf-seg-settled"], ["rule", X.rule, "cmf-seg-rule"], ["ace", X.ace, "cmf-seg-ace"], ["cannot", X.cannot, "cmf-seg-cannot"]];
    function share(n) { return (n / X.rows * 100).toFixed(2) + "%"; }
    var crBar = el("div", { cls: "cmf-stack", role: "img", "aria-label": "Of " + fmt(X.rows) + ": " + fmt(X.settled) + " settled, " + fmt(X.rule) + " the cleanup rule would settle, " + fmt(X.ace) + " waiting on ACE recommendation text, " + fmt(X.cannot) + " matching cannot clear" },
      seg.map(function (s) { return el("i", { cls: s[2], style: "width:" + (s[1] / X.rows * 100).toFixed(2) + "%" }); }));
    var crLegend = el("ul", { cls: "cmf-crlegend" }, [
      el("li", null, [el("span", { cls: "cmf-swatch cmf-seg-settled", "aria-hidden": "true" }), fmt(X.settled) + " settled (" + share(X.settled) + "): MAP-only, with no ACE text to match."]),
      el("li", null, [el("span", { cls: "cmf-swatch cmf-seg-rule", "aria-hidden": "true" }), fmt(X.rule) + " a typographic cleanup rule would settle (" + share(X.rule) + "; a dry run, not yet applied)."]),
      el("li", null, [el("span", { cls: "cmf-swatch cmf-seg-ace", "aria-hidden": "true" }), fmt(X.ace) + " waiting on ACE’s recommendation text (" + share(X.ace) + "), which MAP already sends nightly but we don’t save yet."]),
      el("li", null, [el("span", { cls: "cmf-swatch cmf-seg-cannot", "aria-hidden": "true" }), fmt(X.cannot) + " matching can’t clear (" + share(X.cannot) + "; " + fmt(X.cannotNoExhibit) + " worklist wordings with no exhibit, " + fmt(X.cannotTruncated) + " truncated or run-on, " + fmt(X.cannotNoId) + " with no exhibit id)."])
    ]);
    var connect = [
      card({ key: "credentials", title: "Credentials", pill: "Design",
        big: fmt(K.credit) + " of " + fmt(K.of), rest: [" credentials: at least one college gives credit. The list will show how many colleges, never only a yes-or-no badge, so a student does not assume their own college gives credit."],
        body: [p(["One list, counted once per credential — including a credential a college grants credit for, or a local course exam — under one name and issuer."]),
          p(["Proposed: exhibits are the evaluations under each credential (one evaluation can carry one or more credit recommendations)."]),
          p(["The other two statuses aren’t counted yet."])],
        method: [p([fmt(K.of) + " is the count of titles folded under one name. " + fmt(K.credit) + " of them have at least one college giving credit: " + fmt(K.one) + " at one college, " + fmt(K.two5) + " at 2–5, " + fmt(K.six10) + " at 6–10, and " + fmt(K.eleven) + " at 11 or more (max " + K.max + "), across " + fmt(K.lines) + " articulation lines. The other two statuses (“Has a credit recommendation” and “No credit recommendation yet”) are not yet counted once per credential; that split waits on a stable credential id and a link from each credential to its exhibits. ", a("#credentials", "Open the list"), "."])],
        links: [["Open the credential list", "#credentials"]] }),
      card({ key: "cr", title: "Credit Recommendations", pill: "In progress",
        big: fmt(X.rows), rest: [" rows in the CR inventory ", el("span", { cls: "cmf-badge", text: "Not in tracker main yet" })],
        after: [crBar, crLegend],
        body: [p(["One wording for each credit recommendation, so the same credit reads the same everywhere."]),
          p(["Colleges’ wording shown; a rule to keep it is proposed, pending Sam. In cases like POST Basic Academy the course-number link itself may be wrong; the rule would flag those links for a check."])],
        method: [p([fmt(X.rows) + " is " + fmt(X.pairs) + " exhibit-plus-wording pairs plus " + fmt(X.noExhibit) + " worklist wordings with no exhibit. This is the inventory that rules actually move; it is not in the tracker on main yet. Two other counts measure different things: " + fmt(X.crm) + " is the count in MAP’s Custom Reporting Module, and the Commons page today tracks a narrower set — " + fmt(R.settled) + " of " + fmt(R.wordings) + " wordings settled (" + fmt(R.rule) + " by a rule, " + fmt(R.curator) + " more by a curator). Those " + fmt(R.settled) + " have not moved since " + X.since + " because human credit-recommendation curation is paused, and rule-settled counts only grow when a new rule ships. The credit-recommendation line should later point at this " + fmt(X.rows) + "-row inventory. On the " + fmt(R.groups) + " groups: colleges’ wording shown; a rule to keep it is proposed, pending Sam. In the POST Basic Academy group, " + X.post.colleges + " colleges (" + X.post.rows + " rows) wrote “3 hours in Physical Training and Health Education (CSU GE Area E),” linked to C-ID AJ 110, whose official title is “Introduction to Criminal Justice.” In cases like POST Basic Academy the course-number link itself may be wrong; the rule would flag those links for a check. ", a("#cr-reference/open", "Wordings still open"), "."])],
        links: [["Open Credit Recommendations", "#cr-reference"], ["Name-check groups", "#cr-reference/names"]] }),
      card({ key: "interconnect", title: "Interconnectivity", pill: "5 blocked", pillCls: "cmn-pill-needs",
        big: "5 blocked", rest: [", 4 APIs that would help, and 4 datasets to integrate"],
        body: [
          el("h4", { cls: "cmf-sub", text: "Blocked" }),
          el("ul", null, [
            el("li", { text: "ACE recommendation text (CreditRecommendation column) · fetched nightly, not stored · ask Sky · " + fmt(X.ace) + " rows" }),
            el("li", { text: "MAP CR ID · missing from the MAP report view we sync from · raised with Sam" }),
            el("li", { text: "Course outlines at the Los Angeles district’s 9 colleges · district request" }),
            el("li", { text: "eLumen guest sign-in (eLumen, a curriculum system some colleges use) · Sam’s call; we don’t use it" }),
            el("li", { text: "CourseLeaf CIM behind sign-ins (Pasadena) · blocked" })]),
          el("h4", { cls: "cmf-sub", text: "APIs that would help" }),
          el("ul", null, [
            el("li", { text: "MAP API, to port credentials and exhibits · planned" }),
            el("li", { text: "Credential Engine ID (CTID) for credentials and credit recommendations · ask Malone" }),
            el("li", { text: "curriQunet/CurricUNET public report endpoints · work at CCSF" }),
            el("li", { text: "eLumen catalog API (eLumen, a curriculum system some colleges use) · would help" })]),
          el("h4", { cls: "cmf-sub", text: "Datasets to integrate" }),
          el("ul", null, [
            el("li", { text: "JST education section · MAP stores it; COBI doesn’t use it yet" }),
            el("li", { text: "COCI · integrated" }),
            el("li", { text: "Course outline links · " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges on file" }),
            el("li", { text: "Peer-articulation exhibit IDs · " + fmt(X.cannotNoExhibit) + " worklist wordings have no exhibit" })])],
        methodLabel: "More detail",
        method: [p(["ACE recommendation text, from the CreditRecommendation column, is fetched nightly but not stored; ask Sky. That is the " + fmt(X.ace) + "-row wait on the Credit Recommendations card. The MAP CR ID is missing from the MAP report view we sync from; that has been raised with Sam. Course outlines at the Los Angeles district’s 9 colleges need a district request. We do not use eLumen guest sign-in (eLumen is a curriculum system some colleges use); that is Sam’s call. CourseLeaf CIM at Pasadena sits behind sign-ins. The MAP API would port credentials and exhibits to Malone’s new MAP exhibit module; that work is planned. Ask Malone whether COBI gets Credential Engine IDs (CTIDs) minted under its own org when it publishes, for credentials and for credit recommendations. " + fmt(ASKED.ctid) + " of " + fmt(M.building.industry) + " catalog rows have a Credential Engine ID (CTID) today. Public report endpoints for curriQunet/CurricUNET would help; work on those is under way at City College of San Francisco. An eLumen catalog API would also help. The JST education section holds non-military certifications, CCC courses, and assessments; MAP stores that section, and COBI doesn’t use it yet. COCI, the Chancellor’s Office curriculum inventory, is already integrated; ask the Chancellor’s Office for an API or a full extract with SLOs and objectives. Today’s extract has descriptions only: " + fmt(ASKED.noDescription) + " active courses have none, and retired courses are marked inconsistently. A public course outline link is on file for " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges. " + fmt(X.cannotNoExhibit) + " worklist wordings have no peer-articulation exhibit ID."])],
        links: [] })
    ];
    return { collect: collect, curate: curate, connect: connect };
  }

  function group(id, name, list) {
    return el("section", { cls: "cmf-group", "aria-labelledby": "cmf-g-" + id }, [el("h3", { cls: "cmf-group-h", id: "cmf-g-" + id, text: name }),
      el("div", { cls: "cmf-group-cards" }, list)]);
  }

  /* ── the page ── */
  function render(root, M) {
    ensureCss();
    migrate();
    root.removeAttribute("style");
    root.textContent = "";
    var all = [];
    var C = cards(M);
    all = C.collect.concat(C.curate, C.connect);
    function setFold(card, folded) {
      card.classList.toggle("cmf-folded", folded);
      card._fold.textContent = folded ? "Expand" : "Collapse";
      card._fold.setAttribute("aria-expanded", folded ? "false" : "true");
    }
    function save() {
      var keys = all.filter(function (c) { return c.classList.contains("cmf-folded"); }).map(function (c) { return c.getAttribute("data-key"); });
      put(FOLD_KEY, JSON.stringify(keys));
      var btn = document.getElementById("cmf-all");
      if (btn) btn.textContent = keys.length === all.length ? "Expand all" : "Collapse all";
    }
    var head = header(M, function () {
      var every = all.every(function (c) { return c.classList.contains("cmf-folded"); });
      all.forEach(function (c) { setFold(c, !every); });
      save();
    });
    var folded = readFold();
    all.forEach(function (c) {
      setFold(c, folded.indexOf(c.getAttribute("data-key")) >= 0);
      c._fold.addEventListener("click", function () { setFold(c, !c.classList.contains("cmf-folded")); save(); });
    });
    var B = M.building;
    var wrap = el("div", { cls: "cmn-wrap cmf" }, [
      head,
      eta(M),
      needs(M),
      el("div", { cls: "cmf-groups" }, [group("collect", "Collect", C.collect), group("curate", "Curate", C.curate), group("connect", "Connect", C.connect)]),
      p([el("strong", { text: "Building. " }), "Skills — issuer-published skills on " + fmt(B.skillsCreds) + " credentials so far. Also underway: " + fmt(B.industry) + " industry credentials from " + fmt(B.issuers) + " issuers, and a deeper outcomes read (" + fmt(B.outcomes) + " outcomes from " + fmt(B.outcomeCourses) + " courses at " + fmt(B.outcomeColleges) + " colleges so far)."], "cmf-line"),
      p([el("strong", { text: "More collection detail. " }), "The ", a("#collect", fmt(M.colleges.total) + "-college list"), ", districts, the data dictionary, APIs, sharing, and integrations move here from the old College Data Collection page."], "cmf-line"),
      p(["Scorecard (coverage and student outcomes) fills in here once both are built."], "cmf-line cmf-muted")
    ]);
    root.appendChild(el("div", { cls: "cmn-page cmf-page" }, [wrap]));
    save();
    return wrap;
  }

  function boot(root, C) {
    return Promise.all([readJson(FILES.program), readJson(FILES.data), readJson(FILES.skills)]).then(function (r) {
      var M = model(C, r[0], r[1], r[2]);
      render(root, M);
      return M;
    });
  }

  var TOKENS = [
    "#tab-commons { --cmf-s-programs:var(--seal-blue-text); --cmf-s-skills:#FFB600; --cmf-s-slo:#40B4E5; --cmf-s-obj:#D18A00; --cmf-seg-rule:#40B4E5; --cmf-seg-ace:#C9D4E2; --cmf-seg-cannot:#D18A00; }",
    ":root[data-theme=\"dark\"] #tab-commons { --cmf-seg-ace:var(--border-strong); }",
    "@media (prefers-color-scheme: dark) { :root:not([data-theme=\"light\"]) #tab-commons { --cmf-seg-ace:var(--border-strong); } }"
  ].join("\n");
  var CSS = [
    /* Full window width: no centered cap (the ask's layout), the page's own padding. */
    ".cmf-page { margin:0 -16px; padding:12px 24px 48px; }",
    /* The front page starts near the header so Needs you clears the fold at 1280x900 (the ask's layout rule). */
    "#tab-commons .main-container:has(.cmf-page) { padding-top:8px; }",
    ".cmn-wrap.cmf { max-width:none; gap:20px; }",
    ".cmf-top-row { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:8px 24px; }",
    ".cmf .cmn-rule { margin:10px 0 10px; }",
    ".cmf .cmn-lede { font-size:1rem; }",
    ".cmf .cmn-sub { margin-top:4px; font-size:.9rem; }",
    ".cmf .cmn-lede { max-width:var(--cpl-measure,none); }",
    ".cmf-eta { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-top:4px solid var(--cmn-gold); border-radius:12px; padding:12px 20px; display:grid; gap:6px; }",
    ".cmf-eta-h, .cmf-needs-h { margin:0; font-family:var(--cmn-serif); font-size:1.25rem; color:var(--cmn-heading); }",
    ".cmf-status { margin:0; color:var(--cmn-ink-2); }",
    ".cmf-dates { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap:12px 24px; }",
    ".cmf-date { display:grid; gap:4px; align-content:start; min-width:0; }",
    ".cmf-date p { margin:0; }",
    ".cmf-date-l { font-weight:700; color:var(--cmn-heading); }",
    ".cmf-date-v { font-family:var(--cmn-serif); font-size:1.5rem; font-weight:700; color:var(--cmn-title); line-height:1.15; }",
    ".cmf-undated { color:var(--cmn-ink-2); }",
    ".cmf-date-n { color:var(--cmn-ink-2); font-size:.84rem; line-height:1.4; }",
    ".cmf-method > summary { list-style:none; cursor:pointer; display:inline-flex; align-items:center; min-height:24px; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.9rem; }",
    ".cmf-method > summary::-webkit-details-marker { display:none; }",
    ".cmf-method > summary:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".cmf-method-body p { margin:6px 0 0; color:var(--cmn-ink-2); font-size:.9rem; }",
    ".cmf-bars { margin:0; display:grid; gap:4px; }",
    ".cmf-bars figcaption { color:var(--cmn-ink-2); font-size:.84rem; }",
    ".cmf-bars-svg { width:100%; height:40px; display:block; }",
    ".cmf-barfoot { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:4px 18px; }",
    ".cmf-tablefold[open] { flex-basis:100%; }",
    ".cmf-b-programs { fill:var(--cmf-s-programs); } .cmf-b-skills { fill:var(--cmf-s-skills); } .cmf-base { stroke:var(--cmn-line); stroke-width:1; }",
    ".cmf-legend, .cmf-crlegend { list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:2px 16px; font-size:.8rem; color:var(--cmn-ink-2); }",
    ".cmf-crlegend { display:grid; gap:4px; }",
    ".cmf-legend li, .cmf-crlegend li { display:flex; align-items:baseline; gap:6px; }",
    ".cmf-swatch { display:inline-block; flex:0 0 auto; width:10px; height:10px; border-radius:2px; }",
    ".cmf-tablewrap { overflow-x:auto; margin-top:6px; }",
    ".cmf-tablewrap:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cmf-table { border-collapse:collapse; font-size:.85rem; font-variant-numeric:tabular-nums; min-width:22rem; }",
    ".cmf-table caption { text-align:left; color:var(--cmn-muted); padding-bottom:4px; }",
    ".cmf-table th, .cmf-table td { text-align:left; padding:3px 12px 3px 0; border-bottom:1px solid var(--cmn-line-soft); color:var(--cmn-ink); }",
    ".cmf-needs { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:16px 22px; display:grid; gap:10px; }",
    ".cmf-needs-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap:12px 24px; }",
    ".cmf-need { display:grid; gap:4px; align-content:start; min-width:0; }",
    ".cmf-need h4 { margin:0; font-size:.98rem; color:var(--cmn-heading); }",
    ".cmf-need p { margin:0; color:var(--cmn-ink-2); font-size:.92rem; }",
    ".cmf-owner { color:var(--cmn-muted); }",
    ".cmf a { color:var(--cmn-link); text-underline-offset:3px; }",
    ".cmf a:hover { color:var(--cmn-heading); }",
    ".cmf a:focus-visible, .cmf button.cmn-word:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".cmf-need-links a, .cmf-links a, .cmf-need a { display:inline-block; min-height:24px; line-height:24px; }",
    /* The ask's minmax(340px) with COBI's side menu leaves ~950px at 1280, two groups wide; 280px keeps Collect /
       Curate / Connect side by side at 1280, which is what the ask wants, and a phone still gets one column. */
    ".cmf-groups { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap:20px; align-items:start; }",
    ".cmf-group { display:grid; gap:12px; min-width:0; }",
    ".cmf-group-h { margin:0; font-size:.82rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--cmn-muted); }",
    ".cmf-group-cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap:16px; }",
    ".cmf-dates p.cmf-date-v { margin:0; }",
    ".cmf-card { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:18px 20px; display:flex; flex-direction:column; gap:10px; min-width:0; min-height:44rem; box-sizing:border-box; }",
    ".cmf-card-head { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 12px; }",
    ".cmf-card-t { margin:0; flex:1 1 auto; font-family:var(--cmn-serif); font-size:1.25rem; line-height:1.2; color:var(--cmn-heading); }",
    ".cmf-headline { margin:0; color:var(--cmn-ink-2); font-size:.95rem; font-variant-numeric:tabular-nums; }",
    ".cmf-big { font-family:var(--cmn-serif); font-size:1.75rem; font-weight:700; color:var(--cmn-title); letter-spacing:-0.02em; margin-right:4px; }",
    ".cmf-badge { display:inline-block; margin-left:4px; padding:1px 8px; border-radius:999px; background:var(--cmn-ask-bg); color:var(--cmn-ask-fg); font-size:.76rem; font-weight:700; }",
    ".cmf-x { display:flex; flex-direction:column; gap:10px; min-width:0; }",
    ".cmf-meter { height:8px; border-radius:999px; background:var(--cmn-track); overflow:hidden; }",
    ".cmf-meter i { display:block; height:100%; border-radius:999px; background:var(--cmn-accent); }",
    ".cmf-stack { display:flex; height:10px; border-radius:999px; overflow:hidden; background:var(--cmn-track); }",
    ".cmf-stack i { display:block; height:100%; }",
    ".cmf-seg-settled { background:var(--cmn-accent); } .cmf-seg-rule { background:var(--cmf-seg-rule); } .cmf-seg-ace { background:var(--cmf-seg-ace); } .cmf-seg-cannot { background:var(--cmf-seg-cannot); }",
    /* Six lines, then an ellipsis; the max-height clamps nested lists too. Opening the card's method un-clamps it. */
    ".cmf-body { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:6; line-clamp:6; overflow:hidden; max-height:calc(6 * 1.5em); line-height:1.5; font-size:.92rem; color:var(--cmn-ink); }",
    ".cmf-body p, .cmf-body ul, .cmf-body h4 { margin:0 0 4px; }",
    ".cmf-body ul { padding-left:18px; }",
    ".cmf-sub { font-size:.88rem; color:var(--cmn-heading); }",
    ".cmf-unclamped .cmf-body { display:block; -webkit-line-clamp:unset; line-clamp:none; max-height:none; overflow:visible; }",
    ".cmf-links { margin-top:auto; min-height:3.4rem; display:flex; flex-wrap:wrap; align-content:flex-end; gap:4px 18px; font-size:.9rem; border-top:1px solid var(--cmn-line-soft); padding-top:8px; }",
    /* Folded: the title and the headline number only. */
    ".cmf-card.cmf-folded { min-height:0; }",
    ".cmf-folded .cmf-x, .cmf-folded .cmf-links, .cmf-folded .cmf-pill, .cmf-folded .cmf-rest { display:none; }",
    ".cmf-line { margin:0; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".cmf-muted { color:var(--cmn-muted); font-size:.9rem; }",
    "@media (max-width: 560px) { .cmf-page { margin:0; padding:20px 16px 36px; } .cmf-card { padding:16px; min-height:0; } .cmf-groups { grid-template-columns:minmax(0, 1fr); } .cmf-eta, .cmf-needs { padding:14px 16px; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cmf-css")) return;
    document.head.appendChild(el("style", { id: "cmf-tokens", text: TOKENS }));
    document.head.appendChild(el("style", { id: "cmf-css", text: CSS }));
  }

  window.CPL_COMMONS_FRONT = { boot: boot, model: model, render: render, migrate: migrate, readFold: readFold, KEYS: KEYS,
    FOLD_KEY: FOLD_KEY, ORDER_KEY: ORDER_KEY, DETAILS_ORDER_KEY: DETAILS_ORDER_KEY, DETAILS_FOLD_KEY: DETAILS_FOLD_KEY, FILES: FILES, ASKED: ASKED };
})();
