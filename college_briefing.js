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
    detail: null, detailFor: null, detailLoading: false, detailError: null
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
        return {
          headline: fmt(tr) + " of " + fmt(applied) + " applied units transcribed (" + p + "%)",
          detail: p >= 100
            ? "Every applied unit has been transcribed."
            : fmt(applied - tr) + " applied units have not reached the transcript yet.",
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
      ".cb-opp em{font-style:normal;color:var(--text-strong);font-weight:600;}"
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
         + "&select=dest,rows_n,students,suppressed,reason", { headers: h })
    ]).then(function (r) {
      state.detail = { rollup: r[0] || [], adopted: r[1] || [], potential: r[2] || [], goal2: r[3] || [] };
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
    var h = '<div class="cb-bar"><div><label for="cb-college">College</label><select id="cb-college"><option value="">Choose a college…</option>' +
      names.map(function (n) { return '<option value="' + esc(n) + '"' + (n === state.college ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") +
      '</select></div><div><label for="cb-role">Your role</label><select id="cb-role">' +
      ROLES.map(function (r) { return '<option value="' + r.id + '"' + (r.id === state.role ? " selected" : "") + ">" + esc(r.label) + "</option>"; }).join("") +
      "</select></div></div>";

    if (state.error) h += '<div class="cb-warn">Could not load everything: ' + esc(state.error) + ". Figures below may be incomplete — treat a missing number as unknown, not zero.</div>";

    var b = state.data && state.data.briefing;
    if (!b) { root.innerHTML = h; wire(root); return; }

    if (b.unread && b.unread.length) {
      h += '<div class="cb-warn"><b>' + b.unread.length + " funding program" + (b.unread.length === 1 ? "" : "s") + " not read.</b><ul style=\"margin:6px 0 0 18px;\">" +
        b.unread.map(function (u) { return "<li>" + esc(u.label || u.id) + " — " + esc(u.why) + "</li>"; }).join("") +
        "</ul></div>";
    }

    if (!state.college) {
      h += '<div class="cb-note">Choose a college to see where it stands against the ' + esc(b.strategyTotal) +
        " strategies the team has written for " + esc(b.scenario) + ", Year " + esc(b.year) + ".</div>";
      root.innerHTML = h; wire(root); return;
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
      h += standBox(fmt(st.transcribed), "units transcribed",
        "Written onto the transcript. <b>Never compare this across colleges</b> — some batch-upload already-transcribed AP/IB/CLEP credit, so it measures recording practice as much as outcomes.",
        st.eligible > 0 && st.transcribed != null ? st.transcribed / st.eligible : null, "");
      h += standBox(fmt(st.students), "CPL students",
        "Students at this college with prior learning in MAP. Their credit is what every number here is made of.",
        null, "");
      h += "</div>";
    } else if (summary && summary.suppressed) {
      h += '<div class="cb-note">This college has fewer than 10 CPL students, so its figures are withheld. '
        + 'Activity exists — the numbers are not published at that size, to protect student privacy.</div>';
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

    h += '<div class="cb-note">Nothing here is irreversible, and a recommendation ruled Not Applicable can be revisited — '
      + 'ruling one is real work, not a failure. Strategies come from the team’s funding configuration ('
      + esc(b.scenario) + ", Year " + esc(b.year) + "); edit them there and they change here. "
      + "Student figures are withheld below 10 CPL students, to protect student privacy.</div>";

    root.innerHTML = h;
    wire(root);
  }

  function wire(root) {
    var c = root.querySelector("#cb-college"), r = root.querySelector("#cb-role");
    if (c) c.onchange = function () {
      state.college = c.value || null;
      state.detail = null; state.detailFor = null; state.detailError = null;
      recompute(); render(root);
      if (state.college) loadCollege(state.college, root);
    };
    if (r) r.onchange = function () { state.role = r.value; render(root); };
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
      jget(REST + "/map_college_contacts?select=college,primary_contact_email")
    ]).then(function (res) {
      var cfgRow = res[0] && res[0][0], colleges = res[1] || [], summary = res[2] || [], contacts = res[3] || [];
      var nameToId = {}, names = [];
      colleges.forEach(function (r) { nameToId[r.college_name] = r.college_id; names.push(r.college_name); });
      var summaryById = {};
      summary.forEach(function (r) { summaryById[r.college_id] = r; });
      var contactByName = {};
      contacts.forEach(function (r) { contactByName[r.college] = r.primary_contact_email || null; });
      var summaryByName = {};
      names.forEach(function (n) { summaryByName[n] = summaryById[nameToId[n]] || null; });
      state.data = {
        colleges: names,
        nameToId: nameToId,
        summaryByName: summaryByName,
        raw: { config: (cfgRow && cfgRow.config) || {}, nameToId: nameToId, summaryById: summaryById, contactByName: contactByName }
      };
      if (!res[0]) state.error = "the funding configuration did not load";
      recompute();
      return state.data;
    });
  }

  function activate() {
    var root = document.getElementById("college-briefing-root");
    if (!root) return;
    if (state.data && state.loadedSignedIn === signedIn()) { render(root); return; }
    if (!signedIn()) { state.data = null; render(root); return; }
    state.loading = true; render(root);
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
    _byCplType: byCplType,
    _standing: standing,
    _measureFor: measureFor,
    _state: state,
    _SCENARIO: SCENARIO,
    _YEAR: YEAR
  };

  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "college-briefing") activate();
  });
})();
