// commons_eta_clock.js — the Commons ETA clock (#3360): when Phase 1 of College Data Collection would be done at the
// current pace, and what turning on a connection would do to that date.
//
// Sam, Nov 15, 2026 (relayed by COBIx on #3360): "show the chancellor, craig, and jory and have them see first hand how
// far the commons moonshot has come and what flipping certain levers would do to speed progress, lessen costs, and
// improved data integrity, currency, governance, and scalability." He approved COBIx's canvas mock to build as is
// (issue comment of 17:02Z, its source in the next comment, SHA-256 62d517f7...). This file ports that mock: the
// compact band (heading, college selector, big date with Soonest or Latest, the P1, P2 and P3 chips, the 30-day bars,
// Show costs, Assumptions) and the full clock under it (the phase switcher, the dates, how far we have come, the
// datasets of the phase, the levers, the moonshot plan and what is real and what is not dated).
//
// LIVE (Sam, S661: "add the 'College Collections ETA' widget to the College Data Collections tab and add a card to
// the cdc tab to open the full ETA in sidebar"): the band tops the college list (hook "top"), a card among the figures
// (hook "tiles") opens the full clock in the side panel (pane "clock", #commons/data/clock), and the clock keeps its own
// page at #commons/data/eta. The three share one set of picks for the visit.
//
// What it reads, committed files the site already serves (it WRITES NOTHING):
//   kb/status/program-requirements.json   the headline series: Active programs complete each day. The remaining work,
//                                         the 7-day pace (Soonest), the 7 days before it (Latest) and the daily bars.
//   kb/status/commons_data.json           (commons_data.js passes it as M) the live read's statewide SLO, objective and
//                                         course counts, each college's counts, confidence, freshness.
//   kb/status/commons.json                the references' own counts, for the datasets table.
//   kb/status/cdc_integrations.json       the integrations by status.
//   kb/reference/industry_credential_skills.json   each credential's harvest day: the skills bars.
// Kept as the mock states them, each with its source (no committed series supplies them yet): the SLO and objectives
// estimate rates (one host's outlines a night), the stalled shares behind the two Unblock chips (the Nov 13 gap
// census), each connection's factor and start date (assumptions, shown in Assumptions), and the daily spend Sam pasted
// from billing (COBIx: a cost feed without billing credentials in the repo comes later).
//
// Every moved date is a projection, not a partner commitment, and says so. Picks last the view's visit; nothing is
// stored. Tokens only (the Commons --cmn roles and the CO palette below as --eta tokens). The controls that move the
// projected date are chips, as the mock draws them (Sam, S661); a control that opens or resets something is a word.
// Guard: tests/commons_eta_clock.test.js.
(function () {
  "use strict";

  var VIEW_KEY = "eta";
  var TITLE = "College Collections ETA";
  var LISTED = true;   // live (Sam, S661): the band tops College Data Collection, its card opens the full clock in the side panel
  var PANE_KEY = "clock";
  var FILES = { pr: "kb/status/program-requirements.json", refs: "kb/status/commons.json", integ: "kb/status/cdc_integrations.json",
    skills: "kb/reference/industry_credential_skills.json",
    billing: "kb/reference/model_spend_daily.json", sessions: "kb/status/session_spend.json" };
  var ST = { pr: null, refs: null, integ: null, skills: null, billing: null, sessions: null };
  var PLAN_URL = "https://github.com/CPL-Initiative/cpl-project-tracker/issues/3111#issuecomment-6808952144";
  /* The College Collections Plan, the plan drawn as one page in the CPL Library (Sam, S661). It opens in a new tab:
     it is a page of its own, wider than the side panel. */
  var PLAN_PAGE = "library/college-collections-plan/";
  var BRIEF_URL = "https://github.com/CPL-Initiative/cpl-project-tracker/issues/3360";

  /* ── constants the mock states, each with its source ── */
  var EST_DAILY = { soonest: 2530, latest: 550 };   // courses a night, from the RCCD, SDCCD and SAC outline receipts (Nov 13-15)
  var PACE_CAP = 8;
  var DAYS = 30;
  var CATALOG_GAP_CENSUS = 5751;                    // the harvest gap census, 10:04 AM PT Nov 13
  var CATALOG_BLOCK_PARTS = [
    { id: "site", label: "Site or firewall block (2 colleges, 250 programs)", share: 250 },
    { id: "robots", label: "robots.txt rule (2 colleges, 116 programs)", share: 116 },
    { id: "ua", label: "Los Rios catalog address (4 colleges, 238 programs)", share: 238 },
    { id: "held", label: "Held for a person (3 colleges, 101 programs)", share: 101 }];
  var OUTLINE_BLOCK_PARTS = [
    { id: "signin", label: "Curriculum system asks for a sign-in (6 colleges, 4,535 courses)", share: 4535 },
    { id: "refused", label: "Curriculum system refused the reader (3 colleges, 1,376 courses)", share: 1376 },
    { id: "unreached", label: "Curriculum system did not answer (1 college, 355 courses)", share: 355 }];
  var NEAR_COMPLETE = 0.9;

  var CHIP_TIPS = {
    full: "Opens the full clock, with more detail on each collection, plus the College Collections Plan.",
    p1: "Phase 1 is what COBI collects itself today from public college catalogs and course outlines: programs, course requirements, program learning outcomes, course SLOs and objectives, and credential skills. That work is how we build the Commons.",
    p2: "Phase 2 is connecting to partner data sources so Commons can use official, shared files instead of collecting everything college by college. None of these partner connections is fully in place yet.",
    p3: "Phase 3 is live connections to college and Chancellor's Office systems, so Commons can stay current and cut double work. None of these integrations is connected yet.",
    comis: "The goal is to connect directly to COMIS for aggregate program and course data from the Chancellor's Office, so we wouldn't have to ask each college for those lists one by one. Not connected yet; we have loaded one file by hand.",
    coci: "The goal is to connect to COCI for the complete course and program dataset, so our copy stays complete and current. Not connected yet; we already have a saved copy.",
    cvc: "The goal is to get the data needed to link to CVC courses directly from program pages. Not connected yet.",
    ppm: "The goal is to show Program Pathways Mapper maps on program pages. Not connected yet.",
    assist: "The goal is to bring articulations in alongside credit for prior learning, so students can see a path to transfer to CSU, UC, and private universities. Not connected yet.",
    cloud: "The goal is to integrate real-time student aggregate and schedule data through Common Cloud. Not connected yet.",
    lakes: "The goal is to use the Chancellor's Office data lakes to fill gaps and confirm the data agree. Not connected yet.",
    cms: "The goal is a college curriculum-system connection that makes outlines, SLOs, and objectives more accurate, complete, efficient, and current. Not connected yet.",
    cccstart: "The goal is to get major data and aggregate student population and demographic data from CCCStart (totals only, not individual students). It can also help colleges know which military students gave permission for a Joint Services Transcript request. Not connected yet.",
    sis: "The goal is a college student-system connection that eliminates double work by letting records update both ways. Not connected yet.",
    unblockcatalogs: "Some college catalogs still cannot be read automatically: a site or firewall block at 2 colleges, a robots.txt rule at 2, a user-agent block on the 4 Los Rios PDF catalogs, and 3 colleges whose program rules are waiting on a person. Together that is 11 colleges and 705 of the 5,751 Active programs that still lacked a passing record on November 13. Unblocking would mean a path the named reader can use, or a person to set the held colleges' rules, so that stalled share can be read at the same pace as the rest.",
    unblockoutlines: "Course outlines sit behind a sign-in, a refused page, or an unanswered curriculum-system host at 10 colleges, covering 6,266 of the 88,736 courses in active programs, and none of those courses has an SLO or objective in our file yet. Unblocking would mean a public outline view, or a college-granted login, so that stalled share can be read at the same pace as the rest. Fifty-nine other colleges have no public outline link in the registry; most have not been read yet, but that is not the same as a measured login or block.",
    tworeads: "Right now COBI reads each college's course outlines once a day. Reading twice a day would collect SLOs and objectives about twice as fast. It costs very little because it doesn't use AI time.",
    assumptions: "Opens a short table of the pace and start-date assumptions used when you turn a connection on. These are projections, not partner commitments.",
    college: "Choose a college to see its own counts and an estimated finish date. All colleges (statewide) is the default.",
    nearly: "Shows only the colleges that are almost done with their program lists, so you can find them quickly. These are colleges that are 90% or more complete, or have only a few programs left."
  };
  var COST_TIP = "Daily spend: API usage from the Claude Console plus Claude Code top-ups from Claude billing. Top-ups show the day credit was bought, which can lag use by a day.";
  var ASSUMPTIONS_INTRO = "We treat the remaining catalog work as three steps, based on the November 13 gap census: about 30% finding the list (1,699 programs had no closed course list that day, about 30% of the remaining gap), about 30% reading requirements, and about 40% confirming (units and coverage checks). When you turn a connection on, it is assumed to take over a share of those steps after its start date, which speeds the pace by the factor shown. Several connections multiply together, up to 8×. A connection only changes the date if it starts before the work would already be done. These are projections, not partner commitments.";

  var SERIES = [
    { id: "programs", title: "Catalog programs, course requirements, and PLOs", daily: true },
    { id: "slo", title: "Course SLOs", daily: false },
    { id: "objectives", title: "Course objectives", daily: false },
    { id: "skills", title: "Issuer-published credential skills", daily: true }];

  /* Each connection: its phase, its default start and factors (programs, SLOs, objectives), why, and the full clock's
     status, source and what it would replace. "tworeads" is the P1 cadence chip, apart from the connections. */
  function F(p, s, o) { return { programs: p, slo: s, objectives: o == null ? s : o, skills: 1 }; }
  var TWO_READS = { start: "now", factor: F(1, 2), why: "Reading each college's outlines twice a day, instead of once, would collect SLOs and objectives about twice as fast." };
  var LEVERS = [
    { id: "unblockcatalogs", name: "Unblock catalogs", short: "Unblock catalogs", phase: "1", start: "now", factor: F(1.14, 1), moves: true, status: "Assumption, start now", effects: ["speed"],
      why: "The 705 programs behind those access holds (12% of the November 13 remaining gap) are treated as stalled. Unblocking lets them move at the same pace as the rest, about 1.14 times faster overall.",
      source: "program_source_registry catalog access, live read November 15, 2026 (census checked November 8); harvest gap census written 10:04 AM PT November 13, 2026 (5,751 Active programs without a passing record); the Southwestern College scout of November 12, 2026 (firewall); the harvest lane's NEXT for Los Medanos, Monterey Peninsula, and Los Angeles Valley (rules first, with a person).",
      replaces: "Reading around site blocks, robots.txt rules, user-agent refusals, and colleges waiting on a person.",
      note: "This is an access assumption, not a partner feed. It moves the program-requirements date if the stalled share starts moving at the unblocked pace." },
    { id: "unblockoutlines", name: "Unblock course outlines", short: "Unblock course outlines", phase: "1", start: "now", factor: F(1, 1.09, 1.08), moves: true, status: "Assumption, start now", effects: ["speed"],
      why: "The 6,266 courses behind a sign-in or a refused or unanswered outline system are treated as stalled. Unblocking lets them move at the same pace as the rest, about 1.09 times faster for SLOs and 1.08 times faster for objectives.",
      source: "program_source_registry course-outline fields, live read November 15, 2026; the live course counts of November 13, 2026 (88,736 courses on Active programs). The outline system asks for a sign-in, refused, or did not answer at 10 colleges, 6,266 courses, none yet with an SLO or objective in the live file.",
      replaces: "Collecting SLOs and objectives only where a public outline or catalog page already opens.",
      note: "This moves the SLO and objectives dates. Phase 1 moves only if one of those collections is the last to finish." },
    { id: "comis", name: "COMIS Data Mart (public)", short: "COMIS", phase: "2", start: "2027-03-01", factor: F(1.1, 1), moves: true, status: "In progress", effects: ["speed", "cost", "integrity"],
      why: "An aggregate check against the Chancellor's Office file, not a replacement for the list itself.",
      source: "Integrations registry, November 15, 2026 (#3326). The public Program Course File was loaded by hand (PR #3239); the scheduled fetch has not yet succeeded.",
      replaces: "Asking each college for its program-course lists.",
      note: "A census written 10:04 AM PT on November 13, 2026 named 1,699 Active programs with no closed list in that file, about 30% of the gap that day. The census has not been rerun. That count is context for an assumption, not a measured time saved." },
    { id: "coci", name: "COCI full dataset (scheduled export)", short: "COCI", phase: "2", start: "2027-07-01", factor: F(1.4, 1), moves: true, status: "Not dated, the snapshot is live", effects: ["speed", "currency", "scalability"],
      why: "A complete, current course and program list, with some confirmation automated. Unit checks would still take a pass.",
      source: "Integrations registry: coci is live as a saved snapshot. The API checklist row for a scheduled course and program export is planned, with no start date.",
      replaces: "Reading each college's course and program lists from its catalog alone.",
      note: "The v2 agreed plan already moved the COCI reload to Next. A scheduled export is the proposed step, not a dated commitment." },
    { id: "cvc", name: "CVC", short: "CVC", phase: "2", start: "2027-07-01", factor: F(1, 1), moves: false, status: "Not dated, parked", effects: ["currency"],
      why: "This mainly adds a new capability: linking to CVC courses from program pages. It is not assumed to speed the current collections.",
      source: "API checklist: planned, parked (#3217) until access is in place.", replaces: "A feed of exchange offerings and equivalencies. None is in the repo.",
      note: "No remaining-work series is measured, so this lever does not move a collection date." },
    { id: "ppm", name: "Program Pathways Mapper", short: "PPM", phase: "2", start: "2027-07-01", factor: F(1.2, 1), moves: false, status: "Not dated", effects: ["speed", "scalability"],
      why: "Program maps would help us find and check program requirements a little faster.",
      source: "API checklist: planned. An access note was drafted October 17, 2026 and is not recorded as sent. Mapper hosts refuse automated reading.",
      replaces: "Hand-collecting term-by-term program maps. Four maps are committed; 60 colleges are on the public member list copied October 21, 2026.",
      note: "This lever would change map collection, which has no 7-day pace, so it does not move the Active program-requirements date." },
    { id: "assist", name: "ASSIST", short: "ASSIST", phase: "2", start: "2027-07-01", factor: F(1, 1), moves: false, status: "Not dated", effects: ["integrity"],
      why: "This mainly adds transfer articulations alongside credit for prior learning. It is not assumed to speed the current collections.",
      source: "API checklist: planned. An institutional API key is needed and is not recorded as requested. The v2 agreed plan already moved ASSIST to Next.",
      replaces: "A second signal for common courses and a CSU-transferable flag. No ASSIST harvest is in the repo today.",
      note: "No remaining-work series is measured, so this lever does not move a collection date." },
    { id: "cloud", name: "Common Cloud", short: "Cloud", phase: "3", start: "2028-07-01", factor: F(1, 1), moves: false, status: "Not dated, proposed", effects: ["currency", "governance", "scalability"],
      why: "This mainly adds real-time student totals and schedule data. It is not assumed to speed the current collections.",
      source: "API checklist: the four lakes (Unified Invoke, Ellucian Insights, Ellucian Aggregated Insights, InvokeClarity), all planned. Access has been asked for in #3310 and is not recorded as granted.",
      replaces: "Saved snapshots, once a lake feed is connected.", note: "No dated start, so this lever does not move a collection date." },
    { id: "lakes", name: "Chancellor's Office data lake", short: "Lakes", phase: "3", start: "2028-07-01", factor: F(1.1, 1), moves: false, status: "Not dated, proposed", effects: ["currency", "governance", "scalability"],
      why: "The data lakes would help fill gaps and confirm that our files agree.",
      source: "Registry (#3326): co_data_lake is proposed (Chancellor's Office data lake and dataset APIs). Access has been asked for in #3310 and is not recorded as granted.",
      replaces: "Saved snapshots: the July COCI copy and the one Fall 2025 COMIS course file.", note: "No dated start, so this lever does not move a collection date." },
    { id: "cms", name: "College CMS (curriculum system APIs)", short: "CMS", phase: "3", start: "2028-07-01", factor: F(1.5, 4), moves: false, status: "Not dated, proposed", effects: ["speed", "cost", "integrity", "currency"],
      why: "Reading outlines, SLOs, and objectives directly from the college curriculum system would be much faster than collecting them from public pages, and would help program requirements too.",
      source: "Registry: proposed. The repo records no college-level CMS connection; each college reads none known until MAP confirms which.",
      replaces: "Reading course outlines page by page, and the sign-in walls in front of outlines, SLOs, and objectives.",
      note: "This would change SLO and objectives collection, which have no 7-day pace, so it does not move the Active program-requirements date." },
    { id: "cccstart", name: "CCCStart", short: "CCCStart", phase: "3", start: "2028-07-01", factor: F(1, 1), moves: false, status: "Not connected yet", effects: ["speed"],
      why: "This mainly adds major and student-population totals (no individual students). It is not assumed to speed the current collections.",
      source: "Named for this clock on November 15, 2026. Not recorded as connected in the integrations registry (#3326).",
      replaces: "Colleges would not have a feed of which military students authorized a Joint Services Transcript request.",
      note: "Student-level data would flow to MAP, not COBI. This would mainly speed JST requests and CPL reach, not catalog collection, so it does not move the Active program-requirements date." },
    { id: "sis", name: "College SIS APIs", short: "College SIS", phase: "3", start: "2028-07-01", factor: F(1.1, 1), moves: false, status: "Not dated, not started", effects: ["governance", "scalability"],
      why: "A live student-system connection would help confirm records and cut double work.",
      source: "Registry: not started. District profiles (#3198) name each college's SIS first.",
      replaces: "Not recorded per college today. Banner, Colleague, and PeopleSoft districts would connect through the Common Cloud lakes or their own APIs.",
      note: "No per-college remaining work is recorded, so this lever does not move a collection date." }];
  var START_OPTIONS = ["now", "2026-12-01", "2027-01-01", "2027-03-01", "2027-07-01", "2028-01-01", "2028-07-01", "2029-01-01"];

  /* Daily spend, from two committed files and never from billing credentials (COBIx's cost feed): the billing totals
     Sam pastes by hand (kb/reference/model_spend_daily.json: Console API by UTC day, Claude Code top-ups on the day
     credit was bought, a note on a day, the partial days), and what the sessions themselves wrote on their handoffs'
     Spend: lines (kb/status/session_spend.json, which pages.yml builds at deploy with kb/_build_session_spend.py). The two meters do not match, so the
     sessions' figure is shown beside the billing total, never added to it. */
  function bill() { return ST.billing || {}; }
  function apiCost(d) { var a = bill().api || {}; return typeof a[d] === "number" ? a[d] : null; }
  function topups(d) { var t = bill().topups || {}; return Array.isArray(t[d]) ? t[d] : null; }
  function dayNote(d) { return (bill().notes || {})[d] || ""; }
  function partialDay(d) { return (bill().partial || []).indexOf(d) >= 0; }
  function sessionDay(d) { var b = (ST.sessions || {}).by_day || {}; return b[d] || null; }
  var COST_CAP = 1500;

  /* ── dates: whole UTC days, as yyyy-mm-dd ── */
  function dnum(s) { var p = String(s).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
  function dstr(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
  function longDate(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }); }
  function shortDate(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }); }
  function monthYear(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }); }
  function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  function usd(v) { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function factorWord(n) {
    var r = Math.round(n * 100) / 100, s = r.toFixed(2);
    if (/00$/.test(s)) s = String(Math.round(r)); else if (/0$/.test(s)) s = r.toFixed(1);
    return s + "×";
  }
  function joinNames(a) { return a.length < 2 ? (a[0] || "") : a.length === 2 ? a[0] + " and " + a[1] : a.slice(0, -1).join(", ") + ", and " + a[a.length - 1]; }
  function pctWord(p, a) {
    if (a <= 0) return "100%";
    var r = Math.round(1000 * p / a) / 10;
    return (Number.isInteger(r) ? r : r.toFixed(1)) + "%";
  }
  function leftWord(n) { return n === 1 ? "1 program left" : fmt(n) + " programs left"; }

  /* ── the model, from the committed files ── */
  function headlineSeries(pr) {
    var byDay = {};
    ((pr && pr.headline) || []).forEach(function (h) { if (h && h.day && typeof h.complete === "number") byDay[h.day] = h; });
    return byDay;
  }
  function skillsByDay(sk) {
    var out = {};
    ((sk && sk.credentials) || []).forEach(function (c) {
      if (!c || !c.harvested_on) return;
      var o = out[c.harvested_on] || (out[c.harvested_on] = { skills: 0, creds: 0 });
      o.skills += (c.skills || []).length; o.creds += 1;
    });
    return out;
  }
  function stalledFactor(total, stalled) { return stalled <= 0 || total <= stalled ? 1 : Math.round(total / (total - stalled) * 100) / 100; }

  /* Everything the clock draws that comes from a file; null where the headline series cannot date a pace. */
  function base(M, pr, sk) {
    var H = headlineSeries(pr), days = Object.keys(H).sort(), last = days[days.length - 1];
    if (!last) return null;
    var asOf = dnum(last), h = H[last], at = function (n) { var x = H[dstr(n)]; return x ? x.complete : null; };
    /* A missed build day must not blank a pace (COBIx on #3371): each window ends on the closest earlier day that has a
       count, and its pace divides by the days it really spans. */
    var back = function (n) { for (var k = n; k >= n - 7; k--) { if (at(k) != null) return k; } return null; };
    var d7 = back(asOf - 7), d14 = d7 == null ? null : back(d7 - 7);
    var c7 = d7 == null ? null : at(d7), c14 = d14 == null ? null : at(d14);
    var live = (M && M.live) || {}, st = live.statewide || {}, oc = st.outcomes || {}, pc = st.program_courses || {};
    var universe = pc.active_courses || 0;
    var bySkill = skillsByDay(sk), bars = [];
    for (var n = asOf - DAYS + 1; n <= asOf; n++) {
      var t = at(n), y = at(n - 1), s = bySkill[dstr(n)] || { skills: 0, creds: 0 };
      bars.push({ day: n, programs: t != null && y != null ? Math.max(0, t - y) : null, skills: s.skills, creds: s.creds });
    }
    return {
      asOf: asOf, written: (pr && pr.written_at) || "", active: h.active, complete: h.complete, remaining: Math.max(0, h.active - h.complete),
      pace: { soonest: c7 == null ? null : h.complete - c7, latest: c7 == null || c14 == null ? null : c7 - c14 },
      span: { soonest: d7 == null ? null : asOf - d7, latest: d14 == null ? null : d7 - d14 },
      slo: { have: oc.slo_courses_on_active || 0, universe: universe }, obj: { have: oc.objective_courses_on_active || 0, universe: universe },
      liveAt: live.read_at || "", bars: bars, colleges: collegeRows(M)
    };
  }
  function collegeRows(M) {
    var L = ((M && M.live) || {}).colleges || {};
    return ((M && M.colleges) || []).map(function (c) {
      var lv = L[String(c.id)];
      if (!lv) return null;
      var pg = lv.programs || {}, rc = lv.records || {}, oc = lv.outcomes || {}, pc = lv.program_courses || {};
      var a = pg.active || 0, p = Math.min(a, rc.active_passing || 0), q = c.slo_queue || {};
      return { slug: c.slug || String(c.id), name: c.name, district: c.district || "", a: a, p: p, r: a - p, pl: rc.active_with_plos || 0,
        c: pc.active_courses || 0, sl: oc.slo_courses_on_active || 0, o: oc.objective_courses_on_active || 0,
        sn: q.state === "none" || q.state === "held", on: c.objectives_printed === false };
    }).filter(Boolean).sort(function (x, y) { return x.name.localeCompare(y.name); });
  }
  /* A window's pace in words: its count and its days, or why it cannot date (a fall reads apart from a gap). */
  function paceWords(B, m) {
    var n = B.pace[m], d = B.span[m];
    if (n == null) return "a pace the headline series cannot date";
    if (n <= 0) return "no net progress (" + fmt(n) + " in " + d + " days)";
    return fmt(n) + " in " + d + " days";
  }
  function nearComplete(c) { if (c.a <= 0) return c.r <= 0; var f = c.p / c.a; return f >= NEAR_COMPLETE || (c.r <= 8 && f >= 0.85); }

  /* The pace model, ported from the mock: each connection on applies its factor from its start day; factors multiply,
     capped at 8 times the base pace; a connection starting after the work would be done changes nothing. */
  function finish(remaining, daily, effects, asOf) {
    var baseDay = daily > 0 ? asOf + Math.ceil(remaining / daily) : (remaining <= 0 ? asOf : null);
    if (remaining <= 0) return { day: asOf, moved: false };
    if (!(daily > 0)) return { day: null, moved: false };
    var fx = effects.filter(function (e) { return e.factor > 1; }).sort(function (a, b) { return a.start - b.start; });
    if (!fx.length) return { day: baseDay, moved: false };
    var rem = remaining, t = asOf, pace = daily, i = 0;
    while (i < fx.length && fx[i].start <= t) { pace = Math.min(daily * PACE_CAP, pace * fx[i].factor); i++; }
    while (i < fx.length && rem > 0) {
      var wait = fx[i].start - t;
      if (wait > 0) {
        if (pace * wait >= rem) { var d = t + Math.ceil(rem / pace); return { day: d, moved: d !== baseDay }; }
        rem -= pace * wait; t = fx[i].start;
      }
      while (i < fx.length && fx[i].start === t) { pace = Math.min(daily * PACE_CAP, pace * fx[i].factor); i++; }
    }
    var end = rem <= 0 ? t : t + Math.ceil(rem / pace);
    return { day: end, moved: end !== baseDay };
  }
  function startDay(s, asOf) { return s === "now" ? asOf : dnum(s); }
  function effects(S, series, asOf, withTwoReads) {
    var out = [];
    if (withTwoReads && S.twoReads) out.push({ start: asOf, factor: TWO_READS.factor[series], id: "tworeads" });
    LEVERS.forEach(function (l) { if (S.on[l.id]) out.push({ start: startDay(S.start[l.id], asOf), factor: S.factors[l.id][series], id: l.id }); });
    return out;
  }
  function lateHint(day, fx) {
    if (day == null) return null;
    var act = fx.filter(function (e) { return e.factor > 1; });
    var late = act.filter(function (e) { return e.start >= day; });
    if (!late.length) return null;
    return (act.length > late.length ? "Some of these connections start" : "These connections start") +
      " after this date, so they don't change it. You can change a start date in the chip or under Assumptions, or try Latest.";
  }
  /* The Phase 1 date: the latest of programs, course SLOs and course objectives (a college dates its programs only). */
  function phase1(B, S, college) {
    var mode = S.mode, asOf = B.asOf, fxP = effects(S, "programs", asOf, false);
    var dailyP = B.pace[mode] == null ? 0 : B.pace[mode] / B.span[mode];
    if (college) dailyP = B.active > 0 ? dailyP * college.a / B.active : 0;
    var remP = college ? college.r : B.remaining;
    var parts = [{ id: "programs", name: "programs and requirements", est: false, now: finish(remP, dailyP, fxP, asOf), was: finish(remP, dailyP, [], asOf), fx: fxP }];
    if (!college) {
      ["slo", "objectives"].forEach(function (k) {
        var have = k === "slo" ? B.slo : B.obj, fx = effects(S, k, asOf, true), rem = Math.max(0, have.universe - have.have);
        parts.push({ id: k, name: k === "slo" ? "course SLOs" : "course objectives", est: true,
          now: finish(rem, EST_DAILY[mode], fx, asOf), was: finish(rem, EST_DAILY[mode], [], asOf), fx: fx });
      });
    }
    function latest(key) {
      var dated = parts.filter(function (p) { return p[key].day != null; });
      if (!dated.length) return { day: null, setters: [], est: false };
      var max = Math.max.apply(null, dated.map(function (p) { return p[key].day; }));
      var setters = dated.filter(function (p) { return p[key].day === max; });
      return { day: max, setters: setters, est: setters.some(function (p) { return p.est; }) };
    }
    var now = latest("now"), was = latest("was");
    return { parts: parts, day: now.day, setters: now.setters, est: now.est, mode: mode, noProgress: B.pace[mode] != null && B.pace[mode] <= 0 && B.remaining > 0, moved: now.day != null && was.day != null && now.day !== was.day,
      late: lateHint(now.day, parts.reduce(function (a, p) { return a.concat(p.fx); }, [])) };
  }

  /* ── the words ── */
  function startWords(s, asOf) { return s === "now" ? "now" : monthYear(dnum(s)); }
  function assumes(f, s, asOf) {
    var when = s === "now" ? "starting now" : "starting about " + startWords(s, asOf), parts = [];
    if (f.programs > 1) parts.push("about " + factorWord(f.programs) + " faster on catalog programs");
    if (f.slo > 1 && f.slo === f.objectives) parts.push("about " + factorWord(f.slo) + " faster on SLOs and objectives");
    else {
      if (f.slo > 1) parts.push("about " + factorWord(f.slo) + " faster on course SLOs");
      if (f.objectives > 1) parts.push("about " + factorWord(f.objectives) + " faster on course objectives");
    }
    if (!parts.length) return "Assumes: no speedup on the current collections (1.0×). This adds a new capability, " + when + ".";
    return "Assumes: " + (parts.length === 1 ? parts[0] : parts.length === 2 ? parts[0] + ", and " + parts[1] : parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1]) + ", " + when + ".";
  }
  function leverTip(id, f, s, asOf) { return CHIP_TIPS[id] + " " + assumes(f, s, asOf) + " This is a projection, not a partner commitment."; }
  function paceTip(mode) {
    return mode === "soonest"
      ? "This is the earlier Phase 1 date, based on a recent week when we finished a lot of programs, and a faster estimate for SLOs and objectives. Click to see the later date, from a slower week. The big date is when the last of those collections would finish. This is a projection, not a promise."
      : "This is the later Phase 1 date, based on a recent slower week, and a slower estimate for SLOs and objectives. Click to see the earlier date, from a faster week. The big date is when the last of those collections would finish. This is a projection, not a promise.";
  }
  function dateTip(P, college) {
    var lines = college
      ? ["This is the estimated date when Phase 1 work would be done at " + college.name + ", using the latest of the collections we can date for this college."]
      : ["Phase 1 is done when the last of these collections finishes: programs and requirements, course SLOs, and course objectives.",
         "Credential skills are part of Phase 1 too, but we don't have a remaining count for them, so they don't set this date."];
    if (P.day == null) { lines.push("There isn't enough pace data to estimate a date yet."); return lines.join(" "); }
    var who = joinNames(P.setters.map(function (s) { return s.name; }));
    if (P.est) {
      lines.push("The date you see is set by " + who + ", estimated to finish on " + longDate(P.day) + ", which is later than the other collections we can date.");
      lines.push("That date is an estimate because it comes from course SLOs or course objectives, which we don't yet count day by day.");
    } else lines.push("The date you see is set by " + who + ", projected to finish on " + longDate(P.day) + ", which is later than the other collections we can date.");
    var det = P.parts.filter(function (p) { return p.now.day != null; }).map(function (p) { return p.name + ": " + longDate(p.now.day) + (p.est ? " (estimate)" : ""); }).join(". ");
    if (det) lines.push(det + ".");
    lines.push("This is a projection, not a promise.");
    return lines.join(" ");
  }
  var COLLEGE_AS_OF = "These counts are from the live read and may be a little behind the statewide total.";
  function collegeDateTip(c, mode) {
    var pace = mode === "soonest" ? "a recent faster week" : "a recent slower week";
    if (c.r <= 0) return "All active programs at " + c.name + " are done in the live read's counts. " + COLLEGE_AS_OF;
    if (nearComplete(c)) return "At " + c.name + ", " + fmt(c.p) + " of " + fmt(c.a) + " active programs are done (" + pctWord(c.p, c.a) + "). " + fmt(c.r) + " remain. We don't have a daily pace just for this college, so a calendar date would be an estimate from its share of statewide progress in " + pace + ". " + COLLEGE_AS_OF;
    return "At " + c.name + ", " + fmt(c.r) + " of " + fmt(c.a) + " active programs remain. We don't have a daily pace just for this college, so this date is an estimate from its share of statewide progress in " + pace + ". " + COLLEGE_AS_OF;
  }
  function seriesTip(id, B, S, P, college) {
    if (college) {
      var c = college;
      if (id === "programs") return "At " + c.name + ", " + fmt(c.p) + " of " + fmt(c.a) + " active programs are done (" + pctWord(c.p, c.a) + ", " + leftWord(c.r) + "). " + fmt(c.pl) + " of those programs have learning outcomes. We don't have a daily pace just for this college, so the finish date is an estimate from its share of statewide progress. " + COLLEGE_AS_OF;
      if (id === "skills") return "Credential skills are collected statewide from issuer pages, not college by college. There is no count for this college. The bars stay statewide.";
      var have = id === "slo" ? c.sl : c.o, label = id === "slo" ? "course SLOs" : "course objectives", counts = fmt(have) + " of " + fmt(c.c) + " courses in active programs";
      if (id === "slo" && c.sn) return "At " + c.name + ", the public pages are recorded as not printing SLOs, or the read is on hold. " + counts + " have an SLO in our file. " + COLLEGE_AS_OF;
      if (id === "objectives" && c.on) return "At " + c.name + ", the public course outlines are recorded as not printing objectives. " + counts + " have objectives in our file. " + COLLEGE_AS_OF;
      if (c.c > 0 && have >= c.c) return "At " + c.name + ", " + label + " are complete: " + counts + ". " + COLLEGE_AS_OF;
      if (!have) return "At " + c.name + ", " + label + " have not been read yet (0 of " + fmt(c.c) + " courses). We don't have an estimated date just for this college. " + COLLEGE_AS_OF;
      return "At " + c.name + ", " + counts + " have " + (id === "slo" ? "an SLO" : "objectives") + ". We don't have an estimated date just for this college. " + COLLEGE_AS_OF;
    }
    if (id === "programs") return "These are the programs in each college catalog, the courses required for each program, and the learning outcomes for those programs. " + fmt(B.complete) + " of " + fmt(B.active) + " active programs are done. The bars in this color show how many were finished each day.";
    if (id === "skills") return "These are the skills that certificate and exam issuers publish for their own credentials. The bars in this color show skills newly collected each day from those issuer pages.";
    var part = P.parts.filter(function (p) { return p.id === id; })[0], h = id === "slo" ? B.slo : B.obj;
    return (id === "slo" ? "Course SLOs are the student learning outcomes" : "Course objectives are the course objectives") + " printed on public course outlines. We have them for " +
      fmt(h.have) + " of " + fmt(h.universe) + " courses in active programs. We don't have a day-by-day count yet. " +
      (S.mode === "soonest" ? "This uses a faster pace, like a day when we read a large college's outlines." : "This uses a slower pace, like a day when we read a smaller college's outlines.") +
      (S.twoReads ? " The 2 reads/day option is on, so this assumes we read twice a day, and the date is sooner." : " Right now we read one college's outlines a day.") +
      " Estimated finish: " + (part && part.now.day != null ? longDate(part.now.day) : "pace not measured yet") + "." +
      (id === "slo" ? " Some colleges' public pages don't print SLOs" : " Some colleges' public outlines don't print objectives") + ", so we may never reach every course. This is an estimate, not a promise.";
  }

  /* ── drawing ── */
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "cls") e.className = attrs[k];
      else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  var tipN = 0;
  /* A word with its explanation: shown on hover and on keyboard focus, and read as the control's description. */
  function withTip(node, text, wide) {
    var id = "eta-tip-" + (++tipN);
    node.setAttribute("aria-describedby", id);
    if (!/^(BUTTON|A|INPUT|SELECT)$/.test(node.tagName)) node.setAttribute("tabindex", "0");
    return el("span", { cls: "eta-tipwrap" + (wide ? " eta-wide" : "") }, [node, el("span", { cls: "eta-tip", id: id, role: "tooltip", text: text })]);
  }
  /* A chip: a control that moves the projected date (Sam, in session, S661: "make the items Cobix designed as chips be
     chips instead of link buttons. The aren't intended to open views but to change projected eta"). Words that open or
     reset something stay the house's underlined words (chip). */
  /* The pill is drawn on an inner face, so it can look small while the button keeps a 24px target (WCAG 2.2). */
  function face(b) { var f = el("span", { cls: "eta-face" }); while (b.firstChild) f.appendChild(b.firstChild); b.appendChild(f); b.classList.add("eta-pill"); return b; }
  function pill(label, pressed, onClick, extra) { return face(chip(label, pressed, onClick, extra)); }
  function chip(label, pressed, onClick, extra) {
    var b = el("button", { type: "button", cls: "eta-chip", "aria-pressed": pressed == null ? null : (pressed ? "true" : "false"), text: label });
    if (extra) for (var k in extra) if (extra[k] != null) b.setAttribute(k, extra[k]);
    b.addEventListener("click", onClick);
    return b;
  }

  function freshState() {
    var on = {}, factors = {}, start = {};
    LEVERS.forEach(function (l) { on[l.id] = false; factors[l.id] = { programs: l.factor.programs, slo: l.factor.slo, objectives: l.factor.objectives, skills: 1 }; start[l.id] = l.start; });
    return { mode: "soonest", twoReads: false, costs: false, assumptions: false, open: null, college: null, picker: false, query: "", near: false, phase: "1",
      on: on, factors: factors, start: start, catalogParts: { site: true, robots: true, ua: true, held: true }, outlineParts: { signin: true, refused: true, unreached: true }, bar: null };
  }

  function headlineLabel(P, college) {
    if (college && college.r <= 0) return "Complete";
    if (college && nearComplete(college) && !P.moved) return pctWord(college.p, college.a) + ", " + leftWord(college.r);
    if (P.day == null) return P.noProgress ? (P.mode === "latest" ? "no net progress in the week before" : "no net progress this week") : "pace not measured yet";
    var s = longDate(P.day) + (P.est ? " est." : "");
    return college ? "estimated " + s : s;
  }

  function band(B, S, redraw) {
    var college = S.college ? B.colleges.filter(function (c) { return c.slug === S.college; })[0] || null : null;
    var P = phase1(B, S, college);
    var box = el("section", { cls: "eta-band", "aria-labelledby": "eta-band-h" });
    box.appendChild(el("h3", { cls: "eta-head", id: "eta-band-h", text: "College Collections ETA" }));
    box.appendChild(el("p", { cls: "eta-sub-h", text: "To complete Phase 1 of the College Data Collection" }));
    box.appendChild(picker(B, S, college, redraw));
    var date = el("span", { cls: "eta-date", "data-eta-date": "", text: headlineLabel(P, college) });
    var mode = pill(S.mode === "soonest" ? "Soonest" : "Latest", null, function () { S.mode = S.mode === "soonest" ? "latest" : "soonest"; redraw("eta-mode"); },
      { "data-eta": "eta-mode", "aria-label": S.mode === "soonest" ? "Soonest date. Click to see the latest date." : "Latest date. Click to see the soonest date." });
    mode.classList.add("eta-on");
    box.appendChild(el("div", { cls: "eta-daterow" }, [withTip(date, college && (college.r <= 0 || (nearComplete(college) && !P.moved)) ? collegeDateTip(college, S.mode) : dateTip(P, college), true), withTip(mode, paceTip(S.mode))]));
    if (P.moved) box.appendChild(el("p", { cls: "eta-note", "data-eta-projected": "", text: "Projected. This is a projection, not a partner commitment." }));
    if (P.late) box.appendChild(el("p", { cls: "eta-note", text: P.late }));

    var row = el("div", { cls: "eta-chips" });
    function group(phase, label) {
      var g = el("div", { cls: "eta-group", role: "group", "aria-label": "Phase " + phase + " connections" }, [withTip(el("span", { cls: "eta-plabel", text: label }), CHIP_TIPS["p" + phase])]);
      if (phase === "1") g.appendChild(withTip(pill("2 reads/day", S.twoReads, function () { S.twoReads = !S.twoReads; redraw("tworeads"); }, { "data-eta": "tworeads" }), leverTip("tworeads", TWO_READS.factor, "now", B.asOf)));
      LEVERS.filter(function (l) { return l.phase === phase; }).forEach(function (l) {
        var b = pill(l.short, S.on[l.id], function () {
          S.assumptions = false;
          /* On turns off in one click, as in the Levers row (COBIx on #3371); a click that turns it on opens its popover. */
          if (S.on[l.id]) { S.on[l.id] = false; if (S.open === l.id) S.open = null; }
          else { S.on[l.id] = true; S.open = l.id; }
          redraw(l.id);
        }, { "data-eta": l.id, "aria-expanded": S.open === l.id ? "true" : "false" });
        g.appendChild(withTip(b, leverTip(l.id, S.factors[l.id], S.start[l.id], B.asOf)));
      });
      if (phase === "1") g.appendChild(withTip(pill("Show costs", S.costs, function () { S.costs = !S.costs; redraw("costs"); }, { "data-eta": "costs" }), COST_TIP));
      return g;
    }
    row.appendChild(group("1", "P1")); row.appendChild(group("2", "P2")); row.appendChild(group("3", "P3"));
    var fullBtn = chip("Detailed View and Plan", null, function () {
      /* On the list, the full clock opens in the side panel; on the clock's own page, it is just below. */
      if (BAND_HOST && BAND_HOST.openPane && !document.getElementById("eta-full")) { BAND_HOST.openPane({ k: PANE_KEY }, fullBtn); return; }
      var t = document.getElementById("eta-full"); if (t) { if (t.scrollIntoView) t.scrollIntoView({ block: "start" }); t.focus(); }
    }, { "data-eta": "full" });
    row.appendChild(withTip(fullBtn, CHIP_TIPS.full));
    row.appendChild(withTip(chip("Assumptions", null, function () { S.open = null; S.assumptions = !S.assumptions; redraw("assumptions"); },
      { "data-eta": "assumptions", "aria-expanded": S.assumptions ? "true" : "false" }), CHIP_TIPS.assumptions));
    box.appendChild(row);
    if (S.open) box.appendChild(popover(B, S, redraw));
    if (S.assumptions) box.appendChild(assumptionsTable(B, S));
    box.appendChild(chart(B, S, P, college, redraw));
    return box;
  }

  function picker(B, S, college, redraw) {
    var wrap = el("div", { cls: "eta-picker" });
    var btn = el("button", { type: "button", cls: "eta-chip eta-pick", "aria-haspopup": "listbox", "aria-expanded": S.picker ? "true" : "false", "data-eta": "college" },
      [el("span", { text: college ? college.name : "All colleges (statewide)" }), college && nearComplete(college) ? el("span", { cls: "eta-badge", text: pctWord(college.p, college.a) + ", " + leftWord(college.r) }) : null]);
    face(btn);
    btn.addEventListener("click", function () { S.picker = !S.picker; redraw("college"); });
    wrap.appendChild(withTip(btn, CHIP_TIPS.college));
    if (!S.picker) return wrap;
    var nearN = B.colleges.filter(nearComplete).length;
    var q = el("input", { type: "search", cls: "eta-search", placeholder: "Search colleges", "aria-label": "Search colleges", "data-eta": "search", value: S.query });
    var list = el("div", { cls: "eta-list", role: "listbox", "aria-label": "Colleges" });
    function fill() {
      list.textContent = "";
      var needle = S.query.trim().toLowerCase();
      var rows = B.colleges.filter(function (c) {
        if (S.near && !nearComplete(c)) return false;
        return !needle || c.name.toLowerCase().indexOf(needle) >= 0 || c.district.toLowerCase().indexOf(needle) >= 0 || c.slug.replace(/_/g, " ").indexOf(needle) >= 0;
      }).sort(function (a, b) {
        var an = nearComplete(a) ? 1 : 0, bn = nearComplete(b) ? 1 : 0;
        if (an !== bn) return bn - an;
        if (an) { var dp = b.p / Math.max(b.a, 1) - a.p / Math.max(a.a, 1); if (dp) return dp; return a.r - b.r; }
        return a.name.localeCompare(b.name);
      });
      function opt(slug, name, right) {
        var o = el("button", { type: "button", role: "option", cls: "eta-opt", "aria-selected": (S.college || null) === slug ? "true" : "false", "data-college": slug || "all" }, [el("span", { text: name }), right]);
        o.addEventListener("click", function () { S.college = slug; S.picker = false; S.query = ""; redraw("college"); });
        list.appendChild(o);
      }
      if (!S.near) opt(null, "All colleges (statewide)", null);
      if (!rows.length) list.appendChild(el("p", { cls: "eta-note", text: "No colleges match." }));
      rows.forEach(function (c) { opt(c.slug, c.name, nearComplete(c) ? el("span", { cls: "eta-badge", text: pctWord(c.p, c.a) + ", " + leftWord(c.r) }) : el("span", { cls: "eta-muted", text: pctWord(c.p, c.a) })); });
    }
    q.addEventListener("input", function () { S.query = q.value; fill(); });
    var nb = pill("Nearly complete (" + nearN + ")", S.near, function () { S.near = !S.near; nb.setAttribute("aria-pressed", S.near ? "true" : "false"); fill(); }, { "data-eta": "near" });
    fill();
    wrap.appendChild(el("div", { cls: "eta-pop eta-pickpop" }, [q, withTip(nb, CHIP_TIPS.nearly), list,
      el("p", { cls: "eta-note", text: "College program counts are from the live read of " + liveDay(B) + " and may lag the statewide headline." })]));
    return wrap;
  }
  function liveDay(B) { return B.liveAt ? longDate(dnum(B.liveAt.slice(0, 10))) : "a date the file does not give"; }

  function popover(B, S, redraw) {
    var l = LEVERS.filter(function (x) { return x.id === S.open; })[0], f = S.factors[l.id];
    var pop = el("div", { cls: "eta-pop", role: "group", "aria-label": l.short + " assumptions", "data-eta-pop": l.id },
      [el("p", { cls: "eta-poph", text: l.short }), el("p", { cls: "eta-note", text: assumes(f, S.start[l.id], B.asOf) })]);
    function parts(list, state, apply) {
      list.forEach(function (p) {
        var cb = el("input", { type: "checkbox", "data-part": p.id, checked: state[p.id] ? true : null });
        cb.addEventListener("change", function () { state[p.id] = cb.checked; apply(list.filter(function (x) { return state[x.id]; }).reduce(function (s, x) { return s + x.share; }, 0)); redraw(l.id); });
        pop.appendChild(el("label", { cls: "eta-check" }, [cb, el("span", { text: p.label })]));
      });
    }
    if (l.id === "unblockcatalogs") parts(CATALOG_BLOCK_PARTS, S.catalogParts, function (share) { f.programs = stalledFactor(CATALOG_GAP_CENSUS, share); });
    if (l.id === "unblockoutlines") parts(OUTLINE_BLOCK_PARTS, S.outlineParts, function (share) {
      f.slo = stalledFactor(Math.max(0, B.slo.universe - B.slo.have), share); f.objectives = stalledFactor(Math.max(0, B.obj.universe - B.obj.have), share);
    });
    var fine = l.id === "unblockcatalogs" || l.id === "unblockoutlines";
    /* An Unblock chip's factor cannot pass what unblocking every stalled part would give (COBIx on #3371). */
    var all = function (list) { return list.reduce(function (a, x) { return a + x.share; }, 0); };
    var cap = { programs: l.id === "unblockcatalogs" ? stalledFactor(CATALOG_GAP_CENSUS, all(CATALOG_BLOCK_PARTS)) : l.id === "unblockoutlines" ? 1 : PACE_CAP,
      slo: l.id === "unblockoutlines" ? stalledFactor(Math.max(0, B.slo.universe - B.slo.have), all(OUTLINE_BLOCK_PARTS)) : l.id === "unblockcatalogs" ? 1 : PACE_CAP,
      objectives: l.id === "unblockoutlines" ? stalledFactor(Math.max(0, B.obj.universe - B.obj.have), all(OUTLINE_BLOCK_PARTS)) : l.id === "unblockcatalogs" ? 1 : PACE_CAP };
    function slider(label, key, keys) {
      if (cap[key] <= 1) return;
      var r = el("input", { type: "range", min: "1", max: String(cap[key]), step: fine ? "0.01" : "0.1", value: String(f[key]), "data-factor": key, "aria-label": label });
      var lab = el("label", { cls: "eta-slider" }, [el("span", { text: label + " " + factorWord(f[key]) }), r]);
      r.addEventListener("change", function () { keys.forEach(function (k) { f[k] = Math.min(Number(r.value), cap[k]); }); redraw(l.id); });
      pop.appendChild(lab);
    }
    slider("Catalog programs", "programs", ["programs"]);
    if (f.slo !== 1 || f.objectives !== 1 || l.id === "cms") slider("SLOs and objectives", "slo", ["slo", "objectives"]);
    var sel = el("select", { "data-start": l.id, "aria-label": "Start" });
    START_OPTIONS.forEach(function (o) { sel.appendChild(el("option", { value: o, selected: S.start[l.id] === o ? true : null, text: o === "now" ? shortDate(B.asOf) + " (now)" : shortDate(dnum(o)) + ", " + o.slice(0, 4) })); });
    sel.addEventListener("change", function () { S.start[l.id] = sel.value; redraw(l.id); });
    pop.appendChild(el("label", { cls: "eta-slider" }, [el("span", { text: "Start" }), sel]));
    pop.appendChild(el("p", { cls: "eta-note", text: "Projection, not partner commitment." }));
    return pop;
  }

  function assumptionsTable(B, S) {
    var tb = el("tbody");
    function row(name, start, f, why) {
      tb.appendChild(el("tr", null, [el("th", { scope: "row", text: name }), el("td", { text: start }), el("td", { text: factorWord(f.programs) }),
        el("td", { text: f.slo === f.objectives ? factorWord(f.slo) : factorWord(f.slo) + " / " + factorWord(f.objectives) }), el("td", { text: why })]));
    }
    row("2 reads/day", "Now", TWO_READS.factor, TWO_READS.why);
    LEVERS.forEach(function (l) { var w = startWords(S.start[l.id], B.asOf); row(l.short, w === "now" ? "Now" : w, S.factors[l.id], l.why); });
    return el("div", { cls: "eta-pop eta-assume", "data-eta-assumptions": "" }, [el("p", { cls: "eta-note", text: ASSUMPTIONS_INTRO }),
      el("div", { cls: "eta-scroll", role: "region", "aria-label": "Assumptions", tabindex: "0" }, [el("table", { cls: "eta-table" }, [
        el("colgroup", null, [el("col", { style: "width:16%" }), el("col", { style: "width:14%" }), el("col", { style: "width:12%" }), el("col", { style: "width:14%" }), el("col", { style: "width:44%" })]),
        el("thead", null, [el("tr", null, ["Connection", "Start", "Catalog programs", "SLOs and objectives", "What we assume"].map(function (h) { return el("th", { scope: "col", text: h }); }))]), tb])])]);
  }

  function spend(d) { return (apiCost(d) || 0) + (topups(d) || []).reduce(function (a, b) { return a + b; }, 0); }
  function hasSpend(d) { return apiCost(d) != null || !!topups(d); }
  function spendLabel(d) { if (!hasSpend(d)) return ""; return "$" + Math.round(spend(d)).toLocaleString("en-US") + (dayNote(d) ? "*" : ""); }
  function spendLines(d) {
    var sd = sessionDay(d), sess = sd && (sd.sessions || sd.not_available) ?
      "Sessions' own figures (handoffs' Spend: lines): " + (sd.sessions ? usd(sd.usd) + " from " + fmt(sd.sessions) + (sd.sessions === 1 ? " session" : " sessions") : "none given") +
      (sd.not_available ? ", " + fmt(sd.not_available) + " not available" : "") + "." : null;
    if (!hasSpend(d)) return [ST.billing ? "No spend recorded for this day." : "The billing file (" + FILES.billing + ") could not be read."].concat(sess ? [sess] : []);
    var t = topups(d) || [], code = t.reduce(function (a, b) { return a + b; }, 0), out = ["Total this day: " + usd((apiCost(d) || 0) + code) + "."];
    out.push("API (Console): " + (apiCost(d) != null ? usd(apiCost(d)) : "no figure") + ".");
    out.push(t.length ? "Claude Code top-ups (" + t.length + " × ~$200): " + usd(code) + "." : "Claude Code top-ups: none this day.");
    if (partialDay(d)) out.push("Partial day.");
    if (dayNote(d)) out.push(dayNote(d));
    if (sess) out.push(sess);
    return out;
  }
  function barLines(b, S) {
    var out = [longDate(b.day)];
    out.push(b.programs == null ? "Catalog programs: we don't have a count of how many were newly finished this day." : b.programs === 0 ? "Catalog programs: none newly finished this day." : "Catalog programs: " + fmt(b.programs) + " newly finished.");
    out.push(b.skills ? "Credential skills: " + fmt(b.skills) + " skills on " + fmt(b.creds) + " credentials." : "Credential skills: none collected this day.");
    var t = (b.programs || 0) + b.skills;
    out.push(t ? "Total this day: " + fmt(t) + "." : "Total this day: none added.");
    return S.costs ? out.concat(spendLines(dstr(b.day))) : out;
  }

  /* The 30-day bars: programs and credential skills stacked, statewide; with Show costs, each day's spend on a label
     band above the plot and a line on a $1,500 scale. A table of the same counts sits under it for screen readers. */
  function chart(B, S, P, college, redraw) {
    var W = 640, plotH = 44, tickH = 14, n = B.bars.length, padX = 10, slot = (W - padX * 2) / n, barW = Math.max(2, slot * 0.88);
    var costH = S.costs ? Math.max.apply(null, B.bars.map(function (b) { return spendLabel(dstr(b.day)).length * 8 * 0.62 + 4; })) + 6 : 0;
    var H = costH + plotH + tickH;
    var max = Math.max(1, Math.max.apply(null, B.bars.map(function (b) { return Math.max(b.programs || 0, b.skills); })));
    var wrap = el("div", { cls: "eta-chart" + (college ? " eta-dim" : "") });
    if (college) wrap.appendChild(el("p", { cls: "eta-note eta-center", text: "Statewide only — no day-by-day counts by college yet" }));
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": "Daily counts from " + longDate(B.bars[0].day) + " to " + longDate(B.bars[n - 1].day) + ": newly finished catalog programs and newly collected credential skills. Course SLOs and course objectives have no daily counts yet." });
    s.appendChild(svg("line", { x1: padX, x2: W - padX, y1: costH + plotH, y2: costH + plotH, class: "eta-axis" }));
    var ys = function (v) { return costH + plotH - 2 - Math.min(v, COST_CAP) / COST_CAP * (plotH - 4); };
    B.bars.forEach(function (b, i) {
      var cx = padX + slot * i + slot / 2, x = cx - barW / 2, g = svg("g", { class: "eta-day" + (S.bar === i ? " eta-dayon" : ""), "data-day": dstr(b.day) });
      g.appendChild(svg("rect", { x: padX + slot * i, y: costH, width: slot, height: plotH, fill: "transparent" }));
      var y = costH + plotH, stack = [["programs", b.programs || 0], ["skills", b.skills]];
      if (!stack[0][1] && !stack[1][1]) g.appendChild(svg("line", { x1: cx, x2: cx, y1: y - 4, y2: y, class: "eta-gap" }));
      stack.forEach(function (p) {
        if (p[1] <= 0) return;
        var h = Math.max(2, p[1] / max * (plotH - 2)); y -= h;
        g.appendChild(svg("rect", { x: x, y: y, width: barW, height: h, class: "eta-fill-" + p[0] }));
      });
      var lab = spendLabel(dstr(b.day));
      if (S.costs && lab) {
        var tx = svg("text", { x: cx, y: costH - 3, "text-anchor": "start", "dominant-baseline": "middle", transform: "rotate(-90 " + cx + " " + (costH - 3) + ")", class: "eta-costlabel" });
        tx.textContent = lab;
        if (dayNote(dstr(b.day))) { var ti = svg("title", {}); ti.textContent = dayNote(dstr(b.day)); tx.appendChild(ti); }
        g.appendChild(tx);
      }
      if ((n - 1 - i) % 7 === 0 || (i === 0 && (n - 1) % 7 >= 3)) { /* weekly back from the as-of day; the first day only with room */ var tk = svg("text", { x: cx, y: H - 2, "text-anchor": "middle", class: "eta-tick" }); tk.textContent = shortDate(b.day); g.appendChild(tk); }
      g.addEventListener("mouseenter", function () { show(i); });
      g.addEventListener("click", function () { S.bar = S.bar === i ? null : i; show(S.bar); });
      s.appendChild(g);
    });
    if (S.costs) {
      var gc = svg("g", { "aria-hidden": "true" });
      gc.appendChild(svg("polyline", { class: "eta-costline", fill: "none", points: B.bars.map(function (b, i) { return (padX + slot * i + slot / 2) + "," + ys(spend(dstr(b.day))); }).join(" ") }));
      B.bars.forEach(function (b, i) {
        var d = dstr(b.day), x = padX + slot * i + slot / 2, tot = spend(d);
        if (tot - (apiCost(d) || 0) > 0) gc.appendChild(svg("line", { x1: x, x2: x, y1: ys(apiCost(d) || 0), y2: ys(tot), class: "eta-costtick" }));
        if (hasSpend(d)) gc.appendChild(svg("circle", { cx: x, cy: ys(tot), r: dayNote(d) || tot > COST_CAP ? 2.4 : 1.8, class: "eta-costdot" }));
      });
      s.appendChild(gc);
    }
    s.addEventListener("mouseleave", function () { show(S.bar); });
    wrap.appendChild(s);
    var legend = el("div", { cls: "eta-legend" });
    var tips = {}; SERIES.forEach(function (x) { tips[x.id] = seriesTip(x.id, B, S, P, college); });
    SERIES.forEach(function (x) {
      var t = x.title;
      if (college) {
        if (x.id === "programs") t += " (" + fmt(college.p) + " of " + fmt(college.a) + ")";
        else if (x.id === "skills") t += " (statewide only)";
        else { var h = x.id === "slo" ? college.sl : college.o; t += college.c > 0 && h >= college.c ? " (complete)" : " (" + fmt(h) + " of " + fmt(college.c) + ")"; }
      }
      legend.appendChild(withTip(el("span", { cls: "eta-key", "data-series": x.id }, [el("span", { cls: "eta-swatch eta-sw-" + x.id + (x.daily ? "" : " eta-hatch"), "aria-hidden": "true" }), t]), tips[x.id], !x.daily));
    });
    if (S.costs) legend.appendChild(el("span", { cls: "eta-key", "data-series": "spend" }, [el("span", { cls: "eta-swatch eta-sw-spend", "aria-hidden": "true" }), "Daily spend (line; $1,500 scale cap; Oct 26–27*)"]));
    wrap.appendChild(legend);
    var hover = el("div", { cls: "eta-hover", "aria-live": "polite" });
    wrap.appendChild(hover);
    function show(i) {
      hover.textContent = "";
      if (i == null) return;
      barLines(B.bars[i], S).forEach(function (l) { hover.appendChild(el("div", { text: l })); });
      Array.prototype.forEach.call(s.querySelectorAll(".eta-day"), function (g, k) { g.setAttribute("class", "eta-day" + (k === i ? " eta-dayon" : "")); });
    }
    show(S.bar);
    var tb = el("tbody");
    B.bars.forEach(function (b) {
      tb.appendChild(el("tr", null, [el("th", { scope: "row", text: longDate(b.day) }), el("td", { text: b.programs == null ? "no count" : fmt(b.programs) }), el("td", { text: fmt(b.skills) }),
        S.costs ? el("td", { text: spendLabel(dstr(b.day)) || "none recorded" }) : null]));
    });
    var heads = ["Day", "Catalog programs newly finished", "Credential skills collected"].concat(S.costs ? ["Daily spend"] : []);
    wrap.appendChild(el("details", { cls: "eta-daytable" }, [el("summary", { text: "The daily counts as a table" }),
      el("div", { cls: "eta-scroll", role: "region", "aria-label": "Daily counts", tabindex: "0" }, [el("table", { cls: "eta-table" }, [
        el("thead", null, [el("tr", null, heads.map(function (h) { return el("th", { scope: "col", text: h }); }))]), tb])])]));
    return wrap;
  }

  /* ── the full clock ── */
  function full(B, S, M, redraw) {
    var college = null, P = phase1(B, S, college);
    var sec = el("section", { cls: "eta-full", id: "eta-full", tabindex: "-1", "aria-labelledby": "eta-full-h" });
    sec.appendChild(el("h3", { id: "eta-full-h", text: "The full clock" }));
    sec.appendChild(el("p", { cls: "eta-p", text: "The leadership view of the clock: progress, the ETA, the phase, and the levers. Phase 1 is the default, and is everything the queue and the daily build already collect." }));
    var sw = el("div", { cls: "eta-phases", role: "group", "aria-label": "Phase" });
    [["1", "Phase 1, current collection"], ["2", "Phase 2, partner APIs"], ["3", "Phase 3, deeper connections"]].forEach(function (p) {
      sw.appendChild(chip(p[1], S.phase === p[0], function () { S.phase = p[0]; redraw("phase-" + p[0]); }, { "data-eta": "phase-" + p[0] }));
    });
    sec.appendChild(sw);
    var pr = function (m) { return paceWords(B, m); };
    sec.appendChild(el("p", { cls: "eta-callout" }, [el("strong", { text: "Projections, not partner commitments. " }), S.phase === "1"
      ? "The Phase 1 date is the latest of programs and requirements, course SLOs, and course objectives. Programs are dated from the committed headline series (" + fmt(B.complete) + " of " + fmt(B.active) + " complete): Soonest uses the latest week's pace (" + pr("soonest") + "), Latest the week before it (" + pr("latest") + "). Course SLOs and objectives have no day-by-day count, so their dates are estimates. Colleges and partners should not read a lever as a promise."
      : "Phase 2 and Phase 3 are dated only when a partner or college feed has a start date in the registry. None of those feeds is dated today, so this phase's completion is not dated."]));
    var grid = el("div", { cls: "eta-grid" });
    function cell(h, v, d, key) { grid.appendChild(el("div", { cls: "eta-cell", "data-cell": key }, [el("h4", { text: h }), el("p", { cls: "eta-v", text: v }), d ? el("p", { cls: "eta-note", text: d }) : null])); }
    if (S.phase === "1") {
      var other = freshState(); other.mode = S.mode === "soonest" ? "latest" : "soonest"; other.on = S.on; other.factors = S.factors; other.start = S.start; other.twoReads = S.twoReads;
      var Q = phase1(B, other, null), soon = S.mode === "soonest" ? P : Q, late = S.mode === "soonest" ? Q : P;
      var lbl = function (X) { return X.day == null ? "pace not measured yet" : longDate(X.day) + (X.est ? " est." : ""); };
      cell(soon.moved ? "Soonest date (projected)" : "Soonest date", lbl(soon), "The latest of the three collections at the current 7-day pace for programs and the faster outline estimate.", "soonest");
      cell(late.moved ? "Latest date (projected)" : "Latest date", lbl(late), "The same remaining work at the prior week's program pace and the slower outline estimate.", "latest");
      cell("As of", longDate(B.asOf) + " headline", "The headline in kb/status/program-requirements.json, written " + (B.written ? B.written.replace("T", " ").slice(0, 16) + " UTC" : "on a date the file does not give") + ".", "asof");
    } else { cell("Soonest date", "Not dated"); cell("Latest date", "Not dated"); cell("As of", "Integrations registry" + (ST.integ && ST.integ.updated ? ", " + longDate(dnum(ST.integ.updated)) : "")); }
    sec.appendChild(grid);
    if (S.phase === "1") sec.appendChild(el("p", { cls: "eta-p eta-eq", text: "Finish day = as-of day + remaining units ÷ (7-day complete ÷ 7), rounded up to a whole day." }));
    if (S.phase === "1") sec.appendChild(progress(B, M));
    sec.appendChild(datasets(B, S, P));
    sec.appendChild(levers(B, S, redraw));
    sec.appendChild(el("section", { cls: "eta-sub", "aria-labelledby": "eta-plan-h" }, [el("h4", { id: "eta-plan-h", text: "The College Collections Plan" }),
      el("p", { cls: "eta-p", text: "The plan behind this clock, on one page: what the Commons answers, its four parts, the top line, the three phases, the first slice and the scorecard." }),
      el("ul", { cls: "eta-links" }, [el("li", null, [el("a", { href: PLAN_PAGE, target: "_blank", rel: "noopener", "data-eta-plan": "", text: "Open the College Collections Plan in a new tab" })]),
        el("li", null, [el("a", { href: PLAN_URL, target: "_blank", rel: "noopener", text: "Its source, the v2 agreed final on #3111 (November 11, 2026)" })]),
        el("li", null, [el("a", { href: BRIEF_URL, target: "_blank", rel: "noopener", text: "The ETA clock brief (#3360, November 15, 2026)" })])])]));
    sec.appendChild(el("section", { cls: "eta-sub", "aria-labelledby": "eta-real-h" }, [el("h4", { id: "eta-real-h", text: "What is real, and what is not dated" }),
      el("p", { cls: "eta-p", text: "Real, from committed files: the Active programs complete and their daily series, the live read's SLO, objective and course counts, each college's counts, the references' counts, the integrations by status, and the credential skills by harvest day. The Soonest and Latest program dates are computed from that headline series." }),
      el("p", { cls: "eta-p", text: "Estimates and assumptions, labeled where they appear: the SLO and objectives rates (about " + fmt(EST_DAILY.soonest) + " or " + fmt(EST_DAILY.latest) + " courses a night, from reading one host's outlines a night), the stalled shares behind the two Unblock chips (the November 13 gap census), and every connection's factor and start date. Any date that moves when a connection is on is a projection, not a partner commitment." }),
      el("p", { cls: "eta-p", text: "Data gaps: course SLOs and objectives have no day-by-day counts, and some public pages print neither, so those dates may never reach every course. No committed file has day-by-day counts by college, so the bars stay statewide when a college is selected, and a college's date uses its share of statewide progress. Credential skills have no remaining count, so they do not set the date. The daily spend is the billing figures supplied for October 17 to November 15, 2026; no feed supplies spend yet." })]));
    return sec;
  }

  function progress(B, M) {
    var st = (M && M.statewide) || {}, cols = (M && M.colleges) || [], conf = st.confidence || {}, rule = ((M && M.rule) || {}).age_days || { fresh: 7, recent: 30 };
    var now = M && M.written ? Date.parse(M.written) : NaN, fr = { fresh: 0, recent: 0, stale: 0 };
    cols.forEach(function (c) {
      if (!c.harvested || !c.read_at || isNaN(now)) return;
      var age = (now - Date.parse(c.read_at)) / 86400000;
      fr[age <= rule.fresh ? "fresh" : age <= rule.recent ? "recent" : "stale"] += 1;
    });
    var ov = (((M && M.overall) || {}).statewide || {}).mean, integ = {};
    ((ST.integ && ST.integ.integrations) || []).forEach(function (x) { integ[x.status] = (integ[x.status] || 0) + 1; });
    var tiles = [
      [fmt(st.harvested) + " of " + fmt(st.colleges), "Colleges collected", "A committed program-requirements capture with records is on file for each college and continuing-education campus in the identity crosswalk."],
      [fmt(st.passing) + " of " + fmt(st.programs), "Program requirements passing", "Programs the committed captures listed (Active, Teachout, and Approved) that pass coverage, nothing invented, and units equal or unstated. The ETA uses the Active-only headline (" + fmt(B.complete) + " of " + fmt(B.active) + ")."],
      [typeof ov === "number" ? (Math.round(ov * 1000) / 10) + "%" : "TBA", "Overall completeness", "Average of catalog source, program requirements passing, and (SLOs + PLOs) / 2, unread parts counting as zero, from the live read of " + liveDay(B) + "."],
      [fmt(B.slo.have) + " of " + fmt(B.slo.universe), "Course SLOs", "Distinct courses on Active programs with an SLO, from the live read of " + liveDay(B) + "."],
      [fmt(conf.strong || 0) + " strong, " + fmt(conf.partial || 0) + " partial, " + fmt(conf.limited || 0) + " limited", "Confidence", ((M && M.rule) || {}).confidence_card || ""],
      [fmt(fr.fresh) + " fresh, " + fmt(fr.recent) + " recent, " + fmt(fr.stale) + " stale", "Collection freshness", "Fresh within " + rule.fresh + " days of the file's written time, recent within " + rule.recent + ", stale after, from each capture's last read."],
      [["live", "in progress", "proposed", "not started"].map(function (k) { return fmt(integ[k] || 0) + " " + k; }).join(", "), "Integrations", "From the integrations registry."]];
    var g = el("div", { cls: "eta-tiles" });
    tiles.forEach(function (t) { g.appendChild(el("div", { cls: "eta-cell" }, [el("p", { cls: "eta-v", text: t[0] }), el("h5", { text: t[1] }), el("p", { cls: "eta-note", text: t[2] })])); });
    var cost = st.cost_usd && st.passed_at_read ? "Cost, where a receipt supports it: " + usd(st.cost_usd / st.passed_at_read) + " per program that passed at read time (" + usd(st.cost_usd) + " over " + fmt(st.passed_at_read) + " programs, " + fmt(st.cost_receipts) + " receipts)." : "";
    return el("section", { cls: "eta-sub", "aria-labelledby": "eta-prog-h" }, [el("h4", { id: "eta-prog-h", text: "How far we have come" }), g,
      el("p", { cls: "eta-note", text: "Person-confirmed program records are not a Phase 1 target and are not shown here. " + cost })]);
  }

  function datasets(B, S, P) {
    var rows;
    if (S.phase === "1") {
      var part = function (id) { return P.parts.filter(function (p) { return p.id === id; })[0]; };
      var est = function (id) { var p = part(id); return p && p.now.day != null ? "Est. " + longDate(p.now.day) + ". Not a measured pace." : "Pace not measured yet"; };
      var pp = ST.pr && ST.pr.harvest && ST.pr.harvest.parts || {}, plo = (pp.outcomes || {}).plo, cat = (pp.links || {}).catalog;
      rows = [["Program requirements, Active", fmt(B.complete) + " of " + fmt(B.active), "Soonest: " + paceWords(B, "soonest") + " through " + longDate(B.asOf) + "; Latest: " + paceWords(B, "latest") + " before that", part("programs").now.day != null ? longDate(part("programs").now.day) + (part("programs").now.moved ? " (projected)" : "") : "Pace not measured yet"],
        ["Course SLOs on Active programs", fmt(B.slo.have) + " of " + fmt(B.slo.universe), "No day-by-day count. Est. about " + fmt(EST_DAILY[S.mode]) + " courses a night at the " + (S.mode === "soonest" ? "sooner" : "later") + " rate.", est("slo")],
        ["Course objectives on Active programs", fmt(B.obj.have) + " of " + fmt(B.obj.universe), "No day-by-day count; read in the same pass as SLOs.", est("objectives")],
        ["Program PLOs", plo ? fmt(plo[0]) + " of " + fmt(plo[1]) : "TBA", "Pace not measured yet", "Pace not measured yet"],
        ["Catalog source", cat ? fmt(cat[0]) + " of " + fmt(cat[1]) : "TBA", cat && cat[0] >= cat[1] ? "Already complete" : "Pace not measured yet", cat && cat[0] >= cat[1] ? "Complete" : "Pace not measured yet"]];
      ((ST.refs && ST.refs.rows) || []).forEach(function (r) {
        if (!r || r.key === "requirements" || !r.pair || !r.pair[0] || r.pair[0].n == null) return;
        var q = r.pair[0], done = q.of != null && q.n >= q.of;
        rows.push([r.title, fmt(q.n) + (q.of != null ? " of " + fmt(q.of) : "") + " " + (q.words || ""), done ? "Already complete" : "Pace not measured yet", done ? "Complete" : "Pace not measured yet"]);
      });
      rows.push(["Issuer-published credential skills", "Collected statewide from issuer pages", "Daily counts in the bars above", "Does not set the date: no remaining count"]);
    } else {
      rows = LEVERS.filter(function (l) { return l.phase === S.phase; }).map(function (l) { return [l.name, l.status, l.replaces, "Not dated"]; });
    }
    var heads = S.phase === "1" ? ["Dataset", "Complete", "Pace", "ETA"] : [S.phase === "2" ? "Partner feed" : "Connection", "Status", "What a connection would replace", "Dated?"];
    var tb = el("tbody");
    rows.forEach(function (r) { tb.appendChild(el("tr", null, [el("th", { scope: "row", text: r[0] })].concat(r.slice(1).map(function (v) { return el("td", { text: v }); })))); });
    return el("section", { cls: "eta-sub", "aria-labelledby": "eta-ds-h" }, [el("h4", { id: "eta-ds-h", text: "Datasets in this phase" }),
      el("div", { cls: "eta-scroll", role: "region", "aria-label": "Datasets in this phase", tabindex: "0" }, [el("table", { cls: "eta-table", "data-eta-datasets": S.phase }, [
        el("colgroup", null, [el("col", { style: "width:26%" }), el("col", { style: "width:22%" }), el("col", { style: "width:30%" }), el("col", { style: "width:22%" })]),
        el("thead", null, [el("tr", null, heads.map(function (h) { return el("th", { scope: "col", text: h }); }))]), tb])]),
      S.phase === "2" ? el("p", { cls: "eta-note", text: "Phase 2 is the partner feed connected and current. The Data Mart is already in progress, the COCI snapshot is live, and four PPM maps are held. The v2 agreed plan moved ASSIST and the COCI reload to Next; this clock follows the November 15 phase framing and places them here, without overwriting that plan." }) : null]);
  }

  function levers(B, S, redraw) {
    var box = el("section", { cls: "eta-sub", "aria-labelledby": "eta-lv-h" }, [el("h4", { id: "eta-lv-h", text: "Levers" }),
      el("p", { cls: "eta-note", text: "The same connections as the chips above, sharing their on and off state. Dates that move are projections, not partner commitments." })]);
    var row = el("div", { cls: "eta-chips eta-left" });
    LEVERS.forEach(function (l) { row.appendChild(pill(l.name, S.on[l.id], function () { S.on[l.id] = !S.on[l.id]; if (S.open === l.id) S.open = null; redraw("lever-" + l.id); }, { "data-eta": "lever-" + l.id })); });
    row.appendChild(chip("Clear levers", null, function () { var f = freshState(); S.on = f.on; S.factors = f.factors; S.start = f.start; S.twoReads = false; S.open = null; S.catalogParts = f.catalogParts; S.outlineParts = f.outlineParts; redraw("clear"); }, { "data-eta": "clear" }));
    box.appendChild(row);
    var active = LEVERS.filter(function (l) { return S.on[l.id]; });
    if (!active.length) box.appendChild(el("p", { cls: "eta-note", text: "No lever is on. The dates above are the baseline from the committed headline series." }));
    active.forEach(function (l) {
      box.appendChild(el("div", { cls: "eta-lever", "data-lever": l.id }, [el("h5", { text: l.name + ": " + l.status }),
        el("p", { cls: "eta-note", text: "Affects " + l.effects.join(", ") + ". " + (l.moves ? "If this lands by " + (S.start[l.id] === "now" ? longDate(B.asOf) : longDate(dnum(S.start[l.id]))) + "; a projection, not a partner commitment." : "Does not move this ETA.") }),
        el("p", { cls: "eta-p", text: l.replaces + " Source: " + l.source + " " + l.note })]));
    });
    return box;
  }

  /* The lite strip for the top of the CPL Commons tab (mounted at go-live): the phase, the two dates and the pace, and
     the word that opens the full clock. */
  function strip(B) {
    if (!B) return null;
    var S = freshState(), P = phase1(B, S, null), L = freshState(); L.mode = "latest";
    var Q = phase1(B, L, null), lbl = function (X) { return X.day == null ? "pace not measured yet" : longDate(X.day) + (X.est ? " est." : ""); };
    return el("section", { cls: "eta-strip", "aria-label": "ETA to complete Phase 1" }, [
      el("div", { cls: "eta-cell" }, [el("h4", { text: "Phase" }), el("p", { text: "Phase 1, current collection" })]),
      el("div", { cls: "eta-cell" }, [el("h4", { text: "Soonest date" }), el("p", { text: lbl(P) })]),
      el("div", { cls: "eta-cell" }, [el("h4", { text: "Latest date" }), el("p", { text: lbl(Q) })]),
      el("div", { cls: "eta-cell" }, [el("h4", { text: "Pace" }), el("p", { text: paceWords(B, "soonest") + " newly complete" }),
        el("a", { href: "#commons/data/" + VIEW_KEY, text: "Open the ETA clock" })])]);
  }

  /* One set of picks for the visit, shared by every place the clock is drawn (the band on the list, the full clock in
     the side panel, the clock's own page): a chip turned on in one shows in the others. Nothing is stored. */
  var SHARED = null, MOUNTS = [], BAND_HOST = null;
  function shared() { return SHARED || (SHARED = freshState()); }
  function redrawAll(fk, origin) {
    MOUNTS = MOUNTS.filter(function (m) { return m.root === origin || m.root.isConnected; });
    MOUNTS.forEach(function (m) { m.paint(); });
    refreshTile();
    if (fk && origin) { var f = origin.querySelector('[data-eta="' + fk + '"]'); if (f && f.focus) f.focus(); }
  }
  function mount(root, paint) {
    var m = { root: root };
    m.paint = function () { root.textContent = ""; paint(root, function (fk) { redrawAll(fk, root); }); };
    MOUNTS.push(m); m.paint();
    return root;
  }
  function tbaRoot(root, M) {
    if (!ST.pr) { root.appendChild(el("p", { cls: "cdd-tbaline" }, [el("strong", { text: "TBA. " }), "The headline series (" + FILES.pr + ") could not be read, so the clock has no pace to date. Reload the tab to try again."])); return null; }
    var B = base(M, ST.pr, ST.skills);
    if (!B) root.appendChild(el("p", { cls: "cdd-tbaline" }, [el("strong", { text: "TBA. " }), "The headline series holds no day with a complete count."]));
    return B;
  }
  function view(key, M, host) {
    if (key !== VIEW_KEY) return null;
    ensureCss(); BAND_HOST = null;
    var root = el("div", { cls: "eta", "data-eta-view": "" }), B = tbaRoot(root, M);
    if (!B) return root;
    return mount(root, function (r, redraw) {
      r.appendChild(el("p", { cls: "eta-preview", text: "Every date that moves when a connection is on is a projection, not a partner commitment." }));
      r.appendChild(band(B, shared(), redraw));
      r.appendChild(full(B, shared(), M, redraw));
    });
  }
  /* The band at the top of College Data Collection's list. */
  function top(M, host) {
    ensureCss(); BAND_HOST = host || null;
    var root = el("div", { cls: "eta eta-top", "data-eta-top": "" }), B = tbaRoot(root, M);
    if (!B) return root;
    return mount(root, function (r, redraw) { r.appendChild(band(B, shared(), redraw)); });
  }
  /* The card among the list's figures: the Phase 1 date, opening the full clock in the side panel. */
  function tiles(M) {
    if (!ST.pr) return [];
    var B = base(M, ST.pr, ST.skills); if (!B) return [];
    TILE_B = B;
    var T = tileWords(B);
    return [{ v: T.v, l: "College Collections ETA", d: T.d, pane: { k: PANE_KEY } }];
  }
  /* The card's figure follows the picks (COBIx on #3373): every redraw rewrites it from the shared state. */
  var TILE_B = null;
  function tileWords(B) {
    var S = shared(), P = phase1(B, S, null);
    return { v: P.day == null ? "TBA" : longDate(P.day) + (P.est ? " est." : ""),
      d: "Phase 1 at the " + (S.mode === "soonest" ? "soonest" : "latest") + " pace" + (P.moved ? ", projected with the chips that are on" : "") + "; opens the full clock and the plan in the side panel. A projection, not a promise." };
  }
  function refreshTile() {
    if (!TILE_B || typeof document === "undefined") return;
    var T = tileWords(TILE_B);
    Array.prototype.forEach.call(document.querySelectorAll('[data-pane-tile="' + PANE_KEY + '"]'), function (t) {
      var v = t.querySelector(".cdd-v"), d = t.querySelector(".cdd-d");
      if (v) v.textContent = T.v;
      if (d) d.textContent = T.d;
    });
  }
  /* The full clock in the side panel. */
  function clockPane(M) {
    ensureCss();
    var root = el("div", { cls: "eta eta-inpanel", "data-eta-pane": "" }), B = tbaRoot(root, M);
    if (B) mount(root, function (r, redraw) { r.appendChild(full(B, shared(), M, redraw)); });
    return { title: TITLE, tab: "#commons/data/" + VIEW_KEY, basis: "The full clock: the phases, the dates, how far we have come, the datasets, the levers and the plan. Every moved date is a projection, not a partner commitment.", kids: [root] };
  }

  function ready(fetchFn) {
    var f = fetchFn || window.fetch;
    if (typeof f !== "function") return Promise.resolve(null);
    function get(k) { return Promise.resolve(f(FILES[k], { cache: "no-store" })).then(function (r) { return r && r.ok ? r.json() : null; }).then(function (j) { ST[k] = j; }).catch(function () { ST[k] = null; }); }
    return Promise.all(Object.keys(FILES).map(get));
  }

  var CSS_ID = "eta-css";
  /* The CO palette (Brand Basics v1.0, April 2018, docs/kb-notes/reference-cccco-style-guide.md) as the clock's tokens;
     gold and light blue are fills, never text. In dark, the navy bar takes light blue so it holds 3:1 on the surface. */
  var TOKENS_LIGHT = "--eta-programs:#002F6D; --eta-slo:#40B4E5; --eta-objectives:#D18A00; --eta-skills:#FFB600; --eta-spend:#D18A00; --eta-spendtick:#FFB600; --eta-badge-bg:#FFB600; --eta-badge-fg:#002F6D; --eta-wash:rgba(0,47,109,.08);";
  var TOKENS_DARK = "--eta-programs:#40B4E5; --eta-slo:#40B4E5; --eta-objectives:#F6DC6B; --eta-skills:#FFB600; --eta-spend:#FFB600; --eta-spendtick:#F6DC6B; --eta-badge-bg:#FFB600; --eta-badge-fg:#002F6D; --eta-wash:rgba(64,180,229,.16);";
  var CSS = [
    ".eta { " + TOKENS_LIGHT + " display:grid; gap:16px; margin-top:12px; }",
    ":root[data-theme=\"dark\"] .eta { " + TOKENS_DARK + " }",
    "@media (prefers-color-scheme: dark) { :root:not([data-theme=\"light\"]) .eta { " + TOKENS_DARK + " } }",
    ".eta-preview { margin:0; font-size:.86rem; color:var(--cmn-ink-2); }",
    ".eta-band { display:grid; gap:8px; justify-items:center; text-align:center; padding:12px 16px; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; }",
    ".eta-head { margin:0; font-size:1rem; color:var(--cmn-heading); }",
    ".eta-sub-h { margin:-6px 0 0; font-size:.78rem; color:var(--cmn-muted); }",
    ".eta-top { margin:4px 0 12px; }",
    ".eta-inpanel .eta-full { padding:0; border:0; }",
    ".eta-daterow { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:center; }",
    ".eta-date { font-family:var(--cmn-serif); font-size:clamp(1.5rem, 4vw, 2.2rem); color:var(--cmn-title); cursor:help; }",
    ".eta-chips { display:flex; flex-wrap:wrap; gap:4px 12px; align-items:center; justify-content:center; width:100%; }",
    ".eta-chips.eta-left { justify-content:flex-start; }",
    ".eta-band .eta-chips > .eta-tipwrap > .eta-chip:not(.eta-pill) { font-size:.74rem; color:var(--cmn-ink-2); }",
    ".eta-group { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }",
    ".eta-plabel { font-size:.7rem; color:var(--cmn-muted); cursor:help; }",
    /* Controls are underlined words (Sam, 2026-10-09): no border, no fill at rest, 24px tall; on reads bold over a wash. */
    ".eta-chip { font:inherit; font-size:.86rem; min-height:24px; padding:0 4px; border:0; background:none; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; cursor:pointer; border-radius:4px; }",
    ".eta-chip[aria-pressed=\"true\"], .eta-chip.eta-on { font-weight:700; background:var(--eta-wash); color:var(--cmn-heading); }",
    /* The chips that move the date: a bordered pill, as COBIx's mock draws them; on, the border takes the accent over a
       wash and the word turns bold, so the state never rests on color alone. */
    /* Small and quiet (Sam, S661: "Keep them quite small font so they don't grab the focus which should be the eta and
       bar graph"): the mock's 11px type, a hairline border, the second ink; the date and the bars lead. */
    ".eta-chip.eta-pill { text-decoration:none; padding:0; min-height:24px; border:0; background:none; display:inline-flex; align-items:center; }",
    ".eta-face { display:inline-flex; align-items:center; gap:4px; padding:0 6px; line-height:16px; border:1px solid var(--cmn-line); border-radius:999px; color:var(--cmn-ink-2); font-size:.7rem; font-weight:400; }",
    ".eta-pill:hover .eta-face { border-color:var(--cmn-accent); }",
    ".eta-pill[aria-pressed=\"true\"], .eta-pill.eta-on { background:none; }",
    ".eta-pill[aria-pressed=\"true\"] .eta-face, .eta-pill.eta-on .eta-face { border-color:var(--cmn-accent); background:var(--eta-wash); color:var(--cmn-heading); font-weight:600; }",
    ".eta-chip:focus-visible, .eta [tabindex]:focus-visible, .eta select:focus-visible, .eta input:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".eta-tipwrap { position:relative; display:inline-flex; }",
    ".eta-tip { display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:4px; z-index:6; width:min(280px, 80vw); padding:8px; background:var(--cmn-dialog); color:var(--cmn-ink-2); border:1px solid var(--cmn-line); border-radius:8px; font-size:.78rem; line-height:1.35; text-align:left; font-weight:400; }",
    ".eta-wide .eta-tip { width:min(340px, 86vw); }",
    ".eta-tipwrap:hover > .eta-tip, .eta-tipwrap:focus-within > .eta-tip { display:block; }",
    ".eta-note { margin:0; font-size:.82rem; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".eta-center { text-align:center; }",
    ".eta-muted { color:var(--cmn-muted); }",
    ".eta-badge { margin-left:6px; padding:0 6px; border-radius:999px; background:var(--eta-badge-bg); color:var(--eta-badge-fg); font-size:.74rem; text-decoration:none; font-weight:600; }",
    ".eta-picker { position:relative; }",
    ".eta-pop { display:grid; gap:6px; width:min(340px, 100%); box-sizing:border-box; padding:10px; background:var(--cmn-dialog); border:1px solid var(--cmn-line); border-radius:8px; text-align:left; }",
    ".eta-pickpop { position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:4px; z-index:8; width:min(300px, 90vw); }",
    ".eta-assume { width:100%; }",
    ".eta-poph { margin:0; font-weight:600; color:var(--cmn-heading); font-size:.86rem; }",
    ".eta-search, .eta select { font:inherit; font-size:.86rem; min-height:24px; padding:2px 6px; border:1px solid var(--cmn-line); border-radius:6px; background:var(--cmn-surface); color:var(--cmn-ink); width:100%; box-sizing:border-box; }",
    ".eta-list { max-height:220px; overflow-y:auto; display:grid; gap:1px; }",
    ".eta-opt { font:inherit; font-size:.84rem; min-height:24px; display:flex; justify-content:space-between; gap:8px; align-items:center; text-align:left; padding:2px 6px; border:0; background:none; color:var(--cmn-ink); cursor:pointer; border-radius:4px; }",
    ".eta-opt[aria-selected=\"true\"] { background:var(--eta-wash); font-weight:600; }",
    ".eta-check, .eta-slider { display:grid; grid-template-columns:auto 1fr; gap:6px; align-items:start; font-size:.82rem; color:var(--cmn-ink-2); }",
    ".eta-slider { grid-template-columns:1fr; }",
    ".eta-chart { width:100%; display:grid; gap:4px; }",
    ".eta-dim svg { opacity:.45; }",
    ".eta-axis { stroke:var(--cmn-line); stroke-width:1; }",
    ".eta-gap { stroke:var(--cmn-muted); stroke-width:1; stroke-dasharray:1 1; }",
    ".eta-fill-programs { fill:var(--eta-programs); }",
    ".eta-fill-skills { fill:var(--eta-skills); }",
    ".eta-day { cursor:pointer; }",
    ".eta-day rect { opacity:.85; }",
    ".eta-dayon rect { opacity:1; }",
    ".eta-tick { fill:var(--cmn-muted); font-size:9px; font-family:var(--cmn-sans); }",
    ".eta-costlabel { fill:var(--cmn-heading); font-size:8px; font-weight:500; font-family:var(--cmn-sans); }",
    ".eta-costline { stroke:var(--eta-spend); stroke-width:1.25; }",
    ".eta-costtick { stroke:var(--eta-spendtick); stroke-width:1.5; }",
    ".eta-costdot { fill:var(--eta-spend); stroke:var(--cmn-surface); stroke-width:.6; }",
    ".eta-legend { display:flex; flex-wrap:wrap; justify-content:center; gap:2px 12px; font-size:.78rem; color:var(--cmn-ink-2); }",
    ".eta-key { display:inline-flex; align-items:center; gap:4px; cursor:help; }",
    ".eta-swatch { width:9px; height:9px; border-radius:1px; display:inline-block; }",
    ".eta-sw-programs { background:var(--eta-programs); } .eta-sw-skills { background:var(--eta-skills); }",
    ".eta-sw-slo { border:1px solid var(--eta-slo); background:repeating-linear-gradient(135deg, var(--eta-slo) 0 1px, transparent 1px 3px); }",
    ".eta-sw-objectives { border:1px solid var(--eta-objectives); background:repeating-linear-gradient(135deg, var(--eta-objectives) 0 1px, transparent 1px 3px); }",
    ".eta-sw-spend { height:2px; width:14px; background:var(--eta-spend); }",
    ".eta-hover { min-height:1em; font-size:.8rem; color:var(--cmn-ink-2); text-align:center; }",
    ".eta-daytable summary { cursor:pointer; color:var(--cmn-link); text-decoration:underline; font-size:.82rem; }",
    ".eta-scroll { overflow-x:auto; max-width:100%; }",
    ".eta-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:.84rem; color:var(--cmn-ink); }",
    ".eta-table th, .eta-table td { text-align:left; vertical-align:top; padding:4px 8px 4px 0; border-bottom:1px solid var(--cmn-line-soft); overflow-wrap:anywhere; }",
    ".eta-table thead th { font-weight:600; color:var(--cmn-heading); }",
    ".eta-table tbody th { font-weight:500; }",
    ".eta-full { display:grid; gap:12px; padding:12px 16px; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; }",
    ".eta-full h3 { margin:0; }",
    ".eta-full h4, .eta-full h5 { margin:0; color:var(--cmn-heading); }",
    ".eta-p { margin:0; color:var(--cmn-ink); max-width:var(--cpl-measure,none); }",
    ".eta-phases { display:flex; flex-wrap:wrap; gap:6px 14px; }",
    ".eta-callout { margin:0; padding:8px 12px; border-left:3px solid var(--cmn-accent); background:var(--cmn-page); color:var(--cmn-ink); max-width:var(--cpl-measure,none); }",
    ".eta-grid, .eta-tiles, .eta-strip { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; }",
    ".eta-cell { display:grid; gap:2px; align-content:start; padding:8px 10px; border:1px solid var(--cmn-line-soft); border-radius:8px; }",
    ".eta-cell h4, .eta-cell h5 { font-size:.86rem; }",
    ".eta-cell p { margin:0; }",
    ".eta-v { font-family:var(--cmn-serif); font-size:1.15rem; color:var(--cmn-title); }",
    ".eta-sub { display:grid; gap:8px; }",
    ".eta-lever { display:grid; gap:2px; padding-top:6px; border-top:1px dashed var(--cmn-line-soft); }",
    ".eta-links { margin:0; padding-left:20px; }",
    "@media (max-width:560px) { .eta-band, .eta-full { padding:10px; } .eta-grid, .eta-tiles, .eta-strip { grid-template-columns:1fr; } }",
    "@media (prefers-reduced-motion: reduce) { .eta * { transition:none !important; scroll-behavior:auto !important; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement("style"); s.id = CSS_ID; s.textContent = CSS;
    (document.head || document.body).appendChild(s);
  }

  var ext = { views: {}, unlisted: {}, ledes: {}, ready: ready, view: view, top: top, tiles: tiles, panes: {} };
  ext.panes[PANE_KEY] = clockPane;
  ext.views[VIEW_KEY] = TITLE;
  if (!LISTED) ext.unlisted[VIEW_KEY] = true;
  ext.ledes[VIEW_KEY] = "When Phase 1 of College Data Collection would be done at the current pace, and what turning on a connection would do to that date. Every moved date is a projection, not a partner commitment.";
  window.CPL_CDC_EXT = Array.isArray(window.CPL_CDC_EXT) ? window.CPL_CDC_EXT : [];
  window.CPL_CDC_EXT.push(ext);
  window.CPL_COMMONS_ETA = { spendLines: spendLines, VIEW_KEY: VIEW_KEY, LISTED: LISTED, FILES: FILES, LEVERS: LEVERS, ST: ST, CSS: CSS, base: base, phase1: phase1, finish: finish, freshState: freshState,
    _reset: function () { SHARED = null; MOUNTS = []; },
    strip: function (M) { return ST.pr ? strip(base(M, ST.pr, ST.skills)) : null; }, ready: ready, view: view, nearComplete: nearComplete, stalledFactor: stalledFactor };
})();
