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

  var state = { college: null, role: "any", data: null, loading: false, error: null, loadedSignedIn: null };

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
      ".cb-note{font-size:.78rem;color:var(--text-muted);margin-top:18px;line-height:1.5;}"
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

    b.programs.forEach(function (p) {
      h += '<div class="cb-prog"><h3>' + esc(p.label) + "</h3>";
      p.priorities.forEach(function (pr) {
        var share = pr.share != null ? Math.round(pr.share * 100) + "% of the pot" : null;
        h += '<div class="cb-pri"><h4>' + esc(pr.title || pr.description || "Priority " + (pr.index + 1)) + "</h4>";
        h += '<div class="cb-meta">' + [share, pr.metric ? "Measured as: " + esc(pr.metric) : null].filter(Boolean).join(" · ");
        if (pr.title && pr.description) h += "<br>" + esc(pr.description);
        h += "</div>";
        pr.items.forEach(function (i) { h += itemHtml(i); });
        h += "</div>";
      });
      h += "</div>";
    });

    h += '<div class="cb-note">Strategies come from the team’s own funding configuration (' + esc(b.scenario) + ", Year " + esc(b.year) +
      "), not from this page — edit them there and they change here. " + esc(b.measuredTotal) +
      " of " + esc(b.strategyTotal) + " have a measurement today; the rest are advice, shown without a score rather than as an unticked box. " +
      "Figures are suppressed for colleges with fewer than 10 CPL students.</div>";

    root.innerHTML = h;
    wire(root);
  }

  function wire(root) {
    var c = root.querySelector("#cb-college"), r = root.querySelector("#cb-role");
    if (c) c.onchange = function () { state.college = c.value || null; recompute(); render(root); };
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
      state.data = {
        colleges: names,
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
    _measureFor: measureFor,
    _state: state,
    _SCENARIO: SCENARIO,
    _YEAR: YEAR
  };

  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "college-briefing") activate();
  });
})();
