/* college_briefing.js — the college-facing half of the action engine.
 *
 * The MAP Team Queue (map_team_queue.js) answers "what is waiting on ME?" and
 * leads with AGE. This answers the college's question — "what should I do
 * next?" — and leads with OPPORTUNITY. Same engine shape, opposite framing.
 *
 * Three rules this file exists to keep:
 *
 *  1. STRATEGIES ARE SOURCED, NEVER PASTED. The action library is written by
 *     the team in Supabase `cpl_funding_config`, not by a session. We walk
 *     EVERY project in that config (today: cpl-implementation / the $35M IFM;
 *     later: the $50k ESS 25-82 program, which Sam is adding), so a new
 *     funding program's strategies appear here with no code change.
 *
 *  2. A PROGRAM WE COULD NOT READ IS NAMED, NOT SKIPPED. If a project exists
 *     but does not match the shape we understand, it lands in `unread` and the
 *     page says so. Silently rendering nothing is how "not in this dataset"
 *     becomes "zero" — the failure this project keeps re-learning.
 *
 *  3. A STRATEGY WE CANNOT MEASURE SAYS SO. Only some strategies map onto
 *     state we actually hold. Those render as a FRACTION (a checkmark taught
 *     colleges that uploading was the finish line). The rest render as plain
 *     advice marked "not measured here" — never as 0, never as done.
 *
 * Measured strategies are matched by a stable substring of the team's own
 * wording. If the team edits that wording, the match degrades to "not
 * measured" rather than attaching a number to the wrong strategy — the safe
 * direction, and asserted in tests/college_briefing.test.js.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var REST = SUPABASE_URL + "/rest/v1";

  // Sam's answer, 2026-08-09: Scenario 1, Year 1. Kept as parameters rather
  // than inlined so changing his mind is a one-line edit, not a rewrite.
  var SCENARIO = "Scenario 1";
  var YEAR = "1";
  /* The one project the funding box on this tab actually models — the money
   * comes from CPL_FUNDING_TAB, which is scoped to it. Its strategies nest
   * inside the funding priorities; ANY OTHER project keeps its own section,
   * so a program the team adds later still appears with no code change. */
  var IMPL_PROJECT = "cpl-implementation";

  // ⚠ THERE WAS A "Your role" PICKER HERE AND IT DID NOTHING (removed
  // 2026-08-17). Six options — Anyone at the college / CPL Coordinator /
  // Counselor / Admissions & Records / Veterans Services / Dean-Administrator —
  // wired to `state.role`, which was assigned on change and READ NOWHERE. Every
  // pick re-rendered the tab and changed not one word of it.
  //
  // That made it worse than clutter: it is a control that PROMISES the page
  // will speak to your job and then silently doesn't, sitting inches above the
  // "I'm a…" chips, which ask the same question and genuinely change Sierra's
  // answer. Two role pickers, one of them a decoy. The chips are the role
  // picker now (cpl_chat.js AUDIENCES).
  //
  // If per-role briefing content is ever wanted, build it against the chips'
  // audience value — do not restore a second, parallel notion of "role".

  /* ── The scope a visitor is here for (Sam, 2026-08-17) ─────────────────────
   * The tab used to open on a title and two dropdowns. It now opens on ONE
   * question — who are you here as — and curates the second list from the
   * answer.
   *
   * ⚠ TWO OF THE FIVE HAVE NO DATA, AND THAT IS NOT A UI PROBLEM. Sam asked for
   * Strong Workforce region and Academic Senate region. Neither exists in this
   * repo: `map_colleges` carries only id/name/variants/is_test/entity_kind, and
   * the funding roster's only geography key is `district`.
   *
   * ⚠ AND THE REGION DATA WE *DO* HOLD IS A THIRD SCHEME — do not be tempted.
   * `college_geo.region` (Supabase, 120 colleges) is a hand-authored ~10-way
   * macro-region built for Sierra's "which colleges NEAR me" ranking
   * (chatbox/_seed_college_geo.py says so in its docstring). The Strong
   * Workforce program has EIGHT regional consortia with different boundaries
   * — our "San Joaquin Valley" + "Greater Sacramento" split does not match
   * "Central Valley/Mother Lode", and "Central Coast" is not "South Central
   * Coast" — and the ASCCC has FOUR areas, A–D. Wiring `college_geo` behind
   * either label would silently mis-group a college's peers in a view people
   * act on, which is worse than the button being off. Sam (2026-08-17): the
   * real figures are on the MAP Dashboard, so the source exists — it just has
   * not been located in an export yet. When it is, add the mapping and flip
   * `ready`; nothing else here changes. */
  var SCOPES = [
    { k: "college",   label: "My college",                    ready: true },
    { k: "district",  label: "My district",                   ready: true },
    { k: "swp",       label: "My Strong Workforce region",    ready: false,
      why: "Needs the college-to-consortium list — it is on the MAP Dashboard but not yet in an export we hold." },
    { k: "senate",    label: "My Academic Senate region",     ready: false,
      why: "Needs the college-to-ASCCC-area list — same source, not yet located." },
    { k: "statewide", label: "Statewide",                     ready: true }
  ];
  // Scopes that need a second pick. Statewide is the whole set, so it does not.
  function scopeNeedsEntity(k) { return k === "college" || k === "district"; }
  var SCOPE_KEY = "cplMyCollegeScope.v1";

  // Every collapsible section on the tab, so Expand all / Collapse all can act
  // on the set rather than on whatever happens to be in the DOM. `sierra` is
  // deliberately IN this list — Sam chose the literal reading: Collapse all
  // closes everything, Sierra included. A control that silently exempts one
  // section teaches people it is broken.
  var SECTION_IDS = ["sierra", "start", "stand", "waiting", "types", "courseshare",
                     "tier", "funding", "advice", "contacts", "resources"];

  var state = {
    college: null, data: null, loading: false, error: null, loadedSignedIn: null,
    // Which of SCOPES the visitor picked, and — for the scopes that need one —
    // the entity within it. `college` above stays the college-scope selection
    // because everything downstream of it keys on the college NAME.
    scope: null,
    // The PREVIOUS visit's choice, offered as a shortcut on the scope question
    // and read by nothing else. Never seeds `scope`/`college` — the tab always
    // asks first (Sam, 2026-08-21). See restoreScope().
    remembered: null,
    // Per-college detail, fetched on selection rather than up front — 123
    // colleges' worth of credential rows is not worth loading to show one.
    detail: null, detailFor: null, detailLoading: false, detailError: null,
    // District filter for the college picker (from the funding roster, which
    // carries a district per college). "" = every college.
    district: "",
    // Which collapsible sections the reader has opened, by section id. Sam,
    // 2026-08-12: Sierra AI is the tab; everything under it opens on demand.
    // Held in state rather than read off the DOM because render() rewrites
    // innerHTML — a <details open> that lived only in the markup would snap
    // shut every time the district or college picker changed.
    // Sierra starts OPEN (Sam, 2026-08-17: collapsible but expanded by default);
    // everything else opens on demand. Seeded here rather than in the markup so
    // "expanded by default" survives the first render() rewrite.
    open: { sierra: true },
    // The funding model. Two stages on purpose: the ROSTER (cpl_funding_data.js,
    // ~49KB) powers the district picker as soon as the tab opens; the MODEL
    // (cpl_funding.js, ~370KB) is pulled only when a college is chosen and
    // there is actually a money box to fill.
    roster: "idle",   // idle | loading | ready | error
    funding: "idle",  // idle | loading | ready | error
    // The daily tier classification (live_metrics.json). Its own status field
    // rather than a bare `live == null` check: null is also the FAILED-read
    // value, and a loader keyed on nullness would either never run or run
    // forever depending on how the field was initialised.
    liveState: "idle", // idle | loading | ready | error
    live: null
  };

  // MAP's six CPL types, in the order a coordinator thinks about them, with the
  // plain-language name beside MAP's own. Apprenticeship is deliberately NOT
  // here: MAP has no such type, so a type filter returns 0 and reads as "we do
  // none" — it is sourced from apprenticeship_credits instead.
  var CPL_TYPES = [
    { key: "Industry Certification", label: "Industry Certifications" },
    { key: "Credit By Exam",         label: "Credit by Exam" },
    { key: "Standardized Assessment", label: "Standardized Assessment" },
    { key: "Military",               label: "Military" },
    { key: "Portfolio Review",       label: "Portfolio Review" },
    { key: "Other",                  label: "Other" }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* ── Auth ──────────────────────────────────────────────────────────────────
   * ⚠ THIS TAB SPENT ITS WHOLE LIFE READING A STORAGE KEY NOTHING WRITES.
   * `getSession()` read `localStorage.cpl_team_session` — a string that appeared
   * EXACTLY ONCE in the repo, here, as this read. No module, no sign-in flow and
   * no test ever set it, so it returned null for every visitor, always.
   *
   * That alone is inert. What made it a defect is the pair of consequences:
   *
   *   1. The reviewer session was never seen. The canonical key is `cpl_sb`,
   *      which cpl_session.js (the keeper, #1205) holds continuously fresh for
   *      the other 25 modules. This tab did not read it, so the keeper could not
   *      help it — a magic-link reviewer was, to this file, a logged-out guest.
   *   2. The team phrase never reached the server. `signedIn()` checked
   *      `cpl_team_pass` SEPARATELY, so a phrase holder rendered the tab, but
   *      authHeaders() built its headers from the (always null) session and
   *      attached no `x-team-pass`.
   *
   * Every gated read therefore went out bearing the bare anon key. The gates are
   * `is_allowed_reviewer() OR team_pass_ok()` and BOTH were false, and an
   * RLS-filtered SELECT is not an error — PostgREST answers 200 with `[]`. So
   * map_college_credit_summary, map_college_cr_unit, map_college_goal2 and
   * map_college_contacts all came back as empty arrays that are indistinguishable
   * from "this college has nothing", on every college, for everyone. The public
   * reads beside them (map_colleges, chatbox_credentials, cpl_funding_config)
   * kept working, which is why the tab looked healthy while every MAP figure on
   * it was blank. Sam: "I think all the colleges are coming up blank on this."
   *
   * Fixed by DELEGATING to the two shared modules rather than writing a
   * fourteenth copy of the auth dance — same reasoning as the keeper itself.
   * The inline fallbacks cover a standalone mount (tests, or a load order where
   * this file evaluates first); they read the same canonical keys. */
  var TEAM_PASS_KEY = "cpl_team_pass";
  function isValidJwt(t) {
    return typeof t === "string" && t.split(".").length === 3 && t.length > 40;
  }
  function getSession() {
    // 1. Reviewer magic-link session, via the keeper — it owns `cpl_sb` and
    //    renews it, so asking it is what makes this tab benefit from #1205/#1207.
    try {
      var k = window.CPL_SESSION && window.CPL_SESSION.get();
      if (k && isValidJwt(k.access_token)) {
        return { access_token: k.access_token, email: k.email || "(reviewer)" };
      }
    } catch (e) { /* keeper absent — fall through */ }
    try {
      var raw = localStorage.getItem("cpl_sb") || sessionStorage.getItem("cpl_sb");
      var s = raw ? JSON.parse(raw) : null;
      if (s && isValidJwt(s.access_token)) {
        return { access_token: s.access_token, email: s.email || "(reviewer)" };
      }
    } catch (e) { /* ignore */ }
    // 2. Shared team phrase. A pseudo-session: the bearer stays the anon key and
    //    the phrase rides in the header (a "Bearer <phrase>" is the classic bug).
    try {
      var p = localStorage.getItem(TEAM_PASS_KEY);
      if (p) return { teamPass: p, email: "(team)" };
    } catch (e) { /* ignore */ }
    return null;
  }
  function signedIn() { return !!getSession(); }
  function authHeaders() {
    var s = getSession();
    // PostgREST 401s on an empty/garbled Bearer, so a phrase session keeps the
    // anon key as its bearer and unlocks via the header instead.
    var token = (s && s.access_token) || SUPABASE_ANON;
    var h = { apikey: SUPABASE_ANON, Authorization: "Bearer " + token };
    // team_pass_ok() reads the x-team-pass REQUEST HEADER server-side. The stored
    // phrase rides along even for a JWT session: the gates are OR-predicates, so
    // it is harmless for a reviewer and it un-shadows the phrase for a signed-in
    // NON-reviewer, whose JWT alone fails is_allowed_reviewer().
    try {
      if (window.CPL_TEAM_PHRASE) return window.CPL_TEAM_PHRASE.decorateHeaders(h, s);
    } catch (e) { /* helper absent — fall through */ }
    var p2 = (s && s.teamPass) || null;
    if (!p2) { try { p2 = localStorage.getItem(TEAM_PASS_KEY); } catch (e) {} }
    if (p2) h["x-team-pass"] = p2;
    return h;
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : null; }
  function fmt(n) { return n == null ? "—" : Number(n).toLocaleString("en-US"); }
  function pct(a, b) { return (!b || b <= 0 || a == null) ? null : Math.round((a / b) * 1000) / 10; }
  function money(n) {
    if (n == null || !isFinite(n)) return "—";
    return "$" + Math.round(Number(n)).toLocaleString("en-US");
  }

  /* PURE. district -> [MAP college names]. Both sides resolve through
   * cplCollegeShort(), the same crosswalk the money join uses, so a college
   * can never land in one district here and another there. */
  function districtIndex(names) {
    var roster = window.CPL_FUNDING && window.CPL_FUNDING.colleges;
    if (!roster || !names) return null;
    var byShort = {};
    roster.forEach(function (c) { byShort[shortName(c.college)] = c.district || null; });
    var idx = {};
    names.forEach(function (n) {
      var d = byShort[shortName(n)];
      if (!d) return;
      (idx[d] = idx[d] || []).push(n);
    });
    return idx;
  }

  /* PURE. Re-sequence one program's priorities into the curator's display
   * order. `order[i]` is the SOURCE index shown at display position i. Anything
   * malformed — wrong length, out of range, a repeat — returns the natural
   * order rather than dropping or duplicating a priority. */
  function applyPriorityOrder(list, order) {
    if (!Array.isArray(order) || order.length !== list.length) return list;
    var out = [], seen = {}, i, v;
    for (i = 0; i < order.length; i++) {
      v = Number(order[i]);
      if (!(v >= 0 && v < list.length) || v !== Math.floor(v) || seen[v]) return list;
      seen[v] = 1;
      out.push(list[v]);
    }
    return out.map(function (pr, j) {
      var copy = {}; for (var k in pr) if (Object.prototype.hasOwnProperty.call(pr, k)) copy[k] = pr[k];
      copy.index = j;
      return copy;
    });
  }

  /* ── The strategy library ────────────────────────────────────────────────
   * PURE. config → { programs, unread }. Walks every project so a program the
   * team adds later is picked up without a code change.
   */
  function collectPrograms(config, opts) {
    opts = opts || {};
    var scenario = opts.scenario || SCENARIO;
    var year = String(opts.year || YEAR);
    var programs = [], unread = [];
    var projects = config && config.projects;
    if (!projects || typeof projects !== "object") {
      return { programs: [], unread: [{ id: "(config)", why: "No projects found in cpl_funding_config." }], scenario: scenario, year: year };
    }
    Object.keys(projects).forEach(function (pid) {
      var p = projects[pid] || {};
      var label = p.label || pid;
      var scen = p.scenarios && p.scenarios[scenario];
      if (!scen) {
        unread.push({ id: pid, label: label, why: "No “" + scenario + "” in this program." });
        return;
      }
      var yp = scen.yearPriorities && scen.yearPriorities[year];
      if (!yp || typeof yp !== "object") {
        unread.push({ id: pid, label: label, why: "No Year " + year + " priorities in “" + scenario + "”." });
        return;
      }
      var priorities = Object.keys(yp).sort(function (a, b) { return Number(a) - Number(b); }).map(function (k, i) {
        var pr = yp[k] || {};
        // An empty-string strategy is a curator typo, not a strategy. Drop it
        // from the list but COUNT it, so the page never silently shrinks.
        var raw = Array.isArray(pr.strategies) ? pr.strategies : [];
        var kept = raw.filter(function (t) { return String(t || "").trim() !== ""; });
        return {
          index: i,
          key: k,
          share: num(pr.share),
          title: pr.title || null,
          description: pr.description || null,
          metric: pr.metric || null,
          strategies: kept.map(function (t) { return String(t).trim(); }),
          blankCount: raw.length - kept.length
        };
      });
      // DISPLAY ORDER (Sam, 2026-08-20). The curator can drag the priority
      // cards on the Implementation Funding tab into a new order, stored beside
      // the config as a permutation of the source indices. `key` stays the
      // SOURCE index — that is what joins a priority back to the funding module
      // — while `index` becomes the position the curator actually sees, so
      // "priority 2" names the same priority on both tabs.
      priorities = applyPriorityOrder(priorities, scen.priorityOrder);
      var total = priorities.reduce(function (n, pr) { return n + pr.strategies.length; }, 0);
      if (!total) {
        unread.push({ id: pid, label: label, why: "Year " + year + " of “" + scenario + "” has no strategies written yet." });
        return;
      }
      programs.push({ id: pid, label: label, area: p.area || null, priorities: priorities, strategyCount: total });
    });
    return { programs: programs, unread: unread, scenario: scenario, year: year };
  }

  /* ── Measures ────────────────────────────────────────────────────────────
   * PURE. Each entry: a stable substring of the team's own wording, and a fn
   * from the college's measured state to a rendered measure. Returning null
   * means "we hold nothing for this college" — which is NOT the same as zero,
   * and renders differently.
   */
  var MEASURES = [
    {
      match: "act on all jst credit recommendations",
      measure: function (c) {
        if (!c || c.suppressed) return null;
        var dormant = num(c.dormant_credits), art = num(c.articulated_waiting);
        if (dormant == null) return null;
        return {
          headline: fmt(dormant) + " units waiting",
          detail: art != null && art > 0
            ? fmt(art) + " of those are already articulated — the credit exists and the exhibit exists; nothing is blocking the award."
            : "Credit students have earned that has not been acted on.",
          emphasis: art != null && art > 0 ? "high" : "normal"
        };
      }
    },
    {
      match: "complete transcribe step in map",
      measure: function (c) {
        if (!c || c.suppressed) return null;
        var applied = num(c.applied_credits), tr = num(c.transcribed_credits);
        if (applied == null || tr == null || applied <= 0) return null;
        var p = pct(tr, applied);
        // ⚠️ "Transcribed" in MAP means the COLLEGE MARKED THE STEP DONE — it does
        // NOT mean the credit is on the student's transcript. The college
        // forwards the CPL plan to Admissions & Records, who post it in the
        // college SIS by hand: there is NO SIS integration with MAP (Sam,
        // 2026-08-11), and closing that gap is hard because SIS setups and
        // the coding of transcribed CPL differ markedly college to college.
        // Saying "reached the transcript" asserts something MAP cannot know.
        return {
          headline: fmt(tr) + " of " + fmt(applied) + " applied units marked transcribed in MAP (" + p + "%)",
          detail: p >= 100
            ? "Every applied unit has been marked."
            : fmt(applied - tr) + " applied units have not been marked yet. Forward the student's CPL plan to "
              + "Admissions & Records, who post the credit in your own student system — MAP does not do that for "
              + "you. Marking the step here is what puts these numbers in front of people now rather than a year "
              + "from now.",
          fraction: { n: tr, d: applied, pct: p },
          emphasis: p < 60 ? "high" : "normal"
        };
      }
    },
    {
      match: "cpl coordinator and/or counselor is listed",
      measure: function (c) {
        if (!c) return null;
        if (c.contactEmail) {
          return { headline: "Listed: " + c.contactEmail, detail: "A student request from MAP reaches a real person.", emphasis: "normal" };
        }
        if (c.contactKnown === false) return null;
        return {
          headline: "No contact listed in MAP",
          detail: "A student CPL request from your landing page has nowhere to land.",
          emphasis: "high"
        };
      }
    }
  ];

  function measureFor(text, college) {
    var t = String(text || "").toLowerCase();
    for (var i = 0; i < MEASURES.length; i++) {
      if (t.indexOf(MEASURES[i].match) !== -1) {
        return { measured: true, result: MEASURES[i].measure(college) };
      }
    }
    return { measured: false, result: null };
  }

  /* ── The engine ──────────────────────────────────────────────────────────
   * PURE: (sources, opts) → a rendered briefing model. No fetch, no clock
   * beyond what is passed in — so it is testable against fixtures.
   */
  function buildBriefing(sources, opts) {
    sources = sources || {};
    opts = opts || {};
    var lib = collectPrograms(sources.config || {}, opts);
    var college = sources.college || null;

    var programs = lib.programs.map(function (p) {
      var priorities = p.priorities.map(function (pr) {
        var items = pr.strategies.map(function (text) {
          var m = measureFor(text, college);
          return {
            text: text,
            measured: m.measured,
            // measured-but-null = we understand this strategy but hold nothing
            // for this college (or its figures are suppressed). Distinct from
            // never-measurable, and it renders differently.
            noData: m.measured && !m.result,
            measure: m.result
          };
        });
        return {
          // `key` is the priority's index in the stored config — its IDENTITY.
          // It has to survive this remap: the funding box joins each priority's
          // money to these strategies by identity, so that the join still holds
          // when the cards are shown in a curator's own order (Sam, 2026-08-20).
          key: pr.key,
          index: pr.index, share: pr.share, title: pr.title, description: pr.description,
          metric: pr.metric, blankCount: pr.blankCount, items: items,
          measuredCount: items.filter(function (i) { return i.measure; }).length
        };
      });
      return { id: p.id, label: p.label, priorities: priorities, strategyCount: p.strategyCount };
    });

    var all = [];
    programs.forEach(function (p) {
      p.priorities.forEach(function (pr) {
        pr.items.forEach(function (i) { if (i.measure) all.push({ item: i, program: p.label, priority: pr }); });
      });
    });
    // Lead with opportunity: the biggest concrete thing this college could act
    // on. Never a ranking against other colleges.
    var leads = all.filter(function (x) { return x.item.measure.emphasis === "high"; });

    return {
      scenario: lib.scenario, year: lib.year, programs: programs, unread: lib.unread,
      leads: leads, measuredTotal: all.length,
      strategyTotal: programs.reduce(function (n, p) { return n + p.strategyCount; }, 0)
    };
  }

  /* ── CSS (injected from JS so it covers both HTMLs — Rule 4) ───────────── */
  function ensureCss() {
    if (document.getElementById("cpl-briefing-css")) return;
    var s = document.createElement("style");
    s.id = "cpl-briefing-css";
    s.textContent = [
      "#college-briefing-root{text-align:left;color:var(--text);}",
      ".cb-bar{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:18px;}",
      ".cb-bar label{display:block;font-size:.75rem;color:var(--text-muted);margin-bottom:4px;}",
      ".cb-bar select{padding:7px 10px;border:1px solid var(--border-strong);border-radius:6px;background:var(--surface);color:var(--text);min-width:220px;}",
      ".cb-lead{border:1px solid var(--border-strong);border-left:4px solid var(--brand);border-radius:8px;padding:14px 16px;margin-bottom:12px;background:var(--surface-subtle);}",
      ".cb-lead h4{margin:0 0 4px;font-size:.95rem;}",
      ".cb-lead .cb-num{font-size:1.35rem;font-weight:700;color:var(--brand);}",
      ".cb-prog{margin-top:26px;}",
      ".cb-prog>h3{margin:0 0 4px;font-size:1.05rem;}",
      ".cb-pri{border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin:12px 0;background:var(--surface);}",
      ".cb-pri h4{margin:0 0 2px;font-size:.92rem;}",
      ".cb-pri .cb-meta{font-size:.75rem;color:var(--text-muted);margin-bottom:10px;}",
      ".cb-item{padding:9px 0;border-top:1px solid var(--border);}",
      ".cb-item:first-of-type{border-top:0;}",
      ".cb-item .cb-t{font-size:.87rem;}",
      ".cb-item .cb-m{font-size:.82rem;margin-top:3px;color:var(--text);}",
      ".cb-item .cb-m b{color:var(--brand);}",
      ".cb-item .cb-d{font-size:.78rem;color:var(--text-muted);margin-top:2px;}",
      ".cb-flag{display:inline-block;font-size:.68rem;padding:1px 7px;border-radius:10px;border:1px solid var(--border-strong);color:var(--text-muted);margin-left:6px;vertical-align:middle;}",
      ".cb-bfrac{height:5px;border-radius:3px;background:var(--border);margin-top:6px;overflow:hidden;max-width:320px;}",
      ".cb-bfrac>i{display:block;height:100%;background:var(--brand);}",
      ".cb-warn{border:1px solid var(--warn,#b45309);border-radius:8px;padding:12px 14px;margin:14px 0;font-size:.83rem;}",
      ".cb-note{font-size:.78rem;color:var(--text-muted);margin-top:18px;line-height:1.5;}",
      // ── Rework 2026-08-11: steps first, then data, advice last ──
      ".cb-h{margin:26px 0 10px;font-size:1.02rem;color:var(--text-strong);}",
      ".cb-stand{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;}",
      ".cb-box{border:1px solid var(--border);border-radius:9px;padding:14px 15px;background:var(--surface);display:flex;flex-direction:column;gap:7px;}",
      ".cb-box.lead{border-color:var(--mustard-fill,#E3B341);border-width:1.5px;}",
      ".cb-big{font-size:1.45rem;font-weight:700;color:var(--text-strong);line-height:1.1;}",
      ".cb-of{font-size:.83rem;color:var(--text-muted);}",
      ".cb-lab{font-size:.82rem;color:var(--text-body);line-height:1.45;}",
      ".cb-box .cb-bar{height:6px;border-radius:3px;background:var(--surface-muted,#ECE9E2);overflow:hidden;padding:0;border:0;min-width:0;}",
      ".cb-box .cb-bar i{display:block;height:100%;background:var(--mustard-fill,#E3B341);border-radius:3px;}",
      ".cb-floor{margin-top:0;margin-bottom:12px;border-left:3px solid var(--crimson,#920000);padding-left:10px;}",
      ".cb-types{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;}",
      ".cb-type{border:1px solid var(--border);border-radius:9px;padding:14px 15px;background:var(--surface);display:flex;flex-direction:column;gap:9px;}",
      ".cb-type header{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}",
      ".cb-type h4{margin:0;font-size:.94rem;color:var(--text-strong);}",
      ".cb-rows{display:flex;flex-direction:column;gap:6px;font-size:.85rem;}",
      ".cb-r{display:flex;justify-content:space-between;gap:10px;align-items:baseline;}",
      ".cb-r .v{font-weight:700;color:var(--text-strong);font-variant-numeric:tabular-nums;}",
      ".cb-tag{font-size:.66rem;padding:2px 7px;border-radius:999px;border:1px solid var(--border-strong);color:var(--text-muted);white-space:nowrap;}",
      ".cb-tag.sw{border-color:var(--mustard-fill,#E3B341);color:var(--mustard-text,#8B6800);}",
      ".cb-opp{font-size:.81rem;color:var(--text-body);border-top:1px solid var(--border);padding-top:8px;display:flex;flex-direction:column;gap:3px;}",
      ".cb-opp em{font-style:normal;color:var(--text-strong);font-weight:600;}",
      // ── What the waiting credit consists of (2026-08-11) ──
      ".cb-wait{display:flex;flex-direction:column;gap:12px;}",
      ".cb-wrow{border:1px solid var(--border);border-radius:9px;padding:12px 14px;background:var(--surface);}",
      ".cb-whead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:.87rem;}",
      ".cb-whead .v{color:var(--text-muted);font-size:.8rem;font-variant-numeric:tabular-nums;white-space:nowrap;}",
      ".cb-wrow .cb-bar{height:6px;border-radius:3px;background:var(--surface-muted,#ECE9E2);overflow:hidden;margin:8px 0 0;padding:0;border:0;min-width:0;display:block;}",
      ".cb-wrow .cb-bar i{display:block;height:100%;background:var(--mustard-fill,#E3B341);border-radius:3px;}",
      ".cb-wrecs{font-size:.76rem;color:var(--text-muted);margin-top:8px;line-height:1.5;}",
      ".cb-wrecs span{font-variant-numeric:tabular-nums;}",
      ".cb-good{border-left:3px solid var(--ok,#2f7a3d);padding-left:10px;}",
      // Tier + the five criteria named (carryover item 3).
      ".cb-tier{border:1px solid var(--border);border-radius:9px;padding:13px 15px;background:var(--surface);}",
      ".cb-thead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}",
      ".cb-thead b{font-size:1.15rem;color:var(--text-strong);}",
      ".cb-thead .v{font-size:.82rem;color:var(--text-muted);font-variant-numeric:tabular-nums;white-space:nowrap;}",
      ".cb-tier p{margin:0 0 9px;font-size:.87rem;line-height:1.6;color:var(--text-body);}",
      ".cb-tier p:last-child{margin-bottom:0;}",
      ".cb-tier p b{color:var(--text-strong);}",
      ".cb-tier em{font-style:normal;color:var(--text-muted);font-variant-numeric:tabular-nums;}",
      // Per-priority split of the allocation cap + the per-pool next step.
      ".cb-plab{font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);margin-bottom:7px;}",
      ".cb-prios{margin-top:12px;border-top:1px solid var(--border);padding-top:11px;}",
      ".cb-prow{padding:8px 0;border-top:1px solid var(--border);}",
      ".cb-prow:first-of-type{border-top:0;padding-top:0;}",
      ".cb-prow .cb-whead{font-size:.85rem;}",
      ".cb-prow .cb-whead .v{font-weight:700;color:var(--text-strong);font-size:.85rem;}",
      ".cb-ptarget{font-size:.76rem;color:var(--text-muted);margin-top:3px;line-height:1.45;}",
      ".cb-next{border:1px solid var(--border-strong);border-left:4px solid var(--brand);border-radius:8px;padding:13px 15px;margin-top:14px;background:var(--surface-subtle);}",
      ".cb-next ul{margin:0;padding-left:18px;font-size:.84rem;line-height:1.55;}",
      ".cb-next li{margin-bottom:5px;}",
      ".cb-next li:last-child{margin-bottom:0;}",
      // Resources — mirrors the public CPL fact sheet's §resources.
      ".cb-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;}",
      ".cb-resi{border:1px solid var(--border);border-radius:8px;padding:11px 13px;background:var(--surface);}",
      ".cb-resi a{font-size:.86rem;font-weight:600;color:var(--link,#0b5cad);text-decoration:none;}",
      ".cb-resi a:hover{text-decoration:underline;}",
      ".cb-resi div{font-size:.76rem;color:var(--text-muted);margin-top:3px;line-height:1.45;}",
      // ── Funding, district roster, Sierra asks (2026-08-11) ──
      ".cb-fund{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;}",
      ".cb-fbox{border:1px solid var(--border);border-radius:9px;padding:14px 15px;background:var(--surface);}",
      ".cb-fbox header{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px;}",
      ".cb-fbox h4{margin:0;font-size:.94rem;color:var(--text-strong);}",
      ".cb-fbig{font-size:1.6rem;font-weight:700;color:var(--text-strong);line-height:1.1;margin-bottom:6px;font-variant-numeric:tabular-nums;}",
      ".cb-flags{margin:10px 0 0;padding-left:18px;font-size:.79rem;color:var(--text-body);line-height:1.45;}",
      ".cb-flags li{margin-bottom:5px;}",
      ".cb-ess-list{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:9px;}",
      ".cb-ess-list li{display:flex;gap:9px;align-items:flex-start;border-top:1px solid var(--border);padding-top:9px;font-size:.83rem;}",
      ".cb-ess-list li:first-child{border-top:0;padding-top:0;}",
      ".cb-ess-list .cb-num{font-size:.83rem;font-weight:600;color:var(--brand);margin-top:2px;}",
      ".cb-ess-list .cb-d{font-size:.77rem;color:var(--text-muted);margin-top:2px;line-height:1.45;}",
      // Words, not glyphs (see essMark). Wider than the old 1.5em glyph slot and
      // left-aligned so "Not yet" and "Partial" sit on one line at every size.
      ".cb-ess{flex:0 0 auto;min-width:4.6em;text-align:left;font-weight:700;font-size:.74rem;text-transform:uppercase;letter-spacing:.03em;margin-top:2px;}",
      ".cb-ess.met{color:var(--ok,#2f7a3d);}",
      ".cb-ess.partial{color:var(--mustard-text,#8B6800);}",
      ".cb-ess.not{color:var(--text-muted);}",
      ".cb-ess.pending,.cb-ess.na{color:var(--text-muted);font-weight:600;}",
      // Fixed layout + an explicit colgroup: auto layout parks columns past the
      // wrapper's right edge on some filtered row sets (Session 43 finding).
      ".cb-dist{width:100%;table-layout:fixed;border-collapse:collapse;font-size:.85rem;}",
      ".cb-dist th{text-align:left;font-size:.72rem;color:var(--text-muted);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--border-strong);}",
      ".cb-dist th:not(:first-child),.cb-dist td.n{text-align:right;font-variant-numeric:tabular-nums;}",
      ".cb-dist td{padding:7px 8px;border-bottom:1px solid var(--border);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".cb-pick{background:none;border:0;padding:0;font:inherit;color:var(--link,#0b5cad);cursor:pointer;text-align:left;}",
      ".cb-pick:hover{text-decoration:underline;}",
      ".cb-roster tr.lead td{font-weight:600;color:var(--text-strong);}",
      // Sierra AI box — first on the tab, holds the pickers and the embedded chat.
      ".cb-assist{border:1px solid var(--border-strong);border-radius:11px;background:var(--surface);padding:16px 18px;margin-bottom:20px;}",
      // (The .cb-assist>header / h3 rules went with the duplicate heading they
      //  styled — the box's title is now the widget's own, hoisted into
      //  .cb-assist-head. See hoistAssistantIntro().)
      ".cb-assist .cb-bar{margin-bottom:0;padding-bottom:12px;border-bottom:1px solid var(--border);}",
      ".cb-assist .cb-asks{margin-top:12px;}",
      ".cb-assist-mount{margin-top:12px;}",
      ".cb-asks{display:flex;flex-wrap:wrap;gap:8px;}",
      ".cb-ask{font:inherit;font-size:.82rem;text-align:left;padding:9px 12px;border:1px solid var(--border-strong);border-radius:999px;background:var(--surface);color:var(--text);cursor:pointer;}",
      ".cb-ask:hover{border-color:var(--brand);color:var(--brand);}",
      // ── Sierra AI leads the tab (Sam, 2026-08-12) ──────────────────────
      // The team's read was that she is the useful part, so she gets the
      // weight: a heavier frame, real breathing room, and a stated purpose.
      // Everything below is deliberately quieter so the contrast does the
      // work — no section under here competes with this box.
      ".cb-assist{border-width:2px;border-color:var(--border-strong);padding:20px 22px 18px;margin-bottom:26px;box-shadow:0 1px 3px rgba(28,28,26,.06);}",
      ".cb-asks-lab{font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);margin:14px 0 7px;}",
      // ── The hoisted heading slot (2026-08-17) ─────────────────────────────
      // finish() moves cpl_chat.js's OWN .cplchat-intro in here, so the box
      // reads title → what she is → pickers → suggestions → chat. The widget's
      // intro carries its own margins; this only has to stop the first heading
      // pushing an extra 16px down from the top of the box.
      ".cb-assist-head .cplchat-intro h2{margin-top:0;}",
      ".cb-assist-head .cplchat-intro p:last-child{margin-bottom:12px;}",
      // The fallback title, shown only if cpl_chat.js never mounted.
      ".cb-assist-fallback{margin:0 0 12px;font-size:1.3rem;letter-spacing:-.01em;color:var(--text-strong);}",
      // Visually hidden, still announced — the "(opens in a new tab)" cue that
      // replaced the ↗ on every resource link. Not display:none, which would
      // take it out of the accessibility tree along with the pixels.
      ".cb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;}",

      /* ── The scope picker (Sam, 2026-08-17) ─────────────────────────────
         Words, not glyphs, per the standing rule — and no icons invented for
         the sake of it. First Light's rule is "glass = chrome, opaque = data":
         these are chrome, so they sit on the surface tokens with a cobalt
         (interactive) accent, never a brand fill that would read as a status. */
      ".cb-scope{max-width:760px;margin:8px auto 0;padding:8px 4px 24px;}",
      ".cb-scope-q{margin:0 0 14px;font-size:1.35rem;letter-spacing:-.01em;color:var(--text-strong);font-weight:650;}",
      // The "open what you looked at last time" shortcut. Above the options and
      // visibly a shortcut, not a sixth option — it is a different KIND of
      // answer to the question, and a row of five look-alike buttons with a
      // sixth that behaves differently is how a picker becomes a guess.
      ".cb-scope-again{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 16px;"
        + "padding-bottom:14px;border-bottom:1px solid var(--border,#d8dde6);}",
      ".cb-scope-again-l{font-size:.78rem;color:var(--text-muted);}",
      ".cb-scope-opts{display:flex;flex-direction:column;gap:8px;}",
      ".cb-scope-b{display:flex;align-items:baseline;justify-content:space-between;gap:12px;width:100%;"
        + "text-align:left;padding:13px 16px;border:1px solid var(--border,#d8dde6);border-radius:10px;"
        + "background:var(--surface-opaque,#fff);color:inherit;font:inherit;cursor:pointer;}",
      ".cb-scope-b:hover:not([disabled]){border-color:var(--cobalt,#0047AB);background:var(--surface-subtle,#eef3fa);}",
      ".cb-scope-b:focus-visible{outline:2px solid var(--focus-ring,var(--brand));outline-offset:2px;}",
      /* A disabled option stays READABLE. Greying it to the point of being hard
         to read hides the one thing it is there to say — that it exists and why
         it is off — so only the affordance is dimmed, not the sentence. */
      ".cb-scope-b[disabled]{cursor:not-allowed;background:var(--surface-subtle,#f6f8fb);border-style:dashed;}",
      ".cb-scope-b[disabled] .cb-scope-l{color:var(--text-muted);}",
      ".cb-scope-l{font-size:1rem;font-weight:600;}",
      ".cb-scope-soon{font-size:.76rem;color:var(--text-muted);white-space:nowrap;}",
      ".cb-scope-note{margin:14px 0 0;font-size:.8rem;color:var(--text-muted);line-height:1.5;}",
      ".cb-back{background:none;border:0;padding:0 0 10px;font:inherit;font-size:.82rem;"
        + "color:var(--accent-link,var(--brand));cursor:pointer;}",
      ".cb-back:hover{text-decoration:underline;}",
      ".cb-ent{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;}",
      ".cb-ent-b{display:flex;flex-direction:column;gap:2px;text-align:left;padding:11px 14px;"
        + "border:1px solid var(--border,#d8dde6);border-radius:10px;background:var(--surface-opaque,#fff);"
        + "color:inherit;font:inherit;cursor:pointer;}",
      ".cb-ent-b:hover{border-color:var(--cobalt,#0047AB);background:var(--surface-subtle,#eef3fa);}",
      ".cb-ent-n{font-size:.76rem;color:var(--text-muted);}",

      /* ── The welcome header, which only exists after a choice ───────────── */
      ".cb-welcome{margin:2px 0 14px;}",
      ".cb-welcome-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;}",
      ".cb-welcome-t{margin:0;font-size:1.45rem;letter-spacing:-.015em;color:var(--text-strong);font-weight:650;}",
      ".cb-welcome-acts{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}",
      ".cb-act{padding:6px 13px;border:1px solid var(--border,#d8dde6);border-radius:999px;"
        + "background:var(--surface-opaque,#fff);color:inherit;font:inherit;font-size:.8rem;cursor:pointer;"
        + "white-space:nowrap;}",
      ".cb-act:hover{border-color:var(--cobalt,#0047AB);background:var(--surface-subtle,#eef3fa);}",
      ".cb-act-q{font-size:.76rem;padding:4px 11px;}",
      ".cb-allctl{display:flex;gap:8px;margin:12px 0 0;}",

      /* Sierra is a section now, but she is the PRIMARY one — the summary reads
         at heading scale rather than at the muted scale the others use. */
      ".cb-assist-d>.cb-sum h2{margin:0;font-size:1.15rem;}",
      ".cb-assist-body{padding-top:4px;}",

      /* ── The roll-up (district / statewide) ─────────────────────────────── */
      ".cb-roll{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 14px;}",
      ".cb-roll-c{flex:1 1 170px;padding:11px 14px;border:1px solid var(--border,#d8dde6);"
        + "border-radius:10px;background:var(--surface-opaque,#fff);}",
      ".cb-roll-n{font-size:1.3rem;font-weight:650;color:var(--text-strong);letter-spacing:-.01em;}",
      ".cb-roll-l{font-size:.76rem;color:var(--text-muted);margin-top:2px;line-height:1.35;}",

      /* ── Print: the briefing ────────────────────────────────────────────
         The Report button expands every section and prints. Everything outside
         this tab is page chrome and must not be in the document, and the
         controls must not print either — a PDF with a "Collapse all" button on
         it looks like a screenshot, not a briefing. */
      /* Print stays sane if someone hits Ctrl-P — the Report button now builds a
         .docx (Sam, 2026-08-17), so this is no longer the briefing route, just
         basic hygiene: drop the controls and do not split a section across pages. */
      "@media print{",
      "  .cb-welcome-acts,.cb-allctl,.cb-back,.cb-assist-pick,.cb-asks,.cb-asks-lab,"
        + ".cb-assist-mount{display:none !important;}",
      "  .cb-sec{break-inside:avoid;}",
      "}",
      // ── Use the width, and survive a phone (Sam, 2026-08-17) ──────────────
      // The pickers stretch instead of sitting at a 220px minimum that wraps
      // into a ragged column, and the box gives its padding back to content.
      "@media (max-width:640px){",
      "  .cb-assist{padding:14px 13px 13px;border-radius:9px;margin-bottom:18px;}",
      "  .cb-bar{gap:9px;}",
      "  .cb-bar>div{flex:1 1 100%;min-width:0;}",
      "  .cb-bar select{width:100%;min-width:0;}",
      "  .cb-assist-fallback,.cb-assist-head .cplchat-intro h2{font-size:1.12rem;}",
      "  .cb-sec-b{padding:2px 12px 15px;}",
      "  .cb-sum{padding:12px 13px;gap:9px;}",
      "}",
      // ── Collapsible detail sections ────────────────────────────────────
      // A closed section still has to say something, or "minimal" becomes
      // "blank": the summary line carries this college's own figure, so the
      // whole page is scannable shut and only opens where the reader digs.
      ".cb-sec{border:1px solid var(--border);border-radius:9px;background:var(--surface);margin-bottom:10px;}",
      ".cb-sec[open]{background:var(--surface-subtle);border-color:var(--border-strong);}",
      ".cb-sum{list-style:none;cursor:pointer;padding:13px 16px;display:flex;align-items:baseline;justify-content:space-between;gap:14px;border-radius:9px;}",
      ".cb-sum::-webkit-details-marker{display:none;}",
      ".cb-sum:hover .cb-sum-t{color:var(--brand);}",
      ".cb-sum:focus-visible{outline:2px solid var(--focus-ring,var(--brand));outline-offset:-2px;}",
      ".cb-sum-t{font-size:.97rem;font-weight:600;color:var(--text-strong);display:flex;align-items:baseline;gap:8px;}",
      ".cb-sum-t::before{content:'▸';font-size:.8em;color:var(--text-muted);transition:transform .12s ease;display:inline-block;}",
      ".cb-sec[open] .cb-sum-t::before{transform:rotate(90deg);}",
      ".cb-sum-v{font-size:.82rem;color:var(--text-muted);text-align:right;font-variant-numeric:tabular-nums;}",
      ".cb-sec-b{padding:2px 16px 17px;border-top:1px solid var(--border);margin-top:-1px;}",
      ".cb-sec-b>h3:first-child,.cb-sec-b>.cb-h:first-child{margin-top:14px;}",
      "@media (prefers-reduced-motion:reduce){.cb-sum-t::before{transition:none;}}",
      // Strategies, nested inside the funding priority they belong to.
      ".cb-strat{margin-top:9px;border-top:1px solid var(--border);padding-top:8px;}",
      ".cb-strat>summary{list-style:none;cursor:pointer;font-size:.79rem;color:var(--accent-link,var(--brand));display:inline-flex;align-items:baseline;gap:6px;}",
      ".cb-strat>summary::-webkit-details-marker{display:none;}",
      ".cb-strat>summary::before{content:'▸';font-size:.85em;display:inline-block;transition:transform .12s ease;}",
      ".cb-strat[open]>summary::before{transform:rotate(90deg);}",
      ".cb-strat>summary:hover{text-decoration:underline;}",
      ".cb-strat>summary:focus-visible{outline:2px solid var(--focus-ring,var(--brand));outline-offset:2px;border-radius:3px;}",
      ".cb-strat ol{margin:9px 0 0;padding-left:19px;font-size:.82rem;line-height:1.5;color:var(--text-body);}",
      ".cb-strat li{margin-bottom:7px;}",
      ".cb-strat li:last-child{margin-bottom:0;}",
      ".cb-strat li .cb-m{font-size:.8rem;margin-top:3px;}",
      ".cb-strat li .cb-d{font-size:.76rem;color:var(--text-muted);margin-top:2px;line-height:1.45;}"
    ].join("\n");
    document.head.appendChild(s);
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  /* ⚠ THE PANE'S LOADING PLACEHOLDER IS AN INLINE STYLE, AND INLINE BEATS US.
   * Both mirrored HTMLs ship `#college-briefing-root` with a dashed border, a
   * tinted background, 28px of padding and `text-align:center` — correct for
   * "Loading College Briefing…", and still applied to everything rendered on
   * top of it. Inline styles out-rank any selector, so `#college-briefing-root
   * {text-align:left}` in ensureCss() never won.
   *
   * ⭐ THAT IS WHY THE PROSE LOOKED CENTRED INSIDE A LEFT-ALIGNED PAGE (Sam,
   * 2026-08-21: "narrow paragraphs together with full width content… looks
   * awkward"). Every paragraph with a measure cap — the welcome line, Sierra's
   * own description — rendered its text CENTRED inside a left-anchored box, so
   * it read as a ragged column floating in the middle of a wide tab. The cap
   * was never the problem; the inheritance was.
   *
   * Cleared here rather than in the HTML because the placeholder still has a
   * job before this module loads, and because clearing it in JS is one edit
   * instead of two mirrored ones (Rule 4). Idempotent, and only ever removes
   * the four properties the placeholder sets. */
  function shedPlaceholder(root) {
    if (!root || !root.style || root.getAttribute("data-cb-shed") === "1") return;
    ["border", "background", "color", "padding", "textAlign"].forEach(function (k) {
      try { root.style[k] = ""; } catch (e) { /* jsdom-safe */ }
    });
    root.setAttribute("data-cb-shed", "1");
  }


  /* One collapsible detail section. Sam, 2026-08-12: Sierra AI is the tab and
   * everything under her opens on demand — "a minimal initial view with nested
   * expandable details for the inquisitive".
   *
   * ⚠ A CLOSED SECTION MUST STILL SAY SOMETHING. `summary` carries this
   * college's own figure into the header, so the shut page is a scannable
   * eight-line standing report rather than eight anonymous drawers. Collapsing
   * content is only "minimal" if what remains still informs; otherwise it is
   * just hidden, and a coordinator has to open all of it to find anything.
   *
   * Returns "" for an empty body, so a section with nothing to show never
   * renders as a drawer that opens onto blankness. */
  /* ── Step 1: who are you here as? ─────────────────────────────────────────
   * PURE. No main title above it (Sam, 2026-08-17) — the question IS the page
   * until it is answered, and a title over a single question is furniture.
   * A scope with no data renders DISABLED WITH ITS REASON rather than being
   * hidden: an option that silently is not there reads as "we never thought of
   * that", where a disabled one with a sentence reads as "known, not yet wired"
   * — which is the truth, and it is also how the next person knows to ask. */
  function scopePicker() {
    // The shortcut the old auto-restore used to take on the reader's behalf.
    // Named, so nobody lands on a college without having read its name.
    var last = rememberedLabel();
    var resume = last
      ? '<div class="cb-scope-again"><button type="button" class="cb-act" data-scope-resume="1">'
        + "Open " + esc(last) + " again</button>"
        + '<span class="cb-scope-again-l">what you looked at last time</span></div>'
      : "";
    return '<div class="cb-scope" role="group" aria-label="Choose your view">'
      + '<h2 class="cb-scope-q">What would you like to look at?</h2>'
      + resume
      + '<div class="cb-scope-opts">'
      + SCOPES.map(function (s) {
          if (!s.ready) {
            return '<button type="button" class="cb-scope-b" disabled aria-disabled="true" title="'
              + esc(s.why) + '"><span class="cb-scope-l">' + esc(s.label) + "</span>"
              + '<span class="cb-scope-soon">Not yet available</span></button>';
          }
          return '<button type="button" class="cb-scope-b" data-scope="' + esc(s.k) + '">'
            + '<span class="cb-scope-l">' + esc(s.label) + "</span></button>";
        }).join("")
      + "</div>"
      + '<p class="cb-scope-note">Two regional views are not wired up yet — the groupings live on the MAP '
      + "Dashboard but are not in an export we hold. Hover either one to see what it needs.</p>"
      + "</div>";
  }

  /* ── Step 2: the list curated from that answer ────────────────────────────
   * One list, not two dropdowns. Which list depends entirely on step 1, which
   * is the point: a district office should never scroll 120 colleges to find
   * its district, and a college should never meet a district picker it does not
   * need. */
  function entityPicker(names, dIdx) {
    var scope = state.scope;
    var back = '<button type="button" class="cb-back" data-scope-clear="1">Change view</button>';
    if (scope === "district") {
      var districts = dIdx ? Object.keys(dIdx).sort() : [];
      if (!districts.length) {
        return '<div class="cb-scope">' + back
          + '<h2 class="cb-scope-q">Choose your district</h2>'
          + '<p class="cb-note">'
          + (state.roster === "loading" ? "Loading the district list…"
             : "The district list could not be read, so there is nothing to choose from. "
               + "That is a failed read, not an empty system — try again, or pick a college instead.")
          + "</p></div>";
      }
      return '<div class="cb-scope">' + back
        + '<h2 class="cb-scope-q">Choose your district</h2>'
        + '<div class="cb-ent">'
        + districts.map(function (d) {
            return '<button type="button" class="cb-ent-b" data-district="' + esc(d) + '">'
              + esc(d.replace(/ Community College District$/, " CCD"))
              + '<span class="cb-ent-n">' + dIdx[d].length + " colleges</span></button>";
          }).join("")
        + "</div></div>";
    }
    // College. 120 of them, so this is a SELECT with an optional district
    // narrowing rather than 120 buttons — a curated list is one you can get
    // through, and a wall of buttons is not.
    var shown = (state.district && dIdx && dIdx[state.district]) ? dIdx[state.district] : names;
    var districts2 = dIdx ? Object.keys(dIdx).sort() : [];
    var h = '<div class="cb-scope">' + back + '<h2 class="cb-scope-q">Choose your college</h2><div class="cb-bar cb-bar-pick">';
    if (districts2.length) {
      h += '<div><label for="cb-district">Narrow by district (optional)</label><select id="cb-district">'
        + '<option value="">All districts (' + names.length + " colleges)</option>"
        + districts2.map(function (d) {
            return '<option value="' + esc(d) + '"' + (d === state.district ? " selected" : "") + ">"
              + esc(d.replace(/ Community College District$/, " CCD")) + " (" + dIdx[d].length + ")</option>";
          }).join("")
        + "</select></div>";
    }
    h += '<div><label for="cb-college">College</label><select id="cb-college">'
      + '<option value="">Choose a college…</option>'
      + shown.map(function (n) {
          return '<option value="' + esc(n) + '"' + (n === state.college ? " selected" : "") + ">" + esc(n) + "</option>";
        }).join("")
      + "</select></div></div></div>";
    return h;
  }

  /* PURE. What the tab is currently showing, as a name. Used for the welcome
   * title, the report, and Sierra's context. Statewide has no entity — it is
   * named rather than left blank, because "Welcome" with nothing after it is
   * the shape of a bug. */
  function scopeLabel() {
    if (state.scope === "college") return state.college || null;
    if (state.scope === "district") return state.district || null;
    if (state.scope === "statewide") return "California Community Colleges";
    return null;
  }
  function scopeReady() {
    if (!state.scope) return false;
    if (!scopeNeedsEntity(state.scope)) return true;
    return !!(state.scope === "college" ? state.college : state.district);
  }

  /* ── Step 3: the header once a choice is made ─────────────────────────────
   * Sam: the title arrives AFTER the choice. It is a NAME AND ITS CONTROLS and
   * nothing else — no prose. The one sentence it used to carry was struck on
   * 2026-08-21 for describing the assistant that describes itself directly
   * below; see the note where it used to be. */
  function welcomeHead() {
    var name = scopeLabel();
    if (!name) return "";
    var title = state.scope === "statewide" ? "Statewide CPL view" : "Welcome, " + name;
    return '<div class="cb-welcome">'
      + '<div class="cb-welcome-row">'
      + '<h2 class="cb-welcome-t">' + esc(title) + "</h2>"
      + '<div class="cb-welcome-acts">'
      + '<button type="button" class="cb-act" id="cb-report">Create a briefing</button>'
      // Two ways back, because they are different journeys. Switching college is
      // the common one and must not cost a trip through "who are you" — that
      // question is answered once. "Change view" is the rarer, deliberate one.
      + (scopeNeedsEntity(state.scope)
          ? '<button type="button" class="cb-back" data-entity-clear="1">Choose another '
            + (state.scope === "district" ? "district" : "college") + "</button>"
          : "")
      + '<button type="button" class="cb-back" data-scope-clear="1">Change view</button>'
      + "</div></div>"
      /* ⚠ THERE WAS A SENTENCE HERE AND IT SAID WHAT SIERRA ALREADY SAYS
       * (struck 2026-08-21, Sam: "Strike 'Ask Sierra anything about…' It's
       * redundant with the text under the Sierra AI logo"). It read "Ask Sierra
       * anything about CPL at this college, or open a section below for the
       * detail behind it." — three lines above a box whose own first line is
       * "Ask her anything about credit for prior learning."
       *
       * This is #1231's duplicate-description problem for the third time: the
       * tab printed a heading + description, the widget printed its own, #1231
       * removed the tab's copy, and this paragraph grew back one level up. Do
       * not reintroduce a description of Sierra here. If the header needs to
       * point somewhere, point at something Sierra is NOT — and prefer a
       * control to a sentence about one. */
      + '<div class="cb-allctl"><button type="button" class="cb-act cb-act-q" data-all="open">Expand all</button>'
      + '<button type="button" class="cb-act cb-act-q" data-all="close">Collapse all</button></div>'
      + "</div>";
  }

  function sec(id, title, summary, body) {
    if (!body) return "";
    return '<details class="cb-sec" data-sec="' + esc(id) + '"' + (state.open[id] ? " open" : "") + ">"
      + '<summary class="cb-sum"><span class="cb-sum-t">' + esc(title) + "</span>"
      + (summary ? '<span class="cb-sum-v">' + summary + "</span>" : "")
      + "</summary>"
      + '<div class="cb-sec-b">' + body + "</div></details>";
  }

  /* The team's strategies for ONE funding priority, nested inside that
   * priority's row. Sam, 2026-08-12: as a flat list of 22 they "look like a
   * long list of intimidating to-dos" — 19 of which carried a bare "not
   * measured here" flag. Attached to the money they earn, in groups of six to
   * ten, they read as what they are: the team's suggestions for this pool.
   *
   * The "not measured here" flag is dropped in this view. It was honest and
   * it was noise: a reader opening a priority wants the advice, and a row of
   * identical disclaimers is what made the list feel like an audit. Measures
   * still show wherever one exists. */
  /* PURE. Is it safe to nest THIS program's strategies inside THOSE funding
   * priority rows? The money is on one side and the advice on the other, and
   * attaching priority 1's steps to priority 3's cap would be silent and
   * wrong in a way a reader would act on — so the join is worth stating.
   *
   * IDENTITY IS THE JOIN (2026-08-20). It used to be POSITION, which held by
   * construction while both sides walked one ordered set — but the curator can
   * now drag the priority cards into their own order, and a reordered pair
   * still holds three entries on each side, so a count gate cannot see it.
   * Each funding priority carries `src`, its index in the stored config, and
   * each program priority carries `key`, the same index; they join exactly, in
   * any display order. Count equality stays as the outer gate, and the
   * fallback to position keeps a funding module that predates `src` working.
   *
   * ⚠ It is deliberately NOT metric equality, which looks stricter and is
   * worse: the funding module loads its Supabase overlay asynchronously, so
   * between `state.funding = "ready"` and onModelChange it is still on the
   * baked defaults and its metric strings legitimately differ from ours. A
   * metric gate would drop the strategies out of the funding box for that
   * window and then move them back — a visible flap caused by a check, not by
   * a fault. Real drift between the two lists is caught in
   * tests/college_briefing.test.js against the SHIPPED config and module,
   * which is where a structural change should fail. */
  function prioritiesAlign(prios, program) {
    if (!prios || !program || !program.priorities) return false;
    if (!prios.length || prios.length !== program.priorities.length) return false;
    // A reorder makes POSITION the wrong join (both lists still hold three
    // entries, so the count gate cannot see it). Where the funding module
    // reports a source index, every priority must resolve through it.
    var withSrc = prios.filter(function (p) { return p && p.src != null; });
    if (!withSrc.length) return true;
    return withSrc.length === prios.length && withSrc.every(function (p) {
      return !!programPriorityFor(program, p, -1);
    });
  }

  /* PURE. The program priority that belongs to THIS funding priority.
   * IDENTITY FIRST: `p.src` is the funding module's source index and `key` is
   * the same index as the config stores it, so they join exactly whatever
   * order the cards are shown in. Position is the fallback for a funding
   * module that predates `src`. */
  function programPriorityFor(program, p, i) {
    if (!program || !program.priorities) return null;
    if (p && p.src != null) {
      for (var j = 0; j < program.priorities.length; j++) {
        if (String(program.priorities[j].key) === String(p.src)) return program.priorities[j];
      }
      return null;
    }
    return program.priorities[i] || null;
  }

  function stratHtml(items, label) {
    if (!items || !items.length) return "";
    var n = items.length;
    return '<details class="cb-strat"><summary>' + n + " " + (n === 1 ? "step" : "steps")
      + " the team suggests" + (label ? " for " + esc(label) : "") + "</summary><ol>"
      + items.map(function (i) {
          var s = "<li>" + esc(i.text);
          if (i.measure) {
            s += '<div class="cb-m"><b>' + esc(i.measure.headline) + "</b></div>";
            if (i.measure.detail) s += '<div class="cb-d">' + esc(i.measure.detail) + "</div>";
          } else if (i.noData) {
            s += '<div class="cb-d">We hold no figure for this college — that is not the same as zero.</div>';
          }
          return s + "</li>";
        }).join("")
      + "</ol></details>";
  }

  function itemHtml(i) {
    var h = '<div class="cb-item"><div class="cb-t">' + esc(i.text);
    if (!i.measured) h += '<span class="cb-flag" title="No measurement exists for this step yet — it is advice, not a score.">not measured here</span>';
    h += "</div>";
    if (i.measure) {
      h += '<div class="cb-m"><b>' + esc(i.measure.headline) + "</b></div>";
      if (i.measure.fraction) {
        var w = Math.max(0, Math.min(100, i.measure.fraction.pct));
        h += '<div class="cb-bfrac"><i style="width:' + w + '%"></i></div>';
      }
      if (i.measure.detail) h += '<div class="cb-d">' + esc(i.measure.detail) + "</div>";
    } else if (i.noData) {
      h += '<div class="cb-d">We hold no figure for this college — that is not the same as zero.</div>';
    }
    return h + "</div>";
  }

  /* ── Per-college detail ──────────────────────────────────────────────────
   * Fetched when a college is picked. Three reads, all of published aggregates
   * — never the student grain, which is reviewer-gated and too slow to
   * aggregate live (measured >60s against a 1.7-5.0s budget).
   *
   * A FAILED READ IS `null`, NEVER 0. Every consumer below distinguishes "we
   * could not read this" from "this college has none", because collapsing them
   * is how a blind spot becomes a reported zero.
   */
  function loadCollege(name, root) {
    var id = state.data && state.data.nameToId && state.data.nameToId[name];
    if (id == null) { state.detail = null; state.detailFor = name; return Promise.resolve(); }
    state.detailLoading = true; state.detailError = null; state.detailFor = name;
    var h = authHeaders();
    var q = encodeURIComponent('{"' + name.replace(/"/g, '\\"') + '"}');
    return Promise.all([
      jget(REST + "/map_credential_student_rollup?college_id=eq." + id
         + "&select=unified_title,cpl_types,students,students_suppressed,potential_units,"
         + "applied_units,transcribed_units,apprenticeship_units,rows_needs_action", { headers: h }),
      jget(REST + "/chatbox_credentials?adopter_colleges=cs." + q
         + "&select=unified_title,cpl_types,statewide", { headers: h }),
      jget(REST + "/chatbox_credentials?potential_colleges=cs." + q
         + "&select=unified_title,cpl_types,statewide,ccc_rec,adopter_colleges", { headers: h }),
      jget(REST + "/map_college_goal2?college_id=eq." + id
         + "&select=dest,rows_n,students,suppressed,reason", { headers: h }),
      // What the "already articulated, waiting" units actually CONSIST of.
      // Same filter as map_college_credit_summary.articulated_waiting
      // (kb/supabase_map_college_credit_summary.sql line 33) so the breakdown
      // sums to the headline exactly — a list that did not reconcile with the
      // number above it would be worse than no list.
      jget(REST + "/map_college_cr_unit?college_id=eq." + id
         + "&cpl_status_plan=eq." + encodeURIComponent("Needs Action")
         + "&sum_articulated_credits=gt.0"
         + "&select=credit_rec,college_course,course_type,sum_articulated_credits,distinct_students",
         { headers: h })
    ]).then(function (r) {
      state.detail = { rollup: r[0] || [], adopted: r[1] || [], potential: r[2] || [],
                       goal2: r[3] || [], waiting: r[4] || [] };
      state.detailLoading = false;
    }).catch(function (e) {
      state.detail = null; state.detailLoading = false;
      state.detailError = e.message || String(e);
    }).then(function () { if (root) render(root); });
  }

  /* PURE. Roll the per-college reads up per CPL type. Counts are FLOORS: only
   * ~4% of student rows carry a nameable credential, so `students` here is what
   * we can SEE, never a total. That is why `articulated` (from the curated
   * catalog, which is complete) and `students` (from the grain, which is not)
   * are reported side by side rather than as one number. */
  function byCplType(detail) {
    if (!detail) return null;
    var out = CPL_TYPES.map(function (t) {
      var adopted = detail.adopted.filter(function (c) {
        return (c.cpl_types || []).indexOf(t.key) >= 0; });
      var pot = detail.potential.filter(function (c) {
        return (c.cpl_types || []).indexOf(t.key) >= 0; });
      var roll = detail.rollup.filter(function (r) {
        return (r.cpl_types || []).indexOf(t.key) >= 0; });
      var students = 0, seen = false, supp = 0;
      roll.forEach(function (r) {
        if (r.students != null) { students += r.students; seen = true; }
        else if (r.students_suppressed) supp++;
      });
      // Best three adoption candidates, by how many peers already run it —
      // peer adoption is the honest proxy for "well-trodden", and it ranks
      // OPPORTUNITIES, never colleges.
      var cands = pot.slice().sort(function (a, b) {
        return (b.adopter_colleges || []).length - (a.adopter_colleges || []).length;
      }).slice(0, 3).map(function (c) {
        return { title: c.unified_title, peers: (c.adopter_colleges || []).length,
                 statewide: !!c.statewide, rec: c.ccc_rec || null };
      });
      return {
        key: t.key, label: t.label,
        articulated: adopted.length,
        couldAdopt: pot.length,
        couldAdoptStatewide: pot.filter(function (c) { return c.statewide; }).length,
        students: seen ? students : null,
        suppressedCells: supp,
        candidates: cands
      };
    });
    return out;
  }

  /* PURE. The five headline figures. Each carries its own denominator. */
  function standing(summary, detail) {
    if (!summary) return null;
    var elig = num(summary.dormant_credits), art = num(summary.articulated_waiting),
        app = num(summary.applied_credits), tr = num(summary.transcribed_credits),
        stu = num(summary.students);
    var appr = null;
    if (detail) {
      appr = 0;
      detail.rollup.forEach(function (r) {
        if (r.apprenticeship_units != null) appr += Number(r.apprenticeship_units) || 0; });
    }
    return { eligible: elig, articulatedWaiting: art, applied: app, transcribed: tr,
             students: stu, apprenticeshipUnits: appr };
  }

  /* ── What the waiting credit actually is ─────────────────────────────────
   * PURE. `articulated_waiting` is the page's lead figure — "the cheapest
   * credit you will ever give a student". This says what it CONSISTS of, and
   * the answer is startlingly uniform.
   *
   * Measured 2026-08-11 across all 64,074 waiting units statewide:
   *   87.7%  Credit for Basic Military Service → a GE area
   *   10.5%  Credit for Basic Military Service → elective
   *    0.6%  Credit for Basic Military Service → a specific course
   *    1.3%  everything else (814 units, 8 colleges, 310 rows)
   * 65 of the 73 colleges with any waiting credit are 100% basic military
   * service; the average college is 96.2%.
   *
   * That matters for the copy. A coordinator reading "already articulated,
   * waiting" pictures a varied pile of CTE certifications and braces for 300
   * judgment calls. It is very nearly one repeated decision — which is the
   * best news on this page, and is only visible if the breakdown is shown.
   *
   * ⚠ SUPPRESSION. map_college_cr_unit carries NO k-anonymity of its own
   * (only map_college_credit_summary applies the k=10 rule). A college whose
   * headline figures are withheld must NOT get a per-recommendation breakdown
   * of the same credit — publishing the parts of a withheld whole hands back
   * exactly what suppression removed. Same failure family as the statewide
   * total minus its published siblings.
   */
  var MIL_PREFIX = "Credit for Basic Military Service";
  var COURSE_TYPE_LABEL = {
    "Credit for Basic Military Service-Area": "Basic training credit → a GE or graduation area",
    "Credit for Basic Military Service-Elective": "Basic training credit → elective credit",
    "Credit for Basic Military Service-Course": "Basic training credit → a specific course",
    "Elective credit": "Elective credit"
  };

  /* One string in the source carries a U+FFFD replacement character ("CSU GE E
   * <?> Lifelong Understanding…") — the original byte was already lost before
   * MAP stored it, so it cannot be recovered here. Render the legible
   * remainder rather than a broken glyph; the stored value is untouched. */
  function cleanText(s) {
    return String(s == null ? "" : s).replace(/�/g, " ").replace(/\s+/g, " ").trim();
  }

  /* A percentage that never rounds UP into a claim it cannot support.
   * 99.76% rounding to "100%" while a non-military row sits visibly above it
   * is a self-contradiction, and it is the same trap the tier block guards
   * against, where a published 25.0% is really 24.96%. 100 is returned only
   * when the share genuinely reaches it. */
  function safePct(x, dp) {
    var f = Math.pow(10, dp || 0), p = (Number(x) || 0) * 100;
    if (p >= 100) return 100;
    return Math.min(100 - 1 / f, Math.round(p * f) / f);
  }

  function waitingBreakdown(detail, summary) {
    if (summary && summary.suppressed) return { suppressed: true };
    if (!detail || !detail.waiting) return null;
    /* ⚠ NO SUMMARY ROW IS NOT A FINISHED QUEUE. A college absent from the
     * credit summary has no measured figures at all, and its `waiting` read
     * comes back empty for the same reason — nothing about it is recorded.
     * Reporting that as "every credit recommendation has been acted on" turns
     * a blind spot into a compliment, which is the "not in this dataset read
     * as zero" failure pointing the other way. Imperial Valley College — 3
     * students on the systemwide dashboard, no credit rows — was being
     * congratulated on a finished queue. */
    if (!summary) return { unmeasured: true };
    var rows = detail.waiting;
    if (!rows.length) return { empty: true, total: 0, groups: [] };
    var by = {}, total = 0, mil = 0;
    rows.forEach(function (r) {
      var u = Number(r.sum_articulated_credits) || 0;
      if (u <= 0) return;
      total += u;
      var ct = cleanText(r.course_type) || "Not categorized";
      if (ct.indexOf(MIL_PREFIX) === 0) mil += u;
      if (!by[ct]) by[ct] = { type: ct, label: COURSE_TYPE_LABEL[ct] || ct, units: 0, rows: 0, recs: {} };
      by[ct].units += u; by[ct].rows++;
      // A blank credit_rec is a real state in this data (2,111 units across 7
      // colleges statewide) — name it rather than dropping the row.
      var rec = cleanText(r.credit_rec) || "(no recommendation named in MAP)";
      by[ct].recs[rec] = (by[ct].recs[rec] || 0) + u;
    });
    if (!total) return { empty: true, total: 0, groups: [] };
    var groups = Object.keys(by).map(function (k) {
      var g = by[k];
      g.share = g.units / total;
      g.top = Object.keys(g.recs).map(function (name) { return { name: name, units: g.recs[name] }; })
        .sort(function (a, b) { return b.units - a.units; }).slice(0, 4);
      delete g.recs;
      return g;
    }).sort(function (a, b) { return b.units - a.units; });
    return { suppressed: false, empty: false, total: total, groups: groups,
             militaryUnits: mil, militaryShare: mil / total };
  }

  /* ── Where this college sits in the three tiers ───────────────────────────
   * PURE. The tier system already exists (Leading 14 / Advancing 89 /
   * Inactive 12, ≥3 of 5 criteria) and is computed by the Cloudflare worker
   * into live_metrics.json. What it has never done is tell a college WHICH of
   * the five it meets — so "Advancing" arrives as a verdict with no next step,
   * and 77% of colleges sit in that one bucket.
   *
   * This turns it into "Advancing — 2 of 5" with the missing three named and
   * the college's own value beside each threshold. Deliberately NOT a
   * percentile: a percentile bar hands a top-5% badge to a 21-student college
   * (Compton 96th on 21 students vs Chaffey 97th on 1,495; 16 colleges tied at
   * exactly zero), so the band below the top is noise dressed as a ranking.
   *
   * ⚠ THE COUNT IS THE WORKER'S, NOT OURS. The emitted `transcriptionRate` is
   * ROUNDED to one decimal while the worker's own criterion tests the
   * UNROUNDED ratio — so recomputing the count here can disagree at the
   * boundary (a true 24.96% rounds to 25.0). `criteriaMetCount` is therefore
   * authoritative for the number, the per-criterion list is for display, and
   * if the two disagree we say so rather than show a list that does not add up
   * to the figure printed above it.
   */
  /* `short` is the mid-sentence form ("500 CPL students"), because the prose
   * reads "at least 500 CPL students (you: 216)" and a capitalised label
   * stranded mid-clause reads like a heading that lost its box.
   *
   * `ratio` is how close the college is, as actual ÷ threshold, so the unmet
   * criteria can be ordered NEAREST FIRST — the difference between a list and
   * a next step. It is a display ordering only: `met` remains the sole
   * authority on whether a criterion is satisfied, and criterion 4 computes
   * from the UNROUNDED ratio for the same reason `met` does. */
  var TIER_CRITERIA = [
    { label: "At least 500 CPL students", short: "500 CPL students", kind: "size",
      get: function (c) { return num(c.students); },
      met: function (c) { return num(c.students) >= 500; },
      ratio: function (c) { return (num(c.students) || 0) / 500; },
      show: function (c) { return fmt(num(c.students)); } },
    { label: "At least 3,000 units of eligible credit", short: "3,000 units of eligible credit", kind: "size",
      get: function (c) { return num(c.units); },
      met: function (c) { return num(c.units) >= 3000; },
      ratio: function (c) { return (num(c.units) || 0) / 3000; },
      show: function (c) { return fmt(Math.round(num(c.units))); } },
    { label: "At least 5 eligible units per student", short: "5 eligible units per student", kind: "depth",
      met: function (c) { return num(c.avgUnits) >= 5; },
      ratio: function (c) { return (num(c.avgUnits) || 0) / 5; },
      show: function (c) { return String(Math.round(num(c.avgUnits) * 10) / 10); } },
    { label: "At least 25% of eligible units marked transcribed in MAP",
      short: "25% of eligible units marked transcribed in MAP", kind: "mark",
      met: function (c) { return num(c.units) > 0 && (num(c.transcribedUnits) / num(c.units)) >= 0.25; },
      ratio: function (c) { return num(c.units) > 0 ? (num(c.transcribedUnits) / num(c.units)) / 0.25 : 0; },
      show: function (c) { return (num(c.transcriptionRate) || 0) + "%"; } },
    { label: "At least 3 transcribed units per student", short: "3 transcribed units per student", kind: "mark",
      met: function (c) { return num(c.avgTranscribed) >= 3; },
      ratio: function (c) { return (num(c.avgTranscribed) || 0) / 3; },
      show: function (c) { return String(Math.round(num(c.avgTranscribed) * 100) / 100); } }
  ];
  var TIER_LABEL = { leading: "Leading", advancing: "Advancing", inactive: "Inactive" };

  function tierStanding(live, collegeName) {
    if (!live || !live.tiers || !collegeName) return null;
    var t = live.tiers, found = null, tier = null;
    ["leading", "advancing", "inactive"].forEach(function (k) {
      if (found || !t[k] || !t[k].colleges) return;
      (t[k].colleges || []).forEach(function (c) {
        if (!found && c && c.college === collegeName) { found = c; tier = k; }
      });
    });
    if (!found) return null;
    var list = TIER_CRITERIA.map(function (cr) {
      return { label: cr.label, short: cr.short, kind: cr.kind, met: !!cr.met(found),
               actual: cr.show(found), ratio: cr.ratio(found) };
    });
    var computed = list.filter(function (c) { return c.met; }).length;
    var stated = num(found.criteriaMetCount);
    return {
      tier: tier, label: TIER_LABEL[tier] || tier,
      met: stated == null ? computed : stated,
      total: TIER_CRITERIA.length,
      criteria: list,
      met_list: list.filter(function (c) { return c.met; }),
      // Nearest first — the ordering is the advice.
      missing: list.filter(function (c) { return !c.met; })
                   .sort(function (a, b) { return b.ratio - a.ratio; }),
      // The list is shown only when it reconciles with the worker's own count.
      mismatch: stated != null && stated !== computed
    };
  }

  /* PURE. The goal-2 course share — absorbed from the retired Course Credit
   * tab. It is DEMOTED here on purpose: it divides by credit a college has
   * ALREADY AWARDED, so a small amount awarded perfectly reads 100% and looks
   * finished. Measured 2026-08-11: the 14 colleges at 100% carry 155,153
   * dormant units between them. It is never shown without that context. */
  function courseShare(goal2) {
    if (!goal2 || !goal2.length) return null;
    var tot = 0, course = null, anySupp = false;
    goal2.forEach(function (c) {
      if (c.suppressed) { anySupp = true; return; }
      tot += (c.rows_n || 0);
      if (c.dest === "COURSE") course = c.rows_n || 0;
    });
    if (anySupp || !tot || course == null) return { share: null, suppressed: anySupp };
    return { share: course / tot, suppressed: false, awarded: tot };
  }

  /* ── The college's money ──────────────────────────────────────────────────
   * Two appropriations, and they are not interchangeable:
   *   • the $50,000 ESS 25-82 seed grant — already distributed, Spring 2026
   *   • this college's share of the $35M implementation pool — an allocation
   *     CAP earned against MAP performance, never a cheque in the post
   *
   * Both come from cpl_funding.js, which owns the model. NOTHING here
   * re-derives a dollar figure. The allocation is a floor waterfall — every
   * college below the $150K minimum-viable floor is pinned to it and the
   * remainder re-splits across the rest, iteratively — with a guaranteed rural
   * allowance layered on top. "headcount share x pool" reads perfectly
   * plausible and is wrong for every college the waterfall touches, which is
   * most of the small ones. So we call the model and render what it returns.
   */
  function fundingModule() {
    var M = window.CPL_FUNDING_TAB;
    return (M && typeof M._alloc === "function" && typeof M._grant === "function") ? M : null;
  }

  /* The funding roster keys its colleges by SHORT name ("Bakersfield"), the
   * briefing by MAP's full name ("Bakersfield College"). Both sides go through
   * cplCollegeShort() — the curator-owned crosswalk — so the join is one
   * resolver rather than a private guess. Measured 2026-08-11: 115 of 116 MAP
   * colleges resolve to a distinct funding row, 0 collisions on either side,
   * 0 funding rows unreachable. The one residue is Calbright, a NONCREDIT
   * FEEDER that is genuinely not on the 115-college credit roster — handled as
   * its own state below, never as $0. */
  function shortName(name) {
    return (typeof window.cplCollegeShort === "function") ? window.cplCollegeShort(name) : name;
  }

  /* The funding roster's OWN string for a college — which is NOT the same as
   * the canonical short name, and that difference silently unfunded five
   * colleges (found 2026-08-12).
   *
   * The join was only half-normalized. `fundingFor()` sent MAP's full name
   * through cplCollegeShort() and handed the result to cpl_funding.js, whose
   * baseCollege()/_grant() compare it with `c.college` EXACTLY — the raw
   * roster string, never normalized. So it worked for the ~110 colleges whose
   * roster string already equals their canonical short name, and failed for
   * the five where it does not:
   *
   *     MAP name                        canonical      roster string
   *     Mt. San Antonio College         Mt. San Antonio   "Mt San Antonio"
   *     Norco College                   Norco             "Norco College"
   *     Reedley College                 Reedley           "Reedley College"
   *     MiraCosta College               Mira Costa        "MiraCosta"
   *     Los Angeles Southwest College   LA Southwest      "LA Swest"
   *
   * Each of those five rendered "is not on the 115-college funding roster" —
   * telling Mt. SAC, the largest CPL program in the system, that it has no
   * implementation funding. The roster row was there the whole time.
   *
   * CLAUDE.md's rule is right and was applied to one side only: join through
   * cplCollegeShort() on BOTH. We resolve the canonical key back to the
   * roster's own spelling here, in the consumer, rather than normalizing
   * inside cpl_funding.js — the Implementation Funding tab passes roster-raw
   * names internally and works today, so this stays a local fix.
   *
   * The index is rebuilt whenever the roster's length changes, because the
   * roster script loads asynchronously and an index built from an absent
   * roster would otherwise be cached empty forever. */
  var _rosterKeys = null, _rosterKeysN = -1;
  function rosterKey(name) {
    var canon = shortName(name);
    var F = window.CPL_FUNDING, rows = F && F.colleges;
    if (!rows || !rows.length || typeof window.cplCollegeShort !== "function") return canon;
    if (_rosterKeys === null || _rosterKeysN !== rows.length) {
      _rosterKeys = {}; _rosterKeysN = rows.length;
      rows.forEach(function (c) {
        var k = window.cplCollegeShort(c.college);
        // First writer wins, so a later duplicate cannot steal an earlier
        // college's money. The roster is asserted collision-free in the tests.
        if (k && !Object.prototype.hasOwnProperty.call(_rosterKeys, k)) _rosterKeys[k] = c.college;
      });
    }
    return Object.prototype.hasOwnProperty.call(_rosterKeys, canon) ? _rosterKeys[canon] : canon;
  }

  /* Returns null when the model has not loaded — which the caller must render
   * as "not loaded yet", never as "this college gets nothing". An unresolved
   * name and a measured zero are different claims. */
  function fundingFor(name) {
    var M = fundingModule();
    if (!M || !name) return null;
    // The roster's own spelling, not merely the canonical short name — see
    // rosterKey(). Passing the canonical form here unfunded five colleges.
    var key = rosterKey(name);
    var grant = M._grant(key);
    if (!grant) return { key: key, onRoster: false };
    var model = null;
    try { model = M._model(); } catch (e) { /* the model renders its own empty state */ }
    return {
      key: key, onRoster: true, grant: grant,
      floor: model ? model.floor : null,
      cap: model ? model.cap : null,
      // A noncredit feeder receives the seed grant but is not in the $35M
      // college pool — it is funded through the $1M noncredit carve-out, a
      // different mechanism. _alloc returns null and we say so.
      alloc: grant.kind === "credit" ? M._alloc(key) : null,
      // The per-priority split of that cap. Year 1 is passed EXPLICITLY: the
      // module would otherwise use the Implementation Funding tab's viewed
      // year, and under front-loaded disbursement every year after the first
      // has a zero cap — so a briefing that inherited a Year-2 view would show
      // $0 against all three priorities. Year 1 is also the authoritative set
      // (Sam, 2026-08-09: Year 1 and Year 2 are deliberately identical).
      prios: (grant.kind === "credit" && typeof M._prios === "function") ? M._prios(key, "1") : null,
      ess: M._ess(key),
      rural: M._isRural(key),
      district: M._district(key)
    };
  }

  /* PURE. The three ESS 25-82 priority outcomes as WHERE YOU ARE, not as
   * ticks. A bare checkmark is what taught colleges that uploading is the
   * finish line, so outcome 2 — the one this page can actually measure —
   * carries the real fraction: how many statewide credit recommendations this
   * college articulates, and how many more are sitting there to adopt. */
  function essProgress(f, detail, essMeta) {
    if (!f || !f.ess) return null;
    var swAdopted = null, swPotential = null;
    if (detail) {
      swAdopted = detail.adopted.filter(function (c) { return c.statewide; }).length;
      swPotential = detail.potential.filter(function (c) { return c.statewide; }).length;
    }
    return [
      { n: 1, o: f.ess.o1,
        title: "Upload a JST for every enrolled veteran",
        frac: null,
        next: "Every JST uploaded creates a Student CPL Plan — that is the step that puts a veteran's credit in front of somebody." },
      { n: 2, o: f.ess.o2,
        title: "Adopt or adapt the statewide credit recommendations",
        frac: swAdopted == null ? null : {
          have: swAdopted,
          of: (essMeta && essMeta.n_statewide_credentials) || null,
          available: swPotential
        },
        next: swPotential
          ? "The By CPL type section below ranks your best candidates by how many peer colleges already run them."
          : null },
      { n: 3, o: f.ess.o3,
        title: "Proactively identify and serve CPL-eligible students",
        frac: null,
        next: "Identifying a student is the cheap half; the credit still has to be applied to their record to count." }
    ];
  }

  /* PURE. The seed-funding outcome with the most ground still to cover.
   * "not" outranks "partial" — furthest from done first. States the college
   * cannot act on from this page (`na`, and `pending` awaiting confirmation)
   * are never proposed as a next step. Returns null when all three are met,
   * which the caller renders as no seed-funding step rather than a filler. */
  function nextEssOutcome(ess) {
    if (!ess || !ess.length) return null;
    var rank = { not: 0, partial: 1 };
    var open = ess.filter(function (e) { return e.o && rank[e.o.state] != null; });
    if (!open.length) return null;
    open.sort(function (a, b) { return rank[a.o.state] - rank[b.o.state]; });
    return open[0];
  }

  /* PURE. The team's first strategy under the highest-share priority — the
   * single next step for the implementation pool. Read from the curator's own
   * configuration, never authored here: if the team rewrites the strategy this
   * follows it, and if they write none this returns null and the page shows no
   * step rather than inventing one. */
  function topStrategy(briefing) {
    if (!briefing || !briefing.programs) return null;
    var best = null;
    briefing.programs.forEach(function (prog) {
      (prog.priorities || []).forEach(function (pr) {
        if (!pr.strategies || !pr.strategies.length) return;
        var share = pr.share == null ? -1 : pr.share;
        if (!best || share > best.share) {
          best = { share: share, text: pr.strategies[0],
                   priority: pr.title || pr.description || (prog.label + " priority " + (pr.index + 1)) };
        }
      });
    });
    return best;
  }

  /* ── Resources ────────────────────────────────────────────────────────────
   * Mirrors the public CPL fact sheet's §resources (fact-sheet/index.html),
   * re-ordered for a college coordinator: what you DO first, what you read
   * second. All public, all already linked from the fact sheet.
   *
   * ⚠ The fact sheet's first entry is titled "MAP Initiative Website", which
   * the 2026-07-03 naming convention retired — the program is the CPL
   * Initiative and the platform is the MAP platform, and "MAP Initiative" is
   * never used in new writing. Fixed here rather than copied forward; the
   * fact sheet still carries the old title.
   */
  var RESOURCES = [
    ["https://map.rccd.edu/cpl_implementation_guide/", "CPL Implementation & Sustainability Guide",
     "Step-by-step guide for establishing or expanding a college CPL program."],
    ["https://map.rccd.edu/statewidecpl/", "Statewide CPL Credit Recommendations",
     "The faculty-approved opportunities shared across the system — what your college can adopt."],
    ["https://map.rccd.edu/cpllandingpages/", "Find CPL at Your College",
     "The college CPL landing pages, including yours — where a student's request begins."],
    ["https://map.rccd.edu/counselors/", "Counselor Resources Hub",
     "Tools and guides for counselors advising CPL-eligible students."],
    ["https://cpldashboardcccco.azurewebsites.net/insights/dashboard", "MAP CPL Dashboard",
     "Live data on students served, units awarded and savings by college and region."],
    ["https://map.rccd.edu/", "MAP platform website",
     "Central hub for CPL resources, college implementation tools and statewide data."],
    ["https://map.rccd.edu/library", "MAP Resource Library",
     "Full archive of research, training materials and policy briefs."],
    ["https://map.rccd.edu/wp-content/uploads/2025/07/07292025-AB-123-Chaptered-Version.pdf", "Assembly Bill 123 (2025)",
     "The chaptered legislation advancing CPL across the California Community Colleges."],
    ["https://map.rccd.edu/wp-content/uploads/2025/07/credit-for-prior-learning-workplan.pdf", "Vision 2030 CPL Workplan",
     "The implementation roadmap and milestones for CPL across all colleges."],
    ["https://map.rccd.edu/wp-content/uploads/2025/07/vision-2030-report.pdf", "Vision 2030 — July 2025 Edition",
     "The Board of Governors strategic plan; CPL is a central pillar of equity in access."],
    ["https://map.rccd.edu/wp-content/uploads/2025/06/Scaling-Credit-for-Prior-Learning-in-California.pdf",
     "Scaling CPL in California", "Vision 2030 goals, MAP strategy and CPL implementation (2025 edition)."],
    ["https://map.rccd.edu/wp-content/uploads/2024/07/Expected-Economic-Benefits-of-CPL-in-California.pdf",
     "Economic Impact Study", "Beacon Economics (2024): the $32.5B projected economic benefit analysis."],
    ["https://map.rccd.edu/wp-content/uploads/2025/07/2025-CA-Master-Plan-for-Career-Education.pdf",
     "2025 CA Master Plan for Career Education", "The statewide workforce and career-education framework including CPL."],
    ["https://www.asccc.org/pathways-credit", "ASCCC Pathways to Credit",
     "Academic Senate guidance on CPL."],
    ["https://www.wiche.edu/wp-content/uploads/2020/10/PLA-Boost-Report-CAEL-WICHE-Revised-Dec-2020.pdf",
     "CAEL & WICHE — The PLA Boost",
     "The 72-institution study behind “the CPL bump” — the research under the equity and completion figures."]
  ];

  /* `bare` omits the heading — the collapsible section already supplies one,
   * and a second inside the drawer reads as a duplicate. */
  function resourcesHtml(bare) {
    return (bare ? "" : '<h3 class="cb-h">Resources</h3>')
      + '<div class="cb-note" style="margin-top:0">All public. The first four are the ones a coordinator uses; '
      + "the rest is the evidence and policy behind the work.</div>"
      // The trailing ↗ is gone (Sam, 2026-08-17), but the "this leaves the page"
      // cue is NOT — dropping it outright would remove the only warning a
      // keyboard or screen-reader user gets before a new tab steals focus. It
      // becomes a visually-hidden phrase, which is the accessible form the arrow
      // was only gesturing at.
      + '<div class="cb-res">' + RESOURCES.map(function (r) {
          return '<div class="cb-resi"><a href="' + esc(r[0]) + '" target="_blank" rel="noopener">'
            + esc(r[1]) + '<span class="cb-sr">(opens in a new tab)</span></a><div>'
            + esc(r[2]) + "</div></div>";
        }).join("") + "</div>";
  }

  /* The three ESS 25-82 outcomes, marked. WORDS, not glyphs (Sam, 2026-08-17)
   * — and here the glyphs were carrying the whole meaning with no text beside
   * them, so this is the one that mattered: a screen reader announced the
   * partial state as "circle with left half black", and a reader had nothing to
   * hover. The color still does the fast scanning; the word says which state
   * it is. "Not yet" rather than a dash, because an outcome nobody has started
   * is a real state, not a missing value. */
  var ESS_MARKS = { met: "Met", partial: "Partial", not: "Not yet", na: "n/a" };
  function essMark(o) {
    var g = ESS_MARKS[o.state] || "Pending";
    return '<span class="cb-ess ' + esc(o.state) + '">' + g + "</span>";
  }

  /* PURE. Who MAP currently has on file for this college, so the college can
   * keep it current (Sam, 2026-08-11: "we don't want to withhold user contacts
   * in this view… have a section to show who's currently in the system so they
   * can keep things current"). This is the college's OWN roster shown to the
   * college — the `ctx=external` suppression exists for vendor embeds, and does
   * not apply here.
   *
   * MAP stores several of these as multi-value strings; Moreno Valley's primary
   * contact is literally the same address repeated eleven times. So every value
   * is split, trimmed, de-duplicated case-insensitively and re-joined before it
   * reaches the page — otherwise a 300-character run-on prints where a person's
   * name should be. */
  var CONTACT_ROLES = [
    { k: "primary_contact",     e: "primary_contact_email",     label: "Primary contact", lead: true },
    { k: "cpl_coordinator",     e: "cpl_coordinator_email",     label: "CPL coordinator" },
    { k: "cpl_counselor",       e: "cpl_counselor_email",       label: "CPL counselor" },
    { k: "articulation_officer", e: "articulation_officer_email", label: "Articulation officer" },
    { k: "faculty_lead",        e: "faculty_lead_email",        label: "Faculty lead" },
    { k: "certifying_official", e: "certifying_official_email", label: "Certifying official" },
    { k: "vpaa",                e: "vpaa_email",                label: "VP Academic Affairs" },
    { k: "vpss",                e: "vpss_email",                label: "VP Student Services" }
  ];

  function dedupeValue(v) {
    if (v == null) return null;
    var parts = String(v).split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var seen = {}, out = [];
    parts.forEach(function (x) {
      var k = x.toLowerCase();
      if (seen[k]) return;
      seen[k] = 1; out.push(x);
    });
    return out.length ? out.join(", ") : null;
  }

  function contactRoster(row) {
    if (!row) return null;
    var filled = [], blank = [];
    CONTACT_ROLES.forEach(function (r) {
      var name = dedupeValue(row[r.k]), email = dedupeValue(row[r.e]);
      (name || email ? filled : blank).push({ label: r.label, name: name, email: email, lead: !!r.lead });
    });
    return { filled: filled, blank: blank, landing: row.landing_page_url || null,
             updated: row.last_updated_on || null };
  }

  function standBox(big, of, lab, frac, cls) {
    var w = (frac == null) ? null : Math.max(0, Math.min(1, frac));
    return '<div class="cb-box' + (cls ? " " + cls : "") + '">'
      + '<div><span class="cb-big">' + esc(big) + '</span> <span class="cb-of">' + esc(of) + '</span></div>'
      + (w == null ? "" : '<div class="cb-bar"><i style="width:' + (w * 100).toFixed(1) + '%"></i></div>')
      + '<div class="cb-lab">' + lab + '</div></div>';
  }

  function typeBox(t) {
    var h = '<div class="cb-type"><header><h4>' + esc(t.label) + "</h4>"
      + (t.couldAdoptStatewide ? '<span class="cb-tag sw">' + t.couldAdoptStatewide + " statewide</span>" : "")
      + "</header><div class=\"cb-rows\">";
    h += '<div class="cb-r"><span>You articulate</span><span class="v">' + t.articulated + "</span></div>";
    h += '<div class="cb-r"><span>You could adopt</span><span class="v">' + t.couldAdopt + "</span></div>";
    // A suppressed cell and an absent one are different facts and must not
    // render alike: "fewer than 10" means real students, "none nameable" means
    // we cannot see any.
    var stu = t.students != null && t.students > 0 ? String(t.students)
            : (t.suppressedCells > 0 ? "fewer than 10" : "none nameable");
    h += '<div class="cb-r"><span>Your students <span class="cb-tag">floor</span></span><span class="v">'
       + esc(stu) + "</span></div>";
    h += "</div>";
    if (t.candidates.length) {
      h += '<div class="cb-opp"><span>Top candidates, by peers already doing it:</span>';
      t.candidates.forEach(function (c) {
        h += "<span><em>" + esc(c.title) + "</em> — " + c.peers + " peer college"
           + (c.peers === 1 ? "" : "s") + (c.statewide ? " · statewide standard" : "") + "</span>";
      });
      h += "</div>";
    }
    return h + "</div>";
  }

  /* ── A group view that cannot leak a withheld college ─────────────────────
   * PURE-ish (reads state.data only). District and statewide both land here.
   *
   * ⚠ THE AGGREGATE IS SUMMED OVER THE UNSUPPRESSED ROWS ONLY, AND THAT IS A
   * DISCLOSURE DECISION, NOT A CONVENIENCE. map_college_credit_summary applies
   * k=10 and withholds 13 colleges. If a total included the withheld rows, then
   * for any group the total MINUS the visible rows is exactly the withheld
   * college's figure — and a two-college district would hand it over in one
   * subtraction. Summing only what is already on screen makes that arithmetic
   * return zero by construction. The withheld colleges are COUNTED in the note
   * so the total is never mistaken for the whole group
   * (adr-student-detail-aggregate-disclosure-control).
   *
   * ⚠ And an absent row is not a zero: a college missing from the summary
   * entirely is a dash and is counted separately from a withheld one. Folding
   * the two would turn "we never measured this" into "this college does none". */
  function rollup(group, b) {
    var byName = (state.data && state.data.summaryByName) || {};
    var shownWaiting = 0, shownStudents = 0, withheld = 0, absent = 0, counted = 0;
    var rows = group.slice().sort().map(function (n) {
      var s = byName[n];
      if (!s) { absent++; return { n: n, waiting: "—", stu: "—" }; }
      if (s.suppressed) { withheld++; return { n: n, waiting: "withheld", stu: "&lt;10" }; }
      counted++;
      shownWaiting += num(s.articulated_waiting) || 0;
      shownStudents += num(s.students) || 0;
      return { n: n, waiting: fmt(num(s.articulated_waiting)), stu: fmt(num(s.students)) };
    });

    var title = state.scope === "district" ? state.district : "All colleges";
    var h = '<h3 class="cb-h">' + esc(title) + " — " + group.length
      + (group.length === 1 ? " college" : " colleges") + "</h3>";
    h += '<div class="cb-roll">'
      + '<div class="cb-roll-c"><div class="cb-roll-n">' + fmt(shownWaiting) + "</div>"
      + '<div class="cb-roll-l">units already articulated and waiting</div></div>'
      + '<div class="cb-roll-c"><div class="cb-roll-n">' + fmt(shownStudents) + "</div>"
      + '<div class="cb-roll-l">CPL students</div></div>'
      + '<div class="cb-roll-c"><div class="cb-roll-n">' + counted + " of " + group.length + "</div>"
      + '<div class="cb-roll-l">colleges in these totals</div></div>'
      + "</div>";
    h += '<table class="cb-dist"><colgroup><col style="width:52%"><col style="width:24%"><col style="width:24%"></colgroup>'
      + "<thead><tr><th>College</th><th>Articulated, waiting</th><th>CPL students</th></tr></thead><tbody>"
      + rows.map(function (r) {
          return '<tr><td><button type="button" class="cb-pick" data-college="' + esc(r.n) + '">'
            + esc(r.n) + "</button></td>"
            + '<td class="n">' + r.waiting + '</td><td class="n">' + r.stu + "</td></tr>";
        }).join("")
      + "</tbody></table>";
    h += '<div class="cb-note"><b>The totals above cover the ' + counted + " college"
      + (counted === 1 ? "" : "s") + " listed with figures — nothing else is folded in.</b> "
      + (withheld ? withheld + " college" + (withheld === 1 ? " is" : "s are")
          + " withheld (fewer than 10 CPL students, which is not zero activity) and " +
          (withheld === 1 ? "its figures are" : "their figures are") + " deliberately left out of the "
          + "total, so they cannot be worked out by subtraction. " : "")
      + (absent ? absent + " college" + (absent === 1 ? " is" : "s are")
          + " not in the credit summary at all — a dash is an absent measurement, not a measured zero. " : "")
      + "Pick any college for its full briefing.</div>";
    if (b) {
      h += '<div class="cb-note">Choose a college to see where it stands against the ' + esc(b.strategyTotal)
        + " strategies the team has written for " + esc(b.scenario) + ", Year " + esc(b.year) + ".</div>";
    }
    return h;
  }

  function render(root) {
    ensureCss();
    shedPlaceholder(root);
    if (!signedIn()) {
      // Was: "Sign in with the team phrase to view the college briefing." —
      // true, but it never said WHERE, and four of this tab's tables gate the
      // READ, so the whole briefing was blank with nothing to act on.
      root.innerHTML = '<div class="cb-gate" style="padding:16px 24px;"></div>';
      var gate = root.querySelector(".cb-gate");
      if (window.CPL_TEAM_PHRASE && gate) {
        gate.appendChild(window.CPL_TEAM_PHRASE.lockedBanner({
          what: "The college briefing — contacts, credit summaries and funding —"
        }));
      } else if (gate) {
        // FAIL-SAFE. If the shared helper has not loaded, still say what is
        // locked and where the control is — an empty locked state would be
        // worse than the copy this replaced, which at least named a tab.
        var p = document.createElement("p");
        p.setAttribute("data-tp-locked", "");
        p.textContent = "You are not signed in. Unlock with the team phrase \u2014 the \u{1F512} button in the header.";
        gate.appendChild(p);
      }
      return;
    }
    if (state.loading) { root.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);">Measuring…</div>'; return; }

    var names = (state.data && state.data.colleges) || [];
    var dIdx = districtIndex(names);

    /* ── The two gates before the tab has anything to say ───────────────────
     * Sam, 2026-08-17: the tab opens on the CHOICE, not on a title. Both gates
     * return early with no main title, no Sierra box and no sections — there is
     * nothing yet for any of them to be about. */
    /* A college already chosen IS the college scope. Inferred rather than
     * required, so a deep link, a restored selection or any caller that sets
     * state.college directly lands on the briefing instead of being bounced back
     * to a question it has already answered. */
    if (!state.scope && state.college) state.scope = "college";
    if (!state.scope) { root.innerHTML = scopePicker(); wire(root); return; }
    if (!scopeReady()) { root.innerHTML = entityPicker(names, dIdx); wire(root); return; }

    // Step 3 — the title arrives now that there is something to welcome.
    var h = welcomeHead();

    // ── Sierra AI, first on the tab, holding the pickers ──────────────────
    // Sam, 2026-08-11: the assistant leads and the pickers live inside it.
    //
    // ⚠ THE HEADING AND THE DESCRIPTION LIVE IN THE WIDGET, NOT HERE (Sam,
    // 2026-08-17: "eliminate anything redundant"). This block used to print an
    // <h3>Sierra AI</h3>, a "Answers come from the CPL Initiative records and
    // knowledge base" tag and a four-line purpose paragraph — and then mounted
    // cpl_chat.js directly underneath, which printed its OWN heading and its
    // OWN description. The tab opened with two titles and two descriptions of
    // one assistant. cpl_chat.js build() now carries the single "Sierra AI"
    // heading (with the Whitney mark) and the single description; do not
    // reintroduce one here, or the duplicate comes straight back.
    // The heading slot is hoisted to the TOP of the box and the widget's own
    // intro is moved into it by finish() — the same relocation this file
    // already does with the picker bar, and for the same reason: the markup
    // stays authored in one place while the reading order is the sensible one
    // (title → what she is → pickers → suggestions → the chat itself).
    //
    // It ships with a FALLBACK heading rather than empty, because a failed
    // cpl_chat.js load would otherwise leave the box with no title at all —
    // trading a duplicate heading for a missing one. Exactly one survives:
    // finish() replaces this when, and only when, the real intro arrives.
    // ⚠ SIERRA IS A COLLAPSIBLE SECTION NOW (Sam, 2026-08-17) — expanded by
    // default, and closed by Collapse all like every other. The <summary>
    // carries the SINGLE heading: hoistAssistantIntro() moves the widget's own
    // h2 into it and the description into the body below, so there is still
    // exactly one title for one assistant. Putting the title in the summary and
    // ALSO leaving it in the body is how #1231's duplicate would come back one
    // level up.
    h += '<section class="cb-assist" aria-label="Sierra AI">'
      + '<details class="cb-sec cb-assist-d" data-sec="sierra"' + (state.open.sierra ? " open" : "") + ">"
      + '<summary class="cb-sum" id="cb-assist-sum"><h2 class="cb-assist-fallback">Sierra AI</h2></summary>'
      + '<div class="cb-assist-body">'
      + '<div class="cb-assist-head" id="cb-assist-head"></div>'
      + '<div class="cb-assist-pick" id="cb-assist-pick"></div>'
      /* ⚠ THE SUGGESTED QUESTIONS ARE NO LONGER PRINTED HERE (Sam, 2026-08-21:
       * "My College users select a pre-seeded question and are not prompted for
       * their role — confusing").
       *
       * There were TWO question clusters and the role picker sat between them:
       * this one above the widget, and the widget's own generic starters below
       * its "I'm a…" chips. Clicking one of these with no role chosen called the
       * widget's needAudience(), whose message reads "tap who you are above" —
       * and the chips were BELOW. The sentence was wrong and the reader had two
       * lists to reconcile.
       *
       * They now go to the widget via CPL_CHAT.setSuggestions() (see finish()),
       * which renders ONE cluster in its own slot UNDER the role chips. That
       * also replaces the generic starters, one of which names Riverside City
       * College — fine on the CPL Assistant tab, nonsense on Cabrillo's page. */
      + '<div class="cb-assist-mount" id="cb-assistant-mount"></div>'
      + "</div></details></section>";

    if (state.error) h += '<div class="cb-warn">Could not load everything: ' + esc(state.error) + ". Figures below may be incomplete — treat a missing number as unknown, not zero.</div>";

    var b = state.data && state.data.briefing;
    if (!b) { finish(root, h); return; }

    if (b.unread && b.unread.length) {
      h += '<div class="cb-warn"><b>' + b.unread.length + " funding program" + (b.unread.length === 1 ? "" : "s") + " not read.</b><ul style=\"margin:6px 0 0 18px;\">" +
        b.unread.map(function (u) { return "<li>" + esc(u.label || u.id) + " — " + esc(u.why) + "</li>"; }).join("") +
        "</ul></div>";
    }

    // ── The roll-up views: district and statewide ──────────────────────────
    // scopeReady() has already passed, so reaching here with no college means
    // the reader chose a GROUP. Ordered ALPHABETICALLY, never by the figure:
    // this is a list of work to do, not a league table (and Sam's standing rule
    // is that colleges are never publicly ranked).
    if (!state.college) {
      var group = state.scope === "district" ? (dIdx && dIdx[state.district]) || [] : names;
      h += rollup(group, b);
      finish(root, h); return;
    }

    if (b.leads.length) {
      var leadBody = "";
      b.leads.forEach(function (l) {
        leadBody += '<div class="cb-lead"><h4>' + esc(l.item.text) + '</h4><div class="cb-num">' + esc(l.item.measure.headline) + "</div>" +
          (l.item.measure.detail ? '<div class="cb-d">' + esc(l.item.measure.detail) + "</div>" : "") + "</div>";
      });
      // The summary carries the single biggest thing, so the closed row is
      // still the answer to "what should I do?".
      h += sec("start", "Start here", esc(b.leads[0].item.measure.headline), leadBody);
    }

    // ── Your funding ──────────────────────────────────────────────────────
    // Two appropriations, kept visibly apart. Neither figure is derived here.
    var f = fundingFor(state.college);
    // The program whose priorities the funding box describes. _prios() (in
    // cpl_funding.js) and collectPrograms() (here) walk the SAME ordered
    // priority set out of the SAME config, so position joins them — but
    // ASSERT that rather than assume it. Attaching one priority's strategies
    // to another priority's money is the bad failure here, so a disagreement
    // falls back to the standalone list instead.
    var implProg = null;
    b.programs.forEach(function (p) { if (p.id === IMPL_PROJECT) implProg = p; });
    var stratsInline = implProg && f && prioritiesAlign(f.prios, implProg);
    var fundBody = "";
    if (state.funding !== "ready" && state.funding !== "error") {
      fundBody += '<div class="cb-note">Loading the funding model…</div>';
    } else if (state.funding === "ready" && !f) {
      fundBody += '<div class="cb-note">Loading the funding model…</div>';
    } else if (state.funding === "error") {
      fundBody += '<div class="cb-warn">The funding model did not load. That is a <b>failed read, not a finding</b> — '
        + "it does not mean this college has no allocation.</div>";
    } else if (f && !f.onRoster) {
      fundBody += '<div class="cb-note">' + esc(state.college) + ' is not on the 115-college funding roster. '
        + "The noncredit institutions are funded through the $1M noncredit carve-out, a separate mechanism from the "
        + "college pool below — so this is <b>a different route to money, not an absence of it</b>.</div>";
    } else if (f) {
      // (a) the $50,000 ESS 25-82 seed grant — already distributed
      fundBody += '<div class="cb-fund">';
      fundBody += '<div class="cb-fbox"><header><h4>2025&ndash;2026 $50K Seed Funding</h4><span class="cb-tag">ESS 25-82 · distributed Spring 2026</span></header>';
      if (f.grant.declined) {
        fundBody += '<div class="cb-fbig">Declined</div><div class="cb-lab">This college declined the grant pending further review. '
          + "That is a decision on record, not a missed payment.</div>";
      } else {
        fundBody += '<div class="cb-fbig">' + money(f.grant.amount) + "</div>"
          + '<div class="cb-lab">Received. Must be fully expended by <b>June 30, 2028</b>. '
          + "It was directed at the three priority outcomes below — progress on them is tracked through MAP, "
          + "as ESS 25-82 specifies. <b>These are not a compliance determination.</b></div>";
      }
      var ess = essProgress(f, state.detail, window.CPL_FUNDING_ESS);
      if (ess) {
        fundBody += '<ol class="cb-ess-list">';
        ess.forEach(function (e) {
          fundBody += "<li>" + essMark(e.o) + "<div><b>" + esc(e.title) + "</b>";
          if (e.frac && e.frac.have != null) {
            fundBody += '<div class="cb-num">' + e.frac.have + " articulated"
              + (e.frac.of ? " of the " + e.frac.of + " statewide credit recommendations in MAP" : "")
              + (e.frac.available ? " · <b>" + e.frac.available + " more</b> available to adopt" : "")
              + "</div>";
          }
          fundBody += '<div class="cb-d">' + esc(e.o.why) + "</div>";
          if (e.next) fundBody += '<div class="cb-d">' + e.next + "</div>";
          fundBody += "</div></li>";
        });
        fundBody += "</ol>";
      }
      fundBody += "</div>";

      // (b) this college's share of the implementation pool. Sam, 2026-08-11:
      // use the funding tab's own names — "$35M" is his shorthand with the
      // session, not a label a college would recognize.
      fundBody += '<div class="cb-fbox"><header><h4>2026&ndash;2028 College Implementation Funding</h4><span class="cb-tag">allocation cap</span></header>';
      if (!f.alloc) {
        fundBody += '<div class="cb-lab">No allocation modelled for this college yet.</div>';
      } else {
        fundBody += '<div class="cb-fbig">' + money(f.alloc.total) + "</div>";
        // Sam's 2026-08-22 ruling retired the old negative framing here: state
        // positively what drives the money. It also collided with the model's
        // new $400K MAXIMUM, which is now literally a cap — two different
        // meanings of one word, in adjacent sentences. (The retired phrase is
        // deliberately not quoted anywhere in this file: the test greps the
        // SOURCE, so a comment quoting it would fail the guard it explains.)
        fundBody += '<div class="cb-lab">What this college receives is driven by <b>its own CPL results, as they happen</b> — '
          + "it earns against this figure on what MAP records it doing. It is modelled, and the model is under "
          + "active revision.</div>";
        var bits = [];
        if (f.alloc.floored) {
          bits.push("At the <b>" + money(f.floor) + " minimum-viable floor</b> — this college's proportional share came "
            + "out below the floor, so it is topped up to it. Its allocation is <b>not</b> its share of the pool.");
        }
        // The floor's mirror image. Say where the difference WENT, not just
        // that the college lost it — the same reason the funding explainer
        // names the beneficiary of every amount it shows.
        if (f.alloc.capped && f.cap) {
          bits.push("At the <b>" + money(f.cap) + " maximum allocation</b> — this college's proportional share came "
            + "out above the maximum, so it is held there and the difference re-splits across the other colleges. "
            + "Its performance targets scale down with it, so it earns at the same rate as every other college "
            + "above the minimum.");
        }
        if (f.alloc.rural_w) {
          bits.push("Includes <b>" + money(f.alloc.rural_w) + "</b> of guaranteed rural allowance, which is not performance-gated.");
        }
        if (f.alloc.gate_blocked) {
          bits.push("<b>Participation requirements are outstanding</b>" +
            (f.alloc.gate_missing && f.alloc.gate_missing.length ? " — " + esc(f.alloc.gate_missing.join(" and ")) : "") +
            ". The cap is unchanged and the dollars roll forward; nothing is lost by fixing it late, but nothing is earned until it is.");
        } else if (f.alloc.gate_pending) {
          bits.push("Participation is recorded but not yet confirmed.");
        }
        if (bits.length) fundBody += '<ul class="cb-flags"><li>' + bits.join("</li><li>") + "</li></ul>";

        // ── What the cap is FOR — the three priorities, each with this
        // college's own target. Caps and targets both come from the funding
        // module; nothing here multiplies a share by a pool.
        if (f.prios && f.prios.length) {
          fundBody += '<div class="cb-prios"><div class="cb-plab">What it is earned against</div>';
          f.prios.forEach(function (p, i) {
            var name = p.title || p.description || p.label;
            fundBody += '<div class="cb-prow"><div class="cb-whead"><b>' + esc(name) + "</b>"
              + '<span class="v">' + money(p.cap) + "</span></div>";
            fundBody += '<div class="cb-ptarget">Your target: <b>'
              + (p.target != null ? fmt(Math.round(p.target * 10) / 10) + " " + esc(p.unit) : "—")
              + "</b>" + (p.metric ? " · " + esc(p.metric) : "") + "</div>";
            // The team's steps for THIS pool, nested under the money they
            // earn (Sam, 2026-08-12). As one flat list of 22 they read as an
            // intimidating audit; six to ten attached to a priority read as
            // advice about that priority.
            var progPrio = stratsInline ? programPriorityFor(implProg, p, i) : null;
            if (progPrio) fundBody += stratHtml(progPrio.items, null);
            fundBody += "</div>";
          });
          fundBody += "</div>";
          fundBody += '<div class="cb-lab" style="margin-top:8px;">A target is what earns the <b>whole</b> share, not a '
            + "pass mark — partial progress earns a proportional part of it, so there is no cliff to miss.</div>";
        }
      }
      fundBody += "</div></div>";

      // ── Do this next, per pool ──────────────────────────────────────────
      // The steps come from the team's own strategies, not from this page.
      var nextSeed = nextEssOutcome(ess);
      var nextImpl = topStrategy(b);
      if (nextSeed || nextImpl) {
        fundBody += '<div class="cb-next"><div class="cb-plab">Do this next</div><ul>';
        if (nextSeed) {
          fundBody += "<li><b>For the seed funding:</b> " + esc(nextSeed.title)
            + " — the outcome with the most ground still to cover.</li>";
        }
        if (nextImpl) {
          fundBody += "<li><b>For the implementation funding:</b> " + esc(nextImpl.text)
            + " — the team's first strategy under " + esc(nextImpl.priority) + ".</li>";
        }
        fundBody += "</ul></div>";
      }

      fundBody += '<div class="cb-note">Both figures come from the Implementation Funding tab\'s model, not from this page — '
        + "open it for the full derivation and the year split.</div>";
    }
    // Summary: the two appropriations, so the shut row still answers "what
    // money is on the table?". EVERY branch says something — a blank summary
    // on a money section reads as broken, and "not loaded" and "nothing" are
    // different claims.
    var fundSum = "";
    if (state.funding === "error") fundSum = "not loaded";
    else if (state.funding !== "ready" || (state.funding === "ready" && !f)) fundSum = "loading…";
    else if (f && !f.onRoster) fundSum = "noncredit carve-out";
    else if (f) {
      if (f.grant) fundSum = f.grant.declined ? "seed declined" : money(f.grant.amount) + " seed";
      if (f.alloc) fundSum += (fundSum ? " · " : "") + money(f.alloc.total) + " cap";
    }
    h += sec("funding", "My CPL Funding", esc(fundSum), fundBody);

    // ── Where you stand ───────────────────────────────────────────────────
    // Every figure carries its denominator. Nothing here can reach 100% and
    // stop: the fractions are over the OPPORTUNITY, not over what was already
    // done.
    var summary = state.data && state.data.summaryByName && state.data.summaryByName[state.college];
    var st = standing(summary, state.detail);
    if (state.detailLoading) {
      h += '<div class="cb-note">Measuring this college…</div>';
    } else if (state.detailError) {
      h += '<div class="cb-warn">Could not read this college\'s detail: ' + esc(state.detailError)
        + '. That is a <b>failed read, not an empty result</b> — nothing below should be taken as "this college has none".</div>';
    }
    // ── Your tier, with the criteria named ────────────────────────────────
    // "Advancing" on its own is a verdict with no next step, and 77% of
    // colleges are in that bucket. Naming the five turns it into a checklist.
    var ts = tierStanding(state.live, state.college);
    if (ts) {
      // Prose, not a checklist (Sam, 2026-08-11). The three tiers are named in
      // the header so the label means something before the reader gets to it —
      // "Advancing" alone is a verdict from an unstated scheme.
      var tierBody = "";
      tierBody += '<div class="cb-note" style="margin-top:-4px">Every college is placed in one of three tiers by the same '
        + "five criteria: <b>Leading</b> meets three or more, <b>Advancing</b> one or two, <b>Inactive</b> has "
        + "essentially no CPL recorded. The five count students, eligible units, units per student, and how much "
        + "of that credit is <b>marked transcribed in MAP</b>.</div>";
      tierBody += '<div class="cb-tier">';
      if (ts.mismatch) {
        tierBody += "<p><b>" + esc(ts.label) + "</b> — " + ts.met + " of " + ts.total + " criteria met. The individual "
          + "criteria do not reconcile with that published count here, because the transcription rate is "
          + "published rounded and a borderline college can fall either side of it. Rather than show you a list "
          + "that disagrees with the figure above it, we are holding the list back.</p>";
      } else if (ts.tier === "inactive") {
        tierBody += "<p><b>Inactive</b> is assigned when a college has almost no CPL recorded in MAP at all — fewer than "
          + "ten students and no eligible units — rather than by counting the five criteria. It reflects what has "
          + "been <b>recorded</b>, so if CPL is happening here it is not reaching MAP, and that is the thing to "
          + "fix first.</p>";
      } else {
        var mets = ts.met_list, miss = ts.missing;
        tierBody += "<p><b>" + esc(ts.label) + "</b> — ";
        if (mets.length) {
          tierBody += "you meet <b>" + ts.met + " of the " + ts.total + "</b> criteria: "
            + mets.map(function (c) {
                return "at least " + esc(c.short) + " <em>(you: " + esc(c.actual) + ")</em>"; }).join("; ");
        } else {
          // "you meet 0 of the 5" is arithmetic, not a sentence.
          tierBody += "you do not yet meet any of the five";
        }
        tierBody += ".</p>";
        if (miss.length) {
          tierBody += "<p>" + (miss.length === 1 ? "The one you have not reached" : "The " + miss.length
              + " you have not reached, <b>closest first</b>") + ": "
            + miss.map(function (c) {
                return "at least " + esc(c.short) + " <em>(you: " + esc(c.actual) + ")</em>"; }).join("; ")
            + ".</p>";
        } else {
          tierBody += "<p>There is nothing left to reach on this scale — you meet all five.</p>";
        }
      }
      tierBody += "</div>";
      tierBody += '<div class="cb-note" style="margin-top:10px">Two things to hold alongside it. <b>Three of the five are '
        + "size measures</b>, so a small college cannot reach them however well it runs CPL — that is a limit of "
        + "the scheme, not a judgment on you. And the other two count units <b>marked transcribed in MAP</b>, "
        + "which is your own step and entirely within your control — but it also means colleges that batch-upload "
        + "already-posted credit (AP, IB, CLEP) score on them for reasons unrelated to how much CPL they award. "
        + "<b>So it measures you against the same five benchmarks as every other college — "
        + "never against any particular one, and never as a league table.</b></div>";
      // Inactive is assigned by ABSENCE of recorded activity, not by counting
      // the five — so it never carries a score, here or in the body.
      h += sec("tier", "Statewide CPL Benchmarks",
        esc(ts.label) + (ts.tier === "inactive" ? "" : " — " + ts.met + " of " + ts.total + " criteria"),
        tierBody);
    }

    if (st && st.eligible != null) {
      var pctApplied = st.eligible > 0 && st.applied != null ? (st.applied / st.eligible) : null;
      var standBody = '<div class="cb-stand">';
      standBody += standBox(fmt(st.articulatedWaiting), "of " + fmt(st.eligible) + " units",
        "<b>Already articulated, waiting on a decision.</b> The agreement exists and the credit is mapped — only the award is missing. This is the cheapest credit you will ever give a student.",
        st.eligible > 0 ? (st.articulatedWaiting || 0) / st.eligible : 0, "lead");
      standBody += standBox(fmt(st.applied), "units applied",
        "Credit you have put on a student record — the measure the funding formula rewards.",
        pctApplied, "");
      standBody += standBox(fmt(st.transcribed), "units marked transcribed",
        "Marked as transcribed <b>in MAP</b> — your record-keeping step, not the posting itself. You forward the "
        + "student's CPL plan to Admissions &amp; Records, who enter the credit in your own student system; there is "
        + "no automatic link between MAP and that system. <b>Never compare this across colleges</b> — some batch-upload "
        + "credit that was already posted (AP/IB/CLEP), so it reflects record-keeping practice as much as outcomes.",
        st.eligible > 0 && st.transcribed != null ? st.transcribed / st.eligible : null, "");
      standBody += standBox(fmt(st.students), "CPL students",
        "Students at this college with prior learning in MAP. Their credit is what every number here is made of.",
        null, "");
      standBody += "</div>";
      h += sec("stand", "Where you stand",
        fmt(st.articulatedWaiting) + " units waiting · " + fmt(st.students) + " CPL students", standBody);
    } else if (summary && summary.suppressed) {
      h += '<div class="cb-note">This college has fewer than 10 CPL students, so its figures are withheld. '
        + 'Activity exists — the numbers are not published at that size, to protect student privacy.</div>';
    }

    // ── What the waiting credit is ────────────────────────────────────────
    // Explains the lead figure directly above it. Placed here, not lower down,
    // because "63,991 units already articulated" invites a coordinator to
    // imagine 300 judgment calls when it is very nearly one repeated decision.
    var wb = waitingBreakdown(state.detail, summary);
    var waitBody = "", waitSum = "";
    if (wb && !wb.suppressed && !wb.empty && !wb.unmeasured) {
      waitSum = fmt(Math.round(wb.total)) + " units"
        + (wb.militaryShare >= 1 ? " · all basic military service" : "");
      waitBody += '<div class="cb-note" style="margin-top:0">These add up to the <b>' + fmt(Math.round(wb.total))
        + " units</b> in the first box above — same credit, broken out by what it would count toward.</div>";
      waitBody += '<div class="cb-wait">';
      wb.groups.forEach(function (g) {
        var p = safePct(g.share, 1);
        waitBody += '<div class="cb-wrow"><div class="cb-whead"><b>' + esc(g.label) + "</b>"
          + '<span class="v">' + fmt(Math.round(g.units)) + " units · " + p + "%</span></div>"
          + '<div class="cb-bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>';
        if (g.top.length) {
          waitBody += '<div class="cb-wrecs">Counts toward: '
            + g.top.map(function (t) {
                return esc(t.name) + " <span>(" + fmt(Math.round(t.units)) + ")</span>"; }).join(" · ")
            + "</div>";
        }
        waitBody += "</div>";
      });
      waitBody += "</div>";
      if (wb.militaryShare >= 0.6) {
        var allMil = wb.militaryShare >= 1;
        waitBody += '<div class="cb-note cb-good"><b>' + (allMil ? "All" : safePct(wb.militaryShare) + "%")
          + " of it is credit for basic military service.</b> That is the good news on this page: it is not "
          + "hundreds of separate judgment calls, it is " + (allMil ? "" : "close to ")
          + "<b>one decision applied repeatedly</b> — you have "
          + "already articulated the exhibit, and every one of these students has a DD-214 or JST on file. "
          + "Statewide the pattern is the same: <b>98.8%</b> of all waiting credit is basic military service, and "
          + "65 of the 73 colleges with any are at 100%.</div>";
      }
    } else if (wb && wb.suppressed) {
      waitSum = "withheld";
      waitBody += '<div class="cb-note" style="margin-top:0">Withheld — this college has fewer than 10 CPL students, so its '
        + "figures are not published at that size. Breaking a withheld total into its parts would give back exactly "
        + "what withholding it removed.</div>";
    } else if (wb && wb.unmeasured) {
      waitSum = "no figures held";
      waitBody += '<div class="cb-note" style="margin-top:0"><b>We hold no credit figures for this college.</b> It is not '
        + "in the credit summary at all, so there is nothing here to break down — and that is an <b>absent "
        + "measurement, not a finished queue</b>. If CPL is happening here, it is not reaching MAP, which is the "
        + "thing to fix first.</div>";
    } else if (wb && wb.empty) {
      waitSum = "nothing waiting";
      waitBody += '<div class="cb-note" style="margin-top:0"><b>Nothing is waiting.</b> Every credit recommendation with an '
        + "articulated exhibit behind it has been acted on. That is a finished queue, not a missing measurement — "
        + "33 of the 106 colleges are in this position, including some of the largest CPL programs in the state.</div>";
    }

    h += sec("waiting", "What that waiting credit actually is", waitSum, waitBody);

    // ── By CPL type ───────────────────────────────────────────────────────
    var types = byCplType(state.detail);
    if (types) {
      var typeBody = '<div class="cb-note cb-floor"><b>Read the student counts carefully.</b> A credential name can be '
        + 'attached to only about 4% of student records statewide, so a low count here means <b>we cannot see it</b>, '
        + 'not that the program is inactive. The credential counts beside them come from the curated catalog and '
        + 'are complete.</div>';
      typeBody += '<div class="cb-types">';
      types.forEach(function (t) { typeBody += typeBox(t); });
      typeBody += "</div>";
      var nAd = 0, nOpp = 0;
      types.forEach(function (t) { nAd += (t.articulated || 0); nOpp += (t.couldAdopt || 0); });
      h += sec("types", "By CPL type",
        fmt(nAd) + " articulated · " + fmt(nOpp) + " you could adopt", typeBody);
    }


    // ── Course share — absorbed from the retired Course Credit tab ────────
    var cs = courseShare(state.detail && state.detail.goal2);
    if (cs) {
      var csBody = "";
      if (cs.share == null) {
        csBody += '<div class="cb-note">Some cells are withheld for this college, so the course share is not published — '
          + 'publishing it alongside a hidden cell would hand back what suppression removed.</div>';
      } else {
        csBody += '<div class="cb-note"><b>' + (Math.round(cs.share * 1000) / 10).toFixed(1) + '%</b> of the credit this '
          + 'college has <b>already awarded</b> landed on a real course rather than a generic elective or a GE area — '
          + 'across ' + fmt(cs.awarded) + ' awarded rows.'
          + (st && st.eligible != null
              ? ' It says nothing about the <b>' + fmt(st.eligible) + ' units still waiting</b>, which is the number to act on.'
              : '')
          + (cs.share >= 1 ? ' <b>100% here does not mean finished</b> — it means everything awarded so far went to a course.' : '')
          + "</div>";
      }
      h += sec("courseshare", "Of the credit you have already awarded",
        cs.share == null ? "withheld" : safePct(cs.share, 1) + "% to a real course", csBody);
    }

    // ── Advice — only for programs NOT already nested in the funding box ──
    // The implementation strategies now live inside the priority they earn
    // against (Sam, 2026-08-12). Anything else the team adds to the config
    // still gets its own section here, so guarantee (c) — every project is
    // walked, a new program appears with no code change — survives the move.
    var restPrograms = b.programs.filter(function (p) {
      return !(stratsInline && p.id === IMPL_PROJECT);
    });
    if (restPrograms.length) {
      var advBody = '<div class="cb-note" style="margin-top:0">These are written by the team, not by this page. '
        + "They are advice; the ones we can measure for this college carry a figure.</div>";
      var advCount = 0;
      restPrograms.forEach(function (p) {
        advCount += p.strategyCount;
        advBody += '<div class="cb-prog"><h3>' + esc(p.label) + "</h3>";
        p.priorities.forEach(function (pr) {
          // The pot share is deliberately NOT shown. "50% of the pot" is state
          // allocation logic — true, and nothing a coordinator can act on. Sam,
          // 2026-08-10: "we tend to get buried in rationale rather than just
          // telling them the simple steps."
          advBody += '<div class="cb-pri"><h4>' + esc(pr.title || pr.description || "Priority " + (pr.index + 1)) + "</h4>";
          advBody += '<div class="cb-meta">' + [pr.metric ? "Measured as: " + esc(pr.metric) : null].filter(Boolean).join(" · ");
          if (pr.title && pr.description) advBody += "<br>" + esc(pr.description);
          advBody += "</div>";
          pr.items.forEach(function (i) { advBody += itemHtml(i); });
          advBody += "</div>";
        });
        advBody += "</div>";
      });
      h += sec("advice", "Advice from the team's funding plan",
        esc(advCount + (advCount === 1 ? " step" : " steps")), advBody);
    }

    // ── Current MAP Users and Contacts ─────────────────────────────────────
    var roster = contactRoster(state.data && state.data.raw && state.data.raw.contactRowByName
      && state.data.raw.contactRowByName[state.college]);
    if (roster) {
      var contactBody = "";
      contactBody += '<div class="cb-note" style="margin-top:0">This is what MAP shows today. <b>The primary contact is where a '
        + "student's CPL request from your landing page is sent</b> — if that is wrong, the request reaches nobody. "
        + "Update these in MAP; this page reflects whatever is there.</div>";
      contactBody += '<table class="cb-dist cb-roster"><colgroup><col style="width:30%"><col style="width:31%"><col style="width:39%"></colgroup>'
        + "<thead><tr><th>Role</th><th>Name</th><th>Email</th></tr></thead><tbody>";
      roster.filled.forEach(function (r) {
        contactBody += "<tr" + (r.lead ? ' class="lead"' : "") + "><td>" + esc(r.label) + "</td><td>"
          + esc(r.name || "—") + "</td><td>" + esc(r.email || "—") + "</td></tr>";
      });
      contactBody += "</tbody></table>";
      if (roster.blank.length) {
        contactBody += '<div class="cb-note">Not filled in: <b>'
          + roster.blank.map(function (r) { return esc(r.label); }).join("</b>, <b>") + "</b>. "
          + "Blank is not a problem in itself — but a blank primary contact means student requests have nowhere to land.</div>";
      }
      if (roster.landing) {
        contactBody += '<div class="cb-note">Your CPL landing page: <a href="' + esc(roster.landing)
          + '" target="_blank" rel="noopener">' + esc(roster.landing) + "</a></div>";
      }
      var nFilled = roster.filled.length, nAll = nFilled + roster.blank.length;
      h += sec("contacts", "Current MAP Users and Contacts",
        esc(nFilled + " of " + nAll + " roles filled"), contactBody);
    }

    h += sec("resources", "Resources", esc(RESOURCES.length + " links"), resourcesHtml(true));

    h += '<div class="cb-note">Nothing here is irreversible, and a recommendation ruled Not Applicable can be revisited — '
      + 'ruling one is real work, not a failure. Strategies come from the team’s funding configuration ('
      + esc(b.scenario) + ", Year " + esc(b.year) + "); edit them there and they change here. "
      + "Student figures are withheld below 10 CPL students, to protect student privacy.</div>";

    finish(root, h);
  }

  /* Every exit path from render() goes through here, so the Sierra AI box is
   * assembled once: pickers relocated into it, suggested questions built from
   * this college's own figures, and the shared assistant mounted. */
  /* ⚠ `st` (this college's standing figures) USED to be threaded in here for the
   * suggested questions and is deliberately gone: three of the four call sites
   * passed null for it, so the "units already waiting" question only ever
   * appeared on one path. setAssistantQuestions() derives it from the same two
   * inputs render() uses, via standingFor(). */
  function finish(root, h) {
    root.innerHTML = h;
    // The pickers move INSIDE the Sierra AI box (Sam: "put all the college
    // selectors in the CPL Assistant box for simplicity"). They are built in
    // the main string, then relocated, so the bar markup stays in one place.
    /* ⚠ `.cb-bar-pick`, NOT `.cb-bar`. This used to grab the first `.cb-bar` in
     * document order, which worked only because the PICKER bar was authored
     * first. The pickers moved to the scope flow's second step (Sam,
     * 2026-08-17), so the first `.cb-bar` in the briefing view is now one of the
     * waiting breakdown's progress bars — and this would have silently torn it
     * out of its table and dropped it into the Sierra box. A positional
     * selector is a bound on the order things happen to be written in.
     * Nothing matches in either step today (step 2 has the bar but no host,
     * step 3 has the host but no bar); the relocation is kept, correctly
     * targeted, so a future layout that does put pickers in the box works. */
    var pickHost = root.querySelector("#cb-assist-pick"), bar = root.querySelector(".cb-bar-pick");
    if (pickHost && bar) pickHost.appendChild(bar);
    /* ⚠ setAssistantQuestions AFTER mountAssistant, NEVER BEFORE: setSuggestions
     * paints into the row build() creates, so handing the list over first would
     * store it and show nothing until the next render. Ordering, not taste.
     *
     * ⚠ AND A WIDGET THAT DID NOT MOUNT MUST NOT SILENTLY COST THE QUESTIONS.
     * Moving them into the assistant means the assistant is now the only thing
     * that can show them — so the no-widget path renders the old cluster, wired
     * to askSierra(), which stashes the question and navigates to the full tab.
     * This file's rule 2: a thing we could not read is NAMED, not skipped. */
    /* ⚠ THE FALLBACK IS GATED ON THE QUESTIONS LANDING, NOT ON THE MOUNT. A
     * chat module that mounts but predates setSuggestions() would otherwise
     * take the mounted branch and show no questions at all — the silent loss
     * this fallback exists to prevent, reintroduced by the gate itself. */
    /* ⚠ SCOPE BEFORE QUESTIONS, AND UNCONDITIONALLY. The `||` below
     * short-circuits, so anything chained onto it is skipped whenever the mount
     * fails — and the scope is the one hand-off that must land on every path,
     * because it is also what DROPS a thread left over from the previous
     * subject. Chaining it would mean a failed mount silently kept RCCD's
     * conversation alive under LACCD's heading, which is the defect itself. */
    var mounted = mountAssistant(root);
    setAssistantScope();
    if (!mounted || !setAssistantQuestions()) fallbackAsks(root);
    hoistAssistantIntro(root);
    wire(root);
  }

  /* The widget's heading + description belong at the TOP of the box, but the
   * widget mounts at the bottom of it (below the pickers and the suggested
   * questions). Rather than fork the intro markup into this file — which is how
   * the tab ended up with two headings and two descriptions in the first place
   * — the real one is MOVED, and this file's fallback heading is dropped only
   * once the move has succeeded.
   *
   * ⚠ Exactly one heading, in every path:
   *   · widget mounted   → its intro is hoisted, the fallback is removed;
   *   · widget missing   → the fallback stays and is the only title;
   *   · re-render        → render() rewrote innerHTML, so this runs from a
   *                        clean box every time and cannot stack copies. */
  /* Sierra became a <details> (Sam, 2026-08-17), which SPLITS the hoist in two:
   * the widget's heading goes into the <summary> — so the section still names
   * itself when collapsed, which is the whole point of a summary — and the rest
   * of its intro goes into the body. Still exactly one title in every path:
   *   · widget mounted → its h2 replaces the fallback IN the summary;
   *   · widget missing → the fallback stays in the summary and is the only one;
   *   · re-render      → render() rewrote innerHTML, so this always starts clean.
   * The description must NOT ride along into the summary: a summary is the
   * collapsed state, and a paragraph there is text you cannot put away. */
  function hoistAssistantIntro(root) {
    var head = root && root.querySelector("#cb-assist-head");
    var sum = root && root.querySelector("#cb-assist-sum");
    var intro = root && root.querySelector("#cb-assistant-mount .cplchat-intro");
    if (!head || !intro) return false;
    var h = intro.querySelector("h1, h2, h3");
    if (h && sum) { sum.textContent = ""; sum.appendChild(h); }   // drops the fallback
    head.textContent = "";
    head.appendChild(intro);        // now description-only, the heading having moved
    return true;
  }

  function selectCollege(name, root) {
    state.college = name || null;
    state.detail = null; state.detailFor = null; state.detailError = null;
    rememberScope();
    recompute(); render(root);
    if (state.college) {
      loadCollege(state.college, root);
      loadFunding(root);
    }
  }

  /* ── The tab ALWAYS asks first (Sam, 2026-08-21) ───────────────────────────
   * "It opens on Cabrillo College now and should rather prompt for a location
   * before populating."
   *
   * ⭐ THE REMEMBERED CHOICE IS NOW A SHORTCUT, NOT A DESTINATION. It used to
   * be restored straight into `state`, so the tab opened already populated for
   * whichever college was last looked at — which is wrong twice over: a shared
   * screen or a second person's turn silently shows someone else's college, and
   * a reader who wants a different one has to notice they are on the wrong page
   * before they can leave it. Opening on the question costs one click and can
   * never show the wrong college.
   *
   * The convenience the old behavior bought is kept explicitly: the scope
   * question carries a "Last time you looked at X — open it again" button, so
   * the daily flow is still one click, but it is a click the reader MAKES
   * rather than one the tab makes for them.
   *
   * `state.remembered` is deliberately a separate field. Nothing downstream
   * reads it; only the picker does, and only to offer the shortcut. Wrapped
   * because storage can be unavailable. */
  function rememberScope() {
    try {
      localStorage.setItem(SCOPE_KEY, JSON.stringify({
        scope: state.scope, college: state.college, district: state.district
      }));
    } catch (e) { /* in-memory only */ }
  }
  function restoreScope() {
    try {
      var r = JSON.parse(localStorage.getItem(SCOPE_KEY) || "null");
      if (!r || !r.scope) return;
      // Only offer a scope that is still READY. A remembered "swp" from a
      // future build must not become a shortcut that lands on a blank screen.
      var known = SCOPES.filter(function (s) { return s.k === r.scope && s.ready; });
      if (!known.length) return;
      // A scope that needs an entity is only a usable shortcut once it HAS one;
      // "open it again" that lands on a second question is not a shortcut.
      if (scopeNeedsEntity(r.scope)
          && !(r.scope === "college" ? r.college : r.district)) return;
      state.remembered = {
        scope: r.scope,
        college: r.scope === "college" ? (r.college || null) : null,
        district: r.scope === "district" ? (r.district || "") : ""
      };
    } catch (e) { /* ignore */ }
  }

  /* PURE. What the remembered choice is called, for the shortcut's label.
   * Returns "" when there is nothing worth offering, so the caller renders
   * nothing rather than a button with a blank name. */
  function rememberedLabel() {
    var r = state.remembered;
    if (!r) return "";
    if (r.scope === "college") return r.college || "";
    if (r.scope === "district") return (r.district || "").replace(/ Community College District$/, " CCD");
    if (r.scope === "statewide") return "the statewide view";
    return "";
  }

  /* Take the shortcut: restore the remembered choice into live state and load.
   * Everything the normal path does, in the order the normal path does it. */
  function resumeRemembered(root) {
    var r = state.remembered;
    if (!r) return;
    state.scope = r.scope;
    state.college = r.college || null;
    state.district = r.district || "";
    state.detail = null; state.detailFor = null; state.detailError = null;
    rememberScope();
    recompute(); render(root);
    // Same loads the normal path does, and no others: setScope() pulls nothing
    // for a group scope, so neither does the shortcut into one.
    if (state.college) { loadCollege(state.college, root); loadFunding(root); }
  }

  function setScope(k, root) {
    state.scope = k || null;
    // Clear the entity when the scope changes — a college left selected under
    // the district scope would silently decide what the district view showed.
    if (k !== "college") { state.college = null; state.detail = null; state.detailFor = null; }
    if (k !== "district") state.district = "";
    rememberScope();
    recompute(); render(root);
  }

  function setAllSections(open, root) {
    SECTION_IDS.forEach(function (id) { state.open[id] = !!open; });
    render(root);
  }

  /* ── The briefing (Sam, 2026-08-17: "a Report button that creates a briefing";
   *    then, the same day: "Briefing should be docx") ───────────────────────
   *
   * ⭐ READ FROM THE RENDERED DOM, NEVER RE-DERIVE. Every figure in the document
   * is lifted from the section the reader just looked at. A generator that
   * recomputed them would be a SECOND implementation of the tab's arithmetic —
   * the thing the EACR matrix's shared matrixCell() exists to prevent — and the
   * two would eventually disagree, with the document being the copy that leaves
   * the building. It also means the disclosure control comes along for free: a
   * withheld college reads "withheld" on screen, so it reads "withheld" here,
   * and the roll-up total is the same unsuppressed-only sum. Nothing in this
   * function knows what k-anonymity is, and it cannot leak what the tab does not
   * already show.
   *
   * ⚠ A CLOSED SECTION IS STILL IN THE DOM. This reads `details` content
   * regardless of open state, which is why — unlike the print route it replaced
   * — it does NOT have to expand everything first and cannot produce a document
   * of headings with no bodies.
   *
   * Skips the chrome (buttons, the Sierra chat) rather than filtering it out
   * afterwards: a transcript of an empty chat box is not a briefing. */
  var DOCX_SRC = "docx.min.js";
  function ensureDocx(cb) {
    if (window.docx) { cb(true); return; }
    loadScript(DOCX_SRC, "docx", function () { cb(!!window.docx); });
  }

  // PURE. The rendered tab -> an ordered list of blocks the docx builder walks.
  // Separated from the docx call so it is testable without the library present.
  function briefingBlocks(root) {
    var out = [];
    if (!root) return out;
    function textOf(el) {
      var c = el.cloneNode(true);
      // The visually-hidden new-tab cue is for screen readers, not for a
      // printed page where "(opens in a new tab)" is meaningless.
      Array.prototype.forEach.call(c.querySelectorAll(".cb-sr"), function (n) { n.remove(); });
      return (c.textContent || "").replace(/\s+/g, " ").trim();
    }
    function emitTable(el) {
      var rows = Array.prototype.map.call(el.querySelectorAll("tr"), function (tr) {
        return Array.prototype.map.call(tr.querySelectorAll("th, td"), textOf);
      }).filter(function (r) { return r.length; });
      if (rows.length) out.push({ kind: "table", rows: rows });
    }

    /* ⚠ A DISTRICT OR STATEWIDE VIEW HAS NO `details.cb-sec` AT ALL — its whole
     * content is the roll-up (a heading, three stat cards, the college table and
     * the disclosure notes). Walking only the sections produced an EMPTY
     * briefing for two of the three scopes, which the "nothing to put in a
     * briefing yet" guard would have reported as if the college had no data.
     * So this walks the content region in DOCUMENT ORDER over a whitelist,
     * which covers all three scopes with one pass. */
    var SEL = "details.cb-sec, h3.cb-h, .cb-roll-c, table.cb-dist, .cb-note, .cb-warn";
    Array.prototype.forEach.call(root.querySelectorAll(SEL), function (el) {
      // Chrome, and anything a section will emit itself.
      if (el.closest && (el.closest(".cb-assist") || el.closest(".cb-scope"))) return;
      var inSection = el.closest && el.closest("details.cb-sec");
      if (inSection && inSection !== el) return;

      if (el.tagName.toLowerCase() === "table") { emitTable(el); return; }
      if (!inSection) {
        var cls = el.className || "";
        if (/cb-roll-c/.test(cls)) {
          // A stat card is a figure plus its label — keep them together, since
          // "1,051,870" on its own line is not a fact.
          var n = el.querySelector(".cb-roll-n"), l = el.querySelector(".cb-roll-l");
          if (n) out.push({ kind: "lead", text: textOf(n) + (l ? " — " + textOf(l) : "") });
          return;
        }
        var s0 = textOf(el);
        if (s0) out.push({ kind: /cb-h/.test(cls) ? "h2" : "p", text: s0 });
        return;
      }

      // A collapsible section.
      var d = el;
      if (d.getAttribute("data-sec") === "sierra") return;     // an empty chat box is not content
      var t = d.querySelector(".cb-sum-t"), v = d.querySelector(".cb-sum-v");
      out.push({ kind: "h2", text: t ? textOf(t) : (d.getAttribute("data-sec") || "") });
      // ⭐ The summary value is the figure a CLOSED section shows. It is the one
      // line most likely to be the answer, so it leads the section here too.
      if (v && textOf(v)) out.push({ kind: "lead", text: textOf(v) });
      Array.prototype.forEach.call(d.querySelectorAll("h3, h4, p, li, table"), function (n2) {
        var tag = n2.tagName.toLowerCase();
        if (tag === "table") { emitTable(n2); return; }
        if (n2.closest && n2.closest("table")) return;   // already emitted as part of it
        var s = textOf(n2);
        if (s) out.push({ kind: tag === "li" ? "li" : (tag === "p" ? "p" : "h3"), text: s });
      });
    });
    return out;
  }

  function buildBriefingReport(root) {
    var btn = root && root.querySelector("#cb-report");
    var was = btn ? btn.textContent : null;
    if (btn) { btn.disabled = true; btn.textContent = "Building…"; }
    var done = function (msg) {
      if (!btn) return;
      btn.disabled = false; btn.textContent = msg || was;
      if (msg) setTimeout(function () { btn.textContent = was; }, 2600);
    };
    ensureDocx(function (ok) {
      // ⚠ A failure has to SAY so. A button that silently does nothing is the
      // #1166 shape — indistinguishable from one that was never wired.
      if (!ok) { done("Could not load the document builder"); return; }
      var D = window.docx, blocks = briefingBlocks(root);
      if (!blocks.length) { done("Nothing to put in a briefing yet"); return; }

      var name = scopeLabel() || "CPL";
      var title = state.scope === "statewide" ? "Statewide CPL briefing" : name + " — CPL briefing";
      var today = new Date().toISOString().slice(0, 10);
      var kids = [];
      // House style, matching college_report_generator.js: CO navy title, the
      // gold rule, Calibri throughout. One look for anything that leaves here.
      kids.push(new D.Paragraph({
        children: [new D.TextRun({ text: title, bold: true, size: 36, color: "0A2240", font: "Calibri" })],
        spacing: { after: 100 }
      }));
      kids.push(new D.Paragraph({
        children: [new D.TextRun({
          text: "Mapping Articulated Pathways (MAP) platform  |  Generated: " + today
              + "  |  Figures as shown on the My College tab",
          size: 20, color: "666666", font: "Calibri", italics: true
        })],
        spacing: { after: 200 }
      }));
      // ⭐ The suppression note travels WITH the document. On screen the reader
      // has the surrounding page to explain a dash; in a file that reaches a
      // college by email, this line is the only thing standing between "withheld"
      // and someone reading it as zero.
      kids.push(new D.Paragraph({
        children: [new D.TextRun({
          text: "“Withheld” means fewer than 10 CPL students — not zero activity. "
              + "A dash means the college is not in the credit summary at all, which is an absent "
              + "measurement rather than a measured zero. Group totals cover only the colleges "
              + "listed with figures.",
          size: 18, color: "666666", font: "Calibri", italics: true
        })],
        spacing: { after: 200 }
      }));
      kids.push(new D.Paragraph({
        children: [],
        border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: "C9A84C" } },
        spacing: { after: 200 }
      }));

      blocks.forEach(function (b) {
        if (b.kind === "table") {
          kids.push(new D.Table({
            width: { size: 100, type: D.WidthType.PERCENTAGE },
            rows: b.rows.map(function (r, i) {
              return new D.TableRow({
                children: r.map(function (cell) {
                  return new D.TableCell({
                    children: [new D.Paragraph({ children: [new D.TextRun({
                      text: cell, bold: i === 0, size: 18, font: "Calibri"
                    })] })]
                  });
                })
              });
            })
          }));
          kids.push(new D.Paragraph({ children: [], spacing: { after: 160 } }));
          return;
        }
        var spec = {
          h2: { size: 26, color: "0A2240", bold: true, before: 300, after: 100 },
          h3: { size: 22, color: "163A5F", bold: true, before: 200, after: 80 },
          lead: { size: 22, color: "0A2240", bold: true, before: 0, after: 120 },
          li: { size: 22, color: null, bold: false, before: 0, after: 80 },
          p: { size: 22, color: null, bold: false, before: 0, after: 120 }
        }[b.kind] || { size: 22, after: 120 };
        var run = { text: b.text, size: spec.size, font: "Calibri" };
        if (spec.bold) run.bold = true;
        if (spec.color) run.color = spec.color;
        var para = { children: [new D.TextRun(run)], spacing: { before: spec.before || 0, after: spec.after } };
        if (b.kind === "li") para.bullet = { level: 0 };
        kids.push(new D.Paragraph(para));
      });

      var doc = new D.Document({
        sections: [{ properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
                     children: kids }]
      });
      D.Packer.toBlob(doc).then(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        /* YYYYMMDD prefix per the vault's mandatory deliverable-naming rule
         * (CPLBrain CLAUDE.md) so briefings sort chronologically wherever they
         * land. NOTE: college_report_generator.js still puts its date at the
         * END — flagged for Sam rather than changed here, since renaming an
         * artifact people already file is his call, not a side effect of this. */
        a.download = today.replace(/-/g, "") + "_"
          + name.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_CPL_Briefing.docx";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        done("Downloaded");
      }).catch(function () { done("Could not build the document"); });
    });
  }

  function wire(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-scope]"), function (b) {
      b.onclick = function () { setScope(b.getAttribute("data-scope"), root); };
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-scope-clear]"), function (b) {
      b.onclick = function () { setScope(null, root); };
    });
    // The shortcut past the question, for whoever was here yesterday.
    Array.prototype.forEach.call(root.querySelectorAll("[data-scope-resume]"), function (b) {
      b.onclick = function () { resumeRemembered(root); };
    });
    // Back to step 2, keeping the scope. Clears the entity AND its detail — a
    // stale detail left behind would render the previous college's figures under
    // the next one's name for as long as the fetch takes.
    Array.prototype.forEach.call(root.querySelectorAll("[data-entity-clear]"), function (b) {
      b.onclick = function () {
        state.college = null; state.district = state.scope === "district" ? "" : state.district;
        state.detail = null; state.detailFor = null; state.detailError = null;
        rememberScope(); recompute(); render(root);
      };
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-district]"), function (b) {
      b.onclick = function () {
        state.district = b.getAttribute("data-district") || "";
        rememberScope(); recompute(); render(root);
      };
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-all]"), function (b) {
      b.onclick = function () { setAllSections(b.getAttribute("data-all") === "open", root); };
    });
    var rep = root.querySelector("#cb-report");
    if (rep) rep.onclick = function () { buildBriefingReport(root); };

    var c = root.querySelector("#cb-college"), d = root.querySelector("#cb-district");
    if (c) c.onchange = function () { selectCollege(c.value, root); };
    if (d) d.onchange = function () {
      state.district = d.value || "";
      // Clear a selection the new filter no longer contains, rather than
      // leaving a college on screen that the picker above it does not list.
      if (state.college && state.district) {
        var idx = districtIndex((state.data && state.data.colleges) || []);
        var inDistrict = idx && idx[state.district] && idx[state.district].indexOf(state.college) >= 0;
        if (!inDistrict) { state.college = null; state.detail = null; state.detailFor = null; }
      }
      recompute(); render(root);
    };
    // Remember which sections the reader opened. render() rewrites innerHTML,
    // so without this a change of role or district would slam every drawer
    // shut under someone mid-read.
    Array.prototype.forEach.call(root.querySelectorAll("details.cb-sec"), function (d) {
      d.addEventListener("toggle", function () {
        var id = d.getAttribute("data-sec");
        if (id) state.open[id] = d.open;
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll(".cb-pick"), function (b) {
      b.onclick = function () { selectCollege(b.getAttribute("data-college"), root); };
    });
    // The suggested questions are the assistant's own chips now, so this wires
    // only the FALLBACK cluster fallbackAsks() renders when cpl_chat.js did not
    // mount. Nothing matches on the normal path — kept because the fallback is
    // the one path where the questions still belong to this file.
    Array.prototype.forEach.call(root.querySelectorAll(".cb-ask"), function (b) {
      b.onclick = function () { askSierra(b.getAttribute("data-q")); };
    });
  }

  /* ── Lazy loads: the funding roster, then the funding model ───────────── */
  function loadScript(src, globalName, cb) {
    if (window[globalName]) { cb(); return; }
    if (window.CPL_TABS && typeof window.CPL_TABS.loadScript === "function") {
      window.CPL_TABS.loadScript(src, globalName, cb);
      return;
    }
    var s = document.createElement("script");
    s.src = src; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  /* Stage 1 — the roster alone, for the district picker. */
  function loadRoster(root) {
    if (state.roster !== "idle") return;
    state.roster = "loading";
    loadScript("cpl_funding_data.js", "CPL_FUNDING", function () {
      state.roster = window.CPL_FUNDING ? "ready" : "error";
      if (root) render(root);
    });
  }

  /* The daily tier classification, from the same committed live_metrics.json
   * the dashboard KPIs are built from. Same-origin static file, 55KB, no auth.
   * A failed read leaves state.live null and the tier block simply does not
   * render — never a "0 of 5", which would read as a finding about the
   * college. */
  function loadLive(root) {
    if (state.liveState !== "idle") return;
    state.liveState = "loading";
    fetch("live_metrics.json").then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (j) {
        state.live = j || null;
        state.liveState = j ? "ready" : "error";
        if (root) render(root);
      });
  }

  /* Stage 2 — the model, for the money. We call the module's own boot() via
   * ensureLoaded() rather than re-implementing its load sequence, so this page
   * reads the SAME figures the Implementation Funding tab shows — including the
   * Budget ledger appropriations, which override the baked pool values. The
   * ledger/perf/ESS sidecars land asynchronously, so we subscribe to the
   * module's change notification and re-render when they do; without that the
   * ESS outcomes would sit on "Pending" forever. */
  function loadFunding(root) {
    if (state.funding !== "idle") return;
    state.funding = "loading";
    loadScript("cpl_funding.js", "CPL_FUNDING_TAB", function () {
      var M = fundingModule();
      if (!M) { state.funding = "error"; if (root) render(root); return; }
      if (typeof M.onModelChange === "function") {
        M.onModelChange(function () { if (state.funding === "ready" && root) render(root); });
      }
      try { M.ensureLoaded(); } catch (e) { /* the model renders its own empty state */ }
      state.funding = "ready";
      if (root) render(root);
    });
  }

  /* ── The CPL Assistant, embedded ──────────────────────────────────────────
   * Sam, 2026-08-11: "embed the functionality right on the page… so they can
   * type their question there and not leave the tab." This mounts the SAME
   * assistant cpl_chat.js owns — one instance in a second place — so the
   * audience rules, feedback path and conversation history stay in one file
   * and cannot drift. Clicking a suggested question PREFILLS without sending,
   * so the person can edit it first.
   *
   * Falls back to the deep link if the chat module has not loaded. */
  var SIERRA_Q_KEY = "cplSierraTestQ.v1";
  function chatModule() {
    var C = window.CPL_CHAT;
    return (C && typeof C.mountInto === "function") ? C : null;
  }
  function mountAssistant(root) {
    var C = chatModule(), host = root && root.querySelector("#cb-assistant-mount");
    if (!C || !host) return false;
    // "my-college" is this tab's SURFACE — see cpl_chat.js hostSurface. It is not
    // the scope (that is setAssistantScope, and it changes as the reader picks a
    // college); the surface is constant for this pane.
    try { C.mountInto(host, "my-college"); return true; } catch (e) { return false; }
  }

  /* PURE-ish. This college's five headline figures, from the same two inputs
   * render() uses. Derived here rather than threaded through finish() as a
   * parameter: three of finish()'s four exit paths pass null for it, so a
   * threaded value would silently drop the "units already waiting" question on
   * every path but one. */
  function standingFor(college) {
    var summary = state.data && state.data.summaryByName && state.data.summaryByName[college];
    return standing(summary, state.detail);
  }

  /* The pre-2026-08-21 question cluster, rendered ONLY when cpl_chat.js is not
   * there to hold it. Same markup, same wiring, same askSierra() route — it is
   * the fallback, not a second cluster: nothing calls this while the widget is
   * mounted, so the two can never appear together. */
  function fallbackAsks(root) {
    var mount = root && root.querySelector("#cb-assistant-mount");
    if (!mount || !mount.parentNode) return false;
    // Never beside the widget's own row. Structural, so "the two can never
    // appear together" is enforced rather than reasoned about.
    if (root.querySelector(".cplchat-suggest") || root.querySelector(".cb-asks")) return false;
    /* ⚠ THE SAME scopeQuestions() THE WIDGET GETS — this used to require
     * state.college and re-derive the college list itself, so a district reader
     * whose chat module failed to load saw NO questions at all while a college
     * reader saw four. Two callers deriving one list is how they drift. */
    var qs = scopeQuestions();
    if (!qs.length) return false;
    var box = document.createElement("div");
    box.innerHTML = '<div class="cb-asks-lab">Try one of these</div><div class="cb-asks">'
      + qs.map(function (q) {
          return '<button type="button" class="cb-ask" data-q="' + esc(q) + '">' + esc(q) + "</button>";
        }).join("")
      + "</div>";
    while (box.firstChild) mount.parentNode.insertBefore(box.firstChild, mount);
    return true;
  }

  /* Hand THIS scope's own questions to the assistant, so there is ONE cluster
   * of them and it sits below the role chips (Sam, 2026-08-21). Derived, not a
   * fixed list, so they stay right as a college's position changes.
   *
   * ⚠ A GROUP SCOPE GETS GROUP QUESTIONS — IT MUST NOT PASS null. That is what
   * #1274 did, and null returns the widget to its generic starters, one of
   * which names Riverside City College: correct on the public page and on the
   * CPL Assistant tab, wrong under "Welcome, Los Angeles Community College
   * District" (Sam, 2026-08-21). The list still CHANGES on every scope change,
   * which is the part that mattered — leaving the previous college's questions
   * up would offer advice about a college the reader has navigated away from.
   *
   * Fails soft in both directions: an unmounted or older chat module simply
   * shows its own starters, which is a working assistant with less-tailored
   * suggestions — never a blank box. */
  function setAssistantQuestions() {
    var C = chatModule();
    if (!C || typeof C.setSuggestions !== "function") return false;
    try { return C.setSuggestions(scopeQuestions()); } catch (e) { return false; }
  }

  /* Tell the assistant WHOSE PAGE THIS IS. The questions above say what is worth
   * asking; this says who is being asked about, and they are not the same thing
   * — a reader types their own question far more often than they click a chip,
   * and a typed question carries no scope at all.
   *
   * ⚠ THIS IS WHAT MAKES THE ANSWER MATCH THE HEADING. Sam, 2026-08-22, with
   * LACCD selected: "she configured her response based on RCCD." Nothing had
   * ever told the assistant which institution was selected — not the payload,
   * not the prompt — so the live `sierra_guidance` directive "confine your
   * answers to the selected institution" was an instruction to guess, and the
   * stale thread from a previous scope was the only institution in evidence.
   * cpl_chat.js's setScope() drops that thread on a real change of subject; the
   * label it takes is what the function anchors the answer to.
   *
   * ⚠ THE FULL NAME, NOT THE DISPLAY ABBREVIATION. The picker renders "Los
   * Angeles CCD" and the roster's key is "Los Angeles Community College
   * District"; the function resolves a district by that stem through the same
   * path a typed question uses, so handing over the short form would put a
   * second, weaker matcher in the loop. state.district is already the full name.
   *
   * Fails soft: an older chat module without setScope simply behaves as it does
   * today. Never gates the mount — a scope that cannot be handed over is a
   * less-tailored assistant, not a missing one. */
  function setAssistantScope() {
    var C = chatModule();
    if (!C || typeof C.setScope !== "function") return false;
    try { return C.setScope(scopeReady() ? state.scope : null, scopeLabel()); }
    catch (e) { return false; }
  }
  /* One click, not two. The suggested questions sit above an assistant that is
   * already mounted on this tab, so clicking one fills the box AND sends —
   * matching the assistant's own starter chips. Sam, 2026-08-11: "so they
   * don't have to take 2 steps and get lost."
   *
   * ask() is preferred; prefill() is the fallback for an older chat module and
   * deliberately does NOT send (the Sierra Training tab replays a logged
   * question through it and the reviewer edits first). If neither is
   * available the question is stashed and we navigate to the full tab. */
  function askSierra(question) {
    /* ⚠ SIERRA MAY BE COLLAPSED. Since 2026-08-17 she is a <details>, and
     * Collapse all closes her along with everything else. Prefilling a widget
     * inside a closed section types into a box nobody can see — the exact
     * silent failure #1166 fixed for the Sierra Training hand-off, which
     * targets this very widget. Open the section before handing anything to it.
     * State first, then the live DOM, because a re-render reads the state and
     * anything already on screen does not wait for one. */
    state.open.sierra = true;
    try {
      var d = document.querySelector('#college-briefing-root details[data-sec="sierra"]');
      if (d && !d.open) d.open = true;
    } catch (e) { /* not mounted — the state flag still lands */ }
    var C = chatModule();
    if (C && typeof C.ask === "function" && C.ask(question)) return;          // fills + sends
    if (C && typeof C.prefill === "function" && C.prefill(question)) return;  // stays on the tab
    try { sessionStorage.setItem(SIERRA_Q_KEY, String(question || "").slice(0, 1000)); }
    catch (e) { /* storage unavailable — the chat still opens, just unprefilled */ }
    if (window.CPL_TABS && typeof window.CPL_TABS.navigate === "function") {
      window.CPL_TABS.navigate("chatbot");
    } else {
      location.hash = "#chatbot";
    }
  }

  /* PURE. The questions worth asking about THIS college — computed from its own
   * figures, not a fixed list (Sam, 2026-08-11: "questions that would lead them
   * to opportunities at their own college"). Because they are derived, they
   * stay right as a college's position changes and nobody maintains a list.
   * The first is constant and is the one Sam asked for: how are we doing, and
   * what should we do about it. */
  function sierraQuestions(college, detail, standing) {
    if (!college) return [];
    var qs = ["How is " + college + " doing on CPL, and what quick steps do you recommend?"];
    var waiting = standing && standing.articulatedWaiting;
    if (waiting > 0) {
      qs.push("What is the fastest way to award the " + fmt(waiting) + " units already waiting at " + college + "?");
    } else if (standing && standing.eligible > 0) {
      qs.push("Nothing is set up and waiting at " + college + " — where should we look for credit to award?");
    }
    // The single best adoption opportunity, by peers already doing it. Names a
    // COUNT of peer colleges, never the colleges — this page never turns into
    // a comparison of one college against another.
    var best = null;
    if (detail && detail.potential) {
      detail.potential.forEach(function (c) {
        var n = (c.adopter_colleges || []).length;
        if (!best || n > best.peers) best = { title: c.unified_title, peers: n };
      });
    }
    if (best && best.title) {
      qs.push("Should " + college + " add " + best.title + "? " + best.peers + " other colleges already give credit for it.");
    }
    qs.push("Who does a student at " + college + " contact to ask for a credit review?");
    return qs;
  }

  /* PURE. The questions for a scope that is NOT one college — a district, or
   * statewide.
   *
   * ⭐ WHY THIS EXISTS AT ALL (Sam, 2026-08-21, on a screenshot of the LACCD
   * page): "The pre-seeded questions are not adjusted to the selected org. I
   * know this may be due to our joint use of Sierra public use and Sierra My
   * College use." He was exactly right about the cause. #1274 gave a group
   * scope `null`, which returns the widget to its GENERIC starters — and those
   * are the PUBLIC surface's list, one of which names Riverside City College.
   * Fine on the CPL Assistant tab; nonsense under a heading that reads "Welcome,
   * Los Angeles Community College District".
   *
   * The fix is structural, not a better fallback: a host that knows whose page
   * this is ALWAYS owns the questions, in every scope. setAssistantQuestions()
   * no longer passes null, so the generic list is unreachable from this tab and
   * can go on being concrete for the audience it was written for.
   *
   * ⚠ SIERRA HAS NO DISTRICT DIMENSION, so no question here may DEPEND on one.
   * Verified two ways, 2026-08-21: zero columns in the whole public schema are
   * named district (`information_schema.columns … ilike '%district%'` → 0 rows),
   * and districtIndex() above builds the grouping client-side from
   * window.CPL_FUNDING.colleges — the funding roster. The district exists in
   * this browser and nowhere she can read. So "which of my colleges has the
   * most units waiting?" is a question this page can answer and she cannot, and
   * offering it would manufacture the confident-wrong answer this project keeps
   * finding. The district is therefore named only in an ADVISORY question,
   * where a name cannot become a false figure.
   *
   * ⚠ AND NO MEMBER COLLEGE IS SINGLED OUT. The obvious "lead with the college
   * with the most units waiting" orders a reader's own peers by a figure —
   * rollup() right above deliberately sorts alphabetically for that reason, and
   * Sam's standing rule is that colleges are never ranked. The roll-up table
   * already lists every member with its figures and says "Pick any college for
   * its full briefing"; that is the route to a college-shaped question, not a
   * chip that picks one for them.
   *
   * What is left is genuinely answerable: one advisory question naming the org,
   * and the credential + statewide routes, which are live (CRED·VOLUME,
   * CRED·STD) and have no college or district in them. */
  function groupQuestions(scope, label) {
    var qs = [];
    if (scope === "district" && label) {
      qs.push("What should " + label + " do to help its colleges award more CPL?");
    } else if (scope === "statewide") {
      qs.push("How many students has CPL served statewide?");
    }
    qs.push("Which credentials do the most colleges give credit for?");
    qs.push("Which colleges give credit for a real estate license?");
    qs.push("What is Credit for Prior Learning?");
    return qs;
  }

  /* The questions for whatever scope is in force — the ONE place that decides,
   * so the widget cluster and the no-widget fallback can never offer different
   * lists. Returns [] only when no scope is settled, which is a screen with no
   * assistant on it. */
  function scopeQuestions() {
    if (state.college) return sierraQuestions(state.college, state.detail, standingFor(state.college));
    if (!scopeReady()) return [];
    return groupQuestions(state.scope, scopeLabel());
  }

  /* ── Load ────────────────────────────────────────────────────────────── */
  function jget(url) {
    return fetch(url, { headers: authHeaders() }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).catch(function () { return null; });
  }

  function recompute() {
    if (!state.data) return;
    var raw = state.data.raw || {};
    var c = null;
    if (state.college) {
      var id = (raw.nameToId || {})[state.college];
      var s = id != null ? (raw.summaryById || {})[id] : null;
      c = {
        name: state.college,
        suppressed: !!(s && s.suppressed),
        dormant_credits: s ? s.dormant_credits : null,
        articulated_waiting: s ? s.articulated_waiting : null,
        applied_credits: s ? s.applied_credits : null,
        transcribed_credits: s ? s.transcribed_credits : null,
        contactEmail: (raw.contactByName || {})[state.college] || null,
        contactKnown: Object.prototype.hasOwnProperty.call(raw.contactByName || {}, state.college)
      };
    }
    state.data.briefing = buildBriefing({ config: raw.config, college: c }, { scenario: SCENARIO, year: YEAR });
  }

  function loadAll() {
    return Promise.all([
      jget(REST + "/cpl_funding_config?id=eq.default&select=config"),
      // entity_kind=neq.test EXCLUDES MAP's sandbox orgs (Sam, 2026-08-13:
      // "the MAP Custom reports mistakenly let our sandbox environment orgs slip
      // into the users and contacts reports and now show up in our drop downs").
      // Seven of them: CabTest / MorTest City / Nortest City / RivTest City /
      // SantTest Ana / Testing College / NORCO College - Syllabus Manager, plus
      // CA MAP INITIATIVE COLLEGE (also tagged test).
      //
      // The flag was NOT missing — map_colleges.entity_kind already carried the
      // right value for every one of them. This consumer simply never read it,
      // which is the same shape as the contacts fossil and the statewide flag:
      // the data was right and nobody asked it. Filtering here, not upstream,
      // because MAP fixing its report would clean map_college_users and
      // map_college_contacts on the daily cron but NOT this lookup table.
      //
      // Deliberately neq.test rather than eq.college: partners (Futuro Health,
      // Launch Apprenticeship) and the two standalone continuing-ed institutions
      // are real entities and stay.
      // `variants` joined 2026-08-21 — see the contact indexing below. It is
      // EMPTY on the two partner rows by design, so a consumer must treat an
      // empty array as "no aliases", never as a failed read.
      jget(REST + "/map_colleges?select=college_id,college_name,variants&entity_kind=neq.test&order=college_name"),
      jget(REST + "/map_college_credit_summary?select=*"),
      jget(REST + "/map_college_contacts?select=college,primary_contact,primary_contact_email,cpl_coordinator,cpl_coordinator_email,cpl_counselor,cpl_counselor_email,articulation_officer,articulation_officer_email,faculty_lead,faculty_lead_email,certifying_official,certifying_official_email,vpaa,vpaa_email,vpss,vpss_email,landing_page_url,last_updated_on")
    ]).then(function (res) {
      var cfgRow = res[0] && res[0][0], colleges = res[1] || [], summary = res[2] || [], contacts = res[3] || [];
      var nameToId = {}, names = [];
      /* variant spelling -> the canonical map_colleges name. Built from the
       * `variants` column landed 2026-08-21 (kb/college_identity/<date>/). The
       * canonical name NEVER maps through this — a variant must not be able to
       * shadow a real college's own row. */
      var variantToCanon = {};
      colleges.forEach(function (r) {
        nameToId[r.college_name] = r.college_id;
        names.push(r.college_name);
      });
      /* ⚠ A VARIANT MUST NEVER SHADOW ANOTHER COLLEGE'S CANONICAL NAME.
       * Built in a SECOND pass, after every canonical name is known — a single
       * pass cannot know whether a variant it is about to register belongs to a
       * college it has not read yet.
       *
       * The hazard is concrete: "Mission College" is a real college (id 82) and
       * is also a perfectly plausible variant of "Los Angeles Mission College".
       * Let the variant win and Mission College's own CPL coordinator is
       * silently attached to LA Mission — one college's contact answering for
       * another, which is worse than the blank this whole change exists to fix.
       * Caught by tests/college_identity_variants.test.js block (3), which was
       * written before this guard and failed. */
      /* ⚠ AND A VARIANT TWO COLLEGES BOTH CLAIM MUST RESOLVE TO NEITHER.
       * The shadow guard above only catches a variant equal to a CANONICAL
       * name. It cannot see the other collision: two colleges offering the SAME
       * variant. This used to be "first writer wins" — silently, and ordered by
       * college_name, so the alphabetically-earlier college took it.
       *
       * That was harmless only while variants were district-qualified
       * ("LA PIERCE"), which are unique by construction. The moment campus short
       * names exist it is live: FIVE colleges' names reduce to "City College"
       * (Los Angeles, San Diego, Long Beach, Riverside, Santa Barbara), so
       * first-wins would attach San Diego City College's CPL coordinator to
       * Los Angeles City College and report it as a resolved contact.
       * A CONFIDENTLY WRONG CONTACT IS WORSE THAN THE BLANK THIS FIXES.
       *
       * The builder (kb/_build_college_identity_crosswalk.py) already refuses to
       * MINT an ambiguous short name, so today nothing reaches here. This guard
       * exists because a builder guarantee is not a consumer guarantee: this
       * column is also written by hand and by curator rulings, and a consumer
       * that trusts its input is one bad row from a wrong answer.
       * Counted in a pass of its own — a single pass cannot know a later college
       * is about to claim the same variant. */
      var variantClaims = {};
      colleges.forEach(function (r) {
        (r.variants || []).forEach(function (v) {
          if (!v || v === r.college_name || (v in nameToId)) return;
          variantClaims[v] = (variantClaims[v] || 0) + 1;
        });
      });
      colleges.forEach(function (r) {
        (r.variants || []).forEach(function (v) {
          if (!v || v === r.college_name) return;
          if (v in nameToId) return;                 // some college owns this name
          if (variantClaims[v] > 1) return;          // ambiguous — resolves to neither
          if (!(v in variantToCanon)) variantToCanon[v] = r.college_name;
        });
      });
      var summaryById = {};
      summary.forEach(function (r) { summaryById[r.college_id] = r; });
      var contactByName = {}, contactRowByName = {};
      contacts.forEach(function (r) {
        contactByName[r.college] = r.primary_contact_email || null;
        contactRowByName[r.college] = r;
        /* ⭐ AND UNDER EVERY VARIANT OF THAT NAME.
         *
         * Measured 2026-08-21: TWO contact rows are keyed on a name with a
         * TRAILING SPACE — "Cypress College " and "San Jose City College ".
         * Both carry a real primary_contact_email and a named CPL coordinator,
         * and neither exact-matches map_colleges. So this index was built under
         * a key nothing ever looked up, and both colleges rendered as having no
         * contact — silently, because a missing key is indistinguishable from a
         * college that genuinely has none.
         *
         * ⚠ Do NOT "fix" this by trimming the contacts table: it is rebuilt
         * from MAP on the daily cron, so the space returns tomorrow, and a load
         * must reproduce its source rather than improve it. The join is what
         * has to tolerate the variance — which is exactly what map_colleges
         * .variants is for now that it is populated (118 of 128 rows; the two
         * trailing-space spellings are IN it, verified). */
        var canon = variantToCanon[r.college];
        if (canon && canon !== r.college) {
          if (!(canon in contactByName)) contactByName[canon] = r.primary_contact_email || null;
          if (!(canon in contactRowByName)) contactRowByName[canon] = r;
        }
      });
      var summaryByName = {};
      names.forEach(function (n) { summaryByName[n] = summaryById[nameToId[n]] || null; });
      state.data = {
        colleges: names,
        nameToId: nameToId,
        summaryByName: summaryByName,
        raw: { config: (cfgRow && cfgRow.config) || {}, nameToId: nameToId, summaryById: summaryById, contactByName: contactByName, contactRowByName: contactRowByName }
      };
      if (!res[0]) state.error = "the funding configuration did not load";
      recompute();
      return state.data;
    });
  }

  function activate() {
    var root = document.getElementById("college-briefing-root");
    if (!root) return;
    if (state.scope === null) restoreScope();
    if (state.data && state.loadedSignedIn === signedIn()) { loadRoster(root); loadLive(root); render(root); return; }
    if (!signedIn()) { state.data = null; render(root); return; }
    state.loading = true; render(root);
    // The roster is small and powers the district picker, so it starts now,
    // in parallel with the Supabase reads. The 370KB model waits until a
    // college is actually chosen.
    loadRoster(root);
    loadLive(root);
    loadAll().then(function () {
      state.loading = false; state.loadedSignedIn = signedIn(); render(root);
    }).catch(function (e) {
      state.loading = false; state.error = String(e && e.message || e); state.loadedSignedIn = signedIn(); render(root);
    });
  }

  window.CPL_COLLEGE_BRIEFING = {
    activate: activate,
    render: render,
    // exposed for tests — all three are pure
    _collectPrograms: collectPrograms,
    _buildBriefing: buildBriefing,
    // Exposed for tests. courseShare in particular carries the suppression
    // logic absorbed from the retired Course Credit tab.
    _courseShare: courseShare,
    // waitingBreakdown carries the suppression guard: map_college_cr_unit has
    // no k-anonymity of its own, so breaking out a withheld college's credit
    // would hand back what suppression removed.
    _waitingBreakdown: waitingBreakdown,
    _prioritiesAlign: prioritiesAlign,
    // The reorder join (Sam, 2026-08-20). Both pure: applyPriorityOrder puts a
    // program's priorities into the curator's display order, programPriorityFor
    // joins one funding priority back to its own strategies by IDENTITY.
    _applyPriorityOrder: applyPriorityOrder,
    _programPriorityFor: programPriorityFor,
    // Auth seams. Every per-college FIGURE on this tab sits behind
    // `is_allowed_reviewer() OR team_pass_ok()`, and an RLS-filtered SELECT
    // answers 200 + [] rather than 401 — so a credential that never reaches the
    // server is indistinguishable from a college with no data, on every college
    // at once. That is silent by construction and cannot be seen from the
    // rendered page, so it is asserted on the headers instead.
    _scopePicker: scopePicker,
    _entityPicker: entityPicker,
    _welcomeHead: welcomeHead,
    _scopeLabel: scopeLabel,
    _scopeReady: scopeReady,
    _rollup: rollup,
    // PURE. The docx builder reads the RENDERED tab through this, so a test can
    // assert what reaches the document without the docx library present.
    _briefingBlocks: briefingBlocks,
    _SCOPES: SCOPES,
    _SECTION_IDS: SECTION_IDS,
    _setAllSections: setAllSections,
    _getSession: getSession,
    _authHeaders: authHeaders,
    _rosterKey: rosterKey,
    _nextEssOutcome: nextEssOutcome,
    // The ESS outcome marks are WORDS now, not glyphs — exposed so the test can
    // assert each state stays distinct as well as glyph-free (a strip that
    // collapsed two states into one label would read as glyph-free and be
    // wrong). Pure.
    _essMark: essMark,
    // Resources render inside a collapsible section that only exists once the
    // briefing DATA has landed, so a jsdom load with a never-resolving fetch
    // never sees them. Exposed so the "(opens in a new tab)" cue — which
    // replaced the ↗ and is the only leaves-the-page warning a screen reader
    // gets — is guarded rather than quietly untested. Pure.
    _resourcesHtml: resourcesHtml,
    // The tier count is the WORKER's (criteriaMetCount); the per-criterion
    // list is display only, and `mismatch` fires when the two disagree.
    _tierStanding: tierStanding,
    _topStrategy: topStrategy,
    _cleanText: cleanText,
    _safePct: safePct,
    _RESOURCES: RESOURCES,
    _byCplType: byCplType,
    _standing: standing,
    _measureFor: measureFor,
    // Funding / district / Sierra — pure, and the join is the risky one: it
    // decides which college's money is shown, so it is tested against the
    // real rosters rather than a fixture.
    _fundingFor: fundingFor,
    _essProgress: essProgress,
    _districtIndex: districtIndex,
    _shortName: shortName,
    _sierraQuestions: sierraQuestions,
    _groupQuestions: groupQuestions,
    _scopeQuestions: scopeQuestions,
    _dedupeValue: dedupeValue,
    _contactRoster: contactRoster,
    _askSierra: askSierra,
    _SIERRA_Q_KEY: SIERRA_Q_KEY,
    _money: money,
    _state: state,
    _SCENARIO: SCENARIO,
    _YEAR: YEAR
  };

  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "college-briefing") activate();
  });
})();
