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
// Read live, Range-paged, so a person's save moves its card's figures at once (S719; "The cards answer their own
// edits" below): kb/exhibits_review.json and the held titles' kb_curation saves (Exhibit titles, Needs you's held
// line); the hand-over counts (CPL_HANDOVER.summary; Courses data, Needs you); for a signed-in reviewer, the
// cr_reference_decisions table and, when it holds a decision newer than the last receipt, kb/cr_reference_worklist.json
// (Credit Recommendations).
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
    held: "kb/status/held_subject_codes.json", readiness: "kb/status/mid_readiness.json", history: "kb/status/commons_history.json", spend: "kb/reference/model_spend_daily.json" };
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
        names: ex.credentials, noSubject: ex.no_subject, left: ex.left_map, renamed: ex.review_list, foldAt: ex.fold_at || "" },
      held: { n: held.n, unsure: heldParts ? heldParts[1] : null, issuers: heldParts ? heldParts[2] : null, code: heldParts ? heldParts[3] : null },
      cr: { settled: cr.settled, wordings: cr.wordings, rule: cr.rule_wordings, curator: cr.curator_only, groups: cr.names_to_check,
        through: cr.decisions_through || "", liveRows: cr.live_rows || 0 },
      subjects: { settled: subj.settled, of: subj.disciplines },
      /* Step b (S694): the local subject titles the Courses bot drafted from the printed catalogs; null reads TBA. */
      localTitles: LS && LS.totals ? { colleges: LS.totals.colleges, named: LS.totals.named, collegesNamed: LS.totals.colleges_named,
        codes: LS.totals.catalog_codes, oneSided: (LS.totals.catalog_only || 0) + (LS.totals.state_only || 0),
        catalogOnly: LS.totals.catalog_only, stateOnly: LS.totals.state_only, courses: LS.totals.courses,
        notInCatalog: LS.totals.not_in_catalog || 0, notRead: LS.totals.not_read || 0, blocked: LS.totals.blocked || 0,
        /* S701: the noncredit hold lifted, so every untitled code reads one of the three reasons. */
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
  /* A quick link lands on a link, never on bare text (Sam, S722, 2026-11-24: "it should drop you on a lower link and
     highlight the link so user knows to click the link when ready. Do not just drop the user on text that has no link").
     The check's Where to act link the quick link names (data-onpage-to, its href), else the check's first one, takes
     the focus and a highlight that stays until the focus leaves it. */
  function landOn(t, to) {
    var links = t.querySelectorAll ? Array.prototype.slice.call(t.querySelectorAll(".cmf-act a[href]")) : [];
    var l = links.filter(function (x) { return to && x.getAttribute("href") === to; })[0] || links[0];
    if (!l) return false;
    if (l.scrollIntoView) l.scrollIntoView({ block: "center" });
    l.classList.add("cmf-hl");
    l.addEventListener("blur", function off() { l.classList.remove("cmf-hl"); l.removeEventListener("blur", off); });
    if (l.focus) l.focus();
    return true;
  }
  function jump(id, to) {
    var t = document.getElementById(id);
    if (!t) return false;
    if (typeof t._unfold === "function") t._unfold();
    if (t.classList && t.classList.contains("cmf-check") && landOn(t, to)) return true;
    if (t.scrollIntoView) t.scrollIntoView({ block: "start" });
    /* A check takes the focus itself: its own heading is a line, and a check may hold a subheading of its own. */
    var h = t.classList && t.classList.contains("cmf-check") ? t : t.querySelector("h3, h4") || t;
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
      redrawCards(M, ["courses-data"]);   /* the outlines a person must find, as Needs you counts them */
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
        return page(LIVE.url + "?select=course_id,field,value,reviewed_at&field=eq." + LIVE.field + "&course_id=in.(" + q.join(",") + ")&order=course_id.asc", 0, []);
      })).then(function (parts) {
        var by = {}, at = {};
        parts.forEach(function (rows) { rows.forEach(function (r) {
          var v = String(r.value || "").trim();
          if (r.field === LIVE.field && String(r.course_id || "").indexOf(LIVE.prefix) === 0 && v) {
            by[r.course_id.slice(LIVE.prefix.length)] = v; at[r.course_id.slice(LIVE.prefix.length)] = r.reviewed_at || "";
          }
        }); });
        /* Each save keeps its time, so the Exhibit titles card can tell a save the fold already carried (exhibitsNow). */
        var saved = raws.filter(function (r) { return by[r]; }).map(function (r) { return { raw: r, value: by[r], at: at[r] }; });
        return { held: held.length, saved: saved, open: held.length - saved.length, at: d.written_at };
      });
    });
  }

  /* ── The cards answer their own edits (S719; Sam, 2026-11-23: "when I make edits or decisions, they are immediately
     reflected in the numbers (going in the right direction) shown in the links. Then I will want to apply the same
     process and principles to the other commons cards") ──
     The Subjects card's rule (d-subjects-figures-live-s715) on every card that has a save to read: a figure is the
     committed count plus the live saves the build has not carried, judged by the test its own list applies, and the
     card draws again in place (redrawCards) when a read answers. Every read here is read-only and Range-paged.
       Exhibit titles: a held title a person saved leaves the held count (heldLive, the Exhibits Review queue's own
         test) and carries a person's review stamp. The nightly fold writes that stamp, so a save made before the fold's
         last report (the exhibit row's fold_at) may be counted already and is never added a second time.
       Courses data: the outlines a person must find drop each course handed over (CPL_HANDOVER.summary, needsModel),
         as Needs you's list and College Data Collection's to-do do.
       Credit Recommendations: a wording a curator's decision names is settled (crLive), the CR tab's own test over its
         decisions table, read for a signed-in reviewer once the table holds a decision newer than the last receipt.
     Left to the nightly build, each card's method saying so (LIVE_WORDS): the program records; the Courses and M-IDs
     card, whose scores the automatic check writes nightly and whose Assign lists a course at the next build; and the
     College Data Collection states, which change when a session loads what a person handed over. */
  var LIVE_WORDS = {
    exhibit: "A held title a person names on the Exhibits tab leaves the held count at once and counts as reviewed, with a person’s stamp, while it waits for the nightly build to add it to the reference.",
    coursesData: "A course handed over leaves the count of outlines a person must find at once, as it leaves Needs you.",
    cr: "Signed in, a wording a curator’s decision names on the Credit Recommendations tab counts as settled at once; signed out, the count is the last receipt’s.",
    programs: "These counts come from the program records, which refresh nightly: a hand-over or a save shows here after the next build.",
    courses: "The automatic check scores the cards nightly, and an Assign in the Courses List lists its course under the common course at the next daily build, so these counts move then.",
    cdc: "A hand-over takes its item off Needs you at once; a college’s state here changes when a session loads what was handed over, at the next build."
  };
  function copyOf(o) { var x = {}; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) x[k] = o[k]; return x; }
  /* The Exhibit titles card's figures with the live held read on top. held is the titles still held (the status file's
     count until the read answers); fresh is the saves since the fold's last report, each one a person's stamp. */
  function exhibitsNow(M) {
    var E = copyOf(M.exhibits), L = M.heldLive;
    E.held = L ? L.open : (M.held && M.held.n) || 0;
    E.fresh = 0;
    if (L && L.saved && L.saved.length && E.stamped != null) {
      var fold = Date.parse(E.foldAt || "") || 0;
      E.fresh = L.saved.filter(function (x) { var t = Date.parse(x && x.at || ""); return !isNaN(t) && t > fold; }).length;
      E.stamped += E.fresh;
      E.person = (E.person || 0) + E.fresh;
    }
    return E;
  }
  /* The Credit Recommendations card's figures with the live decisions on top (crLive), once they read. */
  function crNow(M) {
    var R = copyOf(M.cr), F = M.crLive;
    if (F && F.fresh) { R.settled = F.settled; R.wordings = F.wordings; R.rule = F.rule; R.curator = F.curator; R.fresh = F.fresh; }
    return R;
  }
  var CRL = { url: "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/cr_reference_decisions", worklist: "kb/cr_reference_worklist.json",
    page: 1000, settles: { confirmed: true, not_a_topic: true } };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  /* What the build carried: until a copy of the live table is committed, the decisions through the last receipt's day
     ("Nov 19, 2026", the row's decisions_through); once one is, the decisions as of the build. */
  function crCarried(M) {
    var R = M.cr, built = Date.parse(M.commonsAt || "") || 0;
    var m = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/.exec(String(R.through || "")), mo = m ? MONTHS.indexOf(m[1]) : -1;
    return R.liveRows > 0 || mo < 0 ? built : Date.UTC(+m[3], mo, +m[2] + 1);
  }
  function listOf(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") { try { var x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch (e) { return []; } }
    return [];
  }
  /* kb/_build_commons_status.py row_cr()'s count over the live table: a wording is settled when a rung 1 to 4 rule
     places it (its group acts automatically) or a confirmed or not-a-topic decision names it and does not exclude it. */
  function crFigures(W, D) {
    var of = Object.create(null), rule = Object.create(null), named = Object.create(null), by = Object.create(null);
    ((W && W.groups) || []).forEach(function (g) {
      (g.members || []).forEach(function (m) { if (!m || m.rec == null) return; of[m.rec] = true; if (g.acts_automatically) rule[m.rec] = true; });
    });
    (D || []).forEach(function (r) { if (r && r.group_key) by[r.group_key] = r; });
    Object.keys(by).forEach(function (k) {
      var d = by[k], out = Object.create(null);
      if (!CRL.settles[d.decision]) return;
      listOf(d.excluded).forEach(function (w) { out[w] = true; });
      listOf(d.members).forEach(function (w) { if (!out[w] && of[w]) named[w] = true; });
    });
    var F = { settled: 0, wordings: 0, rule: 0, curator: 0 };
    Object.keys(of).forEach(function (w) {
      F.wordings++;
      if (rule[w]) F.rule++;
      if (rule[w] || named[w]) F.settled++;
      if (named[w] && !rule[w]) F.curator++;
    });
    return F;
  }
  /* The decisions table answers a signed-in reviewer (the CR tab reads it the same way). With no decision newer than
     what the build carried, the committed count stands and the worklist is not read; otherwise the count is taken
     again over the whole table, so a decision counts once however it reached the build. */
  function crLive(M) {
    var S = window.CPL_SESSION, s = S && typeof S.get === "function" ? S.get() : null;
    if (!s || !s.access_token || typeof S.authHeaders !== "function" || (typeof S.isFresh === "function" && !S.isFresh(s))) return Promise.resolve(null);
    var rows = [];
    function page(from) {
      return fetch(CRL.url + "?select=group_key,decision,members,excluded,updated_at&order=group_key.asc",
        { headers: S.authHeaders({ "Range-Unit": "items", Range: from + "-" + (from + CRL.page - 1) }) })
        .then(function (r) { if (!r.ok) throw new Error("the decisions table answered " + r.status); return r.json(); })
        .then(function (arr) { arr = Array.isArray(arr) ? arr : []; rows = rows.concat(arr); return arr.length === CRL.page ? page(from + CRL.page) : rows; });
    }
    var at = crCarried(M);
    return page(0).then(function (D) {
      var fresh = D.filter(function (r) { var t = Date.parse(r && r.updated_at || ""); return !isNaN(t) && t > at; }).length;
      if (!fresh) return { fresh: 0 };
      /* The worklist is committed and changes only with a deploy: read once a page load. */
      var W = CRL.W || (CRL.W = readJson(CRL.worklist).then(null, function (e) { CRL.W = null; throw e; }));
      return W.then(function (w) { var F = crFigures(w, D); F.fresh = fresh; return F; });
    });
  }
  /* The cards named, drawn again from the model; each takes its old one's place (render's M._swap) only when a figure
     or a word changed. */
  function redrawCards(M, keys) {
    if (!M || typeof M._swap !== "function") return [];
    var C = cards(M), done = [];
    C.collect.concat(C.curate, C.connect).forEach(function (c) { if (keys.indexOf(c.getAttribute("data-key")) >= 0 && M._swap(c)) done.push(c.getAttribute("data-key")); });
    return done;
  }

  /* One card: title, pill, headline (its number stays when folded), meter, body (clamped to six lines), "...(more)"
     (which un-clamps the body and opens the notes under it) and the reserved link row. Every card has an id, so a
     Needs you link can jump to it (item 1). */
  /* ── The Subjects card (Sam's mock of 2026-11-23, artboards Main and Colleges): the share of courses under a Confident
     common code, then four checks under Collect, Curate and Connect, each with a "Where to act" line. Sam's ruling
     r-confidence-not-person-settled-sam-2026-11-23 sets the measure: a call is settled when it is Confident, whether
     the data took it there or a person's confirm did. Every figure is drawn first from the status files, then again
     from commons_subjects.js's own figures with the live saves on top (subjectsLive), so the card answers an edit at
     once and never disagrees with the Subjects tab ("when I make edits or decisions, they are immediately reflected
     in the numbers"). ── */
  var LEVEL_WORDS = ["Confident", "Likely", "Leaning", "Unsure"];
  function share(n, of) { return of ? Math.round(n / of * 100) : 0; }
  function stage(name) { return el("h4", { cls: "cmf-stage", text: name }); }
  /* Every card of checks opens on its top section, with Collect, Curate and Connect folded (Sam, 2026-11-23: "With the
     addition of the top action links, we can default display the cards collapsed all but the tops sections"). A stage
     opens from its word, or from a quick link that points into it; what is open lasts the visit, across the live
     redraws, and is never stored (a fold, not a filter). One open map per card, under the card's key: the Subjects
     card's key is "subj", so its ids stay cmf-subj-stage-collect, cmf-subj-check-1 and cmf-subj-quick. */
  var OPEN = {};
  function stageFold(key, name, kids) {
    var seen = OPEN[key] || (OPEN[key] = {});
    var id = "cmf-" + key + "-stage-" + name.toLowerCase(), open = !!seen[name];
    var box = el("div", { cls: "cmf-stage-x", id: id }, kids.filter(Boolean));
    var b = el("button", { type: "button", cls: "cmf-stage-b", "aria-expanded": open ? "true" : "false", "aria-controls": id, text: name });
    function set(v) {
      seen[name] = v;
      b.setAttribute("aria-expanded", v ? "true" : "false");
      if (v) box.removeAttribute("hidden"); else box.setAttribute("hidden", "");
    }
    set(open);
    b.addEventListener("click", function () { set(b.getAttribute("aria-expanded") !== "true"); });
    Array.prototype.forEach.call(box.querySelectorAll(".cmf-check"), function (c) { c._unfold = function () { set(true); }; });
    return [el("h4", { cls: "cmf-stage" }, [b]), box];
  }
  function checkBox(key, n, kids) { return el("div", { cls: "cmf-check", id: "cmf-" + key + "-check-" + n }, kids.filter(Boolean)); }
  /* The quick links under the headline (Sam, 2026-11-23: "add a short bulleted set of quick links to prioritized action
     needed--the links can shoot down to links on the lower sections so user can get oriented and then one more click to
     the action view"): what most needs action first, each with its live count; each opens its check's stage, scrolls to
     the check and its Where to act line, and focuses it. A figure not read yet, or at zero, is left out. Each item is
     { check, n, text } or { check, n, one, many }, in the order of what most needs action; at most five show. */
  function quickLinks(key, items) {
    var shown = items.filter(function (i) { return i && i.check != null && typeof i.n === "number" && i.n > 0; }).slice(0, 5);
    if (!shown.length) return null;
    return el("div", { cls: "cmf-quick", id: "cmf-" + key + "-quick" }, [el("p", { cls: "cmf-sub", text: "Needs action first:" }),
      el("ul", { cls: "cmf-list" }, shown.map(function (i) {
        var l = onPage("cmf-" + key + "-check-" + i.check, fmt(i.n) + " " + (i.text || (i.n === 1 ? i.one : i.many)));
        if (i.to) l.setAttribute("data-onpage-to", i.to);
        return el("li", { "data-check": String(i.check) }, [l]);
      }))]);
  }
  function subjQuick(L, LT, HC, R, all) {
    return quickLinks("subj", [
      { check: 2, n: L && L.codes ? L.codes.Unsure : null, text: "local codes with an Unsure common code", to: "#commons/subjects/statewide" },
      { check: 1, n: LT ? LT.untitled : null, text: "titles to check", to: "#commons/subjects/disagree" },
      { check: 3, n: HC ? HC.held : null, text: "courses the M-ID mint holds", to: "#commons/subjects/held" },
      { check: 1, n: LT && all ? all - LT.collegesNamed : null, text: "colleges with no catalog read yet", to: "#collect" },
      { check: 4, n: R ? R.mids - R.ready : null, text: R ? R.code + " M-IDs not ready to re-mint" : "" }]);
  }
  function checkHead(n, name, fig) { return el("p", { cls: "cmf-check-h" }, [el("strong", { text: n + ". " + name }), el("span", { cls: "cmf-check-fig" }, fig)]); }
  function act(links) {
    var kids = [el("span", { cls: "cmf-act-l", text: "Where to act:" })];
    links.forEach(function (l) { kids.push(" "); kids.push(a(l[1], l[0])); });
    return el("p", { cls: "cmf-act" }, kids);
  }
  /* A card of checks (Sam's mock of 2026-11-23, the Subjects card's design carried to every card but the Plan): the
     headline, Needs action first, the short list (Why, Finished when, Confident where the card reads a measured score,
     Scale), then Collect, Curate and Connect, folded, each holding numbered checks. A check is { ref, name, fig, meter,
     line, extra, next, act }: its figure (TBA when unread), a meter where a share exists, one plain line, a Next line
     where the lane names one, and a Where to act line whose links open the place that holds those items. Checks number
     in page order; a quick link names its check by ref, so it always lands on a check that exists. A stage with no
     check is left out. */
  var STAGES = ["Collect", "Curate", "Connect"];
  function checksBody(key, o) {
    var num = {}, n = 0, stages = o.stages || {};
    STAGES.forEach(function (s) { (stages[s] || []).filter(Boolean).forEach(function (c) { num[c.ref] = ++n; }); });
    var body = [quickLinks(key, (o.quick || []).map(function (q) { return q && num[q.ref] ? { check: num[q.ref], n: q.n, text: q.text, one: q.one, many: q.many, to: q.to } : null; })),
      ul((o.defs || []).filter(function (d) { return d && d[1]; }).map(function (d) { return lead(d[0] + ":", d[1]); }))];
    STAGES.forEach(function (s) {
      var list = (stages[s] || []).filter(Boolean);
      if (!list.length) return;
      body = body.concat(stageFold(key, s, list.map(function (c) {
        return checkBox(key, num[c.ref], [checkHead(num[c.ref], c.name, c.fig || ["TBA"]), c.meter || null,
          c.line ? el("p", { cls: "cmf-check-line" }, typeof c.line === "string" ? [c.line] : c.line) : null]
          .concat(c.extra || [], [c.next ? ul(["Next: " + c.next]) : null, act(c.act)]));
      })));
    });
    return body.filter(Boolean);
  }
  function checksCard(o) {
    return card({ key: o.key, id: o.id, title: o.title, cls: "cmf-checks", pill: o.pill, pillCls: o.pillCls, big: o.big, rest: o.rest,
      after: o.after, body: checksBody(o.key, o), method: o.method, links: o.links });
  }
  function figOf(n, rest) { return n == null ? ["TBA"] : [el("strong", { text: fmt(n) }), rest || ""]; }
  function share100(n, of) { return of ? n / of * 100 : 0; }
  function meterOf(n, of, what) { return n == null || !of ? null : meter(share100(n, of), fmt(n) + " of " + fmt(of) + " " + what + ", " + Math.round(share100(n, of)) + " percent"); }
  function ul(items) { return el("ul", { cls: "cmf-list" }, items.filter(Boolean).map(function (i) { return el("li", null, typeof i === "string" ? [i] : i); })); }
  function lead(word, rest) { return [el("strong", { text: word + " " }), rest]; }
  function stack(L) {
    var T = L.totalPairs || 0;
    return el("div", { cls: "cmf-stack", role: "img", "aria-label": "Of " + fmt(T) + " college-and-code pairs: " + LEVEL_WORDS.map(function (k) { return fmt(L.pairs[k]) + " " + k; }).join(", ") },
      LEVEL_WORDS.slice(0, 3).map(function (k, i) { return el("i", { cls: "cmf-stack-" + i, style: "width:" + (T ? (L.pairs[k] / T * 100) : 0).toFixed(1) + "%" }); }));
  }
  function subjTitleKids(LT) {
    return LT ? [a("#commons/subjects", fmt(LT.named) + " local titles"), " at ", a("#commons/subjects", fmt(LT.collegesNamed) + " of " + fmt(LT.colleges) + " colleges"),
      " with a catalog on file. Owner: the Courses bot takes each title from the catalog’s subject heading. For each of the ",
      a("#commons/subjects/disagree", fmt(LT.untitled) + " titles to check"),
      " (" + fmt(LT.notInCatalog) + " not in catalog, " + fmt(LT.notRead) + " not read yet, " + fmt(LT.blocked) + " blocked), Sky recommends a title, and a person’s save confirms it."]
      : ["Local subject titles: TBA."];
  }
  function subjHeldKids(HC) {
    return HC ? [a("#commons/subjects/held", fmt(HC.held) + " courses the M-ID mint holds"), " wait on " + fmt(HC.codes) + " local subject codes with no common subject code. "
      + (HC.released ? fmt(HC.released) + " more are released by decisions saved since the build. " : "")
      + "A common subject code saved at a college releases its held courses with ordinary titles; a shell title stays held."]
      : ["The courses the M-ID mint holds for want of a common subject code: TBA."];
  }
  function subjectsParts(M) {
    var S = M.subjects, LT = M.localTitles, HC = M.heldCodes, L = M.subjLevels, SW = M.subjStatewide || {}, R = M.readiness, P = M.platforms || {};
    var sOf = !!S && S.of != null, all = SW.colleges || M.allColleges || null;
    var big = L ? share(L.courses.Confident, L.totalCourses) + "%" : M.subjLevelsError ? "TBA" : "…";
    var rest = [L || M.subjLevelsError ? " of courses sit under a local code with a Confident common code" : " Reading the confidence levels…"];
    var body = [subjQuick(L, LT, HC, R, all),
      ul([lead("Why:", "every M-ID starts with a common subject code (ELEC M9012), and each college’s local code (Cerritos AED) must point to the right one."),
        lead("Finished when:", "every college’s local codes carry the college’s own title and a Confident common code."),
        lead("Confident:", "90% or better, from the data or from a person’s confirm."),
        SW.codes ? lead("Scale:", fmt(SW.colleges) + " colleges, " + fmt(SW.codes) + " local codes, " + fmt(SW.pairs) + " college-and-code pairs, " + fmt(SW.courses) + " active and approved COCI courses.") : null])].concat(stageFold("subj", "Collect", [checkBox("subj", 1, [
      checkHead(1, "Each college’s own subject titles", LT && all ? [el("strong", { text: fmt(LT.collegesNamed) }), " of " + fmt(all) + " colleges"] : ["TBA"]),
      LT && all ? meter(share(LT.collegesNamed, all), fmt(LT.collegesNamed) + " of " + fmt(all) + " colleges, " + share(LT.collegesNamed, all) + " percent") : null,
      el("p", { id: "cmf-subj-titles" }, subjTitleKids(LT)),
      el("p", { cls: "cmf-sub", text: "The ways to look, tried in this order:" }),
      ul(["The catalog’s course descriptions: read at " + (LT ? fmt(LT.collegesNamed) : "TBA") + " colleges.",
        "The catalog system’s public data (CurriQunet " + fmt(P.curriqunet || 0) + ", eLumen " + fmt(P.elumen || 0) + "): the first probes are read; the filer is next.",
        LT && all ? "The class schedule, HTML or PDF: to try at " + fmt(all - LT.collegesNamed) + "." : null,
        "A department list: read at Cerritos.",
        "A person’s hand-over, where a site blocks our reader.",
        "COCI and the MIS reports carry no subject names.",
        "Who: Sky, in the nightly data collection."]),
      act([["The colleges and their titles", "#commons/subjects"], ["Titles to check", "#commons/subjects/disagree"], ["Hand over a file or link", "#collect"]])])]), stageFold("subj", "Curate", [checkBox("subj", 2, [
      checkHead(2, "A Confident common code for every local code", L ? [el("strong", { text: fmt(L.pairs.Confident) }), " of " + fmt(L.totalPairs) + " pairs"] : ["TBA"]),
      L ? stack(L) : null,
      L ? el("p", { cls: "cmf-sub", id: "cmf-subj-levels", text: LEVEL_WORDS.map(function (k) { return k + " " + fmt(L.pairs[k]); }).join(" · ") }) : null,
      ul([L ? "Next: Sky raises the " + fmt(L.codes.Unsure) + " Unsure codes with their titles and a web search." : null,
        sOf ? [S.settled === S.of ? "Done: all " : "", a("#canonical-subj4", fmt(S.settled) + " of " + fmt(S.of) + " disciplines settled"),
          " in the Common Subjects Reference" + (S.settled === S.of ? ", each with its common code." : ". Owner: a curator.")] : "Disciplines with a settled common code: TBA."]),
      act([["Every local code, statewide", "#commons/subjects/statewide"], ["Noncredit subject titles", "#commons/subjects/noncredit"], ["The MQ disciplines", "#commons/subjects/mq"]])])]), stageFold("subj", "Connect", [checkBox("subj", 3, [
      checkHead(3, "No course held for want of a code", HC ? [el("strong", { text: fmt(HC.held) }), " held"] : ["TBA"]),
      el("p", { id: "cmf-subj-held" }, subjHeldKids(HC)),
      ul(["Next: the mint takes Confident calls, so a course under a Confident code is placed."]),
      act([["Codes the mint holds on", "#commons/subjects/held"]])]), checkBox("subj", 4, [
      checkHead(4, "Re-mint scopes ready", R ? [el("strong", { text: fmt(R.ready) }), " of " + fmt(R.mids) + " M-IDs (" + R.code + ")"] : ["TBA"]),
      R ? meter(share(R.ready, R.mids), fmt(R.ready) + " of " + fmt(R.mids) + " M-IDs ready, " + share(R.ready, R.mids) + " percent") : null,
      R ? ul(["Members still held: " + Object.keys(R.member_status || {}).filter(function (k) { return k !== "settled" && R.member_status[k]; })
          .map(function (k) { return fmt(R.member_status[k]) + " " + k; }).join(", ") + ".",
        "Next: Sam’s twelve " + R.code + " titles, then one re-mint."]) : null,
      act(R && R.slug ? [[R.college.replace(/ College$/, "") + " " + R.code, "#commons/subjects/" + R.slug + "/" + R.code]] : [["The subjects list", "#commons/subjects"]])])]));
    return { big: big, rest: rest, body: body.filter(Boolean) };
  }
  /* The re-mint scope the readiness gate measures (kb/_mid_readiness.py), with the slug its college's view opens at. */
  function subjReadiness(R, LS) {
    var keys = Object.keys((R && R.scopes) || {}).sort();
    var x = keys.length ? R.scopes[keys[0]] : null;
    if (!x || x.mids == null) return null;
    var slug = "";
    ((LS && LS.colleges) || []).forEach(function (c) { if (c.college === x.college) slug = c.slug; });
    return { code: x.code, college: x.college, slug: slug, mids: x.mids, ready: x.ready, member_status: x.member_status || {} };
  }
  function subjectsCard(M) {
    var P = subjectsParts(M);
    return card({ key: "subjects", title: "Subjects", cls: "cmf-checks cmf-unclamped", pill: "In progress", big: P.big, rest: P.rest, body: P.body,
      method: [p(["A college-and-code pair is one local code at one college. Its level comes from the statewide list (kb/status/statewide_subject_codes.json): the subject map’s draft, the M-IDs its courses joined at three or more colleges, its course titles, and a noncredit code’s COCI category. A person’s statewide filing, or a common subject code saved at that college, makes the pair Confident at once. "
        + "The headline counts the active and approved COCI courses under each pair. The local titles come from the catalogs filed so far; a title is the catalog’s own subject heading, saved in Title Case. The common subject code beside a local code comes from the subject map, each discipline’s settled code, or a person’s save, never from a TOP code."])],
      links: [["Open the subjects list", "#commons/subjects"], ["Codes the mint holds on", "#commons/subjects/held"], ["Common Subjects Reference", "#canonical-subj4"]] });
  }
  function redrawSubjects(M) {
    var art = document.getElementById("cmf-card-subjects");
    if (!art) return;
    var P = subjectsParts(M), big = art.querySelector(".cmf-big"), rest = art.querySelector(".cmf-rest"), body = art.querySelector(".cmf-body");
    if (big) big.textContent = P.big;
    if (rest) { rest.textContent = ""; P.rest.forEach(function (c) { rest.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); }
    if (body) { body.textContent = ""; P.body.forEach(function (c) { body.appendChild(c); }); }
  }
  function subjectsLive(M) {
    function draw(X) {
      return X.liveFigures({ statewide: true }).then(function (F) {
        if (M.localTitles) {
          var LT = {};
          for (var k in M.localTitles) LT[k] = M.localTitles[k];
          ["named", "collegesNamed", "colleges", "untitled", "notInCatalog", "notRead", "blocked"].forEach(function (k) { LT[k] = F[k]; });
          M.localTitles = LT;
        }
        if (M.heldCodes && F.held != null) M.heldCodes = { held: F.held, codes: F.heldCodes, pairs: M.heldCodes.pairs, released: F.released };
        if (F.levels) { M.subjLevels = F.levels; M.subjStatewide = F.statewide; } else M.subjLevelsError = "the statewide list could not be read";
        redrawSubjects(M);
        return F;
      });
    }
    function fail(e) { M.subjLevelsError = String(e && e.message || e); redrawSubjects(M); throw e; }
    if (window.CPL_COMMONS_SUBJECTS && window.CPL_COMMONS_SUBJECTS.liveFigures) return draw(window.CPL_COMMONS_SUBJECTS).then(null, fail);
    var T = window.CPL_TABS;
    if (!T || typeof T.loadScript !== "function") { M.subjLevelsError = "the Subjects script is not loaded"; redrawSubjects(M); return Promise.resolve(null); }
    return new Promise(function (res, rej) {
      T.loadScript("commons_subjects.js", "CPL_COMMONS_SUBJECTS", function () {
        var X = window.CPL_COMMONS_SUBJECTS;
        if (X && X.liveFigures) draw(X).then(res, function (e) { try { fail(e); } catch (x) { rej(x); } });
        else { M.subjLevelsError = "the Subjects script is not loaded"; redrawSubjects(M); res(null); }
      });
    });
  }
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
      /* A card built unclamped (the Subjects card) stays so whatever its method line does; a card of checks shows its
         whole body anyway (.cmf-checks), so its method line only marks it unclamped while open. */
      var keep = art.classList.contains("cmf-unclamped");
      var m = more(o.method, function (open) { if (!keep) art.classList.toggle("cmf-unclamped", open); });
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
    var districts = M.colleges && M.colleges.districts > 1 ? ", in " + fmt(M.colleges.districts) + " districts (" + fmt(M.colleges.districts - 1) + " plus Calbright)" : "";
    /* Needs action first: a college stuck on a person or a fix, then the colleges the one top fix reaches. */
    return checksCard({ key: "cdc", title: "College Data Collection", pill: "In progress",
      big: fmt(C.catalogs.done) + " of " + fmt(C.all), rest: [" colleges and campuses with every catalog program passing"],
      quick: [{ ref: "catalogs", n: C.catalogs.stuck, one: "college whose catalog is stuck", many: "colleges whose catalogs are stuck" },
        { ref: "outlines", n: C.outlines.stuck, one: "college whose course outlines are stuck", many: "colleges whose course outlines are stuck" },
        { ref: "catalogs", n: C.top ? C.top.n : null, one: "college the top fix reaches", many: "colleges the top fix reaches" }],
      defs: [["Why", "the Commons collects each college’s catalogs, course outlines and credentials, and each count here is College Data Collection’s own list, so a count and the list it opens agree."],
        ["Finished when", "every college and campus is done on all three."],
        ["Scale", fmt(C.all) + " colleges and continuing-education campuses" + districts + "."]],
      stages: { Collect: [
        { ref: "catalogs", name: "Catalogs at every college", fig: figOf(C.catalogs.done, " of " + fmt(C.all) + " done"), meter: meterOf(C.catalogs.done, C.all, "colleges and campuses done"),
          extra: [el("ul", { cls: "cmf-cdc-lines" }, [line("Catalogs (programs, PLOs, course requirements)", C.catalogs, "catalogs", C.catalogsEta, "the program-records date reads TBA")]),
            stuckLine("Catalogs", C.catalogs),
            p(C.top ? ["Top fix: " + C.top.what + ", reaching ", a("#collect/fix_" + C.top.key, plural(C.top.n, "college", "colleges")), "."] : ["Top fix: TBA."], "cmf-topfix"),
            el("h4", { cls: "cmf-sub", text: "Colleges that moved this week" }), p(movedKids)],
          act: [["Catalogs stuck", "#collect/catalogs_stuck"], ["Open College Data Collection", "#collect"]] },
        { ref: "outlines", name: "Course outlines at every college", fig: figOf(C.outlines.done, " of " + fmt(C.all) + " done"), meter: meterOf(C.outlines.done, C.all, "colleges and campuses done"),
          extra: [el("ul", { cls: "cmf-cdc-lines" }, [line("Course outlines (SLOs, objectives, COCI)", C.outlines, "outlines", null, "no dated pace yet")]),
            stuckLine("Course outlines", C.outlines)],
          act: [["Outlines stuck", "#collect/outlines_stuck"], ["Outlines to find by hand", "#collect/slos"]] },
        { ref: "credentials", name: "Credentials at every college", fig: ["TBA"],
          extra: [el("ul", { cls: "cmf-cdc-lines" }, [el("li", { "data-dataset": "credentials" }, [el("strong", { text: "Credentials (issuer, skills): " }), "TBA, since the College Data Collection file holds no credential count by college. ETA: TBA."])])],
          next: "a count of credentials by college for this line.",
          act: [["The credential list", "#exhibits/list"]] }] },
      method: [p(["Each count is College Data Collection’s own list, so a count and the list it opens agree. Catalogs are done when every program in the college’s count passes, and stuck when no catalog is collected or the scout found the catalog blocked. Course outlines are done when SLOs and objectives sit on every course in the college’s Active programs, and stuck when the college’s SLO read has nothing to read or is paused; the reason beside each college is the file’s own. "
        + "The top fix is the one, of the fixes the file names for programs still to pass, that reaches the most colleges. A college moved this week when its catalog was collected within the last 7 days. "
        + "A stuck college waits on a person or on a fix to our reader; the line under the counts names which, college by college. "
        + "The file counts " + fmt(C.all) + " colleges and continuing-education campuses"
        + (M.colleges && M.colleges.districts > 1 ? ", in " + fmt(M.colleges.districts) + " districts (" + fmt(M.colleges.districts - 1) + " plus Calbright)." : ".")]),
        p([LIVE_WORDS.cdc])],
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

  /* The cards in Collect, Curate and Connect (Sam, 2026-11-24: "apply the design from the subject card to the other
     commons cards"). Every card but the Plan is a card of checks; every figure is one the model already reads, and an
     unmeasured one reads TBA. The Why and Next words come from the card's own lane file (lanes/commons.md and the
     lanes its tab belongs to). Each card's quick links run in the order of what most needs action: what waits on a
     person or a fix first, then the largest remaining count. Only the Courses and M-IDs card reads a measured
     0-to-1 score, so it alone carries a Confident line (the Subjects scale: Confident at 0.9 or better). */
  function cards(M) {
    var P = M.programs, Cl = M.colleges, Co = M.courses, Cd = M.cards, E = exhibitsNow(M), R = crNow(M), X = ASKED.cr, K = ASKED.credentials, B = M.building;
    var O = needsModel(M).outline, top = M.cdc && M.cdc.top;
    var noLink = Cl.registry != null && Cl.outlineLinks != null ? Cl.registry - Cl.outlineLinks : null;
    var collect = [
      checksCard({ key: "colleges", title: "Colleges and catalogs", pill: "Catalog blocked: " + fmt(Cl.blocked), pillCls: Cl.blocked ? "cmn-pill-needs" : "cmn-pill-done",
        big: fmt(Cl.collected), rest: [" colleges with a collected catalog"],
        quick: [{ ref: "catalog", n: Cl.blocked, one: "college with a blocked catalog", many: "colleges with a blocked catalog" },
          { ref: "catalog", n: ASKED.evergreen ? 1 : null, one: "catalog to read again for the newest year", many: "catalogs to read again for the newest year" },
          { ref: "outline", n: noLink, one: "college with no public outline link on file", many: "colleges with no public outline link on file" }],
        defs: [["Why", "each college’s catalog is the source of its program records: how each course counts toward the award, the program total and the catalog year."],
          ["Finished when", "every college’s current catalog is collected and read, and none is blocked."],
          ["Scale", fmt(Cl.total) + " colleges in " + fmt(Cl.districts) + " districts (" + fmt(Cl.districts - 1) + " plus Calbright); some adoption lists add " + fmt(Cl.ce) + " continuing-education campuses."]],
        stages: { Collect: [
          { ref: "catalog", name: "A collected catalog at every college", fig: figOf(Cl.collected, " of " + fmt(Cl.total) + " colleges"), meter: meterOf(Cl.collected, Cl.total, "colleges"),
            line: [fmt(Cl.collected) + " means we have read each college’s catalog and have saved a read of its ", a("#program-requirements/list", "program requirements"),
              ", at least once. Catalog blocked: " + fmt(Cl.blocked) + ". Still missing: about " + fmt(P.left) + " Active programs in current catalogs left to finish (every college still has some). "
              + ASKED.evergreen + "’s saved catalog read is still from the 2025–2026 catalog and needs a re-read for the newest year."],
            act: [[fmt(Cl.total) + "-college list", "#collect"], ["Colleges not collected yet", "#collect/unread"]] },
          { ref: "outline", name: "A public course outline link at every college", fig: figOf(Cl.outlineLinks, " of " + fmt(Cl.registry) + " colleges"), meter: meterOf(Cl.outlineLinks, Cl.registry, "colleges"),
            line: ["A course outline carries the course’s student learning outcomes and objectives; the ", onPage("courses-data", "Courses data"), " card counts them."],
            act: [["Outlines blocked", "#collect/outlines-blocked"], ["Hand over a file or link", "#collect"]] }] },
        method: [p(["“Collected” means we have saved a program-requirements catalog read for the college — the catalog has been read at least once. “Not collected yet” would mean no such saved read exists; today that count is " + fmt(Cl.total - Cl.collected) + ", and catalog blocked is " + fmt(Cl.blocked) + ". Some adoption lists also include " + fmt(Cl.ce) + " continuing-education campuses, which is why ASE coverage uses " + fmt(Cl.total + Cl.ce) + " names. The statewide district count is " + fmt(Cl.districts) + ": " + fmt(Cl.districts - 1) + " districts plus Calbright. Open the ", a("#collect", fmt(Cl.total) + "-college list"), " for the college-by-college view."])],
        links: [[fmt(Cl.total) + "-college list", "#collect"]] }),
      checksCard({ key: "programs", title: "Programs", pill: "In progress",
        big: fmt(P.complete) + " of " + fmt(P.active), rest: [" Active programs complete at ", a("#collect", fmt(Cl.collected) + " colleges")],
        after: [meter(pct(P.complete, P.active), fmt(P.complete) + " of " + fmt(P.active) + " complete, " + Math.round(pct(P.complete, P.active)) + " percent")],
        quick: [{ ref: "record", n: P.unread, one: "Active program with no record yet", many: "Active programs with no record yet" },
          { ref: "gap", n: P.gap, one: "Active program with a gap noted", many: "Active programs with a gap noted" },
          { ref: "target", n: P.left, one: "Active program left to finish", many: "Active programs left to finish" }],
        defs: [["Why", "each program’s required, list-choice and elective courses, so the units of credit for prior learning a student saves can be shown."],
          ["Finished when", "every Active program in its college’s current catalog has a complete record: about " + fmt(P.target) + ", the " + fmt(P.active) + " Active programs minus the COCI-only ones."],
          ["Scale", fmt(P.active) + " Active programs at " + fmt(Cl.collected) + " colleges."]],
        stages: {
          Collect: [
            { ref: "target", name: "A complete record for every program in the target", fig: figOf(P.complete, " of about " + fmt(P.target)), meter: meterOf(P.complete, P.target, "in the target complete"),
              line: "About " + fmt(P.left) + " left" + (P.doneN == null ? "; the date reads TBA." : " at about " + fmt(Math.round(P.pace)) + " a day: " + longDate(P.doneN) + ", estimated."),
              act: [["The programs list", "#program-requirements/list"], ["College Data Collection", "#collect"]] },
            { ref: "record", name: "A record for every Active program", fig: figOf(P.unread, " with no record yet"),
              line: fmt(P.unread) + " Active programs have no record yet; each college’s catalog read adds them.",
              act: [["Catalogs in progress", "#collect/catalogs_progress"], ["The programs list", "#program-requirements/list"]] }],
          Curate: [
            { ref: "gap", name: "No gap left in a record", fig: figOf(P.gap, " with a gap noted"),
              line: fmt(P.gap) + " Active programs have a gap noted in their record.",
              next: top ? "the top fix, which reaches " + plural(top.n, "college", "colleges") + ": " + top.what + "." : null,
              act: [["The programs list", "#program-requirements/list"]].concat(top ? [["The colleges the top fix reaches", "#collect/fix_" + top.key]] : []) }] },
        method: [p([fmt(P.complete) + " of " + fmt(P.active) + " is the live count of Active programs with a complete record. " + fmt(P.gap) + " have a gap noted; " + fmt(P.unread) + " have no record yet; " + fmt(P.confirmed) + " have been confirmed by a person, " + fmt(P.confirmedComplete) + " of them complete. A wider count of " + fmt(P.wider) + " of " + fmt(P.widerOf) + " adds Approved programs, which are approved but not yet offered (" + fmt(P.approved) + "), and Teachout programs, which are being phased out (" + fmt(P.teachout) + "). The collection target is every Active program in its college’s current catalog: " + fmt(P.active) + " minus the COCI-only programs, about " + fmt(P.target) + ", which leaves about " + fmt(P.left) + ". About " + fmt(P.cociOnly) + " COCI-only programs (active in the Chancellor’s Office curriculum inventory but not in the current catalog) are optional cleanup, not unfinished work, and are not part of that target. " + (P.doneN == null ? "" : "On pace, at about " + fmt(Math.round(P.pace)) + " a day, that target finishes " + longDate(P.doneN) + ". ") + "The older 72% “passing” card is cut from this page. ", a("#program-requirements/list", "Open the programs list"), "."]), p([LIVE_WORDS.programs])],
        links: [["Open Programs", "#program-requirements/list"]] }),
      checksCard({ key: "courses-data", id: "courses-data", title: "Courses data", pill: "In progress",
        big: fmt(Co.slo) + " of " + fmt(Co.active), rest: [" courses in active programs have student learning outcomes"],
        after: [meter(pct(Co.slo, Co.active), fmt(Co.slo) + " of " + fmt(Co.active) + " have SLOs, " + Math.round(pct(Co.slo, Co.active)) + " percent")],
        quick: [{ ref: "outlines", n: O ? O.courses : null, one: "course whose outline needs a person", many: "courses whose outline needs a person" },
          { ref: "slo", n: Co.sloLeft, one: "course in Active programs with no SLOs", many: "courses in Active programs with no SLOs" },
          { ref: "obj", n: Co.objLeft, one: "course in Active programs with no objectives", many: "courses in Active programs with no objectives" }],
        defs: [["Why", "a course’s student learning outcomes (SLOs) and objectives join the score that places it under its M-ID."],
          ["Finished when", "SLOs and objectives sit on every course in Active programs that can be read automatically; the count of those readable courses is TBA."],
          ["Scale", fmt(Co.active) + " courses in Active programs statewide."]],
        stages: { Collect: [
          { ref: "slo", name: "SLOs on every course", fig: figOf(Co.slo, " of " + fmt(Co.active)), meter: meterOf(Co.slo, Co.active, "courses with SLOs"),
            line: fmt(Co.sloColleges) + " colleges have any SLOs in the live statewide count. SLOs grew by " + fmt(Co.sloGrow) + " since the " + ASKED.sloSnap.at + " snapshot.",
            next: "the readable-course count, so SLOs and objectives join the collection date.",
            act: [["Outlines to find by hand", "#collect/slos"], ["Outlines blocked", "#collect/outlines-blocked"]] },
          { ref: "obj", name: "Course objectives on every course", fig: figOf(Co.obj, " of " + fmt(Co.active)), meter: meterOf(Co.obj, Co.active, "courses with objectives"),
            line: fmt(Co.objColleges) + " colleges have objectives in the live statewide count. Objectives grew by " + fmt(Co.objGrow) + " since that snapshot.",
            act: [["Outlines to find by hand", "#collect/slos"], ["Courses List", "#coci-lookup/courses"]] },
          { ref: "outlines", name: "Every outline a person must find", fig: O ? figOf(O.courses, " at " + plural(O.colleges.length, "college", "colleges")) : ["TBA"],
            line: huntWords(O) + " A public outline link is on file for " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges. A bot test found about 43% of colleges readable (range 35–65%); the Los Angeles district’s 9 colleges need a district request.",
            act: [["The courses by college", "#collect/outlines-blocked"], ["Hand over a file or link", "#collect"]] }] },
        method: [p([fmt(Co.active) + " is the number of courses that appear in Active programs statewide. " + fmt(Co.slo) + " of those already have student learning outcomes on file, and " + fmt(Co.obj) + " have course objectives (a course can have both). Those are live statewide counts. A separate Building-line read has " + fmt(M.building.outcomes) + " outcomes from " + fmt(M.building.outcomeCourses) + " courses at " + fmt(M.building.outcomeColleges) + " colleges; it is not the same " + fmt(Co.sloColleges) + "-college live SLO cut. The recent rates are measured from those nights, not one fixed nightly estimate: from the " + ASKED.sloSnap.at + " snapshot to this page’s counts, about one and a half days, SLOs grew by " + fmt(Co.sloGrow) + " (" + fmt(ASKED.sloSnap.slo) + " to " + fmt(Co.slo) + ") and objectives by " + fmt(Co.objGrow) + " (" + fmt(ASKED.sloSnap.obj) + " to " + fmt(Co.obj) + "). "
          + (Co.objDoneN != null && Co.sloDoneN != null ? "If every one of the " + fmt(Co.active) + " were already readable, objectives at about " + fmt(Math.round(Co.objGrow / 100) * 100) + " a night would finish around " + longDate(Co.objDoneN) + " (" + fmt(Co.objLeft) + " left), and SLOs at about " + fmt(Math.round(Co.sloGrow / 100) * 100) + " a night around " + longDate(Co.sloDoneN) + " (" + fmt(Co.sloLeft) + " left). " : "")
          + "Those dates are not shown, because a finish date should be set only for courses that can already be read automatically, and that readable-course count is not computed yet."]), p([LIVE_WORDS.coursesData])],
        links: [["Outlines blocked", "#collect/outlines-blocked"], ["Courses List", "#coci-lookup/courses"]] }),
      cdcCard(M)
    ];
    var unstamped = E.titles != null && E.stamped != null ? E.titles - E.stamped : null;
    var curate = [
      subjectsCard(M),
      checksCard({ key: "courses", title: "Courses and M-IDs", pill: "In progress",
        big: fmt(Cd.ready) + " of " + fmt(Cd.total), rest: [" cards the automatic check scores as ready (0.85 or better)"],
        after: [meter(pct(Cd.ready, Cd.total), fmt(Cd.ready) + " of " + fmt(Cd.total) + " ready, " + Math.round(pct(Cd.ready, Cd.total)) + " percent")],
        quick: [{ ref: "ready", n: Cd.repair, one: "card that needs repair", many: "cards that need repair" },
          { ref: "mid", n: ASKED.missingMembership, one: "card missing from the membership list", many: "cards missing from the membership list" },
          { ref: "ready", n: Cd.review, one: "card that needs review", many: "cards that need review" }],
        defs: [["Why", "each common course carries one shared course ID (an M-ID), so a local course at any college points to the same course."],
          ["Finished when", "every card scores Confident on the automatic check, and every course in an Active program sits under an M-ID."],
          ["Confident", "0.9 or better on the automatic check’s 0-to-1 score, from the data or from a person’s confirm. The count at 0.9 is TBA; the headline counts 0.85 or better."],
          ["Scale", fmt(Cd.total) + " cards, each one common course and its local courses."]],
        stages: {
          Curate: [
            { ref: "ready", name: "Every card scores ready", fig: figOf(Cd.ready, " of " + fmt(Cd.total)), meter: meterOf(Cd.ready, Cd.total, "cards ready"),
              line: fmt(Cd.review) + " need review and " + fmt(Cd.repair) + " need repair.",
              next: "Jev as a second stage, a same-course yes or no on the top candidates; then SLOs and objectives in the score where the outcomes are on file.",
              act: [["The Courses List", "#coci-lookup/courses"]] }],
          Connect: [
            { ref: "mid", name: "Every program course under an M-ID", fig: ["TBA"],
              line: ["A once-through count of program courses with no shared course ID is not counted yet; the Courses List’s ", a("#coci-lookup/list/nomid", "Needs an M-ID filter"),
                " lists them. One known cause: " + fmt(ASKED.missingMembership) + " cards are missing from the published list of which local courses belong to each shared course (a membership fix)."],
              next: "the pile mint’s next wave, 76 tutoring titles that name a subject, assigned under LSKL M9004.",
              act: [["Needs an M-ID filter", "#coci-lookup/list/nomid"]] }] },
        method: [p(["Of the " + fmt(Cd.total) + " cards, " + fmt(Cd.review) + " need review, " + fmt(Cd.repair) + " need repair, and " + fmt(Cd.notReady) + " are not ready. " + fmt(Cd.confirmed) + " have been confirmed by a person, " + fmt(Cd.confirmedReady) + " of them ready. The " + fmt(Cd.ready) + " ready cards are those the automatic check scores 0.85 or better. The M-ID gap is a placeholder; it is not the older 2,362 of 8,912 figure, which this page does not show. Five cards you already ruled on are still in the discipline-in-doubt file — see the ", a(REPO + "3447", "Backfill fix"), "."]), p([LIVE_WORDS.courses])],
        links: [["Open the Courses List", "#coci-lookup/courses"], ["Needs an M-ID filter", "#coci-lookup/list/nomid"]] }),
      checksCard({ key: "exhibit", title: "Exhibit titles", pill: "In progress",
        big: fmt(E.stamped) + " of " + fmt(E.titles), rest: [" local titles reviewed"],
        after: [meter(pct(E.stamped, E.titles), fmt(E.stamped) + " of " + fmt(E.titles) + " reviewed, " + Math.round(pct(E.stamped, E.titles)) + " percent")],
        quick: [{ ref: "stamp", n: unstamped, one: "local title with no review stamp", many: "local titles with no review stamp" },
          { ref: "subject", n: E.noSubject, one: "credential with no common subject code", many: "credentials with no common subject code" },
          { ref: "old", n: E.left, one: "old title no college uses", many: "old titles no college uses" }],
        defs: [["Why", "colleges type their own exhibit titles into MAP, and each files under one credential name, so a credential counts once."],
          ["Finished when", "every local title carries a review stamp and every credential a common subject code."],
          ["Scale", fmt(E.titles) + " local titles under " + fmt(E.names) + " credential names."]],
        stages: {
          Curate: [
            { ref: "stamp", name: "A review stamp on every local title", fig: figOf(E.stamped, " of " + fmt(E.titles)), meter: meterOf(E.stamped, E.titles, "titles reviewed"),
              line: "The nightly run applies the rules, then the classifier settles the rest; " + fmt(E.person) + " carry a person’s stamp and " + fmt(E.cohort) + " a review group’s."
                + (E.fresh ? " The person’s count holds " + plural(E.fresh, "held title a person named", "held titles a person named") + " since the last nightly build, which adds " + (E.fresh === 1 ? "it" : "them") + " to the reference next." : ""),
              next: "the Exhibits rename batch goes to Sam.",
              act: [["Open Exhibits", "#exhibits/list"], ["Renamed titles", "#exhibits/renamed"]] },
            { ref: "old", name: "Every old title retired", fig: figOf(E.left, " old titles"),
              line: "A local wording the Commons still files under a shared name, though no college’s current MAP exhibit uses it any more; nothing breaks while it stays.",
              act: [["Old titles", "#exhibits/list/left"]] }],
          Connect: [
            { ref: "subject", name: "A common subject code on every credential", fig: figOf(E.noSubject, " with none"),
              line: "That list is growing: " + fmt(ASKED.noSubjectWas.n) + " on " + ASKED.noSubjectWas.day + ", now " + fmt(E.noSubject) + ".",
              act: [["No subject code", "#exhibits/list/nosubj"], ["The subjects list", "#commons/subjects"]] }] },
        method: [p(["The exhibit name list has " + fmt(E.names) + " names, " + fmt(E.names - K.of) + " more than the " + fmt(K.of) + " credentials on the Credentials card. Cleanup lists: ", a("#exhibits/held", fmt(E.held) + " titles held for a person"), "; ", a("#exhibits/list/nosubj", fmt(E.noSubject) + " with no common subject code"), "; ", a("#exhibits/list/left", fmt(E.left) + " old titles"),
          " (a local wording the Commons still files under a shared name, but no college’s current MAP exhibit uses it any more, usually because the college renamed or retyped it — for example, “Automotive Services Excellence (A5: Brakes) Certificate” sits under “ASE A5 — Brakes,” which current MAP titles already cover; nothing breaks while it stays); and ", a("#exhibits/renamed", fmt(E.renamed) + " renamed titles"),
          ". Of the " + fmt(E.titles) + " local titles, " + fmt(E.stamped) + " carry a review stamp (" + fmt(E.person) + " a person’s, " + fmt(E.cohort) + " a review-group’s), counting " + fmt(E.backlog) + " titles MAP carries with no entry yet."]), p([LIVE_WORDS.exhibit])],
        links: [["Open Exhibits", "#exhibits/list"], [fmt(E.held) + " held", "#exhibits/held"], [fmt(E.left) + " old titles", "#exhibits/list/left"], ["No subject code", "#exhibits/list/nosubj"]] })
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
    var skillsLeft = B.industry != null && B.skillsCreds != null ? B.industry - B.skillsCreds : null;
    var connect = [
      checksCard({ key: "credentials", title: "Credentials", pill: "Design",
        big: fmt(K.credit) + " of " + fmt(K.of), rest: [" credentials: at least one college gives credit. The list will show how many colleges, never only a yes-or-no badge, so a student does not assume their own college gives credit."],
        quick: [{ ref: "skills", n: skillsLeft, one: "industry credential with no issuer-published skills yet", many: "industry credentials with no issuer-published skills yet" }],
        defs: [["Why", "one list, counted once per credential under one name and issuer, so a student sees how many colleges give credit, never only a yes or a no."],
          ["Finished when", "every credential is counted once, with the colleges that give credit and its credit-recommendation status."],
          ["Scale", fmt(K.of) + " credentials across " + fmt(K.lines) + " articulation lines; " + fmt(B.industry) + " industry credentials from " + fmt(B.issuers) + " issuers."]],
        stages: {
          Curate: [
            { ref: "colleges", name: "Colleges giving credit, counted once per credential", fig: figOf(K.credit, " of " + fmt(K.of)), meter: meterOf(K.credit, K.of, "credentials with a college giving credit"),
              line: fmt(K.one) + " at one college, " + fmt(K.two5) + " at 2–5, " + fmt(K.six10) + " at 6–10 and " + fmt(K.eleven) + " at 11 or more (max " + K.max + ").",
              act: [["The credential list", "#exhibits/list"]] },
            { ref: "status", name: "Each credential’s credit-recommendation status", fig: ["TBA"],
              line: "“Has a credit recommendation” and “No credit recommendation yet” are not counted yet; the split waits on a stable credential id and a link from each credential to its exhibits. Proposed: exhibits are the evaluations under each credential (one evaluation can carry one or more credit recommendations).",
              act: [["The credential list", "#exhibits/list"], ["Credit Recommendations", "#cr-reference"]] }],
          Connect: [
            { ref: "skills", name: "Issuer-published skills on each credential", fig: figOf(B.skillsCreds, " of " + fmt(B.industry)), meter: meterOf(B.skillsCreds, B.industry, "industry credentials with skills"),
              line: "Issuer-published skills on " + fmt(B.skillsCreds) + " of " + fmt(B.industry) + " industry credentials so far.",
              next: "the ASE slice’s public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER and military.",
              act: [["The ASE credentials", "#commons/ase"]] }] },
        method: [p([fmt(K.of) + " is the count of titles filed under one name. " + fmt(K.credit) + " of them have at least one college giving credit: " + fmt(K.one) + " at one college, " + fmt(K.two5) + " at 2–5, " + fmt(K.six10) + " at 6–10, and " + fmt(K.eleven) + " at 11 or more (max " + K.max + "), across " + fmt(K.lines) + " articulation lines. The other two statuses (“Has a credit recommendation” and “No credit recommendation yet”) are not yet counted once per credential; that split waits on a stable credential id and a link from each credential to its exhibits. ", a("#exhibits/list", "Open the list"), "."])],
        links: [["Open the credential list", "#exhibits/list"]] }),
      checksCard({ key: "cr", title: "Credit Recommendations", pill: "In progress",
        big: fmt(X.rows), rest: [" rows in the CR inventory ", el("span", { cls: "cmf-badge", text: "Preliminary" })],
        quick: [{ ref: "ace", n: X.ace, one: "row waiting on ACE’s recommendation text", many: "rows waiting on ACE’s recommendation text" },
          { ref: "rule", n: X.rule, one: "row a cleanup rule would settle", many: "rows a cleanup rule would settle" },
          { ref: "cannot", n: X.cannot, one: "row matching cannot clear", many: "rows matching cannot clear" }],
        defs: [["Why", "one wording for each credit recommendation, so the same credit reads the same everywhere."],
          ["Finished when", "every row in the CR inventory carries one settled wording."],
          ["Scale", fmt(X.rows) + " rows: " + fmt(X.pairs) + " exhibit-plus-wording pairs and " + fmt(X.noExhibit) + " worklist wordings with no exhibit."]],
        stages: {
          Curate: [
            { ref: "settled", name: "One settled wording for every row", fig: figOf(X.settled, " of " + fmt(X.rows)), extra: [crBar, crLegend],
              line: "Colleges’ wording kept: Sam said yes on November 19, and the 36 groups are recorded. In cases like POST Basic Academy the course-number link itself may be wrong, so the rule flags those links for a check.",
              next: "Sam works the top 50 groups first.",
              act: [["Wordings still open", "#cr-reference/open"]] },
            { ref: "rule", name: "The cleanup rule applied", fig: figOf(X.rule, " rows"),
              line: "A typographic cleanup rule would settle them; it ran as a dry run and is not applied yet.",
              act: [["Open Credit Recommendations", "#cr-reference"]] },
            { ref: "cannot", name: "Every row matching cannot clear, settled", fig: figOf(X.cannot, " rows"),
              line: fmt(X.cannotNoExhibit) + " worklist wordings with no exhibit, " + fmt(X.cannotTruncated) + " truncated or run-on, " + fmt(X.cannotNoId) + " with no exhibit id.",
              act: [["Wordings still open", "#cr-reference/open"]] },
            { ref: "tracked", name: "The wordings the Commons tracks", fig: figOf(R.settled, " of " + fmt(R.wordings)), meter: meterOf(R.settled, R.wordings, "wordings settled"),
              line: fmt(R.rule) + " settled by a rule and " + fmt(R.curator) + " more by a curator. " + (R.fresh
                ? "The curator count reads the decisions table, " + plural(R.fresh, "decision", "decisions") + " newer than the last receipt among them."
                : "The count has not moved since " + X.since + ": human credit-recommendation curation is paused, and rule-settled counts grow only when a new rule ships."),
              act: [["Open Credit Recommendations", "#cr-reference"]] }],
          Connect: [
            { ref: "ace", name: "ACE’s recommendation text saved", fig: figOf(X.ace, " rows wait"),
              line: "MAP already sends ACE’s recommendation text nightly; we do not save it yet.",
              next: "ask Sky to save the CreditRecommendation column.",
              act: [["Wordings still open", "#cr-reference/open"]] }] },
        method: [p([fmt(X.rows) + " is " + fmt(X.pairs) + " exhibit-plus-wording pairs plus " + fmt(X.noExhibit) + " worklist wordings with no exhibit. This is the inventory that rules actually move; it is not in the tracker on main yet. Two other counts measure different things: " + fmt(X.crm) + " is the count in MAP’s Custom Reporting Module, and the Commons page today tracks a narrower set — " + fmt(R.settled) + " of " + fmt(R.wordings) + " wordings settled (" + fmt(R.rule) + " by a rule, " + fmt(R.curator) + " more by a curator). Those " + fmt(R.settled) + " have not moved since " + X.since + " because human credit-recommendation curation is paused, and rule-settled counts only grow when a new rule ships. The credit-recommendation line should later point at this " + fmt(X.rows) + "-row inventory. On the " + fmt(R.groups) + " groups: Sam said yes on November 19 to keeping the colleges’ wording, and the 36 are recorded; each course-number link is flagged for a check. In the POST Basic Academy group, " + X.post.colleges + " colleges (" + X.post.rows + " rows) wrote “3 hours in Physical Training and Health Education (CSU GE Area E),” linked to C-ID AJ 110, whose official title is “Introduction to Criminal Justice.” In cases like POST Basic Academy the course-number link itself may be wrong, so the rule flags those links for a check. ", a("#cr-reference/open", "Wordings still open"), "."]), p([LIVE_WORDS.cr])],
        links: [["Open Credit Recommendations", "#cr-reference"], ["Name-check groups", "#cr-reference/names"]] }),
      checksCard({ key: "interconnect", title: "Interconnectivity", pill: "5 blocked", pillCls: "cmn-pill-needs",
        big: "5 blocked", rest: [", 4 APIs that would help, and 4 datasets to integrate"],
        quick: [{ ref: "blocked", n: X.ace, one: "row waits on ACE’s recommendation text", many: "rows wait on ACE’s recommendation text" },
          { ref: "blocked", n: 9, one: "Los Angeles district college waits on a district request", many: "Los Angeles district colleges wait on a district request" },
          { ref: "blocked", n: 1, one: "college’s curriculum system sits behind sign-ins", many: "colleges’ curriculum systems sit behind sign-ins" }],
        defs: [["Why", "each connection to another dataset or platform changes the Commons’ pace, its cost and the quality of what it holds."],
          ["Finished when", "nothing is blocked, and every dataset worth integrating is integrated."],
          ["Scale", "5 blocked, 4 APIs that would help and 4 datasets to integrate."]],
        stages: { Connect: [
          { ref: "blocked", name: "Every blocked connection cleared", fig: figOf(5, " blocked"),
            extra: [el("ul", { cls: "cmf-list" }, [
              el("li", { text: "ACE recommendation text (CreditRecommendation column) · fetched nightly, not stored · ask Sky · " + fmt(X.ace) + " rows" }),
              el("li", { text: "MAP CR ID · missing from the MAP report view we sync from · raised with Sam" }),
              el("li", { text: "Course outlines at the Los Angeles district’s 9 colleges · district request" }),
              el("li", { text: "eLumen guest sign-in (eLumen, a curriculum system some colleges use) · Sam’s call; we don’t use it" }),
              el("li", { text: "CourseLeaf CIM behind sign-ins (Pasadena) · blocked" })])],
            act: [["Outlines blocked", "#collect/outlines-blocked"], ["Open Credit Recommendations", "#cr-reference"]] },
          { ref: "apis", name: "APIs that would help", fig: figOf(4, " to reach"),
            extra: [el("ul", { cls: "cmf-list" }, [
              el("li", { text: "MAP API, to port credentials and exhibits · planned" }),
              el("li", { text: "Credential Engine ID (CTID) for credentials and credit recommendations · ask Malone" }),
              el("li", { text: "curriQunet/CurricUNET public report endpoints · work at CCSF" }),
              el("li", { text: "eLumen catalog API (eLumen, a curriculum system some colleges use) · would help" })])],
            act: [["The APIs", "#collect/apis"]] },
          { ref: "datasets", name: "Every dataset integrated", fig: figOf(1, " of 4"), meter: meterOf(1, 4, "datasets integrated"),
            extra: [el("ul", { cls: "cmf-list" }, [
              el("li", { text: "JST education section · MAP stores it; COBI doesn’t use it yet" }),
              el("li", { text: "COCI · integrated" }),
              el("li", { text: "Course outline links · " + fmt(Cl.outlineLinks) + " of " + fmt(Cl.registry) + " colleges on file" }),
              el("li", { text: "Peer-articulation exhibit IDs · " + fmt(X.cannotNoExhibit) + " worklist wordings have no exhibit" })])],
            act: [["Integrations", "#collect/integrations"], ["The data dictionary", "#collect/dictionary"]] }] },
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
    function wire(c) {
      c._fold.addEventListener("click", function () { setFold(c, !c.classList.contains("cmf-folded")); save(); });
      /* A Needs you link that jumps here opens the card first (item 1). */
      c._unfold = function () { if (c.classList.contains("cmf-folded")) { setFold(c, false); save(); later(); } };
    }
    all.forEach(function (c) {
      setFold(c, folded.indexOf(c.getAttribute("data-key")) >= 0);
      wire(c);
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
        /* A card with a stage open grows on its own; the row keeps the height of its cards at the top section. */
        var basis = open.filter(function (c) { return !c.classList.contains("cmf-unclamped") && !c.querySelector(".cmf-stage-b[aria-expanded='true']"); });
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
    wrap.addEventListener("click", function (e) { if (e.target && e.target.closest && e.target.closest(".cmf-fold, #cmf-all, .cmf-more, .cmf-stage-b, a[data-onpage]")) later(); });
    wrap.addEventListener("toggle", later, true);   // a method toggle does not bubble; the capture phase still sees it
    if (onResize) window.removeEventListener("resize", onResize);   // a redraw replaces the last page's listener
    onResize = later;
    window.addEventListener("resize", onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later, function () {});
    /* A card drawn again from the model (redrawCards) takes its old one's place: the fold, an open "...(more)" and the
       focus inside it carry over, the stages keep what is open (OPEN), and the rows measure again. A card whose words
       and figures did not change stays as it is. */
    function sig(c) {
      var parts = [];
      Array.prototype.forEach.call(c.querySelectorAll(".cmf-headline, .cmf-body, .cmf-more-body, .cmf-links"), function (n) { parts.push(n.textContent); });
      Array.prototype.forEach.call(c.querySelectorAll("[aria-label]"), function (n) { parts.push(n.getAttribute("aria-label")); });
      return parts.join("\n");
    }
    M._swap = function (nu) {
      var k = nu.getAttribute("data-key"), i = -1;
      all.forEach(function (c, j) { if (c.getAttribute("data-key") === k) i = j; });
      var old = i < 0 ? null : all[i];
      /* A page drawn again since (a new boot) has its own cards: a late read for the old one changes nothing. */
      if (!old || !old.parentNode || !document.documentElement.contains(old) || sig(old) === sig(nu)) return false;
      var ob = old.querySelector(":scope > .cmf-x > .cmf-more"), nb = nu.querySelector(":scope > .cmf-x > .cmf-more");
      if (ob && nb && ob.getAttribute("aria-expanded") === "true") nb.click();
      var f = document.activeElement, sel = null;
      if (f && f !== document.body && old.contains(f)) {
        var ac = f.getAttribute("aria-controls");
        sel = f === ob ? nb : f === old._fold ? nu._fold : f.id ? nu.querySelector("#" + f.id.replace(/([^\w-])/g, "\\$1"))
          : ac ? nu.querySelector('[aria-controls="' + ac.replace(/(["\\])/g, "\\$1") + '"]') : null;
      }
      old.parentNode.replaceChild(nu, old);
      all[i] = nu;
      rows.forEach(function (r) { var j = r.indexOf(old); if (j >= 0) r[j] = nu; });
      setFold(nu, old.classList.contains("cmf-folded"));
      wire(nu);
      if (sel && sel.focus) sel.focus();
      later();
      return true;
    };
    save();
    later();
    return wrap;
  }

  function boot(root, C, opts) {
    opts = opts || {};
    /* The local subject titles are their own read: a missing file reads TBA on the Subjects card, never a broken page. */
    var titles = readJson(FILES.subjects).then(null, function () { return null; });
    var heldCodes = readJson(FILES.held).then(null, function () { return null; });
    var readiness = readJson(FILES.readiness).then(null, function () { return null; });
    /* The curation series and the spend are their own reads too: either missing reads TBA where it is used. */
    var history = readJson(FILES.history).then(null, function () { return null; });
    var spend = readJson(FILES.spend).then(null, function () { return null; });
    return Promise.all([readJson(FILES.program), readJson(FILES.data), readJson(FILES.skills), titles, heldCodes, history, spend, readiness]).then(function (r) {
      var M = model(C, r[0], r[1], r[2], r[3], r[4], r[5], r[6]);
      M.readiness = subjReadiness(r[7], r[3]);
      M.platforms = {}; M.allColleges = ((r[1] && r[1].colleges) || []).length || null;
      ((r[1] && r[1].colleges) || []).forEach(function (c) { if (c && c.platform) M.platforms[c.platform] = (M.platforms[c.platform] || 0) + 1; });
      render(root, M, opts);
      /* The Subjects card's figures, with the live saves on top; a failed read keeps the status files' lines. */
      M.subjectsReady = subjectsLive(M).then(null, function (e) { M.subjectsLiveError = String(e && e.message || e); return null; });
      wireHandover(M, opts);
      if (opts.focus === "needs") focusNeeds();
      if (opts.course) openCourse(opts.course);
      NOW.M = M;
      var round = liveReads(M);
      return round.held.then(function () { return M; });
    });
  }
  /* The live reads behind Needs you's held line and the Exhibit titles and Credit Recommendations cards: on the first
     draw, and again on each return to the tab or the browser window (againLive), since a save on the Exhibits or Credit
     Recommendations tab leaves this page drawn; so the figures move the moment the person comes back. One round at a
     time. The held read redraws the held line, the ranked links and the Exhibit titles card; a failed read leaves what
     the last read or the status file gave, named as of its time. The decisions read redraws the Credit Recommendations
     card; a failed one keeps the committed count. */
  var NOW = { M: null };
  function liveReads(M) {
    if (M._round) return M._round;
    var held = heldLive().then(function (L) {
      var box = document.getElementById("cmf-held");
      if (box) drawHeld(box, M, L);
      M.heldLive = L;
      redrawNeeds(M);   /* the ranked links take the live count of titles still to name */
      redrawCards(M, ["exhibit"]);
    }, function (e) { M.heldLiveError = String(e && e.message || e); });
    var cr = crLive(M).then(function (F) {
      if (F) { M.crLive = F; redrawCards(M, ["cr"]); }
      return F;
    }, function (e) { M.crLiveError = String(e && e.message || e); return null; });
    M.ready = held; M.crReady = cr;
    var round = M._round = { held: held, cr: cr, done: Promise.all([held, cr]).then(function () { M._round = null; }) };
    return round;
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
  function againLive() {
    if (!document.getElementById("cmf-needs")) return;
    if (COURSE.M) drawStanding(COURSE.M);
    if (NOW.M) liveReads(NOW.M);
  }
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
    if (jump(l.getAttribute("data-onpage"), l.getAttribute("data-onpage-to"))) e.preventDefault();
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
    ".cmf-stage-b { font:inherit; letter-spacing:inherit; text-transform:inherit; color:var(--cmn-link); background:none; border:0; padding:0; min-height:24px; line-height:24px; text-decoration:underline; text-underline-offset:3px; cursor:pointer; }",
    ".cmf-stage-b[aria-expanded='false']::after { content:' (show)'; } .cmf-stage-b[aria-expanded='true']::after { content:' (hide)'; }",
    ".cmf-stage-b:focus-visible, .cmf-check:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".cmf-act a.cmf-hl { background:var(--cmn-pill-bg); outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:3px; }",
    ".cmf-check:focus { outline:none; } .cmf-quick { margin:6px 0 2px; } .cmf-quick a { display:inline-block; min-height:24px; line-height:24px; }",
    ".cmf-stage { margin:14px 0 6px; font-size:.75rem; letter-spacing:.06em; text-transform:uppercase; color:var(--cmn-muted); border-bottom:2px solid var(--cmn-gold); padding-bottom:4px; }",
    ".cmf-check-h { margin:6px 0 4px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:4px 12px; align-items:baseline; }",
    ".cmf-check-h > strong { color:var(--cmn-heading); }",
    ".cmf-check-fig { font-variant-numeric:tabular-nums; }",
    ".cmf-sub { margin:4px 0; color:var(--cmn-muted); font-size:.85rem; font-variant-numeric:tabular-nums; }",
    ".cmf-list { margin:4px 0; padding-left:18px; } .cmf-list li { margin:2px 0; } .cmf-list strong { color:var(--cmn-heading); }",
    ".cmf-act { margin:6px 0 0; display:flex; flex-wrap:wrap; gap:4px 16px; } .cmf-act-l { color:var(--cmn-muted); }",
    ".cmf-stack { height:10px; border-radius:999px; background:var(--cmn-track); overflow:hidden; display:flex; }",
    ".cmf-stack i { display:block; height:100%; background:var(--cmn-accent); } .cmf-stack-1 { opacity:.6; } .cmf-stack-2 { opacity:.3; }",
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
    ".cmf-checks .cmf-body { display:block; -webkit-line-clamp:unset; line-clamp:none; max-height:none; overflow:visible; }",
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
    exhibitsNow: exhibitsNow, crNow: crNow, crLive: crLive, crFigures: crFigures, redrawCards: redrawCards, CRL: CRL, LIVE_WORDS: LIVE_WORDS,
    FOLD_KEY: FOLD_KEY, ORDER_KEY: ORDER_KEY, DETAILS_ORDER_KEY: DETAILS_ORDER_KEY, DETAILS_FOLD_KEY: DETAILS_FOLD_KEY, FILES: FILES, ASKED: ASKED };
})();
