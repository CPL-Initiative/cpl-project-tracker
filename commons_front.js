// commons_front.js — the CPL Commons front page: one page for the Commons, with the College Data Collection page
// folded in (#3533; Sam's go, Nov 19, 2026, 2:49 AM PT, and "build the CPL Commons page now", 4:28 AM PT, relayed by
// COBIx in #3533 comment 7006930860). Top to bottom (Sam's clarity asks of 2026-11-21, items 1 to 9): the header and
// Sam's lede, Phase 1 Dates (Data Collection and Data Curation Phase 1 ETA, each estimated or TBA) with the daily chart
// (records a day, the pace needed, a trend, cost a day), Needs you (at most 12 ranked links, then the cards they open),
// ten cards in Collect / Curate / Connect, the Plan card, the Building line, the More collection detail line and the
// scorecard line. Guards: tests/commons_front.test.js, tests/commons_page_clarity.test.js, tests/commons_way_back.test.js.
//
// What it reads (committed files the site already serves; it WRITES NOTHING but the fold, in this browser):
//   kb/status/commons.json                    (handed in by commons.js, which loaded it) the cards' figures:
//                                             courses, exhibits, credit recommendations, subjects, building.
//   kb/status/program-requirements.json       headline: the Active programs complete per day, which give the
//                                             programs figure, the pace, the projected date and the daily bars.
//   kb/status/commons_data.json               statewide and live: colleges collected, the program bases, the
//                                             course SLO and objective counts, the outline links.
//   kb/reference/industry_credential_skills.json   harvested_on: the issuer-published skills collected per day.
//   kb/status/local_subject_titles.json       the Subjects card's Step b: local subject titles drafted from the printed
//                                             catalogs (kb/_build_local_subject_titles.py). Read on its own, so a
//                                             missing file reads TBA and the rest of the page still draws.
//   kb/status/commons_history.json            the references' daily settled counts: the Data Curation Phase 1 ETA.
//   kb/reference/model_spend_daily.json       cost a day, the chart's second panel (the ETA clock's Show costs source).
//   commons_data.js (College Data Collection's own filters, loaded by commons.js) for the College Data Collection card.
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
    skills: "kb/reference/industry_credential_skills.json", subjects: "kb/status/local_subject_titles.json",
    held: "kb/status/held_subject_codes.json", history: "kb/status/commons_history.json", spend: "kb/reference/model_spend_daily.json" };
  /* Collect / Curate / Connect, then the Plan (Sam, 2026-11-21, item 4: "check every card sits under the right one"):
     Credentials and Credit Recommendations are curated references, so they sit under Curate. */
  var KEYS = ["colleges", "programs", "courses-data", "cdc", "subjects", "courses", "exhibit", "credentials", "cr", "interconnect", "plan"];
  var MIN_DAYS = 5;   /* a pace window needs a count on at least 5 of its days, or its date reads TBA (item 3) */
  var RANK_CAP = 12;  /* Needs you shows at most 12 links (item 1) */
  var DAYS = 30;   /* the same window as the live College Collections ETA (commons_eta_clock.js, DAYS=30) */
  var REPO = "https://github.com/CPL-Initiative/cpl-project-tracker/issues/";

  /* Figures with no single committed source on main yet, as COBIx's ask gives them (#3533 comment 7006930860, read
     against origin/main 09e5c0d1 and the program-requirements snapshot written 2026-11-19T09:27:50Z). Each names its
     source; when one lands on main, read it in model() and drop it here. */
  /* The one program-records computation (#3566); commons.js loads it before this file. */
  function PRG() {
    if (!window.CPL_PROGRAM_RECORDS) throw new Error("commons_program_records.js is not loaded");
    return window.CPL_PROGRAM_RECORDS;
  }
  var ASKED = {
    get cociOnly() { return PRG().COCI_ONLY; },   /* COCI-only Active programs: one constant, in commons_program_records.js */
    sloSnap: { at: "November 17, 2026, 1:59 PM PT", slo: 13293, obj: 9680 },   /* the snapshot the recent rates start from */
    missingMembership: 4036,    /* cards missing from the published membership list (the membership fix) */
    noSubjectWas: { day: "November 12", n: 366 },   /* the no-common-subject queue a week ago */
    evergreen: "Evergreen Valley College",           /* the one saved catalog read still from 2025–2026 */
    credentials: { of: 2896, credit: 1603, one: 1261, two5: 247, six10: 58, eleven: 37, max: 32, lines: 4239 },
    cr: { rows: 31055, pairs: 29701, noExhibit: 1354, settled: 2235, rule: 859, ace: 25984, cannot: 1977,
      cannotNoExhibit: 1315, cannotTruncated: 593, cannotNoId: 69, crm: 17466, since: "November 4",
      post: { colleges: 19, rows: 139 } },
    ctid: 51,                   /* catalog rows with a Credential Engine ID (CTID) */
    noDescription: 6373,        /* active COCI courses with no description */
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

  /* ── a day's spend (item 7's second panel): the account totals Sam pastes (Console API plus Claude Code credit bought
     that day) where the day has them, else the reading jobs' and sessions' own figures; the same source and the same
     rule as the College Collections ETA's Show costs (commons_eta_clock.js). null where the file holds no figure. ── */
  function dollars(SP, d) {
    if (!SP) return null;
    var api = (SP.api || {})[d], top = (SP.topups || {})[d];
    if (typeof api === "number" || Array.isArray(top))
      return { usd: (typeof api === "number" ? api : 0) + (Array.isArray(top) ? top.reduce(function (x, y) { return x + y; }, 0) : 0), from: "billing" };
    var r = (SP.runner || {})[d], sd = (SP.sessions || {})[d];
    if (typeof r === "number" || (sd && sd.sessions)) return { usd: (typeof r === "number" ? r : 0) + ((sd && sd.usd) || 0), from: "measured" };
    return null;
  }

  /* ── Data Curation Phase 1 ETA (item 3) ──
     The four common references Phase 1 curates (the College Collections Plan, v2 agreed final, Nov 11, 2026): exhibit
     titles, course cards, credit-recommendation wordings and common subjects, from the daily series
     kb/status/commons_history.json ("pairs": settled, universe, settled by a person). A day's curation is what it
     settled plus what a procedure set aside in bulk (a universe that shrinks), so a rule, a reader fix or a mint counts
     beside a person's hand edits (Sam, 2026-11-21: "not only hand edits"). New work arriving does not count against
     it. Each reference's date is its remaining work at its 7-day pace; the phase date is the latest. A window with a
     count on fewer than MIN_DAYS days, or an open reference with no pace, reads TBA. */
  var CUR_REFS = [{ key: "exhibit", name: "exhibit titles" }, { key: "course", name: "course cards" },
    { key: "cr", name: "credit-recommendation wordings" }, { key: "subjects", name: "common subjects" }];
  function curation(HIST) {
    var P = HIST && HIST.pairs;
    if (!P || typeof P !== "object") return { day: null, why: "file", refs: [] };
    var dayKeys = Object.keys(P).filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }).sort();
    if (!dayKeys.length) return { day: null, why: "file", refs: [] };
    var lastN = dnum(dayKeys[dayKeys.length - 1]), fromN = lastN - 7;
    function v(n, k) { var x = P[dstr(n)]; x = x && x[k]; return Array.isArray(x) && typeof x[0] === "number" && typeof x[1] === "number" ? x : null; }
    var refs = CUR_REFS.map(function (R) {
      var now = v(lastN, R.key);
      if (!now) return null;
      var remaining = Math.max(0, now[1] - now[0]), curated = 0, person = 0, counted = 0, stepDays = 0;
      for (var n = fromN + 1; n <= lastN; n++) {
        var a = v(n - 1, R.key), b = v(n, R.key);
        if (!b) continue;
        counted++;
        if (!a) continue;
        var c = Math.max(0, (b[0] - a[0]) + Math.max(0, a[1] - b[1]));
        if (c > 0) stepDays++;
        curated += c;
        if (typeof a[2] === "number" && typeof b[2] === "number") person += Math.max(0, b[2] - a[2]);
      }
      var pace = curated / 7, enough = counted >= MIN_DAYS;
      var dayN = remaining <= 0 ? lastN : enough && pace > 0 ? lastN + Math.ceil(remaining / pace) : null;
      return { key: R.key, name: R.name, settled: now[0], of: now[1], remaining: remaining, curated: curated,
        person: Math.min(person, curated), bulk: Math.max(0, curated - person), counted: counted, stepDays: stepDays, pace: pace, dayN: dayN, done: remaining <= 0 };
    }).filter(Boolean);
    if (!refs.length) return { day: null, why: "file", refs: [] };
    var open = refs.filter(function (r) { return !r.done; });
    var thin = refs.filter(function (r) { return r.counted < MIN_DAYS; });
    var undated = open.filter(function (r) { return r.dayN == null; });
    var day = thin.length || undated.length ? null : open.length ? Math.max.apply(null, open.map(function (r) { return r.dayN; })) : lastN;
    var last = open.filter(function (r) { return r.dayN === day; })[0] || null;
    return { day: day, lastN: lastN, fromN: fromN, refs: refs, undated: undated, last: last, why: thin.length ? "days" : undated.length ? "pace" : "" };
  }

  /* ── the College Data Collection card (Sam, 2026-11-21, item 8) ──
     College Data Collection's own filters (commons_data.js) count each line, so every count is the list its link
     opens. Without that module the card reads TBA. */
  function CDC() { var X = window.CPL_COMMONS_DATA; return X && typeof X.model === "function" && typeof X.filterOf === "function" ? X : null; }
  function cdcModel(D, collectEta) {
    var X = CDC();
    if (!X || !D) return null;
    var CM = X.model(D), all = CM.colleges.length;
    function list(k) { var f = X.filterOf(k); return f ? CM.colleges.filter(function (c) { return f.test(c, CM); }) : []; }
    function line(ds) {
      var stuck = list(ds + "_stuck");
      return { done: list(ds + "_done").length, progress: list(ds + "_progress").length, stuck: stuck.length,
        stuckList: stuck.map(function (c) { return { slug: X.slugOf(c), name: c.name, fix: X.stuckFix(c, ds) }; }) };
    }
    /* The one fix that reaches the most colleges: the rule's lever named at the most colleges. */
    var lev = (CM.rule && CM.rule.levers) || {}, best = null;
    Object.keys(lev).forEach(function (k) {
      var n = CM.colleges.filter(function (c) { return (X.leversOf(c)[k] || 0) > 0; }).length;
      if (n && (!best || n > best.n)) best = { key: k, n: n, what: lev[k].what || k };
    });
    var moved = list("fresh").map(function (c) { return { slug: X.slugOf(c), name: c.name }; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    return { all: all, catalogs: line("catalogs"), outlines: line("outlines"), catalogsEta: collectEta.doneN, top: best, moved: moved,
      notRead: CM.colleges.filter(function (c) { return !c.harvested; }).map(function (c) { return { slug: X.slugOf(c), name: c.name }; }) };
  }

  /* ── the model: every figure the page shows, read once ── */
  function model(C, PR, D, K, LS, HS, HIST, SPEND) {
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
    /* The program-records figure, computed once for this page and #collect (commons_program_records.js, #3566). */
    var R = PRG().compute(PR);

    /* The 30 daily bars: programs newly finished (the day's rise in complete) and issuer skills collected. */
    var skillsBy = {};
    ((K && K.credentials) || []).forEach(function (c) {
      if (!c || !c.harvested_on) return;
      var n = dnum(c.harvested_on), s = skillsBy[n] || (skillsBy[n] = { skills: 0, creds: 0 });
      s.skills += Array.isArray(c.skills) ? c.skills.length : 0; s.creds += 1;
    });
    var days = [];
    for (var n = lastN - DAYS + 1; n <= lastN; n++) {
      /* The day's rise in complete, only where both days hold their own count (a gap is no figure, never a zero). */
      var today = byDay[n], before = byDay[n - 1], sk = skillsBy[n] || { skills: 0, creds: 0 };
      days.push({ n: n, programs: today != null && before != null ? Math.max(0, today - before) : null, skills: sk.skills, creds: sk.creds,
        cost: dollars(SPEND, dstr(n)) });
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
    /* The owner names the three reasons in any order ("a merge would join two issuers 19, the classifier is unsure 12, ..."). */
    var ow = String(held.owner || ""), pick = function (re) { var m = ow.match(re); return m ? +m[1] : null; };
    var heldParts = [null, pick(/unsure (\d+)/), pick(/issuers (\d+)/), pick(/left in (\d+)/)];
    if (heldParts[1] == null || heldParts[2] == null || heldParts[3] == null) heldParts = null;
    var sloSnap = ASKED.sloSnap, sloGrow = (outcomes.slo_courses_on_active || 0) - sloSnap.slo, objGrow = (outcomes.objective_courses_on_active || 0) - sloSnap.obj;
    var sloLeft = (pc.active_courses || 0) - (outcomes.slo_courses_on_active || 0), objLeft = (pc.active_courses || 0) - (outcomes.objective_courses_on_active || 0);
    /* Data Collection Phase 1 ETA (item 3): the program-records date from the 7-day pace, dated only when the window
       holds a count on MIN_DAYS of its days and the pace rises. Course SLOs and objectives wait on a readable count. */
    var counted = 0;
    if (R.fromN != null) for (var w = R.fromN + 1; w <= lastN; w++) if (byDay[w] != null) counted++;
    var collectEta = { doneN: R.doneN != null && R.pace > 0 && counted >= MIN_DAYS ? R.doneN : null, counted: counted,
      why: R.fromN == null || counted < MIN_DAYS ? "days" : !(R.pace > 0) ? "pace" : "" };
    var needPace = collectEta.doneN != null && collectEta.doneN > lastN ? R.left / (collectEta.doneN - lastN) : null;
    return {
      lastN: lastN, written: PR.written_at || "", commonsAt: (C && C.written_at) || "",
      collectEta: collectEta, needPace: needPace, curation: curation(HIST), spendRead: !!SPEND,
      cdc: cdcModel(D, collectEta),
      /* Catalog Fixes (item 2): the colleges with no collected catalog, from the same file College Data Collection reads. */
      catalogNeed: ((D && Array.isArray(D.colleges)) ? D.colleges : []).filter(function (c) { return c && !c.harvested; })
        .map(function (c) { return { slug: c.slug || String(c.id), college: c.name, catalog_url: c.catalog_url || "" }; }),
      programs: { complete: R.complete, active: R.active || pr.active, target: R.target, cociOnly: R.cociOnly, left: R.left, gain: R.gain, pace: R.pace,
        fromN: R.fromN, exact: R.exact, doneN: R.doneN, lowN: R.lowN, prevN: R.prevN,
        gap: pr.failing, unread: pr.unread, confirmed: pr.confirmed, confirmedComplete: pr.confirmed_complete,
        wider: sw.passing, widerOf: sw.programs, approved: progs.approved, teachout: progs.teachout },
      days: days,
      hunt: (D && D.blocked_hunt) || null,   /* the still-taught courses whose outline needs a person: kb/_blocked_catalogs.py, one source for this page and #collect */
      colleges: { collected: sw.harvested, total: sw.colleges, blocked: Math.max(0, (sw.colleges || 0) - (sw.harvested || 0)),
        ce: sw.continuing_education, districts: sw.districts, outlineLinks: reg.course_outline_link, registry: reg.row || sw.colleges },
      courses: { active: pc.active_courses, slo: outcomes.slo_courses_on_active, obj: outcomes.objective_courses_on_active,
        sloColleges: sloColleges, objColleges: objColleges, sloGrow: sloGrow, objGrow: objGrow, sloLeft: sloLeft, objLeft: objLeft,
        sloDoneN: sloGrow > 0 ? lastN + Math.ceil(sloLeft / sloGrow) : null, objDoneN: objGrow > 0 ? lastN + Math.ceil(objLeft / objGrow) : null },
      cards: { ready: course.ready, total: course.total, review: course.needs_review, repair: course.needs_repair, notReady: course.not_ready,
        confirmed: course.confirmed, confirmedReady: course.confirmed_ready },
      exhibits: { stamped: ex.stamped, titles: (ex.titles || 0) + (ex.backlog || 0), person: ex.person, cohort: ex.cohort, backlog: ex.backlog,
        names: ex.credentials, noSubject: ex.no_subject, left: ex.left_map, renamed: ex.review_list },
      held: { n: held.n, unsure: heldParts ? heldParts[1] : null, issuers: heldParts ? heldParts[2] : null, code: heldParts ? heldParts[3] : null },
      cr: { settled: cr.settled, wordings: cr.wordings, rule: cr.rule_wordings, curator: cr.curator_only, groups: cr.names_to_check },
      subjects: { settled: subj.settled, of: subj.disciplines },
      /* Step b (S694): the local subject titles the Courses bot drafted from the printed catalogs; null reads TBA. */
      localTitles: LS && LS.totals ? { colleges: LS.totals.colleges, named: LS.totals.named, collegesNamed: LS.totals.colleges_named,
        codes: LS.totals.catalog_codes, oneSided: (LS.totals.catalog_only || 0) + (LS.totals.state_only || 0),
        catalogOnly: LS.totals.catalog_only, stateOnly: LS.totals.state_only, courses: LS.totals.courses,
        notInCatalog: LS.totals.not_in_catalog || 0, notRead: LS.totals.not_read || 0, blocked: LS.totals.blocked || 0,
        untitled: LS.totals.not_in_catalog == null ? (LS.totals.codes || 0) - (LS.totals.named || 0)
          : (LS.totals.not_in_catalog || 0) + (LS.totals.not_read || 0) + (LS.totals.blocked || 0) } : null,
      /* Step a's queue (S695): the local subject codes the pile mint holds on, and the held courses they release. */
      heldCodes: HS && HS.totals ? { held: HS.totals.held, codes: HS.totals.codes, pairs: HS.totals.pairs } : null,
      building: { skillsCreds: (facts("skills").with_issuer_skills != null ? facts("skills").with_issuer_skills : cred.with_issuer_skills),
        industry: cred.credentials, issuers: cred.issuers, outcomes: out.outcomes, outcomeCourses: out.courses,
        outcomeColleges: Array.isArray(out.colleges) ? out.colleges.length : out.colleges }
    };
  }

  /* ── the parts of the page ── */
  /* "...(more)" (Sam, 2026-11-21, item 6: replace "Counting method" with a blue, clickable "...(more)" that expands the
     card text): one button, aria-expanded, "(less)" while open. It opens the clamped text and the notes under it. */
  var MORE_N = 0;
  function more(kids, onToggle) {
    var id = "cmf-more-" + (++MORE_N);
    var body = el("div", { cls: "cmf-more-body", id: id, hidden: true }, kids);
    var b = el("button", { type: "button", cls: "cmf-more", "aria-expanded": "false", "aria-controls": id, text: "...(more)" });
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.textContent = open ? "(less)" : "...(more)";
      if (open) body.removeAttribute("hidden"); else body.setAttribute("hidden", "");
      if (onToggle) onToggle(open);
    });
    return { button: b, body: body };
  }
  function meter(value, label) {
    return el("div", { cls: "cmf-meter", role: "img", "aria-label": label }, [el("i", { style: "width:" + Math.max(0, Math.min(100, value)).toFixed(1) + "%" })]);
  }
  /* A link to a card on this page (item 1): scroll to it, unfold it and focus its heading; never route (the tab router
     reads a bare #<id> as a tab). The click is handled once, for every such link, below. */
  function onPage(id, kids, cls) { return el("a", { href: "#" + id, "data-onpage": id, cls: cls || null }, typeof kids === "string" ? [kids] : kids); }
  function jump(id) {
    var t = document.getElementById(id);
    if (!t) return false;
    if (typeof t._unfold === "function") t._unfold();
    if (t.scrollIntoView) t.scrollIntoView({ block: "start" });
    var h = t.querySelector("h3, h4") || t;
    h.setAttribute("tabindex", "-1");
    if (h.focus) h.focus();
    return true;
  }
  function cardLink(text) { return onPage("courses-data", text); }

  function header(M, onAll) {
    var all = el("button", { type: "button", cls: "cmn-word cmf-all", id: "cmf-all", text: "Collapse all" });
    all.addEventListener("click", onAll);
    return el("header", { cls: "cmn-top cmf-top" }, [
      el("div", { cls: "cmf-top-row" }, [el("h2", { cls: "cmn-title", id: "cmf-h", text: "CPL Commons" }), all]),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      p(["Workspace to collect, curate, and connect common datasets: catalogs with program and course requirements, PLOs, SLOs, objectives, and attributes; CPL credentials and exhibits with credit recommendations and skills; and connections to the related datasets and platforms needed to clarify paths, in one integrated statewide view."], "cmn-lede"),
      p(["Every date below is estimated from the last 7 days’ pace. Each is a projection, not a promise."], "cmn-sub")
    ]);
  }

  function programsMethod(M) {
    var P = M.programs, E = M.collectEta;
    return "Phase 1 of data collection is what COBI collects itself from public college catalogs and course outlines. Its date today is set by program records: " + fmt(P.complete) + " of " + fmt(P.active) + " Active programs are complete as of " + monthDay(M.lastN) + ". "
      + "The target is every Active program in its college’s current catalog: " + fmt(P.active) + " minus the COCI-only programs, about " + fmt(P.target) + ", so about " + fmt(P.left) + " are left. "
      + (P.gain == null ? "The daily count holds no week to measure a pace from. "
        : fmt(P.gain) + " more were completed from " + monthDay(P.fromN) + " to " + monthDay(M.lastN) + " (about " + fmt(Math.round(P.pace)) + " a day), counted on " + E.counted + " of those 7 days. ")
      + (E.doneN == null ? "The date reads TBA when that week holds a count on fewer than " + MIN_DAYS + " days, or when the count did not rise. "
        : "At that pace this target finishes in about " + fmt(Math.floor(P.exact)) + " days, on " + dayRange(P.lowN, P.doneN) + (P.lowN !== P.doneN ? "; this page uses " + longDate(P.doneN) : "") + ". ")
      + "Programs that appear only in the Chancellor’s Office curriculum inventory are optional cleanup, not part of this date. "
      + "Course student learning outcomes (SLOs) and course objectives join the date once the count of courses that can be read automatically exists; until then they do not set it. "
      + (P.prevN == null ? "" : "The pace of the 7 days before would put program records at " + longDate(P.prevN) + ".");
  }
  function curationMethod(M) {
    var Q = M.curation;
    if (!Q.refs.length) return [p(["The daily series of the Commons references could not be read, so the date reads TBA."])];
    var out = [p(["Phase 1 of data curation settles the four common references: exhibit titles, course cards, credit-recommendation wordings and common subjects. "
      + "A day’s curation counts what it settled and what a procedure set aside in bulk, so a rule, a reader fix or a new M-ID counts beside a person’s own edits. New work arriving is not taken off it. "
      + "Each reference finishes when its remaining work runs out at its last 7 days’ pace; the phase finishes with the last of them. "
      + "The date reads TBA when the series holds a count on fewer than " + MIN_DAYS + " of those days, or when an open reference curated nothing in them."])];
    out.push(el("ul", { cls: "cmf-curlist" }, Q.refs.map(function (r) {
      var name = r.name.charAt(0).toUpperCase() + r.name.slice(1);
      if (r.done) return el("li", { "data-ref": r.key, text: name + ": complete, " + fmt(r.settled) + " of " + fmt(r.of) + "." });
      return el("li", { "data-ref": r.key, text: name + ": " + fmt(r.settled) + " of " + fmt(r.of) + " settled, " + fmt(r.remaining) + " left. In the last 7 days "
        + fmt(r.curated) + " were curated (" + fmt(r.person) + " by a person, " + fmt(r.bulk) + " by rules, reader fixes, new M-IDs or set-asides)"
        + (r.dayN == null ? ", so it has no date yet." : ", about " + fmt(Math.round(r.pace)) + " a day: " + longDate(r.dayN) + ", estimated"
          + (r.stepDays === 1 ? "; that pace rests on one day’s step." : ".")) });
    })));
    out.push(p(["From the Commons status series, " + longDate(Q.fromN + 1) + " to " + longDate(Q.lastN) + "."]));
    return out;
  }

  /* ── the ETA widget (item 3): two estimated dates, each "Phase 1" a link to the Plan card ── */
  function etaLine(label, dayN, note, methodKids) {
    var m = more(methodKids);
    return el("div", { cls: "cmf-date" }, [
      p([label + " ", onPage("cmf-card-plan", "Phase 1"), " ETA"], "cmf-date-l"),
      dayN == null ? p(["TBA"], "cmf-date-v cmf-undated")
        : p([longDate(dayN), " ", el("span", { cls: "cmf-est", text: "estimated" })], "cmf-date-v"),
      p(note, "cmf-date-n"), m.button, m.body
    ]);
  }
  function eta(M) {
    var P = M.programs, E = M.collectEta, Q = M.curation;
    var colNote = E.doneN != null
      ? ["Set by program records: about " + fmt(P.left) + " Active programs left at about " + fmt(Math.round(P.pace)) + " a day. Course SLOs and objectives join it once the count of readable courses exists; see ", cardLink("Courses data"), "."]
      : [E.why === "pace" ? "TBA: Active programs complete did not rise over the last 7 days." : "TBA: the last 7 days hold a count on fewer than " + MIN_DAYS + " days."];
    var curNote = Q.day != null
      ? [Q.last ? "Set by " + Q.last.name + ": " + fmt(Q.last.remaining) + " left at about " + fmt(Math.round(Q.last.pace)) + " a day, counting rules, reader fixes and new M-IDs beside a person’s edits." : "Every reference is complete."]
      : [Q.why === "file" ? "TBA: the daily series of the Commons references could not be read."
        : Q.why === "days" ? "TBA: the last 7 days hold a count on fewer than " + MIN_DAYS + " days."
        : "TBA: " + Q.undated.map(function (r) { return r.name; }).join(", ") + " curated nothing in the last 7 days."];
    return el("section", { cls: "cmf-eta", "aria-labelledby": "cmf-eta-h" }, [
      el("h3", { id: "cmf-eta-h", cls: "cmf-eta-h", text: "Phase 1 Dates" }),
      el("div", { cls: "cmf-dates" }, [
        etaLine("Data Collection", E.doneN, colNote, [p([programsMethod(M)])]),
        etaLine("Data Curation", Q.day, curNote, curationMethod(M))
      ]),
      chart(M)
    ]);
  }

  /* ── the daily chart (item 7): program records collected each day (solid) against the daily pace the estimated date
     needs (dashed), a trend line (dotted), and cost per day in a second panel on the same dates. Hover, a tap or the
     arrow keys read one day's figures; the table under it holds every figure as text. ── */
  var NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function trendOf(D) {
    var pts = D.map(function (d, i) { return d.programs == null ? null : [i, d.programs]; }).filter(Boolean);
    if (pts.length < 2) return null;
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (q) { sx += q[0]; sy += q[1]; sxx += q[0] * q[0]; sxy += q[0] * q[1]; });
    var den = n * sxx - sx * sx;
    if (!den) return null;
    var b = (n * sxy - sx * sy) / den, a0 = (sy - b * sx) / n;
    return { at: function (i) { return a0 + b * i; } };
  }
  function usd(v) { return "$" + Math.round(v).toLocaleString("en-US"); }
  function chart(M) {
    var D = M.days, n = D.length, W = 600, H1 = 120, H2 = 60, need = M.needPace, T = trendOf(D);
    var max1 = 1, max2 = 1;
    D.forEach(function (d) { if (d.programs != null) max1 = Math.max(max1, d.programs); if (d.cost) max2 = Math.max(max2, d.cost.usd); });
    if (need != null) max1 = Math.max(max1, need);
    if (T) max1 = Math.max(max1, T.at(0), T.at(n - 1));
    function x(i) { return (i + 0.5) * W / n; }
    function y1(v) { return H1 - Math.max(0, v) / max1 * (H1 - 6); }
    var top = svgEl("svg", { viewBox: "0 0 " + W + " " + H1, preserveAspectRatio: "none", "class": "cmf-plot", "aria-hidden": "true" });
    top.appendChild(svgEl("line", { x1: 0, x2: W, y1: H1, y2: H1, "class": "cmf-base" }));
    var d = "", pen = false;
    D.forEach(function (r, i) {
      if (r.programs == null) { pen = false; return; }
      d += (pen ? " L" : " M") + x(i).toFixed(1) + " " + y1(r.programs).toFixed(1); pen = true;
    });
    if (d) top.appendChild(svgEl("path", { d: d.trim(), "class": "cmf-l-actual" }));
    D.forEach(function (r, i) { if (r.programs != null) top.appendChild(svgEl("circle", { cx: x(i).toFixed(1), cy: y1(r.programs).toFixed(1), r: 2.5, "class": "cmf-dot" })); });
    if (need != null) top.appendChild(svgEl("line", { x1: x(0).toFixed(1), x2: x(n - 1).toFixed(1), y1: y1(need).toFixed(1), y2: y1(need).toFixed(1), "class": "cmf-l-need" }));
    if (T) top.appendChild(svgEl("line", { x1: x(0).toFixed(1), x2: x(n - 1).toFixed(1), y1: y1(T.at(0)).toFixed(1), y2: y1(T.at(n - 1)).toFixed(1), "class": "cmf-l-trend" }));
    var mark1 = svgEl("line", { y1: 0, y2: H1, "class": "cmf-mark" });
    top.appendChild(mark1);
    var low = svgEl("svg", { viewBox: "0 0 " + W + " " + H2, preserveAspectRatio: "none", "class": "cmf-plot cmf-plot-cost", "aria-hidden": "true" });
    low.appendChild(svgEl("line", { x1: 0, x2: W, y1: H2, y2: H2, "class": "cmf-base" }));
    var bw = Math.max(2, W / n * 0.6);
    D.forEach(function (r, i) {
      if (!r.cost) return;
      var h = r.cost.usd / max2 * (H2 - 4);
      low.appendChild(svgEl("rect", { x: (x(i) - bw / 2).toFixed(1), width: bw.toFixed(1), y: (H2 - h).toFixed(1), height: Math.max(0, h).toFixed(1), "class": "cmf-b-cost" }));
    });
    var mark2 = svgEl("line", { y1: 0, y2: H2, "class": "cmf-mark" });
    low.appendChild(mark2);

    function dayWords(i) {
      var r = D[i], out = [longDate(r.n) + ":", r.programs == null ? "no count of program records" : fmt(r.programs) + " program records collected"];
      if (need != null) out.push("pace needed about " + fmt(Math.round(need)) + " a day");
      if (T) out.push("trend about " + fmt(Math.max(0, Math.round(T.at(i)))) + " a day");
      out.push(r.cost ? "cost " + usd(r.cost.usd) + (r.cost.from === "billing" ? " (account totals)" : " (the reading jobs’ and sessions’ own figures)") : M.spendRead ? "no cost recorded" : "cost TBA");
      return out[0] + " " + out.slice(1).join("; ") + ".";
    }
    var readout = el("p", { cls: "cmf-readout", id: "cmf-readout", "aria-live": "polite" });
    var cur = n - 1;
    function show(i) {
      cur = Math.max(0, Math.min(n - 1, i));
      [mark1, mark2].forEach(function (m) { m.setAttribute("x1", x(cur).toFixed(1)); m.setAttribute("x2", x(cur).toFixed(1)); });
      readout.textContent = dayWords(cur);
    }
    var plots = el("div", { cls: "cmf-plots", tabindex: "0", role: "group", id: "cmf-plots",
      "aria-label": "Daily chart, " + longDate(D[0].n) + " to " + longDate(D[n - 1].n) + ". The left and right arrow keys read one day at a time.", "aria-describedby": "cmf-readout" }, [
      el("p", { cls: "cmf-axis", text: "Program records a day, up to " + fmt(Math.round(max1)) }), top,
      el("p", { cls: "cmf-axis", text: "Cost a day" + (M.spendRead ? ", up to " + usd(max2) : ": TBA") }), low,
      el("div", { cls: "cmf-axis cmf-axis-x" }, [el("span", { text: shortDay(D[0].n) }), el("span", { text: shortDay(D[n - 1].n) })])
    ]);
    function fromPointer(e) {
      var r = plots.getBoundingClientRect ? plots.getBoundingClientRect() : null;
      if (!r || !r.width) return;
      show(Math.floor((e.clientX - r.left) / r.width * n));
    }
    plots.addEventListener("mousemove", fromPointer);
    plots.addEventListener("click", fromPointer);
    plots.addEventListener("keydown", function (e) {
      var k = e.key, to = k === "ArrowLeft" ? cur - 1 : k === "ArrowRight" ? cur + 1 : k === "Home" ? 0 : k === "End" ? n - 1 : null;
      if (to == null) return;
      e.preventDefault();
      show(to);
    });
    show(cur);
    var legend = el("ul", { cls: "cmf-legend" }, [
      el("li", null, [el("span", { cls: "cmf-key cmf-key-actual", "aria-hidden": "true" }), "Solid line: program records collected that day"]),
      el("li", null, [el("span", { cls: "cmf-key cmf-key-need", "aria-hidden": "true" }), need != null ? "Dashed line: daily pace needed for the estimated date" : "Dashed line: daily pace needed, TBA while the date is TBA"]),
      el("li", null, [el("span", { cls: "cmf-key cmf-key-trend", "aria-hidden": "true" }), T ? "Dotted line: trend" : "Dotted line: trend, TBA"]),
      el("li", null, [el("span", { cls: "cmf-key cmf-key-cost", "aria-hidden": "true" }), "Bars: cost per day"])
    ]);
    var table = el("table", { cls: "cmf-table" }, [
      el("caption", { text: "Daily figures, " + longDate(D[0].n) + " to " + longDate(D[n - 1].n) }),
      el("thead", null, [el("tr", null, ["Day", "Program records collected", "Pace needed", "Trend", "Cost"].map(function (h) { return el("th", { scope: "col", text: h }); }))]),
      el("tbody", null, D.map(function (r, i) {
        return el("tr", null, [el("th", { scope: "row", text: shortDay(r.n) }), el("td", { text: r.programs == null ? "no count" : fmt(r.programs) }),
          el("td", { text: need == null ? "TBA" : fmt(Math.round(need)) }), el("td", { text: T ? fmt(Math.max(0, Math.round(T.at(i)))) : "TBA" }),
          el("td", { text: r.cost ? usd(r.cost.usd) + (r.cost.from === "billing" ? "" : ", measured") : M.spendRead ? "none recorded" : "TBA" })]);
      }))
    ]);
    return el("figure", { cls: "cmf-chart" }, [
      el("figcaption", { text: "Program records collected each day, " + longDate(D[0].n) + " to " + longDate(D[n - 1].n) + ": the day’s rise in complete Active program records. Cost per day sits under it on the same dates: the account totals where Sam pasted them, else the reading jobs’ and sessions’ own figures." }),
      plots, readout, legend,
      el("details", { cls: "cmf-tablefold" }, [el("summary", { text: "Daily figures table" }),
        el("div", { cls: "cmf-tablewrap", role: "region", "aria-label": "Daily figures table", tabindex: "0" }, [table])])
    ]);
  }

  /* ── Needs you (item 1 and item 2) ──
     The live hand-over counts (commons_handover.js summary(): counts only, no person) take a finished item off its list
     at once, beside the nightly files. A hand-over our reader could not read, or that met a bot check, still waits. */
  var FAILED = { could_not_read: true, bot_check: true };
  var TERMS = ["Spring 2026", "Spring 2025", "Fall 2024"];
  var WEB = /^https?:\/\//i;   /* an address opens as a link only when it is a web address (COBIx on #3646) */
  /* A term a hand-over's row names takes that term off the wanted list; a row that names none counts toward the terms
     still wanted, so three copies of one named term never clear the other two (COBIx on #3646). The hand-over counts
     carry no term today, so until they do the list clears on the count. */
  function termsWanted(named, unnamed) {
    var left = TERMS.filter(function (t) { return !named[t.toLowerCase()]; });
    return unnamed >= left.length ? [] : left;
  }
  function HO() { return window.CPL_HANDOVER || null; }
  function needsModel(M) {
    var rows = (M.handed || []).filter(function (r) { return r && !FAILED[r.status]; });
    var cDone = {}, colDone = {}, terms = 0, termNamed = {}, termUnnamed = 0;
    rows.forEach(function (r) {
      if (r.subject_kind === "course") cDone[(r.college || "") + "|" + (r.course_code || "")] = true;
      else if (r.subject_kind === "college" && (r.dataset === "catalog" || r.dataset === "programs")) colDone[r.college || ""] = true;
      else if (r.subject_kind === "dataset" && r.dataset === "term_reports") {
        terms += Number(r.n || 0);
        if (r.term) termNamed[String(r.term).trim().toLowerCase()] = true; else termUnnamed += Number(r.n || 0);
      }
    });
    var h = M.hunt, outline = null;
    if (h && Array.isArray(h.colleges) && Array.isArray(h.courses)) {
      var open = [], answered = 0, gone = 0;
      h.colleges.forEach(function (c) {
        answered += (c.answered || []).length;
        if (!(c.hunted && !c.filed)) return;
        var left = (c.still_taught || []).filter(function (x) { if (cDone[c.college + "|" + x.course]) { gone++; return false; } return true; });
        if (left.length) open.push({ slug: c.slug, college: c.college, catalog_url: c.catalog_url, still_taught: left });
      });
      outline = { colleges: open, courses: open.reduce(function (s, c) { return s + c.still_taught.length; }, 0), handed: answered + gone };
    }
    var cat = (M.catalogNeed || []).filter(function (c) { return !colDone[c.college]; });
    return { outline: outline, catalog: { colleges: cat, handed: Object.keys(colDone).length },
      term: { wanted: termsWanted(termNamed, termUnnamed), handed: terms } };
  }
  function chip(n) { return el("span", { cls: "cmn-pill cmn-pill-done cmf-handed", text: "Handed over: " + fmt(n || 0) }); }
  function needHead(title, n, id) { return el("div", { cls: "cmf-need-head" }, [el("h4", { id: id || null, text: title }), chip(n)]); }
  function plural(n, one, many) { return fmt(n) + " " + (n === 1 ? one : many); }

  /* The ranked links (item 1): wave blockers first, then by the count each frees, largest first; an item with no count
     ranks after those with one and shows no figure. At most RANK_CAP, with a plain count of the rest. An item about one
     college opens that college's row on College Data Collection (item 8); every other item jumps to its card here. */
  function rankItems(M, N, opts) {
    var items = [];
    if (N.outline) N.outline.colleges.forEach(function (c) {
      var k = c.still_taught.length;
      items.push({ wave: true, n: k, label: c.college + ": course outlines", unlock: "frees " + plural(k, "course", "courses") + " for its outcomes", href: "#collect/college/" + c.slug });
    });
    N.catalog.colleges.forEach(function (c) { items.push({ wave: true, n: null, label: c.college + ": catalog", unlock: "", href: "#collect/college/" + c.slug }); });
    var HC = M.heldCodes;
    if (HC && HC.held > 0) items.push({ wave: true, n: HC.held, label: "Common subject codes for " + plural(HC.codes, "local subject code", "local subject codes"),
      unlock: "frees " + plural(HC.held, "course", "courses") + " for an M-ID", onpage: "cmf-card-subjects" });
    var L = M.heldLive, open = L ? L.open : (M.held && M.held.n) || 0;
    if (open > 0) items.push({ wave: false, n: open, label: "Exhibit titles to name", unlock: "frees " + plural(open, "exhibit title", "exhibit titles"), onpage: "cmf-need-titles" });
    if (N.term.wanted.length) items.push({ wave: false, n: null, label: "Term reports: " + N.term.wanted.join(", "), unlock: "", onpage: "cmf-need-terms" });
    (((opts || {}).decisions || {}).open || []).forEach(function (x) {
      var t = String(x.title || x.call && x.call.title || "A decision").split(":")[0].replace(/\?$/, "");
      items.push({ wave: false, n: null, label: "Decision waiting: " + t, unlock: "", onpage: "cmf-need-decisions" });
    });
    items.forEach(function (it, i) { it.i = i; });
    return items.sort(function (a, b) {
      if (a.wave !== b.wave) return a.wave ? -1 : 1;
      if ((a.n == null) !== (b.n == null)) return a.n == null ? 1 : -1;
      return (b.n || 0) - (a.n || 0) || a.i - b.i;
    });
  }
  function drawRank(box, M, N, opts) {
    box.textContent = "";
    var items = rankItems(M, N, opts), shown = items.slice(0, RANK_CAP);
    if (!items.length) { box.appendChild(p(["Nothing waits on you."])); return; }
    box.appendChild(el("ol", { cls: "cmf-rank", id: "cmf-rank" }, shown.map(function (it) {
      var link = it.onpage ? onPage(it.onpage, it.label, "cmf-rank-t") : a(it.href, it.label, "cmf-rank-t");
      return el("li", { "data-wave": it.wave ? "yes" : "no" }, [link,
        it.unlock ? el("span", { cls: "cmf-rank-n", text: it.unlock }) : null,
        it.wave ? el("span", { cls: "cmf-rank-w", text: "blocks the next wave" }) : null]);
    })));
    if (items.length > shown.length) box.appendChild(p([plural(items.length - shown.length, "more item waits", "more items wait") + " in the cards below."], "cmf-rank-rest"));
  }

  /* Course Outline Fixes: the still-taught courses whose outline needs a person, by college (Sam's work order,
     2026-11-20). Each course opens beside the page (#commons/course/<control number>); each college opens College Data
     Collection's own panel. A course a person finished leaves at once (item 2). */
  function courseLinks(c, list) {
    var H = HO(), out = [];
    (list || c.still_taught || []).forEach(function (x, i) {
      if (i) out.push(", ");
      if (!H) { out.push(x.course); return; }
      var row = { course: x.course, control_number: x.control_number, college_slug: c.slug };
      out.push(el("a", { href: H.courseHref(row), "data-course": H.courseKey(row), text: x.course }));
    });
    return out;
  }
  function huntWords(O) {
    if (!O) return "The list of still-taught courses whose outline needs a person is TBA.";
    if (!O.colleges.length) return "No still-taught course waits on an outline from a person.";
    return fmt(O.courses) + (O.courses === 1 ? " course still taught at " : " courses still taught at ") + fmt(O.colleges.length)
      + (O.colleges.length === 1 ? " college needs its course outline from a person." : " colleges need their course outline from a person.");
  }
  function drawOutlines(box, M, N) {
    var O = N.outline, H = HO();
    box.textContent = "";
    box.appendChild(p([huntWords(O)]));
    if (!O || !O.colleges.length) return;
    box.appendChild(el("ul", { cls: "cmf-need-list cmf-hunt" }, O.colleges.map(function (c) {
      return el("li", { "data-hunt-college": c.slug }, [
        p([H ? el("a", { cls: "cmf-need-t", href: H.collegeHref(c.college), "data-college-panel": c.slug, text: c.college }) : el("span", { cls: "cmf-need-t", text: c.college }), ": "]
          .concat(courseLinks(c), ["."])),
        p([], "cmf-standing"),
        !c.catalog_url ? null : WEB.test(c.catalog_url) ? p([el("a", { cls: "cmf-out", href: c.catalog_url, target: "_blank", rel: "noopener", text: c.catalog_url })])
          : p([el("span", { cls: "cmf-out-plain", text: c.catalog_url })])
      ].filter(Boolean));
    })));
    if (H) box.appendChild(p(["Choose a course to open it beside this list, then drop its outline, give a link to try, or paste the data. A college's name opens its own panel."]));
    box.appendChild(p([el("strong", { text: "Send the PDF to COBIx in your Grok Bot chat." })]));
  }
  /* Catalog Fixes: the colleges with no collected catalog. A college a person handed a catalog for leaves at once. */
  function drawCatalogs(box, M, N) {
    var C = N.catalog.colleges, H = HO();
    box.textContent = "";
    if (!C.length) { box.appendChild(p(["No college waits on a catalog fix."])); return; }
    box.appendChild(p([plural(C.length, "college has", "colleges have") + " no collected catalog yet."]));
    box.appendChild(el("ul", { cls: "cmf-need-list" }, C.map(function (c) {
      return el("li", { "data-catalog-college": c.slug }, [p([H ? el("a", { cls: "cmf-need-t", href: H.collegeHref(c.college), text: c.college }) : el("span", { cls: "cmf-need-t", text: c.college })])]);
    })));
  }
  function termWords(T) {
    if (!T.wanted.length) return "No term report waits on you: " + plural(T.handed, "term report", "term reports") + " handed over. Our reader names each one's term when it reads it.";
    return "Wanted, newest first: " + (T.wanted.length === 1 ? T.wanted[0] : T.wanted.slice(0, -1).join(", ") + " and " + T.wanted[T.wanted.length - 1]) + "."
      + (T.handed ? " " + plural(T.handed, "term report", "term reports") + " handed over so far; our reader names each one's term when it reads it." : "");
  }
  /* Term Reports Needed (cpl_memory q-term-report-sources-2026-11-20): the set-aside for courses a college no longer
     offers compares term course files. A hand-over that names its term takes that term off the list; the counts carry
     no term today, so the wanted terms leave once as many term reports are handed over as are wanted (termsWanted). */
  function termReports(M, N) {
    var H = HO(), kids = [needHead("Term Reports Needed", N.term.handed),
      p(["To set aside courses a college no longer offers, the Commons compares the term course files each college reported to the Chancellor's Office. Fall 2025 is on hand."]),
      p([termWords(N.term)], "cmf-term-wanted"), el("p", { cls: "cmf-standing", id: "cmf-term-standing" })];
    if (H) {
      var hold = el("div", { cls: "cmf-term-box" });
      var d = el("details", { cls: "cho-term", id: "cmf-term" }, [el("summary", { text: "Hand over a term report" }), hold]);
      d.addEventListener("toggle", function () {
        if (!d.open || hold.firstChild) return;
        hold.appendChild(H.box({ subject_kind: "dataset", dataset: "term_reports" }, { apiHeading: "h5", apis: [{ which: "term_report", dataset: "term_reports" }], onChange: function () { drawStanding(M); } }));
      });
      kids.push(d);
    }
    var box = el("div", { cls: "cmf-need", id: "cmf-need-terms" }, kids);
    box.querySelector(".cmf-term-wanted").id = "cmf-term-wanted";
    return box;
  }
  /* Every list in Needs you drawn again from the model: the nightly files and the live hand-over counts. */
  function redrawNeeds(M) {
    var N = needsModel(M), opts = M._opts || {};
    var r = document.getElementById("cmf-rank-box"); if (r) drawRank(r, M, N, opts);
    var o = document.getElementById("cmf-outline-list"); if (o) drawOutlines(o, M, N);
    var c = document.getElementById("cmf-catalog-list"); if (c) drawCatalogs(c, M, N);
    var t = document.getElementById("cmf-term-wanted"); if (t) t.textContent = termWords(N.term);
    [["cmf-need-rows", N.outline ? N.outline.handed : 0], ["cmf-need-catalogs", N.catalog.handed], ["cmf-need-terms", N.term.handed]].forEach(function (x) {
      var ch = document.querySelector("#" + x[0] + " .cmf-handed");
      if (ch) ch.textContent = "Handed over: " + fmt(x[1] || 0);
    });
    return N;
  }
  /* What has been handed over so far, beside each college (the public counts: no person, file name or address). A
     finished item leaves its list first (item 2). */
  function drawStanding(M) {
    var H = HO();
    if (!H) return;
    H.summary(true).then(function (rows) {
      if (Array.isArray(rows)) M.handed = rows;
      var N = redrawNeeds(M);
      (N.outline ? N.outline.colleges : []).forEach(function (c) {
        var line = document.querySelector('.cmf-hunt li[data-hunt-college="' + c.slug + '"] .cmf-standing');
        if (!line) return;
        var said = H.standing(rows, { subject_kind: "college", college: c.college });
        line.textContent = said.length ? "Handed over: " + said.join("; ") + "." : "";
      });
      var t = document.getElementById("cmf-term-standing");
      if (t) { var ts = H.standing(rows, { subject_kind: "dataset", dataset: "term_reports" }); t.textContent = ts.length ? "Handed over: " + ts.join("; ") + "." : ""; }
    });
  }

  /* Needs you (#3566; Sam, 2026-11-21, item 1): the ranked links, then the cards they open. Decisions waiting reads the
     decisions list commons.js hands in (the decision record's own list). */
  function needs(M, opts) {
    opts = opts || {};
    M._opts = opts;
    var N = needsModel(M);
    var open = (opts.decisions && opts.decisions.open) || [];
    var dec = el("div", { cls: "cmf-need", id: "cmf-need-decisions" }, [el("h4", { text: "Decisions waiting" })]);
    if (open.length) {
      dec.appendChild(el("ul", { cls: "cmf-need-list" }, open.map(function (x) {
        return el("li", { "data-todo": x.call.todo_id || null }, [
          p([x.href ? a(x.href, x.title) : el("span", { text: x.title })], "cmf-need-t"),
          x.call.text ? p([x.call.text]) : null,
          x.call.if_no_reply ? p(["Until you answer: " + x.call.if_no_reply]) : null
        ].filter(Boolean));
      })));
    } else dec.appendChild(p(["None waiting."]));
    var note = typeof opts.marksNote === "function" ? opts.marksNote() : null;
    if (note) dec.appendChild(note);
    dec.appendChild(p([a("#commons/details/decisions", "Decision record")], "cmf-need-links"));
    var outlineBox = el("div", { id: "cmf-outline-list", cls: "cmf-need-body" });
    drawOutlines(outlineBox, M, N);
    var rows = el("div", { cls: "cmf-need", id: "cmf-need-rows" }, [needHead("Course Outline Fixes", N.outline ? N.outline.handed : 0), outlineBox,
      p([a("#collect/outlines-blocked", "Open the courses by college")], "cmf-need-links")]);
    var catBox = el("div", { id: "cmf-catalog-list", cls: "cmf-need-body" });
    drawCatalogs(catBox, M, N);
    var cats = el("div", { cls: "cmf-need", id: "cmf-need-catalogs" }, [needHead("Catalog Fixes", N.catalog.handed), catBox,
      p([a("#collect/unread", "Open the colleges not collected yet")], "cmf-need-links")]);
    var titles = el("div", { cls: "cmf-need", id: "cmf-need-titles" }, [el("h4", { text: "Exhibit Titles to Name" })]);
    var heldBox = el("div", { cls: "cmf-held", id: "cmf-held", "aria-live": "polite" });
    titles.appendChild(heldBox);
    drawHeld(heldBox, M, opts.held || null);
    var rank = el("div", { id: "cmf-rank-box", cls: "cmf-rank-box" });
    drawRank(rank, M, N, opts);
    return el("section", { cls: "cmf-needs", id: "cmf-needs", "aria-labelledby": "cmf-needs-h" }, [
      el("h3", { id: "cmf-needs-h", cls: "cmf-needs-h", tabindex: "-1", text: "Needs you" }),
      rank,
      el("div", { cls: "cmf-needs-grid" }, [
        dec,
        el("div", { cls: "cmf-need", id: "cmf-need-owed" }, [el("h4", { text: "Fixes owed to you" }),
          p(["Five common-course cards you already ruled on (shared course IDs " + ASKED.doubt.slice(0, -1).join(", ") + ", and " + ASKED.doubt[ASKED.doubt.length - 1] + ") still sit on the list of cards whose catalog description reads as another discipline, because your rulings have not been carried into that list yet. Sky owes that fix. Nothing for you to decide."])]),
        rows,
        cats,
        termReports(M, N),
        titles
      ])
    ]);
  }
  /* The held titles' line. L is the live read (heldLive): { held, saved: [{ raw, value }], open, at }; null while it
     reads or when it failed, and then the status file's count stands, named as of its time. */
  function drawHeld(box, M, L) {
    box.textContent = "";
    if (L && L.held === 0) return;   /* the fold landed: the review file holds no held title, so the line goes */
    if (L) {
      if (L.open > 0) box.appendChild(p([a("#exhibits/held", fmt(L.open) + (L.open === 1 ? " exhibit title" : " exhibit titles")), " held for a person to name. ", el("span", { cls: "cmf-owner", text: "· a curator" })]));
      if (L.saved.length) {
        box.appendChild(p([fmt(L.saved.length) + (L.saved.length === 1 ? " exhibit title a person saved waits" : " exhibit titles a person saved wait") + " for the nightly build, which adds " + (L.saved.length === 1 ? "it" : "them") + " to the reference. No one needs to act."]));
        box.appendChild(el("details", { cls: "cmf-method cmf-saved" }, [el("summary", { text: "The saved titles" }),
          el("ul", { cls: "cmf-saved-list" }, L.saved.map(function (x) { return el("li", { text: x.raw + " is saved as " + x.value }); }))]));
      }
      return;
    }
    var H = M.held;
    if (!H || !H.n) return;
    var heldWords = H.unsure != null ? " (the title-sorting routine is unsure on " + H.unsure + ", a merge would join two issuers on " + H.issuers + ", a course code is left in the title on " + H.code + ")" : "";
    box.appendChild(p([a("#exhibits/held", fmt(H.n) + " titles"), " held for a person" + heldWords + ", as of " + stampWords(M.commonsAt) + ". ", el("span", { cls: "cmf-owner", text: "· a curator" })]));
  }
  /* A stamp in Pacific time, in words: "8:53 AM PT on November 19". */
  function stampWords(v) {
    var d = new Date(v || "");
    if (isNaN(d.getTime())) return "the last build";
    try {
      return d.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }) + " PT on "
        + d.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "long", day: "numeric" });
    } catch (e) { return d.toDateString(); }
  }

  /* ── the held titles, read live (#3566, design decision 5): the person saves land at once ──
     The review file (kb/exhibits_review.json, built nightly) lists the held titles; a held title is saved when
     kb_curation holds a non-empty unified_title_assignment under _UNCLASSIFIED::<raw title>, the save the Exhibits tab
     writes and reads back (exhibits.js reconcileReview). Read through the anon key the page already holds (CPL_SESSION),
     Range-paged (Rule 10 b), in chunks of 40 titles. Read-only. Any page that fails fails the read, and the status
     file's count stands with its time. A conflict card is a saved title by definition and is not counted here. */
  var LIVE = { url: "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation", review: "kb/exhibits_review.json",
    field: "unified_title_assignment", prefix: "_UNCLASSIFIED::", conflict: "Conflict with the reference", page: 1000, chunk: 40 };
  function anonKey() {
    var S = window.CPL_SESSION, h = S && typeof S.authHeaders === "function" ? S.authHeaders() : null;
    return (h && h.apikey) || "";
  }
  function heldLive() {
    return readJson(LIVE.review).then(function (d) {
      var held = ((d && d.held) || []).filter(function (h) { return h && h.raw && h.step !== LIVE.conflict; });
      if (!held.length) return { held: 0, saved: [], open: 0, at: d && d.written_at };
      var key = anonKey();
      if (!key) throw new Error("COBI could not be reached from this page");
      var raws = held.map(function (h) { return h.raw; }), chunks = [];
      for (var i = 0; i < raws.length; i += LIVE.chunk) chunks.push(raws.slice(i, i + LIVE.chunk));
      function page(url, from, acc) {
        return fetch(url, { headers: { "apikey": key, "Range-Unit": "items", "Range": from + "-" + (from + LIVE.page - 1) } })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
          .then(function (rows) { rows = rows || []; acc = acc.concat(rows); return rows.length < LIVE.page ? acc : page(url, from + LIVE.page, acc); });
      }
      return Promise.all(chunks.map(function (c) {
        var q = c.map(function (r) { var id = LIVE.prefix + r; return encodeURIComponent('"' + id.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'); });
        return page(LIVE.url + "?select=course_id,field,value&field=eq." + LIVE.field + "&course_id=in.(" + q.join(",") + ")&order=course_id.asc", 0, []);
      })).then(function (parts) {
        var by = {};
        parts.forEach(function (rows) { rows.forEach(function (r) {
          var v = String(r.value || "").trim();
          if (r.field === LIVE.field && String(r.course_id || "").indexOf(LIVE.prefix) === 0 && v) by[r.course_id.slice(LIVE.prefix.length)] = v;
        }); });
        var saved = raws.filter(function (r) { return by[r]; }).map(function (r) { return { raw: r, value: by[r] }; });
        return { held: held.length, saved: saved, open: held.length - saved.length, at: d.written_at };
      });
    });
  }

  /* One card: title, pill, headline (its number stays when folded), meter, body (clamped to six lines), "...(more)"
     (which un-clamps the body and opens the notes under it) and the reserved link row. Every card has an id, so a
     Needs you link can jump to it (item 1). */
  function card(o) {
    var art = el("article", { cls: "cmf-card" + (o.cls ? " " + o.cls : ""), "data-key": o.key, id: o.id || "cmf-card-" + o.key, "aria-labelledby": "cmf-t-" + o.key });
    var fold = el("button", { type: "button", cls: "cmn-word cmf-fold", "aria-expanded": "true", "aria-controls": "cmf-x-" + o.key, text: "Collapse" });
    art.appendChild(el("div", { cls: "cmf-card-head" }, [el("h3", { id: "cmf-t-" + o.key, cls: "cmf-card-t", text: o.title }),
      o.pill ? el("span", { cls: "cmn-pill cmf-pill" + (o.pillCls ? " " + o.pillCls : ""), text: o.pill }) : null, fold]));
    art.appendChild(el("p", { cls: "cmf-headline" }, [el("strong", { cls: "cmf-big", text: o.big }), el("span", { cls: "cmf-rest" }, o.rest)]));
    var x = el("div", { cls: "cmf-x", id: "cmf-x-" + o.key });
    (o.after || []).forEach(function (n) { x.appendChild(n); });
    x.appendChild(el("div", { cls: "cmf-body" }, o.body));
    if (o.method && o.method.length) {
      var m = more(o.method, function (open) { art.classList.toggle("cmf-unclamped", open); });
      x.appendChild(m.button);
      x.appendChild(m.body);
    }
    art.appendChild(x);
    art.appendChild(el("nav", { cls: "cmf-links", "aria-label": o.title + " links" }, (o.links || []).map(function (l) { return a(l[1], l[0]); })));
    art._fold = fold;
    return art;
  }

  /* College Data Collection (Sam, 2026-11-21, item 8): one line per dataset, each count a link that opens College Data
     Collection filtered to the colleges it counts; the one fix that reaches the most colleges; the colleges collected
     this week. The page it opens stays as it is. */
  function cdcCard(M) {
    var C = M.cdc;
    if (!C) return card({ key: "cdc", title: "College Data Collection", pill: "TBA", big: "TBA", rest: [" College Data Collection’s figures"],
      body: [p(["TBA: College Data Collection’s own lists could not be loaded on this page."])], method: [], links: [["Open College Data Collection", "#collect"]] });
    var collegeLink = function (c) { return a("#collect/college/" + c.slug, c.name); };
    function line(name, L, ds, etaN, etaNote) {
      return el("li", { "data-dataset": ds }, [el("strong", { text: name + ": " }),
        a("#collect/" + ds + "_done", fmt(L.done) + " of " + fmt(C.all) + " colleges and campuses done"), ", ",
        a("#collect/" + ds + "_progress", fmt(L.progress) + " in progress"), ", ",
        a("#collect/" + ds + "_stuck", "Stuck on a person or a fix: " + fmt(L.stuck)),
        ". ETA: " + (etaN == null ? "TBA" + (etaNote ? " (" + etaNote + ")" : "") : longDate(etaN) + ", estimated") + "."]);
    }
    function stuckLine(name, L) {
      if (!L.stuckList.length) return null;
      var kids = [name + " stuck: "];
      L.stuckList.forEach(function (c, i) { if (i) kids.push("; "); kids.push(collegeLink(c)); if (c.fix) kids.push(" (" + c.fix + ")"); });
      kids.push(".");
      return p(kids, "cmf-stuck");
    }
    var moved = C.moved.slice(0, 20), movedKids = [a("#collect/fresh", plural(C.moved.length, "college", "colleges") + " collected within a week")];
    if (moved.length) {
      movedKids.push(": ");
      moved.forEach(function (c, i) { if (i) movedKids.push(", "); movedKids.push(collegeLink(c)); });
      if (C.moved.length > moved.length) movedKids.push(", and " + fmt(C.moved.length - moved.length) + " more");
    }
    movedKids.push(".");
    return card({ key: "cdc", title: "College Data Collection", pill: "In progress",
      big: fmt(C.catalogs.done) + " of " + fmt(C.all), rest: [" colleges and campuses with every catalog program passing"],
      after: [p(C.top ? ["Top fix: " + C.top.what + ", reaching ", a("#collect/fix_" + C.top.key, plural(C.top.n, "college", "colleges")), "."] : ["Top fix: TBA."], "cmf-topfix")],
      body: [el("ul", { cls: "cmf-cdc-lines" }, [
          line("Catalogs (programs, PLOs, course requirements)", C.catalogs, "catalogs", C.catalogsEta, "the program-records date reads TBA"),
          line("Course outlines (SLOs, objectives, COCI)", C.outlines, "outlines", null, "no dated pace yet"),
          el("li", { "data-dataset": "credentials" }, [el("strong", { text: "Credentials (issuer, skills): " }), "TBA, since the College Data Collection file holds no credential count by college. ETA: TBA."])]),
        stuckLine("Catalogs", C.catalogs), stuckLine("Course outlines", C.outlines),
        el("h4", { cls: "cmf-sub", text: "Colleges that moved this week" }), p(movedKids)].filter(Boolean),
      method: [p(["Each count is College Data Collection’s own list, so a count and the list it opens agree. Catalogs are done when every program in the college’s count passes, and stuck when no catalog is collected or the scout found the catalog blocked. Course outlines are done when SLOs and objectives sit on every course in the college’s Active programs, and stuck when the college’s SLO read has nothing to read or is paused; the reason beside each college is the file’s own. "
        + "The top fix is the one, of the fixes the file names for programs still to pass, that reaches the most colleges. A college moved this week when its catalog was collected within the last 7 days. "
        + "A stuck college waits on a person or on a fix to our reader; the line under the counts names which, college by college. "
        + "The file counts " + fmt(C.all) + " colleges and continuing-education campuses"
        + (M.colleges && M.colleges.districts > 1 ? ", in " + fmt(M.colleges.districts) + " districts (" + fmt(M.colleges.districts - 1) + " plus Calbright)." : ".")])],
      links: [["Open College Data Collection", "#collect"]] });
  }

  /* The Plan (Sam, 2026-11-21, item 5): Phases 1, 2 and 3 of the moonshot, each with what it collects, curates and
     connects, and what is left. The phases are the College Collections Plan's (CPL Commons strategic plan, v2 agreed
     final, November 11, 2026: library/college-collections-plan/), with each connection's role from the College
     Collections ETA's lever list (commons_eta_clock.js). Phase 1's remaining figures are this page's own. */
  function planCard(M) {
    var P = M.programs, Co = M.courses, Q = M.curation;
    function phase(h, sub, rows) {
      var dl = el("dl", { cls: "cmf-phase-dl" });
      rows.forEach(function (r) { dl.appendChild(el("dt", { text: r[0] })); dl.appendChild(el("dd", { text: r[1] })); });
      return el("section", { cls: "cmf-phase", "aria-labelledby": "cmf-ph-" + h.slice(6, 7) }, [el("h4", { id: "cmf-ph-" + h.slice(6, 7), text: h }), p([sub], "cmf-phase-sub"), dl]);
    }
    var refsLeft = Q.refs.filter(function (r) { return !r.done; }).map(function (r) { return fmt(r.remaining) + " " + r.name; });
    var left1 = "About " + fmt(P.left) + " Active programs; SLOs on " + fmt(Co.sloLeft) + " and objectives on " + fmt(Co.objLeft) + " courses in Active programs; "
      + (Q.refs.length ? (refsLeft.length ? refsLeft.join(", ") + " to curate" : "every common reference curated") : "the references' remaining work TBA")
      + "; a remaining count of issuer-published skills is TBA.";
    var grid = el("div", { cls: "cmf-phases" }, [
      phase("Phase 1, now", "COBI's own collection", [
        ["Collected", "Catalog programs, course requirements and program learning outcomes; course SLOs and objectives from public course outlines; issuer-published credential skills; MAP exhibits and aggregates."],
        ["Curated", "The common references: exhibit titles, courses and their M-IDs, credit recommendations and subjects."],
        ["Connected", "MAP exhibits and aggregates, read nightly, and a saved copy of COCI."],
        ["Left", left1]]),
      phase("Phase 2, partner data", "Official, shared files", [
        ["Collected", "Program and course lists from the COMIS Data Mart; the full COCI course and program dataset on a schedule; Program Pathways Mapper maps; ASSIST articulations; CVC course links."],
        ["Curated", "COMIS as a check on program and course lists, and ASSIST as a second signal for common courses."],
        ["Connected", "COMIS Data Mart, COCI scheduled export, Program Pathways Mapper, ASSIST and CVC."],
        ["Left", "All five. COMIS is in progress, with one file loaded by hand; COCI has a saved copy and no scheduled export; the rest are planned."]]),
      phase("Phase 3, live connections", "College and Chancellor’s Office systems", [
        ["Collected", "Course outlines, SLOs and objectives from college curriculum systems; student totals and schedules through Common Cloud; major and population totals from CCCStart, totals only."],
        ["Curated", "The Chancellor’s Office data lakes fill gaps and confirm that the files agree; college student systems confirm records both ways."],
        ["Connected", "College curriculum systems, college student information systems, the Chancellor’s Office data lakes, Common Cloud and CCCStart."],
        ["Left", "All five. None is connected yet; access to the data lakes and Common Cloud has been asked for."]])
    ]);
    return card({ key: "plan", title: "Plan", cls: "cmf-plan", pill: "Phase 1 now",
      big: "3 phases", rest: [" of the moonshot: what the Commons collects, curates and connects, and what is left"],
      body: [grid],
      method: [p(["The three phases and their datasets are the College Collections Plan’s (the CPL Commons strategic plan, v2 agreed final, November 11, 2026). Phase 1 is everything the Commons collects today; Phases 2 and 3 are the partner and college connections that would change its pace, its cost and the quality of what it holds. The plan names no curation or connection for each phase in those words; the Curated and Connected lines here read each connection’s role from the College Collections ETA. Phase 1’s Left line is this page’s own count; Phases 2 and 3 are not dated."])],
      links: [["College Collections Plan", "library/college-collections-plan/"], ["College Collections ETA", "#collect/eta"]] });
  }

  function cards(M) {
    var P = M.programs, Cl = M.colleges, Co = M.courses, Cd = M.cards, E = M.exhibits, R = M.cr, X = ASKED.cr, K = ASKED.credentials;
    var sloPct = pct(Co.slo, Co.active), objPct = pct(Co.obj, Co.active), progPct = pct(P.complete, P.active);
    var collect = [
      card({ key: "colleges", title: "Colleges and catalogs", pill: "Catalog blocked: " + fmt(Cl.blocked), pillCls: Cl.blocked ? "cmn-pill-needs" : "cmn-pill-done",
        big: fmt(Cl.collected), rest: [" colleges with a collected catalog"],
        body: [p(["Catalogs read for every college, plus what’s still blocked."]),
          p([fmt(Cl.collected) + " means we have read each college’s catalog and have saved a read of its ", a("#program-requirements/list", "program requirements"),
            ", at least once. It does not mean we already have everything we need from each college. Still missing: about " + fmt(P.left) + " Active programs in current catalogs left to finish (every college still has some); course outlines, student learning outcomes, and course objectives (a public outline link is on file for " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges); and " + ASKED.evergreen + "’s saved catalog read is still from the 2025–2026 catalog and needs a re-read for the newest year."])],
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
          p([huntWords(needsModel(M).outline) + " A public outline link is on file for " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges. " + fmt(Co.sloColleges) + " colleges have any SLOs in the live statewide count; " + fmt(Co.objColleges) + " have objectives. Those " + fmt(Co.sloColleges) + " are not the same as the " + fmt(M.building.outcomeColleges) + " colleges on the Building line’s deeper outcomes read."])],
        method: [p([fmt(Co.active) + " is the number of courses that appear in Active programs statewide. " + fmt(Co.slo) + " of those already have student learning outcomes on file, and " + fmt(Co.obj) + " have course objectives (a course can have both). Those are live statewide counts. A separate Building-line read has " + fmt(M.building.outcomes) + " outcomes from " + fmt(M.building.outcomeCourses) + " courses at " + fmt(M.building.outcomeColleges) + " colleges; it is not the same " + fmt(Co.sloColleges) + "-college live SLO cut. The recent rates are measured from those nights, not one fixed nightly estimate: from the " + ASKED.sloSnap.at + " snapshot to this page’s counts, about one and a half days, SLOs grew by " + fmt(Co.sloGrow) + " (" + fmt(ASKED.sloSnap.slo) + " to " + fmt(Co.slo) + ") and objectives by " + fmt(Co.objGrow) + " (" + fmt(ASKED.sloSnap.obj) + " to " + fmt(Co.obj) + "). "
          + (Co.objDoneN != null && Co.sloDoneN != null ? "If every one of the " + fmt(Co.active) + " were already readable, objectives at about " + fmt(Math.round(Co.objGrow / 100) * 100) + " a night would finish around " + longDate(Co.objDoneN) + " (" + fmt(Co.objLeft) + " left), and SLOs at about " + fmt(Math.round(Co.sloGrow / 100) * 100) + " a night around " + longDate(Co.sloDoneN) + " (" + fmt(Co.sloLeft) + " left). " : "")
          + "Those dates are not shown, because a finish date should be set only for courses that can already be read automatically, and that readable-course count is not computed yet."])],
        links: [["Outlines blocked", "#collect/outlines-blocked"], ["Courses List", "#coci-lookup/courses"]] }),
      cdcCard(M)
    ];
    var cardPct = pct(Cd.ready, Cd.total), exPct = pct(E.stamped, E.titles);
    var S = M.subjects, LT = M.localTitles, HC = M.heldCodes, sOf = !!S && S.of != null;
    var curate = [
      /* Subjects (Sam, 2026-11-20: "don't we need a commons card for subjects to house the common subjects and local
         subject titles we'll be establishing from catalog data?"): Steps a and b of his curation order, before the
         M-ID (Step c, the next card). Each figure opens what it counts. */
      card({ key: "subjects", title: "Subjects", pill: "In progress",
        big: sOf ? fmt(S.settled) + " of " + fmt(S.of) : "TBA", rest: [" common subject codes settled"],
        body: [p([el("strong", { text: "Step a, common subject code: " }), sOf ? a("#canonical-subj4", fmt(S.settled) + " of " + fmt(S.of) + " disciplines settled") : "TBA",
            " in the Common Subjects Reference. Owner: a curator."]),
          p(HC ? [a("#commons/subjects/held", fmt(HC.held) + " courses the M-ID mint holds"), " wait on " + fmt(HC.codes) + " local subject codes with no common subject code. Deciding one code releases every course under it."]
            : ["The courses the M-ID mint holds for want of a common subject code: TBA."]),
          p([el("strong", { text: "Step b, local subject title: " }),
            LT ? a("#commons/subjects", fmt(LT.named) + " local titles") : "TBA",
            LT ? " at " : "", LT ? a("#commons/subjects", fmt(LT.collegesNamed) + " of " + fmt(LT.colleges) + " colleges") : "",
            LT ? " with a catalog on file. Owner: the Courses bot takes each title from the catalog’s subject heading; a person settles the " : "",
            LT ? a("#commons/subjects/disagree", fmt(LT.untitled) + " codes with no title") : "",
            LT ? " (" + fmt(LT.notInCatalog) + " not in catalog, " + fmt(LT.notRead) + " not read yet, " + fmt(LT.blocked) + " blocked)." : ""]),
          p(["Step c, the M-ID, is the Courses and M-IDs card."])],
        method: [p([(sOf ? fmt(S.of) + " is the number of disciplines in the Common Subjects Reference; " + fmt(S.settled) + " have a settled common subject code. " : "")
          + (LT ? "The local titles come from the " + fmt(LT.colleges) + " catalogs filed so far (" + fmt(LT.courses) + " courses, " + fmt(LT.codes) + " subject codes). A title is the catalog’s own subject heading, saved in Title Case. A code with no title says why: not in catalog (the catalog was read and gives it no heading, so it waits on a person), not read yet (Sky reads it again), or blocked (the college’s site refused our reader). "
            + "Each catalog’s codes are compared with the state course list’s codes for the same college, exactly, after trimming spaces and setting upper case: " + fmt(LT.catalogOnly) + " codes are in the catalog only and " + fmt(LT.stateOnly) + " in COCI only. "
            + "The common subject code beside a local code comes from the subject map and each discipline’s settled code, never from a TOP code."
            : "The local subject titles file has not been read, so Step b reads TBA.")])],
        links: [["Open the subjects list", "#commons/subjects"], ["Codes the mint holds on", "#commons/subjects/held"], ["Common Subjects Reference", "#canonical-subj4"]] }),
      card({ key: "courses", title: "Courses and M-IDs", pill: "In progress",
        big: fmt(Cd.ready) + " of " + fmt(Cd.total), rest: [" cards the automatic check scores as ready (0.85 or better)"],
        after: [meter(cardPct, fmt(Cd.ready) + " of " + fmt(Cd.total) + " ready, " + Math.round(cardPct) + " percent")],
        body: [p(["Local courses grouped into shared common courses, each with a shared course ID (an M-ID)."]),
          p([el("strong", { text: "M-ID gap — not counted yet" }), " A once-through count of program courses with no shared course ID is not counted yet. Open the Courses list’s ", a("#coci-lookup/list/nomid", "Needs an M-ID filter"), ". One known cause: " + fmt(ASKED.missingMembership) + " cards are missing from the published list of which local courses belong to each shared course (a membership fix)."])],
        method: [p(["Of the " + fmt(Cd.total) + " cards, " + fmt(Cd.review) + " need review, " + fmt(Cd.repair) + " need repair, and " + fmt(Cd.notReady) + " are not ready. " + fmt(Cd.confirmed) + " have been confirmed by a person, " + fmt(Cd.confirmedReady) + " of them ready. The " + fmt(Cd.ready) + " ready cards are those the automatic check scores 0.85 or better. The M-ID gap is a placeholder; it is not the older 2,362 of 8,912 figure, which this page does not show. Five cards you already ruled on are still in the discipline-in-doubt file — see the ", a(REPO + "3447", "Backfill fix"), "."])],
        links: [["Open the Courses List", "#coci-lookup/courses"], ["Needs an M-ID filter", "#coci-lookup/list/nomid"]] }),
      card({ key: "exhibit", title: "Exhibit titles", pill: "In progress",
        big: fmt(E.stamped) + " of " + fmt(E.titles), rest: [" local titles reviewed"],
        after: [meter(exPct, fmt(E.stamped) + " of " + fmt(E.titles) + " reviewed, " + Math.round(exPct) + " percent")],
        body: [p(["The local titles colleges use in MAP, each filed under one credential name."]),
          p([fmt(E.noSubject) + " credentials have no common subject code yet. That list is growing:" + fmt(ASKED.noSubjectWas.n) + " on " + ASKED.noSubjectWas.day + ", now " + fmt(E.noSubject) + "."]),
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
          p(["The other two statuses, “Has a credit recommendation” and “No credit recommendation yet,” aren’t counted yet."])],
        method: [p([fmt(K.of) + " is the count of titles filed under one name. " + fmt(K.credit) + " of them have at least one college giving credit: " + fmt(K.one) + " at one college, " + fmt(K.two5) + " at 2–5, " + fmt(K.six10) + " at 6–10, and " + fmt(K.eleven) + " at 11 or more (max " + K.max + "), across " + fmt(K.lines) + " articulation lines. The other two statuses (“Has a credit recommendation” and “No credit recommendation yet”) are not yet counted once per credential; that split waits on a stable credential id and a link from each credential to its exhibits. ", a("#exhibits/list", "Open the list"), "."])],
        links: [["Open the credential list", "#exhibits/list"]] }),
      card({ key: "cr", title: "Credit Recommendations", pill: "In progress",
        big: fmt(X.rows), rest: [" rows in the CR inventory ", el("span", { cls: "cmf-badge", text: "Preliminary" })],
        after: [crBar, crLegend],
        body: [p(["One wording for each credit recommendation, so the same credit reads the same everywhere."]),
          p(["Colleges’ wording kept: Sam said yes on November 19, and the 36 groups are recorded. In cases like POST Basic Academy the course-number link itself may be wrong, so the rule flags those links for a check."])],
        method: [p([fmt(X.rows) + " is " + fmt(X.pairs) + " exhibit-plus-wording pairs plus " + fmt(X.noExhibit) + " worklist wordings with no exhibit. This is the inventory that rules actually move; it is not in the tracker on main yet. Two other counts measure different things: " + fmt(X.crm) + " is the count in MAP’s Custom Reporting Module, and the Commons page today tracks a narrower set — " + fmt(R.settled) + " of " + fmt(R.wordings) + " wordings settled (" + fmt(R.rule) + " by a rule, " + fmt(R.curator) + " more by a curator). Those " + fmt(R.settled) + " have not moved since " + X.since + " because human credit-recommendation curation is paused, and rule-settled counts only grow when a new rule ships. The credit-recommendation line should later point at this " + fmt(X.rows) + "-row inventory. On the " + fmt(R.groups) + " groups: Sam said yes on November 19 to keeping the colleges’ wording, and the 36 are recorded; each course-number link is flagged for a check. In the POST Basic Academy group, " + X.post.colleges + " colleges (" + X.post.rows + " rows) wrote “3 hours in Physical Training and Health Education (CSU GE Area E),” linked to C-ID AJ 110, whose official title is “Introduction to Criminal Justice.” In cases like POST Basic Academy the course-number link itself may be wrong, so the rule flags those links for a check. ", a("#cr-reference/open", "Wordings still open"), "."])],
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
    /* Item 4 (Sam, 2026-11-21: "check every card sits under the right one"): Credentials and Credit Recommendations are
       curated references, one name per credential and one wording per recommendation, so they sit under Curate;
       Connect keeps the connections to other datasets and platforms. */
    return { collect: collect, curate: curate.concat(connect.slice(0, 2)), connect: connect.slice(2), plan: planCard(M) };
  }

  function group(id, name, list) {
    return el("section", { cls: "cmf-group", "aria-labelledby": "cmf-g-" + id }, [el("h3", { cls: "cmf-group-h", id: "cmf-g-" + id, text: name }),
      el("div", { cls: "cmf-group-cards" }, list)]);
  }

  /* ── the page ── */
  var onResize = null;
  function render(root, M, opts) {
    opts = opts || {};
    ensureCss();
    migrate();
    root.removeAttribute("style");
    root.textContent = "";
    var all = [];
    var C = cards(M);
    all = C.collect.concat(C.curate, C.connect, [C.plan]);
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
      /* A Needs you link that jumps here opens the card first (item 1). */
      c._unfold = function () { if (c.classList.contains("cmf-folded")) { setFold(c, false); save(); later(); } };
    });
    var B = M.building;
    var wrap = el("div", { cls: "cmn-wrap cmf" }, [
      head,
      eta(M),
      needs(M, opts),
      el("div", { cls: "cmf-groups" }, [group("collect", "Collect", C.collect), group("curate", "Curate", C.curate), group("connect", "Connect", C.connect)]),
      el("div", { cls: "cmf-planrow" }, [C.plan]),
      p([el("strong", { text: "Building. " }), "Skills — issuer-published skills on " + fmt(B.skillsCreds) + " credentials so far. Also underway: " + fmt(B.industry) + " industry credentials from " + fmt(B.issuers) + " issuers, and a deeper outcomes read (" + fmt(B.outcomes) + " outcomes from " + fmt(B.outcomeCourses) + " courses at " + fmt(B.outcomeColleges) + " colleges so far)."], "cmf-line"),
      p([el("strong", { text: "More collection detail. " }), "The ", a("#collect", fmt(M.colleges.total) + "-college list"), ", districts, the data dictionary, APIs, sharing, and integrations move here from the old College Data Collection page."], "cmf-line"),
      p(["Scorecard (coverage and student outcomes) fills in here once both are built."], "cmf-line cmf-muted")
    ]);
    root.appendChild(el("div", { cls: "cmn-page cmf-page" }, [wrap]));
    /* Equal cards without empty space (COBIx's review of #3554): every expanded card takes the height of the tallest
       one at its clamped length, measured, so the rows line up across Collect / Curate / Connect. A card whose method
       is open grows on its own; a folded card and a phone's single column keep their own height. */
    /* Row by row: the nth card of each group shares a row, so each row takes its own tallest card and the next row
       still starts level across the three columns. */
    var groupsEl = wrap.querySelector(".cmf-groups");
    function tracks(n) {
      var t = n && window.getComputedStyle ? window.getComputedStyle(n).gridTemplateColumns : "";
      return t && t !== "none" ? t.trim().split(/\s+/).length : 0;
    }
    var rows = [];
    for (var rk = 0; rk < Math.max(C.collect.length, C.curate.length, C.connect.length); rk++) rows.push([C.collect[rk], C.curate[rk], C.connect[rk]].filter(Boolean));
    function equalize() {
      all.forEach(function (c) { c.style.minHeight = ""; });
      /* Rows are real only while the groups sit three across, each one card wide; once they wrap (a tablet, a phone)
         or a group goes two cards wide (a very wide screen), cards keep their own height (COBIx on #3554). */
      if (tracks(groupsEl) !== 3 || !groupsEl.querySelectorAll(".cmf-group-cards").length
        || Array.prototype.some.call(groupsEl.querySelectorAll(".cmf-group-cards"), function (g) { return tracks(g) !== 1; })) return;
      rows.forEach(function (row) {
        var open = row.filter(function (c) { return !c.classList.contains("cmf-folded"); });
        var basis = open.filter(function (c) { return !c.classList.contains("cmf-unclamped"); });
        var max = 0;
        (basis.length ? basis : open).forEach(function (c) { max = Math.max(max, c.offsetHeight || 0); });
        if (max) open.forEach(function (c) { c.style.minHeight = max + "px"; });
      });
    }
    var queued = false;
    function later() {
      if (queued) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(function () { queued = false; equalize(); });
    }
    wrap.addEventListener("click", function (e) { if (e.target && e.target.closest && e.target.closest(".cmf-fold, #cmf-all, .cmf-more")) later(); });
    wrap.addEventListener("toggle", later, true);   // a method toggle does not bubble; the capture phase still sees it
    if (onResize) window.removeEventListener("resize", onResize);   // a redraw replaces the last page's listener
    onResize = later;
    window.addEventListener("resize", onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later, function () {});
    save();
    later();
    return wrap;
  }

  function boot(root, C, opts) {
    opts = opts || {};
    /* The local subject titles are their own read: a missing file reads TBA on the Subjects card, never a broken page. */
    var titles = readJson(FILES.subjects).then(null, function () { return null; });
    var heldCodes = readJson(FILES.held).then(null, function () { return null; });
    /* The curation series and the spend are their own reads too: either missing reads TBA where it is used. */
    var history = readJson(FILES.history).then(null, function () { return null; });
    var spend = readJson(FILES.spend).then(null, function () { return null; });
    return Promise.all([readJson(FILES.program), readJson(FILES.data), readJson(FILES.skills), titles, heldCodes, history, spend]).then(function (r) {
      var M = model(C, r[0], r[1], r[2], r[3], r[4], r[5], r[6]);
      render(root, M, opts);
      wireHandover(M, opts);
      if (opts.focus === "needs") focusNeeds();
      if (opts.course) openCourse(opts.course);
      /* The live read redraws only the held line; a failed read leaves the status file's line, named as of its time. */
      var live = heldLive().then(function (L) {
        var box = document.getElementById("cmf-held");
        if (box) drawHeld(box, M, L);
        M.heldLive = L;
        redrawNeeds(M);   /* the ranked links take the live count of titles still to name */
      }, function (e) { M.heldLiveError = String(e && e.message || e); });
      M.ready = live;
      return live.then(function () { return M; });
    });
  }
  /* The course panel (#commons/course/<control number>). A press on a course opens it in place: the address follows
     without a page move, and Close puts the address back. commons.js opens the course an arrival names and closes it
     when the address leaves (browser Back). */
  var COURSE = { noted: null };
  function setCourseAddress(key) {
    var h = key ? "#commons/course/" + encodeURIComponent(key) : "#commons";
    try { if (window.history && history.replaceState && location.hash !== h) history.replaceState(null, "", h); } catch (e) { /* the panel still opens */ }
    if (COURSE.noted) COURSE.noted(key || "");
  }
  function wireHandover(M, opts) {
    var H = HO();
    COURSE.noted = (opts && opts.onCourse) || null;
    if (!H) return;
    H.panel.set(H.coursesOf(M.hunt), { host: document.getElementById("tab-commons") || document.body, onAddress: setCourseAddress });
    H.panel.onChange(function () { drawStanding(M); });
    drawStanding(M);
    COURSE.M = M;
  }
  /* A return to the tab, or to the browser window, reads the hand-over counts again, so a hand-over made elsewhere
     takes its item off the lists (item 2). */
  function againLive() { if (COURSE.M && document.getElementById("cmf-needs")) drawStanding(COURSE.M); }
  window.addEventListener("cpl-tab-activated", function (e) { if (e && e.detail && e.detail.tab === "commons") againLive(); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") againLive(); });
  function openCourse(key, from) {
    var H = HO();
    if (!H) return false;
    var cur = H.panel.current();
    if (cur && H.courseKey(cur) === String(key)) return true;   /* already open on it: what a person typed stays */
    return H.panel.open(key, from || null);
  }
  function closeCourse() { var H = HO(); if (H && H.panel.isOpen()) H.panel.close(); }
  document.addEventListener("click", function (e) {
    var l = e.target && e.target.closest ? e.target.closest(".cmf-needs a[data-course]") : null;
    if (!l || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (openCourse(l.getAttribute("data-course"), l)) e.preventDefault();
  });

  /* A link to a card on this page (onPage): jump, never route. */
  document.addEventListener("click", function (e) {
    var l = e.target && e.target.closest ? e.target.closest(".cmf a[data-onpage]") : null;
    if (!l || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (jump(l.getAttribute("data-onpage"))) e.preventDefault();
  });

  /* #commons/needs-you (#3566): the front page scrolled to Needs you, its heading focused. */
  function focusNeeds() {
    var h = document.getElementById("cmf-needs-h");
    if (!h) return false;
    var sec = document.getElementById("cmf-needs");
    if (sec && sec.scrollIntoView) sec.scrollIntoView({ block: "start" });
    if (h.focus) h.focus();
    return true;
  }

  /* ── The way back (#3566, design decision 4; Sam, 2026-11-21, item 9: "make sure I can always get back to commons
     from any surface") ──
     A link on the Commons front page, one of its cards, or College Data Collection marks the tab it opens; that tab then
     carries one link at its top until the person leaves it or returns to the front page: "Back to Needs you" when Needs
     you opened it, else "Back to CPL Commons". College Data Collection (#collect) and every Commons view under
     #commons/ carry "Back to CPL Commons" however they were reached. The mark lives in this page's memory only: nothing
     is stored (tabs never remember, Sam 2026-10-21). The link sits in the tab's pane, before its main container, so a
     view that redraws its own root keeps it, and it comes first in the pane's tab order. */
  var BACK = { tab: null, from: "", id: "cpl-back-needs" };
  function tabOf(h) {
    var t = String(h || "").replace(/^#/, "").split("/")[0];
    return t === "collect" ? "commons" : t;
  }
  function atFront(h) { return /^#?(commons\/?|commons\/needs-you(\/.*)?|commons\/course\/.*)?$/.test(String(h || "")); }
  /* College Data Collection or a Commons view other than the front page. */
  function commonsView(h) { var s = String(h || "").replace(/^#/, ""); return /^(commons\/)?collect(\/|$)/.test(s) || (/^commons\/./.test(s) && !atFront(s)); }
  function placeBack() {
    var old = document.getElementById(BACK.id), h = location.hash || "", t = tabOf(h);
    if (BACK.tab && (t !== BACK.tab || atFront(h))) { BACK.tab = null; BACK.from = ""; }
    var tab = BACK.tab, from = BACK.from;
    if (!tab && commonsView(h)) { tab = "commons"; from = "commons"; }
    if (!tab) { if (old) old.parentNode.removeChild(old); return null; }
    var pane = document.getElementById("tab-" + tab);
    if (!pane) return null;
    if (old && old.parentNode && pane.contains(old) && old.getAttribute("data-back") === from) return old;
    if (old && old.parentNode) old.parentNode.removeChild(old);
    ensureBackCss();
    var link = from === "needs" ? a("#commons/needs-you", "Back to Needs you") : a("#commons", "Back to CPL Commons");
    var nav = el("nav", { id: BACK.id, cls: "cpl-back-needs", "data-back": from, "aria-label": from === "needs" ? "Back to the Commons priorities" : "Back to the CPL Commons" }, [link]);
    var main = pane.querySelector(":scope > .main-container");
    pane.insertBefore(nav, main || pane.firstChild);
    return nav;
  }
  function markBack(href, from) { BACK.tab = tabOf(href); BACK.from = from || "needs"; }
  document.addEventListener("click", function (e) {
    var l = e.target && e.target.closest ? e.target.closest(".cmf a[href^='#'], .cdd a[href^='#']") : null;
    if (!l || l.hasAttribute("data-onpage")) return;
    var href = l.getAttribute("href");
    if (atFront(href)) return;
    var from = l.closest(".cmf-needs") ? "needs" : "commons";
    /* A link inside College Data Collection keeps the mark Needs you gave it while it stays in the Commons tab. */
    if (from === "commons" && BACK.tab && BACK.tab === tabOf(href)) return;
    markBack(href, from);
    /* the hash change that follows places it; a link to the address already open places it now */
    if (location.hash === href) placeBack();
  }, true);
  window.addEventListener("hashchange", placeBack);
  window.addEventListener("cpl-tab-activated", function () { placeBack(); });
  var BACK_CSS = [
    ".cpl-back-needs { max-width:1400px; margin:0 auto; padding:12px 2rem 0; box-sizing:border-box; font-size:.95rem; }",
    ".cpl-back-needs a { display:inline-block; min-height:24px; line-height:24px; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; font-weight:600; }",
    ".cpl-back-needs a:hover { text-decoration-thickness:2px; }",
    ".cpl-back-needs a:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; border-radius:2px; }",
    "#tab-commons .cpl-back-needs a { color:var(--cmn-link); }",
    "#tab-commons .cpl-back-needs a:focus-visible { outline-color:var(--cmn-accent); }",
    "@media (max-width: 560px) { .cpl-back-needs { padding:12px 16px 0; } }"
  ].join("\n");
  function ensureBackCss() {
    if (document.getElementById("cpl-back-needs-css")) return;
    document.head.appendChild(el("style", { id: "cpl-back-needs-css", text: BACK_CSS }));
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
    ".cmf-method > summary, .cmf-tablefold > summary { list-style:none; cursor:pointer; display:inline-flex; align-items:center; min-height:24px; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.9rem; }",
    ".cmf-method > summary::-webkit-details-marker, .cmf-tablefold > summary::-webkit-details-marker { display:none; }",
    ".cmf-method > summary:focus-visible, .cmf-tablefold > summary:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".cmf-method-body p { margin:6px 0 0; color:var(--cmn-ink-2); font-size:.9rem; }",
    /* The daily chart (item 7): the lines differ by dash pattern and a legend word, never by color alone. */
    ".cmf-chart { margin:0; display:grid; gap:6px; min-width:0; }",
    ".cmf-chart figcaption { color:var(--cmn-ink-2); font-size:.84rem; }",
    ".cmf-plots { display:grid; gap:2px; min-width:0; padding:4px 0; border-radius:4px; cursor:crosshair; }",
    ".cmf-plots:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cmf-plot { width:100%; height:120px; display:block; overflow:visible; }",
    ".cmf-plot-cost { height:60px; }",
    ".cmf-plot path, .cmf-plot line { vector-effect:non-scaling-stroke; fill:none; }",
    ".cmf-l-actual { stroke:var(--cmf-s-programs); stroke-width:2.5; }",
    ".cmf-dot { fill:var(--cmf-s-programs); }",
    ".cmf-l-need { stroke:var(--cmn-ink-2); stroke-width:2; stroke-dasharray:8 5; }",
    ".cmf-l-trend { stroke:var(--cmn-muted); stroke-width:2; stroke-dasharray:2 4; stroke-linecap:round; }",
    ".cmf-b-cost { fill:var(--cmn-accent); }",
    ".cmf-mark { stroke:var(--cmn-heading); stroke-width:1; stroke-opacity:.5; }",
    ".cmf-base { stroke:var(--cmn-line); stroke-width:1; }",
    ".cmf-axis { margin:0; font-size:.76rem; color:var(--cmn-muted); }",
    ".cmf-axis-x { display:flex; justify-content:space-between; }",
    ".cmf-readout { margin:0; font-size:.86rem; color:var(--cmn-ink); min-height:1.4em; font-variant-numeric:tabular-nums; }",
    ".cmf-key { display:inline-block; flex:0 0 auto; width:22px; height:0; border-top:2.5px solid var(--cmf-s-programs); align-self:center; }",
    ".cmf-key-need { border-top:2px dashed var(--cmn-ink-2); }",
    ".cmf-key-trend { border-top:2px dotted var(--cmn-muted); }",
    ".cmf-key-cost { width:10px; height:10px; border:0; background:var(--cmn-accent); border-radius:2px; }",
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
    ".cmf-need-list { list-style:none; margin:0; padding:0; display:grid; gap:6px; }",
    ".cmf-need-list li { display:grid; gap:2px; min-width:0; overflow-wrap:anywhere; }",
    ".cmf-need-t { font-weight:600; }",
    ".cmf-held { display:grid; gap:4px; }",
    ".cmf-need p.cmf-standing { color:var(--cmn-muted); font-size:.86rem; } .cmf-need p.cmf-standing:empty { display:none; }",
    ".cmf-term-box { margin-top:4px; }",
    ".cmf-saved-list { margin:4px 0 0; padding-left:18px; color:var(--cmn-ink-2); font-size:.88rem; overflow-wrap:anywhere; }",
    "#cmf-needs-h:focus { outline:none; }",
    ".cmf a { color:var(--cmn-link); text-underline-offset:3px; }",
    ".cmf a:hover { color:var(--cmn-heading); }",
    ".cmf a:focus-visible, .cmf button.cmn-word:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".cmf-need-links a, .cmf-links a, .cmf-need a { display:inline-block; min-height:24px; line-height:24px; }",
    /* The ask's minmax(340px) with COBI's side menu leaves ~950px at 1280, two groups wide; 280px keeps Collect /
       Curate / Connect side by side at 1280, which is what the ask wants, and a phone still gets one column. */
    ".cmf-groups { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap:20px; align-items:start; }",
    ".cmf-group { display:grid; gap:12px; min-width:0; }",
    /* Bigger Collect / Curate / Connect headers (item 4). */
    ".cmf-group-h { margin:0; padding-bottom:4px; border-bottom:2px solid var(--cmn-gold); font-family:var(--cmn-serif); font-size:clamp(1.35rem, 3vw, 1.7rem); font-weight:700; color:var(--cmn-heading); }",
    ".cmf-group-cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap:16px; }",
    ".cmf-dates p.cmf-date-v { margin:0; }",
    ".cmf-card { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:18px 20px; display:flex; flex-direction:column; gap:10px; min-width:0; box-sizing:border-box; }",
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
    /* "...(more)" (item 6): an underlined word in the link blue, 24px tall. */
    ".cmf-more { all:unset; box-sizing:border-box; cursor:pointer; align-self:flex-start; min-height:24px; line-height:24px; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.9rem; }",
    ".cmf-more:hover { color:var(--cmn-heading); }",
    ".cmf-more:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".cmf-more-body p, .cmf-more-body li { margin:6px 0 0; color:var(--cmn-ink-2); font-size:.9rem; }",
    ".cmf-more-body[hidden] { display:none; }",
    ".cmf-curlist { margin:4px 0 0; padding-left:18px; }",
    ".cmf-est { font-family:var(--cmn-sans); font-size:.85rem; font-weight:600; color:var(--cmn-ink-2); }",
    /* Needs you's ranked links (item 1) and the hand-over chip (item 2). */
    ".cmf-rank { margin:0; padding-left:1.6em; display:grid; gap:6px; }",
    ".cmf-rank li { min-width:0; overflow-wrap:anywhere; }",
    ".cmf-rank-t { font-weight:600; }",
    ".cmf-rank-n, .cmf-rank-w { margin-left:8px; font-size:.88rem; color:var(--cmn-ink-2); }",
    ".cmf-rank-w { color:var(--cmn-ask-label); font-weight:600; }",
    ".cmf-rank-rest { margin:4px 0 0; color:var(--cmn-ink-2); font-size:.9rem; }",
    ".cmf-need-head { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 10px; }",
    ".cmf-need-body { display:grid; gap:4px; }",
    /* The Plan (item 5) and College Data Collection (item 8). */
    ".cmf-plan .cmf-body { display:block; -webkit-line-clamp:unset; line-clamp:none; max-height:none; overflow:visible; }",
    ".cmf-phases { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap:12px 24px; }",
    ".cmf-phase { min-width:0; } .cmf-phase h4 { margin:0; font-size:1rem; color:var(--cmn-heading); }",
    ".cmf-phase-sub { margin:0 0 4px; color:var(--cmn-muted); font-size:.88rem; }",
    ".cmf-phase-dl { margin:0; } .cmf-phase-dl dt { font-weight:700; color:var(--cmn-heading); font-size:.88rem; margin-top:6px; } .cmf-phase-dl dd { margin:0; }",
    ".cmf-cdc-lines { padding-left:18px; } .cmf-cdc-lines li { margin-bottom:4px; }",
    ".cmf-topfix { margin:0; font-size:.92rem; color:var(--cmn-ink); }",
    ".cmf-stuck { overflow-wrap:anywhere; }",
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
    focusNeeds: focusNeeds, openCourse: openCourse, closeCourse: closeCourse, heldLive: heldLive, drawHeld: drawHeld, placeBack: placeBack, markBack: markBack, BACK: BACK, LIVE: LIVE,
    FOLD_KEY: FOLD_KEY, ORDER_KEY: ORDER_KEY, DETAILS_ORDER_KEY: DETAILS_ORDER_KEY, DETAILS_FOLD_KEY: DETAILS_FOLD_KEY, FILES: FILES, ASKED: ASKED };
})();
