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

  var ROLES = [
    { id: "any", label: "Anyone at the college" },
    { id: "coordinator", label: "CPL Coordinator" },
    { id: "counselor", label: "Counselor" },
    { id: "admissions", label: "Admissions & Records" },
    { id: "veterans", label: "Veterans Services" },
    { id: "admin", label: "Dean / Administrator" }
  ];

  var state = {
    college: null, role: "any", data: null, loading: false, error: null, loadedSignedIn: null,
    // Per-college detail, fetched on selection rather than up front — 123
    // colleges' worth of credential rows is not worth loading to show one.
    detail: null, detailFor: null, detailLoading: false, detailError: null,
    // District filter for the college picker (from the funding roster, which
    // carries a district per college). "" = every college.
    district: "",
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
  function getSession() {
    try {
      var raw = localStorage.getItem("cpl_team_session");
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function signedIn() { return !!(getSession() || localStorage.getItem("cpl_team_pass")); }
  function authHeaders() {
    var s = getSession();
    var token = (s && s.access_token) || SUPABASE_ANON;
    return { apikey: SUPABASE_ANON, Authorization: "Bearer " + token };
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
      ".cb-ess{flex:0 0 auto;width:1.5em;text-align:center;font-weight:700;font-size:.9rem;}",
      ".cb-ess.met{color:var(--ok,#2f7a3d);}",
      ".cb-ess.partial{color:var(--mustard-text,#8B6800);}",
      ".cb-ess.not{color:var(--text-muted);}",
      ".cb-ess.pending,.cb-ess.na{color:var(--text-muted);font-size:.7rem;font-weight:600;}",
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
      ".cb-assist>header{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:4px;}",
      ".cb-assist h3{margin:0;font-size:1.05rem;color:var(--text-strong);}",
      ".cb-assist .cb-bar{margin-bottom:0;padding-bottom:12px;border-bottom:1px solid var(--border);}",
      ".cb-assist .cb-asks{margin-top:12px;}",
      ".cb-assist-mount{margin-top:12px;}",
      ".cb-asks{display:flex;flex-wrap:wrap;gap:8px;}",
      ".cb-ask{font:inherit;font-size:.82rem;text-align:left;padding:9px 12px;border:1px solid var(--border-strong);border-radius:999px;background:var(--surface);color:var(--text);cursor:pointer;}",
      ".cb-ask:hover{border-color:var(--brand);color:var(--brand);}"
    ].join("\n");
    document.head.appendChild(s);
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
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
   * catalogue, which is complete) and `students` (from the grain, which is not)
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
    var rows = detail.waiting;
    if (!rows.length) return { empty: true, total: 0, groups: [] };
    var by = {}, total = 0, mil = 0;
    rows.forEach(function (r) {
      var u = Number(r.sum_articulated_credits) || 0;
      if (u <= 0) return;
      total += u;
      var ct = cleanText(r.course_type) || "Not categorised";
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

  /* Returns null when the model has not loaded — which the caller must render
   * as "not loaded yet", never as "this college gets nothing". An unresolved
   * name and a measured zero are different claims. */
  function fundingFor(name) {
    var M = fundingModule();
    if (!M || !name) return null;
    var key = shortName(name);
    var grant = M._grant(key);
    if (!grant) return { key: key, onRoster: false };
    var model = null;
    try { model = M._model(); } catch (e) { /* the model renders its own empty state */ }
    return {
      key: key, onRoster: true, grant: grant,
      floor: model ? model.floor : null,
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
   * the 2026-07-03 naming convention retired — the programme is the CPL
   * Initiative and the platform is the MAP platform, and "MAP Initiative" is
   * never used in new writing. Fixed here rather than copied forward; the
   * fact sheet still carries the old title.
   */
  var RESOURCES = [
    ["https://map.rccd.edu/cpl_implementation_guide/", "CPL Implementation & Sustainability Guide",
     "Step-by-step guide for establishing or expanding a college CPL programme."],
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

  function resourcesHtml() {
    return '<h3 class="cb-h">Resources</h3>'
      + '<div class="cb-note" style="margin-top:0">All public. The first four are the ones a coordinator uses; '
      + "the rest is the evidence and policy behind the work.</div>"
      + '<div class="cb-res">' + RESOURCES.map(function (r) {
          return '<div class="cb-resi"><a href="' + esc(r[0]) + '" target="_blank" rel="noopener">'
            + esc(r[1]) + " ↗</a><div>" + esc(r[2]) + "</div></div>";
        }).join("") + "</div>";
  }

  function essMark(o) {
    var g = o.state === "met" ? "✓" : o.state === "partial" ? "◐" : o.state === "not" ? "—"
          : o.state === "na" ? "n/a" : "⏳";
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

  function render(root) {
    ensureCss();
    if (!signedIn()) {
      root.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);">Sign in with the team phrase to view the college briefing.</div>';
      return;
    }
    if (state.loading) { root.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);">Measuring…</div>'; return; }

    var names = (state.data && state.data.colleges) || [];
    var dIdx = districtIndex(names);
    var districts = dIdx ? Object.keys(dIdx).sort() : [];
    // The district picker NARROWS the college list; it never changes a figure.
    // A college with no district on the funding roster stays reachable under
    // "All districts" — filtering it out of every option would make it
    // unselectable, which is a worse failure than showing it unfiltered.
    var shown = (state.district && dIdx && dIdx[state.district]) ? dIdx[state.district] : names;

    var h = '<div class="cb-bar">';
    if (districts.length) {
      h += '<div><label for="cb-district">District</label><select id="cb-district">'
        + '<option value="">All districts (' + names.length + " colleges)</option>"
        + districts.map(function (d) {
            return '<option value="' + esc(d) + '"' + (d === state.district ? " selected" : "") + ">"
              + esc(d.replace(/ Community College District$/, " CCD")) + " (" + dIdx[d].length + ")</option>";
          }).join("")
        + "</select></div>";
    } else if (state.roster === "loading") {
      h += '<div><label>District</label><select disabled><option>Loading districts…</option></select></div>';
    }
    h += '<div><label for="cb-college">College</label><select id="cb-college"><option value="">Choose a college…</option>' +
      shown.map(function (n) { return '<option value="' + esc(n) + '"' + (n === state.college ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") +
      '</select></div><div><label for="cb-role">Your role</label><select id="cb-role">' +
      ROLES.map(function (r) { return '<option value="' + r.id + '"' + (r.id === state.role ? " selected" : "") + ">" + esc(r.label) + "</option>"; }).join("") +
      "</select></div></div>";

    // ── Sierra AI, first on the tab, holding the pickers ──────────────────
    // Sam, 2026-08-11: the assistant leads, the pickers live inside it, and
    // it is named "Sierra AI" — "Sierra" alone reads as Sierra College.
    h += '<section class="cb-assist"><header><h3>Sierra AI</h3>'
      + '<span class="cb-tag">Answers come from the CPL Initiative records and knowledge base.</span></header>'
      + '<div class="cb-assist-pick" id="cb-assist-pick"></div>'
      + (state.college ? '<div class="cb-asks" id="cb-asks"></div>' : "")
      + '<div class="cb-assist-mount" id="cb-assistant-mount"></div>'
      + "</section>";

    if (state.error) h += '<div class="cb-warn">Could not load everything: ' + esc(state.error) + ". Figures below may be incomplete — treat a missing number as unknown, not zero.</div>";

    var b = state.data && state.data.briefing;
    if (!b) { finish(root, h, null); return; }

    if (b.unread && b.unread.length) {
      h += '<div class="cb-warn"><b>' + b.unread.length + " funding program" + (b.unread.length === 1 ? "" : "s") + " not read.</b><ul style=\"margin:6px 0 0 18px;\">" +
        b.unread.map(function (u) { return "<li>" + esc(u.label || u.id) + " — " + esc(u.why) + "</li>"; }).join("") +
        "</ul></div>";
    }

    if (!state.college) {
      h += '<div class="cb-note">Choose a college to see where it stands against the ' + esc(b.strategyTotal) +
        " strategies the team has written for " + esc(b.scenario) + ", Year " + esc(b.year) + ".</div>";
      // A district was picked but no college yet — show the district's colleges
      // and the one figure that matters, so a district office has somewhere to
      // start. Ordered ALPHABETICALLY, never by the figure: this is a list of
      // work to do, not a league table.
      if (state.district && dIdx && dIdx[state.district]) {
        h += '<h3 class="cb-h">' + esc(state.district) + "</h3>";
        h += '<table class="cb-dist"><colgroup><col style="width:52%"><col style="width:24%"><col style="width:24%"></colgroup>'
          + "<thead><tr><th>College</th><th>Articulated, waiting</th><th>CPL students</th></tr></thead><tbody>";
        dIdx[state.district].slice().sort().forEach(function (n) {
          var s = state.data.summaryByName && state.data.summaryByName[n];
          var waiting = s && !s.suppressed ? fmt(num(s.articulated_waiting)) : (s && s.suppressed ? "withheld" : "—");
          var stu = s && !s.suppressed ? fmt(num(s.students)) : (s && s.suppressed ? "&lt;10" : "—");
          h += '<tr><td><button type="button" class="cb-pick" data-college="' + esc(n) + '">' + esc(n) + "</button></td>"
            + '<td class="n">' + waiting + '</td><td class="n">' + stu + "</td></tr>";
        });
        h += "</tbody></table>";
        h += '<div class="cb-note">“Withheld” means fewer than 10 CPL students, not zero activity. '
          + "A dash means this college is not in the credit summary at all — an absent figure, which is not the same as a measured zero.</div>";
      }
      finish(root, h, null); return;
    }

    if (b.leads.length) {
      h += "<h3 style=\"margin:0 0 8px;font-size:1rem;\">Start here</h3>";
      b.leads.forEach(function (l) {
        h += '<div class="cb-lead"><h4>' + esc(l.item.text) + '</h4><div class="cb-num">' + esc(l.item.measure.headline) + "</div>" +
          (l.item.measure.detail ? '<div class="cb-d">' + esc(l.item.measure.detail) + "</div>" : "") + "</div>";
      });
    }

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
      h += '<h3 class="cb-h">Your tier on the systemwide dashboard</h3>';
      h += '<div class="cb-note" style="margin-top:-4px">Every college is placed in one of three tiers by the same '
        + "five criteria: <b>Leading</b> meets three or more, <b>Advancing</b> one or two, <b>Inactive</b> has "
        + "essentially no CPL recorded. The five count students, eligible units, units per student, and how much "
        + "of that credit is <b>marked transcribed in MAP</b>.</div>";
      h += '<div class="cb-tier">';
      if (ts.mismatch) {
        h += "<p><b>" + esc(ts.label) + "</b> — " + ts.met + " of " + ts.total + " criteria met. The individual "
          + "criteria do not reconcile with that published count here, because the transcription rate is "
          + "published rounded and a borderline college can fall either side of it. Rather than show you a list "
          + "that disagrees with the figure above it, we are holding the list back.</p>";
      } else if (ts.tier === "inactive") {
        h += "<p><b>Inactive</b> is assigned when a college has almost no CPL recorded in MAP at all — fewer than "
          + "ten students and no eligible units — rather than by counting the five criteria. It reflects what has "
          + "been <b>recorded</b>, so if CPL is happening here it is not reaching MAP, and that is the thing to "
          + "fix first.</p>";
      } else {
        var mets = ts.met_list, miss = ts.missing;
        h += "<p><b>" + esc(ts.label) + "</b> — ";
        if (mets.length) {
          h += "you meet <b>" + ts.met + " of the " + ts.total + "</b> criteria: "
            + mets.map(function (c) {
                return "at least " + esc(c.short) + " <em>(you: " + esc(c.actual) + ")</em>"; }).join("; ");
        } else {
          // "you meet 0 of the 5" is arithmetic, not a sentence.
          h += "you do not yet meet any of the five";
        }
        h += ".</p>";
        if (miss.length) {
          h += "<p>" + (miss.length === 1 ? "The one you have not reached" : "The " + miss.length
              + " you have not reached, <b>closest first</b>") + ": "
            + miss.map(function (c) {
                return "at least " + esc(c.short) + " <em>(you: " + esc(c.actual) + ")</em>"; }).join("; ")
            + ".</p>";
        } else {
          h += "<p>There is nothing left to reach on this scale — you meet all five.</p>";
        }
      }
      h += "</div>";
      h += '<div class="cb-note" style="margin-top:10px">Two things to hold alongside it. <b>Three of the five are '
        + "size measures</b>, so a small college cannot reach them however well it runs CPL — that is a limit of "
        + "the scheme, not a judgment on you. And the other two count units <b>marked transcribed in MAP</b>, "
        + "which is your own step and entirely within your control — but it also means colleges that batch-upload "
        + "already-posted credit (AP, IB, CLEP) score on them for reasons unrelated to how much CPL they award. "
        + "<b>So this is a checklist for you, never a ranking against anyone else.</b></div>";
    }

    if (st && st.eligible != null) {
      var pctApplied = st.eligible > 0 && st.applied != null ? (st.applied / st.eligible) : null;
      h += '<h3 class="cb-h">Where you stand</h3>';
      h += '<div class="cb-stand">';
      h += standBox(fmt(st.articulatedWaiting), "of " + fmt(st.eligible) + " units",
        "<b>Already articulated, waiting on a decision.</b> The agreement exists and the credit is mapped — only the award is missing. This is the cheapest credit you will ever give a student.",
        st.eligible > 0 ? (st.articulatedWaiting || 0) / st.eligible : 0, "lead");
      h += standBox(fmt(st.applied), "units applied",
        "Credit you have put on a student record — the measure the funding formula rewards.",
        pctApplied, "");
      h += standBox(fmt(st.transcribed), "units marked transcribed",
        "Marked as transcribed <b>in MAP</b> — your record-keeping step, not the posting itself. You forward the "
        + "student's CPL plan to Admissions &amp; Records, who enter the credit in your own student system; there is "
        + "no automatic link between MAP and that system. <b>Never compare this across colleges</b> — some batch-upload "
        + "credit that was already posted (AP/IB/CLEP), so it reflects record-keeping practice as much as outcomes.",
        st.eligible > 0 && st.transcribed != null ? st.transcribed / st.eligible : null, "");
      h += standBox(fmt(st.students), "CPL students",
        "Students at this college with prior learning in MAP. Their credit is what every number here is made of.",
        null, "");
      h += "</div>";
    } else if (summary && summary.suppressed) {
      h += '<div class="cb-note">This college has fewer than 10 CPL students, so its figures are withheld. '
        + 'Activity exists — the numbers are not published at that size, to protect student privacy.</div>';
    }

    // ── What the waiting credit is ────────────────────────────────────────
    // Explains the lead figure directly above it. Placed here, not lower down,
    // because "63,991 units already articulated" invites a coordinator to
    // imagine 300 judgment calls when it is very nearly one repeated decision.
    var wb = waitingBreakdown(state.detail, summary);
    if (wb && !wb.suppressed && !wb.empty) {
      h += '<h3 class="cb-h">What that waiting credit actually is</h3>';
      h += '<div class="cb-note" style="margin-top:0">These add up to the <b>' + fmt(Math.round(wb.total))
        + " units</b> in the first box above — same credit, broken out by what it would count toward.</div>";
      h += '<div class="cb-wait">';
      wb.groups.forEach(function (g) {
        var p = safePct(g.share, 1);
        h += '<div class="cb-wrow"><div class="cb-whead"><b>' + esc(g.label) + "</b>"
          + '<span class="v">' + fmt(Math.round(g.units)) + " units · " + p + "%</span></div>"
          + '<div class="cb-bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>';
        if (g.top.length) {
          h += '<div class="cb-wrecs">Counts toward: '
            + g.top.map(function (t) {
                return esc(t.name) + " <span>(" + fmt(Math.round(t.units)) + ")</span>"; }).join(" · ")
            + "</div>";
        }
        h += "</div>";
      });
      h += "</div>";
      if (wb.militaryShare >= 0.6) {
        var allMil = wb.militaryShare >= 1;
        h += '<div class="cb-note cb-good"><b>' + (allMil ? "All" : safePct(wb.militaryShare) + "%")
          + " of it is credit for basic military service.</b> That is the good news on this page: it is not "
          + "hundreds of separate judgment calls, it is " + (allMil ? "" : "close to ")
          + "<b>one decision applied repeatedly</b> — you have "
          + "already articulated the exhibit, and every one of these students has a DD-214 or JST on file. "
          + "Statewide the pattern is the same: <b>98.8%</b> of all waiting credit is basic military service, and "
          + "65 of the 73 colleges with any are at 100%.</div>";
      }
    } else if (wb && wb.suppressed) {
      h += '<h3 class="cb-h">What that waiting credit actually is</h3>';
      h += '<div class="cb-note" style="margin-top:0">Withheld — this college has fewer than 10 CPL students, so its '
        + "figures are not published at that size. Breaking a withheld total into its parts would give back exactly "
        + "what withholding it removed.</div>";
    } else if (wb && wb.empty) {
      h += '<h3 class="cb-h">What that waiting credit actually is</h3>';
      h += '<div class="cb-note" style="margin-top:0"><b>Nothing is waiting.</b> Every credit recommendation with an '
        + "articulated exhibit behind it has been acted on. That is a finished queue, not a missing measurement — "
        + "33 of the 106 colleges are in this position, including some of the largest CPL programmes in the state.</div>";
    }

    // ── By CPL type ───────────────────────────────────────────────────────
    var types = byCplType(state.detail);
    if (types) {
      h += '<h3 class="cb-h">By CPL type</h3>';
      h += '<div class="cb-note cb-floor">⚠ <b>Read the student counts carefully.</b> A credential name can be '
        + 'attached to only about 4% of student records statewide, so a low count here means <b>we cannot see it</b>, '
        + 'not that the programme is inactive. The credential counts beside them come from the curated catalogue and '
        + 'are complete.</div>';
      h += '<div class="cb-types">';
      types.forEach(function (t) { h += typeBox(t); });
      h += "</div>";
    }

    // ── Your funding ──────────────────────────────────────────────────────
    // Two appropriations, kept visibly apart. Neither figure is derived here.
    var f = fundingFor(state.college);
    h += '<h3 class="cb-h">Your funding</h3>';
    if (state.funding !== "ready" && state.funding !== "error") {
      h += '<div class="cb-note">Loading the funding model…</div>';
    } else if (state.funding === "ready" && !f) {
      h += '<div class="cb-note">Loading the funding model…</div>';
    } else if (state.funding === "error") {
      h += '<div class="cb-warn">The funding model did not load. That is a <b>failed read, not a finding</b> — '
        + "it does not mean this college has no allocation.</div>";
    } else if (f && !f.onRoster) {
      h += '<div class="cb-note">' + esc(state.college) + ' is not on the 115-college funding roster. '
        + "The noncredit institutions are funded through the $1M noncredit carve-out, a separate mechanism from the "
        + "college pool below — so this is <b>a different route to money, not an absence of it</b>.</div>";
    } else if (f) {
      // (a) the $50,000 ESS 25-82 seed grant — already distributed
      h += '<div class="cb-fund">';
      h += '<div class="cb-fbox"><header><h4>2025&ndash;2026 $50K Seed Funding</h4><span class="cb-tag">ESS 25-82 · distributed Spring 2026</span></header>';
      if (f.grant.declined) {
        h += '<div class="cb-fbig">Declined</div><div class="cb-lab">This college declined the grant pending further review. '
          + "That is a decision on record, not a missed payment.</div>";
      } else {
        h += '<div class="cb-fbig">' + money(f.grant.amount) + "</div>"
          + '<div class="cb-lab">Received. Must be fully expended by <b>June 30, 2028</b>. '
          + "It was directed at the three priority outcomes below — progress on them is tracked through MAP, "
          + "as ESS 25-82 specifies. <b>These are not a compliance determination.</b></div>";
      }
      var ess = essProgress(f, state.detail, window.CPL_FUNDING_ESS);
      if (ess) {
        h += '<ol class="cb-ess-list">';
        ess.forEach(function (e) {
          h += "<li>" + essMark(e.o) + "<div><b>" + esc(e.title) + "</b>";
          if (e.frac && e.frac.have != null) {
            h += '<div class="cb-num">' + e.frac.have + " articulated"
              + (e.frac.of ? " of the " + e.frac.of + " statewide credit recommendations in MAP" : "")
              + (e.frac.available ? " · <b>" + e.frac.available + " more</b> available to adopt" : "")
              + "</div>";
          }
          h += '<div class="cb-d">' + esc(e.o.why) + "</div>";
          if (e.next) h += '<div class="cb-d">' + e.next + "</div>";
          h += "</div></li>";
        });
        h += "</ol>";
      }
      h += "</div>";

      // (b) this college's share of the implementation pool. Sam, 2026-08-11:
      // use the funding tab's own names — "$35M" is his shorthand with the
      // session, not a label a college would recognise.
      h += '<div class="cb-fbox"><header><h4>2026&ndash;2028 College Implementation Funding</h4><span class="cb-tag">allocation cap</span></header>';
      if (!f.alloc) {
        h += '<div class="cb-lab">No allocation modelled for this college yet.</div>';
      } else {
        h += '<div class="cb-fbig">' + money(f.alloc.total) + "</div>";
        h += '<div class="cb-lab">This is a <b>cap, not a cheque</b> — the college earns against it on what MAP records it '
          + "doing. It is modelled, and the model is under active revision.</div>";
        var bits = [];
        if (f.alloc.floored) {
          bits.push("At the <b>" + money(f.floor) + " minimum-viable floor</b> — this college's proportional share came "
            + "out below the floor, so it is topped up to it. Its allocation is <b>not</b> its share of the pool.");
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
        if (bits.length) h += '<ul class="cb-flags"><li>' + bits.join("</li><li>") + "</li></ul>";

        // ── What the cap is FOR — the three priorities, each with this
        // college's own target. Caps and targets both come from the funding
        // module; nothing here multiplies a share by a pool.
        if (f.prios && f.prios.length) {
          h += '<div class="cb-prios"><div class="cb-plab">What it is earned against</div>';
          f.prios.forEach(function (p) {
            var name = p.title || p.description || p.label;
            h += '<div class="cb-prow"><div class="cb-whead"><b>' + esc(name) + "</b>"
              + '<span class="v">' + money(p.cap) + "</span></div>";
            h += '<div class="cb-ptarget">Your target: <b>'
              + (p.target != null ? fmt(Math.round(p.target * 10) / 10) + " " + esc(p.unit) : "—")
              + "</b>" + (p.metric ? " · " + esc(p.metric) : "") + "</div>";
            h += "</div>";
          });
          h += "</div>";
          h += '<div class="cb-lab" style="margin-top:8px;">A target is what earns the <b>whole</b> share, not a '
            + "pass mark — partial progress earns a proportional part of it, so there is no cliff to miss.</div>";
        }
      }
      h += "</div></div>";

      // ── Do this next, per pool ──────────────────────────────────────────
      // The steps come from the team's own strategies, not from this page.
      var nextSeed = nextEssOutcome(ess);
      var nextImpl = topStrategy(b);
      if (nextSeed || nextImpl) {
        h += '<div class="cb-next"><div class="cb-plab">Do this next</div><ul>';
        if (nextSeed) {
          h += "<li><b>For the seed funding:</b> " + esc(nextSeed.title)
            + " — the outcome with the most ground still to cover.</li>";
        }
        if (nextImpl) {
          h += "<li><b>For the implementation funding:</b> " + esc(nextImpl.text)
            + " — the team's first strategy under " + esc(nextImpl.priority) + ".</li>";
        }
        h += "</ul></div>";
      }

      h += '<div class="cb-note">Both figures come from the Implementation Funding tab\'s model, not from this page — '
        + "open it for the full derivation and the year split.</div>";
    }

    // ── Course share — absorbed from the retired Course Credit tab ────────
    var cs = courseShare(state.detail && state.detail.goal2);
    if (cs) {
      h += '<h3 class="cb-h">Of the credit you have already awarded</h3>';
      if (cs.share == null) {
        h += '<div class="cb-note">Some cells are withheld for this college, so the course share is not published — '
          + 'publishing it alongside a hidden cell would hand back what suppression removed.</div>';
      } else {
        h += '<div class="cb-note"><b>' + (Math.round(cs.share * 1000) / 10).toFixed(1) + '%</b> of the credit this '
          + 'college has <b>already awarded</b> landed on a real course rather than a generic elective or a GE area — '
          + 'across ' + fmt(cs.awarded) + ' awarded rows.'
          + (st && st.eligible != null
              ? ' It says nothing about the <b>' + fmt(st.eligible) + ' units still waiting</b>, which is the number to act on.'
              : '')
          + (cs.share >= 1 ? ' <b>100% here does not mean finished</b> — it means everything awarded so far went to a course.' : '')
          + "</div>";
      }
    }

    // ── Advice — the team's strategies, demoted below the steps ───────────
    if (b.programs.length) {
      h += '<h3 class="cb-h">Advice from the team\'s funding plan</h3>';
      h += '<div class="cb-note">These are written by the team, not by this page. '
        + esc(b.measuredTotal) + ' of ' + esc(b.strategyTotal) + ' carry a measurement; the rest are advice, '
        + 'shown without a score rather than as an unticked box.</div>';
    }

    b.programs.forEach(function (p) {
      h += '<div class="cb-prog"><h3>' + esc(p.label) + "</h3>";
      p.priorities.forEach(function (pr) {
        // The pot share is deliberately NOT shown. "50% of the pot" is state
        // allocation logic — true, and nothing a coordinator can act on. Sam,
        // 2026-08-10: "we tend to get buried in rationale rather than just
        // telling them the simple steps."
        h += '<div class="cb-pri"><h4>' + esc(pr.title || pr.description || "Priority " + (pr.index + 1)) + "</h4>";
        h += '<div class="cb-meta">' + [pr.metric ? "Measured as: " + esc(pr.metric) : null].filter(Boolean).join(" · ");
        if (pr.title && pr.description) h += "<br>" + esc(pr.description);
        h += "</div>";
        pr.items.forEach(function (i) { h += itemHtml(i); });
        h += "</div>";
      });
      h += "</div>";
    });

    // ── Who MAP has on file ───────────────────────────────────────────────
    var roster = contactRoster(state.data && state.data.raw && state.data.raw.contactRowByName
      && state.data.raw.contactRowByName[state.college]);
    if (roster) {
      h += '<h3 class="cb-h">Who MAP has on file for you</h3>';
      h += '<div class="cb-note" style="margin-top:0">This is what MAP shows today. <b>The primary contact is where a '
        + "student's CPL request from your landing page is sent</b> — if that is wrong, the request reaches nobody. "
        + "Update these in MAP; this page reflects whatever is there.</div>";
      h += '<table class="cb-dist cb-roster"><colgroup><col style="width:30%"><col style="width:31%"><col style="width:39%"></colgroup>'
        + "<thead><tr><th>Role</th><th>Name</th><th>Email</th></tr></thead><tbody>";
      roster.filled.forEach(function (r) {
        h += "<tr" + (r.lead ? ' class="lead"' : "") + "><td>" + esc(r.label) + "</td><td>"
          + esc(r.name || "—") + "</td><td>" + esc(r.email || "—") + "</td></tr>";
      });
      h += "</tbody></table>";
      if (roster.blank.length) {
        h += '<div class="cb-note">Not filled in: <b>'
          + roster.blank.map(function (r) { return esc(r.label); }).join("</b>, <b>") + "</b>. "
          + "Blank is not a problem in itself — but a blank primary contact means student requests have nowhere to land.</div>";
      }
      if (roster.landing) {
        h += '<div class="cb-note">Your CPL landing page: <a href="' + esc(roster.landing)
          + '" target="_blank" rel="noopener">' + esc(roster.landing) + "</a></div>";
      }
    }

    h += resourcesHtml();

    h += '<div class="cb-note">Nothing here is irreversible, and a recommendation ruled Not Applicable can be revisited — '
      + 'ruling one is real work, not a failure. Strategies come from the team’s funding configuration ('
      + esc(b.scenario) + ", Year " + esc(b.year) + "); edit them there and they change here. "
      + "Student figures are withheld below 10 CPL students, to protect student privacy.</div>";

    finish(root, h, st);
  }

  /* Every exit path from render() goes through here, so the Sierra AI box is
   * assembled once: pickers relocated into it, suggested questions built from
   * this college's own figures, and the shared assistant mounted. */
  function finish(root, h, st) {
    root.innerHTML = h;
    // The pickers move INSIDE the Sierra AI box (Sam: "put all the college
    // selectors in the CPL Assistant box for simplicity"). They are built in
    // the main string, then relocated, so the bar markup stays in one place.
    var pickHost = root.querySelector("#cb-assist-pick"), bar = root.querySelector(".cb-bar");
    if (pickHost && bar) pickHost.appendChild(bar);
    var asks = root.querySelector("#cb-asks");
    if (asks && state.college) {
      asks.innerHTML = sierraQuestions(state.college, state.detail, st || null)
        .map(function (q) { return '<button type="button" class="cb-ask" data-q="' + esc(q) + '">' + esc(q) + "</button>"; })
        .join("");
    }
    mountAssistant(root);
    wire(root);
  }

  function selectCollege(name, root) {
    state.college = name || null;
    state.detail = null; state.detailFor = null; state.detailError = null;
    recompute(); render(root);
    if (state.college) {
      loadCollege(state.college, root);
      loadFunding(root);
    }
  }

  function wire(root) {
    var c = root.querySelector("#cb-college"), r = root.querySelector("#cb-role"),
        d = root.querySelector("#cb-district");
    if (c) c.onchange = function () { selectCollege(c.value, root); };
    if (r) r.onchange = function () { state.role = r.value; render(root); };
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
    Array.prototype.forEach.call(root.querySelectorAll(".cb-pick"), function (b) {
      b.onclick = function () { selectCollege(b.getAttribute("data-college"), root); };
    });
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
   * ESS outcomes would sit on "⏳ not loaded yet" forever. */
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
    try { C.mountInto(host); return true; } catch (e) { return false; }
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
      jget(REST + "/map_colleges?select=college_id,college_name&order=college_name"),
      jget(REST + "/map_college_credit_summary?select=*"),
      jget(REST + "/map_college_contacts?select=college,primary_contact,primary_contact_email,cpl_coordinator,cpl_coordinator_email,cpl_counselor,cpl_counselor_email,articulation_officer,articulation_officer_email,faculty_lead,faculty_lead_email,certifying_official,certifying_official_email,vpaa,vpaa_email,vpss,vpss_email,landing_page_url,last_updated_on")
    ]).then(function (res) {
      var cfgRow = res[0] && res[0][0], colleges = res[1] || [], summary = res[2] || [], contacts = res[3] || [];
      var nameToId = {}, names = [];
      colleges.forEach(function (r) { nameToId[r.college_name] = r.college_id; names.push(r.college_name); });
      var summaryById = {};
      summary.forEach(function (r) { summaryById[r.college_id] = r; });
      var contactByName = {}, contactRowByName = {};
      contacts.forEach(function (r) {
        contactByName[r.college] = r.primary_contact_email || null;
        contactRowByName[r.college] = r;
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
    _nextEssOutcome: nextEssOutcome,
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
